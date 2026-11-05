---
title: 'Techstack Challenges, Part 2: A Modern React Stack, Held Together by Conventions'
description: How the Meridian web app picked React 19, TanStack Router and Query, Jotai, and Tailwind v4 — and why the most valuable piece of the design system was a single prop called containerClassName.
pubDate: 2025-02-25
updatedDate: 2025-02-25
categories:
  - web-development
  - software-engineering
tags:
  - react
  - tanstack
  - jotai
  - tailwind
  - design-system
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 2
---

## Introduction

This is part 2 of my **Techstack Challenges** series about a two-year engagement on an anonymized B2B analytics platform. [Last time](/blog/techstack-challenges-engineering-standards-as-code/) I wrote about engineering standards living as executable Markdown in the repo. This time: the frontend — a React app with 37 feature modules, a generated OpenAPI contract, and one small naming convention that quietly fixed an entire class of bugs.

The stack, briefly: React 19, Vite 7, TanStack Router with file-based routing, TanStack Query for server state, Jotai atoms for client state, Tailwind CSS v4, shadcn/ui over Radix, and Sentry for error tracking. None of these choices is exotic. What made the app pleasant to work in was not the stack — it was how strictly the state boundaries were kept, and how the design system encoded its rules into props.

## Three kinds of state, three owners

The single most important architectural decision was a hard rule about where state lives:

- **Server state** belongs to TanStack Query. Sessions, messages, folder listings, audit logs — anything that comes from an API and has loading, error, and cache semantics. Custom hooks wrap the queries (`use-get-session-messages`, `use-folder-contents`), and components never call `fetch` directly.
- **Client state** belongs to Jotai atoms. Chat streaming state, selected surveys, open dialogs — reactive UI state that never needs a server round trip. Crucially, no hand-rolled event emitters anywhere; a rule from the design patterns standards forbids them outright, because Jotai already is the reactivity layer.
- **URL state** belongs to the router. Filter selections, folder IDs in the explorer, view preferences — if a user would want to share or bookmark it, it lives in `useSearch` params, not in `useState`.

The payoff shows up in features like the surveys explorer, where folder navigation, archive filters, and view mode all survive a page refresh and a copy-pasted link, with zero extra code — the URL *is* the state. The danger zone in most React apps, duplicated server data mirrored into component state, simply does not exist here.

## The API contract loop

A full-stack feature in this repo flows in one direction: SQLAlchemy model → Pydantic schemas → controller → FastAPI router → `pnpm api:types` → generated TypeScript types → UI. The webapp's `backend-types.ts` is generated from the live OpenAPI spec with `openapi-typescript`, and a script enforces the `// @ts-nocheck` header so nobody hand-edits it. The UI imports generated types and nothing else.

This closes the loop that plagues most TS/Python products: the drift between what the backend returns and what the frontend assumes. When a field is renamed, type-check goes red before anyone clicks anything.

## containerClassName: the convention that saved the design system

The design system's interactive primitives — `Button`, `Input`, `Textarea`, `SelectTrigger`, `PopoverTrigger` — are animated wrappers. The wrapper is a motion-enabled element that renders a gradient border and handles hover effects; the real input or button sits inside it. That creates a styling problem with two distinct concerns:

- **Footprint**: is this control full width? Does it flex? Margins, grid placement, overflow.
- **Visuals**: padding, height, colors, borders, shadows.

The convention: `containerClassName` styles the outer wrapper (the footprint), `className` styles the inner element (the visuals). Footprint classes like `w-*`, `flex-*`, grid, and margins go on `containerClassName`; height, padding, and color go on `className`.

Why does this matter? Because the most common visual bug in the app — controls not filling their allotted grid cell, or unexpectedly stretching — was caused by developers putting `w-full` on the inner element while the wrapper stayed content-sized. Once the convention was written down ("footprint goes on the container"), those bugs stopped appearing, and code review had a one-line answer for them.

My takeaway: design systems fail at the seams between layout and appearance. Naming the two concerns separately, at the prop level, is cheaper than any lint rule and more durable than documentation.

## Verification as a non-negotiable sequence

Every frontend change ran the same sequence before merge: `lint` (zero warnings allowed), `type-check`, `test` (Vitest, jsdom), then three LLM-agent passes — a React-specific doctor (hooks rules, dependency arrays, render bugs), a security and accessibility reviewer, and a simplifier that hunted duplication and dead code. Warnings were grouped by severity and triaged with the user, never silently fixed.

I was skeptical of agent reviewers at first. Two things won me over: they ran the same deterministic checks every time, so nothing depended on reviewer fatigue, and their findings were *citable* — a finding referenced a rule from the skill files, which meant the conversation was about the rule, not about taste.

## What I would copy

If I started a React app tomorrow, I would copy three things without hesitation: the hard three-way split of state, the generated-types contract loop, and a prop-level naming convention that separates footprint from visuals. The specific libraries matter less than the discipline that each kind of state has exactly one owner.

Next: the three most complex feature areas of that app — a real-time assistant console, a survey administration surface, and an audit-heavy admin area — and the patterns they share.
