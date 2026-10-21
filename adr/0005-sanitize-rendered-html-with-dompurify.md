# ADR-0005: Sanitize rendered HTML with DOMPurify

- **Status:** Accepted
- **Date:** 2026-06-05 (commit `63ad35c`)
- **Deciders:** Teo Parashkevov

## Context

Post and page bodies are markdown that may contain raw HTML. The pipeline deliberately allows it (`remark-rehype` with `allowDangerousHtml: true` plus `rehype-raw`), and the result is injected into the DOM with `dangerouslySetInnerHTML` in `components/BlogPostContent.tsx` and in the About, Contact, and Projects pages. All content is authored by the site owner, but it is still untrusted input from the renderer's point of view: a pasted embed or a compromised dependency could inject script.

## Decision

Every HTML string passes through `sanitizeHTML()` (`lib/utils/sanitize-html.ts`) before it is rendered. That function uses `isomorphic-dompurify` with an explicit allowlist:

- Standard prose, list, table, code, and media tags.
- MathML and SVG elements and attributes needed by KaTeX output.
- `class`, `id`, `style`, ARIA, and `data-*` attributes.
- URIs limited to `http(s)`, `mailto`, `tel`, `ftp`, and relative paths.

In Jest, `isomorphic-dompurify` is mapped to plain `dompurify` running on jsdom (`jest.config.js`).

Defense in depth: a Content-Security-Policy and other security headers are defined in `public/_headers` and in `next.config.ts`.

## Alternatives considered

- **Disable raw HTML in markdown.** Rejected: existing posts rely on inline HTML (49 raw `<img>` tags across 7 of the 8 posts).
- **`rehype-sanitize` inside the unified pipeline.** This would also work, and it sanitizes once at build time rather than at render time. DOMPurify was chosen for its well-known allowlist semantics.

## Consequences

- Any new tag or attribute that content needs (for example `iframe` for an embed) must be added to the allowlist explicitly, or it is silently stripped.
- `style` is allowed, so CSS-based visual spoofing is possible. This is acceptable because the content is first-party.
- **The security headers are not actually served in production.** GitHub Pages ignores `_headers` files, which are a Netlify/Cloudflare Pages convention, and `next.config.ts` `headers()` does nothing under `output: 'export'`. The only effective mitigation in production is the sanitizer. If a CSP is wanted, it has to be added as a `<meta http-equiv="Content-Security-Policy">` tag. See [known issues](../docs/handbook/known-issues.md).
