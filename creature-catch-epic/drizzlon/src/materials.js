// Materials for Drizzlon: scaled skin, eyes, wing membrane and water.
import * as THREE from 'three';

// ------------------------------------------------------------------ scale tile
// A small tileable texture of rounded scales. RG = slope of the height, B = a random
// tint per scale, A = how deep we are in the crease between scales.
export function makeScaleTexture(size = 256, cells = 9) {
  const rnd = mulberry(7);
  const pts = [];
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
    // jittered hex-ish layout so scales look packed, not gridded
    const ox = (j % 2) * 0.5;
    pts.push([(i + ox + 0.5 + (rnd() - 0.5) * 0.42) / cells, (j + 0.5 + (rnd() - 0.5) * 0.42) / cells, rnd()]);
  }
  const H = new Float32Array(size * size), T = new Float32Array(size * size), C = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size, v = (y + 0.5) / size;
    let d1 = 9, d2 = 9, t = 0;
    for (const p of pts) {
      let dx = Math.abs(u - p[0]); dx = Math.min(dx, 1 - dx);
      let dy = Math.abs(v - p[1]); dy = Math.min(dy, 1 - dy);
      const d = Math.hypot(dx, dy);
      if (d < d1) { d2 = d1; d1 = d; t = p[2]; } else if (d < d2) d2 = d;
    }
    const edge = (d2 - d1) * cells;            // 0 at the crease
    const k = Math.min(1, edge / 0.55);
    const dome = 1 - Math.min(1, d1 * cells / 0.75) ** 2;
    H[y * size + x] = (k * k * (3 - 2 * k)) * (0.72 + 0.28 * dome);
    T[y * size + x] = t;
    C[y * size + x] = 1 - Math.min(1, edge / 0.22);
  }
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => H[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5 * size / cells;   // slope per scale-width
    const gy = (at(x, y + 1) - at(x, y - 1)) * 0.5 * size / cells;
    const i = (y * size + x) * 4;
    data[i] = Math.max(0, Math.min(255, 128 + gx * 40));
    data[i + 1] = Math.max(0, Math.min(255, 128 + gy * 40));
    data[i + 2] = T[y * size + x] * 255;
    data[i + 3] = C[y * size + x] * 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const NOISE = /* glsl */`
float hash31(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i+vec3(0,0,0)),hash31(i+vec3(1,0,0)),f.x), mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x), mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}`;

// ------------------------------------------------------------------ skin
export function makeSkinMaterial(shared) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.5, metalness: 0,
    clearcoat: 0.45, clearcoatRoughness: 0.32, envMapIntensity: 0.8,
  });
  mat.userData.uniforms = {
    uScaleTex: { value: shared.scaleTex },
    uScaleFreq: { value: 24.0 },
    uBump: { value: 1.0 },
    uWet: shared.uWet,
    uFlash: shared.uFlash,
    uFlashColor: shared.uFlashColor,
    uSunDirView: shared.uSunDirView,
    uEyeSurf: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uEyeRight: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uEyeUp: { value: [new THREE.Vector3(), new THREE.Vector3()] },
    uBrow: { value: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)] },   // per eye: raise, tilt, unused
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mat.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 _color1; attribute vec4 _color2; attribute vec4 _surf;
        varying vec4 vCol1; varying vec4 vCol2; varying vec4 vSurf; varying vec3 vRest; varying vec3 vRestN;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vCol1 = vec4(pow(_color1.rgb, vec3(2.2)), _color1.a); vCol2 = vec4(pow(_color2.rgb, vec3(2.2)), _color2.a);
        vSurf = vec4(_surf.x * 12.0 - 6.0, _surf.yzw); vRest = position; vRestN = normal;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec4 vCol1; varying vec4 vCol2; varying vec4 vSurf; varying vec3 vRest; varying vec3 vRestN;
        uniform sampler2D uScaleTex; uniform float uScaleFreq, uBump, uWet, uFlash; uniform vec3 uFlashColor; uniform vec3 uSunDirView;
        uniform vec3 uEyeSurf[2], uEyeRight[2], uEyeUp[2], uBrow[2];
        float gAO, gGloss, gOver, gScale, gCrease;
        float browStroke(int i, float side){
          vec3 d = vRest - uEyeSurf[i];
          vec2 q = vec2(dot(d, uEyeRight[i]) * side, dot(d, uEyeUp[i]));       // x grows toward the outside of the face
          float raise = uBrow[i].x, tilt = uBrow[i].y;
          vec2 a = vec2(-0.036, 0.0700 + raise - tilt * 0.012), b = vec2(0.004, 0.0815 + raise), c = vec2(0.044, 0.0665 + raise + tilt * 0.012);
          // quadratic curve a-b-c as a chain of short tapered strokes
          float best = 1.0; vec2 p0 = a; float w0 = 0.0016;
          for (int k = 1; k <= 10; k++){
            float t = float(k) / 10.0;
            vec2 p1 = mix(mix(a, b, t), mix(b, c, t), t);
            float w1 = mix(0.0016, 0.0058, sin(3.14159 * pow(t, 0.75)));
            vec2 pa = q - p0, ba = p1 - p0;
            float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
            best = min(best, length(pa - ba * h) - mix(w0, w1, h));
            p0 = p1; w0 = w1;
          }
          return best;
        }
        ${NOISE}
        vec4 triScale(vec3 p, vec3 w, out vec3 grad){
          vec4 a = texture2D(uScaleTex, p.yz), b = texture2D(uScaleTex, p.zx), c = texture2D(uScaleTex, p.xy);
          vec2 ga = a.rg*2.0-1.0, gb = b.rg*2.0-1.0, gc = c.rg*2.0-1.0;
          grad = w.x*vec3(0.0, ga.x, ga.y) + w.y*vec3(gb.y, 0.0, gb.x) + w.z*vec3(gc.x, gc.y, 0.0);
          return a*w.x + b*w.y + c*w.z;
        }
        vec3 bumpN(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir){
          vec3 vSigmaX = normalize(dFdx(surf_pos)), vSigmaY = normalize(dFdy(surf_pos));
          vec3 R1 = cross(vSigmaY, surf_norm), R2 = cross(surf_norm, vSigmaX);
          float fDet = dot(vSigmaX, R1) * faceDir;
          vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
          return normalize(abs(fDet) * surf_norm - vGrad);
        }`)
      .replace('#include <color_fragment>', `
        float fw = max(fwidth(vSurf.x), 1e-4) * 0.9;
        gOver = smoothstep(-fw, fw, vSurf.x);
        gAO = vCol1.a;
        gScale = vSurf.y * (1.0 - gOver);
        gGloss = mix(vSurf.z, vCol2.a, gOver);
        vec3 skinCol = vCol1.rgb;
        // slow mottling so the blue is not one flat paint
        float m1 = vnoise(vRest * 21.0), m2 = vnoise(vRest * 58.0 + 7.0);
        float mott = (m1 * 0.65 + m2 * 0.35) - 0.5;
        skinCol *= 1.0 + mott * 0.30 * vSurf.y;
        skinCol = mix(skinCol, skinCol * vec3(0.72, 0.95, 1.25), smoothstep(0.58, 0.8, m1) * 0.22 * vSurf.y);
        // scales
        vec3 wgt = pow(abs(normalize(vRestN)), vec3(4.0)); wgt /= (wgt.x + wgt.y + wgt.z);
        vec3 grad1, grad2;
        vec4 s1 = triScale(vRest * uScaleFreq, wgt, grad1);
        vec4 s2 = triScale(vRest * uScaleFreq * 2.7 + 0.37, wgt, grad2);
        gCrease = s1.a;
        skinCol *= 1.0 + (s1.b - 0.5) * 0.16 * gScale;
        skinCol *= 1.0 - s1.a * 0.34 * gScale;
        skinCol *= 1.0 - s2.a * 0.10 * gScale;
        vec3 overCol = vCol2.rgb * (1.0 + (m2 - 0.5) * 0.08);
        diffuseColor.rgb *= mix(skinCol, overCol, gOver);
        // a thin dark line where paint meets paint, like a hand-inked edge softened
        float lineK = 1.0 - smoothstep(0.0, 2.5 * fw, abs(vSurf.x));
        diffuseColor.rgb *= 1.0 - 0.18 * lineK * step(vSurf.x, 5.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, uFlashColor, uFlash);
      `)
      .replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = mix(0.66, 0.16, gGloss);
        roughnessFactor = mix(roughnessFactor, roughnessFactor * 0.55, uWet);
        roughnessFactor = clamp(roughnessFactor + gCrease * 0.2 * gScale, 0.04, 1.0);
      `)
      .replace('#include <normal_fragment_maps>', `
        {
          vec3 g = grad1 * 1.0 + grad2 * 0.35;
          vec2 dH = vec2(dot(g, dFdx(vRest)), dot(g, dFdy(vRest))) * uScaleFreq * 0.0058 * uBump * gScale;
          normal = bumpN(-vViewPosition, normal, dH, faceDirection);
        }
      `)
      .replace('#include <clearcoat_normal_fragment_begin>', `#include <clearcoat_normal_fragment_begin>
        // the wet coat follows the scales only a little
        clearcoatNormal = normalize(mix(nonPerturbedNormal, normal, 0.35));
      `)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        material.clearcoat = mix(mix(0.16, 0.9, gGloss * gGloss), 1.0, uWet * 0.7);
        material.clearcoatRoughness = mix(0.36, 0.10, max(gGloss, uWet));
      `)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        {
          float ao = gAO;
          reflectedLight.indirectDiffuse *= ao;
          reflectedLight.indirectSpecular *= mix(1.0, ao * ao, 0.85);
          reflectedLight.directDiffuse *= mix(1.0, ao, 0.45);
          reflectedLight.directSpecular *= mix(1.0, ao, 0.6);
          // soft light bleeding through at glancing angles, for a living, slightly wet skin
          float ndv = saturate(dot(normal, normalize(vViewPosition)));
          float rim = pow(1.0 - ndv, 3.0);
          float back = saturate(dot(normal, -uSunDirView) * 0.6 + 0.4);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.35, 0.75, 1.0) * rim * (0.15 + 0.55 * back) * ao * (1.0 - gOver * 0.5);
        }
      `);
  };
  mat.customProgramCacheKey = () => 'drizzlon-skin';
  return mat;
}

// ------------------------------------------------------------------ wing / frill membrane
export function makeMembraneMaterial(shared) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide,
  });
  mat.userData.uniforms = { uSunDirView: shared.uSunDirView, uFlash: shared.uFlash, uFlashColor: shared.uFlashColor };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mat.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float _kind; varying vec2 vUvM; varying float vKind; varying vec3 vRest;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vUvM = uv; vKind = _kind; vRest = position;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vUvM; varying float vKind; varying vec3 vRest; uniform vec3 uSunDirView; uniform float uFlash; uniform vec3 uFlashColor;
        float gThin;
        ${NOISE}`)
      .replace('#include <color_fragment>', `
        float u = vUvM.x, v = vUvM.y;
        float spoke = min(v, 1.0 - v);
        float nearBone = 1.0 - smoothstep(0.0, 0.16, spoke);
        float rimEdge = smoothstep(0.86, 1.0, u);
        vec3 teal = vec3(0.205, 0.815, 0.640);
        vec3 deep = vec3(0.030, 0.330, 0.560);
        vec3 pale = vec3(0.520, 0.960, 0.800);
        // fine veins branching off the finger bones
        float vn = vnoise(vec3(u * 9.0, v * 34.0, vKind * 3.0));
        float veins = smoothstep(0.035, 0.0, abs(fract(v * 5.0 + vn * 0.55 + u * 0.8) - 0.5)) * (1.0 - nearBone) * smoothstep(0.05, 0.3, u);
        vec3 col = mix(teal, pale, smoothstep(0.1, 0.5, spoke) * (0.55 + 0.45 * u));
        col = mix(col, deep, nearBone * 0.55);
        col = mix(col, deep, veins * 0.20);
        col = mix(col, deep, rimEdge * 0.35);
        col *= 0.92 + 0.16 * vnoise(vRest * 90.0);
        gThin = (1.0 - nearBone) * (1.0 - veins * 0.5);
        diffuseColor.rgb *= col;
        diffuseColor.rgb = mix(diffuseColor.rgb, uFlashColor, uFlash);
      `)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        {
          // light coming through the thin skin from behind
          float back = saturate(dot(normal, -uSunDirView));
          reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 1.05, 0.85) * back * 1.5 * gThin;
          float ndv = saturate(dot(normal, normalize(vViewPosition)));
          reflectedLight.indirectDiffuse += diffuseColor.rgb * 0.35 * pow(1.0 - ndv, 2.0);
        }
      `);
  };
  mat.customProgramCacheKey = () => 'drizzlon-membrane';
  return mat;
}

// ------------------------------------------------------------------ eyes
export function makeEyeMaterial(shared, side) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0, clearcoat: 1.0, clearcoatRoughness: 0.03 });
  const u = mat.userData.uniforms = {
    uGaze: { value: new THREE.Vector2(0, 0) },
    uPupil: { value: 1.0 },
    uLidTop: { value: 0.2 },
    uLidBot: { value: 0.0 },
    uLidTilt: { value: 0.0 },
    uSmile: { value: 0.0 },
    uSlit: { value: 0.0 },
    uSide: { value: side },
    uSkin: { value: new THREE.Color().setRGB(0.045, 0.21, 0.80) },
    uSkinDark: { value: new THREE.Color().setRGB(0.012, 0.07, 0.42) },
    uFlash: shared.uFlash, uFlashColor: shared.uFlashColor,
    uGlow: { value: 0.0 },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec2 vEyeUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vEyeUv = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vEyeUv;
        uniform vec2 uGaze; uniform float uPupil, uLidTop, uLidBot, uLidTilt, uSmile, uSide, uFlash, uGlow, uSlit;
        uniform vec3 uSkin, uSkinDark, uFlashColor;
        float gLid; vec3 gEmit;
        ${NOISE}`)
      .replace('#include <color_fragment>', `
        vec2 uvE = vEyeUv;
        float aa = fwidth(uvE.y) * 1.2;
        vec2 p = vec2(uvE.x, uvE.y * 1.235);             // true proportions on the eyeball
        vec2 ic = uGaze;
        vec2 q = (p - ic) / 0.84;
        float r = length(q), ang = atan(q.y, q.x);
        // the white only shows as slivers at the corners, shaded by the socket
        float edge = length(uvE);
        vec3 col = mix(vec3(0.70, 0.76, 0.84), vec3(0.02, 0.04, 0.10), smoothstep(0.35, 0.72, edge));
        // iris: deep sapphire with paler fibres running out from the pupil
        float fib = vnoise(vec3(ang * 7.0, r * 3.0, uSide * 4.0)) * 0.55 + vnoise(vec3(ang * 22.0, r * 6.0, 3.0)) * 0.45;
        float streak = smoothstep(0.35, 0.9, vnoise(vec3(ang * 40.0, r * 1.5, 9.0)));
        vec3 irisDeep = vec3(0.003, 0.030, 0.220), irisMid = vec3(0.012, 0.190, 0.720), irisLight = vec3(0.110, 0.620, 0.950);
        vec2 pq = vec2(q.x / mix(0.74, 0.30, uSlit), q.y / mix(1.0, 1.25, uSlit));   // a tall oval that narrows to a slit when it means business
        float pr = 0.40 * uPupil, prr = length(pq);
        float ringT = saturate((r - pr) / (1.0 - pr));    // 0 at the pupil edge, 1 at the rim
        vec3 iris = mix(irisLight, irisMid, smoothstep(0.0, 0.55, ringT));
        iris = mix(iris, irisDeep, smoothstep(0.55, 1.0, ringT));
        iris *= 0.62 + 0.62 * fib;
        iris = mix(iris, irisLight * 1.15, streak * 0.30 * (1.0 - ringT));
        // light pools in the lower half of a real eye, opposite the lid shadow
        iris *= 0.72 + 0.55 * smoothstep(0.5, -0.8, q.y);
        iris = mix(iris, irisDeep * 0.30, smoothstep(0.72, 1.0, r));           // limbal ring
        iris *= 1.0 - 0.75 * smoothstep(0.50, 0.74, edge);                      // falls into shadow under the socket rim
        vec3 pupil = vec3(0.002, 0.004, 0.020);
        iris = mix(iris, pupil, 1.0 - smoothstep(pr - 0.035, pr + 0.035, prr));
        iris += irisLight * uGlow * (1.0 - smoothstep(0.2, 1.0, r));
        col = mix(col, iris, 1.0 - smoothstep(1.0 - aa * 2.0, 1.0 + aa * 2.0, r));
        gEmit = irisLight * uGlow * (1.0 - smoothstep(0.0, 1.0, r)) * 1.5;
        // one small soft glint; the sun and sky add the real reflections on the wet surface
        vec2 h1 = (p - vec2(0.17, 0.26) - ic * 0.4) / vec2(0.085, 0.10);
        float hl = (1.0 - smoothstep(0.35, 1.0, length(h1))) * 0.75;
        col = mix(col, vec3(1.0), hl);
        gEmit += vec3(0.35) * hl;
        // lids
        float sx = uvE.x * uSide;
        float topY = mix(0.80, -0.78, uLidTop) + 0.16 * (1.0 - uvE.x * uvE.x) + uLidTilt * sx * 0.50;
        float botY = mix(-0.84, 0.10, uLidBot) - 0.14 * (1.0 - uvE.x * uvE.x) + uSmile * (0.45 - 0.8 * uvE.x * uvE.x);
        botY = min(botY, topY - 0.001);
        float shadowTop = smoothstep(topY - 0.75, topY, uvE.y);
        col *= 1.0 - 0.72 * shadowTop * shadowTop;
        float lash = smoothstep(topY - 0.05 - aa, topY - 0.05 + aa, uvE.y);
        col = mix(col, vec3(0.004, 0.012, 0.06), lash);
        float lidT = smoothstep(topY - aa, topY + aa, uvE.y);
        float lidB = 1.0 - smoothstep(botY - aa, botY + aa, uvE.y);
        float lashB = 1.0 - smoothstep(botY + 0.035 - aa, botY + 0.035 + aa, uvE.y);
        col = mix(col, uSkinDark * 0.6, lashB * 0.85);
        gLid = max(lidT, lidB);
        vec3 lidCol = mix(uSkin, uSkinDark, 0.35 + 0.4 * smoothstep(0.2, 0.8, edge));
        col = mix(col, lidCol, gLid);
        gEmit *= 1.0 - max(gLid, lash);
        diffuseColor.rgb = mix(col, uFlashColor, uFlash);
      `)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(0.07, 0.5, gLid);')
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        material.clearcoat = mix(1.0, 0.35, gLid); material.clearcoatRoughness = mix(0.03, 0.3, gLid);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += gEmit * 0.35;');
  };
  mat.customProgramCacheKey = () => 'drizzlon-eye';
  return mat;
}

// ------------------------------------------------------------------ water
// One shader for the tail droplet, darts, streams, splashes and puddles.
export const WATER_SKY = /* glsl */`
vec3 waterSky(vec3 d){
  float h = d.y;
  vec3 top = uSkyTop, hor = uSkyHorizon, gnd = uSkyGround;
  vec3 c = mix(hor, top, pow(saturate(h), 0.55));
  c = mix(c, mix(gnd, vec3(0.02, 0.16, 0.42), 0.8), smoothstep(0.02, -0.25, h));
  float sun = saturate(dot(d, uSunDir));
  c += uSunColor * (pow(sun, 350.0) * 12.0 + pow(sun, 24.0) * 0.6);
  return c;
}`;

export function makeWaterMaterial(shared, opts = {}) {
  const uniforms = {
    uTime: shared.uTime,
    uSkyTop: shared.uSkyTop, uSkyHorizon: shared.uSkyHorizon, uSkyGround: shared.uSkyGround,
    uSunDir: shared.uSunDir, uSunColor: shared.uSunColor,
    uDeep: { value: new THREE.Color(opts.deep ?? 0x0535c0) },
    uShallow: { value: new THREE.Color(opts.shallow ?? 0x2aa8ff) },
    uWobble: { value: opts.wobble ?? 0.0 },
    uWobbleFreq: { value: opts.wobbleFreq ?? 38.0 },
    uOpacity: { value: opts.opacity ?? 1.0 },
    uGlow: { value: opts.glow ?? 0.25 },
    uFlow: { value: opts.flow ?? 0.0 },
    uFoam: { value: opts.foam ?? 0.0 },
    uStretch: { value: new THREE.Vector3(0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: opts.depthWrite ?? true, side: opts.side ?? THREE.FrontSide,
    vertexShader: /* glsl */`
      uniform float uTime, uWobble, uWobbleFreq, uFlow; uniform vec3 uStretch;
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying float vAlong;
      #ifdef USE_INSTANCING_COLOR
        varying vec3 vICol;
      #endif
      ${NOISE}
      void main(){
        vec3 p = position; vec3 n = normal;
        float w = (vnoise(p * uWobbleFreq + vec3(0.0, uTime * 2.3 - uFlow * uTime, uTime * 1.7)) - 0.5) * uWobble;
        p += n * w;
        p += uStretch * dot(normalize(uStretch + 1e-6), p) * 0.0;
        vL = position;
        #ifdef USE_INSTANCING
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
        #else
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vN = normalize(mat3(modelMatrix) * n);
        #endif
        #ifdef USE_INSTANCING_COLOR
          vICol = instanceColor;
        #endif
        vW = wp.xyz; vAlong = uv.x;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uOpacity, uGlow, uFlow, uFoam;
      uniform vec3 uSkyTop, uSkyHorizon, uSkyGround, uSunDir, uSunColor, uDeep, uShallow;
      varying vec3 vN; varying vec3 vW; varying vec3 vL; varying float vAlong;
      #ifdef USE_INSTANCING_COLOR
        varying vec3 vICol;
      #endif
      ${NOISE}
      ${WATER_SKY}
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) N = -N;
        // moving ripples so the surface never sits still
        float rp = vnoise(vL * 60.0 + vec3(0.0, -uTime * 3.0 * (1.0 + uFlow), uTime)) - 0.5;
        N = normalize(N + rp * 0.22 * (vec3(1.0) - N * N));
        float ndv = saturate(dot(N, V));
        float F = 0.03 + 0.97 * pow(1.0 - ndv, 4.0);
        vec3 refl = waterSky(reflect(-V, N));
        vec3 refrD = refract(-V, N, 0.76);
        vec3 body = mix(uDeep, uShallow, pow(ndv, 1.6));
        vec3 refr = mix(waterSky(refrD) * uShallow * 1.2, body, 0.8);
        // light caught inside the drop, opposite the sun
        float inner = pow(saturate(dot(refrD, uSunDir) * 0.5 + 0.5), 3.0);
        refr += uShallow * inner * 0.55 + uShallow * uGlow;
        vec3 col = mix(refr, refl, F);
        float a = uOpacity * mix(0.80, 1.0, F);
        if (uFoam > 0.0) {
          // white water: streaks of foam torn along the flow
          float f1 = vnoise(vL * vec3(34.0, 9.0, 34.0) + vec3(0.0, uTime * 5.0, uTime * 2.0));
          float f2 = vnoise(vL * 85.0 + vec3(uTime * 3.0, -uTime * 6.0, 0.0));
          float foam = smoothstep(0.50, 0.78, f1 * 0.65 + f2 * 0.35 + (1.0 - ndv) * 0.18) * uFoam;
          col = mix(col, vec3(0.90, 0.96, 1.0), foam * 0.85);
          a = max(a, foam);
        }
        #ifdef USE_INSTANCING_COLOR
          a *= vICol.r;
        #endif
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return mat;
}
