import * as THREE from 'three';
import { ISLAND, ISLAND_SIZES, WORLD } from './config.js';
import { materials } from './materials.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { frondGeometry } from './debris.js';
import { smoothstep } from './util.js';
import { FRAME, setFrame, toScene, toWorld, frameYaw } from './frame.js';
import { SAILING, newBoat, stepBoat, autopilot, wrap } from './sailing.js';

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
    thatch: std({ color: 0x9a8a52, side: THREE.DoubleSide, roughness: 1 }),
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

// Things small enough to leave out when an island is a long way off.
const SMALL = new Set(['bush', 'rock', 'sand', 'clay', 'shells', 'potato', 'melon', 'log', 'crate', 'bottle']);

// A tree built from twenty parts costs twenty draw calls, three times a frame.
// Merge everything in a group that shares a material into one mesh (anything
// marked userData.keep stays its own: coconuts come and go).
function bake(g) {
  g.updateMatrixWorld(true);
  const buckets = new Map();
  const drop = [];
  g.traverse((o) => {
    if (!o.isMesh || o.userData.keep) return;
    const names = Object.keys(o.geometry.attributes).sort().join(',');
    const k = `${o.material.uuid}|${names}`;
    if (!buckets.has(k)) buckets.set(k, { material: o.material, parts: [] });
    const part = o.geometry.clone().applyMatrix4(o.matrixWorld);
    buckets.get(k).parts.push(part.index ? part.toNonIndexed() : part);
  });
  for (const c of [...g.children]) if (!c.userData.keep) drop.push(c);
  for (const c of drop) g.remove(c);
  for (const b of buckets.values()) {
    const geo = b.parts.length > 1 ? mergeGeometries(b.parts) : b.parts[0];
    if (geo) g.add(new THREE.Mesh(geo, b.material));
  }
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
  // Everything that stands on the island is above the water, so the pass
  // that draws what lies under the sea can leave it out.
  const tall = new THREE.Group();     // palms, bamboo, the lighthouse: the skyline
  const detail = new THREE.Group();   // the small things, only drawn close up
  tall.userData.above = true;
  detail.userData.above = true;
  group.add(tall, detail);

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
    if (kind !== 'lamp') bake(meshGroup);
    meshGroup.position.set(s.x, s.h, s.z);
    meshGroup.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const hit = new THREE.Mesh(hitGeo, M.hit);
    meshGroup.add(hit);
    (SMALL.has(kind) ? detail : tall).add(meshGroup);
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
      nut.userData.keep = true;
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
  let beam = null;
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
    // Two beams sweeping round from the lamp room once it is lit.
    beam = new THREE.Group();
    beam.position.y = 12.7;
    // Soft shafts: brightest near the lamp and through the thick of the
    // beam, fading to nothing at its end and at its edges.
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */ `
        varying float vAlong;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vAlong = abs(position.x) / 110.0;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlong;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float thick = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
          float a = pow(1.0 - vAlong, 1.7) * thick * 0.42;
          gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    for (const dir of [1, -1]) {
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 9, 110, 18, 1, true).rotateZ(Math.PI / 2).translate(55, 0, 0), beamMat);
      cone.rotation.y = dir > 0 ? 0 : Math.PI;
      beam.add(cone);
    }
    beam.visible = false;
    lh.add(beam);
    lh.position.set(s.x, s.h - 0.2, s.z);
    lh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    for (const c of beam.children) c.castShadow = false;
    tall.add(lh);
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

  // ----- what has happened here (built last, so the island's own shape and growth never change) -----
  // A castaway's camp: a lean-to, a fire, and someone waiting by it.
  let camp = null;
  if (rec.kind === 'camp') {
    const s = spot(0.3, 0.44) || spot(0.2, 0.6);
    if (s) {
      const g = new THREE.Group();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const st2 = new THREE.Mesh(G.rock, M.rock);
        st2.scale.setScalar(0.22);
        st2.position.set(Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42);
        st2.rotation.set(k, k * 2, 0);
        g.add(st2);
      }
      for (let k = 0; k < 3; k++) {
        const l = new THREE.Mesh(G.log, M.log);
        l.scale.set(0.3, 0.35, 0.35);
        l.position.y = 0.1;
        l.rotation.y = k * 2.1;
        g.add(l);
      }
      const ember = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff5a1a, emissiveIntensity: rec.rescued ? 0 : 2.4, roughness: 0.9 }));
      ember.position.y = 0.16;
      ember.userData.keep = true;
      g.add(ember);
      // the lean-to, its open side toward the fire
      const lt = new THREE.Group();
      for (const x of [-1.1, 1.1]) {
        const p = new THREE.Mesh(G.cane, M.log);
        p.scale.set(1.3, 1.7, 1.3);
        p.position.set(x, -0.1, 0);
        lt.add(p);
      }
      const ridge = new THREE.Mesh(G.cane, M.log);
      ridge.scale.set(1.1, 2.5, 1.1);
      ridge.rotation.z = Math.PI / 2;
      ridge.position.set(1.25, 1.55, 0);
      lt.add(ridge);
      const thatch = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.3, 6, 1), M.thatch);
      thatch.rotation.x = -Math.PI / 2 + 0.75;
      thatch.position.set(0, 0.8, -0.78);
      lt.add(thatch);
      for (let k = 0; k < 5; k++) {
        const rib = new THREE.Mesh(G.cane, M.log);
        rib.scale.set(0.7, 2.3, 0.7);
        rib.rotation.x = -0.82;
        rib.position.set(-1.1 + k * 0.55, 1.58, 0.02);
        lt.add(rib);
      }
      lt.position.set(0, 0, -2.3);
      g.add(lt);
      g.rotation.y = Math.atan2(s.x, s.z);          // the shelter's back to the hill, open to the sea
      bake(g);
      g.position.set(s.x, s.h, s.z);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      tall.add(g);
      // where the castaway stands: beside the fire, on the seaward side
      const out = Math.hypot(s.x, s.z) || 1;
      const ps = { x: s.x + (s.x / out) * 1.5, z: s.z + (s.z / out) * 1.5 };
      ps.h = heightLocal(ps.x, ps.z);
      camp = { fire: s, stand: ps, ember };
      const res = addRes('survivor', ps, new THREE.Group(), G.hitTree, rec.rescued ? 0 : 1, 0);
      res.hit.scale.set(0.8, 0.5, 0.8);
    }
  }
  // Buried treasure, if a map has marked this island.
  if (rec.treasure === true && rec.kind !== 'camp') {
    const s = spot(0.3, 0.5) || spot(0.2, 0.7);
    if (s) {
      const g = new THREE.Group();
      const mark = new THREE.Group();
      for (const a of [0.78, -0.78]) {
        const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.2), M.red);
        pl.rotation.y = a;
        pl.position.y = 0.05 + (a > 0 ? 0.03 : 0);
        mark.add(pl);
      }
      const stake = new THREE.Mesh(G.cane, M.log);
      stake.scale.set(0.8, 1.5, 0.8);
      stake.position.set(0.9, 0, 0.5);
      mark.add(stake);
      const rag = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.28), M.red.clone());
      rag.material.side = THREE.DoubleSide;
      rag.position.set(1.14, 1.3, 0.5);
      mark.add(rag);
      mark.traverse((o) => { o.userData.keep = true; });
      const chest = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.55), M.doorWood);
      body.position.y = 0.2;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), M.doorWood);
      lid.position.set(0, 0.42, -0.27);
      lid.rotation.x = -1.9;
      const gold = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, 0.44), new THREE.MeshStandardMaterial({ color: 0xf2c14a, emissive: 0xb07a10, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.9 }));
      gold.position.y = 0.4;
      for (const x of [-0.3, 0.3]) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.44, 0.57), M.strap);
        band.position.set(x, 0.2, 0);
        chest.add(band);
      }
      const pile = new THREE.Mesh(G.mound, M.sand);
      pile.position.set(-0.9, 0, 0.2);
      chest.add(body, lid, gold, pile);
      chest.traverse((o) => { o.userData.keep = true; });
      chest.visible = false;
      mark.userData.keep = true;
      chest.userData.keep = true;
      g.add(mark, chest);
      g.rotation.y = r() * 6;
      const res = addRes('dig', s, g, G.hitSmall, 1, 0);
      res.mark = mark;
      res.chest = chest;
    }
  }

  return { group, R, heightLocal, shapeR, resources, size: S, lamp, beam, detail, lod: -1, camp };
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
  survivor: (n) => (n ? 'Talk to the castaway' : 'The fire has gone out'),
  dig: (n) => (n ? 'Dig where the X is' : 'The chest is empty now'),
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
    boat: newBoat(),      // the sailing: speed, sail, steering oar, heel
    course: { tack: 1 },  // which tack the autopilot is beating on
  };
  // Islands close enough to have a mesh in the scene (up to MAX_ACTIVE), by chart id.
  const actives = new Map();
  const MAX_ACTIVE = 4;
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

  // One of the islands a way down-current has a castaway's camp on it.
  function placeCamp() {
    if (campRec()) return;
    const c0x = Math.floor(st.rw.x / WORLD.chunk), c0z = Math.floor(st.rw.z / WORLD.chunk);
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) genChunk(c0x + dx, c0z + dz);
    let best = null, bestScore = Infinity;
    for (const rec of st.chart.values()) {
      if (rec.kind !== 'island' || rec.visited || rec.id === 1 || rec.treasure) continue;
      const d = distTo(rec);
      if (d < 650 || d > 1500) continue;
      const north = (st.rw.z - rec.z) / d;
      const score = Math.abs(d - 950) - north * 300 + (rec.size === 'small' ? 250 : 0);
      if (score < bestScore) { bestScore = score; best = rec; }
    }
    if (best) { best.kind = 'camp'; best.bottle = false; }
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
    a.built.group.rotation.y = frameYaw();
    a.built.group.updateMatrixWorld(true);
  }

  function refreshResources(a) {
    if (!a) return;
    for (const res of a.built.resources) {
      if (res.kind === 'palm') res.nuts.forEach((n, i) => (n.visible = i < res.amount));
      else if (res.kind === 'bush') res.mesh.children.forEach((m) => { if (m.material !== M.hit) m.material = res.amount ? M.bush : M.bushDry; });
      else if (res.kind === 'rock' || res.kind === 'sand' || res.kind === 'clay' || res.kind === 'bamboo') res.mesh.scale.setScalar(res.amount ? 0.55 + 0.45 * (res.amount / res.max) : 0.4);
      else if (res.kind === 'dig') { res.mark.visible = res.amount > 0; res.chest.visible = res.amount <= 0; }
      else if (res.kind === 'survivor') { /* nothing to show: the castaway is drawn by the companion */ }
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
  // Where a chart point is in the scene (the raft's frame).
  const local = (rec, out = { x: 0, z: 0 }) => toScene(rec.x, rec.z, out);
  const tmpL = { x: 0, z: 0 };

  const tmpV3 = new THREE.Vector3();
  // The smoke of a castaway's fire: seen from a long way off, long before the island is.
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uLight: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float y = uv.y;
        p.x += y * y * 14.0 + sin(y * 5.0 - uTime * 0.5) * 1.6 * y;     // leaning downwind, wavering
        p.z += cos(y * 4.0 - uTime * 0.4) * 1.2 * y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAlpha, uLight;
      varying vec2 vUv;
      void main() {
        float a = smoothstep(0.0, 0.05, vUv.y) * pow(1.0 - vUv.y, 1.2);
        float n = 0.62 + 0.38 * sin(vUv.y * 22.0 - uTime * 1.3 + sin(vUv.x * 12.566) * 1.4);
        gl_FragColor = vec4(vec3(0.2, 0.2, 0.22) * uLight, min(1.0, a * n * uAlpha * 1.5));
      }`,
  });
  const smoke = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 0.3, 60, 12, 24, true).translate(0, 30, 0), smokeMat);
  smoke.visible = false;
  smoke.frustumCulled = false;
  smoke.userData.above = true;
  scene.add(smoke);
  function campRec() {
    for (const rec of st.chart.values()) if (rec.kind === 'camp') return rec;
    return null;
  }
  function updateSmoke(dt, night) {
    const rec = campRec();
    const d = rec && !rec.rescued ? distTo(rec) : Infinity;
    const want = d < 1500 ? 1 : 0;
    smokeMat.uniforms.uAlpha.value += (want * 0.75 - smokeMat.uniforms.uAlpha.value) * Math.min(1, dt * 0.8);
    smoke.visible = smokeMat.uniforms.uAlpha.value > 0.01 && !!rec;
    if (!smoke.visible) return;
    smokeMat.uniforms.uTime.value += dt;
    smokeMat.uniforms.uLight.value = 1 - 0.72 * (night || 0);
    const a = actives.get(rec.id);
    if (a?.built.camp && d < 470) {
      // close enough that the island is drawn: the smoke rises from the fire itself
      tmpV3.set(a.built.camp.fire.x, a.built.camp.fire.h + 0.2, a.built.camp.fire.z);
      a.built.group.localToWorld(tmpV3);
      smoke.position.copy(tmpV3);
      smoke.scale.setScalar(1);
    } else {
      // further off: drawn nearer and smaller, so the sea haze doesn't swallow it
      local(rec, tmpL);
      const s = Math.min(1, 470 / d);
      smoke.position.set(tmpL.x * s, 1.5 * s, tmpL.z * s);
      const far = d > 470 ? 1 : 0;
      smoke.scale.set(s * (1 + far * 2.2), s * (1 + far * 0.7), s * (1 + far * 2.2));
    }
    if (!rec.hailed && d < 1300) {
      rec.hailed = true;
      rec.seen = true;
      events.onSmoke?.(rec);
    }
  }

  // Land too far off to be drawn shows in a spyglass as a low grey shape on the horizon.
  const farMat = new THREE.MeshBasicMaterial({ color: 0x6f8494, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const farGeo = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const farMeshes = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(farGeo, farMat);
    m.visible = false;
    m.userData.above = true;
    scene.add(m);
    return m;
  });
  const farList = [];
  function farLand(k) {
    if (k < 0.02) { if (farMat.opacity) { farMat.opacity = 0; for (const m of farMeshes) m.visible = false; } return; }
    farList.length = 0;
    for (const rec of st.chart.values()) {
      if (actives.has(rec.id)) continue;
      const d = distTo(rec);
      if (d > 500 && d < WORLD.spySight) farList.push([d, rec]);
    }
    farList.sort((a, b) => a[0] - b[0]);
    if (scene.fog) farMat.color.copy(scene.fog.color).multiplyScalar(0.78);
    farMat.opacity = k * 0.8;
    for (let i = 0; i < farMeshes.length; i++) {
      const m = farMeshes[i], e = farList[i];
      m.visible = !!e;
      if (!e) continue;
      const [d, rec] = e;
      local(rec, tmpL);
      const s = 480 / d;
      m.position.set(tmpL.x * s, -0.5, tmpL.z * s);
      m.scale.set(rec.R * 1.5 * s, (rec.R * 0.32 + 3) * s, rec.R * 1.5 * s);
    }
  }

  // Which islands should have meshes: the one you're resting at, then the nearest.
  function pickActives() {
    const want = [];
    for (const rec of st.chart.values()) {
      const d = distTo(rec);
      if (d < 560 && (rec.kind !== 'lighthouse' || rec.seen || d < 300)) want.push([d, rec]);
    }
    want.sort((a, b) => a[0] - b[0]);
    const keep = new Set(want.slice(0, MAX_ACTIVE).map(([, r]) => r.id));
    if (st.resting != null && st.chart.has(st.resting)) keep.add(st.resting);
    for (const id of [...actives.keys()]) if (!keep.has(id)) despawn(id);
    for (const id of keep) if (!actives.has(id)) spawn(st.chart.get(id));
    primary = (st.resting != null && actives.get(st.resting)) || (want.length ? actives.get(want[0][1].id) : null) || null;
  }

  const helm = { steer: 0, slope: 0, scull: 0 };

  // Out of sail mode: the sail comes down, way falls off, the raft sits level.
  function idleBoat(b, dt) {
    b.sailSet = 0;
    b.sail = Math.max(0, b.sail - dt / SAILING.hoistTime);
    b.speed += (0 - b.speed) * (1 - Math.exp(-dt * 0.6));
    b.rudder += (0 - b.rudder) * (1 - Math.exp(-dt * 3));
    b.heelV += (6 * (0 - b.heel) - 1.6 * b.heelV) * dt;
    b.heel += b.heelV * dt;
    b.heading = Math.PI / 2 - st.heading;
  }

  function arrive(rec) {
    st.resting = rec.id;
    st.visitLeft = ISLAND.visit;
    st.held = false;
    st.warned = false;
    rec.visited = true;
    st.boat.sailSet = 0;
    st.boat.speed = 0;
    if (st.dest === rec.id) st.dest = null;
    events.onArrive?.(rec);
  }

  // Steer round any other island on the way: if one sits across the line we
  // want to take, aim for the edge of it on whichever side is closer.
  // `want` and the result are chart headings (bow along sin, cos).
  function roundIslands(want, target, goal, cwx, cwz, raftR) {
    const wx = Math.sin(want), wz = Math.cos(want);
    for (const rec of st.chart.values()) {
      if (rec === target) continue;
      const dx = rec.x - st.rw.x - cwx, dz = rec.z - st.rw.z - cwz;
      if (Math.abs(dx) > 260 || Math.abs(dz) > 260) continue;
      const d = Math.hypot(dx, dz) || 1;
      const clear = shoreOf(rec, -dx, -dz) + raftR + 8;
      const along = dx * wx + dz * wz;
      const side = dx * wz - dz * wx;
      if (along <= 0 || along > goal || Math.abs(side) >= clear || d > clear + 160) continue;
      const toIsland = Math.atan2(dx, dz);
      const off = d > clear ? Math.asin(clear / d) : Math.PI / 2 + 0.2;
      const a1 = toIsland + off, a2 = toIsland - off;
      const gap = (a) => Math.abs(wrap(a - want));
      return gap(a1) < gap(a2) ? a1 : a2;
    }
    return want;
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
      Object.assign(st, { rw: { x: 0, z: 0 }, heading: Math.PI, dest: null, resting: null, visitLeft: 0, held: false, warned: false, lock: null, trail: [], seed, boat: newBoat(), course: { tack: 1 } });
      setFrame(0, 0, 0);
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
      placeCamp();
      pickActives();
    },

    // Terrain height at a local (raft-frame) point, or -Infinity off every island.
    heightAt(x, z) {
      let h = -Infinity;
      for (const a of actives.values()) {
        toWorld(x, z, tmpL);
        const lx = tmpL.x - a.rec.x, lz = tmpL.z - a.rec.z;
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

    // Islands with a mesh, as scene x, z and radius: the sea calms in their lee.
    shelters(out) {
      out.length = 0;
      for (const a of actives.values()) {
        local(a.rec, tmpL);
        out.push({ x: tmpL.x, z: tmpL.z, r: a.rec.R, d: Math.hypot(tmpL.x, tmpL.z) });
      }
      // nearest first: the sea only has room for the closest few
      out.sort((p, q) => p.d - q.d);
      return out;
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
      if (res.kind === 'survivor') {
        res.amount = 0;
        res.rec.rescued = true;
        const a = actives.get(res.rec.id);
        if (a?.built.camp) a.built.camp.ember.material.emissiveIntensity = 0;
        events.onSurvivor?.(res.rec);
        return null;
      }
      if (res.kind === 'dig') {
        res.amount = 0;
        res.rec.treasure = 'dug';
        refreshResources(actives.get(res.rec.id));
        res.mesh.getWorldPosition(tmpV3);
        fx.splash?.(tmpV3.setY(tmpV3.y + 0.3), 0.8);
        events.onTreasure?.(res.rec);
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
      toWorld(raftCenter.x + 4, raftCenter.z - (rec.R * 0.95 + raftRadius + 8 + 40), tmpL);
      rec.x = tmpL.x;
      rec.z = tmpL.z;
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
    camp: campRec,
    // Where the castaway stands at the camp, in the scene, if the island is close enough to be drawn.
    campStand(out) {
      const rec = campRec();
      const a = rec && actives.get(rec.id);
      if (!a?.built.camp) return null;
      const s = a.built.camp.stand;
      out.set(s.x, s.h, s.z);
      a.built.group.localToWorld(out);
      return out;
    },
    // A treasure map marks an island a fair way off (one map at a time). Returns its record, or null.
    markTreasure() {
      for (const rec of st.chart.values()) if (rec.treasure === true) return null;
      const c0x = Math.floor(st.rw.x / WORLD.chunk), c0z = Math.floor(st.rw.z / WORLD.chunk);
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) genChunk(c0x + dx, c0z + dz);
      const list = [];
      for (const rec of st.chart.values()) {
        if (rec.kind !== 'island' || rec.treasure || actives.has(rec.id) || rec.id === st.resting) continue;
        const d = distTo(rec);
        if (d > 600 && d < 1700) list.push([d, rec]);
      }
      if (!list.length) return null;
      list.sort((a, b) => a[0] - b[0]);
      const rec = list[Math.floor(Math.random() * Math.min(3, list.length))][1];
      rec.treasure = true;
      rec.seen = true;
      return rec;
    },
    lighthouse() {
      for (const rec of st.chart.values()) if (rec.kind === 'lighthouse') return rec;
      return null;
    },
    get boat() { return st.boat; },
    // Sail setting asked for: 0 down, 0.5 half, 1 full. Hoisting it beside an
    // island casts off.
    setSail(level) {
      st.boat.sailSet = Math.max(0, Math.min(1, level));
      if (level > 0 && st.resting != null) {
        st.lock = st.resting;
        st.resting = null;
        events.onDepart?.(st.chart.get(st.lock));
      }
    },
    setDestination(id) {
      st.dest = id;
      st.course.tack = 1;
      if (id != null && st.lock === id) st.lock = null;
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
        trail: st.trail.slice(-400), seed: st.seed, chunks: [...st.chunks], sailSet: st.boat.sailSet, speed: st.boat.speed,
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
      st.boat = newBoat(Math.PI / 2 - st.heading);
      st.boat.sailSet = st.boat.sail = d.sailSet || 0;
      st.boat.speed = d.speed || 0;
      st.course = { tack: 1 };
      setFrame(st.rw.x, st.rw.z, st.heading - Math.PI);
      st.chunks = new Set(d.chunks);
      st.chart = new Map(d.chart.map((r) => [r.id, r]));
      lastChunk = '';
      st.pickT = 0;
      placeCamp();
      pickActives();
    },

    // ctx: { aboard, anchored, hasSail, onTower, raftRadius }
    update(dt, ctx) {
      setFrame(st.rw.x, st.rw.z, st.heading - Math.PI);
      ensureChart();
      const raftR = ctx.raftRadius;
      const rc = ctx.raftCenter || { x: 0, z: 0 };

      // Mark islands in sight on the chart.
      const sight = ctx.onTower ? WORLD.towerSight : WORLD.sight;
      for (const rec of st.chart.values()) {
        if (rec.seen || rec.kind === 'lighthouse') continue;
        const d = distTo(rec);
        if (d < sight) {
          rec.seen = true;
          events.onSighted?.(rec);
        } else if (ctx.spy && d < WORLD.spySight) {
          // Through the spyglass: only where it's pointed.
          local(rec, tmpL);
          if ((tmpL.x * ctx.spy.x + tmpL.z * ctx.spy.z) / (Math.hypot(tmpL.x, tmpL.z) || 1) > 0.985) {
            rec.seen = true;
            events.onSighted?.(rec, true);
          }
        }
      }
      farLand(ctx.spyK || 0);
      updateSmoke(dt, ctx.night);

      // ---- movement ----
      // The raft's middle on the chart (the scene origin is its first plank).
      const fr = st.heading - Math.PI, fc = Math.cos(fr), fs = Math.sin(fr);
      const cwx = rc.x * fc + rc.z * fs, cwz = -rc.x * fs + rc.z * fc;
      const b = st.boat;
      const wind = ctx.wind;
      const heading0 = st.heading;
      let speed = 0, vx = 0, vz = 0, over = 0, surfing = 0;
      const canSail = ctx.hasSail && wind && !ctx.anchored;
      if (!ctx.hasSail) { b.sailSet = 0; st.dest = null; }
      // Under sail: the sail is up (or going up), or a course is set.
      const sailing = canSail && st.resting == null && !ctx.onLand && (b.sailSet > 0 || b.sail > 0.02 || st.dest != null);
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
      } else if (sailing) {
        b.heading = Math.PI / 2 - st.heading;
        helm.steer = ctx.steer || 0;
        helm.slope = ctx.slope || 0;
        helm.scull = 0;
        const target = st.dest != null ? st.chart.get(st.dest) : null;
        if (target) {
          const dx = target.x - st.rw.x - cwx, dz = target.z - st.rw.z - cwz;
          const d = Math.hypot(dx, dz) || 1;
          const stopAt = shoreOf(target, -dx, -dz) * 0.92 + raftR + 5;
          const want = roundIslands(Math.atan2(dx, dz), target, d, cwx, cwz, raftR);
          const ap = autopilot(b, wind, Math.PI / 2 - want, d - stopAt, st.course);
          helm.steer = ap.steer;
          helm.scull = ap.scull;
          b.sailSet = ap.sailSet;
        }
        const ev = stepBoat(b, wind, helm, dt);
        over = ev.over;
        surfing = ev.surfing;
        st.heading = Math.PI / 2 - b.heading;
        // A little of the current still carries a raft under sail.
        vx = b.vx;
        vz = b.vz - WORLD.drift * 0.15;
        speed = Math.hypot(vx, vz);
        // Come to rest alongside any island you sail up to.
        // (On a set course, only the island you're bound for.)
        for (const rec of st.chart.values()) {
          if (rec.id === st.lock || (target && rec !== target)) continue;
          const dx = rec.x - st.rw.x - cwx, dz = rec.z - st.rw.z - cwz;
          if (Math.abs(dx) > 150 || Math.abs(dz) > 150) continue;
          const d = Math.hypot(dx, dz) || 1;
          if (d <= shoreOf(rec, -dx, -dz) * 0.92 + raftR + 5.5) {
            arrive(rec);
            vx = vz = speed = 0;
            break;
          }
        }
      } else if (!ctx.anchored && !ctx.onLand) {
        // Adrift: the current runs north and the raft turns to follow it.
        idleBoat(b, dt);
        speed = WORLD.drift;
        let want = Math.PI;
        // The current carries you to an island close to your line ahead.
        let target = null, bestD = Infinity;
        for (const rec of st.chart.values()) {
          if (rec.id === st.lock || rec.kind === 'lighthouse') continue;
          const dx = rec.x - st.rw.x - cwx, dz = rec.z - st.rw.z - cwz;
          if (dz > -10 || dz < -380) continue; // ahead (north) and not too far
          if (Math.abs(dx) > WORLD.pullLateral + rec.R) continue;
          const d = Math.hypot(dx, dz);
          if (d < bestD) { bestD = d; target = rec; }
        }
        let goal = Infinity;
        if (target) {
          // Head for the point just off its shore facing you.
          const dx = target.x - st.rw.x - cwx, dz = target.z - st.rw.z - cwz;
          const d = Math.hypot(dx, dz) || 1;
          goal = d;
          // Stop with a short swim between the raft's edge and the beach.
          const stopAt = shoreOf(target, -dx, -dz) * 0.92 + raftR + 5;
          if (d <= stopAt + 0.5) {
            arrive(target);
            speed = 0;
          } else {
            want = Math.atan2(dx, dz);
            speed *= Math.min(1, (d - stopAt) / 30 + 0.25);
          }
        }
        want = roundIslands(want, target, goal, cwx, cwz, raftR);
        // turn gently toward the wanted heading
        st.heading += Math.max(-0.3 * dt, Math.min(0.3 * dt, wrap(want - st.heading)));
        vx = Math.sin(st.heading) * speed;
        vz = Math.cos(st.heading) * speed;
      } else {
        idleBoat(b, dt);
      }
      if (st.resting != null) idleBoat(b, dt);
      if (st.lock != null) {
        const rec = st.chart.get(st.lock);
        if (!rec || distTo(rec) > rec.R + 250) st.lock = null;
      }
      st.rw.x += vx * dt;
      st.rw.z += vz * dt;
      // Never end up inside an island: push back out past its beach.
      for (const rec of st.chart.values()) {
        const dx = st.rw.x + cwx - rec.x, dz = st.rw.z + cwz - rec.z;
        if (Math.abs(dx) > 120 || Math.abs(dz) > 120) continue;
        const d = Math.hypot(dx, dz) || 1;
        const min = shoreOf(rec, dx, dz) * 0.88 + raftR + 2;
        if (d < min) {
          st.rw.x += (dx / d) * (min - d);
          st.rw.z += (dz / d) * (min - d);
        }
      }
      st.heading = wrap(st.heading);
      setFrame(st.rw.x, st.rw.z, st.heading - Math.PI);
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
        // Far off in the haze an island is a skyline; further still, nothing at all.
        const far = distTo(a.rec) - a.rec.R;
        const lod = far > 540 && a.rec.kind !== 'lighthouse' ? 2 : far > (ctx.spyK > 0.3 ? 460 : 130) ? 1 : 0;
        if (lod !== a.built.lod) {
          a.built.lod = lod;
          a.built.group.visible = lod < 2;
          a.built.detail.visible = lod === 0;
        }
        if (a.built.lamp) a.built.lamp.material.emissiveIntensity = a.rec.lit ? (ctx.night > 0.3 ? 6 : 1.5) : 0;
        if (a.built.beam) {
          a.built.beam.visible = !!a.rec.lit && ctx.night > 0.2;
          a.built.beam.rotation.y += dt * 0.5;
        }
      }
      return {
        speed, heading: st.heading,
        resting: st.resting != null, visitLeft: st.visitLeft,
        sailing,
        // how fast the water streams past, how hard the raft turned this frame, and the sailing's own news
        through: sailing ? Math.max(0, b.speed) : 0,
        turned: wrap(st.heading - heading0),
        over, surfing,
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
