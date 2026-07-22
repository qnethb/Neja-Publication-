# Assets — what to drop in to go live

Every file here is a **clearly-labeled placeholder**. Replace each one with the
real asset to make the site production-ready. Keep the **same filename** wherever
possible so no code changes are needed; where the file extension changes
(`.svg` → `.jpg`), update the one referenced path noted below.

| Placeholder (now) | Replace with | Used for | Notes |
| --- | --- | --- | --- |
| `logo.svg` | `logo.svg` | Favicon / header mark | Square. Keep `.svg`, or replace with a PNG and update the favicon `<link>` in `src/layouts/BaseLayout.astro`. |
| `og-default.svg` | `og-default.jpg` | Default Facebook/Twitter share image | **1200 × 630 px JPG/PNG.** Facebook does NOT render SVG previews — a real JPG is required. Then set `ogDefault` in `src/data/site.js` to `/assets/og-default.jpg`. |
| `hero-poster.svg` | `hero-poster.jpg` | Home hero backdrop | ~1600 × 900 px. Optional: also add `hero.mp4` for a cinematic video hero (then wire it into `src/pages/index.astro`). |
| `covers/rudraksha.svg` | `covers/rudraksha.jpg` | Rudraksha cover (and its share image) | Portrait ~800 × 1200 px (2:3). Then set `cover` for Rudraksha in `src/data/books.js` to `/assets/covers/rudraksha.jpg`. |
| `covers/hasthipura.svg` | `covers/hasthipura.jpg` | Hasthipura Walawwa cover | Portrait ~800 × 1200 px (2:3). Then set `cover` for that book in `src/data/books.js`. |

## Covers are used as social share images

A book page sets `og:image` to that book's `cover`. For Facebook link previews to
render, the cover must be a **JPG or PNG** (not SVG). Swapping the placeholders
for real JPGs handles this automatically.

## Trailers (optional)

There are no trailer files yet. To add one, drop e.g. `trailers/rudraksha.mp4`
here and set the `trailer` field on that book in `src/data/books.js`:

```js
trailer: { type: 'file', src: '/assets/trailers/rudraksha.mp4', poster: '/assets/covers/rudraksha.jpg' }
// or a YouTube video:
trailer: { type: 'youtube', id: 'YOUTUBE_VIDEO_ID' }
```
