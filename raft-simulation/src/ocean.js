import * as THREE from 'three';
import { waterDetailTexture } from './textures.js';
import { FRAME } from './frame.js';

// The sea. You can see into it: whatever is under the surface fades into the
// water's own colour with depth. The surface reflects the sky, sparkles where
// the sun hits it, and foams where something breaks it.
//
// Brought over from the sailing game (Sandcastle Cays) and built on:
//  - a long ocean swell under the small waves, big enough to ride and surf;
//  - whitecaps that spread across the sea as the wind rises;
//  - calm water in the lee of an island, so its beach isn't washed away;
//  - the whole pattern lives on the chart, so it streams past as the raft
//    travels and swings round as the raft turns.
//
// The same sums run on the CPU (waveHeight) for anything that floats and in
// the shader for the surface, so what you see is where things float.
const G = 9.8;

function wave(w) {
  const l = Math.hypot(w.dir[0], w.dir[1]);
  const k = (Math.PI * 2) / w.len;
  return { dx: w.dir[0] / l, dz: w.dir[1] / l, k, w: Math.sqrt(G * k), amp: w.amp, phase: w.phase };
}

// The trade wind blows from the south-east, so the chop runs north-west
// (chart directions: +x east, +z south).
const WAVES = [
  { dir: [-0.8, -0.6], len: 15, amp: 0.15, phase: 0.0 },
  { dir: [-0.2, -1.0], len: 9.5, amp: 0.09, phase: 1.7 },
  { dir: [-1.0, 0.25], len: 5.6, amp: 0.045, phase: 4.1 },
  { dir: [0.55, -0.85], len: 3.3, amp: 0.022, phase: 2.6 },
].map(wave);

// The open sea's long swell, rolling up from the south-east.
const OPEN_WAVES = [
  { dir: [-0.62, -0.78], len: 54, amp: 0.36, phase: 0.4 },
  { dir: [-0.96, -0.28], len: 34, amp: 0.2, phase: 2.2 },
  { dir: [-0.25, -0.97], len: 22, amp: 0.1, phase: 5.0 },
].map(wave);
export const OPEN_SWELL_MAX = OPEN_WAVES.reduce((a, w) => a + w.amp, 0);

// Weather scales both: the chop (swell) and the long swell (openSwell).
let swell = 1;
let openSwell = 0.7;
export function setSwell(k, open = openSwell) {
  swell = k;
  openSwell = open;
}

// Islands near the raft, in scene coordinates: x, z, radius. Waves die away
// toward a beach and the long swell breaks before it gets there.
const MAX_ISLES = 3;
const isles = new Float32Array(MAX_ISLES * 3);
let isleCount = 0;
export function setShelters(list) {
  isleCount = Math.min(MAX_ISLES, list.length);
  for (let i = 0; i < MAX_ISLES; i++) {
    const s = list[i];
    isles[i * 3] = s ? s.x : 0;
    isles[i * 3 + 1] = s ? s.z : 0;
    isles[i * 3 + 2] = s && i < isleCount ? s.r : 0;
  }
}

const sstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Height of the water surface at a scene point, as drawn.
export function waveHeight(x, z, t) {
  // scene -> chart
  const px = FRAME.x + x * FRAME.c + z * FRAME.s;
  const pz = FRAME.z - x * FRAME.s + z * FRAME.c;
  let chop = 1, open = 1;
  for (let i = 0; i < isleCount; i++) {
    const d = Math.hypot(x - isles[i * 3], z - isles[i * 3 + 1]) - isles[i * 3 + 2];
    if (d < 150) {
      chop = Math.min(chop, sstep(-2, 55, d));
      open = Math.min(open, sstep(0, 150, d));
    }
  }
  let h = 0;
  for (let i = 0; i < WAVES.length; i++) {
    const w = WAVES[i];
    h += w.amp * Math.sin(w.k * (w.dx * px + w.dz * pz) - w.w * t + w.phase);
  }
  h *= swell * (0.12 + 0.88 * chop);
  const oa = openSwell * open;
  if (oa > 0.001) {
    let o = 0;
    for (let i = 0; i < OPEN_WAVES.length; i++) {
      const w = OPEN_WAVES[i];
      o += w.amp * Math.sin(w.k * (w.dx * px + w.dz * pz) - w.w * t + w.phase);
    }
    h += o * oa;
  }
  return h;
}

const f = (n) => n.toFixed(5);
const glsl = (list) => list.map(
  (w) => `{
    float th = ${f(w.k)} * (${f(w.dx)} * p.x + ${f(w.dz)} * p.y) - ${f(w.w)} * t + ${f(w.phase)};
    h += ${f(w.amp)} * sin(th);
    float c = ${f(w.amp * w.k)} * cos(th);
    dx += c * ${f(w.dx)};
    dz += c * ${f(w.dz)};
  }`
).join('\n');

const VERT = /* glsl */ `
  uniform float uTime, uSwell, uOpenSwell;
  uniform vec4 uFrame;       // the raft on the chart: x, z, cos(turn), sin(turn)
  uniform vec3 uIsle[${MAX_ISLES}];   // scene x, z and radius of islands close by
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec2 vChart;
  varying float vH;
  varying float vHo;
  varying float vViewZ;

  void waves(vec2 p, float t, out float h, out float dx, out float dz) {
    h = 0.0; dx = 0.0; dz = 0.0;
    ${glsl(WAVES)}
  }
  void openWaves(vec2 p, float t, out float h, out float dx, out float dz) {
    h = 0.0; dx = 0.0; dz = 0.0;
    ${glsl(OPEN_WAVES)}
  }

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec2 sp = wp.xz;
    vec2 p = uFrame.xy + vec2(sp.x * uFrame.z + sp.y * uFrame.w, -sp.x * uFrame.w + sp.y * uFrame.z);

    float chop = 1.0, open = 1.0;
    for (int i = 0; i < ${MAX_ISLES}; i++) {
      if (uIsle[i].z > 0.0) {
        float d = length(sp - uIsle[i].xy) - uIsle[i].z;
        chop = min(chop, smoothstep(-2.0, 55.0, d));
        open = min(open, smoothstep(0.0, 150.0, d));
      }
    }

    float camDist = length(sp - cameraPosition.xz);
    // Far away the waves flatten out under the haze; saves shimmer.
    float amp = uSwell * (0.12 + 0.88 * chop) * (1.0 - smoothstep(120.0, 400.0, camDist));
    float oamp = uOpenSwell * open * (1.0 - smoothstep(260.0, 760.0, camDist));

    float h, dx, dz;
    waves(p, uTime, h, dx, dz);
    float oh = 0.0, odx = 0.0, odz = 0.0;
    if (oamp > 0.0) openWaves(p, uTime, oh, odx, odz);

    wp.y += h * amp + oh * oamp;
    vH = h * amp;
    vHo = oh * oamp;
    // Slopes were summed on the chart; turn them into the scene.
    vec2 sl = vec2(dx * amp + odx * oamp, dz * amp + odz * oamp);
    sl = vec2(sl.x * uFrame.z - sl.y * uFrame.w, sl.x * uFrame.w + sl.y * uFrame.z);
    vNormalW = normalize(vec3(-sl.x, 1.0, -sl.y));
    vChart = p;
    vWorld = wp.xyz;
    vec4 mv = viewMatrix * wp;
    vViewZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */ `
  #include <packing>
  uniform float uTime, uNear, uFar, uFogDensity, uRefract, uGlow, uDay, uWind, uRain;
  uniform vec4 uFrame;
  uniform vec2 uScreen;
  uniform vec3 uSunDir, uSunColor, uDeep, uShallow, uFogColor, uAbsorb;
  uniform sampler2D tDetail, tScene, tDepth;
  uniform samplerCube tSky;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec2 vChart;
  varying float vH;
  varying float vHo;
  varying float vViewZ;

  float sceneViewZ(vec2 uv) {
    float d = texture2D(tDepth, uv).x;
    return -perspectiveDepthToViewZ(d, uNear, uFar);
  }

  void main() {
    vec3 toCam = cameraPosition - vWorld;
    float dist = length(toCam);
    vec3 V = toCam / dist;

    // Two scrolling layers of small ripples on top of the waves. They are
    // pinned to the chart, so they stream past a moving raft.
    vec2 uvA = vChart * 0.11 + vec2(uTime * 0.018, uTime * 0.011);
    vec2 uvB = vChart * 0.37 + vec2(-uTime * 0.021, uTime * 0.03);
    vec4 dA = texture2D(tDetail, uvA);
    vec4 dB = texture2D(tDetail, uvB);
    // A blow roughens the surface; rain pocks it.
    float rough = 1.0 + clamp((uWind - 7.0) * 0.06, 0.0, 0.6);
    vec2 bump = (dA.xy * 2.0 - 1.0) * 0.55 + (dB.xy * 2.0 - 1.0) * 0.35;
    if (uRain > 0.01) {
      vec2 uvR = vChart * 1.9 + vec2(uTime * 0.61, -uTime * 0.47);
      bump += (texture2D(tDetail, uvR).xy * 2.0 - 1.0) * 0.5 * uRain * (1.0 - smoothstep(8.0, 45.0, dist));
    }
    bump *= (1.0 - smoothstep(20.0, 160.0, dist) * 0.8) * rough;
    bump = vec2(bump.x * uFrame.z - bump.y * uFrame.w, bump.x * uFrame.w + bump.y * uFrame.z);
    vec3 N = normalize(vNormalW + vec3(bump.x, 0.0, bump.y));

    float NdV = max(dot(N, V), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);

    // The sky was captured facing north; turn the mirror ray onto the chart.
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 Rc = vec3(R.x * uFrame.z + R.z * uFrame.w, R.y, -R.x * uFrame.w + R.z * uFrame.z);
    vec3 refl = textureCube(tSky, Rc).rgb;

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
    // Light scattering up through the crests: brightest looking toward the
    // sun through the thin top of a wave.
    float back = pow(max(dot(-V, uSunDir) * 0.5 + 0.5, 0.0), 3.0);
    float crestH = vH * 3.0 + vHo * 0.9;
    body += uShallow * clamp(crestH + 0.25, 0.0, 1.3) * (0.35 + back * 0.85) * lightLvl * lightLvl;
    vec3 under = behind * absorb + body * (1.0 - absorb);

    vec3 col = mix(under, refl, fresnel);

    vec3 Hh = normalize(V + uSunDir);
    float NdH = max(dot(N, Hh), 0.0);
    col += uSunColor * (pow(NdH, 1600.0) * 26.0 + pow(NdH, 200.0) * 0.3) * smoothstep(0.0, 0.1, uSunDir.y);

    // Foam where things break the surface, and on the tallest crests.
    float fn = dA.a * 0.6 + texture2D(tDetail, vChart * 0.9 + uTime * 0.03).a * 0.4;
    // Only a thin line right at the contact, broken up by noise.
    float edge = 1.0 - smoothstep(0.0, 0.025 + fn * 0.05, thick);
    edge *= smoothstep(0.3, 0.6, fn + 0.2) * 0.85 * (1.0 - smoothstep(25.0, 60.0, dist));
    float crest = smoothstep(0.22, 0.36, vH + (fn - 0.5) * 0.12) * smoothstep(0.58, 0.82, fn);
    // Whitecaps: breaking crests scattered over the sea once the wind passes
    // about 15 knots, more the harder it blows. They ride the tops of the
    // swell and drift downwind.
    float cover = clamp((uWind - 7.5) / 13.0, 0.0, 0.34);
    float whitecap = 0.0;
    if (cover > 0.0) {
      vec2 wuv = vChart * 0.045 + vec2(uTime * 0.026, uTime * 0.024);
      float wn = texture2D(tDetail, wuv).a * 0.65 + texture2D(tDetail, wuv * 2.7 + 0.3).a * 0.35;
      whitecap = smoothstep(1.0 - cover, 1.06 - cover * 0.6, wn) * (0.4 + 0.6 * smoothstep(-0.15, 0.4, vHo + vH * 2.0));
      whitecap *= 1.0 - smoothstep(120.0, 600.0, dist) * 0.6;
    }
    float foam = clamp(edge + crest * 0.45 + whitecap * 0.75, 0.0, 1.0);
    vec3 foamCol = vec3(0.95, 0.98, 1.0) * (0.55 + 0.45 * sunUp) * mix(0.35, 1.0, lightLvl) + uSunColor * 0.08;
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
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
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
  let { geo, step } = oceanGrid(200, 38, 1000);
  let gridN = 200;
  const uniforms = {
    uTime: { value: 0 },
    uSwell: { value: 1 },
    uOpenSwell: { value: 0.7 },
    uWind: { value: 6 },
    uRain: { value: 0 },
    uFrame: { value: new THREE.Vector4(0, 0, 1, 0) },
    uIsle: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uGlow: { value: 0 },
    uDay: { value: 1 },
    uNear: { value: 0.05 },
    uFar: { value: 1500 },
    uScreen: { value: new THREE.Vector2(1, 1) },
    uRefract: { value: 0.035 },
    uSunDir: { value: sky.sunDir },
    uSunColor: { value: sky.sunColor },
    // Red light is soaked up fast and blue-green travels far, so sand under
    // clear water reads turquoise and depth reads blue.
    uDeep: { value: new THREE.Color(0x0c5273) },
    uShallow: { value: new THREE.Color(0x178f8a) },
    uAbsorb: { value: new THREE.Vector3(0.5, 0.15, 0.11) },
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
    // How finely the surface is meshed (graphics quality).
    setDetail(n) {
      if (n === gridN) return;
      gridN = n;
      water.geometry.dispose();
      ({ geo, step } = oceanGrid(n, 38, 1000));
      water.geometry = geo;
    },
    // The wind (m/s) and rain (0..1) on the water.
    setWeather(wind, rain) {
      uniforms.uWind.value = wind;
      uniforms.uRain.value = rain;
    },
    update(t, focus) {
      uniforms.uTime.value = t;
      uniforms.uSwell.value = swell;
      uniforms.uOpenSwell.value = openSwell;
      uniforms.uFrame.value.set(FRAME.x, FRAME.z, FRAME.c, FRAME.s);
      for (let i = 0; i < MAX_ISLES; i++) uniforms.uIsle.value[i].set(isles[i * 3], isles[i * 3 + 1], isles[i * 3 + 2]);
      // Follow the player in whole grid steps so the surface doesn't swim.
      water.position.set(Math.round(focus.x / step) * step, 0, Math.round(focus.z / step) * step);
    },
  };
}
