import fs from 'fs';
import path from 'path';
import { BlogPost, Page } from '../lib/content/types';

interface ValidationResult {
  type: 'error' | 'warning';
  message: string;
  file?: string;
}

/**
 * Validates blog post and page content for common issues:
 * - Missing required fields
 * - Broken internal links
 * - Missing image alt text
 * - Invalid dates
 * - Empty content
 */
function validateContent(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const contentDir = path.join(__dirname, '..', 'content');

  // Validate posts
  const postsDir = path.join(contentDir, 'posts');
  if (fs.existsSync(postsDir)) {
    const postFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith('.json') && f !== 'index.json');
    const slugs = new Set<string>();

    for (const file of postFiles) {
      const filePath = path.join(postsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const post: BlogPost = JSON.parse(content);

        // Check required fields
        if (!post.title) {
          results.push({ type: 'error', message: 'Missing title', file });
        }
        if (!post.date) {
          results.push({ type: 'error', message: 'Missing date', file });
        } else if (isNaN(new Date(post.date).getTime())) {
          results.push({ type: 'error', message: 'Invalid date', file });
        }
        if (!post.content || post.content.trim().length === 0) {
          results.push({ type: 'error', message: 'Empty content', file });
        }
        if (!post.slug) {
          results.push({ type: 'error', message: 'Missing slug', file });
        } else if (slugs.has(post.slug)) {
          results.push({ type: 'error', message: `Duplicate slug: ${post.slug}`, file });
        } else {
          slugs.add(post.slug);
        }
        if (!post.description) {
          results.push({ type: 'warning', message: 'Missing description (bad for SEO)', file });
        }
        if (!post.htmlContent) {
          results.push({ type: 'warning', message: 'Missing htmlContent (will need to run migrate)', file });
        }

        // Check for broken internal links
        if (post.content) {
          const linkRegex = /\]\(([^)]+)\)/g;
          let match;
          while ((match = linkRegex.exec(post.content)) !== null) {
            const link = match[1];
            if (link.startsWith('/') && !link.startsWith('//')) {
              // Internal link - check if it exists
              const linkPath = path.join(__dirname, '..', 'public', link);
              if (!fs.existsSync(linkPath) && !link.includes('#')) {
                results.push({
                  type: 'warning',
                  message: `Possibly broken internal link: ${link}`,
                  file,
                });
              }
            }
          }
        }

        // Check for images without alt text
        if (post.content) {
          const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
          let match;
          while ((match = imgRegex.exec(post.content)) !== null) {
            const altText = match[1];
            const imgSrc = match[2];
            if (!altText || altText.trim().length === 0) {
              results.push({
                type: 'warning',
                message: `Image missing alt text: ${imgSrc}`,
                file,
              });
            }
          }
        }
      } catch (err) {
        results.push({
          type: 'error',
          message: `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
          file,
        });
      }
    }
  }

  // Validate pages
  const pagesDir = path.join(contentDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json') && f !== 'index.json');

    for (const file of pageFiles) {
      const filePath = path.join(pagesDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const page: Page = JSON.parse(content);

        if (!page.title) {
          results.push({ type: 'error', message: 'Missing title', file });
        }
        if (!page.content || page.content.trim().length === 0) {
          if (page.layout !== 'home') {
            results.push({ type: 'error', message: 'Empty content', file });
          }
        }
        if (!page.slug) {
          results.push({ type: 'error', message: 'Missing slug', file });
        }
      } catch (err) {
        results.push({
          type: 'error',
          message: `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
          file,
        });
      }
    }
  }

  return results;
}

// Run validation
const results = validateContent();
const errors = results.filter((r) => r.type === 'error');
const warnings = results.filter((r) => r.type === 'warning');

console.warn('\n=== Content Validation Results ===\n');

if (errors.length === 0 && warnings.length === 0) {
  console.warn('✅ All content is valid!');
} else {
  if (errors.length > 0) {
    console.warn(`❌ Found ${errors.length} error(s):\n`);
    errors.forEach((err) => {
      console.warn(`  [${err.file}] ${err.message}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  Found ${warnings.length} warning(s):\n`);
    warnings.forEach((warn) => {
      console.warn(`  [${warn.file}] ${warn.message}`);
    });
  }
}

console.warn(`\nSummary: ${errors.length} errors, ${warnings.length} warnings\n`);

// Exit with error code if there are errors
if (errors.length > 0) {
  process.exit(1);
}
