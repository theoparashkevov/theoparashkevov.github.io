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
    <Link 
      href={`/blog/${post.slug}`}
      className="block bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-primary/30 transition-colors group"
    >
      {/* Thumbnail - simplified */}
      <div className="relative h-48 overflow-hidden">
        {post.thumbnail_location ? (
          <Image
            src={`/assets/img/posts/${post.thumbnail_location}/thumbnail.png`}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <span className="text-neutral-400 text-sm font-medium">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-neutral-500">{formattedDate}</span>
          {post.categories.length > 0 && (
            <span className="relative z-10 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
              {post.categories[0]}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-neutral-800 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        
        <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
          {post.description}
        </p>
        
        <div className="text-primary group-hover:text-primary-dark text-sm font-medium">
          Read more →
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;