// Polish: side walk frames, the menu, the Creature Log, VS intros, place signs, footprints, guides walking, the Bag.
//   node tests/04-polish.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const out = OUT;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  const shot = (n) => p.screenshot({ path: `${out}/04-${n}.png` });
  const tap = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(90); } };
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.push(C.world); C.runCodes('STARTER MOSSBACK; TEAM ELDEROAK 40 TUFTAIL 12; DAY; DEX'); C.state.caught = { mossback: 1, tuftail: 1, elderoak: 1, clovermouse: 1 }; C.dev.noWild = true; C.world.enter('grassland', 12, 12, 'down'); });
  await p.waitForTimeout(300);
  await p.keyboard.down('ArrowLeft'); for (let i = 0; i < 4; i++) { await p.waitForTimeout(80); await shot('e0' + i + '-walk'); } await p.keyboard.up('ArrowLeft');
  await p.waitForTimeout(200); await tap('Enter'); await p.waitForTimeout(300); await shot('e10-menu'); await tap('KeyX');
  await p.evaluate(() => { __cc.world.run(() => __cc.creatureLog()); }); await p.waitForTimeout(300); await tap('ArrowDown', 4); await shot('e11-log'); await tap('KeyX'); await p.waitForTimeout(200);
  for (const [kind, extra] of [['trainer', { trainer: { name: 'Scout Milo', art: 'trainer-1', team: [] } }], ['guide', { trainer: { name: 'Ranger Oakley', art: 'oakley', team: [] } }], ['rival', { trainer: { name: 'Juniper', art: 'juniper', team: [] } }], ['boss', { boss: true, wild: null }]]) {
    await p.evaluate(([kind, extra]) => { const C = __cc; if (kind === 'boss') extra.wild = C.mon.make('lunariond', 40); C.world.run(() => C.vsIntro(Object.assign({ vs: kind }, extra))); }, [kind, extra]);
    await p.waitForTimeout(1500); await shot('e2-vs-' + kind); await p.waitForTimeout(1000);
  }
  // guides walking in the spire + signs
  await p.evaluate(() => { __cc.world.enter('forest', 12, 3, 'down'); }); await p.waitForTimeout(500); await shot('e30-forest-sign');
  await p.evaluate(() => { __cc.world.enter('cave', 12, 20, 'down'); }); await p.waitForTimeout(500); await shot('e31-cave-sign');
  await p.waitForTimeout(2200); await shot('e32-cave-mushrooms');
  await p.evaluate(() => { __cc.world.enter('snow', 11, 20, 'up'); }); await p.waitForTimeout(2600);
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(700); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(150); await shot('e33-snow-prints');
  await p.evaluate(() => { __cc.world.enter('grassland', 4, 5, 'down'); }); await p.waitForTimeout(2600); await shot('e34-bramble-walk');
  await p.evaluate(() => { __cc.runCodes('ENDING'); __cc.world.enter('spire', 8, 6, 'up'); }); await p.waitForTimeout(2600); await shot('e35-spire-guides');
  // bag with mega potion icon
  await p.evaluate(() => { __cc.state.bag.megapotion = 3; __cc.world.run(() => __cc.bagScreen()); }); await p.waitForTimeout(300); await shot('e36-bag'); await tap('KeyX');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
