import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { waveHeight } from './ocean.js';
import { clamp, damp, rand, turnToward, smoothstep } from './util.js';

// ---------- model, built from a lathe body plus fin prisms ----------

function finPrism(a, b, c, thick) {
  // Triangular slab: front face, back face, three edge quads.
  const off = (p, s) => [p[0] + s * thick, p[1], p[2]];
  const A = off(a, 1), B = off(b, 1), C = off(c, 1);
  const A2 = off(a, -1), B2 = off(b, -1), C2 = off(c, -1);
  const tris = [A, B, C, A2, C2, B2, A, A2, B2, A, B2, B, B, B2, C2, B, C2, C, C, C2, A2, C, A2, A];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  return g;
}

function buildSharkGeometry(L, back, belly) {
  const profile = [
    [0.0, -0.5], [0.035, -0.47], [0.06, -0.4], [0.09, -0.3], [0.12, -0.18], [0.135, -0.05],
    [0.14, 0.05], [0.13, 0.18], [0.11, 0.28], [0.08, 0.37], [0.045, 0.45], [0.0, 0.5],
  ].map(([r, y]) => new THREE.Vector2(r * L, y * L));
  const body = new THREE.LatheGeometry(profile, 10).toNonIndexed();
  body.rotateX(Math.PI / 2);
  body.scale(0.78, 0.92, 1);
  body.deleteAttribute('uv');
  body.deleteAttribute('normal');

  const s = (x, y, z) => [x * L, y * L, z * L];
  const t = 0.012 * L;
  const fins = [
    finPrism(s(0, 0.1, 0.08), s(0, 0.1, -0.12), s(0, 0.31, -0.17), t),           // dorsal
    finPrism(s(0, 0.055, -0.3), s(0, 0.05, -0.36), s(0, 0.11, -0.38), t * 0.6),  // second dorsal
    finPrism(s(0, 0.03, -0.43), s(0, -0.03, -0.49), s(0, 0.25, -0.66), t * 0.8), // tail, upper lobe
    finPrism(s(0, 0.0, -0.45), s(0, -0.03, -0.5), s(0, -0.15, -0.59), t * 0.8),  // tail, lower lobe
    finPrism(s(0.08, -0.06, 0.18), s(0.08, -0.07, 0.07), s(0.3, -0.17, 0.0), t * 0.7),   // pectorals
    finPrism(s(-0.08, -0.06, 0.18), s(-0.08, -0.07, 0.07), s(-0.3, -0.17, 0.0), t * 0.7),
  ];

  const parts = [body, ...fins];
  const cBack = new THREE.Color(back);
  const cBelly = new THREE.Color(belly);
  const tmp = new THREE.Color();
  for (const g of parts) {
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Counter-shading: dark back, pale belly, soft line along the flank.
      const k = g === body ? smoothstep(-0.05 * L, 0.03 * L, y) : 1;
      tmp.copy(cBelly).lerp(cBack, k);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return mergeGeometries(parts);
}

function buildShark(tier) {
  const L = tier.length;
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';

  const geo = buildSharkGeometry(L, tier.color, tier.belly);
  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    flatShading: true,
    shininess: 40,
    specular: 0x445566,
    emissive: 0x000000,
  });
  const body = new THREE.Mesh(geo, material);
  body.frustumCulled = false;
  group.add(body);

  const eyeMat = new THREE.MeshPhongMaterial({ color: 0x0b0d10, shininess: 90 });
  const eyeGeo = new THREE.SphereGeometry(0.0085 * L, 6, 5);
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(eyeGeo, eyeMat);
    e.position.set(sx * 0.057 * L, 0.028 * L, 0.36 * L);
    group.add(e);
  }

  // Lower jaw on a hinge under the head, with a dark mouth and a row of teeth.
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.055 * L, 0.3 * L);
  const jawMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.06 * L, 0.15 * L, 6).rotateX(Math.PI / 2).scale(1, 0.38, 1),
    new THREE.MeshPhongMaterial({ color: tier.belly, flatShading: true })
  );
  jawMesh.position.z = 0.075 * L;
  jaw.add(jawMesh);
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * L, 0.012 * L, 0.11 * L),
    new THREE.MeshBasicMaterial({ color: 0x5a1a1c })
  );
  mouth.position.set(0, 0.012 * L, 0.07 * L);
  jaw.add(mouth);
  group.add(jaw);

  const toothGeo = new THREE.ConeGeometry(0.006 * L, 0.02 * L, 4).rotateX(Math.PI);
  const toothMat = new THREE.MeshLambertMaterial({ color: 0xf4f1e6 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 8 - 0.5) * 2.2;
    const tooth = new THREE.Mesh(toothGeo, toothMat);
    tooth.position.set(Math.sin(a) * 0.045 * L, -0.06 * L, 0.32 * L + Math.cos(a) * 0.08 * L);
    group.add(tooth);
  }

  const base = Float32Array.from(geo.attributes.position.array);
  return { group, body, material, jaw, base, L };
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
            depthTarget = -0.45;
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
          depthTarget = -0.32;
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
          depthTarget = raft.nearRaft(s.pos.x, s.pos.z, 0.6) ? -1.7 : -0.5;
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
      m.material.emissive.setRGB(s.hurt * 2.4, 0, 0);

      // Head and tail in world space, for spear hits and bites.
      const fwd3 = tmpA.set(0, 0, 1).applyEuler(m.group.rotation);
      head.copy(s.pos).addScaledVector(fwd3, 0.5 * L);
      tail.copy(s.pos).addScaledVector(fwd3, -0.55 * L);

      // Swim: a travelling wave down the body, stronger toward the tail.
      const effort = 0.35 + s.speed / tier.chase + s.thrash * 2;
      s.swimPhase += dt * (3 + s.speed * 1.6 + s.thrash * 10);
      const pos = m.body.geometry.attributes.position;
      const arr = pos.array, base = m.base;
      const amp = 0.07 * L * clamp(effort, 0.3, 1.6);
      for (let i = 0; i < arr.length; i += 3) {
        const z0 = base[i + 2];
        const u = (0.5 * L - z0) / L;
        arr[i] = base[i] + Math.sin(s.swimPhase - u * 4.6) * amp * u * u;
      }
      pos.needsUpdate = true;
    },
  };

  return api;
}

