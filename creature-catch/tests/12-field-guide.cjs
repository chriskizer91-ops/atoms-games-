// The Field Guide: place tabs, the numbering, Also found here links, the spoiler covers, remembering the tab, phone width,
// and what the cards say: where and how often a creature turns up, signature moves, the stat totals, item tags.
//   node tests/12-field-guide.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 1000 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
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
  await p.click('button[data-z=copperbell]'); await p.waitForTimeout(200);
  const copper = await p.evaluate(() => document.querySelector('.zonehead .also') ? document.querySelector('.zonehead .also').innerText.replace(/\n/g, ' ') : 'no also');
  console.log('copperbell', copper);
  check(/Clovermouse/.test(copper) && /Clove Tastical/.test(copper) && /Pebblepup/.test(copper) && /Boulderhound/.test(copper), 'Copperbell: Clovermouse, Clove Tastical, Pebblepup and Boulderhound are also found here');
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
  // every card: the total under the stat bars is the four stats added up
  const sums = await p.evaluate(() => [...document.querySelectorAll('#grid .card .stats')].filter(s => { const b = [...s.querySelectorAll('b')].map(x => +x.textContent); return b[0] + b[1] + b[2] + b[3] !== b[4]; }).length);
  check(st.cards.split(', ').length === 175 && sums === 0, 'all 175 cards, and each Base total adds up its four stats');
  const card = (id) => p.evaluate((id) => { const c = document.getElementById('c-' + id); return c ? c.querySelector('.meta').innerText.replace(/\n/g, ' / ') + ' || ' + c.querySelector('.sig').innerText.replace(/\n/g, ' ') : 'missing'; }, id);
  const cards = {}; for (const id of ['dingdove', 'rustcoon', 'puffmunk', 'mysterypop', 'crescub', 'fleecling', 'lanternfly']) { cards[id] = await card(id); console.log(id + ': ' + cards[id]); }
  check(/Common here day only · 40%/.test(cards.dingdove) && /Common here night only · 40%/.test(cards.rustcoon), 'Copperbell: Dingdove and Rustcoon are its commons, 40% each');
  check(/swipes extra coins if you win/.test(cards.rustcoon), 'Coin Swipe says what it does');
  check(/Uncommon here · 19% by day, 20% at night/.test(cards.puffmunk) && !/day only/.test(cards.puffmunk.split('||')[0]), 'Puffmunk is out day and night on the Meadow Path, with how often');
  check(/quarter of the damage/.test(cards.puffmunk) && !/half the damage/.test(cards.puffmunk), 'Cheek Stash heals a quarter of the damage, not half');
  check(/Uncommon here · 6%/.test(cards.mysterypop) && /Rare here · 3%/.test(cards.crescub) && /Rare here day only · 7%/.test(cards.fleecling), '? Pop, Crescub and Fleecling: their tier and how often');
  // items: what each one does, and no stray dots
  const tags = await p.evaluate(() => [...document.querySelectorAll('#itemlist .item')].map(i => i.querySelector('h3').textContent + ': ' + i.querySelector('.tag').textContent));
  console.log(tags.join(' | '));
  const tag = (n) => (tags.find(t => t.startsWith(n + ':')) || '').slice(n.length + 2);
  check(tags.every(t => !/: ·|· $|^[^:]*: $/.test(t)), 'every item has a tag, with no stray dots');
  check(tag('Full Tonic') === 'Full heal · 1200 coins' && tag('Tonic') === 'Restores PP · 300 coins' && tag('Cure Herb') === 'Cures status · 100 coins' && tag('Revive') === 'Revives · 900 coins' && tag('Moon Shard') === 'Evolves some creatures', 'Full Tonic, Tonic, Cure Herb, Revive and the shards say what they do');
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
  // the nav bar on phones: every link and the Light / dark button on the screen
  for (const w of [320, 375, 414]) {
    await ph.setViewportSize({ width: w, height: 800 }); await ph.waitForTimeout(150);
    const nav = await ph.evaluate(() => { const r = (el) => el.getBoundingClientRect(); const all = [...document.querySelectorAll('nav.bar a, nav.bar button')]; return { off: all.filter(el => r(el).left < 0 || r(el).right > window.innerWidth).map(el => el.textContent), page: document.documentElement.scrollWidth > window.innerWidth }; });
    check(!nav.off.length && !nav.page, 'phone ' + w + ' px: the whole nav bar is on the screen' + (nav.off.length ? ' (off: ' + nav.off.join(', ') + ')' : ''));
  }
  console.log(errs.join('\n') || (fails.length ? fails.length + ' checks failed' : 'no errors'));
  await b.close();
})();
