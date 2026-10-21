# Content pipeline: writing posts and pages

All content is authored as markdown in the **Jekyll tree under `docs/`**. The Next.js app never reads markdown files directly. It reads JSON produced by `npm run migrate`. Background: [ADR-0003](../../adr/0003-keep-jekyll-markdown-as-content-source.md).

## Add a blog post

1. Branch off `development` (see [branching-strategy.md](branching-strategy.md)):
   ```bash
   git switch development && git pull
   git switch -c feature/post-<slug>
   ```
2. Create `docs/_posts/YYYY-MM-DD-<slug>.md`. The filename determines both:
   - the **URL**: `/blog/<slug>/`
   - the **publication date**: parsed from the prefix as noon UTC (`extractDateFromFilename` in `lib/content/jekyll-loader.ts`).
3. Add the front matter:
   ```yaml
   ---
   layout: post
   title: My post title
   modified_date: 2026-10-21        # optional; shown as "Updated" and used in the sitemap
   categories:
     - ai                           # the first category is shown as the badge on the card
   author:
     - Teo Parashkevov
   meta: [keyword1, keyword2]
   thumbnail_location: <slug>       # → /assets/img/posts/<slug>/thumbnail.png
   usemathjax: true                 # enables remark-math + KaTeX for $...$ / $$...$$
   description: >
     One or two sentences for the card, the meta description, and RSS.
   ---
   ```
4. Put images in `docs/assets/img/posts/<slug>/`, including `thumbnail.png` if you set `thumbnail_location`. Reference them as `/assets/img/posts/<slug>/1.png`, or with the Liquid form `{{ "/assets/img/posts/<slug>/1.png" | relative_url }}`. Both work.
5. Regenerate and preview:
   ```bash
   cd nextjs-site
   npm run migrate && npm run validate
   npm run dev          # http://localhost:3000/blog/<slug>/
   ```
6. Commit **both** the source (`docs/_posts/...`, `docs/assets/...`) and the generated output (`nextjs-site/content/...`, `nextjs-site/public/assets/...`), then open a PR into `development`.

## Edit a page (About, Contact, Projects)

Edit `docs/<page>.md`, then run `npm run migrate`. The page JSON stores raw markdown, which is converted to sanitized HTML when the page is built.

## Rules and gotchas

- **Never hand-edit `nextjs-site/content/**` or `nextjs-site/public/assets/**`.** Both are overwritten by the next migration, including the one CI runs before every deploy.
- **Never add a non-page `.md` file at the top level of `docs/`.** It would be migrated as a page. Put docs in `docs/handbook/`.
- **Raw HTML is allowed but filtered.** Anything outside the allowlist in `lib/utils/sanitize-html.ts` is silently stripped. That includes `<iframe>`, `<script>`, `<video>`, and event-handler attributes. Extend the allowlist deliberately if you need one of them.
- **Liquid support is limited** to what `processLiquidSyntax()` in `lib/markdown/processor.ts` handles: `site.url`, `site.baseurl`, `page.*`, and asset paths piped through `relative_url`, `asset_path`, or `img_url`. Any other Liquid tag ends up as literal text on the page.
- **Drafts** in `docs/_drafts/` are never published. To publish one, move it into `_posts/` with a date prefix.
- Posts are sorted newest first by filename date.
