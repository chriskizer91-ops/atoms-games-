// Who turns up wild where the v11 creatures live (both ice cream forms in Frostpeak, Crescub and Moonlynx, the Spire).
//   node tests/11-final-spawns.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  await p.goto(GAME); await p.waitForTimeout(1800);
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); });
  const res = await p.evaluate(() => {
    const C = __cc, out = [];
    const want = { snow: ['mysterypop', 'puppop', 'doggywoggy'], ruins: ['crescub', 'moonlynx'], spire: ['leviafin', 'surgefin', 'cragmastiff', 'oakenowl', 'timberowl'], hollow: ['stalagwing', 'stalagbat'], temple: ['furnadillo', 'kilnadillo'], springs: ['yetiny', 'yetitan', 'sleetle'] };
    for (const k of Object.keys(want)) {
      const seen = {}; for (let i = 0; i < 8000; i++) { const s = C.rollSpawn(k); (seen[s.id] = seen[s.id] || new Set()).add(s.lv); }
      out.push(k + ': ' + want[k].map(id => id + ' ' + (seen[id] ? [...seen[id]].sort((a, b) => a - b).join(',') : '-')).join(' | '));
    }
    return out.join('\n');
  });
  console.log(res);
  const line = (k) => res.split('\n').find(l => l.startsWith(k + ':')) || '';
  check(/mysterypop 20,21 \| puppop 22,23 \| doggywoggy -/.test(line('snow')), 'Frostpeak: ? Pop at Lv 20 and 21, Pup Pop at 22 and 23, no wild Doggy Woggy');
  check(/crescub 28,29 \| moonlynx 30,31/.test(line('ruins')), 'the Night Ruins: Crescub at Lv 28 and 29, Moonlynx at 30 and 31');
  check(/surgefin -/.test(line('spire')) && /timberowl 38,39/.test(line('spire')) && /cragmastiff 38/.test(line('spire')), 'the Spire: Leviafin and Cragmastiff, never Surgefin, Timberowl only below Lv 40');
  check(/furnadillo 40/.test(line('temple')) && /kilnadillo -/.test(line('temple')) && /stalagbat -/.test(line('hollow')), 'the Dawn Temple and the Hollow Deep: only the evolved forms');
  console.log(errs.join('\n') || (fails.length ? fails.length + ' checks failed' : 'no errors')); await b.close();
})();
