# TODO — open items (nothing was guessed)

Every `❓` value in the codebase is collected here. Each one renders **visibly**
on the site (e.g. "❓ TODO: confirm price") so no fabricated value ever ships.
Resolve these, then remove the placeholder + its `// TODO` comment.

## Content — books (`src/data/books.js`)

### Rudraksha (රුද්‍රාක්ෂ)
- [x] **Author Sinhala spelling** — `ප්‍රාර්ථනා බණ්ඩාර` for *Prarthana Bandara*. ✅ Confirmed.
- [x] **Format** — Hardcover. ✅ Confirmed.
- [ ] **Sinhala hook** — confirm an official Sinhala translation of the story hook (currently English only).

### Hasthipura Walawwa (හස්තිපුර වලව්ව)
- [x] **TITLE SPELLING** — Updated to `හස්තිපුර වලව්ව`. ✅ Confirmed.
- [x] **Author** — Prarthana Bandara (`ප්‍රාර්ථනා බණ්ඩාර`). ✅ Confirmed.
- [x] **Price** — LKR 1,500. ✅ Confirmed.
- [x] **Format** — Hardcover. ✅ Confirmed.
- [ ] **Sinhala hook** — optional official Sinhala translation.

## Contact & social (`src/data/site.js`)
- [x] **Facebook page URL** — `https://www.facebook.com/share/19VjaYyUns/?mibextid=wwXIfr`. ✅ Confirmed.
- [x] **Contact email** — `nejapublications@gmail.com`. ✅ Confirmed (mailto form now enabled).

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
