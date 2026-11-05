---
title: 'Techstack Challenges, Part 16: The Agent Runtime and Its Sixteen-Element Cache Key'
description: 'Inside the AI agent backend: LangGraph runtimes cached on a 16-part key, progressive skill disclosure with a 128-tool cap, compare-and-swap settings mirrors, and a feedback pipeline that groups meetings by red flags.'
pubDate: 2026-10-06
updatedDate: 2026-10-06
categories:
  - ai
  - software-engineering
tags:
  - llm-agents
  - langgraph
  - caching
  - feedback
  - python
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-agent-runtime/thumbnail.png
heroAlt: 'Title card reading "The Agent Runtime''s Sixteen-Element Cache Key" with the subtitle "Progressive skills, honest feedback, no stale runtimes" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 16
---

## Introduction

Part 16 of **Techstack Challenges**. This is the finale of the build story: the module that everything else in this series serves — the AI agents backend of the anonymized platform, where agents with personas, memory, tools, and skills run on LangGraph and answer questions over the company's surveys, documents, and meetings.

The module is large — several controllers over a thousand lines each, a 281-field agent schema, dozens of tools. Size is not the story. The story is three mechanisms that keep a system like this *correct*: a cache key that cannot lie, a settings mirror that cannot conflict, and a feedback loop that cannot flatter.

## The cache key that cannot lie

An agent session runs against a compiled LangGraph state graph — expensive to assemble (tools loaded, skills bound, middleware stacked), so runtimes are cached. The moment you cache anything keyed on "the agent's configuration," you face the question: what counts as the configuration?

The answer here is a sixteen-element tuple: agent ID, model, tool names, every attachment (knowledge bases, surveys, collections), an analytics-config hash, persona version, born-active skills, session-active skills, the caller's MCP credential IDs, sudo flag, survey-editing flag, the settings version, and the vPerson session partition. Any change to any element produces a different key — a cache miss and a rebuild on the next turn.

The principle: **a cache key must be a pure function of everything that affects the cached value's behavior.** Partial keys are how you get the worst bugs in agent systems — the model changed but the runtime still answers in the old persona's voice, silently, for hours. Sixteen elements is the admission that "agent configuration" is not one thing; it is a closure over the entire session context. And when the session's attachments change mid-conversation, the key changes with them — session edits get a fresh runtime on the next turn, not stale tools attached to new intent.

## Progressive skill disclosure with a hard cap

Agents can carry dozens of skills — survey authoring, scheduling, federation, document work. Offering every skill's tools in every prompt would blow the tool budget and degrade the model's choices, so disclosure is progressive. Skills start hidden; the runtime exposes only the union of born-active and session-activated skills, intersected with eligibility. Two details make it production-grade:

- **All eligible skills' tools are loaded onto the tool graph at build time**, so a mid-run skill activation has no dead zone — the tool exists before it is visible.
- **The 128-tool cap drops by activation rank**, most-recent activations first, and the serialisation order is the *registered* order, not activation order — because activation order varies, and varying order breaks prompt-cache prefixes. The cap and the ordering are both about determinism: same session, same bytes.

Skills are activated and dropped mid-run via `use_skill`/`drop_skill`, writing into the graph state. The middleware that gates exposure is the single authority on what the model can see at any moment.

## The settings mirror that cannot conflict

Agent edits write to the legacy `agents` columns and, in the same request, derive a mirrored row in a runtime-settings table with six facets: model, reasoning effort, tools, voice, interruption, output channel. Concurrency is handled with a compare-and-swap — `INSERT … ON CONFLICT DO UPDATE WHERE settings_version = expected` — so two editors racing get one winner and one clean 409 conflict, never a silent last-write-wins.

The traps are in the mirroring logic itself, and each is documented as a trap: an empty tool list means *full registry* for the Teams bot integration (so it mirrors as NULL, not as "no tools"); a `use_default_voice_config` flag mirrors as NULL rather than serializing a provider-less voice; a TRUE interruption flag mirrors as FALSE by a deliberate legacy contract. The derived writer uses `IS DISTINCT FROM` against the excluded row so unchanged values do not bump the version — which prevents spurious conflicts for the *next* editor. Every rule exists because its violation once shipped.

## The feedback loop that cannot flatter

Users rate agent responses — per message, with categories and weights, plus red flags. The interesting machinery is the aggregation: feedback is grouped by *meeting* (coalescing survey, session, and fallback keys with the user), computing count, weighted average, worst rating, red-flag count, and review status, sorted **red flags first, then lowest average**. That sort order is a product decision encoded in SQL: the meetings page opens with the conversations that went badly, not the ones that went fine — a feedback system that surfaces praise is decoration; one that surfaces red flags is an instrument.

Trend charts bucket averages by week, month, and quarter in UTC with a `first_rated_at` anchor. Exports produce ZIP archives with JSON and Markdown per entry, an attachments folder, a CSV index, and a formula-injection guard on CSV cells — the detail that tells you the export was built for someone who would actually open it in Excel.

The per-message feedback payloads also snapshot the agent's configuration at rating time, so a low score on an old session can be read against the configuration that produced it — essential when personas and prompts change weekly.

## What ties it together

The same doctrine runs through all three mechanisms: **make state transitions explicit and verifiable.** The cache key makes "what configuration answered" answerable. The compare-and-swap mirror makes "who edited last" fair. The feedback aggregation makes "where did it go wrong" visible. An agent platform without those three is a demo; with them, it is infrastructure.

And the whole module obeys the standards from [part 1](/blog/techstack-challenges-engineering-standards-as-code/): controllers in strict section order, boundary structures rather than ORM rows, typed exceptions with context. Even at 281 schema fields, the shape holds.

Next and last in this series: the lessons across two years — the one doctrine, the rules of thumb, and what I would build differently.
