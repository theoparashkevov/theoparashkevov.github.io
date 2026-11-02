---
title: 'Building an Opaque Boundary Around an LLM: Stream Sanitization and Allowlist Provenance'
description: 'When a model answers over private knowledge, the answer must never leak what it used. How to scrub IRIs, UUIDs, and query fragments across streaming chunk boundaries, and how to project provenance as an allowlist.'
pubDate: 2024-01-16
categories: [ai, security]
tags: [llm, security, streaming, sanitization, provenance, rag]
---

A retrieval-augmented system answers questions over a private knowledge graph. The user asks "why did revenue dip in Q2?" and the model, faithfully, answers: "Per `SELECT ?s WHERE { GRAPH <http://internal.example/kg_7f3a...> ... }` the dip traces to..." — and now an internal graph IRI, a dataset UUID, and half a SPARQL query are sitting in the user-facing transcript. The retrieval layer did its job; the boundary layer failed.

This post is about that boundary: how to guarantee that whatever crosses from the privileged side to the user is *scrubbed*, even when the model's text arrives one arbitrary chunk at a time.

## Threat model

The model's raw output may contain, deliberately or by parroting its tool results:

- **IRIs** — `https://...` and `urn:...` fragments that name internal resources
- **Bare UUIDs** — dataset, session, or record identifiers usable for enumeration
- **Query text** — structural signatures like `SELECT ... WHERE` that reveal the data plane
- **Internal markers** — origin annotations the pipeline inserts for its own bookkeeping

The contract for the public side: none of the above, ever. Answers are natural language plus *de-identified provenance* ("Knowledge Graph", verified ✓) — never identifiers.

## The non-streaming case is easy

For a complete string, a regex sweep suffices:

```python
PATTERNS = [
    (re.compile(r"https?://[^\s<>\"']+"), "[source]"),
    (re.compile(r"urn:[^\s<>\"']+"), "[source]"),
    (re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.I), "[id]"),
    (re.compile(r"\bSELECT\b[\s\S]{0,400}?\bWHERE\b", re.I), "[query]"),
    (re.compile(r"\[\[[^\[\]]+?\]\]"), ""),          # internal origin markers
]

def scrub(text: str) -> str:
    for pattern, replacement in PATTERNS:
        text = pattern.sub(replacement, text)
    return text
```

Two notes on the patterns themselves. The SPARQL pattern matches *structure*, not the word "select" — a question about SQL in the abstract shouldn't be mangled, while an actual query-shaped span (SELECT followed within a few hundred chars by WHERE) is a leak regardless of quoting. And the marker pattern strips internal annotations entirely rather than replacing them — they were never meant for human eyes.

But even in the non-streaming case there is a final, essential gate: **assertion, not just best effort.** Scrubbing output is one thing; proving it:

```python
class BoundaryLeak(Exception): ...

def assert_clean(text: str) -> None:
    if any(p.search(text) for p, _ in PATTERNS):
        raise BoundaryLeak()
```

The sanitizer runs, then the assertion runs. If anything slipped through — an unanticipated IRI shape, a pattern bug — the task *fails closed* with a generic error instead of emitting the leak. Defense in depth means the second layer exists precisely for the day the first layer is wrong.

## The streaming case: chunks don't respect token boundaries

Now the real problem. LLM output streams in deltas — arbitrarily cut mid-word, mid-IRI, mid-UUID. The chunk sequence `["...see ", "http://internal.exam", "ple/kg_7f3a for details..."]` contains a leak that no per-chunk regex will find: each chunk alone is clean.

The fix is a **streaming sanitizer with boundary buffering**: never emit the tail of the buffer if a forbidden pattern *could* start there.

```python
class StreamSanitizer:
    def __init__(self):
        self._buffer = ""

    def feed(self, chunk: str) -> str:
        self._buffer += chunk
        # Split at the last whitespace, keeping the tail buffered
        cut = max(self._buffer.rfind(c) for c in "\t\n\r ")
        if cut <= 0:
            return ""                      # no safe whitespace yet; hold everything
        safe, self._buffer = self._buffer[:cut], self._buffer[cut:]
        return scrub(safe)

    def flush(self) -> str:
        final, self._buffer = scrub(self._buffer), ""
        return final
```

The invariant: anything emitted has been fully scrubbed, and the retained tail is at most one whitespace-delimited word long. A forbidden token split across chunks can never be emitted, because its prefix sits in the buffer until the token completes — at which point it matches the pattern and is replaced. On stream end, `flush()` drains and scrubs the remainder.

The cost is bounded latency of roughly one word, which for text rendering is imperceptible. This is the classic streaming-dirty-data trade: you cannot both stream byte-by-byte and guarantee pattern completeness; buffering up to a delimiter is the minimal surrender.

## Provenance as an allowlist projection

Scrubbing defines what *may not* cross. Provenance defines what *may* — and the right shape is an allowlist projection from a rich internal object to a minimal public one.

Internally, an answer's origin might look like:

```python
@dataclass
class SourceRef:
    kind: str            # "kg" | "survey" | "document" | "inference" ...
    verified: bool
    iri: str | None      # internal graph IRI
    session_id: UUID | None
    document_id: UUID | None
    trace: list | None   # raw query result rows
```

Everything on the right half of that object is private. The projection is therefore aggressively small — read only `{kind, verified}`, resolve a *server-side label* for each reference (an IRI becomes "Knowledge Graph"; a session id becomes the session's human title via an access-checked lookup; a document id becomes a file name — never its bytes), and emit exactly:

```json
{ "type": "Knowledge Graph", "label": "Q2 Revenue Review", "verified": true }
```

Three rules make this safe where a richer projection would eventually leak:

1. **Field allowlist, not blocklist.** Enumerate the fields that may leave (`type`, `label`, `verified`); never enumerate forbidden ones. Blocklists grow forever; one forgotten field is a leak. Allowlists are closed by construction.
2. **Labels resolved server-side, under the same access checks** as the data itself. The lookup path must be access-gated the same way the query path was — provenance is a side channel and must be treated as one.
3. **Bounds on resolution work.** Cap the number of label lookups per answer (generosity here is a denial-of-wallet against your metadata service) and resolve *labels only* — a document reference yields its file name, never its content.

And the honest posture for inference-derived statements: label them "Inference" — a static, human-readable phrase — rather than trying to synthesize a citation. Users deserve to know when the model is reasoning versus retrieving.

## Composition: where the boundary lives

In the full pipeline, the boundary sits between the retrieval/model machinery and the transport:

```
internal stream ──▶ StreamSanitizer ──▶ assert_clean ──▶ public stream
                                      └── fail → task fails, generic message
origin map ───────▶ allowlist projection ──▶ structured provenance block
```

Two properties worth stating explicitly. The executor never surfaces internal errors — a failure (including a detected leak) logs full detail internally and returns a generic message externally; error text is also untrusted output. And interactive prompts ("the model wants to ask the user a question") are rejected at this boundary for non-interactive transports — a JSON-RPC caller cannot answer a mid-run question, and the failure must be explicit rather than a silent hang.

## Takeaways

1. **Scrub, then assert.** The assertion is what makes the sanitizer a boundary rather than a filter; fail the task, never emit.
2. **Streaming requires boundary buffering.** Hold the buffer tail up to the last whitespace; forbidden tokens split across chunks can then never escape. Drain-and-scrub on flush.
3. **Provenance is an allowlist projection**: three public fields, labels resolved under access checks, bounded lookups, content never crosses.
4. **Errors are output too.** Internal detail logs internally; callers get a generic message.

The overarching principle: *the model is a privileged component, and its output is untrusted by default.* Any system that hands a model private tools and then echoes its words to a less-privileged audience needs exactly this boundary — and the boundary's correctness cannot depend on the model behaving.
