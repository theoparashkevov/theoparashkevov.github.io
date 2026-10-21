# Branching strategy

```
feature/<topic>  ──PR──▶  development  ──PR──▶  main  ──mirror──▶ GitHub ──▶ Pages
      ▲                        │
      └──── branched from ─────┘
```

The decision and its reasons are in [ADR-0008](../../adr/0008-branching-strategy-feature-development-main.md). This page is the how-to.

> The production branch is **currently named `master`**. Wherever this guide says `main`, use `master` until the [rename](#renaming-master-to-main) is done.

## Branches

| Branch | Purpose | Created from | Merges into | Who pushes |
| --- | --- | --- | --- | --- |
| `main` | Production. Every push deploys. | n/a | n/a | PR merges only |
| `development` | Integration. Always green. | `main` (once) | `main` | PR merges only |
| `feature/<topic>` | New work | **`development`** | `development` | you |
| `fix/<topic>`, `docs/<topic>` | Non-urgent fixes, docs-only changes | **`development`** | `development` | you |
| `hotfix/<topic>` | Urgent production fix | `main` | `main`, then `main` → `development` | you |

Names are lowercase kebab-case, e.g. `feature/code-panel-nextjs`, `fix/timezone-tests`, `docs/adr`.

## Day-to-day workflow

```bash
# 1. Start from an up-to-date development
git switch development
git pull --ff-only

# 2. Create the feature branch
git switch -c feature/my-change

# 3. Work and commit (Conventional Commits)
git commit -m "feat: add X"

# 4. Stay current with development: rebase your own unshared branch
git fetch origin
git rebase origin/development

# 5. Push and open a PR on Forgejo: base = development
git push -u origin feature/my-change
```

Run the checks from [development.md](development.md#before-opening-a-pr) before you request review.

Merge the PR with **Squash** (one commit on `development`, titled in Conventional Commits style), then delete the branch:

```bash
git switch development && git pull --ff-only
git branch -d feature/my-change
```

## Releasing to production

1. On Forgejo, open a PR with **base `main` ← compare `development`**. Title it e.g. `release: 2026-10-21`, and list the included features in the description.
2. Merge with **Create merge commit**. Do not squash and do not rebase: squashing would make `main` and `development` diverge and cause conflicts on the next release.
3. The mirror pushes to GitHub, and Actions deploys (see [deployment.md](deployment.md)).

## Hotfix

```bash
git switch main && git pull --ff-only
git switch -c hotfix/broken-thing
# fix, commit, push, PR into main → merge
git switch development && git pull --ff-only
git merge --no-ff origin/main           # bring the fix back into development
git push origin development             # or via a PR, if development is protected against direct pushes
```

## Branch protection on Forgejo

*Repository → Settings → Branches → Add rule*, once for `main` and once for `development`:

- Disable push (pushes only through PR merges), or whitelist only the merge user.
- Disable force push.
- Require approvals: 0 or 1. On a single-author repo, an approval mostly serves as a pause for self-review.
- Require status checks: require the `ci.yml` job once it runs on the instance's runners (see [deployment.md](deployment.md#forgejo-ciyml)).
- For `main`: under allowed merge styles, prefer "Create merge commit".

Set *Settings → Repository → Default branch* to **`development`**. That way new PRs target it by default and clones check it out.

## Renaming `master` to `main`

The order of these steps matters, because GitHub is fed by the mirror and refuses to delete its default branch.

1. On a `feature/*` branch, change `.github/workflows/deploy.yml` to use `branches: ['main']` under `push`, and replace `master` with `main` in the `pull_request` branches of `.forgejo/workflows/ci.yml`. Merge it through `development`, but **do not release it yet**.
2. Create and push `main`:
   ```bash
   git fetch origin
   git push origin origin/development:refs/heads/main   # main now contains the updated workflow
   ```
   The mirror pushes `main` to GitHub, and the push triggers the first deploy from `main`.
3. **GitHub:** *Settings → General → Default branch* → `main`. *Settings → Environments → github-pages → Deployment branches* → allow `main`.
4. **Forgejo:** *Settings → Branches*: move the `master` protection rule to `main`. The default branch stays `development`.
5. Delete `master` on Forgejo. Then check whether the mirror pruned it on GitHub too. If it did not, delete it on GitHub by hand (this is the one allowed direct GitHub action).
6. Everyone updates their local clone:
   ```bash
   git fetch --prune origin
   git branch -m master main
   git branch -u origin/main main
   ```
7. Update the "currently named `master`" notes in this guide, in [deployment.md](deployment.md), and in ADR-0004/ADR-0008.
