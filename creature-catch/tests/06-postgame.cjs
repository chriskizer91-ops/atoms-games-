// The post-game arc, start to finish: Amani, the Dawn Temple mirrors, Solarion, the Ancient Door, Gloaming, the Dusk Bell, the Balance.
//   node tests/06-postgame.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  const shot = (n) => p.screenshot({ path: shotPath(`06-${n}.png`) });
  const top = () => p.evaluate(() => __cc.stack.map(x => x.name || '?').join('>'));
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(110); };
  let shots = 0, seen = {};
  // press A until the world is free again, snapping a picture the first time each kind of screen shows
  const mash = async (label, max = 400) => {
    for (let i = 0; i < max; i++) {
      const st = await p.evaluate(() => ({ busy: __cc.world.busy, n: __cc.stack.length, top: __cc.stack.map(x => x.name || '?').join('>') }));
      if (!st.busy && st.n === 1) return i;
      const k = label + ':' + st.top.split('>').slice(-2).join('>');
      if (!seen[k] && /still|battle|credits|prize|page/.test(st.top)) { seen[k] = 1; await p.waitForTimeout(500); await shot(String(++shots).padStart(2, '0') + '-' + label + '-' + st.top.split('>').pop()); }
      if (st.top.endsWith('credits')) { await p.keyboard.down('KeyZ'); await p.waitForTimeout(3000); await p.keyboard.up('KeyZ'); continue; }
      await tap('KeyZ');
    }
    console.log('mash gave up at', label, await top()); return -1;
  };
  const flags = () => p.evaluate(() => { const f = __cc.state.flags; return ['templeOpen', 'solarionCalm', 'sunEmber', 'solarionWaits', 'doorOpen', 'gloamingCalm', 'gloamingWaits', 'bellRings', 'balance', 'duskRecipe'].filter(k => f[k]).join(',') + ' pages ' + __cc.pageCount() + ' at ' + __cc.state.map + ' ' + __cc.state.x + ',' + __cc.state.y; });
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.runCodes('STARTER EMBROAK; MAX; GOD; ONEHIT; STOCKUP'); C.dev.noWild = true; C.dev.time = 'day'; });
  // 1. Amani at the oasis: with only 3 pages she sends you away; with 8 she opens the temple
  await p.evaluate(() => { const C = __cc; C.runCodes('ENDING; PAGES 3'); C.world.enter('desert', 16, 10, 'up'); C.world.busy = false; });
  await p.waitForTimeout(300); await tap('KeyZ'); await mash('amani3'); console.log('1a', await flags());
  await p.evaluate(() => { __cc.runCodes('PAGES 8'); }); await tap('KeyZ'); await mash('amani8'); console.log('1b', await flags());
  await shot('02-oasis-open');
  // 2. into the temple through the oasis
  await p.evaluate(() => { const C = __cc; C.world.enter('desert', 17, 9, 'up'); }); await p.waitForTimeout(200); await tap('KeyZ'); await mash('enter'); console.log('2', await flags());
  // 3. the three mirrors (A turns, yes each time)
  const mirror = async (x, y, dir, turns) => {
    for (let i = 0; i < turns; i++) { await p.evaluate(([x, y, dir]) => { const C = __cc; C.world.enter('temple', x, y, dir); }, [x, y, dir]); await p.waitForTimeout(150); await tap('KeyZ'); await mash('mirror'); }
  };
  await mirror(9, 24, 'left', 1); await mirror(5, 12, 'up', 2); await mirror(17, 5, 'right', 3);
  console.log('3 mirrors', await p.evaluate(() => [1, 2, 3].map(i => __cc.state.flags['mirror' + i]).join(',') + ' gates left ' + __cc.MAPS.temple.decor.filter(d => d.gate && d.solid !== false).length));
  await p.evaluate(() => { __cc.world.enter('temple', 11, 13, 'up'); }); await p.waitForTimeout(400); await shot('03-temple-beam');
  // 4. the Sun Altar: page 11, Solarion wakes, the Sun Ember
  await p.evaluate(() => { const C = __cc; C.world.enter('temple', 12, 3, 'up'); }); await p.waitForTimeout(200); await tap('KeyZ'); await mash('altar', 600); console.log('4', await flags());
  // 5. the old door in the mine
  await p.evaluate(() => { const C = __cc; C.world.enter('mine', 12, 3, 'up'); }); await p.waitForTimeout(200); await tap('KeyZ'); await mash('door'); console.log('5', await flags());
  await shot('05-door-open');
  await tap('KeyZ'); await mash('down'); console.log('5b', await flags());
  // 6. Gloaming at the Dusk Pool
  await p.evaluate(() => { const C = __cc; C.world.enter('hollow', 12, 20, 'down'); }); await p.waitForTimeout(200);
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(260); await p.keyboard.up('ArrowDown'); await mash('gloaming', 700); console.log('6', await flags());
  // 7. the Dusk Bell rings when you come back to Copperbell
  await p.evaluate(() => { const C = __cc; C.world.enter('cave', 11, 0, 'up'); C.state.flags.seenCopperbell = true; }); await p.waitForTimeout(200);
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(200); await p.keyboard.up('ArrowUp'); await mash('bell'); console.log('7', await flags());
  // 8. the Balance at the top of the Spire
  await p.evaluate(() => { const C = __cc; C.world.enter('spire', 8, 6, 'up'); }); await p.waitForTimeout(200);
  for (let i = 0; i < 3; i++) { await p.keyboard.down('ArrowUp'); await p.waitForTimeout(260); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(150); }
  await mash('balance', 900); console.log('8', await flags(), await p.evaluate(() => 'dusk cubes on sale: ' + !!__cc.state.flags.duskRecipe + ' title ' + !!__cc.state.flags.keeperTitle));
  await shot('09-home');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
