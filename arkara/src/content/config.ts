import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    category: z.enum(['air', 'energi', 'pangan', 'medis', 'keamanan', 'komunitas']).default('pangan'),
    coverImage: z.string().optional(),
    aiGenerated: z.boolean().default(false),
  }),
});

const panduan = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    babRef: z.string().optional(),
    qrSlug: z.string().optional(),
  }),
});

export const collections = { blog, panduan };
