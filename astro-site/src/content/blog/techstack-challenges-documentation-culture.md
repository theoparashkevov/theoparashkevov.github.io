---
title: 'Techstack Challenges, Part 5: Documentation as Load-Bearing Infrastructure'
description: A Diátaxis taxonomy, ADRs that running code reads, evidence-first writing, and a nightly production-to-staging database refresh — how one team made documentation cheaper to keep than to skip.
pubDate: 2025-07-01
updatedDate: 2025-07-01
categories:
  - software-engineering
tags:
  - documentation
  - adr
  - diataxis
  - postgres
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 5
---

## Introduction

Part 5 of **Techstack Challenges**. [Last time](/blog/techstack-challenges-docs-service/) I described a service that generates documentation from source code. This post is about the culture around it — the parts of the documentation system that no parser produces, and what happened when the team treated docs as infrastructure instead of prose.

Two years in, the reference documentation for this anonymized platform was, against all probability, *trusted*. New engineers used it and it was right. Here is what that took.

## One taxonomy, enforced by location

The repo follows Diátaxis strictly, and the enforcement mechanism is brutally simple: each document type has exactly one directory.

- `docs/reference/` — durable explanations of subsystems. Not tutorials, not how-tos.
- `docs/features/` — per-feature durable docs.
- `docs/architecture/` and `docs/legal/` — load-bearing in a literal sense: **running code reads these paths.** Compliance directives and the privacy notice are not adjacent to the code; they are inputs to it.
- `docs/plans/<date>/<branch>/` — branch workspaces. Every non-trivial change gets a dated workspace with a README (goal, locked decisions, ordered resume plan), a CHANGELOG, and numbered action files in execution order. When the branch merges, the durable knowledge moves to reference docs or an ADR and the workspace is archived. The cardinal rule: a plan never duplicates a durable doc — it *points* at it.
- `.claude/docs/` — how work gets done: agent operating procedures, PR handover formats, multi-agent process mechanics.

When a doc lands in the wrong bucket, it rots — everyone has seen a tutorial pretending to be a reference. When the bucket *is* the address, the taxonomy enforces itself.

## ADRs the code reads

Architecture decision records follow the classic Nygard format with two local additions: every ADR carries **plan references** and an **`Enforced by` field naming a real node or test**. That second field is the trick. An ADR that says "the `contracts/` layer must not contain domain names" is a wish; the same ADR with `Enforced by: test_import_boundaries.py` is a fact, because an AST-walk test fails CI when the rule breaks. Layer direction, dependency rules, storage migrations — all ratified as ADRs, all enforced by tests, all with superseded decisions kept verbatim for the reasoning history.

## Evidence-first writing

The house style can be summarized in one sentence: *a claim without a `grep` output, a line number, or a commit reference is treated as suspect.* The restructure plan that guided the monolith cleanup opened with a measurement table — line counts, import graphs, dead-test counts — before proposing anything. An authorization model document presented six evidence claims, each with a verdict and its ground truth, before stating its design.

This does two things. It makes reviews fast (argue with the evidence, not the prose), and it makes docs decays *detectable*: when the code changes, the line number goes stale, and a stale line number is a flag, not a footnote.

The same culture keeps a **dead-identifier ledger**. When a config variable is removed, the docs record the removal, the date, and the consistency evidence (zero hits in the repo). Nothing is silently deleted; deletions are themselves documented facts. Anyone who has tried to determine whether an env var is still read anywhere will appreciate this.

## The nightly refresh: docs that test the database

The most extreme expression of "docs as infrastructure" is operational. A CronJob refreshes the staging database from production every night: `pg_dump`/`pg_restore` with `--clean --if-exists`, a 37-table exclusion list (live credentials, production-bound handles, queue rows), a scrub pass that nulls webhook and OAuth tokens, and a repair step for compliance config. The whole freeze takes about three and a half minutes.

The design details are the interesting part:

- **`lock_timeout` protects the restore from app contention, not the apps from the restore.** Concurrency is bounded, not prevented.
- **The tenant license table is deliberately *not* scrubbed**, because license state is an EU AI Act control and staging must exercise the real compliance path.
- **The refresh has a manual confirmation guard** — an env-var-and-port ritual that makes "run it against the wrong cluster" a conscious act.
- **Version parity is checked explicitly**, because a `pg_dump` version mismatch surfaces as a misleading permission error.

Staging that faithfully mirrors production — minus the toxic parts — is the single best testing asset the team had. "Works on my machine" died because nobody's machine mattered.

## What I would copy

The taxonomy-by-directory, the `Enforced by` field on ADRs, and the dead-identifier ledger all cost almost nothing and pay off for years. The nightly refresh is expensive and worth it only past a certain size — but the *idea* behind it, that your environments are themselves documentation of the system, generalizes for free.

Next: the auth service — Better Auth on Express, an Entra integration with opinions, and the soft-delete gate that fails closed.
