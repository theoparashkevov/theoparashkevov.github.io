import { remark } from 'remark';
import html from 'remark-html';

/**
 * Convert Markdown to HTML
 * Simplified version without math support for now
 */
export async function markdownToHtml(markdown: string, options: { useMath?: boolean } = {}) {
  const { useMath = false } = options;
  
  const result = await remark()
    .use(html, { sanitize: false })
    .process(markdown);

  return result.toString();
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
    .replace(/\{\{\s*"([^"]+)"\s*\|\s*relative_url\s*\}\}/g, '$1')
    .replace(/\{\{\s*page\.([^}]+)\s*\}\}/g, '');
  
  // Handle asset paths - common Liquid filters for images
  processed = processed.replace(
    /\{\{\s*"([^"]+)"\s*\|\s*(?:asset_path|img_url|relative_url)\s*\}\}/g,
    '/assets/$1'
  );
  
  // Handle inline image tags with Liquid filters
  processed = processed.replace(
    /<img[^>]*src="\{\{\s*"([^"]+)"\s*\|\s*(?:asset_path|img_url|relative_url)\s*\}\}"[^>]*>/g,
    (match, assetPath) => {
      return match.replace(/src="[^"]*"/, `src="/assets/${assetPath}"`);
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