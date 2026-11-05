---
title: 'Techstack Challenges, Part 15: The Rules, Applied'
description: 'Clean-code and clean-architecture standards meeting real code: the boolean flag that became two functions, the 70 duplicated lines that stayed duplicated on purpose, and import invariants enforced by AST tests.'
pubDate: 2026-08-25
updatedDate: 2026-08-25
categories:
  - software-engineering
tags:
  - clean-code
  - clean-architecture
  - refactoring
  - testing
author: Teo Parashkevov
heroImage: /assets/img/posts/techstack-challenges-rules-applied/thumbnail.png
heroAlt: 'Title card reading "The Rules, Applied" with the subtitle "Four cases where the standards met real code" over a dark blue background'
math: false
series: Techstack Challenges
seriesOrder: 15
---

## Introduction

Part 15 of **Techstack Challenges**. [Part 1](/blog/techstack-challenges-engineering-standards-as-code/) described the repo's engineering standards; [part 14](/blog/techstack-challenges-multi-agent-harness/) the agent harness that loads them. This post is the middle evidence: four real cases where the standards were applied to actual code — including two where the correct application of the rule was *not* to refactor. Cases like these are why the team trusted the standards: they were not a style guide, they were a decision procedure.

## Case 1: the boolean flag that became two functions

A transfer controller had grown a parameter `on_import: bool` that selected between two sentences of behavior at the core of the function. Every call site read like `transfer_record(record, on_import=True)` — which tells you nothing until you open the definition.

The standards say a boolean that selects between two behaviors must be two named functions. The refactor split it into `transfer_record_to_archive` and `transfer_record_from_archive`. The interesting part is the review comment that recorded the reasoning: *"a boolean that selects between two sentences is the flag parameter clean-code asks to be split into two named calls, and the names are what the call site reads."* The rule was not applied because flags are ugly; it was applied because the call site is read far more often than the definition, and the call site is where meaning must live.

The same rule, in a different guise, vetoed a boolean `emphasised` prop on an interview UI component — a prop that selects behavior is the same flag parameter, and the same split applies: two named components.

## Case 2: the seventy lines that stayed duplicated

Here is the case that convinces skeptics. Two survey renderers shared about seventy lines of refusal preamble — the "I can't help with that" framing the product shows when declining a request. Every reviewer for a year marked it as obvious duplication to extract.

The standards say to extract only when the two pieces represent the *same concept* and will *change for the same reason*. Investigation showed the renderers had drifted apart on purpose, and — crucially — the refusal contract was exactly what a later correction needed to change *in all seven renderers at once*. When that correction arrived, the shared change reason finally existed, and extraction became trivial and safe.

The counter-case, from the same investigation: two path-normalization helpers that *looked* identical but handled different edge cases for different callers. They were **not** merged, because their bodies had genuinely diverged and their change reasons had too. Resemblance alone is not duplication.

The meta-lesson: the duplication rule is not a license to leave messes — it is a forcing function to ask *why these two pieces might change*, which is a question that pays off even when the answer is "leave them."

## Case 3: the boundary that is a dict, not a row

A REST executor pinned an operation-plus-version pair together with everything needed to call it — endpoint, parameters, credentials reference. The obvious implementation carried SQLAlchemy rows across the boundary. Instead the executor works with a plain structure assembled from the `mcp_servers` and `rest_operations` tables, and the paginator works with a plain dict.

The standard: data crossing a boundary is a plain, boundary-specific structure — never an ORM entity, HTTP request object, or raw DB row. The payoff is stated in the code's own comments: *the executor is testable with a literal.* No database, no ORM session, no fixtures — a hand-written dict is a valid executor input, which means unit tests are fast and, more importantly, the mapping between storage shape and call shape lives in exactly one place. The same reasoning kept paginators free of the guarded HTTP client's response types.

This is the Dependency Rule doing daily work: when the domain works with plain data, the framework becomes an implementation detail you can replace or test around.

## Case 4: the import the test forbids

The strongest enforcement in the repo: an AST-walk test asserting that domain-layer modules never import a framework, SDK, or HTTP client — with a comment naming the stakes: *an `import httpx` at a call site here would be a second, unguarded egress path, which is exactly what the two live SSRFs found in the earlier hardening pass were.*

Two things make this case special. First, it is an AST walk, not `grep`, because function-local imports are precisely how violations hide from grep. Second, the test encodes *why*, not just *what*: the rule exists because a previous incident class (server-side request forgery through unguarded outbound calls) was traced to exactly this kind of import. Standards that carry their incident citations get respected; standards that read as taste get argued with.

## The intersection: handler as translation layer

The combined pattern across all four cases: a route handler does exactly four things — parse input, build a use-case request object, call the use case, map the result to a response. Zero business decisions in handlers, zero business decisions in repositories. Comments in handlers explain *why* a mapping exists (one explains a masking decision — hiding a guest-list size from a view-tier caller — rather than *what* the mapping does). And every behavior change ships with Arrange–Act–Assert tests that are fast, independent, and deterministic; opportunistic cleanup rides in its own commit, never mixed with behavior.

Two years of this produced something hard to articulate: a codebase where code review rarely argues about structure, because structure decisions were already made — recorded as standards, enforced by tests, and cited precisely when applied. The arguments that remain are about the domain, which is where engineering attention belongs.

Next, the finale of the build story: the AI agents runtime — a sixteen-element cache key, progressive skill disclosure, and a feedback loop that measures meetings, not vibes. Then a closing post with the lessons of the whole series.
