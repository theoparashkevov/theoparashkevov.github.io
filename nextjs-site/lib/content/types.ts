export interface BlogPost {
  title: string;
  date: Date;
  modified_date?: Date;
  layout: string;
  categories: string[];
  author: string;
  meta: string[];
  thumbnail_location?: string;
  usemathjax?: boolean;
  description: string;
  content: string; // Markdown content
  slug: string; // Derived from filename
  excerpt?: string;
  htmlContent?: string; // Processed HTML content
}

export interface Page {
  title: string;
  layout: string;
  permalink?: string;
  content: string;
  slug: string;
}

export interface SiteContent {
  posts: BlogPost[];
  pages: Page[];
  drafts: BlogPost[];
}