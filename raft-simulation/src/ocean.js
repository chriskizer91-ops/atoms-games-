import * as THREE from 'three';
import { waterDetailTexture } from './textures.js';

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

// Storms raise the swell; the shader gets the same factor as a uniform.
let swell = 1;
export function setSwell(k) {
  swell = k;
}

export function waveHeight(x, z, t) {
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const w = WAVES[i];
    h += w.amp * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t + w.phase);
  }
  return h * swell;
}

const f = (n) => n.toFixed(5);
const glslWaves = WAVES.map(
  (w) => `{
    float th = ${f(w.k)} * (${f(w.dx)} * p.x + ${f(w.dz)} * p.y) - ${f(w.w)} * t + ${f(w.phase)};
    h += ${f(w.amp)} * sin(th);
    float c = ${f(w.amp * w.k)} * cos(th);
    dx += c * ${f(w.dx)};
    dz += c * ${f(w.dz)};
  }`
).join('\n');

const VERT = /* glsl */ `
  uniform float uTime, uSwell;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vH;
  varying float vViewZ;

  void waves(vec2 p, float t, out float h, out float dx, out float dz) {
    h = 0.0; dx = 0.0; dz = 0.0;
    ${glslWaves}
  }

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float h, dx, dz;
    waves(wp.xz, uTime, h, dx, dz);
    h *= uSwell; dx *= uSwell; dz *= uSwell;
    // Far away the swell flattens out under the haze; saves aliasing.
    float fade = 1.0 - smoothstep(120.0, 400.0, length(wp.xz - cameraPosition.xz));
    wp.y += h * fade;
    vH = h * fade;
    vNormalW = normalize(vec3(-dx * fade, 1.0, -dz * fade));
    vWorld = wp.xyz;
    vec4 mv = viewMatrix * wp;
    vViewZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */ `
  #include <packing>
  uniform float uTime, uNear, uFar, uFogDensity, uRefract, uGlow, uDay;
  uniform vec2 uScreen;
  uniform vec3 uSunDir, uSunColor, uDeep, uShallow, uFogColor, uAbsorb;
  uniform sampler2D tDetail, tScene, tDepth;
  uniform samplerCube tSky;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vH;
  varying float vViewZ;

  float sceneViewZ(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    return -perspectiveDepthToViewZ(d, uNear, uFar);
  }

  void main() {
    vec3 toCam = cameraPosition - vWorld;
    float dist = length(toCam);
    vec3 V = toCam / dist;

    // Two scrolling layers of detail normals on top of the swell.
    vec2 uvA = vWorld.xz * 0.11 + vec2(uTime * 0.018, uTime * 0.011);
    vec2 uvB = vWorld.xz * 0.37 + vec2(-uTime * 0.021, uTime * 0.03);
    vec4 dA = texture2D(tDetail, uvA);
    vec4 dB = texture2D(tDetail, uvB);
    vec2 bump = (dA.xy * 2.0 - 1.0) * 0.55 + (dB.xy * 2.0 - 1.0) * 0.35;
    bump *= 1.0 - smoothstep(20.0, 160.0, dist) * 0.8;
    vec3 N = normalize(vNormalW + vec3(bump.x, 0.0, bump.y));

    float NdV = max(dot(N, V), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);

    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 refl = textureCube(tSky, R).rgb;

    // What is under the surface: the scene behind it, bent a little and
    // fading into the water's own colour with depth.
    vec2 suv = gl_FragCoord.xy / uScreen;
    vec2 off = N.xz * uRefract / max(1.0, dist * 0.15);
    float behindZ = sceneViewZ(suv + off);
    if (behindZ < vViewZ) { off = vec2(0.0); behindZ = sceneViewZ(suv); }
    float thick = behindZ - vViewZ;
    bool inFront = thick < -0.05;
    thick = inFront ? 60.0 : max(thick, 0.0);
    vec3 behind = texture2D(tScene, suv + off).rgb;
    vec3 absorb = exp(-uAbsorb * thick);

    float sunUp = clamp(uSunDir.y * 2.0, 0.2, 1.0);
    // Daylight under cloud and at night: the water's own colour fades with the light.
    float lightLvl = mix(0.1, 1.0, uDay);
    vec3 body = uDeep * sunUp * lightLvl;
    // Light scattering up through thin crests on the far side of a wave.
    float back = pow(max(dot(-V, uSunDir) * 0.5 + 0.5, 0.0), 3.0);
    body += uShallow * clamp(vH * 3.0 + 0.25, 0.0, 1.2) * (0.35 + back * 0.8) * lightLvl * lightLvl;
    vec3 under = behind * absorb + body * (1.0 - absorb);

    vec3 col = mix(under, refl, fresnel);

    vec3 Hh = normalize(V + uSunDir);
    float NdH = max(dot(N, Hh), 0.0);
    col += uSunColor * (pow(NdH, 1600.0) * 26.0 + pow(NdH, 200.0) * 0.3) * smoothstep(0.0, 0.1, uSunDir.y);

    // Foam where things break the surface, and on the tallest crests.
    float fn = dA.a * 0.6 + texture2D(tDetail, vWorld.xz * 0.9 + uTime * 0.03).a * 0.4;
    // Only a thin line right at the contact, broken up by noise.
    float edge = 1.0 - smoothstep(0.0, 0.025 + fn * 0.05, thick);
    edge *= smoothstep(0.3, 0.6, fn + 0.2) * 0.85 * (1.0 - smoothstep(25.0, 60.0, dist));
    float crest = smoothstep(0.22, 0.36, vH + (fn - 0.5) * 0.12) * smoothstep(0.58, 0.82, fn);
    float foam = clamp(edge + crest * 0.45, 0.0, 1.0);
    vec3 foamCol = vec3(0.95, 0.98, 1.0) * (0.55 + 0.45 * sunUp) + uSunColor * 0.08;
    // At night anything that disturbs the water lights it up.
    foamCol = mix(foamCol, vec3(0.2, 1.5, 1.7), uGlow);
    // Glowing foam stays close: far crests would light up the whole horizon.
    foam *= mix(1.0, 1.0 - smoothstep(20.0, 70.0, dist), uGlow);
    col = mix(col, foamCol, foam * 0.92);

    float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    col = mix(col, uFogColor, fog);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// A grid that is dense under the player and stretches toward the horizon.
function oceanGrid(n, inner, outer) {
  const geo = new THREE.PlaneGeometry(2, 2, n, n);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const span = (u) => Math.sign(u) * (inner * Math.abs(u) + (outer - inner) * Math.abs(u) ** 3);
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, span(pos.getX(i)));
    pos.setZ(i, span(pos.getZ(i)));
  }
  geo.computeBoundingSphere();
  return { geo, step: (inner * 2) / n };
}

export function createOcean(scene, { sky, fog }) {
  const { geo, step } = oceanGrid(220, 36, 900);
  const uniforms = {
    uTime: { value: 0 },
    uSwell: { value: 1 },
    uGlow: { value: 0 },
    uDay: { value: 1 },
    uNear: { value: 0.05 },
    uFar: { value: 1500 },
    uScreen: { value: new THREE.Vector2(1, 1) },
    uRefract: { value: 0.035 },
    uSunDir: { value: sky.sunDir },
    uSunColor: { value: sky.sunColor },
    uDeep: { value: new THREE.Color(0x0e4b63) },
    uShallow: { value: new THREE.Color(0x167476) },
    uAbsorb: { value: new THREE.Vector3(0.55, 0.2, 0.14) },
    uFogColor: { value: fog.color },
    uFogDensity: { value: fog.density },
    tDetail: { value: waterDetailTexture() },
    tScene: { value: null },
    tDepth: { value: null },
    tSky: { value: null },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
  const water = new THREE.Mesh(geo, mat);
  water.frustumCulled = false;
  scene.add(water);

  return {
    mesh: water,
    uniforms,
    setSources({ scene: sceneTex, depth, sky: skyTex }) {
      uniforms.tScene.value = sceneTex;
      uniforms.tDepth.value = depth;
      uniforms.tSky.value = skyTex;
    },
    setCamera(cam) {
      uniforms.uNear.value = cam.near;
      uniforms.uFar.value = cam.far;
    },
    setScreen(w, h) {
      uniforms.uScreen.value.set(w, h);
    },
    update(t, focus) {
      uniforms.uTime.value = t;
      uniforms.uSwell.value = swell;
      // Follow the player in whole grid steps so the surface doesn't swim.
      water.position.set(Math.round(focus.x / step) * step, 0, Math.round(focus.z / step) * step);
    },
  };
}
