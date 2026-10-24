// Lost Pages 1 to 10 through their own scripts, and the expansion's people.
//   node tests/07-lost-pages.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
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
  // 1: Tinker (3 creatures)
  await npc('village', 'tinker'); await p.evaluate(() => { __cc.runCodes('GIVE TUFTAIL 5; GIVE CLOVERMOUSE 5'); }); await npc('village', 'tinker'); console.log('p1', await pages());
  // 2: the hollow apple tree; Marigold's errand
  await deco('orchard', 14, 3); await npc('orchard-farm-in', 'Marigold'); await p.evaluate(() => { __cc.state.caught.wormapple = 1; }); await npc('orchard-farm-in', 'Marigold'); console.log('p2', await pages(), 'errand', await p.evaluate(() => __cc.state.flags.wormErrand));
  // 3: the Grandmother Oak, after Fennick
  await mark('grove'); await npc('grove', 'Old Fennick'); await mark('grove'); console.log('p3', await pages());
  // 4: the bottle; 5: Wren at the top of the lighthouse
  await deco('cove', 11, 11); await npc('isle-light-3', 'Keeper Wren'); console.log('p4 p5', await pages());
  // 6: the three museum plaques, then Professor Hollis
  await npc('cb-museum-in', 'hollis'); for (const x of [2, 5, 8]) await deco('cb-museum-in', x, 1); await npc('cb-museum-in', 'hollis'); console.log('p6', await pages());
  // 7: the lunchbox; 8: Auntie Yuzu (first she feeds you)
  await deco('mine', 2, 13); await npc('springs-inn-in', 'Auntie Yuzu'); await npc('springs-inn-in', 'Auntie Yuzu'); console.log('p7 p8', await pages(), 'soup', await p.evaluate(() => __cc.state.bag.warmsoup));
  // Willow's rewards for 4 and 8 pages
  await npc('willow-in', 'willow'); console.log('willow', await p.evaluate(() => JSON.stringify({ p4: __cc.state.flags.pages4, p8: __cc.state.flags.pages8 })));
  // 9: the stump (day: nothing; night: the page)
  await p.evaluate(() => { __cc.dev.time = 'day'; }); await deco('bayou', 21, 19); await p.evaluate(() => { __cc.dev.time = 'night'; }); await deco('bayou', 21, 19); await p.evaluate(() => { __cc.dev.time = null; }); console.log('p9', await pages());
  // 10: Ilsa, then the blank wall with three Glyphlings
  await npc('archive', 'Archivist Ilsa'); await deco('archive', 2, 4); await p.evaluate(() => { __cc.runCodes('GIVE GLYPHLING 30; GIVE GLYPHLING 30; GIVE GLYPHLING 30'); }); await deco('archive', 2, 4); console.log('p10', await pages());
  // the school quiz (answer 0, 1, 0), the shops, the boat, the inn
  for (const [i, picks] of [[0, 0], [1, 1], [2, 0]]) { await p.evaluate((i) => { const C = __cc; C.world.enter('cb-school-in', 1, 1, 'down'); C.world.busy = false; C.world.run(C.NPCS['cb-school-in'][i + 1].talk); }, i); await p.waitForTimeout(500);
    await tap('KeyZ'); await p.waitForTimeout(300); for (let k = 0; k < picks; k++) await tap('ArrowDown'); await mash(); }
  await npc('cb-school-in', 'poppy'); console.log('quiz', await p.evaluate(() => [0, 1, 2].map(i => __cc.state.flags['quiz' + i]).join(',') + ' poppy gift ' + __cc.state.flags['gift:poppy']));
  await p.evaluate(() => { __cc.state.flags.boatTicket = false; }); await npc('cove', 'Fisher Gus'); console.log('ticket from cove Gus', await p.evaluate(() => __cc.state.flags.boatTicket));
  await npc('cove', 'Fisher Gus'); console.log('boat ->', await p.evaluate(() => __cc.state.map + ' ' + __cc.state.x + ',' + __cc.state.y));
  await npc('isle', 'Fisher Gus'); console.log('boat back ->', await p.evaluate(() => __cc.state.map));
  const coins0 = await p.evaluate(() => __cc.state.coins); await p.evaluate(() => { __cc.state.clockShift = 0; }); await npc('inn-in', 'rosa'); console.log('inn', coins0 - await p.evaluate(() => __cc.state.coins), 'shift', await p.evaluate(() => __cc.state.clockShift.toFixed(2) + ' hour ' + __cc.gameHour().toFixed(1)));
  console.log('said sample:\n  ' + said.filter(t => /NO |Lost Page|Ultra|Great Cubes|Whoa|Kindness|coaster/.test(t)).slice(0, 30).join('\n  '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
