# theoparashkevov.github.io

Source of [theoparashkevov.github.io](https://theoparashkevov.github.io), the personal site and blog of Teo Parashkevov, a machine learning engineer and senior Python developer. It is a static [Astro 7](https://astro.build) site in `astro-site/`, styled with Tailwind CSS 4 and including a light and dark theme. Posts are Markdown files in `astro-site/src/content/blog/`, with KaTeX math and Shiki code highlighting. Day-to-day work happens on a self-hosted Forgejo instance, which push-mirrors to GitHub, where GitHub Actions builds the site and deploys it to GitHub Pages.

## Quickstart

Requires Node 24 (Astro 7 needs at least 22.22). The version is pinned in `.nvmrc`.

```bash
nvm use
cd astro-site
npm ci
npm run dev          # http://localhost:4321
```

Before opening a PR, run `npm run check`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` in `astro-site/`.

## Documentation

- [Project handbook](docs/handbook/README.md): architecture, writing posts, local development, deployment, branching strategy, and known issues.
- [Architecture Decision Records](adr/README.md): what was decided and why, including the [Astro rewrite](adr/0009-rewrite-site-with-astro.md).

## License

See [LICENSE](LICENSE).
