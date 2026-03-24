// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://arkaraweb.com',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx()],

  adapter: node({
    mode: 'standalone'
  }),

  image: {
    domains: [
      'arkara-media.fly.storage.tigris.dev',
      'zythkkmygravwelxbwtf.supabase.co',
    ],
  },
});