import { getCategories, slugify, type Post } from '../../lib/posts';

export interface Category {
  name: string;
  slug: string;
  count: number;
}

const ACRONYMS = new Set([
  'ai',
  'ml',
  'llm',
  'nlp',
  'api',
  'c',
  'cv',
  'ci',
  'cd',
  'sql',
  'aws',
  'gpu',
]);

export function categoryLabel(name: string): string {
  if (name !== name.toLowerCase()) return name;
  return name
    .split(/(\s+|-)/)
    .map((part) =>
      ACRONYMS.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

export function getCategoryList(posts: Post[]): Category[] {
  const merged = new Map<string, Category>();
  for (const { name, slug } of getCategories(posts)) {
    if (!slug) continue;
    const existing = merged.get(slug);
    if (!existing) {
      merged.set(slug, { name, slug, count: postsInCategory(posts, slug).length });
    } else if (existing.name === existing.name.toLowerCase() && name !== name.toLowerCase()) {
      existing.name = name;
    }
  }
  return [...merged.values()]
    .map((category) => ({ ...category, name: categoryLabel(category.name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function postsInCategory(posts: Post[], slug: string): Post[] {
  return posts.filter((post) =>
    post.data.categories.some((category) => slugify(category) === slug)
  );
}

export function categoryUrl(slug: string): string {
  return `/blog/category/${slug}/`;
}

export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getUTCFullYear();
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([year, posts]) => ({ year, posts }));
}
