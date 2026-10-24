// The Cube Vault's own screen (a scrolling list with the creature you're on, paging, sorting, taking one out,
// remembering where you were, refusing a swap that leaves nobody able to fight), long menus that scroll instead of
// running off the screen, the Creature Log (shadows, the field note's room, long names), Yes/No questions that stay on
// screen, Evolve in the party menu, shards that stay in the Bag when an evolution is stopped, the party before the
// starter, type icons, the party's status tags, numbers in menus, play time, and a broken screen that can't freeze it.
//   node tests/14-vault-log.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, OUT } = require('./lib.cjs');
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  const errs = [], onPurpose = []; // (the screen this test breaks on purpose, below, is not an error)
  p.on('pageerror', e => { if (/broken on purpose/.test(e.message)) onPurpose.push(e.message); else errs.push('PAGEERROR ' + e.message + '\n' + e.stack); }); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const fails = []; const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  const tap = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.down(k); await p.waitForTimeout(50); await p.keyboard.up(k); await p.waitForTimeout(80); } };
  const shot = (name) => p.screenshot({ path: `${OUT}/14-${name}.png` });
  const top = () => p.evaluate(() => { const t = __cc.top(); return t && t.name; });
  await p.goto(GAME); await p.waitForTimeout(1500);

  // ---- the Vault with 34 creatures, on a phone
  await p.evaluate(() => {
    const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world);
    C.runCodes('STARTER EMBROAK');
    C.CREATURE_ORDER.slice(0, 34).forEach((id, i) => C.state.vault.push(C.mon.make(id, 5 + (i * 7) % 40)));
    C.world.run(() => C.vaultScreen());
  });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(300);
  check(await top() === 'vault', 'Take out opens the Vault screen');
  await shot('vault');
  await tap('ArrowUp'); // wraps to the last one
  const last = await p.evaluate(() => { const C = __cc, v = C.state.vault; return C.mon.name(v[0]); });
  await tap('ArrowRight', 3); await tap('Enter'); await shot('vault-sorted');
  await tap('KeyZ'); await p.waitForTimeout(200);
  check(await top() === 'menu', 'A on a creature asks what to do');
  await tap('KeyZ'); await p.waitForTimeout(500);
  await p.evaluate(async () => { const C = __cc; for (let i = 0; i < 40 && C.top().name === 'say'; i++) { C.input.pressed.a = true; await C.sleep(0.05); } });
  const after = await p.evaluate(() => ({ party: __cc.state.party.length, vault: __cc.state.vault.length, top: __cc.top().name }));
  console.log('after taking one out', JSON.stringify(after), 'oldest in the Vault was', last);
  check(after.party === 2 && after.vault === 33, 'one creature came out of the Vault');
  for (let i = 0; i < 4; i++) { await tap('KeyX'); await p.waitForTimeout(150); }

  // ---- long menus scroll: every row the menu draws is on the screen
  const menu = await p.evaluate(async () => {
    const C = __cc, items = []; for (let i = 0; i < 30; i++) items.push('Row ' + i);
    const res = {};
    const pr = C.menu(items, { title: 'Long', y: 8 }); const m = C.top();
    let maxY = 0; const real = C.textNum; C.textNum = function (s, x, y) { if (/^Row/.test(s)) maxY = Math.max(maxY, y); return real.apply(this, arguments); };
    m.draw(); C.textNum = real; res.maxY = maxY;
    for (let i = 0; i < 25; i++) { C.input.pressed.down = true; m.update(); delete C.input.pressed.down; }
    let drawn = []; C.textNum = function (s) { if (/^Row/.test(s)) drawn.push(s); return real.apply(this, arguments); };
    m.draw(); C.textNum = real; res.drawn = drawn;
    C.input.pressed.a = true; m.update(); delete C.input.pressed.a; res.picked = await pr;
    return res;
  });
  console.log('long menu', JSON.stringify(menu));
  check(menu.maxY + 12 <= 160, 'a 30-row menu stays on the screen');
  check(menu.drawn.indexOf('Row 25') >= 0 && menu.picked === 25, 'the menu scrolls to the row you are on');

  // ---- the Creature Log's shadows
  const log = await p.evaluate(() => {
    const C = __cc; C.state = C.newState(); C.runCodes('STARTER EMBROAK'); C.markSeen('tuftail'); C.state.seen.notacreature = 1;
    const ids = C.CREATURE_ORDER, res = {};
    C.creatureLog(); const scr = C.top(); const said = [];
    const real = C.text, realNum = C.num;
    C.text = function (s) { said.push(String(s)); return real.apply(this, arguments); };
    C.num = function (s) { said.push(String(s)); return realNum.apply(this, arguments); };
    const at = (id) => { said.length = 0; const n = ids.indexOf(id); for (let i = 0; i < n; i++) { C.input.pressed.down = true; scr.update(); delete C.input.pressed.down; } scr.draw(); for (let i = 0; i < n; i++) { C.input.pressed.up = true; scr.update(); delete C.input.pressed.up; } return said.join(' ').replace(/\s+/g, ' '); };
    res.clovermouse = at('clovermouse'); res.verdantail = at('verdantail'); res.sylvantail = at('sylvantail'); res.cinderfrog = at('cinderfrog');
    res.lunarion = at('lunarion'); res.bumblazer = at('bumblazer'); res.tuftail = at('tuftail');
    C.text = real; C.num = realNum; C.input.pressed.b = true; scr.update(); delete C.input.pressed.b;
    return res;
  });
  for (const k in log) console.log(k + ': ' + log[k].slice(0, 160));
  check(/\? \? \?/.test(log.clovermouse) && /Meadow Path/.test(log.clovermouse), 'an unseen first form is a shadow with a hint');
  check(/Tuftail grows into this one at Lv/.test(log.verdantail), 'an evolution of a creature you met is a shadow');
  check(/Tuftail family/.test(log.sylvantail), 'its next evolution is a shadow too');
  check(/Embroak grows into this one/.test(log.cinderfrog), 'your starter\'s evolution is a shadow');
  check(/Not seen yet/.test(log.lunarion), 'the guardians stay a secret');
  check(/Not seen yet/.test(log.bumblazer), 'an evolution of a creature you haven\'t met stays hidden');
  check(/^Tuftail PLANT Seen in the wild/.test(log.tuftail), 'a creature you have seen shows its name and picture');
  check(/Seen 2 Caught 1/.test(log.tuftail), 'the Log counts only real creatures (Seen 2, Caught 1)');

  // ---- helpers for the rest: a fresh game in the village, press A until a screen is on top, what one frame draws
  const fresh = (codes) => p.evaluate((codes) => { const C = __cc; C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.dev.noWild = true; C.vaultAt = null; if (codes) C.runCodes(codes); }, codes);
  const mashUntil = async (name, max = 60) => { for (let i = 0; i < max && (await top()) !== name; i++) { await tap('KeyZ'); await p.waitForTimeout(60); } return await top(); };
  const idle = () => p.evaluate(() => !__cc.world.busy && __cc.stack.length === 1);
  const drawn = () => p.evaluate(async () => { // every text and number drawn in one frame
    const C = __cc, said = [], real = C.text, realNum = C.num;
    C.text = function (s) { said.push(String(s)); return real.apply(this, arguments); };
    C.num = function (s) { said.push(String(s)); return realNum.apply(this, arguments); };
    await C.sleep(0.05); C.text = real; C.num = realNum; return said;
  });

  // ---- a short Vault (fewer creatures than the list has rows) scrolls without breaking
  await fresh('STARTER EMBROAK');
  const short = await p.evaluate(() => {
    const C = __cc; ['tuftail', 'inkwing', 'drizzlon'].forEach((id) => C.state.vault.push(C.mon.make(id, 10)));
    C.vaultList(); const scr = C.top(); let threw = null;
    for (let i = 0; i < 2; i++) { C.input.pressed.down = true; scr.update(); delete C.input.pressed.down; }
    try { scr.draw(); } catch (e) { threw = e.message; }
    C.input.pressed.b = true; scr.update(); delete C.input.pressed.b;
    return { threw, at: C.vaultAt && C.vaultAt.sel };
  });
  console.log('short Vault', JSON.stringify(short));
  check(!short.threw && short.at === 2, 'a Vault of 3 scrolls to the last one without breaking');

  // ---- the Vault list remembers where you were
  await fresh('STARTER EMBROAK');
  await p.evaluate(() => { const C = __cc; C.CREATURE_ORDER.slice(0, 20).forEach((id, i) => C.state.vault.push(C.mon.make(id, 5 + i))); C.vaultSort = 0; C.world.run(() => C.vaultScreen()); });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(200);
  await tap('ArrowDown', 12); await p.waitForTimeout(100);
  const was = await p.evaluate(() => __cc.top().name === 'vault' && __cc.vaultAt === null);
  await tap('KeyX'); await p.waitForTimeout(200); await tap('KeyZ'); await p.waitForTimeout(300);
  const back = await p.evaluate(() => { const C = __cc, a = C.vaultAt; return { sel: a.sel, top: a.top, name: C.mon.name(a.m), drawnOn: null }; });
  const backDraw = await drawn();
  console.log('Vault position after leaving and coming back', JSON.stringify(back));
  check(was && back.sel === 12 && backDraw.indexOf(back.name) >= 0, 'the Vault list opens again on the creature you were on');
  await tap('KeyZ'); await p.waitForTimeout(200); await tap('KeyZ'); await p.waitForTimeout(300); // Take out
  await mashUntil('menu'); await tap('KeyZ'); await p.waitForTimeout(300); // the Vault menu again: Take out
  const nearest = await p.evaluate(() => { const C = __cc, t = C.top(); return { top: t.name, sel: C.vaultAt.sel, party: C.state.party.length }; });
  console.log('after taking one out', JSON.stringify(nearest));
  check(nearest.top === 'vault' && nearest.party === 2, 'after taking one out, the list opens again (on the one next to it)');
  for (let i = 0; i < 3; i++) { await tap('KeyX'); await p.waitForTimeout(150); }

  // ---- a swap that would leave nobody able to fight is refused, like Put away
  await fresh('TEAM EMBROAK 20 TUFTAIL 10 DRIZZLON 10 MOSSBACK 10');
  await p.evaluate(() => {
    const C = __cc; C.state.party.slice(1).forEach((m) => { m.hp = 0; });
    const v = C.mon.make('clovermouse', 8); v.hp = 0; C.state.vault.push(v);
    window.__said = []; const real = window.__realSay || (window.__realSay = C.say); C.say = function (t) { window.__said.push(t); return real.apply(this, arguments); };
    C.world.run(() => C.vaultScreen());
  });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(300); // Take out
  await tap('KeyZ'); await p.waitForTimeout(200); await tap('KeyZ'); await p.waitForTimeout(300); // Clovermouse, Swap in
  await tap('KeyZ'); await p.waitForTimeout(400); // swap with Embroak, the only one that can fight
  const swap = await p.evaluate(() => ({ party: __cc.state.party.map((m) => m.id + ' ' + m.hp), vault: __cc.state.vault.map((m) => m.id), said: window.__said.slice() }));
  console.log('swap', JSON.stringify(swap));
  check(swap.party[0].startsWith('embroak') && swap.vault[0] === 'clovermouse' && swap.said.some((t) => /Keep at least one creature that can fight/.test(t)), 'swapping out the only creature that can fight is refused');
  for (let i = 0; i < 4; i++) { await tap('KeyX'); await p.waitForTimeout(150); }

  // ---- Yes/No questions stay on screen while you choose
  await fresh('STARTER EMBROAK');
  await p.evaluate(() => { const C = __cc; window.__yes = null; C.world.run(async () => { window.__yes = await C.yesNo('Delete File 2? This can\'t be undone.', 'Elder Willow'); }); });
  const yn = await mashUntil('menu'); const ynDrawn = await drawn();
  await shot('yesno');
  await tap('KeyX'); await p.waitForTimeout(300);
  const ynSaid = ynDrawn.join(' | ');
  console.log('Yes/No frame: ' + ynSaid.slice(0, 200));
  check(yn === 'menu' && /Delete File 2\? This can't be undone\./.test(ynSaid) && /Yes/.test(ynSaid) && /Elder Willow/.test(ynSaid), 'the question and who asks stay on screen with Yes and No');
  check(await p.evaluate(() => window.__yes === false), 'B answers No');

  // ---- the party before the starter: a line, not a freeze (from L and from a Potion in the Bag)
  await fresh('');
  await p.evaluate(() => { const C = __cc; C.state.bag.potion = 1; window.__said = []; const real = window.__realSay || (window.__realSay = C.say); C.say = function (t) { window.__said.push(t); return real.apply(this, arguments); }; });
  await tap('KeyQ'); await p.waitForTimeout(300); await mashUntil(undefined, 3);
  for (let i = 0; i < 6 && !(await idle()); i++) { await tap('KeyZ'); await p.waitForTimeout(100); }
  const fromL = await p.evaluate(() => window.__said.length);
  await p.evaluate(() => { __cc.world.run(() => __cc.bagScreen()); });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(300);
  for (let i = 0; i < 4; i++) { await tap('KeyX'); await p.waitForTimeout(150); }
  const t0 = await p.evaluate(() => __cc.time); await p.waitForTimeout(300);
  const empty = await p.evaluate((t0) => ({ said: window.__said.slice(), alive: __cc.time > t0, idle: !__cc.world.busy && __cc.stack.length === 1 }), t0);
  console.log('before the starter', JSON.stringify(empty));
  check(fromL === 1 && empty.said.length === 2 && empty.said.every((t) => t === 'You don\'t have any creatures yet!') && empty.alive && empty.idle, 'the party before the starter says you have no creatures yet (L, and a Potion from the Bag)');

  // ---- Evolve from the party menu (a creature that's ready, or at Lv 50)
  await fresh('TEAM TUFTAIL 30 CLOVERMOUSE 50');
  await p.evaluate(() => { const C = __cc; C.state.party[0].evoAsk = true; C.state.party[1].hp = 0; C.dev.speed = 4; window.__menus = []; const real = C.menu; C.menu = function (items) { window.__menus.push(items.map((x) => typeof x === 'string' ? x : x.label).join(',')); return real.apply(this, arguments); }; C.world.run(() => C.partyScreen('field')); });
  await p.waitForTimeout(300); await tap('ArrowDown'); await tap('KeyZ'); await p.waitForTimeout(200); await tap('KeyX'); await p.waitForTimeout(200); // the fainted one first
  await tap('ArrowUp'); await tap('KeyZ'); await p.waitForTimeout(200); await tap('ArrowDown', 2); await tap('KeyZ'); await p.waitForTimeout(300); // Evolve
  for (let i = 0; i < 80 && (await top()) !== 'party'; i++) { await p.waitForTimeout(150); if ((await top()) === 'say' || (await top()) === 'menu') await tap('KeyZ'); }
  const evo = await p.evaluate(() => { const C = __cc, m = C.state.party[0]; C.dev.speed = 1; return { id: m.id, evoAsk: 'evoAsk' in m, menus: window.__menus.slice(0, 2), top: C.top().name }; });
  console.log('Evolve in the party menu', JSON.stringify(evo));
  check(evo.menus[0] === 'Summary,Move to front' && evo.menus[1] === 'Summary,Move to front,Evolve', 'the party menu offers Evolve only to a creature that is ready and awake');
  check(evo.id === 'verdantail' && !evo.evoAsk && evo.top === 'party', 'Evolve evolves it, and the next win won\'t ask again');
  await tap('KeyX'); await p.waitForTimeout(200);

  // ---- shards: stopping the evolution keeps the shard; a fainted creature can't use one; a shiny's new form is shiny
  await fresh('TEAM MOTHLIGHT 20');
  await p.evaluate(() => { const C = __cc; C.state.bag = { moonshard: 1 }; C.world.run(() => C.bagScreen()); });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(300); await tap('KeyZ'); // Moon Shard, on Mothlight
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(100); if (await p.evaluate(() => { const C = __cc, t = C.top(); return t.opaque && !t.name && C.stack.length >= 3; })) break; }
  await p.waitForTimeout(400); await tap('KeyX'); // B during the flicker
  for (let i = 0; i < 30 && !(await p.evaluate(() => __cc.top().name === 'menu')); i++) { await p.waitForTimeout(100); if ((await top()) === 'say') await tap('KeyZ'); }
  const shard = await p.evaluate(() => ({ id: __cc.state.party[0].id, shards: __cc.state.bag.moonshard, top: __cc.top().name }));
  console.log('stopped shard evolution', JSON.stringify(shard));
  check(shard.id === 'mothlight' && shard.shards === 1 && shard.top === 'menu', 'stopping a shard evolution with B keeps the shard (back in the Bag)');
  await tap('KeyX'); await p.waitForTimeout(200);
  const faint = await p.evaluate(() => { const C = __cc, m = C.state.party[0]; m.hp = 0; const r = C.itemProblem('moonshard', m); m.hp = 10; return r; });
  check(faint === 'Mothlight has fainted. Heal it first!', 'a shard won\'t work on a fainted creature: ' + faint);
  await p.evaluate(() => { const C = __cc; C.state.party[0].shiny = true; C.dev.speed = 4; window.__ok = null; C.world.run(async () => { window.__ok = await C.evolveScene(C.state.party[0]); }); });
  for (let i = 0; i < 80 && (await p.evaluate(() => window.__ok === null)); i++) { await p.waitForTimeout(150); if ((await top()) === 'say' || (await top()) === 'menu') await tap('KeyZ'); }
  const shiny = await p.evaluate(() => { const C = __cc; C.dev.speed = 1; const s = JSON.parse(JSON.stringify(C.state)); s.shinyCaught = {}; s.vault = [Object.assign(C.mon.make('verdantail', 20), { shiny: true })];
    localStorage.setItem(C.slotKey(3), JSON.stringify(s)); const st = C.state; C.loadGame(3); const after = C.state.shinyCaught; C.state = st; C.slot = 1; C.deleteSave(3);
    return { ok: window.__ok, id: C.state.party[0].id, shinyCaught: C.state.shinyCaught, loaded: after }; });
  console.log('shiny evolution', JSON.stringify(shiny));
  check(shiny.ok && shiny.id === 'radimoth' && shiny.shinyCaught.radimoth === 1, 'a shiny that evolves is shiny in the Log as its new form');
  check(shiny.loaded.radimoth === 1 && shiny.loaded.verdantail === 1, 'an old save marks the shiny forms in the party and the Vault');

  // ---- the Wooden Whistle: the Bag says it flew, so the field menu can close
  await fresh('STARTER EMBROAK');
  await p.evaluate(() => { const C = __cc; C.state.flags.fly = 1; C.state.bag = {}; window.__realFly = C.flyScreen; C.flyScreen = () => Promise.resolve(); window.__bag = null; C.world.run(async () => { window.__bag = await C.bagScreen(); }); });
  await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(200);
  for (let i = 0; i < 10 && (await p.evaluate(() => window.__bag === null)); i++) { await tap('KeyZ'); await p.waitForTimeout(100); }
  const flew = await p.evaluate(() => { __cc.flyScreen = window.__realFly; return window.__bag; });
  check(flew === 'flew', 'after the Wooden Whistle the Bag resolves \'flew\'');

  // ---- numbers in menus use the pixel digits; type icons show
  await fresh('STARTER EMBROAK');
  await p.evaluate(() => { const C = __cc; C.state.bag = { potion: 12, cube: 3 }; C.world.run(() => C.bagScreen()); });
  await p.waitForTimeout(300);
  const bagNums = await p.evaluate(async () => { const C = __cc, nums = [], real = C.num; C.num = function (s) { nums.push(String(s)); return real.apply(this, arguments); }; await C.sleep(0.05); C.num = real; return nums; });
  await tap('KeyX'); await p.waitForTimeout(200);
  check(bagNums.indexOf('12') >= 0 && bagNums.indexOf('3') >= 0, 'the Bag\'s counts are drawn in the pixel digits (' + bagNums.join(' ') + ')');
  const icons = await p.evaluate(() => { const C = __cc; return { fire: !!C.img('ui/type-fire'), w: C.typeBadgeWidth('Fire') - C.textWidth('FIRE', 8), normal: C.typeBadgeWidth('Normal') - C.textWidth('NORMAL', 8) }; });
  check(icons.fire && icons.w === 15 && icons.normal === 6, 'type badges have their icons (Normal has none) ' + JSON.stringify(icons));

  // ---- the party list: the status tag and FAINTED come after the type badges and before the HP numbers
  await fresh('TEAM INKWING 50 BEACONWRAITH 50 CLOVETASTICAL 50 MYSTERYPOP 9');
  const party = await p.evaluate(() => {
    const C = __cc, P = C.state.party; P[0].status = 'shock'; P[1].hp = 0; P[2].status = 'burn'; P[3].status = 'sleep';
    C.partyScreen('field'); const scr = C.top(), rows = [[], [], [], []], row = (y) => Math.floor((y - 18) / 30);
    const rb = C.typeBadge, rs = C.statusTag, rt = C.text, rn = C.num, rd = C.g.drawImage;
    C.typeBadge = function (t, x, y) { const w = rb.apply(this, arguments); rows[row(y)].push(['badge', x, x + w]); return w; };
    let inTag = false; const icons = ['burn', 'freeze', 'shock', 'poison', 'sleep'].map((k) => C.img('ui/status-' + k));
    C.statusTag = function (st, x, y) { if (st) rows[row(y)].push(['tag', x - 10, x + 20]); inTag = true; try { return rs.apply(this, arguments); } finally { inTag = false; } };
    C.g.drawImage = function (img, x, y, w) { if (!inTag && icons.indexOf(img) >= 0) rows[row(y)].push(['icon', x, x + w]); return rd.apply(this, arguments); }; // a status shown as its icon alone
    C.text = function (s, x, y) { if (s === 'FAINTED') rows[row(y)].push(['fainted', x, x + C.textWidth(s, 8)]); return rt.apply(this, arguments); };
    C.num = function (s, x, y, c, al) { if (/\//.test(s)) rows[row(y)].push(['hp', x - C.numWidth(s), x]); return rn.apply(this, arguments); };
    scr.draw(); C.typeBadge = rb; C.statusTag = rs; C.text = rt; C.num = rn; delete C.g.drawImage;
    return rows;
  });
  await p.waitForTimeout(200); await shot('party'); await tap('KeyX'); await p.waitForTimeout(150);
  const clash = [];
  party.forEach((r, i) => r.forEach((a, j) => r.slice(j + 1).forEach((c) => { if (a[1] < c[2] - 0.5 && c[1] < a[2] - 0.5) clash.push(i + ':' + a[0] + '/' + c[0]); })));
  console.log('party rows', JSON.stringify(party.map((r) => r.map((x) => x[0] + ' ' + Math.round(x[1]) + '-' + Math.round(x[2])).join(', '))));
  check(!clash.length && party[1].some((x) => x[0] === 'fainted'), 'nothing in the party list covers a type badge or the HP numbers ' + clash.join(' '));
  check([0, 2, 3].every((i) => party[i].some((x) => x[0] === 'tag' || x[0] === 'icon')), 'every status still shows (as its icon alone when two wide badges leave no room for the tag)');

  // ---- the Creature Log: 4 lines of note above 'A: read more' (clear of the 4th line's tails, at size 8 a line's ink
  // is 8 px tall), letters with a rim of paper over the page's leaf doodle, and list names end before the caught cube
  await fresh('STARTER EMBROAK');
  const logLay = await p.evaluate(() => {
    const C = __cc, ids = C.CREATURE_ORDER; ids.forEach((id) => C.markCaught(id)); C.state.shinyCaught = { constellastar: 1 };
    C.creatureLog(); const scr = C.top(), k = C.canvas.width / 240, res = { note: [], rim: 0, hint: null, names: [] };
    const rt = C.text;
    C.text = function (s, x, y, c, o) {
      const t = C.g.getTransform(), right = (t.a * (x + C.textWidth(s, (o && o.size) || 10)) + t.e) / k;
      if (s === 'A: read more') res.hint = y; else if (c === '#efdcb8') res.rim++; else if (x === 21) res.note.push(y); else if (Math.abs(t.e / k - 162) < 1) res.names.push([s, Math.round(right * 10) / 10]);
      return rt.apply(this, arguments);
    };
    const move = (n) => { for (let i = 0; i < Math.abs(n); i++) { const d = n > 0 ? 'down' : 'up'; C.input.pressed[d] = true; scr.update(); delete C.input.pressed[d]; } };
    const saved = C.LORE.lunarion.note; C.LORE.lunarion.note = 'A long note that fills every line on the page. '.repeat(4);
    move(ids.indexOf('lunarion')); scr.draw(); C.LORE.lunarion.note = saved; // a note that fills all 4 lines
    const note = res.note.slice(), hint = res.hint, rim = res.rim;
    move(ids.indexOf('constellastar') - ids.indexOf('lunarion')); res.names = []; scr.draw(); // the page with the longest name
    C.text = rt; C.input.pressed.b = true; scr.update(); delete C.input.pressed.b;
    res.note = note; res.hint = hint; res.rim = rim;
    return res;
  });
  console.log('Log layout', JSON.stringify(logLay).slice(0, 300));
  check(logLay.note.length === 4 && logLay.hint >= logLay.note[3] + 9 && logLay.hint + 7 <= 143, '4 lines of note, and \'A: read more\' under the last one, still on the page');
  check(logLay.rim === 16, 'the note\'s letters have a rim of paper where the leaf doodle is (' + logLay.rim + ' rim draws for 4 lines)');
  check(logLay.names.length === 13 && logLay.names.every((n) => n[1] <= 216.5), 'list names end before the caught cube and the shiny glint (Constellastar ' + (logLay.names.find((n) => n[0] === 'Constellastar') || [])[1] + ')');

  // ---- play time counts in battles, menus and dialog too, in real time (not dev speed), and not on the title screen
  await fresh('STARTER EMBROAK');
  await p.evaluate(() => { const C = __cc; C.state.playTime = 0; C.dev.speed = 4; C.world.run(() => C.say('Counting the time...')); });
  await p.waitForTimeout(1500);
  const pt = await p.evaluate(() => { const C = __cc; C.dev.speed = 1; return { t: C.state.playTime, top: C.top().name }; });
  console.log('play time after 1.5 s with a dialog open at SPEED 4', JSON.stringify(pt));
  check(pt.top === 'say' && pt.t > 1.1 && pt.t < 2.2, 'play time counts with a dialog open, in real seconds');
  for (let i = 0; i < 3; i++) { await tap('KeyZ'); await p.waitForTimeout(100); }
  const title = await p.evaluate(async () => { const C = __cc, st = C.state; st.playTime = 0; C.stack.length = 0; C.push({ name: 'title', update() {}, draw() {} }); await C.sleep(0.5); const t = st.playTime; C.stack.length = 0; C.push(C.world); return t; });
  check(title === 0, 'play time doesn\'t count without a game on (the title screen)');

  // ---- a screen that breaks can't freeze the game: the loop goes on, and it's reported once
  const broke = await p.evaluate(async () => {
    const C = __cc, logged = [], real = console.error; console.error = function () { logged.push(String(arguments[0])); };
    const bad = C.push({ name: 'broken', update() { throw new Error('update broken on purpose'); }, draw() { throw new Error('draw broken on purpose'); } });
    const t0 = C.time; await new Promise((r) => setTimeout(r, 400)); const alive = C.time > t0;
    C.pop(bad); console.error = real; return { alive, logged };
  });
  console.log('a broken screen', JSON.stringify(broke));
  check(broke.alive && broke.logged.length === 1, 'a screen that throws doesn\'t stop the game, and is reported once');
  check(onPurpose.length === 1, 'the error still reaches the page as an uncaught one, once (' + onPurpose.join(', ') + ')');

  console.log(fails.length ? fails.length + ' checks failed' : 'all checks passed');
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.join('; '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
