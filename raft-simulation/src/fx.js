import * as THREE from 'three';
import { softDotTexture } from './textures.js';
import { rand } from './util.js';

// Two particle kinds: soft sprites (spray, mist, blood in the water) and
// small solid chunks (splinters, dust from the hammer).

const MAX_SPRITES = 700;
const MAX_CHUNKS = 200;

function spriteSystem(scene) {
  const pos = new Float32Array(MAX_SPRITES * 3);
  const size = new Float32Array(MAX_SPRITES);
  const alpha = new Float32Array(MAX_SPRITES);
  const color = new Float32Array(MAX_SPRITES * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage));
  const uniforms = { uViewportH: { value: 800 }, tDot: { value: softDotTexture() }, uBoost: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
      uniform float uViewportH;
      varying float vAlpha; varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * projectionMatrix[1][1] * uViewportH * 0.5 / max(-mv.z, 0.05);
        vAlpha = aAlpha; vColor = aColor;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDot;
      uniform float uBoost;
      varying float vAlpha; varying vec3 vColor;
      void main() {
        float a = texture2D(tDot, gl_PointCoord).a * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor * uBoost, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3;
  scene.add(points);

  const parts = [];
  for (let i = 0; i < MAX_SPRITES; i++) parts.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s0: 0, s1: 0, a: 1, grav: 0, drag: 0, c: new THREE.Color() });
  let cursor = 0;

  return {
    uniforms,
    points,
    emit(origin, o) {
      for (let k = 0; k < o.count; k++) {
        const pt = parts[cursor];
        cursor = (cursor + 1) % MAX_SPRITES;
        pt.life = pt.max = rand(o.life[0], o.life[1]);
        pt.p.copy(origin);
        pt.p.x += rand(-o.spread, o.spread);
        pt.p.z += rand(-o.spread, o.spread);
        const sp = rand(o.speed[0], o.speed[1]);
        const a = rand(0, Math.PI * 2);
        const out = rand(0.2, 1) * o.outward;
        pt.v.set(Math.cos(a) * sp * out, sp * rand(o.up[0], o.up[1]), Math.sin(a) * sp * out);
        pt.s0 = rand(o.size[0], o.size[1]);
        pt.s1 = pt.s0 * o.grow;
        pt.a = o.alpha;
        pt.grav = o.gravity;
        pt.drag = o.drag;
        pt.c.set(Array.isArray(o.color) ? o.color[k % o.color.length] : o.color);
      }
    },
    update(dt) {
      for (let i = 0; i < MAX_SPRITES; i++) {
        const pt = parts[i];
        if (pt.life <= 0) { alpha[i] = 0; continue; }
        pt.life -= dt;
        pt.v.y -= pt.grav * dt;
        pt.v.multiplyScalar(Math.max(0, 1 - pt.drag * dt));
        pt.p.addScaledVector(pt.v, dt);
        const t = 1 - Math.max(0, pt.life) / pt.max;
        pos[i * 3] = pt.p.x; pos[i * 3 + 1] = pt.p.y; pos[i * 3 + 2] = pt.p.z;
        size[i] = pt.s0 + (pt.s1 - pt.s0) * t;
        alpha[i] = pt.a * Math.min(1, t * 8) * (1 - t) * (1 - t * 0.3);
        color[i * 3] = pt.c.r; color[i * 3 + 1] = pt.c.g; color[i * 3 + 2] = pt.c.b;
      }
      for (const k of ['position', 'aSize', 'aAlpha', 'aColor']) geo.attributes[k].needsUpdate = true;
    },
  };
}

function chunkSystem(scene) {
  const geo = new THREE.BoxGeometry(0.05, 0.016, 0.022);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const mesh = new THREE.InstancedMesh(geo, material, MAX_CHUNKS);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const parts = [];
  for (let i = 0; i < MAX_CHUNKS; i++) {
    parts.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), spin: 0, s: 1, grav: 9.8 });
    mesh.setMatrixAt(i, zero);
    mesh.setColorAt(i, new THREE.Color(0xffffff));
  }
  let cursor = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
  return {
    emit(origin, o) {
      for (let k = 0; k < o.count; k++) {
        const pt = parts[cursor];
        const idx = cursor;
        cursor = (cursor + 1) % MAX_CHUNKS;
        pt.life = pt.max = rand(o.life[0], o.life[1]);
        pt.p.copy(origin);
        pt.v.set(rand(-1, 1) * o.speed, rand(0.4, 1) * o.speed * 1.2, rand(-1, 1) * o.speed);
        pt.r.set(rand(0, 6), rand(0, 6), rand(0, 6));
        pt.spin = rand(-10, 10);
        pt.s = rand(o.size[0], o.size[1]);
        pt.grav = o.gravity;
        mesh.setColorAt(idx, col.set(o.color[k % o.color.length]));
      }
      mesh.instanceColor.needsUpdate = true;
    },
    update(dt, floorY) {
      for (let i = 0; i < MAX_CHUNKS; i++) {
        const pt = parts[i];
        if (pt.life <= 0) continue;
        pt.life -= dt;
        if (pt.life <= 0) { mesh.setMatrixAt(i, zero); continue; }
        pt.v.y -= pt.grav * dt;
        pt.p.addScaledVector(pt.v, dt);
        if (pt.p.y < floorY) { pt.p.y = floorY; pt.v.multiplyScalar(0.3); pt.spin *= 0.5; }
        pt.r.x += pt.spin * dt;
        pt.r.y += pt.spin * dt * 0.6;
        sc.setScalar(pt.s * Math.min(1, pt.life / (pt.max * 0.3)));
        q.setFromEuler(pt.r);
        m4.compose(pt.p, q, sc);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

export function createFx(scene) {
  const sprites = spriteSystem(scene);
  const chunks = chunkSystem(scene);
  const DAY_SPRAY = [0xf4fbff, 0xe2f2f6, 0xcfe8ee];
  const NIGHT_SPRAY = [0x7ff6ff, 0x4fd8ef, 0xa8fff4]; // bioluminescent
  let WHITE = DAY_SPRAY;
  let glow = 0;
  return {
    sprites: sprites.points,
    // At night spray glows: brighter sprites and a sea-green palette.
    setGlow(k) {
      glow = k;
      WHITE = k > 0.5 ? NIGHT_SPRAY : DAY_SPRAY;
      sprites.uniforms.uBoost.value = 1 + k * 2.2;
    },
    flame(pos) {
      sprites.emit(pos, { count: 1, color: [0xffd27a, 0xff9a3a, 0xff7424], speed: [0.1, 0.35], up: [0.6, 1.2], outward: 0.4, spread: 0.06, size: [0.1, 0.18], grow: 0.4, alpha: 0.9, gravity: -1.2, drag: 1.2, life: [0.35, 0.6] });
      if (Math.random() < 0.15) sprites.emit(pos.clone().setY(pos.y + 0.3), { count: 1, color: [0x6f6a66, 0x8a8580], speed: [0.1, 0.25], up: [0.6, 1], outward: 0.3, spread: 0.05, size: [0.12, 0.2], grow: 4, alpha: 0.18, gravity: -0.6, drag: 0.6, life: [1.6, 2.6] });
    },
    // A faint glowing wake, for things moving through the water at night.
    glowTrail(pos) {
      if (glow < 0.3) return;
      sprites.emit(pos, { count: 2, color: NIGHT_SPRAY, speed: [0.05, 0.3], up: [0, 0.1], outward: 1, spread: 0.25, size: [0.18, 0.32], grow: 1.8, alpha: 0.5 * glow, gravity: 0, drag: 2, life: [1.2, 2.2] });
    },
    setViewport(h) {
      sprites.uniforms.uViewportH.value = h;
    },
    splash(pos, scale = 1) {
      // droplets thrown up, then a mist that hangs and spreads
      sprites.emit(pos, { count: Math.round(26 * scale), color: WHITE, speed: [1.6 * scale, 3.4 * scale], up: [0.7, 1.3], outward: 0.8, spread: 0.12 * scale, size: [0.04, 0.09], grow: 0.6, alpha: 0.95, gravity: 9.8, drag: 0.4, life: [0.45, 0.9] });
      sprites.emit(pos, { count: Math.round(7 * scale), color: WHITE, speed: [0.3, 0.9], up: [0.3, 0.8], outward: 1, spread: 0.2 * scale, size: [0.25 * scale, 0.45 * scale], grow: 2.2, alpha: 0.45, gravity: 0, drag: 2.5, life: [0.6, 1.2] });
    },
    splinters(pos) {
      chunks.emit(pos, { count: 9, color: [0x9c7146, 0x6b4a2c, 0xb48a5a], speed: 1.8, size: [0.7, 1.5], gravity: 9.8, life: [0.8, 1.4] });
    },
    blood(pos) {
      sprites.emit(pos, { count: 10, color: [0x6e1410, 0x82201a, 0x5a0f0c], speed: [0.2, 0.7], up: [-0.1, 0.25], outward: 1, spread: 0.3, size: [0.3, 0.6], grow: 2.4, alpha: 0.42, gravity: 0, drag: 2.2, life: [1.4, 2.6] });
    },
    // Faint reddish cloud spreading on the surface, for bait.
    scent(pos) {
      sprites.emit(pos, { count: 2, color: [0x7a3524, 0x8a4630], speed: [0.05, 0.25], up: [0, 0.05], outward: 1, spread: 0.15, size: [0.3, 0.5], grow: 3, alpha: 0.28, gravity: 0, drag: 1.5, life: [2, 3] });
    },
    dust(pos) {
      chunks.emit(pos, { count: 5, color: [0xb89a70, 0x8d6c48], speed: 1.0, size: [0.4, 0.8], gravity: 6, life: [0.4, 0.7] });
      sprites.emit(pos, { count: 5, color: [0xd8c7a6], speed: [0.2, 0.6], up: [0.4, 1], outward: 1, spread: 0.05, size: [0.08, 0.14], grow: 2, alpha: 0.5, gravity: 0, drag: 3, life: [0.4, 0.8] });
    },
    update(dt) {
      sprites.update(dt);
      chunks.update(dt, -0.05);
    },
  };
}
