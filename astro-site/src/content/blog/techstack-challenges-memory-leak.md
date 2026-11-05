---
title: 'Techstack Challenges, Part 13: The Meeting Bot That Ate Its Container'
description: 'A .NET service that ran out of memory in production: per-meeting state that outlived the meetings, a GC ceiling fixed at process start, and why raising the limit was the right stopgap — done deliberately.'
pubDate: 2026-06-02
updatedDate: 2026-06-02
categories:
  - software-engineering
  - devops
tags:
  - dotnet
  - memory-leak
  - garbage-collection
  - kubernetes
  - incident-response
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-memory-leak/thumbnail.png
heroAlt: 'Title card reading "The Meeting Bot That Ate Its Container" with the subtitle "Retention, not pressure: a memory-leak postmortem" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 13
---

## Introduction

Part 13 of **Techstack Challenges**. The platform has a meeting bot — a .NET service that joins Microsoft Teams calls as a participant, transcribes, and assists. Internally it is split into a "brain" (orchestration, decision-making) and media adapters (the parts that touch audio and Graph). This post is about the morning the brain ate its container, and the week of stopgaps that followed.

## The incident

The alert came in at 06:49 UTC: every attempt to join a meeting failed with `System.OutOfMemoryException`. One call was live. The brain was at roughly 860 MiB — inside its old 1 GiB limit, and yet out of memory.

The first hypothesis was GC pressure: a .NET process under memory stress should be thrashing collections. It wasn't. Workstation GC had shipped two days earlier and changed nothing. Memory climbed and stayed climbed, which points not at the allocator but at *retention* — something was holding references the collector could never reclaim. The diagnosis, stated plainly in the incident notes: the brain retains per-meeting memory it never releases. Some structure, per meeting, survived `meeting_ended` and stayed rooted.

## The 75% rule, or why the restart mattered as much as the resize

Here is the detail that turned a routine resize into a lesson: **.NET sets its GC heap ceiling at process start, at roughly 75% of the container's memory limit.** It does not re-read `resources.limits` later. A container resized in place from 1 GiB to 4 GiB still has a ~768 MiB heap ceiling until the process restarts.

So the response had two coordinated steps, nineteen minutes apart: an in-place resize to 4 GiB (heap ceiling ~3 GiB), and then a restart of *only* the brain container — a clean shutdown via the host's shutdown signal, so it left its meeting politely — to make the new ceiling real. Restarting everything would have been the sloppy version; restarting the right process was the whole job.

By 07:23 the service was stable at 4 GiB. The deploy that shipped Workstation GC had, as a side effect, wiped a hand-applied limit — a reminder that any hand-applied mitigation is a config diff waiting to be reverted, and the durable version of a stopgap lives in the manifest, not in `kubectl`.

## Why the staging environment kept the leak

The deliberate part of the story: production moved to 4 GiB. Staging stayed at 1 GiB.

The temptation after an incident is to raise limits everywhere and declare victory. The team did the opposite — production got headroom so users stop being hurt, while staging deliberately kept the tight limit so the leak stays *visible and painful* there. A leak hidden by generous limits is not fixed; it is postponed and made harder to diagnose, because every graph is flat until the day it isn't. The bug remained open, with the tight staging limit as its tripwire, until the retention root cause was found.

This is the same doctrine as the rest of the series — failures must be loud ([part 10](/blog/techstack-challenges-configuration-fails-loud/)) — applied to resource policy: **do not tune your observability into silence.**

## Root cause hunting: retention, not pressure

The actual debugging is worth a paragraph because it reversed the obvious intuition. Out-of-memory with a flat CPU profile and no GC thrash means the heap is full of *reachable* garbage — objects that are waste but still referenced, so the collector correctly keeps them. The hunt is not "what allocates too much" but "what keeps a reference past its lifetime." In this service the candidates were structures scoped to a meeting's lifetime — media pipelines, accumulators, telemetry context — registered against long-lived managers without an unregister on `meeting_ended`, plus closures over meeting state captured by events on long-lived objects. Every one of those is a classic .NET retention pattern; the fix family is deterministic disposal and explicit unsubscription, verified by a test that starts and ends meetings and asserts the heap returns to baseline.

I will not pretend the fix was quick — the stopgap carried production for a while. But the stopgap was *chosen*, sized, documented in a dated plan file, and paired with a still-tight staging limit. That is what "we'll fix it properly" looks like when it is meant.

## The side quest: DNS again

The same manifest audit that produced the memory ceiling also surfaced the split-horizon DNS problem from [part 12](/blog/techstack-challenges-voice-agent-kubernetes/) — the brain could not resolve the internal observability endpoint, and its traces had been dying quietly for a month. One `hostAliases` pin fixed the name; the forward-zone fix was queued. Two incidents, one root pattern: silent failure in a subsystem everyone assumed was working.

## What I would copy

Know your runtime's ceiling semantics — "restart to apply a memory limit" is a fact about .NET in containers that should live in every runbook before it is needed. And separate the *mitigation* (bigger limit, applied everywhere it protects users) from the *tripwire* (tight limit, kept somewhere it protects the diagnosis). An incident response that buys reliability *and* preserves the evidence is the kind you can be proud of in the retrospective.

Next: the multi-agent development harness — nine specialized agents, adversarial workflows, and hooks that instructions cannot talk their way past.
