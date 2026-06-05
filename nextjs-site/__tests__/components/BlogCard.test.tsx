import { render, screen } from '@testing-library/react';
import BlogCard from '@/components/BlogCard';
import { BlogPost } from '@/lib/content/types';

const mockPost: BlogPost = {
  title: 'Test Blog Post',
  date: new Date('2024-01-15'),
  layout: 'post',
  categories: ['tech', 'programming'],
  author: 'Test Author',
  meta: [],
  description: 'This is a test blog post description.',
  content: 'Test content',
  slug: 'test-post',
  thumbnail_location: 'test-post',
};

describe('BlogCard', () => {
  it('renders without crashing', () => {
    render(<BlogCard post={mockPost} />);
  });

  it('displays the post title', () => {
    render(<BlogCard post={mockPost} />);
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
  });

  it('displays the post description', () => {
    render(<BlogCard post={mockPost} />);
    expect(screen.getByText('This is a test blog post description.')).toBeInTheDocument();
  });

  it('displays the formatted date', () => {
    render(<BlogCard post={mockPost} />);
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('displays the first category', () => {
    render(<BlogCard post={mockPost} />);
    expect(screen.getByText('tech')).toBeInTheDocument();
  });

  it('displays "Read more" link text', () => {
    render(<BlogCard post={mockPost} />);
    expect(screen.getByText(/Read more/)).toBeInTheDocument();
  });

  it('links to the blog post', () => {
    render(<BlogCard post={mockPost} />);
    const link = screen.getByText('Test Blog Post').closest('a');
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });

  it('displays thumbnail when thumbnail_location is provided', () => {
    const { container } = render(<BlogCard post={mockPost} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('displays placeholder when no thumbnail_location', () => {
    const postWithoutThumbnail = { ...mockPost, thumbnail_location: undefined };
    render(<BlogCard post={postWithoutThumbnail} />);
    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('does not display category badge when categories array is empty', () => {
    const postWithoutCategories = { ...mockPost, categories: [] };
    render(<BlogCard post={postWithoutCategories} />);
    expect(screen.queryByText('tech')).not.toBeInTheDocument();
  });
});
