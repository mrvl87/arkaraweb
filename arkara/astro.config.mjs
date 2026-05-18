// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://arkaraweb.com',
  build: {
    inlineStylesheets: 'always'
  },

  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ],

  image: {
    domains: [
      'arkara-media.fly.storage.tigris.dev',
      'zythkkmygravwelxbwtf.supabase.co',
    ],
  },
});