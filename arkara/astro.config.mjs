// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://arkaraweb.com',

  adapter: node({
    mode: 'standalone'
  }),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap(),
  ],

  image: {
    domains: [
      'arkara-media.fly.storage.tigris.dev',
      'zythkkmygravwelxbwtf.supabase.co',
    ],
  },
});