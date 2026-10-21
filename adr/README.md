# Architecture Decision Records

This folder records the significant decisions made about this repository: what was decided, why, and what it costs us.

An ADR is immutable once it is **Accepted**. To change a decision, write a new ADR that supersedes the old one, and set the old one's status to `Superseded by ADR-XXXX`.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-migrate-from-jekyll-to-nextjs-static-export.md) | Migrate from Jekyll to a Next.js static export | Superseded by [ADR-0009](0009-rewrite-site-with-astro.md) |
| [0003](0003-keep-jekyll-markdown-as-content-source.md) | Keep the Jekyll markdown in `docs/` as the content source | Superseded by [ADR-0009](0009-rewrite-site-with-astro.md) |
| [0004](0004-deploy-to-github-pages-via-github-actions.md) | Deploy to GitHub Pages via GitHub Actions | Accepted, workflow details amended by [ADR-0009](0009-rewrite-site-with-astro.md) |
| [0005](0005-sanitize-rendered-html-with-dompurify.md) | Sanitize rendered HTML with DOMPurify | Superseded by [ADR-0009](0009-rewrite-site-with-astro.md) |
| [0006](0006-quality-gates-lint-typecheck-test.md) | Quality gates: lint, typecheck, and tests before deploy | Superseded by [ADR-0009](0009-rewrite-site-with-astro.md) |
| [0007](0007-forgejo-primary-github-push-mirror.md) | Forgejo as the primary remote, GitHub as a push mirror | Accepted |
| [0008](0008-branching-strategy-feature-development-main.md) | Branching strategy: `feature/*` → `development` → `main` | Accepted |
| [0009](0009-rewrite-site-with-astro.md) | Rewrite the site with Astro 7 | Accepted |
| [0010](0010-deploy-development-to-internal-cluster.md) | Deploy the development branch to the internal Kubernetes cluster | Accepted |

## Writing a new ADR

1. Branch off `development`: `git switch development && git pull && git switch -c feature/adr-<short-name>`.
2. Copy [`template.md`](template.md) to `NNNN-short-kebab-title.md`, using the next free number.
3. Fill it in, starting with status `Proposed`.
4. Add a row to the index above.
5. Open a pull request into `development`. Set the status to `Accepted` when the PR is merged.

Keep ADRs short. Record the decision and its reasons; leave how-to material to [`docs/handbook/`](../docs/handbook/README.md).
