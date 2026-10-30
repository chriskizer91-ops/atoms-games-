import * as THREE from 'three';
import { BAIT } from './config.js';
import { waveHeight } from './ocean.js';
import { makeFish } from './nets.js';

// Thrown fish: flies, lands, floats and leaves a faint trail of scent the
// shark can follow. It sinks after a while if nothing eats it.
export function createBait(scene, fx, audio) {
  const items = [];
  let returned = () => {};

  function removeAt(i) {
    scene.remove(items[i].mesh);
    items.splice(i, 1);
  }

  return {
    items,
    onReturn(fn) { returned = fn; },

    throw(from, dir) {
      const mesh = makeFish();
      mesh.scale.setScalar(1.3);
      mesh.position.copy(from);
      scene.add(mesh);
      const vel = dir.clone().multiplyScalar(BAIT.throwSpeed);
      vel.y += 3;
      items.push({ mesh, pos: from.clone(), vel, mode: 'flying', life: BAIT.life, scent: 0, spin: Math.random() * 6 });
      audio.whoosh();
    },

    // Freshest bait floating within range of a point, or null.
    nearest(x, z, range) {
      let best = null, bestD = range;
      for (const b of items) {
        if (b.mode !== 'water') continue;
        const d = Math.hypot(b.pos.x - x, b.pos.z - z);
        if (d < bestD) { bestD = d; best = b; }
      }
      return best;
    },

    consume(b) {
      const i = items.indexOf(b);
      if (i >= 0) removeAt(i);
    },

    alive(b) {
      return items.includes(b);
    },

    clear() {
      while (items.length) removeAt(0);
    },

    update(t, dt, raft, flow) {
      for (let i = items.length - 1; i >= 0; i--) {
        const b = items[i];
        if (b.mode === 'flying') {
          b.vel.y -= 9.8 * dt;
          b.pos.addScaledVector(b.vel, dt);
          b.spin += dt * 9;
          b.mesh.rotation.set(b.spin, b.spin * 0.6, 0);
          if (raft.isSupported(b.pos.x, b.pos.z) && b.pos.y <= raft.deckHeightAt(b.pos.x, b.pos.z) + 0.05) {
            // Landed on the deck: back into the pack.
            removeAt(i);
            returned();
            continue;
          }
          if (b.pos.y <= waveHeight(b.pos.x, b.pos.z, t)) {
            b.mode = 'water';
            fx.splash(b.pos, 0.45);
            audio.splash(0, false);
          }
        } else {
          b.life -= dt;
          b.pos.x += flow.x * 0.6 * dt;
          b.pos.z += flow.z * 0.6 * dt;
          b.pos.y = waveHeight(b.pos.x, b.pos.z, t) - 0.03;
          b.mesh.rotation.set(Math.PI / 2, t * 0.4, Math.sin(t * 2) * 0.2);
          b.scent -= dt;
          if (b.scent <= 0) {
            b.scent = 0.5;
            fx.scent(b.pos);
          }
          if (b.life <= 0) {
            removeAt(i);
            continue;
          }
        }
        b.mesh.position.copy(b.pos);
      }
    },
  };
}
