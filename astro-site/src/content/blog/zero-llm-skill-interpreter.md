---
title: 'Compile Once, Run Without a Model: A Zero-LLM Interpreter for Learned Skills'
description: 'What if a language model compiles a procedure once and never runs again? A skill compiler with hard structural gates, a zero-model interpreter that walks the graph in plain code, and a trust ladder that must be earned run by run.'
pubDate: 2024-03-19
series: 'Algorithm Implementations'
seriesOrder: 8
categories: [ai, algorithms]
tags: [llm, interpreters, state-machines, trust, safety, agents]
heroImage: /assets/img/posts/zero-llm-skill-interpreter/thumbnail.png
heroAlt: 'Compile Once, Run Without a Model: A Zero-LLM Interpreter for Learned Skills'
---

Large language models are expensive, slow, and non-deterministic — fine for the open-ended part of a task, terrible for its repetitive skeleton. A pattern worth knowing: **let the model compile a procedure once, then execute that procedure with zero model calls, forever.** This post walks through the design: a compiler with loud refusals, a strict graph language, a plain-code interpreter with cold resume, and a trust system that promotes procedures to autonomy only after they've proven themselves.

## The shape of the idea

Users repeatedly perform multi-step procedures ("compile the weekly report", "onboard a new participant"). We want the system to *learn* the procedure from demonstrations and later run it unattended. The architecture has three parts:

1. **Compiler** — one expensive model call that turns demonstrations into a structured `SkillGraph`. The *only* model call in the feature.
2. **Interpreter** — plain code that walks the graph. Never imports anything that talks to a model. `model_calls` is hard-zero by construction, not by hope.
3. **Trust ladder** — `learning → trusted → second_nature`. Top stage means: runs unattended, no human in the loop, because it has earned it.

## The graph language: closed, small, boring

The graph is a DAG of nodes with four kinds — nothing else exists:

- **action** — call one tool with arguments bound from earlier results
- **guard** — ask the human a yes/no-or-value question when a condition holds; the answer *binds* a name for later nodes
- **branch** — first matching condition wins; chooses the next node
- **terminal** — done

Conditions form a closed expression language: `eq, ne, lt, lte, gt, gte, in, contains, exists, not, all, any, always`. Two rules keep it safe:

- **Left side is a binding reference, right side is a literal only.** Never a reference on both sides, never `eval`. The language can *test data*, never *execute data*.
- **Total evaluation.** Missing paths yield "missing"; every operator returns `False` on missing input; `not` requires exactly one operand; `all` of nothing is `True`; an unrecognized operator is `False`. Conditions **never raise** — the interpreter has exactly one control-flow mechanism (the refusal), not two (refusals and exceptions).

Branches are first-match-wins, evaluated top to bottom. That determinism is load-bearing: the same graph + same bindings always walks the same path.

## The compiler: one call, then gates

The compiler renders the demonstration episodes into a prompt and asks the model for structured output — a graph JSON. The model's output is *a proposal*, and everything after the call is defense:

1. **Cycle check** — DFS with white/grey/black coloring over `next` edges and branch `goto`s. Refuse if any cycle exists. (The language requires a DAG; the gate enforces it.)
2. **Dangling references** — every edge target must be a declared node; `entry` must exist.
3. **Observed tools only** — every `action.tool` must appear in the union of tools observed across the demonstrations. The model may not invent a tool it was never shown; if the procedure demonstrably used `send_email`, fine — if it fabricates `delete_database`, refused.
4. **Binding-only arguments** — action arguments must be `{{binding}}` references, never literal observed data. The graph is a *shape*, not a transcript: "email the {{manager}}" is a procedure; "email alice@example.com, subject 'Q2 review'" is a one-off that happens to look like one.
5. **No counters on a zero-model graph** — if the model requests counters/call budgets, refuse rather than silently ignore. Honest refusal beats silent truncation.

Then default assertions are stamped: `max_steps`, `max_duration_seconds`, `max_model_calls = 0` (forced). The graph gets a canonical hash — serializing the model dump with sorted keys, then SHA-256 — which becomes its identity for teaching and import verification.

The posture throughout: **never coerce.** Every gate failure produces a refusal with the full reason list. The model is a brilliant intern with no judgment; the gates are the judgment.

## The interpreter: plain code, five rules

The walk is a loop, not a framework:

```
loop:
  node = graph.nodes[current]
  unknown node?              → refuse + evidence
  already visited, not terminal? → refuse (loop guard)
  terminal? → break
  action?
    learning stage: park — propose the call, ask a human to approve
    trusted stage:   verify tool ∈ granted_tools; resolve {{bindings}}; call; steps++
  guard?
    condition false → skip (one step)
    condition true  → park; ask the guard's question; the answer binds a name
  branch?
    first matching condition wins → follow its goto
  after each step: watchdog check
```

Five rules make this boring in the right way:

**1. Fail closed everywhere.** No tool dispatcher wired → refuse, never fake a result. Tool not in `granted_tools` → refuse. Unknown node kind → refuse. Generation (a version stamp on the graph format) mismatch → refuse. There is no path where the interpreter "does its best".

**2. Evidence before refusal.** Every refusal writes an evidence record first, then raises. The type system marks the raise function as `NoReturn` so the compiler enforces that no code path continues after a refusal. Auditability isn't a log you add; it's the only way the interpreter exits.

**3. Cold resume from the row.** When a guard parks the run, the interpreter writes its continuation state (current node, bindings, visited set) into the durable task row *before* raising. Resumption — potentially in a different process, minutes later, after a deploy — reads only that row. No closures serialized, no in-memory continuations. If the resume path can't be executed by a completely fresh process, it's not a resume path.

**4. Bindings are total.** A `{{path.to.value}}` reference resolves to a missing sentinel when absent; every consumer handles it. Partial bindings make the difference between "the human skipped question 3" (which conditions handle as `False`/`exists → False`) and an unhandled exception in the middle of an unattended run.

**5. The watchdog runs after every step.** Steps, wall-clock duration, model calls (always zero — if the count somehow moves, that's a breach), and assertion counters are checked in a fixed order; the first breach ends the run with a typed reason.

## The blast-radius gate

Before a graph can publish (leave its owner's workspace), one more check — a static analysis over the graph:

1. A **destructive tool** (send, delete, revoke, pay, submit — an enumerated set) reachable from a node whose arguments reference a *guard-bound* binding — i.e., user-controlled data flowing into a destructive call — is refused.
2. A **branch whose condition references a binding on the right side** (fan-out bounded by input data) is refused — the model shouldn't be able to turn one learned procedure into a spam cannon by branching on attacker-controlled values.
3. A destructive action reachable **without passing an unconditional guard** (`when` absent or `always`) is refused — every destructive path must route through an explicit human checkpoint.

These are compile-time refusals with the full reason list. The model cannot talk its way past them, because by the time they run, the model is gone.

## The trust ladder

Skills start in `learning`: every action is proposed to a human before it runs. Promotion is computed from evidence, never granted:

- **Learning → trusted** (streak of 5): the last 5 runs were *clean* (completed, no watchdog breaches) **and** *unmodified* (no human overturned a guard or edited an action's arguments).
- **Trusted → second nature** (streak of 10): same, **plus** zero model calls in every run — which is automatic, but the assertion is kept explicit so a future refactor that sneaks a model into the loop breaks the invariant loudly.
- **Demotion is automatic**: one breach drops the skill one stage and writes `demoted` evidence. A skill that errs returns to human supervision *immediately* — no threshold, no grace count.

The streak is recomputed from the run history on each evaluation, never incremented and trusted. Recompute-from-source is the only streak you can believe; an incremented counter can drift, be restored from backup, or be reset by a bug — the history cannot.

## Teaching: shape, not data

A learned skill can be exported as a *teachable packet*: the graph, its canonical hash, the granted-tool list, and a data-free description. No episodes, no owner, no run history. Importing verifies the hash (the shape must be identical), retires any live skill with the same name, and inserts the new one **at `learning`** — regardless of how mature it was at its origin. Trust is earned by the *runs in this environment*, never inherited.

## Takeaways

1. **One model call per skill, at compile time.** Execution is plain code — auditable, deterministic, fast, free.
2. **The model proposes; the gates dispose.** Cycles, dangling edges, invented tools, literal arguments, counter requests — all refused loudly with reasons, never coerced.
3. **Total evaluation and binding-only arguments** keep the graph language incapable of surprising you.
4. **Refusal writes evidence first; resume reads only durable state.** Any fresh process must be able to continue a parked run.
5. **Autonomy is earned by clean, unmodified runs and lost instantly on breach.** Promotion recomputed from history; imports always land at `learning`.

The broader lesson: LLMs are extraordinary *compilers* of demonstrated intent into structured procedures. The mistake is leaving them in the loop at execution time. Extract the procedure, verify it, walk it in boring code — and keep a ledger that decides, from evidence alone, when it's allowed to stop asking permission.
