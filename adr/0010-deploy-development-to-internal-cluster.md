# ADR-0010: Deploy the development branch to the internal Kubernetes cluster

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** Teo Parashkevov

## Context

Changes merged into `development` (ADR-0008) could only be seen by running the site locally. Production is GitHub Pages: it is fed by the Forgejo → GitHub push mirror (ADR-0007) and deployed by `.github/workflows/deploy.yml` on `master`. The company already runs an internal platform for exactly this case: Forgejo runners, a Harbor registry, and a Kubernetes cluster with a `development` namespace served on `*.development.binary-rise`. There is also a reusable pipeline template, `k8s-app-template`, used by other repositories such as `binary-rise-website`.

## Decision

We will deploy every push to `development` to the internal cluster, using the company template's pattern. There is **no production job** on Forgejo.

- **Pipeline:** `.forgejo/workflows/build-deploy.yml` replaces the checks-only `ci.yml`. It has three jobs:
  - `test`: `astro check`, lint, format, Vitest, build.
  - `build-and-push`: a Docker image tagged with the commit sha, pushed to `harbor.internal.binary-rise/library/theoparashkevov-blog` on branch pushes only.
  - `deploy-development`: `kubectl apply -k k8s/overlays/development` on pushes to `development` only.
  PRs into `development` and `master` run `test` and build the image as a gate, without pushing or deploying.
- **Image:** `astro-site/Dockerfile`, a Node 24 build stage followed by `nginx-unprivileged` serving the static `dist/` on port 8080.
- **Per-environment URL:** `SITE_URL` is a Docker build argument that Astro reads in `astro.config.mjs`. Canonical URLs, Open Graph tags, RSS and the sitemap therefore point at the environment the image is deployed to. The default is the production URL, which keeps the GitHub Pages build unchanged.
- **Manifests:** `k8s/base` (Deployment, Service, Ingress with the `nginx` class, no in-cluster TLS) plus a single `k8s/overlays/development` overlay.
- **Naming:** a fixed app name, `theoparashkevov-blog`, used for the image, the Kubernetes objects and the host `theoparashkevov-blog.development.binary-rise`. The template's default would be the repository name, which contains dots that Service names and the single-level dev hostname don't allow.

## Alternatives considered

- **Also deploy production from Forgejo, to the cluster's `production` namespace.** Rejected: production is GitHub Pages, and the mirror already delivers it. A second production target would have to be kept in sync for no benefit.
- **GitHub Pages preview deployments for `development`.** Rejected: GitHub Pages has one site per repository, and PRs and `development` work live on Forgejo.
- **Keep checks-only CI on Forgejo.** Rejected: it gives no shared place to review a change before a release.

## Consequences

- Each merge into `development` is visible at <http://theoparashkevov-blog.development.binary-rise> a few minutes later. Releases (`development` → `master`) can be checked there first.
- The repository depends on the shared platform prerequisites: a runner with the `docker` label and the kubeconfig mount, the `HARBOR_USERNAME`/`HARBOR_PASSWORD` repository secrets, the `forgejo-deployer` RBAC in `development`, and internal DNS. See the [deployment guide](../docs/handbook/deployment.md#prerequisites-one-time).
- Images are built once per environment because `SITE_URL` is baked in. The Pages build and the dev image are separate builds of the same commit.
- Rolling back development means pointing the Deployment at an older sha tag in Harbor, or pushing a revert to `development`.
