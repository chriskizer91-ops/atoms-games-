import * as THREE from 'three';
import { CURRENT, CURRENT_SPEED } from './config.js';
import { waveHeight } from './ocean.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { rand, randInt, randn, pick, weightedPick } from './util.js';

const cl = Math.hypot(CURRENT.x, CURRENT.z);
const FLOW = { x: (CURRENT.x / cl) * CURRENT_SPEED, z: (CURRENT.z / cl) * CURRENT_SPEED };

const TYPES = {
  plank: { weight: 34 },
  plastic: { weight: 25 },
  fiber: { weight: 22 },
  coconut: { weight: 10 },
  barrel: { weight: 6 },
};

let G = null;
let M = null;

function bottleGeometry() {
  const pts = [[0, -0.15], [0.07, -0.15], [0.08, -0.13], [0.08, 0.05], [0.07, 0.09], [0.035, 0.13], [0.03, 0.17], [0, 0.17]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 14).rotateZ(Math.PI / 2);
}

function barrelGeometry() {
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const y = -0.42 + (0.84 * k) / 10;
    pts.push(new THREE.Vector2(0.27 + 0.045 * Math.cos((y / 0.42) * Math.PI / 2), y));
  }
  pts.unshift(new THREE.Vector2(0, -0.42));
  pts.push(new THREE.Vector2(0, 0.42));
  return new THREE.LatheGeometry(pts, 18).rotateZ(Math.PI / 2);
}

// Palm frond: a curved rib with leaflets angled toward the tip, green fading to straw.
function frondGeometry() {
  const pos = [], col = [];
  const len = 1.15, n = 15;
  const rib = (s) => new THREE.Vector3(0, -0.1 * s * s, s * len - len * 0.45);
  const g0 = [0.2, 0.42, 0.12], g1 = [0.62, 0.62, 0.28];
  for (let k = 1; k <= n; k++) {
    const s = k / (n + 1);
    const b = rib(s);
    const L = 0.12 + 0.3 * Math.sin(Math.PI * Math.min(1, s * 1.15));
    for (const side of [-1, 1]) {
      const tip = b.clone().add(new THREE.Vector3(side * L * 0.88, -0.05 - L * 0.12, L * 0.45));
      const w = 0.028;
      const a = b.clone().add(new THREE.Vector3(0, 0, -w));
      const c = b.clone().add(new THREE.Vector3(0, 0.004, w));
      const mid = b.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, 0.02, 0));
      for (const tri of [[a, mid, c], [mid, tip, c]]) {
        for (const v of tri) {
          pos.push(v.x, v.y, v.z);
          const t = Math.min(1, v.distanceTo(b) / L) * 0.7 + s * 0.3;
          col.push(g0[0] + (g1[0] - g0[0]) * t, g0[1] + (g1[1] - g0[1]) * t, g0[2] + (g1[2] - g0[2]) * t);
        }
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const ribCurve = new THREE.CatmullRomCurve3([0, 0.25, 0.5, 0.75, 1].map(rib));
  return { leaves: g, rib: new THREE.TubeGeometry(ribCurve, 12, 0.013, 5) };
}

function init() {
  if (G) return;
  M = materials();
  const frond = frondGeometry();
  G = {
    board: new RoundedBoxGeometry(1.1, 0.065, 0.24, 2, 0.012),
    bottle: bottleGeometry(),
    cap: new THREE.CylinderGeometry(0.033, 0.033, 0.03, 10).rotateZ(Math.PI / 2),
    jug: new RoundedBoxGeometry(0.26, 0.24, 0.17, 3, 0.05),
    handle: new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI),
    sheet: new RoundedBoxGeometry(0.62, 0.05, 0.44, 2, 0.015),
    rib: new THREE.BoxGeometry(0.62, 0.03, 0.03),
    leaves: frond.leaves,
    stem: frond.rib,
    coconut: new THREE.IcosahedronGeometry(0.13, 3).scale(1, 0.92, 1.12),
    eye: new THREE.SphereGeometry(0.014, 6, 4),
    barrel: barrelGeometry(),
    hoop: new THREE.TorusGeometry(0.31, 0.014, 6, 24).rotateY(Math.PI / 2),
    lid: new THREE.CircleGeometry(0.27, 18).rotateY(Math.PI / 2),
  };
}

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

function buildMesh(type) {
  init();
  const g = new THREE.Group();
  let floatY = 0;
  let radius = 0.5;
  let count = 1;
  let label = '';
  if (type === 'plank') {
    count = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const b = mesh(G.board, pick(M.planks));
      b.position.set(i * 0.05, i * 0.065, i * 0.12);
      b.rotation.y = i ? rand(-0.7, 0.7) : 0;
      b.scale.x = rand(0.75, 1.05);
      g.add(b);
    }
    floatY = 0.0;
    radius = 0.6;
    label = count > 1 ? 'Driftwood planks' : 'Driftwood plank';
  } else if (type === 'plastic') {
    const kind = randInt(0, 2);
    if (kind === 0) {
      const body = mesh(G.bottle, pick(M.plastic.slice(0, 2)));
      const cap = mesh(G.cap, pick(M.caps));
      cap.position.x = -0.18;
      g.add(body, cap);
      label = 'Plastic bottle';
      radius = 0.35;
      floatY = 0.02;
    } else if (kind === 1) {
      const jug = mesh(G.jug, M.plastic[2]);
      const handle = mesh(G.handle, M.plastic[2]);
      handle.position.set(-0.04, 0.12, 0);
      const cap = mesh(G.cap, pick(M.caps));
      cap.rotation.z = Math.PI / 2;
      cap.position.set(0.07, 0.13, 0);
      g.add(jug, handle, cap);
      label = 'Plastic jug';
      radius = 0.35;
      floatY = 0.05;
    } else {
      const m = pick(M.plasticSolid);
      g.add(mesh(G.sheet, m));
      for (const z of [-0.12, 0.12]) {
        const r = mesh(G.rib, m);
        r.position.set(0, 0.03, z);
        g.add(r);
      }
      label = 'Plastic sheet';
      radius = 0.45;
    }
  } else if (type === 'fiber') {
    count = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const f = new THREE.Group();
      f.add(mesh(G.leaves, M.leaf), mesh(G.stem, M.stem));
      f.rotation.y = i * 0.7;
      f.position.set(i * 0.12, i * 0.02, 0);
      g.add(f);
    }
    radius = 0.6;
    floatY = 0.04;
    label = 'Palm fronds';
  } else if (type === 'coconut') {
    g.add(mesh(G.coconut, M.coconut));
    for (let k = 0; k < 3; k++) {
      const e = new THREE.Mesh(G.eye, M.darkMetal);
      const a = (k / 3) * Math.PI * 2;
      e.position.set(Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0.14);
      g.add(e);
    }
    g.rotation.x = rand(0, 1);
    floatY = 0.02;
    radius = 0.3;
    label = 'Coconut';
  } else if (type === 'barrel') {
    g.add(mesh(G.barrel, M.barrel));
    for (const x of [-0.3, 0, 0.3]) {
      const hoop = mesh(G.hoop, M.darkMetal);
      hoop.position.x = x;
      hoop.scale.setScalar(x === 0 ? 1.05 : 0.97);
      g.add(hoop);
    }
    for (const x of [-0.42, 0.42]) {
      const lid = new THREE.Mesh(G.lid, M.barrel);
      lid.position.x = x;
      lid.rotation.y = x < 0 ? Math.PI : 0;
      g.add(lid);
    }
    floatY = 0.06;
    radius = 0.6;
    label = 'Barrel';
  }
  return { mesh: g, floatY, radius, count, label };
}

function rollLoot(type, count) {
  switch (type) {
    case 'plank': return { wood: count };
    case 'plastic': return { plastic: 1 };
    case 'fiber': return { fiber: count };
    case 'coconut': return { coconut: 1 };
    case 'barrel': {
      const loot = { wood: randInt(1, 3), plastic: randInt(1, 2) };
      if (Math.random() < 0.7) loot.fiber = randInt(1, 2);
      if (Math.random() < 0.6) loot.scrap = randInt(1, 2);
      if (Math.random() < 0.5) loot.coconut = 1;
      return loot;
    }
  }
  return {};
}

export function createDebris(scene) {
  const items = [];
  let spawnTimer = 0;
  const v = new THREE.Vector3();

  function spawn(type, x, z, drift) {
    const built = buildMesh(type);
    built.mesh.rotation.y = rand(0, Math.PI * 2);
    scene.add(built.mesh);
    const d = {
      type,
      label: built.label,
      mesh: built.mesh,
      x, z,
      vx: drift?.x ?? 0,
      vz: drift?.z ?? 0,
      floatY: built.floatY,
      radius: built.radius,
      count: built.count,
      phase: rand(0, 10),
      spin: rand(-0.15, 0.15),
      hooked: false,
      loot: null,
    };
    d.loot = rollLoot(type, built.count);
    items.push(d);
    return d;
  }

  function spawnUpstream(cx, cz, along) {
    const type = weightedPick(TYPES);
    // Spread across the current, concentrated near the raft's line.
    const side = randn() * 13;
    const fx = FLOW.x / CURRENT_SPEED, fz = FLOW.z / CURRENT_SPEED;
    spawn(type, cx - fx * along + fz * side, cz - fz * along - fx * side);
  }

  return {
    items,
    flow: FLOW,

    reset(cx = 0, cz = 0) {
      for (const d of items) scene.remove(d.mesh);
      items.length = 0;
      for (let i = 0; i < 28; i++) spawnUpstream(cx, cz, rand(-55, 75));
    },

    spawn,

    remove(d) {
      const i = items.indexOf(d);
      if (i >= 0) items.splice(i, 1);
      scene.remove(d.mesh);
    },

    // Closest floating thing the view ray passes near, within reach.
    lookTarget(origin, dir, maxDist) {
      let best = null, bestT = Infinity;
      for (const d of items) {
        if (d.hooked) continue;
        v.set(d.x - origin.x, d.mesh.position.y - origin.y, d.z - origin.z);
        const t = v.dot(dir);
        if (t < 0 || t > maxDist + d.radius) continue;
        const perp = Math.sqrt(Math.max(0, v.lengthSq() - t * t));
        if (perp < d.radius + 0.2 && t < bestT) { best = d; bestT = t; }
      }
      return best;
    },

    near(x, z, r) {
      return items.filter((d) => !d.hooked && Math.hypot(d.x - x, d.z - z) < r + d.radius * 0.5);
    },

    update(t, dt, raftCenter) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTimer = rand(0.8, 1.5);
        if (items.length < 42) spawnUpstream(raftCenter.x, raftCenter.z, rand(70, 80));
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const d = items[i];
        if (!d.hooked) {
          d.vx *= Math.max(0, 1 - dt * 0.4);
          d.vz *= Math.max(0, 1 - dt * 0.4);
          d.x += (FLOW.x + d.vx) * dt;
          d.z += (FLOW.z + d.vz) * dt;
          d.mesh.rotation.y += d.spin * dt;
        }
        const h = waveHeight(d.x, d.z, t);
        d.mesh.position.set(d.x, h + d.floatY, d.z);
        // Pitch and roll with the local slope so things look like they float.
        const sx = waveHeight(d.x + 0.4, d.z, t) - h;
        const sz = waveHeight(d.x, d.z + 0.4, t) - h;
        d.mesh.rotation.x = -sz * 1.5 + Math.sin(t * 1.3 + d.phase) * 0.04;
        d.mesh.rotation.z = sx * 1.5;
        const dz = d.z - raftCenter.z, dx = d.x - raftCenter.x;
        if (!d.hooked && (dz > 75 || Math.abs(dx) > 90)) {
          scene.remove(d.mesh);
          items.splice(i, 1);
        }
      }
    },
  };
}
