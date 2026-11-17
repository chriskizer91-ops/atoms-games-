import * as THREE from 'three';
import { createCastaway } from './people/castaway.js';
import { TILE } from './config.js';
import { clamp, rand } from './util.js';

// The other survivor. Until you find them they keep a fire going on an island
// a way down-current (islands.js draws the camp and its smoke); once aboard
// they walk the raft, pull things out of the water, mend bitten floor and
// stand with you against the shark.

const WHO = {
  woman: {
    name: 'Marta', id: 'castaway-woman-A',
    meet: [
      '“You’re real. I’d stopped believing the smoke would bring anyone.”',
      '“Marta Reyes. I was the cook on the Marigold. I’ve kept this fire going since the storm, on coconuts and stubbornness.”',
      '“If there’s room on that raft, I can haul, I can mend, and I’m not afraid of the shark. Well. Not very.”',
    ],
  },
  man: {
    name: 'Finn', id: 'castaway-man-A',
    meet: [
      '“A raft. An actual raft. I thought I was seeing things again.”',
      '“Finn Okoro, deck hand on the Marigold. I’ve fed this fire every day since she went down, hoping somebody would see it.”',
      '“Take me with you. I can haul and I can mend, and I’ve a score to settle with every shark in this sea.”',
    ],
  },
};

const LINES = {
  join: ['Solid planks under my feet. I’d forgotten.', 'Right. Where do you want me?'],
  haul: ['Got something.', 'That’ll be useful.', 'Waste not.'],
  shark: ['Shark! I’m on it!', 'Not this raft, you don’t!', 'It’s back. Get your spear!'],
  repelled: ['And stay gone!', 'Ha! Look at it run.'],
  repair: ['I’ll patch that.', 'Hold still, raft.'],
  land: ['Land! See it?', 'An island. Worth a look.'],
  whale: ['Did you see that? Did you SEE that?', 'A whale. I’ll never get used to it.'],
  dolphins: ['Dolphins! They always did follow the Marigold.', 'Look at them go.'],
  dawn: ['Morning. We’re still afloat.', 'Another one. We made it through.'],
  storm: ['Weather’s turning. Hold on to something.', 'Here it comes.'],
  fish: ['Now that’s supper.', 'Nice fish!'],
  treasure: ['Is that… gold?', 'Somebody buried that and never came back. Their loss.'],
  night: ['Quiet tonight. I’ll keep an eye out.', 'Look at those stars.'],
  lighthouse: ['That light. That’s our way home.'],
};

export function createCompanion(scene, { raft, stations, debris, shark, islands, inventory, fx, audio, makeHeld, sharkEvents }) {
  const st = {
    joined: false, who: 'woman', name: 'Marta',
    x: 0, z: 0, yaw: 0, speed: 0,
    mode: 'idle', wait: 2, tx: 0, tz: 0, run: false,
    job: null, jobT: 0, actT: 0, haulT: 12, waveT: 0, thinkT: 0,
    talkT: 0, said: {},
  };
  let body = null, wantId = null, events = {};
  const held = {};
  const upd = { speed: 0, swim: 0, moving: 0, hold: null, steer: 0, run: 0 };
  const v = new THREE.Vector3(), v2 = new THREE.Vector3();
  // The line out to whatever they're pulling in.
  const rope = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: 0xcdbb8a }));
  rope.frustumCulled = false;
  rope.visible = false;
  scene.add(rope);
  const ropePos = rope.geometry.attributes.position;

  function say(key, chance = 1) {
    if (!st.joined || st.talkT > 0 || Math.random() > chance) return false;
    const last = st.said[key] || -1e9;
    if (performance.now() / 1000 - last < 50) return false;
    const list = LINES[key];
    if (!list) return false;
    st.said[key] = performance.now() / 1000;
    st.talkT = 9;
    events.onSay?.(st.name, list[Math.floor(Math.random() * list.length)]);
    return true;
  }

  function face(x, z, dt, rate = 8) {
    const want = Math.atan2(x - st.x, z - st.z);
    let d = want - st.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    st.yaw += d * Math.min(1, dt * rate);
  }

  function nearestTile(x, z, free = false) {
    let best = null, bd = Infinity;
    for (const t of raft.tiles.values()) {
      if (t.broken || (free && stations.hasStation(t))) continue;
      const d = Math.hypot(t.i * TILE - x, t.j * TILE - z);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  function walkTo(x, z, run = false) {
    st.tx = x; st.tz = z; st.run = run; st.mode = 'walk';
  }

  function think() {
    // 1. the shark at the raft
    const sk = shark.state;
    if (!shark.gone && (sk === 'bite' || sk === 'approach') && shark.target?.tile && !shark.target.tile.broken) {
      const t = shark.target.tile, side = shark.target.side;
      st.job = { type: 'fight', tile: t };
      walkTo(t.i * TILE + (side ? side[0] * 0.3 : 0), t.j * TILE + (side ? side[1] * 0.3 : 0), true);
      say('shark');
      return;
    }
    // 2. floor that's been bitten
    let worst = null;
    for (const t of raft.tiles.values()) {
      if (t.broken || t.hp >= t.maxHp - 4) continue;
      if (!worst || t.hp / t.maxHp < worst.hp / worst.maxHp) worst = t;
    }
    if (worst) {
      st.job = { type: 'repair', tile: worst };
      walkTo(worst.i * TILE + 0.25, worst.j * TILE + 0.25);
      say('repair', 0.5);
      return;
    }
    // 3. something floating within reach
    if (st.haulT <= 0) {
      const c = raft.center();
      let best = null, bd = Infinity;
      for (const d of debris.near(c.x, c.z, raft.radius() + 5)) {
        if (d.type === 'bottle' || d.stuck || d.hooked) continue;
        const t = nearestTile(d.x, d.z);
        if (!t) continue;
        const dist = Math.hypot(t.i * TILE - d.x, t.j * TILE - d.z);
        if (dist < 6.5 && dist < bd) { bd = dist; best = { d, t }; }
      }
      if (best) {
        st.job = { type: 'haul', d: best.d, tile: best.t };
        const dx = best.d.x - best.t.i * TILE, dz = best.d.z - best.t.j * TILE, l = Math.hypot(dx, dz) || 1;
        walkTo(best.t.i * TILE + (dx / l) * 0.3, best.t.j * TILE + (dz / l) * 0.3);
        return;
      }
    }
    // 4. nothing to do: wander
    const list = [...raft.tiles.values()].filter((t) => !t.broken && !stations.hasStation(t));
    if (list.length > 1) {
      const t = list[Math.floor(Math.random() * list.length)];
      st.job = null;
      walkTo(t.i * TILE + rand(-0.35, 0.35), t.j * TILE + rand(-0.35, 0.35));
    }
    st.wait = rand(4, 11);
  }

  function work(t, dt) {
    const j = st.job;
    st.actT -= dt;
    if (j.type === 'fight') {
      shark.headPosition(v);
      face(v.x, v.z, dt);
      upd.hold = 'spear';
      const sk = shark.state;
      if (shark.gone || !(sk === 'bite' || sk === 'approach')) {
        if (sk === 'flee' || sk === 'leave') say('repelled', 0.7);
        st.job = null; st.mode = 'idle'; st.wait = 2.5;
        return;
      }
      if (sk === 'bite' && st.actT <= 0 && Math.hypot(v.x - st.x, v.z - st.z) < 3.4) {
        st.actT = 1.5;
        body.play('stab');
        shark.hit(sharkEvents(), 0.5, v);
        fx.splash?.(v2.set(v.x, 0.1, v.z), 0.6);
        audio.spearHit?.(clamp(v.x * 0.1, -1, 1));
      }
    } else if (j.type === 'repair') {
      upd.hold = 'hammer';
      face(j.tile.i * TILE, j.tile.j * TILE - 0.01, dt, 3);
      if (j.tile.broken || j.tile.hp >= j.tile.maxHp) { st.job = null; st.mode = 'idle'; st.wait = 2; return; }
      if (st.actT <= 0) {
        st.actT = 0.9;
        body.play('swing');
        raft.repair(j.tile, 8);
        audio.hammer?.(clamp(st.x * 0.12, -1, 1));
      }
    } else if (j.type === 'haul') {
      upd.hold = 'hook';
      const d = j.d;
      const gone = !debris.items.includes(d) || (d.hooked && !j.got) || Math.hypot(d.x - st.x, d.z - st.z) > 9;
      if (gone) { if (j.got) d.hooked = false; st.job = null; st.mode = 'idle'; st.wait = 1.5; st.haulT = 5; return; }
      face(d.x, d.z, dt);
      st.jobT += dt;
      if (st.jobT > 0.4 && !j.thrown) { j.thrown = true; body.play('throw'); audio.whoosh?.(clamp(st.x * 0.12, -1, 1)); }
      if (st.jobT > 0.95 && !j.got) {
        // the hook lands on it: from here it comes in on the line, whatever the current is doing
        j.got = true;
        d.hooked = true;
        fx.splash?.(v.set(d.x, 0.1, d.z), 0.5);
      }
      if (j.got) {
        const dx = st.x - d.x, dz = st.z - d.z, l = Math.hypot(dx, dz) || 1;
        const pull = Math.min(l, 3.2 * dt);
        d.x += (dx / l) * pull; d.z += (dz / l) * pull;
        rope.visible = true;
        body.handR.getWorldPosition(v);
        ropePos.setXYZ(0, v.x, v.y, v.z);
        ropePos.setXYZ(1, d.x, d.mesh.position.y + 0.05, d.z);
        ropePos.needsUpdate = true;
        if (l < 1.1 || st.jobT > 4.5) {
          inventory.add(d.loot);
          debris.remove(d);
          events.onHaul?.(st.name, d.loot);
          say('haul', 0.3);
          st.job = null; st.mode = 'idle'; st.wait = rand(2, 5);
          st.haulT = rand(16, 30);
        }
      }
    }
  }

  const api = {
    state: st,
    get name() { return st.name; },
    get joined() { return st.joined; },
    get meetLines() { return WHO[st.who].meet; },
    on(e) { events = e; },
    say,

    // The companion is whichever of the two castaways you are not.
    async setBody(playerBodyId) {
      const who = playerBodyId.startsWith('castaway-woman') ? 'man' : 'woman';
      const id = WHO[who].id;
      st.who = who;
      st.name = WHO[who].name;
      if (id === wantId) return;
      wantId = id;
      const b = await createCastaway({ id });
      if (wantId !== id) { b.dispose(); return; }
      if (body) { scene.remove(body.root); body.dispose(); }
      body = b;
      for (const k in held) delete held[k];
      const models = makeHeld();
      for (const k of ['spear', 'hammer', 'hook']) { held[k] = models[k]; body.handR.add(held[k]); held[k].visible = false; }
      body.setVisible(false);
      scene.add(body.root);
    },

    join() {
      st.joined = true;
      const c = raft.center();
      const t = nearestTile(c.x, c.z, true) || nearestTile(c.x, c.z);
      st.x = t ? t.i * TILE : c.x; st.z = t ? t.j * TILE : c.z;
      st.mode = 'idle'; st.wait = 3; st.job = null; st.haulT = 15; st.talkT = 6;
    },

    reset() {
      rope.visible = false;
      st.joined = false; st.mode = 'idle'; st.job = null; st.said = {}; st.talkT = 0; st.haulT = 12;
      if (body) body.setVisible(false);
    },
    serialize() { return { joined: st.joined, x: st.x, z: st.z }; },
    restore(d) {
      api.reset();
      if (d?.joined) { api.join(); if (raft.isSupported(d.x, d.z)) { st.x = d.x; st.z = d.z; } }
    },

    // c: { player (position), daylight, live }
    update(t, dt, c) {
      if (!body) return;
      if (!c.live) { body.setVisible(false); rope.visible = false; return; }
      body.glow = 0.25 * (c.daylight ?? 1);
      st.talkT = Math.max(0, st.talkT - dt);
      upd.hold = null; upd.swim = 0; upd.steer = 0;

      if (!st.joined) {
        // Waiting by the fire, if the camp is close enough to be drawn.
        const rec = islands.camp();
        const p = rec && !rec.rescued ? islands.campStand(v) : null;
        if (!p) { body.setVisible(false); return; }
        body.setVisible(true);
        st.x = p.x; st.z = p.z;
        body.root.position.copy(p);
        const d = Math.hypot(c.player.x - p.x, c.player.z - p.z);
        face(c.player.x, c.player.z, dt, 4);
        body.root.rotation.y = st.yaw;
        st.waveT -= dt;
        if (d < 70 && d > 3.5 && st.waveT <= 0) { st.waveT = 2.6; body.play('wave'); }
        upd.speed = 0; upd.moving = 0;
        body.update(dt, upd);
        return;
      }

      body.setVisible(true);
      rope.visible = false;
      st.haulT -= dt;
      // The floor they were on has gone: step back onto what's left.
      if (!raft.isSupported(st.x, st.z)) {
        const tl = nearestTile(st.x, st.z);
        if (tl) { st.x = tl.i * TILE; st.z = tl.j * TILE; }
        st.mode = 'idle'; st.job = null; st.wait = 1;
      }
      // The shark takes priority over whatever else is going on.
      st.thinkT -= dt;
      if (st.thinkT <= 0 && st.job?.type !== 'fight') {
        st.thinkT = 0.7;
        const sk = shark.state;
        if (!shark.gone && (sk === 'bite' || sk === 'approach') && shark.target?.tile) think();
      }

      let moving = 0;
      if (st.mode === 'idle') {
        st.wait -= dt;
        if (Math.hypot(st.x - c.player.x, st.z - c.player.z) < 0.7) st.wait = Math.min(st.wait, 0.4);   // you're standing on my feet
        if (st.wait <= 0) think();
      } else if (st.mode === 'walk') {
        const dx = st.tx - st.x, dz = st.tz - st.z, l = Math.hypot(dx, dz);
        const sp = st.run ? 2.7 : 1.15;
        if (l < 0.18) {
          if (st.job) { st.mode = 'work'; st.jobT = 0; st.actT = 0.3; } else st.mode = 'idle';
        } else {
          const nx = st.x + (dx / l) * sp * dt, nz = st.z + (dz / l) * sp * dt;
          if (!raft.isSupported(nx, nz)) {
            // a gap in the way: give up on it
            st.mode = st.job && l < 1.6 ? 'work' : 'idle'; st.jobT = 0; st.actT = 0.3;
            if (st.mode === 'idle') { st.job = null; st.wait = 1.5; }
          } else {
            // don't walk through you
            const pd = Math.hypot(nx - c.player.x, nz - c.player.z);
            const was = Math.hypot(st.x - c.player.x, st.z - c.player.z);
            if (pd > 0.55 || pd >= was || st.run) { st.x = nx; st.z = nz; moving = 1; }
            else {
              // you're in the way: step round you
              const ax = was > 0.01 ? (st.x - c.player.x) / was : 1, az = was > 0.01 ? (st.z - c.player.z) / was : 0;
              const side = (-az * dx + ax * dz) >= 0 ? 1 : -1;
              const sx = st.x + (-az * side + ax * 0.6) * sp * dt, sz = st.z + (ax * side + az * 0.6) * sp * dt;
              if (raft.isSupported(sx, sz)) { st.x = sx; st.z = sz; moving = 1; }
            }
            face(st.tx, st.tz, dt, 7);
          }
        }
      } else if (st.mode === 'work' && st.job) {
        work(t, dt);
      } else {
        st.mode = 'idle';
      }

      st.speed += ((moving ? (st.run ? 2.7 : 1.15) : 0) - st.speed) * Math.min(1, dt * 8);
      body.root.position.set(st.x, raft.deckHeightAt(st.x, st.z), st.z);
      body.root.rotation.y = st.yaw;
      for (const k in held) held[k].visible = upd.hold === k;
      upd.speed = st.speed; upd.moving = moving; upd.run = st.run && moving ? 1 : 0;
      body.update(dt, upd);
    },
  };
  return api;
}
