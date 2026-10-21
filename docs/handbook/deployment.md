# Deployment

## Environments

| Environment | URL | Deployed by | When |
| --- | --- | --- | --- |
| Development | <https://theoparashkevov-blog.development.binary-rise> (internal) | `.forgejo/workflows/build-deploy.yml` on Forgejo, to the internal Kubernetes cluster | every push to `development` (i.e. every merged feature PR) |
| Production | <https://theoparashkevov.github.io> | `.github/workflows/deploy.yml` on GitHub, to GitHub Pages | every push to `master`, which reaches GitHub through the push mirror |

There is deliberately no production job on Forgejo. Production is whatever lands on GitHub `master`.

## Pipelines

| Workflow | Runs on | Triggers | Does |
| --- | --- | --- | --- |
| `.forgejo/workflows/build-deploy.yml` | Forgejo runners (`runs-on: docker`) | push to `development`; PRs into `development` or `master` | test → build image (→ push to Harbor → deploy to `development` on pushes only) |
| `.github/workflows/deploy.yml` | GitHub (the mirror) | push to `master`, `workflow_dispatch` | checks → build → deploy to GitHub Pages |

### Forgejo: `build-deploy.yml`

This workflow is adapted from the company template `k8s-app-template`. It has three jobs, each depending on the previous one:

1. **`test`** (`node:24-bookworm` container, working directory `astro-site/`): `npm ci` → `check` → `lint` → `format:check` → `test` → `build`. This is the gate for every PR. Require it in the Forgejo branch protection rules (see [branching-strategy.md](branching-strategy.md#branch-protection-on-forgejo)).
2. **`build-and-push`:** `docker build -f astro-site/Dockerfile astro-site`, tagged `harbor.internal.binary-rise/library/theoparashkevov-blog:<commit sha>`.
   - On PRs the image is only built, as a gate, with a dummy `SITE_URL`.
   - On pushes to `development` it is built with the development URL and pushed to Harbor.
3. **`deploy-development`** (pushes to `development` only), using the runner's mounted kubeconfig:
   - checks every RBAC permission it needs up front;
   - substitutes the commit sha for `IMAGE_TAG` in `k8s/overlays/development/kustomization.yaml`;
   - creates or updates the `harbor-registry` pull secret;
   - runs `kubectl apply -k k8s/overlays/development` and waits for the rollout.

The app name is fixed as **`theoparashkevov-blog`** instead of the repository name (which the template uses). `theoparashkevov.github.io` contains dots, which Kubernetes Service names don't allow and which would break the single-level `*.development.binary-rise` hostname.

### The image

`astro-site/Dockerfile` is a two-stage build:

1. `node:24-bookworm-slim` runs `npm ci && npm run build`.
2. `nginxinc/nginx-unprivileged` serves `dist/` on port 8080 as a non-root user (config in `astro-site/nginx.conf`):
   - extensionless and trailing-slash URLs are resolved;
   - the site's `404.html` is served for missing paths;
   - `/_astro/` assets are cached as immutable.

**`SITE_URL` is a build argument.** Astro bakes it into canonical URLs, Open Graph tags, RSS, the sitemap and `robots.txt` (`astro.config.mjs` reads `process.env.SITE_URL`). So every image is built for one environment. Without it the build defaults to the production URL, which is what the GitHub Pages build uses.

Try it locally:

```bash
docker build -f astro-site/Dockerfile --build-arg SITE_URL=http://localhost:8080 -t theoparashkevov-blog:local astro-site
docker run --rm -p 8080:8080 theoparashkevov-blog:local
```

### Kubernetes manifests

`k8s/base/` holds a Deployment, a Service (80 → 8080) and an Ingress (`ingressClassName: nginx`, no TLS in the cluster). `k8s/overlays/development/` sets the `development` namespace, the Harbor image with the `IMAGE_TAG` placeholder, and the hostname. There is no production overlay.

### Prerequisites (one-time)

These are shared with the other apps that deploy to the `development` namespace (for example `binary-rise-website`), so most are probably already in place:

1. **Runner:** a Forgejo runner with the `docker` label, the Docker socket, and the development kubeconfig mounted at `/home/developer/forgejo-runners/kubeconfig`.
2. **Repository secrets** (*repo → Settings → Actions → Secrets*): `HARBOR_USERNAME` and `HARBOR_PASSWORD`, used to push the image and for the cluster pull secret.
3. **RBAC:** the `forgejo-deployer` Role and RoleBinding in the `development` namespace. The job needs create/get on deployments, services, secrets and ingresses, and list on pods. A cluster admin applies them once, using `k8s/bootstrap/deployer-role.yaml` from `binary-rise-website`.
4. **DNS:** `*.development.binary-rise` resolves to the cluster ingress, and the nodes can resolve `harbor.internal.binary-rise` to pull images.

### Rolling back development

Every image stays in Harbor under its commit sha, so roll back by pointing the Deployment at an older tag:

```bash
kubectl -n development set image deployment/theoparashkevov-blog web=harbor.internal.binary-rise/library/theoparashkevov-blog:<older-sha>
```

The next push to `development` redeploys from git.

### GitHub: `deploy.yml`

Three jobs, each depending on the previous one. All run Node 24 (from `.nvmrc`) with `astro-site/` as the working directory.

1. **`quality`:** `npm ci` → `npm run check` → `npm run lint` → `npm run format:check` → `npm test`. All steps are blocking.
2. **`build`:** `npm ci` → `npm run build` → `actions/configure-pages` → `actions/upload-pages-artifact` with **`astro-site/dist`**.
3. **`deploy`:** `actions/deploy-pages` into the `github-pages` environment. It only runs for `refs/heads/master`, so a manual dispatch from another branch builds but never publishes.

Deployments are serialized through the `pages` concurrency group, and an in-progress deploy is never cancelled. There is no `pull_request` trigger, because PRs live on Forgejo (ADR-0007).

Because `.forgejo/workflows/` exists, Forgejo never falls back to running `.github/workflows/`.

## How a change reaches production

```
feature/x ──PR (Forgejo: test + image build)──▶ development ──PR (Forgejo: test + image build)──▶ master/main
                                                     │                                                      │
                                    build-deploy.yml: image → Harbor →               Forgejo push mirror ───┘
                                    kubectl apply (development namespace)                                   ▼
                                                                               GitHub master/main → deploy.yml → Pages
```

1. Check the change on the development environment, which updates on every merge into `development`.
2. Merge the `development` → `master` PR on Forgejo.
3. The Forgejo push mirror pushes it to GitHub. To skip the wait for the interval, go to *Forgejo → repo Settings → Mirror settings → Synchronize now*.
4. Watch the run on GitHub: *Actions → Deploy site to GitHub Pages*.
5. Check <https://theoparashkevov.github.io>.

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

## Rolling back production

The site is a static artifact, so roll back with git:

```bash
git switch master            # or main
git pull
git revert -m 1 <merge-commit-of-the-bad-release>
git push origin master       # needs a temporary bypass of branch protection, or do it via a hotfix PR
```

Alternatively, re-run an older successful *Deploy* run on GitHub (*Actions → run → Re-run all jobs*). That rebuilds and redeploys that commit, but the next push to the production branch will overwrite it.
