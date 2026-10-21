import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return sortByDateDesc(posts);
}

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function postUrl(post: Pick<Post, 'id'>): string {
  return `/blog/${post.id}/`;
}

export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function readingTime(markdown: string | undefined, wordsPerMinute = 220): number {
  if (!markdown) return 1;
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`[\]()!-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategories(posts: Post[]): { name: string; slug: string; count: number }[] {
  const bySlug = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of posts) {
    const seen = new Set<string>();
    for (const category of post.data.categories) {
      const slug = slugify(category);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const entry = bySlug.get(slug);
      if (entry) entry.count += 1;
      else bySlug.set(slug, { name: category, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function transitionName(kind: 'title' | 'hero' | 'meta' | 'card', id: string): string {
  return `post-${kind}-${slugify(id)}`;
}
