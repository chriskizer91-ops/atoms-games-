import * as THREE from 'three';
import { EYE } from './config.js';
import { waveHeight } from './ocean.js';
import { damp } from './util.js';

// First person or over the shoulder (V switches). The game itself always
// works from your eyes: reach, aim and the tools all use the eye view. In
// third person the picture is taken from a camera on a boom behind you, and
// the eye view is turned a little so that what you'd reach for is what the
// crosshair is on.
//
// The body is one of the fair folk from Moon Faire (src/people), dressed as a
// castaway: it walks, runs, swims, steers and swings whatever you're holding.

const BOOM = 3.3;          // metres behind
const SHOULDER = 0.55;     // metres to the right
const RISE = 0.35;         // metres above the head pivot

export function createView(camera) {
  const st = {
    third: false,
    k: 0,                 // 0 through your eyes .. 1 fully behind
    body: null,
    lastX: 0, lastZ: 0, speed: 0, swim: 0, run: 0, steer: 0,
    anim: null,
  };
  const dir = new THREE.Vector3();
  const right = new THREE.Vector3();
  const pivot = new THREE.Vector3();
  const boomPos = new THREE.Vector3();
  const boomQuat = new THREE.Quaternion();
  const aimAt = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const held = {};        // slot id -> model in the body's right hand
  const upd = { speed: 0, swim: 0, moving: 0, hold: null, steer: 0 };

  function boom(p, t) {
    const cp = Math.cos(p.pitch);
    dir.set(-Math.sin(p.yaw) * cp, Math.sin(p.pitch), -Math.cos(p.yaw) * cp);
    right.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const len = BOOM * st.k;
    pivot.set(p.pos.x, p.pos.y + EYE - 0.1, p.pos.z).addScaledVector(right, SHOULDER * st.k);
    boomPos.copy(pivot).addScaledVector(dir, -len);
    boomPos.y += RISE * st.k;
    // Never under the sea.
    const sea = waveHeight(boomPos.x, boomPos.z, t) + 0.3;
    if (boomPos.y < sea) boomPos.y = sea;
    boomQuat.setFromEuler(euler.set(p.pitch, p.yaw, 0));
  }

  return {
    state: st,
    get third() { return st.third; },
    // Is the picture close enough to your eyes to show your own arms?
    get eyes() { return st.k < 0.04; },
    toggle() { st.third = !st.third; return st.third; },
    set(third) { st.third = !!third; },

    setBody(body, models) {
      if (st.body) st.body.setVisible(false);
      st.body = body;
      for (const k in held) delete held[k];
      Object.assign(held, models || {});
      for (const k in held) body.handR.add(held[k]);
      body.setVisible(false);
    },

    // Right after the player has moved: turn the eye view toward what the
    // crosshair is on, so tools and reach agree with the picture.
    aim(p, t, dt) {
      st.k = damp(st.k, st.third ? 1 : 0, 7, dt);
      if (st.k < 0.001) { st.k = 0; return; }
      boom(p, t);
      aimAt.copy(boomPos).addScaledVector(dir, BOOM * st.k + 7);
      camera.lookAt(aimAt);
      camera.updateMatrixWorld();
    },

    // Last thing before the picture is taken: move the camera out onto the boom.
    apply(p, t) {
      if (st.k <= 0) return;
      boom(p, t);
      camera.position.copy(boomPos);
      camera.quaternion.copy(boomQuat);
      camera.updateMatrixWorld();
    },

    // Put the body where you are and keep it moving as you do.
    // info: { slot (what's in hand), sprint, anim (the tool swing in progress, or null), showFood }
    updateBody(dt, p, info) {
      const b = st.body;
      if (!b) return;
      const show = st.k > 0.3;
      b.setVisible(show);
      const dx = p.pos.x - st.lastX, dz = p.pos.z - st.lastZ;
      st.lastX = p.pos.x;
      st.lastZ = p.pos.z;
      if (!show) return;
      const v = dt > 0 ? Math.min(6, Math.hypot(dx, dz) / dt) : 0;
      st.speed = damp(st.speed, v, 10, dt);
      st.swim = damp(st.swim, p.inWater ? 1 : 0, 6, dt);
      st.run = damp(st.run, info.sprint && p.moveAmount > 0.5 ? 1 : 0, 6, dt);
      st.steer = damp(st.steer, p.helm ? 1 : 0, 6, dt);
      // In the water the body hangs from the surface: shoulders awash.
      const y = p.inWater ? p.pos.y + EYE - 0.32 - b.shoulderHeight : p.pos.y;
      b.root.position.set(p.pos.x, y, p.pos.z);
      b.root.rotation.y = p.yaw + Math.PI;
      for (const k in held) held[k].visible = k === info.slot && !p.inWater && info.inHand !== false;
      // One-shot moves follow the tool's own swing.
      if (info.anim && info.anim !== st.anim) {
        const move = { thrust: 'stab', swing: 'swing', throw: 'throw', eat: 'eat' }[info.anim.type];
        if (move) b.play(move);
      }
      st.anim = info.anim;
      // Moon Faire's skin glows a little for a night fair: out here, only by day.
      b.glow = 0.25 * (info.daylight ?? 1);
      upd.speed = st.speed; upd.swim = st.swim; upd.moving = p.moveAmount; upd.hold = p.inWater || p.helm ? null : info.slot === 'rod' ? 'hook' : info.slot; upd.steer = st.steer;
      b.update(dt, upd);
    },

    // On the title screen: standing on the raft, looking out.
    pose(dt, x, y, z, yaw) {
      const b = st.body;
      if (!b) return;
      b.setVisible(true);
      for (const k in held) held[k].visible = false;
      b.root.position.set(x, y, z);
      b.root.rotation.y = yaw;
      upd.speed = 0; upd.swim = 0; upd.moving = 0; upd.hold = null; upd.steer = 0;
      b.update(dt, upd);
    },
  };
}
