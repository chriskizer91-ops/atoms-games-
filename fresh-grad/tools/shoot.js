// Usage: node shoot.js <html file> <outdir> [prefix]
// Boots the game headless and captures the title, cutscene, degree picker and a few in-game frames.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const file = path.resolve(process.argv[2]);
  const out = path.resolve(process.argv[3]);
  const pre = process.argv[4] || 's';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + file);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${pre}-01-title.png` });
  await page.click('#btnStart');
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(2500); await page.screenshot({ path: `${out}/${pre}-02-cut${i}.png` }); }
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
