# Deployment

## Pipeline

The only active workflow is `.github/workflows/nextjs-deploy.yml`, which runs on **GitHub** (on the mirror):

| Trigger | `quality` job | `build-and-deploy` job |
| --- | --- | --- |
| push to `master` | ✔ | ✔ deploys to Pages |
| `workflow_dispatch` (manual) | ✔ | ✔ deploys to Pages |
| `pull_request` → `master` | ✔ | runs too (no event guard); GitHub Pages environment rules should block the deploy step |
| push to `development` / `feature/*` | ✘ not triggered | ✘ |

`quality`: `npm ci` → lint → typecheck → format check (non-blocking) → tests with coverage.
`build-and-deploy`: `npm ci` → migrate → validate (non-blocking) → `next build` → upload `nextjs-site/out` → `actions/deploy-pages@v4`.

The old Jekyll workflow is kept as `jekyll.yml.disabled`. GitHub ignores it because of the extension.

## How a change reaches production

```
feature/x ──PR (Forgejo)──▶ development ──PR (Forgejo)──▶ master/main
                                                              │
                                     Forgejo push mirror ─────┘ (interval or on push)
                                                              ▼
                                         GitHub master/main updated → Actions → Pages
```

1. Merge the `development` → `master` PR on Forgejo.
2. The Forgejo push mirror pushes it to GitHub. To skip the wait for the interval, go to *Forgejo → repo Settings → Mirror settings → Synchronize now*.
3. Watch the run on GitHub: *Actions → Deploy Next.js site to GitHub Pages*.
4. Check <https://theoparashkevov.github.io>.

## Forgejo → GitHub mirror checklist

Configured in *Forgejo → repository → Settings → Repository → Mirror settings → Push mirror*:

- **Remote URL:** `https://github.com/theoparashkevov/theoparashkevov.github.io.git`
- **Credentials:** a GitHub token that can write repository contents **and workflows**. With a classic PAT, that means the `repo` + `workflow` scopes. With a fine-grained token, Contents: write + Workflows: write. Without the workflow permission, any commit touching `.github/workflows/` is rejected and the mirror stops syncing.
- **Sync on commit:** recommended, so production deploys don't wait for the mirror interval.
- **Rule:** never push to GitHub directly. Forgejo overwrites or conflicts with it on the next sync.

## GitHub repository settings that matter

- *Settings → Pages → Source:* **GitHub Actions**.
- *Settings → Environments → `github-pages` → Deployment branches:* only the production branch.
- *Settings → General → Default branch:* the production branch. This must be updated when `master` is renamed to `main`.

## Rollback

The site is a static artifact, so roll back with git:

```bash
git switch master            # or main
git pull
git revert -m 1 <merge-commit-of-the-bad-release>
git push origin master       # needs a temporary bypass of branch protection, or do it via a hotfix PR
```

Alternatively, re-run an older successful *Deploy* run on GitHub (*Actions → run → Re-run all jobs*). That redeploys the old artifact, but the next push to the production branch will overwrite it.

## Forgejo Actions (optional)

If the Forgejo instance has Actions runners, Forgejo reads `.github/workflows/` whenever `.forgejo/workflows/` does not exist. The Pages deploy steps cannot work on Forgejo. To get CI on Forgejo PRs (the place where PRs into `development` actually happen), add a `.forgejo/workflows/ci.yml` that runs only the quality checks, for example on `pull_request` targeting `development` and `master`. This is recommended follow-up work (see [known-issues.md](known-issues.md)).
