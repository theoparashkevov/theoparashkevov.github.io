# ADR-0008: Branching strategy: `feature/*` → `development` → `main`

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Teo Parashkevov

## Context

Until now, every change was committed straight to `master`. Every push to `master` reaches GitHub through the mirror (ADR-0007) and is deployed to production (ADR-0004). There was no place to integrate and review several changes before they went live.

## Decision

We use three tiers of branches:

```
feature/<topic>  ──PR──▶  development  ──PR──▶  main (production)
      ▲                        │
      └──── branched from ─────┘
```

- **`main`** is production. Every commit on it is deployable, and a push to it deploys the site. It is updated **only** by merging `development` (or a `hotfix/*`, see below).
- **`development`** is the integration branch, and it is the default target for all PRs. It should always build and pass tests.
- **`feature/<topic>`** branches are short-lived. They are **always branched from the latest `development`** and merged back into `development` through a PR on Forgejo. Use lowercase kebab-case names: `feature/code-panel-nextjs`, `feature/adr-docs`. Use `fix/<topic>` for non-urgent bug fixes and `docs/<topic>` for documentation-only work. These follow the same rules as `feature/*`.
- **Hotfixes** (production is broken and `development` contains unreleased work) branch from `main` as `hotfix/<topic>`. They are merged into `main`, and then `main` is merged back into `development` immediately.

Merge rules:

- `feature/*` → `development`: **squash merge**, so `development` gets one commit per feature with a [Conventional Commits](https://www.conventionalcommits.org/) title (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), matching existing history.
- `development` → `main`: **merge commit** (no squash, no rebase). This keeps the two branches' histories related, and each release is visible as one merge commit.
- Delete feature branches after they are merged.

The production branch is currently named **`master`**. Until it is renamed, read `main` in this document as `master`. The rename is tracked as follow-up work in the [branching guide](../docs/handbook/branching-strategy.md#renaming-master-to-main).

## Alternatives considered

- **Trunk-based development (everything on `main` behind short PRs).** This is simpler, but every merge deploys immediately and there is no staging tier.
- **Full Git Flow (with `release/*` branches).** Too heavy for a single-author site that has no versioned releases.
- **GitHub Flow on GitHub.** Not possible, because PRs live on Forgejo (ADR-0007).

## Consequences

- Production deploys become deliberate: a `development` → `main` PR is a release.
- `development` and `main` must be protected on Forgejo (no direct pushes, no force-pushes, PR required).
- The CI workflow currently triggers only on `master`. To get checks on `development` and on feature PRs, either:
  - add `development` to the `push`/`pull_request` branch lists in `nextjs-deploy.yml`, with the deploy job restricted to the production branch; or
  - add a `.forgejo/workflows/ci.yml` that runs the quality job on Forgejo PRs (preferred, because PRs live on Forgejo).
- The push mirror makes `development` and feature branches visible on GitHub. That is fine, but do not open PRs or push commits there.
