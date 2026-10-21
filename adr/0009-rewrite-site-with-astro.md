# ADR-0009: Rewrite the site with Astro 7

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Teo Parashkevov

## Context

The site was a Next.js static export (ADR-0002) fed by the Jekyll tree in `docs/` through a migration step (ADR-0003). That setup cost more than a personal blog of eight posts justifies:

- **Too many moving parts.** Every build ran `migrate` (Jekyll markdown → JSON, with Liquid rewritten by regexes), then `seo` and `validate`, and only then `next build`. On top of that, a DOMPurify sanitizer ran over HTML the site owner had written.
- **Generated files were committed.** `nextjs-site/content/**` and `nextjs-site/public/assets/**` were build output kept in git, so every image existed twice and a hand edit in the wrong place was silently overwritten.
- **Security headers did nothing.** `headers()` in `next.config.ts` and `public/_headers` are both ignored by an `output: 'export'` build on GitHub Pages.
- **Features stalled between the two stacks.** The code side panel (commit `d821c42`) was wired into the Jekyll layouts only and never reached production.
- The design was dated, had no dark mode, and had no motion.

GitHub Pages hosting (ADR-0004) and the Forgejo → GitHub mirror (ADR-0007) work well and are not in question.

## Decision

We will rewrite the site with **Astro 7** using static output, in a new package `astro-site/`.

- **Content:** posts are plain Markdown (no Liquid) in `astro-site/src/content/blog/<slug>.md`. They are loaded through a content collection with the glob loader (`astro-site/src/content.config.ts`), and their front matter is validated by a zod schema. The file name is the URL slug.
- **Assets:** post images live in `astro-site/public/assets/img/posts/<folder>/` and are referenced by absolute path. There is one copy of each.
- **Markdown:** Astro's `unified()` processor from `@astrojs/markdown-remark`, with `remark-math` + `rehype-katex` for math and dual Shiki themes (`github-light` / `github-dark-dimmed`, `defaultColor: false`) so code follows the colour theme.
- **Design:** Tailwind CSS 4 (via `@tailwindcss/vite`) with design tokens defined once in `src/styles/global.css`, covering a light and a dark theme. Dark mode is a `.dark` class on `<html>`, set from the stored preference or `prefers-color-scheme`.
- **Motion:** page transitions with `<ClientRouter />` from `astro:transitions`, including a shared-element morph from a post card into the post header; scroll-reveal through `data-reveal` attributes; small hover and press micro-interactions. All motion is disabled under `prefers-reduced-motion`.
- **URLs stay the same:** `/`, `/blog/`, `/blog/<slug>/`, `/about/`, `/projects/`, `/contact/`, `/rss.xml`.
- **Toolchain:** Node 24, pinned with `.nvmrc`. Astro 7 requires Node >= 22.22. Quality gates are `astro check`, ESLint, Prettier, and Vitest.

## Alternatives considered

- **Keep Next.js and fix it incrementally.** Rejected: the migration pipeline, the committed artifacts, and the React runtime on a mostly static site would all remain. Every fix would be made on top of the complexity that caused the problems.
- **Astro reading `docs/` directly through the glob loader, plus a remark plugin that rewrites Liquid.** Rejected: it keeps glue code and two content formats alive just to avoid a one-off conversion of eight posts.
- **Starlight or a ready-made Astro theme.** Rejected: Starlight is built for documentation sites, not a blog and portfolio, and a theme template brings its own structure and design that would need to be undone to match the intended look.

## Consequences

- `nextjs-site/` is removed, along with the Jekyll scaffolding in `docs/`. `docs/` keeps only `docs/handbook/`. The old sites remain in git history.
- There is **no migration step** and nothing generated is committed. Edit the Markdown and the build picks it up. Invalid front matter fails the build.
- CI changes: GitHub runs `.github/workflows/deploy.yml` (replacing `nextjs-deploy.yml`), which uploads `astro-site/dist`. Forgejo runs a new `.forgejo/workflows/ci.yml` (checks and build, no deploy) on pushes to `development` and on PRs. See the [deployment guide](../docs/handbook/deployment.md).
- Contributors and CI need Node >= 22.22. Older Node versions fail at `astro` start-up.
- Raw HTML in posts is rendered as written. The DOMPurify step from ADR-0005 does not exist in the new site, which is acceptable because all content is first-party and rendered at build time. A CSP, if wanted, has to be a `<meta http-equiv>` tag.
- The ported code panel and the new animations are client-side scripts. They must re-initialise on `astro:page-load`, because the ClientRouter swaps pages without a full reload.
- This ADR supersedes ADR-0005 (no sanitizer step, see above) and ADR-0006. The quality gates are now `astro check`, ESLint, `prettier --check` and Vitest. All of them are blocking, and there is no coverage threshold. It amends ADR-0004: the decision to deploy through GitHub Actions stands, but the workflow is now `deploy.yml` (quality → build → deploy, with the deploy job restricted to the production branch).
