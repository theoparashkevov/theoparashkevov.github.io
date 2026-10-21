# ADR-0002: Migrate from Jekyll to a Next.js static export

- **Status:** Accepted
- **Date:** 2026-06-04 (commit `495260e`)
- **Deciders:** Teo Parashkevov

## Context

From 2020 to 2025 the site was a Jekyll blog built on the `minima` theme, living in `docs/` and deployed by `.github/workflows/jekyll.yml`. Customizing it meant working in Liquid templates, Sass, and hand-written JavaScript (see `docs/assets/js/`). The Ruby toolchain had to be maintained alongside the rest of the owner's work, which is mostly TypeScript and Python. A devcontainer (`.devcontainer/`) existed only to provide Ruby and Jekyll.

GitHub Pages serves static files only, so whatever replaced Jekyll had to produce a static site.

## Decision

We will build the site with **Next.js (App Router) + React + TypeScript + Tailwind CSS**, configured with `output: 'export'` in `nextjs-site/next.config.ts` so that `next build` emits a fully static site into `nextjs-site/out/`.

Supporting choices:

- `trailingSlash: true`, so that each route is exported as `route/index.html`, which suits GitHub Pages.
- `images.unoptimized: true`, because the Next.js image optimizer needs a server.
- Blog post routes are pre-rendered with `generateStaticParams()` (`app/blog/[slug]/page.tsx`).
- Markdown is rendered with the unified/remark/rehype pipeline, with KaTeX for math (`lib/markdown/processor.ts`).

The Jekyll workflow was disabled by renaming it to `jekyll.yml.disabled`, not deleted.

## Alternatives considered

- **Stay on Jekyll.** Rejected: the Ruby toolchain and Liquid templating are friction for a TypeScript-first author.
- **Astro, Hugo, or Eleventy.** These are viable static site generators. Next.js was chosen for familiarity and for the React component model. The migration commit records no deeper comparison.
- **Next.js with server rendering, hosted on Vercel.** Rejected: GitHub Pages hosting at `theoparashkevov.github.io` is free and already in place.

## Consequences

- No server features are available: no API routes, middleware, ISR (incremental static regeneration), on-demand image optimization, or `headers()`. Note that `headers()` in `next.config.ts` only affects `next dev`/`next start`. It is **not** applied to the exported site (see [known issues](../docs/handbook/known-issues.md)).
- The repo is pinned to Next 16 / React 19. `nextjs-site/AGENTS.md` warns that this Next.js version has breaking changes compared with older docs. Read `node_modules/next/dist/docs/` before changing framework-level code.
- Jekyll-only features did not carry over automatically. For example, the code side panel (`docs/assets/js/code-panel.js`, commit `d821c42`) is wired into the Jekyll layouts only and does not appear on the deployed Next.js site.
- The `.devcontainer/` still targets Ruby and Jekyll and no longer matches the main toolchain.
