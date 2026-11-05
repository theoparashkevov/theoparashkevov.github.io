---
title: 'Techstack Challenges, Part 8: A Push Pipeline Where Duplicates Are Harmless'
description: 'Designing the push-notification service: idempotency keys as mandatory input, durable in-app records before OS push, fail-open preferences, receipt reconciliation, and WebSocket auth via subprotocol.'
pubDate: 2025-11-04
updatedDate: 2025-11-04
categories:
  - software-engineering
tags:
  - push-notifications
  - websockets
  - nodejs
  - expo
  - idempotency
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-push-pipeline/thumbnail.png
heroAlt: 'Title card reading "A Push Pipeline Where Duplicates Are Harmless" with the subtitle "Idempotency first, delivery second" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 8
---

## Introduction

Part 8 of **Techstack Challenges**. The anonymized platform notifies users about meetings, chat replies, and scheduled jobs on iOS via Expo push, plus a live in-app feed over WebSocket. This is the push service: Express 5, TypeScript, raw-SQL migrations on a shared Postgres, and a send pipeline whose central design axiom is that **every event may arrive twice**.

Push pipelines fail in two classic ways: users get the same notification three times, or a delivery failure half-way through leaves the system disagreeing with itself about what was sent. Both are solved here by ordering operations and making the first one idempotent.

## The pipeline, in order

Every incoming event carries an `idempotency_key` — mandatory, unique per logical occurrence, built from the event payload. The pipeline is a strict sequence:

1. **Claim the idempotency key.** `INSERT … ON CONFLICT DO NOTHING` into an idempotency table. Zero rows inserted means this exact event was already processed → respond `duplicate` and stop. This single step makes retries, double-clicks, at-least-once queues, and flapping schedulers all harmless.
2. **Persist the durable in-app record.** The notification exists in the feed *now*, regardless of what happens with Apple or Expo afterward. A push outage can delay the OS banner; it can never lose the notification.
3. **Broadcast to live sockets.** Any open WebSocket sessions for the user get the event immediately — before anyone knows whether the OS push will succeed. Latency for the user looking at the app beats certainty about the user not looking.
4. **Check preferences.** Should this category go to the OS at all? The check calls back to the main API with a service JWT, cached per user for 60 seconds — and **fails open**: if the preferences service is down, the push goes out rather than being dropped. A preferences outage must never silently become a notification blackout; the failure is logged, not cached.
5. **Resolve device tokens, validate, send.** Enabled tokens only; malformed tokens are soft-disabled on sight; Expo's chunking is used for batches. Each dispatch row tracks its ticket through `queued → sent → delivered` or a terminal error.

Step 1 is why the pipeline can afford to be "multi-step overall" instead of transactional: the dangerous duplicate is impossible before any money — or any user's patience — is spent.

## Receipts: the second half of delivery

Expo's send API returns tickets, not outcomes. Delivery is confirmed asynchronously via receipts, so a poller reconciles: query dispatches stuck in `sent` with a ticket and younger than 24 hours (backed by a partial index), fetch receipts in batches, and mark `delivered` or record the error. A `DeviceNotRegistered` receipt soft-disables that token — the device is gone; future sends should skip it.

Two details I like: the poller has an overlap guard and `unref()`s its timer so it never holds the process open; and undelivered-after-24h rows are simply left for the next tick rather than force-failed — push delivery is genuinely asynchronous, and the state machine admits it.

## WebSocket auth without cookies

The live stream is a WebSocket on the same HTTP server, but browser `Authorization` headers are awkward for WS clients. The solution is a subprotocol: `Sec-WebSocket-Protocol: flux.bearer.v1, <id_token>`. The server splits the header, validates the second part against Entra's JWKS (issuer, audience, `oid` claim), echoes back only the sentinel protocol name — never the token — and destroys the socket with a raw `401` line on failure. The connection registry is a plain `Map<userId, Set<WebSocket>>`, correct at one replica, with a documented note that multi-replica needs Redis pub/sub behind the same interface.

## Service auth: two trust domains

The service has two auth worlds, cleanly separated: end users reach `/v1/*` with an Entra OIDC bearer token (with an admin role check on the delivery-logs endpoint), and only sibling services reach `/internal/*` with an HS256 service JWT carrying a scope like `push:emit`. The internal events endpoint is the *only* ingress for notifications — no route lets a user inject a push. Scopes are fine-grained enough that the preferences callback uses a read scope distinct from the emit scope.

## What I would copy

Mandatory idempotency keys at the boundary, durable record before best-effort delivery, fail-open on preferences, and the subprotocol trick for WS auth. Together they mean the worst realistic failure is a delayed banner — never a lost notification, never a triplicate, and never a user-visible lie about what happened.

Next: the scheduler that feeds this pipeline — a ten-second tick loop, five-minute leases, and a recurrence engine with a split personality.
