import * as THREE from 'three';
import { waterDetailTexture } from './textures.js';
import { waveHeight } from './ocean.js';
import { toScene, toWorld } from './frame.js';

// The white water the raft leaves behind under way (from the sailing game): a
// trail of foam that spreads and fades, lying on the waves. A strip of
// triangles that starts at the stern; its points are remembered on the chart,
// so the trail stays put on the sea while the raft sails on and turns.
const N = 40;
const STEP = 0.35; // seconds between trail points

export function createWake(scene) {
  const pos = new Float32Array(N * 2 * 3);
  const alpha = new Float32Array(N * 2);
  const uvs = new Float32Array(N * 2 * 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('foam', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  const idx = [];
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setIndex(idx);
  for (let i = 0; i < N; i++) { uvs[i * 4] = 0; uvs[i * 4 + 1] = i; uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = i; }
  const uniforms = { tDetail: { value: waterDetailTexture() }, uGlow: { value: 0 }, uDay: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    // The sea's mesh is coarser than this strip, so lift it clear in depth.
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -6,
    uniforms,
    vertexShader: /* glsl */ `
      attribute float foam;
      varying float vFoam;
      varying vec2 vUv;
      varying vec2 vWorld;
      void main() {
        vFoam = foam;
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDetail;
      uniform float uGlow, uDay;
      varying float vFoam;
      varying vec2 vUv;
      varying vec2 vWorld;
      void main() {
        float n = texture2D(tDetail, vWorld * 0.35).a * 0.6 + texture2D(tDetail, vWorld * 0.9).a * 0.4;
        // Streaks along the trail, broken up by the ripple pattern; soft at both edges.
        float across = 1.0 - pow(abs(vUv.x * 2.0 - 1.0), 1.6);
        float a = vFoam * across * smoothstep(0.32, 0.62, n + vFoam * 0.25);
        vec3 col = mix(vec3(0.92, 0.97, 1.0) * (0.25 + 0.75 * uDay), vec3(0.2, 1.4, 1.6), uGlow);
        gl_FragColor = vec4(col, a * 0.7);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.visible = false;
  scene.add(mesh);

  // Ring of chart points, newest first.
  const pts = [];
  for (let i = 0; i < N; i++) pts.push({ x: 0, z: 0, age: 0, strength: 0, width: 1 });
  let count = 0;
  let timer = 0;
  const w = { x: 0, z: 0 };
  const s = { x: 0, z: 0 };

  return {
    mesh,
    reset() { count = 0; mesh.visible = false; },
    // sternX/Z: where the water leaves the raft (scene); half: half the raft's width there.
    update(t, dt, sternX, sternZ, half, speed, glow, day) {
      uniforms.uGlow.value = glow;
      uniforms.uDay.value = day;
      for (let i = 0; i < count; i++) pts[i].age += dt;
      while (count && pts[count - 1].age > STEP * (N - 1)) count--;
      timer -= dt;
      const strength = Math.min(1, Math.max(0, speed - 0.5) / 2.2);
      if (timer <= 0 && strength > 0.02) {
        timer = STEP;
        const p = pts.pop();
        toWorld(sternX, sternZ, w);
        p.x = w.x; p.z = w.z; p.age = 0; p.strength = strength; p.width = half;
        pts.unshift(p);
        count = Math.min(N - 1, count + 1);
      }
      mesh.visible = count > 1;
      if (!mesh.visible) return;
      // First pair sits at the stern now; the rest follow the remembered points.
      let px = sternX, pz = sternZ;
      for (let i = 0; i < N; i++) {
        const p = i === 0 ? null : pts[Math.min(i - 1, count - 1)];
        let x = sternX, z = sternZ, age = 0, str = strength, width = half;
        if (p) {
          toScene(p.x, p.z, s);
          x = s.x; z = s.z; age = p.age; str = p.strength; width = p.width;
        }
        // Across the trail: square to the line back to the previous point.
        let dx = x - px, dz = z - pz;
        const l = Math.hypot(dx, dz);
        if (l > 0.001) { dx /= l; dz /= l; } else { dx = 0; dz = 1; }
        const life = Math.min(1, age / (STEP * (N - 1)));
        const hw = width * (0.75 + 1.4 * life) + 2.2 * life;
        const y = waveHeight(x, z, t) + 0.035;
        const o = i * 6;
        pos[o] = x - dz * hw; pos[o + 1] = y; pos[o + 2] = z + dx * hw;
        pos[o + 3] = x + dz * hw; pos[o + 4] = y; pos[o + 5] = z - dx * hw;
        const a = i > count ? 0 : str * (1 - life) * (1 - life) * Math.min(1, i / 2 + 0.35);
        alpha[i * 2] = a;
        alpha[i * 2 + 1] = a;
        px = x; pz = z;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.foam.needsUpdate = true;
    },
  };
}
