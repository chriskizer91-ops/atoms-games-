import * as THREE from 'three';

// The same wave sum runs on the CPU (for floating things) and in the water
// shader (for the surface), so what you see is where things float.
const G = 9.8;
const WAVES = [
  { dir: [1.0, 0.35], len: 15, amp: 0.15, phase: 0.0 },
  { dir: [-0.45, 1.0], len: 9.5, amp: 0.09, phase: 1.7 },
  { dir: [0.7, -0.7], len: 5.6, amp: 0.045, phase: 4.1 },
  { dir: [-0.95, -0.25], len: 3.3, amp: 0.022, phase: 2.6 },
].map((w) => {
  const l = Math.hypot(w.dir[0], w.dir[1]);
  const k = (Math.PI * 2) / w.len;
  return { dx: w.dir[0] / l, dz: w.dir[1] / l, k, w: Math.sqrt(G * k), amp: w.amp, phase: w.phase };
});

export function waveHeight(x, z, t) {
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const w = WAVES[i];
    h += w.amp * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t + w.phase);
  }
  return h;
}

const glslWaves = WAVES.map(
  (w) => `h += ${w.amp.toFixed(4)} * sin(${w.k.toFixed(5)} * (${w.dx.toFixed(5)} * p.x + ${w.dz.toFixed(5)} * p.y) - ${w.w.toFixed(5)} * t + ${w.phase.toFixed(4)});`
).join('\n  ');

const WAVE_GLSL = /* glsl */ `
uniform float uTime;
varying float vWaveH;
float waveH(vec2 p, float t) {
  float h = 0.0;
  ${glslWaves}
  return h;
}
`;

export const OCEAN_COLORS = {
  deep: new THREE.Color(0x17607a),
  crest: new THREE.Color(0x63bfc4),
};

export function createOcean(scene) {
  const size = 260;
  const segs = 180;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const spacing = size / segs;

  const uniforms = { uTime: { value: 0 } };
  const mat = new THREE.MeshPhongMaterial({
    color: OCEAN_COLORS.deep,
    specular: 0x5d95a0,
    shininess: 45,
    flatShading: true,
    transparent: true,
    opacity: 0.86,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${WAVE_GLSL}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wp0 = modelMatrix * vec4(transformed, 1.0);
        float hh = waveH(wp0.xz, uTime);
        transformed.y += hh;
        vWaveH = hh;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vWaveH;\nuniform vec3 uCrest;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, uCrest, smoothstep(0.08, 0.3, vWaveH));`
      );
    shader.uniforms.uCrest = { value: OCEAN_COLORS.crest };
  };

  const water = new THREE.Mesh(geo, mat);
  water.renderOrder = 1;
  water.frustumCulled = false;
  scene.add(water);

  // A flat skirt out to the horizon so the fog never shows an edge.
  const farGeo = new THREE.RingGeometry(size * 0.48, 1400, 64, 1);
  farGeo.rotateX(-Math.PI / 2);
  const farMat = new THREE.MeshLambertMaterial({ color: OCEAN_COLORS.deep });
  const far = new THREE.Mesh(farGeo, farMat);
  far.position.y = -0.05;
  scene.add(far);

  return {
    update(t, focus) {
      uniforms.uTime.value = t;
      // Follow the player in whole grid steps so the surface doesn't swim.
      const sx = Math.round(focus.x / spacing) * spacing;
      const sz = Math.round(focus.z / spacing) * spacing;
      water.position.set(sx, 0, sz);
      far.position.x = sx;
      far.position.z = sz;
    },
  };
}
