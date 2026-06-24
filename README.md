# Neja Publication — Online Bookstore 📚

A modern, bilingual (English + Sinhala) book-selling website built for the
**Sri Lankan** market. Browse a catalogue of Sinhala & English titles, add books
to a cart, and check out with **Cash on Delivery**, **Bank Transfer**, or a one-tap
**WhatsApp order** — the three ways small Sri Lankan publishers actually take orders.

Built as a fast, dependency-light **React + Vite** static site — no backend required,
so it deploys anywhere for free.

## ✨ Features

- **Bilingual UI** — instant English ⇄ Sinhala (සිංහල) toggle, with correct Noto Sans
  Sinhala rendering. The language choice is remembered between visits.
- **Catalogue & search** — browse by category, search by title/author, and sort by
  price or newest.
- **Cart** — slide-in cart drawer with live totals, quantity controls, and a
  free-delivery progress bar. Cart persists in `localStorage`.
- **Checkout for Sri Lanka**:
  - **District selector** (all 25 districts) with zone-based delivery fees.
  - **Free island-wide delivery** over Rs. 5,000.
  - Payment by **Cash on Delivery**, **Bank Transfer** (account details shown), or
    **WhatsApp** (a formatted order message is pre-filled into a `wa.me` link).
- **LKR pricing** throughout, formatted as `Rs. 1,250`.
- **Mobile-first, responsive** design tuned for phone-heavy, variable-bandwidth users.
- Generated typographic book covers (no image assets → nothing ever 404s).

## 🚀 Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## 📦 Deployment

`npm run build` outputs a static site to `dist/`. Because `vite.config.js` sets
`base: './'`, the build works from any path. Deploy `dist/` to:

- **Netlify / Vercel / Cloudflare Pages** — point them at the repo; build command
  `npm run build`, publish directory `dist`.
- **GitHub Pages** — push the contents of `dist/` to a `gh-pages` branch.

> Note: routing uses the HTML5 history API (`BrowserRouter`). On static hosts,
> add a redirect/rewrite of all paths to `index.html` (e.g. a Netlify `_redirects`
> file with `/* /index.html 200`) so deep links like `/shop` work on refresh.

## ✏️ Customising the store

Everything you'll want to edit lives in plain data files:

| What | File |
| --- | --- |
| Books (titles, prices, synopses, covers) | `src/data/books.js` |
| Delivery districts & fees, free-delivery threshold | `src/data/districts.js` |
| Bank details, address, email, social links | `src/data/business.js` |
| WhatsApp business number | `src/utils/whatsapp.js` (`WHATSAPP_NUMBER`) |
| UI text (English & Sinhala) | `src/i18n/translations.js` |
| Colours, fonts, spacing | CSS variables at the top of `src/index.css` |

**Before going live**, update the placeholder WhatsApp number, bank details, and
contact info in the files above.

## 🗂️ Project structure

```
src/
  main.jsx              app entry (providers + router)
  App.jsx               routes + layout
  index.css             theme tokens & base styles
  components.css        component / layout styles
  i18n/translations.js  EN/SI dictionaries
  context/              LanguageContext, CartContext
  data/                 books, districts, business info
  utils/                LKR formatting, delivery calc, WhatsApp link builder
  components/           Navbar, Footer, Hero, BookCard, CartDrawer, …
  pages/                Home, Shop, BookDetail, Checkout, About, Contact
```

## 🛠️ Tech

React 18 · React Router 6 · Vite 5 · plain CSS (no UI framework).

---

Made with ❤️ in Sri Lanka for Neja Publication.
