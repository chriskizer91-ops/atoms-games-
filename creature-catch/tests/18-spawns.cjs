// Wild spawns in every place, by day and at night: the weights (CC.spawnTable) keep commons above uncommons above
// rares, every place has at least 3 creatures, rares stay rare but findable, the live roll (CC.rollSpawn) matches the
// table, a creature you've never met turns up twice as often, every form you can meet has a catch rarity, the
// Creature Log numbering is unchanged, and every field note fits the Log's page (4 lines).
//   node tests/18-spawns.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME } = require('./lib.cjs');
const { chromium } = require('playwright');
// the Creature Log order before the weighted spawns (v11): the first 30, and a checksum of all 175
const FIRST_30 = ['drizzlon', 'rapidrake', 'tsunadrake', 'mossback', 'thornshell', 'elderoak', 'embroak', 'cinderfrog', 'infernotoad', 'clovermouse',
  'clovetastical', 'hopsprout', 'hoppinpop', 'puffmunk', 'stashmunk', 'fleecling', 'cloudram', 'tempestram', 'tuftail', 'verdantail',
  'sylvantail', 'pebblepup', 'boulderhound', 'cragmastiff', 'bumblop', 'bumblazer', 'queenbuzz', 'dewt', 'monsoonewt', 'typhoonewt'];
const ORDER_SUM = 2557717106;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  await p.goto(GAME); await p.waitForTimeout(1800);
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.dev.noWild = true; });

  // ---- the tables: every place and time
  const tables = await p.evaluate(() => {
    const C = __cc, out = [];
    C.ZONES.forEach((z) => z.spawns.forEach((k) => [false, true].forEach((night) => {
      const t = C.spawnTable(k, night), sum = t.reduce((n, e) => n + e.w, 0);
      out.push({ k, night, list: t.map((e) => ({ id: e.id, tier: e.tier, pct: 100 * e.w / sum })) });
    })));
    return out;
  });
  const bad = { inv: [], few: [], rare: [] };
  let rmin = 100, rmax = 0;
  for (const t of tables) {
    const tag = t.k + (t.night ? ' at night' : ' by day'), by = (tier) => t.list.filter((e) => e.tier === tier).map((e) => e.pct);
    const c = by('common'), u = by('uncommon'), r = by('rare');
    if ((c.length && u.length && Math.min(...c) < Math.max(...u)) || (u.length && r.length && Math.min(...u) < Math.max(...r)) || (c.length && r.length && Math.min(...c) < Math.max(...r))) bad.inv.push(tag);
    if (t.list.length < 3) bad.few.push(tag + ' (' + t.list.length + ')');
    for (const x of r) { rmin = Math.min(rmin, x); rmax = Math.max(rmax, x); if (x < 3 || x > 9) bad.rare.push(tag + ' ' + x.toFixed(1)); }
  }
  console.log(tables.length + ' tables; rares ' + rmin.toFixed(1) + '% to ' + rmax.toFixed(1) + '%');
  check(tables.length >= 40, 'a table for every place, by day and at night');
  check(!bad.inv.length, 'no tier is likelier than the one above it' + (bad.inv.length ? ': ' + bad.inv.join(', ') : ''));
  check(!bad.few.length, 'at least 3 creatures everywhere, day and night' + (bad.few.length ? ': ' + bad.few.join(', ') : ''));
  check(!bad.rare.length, 'every rare is between 3% and 9%' + (bad.rare.length ? ': ' + bad.rare.join(', ') : ''));
  const copper = tables.filter((t) => t.k === 'copperbell').map((t) => t.list.map((e) => e.id).join(','));
  console.log('Copperbell', JSON.stringify(copper));
  check(copper[0] === 'dingdove,pebblepup,clovermouse' && copper[1] === 'rustcoon,pebblepup,clovermouse', 'Copperbell has Dingdove by day, Rustcoon at night, Pebblepup and Clovermouse');

  // ---- the live roll matches the table, once everything has been met (a seeded Math.random, so it never flakes)
  const live = await p.evaluate(() => {
    const C = __cc, real = Math.random; let s = 12345;
    Math.random = function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    C.CREATURE_ORDER.forEach((id) => { C.state.seen[id] = 1; });
    const N = 20000, worst = { gap: 0 }, levels = [];
    C.ZONES.forEach((z) => z.spawns.forEach((k) => ['day', 'night'].forEach((time) => {
      C.dev.time = time;
      const t = C.spawnTable(k, time === 'night'), sum = t.reduce((n, e) => n + e.w, 0), want = {}, got = {};
      // what each form should be: its entry's share, split over the levels it is that form at
      t.forEach((e) => { for (let lv = e.levels[0]; lv <= e.levels[1]; lv++) { const f = C.wildForm(e.id, lv); want[f] = (want[f] || 0) + 100 * e.w / sum / (e.levels[1] - e.levels[0] + 1); } });
      for (let i = 0; i < N; i++) {
        const r = C.rollSpawn(k); got[r.id] = (got[r.id] || 0) + 100 / N;
        const e = t.find((e) => e.forms.indexOf(r.id) >= 0);
        if (!e || r.lv < e.levels[0] || r.lv > e.levels[1]) levels.push(k + ' ' + r.id + ' Lv ' + r.lv);
      }
      Object.keys(Object.assign({}, want, got)).forEach((f) => { const gap = Math.abs((want[f] || 0) - (got[f] || 0)); if (gap > worst.gap) Object.assign(worst, { gap, k, time, f, want: want[f] || 0, got: got[f] || 0 }); });
    })));
    // two level ranges of their own: ? Pop at Lv 20 to 23 in Frostpeak, Crescub at Lv 28 to 31 in the Ruins
    const lv = {}; C.dev.time = 'day';
    for (const k of ['snow', 'ruins']) for (let i = 0; i < 6000; i++) { const r = C.rollSpawn(k); (lv[r.id] = lv[r.id] || {})[r.lv] = 1; }
    C.dev.time = null; Math.random = real;
    const keys = (id) => Object.keys(lv[id] || {}).map(Number).sort((a, b) => a - b).join(',');
    return { worst, levels: levels.slice(0, 5), nLevels: levels.length, mysterypop: keys('mysterypop'), puppop: keys('puppop'), crescub: keys('crescub'), moonlynx: keys('moonlynx'), pengloo: keys('pengloo') };
  });
  console.log('biggest gap between the roll and the table', JSON.stringify(live.worst));
  check(live.worst.gap < 2, 'over 20,000 rolls a place, every form turns up within 2 points of the table');
  check(!live.nLevels, 'every wild creature comes at a level its entry allows' + (live.nLevels ? ': ' + live.levels.join(', ') : ''));
  console.log('levels: ? Pop ' + live.mysterypop + ', Pup Pop ' + live.puppop + ', Pengloo ' + live.pengloo + ', Crescub ' + live.crescub + ', Moonlynx ' + live.moonlynx);
  check(live.mysterypop === '20,21' && live.puppop === '22,23' && live.pengloo === '20,21', '? Pop and Pengloo come at Lv 20 to 23, met as themselves at 20 and 21');
  check(live.crescub === '28,29' && live.moonlynx === '30,31', 'Crescub comes at Lv 28 to 31, met as itself at 28 and 29');

  // ---- the new-creature bonus: one you've never met counts double
  const bonus = await p.evaluate(() => {
    const C = __cc, real = Math.random; let s = 777;
    Math.random = function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const N = 20000, share = (k, id) => { let n = 0; for (let i = 0; i < N; i++) if (C.rollSpawn(k).id === id) n++; return 100 * n / N; };
    C.dev.time = 'day';
    C.CREATURE_ORDER.forEach((id) => { C.state.seen[id] = 1; });
    const seenAll = share('meadow', 'fleecling');
    delete C.state.seen.fleecling;
    const unseen = share('meadow', 'fleecling');
    // an evolved form you haven't met counts too: Pebblepup is met as Boulderhound from Lv 18 in Copperbell
    C.state.seen.fleecling = 1; delete C.state.seen.boulderhound;
    let pup = 0; for (let i = 0; i < N; i++) { const id = C.rollSpawn('copperbell').id; if (id === 'pebblepup' || id === 'boulderhound') pup++; }
    // a brand-new save: everything is new, so the odds are the table's again
    C.state.seen = {}; const fresh = share('meadow', 'fleecling');
    C.state.seen = {}; C.dev.time = null; Math.random = real;
    return { seenAll, unseen, pup: 100 * pup / N, fresh };
  });
  console.log('Fleecling in the Meadow by day: ' + bonus.seenAll.toFixed(1) + '% once met, ' + bonus.unseen.toFixed(1) + '% before, ' + bonus.fresh.toFixed(1) + '% on a new save; Copperbell Pebblepup line ' + bonus.pup.toFixed(1) + '% with Boulderhound unmet');
  check(Math.abs(bonus.seenAll - 200 / 27) < 1.5, 'once met, Fleecling is its table share (2 of 27)');
  check(Math.abs(bonus.unseen - 400 / 29) < 1.5, 'never met, Fleecling counts double (4 of 29)');
  check(Math.abs(bonus.pup - 2000 / 35) < 2, 'an unmet evolved form makes its entry count double too (20 of 35)');
  check(Math.abs(bonus.fresh - 200 / 27) < 1.5, 'on a new save everything counts double, so the odds are the table\'s');

  // ---- catch rarity, the Log's order, the field notes
  const data = await p.evaluate(async () => {
    const C = __cc, missing = [];
    C.ZONES.forEach((z) => z.spawns.forEach((k) => [false, true].forEach((night) => C.spawnTable(k, night).forEach((e) => e.forms.forEach((f) => { if (!C.RARITY[f] && missing.indexOf(f) < 0) missing.push(f); })))));
    const order = C.CREATURE_ORDER.join(','); let h = 0; for (const ch of order) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    await document.fonts.ready;
    const long = C.CREATURE_ORDER.map((id) => [id, C.wrap((C.LORE[id] || {}).note || '', 88, 8).length]).filter((x) => x[1] > 4);
    return { missing, rarity: ['moonlynx', 'lunarion', 'solarion', 'gloaming', 'puppop', 'thundarab', 'furnadillo', 'dingdove', 'scarecrowl'].map((id) => id + ' ' + C.RARITY[id]).join(', '),
      first30: C.CREATURE_ORDER.slice(0, 30), n: C.CREATURE_ORDER.length, sum: h, font: document.fonts.check('8px ' + C.FONT), long,
      kiln: C.LORE.kilnadillo.note, furna: C.LORE.furnadillo.note, moth: C.LORE.mothlight.note, owl: C.LORE.owlcorn.note };
  });
  console.log('catch rarity: ' + data.rarity);
  check(!data.missing.length, 'every form you can meet wild has a catch rarity' + (data.missing.length ? ': ' + data.missing.join(', ') : ''));
  check(/moonlynx veryrare/.test(data.rarity) && /lunarion veryrare/.test(data.rarity) && /puppop uncommon/.test(data.rarity) && /thundarab uncommon/.test(data.rarity), 'Moonlynx and the legends stay Very Rare; Pup Pop and Thundarab take their entry\'s tier');
  check(data.n === 175 && JSON.stringify(data.first30) === JSON.stringify(FIRST_30) && data.sum === ORDER_SUM, 'the Creature Log numbering is the same as before (' + data.n + ' creatures, checksum ' + data.sum + ')');
  check(data.font, 'the game font is loaded for measuring the notes');
  check(!data.long.length, 'every field note fits 4 lines on the Log page' + (data.long.length ? ': ' + data.long.map((x) => x[0] + ' ' + x[1]).join(', ') : ''));
  console.log('notes: ' + [data.kiln, data.furna, data.moth, data.owl].join(' / '));
  check(!/Dawn Temple/.test(data.kiln) && /Dawn Temple/.test(data.furna) && !/at night\.$/.test(data.moth) && !/dusk/.test(data.owl), 'the notes say where creatures really are (Furnadillo in the Dawn Temple, Mothlight any time in the Forest)');

  console.log(errs.join('\n') || (fails.length ? fails.length + ' checks failed' : 'no errors'));
  await b.close();
  process.exit(fails.length || errs.length ? 1 : 0);
})();
