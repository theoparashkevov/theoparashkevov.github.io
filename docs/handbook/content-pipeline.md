# Writing posts

Posts are plain Markdown files in `astro-site/src/content/blog/`. Astro loads them through the `blog` content collection (`astro-site/src/content.config.ts`), validates the front matter against a zod schema, and renders the body at build time. There is no migration step and nothing generated to commit. Background: [ADR-0009](../../adr/0009-rewrite-site-with-astro.md).

## Add a blog post

1. Branch off `development` (see [branching-strategy.md](branching-strategy.md)):
   ```bash
   git switch development && git pull
   git switch -c feature/post-<slug>
   ```
2. Create `astro-site/src/content/blog/<slug>.md`. The file name, without `.md`, is the **slug**, and the post is published at `/blog/<slug>/`. Use lowercase kebab-case. The date does **not** go in the file name.
3. Add the front matter (see [the schema](#front-matter-schema) below):
   ```yaml
   ---
   title: My post title
   description: One or two sentences for the post card, the meta description, and RSS.
   pubDate: 2026-10-21
   updatedDate: 2026-11-02            # optional; shown as "Updated"
   categories:
     - ai                             # the first category is the badge on the card
   tags: [keyword1, keyword2]
   heroImage: /assets/img/posts/<slug>/thumbnail.png
   heroAlt: What the hero image shows
   math: true                         # only if the post contains math
   draft: true                        # remove (or set false) to publish
   ---
   ```
4. Put images and other files in `astro-site/public/assets/img/posts/<folder>/`. Usually `<folder>` is the slug, but it doesn't have to be. See [Images and files](#images-and-files).
5. Write the body, starting at `##`. The layout renders the title as the page's `<h1>` and builds the table of contents from the `##`/`###` headings, so don't add an H1 or a manual table of contents.
6. Preview it:
   ```bash
   cd astro-site
   npm run dev          # http://localhost:4321/blog/<slug>/
   ```
   Drafts are hidden everywhere, including in the dev server, so set `draft: false` (or remove the key) while you preview.
7. Run the checks from [development.md](development.md#before-opening-a-pr), then open a PR into `development`.

## Front-matter schema

Defined in `astro-site/src/content.config.ts`. A missing required field or a value of the wrong type fails `npm run dev` and `npm run build` with an error that names the file and the field.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Post title. Also used for the `<title>` tag and RSS. |
| `description` | string | yes | Clean 1–2 sentence summary. Used on post cards, in meta tags, and in RSS. |
| `pubDate` | date | yes | `YYYY-MM-DD`. Posts are sorted newest first by this date. Dates are displayed in UTC, so they don't shift with the reader's timezone. |
| `updatedDate` | date | no | Last significant update. |
| `categories` | string[] | no (default `[]`) | Broad topics. The first one is shown as the card badge. They also drive the category filters on `/blog/`. |
| `tags` | string[] | no (default `[]`) | Keywords, shown on the post and used as article tags in the meta data. |
| `author` | string | no (default `Teo Parashkevov`) | |
| `heroImage` | string | no | Absolute public path, e.g. `/assets/img/posts/<folder>/thumbnail.png`. Used for the card, the post header, and social previews. Without it, a default thumbnail is used. |
| `heroAlt` | string | no | Alt text for `heroImage`. Always set it when `heroImage` is set. |
| `math` | boolean | no (default `false`) | Set to `true` when the post contains math. |
| `draft` | boolean | no (default `false`) | `true` keeps the post out of every listing, RSS, and the build. |

## Images and files

- Everything under `astro-site/public/` is copied to the site root unchanged. A file at `astro-site/public/assets/img/posts/<folder>/1.png` is served at `/assets/img/posts/<folder>/1.png`.
- Reference images by that **absolute** path. Relative paths and Liquid tags such as `{{ ... | relative_url }}` are not supported.
- Give every image meaningful alt text: `![Architecture of the system](/assets/img/posts/<folder>/1.png)`.
- Use raw HTML only when Markdown can't express it, for example a sized image or two images side by side. Keep it valid and well nested, because Astro's compiler rejects unclosed tags and invalid nesting. Raw HTML is rendered as written, with no sanitizer.
- Non-image files such as PDFs go in the same folder and are linked the same way: `[slides (PDF)](/assets/img/posts/<folder>/slides.pdf)`.

## Math

Math is rendered at build time with KaTeX (`remark-math` + `rehype-katex`). No client-side JavaScript is involved.

- Inline: `$e^{i\pi} + 1 = 0$`
- Display: put `$$` on its own line before and after the expression:
  ```markdown
  $$
  y(t) = g(t) + s(t) + h(t) + \epsilon_t
  $$
  ```
- `\(...\)` and `\[...\]` delimiters are **not** recognised. Use `$` and `$$`.
- A literal dollar sign in prose must be escaped as `\$`.

## Code blocks

Code is highlighted at build time by Shiki, with a light (`github-light`) and a dark (`github-dark-dimmed`) theme that follow the site theme. Always fence code with a language, otherwise it is shown unhighlighted:

````markdown
```python
def push(stack, item):
    stack.append(item)
```
````

Use `text` for output or plain text and `bash`/`shell` for commands. On the post page, code blocks get a copy button and can be opened in the code side panel.

## Drafts

Set `draft: true` in the front matter. The post stays in the repository but is excluded from `getPublishedPosts()`, so it gets no page, does not appear on `/` or `/blog/`, and is left out of RSS and the sitemap. To publish, remove the key or set it to `false`, and update `pubDate` to the publication day.

## Edit a page (About, Projects, Contact)

These pages are Astro components, not Markdown. Edit `astro-site/src/pages/<name>.astro` and the components it uses under `astro-site/src/components/<name>/`. For example, the project list is data in `astro-site/src/components/projects/projects.ts`. Site-wide values (title, tagline, navigation, social links, email) are in `astro-site/src/consts.ts`.
