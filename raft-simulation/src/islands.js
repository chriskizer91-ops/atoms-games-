import * as THREE from 'three';
import { ISLAND, ISLAND_SIZES, WORLD } from './config.js';
import { materials } from './materials.js';
import { frondGeometry } from './debris.js';
import { smoothstep } from './util.js';

// The sea is a chart of islands at fixed spots, generated square by square
// as you travel. The raft drifts north on its own (or sails toward an island
// picked on the map). When it reaches an island it rests alongside for a
// visit, and moves on once you are back aboard (an anchor holds it there).
//
// Islands come in three sizes and are built from their seed: beach, grass,
// a hill, and things to gather with E: palms, bushes, rocks (stone, sometimes
// ore), bamboo, sand, clay, shells, wild potatoes, watermelons, driftwood,
// washed-up crates. One far-off island has a lighthouse.

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
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  M = {
    ground: std({ vertexColors: true, roughness: 0.95 }),
    trunk,
    leaf: base.leaf,
    coconut: base.coconut,
    bush: std({ color: 0x4d7a33, roughness: 0.8, flatShading: true }),
    bushDry: std({ color: 0x8a8a4a, flatShading: true }),
    rock: base.stone,
    ore: std({ color: 0x8a5a3c, roughness: 0.6, metalness: 0.3, flatShading: true }),
    log: trunk,
    crate: base.planks[3],
    strap: base.darkMetal,
    bamboo: std({ color: 0x9bb35a, roughness: 0.55 }),
    bambooLeaf: std({ color: 0x5f8f3a, side: THREE.DoubleSide, roughness: 0.7 }),
    sand: std({ color: 0xd6c08a, roughness: 1 }),
    clay: std({ color: 0xa4593a, roughness: 0.9 }),
    shell: std({ color: 0xf3dcc8, roughness: 0.4 }),
    shellPink: std({ color: 0xe9a9a0, roughness: 0.4 }),
    potatoLeaf: std({ color: 0x4f8a35, flatShading: true }),
    potato: std({ color: 0x9a7346, roughness: 0.9 }),
    melon: std({ color: 0x3f7a35, roughness: 0.45 }),
    melonLeaf: std({ color: 0x5a8f3a, side: THREE.DoubleSide, flatShading: true }),
    white: std({ color: 0xf2efe8, roughness: 0.6 }),
    red: std({ color: 0xb8342b, roughness: 0.6 }),
    lamp: std({ color: 0xfff2c0, emissive: 0xffd77a, emissiveIntensity: 0, roughness: 0.3 }),
    doorWood: std({ color: 0x5a3b26, roughness: 0.8 }),
    bottleGlass: std({ color: 0x5f9a6a, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.7 }),
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
    cane: new THREE.CylinderGeometry(0.045, 0.05, 1, 7).translate(0, 0.5, 0),
    blade: new THREE.ConeGeometry(0.08, 0.5, 3).scale(1, 1, 0.2).rotateZ(Math.PI / 2.4),
    mound: new THREE.SphereGeometry(0.55, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.35, 1),
    disc: new THREE.CircleGeometry(0.75, 14).rotateX(-Math.PI / 2),
    lump: new THREE.IcosahedronGeometry(0.16, 1),
    shell: new THREE.ConeGeometry(0.07, 0.09, 7).rotateX(Math.PI / 2),
    leafClump: new THREE.IcosahedronGeometry(0.28, 1),
    tuber: new THREE.SphereGeometry(0.09, 8, 6).scale(1.3, 0.8, 1),
    melon: new THREE.SphereGeometry(0.26, 14, 10).scale(1.25, 0.9, 1),
    melonLeaf: new THREE.CircleGeometry(0.22, 6).rotateX(-Math.PI / 2),
    tower: new THREE.CylinderGeometry(1.0, 1.5, 12, 14, 4),
    lampRoom: new THREE.CylinderGeometry(0.85, 0.85, 1.4, 12),
    roof: new THREE.ConeGeometry(1.1, 1.1, 12),
    door: new THREE.BoxGeometry(0.8, 1.8, 0.12),
    bottle: new THREE.CylinderGeometry(0.07, 0.08, 0.32, 10).rotateZ(Math.PI / 2),
    hitTree: new THREE.CylinderGeometry(0.7, 0.7, 4.5, 8).translate(0, 2.2, 0),
    hitSmall: new THREE.SphereGeometry(0.8, 8, 6),
  };
}

const KINDS = ['palm', 'bush', 'rock', 'bamboo', 'sand', 'clay', 'shells', 'potato', 'melon', 'log', 'crate'];

function buildIsland(rec) {
  init();
  const r = rng(rec.seed);
  const R = rec.R;
  const big = R > 24, small = R < 12;
  const peak = small ? 0.8 + r() * 0.8 : big ? 5 + r() * 4 : 2.2 + r() * 3;
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
  const segs = small ? 56 : big ? 120 : 96;
  const geo = new THREE.PlaneGeometry(S, S, segs, segs).rotateX(-Math.PI / 2);
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

  // A spot on land in a band of the island (t: 0 coast .. 1 middle).
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
  const count = (perArea, min = 0) => Math.max(min, Math.round((R * R) / 100 * perArea * (0.75 + r() * 0.5)));

  for (let k = count(0.9, 1); k > 0; k--) {
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
    addRes('palm', s, g, G.hitTree, 3, 90).nuts = nuts;
  }

  for (let k = count(1.2, 1); k > 0; k--) {
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

  for (let k = small ? 1 : count(0.8, 1); k > 0; k--) {
    const s = spot(0.4, 0.95);
    if (!s) continue;
    const g = new THREE.Group();
    const ore = r() < (big ? 0.6 : 0.35);
    for (let b = 0; b < 3; b++) {
      const m = new THREE.Mesh(G.rock, b === 0 && ore ? M.ore : M.rock);
      m.position.set((r() - 0.5) * 0.7, 0.15 + r() * 0.2, (r() - 0.5) * 0.7);
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      m.scale.setScalar(0.6 + r() * 0.7);
      g.add(m);
    }
    addRes('rock', s, g, G.hitSmall, 3, 200).ore = ore;
  }

  if (!small) {
    for (let k = count(0.45, 1); k > 0; k--) {
      const s = spot(0.45, 0.9);
      if (!s) continue;
      const g = new THREE.Group();
      for (let b = 0; b < 7; b++) {
        const cane = new THREE.Mesh(G.cane, M.bamboo);
        const hgt = 2.4 + r() * 2;
        cane.scale.set(1, hgt, 1);
        cane.position.set((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7);
        cane.rotation.set((r() - 0.5) * 0.15, 0, (r() - 0.5) * 0.15);
        g.add(cane);
        for (let l = 0; l < 3; l++) {
          const leaf = new THREE.Mesh(G.blade, M.bambooLeaf);
          leaf.position.set(cane.position.x, hgt * (0.6 + l * 0.15), cane.position.z);
          leaf.rotation.y = r() * 6.3;
          g.add(leaf);
        }
      }
      addRes('bamboo', s, g, G.hitTree, 3, 120);
    }
  }

  for (let k = count(0.35, 1); k > 0; k--) {
    const s = spot(0.2, 0.3);
    if (!s) continue;
    const g = new THREE.Group();
    g.add(new THREE.Mesh(G.mound, M.sand));
    addRes('sand', s, g, G.hitSmall, 4, 60);
  }

  for (let k = small ? (r() < 0.5 ? 1 : 0) : count(0.25, 1); k > 0; k--) {
    const s = spot(0.22, 0.4);
    if (!s) continue;
    const g = new THREE.Group();
    const d = new THREE.Mesh(G.disc, M.clay);
    d.position.y = 0.03;
    g.add(d);
    for (let b = 0; b < 4; b++) {
      const l = new THREE.Mesh(G.lump, M.clay);
      l.position.set((r() - 0.5) * 0.8, 0.07, (r() - 0.5) * 0.8);
      g.add(l);
    }
    addRes('clay', s, g, G.hitSmall, 3, 150);
  }

  for (let k = count(0.5, 2); k > 0; k--) {
    const s = spot(0.2, 0.28);
    if (!s) continue;
    const g = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const sh = new THREE.Mesh(G.shell, b % 2 ? M.shellPink : M.shell);
      sh.position.set((r() - 0.5) * 0.4, 0.04, (r() - 0.5) * 0.4);
      sh.rotation.y = r() * 6.3;
      g.add(sh);
    }
    addRes('shells', s, g, G.hitSmall, 1, 90);
  }

  for (let k = small ? 0 : count(0.3, 1); k > 0; k--) {
    const s = spot(0.4, 0.85);
    if (!s) continue;
    const g = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const m = new THREE.Mesh(G.leafClump, M.potatoLeaf);
      m.position.set((r() - 0.5) * 0.5, 0.2, (r() - 0.5) * 0.5);
      g.add(m);
    }
    const tub = new THREE.Mesh(G.tuber, M.potato);
    tub.position.set(0.25, 0.03, 0.1);
    g.add(tub);
    addRes('potato', s, g, G.hitSmall, 1, 200);
  }

  for (let k = small ? 0 : count(0.2, big ? 1 : 0); k > 0; k--) {
    const s = spot(0.35, 0.75);
    if (!s) continue;
    const g = new THREE.Group();
    const m = new THREE.Mesh(G.melon, M.melon);
    m.position.y = 0.2;
    g.add(m);
    for (let b = 0; b < 5; b++) {
      const lf = new THREE.Mesh(G.melonLeaf, M.melonLeaf);
      lf.position.set(Math.cos(b * 1.3) * 0.45, 0.05, Math.sin(b * 1.3) * 0.45);
      g.add(lf);
    }
    addRes('melon', s, g, G.hitSmall, 1, 240);
  }

  for (let k = small ? 1 : 2 + Math.floor(r() * 2); k > 0; k--) {
    const s = spot(0.21, 0.3);
    if (!s) continue;
    const g = new THREE.Group();
    const m = new THREE.Mesh(G.log, M.log);
    m.position.y = 0.12;
    m.rotation.y = r() * Math.PI;
    g.add(m);
    addRes('log', s, g, G.hitSmall, 1, 0);
  }

  if (r() < (small ? 0.35 : 0.7)) {
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

  // A bottle washed up on the beach, for the story.
  if (rec.bottle) {
    const s = spot(0.21, 0.27);
    if (s) {
      const g = new THREE.Group();
      const b = new THREE.Mesh(G.bottle, M.bottleGlass);
      b.rotation.set(0, r() * 6, 0.25);
      b.position.y = 0.06;
      g.add(b);
      addRes('bottle', s, g, G.hitSmall, 1, 0);
    }
  }

  // The lighthouse: striped tower on the high ground, lamp lit at night.
  let lamp = null;
  if (rec.kind === 'lighthouse') {
    const s = spot(0.6, 0.85) || { x: 0, z: 0, h: heightLocal(0, 0) };
    const lh = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.0 + (1 - k / 4) * 0.5 - 0.125, 1.0 + (1 - k / 4) * 0.5, 3, 14), k % 2 ? M.red : M.white);
      band.position.y = 1.5 + k * 3;
      lh.add(band);
    }
    lamp = new THREE.Mesh(G.lampRoom, M.lamp.clone());
    lamp.position.y = 12.7;
    lh.add(lamp);
    const roof = new THREE.Mesh(G.roof, M.red);
    roof.position.y = 13.95;
    lh.add(roof);
    lh.position.set(s.x, s.h - 0.2, s.z);
    lh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(lh);
    // the door: E here lights the lamp
    const door = new THREE.Group();
    const dm = new THREE.Mesh(G.door, M.doorWood);
    dm.position.y = 0.9;
    door.add(dm);
    door.rotation.y = Math.atan2(s.x, s.z);
    const out = Math.hypot(s.x, s.z) || 1;
    const ds = { x: s.x + (s.x / out) * 1.5, z: s.z + (s.z / out) * 1.5 };
    ds.h = heightLocal(ds.x, ds.z);
    addRes('lamp', ds, door, G.hitSmall, 1, 0);
  }

  return { group, R, heightLocal, shapeR, resources, size: S, lamp };
}

const LABEL = {
  palm: (n) => (n ? `Shake the palm (${n} coconut${n > 1 ? 's' : ''})` : 'No coconuts left yet'),
  bush: (n) => (n ? 'Pull palm fiber from the bush' : 'Picked clean for now'),
  rock: (n) => (n ? 'Break off some stones' : 'Nothing loose left'),
  bamboo: (n) => (n ? 'Cut some bamboo' : 'Only stumps left for now'),
  sand: (n) => (n ? 'Dig up some sand' : 'Dug out for now'),
  clay: (n) => (n ? 'Dig up some clay' : 'Dug out for now'),
  shells: () => 'Pick up the shells',
  potato: () => 'Dig up the wild potatoes',
  melon: () => 'Pick the watermelon',
  log: () => 'Take the driftwood',
  crate: () => 'Open the crate',
  bottle: () => 'Pick up the bottle',
  lamp: (n) => (n ? 'Climb the lighthouse and light the lamp' : 'The lamp is lit'),
};

export function createIslands(scene, { fx, audio }) {
  const st = {
    rw: { x: 0, z: 0 },   // the raft's position on the chart
    heading: Math.PI,     // radians; PI = north (-z)
    dest: null,           // chart id while sailing to an island
    chart: new Map(),     // id -> record
    chunks: new Set(),
    resting: null,        // chart id of the island the raft rests beside
    visitLeft: 0,
    held: false,
    warned: false,
    lock: null,           // the island just left: no stopping there again until clear
    trail: [],
    seed: 1,
  };
  // Islands close enough to have a mesh in the scene (up to MAX_ACTIVE), by chart id.
  const actives = new Map();
  const MAX_ACTIVE = 3;
  let primary = null;     // the one you're at (resting) or closest to
  let events = {};

  const key = (cx, cz) => `${cx},${cz}`;

  function makeRecord(id, x, z, sizeKey, kind = 'island') {
    const sz = ISLAND_SIZES[sizeKey];
    const r = rng(st.seed * 7919 + id * 104729);
    return {
      id, x, z, size: sizeKey, kind,
      R: sz.radius[0] + r() * (sz.radius[1] - sz.radius[0]),
      seed: (st.seed * 31 + id * 2654435761) >>> 0,
      seen: false, visited: false, bottle: r() < 0.45, res: null,
    };
  }

  // One island per chart square (most squares), kept off the start area.
  function genChunk(cx, cz) {
    const k = key(cx, cz);
    if (st.chunks.has(k)) return;
    st.chunks.add(k);
    const r = rng(st.seed * 92821 + cx * 68903 + cz * 39119);
    if (r() > WORLD.islandChance) return;
    const x = (cx + 0.15 + r() * 0.7) * WORLD.chunk;
    const z = (cz + 0.15 + r() * 0.7) * WORLD.chunk;
    if (Math.hypot(x, z) < 200) return;
    let roll = r() * Object.values(ISLAND_SIZES).reduce((a, b) => a + b.weight, 0);
    let sizeKey = 'medium';
    for (const k in ISLAND_SIZES) { roll -= ISLAND_SIZES[k].weight; if (roll <= 0) { sizeKey = k; break; } }
    const id = st.chart.size + 1;
    st.chart.set(id, makeRecord(id, x, z, sizeKey));
  }

  let lastChunk = '';
  function ensureChart() {
    const cx = Math.floor(st.rw.x / WORLD.chunk), cz = Math.floor(st.rw.z / WORLD.chunk);
    const k = key(cx, cz);
    if (k === lastChunk) return;
    lastChunk = k;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) genChunk(cx + i, cz + j);
  }

  function despawn(id) {
    const a = actives.get(id);
    if (!a) return;
    // remember what was gathered
    a.rec.res = a.built.resources.map((r) => r.amount);
    scene.remove(a.built.group);
    actives.delete(id);
    if (primary === a) primary = null;
  }
  function despawnAll() {
    for (const id of [...actives.keys()]) despawn(id);
  }

  function spawn(rec) {
    const built = buildIsland(rec);
    built.resources.forEach((r, i) => {
      r.rec = rec;
      if (rec.res && rec.res[i] != null) r.amount = rec.res[i];
    });
    const a = { rec, built };
    actives.set(rec.id, a);
    scene.add(built.group);
    refreshResources(a);
    place(a);
    return a;
  }

  function place(a) {
    local(a.rec, tmpL);
    a.built.group.position.set(tmpL.x, 0, tmpL.z);
    a.built.group.updateMatrixWorld(true);
  }

  function refreshResources(a) {
    if (!a) return;
    for (const res of a.built.resources) {
      if (res.kind === 'palm') res.nuts.forEach((n, i) => (n.visible = i < res.amount));
      else if (res.kind === 'bush') res.mesh.children.forEach((m) => { if (m.material !== M.hit) m.material = res.amount ? M.bush : M.bushDry; });
      else if (res.kind === 'rock' || res.kind === 'sand' || res.kind === 'clay' || res.kind === 'bamboo') res.mesh.scale.setScalar(res.amount ? 0.55 + 0.45 * (res.amount / res.max) : 0.4);
      else if (res.kind !== 'lamp') res.mesh.visible = res.amount > 0;
    }
  }

  const distTo = (rec) => Math.hypot(rec.x - st.rw.x, rec.z - st.rw.z);
  // How far an island's outline reaches toward a point (ax, az from its centre).
  // Exact once it has a mesh; a safe guess before that.
  function shoreOf(rec, ax, az) {
    const a = actives.get(rec.id);
    return a ? a.built.shapeR(Math.atan2(az, ax)) : rec.R * 1.3;
  }
  const local = (rec, out = { x: 0, z: 0 }) => { out.x = rec.x - st.rw.x; out.z = rec.z - st.rw.z; return out; };
  const tmpL = { x: 0, z: 0 };

  // Which islands should have meshes: the one you're resting at, then the nearest.
  function pickActives() {
    const want = [];
    for (const rec of st.chart.values()) {
      const d = distTo(rec);
      if (d < 420 && (rec.kind !== 'lighthouse' || rec.seen || d < 300)) want.push([d, rec]);
    }
    want.sort((a, b) => a[0] - b[0]);
    const keep = new Set(want.slice(0, MAX_ACTIVE).map(([, r]) => r.id));
    if (st.resting != null && st.chart.has(st.resting)) keep.add(st.resting);
    for (const id of [...actives.keys()]) if (!keep.has(id)) despawn(id);
    for (const id of keep) if (!actives.has(id)) spawn(st.chart.get(id));
    primary = (st.resting != null && actives.get(st.resting)) || (want.length ? actives.get(want[0][1].id) : null) || null;
  }

  const api = {
    on(e) { events = e; },
    get state() { return st; },
    get island() {
      if (!primary) return null;
      local(primary.rec, tmpL);
      const phase = st.resting === primary.rec.id ? 'visit' : st.lock === primary.rec.id ? 'leave' : 'approach';
      return { rec: primary.rec, built: primary.built, phase, visitLeft: st.visitLeft, x: tmpL.x, z: tmpL.z };
    },
    // Every island with a mesh right now (for tests and the HUD).
    get nearby() { return [...actives.values()].map((a) => a.rec); },
    built(id) { const a = actives.get(id); return a ? a.built : null; },
    get resting() { return st.resting != null; },
    get dest() { return st.dest; },

    reset(seed = Math.floor(Math.random() * 1e6)) {
      despawnAll();
      Object.assign(st, { rw: { x: 0, z: 0 }, heading: Math.PI, dest: null, resting: null, visitLeft: 0, held: false, warned: false, lock: null, trail: [], seed });
      st.chart = new Map();
      st.chunks = new Set();
      lastChunk = '';
      // A first island close ahead so you don't wait long, and the far lighthouse.
      st.chart.set(1, makeRecord(1, 26, -210, 'medium'));
      st.chunks.add(key(0, -1));
      const a = 0.35 + Math.random() * 0.5;
      st.chart.set(2, makeRecord(2, Math.sin(a) * 2600, -Math.cos(a) * 2600, 'large', 'lighthouse'));
      st.chart.get(2).bottle = false;
      ensureChart();
      pickActives();
    },

    // Terrain height at a local (raft-frame) point, or -Infinity off every island.
    heightAt(x, z) {
      let h = -Infinity;
      for (const a of actives.values()) {
        local(a.rec, tmpL);
        const lx = x - tmpL.x, lz = z - tmpL.z;
        if (Math.abs(lx) > a.built.size / 2 || Math.abs(lz) > a.built.size / 2) continue;
        h = Math.max(h, a.built.heightLocal(lx, lz));
      }
      return h;
    },
    // The island you're at or nearest to.
    center() {
      if (!primary) return null;
      local(primary.rec, tmpL);
      return { x: tmpL.x, z: tmpL.z, r: primary.rec.R };
    },

    hitTargets() {
      const out = [];
      for (const a of actives.values()) for (const r of a.built.resources) if (r.mesh.visible) out.push(r.hit);
      return out;
    },
    describe(res) {
      return res.amount > 0
        ? { key: 'E', text: LABEL[res.kind](res.amount), act: 'gather' }
        : { text: LABEL[res.kind](0), dim: true };
    },
    gather(res) {
      if (res.amount <= 0) return null;
      if (res.kind === 'lamp') {
        res.amount = 0;
        res.rec.lit = true;
        events.onLamp?.();
        return null;
      }
      const rnd = Math.random;
      const one = res.kind !== 'bush' && res.kind !== 'rock' && res.kind !== 'bamboo' && res.kind !== 'sand' && res.kind !== 'clay';
      const loot = {
        palm: () => ({ coconut: res.amount }),
        bush: () => ({ fiber: 2 }),
        rock: () => (res.ore && rnd() < 0.6 ? { stone: 2, ore: 1 } : { stone: 2 }),
        bamboo: () => ({ bamboo: 2 }),
        sand: () => ({ sand: 2 }),
        clay: () => ({ clay: 2 }),
        shells: () => ({ shells: 1 + Math.floor(rnd() * 2) }),
        potato: () => ({ potato: 2, potatoSeed: 1 + Math.floor(rnd() * 2) }),
        melon: () => ({ melon: 1, melonSeed: 1 + Math.floor(rnd() * 2) }),
        log: () => ({ wood: 3 }),
        bottle: () => ({ bottle: 1 }),
        crate: () => {
          const l = { scrap: 2 + Math.floor(rnd() * 3), plastic: 1 + Math.floor(rnd() * 3) };
          if (rnd() < 0.5) l.rope = 1;
          if (rnd() < 0.4) l.potatoSeed = 1;
          return l;
        },
      }[res.kind]();
      if (one) res.amount = 0;
      else res.amount--;
      res.t = 0;
      audio.pickup();
      refreshResources(actives.get(res.rec.id));
      return loot;
    },

    // Put an island just ahead of the raft right away (for testing).
    summon(raftCenter, raftRadius, sizeKey = 'medium') {
      const id = st.chart.size + 1;
      const rec = makeRecord(id, 0, 0, sizeKey);
      rec.x = st.rw.x + raftCenter.x + 4;
      rec.z = st.rw.z + raftCenter.z - (rec.R * 0.95 + raftRadius + 8 + 40);
      rec.seen = true;
      st.chart.set(id, rec);
      events.onSighted?.(rec);
      return rec;
    },

    // ---------- chart, for the map ----------
    chartView(radius) {
      const out = [];
      for (const rec of st.chart.values()) {
        if (!rec.seen) continue;
        if (Math.hypot(rec.x - st.rw.x, rec.z - st.rw.z) > radius) continue;
        out.push(rec);
      }
      return out;
    },
    // Reveal a chart island (the last bottle does this for the lighthouse).
    reveal(id) {
      const rec = st.chart.get(id);
      if (rec) rec.seen = true;
      return rec;
    },
    lighthouse() {
      for (const rec of st.chart.values()) if (rec.kind === 'lighthouse') return rec;
      return null;
    },
    setDestination(id) {
      st.dest = id;
      if (id != null && st.resting != null && st.resting !== id) {
        // leaving a visit for somewhere else
        st.lock = st.resting;
        st.resting = null;
      }
    },

    serialize() {
      despawnKeep();
      return {
        rw: { ...st.rw }, heading: st.heading, dest: st.dest, resting: st.resting, visitLeft: st.visitLeft, lock: st.lock,
        trail: st.trail.slice(-400), seed: st.seed, chunks: [...st.chunks],
        chart: [...st.chart.values()].map((r) => ({ ...r })),
      };
    },
    restore(d) {
      despawnAll();
      if (!d || !d.chart) { api.reset(); return; }
      Object.assign(st, {
        rw: d.rw, heading: d.heading, dest: d.dest, resting: d.resting, visitLeft: d.visitLeft, lock: d.lock,
        trail: d.trail || [], seed: d.seed, held: false, warned: false,
      });
      st.chunks = new Set(d.chunks);
      st.chart = new Map(d.chart.map((r) => [r.id, r]));
      lastChunk = '';
      st.pickT = 0;
      pickActives();
    },

    // ctx: { aboard, anchored, hasSail, onTower, raftRadius }
    update(dt, ctx) {
      ensureChart();
      const raftR = ctx.raftRadius;
      const rc = ctx.raftCenter || { x: 0, z: 0 };

      // Mark islands in sight on the chart.
      const sight = ctx.onTower ? WORLD.towerSight : WORLD.sight;
      for (const rec of st.chart.values()) {
        if (rec.seen || rec.kind === 'lighthouse') continue;
        if (distTo(rec) < sight) {
          rec.seen = true;
          events.onSighted?.(rec);
        }
      }

      // ---- movement ----
      let speed = 0;
      if (st.resting != null) {
        const rec = st.chart.get(st.resting);
        if (!ctx.anchored) st.visitLeft = Math.max(0, st.visitLeft - dt);
        if (!ctx.anchored && st.visitLeft < 30 && !st.warned) {
          st.warned = true;
          events.onLeavingSoon?.();
        }
        if (st.visitLeft <= 0 && !ctx.anchored) {
          if (ctx.aboard) {
            st.lock = st.resting;
            st.resting = null;
            if (st.dest === rec.id) st.dest = null;
            events.onDepart?.(rec);
          } else if (!st.held) {
            st.held = true;
            events.onWaiting?.();
          }
        }
      } else if (!ctx.anchored && !ctx.onLand) {
        const sailing = ctx.hasSail && st.dest != null;
        speed = sailing ? WORLD.sail : WORLD.drift;
        let want = Math.PI; // the current runs north
        let target = sailing ? st.chart.get(st.dest) : null;
        if (!target) {
          // The current carries you to an island close to your line ahead.
          let best = null, bestD = Infinity;
          for (const rec of st.chart.values()) {
            if (rec.id === st.lock || rec.kind === 'lighthouse') continue;
            const dx = rec.x - st.rw.x - rc.x, dz = rec.z - st.rw.z - rc.z;
            if (dz > -10 || dz < -380) continue; // ahead (north) and not too far
            if (Math.abs(dx) > WORLD.pullLateral + rec.R) continue;
            const d = Math.hypot(dx, dz);
            if (d < bestD) { bestD = d; best = rec; }
          }
          target = best;
        }
        if (target) {
          // Head for the point just off its shore facing you.
          const dx = target.x - st.rw.x - rc.x, dz = target.z - st.rw.z - rc.z;
          const d = Math.hypot(dx, dz) || 1;
          // Stop with a short swim between the raft's edge and the beach.
          const stopAt = shoreOf(target, -dx, -dz) * 0.92 + raftR + 5;
          if (d <= stopAt + 0.5) {
            st.resting = target.id;
            st.visitLeft = ISLAND.visit;
            st.held = false;
            st.warned = false;
            target.visited = true;
            speed = 0;
            events.onArrive?.(target);
          } else {
            want = Math.atan2(dx, dz);
            speed *= Math.min(1, (d - stopAt) / 30 + 0.25);
          }
        }
        // Steer round any other island on the way: if one sits across the line
        // we want to take, aim for the edge of it on whichever side is closer.
        {
          const wx = Math.sin(want), wz = Math.cos(want);
          const goal = target ? Math.hypot(target.x - st.rw.x - rc.x, target.z - st.rw.z - rc.z) : Infinity;
          for (const rec of st.chart.values()) {
            if (rec === target) continue;
            const dx = rec.x - st.rw.x - rc.x, dz = rec.z - st.rw.z - rc.z;
            if (Math.abs(dx) > 260 || Math.abs(dz) > 260) continue;
            const d = Math.hypot(dx, dz) || 1;
            const clear = shoreOf(rec, -dx, -dz) + raftR + 8;
            const along = dx * wx + dz * wz;
            const side = dx * wz - dz * wx;
            if (along <= 0 || along > goal || Math.abs(side) >= clear || d > clear + 160) continue;
            const toIsland = Math.atan2(dx, dz);
            const off = d > clear ? Math.asin(clear / d) : Math.PI / 2 + 0.2;
            const a1 = toIsland + off, a2 = toIsland - off;
            const gap = (a) => Math.abs(Math.atan2(Math.sin(a - want), Math.cos(a - want)));
            want = gap(a1) < gap(a2) ? a1 : a2;
            break;
          }
        }
        // turn gently toward the wanted heading
        let diff = want - st.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = (sailing ? 0.6 : 0.3) * dt;   // a sail swings the raft round faster
        st.heading += Math.max(-turn, Math.min(turn, diff));
      }
      if (st.lock != null) {
        const rec = st.chart.get(st.lock);
        if (!rec || distTo(rec) > rec.R + 250) st.lock = null;
      }
      st.rw.x += Math.sin(st.heading) * speed * dt;
      st.rw.z += Math.cos(st.heading) * speed * dt;
      // Never end up inside an island: push back out past its beach.
      for (const rec of st.chart.values()) {
        const dx = st.rw.x + rc.x - rec.x, dz = st.rw.z + rc.z - rec.z;
        if (Math.abs(dx) > 120 || Math.abs(dz) > 120) continue;
        const d = Math.hypot(dx, dz) || 1;
        const min = shoreOf(rec, dx, dz) * 0.88 + raftR + 2;
        if (d < min) {
          st.rw.x += (dx / d) * (min - d);
          st.rw.z += (dz / d) * (min - d);
        }
      }
      const last = st.trail[st.trail.length - 1];
      if (!last || Math.hypot(last[0] - st.rw.x, last[1] - st.rw.z) > 25) st.trail.push([Math.round(st.rw.x), Math.round(st.rw.z)]);

      // ---- which islands have meshes ----
      st.pickT = (st.pickT || 0) - dt;
      if (st.pickT <= 0 || (st.resting != null && !actives.has(st.resting))) { st.pickT = 0.5; pickActives(); }

      for (const a of actives.values()) {
        // Gathered things grow back slowly.
        for (const res of a.built.resources) {
          if (res.regrow && res.amount < res.max) {
            res.t += dt;
            if (res.t >= res.regrow) { res.t = 0; res.amount++; refreshResources(a); }
          }
        }
        place(a);
        if (a.built.lamp) a.built.lamp.material.emissiveIntensity = a.rec.lit ? (ctx.night > 0.3 ? 6 : 1.5) : 0;
      }
      return {
        speed, heading: st.heading,
        resting: st.resting != null, visitLeft: st.visitLeft,
        sailing: ctx.hasSail && st.dest != null && st.resting == null,
        active: primary && primary.rec,
      };
    },
  };

  // Snapshot gathered amounts without removing the meshes.
  function despawnKeep() {
    for (const a of actives.values()) a.rec.res = a.built.resources.map((r) => r.amount);
  }

  return api;
}

export { KINDS };
