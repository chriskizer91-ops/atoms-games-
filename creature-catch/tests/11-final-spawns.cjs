// Who turns up wild where the v11 creatures live (both ice cream forms in Frostpeak, Crescub and Moonlynx, the Spire).
//   node tests/11-final-spawns.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(GAME); await p.waitForTimeout(1800);
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); });
  console.log(await p.evaluate(() => {
    const C = __cc, out = [];
    const want = { snow: ['mysterypop', 'puppop', 'doggywoggy'], ruins: ['crescub', 'moonlynx'], spire: ['leviafin', 'surgefin', 'cragmastiff', 'oakenowl', 'timberowl'], hollow: ['stalagwing', 'stalagbat'], temple: ['furnadillo', 'kilnadillo'], springs: ['yetiny', 'yetitan', 'sleetle'] };
    for (const k of Object.keys(want)) {
      const seen = {}; for (let i = 0; i < 8000; i++) { const s = C.rollSpawn(k); (seen[s.id] = seen[s.id] || new Set()).add(s.lv); }
      out.push(k + ': ' + want[k].map(id => id + ' ' + (seen[id] ? [...seen[id]].sort((a, b) => a - b).join(',') : '-')).join(' | '));
    }
    return out.join('\n');
  }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
