// Step 1 of the port. Wraps Moon Faire's people kit (three r128, global scripts) as ES modules for three r186, changed
// only where r186 demands it: the REFERENCE build. It is not shipped. bake.js runs it once in a browser to bake each
// person, and compare.js checks the shipped rig against it. Writes <out>/kit/* and <out>/folk/*.
const fs = require('fs'), path = require('path'), vm = require('vm');

module.exports = function wrap(MF, OUT, ids) {
  const rd = (p) => fs.readFileSync(path.join(MF, p), 'utf8');
  const wr = (p, s) => { fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true }); fs.writeFileSync(path.join(OUT, p), s); };
  function rep(src, from, to, n) {
    const parts = src.split(from), want = n == null ? 1 : n;
    if (parts.length - 1 !== want) throw new Error('expected ' + want + ' of ' + JSON.stringify(from.slice(0, 80)) + ', found ' + (parts.length - 1));
    return parts.join(to);
  }
  const HEAD = (what) => `// Moon Faire's ${what}, wrapped as an ES module for three r186 by src/people/port/wrap.js (the reference build).\n`;

  // ---------------- jester_kit.js ----------------
  let k = rd('models/jester/jester_kit.js');
  k = rep(k, 'function makeJester(opts) {\n  \'use strict\';', 'export function makeJester(opts) {');
  // colour management: r186 converts sRGB hex colours to the linear working space itself
  k = rep(k, 'if (srgb !== false) t.encoding = THREE.sRGBEncoding;', 'if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;');
  k = rep(k, 'const lin = (c) => new THREE.Color(c).convertSRGBToLinear();', 'const lin = (c) => new THREE.Color(c);');
  k = rep(k, "(typeof window !== 'undefined' ? window.JESTER_TEX : null)", 'null');
  k = rep(k, 'Object.assign({ skinning: true }, o)', 'o', 2);
  // the face shader: textures are decoded by their colour space now, and the uv varying was renamed
  k = rep(k, 'vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );', 'vec4 texelColor = texture2D( map, vMapUv );');
  k = rep(k, 'vec3 sideCol = mapTexelToLinear( texture2D( uSide, vUvSide ) ).rgb;', 'vec3 sideCol = texture2D( uSide, vUvSide ).rgb;');
  k = rep(k, "ta = bakedTex('faceSideA', 420, 540, '#000000'), first = m.onBeforeCompile;", "ta = bakedTex('faceSideA', 420, 540, '#000000'), first = m.onBeforeCompile; ta.colorSpace = THREE.NoColorSpace;      // a mask, not a colour");
  // pictures decode asynchronously: let the host wait for them
  k = rep(k, "e.img.onload = () => { e.ok = true; const l = e.cbs; e.cbs = []; l.forEach((f) => f(e.img)); }; e.img.src = url; }",
    "LOADING.push(new Promise((done) => { e.img.onload = () => { e.ok = true; const l = e.cbs; e.cbs = []; l.forEach((f) => f(e.img)); done(); }; e.img.onerror = done; })); e.img.src = url; }");
  k = rep(k, 'const bakedImgs = {},', 'const LOADING = [], bakedImgs = {},');
  // a hook between the base layer (idle, walk, run) and the one-shot action laid over it: the host can carry a tool or hold a tiller
  k = rep(k, "    if (pending && !stance && !stanceTo) { const n = pending; pending = ''; play(n, true); }\n    let P = base; spinNow = 0;",
    "    if (pending && !stance && !stanceTo) { const n = pending; pending = ''; play(n, true); }\n    if (opts.onBase) opts.onBase(base, t, dt);\n    let P = base; spinNow = 0;");
  k = rep(k, '    root, fx, skeleton, bones, animate, play,', '    root, fx, skeleton, bones, animate, play, loading: LOADING,');
  wr('kit/jester_kit.js', HEAD('game/models/jester/jester_kit.js') + "import * as THREE from 'three';\n\n" + k);

  // ---------------- meshopt simplifier ----------------
  let m = rd('models/jester/meshopt_simplifier.js');
  m = rep(m, 'var MeshoptSimplifier = (function () {', 'export const MeshoptSimplifier = (function () {');
  m = rep(m, 'window.MeshoptSimplifier = MeshoptSimplifier;\n', '');
  wr('kit/meshopt_simplifier.js', m);

  // ---------------- lod.js ----------------
  let l = rd('models/jester/lod.js');
  l = rep(l, "(function () {\n  'use strict';\n", '');
  l = rep(l, 'const S = window.MeshoptSimplifier; if (!S || !S.supported || window.WITCH_LOD.thin === false || ratio >= 1) return;', 'const S = MeshoptSimplifier; if (!S || !S.supported || ratio >= 1) return;');
  l = rep(l, "  window.WITCH_LOD = { LEVELS, hooks, simplify, make(level, extra) { const L = typeof level === 'string' ? LEVELS.find((x) => x.id === level) : level; const o = Object.assign({}, L.opts, extra || {}); if (L.lod) o.lod = hooks(L.lod); return makeJester(o); } };\n})();",
    'export const WITCH_LOD = { LEVELS, hooks, simplify };');
  wr('kit/lod.js', HEAD('game/models/jester/lod.js') + "import * as THREE from 'three';\nimport { MeshoptSimplifier } from './meshopt_simplifier.js';\n\n" + l);

  // ---------------- person-kit.js ----------------
  let p = rd('people/kit/person-kit.js');
  p = rep(p, "(function () {\n  'use strict';\n", '');
  p = rep(p, 'const T = window.JESTER_TEX, t = tone(person.skin), [plain, side, hands] = await Promise.all([load(window.MF_FACE_PLAIN), load(T.faceSide), load(T.hands)]);',
    "const T = JESTER_TEX, t = tone(person.skin), [plain, side, hands] = await Promise.all([load(person.facePlain), load(T.faceSide), load(T.hands)]);      // a person without a painted skin: not used here");
  p = rep(p, 'const T = window.JESTER_TEX, S = skin.SKIN', 'const T = JESTER_TEX, S = skin.SKIN');
  p = rep(p, 'const tex = new THREE.Texture(body); tex.encoding = THREE.sRGBEncoding;', 'const tex = new THREE.Texture(body); tex.colorSpace = THREE.SRGBColorSpace;');
  p = rep(p, 'vec3 cF = mapTexelToLinear( texture2D( map, vec2( fP.x * 0.5, fP.y ) ) ).rgb;', 'vec3 cF = texture2D( map, vec2( fP.x * 0.5, fP.y ) ).rgb;');
  p = rep(p, 'vec3 cB = mapTexelToLinear( texture2D( map, vec2( 0.5 + bP.x * 0.5, bP.y ) ) ).rgb;', 'vec3 cB = texture2D( map, vec2( 0.5 + bP.x * 0.5, bP.y ) ).rgb;');
  p = rep(p, 'const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;', 'const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;');
  p = rep(p, 'const WL = window.WITCH_LOD,', 'const WL = WITCH_LOD,');
  // tell the baker what each part is made of
  p = rep(p, "painted(K, prepared, ro), mv = S.move && S.move[nm], sz = S.size && S.size[nm];", "painted(K, prepared, ro), mv = S.move && S.move[nm], sz = S.size && S.size[nm];\n        mt.userData.bake = { kind: fl ? 'flat' : 'painted', part: nm, flat: fl || null, rough: fl ? (ro == null ? 0.8 : ro) : (ro == null ? 0.86 : ro), move: mv || null, size: sz || null, mid: mv || sz ? middle(B.pos) : null };");
  p = rep(p, 'return { faceError: \'\', faceCanvas: fc, bodyTex: tex, skin, S,', 'return { faceError: \'\', faceCanvas: fc, bodyTex: tex, skin, S, hexSkin, jaw,');
  p = rep(p, "const fc = canvas(1024, 1024), g = fc.getContext('2d'), a = skin.faceFit", "const fc = canvas(1024, 1024), g = fc.getContext('2d', { willReadFrequently: true }), a = skin.faceFit");
  p = rep(p, 'const J = window.makeJester(o);', 'const J = makeJester(o);');
  p = rep(p, '  window.MF_PERSON = { prepare, make, LAND, BODY, HERS };\n})();', 'export const MF_PERSON = { prepare, make, LAND, BODY, HERS };');
  wr('kit/person-kit.js', HEAD('game/people/kit/person-kit.js') + "import * as THREE from 'three';\nimport { makeJester } from './jester_kit.js';\nimport { WITCH_LOD } from './lod.js';\nimport { JESTER_TEX } from './tex.js';\n\n" + p);

  const load = (p) => { const w = {}; vm.runInNewContext(rd(p), { window: w }); return w; };
  // her paintings: only what a person made from her still shows (hands, the profile of the head) and the numbers that place the face
  const T = load('models/jester/jester_tex.js').JESTER_TEX;
  const keep = {}; for (const k of ['skin', 'skinJaw', 'layout', 'faceEyes', 'faceSideWin', 'hands', 'faceSide', 'faceSideA', 'body']) keep[k] = T[k];
  wr('kit/tex.js', '// GENERATED from Moon Faire game/models/jester/jester_tex.js: the template\'s hands and head profile paintings.\nexport const JESTER_TEX = ' + JSON.stringify(keep) + ';\n');
  // the people
  const src = rd('people/npc/npcs.js'), NT = load('people/npc/npc_tex.js').MF_NPC_TEX;
  const W = load('people/npc/npcs.js').MF_NPCS;
  for (const id of ids) {
    const a = src.indexOf('  ' + JSON.stringify(id) + ': {'); if (a < 0) throw new Error('no ' + id);
    let b = src.indexOf('return PERSON; } }', a); b += 'return PERSON; } }'.length;
    const body = src.slice(a + ('  ' + JSON.stringify(id) + ': ').length, b), D = W.people[id];
    wr('folk/' + id + '.js', '// GENERATED from Moon Faire game/people/npc/npcs.js and npc_tex.js: one painted person (shapes, skin fit, body sheet and face).\nexport default Object.assign(' + body + ',\n  { weights: ' + JSON.stringify(W.weights[D.shapeId]) + ',\n    tex: ' + JSON.stringify(NT[D.skin]) + ' });\n');
  }
};
