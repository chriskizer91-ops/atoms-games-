// The Cube Vault's own screen (a scrolling list with the creature you're on, paging, sorting, taking one out), long
// menus that scroll instead of running off the screen, and the Creature Log's shadows.
//   node tests/14-vault-log.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, OUT } = require('./lib.cjs');
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'] }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
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
    let maxY = 0; const real = C.text; C.text = function (s, x, y) { if (/^Row/.test(s)) maxY = Math.max(maxY, y); return real.apply(this, arguments); };
    m.draw(); C.text = real; res.maxY = maxY;
    for (let i = 0; i < 25; i++) { C.input.pressed.down = true; m.update(); delete C.input.pressed.down; }
    let drawn = []; C.text = function (s) { if (/^Row/.test(s)) drawn.push(s); return real.apply(this, arguments); };
    m.draw(); C.text = real; res.drawn = drawn;
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

  console.log(fails.length ? fails.length + ' checks failed' : 'all checks passed');
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.join('; '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
