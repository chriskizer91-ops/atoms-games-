// Step 3 of the port. Bakes each person for the raft game: runs the reference kit in headless Chromium at a quarter of
// the triangles, folds the parts into a few meshes (painted cloth, flat-coloured parts, hands, face), packs them small
// and writes src/people/folk/<id>.js with the pictures they wear.
const path = require('path'), fs = require('fs');

const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
// floats -> 16 bits each, between the smallest and largest value of each component
function q16(arr, k) {
  const n = arr.length / k, lo = Array(k).fill(Infinity), hi = Array(k).fill(-Infinity), out = new Uint16Array(arr.length);
  for (let i = 0; i < arr.length; i++) { const c = i % k; lo[c] = Math.min(lo[c], arr[i]); hi[c] = Math.max(hi[c], arr[i]); }
  for (let i = 0; i < arr.length; i++) { const c = i % k, d = hi[c] - lo[c]; out[i] = d > 0 ? Math.round((arr[i] - lo[c]) / d * 65535) : 0; }
  return { k, lo: lo.map((v) => +v.toFixed(6)), hi: hi.map((v) => +v.toFixed(6)), d: b64(out) };
}
const n8 = (arr) => { const o = new Int8Array(arr.length); for (let i = 0; i < arr.length; i++) o[i] = Math.max(-127, Math.min(127, Math.round(arr[i] * 127))); return b64(o); };
// four weights that add up to exactly 255, so nothing shrinks
function w8(sw) {
  const o = new Uint8Array(sw.length);
  for (let i = 0; i < sw.length; i += 4) {
    const w = [sw[i], sw[i + 1], sw[i + 2], sw[i + 3]], s = w[0] + w[1] + w[2] + w[3] || 1, f = w.map((v) => v / s * 255), r = f.map(Math.floor); let left = 255 - r.reduce((a, b) => a + b, 0);
    const order = [0, 1, 2, 3].sort((a, b) => (f[b] - r[b]) - (f[a] - r[a])); for (let j = 0; left > 0; j++, left--) r[order[j % 4]]++;
    for (let j = 0; j < 4; j++) o[i + j] = r[j];
  }
  return b64(o);
}
const rgb = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function pack(B) {
  const P = { n: B.pos.length / 3, tris: B.idx.length / 3, pos: q16(B.pos, 3), nor: n8(B.nor), si: b64(Uint8Array.from(B.si)), sw: w8(B.sw), idx: b64(Uint16Array.from(B.idx)) };
  if (P.n > 65535) throw new Error('too many points');
  for (const k of ['uv', 'uvB', 'uvSide', 'faceMix']) if (B[k]) P[k] = q16(B[k], k === 'faceMix' ? 3 : 2);
  if (B.col) P.col = b64(Uint8Array.from(B.col));
  if (B.rough) P.rough = b64(Uint8Array.from(B.rough.map((v) => Math.round(v * 255))));
  return P;
}

module.exports = async function bake({ work, people, ids, esbuild, chromium, nodePaths }) {
  const PEOPLE = people;
  fs.copyFileSync(path.join(__dirname, 'bake-page.js'), path.join(work, 'bake-page.js'));
  const js = esbuild.buildSync({ entryPoints: [path.join(work, 'bake-page.js')], bundle: true, format: 'iife', target: 'es2020', write: false, logLevel: 'warning', nodePaths }).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = path.join(work, 'bake.html'); fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><script>${js}</script>`);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + html); await page.waitForFunction(() => window.__bake);
  for (const id of ids) {
    const D = await page.evaluate((id) => window.__bake(id, 'quarter'), id);
    if (D.errors.length) throw new Error(id + ': ' + D.errors.join('; '));
    const cloth = { pos: [], nor: [], uv: [], uvB: [], rough: [], si: [], sw: [], idx: [] }, flat = { pos: [], nor: [], col: [], rough: [], si: [], sw: [], idx: [] }, out = {}, notes = [];
    let maxBone = 0;
    for (const M of D.meshes) {
      const A = M.attrs, n = A.position.array.length / 3; if (!M.visible) throw new Error('hidden mesh ' + M.key);
      for (const v of A.skinIndex.array) maxBone = Math.max(maxBone, v);
      notes.push(`${M.key}${M.bake ? ':' + M.bake.kind : ''} ${M.index.length / 3}`);
      if (!M.bake) {                                             // face, hands: as the kit made them
        const B = { pos: A.position.array, nor: A.normal.array, uv: A.uv.array, si: A.skinIndex.array, sw: A.skinWeight.array, idx: M.index };
        if (A.faceMix) { B.faceMix = A.faceMix.array; B.uvSide = A.uvSide.array; }
        if (!['face', 'hand'].includes(M.key)) throw new Error('a part the rig has no material for: ' + M.key);
        out[M.key] = pack(B); continue;
      }
      const K = M.bake, T = K.kind === 'flat' ? flat : cloth, base = T.pos.length / 3, mv = K.move || [0, 0, 0], sz = K.size || [1, 1, 1], mid = K.mid || [0, 0, 0], c = K.flat ? rgb(K.flat) : null;
      for (let i = 0; i < n; i++) {
        const p = [A.position.array[i * 3], A.position.array[i * 3 + 1], A.position.array[i * 3 + 2]];
        for (let a = 0; a < 3; a++) T.pos.push((p[a] - mid[a]) * (sz[a] || 1) + mid[a] + (mv[a] || 0));      // a part moved by the skin fitter (a hat pulled down)
        T.nor.push(A.normal.array[i * 3], A.normal.array[i * 3 + 1], A.normal.array[i * 3 + 2]);
        T.rough.push(K.rough);
        if (c) T.col.push(c[0], c[1], c[2]);
        else {                                                    // where this point reads the body sheet, front figure and back figure (person-kit.js painted())
          const gx = (p[0] + 0.75) / 1.5, gy = (p[1] + 0.1) / 2.0, F = D.front, Bk = D.back, cl = (v) => Math.max(0, Math.min(1, v));
          T.uv.push(cl(gx * F[0] + F[2]), cl(gy * F[1] + F[3])); T.uvB.push(cl((1 - gx) * Bk[0] + Bk[2]), cl(gy * Bk[1] + Bk[3]));
        }
      }
      for (const v of A.skinIndex.array) T.si.push(v); for (const v of A.skinWeight.array) T.sw.push(v);
      for (const v of M.index) T.idx.push(v + base);
    }
    out.cloth = pack(cloth); if (flat.idx.length) out.flat = pack(flat);
    if (maxBone > 51) throw new Error(id + ' hangs on a bone the rig does not have (bone ' + maxBone + ')');      // the rig keeps the 52 body bones, which come first
    const tris = Object.values(out).reduce((a, m) => a + m.tris, 0);
    console.log(id, 'triangles', tris, 'bones used up to', maxBone, 'of', D.bones.length, '|', notes.join(', '));
    const data = { id: D.id, name: D.name, who: D.who, triangles: tris, scale: D.scale, headScale: D.headScale, skin: D.skin, jaw: D.jaw, seam: D.seam, maxBone, meshes: out, tex: D.tex };
    const text = `// GENERATED by src/people/port/bake.js from Moon Faire's "${D.name}" (game/people/npc): the quarter-weight build of the person,\n// baked: a few skinned meshes packed as 16-bit numbers, and the pictures they wear. Do not edit by hand.\nexport default ${JSON.stringify(data)};\n`;
    fs.mkdirSync(path.join(PEOPLE, 'folk'), { recursive: true }); fs.writeFileSync(path.join(PEOPLE, 'folk', id + '.js'), text);
    console.log('  wrote folk/' + id + '.js', (text.length / 1024).toFixed(0) + ' KB; pictures: ' + Object.entries(D.tex).map(([k, v]) => k + ' ' + (v.length / 1024).toFixed(0)).join(', ') + ' KB');
  }
  await browser.close();
  if (errs.length) throw new Error('the bake page complained:\n' + [...new Set(errs)].join('\n'));
};
