---
title: 'Long-Term Memory for Conversational Agents: Extraction, Guardrails, and Hierarchical Retrieval'
description: 'How does an assistant remember you across sessions? A speaker-attributed extraction pipeline with dedup and rate limits, three isolation scopes, and a retrieval hierarchy that ranks topics, decays by recency, and never truncates silently.'
pubDate: 2024-05-14
series: 'Algorithm Implementations'
seriesOrder: 12
categories: [ai]
tags: [memory, rag, llm, embeddings, pgvector, retrieval, agents]
heroImage: /assets/img/posts/conversational-memory-extraction-retrieval/thumbnail.png
heroAlt: 'Long-Term Memory for Conversational Agents: Extraction, Guardrails, and Hierarchical Retrieval'
---

"Remember that I'm a vegetarian and my daughter is named Maya." A conversational agent that retains facts across sessions feels qualitatively different from one that starts blank every time — but building that memory is a minefield of wrong attributions, duplicate facts, stale context, and privacy bleed. This post covers the three subsystems that make it work: an extraction pipeline that turns conversations into structured memory, guardrails that keep the pipeline honest, and a retrieval system that assembles the right context at session start.

## The extraction pipeline: conversations to facts

Trigger: when a session ends (or a websocket disconnects), a background task distills the transcript into memory. The pipeline is **speaker-attributed** — and that attribute is the first correctness line:

**Speaker partitioning.** Messages are grouped by sender id. Two filters apply immediately: any sender id that isn't a parseable user UUID is dropped (bots, system senders, malformed values — excluded by construction, not by name-matching), and each *human* speaker is processed in isolation with its own database session, so one speaker's extraction failure never rolls back another's. The meeting organizer must not silently receive everyone's extracted facts; each participant accrues only their own.

**Quality gate.** Not every utterance deserves memory. A classifier splits kept/dropped by meta-conversation patterns ("can you hear me?", "thanks, bye") — phatic and housekeeping speech yields no facts.

**Sub-extraction (each an LLM call in JSON mode, low temperature):**
- *Episode*: title, summary, short transcript excerpt per speaker-bucket.
- *Facts*: subject–predicate–object triples, each with a role (`core`, `context`, `detail`, `temporal`, `causal` — a closed, configurable vocabulary; unknown roles dropped) and a confidence/weight. Capped per episode (e.g. 50) — an unbounded extractor turns one meeting into ten thousand trivia facts.
- *Topics*: an LLM matcher decides *merge into an existing user-owned topic* or *create new*. Merge-into-someone-else's-topic is rejected; the topic vocabulary is user-owned.

**Idempotency.** The pipeline is keyed on `(session_id, speaker_user_id)`: a second run for an already-processed speaker is a no-op. Reconnects and retries therefore don't duplicate memory.

**Structured evidence.** If the session had explicit goals (an interview with goal tracking), terminal goals convert into `core`-role facts attributed to the session *owner* only. And if the session's counterpart was a virtual persona rather than a human, every extracted row is stamped with that persona id — which sets up the isolation story below.

## Guardrails: cap, dedup, quota — in that order

Uncontrolled extraction turns memory into noise. Three guards, applied in a deliberate order per candidate fact:

1. **Confidence cap** — facts below a confidence floor never reach the dedup stage.
2. **Semantic dedup** — embed the candidate and compare against recent facts by cosine distance; a near-duplicate doesn't insert a new row, it *reinforces* the existing one (incrementing a `reinforced_count`). Memory should deepen with repetition, not widen.
3. **Daily quota** — a per-user cap on new inserts bounds cost and abuse. Over-quota candidates are skipped, not errors.

The order matters: dedup before quota means an already-known fact (a reinforcement) never burns quota; quota-skipped candidates leave no partial state.

## Isolation: three scopes

Memory rows carry three nullable scope keys — `user_id`, `vperson_id`, `agent_id` — and every read filters on all three:

- **`vperson_id` None vs. set splits the human graph from virtual-persona graphs.** A persona's memory and its human operator's memory are fully isolated in both directions; partners' facts never bleed into a persona's graph and vice versa.
- **`agent_id`** (nullable) scopes to the assistant instance that wrote the memory — preventing cross-agent bleed when one user talks to several different agents.

These keys are threaded through *every* level of retrieval (topic → episode → fact), enforced in the SQL where clauses and — because some post-filtering happens in code after graph walks — re-checked as post-filters too. Scoping is only real when it's defense-in-depth.

## Vector storage: raw SQL on purpose

Embeddings live in Postgres with pgvector. The insert path uses raw SQL (`CAST(:embedding AS vector)`) rather than the ORM — a deliberate workaround: the SQLAlchemy type binder and the asyncpg pgvector binary codec both claim the bind parameter and disagree on wire format. The raw-SQL bypass, rendering the vector as a literal string, is the documented, tested escape hatch. Similarity uses cosine distance (`<=>`), with the vector index created by migration.

## Retrieval: hierarchy plus fusion

Session start needs context assembly in one call. The retrieval is hierarchical, with the same hybrid machinery as document search (full-text, vector, or both fused by Reciprocal Rank Fusion with `k=60`):

1. **Rank topics** matching the current context (full-text via `tsvector`, vector via embedding the query, or RRF over both).
2. **Walk edges** from scored topics to their episodes: `edge_score = edge_weight × recency_decay(last_episode_at)`, where `recency_decay(age) = 0.5 ** (age_days / half_life)` — exponential half-life decay (default 30 days, configurable). Old topics fade smoothly; nothing is hard-cut.
3. **Pull candidate facts** from scored episodes, filter by the three scope keys, sort by `(role_priority, -weight, -episode_score)` — core facts first, heavy facts first, well-attested episodes first.
4. **Cap with disclosure.** The assembled context has a character budget (e.g. 4000). If facts must be dropped, the response states exactly what was withheld: "Showing 8 of 12 facts; withheld oldest 4." Silent truncation of identity-shaping context is a failure mode that produces subtle, unreproducible assistant misbehavior; disclosure converts it into an observable decision.

## Persona-first injection with an authorship disclaimer

The reserved topic holding the persona description is always rendered first — and carries a header explicitly disclaiming authorship, stating that the following was written *about* the persona (possibly by other people), not *by* it. Without that sentence, a model reads partner-authored persona text as its own voice and history — a small line of text that prevents a large class of confabulation. If persona facts are withheld by the budget, the disclaimer says that too.

Session-recall framing matters equally: facts from previous sessions are introduced with a header marking them as *a different, finished conversation* — otherwise the model confuses past-session answers with the current session's state and responds to things that were never said in this room.

## Takeaways

1. **Speaker-attributed extraction** with bot exclusion, per-speaker transactions, and `(session, speaker)` idempotency — attribution errors are the worst memory bugs.
2. **Guardrails in order: confidence cap → semantic dedup (reinforce, don't duplicate) → daily quota.**
3. **Three-scope isolation** (`user` / `vperson` / `agent`) enforced in SQL *and* post-filter.
4. **Hierarchical retrieval**: rank topics, walk weighted edges with half-life recency decay, sort facts by role and weight, cap with explicit disclosure.
5. **Persona context gets an authorship disclaimer; past sessions get a "different conversation" header** — framing text is cheap, confabulation is expensive.

Memory is not a database feature; it's a set of disciplined pipelines — what to extract, whose it is, what to drop, what to surface, and how to frame it. Get the disciplines right and the agent changes from a stateless parrot into something that demonstrably knows you — without ever confusing whose memory is whose.
