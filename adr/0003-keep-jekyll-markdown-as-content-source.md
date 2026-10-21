# ADR-0003: Keep the Jekyll markdown in `docs/` as the content source

- **Status:** Superseded by ADR-0009
- **Date:** 2026-06-04 (commit `495260e`, refined in `bfa77b1` and `547ad51`)
- **Deciders:** Teo Parashkevov

## Context

The blog's content (8 posts in `docs/_posts/`, top-level pages such as `about.md` and `projects.md`, and images under `docs/assets/`) was written for Jekyll. It uses YAML front matter, the `YYYY-MM-DD-slug.md` filename convention, and some Liquid expressions such as `{{ "/assets/img/x.png" | relative_url }}`. Rewriting all of it by hand for the Next.js site would have been error-prone, and it would have discarded a format the author is used to writing in.

## Decision

The Jekyll tree in `docs/` stays the **source of truth for content**. A migration step, `npm run migrate` (`nextjs-site/scripts/migrate-content.ts`), converts it at build time:

| Source | Transformation | Output |
| --- | --- | --- |
| `docs/_posts/*.md` | front matter parsed by `gray-matter`; slug and date taken from the filename; Liquid stripped or rewritten; markdown → HTML | `nextjs-site/content/posts/<slug>.json` + `index.json` |
| `docs/*.md` (top level only, not recursive) | front matter parsed; markdown kept raw | `nextjs-site/content/pages/<slug>.json` + `index.json` |
| `docs/assets/**` | copied recursively | `nextjs-site/public/assets/**` |

Next.js pages then read only the JSON, through `lib/content/loader.ts`.

The generated JSON and copied assets **are committed** to git, so `next dev` works without running a migration first. They are regenerated on every `npm run build` (through the `prebuild` script) and in CI.

## Alternatives considered

- **Move the markdown into `nextjs-site/content/` and delete `docs/`.** This is cleaner, but it would mean porting the Liquid usages and changing the authoring workflow. It is deferred, not rejected.
- **Read markdown directly at render time without the JSON step.** Possible, but the JSON step isolates the Next.js app from Jekyll quirks and keeps the loaders trivial.
- **MDX or a headless CMS.** Too much for a personal blog of fewer than 10 posts.

## Consequences

- **Every top-level `docs/*.md` file becomes a site page.** Project documentation must therefore go in a subfolder (`docs/handbook/`). It must never sit directly in `docs/`.
- Files in `nextjs-site/content/` and `nextjs-site/public/assets/` are build artifacts that happen to be committed. Edit the source in `docs/`, not the JSON. Otherwise the next migration silently overwrites your change.
- Two copies of every image exist in the repo.
- Liquid support is a set of regexes in `lib/markdown/processor.ts`. Any new Liquid construct in a post needs a matching rule there.
- Drafts in `docs/_drafts/` are not migrated. A `content/drafts/` folder is created but stays empty.
