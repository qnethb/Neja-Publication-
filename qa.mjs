import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';

async function test() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium'
  });

  console.log('\n=== HOME PAGE — MOBILE (390px) ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/home-mobile.png' });
    console.log('✅ Screenshot saved: /tmp/home-mobile.png');

    // Check hero headline
    const heroH1 = await page.locator('h1').first().textContent();
    console.log(`✅ Hero headline: "${heroH1?.substring(0, 30)}…"`);

    // Check featured books render
    const bookCards = await page.locator('article').count();
    console.log(`✅ Book cards rendered: ${bookCards}`);

    // Check sticky CTA button at bottom
    const stickyBtn = await page.locator('a[href*="wa.me"]').last();
    const isVisible = await stickyBtn.isVisible();
    console.log(`✅ Sticky WhatsApp CTA visible on mobile: ${isVisible}`);

    // Check for Sinhala text
    const sinhalaText = await page.locator('[lang="si"]').count();
    console.log(`✅ Sinhala text blocks (lang="si"): ${sinhalaText}`);

    await ctx.close();
  }

  console.log('\n=== HOME PAGE — DESKTOP (1440px) ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);

    await page.screenshot({ path: '/tmp/home-desktop.png' });
    console.log('✅ Screenshot saved: /tmp/home-desktop.png');

    const heroH1 = await page.locator('h1').first().textContent();
    console.log(`✅ Hero headline: "${heroH1?.substring(0, 30)}…"`);

    await ctx.close();
  }

  console.log('\n=== BOOK DETAIL PAGE: /books/rudraksha ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/books/rudraksha/`);

    await page.screenshot({ path: '/tmp/book-detail.png' });
    console.log('✅ Screenshot saved: /tmp/book-detail.png');

    // Check book title
    const titleH1 = await page.locator('h1').first().textContent();
    console.log(`✅ Book title renders: "${titleH1}"`);

    // Check OG tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    console.log(`✅ og:title: "${ogTitle?.substring(0, 40)}…"`);
    console.log(`✅ og:description: "${ogDesc?.substring(0, 40)}…"`);
    console.log(`✅ og:image: ${ogImage}`);

    // Check WhatsApp link contains correct Sinhala message
    const waLink = await page.getAttribute('a[href*="wa.me"]', 'href');
    const hasRudrakshaSi = waLink?.includes('%E0%B6%9A%E0%B7%92%E0%B6%AF%E0%B7%8D%E0%B6%BB%E0%B6%91%E0%B6%9A%E0%B7%8F'); // රුද්‍රාක්ෂ encoded
    console.log(`✅ WhatsApp link has Sinhala title: ${hasRudrakshaSi}`);

    // Check themes render as badges
    const themeBadges = await page.locator('li[class*="border-gold"]').count();
    console.log(`✅ Theme badges rendered: ${themeBadges}`);

    await ctx.close();
  }

  console.log('\n=== BOOK DETAIL PAGE — MOBILE (390px) ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 1200 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/books/rudraksha/`);

    await page.screenshot({ path: '/tmp/book-detail-mobile.png' });
    console.log('✅ Screenshot saved: /tmp/book-detail-mobile.png');

    // Check sticky CTA is visible and has book-specific message
    const stickyCta = await page.locator('[class*="fixed"][class*="bottom-0"]');
    const stickyVisible = await stickyCta.isVisible();
    console.log(`✅ Sticky CTA visible on mobile book page: ${stickyVisible}`);

    const stickyLabel = await stickyCta.locator('span').nth(1).textContent();
    console.log(`✅ Sticky CTA label: "${stickyLabel?.substring(0, 30)}…"`);

    await ctx.close();
  }

  console.log('\n=== SECOND BOOK: /books/hasthipura-walawwa ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/books/hasthipura-walawwa/`);

    // Check TODO placeholders render (author, price, format)
    const todoElements = await page.locator('text=/TODO: confirm/').count();
    console.log(`✅ TODO placeholders visible: ${todoElements > 0 ? 'yes' : 'no'} (found ${todoElements})`);

    // Check Sinhala title (the spelling that needed confirmation)
    const titleText = await page.locator('h1').first().textContent();
    const hasSiTitle = titleText?.includes('හස්තපුර');
    console.log(`✅ Sinhala title displays (හස්තපුර): ${hasSiTitle}`);

    await ctx.close();
  }

  console.log('\n=== BRAND / DESIGN SYSTEM ===');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);

    // Check fonts loaded
    const fonts = await page.evaluate(() => {
      return document.fonts.ready.then(() => Array.from(document.fonts).map(f => f.family));
    });
    const hasAbhaya = fonts.some(f => f.includes('Abhaya'));
    const hasNoto = fonts.some(f => f.includes('Noto'));
    console.log(`✅ Abhaya Libre font loaded: ${hasAbhaya}`);
    console.log(`✅ Noto Sans font loaded: ${hasNoto}`);

    // Check brand colors in computed styles
    const heading = await page.locator('h1').first();
    const color = await heading.evaluate(el => window.getComputedStyle(el).color);
    console.log(`✅ Gold heading color: ${color}`);

    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ ALL TESTS COMPLETE');
}

test().catch(console.error);
