import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, AUTHOR } from '../consts';
import { getPublishedPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE_URL);
  const posts = await getPublishedPosts();
  const feedUrl = new URL('/rss.xml', site).href;
  const lastUpdated = posts.reduce<Date | undefined>((latest, post) => {
    const date = post.data.updatedDate ?? post.data.pubDate;
    return !latest || date > latest ? date : latest;
  }, undefined);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      '<language>en</language>',
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
      lastUpdated ? `<lastBuildDate>${lastUpdated.toUTCString()}</lastBuildDate>` : '',
    ].join(''),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: post.data.categories,
      author: `${AUTHOR.email} (${post.data.author})`,
    })),
  });
}
