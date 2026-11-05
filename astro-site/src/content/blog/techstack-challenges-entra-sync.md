---
title: 'Techstack Challenges, Part 7: Syncing Users from Entra Without Losing Anyone'
description: An in-process cron scheduler with a generation token, a promise lock, and soft-delete reconciliation — plus the drift panel that turns destructive sync into a recoverable operation.
pubDate: 2025-09-23
updatedDate: 2025-09-23
categories:
  - software-engineering
  - security
tags:
  - entra-id
  - microsoft-graph
  - cron
  - nodejs
  - reconciliation
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 7
---

## Introduction

Part 7 of **Techstack Challenges**, following the [auth service design](/blog/techstack-challenges-auth-fails-closed/). That post covered how users sign in. This one covers how the user directory stays correct: a scheduled sync from Microsoft Entra ID that reconciles the local `users` table — inviting newcomers, updating roles, and soft-deleting the departed.

User sync sounds like a solved problem. It is, right up until you enumerate what "correct" means across deploys, restarts, API throttling, and reconfigurations mid-run. Each of those produced a real bug here, and each fix became a small, durable pattern.

## The scheduler: in-process, with a generation token

The sync runs on `node-cron` inside the auth service — no separate worker, no queue. The schedule itself lives in the database (`idp_settings`, a JSONB key-value table), editable by a super-admin, which means the schedule can change *while a sync is running*. That is the first trap.

The fix is a generation counter. Every schedule registration captures its generation; when a run finishes, it writes its result row only if its generation is still the active one:

```ts
if (active && active.generation === generation) { /* persist run record */ }
```

A reconfigure mid-run invalidates the abandoned run's write instead of letting a stale result overwrite the new configuration's state. It is a five-line pattern that eliminates an entire class of "who won?" races.

The second trap is overlap. Scheduled ticks and manual "sync now" clicks share one module-level promise (`withSyncLock`): if a run is active, the next claimant gets a typed `SyncBusyError`, which the scheduler catches and skips. No distributed lock — the documented caveat is that each replica schedules independently, and the upserts are idempotent, so overlap is tolerated rather than prevented. Honest caveat documented beats distributed lock deployed for a job that runs twice an hour.

## Talking to Graph: retries, pagination, and deliberate filtering

Fetching the Entra group is a small exercise in API citizenship:

- **429 handling respects `Retry-After`**, capped at 30 seconds, max three retries — a client that hammers a throttled endpoint is how a 429 becomes an outage.
- **Pagination via `@odata.nextLink`** with a pragmatic "fetch all" toggle when the first page arrives unfiltered at page size 100.
- **Guest users are filtered out, and `accountEnabled` is enforced** — an invitation to the tenant that was never accepted should not become a login.

One filter worth noting: existing local users are fetched with an `IN (…)` clause to compute who is already invited, so the admin UI can distinguish "invite this person" from "this person is already in." The Graph `$filter` uses `startswith()` on name, mail, and UPN — built carefully and passed through `encodeURIComponent`, which is safe for a URL but a reminder that the boundary between "Graph query" and "SQL query" is where injection audits should look.

## Reconciliation: destructive, therefore recoverable

The sync's hard edge is deletion. A user present in the local table but absent from the Entra group gets `deleted_at` set — they lose access on their next sign-in attempt via the gate from the previous post. Deletion-by-absence is correct (people who leave the group must lose access) and dangerous (a misconfigured group filter deletes everyone).

Two controls make it recoverable. First, it is a **soft delete** — the row, its role history, and its audit trail survive; reactivation is an `UPDATE` that clears `deleted_at`, audited as a manual event, returning 404 when no soft-deleted row matched (so retries are safe). Second, a **drift endpoint** lists exactly the users the sync soft-deleted: `deleted_at IS NOT NULL AND last_synced_at IS NOT NULL`. That list is the admin's undo ledger — a reconciliation that hides its deletions is an incident waiting for a discovery.

An empty sync group in Entra still soft-deletes nobody dangerous in practice, because the sync filters to one configured group — but the drift panel is what makes that claim *checkable* rather than hopeful.

## Config validation with a spine

Sync configuration accepts a cron expression, but not any cron expression: five fields, validated by `node-cron`, and a minimum interval of five minutes. A `* * * * *` schedule is rejected, not silently accepted — the standards from [part 1](/blog/techstack-challenges-engineering-standards-as-code/) say safety fallbacks must be loud, and here the loudness is at the API boundary: the admin gets a refusal, not a smoking database. Config writes are serialized through a promise chain so an interleaved edit-and-rearm cannot corrupt the persisted schedule.

## What I would copy

The generation token for scheduled runs, the typed busy error instead of a distributed lock, retry that honors `Retry-After`, and — above all — making the destructive part of reconciliation *visible and undoable*. Every sync that deletes something should ship with its own undo UI in the same changeset.

Next: push notifications — a send pipeline where idempotency is mandatory, preferences fail open, and a WebSocket authenticates over a subprotocol.
