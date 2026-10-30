import * as THREE from 'three';
import { DECK_Y, EYE, SWIM_EYE, PLAYER } from './config.js';
import { waveHeight } from './ocean.js';
import { clamp, damp } from './util.js';

const SENS = 0.0022;

export function createPlayer(camera) {
  camera.rotation.order = 'YXZ';
  const p = {
    pos: new THREE.Vector3(0, DECK_Y, 0.4),
    velY: 0,
    yaw: 0,
    pitch: -0.08,
    inWater: false,
    grounded: true,
    walkPhase: 0,
    moveAmount: 0,
    canClimb: false,
    eyeBob: 0,
    shove: { x: 0, z: 0, t: 0 },
  };
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const wish = new THREE.Vector3();

  return {
    state: p,

    reset() {
      p.pos.set(0, DECK_Y, 0.4);
      p.velY = 0;
      p.yaw = 0;
      p.pitch = -0.08;
      p.inWater = false;
      p.grounded = true;
    },

    // Thrown sideways (a hammerhead hitting the raft). Usually ends in the water.
    knock(dx, dz) {
      if (p.inWater) return;
      p.shove.x = dx * 4.2;
      p.shove.z = dz * 4.2;
      p.shove.t = 0.4;
      p.grounded = false;
      p.velY = 3.4;
    },

    serialize() {
      return { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, pitch: p.pitch, inWater: p.inWater };
    },

    restore(d) {
      if (!d) return;
      p.pos.set(d.x, d.y, d.z);
      p.yaw = d.yaw;
      p.pitch = d.pitch;
      p.inWater = !!d.inWater;
      p.grounded = !p.inWater;
      p.velY = 0;
    },

    // land: optional { heightAt(x, z) } for islands (-Infinity where there is none).
    update(t, dt, input, raft, events, swimBoost = 0, land = null) {
      // Look
      p.yaw -= input.state.lookX * SENS;
      p.pitch = clamp(p.pitch - input.state.lookY * SENS, -1.5, 1.5);
      p.yaw -= input.edgeTurn() * 2.4 * dt;

      // Move
      fwd.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      right.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
      wish.set(0, 0, 0);
      if (input.move('forward')) wish.add(fwd);
      if (input.move('back')) wish.sub(fwd);
      if (input.move('right')) wish.add(right);
      if (input.move('left')) wish.sub(right);
      const moving = wish.lengthSq() > 0;
      if (moving) wish.normalize();
      const sprint = input.move('sprint');
      p.moveAmount = damp(p.moveAmount, moving ? 1 : 0, 8, dt);

      if (!p.inWater) {
        const speed = sprint ? PLAYER.sprint : PLAYER.walk;
        p.pos.x += wish.x * speed * dt;
        p.pos.z += wish.z * speed * dt;
        if (p.shove.t > 0) {
          p.shove.t -= dt;
          p.pos.x += p.shove.x * dt;
          p.pos.z += p.shove.z * dt;
        }
        // Standing on the raft deck, or on island ground above the waterline.
        const onDeck = raft.isSupported(p.pos.x, p.pos.z);
        const landH = land ? land.heightAt(p.pos.x, p.pos.z) : -Infinity;
        const onLand = landH > waveHeight(p.pos.x, p.pos.z, t) - 0.2;
        const supported = onDeck || onLand;
        const ground = Math.max(onDeck ? raft.deckHeightAt(p.pos.x, p.pos.z) : -Infinity, onLand ? landH : -Infinity);
        p.onLand = onLand && !onDeck;
        if (p.grounded && supported) {
          p.pos.y = ground;
          if (input.movePressed('jump')) {
            p.velY = PLAYER.jump;
            p.grounded = false;
          }
        } else {
          if (p.grounded && !supported) {
            p.grounded = false;
            p.velY = 0;
          }
          p.velY -= PLAYER.gravity * dt;
          p.pos.y += p.velY * dt;
          if (supported && p.velY <= 0 && p.pos.y <= ground && p.pos.y > ground - (onLand ? 1.2 : 0.35)) {
            p.pos.y = ground;
            p.velY = 0;
            p.grounded = true;
            events.onLand?.();
          }
        }
        const water = waveHeight(p.pos.x, p.pos.z, t);
        if (!p.grounded && p.pos.y < water - 0.8) {
          p.inWater = true;
          p.velY = 0;
          events.onEnterWater?.(p.pos.clone());
        }
        if (p.grounded && moving) p.walkPhase += dt * speed * 2.1;
        p.canClimb = false;
      } else {
        p.onLand = false;
        const speed = (sprint ? PLAYER.swimSprint : PLAYER.swim) * (1 + swimBoost);
        p.pos.x += wish.x * speed * dt;
        p.pos.z += wish.z * speed * dt;
        raft.pushOut(p.pos, PLAYER.radius);
        const water = waveHeight(p.pos.x, p.pos.z, t);
        p.pos.y = damp(p.pos.y, water + SWIM_EYE - EYE, 8, dt);
        if (moving) p.walkPhase += dt * speed * 1.4;

        // Wade ashore where the island floor comes up near the surface.
        const landH = land ? land.heightAt(p.pos.x, p.pos.z) : -Infinity;
        if (landH > water - 0.2) {
          p.inWater = false;
          p.grounded = true;
          p.velY = 0;
          p.pos.y = landH;
          events.onWadeAshore?.();
        }

        // Soft limit so you can't swim off forever.
        const c = raft.center();
        const dx = p.pos.x - c.x, dz = p.pos.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d > 90) {
          p.pos.x = c.x + (dx / d) * 90;
          p.pos.z = c.z + (dz / d) * 90;
        }

        p.canClimb = raft.edgeDistance(p.pos.x, p.pos.z) < 0.8;
        if (p.canClimb && input.movePressed('jump')) {
          const cp = raft.climbPoint(p.pos.x, p.pos.z);
          if (cp) {
            p.pos.set(cp.x, raft.deckHeightAt(cp.x, cp.z), cp.z);
            p.inWater = false;
            p.grounded = true;
            p.velY = 0;
            events.onClimb?.();
          }
        }
      }

      // Camera
      const bob = p.inWater
        ? 0
        : Math.sin(p.walkPhase * 2) * 0.035 * p.moveAmount * (p.grounded ? 1 : 0);
      camera.position.set(p.pos.x, p.pos.y + EYE + bob, p.pos.z);
      camera.rotation.set(p.pitch, p.yaw, p.inWater ? Math.sin(t * 1.3) * 0.03 : 0);
    },
  };
}

