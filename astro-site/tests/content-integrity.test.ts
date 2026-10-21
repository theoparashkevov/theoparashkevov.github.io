import { existsSync, globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');

const blogFiles = globSync('src/content/blog/**/*.md', { cwd: root }).sort();
const sourceFiles = globSync('src/**/*.{astro,ts,mjs,js}', { cwd: root })
  .filter((file) => !file.endsWith('.d.ts'))
  .sort();

const read = (file: string) => readFileSync(join(root, file), 'utf8');

function splitFrontMatter(source: string): { frontMatter: string | null; body: string } {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!match) return { frontMatter: null, body: source };
  return { frontMatter: match[1], body: source.slice(match[0].length) };
}

function stripMarkdownCode(markdown: string): string {
  return markdown
    .replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, '')
    .replace(/(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g, '');
}

const ASSET_REF = /(?<![\w.~/:-])\/assets\/[^\s"'`()<>[\]{}$\\|,;]+/g;

function assetReferences(text: string): string[] {
  const refs = new Set<string>();
  for (const match of text.matchAll(ASSET_REF)) {
    const next = text[match.index + match[0].length];
    if (next === '$' || next === '{') continue;
    const path = match[0].replace(/[?#].*$/, '').replace(/[.:!]+$/, '');
    try {
      refs.add(decodeURIComponent(path));
    } catch {
      refs.add(path);
    }
  }
  return [...refs];
}

function missingAssets(text: string): string[] {
  return assetReferences(text).filter((ref) => !existsSync(join(publicDir, ref)));
}

function frontMatterValue(frontMatter: string, key: string): string | undefined {
  const match = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(frontMatter);
  if (!match) return undefined;
  const inline = match[1].trim();
  if (inline && !/^[|>][+-]?$/.test(inline)) return inline.replace(/^(['"])(.*)\1$/, '$2').trim();
  const rest = frontMatter
    .slice(match.index + match[0].length)
    .split(/\r?\n/)
    .slice(1);
  const block: string[] = [];
  for (const line of rest) {
    if (/^\s+\S/.test(line)) block.push(line.trim());
    else if (line.trim() === '') continue;
    else break;
  }
  return block.join(' ');
}

describe('asset references', () => {
  it('finds asset paths the same way the site uses them', () => {
    expect(
      assetReferences(
        [
          '![x](/assets/img/a.png "Title")',
          '<img src="/assets/img/b%20c.jpg?v=1" alt="">',
          'heroImage: /assets/img/posts/x/thumbnail.png',
          'See https://example.com/assets/not-ours.png and ../assets/relative.png.',
          'const src = `/assets/img/posts/${folder}/thumbnail.png`;',
          '[pdf](/assets/docs/file.pdf).',
        ].join('\n')
      )
    ).toEqual([
      '/assets/img/a.png',
      '/assets/img/b c.jpg',
      '/assets/img/posts/x/thumbnail.png',
      '/assets/docs/file.pdf',
    ]);
  });

  it('ignores references inside markdown code', () => {
    const markdown = [
      'Text ![ok](/assets/img/ok.png)',
      '```html',
      '<img src="/assets/in-fence.png">',
      '```',
      'Inline `/assets/in-inline-code.png` code.',
    ].join('\n');
    expect(assetReferences(stripMarkdownCode(markdown))).toEqual(['/assets/img/ok.png']);
  });

  it.each(blogFiles)('%s only references assets that exist in public/', (file) => {
    const { frontMatter, body } = splitFrontMatter(read(file));
    expect(missingAssets(`${frontMatter ?? ''}\n${stripMarkdownCode(body)}`)).toEqual([]);
  });

  it.each(sourceFiles)('%s only references assets that exist in public/', (file) => {
    expect(missingAssets(read(file))).toEqual([]);
  });
});

describe.each(blogFiles)('blog post %s', (file) => {
  const { frontMatter, body } = splitFrontMatter(read(file));
  const prose = stripMarkdownCode(body);

  it('has a front-matter block', () => {
    expect(frontMatter).not.toBeNull();
  });

  it.each(['title', 'description', 'pubDate'])('has a non-empty %s', (key) => {
    expect(frontMatterValue(frontMatter ?? '', key)).toBeTruthy();
  });

  it('has a valid pubDate', () => {
    const value = frontMatterValue(frontMatter ?? '', 'pubDate') ?? '';
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(Number.isNaN(new Date(value).getTime())).toBe(false);
  });

  it('contains no leftover Jekyll Liquid or kramdown syntax', () => {
    expect(prose).not.toMatch(/\{%-?\s/);
    expect(prose).not.toMatch(/\{\{-?\s*(site|page)\./);
    expect(prose).not.toMatch(/\|\s*relative_url/);
    expect(prose).not.toMatch(/^\{:.*\}\s*$/m);
  });

  it('does not use an H1 in the body', () => {
    expect(prose).not.toMatch(/^# /m);
    expect(prose).not.toMatch(/<h1[\s>]/i);
  });
});
