// The Field Guide: the hidden Night Ruins guardians, link jumps between tabs, dark mode, phone tabs.
//   node tests/13-field-guide-spoilers.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = GUIDE;
  await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  await p.click('button[data-z=ruins]'); await p.waitForTimeout(200);
  const names = () => p.evaluate(() => [...document.querySelectorAll('#grid .card')].map(c => c.querySelector('.num').textContent.slice(4) + ' ' + c.querySelector('h3').textContent).join(', '));
  console.log('ruins', await names());
  await p.evaluate(() => document.getElementById('c-lunariond').scrollIntoView({ block: 'center' })); await p.screenshot({ path: shotPath('13-gt-6-ruins-secret.png') });
  await p.click('#c-lunariond button'); await p.waitForTimeout(200); console.log('revealed', await names());
  await p.evaluate(() => { location.hash = '#c-sphinxie'; }); await p.waitForTimeout(400);
  console.log('hashchange', await p.evaluate(() => document.querySelector('.tabs button.on').textContent + ' ' + !!document.getElementById('c-sphinxie')));
  // dark mode
  await p.click('#theme'); await p.click('button[data-z=bayou]'); await p.waitForTimeout(200);
  await p.evaluate(() => document.getElementById('creatures').scrollIntoView()); await p.evaluate(() => window.scrollBy(0, 330)); await p.screenshot({ path: shotPath('13-gt-7-dark.png') });
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ph.goto(url); await ph.evaluate(() => localStorage.clear()); await ph.reload(); await ph.waitForTimeout(400);
  await ph.click('button[data-z=springs]'); await ph.waitForTimeout(300);
  await ph.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await ph.screenshot({ path: shotPath('13-gt-8-phone.png') });
  console.log('phone overflow', await ph.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  console.log('errors', errs);
  await b.close();
})();
