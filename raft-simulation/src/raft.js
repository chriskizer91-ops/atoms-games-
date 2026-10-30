import * as THREE from 'three';
import { TILE, DECK_Y } from './config.js';
import { waveHeight } from './ocean.js';
import { damp, pick, rand } from './util.js';

const BOARDS = 5;
const BOARD_W = TILE / BOARDS;
const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const geo = {
  board: new THREE.BoxGeometry(TILE * 0.98, 0.07, BOARD_W - 0.035),
  log: new THREE.CylinderGeometry(0.15, 0.15, TILE * 0.99, 7).rotateX(Math.PI / 2),
  rope: new THREE.CylinderGeometry(0.165, 0.165, 0.07, 7).rotateX(Math.PI / 2),
  hit: new THREE.BoxGeometry(TILE, 0.55, TILE),
  ghost: new THREE.BoxGeometry(TILE * 0.96, 0.08, TILE * 0.96),
};

const mat = {
  wood: [0x9c7146, 0x8f663e, 0xa97c4f, 0x94693f, 0x86603a].map(
    (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true })
  ),
  chewed: new THREE.MeshLambertMaterial({ color: 0x5e4129, flatShading: true }),
  log: new THREE.MeshLambertMaterial({ color: 0x6a4a2d, flatShading: true }),
  rope: new THREE.MeshLambertMaterial({ color: 0xcdb27c, flatShading: true }),
  hit: new THREE.MeshBasicMaterial({ visible: false }),
  ghost: new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.22, depthWrite: false }),
  ghostEdge: new THREE.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7 }),
};
const ghostEdges = new THREE.EdgesGeometry(geo.ghost);

const key = (i, j) => `${i},${j}`;

export function createRaft(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const tiles = new Map();
  let outside = new Set();
  let outsideDirty = true;
  let buildMode = false;
  const tilt = { y: 0, rx: 0, rz: 0 };

  function makeTile(i, j) {
    const g = new THREE.Group();
    g.position.set(i * TILE, 0, j * TILE);

    const logs = [];
    for (const lx of [-0.3, 0.3]) {
      const log = new THREE.Mesh(geo.log, mat.log);
      log.position.set(lx * TILE, DECK_Y - 0.22, 0);
      log.rotation.z = rand(0, Math.PI);
      g.add(log);
      logs.push(log);
      for (const rz of [-0.33, 0.33]) {
        const r = new THREE.Mesh(geo.rope, mat.rope);
        r.position.set(lx * TILE, DECK_Y - 0.22, rz * TILE);
        g.add(r);
        logs.push(r);
      }
    }

    const boards = [];
    for (let b = 0; b < BOARDS; b++) {
      const m = new THREE.Mesh(geo.board, pick(mat.wood));
      const z = -TILE / 2 + BOARD_W * (b + 0.5);
      const x = rand(-0.03, 0.03);
      m.position.set(x, DECK_Y - 0.035 + rand(-0.008, 0.008), z);
      m.rotation.y = rand(-0.02, 0.02);
      m.userData.base = { x, z, y: m.position.y, ry: m.rotation.y, mat: m.material };
      g.add(m);
      boards.push(m);
    }

    const hit = new THREE.Mesh(geo.hit, mat.hit);
    hit.position.y = DECK_Y - 0.25;
    g.add(hit);

    const ghost = new THREE.Mesh(geo.ghost, mat.ghost);
    ghost.position.y = DECK_Y - 0.04;
    ghost.add(new THREE.LineSegments(ghostEdges, mat.ghostEdge));
    ghost.visible = false;
    g.add(ghost);

    group.add(g);
    const tile = { i, j, hp: 100, broken: false, group: g, boards, logs, hit, ghost, biteSide: null, shake: 0 };
    hit.userData.tile = tile;
    ghost.userData.tile = tile;
    return tile;
  }

  function refreshTile(tile) {
    const { boards, logs, ghost, hit } = tile;
    if (tile.broken) {
      boards.forEach((b) => (b.visible = false));
      logs.forEach((l) => (l.visible = false));
      ghost.visible = buildMode;
      hit.visible = false;
      return;
    }
    logs.forEach((l) => (l.visible = true));
    ghost.visible = false;
    hit.visible = true;

    const steps = Math.min(9, Math.floor((100 - tile.hp) / 10.5));
    const side = tile.biteSide || [0, -1];
    const bx = side[0] * TILE * 0.5;
    const bz = side[1] * TILE * 0.5;
    const order = boards
      .map((b, idx) => ({ b, idx, d: Math.hypot(b.userData.base.x - bx, b.userData.base.z - bz) + idx * 0.001 }))
      .sort((p, q) => p.d - q.d);

    order.forEach(({ b }, k) => {
      const base = b.userData.base;
      const state = steps >= 2 * k + 2 ? 2 : steps >= 2 * k + 1 ? 1 : 0;
      b.visible = state < 2;
      b.scale.x = state === 1 ? 0.58 : 1;
      b.position.x = state === 1 ? base.x - Math.sign(side[0] || 0.3) * TILE * 0.2 : base.x;
      b.position.y = state === 1 ? base.y - 0.03 : base.y;
      b.rotation.z = state === 1 ? 0.12 * (side[0] >= 0 ? 1 : -1) : 0;
      b.rotation.y = state === 1 ? base.ry + 0.15 : base.ry;
      b.material = state === 1 ? mat.chewed : base.mat;
    });
  }

  function addTile(i, j) {
    const t = makeTile(i, j);
    tiles.set(key(i, j), t);
    outsideDirty = true;
    return t;
  }

  function computeOutside() {
    let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
    for (const t of tiles.values()) {
      minI = Math.min(minI, t.i); maxI = Math.max(maxI, t.i);
      minJ = Math.min(minJ, t.j); maxJ = Math.max(maxJ, t.j);
    }
    minI -= 1; maxI += 1; minJ -= 1; maxJ += 1;
    const solid = (i, j) => {
      const t = tiles.get(key(i, j));
      return t && !t.broken;
    };
    const seen = new Set();
    const queue = [];
    for (let i = minI; i <= maxI; i++) {
      for (const j of [minJ, maxJ]) queue.push([i, j]);
    }
    for (let j = minJ; j <= maxJ; j++) {
      for (const i of [minI, maxI]) queue.push([i, j]);
    }
    while (queue.length) {
      const [i, j] = queue.pop();
      if (i < minI || i > maxI || j < minJ || j > maxJ) continue;
      const k = key(i, j);
      if (seen.has(k) || solid(i, j)) continue;
      seen.add(k);
      for (const [di, dj] of SIDES) queue.push([i + di, j + dj]);
    }
    outside = seen;
    outsideDirty = false;
  }

  // Raft-local point -> world height of the deck there.
  function deckHeightAt(x, z) {
    return tilt.y + DECK_Y + x * Math.tan(tilt.rz) - z * Math.tan(tilt.rx);
  }

  function intactTileNear(x, z, tol) {
    const ci = Math.round(x / TILE);
    const cj = Math.round(z / TILE);
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const t = tiles.get(key(ci + di, cj + dj));
        if (!t || t.broken) continue;
        if (Math.abs(x - t.i * TILE) <= TILE / 2 + tol && Math.abs(z - t.j * TILE) <= TILE / 2 + tol) return t;
      }
    }
    return null;
  }

  const api = {
    group,
    tiles,

    reset(layout) {
      for (const t of tiles.values()) group.remove(t.group);
      tiles.clear();
      for (const s of layout) {
        const t = addTile(s.i, s.j);
        if (s.hp != null) t.hp = s.hp;
        if (s.broken) t.broken = true;
        if (s.biteSide) t.biteSide = s.biteSide;
        refreshTile(t);
      }
      outsideDirty = true;
    },

    serialize() {
      return [...tiles.values()].map((t) => ({ i: t.i, j: t.j, hp: Math.round(t.hp), broken: t.broken, biteSide: t.biteSide }));
    },

    setBuildMode(on) {
      if (buildMode === on) return;
      buildMode = on;
      for (const t of tiles.values()) if (t.broken) t.ghost.visible = on;
    },

    // Targets for the hammer ray: intact floor hitboxes plus broken-floor ghosts.
    hammerTargets() {
      const out = [];
      for (const t of tiles.values()) out.push(t.broken ? t.ghost : t.hit);
      return out;
    },

    isSupported(x, z) {
      return !!intactTileNear(x, z, 0.18);
    },

    deckHeightAt,

    // Keeps a swimmer from passing through the floating floor.
    pushOut(pos, radius) {
      const ci = Math.round(pos.x / TILE);
      const cj = Math.round(pos.z / TILE);
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const t = tiles.get(key(ci + di, cj + dj));
          if (!t || t.broken) continue;
          const cx = t.i * TILE, cz = t.j * TILE, h = TILE / 2 + radius;
          const dx = pos.x - cx, dz = pos.z - cz;
          if (Math.abs(dx) < h && Math.abs(dz) < h) {
            const px = h - Math.abs(dx), pz = h - Math.abs(dz);
            if (px < pz) pos.x += Math.sign(dx || 1) * px;
            else pos.z += Math.sign(dz || 1) * pz;
          }
        }
      }
    },

    // Distance from a point to the nearest standing floor (0 when over one).
    edgeDistance(x, z) {
      let best = Infinity;
      for (const t of tiles.values()) {
        if (t.broken) continue;
        const dx = Math.max(Math.abs(x - t.i * TILE) - TILE / 2, 0);
        const dz = Math.max(Math.abs(z - t.j * TILE) - TILE / 2, 0);
        best = Math.min(best, Math.hypot(dx, dz));
      }
      return best;
    },

    // Point just inside the nearest floor edge, for climbing aboard.
    climbPoint(x, z) {
      let best = null, bestD = Infinity;
      for (const t of tiles.values()) {
        if (t.broken) continue;
        const cx = t.i * TILE, cz = t.j * TILE, h = TILE / 2 - 0.35;
        const px = Math.max(cx - h, Math.min(cx + h, x));
        const pz = Math.max(cz - h, Math.min(cz + h, z));
        const d = Math.hypot(px - x, pz - z);
        if (d < bestD) { bestD = d; best = { x: px, z: pz }; }
      }
      return best;
    },

    nearRaft(x, z, margin) {
      return this.edgeDistance(x, z) < margin;
    },

    center() {
      let x = 0, z = 0, n = 0;
      for (const t of tiles.values()) {
        if (t.broken) continue;
        x += t.i * TILE; z += t.j * TILE; n++;
      }
      return n ? { x: x / n, z: z / n } : { x: 0, z: 0 };
    },

    radius() {
      const c = this.center();
      let r = 0;
      for (const t of tiles.values()) {
        if (!t.broken) r = Math.max(r, Math.hypot(t.i * TILE - c.x, t.j * TILE - c.z));
      }
      return r + TILE * 0.7;
    },

    // Floor pieces the shark can reach from open water, with the open side.
    attackable() {
      if (outsideDirty) computeOutside();
      const list = [];
      for (const t of tiles.values()) {
        if (t.broken) continue;
        for (const [di, dj] of SIDES) {
          if (outside.has(key(t.i + di, t.j + dj))) list.push({ tile: t, side: [di, dj] });
        }
      }
      return list;
    },

    countIntact() {
      let n = 0;
      for (const t of tiles.values()) if (!t.broken) n++;
      return n;
    },

    damage(tile, amount, side) {
      if (tile.broken) return false;
      if (!tile.biteSide || tile.hp >= 100) tile.biteSide = side;
      tile.hp = Math.max(0, tile.hp - amount);
      tile.shake = 0.35;
      if (tile.hp <= 0) {
        tile.broken = true;
        outsideDirty = true;
      }
      refreshTile(tile);
      return tile.broken;
    },

    repair(tile, amount) {
      tile.hp = Math.min(100, tile.hp + amount);
      if (tile.hp >= 100) tile.biteSide = null;
      tile.shake = 0.12;
      refreshTile(tile);
    },

    rebuild(tile) {
      tile.broken = false;
      tile.hp = 100;
      tile.biteSide = null;
      tile.shake = 0.15;
      outsideDirty = true;
      refreshTile(tile);
    },

    worldPointOf(tile, side, out = new THREE.Vector3()) {
      const x = tile.i * TILE + (side ? side[0] * TILE * 0.5 : 0);
      const z = tile.j * TILE + (side ? side[1] * TILE * 0.5 : 0);
      return out.set(x, deckHeightAt(x, z), z);
    },

    update(t, dt) {
      // Ride the swell: average a few samples across the raft, tilt gently.
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const tl of tiles.values()) {
        minX = Math.min(minX, tl.i * TILE); maxX = Math.max(maxX, tl.i * TILE);
        minZ = Math.min(minZ, tl.j * TILE); maxZ = Math.max(maxZ, tl.j * TILE);
      }
      const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
      const hx = (maxX - minX) / 2 + TILE / 2, hz = (maxZ - minZ) / 2 + TILE / 2;
      const hE = waveHeight(cx + hx, cz, t), hW = waveHeight(cx - hx, cz, t);
      const hN = waveHeight(cx, cz + hz, t), hS = waveHeight(cx, cz - hz, t);
      const hC = waveHeight(cx, cz, t);
      const targetY = (hE + hW + hN + hS + hC * 2) / 6 * 0.85;
      const slopeX = (hE - hW) / (2 * hx);
      const slopeZ = (hN - hS) / (2 * hz);
      tilt.y = damp(tilt.y, targetY, 3, dt);
      tilt.rz = damp(tilt.rz, Math.atan(slopeX) * 0.45, 2.5, dt);
      tilt.rx = damp(tilt.rx, -Math.atan(slopeZ) * 0.45, 2.5, dt);
      group.position.y = tilt.y;
      group.rotation.set(tilt.rx, 0, tilt.rz);

      for (const tl of tiles.values()) {
        if (tl.shake > 0) {
          tl.shake = Math.max(0, tl.shake - dt);
          const a = tl.shake * 0.12;
          tl.group.position.y = Math.sin(t * 60) * a * 0.4;
          tl.group.rotation.z = Math.sin(t * 47) * a * 0.3;
        } else if (tl.group.position.y !== 0) {
          tl.group.position.y = 0;
          tl.group.rotation.z = 0;
        }
      }
    },
  };

  return api;
}

export function startingLayout() {
  const out = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push({ i, j });
  return out;
}
