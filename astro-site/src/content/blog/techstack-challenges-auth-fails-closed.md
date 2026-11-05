---
title: 'Techstack Challenges, Part 6: An Auth Service That Fails Closed'
description: Designing an Express + Better Auth service where deactivated users cannot sign in even when the database is down, tokens die on role change, and audit logging can never block a login.
pubDate: 2025-08-12
updatedDate: 2025-08-12
categories:
  - software-engineering
  - security
tags:
  - authentication
  - better-auth
  - entra-id
  - oauth
  - nodejs
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-auth-fails-closed/thumbnail.png
heroAlt: 'Title card reading "An Auth Service That Fails Closed" with the subtitle "Deactivated is deactivated, even when the DB is down" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 6
---

## Introduction

Part 6 of **Techstack Challenges**. After [docs](/blog/techstack-challenges-docs-service/) and [documentation culture](/blog/techstack-challenges-documentation-culture/), we move to the security perimeter: the auth service for the anonymized platform — a small Express service on Node, built on **Better Auth**, handling Entra ID (Microsoft) login for a web app, a mobile app with deep links, and session management for everything downstream.

Small service, big opinions. Three design decisions in it are worth writing down because each one is a mistake I have seen cost an incident elsewhere.

## Decision 1: the soft-delete gate fails closed

Users in this system are soft-deleted — when an Entra sync determines someone left the tenant, their row gets a `deleted_at` timestamp rather than disappearing. The question that matters: can a deactivated user still sign in?

The gate lives in a Better Auth database hook, `session.create.before`:

```ts
const result = await db.query('SELECT deleted_at FROM users WHERE id = $1::uuid LIMIT 1', [session.userId]);
if (result.rows[0]?.deleted_at) throw new AccountDeactivatedError();
```

Two details make it trustworthy. First, the error is **typed** — a dedicated `AccountDeactivatedError` class — so deactivation is never distinguished from an infrastructure failure by string matching on a message. Second, and more important: **any database error also rejects the sign-in.** If the replica is unmigrated and the column query fails, the user gets "authentication temporarily unavailable," not a session. A gate that fails open on DB error is not a gate; it is a hope. Failing closed means a database outage breaks logins, which is a real cost — but the alternative is a deactivated user with a valid Entra account walking back in.

The deactivation detail is also deliberately generic in the HTTP response: the same neutral message covers wrong-user, deactivated, and infrastructure failure, so the endpoint can't be used for user enumeration or role fingerprinting.

## Decision 2: tokens carry a version, so role changes kill sessions

Revoking sessions on permission change is the classic "we'll do it later" feature. Here it was designed in from the start. Every user row has a `session_version`. The JWT plugin's payload definition reads roles and `session_version` from the database at mint time; APIs compare the token's version against the live row, and a stale version is a 401.

Nothing needs to iterate or invalidate anything: bump the column and every in-flight token is dead on its next use. Role change, suspension, security response — one `UPDATE`, immediate effect, no token blacklist server. The trade-off — a DB read per authorization instead of a pure signature check — was the right price for never having a "revoke all" feature to build.

## Decision 3: audit is fire-and-forget, and must never throw

Every sign-in, sign-out, token refresh, and admin action writes an `audit_events` row. It does so like this:

```ts
void (async () => { /* insert */ })();
```

Fire-and-forget, errors swallowed to a warning. This looks irresponsible until you think through the failure modes: if audit shared the request's fate, a `audit_events` outage — a missing table, a full disk — would break sign-in for the entire company. Audit exists to record what happened; if recording is down, the security-correct behavior is still to let authentication proceed (and log loudly about the audit failure) rather than to deny service. Availability of the lock must not depend on the logbook.

The same service keeps the bookkeeping honest on the *other* axis too: the audit extractor understands both Express request objects and Better Auth's fetch-style hook requests, so audit rows don't silently lose IP and user-agent depending on which path an event came through.

## The details that round it out

- **OAuth state in cookies, not the database.** Better Auth's DB-backed verification table has a cleanup race that surfaces as `StateError: verification not found`. Cookie state strategy removes the table and the race.
- **Minimal scopes at login.** The Entra integration deliberately requests read-only Graph scopes at sign-in; write scopes (file upload) go through a separate incremental-consent endpoint. Eagerly requesting everything breaks login in strict-consent tenants — a real production failure that this design specifically avoids repeating.
- **OID as identity.** Microsoft's `oid` claim *is* the user ID. Using the stable object ID instead of an email avoids duplicate users on renames and the account-linking foot-gun entirely; a `before` hook links an incoming Microsoft account to an existing user with the same email only when one already exists.
- **Boot-time assertions.** Missing service-auth secret or A2A config and the process refuses to start — misconfiguration fails at deploy time, not at 2 a.m. on the first request that needs it.

## What I would copy

Fail closed on the gate, version your tokens, and make audit incapable of blocking the operation it records. All three are cheap on day one and expensive to retrofit — which is precisely why they are usually retrofitted after an incident.

Next: the other half of this service — syncing users from Entra ID with an in-process cron, a module-level promise lock, and a drift panel for the soft-deleted.
