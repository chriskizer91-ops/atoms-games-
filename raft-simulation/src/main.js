import * as THREE from 'three';
import { CURRENT_SPEED, STATS, SHARK_TIERS, ITEMS, TILE, DECK_Y, GRUDGE, CLOTHING, GEAR, STATIONS, UPGRADES, CATCHER, STILL, CROPS, ISLAND_SIZES, NEXT_PREDATOR_DELAY, DIFFICULTY, DAY, EYE } from './config.js';
import { createOcean, setShelters, waveHeight } from './ocean.js';
import { createWake } from './wake.js';
import { createSailHud } from './sailhud.js';
import { SAILING, boomAngle, sailFill, wrap } from './sailing.js';
import { toScene } from './frame.js';
import { createSky, SKY } from './sky.js';
import { createPipeline, QUALITY } from './render.js';
import { setAnisotropy } from './textures.js';
import { createRaft, startingLayout } from './raft.js';
import { createDebris } from './debris.js';
import { createShark } from './shark.js';
import { createNets } from './nets.js';
import { createBait } from './bait.js';
import { createWeather } from './weather.js';
import { createCrafting } from './crafting.js';
import { createStations, TOWER_TOP } from './stations.js';
import { createIslands } from './islands.js';
import { createRails } from './rails.js';
import { createStory } from './story.js';
import { createMap } from './map.js';
import { createPlayer } from './player.js';
import { createTools, makeHeldModels, SLOTS, BUILD_MODES } from './tools.js';
import { createView } from './view.js';
import { createLife } from './life.js';
import { createJournal, SIGHTS } from './journal.js';
import { createCompanion } from './companion.js';
import { createMusic } from './music.js';
import { FISH_KINDS } from './fishing.js';
import { ART } from './art.js';
import { materials } from './materials.js';
import { lerp } from './util.js';
import { createCastaway, CASTAWAYS } from './people/castaway.js';
import { createInput } from './input.js';
import { createHud, icon } from './hud.js';
import { createFx } from './fx.js';
import { audio } from './audio.js';
import { clamp, rand, formatTime } from './util.js';

// ---------- renderer and scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(SKY.horizon, 0.0085);
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 1500);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x1d4a5a, 0.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
scene.add(sun);

const sky = createSky(scene, renderer);
const ocean = createOcean(scene, { sky: SKY, fog: scene.fog });
const raft = createRaft(scene);
const debris = createDebris(scene);
const fx = createFx(scene);
const wake = createWake(scene);
const life = createLife(scene, { fx, audio });
const shark = createShark(scene, SHARK_TIERS);
const nets = createNets(raft, debris, fx, audio);
const bait = createBait(scene, fx, audio);
const stations = createStations(raft, fx, audio);
const rails = createRails(raft);
nets.setEdgeTaken((t, side) => rails.has(t, side));
rails.setEdgeTaken((t, side) => nets.has(t, side));
const islands = createIslands(scene, { fx, audio });
const story = createStory();
let tools = null;
const weather = createWeather({
  scene, sun, hemi, ocean, fx, audio, sky,
  onEnvironment: (env) => { if (tools) tools.vmScene.environment = env; },
});
const player = createPlayer(camera);
const view = createView(camera);
player.setRails(rails);
const input = createInput(canvas);
const hud = createHud();
const veil = document.getElementById('veil');
const journal = createJournal({ story, islands, getDay: () => weather.state.day });
// Music: on unless you've turned it off (pause menu).
const music = createMusic();
const MUSIC_KEY = 'raft-sim-music';
function setMusic(on, remember = true) {
  music.setOn(on);
  document.querySelectorAll('.music button').forEach((b) => b.classList.toggle('on', (b.dataset.m === 'on') === on));
  if (remember) { try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ } }
}
document.querySelectorAll('.music button').forEach((b) => b.addEventListener('click', () => setMusic(b.dataset.m === 'on')));
try { setMusic(localStorage.getItem(MUSIC_KEY) !== 'off', false); } catch { setMusic(true, false); }
const musicMood = { night: 0, sunset: 0, storm: 0 };
// The other survivor (made once the things they work with exist; see below).
let companion = null;
// Something seen for the first time goes in the logbook, with a word about it.
function sight(key) {
  if (journal.see(key)) hud.toast(`Logbook: ${SIGHTS[key].name.toLowerCase()} (J)`, 'gain');
}
const sailHud = createSailHud();

// ---------- game state ----------
// Goals come in groups; the next group shows once the current one is done.
const GOAL_GROUPS = [
  {
    title: 'Goals: staying afloat',
    goals: [
      { id: 'wood', text: 'Hook 5 wood out of the water', target: 5 },
      { id: 'coconut', text: 'Crack open a coconut', target: 1 },
      { id: 'repel', text: 'Drive the shark off with your spear', target: 1 },
      { id: 'repair', text: 'Fix a bitten floor with your hammer', target: 1 },
    ],
  },
  {
    title: 'Goals: growing the raft',
    goals: [
      { id: 'floor', text: 'Build a new floor piece', target: 1 },
      { id: 'net', text: 'Put up a catch net', target: 1 },
      { id: 'netHaul', text: 'Empty a net with something in it', target: 1 },
      { id: 'bait', text: 'Keep the shark busy with bait', target: 1 },
    ],
  },
  {
    title: 'Goals: settling in',
    goals: [
      { id: 'table', text: 'Build a crafting table (hammer, then Q)', target: 1 },
      { id: 'wear', text: 'Make something to wear (press C)', target: 1 },
      { id: 'cook', text: 'Cook a fish on a grill', target: 1 },
      { id: 'night', text: 'Make it through a night', target: 1 },
    ],
  },
  {
    title: 'Goals: land ho',
    goals: [
      { id: 'island', text: 'Set foot on an island', target: 1 },
      { id: 'stone', text: 'Gather stone from an island', target: 1 },
      { id: 'upgrade', text: 'Upgrade something with the hammer', target: 1 },
      { id: 'rainDrink', text: 'Drink from a rain catcher', target: 1 },
    ],
  },
  {
    title: 'Goals: putting down roots',
    goals: [
      { id: 'plant', text: 'Plant seeds in a planter', target: 1 },
      { id: 'smelt', text: 'Smelt ore or sand in a smelter', target: 1 },
      { id: 'sail', text: 'Put up a sail', target: 1 },
      { id: 'bottle', text: 'Read messages in bottles', target: 3 },
    ],
  },
  {
    title: 'Goals: a life at sea',
    goals: [
      { id: 'angler', text: 'Land a fish with a fishing rod (press C to make one)', target: 1 },
      { id: 'sleep', text: 'Sleep a night through in a hammock', target: 1 },
      { id: 'treasure', text: 'Follow a treasure map and dig up the chest', target: 1 },
      { id: 'rescue', text: 'Find whoever is keeping that fire', target: 1 },
    ],
  },
  {
    title: 'Goals: the far horizon',
    goals: [
      { id: 'chart', text: 'Chart islands on your map (M)', target: 6 },
      { id: 'tower', text: 'Climb a lookout tower', target: 1 },
      { id: 'harvest', text: 'Harvest a crop', target: 1 },
      { id: 'lamp', text: 'Light the lighthouse lamp', target: 1 },
    ],
  },
];

const HINTS = {
  hook: 'Hold left mouse to wind up, let go to throw. Hold again to reel in.',
  spear: 'Click to stab. A few good hits send the shark away.',
  fish: 'Click to eat it raw. Right-click to throw it as bait for the shark.',
  rod: 'Click to cast. Click when the float dips. Hold to reel; let go when the fish runs.',
};
const FOOD_HINTS = {
  coconut: 'Coconut: click to crack it open for food and water. R: next food.',
  cooked: 'Cooked fish: click to eat. Far more filling than raw. R: next food.',
  potato: 'Potato: click to eat. R: next food.',
  melon: 'Watermelon: click to eat. Lots of water in it. R: next food.',
};
const HAMMER_HINTS = {
  floor: 'Building floor: click an outline. Q or right-click: choose something else to build.',
  net: 'Building a catch net: click an outline on an outer edge. Q or right-click: choose something else.',
  table: 'Building a crafting table: click a floor piece. Q or right-click: choose something else.',
  grill: 'Building a grill: click a floor piece. Q or right-click: choose something else.',
  catcher: 'Building a rain catcher: click a floor piece. Q or right-click: choose something else.',
  anchor: 'Building an anchor: click a floor piece. Q or right-click: choose something else.',
  rail: 'Building a railing: click an outline on an outer edge. Q or right-click: choose something else.',
  planter: 'Building a planter: click a floor piece. Q or right-click: choose something else.',
  smelter: 'Building a smelter: click a floor piece. Q or right-click: choose something else.',
  still: 'Building a solar still: click a floor piece. Q or right-click: choose something else.',
  sail: 'Building the sail: click a floor piece (you only need one). Q or right-click: choose something else.',
  tower: 'Building a lookout tower: click a floor piece. Q or right-click: choose something else.',
};
function hintFor(id, ui) {
  if (id === 'hammer') return HAMMER_HINTS[ui.hammerMode];
  if (id === 'food') return FOOD_HINTS[ui.food];
  return HINTS[id];
}

const game = {
  mode: 'title',
  time: 0,
  alive: 0,
  stats: { health: 100, hunger: 100, thirst: 100 },
  difficulty: 'normal',
  lastHurt: -99,
  lastDamage: null,
  progress: {},
  counters: { wood: 0, repels: 0, repairs: 0, lost: 0, built: 0, baited: 0 },
  goalStage: 0,
  creak: 6,
  shake: 0,
  menu: false,
  nextPredatorIn: 0,
  lastHour: 8,
  glowT: 0,
};

const inventory = (() => {
  const items = Object.fromEntries(Object.keys(ITEMS).map((k) => [k, 0]));
  return {
    items,
    get: (k) => items[k] || 0,
    has(cost) {
      return Object.entries(cost).every(([k, n]) => (items[k] || 0) >= n);
    },
    spend(cost) {
      for (const k in cost) items[k] -= cost[k];
    },
    add(loot) {
      for (const k in loot) items[k] = (items[k] || 0) + loot[k];
    },
    set(next) {
      for (const k in items) items[k] = next?.[k] || 0;
    },
  };
})();

const crafting = createCrafting({
  inventory, stats: game.stats, audio,
  hasTable: () => stations.count('table') > 0,
  events: {
    onCraft: (id) => {
      const def = CLOTHING[id] || GEAR[id];
      hud.toast(id === 'bandage' ? 'Bandaged up: +30 health' : id === 'spyglass' ? 'Made: Spyglass. Hold Z to look through it.' : id === 'rod' ? 'Made: Fishing rod. Press 6 to take it out.' : `Made: ${def.name}`, 'gain');
      if (CLOTHING[id]) progress('wear');
      tools?.setSleeve(crafting.sleeveColor());
    },
    onWear: () => tools?.setSleeve(crafting.sleeveColor()),
    onUnlock: (names) => {
      const list = names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
      hud.toast(`New recipe${names.length > 1 ? 's' : ''}: ${list}`, 'gain');
    },
    onPickBuild: (id) => {
      closeMenu();
      tools.pickBuild(id, player);
      hud.toast(`Hammer set to build: ${STATIONS[id].name}`, 'gain');
    },
  },
});

function showGoals() {
  const g = GOAL_GROUPS[Math.min(game.goalStage, GOAL_GROUPS.length - 1)];
  hud.setGoals(g.goals, game.progress, g.title);
}

function progress(id, n = 1) {
  game.progress[id] = (game.progress[id] || 0) + n;
  const group = GOAL_GROUPS[game.goalStage];
  if (group && group.goals.every((g) => (game.progress[g.id] || 0) >= g.target)) {
    game.goalStage++;
    const next = GOAL_GROUPS[game.goalStage];
    const text = next
      ? `Goals done. Next: ${next.title.replace('Goals: ', '')}.`
      : 'All goals done. Keep the raft afloat as long as you can.';
    if (next && game.goalStage === 2) hud.toast('New: press C to craft clothing and gear', 'gain');
    setTimeout(() => { hud.alert(text, { kind: 'good', duration: 6 }); showGoals(); }, 1200);
  }
  showGoals();
}

// Stereo position and loudness of a world point relative to the camera.
const tmpV = new THREE.Vector3();
function placeSound(p) {
  tmpV.copy(p);
  camera.worldToLocal(tmpV);
  const d = tmpV.length();
  return { pan: clamp(tmpV.x / Math.max(d, 1), -1, 1) * 0.8, near: clamp(1 - d / 40, 0.15, 1) };
}

const events = {
  onCollect(gained, how) {
    const parts = Object.entries(gained)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `<span class="ti">${icon(k)}</span>+${n} ${ITEMS[k].name}`);
    parts.forEach((p) => hud.toast(p));
    if (gained.wood) {
      game.counters.wood += gained.wood;
      progress('wood', gained.wood);
    }
    if (how === 'net') progress('netHaul');
    if (how === 'island' && gained.stone) progress('stone');
    if (gained.bottle) {
      inventory.spend({ bottle: gained.bottle });
      // Every other bottle has a scrap of chart rolled up in it as well; once the
      // story is told, bottles are charts or just glass.
      const note = story.done ? null : story.readNext();
      const rec = !note || note.n % 2 === 0 ? islands.markTreasure() : null;
      const chart = rec ? treasureLines(rec) : null;
      if (note) openNote(chart ? { ...note, body: [...note.body, `<span class="aside">${chart.join(' ')}</span>`] } : note);
      else if (chart) openNote({ label: 'A treasure map', title: 'A chart on sailcloth', body: chart });
      else {
        inventory.add({ glass: 1 });
        hud.toast('The bottle was empty. Glass is glass: +1 glass', 'gain');
      }
      if (rec) hud.toast('A treasure map: the X is on your chart (M)', 'gain');
    }
  },
  onMissing(cost) {
    const parts = Object.entries(cost).map(([k, n]) => `${n} ${ITEMS[k].name.toLowerCase()}`);
    hud.toast(`Need ${parts.join(' and ')}`, 'warn');
  },
  onRaftAttack() {
    audio.warn();
    hud.alert(shark.scars ? 'The scarred shark is biting your raft!' : 'The shark is biting your raft!', {
      kind: 'danger',
      follow: () => shark.headPosition(),
      duration: 1,
      until: () => shark.state !== 'bite',
    });
  },
  onRaftBitten(tile, broke, p) {
    const s = placeSound(p);
    audio.bite(s.pan, s.near);
    game.shake = Math.max(game.shake, 0.15 * s.near);
    if (broke) {
      audio.crack(s.pan);
      game.counters.lost++;
      hud.alert('The shark tore a floor piece away. Rebuild it with the hammer.', { kind: 'danger', duration: 5 });
      // Some of the floor floats off; it can be hooked back.
      for (let i = 0; i < 2; i++) {
        const side = tile.biteSide || [0, -1];
        debris.spawn('plank', p.x + side[0] * 1.2 + rand(-0.5, 0.5), p.z + side[1] * 1.2 + rand(-0.5, 0.5), { x: side[0] * 1.2, z: side[1] * 1.2 });
      }
    }
  },
  onHunt() {
    audio.warn();
    hud.alert('The shark is coming for you. Get out of the water!', {
      kind: 'danger',
      follow: () => shark.pos,
      duration: 1,
      until: () => shark.state !== 'chase' && shark.state !== 'retreat',
    });
  },
  onPlayerBitten(dmg, pos) {
    dmg *= DIFFICULTY[game.difficulty].sharkDamage;
    game.stats.health -= dmg;
    game.lastHurt = game.time;
    game.lastDamage = 'shark';
    game.shake = 0.5;
    hud.hurt(dmg);
    audio.hurt();
    const s = placeSound(pos);
    audio.bite(s.pan, 1);
    fx.blood(pos.setY(-0.05));
  },
  onSpearHit() {
    game.shake = Math.max(game.shake, 0.08);
  },
  onRepelled(scars) {
    game.counters.repels++;
    progress('repel');
    const text = scars >= GRUDGE.maxScars
      ? 'The shark swam off. It is as scarred and angry as it gets.'
      : scars === 1
        ? 'The shark swam off with a scar. It will be back a little angrier.'
        : `The shark swam off with scar number ${scars}. Each one makes it meaner.`;
    hud.alert(text, { kind: 'good', duration: 4 });
  },
  onNetTorn(p) {
    const s = placeSound(p);
    audio.crack(s.pan);
    hud.alert('The shark tore up a net!', { kind: 'danger', duration: 3.5 });
  },
  onBaitTaken() {
    hud.alert('The shark smells the bait.', { kind: 'good', follow: () => shark.pos, duration: 1, until: () => shark.state !== 'bait' });
  },
  onBaitEaten() {
    game.counters.baited++;
    progress('bait');
    hud.alert('The shark took the bait. It will nose around there for a while.', { kind: 'good', duration: 4 });
  },
  onBuildFloor() {
    game.counters.built++;
    progress('floor');
  },
  onBuildNet() {
    progress('net');
  },
  onBuildStation(kind) {
    hud.toast(`Built: ${STATIONS[kind].name}`, 'gain');
    if (kind === 'sail') {
      progress('sail');
      hud.alert('Sail built. Press E at it to take the steering oar: W raises the sail, A and D steer. Or press M and click an island to be sailed there.', { kind: 'good', duration: 9 });
    }
    if (kind === 'tower') hud.toast('Press E at the tower to climb up and look out', 'gain');
    if (kind === 'table') {
      progress('table');
      hud.toast('Press E at the crafting table for the bigger recipes', 'gain');
    }
  },
  onUpgrade(id) {
    hud.toast(`Upgraded: ${UPGRADES[id].name}`, 'gain');
    progress('upgrade');
  },
  onOpenBuild() {
    openMenu('build', false, tools.hammerMode);
  },
  onStationUse(station, act, r) {
    if (r.craft) openMenu('craft', true);
    if (r.map) openMap();
    if (r.helm) takeHelm(station);
    if (r.sleep) startSleep(station);
    if (r.climb) {
      player.climbTower({ x: station.tile.i * TILE, z: station.tile.j * TILE, h: TOWER_TOP - DECK_Y, tile: station.tile });
      audio.climb?.();
      progress('tower');
      hud.toast('From up here you can spot islands much further off. Check the map (M).', 'gain');
    }
    if (r.anchor !== undefined) hud.toast(r.anchor ? 'Anchor down: the raft stays put' : 'Anchor up', 'gain');
    if (r.drank) {
      const still = station.kind === 'still';
      game.stats.thirst = Math.min(100, game.stats.thirst + (still ? STILL.drink : CATCHER.drink));
      hud.toast(still ? 'Fresh water from the still' : 'Fresh rain water', 'gain');
      if (!still) progress('rainDrink');
    }
    if (r.took === true) {
      hud.toast(`<span class="ti">${icon('cooked')}</span>+1 Cooked fish`, 'gain');
      progress('cook');
    } else if (r.took) {
      events.onCollect(r.took, 'smelter');
      progress('smelt');
    }
    if (r.smelting !== undefined) hud.toast('Smelting...', 'gain');
    if (r.fueled) hud.toast(station.kind === 'smelter' ? 'The smelter is heating up' : 'The fire is going', 'gain');
    if (r.planted) {
      progress('plant');
      hud.toast(`Planted ${CROPS[r.planted].name.toLowerCase()}. Rain makes it grow faster.`, 'gain');
    }
    if (r.harvested) {
      events.onCollect(r.harvested, 'planter');
      progress('harvest');
    }
  },
  onWake() { wakeUp(false); },
  onClimbDown() {
    player.climbTower(null);
    audio.climb?.();
  },
  onRailCatch() {
    hud.toast('The railing caught you', 'gain');
  },
  onToothLost(tile, side) {
    const x = tile.i * TILE + side[0] * (TILE / 2 - 0.25) + rand(-0.4, 0.4) * Math.abs(side[1]);
    const z = tile.j * TILE + side[1] * (TILE / 2 - 0.25) + rand(-0.4, 0.4) * Math.abs(side[0]);
    debris.stick('tooth', x, z, tile, raft);
    hud.toast('A tooth broke off in your floor. Grab it with E', 'gain');
  },
  onHideTorn(p) {
    debris.spawn('hide', p.x + rand(-0.4, 0.4), p.z + rand(-0.4, 0.4), { x: rand(-0.4, 0.4), z: rand(-0.4, 0.4) });
  },
  onLeaving(p, tier) {
    hud.alert(`The ${tier.name.toLowerCase()} has had enough of you. It's leaving for good, and it lost its jaw in the fight.`, { kind: 'good', duration: 6 });
    debris.spawn('jaw', p.x, p.z, { x: 0, z: 0 });
  },
  onGone() {
    game.nextPredatorIn = NEXT_PREDATOR_DELAY;
  },
  onCharge() {
    audio.warn();
    hud.alert(`The ${shark.tier.name.toLowerCase()} is charging the raft!`, {
      kind: 'danger', follow: () => shark.pos, duration: 1,
      until: () => shark.state !== 'approach',
    });
  },
  onRam(p, side, range, broke) {
    const s = placeSound(p);
    audio.crack(s.pan);
    audio.bite(s.pan, 1);
    game.shake = Math.max(game.shake, 0.6 * s.near + 0.2);
    const ps = player.state;
    if (!ps.inWater && Math.hypot(ps.pos.x - p.x, ps.pos.z - p.z) < range) {
      // The raft jerks away under you: you stumble toward the side that was hit.
      player.knock(side[0] * 0.9 + rand(-0.25, 0.25), side[1] * 0.9 + rand(-0.25, 0.25));
      hud.alert('The hit threw you off your feet!', { kind: 'danger', duration: 2.5 });
    }
    if (broke) game.counters.lost++;
  },
  onRepair() {
    game.counters.repairs++;
    progress('repair');
  },
  onRebuild() {
    game.counters.repairs++;
    progress('repair');
  },
  onEat(id) {
    if (id === 'fish') {
      hud.toast('Raw fish: filling, if not tasty', 'gain');
      return;
    }
    progress('coconut');
    hud.toast('Coconut: food and water', 'gain');
  },
  onFishing(ev, kind, kg) {
    if (ev === 'bite') audio.pickup();
    else if (ev === 'missed') hud.toast('Too slow: it took the bait and went', 'warn');
    else if (ev === 'snapped') { audio.crack(0); hud.toast('The line snapped. Ease off when the fish runs.', 'warn'); }
    else if (ev === 'nowater') hud.toast('Cast toward open water', 'warn');
    else if (ev === 'caught') {
      const f = FISH_KINDS[kind], r = journal.catchFish(kind, kg);
      hud.toast(`<span class="ti">${icon('fish')}</span>${f.name}, ${kg.toFixed(1)} kg: +${f.meat} raw fish${r.best && !r.first ? ' (your biggest yet)' : ''}`, 'gain');
      if (kg > 4) companion.say('fish', 0.7);
      if (r.first) music.sting('find');
      if (r.first) hud.alert(`A new fish for the logbook: ${f.name.toLowerCase()}. ${f.fact}`, { kind: 'good', duration: 9 });
      progress('angler');
    }
  },
  onEnterWater(p) {
    fx.splash(p.setY(0.1), 1.6);
    audio.splash(0, true);
  },
  onClimb() {
    audio.splash(0, false);
  },
};

tools = createTools({ scene, camera, raft, nets, rails, stations, islands, crafting, bait, debris, shark, fx, audio, inventory, stats: game.stats, events });

const islandName = (rec) => (rec.kind === 'lighthouse' ? 'the lighthouse island' : `a ${ISLAND_SIZES[rec.size].label.toLowerCase()} island`);
const chartPoint = (rec) => { const p = toScene(rec.x, rec.z); return tmpV.set(p.x, 2, p.z); };
islands.on({
  onSighted(rec, spy) {
    progress('chart');
    music.sting('find');
    companion.say(rec.kind === 'lighthouse' ? 'lighthouse' : 'land', 0.6);
    hud.alert(`${spy ? 'Through the spyglass, far off' : 'Land on the horizon'}: ${islandName(rec)}. It's on your map (M).`, {
      kind: 'good', duration: 6, follow: () => chartPoint(rec),
    });
  },
  onArrive(rec) {
    const sec = 240;
    hud.alert(`You're alongside ${islandName(rec)}. The raft rests here ${Math.round(sec / 60)} minutes unless you drop an anchor.`, { kind: 'good', duration: 6 });
  },
  onLeavingSoon() {
    hud.alert('The current is picking up: the raft moves on in 30 seconds.', { kind: 'danger', duration: 4 });
  },
  onWaiting() {
    hud.alert('The raft will drift on once you are back aboard.', { kind: 'good', duration: 4 });
  },
  onDepart() {
    hud.alert('The raft is drifting away from the island.', { kind: 'good', duration: 3 });
  },
  onSmoke(rec) {
    sight('smoke');
    hud.alert('Smoke on the horizon. Someone is keeping a fire. It\'s on your map (M).', { kind: 'good', duration: 9, follow: () => chartPoint(rec) });
  },
  onSurvivor() {
    companion.join();
    music.sting('prize');
    progress('rescue');
    audio.pickup();
    openNote({
      label: 'A castaway', title: companion.name,
      body: [...companion.meetLines, `<span class="aside">${companion.name} has joined you, and will pull things out of the water, patch bitten floor and help drive the shark off.</span>`],
    });
  },
  onTreasure(rec) { openChest(rec); },
  onLamp() {
    if (story.light()) {
      progress('lamp');
      audio.horn?.();
      setTimeout(() => openEnding(), 1500);
    }
  },
});
stations.onRipe((st) => hud.toast(`${ITEMS[CROPS[st.crop].food].name} ready to harvest in a planter`, 'gain'));
rails.onBuiltOver(() => {
  inventory.add(STATIONS.rail.cost);
  hud.toast('Took a railing down to build there and kept its materials', 'gain');
});
companion = createCompanion(scene, {
  raft, stations, debris, shark, islands, inventory, fx, audio,
  makeHeld: makeHeldModels, sharkEvents: () => events,
});
const companionCtx = { player: null, daylight: 1, live: false };
const lootText = (loot) => Object.entries(loot).map(([k, n]) => `+${n} ${ITEMS[k].name.toLowerCase()}`).join(', ');
companion.on({
  onSay(name, text) { hud.toast(`<b>${name}:</b> “${text}”`, 'say'); },
  onHaul(name, loot) {
    hud.toast(`${name} hauled in: ${lootText(loot)}`, 'gain');
    if (loot.wood) { game.counters.wood += loot.wood; progress('wood', loot.wood); }
  },
});
const map = createMap({
  islands, audio,
  hasSail: () => !!stations.has('sail'),
  windFrom: () => weather.wind.from,
  onCourse: () => hud.toast('Course set. The raft will sail itself there, tacking if the wind is against it.', 'gain'),
});

stations.onLost((st) => hud.toast(`The ${STATIONS[st.kind].name.toLowerCase()} went overboard with its floor piece`, 'warn'));

nets.onLost((net, reason) => {
  if (reason === 'built-over') {
    inventory.add(STATIONS.net.cost);
    hud.toast('Took the net down to build there and kept its materials', 'gain');
  } else if (reason === 'tile-broke') {
    hud.toast('A net went down with its floor piece', 'warn');
  }
});
bait.onReturn(() => {
  inventory.add({ fish: 1 });
  hud.toast('Bait needs to land in the water', 'warn');
});

const pipeline = createPipeline({ renderer, scene, camera, vmScene: tools.vmScene, vmCamera: tools.vmCamera, ocean, sun, sky: SKY, aboveWaterOnly: [sky.mesh, fx.sprites, weather.mesh, wake.mesh] });
sky.follow(tools.vmScene);
sky.capture(0);
tools.vmScene.environment = sky.environment;
setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

// ---------- first or third person ----------
const VIEW_KEY = 'raft-sim-view';
try { view.set(localStorage.getItem(VIEW_KEY) === 'third'); } catch { /* storage blocked */ }

// ---------- who you are ----------
// The body seen in third person (and on the title screen) is one of the fair
// folk from Moon Faire. Your own arms take its skin colour.
const BODY_KEY = 'raft-sim-body';
const SLEEVES = { 'castaway-man-A': '#d9ccab', 'castaway-man-B': '#e8e1cc', 'castaway-woman-A': '#3e6d73', 'castaway-woman-B': '#c9705a' };
let bodyId = null;
async function applyBody(id, remember = true) {
  if (!CASTAWAYS.includes(id)) id = CASTAWAYS[0];
  const who = id.slice(0, -2), outfit = id.slice(-1);
  document.querySelectorAll('.castaway button').forEach((b) => b.classList.toggle('on', b.dataset.b === who));
  document.querySelectorAll('.outfit button').forEach((b) => b.classList.toggle('on', b.dataset.o === outfit));
  if (remember) {
    try { localStorage.setItem(BODY_KEY, id); } catch { /* storage blocked */ }
  }
  if (id === bodyId) return;
  bodyId = id;
  const old = view.state.body;
  const body = await createCastaway({ id });
  if (bodyId !== id) { body.dispose(); return; }   // another was picked meanwhile
  scene.add(body.root);
  view.setBody(body, makeHeldModels());
  companion.setBody(id);
  // Your own arms match: the skin (warmed a little for the sun) and the outfit's sleeves.
  tools.setSkin(new THREE.Color(body.skin).lerp(new THREE.Color(0xb07452), 0.35));
  tools.setSleeveBase(SLEEVES[id] || '#a89878');
  if (old) { scene.remove(old.root); old.dispose(); }
}
const pickBody = (who, outfit) => applyBody(`${who || (bodyId || CASTAWAYS[0]).slice(0, -2)}-${outfit || (bodyId || CASTAWAYS[0]).slice(-1)}`);
document.querySelectorAll('.castaway button').forEach((b) => b.addEventListener('click', () => pickBody(b.dataset.b, null)));
document.querySelectorAll('.outfit button').forEach((b) => b.addEventListener('click', () => pickBody(null, b.dataset.o)));
try { applyBody(localStorage.getItem(BODY_KEY) || CASTAWAYS[0], false); } catch { applyBody(CASTAWAYS[0], false); }
// The notes found in bottles are written on a page from a ship's log.
document.querySelector('.note-paper').style.backgroundImage = `url(${ART.note})`;

// ---------- difficulty ----------
const DIFF_KEY = 'raft-sim-difficulty';
function applyDifficulty(name, remember = true) {
  game.difficulty = DIFFICULTY[name] ? name : 'normal';
  document.querySelectorAll('.difficulty button').forEach((b) => b.classList.toggle('on', b.dataset.d === game.difficulty));
  if (remember) {
    try { localStorage.setItem(DIFF_KEY, game.difficulty); } catch { /* storage blocked */ }
  }
}
document.querySelectorAll('.difficulty button').forEach((b) => b.addEventListener('click', () => applyDifficulty(b.dataset.d)));
try { applyDifficulty(localStorage.getItem(DIFF_KEY) || 'normal', false); } catch { applyDifficulty('normal', false); }

// ---------- graphics quality ----------
const QUALITY_KEY = 'raft-sim-quality';
function loadQuality() {
  try { return localStorage.getItem(QUALITY_KEY) || 'medium'; } catch { return 'medium'; }
}
function applyQuality(name, remember = true) {
  pipeline.setQuality(name);
  resize();
  document.querySelectorAll('.quality button').forEach((b) => b.classList.toggle('on', b.dataset.q === pipeline.quality));
  if (remember) {
    try { localStorage.setItem(QUALITY_KEY, pipeline.quality); } catch { /* storage blocked */ }
  }
}
// A level you pick yourself is yours: the watch still trims sharpness, but won't change the level.
document.querySelectorAll('.quality button').forEach((b) => b.addEventListener('click', () => { applyQuality(b.dataset.q); perf.dropped = true; }));
// Keep it smooth: watch the real frame rate all the time. When frames run
// slow for a couple of seconds, trim the sharpness a step; when there has
// been headroom for a good while, give it back. If trimming isn't enough in
// the first seconds of a game, drop a whole graphics level (once) and say so.
const perf = { t: 0, n: 0, slowFor: 0, fastFor: 0, hold: 3, dropped: false, last: 0, fps: 60 };
function watchPerf(now) {
  const raw = (now - perf.last) / 1000;
  perf.last = now;
  if (!(raw > 0) || raw > 0.25) return;   // a stall or a hidden tab says nothing about the graphics
  perf.t += raw;
  perf.n++;
  if (perf.t < 1) return;
  const avg = perf.t / perf.n;
  perf.fps = 1 / avg;
  perf.t = 0;
  perf.n = 0;
  if (perf.hold > 0) { perf.hold--; return; }
  if (avg > 1 / 48) { perf.slowFor++; perf.fastFor = 0; } else if (avg < 1 / 57) { perf.fastFor++; perf.slowFor = 0; } else { perf.slowFor = 0; perf.fastFor = 0; }
  if (perf.slowFor >= 2) {
    perf.slowFor = 0;
    perf.hold = 2;
    if (pipeline.scale > 0.71) {
      pipeline.setScale(pipeline.scale - (avg > 1 / 30 ? 0.2 : 0.1));
      resize();
    } else if (!perf.dropped) {
      perf.dropped = true;
      const order = ['high', 'medium', 'low'];
      const i = order.indexOf(pipeline.quality);
      if (i < order.length - 1) {
        applyQuality(order[i + 1]);
        hud.toast(`Graphics set to ${QUALITY[pipeline.quality].label} to keep it smooth. Change it in the pause menu.`, 'warn');
      }
    }
  } else if (perf.fastFor >= 12 && pipeline.scale < 1) {
    // Only give sharpness back slowly, so it never hunts up and down.
    perf.fastFor = 0;
    perf.hold = 2;
    pipeline.setScale(pipeline.scale + 0.05);
    resize();
  }
}

// ---------- setup / reset / save state ----------
function newGame() {
  raft.reset(startingLayout());
  debris.reset(0, 0);
  bait.clear();
  shark.reset();
  weather.reset();
  crafting.reset();
  islands.reset();
  story.reset();
  journal.reset();
  companion.reset();
  player.reset();
  tools.reset();
  tools.setSleeve(null);
  inventory.set({ coconut: 1 });
  Object.assign(game.stats, { health: 100, hunger: 100, thirst: 100 });
  game.landed = false;
  game.helm = null;
  game.sleep = null;
  player.state.asleep = false;
  veil.classList.remove('on');
  game.sailTip = {};
  life.reset();
  wake.reset();
  debris.setFlow(CURRENT_SPEED);
  game.nextPredatorIn = 0;
  game.lastHour = 8;
  game.menu = false;
  game.time = 0;
  game.alive = 0;
  game.lastHurt = -99;
  game.lastDamage = null;
  game.progress = {};
  game.counters = { wood: 0, repels: 0, repairs: 0, lost: 0, built: 0, baited: 0 };
  game.goalStage = 0;
  showGoals();
  hud.clearAlert();
}

function serialize() {
  return {
    v: 1,
    alive: game.alive,
    time: game.time,
    stats: { ...game.stats },
    progress: { ...game.progress },
    counters: { ...game.counters },
    goalStage: game.goalStage,
    inventory: { ...inventory.items },
    raft: raft.serialize(),
    nets: nets.serialize(),
    stations: stations.serialize(),
    weather: weather.serialize(),
    crafting: crafting.serialize(),
    islands: islands.serialize(),
    rails: rails.serialize(),
    story: story.serialize(),
    journal: journal.serialize(),
    companion: companion.serialize(),
    food: tools.food,
    difficulty: game.difficulty,
    nextPredatorIn: game.nextPredatorIn,
    player: player.serialize(),
    shark: shark.serialize(),
  };
}

function restore(d) {
  if (!d || d.v !== 1) return false;
  newGame();
  raft.reset(d.raft);
  nets.restore(d.nets);
  stations.restore(d.stations);
  weather.restore(d.weather);
  crafting.restore(d.crafting);
  islands.restore(d.islands);
  rails.restore(d.rails);
  story.restore(d.story);
  journal.restore(d.journal);
  companion.restore(d.companion);
  if (d.food) tools.setFood(d.food);
  if (d.difficulty) applyDifficulty(d.difficulty, false);
  game.nextPredatorIn = d.nextPredatorIn || 0;
  inventory.set(d.inventory);
  Object.assign(game.stats, d.stats);
  game.alive = d.alive;
  game.time = d.time;
  game.progress = d.progress || {};
  game.counters = d.counters || game.counters;
  game.goalStage = d.goalStage || 0;
  player.restore(d.player);
  shark.restore(d.shark);
  tools.setSleeve(crafting.sleeveColor());
  showGoals();
  return true;
}

// ---------- screens ----------
const screens = {
  title: document.getElementById('title'),
  pause: document.getElementById('pause'),
  dead: document.getElementById('dead'),
  ending: document.getElementById('ending'),
};
function showScreen(name) {
  for (const k in screens) screens[k].hidden = k !== name;
  hud.show(name === null || name === 'pause');
  document.body.classList.toggle('playing', name === null);
}

async function enterPlay() {
  audio.unlock();
  game.mode = 'play';
  input.state.enabled = true;
  showScreen(null);
  await input.lock();
}

function pause() {
  if (game.mode !== 'play') return;
  saveGame();
  game.mode = 'paused';
  input.state.enabled = false;
  input.state.mouse = [false, false, false];
  showScreen('pause');
}

function die() {
  clearSave();
  game.mode = 'dead';
  input.state.enabled = false;
  input.unlock();
  const reason = {
    shark: 'The shark got you while you were in the water.',
    thirst: 'You ran out of water. Coconuts help, and later you will be able to make fresh water.',
    hunger: 'You starved. Keep coconuts on hand.',
  }[game.lastDamage] || 'The sea won this time.';
  document.getElementById('dead-reason').textContent = reason;
  document.getElementById('dead-stats').innerHTML = [
    ['Time afloat', formatTime(game.alive)],
    ['Days', weather.state.day],
    ['Wood hooked', game.counters.wood],
    ['Times you drove the shark off', game.counters.repels],
    ['Repairs', game.counters.repairs],
    ['Floor pieces lost', game.counters.lost],
    ['Floor pieces built', game.counters.built],
    ['Times the shark took bait', game.counters.baited],
    ['Scars you left on the shark', shark.scars],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  showScreen('dead');
}

// ---------- saving ----------
// One save slot in this browser. Autosaves while you play; a death clears it.
const SAVE_KEY = 'raft-sim-save';
function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveGame() {
  if (game.mode !== 'play' && game.mode !== 'paused') return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialize()));
    game.saveT = 0;
    return true;
  } catch { return false; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* storage blocked */ }
}
// Title screen: Continue when there is a save; starting fresh asks twice.
let confirmNew = false;
function refreshTitle() {
  const save = readSave();
  const cont = document.getElementById('continue');
  const play = document.getElementById('play');
  confirmNew = false;
  cont.hidden = !save;
  play.textContent = save ? 'New raft' : 'Set out';
  play.classList.toggle('ghost', !!save);
  document.getElementById('save-note').textContent = save
    ? `Saved raft: day ${save.weather?.day ?? 1}, ${formatTime(save.alive || 0)} afloat. Made for laptops: keyboard with a mouse or touchpad.`
    : 'Made for laptops: keyboard with a mouse or touchpad.';
}
window.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', () => saveGame());

document.getElementById('continue').addEventListener('click', () => {
  const save = readSave();
  if (save && restore(save)) enterPlay();
});
document.getElementById('play').addEventListener('click', () => {
  if (readSave() && !confirmNew) {
    confirmNew = true;
    document.getElementById('play').textContent = 'Replace the saved raft?';
    return;
  }
  clearSave();
  newGame();
  enterPlay();
});
document.getElementById('resume').addEventListener('click', () => enterPlay());
document.getElementById('restart').addEventListener('click', () => {
  newGame();
  enterPlay();
});
document.getElementById('quit').addEventListener('click', () => {
  saveGame();
  game.mode = 'title';
  showScreen('title');
  refreshTitle();
});
// Crafting panel, map and notes: the world keeps going while they're open.
function holdInput(kind) {
  if (game.mode !== 'play' || game.menu) return false;
  game.menu = kind;
  input.clear();
  input.state.enabled = false;
  document.body.classList.remove('playing');
  // We let go of the mouse ourselves: the browser's notice about it, however
  // late it comes, isn't the player pressing Esc.
  game.expectUnlock = input.state.locked;
  input.unlock();
  return true;
}
function openMenu(tab = 'craft', bench = false, pick = null) {
  if (holdInput('craft')) crafting.open(tab, bench, pick);
}
function openMap() {
  if (holdInput('map')) map.open();
}
function openJournal() {
  if (holdInput('journal')) journal.open();
}
const noteEl = { root: document.getElementById('note'), count: document.getElementById('note-count'), title: document.getElementById('note-title'), body: document.getElementById('note-body') };
function openNote(note) {
  if (!note) return;
  if (note.n) progress('bottle');
  if (note.reveal) {
    const lh = islands.lighthouse();
    if (lh) islands.reveal(lh.id);
  }
  audio.paper?.();
  const show = () => {
    noteEl.count.textContent = note.label || `Message ${note.n} of ${note.of}`;
    noteEl.title.textContent = note.title;
    noteEl.body.innerHTML = note.body.map((p) => `<p>${p}</p>`).join('');
    noteEl.root.hidden = false;
  };
  if (holdInput('note')) show();
  else game.pendingNote = show;
}
function openEnding() {
  if (game.menu) closeMenu(false);
  game.mode = 'ended';
  input.state.enabled = false;
  input.unlock();
  const charted = [...islands.state.chart.values()].filter((r) => r.seen).length;
  document.getElementById('ending-stats').innerHTML = [
    ['Days at sea', weather.state.day],
    ['Time afloat', formatTime(game.alive)],
    ['Islands charted', charted],
    ['Messages found', `${story.read} of 8`],
    ['Floor pieces built', game.counters.built],
    ['Times you drove a shark off', game.counters.repels],
    ['Kinds of fish landed', `${Object.keys(journal.state.fish).length} of ${Object.keys(FISH_KINDS).length}`],
    ['Chests dug up', journal.state.treasure],
    ['Going home with you', companion.joined ? companion.name : 'no one'],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  showScreen('ending');
}
document.getElementById('ending-keep').addEventListener('click', () => {
  hud.toast('The ship can wait. The sea is yours as long as you like.', 'gain');
  enterPlay();
});
document.getElementById('ending-title').addEventListener('click', () => {
  game.mode = 'play';
  saveGame();
  game.mode = 'title';
  showScreen('title');
  refreshTitle();
});
function closeMenu(relock = true) {
  if (!game.menu) return;
  const kind = game.menu;
  game.menu = false;
  game.menuClosedAt = performance.now();
  if (kind === 'craft') crafting.close();
  if (kind === 'map') map.close();
  if (kind === 'journal') journal.close();
  if (kind === 'note') noteEl.root.hidden = true;
  if (relock) {
    input.state.enabled = true;
    document.body.classList.add('playing');
    input.lock();
  }
}
document.getElementById('craft-close').addEventListener('click', () => closeMenu());
document.getElementById('map-close').addEventListener('click', () => closeMenu());
document.getElementById('journal-close').addEventListener('click', () => closeMenu());
document.getElementById('note-close').addEventListener('click', () => closeMenu());

input.onLockChange((locked) => {
  if (!locked && game.expectUnlock) {
    game.expectUnlock = false;
    return;
  }
  if (locked) game.expectUnlock = false;
  // The unlock from opening a menu can arrive after a quick close; ignore it.
  const justClosed = performance.now() - (game.menuClosedAt || 0) < 400;
  if (!locked && game.mode === 'play' && !input.state.freeLook && !game.menu && !justClosed) pause();
});
window.addEventListener('keydown', (e) => {
  if (game.mode !== 'play') return;
  if (game.menu === 'note' && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    closeMenu();
    return;
  }
  if (e.code === 'KeyV' && !game.menu) {
    const third = view.toggle();
    try { localStorage.setItem(VIEW_KEY, third ? 'third' : 'first'); } catch { /* storage blocked */ }
    hud.toast(third ? 'Looking from behind. V: back to your own eyes.' : 'Through your own eyes. V: look from behind.', 'gain');
    return;
  }
  if (e.code === 'KeyM') {
    e.preventDefault();
    if (game.menu === 'map') closeMenu();
    else if (!game.menu) openMap();
    return;
  }
  if (e.code === 'KeyH' && !game.menu) {
    const off = document.body.classList.toggle('nohud');
    if (!off) hud.toast('H: hide everything on screen, for a clear view', 'gain');
    return;
  }
  if (e.code === 'KeyJ') {
    e.preventDefault();
    if (game.menu === 'journal') closeMenu();
    else if (!game.menu) openJournal();
    return;
  }
  if (e.code === 'KeyC' || e.code === 'Tab' || (e.code === 'KeyQ' && game.menu)) {
    e.preventDefault();
    if (game.menu) closeMenu();
    else openMenu();
    return;
  }
  if (e.code === 'Escape' && game.menu) {
    closeMenu(false);
    pause();
    return;
  }
  if (e.code === 'KeyP' || (e.code === 'Escape' && input.state.freeLook)) pause();
});
// If pointer lock dropped without a pause (free-look mode), a click re-captures.
canvas.addEventListener('click', () => {
  if (game.mode === 'play' && !input.state.locked && !input.state.freeLook) input.lock();
});

document.addEventListener('click', (e) => { if (e.target.closest('button')) audio.click(); });

// ---------- sailing ----------
// At the steering oar the movement keys go to the raft: A and D steer, W and
// S raise and lower the sail a notch. E, Space or walking off lets go; the oar
// stays lashed where you left it, so the raft holds its line.
function takeHelm(station) {
  if (game.helm) { leaveHelm(); return; }
  game.helm = station;
  player.state.helm = true;
  audio.pickup();
  const b = islands.boat;
  if (stations.anchored()) hud.toast('The anchor is down. Raise it before you set sail.', 'warn');
  else if (b.sailSet === 0) hud.toast('At the oar. W raises the sail.', 'gain');
}
function leaveHelm(note) {
  if (!game.helm) return;
  game.helm = null;
  player.state.helm = false;
  if (note) hud.toast(note, 'gain');
}
// ---------- treasure ----------
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function treasureLines(rec) {
  const st = islands.state;
  const dx = rec.x - st.rw.x, dz = rec.z - st.rw.z;
  const way = COMPASS[((Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) % 8) + 8) % 8];
  const d = Math.round(Math.hypot(dx, dz) / 50) * 50;
  return [
    'Rolled up in the bottle is a square of sailcloth with a chart inked on it: one island, and an X.',
    `It lies to the ${way}, about ${d} metres off. You've copied the X onto your own chart (M).`,
  ];
}
// What a chest holds: the first few have something you can't make; all of them have coin and good materials.
function openChest(rec) {
  const n = journal.state.treasure;
  const loot = { scrap: 3 + Math.floor(Math.random() * 3), rope: 2, glass: 1 + Math.floor(Math.random() * 2) };
  if (n >= 1) loot.metalBar = 1 + Math.floor(Math.random() * 2);
  const coins = 20 + Math.floor(Math.random() * 41);
  const body = ['Under a foot of sand the spade hits wood: a sea chest, iron-banded, the lock rusted through.'];
  let prize = null;
  if (!crafting.hasGear('spyglass')) {
    crafting.grant('spyglass');
    prize = 'a brass spyglass';
    body.push('Inside, wrapped in oilcloth: <b>a brass spyglass</b>. Hold Z to look through it. Land you find in it goes on your chart from far further off.');
  } else if (!crafting.hasGear('lure')) {
    crafting.grant('lure');
    prize = 'a lucky lure';
    body.push('Inside, in a tin: <b>a lure of mother-of-pearl</b>, worn smooth by somebody\'s thumb. With it on your line, fish bite far sooner.');
  } else if (!journal.state.seaChart) {
    journal.state.seaChart = true;
    prize = 'an old sea chart';
    let k = 0;
    for (const r of islands.state.chart.values()) {
      if (!r.seen && r.kind !== 'lighthouse' && Math.hypot(r.x - islands.state.rw.x, r.z - islands.state.rw.z) < 2600) { r.seen = true; k++; }
    }
    body.push(`Inside, in a tube: <b>an old sea chart</b> of these waters. ${k} island${k === 1 ? '' : 's'} you had never seen ${k === 1 ? 'is' : 'are'} on your map now.`);
  }
  const parts = Object.entries(loot).map(([k, v]) => `${v} ${ITEMS[k].name.toLowerCase()}`);
  body.push(`${prize ? 'And under it' : 'Inside'}: ${coins} gold coins, and ${parts.join(', ')}.`);
  inventory.add(loot);
  journal.foundTreasure(prize, coins);
  music.sting('prize');
  progress('treasure');
  audio.pickup();
  companion.say('treasure');
  openNote({ label: `Chest ${n + 1}`, title: 'Buried treasure', body });
}

// ---------- sleeping ----------
// In a hammock after dark: you lie back, and the night goes by overhead at
// about an hour a second until the sun comes up.
const SLEEP_RATE = 22;
function startSleep(station) {
  if (game.sleep) return;
  if (game.helm) leaveHelm();
  const ps = player.state;
  game.sleep = { t: 0, x: station.tile.i * TILE, z: station.tile.j * TILE, lie: 0, third: view.third, waking: false, hours: 0, hour0: weather.state.hour };
  ps.asleep = true;
  view.set(false);
  veil.classList.add('on');
  audio.paper?.();
}
function wakeUp(dawn) {
  const sl = game.sleep;
  if (!sl || sl.waking) return;
  sl.waking = true;
  player.state.asleep = false;
  veil.classList.remove('on');
  view.set(sl.third);
  shark.holdOff(40);
  const s = game.stats;
  const k = clamp(sl.hours / 8, 0, 1);
  s.hunger = Math.max(8, s.hunger - 16 * k);
  s.thirst = Math.max(8, s.thirst - 20 * k);
  s.health = Math.min(100, s.health + 40 * k);
  if (dawn) { hud.toast('You slept until dawn: rested, hungry and thirsty.', 'gain'); progress('sleep'); }
  else hud.toast(sl.hours > 0.5 ? `You slept ${Math.round(sl.hours)} hour${Math.round(sl.hours) === 1 ? '' : 's'}.` : 'Awake again.', 'gain');
}
// How fast the clock runs this frame (1, or much faster asleep).
function sleepRate() {
  const sl = game.sleep;
  return sl && !sl.waking && sl.t > 0.9 ? SLEEP_RATE : 1;
}
function updateSleep(dt, wx) {
  const sl = game.sleep;
  if (!sl) return;
  const ps = player.state;
  sl.t += dt;
  if (!sl.waking) {
    if (sl.t > 0.9) {
      if (!sl.open) { sl.open = true; veil.classList.remove('on'); ps.yaw = Math.PI / 2; ps.pitch = 0.95; }
      sl.hours += (dt * SLEEP_RATE) / DAY.hourNight;
      shark.holdOff(30);
      if (wx.hour >= 6 && wx.hour < 19) wakeUp(true);
    }
    ps.pos.x = sl.x; ps.pos.z = sl.z;
    ps.vel?.set?.(0, 0, 0);
  }
  sl.lie = lerp(sl.lie, sl.waking ? 0 : 1, 1 - Math.exp(-dt * (sl.waking ? 4 : 2.5)));
  camera.position.y -= sl.lie * (EYE - 0.9);
  camera.updateMatrixWorld();
  if (sl.waking && sl.lie < 0.02) game.sleep = null;
}

function sailTip(id, text, kind = 'good', every = 45) {
  const last = game.sailTip[id];
  if (last !== undefined && game.time - last < every) return;
  game.sailTip[id] = game.time;
  hud.alert(text, { kind, duration: 6 });
}
const helmIn = { steer: 0 };
function updateHelm(dt, ps) {
  helmIn.steer = 0;
  const st = game.helm;
  if (!st) return;
  const gone = st.tile.broken || !stations.hasStation(st.tile);
  const far = Math.hypot(ps.pos.x - st.tile.i * TILE, ps.pos.z - st.tile.j * TILE) > 2.6;
  if (gone || far || ps.inWater || ps.tower) { leaveHelm(); return; }
  if (input.wasPressed('KeyE') || input.movePressed('jump')) {
    input.consume('KeyE');
    leaveHelm(islands.boat.sailSet > 0 ? 'Oar lashed. The raft holds its line.' : null);
    return;
  }
  helmIn.steer = (input.move('right') ? 1 : 0) - (input.move('left') ? 1 : 0);
  const b = islands.boat;
  if (helmIn.steer !== 0 && islands.dest != null) {
    islands.setDestination(null);
    hud.toast('You take the oar: course cleared.', 'gain');
  }
  const up = input.movePressed('forward'), down = input.movePressed('back');
  if (up || down) {
    if (stations.anchored()) { audio.error(); hud.toast('The anchor is down. Raise it first.', 'warn'); return; }
    if (islands.dest != null) islands.setDestination(null);
    const next = clamp(Math.round(b.sailSet * 2) + (up ? 1 : -1), 0, 2) / 2;
    if (next !== b.sailSet) {
      islands.setSail(next);
      audio.pickup();
      hud.toast(next === 0 ? 'Sail down' : next === 0.5 ? 'Sail half up' : 'Full sail', 'gain');
    }
  }
}

const shelterList = [];
const sailView = { hoist: 0, boom: 0.14, fill: 0, rudder: 0, windYaw: 0 };
let twaNow = 0;
function updateSailing(dt, wx, isl, ps) {
  const b = islands.boat;
  const c = raft.center();
  const ext = raft.extent;
  // Things afloat stream past faster under sail and swing round as the raft turns.
  debris.turn(isl.turned);
  debris.setFlow(CURRENT_SPEED + 0.45 * isl.through);
  setShelters(islands.shelters(shelterList));
  raft.setHeel(b.heel * SAILING.heelShown);
  wake.update(game.time, dt, ext.cx, ext.cz + ext.hz, ext.hx, isl.through, wx.night, wx.daylight);

  twaNow = wrap(wx.wind.from - (Math.PI / 2 - isl.heading));
  sailView.hoist = b.sail;
  sailView.boom = boomAngle(twaNow);
  sailView.fill = sailFill(twaNow);
  sailView.rudder = b.rudder;
  sailView.windYaw = Math.atan2(-wx.windZ, wx.windX);

  // Spray off the bow when driving hard.
  game.sprayT = (game.sprayT || 0) - dt * Math.max(0, isl.through - 1.6);
  if (game.sprayT < 0) {
    game.sprayT = rand(0.5, 1.1);
    fx.splash(tmpV.set(ext.cx + rand(-ext.hx, ext.hx), waveHeight(ext.cx, ext.cz - ext.hz, game.time) + 0.1, ext.cz - ext.hz - 0.15), 0.45 + 0.12 * isl.through);
  }

  const hasSail = !!stations.has('sail');
  if (isl.sailing && b.sail > 0.3 && islands.dest == null) {
    if (isl.over > 0.03) sailTip('over', 'Too much sail for this wind: the raft is fighting you. Press S at the oar to take some in.', 'danger', 25);
    else if (Math.abs(twaNow) < SAILING.noGo && Math.abs(b.speed) < 0.5) sailTip('irons', 'Head to wind: the sail only flaps. Steer away from the wind with A or D until it fills.', 'danger', 30);
  }
  if (isl.surfing > 0.6) sailTip('surf', 'A wave has the raft: you are surfing!', 'good', 60);
  sailHud.update({
    show: hasSail, dt, wind: wx.wind, heading: isl.heading, speed: isl.speed, sail: b.sail, sailSet: b.sailSet,
    boom: sailView.boom, helm: !!game.helm, course: islands.dest != null && !isl.resting, over: isl.over, surfing: isl.surfing,
  });
}

// ---------- the living sea, and the feel of it ----------
const lifeCtx = { camera, raft: null, land: null, through: 0, day: 1, night: 0, storm: 0, sunColor: SKY.sunColor, sunLevel: 1, fog: scene.fog, live: false };
function updateLife(dt, wx, through, live) {
  lifeCtx.raft = raft.center();
  lifeCtx.land = islands.center();
  lifeCtx.through = through;
  lifeCtx.day = wx.daylight;
  lifeCtx.night = wx.night;
  lifeCtx.storm = wx.storm;
  lifeCtx.sunLevel = sun.intensity / 3.2;
  lifeCtx.live = live;
  life.update(game.time, dt, lifeCtx);
}
const side = (x) => (x < 0 ? 'port' : 'starboard');
life.on({
  onDolphins(s, where) {
    sight('dolphins');
    companion.say('dolphins', 0.8);
    hud.alert(`Dolphins! Coming up on the ${side(s)} side.`, { kind: 'good', duration: 6, follow: where });
  },
  onWhale(where, dx) {
    sight('whale');
    companion.say('whale');
    hud.alert('A whale is breaching!', { kind: 'good', duration: 6, follow: where });
  },
  onTurtle(where) {
    hud.alert('A sea turtle has come up beside the raft.', { kind: 'good', duration: 6, follow: where });
    sight('turtle');
  },
  onFlyingFish(where) {
    if (journal.see('flyingfish')) hud.alert('Flying fish!', { kind: 'good', duration: 3, follow: where });
  },
  onJellyfish() {
    if (journal.see('jellyfish')) hud.alert('The water is glowing: jellyfish, drifting up in the dark.', { kind: 'good', duration: 7 });
  },
  onWhaleSplash(p) {
    const s = placeSound(p);
    audio.splash(s.pan, true);
    audio.thunder?.();
  },
});

// Rain soaks the deck: darker and glossy, so it mirrors the sky and the lightning.
let deckWet = -1;
function wetDeck(rain) {
  const k = Math.round(clamp(rain * 1.3, 0, 1) * 20) / 20;
  if (k === deckWet) return;
  deckWet = k;
  const M = materials();
  for (const m of M.planks) { m.roughness = lerp(0.86, 0.38, k); m.color.setScalar(lerp(1, 0.7, k)); }
  for (const m of M.chewed) { m.roughness = lerp(0.86, 0.45, k); m.color.setRGB(0.62 * lerp(1, 0.75, k), 0.52 * lerp(1, 0.75, k), 0.44 * lerp(1, 0.75, k)); }
}

// Speed widens the view a little; surfing a wave widens it more.
let fovNow = 72;
function speedView(dt, isl) {
  const want = 72 + 4 * clamp((isl.through - 1.2) / 2, 0, 1) + 7 * clamp(isl.surfing / 1.5, 0, 1);
  fovNow = lerp(fovNow, want, 1 - Math.exp(-dt * 1.6));
  const f = lerp(fovNow, 13, spy.k * spy.k * (3 - 2 * spy.k));
  if (Math.abs(camera.fov - f) > 0.05) {
    camera.fov = f;
    camera.updateProjectionMatrix();
  }
}

// The spyglass (hold Z): a long narrow look at the horizon.
const spy = { k: 0, on: false, dir: { x: 0, z: 0 }, el: document.getElementById('scope') };
function updateSpy(dt, ps) {
  spy.on = crafting.hasGear('spyglass') && input.isDown('KeyZ') && !game.menu && !game.sleep && !ps.inWater;
  spy.k = clamp(spy.k + (spy.on ? dt : -dt) * 5, 0, 1);
  ps.lookScale = 1 - 0.84 * spy.k;
  const show = spy.k > 0.02;
  if (spy.el.hidden === show) { spy.el.hidden = !show; document.body.classList.toggle('spying', show); }
  if (show) spy.el.style.opacity = spy.k;
  camera.getWorldDirection(tmpV);
  const l = Math.hypot(tmpV.x, tmpV.z) || 1;
  spy.dir.x = tmpV.x / l; spy.dir.z = tmpV.z / l;
}

// Things the sky and the sea show you, noted in the logbook the first time.
let sightIn = 0;
function watchSights(dt, wx) {
  sightIn -= dt;
  if (sightIn > 0) return;
  sightIn = 0.5;
  if (SKY.rainbow > 0.45) sight('rainbow');
  if (SKY.meteorT >= 0 && wx.night > 0.5) sight('meteor');
  if (weather.state.flashT > 0) sight('lightning');
  const land = islands.center();
  if (land && wx.daylight > 0.3 && Math.hypot(land.x, land.z) < land.r + 150) sight('gulls');
  if (!shark.gone && shark.state !== 'circle') sight(shark.tierIndex > 0 ? 'hammerhead' : 'reef');
  const lh = islands.lighthouse();
  if (lh && lh.seen) sight('lighthouse');
}

// ---------- per-frame ----------
function survival(dt) {
  const s = game.stats;
  const drain = DIFFICULTY[game.difficulty].drain;
  s.thirst = Math.max(0, s.thirst - STATS.thirstPerSec * drain * dt);
  s.hunger = Math.max(0, s.hunger - STATS.hungerPerSec * drain * dt);
  if (s.thirst <= 0) { s.health -= STATS.starveDamage * dt; game.lastDamage = 'thirst'; }
  if (s.hunger <= 0) { s.health -= STATS.starveDamage * dt; game.lastDamage = game.lastDamage === 'thirst' ? 'thirst' : 'hunger'; }
  if (s.health <= 0) {
    s.health = 0;
    die();
    return;
  }
  if (s.thirst > 40 && s.hunger > 40 && game.time - game.lastHurt > STATS.regenDelay) {
    s.health = Math.min(100, s.health + STATS.regen * dt);
  }
}

// Keep floating things and the shark out of an island's shallows.
function keepOffIsland(dt) {
  const c = islands.center();
  if (!c) return;
  for (const d of debris.items) {
    if (d.hooked) continue;
    if (islands.heightAt(d.x, d.z) > -0.6) {
      const dx = d.x - c.x, dz = d.z - c.z, l = Math.hypot(dx, dz) || 1;
      d.x += (dx / l) * 2 * dt;
      d.z += (dz / l) * 2 * dt;
    }
  }
  const sp = shark.pos;
  if (!shark.gone && islands.heightAt(sp.x, sp.z) > sp.y - 0.6) {
    const dx = sp.x - c.x, dz = sp.z - c.z, l = Math.hypot(dx, dz) || 1;
    sp.x += (dx / l) * 4 * dt;
    sp.z += (dz / l) * 4 * dt;
  }
}

function updateWorld(dt) {
  const wx = weather.update(dt, game.time, camera.position, false, camera);
  updateLife(dt, wx, 0, false);
  raft.update(game.time, dt);
  debris.update(game.time, dt, raft.center());
  fx.update(dt);
}

function updatePlay(dt) {
  game.time += dt;
  game.alive += dt;
  raft.update(game.time, dt);
  // Hammer and net rays this frame need the raft's current pose, not last frame's.
  raft.group.updateMatrixWorld(true);
  const wx = weather.update(dt * sleepRate(), game.time, camera.position, true, camera);
  stations.setNight(wx.night);
  updateHelm(dt, player.state);
  player.update(game.time, dt, input, raft, events, 0, islands);
  updateSleep(dt, wx);
  updateSpy(dt, player.state);
  view.aim(player.state, game.time, dt);
  const ui = tools.update(game.time, dt, input, player, SKY.sunDir);
  // Footsteps on the deck or sand, strokes when swimming.
  const ps0 = player.state;
  const stepPh = Math.floor(ps0.walkPhase / Math.PI);
  if (stepPh !== game.stepPh) {
    game.stepPh = stepPh;
    if (ps0.inWater) audio.stroke();
    else if (ps0.grounded) audio.step(ps0.onLand ? 'sand' : 'deck');
  }
  tools.setLighting(sun.intensity, sun.color, hemi.intensity);
  watchSights(dt, wx);
  const ps = player.state;
  bait.update(game.time, dt, raft, debris.flow);
  // Wading in an island's shallows is safe; the shark won't come in that far.
  const exposed = ps.inWater && islands.heightAt(ps.pos.x, ps.pos.z) < -1.2;
  shark.update(game.time, dt, { raft, nets, bait, diff: DIFFICULTY[game.difficulty], player: { pos: ps.pos, inWater: exposed }, fx, events });
  // A tower that went overboard drops you with it.
  if (ps.tower && (ps.tower.tile.broken || !stations.hasStation(ps.tower.tile))) {
    ps.tower = null;
    ps.grounded = false;
  }
  const isl = islands.update(dt, {
    raftCenter: raft.center(), raftRadius: raft.radius(),
    aboard: !ps.inWater && !ps.onLand, onLand: ps.onLand, anchored: stations.anchored(),
    hasSail: !!stations.has('sail'), onTower: !!ps.tower, night: wx.night,
    wind: wx.wind, steer: helmIn.steer,
    spy: spy.k > 0.8 ? spy.dir : null, spyK: spy.k,
    // downhill ahead when a wave lifts the stern
    slope: (waveHeight(0, 6, game.time) - waveHeight(0, -6, game.time)) / 12,
  });
  updateSailing(dt, wx, isl, ps);
  updateLife(dt, wx, isl.through, true);
  companionCtx.player = ps.pos; companionCtx.daylight = wx.daylight; companionCtx.live = true;
  companion.update(game.time, dt, companionCtx);
  if (wx.kind !== game.lastKind) { if (wx.kind === 'storm') companion.say('storm'); game.lastKind = wx.kind; }
  wetDeck(wx.rain);
  speedView(dt, isl);
  keepOffIsland(dt);
  // Gulls when land is close.
  const ic = islands.center();
  game.birdT = (game.birdT || 4) - dt;
  if (ic && game.birdT <= 0) {
    game.birdT = rand(4, 11);
    const d = Math.hypot(ic.x - ps.pos.x, ic.z - ps.pos.z);
    if (d < ic.r + 90 && wx.kind !== 'storm' && wx.night < 0.5) audio.bird(placeSound(tmpV.set(ic.x, 6, ic.z)).pan);
  }
  if (ps.onLand && !game.landed) {
    game.landed = true;
    progress('island');
  }
  if (!isl.resting && !ps.onLand) game.landed = false;
  nets.update(game.time, dt);
  rails.update();
  stations.update(game.time, dt, wx.kind, ps.pos, clamp((wx.wind.speed - 3) / 11, 0.1, 1), sailView);
  if (story.tick(dt)) {
    const c = raft.center();
    const d = debris.spawn('bottle', c.x - debris.flow.x * 60 + rand(-5, 5), c.z - debris.flow.z * 60);
    hud.alert('Something glints in the water, drifting your way.', {
      kind: 'good', duration: 6, follow: () => (debris.items.includes(d) ? tmpV.set(d.x, 0.3, d.z) : null),
    });
  }
  game.mapT = (game.mapT || 0) + dt;
  if (game.menu === 'map' && game.mapT > 0.25) { game.mapT = 0; map.tick(); }
  if (game.pendingNote && !game.menu) { const f = game.pendingNote; game.pendingNote = null; if (holdInput('note')) f(); }
  debris.update(game.time, dt, raft.center());
  fx.update(dt);
  crafting.tick(dt);
  survival(dt);
  if (game.mode !== 'play') return;

  game.saveT = (game.saveT || 0) + dt;
  if (game.saveT > 30) saveGame();

  // A night that ends at dawn counts as survived.
  if (game.lastHour < 6 && wx.hour >= 6) {
    progress('night');
    hud.alert(`Dawn of day ${wx.day}.`, { kind: 'good', duration: 3 });
    companion.say('dawn', 0.7);
    music.sting('dawn');
  }
  game.lastHour = wx.hour;

  // At night the shark leaves a glowing wake when it swims near the surface.
  game.glowT -= dt;
  if (wx.night > 0.3 && !shark.gone && shark.pos.y > -1.6 && game.glowT <= 0) {
    game.glowT = 0.07;
    fx.glowTrail(tmpV.set(shark.pos.x, 0.02, shark.pos.z));
  }

  // The next, bigger predator turns up a while after the last one left.
  if (shark.gone) {
    game.nextPredatorIn -= dt;
    if (game.nextPredatorIn <= 0) {
      shark.setTier(shark.tierIndex + 1);
      audio.warn();
      hud.alert(`Something bigger is circling the raft: a ${shark.tier.name.toLowerCase()}.`, { kind: 'danger', duration: 6 });
    }
  }

  // Third person: the body follows you, and the picture moves out behind.
  view.updateBody(dt, ps, {
    slot: SLOTS[ui.slot].id, sprint: input.move('sprint'), anim: tools.state.anim, daylight: wx.daylight,
    inHand: SLOTS[ui.slot].id === 'food' ? inventory.get(ui.food) > 0 : SLOTS[ui.slot].id === 'fish' ? inventory.get('fish') > 0 : !ui.hookOut,
  });
  view.apply(ps, game.time);

  if (game.shake > 0) {
    game.shake = Math.max(0, game.shake - dt);
    camera.position.x += (Math.random() - 0.5) * game.shake * 0.12;
    camera.position.y += (Math.random() - 0.5) * game.shake * 0.12;
  }

  game.creak -= dt;
  if (game.creak <= 0) {
    game.creak = rand(7, 16);
    if (!ps.inWater) audio.creak(rand(-0.6, 0.6));
  }

  hud.setVitals(game.stats);
  hud.setFood(ui.food, inventory.items);
  hud.setInventory(inventory.items);
  hud.setSlot(ui.slot, hintFor(SLOTS[ui.slot].id, ui));
  hud.setPrompt(ui.prompt);
  hud.setCharge(ui.charge);
  hud.setFishing(ui.fishing, ui.hasRod);
  // Fish bite better at dawn and dusk and in the rain; what bites depends on how near land you are.
  {
    const ic2 = islands.center();
    const near = ic2 ? clamp(1 - (Math.hypot(ic2.x - ps.pos.x, ic2.z - ps.pos.z) - ic2.r) / 60, 0, 1) : 0;
    const lamp = (stations.lanternNear(ps.pos.x, ps.pos.z) ? 0.6 : 0) + (crafting.hasGear('lure') ? 0.9 : 0);
    tools.setFishingPlace(near, wx.night, clamp(SKY.sunset * 0.8 + wx.rain * 0.5 + lamp, 0, 1.6));
  }
  hud.setSwimming(ps.inWater && view.eyes);
  const islandNote = isl.resting
    ? (stations.anchored() ? 'Island: anchored' : `Island: ${formatTime(isl.visitLeft)}`)
    : stations.anchored() ? 'Anchored' : isl.sailing ? (islands.dest != null ? 'Sailing a course' : 'Under sail') : '';
  hud.setClock(wx.day, wx.hour, wx.kind, wx.night, islandNote);
  hud.setBuildBar(SLOTS[ui.slot].id === 'hammer' ? BUILD_MODES : null, ui.hammerMode);
  hud.update(dt, camera);
}

let titleAngle = 0.6;
function updateTitle(dt) {
  game.time += dt;
  titleAngle += dt * 0.05;
  updateWorld(dt);
  shark.update(game.time, dt, { raft, nets, player: { pos: new THREE.Vector3(0, 0.4, 0), inWater: false }, fx, events: {} });
  shark.holdOff(30);
  companionCtx.live = false;
  companion.update(game.time, dt, companionCtx);
  const c = raft.center();
  view.pose(dt, c.x + 0.3, raft.deckHeightAt(c.x + 0.3, c.z + 0.2), c.z + 0.2, 2.6);
  camera.position.set(c.x + Math.sin(titleAngle) * 7.5, 3.1, c.z + Math.cos(titleAngle) * 7.5);
  camera.lookAt(c.x + Math.sin(titleAngle + 2.4) * 6, 0.2, c.z + Math.cos(titleAngle + 2.4) * 6);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  pipeline.resize(w, h);
  fx.setViewport(h * renderer.getPixelRatio());
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  tools.resize(w, h);
  weather.setViewport(w, h);
}
window.addEventListener('resize', resize);
applyQuality(loadQuality(), false);

let last = null;
function frame(now) {
  // rAF time can be earlier than when the script started; never step backwards.
  const dt = last === null ? 0 : Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  // Automated checks drive frames themselves through __game.step().
  if (window.__game?.hold) {
    requestAnimationFrame(frame);
    return;
  }
  if (game.mode === 'play') updatePlay(dt);
  else if (game.mode === 'title') updateTitle(dt);

  ocean.update(game.time, camera.position);
  sky.update(game.time, camera.position);
  musicMood.night = SKY.night; musicMood.sunset = SKY.sunset; musicMood.storm = SKY.storm;
  music.update(dt, audio.context, audio.output, musicMood, game.mode === 'play' && !game.menu);
  if (game.mode === 'play') watchPerf(now);
  else perf.last = now;

  const playing = game.mode === 'play' || game.mode === 'paused';
  pipeline.render(playing && view.eyes && !game.sleep && spy.k < 0.3, playing ? player.state.pos : camera.position);
  input.endFrame(dt);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
function start(data) {
  newGame();
  if (data && restore(data)) {
    game.mode = 'paused';
    showScreen('pause');
  } else {
    // The title screen sits at sunrise.
    weather.setTime(6.55);
    showScreen('title');
    refreshTitle();
  }
  requestAnimationFrame(frame);
}

window.claude?.hot?.snapshot?.(() => (game.mode === 'title' ? {} : serialize()));
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? {});

// Handles for automated checks (tools/smoke.js).
window.__game = {
  game, raft, shark, debris, nets, rails, bait, stations, weather, crafting, islands, story, map, player, tools, inventory, input, camera, events,
  applyDifficulty, takeHelm, leaveHelm, wake, ocean, sky, renderer, scene, view, life, SKY,
  openMenu, closeMenu, openMap, openNote, openJournal, journal, companion, music, audio, hud,
  newGame, enterPlay, serialize, restore, TILE, applyQuality, pipeline, saveGame, readSave, clearSave,
  hold: false,
  draw() {
    ocean.update(game.time, camera.position);
    sky.update(game.time, camera.position);
    const playing = game.mode === 'play' || game.mode === 'paused';
    pipeline.render(playing && view.eyes && !game.sleep && spy.k < 0.3, playing ? player.state.pos : camera.position);
  },
  step(sec, fn, draw = true) {
    const n = Math.round(sec / (1 / 60));
    for (let i = 0; i < n; i++) {
      fn?.(i);
      if (game.mode === 'play') updatePlay(1 / 60);
      input.endFrame(1 / 60);
    }
    if (draw) this.draw();
  },
};
