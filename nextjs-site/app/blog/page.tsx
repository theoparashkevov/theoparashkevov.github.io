import { getAllPosts } from '@/lib/content/loader';
import BlogCard from '@/components/BlogCard';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-4 text-neutral-800">Blog</h1>
        <p className="text-neutral-600 max-w-3xl">
          Thoughts, tutorials, and insights on machine learning, software engineering, 
          and technology.
        </p>
      </div>

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