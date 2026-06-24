# TODO — open items (nothing was guessed)

Every `❓` value in the codebase is collected here. Each one renders **visibly**
on the site (e.g. "❓ TODO: confirm price") so no fabricated value ever ships.
Resolve these, then remove the placeholder + its `// TODO` comment.

## Content — books (`src/data/books.js`)

### Rudraksha (රුද්‍රාක්ෂ)
- [ ] **Author Sinhala spelling** — confirm `ප්‍රාර්ථනා බණ්ඩාර` for *Prarthana Bandara*.
- [ ] **Format** — paperback / hardcover, page count.
- [ ] **Sinhala hook** — confirm an official Sinhala translation of the story hook (currently English only).

### Hasthipura Walawwa (හස්තපුර වලව්ව)
- [ ] **TITLE SPELLING** — brief shows `හස්තපුර වලව්ව`, but it may be `හස්තිපුර වලව්ව`. **Confirm before launch.** (Left exactly as given; not silently changed.)
- [ ] **English transliteration** — confirm preferred romanization (currently "Hasthipura Walawwa").
- [ ] **Author** — name (and Sinhala spelling).
- [ ] **Price.**
- [ ] **Format.**
- [ ] **Sinhala hook** — optional official Sinhala translation.

## Contact & social (`src/data/site.js`)
- [ ] **Facebook page URL** — exact link (used in footer + contact page).
- [ ] **Contact email** — enables the mailto contact form (currently disabled until set).

## Deployment / SEO
- [ ] **Production URL** — set `site` in `astro.config.mjs` (currently `https://neja-publications.netlify.app` placeholder) and update `public/robots.txt`.

## Assets (`public/assets/` — see that folder's README)
- [ ] **Book covers** — replace `covers/rudraksha.svg` and `covers/hasthipura.svg` with real JPGs (~800×1200), then update the `cover` paths in `src/data/books.js`. (JPG/PNG required so Facebook renders covers as share images.)
- [ ] **Default OG image** — replace `og-default.svg` with `og-default.jpg` (1200×630) and update `ogDefault` in `src/data/site.js`.
- [ ] **Hero** — replace `hero-poster.svg` with real artwork; optionally add `hero.mp4` for a video hero.
- [ ] **Logo** — replace `logo.svg` with the real Neja Publications mark.
- [ ] **Trailers** — none yet; add a `trailer` to a book in `src/data/books.js` when available.

## Confirmed (for reference — do not change without the publisher)
- WhatsApp number: **071 622 3423** → `94716223423`.
- Rudraksha price: **LKR 1,500**.
- Availability (both titles): Islandwide Delivery, Cash on Delivery.
