import { getPostBySlug, getAllPosts } from '@/lib/content/loader';
import { notFound } from 'next/navigation';
import BlogPostContent from '@/components/BlogPostContent';
import { generateSEO, generateBlogPostSchema } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return generateSEO({
    title: post.title,
    description: post.description || post.excerpt || `${post.title} - Blog post by Teo Parashkevov`,
    url: `/blog/${post.slug}/`,
    type: 'article',
    publishedTime: new Date(post.date).toISOString(),
    tags: post.categories,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const blogPostSchema = generateBlogPostSchema({
    title: post.title,
    description: post.description || post.excerpt || '',
    date: new Date(post.date).toISOString(),
    url: `/blog/${post.slug}/`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
      />
      <BlogPostContent post={post} />
    </>
  );
}
