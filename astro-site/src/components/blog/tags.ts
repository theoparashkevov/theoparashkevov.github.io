import { slugify, type Post } from '../../lib/posts';

export interface Tag {
  name: string;
  slug: string;
  count: number;
}

export function getTagList(posts: Post[]): Tag[] {
  const bySlug = new Map<string, Tag>();
  for (const post of posts) {
    const seen = new Set<string>();
    for (const tag of post.data.tags) {
      const slug = slugify(tag);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const entry = bySlug.get(slug);
      if (entry) entry.count += 1;
      else bySlug.set(slug, { name: tag, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function postsWithTag(posts: Post[], slug: string): Post[] {
  return posts.filter((post) => post.data.tags.some((tag) => slugify(tag) === slug));
}

export function tagUrl(slug: string): string {
  return `/blog/tag/${slug}/`;
}
