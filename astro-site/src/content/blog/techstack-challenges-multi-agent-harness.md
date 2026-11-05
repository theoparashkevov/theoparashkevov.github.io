---
title: 'Techstack Challenges, Part 14: Nine Agents, One Harness, and a Skeptic'
description: How the team scaled LLM-assisted development with specialized agents, an adversarial test-triage workflow, and hooks executed by the harness — the layer that instructions cannot override.
pubDate: 2026-07-14
updatedDate: 2026-07-14
categories:
  - ai
  - software-engineering
tags:
  - llm-agents
  - workflows
  - hooks
  - code-review
  - automation
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 14
---

## Introduction

Part 14 of **Techstack Challenges**. This series has covered the platform's services; this post covers the machinery used to *build* them. Over two years the team went from "one assistant in an editor" to a structured multi-agent setup: nine specialized agents, a phased adversarial workflow for triaging test failures, hooks executed by the harness itself, and settings that inject the team's rules into every session. It is the most opinionated developer-experiment I have been part of, and the parts that survived deserve a write-up.

## Agents as job descriptions, not chat personas

Each agent is a Markdown file with YAML front matter: a name, a trigger description ("when to use"), an allowed tool list, and boundary rules. The discipline is that the agent definition reads like a job posting, not a persona:

- A **backend tester** (real Postgres via fixtures, async test client, never mock the DB where the real pattern uses it, never weaken an assertion to make a test pass).
- A **frontend tester** (co-located tests, per-test query client, and a mandatory verification gate after implementation).
- A **code reviewer** that *reads the standards files first* and groups findings by a 0–100 severity score, where below 25 is suppressed and above 90 is critical.
- An **intent clarifier** with a hard cap of four questions and explicit safe defaults — clarification without the interrogation.
- A **UX tester** running cross-service end-to-end journeys in a browser, the only agent whose whole job is catching contract breaks between services.
- Read-only planners (sprint state, environment inspection) that return structured JSON and never write.

Two design rules run through all of them. First, **read before write**: every agent's instructions open with what to read first (existing tests, `CLAUDE.md`, the skill files) before any tool call that mutates. Second, **report evidence, never vibes**: a green checkmark requires pasted output — pass/fail logs, not recollection. An agent that claims green unobserved is worse than no agent.

## The workflow with a skeptic built in

The most interesting artifact is a phased workflow for the miserable task of triaging a large failing test suite. It runs in three phases:

1. **Classify.** One agent per failing directory reads the failures and files structured findings: test, cause, category (`stale-test`, `product-bug`, `harness-defect`, `needs-owner`), recommendation (`fix`, `skip`, `escalate`), evidence.
2. **Verify.** *Independent* agents adversarially try to refute each classification — same schema, opposite incentives.
3. **Synthesize.** A final pass merges what survived into a fix-or-skip list with named owners.

The verification phase exists for one reason, stated in the workflow's own comments: **`stale-test` is the comfortable wrong answer.** It is always available, it always sounds plausible, and acting on it licenses rewriting assertions until they ratify a regression. A classification that survives a dedicated skeptic trying to refute it is worth acting on; one that only survives its author's enthusiasm is not. The insight generalizes beyond tests: in any triage system, name the "comfortable wrong answer" and give it an adversary.

Concurrency is bounded — one level of workflow nesting, a cap tied to core count, writers isolated in worktrees, readers never writing. Before the first tool call of any substantial task, the harness expects a parallelism declaration: what's independent, what overlaps, who writes where. It reads like ceremony until you've watched two agents collide on the same generated file.

## Hooks: the layer instructions can't reach

The repo has non-negotiable rules — branch from the integration branch (never from main), every PR carries a unified handover format, certain verification steps must precede opening a pull request. Rules like this fail when they live only in instructions, because instructions argue with instructions; a well-phrased prompt can talk its way past a rule that is just text.

So the enforcement moved into **hooks executed by the harness**, not by the model:

- A **pre-tool-use hook** refuses to open a PR without a fresh verification receipt for the branch. It fast-paths away in milliseconds when the command isn't PR-related, so it costs nothing on the 99% of calls that don't involve `gh`; when it does trigger, it extracts the command payload, strips heredoc bodies (so commit messages mentioning `pr create` don't false-positive), and checks the receipt. It checks *freshness*, not greenness — a failing suite still yields a receipt, and honesty about that boundary is documented in the hook's own comments.
- **Worktree hooks** replace the default worktree behavior entirely: new worktrees branch from the integration branch, and environment files are seeded from the repo so a fresh worktree is runnable in one step. The branch-base rule — branch from integration, never from main — is no longer a rule anyone can accidentally forget; the harness enforces it mechanically.

The hooks use `set -euo pipefail`, fail closed, and each documents its stdin/stdout contract in a header comment. They are explicitly labeled *not a security boundary* — anyone can bypass them from a plain terminal — and that honesty matters. Their job is to make the right thing the default, which is most of what process is for.

## Settings that remember the rules for you

Project settings inject three reminders into every prompt: consult current framework documentation before writing framework-dependent code; invoke the clarifier before non-trivial features; declare parallelism before the first tool call. A separate settings file scopes permissions — which services the agents may talk to, which secrets-adjacent commands are allowed — and keeps personal tooling (local MCP servers, personal workflow permissions) out of the committed file. Separation of project policy from personal preference, as files, is the whole trick.

## What survived, honestly

Not everything did. A verification-attribution program that recorded per-branch verification receipts was suspended after cost drift turned a 5-minute estimate into a two-hour session — the hook survived the program. The lesson portfolio is real too: an agents documentation folder collects what multi-agent coordination actually costs (collision policies, base-commit drift between worktrees, integration rounds) without pretending it is free.

What survived: specialists with explicit boundaries, an adversarial verification step with a named comfortable-wrong-answer, harness-enforced hooks for the two rules that matter most, and evidence-or-it-didn't-happen as the reporting contract. That set, plus the standards files from [part 1](/blog/techstack-challenges-engineering-standards-as-code/), is what made agent-assisted development scale past one careful power user to a whole team.

Next: what happened when those standards met real code — boolean flags that became two functions, duplication that stayed duplicated on purpose, and import invariants enforced by tests.
