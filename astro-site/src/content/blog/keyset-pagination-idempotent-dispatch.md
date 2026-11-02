---
title: 'Keyset Pagination and Idempotent Event Dispatch'
description: 'Two small algorithms that make a notification service boring in the best way: cursor pagination that cannot skip rows, and exactly-once-flavored dispatch built on a single SQL statement.'
pubDate: 2023-09-12
categories: [algorithms]
tags: [pagination, idempotency, postgres, notifications, system-design]
---

Every notification service has two failure modes that hurt more than all the others combined: **users seeing duplicates** and **users missing rows when they scroll**. Both are self-inflicted — they come from choosing the wrong primitive. This post walks through two algorithms I keep coming back to: keyset (cursor) pagination for feeds, and database-level idempotency keys for event dispatch.

## The problem with OFFSET

Page-through-a-feed implemented as `LIMIT 20 OFFSET 40` looks fine in a demo and falls apart in production:

1. **Rows shift between page N and page N+1.** A new notification inserted at the top moves every row down one slot. The user scrolls and sees the same notification twice — or never sees one at all.
2. **OFFSET is O(offset).** To return page 50, Postgres must count and discard the first 980 rows. Deep pagination gets slower the further you go — exactly where your most engaged users live.

The fix is to stop thinking in *page numbers* and think in *positions*.

## Keyset pagination

The idea: instead of "give me rows 41–60", ask "give me 20 rows that come **after** the row I last saw". If the feed is ordered by `(created_at, id)`, the cursor is simply the last row's values:

```sql
SELECT *
FROM notifications
WHERE (created_at, id) < ($1, $2)   -- "older than this row"
ORDER BY created_at DESC, id DESC
LIMIT 21;                            -- over-fetch by 1
```

Three details matter:

**Composite tuple comparison.** `(created_at, id) < ($1, $2)` compares lexicographically: first by timestamp, then by id as a tiebreaker. The tiebreaker is not optional — `created_at` alone collides constantly under burst inserts. Two notifications in the same millisecond would silently drop rows without it.

**Over-fetch to detect the next page.** Ask for `LIMIT + 1`. If the 21st row exists, there is a next page and the cursor for it is row 20; otherwise there isn't. No separate `COUNT(*)` query.

**An opaque, encoded cursor.** The wire format is `base64url("createdAt|id")`. It is opaque to clients (they cannot manufacture arbitrary positions, which stops them from hammering your worst-case query), self-verifying (decode and you have both parts), and stable across restarts.

One subtlety on decoding: split on the **last** `|`, not the first — an ISO timestamp never contains `|`, but being strict about it means a malformed cursor fails loudly instead of slicing a timestamp in half and querying with garbage.

Why descending order? Newest-first is what feeds want, and the "less than" comparison follows the same direction. Inverting either one without the other is the classic way to build a pagination bug that only shows up on the second page.

## Idempotent dispatch with one INSERT

The other half of the service receives events from producers ("meeting assigned", "job finished") and turns them into notifications. Producers retry. Networks duplicate. The requirement is: **the same logical event must never notify twice**, and the implementation must survive concurrent duplicate delivery.

The primitive is a unique key and a conflict-tolerant insert:

```sql
CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

```sql
-- claim: returns true iff this is the first time we've seen the key
INSERT INTO idempotency_keys (key)
VALUES ($1)
ON CONFLICT DO NOTHING;
```

`ON CONFLICT DO NOTHING` is atomic under concurrency. Two requests with the same key arriving at the same moment both execute the `INSERT`; Postgres serializes them on the primary key; exactly one reports "a row was inserted". The loser takes the `DO NOTHING` branch. There is no check-then-insert race because there is no separate check.

The key itself encodes the *logical* event, not the delivery:

```
notification:{run_id}:{event_type}:{recipient_user_id}
```

Notice the components: the run that produced the event, the kind of event, and the recipient. Retries of the same logical event collapse onto the same key. Different recipients of the same event get different keys (each is a separate notification). And the producer-chosen idempotency key (e.g. `meeting_assignment:{user}:{meeting}`) is hashed into it, so a producer retrying its *own* dedup key also collapses here.

The full dispatch flow, in order:

1. **Claim** the idempotency key. If the claim fails, return `{duplicate}` — no row, no fan-out, no side effects at all. Duplicates are cheap.
2. **Persist the in-app notification row first.** Even if everything after this fails, the notification exists in the durable feed. This is the "in-app is the source of truth" principle: push is best-effort icing, the feed is the cake.
3. **Check preferences.** Fetch the user's per-category push preference from the account service, with a short per-user cache and a **fail-open** default: if the preference service is down, send. A notification the user didn't want is a minor annoyance; a notification they needed and never got is an incident.
4. **Fan out to device tokens.** For each enabled token, validate the token shape, queue a dispatch row, then send in SDK-sized chunks. Tickets map back to dispatches **by index order** — which is only safe because each message targets exactly one token. The moment you batch one message to many tokens, you need an explicit correlation id per pair.
5. **Never throw.** A network error at send time marks the affected dispatches as failed and returns a normal response. The caller (a producer firing after its own DB commit) should never block on or retry against your downstream outage — that's what the receipt reconciler is for.

## Receipt reconciliation: the second chance

Push providers acknowledge a *send* immediately and report *delivery* later, out of band. So the pipeline treats `sent` as "not yet known":

- A background poller (fixed interval, single-flight via a `running` flag, `timer.unref()` so it never keeps the process alive) selects dispatches in `sent` state with a provider ticket.
- It groups them by ticket, fetches receipts in chunks, and transitions each: `ok → delivered`, error → `receipt_error`, and **no entry → stays `sent` for the next pass**. Missing receipts are not failures; they are "not ready yet".
- A terminal error like `DeviceNotRegistered` **disables the token** as a side effect. Tokens are soft-disabled, never deleted — the same physical device re-registering flips `enabled` back on and updates `last_seen`, which keeps a clean audit trail of which installs were alive when.

There is deliberately no exponential backoff here: the poll is cheap, the state machine is explicit, and a fixed interval is easier to reason about than a backoff curve. (There is a real design question about whether a poll is right at all versus a queue — but for a few thousand dispatches a minute, the polling loop is fewer moving parts than a broker.)

## Takeaways

1. **Cursor, not page number.** `(created_at, id)` keyset pagination is O(page size), race-free, and deep-scroll cheap. The composite tiebreaker is mandatory.
2. **One INSERT is your whole dedup algorithm.** `ON CONFLICT DO NOTHING` on a producer-scoped key gives you atomic exactly-once-flavored semantics with zero distributed-systems machinery. Duplicates become the cheapest path in the system.
3. **Persist before fan-out, fail open on preferences, never throw to producers.** Availability decisions ordered by blast radius.
4. **`sent ≠ delivered`.** Model provider acknowledgment and delivery as separate states, and let a reconciler close the loop asynchronously.

None of this is exotic. That's the point — feeds that don't skip, and notifications that don't duplicate, are almost entirely a matter of picking the right two SQL shapes on day one.
