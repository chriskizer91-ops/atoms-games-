// Headless check of the Stage 1 loop: loads index.html, plays through the
// hook / shark / spear / hammer / swim moments with simulated input, saves a
// screenshot of each, and fails on console errors or broken expectations.
//
//   NODE_PATH=/opt/node-tools/node_modules node tools/smoke.js [outDir]

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', 'out'));
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForFunction(() => window.__game);
  // The test drives frames itself and only renders right before a screenshot.
  await page.evaluate(() => {
    const G = window.__game;
    G.hold = true;
    const step = G.step.bind(G);
    G.step = (sec, fn) => step(sec, fn, false);
    // Software rendering: refresh the sky lighting less often than the game does.
    G.weather.envInterval = 20;
    G.draw();
  });
  await page.waitForTimeout(500);
  const shot = async (name) => {
    await page.evaluate(() => window.__game.draw());
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), timeout: 120000 });
    console.log('shot', name);
  };
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  };

  await shot('01-title');

  await page.evaluate(() => { document.getElementById('play').click(); });
  await page.waitForTimeout(300);
  const freeLook = await page.evaluate(() => window.__game.input.state.freeLook);
  console.log('pointer lock refused -> free look:', freeLook);

  // Helpers inside the page
  await page.evaluate(() => {
    const G = window.__game;
    G.aimAt = (x, y, z) => {
      const p = G.player.state;
      const ex = p.pos.x, ey = G.camera.position.y, ez = p.pos.z;
      const dx = x - ex, dy = y - ey, dz = z - ez;
      p.yaw = Math.atan2(-dx, -dz);
      p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    };
    G.click = (button = 0, holdFrames = 1) => {
      G.input.state.mouse[button] = true;
      G.input.state.clicked[button] = true;
      G.step(holdFrames / 60);
      G.input.state.mouse[button] = false;
      G.input.state.released[button] = true;
    };
    G.key = (code) => {
      // one-frame press
      const ev = new KeyboardEvent('keydown', { code });
      window.dispatchEvent(ev);
      G.step(1 / 60);
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
    };
  });

  // 1. Looking out at the sea
  await page.evaluate(() => { const G = window.__game; G.player.state.yaw = 0; G.player.state.pitch = -0.12; G.step(2); });
  await shot('02-on-raft');

  // 2. Throw the hook at the nearest floating thing upstream and reel it in.
  const hook = await page.evaluate(() => {
    const G = window.__game;
    const p = G.player.state;
    const cand = G.debris.items
      .filter((d) => d.z < p.pos.z - 6 && d.z > p.pos.z - 16 && Math.abs(d.x - p.pos.x) < 6)
      .sort((a, b) => b.z - a.z)[0] || G.debris.items[0];
    // place one right where the hook will land to make the check deterministic
    const target = G.debris.spawn('plank', p.pos.x, p.pos.z - 9);
    G.aimAt(target.x, 1.6, target.z);
    p.pitch = 0.25;
    G.input.state.mouse[0] = true; G.input.state.clicked[0] = true;
    G.step(0.45);
    G.input.state.mouse[0] = false; G.input.state.released[0] = true;
    G.step(0.05);
    const mode1 = G.tools.state.hook.mode;
    G.step(2.0);
    const landed = { mode: G.tools.state.hook.mode, x: G.tools.state.hook.pos.x, z: G.tools.state.hook.pos.z, tz: target.z };
    return { mode1, landed, carried: G.tools.state.hook.carried.length };
  });
  await shot('03-hook-out');
  check('hook flies then lands in water', hook.mode1 === 'flying' && hook.landed.mode === 'water', JSON.stringify(hook));

  const reeled = await page.evaluate(() => {
    const G = window.__game;
    const before = { ...G.inventory.items };
    // drop the hook right on a plank so it snags
    const h = G.tools.state.hook;
    const d = G.debris.spawn('plank', h.pos.x, h.pos.z);
    G.step(0.1);
    const snagged = h.carried.length;
    G.input.state.mouse[0] = true;
    G.step(1.0);
    const mid = h.mode;
    G.step(5);
    G.input.state.mouse[0] = false;
    G.step(0.1);
    return { snagged, mid, mode: h.mode, woodBefore: before.wood, woodAfter: G.inventory.items.wood };
  });
  check('hook snags and reels in wood', reeled.snagged > 0 && reeled.mode === 'held' && reeled.woodAfter > reeled.woodBefore, JSON.stringify(reeled));

  // 3. Shark attacks the raft
  const attack = await page.evaluate(() => {
    const G = window.__game;
    G.shark.forceAttack();
    let t = 0;
    while (G.shark.state !== 'bite' && t < 40) { G.step(0.5); t += 0.5; }
    const tgt = G.shark.target;
    G.step(3);
    return { state: G.shark.state, t, hp: tgt && Math.round(tgt.tile.hp), tile: tgt && [tgt.tile.i, tgt.tile.j], side: tgt && tgt.side };
  });
  check('shark reaches the raft and bites a floor piece', attack.state === 'bite' && attack.hp < 100, JSON.stringify(attack));

  await page.evaluate(() => {
    const G = window.__game;
    const tgt = G.shark.target;
    const p = G.player.state;
    // stand on the bitten tile, near its open edge, and look at the shark
    const T = G.TILE;
    p.pos.x = tgt.tile.i * T + tgt.side[0] * T * 0.3;
    p.pos.z = tgt.tile.j * T + tgt.side[1] * T * 0.3;
    G.tools.setSlot(1, G.player);
    G.step(0.4);
    const h = G.shark.headPosition();
    G.aimAt(h.x, h.y, h.z);
    G.step(0.05);
  });
  await shot('04-shark-biting');

  // 4. Spear it until it flees
  const spear = await page.evaluate(() => {
    const G = window.__game;
    const log = [];
    for (let i = 0; i < 6 && G.shark.state !== 'flee'; i++) {
      const h = G.shark.headPosition();
      const mid = G.shark.pos;
      G.aimAt((h.x + mid.x) / 2, (h.y + mid.y) / 2, (h.z + mid.z) / 2);
      G.click(0, 1);
      G.step(0.6);
      log.push(G.shark.state);
    }
    return { state: G.shark.state, log, repels: G.game.counters.repels, scars: G.shark.scars };
  });
  check('spear drives the shark off', spear.state === 'flee' && spear.repels === 1, JSON.stringify(spear));
  check('driving it off leaves a scar', spear.scars === 1, JSON.stringify(spear));
  await shot('05-shark-fleeing');

  // 5. Hammer repair on the bitten tile
  const repair = await page.evaluate(() => {
    const G = window.__game;
    const tile = [...G.raft.tiles.values()].find((t) => !t.broken && t.hp < 100);
    if (!tile) return { error: 'no damaged tile' };
    G.inventory.items.wood += 5;
    G.tools.setSlot(2, G.player);
    G.step(0.4);
    const T = G.TILE;
    const p = G.player.state;
    p.pos.x = tile.i * T; p.pos.z = tile.j * T + 1.2 * (tile.j <= 0 ? 1 : -1);
    G.step(0.1);
    G.aimAt(tile.i * T, 0.45, tile.j * T);
    G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    const before = tile.hp;
    G.click(0, 1);
    G.step(0.6);
    return { prompt, before: Math.round(before), after: Math.round(tile.hp), wood: G.inventory.items.wood };
  });
  await shot('06-hammer-repair');
  check('hammer repairs a bitten floor', repair.after > repair.before, JSON.stringify(repair));

  // 6. Break a tile, then rebuild it
  const rebuild = await page.evaluate(() => {
    const G = window.__game;
    const list = G.raft.attackable();
    const { tile, side } = list.find((c) => c.tile.i !== 0 || c.tile.j !== 0);
    while (!tile.broken) G.raft.damage(tile, 50, side);
    G.inventory.items.wood += 3; G.inventory.items.fiber += 2;
    const T = G.TILE;
    const p = G.player.state;
    p.pos.set(0, p.pos.y, 0);
    G.step(0.2);
    G.aimAt(tile.i * T, 0.45, tile.j * T);
    G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    const brokenBefore = tile.broken;
    G.click(0, 1);
    G.step(0.6);
    return { prompt, brokenBefore, brokenAfter: tile.broken, hp: tile.hp };
  });
  check('hammer rebuilds a broken floor', rebuild.brokenBefore && !rebuild.brokenAfter && rebuild.hp === 100, JSON.stringify(rebuild));

  // 7. Walk off the edge, swim, get chased, climb back
  const swim = await page.evaluate(() => {
    const G = window.__game;
    const p = G.player.state;
    p.pos.set(0, p.pos.y, 0);
    p.yaw = Math.PI / 2; // face -x
    G.tools.setSlot(0, G.player);
    G.step(0.2);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    let t = 0;
    while (!p.inWater && t < 5) { G.step(0.1); t += 0.1; }
    G.step(0.6);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    const inWater = p.inWater;
    G.shark.holdOff(0);
    G.step(0.2);
    return { inWater, t: +t.toFixed(1), x: +p.pos.x.toFixed(2) };
  });
  check('walking off the edge drops you in the water', swim.inWater, JSON.stringify(swim));
  await page.evaluate(() => { const G = window.__game; G.player.state.yaw = -Math.PI / 2; G.player.state.pitch = -0.1; G.step(0.5); });
  await shot('07-swimming');

  const chase = await page.evaluate(() => {
    const G = window.__game;
    const start = G.game.stats.health;
    let t = 0;
    const states = new Set();
    while (t < 20 && G.game.stats.health === start) { G.step(0.25); t += 0.25; states.add(G.shark.state); }
    return { t, health: Math.round(G.game.stats.health), states: [...states] };
  });
  check('shark hunts and bites a swimmer', chase.health < 100, JSON.stringify(chase));
  await page.evaluate(() => {
    const G = window.__game;
    const s = G.shark.pos;
    G.aimAt(s.x, s.y + 0.3, s.z);
    G.step(0.05);
  });
  await shot('08-shark-chase');

  const climb = await page.evaluate(() => {
    const G = window.__game;
    const p = G.player.state;
    // swim back toward the raft and climb on
    const c = G.raft.climbPoint(p.pos.x, p.pos.z);
    p.pos.x = c.x - 0.95; p.pos.z = c.z;
    G.step(0.1);
    const canClimb = p.canClimb;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    G.step(1 / 60);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    G.step(0.3);
    return { canClimb, inWater: p.inWater, grounded: p.grounded };
  });
  check('space climbs back aboard', climb.canClimb && !climb.inWater, JSON.stringify(climb));

  // 8. Coconut
  const coco = await page.evaluate(() => {
    const G = window.__game;
    G.inventory.items.coconut = 2;
    G.game.stats.thirst = 50;
    G.tools.setSlot(3, G.player);
    G.step(0.4);
    G.click(0, 1);
    G.step(1.2);
    return { coconut: G.inventory.items.coconut, thirst: Math.round(G.game.stats.thirst) };
  });
  check('coconut restores food and water', coco.coconut === 1 && coco.thirst > 60, JSON.stringify(coco));

  // 9. Save state round-trip
  const snap = await page.evaluate(() => {
    const G = window.__game;
    const s = JSON.parse(JSON.stringify(G.serialize()));
    G.restore(s);
    G.step(0.1);
    return { tiles: G.raft.tiles.size, wood: G.inventory.items.wood };
  });
  check('state serialises and restores', snap.tiles === 9, JSON.stringify(snap));

  // ---------- Stage 2 ----------
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame(); G.game.mode = 'play';
    G.shark.holdOff(999);
    Object.assign(G.inventory.items, { wood: 30, plastic: 10, fiber: 12, fish: 0 });
    G.step(0.2);
  });

  // 11. Build a floor piece east of the raft
  const floor = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    p.pos.set(1 * T, p.pos.y, 0);
    G.tools.setSlot(2, G.player);
    G.step(0.4);
    G.aimAt(2 * T, 0.35, 0);
    G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1);
    G.step(0.6);
    return { prompt, tiles: G.raft.tiles.size, built: !!G.raft.tileAt(2, 0), wood: G.inventory.items.wood };
  });
  check('hammer builds a new floor piece', floor.built && floor.tiles === 10 && floor.prompt === 'Build floor', JSON.stringify(floor));

  // 12. Switch to nets and hang one off the upstream edge
  const net = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.input.state.mouse[2] = true; G.input.state.clicked[2] = true; G.step(1 / 60); G.input.state.mouse[2] = false;
    G.step(0.1);
    const mode = G.tools.state.hammerMode;
    p.pos.set(0, p.pos.y, -1 * T);
    G.step(0.1);
    G.aimAt(0, 0.25, -1.5 * T - 0.55);
    G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1);
    G.step(0.6);
    return { mode, prompt, nets: G.nets.count() };
  });
  check('hammer puts up a catch net', net.mode === 'net' && net.nets === 1, JSON.stringify(net));

  // 13. Something drifting into the net gets caught; a fish swims in too
  const catchRes = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE;
    const n = [...G.nets.nets.values()][0];
    const d = G.debris.spawn('plank', 0.1, -1.5 * T - 5);
    let t = 0;
    while (!d.caught && t < 12) { G.step(0.25); t += 0.25; }
    n.fishTimer = 0;
    G.step(0.1);
    return { caught: !!d.caught, t, contents: G.nets.contentsOf(n), fish: n.fish.length };
  });
  check('a net catches drifting material and fish', catchRes.caught && catchRes.fish === 1 && catchRes.contents >= 2, JSON.stringify(catchRes));
  await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.tools.setSlot(0, G.player);
    p.pos.set(0.5, p.pos.y, -0.6 * T); G.step(0.2);
    G.aimAt(-0.2, 0.0, -1.5 * T - 0.6); G.step(0.05);
  });
  await shot('11-net-catch');

  // 14. Empty it with E
  const haul = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    const before = { ...G.inventory.items };
    p.pos.set(0, p.pos.y, -1 * T); G.step(0.1);
    G.aimAt(0, 0.1, -1.5 * T - 0.5); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE');
    G.step(0.1);
    const n = [...G.nets.nets.values()][0];
    return { prompt, wood: G.inventory.items.wood - before.wood, fish: G.inventory.items.fish - before.fish, left: G.nets.contentsOf(n) };
  });
  check('E empties a net into your pack', haul.wood > 0 && haul.fish === 1 && haul.left === 0, JSON.stringify(haul));

  // 15. Eat a raw fish
  const eat = await page.evaluate(() => {
    const G = window.__game;
    G.inventory.items.fish = 2; G.game.stats.hunger = 40;
    G.tools.setSlot(4, G.player); G.step(0.4);
    G.click(0, 1); G.step(1.2);
    return { fish: G.inventory.items.fish, hunger: Math.round(G.game.stats.hunger) };
  });
  check('raw fish can be eaten', eat.fish === 1 && eat.hunger > 50, JSON.stringify(eat));

  // 16. Throw the other as bait; the shark goes for it instead of the raft
  const lure = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    p.pos.set(0, p.pos.y, 0); p.yaw = Math.PI / 2; p.pitch = 0.15; G.step(0.1);
    G.input.state.mouse[2] = true; G.input.state.clicked[2] = true; G.step(1 / 60); G.input.state.mouse[2] = false;
    G.step(1.6);
    const floating = G.bait.items.filter((b) => b.mode === 'water').length;
    G.shark.forceAttack();
    const states = [];
    let t = 0;
    while (G.shark.state !== 'distracted' && t < 40) { G.step(0.5); t += 0.5; if (states[states.length - 1] !== G.shark.state) states.push(G.shark.state); }
    return { floating, states, t, baited: G.game.counters.baited, fish: G.inventory.items.fish };
  });
  check('bait lures the shark away and keeps it busy', lure.floating === 1 && lure.states.includes('bait') && lure.baited === 1, JSON.stringify(lure));
  await page.evaluate(() => {
    const G = window.__game; const s = G.shark.pos; G.tools.setSlot(1, G.player);
    G.step(0.3); G.aimAt(s.x, s.y, s.z); G.step(0.05);
  });
  await shot('12-shark-distracted');

  // 17. A shark biting a netted edge tears the net first
  const torn = await page.evaluate(() => {
    const G = window.__game;
    const n = [...G.nets.nets.values()][0];
    const before = G.nets.count();
    const ok = G.nets.breakAt(n.tile, n.side);
    return { ok, before, after: G.nets.count() };
  });
  check('a net can be torn off', torn.ok && torn.after === torn.before - 1, JSON.stringify(torn));

  // 18. Nets, new floor and scars survive save/restore
  const snap2 = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE;
    const tile = G.raft.tileAt(1, -1);
    G.nets.add(tile, [0, -1]);
    G.shark.restore({ x: 20, z: 5, attackTimer: 60, scars: 2 });
    const s = JSON.parse(JSON.stringify(G.serialize()));
    G.restore(s);
    G.step(0.1);
    return { tiles: G.raft.tiles.size, nets: G.nets.count(), scars: G.shark.scars };
  });
  check('stage 2 state survives save/restore', snap2.tiles === 10 && snap2.nets === 1 && snap2.scars === 2, JSON.stringify(snap2));

  // ---------- Stage 3 ----------
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame(); G.game.mode = 'play';
    G.shark.holdOff(999);
    Object.assign(G.inventory.items, { wood: 40, plastic: 20, fiber: 30, scrap: 10, fish: 3 });
    G.step(0.2);
  });

  // 19. Night falls: the sky darkens and the water starts to glow
  const night = await page.evaluate(() => {
    const G = window.__game;
    G.weather.setTime(23);
    G.step(0.3);
    return { night: +G.weather.state.hour.toFixed(1), glow: G.oceanGlow ? 1 : 0, sunUp: +window.__game.camera.position.y.toFixed(1) };
  });
  const nightInfo = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    p.pos.set(0, p.pos.y, 1.2); p.yaw = 0; p.pitch = -0.05; G.step(0.1);
    // a shark swimming past near the surface leaves a glowing wake
    G.shark.holdOff(999);
    G.step(1.5);
    return { hour: Math.round(G.weather.state.hour) };
  });
  check('time passes into night', nightInfo.hour >= 23 || nightInfo.hour <= 1, JSON.stringify(nightInfo));
  await shot('13-night');

  // 20. A storm: rain, darker sky, bigger swell; warmth drops without clothes
  const storm = await page.evaluate(() => {
    const G = window.__game;
    G.weather.setWeather('storm', true);
    G.game.stats.warmth = 80;
    G.step(5);
    const bare = G.game.stats.warmth;
    return { bare: Math.round(bare), kind: G.weather.state.kind };
  });
  check('cold and storm drain warmth', storm.bare < 80, JSON.stringify(storm));
  await page.evaluate(() => { const G = window.__game; G.weather.setTime(15); G.step(0.5); G.player.state.pitch = 0.05; G.step(0.1); });
  await shot('14-storm');

  // 21. Crafting: open the panel, make a hat and a poncho, wear them
  const craft = await page.evaluate(() => {
    const G = window.__game;
    G.openMenu();
    const open = !document.getElementById('craft').hidden;
    G.crafting.make('palmHat');
    G.crafting.make('tarpPoncho');
    G.step(0.1);
    const b = G.crafting.buffs();
    return { open, head: G.crafting.worn('head'), body: G.crafting.worn('body'), heatShield: b.heatShield, insulation: b.insulation, fiber: G.inventory.items.fiber };
  });
  await shot('15-crafting');
  check('crafting panel makes and wears clothing', craft.open && craft.head === 'palmHat' && craft.body === 'tarpPoncho' && craft.insulation > 0.4, JSON.stringify(craft));
  const warmer = await page.evaluate(() => {
    const G = window.__game;
    G.closeMenu(false); G.game.menu = false; G.input.state.enabled = true;
    G.game.stats.warmth = 80;
    G.step(5);
    return { dressed: Math.round(G.game.stats.warmth) };
  });
  check('a poncho keeps more warmth in the storm', warmer.dressed > storm.bare, JSON.stringify({ bare: storm.bare, dressed: warmer.dressed }));

  // 22. Gear: metal spear and a bandage
  const gear = await page.evaluate(() => {
    const G = window.__game;
    G.game.stats.health = 50;
    G.crafting.make('bandage');
    G.crafting.make('metalSpear');
    return { health: Math.round(G.game.stats.health), metal: G.crafting.hasGear('metalSpear') };
  });
  check('bandage heals, metal spear is made', gear.health === 80 && gear.metal, JSON.stringify(gear));

  // 23. Build a grill, light it, cook a fish, get warm by it
  const grill = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.weather.setWeather('clear', true);
    G.tools.setSlot(2, G.player); G.step(0.3);
    const rc = () => { G.input.state.mouse[2] = true; G.input.state.clicked[2] = true; G.step(1 / 60); G.input.state.mouse[2] = false; G.step(0.05); };
    while (G.tools.state.hammerMode !== 'grill') rc();
    p.pos.set(0, p.pos.y, 0.8); G.step(0.1);
    G.aimAt(T, 0.6, -T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    const built = G.stations.count('grill');
    G.tools.setSlot(0, G.player); G.step(0.3);
    p.pos.set(T * 0.4, p.pos.y, -T * 0.4); G.step(0.1);
    G.aimAt(T, 0.62, -T); G.step(0.05);
    const p1 = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    const p2 = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(11);
    const p3 = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    G.weather.setTime(23); G.game.stats.warmth = 40; G.step(4);
    return { prompt, built, p1, p2, p3, cooked: G.inventory.items.cooked, warmth: Math.round(G.game.stats.warmth) };
  });
  check('grill: build, light, cook a fish', grill.built === 1 && grill.cooked === 1, JSON.stringify(grill));
  check('a lit fire warms you at night', grill.warmth > 40, JSON.stringify({ warmth: grill.warmth }));
  await page.evaluate(() => { const G = window.__game; const T = G.TILE; G.aimAt(T, 0.5, -T); G.player.state.pitch -= 0.1; G.step(0.3); });
  await shot('16-grill-night');

  // 24. Rain catcher fills in the rain; drink from it
  const catcher = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.weather.setTime(11);
    G.tools.setSlot(2, G.player); G.step(0.3);
    const rc = () => { G.input.state.mouse[2] = true; G.input.state.clicked[2] = true; G.step(1 / 60); G.input.state.mouse[2] = false; G.step(0.05); };
    while (G.tools.state.hammerMode !== 'catcher') rc();
    p.pos.set(-T * 0.3, p.pos.y, T * 0.3); G.step(0.1);
    G.aimAt(-T, 0.6, T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    G.weather.setWeather('rain', true);
    G.step(16);
    const st = [...G.stations.list.values()].find((s) => s.kind === 'catcher');
    const cups = st ? st.cups : -1;
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.game.stats.thirst = 40;
    G.aimAt(-T, 0.9, T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    return { cups, prompt, thirst: Math.round(G.game.stats.thirst), built: G.stations.count('catcher') };
  });
  check('rain catcher fills in rain and you can drink', catcher.built === 1 && catcher.cups >= 1 && catcher.thirst > 60, JSON.stringify(catcher));

  // 25. A tooth left in the floor can be picked up
  const tooth = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.weather.setWeather('clear', true);
    const tile = G.raft.tileAt(0, -1);
    G.events.onToothLost(tile, [0, -1]);
    const d = G.debris.items.find((x) => x.type === 'tooth');
    p.pos.set(d.x, p.pos.y, d.z + 1.0); G.step(0.1);
    G.aimAt(d.x, d.mesh.position.y, d.z); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    return { prompt, teeth: G.inventory.items.tooth };
  });
  check('shark teeth stuck in the floor can be picked up', tooth.teeth === 1, JSON.stringify(tooth));

  // 26. The reef shark, at max scars, leaves for good and drops its jaw; a hammerhead follows
  const leave = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.shark.restore({ x: 20, z: 5, attackTimer: 0, scars: 6 });
    G.shark.forceAttack();
    let t = 0;
    while (G.shark.state !== 'bite' && t < 40) { G.step(0.5); t += 0.5; }
    const tgt = G.shark.target;
    p.pos.x = tgt.tile.i * T + tgt.side[0] * T * 0.3; p.pos.z = tgt.tile.j * T + tgt.side[1] * T * 0.3;
    G.tools.setSlot(1, G.player); G.step(0.4);
    for (let i = 0; i < 6 && G.shark.state !== 'leave'; i++) {
      const h = G.shark.headPosition(), m = G.shark.pos;
      G.aimAt((h.x + m.x) / 2, (h.y + m.y) / 2, (h.z + m.z) / 2);
      G.click(0, 1); G.step(0.6);
    }
    const state = G.shark.state;
    G.step(10);
    const gone = G.shark.gone;
    const jaw = G.debris.items.some((d) => d.type === 'jaw');
    G.game.nextPredatorIn = 0.1;
    G.step(0.3);
    return { state, gone, jaw, tier: G.shark.tier.name };
  });
  check('the scarred reef shark leaves for good and drops its jaw', leave.state === 'leave' && leave.gone && leave.jaw, JSON.stringify(leave));
  check('a hammerhead arrives after it', leave.tier === 'Hammerhead', JSON.stringify(leave));

  // 27. The hammerhead rams the raft and throws you off your feet
  const ram = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    let rams = 0;
    const orig = G.events.onRam;
    G.events.onRam = (...a) => { rams++; orig(...a); };
    G.shark.forceAttack(true);
    let t = 0, charging = false;
    while (rams === 0 && t < 60) {
      G.step(0.25); t += 0.25;
      const tgt = G.shark.target;
      if (tgt && !charging && G.shark.state === 'approach') {
        // stand near the edge it is heading for
        p.pos.set(tgt.tile.i * T + tgt.side[0] * T * 0.35, p.pos.y, tgt.tile.j * T + tgt.side[1] * T * 0.35);
        p.inWater = false; p.grounded = true;
        charging = true;
      }
    }
    G.step(1.5);
    G.events.onRam = orig;
    return { rams, t, inWater: p.inWater };
  });
  check('the hammerhead rams the raft and can knock you in', ram.rams === 1 && ram.inWater, JSON.stringify(ram));
  await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.shark.holdOff(999);
    const s = G.shark.pos; p.yaw = Math.atan2(-(s.x - p.pos.x), -(s.z - p.pos.z)); p.pitch = -0.15; G.step(0.2);
  });
  await shot('17-hammerhead');

  // 28. Stage 3 state survives save/restore
  const snap3 = await page.evaluate(() => {
    const G = window.__game;
    const s = JSON.parse(JSON.stringify(G.serialize()));
    G.restore(s); G.step(0.1);
    return { tier: G.shark.tier.name, stations: G.stations.count(), body: G.crafting.worn('body'), day: G.weather.state.day, metal: G.crafting.hasGear('metalSpear') };
  });
  check('stage 3 state survives save/restore', snap3.tier === 'Hammerhead' && snap3.stations === 2 && snap3.body === 'tarpPoncho' && snap3.metal, JSON.stringify(snap3));

  // 10. A wider look for the README
  await page.evaluate(() => {
    const G = window.__game;
    G.newGame();
    G.game.mode = 'play';
    const p = G.player.state;
    p.pos.set(0.9, p.pos.y, 1.0);
    p.yaw = 0.5; p.pitch = -0.2;
    G.tools.setSlot(0, G.player);
    G.step(3);
  });
  await shot('09-overview');

  await page.evaluate(() => { const G = window.__game; G.game.stats.health = 0; G.game.lastDamage = 'shark'; G.step(0.1); });
  await page.waitForTimeout(200);
  await shot('10-dead');

  // Frame cost
  const perf = await page.evaluate(() => {
    const G = window.__game;
    G.newGame(); G.game.mode = 'play';
    const t0 = performance.now();
    G.step(2);
    return ((performance.now() - t0) / 120).toFixed(2);
  });
  console.log(`avg game update per frame (no render): ${perf} ms`);

  const realErrors = errors.filter((e) => !/fonts\.(googleapis|gstatic)/.test(e) && !/GPU stall|ReadPixels/.test(e));
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 5).join(' | '));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
