// ============================================================
//  Central site / brand configuration.
//  Edit brand strings, navigation, and social links here.
// ============================================================

import { WHATSAPP_DISPLAY } from '../lib/whatsapp.js';

export const site = {
  name: 'Neja Publications',
  nameSi: 'නේජා ප්‍රකාශන',
  positioning: 'The future of cinematic Sinhala storytelling.',

  // Hero copy (Sinhala-first, per brief)
  heroHeadlineSi: 'සිංහල කතාන්දරයක අනාගතය.',
  heroSubheadSi: 'නේජා ප්‍රකාශන — සිනමාත්මක සිංහල කතාන්දරකරණයේ නව පරම්පරාව.',
  heroCtaSi: 'WhatsApp ඔස්සේ ඇණවුම් කරන්න',

  // Default SEO / social
  defaultTitle: 'Neja Publications — Cinematic Sinhala Storytelling',
  defaultDescription:
    'Neja Publications (නේජා ප්‍රකාශන) — the future of cinematic Sinhala storytelling. Discover our novels and order on WhatsApp with islandwide cash-on-delivery.',
  ogDefault: '/assets/og-default.svg', // placeholder — swap for og-default.jpg (1200×630), see public/assets/README.md
  locale: 'si_LK',

  // Contact
  whatsappDisplay: WHATSAPP_DISPLAY,
  email: 'nejapublications@gmail.com',
  facebook: 'https://www.facebook.com/share/19VjaYyUns/?mibextid=wwXIfr',
};

// Primary navigation — used by header and footer.
export const nav = [
  { href: '/', label: 'Home', labelSi: 'මුල් පිටුව' },
  { href: '/books', label: 'Books', labelSi: 'පොත්' },
  { href: '/trailers', label: 'Trailers', labelSi: 'පෙරදසුන්' },
  { href: '/about', label: 'About', labelSi: 'අප ගැන' },
  { href: '/news', label: 'News', labelSi: 'පුවත්' },
  { href: '/contact', label: 'Contact', labelSi: 'සම්බන්ධ වන්න' },
];
