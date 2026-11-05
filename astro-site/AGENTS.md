## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## GitHub activity (Open Source page)

The `/open-source/` page renders GitHub contribution data fetched at BUILD time
by `src/lib/github.ts`:

- With `GITHUB_TOKEN` in the environment, it uses the GraphQL API for the
  contribution calendar (heatmap, monthly chart, streak) plus the repo list.
  In GitHub Actions this is the auto-generated `secrets.GITHUB_TOKEN`, which is
  scoped to this repository only. Locally you can use `GITHUB_TOKEN=$(gh auth token)`.
- Without a token, it falls back to unauthenticated REST:
  repos with per-repo commit sparklines still render; the calendar sections are
  omitted. A fetch failure degrades to an "activity unavailable" panel — it
  never breaks the build. In Forgejo CI the token is the `PUBLIC_REPOS_TOKEN`
  secret (read-only, public-repos-only PAT), passed to `npm run build` in the
  test job and to the Docker image build via a BuildKit secret mount, so it is
  never baked into the image or visible in logs.
- Results are cached for 24h in `.cache/github-activity.json` (gitignored) to
  protect rate limits.

Privacy rules — do NOT relax these:

- Only repos owned by the personal account (`ownerAffiliations: OWNER`), never
  forks, never archived repos, and never organization repos the author merely
  contributes to.
- Only PUBLIC repos: the GraphQL query sets `privacy: PUBLIC` AND the code
  filters out `isPrivate` nodes (belt and braces, so a broad personal token
  used locally cannot leak private work repos into the published HTML). The
  REST endpoint only returns public repos by design.
- The weekly scheduled rebuild in `.github/workflows/deploy.yml` exists only
  to refresh this data; the token there cannot see anything outside this repo.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
