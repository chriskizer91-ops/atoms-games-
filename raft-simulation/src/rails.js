import * as THREE from 'three';
import { TILE, DECK_Y } from './config.js';
import { materials } from './materials.js';

// Railings along an outer edge of a floor piece. You can't walk off the raft
// through one, and a hammerhead's hit won't throw you over it. An edge holds
// either a railing or a catch net.

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (t, side) => `${t.i},${t.j},${side[0]},${side[1]}`;
const HALF = TILE / 2;

let G = null;
let M = null;
function init() {
  if (G) return;
  const base = materials();
  M = {
    post: (() => { const m = base.bark.clone(); m.vertexColors = false; m.color.set(0xb89a76); return m; })(),
    rail: base.planks[2],
    rope: base.rope,
    hit: new THREE.MeshBasicMaterial({ visible: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.22, depthWrite: false }),
    ghostEdge: new THREE.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7 }),
  };
  const ghost = new THREE.BoxGeometry(TILE, 0.9, 0.1).translate(0, DECK_Y + 0.45, -0.05);
  G = {
    post: new THREE.CylinderGeometry(0.04, 0.045, 0.95, 7).translate(0, 0.475, 0),
    rail: new THREE.BoxGeometry(TILE, 0.06, 0.05),
    lash: new THREE.TorusGeometry(0.055, 0.014, 6, 10),
    hit: new THREE.BoxGeometry(TILE, 1.0, 0.35).translate(0, DECK_Y + 0.5, -0.1),
    ghost,
    ghostEdges: new THREE.EdgesGeometry(ghost),
  };
}

function buildRail() {
  const g = new THREE.Group();
  for (const x of [-HALF + 0.06, 0, HALF - 0.06]) {
    const p = new THREE.Mesh(G.post, M.post);
    p.position.set(x, DECK_Y, -0.06);
    p.castShadow = true;
    g.add(p);
    const l = new THREE.Mesh(G.lash, M.rope);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, DECK_Y + 0.86, -0.06);
    g.add(l);
  }
  for (const y of [0.88, 0.48]) {
    const r = new THREE.Mesh(G.rail, M.rail);
    r.position.set(0, DECK_Y + y, -0.06);
    r.castShadow = true;
    r.receiveShadow = true;
    g.add(r);
  }
  const hit = new THREE.Mesh(G.hit, M.hit);
  g.add(hit);
  return { group: g, hit };
}

export function createRails(raft) {
  init();
  const rails = new Map();
  const ghostLayer = new THREE.Group();
  raft.group.add(ghostLayer);
  const ghostPool = [];
  let mode = null;
  let dirty = true;
  let edgeTaken = () => false;

  function add(tile, side) {
    const k = key(tile, side);
    if (rails.has(k) || tile.broken) return null;
    const built = buildRail();
    built.group.position.set(side[0] * HALF, 0, side[1] * HALF);
    built.group.rotation.y = Math.atan2(side[0], side[1]);
    tile.group.add(built.group);
    const rail = { tile, side, group: built.group, hit: built.hit };
    built.hit.userData.rail = rail;
    rails.set(k, rail);
    dirty = true;
    return rail;
  }

  function remove(rail) {
    rail.tile.group.remove(rail.group);
    rails.delete(key(rail.tile, rail.side));
    dirty = true;
  }

  function slots() {
    const out = [];
    for (const t of raft.tiles.values()) {
      if (t.broken) continue;
      for (const side of SIDES) {
        if (raft.tileAt(t.i + side[0], t.j + side[1])) continue;
        if (rails.has(key(t, side)) || edgeTaken(t, side)) continue;
        out.push({ tile: t, side });
      }
    }
    return out;
  }

  function refreshGhosts() {
    dirty = false;
    const list = mode === 'rail' ? slots() : [];
    while (ghostPool.length < list.length) {
      const m = new THREE.Mesh(G.ghost, M.ghost);
      m.add(new THREE.LineSegments(G.ghostEdges, M.ghostEdge));
      ghostLayer.add(m);
      ghostPool.push(m);
    }
    ghostPool.forEach((m, n) => {
      const s = list[n];
      m.visible = !!s;
      if (!s) return;
      m.userData.railSlot = s;
      m.position.set(s.tile.i * TILE + s.side[0] * HALF, 0, s.tile.j * TILE + s.side[1] * HALF);
      m.rotation.y = Math.atan2(s.side[0], s.side[1]);
    });
    ghostLayer.updateMatrixWorld(true);
  }

  raft.on('broken', (tile) => {
    for (const r of [...rails.values()]) if (r.tile === tile) remove(r);
  });
  raft.on('added', (tile) => {
    // a new floor piece where a railing faced: the railing comes down (kept)
    for (const r of [...rails.values()]) {
      if (r.tile.i + r.side[0] === tile.i && r.tile.j + r.side[1] === tile.j) { remove(r); onBuiltOver(); }
    }
    dirty = true;
  });
  raft.on('reset', () => {
    for (const r of [...rails.values()]) r.tile.group.remove(r.group);
    rails.clear();
    dirty = true;
  });
  let onBuiltOver = () => {};

  return {
    rails,
    count() { return rails.size; },
    has(tile, side) { return rails.has(key(tile, side)); },
    add,
    setEdgeTaken(fn) { edgeTaken = fn; },
    onBuiltOver(fn) { onBuiltOver = fn; },
    markDirty() { dirty = true; },
    setMode(m) {
      if (mode === m) return;
      mode = m;
      refreshGhosts();
    },
    ghostTargets() {
      if (dirty) refreshGhosts();
      return mode === 'rail' ? ghostPool.filter((m) => m.visible) : [];
    },
    hitTargets() {
      return [...rails.values()].map((r) => r.hit);
    },

    // Would stepping from (x0,z0) to (x1,z1) go over a railing? Checked per
    // axis so you can still slide along one.
    blocks(x0, z0, x1, z1) {
      if (!rails.size) return false;
      const i = Math.round(x0 / TILE), j = Math.round(z0 / TILE);
      const t = raft.tileAt(i, j);
      if (!t || t.broken) return false;
      const lx = x1 - i * TILE, lz = z1 - j * TILE;
      const lim = HALF - 0.18;
      if (lx > lim && rails.has(key(t, [1, 0]))) return true;
      if (lx < -lim && rails.has(key(t, [-1, 0]))) return true;
      if (lz > lim && rails.has(key(t, [0, 1]))) return true;
      if (lz < -lim && rails.has(key(t, [0, -1]))) return true;
      return false;
    },

    serialize() {
      return [...rails.values()].map((r) => ({ i: r.tile.i, j: r.tile.j, side: r.side }));
    },
    restore(list) {
      for (const s of list || []) {
        const tile = raft.tileAt(s.i, s.j);
        if (tile && !tile.broken) add(tile, s.side);
      }
    },
    update() {
      if (dirty && mode) refreshGhosts();
    },
  };
}
