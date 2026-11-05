---
title: 'Techstack Challenges, Part 9: The Scheduler That Sends Emails Exactly Once'
description: 'Inside the notification scheduler: a ten-second tick over five sweeps, five-minute compare-and-swap leases, a recurrence engine with strict and non-strict personalities, and retry accounting that never double-charges.'
pubDate: 2025-12-16
updatedDate: 2025-12-16
categories:
  - software-engineering
tags:
  - scheduler
  - postgresql
  - recurrence
  - rrule
  - reliability
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 9
---

## Introduction

Part 9 of **Techstack Challenges**. The [push pipeline](/blog/techstack-challenges-push-pipeline/) from last time is the delivery layer; this post is about the thing that decides *when* to notify: a Python notification scheduler that books calendar events, sends reminders, renews Graph subscriptions, and — the hard part — does each of those at most once under crashes, deploys, and buggy recurrence rules.

Its codebase reads like an incident journal. Almost every non-obvious line has a comment citing the incident that put it there. That is the best possible documentation strategy for this kind of system, and this post collects the stories.

## One tick, five sweeps, one session

Every ten seconds the scheduler wakes, opens a single database session, and runs five sweeps in order: renew the Microsoft Graph subscription if due, process pending notification jobs, process bot joins, renew chat subscriptions, and emit upcoming-meeting pushes (fifteen minutes ahead). If a sweep fails, the tick stops rather than continuing with a rolled-back session — partial progress across sweeps is worthless when they share one transaction's view.

The admission filter that selects jobs is the heart of the design, and every clause exists because its absence once caused a production incident:

- **Live means both columns agree.** During a long migration, old pods wrote a `status` column while new pods wrote a `state` column. The filter requires `status != CANCELLED AND (state IS NULL OR state = ACTIVE)` — either writer can stop a job, so a half-migrated fleet never resurrects a cancelled one.
- **The lease must be free.** `lease_expires_at <= now OR NULL` — a crashed worker's claim expires on its own, which is the entire crashed-worker recovery story.
- **The occurrence must be undelivered** — with a clause for *both* NULL (`next_run_at IS NULL` and no delivered marker) and inequality (`delivered_occurrence_at IS DISTINCT FROM next_run_at`). The plain inequality arm alone admitted every always-on job every tick; a bad morning of that sent roughly 850 duplicate emails before anyone noticed. The `IS DISTINCT FROM` form matters because plain `!=` is false when both sides are NULL.
- **A legacy delivered-status arm** covers the deploy window when the new column isn't writable yet, so a job delivered by an old pod doesn't look undelivered to a new one. Deploy-time duplicate sends are a migration bug, not a user bug, and the filter absorbs them.

## Leases, retries, and never double-charging

Claiming a job is a compare-and-swap on `lease_owner`/`lease_expires_at` with a five-minute lease; the owner is `hostname#pid`, and only expiry matters, never equality. After five attempts with exponential backoff capped at an hour, a job is revoked loudly (`SEND_FAILED`) rather than retried forever.

The subtlest bug class here is the retry budget. The send path already records a failure before re-throwing; if the scheduler's broader handler recorded it again, one real failure would consume two attempts and a job would die at three mistakes instead of five. The fix is a `failure_recorded` flag on the exception — bookkeeping happens exactly once, whoever catches it.

Worse is the duplicate-real-world-effect trap. If the Graph event was created but persisting the local record failed, retrying creates a *second* calendar event — a permanent, user-visible duplicate. Those failures are marked `terminal`: revoke immediately, alarm loudly, never retry. Retrying an operation whose side effect already happened is worse than giving up.

## The recurrence engine's split personality

RRULE strings (RFC 5545) drive recurring reminders, and the engine treats them differently depending on who is asking. For a human filling in a form, `validate_rrule` **raises** on malformed input — the user must fix it. For the scheduler, `parse_rrule` **returns None** — a bad rule stops that one job quietly instead of crashing the loop that serves every other job. Same parser, two postures, chosen by caller. Collapsing them either crashes the scheduler on user input or swallows form errors; the split is the whole design.

Recurrence bugs that earned their comments:

- **Duplicate `UNTIL` clauses.** Old code appended a second `UNTIL` when a job had an end date; `dateutil` honors the *last* one, so a distant job end overrode the survey's real end and a dead survey kept reminding people. The fix keeps the *tighter* bound and never appends a second clause.
- **`job_end_date` truncating a series.** A client sent the first meeting's end as the job's end date, and the admission filter dropped the recurring survey twenty-five minutes after its first occurrence. The authoritative bound is the rule's own `UNTIL`; the caller's date is only a fallback.
- **Stale-occurrence replay.** An edit used to replay weeks of past meetings one tick at a time. Now the scheduler jumps straight to the first future occurrence, with a fifteen-minute grace for genuinely-just-past ones.
- **Perpetual series** are truncated at 366 days of expanded occurrences — and the truncation is logged at ERROR, not silently capped, because a reminder that fires forever is a data bug wearing a config costume.

## Observability that respects the on-call

When the tick itself starts failing — Graph down, DB flaky — the first failure logs a full traceback and repeats log only every 30 ticks. A persistent outage stays visible without flooding; a transient blip doesn't spam. (There was an era when subscription-loss was swallowed by a bare `except: pass`: total silence — no sends, no renewals — with `/health` happily returning 200. The rate-limited logging exists because that afternoon happened.)

## What I would copy

The incident-comment as design doc. The `IS DISTINCT FROM` delivery check with explicit NULL arms. The `failure_recorded` flag. Terminal failures for retried side effects. And the strict/non-strict parser split. Each is small; together they are the difference between a scheduler you trust and one you babysit.

Next: the shared backend layer — centralized settings, boot gates, and the doctrine that every fallback must be loud.
