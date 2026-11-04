---
title: 'Hybrid Search with Reciprocal Rank Fusion: Combining Vector and Full-Text Retrieval'
description: 'Dense embeddings find paraphrases; full-text finds exact terms. How to run both legs concurrently and fuse their rankings with RRF — a simple formula that consistently beats either leg alone.'
pubDate: 2024-02-06
series: 'Algorithm Implementations'
seriesOrder: 6
categories: [ai, algorithms]
tags: [search, rag, embeddings, postgres, ranking, information-retrieval]
heroImage: /assets/img/posts/hybrid-search-rrf/thumbnail.png
heroAlt: 'Hybrid Search with Reciprocal Rank Fusion: Combining Vector and Full-Text Retrieval'
---

Ask a corpus two questions: "How do I reset my password?" and "What is the password reset policy for contractors?" Semantic (vector) search nails the first — it understands intent. Lexical (full-text) search nails the second — it matches the exact term "contractors". Any retrieval system that serves both kinds of queries needs both kinds of index, and a principled way to combine them.

This post covers the two retrieval legs, the fusion formula that merges them (Reciprocal Rank Fusion), and the production details that make the combination safe to ship.

## The two legs

**Dense / vector leg.** Documents are chunked and embedded (e.g. 1536-dimensional vectors), stored in Postgres with the pgvector extension, and queried by embedding the query and ranking by cosine distance. Strength: paraphrase robustness, conceptual match. Weakness: exact terms (product codes, names, error strings) and rare tokens — embeddings blur them into neighbors.

**Lexical / full-text leg.** Postgres' built-in `tsvector`/`tsquery` ranking:

```sql
SELECT id, content,
       ts_rank_cd(content_tsv, plainto_tsquery('pg_catalog.english', $1)) AS rank
FROM kb_dataset_42
WHERE content_tsv @@ plainto_tsquery('pg_catalog.english', $1)
ORDER BY rank DESC
LIMIT $2;
```

`ts_rank_cd` is a density-weighted rank; `plainto_tsquery` turns raw user text into an ANDed lexeme query safely (no operator injection). Strength: exact terminology. Weakness: vocabulary mismatch — "fired from job" never matches "terminated employment" lexically.

Note the per-dataset table name. Chunk storage is sharded per dataset (`kb_dataset_<id>`), which gives per-dataset isolation, independent retention, and indexes that stay small enough to be effective.

## Running the legs concurrently

Both legs are independent SELECTs against the same database — and blocking one on the other wastes half your latency budget. Run them as concurrent tasks:

```python
dense_hits, lexical_hits = await asyncio.gather(
    dense_search(query, top_k),
    lexical_search(query, top_k),
)
```

The legs must use **separate database sessions**. Two concurrent queries sharing one session interleave cursor state in ways that are hard to debug; separate sessions keep the isolation honest. Two more details: fetch the lexical leg at `top_k * 4` (lexical recall decays faster with rank, and fusion only helps if an item appears in both lists), and — critically — **make the lexical leg optional**. If the FTS column is missing on some dataset (migration lag, a dataset created before the feature), the leg degrades to an empty result list and the system returns dense-only results. A feature that can silently vanish half its ranking inputs is a liability; a feature that degrades to its best single leg is robust.

## The fusion: Reciprocal Rank Fusion

You now have two ranked lists of chunk ids. The merge: **Reciprocal Rank Fusion (RRF)**:

```python
def rrf_fuse(rankings: list[list[str]], k: int = 60) -> dict[str, float]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    return scores

merged = sorted(scores, key=scores.get, reverse=True)[:top_k]
```

For each document, sum `1 / (k + rank)` across every list it appears in. The properties that make this the right default:

1. **Rank-based, not score-based.** Vector cosine distances and FTS ranks live on incommensurate scales — you cannot average them. RRF only asks "how high?", ignoring "how confident?". This makes legs pluggable: any new retrieval source (a keyword index, a cross-encoder rerank, a graph walk) joins as just another ranked list.
2. **Reciprocal dampening.** Rank 0 contributes `1/61 ≈ 0.0164`, rank 60 contributes `1/121 ≈ 0.0083` — documents matter less the further down they sit, so a long tail of weak matches can't swamp a strong consensus.
3. **Consensus reward.** A document ranked mid on *both* lists outranks one ranked top on one and absent on the other. In practice this is exactly the behavior you want: mutual confirmation is strong evidence of relevance, and single-list champions are often leg-specific artifacts (embedding echo, keyword stuffing).
4. **The `k` constant (60, from the original paper) controls sensitivity.** Lower `k` exaggerates top ranks — the fusion leans harder on each leg's champion. Higher `k` flattens. It's worth exposing as configuration: different corpora have different optimal fusion sharpness, and tuning shouldn't require a deploy.

```python
# leg A:       [a, b, c, d]
# leg B:       [b, a, e]
# fused (k=60): a ≈ 0.0328, b ≈ 0.0324, c ≈ 0.0161, e ≈ 0.0161, d ≈ 0.0159
```

`a` wins on consensus (top-two on both) despite `b` winning leg B outright.

## The full retrieval stack

In context, RRF sits between the legs and the consumer:

```
query
  ├─▶ embed(query) ───────────▶ vector ANN ──▶ ranked list A
  └─▶ plainto_tsquery(query) ─▶ FTS + ts_rank ─▶ ranked list B (top_k×4, degradable)
        RRF fuse (k=60) ─▶ top_k chunks ─▶ prompt / answer
```

If you have a reranker (a cross-encoder scoring query-chunk pairs), it runs *after* fusion on the fused top-k — fusion widens recall, reranking sharpens precision, and the reranker only pays for k pairs instead of the whole corpus.

## Retrieval beyond the flat list: hierarchical search

For corpora with real structure — a long-term memory system with topics, episodes, and facts, for instance — flat top-k fusion is the wrong shape. A hierarchy-aware variant first ranks *containers*, then descends:

1. Rank level-1 containers (topics) with the same dual-leg + RRF machinery.
2. Walk weighted edges to children (episodes), scoring each by `edge_weight × recency_decay(last_activity)` where `recency_decay(age) = 0.5 ** (age_days / half_life)` — a configurable half-life (30 days is a sane default) keeps memory fresh without hard cutoffs.
3. Pull candidate leaf items (facts) from the scored episodes, sort by `(role_priority, -weight, -episode_score)`, cap at the final budget.

The same RRF core applies at every level; what changes is what a "document" is. Worth adding to any such system: a reserved, always-first bucket for the most load-bearing context (a persona, a system directive) with **explicit disclosure of truncation** — "showing 8 of 12 facts, withheld oldest 4" — because silent truncation of identity-shaping context is how assistants drift into weird behavior with no visible cause.

## Takeaways

1. **Use both legs.** Vector search misses exact terms; FTS misses paraphrases. Every real corpus has both query types.
2. **Run legs concurrently on separate sessions; make the lexical leg degradable** (missing index → empty list, not an error).
3. **Fuse with RRF**: `Σ 1/(k + rank)`, rank-based so legs stay pluggable, consensus-weighted, with `k` (60 default) exposed for tuning.
4. **Fusion widens, reranking sharpens** — if you have a cross-encoder, it runs after the merge on the short list.
5. **Structured corpora want hierarchical retrieval** — fuse at the container level, decay by recency along edges, disclose every truncation.

The striking thing about RRF is how little it needs: no score calibration, no leg weighting heuristics, no training. Two ranked lists and eleven characters of arithmetic beat either leg alone — and most of the engineering effort goes not into the formula but into making each leg honest and failure-tolerant.
