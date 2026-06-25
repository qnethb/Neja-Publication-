import { chromium } from 'playwright';

const BASE = 'http://localhost:4322';

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium'
  });

  console.log('Capturing home page (mobile)...');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.screenshot({ path: '/tmp/preview-home-mobile.png', fullPage: true });
    console.log('✅ /tmp/preview-home-mobile.png');
    await ctx.close();
  }

  console.log('Capturing home page (desktop)...');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.screenshot({ path: '/tmp/preview-home-desktop.png', fullPage: false });
    console.log('✅ /tmp/preview-home-desktop.png');
    await ctx.close();
  }

  console.log('Capturing book page (desktop)...');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/books/rudraksha/`);
    await page.screenshot({ path: '/tmp/preview-book.png', fullPage: true });
    console.log('✅ /tmp/preview-book.png');
    await ctx.close();
  }

  await browser.close();
  console.log('\n✅ Screenshots ready for preview');
}

capture().catch(console.error);
