'use client';

import { BlogPost } from '@/lib/content/types';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';

interface BlogPostContentProps {
  post: BlogPost;
}

const BlogPostContent: React.FC<BlogPostContentProps> = ({ post }) => {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedModifiedDate = post.modified_date
    ? new Date(post.modified_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Load KaTeX CSS if the post uses math
  useEffect(() => {
    if (post.usemathjax) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [post.usemathjax]);

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <div className="mb-6">
          <Link
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Blog
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center">
            <span className="font-medium">Published:</span>
            <time className="ml-2" dateTime={post.date.toISOString()}>
              {formattedDate}
            </time>
          </div>

          {formattedModifiedDate && (
            <div className="flex items-center">
              <span className="font-medium">Updated:</span>
              <time className="ml-2" dateTime={post.modified_date!.toISOString()}>
                {formattedModifiedDate}
              </time>
            </div>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-4">
            TP
          </div>
          <div>
            <div className="font-semibold">{post.author}</div>
            <div className="text-gray-600 dark:text-gray-400">Machine Learning Engineer</div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {post.categories.map((category) => (
            <span
              key={category}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              {category}
            </span>
          ))}
        </div>

        {/* Thumbnail */}
        {post.thumbnail_location && (
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={`/assets/img/posts/${post.thumbnail_location}/thumbnail.png`}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1024px"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {post.htmlContent ? (
          <div 
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
            className="blog-post-content"
          />
        ) : (
          <div className="whitespace-pre-wrap">{post.content}</div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Share this post</h3>
            <div className="flex space-x-4">
              <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                Twitter
              </button>
              <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                LinkedIn
              </button>
              <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                Copy Link
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link
              href="/blog"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ← Back to all posts
            </Link>
          </div>
        </div>

        {/* Related posts suggestion */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Keep reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <h4 className="font-semibold mb-2">Previous post</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Check out my other articles on machine learning and software engineering.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <h4 className="font-semibold mb-2">Next post</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Explore more technical content in the blog section.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for blog post styling */}
      <style jsx>{`
        .blog-post-content :global(p) {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }

        .blog-post-content :global(h1),
        .blog-post-content :global(h2),
        .blog-post-content :global(h3),
        .blog-post-content :global(h4) {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .blog-post-content :global(h1) {
          font-size: 2.25rem;
        }

        .blog-post-content :global(h2) {
          font-size: 1.875rem;
        }

        .blog-post-content :global(h3) {
          font-size: 1.5rem;
        }

        .blog-post-content :global(code) {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #1f2937;
        }

        .blog-post-content :global(pre) {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          border: 1px solid #374151;
        }

.blog-post-content :global(pre code) {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
          color: inherit;
          font-family: inherit;
        }

        /* Syntax highlighting colors for different languages */
        .blog-post-content :global(.language-bash .token.keyword) {
          color: #f472b6;
        }
        
        .blog-post-content :global(.language-python .token.keyword) {
          color: #60a5fa;
        }
        
        .blog-post-content :global(.language-javascript .token.keyword) {
          color: #fbbf24;
        }
        
        .blog-post-content :global(.language-cpp .token.keyword) {
          color: #34d399;
        }

        @media (prefers-color-scheme: dark) {
          .blog-post-content :global(code) {
            background-color: #374151;
            color: #d1d5db;
          }

          .blog-post-content :global(pre) {
            background-color: #111827;
            border-color: #374151;
          }

          .blog-post-content :global(th),
          .blog-post-content :global(td) {
            border-color: #4b5563;
          }

          .blog-post-content :global(th) {
            background-color: #111827;
          }
        }
      `}</style>
    </article>
  );
};

export default BlogPostContent;