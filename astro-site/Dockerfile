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
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
