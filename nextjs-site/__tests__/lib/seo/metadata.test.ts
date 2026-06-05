import { generateSEO, generatePersonSchema, generateBlogPostSchema } from '@/lib/seo/metadata';

describe('generateSEO', () => {
  it('generates metadata with default values', () => {
    const metadata = generateSEO();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });

  it('includes site name in title when no custom title', () => {
    const metadata = generateSEO();
    expect(metadata.title).toContain('Teo Parashkevov');
  });

  it('uses custom title when provided', () => {
    const metadata = generateSEO({ title: 'Custom Title' });
    expect(metadata.title).toContain('Custom Title');
    expect(metadata.title).toContain('Teo Parashkevov');
  });

  it('uses custom description when provided', () => {
    const metadata = generateSEO({ description: 'Custom description' });
    expect(metadata.description).toBe('Custom description');
  });

  it('includes Open Graph metadata', () => {
    const metadata = generateSEO({ title: 'Test' });
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.title).toContain('Test');
    expect((metadata.openGraph as any).type).toBe('website');
  });

  it('uses article type for blog posts', () => {
    const metadata = generateSEO({ type: 'article' });
    expect((metadata.openGraph as any).type).toBe('article');
  });

  it('includes Twitter Card metadata', () => {
    const metadata = generateSEO({ title: 'Test' });
    expect(metadata.twitter).toBeDefined();
    expect((metadata.twitter as any).card).toBe('summary_large_image');
  });

  it('includes canonical URL', () => {
    const metadata = generateSEO({ url: '/test/' });
    expect(metadata.alternates?.canonical).toBeDefined();
  });

  it('includes robots meta', () => {
    const metadata = generateSEO();
    expect(metadata.robots).toBeDefined();
    expect((metadata.robots as any).index).toBe(true);
  });

  it('handles absolute image URLs', () => {
    const metadata = generateSEO({ image: 'https://example.com/image.jpg' });
    expect((metadata.openGraph?.images as any)?.[0]?.url).toBe('https://example.com/image.jpg');
  });

  it('prepends site URL to relative image paths', () => {
    const metadata = generateSEO({ image: '/assets/image.jpg' });
    expect((metadata.openGraph?.images as any)?.[0]?.url).toContain('/assets/image.jpg');
  });

  it('includes published time for articles', () => {
    const metadata = generateSEO({
      type: 'article',
      publishedTime: '2024-01-15T00:00:00.000Z',
    });
    expect((metadata.openGraph as any).publishedTime).toBe('2024-01-15T00:00:00.000Z');
  });

  it('includes tags as keywords', () => {
    const metadata = generateSEO({ tags: ['python', 'ml'] });
    expect(metadata.keywords).toEqual(['python', 'ml']);
  });
});

describe('generatePersonSchema', () => {
  it('generates valid Person schema', () => {
    const schema = generatePersonSchema();
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Teo Parashkevov');
  });

  it('includes job title', () => {
    const schema = generatePersonSchema();
    expect(schema.jobTitle).toBeDefined();
  });

  it('includes social media links', () => {
    const schema = generatePersonSchema();
    expect(schema.sameAs).toBeDefined();
    expect(Array.isArray(schema.sameAs)).toBe(true);
  });
});

describe('generateBlogPostSchema', () => {
  const mockPost = {
    title: 'Test Post',
    description: 'Test description',
    date: '2024-01-15T00:00:00.000Z',
    url: '/blog/test-post/',
  };

  it('generates valid BlogPosting schema', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Test Post');
  });

  it('includes post description', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.description).toBe('Test description');
  });

  it('includes published date', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.datePublished).toBe('2024-01-15T00:00:00.000Z');
  });

  it('includes author information', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.author).toBeDefined();
    expect(schema.author['@type']).toBe('Person');
  });

  it('includes publisher information', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.publisher).toBeDefined();
  });

  it('includes full URL', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.url).toContain('/blog/test-post/');
  });

  it('includes image when provided', () => {
    const schema = generateBlogPostSchema({ ...mockPost, image: '/test.jpg' });
    expect(schema.image).toBeDefined();
  });

  it('uses default author when not provided', () => {
    const schema = generateBlogPostSchema(mockPost);
    expect(schema.author.name).toBe('Teo Parashkevov');
  });

  it('uses custom author when provided', () => {
    const schema = generateBlogPostSchema({ ...mockPost, author: 'Custom Author' });
    expect(schema.author.name).toBe('Custom Author');
  });
});
