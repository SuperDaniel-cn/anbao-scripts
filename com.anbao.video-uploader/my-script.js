const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://passport.bilibili.com/login');
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();