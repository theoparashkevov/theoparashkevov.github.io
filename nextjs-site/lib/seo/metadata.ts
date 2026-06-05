import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://theoparashkevov.github.io';
const SITE_NAME = 'Teo Parashkevov';
const SITE_DESCRIPTION =
  'Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  tags?: string[];
}

/**
 * Generate comprehensive SEO metadata including Open Graph and Twitter Cards
 */
export function generateSEO({
  title,
  description = SITE_DESCRIPTION,
  image = '/assets/img/profile.png',
  url,
  type = 'website',
  publishedTime,
  author = SITE_NAME,
  tags = [],
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Machine Learning Engineer`;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return {
    title: fullTitle,
    description,
    authors: [{ name: author }],
    keywords: tags,
    openGraph: {
      type,
      locale: 'en_US',
      url: fullUrl,
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: '@theoparashkevov',
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate JSON-LD structured data for a person
 */
export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: 'Machine Learning Engineer',
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://github.com/theoparashkevov',
      'https://www.linkedin.com/in/teo-parashkevov/',
      'https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g',
    ],
  };
}

/**
 * Generate JSON-LD structured data for a blog post
 */
export function generateBlogPostSchema(post: {
  title: string;
  description: string;
  date: string;
  url: string;
  image?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: post.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
    },
    url: `${SITE_URL}${post.url}`,
    ...(post.image && { image: `${SITE_URL}${post.image}` }),
  };
}
