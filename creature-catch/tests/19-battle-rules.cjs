// Battle rules: the XP rule (the level scale both ways, the rest of the team's share, which still learns moves and is
// asked to evolve), a creature that reached its level and fainted is asked after a later win, a double faint with
// nobody left is a loss, no battle starts when nobody can fight, Kiln Roll can miss, trainers don't pick moves that
// can't work, the catch rarity of a form met evolved, the Dusk Cube at dusk, the HP plates (nothing covers a name,
// for all 175 names) and the pixel digits in battle.
//   node tests/19-battle-rules.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, OUT } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  await p.goto(GAME); await p.waitForTimeout(1500);

  // The harness: CC.say is instant and logged; yes/no answers, the action, fight, party and menu screens are
  // scripted from queues (V.yes, V.plan, V.party, V.menu); Math.random can be pinned (V.rnd).
  await p.evaluate(() => {
    const C = __cc;
    const V = window.__V = { log: [], plan: [], yes: [], party: [], menu: [], rnd: null, panels: [], learned: [] };
    const R = Math.random; Math.random = () => (V.rnd == null ? R() : V.rnd);
    C.say = function (t) { V.log.push(String(t)); return Promise.resolve(); };
    C.statPanel = function (m) { V.panels.push(C.mon.name(m)); return Promise.resolve(); };
    C.yesNo = async (q) => { if (V.onAsk) V.onAsk(q); V.log.push('?' + q); const a = V.yes.length ? V.yes.shift() : false; V.log.push(a ? '>Yes' : '>No'); return a; };
    const lm = C.learnMove; C.learnMove = function (m, mv) { V.learned.push(C.mon.name(m) + ':' + mv); return lm.apply(this, arguments); };
    const push = C.push;
    C.push = function (scr) {
      if (scr && scr.update && ['action', 'fight', 'party', 'menu'].includes(scr.name)) {
        const up = scr.update; let keys = null;
        scr.update = function (dt) {
          if (keys === null) {
            if (scr.name === 'action') {
              if (V.onAction) V.onAction(C.currentBattle());
              const a = V.plan.length ? V.plan.shift() : { k: 'fight', m: 0 };
              V.cur = a;
              keys = { hold: [], bag: ['right', 'a'], swap: ['down', 'a'], run: ['right', 'down', 'a'] }[a.k] || ['a'];
            } else if (scr.name === 'fight') {
              const i = (V.cur && V.cur.m) || 0;
              keys = V.cur && V.cur.hold ? [] : [i & 1 ? 'right' : null, i & 2 ? 'down' : null, 'a'].filter(Boolean);
            } else {
              const q = scr.name === 'party' ? V.party : V.menu, i = q.length ? q.shift() : 0;
              keys = i < 0 ? ['b'] : Array(i).fill('down').concat(['a']);
            }
          }
          const k = keys.shift();
          if (k) C.input.pressed[k] = true;
          up.call(scr, dt);
          if (k) delete C.input.pressed[k];
        };
      }
      return push.call(C, scr);
    };
    C.stack.length = 0; C.state = C.newState(); C.world.enter('meadow', 7, 12, 'up'); C.push(C.world);
    C.runCodes('STARTER EMBROAK');
    C.dev.noWild = true; C.dev.speed = 20;
    C.state.lastHeal = { map: 'hut-in', x: 5, y: 4 };
    V.mk = (id, lv, extra, moves) => { const m = C.mon.make(id, lv); if (moves) m.moves = moves.map(x => ({ id: x, pp: C.MOVES[x].pp })); if (extra) Object.assign(m, extra); return m; };
    V.run = (fn) => new Promise(res => C.world.run(async () => { let r; try { r = await fn(); } catch (e) { V.log.push('THROW ' + e.message); } res(r); }));
    V.reset = () => { V.log.length = 0; V.panels.length = 0; V.learned.length = 0; V.plan = []; V.yes = []; V.party = []; V.menu = []; V.onAction = null; V.onAsk = null; V.rnd = null; C.dev.oneHit = false; C.dev.god = false; };
    V.gained = (name) => { const l = V.log.find(t => t.startsWith(name + ' gained ')); return l ? +l.match(/gained (\d+) XP/)[1] : null; };
    V.xpWorth = (foe, trainer) => Math.max(1, Math.floor(C.CREATURES[foe.id].xpYield * foe.lv / 5 * (trainer ? 1.5 : 1)));
  });

  // ---- 1. the XP rule
  const xp = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    const scale = (foeLv, lv) => Math.min(1.5, Math.max(0.5, 1 + 0.08 * (foeLv - lv)));
    // a stronger foe, with a creature on the bench
    V.reset(); C.dev.oneHit = true;
    let a = V.mk('embroak', 10, null, ['tackle']), bench = V.mk('tuftail', 10), foe = V.mk('pebblepup', 15);
    C.state.party = [a, bench];
    let xa = a.xp, xb = bench.xp;
    out.strongRes = await V.run(() => C.fight({ wild: foe }));
    let each = V.xpWorth(foe);
    out.strong = { got: V.gained('Embroak'), want: Math.max(1, Math.round(each * scale(15, 10))), base: each, benchGot: bench.xp - xb, benchWant: Math.max(1, Math.round(each * 0.5 * scale(15, 10))), benchLine: V.log.filter(t => /^Tuftail gained/.test(t)).length, rest: V.log.filter(t => t === 'The rest of your team gained XP too!').length };
    // a much weaker foe
    V.reset(); C.dev.oneHit = true;
    a = V.mk('embroak', 30, null, ['tackle']); bench = V.mk('tuftail', 12); foe = V.mk('pebblepup', 10);
    C.state.party = [a, bench]; xb = bench.xp;
    await V.run(() => C.fight({ wild: foe }));
    each = V.xpWorth(foe);
    out.weak = { got: V.gained('Embroak'), want: Math.max(1, Math.round(each * 0.5)), base: each, benchGot: bench.xp - xb, benchWant: Math.max(1, Math.round(each * 0.5 * scale(10, 12))) };
    // a trainer (x1.5), the same level: no scale
    V.reset(); C.dev.oneHit = true;
    a = V.mk('embroak', 20, null, ['tackle']); foe = V.mk('pebblepup', 20);
    C.state.party = [a];
    await V.run(() => C.fight({ noVs: true, trainer: { name: 'Tess', coins: 1, team: [foe] } }));
    out.trainer = { got: V.gained('Embroak'), want: V.xpWorth(foe, true), rest: V.log.filter(t => /rest of your team/.test(t)).length };
    // a fainted creature and a Lv 50 one on the bench get nothing
    V.reset(); C.dev.oneHit = true;
    a = V.mk('embroak', 20, null, ['tackle']); const down = V.mk('tuftail', 20, { hp: 0 }), top = V.mk('pebblepup', 50);
    C.state.party = [a, down, top]; const xd = down.xp, xt = top.xp;
    await V.run(() => C.fight({ wild: V.mk('pebblepup', 20) }));
    out.skip = { down: down.xp - xd, top: top.xp - xt, rest: V.log.filter(t => /rest of your team/.test(t)).length };
    // a Lv 50 creature fights: it takes nothing, but the rest of the team still learns from it
    V.reset(); C.dev.oneHit = true;
    a = V.mk('embroak', 50, null, ['tackle']); bench = V.mk('tuftail', 20); foe = V.mk('pebblepup', 25);
    C.state.party = [a, bench]; xb = bench.xp; const xa50 = a.xp;
    await V.run(() => C.fight({ wild: foe }));
    out.max = { aceGot: a.xp - xa50, benchGot: bench.xp - xb, benchWant: Math.max(1, Math.round(V.xpWorth(foe) * 0.5 * scale(25, 20))) };
    return out;
  });
  console.log('XP', JSON.stringify(xp));
  check(xp.strong.got === xp.strong.want && xp.strong.got > xp.strong.base, `a stronger foe gives more XP (${xp.strong.got} = ${xp.strong.base} x 1.4)`);
  check(xp.weak.got === xp.weak.want && xp.weak.got < xp.weak.base, `a much weaker foe gives less XP (${xp.weak.got} = ${xp.weak.base} x 0.5)`);
  check(xp.strong.benchGot === xp.strong.benchWant && xp.strong.benchGot > 0, `the creature on the bench gets half a share, scaled (${xp.strong.benchGot})`);
  check(xp.weak.benchGot === xp.weak.benchWant, `the bench share is scaled by its own level (${xp.weak.benchGot})`);
  check(xp.strong.rest === 1 && xp.strong.benchLine === 0, 'one line for the rest of the team, no "gained N XP" line for it');
  check(xp.trainer.got === xp.trainer.want && xp.trainer.rest === 0, `a trainer's creature still gives x1.5 (${xp.trainer.got})`);
  check(xp.skip.down === 0 && xp.skip.top === 0 && xp.skip.rest === 0, 'fainted and Lv 50 creatures on the bench get nothing');
  check(xp.max.aceGot === 0 && xp.max.benchGot === xp.max.benchWant, `a Lv 50 creature gets nothing, the rest of the team still gets its half share (${xp.max.benchGot})`);

  // ---- 2. the bench levels up quietly, learns its move and is asked to evolve
  const bench = await p.evaluate(async () => {
    const C = __cc, V = __V;
    // a creature that learns a move at its evolution level (if it already knows 4, it forgets its first one)
    const id = C.CREATURE_ORDER.find(id => { const c = C.CREATURES[id]; if (!c.evo || typeof c.evo.at !== 'number' || c.evo.at < 10) return false; const mv = c.learn.filter(e => e[0] === c.evo.at).map(e => e[1]); return mv.length && !mv.some(x => C.mon.movesAt(id, c.evo.at - 1).includes(x)); });
    const c = C.CREATURES[id], at = c.evo.at, move = c.learn.find(e => e[0] === at)[1];
    V.reset(); C.dev.oneHit = true; V.yes = [true]; V.menu = [0];
    const a = V.mk('infernotoad', at + 4, null, ['tackle']), m = V.mk(id, at - 1); m.xp = C.mon.xpFor(at) - 1; // a fighter with no evolution
    C.state.party = [a, m];
    let knows = null; V.onAsk = () => { knows = C.mon.knows(m, move); }; // before it evolves (and the new form's moves push it out)
    const res = await V.run(() => C.fight({ wild: V.mk('pebblepup', at) }));
    return { id, name: c.name, at, move, into: c.evo.into, res, now: m.id + ' Lv' + m.lv, knows, grew: V.log.includes(c.name + ' grew to Lv ' + at + '!'), panels: V.panels.slice(), asked: V.log.filter(t => /ready to evolve/.test(t)), learned: V.learned.slice(), flag: !!m.evoAsk, caught: !!C.state.caught[c.evo.into] };
  });
  console.log('bench', JSON.stringify(bench));
  check(bench.grew && bench.panels.indexOf(bench.name) < 0, `the bench ${bench.name} grows to Lv ${bench.at} with its level-up line but no stat panel`);
  check(bench.knows && bench.learned.includes(bench.name + ':' + bench.move), `the bench learns ${bench.move} through learnMove`);
  check(bench.asked.length === 1 && bench.now.startsWith(bench.into) && !bench.flag && bench.caught, `the bench is asked to evolve and becomes ${bench.into}`);

  // ---- 3. a creature that reached its level and then fainted is asked after a later win; No clears it
  const later = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    V.reset();
    const t = V.mk('tuftail', 17, null, ['tackle']); t.xp = C.mon.xpFor(18) - 1;
    const y = V.mk('infernotoad', 30, null, ['tackle']); // no evolution of its own to ask about
    C.state.party = [t, y];
    // Tuftail beats the first creature (and reaches Lv 18), the second knocks it out, Embroak finishes
    let n = 0;
    V.onAction = (B) => { n++; C.dev.oneHit = B.ally.mon === t ? B.foeIndex === 0 : true; C.dev.god = B.ally.mon === y; if (B.ally.mon === t && B.foeIndex === 1) t.hp = 1; };
    V.party = [1];
    const team = [V.mk('pebblepup', 5, null, ['tackle']), V.mk('pebblepup', 50, null, ['tackle'])];
    out.first = await V.run(() => C.startBattle({ trainer: { name: 'Tess', coins: 1, team } }));
    out.firstAsked = V.log.filter(x => /ready to evolve/.test(x)).length;
    out.after1 = { lv: t.lv, hp: t.hp, flag: !!t.evoAsk };
    // healed, then a win with no level-up: now it's asked; say No
    C.healParty(); V.reset(); C.dev.oneHit = true; V.yes = [false];
    C.state.party = [t];
    out.second = await V.run(() => C.startBattle({ wild: V.mk('pebblepup', 2) }));
    out.secondAsked = V.log.filter(x => /ready to evolve/.test(x));
    out.noLine = V.log.filter(x => /later from the party menu/.test(x));
    out.after2 = { id: t.id, lv: t.lv, flag: !!t.evoAsk };
    // another win: not asked again (it can still evolve from the party menu)
    V.reset(); C.dev.oneHit = true;
    out.third = await V.run(() => C.startBattle({ wild: V.mk('pebblepup', 2) }));
    out.thirdAsked = V.log.filter(x => /ready to evolve/.test(x)).length;
    out.canEvolve = C.mon.canEvolve(t);
    return out;
  });
  console.log('asked later', JSON.stringify(later));
  check(later.first === 'win' && later.after1.lv === 18 && later.after1.hp === 0 && later.firstAsked === 0 && later.after1.flag, 'a creature that reached Lv 18 and then fainted is not asked, and keeps its turn');
  check(later.second === 'win' && later.secondAsked.length === 1 && later.after2.id === 'tuftail' && !later.after2.flag, 'after a later win it is asked; No clears the question');
  check(later.noLine.length === 1 && /^Okay! You can evolve Tuftail later from the party menu\.$/.test(later.noLine[0]), 'the No line is gentle and true: ' + later.noLine[0]);
  check(later.thirdAsked === 0 && later.canEvolve, 'it is not asked again after the next win (the party menu can still evolve it)');

  // ---- 4. a double faint: with nobody left it's a loss (and you go back to heal); with a friend left it's a win
  const dbl = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    const snap = () => ({ map: C.state.map, hp: C.state.party.map(m => m.hp) });
    // your last creature knocks the foe out and faints from its own recoil
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('embroak', 20, { hp: 1 }, ['scarabcharge'])];
    out.ownRes = await V.run(() => C.fight({ wild: V.mk('pebblepup', 10, { hp: 2 }, ['growl']) }));
    out.own = snap(); out.ownLog = V.log.filter(t => /fainted|no creatures|Healing Hut/.test(t));
    // the foe knocks out your last creature and faints from its recoil
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('tuftail', 5, { hp: 1 }, ['growl'])];
    out.foeRes = await V.run(() => C.fight({ wild: V.mk('embroak', 30, { hp: 1 }, ['scarabcharge']) }));
    out.foeLog = V.log.filter(t => /fainted|no creatures/.test(t));
    // a guide's last creature: the trial isn't passed
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('embroak', 20, { hp: 1 }, ['scarabcharge'])];
    out.trainerRes = await V.run(() => C.fight({ noVs: true, trainer: { name: 'Tess', coins: 10, loseText: 'Good try!', team: [V.mk('pebblepup', 10, { hp: 2 }, ['growl'])] } }));
    // the same with a friend still standing: a win
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('embroak', 20, { hp: 1 }, ['scarabcharge']), V.mk('tuftail', 10)];
    out.friendRes = await V.run(() => C.fight({ wild: V.mk('pebblepup', 10, { hp: 2 }, ['growl']) }));
    out.friendLog = V.log.filter(t => /fainted/.test(t));
    return out;
  });
  console.log('double faint', JSON.stringify(dbl));
  check(dbl.ownRes === 'lose' && dbl.ownLog.includes('Embroak fainted!') && dbl.own.map === 'hut-in' && dbl.own.hp[0] > 0, 'own recoil on your last creature: it faints, the battle is lost, and you are healed at the Hut');
  check(dbl.foeRes === 'lose' && dbl.foeLog.includes('Tuftail fainted!'), 'the foe\'s recoil after it knocks out your last creature: your faint is shown and it is a loss');
  check(dbl.trainerRes === 'lose', 'a double faint against a trainer\'s last creature is a loss (no trial passed)');
  check(dbl.friendRes === 'win' && dbl.friendLog.includes('Embroak fainted!'), 'with a friend still standing it is a win, and the faint is shown');

  // ---- 5. nobody can fight: no battle starts
  const none = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('embroak', 20, { hp: 0 }), V.mk('tuftail', 10, { hp: 0 })];
    const depth = C.stack.length;
    const pr = C.startBattle({ trainer: { name: 'Tess', coins: 1, team: [V.mk('pebblepup', 10)] } });
    out.noScreen = C.stack.length === depth && !C.currentBattle();
    out.res = await pr;
    out.fight = await V.run(() => C.fight({ noVs: true, trainer: { name: 'Tess', coins: 1, team: [V.mk('pebblepup', 10)] } }));
    out.after = { map: C.state.map, hp: C.state.party.map(m => m.hp) };
    return out;
  });
  console.log('nobody can fight', JSON.stringify(none));
  check(none.res === 'lose' && none.noScreen, 'CC.startBattle with nobody able to fight resolves "lose" at once, with no battle screen');
  check(none.fight === 'lose' && none.after.map === 'hut-in' && none.after.hp.every(h => h > 0), 'CC.fight then sends you to the Healing Hut, healed');

  // ---- 6. accuracy: Kiln Roll (95) can miss; moves that only raise the user's stats can't
  const acc = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    async function one(move, rnd, accStage) {
      V.reset(); C.world.enter('meadow', 7, 12, 'up');
      C.state.party = [V.mk('embroak', 30, null, [move])];
      const foe = V.mk('pebblepup', 30, null, ['growl']), hp0 = foe.hp; let n = 0, line = null, hp1 = null;
      V.onAction = (B) => { n++; if (n === 1) { V.rnd = rnd; B.ally.st.acc = accStage || 0; } if (n === 2) { hp1 = foe.hp; line = V.log.filter(t => /Embroak used|missed|rose|won't/.test(t)).join(' / '); V.rnd = null; C.dev.oneHit = true; } };
      await V.run(() => C.fight({ wild: foe }));
      return { hit: hp1 < hp0, missed: /missed/.test(line), line };
    }
    out.kilnMiss = await one('kilnroll', 0.97);
    out.kilnHit = await one('kilnroll', 0.5);
    out.flareMiss = await one('flareburst', 0.97);
    const selfMove = Object.keys(C.MOVES).find(k => !C.MOVES[k].power && (C.MOVES[k].fx || {}).self);
    out.self = Object.assign({ move: selfMove }, await one(selfMove, 0.99, -3));
    return out;
  });
  console.log('accuracy', JSON.stringify(acc));
  check(acc.kilnMiss.missed && !acc.kilnMiss.hit, 'Kiln Roll misses on a roll of 97 (accuracy 95)');
  check(acc.kilnHit.hit && !acc.kilnHit.missed, 'Kiln Roll hits on a roll of 50');
  check(acc.flareMiss.missed, 'a plain attack misses the same way');
  check(!acc.self.missed && /rose|won't/.test(acc.self.line), `${acc.self.move} (raises its own stat) never misses, even at accuracy -3`);

  // ---- 7. trainers don't pick a status move on a creature that already has one, or a stat move at its limit
  const ai = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    async function run(foeMoves, setup, turns, rnd) {
      V.reset(); C.world.enter('meadow', 7, 12, 'up');
      const me = V.mk('drizzlon', 30, null, ['growl', 'tackle']); C.state.party = [me];
      let n = 0;
      V.onAction = (B) => { n++; if (n === 1) setup(B, me); V.rnd = rnd; C.dev.god = true; if (n > turns) { V.rnd = null; C.dev.oneHit = true; V.plan = [{ k: 'fight', m: 1 }]; } };
      V.plan = Array(turns).fill({ k: 'fight', m: 0 });
      await V.run(() => C.fight({ noVs: true, trainer: { name: 'Tess', coins: 1, team: [V.mk('embroak', 30, null, foeMoves)] } }));
      return V.log.filter(t => /^Tess's Embroak used/.test(t)).map(t => t.replace('Tess\'s Embroak used ', '').replace('!', ''));
    }
    out.names = { venommist: C.MOVES.venommist.name, growl: C.MOVES.growl.name, guardup: C.MOVES.guardup.name };
    out.poisoned = await run(['venommist', 'embertap'], (B, me) => { me.status = 'poison'; }, 6, null);
    out.atkDown = await run(['growl', 'embertap'], (B) => { B.ally.st.atk = -3; }, 6, null);
    out.defUp = await run(['guardup', 'embertap'], (B) => { B.foe.st.def = 3; }, 6, null);
    out.fresh = await run(['venommist', 'embertap'], () => {}, 1, 0.5);
    return out;
  });
  console.log('AI', JSON.stringify(ai));
  check(ai.poisoned.length >= 6 && ai.poisoned.every(m => m !== ai.names.venommist), 'no Venom Mist on a creature that is already poisoned');
  check(ai.atkDown.length >= 6 && ai.atkDown.every(m => m !== ai.names.growl), 'no Growl when your Attack is already at -3');
  check(ai.defUp.length >= 6 && ai.defUp.every(m => m !== ai.names.guardup), 'no Guard Up when its own Defense is already at +3');
  check(ai.fresh[0] === ai.names.venommist, 'a status move is still picked when it can work');

  // ---- 8. catch rarity: a form met already evolved uses its earlier form's rarity; Moonlynx and the legends keep theirs
  const cat = await p.evaluate(async () => {
    const C = __cc, V = __V, out = {};
    out.leviafin = [C.RARITY.leviafin || null, C.rarityOf('leviafin')];
    out.puppop = [C.RARITY.puppop || null, C.rarityOf('puppop')];
    out.moonlynx = C.rarityOf('moonlynx'); out.solarion = C.rarityOf('solarion'); out.lunarion = C.rarityOf('lunarion');
    out.missing = C.CREATURE_ORDER.filter(id => !C.rarityOf(id));
    // a full-HP Leviafin and a Basic Cube: 25 (common, from Surgefin) + 0; a roll of 12 catches it
    async function throwAt(id, lv, cube, rnd) {
      V.reset(); C.world.enter('meadow', 7, 12, 'up');
      C.state.party = [V.mk('embroak', 40, null, ['tackle'])]; C.state.bag[cube] = 3;
      let n = 0; V.onAction = () => { V.rnd = n++ ? null : rnd; }; V.plan = [{ k: 'bag' }, { k: 'run' }, { k: 'run' }, { k: 'run' }]; V.menu = [0, C.CUBE_KINDS.filter(k => C.state.bag[k] > 0).indexOf(cube)];
      return V.run(() => C.startBattle({ wild: V.mk(id, lv) }));
    }
    out.leviafinCatch = await throwAt('leviafin', 40, 'cube', 0.12);
    out.threw = V.log.find(t => /You threw/.test(t));
    out.ultra = await throwAt('pebblepup', 10, 'ultra', 0.99); out.threwUltra = V.log.find(t => /You threw/.test(t));
    // the Dusk Cube at 17:30 (the light is warming, but isNight() is still false): +30 instead of the daytime +5. A roll
    // between the two catches a full-HP creature only with the dusk odds
    const RB = { common: 25, uncommon: 10, rare: -5, veryrare: -15 }, pb = RB[C.rarityOf('pebblepup')] || 0, mid = (pb + 5 + pb + 30) / 200;
    C.opts.daynight = 'clock'; C.dev.time = null;
    C.state.clockShift = 17.5 - (new Date().getHours() + new Date().getMinutes() / 60);
    out.duskAt = { night: C.daylight().night, isNight: C.isNight() };
    out.duskCatch = await throwAt('pebblepup', 10, 'dusk', mid);
    C.state.clockShift = 12 - (new Date().getHours() + new Date().getMinutes() / 60);
    out.dayCatch = await throwAt('pebblepup', 10, 'dusk', mid);
    C.state.clockShift = 0; C.opts.daynight = 'day';
    return out;
  });
  console.log('catching', JSON.stringify(cat));
  check(!cat.leviafin[0] && cat.leviafin[1] === 'common' && cat.puppop[1] === 'uncommon', 'Leviafin and Pup Pop (met evolved) use Surgefin\'s and ? Pop\'s rarity');
  check(cat.moonlynx === 'veryrare' && cat.solarion === 'veryrare' && cat.lunarion === 'veryrare', 'Moonlynx and the legends stay very rare');
  check(cat.leviafinCatch === 'caught', 'a Basic Cube catches a full-HP Leviafin on a roll of 12 (the common bonus counts)');
  check(cat.threwUltra === 'You threw an Ultra Cube!' && cat.threw === 'You threw a Basic Cube!', 'an Ultra Cube, a Basic Cube');
  check(cat.duskAt.night > 0 && !cat.duskAt.isNight && cat.duskCatch === 'caught' && cat.dayCatch !== 'caught', 'the Dusk Cube has its dusk odds at 17:30, and not at noon');
  console.log('no rarity at all (never met wild):', cat.missing.join(', '));

  // ---- 9. the HP plates: nothing covers a name, for all 175 names, both plates, with and without a status and the cube
  const plates = await p.evaluate(async () => {
    const C = __cc, V = __V, g = C.g;
    V.reset(); C.world.enter('meadow', 7, 12, 'up');
    C.state.party = [V.mk('embroak', 50, null, ['tackle'])];
    V.plan = [{ k: 'hold' }];
    V.run(() => C.startBattle({ wild: V.mk('pebblepup', 50) }));
    await C.until(() => C.top() && C.top().name === 'action');
    const B = C.currentBattle(), scr = C.stack.find(s => s !== C.world && s.opaque && !s.name);
    // record what each draw call covers (x0..x1, y0..y1)
    let rec = null, clip = null, lastRect = null;
    const real = { text: C.text, num: C.num, cube: C.drawCube, tag: C.statusTag, bar: C.bar, rect: g.rect, clip: g.clip, restore: g.restore };
    C.text = function (s, x, y, col, o) { o = o || {}; const size = o.size || 10, w = C.textWidth(String(s).replace(/f([filt])/g, 'f‌$1'), size); const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x; if (rec) rec.push({ k: 'text', s: String(s), size, x0, x1: Math.min(x0 + w, clip ? clip[0] + clip[2] : 1e9), y0: y, y1: y + size, clipped: !!clip && x0 + w > clip[0] + clip[2] }); return real.text.apply(this, arguments); };
    C.num = function (s, x, y, col, al) { const w = C.numWidth(s), x0 = al === 'right' ? x - w : x; if (rec) rec.push({ k: 'num', s: String(s), x0, x1: x0 + w, y0: y, y1: y + 7 }); return real.num.apply(this, arguments); };
    C.drawCube = function (x, y, size) { if (rec) rec.push({ k: 'cube', x0: x - size * 0.75, x1: x + size * 0.75, y0: y - size, y1: y + size }); return real.cube.apply(this, arguments); };
    C.statusTag = function (st, x, y) { if (rec && st) rec.push({ k: 'status', x0: x - 10, x1: x + 20, y0: y - 1, y1: y + 9 }); const tx = C.text; C.text = real.text; try { return real.tag.apply(this, arguments); } finally { C.text = tx; } };
    C.bar = function (x, y, w) { if (rec) rec.push({ k: 'bar', x0: x - 1, x1: x + w + 1, y0: y - 1, y1: y + 4 }); return real.bar.apply(this, arguments); };
    g.rect = function (x, y, w, h) { lastRect = [x, y, w, h]; return real.rect.apply(this, arguments); };
    g.clip = function () { clip = lastRect; return real.clip.apply(this, arguments); };
    g.restore = function () { clip = null; return real.restore.apply(this, arguments); };
    const plate = (x, y, w, h) => (rec || []).filter(r => r.x0 >= x - 1 && r.x0 < x + w && r.y0 >= y - 2 && r.y0 < y + h);
    const bad = [], shrunk = new Set(), clipped = new Set(), worst = { foe: 1e9, ally: 1e9 };
    const st0 = ['burn', 'freeze', 'sleep', 'poison', 'shock'];
    C.CREATURE_ORDER.forEach((id, n) => {
      const name = C.CREATURES[id].name;
      [[null, false], [st0[n % 5], false], [null, true], [st0[(n + 2) % 5], true]].forEach(([st, caught]) => {
        B.foe.mon = V.mk(id, 50, { status: st }); B.ally.mon = V.mk(id, 50, { status: st }); B.foe.hpShown = B.foe.mon.hp; B.ally.hpShown = B.ally.mon.hp;
        C.state.caught = {}; if (caught) C.state.caught[id] = 1;
        rec = []; scr.draw(); const all = rec; rec = null;
        [['foe', 6, 8, 120, 26], ['ally', 124, 72, 110, 38]].forEach(([which, x, y, w, h]) => {
          const items = all.filter(r => r.x0 >= x - 11 && r.x0 < x + w && r.y0 >= y - 2 && r.y0 < y + h);
          const nm = items.find(r => r.k === 'text' && r.s === name);
          if (!nm) { bad.push(which + ' ' + name + ': name not drawn'); return; }
          if (nm.size < 10) shrunk.add(name); if (nm.clipped) clipped.add(name);
          const others = items.filter(r => r !== nm);
          others.forEach(r => { if (r.x0 < nm.x1 + 1 && r.x1 > nm.x0 && r.y0 < nm.y1 && r.y1 > nm.y0 + 2) bad.push(`${which} ${name}${st ? ' ' + st : ''}${caught ? ' caught' : ''}: ${r.k} ${r.s || ''} covers the name`); });
          const row1 = others.filter(r => r.y0 < y + 12); worst[which] = Math.min(worst[which], Math.min.apply(null, row1.map(r => r.x0)) - nm.x1);
          // the second row: the status tag, HP and the bar don't overlap each other, and everything stays in the plate
          const row2 = items.filter(r => ['status', 'bar'].includes(r.k) || (r.k === 'text' && r.s === 'HP'));
          row2.forEach((a, i) => row2.slice(i + 1).forEach(c => { if (a.x0 < c.x1 && c.x0 < a.x1) bad.push(`${which} ${name} ${st}: ${a.k} and ${c.k} overlap`); }));
          items.forEach(r => { if (r.x0 < x + 2 || r.x1 > x + w - 1) bad.push(`${which} ${name}: ${r.k} ${r.s || ''} sticks out of the plate`); });
          if (caught && which === 'foe' && !items.some(r => r.k === 'cube')) bad.push('foe ' + name + ': no caught cube');
          if (st && !items.some(r => r.k === 'status')) bad.push(which + ' ' + name + ': no status tag');
          if (!items.some(r => r.k === 'num' && r.s === '50')) bad.push(which + ' ' + name + ': Lv not in pixel digits');
          if (items.some(r => r.k === 'text' && /\d/.test(r.s))) bad.push(which + ' ' + name + ': a number in the font');
        });
      });
    });
    Object.assign(C, { text: real.text, num: real.num, drawCube: real.cube, statusTag: real.tag, bar: real.bar }); g.rect = real.rect; g.clip = real.clip; g.restore = real.restore;
    return { names: C.CREATURE_ORDER.length, bad: bad.slice(0, 20), nbad: bad.length, shrunk: [...shrunk], clipped: [...clipped], worst };
  });
  console.log('plates', JSON.stringify(plates));
  check(plates.names === 175 && plates.nbad === 0, `all ${plates.names} names on both plates, with and without a status and the cube: nothing covers a name or sticks out (${plates.nbad} problems)`);
  check(plates.clipped.length === 0, 'no name has to be cut off (the long ones shrink to size 9): ' + plates.shrunk.join(', '));

  // screenshots of the long names (look at them): foe and ally, with a status and the cube, and without
  const shots = [['lunariond', 'groggysolarion', 'sleep', 'burn'], ['hidinggloaming', 'clovetastical', 'freeze', 'poison'], ['constellastar', 'mysterypop', 'shock', 'sleep'], ['clovetastical', 'lunariond', null, null], ['mysterypop', 'hidinggloaming', null, 'freeze']];
  for (const [foe, ally, fs, as] of shots) {
    await p.evaluate(({ foe, ally, fs, as }) => { const C = __cc, B = C.currentBattle(), V = __V; B.foe.mon = V.mk(foe, 47, { status: fs }); B.ally.mon = V.mk(ally, 33, { status: as }); B.foe.hpShown = B.foe.mon.hp * 0.6; B.ally.hpShown = B.ally.mon.hp; C.state.caught = {}; if (fs) C.state.caught[foe] = 1; }, { foe, ally, fs, as });
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${OUT}/19-plates-${foe}-${ally}.png` });
  }

  // ---- 10. the Fight menu: PP and Power in pixel digits
  const fight = await p.evaluate(async () => {
    const C = __cc, V = __V, B = C.currentBattle();
    B.ally.mon = V.mk('embroak', 25, null, ['flareburst', 'tackle']); B.foe.mon = V.mk('pebblepup', 25); B.ally.hpShown = B.ally.mon.hp; B.foe.hpShown = B.foe.mon.hp;
    V.cur = { k: 'fight', hold: true }; // pick Fight, then stay in the Fight menu
    const act = C.stack.find(s => s.name === 'action'); C.input.pressed.a = true; act.update(0); delete C.input.pressed.a;
    await C.until(() => C.top().name === 'fight');
    const texts = [], nums = [], rt = C.text, rn = C.num;
    C.text = function (s) { texts.push(String(s)); return rt.apply(this, arguments); };
    C.num = function (s) { nums.push(String(s)); return rn.apply(this, arguments); };
    C.top().draw(); C.text = rt; C.num = rn;
    return { texts: texts.filter(t => /\d/.test(t)), nums };
  });
  console.log('fight menu', JSON.stringify(fight));
  await p.screenshot({ path: `${OUT}/19-fight-menu.png` });
  check(fight.texts.length === 0 && fight.nums.some(n => /^\d+\/\d+$/.test(n)) && fight.nums.length >= 2, 'PP and Power are drawn in the pixel digits (no digits in the font)');

  console.log(fails.length ? fails.length + ' checks failed' : 'all checks passed');
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.join('; '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
