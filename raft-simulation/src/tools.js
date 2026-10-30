import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { HOOK, SPEAR, HAMMER, COSTS, COCONUT, PLAYER } from './config.js';
import { waveHeight } from './ocean.js';
import { clamp, damp, lerp } from './util.js';

export const SLOTS = [
  { id: 'hook', name: 'Rope hook' },
  { id: 'spear', name: 'Spear' },
  { id: 'hammer', name: 'Hammer' },
  { id: 'coconut', name: 'Coconut' },
];

const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });
const MAT = {
  skin: lam(0xd29a72),
  sleeve: lam(0xc9bc9a),
  cuff: lam(0x8f7f62),
  wood: lam(0x8a6038),
  woodLight: lam(0xb18456),
  rope: lam(0xcdb27c),
  metal: new THREE.MeshPhongMaterial({ color: 0x9aa3a9, flatShading: true, shininess: 90, specular: 0x777777 }),
  stone: lam(0x7a7e80),
  coconut: lam(0x5b3a22),
  husk: lam(0x7a5631),
};

const UP = new THREE.Vector3(0, 1, 0);
function rod(a, b, r, mat, sides = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, sides), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Three-pronged throwing hook, used in the hand and out on the water.
function makeGrapple() {
  const g = new THREE.Group();
  g.add(rod(V(0, 0, 0), V(0, 0.17, 0), 0.011, MAT.metal));
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 5, 10), MAT.metal);
  eye.position.y = 0.19;
  g.add(eye);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const p1 = V(c * 0.055, -0.03, s * 0.055);
    const p2 = V(c * 0.07, 0.04, s * 0.07);
    g.add(rod(V(0, 0, 0), p1, 0.009, MAT.metal));
    g.add(rod(p1, p2, 0.008, MAT.metal));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 5), MAT.metal);
    tip.position.copy(p2).add(V(0, 0.012, 0));
    g.add(tip);
  }
  return g;
}

function makeSpear() {
  const g = new THREE.Group();
  g.add(rod(V(0, 0, 0.5), V(0, 0, -1.3), 0.017, MAT.woodLight));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.17, 5), MAT.stone);
  tip.rotation.x = -Math.PI / 2;
  tip.position.z = -1.38;
  g.add(tip);
  g.add(rod(V(0, 0, -1.24), V(0, 0, -1.32), 0.024, MAT.rope));
  g.add(rod(V(0, 0, -0.02), V(0, 0, 0.1), 0.021, MAT.rope));
  return g;
}

function makeHammer() {
  const g = new THREE.Group();
  g.add(rod(V(0, -0.1, 0), V(0, 0.27, 0), 0.016, MAT.wood));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.18), MAT.stone);
  head.position.set(0, 0.28, -0.02);
  g.add(head);
  const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.04, 0.05), MAT.rope);
  wrap.position.set(0, 0.28, -0.02);
  g.add(wrap);
  return g;
}

function makeCoconut() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 1), MAT.coconut));
  const h = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.04, 5), MAT.husk);
  h.position.y = 0.085;
  g.add(h);
  return g;
}

const easeOut = (x) => 1 - (1 - x) * (1 - x);
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

export function createTools({ scene, camera, raft, debris, shark, fx, audio, inventory, stats, events }) {
  // ----- first-person view model, drawn in its own pass so it never clips -----
  const vmScene = new THREE.Scene();
  const vmCamera = new THREE.PerspectiveCamera(65, 1, 0.01, 10);
  vmScene.add(new THREE.HemisphereLight(0xdbefff, 0x34505e, 1.25));
  const vmSun = new THREE.DirectionalLight(0xfff1d6, 1.5);
  vmScene.add(vmSun, vmSun.target);

  // Low-poly forearm reaching in from the lower right; the sleeve is the
  // part clothing will recolour later.
  const arm = new THREE.Group();
  const along = (g) => g.rotateX(Math.PI / 2);
  const forearm = new THREE.Mesh(along(new THREE.CylinderGeometry(0.036, 0.046, 0.44, 7)), MAT.skin);
  forearm.position.z = 0.24;
  const sleeve = new THREE.Mesh(along(new THREE.CylinderGeometry(0.058, 0.064, 0.26, 7)), MAT.sleeve);
  sleeve.position.z = 0.44;
  const cuff = new THREE.Mesh(along(new THREE.CylinderGeometry(0.06, 0.06, 0.035, 7)), MAT.cuff);
  cuff.position.z = 0.31;
  const hand = new THREE.Group();
  const fist = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1).scale(1, 0.85, 1.15), MAT.skin);
  const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.03, 0.035), MAT.skin);
  knuckles.position.set(0, 0.03, -0.035);
  const thumb = new THREE.Mesh(along(new THREE.CylinderGeometry(0.014, 0.017, 0.055, 5)), MAT.skin);
  thumb.position.set(-0.046, 0.025, -0.02);
  thumb.rotation.y = 0.5;
  hand.add(fist, knuckles, thumb);
  arm.add(forearm, sleeve, cuff, hand);
  vmScene.add(arm);

  const models = {
    hook: new THREE.Group(),
    spear: makeSpear(),
    hammer: makeHammer(),
    coconut: makeCoconut(),
  };
  // Grappling hook gripped by the shank, prongs forward; spare line coiled on the wrist.
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.011, 5, 14), MAT.rope);
  coil.position.z = 0.1;
  models.hook.add(coil);
  const heldGrapple = makeGrapple();
  heldGrapple.rotation.set(Math.PI / 2 - 0.35, 0, 0);
  heldGrapple.position.set(0, 0.035, 0.05);
  models.hook.add(heldGrapple);
  const danglingLine = rod(V(0.0, -0.02, 0.07), V(0.01, -0.06, 0.1), 0.005, MAT.rope);
  models.hook.add(danglingLine);

  models.spear.rotation.set(0.1, 0.13, 0);
  models.hammer.rotation.set(-0.35, 0.1, 0.15);
  models.hammer.scale.setScalar(0.8);
  models.coconut.position.set(-0.01, 0.06, -0.06);
  for (const k in models) hand.add(models[k]);

  // ----- the thrown hook and its rope, out in the world -----
  const worldHook = new THREE.Group();
  const bigGrapple = makeGrapple();
  bigGrapple.scale.setScalar(2.2);
  worldHook.add(bigGrapple);
  // Bright float so you can see where the hook landed.
  const float = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), lam(0xf06a2a));
  const floatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.093, 0.093, 0.04, 10), lam(0xf4efe4));
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

  function hammerTarget() {
    ray.set(camPos, camDir);
    ray.far = HAMMER.reach;
    const hits = ray.intersectObjects(raft.hammerTargets(), false);
    return hits.length ? { tile: hits[0].object.userData.tile, point: hits[0].point } : null;
  }

  function costText(cost) {
    return Object.entries(cost)
      .map(([k, n]) => `${n} ${k === 'fiber' ? 'palm fiber' : k}`)
      .join(' · ');
  }

  function doHammer() {
    const tgt = hammerTarget();
    if (!tgt) {
      audio.swing();
      return;
    }
    const { tile, point } = tgt;
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
      shark.hit(events);
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
      raft.setBuildMode(slotId() === 'hammer');
    },

    reset() {
      releaseHook(false);
      st.slot = 0;
      st.swap = 1;
      st.anim = null;
      raft.setBuildMode(false);
    },

    resize(w, h) {
      vmCamera.aspect = w / h;
      vmCamera.updateProjectionMatrix();
      ropeMat.resolution.set(w, h);
    },

    update(t, dt, input, player, sunDir) {
      const p = player.state;
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
        const tgt = hammerTarget();
        if (tgt) {
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
        } else if (id === 'coconut') {
          if (inventory.get('coconut') > 0) {
            startAnim('eat', 1.0);
            st.cooldown = 1.1;
          } else {
            audio.error();
            events.onMissing?.({ coconut: 1 });
          }
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
            if (inventory.get('coconut') > 0) {
              inventory.spend({ coconut: 1 });
              stats.hunger = Math.min(100, stats.hunger + COCONUT.hunger);
              stats.thirst = Math.min(100, stats.thirst + COCONUT.thirst);
              audio.eat();
              events.onEat?.();
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

      const base = {
        hook: [0.25, -0.2, -0.44, 0.1, 0.22, 0],
        spear: [0.24, -0.22, -0.4, 0.02, 0.12, -0.1],
        hammer: [0.28, -0.25, -0.52, 0.15, 0.2, 0],
        coconut: [0.24, -0.2, -0.44, 0.1, 0.22, 0],
      }[id];
      arm.position.set(base[0] + ox, base[1] + oy, base[2] + oz);
      arm.rotation.set(base[3] + rx, base[4] + ry, base[5] + rz);
      for (const k in models) models[k].visible = k === id;
      heldGrapple.visible = h.mode === 'held' || h.mode === 'charging';
      danglingLine.visible = heldGrapple.visible;
      models.coconut.visible = id === 'coconut' && inventory.get('coconut') > 0;

      // Light the view model from the real sun direction.
      camQuatInv.copy(camera.quaternion).invert();
      vmSun.position.copy(sunDir).applyQuaternion(camQuatInv).multiplyScalar(5);

      if (p.inWater && p.canClimb && !prompt) prompt = { key: 'Space', text: 'Climb aboard' };

      st.prompt = prompt;
      return {
        prompt,
        charge: h.mode === 'charging' ? h.charge : 0,
        slot: st.slot,
        hookOut: h.mode !== 'held' && h.mode !== 'charging',
      };
    },

    render(renderer) {
      renderer.clearDepth();
      renderer.render(vmScene, vmCamera);
    },
  };

  return api;
}
