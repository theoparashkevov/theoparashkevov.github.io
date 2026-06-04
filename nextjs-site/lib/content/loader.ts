import fs from 'fs';
import path from 'path';
import { BlogPost, Page } from '../content/types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Get all blog posts from the content directory
 */
export function getAllPosts(): BlogPost[] {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  
  // Read the index file first
  const indexPath = path.join(postsDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  const posts: BlogPost[] = [];
  
  for (const postIndex of indexData) {
    const postPath = path.join(postsDir, `${postIndex.slug}.json`);
    if (fs.existsSync(postPath)) {
      const postData = JSON.parse(fs.readFileSync(postPath, 'utf8'));
      posts.push({
        ...postData,
        date: new Date(postData.date),
        modified_date: postData.modified_date ? new Date(postData.modified_date) : undefined,
      });
    }
  }
  
  return posts;
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const postPath = path.join(CONTENT_DIR, 'posts', `${slug}.json`);
  
  if (!fs.existsSync(postPath)) {
    return null;
  }
  
  const postData = JSON.parse(fs.readFileSync(postPath, 'utf8'));
  
  return {
    ...postData,
    date: new Date(postData.date),
    modified_date: postData.modified_date ? new Date(postData.modified_date) : undefined,
  };
}

/**
 * Get all pages from the content directory
 */
export function getAllPages(): Page[] {
  const pagesDir = path.join(CONTENT_DIR, 'pages');
  
  // Read the index file first
  const indexPath = path.join(pagesDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    return [];
  }
  
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  const pages: Page[] = [];
  
  for (const pageIndex of indexData) {
    const pagePath = path.join(pagesDir, `${pageIndex.slug}.json`);
    if (fs.existsSync(pagePath)) {
      const pageData = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
      pages.push(pageData);
    }
  }
  
  return pages;
}

/**
 * Get a single page by slug
 */
export function getPageBySlug(slug: string): Page | null {
  const pagePath = path.join(CONTENT_DIR, 'pages', `${slug}.json`);
  
  if (!fs.existsSync(pagePath)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(pagePath, 'utf8'));
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPost[] {
  const allPosts = getAllPosts();
  return allPosts.filter(post => 
    post.categories.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    )
  );
}

/**
 * Get all unique categories from all posts
 */
export function getAllCategories(): string[] {
  const allPosts = getAllPosts();
  const categories = new Set<string>();
  
  allPosts.forEach(post => {
    post.categories.forEach(category => {
      categories.add(category);
    });
  });
  
  return Array.from(categories).sort();
}