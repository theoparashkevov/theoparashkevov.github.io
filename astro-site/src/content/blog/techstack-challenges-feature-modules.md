---
title: 'Techstack Challenges, Part 3: Three Feature Modules, One Shape'
description: A look inside the three most complex feature areas of the Meridian web app — the assistant console, survey administration, and the audit-heavy admin surface — and the shared architecture underneath all of them.
pubDate: 2025-04-08
updatedDate: 2025-04-08
categories:
  - web-development
  - software-engineering
tags:
  - react
  - architecture
  - real-time
  - design-system
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-feature-modules/thumbnail.png
heroAlt: 'Title card reading "Three Feature Modules, One Shape" with the subtitle "The same skeleton, repeated thirty-seven times" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 3
---

## Introduction

Part 3 of **Techstack Challenges**, my series about an anonymized B2B analytics platform I worked on. [Part 2](/blog/techstack-challenges-modern-react-stack/) covered the frontend stack — React 19, TanStack, Jotai, and the `containerClassName` convention. This post goes inside the three largest feature modules: the assistant (382 files), surveys administration (284), and the admin area (124). Three different domains, and yet — once you squint — almost the same module.

That sameness was deliberate, and noticing it is the whole point of this post.

## The assistant: real-time chat with an agent runtime

The assistant module is the product's front door: a streaming chat against an AI agent, plus the full agent lifecycle UI — a creation wizard (identity, behavior, access review), a detail editor with save-diff, and a console for watching agents work.

The hard problem is the real-time layer. Chat messages, tool calls, and agent panes arrive over a WebSocket from a streaming backend, so the module has a dedicated stream-state hook that owns the socket lifecycle and normalizes events into Jotai atoms. A `StreamingAssistantClient` in the feature's `lib/` is the only thing that knows the wire protocol; components render atoms and nothing else.

Two patterns from this module are worth stealing:

**Save-diff instead of dirty tracking.** The agent detail form does not track "is dirty" with boolean flags per field. It keeps the hydrated initial payload and computes a diff against current form values at save time; only the changed fields are sent. Field-level dirty tracking always rots — a new field gets added, its dirty handler gets forgotten. A structural diff cannot be forgotten.

**Sidebar tool renderers.** When the agent calls a tool (search surveys, list datasets), the result renders in a dedicated renderer component per tool, registered in the sidebar. Adding a tool's UI is adding one file and one registry entry — the chat surface never learns about individual tools.

## Surveys administration: URL-driven exploration

The surveys module administers the platform's core object: surveys, their folders, and the interview sessions they generate. Its signature pattern is **URL-driven explorer state**. The folder being browsed is a query parameter; archive filters and view mode are too. The header counts and the listing read the *same* parsed filter object, which mattered more than it sounds: an earlier version let the two drift, and users saw counts that didn't match the list (a cache-divergence bug that only exists when two code paths can express "the current filter").

The other reusable pattern is **dialog composition**. Every action on a survey — assign, details, import — is a sub-dialog, and one `survey-dialogs.tsx` component aggregates them, each with its own local `useState` for open/closed. Route pages stay thin; features own their own chrome.

## The admin area: filters, tables, and tabs

The admin module is audit-heavy: bot event logs, delivery logs, top users, a statement pipeline, prompt inspection. It looks like three features copy-pasted, because structurally it is: every sub-feature is **filters component + table component + tab**, with debounced filter hooks so typing in a search box doesn't fire a request per keystroke, and streaming log hooks for the live surfaces.

The boringness is the achievement. When a new audit surface was needed — say, push delivery logs — the skeleton (tab, filters, table, hook) was copy-paste-and-rename, and the entire diff that needed real thought was the API hook and the column definitions. Predictability is a feature of architecture, not an accident of taste.

## The shared skeleton

Across all three modules the shape is identical:

```
feature/
  components/     (render atoms and props; no fetching, no socket logic)
  hooks/          (TanStack Query wrappers, stream hooks, debounced filters)
  lib/ or services/ (wire protocols, upload logic — the only impure code)
  types/          (feature-local types; backend types are generated)
```

Components never fetch; hooks never render; `lib/` is the only place that talks to the network. It is the frontend mirror of the clean-architecture rule from [part 1](/blog/techstack-challenges-engineering-standards-as-code/) — the Dependency Rule, with `components` as the domain, `hooks` as application services, and `lib` as the adapter. Once you see it, the whole webapp reads as one module repeated thirty-seven times.

## What I would copy

Three things: the structural save-diff (never boolean dirty flags), the registry pattern for tool renderers (open-ended extension points without speculative abstraction), and the rule that components never touch the network. The last one is enforced socially rather than mechanically — an import-lint rule for it is on my list for the next project.

Next in the series: the documentation service — a FastAPI app that parses its own source code with tree-sitter, embeds it, and answers questions about itself.
