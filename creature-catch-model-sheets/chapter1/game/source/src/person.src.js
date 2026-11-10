/* ==== MODULE: wren-3d/src/wren-model.js ==== */
// wren-model.js: Wren, the lamplighter of Farwick, as a rigged 3D model. three.js r128 (global THREE). Defines makeWren(opts) only.
// Built in code from her 16 px sprite and the game's own palette (opts.pal = G.PAL). The method follows the Envoi models
// (envoi-on-the-longest-night, src/models/sol.js): its geometry helpers, skinned buckets merged per material, two-bone leg IK,
// spring chains on 1/120 s substeps and keyed actions are reused here, re-proportioned for her.
//
// Her look, from the sprite: a copper bob with a straight fringe and two locks framing her face, wide-set ink eyes, pink cheeks,
// a mustard scarf wound round her neck with one end down her front (her right) and one blowing behind, a navy coat to the knee
// with a lighter front edge, navy trousers and brown boots. She keeps the sprite's big head (about 2.8 heads tall). The faint
// freckles across her nose are the one thing the sprite is too small to show. She is cel-shaded with ink outlines, the 3D
// version of the pixel art's black outline.
//
// Units are meters, Y up, facing +Z, boots on y = 0; her right side is -X. About 1.13 m to the top of her hair.
// Interface (the Envoi Model Build Spec, plus three extras for the demo):
//   root, fx, animate(phase, walk, t, dt), play(name, force), guard(on), reset(), busy, action, progress, dash, lift,
//   state { wind 0..1, gaze: {x, y} or null }, setFade(f), anchor(name, out), ACTIONS, stats
//   look(yaw, pitch)       turns her head (radians, on top of whatever she is doing)
//   aim(point | null)      points her pole at a world point while she lights something, and slides it out just far enough
//   setReveal(fill, line)  world heights: colour shows below fill, ink lines below line (for being drawn in)
//   setOutline(w)          ink line width in meters (default .008)
//   PHASE_PER_M            radians of walk phase per meter walked
// opts.look dresses the same body as someone else from Farwick (palette names or colours):
//   { hair: [base, dark, light], coat: [base, dark, edge], skin: [3], boots: [2], trousers, style: 'bob' | 'short' | 'bun' | 'long' |
//     'cap' | 'helm', hat: colour, apron: colour, scarf: false, knit: [base, dark] (the scarf's colours), freckles: false, buttons: false }
function makeWren(opts) {
 'use strict';
 opts = opts || {};
 const PAL = opts.pal || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 let seed = 3371;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const G2 = (dx, dy, sx, sy) => Math.exp(-(dx * dx) / (sx * sx) - (dy * dy) / (sy * sy));
 const TAU = Math.PI * 2, PI = Math.PI;
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const col = (n, d) => PAL[n] || d;
 const rgbOf = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
 const ratio = (a, b) => { const x = rgbOf(a), y = rgbOf(b); return [y[0] / x[0], y[1] / x[1], y[2] / x[2]]; };
 const P_ = {
  ink: col('ink', '#1d1b2c'), ink2: col('ink2', '#2d2a44'), ink3: col('ink3', '#4a4663'),
  skin: col('skin', '#f1c49e'), skin2: col('skin2', '#d39674'), skin3: col('skin3', '#a86c52'),
  cu: col('copper', '#c4602f'), cu2: col('copper2', '#8c3b22'), cu3: col('copper3', '#e8914e'),
  nv: col('navy', '#304a7c'), nv2: col('navy2', '#213257'), nv3: col('navy3', '#4d70ab'),
  mu: col('mustard', '#e8b248'), mu2: col('mustard2', '#b27b29'),
  bt: col('boot', '#4d3528'), bt2: col('boot2', '#33241c'), wd3: col('wood3', '#bd8c5d'), wd2: col('wood2', '#7a5236'),
  fl: col('flame', '#ffd66b'), fl2: col('flame2', '#ff9a3c'), fl3: col('flame3', '#fff5c9'),
 };
 const LOOK = Object.assign({ style: 'bob', scarf: true, freckles: true, apron: null, buttons: true, hat: null }, opts.look || {});
 const pc = (v) => (v && PAL[v]) || v;
 if (LOOK.hair) [P_.cu, P_.cu2, P_.cu3] = LOOK.hair.map(pc);
 if (LOOK.coat) [P_.nv, P_.nv2, P_.nv3] = LOOK.coat.map(pc);
 if (LOOK.skin) [P_.skin, P_.skin2, P_.skin3] = LOOK.skin.map(pc);
 if (LOOK.boots) [P_.bt, P_.bt2] = LOOK.boots.map(pc);
 const KNIT = LOOK.knit ? LOOK.knit.map(pc) : [P_.mu, P_.mu2]; // the scarf's wool: Wren's mustard, unless the look says otherwise

 // ---------- materials: three-step cel shading with a soft cool rim, ink outlines, and two cut-off planes ----------
 const FILL = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6); // colour shows below this world height
 const LINE = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6); // ink lines show below this one
 const ramp = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255, 196, 196, 196, 255, 242, 242, 242, 255]), 3, 1, THREE.RGBAFormat);
 ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
 const RIM = { c: { value: new THREE.Color('#9fb4ff') }, k: { value: .16 } };
 function toon(c, o) {
  const m = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: ramp, clippingPlanes: [FILL] }, o || {}));
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uRimC = RIM.c; sh.uniforms.uRimK = RIM.k;
   sh.fragmentShader = 'uniform vec3 uRimC;\nuniform float uRimK;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    'float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uRimC * uRimK * smoothstep(0.55, 0.85, rimF);\n#include <dithering_fragment>');
  };
  m.customProgramCacheKey = () => 'wren-toon';
  return m;
 }
 // the ink: the body's buckets drawn again, back faces only, pushed out along their normals (inkw scales it per vertex)
 const INK = { value: .008 };
 const inkMat = new THREE.MeshBasicMaterial({ color: P_.ink, side: THREE.BackSide, clippingPlanes: [LINE] });
 inkMat.skinning = true;
 inkMat.onBeforeCompile = (sh) => {
  sh.uniforms.uInk = INK;
  sh.vertexShader = 'uniform float uInk;\nattribute float inkw;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * uInk * inkw;');
 };
 inkMat.customProgramCacheKey = () => 'wren-ink';

 // ---------- painted textures ----------
 const T = {};
 // her face: skin, pink cheeks, a scatter of faint freckles over her nose. The front view of the face fills the square;
 // u = X / 1.1 * .5 + .5, v = Y / 1.1 * .5 + .5 in head units. The corner at (2, 2) px stays plain skin for everything else.
 {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = P_.skin; g.fillRect(0, 0, S, S);
  const at = (X, Y) => [(X / 1.1 * .5 + .5) * S, (1 - (Y / 1.1 * .5 + .5)) * S];
  for (const sd of [-1, 1]) {
   const [x, y] = at(sd * .56, -.36), gr = g.createRadialGradient(x, y, 0, x, y, 30);
   gr.addColorStop(0, 'rgba(232,120,110,.55)'); gr.addColorStop(.6, 'rgba(232,130,115,.22)'); gr.addColorStop(1, 'rgba(232,130,115,0)');
   g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1.25, .8); g.translate(-x, -y); g.fillRect(x - 40, y - 40, 80, 80); g.restore();
  }
  g.fillStyle = 'rgba(168,108,82,.5)';
  if (LOOK.freckles) for (let i = 0; i < 26; i++) {
   const sd = i % 2 ? 1 : -1, X = sd * (.08 + rnd() * .36), Y = -.2 - rnd() * .2 + Math.abs(X) * .15, [x, y] = at(X, Y);
   g.beginPath(); g.arc(x, y, .9 + rnd() * .9, 0, TAU); g.fill();
  }
  T.face = new THREE.CanvasTexture(c);
 }
 // hair: copper (or whoever's colour), with darker strands running the length of each lock, darker at the roots, and a light
 // band where it shines
 {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d'), rgba = (hex, a) => { const k = new THREE.Color(hex); return 'rgba(' + Math.round(k.r * 255) + ',' + Math.round(k.g * 255) + ',' + Math.round(k.b * 255) + ',' + a + ')'; };
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, P_.cu2); gr.addColorStop(.12, P_.cu); gr.addColorStop(1, P_.cu);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = rnd() < .7 ? rgba(P_.cu2, .45) : rgba(P_.cu3, .45); g.fillRect(rnd() * W * .3, rnd() * H, W * (.4 + rnd() * .6), .8 + rnd()); }
  g.fillStyle = rgba(new THREE.Color(P_.cu3).lerp(new THREE.Color('#fff4e0'), .25).getStyle(), .75);
  g.beginPath(); g.moveTo(W * .2, 0);
  for (let y = 0; y <= H; y += 4) g.lineTo(W * (.2 + .03 * Math.sin(y * .7)), y);
  for (let y = H; y >= 0; y -= 4) g.lineTo(W * (.3 + .04 * Math.sin(y * .9 + 1)), y);
  g.fill();
  T.hair = new THREE.CanvasTexture(c); T.hair.wrapT = THREE.RepeatWrapping;
 }
 // the coat, wrapped round her: u goes round from her back (0) past her front (.5); v from the collar (top) to the hem.
 // A lighter edge where it closes, a little right of centre as in the sprite, two pocket flaps, a darker hem, and wool.
 {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = P_.nv; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) { g.fillStyle = rnd() < .5 ? 'rgba(20,30,60,.12)' : 'rgba(120,150,210,.08)'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1); }
  g.fillStyle = P_.nv3; g.fillRect(S * .455, 0, S * .016, S * .9);
  g.fillStyle = P_.ink2; g.fillRect(S * .471, 0, 2, S * .9);
  g.fillStyle = P_.nv2; g.fillRect(0, S * .935, S, S * .065);
  for (const u of [.36, .64]) { g.fillStyle = P_.nv2; g.fillRect(S * (u - .05), S * .66, S * .1, S * .05); g.fillStyle = 'rgba(77,112,171,.7)'; g.fillRect(S * (u - .05), S * .66, S * .1, 2); }
  g.fillStyle = P_.nv; g.fillRect(S * .02, S * .02, 6, 6); // plain swatch for sleeves and trousers
  T.coat = new THREE.CanvasTexture(c);
 }
 // the scarf: knitted mustard ribs, with two darker stripes near each end
 {
  const W = 128, H = 64, c = cvs(W, H), g = c.getContext('2d');
  const rib = rgbOf(KNIT[1]).map((v) => Math.round(v * 255)).join(',');
  g.fillStyle = KNIT[0]; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) { g.fillStyle = 'rgba(' + rib + ',.35)'; g.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += 3) { g.fillStyle = 'rgba(255,230,160,.18)'; g.fillRect(x, 0, 1, H); }
  for (const x of [W * .78, W * .88]) { g.fillStyle = KNIT[1]; g.fillRect(x, 0, W * .05, H); }
  T.knit = new THREE.CanvasTexture(c); T.knit.wrapT = THREE.RepeatWrapping;
 }
 // her eyes: mostly iris, ink-dark as in the sprite, lighter towards the bottom, a black pupil and two catchlights
 {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#fbf7ee'; g.fillRect(0, 0, S, S);
  const cx = S / 2, cy = S / 2, gr = g.createLinearGradient(0, cy - 44, 0, cy + 44);
  gr.addColorStop(0, '#0c0b14'); gr.addColorStop(.5, P_.ink); gr.addColorStop(1, '#45416a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 30, 44, 0, 0, TAU); g.fill();
  g.fillStyle = '#0b0a12'; g.beginPath(); g.ellipse(cx, cy - 2, 13, 19, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(120,120,170,.3)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 24, 37, 0, .3, PI - .3); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx - 11, cy - 17, 9, 11, -.3, 0, TAU); g.fill();
  g.beginPath(); g.arc(cx + 10, cy + 16, 4, 0, TAU); g.fill();
  T.eye = new THREE.CanvasTexture(c); T.eye.wrapS = T.eye.wrapT = THREE.ClampToEdgeWrapping;
 }
 // mouth shapes, four across: 0 a small smile, 1 a little "o", 2 an open smile, 3 a wobble (hurt, worried)
 {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const ink = '#5a2a2a';
  // 0
  g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.moveTo(14, 26); g.quadraticCurveTo(32, 40, 50, 26); g.stroke();
  // 1
  g.fillStyle = ink; g.beginPath(); g.ellipse(96, 32, 9, 12, 0, 0, TAU); g.fill();
  g.fillStyle = '#d8706a'; g.beginPath(); g.ellipse(96, 37, 6, 5, 0, 0, TAU); g.fill();
  // 2
  g.fillStyle = ink; g.beginPath(); g.moveTo(140, 22); g.quadraticCurveTo(160, 24, 180, 22); g.quadraticCurveTo(178, 48, 160, 48); g.quadraticCurveTo(142, 48, 140, 22); g.fill();
  g.fillStyle = '#d8706a'; g.beginPath(); g.ellipse(160, 41, 11, 6, 0, 0, TAU); g.fill();
  // 3
  g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.moveTo(206, 34); g.quadraticCurveTo(214, 26, 222, 32); g.quadraticCurveTo(230, 38, 240, 30); g.stroke();
  T.mouth = new THREE.CanvasTexture(c); T.mouth.repeat.set(.25, 1);
 }

 const M = {
  skin: toon('#ffffff', { map: T.face }),
  hair: toon('#ffffff', { map: T.hair }),
  coat: toon('#ffffff', { map: T.coat }),
  boot: toon(P_.bt),
  knit: toon('#ffffff', { map: T.knit }),
  brass: toon(P_.mu),
  pole: toon(P_.wd2), grip: toon(P_.bt2),
  eye: new THREE.MeshToonMaterial({ map: T.eye, gradientMap: ramp, emissive: new THREE.Color('#1a1826'), clippingPlanes: [FILL] }),
  lid: toon('#ffffff', { vertexColors: true, morphTargets: true }),
  apron: LOOK.apron ? toon(pc(LOOK.apron)) : null, hat: LOOK.hat ? toon(pc(LOOK.hat)) : null,
  mouth: new THREE.MeshBasicMaterial({ map: T.mouth, transparent: true, depthWrite: false, clippingPlanes: [FILL], polygonOffset: true, polygonOffsetFactor: -2 }),
 };

 // ---------- geometry helpers (as in the Envoi models) ----------
 const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
 const YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
 function mkGeo(P, U, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); return g;
 }
 // a grid surface f(u, v, out); wrap welds the normals along the u seam
 function surf(nu, nv, f, wrap, flip) {
  const P = [], U = [], I = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); P.push(o[0], o[1], o[2]); U.push(u, 1 - v); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
  }
  const g = mkGeo(P, U, I);
  if (wrap) {
   const n = g.attributes.normal;
   for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1), b = a + nu;
    _v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, _v.x, _v.y, _v.z); n.setXYZ(b, _v.x, _v.y, _v.z);
   }
  }
  return g;
 }
 // a solid of revolution from a profile [[r, y], ...] listed top to bottom; angle 0 faces +Z
 function lathe(prof, segs, o) {
  o = o || {};
  const n = prof.length - 1, out = [0, 0, 0];
  return surf(segs, n * (o.sub || 1), (u, v, p) => {
   const k = v * n, i = Math.min(n - 1, Math.floor(k)), f = k - i;
   const r = lerp(prof[i][0], prof[i + 1][0], f * f * (3 - 2 * f)), y = lerp(prof[i][1], prof[i + 1][1], f), a = lerp(-PI, PI, u);
   out[0] = (o.cx || 0) + Math.sin(a) * r * (o.sx || 1); out[1] = y; out[2] = (o.cz || 0) + Math.cos(a) * r * (o.sz || 1);
   if (o.fn) o.fn(out, a, v, r);
   p[0] = out[0]; p[1] = out[1]; p[2] = out[2];
  }, true, o.flip);
 }
 // a tube along a Catmull-Rom curve; rFn(t) its radius, flat squashes the side that faces upFn(point)
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
 function tube(pts, ns, nr, rFn, flat, upFn) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const P = [], U = [], I = [];
  for (let i = 0; i <= ns; i++) {
   const t = i / ns; cv.getPointAt(t, _c); cv.getTangentAt(t, _t);
   if (upFn) upFn(_c, _n, t); else _n.set(0, 0, 1);
   _n.addScaledVector(_t, -_n.dot(_t)); if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x); _n.normalize();
   _b.crossVectors(_t, _n).normalize();
   const r = rFn(t);
   for (let j = 0; j <= nr; j++) {
    const a = j / nr * TAU, ca = Math.cos(a), sa = Math.sin(a);
    P.push(_c.x + (_n.x * ca * flat + _b.x * sa) * r, _c.y + (_n.y * ca * flat + _b.y * sa) * r, _c.z + (_n.z * ca * flat + _b.z * sa) * r);
    U.push(t, j / nr);
   }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + 1, c = a + nr + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = mkGeo(P, U, I);
  const nm = g.attributes.normal;
  for (let i = 0; i <= ns; i++) { const a = i * (nr + 1), b = a + nr; _v.set(nm.getX(a) + nm.getX(b), nm.getY(a) + nm.getY(b), nm.getZ(a) + nm.getZ(b)).normalize(); nm.setXYZ(a, _v.x, _v.y, _v.z); nm.setXYZ(b, _v.x, _v.y, _v.z); }
  return g;
 }
 function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, vo * 2);
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.setIndex(new THREE.BufferAttribute(I, 1)); return g;
 }
 const dummy = new THREE.Object3D();
 function place(geo, p, r, s, q) {
  if (!p && !r && !s && !q) return geo.clone();
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (q) dummy.quaternion.copy(q); else dummy.rotation.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0);
  if (s === undefined || s === null) dummy.scale.set(1, 1, 1); else if (typeof s === 'number') dummy.scale.set(s, s, s); else dummy.scale.set(s[0], s[1], s[2]);
  dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix); return g;
 }
 const qY = (d) => new THREE.Quaternion().setFromUnitVectors(YA, _v.set(d[0], d[1], d[2]).normalize());
 const uvAt = (g, u, v) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, u, v); return g; };

 // ---------- skinned buckets: pieces are weighted, tinted, then merged per material into one SkinnedMesh ----------
 // TINT colours what add() takes next (an [r, g, b] or a function of the vertex); INKW sets how thick its outline is.
 const BUCK = new Map();
 let TINT = null, INKW = 1;
 const tinted = (c, fn) => { const was = TINT; TINT = c; fn(); TINT = was; };
 const inked = (w, fn) => { const was = INKW; INKW = w; fn(); INKW = was; };
 function add(geo, mat, w, p, r, s, q) {
  const g = place(geo, p, r, s, q);
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), iw = new Float32Array(n).fill(INKW);
  if (typeof w === 'number') for (let i = 0; i < n; i++) { si[i * 4] = w; sw[i * 4] = 1; }
  else for (let i = 0; i < n; i++) {
   let inf = w(pos.getX(i), pos.getY(i), pos.getZ(i), i);
   if (inf.length > 1) { inf = inf.filter((e) => e[1] > 1e-4); if (inf.length > 4) inf = inf.sort((x, y) => y[1] - x[1]).slice(0, 4); }
   let tot = 0; for (const e of inf) tot += e[1];
   if (!tot) { si[i * 4] = 0; sw[i * 4] = 1; continue; }
   for (let k = 0; k < inf.length; k++) { si[i * 4 + k] = inf[k][0]; sw[i * 4 + k] = inf[k][1] / tot; }
  }
  let cc = null;
  if (TINT) { cc = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const c = typeof TINT === 'function' ? TINT(pos.getX(i), pos.getY(i), pos.getZ(i), i) : TINT; cc[i * 3] = c[0]; cc[i * 3 + 1] = c[1]; cc[i * 3 + 2] = c[2]; } }
  let L = BUCK.get(mat); if (!L) BUCK.set(mat, (L = []));
  L.push({ g, si, sw, cc, iw });
 }
 const skinned = [], inks = [];
 function buildSkinned(parent, skeleton) {
  for (const [mat, L] of BUCK) {
   const geo = mergeGeos(L.map((e) => e.g));
   const nv = geo.attributes.position.count, SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), IW = new Float32Array(nv);
   let o = 0, q = 0; for (const e of L) { SI.set(e.si, o); SW.set(e.sw, o); IW.set(e.iw, q); o += e.si.length; q += e.iw.length; }
   geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
   geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
   geo.setAttribute('inkw', new THREE.Float32BufferAttribute(IW, 1));
   if (L.some((e) => e.cc)) { const C = new Float32Array(nv * 3).fill(1); let k = 0; for (const e of L) { if (e.cc) C.set(e.cc, k); k += e.g.attributes.position.count * 3; } geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); mat.vertexColors = true; }
   geo.computeBoundingSphere();
   mat.skinning = true;
   const m = new THREE.SkinnedMesh(geo, mat); m.frustumCulled = false; m.castShadow = true;
   parent.add(m); m.bind(skeleton); skinned.push(m);
   const ink = new THREE.SkinnedMesh(geo, inkMat); ink.frustumCulled = false; ink.raycast = () => {};
   parent.add(ink); ink.bind(skeleton); inks.push(ink);
  }
  BUCK.clear();
 }

 // ---------- skeleton (55 bones) ----------
 const root = new THREE.Group(); root.name = 'Wren';
 const fx = new THREE.Group(); fx.name = 'WrenFX';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const PEL = .44;
 const pelvis = bone('pelvis', root, 0, PEL, 0);
 const spine = bone('spine', pelvis, 0, .07, 0);
 const chest = bone('chest', spine, 0, .08, -.004);
 const neck = bone('neck', chest, 0, .105, .002);
 const head = bone('head', neck, 0, .025, .004);
 const arms = [], elbows = [], wrists = [], fing = [], thumb = [];
 for (const sd of [-1, 1]) { // her right arm first (-X)
  const s = bone('shoulder' + sd, chest, .128 * sd, .072, -.004);
  const e = bone('elbow' + sd, s, .01 * sd, -.148, 0);
  const w = bone('wrist' + sd, e, .004 * sd, -.128, .006);
  fing.push(bone('fing' + sd, w, 0, -.046, .004)); thumb.push(bone('thumb' + sd, w, -.012 * sd, -.018, .02));
  arms.push(s); elbows.push(e); wrists.push(w);
 }
 const legs = [], knees = [], ankles = [], toes = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, .062 * sd, -.025, 0);
  const k = bone('knee' + sd, h, 0, -.185, .008);
  const a = bone('ankle' + sd, k, 0, -.18, -.008);
  const t = bone('toe' + sd, a, 0, -.036, .074);
  legs.push(h); knees.push(k); ankles.push(a); toes.push(t);
 }
 // the bob, in seven two-bone locks round the back and sides; two face-framing locks; the tuft on top
 const HB = [0, PEL + .07 + .08 + .105 + .025, 0]; // the head bone's bind position (y = .72)
 const HC = [0, .903, .008], HR = [.172, .185, .168]; // the head's centre and radii
 const BOB = [-2.45, -1.8, -1.22, PI, 1.22, 1.8, 2.45]; // azimuths, 0 = her front; the back one is PI
 const bobB = BOB.map((az, i) => {
  const r = .2, x = Math.sin(az) * r, z = Math.cos(az) * r * .95 + HC[2];
  const b1 = bone('bob' + i, head, x, HC[1] - HB[1] + .02, z), b2 = bone('bobt' + i, b1, Math.sin(az) * .012, -.07, Math.cos(az) * .012);
  return [b1, b2];
 });
 const frameB = [-1, 1].map((sd) => {
  const az = sd * .98, b1 = bone('frame' + sd, head, Math.sin(az) * .18, HC[1] - HB[1] - .005, Math.cos(az) * .17 + HC[2]);
  return [b1, bone('framet' + sd, b1, 0, -.07, .008)];
 });
 const tuftB = [bone('tuft', head, -.02, HR[1] + HC[1] - HB[1] + .02, -.03)]; tuftB.push(bone('tuftt', tuftB[0], -.01, .035, .02));
 // the scarf's two ends: one down her front on her right, one behind her on her left
 const scfF = []; { let p = chest; const off = [[-.052, .08, .088], [0, -.075, .012], [0, -.075, .004]]; for (let i = 0; i < 3; i++) { p = bone('scarfF' + i, p, off[i][0], off[i][1], off[i][2]); scfF.push(p); } }
 const scfB = []; { let p = chest; const off = [[.04, .095, -.085], [0, -.06, -.04], [0, -.065, -.025]]; for (let i = 0; i < 3; i++) { p = bone('scarfB' + i, p, off[i][0], off[i][1], off[i][2]); scfB.push(p); } }
 // the coat skirt: six panels round her hips
 const SKAZ = [0, PI / 3, 2 * PI / 3, PI, -2 * PI / 3, -PI / 3];
 const skirt = SKAZ.map((az, i) => bone('skirt' + i, pelvis, Math.sin(az) * .115, .02, Math.cos(az) * .095));
 root.updateMatrixWorld(true);
 const bw = (b) => { b.getWorldPosition(_v); return [_v.x, _v.y, _v.z]; };
 const HW = bw(head);

 // ---------- skin weights (bind pose, root space) ----------
 function wTorso(x, y) {
  let w;
  if (y > .6) { const t = sm(.6, .66, y); w = [[BI.spine, 1 - t], [BI.chest, t]]; }
  else if (y > .48) { const t = sm(.49, .55, y); w = [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  else w = [[BI.pelvis, 1]];
  const ax = Math.abs(x);
  if (y > .6 && ax > .07) { const k = sm(.07, .12, ax) * sm(.6, .67, y) * .5; for (const e of w) e[1] *= 1 - k; w.push([BI['shoulder' + (x < 0 ? -1 : 1)], k]); }
  return w;
 }
 // the skirt: below the waist the coat follows the two nearest panels more the lower it hangs
 function wCoat(x, y, z) {
  const w = wTorso(x, y);
  if (y > .47) return w;
  const k = sm(.47, .32, y), az = Math.atan2(x, z / .82);
  let a = ((az % TAU) + TAU) % TAU / (PI / 3); const i0 = Math.floor(a) % 6, f = a - Math.floor(a);
  for (const e of w) e[1] *= 1 - k;
  w.push([BI['skirt' + i0], k * (1 - f)], [BI['skirt' + ((i0 + 1) % 6)], k * f]);
  return w;
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd], A = BI['ankle' + sd];
  if (y > .38) { const t = sm(.45, .39, y); return [[BI.pelvis, 1 - t], [H, t]]; }
  if (y > .19) { const t = sm(.26, .2, y); return [[H, 1 - t], [K, t]]; }
  const t = sm(.08, .05, y); return [[K, 1 - t], [A, t]];
 }
 function wFoot(x, y, z) {
  const sd = x < 0 ? -1 : 1, K = BI['knee' + sd], A = BI['ankle' + sd], Tt = BI['toe' + sd];
  const tk = sm(.1, .14, y), tt = sm(.05, .09, z);
  return [[K, tk], [A, (1 - tk) * (1 - tt)], [Tt, (1 - tk) * tt]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd], Wr = BI['wrist' + sd];
  if (y > .64) { const t = sm(.7, .645, y); return [[BI.chest, (1 - t) * .7], [S, 1 - (1 - t) * .7]]; }
  if (y > .55) return [[S, 1]];
  if (y > .48) { const t = sm(.55, .49, y); return [[S, 1 - t], [E, t]]; }
  if (y > .41) return [[E, 1]];
  const t = sm(.41, .39, y); return [[E, 1 - t], [Wr, t]];
 }
 const wNeck = (x, y) => { const t = sm(.7, .74, y); return [[BI.chest, (1 - t) * .5], [BI.neck, .5 + (1 - t) * .5 - t * .5], [BI.head, t * .5]]; };
 // weights along a bone chain: the nearest segment, blended across the joints
 function wChain(names, pts, parent, rootK) {
  const idx = names.map((n) => BI[n]), P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), pb = parent ? BI[parent] : -1;
  const A = new THREE.Vector3(), D = new THREE.Vector3(), X = new THREE.Vector3();
  return (x, y, z) => {
   X.set(x, y, z); let best = 1e9, bi = 0, bt = 0;
   for (let i = 0; i < idx.length; i++) {
    D.subVectors(P[i + 1], P[i]); const L2 = D.lengthSq(), t = A.subVectors(X, P[i]).dot(D) / L2;
    const d = A.copy(P[i]).addScaledVector(D, cl(t, 0, 1)).distanceToSquared(X);
    if (d < best) { best = d; bi = i; bt = t; }
   }
   if (bi === 0 && bt < .3 && pb >= 0) { const k = sm(.3, -.15, bt) * (rootK || .6); return [[pb, k], [idx[0], 1 - k]]; }
   if (bt < .3 && bi > 0) { const k = sm(.3, 0, bt) * .5; return [[idx[bi - 1], k], [idx[bi], 1 - k]]; }
   if (bt > .7 && bi < idx.length - 1) { const k = sm(.7, 1, bt) * .5; return [[idx[bi], 1 - k], [idx[bi + 1], k]]; }
   return [[idx[bi], 1]];
  };
 }

 // ---------- head: a round, soft chibi head; X and Y (-1.1 to 1.1) are both its front view and the face texture ----------
 const xSq = (Y) => 1 - .1 * sm(-.15, -.95, Y); // a little narrower toward the chin
 function faceD(X, Y) {
  let d = 0;
  for (const s of [-1, 1]) {
   d += .05 * G2(X - s * .5, Y + .4, .26, .2);    // round cheeks
   d -= .022 * G2(X - s * .38, Y + .08, .2, .16); // flatter where the eyes sit
  }
  d += .04 * G2(X, Y + .3, .07, .07);              // a small nose
  d += .02 * G2(X, Y + .8, .2, .1);                // chin
  return d;
 }
 function headU(X0, Y0, Z0, o) {
  const Y = Y0, X = X0 * xSq(Y);
  let Z = Z0 > 0 ? Z0 * (1 - .05 * sm(-.1, -.9, Y)) : Z0 * 1.05;
  if (Z > 0) Z += faceD(X, Y) * sm(0, .35, Z);
  o[0] = X; o[1] = Y; o[2] = Z; return o;
 }
 const _hu = [0, 0, 0];
 const headW = (o, out) => out.set(HC[0] + o[0] * HR[0], HC[1] + o[1] * HR[1], HC[2] + o[2] * HR[2]);
 // the face point whose front view is (X, Y), and the way it faces
 function faceAt(X, Y, off) {
  const P = (x, y, out) => { const x0 = x / xSq(y), z0 = Math.sqrt(Math.max(0, 1 - x0 * x0 - y * y)); return headW(headU(x0, y, z0, _hu), out); };
  const p = P(X, Y, new THREE.Vector3()), px = P(X + 1e-3, Y, new THREE.Vector3()), py = P(X, Y + 1e-3, new THREE.Vector3());
  const n = new THREE.Vector3().crossVectors(px.sub(p), py.sub(p)).normalize(); if (n.z < 0) n.negate();
  if (off) p.addScaledVector(n, off);
  return { p, n };
 }
 const PLAIN = [2 / 256, 1 - 2 / 256];
 {
  const g = surf(Q(56, 28), Q(40, 20), (u, v, o) => { const th = (u - .5) * TAU, ph = v * PI; headU(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th), o); o[0] = HC[0] + o[0] * HR[0]; o[1] = HC[1] + o[1] * HR[1]; o[2] = HC[2] + o[2] * HR[2]; }, true);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
   const X = (p.getX(i) - HC[0]) / HR[0], Y = (p.getY(i) - HC[1]) / HR[1];
   if (p.getZ(i) < HC[2] + .02) uv.setXY(i, PLAIN[0], PLAIN[1]); else uv.setXY(i, cl(X, -1.1, 1.1) / 1.1 * .5 + .5, cl(Y, -1.1, 1.1) / 1.1 * .5 + .5);
  }
  add(g, M.skin, BI.head);
 }
 inked(.6, () => add(uvAt(lathe([[.036, .76], [.04, .72], [.046, .69]], Q(16)), PLAIN[0], PLAIN[1]), M.skin, wNeck));

 // ---------- face: eyes with lids that blink, brows, painted mouth shapes ----------
 const face = new THREE.Group(); head.add(face);
 const SX = .031, SY = .047, SZ = .013;
 const EF = [-1, 1].map((sd) => {
  const { p, n } = faceAt(sd * .4, -.1);
  const zA = n.clone().lerp(ZA, .55).normalize(), xA = new THREE.Vector3().crossVectors(YA, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
  const o = p.clone().addScaledVector(zA, -SZ * .5);
  return { sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(o.x - HW[0], o.y - HW[1], o.z - HW[2]) };
 });
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 {
  const gs = EF.map((f) => {
   const g = new THREE.SphereGeometry(1, Q(22), Q(16)), p = g.attributes.position, uv = g.attributes.uv;
   for (let i = 0; i < p.count; i++) { uv.setXY(i, p.getX(i) * .5 + .5, p.getY(i) * .5 + .5); p.setXYZ(i, p.getX(i) * SX, p.getY(i) * SY, p.getZ(i) * SZ); }
   g.applyMatrix4(f.m); g.computeVertexNormals(); return g;
  });
  const eyes = new THREE.Mesh(mergeGeos(gs), M.eye); face.add(eyes);
 }
 // lids and lash lines and brows in one vertex-coloured mesh: morph 0 closes the lids, morph 1 lifts the brows
 let lidMesh;
 {
  const P = [], PB = [], PF = [], C = [], I = [];
  const V = (b, k, f, c) => { P.push(b.x, b.y, b.z); PB.push(k.x, k.y, k.z); PF.push(f.x, f.y, f.z); C.push(c[0], c[1], c[2]); };
  const skin = rgbOf(P_.skin), crease = rgbOf(P_.skin2), lash = rgbOf(P_.ink), brow = rgbOf(P_.cu2);
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const _a = new THREE.Vector3(), _k = new THREE.Vector3();
  const put = (f, x, y, yc, zl, c) => {
   const z = Math.max(zS(x, y) + .0008, .002) + zl, zc = Math.max(zS(x, yc) + .0008, .002) + zl;
   _a.set(x, y, z).applyMatrix4(f.m); _k.set(x, yc, zc).applyMatrix4(f.m); V(_a, _k, _a, c);
  };
  const grid = (nx, ny, fn, flip) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; if (flip) I.push(a, a + 1, c, a + 1, c + 1, c); else I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd;
   // the lid edge sits just over the top of the iris when open; closed, it curves down like a smile
   const yE = (x) => SY * (.9 - .3 * x * x), yC = (x) => SY * (-.45 + .3 * x * x), yT = (x) => SY * (1.5 - .25 * x * x);
   grid(Q(12, 8), 4, (s, r) => { const x = lerp(-1.12, 1.12, s); put(f, x * SX, lerp(yT(x), yE(x), r), lerp(yT(x), yC(x), r), 0, mix3(skin, crease, sm(.5, 1, r) * .5)); });
   // the upper lash line: thick, and flicked out at the outer corner
   grid(Q(16, 8), 2, (s, r) => {
    const o = lerp(-1.06, 1.3, s), x = o * sd, xc = Math.min(1, Math.abs(o)) * Math.sign(x), wing = Math.max(0, o - 1);
    const th = .0062 * (o > .8 ? Math.max(.25, 1 - (o - .8) / .55) : 1) * (o < -.85 ? .6 : 1);
    const y0 = o <= 1 ? yE(x) : yE(xc) + wing * .02, y1 = o <= 1 ? yC(x) : yC(xc) - wing * .004;
    put(f, o > 1 ? xc * SX + sd * wing * SX * .8 : x * SX, y0 - r * th + .0012, y1 - r * th * .7, .0008, lash);
   }, sd < 0);
   // a short, soft lower lash line at the outer corner
   grid(Q(10, 6), 1, (s, r) => { const o = lerp(.25, 1.0, s), x = o * sd, y = -SY * (.9 - .3 * x * x) - r * .0016; put(f, x * SX, y, y, .0004, mix3(lash, crease, .45)); }, sd < 0);
  }
  // brows: short, soft copper strokes, mostly under the fringe
  const browPts = (sd, k) => [[.2, .3 + .07 * k], [.38, .345 + .07 * k], [.56, .32 + .06 * k]].map(([x, y]) => { const p = faceAt(sd * x, y, .003).p; return [p.x - HW[0], p.y - HW[1], p.z - HW[2]]; });
  const browUp = (c, nn) => nn.set(c.x - HC[0] + HW[0], c.y - HC[1] + HW[1], c.z - HC[2] + HW[2]);
  for (const sd of [-1, 1]) {
   const r = (t) => .0075 * Math.pow(Math.sin(PI * (.1 + .8 * t)), .6) + .001;
   const g0 = tube(browPts(sd, 0), Q(10, 6), Q(6, 4), r, .35, browUp), g1 = tube(browPts(sd, 1), Q(10, 6), Q(6, 4), r, .35, browUp);
   const b0 = P.length / 3, p0 = g0.attributes.position, p1 = g1.attributes.position;
   for (let i = 0; i < p0.count; i++) { _a.fromBufferAttribute(p0, i); _k.fromBufferAttribute(p1, i); V(_a, _a, _k, brow); }
   for (let k = 0; k < g0.index.count; k++) I.push(g0.index.array[k] + b0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  g.setIndex(I); g.computeVertexNormals();
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(PB, 3), new THREE.Float32BufferAttribute(PF, 3)];
  lidMesh = new THREE.Mesh(g, M.lid); lidMesh.morphTargetInfluences = [0, 0]; face.add(lidMesh);
 }
 {
  const g = surf(Q(12, 6), Q(5, 3), (u, v, o) => { const p = faceAt(lerp(-.15, .15, u), lerp(-.44, -.6, v), .0014).p; o[0] = p.x - HW[0]; o[1] = p.y - HW[1]; o[2] = p.z - HW[2]; });
  const m = new THREE.Mesh(g, M.mouth); m.renderOrder = 3; face.add(m);
 }

 // ---------- hair: a copper bob with a straight fringe, two locks framing her face, and a tuft on top ----------
 const tmpS = [0, 0, 0];
 function scalpPt(az, el, off) {
  const ph = PI / 2 - cl(el, -1.3, 1.565); headU(Math.sin(ph) * Math.sin(az), Math.cos(ph), Math.sin(ph) * Math.cos(az), tmpS);
  const x = tmpS[0] * HR[0], y = tmpS[1] * HR[1], z = tmpS[2] * HR[2], L = Math.hypot(x, y, z), k = (L + off) / L;
  return [HC[0] + x * k, HC[1] + y * k, HC[2] + z * k];
 }
 const HAIRC = [[1, 1, 1], [.9, .88, .88], [1.06, 1.03, 1.02], [.95, .93, .93]];
 {
  const elMin = (az) => { const a = Math.abs(az); return a < .9 ? .55 : a < 1.7 ? lerp(.55, .05, sm(.9, 1.7, a)) : lerp(.05, -.62, sm(1.7, 2.6, a)); };
  tinted([.72, .66, .64], () => add(uvAt(surf(Q(40, 20), Q(14, 8), (u, v, o) => { const az = lerp(-PI, PI, u), p = scalpPt(az, lerp(PI / 2, elMin(az), v), .006); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, true), .6, .5), M.hair, BI.head));
 }
 const HUP = (c, nn) => nn.set(c.x - HC[0], c.y - HC[1] + .02, c.z - HC[2]);
 // a lock from (az0, el0) to (az1, el1) over the scalp; o.chain = [bone, bone] hangs its lower part on two springy bones
 function lock(az0, el0, az1, el1, o) {
  const n = 8, pts = [];
  for (let i = 0; i <= n; i++) {
   const t = i / n, az = lerp(az0, az1, t), el = lerp(el0, el1, t) + (o.arc || 0) * Math.sin(PI * t);
   pts.push(scalpPt(az, el, lerp(o.r0 === undefined ? .002 : o.r0, o.r1 === undefined ? .03 : o.r1, t) + (o.bulge || 0) * Math.sin(PI * Math.min(1, t * 1.1))));
  }
  if (o.flick) { const f = o.flick; for (const [i, k] of [[n, 1], [n - 1, .4], [n - 2, .1]]) { pts[i][0] += f[0] * k; pts[i][1] += f[1] * k; pts[i][2] += f[2] * k; } }
  const ns = Q(o.seg || 14, 7), nr = Q(o.rs || 8, 5), w0 = o.w || .05, tp = o.taper === undefined ? .5 : o.taper;
  const g = tube(pts, ns, nr, (t) => w0 * Math.pow(1 - t * .92, tp) * (.82 + .18 * Math.sin(PI * Math.min(1, t * 2))) + .0015, o.flat || .42, HUP);
  const ch = o.chain;
  tinted(o.col || HAIRC[(rnd() * HAIRC.length) | 0], () => add(g, M.hair, !ch ? BI.head : (x, y, z, i) => {
   const t = Math.floor(i / (nr + 1)) / ns, k1 = sm(o.from || .3, .7, t) * (o.amt || 1), k2 = sm(.6, 1, t);
   return [[BI.head, 1 - k1], [BI[ch[0].name], k1 * (1 - k2)], [BI[ch[1].name], k1 * k2]];
  }));
 }
 const radial = (az, k, up) => [Math.sin(az) * k, up || 0, Math.cos(az) * k * .95];
 // the crown: short locks fanning out from the top of her head
 if (LOOK.style !== 'helm' && LOOK.style !== 'cap') for (let k = 0; k < 12; k++) { const az = -PI + (k + .5) / 12 * TAU + (rnd() - .5) * .1; lock(az, 1.5, az + (rnd() - .5) * .2, .95, { w: .06, r0: .004, r1: .012, bulge: .012, seg: 8 }); }
 const BOBBED = LOOK.style === 'bob';
 // the bob: round the back and sides, falling to her chin, full in the middle, the ends curling under
 // (other people's hair is cut shorter: to the jaw, close to the head)
 if (LOOK.style !== 'long') BOB.forEach((az, i) => {
  for (const d of [-.23, 0, .23]) {
   let a = az + d * (i === 3 ? 1.2 : 1); if (Math.abs(a) < 1.08) a = Math.sign(a) * 1.08; // nothing of the bob comes forward of her cheeks
   const fr = Math.abs(a) < 1.35; // the front edge, beside her face, is a touch shorter and closer in
   if (BOBBED) lock(a, 1.2, a + d * .15, fr ? -.66 : -.8, { w: .066, r0: .004, r1: fr ? .032 : .048, bulge: fr ? .016 : .024, flat: .5, arc: -.05, flick: radial(a, -.026, .012), chain: bobB[i], seg: 16 });
   else lock(a, 1.2, a + d * .1, fr ? -.05 : -.32, { w: .064, r0: .004, r1: .018, bulge: .014, flat: .5, flick: radial(a, -.012, .004), chain: bobB[i], seg: 12, amt: .5 });
  }
 });
 // long straight hair (Mira's): over the scalp, then falling behind the shoulders to the middle of the back, with two strands
 // in front of the shoulders; the top follows the head and the rest the shoulders
 if (LOOK.style === 'long') {
  const upH = (c, nn) => nn.set(c.x - HC[0], c.y > HC[1] - .1 ? c.y - HC[1] : 0, c.z - HC[2]);
  const wHang = (x, y) => { const k = sm(HC[1] - .26, HC[1] - .06, y); return [[BI.head, k], [BI.chest, 1 - k]]; };
  const hang = (az, w, yEnd) => {
   const pts = []; for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(scalpPt(az, lerp(1.2, -.55, t), lerp(.004, .02, t))); }
   const e = pts[pts.length - 1], azB = Math.sign(az || 1) * Math.max(Math.abs(az), 2.1), R = .17;
   for (let j = 1; j <= 6; j++) { const t = j / 6, a = lerp(az, azB, sm(0, .5, t)); pts.push([Math.sin(a) * R * lerp(1, .82, t), lerp(e[1], yEnd, t), Math.cos(a) * R * .9 + HC[2] * (1 - t)]); }
   tinted(HAIRC[(rnd() * HAIRC.length) | 0], () => add(tube(pts, Q(22, 12), Q(8, 5), (t) => w * (.7 + .3 * sm(0, .3, t)) * (1 - .35 * sm(.8, 1, t)) + .002, .4, upH), M.hair, wHang));
  };
  for (let k = 0; k < 13; k++) { const az = lerp(1.2, TAU - 1.2, k / 12); hang(az > PI ? az - TAU : az, .07, HC[1] - .56 + (rnd() - .5) * .04); }
  for (const sd of [-1, 1]) {
   const pts = []; for (let i = 0; i <= 5; i++) pts.push(scalpPt(sd * 1.02, lerp(1.0, -.2, i / 5), .012));
   const e = pts[5]; for (let j = 1; j <= 4; j++) { const t = j / 4; pts.push([e[0] + sd * .012 * t, lerp(e[1], HC[1] - .36, t), e[2] + .04 * t]); }
   tinted(HAIRC[0], () => add(tube(pts, Q(16, 10), Q(8, 5), (t) => .04 * (1 - .4 * t) + .002, .4, upH), M.hair, wHang));
  }
 }
 // the two locks framing her face, in front of the bob
 if (BOBBED) for (const [i, sd] of [[0, -1], [1, 1]]) lock(sd * .86, .95, sd * 1.0, -.72, { w: .046, r0: .006, r1: .016, bulge: .016, flat: .45, flick: [sd * .004, .006, -.002], chain: frameB[i], from: .35, amt: .9 });
 // the fringe: seven locks over the forehead, cut straight just above the brows (or swept up and back into a bun)
 for (let k = 0; k < 7; k++) {
  const t = k / 6, az = lerp(-.66, .66, t) + (rnd() - .5) * .04;
  lock(az * .6, 1.32, az, (LOOK.style === 'bun' ? .66 : .34) + .04 * Math.cos(PI * (t - .5)) + (rnd() - .5) * .03, { w: .062, r0: .006, r1: .016, bulge: .026, flat: .4, arc: .05, flick: radial(az, -.006, -.002), seg: 12 });
 }
 // a bun at the back; a baker's cap; a watchman's helmet
 if (LOOK.style === 'bun') {
  add(new THREE.SphereGeometry(.078, Q(16), Q(12)), M.hair, BI.head, [HC[0], HC[1] + .1, HC[2] - .17], null, [1, .9, .9]);
  add(new THREE.TorusGeometry(.05, .014, Q(6), Q(16)), M.hair, BI.head, [HC[0], HC[1] + .07, HC[2] - .15], [1.2, 0, 0]);
 }
 if (LOOK.style === 'cap' && M.hat) {
  add(lathe([[.188, .1], [.194, .05], [.19, .0]].map(([r, y]) => [r, HC[1] + y + .08]), Q(28)), M.hat, BI.head);
  add(new THREE.SphereGeometry(1, Q(22), Q(12)), M.hat, BI.head, [HC[0], HC[1] + .245, HC[2] - .01], [-.15, 0, 0], [.21, .11, .2]);
 }
 if (LOOK.style === 'helm' && M.hat) {
  add(new THREE.SphereGeometry(.205, Q(28), Q(12), 0, TAU, 0, 1.25), M.hat, BI.head, [HC[0], HC[1] + .025, HC[2] - .004], null, [1.15, 1.12, 1.14]);
  add(new THREE.TorusGeometry(.2, .016, Q(6), Q(28)), M.hat, BI.head, [HC[0], HC[1] + .09, HC[2]], [PI / 2, 0, 0], [1.16, 1.12, 1]);
  add(new THREE.BoxGeometry(.02, .05, .3), M.hat, BI.head, [HC[0], HC[1] + .235, HC[2] - .01], [.0, 0, 0]);
 }
 // the tuft: one lock sticking up off the crown and curling forward
 if (LOOK.style === 'bob' || LOOK.style === 'short') {
  const b = bw(tuftB[0]), pts = [[b[0] + .01, b[1] - .03, b[2] - .01], [b[0], b[1] + .01, b[2]], [b[0] - .008, b[1] + .04, b[2] + .018], [b[0] - .012, b[1] + .05, b[2] + .045]];
  tinted([1.04, 1.02, 1], () => add(tube(pts, Q(10, 6), Q(6, 4), (t) => .016 * (1 - t * .85), .55), M.hair, wChain(['tuft', 'tuftt'], [pts[0], pts[1], pts[3]], 'head', .9)));
 }

 // ---------- the coat: navy, to the knee, a little flared; lined so the hem has a thickness ----------
 const COATP = [2 / 256 * 4, 1 - 2 / 256 * 4]; // the plain navy swatch in the coat texture
 const NAVY2 = ratio(P_.nv, P_.nv2), NAVY3 = ratio(P_.nv, P_.nv3);
 const coatProf = [[.05, .725], [.078, .708], [.1, .682], [.111, .652], [.113, .605], [.107, .555], [.103, .505], [.108, .462], [.123, .41], [.14, .35], [.153, .292], [.16, .25]];
 add(lathe(coatProf, Q(40, 20), { sz: .82, sub: 2 }), M.coat, wCoat);
 tinted([.55, .55, .62], () => inked(0, () => add(uvAt(lathe(coatProf.slice(7).map(([r, y]) => [r - .006, y]), Q(36, 18), { sz: .8, flip: true }), COATP[0], COATP[1]), M.coat, wCoat)));
 // sleeves with a lighter cuff, and her hands: a mitten with a thumb, as the sprite has them
 for (const [i, sd] of [[0, -1], [1, 1]]) {
  const S = bw(arms[i]), E = bw(elbows[i]), W = bw(wrists[i]);
  const pts = [[S[0] - sd * .02, S[1] + .02, S[2]], S, E, [W[0], W[1] - .008, W[2]]];
  add(uvAt(tube(pts, Q(16, 8), Q(12, 8), (t) => lerp(.044, .041, sm(0, .5, t)) + .007 * sm(.8, 1, t), 1), COATP[0], COATP[1]), M.coat, wArm);
  add(uvAt(new THREE.SphereGeometry(.047, Q(14), Q(10)), COATP[0], COATP[1]), M.coat, (x, y) => [[BI.chest, .35], [BI['shoulder' + sd], .65]], [S[0], S[1] + .006, S[2]], null, [1, .9, .95]);
  tinted(NAVY3, () => add(uvAt(tube([[W[0], W[1] + .022, W[2]], [W[0], W[1] + .006, W[2]], [W[0], W[1] - .008, W[2]]], Q(4, 3), Q(12, 8), () => .05, 1), COATP[0], COATP[1]), M.coat, BI['wrist' + sd]));
  const F = bw(fing[i]), Th = bw(thumb[i]);
  inked(.3, () => {
   add(uvAt(new THREE.SphereGeometry(1, Q(14), Q(10)), PLAIN[0], PLAIN[1]), M.skin, BI['wrist' + sd], [W[0], W[1] - .028, W[2] + .004], null, [.026, .031, .018]);
   add(uvAt(new THREE.SphereGeometry(1, Q(14), Q(10)), PLAIN[0], PLAIN[1]), M.skin, BI['fing' + sd], [F[0], F[1] - .014, F[2]], null, [.025, .027, .016]);
   add(uvAt(new THREE.SphereGeometry(1, Q(10), Q(8)), PLAIN[0], PLAIN[1]), M.skin, BI['thumb' + sd], [Th[0] - sd * .004, Th[1] - .01, Th[2] + .004], [.3, 0, sd * .3], [.011, .02, .011]);
  });
 }
 // an apron over the front of the coat, for those who wear one
 if (M.apron) {
  const rAt = (y) => { for (let i = 0; i < coatProf.length - 1; i++) { const [r0, y0] = coatProf[i], [r1, y1] = coatProf[i + 1]; if (y <= y0 && y >= y1) return lerp(r0, r1, (y0 - y) / (y0 - y1)); } return .16; };
  add(surf(Q(16, 8), Q(16, 8), (u, v, o) => { const y = lerp(.6, .27, v), az = lerp(-.95, .95, u) * lerp(.7, 1, v), r = rAt(y) + .007; o[0] = Math.sin(az) * r; o[1] = y; o[2] = Math.cos(az) * r * .82 + .003; }, false, false), M.apron, wCoat);
 }
 // three brass buttons beside the lighter edge
 if (LOOK.buttons && !M.apron) inked(.4, () => { for (const y of [.62, .555, .49]) { const r = lerp(.112, .104, sm(.62, .49, y)); add(new THREE.SphereGeometry(.0085, Q(10), Q(8)), M.brass, wTorso, [.004, y, r * .82 + .004], null, [1, 1, .6]); } });

 // ---------- trousers and boots ----------
 for (const [i, sd] of [[0, -1], [1, 1]]) {
  const H = bw(legs[i]), K = bw(knees[i]), A = bw(ankles[i]);
  tinted(LOOK.trousers ? ratio(P_.nv, pc(LOOK.trousers)) : NAVY2, () => add(uvAt(tube([[H[0], H[1] + .03, H[2]], H, K, [A[0], A[1] + .02, A[2]]], Q(14, 8), Q(12, 8), (t) => lerp(.048, .038, t), 1), COATP[0], COATP[1]), M.coat, wLeg));
  const x = sd * .062;
  inked(.8, () => {
   add(lathe([[.039, .13], [.041, .1], [.042, .06], [.044, .03]], Q(16)), M.boot, wFoot, [x, 0, -.004]);
   add(new THREE.SphereGeometry(1, Q(16), Q(10)), M.boot, wFoot, [x, .037, .028], null, [.045, .037, .072]);
   add(new THREE.SphereGeometry(1, Q(14), Q(10)), M.boot, wFoot, [x, .03, .078], null, [.041, .031, .042]);
   tinted(ratio(P_.bt, P_.bt2), () => add(new THREE.SphereGeometry(1, Q(16), Q(8)), M.boot, wFoot, [x, .009, .036], null, [.049, .012, .088]));
   tinted([1.35, 1.25, 1.15], () => add(new THREE.TorusGeometry(.042, .009, Q(6), Q(18)), M.boot, wFoot, [x, .128, -.004], [PI / 2, 0, 0]));
  });
 }

 // ---------- the scarf: wound twice round her neck and knotted on her right, one end down her front, one behind ----------
 if (!LOOK.scarf) add(uvAt(lathe([[.062, .745], [.076, .72], [.088, .7]], Q(24)), COATP[0], COATP[1]), M.coat, (x, y) => [[BI.chest, .6], [BI.neck, .4]]);
 else {
  const ring = (r, y, dip, tilt) => { const pts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pts.push(new THREE.Vector3(Math.sin(a) * r, y - dip * Math.cos(a) + tilt * Math.sin(a), Math.cos(a) * r * .92 + .004)); } return new THREE.CatmullRomCurve3(pts, true); };
  for (const [r, y, dip, tilt, tr] of [[.078, .708, .012, .004, .034], [.086, .686, .016, -.006, .03]]) {
   const g = new THREE.TubeGeometry(ring(r, y, dip, tilt), Q(40, 20), tr, Q(10, 6), true), uv = g.attributes.uv;
   for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * .6);
   add(g, M.knit, (x, yy) => [[BI.chest, .55], [BI.neck, .45]]);
  }
  add(uvAt(new THREE.SphereGeometry(1, Q(14), Q(10)), .3, .5), M.knit, BI.chest, [-.052, .69, .078], [0, -.4, .3], [.034, .03, .026]);
  const tail = (bs, start, tip, nrm) => {
   const pts = [start, ...bs.map(bw), tip];
   const up = (c, nn) => nn.set(nrm[0], nrm[1], nrm[2]);
   add(tube(pts, Q(18, 9), Q(10, 6), (t) => .034 + .004 * sm(.7, 1, t), .2, up), M.knit, wChain(bs.map((b) => b.name), [pts[1], pts[2], pts[3], tip], 'chest', .8));
   tinted(ratio(KNIT[0], KNIT[1]), () => inked(.3, () => { for (let k = 0; k < 5; k++) { const dx = (k - 2) * .013, p0 = [tip[0] + dx, tip[1] + .004, tip[2]], p1 = [tip[0] + dx * 1.1, tip[1] - .028, tip[2] + nrm[2] * .004]; add(uvAt(tube([p0, p1], 3, 4, () => .0045, 1), .9, .5), M.knit, BI[bs[2].name]); } }));
  };
  const fT = bw(scfF[2]); tail(scfF, [-.05, .69, .085], [fT[0], fT[1] - .07, fT[2] + .004], [0, 0, 1]);
  const bT = bw(scfB[2]); tail(scfB, [.04, .7, -.075], [bT[0], bT[1] - .07, bT[2] - .02], [0, 0, -1]);
 }

 // ---------- the lamplighter's pole: her weapon, her reach and her light (Chris's answer 4) ----------
 // A telescoping pole kept in her fist: in the 'light' action it slides out to the length it needs, carrying a small flame at
 // its brass tip, and slides back in after. aim(point) points it at what she is lighting and sets how far it reaches.
 // Its parts are built along +Y in POLE.axis, which sits at the grip and points on past her fingers.
 const POLE = { g: new THREE.Group(), axis: new THREE.Group(), inner: null, tip: new THREE.Group(), len: .62, want: .62, base: .28 };
 {
  const G = new THREE.Vector3(0, -.07, .03), D0 = new THREE.Vector3(.5, -.83, -.22).normalize(); // on past her fingers, angled in across her body
  POLE.g.position.copy(G); wrists[0].add(POLE.g);
  POLE.axis.quaternion.setFromUnitVectors(YA, D0); POLE.g.add(POLE.axis);
  const seg = (r0, r1, y0, y1, mat, n) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, y1 - y0, n || Q(8)), mat); m.position.y = (y0 + y1) / 2; POLE.axis.add(m); return m; };
  seg(.0115, .0105, -.07, .31, M.pole);                // the outer section, held in her fist
  seg(.0128, .0128, -.035, .075, M.grip);              // a leather grip where her hand goes
  seg(.0135, .0125, .29, .315, M.brass);               // the brass collar the inner section slides out of
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(.0078, .0078, 1, Q(7)), M.pole); inner.geometry.translate(0, .5, 0); inner.position.y = POLE.base; POLE.axis.add(inner); POLE.inner = inner;
  POLE.axis.add(POLE.tip);
  const tipPart = (geo, mat, y, rx) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; if (rx) m.rotation.x = rx; POLE.tip.add(m); return m; };
  tipPart(new THREE.CylinderGeometry(.0105, .0105, .03, Q(8)), M.brass, .015);                     // the tip's brass ferrule
  const hook = tipPart(new THREE.TorusGeometry(.02, .0035, Q(5), Q(10), Math.PI * 1.25), M.brass, .055); // the hook that opens a lamp's door
  hook.rotation.set(0, Math.PI / 2, -Math.PI * .1); hook.position.z = .016;
  tipPart(new THREE.CylinderGeometry(.009, .005, .018, Q(8)), M.brass, .039);                    // the wick's little cup
  POLE.g.visible = false;
 }
 const POLE_TIP = new THREE.Vector3(0, .052, 0); // the flame, in the tip's own space
 let aimT = null; const _qPa = new THREE.Quaternion(), _qPb = new THREE.Quaternion();
 // ---------- bind ----------
 const skeleton = new THREE.Skeleton(bones);
 buildSkinned(root, skeleton);

 // ---------- effects in world space (the scene adds fx): the pole's flame and its light ----------
 const flameTex = (() => {
  const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 38, 0, 32, 38, 30);
  gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.25, 'rgba(255,214,107,.9)'); gr.addColorStop(.6, 'rgba(255,154,60,.35)'); gr.addColorStop(1, 'rgba(255,154,60,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(56, 40, 32, 62); g.quadraticCurveTo(8, 40, 32, 2); g.fill();
  return new THREE.CanvasTexture(c);
 })();
 const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
 flame.scale.set(.05, .07, 1); fx.add(flame);
 const flameL = new THREE.PointLight(P_.fl2, 0, 1.6, 2); fx.add(flameL);

 // ---------- motion: poses are flat objects of channels ----------
 // pelvis offset y/x/z and its rotations; spine s, chest c, neck n, head h (YXZ euler); feet as IK targets in root space
 // (r/l F x y z, yaw r, pitch p: positive lifts the heel); arms forward-kinematic (r/l S X Y Z, elbow E, wrist W X Z: X < 0
 // swings the arm forward and up, Z > 0 out to the side); finger curls fR fL; face: bl (lids), br (brows), mo (mouth shape); tp (the pole is out), pe (how far it's slid out).
 const READY = {
  y: 0, x: 0, z: 0, pX: 0, pY: 0, pZ: 0, sX: 0, sY: 0, sZ: 0, cX: 0, cY: 0, cZ: 0, nX: 0, nY: 0, hX: 0, hY: 0, hZ: 0,
  rFx: -.064, rFy: 0, rFz: 0, rFr: -.06, rFp: 0, lFx: .064, lFy: 0, lFz: 0, lFr: .06, lFp: 0,
  rSX: .05, rSY: 0, rSZ: .1, rE: -.2, rWX: 0, rWZ: 0, lSX: .05, lSY: 0, lSZ: .1, lE: -.2, lWX: 0, lWZ: 0,
  fR: .3, fL: .3, bl: 0, br: 0, mo: 0, tp: 0, pe: 0,
 };
 const CH = Object.keys(READY).filter((k) => k !== 'mo');
 const cp = (a, b) => { for (const k of CH) a[k] = b[k]; a.mo = b.mo; return a; };
 const mix = (a, b, w) => { if (w <= 0) return a; for (const k of CH) a[k] += (b[k] - a[k]) * w; if (w >= .5) a.mo = b.mo; return a; };
 const K = (u, o) => [u, o || {}];
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = READY;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, hits: [], hold: false, interrupt: false, bi: .14, bo: .18, dash: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p, n = T.length;
  let i = 0; while (i < n - 2 && u > T[i + 1]) i++;
  const t0 = T[i], t1 = T[i + 1], f = cl((u - t0) / (t1 - t0), 0, 1), ia = Math.max(0, i - 1), id = Math.min(n - 1, i + 2);
  const a = Pk[ia], b = Pk[i], c = Pk[i + 1], d = Pk[id], ta = T[ia], td = T[id], h = t1 - t0;
  const f2 = f * f, f3 = f2 * f, h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = 3 * f2 - 2 * f3, h11 = f3 - f2;
  for (const k of CH) {
   const m0 = (c[k] - a[k]) / Math.max(1e-6, t1 - ta) * h, m1 = (d[k] - b[k]) / Math.max(1e-6, td - t0) * h;
   out[k] = h00 * b[k] + h10 * m0 + h01 * c[k] + h11 * m1;
  }
  out.mo = f >= 1 ? c.mo : b.mo;
  return out;
 }
 const bump = (a, b, v) => (u) => (u > a && u < b ? v * Math.sin(PI * (u - a) / (b - a)) : 0);
 // lighting a lamp: the pole comes up in her fist and slides out, she reaches its tip up to the lamp, the wick catches (hit),
 // and she smiles; then the pole slides back in
 act('light', 1.8, [
  K(0), K(.13, { tp: 1, pe: .12, rSX: -.85, rE: -1.25, rSZ: .16, rWX: -.1, fR: .85, hX: -.05, br: .2 }),
  K(.32, { pe: 1, rSX: -1.75, rSZ: .22, rE: -.32, rWX: -.25, hX: -.32, nX: -.1, cX: -.05, pX: -.03, lSZ: .32, lSX: -.3, lE: -.5, br: .35 }),
  K(.5, { rSX: -1.82, hX: -.36, mo: 1 }), K(.66, { rSX: -1.78, mo: 0, br: .55 }),
  K(.84, { pe: .12, rSX: -.85, rE: -1.2, rSZ: .16, rWX: -.1, hX: 0, nX: 0, cX: 0, pX: 0, lSZ: .1, lSX: .05, lE: -.2, br: .15, mo: 2 }),
  K(.95, { tp: 0, pe: 0 }), K(1, READY),
 ], { hits: [.5] });
 act('wave', 1.9, [K(0), K(.16, { rSX: -2.15, rSZ: .75, rE: -.45, mo: 2, br: .45, hX: -.06, cZ: -.05, pZ: .02, fR: 0, lSZ: .2 }), K(.84), K(1, READY)], {
  post: (u, P) => { const k = sm(.12, .25, u) * (1 - sm(.75, .88, u)), s = Math.sin((u - .15) * 1.9 * 13); P.rSZ += .28 * s * k; P.rE -= .15 * (1 + s) * k; P.rWZ = .4 * s * k; },
 });
 // the first thing she does with a body: looks at her hands, turns them over, then looks up
 act('wonder', 2.8, [
  K(0), K(.16, { rSX: -.95, lSX: -.95, rSZ: -.12, lSZ: -.12, rE: -1.05, lE: -1.05, rSY: .5, lSY: .5, hX: .44, nX: .16, cX: .08, mo: 1, br: .7, fR: .1, fL: .1 }),
  K(.4, { rWZ: .7, lWZ: .7, rSY: .1, lSY: .1 }), K(.56, { rWZ: -.4, lWZ: -.4, rSY: .7, lSY: .7, fR: .6, fL: .6 }),
  K(.74, { hX: -.14, nX: -.06, cX: -.03, mo: 2, br: .55, rSX: -.45, lSX: -.45, rE: -.7, lE: -.7, rWZ: 0, lWZ: 0, rSY: 0, lSY: 0, fR: .3, fL: .3 }),
  K(1, READY),
 ]);
 // carrying a lantern at her waist, and holding it up high (both hold until something else plays)
 act('carry', .5, [K(0), K(1, { rSX: -.45, rSZ: .05, rE: -1.0, rWX: .5, fR: .9 })], { hold: true });
 // holding something to her chest in both arms (Mira's book)
 act('clasp', .6, [K(0), K(1, { rSX: -.45, rSZ: .05, rSY: -.95, rE: -1.85, rWX: .2, lSX: -.45, lSZ: .05, lSY: -.95, lE: -1.85, lWX: .2, fR: .8, fL: .8 })], { hold: true });
 act('raise', .8, [K(0), K(.6, { rSX: -2.5, rSZ: .2, rE: -.3, rWX: .3, fR: .9, hX: -.3, nX: -.1, br: .4, mo: 2 }), K(1, { rSX: -2.45, rSZ: .2, rE: -.3, rWX: .3, fR: .9, hX: -.3, nX: -.1, br: .4, mo: 2 })], { hold: true });
 act('look', 2.4, [K(0), K(.2, { hY: .78, nY: .26, cY: .1, br: .4 }), K(.4), K(.62, { hY: -.78, nY: -.26, cY: -.1 }), K(.82), K(1, READY)]);
 act('jump', .95, [
  K(0), K(.2, { y: -.1, pX: .15, cX: .1, hX: -.05, rSX: .6, lSX: .6, rE: -.3, lE: -.3 }),
  K(.38, { y: .18, pX: -.05, cX: -.05, rSX: -2.2, lSX: -2.2, rSZ: .45, lSZ: .45, rE: -.2, lE: -.2, rFy: .16, lFy: .16, rFp: .6, lFp: .6, mo: 2, br: .5 }),
  K(.52, { y: .26, rFy: .24, lFy: .24, rFp: .2, lFp: .2, rFz: .03, lFz: -.02 }),
  K(.7, { y: .05, rFy: .03, lFy: .03, rFp: 0, lFp: 0, rFz: 0, lFz: 0, rSX: -.6, lSX: -.6 }),
  K(.8, { y: -.09, pX: .12, cX: .08, rSX: .3, lSX: .3, mo: 0 }), K(1, READY),
 ]);
 // falling: a stumble, onto her knees, onto her hands, then flat on the ground (it holds there until rise)
 const FALLEN = {
  y: -.32, z: .02, pX: 1.48, sX: .04, cX: -.12, nX: -.2, hX: -.25, hY: 1.05, hZ: 0,
  rFx: -.075, lFx: .075, rFz: -.36, lFz: -.35, rFy: 0, lFy: 0, rFp: 1.45, lFp: 1.45, rFr: -.1, lFr: .1,
  rSX: -2.6, lSX: -2.5, rSZ: .55, lSZ: .5, rE: -1.0, lE: -1.1, rWX: 0, lWX: 0, bl: 1, mo: 3, br: .5, fR: .2, fL: .2,
 };
 act('fall', 1.3, [
  K(0), K(.14, { pX: .35, cX: .15, hX: .1, rSX: -1.2, lSX: -1.2, rE: -.3, lE: -.3, rFz: .08, lFz: -.12, lFp: .5, mo: 3, br: .7, y: -.03 }),
  K(.34, { y: -.19, pX: .25, cX: .1, rFz: -.2, lFz: -.22, rFp: 1.45, lFp: 1.45, rSX: -.9, lSX: -.9, hX: .2, bl: .5 }),
  K(.58, { y: -.25, pX: .95, cX: .2, z: .03, rSX: -1.35, lSX: -1.35, rE: -.15, lE: -.15, hX: -.1 }),
  K(1, FALLEN),
 ], { hold: true });
 act('rise', 1.5, [
  K(0, FALLEN), K(.25, { y: -.27, pX: 1.0, cX: .15, rSX: -1.4, lSX: -1.4, rSZ: .2, lSZ: .2, rE: -.1, lE: -.1, hX: -.2, hY: 0, nX: 0, bl: 0, mo: 0 }),
  K(.5, { y: -.19, pX: .25, z: 0, cX: .05, rFz: -.2, lFz: -.22, rFp: 1.45, lFp: 1.45, rSX: -.4, lSX: -.4, hX: .05 }),
  K(.72, { y: -.12, pX: .2, rFz: .12, rFp: 0, lFz: -.15 }), K(.9, { y: 0, pX: .05, rFz: 0, lFz: 0, lFp: 0, rSX: .05, lSX: .05, br: 0 }), K(1, READY),
 ]);
 act('hurt', .6, [K(0), K(.2, { pX: -.22, cX: -.12, hX: -.25, rSX: -.5, lSX: -.5, rSZ: .4, lSZ: .4, rE: -.9, lE: -.9, bl: .7, mo: 3, br: .8, y: -.03 }), K(.5, { bl: .2 }), K(1, READY)], { interrupt: true, dash: bump(0, .45, -.8) });
 act('block', .45, [K(0), K(.3, { rSX: -1.6, lSX: -1.6, rSZ: -.4, lSZ: -.4, rE: -1.5, lE: -1.5, hX: .15, bl: .5, mo: 3 }), K(.7), K(1, READY)], { interrupt: true });

 // ---------- two-bone IK for the legs ----------
 const _S = new THREE.Vector3(), _E = new THREE.Vector3(), _Tt = new THREE.Vector3(), _Dd = new THREE.Vector3(), _Pp = new THREE.Vector3(), _B = new THREE.Vector3();
 const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _mm = new THREE.Matrix4();
 const _qp = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const restFix = (b) => new THREE.Quaternion().setFromUnitVectors(b.position.clone().normalize(), new THREE.Vector3(0, -1, 0));
 function ik2(b1, b2, L1, L2, Tg, pole, back, fix1, fix2) {
  b1.getWorldPosition(_S); b1.parent.getWorldQuaternion(_qp);
  _Dd.subVectors(Tg, _S); let d = _Dd.length(); _Dd.multiplyScalar(1 / (d || 1));
  d = cl(d, Math.abs(L1 - L2) + .02, L1 + L2 - 1e-4);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _Pp.copy(pole).addScaledVector(_Dd, -pole.dot(_Dd)); if (_Pp.lengthSq() < 1e-8) _Pp.set(0, 0, back ? 1 : -1); _Pp.normalize();
  _E.copy(_S).addScaledVector(_Dd, a).addScaledVector(_Pp, hh);
  _Tt.copy(_S).addScaledVector(_Dd, d);
  _Y.subVectors(_S, _E).normalize(); _B.subVectors(_Tt, _E).normalize();
  _Z.copy(_B).addScaledVector(_Y, -_B.dot(_Y)); if (_Z.lengthSq() < 1e-6) _Z.copy(_Pp).negate(); _Z.normalize(); if (back) _Z.negate();
  _X.crossVectors(_Y, _Z).normalize(); _Z.crossVectors(_X, _Y);
  _q1.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix1) _q1.multiply(fix1);
  _Y.subVectors(_E, _Tt).normalize(); _Z.crossVectors(_X, _Y).normalize();
  _q2.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix2) _q2.multiply(fix2);
  b1.quaternion.copy(_qp).invert().multiply(_q1);
  b2.quaternion.copy(_q1).invert().multiply(_q2);
  return _q2;
 }
 const legFix = legs.map((h, i) => [restFix(knees[i]), restFix(ankles[i])]);
 const LT = knees[0].position.length(), LS = ankles[0].position.length(), ANK = .05, TOE = .074;

 // ---------- secondary motion: spring chains on 1/120 s substeps, with body colliders ----------
 const DOWN = new THREE.Vector3(0, -1, 0), PH = 1 / 120;
 const COL = []; for (let i = 0; i < 11; i++) COL.push({ a: new THREE.Vector3(), b: new THREE.Vector3(), r: 0, seg: false });
 function updateColliders() {
  chest.localToWorld(COL[0].a.set(0, .04, -.004)); COL[0].r = .112;
  spine.localToWorld(COL[1].a.set(0, 0, -.004)); COL[1].r = .102;
  pelvis.localToWorld(COL[2].a.set(0, -.02, -.004)); COL[2].r = .112;
  for (let i = 0; i < 2; i++) {
   legs[i].getWorldPosition(COL[3 + i].a); knees[i].getWorldPosition(COL[3 + i].b); COL[3 + i].r = .052; COL[3 + i].seg = true;
   knees[i].getWorldPosition(COL[5 + i].a); ankles[i].getWorldPosition(COL[5 + i].b); COL[5 + i].r = .045; COL[5 + i].seg = true;
   arms[i].getWorldPosition(COL[7 + i].a); elbows[i].getWorldPosition(COL[7 + i].b); COL[7 + i].r = .046; COL[7 + i].seg = true;
  }
  head.localToWorld(COL[9].a.set(HC[0] - HW[0], HC[1] - HW[1], HC[2] - HW[2])); COL[9].r = .185;
  head.localToWorld(COL[10].a.set(HC[0] - HW[0], HC[1] - HW[1] - .04, HC[2] - HW[2] + .05)); COL[10].r = .165;
 }
 const _ca = new THREE.Vector3(), _cb = new THREE.Vector3();
 function collide(p, v, ids, m, SC) {
  for (const k of ids) {
   const c = COL[k];
   if (c.seg) { _cb.subVectors(c.b, c.a); const t = cl(_ca.subVectors(p, c.a).dot(_cb) / Math.max(1e-8, _cb.lengthSq()), 0, 1); _ca.copy(c.a).addScaledVector(_cb, t); } else _ca.copy(c.a);
   _cb.subVectors(p, _ca); const d = _cb.length(), R = (c.r + m) * SC;
   if (d < R) { if (d < 1e-6) _cb.set(0, 0, -1); else _cb.multiplyScalar(1 / d); p.copy(_ca).addScaledVector(_cb, R); const vn = v.dot(_cb); if (vn < 0) v.addScaledVector(_cb, -vn); }
  }
 }
 function chain(bs, tip, o) {
  const offs = bs.slice(1).map((b) => b.position.clone()); offs.push(tip.clone());
  return Object.assign({ bs, offs, L: offs.map((v) => v.length()), p: offs.map(() => new THREE.Vector3()), v: offs.map(() => new THREE.Vector3()), T: offs.map(() => new THREE.Vector3()), rest: bs.map((b) => b.quaternion.clone()), K: 40, C: 5, gk: .3, cols: [], m: .02, breeze: 0, drag: 0, init: false }, o);
 }
 const CHAINS = [
  ...bobB.map((bb, i) => chain(bb, new THREE.Vector3(Math.sin(BOB[i]) * .01, -.07, Math.cos(BOB[i]) * .01), { K: 80, C: 9, gk: .12, cols: [9, 10, 0], m: .02, breeze: .003, drag: .1, maxA: .45 })),
  ...frameB.map((bb) => chain(bb, new THREE.Vector3(0, -.07, .006), { K: 70, C: 8, gk: .2, cols: [9, 10, 0], m: .016, breeze: .003, drag: .1, maxA: .4 })),
  chain(tuftB, new THREE.Vector3(-.006, .012, .028), { K: 70, C: 4, gk: 0, breeze: .002, maxA: .6 }),
  chain(scfF, new THREE.Vector3(0, -.07, .004), { K: 34, C: 4, gk: .55, cols: [0, 1, 2, 3, 4], m: .016, breeze: .005, drag: .5 }),
  chain(scfB, new THREE.Vector3(0, -.07, -.02), { K: 24, C: 3, gk: .45, cols: [0, 1, 2, 3, 4], m: .016, breeze: .012, drag: 1.3 }),
  ...skirt.map((b, i) => chain([b], new THREE.Vector3(Math.sin(SKAZ[i]) * .035, -.2, Math.cos(SKAZ[i]) * .03), { K: 90, C: 9, gk: .25, cols: [3, 4, 5, 6], m: .012, drag: .1, maxA: .35 })),
 ];
 const _ct = new THREE.Vector3(), _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cw = new THREE.Vector3(), _cj = new THREE.Vector3(), BACK = new THREE.Vector3();
 function physics(t, dt, reset, windK) {
  updateColliders();
  const SC = root.scale.x || 1; // lengths and radii are hers; the chains move in the world
  BACK.set(0, .25, -1).applyQuaternion(root.getWorldQuaternion(_cq)).normalize();
  let ci = 0;
  for (const ch of CHAINS) {
   ci++;
   ch.bs[0].getWorldPosition(_cj);
   for (let i = 0; i < ch.bs.length; i++) {
    ch.bs[i].getWorldQuaternion(_cq); _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize().lerp(DOWN, ch.gk);
    if (ch.drag) _cv.addScaledVector(BACK, ch.drag * windK * (i + 1) / ch.bs.length);
    if (ch.breeze) { const bz = ch.breeze * (1 + 4 * windK); _cv.x += bz * Math.sin(t * 1.7 + ci * .9 + i); _cv.z += bz * .7 * Math.sin(t * 1.1 + ci * 1.7 + i * .5); _cv.y += bz * .5 * Math.sin(t * 2.3 + ci); }
    _cv.normalize(); ch.T[i].copy(_cj).addScaledVector(_cv, ch.L[i] * SC); _cj.copy(ch.T[i]);
   }
   if (!ch.init || reset) { for (let i = 0; i < ch.p.length; i++) { ch.p[i].copy(ch.T[i]); ch.v[i].set(0, 0, 0); } ch.init = true; }
  }
  if (dt > 0) {
   const n = Math.max(1, Math.ceil(dt / PH - 1e-6)), h = dt / n;
   for (const ch of CHAINS) {
    const p = ch.p, v = ch.v, Tg = ch.T, Kk = ch.K, C = ch.C;
    for (let s = 0; s < n; s++) {
     for (let i = 0; i < p.length; i++) { v[i].x += (Kk * (Tg[i].x - p[i].x) - C * v[i].x) * h; v[i].y += (Kk * (Tg[i].y - p[i].y) - C * v[i].y) * h; v[i].z += (Kk * (Tg[i].z - p[i].z) - C * v[i].z) * h; p[i].addScaledVector(v[i], h); }
     ch.bs[0].getWorldPosition(_cj);
     for (let i = 0; i < p.length; i++) {
      _cv.subVectors(p[i], _cj); const L = _cv.length() || 1; _cv.multiplyScalar(1 / L);
      if (ch.maxA) { // keep each segment within maxA of the direction it wants
       _cw.subVectors(Tg[i], i ? Tg[i - 1] : _ct.copy(_cj)).normalize(); const a = Math.acos(cl(_cv.dot(_cw), -1, 1));
       if (a > ch.maxA) { _cv.lerp(_cw, 1 - ch.maxA / a).normalize(); v[i].multiplyScalar(.6); }
      }
      p[i].copy(_cj).addScaledVector(_cv, ch.L[i] * SC); if (ch.cols.length) collide(p[i], v[i], ch.cols, ch.m, SC); _cj.copy(p[i]);
     }
    }
   }
  }
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) {
   const b = ch.bs[i]; b.getWorldPosition(_cj); b.getWorldQuaternion(_cq);
   _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize(); _cw.subVectors(ch.p[i], _cj).normalize();
   _cq2.setFromUnitVectors(_cv, _cw); _cq3.copy(_cq).invert().multiply(_cq2).multiply(_cq);
   b.quaternion.multiply(_cq3); b.updateMatrixWorld(true);
  }
 }

 // ---------- applying a pose: FK spine and arms, IK legs onto the foot targets ----------
 const qRoot = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _eu = new THREE.Euler(), _pole = new THREE.Vector3(), _tg = new THREE.Vector3();
 function applyPose(P) {
  pelvis.position.set(P.x, PEL + P.y, P.z); pelvis.rotation.set(P.pX, P.pY, P.pZ, 'YXZ');
  spine.rotation.set(P.sX, P.sY, P.sZ, 'YXZ'); chest.rotation.set(P.cX, P.cY, P.cZ, 'YXZ');
  neck.rotation.set(P.nX, P.nY, 0, 'YXZ'); head.rotation.set(P.hX, P.hY, P.hZ, 'YXZ');
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) ch.bs[i].quaternion.copy(ch.rest[i]);
  for (let i = 0; i < 2; i++) {
   const c = i ? 'l' : 'r', sd = i ? 1 : -1;
   arms[i].rotation.set(P[c + 'SX'], sd * P[c + 'SY'], sd * P[c + 'SZ']);
   elbows[i].rotation.set(P[c + 'E'], 0, 0);
   wrists[i].rotation.set(P[c + 'WX'], 0, sd * P[c + 'WZ']);
   const f = P[i ? 'fL' : 'fR'];
   fing[i].rotation.set(-.15 * f, 0, -sd * .85 * f); thumb[i].rotation.set(.15 * f, 0, -sd * .5 * f);
  }
  root.updateMatrixWorld(true); root.getWorldQuaternion(qRoot);
  for (let i = 0; i < 2; i++) {
   const c = i ? 'l' : 'r', fr = P[c + 'Fr'], fp = P[c + 'Fp'], up = Math.max(0, fp);
   _tg.set(P[c + 'Fx'], P[c + 'Fy'] + ANK * Math.cos(fp) + TOE * Math.sin(up), P[c + 'Fz'] - TOE * (1 - Math.cos(up)));
   root.localToWorld(_tg);
   _pole.set(Math.sin(fr) + (i ? .1 : -.1), 0, Math.cos(fr)).applyQuaternion(qRoot);
   const q2 = ik2(legs[i], knees[i], LT, LS, _tg, _pole, true, legFix[i][0], legFix[i][1]);
   _qa.setFromEuler(_eu.set(fp, fr, 0, 'YXZ')).premultiply(qRoot);
   ankles[i].quaternion.copy(q2).invert().multiply(_qa);
   toes[i].rotation.set(-up * .85, 0, 0);
  }
  root.updateMatrixWorld(true);
 }

 // ---------- base layer: idle with breath, the walk and run cycle ----------
 const PHK = 11, HALF = PI / PHK; // walk phase per meter; one step covers HALF meters
 const BP = {}, WP = {}, AP = {}, AP2 = {}, FIN = {}, SNAP = {};
 cp(FIN, READY); cp(SNAP, READY);
 function idlePose(t, out) {
  cp(out, READY); const b = Math.sin(t * 2.1);
  out.cX += .018 * b; out.y += .003 * Math.sin(t * 2.1 + 1); out.rSZ += .015 * b; out.lSZ += .015 * b;
  out.x = .006 * Math.sin(t * .55); out.pZ = .015 * Math.sin(t * .55); out.hY += .05 * Math.sin(t * .37); out.hZ = .02 * Math.sin(t * .29);
  return out;
 }
 function walkPose(phase, spd, out) {
  cp(out, READY);
  const run = sm(1.4, 2.4, spd), zs = [0, 0];
  for (let i = 0; i < 2; i++) {
   const ph = ((phase + (i ? PI : 0)) % TAU + TAU) % TAU, s = ph / PI, c = i ? 'l' : 'r';
   let z, y, p;
   if (s < 1) { z = lerp(HALF / 2, -HALF / 2, s); y = 0; p = .5 * sm(.7, 1, s); }
   else { const q = s - 1; z = lerp(-HALF / 2, HALF / 2, sm(0, 1, q)) * (1 + .4 * run); y = (.05 + .06 * run) * Math.sin(PI * q); p = lerp(.5, -.25, sm(0, .7, q)) * (1 - sm(.85, 1, q)); }
   zs[i] = z; out[c + 'Fx'] = i ? .062 : -.062; out[c + 'Fz'] = z; out[c + 'Fy'] = y; out[c + 'Fp'] = p; out[c + 'Fr'] = i ? .05 : -.05;
  }
  const sw = (zs[0] - zs[1]) / HALF;
  out.y = -.014 + .014 * Math.abs(Math.sin(phase)) - .025 * run;
  out.pX = .04 + .16 * run; out.cX = .02 + .05 * run; out.hX = -.04 - .1 * run;
  out.pY = .1 * sw; out.sY = -.04 * sw; out.cY = -.1 * sw; out.hY = .04 * sw; out.pZ = .03 * Math.cos(phase);
  out.rSX = .5 * sw * (1 + .7 * run); out.lSX = -.5 * sw * (1 + .7 * run); out.rSZ = .12; out.lSZ = .12;
  out.rE = -.25 - .25 * Math.max(0, -sw) - .9 * run; out.lE = -.25 - .25 * Math.max(0, sw) - .9 * run;
  out.fR = .4 + .4 * run; out.fL = .4 + .4 * run; out.mo = run > .5 ? 2 : 0;
  return out;
 }

 // ---------- per-frame update ----------
 const state = { wind: 0, gaze: null };
 const st = { init: false, px: 0, pz: 0, ry: 0, ph: 0, spd: 0 };
 let actv = null, dashV = 0, liftV = 0, fadeV = 1, rbT = 0, hold = false;
 let blinkIn = 1.8, blinkT = -1, lookT = 1.2, gzX = 0, gzY = 0, gzTX = 0, gzTY = 0, lkY = 0, lkP = 0, lkTY = 0, lkTP = 0;
 const _p1 = new THREE.Vector3();
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  root.updateMatrixWorld();
  const rx = root.position.x, rz = root.position.z, ry = root.rotation.y, sc = root.scale.x || 1;
  const jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) / sc > 1.2 || Math.abs(Math.atan2(Math.sin(ry - st.ry), Math.cos(ry - st.ry))) > .9;
  if (dt > 0 && st.init) st.spd += (Math.abs(phase - st.ph) / PHK / dt - st.spd) * Math.min(1, dt * 6);
  st.px = rx; st.pz = rz; st.ry = ry; st.ph = phase; st.init = true;
  walk = cl(walk || 0, 0, 1);
  idlePose(t, BP);
  if (walk > .001) mix(BP, walkPose(phase, st.spd, WP), walk);
  let u = 0, def = null, W = 0;
  if (actv) {
   actv.t += dt; def = actv.def; u = Math.min(1, actv.t / def.dur);
   if (u >= 1 && !def.hold) { actv = null; def = null; u = 0; }
  }
  if (def) {
   evalKeys(def, u, AP); if (def.post) def.post(u, AP, t);
   cp(AP2, SNAP); mix(AP2, AP, sm(0, actv.bi, actv.t));
   W = def.hold ? 1 : 1 - sm(def.dur - def.bo, def.dur, actv.t);
   cp(FIN, BP); mix(FIN, AP2, W);
  } else if (rbT > 0) { rbT -= dt; cp(FIN, SNAP); mix(FIN, BP, 1 - Math.max(0, rbT) / .2); } else cp(FIN, BP);
  dashV = def && def.dash ? def.dash(u) * W : 0;
  liftV = Math.max(0, FIN.y);
  // where she looks, on top of everything else
  const kk = 1 - Math.exp(-(dt || .016) * 7); lkY += (lkTY - lkY) * kk; lkP += (lkTP - lkP) * kk;
  FIN.nY += lkY * .35; FIN.hY += lkY * .65; FIN.hX += lkP;
  applyPose(FIN);
  FIN.nY -= lkY * .35; FIN.hY -= lkY * .65; FIN.hX -= lkP;
  if (opts.physics !== false) physics(t, dt, jump, cl((+state.wind || 0) + st.spd * .35 * walk, 0, 1.5));
  // face: blinks, gaze, brows, mouth shape
  if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2 + rnd() * 3.2; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const k = blinkT / .16; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) blinkT = -1; }
  lidMesh.morphTargetInfluences[0] = Math.max(bk, cl(FIN.bl, 0, 1));
  lidMesh.morphTargetInfluences[1] = cl(FIN.br, 0, 1);
  lookT -= dt; if (lookT <= 0) { lookT = .8 + rnd() * 2.4; gzTX = (rnd() - .5) * .12; gzTY = (rnd() - .5) * .06; }
  const gz = state.gaze, gx = gz ? cl(gz.x, -1, 1) * .16 : def ? 0 : gzTX, gy = gz ? cl(gz.y, -1, 1) * .1 : def ? 0 : gzTY;
  gzX += (gx - gzX) * Math.min(1, (dt || .016) * 18); gzY += (gy - gzY) * Math.min(1, (dt || .016) * 18);
  T.eye.offset.set(-gzX, -gzY);
  T.mouth.offset.x = cl(Math.round(FIN.mo), 0, 3) * .25;
  // the pole: out while a pose asks for it (tp), slid out by pe, and aimed at what she's lighting
  POLE.g.visible = FIN.tp > .5;
  if (POLE.g.visible) {
   POLE.g.quaternion.identity();
   POLE.g.updateWorldMatrix(true, true);
   const k = aimT && def && def.hits.length ? sm(.08, .3, u) * (1 - sm(.78, .92, u)) : 0;
   if (k > 0) { // turn the pole in her fist toward the target, and slide it out to just reach it
    POLE.axis.getWorldPosition(_p1); POLE.g.getWorldQuaternion(_qPa);
    _v.set(0, 1, 0).applyQuaternion(POLE.axis.quaternion).applyQuaternion(_qPa).normalize();
    _v2.copy(aimT).sub(_p1); const dist = _v2.length() / sc; _v2.normalize();
    POLE.angle = Math.acos(cl(_v.dot(_v2), -1, 1));
    _v2.lerp(_v, 1 - k).normalize(); _qPb.setFromUnitVectors(_v, _v2);
    POLE.g.quaternion.copy(_qPa).invert().multiply(_qPb).multiply(_qPa);
    POLE.want = cl(dist - POLE.base - POLE_TIP.y, .08, 1.15);
   } else if (!aimT) POLE.want = .62;
   POLE.len = .03 + cl(FIN.pe, 0, 1) * (POLE.want - .03);
   POLE.inner.scale.y = POLE.len; POLE.tip.position.y = POLE.base + POLE.len;
   POLE.g.updateWorldMatrix(true, true);
   _p1.copy(POLE_TIP).applyMatrix4(POLE.tip.matrixWorld);
   const lit = sm(.08, .25, cl(FIN.pe, 0, 1)), fl = .85 + .15 * Math.sin(t * 23) * Math.sin(t * 7.3);
   flame.position.copy(_p1); flame.position.y += .015 * sc; flame.scale.set(.04 * sc * fl, .062 * sc * fl, 1);
   flame.material.opacity = lit * fadeV; flameL.position.copy(_p1); flameL.intensity = .3 * lit * fl * fadeV; flameL.distance = 1.1 * sc;
  } else { flame.material.opacity = 0; flameL.intensity = 0; }
 }

 // ---------- public interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && !force && !def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  cp(SNAP, FIN); actv = { name, def, t: 0, bi: def.bi }; rbT = 0; return true;
 }
 const faceMats = [M.eye, M.lid, M.mouth], fadeMats = [...new Set(skinned.map((m) => m.material).concat(faceMats, [M.brass, inkMat]))], fadeT = fadeMats.map((m) => m.transparent);
 function setFade(f) {
  f = cl(+f, 0, 1); if (Math.abs(f - fadeV) < 1e-4) return;
  const was = fadeV < .999, now = f < .999; fadeV = f;
  fadeMats.forEach((m, i) => { m.transparent = now || fadeT[i]; m.opacity = f; if (was !== now) m.needsUpdate = true; });
  root.visible = f > .002;
 }
 for (const m of [M.eye, M.lid, M.brass]) m.clippingPlanes = [FILL];
 const ANC = { chest: [chest, new THREE.Vector3(0, .05, .1)], head: [head, new THREE.Vector3(0, .2, .02)], hit: [wrists[0], new THREE.Vector3(0, -.06, .01)], hand: [wrists[0], new THREE.Vector3(0, -.06, .01)] };
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  if (name === 'flame') { POLE.tip.updateWorldMatrix(true, false); return out.copy(POLE_TIP).applyMatrix4(POLE.tip.matrixWorld); }
  const a = ANC[name] || ANC.chest; a[0].updateWorldMatrix(true, false); return a[0].localToWorld(out.copy(a[1]));
 }
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (o.material.map) texs.add(o.material.map.image); } });
 fx.traverse((o) => { if (o.isSprite) draws++; });
 animate(0, 0, 0, 0);
 return {
  root, fx, skeleton, bones, animate, play, PHASE_PER_M: PHK,
  aim(p) { aimT = p ? (aimT || new THREE.Vector3()).copy(p) : null; }, get pole() { return { len: POLE.len, angle: POLE.angle || 0, out: POLE.g.visible }; },
  guard() {}, reset() { cp(SNAP, FIN); actv = null; rbT = .2; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade, anchor, ACTIONS,
  look(yaw, pitch) { lkTY = yaw || 0; lkTP = pitch || 0; },
  setReveal(fill, line) { FILL.constant = fill; LINE.constant = line; },
  setOutline(w) { INK.value = w; },
  stats: { triangles: Math.round(tri), bones: bones.length, drawCalls: draws, textures: texs.size },
 };
}

