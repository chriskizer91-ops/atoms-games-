import * as THREE from 'three';
import { STATS, SHARK_TIERS, ITEMS, TILE, COSTS, GRUDGE } from './config.js';
import { createOcean } from './ocean.js';
import { createSky, SKY } from './sky.js';
import { createPipeline, QUALITY } from './render.js';
import { setAnisotropy } from './textures.js';
import { createRaft, startingLayout } from './raft.js';
import { createDebris } from './debris.js';
import { createShark } from './shark.js';
import { createNets } from './nets.js';
import { createBait } from './bait.js';
import { createPlayer } from './player.js';
import { createTools, SLOTS } from './tools.js';
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

scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1d4a5a, 0.35));
const sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
scene.add(sun);

const sky = createSky(scene, renderer);
const ocean = createOcean(scene, { sky: SKY, fog: scene.fog });
const raft = createRaft(scene);
const debris = createDebris(scene);
const fx = createFx(scene);
const shark = createShark(scene, SHARK_TIERS[0]);
const nets = createNets(raft, debris, fx, audio);
const bait = createBait(scene, fx, audio);
const player = createPlayer(camera);
const input = createInput(canvas);
const hud = createHud();

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
];

const HINTS = {
  hook: 'Hold left mouse to wind up, let go to throw. Hold again to reel in.',
  spear: 'Click to stab. A few good hits send the shark away.',
  coconut: 'Click to crack it open: food and water.',
  fish: 'Click to eat it raw. Right-click to throw it as bait for the shark.',
};
function hintFor(id, ui) {
  if (id !== 'hammer') return HINTS[id];
  return ui.hammerMode === 'net'
    ? 'Building nets: click an outline on an outer edge. Right-click to build floor instead.'
    : 'Building floor: click an outline to add a piece, or a bitten piece to fix it. Right-click for nets.';
}

const game = {
  mode: 'title',
  time: 0,
  alive: 0,
  stats: { health: 100, hunger: 100, thirst: 100 },
  lastHurt: -99,
  lastDamage: null,
  progress: {},
  counters: { wood: 0, repels: 0, repairs: 0, lost: 0, built: 0, baited: 0 },
  goalStage: 0,
  creak: 6,
  shake: 0,
};

const inventory = (() => {
  const items = { wood: 0, plastic: 0, fiber: 0, scrap: 0, coconut: 0, fish: 0 };
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
      ? 'Goals done. New goals: grow the raft.'
      : 'All goals done. Keep the raft afloat as long as you can.';
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
  onEnterWater(p) {
    fx.splash(p.setY(0.1), 1.6);
    audio.splash(0, true);
  },
  onClimb() {
    audio.splash(0, false);
  },
};

const tools = createTools({ scene, camera, raft, nets, bait, debris, shark, fx, audio, inventory, stats: game.stats, events });

nets.onLost((net, reason) => {
  if (reason === 'built-over') {
    inventory.add(COSTS.net);
    hud.toast('Took the net down to build there and kept its materials', 'gain');
  } else if (reason === 'tile-broke') {
    hud.toast('A net went down with its floor piece', 'warn');
  }
});
bait.onReturn(() => {
  inventory.add({ fish: 1 });
  hud.toast('Bait needs to land in the water', 'warn');
});

const pipeline = createPipeline({ renderer, scene, camera, vmScene: tools.vmScene, vmCamera: tools.vmCamera, ocean, sun, sky: SKY, aboveWaterOnly: [sky.mesh, fx.sprites] });
sky.capture(0);
tools.vmScene.environment = sky.environment;
setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

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
document.querySelectorAll('.quality button').forEach((b) => b.addEventListener('click', () => applyQuality(b.dataset.q)));
// Watch the first seconds of play; if frames are slow, step down once.
const perfWatch = { t: 0, n: 0, sum: 0, done: false };
function watchPerf(dt) {
  if (perfWatch.done) return;
  perfWatch.t += dt;
  if (perfWatch.t < 3) return;
  perfWatch.n++;
  perfWatch.sum += dt;
  if (perfWatch.t > 8) {
    perfWatch.done = true;
    const avg = perfWatch.sum / perfWatch.n;
    const order = ['high', 'medium', 'low'];
    const i = order.indexOf(pipeline.quality);
    if (avg > 1 / 38 && i < order.length - 1) {
      applyQuality(order[i + 1]);
      hud.toast(`Graphics set to ${QUALITY[pipeline.quality].label} to keep it smooth. Change it in the pause menu.`, 'warn');
    }
  }
}

// ---------- setup / reset / save state ----------
function newGame() {
  raft.reset(startingLayout());
  debris.reset(0, 0);
  bait.clear();
  shark.reset();
  player.reset();
  tools.reset();
  inventory.set({ coconut: 1 });
  Object.assign(game.stats, { health: 100, hunger: 100, thirst: 100 });
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
    player: player.serialize(),
    shark: shark.serialize(),
  };
}

function restore(d) {
  if (!d || d.v !== 1) return false;
  newGame();
  raft.reset(d.raft);
  nets.restore(d.nets);
  inventory.set(d.inventory);
  Object.assign(game.stats, d.stats);
  game.alive = d.alive;
  game.time = d.time;
  game.progress = d.progress || {};
  game.counters = d.counters || game.counters;
  game.goalStage = d.goalStage || 0;
  player.restore(d.player);
  shark.restore(d.shark);
  showGoals();
  return true;
}

// ---------- screens ----------
const screens = {
  title: document.getElementById('title'),
  pause: document.getElementById('pause'),
  dead: document.getElementById('dead'),
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
  game.mode = 'paused';
  input.state.enabled = false;
  input.state.mouse = [false, false, false];
  showScreen('pause');
}

function die() {
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

document.getElementById('play').addEventListener('click', () => {
  newGame();
  enterPlay();
});
document.getElementById('resume').addEventListener('click', () => enterPlay());
document.getElementById('restart').addEventListener('click', () => {
  newGame();
  enterPlay();
});
document.getElementById('quit').addEventListener('click', () => {
  game.mode = 'title';
  showScreen('title');
});
input.onLockChange((locked) => {
  if (!locked && game.mode === 'play' && !input.state.freeLook) pause();
});
window.addEventListener('keydown', (e) => {
  if (game.mode === 'play' && (e.code === 'KeyP' || (e.code === 'Escape' && input.state.freeLook))) pause();
});
// If pointer lock dropped without a pause (free-look mode), a click re-captures.
canvas.addEventListener('click', () => {
  if (game.mode === 'play' && !input.state.locked && !input.state.freeLook) input.lock();
});

// ---------- per-frame ----------
function survival(dt) {
  const s = game.stats;
  s.thirst = Math.max(0, s.thirst - STATS.thirstPerSec * dt);
  s.hunger = Math.max(0, s.hunger - STATS.hungerPerSec * dt);
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

function updateWorld(dt) {
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
  player.update(game.time, dt, input, raft, events);
  const ui = tools.update(game.time, dt, input, player, SKY.sunDir);
  const ps = player.state;
  bait.update(game.time, dt, raft, debris.flow);
  shark.update(game.time, dt, { raft, nets, bait, player: { pos: ps.pos, inWater: ps.inWater }, fx, events });
  nets.update(game.time, dt);
  debris.update(game.time, dt, raft.center());
  fx.update(dt);
  survival(dt);

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
  hud.setInventory(inventory.items);
  hud.setSlot(ui.slot, hintFor(SLOTS[ui.slot].id, ui));
  hud.setPrompt(ui.prompt);
  hud.setCharge(ui.charge);
  hud.setSwimming(ps.inWater);
  hud.update(dt, camera);
}

let titleAngle = 0.6;
function updateTitle(dt) {
  game.time += dt;
  titleAngle += dt * 0.05;
  updateWorld(dt);
  shark.update(game.time, dt, { raft, player: { pos: new THREE.Vector3(0, 0.4, 0), inWater: false }, fx, events: {} });
  shark.holdOff(30);
  const c = raft.center();
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
  if (game.mode === 'play') watchPerf(dt);

  pipeline.render(game.mode === 'play' || game.mode === 'paused', camera.position);
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
    showScreen('title');
  }
  requestAnimationFrame(frame);
}

window.claude?.hot?.snapshot?.(() => (game.mode === 'title' ? {} : serialize()));
if (window.claude?.hot?.ready) window.claude.hot.ready(start);
else start(window.claude?.hot?.data ?? {});

// Handles for automated checks (tools/smoke.js).
window.__game = {
  game, raft, shark, debris, nets, bait, player, tools, inventory, input, camera, events,
  newGame, enterPlay, serialize, restore, TILE, applyQuality, pipeline,
  hold: false,
  draw() {
    ocean.update(game.time, camera.position);
    sky.update(game.time, camera.position);
    pipeline.render(game.mode === 'play' || game.mode === 'paused', camera.position);
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
