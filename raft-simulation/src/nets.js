import * as THREE from 'three';
import { TILE, DECK_Y, NET } from './config.js';
import { materials } from './materials.js';
import { netTexture } from './textures.js';
import { rand } from './util.js';

// Catch nets: a pole frame sticking out from one outer edge of a floor piece
// with a sagging rope basket under it. Anything drifting into the basket
// stays there, and now and then a fish swims in. Empty it with E.

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const HALF = 0.72;       // half the basket's width along the edge
const FRAME_Y = DECK_Y - 0.14;
const SAG = 0.55;
const key = (t, side) => `${t.i},${t.j},${side[0]},${side[1]}`;

let G = null;
let M = null;
function init() {
  if (G) return;
  const base = materials();
  const tex = netTexture();
  tex.repeat.set(7, 5);
  M = {
    pole: base.bark,
    rope: base.rope,
    net: new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 }),
    netWide: new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7, color: 0x8fd0b8 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.22, depthWrite: false }),
    ghostEdge: new THREE.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7 }),
    fish: new THREE.MeshStandardMaterial({ color: 0x86a0ae, metalness: 0.2, roughness: 0.45 }),
    fishBack: new THREE.MeshStandardMaterial({ color: 0x3e5a6b, metalness: 0.2, roughness: 0.4 }),
  };
  const R = NET.reach;
  const basket = new THREE.PlaneGeometry(1, 1, 12, 10);
  const pos = basket.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5, w = pos.getY(i) + 0.5;
    pos.setXYZ(i, -HALF + u * HALF * 2, FRAME_Y - SAG * Math.sin(Math.PI * u) * Math.sin(Math.PI * w), w * R);
  }
  basket.computeVertexNormals();
  // Pole geometry runs along +z; scaled per use.
  const pole = new THREE.CylinderGeometry(0.045, 0.05, 1, 8).rotateX(Math.PI / 2).translate(0, 0, 0.5);
  const ghost = new THREE.BoxGeometry(HALF * 2, 0.12, R).translate(0, FRAME_Y, R / 2);
  G = {
    basket,
    pole,
    lash: new THREE.TorusGeometry(0.06, 0.014, 6, 12),
    hit: new THREE.BoxGeometry(HALF * 2 + 0.2, 0.8, R + 0.1).translate(0, FRAME_Y - 0.2, R / 2),
    ghost,
    ghostEdges: new THREE.EdgesGeometry(ghost),
    fishBody: new THREE.SphereGeometry(1, 12, 8).scale(0.045, 0.06, 0.16),
    fishBack: new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.04, 0.03, 0.14),
    fishTail: new THREE.ConeGeometry(0.06, 0.09, 4).rotateX(-Math.PI / 2).scale(0.25, 1, 1).translate(0, 0, -0.19),
  };
}

export function makeFish() {
  init();
  const g = new THREE.Group();
  const body = new THREE.Mesh(G.fishBody, M.fish);
  const back = new THREE.Mesh(G.fishBack, M.fishBack);
  back.position.y = 0.02;
  const tail = new THREE.Mesh(G.fishTail, M.fish);
  g.add(body, back, tail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildNet() {
  const g = new THREE.Group();
  const R = NET.reach;
  const poles = [];
  for (const x of [-HALF, HALF]) {
    const p = new THREE.Mesh(G.pole, M.pole);
    p.position.set(x, FRAME_Y, -0.1);
    p.scale.set(1, 1, R + 0.15);
    poles.push(p);
  }
  const front = new THREE.Mesh(G.pole, M.pole);
  front.rotation.y = Math.PI / 2;
  front.position.set(-HALF - 0.08, FRAME_Y, R);
  front.scale.set(1, 1, HALF * 2 + 0.16);
  poles.push(front);
  for (const p of poles) { p.castShadow = true; g.add(p); }
  for (const x of [-HALF, HALF]) {
    const l = new THREE.Mesh(G.lash, M.rope);
    l.position.set(x, FRAME_Y, R);
    l.rotation.y = Math.PI / 2;
    g.add(l);
  }
  const basket = new THREE.Mesh(G.basket, M.net);
  basket.castShadow = true;
  g.add(basket);
  const hit = new THREE.Mesh(G.hit, M.hit);
  g.add(hit);
  return { group: g, hit, basket };
}

export function createNets(raft, debris, fx, audio) {
  init();
  const nets = new Map();
  const ghostLayer = new THREE.Group();
  raft.group.add(ghostLayer);
  const ghostPool = [];
  let mode = null;
  let ghostsDirty = true;
  let lost = () => {};

  // World frame of a net: o = edge midpoint, n = outward, tg = along the edge.
  function frameOf(net) {
    const [sx, sz] = net.side;
    return { ox: net.tile.i * TILE + sx * TILE / 2, oz: net.tile.j * TILE + sz * TILE / 2, nx: sx, nz: sz, tx: -sz, tz: sx };
  }

  const capacityOf = (net) => (net.level > 1 ? 8 : NET.capacity);

  function placeItem(net, d, k) {
    const f = frameOf(net);
    const perRow = net.level > 1 ? 4 : 3;
    const u = (k % perRow - (perRow - 1) / 2) * (net.level > 1 ? 0.34 : 0.42);
    const w = 0.3 + Math.floor(k / perRow) * 0.36;
    d.x = f.ox + f.nx * w + f.tx * u;
    d.z = f.oz + f.nz * w + f.tz * u;
  }

  function addFishMesh(net) {
    const fish = makeFish();
    const k = net.items.length + net.fish.length;
    fish.position.set((k % 3 - 1) * 0.4, -0.06, 0.3 + Math.floor(k / 3) * 0.4);
    fish.rotation.y = rand(0, Math.PI * 2);
    fish.userData.phase = rand(0, 10);
    net.group.add(fish);
    net.fish.push(fish);
  }

  function release(net, scatter) {
    for (const d of net.items) {
      d.hooked = false;
      d.caught = null;
      d.vx = net.side[0] * (scatter ? 1.2 : 0.3);
      d.vz = net.side[1] * (scatter ? 1.2 : 0.3);
    }
    net.items = [];
    for (const f of net.fish) net.group.remove(f);
    net.fish = [];
  }

  function remove(net, reason) {
    release(net, reason !== 'built-over');
    net.tile.group.remove(net.group);
    nets.delete(key(net.tile, net.side));
    ghostsDirty = true;
    lost(net, reason);
  }

  function add(tile, side, contents) {
    const k = key(tile, side);
    if (nets.has(k) || tile.broken) return null;
    const built = buildNet();
    built.group.position.set(side[0] * TILE / 2, 0, side[1] * TILE / 2);
    built.group.rotation.y = Math.atan2(side[0], side[1]);
    tile.group.add(built.group);
    const net = { tile, side, group: built.group, hit: built.hit, basket: built.basket, level: 1, items: [], fish: [], fishTimer: rand(...NET.fishEvery) };
    if (contents?.level > 1) widen(net);
    built.hit.userData.net = net;
    nets.set(k, net);
    ghostsDirty = true;
    if (contents) {
      for (const it of contents.items || []) {
        const d = debris.spawn(it.type, 0, 0);
        d.loot = it.loot;
        d.hooked = true;
        d.caught = net;
        placeItem(net, d, net.items.length);
        net.items.push(d);
      }
      for (let f = 0; f < (contents.fish || 0); f++) addFishMesh(net);
    }
    return net;
  }

  function widen(net) {
    net.level = 2;
    net.basket.material = M.netWide;
    net.basket.scale.y = 1.25;
  }

  function slots() {
    const out = [];
    for (const t of raft.tiles.values()) {
      if (t.broken) continue;
      for (const side of SIDES) {
        if (raft.tileAt(t.i + side[0], t.j + side[1])) continue;
        if (nets.has(key(t, side))) continue;
        out.push({ tile: t, side });
      }
    }
    return out;
  }

  function refreshGhosts() {
    ghostsDirty = false;
    const list = mode === 'net' ? slots() : [];
    while (ghostPool.length < list.length) {
      const m = new THREE.Mesh(G.ghost, M.ghost);
      m.add(new THREE.LineSegments(G.ghostEdges, M.ghostEdge));
      m.userData.netSlot = null;
      ghostLayer.add(m);
      ghostPool.push(m);
    }
    ghostPool.forEach((m, n) => {
      const s = list[n];
      m.visible = !!s;
      if (!s) return;
      m.userData.netSlot = s;
      m.position.set(s.tile.i * TILE + s.side[0] * TILE / 2, 0, s.tile.j * TILE + s.side[1] * TILE / 2);
      m.rotation.y = Math.atan2(s.side[0], s.side[1]);
    });
  }

  // Raft events: a broken floor piece takes its nets with it; a new floor
  // piece built where a net was pointing replaces that net.
  raft.on('broken', (tile) => {
    for (const net of [...nets.values()]) if (net.tile === tile) remove(net, 'tile-broke');
  });
  raft.on('added', (tile) => {
    for (const net of [...nets.values()]) {
      if (net.tile.i + net.side[0] === tile.i && net.tile.j + net.side[1] === tile.j) remove(net, 'built-over');
    }
    ghostsDirty = true;
  });
  raft.on('reset', () => {
    for (const net of [...nets.values()]) {
      for (const d of net.items) debris.remove(d);
      net.items = [];
      net.tile.group.remove(net.group);
    }
    nets.clear();
    ghostsDirty = true;
  });

  const tmp = new THREE.Vector3();

  return {
    nets,
    onLost(fn) { lost = fn; },
    count() { return nets.size; },
    has(tile, side) { return nets.has(key(tile, side)); },
    add,

    // The shark tearing at an edge with a net on it destroys the net first.
    breakAt(tile, side) {
      const net = nets.get(key(tile, side));
      if (!net) return false;
      const f = frameOf(net);
      fx.splinters(tmp.set(f.ox + f.nx * 0.5, DECK_Y, f.oz + f.nz * 0.5));
      remove(net, 'shark');
      return true;
    },

    setMode(m) {
      if (mode === m) return;
      mode = m;
      refreshGhosts();
    },

    ghostTargets() {
      if (ghostsDirty) refreshGhosts();
      return mode === 'net' ? ghostPool.filter((m) => m.visible) : [];
    },

    hitTargets() {
      return [...nets.values()].map((n) => n.hit);
    },

    contentsOf(net) {
      return net.items.length + net.fish.length;
    },
    capacityOf,
    upgradeOf(net) {
      return net.level < 2 ? 'wideNet' : null;
    },
    upgrade(net) {
      if (net.level >= 2) return false;
      widen(net);
      return true;
    },

    // Take everything out of a net. Returns the materials gained.
    empty(net) {
      const gained = {};
      for (const d of net.items) {
        for (const k in d.loot) gained[k] = (gained[k] || 0) + d.loot[k];
        debris.remove(d);
      }
      if (net.fish.length) gained.fish = (gained.fish || 0) + net.fish.length;
      for (const f of net.fish) net.group.remove(f);
      net.items = [];
      net.fish = [];
      return gained;
    },

    serialize() {
      return [...nets.values()].map((n) => ({
        i: n.tile.i, j: n.tile.j, side: n.side, level: n.level,
        items: n.items.map((d) => ({ type: d.type, loot: d.loot })),
        fish: n.fish.length,
      }));
    },

    restore(list) {
      for (const s of list || []) {
        const tile = raft.tileAt(s.i, s.j);
        if (tile && !tile.broken) add(tile, s.side, s);
      }
    },

    update(t, dt) {
      if (ghostsDirty && mode) refreshGhosts();
      if (!nets.size) return;
      const list = [...nets.values()];
      // Catch anything drifting into a basket.
      for (const d of debris.items) {
        if (d.hooked) continue;
        for (const net of list) {
          if (net.items.length + net.fish.length >= capacityOf(net)) continue;
          const f = frameOf(net);
          const rx = d.x - f.ox, rz = d.z - f.oz;
          const w = rx * f.nx + rz * f.nz;
          const u = rx * f.tx + rz * f.tz;
          if (Math.abs(u) < HALF && w > 0.05 && w < NET.reach) {
            d.hooked = true;
            d.caught = net;
            net.items.push(d);
            break;
          }
        }
      }
      for (const net of list) {
        net.items.forEach((d, k) => placeItem(net, d, k));
        net.fishTimer -= dt;
        if (net.fishTimer <= 0) {
          net.fishTimer = rand(...NET.fishEvery);
          if (net.items.length + net.fish.length < capacityOf(net)) {
            addFishMesh(net);
            const f = frameOf(net);
            fx.splash(tmp.set(f.ox + f.nx * 0.5, 0.05, f.oz + f.nz * 0.5), 0.35);
          }
        }
        for (const fish of net.fish) {
          const ph = fish.userData.phase;
          const flop = Math.max(0, Math.sin(t * 1.3 + ph)) ** 8;
          fish.rotation.z = Math.sin(t * 18 + ph) * 0.6 * flop;
          fish.position.y = -0.06 + flop * 0.08;
        }
      }
    },
  };
}
