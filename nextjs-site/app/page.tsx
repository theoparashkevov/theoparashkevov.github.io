import Link from 'next/link';
import { getAllPosts } from '@/lib/content/loader';
import BlogCard from '@/components/BlogCard';

export default function Home() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 4); // Show 4 latest posts

  return (
    <div className="space-y-12">
      {/* Simple Header */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Senior Python Developer & Machine Learning Engineer writing about 
          scalable systems, AI solutions, and software engineering.
        </p>
      </section>

      {/* Latest Posts */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <Link
            href="/blog"
            className="text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {latestPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        
        {latestPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">
              No blog posts yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
