import * as THREE from 'three';
import { TILE, DECK_Y, GRILL, CATCHER, CROPS, CROP_RAIN_BOOST, SMELT, STILL, ITEMS } from './config.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { makeFish } from './nets.js';
import { rand } from './util.js';

// Things built on a floor piece with the hammer: crafting table, firepit grill
// (upgrades to a stone oven), rain catcher (upgrades to a big one), anchor,
// planter (crops), smelter, solar still, sail and lookout tower. One per
// floor piece. They go overboard if their piece breaks.

export const TOWER_TOP = DECK_Y + 3.1;

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
    soil: new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 1 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xa4593a, roughness: 0.85 }),
    sprout: new THREE.MeshStandardMaterial({ color: 0x5c9a3a, roughness: 0.7, flatShading: true }),
    potato: new THREE.MeshStandardMaterial({ color: 0x9a7346, roughness: 0.9 }),
    melon: new THREE.MeshStandardMaterial({ color: 0x3f7a35, roughness: 0.45 }),
    bamboo: new THREE.MeshStandardMaterial({ color: 0x9bb35a, roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
    sail: new THREE.MeshStandardMaterial({ color: 0xd6ccb4, roughness: 0.9, side: THREE.DoubleSide }),
    sailPatch: new THREE.MeshStandardMaterial({ color: 0x3f74a8, roughness: 0.6, side: THREE.DoubleSide }),
    bar: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.35, metalness: 0.8 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff7a2a, emissiveIntensity: 0, roughness: 0.9 }),
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
    box: new THREE.BoxGeometry(1.2, 0.3, 0.8),
    soil: new THREE.BoxGeometry(1.1, 0.04, 0.7),
    leafy: new THREE.IcosahedronGeometry(0.12, 1),
    stem: new THREE.CylinderGeometry(0.012, 0.016, 0.3, 5).translate(0, 0.15, 0),
    tuber: new THREE.SphereGeometry(0.07, 8, 6).scale(1.3, 0.8, 1),
    melon: new THREE.SphereGeometry(0.17, 12, 8).scale(1.25, 0.9, 1),
    kiln: new THREE.CylinderGeometry(0.34, 0.42, 0.7, 12),
    chimney: new THREE.CylinderGeometry(0.09, 0.1, 0.6, 8),
    mouth: new THREE.CircleGeometry(0.13, 12),
    bar: new THREE.BoxGeometry(0.16, 0.05, 0.07),
    basin: new THREE.CylinderGeometry(0.4, 0.36, 0.14, 14, 1, true),
    basinFloor: new THREE.CircleGeometry(0.4, 14).rotateX(-Math.PI / 2),
    pane: new THREE.PlaneGeometry(0.8, 0.62),
    mast: new THREE.CylinderGeometry(0.05, 0.065, 4.4, 9).translate(0, 2.2, 0),
    boom: new THREE.CylinderGeometry(0.035, 0.035, 1.5, 7).rotateZ(Math.PI / 2),
    towerPost: new THREE.CylinderGeometry(0.05, 0.06, 1, 8).translate(0, 0.5, 0),
    deck: new THREE.BoxGeometry(1.4, 0.07, 1.4),
    rung: new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6).rotateZ(Math.PI / 2),
    rail: new THREE.CylinderGeometry(0.022, 0.022, 1.4, 6).rotateZ(Math.PI / 2),
    hitTall: new THREE.CylinderGeometry(0.75, 0.75, 3.6, 10).translate(0, DECK_Y + 1.8, 0),
    hitMast: new THREE.CylinderGeometry(0.35, 0.35, 3.6, 10).translate(0, DECK_Y + 1.8, 0),
    lash: new THREE.TorusGeometry(0.075, 0.016, 6, 12),
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

// A wooden box of soil with a crop that grows from sprout to ripe.
function buildPlanter() {
  const g = new THREE.Group();
  const box = mesh(G.box, M.plank);
  box.position.y = DECK_Y + 0.15;
  g.add(box);
  const soil = mesh(G.soil, M.soil, false);
  soil.position.y = DECK_Y + 0.29;
  g.add(soil);
  // Crops: three plants in a row; built for both kinds, shown as needed.
  const plants = [];
  for (let k = 0; k < 3; k++) {
    const pl = new THREE.Group();
    pl.position.set((k - 1) * 0.36, DECK_Y + 0.31, 0);
    const stem = mesh(G.stem, M.sprout);
    const leaves = new THREE.Group();
    for (let l = 0; l < 3; l++) {
      const lf = mesh(G.leafy, M.sprout);
      lf.position.set(Math.cos(l * 2.1) * 0.08, 0.26, Math.sin(l * 2.1) * 0.08);
      leaves.add(lf);
    }
    const tuber = mesh(G.tuber, M.potato);
    tuber.position.set(0.08, 0.02, 0.06);
    const melon = mesh(G.melon, M.melon);
    melon.position.set(0, 0.12, 0.12);
    pl.add(stem, leaves, tuber, melon);
    g.add(pl);
    plants.push({ group: pl, leaves, tuber, melon });
  }
  return { group: g, plants };
}

// A clay-and-stone kiln with a chimney; glows while burning.
function buildSmelter() {
  const g = new THREE.Group();
  const kiln = mesh(G.kiln, M.clay);
  kiln.position.y = DECK_Y + 0.35;
  g.add(kiln);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const s = mesh(G.stone, M.stone);
    s.position.set(Math.cos(a) * 0.42, DECK_Y + 0.06, Math.sin(a) * 0.42);
    s.rotation.set(rand(0, 3), rand(0, 3), 0);
    g.add(s);
  }
  const chimney = mesh(G.chimney, M.clay);
  chimney.position.set(0.1, DECK_Y + 0.95, -0.05);
  g.add(chimney);
  const mouth = mesh(G.mouth, M.glow.clone(), false);
  mouth.position.set(0, DECK_Y + 0.26, 0.37);
  g.add(mouth);
  const bar = mesh(G.bar, M.bar);
  bar.position.set(0.25, DECK_Y + 0.73, 0.1);
  bar.visible = false;
  g.add(bar);
  const glassOut = mesh(G.bar, M.glass);
  glassOut.scale.set(1, 2, 2);
  glassOut.position.set(-0.2, DECK_Y + 0.75, 0.1);
  glassOut.visible = false;
  g.add(glassOut);
  return { group: g, mouth, bar, glassOut };
}

// A shallow basin of sea water under a sloped glass roof.
function buildStill() {
  const g = new THREE.Group();
  const basin = mesh(G.basin, M.plank);
  basin.position.y = DECK_Y + 0.07;
  g.add(basin);
  const floor = mesh(G.basinFloor, M.metal, false);
  floor.position.y = DECK_Y + 0.02;
  g.add(floor);
  const water = mesh(G.disc, M.water, false);
  water.scale.setScalar(1.7);
  water.position.y = DECK_Y + 0.06;
  g.add(water);
  for (const sx of [-1, 1]) {
    const pane = mesh(G.pane, M.glass, false);
    pane.position.set(sx * 0.2, DECK_Y + 0.38, 0);
    pane.rotation.set(0, Math.PI / 2, 0);
    pane.rotateX(sx * 0.9);
    g.add(pane);
  }
  for (const z of [-0.3, 0.3]) {
    const post = mesh(G.post, M.bamboo);
    post.scale.set(0.8, 0.55, 0.8);
    post.position.set(0, DECK_Y + 0.3, z);
    g.add(post);
  }
  const jug = mesh(G.barrel, M.barrel);
  jug.scale.set(0.5, 0.6, 0.5);
  jug.position.set(0.5, DECK_Y + 0.15, 0.3);
  g.add(jug);
  return { group: g, water, jug };
}

// Mast, boom and a patched sail that fills with wind.
function buildSail() {
  const g = new THREE.Group();
  const mast = mesh(G.mast, M.bamboo);
  mast.position.y = DECK_Y;
  g.add(mast);
  const boom = mesh(G.boom, M.bamboo);
  boom.position.set(0.7, DECK_Y + 1.0, 0);
  g.add(boom);
  const W = 1.4, H = 3.1;
  const geo = new THREE.PlaneGeometry(W, H, 8, 10).translate(W / 2 + 0.05, H / 2, 0);
  const base = geo.attributes.position.array.slice();
  const cloth = mesh(geo, M.sail);
  cloth.position.y = DECK_Y + 1.05;
  g.add(cloth);
  const patch = mesh(new THREE.PlaneGeometry(0.45, 0.5).translate(0.75, 1.9, 0.012), M.sailPatch, false);
  cloth.add(patch);
  for (let k = 0; k < 3; k++) {
    const lash = mesh(G.lash, M.rope, false);
    lash.position.set(0, DECK_Y + 1.3 + k * 1.0, 0);
    lash.rotation.x = Math.PI / 2;
    g.add(lash);
  }
  return { group: g, cloth, base };
}

// Four posts, a ladder and a railed platform to stand on.
function buildTower() {
  const g = new THREE.Group();
  const H = TOWER_TOP - DECK_Y;
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) {
    const p = mesh(G.towerPost, M.log);
    p.scale.set(1, H + 1.0, 1);
    p.position.set(x, DECK_Y, z);
    g.add(p);
  }
  const deck = mesh(G.deck, M.plank);
  deck.position.y = TOWER_TOP - 0.035;
  g.add(deck);
  for (let k = 0; k < 4; k++) {
    const r = mesh(G.rail, M.bamboo);
    const a = (k / 4) * Math.PI * 2;
    r.position.set(Math.sin(a) * 0.62, TOWER_TOP + 0.85, Math.cos(a) * 0.62);
    r.rotation.y = a + Math.PI / 2;
    g.add(r);
    const r2 = r.clone();
    r2.position.y = TOWER_TOP + 0.45;
    g.add(r2);
  }
  // ladder on the +z side
  for (const x of [-0.2, 0.2]) {
    const rail = mesh(G.towerPost, M.bamboo);
    rail.scale.set(0.6, H, 0.6);
    rail.position.set(x, DECK_Y, 0.75);
    g.add(rail);
  }
  for (let y = 0.3; y < H; y += 0.35) {
    const rung = mesh(G.rung, M.bamboo);
    rung.position.set(0, DECK_Y + y, 0.75);
    g.add(rung);
  }
  // braces
  for (const z of [-0.6, 0.6]) {
    const b = mesh(G.rail, M.rope);
    b.scale.set(1, 0.6, 0.6);
    b.position.set(0, DECK_Y + 1.4, z);
    b.rotation.z = 0.9;
    g.add(b);
  }
  return { group: g };
}

const STATION_KINDS = ['grill', 'catcher', 'table', 'anchor', 'planter', 'smelter', 'still', 'sail', 'tower'];
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
  const events = {};
  // One warm light, parked at whichever fire is closest to you.
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 7, 1.8);
  raft.group.add(fireLight);

  function add(tile, kind, state) {
    if (list.has(key(tile)) || tile.broken) return null;
    const built = {
      grill: buildGrill, catcher: buildCatcher, table: buildTable, anchor: buildAnchor,
      planter: buildPlanter, smelter: buildSmelter, still: buildStill, sail: buildSail, tower: buildTower,
    }[kind]();
    tile.group.add(built.group);
    const hit = mesh(kind === 'tower' ? G.hitTall : kind === 'sail' ? G.hitMast : G.hit, M.hit, false);
    built.group.add(hit);
    const st = {
      tile, kind, ...built, hit, level: 1, fuel: 0, cooking: 0, cooked: false, cups: 0, fill: 0, flame: 0, down: false,
      crop: null, grow: 0, last: null, job: -1, work: 0, out: null,
    };
    if (state) {
      Object.assign(st, {
        fuel: state.fuel || 0, cooking: state.cooking || 0, cooked: !!state.cooked, cups: state.cups || 0, down: !!state.down,
        crop: state.crop || null, grow: state.grow || 0, last: state.last || null, job: state.job ?? -1, work: state.work || 0, out: state.out || null,
      });
    }
    if (kind === 'planter') showCrop(st);
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

  function showCrop(st) {
    const ripe = st.grow >= 1;
    const k = st.crop ? 0.25 + 0.75 * Math.min(1, st.grow) : 0;
    for (const pl of st.plants) {
      pl.group.visible = !!st.crop;
      pl.group.scale.setScalar(Math.max(0.01, k));
      pl.tuber.visible = st.crop === 'potato' && ripe;
      pl.melon.visible = st.crop === 'melon' && st.grow > 0.6;
      pl.melon.scale.setScalar(st.crop === 'melon' ? Math.min(1, (st.grow - 0.6) / 0.4 + 0.3) : 1);
    }
  }

  const seedName = (crop) => ITEMS[CROPS[crop].seed].name.toLowerCase();
  // Which seed the planter would take next: alternates when you have both.
  function nextSeed(st, inv) {
    const have = Object.keys(CROPS).filter((c) => inv.get(CROPS[c].seed) > 0);
    if (!have.length) return null;
    if (have.length > 1 && st.last) return have.find((c) => c !== st.last) || have[0];
    return have[0];
  }
  const smeltJob = (inv) => SMELT.jobs.findIndex((j) => inv.has(j.from));

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
    onRipe(fn) { events.onRipe = fn; },
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
      if (st.kind === 'sail') return { key: 'E', text: 'Take the tiller: open the map and set a course', act: 'map' };
      if (st.kind === 'tower') return { key: 'E', text: 'Climb the lookout tower', act: 'climb' };
      if (st.kind === 'planter') {
        if (st.crop && st.grow >= 1) return { key: 'E', text: `Harvest the ${ITEMS[CROPS[st.crop].food].name.toLowerCase()}`, act: 'harvest' };
        if (st.crop) return { text: `${ITEMS[CROPS[st.crop].food].name} growing: ${Math.floor(st.grow * 100)}%`, dim: true };
        const c = nextSeed(st, inv);
        return c
          ? { key: 'E', text: `Plant ${seedName(c)} (${inv.get(CROPS[c].seed)} left)`, act: 'plant' }
          : { text: 'Planter: needs seeds. Wild potatoes and watermelons on islands have them.', dim: true };
      }
      if (st.kind === 'smelter') {
        if (st.out) return { key: 'E', text: `Take the ${ITEMS[Object.keys(st.out)[0]].name.toLowerCase()}`, act: 'take' };
        if (st.job >= 0) return { text: `${SMELT.jobs[st.job].to.metalBar ? 'Smelting a metal bar' : 'Melting glass'}... ${Math.round((1 - st.work / SMELT.time) * 100)}%`, dim: true };
        const j = smeltJob(inv);
        if (st.fuel <= 0) return inv.get('wood') > 0
          ? { key: 'E', text: 'Light the smelter', cost: '1 wood', ok: true, act: 'fuel' }
          : { text: 'Light the smelter', cost: 'Need 1 wood', ok: false };
        if (j >= 0) return { key: 'E', text: SMELT.jobs[j].verb, act: 'smelt' };
        return { text: `Smelter hot (${Math.ceil(st.fuel)} s): needs 1 metal ore or 2 sand`, dim: true };
      }
      if (st.kind === 'still') {
        if (st.cups > 0) return { key: 'E', text: `Drink fresh water (${st.cups} left)`, act: 'drink' };
        return { text: `Solar still: condensing (${Math.round(st.fill * 100)}%)`, dim: true };
      }
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
      if (act === 'map') return { map: true };
      if (act === 'climb') return { climb: true };
      if (act === 'plant') {
        const c = nextSeed(st, inv);
        if (!c) return null;
        inv.spend({ [CROPS[c].seed]: 1 });
        st.crop = c; st.grow = 0; st.last = c;
        showCrop(st);
        audio.pickup();
        return { planted: c };
      }
      if (act === 'harvest' && st.crop && st.grow >= 1) {
        const c = CROPS[st.crop];
        const n = c.yield[0] + Math.floor(Math.random() * (c.yield[1] - c.yield[0] + 1));
        const seeds = c.seeds[0] + Math.floor(Math.random() * (c.seeds[1] - c.seeds[0] + 1));
        const gained = { [c.food]: n, [c.seed]: seeds };
        inv.add(gained);
        st.crop = null; st.grow = 0;
        showCrop(st);
        audio.pickup();
        return { harvested: gained };
      }
      if (st.kind === 'smelter') {
        if (act === 'fuel' && inv.get('wood') > 0) {
          inv.spend({ wood: 1 });
          st.fuel += SMELT.burn;
          audio.hammer();
          return { fueled: true };
        }
        if (act === 'smelt') {
          const j = smeltJob(inv);
          if (j < 0 || st.fuel <= 0) return null;
          inv.spend(SMELT.jobs[j].from);
          st.job = j; st.work = SMELT.time;
          audio.sizzle();
          return { smelting: j };
        }
        if (act === 'take' && st.out) {
          const gained = st.out;
          inv.add(gained);
          st.out = null;
          audio.pickup();
          return { took: gained };
        }
        return null;
      }
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
      return [...list.values()].map((s) => ({
        i: s.tile.i, j: s.tile.j, kind: s.kind, level: s.level, fuel: s.fuel, cooking: s.cooking, cooked: s.cooked, cups: s.cups, down: s.down,
        crop: s.crop, grow: s.grow, last: s.last, job: s.job, work: s.work, out: s.out,
      }));
    },
    restore(arr) {
      for (const s of arr || []) {
        const t = raft.tileAt(s.i, s.j);
        if (t && !t.broken) add(t, s.kind, s);
      }
    },

    has(kind) {
      for (const st of list.values()) if (st.kind === kind) return st;
      return null;
    },

    update(t, dt, weatherKind, playerPos, wind = 0) {
      if (dirty && mode) refreshGhosts();
      let nearest = null, nearestD = Infinity;
      const wet = weatherKind === 'rain' || weatherKind === 'storm';
      for (const st of list.values()) {
        if (st.kind === 'planter') {
          if (st.crop && st.grow < 1) {
            const before = st.grow;
            st.grow = Math.min(1, st.grow + dt * (wet ? CROP_RAIN_BOOST : 1) / CROPS[st.crop].grow);
            if (Math.floor(before * 20) !== Math.floor(st.grow * 20)) showCrop(st);
            if (st.grow >= 1 && before < 1) events.onRipe?.(st);
          }
          if (st.crop) for (const pl of st.plants) pl.leaves.rotation.z = Math.sin(t * 2 + pl.group.position.x * 3) * 0.08 * (wet ? 2 : 1);
          continue;
        }
        if (st.kind === 'smelter') {
          const burning = st.fuel > 0;
          if (burning) {
            st.fuel = Math.max(0, st.fuel - dt);
            st.flame -= dt;
            if (st.flame <= 0) {
              st.flame = 0.22;
              const wx = st.tile.i * TILE, wz = st.tile.j * TILE;
              fx.flame(tmp.set(wx + 0.1, raft.deckHeightAt(wx, wz) + 1.3, wz - 0.05));
            }
            if (st.job >= 0) {
              st.work = Math.max(0, st.work - dt);
              if (st.work === 0) {
                st.out = { ...SMELT.jobs[st.job].to };
                st.job = -1;
                audio.sizzle();
              }
            }
          }
          st.mouth.material.emissiveIntensity = burning ? 2.6 + Math.sin(t * 11) * 0.5 : 0;
          st.bar.visible = !!(st.out && st.out.metalBar);
          st.glassOut.visible = !!(st.out && st.out.glass);
          continue;
        }
        if (st.kind === 'still') {
          if (st.cups < STILL.cups) {
            st.fill += dt / STILL.every;
            if (st.fill >= 1) { st.fill = 0; st.cups++; }
          } else st.fill = 0;
          st.water.material.opacity = 0.75;
          continue;
        }
        if (st.kind === 'sail') {
          // billow: the cloth bows out more with more wind
          const arr = st.cloth.geometry.attributes.position.array;
          const bow = 0.18 + wind * 0.35;
          for (let v = 0; v < arr.length; v += 3) {
            const x = st.base[v], y = st.base[v + 1];
            const u = (x - 0.05) / 1.4, w = y / 3.1;
            arr[v + 2] = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, w * 1.1)) * bow * (1 + Math.sin(t * 2.3 + w * 3) * 0.12);
          }
          st.cloth.geometry.attributes.position.needsUpdate = true;
          st.cloth.geometry.computeVertexNormals();
          continue;
        }
        if (st.kind === 'tower' || st.kind === 'table') continue;
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

