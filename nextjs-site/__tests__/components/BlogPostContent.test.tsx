import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlogPostContent from '@/components/BlogPostContent';
import { BlogPost } from '@/lib/content/types';

const mockPost: BlogPost = {
  title: 'Test Blog Post Title',
  date: new Date('2024-01-15'),
  layout: 'post',
  categories: ['tech', 'programming'],
  author: 'Test Author',
  meta: [],
  description: 'Test description',
  content: 'Test content',
  slug: 'test-post',
  htmlContent: '<p>Test <strong>HTML</strong> content</p>',
  modified_date: new Date('2024-02-01'),
};

const mockPostWithoutHTML: BlogPost = {
  ...mockPost,
  htmlContent: undefined,
};

const mockPostWithoutCategories: BlogPost = {
  ...mockPost,
  categories: [],
};

const mockPostWithoutModifiedDate: BlogPost = {
  ...mockPost,
  modified_date: undefined,
};

describe('BlogPostContent', () => {
  beforeEach(() => {
    // Mock window.open
    global.window.open = jest.fn();
  });

  it('renders without crashing', () => {
    render(<BlogPostContent post={mockPost} />);
  });

  it('displays the post title', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText('Test Blog Post Title')).toBeInTheDocument();
  });

  it('displays the formatted date', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  it('displays "Back to Blog" link', () => {
    render(<BlogPostContent post={mockPost} />);
    const backLink = screen.getAllByText('← Back to Blog')[0];
    expect(backLink).toBeInTheDocument();
  });

  it('displays author information', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getAllByText('Teo Parashkevov').length).toBeGreaterThan(0);
    expect(screen.getByText('Machine Learning Engineer')).toBeInTheDocument();
  });

  it('displays categories as badges', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getAllByText('tech').length).toBeGreaterThan(0);
    expect(screen.getAllByText('programming').length).toBeGreaterThan(0);
  });

  it('does not display categories section when categories are empty', () => {
    render(<BlogPostContent post={mockPostWithoutCategories} />);
    // Should show "This post is not categorized" in the categories section
    expect(screen.getByText('This post is not categorized.')).toBeInTheDocument();
  });

  it('renders sanitized HTML content', () => {
    const { container } = render(<BlogPostContent post={mockPost} />);
    expect(container.innerHTML).toContain('<strong>HTML</strong>');
  });

  it('displays fallback message when htmlContent is missing', () => {
    render(<BlogPostContent post={mockPostWithoutHTML} />);
    expect(
      screen.getByText('Content not available. Please rebuild the site to generate HTML content.')
    ).toBeInTheDocument();
  });

  it('displays modified date when provided', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/February 1, 2024/)).toBeInTheDocument();
  });

  it('does not display modified date when not provided', () => {
    render(<BlogPostContent post={mockPostWithoutModifiedDate} />);
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });

  it('displays share buttons', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText('𝕏')).toBeInTheDocument();
    expect(screen.getByText('in')).toBeInTheDocument();
    expect(screen.getByText('✉️')).toBeInTheDocument();
  });

  it('opens Twitter share dialog when Twitter button clicked', () => {
    render(<BlogPostContent post={mockPost} />);
    const twitterButton = screen.getByText('𝕏');
    fireEvent.click(twitterButton);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com'),
      '_blank'
    );
  });

  it('opens LinkedIn share dialog when LinkedIn button clicked', () => {
    render(<BlogPostContent post={mockPost} />);
    const linkedinButton = screen.getByText('in');
    fireEvent.click(linkedinButton);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com'),
      '_blank'
    );
  });

  it('opens email client when email button clicked', () => {
    render(<BlogPostContent post={mockPost} />);
    const emailButton = screen.getByText('✉️');
    fireEvent.click(emailButton);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('mailto:'),
      '_self'
    );
  });

  it('displays "About the author" section', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText('About the author')).toBeInTheDocument();
  });

  it('displays "Categories" section', () => {
    render(<BlogPostContent post={mockPost} />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('displays "View all blog posts" link', () => {
    render(<BlogPostContent post={mockPost} />);
    const viewAllLink = screen.getByText('← View all blog posts');
    expect(viewAllLink).toBeInTheDocument();
  });

  it('loads KaTeX scripts when usemathjax is true', () => {
    const postWithMath: BlogPost = { ...mockPost, usemathjax: true };
    render(<BlogPostContent post={postWithMath} />);

    // Wait for useEffect to run
    waitFor(() => {
      const scripts = document.querySelectorAll('script[src*="katex"]');
      expect(scripts.length).toBeGreaterThan(0);
    });
  });

  it('does not load KaTeX scripts when usemathjax is false', () => {
    render(<BlogPostContent post={mockPost} />);
    const scripts = document.querySelectorAll('script[src*="katex"]');
    expect(scripts.length).toBe(0);
  });
});
