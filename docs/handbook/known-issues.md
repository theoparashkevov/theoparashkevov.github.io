# Known issues and recommended follow-ups

The first version of this page came from the repository analysis on 2026-10-21, against `master` at `d821c42` (the Next.js site). The Astro rewrite ([ADR-0009](../../adr/0009-rewrite-site-with-astro.md)) resolved most of those findings. They are listed at the end for reference. Each open item suggests a branch name so it can be picked up as a `feature/*` or `fix/*` off `development`.

## Open

### Production branch is `master`, not `main`
The agreed strategy uses `main`. Both `.github/workflows/deploy.yml` (`push`) and `.forgejo/workflows/ci.yml` (`pull_request`) still name `master`, and both must be updated as part of the rename. See the [rename procedure](branching-strategy.md#renaming-master-to-main). → `feature/rename-master-to-main`

### Forgejo CI runner label is unverified
`.forgejo/workflows/ci.yml` uses `runs-on: docker`. If no runner on the instance registers that label, the job stays queued and never reports a status (see [deployment.md](deployment.md#forgejo-ciyml)).
*Fix:* check the labels under *Site administration → Actions → Runners* (or ask the instance admin), adjust `runs-on`, and then require the check in branch protection for `development` and `master`. → `fix/forgejo-ci-runner`

### Security headers are limited on GitHub Pages
GitHub Pages does not let a site set response headers, so HSTS, `frame-ancestors`, and `X-Frame-Options` cannot be served. The old `_headers` file and `next.config.ts` `headers()` never worked and are gone. `BaseHead.astro` sets only a minimal `<meta http-equiv="Content-Security-Policy" content="base-uri 'self'; object-src 'none'">`. A full script/style policy is not compatible with the current setup for these reasons:
- Astro's CSP support does not work with `<ClientRouter />` or Shiki.
- A meta CSP from the first page keeps applying across client-side navigations.
- Shiki and KaTeX emit inline `style` attributes.

Anything stronger needs a CDN such as Cloudflare in front of the site, or dropping `<ClientRouter />` in favour of native cross-document view transitions. → `fix/security-headers`

## Resolved by the Astro rewrite

| Finding | Resolution |
| --- | --- |
| The code side panel was wired into Jekyll layouts only and never reached production | Ported to the Astro post layout (`astro-site/src/components/post/CodeBlocks.astro`), together with copy buttons |
| Date-formatting tests failed outside UTC | Dates are formatted with `timeZone: 'UTC'` (`formatDate` in `astro-site/src/lib/posts.ts`), so output and tests are deterministic |
| `next.config.ts` `headers()` and `public/_headers` were ignored on GitHub Pages | Both are gone with `nextjs-site/`. What is still possible is listed under *Security headers are limited on GitHub Pages* above. |
| CI did not cover `development` or feature branches | `.forgejo/workflows/ci.yml` runs on pushes to `development` and on PRs into `development`/`master` |
| `build-and-deploy` also ran on `pull_request` | `deploy.yml` has no `pull_request` trigger, and its `deploy` job only runs for `refs/heads/master` (a manual dispatch from another branch builds but doesn't publish) |
| Format and content-validation checks were non-blocking | `format:check` is blocking in both workflows. Front matter is validated by the zod schema, so invalid content fails the build. |
| `.devcontainer/` targeted Ruby/Jekyll | Now a Node 24 image that installs `astro-site/` dependencies and forwards port 4321 |
| `npm run preview` used `next start`, which cannot serve a static export | `npm run preview` runs `astro preview`, which serves `dist/` |
| Node version was not pinned locally | `.nvmrc` pins Node 24, and `package.json` declares `engines.node >= 22.22.0` |
| Root `README.md` was empty | It now introduces the project and links to this handbook and the ADRs |
| `/projects/` was missing from the navigation | `NAV_LINKS` in `astro-site/src/consts.ts` includes it |
| Generated JSON and duplicated assets were committed; Liquid was handled by regexes | Posts are plain Markdown in `astro-site/src/content/blog/`, with one copy of each asset in `astro-site/public/` and no generated files |
| Leftover Jekyll scaffolding in `docs/` | Removed. `docs/` holds only this handbook. |
| Root-level legacy notes (`IMPROVEMENTS.md`, `CODE_PANEL_FEATURE.md`, `templates/`) | Removed. Their content is covered by the ADRs and this handbook. |
| ADRs 0004–0006 described the Next.js setup | ADR-0009 supersedes 0005 and 0006 and amends 0004 |
| The portrait was a 10 MB original served as-is | Pages use optimized `astro:assets` images from `astro-site/src/assets/`; the public copy (avatar, share image) is a 30 KB resize |
