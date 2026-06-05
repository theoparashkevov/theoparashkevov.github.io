import { sanitizeHTML } from '@/lib/utils/sanitize-html';

describe('sanitizeHTML', () => {
  describe('XSS Prevention', () => {
    it('removes script tags', () => {
      const malicious = '<p>Safe</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe</p>');
    });

    it('removes event handlers', () => {
      const malicious = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('onclick');
    });

    it('blocks javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
    });

    it('removes iframe tags', () => {
      const malicious = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<iframe>');
    });

    it('removes style tags', () => {
      const malicious = '<style>body { display: none; }</style><p>Content</p>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<style>');
    });
  });

  describe('Safe Content Preservation', () => {
    it('preserves headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    it('preserves paragraphs and text formatting', () => {
      const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('preserves links with safe URLs', () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeHTML(html);
      expect(result).toContain('href="https://example.com"');
    });

    it('preserves images with safe attributes', () => {
      const html = '<img src="image.jpg" alt="Description" />';
      const result = sanitizeHTML(html);
      expect(result).toContain('src="image.jpg"');
      expect(result).toContain('alt="Description"');
    });

    it('preserves code blocks', () => {
      const html = '<pre><code>const x = 5;</code></pre>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
    });

    it('preserves lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
    });
  });

  describe('Math/KaTeX Content', () => {
    it('preserves math elements', () => {
      const html = '<math><mrow><mi>x</mi><mo>=</mo><mn>5</mn></mrow></math>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<math>');
      expect(result).toContain('<mi>x</mi>');
      expect(result).toContain('<mn>5</mn>');
    });

    it('preserves SVG elements for KaTeX icons', () => {
      const html = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<svg');
      expect(result).toContain('<circle');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input', () => {
      expect(sanitizeHTML('')).toBe('');
    });

    it('handles null/undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeHTML(null as any)).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sanitizeHTML(undefined as any)).toBe('');
    });

    it('preserves tables', () => {
      const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      const result = sanitizeHTML(html);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>Header</th>');
      expect(result).toContain('<td>Data</td>');
    });
  });
});
