// The core loop: starter, a catch, the first trial, evolving, a blackout and saving.
//   node tests/01-core-flows.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || OUT;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 720, height: 480 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME);
  let n = 0; const shot = async (name) => { await p.screenshot({ path: `${out}/01-${String(++n).padStart(2, '0')}-${name}.png` }); };
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(40); };
  const info = () => p.evaluate(() => { const t = __cc.top(); const B = __cc.currentBattle(); return { name: t && t.name, world: t === __cc.world, busy: __cc.world.busy, battle: !!B, foeHp: B && B.foe.mon ? B.foe.mon.hp / __cc.mon.maxHp(B.foe.mon) : null }; });
  // plays until done() is true. policy: 'attack' uses the strongest move; 'catch' weakens then throws cubes
  async function play(policy, done, maxMs = 60000, shotsAt = []) {
    const t0 = Date.now(); let k = 0;
    while (Date.now() - t0 < maxMs) {
      const s = await info();
      if (await done(s)) return true;
      if (shotsAt.length && Date.now() - t0 > shotsAt[0]) { shotsAt.shift(); await shot('flow' + k++); }
      if (s.name === 'action') {
        if (policy === 'catch' && s.foeHp < 0.55) { await tap('ArrowRight'); await tap('KeyZ'); }
        else await tap('KeyZ');
      } else if (s.name === 'fight') {
        // pick the move with the best power x type (from the page)
        const idx = await p.evaluate(() => { const B = __cc.currentBattle(); let best = 0, bs = -1; B.ally.mon.moves.forEach((x, i) => { const m = __cc.MOVES[x.id]; if (x.pp <= 0) return; const sc = (m.power || 5) * (m.type ? __cc.typeMult(m.type, __cc.mon.sp(B.foe.mon).types) : 1); if (sc > bs) { bs = sc; best = i; } }); return best; });
        if (policy === 'catch' && (await info()).foeHp < 0.8) { // gentle hits while catching
          const weak = await p.evaluate(() => __cc.currentBattle().ally.mon.moves.findIndex(x => x.id === 'tackle'));
          if (weak >= 0) { if (weak & 1) await tap('ArrowRight'); if (weak & 2) await tap('ArrowDown'); await tap('KeyZ'); continue; }
        }
        if (idx & 1) await tap('ArrowRight'); if (idx & 2) await tap('ArrowDown'); await tap('KeyZ');
      } else await tap('KeyZ');
      await p.waitForTimeout(90);
    }
    return false;
  }
  const idle = (s) => s.world && !s.busy;
  await p.waitForTimeout(800); await tap('KeyZ'); await p.waitForTimeout(400);
  await play('attack', idle, 8000);

  // ---- S1: catch in the meadow
  await p.evaluate(() => { const C = __cc; C.state.party = [C.mon.make('embroak', 8)]; C.state.bag.cube = 10; C.state.flags.starter = 'embroak'; C.world.enter('meadow', 3, 6, 'up'); C.world.run(() => C.wildEncounter('meadow')); });
  let ok = await play('catch', idle, 60000, [2500, 5000, 9000]);
  console.log('S1 catch', ok, JSON.stringify(await p.evaluate(() => ({ party: __cc.state.party.map(m => m.id + ':' + m.lv), cubes: __cc.state.bag.cube, caught: Object.keys(__cc.state.caught) }))));

  // ---- S2: Bramble's trial, then the open log
  await p.evaluate(() => { const C = __cc; C.state.party = [C.mon.make('embroak', 11), C.mon.make('tuftail', 9)]; C.world.enter('grassland', 12, 2, 'up'); });
  await tap('KeyZ');
  ok = await play('attack', s => idle(s), 90000, [6000, 14000, 30000]);
  console.log('S2 trial', ok, JSON.stringify(await p.evaluate(() => ({ flags: __cc.state.flags, coins: __cc.state.coins, party: __cc.state.party.map(m => m.id + ':' + m.lv + ':' + m.hp) }))));
  await shot('log-open');
  await p.evaluate(() => { __cc.world.enter('grassland', 11, 1, 'up'); });
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(700); await p.keyboard.up('ArrowUp');
  await p.waitForTimeout(500); await shot('forest-gate');
  await play('attack', idle, 8000);

  // ---- S3: evolution after a level up
  await p.evaluate(() => { const C = __cc; const t = C.mon.make('tuftail', 17); t.xp = C.mon.xpFor(18) - 1; C.state.party = [t]; C.startBattle({ wild: C.mon.make('clovermouse', 4) }); });
  ok = await play('attack', s => !s.battle && s.world && !s.busy && s.name !== 'say', 60000, [9000, 11000, 13000, 15000]);
  await play('attack', idle, 15000);
  console.log('S3 evolve', JSON.stringify(await p.evaluate(() => __cc.state.party.map(m => m.id + ':' + m.lv + ' ' + m.moves.map(x => x.id).join(',')))));

  // ---- S4: party full -> vault, and the hut vault menu
  await p.evaluate(() => { const C = __cc; C.state.party = ['embroak', 'tuftail', 'pebblepup', 'bumblop'].map(id => C.mon.make(id, 10)); C.state.vault = []; C.state.bag.cube = 20; C.dev.catchAll = true; C.world.enter('meadow', 3, 6, 'up'); C.world.run(() => C.wildEncounter('meadow')); });
  ok = await play('catch', idle, 60000);
  await p.evaluate(() => { __cc.dev.catchAll = false; }); // the catch is sure, so the Vault has one to swap
  console.log('S4 vault', JSON.stringify(await p.evaluate(() => ({ party: __cc.state.party.length, vault: __cc.state.vault.map(m => m.id) }))));
  await p.evaluate(() => { __cc.world.enter('hut-in', 5, 4, 'up'); }); await tap('KeyZ'); await p.waitForTimeout(1200); await tap('KeyZ'); await p.waitForTimeout(300);
  await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(300); await shot('vault-menu'); await tap('KeyZ'); await p.waitForTimeout(300); await shot('vault-list');
  await tap('KeyZ'); await p.waitForTimeout(300); await shot('vault-action'); // Swap in / Summary / Back
  await tap('KeyZ'); await p.waitForTimeout(400); await shot('vault-swap'); await tap('KeyZ'); await p.waitForTimeout(300);
  await play('attack', s => s.name === 'menu', 4000);
  console.log('S4b swap', JSON.stringify(await p.evaluate(() => ({ party: __cc.state.party.map(m => m.id), vault: __cc.state.vault.map(m => m.id) }))));
  for (let i = 0; i < 6; i++) { await tap('KeyX'); await p.waitForTimeout(150); }
  await play('attack', idle, 6000);

  // ---- S5: lose a wild battle -> back at the hut
  await p.evaluate(() => { const C = __cc; const m = C.mon.make('hopsprout', 2); m.hp = 1; C.state.party = [m]; C.state.lastHeal = { map: 'grassland', x: 18, y: 12 }; C.world.enter('meadow', 3, 6, 'up'); C.world.run(() => C.fight({ wild: C.mon.make('pebblepup', 7) })); });
  await play('attack', idle, 40000);
  console.log('S5 blackout', JSON.stringify(await p.evaluate(() => ({ map: __cc.state.map, x: __cc.state.x, y: __cc.state.y, hp: __cc.state.party[0].hp }))));
  await shot('after-blackout');

  // ---- S6: field menu, save, reload, continue
  await tap('Enter'); await p.waitForTimeout(300); await shot('field-menu');
  await tap('ArrowDown'); await tap('ArrowDown'); await tap('ArrowDown'); await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(300);
  await play('attack', s => s.name === 'menu', 5000); await tap('KeyZ'); await p.waitForTimeout(200);
  await play('attack', s => s.name === 'menu', 5000); await tap('KeyX'); await p.waitForTimeout(200);
  const saved = await p.evaluate(() => localStorage.getItem('creature-catch-save-1') !== null);
  await p.reload(); await p.waitForTimeout(1000); await shot('title-continue'); await tap('KeyZ'); await p.waitForTimeout(500); await tap('KeyZ'); await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(600);
  console.log('S6 save', saved, JSON.stringify(await p.evaluate(() => ({ map: __cc.state.map, party: __cc.state.party.map(m => m.id), top: __cc.top() === __cc.world }))));
  await shot('continued');
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
