import { getPublishedPosts, slugify, type Post } from '../../lib/posts';

export interface Series {
  name: string;
  slug: string;
  count: number;
}

export function getSeriesList(posts: Post[]): Series[] {
  const bySlug = new Map<string, Series>();
  for (const post of posts) {
    const name = post.data.series;
    if (!name) continue;
    const slug = slugify(name);
    const existing = bySlug.get(slug);
    if (existing) existing.count += 1;
    else bySlug.set(slug, { name, slug, count: 1 });
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function postsInSeries(posts: Post[], slug: string): Post[] {
  return posts
    .filter((post) => post.data.series && slugify(post.data.series) === slug)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

export function seriesUrl(slug: string): string {
  return `/blog/series/${slug}/`;
}

export async function getSeriesParts(post: Post): Promise<Post[] | undefined> {
  if (!post.data.series) return undefined;
  const posts = await getPublishedPosts();
  const parts = postsInSeries(posts, slugify(post.data.series));
  return parts.length > 1 ? parts : undefined;
}
