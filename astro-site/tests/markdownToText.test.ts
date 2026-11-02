import { describe, expect, it } from 'vitest';
import { markdownToPlainText } from '../src/lib/markdownToText';

describe('markdownToPlainText', () => {
  it('strips front matter', () => {
    const md = ['---', 'title: Hello', 'tags: [a]', '---', '', '# Body', '', 'Text.'].join('\n');
    expect(markdownToPlainText(md)).toBe('Body\n\nText.\n');
  });

  it('converts headings, emphasis, links, and inline code', () => {
    const md = [
      '## Section with *emphasis* and **bold**',
      '',
      'A [link label](https://example.com) and `code(x)` inline.',
      '',
      '![diagram](img.png)',
    ].join('\n');
    expect(markdownToPlainText(md)).toBe(
      'Section with emphasis and bold\n\nA link label and code(x) inline.\n\ndiagram\n'
    );
  });

  it('converts lists to bullet markers and preserves code fence content', () => {
    const md = ['- first', '- second', '', '```python', 'def f():', '    return 1', '```'].join(
      '\n'
    );
    const out = markdownToPlainText(md);
    expect(out).toContain('• first');
    expect(out).toContain('• second');
    expect(out).toContain('def f():');
    expect(out).toContain('return 1');
    expect(out).not.toContain('```');
  });

  it('drops thematic breaks and normalizes blockquotes', () => {
    const md = ['Before', '', '---', '', '> quoted wisdom', '', 'After'].join('\n');
    expect(markdownToPlainText(md)).toBe('Before\n\n> quoted wisdom\n\nAfter\n');
  });

  it('collapses a multi-line paragraph into one line', () => {
    const md = 'One\ntwo\nthree.';
    expect(markdownToPlainText(md)).toBe('One two three.\n');
  });
});
