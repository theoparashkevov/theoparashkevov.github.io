# Project handbook

Documentation for working on the `theoparashkevov.github.io` repository: the personal site and blog published at <https://theoparashkevov.github.io>.

> **Why is this in `docs/handbook/` and not directly in `docs/`?**
> The top level of `docs/` is the site's content source. The build turns every top-level `docs/*.md` file into a site page (see [ADR-0003](../../adr/0003-keep-jekyll-markdown-as-content-source.md)). Subfolders are ignored by the migration, so project documentation lives here.

## Contents

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | Repository layout, tech stack, how a request becomes a page |
| [content-pipeline.md](content-pipeline.md) | Writing posts and pages; how `docs/` becomes the Next.js site |
| [development.md](development.md) | Local setup, npm scripts, testing and code quality |
| [deployment.md](deployment.md) | CI/CD, GitHub Pages, and the Forgejo → GitHub mirror |
| [branching-strategy.md](branching-strategy.md) | `feature/*` → `development` → `main`, step by step |
| [known-issues.md](known-issues.md) | Gaps and pitfalls found during the October 2026 repo analysis |

Architecture decisions, and the reasons behind them, are recorded in [`/adr`](../../adr/README.md).

## Quick facts

- **Stack:** Next.js 16 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind CSS 4 · unified/remark/rehype + KaTeX.
- **App location:** `nextjs-site/`. Content source: `docs/` (legacy Jekyll tree).
- **Primary remote:** Forgejo (`origin`). GitHub is a push mirror and hosts the Pages deployment.
- **Production branch:** `master`, to be renamed `main` (see [branching-strategy.md](branching-strategy.md)). Every push to it deploys.
