import * as THREE from 'three';
import { CURRENT, CURRENT_SPEED } from './config.js';
import { waveHeight } from './ocean.js';
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

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const M = {
  wood: [lam(0x9a6f45), lam(0x8b6038), lam(0xa98055)],
  bottle: [lam(0x7cc4e4), lam(0x9ad6d0), lam(0xd9e7ea)],
  cap: [lam(0x2f6fb0), lam(0xe1503e), lam(0xf2f2f2)],
  crate: [lam(0xe7b93c), lam(0x3f8f6d), lam(0xd3553f)],
  leaf: lam(0x5f9a3c, { side: THREE.DoubleSide }),
  leafDry: lam(0x9aa64a, { side: THREE.DoubleSide }),
  stem: lam(0x7a5c34),
  barrel: [lam(0x8a3b2a), lam(0x2f5d8c), lam(0x55703a)],
  hoop: lam(0x3a3f44),
  coconut: lam(0x5b3a22),
  husk: lam(0x7a5631),
};

const G = {
  board: new THREE.BoxGeometry(1.1, 0.07, 0.22),
  bottle: new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8).rotateZ(Math.PI / 2),
  neck: new THREE.CylinderGeometry(0.03, 0.06, 0.08, 8).rotateZ(Math.PI / 2),
  cap: new THREE.CylinderGeometry(0.032, 0.032, 0.03, 8).rotateZ(Math.PI / 2),
  jug: new THREE.BoxGeometry(0.26, 0.22, 0.16),
  crate: new THREE.BoxGeometry(0.55, 0.06, 0.42),
  leaf: new THREE.ConeGeometry(0.11, 1.0, 4, 1).rotateX(Math.PI / 2).scale(1, 0.18, 1),
  stem: new THREE.CylinderGeometry(0.02, 0.025, 0.5, 5).rotateX(Math.PI / 2),
  barrel: new THREE.CylinderGeometry(0.3, 0.3, 0.82, 12).rotateZ(Math.PI / 2),
  hoop: new THREE.CylinderGeometry(0.315, 0.315, 0.05, 12).rotateZ(Math.PI / 2),
  coconut: new THREE.IcosahedronGeometry(0.13, 1),
  husk: new THREE.ConeGeometry(0.05, 0.06, 5),
};

function buildMesh(type) {
  const g = new THREE.Group();
  let floatY = 0;
  let radius = 0.5;
  let count = 1;
  let label = '';
  if (type === 'plank') {
    count = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const b = new THREE.Mesh(G.board, pick(M.wood));
      b.position.set(i * 0.05, i * 0.07, i * 0.12);
      b.rotation.y = i ? rand(-0.7, 0.7) : 0;
      b.scale.x = rand(0.75, 1.1);
      g.add(b);
    }
    floatY = 0.02;
    radius = 0.6;
    label = count > 1 ? 'Driftwood planks' : 'Driftwood plank';
  } else if (type === 'plastic') {
    const kind = randInt(0, 2);
    if (kind === 0) {
      const body = new THREE.Mesh(G.bottle, pick(M.bottle));
      const neck = new THREE.Mesh(G.neck, body.material);
      neck.position.x = 0.19;
      const cap = new THREE.Mesh(G.cap, pick(M.cap));
      cap.position.x = 0.24;
      g.add(body, neck, cap);
      label = 'Plastic bottle';
      radius = 0.35;
    } else if (kind === 1) {
      const jug = new THREE.Mesh(G.jug, M.bottle[2]);
      const cap = new THREE.Mesh(G.cap, pick(M.cap));
      cap.rotation.z = Math.PI / 2;
      cap.position.set(0.07, 0.125, 0);
      g.add(jug, cap);
      label = 'Plastic jug';
      radius = 0.35;
      floatY = 0.04;
    } else {
      const c = new THREE.Mesh(G.crate, pick(M.crate));
      g.add(c);
      label = 'Plastic sheet';
      radius = 0.45;
    }
  } else if (type === 'fiber') {
    count = Math.random() < 0.4 ? 2 : 1;
    const n = 3 + count;
    for (let i = 0; i < n; i++) {
      const leaf = new THREE.Mesh(G.leaf, i % 3 === 2 ? M.leafDry : M.leaf);
      const a = (i / n - 0.5) * 1.6;
      leaf.position.set(Math.sin(a) * 0.45, 0.01 * i, Math.cos(a) * 0.45 - 0.25);
      leaf.rotation.y = a;
      g.add(leaf);
    }
    const stem = new THREE.Mesh(G.stem, M.stem);
    stem.position.z = -0.4;
    g.add(stem);
    radius = 0.6;
    label = 'Palm fronds';
  } else if (type === 'coconut') {
    const c = new THREE.Mesh(G.coconut, M.coconut);
    const h = new THREE.Mesh(G.husk, M.husk);
    h.position.y = 0.13;
    g.add(c, h);
    floatY = 0.03;
    radius = 0.3;
    label = 'Coconut';
  } else if (type === 'barrel') {
    const mat = pick(M.barrel);
    g.add(new THREE.Mesh(G.barrel, mat));
    for (const x of [-0.26, 0.26]) {
      const hoop = new THREE.Mesh(G.hoop, M.hoop);
      hoop.position.x = x;
      g.add(hoop);
    }
    floatY = 0.08;
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
