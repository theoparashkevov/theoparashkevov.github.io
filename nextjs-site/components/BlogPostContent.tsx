'use client';

import { BlogPost } from '@/lib/content/types';
import Link from 'next/link';
import { useEffect } from 'react';

// Type declaration for KaTeX
declare global {
  interface Window {
    renderMathInElement: (
      element: HTMLElement,
      options: {
        delimiters: Array<{
          left: string;
          right: string;
          display: boolean;
        }>;
        throwOnError: boolean;
      }
    ) => void;
  }
}

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

  // Load and render KaTeX if the post uses math
  useEffect(() => {
    if (post.usemathjax) {
      // Load KaTeX CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);

      // Load KaTeX JS
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script1.integrity = 'sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8';
      script1.crossOrigin = 'anonymous';
      
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
      script2.integrity = 'sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05';
      script2.crossOrigin = 'anonymous';

      // When both scripts are loaded, render math
      Promise.all([
        new Promise(resolve => { script1.onload = resolve; }),
        new Promise(resolve => { script2.onload = resolve; })
      ]).then(() => {
        if (window.renderMathInElement) {
          window.renderMathInElement(document.body, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\\\(', right: '\\\\)', display: false},
              {left: '\\\\[', right: '\\\\]', display: true}
            ],
            throwOnError: false
          });
        }
      });

      document.head.appendChild(script1);
      document.head.appendChild(script2);

      return () => {
        // Cleanup
        document.head.removeChild(link);
        document.head.removeChild(script1);
        document.head.removeChild(script2);
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
            className="text-primary hover:underline"
          >
            ← Back to Blog
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-6">
          <time dateTime={post.date.toISOString()} className="font-medium">
            {formattedDate}
          </time>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-800">
          {post.title}
        </h1>

        <div className="flex items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <div className="text-primary font-bold">TP</div>
          </div>
          <div>
            <div className="font-semibold text-neutral-800">
              Teo Parashkevov
            </div>
            <div className="text-neutral-600">Machine Learning Engineer</div>
          </div>
        </div>

        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-12">
        {post.htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />
        ) : (
          <div className="text-neutral-600 italic">
            Content not available. Please rebuild the site to generate HTML content.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-neutral-800">
              Share this post
            </h3>
            <div className="flex gap-3">
              <button
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        post.title
                      )}&url=${encodeURIComponent(
                        window.location.href
                      )}`,
                      '_blank'
                    );
                  }
                }}
              >
                𝕏
              </button>
              <button
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        window.location.href
                      )}`,
                      '_blank'
                    );
                  }
                }}
              >
                in
              </button>
              <button
                className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open(
                      `mailto:?subject=${encodeURIComponent(
                        post.title
                      )}&body=${encodeURIComponent(
                        `Check out this blog post: ${window.location.href}`
                      )}`,
                      '_self'
                    );
                  }
                }}
              >
                ✉️
              </button>
            </div>
          </div>

          {formattedModifiedDate && (
            <div className="text-sm text-neutral-600">
              Last updated: {formattedModifiedDate}
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 text-neutral-800">
                About the author
              </h3>
              <div className="p-6 bg-neutral-50 rounded-xl">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <div className="text-primary font-bold">TP</div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-800 mb-2">
                      Teo Parashkevov
                    </h4>
                    <p className="text-neutral-600">
                      Senior Python Developer & Machine Learning Engineer with expertise in
                      building scalable AI solutions and data-intensive applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 text-neutral-800">
                Categories
              </h3>
              <div className="p-6 bg-neutral-50 rounded-xl">
                {post.categories && post.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600">
                    This post is not categorized.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/blog"
            className="text-primary hover:underline font-medium"
          >
            ← View all blog posts
          </Link>
        </div>
      </footer>
    </article>
  );
};

export default BlogPostContent;