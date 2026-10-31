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
    // With G.fed on, long waits can't starve you (hunger and thirst stay above 30,
    // health above 50), so later checks don't run against a dead player.
    const feed = () => {
      if (!G.fed) return;
      const s = G.game.stats;
      s.hunger = Math.max(s.hunger, 30); s.thirst = Math.max(s.thirst, 30); s.health = Math.max(s.health, 50);
    };
    G.step = (sec, fn) => step(sec, (i) => { feed(); fn?.(i); }, false);
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
    // Random bottles would steal E presses; the bottle checks spawn their own.
    G.story.state.nextBottle = 1e9;
    const newGame = G.newGame;
    G.newGame = () => { newGame(); G.story.state.nextBottle = 1e9; };
    // Clear anything floating near a spot before pressing E at it.
    G.clearNear = (x, z, r = 2.5) => { for (const d of [...G.debris.items]) if (Math.hypot(d.x - x, d.z - z) < r) G.debris.remove(d); };
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
    // Q with the hammer out opens the build menu; pick the net there.
    G.key('KeyQ');
    const menuOpen = G.game.menu && !document.getElementById('craft').hidden;
    document.querySelector('#craft-list [data-id="net"]').click();
    document.querySelector('#craft-detail [data-act="pick"]').click();
    G.game.menu = false; G.input.state.enabled = true;
    G.step(0.1);
    const mode = G.tools.state.hammerMode;
    p.pos.set(0, p.pos.y, -1 * T);
    G.step(0.1);
    G.aimAt(0, 0.25, -1.5 * T - 0.55);
    G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1);
    G.step(0.6);
    return { menuOpen, mode, prompt, nets: G.nets.count() };
  });
  check('Q opens the build menu and picking a net works', net.menuOpen && net.mode === 'net', JSON.stringify(net));
  check('hammer puts up a catch net', net.nets === 1, JSON.stringify(net));

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
    Object.assign(G.inventory.items, { wood: 60, plastic: 30, fiber: 40, scrap: 20, fish: 3 });
    G.step(0.6);
  });

  // 19. Night falls (and nothing about it is deadly any more)
  const nightInfo = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.weather.setTime(23);
    p.pos.set(0, p.pos.y, 1.2); p.yaw = 0; p.pitch = -0.05;
    const hp = G.game.stats.health;
    G.step(4);
    return { hour: Math.round(G.weather.state.hour), health: Math.round(G.game.stats.health), hp: Math.round(hp), bars: document.querySelectorAll('#vitals .vital').length };
  });
  check('night passes without a cold meter', nightInfo.hour >= 23 && nightInfo.health >= nightInfo.hp && nightInfo.bars === 3, JSON.stringify(nightInfo));
  await shot('13-night');

  // 20. A storm
  await page.evaluate(() => { const G = window.__game; G.weather.setWeather('storm', true); G.weather.setTime(15); G.step(1); G.player.state.pitch = 0.05; G.step(0.1); });
  await shot('14-storm');

  // 21. Recipes stay locked until you have held their materials
  const locks = await page.evaluate(() => {
    const G = window.__game;
    return { oven: G.crafting.isUnlocked('oven'), boneSpear: G.crafting.lockReason('boneSpear'), poncho: G.crafting.isUnlocked('tarpPoncho') };
  });
  check('recipes unlock by materials found', !locks.oven && locks.boneSpear.includes('shark tooth') && locks.poncho, JSON.stringify(locks));

  // 22. Clothing is for looks: make a poncho, the sleeve changes colour, nothing else
  const craft = await page.evaluate(() => {
    const G = window.__game;
    G.weather.setWeather('clear', true);
    G.openMenu();
    const open = !document.getElementById('craft').hidden;
    const doll = !!document.querySelector('#craft-outfit .doll');
    G.crafting.make('palmHat');
    G.crafting.make('tarpPoncho');
    G.closeMenu(false); G.game.menu = false; G.input.state.enabled = true;
    G.step(0.1);
    return { open, doll, head: G.crafting.worn('head'), body: G.crafting.worn('body'), buffs: typeof G.crafting.buffs };
  });
  await shot('15-crafting-closed');
  check('wardrobe: clothing is made and worn, looks only', craft.open && craft.doll && craft.head === 'palmHat' && craft.body === 'tarpPoncho' && craft.buffs === 'undefined', JSON.stringify(craft));

  // 23. Crafting table: build it, then E at it opens the bench recipes
  const table = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.tools.pickBuild('table', G.player); G.step(0.4);
    p.pos.set(0, p.pos.y, 0.8); G.step(0.1);
    G.aimAt(-T, 0.6, -T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    G.tools.setSlot(0, G.player); G.step(0.3);
    p.pos.set(-T * 0.4, p.pos.y, -T * 0.3); G.step(0.1);
    G.aimAt(-T, 1.2, -T); G.step(0.05);
    const p2 = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE');
    const where = document.getElementById('craft-where').textContent;
    G.closeMenu(false); G.game.menu = false; G.input.state.enabled = true;
    return { prompt, built: G.stations.count('table'), p2, where };
  });
  check('crafting table is built and opens bench crafting', table.built === 1 && table.where.includes('At the crafting table'), JSON.stringify(table));

  // 24. Gear and weapon upgrades
  const gear = await page.evaluate(() => {
    const G = window.__game;
    G.inventory.items.tooth = 3;
    G.step(0.6);
    G.game.stats.health = 50;
    G.crafting.make('bandage');
    G.crafting.make('boneSpear');
    const bone = G.crafting.spearLevel();
    G.crafting.make('metalSpear');
    G.crafting.make('metalHook');
    return { health: Math.round(G.game.stats.health), bone, spear: G.crafting.spearLevel(), hook: G.crafting.hookLevel() };
  });
  check('weapon upgrades: bone then metal spear, metal hook', gear.health === 80 && gear.bone === 2 && gear.spear === 3 && gear.hook === 2, JSON.stringify(gear));

  // 25. Grill: build, light, cook, then upgrade it to a stone oven once you have stone
  const grill = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.tools.pickBuild('grill', G.player); G.step(0.4);
    p.pos.set(0, p.pos.y, 0.8); G.step(0.1);
    G.aimAt(T, 0.6, -T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const built = G.stations.count('grill');
    G.tools.setSlot(0, G.player); G.step(0.3);
    p.pos.set(T * 0.4, p.pos.y, -T * 0.4); G.step(0.1);
    G.aimAt(T, 0.62, -T); G.step(0.05);
    G.key('KeyE'); G.step(0.1);
    G.key('KeyE'); G.step(11);
    G.key('KeyE'); G.step(0.1);
    const cooked = G.inventory.items.cooked;
    G.inventory.items.stone = 8; G.step(0.6);
    G.tools.pickBuild('floor', G.player); G.step(0.4);
    G.aimAt(T, 0.7, -T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    const st = [...G.stations.list.values()].find((s) => s.kind === 'grill');
    return { built, cooked, prompt, level: st.level };
  });
  check('grill cooks a fish', grill.built === 1 && grill.cooked === 1, JSON.stringify(grill));
  check('hammer upgrades the grill to a stone oven', grill.level === 2, JSON.stringify(grill));
  await page.evaluate(() => { const G = window.__game; const T = G.TILE; G.weather.setTime(22.5); G.tools.setSlot(0, G.player); G.step(0.4); G.aimAt(T, 0.5, -T); G.player.state.pitch -= 0.1; G.step(0.3); });
  await shot('16-oven-night');

  // 26. Reinforce a floor piece; rain catcher (needs the table) fills in rain
  const build2 = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.weather.setTime(11);
    G.tools.pickBuild('floor', G.player); G.step(0.4);
    p.pos.set(0, p.pos.y, 0); G.step(0.1);
    G.aimAt(0, 0.4, T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    const tile = G.raft.tileAt(0, 1);
    G.tools.pickBuild('catcher', G.player); G.step(0.4);
    p.pos.set(-T * 0.3, p.pos.y, T * 0.3); G.step(0.1);
    G.aimAt(-T, 0.6, T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    G.weather.setWeather('rain', true);
    G.step(16);
    const st = [...G.stations.list.values()].find((s) => s.kind === 'catcher');
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.game.stats.thirst = 40;
    G.clearNear(-T, T);
    G.aimAt(-T, 0.9, T); G.step(0.05);
    G.key('KeyE'); G.step(0.1);
    return { prompt, reinforced: tile.reinforced, maxHp: tile.maxHp, cups: st ? st.cups : -1, thirst: Math.round(G.game.stats.thirst) };
  });
  check('hammer reinforces a floor piece', build2.reinforced && build2.maxHp === 200, JSON.stringify(build2));
  check('rain catcher fills in rain and you can drink', build2.cups >= 0 && build2.thirst > 60, JSON.stringify(build2));

  // 27. The raft drifts up to an island and rests; wade ashore, gather stone, the raft waits
  const island = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.fed = true;
    G.weather.setWeather('clear', true);
    G.islands.summon(G.raft.center(), G.raft.radius(), 'medium');
    let t = 0;
    while (!G.islands.resting && t < 200) { G.step(1); t += 1; }
    const isl = G.islands.island;
    const c = G.islands.center();
    const rc = G.raft.center();
    // swim from the raft edge toward the island until the sea floor comes up
    const dx = c.x - rc.x, dz = c.z - rc.z, l = Math.hypot(dx, dz);
    p.pos.set(rc.x + dx / l * (G.raft.radius() + 1.2), -1, rc.z + dz / l * (G.raft.radius() + 1.2)); p.inWater = true; p.grounded = false;
    p.yaw = Math.atan2(-dx, -dz); p.pitch = 0;
    G.shark.holdOff(999);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    let s = 0;
    while (!p.onLand && s < 40) { G.step(0.25); s += 0.25; }
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    const ashore = p.onLand;
    const rock = isl.built.resources.find((r) => r.kind === 'rock');
    const wp = { x: rock.mesh.position.x + isl.x, z: rock.mesh.position.z + isl.z };
    p.pos.set(wp.x + 1.5, G.islands.heightAt(wp.x + 1.5, wp.z), wp.z); p.grounded = true; p.inWater = false;
    G.step(0.2);
    G.aimAt(wp.x, G.islands.heightAt(wp.x, wp.z) + 0.3, wp.z); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    const stone0 = G.inventory.items.stone;
    G.key('KeyE'); G.step(0.1);
    // the visit timer runs out while ashore: the raft waits
    G.islands.state.visitLeft = 0.5; G.step(2);
    return { t, resting: G.islands.resting, ashore, prompt, stone: G.inventory.items.stone - stone0, size: isl.rec.size, R: +isl.rec.R.toFixed(1) };
  });
  check('the raft drifts up to an island and rests alongside', island.t < 200, JSON.stringify(island));
  check('you can wade ashore and gather stone', island.ashore && island.stone === 2, JSON.stringify(island));
  check('the raft waits while you are ashore', island.resting, JSON.stringify(island));
  await page.evaluate(() => {
    const G = window.__game; const p = G.player.state; const c = G.islands.center();
    p.yaw = Math.atan2(-(c.x - p.pos.x), -(c.z - p.pos.z)) + 0.6; p.pitch = -0.05; G.tools.setSlot(0, G.player); G.step(0.3);
  });
  await shot('17-island');
  await page.evaluate(() => {
    const G = window.__game; const p = G.player.state; const c = G.islands.center();
    p.pos.set(0, 0.42, 0); p.inWater = false; p.grounded = true; p.onLand = false;
    p.yaw = Math.atan2(-c.x, -c.z); p.pitch = -0.02; G.step(0.3);
  });
  await shot('18-island-from-raft');

  // 28. Anchor: with it down the raft stays even when you are aboard and time is up
  const anchor = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    // Back aboard, the raft started drifting on; put it back at the island for this check.
    const ist = G.islands.state;
    ist.resting = ist.lock ?? ist.resting; ist.lock = null; ist.visitLeft = 60; ist.held = false;
    G.inventory.add({ scrap: 4, rope: 3, wood: 2 });
    G.tools.pickBuild('anchor', G.player); G.step(0.4);
    p.pos.set(T * 0.3, p.pos.y, T * 0.3); G.step(0.1);
    G.aimAt(T, 0.6, T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const anchors = G.stations.count('anchor');
    G.tools.setSlot(0, G.player); G.step(0.3);
    // nothing floating or stuck in the plank under the crosshair
    for (const d of [...G.debris.items]) if (Math.hypot(d.x - T, d.z - T) < 2.5) G.debris.remove(d);
    G.aimAt(T, 0.9, T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    const down = G.stations.anchored();
    G.islands.state.visitLeft = 0; G.step(3);
    const stays = G.islands.resting;
    G.key('KeyE'); G.step(3);
    return { anchors, prompt, down, stays, after: G.islands.island && G.islands.island.phase };
  });
  check('anchor holds the raft at the island; raising it lets it drift on', anchor.down && anchor.stays && anchor.after === 'leave', JSON.stringify(anchor));

  // 29. Difficulty: easy drains hunger and thirst slower than hard
  const diff = await page.evaluate(() => {
    const G = window.__game;
    const run = (d) => { G.applyDifficulty(d, false); G.game.stats.hunger = 90; G.game.stats.thirst = 90; G.step(10); return 90 - G.game.stats.thirst; };
    const easy = run('easy'), hard = run('hard');
    G.applyDifficulty('normal', false);
    return { easy: +easy.toFixed(2), hard: +hard.toFixed(2) };
  });
  check('easy drains slower than hard', diff.easy < diff.hard, JSON.stringify(diff));

  // 30. The reef shark at max scars leaves for good and drops its jaw; a hammerhead follows and rams
  const leave = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    p.pos.set(0, 0.42, 0); p.inWater = false; p.grounded = true;
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

  const ram = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    let rams = 0;
    const orig = G.events.onRam;
    G.events.onRam = (...a) => { rams++; orig(...a); };
    G.shark.forceAttack(true);
    let t = 0, placed = false;
    while (rams === 0 && t < 60) {
      G.step(0.25); t += 0.25;
      const tgt = G.shark.target;
      if (tgt && !placed && G.shark.state === 'approach') {
        p.pos.set(tgt.tile.i * T + tgt.side[0] * T * 0.35, p.pos.y, tgt.tile.j * T + tgt.side[1] * T * 0.35);
        p.inWater = false; p.grounded = true;
        placed = true;
      }
    }
    G.step(1.5);
    G.events.onRam = orig;
    return { rams, t, inWater: p.inWater };
  });
  check('the hammerhead rams the raft and can knock you in', ram.rams === 1 && ram.inWater, JSON.stringify(ram));

  // 31. Everything survives save/restore
  const snap3 = await page.evaluate(() => {
    const G = window.__game;
    const s = JSON.parse(JSON.stringify(G.serialize()));
    G.restore(s); G.step(0.1);
    return {
      tier: G.shark.tier.name, stations: G.stations.count(), body: G.crafting.worn('body'),
      spear: G.crafting.spearLevel(), island: !!G.islands.island, oven: [...G.stations.list.values()].some((s) => s.kind === 'grill' && s.level === 2),
      reinforced: [...G.raft.tiles.values()].some((t) => t.reinforced),
    };
  });
  check('state survives save/restore', snap3.tier === 'Hammerhead' && snap3.stations === 4 && snap3.body === 'tarpPoncho' && snap3.spear === 3 && snap3.oven && snap3.reinforced, JSON.stringify(snap3));

  // ---------- Stage 4 ----------
  // 32. Islands come in three sizes with different resources
  const sizes = await page.evaluate(() => {
    const G = window.__game;
    const recs = [...G.islands.state.chart.values()].filter((r) => r.kind === 'island');
    const by = {};
    for (const r of recs) (by[r.size] = by[r.size] || []).push(r.R);
    const span = Object.fromEntries(Object.entries(by).map(([k, v]) => [k, [Math.min(...v).toFixed(1), Math.max(...v).toFixed(1), v.length]]));
    return { n: recs.length, span, kinds: Object.keys(by) };
  });
  check('the chart has islands of different sizes', sizes.kinds.length >= 2 && sizes.n >= 10, JSON.stringify(sizes));

  const big = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.stations.list.forEach((st) => { if (st.kind === 'anchor') st.down = false; });
    p.pos.set(0, 0.42, 0); p.inWater = false; p.grounded = true; p.onLand = false;
    G.shark.holdOff(999);
    G.islands.summon(G.raft.center(), G.raft.radius(), 'large');
    let t = 0;
    while (G.islands.island?.rec.size !== 'large' || !G.islands.resting) { G.step(1); t += 1; if (t > 260) break; }
    const isl = G.islands.island;
    const kinds = [...new Set(isl.built.resources.map((r) => r.kind))];
    // gather one of each new material
    const got = {};
    for (const kind of ['bamboo', 'sand', 'clay', 'shells', 'potato', 'melon']) {
      const res = isl.built.resources.find((r) => r.kind === kind && r.amount > 0);
      if (!res) continue;
      const loot = G.islands.gather(res);
      if (loot) { G.inventory.add(loot); Object.assign(got, loot); }
    }
    const c = G.islands.center();
    p.pos.set(c.x + c.r * 0.55, 0, c.z + c.r * 0.2);
    p.pos.y = G.islands.heightAt(p.pos.x, p.pos.z); p.onLand = true; p.inWater = false; p.grounded = true;
    p.yaw = Math.atan2(-(c.x - p.pos.x), -(c.z - p.pos.z)) - 0.5; p.pitch = -0.08;
    G.step(0.5);
    return { t, R: +isl.rec.R.toFixed(1), kinds, got: Object.keys(got) };
  });
  check('a large island has bamboo, sand, clay and shells to gather', ['bamboo', 'sand', 'clay', 'shells'].every((k) => big.got.includes(k)), JSON.stringify(big));
  await shot('19-large-island');

  // 33. Rope, glass and metal: rope from fiber, smelter makes bars and glass
  const smelt = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    p.pos.set(0, 0.42, 0); p.onLand = false; p.inWater = false; p.grounded = true; G.step(0.2);
    G.inventory.add({ fiber: 6, stone: 10, clay: 6, ore: 2, sand: 4, wood: 30, plastic: 10, bamboo: 20, rope: 0, glass: 0 });
    G.inventory.items.ore = 1;
    G.crafting.tick(1);
    G.crafting.make('rope');
    const rope = G.inventory.items.rope;
    // build a smelter on the floor piece at (-1, 0)
    G.tools.pickBuild('smelter', G.player); G.step(0.4);
    G.aimAt(-T, 0.5, 0); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const sm = [...G.stations.list.values()].find((s) => s.kind === 'smelter');
    if (!sm) return { rope, built: false };
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.aimAt(-T, 0.7, 0); G.step(0.05);
    G.key('KeyE'); G.step(0.1);           // light it
    G.key('KeyE'); G.step(0.1);           // smelt ore
    G.step(13);
    G.key('KeyE'); G.step(0.1);           // take the bar
    const bars = G.inventory.items.metalBar;
    G.key('KeyE'); G.step(0.1);           // melt sand
    G.step(13);
    G.key('KeyE'); G.step(0.1);
    return { rope, built: true, bars, glass: G.inventory.items.glass };
  });
  check('rope from fiber; smelter turns ore into a bar and sand into glass', smelt.rope === 1 && smelt.bars === 1 && smelt.glass === 1, JSON.stringify(smelt));

  // 34. Planter: plant seeds, rain speeds growth, harvest food and seeds
  const crop = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.inventory.add({ potatoSeed: 2, melonSeed: 1, wood: 10, clay: 4 });
    G.tools.pickBuild('planter', G.player); G.step(0.4);
    G.aimAt(0, 0.5, -T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const pl = [...G.stations.list.values()].find((s) => s.kind === 'planter');
    if (!pl) return { built: false };
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.aimAt(0, 0.6, -T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    const crop = pl.crop;
    G.weather.setWeather('clear', true);
    const g0 = pl.grow; G.step(10); const dry = pl.grow - g0;
    G.weather.setWeather('rain', true);
    const g1 = pl.grow; G.step(10); const wet = pl.grow - g1;
    G.weather.setWeather('clear', true);
    pl.grow = 0.995; G.step(2);
    G.aimAt(0, 0.6, -T); G.step(0.05);
    const ripePrompt = G.tools.state.prompt && G.tools.state.prompt.text;
    const pot0 = G.inventory.items.potato;
    G.key('KeyE'); G.step(0.1);
    return { built: true, prompt, crop, dry: +dry.toFixed(4), wet: +wet.toFixed(4), ripePrompt, potatoes: G.inventory.items.potato - pot0, seeds: G.inventory.items.potatoSeed };
  });
  check('plant seeds in a planter; rain makes it grow faster', crop.built && crop.crop === 'potato' && crop.wet > crop.dry * 1.5, JSON.stringify(crop));
  check('harvest a ripe crop for food and seeds', crop.potatoes >= 2 && crop.seeds >= 2, JSON.stringify(crop));

  // 35. Food slot: R steps to the next food; eating a potato fills you up
  const food = await page.evaluate(() => {
    const G = window.__game;
    G.tools.setSlot(3, G.player); G.step(0.4);
    G.tools.setFood('coconut'); G.inventory.items.coconut = 0; G.step(0.1);
    const auto = G.tools.food;
    G.game.stats.hunger = 50;
    G.tools.setFood('potato');
    G.click(0, 1); G.step(1.3);
    return { auto, hunger: Math.round(G.game.stats.hunger), potato: G.inventory.items.potato };
  });
  check('the food slot switches to food you have; potatoes fill you up', food.auto !== 'coconut' && food.hunger > 60, JSON.stringify(food));

  // 36. Solar still makes fresh water in clear weather
  const still = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.inventory.add({ glass: 2, bamboo: 3, plastic: 2 });
    G.tools.pickBuild('still', G.player); G.step(0.4);
    p.pos.set(-T * 0.2, p.pos.y, T * 0.1); G.step(0.1);
    G.aimAt(0, 0.5, T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const sv = [...G.stations.list.values()].find((s) => s.kind === 'still');
    if (!sv) return { built: false };
    G.step(37);
    const cups = sv.cups;
    G.game.stats.thirst = 40;
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.aimAt(0, 0.6, T); G.step(0.05);
    G.key('KeyE'); G.step(0.1);
    return { built: true, cups, thirst: Math.round(G.game.stats.thirst) };
  });
  check('the solar still makes drinking water without rain', still.built && still.cups >= 1 && still.thirst > 55, JSON.stringify(still));
  await page.evaluate(() => { const G = window.__game; const T = G.TILE; const p = G.player.state; p.pos.set(T * 0.3, p.pos.y, T * 0.5); G.aimAt(-T * 0.5, 0.4, -T * 0.6); G.step(0.3); });
  await shot('20-planter-smelter-still');

  // 37. Railing: you can't walk off an edge that has one
  const rail = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    // an outer edge facing +x on a floor piece with nothing built on it
    const side = [1, 0];
    const t = [...G.raft.tiles.values()].find((k) => !k.broken && !G.stations.hasStation(k) && !G.raft.tileAt(k.i + 1, k.j) && !G.nets.has(k, side));
    const free = !!t;
    if (!t) return { free };
    G.inventory.add({ wood: 4, rope: 2 });
    G.tools.pickBuild('rail', G.player); G.step(0.4);
    p.pos.set(t.i * T, p.pos.y, t.j * T); G.step(0.1);
    G.aimAt(t.i * T + T / 2, 0.9, t.j * T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    const built = G.rails.has(t, side);
    G.tools.setSlot(0, G.player);
    p.yaw = -Math.PI / 2; p.pitch = 0; // face +x
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    G.step(2);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    G.step(0.2);
    return { free, prompt, built, inWater: p.inWater, x: +p.pos.x.toFixed(2), edge: +(t.i * T + T / 2).toFixed(2) };
  });
  check('a railing stops you walking off the raft', rail.free && rail.built && !rail.inWater && rail.x < rail.edge, JSON.stringify(rail));

  // 38. Lookout tower: climb up, see further
  const tower = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.inventory.add({ wood: 12, bamboo: 8, rope: 4 });
    // find a free floor piece
    const free = [...G.raft.tiles.values()].find((t) => !t.broken && !G.stations.hasStation(t) && (t.i !== 0 || t.j !== 0));
    G.tools.pickBuild('tower', G.player); G.step(0.4);
    p.pos.set(0, 0.42, 0); G.step(0.1);
    G.aimAt(free.i * T, 0.5, free.j * T); G.step(0.05);
    G.click(0, 1); G.step(0.6);
    const tw = [...G.stations.list.values()].find((s) => s.kind === 'tower');
    if (!tw) return { built: false, tile: [free.i, free.j] };
    // a far island: out of sight from the deck, in sight from the top
    const st = G.islands.state;
    const rec = G.islands.summon(G.raft.center(), G.raft.radius(), 'small');
    rec.x = st.rw.x + 700; rec.z = st.rw.z - 100; rec.seen = false;
    G.islands.state.lock = rec.id;
    G.step(0.2);
    const seenLow = rec.seen;
    G.tools.setSlot(0, G.player); G.step(0.3);
    G.aimAt(free.i * T, 1.2, free.j * T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.3);
    const up = !!p.tower, y = +p.pos.y.toFixed(2);
    const seenHigh = rec.seen;
    p.yaw = 2.6; p.pitch = -0.15; G.step(0.2);
    return { built: true, prompt, up, y, seenLow, seenHigh };
  });
  check('climb the lookout tower and spot islands further away', tower.built && tower.up && tower.y > 3 && !tower.seenLow && tower.seenHigh, JSON.stringify(tower));
  await shot('21-from-the-tower');
  const down = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.key('KeyE'); G.step(0.3);
    return { tower: !!p.tower, y: +p.pos.y.toFixed(2), inWater: p.inWater };
  });
  check('climb back down the tower', !down.tower && down.y < 1.5 && !down.inWater, JSON.stringify(down));

  // 39. Sail and map: pick an island on the map and the raft sails to it
  const sail = await page.evaluate(() => {
    const G = window.__game; const T = G.TILE; const p = G.player.state;
    G.inventory.add({ bamboo: 8, rope: 6, plastic: 8 });
    G.raft.build(-1, -1); G.raft.build(-2, 0);
    const free = [...G.raft.tiles.values()].find((t) => !t.broken && !G.stations.hasStation(t) && (t.i !== 0 || t.j !== 0));
    G.tools.pickBuild('sail', G.player); G.step(0.4);
    // stand on the near side of that floor piece, looking down at it
    p.pos.set(free.i * T - Math.sign(free.i) * 0.6, 0.42, free.j * T - Math.sign(free.j) * 0.6); p.inWater = false; p.grounded = true; G.step(0.1);
    G.aimAt(free.i * T, 0.5, free.j * T); G.step(0.05);
    const buildPrompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.click(0, 1); G.step(0.6);
    const built = !!G.stations.has('sail');
    G.tools.setSlot(0, G.player);
    p.pos.set(free.i * T - Math.sign(free.i) * 1.0, p.pos.y, free.j * T - Math.sign(free.j) * 1.0); G.step(0.3);
    G.aimAt(free.i * T, 1.4, free.j * T); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    const mapOpen = !document.getElementById('map').hidden;
    // set course for a charted island off to the side
    const st = G.islands.state;
    const target = [...st.chart.values()].filter((r) => r.kind === 'island' && r.id !== st.resting && Math.hypot(r.x - st.rw.x, r.z - st.rw.z) > 300).sort((a, b) => Math.hypot(a.x - st.rw.x, a.z - st.rw.z) - Math.hypot(b.x - st.rw.x, b.z - st.rw.z))[0];
    target.seen = true;
    G.map.tick();
    return { built, buildPrompt, prompt, mapOpen, target: target.id, tile: [free.i, free.j] };
  });
  await page.waitForTimeout(200);
  await shot('22-map');
  const sailing = await page.evaluate((id) => {
    const G = window.__game;
    const st = G.islands.state;
    G.islands.setDestination(id);
    G.closeMenu(); G.step(0.1);
    const rec = st.chart.get(id);
    const d0 = Math.hypot(rec.x - st.rw.x, rec.z - st.rw.z);
    let moved = 0, px = st.rw.x, pz = st.rw.z;
    for (let k = 0; k < 30; k++) { G.step(1); moved += Math.hypot(st.rw.x - px, st.rw.z - pz); px = st.rw.x; pz = st.rw.z; }
    const d1 = Math.hypot(rec.x - st.rw.x, rec.z - st.rw.z);
    return { d0: Math.round(d0), d1: Math.round(d1), moved: Math.round(moved), sailing: G.islands.state.dest === id };
  }, sail.target);
  // Under sail the raft covers about twice what the current alone would (1.3 m/s x 30 s = 39 m).
  check('the sail opens the map; a course set there sails you to the island', sail.built && sail.mapOpen && sailing.moved > 55 && sailing.d1 < sailing.d0 - 20, JSON.stringify({ sail, sailing }));
  await page.evaluate(() => { const G = window.__game; const p = G.player.state; p.yaw = 0.9; p.pitch = 0.12; G.step(0.3); });
  await shot('23-under-sail');

  // 40. Messages in bottles: read in order; the last marks the lighthouse
  const bottle = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.islands.setDestination(null);
    p.pos.set(0, 0.42, 0); p.inWater = false; p.grounded = true;
    const d = G.debris.spawn('bottle', p.pos.x, p.pos.z - 2.2);
    G.step(0.05);
    G.aimAt(d.x, d.mesh.position.y, d.z); G.step(0.05);
    const prompt = G.tools.state.prompt && G.tools.state.prompt.text;
    G.key('KeyE'); G.step(0.1);
    const shown = !document.getElementById('note').hidden;
    const title = document.getElementById('note-title').textContent;
    return { prompt, shown, title, read: G.story.read };
  });
  await shot('24-message');
  const lastNote = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.key('KeyE'); G.step(0.1);
    const closed = document.getElementById('note').hidden;
    G.story.state.read = 7;
    const lh = G.islands.lighthouse();
    const seenBefore = lh.seen;
    const d = G.debris.spawn('bottle', p.pos.x, p.pos.z - 2.2);
    G.step(0.05);
    G.aimAt(d.x, d.mesh.position.y, d.z); G.step(0.05);
    G.key('KeyE'); G.step(0.1);
    const title = document.getElementById('note-title').textContent;
    G.closeMenu(); G.step(0.1);
    return { closed, seenBefore, seenAfter: lh.seen, title, done: G.story.done };
  });
  check('a message in a bottle opens a note to read', bottle.shown && bottle.read === 1 && lastNote.closed, JSON.stringify(bottle));
  check('the last note marks the lighthouse on the map', !lastNote.seenBefore && lastNote.seenAfter && lastNote.done, JSON.stringify(lastNote));

  // 41. Lighting the lighthouse lamp ends the story; you can keep playing
  const ending = await page.evaluate(() => {
    const G = window.__game;
    const st = G.islands.state;
    const lh = G.islands.lighthouse();
    st.rw = { x: lh.x, z: lh.z + lh.R + 40 }; st.resting = null; st.dest = null; st.lock = null;
    G.step(1);
    const isl = G.islands.island;
    const lamp = isl && isl.built.resources.find((r) => r.kind === 'lamp');
    if (!lamp) return { lamp: false, active: isl && isl.rec.kind };
    G.islands.gather(lamp);
    G.step(2);
    return { lamp: true, mode: G.game.mode, shown: !document.getElementById('ending').hidden, lit: G.story.lit };
  });
  await page.waitForTimeout(1700);
  const ended = await page.evaluate(() => ({ mode: window.__game.game.mode, shown: !document.getElementById('ending').hidden }));
  check('lighting the lighthouse lamp brings the ending', ending.lamp && ending.lit && ended.mode === 'ended' && ended.shown, JSON.stringify({ ending, ended }));
  await shot('25-ending');
  const keep = await page.evaluate(() => {
    document.getElementById('ending-keep').click();
    return { mode: window.__game.game.mode };
  });
  await page.waitForTimeout(200);
  check('after the ending you can keep sailing', keep.mode === 'play', JSON.stringify(keep));
  await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.weather.setTime(21.5); G.step(0.5);
    const c = G.islands.center();
    p.pos.set(0, 0.42, 0); p.yaw = Math.atan2(-c.x, -c.z); p.pitch = 0.08; G.step(0.5);
  });
  await shot('26-lighthouse-at-night');

  // 42. Peaceful mode: the shark circles but never attacks
  const peace = await page.evaluate(() => {
    const G = window.__game; const p = G.player.state;
    G.weather.setTime(10);
    G.applyDifficulty('peaceful', false);
    if (G.shark.gone) G.shark.setTier(G.shark.tierIndex);
    G.shark.forceAttack();
    const h0 = G.game.stats.health;
    const states = new Set();
    p.pos.set(5, -1, 0); p.inWater = true; p.grounded = false;
    for (let i = 0; i < 80; i++) { G.step(0.25); states.add(G.shark.state); p.pos.set(5, p.pos.y, 0); }
    p.pos.set(0, 0.42, 0); p.inWater = false; p.grounded = true;
    G.applyDifficulty('normal', false);
    return { states: [...states], hurt: h0 - G.game.stats.health };
  });
  check('peaceful mode: the shark never bites the raft or you', !peace.states.includes('bite') && !peace.states.includes('chase') && peace.hurt <= 0.5, JSON.stringify(peace));

  // 43. Stage 4 state survives save/restore, including the autosave slot
  const snap4 = await page.evaluate(() => {
    const G = window.__game;
    const before = { rails: G.rails.count(), read: G.story.read, chart: G.islands.state.chart.size, sail: !!G.stations.has('sail'), planter: !!G.stations.has('planter'), rw: Math.round(G.islands.state.rw.z) };
    const ok = G.saveGame();
    const s = G.readSave();
    G.restore(s); G.step(0.1);
    const after = { rails: G.rails.count(), read: G.story.read, chart: G.islands.state.chart.size, sail: !!G.stations.has('sail'), planter: !!G.stations.has('planter'), rw: Math.round(G.islands.state.rw.z) };
    return { ok, before, after };
  });
  // The raft drifts a little during the 0.1 s step after loading.
  const same = (a, b) => JSON.stringify({ ...a, rw: 0 }) === JSON.stringify({ ...b, rw: 0 }) && Math.abs(a.rw - b.rw) <= 2;
  check('Stage 4 state survives saving and loading', snap4.ok && same(snap4.before, snap4.after), JSON.stringify(snap4));

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
