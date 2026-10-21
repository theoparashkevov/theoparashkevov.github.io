import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Teo Parashkevov'),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    math: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
