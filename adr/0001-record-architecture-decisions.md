# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Teo Parashkevov

## Context

The repository has been through a major rewrite (Jekyll to Next.js, June 2026) plus several follow-up rounds of security, testing, and SEO work. The reasons behind those changes live only in commit messages and in ad-hoc summary files at the repo root (`IMPROVEMENTS.md`, `CODE_PANEL_FEATURE.md`). That makes it hard to tell later why things are the way they are. For example: why does `docs/` still contain a Jekyll site when it is no longer deployed?

## Decision

We will record significant decisions as Architecture Decision Records (ADRs) in `adr/`, in the lightweight format popularized by Michael Nygard (Context, Decision, Consequences). We will keep operational and how-to documentation separately, in `docs/handbook/`.

A decision deserves an ADR when it is expensive to reverse or affects how people work in the repo: framework choice, hosting, content pipeline, security posture, CI gates, and branching or release flow.

## Alternatives considered

- **Keep using commit messages and root-level summary files.** These are not discoverable, not indexed, and they mix "what changed" with "why".
- **A wiki on Forgejo or GitHub.** A wiki is versioned separately from the code and is not mirrored together with the repo.

## Consequences

- New decisions go through a PR like any other change (see ADR-0008).
- ADRs 0002–0007 were written after the fact, reconstructed from git history and the current code. Their dates are the dates of the original change.
