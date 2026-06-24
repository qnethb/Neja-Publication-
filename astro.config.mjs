// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: confirm the final production URL once Hashan picks a host.
// `site` must be the real deployed origin so Open Graph and sitemap URLs are
// absolute (Facebook requires absolute og:image URLs to render link previews).
const SITE = 'https://neja-publications.netlify.app'; // ❓ TODO: confirm deploy URL

export default defineConfig({
  site: SITE,
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
