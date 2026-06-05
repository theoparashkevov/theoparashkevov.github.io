/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import {
  getAllPosts,
  getPostBySlug,
  getAllPages,
  getPageBySlug,
  getPostsByCategory,
  getAllCategories,
} from '@/lib/content/loader';

describe('Content Loader', () => {
  const testContentDir = path.join(process.cwd(), 'content');
  const testPostsDir = path.join(testContentDir, 'posts');
  const testPagesDir = path.join(testContentDir, 'pages');

  describe('getAllPosts', () => {
    it('returns an array of blog posts', () => {
      const posts = getAllPosts();
      expect(Array.isArray(posts)).toBe(true);
    });

    it('returns posts with required fields', () => {
      const posts = getAllPosts();
      if (posts.length > 0) {
        const post = posts[0];
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('slug');
        expect(post).toHaveProperty('date');
        expect(post.date).toBeInstanceOf(Date);
      }
    });

    it('converts date strings to Date objects', () => {
      const posts = getAllPosts();
      if (posts.length > 0) {
        expect(posts[0].date).toBeInstanceOf(Date);
      }
    });
  });

  describe('getPostBySlug', () => {
    it('returns a post when slug exists', () => {
      const allPosts = getAllPosts();
      if (allPosts.length > 0) {
        const post = getPostBySlug(allPosts[0].slug);
        expect(post).not.toBeNull();
        expect(post?.slug).toBe(allPosts[0].slug);
      }
    });

    it('returns null when slug does not exist', () => {
      const post = getPostBySlug('non-existent-slug-12345');
      expect(post).toBeNull();
    });

    it('converts date to Date object', () => {
      const allPosts = getAllPosts();
      if (allPosts.length > 0) {
        const post = getPostBySlug(allPosts[0].slug);
        expect(post?.date).toBeInstanceOf(Date);
      }
    });
  });

  describe('getAllPages', () => {
    it('returns an array of pages', () => {
      const pages = getAllPages();
      expect(Array.isArray(pages)).toBe(true);
    });

    it('returns pages with required fields', () => {
      const pages = getAllPages();
      if (pages.length > 0) {
        const page = pages[0];
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('slug');
      }
    });
  });

  describe('getPageBySlug', () => {
    it('returns a page when slug exists', () => {
      const allPages = getAllPages();
      if (allPages.length > 0) {
        const page = getPageBySlug(allPages[0].slug);
        expect(page).not.toBeNull();
        expect(page?.slug).toBe(allPages[0].slug);
      }
    });

    it('returns null when slug does not exist', () => {
      const page = getPageBySlug('non-existent-page-12345');
      expect(page).toBeNull();
    });
  });

  describe('getPostsByCategory', () => {
    it('filters posts by category', () => {
      const allPosts = getAllPosts();
      if (allPosts.length > 0 && allPosts[0].categories.length > 0) {
        const category = allPosts[0].categories[0];
        const filtered = getPostsByCategory(category);
        expect(filtered.length).toBeGreaterThan(0);
        filtered.forEach(post => {
          expect(
            post.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
          ).toBe(true);
        });
      }
    });

    it('is case-insensitive', () => {
      const allPosts = getAllPosts();
      if (allPosts.length > 0 && allPosts[0].categories.length > 0) {
        const category = allPosts[0].categories[0];
        const upper = getPostsByCategory(category.toUpperCase());
        const lower = getPostsByCategory(category.toLowerCase());
        expect(upper.length).toBe(lower.length);
      }
    });

    it('returns empty array for non-existent category', () => {
      const posts = getPostsByCategory('non-existent-category-xyz');
      expect(posts).toEqual([]);
    });
  });

  describe('getAllCategories', () => {
    it('returns an array of unique categories', () => {
      const categories = getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
    });

    it('returns sorted categories', () => {
      const categories = getAllCategories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('returns unique categories (no duplicates)', () => {
      const categories = getAllCategories();
      const unique = Array.from(new Set(categories));
      expect(categories.length).toBe(unique.length);
    });
  });
});
