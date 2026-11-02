---
title: 'Leader Election and Job Claiming with Postgres Advisory Locks'
description: 'How to run a distributed scheduler on a single table: advisory-lock leader election, SKIP LOCKED work claiming, semaphore-style concurrency caps, and heartbeat reaping.'
pubDate: 2023-10-03
categories: [algorithms]
tags: [postgres, distributed-systems, schedulers, advisory-locks, reliability]
---

A background scheduler — cron jobs, one-shot tasks, recurring reports — has a deceptively simple requirement: *exactly one worker should execute each job, even when there are many workers, and even when workers die mid-job*. Redis and a dedicated queue broker are the usual answers, but a surprising amount of this can be built directly on Postgres with three primitives: advisory locks, `SELECT ... FOR UPDATE SKIP LOCKED`, and heartbeats. This post is a tour of that design.

## The tick loop and leader election

The scheduler is a loop that wakes every *N* seconds and runs four phases: materialize due cron definitions, materialize due one-shot definitions, reap orphaned runs, and dispatch queued work. Running this loop on every replica would multiply every job; running it on a statically assigned replica forfeits failover. So: **elect a leader per tick, cheaply, with `pg_try_advisory_lock`.**

```sql
SELECT pg_try_advisory_lock($1);   -- session-scoped, returns true/false immediately
```

Key properties:

- **Try, don't block.** `pg_try_advisory_lock` never waits. If another replica holds the lock, this replica's tick is a no-op and it goes back to sleep. There is no lock queue, no convoy, no latency added to request-serving replicas.
- **Session scope, explicit release.** The lock survives across transactions (unlike row locks), which is exactly what a tick needs — each phase commits its own transaction, and the lock must still be held across phases. The holder calls `pg_advisory_unlock` explicitly on exit.
- **Fails open.** If the database blips, the tick logs and sleeps; the loop does not crash. A scheduler that dies silently is worse than one that runs late, so the worst case is always "this tick didn't happen".

Two failure modes worth naming: if the leader process is paused (GC, container freeze) for longer than the lock's implicit lifetime assumptions, another replica can acquire the lock and you get two leaders briefly — which is why every *claim* below is still atomic. Leader election narrows who dispatches; it does not replace atomic claiming.

## Materialization: turning schedules into runs

Schedules and runs are different tables on purpose. A `JobDefinition` holds the durable intent ("every weekday at 09:00 Europe/Sofia"); a `JobRun` holds one execution ("queued at 09:00:03, attempt 2"). Materialization converts the first into the second, once, using an idempotency marker: the definition's `next_run_at` is advanced **in the same transaction** as the run row insert. A crash between the two is impossible because they're one commit. The recurrence rule is parsed with `DTSTART` anchored in the definition's timezone — not UTC — because `BYHOUR=8` must mean 08:00 *local*, and that one detail is the difference between a report that arrives at standup time and one that arrives at lunch.

## Claiming work: SKIP LOCKED

Dispatch is the moment of truth — many claimers (the tick leader, ad-hoc "run now" requests, maybe a retry dispatcher) can be racing over the same `QUEUED` rows. The claiming query:

```sql
UPDATE job_runs
SET status = 'RUNNING', started_at = now()
WHERE id IN (
    SELECT id
    FROM job_runs
    WHERE status = 'QUEUED' AND scheduled_for <= now()
    ORDER BY scheduled_for
    LIMIT $1
    FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

`FOR UPDATE SKIP LOCKED` is the load-bearing phrase: rows already locked by a concurrent claimer are *skipped*, not waited on. Each claimer gets a disjoint slice with zero contention and zero double-claims. Two replicas can dispatch at the same instant and still never see each other's rows.

One deliberate overshoot: the candidate pool selects roughly `4 × batch_size` before the cap filter runs. Without the overshoot, one over-represented definition (hundreds of queued runs of the same job) sitting at the front of the order could crowd out everything else before per-job limits apply.

## Concurrency caps without a counter

Each definition has `max_concurrent_runs` — and it must hold **across replicas**, so an in-process counter is disqualified. Instead, the dispatcher counts live `RUNNING` rows in the same database the workers are updating:

```sql
SELECT definition_id, count(*)
FROM job_runs
WHERE status = 'RUNNING' AND definition_id = ANY($1)
GROUP BY definition_id;
```

The subtle part is *when* you read that count relative to the locks you hold. Concurrent dispatchers claiming different runs of the same definition must serialize against each other, or both read "2 running" with a cap of 3 and both claim, ending at 4. The serialization tool is again an advisory lock — transaction-scoped this time, keyed by definition id:

```sql
SELECT pg_advisory_xact_lock(hashtextextended('dispatch:' || definition_id, 0));
```

Two rules make this safe:

1. **Acquire in sorted order** (by definition id). Two dispatchers acquiring the same set of locks in different orders is textbook deadlock; a global sort order eliminates it.
2. **Read running counts after acquiring.** The advisory lock guarantees no concurrent dispatcher is mid-claim for this definition, so the count you read includes every commit that matters.

Definitions at their cap are skipped, not failed — their rows stay `QUEUED` for a later tick. Backpressure, not error.

## Heartbeats and the orphan watchdog

A `RUNNING` row is a promise; the promise needs a liveness signal. Every worker stamps `heartbeat_at` on a fixed cadence from a background task — importantly, **a failing heartbeat write must never kill the work it watches**. The heartbeat loop logs and continues.

The reaper looks for two orphan signatures, both as set-based `UPDATE`s (one query each, not per-row loops):

1. **Stale heartbeat**: `heartbeat_at < now() - heartbeat_timeout` → `FAILED`, reason `HeartbeatLost`.
2. **Never heartbeated**: `heartbeat_at IS NULL AND started_at < now() - orphan_timeout` → `FAILED`, reason `Orphaned` — the worker that claimed it died before its first heartbeat.

The never-heartbeated window should be generous. Slow-but-alive jobs (a big build, a long report) look identical to dead ones from the outside; the only defense is a timeout comfortably beyond the slowest legitimate heartbeat gap.

## Cancellation as a checkpoint

Cancellation is cooperative: the run row carries `cancel_requested`, and the worker calls a `checkpoint()` between steps. This is the only design that survives partial side effects — an uncooperative kill leaves "was the email sent?" unanswerable. A checkpoint that observes the flag raises, and mutating job kinds get a chance at best-effort compensation (marking partial writes) before the exception propagates to the runner, which stamps `cancelled`. Read-only kinds just propagate.

## Retries: new rows, not overwritten attempts

When a run fails and the retry policy allows another attempt, the system **inserts a new JobRun** with `attempt = n+1` and `scheduled_for = now + backoff`, and marks the old row `FAILED` — it does not rewrite the failed row in place. Three wins:

- **Audit trail**: every attempt, with its own logs and error, is preserved.
- **Backoff for free**: the dispatcher only claims rows whose `scheduled_for <= now`, so a future `scheduled_for` *is* the backoff delay. No timers, no delay queues.
- **The claim/dispatch machinery is reused**: a retry is just another queued row.

The retry policy itself is a small pair of allow/deny lists per job kind — a deny list checked first (some exceptions, like budget exhaustion, must never retry even though a broad allow-list would match), and the deny always wins when both match.

## The shape of the whole system

```
definitions ──materialize──▶ runs (QUEUED, scheduled_for)
runs ──SKIP LOCKED claim──▶ RUNNING ──heartbeat──▶ alive?
                                  │heartbeat lost ──▶ FAILED (orphaned)
                                  │success          ──▶ COMPLETED
                                  │failure+retry    ──▶ FAILED + new QUEUED row (backoff)
```

## Takeaways

1. `pg_try_advisory_lock` gives you per-tick leader election with no extra infrastructure; session scope + explicit release matches a multi-transaction tick.
2. `FOR UPDATE SKIP LOCKED` turns "who claims this row?" from a locking problem into a no-waiting slice. Oversample candidates so per-job caps can't starve the batch.
3. Enforce concurrency caps against **live DB counts**, serialized by per-definition advisory locks taken in sorted order — never in-process counters.
4. Heartbeats + set-based reaping detect death; cooperative checkpoints make cancellation safe; retries-as-new-rows give you audit, backoff, and machinery reuse for free.

The theme: the database you already have contains a work queue, a leader-election primitive, and a semaphore. The trick is knowing which lock flavor and which `SELECT` modifier to reach for.
