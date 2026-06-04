import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Convert Markdown to HTML with support for raw HTML
 */
export async function markdownToHtml(markdown: string, options: { useMath?: boolean } = {}) {
  const { useMath = false } = options;
  
  try {
    let processor = unified()
      .use(remarkParse) // Parse markdown
      .use(remarkRehype, { allowDangerousHtml: true }); // Convert to HTML AST with raw HTML support
    
    // Add math support if needed
    if (useMath) {
      processor = processor
        .use(remarkMath)
        .use(rehypeKatex);
    }
    
    // Finish processing
    const result = await processor
      .use(rehypeRaw) // Parse raw HTML strings
      .use(rehypeStringify) // Convert to HTML string
      .process(markdown);
    
    return result.toString();
  } catch (error) {
    console.error('Error processing markdown:', error);
    // Simple fallback - just return the markdown wrapped in <pre>
    return `<pre>${markdown}</pre>`;
  }
}

/**
 * Process Jekyll-specific Liquid template syntax
 * This is a basic implementation - we'll need to handle more edge cases
 */
export function processLiquidSyntax(html: string): string {
  // Replace simple Liquid variables (e.g., {{ site.url }})
  let processed = html
    .replace(/\{\{\s*site\.url\s*\}\}/g, '')
    .replace(/\{\{\s*site\.baseurl\s*\}\}/g, '')
    .replace(/\{\{\s*page\.([^}]+)\s*\}\}/g, '');

  // Handle asset paths - common Liquid filters for images
  // Match both with and without quotes: {{ "/assets/img/path.jpg" | relative_url }}
  processed = processed.replace(
    /\{\{\s*"([^"]+)"\s*\|\s*(?:asset_path|img_url|relative_url)\s*\}\}/g,
    (match, assetPath) => {
      // If path already starts with /assets/, use as-is
      // Otherwise prepend /assets/
      if (assetPath.startsWith('/assets/')) {
        return assetPath;
      } else if (assetPath.startsWith('assets/')) {
        return '/' + assetPath;
      } else {
        return '/assets/' + assetPath;
      }
    }
  );
  
  // Handle inline image tags with Liquid filters - for HTML already
  processed = processed.replace(
    /<img[^>]*src="\{\{\s*"([^"]+)"\s*\|\s*(?:asset_path|img_url|relative_url)\s*\}\}"[^>]*>/g,
    (match, assetPath) => {
      // Determine correct path
      let finalPath = assetPath;
      if (assetPath.startsWith('/assets/')) {
        finalPath = assetPath;
      } else if (assetPath.startsWith('assets/')) {
        finalPath = '/' + assetPath;
      } else {
        finalPath = '/assets/' + assetPath;
      }
      return match.replace(/src="[^"]*"/, `src="${finalPath}"`);
    }
  );
  
  // Simple include statements (we'll handle these differently)
  processed = processed.replace(
    /\{\%\s*include\s+([^%]+)\s*\%\}/g,
    '<!-- include: $1 -->'
  );
  
  return processed;
}

/**
 * Extract excerpt from markdown (first paragraph or specified length)
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
  // Remove front matter if present
  const content = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Get first paragraph or first maxLength characters
  const firstParagraphMatch = content.match(/^(.*?)(?:\n\n|$)/);
  
  if (firstParagraphMatch) {
    let excerpt = firstParagraphMatch[1].trim();
    
    // Remove markdown formatting
    excerpt = excerpt
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Code
      .replace(/#+\s+/g, '') // Headings
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ''); // Images
    
    if (excerpt.length > maxLength) {
      excerpt = excerpt.substring(0, maxLength) + '...';
    }
    
    return excerpt;
  }
  
  return content.substring(0, Math.min(maxLength, content.length)) + '...';
}