import * as THREE from 'three';
import { makeRig } from './kit/rig.js';

// Puts a baked person (folk/*.js) on the rig: unpacks the meshes, loads the
// pictures and makes the materials. The looks are Moon Faire's
// (people/kit/person-kit.js and the skin, hand and face materials of
// models/jester/jester_kit.js), restated for three r186: colours and pictures
// carry their colour space, the shader patches use today's chunk names, and
// the per-part materials are folded into four so the body is four draw calls.

// ---------- unpacking ----------
function bytes(s) {
  const b = atob(s), o = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i);
  return o;
}
// 16-bit numbers back to floats, between each component's smallest and largest value
function floats(q) {
  const u = new Uint16Array(bytes(q.d).buffer), o = new Float32Array(u.length), k = q.k;
  for (let i = 0; i < u.length; i++) { const c = i % k; o[i] = q.lo[c] + (u[i] / 65535) * (q.hi[c] - q.lo[c]); }
  return new THREE.BufferAttribute(o, k);
}
function geometry(M) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', floats(M.pos));
  g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(bytes(M.nor).buffer), 3, true));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(bytes(M.si), 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(bytes(M.sw), 4, true));
  for (const k of ['uv', 'uvB', 'uvSide', 'faceMix']) if (M[k]) g.setAttribute(k, floats(M[k]));
  if (M.rough) g.setAttribute('rough', new THREE.BufferAttribute(bytes(M.rough), 1, true));
  if (M.col) {
    // flat colours are written as sRGB bytes; a vertex colour has to be in the working space
    const b = bytes(M.col), o = new Float32Array(b.length), c = new THREE.Color();
    for (let i = 0; i < b.length; i += 3) { c.setRGB(b[i] / 255, b[i + 1] / 255, b[i + 2] / 255, THREE.SRGBColorSpace); o[i] = c.r; o[i + 1] = c.g; o[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(o, 3));
  }
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(bytes(M.idx).buffer), 1));
  return g;
}
const load = (url) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('a picture of the castaway did not load')); im.src = url; });
function picture(im, colour) {
  const t = new THREE.Texture(im);
  t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- the face's own blink and mouth shapes (person-kit.js faceParts), painted from the person's face picture ----------
// lids in the skin colour found above each eye, an open mouth, and a smile's turned-up corners
const LAND = { eyeL: [356, 309], eyeR: [668, 309], mouth: [518, 652] };
function faceParts(fc) {
  const g0 = fc.getContext('2d'), mean = (x, y) => { const d = g0.getImageData(x - 5, y - 5, 11, 11).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return [r / n, gg / n, b / n].map(Math.round); };
  const part = (x, y, w, h, paint) => { const c = canvas(w, h), g = c.getContext('2d'); g.drawImage(fc, x, y, w, h, 0, 0, w, h); g.translate(-x, -y); paint(g); return { src: c, x: x / 1024, y: y / 1024, w: w / 1024, h: h / 1024 }; };
  const oval = (g, x, y, rx, ry, c, a, edge) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(edge, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.save(); g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); };
  const line = (g, a, b, c, col, w) => { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]); g.stroke(); g.restore(); };
  const eyes = [LAND.eyeL, LAND.eyeR], lids = eyes.map((e) => mean(e[0], e[1] - 44)), dark = lids.map((c) => c.map((v) => Math.round(v * 0.32)));
  const lid = (k) => (g) => eyes.forEach((e, i) => { const y = e[1] + 2 - (1 - k) * 12; oval(g, e[0], y, 62, 10 + 16 * k, lids[i], 1, 0.72); line(g, [e[0] - 48, y + 4 + 6 * k], [e[0], y + 8 + 12 * k], [e[0] + 48, y + 4 + 6 * k], `rgba(${dark[i]},0.8)`, 4.5); });
  const M = LAND.mouth, lip = mean(M[0], M[1] + 16).map((v) => Math.round(v * 0.22));
  return {
    shut: part(187, 263, 649, 200, lid(1)), half: part(187, 263, 649, 200, lid(0.5)),
    oh: part(349, 573, 325, 195, (g) => { oval(g, M[0], M[1] + 4, 36, 23, lip, 0.95, 0.6); }),
    smile: part(349, 573, 325, 195, (g) => { for (const k of [-1, 1]) line(g, [M[0] + k * 58, M[1] - 2], [M[0] + k * 80, M[1] - 6], [M[0] + k * 92, M[1] - 20], `rgba(${lip},0.55)`, 5); }),
  };
}

// ---------- materials ----------
// Each material edits the standard shader in steps; `key` names the result so three compiles it once.
function patched(mat, key, steps) {
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = (sh) => { for (const s of steps) s(sh); };
  return mat;
}
const swap = (src, from, to) => { if (!src.includes(from)) throw new Error(`castaway shader: no ${from}`); return src.replace(from, to); };
// a soft rim, the way cloth and skin catch light at a glancing angle (jester_kit.js sheen)
const sheen = (col, pw, k) => (sh) => {
  sh.uniforms.uSheenC = { value: new THREE.Color(col) }; sh.uniforms.uSheenP = { value: pw }; sh.uniforms.uSheenK = { value: k };
  sh.fragmentShader = swap(swap(sh.fragmentShader, '#include <common>', '#include <common>\nuniform vec3 uSheenC; uniform float uSheenP; uniform float uSheenK;'),
    '#include <tonemapping_fragment>', 'float sFr = pow( 1.0 - saturate( abs( dot( normalize( vViewPosition ), normal ) ) ), uSheenP );\n gl_FragColor.rgb += uSheenC * ( sFr * uSheenK * ( 0.35 + 0.65 * saturate( normal.y * 0.5 + 0.5 ) ) );\n#include <tonemapping_fragment>');
};
// how matt each point is, so parts with different finishes can share a mesh
const roughPerPoint = (sh) => {
  sh.vertexShader = swap(swap(sh.vertexShader, '#include <common>', '#include <common>\nattribute float rough; varying float vRough;'), '#include <begin_vertex>', '#include <begin_vertex>\nvRough = rough;');
  sh.fragmentShader = swap(swap(sh.fragmentShader, '#include <common>', '#include <common>\nvarying float vRough;'), '#include <roughnessmap_fragment>', 'float roughnessFactor = vRough;');
};

// The clothes wear one painted sheet: the person from the front on its left half, from behind on its right half. Every
// point reads the front figure where it faces forward and the back figure where it faces back (person-kit.js painted()).
// The two places on the sheet are worked out per point when the person is baked (uv and uvB).
function clothMaterial(sheet, seam) {
  const m = new THREE.MeshStandardMaterial({ map: sheet, roughness: 0.86, side: THREE.DoubleSide, envMapIntensity: 0.25 });
  return patched(m, 'castaway-cloth', [sheen('#cbbcc4', 2.6, 0.1), roughPerPoint, (sh) => {
    sh.uniforms.uSeam = { value: seam };
    sh.vertexShader = swap(swap(sh.vertexShader, '#include <common>', '#include <common>\nattribute vec2 uvB; varying vec2 vSheetF; varying vec2 vSheetB; varying float vBindNz;'),
      '#include <begin_vertex>', '#include <begin_vertex>\nvSheetF = uv; vSheetB = uvB; vBindNz = normal.z;');
    sh.fragmentShader = swap(swap(sh.fragmentShader, '#include <common>', '#include <common>\nuniform float uSeam; varying vec2 vSheetF; varying vec2 vSheetB; varying float vBindNz;'),
      '#include <map_fragment>', 'vec2 fP = clamp( vSheetF, 0.002, 0.998 );\n vec2 bP = clamp( vSheetB, 0.002, 0.998 );\n vec3 cF = texture2D( map, vec2( fP.x * 0.5, fP.y ) ).rgb;\n vec3 cB = texture2D( map, vec2( 0.5 + bP.x * 0.5, bP.y ) ).rgb;\n diffuseColor.rgb *= mix( cB, cF, smoothstep( -uSeam, uSeam, vBindNz ) );');
  }]);
}
// parts the skin fitter gave one flat colour (hair, a straw hat, buttons), as a colour on each point
function flatMaterial() {
  return patched(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), 'castaway-flat', [roughPerPoint]);
}
// Skin is partly self-lit in Moon Faire (a night fair): `glow` is how much of that is kept. See createCastaway's opts.glow.
const SKIN_TINT = '#d8ccc6', SKIN_GLOW = 0.44;
function handMaterial(tex, glow) {
  const m = new THREE.MeshStandardMaterial({ map: tex, color: SKIN_TINT, roughness: 0.62, envMapIntensity: 0.2, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: SKIN_GLOW * glow });
  return patched(m, 'castaway-hand', [sheen('#ffb49a', 3.2, 0.08)]);
}
// The head wears three pictures at once, mixed by which way the skin faces: the front painting (repainted to blink),
// a profile painting, and plain skin (jester_kit.js MATS.face). faceMix and uvSide were set on each point by the kit.
function faceMaterial(faceTex, side, sideMask, jaw, glow) {
  const m = new THREE.MeshStandardMaterial({ map: faceTex, color: SKIN_TINT, roughness: 0.66, envMapIntensity: 0.2, emissive: '#ffffff', emissiveMap: faceTex, emissiveIntensity: SKIN_GLOW * glow });
  return patched(m, 'castaway-face', [sheen('#ffb49a', 3.2, 0.08), (sh) => {
    sh.uniforms.uSide = { value: side }; sh.uniforms.uSideA = { value: sideMask }; sh.uniforms.uPlain = { value: new THREE.Color(jaw) };
    sh.vertexShader = swap(swap(sh.vertexShader, '#include <common>', '#include <common>\nattribute vec3 faceMix; attribute vec2 uvSide; varying vec3 vFaceMix; varying vec2 vUvSide;'),
      '#include <begin_vertex>', '#include <begin_vertex>\nvFaceMix = faceMix; vUvSide = uvSide;');
    sh.fragmentShader = swap(swap(swap(sh.fragmentShader, '#include <common>', '#include <common>\nuniform sampler2D uSide; uniform sampler2D uSideA; uniform vec3 uPlain; varying vec3 vFaceMix; varying vec2 vUvSide; vec3 gFaceCol;'),
      '#include <map_fragment>', 'vec4 texelColor = texture2D( map, vMapUv );\n float fSide = texture2D( uSideA, vUvSide ).r * vFaceMix.x;\n vec3 sideCol = texture2D( uSide, vUvSide ).rgb;\n gFaceCol = ( texelColor.rgb * max( 0.0, 1.0 - fSide - vFaceMix.y ) + sideCol * fSide + uPlain * vFaceMix.y ) * vFaceMix.z;\n diffuseColor.rgb *= gFaceCol;'),
      '#include <emissivemap_fragment>', 'totalEmissiveRadiance *= gFaceCol;');
  }]);
}

// D: a baked person (folk/*.js). Resolves to { rig, meshes, glow (get/set), dispose }.
export async function buildBody(D, opts = {}) {
  const T = D.tex;
  const [sheetIm, faceIm, handsIm, sideIm, sideMaskIm] = await Promise.all([load(T.body), load(T.face), load(T.hands), load(T.faceSide), load(T.faceSideA)]);
  // the face picture at the size the blink and mouth shapes are laid out for
  const fc = canvas(1024, 1024), fg = fc.getContext('2d', { willReadFrequently: true });
  fg.drawImage(faceIm, 0, 0, 1024, 1024);
  const rig = makeRig({ textureScale: 0.5, face: { base: fc, parts: faceParts(fc) }, onBase: opts.onBase });
  rig.root.scale.fromArray(D.scale);
  rig.SK.head.scale.fromArray(D.headScale);

  let glow = opts.glow == null ? 0.25 : Math.max(0, +opts.glow || 0);
  const textures = [picture(sheetIm, true), picture(handsIm, true), picture(sideIm, true), picture(sideMaskIm, false), rig.faceTexture];
  const mats = {
    cloth: clothMaterial(textures[0], D.seam),
    flat: flatMaterial(),
    hand: handMaterial(textures[1], glow),
    face: faceMaterial(rig.faceTexture, textures[2], textures[3], D.jaw, glow),
  };
  const meshes = [];
  for (const key of ['cloth', 'flat', 'hand', 'face']) {
    if (!D.meshes[key]) continue;
    const m = new THREE.SkinnedMesh(geometry(D.meshes[key]), mats[key]);
    m.name = key; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    rig.root.add(m);
    m.bind(rig.skeleton, new THREE.Matrix4());
    meshes.push(m);
  }
  return {
    rig, meshes,
    get glow() { return glow; },
    set glow(v) { glow = Math.max(0, +v || 0); mats.hand.emissiveIntensity = mats.face.emissiveIntensity = SKIN_GLOW * glow; },
    dispose() {
      for (const m of meshes) { m.geometry.dispose(); m.material.dispose(); }
      for (const t of textures) t.dispose();
      rig.skeleton.dispose();
    },
  };
}
