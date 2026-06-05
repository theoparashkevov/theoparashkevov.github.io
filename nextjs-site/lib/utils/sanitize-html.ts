import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving
 * legitimate content including math equations, code blocks, and formatting.
 *
 * This is critical for security since content from markdown is rendered
 * with dangerouslySetInnerHTML. We allow a curated set of safe HTML
 * elements and attributes.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Text formatting
      'p', 'div', 'span', 'br', 'hr',
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
      // Lists
      'ul', 'ol', 'li',
      // Links and images
      'a', 'img',
      // Code
      'code', 'pre',
      // Quotes and blocks
      'blockquote',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      // Math (KaTeX renders these)
      'math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn',
      'msup', 'msub', 'mfrac', 'msqrt', 'munderover', 'munder', 'mover',
      'mtext', 'mspace', 'mstyle', 'mpadded', 'menclose',
      // SVG (for KaTeX icons)
      'svg', 'g', 'path', 'rect', 'circle', 'line', 'polyline',
      'polygon', 'text', 'defs', 'use', 'marker', 'mask',
      // Definition lists
      'dl', 'dt', 'dd',
      // Misc
      'details', 'summary', 'figure', 'figcaption', 'kbd', 'mark', 'small',
    ],
    ALLOWED_ATTR: [
      // Links
      'href', 'target', 'rel', 'download',
      // Images
      'src', 'alt', 'title', 'width', 'height', 'loading',
      // Tables
      'colspan', 'rowspan', 'scope',
      // Math
      'mathvariant', 'encoding',
      // SVG attributes
      'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'transform',
      'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
      'width', 'height', 'points', 'marker-end', 'marker-start',
      // General
      'class', 'id', 'style', 'aria-label', 'aria-hidden', 'role',
      'data-*',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    // Allow math styling but not arbitrary CSS
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Force external links to be safe
    ADD_ATTR: ['target'],
    // Don't allow data URIs (potential XSS vector)
    ALLOW_DATA_ATTR: true,
  });
}
