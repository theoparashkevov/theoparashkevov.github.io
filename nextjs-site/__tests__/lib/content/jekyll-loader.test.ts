/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  parseMarkdownFile,
  extractSlugFromFilename,
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
