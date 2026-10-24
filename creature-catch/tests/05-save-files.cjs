// A family creature in battle, ZOO, the Creature Log, and the three save files (Continue, the file picker, New Game).
//   node tests/05-save-files.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  const shot = (n) => p.screenshot({ path: shotPath(`05-${n}.png`) });
  const top = () => p.evaluate(() => __cc.stack.map(x => x.name || '?').join('>'));
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(110); };
  // family creature in a wild battle, evolve via level
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.push(C.world); C.runCodes('STARTER EMBROAK; GIVE MYSTERYPOP 21'); C.dev.noWild = true; C.world.enter('grassland', 12, 12, 'down'); });
  console.log(await p.evaluate(() => JSON.stringify({ party: __cc.state.party.map(m => m.id + ' ' + m.lv + ' ' + m.moves.map(x => x.id).join('/')), spawns: __cc.SPAWNS.grassland.common, spire: __cc.SPAWNS.spire.rare, n: __cc.CREATURE_ORDER.length })));
  await p.evaluate(() => { __cc.runCodes('ZOO'); }); await p.waitForTimeout(600); console.log('zoo', await top()); await shot('f01-zoo');
  await tap('KeyX'); await p.waitForTimeout(200);
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.push(C.world); C.world.busy = false; C.state.caught.mysterypop = 1; C.state.caught.puppop = 1; C.world.run(() => C.creatureLog()); });
  await p.waitForTimeout(300); for (let i = 0; i < 118; i++) await p.keyboard.press('ArrowDown'); // ? Pop is No. 119 await p.waitForTimeout(400); await shot('f02-log');
  await tap('KeyX'); await p.waitForTimeout(200);
  // save files
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.push(C.world); C.world.busy = false; localStorage.clear(); C.slot = 2; C.saveGame(); C.slot = 3; C.state.party = []; C.state.map = 'forest'; C.saveGame(); });
  await p.reload(); await p.waitForTimeout(1800); await tap('KeyZ'); await p.waitForTimeout(500); console.log('after continue', await top()); await shot('f03-files');
  await tap('ArrowUp'); await tap('KeyZ'); await p.waitForTimeout(300); await shot('f04-file-menu'); await tap('KeyZ'); await p.waitForTimeout(800);
  console.log('loaded slot', await p.evaluate(() => __cc.slot + ' ' + __cc.state.map + ' ' + __cc.state.party.length));
  await p.reload(); await p.waitForTimeout(1800); await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(400); await shot('f05-new-files'); console.log('new picker', await top());
  await tap('KeyZ'); await p.waitForTimeout(300); console.log('after pick empty', await top());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
