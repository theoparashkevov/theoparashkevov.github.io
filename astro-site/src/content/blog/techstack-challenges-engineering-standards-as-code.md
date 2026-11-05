---
title: 'Techstack Challenges, Part 1: Engineering Standards You Can grep'
description: The first post in my Techstack Challenges series, about a client engagement where the coding standards were not a wiki page but executable files in the repo, loaded by both humans and coding agents before every change.
pubDate: 2025-01-14
updatedDate: 2025-01-14
categories:
  - software-engineering
  - ai
tags:
  - clean-code
  - clean-architecture
  - engineering-standards
  - llm-agents
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 1
---

## Introduction

Over the past two years I spent a large chunk of my time as a consulting engineer embedded in one product team — a B2B analytics platform, let's call it **Meridian**. The codebase is big, polyglot (Python, TypeScript, C#), deployed on Kubernetes, and by now it has more than a dozen cooperating services: an API, a web app, an auth service, a notifications service, a push service, a meeting bot, a voice agent, and a documentation service that literally reads its own source code.

This series is my attempt to write down the interesting engineering problems from that engagement — the ones where the textbook answer was not enough. Everything is anonymized: product and company names are changed, hosts and phone numbers are fictional, and internal ticket numbers are dropped. The technical content is real.

I want to start where every change in that repo starts: the standards.

## Standards as files, not folklore

Every serious team has coding standards. Most of them live in one of three places: a wiki nobody reads, a code review culture that varies by reviewer, or the head of the most senior engineer. Meridian had a fourth option, and I have come to believe it is the only one that scales: **the standards live as Markdown skill files inside the repository**, and both humans and AI coding agents are required to load them before writing or reviewing code.

There were five of them: `clean-code`, `clean-architecture`, `api-design`, `db-design`, and `design-patterns`. Loading them was not optional — the agent instructions said so explicitly, and the rule applied at review time too. *"I already know it" was not a reason to skip.* That last sentence turned out to matter more than the rules themselves, and I will come back to it.

## The rules that earned their keep

Two years in, which rules actually changed behavior and which were wallpaper? Here are the ones I watched make a measurable difference.

**No boolean flag parameters.** A boolean that selects between two sentences of behavior must be two named functions. This sounds pedantic until you read a call site like `transfer_record(record, on_import=True)` and realize you have to open the definition to learn what `True` means. Two functions — `transfer_record_to_archive`, `transfer_record_from_archive` — read correctly at every call site, forever. The rule shows up constantly in reviews, including a case where a five-parameter survey tool was refactored into a typed request object.

**Guard clauses over nesting.** Anything deeper than two levels of nesting is a smell to fix, not to commit. This single rule probably deleted more cyclomatic complexity than any linter.

**Duplication is about change reasons, not resemblance.** Two blocks that look alike should only be merged when they represent the same concept and will change for the same reason. The repo had a beautiful counter-example: about seventy lines of refusal preamble duplicated across seven renderers. Everyone wanted to extract it, and everyone was right to resist — the renderers had drifted on purpose, and the contract was exactly what a later correction changed in all seven at once. When the change reason finally aligned, extraction was trivial. Resemblance alone is not duplication.

**The database is the last line of defense.** Application validation is UX, not integrity. Every invariant that must always hold is a constraint: `NOT NULL`, `CHECK`, `UNIQUE`, foreign keys with deliberate `ON DELETE`. Never check-then-insert for uniqueness — the `UNIQUE` constraint is the authority, not a prior `SELECT`. And no read-modify-write when an atomic conditional update works: `UPDATE … SET x = x - :n WHERE id = :id AND x >= :n RETURNING x`, where zero rows returned means refused.

**No silent last-write-wins.** Mutable resources carry a version; updates are compare-and-swap. One of the services has a settings store where every write is an `INSERT … ON CONFLICT DO UPDATE WHERE settings_version = expected` — concurrent editors get a clean conflict instead of a lost update.

## The architecture half

The `clean-architecture` skill enforced the Dependency Rule — source dependencies point inward, `adapters → application → domain`, and domain code never imports a framework, ORM class, HTTP type, or vendor SDK. This is easy to agree with and hard to enforce, so the repo enforced it with **import-invariant tests**: an AST walk asserts that the domain layer never imports `httpx`, and the test fails in CI. Not grep — an AST walk, because function-local imports are exactly how violations hide.

The other architectural choices that stuck: package by capability, not by technology (you get `atom/`, `chat/`, `survey/` — never a top-level `controllers/`), route handlers that only translate (parse input, build a request object, call a use case, map the result — zero business decisions), and boundary data as plain structures, never ORM entities crossing into the API layer.

## What I actually learned

The counterintuitive lesson is that the *file format* was the win. Because the standards were ordinary Markdown in `.claude/skills/`, they could be:

1. **Loaded by an LLM agent** before every change, which made the standard the reviewer's yardstick rather than a memory;
2. **Cited precisely** — review comments referenced rule names and even section numbers, and a wrong citation (`clean-architecture §9` — that skill has no §9) was itself caught;
3. **Versioned** alongside the code they govern, so the standard's history explains the code's history.

A wiki page cannot do any of the three.

The second lesson: standards only work when they forbid something. "Write clean code" forbids nothing. "No boolean flags, nesting ≤ 2, typed exceptions, no `util` in names" forbids concrete things, and concrete things get enforced.

Next up in this series: the frontend — a React 19 app built on TanStack Router, Jotai atoms, and a `containerClassName` convention that fixed a whole class of visual bugs.
