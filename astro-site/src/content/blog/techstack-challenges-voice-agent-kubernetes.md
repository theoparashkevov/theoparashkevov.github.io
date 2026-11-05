---
title: 'Techstack Challenges, Part 12: Three Outages and a Missing Secret'
description: 'Deploying the voice agent on Kubernetes: why one missing webhook secret took a whole namespace down three times, the split-horizon DNS that silently killed observability, and the isolation patterns that came out of it.'
pubDate: 2026-04-21
updatedDate: 2026-04-21
categories:
  - kubernetes
  - software-engineering
tags:
  - kubernetes
  - dns
  - secrets
  - isolation
  - observability
author: Teo Parashkevov
math: false
series: Techstack Challenges
seriesOrder: 12
---

## Introduction

Part 12 of **Techstack Challenges**, following [George, the voice agent](/blog/techstack-challenges-voice-agent/). George's code was the hard part for about a week. His deployment was the hard part for a season. This post is about three outages, each one embarrassing in a different way, and the isolation patterns that came out of them.

## Outage 1, three times: the shared pod and the missing secret

The platform's services originally ran as containers in one shared pod, with `strategy: Recreate` — one replica, replaced whole, because several components assumed single-writer semantics.

George, by design, refuses to boot without his webhook-signing secret: an unsigned webhook endpoint would let anyone on the internet place calls at the client's expense, so the config validator says no. When the secret object didn't exist yet, George's container went into `CreateContainerConfigError` — and under `Recreate`, one unstartable container means the *entire pod* never becomes ready. Namespace-wide 503. For the API, the web app, everything.

Then it happened again. Someone added a new key to the shared secrets object that the external-secrets operator couldn't source, and because ESO syncs are all-or-nothing per object, *every* service lost its secret refresh. Then again, when another new container with a missing dependency was added to the pod. Three outages, one root cause shape: **blast radius defined by packaging, not by failure.**

The fix was a set of isolation rules now treated as defaults:

1. **Anything that refuses to boot without its secrets gets its own Deployment.** George runs as his own deployment with his own secret object, his own readiness and liveness probes, and `Recreate` scoped to himself. He can be in `CreateContainerConfigError` for a week and the rest of the platform never notices.
2. **New secrets live in their own object until Vault holds them.** Never add untested keys to a shared secret — the all-or-nothing sync makes one bad key everyone's outage.
3. **Never put behavior switches in packaging.** The shared pod was justified by "it needs to be one process." Fine — then the process boundary and the failure boundary are the same, and that fact must appear in every deployment decision.

The detail that makes this repeatable: a boot-verify script that parses the Kubernetes manifest, exports exactly its environment, and runs the service's DLL with a timeout to confirm `Application started` — manifest env and deployed env cannot drift because both come from the same file.

## Outage 2: split-horizon DNS, eating observability at DEBUG level

The internal cluster uses a split-horizon zone: some names resolve publicly, some only internally. One observability endpoint — call it `traces.example-internal.com` — deliberately has no public A record (its certificate is issued via DNS-01 challenge against the internal zone). Inside the pod, CoreDNS had no forward zone for the internal domain, so the name resolved nowhere.

The TCP path was fine; the name was broken. The tracing client, wrapped in a broad `try/except`, swallowed the resolution failure and logged at DEBUG. The result: **a month of zero traces, with tracing "enabled,"** and no error anywhere at INFO or above. The config said `LANGFUSE_ENABLED=true`; reality said nothing at all.

The stopgap was `hostAliases` in the pod spec, pinning the name to its internal IP. It works, it is honest about being a pin ("if the server ever moves, this address moves with it"), and the manifest comment names the real fix: a CoreDNS forward zone for the internal domain. The certificate is verified normally — the alias is purely a name-resolution workaround, not a TLS compromise.

Two lessons generalize hard. First, **libraries that can fail silently will fail silently, at scale, for months** — wrap external clients so that their failure modes surface at ERROR, or accept that you have no observability about your observability. Second, split-horizon DNS is a system design choice, not a network nuisance; every name in every config should resolve through exactly one documented path.

## The smaller traps

- **`enableServiceLinks: false`.** Without it, the kubelet injects environment variables like `GEORGE_VOICE_PORT=tcp://…` for every service in the namespace, and pydantic-settings happily reads `PORT` from there and refuses to boot on a URL. One pod-spec line, discovered the hard way.
- **Outbound control tokens are `optional: true`.** A missing control token must not block boot; it logs ERROR and outbound calling is unavailable — loud degradation again, per [part 10](/blog/techstack-challenges-configuration-fails-loud/).
- **Region pinning.** SIP and REST endpoints for the voice provider must live in the same region as the project, or data residency splits while everything *appears* to work. The service refuses calls whose trunk names a different region (`REGION_MISMATCH`) rather than silently answering from the wrong jurisdiction.
- **Ingress boundaries.** Two exact public paths — the webhook and the WebSocket session endpoint — on a dedicated ingress; everything else, including a diagnostic route that prints the SIP project ID, stays private. The diagnostic route is unauthenticated *by design* inside the cluster; putting it on the public ingress "temporarily" would be how project IDs leak.

## The pattern underneath

All three outages share a shape: a small, boring misconfiguration (missing key, missing DNS record, injected env var) met a system whose failure surface was much larger than the misconfiguration (whole namespace, whole observability pipeline, whole boot), and the meeting happened quietly. The remedies are all the same medicine — shrink blast radius with packaging, and make every failure loud — which is why they keep recurring as themes in this series. They are not three lessons. They are one lesson, learned three times.

Next: the meeting bot's brain — a .NET service that ran out of memory in production, and what its GC taught us about container limits.
