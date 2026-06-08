import fs from 'fs';
import path from 'path';
import matter, { GrayMatterFile } from 'gray-matter';
import { BlogPost, Page } from './types';

/**
 * Parse a Jekyll-style Markdown file with YAML front matter
 */
export function parseMarkdownFile(filePath: string, _slug: string): { data: GrayMatterFile<Buffer>['data']; content: string } {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  // Convert date strings to Date objects
  if (data.date) {
    data.date = new Date(data.date);
  }
  if (data.modified_date) {
    data.modified_date = new Date(data.modified_date);
  }
  
  return { data, content };
}

/**
 * Extract slug from Jekyll-style filename: YYYY-MM-DD-title.md
 */
export function extractSlugFromFilename(filename: string): string {
  // Remove date prefix and .md extension
  const withoutExt = filename.replace(/\.md$/, '');
  const match = withoutExt.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  
  if (match) {
    return match[1];
  }
  
  return withoutExt;
}

/**
 * Extract date from Jekyll-style filename: YYYY-MM-DD-title.md
 * Returns a Date object if found, null otherwise
 */
export function extractDateFromFilename(filename: string): Date | null {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(match[3], 10);
    
    // Create date at noon UTC to avoid timezone issues
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  
  return null;
}

/**
 * Load all blog posts from the Jekyll _posts directory
 */
export function loadJekyllPosts(jekyllPostsDir: string): BlogPost[] {
  if (!fs.existsSync(jekyllPostsDir)) {
    console.warn(`Jekyll posts directory not found: ${jekyllPostsDir}`);
    return [];
  }
  
  const files = fs.readdirSync(jekyllPostsDir);
  const posts: BlogPost[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(jekyllPostsDir, file);
    const slug = extractSlugFromFilename(file);
    const filenameDate = extractDateFromFilename(file);
    const { data, content } = parseMarkdownFile(filePath, slug);
    
    // Determine the date to use with fallback logic:
    // 1. Use date from front matter if present
    // 2. Otherwise use date from filename if present
    // 3. Otherwise fall back to modified_date from front matter (as Date object)
    // 4. Otherwise use current date (shouldn't happen with valid Jekyll files)
    let postDate: Date;
    
    if (data.date) {
      postDate = data.date;
    } else if (filenameDate) {
      postDate = filenameDate;
    } else if (data.modified_date) {
      postDate = data.modified_date;
    } else {
      postDate = new Date();
      console.warn(`No date found for post: ${file}. Using current date.`);
    }
    
    const post: BlogPost = {
      title: data.title || '',
      date: postDate,
      modified_date: data.modified_date,
      layout: data.layout || 'post',
      categories: Array.isArray(data.categories) ? data.categories : [],
      author: data.author || '',
      meta: Array.isArray(data.meta) ? data.meta : [],
      thumbnail_location: data.thumbnail_location,
      usemathjax: data.usemathjax || false,
      description: data.description || '',
      content,
      slug,
      excerpt: data.excerpt,
    };
    
    posts.push(post);
  }
  
  // Sort by date, newest first
  return posts.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Load pages from Jekyll pages directory
 */
export function loadJekyllPages(jekyllPagesDir: string): Page[] {
  if (!fs.existsSync(jekyllPagesDir)) {
    console.warn(`Jekyll pages directory not found: ${jekyllPagesDir}`);
    return [];
  }
  
  const files = fs.readdirSync(jekyllPagesDir).filter(f => f.endsWith('.md'));
  const pages: Page[] = [];
  
  for (const file of files) {
    const filePath = path.join(jekyllPagesDir, file);
    const slug = path.basename(file, '.md');
    const { data, content } = parseMarkdownFile(filePath, slug);
    
    const page: Page = {
      title: data.title || '',
      layout: data.layout || 'page',
      permalink: data.permalink,
      content,
      slug,
    };
    
    pages.push(page);
  }
  
  return pages;
}

/**
 * Copy assets from Jekyll to Next.js public directory
 */
export function copyJekyllAssets(
  jekyllAssetsDir: string, 
  nextPublicDir: string,
  subPath: string = ''
): void {
  if (!fs.existsSync(jekyllAssetsDir)) {
    console.warn(`Jekyll assets directory not found: ${jekyllAssetsDir}`);
    return;
  }
  
  const destDir = path.join(nextPublicDir, subPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const copyRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;
    
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        copyRecursive(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  copyRecursive(jekyllAssetsDir, destDir);
  console.warn(`Copied assets from ${jekyllAssetsDir} to ${destDir}`);
}