# Local development

## Prerequisites

- Node.js 20, the version CI uses (`.github/workflows/nextjs-deploy.yml`). Nothing pins it locally, so use `nvm use 20` or similar.
- npm. A `package-lock.json` is committed, so use `npm ci`.
- Access to the Forgejo remote.

The `.devcontainer/` targets the old Ruby/Jekyll stack and is **not** needed for the Next.js site.

## Setup

```bash
git clone http://forgejo.internal.binary-rise/teo.parashkevov/theoparashkevov.github.io.git
cd theoparashkevov.github.io
git switch development
cd nextjs-site
npm ci
npm run dev            # http://localhost:3000
```

> `nextjs-site/AGENTS.md`: this Next.js version (16.x) has breaking changes compared with older documentation and tutorials. Before changing framework-level code (routing, config, metadata, images), read the bundled docs in `node_modules/next/dist/docs/`.

## npm scripts (`nextjs-site/package.json`)

| Script | What it does |
| --- | --- |
| `dev` | Next dev server with hot reload. Uses the committed JSON in `content/`. |
| `migrate` | `docs/` → `content/*.json` + `public/assets/` |
| `seo` | Writes `public/sitemap.xml`, `public/robots.txt`, `public/rss.xml` |
| `validate` | Checks the generated JSON (required fields, dates, duplicate slugs, alt text, internal links) |
| `build` | `prebuild` (migrate + seo + validate), then `next build`, which writes `out/` |
| `preview` | `next build && next start`. Note that `next start` does not serve an `output: 'export'` build. To preview `out/`, use a static server, e.g. `npx serve out`. |
| `lint` / `lint:fix` | ESLint |
| `format` / `format:check` | Prettier |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:watch` / `test:coverage` | Jest |

`npm run build` rewrites tracked files under `content/` and `public/`. Run `git status` afterwards and commit the regenerated files if the source in `docs/` changed. Otherwise, discard the changes.

## Before opening a PR

Run the same checks as CI:

```bash
cd nextjs-site
npm run lint
npm run typecheck
TZ=UTC npm test -- --coverage
npm run format:check      # not blocking in CI yet, but keep new files clean
npm run build             # catches static-export errors the other checks miss
```

The `TZ=UTC` matters. Three date-formatting tests fail in non-UTC timezones (see [known-issues.md](known-issues.md#tests-depend-on-the-machine-timezone)).

## Tests

- Located in `nextjs-site/__tests__/`, mirroring the source tree (`components/`, `lib/content/`, `lib/markdown/`, `lib/seo/`, `lib/utils/`).
- Environment: jsdom. `@/` maps to the package root. `isomorphic-dompurify` maps to `dompurify` (`jest.config.js`).
- Coverage threshold: 50% globally for branches, functions, lines, and statements. The current baseline is about 54% of statements over 149 tests, so add tests together with new code.
- If a test imports a new ESM-only unified/remark/rehype package, add that package to `transformIgnorePatterns` in `jest.config.js`.

## Code style

- Prettier settings (`.prettierrc`): single quotes, semicolons, trailing commas `es5`, print width 100, 2-space indentation, LF line endings.
- ESLint: TypeScript and React rules, with `eslint-config-prettier` turning off rules that conflict with Prettier. `no-explicit-any` is a warning.
- Commit messages use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
