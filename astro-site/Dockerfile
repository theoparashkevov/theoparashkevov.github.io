# Static Astro build served by unprivileged nginx on :8080.
# Build context is astro-site/:  docker build -f astro-site/Dockerfile astro-site
#
# SITE_URL is baked into canonical URLs, Open Graph tags, the sitemap, RSS and
# robots.txt at build time, so it must be the URL of the environment the image is
# deployed to.

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://theoparashkevov.github.io
ENV SITE_URL=${SITE_URL}
# GA4 Measurement ID baked into the analytics snippet at build time. Optional:
# without it the site builds with no analytics. Not a secret (visible in page
# source), but passed via CI rather than hardcoded so dev/PR builds omit it.
ARG PUBLIC_GOOGLE_ANALYTICS_ID=""
ENV PUBLIC_GOOGLE_ANALYTICS_ID=${PUBLIC_GOOGLE_ANALYTICS_ID}
# GITHUB_TOKEN reaches the build only via a secret mount (BuildKit), so it is
# neither baked into the image nor visible in build logs. It only fetches
# public contribution data (see astro-site/AGENTS.md privacy rules).
# BuildKit does NOT include secret mounts in the layer cache key, so without
# the hash layer below a token change would silently reuse an old cached
# (e.g. tokenless) build. The hash is not a recoverable secret.
RUN --mount=type=secret,id=github_token \
    sh -c 'sha256sum /run/secrets/github_token > /tmp/.github_token_hash'
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN \
    npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
