import {chromium} from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.google.com');

  for (let i = 0; i < 50; i++) {
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, -500);
  }

  await browser.close();
})();