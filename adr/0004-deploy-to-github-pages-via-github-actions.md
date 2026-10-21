# ADR-0004: Deploy to GitHub Pages via GitHub Actions

- **Status:** Accepted, workflow details amended by ADR-0009
- **Date:** 2026-06-04 (commits `495260e`, `f6dc678`)
- **Deciders:** Teo Parashkevov

## Context

The site is published at `https://theoparashkevov.github.io`, a GitHub user site. Jekyll used to be built by a GitHub Actions workflow, so the repository's Pages source was already set to "GitHub Actions" rather than "deploy from a branch". A Next.js static export is not something GitHub Pages can build by itself.

## Decision

A single workflow, `.github/workflows/nextjs-deploy.yml`, builds and deploys the site:

1. **`quality` job:** `npm ci` → `lint` → `typecheck` → `format:check` (non-blocking) → `test --coverage`.
2. **`build-and-deploy` job** (needs `quality`): `npm ci` → `migrate` → `validate` (non-blocking) → `build` → `actions/upload-pages-artifact@v3` with `nextjs-site/out` → `actions/deploy-pages@v4`.

Triggers: `push` to `master`, `pull_request` targeting `master`, and `workflow_dispatch`. Deployments are serialized through the `pages-nextjs` concurrency group, and an in-progress deploy is never cancelled.

## Alternatives considered

- **Commit the built site to a `gh-pages` branch.** Rejected: it pollutes history, and the artifact-based Pages deployment is the current GitHub recommendation.
- **Build on Forgejo and push the artifacts to GitHub.** Rejected: more moving parts, and the Pages deploy actions need GitHub's OIDC token anyway.

## Consequences

- The production branch is the branch named in the workflow triggers. Today that is `master`. If the branch is renamed to `main` (ADR-0008), the workflow triggers must be updated in the same change.
- As written, `build-and-deploy` also runs on `pull_request` events. GitHub's `github-pages` environment protection normally rejects deploys from non-default branches, so a PR run fails at the deploy step rather than publishing. Guarding the job with `if: github.event_name != 'pull_request'` would make this explicit.
- Because GitHub only receives code through the Forgejo push mirror (ADR-0007), GitHub never sees pull requests. In practice, CI runs only on pushes to `master` and on manual dispatch.
- Node 20 is used in CI. No `.nvmrc` or `engines` field pins it locally.
