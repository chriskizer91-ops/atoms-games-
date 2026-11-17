import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { waveHeight } from './ocean.js';
import { clamp, damp, rand, smoothstep } from './util.js';
import { createSeaLife } from './sealife.js';

// Life on the sea, for scale and for moments worth stopping to watch:
//  - gulls wheeling over an island and a few riding the wind above the raft;
//  - dolphins that come up from astern when you're sailing well, and leap
//    alongside for a while;
//  - now and then, a long way off, a whale throwing itself out of the sea;
//  - turtles, flying fish and glowing jellyfish (sealife.js).
// Everything is built in code. Gulls are one draw call between them.

const GULLS = 16;
const FOLLOWERS = 4;

// ---------- gulls ----------
function gullGeometry() {
  // Body: a stretched diamond. Wings: two swept triangles each; aTip says how
  // far along the wing a point is, so the shader can flap them.
  const pos = [], tip = [], shade = [];
  const tri = (a, b, c, ta, tb, tc, s) => { pos.push(...a, ...b, ...c); tip.push(ta, tb, tc); shade.push(s, s, s); };
  const nose = [0, 0, -0.28], tail = [0, 0, 0.3], top = [0, 0.06, 0], bot = [0, -0.05, 0], l = [0.06, 0, 0], r = [-0.06, 0, 0];
  for (const [a, b] of [[l, top], [top, r], [r, bot], [bot, l]]) { tri(nose, a, b, 0, 0, 0, 1); tri(tail, b, a, 0, 0, 0, 0.75); }
  for (const s of [1, -1]) {
    const root1 = [s * 0.05, 0.02, -0.1], root2 = [s * 0.05, 0.02, 0.1], mid1 = [s * 0.34, 0.03, -0.12], mid2 = [s * 0.34, 0.03, 0.06], end = [s * 0.68, 0.0, 0.04];
    tri(root1, mid1, root2, 0, 0.5, 0, 0.95); tri(root2, mid1, mid2, 0, 0.5, 0.5, 0.95);
    tri(mid1, end, mid2, 0.5, 1, 0.5, 0.55);   // dark wingtips
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
  g.setAttribute('aShade', new THREE.Float32BufferAttribute(shade, 1));
  return g;
}

function createGulls(scene) {
  const geo = gullGeometry();
  const phase = new Float32Array(GULLS);
  for (let i = 0; i < GULLS; i++) phase[i] = Math.random();
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  const uniforms = { uTime: { value: 0 }, uLight: { value: new THREE.Color(1, 1, 1) }, uFogColor: { value: new THREE.Color() }, uFogDensity: { value: 0.004 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aTip, aShade, aPhase;
      uniform float uTime;
      varying float vShade;
      varying float vDist;
      void main() {
        vec3 p = position;
        // Flap in bursts, glide in between.
        float t = uTime + aPhase * 40.0;
        float effort = smoothstep(-0.2, 0.5, sin(t * 0.45 + aPhase * 6.0));
        p.y += aTip * (sin(t * 8.0) * 0.26 * effort + 0.1) - aTip * aTip * 0.05;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vShade = aShade;
        vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLight, uFogColor;
      uniform float uFogDensity;
      varying float vShade;
      varying float vDist;
      void main() {
        vec3 col = vec3(0.92, 0.93, 0.95) * vShade * uLight;
        float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
        gl_FragColor = vec4(mix(col, uFogColor, fog), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, GULLS);
  mesh.frustumCulled = false;
  mesh.userData.above = true;
  scene.add(mesh);

  const birds = [];
  for (let i = 0; i < GULLS; i++) {
    birds.push({ a: rand(0, 6.28), r: 0, r0: rand(0.2, 1), alt: 0, alt0: rand(0, 1), w: rand(0.12, 0.22) * (Math.random() < 0.5 ? -1 : 1), wob: rand(0, 6.28), x: 0, y: -50, z: 0, k: 0 });
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), s = new THREE.Vector3(), p = new THREE.Vector3();

  return {
    // land: { x, z, r } of the nearest island, or null. raft: { x, z }. show: 0..1 (hidden at night and in a storm).
    update(t, dt, land, raft, show, light, fog) {
      uniforms.uTime.value = t;
      uniforms.uLight.value.copy(light);
      uniforms.uFogColor.value.copy(fog.color);
      uniforms.uFogDensity.value = fog.density;
      mesh.visible = show > 0.02;
      if (!mesh.visible) return;
      for (let i = 0; i < GULLS; i++) {
        const b = birds[i];
        const follower = i < FOLLOWERS;
        let cx, cz, r, alt, want;
        if (follower) {
          cx = raft.x; cz = raft.z;
          r = 9 + b.r0 * 12;
          alt = 8 + b.alt0 * 9;
          want = land ? 1 : 0.5 > b.r0 ? 1 : 0;   // out of sight of land, only a couple keep you company
        } else {
          want = land ? 1 : 0;
          cx = land ? land.x : b.x; cz = land ? land.z : b.z;
          r = land ? land.r * (0.3 + b.r0 * 1.1) + 6 : 30;
          alt = 11 + b.alt0 * 22;
        }
        b.k = damp(b.k, want * show, 0.6, dt);
        b.a += b.w * dt * (follower ? 1.6 : 1) * (14 / Math.max(8, r));
        const wob = Math.sin(t * 0.3 + b.wob);
        const rr = r * (1 + 0.18 * wob);
        b.x = cx + Math.cos(b.a) * rr;
        b.z = cz + Math.sin(b.a) * rr;
        b.y = alt + Math.sin(t * 0.21 + b.wob * 2) * 2.2;
        // nose along the circle, banked into the turn
        const dir = b.w > 0 ? 1 : -1;
        e.set(0.06 * Math.cos(t * 0.21 + b.wob * 2), Math.atan2(Math.sin(b.a) * dir, -Math.cos(b.a) * dir), -0.38 * dir);
        q.setFromEuler(e);
        const k = b.k < 0.03 ? 0 : 1.15;
        m.compose(p.set(b.x, b.y + (1 - b.k) * 60, b.z), q, s.set(k, k, k));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------- swimmers ----------
// A body of revolution along z (nose toward -z), dark on the back and pale
// underneath, with flat fins added.
function swimmerGeometry({ length, profile, dorsal, pecs, fluke, back, belly }) {
  const pts = profile.map(([u, r]) => new THREE.Vector2(r * length, (u - 0.5) * length));
  const body = new THREE.LatheGeometry(pts, 14);
  body.rotateX(Math.PI / 2);         // lathe axis y -> z; u = 0 ends up at -z (the nose)
  const parts = [body.toNonIndexed()];
  const fin = (verts) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat().map((v) => v * length), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((verts.length) * 2).fill(0), 2));
    g.computeVertexNormals();
    return g;
  };
  if (dorsal) parts.push(fin([[0, dorsal.h + 0.07, dorsal.z + 0.06], [0, 0.05, dorsal.z - 0.08], [0, 0.05, dorsal.z + 0.1]]));
  for (const s of [1, -1]) {
    parts.push(fin([[s * 0.05, -0.03, pecs.z], [s * (0.05 + pecs.len), -0.09, pecs.z + pecs.len * 0.9], [s * 0.05, -0.04, pecs.z + 0.09]]));
    parts.push(fin([[0, 0, 0.47], [s * fluke, 0.0, 0.56], [0, 0, 0.53]]));
  }
  const g = mergeGeometries(parts.map((p) => { p.deleteAttribute('uv'); if (!p.attributes.normal) p.computeVertexNormals(); return p; }));
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Color(back), b = new THREE.Color(belly), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const k = smoothstep(-0.02 * length, 0.03 * length, pos.getY(i));
    c.copy(b).lerp(a, k);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

const DOLPHIN = {
  length: 2.3,
  profile: [[0, 0], [0.03, 0.022], [0.09, 0.04], [0.12, 0.062], [0.25, 0.095], [0.42, 0.1], [0.6, 0.082], [0.78, 0.048], [0.92, 0.022], [0.97, 0.012], [1, 0]],
  dorsal: { h: 0.11, z: -0.02 }, pecs: { z: -0.2, len: 0.14 }, fluke: 0.13, back: 0x4d5b6b, belly: 0xd7dde2,
};
const WHALE = {
  length: 14,
  profile: [[0, 0], [0.02, 0.05], [0.08, 0.1], [0.2, 0.135], [0.38, 0.14], [0.55, 0.115], [0.72, 0.075], [0.86, 0.04], [0.95, 0.02], [1, 0]],
  dorsal: { h: 0.03, z: 0.18 }, pecs: { z: -0.22, len: 0.3 }, fluke: 0.17, back: 0x2c343c, belly: 0xc9cfd2,
};

export function createLife(scene, { fx, audio }) {
  const gulls = createGulls(scene);
  const wet = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0, side: THREE.DoubleSide });

  // ----- dolphins -----
  const dGeo = swimmerGeometry(DOLPHIN);
  const pod = [];
  for (let i = 0; i < 4; i++) {
    const mesh = new THREE.Mesh(dGeo, wet);
    mesh.castShadow = true;
    mesh.visible = false;
    mesh.rotation.order = 'YXZ';
    scene.add(mesh);
    pod.push({ mesh, off: i * 0.27 + rand(0, 0.1), period: rand(3.0, 4.2), lane: 5.5 + i * 1.7 + rand(0, 0.6), ahead: -3 + i * 2.6, air: false, u: 0 });
  }
  const dol = { on: false, t: 0, life: 0, side: 1, timer: 22, lead: 30 };

  // ----- the whale -----
  const whale = new THREE.Mesh(swimmerGeometry(WHALE), wet);
  whale.visible = false;
  whale.rotation.order = 'YXZ';
  scene.add(whale);
  const wh = { on: false, t: 0, x: 0, z: 0, yaw: 0, timer: rand(70, 130), hit: false, roll: 1 };

  const small = createSeaLife(scene, { fx, audio });
  const v = new THREE.Vector3();
  const light = new THREE.Color();
  let events = {};

  function startDolphins() {
    dol.on = true;
    dol.t = 0;
    dol.life = rand(30, 46);
    dol.side = Math.random() < 0.5 ? -1 : 1;
    dol.lead = 30;
    for (const d of pod) { d.mesh.visible = true; d.air = false; d.off = Math.random(); }
    events.onDolphins?.(dol.side, () => (dol.on ? v.set(dol.side * 7, 0.5, dol.lead * 0.2 - 2) : null));
  }

  function startWhale(camera, raft) {
    // Out where you're looking, well clear of the raft.
    camera.getWorldDirection(v);
    const yaw = Math.atan2(v.x, v.z) + rand(-0.6, 0.6);
    const dist = rand(60, 95);
    wh.x = raft.x + Math.sin(yaw) * dist;
    wh.z = raft.z + Math.cos(yaw) * dist;
    wh.yaw = yaw + Math.PI / 2 + rand(-0.4, 0.4);
    wh.t = 0;
    wh.on = true;
    wh.hit = false;
    wh.roll = Math.random() < 0.5 ? -1 : 1;
    whale.visible = true;
    events.onWhale?.(() => (wh.on ? v.set(wh.x, 4, wh.z) : null), wh.x - raft.x);
  }

  return {
    on(e) { events = e; small.on(e); },
    get state() { return { dol, wh, ...small.state }; },
    startDolphins, startWhale, startTurtle: small.startTurtle, startFlyers: small.startFlyers,
    reset() {
      dol.on = false; dol.timer = 22;
      wh.on = false; wh.timer = rand(70, 130);
      whale.visible = false;
      for (const d of pod) d.mesh.visible = false;
      small.reset();
    },

    // c: { camera, raft {x, z}, land {x, z, r} | null, through (m/s under sail), day 0..1, night 0..1, storm 0..1,
    //      sunColor, sunLevel, fog, live }
    update(t, dt, c) {
      light.copy(c.sunColor).multiplyScalar(0.55 * c.sunLevel).addScalar(0.3 + 0.35 * c.day);
      gulls.update(t, dt, c.land, c.raft, (1 - smoothstep(0.35, 0.7, c.night)) * (1 - smoothstep(0.4, 0.8, c.storm)), light, c.fog);
      small.update(t, dt, c);
      if (!c.live) return;

      // ----- dolphins: they like a raft that is moving -----
      if (!dol.on) {
        if (c.through > 1.7 && c.day > 0.3 && c.storm < 0.4) dol.timer -= dt;
        if (dol.timer <= 0) { dol.timer = rand(110, 240); startDolphins(); }
      } else {
        dol.t += dt;
        const leaving = dol.t > dol.life || c.through < 0.6;
        // They come up from astern, hold station, then pull ahead and are gone.
        dol.lead = damp(dol.lead, leaving ? -70 : 0, leaving ? 0.5 : 0.9, dt);
        if (leaving && dol.lead < -45) { dol.on = false; for (const d of pod) d.mesh.visible = false; }
        for (const d of pod) {
          const u = ((t / d.period + d.off) % 1 + 1) % 1;
          const x = c.raft.x + dol.side * d.lane;
          let z = c.raft.z + d.ahead + dol.lead;
          const air = u < 0.32;
          let y, pitch;
          if (air) {
            const s = u / 0.32;
            y = Math.sin(Math.PI * s) * 1.35 - 0.3;
            z -= (s - 0.5) * 3.4;
            pitch = Math.atan2(Math.cos(Math.PI * s) * 1.35 * Math.PI, 3.4);
          } else {
            const s = (u - 0.32) / 0.68;
            y = -0.3 - Math.sin(Math.PI * s) * 0.55;
            z += (s - 0.5) * 3.4;
            pitch = -Math.cos(Math.PI * s) * 0.25;
          }
          const sea = waveHeight(x, z, t);
          d.mesh.position.set(x, sea + y, z);
          d.mesh.rotation.set(pitch, 0, 0);
          if (air !== d.air && Math.abs(dol.lead) < 25) {
            d.air = air;
            fx.splash(v.set(x, sea + 0.05, z), air ? 0.7 : 1.0);
            if (!air) audio.splash?.(clamp(dol.side * 0.6, -1, 1), false);
          }
          d.air = air;
        }
      }

      // ----- the whale -----
      if (!wh.on) {
        const ok = c.day > 0.2 && c.storm < 0.5 && !(c.land && Math.hypot(c.land.x - c.raft.x, c.land.z - c.raft.z) < c.land.r + 220);
        if (ok) wh.timer -= dt;
        if (wh.timer <= 0) { wh.timer = rand(170, 380); startWhale(c.camera, c.raft); }
      } else {
        wh.t += dt;
        const k = wh.t;
        const sea = waveHeight(wh.x, wh.z, t);
        // Up and out nose first, hang, roll onto its back, and fall.
        const rise = smoothstep(0, 1.25, k);
        const fall = smoothstep(1.45, 2.5, k);
        const y = -8.5 + rise * 11.2 - fall * 5.2 - smoothstep(2.5, 4.6, k) * 9;
        const pitch = 1.12 * rise * (1 - fall * 0.92);
        whale.position.set(wh.x, sea + y, wh.z);
        whale.rotation.set(pitch, wh.yaw, wh.roll * fall * 1.5);
        if (k < 1.3 && k > 0.25) {
          // water streaming off it on the way up
          if (Math.random() < dt * 22) fx.plume(v.set(wh.x + rand(-2, 2), sea + 0.3, wh.z + rand(-2, 2)), 0.8);
        }
        if (!wh.hit && k > 2.25) {
          wh.hit = true;
          for (let i = 0; i < 6; i++) fx.plume(v.set(wh.x + rand(-5, 5), sea + 0.2, wh.z + rand(-5, 5)), 2.2);
          events.onWhaleSplash?.(v.set(wh.x, 0, wh.z));
        }
        if (k > 2.4 && k < 3.4 && Math.random() < dt * 14) fx.plume(v.set(wh.x + rand(-6, 6), sea + 0.2, wh.z + rand(-6, 6)), 1.2);
        if (k > 4.8) { wh.on = false; whale.visible = false; }
      }
    },
  };
}
