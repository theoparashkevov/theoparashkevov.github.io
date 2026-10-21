# Known issues and recommended follow-ups

Findings from the repository analysis on 2026-10-21, against `master` at `d821c42`. Each item suggests a branch name so it can be picked up as a `feature/*` or `fix/*` off `development`.

Baseline at that commit: lint passes (0 errors, 7 warnings); typecheck passes; tests pass 149/149 in UTC and 146/149 in other timezones; statement coverage is about 54%; Prettier reports 27 unformatted files.

## High

### Security headers are not served in production
`public/_headers` uses the Netlify/Cloudflare Pages convention, which **GitHub Pages ignores**. `headers()` in `next.config.ts` is not applied to an `output: 'export'` build either. As a result, the deployed site sends none of the configured headers (CSP, HSTS, X-Frame-Options, ...), even though `IMPROVEMENTS.md` describes them as active.
*Fix:* emit the CSP as a `<meta http-equiv="Content-Security-Policy">` tag in `app/layout.tsx`. Accept that HSTS and frame-ancestors cannot be set from GitHub Pages, or put a CDN such as Cloudflare in front. Remove or relabel `_headers` so it no longer suggests protection that isn't there. → `fix/security-headers-static-export`

### CI does not cover `development` or feature branches
The workflow triggers only on `master`, and PRs live on Forgejo, not GitHub. Nothing automatically checks a change before it reaches `development`.
*Fix:* add `.forgejo/workflows/ci.yml` running lint, typecheck, and tests on PRs into `development`/`main`, and require it in branch protection. → `feature/forgejo-ci`

### The code side panel is not on the live site
Commit `d821c42` added `code-panel.js`/`.css` and wired them into `docs/_layouts/post.html` and `docs/_includes/head.html`, which are **Jekyll** templates. The Next.js site does not use them. The files are copied to `public/assets/` but never loaded.
*Fix:* port the panel to a React client component used by `components/BlogPostContent.tsx`. → `feature/code-panel-nextjs`

## Medium

### Tests depend on the machine timezone
`BlogCard` › "displays the formatted date" and `BlogPostContent` › "displays the formatted date" / "displays modified date when provided" fail outside UTC. The components call `toLocaleDateString` without a `timeZone`. CI runs in UTC, so the tests pass there.
*Fix:* pass `timeZone: 'UTC'` in the components' date formatting, which also makes the rendered output deterministic. Alternatively, set `process.env.TZ = 'UTC'` in the Jest setup. → `fix/timezone-tests`

### `build-and-deploy` has no event guard
The deploy job also runs on `pull_request` events. It relies on environment protection to fail the deploy step.
*Fix:* add `if: github.event_name != 'pull_request'` to the `build-and-deploy` job. → `fix/ci-deploy-guard`

### Production branch is `master`, not `main`
The agreed strategy uses `main`. See the [rename procedure](branching-strategy.md#renaming-master-to-main). → `feature/rename-master-to-main`

### Format and content-validation checks are non-blocking
Both run with `continue-on-error: true`, and 27 files are currently unformatted.
*Fix:* make one `npm run format` commit, then remove `continue-on-error` from the format step. → `feature/prettier-baseline`

## Low

- **Root `README.md` is empty.** The `nextjs-site/README.md` is the unmodified create-next-app boilerplate. Point both at `docs/handbook/`.
- **`.devcontainer/` targets Ruby/Jekyll.** Switch it to a Node 20 image, or delete it.
- **Leftover Jekyll scaffolding** in `docs/` (`_layouts`, `_includes`, `_sass`, `Gemfile*`, `minima.gemspec`, `script/`, `_config.yml`), plus `templates/`. None of it affects the live site. Decide whether to keep the Jekyll site buildable or remove it in favour of plain markdown + assets (see ADR-0003, "Alternatives considered").
- **`/projects/` is not in the navigation** (`components/Navigation.tsx` lists Home, Blog, About, and Contact only), though it is in the sitemap.
- **`npm run preview` uses `next start`**, which does not serve a static export. Use a static file server on `out/` instead.
- **Node version is not pinned locally.** Add `.nvmrc` (`20`) and/or `"engines"` to `package.json`.
- **CSP (once effective) allows `'unsafe-eval'`** for scripts. Check whether it is actually needed. KaTeX output is static HTML and should not require it.
- **Root-level summary files** (`IMPROVEMENTS.md`, `CODE_PANEL_FEATURE.md`) duplicate what ADRs and the handbook now cover. Consider moving them into `docs/handbook/` or retiring them.
