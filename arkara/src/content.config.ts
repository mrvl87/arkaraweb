import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    category: z
      .enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas'])
      .default('pangan'),
    coverImage: z.string().optional(),
    aiGenerated: z.boolean().default(false),
  }),
});

const panduan = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/panduan' }),
  schema: z.object({
    title: z.string(),
    babRef: z.string().optional(),
    qrSlug: z.string().optional(),
  }),
});

export const collections = { blog, panduan };
