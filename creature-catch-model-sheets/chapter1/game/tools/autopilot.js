// autopilot.js: plays the built game with real key presses, for checking a build (drive.js injects it with {"inject": ...}).
// It only presses keys (the same keydown/keyup events the keyboard sends); it reads the game's state to decide which.
//   await AP.go(x, y)        walks to a tile (path-finding round walls, people and other doors), through a door if it's one
//   await AP.face('up')      turns to face a direction;  await AP.tap('KeyZ')  presses A
//   await AP.until(fn, {tap, max})  presses `tap` every so often until fn() is true
//   await AP.talkThrough(stop)       presses A through dialog until stop() is true or nothing is left to read
//   await AP.fight({catch: true})    battles (first move each turn, or a cube once the foe is weak) until it's over
window.AP = (() => {
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const CODES = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'KeyZ', b: 'KeyX', start: 'Enter' };
  const send = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
  async function tap(code, ms) { send(code, true); await sleep(ms || 90); send(code, false); await sleep(60); }
  const top = () => (G.top() ? G.top().name || '' : '');
  async function until(fn, o) {
    o = o || {}; const end = Date.now() + (o.max || 60) * 1000;
    while (Date.now() < end) { let ok = false; try { ok = fn(); } catch (e) { ok = false; } if (ok) return true; if (o.tap) await tap(o.tap); await sleep(o.every || 250); }
    console.log('[cc] autopilot: gave up waiting for ' + fn.toString().slice(0, 90)); return false;
  }
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function path(tx, ty) {
    const W = WORLD, P = W.player, info = W.info, map = info.map, key = (x, y) => x + ',' + y;
    const doors = Object.values(info.doors || {}).map((d) => key(d.tile[0], d.tile[1]));
    const free = (x, y) => (x === tx && y === ty) || (!info.solidAt(x, y) && !W.npcAt(x, y) && doors.indexOf(key(x, y)) < 0 && !(map.indoors && info.tileAt(x, y) === 'm'));
    const prev = {}, q = [[P.x, P.y]]; prev[key(P.x, P.y)] = null;
    while (q.length) {
      const [x, y] = q.shift(); if (x === tx && y === ty) break;
      for (const d in DIRS) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = key(nx, ny); if (k in prev || !free(nx, ny)) continue; if (nx < -1 || ny < -1 || nx > map.w || ny > map.h) continue; prev[k] = [x, y, d]; q.push([nx, ny]); }
    }
    if (!(key(tx, ty) in prev)) return null;
    const steps = []; let k = key(tx, ty); while (prev[k]) { const [px, py, d] = prev[k]; steps.unshift(d); k = key(px, py); }
    return steps;
  }
  async function go(tx, ty) {
    for (let tries = 0; tries < 6; tries++) {
      await until(() => !WORLD.busy && G.top() === WORLD.screen && !WORLD.player.mv, { max: 30 });
      const P = WORLD.player; if (P.x === tx && P.y === ty) return true;
      const steps = path(tx, ty); if (!steps) { console.log('[cc] autopilot: no path to ' + tx + ',' + ty + ' from ' + P.x + ',' + P.y); return false; }
      const map0 = WORLD.mapId;
      let ok = true;
      for (const d of steps) {
        const x0 = P.x, y0 = P.y;
        send(CODES[d], true);
        const moved = await until(() => P.x !== x0 || P.y !== y0 || WORLD.mapId !== map0 || WORLD.busy || G.top() !== WORLD.screen, { max: 8, every: 30 });
        send(CODES[d], false);
        if (WORLD.mapId !== map0) return true; // went through a door or off the edge
        if (!moved || WORLD.busy || G.top() !== WORLD.screen) { ok = false; break; } // something happened (a wild creature!)
      }
      if (ok && P.x === tx && P.y === ty) return true;
      if (G.top() !== WORLD.screen || WORLD.busy) return 'interrupted';
    }
    return false;
  }
  async function face(d) { const P = WORLD.player; if (P.dir === d) return; send(CODES[d], true); await sleep(40); send(CODES[d], false); await sleep(200); }
  async function talkThrough(stop, max) {
    const end = Date.now() + (max || 60) * 1000;
    while (Date.now() < end) {
      if (stop && stop()) return true;
      const t = top();
      if (t === 'say') await tap('KeyZ'); else if (!stop && G.top() === WORLD.screen && !WORLD.busy) return true;
      await sleep(180);
    }
    return false;
  }
  // a battle: first move each turn; with {catch: true} a cube once the wild foe is under half its HP
  async function fight(o) {
    o = o || {}; const end = Date.now() + (o.max || 300) * 1000; let thrown = 0;
    await until(() => BATTLE.active, { max: 30, tap: 'KeyZ', every: 400 });
    while (BATTLE.active && Date.now() < end) {
      const t = top();
      if (t === 'action') {
        const B = BATTLE._B, foe = B && B.foe, weak = foe && foe.mon.hp / MON.maxHp(foe.mon) < (o.below || .55);
        if (o.stopWeak && B && B.wild && weak) return 'weak'; // the caller throws the cube itself (to film it)
        if (o.catch && B && B.wild && weak && G.state.bag.cube > 0 && thrown < (o.cubes || 5)) { thrown++; await tap('ArrowRight'); await tap('KeyZ'); await sleep(250); await tap('KeyZ'); }
        else { await tap('KeyZ'); await sleep(250); if (top() === 'moves') await tap('KeyZ'); }
      } else if (t === 'moves') await tap('KeyZ');
      else if (t === 'menu' || t === 'say') await tap('KeyZ');
      await sleep(220);
    }
    await until(() => !BATTLE.active && G.top() === WORLD.screen && !WORLD.busy, { max: 40, tap: 'KeyZ', every: 400 });
    return !BATTLE.active;
  }
  return { tap, send, sleep, until, go, face, talkThrough, fight, path, top };
})();
