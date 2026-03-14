// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
// NOTE: StudioCMS integration commented out temporarily due to Windows ESM loader issue
// TODO: Re-enable once studiocms fixes Windows path handling
// import studiocms from 'studiocms';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx()],

  adapter: node({
    mode: 'standalone'
  }),

  image: {
    domains: ['arkara-media.fly.storage.tigris.dev'],
  },
});