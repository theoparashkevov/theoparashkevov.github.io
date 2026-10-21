# ADR-0007: Forgejo as the primary remote, GitHub as a push mirror

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Teo Parashkevov

## Context

Development happens against a self-hosted Forgejo instance (`origin` = `http://forgejo.internal.binary-rise/teo.parashkevov/theoparashkevov.github.io.git`). The public site, however, must be built and served by GitHub Pages under the `theoparashkevov.github.io` repository on GitHub (ADR-0004).

## Decision

- **Forgejo is the source of truth.** All clones push to Forgejo, and pull requests and code review happen on Forgejo.
- **GitHub is a downstream push mirror**, configured in the Forgejo repository under *Settings → Repository → Mirror settings → Push mirror*. Nobody pushes to GitHub directly.
- GitHub Actions on the mirror performs the build and deploy whenever the production branch is updated.

## Alternatives considered

- **GitHub as primary, Forgejo as pull mirror.** Rejected: the goal is to keep day-to-day work on self-hosted infrastructure.
- **Pushing to both remotes manually.** Rejected: they drift as soon as someone forgets.

## Consequences

- **Pushing to GitHub directly breaks the mirror.** The next mirror sync either fails or force-overwrites the GitHub change, depending on the mirror settings. Treat GitHub as read-only.
- A push mirror replicates all branches and tags by default, so `development` and `feature/*` also appear on GitHub. That is harmless for deployment, because only the production branch triggers a deploy. Newer Forgejo versions can limit the mirror to selected branches if this becomes noisy.
- Sync happens on the mirror interval (and, if enabled, on every push). There can be a delay between a merge on Forgejo and the deploy on GitHub. A manual *Synchronize now* on Forgejo forces it.
- The GitHub token used by the mirror must be allowed to update workflow files: a classic PAT needs the `workflow` scope; a fine-grained token needs Contents and Workflows write access. Without it, any push that touches `.github/workflows/` is rejected by GitHub, and the mirror stalls.
- Forgejo Actions, if runners are enabled on the instance, falls back to reading `.github/workflows/` when `.forgejo/workflows/` does not exist. The Pages deploy steps cannot succeed there. If Forgejo CI is wanted (for example, to gate PRs into `development`), add a dedicated `.forgejo/workflows/ci.yml` that runs only the quality checks.
- Pull requests never reach GitHub, so GitHub's `pull_request` workflow trigger is effectively unused.
