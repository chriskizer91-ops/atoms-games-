// The v11 creatures: evolving and the moves they pick up, the Moon Shard on Glimstar, Runescroll at the Archive wall, a battle and the Log.
//   node tests/10-final-creatures.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(110); };
  const mash = async (max = 300) => { for (let i = 0; i < max; i++) { const st = await p.evaluate(() => ({ busy: __cc.world.busy, n: __cc.stack.length })); if (!st.busy && st.n === 1) return i; await tap('KeyZ'); } return -1; };
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.runCodes('STARTER EMBROAK; MAX; GOD; ONEHIT; CATCHALL; STOCKUP'); C.dev.noWild = true; });
  // 1. who turns up wild: Frostpeak (both ice cream forms), the Night Ruins (Crescub and Moonlynx), the Spire, the Hollow Deep
  console.log(await p.evaluate(() => {
    const C = __cc, out = {};
    for (const k of ['snow', 'ruins', 'spire', 'hollow', 'temple']) {
      const seen = {}; for (let i = 0; i < 6000; i++) { const s = C.rollSpawn(k); if (s && s.id) seen[s.id + '@' + s.level] = 1; }
      const want = { snow: ['mysterypop', 'puppop'], ruins: ['crescub', 'moonlynx'], spire: ['leviafin', 'cragmastiff', 'oakenowl', 'timberowl'], hollow: ['stalagwing'], temple: ['furnadillo', 'kilnadillo'] }[k];
      out[k] = want.map(id => id + ':' + Object.keys(seen).filter(x => x.split('@')[0] === id).map(x => +x.split('@')[1]).sort((a, b) => a - b).join(',')).join(' | ');
    }
    return JSON.stringify(out, null, 1);
  }));
  // 2. evolving in place: the new forms, the moves they pick up, and a Moon Shard on Glimstar
  console.log(await p.evaluate(() => {
    const C = __cc, r = [];
    for (const [id, lv] of [['clovermouse', 18], ['hopsprout', 20], ['mysterypop', 22], ['puppop', 30], ['cloudram', 36], ['crescub', 30], ['glyphling', 40], ['yetiny', 32]]) {
      const m = C.mon.make(id, lv); const can = C.mon.canEvolve(m); const learned = can ? C.mon.evolve(m) : [];
      r.push(id + '->' + m.id + (can ? '' : ' (no)') + ' learns ' + learned.map(x => C.MOVES[x].name).join('/'));
    }
    const g = C.mon.make('glimstar', 30); r.push('glimstar evo ' + JSON.stringify(C.CREATURES.glimstar.evo));
    return r.join('\n');
  }));
  // 3. the Archive's blank wall with one Runescroll
  await p.evaluate(() => { const C = __cc; C.state.flags.ilsaWall = true; C.state.party = [C.mon.make('runescroll', 40)]; C.world.enter('archive', 2, 5, 'up'); });
  await p.waitForTimeout(200);
  const said = []; await p.evaluate(() => { const C = __cc, s = C.say; window.__said = []; C.say = function (t) { window.__said.push(t); return s.apply(this, arguments); }; });
  await tap('KeyZ'); await mash(60);
  console.log('wall:', await p.evaluate(() => window.__said.join(' / ').slice(0, 300)), 'page 10:', await p.evaluate(() => __cc.hasPage(10)));
  // 4. a battle with a new creature on each side, for a look
  await p.evaluate(() => { const C = __cc; C.state.party = [C.mon.make('doggywoggy', 40), C.mon.make('clovetastical', 40)]; C.fight({ wild: C.mon.make('yetitan', 40), bg: 'snow' }); });
  await p.waitForTimeout(2500); await p.screenshot({ path: shotPath('10-v11-battle.png') });
  await mash(200);
  // 5. the Creature Log on the new ones
  await p.evaluate(() => { const C = __cc; C.runCodes('DEX'); C.state.caught.mysterypop = 1; C.creatureLog(); });
  await p.waitForTimeout(300);
  for (let i = 0; i < 118; i++) await tap('ArrowDown');
  await p.waitForTimeout(300); await p.screenshot({ path: shotPath('10-v11-log.png') });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
