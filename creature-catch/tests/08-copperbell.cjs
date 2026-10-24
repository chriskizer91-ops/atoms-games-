// Copperbell: the museum plaques and Page 6, the school quiz, and more of the town's people.
//   node tests/08-copperbell.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  const tap = async (k) => { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(90); };
  const said = [];
  await p.exposeFunction('logSay', (t) => said.push(t));
  const mash = async (max = 300) => { for (let i = 0; i < max; i++) { const st = await p.evaluate(() => ({ busy: __cc.world.busy, n: __cc.stack.length })); if (!st.busy && st.n === 1) return i; await tap('KeyZ'); } console.log('stuck', await p.evaluate(() => __cc.stack.map(x => x.name || '?').join('>'))); return -1; };
  await p.evaluate(() => { const C = __cc; const say = C.say; C.say = function (t, o) { window.logSay((o && o.who ? o.who + ': ' : '') + t); return say.apply(this, arguments); };
    C.stack.length = 0; C.state = C.newState(); C.world.enter('village', 10, 6, 'down'); C.push(C.world); C.runCodes('STARTER EMBROAK; MAX; GOD; ONEHIT; STOCKUP; TRIAL ALL'); C.dev.noWild = true; });
  // run something: an NPC (map + its name or art), a decor at x,y, or a landmark
  const npc = async (map, who) => { await p.evaluate(([map, who]) => { const C = __cc; C.world.enter(map, 1, 1, 'down'); C.world.busy = false;
      const n = (C.NPCS[map] || []).find(n => n.name === who || n.art === who || n.look === who); if (!n) { window.logSay('NO NPC ' + who); return; } C.world.run(n.talk); }, [map, who]); await mash(); };
  const deco = async (map, x, y) => { await p.evaluate(([map, x, y]) => { const C = __cc; C.world.enter(map, 1, 1, 'down'); C.world.busy = false;
      const d = C.MAPS[map].decor.find(d => d.x === x && d.y === y && d.talk); if (!d) { window.logSay('NO DECOR ' + map + ' ' + x + ',' + y); return; } C.world.run(() => C.useFurniture(d)); }, [map, x, y]); await mash(); };
  const mark = async (map) => { await p.evaluate((map) => { const C = __cc; C.world.enter(map, 1, 1, 'down'); C.world.busy = false; C.world.run(C.MAPS[map].landmarkTalk); }, map); await mash(); };
  const pages = () => p.evaluate(() => Object.keys(__cc.state.pages || {}).join(','));
  await npc('cb-museum-in', 'hollis'); for (const x of [2, 5, 8]) await deco('cb-museum-in', x, 1); await npc('cb-museum-in', 'hollis'); console.log('p6', await pages());
  await p.evaluate(() => { const C = __cc; C.world.enter('cb-school-in', 1, 1, 'down'); C.world.busy = false; C.world.run(C.NPCS['cb-school-in'][2].talk); }); await p.waitForTimeout(500);
  await tap('ArrowDown'); await p.waitForTimeout(200); await mash();
  console.log('quiz1', await p.evaluate(() => __cc.state.flags.quiz1));
  await npc('cb-museum-in', 'hollis');
  console.log('said sample:\n  ' + said.filter(t => /NO |Lost Page|Hollis|Nell/.test(t)).slice(0, 30).join('\n  '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
