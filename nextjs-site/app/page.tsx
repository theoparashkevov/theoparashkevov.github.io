import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/content/loader';
import BlogCard from '@/components/BlogCard';

export default function Home() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 3); // Show 3 latest posts

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20"></div>
          <Image
            src="/assets/img/Teo-Parashkevov-Home.jpg"
            alt="Teo Parashkevov"
            width={192}
            height={192}
            className="relative rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
          />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Hey, I&apos;m <span className="text-blue-600 dark:text-blue-400">Teo Parashkevov</span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Senior Python Developer & Machine Learning Engineer passionate about building 
          scalable systems and cutting-edge AI solutions.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/about"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            About Me
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Read My Blog
          </Link>
        </div>
      </section>

      {/* Latest Posts */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Latest Blog Posts</h2>
          <Link
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View all posts →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        
        {latestPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No blog posts yet. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Skills Highlight */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-6">Areas of Expertise</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="text-blue-600 dark:text-blue-400 text-2xl mb-3">🤖</div>
            <h3 className="text-xl font-semibold mb-2">Machine Learning</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Building and deploying ML models for NLP, computer vision, 
              and predictive analytics.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="text-green-600 dark:text-green-400 text-2xl mb-3">💻</div>
            <h3 className="text-xl font-semibold mb-2">Software Engineering</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Designing scalable, robust systems with focus on performance 
              and maintainability.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="text-purple-600 dark:text-purple-400 text-2xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">Data Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Transforming raw data into actionable insights through 
              statistical modeling and visualization.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
