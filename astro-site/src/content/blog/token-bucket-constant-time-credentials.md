---
title: 'Token Bucket Rate Limiting and Constant-Time Credential Verification'
description: 'The small but sharp security machinery behind an API endpoint: in-memory token buckets, peppered SHA-256 with constant-time comparison, and deterministic session namespacing.'
pubDate: 2023-12-05
categories: [algorithms, security]
tags: [rate-limiting, token-bucket, hashing, hmac, security, python]
---

Every API endpoint that issues programmatic credentials eventually needs the same three pieces of security machinery: a rate limiter that fails gracefully, credential storage that survives a database dump, and session isolation that can't be crossed by accident. None of them require a security appliance — each is about forty lines of careful code. This post walks through implementations and the reasoning behind each choice.

## Rate limiting: the token bucket

The algorithm: each caller (identified by credential id) has a bucket holding up to `capacity` tokens, refilling at `refill_per_second`. A request costs one token; a request with no tokens available is rejected with 429.

```python
@dataclass
class Bucket:
    tokens: float
    last_refill: float

class TokenBucketLimiter:
    def __init__(self, capacity: float = 60.0, refill: float = 1.0):
        self.capacity = capacity
        self.refill = refill
        self._buckets: dict[str, Bucket] = {}

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = self._buckets.get(key)
        if bucket is None:
            bucket = Bucket(tokens=self.capacity, last_refill=now)
            self._buckets[key] = bucket
        # Refill based on elapsed time, capped at capacity
        bucket.tokens = min(
            self.capacity,
            bucket.tokens + (now - bucket.last_refill) * self.refill,
        )
        bucket.last_refill = now
        if bucket.tokens < 1.0:
            return False
        bucket.tokens -= 1.0
        return True
```

Three properties make this the right default:

1. **Burst tolerance.** Unlike a fixed window ("100 requests per minute, resetting at :00"), a full bucket lets a client burst 60 requests instantly — then drains to a sustainable 1/second. Interactive clients get snappy behavior; abusive scripts hit the refill ceiling immediately.
2. **Lazy state.** No background timer mutates buckets; refill is computed *on access* from elapsed time. Idle callers cost zero memory updates and buckets for users who left expire naturally.
3. **No clock dependency.** `time.monotonic()` never jumps (unlike wall time, which NTP can smear backwards). Rate limiting on a jumping clock produces both accidental 429 storms and limiter bypass; monotonic time cannot.

Its documented limitation is equally important: this is **per-process**. With multiple replicas, each holds its own buckets and the effective limit multiplies. For many APIs that's acceptable (the limit exists to protect, not to bill against); the moment it isn't, the replacement is a shared store — and the interface (`allow(key) -> bool`) doesn't change. Design the seam so the honest in-memory version isn't a lie, and the upgrade is a swap, not a rewrite.

Also note where the limiter sits in the pipeline: *after* authentication (the key is the credential id) and *before* any work is dispatched. Unauthenticated traffic gets a cheaper 401 path; expensive requests never run for over-limit callers.

## Storing API keys: pepper, hash, constant-time compare

Static API keys must be verifiable but not recoverable. The scheme:

**Storage:** `sha256(pepper + plaintext)`, hex-encoded. The *pepper* is a site-wide secret held in configuration, never in the database. Two layers of defense follow:

- **A database dump alone reveals nothing.** Hashes are one-way, and without the pepper even rainbow tables and precomputed dictionaries are useless — the attacker needs both the dump *and* the deployment's secrets.
- **Empty pepper is a startup error in production.** A missing pepper should hard-fail deployment in production while only warning locally; the failure mode "works on my machine, wide open in prod" must be structurally impossible.

**Verification — the detail everyone gets wrong the first time:**

```python
hmac.compare_digest(hash_key(presented), stored_hash)
```

Not `==`. String comparison short-circuits at the first differing character, which turns verification into a timing oracle: an attacker measuring response times can reconstruct a valid key byte by byte. `hmac.compare_digest` runs in time independent of *where* the inputs differ. For an operation executed on every request, this is non-negotiable.

When the credential is a JWT instead of a static key, the hot path is pure cryptography — validate the signature, audience, expiry, and token type in-memory with the shared secret, no database. The database lookup and its latency only exist for static keys. A useful pattern: the *principal* (identity, scopes, bound user) is built once at authentication time and carried on the request scope, so every downstream layer reads a typed object instead of re-deriving or — worse — re-trusting request parameters.

## Session namespacing: determinism as isolation

Programmatic agents that hold conversational state need sessions. The requirement: two different credentials, or two different users, must never land in the same session — even by accident, even with colliding `context_id` values supplied by callers.

The solution is a deterministic UUID:

```python
SESSION_NAMESPACE = UUID("6f3a1d2e-...")  # fixed, version 5 namespace

session_id = uuid5(SESSION_NAMESPACE, f"{bound_user_id}:{credential_id}:{context_id or 'new'}")
```

`uuid5` is SHA-1 based and deterministic: the same namespace + name always yields the same UUID. That turns session identity into a pure function of (user, credential, caller context), which buys three things:

1. **Isolation by construction.** A different user or credential contributes a different name component, so a different UUID — no lookup, no collision check, no "is this session mine?" query.
2. **Idempotency.** A retried request with the same `context_id` reconnects to the same session instead of forking a duplicate conversation.
3. **No state to manage.** There is no session-id allocation service, no registry table, no race on insert.

The pattern generalizes: whenever an identifier needs to be *stable, unique per input tuple, and computable anywhere*, a namespaced UUIDv5 replaces a central allocator.

## The pipeline as a whole

```
request
  → extract credential (header or Bearer)
  → resolve principal (DB hash verify, or crypto JWT validation)
  → rate limit by credential id        ┐ fail → 429
  → attach principal to request scope  ┘ fail → 401
  → dispatch to handler (session id via uuid5)
```

Each stage fails closed with the cheapest possible response, and each expensive decision (DB lookup, permission resolution) happens exactly once per request, upstream.

## Takeaways

1. **Token bucket over fixed window** for per-caller limits: burst-friendly, lazy, monotonic-clock-safe. Budget for the per-process caveat explicitly.
2. **`sha256(pepper + key)` for storage, `hmac.compare_digest` for verification.** The pepper belongs in deployment config, and its absence must be a production startup failure. Timing safety is a one-function fix — don't skip it.
3. **JWTs keep the hot path DB-free**; principals are built once and passed downstream.
4. **Namespaced UUIDv5 turns session identity into a pure function** of (user, credential, context) — isolation, idempotency, and zero coordination in one move.

Security machinery ages well when each piece has one job and an honest statement of its limits. The in-memory limiter that documents "per-process" is more secure than the distributed one that's half-migrated and nobody knows which limit is real.
