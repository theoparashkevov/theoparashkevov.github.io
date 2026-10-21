import { afterEach, describe, expect, it } from 'vitest';
import {
  formatDate,
  getCategories,
  postUrl,
  readingTime,
  slugify,
  sortByDateDesc,
  transitionName,
  type Post,
} from '../src/lib/posts';

function fakePost(id: string, pubDate: string, categories: string[] = []): Post {
  return {
    id,
    collection: 'blog',
    body: '',
    data: {
      title: id,
      description: `Description of ${id}`,
      pubDate: new Date(pubDate),
      categories,
      tags: [],
      author: 'Teo Parashkevov',
      math: false,
      draft: false,
    },
  } as unknown as Post;
}

describe('formatDate', () => {
  const originalTZ = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it('formats long dates', () => {
    expect(formatDate(new Date('2024-03-05T00:00:00Z'))).toBe('March 5, 2024');
    expect(formatDate(new Date('2024-03-05T00:00:00Z'), 'long')).toBe('March 5, 2024');
  });

  it('formats short dates', () => {
    expect(formatDate(new Date('2024-03-05T00:00:00Z'), 'short')).toBe('Mar 5, 2024');
  });

  it.each(['America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo', 'Pacific/Kiritimati', 'UTC'])(
    'is timezone-independent for a UTC-midnight date (TZ=%s)',
    (tz) => {
      process.env.TZ = tz;
      const date = new Date('2021-01-01');
      expect(formatDate(date)).toBe('January 1, 2021');
      expect(formatDate(date, 'short')).toBe('Jan 1, 2021');
    }
  );

  it('actually shifts local time when TZ changes (sanity check for the test above)', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(new Date('2021-01-01').getDate()).toBe(31);
  });
});

describe('readingTime', () => {
  it('returns 1 for missing or empty content', () => {
    expect(readingTime(undefined)).toBe(1);
    expect(readingTime('')).toBe(1);
  });

  it('returns at least 1 minute for short texts', () => {
    expect(readingTime('Just a few words.')).toBe(1);
  });

  it('rounds words / wordsPerMinute', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    expect(readingTime(words(440))).toBe(2);
    expect(readingTime(words(1100))).toBe(5);
    expect(readingTime(words(549))).toBe(2);
    expect(readingTime(words(551))).toBe(3);
  });

  it('honours a custom words-per-minute rate', () => {
    const text = Array.from({ length: 300 }, () => 'word').join(' ');
    expect(readingTime(text, 100)).toBe(3);
  });

  it('ignores fenced code blocks, HTML tags and markdown punctuation', () => {
    const code = '```python\n' + 'x = 1\n'.repeat(2000) + '```';
    const html = '<img src="/a.png" alt="x" />'.repeat(1000);
    const punctuation = '# ** __ > ` [ ] ( ) ! - '.repeat(500);
    expect(readingTime(`Hello world\n\n${code}\n\n${html}\n\n${punctuation}`)).toBe(1);
  });
});

describe('slugify', () => {
  it.each([
    ['Machine Learning', 'machine-learning'],
    ['  Padded Value  ', 'padded-value'],
    ['C++ & Python!', 'c-python'],
    ['already-a-slug', 'already-a-slug'],
    ['Multiple   spaces__and--dashes', 'multiple-spaces-and-dashes'],
    ['---Leading and trailing---', 'leading-and-trailing'],
    ['Version 2.0', 'version-2-0'],
    ['', ''],
  ])('slugify(%j) === %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('sortByDateDesc', () => {
  it('sorts newest first without mutating the input', () => {
    const posts = [
      fakePost('middle', '2022-06-15'),
      fakePost('oldest', '2019-01-01'),
      fakePost('newest', '2024-12-31'),
    ];
    const snapshot = posts.map((p) => p.id);
    const sorted = sortByDateDesc(posts);
    expect(sorted.map((p) => p.id)).toEqual(['newest', 'middle', 'oldest']);
    expect(posts.map((p) => p.id)).toEqual(snapshot);
    expect(sorted).not.toBe(posts);
  });

  it('handles empty arrays', () => {
    expect(sortByDateDesc([])).toEqual([]);
  });
});

describe('postUrl', () => {
  it('builds the /blog/<id>/ URL', () => {
    expect(postUrl({ id: 'my-first-post' })).toBe('/blog/my-first-post/');
    expect(postUrl(fakePost('2020-hello', '2020-01-01'))).toBe('/blog/2020-hello/');
  });
});

describe('getCategories', () => {
  it('counts categories, slugifies names and sorts by count then name', () => {
    const posts = [
      fakePost('a', '2020-01-01', ['Machine Learning', 'Python']),
      fakePost('b', '2020-01-02', ['Python']),
      fakePost('c', '2020-01-03', ['Career', 'Python', 'Machine Learning']),
      fakePost('d', '2020-01-04', ['AI']),
      fakePost('e', '2020-01-05', []),
    ];
    expect(getCategories(posts)).toEqual([
      { name: 'Python', slug: 'python', count: 3 },
      { name: 'Machine Learning', slug: 'machine-learning', count: 2 },
      { name: 'AI', slug: 'ai', count: 1 },
      { name: 'Career', slug: 'career', count: 1 },
    ]);
  });

  it('merges categories that differ only in case or punctuation, counting each post once', () => {
    const posts = [
      fakePost('a', '2020-01-01', ['python', 'Python']),
      fakePost('b', '2020-01-02', ['Python']),
      fakePost('c', '2020-01-03', ['C/C++', 'c-c']),
    ];
    expect(getCategories(posts)).toEqual([
      { name: 'python', slug: 'python', count: 2 },
      { name: 'C/C++', slug: 'c-c', count: 1 },
    ]);
  });

  it('returns an empty list when there are no posts', () => {
    expect(getCategories([])).toEqual([]);
  });
});

describe('transitionName', () => {
  it('builds a stable post-<kind>-<slug> name', () => {
    expect(transitionName('title', 'hello-world')).toBe('post-title-hello-world');
    expect(transitionName('hero', 'hello-world')).toBe('post-hero-hello-world');
    expect(transitionName('meta', 'hello-world')).toBe('post-meta-hello-world');
    expect(transitionName('card', 'hello-world')).toBe('post-card-hello-world');
  });

  it('produces valid CSS custom identifiers', () => {
    for (const id of ['simple', '2020-05-01-Some Post', 'weird__id!!']) {
      expect(transitionName('title', id)).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('gives different kinds of the same post different names', () => {
    const names = (['title', 'hero', 'meta', 'card'] as const).map((k) => transitionName(k, 'x'));
    expect(new Set(names).size).toBe(names.length);
  });
});
