import * as THREE from 'three';
import { TILE, DECK_Y, GRILL, CATCHER } from './config.js';
import { materials } from './materials.js';
import { makeFish } from './nets.js';
import { rand } from './util.js';

// Things built on a floor piece with the hammer: a firepit grill and a rain
// catcher. One per floor piece. They go overboard if their piece breaks.

const key = (t) => `${t.i},${t.j}`;

let G = null;
let M = null;
function init() {
  if (G) return;
  const base = materials();
  M = {
    stone: base.stone,
    log: base.bark,
    metal: base.darkMetal,
    rope: base.rope,
    barrel: base.barrel,
    tarp: new THREE.MeshStandardMaterial({ color: 0x3f74a8, roughness: 0.45, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: 0x6fb9d0, roughness: 0.08, transparent: true, opacity: 0.75 }),
    ember: new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff5a1a, emissiveIntensity: 0, roughness: 0.9 }),
    ghost: new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.22, depthWrite: false }),
    ghostEdge: new THREE.LineBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.7 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
  const ghost = new THREE.CylinderGeometry(0.5, 0.5, 0.9, 16).translate(0, DECK_Y + 0.45, 0);
  G = {
    stone: new THREE.DodecahedronGeometry(0.11, 0),
    log: new THREE.CylinderGeometry(0.05, 0.055, 0.5, 7).rotateZ(Math.PI / 2),
    grate: new THREE.BoxGeometry(0.62, 0.015, 0.02),
    ember: new THREE.CircleGeometry(0.22, 12).rotateX(-Math.PI / 2),
    post: new THREE.CylinderGeometry(0.035, 0.04, 1.1, 7),
    funnel: new THREE.CylinderGeometry(0.55, 0.12, 0.35, 16, 1, true),
    barrel: new THREE.CylinderGeometry(0.24, 0.26, 0.5, 14),
    disc: new THREE.CircleGeometry(0.22, 14).rotateX(-Math.PI / 2),
    hit: new THREE.CylinderGeometry(0.55, 0.55, 1.1, 10).translate(0, DECK_Y + 0.55, 0),
    ghost,
    ghostEdges: new THREE.EdgesGeometry(ghost),
  };
}

function mesh(g, m, shadow = true) {
  const o = new THREE.Mesh(g, m);
  o.castShadow = shadow;
  o.receiveShadow = shadow;
  return o;
}

function buildGrill() {
  const g = new THREE.Group();
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const s = mesh(G.stone, M.stone);
    s.position.set(Math.cos(a) * 0.3, DECK_Y + 0.07, Math.sin(a) * 0.3);
    s.rotation.set(rand(0, 3), rand(0, 3), 0);
    s.scale.setScalar(rand(0.85, 1.15));
    g.add(s);
  }
  const ember = mesh(G.ember, M.ember.clone(), false);
  ember.position.y = DECK_Y + 0.03;
  g.add(ember);
  const logs = [];
  for (let k = 0; k < 3; k++) {
    const l = mesh(G.log, M.log);
    l.position.set(0, DECK_Y + 0.08 + k * 0.02, 0);
    l.rotation.y = (k / 3) * Math.PI;
    g.add(l);
    logs.push(l);
  }
  for (let k = -3; k <= 3; k++) {
    const b = mesh(G.grate, M.metal);
    b.position.set(0, DECK_Y + 0.26, k * 0.07);
    g.add(b);
  }
  for (const x of [-0.3, 0.3]) {
    const p = mesh(G.post, M.metal);
    p.scale.set(0.5, 0.24, 0.5);
    p.position.set(x, DECK_Y + 0.13, 0);
    g.add(p);
  }
  const fish = makeFish();
  fish.rotation.set(0, 0.3, Math.PI / 2);
  fish.position.set(0, DECK_Y + 0.31, 0);
  fish.visible = false;
  g.add(fish);
  return { group: g, ember, logs, fish };
}

function buildCatcher() {
  const g = new THREE.Group();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const p = mesh(G.post, M.log);
    p.position.set(Math.cos(a) * 0.42, DECK_Y + 0.55, Math.sin(a) * 0.42);
    g.add(p);
  }
  const funnel = mesh(G.funnel, M.tarp);
  funnel.position.y = DECK_Y + 1.0;
  g.add(funnel);
  const barrel = mesh(G.barrel, M.barrel);
  barrel.position.y = DECK_Y + 0.25;
  g.add(barrel);
  const water = mesh(G.disc, M.water, false);
  water.position.y = DECK_Y + 0.05;
  g.add(water);
  return { group: g, water };
}

export function createStations(raft, fx, audio) {
  init();
  const list = new Map();
  const ghostLayer = new THREE.Group();
  raft.group.add(ghostLayer);
  const ghosts = [];
  let mode = null;
  let dirty = true;
  let lost = () => {};
  // One warm light, parked at whichever fire is closest to you.
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 7, 1.8);
  raft.group.add(fireLight);

  function add(tile, kind, state) {
    if (list.has(key(tile)) || tile.broken) return null;
    const built = kind === 'grill' ? buildGrill() : buildCatcher();
    tile.group.add(built.group);
    const hit = mesh(G.hit, M.hit, false);
    built.group.add(hit);
    const st = { tile, kind, ...built, hit, fuel: 0, cooking: 0, cooked: false, cups: 0, fill: 0, flame: 0 };
    if (state) Object.assign(st, { fuel: state.fuel || 0, cooking: state.cooking || 0, cooked: !!state.cooked, cups: state.cups || 0 });
    hit.userData.station = st;
    list.set(key(tile), st);
    dirty = true;
    return st;
  }

  function remove(st, reason) {
    st.tile.group.remove(st.group);
    list.delete(key(st.tile));
    dirty = true;
    lost(st, reason);
  }

  function refreshGhosts() {
    dirty = false;
    const tiles = mode === 'grill' || mode === 'catcher'
      ? [...raft.tiles.values()].filter((t) => !t.broken && !list.has(key(t)))
      : [];
    while (ghosts.length < tiles.length) {
      const m = new THREE.Mesh(G.ghost, M.ghost);
      m.add(new THREE.LineSegments(G.ghostEdges, M.ghostEdge));
      ghostLayer.add(m);
      ghosts.push(m);
    }
    ghosts.forEach((m, n) => {
      const t = tiles[n];
      m.visible = !!t;
      if (!t) return;
      m.userData.stationSlot = { tile: t, kind: mode };
      m.position.set(t.i * TILE, 0, t.j * TILE);
    });
    ghostLayer.updateMatrixWorld(true);
  }

  raft.on('broken', (tile) => {
    const st = list.get(key(tile));
    if (st) remove(st, 'tile-broke');
  });
  raft.on('added', () => { dirty = true; });
  raft.on('reset', () => {
    for (const st of [...list.values()]) st.tile.group.remove(st.group);
    list.clear();
    dirty = true;
  });

  const tmp = new THREE.Vector3();

  return {
    list,
    onLost(fn) { lost = fn; },
    add,
    count(kind) { return [...list.values()].filter((s) => !kind || s.kind === kind).length; },
    hasStation(tile) { return list.has(key(tile)); },

    setMode(m) {
      if (mode === m) return;
      mode = m;
      refreshGhosts();
    },
    ghostTargets() {
      if (dirty) refreshGhosts();
      return mode === 'grill' || mode === 'catcher' ? ghosts.filter((g) => g.visible) : [];
    },
    hitTargets() {
      return [...list.values()].map((s) => s.hit);
    },

    // Is there a burning fire within range of a raft-space point?
    warmthAt(x, z, range) {
      for (const st of list.values()) {
        if (st.kind !== 'grill' || st.fuel <= 0) continue;
        if (Math.hypot(st.tile.i * TILE - x, st.tile.j * TILE - z) < range) return true;
      }
      return false;
    },

    // What pressing E on this station would do, as { text, action } or a dim note.
    describe(st, inv) {
      if (st.kind === 'grill') {
        if (st.cooked) return { key: 'E', text: 'Take the cooked fish', act: 'take' };
        if (st.cooking > 0) return { text: `Cooking... ${Math.round((1 - st.cooking / GRILL.cook) * 100)}%`, dim: true };
        if (st.fuel <= 0) return inv.get('wood') > 0
          ? { key: 'E', text: 'Light the fire', cost: '1 wood', ok: true, act: 'fuel' }
          : { text: 'Light the fire', cost: 'Need 1 wood', ok: false };
        if (inv.get('fish') > 0) return { key: 'E', text: 'Cook a fish', act: 'cook' };
        return inv.get('wood') > 0
          ? { key: 'E', text: `Add wood (fire: ${Math.ceil(st.fuel)} s)`, cost: '1 wood', ok: true, act: 'fuel' }
          : { text: `Fire burning: ${Math.ceil(st.fuel)} s`, dim: true };
      }
      if (st.cups > 0) return { key: 'E', text: `Drink fresh water (${st.cups} left)`, act: 'drink' };
      return { text: `Rain catcher: filling (${Math.round(st.fill * 100)}%)`, dim: true };
    },

    // Do it. Returns what changed so the caller can apply it to the player.
    use(st, act, inv) {
      if (act === 'fuel' && inv.get('wood') > 0) {
        inv.spend({ wood: 1 });
        st.fuel += GRILL.burn;
        audio.hammer();
        return { fueled: true };
      }
      if (act === 'cook' && inv.get('fish') > 0 && st.fuel > 0 && st.cooking <= 0 && !st.cooked) {
        inv.spend({ fish: 1 });
        st.cooking = GRILL.cook;
        audio.sizzle();
        return { cooking: true };
      }
      if (act === 'take' && st.cooked) {
        st.cooked = false;
        inv.add({ cooked: 1 });
        audio.pickup();
        return { took: true };
      }
      if (act === 'drink' && st.cups > 0) {
        st.cups--;
        audio.drink();
        return { drank: true };
      }
      return null;
    },

    serialize() {
      return [...list.values()].map((s) => ({ i: s.tile.i, j: s.tile.j, kind: s.kind, fuel: s.fuel, cooking: s.cooking, cooked: s.cooked, cups: s.cups }));
    },
    restore(arr) {
      for (const s of arr || []) {
        const t = raft.tileAt(s.i, s.j);
        if (t && !t.broken) add(t, s.kind, s);
      }
    },

    update(t, dt, weatherKind, playerPos) {
      if (dirty && mode) refreshGhosts();
      let nearest = null, nearestD = Infinity;
      for (const st of list.values()) {
        if (st.kind === 'grill') {
          const burning = st.fuel > 0;
          if (burning) {
            st.fuel = Math.max(0, st.fuel - dt);
            st.flame -= dt;
            const wx = st.tile.i * TILE, wz = st.tile.j * TILE;
            if (st.flame <= 0) {
              st.flame = 0.06;
              fx.flame(tmp.set(wx + rand(-0.1, 0.1), raft.deckHeightAt(wx, wz) + 0.12, wz + rand(-0.1, 0.1)));
            }
            const d = Math.hypot(wx - playerPos.x, wz - playerPos.z);
            if (d < nearestD) { nearestD = d; nearest = st; }
          }
          st.ember.material.emissiveIntensity = burning ? 2.2 + Math.sin(t * 13) * 0.4 : 0;
          st.logs.forEach((l) => (l.visible = burning || st.fuel === 0));
          if (st.cooking > 0) {
            if (burning) st.cooking = Math.max(0, st.cooking - dt);
            if (st.cooking === 0) {
              st.cooked = true;
              audio.sizzle();
            }
          }
          st.fish.visible = st.cooking > 0 || st.cooked;
          if (st.fish.visible) {
            const k = st.cooked ? 1 : 1 - st.cooking / GRILL.cook;
            st.fish.traverse((o) => { if (o.isMesh) o.material = cookedMat(k); });
          }
        } else {
          if (st.cups < CATCHER.cups) {
            st.fill += dt / (CATCHER.fillEvery[weatherKind] || 60);
            if (st.fill >= 1) { st.fill = 0; st.cups++; }
          } else {
            st.fill = 0;
          }
          st.water.position.y = DECK_Y + 0.05 + (st.cups + st.fill) / CATCHER.cups * 0.42;
          st.water.visible = st.cups > 0 || st.fill > 0.05;
        }
      }
      if (nearest) {
        fireLight.position.set(nearest.tile.i * TILE, DECK_Y + 0.6, nearest.tile.j * TILE);
        fireLight.intensity = 3.4 + Math.sin(t * 17) * 0.7 + Math.sin(t * 7.3) * 0.5;
      } else {
        fireLight.intensity = 0;
      }
    },
  };
}

// Raw fish greys and browns as it cooks; four shared steps.
const cookSteps = [];
function cookedMat(k) {
  const i = Math.min(3, Math.floor(k * 4));
  if (!cookSteps[i]) {
    const c = new THREE.Color(0x86a0ae).lerp(new THREE.Color(0x8a5a2e), i / 3);
    cookSteps[i] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  }
  return cookSteps[i];
}

