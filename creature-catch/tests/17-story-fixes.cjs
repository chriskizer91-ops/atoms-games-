// The v12 story fixes: losing any wild battle (tall grass, fairy ring, tide pool, Mimicube) sends you back to rest,
// nobody starts a battle with a fainted party, the blackout line says where you went, Gloaming can't be lost (and old
// saves where it was are mended), "Always day" only changes the look, the Moon Altar's daily Moon Shard, trainers'
// creatures in their form for their level, the save files (damaged files, a file gone before Play, Up on the title,
// a saved spot that's now solid), the Fly map on the Spire, people who walk, Copperbell's bell lines, the Inn, and
// dev codes with spaces in a creature's name.
//   node tests/17-story-fixes.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, OUT } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 480 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  await p.goto(GAME); await p.waitForTimeout(1500);

  // page helpers (window.__h; the game has its own global T): a fresh game, every line said (dialog answers itself), battles that end the way we say
  await p.evaluate(() => {
    const C = __cc, T = window.__h = {};
    T.real = { say: C.say, talk: C.talk, yesNo: C.yesNo, ask: C.ask, menu: C.menu, startBattle: C.startBattle, fight: C.fight, readPage: C.readPage, bagScreen: C.bagScreen };
    T.said = [];
    T.fresh = function (code) {
      Object.assign(C, T.real); T.said = [];
      C.say = async function (t) { T.said.push(String(t)); };
      C.talk = async function (who, lines) { lines.forEach(function (l) { T.said.push(String(l)); }); };
      C.readPage = async function () {};
      C.stack.length = 0; C.unfade(); C.state = C.newState(); C.world.busy = false;
      C.world.enter('village', 10, 6, 'down'); C.push(C.world);
      C.dev.time = null; C.opts.daynight = 'clock';
      if (code) C.runCodes(code);
    };
    // the battle ends at once: 'lose' faints everyone first
    T.battles = 0;
    T.endBattle = function (result) { C.startBattle = async function () { T.battles++; if (result === 'lose') C.state.party.forEach(function (m) { m.hp = 0; }); return result; }; };
    T.faint = function () { C.state.party.forEach(function (m) { m.hp = 0; }); };
    T.hpFull = function () { return C.state.party.every(function (m) { return m.hp === C.mon.maxHp(m); }); };
    T.where = function () { return C.state.map + ' ' + C.state.x + ',' + C.state.y; };
    T.last = function () { return T.said[T.said.length - 1] || ''; };
  });

  // ================= 1. losing wild battles, and never battling with a fainted party =================
  const loss = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {};
    // the fairy ring, lost: back at Rosa's Inn, healed, and the ring is used up for today
    T.fresh('STARTER EMBROAK'); T.endBattle('lose');
    C.state.lastHeal = { map: 'inn-in', x: 5, y: 5 };
    C.world.enter('grove', 4, 10, 'up');
    const ring = C.MAPS.grove.decor.find(function (d) { return d.x === 4 && d.y === 9; });
    await ring.talk(ring);
    r.ring = { at: T.where(), healed: T.hpFull(), line: T.last(), used: !!C.state.flags['day:ring'], battles: T.battles };
    // the fairy ring with everyone fainted: no battle, back to rest, and the ring isn't used up
    delete C.state.flags['day:ring']; T.battles = 0; T.faint(); C.world.enter('grove', 4, 10, 'up');
    await ring.talk(ring);
    r.ringTired = { at: T.where(), healed: T.hpFull(), battles: T.battles, used: !!C.state.flags['day:ring'], said: T.said.slice(-2) };
    // the Night Ruins Mimicube with everyone fainted: it stays put
    T.faint(); C.world.enter('ruins', 16, 14, 'up'); T.battles = 0;
    const cube = C.MAPS.ruins.decor.find(function (d) { return d.cube === 'ruins-mimic'; });
    await cube.talk(cube);
    r.cubeTired = { battles: T.battles, gone: !!C.state.flags['cube:ruins-mimic'], img: !!cube.img, at: T.where(), healed: T.hpFull() };
    // ...and lost for real: back to rest, and now it's gone
    C.world.enter('ruins', 16, 14, 'up');
    await cube.talk(cube);
    r.cubeLost = { battles: T.battles, gone: !!C.state.flags['cube:ruins-mimic'], at: T.where(), healed: T.hpFull() };
    // a tide pool with everyone fainted: just crabs
    T.faint(); C.world.enter('cove', 1, 10, 'down'); T.battles = 0;
    const pool = C.MAPS.cove.decor.find(function (d) { return d.x === 1 && d.y === 11; });
    await pool.talk(pool);
    r.pool = { battles: T.battles, line: T.last() };
    // trainers and Juniper let a fainted party walk by
    C.runCodes('TRIAL DONE'); T.faint();
    r.sight = !!C.trainerSight('desert', 11, 17);
    r.rival = !!C.TRIGGERS.forest(12, 20);
    C.healParty();
    C.world.enter('desert', 11, 17, 'right'); r.sightHealthy = !!C.trainerSight('desert', 11, 17);
    r.rivalHealthy = !!C.TRIGGERS.forest(12, 20);
    // CC.fight itself with a fainted party: no battle, a loss, healed where you last rested
    T.faint(); T.battles = 0; C.state.lastHeal = { map: 'home-in', x: 2, y: 3 };
    r.fight = await C.fight({ trainer: { name: 'Test', team: [C.mon.make('tuftail', 5)] } });
    r.fightAfter = { battles: T.battles, at: T.where(), healed: T.hpFull(), line: T.last() };
    return r;
  });
  console.log('losing', JSON.stringify(loss));
  check(loss.ring.at === 'inn-in 5,5' && loss.ring.healed && /You hurried back to Rosa's Inn\./.test(loss.ring.line), 'losing at the fairy ring: healed at Rosa\'s Inn, and the line says so');
  check(loss.ring.used, 'a fairy ring battle that happened uses up the ring for today');
  check(loss.ringTired.battles === 0 && !loss.ringTired.used && loss.ringTired.healed && loss.ringTired.at === 'inn-in 5,5', 'with everyone fainted the fairy ring starts no battle, sends you to rest and stays ready');
  check(loss.cubeTired.battles === 0 && !loss.cubeTired.gone && loss.cubeTired.img && loss.cubeTired.healed, 'with everyone fainted the Mimicube starts no battle and stays');
  check(loss.cubeLost.battles === 1 && loss.cubeLost.gone && loss.cubeLost.at === 'inn-in 5,5' && loss.cubeLost.healed, 'losing to the Mimicube: back at the Inn, healed, and the cube is gone');
  check(loss.pool.battles === 0 && /tide pool/.test(loss.pool.line), 'a tide pool with everyone fainted is just a tide pool');
  check(!loss.sight && !loss.rival && loss.sightHealthy && loss.rivalHealthy, 'trainers and Juniper don\'t start a battle with a fainted party');
  check(loss.fight === 'lose' && loss.fightAfter.battles === 0 && loss.fightAfter.at === 'home-in 2,3' && loss.fightAfter.healed && /your house/.test(loss.fightAfter.line), 'CC.fight with a fainted party: no battle, healed at home ("your house")');

  // a real battle: your last creature wins with a recoil move and faints too
  const recoil = await p.evaluate(async () => {
    const C = __cc, T = window.__h;
    T.fresh('STARTER EMBROAK');
    const m = C.mon.make('scarabolt', 30); m.hp = 1; m.moves = [{ id: 'scarabcharge', pp: 10 }]; C.state.party = [m];
    C.state.lastHeal = { map: 'hut-in', x: 5, y: 4 }; C.world.enter('meadow', 3, 6, 'up');
    C.say = T.real.say; C.talk = T.real.talk;
    const foe = C.mon.make('tuftail', 5); foe.hp = 1; foe.moves = [{ id: 'growl', pp: 40 }]; // it can't hurt you
    let res = null; C.world.run(async function () { res = await C.fight({ wild: foe }); });
    for (let i = 0; i < 400 && C.world.busy; i++) { C.input.pressed.a = true; await C.sleep(0.05); }
    return { res: res, at: T.where(), healed: T.hpFull(), busy: C.world.busy };
  });
  console.log('recoil', JSON.stringify(recoil));
  check(!recoil.busy && recoil.at === 'hut-in 5,4' && recoil.healed, 'winning a wild battle with a recoil move that faints your last creature sends you back to the Healing Hut, healed');

  // ================= 2. Gloaming =================
  const gl = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {}, F = function () { return C.state.flags; };
    T.fresh('STARTER EMBROAK; ENDING');
    Object.assign(F(), { templeOpen: true, solarionCalm: true, sunEmber: true, doorOpen: true });
    C.world.enter('hollow', 12, 20, 'down');
    // the pool trigger, before and after losing to Hiding Gloaming
    r.trigFirst = !!C.TRIGGERS.hollow(12, 21);
    F().gloamingSeen = true;
    r.trigAgain = !!C.TRIGGERS.hollow(12, 21);
    // the scene: Hiding Gloaming calmed, then the save on disk while its catch battle runs
    C.slot = 1; let onDisk = null;
    C.fight = async function (o) {
      if (o.wild.id === 'hidinggloaming') return 'win';
      onDisk = JSON.parse(localStorage.getItem('creature-catch-save-1')).flags;
      C.state.party.forEach(function (m) { m.hp = 0; }); return 'lose';
    };
    await C.TRIGGERS.hollow(12, 21)();
    r.disk = { calm: onDisk && onDisk.gloamingCalm, waits: onDisk && onDisk.gloamingWaits };
    r.after = { waits: F().gloamingWaits, healed: T.hpFull(), npc: C.NPCS.hollow.some(function (n) { return n.creature === 'gloaming' && n.when(); }), trig: !!C.TRIGGERS.hollow(12, 21) };
    // talking to the waiting Gloaming and losing: healed, still waiting, and saved healed
    C.fight = T.real.fight; T.endBattle('lose'); C.world.enter('hollow', 14, 21, 'down');
    const g = C.NPCS.hollow.find(function (n) { return n.creature === 'gloaming'; });
    await g.talk();
    const saved = JSON.parse(localStorage.getItem('creature-catch-save-1'));
    r.again = { healed: T.hpFull(), waits: F().gloamingWaits, at: T.where(), savedHealed: saved.party.every(function (m) { return m.hp > 0; }), line: T.last() };
    // an old save made during the catch battle (no gloamingWaits): Continue mends it
    const s = JSON.parse(JSON.stringify(C.state)); delete s.flags.gloamingWaits; s.map = 'hollow'; s.x = 11; s.y = 4;
    localStorage.setItem('creature-catch-save-2', JSON.stringify(s));
    C.stack.length = 0; C.slot = 2; Object.assign(C, T.real);
    r.cont = C.continueGame();
    r.mended = { waits: C.state.flags.gloamingWaits, npc: g.when() };
    localStorage.removeItem('creature-catch-save-2'); C.slot = 1;
    return r;
  });
  console.log('gloaming', JSON.stringify(gl));
  check(gl.trigFirst && gl.trigAgain, 'walking down to the Dusk Pool finds Gloaming, and again after losing to it');
  check(gl.disk.calm === true && gl.disk.waits === true, 'the save Page 12 makes already has Gloaming waiting by the pool');
  check(gl.after.waits && gl.after.healed && gl.after.npc && !gl.after.trig, 'after its catch battle is lost Gloaming waits by the pool and you are healed');
  check(gl.again.healed && gl.again.waits && gl.again.savedHealed && /settles by the Dusk Pool/.test(gl.again.line), 'losing to the waiting Gloaming heals you (and saves you healed)');
  check(gl.cont === true && gl.mended.waits === true && gl.mended.npc, 'Continue on an old save where Gloaming was calmed but not caught brings it back to the pool');
  await p.waitForTimeout(300);

  // ================= 3. people, places and lines =================
  const lines = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {}, F = function () { return C.state.flags; };
    T.fresh('STARTER EMBROAK'); C.dev.time = 'day'; // (no night lines)
    // where a blackout takes you
    r.places = {};
    for (const h of [{ map: 'outpost-in-snow', x: 4, y: 4 }, { map: 'springs-inn-in', x: 4, y: 4 }, { map: 'archive', x: 11, y: 21 }, { map: 'village', x: 11, y: 6 }]) {
      C.state.lastHeal = h; await C.blackout(); r.places[h.map] = T.last();
    }
    // the Great Geode speaks
    await C.MAPS.mine.landmarkTalk(); r.geode = T.last();
    // Juniper repeats her goodbye after battle 5
    const jun = C.NPCS.ruins.find(function (n) { return n.id === 'rival'; }); jun.show = true;
    await jun.talk(); r.juniper = T.last(); jun.show = false;
    // Copperbell after the bell rings (before the Balance), and the mine after Gloaming is calmed
    C.runCodes('ENDING'); C.dev.time = 'day'; Object.assign(F(), { templeOpen: true, solarionCalm: true, sunEmber: true, doorOpen: true });
    const talkTo = async function (map, pick) { const n = C.NPCS[map].find(pick); await n.talk(); return T.last(); };
    const barnaby = function (n) { return n.art === 'barnaby'; }, toll = function (n) { return n.art === 'toll'; }, wick = function (n) { return n.art === 'villager-10'; };
    const gritMine = function (n) { return n.art === 'grit'; }, dusty = function (n) { return n.art === 'dusty'; };
    r.before = [await talkTo('cb-hall-in', barnaby), await talkTo('cb-tower-in', toll), await talkTo('copperbell', wick), await talkTo('mine', gritMine), await talkTo('mine', dusty), await talkTo('cb-grit-in', gritMine)];
    F().gloamingCalm = true; F().bellRings = true;
    r.stage = C.stage();
    r.after = [await talkTo('cb-hall-in', barnaby), await talkTo('cb-tower-in', toll), await talkTo('copperbell', wick), await talkTo('mine', gritMine), await talkTo('mine', dusty), await talkTo('cb-grit-in', gritMine)];
    // Mayor Barnaby and a Normal type whose name starts with a vowel
    T.fresh('STARTER EMBROAK; TEAM INKWING 30; TRIAL CAVE');
    for (let i = 0; i < 4; i++) await talkTo('cb-hall-in', barnaby);
    r.barnaby = T.said.filter(function (l) { return /Inkwing/.test(l); });
    // Elder Willow's Balance line keeps its first sentence only
    r.willow = C.balance.toString();
    return r;
  });
  console.log('lines', JSON.stringify(lines, null, 1).slice(0, 3000));
  check(/the Frostpeak Pass Outpost\./.test(lines.places['outpost-in-snow']) && /the Hot Spring Inn\./.test(lines.places['springs-inn-in']) && /the Archive's healing stone\./.test(lines.places.archive) && /Home Village\./.test(lines.places.village), 'the blackout line names the outpost, the Hot Spring Inn, the Archive\'s healing stone or Home Village');
  check(/The Great Geode/.test(lines.geode), 'the Great Geode says its line');
  check(/Go on\. Calm it down/.test(lines.juniper), 'Juniper repeats her goodbye when you talk to her after battle 5');
  check(/bell's still quiet/.test(lines.before[0]) && /still cracked/.test(lines.before[1]), 'before the bell rings, Barnaby and Old Toll wait for it');
  check(/It rang!|whole town/.test(lines.after[0]) && /rang by itself|Every dusk/.test(lines.after[1]) && /bell rang/.test(lines.after[2]), 'after the bell rings (before the Balance) Barnaby, Old Toll and Wick say it rang');
  check(/Bring it home/.test(lines.before[3]) && /cold's gone/.test(lines.after[3]) && /Grit smiled/.test(lines.after[4]) && /brought it home/.test(lines.after[5]), 'Grit and Dusty thank you once Gloaming is calmed');
  check(lines.stage === 'after', '(the story stage is still "after" there)');
  check(lines.barnaby.length === 1 && /^What a lovely Inkwing!/.test(lines.barnaby[0]), 'Barnaby: "What a lovely Inkwing!"');
  check(/dreaming more than ever\.'/.test(lines.willow) && !/more often/.test(lines.willow), 'Elder Willow no longer promises dream creatures');

  // Juniper's village patrol keeps going
  const patrol = await p.evaluate(() => {
    const C = __cc, T = window.__h; T.fresh('STARTER EMBROAK'); C.world.enter('village', 4, 12, 'down');
    const j = C.NPCS.village.find(function (n) { return n.look === 'juniper'; }); j.x = 9; j.y = 2; j.leg = 0; j.mv = null;
    const seen = {}, late = {}; for (let i = 0; i < 3000; i++) { C.world.update(0.1); seen[j.x + ',' + j.y] = 1; if (i > 2000) late[j.x + ',' + j.y] = 1; }
    return { all: Object.keys(seen), late: Object.keys(late) };
  });
  console.log('patrol', JSON.stringify(patrol));
  check(['9,2', '12,2', '12,3', '9,3'].every(function (k) { return patrol.late.indexOf(k) >= 0; }), 'Juniper keeps walking her whole loop in the village');

  // a walking person and you never end up on the same tile
  const overlap = await p.evaluate(async () => {
    const C = __cc, T = window.__h; T.fresh('STARTER EMBROAK'); C.dev.noWild = true;
    const daisy = C.NPCS.copperbell.find(function (n) { return n.art === 'villager-9'; });
    const run = async function (lag) {
      C.world.enter('copperbell', 7, 12, 'up'); daisy.x = 6; daisy.y = 11; daisy.mv = null; daisy.leg = 1; daisy.wait = lag ? 99 : 0.001;
      C.input.held.up = true; // one step up, into the tile she's heading for
      let same = false;
      for (let i = 0; i < 30; i++) {
        if (lag && i === 2) daisy.wait = 0.001; // she sets off while you're part-way through your step
        if (i === 3) C.input.held.up = false;
        await C.sleep(0.03);
        if (!daisy.mv && !C.world.moving && daisy.x === C.state.x && daisy.y === C.state.y) same = true;
      }
      C.input.held.up = false; await C.sleep(0.5);
      if (daisy.x === C.state.x && daisy.y === C.state.y) same = true;
      return { same: same, you: T.where(), daisy: daisy.x + ',' + daisy.y };
    };
    const a = await run(false), b2 = await run(true);
    C.dev.noWild = false;
    return { a: a, b: b2 };
  });
  console.log('walking people', JSON.stringify(overlap));
  check(!overlap.a.same && !overlap.b.same, 'a walking person and you never stand on the same tile');

  // the Fly map on the Moonlit Spire
  const fly = await p.evaluate(async () => {
    const C = __cc, T = window.__h; T.fresh('STARTER EMBROAK; ENDING; FLY'); C.world.enter('spire', 8, 18, 'up');
    let done = false; C.world.run(function () { return C.flyScreen().then(function () { done = true; }); });
    await C.sleep(0.2);
    const scr = C.top(), drawn = [], text = C.text;
    C.text = function (s) { drawn.push(String(s)); return text.apply(this, arguments); }; scr.draw(); C.text = text;
    C.input.pressed.a = true;
    for (let i = 0; i < 100 && !done; i++) await C.sleep(0.05);
    return { label: drawn.find(function (s) { return /Night Ruins|Home Village/.test(s); }), map: C.state.map, done: done };
  });
  console.log('fly from the Spire', JSON.stringify(fly));
  check(fly.label === 'Night Ruins' && fly.done && fly.map === 'ruins', 'Fly from the Spire starts at the Night Ruins (no "you are here") and flies there');

  // ================= 4. Always day, the Inn, the Moon Altar =================
  const day = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {};
    T.fresh('STARTER EMBROAK; ENDING'); C.opts.daynight = 'day';
    const now = C.gameHour(); C.state.clockShift = ((23 - now) % 24 + 24) % 24;
    r.hour = Math.round(C.gameHour()); r.night = C.isNight(); r.drawn = C.daylight().night;
    const got = {}; for (let i = 0; i < 400; i++) got[C.rollSpawn('bayou').id] = 1;
    r.bayou = Object.keys(got);
    C.world.enter('bayou', 21, 20, 'up');
    const stump = C.MAPS.bayou.decor.find(function (d) { return d.x === 21 && d.y === 19; });
    await stump.talk(stump); r.page9 = C.hasPage(9);
    C.state.clockShift = ((12 - now) % 24 + 24) % 24; r.noon = C.isNight();
    // the Inn: the welcome first, then "Until night" with Always day
    C.state.coins = 500; C.world.enter('inn-in', 5, 4, 'up');
    const rosa = C.NPCS['inn-in'][0]; let pick = 1; C.ask = async function () { return pick; };
    T.said = []; await rosa.talk(); r.innNight = T.said.slice(); r.innNightIsNight = C.isNight();
    pick = 0; T.said = []; await rosa.talk(); r.innMorning = T.said.slice(); r.innMorningIsNight = C.isNight();
    const bed = C.MAPS['inn-in'].decor.find(function (d) { return d.x === 9 && d.y === 5; });
    r.bed = bed && bed.img; r.bedArt = !!(bed && C.img(bed.img));
    C.opts.daynight = 'clock';
    // the Moon Altar
    T.fresh('STARTER EMBROAK'); C.state.bag.moonshard = 0;
    await C.MAPS.ruins.landmarkTalk(); r.altarBefore = { shards: C.state.bag.moonshard, line: T.last() };
    C.runCodes('ENDING');
    await C.MAPS.ruins.landmarkTalk(); r.altar1 = C.state.bag.moonshard;
    await C.MAPS.ruins.landmarkTalk(); r.altar2 = { shards: C.state.bag.moonshard, line: T.last() };
    return r;
  });
  console.log('always day', JSON.stringify(day));
  check(day.hour === 23 && day.night === true && day.drawn === 0, 'with Always day at 23:00 it is night for the game, and the world is drawn in daylight');
  check(day.bayou.indexOf('fireflink') >= 0 || day.bayou.indexOf('lotusprite') >= 0, 'night creatures turn up with Always day');
  check(day.page9, 'the firefly stump gives Lost Page 9 at night with Always day');
  check(day.noon === false, 'and at noon it is day');
  check(/^Welcome to the Inn!/.test(day.innNight[0]), 'Rosa says her welcome first');
  check(day.innNightIsNight && day.innNight.some(function (l) { return /night creatures will be out/.test(l); }) && day.innNight.some(function (l) { return /Always day/.test(l); }), '"Until night" with Always day: it is night, and the note says it still looks like day');
  check(!day.innMorningIsNight && !day.innMorning.some(function (l) { return /Always day/.test(l); }), '"Until morning" has no Always day note');
  check(day.bed === 'furniture/inn-3' && day.bedArt, 'the Inn\'s guest bed is a real picture (no invisible wall)');
  check(day.altarBefore.shards === 0 && /Moon Altar/.test(day.altarBefore.line), 'before the moon is back the Moon Altar gives nothing');
  check(day.altar1 === 1 && day.altar2.shards === 1 && /tomorrow/.test(day.altar2.line), 'after the moon is back the Moon Altar leaves one Moon Shard a day');

  // ================= 5. trainers' teams =================
  const teams = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {}, got = [];
    T.fresh('STARTER EMBROAK; ENDING'); C.state.flags.trialWater = false; // Gus's trial still to do
    C.yesNo = async function () { return true; };
    C.fight = async function (o) { got.push(o.trainer.team.map(function (m) { return m.id + ' ' + m.lv; }).join(', ')); return 'lose'; };
    await C.NPCS.water.find(function (n) { return n.id === 'guide'; }).talk();
    await C.NPCS.spire.find(function (n) { return n.art === 'juniper-older' && n.x === 8; }).talk();
    await C.NPCS.snow.find(function (n) { return n.name === 'Skier Lena'; }).talk();
    await C.NPCS.temple.find(function (n) { return n.name === 'Explorer Rafe'; }).talk();
    r.gus = got[0]; r.juniper6 = got[1]; r.lena = got[2]; r.rafe = got[3];
    C.state.flags['tr:snow-1'] = true; await C.NPCS.snow.find(function (n) { return n.name === 'Skier Lena'; }).talk(); r.lenaAfter = T.last();
    return r;
  });
  console.log('teams', JSON.stringify(teams));
  check(teams.gus === 'crabbit 15, tidepuff 15, sealamp 16, surgefin 17', 'Fisher Gus: four creatures, his Bubblefin met as Surgefin at 17');
  check(teams.juniper6 === 'paladcrab 47, radimoth 47, koidrake 48, tsunadrake 50', 'Juniper at the Spire: Lv 47 to 50, her Rampacrab grown into Paladcrab');
  check(teams.lena === 'pengarch 24, sleetle 24' && /Pengarch slides/.test(teams.lenaAfter), 'Skier Lena\'s Pengloo is a Pengarch, and she says so');
  check(teams.rafe === 'mummoth 43, sphinxie 43, sphinxar 46', 'Explorer Rafe\'s Sphinxar is Lv 46');

  // ================= 6. save files and the title =================
  const saves = await p.evaluate(async () => {
    const C = __cc, T = window.__h, r = {};
    T.fresh('STARTER EMBROAK'); Object.assign(C, T.real);
    localStorage.setItem('creature-catch-save-1', JSON.stringify(C.state));
    localStorage.removeItem('creature-catch-save-2');
    localStorage.setItem('creature-catch-save-3', '{"map":"village","x":4,"y":'); // cut off
    localStorage.removeItem('creature-catch-save-3-damaged');
    r.status = [1, 2, 3].map(function (n) { return C.slotStatus(n); });
    // the New Game picker: File 2 (empty) is picked first; File 3 says it's damaged and asks first
    C.stack.length = 0;
    let picked = null; C.filePicker('new').then(function (n) { picked = n; });
    const scr = C.top(), drawn = [], nums = [], text = C.text, textNum = C.textNum;
    C.text = function (s) { drawn.push(String(s)); return text.apply(this, arguments); };
    C.textNum = function (s) { nums.push(String(s)); return textNum.apply(this, arguments); };
    scr.draw(); C.text = text; C.textNum = textNum;
    r.drawn = drawn.filter(function (s) { return /Damaged|Empty/.test(s); }); r.nums = nums;
    let asked = null; C.yesNo = async function (q) { asked = q; return true; };
    C.input.pressed.down = true; scr.update(); delete C.input.pressed.down;
    C.input.pressed.a = true; scr.update(); delete C.input.pressed.a;
    await C.sleep(0.1);
    r.asked = asked; r.picked = picked; r.backup = localStorage.getItem('creature-catch-save-3-damaged');
    C.yesNo = T.real.yesNo;
    // Continue on a file that isn't there any more: false, nothing breaks
    C.stack.length = 0; C.slot = 2; r.gone = C.continueGame();
    // a saved spot that's now solid (the Archive stairs building in the Night Ruins): moved to the nearest free tile
    const s = JSON.parse(localStorage.getItem('creature-catch-save-1')); s.map = 'ruins'; s.x = 19; s.y = 22;
    localStorage.setItem('creature-catch-save-2', JSON.stringify(s));
    C.stack.length = 0; C.slot = 2; r.cont = C.continueGame();
    r.spot = T.where(); r.solid = C.world.solidAt(C.state.x, C.state.y);
    r.dist = Math.abs(C.state.x - 19) + Math.abs(C.state.y - 22);
    localStorage.removeItem('creature-catch-save-2'); localStorage.removeItem('creature-catch-save-3'); localStorage.removeItem('creature-catch-save-3-damaged');
    // the title: Up from Continue goes round to Options
    C.stack.length = 0; C.titleScreen();
    const title = C.top();
    C.input.pressed.up = true; title.update(); delete C.input.pressed.up;
    C.input.pressed.a = true; title.update(); delete C.input.pressed.a;
    r.titleUp = C.top().name;
    C.input.pressed.b = true; C.top().update(); delete C.input.pressed.b;
    await C.sleep(0.1);
    C.stack.length = 0; C.slot = 1;
    // the Save prompt counts only real creatures
    T.fresh('STARTER EMBROAK'); C.state.seen.notacreature = 1; C.state.caught.notacreature = 1;
    let q = null, menus = 0;
    C.yesNo = async function (x) { q = x; return false; };
    C.menu = async function (items) { menus++; return menus === 1 ? items.findIndex(function (i) { return (i.label || i) === 'Save'; }) : -1; };
    await C.fieldMenu(); r.saveAsk = q;
    // the Wooden Whistle from the Bag closes the field menu once you've flown
    menus = 0; C.menu = async function (items) { menus++; return menus === 1 ? items.findIndex(function (i) { return (i.label || i) === 'Bag'; }) : -1; };
    C.bagScreen = async function () { return 'flew'; };
    await C.fieldMenu(); r.menusAfterWhistle = menus;
    Object.assign(C, T.real);
    return r;
  });
  console.log('saves', JSON.stringify(saves));
  check(saves.status.join() === 'ok,empty,damaged', 'each file reads as ok, empty or damaged');
  check(saves.drawn.indexOf('Damaged file') >= 0 && saves.drawn.indexOf('Empty: start here') >= 0, 'the picker shows "Damaged file" and "Empty: start here"');
  check(saves.nums.indexOf('File 2') >= 0 && saves.nums.some(function (s) { return /^Caught \d+ {3}Time/.test(s); }), 'the picker draws its numbers in the pixel digits');
  check(/damaged/.test(saves.asked || '') && saves.picked === 3 && saves.backup === '{"map":"village","x":4,"y":', 'New Game on a damaged file asks first and keeps a copy of it');
  check(saves.gone === false, 'Continue on a file that is gone returns false (the title shows again)');
  check(saves.cont && !saves.solid && saves.dist <= 3, 'Continue on a spot that is now solid moves you to the nearest free tile (' + saves.spot + ')');
  check(saves.titleUp === 'options', 'Up on the title goes from Continue round to Options');
  check(/1 caught, 1 seen/.test(saves.saveAsk || ''), 'the Save prompt counts only real creatures');
  check(saves.menusAfterWhistle === 1, 'flying with the whistle from the Bag closes the field menu');

  // ================= 7. dev codes with spaces in a name =================
  const codes = await p.evaluate(() => {
    const C = __cc, T = window.__h; T.fresh('STARTER EMBROAK');
    const all = function () { return C.state.party.concat(C.state.vault).map(function (m) { return m.id + ' ' + m.lv; }); };
    C.runCodes('GIVE CLOVE TASTICAL 12; GIVE ? POP 7; GIVE TUFT 9');
    const give = all();
    C.runCodes('TEAM DOGGY WOGGY 30 HOPPIN POP 20 PUPPOP');
    return { give: give, team: C.state.party.map(function (m) { return m.id + ' ' + m.lv; }) };
  });
  console.log('codes', JSON.stringify(codes));
  check(codes.give.indexOf('clovetastical 12') >= 0 && codes.give.indexOf('mysterypop 7') >= 0 && codes.give.indexOf('tuftail 9') >= 0, 'GIVE CLOVE TASTICAL 12, GIVE ? POP 7 and GIVE TUFT 9 give the right creature at the right level');
  check(codes.team.join() === 'doggywoggy 30,hoppinpop 20,puppop 10', 'TEAM DOGGY WOGGY 30 HOPPIN POP 20 PUPPOP');

  await p.screenshot({ path: `${OUT}/17-end.png` });
  console.log(fails.length ? fails.length + ' checks failed' : 'all checks passed');
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.join('; '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
