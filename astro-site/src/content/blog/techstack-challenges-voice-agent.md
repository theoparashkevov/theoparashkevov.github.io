---
title: 'Techstack Challenges, Part 11: Answering the Phone with an LLM'
description: 'Building a voice agent that takes real phone calls: HMAC-verified webhooks, a sideband transcript pump, delegation-based tool dispatch, and a refusal layer protected by cryptographic digests.'
pubDate: 2026-03-10
updatedDate: 2026-03-10
categories:
  - ai
  - software-engineering
tags:
  - voice
  - llm
  - websocket
  - telephony
  - python
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-voice-agent/thumbnail.png
heroAlt: 'Title card reading "Answering the Phone with an LLM" with the subtitle "Persona, conscience, and a cryptographic superego" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 11
---

## Introduction

Part 11 of **Techstack Challenges**. So far this series has covered standards, frontends, docs, auth, notifications, and configuration. Now for the strangest service in the system — the one with a name, because the product team gave the voice agent a persona and the persona stuck. Meet **George**: an LLM-backed agent that answers real telephone calls, conducts survey interviews, and speaks with the caller's own AI assistant's personality.

George runs in Python, roughly twenty thousand lines including an unusually large test suite. He sits between three worlds that do not naturally agree: the PSTN (via an Asterisk PBX), a live-voice model API, and the platform's agent runtime. This post is about the call pipeline and the integrity machinery; the next one is about what deploying him on Kubernetes taught us.

## The call pipeline

A call arrives as an HMAC-signed webhook from the voice provider. Verification is `v1,<base64>` over `{webhook-id}.{timestamp}.{raw body}` with a five-minute tolerance, and failures get a terse 401 that leaks nothing. Non-SIP payloads and non-dict bodies are filtered early — every nested shape is checked with `isinstance` before use, because an `AttributeError` escaping a webhook handler is a 500 that a phone call cannot retry around.

Accepting the call is a REST call to the provider with a session config: voice, instructions built from the persona, and `delegation: {type: "client"}`. That last field is the architectural crux. The model does not call tools directly; it *delegates* tool requests over the session, and our dispatcher executes them. That keeps every tool behind our authorization, our logging, and our timeouts — the model proposes, the service disposes.

Two protocol traps are documented in the code with dates, because both appeared in production: the provider rejects `session.tools` in the config (tools travel only in delegation envelopes), and as of late 2026 it rejects `audio.input` for telephone legs. The config builder deliberately *deletes* those parameters rather than sending them conditionally — a session-config error means nobody's phone rings, so there is no such thing as a harmless wrong field.

Once accepted, a WebSocket "sideband" pump attaches to the session and transcribes both directions, mapping delta/done event pairs for caller and agent. The event vocabulary drifts over time — the provider renames events, and hangup in particular arrived as `session.closed` long after the docs said `transport.hangup` — so the mapper accepts both current and legacy names and counts unknown events instead of dropping them silently. Those counters have settled more than one "why is the transcript empty" investigation.

## Dead-air economics

Phone calls have a hard real-time budget the web doesn't: silence is a failure state. Two timers run during tool delegation — after about 1.5 seconds of delegation work, filler is sent; after about 4 seconds of total silence, George is prompted to speak. Without them, every slow tool call sounds like a dropped call, and callers hang up.

There is also a first-audio deadline: if a session sees no caller audio within ten seconds of being answered, the call is declared dead and torn down. This exists because an Asterisk redial can leave a session running with nobody attached — one was found billing for four minutes of silence. Ten seconds of patience, then hang up. Dead legs are expensive twice: in provider cost and in survey data integrity.

## The persona, and refusing to fake one

George's personality — the platform's term is a *vPerson* — is assembled from the agent runtime: a constitution, memory, and refusal rules. And here the service takes its hardest line: **if the persona cannot be composed, there is no call.** A missing agent ID, an unopenable session, a blank persona — each is a distinct terminal outcome (`PERSONA_UNAVAILABLE`, `SURVEY_UNAVAILABLE`), logged loudly, call refused.

The historical footnote explains the severity: an earlier version, when no persona source existed, quietly substituted a stub identity. The stub answered calls with no constitution, no memory, and no refusals — a friendly voice saying anything at all. Eighty-two tests asserted the stub behavior, which tells you how normal it had become. The fix (`NoPersonaSource`) refuses loudly instead: an unavailable persona is a 503 and an ERROR log, never an improvised agent. Counterfeiting the persona is worse than refusing the call.

## The superego

Which brings us to the strangest file in the service: the refusal layer's integrity guard. A module — call it the conscience — holds the constructs George must never be talked out of: the disclosures, the refusals, the identity statements. Because a prompt can ask an LLM to ignore its instructions, the guard does not trust prompts; it trusts hashes. Each guarded construct carries a SHA-256 digest over its full source text (decorators and docstrings included), and at import time the guard verifies:

- nothing guarded was deleted — an empty inventory is a loud failure, not a pass;
- nothing was redefined — Python binds the *last* definition at module level, so a shadowed construct would make the first digest meaningless;
- no digest mismatches — the source is exactly what was reviewed;
- the inventory has not shrunk below its minimum of fifteen.

If you change what George may refuse, you edit source, update the digest, and say so in the commit message — "what changed about the conscience" is a required sentence. A second layer of behavioral probes complements the digests: the digests catch a rewrite that would defeat the probes, and the probes catch a rewrite that would defeat the digests. Defense in depth, one layer of which is a hash of the other's blind spot.

This is not a security boundary against a determined attacker with commit access — nothing is. It is a tripwire against the realistic threat: a well-meaning edit, a prompt-injection attempt reaching the persona assembly, or a refactor that deletes "just a constant."

## Call outcomes as data

Every call ends in one of ten enumerated outcomes — completed, accept-failed, dropped, unbound number, region mismatch, outbound unclaimed, unanswered, survey unavailable, no media, persona unavailable. Enumeration matters: an outcome set that is just strings scatters into log queries, but an enum is a metric. Dashboards, alerting, and cost attribution all hang off those ten values.

Next: deploying George — the Kubernetes isolation story, from three outages caused by one missing secret to why `/trunk` is deliberately unauthenticated.
