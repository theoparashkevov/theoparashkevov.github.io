---
title: 'Background Job Orchestration for Real-Time Voice Agents'
description: 'Voice agents feel synchronous but live on a mess of tool calls, reconnects, and long-running jobs. A background job manager with dedup, bounded retries, a dead-letter queue, and a sideband control channel — plus a discovery system for assumptions you cannot verify.'
pubDate: 2024-05-30
series: 'Algorithm Implementations'
seriesOrder: 14
categories: [ai, system-design]
tags: [voice, realtime, background-jobs, reliability, websocket, llm]
heroImage: /assets/img/posts/realtime-voice-background-jobs/thumbnail.png
heroAlt: 'Background Job Orchestration for Real-Time Voice Agents'
---

A real-time voice agent is the hardest reliability surface in LLM systems: audio is unforgiving (a 200ms stall is audible), the model's tool calls arrive mid-sentence, long-running tools must not block the conversation, and the underlying API's wire format changes under you. This post covers four pieces of machinery that make it survivable: a background job manager, a sideband control channel, exponential-backoff reconnection, and an unusual pattern for managing unverifiable assumptions.

## The manager: in-memory, journaled, bounded

Tool calls from a real-time model span a huge latency range — "look up the weather" (300ms) to "rebuild the report" (4 minutes). Blocking the audio stream on the slow ones is obviously wrong; the answer is to treat slow tool calls as **background jobs** decoupled from the conversation, with results relayed back when ready.

The manager (in-process; one per voice server) has the shape:

```python
@dataclass
class BackgroundJob:
    job_id: str
    dedupe_key: str
    job_type: str
    payload: dict
    status: str              # enqueued | running | retry_scheduled | succeeded | dead
    attempts: int
    max_attempts: int
    next_attempt_epoch_ms: int
    last_error: str | None
```

**Deduplication** is by `dedupe_key` (e.g. `statement-adaptation:{session_id}:{item_id}`), checked under a state lock across live *and* recently-succeeded jobs. A retried or repeated tool call mapping to an in-flight job returns the existing job instead of forking work — and preserves the original caller's callback so *both* waiters get the result.

**Saturation guards** are explicit: a bounded `asyncio.Queue` (maxsize 256) plus a `max_pending_jobs` counter (4096). When either is full, enqueue rejects rather than queues silently. Unbounded queues are how "a bit of lag" becomes an OOM at 3 a.m.; a bounded one turns overload into a loud, countable event.

**Concurrency** is a semaphore (4 concurrent jobs): voice work is I/O-bound but third-party APIs are rate-limited, and "as parallel as possible" is a worse default than "as parallel as measured safe".

**Retries** use a fixed short backoff ladder — 1s, 5s, 15s — then **dead-letter**. Three deliberate choices: the ladder is short (a voice session may only live for minutes; a retry at +5 minutes is worthless), capped attempts with a dead-letter file (jobs don't retry forever; failures land in an auditable JSONL file with full payload for replay), and the journal is append-only JSONL — every state transition is written before it's acted on, so restart recovery is `load journal, resume jobs whose next_attempt <= now`. Crash-recovery is a file read, not a distributed consensus problem.

## The sideband: control without the audio path

Audio runs over one channel (WebRTC in the browser case). But voice sessions also need *control* operations: token accounting, context truncation, conversation-item deletion, out-of-band summarization. Mixing control into the audio path couples their failure modes; a **sideband** — a second WebSocket to the same provider session, owned separately — carries control traffic.

The sideband has its own connection lifecycle with **exponential backoff capped at 30 seconds** (`backoff = min(backoff * 2, 30.0)`, max 3 attempts, then `healthy = False`). Capping matters twice: unbounded backoff means the control channel never recovers; and after the cap, the system *estimates* token state rather than blocking audio on a dead control channel. Degraded-with-a-flag beats stuck.

Out-of-band operations get their own marker (`oob_id` on `response.create` with `conversation: "none"`) so a sideband-triggered response never contaminates the user-facing transcript. Identity of the two channels is the session id; anything else (call ids, transport handles) is ephemeral and must be re-derivable.

## Relays: getting results back to the conversation

When a background job finishes, its result must reach the conversation. Two patterns compose: a **callback registry** (job completion fires registered callbacks) and a **relay** that pushes the tool result into the realtime session through the sideband — the model sees the tool result as if it had been waiting synchronously all along. The orchestrator binds them: tool call arrives → decide sync-or-background → background path enqueues, registers the relay, returns an immediate acknowledgment to the model ("working on it") if the protocol allows, or simply lets the audio continue while the job runs.

Connection pooling per agent (with an idle reaper) amortizes the cost of the provider connection across a session's jobs; idle connections are closed, so a burst of activity never holds stale handles.

## The discovery gate: managing assumptions you cannot verify

Now the unusual pattern. A real-time integration depends on dozens of **wire-shape assumptions** you cannot verify from documentation alone: "partial session updates require a type discriminator" (or not), "this event uses a beta name", "error events have this exact shape". Shipping a wrong guess silently breaks audio; asking is impossible (the provider doesn't answer). The system treats each such assumption as a **probe**:

- A registry of named probes, each with a conservative default (assume the *safer* interpretation until proven).
- Every observation of the wire records a **signal** row (probe key, environment, observed value, confidence) — through a function that *cannot throw*: observability must never break audio. Signal recording swallows all exceptions by design.
- Signals are PII-scrubbed at ingestion (emails, user ids, transcript text, `@`-shaped strings stripped) — telemetry about wire formats never needs content.
- A 60-second per-probe cache prevents a chatty stream from flooding the table.
- A human operator reviews accumulated signals and **resolves** the probe with a conclusion; the conservative default rules until then, and a follow-up change removes the probe once resolved — each probe is scaffolding with a demolition date.

This is the general pattern worth stealing: **anywhere your code branches on an unverifiable external assumption, make the branch a named, default-valued, observable probe** — never a silent `if`. The conservative default protects production; the signal log turns "we think the format changed" from archaeology into a query; the removal step keeps the probe set from fossilizing.

## Telemetry and tracing

Every session emits a trace (events with timestamps through the pipeline: audio in, STT, model, tool dispatch, job lifecycle, TTS, audio out). Traces are observability, not debugging-after-the-fact: latency budgets per stage make regressions visible, and the job journal correlates by session id so a slow tool is attributable end-to-end.

## Takeaways

1. **Slow tool calls become background jobs**: dedup by stable key, bounded queue + counter, semaphore concurrency, short fixed backoff ladder, dead-letter, append-only journal for crash recovery.
2. **Separate control from audio with a sideband channel**: own lifecycle, capped exponential backoff, health flag with degraded estimation rather than blocking.
3. **Relays and callbacks compose** to return asynchronous results to a synchronous-feeling conversation.
4. **Make unverifiable wire assumptions named probes** with conservative defaults, non-throwing signal recording, PII scrubbing, operator resolution, and a removal step. Never a silent branch.
5. **End-to-end traces with per-stage latency budgets** turn "voice feels laggy" into a number on a specific stage.

Real-time voice is unforgiving precisely because the user experiences every failure as *the agent hesitating*. The machinery in this post is all in service of one goal: the conversation never waits on anything it doesn't have to — and when it must wait, it waits audibly (an acknowledgment) rather than silently.
