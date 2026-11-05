---
title: 'Techstack Challenges, Part 4: The Documentation Service That Reads Its Own Source'
description: Building a FastAPI service that parses a large polyglot repo with tree-sitter, indexes it with embeddings and FAISS, generates architecture diagrams on demand, and answers natural-language questions about the codebase.
pubDate: 2025-05-20
updatedDate: 2025-05-20
categories:
  - software-engineering
  - ai
tags:
  - documentation
  - tree-sitter
  - embeddings
  - faiss
  - fastapi
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-docs-service/thumbnail.png
heroAlt: 'Title card reading "The Docs Service That Reads Its Own Source" with the subtitle "Parse, index, diagram, answer" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 4
---

## Introduction

Part 4 of **Techstack Challenges**, my series on an anonymized B2B analytics platform. So far: [engineering standards as code](/blog/techstack-challenges-engineering-standards-as-code/), the [React stack](/blog/techstack-challenges-modern-react-stack/), and its [feature modules](/blog/techstack-challenges-feature-modules/). This post is about one of my favorite services in the whole system: the docs service. Its job description is a single sentence — *explain this codebase to anyone who asks* — and it does it by literally reading its own source code.

The repo it documents is huge and polyglot: a 350k-line Python monolith in the middle of a slow, careful restructure, plus TypeScript services, plus Kubernetes manifests. Onboarding engineers kept asking the same questions. Instead of writing more wiki pages that would rot, the team built a service that derives the answer from the code every time.

## The pipeline: parse, analyze, index, answer

The service has four phases, each replaceable:

**Parse.** Tree-sitter grammars parse Python and TypeScript into structured JSON — imports, classes, functions, FastAPI routes, SQLAlchemy models, with a regex fallback if tree-sitter fails to import. The output is deliberately plain data (`file_path`, `module`, `imports`, `classes`, `routes`, `models`) dumped into a `parsed/` directory. Parsing is separate from everything downstream so you can re-run it, diff it, and debug it as files.

**Analyze.** Four analyzers read the parsed JSON: a dependency graph builder, an API route extractor, a component analyzer, and a schema analyzer. Each implements the same `load_from_parsed_files()` contract, which keeps the analysis layer boring and testable.

**Index.** Chunks go to OpenAI's `text-embedding-3-small`, stored in FAISS — five separate indexes (backend, frontend, models, API routes, infrastructure) so retrieval can be scoped. A SQLite metadata store maps vector IDs back to file paths and line ranges.

**Answer.** A Q&A router assembles retrieved context, builds a prompt, and runs a conversation with a frontier model. The UI is a small React app — four pages: home, diagrams, Q&A, search — built with Vite and served by FastAPI's static mount, so the whole service ships as one container with no separate frontend deployment.

## Diagrams on demand

The feature that sold everyone was diagrams. Because the analyzers already know the routes, models, and dependencies, a diagram service can generate an API map, a component diagram, an ER diagram, or a data-flow diagram — as Mermaid, SVG, or PNG — with an hour-long cache. A webhook endpoint lets CI trigger a reload of the parsed data after merges, so diagrams track the codebase instead of drifting from it like the wiki diagrams they replaced.

The lesson generalizes: **documentation survives only when it is cheaper to regenerate than to edit.** A Mermaid diagram generated from the route table cannot be wrong in the way a hand-drawn one can.

## What did not work

Being honest about the failure modes, because there were several:

- **Retrieval quality dominated everything else.** The naive version embedded whole files, and answers were confidently generic. Chunking by function, scoping to the right index, and keeping the metadata store precise mattered far more than the choice of embedding model.
- **Generated answers needed guardrails.** The Q&A layer works only because retrieved context is quoted into the prompt — the model answers *from the retrieved snippets* rather than from memory. Without that, it happily described the codebase as it was a training cutoff ago.
- **The tree-sitter parsers needed fallbacks.** Tree-sitter is robust but not omniscient; the regex fallback looks inelegant and saved the pipeline more than once on exotic syntax.

## Where this fits

The docs service is the practical half of the documentation philosophy in this repo; the other half is a strict Diátaxis taxonomy (reference, explanation, how-to, tutorial each in their own place), ADRs for every significant decision, and an evidence-first writing culture where a claim without a `grep` output, a line number, or a commit reference is treated as suspect. That culture — and the nightly database refresh that keeps staging honest — deserves its own post.

Next: why this repo treats documentation as load-bearing infrastructure, including documentation that the *running code* reads.
