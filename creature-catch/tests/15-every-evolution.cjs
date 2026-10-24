// Every creature with an evolution evolves through the real game: the level ones win a wild battle one XP short of
// their evolution level and answer Yes to the after-battle question; the shard ones use their shard from the Bag.
// Each one must become its evo.into, keep sensible HP and moves, be offered every move its new form brings, and be
// marked caught in the Creature Log. GOD and ONEHIT keep the battles short.
//   node tests/15-every-evolution.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME } = require('./lib.cjs');
const { chromium } = require('playwright');

// An in-page auto-presser: A on whatever screen is up, a damaging move in the Fight menu. It wraps say, yesNo,
// learnMove and evolveScene to log what happened.
const DRIVER = `(function () {
  const C = window.__cc;
  const d = window.__drv = { on: false, q: [], last: null, said: [], evoCalls: [], learned: [], asked: [] };
  const key = (code) => { dispatchEvent(new KeyboardEvent('keydown', { code })); dispatchEvent(new KeyboardEvent('keyup', { code })); };
  const say = C.say; C.say = function (t) { d.said.push(String(t)); return say.apply(this, arguments); };
  const yn = C.yesNo; C.yesNo = function (q) { d.asked.push(String(q)); return yn.apply(this, arguments); };
  const lm = C.learnMove; C.learnMove = function (m, mv) { d.learned.push(m.id + ':' + mv); return lm.apply(this, arguments); };
  const ev = C.evolveScene; C.evolveScene = function (m) {
    const rec = { from: m.id, hpBefore: m.hp, maxBefore: C.mon.maxHp(m) }; d.evoCalls.push(rec);
    return ev.apply(this, arguments).then(function (ok) { rec.ok = ok; rec.to = m.id; return ok; });
  };
  setInterval(function () {
    if (!d.on) return;
    const top = C.top();
    if (d.q.length) { key(d.q.shift()); return; }
    if (!top || top === C.world) return;
    if (top !== d.last) {
      d.last = top;
      if (top.name === 'fight') {
        const m = C.currentBattle().ally.mon, i = Math.max(0, m.moves.findIndex(function (x) { return C.MOVES[x.id].power && x.pp > 0; }));
        if (i & 1) d.q.push('ArrowRight'); if (i & 2) d.q.push('ArrowDown'); d.q.push('KeyZ'); return;
      }
    }
    key('KeyZ');
  }, 35);
})();`;

(async () => {
  const t0 = Date.now();
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 480, height: 320 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1500);
  await p.evaluate(() => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.runCodes('STARTER EMBROAK; GOD; ONEHIT'); C.dev.noWild = true; C.dev.speed = 16; });
  await p.addScriptTag({ content: DRIVER });
  const idle = async (ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(() => !__cc.world.busy && __cc.stack.length === 1 && !__drv.q.length)) return true; await p.waitForTimeout(100); } return false; };
  const ids = await p.evaluate(() => __cc.CREATURE_ORDER.filter(id => __cc.CREATURES[id].evo));
  let pass = 0; const failed = [];
  for (const id of ids) {
    const info = await p.evaluate((id) => {
      const C = __cc, c = C.CREATURES[id], d = __drv, e = c.evo;
      d.said = []; d.evoCalls = []; d.learned = []; d.asked = []; d.last = null;
      C.state.caught = {}; C.state.seen = {}; C.state.flags = { starter: 'embroak' };
      let m;
      if (typeof e.at === 'number') {
        m = C.mon.make(id, e.at - 1); m.xp = C.mon.xpFor(e.at) - 1;
        C.state.party = [m]; C.state.bag = { cube: 5 };
        d.on = true; C.world.run(() => C.fight({ wild: C.mon.make('clovermouse', 2) }));
      } else {
        m = C.mon.make(id, 25); C.state.party = [m]; C.state.bag = {}; C.state.bag[e.at] = 1;
        d.on = true; C.world.run(() => C.bagScreen());
      }
      return { at: e.at, into: e.into };
    }, id);
    const done = await idle();
    const r = await p.evaluate(({ id, info }) => {
      const C = __cc, d = __drv, m = C.state.party[0]; d.on = false;
      const max = C.mon.maxHp(m), mv = m.moves.map(x => x.id), bad = [];
      if (m.id !== info.into) bad.push('species ' + m.id);
      if (!C.state.caught[info.into]) bad.push('the Log does not mark it caught');
      if (!(m.hp > 0 && m.hp <= max)) bad.push('hp ' + m.hp + '/' + max);
      if (mv.length < 1 || mv.length > 4 || new Set(mv).size !== mv.length || mv.some(x => !C.MOVES[x])) bad.push('moves ' + mv.join(','));
      if (m.moves.some(x => x.pp > C.MOVES[x.id].pp)) bad.push('pp over max');
      if (typeof info.at === 'number') {
        if (m.lv !== info.at) bad.push('lv ' + m.lv);
        if (d.asked.filter(q => /ready to evolve/.test(q)).length !== 1) bad.push('asked ' + d.asked.length + ' times');
        if (m.evoAsk) bad.push('still flagged to be asked');
      } else if (C.state.bag[info.at]) bad.push('shard count ' + C.state.bag[info.at]);
      // every move of the new form at or below its level that the old form never had was offered
      const old = {}; C.CREATURES[id].learn.forEach(e => { old[e[1]] = 1; });
      const want = C.CREATURES[info.into].learn.filter(e => e[0] <= m.lv && !old[e[1]]).map(e => e[1]);
      const offered = d.learned.filter(x => x.startsWith(info.into + ':')).map(x => x.split(':')[1]);
      const missing = want.filter(x => !offered.includes(x));
      if (missing.length) bad.push('new-form moves not offered: ' + missing.join(','));
      const ev = d.evoCalls[0] || {};
      return { into: info.into, at: info.at, got: m.id, lv: m.lv, hp: ev.hpBefore + '/' + ev.maxBefore + '->' + m.hp + '/' + max, moves: mv.join(','), offered: offered.join(','), bad };
    }, { id, info });
    if (!done) r.bad.push('never went idle; top=' + await p.evaluate(() => (__cc.top() || {}).name));
    const ok = !r.bad.length; if (ok) pass++; else failed.push(id);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} -> ${r.into} @${r.at}: ${r.got} Lv${r.lv} hp ${r.hp} moves[${r.moves}] new[${r.offered}]${ok ? '' : ' | ' + r.bad.join('; ')}`);
    if (!done) await p.evaluate(() => { const C = __cc; __drv.on = false; C.stack.length = 0; C.push(C.world); C.world.busy = false; });
  }
  console.log(`\n${pass}/${ids.length} evolutions passed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (ids.length < 80) errs.push('only ' + ids.length + ' creatures with an evolution');
  if (failed.length) errs.push('FAILED: ' + failed.join(', '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
