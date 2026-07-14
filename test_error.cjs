const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', exception => {
    errors.push(`Uncaught exception: "${exception}"`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: "${msg.text()}"`);
    }
  });

  await page.goto('https://digital-signage-system-two.vercel.app/login');
  
  // Fill login
  await page.fill('input[type="email"]', 'bashar.alqeh10@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  
  await page.goto('https://digital-signage-system-two.vercel.app/dashboard/screens');
  
  await page.waitForTimeout(3000);
  
  console.log('Errors found:');
  console.log(errors.join('\n'));
  
  await browser.close();
})();
