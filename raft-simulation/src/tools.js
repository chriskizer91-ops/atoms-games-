import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { HOOK, SPEAR, HAMMER, COSTS, COCONUT, FISH, COOKED, STATIONS, PLAYER } from './config.js';
import { makeFish } from './nets.js';
import { waveHeight } from './ocean.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { materials } from './materials.js';
import { clamp, damp, lerp } from './util.js';

export const SLOTS = [
  { id: 'hook', name: 'Rope hook' },
  { id: 'spear', name: 'Spear' },
  { id: 'hammer', name: 'Hammer' },
  { id: 'coconut', name: 'Coconut' },
  { id: 'fish', name: 'Raw fish' },
  { id: 'cooked', name: 'Cooked fish' },
];

// What the hammer can build, in right-click order.
export const BUILD_MODES = [
  { id: 'floor', label: 'Floor' },
  { id: 'net', label: 'Catch net' },
  { id: 'grill', label: 'Grill' },
  { id: 'catcher', label: 'Rain catcher' },
];

let MAT = null;
function initMaterials() {
  if (MAT) return;
  const M = materials();
  MAT = { skin: M.skin, sleeve: M.cloth, cuff: M.clothDark, handle: M.handle, rope: M.rope, metal: M.metal, stone: M.stone, coconut: M.coconut, float: M.float, floatBand: M.floatBand };
}

const UP = new THREE.Vector3(0, 1, 0);
function rod(a, b, r, mat, sides = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, sides), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Every hand-held model has its grip along +Y through the origin, which is
// where the fingers close.

// Three-pronged throwing hook, used in the hand and out on the water.
function makeGrapple() {
  const g = new THREE.Group();
  g.add(rod(V(0, 0, 0), V(0, 0.17, 0), 0.011, MAT.metal));
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 6, 14), MAT.metal);
  eye.position.y = 0.19;
  g.add(eye);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const p1 = V(c * 0.055, -0.03, s * 0.055);
    const p2 = V(c * 0.07, 0.04, s * 0.07);
    g.add(rod(V(0, 0, 0), p1, 0.009, MAT.metal));
    g.add(rod(p1, p2, 0.008, MAT.metal));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 6), MAT.metal);
    tip.position.copy(p2).add(V(0, 0.014, 0));
    g.add(tip);
  }
  return g;
}

function makeSpear() {
  const g = new THREE.Group();
  g.add(rod(V(0, -0.45, 0), V(0, 1.36, 0), 0.016, MAT.handle));
  // Knapped stone blade lashed into a split in the shaft.
  const blade = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 1).scale(0.62, 2.5, 0.26), MAT.stone);
  blade.position.y = 1.47;
  g.add(blade);
  for (let k = 0; k < 4; k++) g.add(rod(V(0, 1.3 + k * 0.022, 0), V(0, 1.318 + k * 0.022, 0), 0.021, MAT.rope));
  for (let k = 0; k < 6; k++) g.add(rod(V(0, -0.075 + k * 0.026, 0), V(0, -0.055 + k * 0.026, 0), 0.0185, MAT.rope));
  return g;
}

function makeHammer() {
  const g = new THREE.Group();
  g.add(rod(V(0, -0.12, 0), V(0, 0.31, 0), 0.016, MAT.handle));
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.07, 0.19, 1, 0.016), MAT.stone);
  head.position.set(0, 0.29, -0.015);
  g.add(head);
  for (const z of [-0.035, 0.005]) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.009, 6, 14), MAT.rope);
    wrap.position.set(0, 0.29, z);
    g.add(wrap);
  }
  return g;
}

function makeCoconut() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 3).scale(1, 0.92, 1.1), MAT.coconut));
  return g;
}

// A closed right hand: four curled fingers around the grip axis, the back
// of the hand on +x, thumb over the top.
function makeHand() {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.094, 0.082, 3, 0.015), MAT.skin);
  back.position.set(0.033, -0.002, 0.024);
  g.add(back);
  const fingers = [[0.032, 0.0235], [0.0105, 0.024], [-0.011, 0.0232], [-0.031, 0.021]];
  for (const [y, r] of fingers) {
    const f = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0128, 8, 14, Math.PI * 1.42).rotateX(-Math.PI / 2), MAT.skin);
    f.position.y = y;
    g.add(f);
    const tipA = -Math.PI * 1.42;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0128, 8, 6), MAT.skin);
    tip.position.set(Math.cos(tipA) * r, y, Math.sin(-tipA) * -r);
    g.add(tip);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0128, 0.046, 4, 10), MAT.skin);
  thumb.rotation.set(0.25, 0.5, Math.PI / 2);
  thumb.position.set(0.004, 0.051, -0.01);
  g.add(thumb);
  return g;
}

const easeOut = (x) => 1 - (1 - x) * (1 - x);
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

// Arm position/rotation in view space, and how the hand turns to hold each tool.
const POSE = {
  hook: { arm: [0.25, -0.2, -0.44, 0.1, 0.22, 0], hand: [Math.PI / 2 - 0.35, 0, 0] },
  spear: { arm: [0.24, -0.215, -0.4, 0.02, 0.12, -0.1], hand: [-Math.PI / 2 + 0.1, 0.13, 0] },
  hammer: { arm: [0.28, -0.25, -0.5, 0.15, 0.2, 0], hand: [-0.35, 0.1, 0.15] },
  coconut: { arm: [0.24, -0.2, -0.44, 0.1, 0.22, 0], hand: [0.35, 0, 0] },
  fish: { arm: [0.24, -0.2, -0.44, 0.1, 0.22, 0], hand: [0.2, 0.3, 0] },
  cooked: { arm: [0.24, -0.2, -0.44, 0.1, 0.22, 0], hand: [0.2, 0.3, 0] },
};

export function createTools({ scene, camera, raft, nets, stations, crafting, bait, debris, shark, fx, audio, inventory, stats, events }) {
  initMaterials();
  // ----- first-person view model, drawn in its own pass so it never clips -----
  const vmScene = new THREE.Scene();
  const vmCamera = new THREE.PerspectiveCamera(65, 1, 0.01, 10);
  const vmHemi = new THREE.HemisphereLight(0xdbefff, 0x34505e, 0.3);
  vmScene.add(vmHemi);
  vmScene.environmentIntensity = 0.55;
  const vmSun = new THREE.DirectionalLight(0xfff1d6, 1.7);
  vmScene.add(vmSun, vmSun.target);

  // Forearm reaching in from the lower right, sleeve rolled to the elbow;
  // the sleeve is what clothing will recolour later.
  const arm = new THREE.Group();
  const along = (g) => g.rotateX(Math.PI / 2);
  const forearm = new THREE.Mesh(along(new THREE.CylinderGeometry(0.033, 0.046, 0.44, 14)), MAT.skin);
  forearm.position.set(0.022, 0, 0.27);
  const sleeveMat = MAT.sleeve.clone();
  const sleeveBase = sleeveMat.color.clone();
  const sleeve = new THREE.Mesh(along(new THREE.CylinderGeometry(0.06, 0.066, 0.24, 14)), sleeveMat);
  sleeve.position.set(0.022, 0, 0.52);
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.017, 8, 18), MAT.cuff);
  cuff.position.set(0.022, 0, 0.405);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.012, 6, 18), MAT.rope);
  coil.position.set(0.022, 0, 0.13);
  coil.scale.z = 1.6;
  const hand = new THREE.Group();
  hand.add(makeHand());
  arm.add(forearm, sleeve, cuff, coil, hand);
  vmScene.add(arm);

  const models = {
    hook: new THREE.Group(),
    spear: makeSpear(),
    hammer: makeHammer(),
    coconut: makeCoconut(),
    fish: makeFish(),
    cooked: makeFish(),
  };
  models.cooked.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.6 }); });
  // Grappling hook gripped by the shank, prongs forward.
  const heldGrapple = makeGrapple();
  heldGrapple.position.y = -0.08;
  models.hook.add(heldGrapple);
  const danglingLine = rod(V(0, 0.115, 0), V(0.0, 0.16, 0.03), 0.005, MAT.rope);
  models.hook.add(danglingLine);
  models.hammer.scale.setScalar(0.85);
  models.coconut.position.set(-0.005, 0.0, -0.08);
  models.fish.scale.setScalar(1.25);
  models.fish.position.set(-0.02, 0.0, -0.05);
  models.fish.rotation.set(0.2, 0.4, Math.PI / 2);
  models.cooked.scale.setScalar(1.25);
  models.cooked.position.copy(models.fish.position);
  models.cooked.rotation.copy(models.fish.rotation);
  // The spear's tip becomes metal once the upgrade is made.
  const spearBlade = models.spear.children.find((c) => c.geometry?.type === 'OctahedronGeometry');
  for (const k in models) hand.add(models[k]);

  // ----- the thrown hook and its rope, out in the world -----
  const worldHook = new THREE.Group();
  const bigGrapple = makeGrapple();
  bigGrapple.scale.setScalar(2.2);
  worldHook.add(bigGrapple);
  // Bright float so you can see where the hook landed.
  const float = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), MAT.float);
  const floatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.093, 0.093, 0.04, 16), MAT.floatBand);
  worldHook.add(float, floatBand);
  worldHook.visible = false;
  scene.add(worldHook);

  const ROPE_PTS = 18;
  const ropeGeo = new LineGeometry();
  ropeGeo.setPositions(new Float32Array(ROPE_PTS * 3));
  const ropeMat = new LineMaterial({ color: 0xd8bf8a, linewidth: 0.016, worldUnits: true });
  const rope = new Line2(ropeGeo, ropeMat);
  rope.frustumCulled = false;
  rope.visible = false;
  scene.add(rope);

  const st = {
    slot: 0,
    swap: 1,
    anim: null,          // { type, t, dur, fired }
    cooldown: 0,
    hook: { mode: 'held', charge: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), carried: [], tick: 0 },
    sway: { x: 0, y: 0 },
    prompt: null,
    lookDebris: null,
    hammerTile: null,
    hammerMode: 'floor',   // what the hammer builds: 'floor' or 'net'
  };

  const camPos = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const handW = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const camQuatInv = new THREE.Quaternion();

  function handWorld(out) {
    vmScene.updateMatrixWorld();
    hand.getWorldPosition(out);
    out.z -= 0.05;
    return camera.localToWorld(out);
  }

  function slotId() {
    return SLOTS[st.slot].id;
  }

  function releaseHook(collect, player) {
    const h = st.hook;
    if (collect) {
      const gained = {};
      for (const d of h.carried) {
        for (const k in d.loot) gained[k] = (gained[k] || 0) + d.loot[k];
        debris.remove(d);
      }
      if (h.carried.length) {
        inventory.add(gained);
        audio.pickup();
        events.onCollect?.(gained, 'hook');
      }
    } else {
      for (const d of h.carried) {
        d.hooked = false;
        d.vx = 0; d.vz = 0;
      }
    }
    h.carried = [];
    h.mode = 'held';
    h.charge = 0;
    worldHook.visible = false;
    rope.visible = false;
  }

  function startAnim(type, dur) {
    st.anim = { type, t: 0, dur, fired: false };
  }

  // What the hammer is pointed at: a floor piece, an open spot for a new
  // one, or a spot for a net.
  function hammerTarget() {
    ray.set(camPos, camDir);
    ray.far = HAMMER.reach;
    const hits = ray.intersectObjects([...raft.hammerTargets(), ...nets.ghostTargets(), ...stations.ghostTargets()], false);
    if (!hits.length) return null;
    const u = hits[0].object.userData;
    return { tile: u.tile || null, build: u.build || null, netSlot: u.netSlot || null, stationSlot: u.stationSlot || null, point: hits[0].point };
  }

  function lookStation() {
    ray.set(camPos, camDir);
    ray.far = PLAYER.reach + 0.4;
    const hits = ray.intersectObjects(stations.hitTargets(), false);
    return hits.length ? hits[0].object.userData.station : null;
  }

  function lookNet() {
    ray.set(camPos, camDir);
    ray.far = PLAYER.reach + 0.6;
    const hits = ray.intersectObjects(nets.hitTargets(), false);
    return hits.length ? hits[0].object.userData.net : null;
  }

  // null hides the build outlines but remembers the last mode.
  function setHammerMode(m) {
    if (m) st.hammerMode = m;
    raft.setBuildMode(m);
    nets.setMode(m);
    stations.setMode(m);
  }

  function costText(cost) {
    return Object.entries(cost)
      .map(([k, n]) => `${n} ${k === 'fiber' ? 'palm fiber' : k}`)
      .join(' · ');
  }

  function buy(cost) {
    if (inventory.has(cost)) {
      inventory.spend(cost);
      return true;
    }
    audio.error();
    events.onMissing?.(cost);
    return false;
  }

  function doHammer() {
    const tgt = hammerTarget();
    if (!tgt) {
      audio.swing();
      return;
    }
    const { tile, point } = tgt;
    if (tgt.build) {
      if (buy(COSTS.floor)) {
        const t = raft.build(tgt.build.i, tgt.build.j);
        audio.build();
        fx.dust(point);
        events.onBuildFloor?.(t);
      }
      return;
    }
    if (tgt.stationSlot) {
      const { tile: t, kind } = tgt.stationSlot;
      if (buy(COSTS[kind])) {
        stations.add(t, kind);
        audio.build();
        fx.dust(point);
        events.onBuildStation?.(kind);
      }
      return;
    }
    if (tgt.netSlot) {
      if (buy(COSTS.net)) {
        nets.add(tgt.netSlot.tile, tgt.netSlot.side);
        audio.build();
        fx.dust(point);
        events.onBuildNet?.();
      }
      return;
    }
    if (tile.broken) {
      if (inventory.has(COSTS.rebuild)) {
        inventory.spend(COSTS.rebuild);
        raft.rebuild(tile);
        audio.build();
        fx.dust(point);
        events.onRebuild?.(tile);
      } else {
        audio.error();
        events.onMissing?.(COSTS.rebuild);
      }
    } else if (tile.hp < 100) {
      if (inventory.has(COSTS.repair)) {
        inventory.spend(COSTS.repair);
        raft.repair(tile, HAMMER.repairPerHit);
        audio.hammer();
        fx.dust(point);
        events.onRepair?.(tile);
      } else {
        audio.error();
        events.onMissing?.(COSTS.repair);
      }
    } else {
      audio.hammer();
      fx.dust(point);
    }
  }

  function doSpear() {
    const hit = shark.rayHit(camPos, camDir, SPEAR.reach);
    if (hit) {
      shark.hit(events, crafting.hasGear('metalSpear') ? 2 : 1, hit);
      fx.blood(hit);
      fx.splash(hit, 0.5);
      audio.spearHit();
      events.onSpearHit?.(hit);
    }
  }

  function pickUp(d) {
    inventory.add(d.loot);
    audio.pickup();
    events.onCollect?.(d.loot, 'hand');
    debris.remove(d);
  }

  const api = {
    vmScene,
    vmCamera,
    state: st,

    get slot() { return st.slot; },

    setSlot(i, player) {
      if (i === st.slot) return;
      if (st.hook.mode !== 'held') releaseHook(false, player);
      st.slot = (i + SLOTS.length) % SLOTS.length;
      st.swap = 0;
      st.anim = null;
      setHammerMode(slotId() === 'hammer' ? st.hammerMode : null);
    },

    reset() {
      releaseHook(false);
      st.slot = 0;
      st.swap = 1;
      st.anim = null;
      setHammerMode(null);
      st.hammerMode = 'floor';
    },

    // First-person arm lighting follows the time of day.
    setLighting(sunIntensity, sunColor, hemi) {
      vmSun.intensity = sunIntensity * 0.55;
      vmSun.color.copy(sunColor);
      vmHemi.intensity = hemi * 0.9;
    },

    setSleeve(hex) {
      if (hex == null) sleeveMat.color.copy(sleeveBase);
      else sleeveMat.color.setHex(hex);
    },

    resize(w, h) {
      vmCamera.aspect = w / h;
      vmCamera.updateProjectionMatrix();
      ropeMat.resolution.set(w, h);
    },

    update(t, dt, input, player, sunDir) {
      const p = player.state;
      camera.updateMatrixWorld();
      camera.getWorldPosition(camPos);
      camera.getWorldDirection(camDir);
      st.cooldown = Math.max(0, st.cooldown - dt);
      st.swap = Math.min(1, st.swap + dt * 4);

      // Slot selection
      for (let i = 0; i < SLOTS.length; i++) {
        if (input.wasPressed(`Digit${i + 1}`)) api.setSlot(i, player);
      }
      if (input.state.wheel) api.setSlot(st.slot + input.state.wheel, player);

      const id = slotId();
      const m0 = input.state.mouse[0];
      const click = input.state.clicked[0];
      const release = input.state.released[0];
      let prompt = null;

      // Look-at pickup (E)
      st.lookDebris = debris.lookTarget(camPos, camDir, PLAYER.reach + (p.inWater ? 0.6 : 0));
      if (st.lookDebris) {
        prompt = { key: 'E', text: `Pick up ${st.lookDebris.label}` };
        if (input.wasPressed('KeyE')) {
          pickUp(st.lookDebris);
          st.lookDebris = null;
        }
      } else {
        const station = lookStation();
        const net = station ? null : lookNet();
        if (station) {
          prompt = stations.describe(station, inventory);
          if (prompt.act && input.wasPressed('KeyE')) {
            const r = stations.use(station, prompt.act, inventory);
            if (r) events.onStationUse?.(station, prompt.act, r);
          }
        }
        if (net) {
          const n = nets.contentsOf(net);
          prompt = n ? { key: 'E', text: `Empty net (${n} caught)` } : { text: 'Net: nothing caught yet', dim: true };
          if (n && input.wasPressed('KeyE')) {
            const gained = nets.empty(net);
            inventory.add(gained);
            audio.pickup();
            events.onCollect?.(gained, 'net');
          }
        }
      }

      // ----- hook -----
      const h = st.hook;
      if (id === 'hook') {
        if (h.mode === 'held' && click && st.swap >= 1) {
          h.mode = 'charging';
          h.charge = 0;
        }
        if (h.mode === 'charging') {
          h.charge = Math.min(1, h.charge + dt / HOOK.chargeTime);
          if (!m0 || release) {
            handWorld(h.pos).addScaledVector(camDir, 0.3);
            h.vel.copy(camDir).multiplyScalar(lerp(HOOK.minSpeed, HOOK.maxSpeed, h.charge));
            h.vel.y += 2.2;
            h.mode = 'flying';
            worldHook.visible = true;
            rope.visible = true;
            audio.whoosh();
            startAnim('throw', 0.3);
          }
        }
      }
      if (h.mode === 'flying' || h.mode === 'water') {
        if (h.mode === 'flying') {
          h.vel.y -= 9.8 * dt;
          h.pos.addScaledVector(h.vel, dt);
          const water = waveHeight(h.pos.x, h.pos.z, t);
          if (raft.isSupported(h.pos.x, h.pos.z) && h.pos.y <= raft.deckHeightAt(h.pos.x, h.pos.z) + 0.05) {
            audio.hammer();
            releaseHook(true, player);
          } else if (h.pos.y <= water) {
            h.mode = 'water';
            fx.splash(h.pos, 0.5);
            audio.splash(0, false);
          }
        } else {
          h.pos.y = waveHeight(h.pos.x, h.pos.z, t) + 0.04;
          const reeling = id === 'hook' && m0;
          if (reeling) {
            tmp.set(p.pos.x - h.pos.x, 0, p.pos.z - h.pos.z);
            const d = tmp.length();
            if (d > 0.01) h.pos.addScaledVector(tmp.normalize(), Math.min(d, HOOK.reelSpeed * dt));
            h.tick -= dt;
            if (h.tick <= 0) { h.tick = 0.09; audio.reel(); }
          } else {
            h.pos.x += debris.flow.x * 0.5 * dt;
            h.pos.z += debris.flow.z * 0.5 * dt;
          }
          // Snag anything close.
          if (h.carried.length < HOOK.maxCarry) {
            for (const d of debris.near(h.pos.x, h.pos.z, HOOK.grabRadius)) {
              if (h.carried.length >= HOOK.maxCarry) break;
              d.hooked = true;
              h.carried.push(d);
            }
          }
          const hd = Math.hypot(p.pos.x - h.pos.x, p.pos.z - h.pos.z);
          const atRaft = !p.inWater && raft.edgeDistance(h.pos.x, h.pos.z) < 0.25;
          if (hd < 1.3 || atRaft) releaseHook(true, player);
        }
        // The rope only stretches so far.
        tmp.set(h.pos.x - p.pos.x, 0, h.pos.z - p.pos.z);
        const len = tmp.length();
        if (len > HOOK.maxRope) {
          h.pos.x = p.pos.x + (tmp.x / len) * HOOK.maxRope;
          h.pos.z = p.pos.z + (tmp.z / len) * HOOK.maxRope;
          h.vel.x = 0;
          h.vel.z = 0;
        }
        h.carried.forEach((d, i) => {
          d.x = h.pos.x + Math.sin(i * 2.1) * 0.35 * (i ? 1 : 0.3);
          d.z = h.pos.z + Math.cos(i * 2.1) * 0.35 * (i ? 1 : 0.3);
        });
        if (input.state.clicked[2]) releaseHook(false, player);
      }

      if (h.mode !== 'held') {
        worldHook.position.copy(h.pos);
        if (h.mode === 'flying') worldHook.rotation.set(0.6, t * 6, 0);
        else worldHook.rotation.set(Math.sin(t * 2) * 0.12, t * 0.3, Math.sin(t * 1.6) * 0.12);
        // In the water the float rides the surface and the hook hangs below it.
        const inWater = h.mode === 'water';
        bigGrapple.position.y = inWater ? -0.55 : 0;
        float.position.y = floatBand.position.y = inWater ? 0.03 : 0.45;
        handWorld(handW).addScaledVector(camDir, 0.12);
        const ropeEnd = tmp2.copy(h.pos);
        ropeEnd.y += inWater ? 0.08 : 0.45;
        const pts = ropeGeo.attributes.instanceStart.data.array;
        const sag = h.mode === 'flying' ? 0.15 : id === 'hook' && m0 ? 0.25 : 0.9;
        let prev = null;
        let w = 0;
        for (let i = 0; i < ROPE_PTS; i++) {
          const u = i / (ROPE_PTS - 1);
          tmp.lerpVectors(handW, ropeEnd, u);
          tmp.y -= Math.sin(u * Math.PI) * sag;
          if (h.mode === 'water') tmp.y = Math.max(tmp.y, waveHeight(tmp.x, tmp.z, t) + 0.01);
          if (prev) {
            pts[w++] = prev.x; pts[w++] = prev.y; pts[w++] = prev.z;
            pts[w++] = tmp.x; pts[w++] = tmp.y; pts[w++] = tmp.z;
          }
          prev = prev || new THREE.Vector3();
          prev.copy(tmp);
        }
        ropeGeo.attributes.instanceStart.data.needsUpdate = true;
        if (id === 'hook' && h.mode === 'water' && !prompt) {
          prompt = { key: 'Hold', text: h.carried.length ? `Reel in (${h.carried.length} caught)` : 'Reel in' };
        }
      }

      // ----- spear, hammer, coconut -----
      st.hammerTile = null;
      if (id === 'hammer') {
        if ((input.state.clicked[2] || input.wasPressed('KeyR')) && !st.anim) {
          const i = BUILD_MODES.findIndex((b) => b.id === st.hammerMode);
          setHammerMode(BUILD_MODES[(i + 1) % BUILD_MODES.length].id);
          audio.pickup();
        }
        const tgt = hammerTarget();
        if (tgt?.stationSlot) {
          const kind = tgt.stationSlot.kind;
          prompt = { key: 'Click', text: `Build a ${STATIONS[kind].name.toLowerCase()}`, cost: costText(COSTS[kind]), ok: inventory.has(COSTS[kind]) };
        } else if (tgt?.build) {
          prompt = { key: 'Click', text: 'Build floor', cost: costText(COSTS.floor), ok: inventory.has(COSTS.floor) };
        } else if (tgt?.netSlot) {
          prompt = { key: 'Click', text: 'Put up a catch net', cost: costText(COSTS.net), ok: inventory.has(COSTS.net) };
        } else if (tgt) {
          st.hammerTile = tgt.tile;
          const tl = tgt.tile;
          if (tl.broken) {
            const ok = inventory.has(COSTS.rebuild);
            prompt = { key: 'Click', text: 'Rebuild floor', cost: costText(COSTS.rebuild), ok };
          } else if (tl.hp < 100) {
            const ok = inventory.has(COSTS.repair);
            prompt = { key: 'Click', text: `Repair floor (${Math.round(tl.hp)}%)`, cost: costText(COSTS.repair), ok };
          } else if (!prompt) {
            prompt = { text: 'Floor is solid', dim: true };
          }
        }
      }

      if (click && st.cooldown <= 0 && st.swap >= 1 && !st.anim) {
        if (id === 'spear') {
          startAnim('thrust', 0.34);
          st.cooldown = SPEAR.cooldown;
          audio.swing();
        } else if (id === 'hammer') {
          startAnim('swing', 0.42);
          st.cooldown = HAMMER.cooldown;
        } else if (id === 'coconut' || id === 'fish' || id === 'cooked') {
          if (inventory.get(id) > 0) {
            startAnim('eat', 1.0);
            st.cooldown = 1.1;
          } else {
            audio.error();
            events.onMissing?.({ [id]: 1 });
          }
        }
      }
      // Right-click with a fish: throw it as bait.
      if (id === 'fish' && input.state.clicked[2] && st.swap >= 1 && !st.anim) {
        if (inventory.get('fish') > 0) {
          inventory.spend({ fish: 1 });
          startAnim('throw', 0.3);
          st.cooldown = 0.5;
          bait.throw(handWorld(tmp2).addScaledVector(camDir, 0.3).clone(), camDir);
          events.onBaitThrown?.();
        } else {
          audio.error();
          events.onMissing?.({ fish: 1 });
        }
      }

      // ----- view model animation -----
      let ox = 0, oy = 0, oz = 0, rx = 0, ry = 0, rz = 0;
      const a = st.anim;
      if (a) {
        a.t += dt;
        const k = Math.min(1, a.t / a.dur);
        if (a.type === 'thrust') {
          const f = k < 0.35 ? easeOut(k / 0.35) : 1 - easeInOut((k - 0.35) / 0.65);
          oz -= 0.55 * f; oy += 0.06 * f; ox -= 0.08 * f;
          if (!a.fired && k >= 0.3) { a.fired = true; doSpear(); }
        } else if (a.type === 'swing') {
          let r;
          if (k < 0.4) r = easeOut(k / 0.4) * 0.9;
          else if (k < 0.58) r = lerp(0.9, -0.75, easeInOut((k - 0.4) / 0.18));
          else r = lerp(-0.75, 0, easeInOut((k - 0.58) / 0.42));
          rx += r;
          oy += Math.max(0, r) * 0.06;
          if (!a.fired && k >= 0.55) { a.fired = true; doHammer(); }
        } else if (a.type === 'throw') {
          const f = Math.sin(k * Math.PI);
          oz -= 0.18 * f; rx -= 0.5 * f;
        } else if (a.type === 'eat') {
          const f = k < 0.35 ? easeInOut(k / 0.35) : k < 0.75 ? 1 : 1 - easeInOut((k - 0.75) / 0.25);
          ox -= 0.24 * f; oy += 0.17 * f; oz += 0.2 * f; rx += 0.6 * f;
          if (f > 0.9) oy += Math.sin(a.t * 30) * 0.008;
          if (!a.fired && k >= 0.6) {
            a.fired = true;
            const food = id === 'fish' ? FISH : id === 'cooked' ? COOKED : COCONUT;
            if ((id === 'coconut' || id === 'fish' || id === 'cooked') && inventory.get(id) > 0) {
              inventory.spend({ [id]: 1 });
              stats.hunger = Math.min(100, stats.hunger + food.hunger);
              stats.thirst = Math.min(100, stats.thirst + food.thirst);
              audio.eat();
              events.onEat?.(id);
            }
          }
        }
        if (k >= 1) st.anim = null;
      }
      if (id === 'hook' && h.mode === 'charging') {
        oz += 0.14 * h.charge; oy += 0.04 * h.charge; rx += 0.7 * h.charge;
        ox += Math.sin(t * 40) * 0.003 * h.charge;
      }
      if (id === 'hook' && h.mode === 'water' && m0) {
        rz += Math.sin(t * 16) * 0.3;
        oy += Math.cos(t * 16) * 0.015;
      }

      // Sway with mouse movement and walking.
      st.sway.x = damp(st.sway.x, clamp(-input.state.lookX * 0.0009, -0.05, 0.05), 10, dt);
      st.sway.y = damp(st.sway.y, clamp(input.state.lookY * 0.0009, -0.05, 0.05), 10, dt);
      const walk = p.moveAmount * (p.inWater ? 0.5 : 1);
      ox += st.sway.x + Math.sin(p.walkPhase) * 0.014 * walk;
      oy += st.sway.y + Math.abs(Math.cos(p.walkPhase)) * 0.016 * walk - (1 - easeOut(st.swap)) * 0.35;
      if (p.inWater) oy -= 0.06 + Math.sin(t * 2) * 0.01;

      const pose = POSE[id];
      const base = pose.arm;
      hand.rotation.set(pose.hand[0], pose.hand[1], pose.hand[2]);
      arm.position.set(base[0] + ox, base[1] + oy, base[2] + oz);
      arm.rotation.set(base[3] + rx, base[4] + ry, base[5] + rz);
      for (const k in models) models[k].visible = k === id;
      heldGrapple.visible = h.mode === 'held' || h.mode === 'charging';
      danglingLine.visible = heldGrapple.visible;
      coil.visible = id === 'hook';
      models.coconut.visible = id === 'coconut' && inventory.get('coconut') > 0;
      models.fish.visible = id === 'fish' && inventory.get('fish') > 0;
      models.cooked.visible = id === 'cooked' && inventory.get('cooked') > 0;
      if (spearBlade) spearBlade.material = crafting.hasGear('metalSpear') ? MAT.metal : MAT.stone;

      // Light the view model from the real sun direction.
      camQuatInv.copy(camera.quaternion).invert();
      vmSun.position.copy(sunDir).applyQuaternion(camQuatInv).multiplyScalar(5);

      if (p.inWater && p.canClimb && !prompt) prompt = { key: 'Space', text: 'Climb aboard' };

      st.prompt = prompt;
      return {
        prompt,
        charge: h.mode === 'charging' ? h.charge : 0,
        slot: st.slot,
        hammerMode: st.hammerMode,
        hookOut: h.mode !== 'held' && h.mode !== 'charging',
      };
    },

  };

  return api;
}
