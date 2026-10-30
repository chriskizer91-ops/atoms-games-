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
    G.draw();
  });
  await page.waitForTimeout(500);
  const shot = async (name) => {
    await page.evaluate(() => window.__game.draw());
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(outDir, `${name}.png`) });
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
    return { state: G.shark.state, log, repels: G.game.counters.repels };
  });
  check('spear drives the shark off', spear.state === 'flee' && spear.repels === 1, JSON.stringify(spear));
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
