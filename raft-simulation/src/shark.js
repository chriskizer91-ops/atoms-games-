import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharkTexture } from './textures.js';
import { waveHeight } from './ocean.js';
import { clamp, damp, rand, turnToward, smoothstep } from './util.js';

// ---------- model: smooth lathe body, extruded fins, painted skin ----------

function finGeometry(shape, thick) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: thick * 0.6, bevelSegments: 2, curveSegments: 8,
  });
  g.translate(0, 0, -thick / 2);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  return mergeVertices(g);
}

function buildFins(L) {
  const S = (pts) => {
    // pts: ['m', x, y] / ['q', cx, cy, x, y] in body lengths
    const sh = new THREE.Shape();
    for (const p of pts) {
      if (p[0] === 'm') sh.moveTo(p[1] * L, p[2] * L);
      else sh.quadraticCurveTo(p[1] * L, p[2] * L, p[3] * L, p[4] * L);
    }
    return sh;
  };
  const sideways = new THREE.Matrix4().makeRotationY(-Math.PI / 2); // shape x -> body z, extrusion -> body x
  const t = 0.014 * L;
  const parts = [];

  const dorsal = finGeometry(S([['m', 0.1, -0.03], ['q', 0.04, 0.12, -0.11, 0.21], ['q', -0.075, 0.1, -0.1, 0.0], ['q', 0, -0.04, 0.1, -0.03]]), t);
  dorsal.applyMatrix4(sideways).translate(0, 0.105 * L, 0);
  parts.push(dorsal);

  const second = finGeometry(S([['m', -0.29, 0], ['q', -0.31, 0.05, -0.36, 0.08], ['q', -0.35, 0.03, -0.37, 0.0], ['q', -0.33, -0.01, -0.29, 0]]), t * 0.6);
  second.applyMatrix4(sideways).translate(0, 0.05 * L, 0);
  parts.push(second);

  const anal = finGeometry(S([['m', -0.27, 0], ['q', -0.3, -0.04, -0.34, -0.06], ['q', -0.33, -0.02, -0.35, 0.0], ['q', -0.31, 0.01, -0.27, 0]]), t * 0.6);
  anal.applyMatrix4(sideways).translate(0, -0.035 * L, 0);
  parts.push(anal);

  // Crescent tail, upper lobe longer.
  const tail = finGeometry(S([
    ['m', -0.43, 0.03],
    ['q', -0.5, 0.15, -0.67, 0.27],
    ['q', -0.6, 0.11, -0.57, 0.0],
    ['q', -0.58, -0.07, -0.62, -0.15],
    ['q', -0.51, -0.09, -0.45, -0.03],
    ['q', -0.44, 0, -0.43, 0.03],
  ]), t * 0.8);
  tail.applyMatrix4(sideways);
  parts.push(tail);

  for (const sgn of [1, -1]) {
    const pec = finGeometry(S([['m', 0.06, 0], ['q', 0.03, 0.15, -0.09, 0.27], ['q', -0.07, 0.12, -0.06, 0.0], ['q', 0, -0.01, 0.06, 0]]), t * 0.8);
    pec.applyMatrix4(sideways);
    pec.rotateZ(-sgn * (Math.PI / 2 + 0.5));
    pec.translate(sgn * 0.08 * L, -0.07 * L, 0.17 * L);
    parts.push(pec);

    const pelvic = finGeometry(S([['m', -0.12, 0], ['q', -0.14, 0.05, -0.19, 0.07], ['q', -0.18, 0.02, -0.19, 0.0], ['q', -0.15, -0.01, -0.12, 0]]), t * 0.6);
    pelvic.applyMatrix4(sideways);
    pelvic.rotateZ(-sgn * (Math.PI / 2 + 0.9));
    pelvic.translate(sgn * 0.05 * L, -0.08 * L, 0);
    parts.push(pelvic);
  }
  return mergeGeometries(parts);
}

function buildBody(L) {
  // Radius profile, snout first. After the reverse below, v runs tail (0) to snout (1).
  const prof = [
    [0.5, 0.0], [0.493, 0.022], [0.475, 0.044], [0.445, 0.065], [0.4, 0.086], [0.34, 0.106], [0.27, 0.122],
    [0.18, 0.134], [0.08, 0.138], [-0.02, 0.133], [-0.12, 0.119], [-0.22, 0.098], [-0.3, 0.076], [-0.37, 0.055],
    [-0.42, 0.041], [-0.46, 0.032], [-0.49, 0.024], [-0.5, 0.0],
  ].map(([y, r]) => new THREE.Vector2(r * L, y * L)).reverse(); // lathe wants rising y for outward faces
  const g = new THREE.LatheGeometry(prof, 20);
  g.rotateX(Math.PI / 2); // snout toward +z, u = 0.5 on top of the back
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * 0.8);
    pos.setY(i, y < 0 ? y * 0.8 : y * 0.95); // flatter belly
  }
  g.computeVertexNormals();
  return g;
}

function buildShark(tier) {
  const L = tier.length;
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';

  const bodyGeo = buildBody(L);
  // Wet but not mirror-like: a soft, weak highlight so the low sun doesn't bleach the back.
  const material = new THREE.MeshPhysicalMaterial({ map: sharkTexture(tier.color, tier.belly), roughness: 0.62, specularIntensity: 0.3, envMapIntensity: 0.6 });
  const body = new THREE.Mesh(bodyGeo, material);
  body.frustumCulled = false;
  group.add(body);

  const finGeo = buildFins(L);
  const finMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(tier.color).multiplyScalar(0.92), roughness: 0.62, specularIntensity: 0.3, envMapIntensity: 0.6 });
  const fins = new THREE.Mesh(finGeo, finMat);
  fins.frustumCulled = false;
  group.add(fins);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.08 });
  const eyeGeo = new THREE.SphereGeometry(0.0072 * L, 10, 8);
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(eyeGeo, eyeMat);
    e.position.set(sx * 0.064 * L, 0.028 * L, 0.385 * L);
    group.add(e);
  }

  // Lower jaw on a hinge under the head, with a dark mouth and a row of teeth.
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.05 * L, 0.33 * L);
  const jawMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * L, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(0.95, 0.4, 1.6),
    new THREE.MeshStandardMaterial({ color: tier.belly, roughness: 0.45 })
  );
  jawMesh.position.z = 0.05 * L;
  jaw.add(jawMesh);
  const mouth = new THREE.Mesh(
    new THREE.CircleGeometry(0.05 * L, 14).rotateX(-Math.PI / 2).scale(1, 1, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x4a1418, roughness: 0.6 })
  );
  mouth.position.set(0, 0.002 * L, 0.05 * L);
  jaw.add(mouth);
  group.add(jaw);

  const toothGeo = new THREE.ConeGeometry(0.0055 * L, 0.02 * L, 4).rotateX(Math.PI);
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.3 });
  for (let i = 0; i < 13; i++) {
    const a = (i / 12 - 0.5) * 2.4;
    const tooth = new THREE.Mesh(toothGeo, toothMat);
    tooth.position.set(Math.sin(a) * 0.05 * L, -0.055 * L, 0.36 * L + Math.cos(a) * 0.065 * L);
    group.add(tooth);
  }

  return {
    group, body, fins, material, finMat, jaw, L,
    bodyBase: Float32Array.from(bodyGeo.attributes.position.array),
    finBase: Float32Array.from(finGeo.attributes.position.array),
  };
}

// ---------- behaviour ----------

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function segmentRayDistance(p0, p1, o, d, maxT) {
  // Closest approach between segment p0-p1 (s in 0..1) and ray o + d*t (t in 0..maxT).
  const u = tmpA.subVectors(p1, p0);
  const w0 = tmpB.subVectors(p0, o);
  const a = u.dot(u), b = u.dot(d), c = d.dot(d), dd = u.dot(w0), e = d.dot(w0);
  const den = a * c - b * b;
  let sv = den > 1e-6 ? clamp((b * e - c * dd) / den, 0, 1) : 0;
  const t = clamp((b * sv + e) / c, 0, maxT);
  sv = clamp((b * t - dd) / a, 0, 1);
  const px = p0.x + u.x * sv - (o.x + d.x * t);
  const py = p0.y + u.y * sv - (o.y + d.y * t);
  const pz = p0.z + u.z * sv - (o.z + d.z * t);
  return { dist: Math.sqrt(px * px + py * py + pz * pz), t };
}

export function createShark(scene, tier) {
  const m = buildShark(tier);
  scene.add(m.group);
  const L = m.L;

  const s = {
    tier,
    state: 'circle',
    pos: new THREE.Vector3(18, -0.6, 10),
    yaw: 0,
    pitch: 0,
    speed: tier.swim,
    vy: 0,
    dir: Math.random() < 0.5 ? 1 : -1,
    attackTimer: tier.firstAttack,
    notice: 0,
    courage: tier.hitsToRepelRaft,
    target: null,       // { tile, side }
    phase: 'standoff',
    stateTime: 0,
    biteTimer: 0,
    biteCooldown: 0,
    retreatDir: 0,
    hurt: 0,
    thrash: 0,
    jawOpen: 0,
    swimPhase: 0,
  };

  const forward = new THREE.Vector3();
  const head = new THREE.Vector3();
  const tail = new THREE.Vector3();

  function setState(next) {
    s.state = next;
    s.stateTime = 0;
  }

  function biteSpotFor(raft, tgt, out) {
    raft.worldPointOf(tgt.tile, tgt.side, out);
    out.x += tgt.side[0] * L * 0.48;
    out.z += tgt.side[1] * L * 0.48;
    return out;
  }

  function pickRaftTarget(raft, player) {
    const list = raft.attackable();
    if (!list.length) return null;
    // Prefer pieces on the shark's side of the raft, with some randomness.
    let best = null, bestScore = Infinity;
    for (const c of list) {
      const p = raft.worldPointOf(c.tile, c.side, tmpA);
      const score = Math.hypot(p.x - s.pos.x, p.z - s.pos.z) + rand(0, 6);
      if (score < bestScore) { bestScore = score; best = c; }
    }
    return best;
  }

  function steer(tx, tz, turnRate, dt) {
    const want = Math.atan2(tx - s.pos.x, tz - s.pos.z);
    s.yaw = turnToward(s.yaw, want, turnRate * dt);
    return Math.hypot(tx - s.pos.x, tz - s.pos.z);
  }

  const spot = new THREE.Vector3();
  const standoff = new THREE.Vector3();

  const api = {
    get state() { return s.state; },
    get pos() { return s.pos; },
    get target() { return s.target; },
    group: m.group,

    reset() {
      s.pos.set(22, -0.6, 8);
      s.yaw = 0;
      s.attackTimer = tier.firstAttack;
      s.target = null;
      s.courage = tier.hitsToRepelRaft;
      setState('circle');
    },

    serialize() {
      return { x: s.pos.x, z: s.pos.z, attackTimer: s.attackTimer };
    },

    restore(d) {
      if (!d) return;
      s.pos.set(d.x, -0.6, d.z);
      s.attackTimer = d.attackTimer;
      setState('circle');
    },

    forceAttack() {
      s.attackTimer = 0;
      setState('circle');
    },

    holdOff(sec) {
      s.attackTimer = Math.max(s.attackTimer, sec);
    },

    headPosition(out = new THREE.Vector3()) {
      return out.copy(head);
    },

    // Spear test. Returns the hit point or null.
    rayHit(origin, dir, reach) {
      const r = segmentRayDistance(head, tail, origin, dir, reach);
      if (r.dist < 0.15 * L + 0.12) return origin.clone().addScaledVector(dir, r.t);
      return null;
    },

    hit(events) {
      s.hurt = 0.25;
      s.thrash = 0.6;
      s.courage -= 1;
      if (s.state === 'bite') s.biteTimer += 0.7;
      if (s.courage <= 0 || s.state === 'circle') {
        setState('flee');
        s.target = null;
        events.onRepelled?.();
      }
    },

    update(t, dt, world) {
      const { raft, player, fx, events } = world;
      s.stateTime += dt;
      s.biteCooldown = Math.max(0, s.biteCooldown - dt);
      s.hurt = Math.max(0, s.hurt - dt);
      s.thrash = Math.max(0, s.thrash - dt);
      const center = raft.center();
      const pdist = Math.hypot(player.pos.x - s.pos.x, player.pos.z - s.pos.z);

      let speedTarget = tier.swim;
      let depthTarget = -0.6;
      let pitchTarget = 0;
      let jawTarget = 0;
      const turn = 1.5;

      if (player.inWater && pdist < 32 && s.state !== 'flee' && s.state !== 'chase' && s.state !== 'retreat') {
        s.notice += dt;
        if (s.notice > 1.2) {
          s.courage = tier.hitsToRepelChase;
          setState('chase');
          events.onHunt?.();
        }
      } else if (!player.inWater) {
        s.notice = 0;
      }

      switch (s.state) {
        case 'circle': {
          const R = raft.radius() + 6;
          const ang = Math.atan2(s.pos.x - center.x, s.pos.z - center.z) + s.dir * 0.5;
          steer(center.x + Math.sin(ang) * R, center.z + Math.cos(ang) * R, turn, dt);
          s.attackTimer -= dt;
          if (s.attackTimer <= 0) {
            s.target = pickRaftTarget(raft, player);
            if (s.target) {
              s.courage = tier.hitsToRepelRaft;
              s.phase = 'standoff';
              setState('approach');
            } else {
              s.attackTimer = 10;
            }
          }
          break;
        }

        case 'approach': {
          const tgt = s.target;
          if (!tgt || tgt.tile.broken) { setState('circle'); s.attackTimer = 6; break; }
          biteSpotFor(raft, tgt, spot);
          standoff.set(spot.x + tgt.side[0] * 3.2, 0, spot.z + tgt.side[1] * 3.2);
          if (s.phase === 'standoff') {
            const d = steer(standoff.x, standoff.z, 2.2, dt);
            speedTarget = tier.swim * 1.2;
            depthTarget = raft.nearRaft(s.pos.x, s.pos.z, 1.2) ? -2.2 : -0.6;
            if (d < 1.4) s.phase = 'in';
          } else {
            const d = steer(spot.x, spot.z, 3, dt);
            speedTarget = clamp(d * 1.2, 0.6, tier.swim);
            depthTarget = -0.55;
            if (d < 0.4) {
              setState('bite');
              s.biteTimer = tier.biteInterval * 0.6;
              events.onRaftAttack?.(tgt);
            }
          }
          if (s.stateTime > 30) { setState('circle'); s.attackTimer = 8; }
          break;
        }

        case 'bite': {
          const tgt = s.target;
          if (!tgt || tgt.tile.broken) { setState('circle'); s.attackTimer = rand(...tier.attackGap); break; }
          biteSpotFor(raft, tgt, spot);
          s.pos.x = damp(s.pos.x, spot.x, 4, dt);
          s.pos.z = damp(s.pos.z, spot.z, 4, dt);
          const want = Math.atan2(-tgt.side[0], -tgt.side[1]);
          s.yaw = turnToward(s.yaw, want + Math.sin(t * 9) * 0.14, 4 * dt);
          speedTarget = 0;
          // Back stays under the surface; the fin and the snout break it.
          depthTarget = -0.5;
          pitchTarget = -0.28;
          s.biteTimer -= dt;
          const cycle = 1 - clamp(s.biteTimer / tier.biteInterval, 0, 1);
          jawTarget = Math.sin(cycle * Math.PI) ** 2;
          if (s.biteTimer <= 0) {
            s.biteTimer = tier.biteInterval;
            s.thrash = 0.35;
            const broke = raft.damage(tgt.tile, tier.biteRaft, tgt.side);
            const p = raft.worldPointOf(tgt.tile, tgt.side, tmpA);
            fx.splinters(p);
            fx.splash(p, 0.8);
            events.onRaftBitten?.(tgt.tile, broke, p);
            if (broke) {
              s.target = null;
              setState('circle');
              s.attackTimer = rand(...tier.attackGap);
            }
          }
          if (player.inWater && pdist < 12) {
            s.courage = tier.hitsToRepelChase;
            setState('chase');
            events.onHunt?.();
          }
          break;
        }

        case 'chase': {
          if (!player.inWater) {
            setState('circle');
            s.attackTimer = Math.max(s.attackTimer, 10);
            s.notice = 0;
            break;
          }
          steer(player.pos.x, player.pos.z, 2.6, dt);
          speedTarget = tier.chase;
          depthTarget = raft.nearRaft(s.pos.x, s.pos.z, 0.6) ? -1.7 : -0.58;
          const hx = head.x - player.pos.x, hz = head.z - player.pos.z;
          if (Math.hypot(hx, hz) < 1.0 && s.biteCooldown <= 0) {
            s.biteCooldown = 2.4;
            s.thrash = 0.5;
            jawTarget = 1;
            events.onPlayerBitten?.(tier.bitePlayer, head.clone());
            s.retreatDir = Math.atan2(s.pos.x - player.pos.x, s.pos.z - player.pos.z) + rand(-0.6, 0.6);
            setState('retreat');
          }
          if (pdist < 3) jawTarget = 0.6;
          break;
        }

        case 'retreat': {
          s.yaw = turnToward(s.yaw, s.retreatDir, 3 * dt);
          speedTarget = tier.chase * 0.9;
          depthTarget = -0.9;
          if (s.stateTime > 1.8) setState(player.inWater ? 'chase' : 'circle');
          break;
        }

        case 'flee': {
          const away = Math.atan2(s.pos.x - center.x, s.pos.z - center.z);
          s.yaw = turnToward(s.yaw, away, 3 * dt);
          speedTarget = tier.flee;
          depthTarget = -2.6;
          if (s.stateTime > 6) {
            setState('circle');
            s.attackTimer = rand(...tier.attackGap) + 15;
            s.notice = -6; // gives the player time to get out of the water
          }
          break;
        }
      }

      // Never cruise through the floor of the raft: dive under it.
      if (s.state !== 'bite' && !(s.state === 'approach' && s.phase === 'in') && raft.nearRaft(s.pos.x, s.pos.z, 0.9)) {
        depthTarget = Math.min(depthTarget, -2.0);
      }

      s.speed = damp(s.speed, speedTarget, 2, dt);
      forward.set(Math.sin(s.yaw), 0, Math.cos(s.yaw));
      s.pos.addScaledVector(forward, s.speed * dt);
      const prevY = s.pos.y;
      s.pos.y = damp(s.pos.y, depthTarget + waveHeight(s.pos.x, s.pos.z, t) * 0.6, 1.6, dt);
      s.vy = (s.pos.y - prevY) / Math.max(dt, 1e-4);
      if (pitchTarget === 0) pitchTarget = clamp(-s.vy / Math.max(s.speed, 1), -0.45, 0.45);
      s.pitch = damp(s.pitch, pitchTarget, 4, dt);
      s.jawOpen = damp(s.jawOpen, jawTarget, 10, dt);

      m.group.position.copy(s.pos);
      m.group.rotation.y = s.yaw + Math.sin(t * 22) * s.thrash * 0.25;
      m.group.rotation.x = s.pitch;
      m.jaw.rotation.x = s.jawOpen * 0.55;
      m.material.emissive.setRGB(s.hurt * 1.6, 0, 0);
      m.finMat.emissive.setRGB(s.hurt * 1.6, 0, 0);

      // Head and tail in world space, for spear hits and bites.
      const fwd3 = tmpA.set(0, 0, 1).applyEuler(m.group.rotation);
      head.copy(s.pos).addScaledVector(fwd3, 0.5 * L);
      tail.copy(s.pos).addScaledVector(fwd3, -0.55 * L);

      // Swim: a travelling wave down the body, stronger toward the tail.
      const effort = 0.35 + s.speed / tier.chase + s.thrash * 2;
      s.swimPhase += dt * (3 + s.speed * 1.6 + s.thrash * 10);
      const amp = 0.07 * L * clamp(effort, 0.3, 1.6);
      for (const [mesh, base] of [[m.body, m.bodyBase], [m.fins, m.finBase]]) {
        const pos = mesh.geometry.attributes.position;
        const arr = pos.array;
        for (let i = 0; i < arr.length; i += 3) {
          const u = (0.5 * L - base[i + 2]) / L;
          arr[i] = base[i] + Math.sin(s.swimPhase - u * 4.6) * amp * u * u;
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }
    },
  };

  return api;
}

