---
title: 'Computed Status, Not Stored: Deriving the Lifecycle of Scheduled Things'
description: 'Should a survey be "completed" or "expired"? Store the flag and it lies between updates; compute it on read and it is always true. A design for lifecycle derivation, assignee coverage, and the short-circuits that keep it fast.'
pubDate: 2024-05-21
series: 'Algorithm Implementations'
seriesOrder: 13
categories: [algorithms]
tags: [state-machines, scheduling, postgres, data-modeling]
heroImage: /assets/img/posts/computed-lifecycle-status/thumbnail.png
heroAlt: 'Computed Status, Not Stored: Deriving the Lifecycle of Scheduled Things'
---

Every system with scheduled things — surveys, meetings, campaigns, assignments — eventually needs a lifecycle status: *scheduled, active, completed, incomplete, expired, archived*. The natural first implementation stores a status column and updates it from cron jobs and user actions. This post is an argument that the natural implementation is wrong, and that the fix — computing status on read from schedule + evidence — is simpler, always truthful, and cheaper than it looks.

## The stored-status failure mode

A stored status is a claim about the world made at some past moment. The world moves on: a window closes while the cron is stuck; an admin archives while a migration rewrites the column; a recurring series' last occurrence passes between sweeps. Between the event and the next writer, every read gets a lie — and worse, *different* lies depending on which writer touched it last. Status drift is not an edge case; it's the steady state of any stored-status system whose transitions are driven by time.

The alternative: **no status column at all.** Status is a pure function of (schedule config, now, participation evidence), computed at read time. A schema-building step calls the resolver; nothing persists. The `active → completed` transition needs no cron, because nothing transitions — every read reflects the current instant.

## The resolver

Inputs: schedule config (type, window start/end, recurrence rule), archived flag, source, session counts, assignee coverage, and `now`. The priority order is itself part of the spec:

1. **Archived wins over everything.** An explicit human override beats every derived answer.
2. **Externally-sourced records** (captured from outside the system) are `external` — "we don't know this thing's schedule" is a status, and an honest unknown beats a confident wrong guess. Imported historical artifacts are different: they're finished by definition, so they resolve through the finished-path against a single past occurrence.
3. Then the schedule: future window start → `scheduled`; past window end → *finished*; otherwise `active`.

The finished-path deserves care, because this is where naive implementations say "completed" when they mean "ended":

```
finished(coverage, total_assignments, total_sessions, resolved, now):
  1. no assignments at all?
       → completed if anything happened, else expired
  2. zero assignees ever participated?  → expired
  3. some assignee has zero sessions?   → incomplete   ← cheap, load-bearing
  4. occurrences = past-occurrence-count(resolved, now)   ← expensive
  5. min sessions per assignee >= occurrences? → completed
  6. otherwise                              → incomplete
```

Two decisions here earn their keep:

**Coverage is computed over *assignees only*.** Uninvited participants must not mask gaps: a survey with 202 invited assignees but 981 total sessions isn't 482% complete — it's incomplete if invited people never showed. The denominator is the audience; everything else is noise. (The same discipline applies to response-rate numerators, which can legitimately exceed 100% when uninvited people respond — that's a finding about the survey, not a bug to "fix".)

**Step 3 short-circuits step 4.** Expanding a daily recurrence since 2015 to count past occurrences costs real milliseconds per row; discovering that one assignee has zero sessions settles the question for a tenth of the work. In a real dataset the short-circuit handles the overwhelming majority of rows — put the expensive expansion behind the cheap predicate, not the other way around, and note that a *malformed* recurrence falls back to "one occurrence" rather than crashing the listing: a broken schedule puts the row on the same footing as a one-off, which is survivable, instead of taking down the page, which isn't.

## The `once` special case

One-time events are where lifecycle logic goes to die, because their data is pathological: a large fraction of real one-off sessions predate the recorded window start (imports, backfills, timezone artifacts). Two pinned rules:

- A `once` thing **without an explicit `window_end` stays `active`** — a start is not a closing signal, and assuming it is resurrects "completed" one-offs as perpetually fillable.
- Only an explicit end flips it to finished. If schedule data must be *resolved* from legacy rows (old rows that encoded everything in one recurrence string), the one-shot case (`COUNT=1`) is protected through derivation: a recurring rule's bounds describe the *series*, never a single slot, and must not be borrowed to window a one-off.

## The window-overlap question: which occurrence did this belong to?

For recurring schedules, attribution asks "which occurrence did this session complete in?" The robust formulation is half-open intervals between consecutive occurrences, clipped to the display window:

```
lower = max(display_start, window_start)
upper = min(display_end, window_end)
if lower > upper: return []
occurrences = sorted(rule.between(lower, upper, inc=True))
intervals   = [(occ[i], occ[i+1]) for i ...], last capped at window_end
```

A session counts for exactly the interval containing its completion timestamp. Half-open intervals make boundaries unambiguous and prevent double-counting at series joins.

## Duck-typed session protocol

The resolver shouldn't import the session ORM — scheduling logic is pure and testable only if it doesn't drag a database behind it. Instead it accepts anything *shaped like* a session:

```python
# what the resolver needs:
session.user_id                          # for coverage
session.session_metadata.completed       # bool | None
session.session_metadata.completed_at    # datetime | None (naive → UTC)
```

Anything exposing those attributes resolves. The real ORM satisfies it; test fixtures are trivially constructed; and the scheduling module stays import-free of ORM, I/O, and ORM dependencies — pure enough that a phase-1 agent or a notebook can reuse it freely. Naive datetimes are coerced to UTC at the boundary, once, rather than sprinkled through every comparison.

## Display status vs. lifecycle status

One refinement from real dashboards: the *display* priority the user expects is not the lifecycle order. `completed` outranks `in_progress`, which outranks `available`, which outranks `scheduled`, which outranks `missed` — a finished thing shows as finished even if its occurrence was also, technically, in the past; an in-progress session outranks its own scheduled slot. The resolver computes lifecycle; a display mapping applies priority. Keeping them separate means the business rule ("what is this thing's state?") and the UX rule ("what do we show first?") can each change without the other.

## Takeaways

1. **Compute lifecycle on read; store nothing.** No cron, no drift, no lies between runs. Time-driven transitions happen by being read, not by being written.
2. **Archived is top priority; honest `external` beats confident guesses; finished splits by assignee coverage over assignees only.**
3. **Short-circuit expensive recurrence expansion** behind cheap predicates (someone has zero sessions → incomplete, no expansion needed); malformed rules fall back to one-occurrence footing.
4. **Protect the one-shot case**: no explicit end means active; recurring bounds never window a one-off.
5. **Attribute via half-open occurrence intervals**; duck-type the session protocol to keep the module pure and reusable.
6. **Separate lifecycle from display priority** — they're different rules with different change rates.

Stored state is a cache of derived truth, and caches invalidate. The schedule plus the participation evidence *is* the truth; computing it on read is how the system stays honest at every instant — and how you delete a cron job, a sweeper, and a whole category of "why did the status say X?" bugs.
