/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  parseMarkdownFile,
  extractSlugFromFilename,
  extractDateFromFilename,
  loadJekyllPosts,
  loadJekyllPages,
  copyJekyllAssets,
} from '@/lib/content/jekyll-loader';

describe('extractSlugFromFilename', () => {
  it('extracts slug from Jekyll filename with date prefix', () => {
    expect(extractSlugFromFilename('2024-01-15-my-post.md')).toBe('my-post');
  });

  it('handles filenames without date prefix', () => {
    expect(extractSlugFromFilename('my-post.md')).toBe('my-post');
  });

  it('handles complex slugs with hyphens', () => {
    expect(extractSlugFromFilename('2024-12-31-data-structures-in-python.md')).toBe(
      'data-structures-in-python'
    );
  });
});

describe('extractDateFromFilename', () => {
  it('extracts date from Jekyll filename with date prefix', () => {
    const date = extractDateFromFilename('2024-01-15-my-post.md');
    expect(date).toBeInstanceOf(Date);
    expect(date!.getUTCFullYear()).toBe(2024);
    expect(date!.getUTCMonth()).toBe(0); // January is 0
    expect(date!.getUTCDate()).toBe(15);
  });

  it('returns null for filenames without date prefix', () => {
    expect(extractDateFromFilename('my-post.md')).toBeNull();
  });

  it('handles complex filenames with date prefix', () => {
    const date = extractDateFromFilename('2024-12-31-data-structures-in-python.md');
    expect(date).toBeInstanceOf(Date);
    expect(date!.getUTCFullYear()).toBe(2024);
    expect(date!.getUTCMonth()).toBe(11); // December is 11
    expect(date!.getUTCDate()).toBe(31);
  });

  it('handles edge cases with invalid dates', () => {
    // Invalid month
    const date1 = extractDateFromFilename('2024-13-01-my-post.md');
    expect(date1).toBeInstanceOf(Date);
    // JavaScript Date handles invalid months by rolling over
    expect(date1!.getUTCFullYear()).toBe(2025);
    expect(date1!.getUTCMonth()).toBe(0); // Rolls over to January 2025
    
    // Invalid day
    const date2 = extractDateFromFilename('2024-02-31-my-post.md');
    expect(date2).toBeInstanceOf(Date);
    // February 31 rolls over to March
    expect(date2!.getUTCFullYear()).toBe(2024);
    expect(date2!.getUTCMonth()).toBe(2); // Rolls over to March
  });
});
  describe('parseMarkdownFile', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-test-'));
    testFile = path.join(tempDir, 'test-post.md');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('parses markdown with front matter', () => {
    const content = `---
title: Test Post
date: 2024-01-15
---
This is the content.`;
    fs.writeFileSync(testFile, content);

    const result = parseMarkdownFile(testFile, 'test-post');
    expect(result.data.title).toBe('Test Post');
    expect(result.content).toContain('This is the content');
  });

  it('converts date strings to Date objects', () => {
    const content = `---
title: Test
date: 2024-01-15
---
Content`;
    fs.writeFileSync(testFile, content);

    const result = parseMarkdownFile(testFile, 'test');
    expect(result.data.date).toBeInstanceOf(Date);
  });

  it('converts modified_date to Date object', () => {
    const content = `---
title: Test
date: 2024-01-15
modified_date: 2024-02-01
---
Content`;
    fs.writeFileSync(testFile, content);

    const result = parseMarkdownFile(testFile, 'test');
    expect(result.data.modified_date).toBeInstanceOf(Date);
  });
});

describe('loadJekyllPosts', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-posts-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array if directory does not exist', () => {
    const posts = loadJekyllPosts('/non/existent/path');
    expect(posts).toEqual([]);
  });

  it('loads posts from directory', () => {
    const post1 = `---
title: Post 1
date: 2024-01-15
categories: [tech]
---
Content 1`;
    fs.writeFileSync(path.join(tempDir, '2024-01-15-post-1.md'), post1);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(1);
    expect(posts[0].title).toBe('Post 1');
    expect(posts[0].slug).toBe('post-1');
  });

  it('sorts posts by date, newest first', () => {
    const post1 = `---
title: Older
date: 2024-01-15
---
Content`;
    const post2 = `---
title: Newer
date: 2024-02-20
---
Content`;

    fs.writeFileSync(path.join(tempDir, '2024-01-15-older.md'), post1);
    fs.writeFileSync(path.join(tempDir, '2024-02-20-newer.md'), post2);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(2);
    expect(posts[0].title).toBe('Newer');
    expect(posts[1].title).toBe('Older');
  });

  it('handles posts with categories array', () => {
    const post = `---
title: Test
date: 2024-01-15
categories: [python, ml]
---
Content`;
    fs.writeFileSync(path.join(tempDir, '2024-01-15-test.md'), post);

    const posts = loadJekyllPosts(tempDir);
    expect(posts[0].categories).toEqual(['python', 'ml']);
  });

  it('handles posts without categories', () => {
    const post = `---
title: Test
date: 2024-01-15
---
Content`;
    fs.writeFileSync(path.join(tempDir, '2024-01-15-test.md'), post);

    const posts = loadJekyllPosts(tempDir);
    expect(posts[0].categories).toEqual([]);
  });

  it('uses filename date when no date in front matter', () => {
    const post = `---
title: Post without date
categories: [test]
---
Content without date`;

    fs.writeFileSync(path.join(tempDir, '2023-05-10-no-date-post.md'), post);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(1);
    expect(posts[0].title).toBe('Post without date');
    expect(posts[0].slug).toBe('no-date-post');
    expect(posts[0].date).toBeInstanceOf(Date);
    expect(posts[0].date.getUTCFullYear()).toBe(2023);
    expect(posts[0].date.getUTCMonth()).toBe(4); // May is month 4 (0-indexed)
    expect(posts[0].date.getUTCDate()).toBe(10);
  });

  it('uses modified_date when no date in front matter and no filename date', () => {
    const post = `---
title: Post without date prefix
modified_date: 2022-08-15
---
Content without date prefix`;

    fs.writeFileSync(path.join(tempDir, 'no-date-prefix.md'), post);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(1);
    expect(posts[0].title).toBe('Post without date prefix');
    expect(posts[0].slug).toBe('no-date-prefix');
    expect(posts[0].date).toBeInstanceOf(Date);
    expect(posts[0].date.getUTCFullYear()).toBe(2022);
    expect(posts[0].date.getUTCMonth()).toBe(7); // August is month 7
    expect(posts[0].date.getUTCDate()).toBe(15);
  });

  it('prefers front matter date over filename date', () => {
    const post = `---
title: Post with different dates
date: 2021-03-20
modified_date: 2021-04-01
---
Content with different dates`;

    fs.writeFileSync(path.join(tempDir, '2020-12-25-different-dates.md'), post);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(1);
    expect(posts[0].title).toBe('Post with different dates');
    // Should use front matter date (2021-03-20) not filename date (2020-12-25)
    expect(posts[0].date.getUTCFullYear()).toBe(2021);
    expect(posts[0].date.getUTCMonth()).toBe(2); // March is month 2
    expect(posts[0].date.getUTCDate()).toBe(20);
    // modified_date should be preserved
    expect(posts[0].modified_date).toBeInstanceOf(Date);
    expect(posts[0].modified_date!.getUTCFullYear()).toBe(2021);
    expect(posts[0].modified_date!.getUTCMonth()).toBe(3); // April is month 3
    expect(posts[0].modified_date!.getUTCDate()).toBe(1);
  });

  it('skips non-markdown files', () => {
    fs.writeFileSync(path.join(tempDir, 'not-a-post.txt'), 'text');
    fs.writeFileSync(path.join(tempDir, '2024-01-15-post.md'), `---
title: Post
---
Content`);

    const posts = loadJekyllPosts(tempDir);
    expect(posts.length).toBe(1);
  });
});

describe('loadJekyllPages', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-pages-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array if directory does not exist', () => {
    const pages = loadJekyllPages('/non/existent/path');
    expect(pages).toEqual([]);
  });

  it('loads pages from directory', () => {
    const page = `---
title: About
layout: page
---
About content`;
    fs.writeFileSync(path.join(tempDir, 'about.md'), page);

    const pages = loadJekyllPages(tempDir);
    expect(pages.length).toBe(1);
    expect(pages[0].title).toBe('About');
    expect(pages[0].slug).toBe('about');
  });
});

describe('copyJekyllAssets', () => {
  let srcDir: string;
  let destDir: string;

  beforeEach(() => {
    srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-assets-src-'));
    destDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-assets-dest-'));
  });

  afterEach(() => {
    fs.rmSync(srcDir, { recursive: true, force: true });
    fs.rmSync(destDir, { recursive: true, force: true });
  });

  it('does nothing if source directory does not exist', () => {
    copyJekyllAssets('/non/existent', destDir);
    // Should not throw
    expect(fs.existsSync(destDir)).toBe(true);
  });

  it('copies files from source to destination', () => {
    fs.writeFileSync(path.join(srcDir, 'test.jpg'), 'fake image data');

    copyJekyllAssets(srcDir, destDir);

    expect(fs.existsSync(path.join(destDir, 'test.jpg'))).toBe(true);
  });

  it('copies directories recursively', () => {
    const subDir = path.join(srcDir, 'images');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'photo.jpg'), 'photo data');

    copyJekyllAssets(srcDir, destDir);

    expect(fs.existsSync(path.join(destDir, 'images', 'photo.jpg'))).toBe(true);
  });
});
