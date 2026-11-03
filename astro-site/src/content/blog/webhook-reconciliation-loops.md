---
title: 'Webhook Reconciliation Loops: Keeping External Subscriptions Alive'
description: 'Third-party webhooks expire, get orphaned by restarts, and miss events. A reconcile-loop design that converges desired vs. live state, plus deduplication by join URL and latches that remember deliberate exits.'
pubDate: 2024-05-07
categories: [algorithms, system-design]
tags: [webhooks, reconciliation, idempotency, distributed-systems, reliability]
heroImage: /assets/img/posts/webhook-reconciliation-loops/thumbnail.png
heroAlt: 'Webhook Reconciliation Loops: Keeping External Subscriptions Alive'
---

Your service subscribes to a third-party calendar provider's webhooks: "tell me when meetings on this mailbox change." Subscriptions expire after ~3 days. Processes restart. Callback URLs change in development. Events fire twice. Meetings end and people leave, but the bot shouldn't wander back in. None of these problems is hard alone; together they describe a class of system — the **reconciliation loop** — worth studying as a pattern.

## Desired vs. live: the core loop

The provider's API is the source of truth for what subscriptions exist; your database is the source of truth for what *should* exist. The two drift apart constantly. So a loop runs every 60 seconds:

```
desired = what my config says should be subscribed (per mailbox)
live    = what the provider API actually lists
converge:
  for d in desired - live: create(d)
  for l in live - desired: delete(l)
  for l in live where l.expires_soon(< 24h): renew(l)
```

Not event-driven — the provider's subscription API is eventually consistent and notification delivery is at-least-once, so a periodic sweep is the honest primitive. Event-driven reconciles are fast *and* fragile; a timer is slow *and* robust. For subscription state, robust wins.

Two details make the loop safe across restarts:

**1. Deterministic client tokens.** The provider lets you attach opaque state to each subscription — the only reliable way to recognize your own subscriptions later (the API won't echo it back on listing; you must recognize subscriptions by their callback URL). Derive a fingerprint *deterministically* from a server secret + callback prefix:

```
fingerprint = HMAC_SHA256(api_key, callback_base_url_prefix)[:16]
notification_url = callback_base + "/webhook?v=" + fingerprint
```

Determinism is the point: after a restart, the same server derives the same fingerprint, adopts the subscriptions it created before as its own, and never orphans them. An old callback (from before a URL change) doesn't match the new fingerprint and gets reaped as foreign. No stored state, no adoption race, no registry table.

**2. Structured audit per decision.** Every create/renew/delete/reconcile-failure event is written to an audit log (via a small replay-buffered client, so a brief API outage at startup doesn't lose events). The reconcile loop's health snapshot — desired count vs. live count — degrades visibly when live < desired.

## Two managers, deliberately isolated

A subtle production bug: two different features both manage subscriptions against the same provider, with different callbacks and different validation tokens (one for the service account's mailbox, one for opted-in organizers' calendars). If one reconcile loop's "desired" set is the other loop's "foreign", each reaps the other's subscriptions within a minute — a self-inflicted flapping outage.

The fix is structural: **separate managers with separate callbacks, separate validation tokens, and separate reap scopes.** The key word is *scope*: each manager reaps only subscriptions under its own URL prefix. Structural isolation — different code, different secrets, different namespace — beats any amount of "we filter carefully" diligence in a shared loop.

## Deduplication: join URL, not event id

A meeting appears in two mailboxes (organizer's and a delegate's), and the provider notifies both. Event-id dedup fails here: they're *different* events (different ids) about the *same* meeting. The right dedup key is the **join URL** — the meeting's intrinsic identity. Two notifications mapping to the same join URL within the dispatch window collapse to one dispatch. A separate, smaller dedup set by event id handles provider retries of the identical notification. Two layers, two purposes: event id for delivery semantics, join URL for entity semantics.

Dedup stamps expire (a 10-minute window is typical), so a re-created meeting can be re-dispatched legitimately.

## The sweeper: polling as honest fallback

When no callback URL is configured (local development, ingress not yet provisioned), the service *degrades rather than dies*: an error-level log announces that webhook subscriptions are disabled and discovery falls back to a polling sweeper that queries near-term calendars every 5 minutes. Meetings are found later than they would be via push — stated honestly in the log — but the feature keeps working. Reconcile still runs in both modes, because it maintains the mailbox registry the sweeper needs.

The sweeper has its own careful bits: bounded concurrency across mailboxes (a semaphore; one slow calendar must not starve the rest; per-mailbox failures isolated via return-exceptions), and an explicit window (next 30 minutes) rather than "everything", because the expensive part of the response is the event *body* — needed for extracting meeting instructions and links — and you fetch it only for meetings you'll actually act on soon.

## Leave latches: remembering on purpose

The worst behavior for a meeting assistant is rejoining a meeting it was removed from. Two latch sets, TTL'd (4 hours), restored from the audit log at boot:

- **Deliberate leaves** — the bot was removed by an operator. Never rejoin.
- **Empty-roster leaves** — the bot left because nobody else remained. The meeting concluded; don't rejoin after a restart resurrects the state.

The boot-time restore is awaited *before* the sweeper starts — otherwise the first sweep tick races the restore and dispatches a join the latch would have prevented. Ordering is the whole bug.

And a deliberate rejoin path: when the media layer reports the participant genuinely returned, the latch clears, a fresh watcher respawns with a short initial delay and a bounded timeout. Real rejoins work; zombie rejoins don't.

## Cross-tenant access: the bridge pattern

Meetings organized in *another* tenant's directory need a delegated credential your app registration can't mint. The pattern: a dedicated bridge account (a real user mailbox) authenticated via an interactive device-code flow — on startup, if no refresh token exists, the service prints the verification URL and code to its logs every minute until an operator completes login, with a deadline. The refresh token rotates on every exchange and is persisted back to your API (encrypted at rest); health endpoints expose the bridge's auth status. Cross-tenant lookups go through the bridge; same-tenant traffic never depends on it — an outage in the optional path must not take down the default path.

## Extraction: instructions from invite bodies

Meeting instructions arrive as HTML in the invite body, mixed with the mail client's auto-generated boilerplate. Extraction is heuristic but principled: parse HTML to text (block tags become newlines), cut at the earliest boilerplate signature (the "need help?" footer, the separator runs, the join-URL block), normalize whitespace, cap length. The cap matters less than its posture: 8192 chars is a budget, not a guarantee — the caller splices what it gets into the prompt and the model is told the text may be truncated.

## Takeaways

1. **Reconcile desired vs. live on a timer**, with deterministic client tokens so restarts adopt their own subscriptions and orphan nothing.
2. **Separate managers for separate features**, each reaping only its own callback prefix — shared loops with different "desired" sets will eat each other.
3. **Dedup by entity (join URL), not just by delivery event id.** Two dedup layers, two semantics.
4. **Degrade to polling with an honest log** when callbacks are unavailable; keep reconcile running because it feeds the sweeper.
5. **TTL'd leave latches, restored before the sweeper starts**, with an explicit operator-rejoin path. Ordering *is* the correctness.
6. **Bridge cross-tenant access through a separately-authenticated account** whose failure is isolated from the default path.

Webhooks promise push; what they deliver is at-least-once, expiring, eventually-consistent push. Systems that treat the provider as a fallible peer — converging state on a timer, deduplicating by entity, remembering deliberate exits — survive that reality. Systems that trust the promise flap.
