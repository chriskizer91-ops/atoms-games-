import * as THREE from 'three';
import { TILE, DECK_Y, GRILL, CATCHER } from './config.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { makeFish } from './nets.js';
import { rand } from './util.js';

// Things built on a floor piece with the hammer: crafting table, firepit grill
// (upgrades to a stone oven), rain catcher (upgrades to a big one) and the
// anchor. One per floor piece. They go overboard if their piece breaks.

const key = (t) => `${t.i},${t.j}`;

let G = null;
let M = null;
function init() {
  if (G) return;
  const base = materials();
  M = {
    stone: base.stone,
    log: (() => { const m = base.bark.clone(); m.vertexColors = false; return m; })(),
    plank: base.planks[1],
    steel: base.metal,
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
    tableTop: new RoundedBoxGeometry(1.15, 0.07, 0.7, 2, 0.02),
    shelf: new THREE.BoxGeometry(1.0, 0.04, 0.55),
    leg: new THREE.CylinderGeometry(0.035, 0.04, 0.86, 7),
    saw: new THREE.BoxGeometry(0.42, 0.006, 0.1),
    drum: new THREE.CylinderGeometry(0.11, 0.11, 0.42, 14).rotateZ(Math.PI / 2),
    dome: new THREE.SphereGeometry(0.42, 12, 8, 0.9, Math.PI * 2 - 1.8, 0, Math.PI * 0.55),
    shank: new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8),
    fluke: new THREE.TorusGeometry(0.2, 0.025, 6, 14, Math.PI),
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

function buildTable() {
  const g = new THREE.Group();
  const top = mesh(G.tableTop, M.plank);
  top.position.y = DECK_Y + 0.88;
  g.add(top);
  const shelf = mesh(G.shelf, M.plank);
  shelf.position.y = DECK_Y + 0.28;
  g.add(shelf);
  for (const x of [-0.5, 0.5]) for (const z of [-0.28, 0.28]) {
    const l = mesh(G.leg, M.log);
    l.position.set(x, DECK_Y + 0.43, z);
    g.add(l);
  }
  const saw = mesh(G.saw, M.steel);
  saw.position.set(-0.2, DECK_Y + 0.925, 0.1);
  saw.rotation.y = 0.4;
  g.add(saw);
  const coil = mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 14).rotateX(Math.PI / 2), M.rope);
  coil.position.set(0.3, DECK_Y + 0.94, -0.12);
  g.add(coil);
  return { group: g };
}

function buildAnchor() {
  const g = new THREE.Group();
  for (const x of [-0.26, 0.26]) {
    const p = mesh(G.post, M.log);
    p.scale.set(1, 0.6, 1);
    p.position.set(x, DECK_Y + 0.33, 0);
    g.add(p);
  }
  const drum = mesh(G.drum, M.rope);
  drum.position.y = DECK_Y + 0.58;
  g.add(drum);
  const anchor = new THREE.Group();
  const shank = mesh(G.shank, M.metal);
  shank.position.y = 0.27;
  anchor.add(shank);
  const fluke = mesh(G.fluke, M.metal);
  fluke.rotation.z = Math.PI;
  fluke.position.y = 0.2;
  anchor.add(fluke);
  anchor.position.set(0, DECK_Y + 0.02, 0.32);
  anchor.rotation.x = -1.2;
  g.add(anchor);
  const line = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), M.rope, false);
  line.visible = false;
  g.add(line);
  return { group: g, anchor, line };
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

const STATION_KINDS = ['grill', 'catcher', 'table', 'anchor'];
const isStationMode = (m) => STATION_KINDS.includes(m);

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
    const built = { grill: buildGrill, catcher: buildCatcher, table: buildTable, anchor: buildAnchor }[kind]();
    tile.group.add(built.group);
    const hit = mesh(G.hit, M.hit, false);
    built.group.add(hit);
    const st = { tile, kind, ...built, hit, level: 1, fuel: 0, cooking: 0, cooked: false, cups: 0, fill: 0, flame: 0, down: false };
    if (state) Object.assign(st, { fuel: state.fuel || 0, cooking: state.cooking || 0, cooked: !!state.cooked, cups: state.cups || 0, down: !!state.down });
    if (state?.level > 1) applyUpgrade(st);
    hit.userData.station = st;
    list.set(key(tile), st);
    dirty = true;
    return st;
  }

  // Level 2 for a grill (stone oven) or rain catcher (big catcher).
  function applyUpgrade(st) {
    st.level = 2;
    if (st.kind === 'grill') {
      // Stone dome with an opening at the front so the fire still shows.
      const dome = mesh(G.dome, M.stone);
      dome.position.y = DECK_Y + 0.02;
      dome.scale.set(1.05, 1.15, 1.05);
      st.group.add(dome);
    } else if (st.kind === 'catcher') {
      st.group.scale.set(1.3, 1.15, 1.3);
    }
  }

  const upgradeFor = { grill: 'oven', catcher: 'bigCatcher' };

  function remove(st, reason) {
    st.tile.group.remove(st.group);
    list.delete(key(st.tile));
    dirty = true;
    lost(st, reason);
  }

  function refreshGhosts() {
    dirty = false;
    const tiles = isStationMode(mode)
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
      return isStationMode(mode) ? ghosts.filter((g) => g.visible) : [];
    },
    hitTargets() {
      return [...list.values()].map((s) => s.hit);
    },

    anchored() {
      for (const st of list.values()) if (st.kind === 'anchor' && st.down) return true;
      return false;
    },

    // The upgrade a station can take, if it hasn't had it yet.
    upgradeOf(st) {
      return st.level < 2 ? upgradeFor[st.kind] || null : null;
    },
    upgrade(st) {
      if (st.level >= 2 || !upgradeFor[st.kind]) return false;
      applyUpgrade(st);
      return true;
    },

    // What pressing E on this station would do, as { text, action } or a dim note.
    describe(st, inv) {
      if (st.kind === 'table') return { key: 'E', text: 'Use the crafting table', act: 'craft' };
      if (st.kind === 'anchor') return st.down
        ? { key: 'E', text: 'Raise the anchor', act: 'anchor' }
        : { key: 'E', text: 'Drop the anchor', act: 'anchor' };
      if (st.kind === 'grill') {
        const cookTime = st.level > 1 ? GRILL.ovenCook : GRILL.cook;
        if (st.cooked) return { key: 'E', text: 'Take the cooked fish', act: 'take' };
        if (st.cooking > 0) return { text: `Cooking... ${Math.round((1 - st.cooking / cookTime) * 100)}%`, dim: true };
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
      if (act === 'craft') return { craft: true };
      if (act === 'anchor') {
        st.down = !st.down;
        audio.splash(0, st.down);
        return { anchor: st.down };
      }
      if (act === 'fuel' && inv.get('wood') > 0) {
        inv.spend({ wood: 1 });
        st.fuel += st.level > 1 ? GRILL.ovenBurn : GRILL.burn;
        audio.hammer();
        return { fueled: true };
      }
      if (act === 'cook' && inv.get('fish') > 0 && st.fuel > 0 && st.cooking <= 0 && !st.cooked) {
        inv.spend({ fish: 1 });
        st.cooking = st.level > 1 ? GRILL.ovenCook : GRILL.cook;
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
      return [...list.values()].map((s) => ({ i: s.tile.i, j: s.tile.j, kind: s.kind, level: s.level, fuel: s.fuel, cooking: s.cooking, cooked: s.cooked, cups: s.cups, down: s.down }));
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
            const k = st.cooked ? 1 : 1 - st.cooking / (st.level > 1 ? GRILL.ovenCook : GRILL.cook);
            st.fish.traverse((o) => { if (o.isMesh) o.material = cookedMat(k); });
          }
        } else if (st.kind === 'catcher') {
          const cap = st.level > 1 ? CATCHER.bigCups : CATCHER.cups;
          if (st.cups < cap) {
            st.fill += dt * (st.level > 1 ? CATCHER.bigRate : 1) / (CATCHER.fillEvery[weatherKind] || 60);
            if (st.fill >= 1) { st.fill = 0; st.cups++; }
          } else {
            st.fill = 0;
          }
          st.water.position.y = DECK_Y + 0.05 + (st.cups + st.fill) / cap * 0.42;
          st.water.visible = st.cups > 0 || st.fill > 0.05;
        } else if (st.kind === 'anchor') {
          st.anchor.visible = !st.down;
          st.line.visible = st.down;
          if (st.down) {
            // rope from the drum over the side into the water
            st.line.position.set(0, DECK_Y + 0.2, 0.18);
            st.line.scale.set(1, 1.1, 1);
            st.line.rotation.x = 0.5;
          }
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

