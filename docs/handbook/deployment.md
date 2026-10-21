# Deployment

## Pipelines

Two workflows run the same checks in two places:

| Workflow | Runs on | Triggers | Does |
| --- | --- | --- | --- |
| `.github/workflows/deploy.yml` | GitHub (the mirror) | push to `master`, `workflow_dispatch` | checks → build → deploy to GitHub Pages |
| `.forgejo/workflows/ci.yml` | Forgejo | push to `development`, PRs into `development` or `master` | checks → build (no deploy) |

### GitHub: `deploy.yml`

Three jobs, each depending on the previous one. All run Node 24 with `astro-site/` as the working directory.

1. **`quality`:** `npm ci` → `npm run check` → `npm run lint` → `npm run format:check` → `npm test`. All steps are blocking.
2. **`build`:** `npm ci` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact` with **`astro-site/dist`**.
3. **`deploy`:** `actions/deploy-pages` into the `github-pages` environment.

Deployments are serialized through the `pages` concurrency group, and an in-progress deploy is never cancelled. There is no `pull_request` trigger, because PRs live on Forgejo (ADR-0007).

### Forgejo: `ci.yml`

A single job runs inside a `node:24-bookworm` container: `npm ci` → `check` → `lint` → `format:check` → `test` → `build`. It gates changes before they reach `development` and `master`. Once it has run successfully, require it as a status check in the Forgejo branch protection rules (see [branching-strategy.md](branching-strategy.md#branch-protection-on-forgejo)).

> **Runner label caveat:** the job uses `runs-on: docker`. That label must match a label registered by one of the Forgejo instance's runners, otherwise the job stays queued forever. If the runners use other labels (for example `ubuntu-latest`), change `runs-on` to match. The checkout step uses `https://code.forgejo.org/actions/checkout@v4`, so the runner needs network access to `code.forgejo.org`.

Because `.forgejo/workflows/` exists, Forgejo no longer falls back to `.github/workflows/`, so it never tries to run the Pages deploy.

## How a change reaches production

```
feature/x ──PR (Forgejo, ci.yml)──▶ development ──PR (Forgejo, ci.yml)──▶ master/main
                                                                             │
                                                    Forgejo push mirror ─────┘ (interval or on push)
                                                                             ▼
                                                  GitHub master/main updated → deploy.yml → Pages
```

1. Merge the `development` → `master` PR on Forgejo.
2. The Forgejo push mirror pushes it to GitHub. To skip the wait for the interval, go to *Forgejo → repo Settings → Mirror settings → Synchronize now*.
3. Watch the run on GitHub: *Actions → Deploy site to GitHub Pages*.
4. Check <https://theoparashkevov.github.io>.

## Forgejo → GitHub mirror checklist

Configured in *Forgejo → repository → Settings → Repository → Mirror settings → Push mirror*:

- **Remote URL:** `https://github.com/theoparashkevov/theoparashkevov.github.io.git`
- **Credentials:** a GitHub token that can write repository contents **and workflows**. With a classic PAT, that means the `repo` + `workflow` scopes. With a fine-grained token, Contents: write + Workflows: write. Without the workflow permission, any commit touching `.github/workflows/` is rejected and the mirror stops syncing.
- **Sync on commit:** recommended, so production deploys don't wait for the mirror interval.
- **Rule:** never push to GitHub directly. Forgejo overwrites or conflicts with it on the next sync.

## GitHub repository settings that matter

- *Settings → Pages → Source:* **GitHub Actions**.
- *Settings → Environments → `github-pages` → Deployment branches:* only the production branch. This is also what stops a manual `workflow_dispatch` run on another branch from publishing.
- *Settings → General → Default branch:* the production branch. This must be updated when `master` is renamed to `main`.

## Rollback

The site is a static artifact, so roll back with git:

```bash
git switch master            # or main
git pull
git revert -m 1 <merge-commit-of-the-bad-release>
git push origin master       # needs a temporary bypass of branch protection, or do it via a hotfix PR
```

Alternatively, re-run an older successful *Deploy* run on GitHub (*Actions → run → Re-run all jobs*). That rebuilds and redeploys that commit, but the next push to the production branch will overwrite it.
