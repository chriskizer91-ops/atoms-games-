import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TILE, DECK_Y, RAFT_LIMIT, FLOOR_HP } from './config.js';
import { waveHeight } from './ocean.js';
import { materials } from './materials.js';
import { damp, rand } from './util.js';

const BOARDS = 5;
const BOARD_W = TILE / BOARDS;
const BOARD_L = TILE * 0.98;
const BOARD_T = 0.065;
const LOG_R = 0.15;
const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// A board with one end bitten into a ragged edge. UVs match the full board.
function chewedBoardGeometry(len, width, thick) {
  const sh = new THREE.Shape();
  const x0 = -len / 2, x1 = len / 2;
  sh.moveTo(x0, -width / 2);
  const teeth = 7;
  for (let k = 0; k <= teeth; k++) {
    const y = -width / 2 + (width * k) / teeth;
    const x = x1 - (k % 2 ? 0.09 : 0.0) - Math.random() * 0.05 - (k === 0 || k === teeth ? 0.03 : 0);
    sh.lineTo(x, y);
  }
  sh.lineTo(x0, width / 2);
  sh.lineTo(x0, -width / 2);
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  g.rotateX(Math.PI / 2);
  g.translate(0, thick / 2, 0);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + BOARD_L / 2) / BOARD_L, (pos.getZ(i) + width / 2) / width);
  }
  g.computeVertexNormals();
  return g;
}

// Several turns of rope around both logs at two points along the tile.
function lashingGeometry() {
  const parts = [];
  for (const lx of [-0.3, 0.3]) {
    for (const rz of [-0.33, 0.33]) {
      for (let k = -1; k <= 1; k++) {
        const t = new THREE.TorusGeometry(LOG_R + 0.012, 0.016, 6, 18);
        t.translate(lx * TILE, DECK_Y - 0.22, rz * TILE + k * 0.034);
        parts.push(t);
      }
    }
  }
  const g = mergeGeometries(parts);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i));
  return g;
}

function logGeometry() {
  const g = new THREE.CylinderGeometry(LOG_R, LOG_R * 0.94, TILE * 0.99, 14, 3);
  // Slightly irregular trunk.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), x = pos.getX(i), z = pos.getZ(i);
    const k = 1 + Math.sin(y * 7 + Math.atan2(z, x) * 3) * 0.035;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.rotateX(Math.PI / 2);
  // Wet and weedy below the waterline: tint the underside green-dark.
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const w = Math.min(1, Math.max(0, (0.02 - y) / 0.14));
    col[i * 3] = 1 - w * 0.5;
    col[i * 3 + 1] = 1 - w * 0.32;
    col[i * 3 + 2] = 1 - w * 0.48;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 2);
  return g;
}

let geo = null;
let mat = null;
function init() {
  if (geo) return;
  geo = {
    board: new RoundedBoxGeometry(BOARD_L, BOARD_T, BOARD_W - 0.028, 2, 0.012),
    chewed: chewedBoardGeometry(BOARD_L, BOARD_W - 0.028, BOARD_T),
    log: logGeometry(),
    lashing: lashingGeometry(),
    hit: new THREE.BoxGeometry(TILE, 0.55, TILE),
    bracket: new THREE.BoxGeometry(0.22, 0.012, 0.22),
    strap: new THREE.BoxGeometry(TILE * 0.96, 0.01, 0.06),
    ghost: new THREE.BoxGeometry(TILE * 0.96, 0.08, TILE * 0.96),
  };
  geo.ghostEdges = new THREE.EdgesGeometry(geo.ghost);
  const M = materials();
  mat = {
    wood: M.planks,
    chewed: M.chewed,
    log: M.bark,
    rope: M.rope,
    metal: M.darkMetal,
    hit: new THREE.MeshBasicMaterial({ visible: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.22, depthWrite: false }),
    ghostEdge: new THREE.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7 }),
  };
}

const key = (i, j) => `${i},${j}`;

export function createRaft(scene) {
  init();
  const group = new THREE.Group();
  scene.add(group);
  const tiles = new Map();
  let outside = new Set();
  let outsideDirty = true;
  let buildMode = null; // null, 'floor' or 'net' while the hammer is out
  const tilt = { y: 0, rx: 0, rz: 0 };
  const listeners = { added: [], broken: [], reset: [] };
  const emit = (name, arg) => listeners[name].forEach((f) => f(arg));

  // Outlines on open water next to the raft, where a new floor piece can go.
  const buildLayer = new THREE.Group();
  group.add(buildLayer);
  const buildPool = [];
  let buildDirty = true;

  function makeTile(i, j) {
    const g = new THREE.Group();
    g.position.set(i * TILE, 0, j * TILE);

    const logs = [];
    for (const lx of [-0.3, 0.3]) {
      const log = new THREE.Mesh(geo.log, mat.log);
      log.position.set(lx * TILE, DECK_Y - 0.22, 0);
      log.rotation.z = rand(0, Math.PI * 2);
      log.castShadow = log.receiveShadow = true;
      g.add(log);
      logs.push(log);
    }
    const lash = new THREE.Mesh(geo.lashing, mat.rope);
    lash.castShadow = true;
    g.add(lash);
    logs.push(lash);

    const boards = [];
    for (let b = 0; b < BOARDS; b++) {
      const variant = Math.floor(Math.random() * mat.wood.length);
      const m = new THREE.Mesh(geo.board, mat.wood[variant]);
      const z = -TILE / 2 + BOARD_W * (b + 0.5);
      const x = rand(-0.03, 0.03);
      m.position.set(x, DECK_Y - BOARD_T / 2 + rand(-0.006, 0.006), z);
      m.rotation.y = rand(-0.018, 0.018) + (Math.random() < 0.5 ? Math.PI : 0);
      m.rotation.x = rand(-0.012, 0.012);
      m.castShadow = m.receiveShadow = true;
      m.userData.base = { x, z, y: m.position.y, ry: m.rotation.y, variant };
      g.add(m);
      boards.push(m);
    }

    const hit = new THREE.Mesh(geo.hit, mat.hit);
    hit.position.y = DECK_Y - 0.25;
    g.add(hit);

    // Metal corner plates and straps, shown once the piece is reinforced.
    const brackets = new THREE.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const b = new THREE.Mesh(geo.bracket, mat.metal);
      b.position.set(sx * (TILE / 2 - 0.12), DECK_Y + 0.006, sz * (TILE / 2 - 0.12));
      brackets.add(b);
    }
    for (const sz of [-0.25, 0.25]) {
      const st = new THREE.Mesh(geo.strap, mat.metal);
      st.position.set(0, DECK_Y + 0.005, sz * TILE);
      brackets.add(st);
    }
    brackets.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
    brackets.visible = false;
    g.add(brackets);

    const ghost = new THREE.Mesh(geo.ghost, mat.ghost);
    ghost.position.y = DECK_Y - 0.04;
    ghost.add(new THREE.LineSegments(geo.ghostEdges, mat.ghostEdge));
    ghost.visible = false;
    g.add(ghost);

    group.add(g);
    const tile = { i, j, hp: FLOOR_HP.basic, maxHp: FLOOR_HP.basic, reinforced: false, brackets, broken: false, group: g, boards, logs, hit, ghost, biteSide: null, shake: 0 };
    hit.userData.tile = tile;
    ghost.userData.tile = tile;
    return tile;
  }

  function refreshTile(tile) {
    const { boards, logs, ghost, hit } = tile;
    if (tile.broken) {
      boards.forEach((b) => (b.visible = false));
      logs.forEach((l) => (l.visible = false));
      tile.brackets.visible = false;
      ghost.visible = !!buildMode;
      hit.visible = false;
      return;
    }
    logs.forEach((l) => (l.visible = true));
    ghost.visible = false;
    hit.visible = true;

    tile.brackets.visible = tile.reinforced;
    const steps = Math.min(9, Math.floor((100 - (tile.hp / tile.maxHp) * 100) / 10.5));
    const side = tile.biteSide || [0, -1];
    const bx = side[0] * TILE * 0.5;
    const bz = side[1] * TILE * 0.5;
    const order = boards
      .map((b, idx) => ({ b, idx, d: Math.hypot(b.userData.base.x - bx, b.userData.base.z - bz) + idx * 0.001 }))
      .sort((p, q) => p.d - q.d);

    // Chewed boards are shorter with a ragged end facing the bite, and sag.
    const dir = side[0] !== 0 ? side[0] : (tile.i + tile.j) % 2 ? 1 : -1;
    order.forEach(({ b }, k) => {
      const base = b.userData.base;
      const state = steps >= 2 * k + 2 ? 2 : steps >= 2 * k + 1 ? 1 : 0;
      b.visible = state < 2;
      if (state === 1) {
        b.geometry = geo.chewed;
        b.material = mat.chewed[base.variant];
        b.scale.x = 0.64;
        b.position.x = base.x - dir * TILE * 0.17;
        b.position.y = base.y - 0.022;
        b.rotation.set(0, dir > 0 ? 0.06 : Math.PI + 0.06, -0.07 * dir);
      } else {
        b.geometry = geo.board;
        b.material = mat.wood[base.variant];
        b.scale.x = 1;
        b.position.x = base.x;
        b.position.y = base.y;
        b.rotation.set(0, base.ry, 0);
      }
    });
  }

  function addTile(i, j) {
    const t = makeTile(i, j);
    tiles.set(key(i, j), t);
    outsideDirty = true;
    buildDirty = true;
    return t;
  }

  function canBuildAt(i, j) {
    if (tiles.has(key(i, j))) return false;
    if (Math.abs(i) > RAFT_LIMIT || Math.abs(j) > RAFT_LIMIT) return false;
    return SIDES.some(([di, dj]) => {
      const n = tiles.get(key(i + di, j + dj));
      return n && !n.broken;
    });
  }

  function refreshBuildGhosts() {
    buildDirty = false;
    const cells = [];
    if (buildMode === 'floor') {
      const seen = new Set();
      for (const t of tiles.values()) {
        if (t.broken) continue;
        for (const [di, dj] of SIDES) {
          const i = t.i + di, j = t.j + dj, k = key(i, j);
          if (!seen.has(k) && canBuildAt(i, j)) { seen.add(k); cells.push([i, j]); }
        }
      }
    }
    while (buildPool.length < cells.length) {
      const m = new THREE.Mesh(geo.ghost, mat.ghost);
      m.add(new THREE.LineSegments(geo.ghostEdges, mat.ghostEdge));
      m.userData.build = { i: 0, j: 0 };
      buildLayer.add(m);
      buildPool.push(m);
    }
    buildPool.forEach((m, n) => {
      const c = cells[n];
      m.visible = !!c;
      if (!c) return;
      m.userData.build.i = c[0];
      m.userData.build.j = c[1];
      m.position.set(c[0] * TILE, DECK_Y - 0.04, c[1] * TILE);
    });
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

    on(name, fn) {
      listeners[name].push(fn);
    },

    tileAt(i, j) {
      return tiles.get(key(i, j)) || null;
    },

    get buildMode() { return buildMode; },

    canBuildAt,

    // A new floor piece on open water next to the raft.
    build(i, j) {
      if (!canBuildAt(i, j)) return null;
      const t = addTile(i, j);
      t.shake = 0.15;
      refreshTile(t);
      emit('added', t);
      return t;
    },

    reset(layout) {
      emit('reset');
      for (const t of tiles.values()) group.remove(t.group);
      tiles.clear();
      for (const s of layout) {
        const t = addTile(s.i, s.j);
        if (s.hp != null) t.hp = s.hp;
        if (s.broken) t.broken = true;
        if (s.biteSide) t.biteSide = s.biteSide;
        if (s.reinforced && !t.broken) { t.reinforced = true; t.maxHp = FLOOR_HP.reinforced; if (s.hp == null) t.hp = t.maxHp; }
        refreshTile(t);
      }
      outsideDirty = true;
      buildDirty = true;
    },

    serialize() {
      return [...tiles.values()].map((t) => ({ i: t.i, j: t.j, hp: Math.round(t.hp), broken: t.broken, biteSide: t.biteSide, reinforced: t.reinforced }));
    },

    setBuildMode(mode) {
      if (buildMode === mode) return;
      buildMode = mode;
      for (const t of tiles.values()) if (t.broken) t.ghost.visible = !!mode;
      refreshBuildGhosts();
    },

    // Targets for the hammer ray: floor hitboxes, broken-floor ghosts, and in
    // floor mode the open spots where a new piece can go.
    hammerTargets() {
      if (buildDirty) refreshBuildGhosts();
      const out = [];
      for (const t of tiles.values()) out.push(t.broken ? t.ghost : t.hit);
      if (buildMode === 'floor') for (const m of buildPool) if (m.visible) out.push(m);
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
      if (!tile.biteSide || tile.hp >= tile.maxHp) tile.biteSide = side;
      tile.hp = Math.max(0, tile.hp - amount);
      tile.shake = 0.35;
      if (tile.hp <= 0) {
        tile.broken = true;
        outsideDirty = true;
        buildDirty = true;
      }
      refreshTile(tile);
      if (tile.broken) emit('broken', tile);
      return tile.broken;
    },

    // Health as a percentage, for prompts.
    pct(tile) {
      return Math.round((tile.hp / tile.maxHp) * 100);
    },

    reinforce(tile) {
      if (tile.broken || tile.reinforced) return false;
      tile.reinforced = true;
      tile.maxHp = FLOOR_HP.reinforced;
      tile.hp = tile.maxHp;
      tile.biteSide = null;
      tile.shake = 0.15;
      refreshTile(tile);
      return true;
    },

    repair(tile, amount) {
      tile.hp = Math.min(tile.maxHp, tile.hp + amount * (tile.maxHp / FLOOR_HP.basic));
      if (tile.hp >= tile.maxHp) tile.biteSide = null;
      tile.shake = 0.12;
      refreshTile(tile);
    },

    rebuild(tile) {
      tile.broken = false;
      tile.reinforced = false;
      tile.maxHp = FLOOR_HP.basic;
      tile.hp = tile.maxHp;
      tile.biteSide = null;
      tile.shake = 0.15;
      outsideDirty = true;
      buildDirty = true;
      refreshTile(tile);
    },

    worldPointOf(tile, side, out = new THREE.Vector3()) {
      const x = tile.i * TILE + (side ? side[0] * TILE * 0.5 : 0);
      const z = tile.j * TILE + (side ? side[1] * TILE * 0.5 : 0);
      return out.set(x, deckHeightAt(x, z), z);
    },

    update(t, dt) {
      if (buildDirty && buildMode) refreshBuildGhosts();
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
