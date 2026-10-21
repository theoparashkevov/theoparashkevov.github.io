# Project handbook

Documentation for working on the `theoparashkevov.github.io` repository: the personal site and blog published at <https://theoparashkevov.github.io>.

> **Why is this in `docs/handbook/`?**
> `docs/` used to hold the Jekyll site. Since the Astro rewrite ([ADR-0009](../../adr/0009-rewrite-site-with-astro.md)) the site and all of its content live in `astro-site/`, and `docs/` holds only this handbook. Nothing in `docs/` is built or published.

## Contents

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | Repository layout, tech stack, routes, how the build turns Markdown into pages |
| [content-pipeline.md](content-pipeline.md) | Writing posts: file names, front matter, images, math, code, drafts |
| [development.md](development.md) | Local setup, npm scripts, testing and code quality |
| [deployment.md](deployment.md) | CI/CD, GitHub Pages, Forgejo CI, and the Forgejo → GitHub mirror |
| [branching-strategy.md](branching-strategy.md) | `feature/*` → `development` → `main`, step by step |
| [known-issues.md](known-issues.md) | Open gaps and pitfalls, and what the rewrite resolved |

Architecture decisions, and the reasons behind them, are recorded in [`/adr`](../../adr/README.md).

## Quick facts

- **Stack:** Astro 7 (static output) · TypeScript (strict) · Tailwind CSS 4 · Markdown content collections · remark-math + rehype-katex · Shiki.
- **App location:** `astro-site/`. Posts: `astro-site/src/content/blog/`. Images: `astro-site/public/assets/img/`.
- **Node:** 24, pinned in `.nvmrc`. Astro 7 needs at least 22.22.
- **Primary remote:** Forgejo (`origin`). GitHub is a push mirror and hosts the Pages deployment.
- **Production branch:** `master`, to be renamed `main` (see [branching-strategy.md](branching-strategy.md)). Every push to it deploys.
