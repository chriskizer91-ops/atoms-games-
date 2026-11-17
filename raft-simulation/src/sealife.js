import * as THREE from 'three';
import { waveHeight } from './ocean.js';
import { toScene, toWorld, FRAME } from './frame.js';
import { clamp, damp, rand, smoothstep } from './util.js';

// Smaller company on the sea:
//  - a turtle that comes up beside a slow raft for a breath and a look;
//  - flying fish that burst off a wave top and glide;
//  - by night, slow glowing jellyfish all around under the surface.
// They live on the chart (not in the raft's frame), so the raft sails past them.

const JELLIES = 46;
const FLYERS = 7;

function turtleModel() {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.5 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8a9a62, roughness: 0.6 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10).scale(0.42, 0.16, 0.52), shellMat);
  // plates: a darker ridge pattern from a second, slightly bigger shell cut into bands
  const ridge = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4).scale(0.425, 0.168, 0.525), new THREE.MeshStandardMaterial({ color: 0x3c4a28, roughness: 0.6, wireframe: true }));
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6).scale(0.38, 0.07, 0.47), new THREE.MeshStandardMaterial({ color: 0xcfc79a, roughness: 0.7 }));
  belly.position.y = -0.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8).scale(0.1, 0.085, 0.14), skinMat);
  head.position.set(0, 0.03, -0.6);
  const flip = (x, z, len, yaw) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6).scale(len, 0.025, 0.11), skinMat);
    const pivot = new THREE.Group();
    pivot.position.set(x, -0.02, z);
    pivot.rotation.y = yaw;
    m.position.x = Math.sign(x) * len * 0.85;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  };
  g.add(shell, ridge, belly, head);
  const fl = [flip(-0.3, -0.3, 0.36, 0.5), flip(0.3, -0.3, 0.36, -0.5), flip(-0.26, 0.38, 0.2, -0.6), flip(0.26, 0.38, 0.2, 0.6)];
  g.userData = { head, fl };
  g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return g;
}

function flyerGeometry() {
  // A slim body with two long stiff fins, nose toward -z.
  const body = new THREE.SphereGeometry(1, 8, 6).scale(0.035, 0.04, 0.16);
  const pos = [], idx = [];
  const b = body.attributes.position;
  for (let i = 0; i < b.count; i++) pos.push(b.getX(i), b.getY(i), b.getZ(i));
  for (let i = 0; i < body.index.count; i++) idx.push(body.index.getX(i));
  const n = b.count;
  // fins: root at the shoulder, swept back
  pos.push(-0.03, 0.01, -0.06, -0.3, 0.05, 0.0, -0.03, 0.01, 0.05, 0.03, 0.01, -0.06, 0.3, 0.05, 0.0, 0.03, 0.01, 0.05);
  idx.push(n, n + 1, n + 2, n + 3, n + 5, n + 4);
  // tail fork
  pos.push(0, 0, 0.14, 0, 0.07, 0.24, 0, -0.09, 0.25);
  idx.push(n + 6, n + 7, n + 8);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createSeaLife(scene, { fx, audio }) {
  let events = {};
  const v = new THREE.Vector3();
  const p2 = { x: 0, z: 0 };

  // ----- turtle -----
  const turtle = turtleModel();
  turtle.visible = false;
  turtle.rotation.order = 'YXZ';
  scene.add(turtle);
  const tu = { on: false, t: 0, wx: 0, wz: 0, yaw: 0, turn: 0, timer: rand(50, 90), life: 24 };

  function startTurtle(raft) {
    const a = rand(0, Math.PI * 2), d = rand(6.5, 10);
    toWorld(raft.x + Math.sin(a) * d, raft.z + Math.cos(a) * d, p2);
    tu.wx = p2.x; tu.wz = p2.z;
    tu.yaw = a + Math.PI / 2 + rand(-0.4, 0.4) - FRAME.rot;   // chart heading, along the raft's side
    tu.turn = rand(-0.05, 0.05);
    tu.t = 0;
    tu.life = rand(20, 28);
    tu.on = true;
    turtle.visible = true;
    events.onTurtle?.(() => (tu.on ? v.copy(turtle.position).setY(0.4) : null));
  }

  // ----- flying fish -----
  const flyMat = new THREE.MeshStandardMaterial({ color: 0xa9c4d6, roughness: 0.25, metalness: 0.35, side: THREE.DoubleSide });
  const flyers = new THREE.InstancedMesh(flyerGeometry(), flyMat, FLYERS);
  flyers.frustumCulled = false;
  flyers.visible = false;
  scene.add(flyers);
  const fl = { on: false, t: 0, wx: 0, wz: 0, dx: 0, dz: 0, timer: rand(35, 70), fish: [] };
  for (let i = 0; i < FLYERS; i++) fl.fish.push({ delay: 0, side: 0, len: 0, high: 0, wet: 0 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();

  function startFlyers(camera, raft) {
    camera.getWorldDirection(v);
    const yaw = Math.atan2(v.x, v.z) + rand(-0.5, 0.5);
    const d = rand(9, 16);
    toWorld(raft.x + Math.sin(yaw) * d, raft.z + Math.cos(yaw) * d, p2);
    fl.wx = p2.x; fl.wz = p2.z;
    const dir = yaw + (Math.random() < 0.5 ? 1 : -1) * rand(1.1, 1.8) - FRAME.rot;   // across your view
    fl.dx = Math.sin(dir); fl.dz = Math.cos(dir);
    fl.t = 0;
    fl.on = true;
    flyers.visible = true;
    for (const f of fl.fish) { f.delay = rand(0, 0.7); f.side = rand(-2.2, 2.2); f.len = rand(11, 17); f.high = rand(0.6, 1.2); f.wet = 0; }
    events.onFlyingFish?.(() => (fl.on ? v.set(toScene(fl.wx, fl.wz, p2).x, 0.6, p2.z) : null));
  }

  // ----- jellyfish -----
  const jGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const jMat = new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
  const jellies = new THREE.InstancedMesh(jGeo, jMat, JELLIES);
  jellies.frustumCulled = false;
  jellies.visible = false;
  jellies.renderOrder = 3;
  jellies.userData.above = true;      // a glow on the surface: not part of the under-water picture
  scene.add(jellies);
  const jl = [];
  const tints = [0x39e6d0, 0x4fb8ff, 0x9a7bff, 0x52ffb0];
  const col = new THREE.Color();
  for (let i = 0; i < JELLIES; i++) {
    jl.push({ wx: 0, wz: 0, placed: false, size: rand(0.5, 1.25), phase: rand(0, 6.28), rate: rand(0.5, 1.1), tint: tints[i % tints.length], vx: rand(-0.08, 0.08), vz: rand(-0.08, 0.08) });
    jellies.setColorAt(i, col.setHex(0));
  }
  const js = { glow: 0, seen: false };

  return {
    on(e2) { events = e2; },
    state: { tu, fl, js },
    startTurtle, startFlyers,
    reset() {
      tu.on = false; tu.timer = rand(50, 90); turtle.visible = false;
      fl.on = false; fl.timer = rand(35, 70); flyers.visible = false;
      js.glow = 0; js.seen = false; jellies.visible = false;
      for (const j of jl) j.placed = false;
    },

    // c: as createLife's update.
    update(t, dt, c) {
      const calm = c.storm < 0.45;

      // ----- turtle: beside a raft that isn't going anywhere fast -----
      if (!tu.on) {
        if (c.through < 1.3 && c.day > 0.25 && calm) tu.timer -= dt;
        if (tu.timer <= 0) { tu.timer = rand(150, 320); startTurtle(c.raft); }
      } else {
        tu.t += dt;
        const k = tu.t;
        tu.yaw += tu.turn * dt;
        const sp = 0.42 * smoothstep(0, 2, k);
        tu.wx += Math.sin(tu.yaw) * sp * dt;
        tu.wz += Math.cos(tu.yaw) * sp * dt;
        toScene(tu.wx, tu.wz, p2);
        const sea = waveHeight(p2.x, p2.z, t);
        // Up from below, along the surface with its back awash, a breath, and down again.
        const up = smoothstep(0, 2.2, k) * (1 - smoothstep(tu.life - 3, tu.life, k));
        const breath = smoothstep(5, 6, k) * (1 - smoothstep(8.5, 9.5, k));
        turtle.position.set(p2.x, sea - 1.3 + up * 1.24 + breath * 0.05, p2.z);
        turtle.rotation.set((1 - up) * (k < 5 ? -0.5 : 0.6) + Math.sin(t * 1.1) * 0.04, tu.yaw + FRAME.rot + Math.PI, Math.sin(t * 0.8) * 0.05);
        turtle.userData.head.position.y = 0.03 + breath * 0.1;
        turtle.userData.head.position.z = -0.6 - breath * 0.04;
        const stroke = Math.sin(t * 1.9);
        const f = turtle.userData.fl;
        f[0].rotation.z = stroke * 0.45; f[1].rotation.z = -stroke * 0.45;
        f[0].rotation.y = 0.5 + stroke * 0.25; f[1].rotation.y = -0.5 - stroke * 0.25;
        f[2].rotation.z = -stroke * 0.15; f[3].rotation.z = stroke * 0.15;
        if (k > tu.life || Math.hypot(p2.x - c.raft.x, p2.z - c.raft.z) > 60) { tu.on = false; turtle.visible = false; }
      }

      // ----- flying fish -----
      if (!fl.on) {
        if (c.day > 0.3 && calm) fl.timer -= dt * (c.through > 1.2 ? 1.6 : 1);
        if (fl.timer <= 0) { fl.timer = rand(70, 170); if (c.live) startFlyers(c.camera, c.raft); }
      } else {
        fl.t += dt;
        let any = false;
        for (let i = 0; i < FLYERS; i++) {
          const f = fl.fish[i];
          const s = (fl.t - f.delay) / 1.7;
          if (s <= 0 || s >= 1) {
            if (s >= 1 && f.wet === 1) {
              f.wet = 2;
              toScene(fl.wx + fl.dx * f.len - fl.dz * f.side, fl.wz + fl.dz * f.len + fl.dx * f.side, p2);
              fx.splash(v.set(p2.x, waveHeight(p2.x, p2.z, t) + 0.05, p2.z), 0.3);
            }
            if (s <= 0) any = true;
            m4.makeScale(0, 0, 0);
            flyers.setMatrixAt(i, m4);
            continue;
          }
          any = true;
          const along = s * f.len;
          toScene(fl.wx + fl.dx * along - fl.dz * f.side, fl.wz + fl.dz * along + fl.dx * f.side, p2);
          const sea = waveHeight(p2.x, p2.z, t);
          if (f.wet === 0) { f.wet = 1; fx.splash(v.set(p2.x, sea + 0.05, p2.z), 0.35); if (i === 0) audio.splash?.(0, false); }
          // A fast flat glide: up quickly, a long skim, down.
          const h = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.7)), 0.8) * f.high;
          pos.set(p2.x, sea + 0.1 + h, p2.z);
          const climb = Math.cos(Math.PI * Math.pow(s, 0.7)) * 0.35;
          e.set(climb, Math.atan2(fl.dx, fl.dz) + FRAME.rot + Math.PI, Math.sin(t * 40 + i) * 0.06);
          q.setFromEuler(e);
          sc.setScalar(1.25);
          m4.compose(pos, q, sc);
          flyers.setMatrixAt(i, m4);
        }
        flyers.instanceMatrix.needsUpdate = true;
        if (!any) { fl.on = false; flyers.visible = false; }
      }

      // ----- jellyfish: night, calm, away from the shallows -----
      const want = c.night > 0.55 && calm ? 1 : 0;
      js.glow = damp(js.glow, want, 0.5, dt);
      const show = js.glow > 0.02;
      jellies.visible = show;
      if (show) {
        let near = false;
        for (let i = 0; i < JELLIES; i++) {
          const j = jl[i];
          toScene(j.wx, j.wz, p2);
          let d = Math.hypot(p2.x - c.raft.x, p2.z - c.raft.z);
          if (!j.placed || d > 46) {
            // Drift in at the edge of sight (or anywhere, the first time).
            const a = rand(0, Math.PI * 2), r = j.placed ? rand(36, 44) : rand(5, 44);
            toWorld(c.raft.x + Math.sin(a) * r, c.raft.z + Math.cos(a) * r, p2);
            j.wx = p2.x; j.wz = p2.z; j.placed = true;
            toScene(j.wx, j.wz, p2);
            d = r;
          }
          j.wx += j.vx * dt; j.wz += j.vz * dt;
          const pulse = 0.55 + 0.45 * Math.sin(t * j.rate + j.phase);
          const size = j.size * (0.8 + 0.25 * pulse);
          pos.set(p2.x, waveHeight(p2.x, p2.z, t) + 0.035, p2.z);
          sc.set(size, 1, size);
          q.identity();
          m4.compose(pos, q, sc);
          jellies.setMatrixAt(i, m4);
          const fade = js.glow * (0.35 + 0.65 * pulse) * (1 - smoothstep(34, 46, d)) * 0.9;
          jellies.setColorAt(i, col.setHex(j.tint).multiplyScalar(fade));
          if (d < 14) near = true;
        }
        jellies.instanceMatrix.needsUpdate = true;
        jellies.instanceColor.needsUpdate = true;
        if (near && js.glow > 0.8 && !js.seen && c.live) { js.seen = true; events.onJellyfish?.(); }
      }
      if (c.night < 0.2) js.seen = false;
    },
  };
}
