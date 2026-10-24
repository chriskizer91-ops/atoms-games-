// The Field Guide: place tabs, the numbering, Also found here links, the spoiler covers, remembering the tab, phone width.
//   node tests/12-field-guide.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const url = GUIDE;
  await p.goto(url); await p.waitForTimeout(500);
  const state = () => p.evaluate(() => ({ tab: document.querySelector('.tabs button.on').textContent, count: document.getElementById('count').textContent, cards: [...document.querySelectorAll('#grid .card')].map(c => c.querySelector('.num').textContent.slice(4) + ' ' + c.querySelector('h3').textContent).join(', '), cover: !!document.querySelector('.cover') }));
  console.log('first load', JSON.stringify(await state()));
  await p.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await p.screenshot({ path: shotPath('12-gt-1-village.png') });
  await p.click('button[data-z=grassland]'); await p.waitForTimeout(200);
  console.log('grassland', JSON.stringify(await state()));
  await p.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await p.screenshot({ path: shotPath('12-gt-2-grassland.png') });
  await p.click('button[data-z=cove]'); await p.waitForTimeout(200);
  console.log('cove', JSON.stringify(await state()), await p.evaluate(() => document.querySelector('.zonehead .also') ? document.querySelector('.zonehead .also').innerText.replace(/\n/g, ' ') : 'no also'));
  await p.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await p.screenshot({ path: shotPath('12-gt-3-cove.png') });
  // an "Also found here" link goes back to the Lakeshore page
  await p.click('.zonehead .also a'); await p.waitForTimeout(300);
  console.log('after also-link', JSON.stringify(await state()));
  await p.click('button[data-z=spire]'); await p.waitForTimeout(200);
  console.log('spire', JSON.stringify(await state()));
  await p.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await p.screenshot({ path: shotPath('12-gt-4-spire-cover.png') });
  await p.click('.cover button'); await p.waitForTimeout(200);
  console.log('spire opened', JSON.stringify(await state()));
  await p.click('button[data-z=all]'); await p.waitForTimeout(200);
  console.log('all', JSON.stringify((await state()).cover));
  await p.click('.cover button'); await p.waitForTimeout(300);
  const st = await state(); console.log('all opened', st.count, st.cards.split(', ').length);
  await p.fill('#q', 'night'); await p.waitForTimeout(200); console.log('search night', (await state()).count);
  // reload: remembers the tab and the opened spoilers
  await p.reload(); await p.waitForTimeout(400); console.log('reload', JSON.stringify((await state()).tab));
  await p.click('button[data-z=temple]'); await p.waitForTimeout(200); console.log('temple cover', (await state()).cover);
  // a direct link to a creature
  await p.goto(url + '#c-glyphling'); await p.waitForTimeout(500); console.log('hash link', JSON.stringify((await state()).tab));
  // phone
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ph.goto(url); await ph.waitForTimeout(500);
  await ph.evaluate(() => { localStorage.clear(); }); await ph.reload(); await ph.waitForTimeout(400);
  await ph.evaluate(() => document.getElementById('creatures').scrollIntoView());
  await ph.screenshot({ path: shotPath('12-gt-5-phone.png') });
  console.log('phone overflow', await ph.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
