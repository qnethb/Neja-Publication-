// ============================================================
//  Neja Publications — single source of truth for all book content.
//  Add a new title by appending an object to the `books` array below;
//  every page (home, catalog, individual book page) is generated from
//  this file — no page edits required.
//
//  HARD RULE: do not invent prices, authors, dates, formats, or quotes.
//  Anything unknown stays as the string "❓ TODO: …" with a // TODO note,
//  so it renders visibly on the site and nothing is silently guessed.
// ============================================================

export const books = [
  {
    slug: 'rudraksha',
    title: 'Rudraksha',
    titleSi: 'රුද්‍රාක්ෂ',
    author: 'Prarthana Bandara',
    authorSi: 'ප්‍රාර්ථනා බණ්ඩාර', // TODO: confirm exact Sinhala spelling of the author's name
    genre: ['Mythological Fantasy', 'Mystery', 'Spiritual Thriller'],
    themes: [
      'Past lives',
      'Sinhala mysticism',
      'Yanthra & Manthra',
      'Star gates',
      'Ancient knowledge',
      'Ayurvedic healing',
      'Destiny',
    ],
    hookEn:
      'A mystery rooted in forgotten Sinhala knowledge unfolds across time, connecting past lives, sacred traditions, hidden forces, and a destiny that refuses to remain buried.',
    // TODO: confirm an official Sinhala translation of the hook from the publisher.
    hookSi: null,
    price: 'LKR 1,500',
    availability: ['Islandwide Delivery', 'Cash on Delivery'],
    format: 'Hardcover',
    cover: '/assets/covers/rudraksha.svg', // placeholder — swap for rudraksha.jpg, see public/assets/README.md
    coverAlt: "Cover of the novel Rudraksha (රුද්‍රාක්ෂ) by Prarthana Bandara",
    trailer: null, // e.g. { type: 'youtube', id: 'XXXXXXXXXXX' } or { type: 'file', src: '/assets/trailers/rudraksha.mp4' }
    featured: true,
    latest: true,
  },
  {
    slug: 'hasthipura-walawwa',
    title: 'Hasthipura Walawwa',
    titleSi: 'හස්තිපුර වලව්ව',
    author: 'Prarthana Bandara',
    authorSi: 'ප්‍රාර්ථනා බණ්ඩාර',
    genre: ['Historical Mystery', 'Romance'],
    themes: [
      'Sinhala heritage',
      'Family legacy',
      'Secrets',
      'Love',
      'Historical intrigue',
    ],
    hookEn:
      'Within the walls of an aristocratic Sinhala estate, hidden truths begin to surface, forcing past and present into a collision that changes everything.',
    hookSi: null, // TODO: confirm official Sinhala hook
    price: 'LKR 1,500',
    availability: ['Islandwide Delivery', 'Cash on Delivery'],
    format: 'Hardcover',
    cover: '/assets/covers/hasthipura.svg', // placeholder — swap for hasthipura.jpg, see public/assets/README.md
    coverAlt: 'Cover of the novel Hasthipura Walawwa (හස්තපුර වලව්ව)',
    trailer: null,
    featured: false,
    latest: false,
  },
];

// --- Derived helpers (used across pages so logic lives in one place) ---

/** Find a single book by its URL slug. Returns null if not found. */
export function getBook(slug) {
  return books.find((b) => b.slug === slug) || null;
}

/** Books flagged to appear in the home "Featured" section. */
export const featuredBooks = books.filter((b) => b.featured);

/** The most recent release, used for the home "Latest Release" block. */
export const latestRelease = books.find((b) => b.latest) || books[0];

/** True when a value is a confirmed, real value (not a TODO placeholder). */
export function isConfirmed(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('TODO');
}
