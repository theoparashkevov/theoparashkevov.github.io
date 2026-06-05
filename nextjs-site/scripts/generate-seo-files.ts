import { writeFileSync } from 'fs';
import { getAllPosts, getAllPages } from '../lib/content/loader';

const SITE_URL = 'https://theoparashkevov.github.io';
const SITE_TITLE = 'Teo Parashkevov';
const SITE_DESCRIPTION = 'Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer';

function generateAll() {
  generateSitemap();
  generateRobotsTxt();
  generateRSS();
}

function generateSitemap() {
  const posts = getAllPosts();
  const _pages = getAllPages();
  
  const urls = [
    // Static pages
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/blog', changefreq: 'weekly', priority: 0.9 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/projects', changefreq: 'monthly', priority: 0.8 },
    { url: '/contact', changefreq: 'monthly', priority: 0.8 },
    
    // Blog posts
    ...posts.map(post => ({
      url: `/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: post.modified_date || post.date,
    })),
  ];
  
  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(item => {
  const { url, changefreq, priority, lastmod } = item as any;
  return `
  <url>
    <loc>${SITE_URL}${url}</loc>
    ${lastmod ? `<lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('')}
</urlset>`;
  
  writeFileSync('public/sitemap.xml', sitemap);
  console.log('Generated sitemap.xml');
}

function generateRobotsTxt() {
  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow crawling of admin pages or internal tools
Disallow: /admin/
Disallow: /private/

# Allow all other pages`;
  
  writeFileSync('public/robots.txt', robots);
  console.log('Generated robots.txt');
}

function generateRSS() {
  const posts = getAllPosts();
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    
    ${posts.map(post => {
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      const postDate = post.date.toUTCString();
      const description = post.description || '';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${postDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${post.categories.map(cat => `<category><![CDATA[${cat}]]></category>`).join('\n      ')}
    </item>`;
    }).join('')}
  </channel>
</rss>`;
  
  writeFileSync('public/rss.xml', rss);
  console.log('Generated rss.xml');
}

// Run all generators
generateAll();