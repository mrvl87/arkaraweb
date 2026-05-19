// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://arkaraweb.com',
  build: {
    inlineStylesheets: 'always'
  },

  adapter: cloudflare({
    imageService: 'passthrough'
  }),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
  ],

  image: {
    domains: [
      'arkara-media.fly.storage.tigris.dev',
      'media.arkaraweb.com',
      'zythkkmygravwelxbwtf.supabase.co',
    ],
  },
});
