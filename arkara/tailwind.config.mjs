/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/\*\*/\*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        forest: '#1F3D2B',
        brown: '#6B4F3A',
        stone: '#5C5F61',
        amber: '#D98C2B',
        moss: '#6E8B3D',
        sand: '#E6D8B5',
        parchment: '#F5F0E8',
        ink: '#1A1208',
        danger: '#C0392B',
        info: '#5C7A8A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      typography: (theme) => ({
        arkara: {
          css: {
            '--tw-prose-body': theme('colors.stone'),
            '--tw-prose-headings': theme('colors.forest'),
            '--tw-prose-links': theme('colors.amber'),
            '--tw-prose-bold': theme('colors.forest'),
            fontFamily: theme('fontFamily.body').join(', '),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
