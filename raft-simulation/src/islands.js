import * as THREE from 'three';
import { ISLAND } from './config.js';
import { materials } from './materials.js';
import { frondGeometry } from './debris.js';
import { rand, smoothstep } from './util.js';

// Islands drift in on the current, stop alongside the raft for a visit and
// drift on again once you are back aboard (an anchor keeps them there). Each
// one is generated from a seed: a sandy beach, grass, a hill, and things to
// gather with E: palms (coconuts), bushes (palm fiber), rocks (stone),
// driftwood (wood) and sometimes a washed-up crate (scrap and plastic).

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(r) {
  const N = 32;
  const g = new Float32Array(N * N);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z);
    let fx = x - xi, fz = z - zi;
    fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
    const w = (i, j) => g[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
    const a = w(xi, zi), b = w(xi + 1, zi), c = w(xi, zi + 1), d = w(xi + 1, zi + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
}

let M = null;
let G = null;
function init() {
  if (M) return;
  const base = materials();
  const trunk = base.bark.clone();
  trunk.vertexColors = false;
  trunk.color.set(0xc2a684);
  M = {
    ground: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    trunk,
    leaf: base.leaf,
    coconut: base.coconut,
    bush: new THREE.MeshStandardMaterial({ color: 0x4d7a33, roughness: 0.8, flatShading: true }),
    bushDry: new THREE.MeshStandardMaterial({ color: 0x8a8a4a, roughness: 0.85, flatShading: true }),
    rock: base.stone,
    log: trunk,
    crate: base.planks[3],
    strap: base.darkMetal,
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
  const frond = frondGeometry();
  G = {
    frond: frond.leaves,
    rib: frond.rib,
    coconut: new THREE.IcosahedronGeometry(0.14, 2),
    bush: new THREE.IcosahedronGeometry(0.45, 1),
    rock: new THREE.DodecahedronGeometry(0.42, 0),
    log: new THREE.CylinderGeometry(0.18, 0.2, 2.2, 9).rotateZ(Math.PI / 2),
    crate: new THREE.BoxGeometry(0.75, 0.55, 0.6),
    strap: new THREE.BoxGeometry(0.78, 0.06, 0.62),
    hitTree: new THREE.CylinderGeometry(0.7, 0.7, 4.5, 8).translate(0, 2.2, 0),
    hitSmall: new THREE.SphereGeometry(0.8, 8, 6),
  };
}

function buildIsland(seed) {
  init();
  const r = rng(seed);
  const R = ISLAND.radius[0] + r() * (ISLAND.radius[1] - ISLAND.radius[0]);
  const peak = 2.2 + r() * 3.2;
  const ph = [r() * 6.3, r() * 6.3, r() * 6.3];
  const noise = valueNoise(r);
  const shapeR = (a) => R * (1 + 0.16 * Math.sin(3 * a + ph[0]) + 0.09 * Math.sin(5 * a + ph[1]) + 0.05 * Math.sin(9 * a + ph[2]));

  function heightLocal(x, z) {
    const d = Math.hypot(x, z);
    const t = 1 - d / shapeR(Math.atan2(z, x)); // 1 at the middle, 0 at the outline
    if (t < 0) return -1.6 + t * 7;              // shelves away into deep water
    const n = noise(x * 0.16 + 7, z * 0.16 + 3) - 0.5;
    return -1.6 + 2.3 * smoothstep(0, 0.32, t) + peak * Math.pow(smoothstep(0.25, 1, t), 1.5) + n * 0.9 * smoothstep(0.2, 0.6, t);
  }

  // Terrain mesh with sand, grass and rock coloured by height and slope.
  const S = R * 2.9;
  const geo = new THREE.PlaneGeometry(S, S, 96, 96).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightLocal(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const sand = new THREE.Color(0xe2cd96), wet = new THREE.Color(0xbfa771), grass = new THREE.Color(0x6a9a3a), grass2 = new THREE.Color(0x527f30), rock = new THREE.Color(0x8b877c);
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i);
    const n = noise(pos.getX(i) * 0.9, pos.getZ(i) * 0.9);
    c.copy(wet).lerp(sand, smoothstep(-0.4, 0.25, h));
    const g = smoothstep(0.65, 1.15, h + (n - 0.5) * 0.4);
    c.lerp(grass2.clone().lerp(grass, n), g);
    const steep = 1 - smoothstep(0.62, 0.8, nrm.getY(i));
    c.lerp(rock, Math.max(steep * smoothstep(0.5, 1.2, h), smoothstep(peak * 0.75, peak, h - 1.6) * 0.8));
    c.multiplyScalar(0.92 + n * 0.16);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const ground = new THREE.Mesh(geo, M.ground);
  ground.receiveShadow = true;
  ground.castShadow = true;
  const group = new THREE.Group();
  group.add(ground);

  // A spot on land at a given band of the island (t: 0 coast .. 1 middle).
  function spot(tMin, tMax) {
    for (let k = 0; k < 30; k++) {
      const a = r() * Math.PI * 2;
      const t = tMin + r() * (tMax - tMin);
      const d = shapeR(a) * (1 - t);
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = heightLocal(x, z);
      if (h > 0.25) return { x, z, h, a };
    }
    return null;
  }

  const resources = [];
  function addRes(kind, s, meshGroup, hitGeo, amount, regrow) {
    meshGroup.position.set(s.x, s.h, s.z);
    meshGroup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const hit = new THREE.Mesh(hitGeo, M.hit);
    meshGroup.add(hit);
    group.add(meshGroup);
    const res = { kind, mesh: meshGroup, hit, amount, max: amount, regrow, t: 0 };
    hit.userData.res = res;
    resources.push(res);
    return res;
  }

  const nPalms = 4 + Math.floor(r() * 4);
  for (let k = 0; k < nPalms; k++) {
    const s = spot(0.26, 0.62);
    if (!s) continue;
    const g = new THREE.Group();
    const lean = 0.8 + r() * 0.8;
    const ox = Math.cos(s.a) * lean, oz = Math.sin(s.a) * lean;
    const top = new THREE.Vector3(ox, 4.2 + r() * 1.2, oz);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(ox * 0.25, 1.6, oz * 0.25), new THREE.Vector3(ox * 0.7, 3.2, oz * 0.7), top]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.15, 8), M.trunk));
    for (let f = 0; f < 8; f++) {
      const fr = new THREE.Group();
      fr.add(new THREE.Mesh(G.frond, M.leaf), new THREE.Mesh(G.rib, M.trunk));
      fr.scale.setScalar(2.1);
      fr.position.copy(top);
      fr.rotation.set(0.25 + r() * 0.3, (f / 8) * Math.PI * 2 + r() * 0.3, 0, 'YXZ');
      g.add(fr);
    }
    const nuts = [];
    for (let n = 0; n < 3; n++) {
      const nut = new THREE.Mesh(G.coconut, M.coconut);
      nut.position.copy(top).add(new THREE.Vector3(Math.cos(n * 2.1) * 0.22, -0.25, Math.sin(n * 2.1) * 0.22));
      g.add(nut);
      nuts.push(nut);
    }
    const res = addRes('palm', s, g, G.hitTree, 3, 90);
    res.nuts = nuts;
  }

  const nBush = 5 + Math.floor(r() * 4);
  for (let k = 0; k < nBush; k++) {
    const s = spot(0.32, 0.9);
    if (!s) continue;
    const g = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const m = new THREE.Mesh(G.bush, M.bush);
      m.position.set((r() - 0.5) * 0.6, 0.25 + r() * 0.15, (r() - 0.5) * 0.6);
      m.scale.set(1, 0.8 + r() * 0.4, 1);
      g.add(m);
    }
    addRes('bush', s, g, G.hitSmall, 3, 60);
  }

  const nRock = 3 + Math.floor(r() * 4);
  for (let k = 0; k < nRock; k++) {
    const s = spot(0.4, 0.95);
    if (!s) continue;
    const g = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const m = new THREE.Mesh(G.rock, M.rock);
      m.position.set((r() - 0.5) * 0.7, 0.15 + r() * 0.2, (r() - 0.5) * 0.7);
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      m.scale.setScalar(0.6 + r() * 0.7);
      g.add(m);
    }
    addRes('rock', s, g, G.hitSmall, 3, 150);
  }

  const nLog = 2 + Math.floor(r() * 2);
  for (let k = 0; k < nLog; k++) {
    const s = spot(0.21, 0.3);
    if (!s) continue;
    const g = new THREE.Group();
    const m = new THREE.Mesh(G.log, M.log);
    m.position.y = 0.12;
    m.rotation.y = r() * Math.PI;
    g.add(m);
    addRes('log', s, g, G.hitSmall, 1, 0);
  }

  if (r() < 0.65) {
    const s = spot(0.22, 0.34);
    if (s) {
      const g = new THREE.Group();
      const m = new THREE.Mesh(G.crate, M.crate);
      m.position.y = 0.25;
      g.add(m);
      for (const y of [0.1, 0.42]) {
        const st = new THREE.Mesh(G.strap, M.strap);
        st.position.y = y;
        g.add(st);
      }
      g.rotation.set(0.08, r() * Math.PI, 0.05);
      addRes('crate', s, g, G.hitSmall, 1, 0);
    }
  }

  return { group, R, heightLocal, resources, size: S };
}

const LABEL = {
  palm: (n) => (n ? `Shake the palm (${n} coconut${n > 1 ? 's' : ''})` : 'No coconuts left yet'),
  bush: (n) => (n ? 'Pull palm fiber from the bush' : 'Picked clean for now'),
  rock: (n) => (n ? 'Break off some stones' : 'Nothing loose left'),
  log: () => 'Take the driftwood',
  crate: () => 'Open the crate',
};

export function createIslands(scene, { fx, audio }) {
  let island = null; // { seed, built, x, z, targetZ, phase, visitLeft, speed, warned }
  let nextIn = ISLAND.firstIn;
  let seedCount = 1;
  let events = {};

  function remove() {
    if (!island) return;
    scene.remove(island.built.group);
    island = null;
  }

  function spawn(raftCenter, raftRadius, seed, state) {
    const built = buildIsland(seed);
    const side = (seed % 2) ? 1 : -1;
    const lateral = built.R * 0.95 + raftRadius + 7;
    island = {
      seed, built,
      x: raftCenter.x + side * lateral,
      z: raftCenter.z - 280,
      targetZ: raftCenter.z,
      phase: 'approach',
      visitLeft: ISLAND.visit,
      speed: ISLAND.approachSpeed,
      warned: false,
      held: false,
    };
    if (state) {
      Object.assign(island, { x: state.x, z: state.z, targetZ: state.targetZ, phase: state.phase, visitLeft: state.visitLeft });
      built.resources.forEach((res, i) => { if (state.res && state.res[i] != null) res.amount = state.res[i]; });
    }
    built.group.position.set(island.x, 0, island.z);
    scene.add(built.group);
    refreshResources();
  }

  function refreshResources() {
    if (!island) return;
    for (const res of island.built.resources) {
      if (res.kind === 'palm') res.nuts.forEach((n, i) => (n.visible = i < res.amount));
      else if (res.kind === 'bush') res.mesh.children.forEach((m) => { if (m.material !== M.hit) m.material = res.amount ? M.bush : M.bushDry; });
      else if (res.kind === 'rock') res.mesh.scale.setScalar(0.55 + 0.15 * res.amount);
      else res.mesh.visible = res.amount > 0;
    }
  }

  const api = {
    on(e) { events = e; },
    get island() { return island; },

    reset() {
      remove();
      nextIn = ISLAND.firstIn;
    },

    // Terrain height at a world point, or -Infinity off the island.
    heightAt(x, z) {
      if (!island) return -Infinity;
      const lx = x - island.x, lz = z - island.z;
      if (Math.abs(lx) > island.built.size / 2 || Math.abs(lz) > island.built.size / 2) return -Infinity;
      return island.built.heightLocal(lx, lz);
    },
    center() { return island ? { x: island.x, z: island.z, r: island.built.R } : null; },

    hitTargets() {
      if (!island) return [];
      return island.built.resources.filter((r) => r.mesh.visible).map((r) => r.hit);
    },
    describe(res) {
      return res.amount > 0 || res.kind === 'log' || res.kind === 'crate'
        ? { key: 'E', text: LABEL[res.kind](res.amount), act: 'gather' }
        : { text: LABEL[res.kind](0), dim: true };
    },
    // Take from a resource; returns the materials gained.
    gather(res) {
      if (res.amount <= 0) return null;
      let loot;
      if (res.kind === 'palm') { loot = { coconut: res.amount }; res.amount = 0; }
      else if (res.kind === 'bush') { loot = { fiber: 2 }; res.amount--; }
      else if (res.kind === 'rock') { loot = { stone: 2 }; res.amount--; }
      else if (res.kind === 'log') { loot = { wood: 3 }; res.amount = 0; }
      else { loot = { scrap: 2 + Math.floor(Math.random() * 3), plastic: 1 + Math.floor(Math.random() * 3) }; if (Math.random() < 0.5) loot.coconut = 1; res.amount = 0; }
      res.t = 0;
      audio.pickup();
      refreshResources();
      return loot;
    },

    serialize() {
      return {
        nextIn,
        island: island && {
          seed: island.seed, x: island.x, z: island.z, targetZ: island.targetZ, phase: island.phase, visitLeft: island.visitLeft,
          res: island.built.resources.map((r) => r.amount),
        },
      };
    },
    restore(d) {
      remove();
      if (!d) return;
      nextIn = d.nextIn ?? ISLAND.firstIn;
      if (d.island) spawn({ x: 0, z: 0 }, 0, d.island.seed, d.island);
    },

    // Bring the next one in right away (for testing).
    summon(raftCenter, raftRadius) {
      remove();
      spawn(raftCenter, raftRadius, seedCount++ * 7919 + Math.floor(Math.random() * 1000));
      events.onSighted?.();
    },

    update(dt, { raftCenter, raftRadius, aboard, anchored }) {
      if (!island) {
        nextIn -= dt;
        if (nextIn <= 0) {
          spawn(raftCenter, raftRadius, seedCount++ * 7919 + Math.floor(Math.random() * 1000));
          events.onSighted?.();
        }
        return null;
      }
      const isl = island;
      if (isl.phase === 'approach') {
        const left = isl.targetZ - isl.z;
        isl.speed = Math.min(ISLAND.approachSpeed, left * 0.05 + 0.15);
        isl.z += isl.speed * dt;
        if (left < 0.5) {
          isl.phase = 'visit';
          events.onArrive?.(isl.visitLeft);
        }
      } else if (isl.phase === 'visit') {
        if (!anchored) isl.visitLeft = Math.max(0, isl.visitLeft - dt);
        if (!anchored && isl.visitLeft < 30 && !isl.warned) {
          isl.warned = true;
          events.onLeavingSoon?.();
        }
        if (isl.visitLeft <= 0 && !anchored) {
          if (aboard) {
            isl.phase = 'leave';
            isl.speed = 0;
            events.onDepart?.();
          } else if (!isl.held) {
            isl.held = true;
            events.onWaiting?.();
          }
        }
      } else {
        isl.speed = Math.min(ISLAND.approachSpeed, isl.speed + dt * 0.4);
        isl.z += isl.speed * dt;
        if (isl.z > raftCenter.z + 280) {
          remove();
          nextIn = rand(...ISLAND.every);
          return null;
        }
      }
      // Gathered things grow back slowly.
      for (const res of isl.built.resources) {
        if (res.regrow && res.amount < res.max) {
          res.t += dt;
          if (res.t >= res.regrow) { res.t = 0; res.amount++; refreshResources(); }
        }
      }
      isl.built.group.position.set(isl.x, 0, isl.z);
      isl.built.group.updateMatrixWorld(true);
      return isl;
    },
  };
  return api;
}
