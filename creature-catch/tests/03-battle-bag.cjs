// The Bag in battle: cubes and items, a Potion in battle, catching.
//   node tests/03-battle-bag.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const out = OUT;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME);
  await p.waitForTimeout(1800);
  const shot = (n) => p.screenshot({ path: `${out}/03-${n}.png` });
  const top = () => p.evaluate(() => __cc.stack.map(x => x.name || '?').join('>'));
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(110); };
  // press A until the top screen is `name`
  const until = async (name, max = 60) => { for (let i = 0; i < max; i++) { if ((await top()).endsWith(name)) return true; await tap('KeyZ'); await p.waitForTimeout(60); } console.log('never reached', name, await top()); return false; };
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.push(C.world); C.runCodes('STARTER EMBROAK; TEAM EMBROAK 9 TUFTAIL 5'); C.state.bag.potion = 3; C.state.bag.tonic = 2; C.state.bag.cube = 5; C.state.party[0].hp = 10; C.state.party[0].moves.forEach(m => m.pp = 1); C.dev.noWild = true; C.world.enter('grassland', 12, 12, 'down');
    C.world.run(() => C.fight({ wild: C.mon.make('clovermouse', 4) })); });
  await until('action');
  await tap('ArrowRight'); await tap('KeyZ'); await p.waitForTimeout(200); console.log('bag:', await top()); await shot('c01-bag');
  await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(200); await shot('c02-items'); console.log('items:', await top());
  await tap('KeyZ'); await p.waitForTimeout(250); console.log('party pick:', await top()); await tap('KeyZ'); // potion on Embroak
  await p.waitForTimeout(1500); await shot('c03-potion-used');
  console.log('hp after potion', await p.evaluate(() => __cc.state.party[0].hp), 'bag', await p.evaluate(() => JSON.stringify(__cc.state.bag)));
  await until('action');
  // Tonic on Embroak (PP)
  await tap('ArrowRight'); await tap('KeyZ'); await p.waitForTimeout(150); await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(150);
  await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(200); await tap('KeyZ'); await p.waitForTimeout(1500);
  console.log('pp after tonic', await p.evaluate(() => __cc.state.party[0].moves.map(m => m.pp).join(',')));
  await until('action');
  // swap to Tuftail (so both fight), then throw a cube
  await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(250); await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(250); await tap('KeyZ'); await p.waitForTimeout(400);
  await until('action');
  await p.evaluate(() => { __cc.dev.catchAll = true; });
  await tap('ArrowRight'); await tap('KeyZ'); await p.waitForTimeout(150); await tap('KeyZ'); await p.waitForTimeout(150); await tap('KeyZ');
  const xp0 = await p.evaluate(() => __cc.state.party.map(m => m.xp + '/' + m.lv).join(' '));
  for (let i = 0; i < 80; i++) { const t = await top(); if (t.includes('statpanel')) { await shot('c04-statpanel'); } if (!t.includes('?') && (await p.evaluate(() => !__cc.world.busy))) break; await tap('KeyZ'); await p.waitForTimeout(80); }
  console.log('xp before', xp0, 'after', await p.evaluate(() => __cc.state.party.map(m => m.id + ' ' + m.xp + '/' + m.lv).join(' | ')));
  // faint dissolve: a wild that we knock out
  await p.evaluate(() => { const C = __cc; C.dev.oneHit = true; C.state.party[0].moves.forEach(m => m.pp = 20); C.world.run(() => C.fight({ wild: C.mon.make('hopsprout', 3) })); });
  await until('action'); await tap('KeyZ'); await p.waitForTimeout(150); await tap('KeyZ');
  for (let i = 0; i < 30; i++) { const d = await p.evaluate(() => { const B = __cc.currentBattle(); return B && B.foe && B.foe.dissolve; }); if (d > 0.3) { await shot('c05-dissolve'); break; } await p.waitForTimeout(60); }
  await p.waitForTimeout(300);
  console.log('music', await p.evaluate(() => __cc.music.current()));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
