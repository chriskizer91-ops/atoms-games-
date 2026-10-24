// An old version's save loads in this one. Pass the old build's path (run-all.mjs pulls v8 and v10 from git).
//   node tests/09-old-save.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 960, height: 640 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + process.argv[2]); await p.waitForTimeout(1800);
  await p.evaluate(() => { const C = __cc; localStorage.clear(); C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world);
    C.runCodes('STARTER EMBROAK; TRIAL ALL; ENDING; GIVE TUFTAIL 20'); C.state.map = 'village'; C.state.x = 20; C.state.y = 11; C.slot = 1; C.saveGame(); });
  console.log('v8 saved', await p.evaluate(() => Object.keys(localStorage).join(',') + ' ' + (__cc.VERSION || '')));
  await p.goto(GAME); await p.waitForTimeout(1800);
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(150); };
  await tap('KeyZ'); await p.waitForTimeout(400); await tap('KeyZ'); await p.waitForTimeout(400); await tap('KeyZ'); await p.waitForTimeout(1000);
  console.log('v9 loaded', await p.evaluate(() => { const C = __cc, s = C.state; return JSON.stringify({ map: s.map, at: [s.x, s.y], stage: C.stage(), pages: C.pageCount(), party: s.party.map(m => m.id), npcs: (C.NPCS.village || []).length, hour: C.gameHour().toFixed(1) }); }));
  // walk around and open the menu, the bag, the log
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight']) { await p.keyboard.down(k); await p.waitForTimeout(300); await p.keyboard.up(k); await p.waitForTimeout(200); }
  await p.evaluate(() => { __cc.world.run(() => __cc.bagScreen()); }); await p.waitForTimeout(400); await tap('KeyX'); await p.waitForTimeout(300);
  await p.evaluate(() => { __cc.world.run(() => __cc.creatureLog()); }); await p.waitForTimeout(400); await p.screenshot({ path: shotPath('09-oldsave-log.png') }); await tap('KeyX');
  await p.evaluate(() => { __cc.world.run(() => __cc.flyScreen()); }); await p.waitForTimeout(500); await p.screenshot({ path: shotPath('09-oldsave-fly.png') }); await tap('KeyX');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
