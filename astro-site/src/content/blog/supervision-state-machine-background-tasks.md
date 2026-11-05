---
title: 'A Supervision State Machine for Long-Running Background Tasks'
description: 'Background jobs that run for minutes, pause for human answers, and survive restarts need more than a status column. A design for pausable, resumable, auditable background work: explicit states, a question channel, generation gates, and append-only logs.'
pubDate: 2024-02-27
series: 'Algorithm Implementations'
seriesOrder: 7
categories: [algorithms]
tags: [state-machines, background-jobs, postgres, reliability, design]
heroImage: /assets/img/posts/supervision-state-machine-background-tasks/thumbnail.png
heroAlt: 'A Supervision State Machine for Long-Running Background Tasks'
---

Most background-job systems are designed around the assumption that a job is a function call: enqueue, run, finish, maybe retry. The moment a job can run for tens of minutes, needs to *ask a human a question mid-run*, must survive a deploy mid-execution, and has to be auditable afterward — you've left that territory. This post is a design for that harder problem: a supervision layer with an explicit state machine, a question channel, and a few load-bearing invariants.

## The state machine

States and their meanings:

```
pending → running → parked ⇄ running → completed | failed | expired
```

- **pending** — created, not yet claimed.
- **running** — claimed by a worker, executing.
- **parked** — suspended at a known checkpoint, waiting on something (usually a human answer or a pause request). Not failed; exactly resumable.
- **completed / failed / expired** — terminal. Never re-entered.

Two rules hold the machine together:

1. **Every transition is atomic.** Each state change happens inside `session.begin()` with `SELECT ... FOR UPDATE` on the task row. A worker that crashes between "read state" and "write state" simply never completes the transaction — the row shows the old state, and the orphan watchdog (heartbeat-based, as in any scheduler) reaps it. There is no observed-but-not-committed window for a competing worker to exploit.
2. **A parked task must always say why.** A nullable `watchdog_stop_reason` accompanies the state: `awaiting_user_answer:{guard_name}`, `user_paused`, `expired:{prior_reason}`. A `parked` row with a NULL reason is an alarm — the invariant is enforced by tests rather than a CHECK constraint, because reasons are open-ended strings. (In practice: `CHECK` constraints are for closed sets; a convention plus a test is for extensible vocabularies.)

A third field, `generation` (default 1), increments on every externally visible mutation. More on it below.

## The question channel: ask without answering

The hardest requirement: a running job needs a human decision *now*, but the human answers in ten minutes. The design splits "ask" from "answer" into two operations that share only a table, never a return value:

**Asking** is a single atomic sequence — `FOR UPDATE` the task, insert a pending question row, flip the task to `parked` with the stop reason, append a log entry, flush for ids, then raise a control-flow exception:

```python
async def ask(task_id, question_key, question_data):
    async with session.begin():
        task = await lock_task(task_id)          # SELECT ... FOR UPDATE
        question = BackgroundTaskQuestion(
            task_id=task_id, question_key=question_key,
            question_data=question_data, status="pending",
            expires_at=now() + QUESTION_TTL,
        )
        session.add(question)
        task.current_state = "parked"
        task.watchdog_stop_reason = f"awaiting_user_answer:{question_key}"
        session.add(log_entry(task_id, "question_asked", ...))
        await session.flush()                    # ids materialized
    raise QuestionAsked(question.id)             # control flow, not an error value
```

The `raise` matters. The worker's stack unwinds completely — no dangling coroutine holding resources, no "paused generator" to leak. `QuestionAsked` is control flow, caught at the runner boundary, which records "parked at this point" and returns the worker to the pool.

**Parking state is durable.** Before the ask, the checkpoint writes `locked_decisions` (current node, accumulated bindings, visited set, run id) into the task row. This is the cold-resume contract: *any* worker, on any process, can reconstruct execution from the row alone. No module-level cache, no in-memory continuation, no framework checkpointing — a second executor given only `sessionmaker + task_id` is provably equivalent to the first. If your resume path reads anything that lives in process memory, it will work in tests and die in production.

**Answering** is a separate, equally atomic, operation: `FOR UPDATE` the question, verify still pending, write the answer with actor and timestamp, flip to `answered`, append a log entry, commit. Then — and only after the answer is durable — trigger resume. If resume loses the race (another path already resumed the task), the `ValueError` is swallowed: **the answer is durable regardless of who won the race**, which is the correct priority.

The schema enforces the load-bearing invariant: a `CHECK` constraint requires that `status='answered'` implies non-null answer text *and* answer timestamp. A question marked answered with no answer is a corruption class that should be impossible by construction, not detectable by audit.

## Pause is a request, not a state flip

A user clicking "pause" cannot teleport the worker out of its current step — it might be mid-write. So pause is a *request*: set `pause_requested_at`, leave `current_state` untouched. The worker observes the flag at its next `checkpoint()` (between steps), transitions to `parked` with reason `user_paused`, and logs. The API always reports "pausing after the current step", never "paused" — honest about the asynchrony, and safe under any worker latency.

Resume is a **claim**, symmetric to work-claiming in a queue: `FOR UPDATE`, verify state is `parked`, flip to `running`, release the lock, then drive the body forward from the durable checkpoint. Losers of the claim get a 409. This prevents the double-drive: two concurrent resumes both walking the same task's body.

The symmetry is worth noticing: *claim* semantics (compare-and-swap under lock, loser gets told) appear for dispatch, for resume, and for answering. Long-running-state coordination is mostly the same two lines of SQL repeated at every decision point.

## Expiry: single-clock ruling

Tasks and questions expire. The ruling that prevents an entire bug class: **compare against database time, in SQL** — `WHERE expires_at < now()` evaluated by Postgres, not `datetime.now()` fetched into Python. Application servers disagree with each other and with the database by seconds; a Python-computed cutoff means "expired" is a different predicate on every replica. One clock (the data store's) or none.

An expiry sweep flips rows to `expired` with a reason that preserves the prior stop reason (`expired:awaiting_user_answer:{guard}`), logs per task, and — the important posture — **never auto-proceeds**. Expiry is terminal; the body refuses to resume an expired task. A task that asks a human, gets no answer, and *guesses* is worse than no task at all.

## The generation gate

Distributed systems with optimistic UIs have a stale-client problem: a dashboard loaded five minutes ago shows a parked task that has since been answered and resumed; the user clicks "pause" against a state that no longer exists. The fix is a compare-and-swap on `generation`:

```python
UPDATE tasks
SET current_state = 'running', generation = generation + 1
WHERE id = $1 AND generation = $2           -- the client's expected generation
RETURNING *;
```

Zero rows returned → someone else mutated first → 409 Conflict. Every mutation endpoint takes `expected_generation`; the server only ever increments. Clients naturally re-fetch on 409. This is the same compare-and-swap discipline as the resume claim, generalized to all task mutations — and it costs one integer column.

## Auditing: append-only logs with honest truncation

Two properties matter for the audit trail:

**Append-only, enforced structurally.** `REVOKE` doesn't work (the table owner bypasses it); a `BEFORE UPDATE OR DELETE` trigger raising an exception does. Log entries carry a per-task `sequence_num` (unique, monotonically increasing) so the trail is totally ordered even under concurrent writers.

**Bounded disclosure, never silent.** A task with ten thousand log entries can't dump them into an API response. The projection returns the newest *page* with real counts:

```python
{
  "returned_count": 50,
  "total_count": 10423,
  "withheld_count": 10373,
  "truncated": true,
  "entries": [...]   # newest page, reversed to chronological for display
}
```

`truncated: true` plus an exact `withheld_count` (from a real `COUNT(*)`, not an estimate) means the response never silently drops entries. "You are not seeing everything, here is exactly how much" is the only honest truncation.

## Ownership: identical 404s

Every read/mutation loads the row, compares `owner_id` against the caller, and returns the same 404 for "does not exist" and "exists but not yours". Same status, same body shape. A foreign id that returns 403 or 404-with-different-shape confirms existence to an enumerator; an identical response does not.

## The design in one picture

```
                    ┌─────────── question asked (atomic: lock, insert, park, log) ──────────┐
                    │                                                                      ▼
  pending ──claim──▶ running ══checkpoint==▶ parked ──answer durable + claim──▶ running ──▶ completed
                    │  ▲           │                                              │
                    │  └───────────┴── pause_requested_at observed ──▶ parked      ▼
                    │                                                    (stop reason: user_paused)
                    └── crash ──▶ (heartbeat watchdog reaps)
  every mutation: expected_generation compare-and-swap, else 409
  every log: append-only trigger; reads: bounded, counted, truncation disclosed
```

## Takeaways

1. **Explicit states with an atomic transition each**, plus a mandatory stop reason on every park — a parked row without a reason is an alarm.
2. **Ask and answer are separate atomic operations sharing only a table**; the ask raises control-flow and parks; the answer is durable before resume is attempted.
3. **Cold-resume from the row only.** Any executor given `sessionmaker + task_id` must be able to continue; in-memory state is a test-only illusion.
4. **Pause is a request observed at checkpoints; resume is a claim.** Expiry compares in SQL on the database clock and never auto-proceeds.
5. **One integer `generation` column** turns every mutation into a compare-and-swap and retires the stale-client bug class.
6. **Logs are append-only by trigger**, and every bounded projection discloses exactly what it withheld.

Build a queue when jobs are calls. Build supervision when jobs are *conversations with reality* — and make the state machine boring enough that the interesting part is the work itself.
