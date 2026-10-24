// The full game: a route trainer spotting you, Juniper in the Crystal Cave, Dusty's trial and the whistle, Fly, Tobias, Continue.
//   node tests/02-full-game.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, GUIDE, OUT, shotPath } = require('./lib.cjs');
const { chromium } = require('playwright');
(async () => {
  const out = OUT;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME);
  await p.waitForTimeout(2000);
  const shot = (n) => p.screenshot({ path: `${out}/02-${n}.png` });
  const tap = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.down(k); await p.waitForTimeout(40); await p.keyboard.up(k); await p.waitForTimeout(90); } };
  const mash = async (max = 200) => { for (let i = 0; i < max; i++) { const st = await p.evaluate(() => ({ busy: __cc.world.busy, n: __cc.stack.length })); if (!st.busy && st.n === 1) return i; await tap('KeyZ'); } return -1; };
  const walk = async (k, ms) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); };
  await p.evaluate(() => { const C = __cc; C.state = C.newState(); C.stack.length = 0; C.push(C.world); C.runCodes('STARTER MOSSBACK; TEAM INFERNOTOAD 45; TRIAL DONE'); C.state.party[0].moves = [{ id: 'tackle', pp: 99 }]; C.dev.noWild = true; C.dev.oneHit = true; C.dev.god = true; C.state.flags.juniper2 = true; C.world.enter('forest', 12, 9, 'up'); });
  await p.waitForTimeout(300);
  await walk('ArrowUp', 250); await p.waitForTimeout(500); await shot('01-scout-sees');
  await p.waitForTimeout(1200); await shot('02-scout-walked');
  await mash(300); console.log('scout', await p.evaluate(() => __cc.state.flags['tr:forest-1']));
  // cave rival from a good spot
  await p.evaluate(() => { __cc.runCodes('TRIAL WATER'); __cc.world.enter('cave', 15, 8, 'up'); });
  await walk('ArrowUp', 700); await p.waitForTimeout(400);
  await walk('ArrowLeft', 500); await walk('ArrowUp', 900); await p.waitForTimeout(1500); await shot('03-rival3');
  await mash(400); console.log('rival3', await p.evaluate(() => __cc.state.flags.juniper3), await p.evaluate(() => __cc.state.x + ',' + __cc.state.y));
  // Dusty trial gives the whistle
  await p.evaluate(() => { __cc.world.enter('cave', 14, 2, 'up'); });
  await tap('KeyZ'); await p.waitForTimeout(300);
  for (let i = 0; i < 300; i++) { const nm = await p.evaluate(() => __cc.stack.map(x => x.name).join(',')); if (nm.includes('prize')) break; await tap('KeyZ'); }
  await p.waitForTimeout(400); await shot('04-charm');
  await mash(300); console.log('dusty', await p.evaluate(() => [__cc.state.flags.trialCave, __cc.state.flags.fly]));
  await shot('05-cave-open');
  // desert: Tobias in outpost
  await p.evaluate(() => { __cc.world.enter('outpost-in-desert', 6, 5, 'right'); }); await p.waitForTimeout(300); await shot('06-tobias-room');
  await tap('KeyZ'); await p.waitForTimeout(300); await tap('KeyZ'); await p.waitForTimeout(500); await shot('07-tobias-shop');
  await tap('KeyX'); await mash(20);
  // shards: give dandylion + sun shard, use from bag
  await p.evaluate(() => { const C = __cc; C.state.party.push(C.mon.make('dandylion', 20)); C.state.bag.sunshard = 1; });
  // fly screen
  await p.evaluate(() => { __cc.world.enter('desert', 14, 15, 'down'); __cc.state.visited = { village: 1, meadow: 1, grassland: 1, forest: 1, water: 1, cave: 1, desert: 1 }; });
  await tap('KeyE'); await p.waitForTimeout(500); await shot('08-fly');
  await tap('ArrowLeft'); await tap('ArrowLeft'); await p.waitForTimeout(200); await shot('09-fly-pick'); await tap('KeyZ'); await p.waitForTimeout(3500); await shot('10-landed');
  console.log('flew to', await p.evaluate(() => __cc.state.map + ' ' + __cc.state.x + ',' + __cc.state.y));
  await mash(20);
  // weather shots
  for (const [m, x, y] of [['desert', 11, 18], ['snow', 11, 18], ['swamp', 14, 18], ['ruins', 12, 18], ['cave', 12, 20], ['water', 14, 18], ['forest', 11, 18]]) {
    await p.evaluate(([m, x, y]) => { __cc.world.enter(m, x, y, 'down'); __cc.world.banner = null; }, [m, x, y]); await p.waitForTimeout(1200); await shot('w-' + m);
  }
  // wild battle in the desert for bg
  await p.evaluate(() => { __cc.world.enter('desert', 11, 18, 'down'); __cc.world.run(() => __cc.wildEncounter('desert')); });
  await p.waitForTimeout(800); await shot('11-desert-hop'); await p.waitForTimeout(2500); await shot('12-desert-battle');
  // save + continue
  await mash(200);
  await p.evaluate(() => { __cc.saveGame(); });
  await p.reload(); await p.waitForTimeout(2000); await tap('KeyZ'); await p.waitForTimeout(500); await tap('KeyZ'); await p.waitForTimeout(400); await tap('KeyZ'); await p.waitForTimeout(800);
  console.log('continued', await p.evaluate(() => __cc.state.map + ' ' + JSON.stringify(Object.keys(__cc.state.flags))));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
