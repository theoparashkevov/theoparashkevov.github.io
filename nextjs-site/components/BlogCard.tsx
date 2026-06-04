import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/content/types';

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        {post.thumbnail_location ? (
          <Image
            src={`/assets/img/posts/${post.thumbnail_location}/thumbnail.png`}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">TP</span>
          </div>
        )}
        {/* Category badge */}
        {post.categories.length > 0 && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
              {post.categories[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span>{formattedDate}</span>
          {post.modified_date && (
            <>
              <span className="mx-2">•</span>
              <span>Updated</span>
            </>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {post.description}
        </p>
        
        <div className="flex items-center justify-between">
          <Link
            href={`/blog/${post.slug}`}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Read more →
          </Link>
          
          <div className="flex items-center space-x-2">
            {post.categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {category}
              </span>
            ))}
            {post.categories.length > 2 && (
              <span className="text-xs text-gray-500">+{post.categories.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;