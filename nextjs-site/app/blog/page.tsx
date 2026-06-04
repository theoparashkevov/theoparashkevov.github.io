import { getAllPosts, getAllCategories } from '@/lib/content/loader';
import BlogCard from '@/components/BlogCard';
import Link from 'next/link';

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-4">Blog</h1>
        <p className="text-neutral-600 max-w-3xl">
          Thoughts, tutorials, and insights on machine learning, software engineering, 
          and technology.
        </p>
      </div>

      {/* Categories - simplified */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/blog/category/${category.toLowerCase()}`}
                className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm rounded hover:bg-neutral-200 transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500">
            No blog posts yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}