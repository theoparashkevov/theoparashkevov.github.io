# Architecture

## Repository layout

```
.
├── adr/                    Architecture Decision Records
├── docs/                   CONTENT SOURCE (legacy Jekyll site, no longer deployed)
│   ├── _posts/             Blog posts: YYYY-MM-DD-slug.md        → migrated
│   ├── _drafts/            Unpublished drafts                    → not migrated
│   ├── *.md                Top-level pages (about, contact, ...) → migrated as pages
│   ├── assets/             Images, PDFs, legacy CSS/JS           → copied to nextjs-site/public/assets
│   ├── _layouts/ _includes/ _sass/ _config.yml Gemfile ...   Jekyll-only; unused by the live site
│   └── handbook/           This documentation (ignored by the migration)
├── nextjs-site/            THE SITE (Next.js app)
│   ├── app/                Routes (App Router)
│   ├── components/         React components
│   ├── lib/                content loaders, markdown processor, SEO, sanitizer
│   ├── scripts/            migrate-content, generate-seo-files, validate-content
│   ├── content/            GENERATED JSON from docs/ (committed)
│   ├── public/             Static files; public/assets is GENERATED from docs/assets (committed)
│   └── __tests__/          Jest tests, mirroring the source tree
├── .github/workflows/      nextjs-deploy.yml (active), jekyll.yml.disabled
├── .devcontainer/          Ruby/Jekyll devcontainer (outdated, see known-issues)
├── templates/              Jekyll sample posts, kept for reference only
├── IMPROVEMENTS.md         Change log of the June 2026 hardening work
└── CODE_PANEL_FEATURE.md   Notes for the (Jekyll-only) code side panel
```

## Tech stack

| Concern | Choice | Where |
| --- | --- | --- |
| Framework | Next.js 16 App Router, `output: 'export'` | `nextjs-site/next.config.ts` |
| UI | React 19, Tailwind CSS 4 + `@tailwindcss/typography`, `react-icons`, Inter via `next/font` | `app/`, `components/`, `tailwind.config.ts` |
| Markdown | unified → remark-parse → remark-rehype → (remark-math + rehype-katex) → rehype-raw → rehype-stringify | `lib/markdown/processor.ts` |
| Front matter | `gray-matter` | `lib/content/jekyll-loader.ts` |
| HTML safety | `isomorphic-dompurify` with an allowlist | `lib/utils/sanitize-html.ts` |
| SEO | Next `Metadata` API, Open Graph/Twitter cards, JSON-LD (Person, BlogPosting), sitemap/robots/RSS | `lib/seo/metadata.ts`, `scripts/generate-seo-files.ts` |
| Tooling | TypeScript strict, ESLint 9 flat config, Prettier, Jest 30 + Testing Library | config files in `nextjs-site/` |

## Routes

| URL | File | Data source |
| --- | --- | --- |
| `/` | `app/page.tsx` | `content/posts/index.json` |
| `/blog/` | `app/blog/page.tsx` | all posts |
| `/blog/<slug>/` | `app/blog/[slug]/page.tsx` | `content/posts/<slug>.json` (pre-rendered via `generateStaticParams`) |
| `/about/`, `/contact/`, `/projects/` | `app/<name>/page.tsx` | `content/pages/<name>.json`, rendered from markdown at build time |

Every route is rendered to static HTML when `next build` runs. Nothing runs on a server at request time.

## Build-time data flow

```
docs/_posts/*.md ─┐                         ┌─ content/posts/*.json (HTML pre-rendered)
docs/*.md ────────┼─ npm run migrate ──────▶├─ content/pages/*.json (raw markdown)
docs/assets/** ───┘   (scripts/migrate-     └─ public/assets/**
                       content.ts)
                                │
                     npm run seo (sitemap.xml, robots.txt, rss.xml → public/)
                     npm run validate (sanity checks on the JSON)
                                │
                     next build ── lib/content/loader.ts reads JSON
                                │   pages: markdownToHtml → sanitizeHTML
                                │   posts: htmlContent → sanitizeHTML
                                ▼
                       nextjs-site/out/  ──▶ GitHub Pages
```

`npm run build` runs all of the above automatically through the `prebuild` npm hook.

## Hosting topology

```
developer ──push/PR──▶ Forgejo (origin, source of truth)
                           │ push mirror (all branches)
                           ▼
                        GitHub repo ──push to master──▶ GitHub Actions ──▶ GitHub Pages
```

See [deployment.md](deployment.md) and [ADR-0007](../../adr/0007-forgejo-primary-github-push-mirror.md).
