# theoparashkevov.github.io

Personal blog and portfolio of Teo Parashkevov, built with [Astro](https://astro.build), Tailwind CSS 4 and TypeScript. The site is fully static and deployed to GitHub Pages at <https://theoparashkevov.github.io>.

## Requirements

Node.js 24 (Astro 7 needs Node >= 22.22). The version is pinned in `.nvmrc`:

```sh
nvm install
nvm use
npm ci
```

## Scripts

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start the dev server at `http://localhost:4321`        |
| `npm run build`        | Build the static site into `dist/`                     |
| `npm run preview`      | Serve the production build locally                     |
| `npm run check`        | Type-check `.astro`, `.ts` and content (`astro check`) |
| `npm run lint`         | Lint with ESLint (JS, TypeScript and Astro)            |
| `npm run format`       | Format everything with Prettier                        |
| `npm run format:check` | Verify formatting without writing changes              |
| `npm test`             | Run the Vitest suite once                              |
| `npm run test:watch`   | Run Vitest in watch mode                               |

## Where things live

- `src/content/blog/*.md` — blog posts. The filename is the URL slug (`/blog/<slug>/`); the front-matter schema is defined in `src/content.config.ts` (`title`, `description` and `pubDate` are required). Use `math: true` for KaTeX and `draft: true` to hide a post.
- `public/assets/img/` — images and other static files, referenced with absolute paths such as `/assets/img/posts/<folder>/thumbnail.png`.
- `src/pages/` — routes (`/`, `/blog/`, `/about/`, `/projects/`, `/contact/`, `/rss.xml`).
- `src/components/`, `src/layouts/` — UI components and page layouts.
- `src/lib/posts.ts` — helpers for querying, sorting and formatting posts.
- `src/consts.ts` — site metadata, navigation and social links.
- `src/styles/` — global styles, design tokens and animations.
- `tests/` — Vitest unit, component (Astro Container API) and content-integrity tests.
