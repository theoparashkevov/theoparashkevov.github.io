#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { loadJekyllPosts, loadJekyllPages, copyJekyllAssets } from '../lib/content/jekyll-loader';
import { BlogPost, Page } from '../lib/content/types';
import { markdownToHtml, processLiquidSyntax } from '../lib/markdown/processor';

// Get the directory where this script is located
const SCRIPT_DIR = __dirname;
// Go up two levels from scripts directory to get to nextjs-site root
const NEXT_ROOT = path.join(SCRIPT_DIR, '..');
// Jekyll docs directory is at the project root (same level as nextjs-site)
const JEKYLL_ROOT = path.join(NEXT_ROOT, '..', 'docs');

const JEKYLL_POSTS_DIR = path.join(JEKYLL_ROOT, '_posts');
const JEKYLL_PAGES_DIR = JEKYLL_ROOT;
const JEKYLL_ASSETS_DIR = path.join(JEKYLL_ROOT, 'assets');
const JEKYLL_DRAFTS_DIR = path.join(JEKYLL_ROOT, '_drafts');

const NEXT_CONTENT_DIR = path.join(NEXT_ROOT, 'content');
const NEXT_POSTS_DIR = path.join(NEXT_CONTENT_DIR, 'posts');
const NEXT_PAGES_DIR = path.join(NEXT_CONTENT_DIR, 'pages');
const NEXT_DRAFTS_DIR = path.join(NEXT_CONTENT_DIR, 'drafts');
const NEXT_PUBLIC_DIR = path.join(NEXT_ROOT, 'public');

interface ProcessedPost extends BlogPost {
  htmlContent: string;
}

async function migratePosts() {
  console.log('Loading Jekyll posts...');
  console.log(`Looking for posts in: ${JEKYLL_POSTS_DIR}`);
  const posts = loadJekyllPosts(JEKYLL_POSTS_DIR);
  console.log(`Found ${posts.length} posts`);
  
  // Ensure destination directory exists
  if (!fs.existsSync(NEXT_POSTS_DIR)) {
    fs.mkdirSync(NEXT_POSTS_DIR, { recursive: true });
  }
  
  const processedPosts: ProcessedPost[] = [];
  
  for (const post of posts) {
    console.log(`Processing: ${post.slug}`);
    
    // First process Liquid syntax in the markdown
    const processedMarkdown = processLiquidSyntax(post.content);
    
    // Then convert processed markdown to HTML
    const htmlContent = await markdownToHtml(processedMarkdown, { 
      useMath: post.usemathjax 
    });
    
    const processedPost: ProcessedPost = {
      ...post,
      htmlContent,
    };
    
    // Save as JSON for Next.js to use
    const postFilePath = path.join(NEXT_POSTS_DIR, `${post.slug}.json`);
    fs.writeFileSync(postFilePath, JSON.stringify(processedPost, null, 2));
    
    processedPosts.push(processedPost);
  }
  
  // Create index of all posts
  const postsIndex = processedPosts.map(p => ({
    title: p.title,
    date: p.date.toISOString(),
    slug: p.slug,
    description: p.description,
    categories: p.categories,
    thumbnail_location: p.thumbnail_location,
  }));
  
  fs.writeFileSync(
    path.join(NEXT_POSTS_DIR, 'index.json'),
    JSON.stringify(postsIndex, null, 2)
  );
  
  console.log(`Migrated ${processedPosts.length} posts`);
  return processedPosts;
}

function migratePages() {
  console.log('Loading Jekyll pages...');
  console.log(`Looking for pages in: ${JEKYLL_PAGES_DIR}`);
  const pages = loadJekyllPages(JEKYLL_PAGES_DIR);
  console.log(`Found ${pages.length} pages`);
  
  // Ensure destination directory exists
  if (!fs.existsSync(NEXT_PAGES_DIR)) {
    fs.mkdirSync(NEXT_PAGES_DIR, { recursive: true });
  }
  
  for (const page of pages) {
    console.log(`Processing page: ${page.slug}`);
    
    // Save as JSON for Next.js to use
    const pageFilePath = path.join(NEXT_PAGES_DIR, `${page.slug}.json`);
    fs.writeFileSync(pageFilePath, JSON.stringify(page, null, 2));
  }
  
  // Create index of all pages
  const pagesIndex = pages.map(p => ({
    title: p.title,
    slug: p.slug,
    permalink: p.permalink,
  }));
  
  fs.writeFileSync(
    path.join(NEXT_PAGES_DIR, 'index.json'),
    JSON.stringify(pagesIndex, null, 2)
  );
  
  console.log(`Migrated ${pages.length} pages`);
  return pages;
}

async function migrateAssets() {
  console.log('Copying assets...');
  console.log(`From: ${JEKYLL_ASSETS_DIR}`);
  console.log(`To: ${NEXT_PUBLIC_DIR}/assets`);
  copyJekyllAssets(JEKYLL_ASSETS_DIR, NEXT_PUBLIC_DIR, 'assets');
  console.log('Assets copied');
}

async function main() {
  console.log('Starting Jekyll to Next.js migration...');
  console.log(`Jekyll root: ${JEKYLL_ROOT}`);
  console.log(`Next.js root: ${NEXT_ROOT}`);
  
  try {
    // Create necessary directories
    [NEXT_POSTS_DIR, NEXT_PAGES_DIR, NEXT_DRAFTS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Perform migrations
    await migratePosts();
    migratePages();
    await migrateAssets();
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}