# Local development

## Prerequisites

- **Node.js 24.** Astro 7 needs at least Node 22.22, and older versions fail as soon as `astro` starts. The version is pinned in `.nvmrc` (at the repository root and in `astro-site/`), and `astro-site/package.json` declares `"engines": { "node": ">=22.22.0" }`. With [nvm](https://github.com/nvm-sh/nvm), run `nvm install` once and `nvm use` in each new shell.
- npm. A `package-lock.json` is committed, so install with `npm ci`.
- Access to the Forgejo remote.

Alternatively, open the repository in the devcontainer (`.devcontainer/`). It uses a Node 24 image, runs `npm ci` in `astro-site/` on creation, and forwards port 4321.

## Setup

```bash
git clone http://forgejo.internal.binary-rise/teo.parashkevov/theoparashkevov.github.io.git
cd theoparashkevov.github.io
git switch development
nvm use
cd astro-site
npm ci
npm run dev            # http://localhost:4321
```

The dev server reloads on changes to pages, components, styles, and posts. A front-matter error in a post shows up as an error overlay that names the file and the field.

## npm scripts (`astro-site/package.json`)

| Script | What it does |
| --- | --- |
| `dev` | Astro dev server at <http://localhost:4321> with hot reload |
| `build` | `astro build`: writes the static site to `astro-site/dist/` |
| `preview` | Serves the built `dist/` locally, to check the production build. Run `build` first. |
| `check` | `astro check`: type-checks `.astro` and `.ts` files, including content-collection types |
| `lint` | ESLint (`eslint.config.js`: JS, typescript-eslint, and eslint-plugin-astro recommended rules) |
| `format` / `format:check` | Prettier with `prettier-plugin-astro` (write / verify only) |
| `test` / `test:watch` | Vitest (single run / watch mode) |

`build` writes only to the git-ignored `dist/` (and the `.astro/` cache). It never changes tracked files.

## Before opening a PR

Run the same checks as CI ([deployment.md](deployment.md)):

```bash
cd astro-site
npm run check
npm run lint
npm run format:check      # blocking in CI; run `npm run format` to fix
npm test
npm run build             # catches content-schema and rendering errors
```

## Tests

- Located in `astro-site/tests/`, named `*.test.ts` (`vitest.config.ts`).
- Vitest runs through Astro's `getViteConfig()`, so tests share the site's Vite configuration. The environment is `node`.
- Test the pure helpers (for example `src/lib/posts.ts`: dates, slugs, reading time, sorting) rather than rendered pages. Dates are formatted in UTC, so the results don't depend on the machine's timezone.

## Code style

- Prettier settings (`astro-site/.prettierrc`): single quotes, semicolons, trailing commas `es5`, print width 100, 2-space indentation, LF line endings; `.astro` files use the Astro parser.
- Use the design tokens from `src/styles/global.css` (`bg-surface`, `text-muted`, `text-accent`, ...) instead of raw colours, so both themes keep working.
- Client-side code goes in bundled `<script>` tags (TypeScript). Because `<ClientRouter />` swaps pages without a full reload, initialise it in a `document.addEventListener('astro:page-load', ...)` handler, and make sure listeners and observers are not added twice.
- Respect `prefers-reduced-motion` in any new animation.
- Commit messages use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
