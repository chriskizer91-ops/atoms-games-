// kit.js: the shared 3D kit for Creature Catch 3D: geometry helpers (as in wren-model.js), the toon look with a cool rim
// and ink outlines (back faces pushed out along their normals), and a small part builder that merges pieces per material.
// three.js r128 (global THREE). Everything the creatures, the cube, the props and the places are built from.
const KIT = (() => {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const _v = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
  const rgb = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

  // ---------- materials ----------
  const ramp = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255, 196, 196, 196, 255, 242, 242, 242, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const RIM = { c: { value: new THREE.Color('#9fb4ff') }, k: { value: .16 } };
  const INK = { value: .008 };
  // see-through: scenery nearer the camera than the player, in a circle round them on screen, is cut away (dithered)
  const SEE = { uSee: { value: new THREE.Vector3(0, 0, 0) }, uSeeZ: { value: 1 } };
  const SEEFN = 'if (uSee.z > 0.0 && gl_FragCoord.z < uSeeZ) { float sr = length(gl_FragCoord.xy - uSee.xy) / uSee.z, dm = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 2.0, 4.0) / 4.0; if (sr + dm * 0.22 < 1.0) discard; }';
  const WIND = { uT: { value: 0 } };
  function toon(color, o) {
    o = o || {};
    const m = new THREE.MeshToonMaterial(Object.assign({ color: color || '#ffffff', gradientMap: ramp }, o.mat || {}));
    if (o.vc) m.vertexColors = true;
    const see = !!o.see, sway = o.sway || 0;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRimC = RIM.c; sh.uniforms.uRimK = RIM.k; Object.assign(sh.uniforms, SEE, WIND);
      sh.fragmentShader = 'uniform vec3 uRimC;\nuniform float uRimK;\nuniform vec3 uSee;\nuniform float uSeeZ;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (see ? SEEFN : ''))
        .replace('#include <dithering_fragment>', 'float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uRimC * uRimK * smoothstep(0.55, 0.85, rimF);\n#include <dithering_fragment>');
      if (sway) sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec4 wp = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\n float k = max(0.0, transformed.y - ' + sway.toFixed(1) + ') * 0.045; transformed.x += sin(uT * 1.6 + wp.x * 0.05 + wp.z * 0.03) * k; transformed.z += cos(uT * 1.3 + wp.z * 0.05) * k * 0.6; }');
    };
    m.customProgramCacheKey = () => 'cc-toon' + (see ? '-see' : '') + (sway ? '-sway' + sway : '');
    return m;
  }
  function inkMat(o) {
    o = o || {};
    const m = new THREE.MeshBasicMaterial({ color: o.color || '#1d1b2c', side: THREE.BackSide });
    const see = !!o.see, sway = o.sway || 0, k = o.k === undefined ? 1 : o.k;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uInk = INK; Object.assign(sh.uniforms, SEE, WIND);
      sh.vertexShader = 'uniform float uInk;\nuniform float uT;\nattribute float inkw;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        (sway ? '{ vec4 wp = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\n float kk = max(0.0, transformed.y - ' + sway.toFixed(1) + ') * 0.045; transformed.x += sin(uT * 1.6 + wp.x * 0.05 + wp.z * 0.03) * kk; transformed.z += cos(uT * 1.3 + wp.z * 0.05) * kk * 0.6; }\n' : '') +
        'transformed += normal * uInk * inkw * ' + k.toFixed(3) + ';');
      sh.fragmentShader = 'uniform vec3 uSee;\nuniform float uSeeZ;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (see ? SEEFN : ''));
    };
    m.customProgramCacheKey = () => 'cc-ink' + (see ? '-see' : '') + (sway ? '-sway' + sway : '') + k;
    return m;
  }

  // ---------- geometry helpers ----------
  function mkGeo(P, U, I) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setIndex(I); g.computeVertexNormals(); return g;
  }
  function surf(nu, nv, f, wrap, flip) {
    const P = [], U = [], I = [], o = [0, 0, 0];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); P.push(o[0], o[1], o[2]); U.push(u, 1 - v); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); }
    const g = mkGeo(P, U, I);
    if (wrap) { const n = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu; _v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize(); n.setXYZ(a, _v.x, _v.y, _v.z); n.setXYZ(b, _v.x, _v.y, _v.z); } }
    return g;
  }
  // a solid of revolution from a profile [[r, y], ...] listed top to bottom; angle 0 faces +Z; o: sx, sz, cx, cz, fn(out, a, v, r)
  function lathe(prof, segs, o) {
    o = o || {};
    const n = prof.length - 1, out = [0, 0, 0];
    return surf(segs, n * (o.sub || 1), (u, v, p) => {
      const k = v * n, i = Math.min(n - 1, Math.floor(k)), f = k - i;
      const r = lerp(prof[i][0], prof[i + 1][0], o.lin ? f : f * f * (3 - 2 * f)), y = lerp(prof[i][1], prof[i + 1][1], f), a = lerp(-PI, PI, u);
      out[0] = (o.cx || 0) + Math.sin(a) * r * (o.sx || 1); out[1] = y; out[2] = (o.cz || 0) + Math.cos(a) * r * (o.sz || 1);
      if (o.fn) o.fn(out, a, v, r);
      p[0] = out[0]; p[1] = out[1]; p[2] = out[2];
    }, true, o.flip);
  }
  // a tube along a Catmull-Rom curve through pts; rFn(t) its radius; flat squashes the side facing upFn (default +Z)
  function tube(pts, ns, nr, rFn, flat, upFn, closed) {
    const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), !!closed);
    const P = [], U = [], I = [];
    flat = flat === undefined ? 1 : flat;
    for (let i = 0; i <= ns; i++) {
      const t = i / ns; cv.getPointAt(t, _c); cv.getTangentAt(t, _t);
      if (upFn) upFn(_c, _n, t); else _n.set(0, 0, 1);
      _n.addScaledVector(_t, -_n.dot(_t)); if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x); _n.normalize();
      _b.crossVectors(_t, _n).normalize();
      const r = rFn(t);
      for (let j = 0; j <= nr; j++) { const a = j / nr * TAU, ca = Math.cos(a), sa = Math.sin(a); P.push(_c.x + (_n.x * ca * flat + _b.x * sa) * r, _c.y + (_n.y * ca * flat + _b.y * sa) * r, _c.z + (_n.z * ca * flat + _b.z * sa) * r); U.push(t, j / nr); }
    }
    for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + 1, c = a + nr + 1, d = c + 1; I.push(a, b, c, b, d, c); }
    const g = mkGeo(P, U, I), nm = g.attributes.normal;
    for (let i = 0; i <= ns; i++) { const a = i * (nr + 1), b = a + nr; _v.set(nm.getX(a) + nm.getX(b), nm.getY(a) + nm.getY(b), nm.getZ(a) + nm.getZ(b)).normalize(); nm.setXYZ(a, _v.x, _v.y, _v.z); nm.setXYZ(b, _v.x, _v.y, _v.z); }
    return g;
  }
  // a box with rounded edges and corners (r), soft normals
  function rbox(w, h, d, r, seg) {
    seg = seg || 4;
    const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2), p = g.attributes.position, q = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i);
      q.set(Math.sign(_v.x) * Math.max(0, Math.abs(_v.x) - (w / 2 - r)), Math.sign(_v.y) * Math.max(0, Math.abs(_v.y) - (h / 2 - r)), Math.sign(_v.z) * Math.max(0, Math.abs(_v.z) - (d / 2 - r)));
      const c = _v.clone().sub(q); if (q.lengthSq() > 0) { q.normalize().multiplyScalar(r); p.setXYZ(i, c.x + q.x, c.y + q.y, c.z + q.z); }
    }
    g.deleteAttribute('normal'); const m = mergeVerts(g); m.computeVertexNormals(); return m;
  }
  // welds vertices at the same place (so a box's faces share soft normals)
  function mergeVerts(g) {
    const p = g.attributes.position, uv = g.attributes.uv, map = new Map(), P = [], U = [], I = [], idx = [];
    for (let i = 0; i < p.count; i++) {
      const k = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      let j = map.get(k); if (j === undefined) { j = P.length / 3; map.set(k, j); P.push(p.getX(i), p.getY(i), p.getZ(i)); U.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0); }
      idx.push(j);
    }
    const src = g.index ? g.index.array : [...Array(p.count).keys()];
    for (let k = 0; k < src.length; k++) I.push(idx[src[k]]);
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); o.setIndex(I); return o;
  }
  // a sphere pushed in and out a little: leaves, moss, bushes
  const ICO = new THREE.SphereGeometry(1, 11, 8);
  function lumpy(r, k, amt) {
    const g = ICO.clone(), p = g.attributes.position; amt = amt === undefined ? .14 : amt;
    for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i); const s = 1 + amt * Math.sin(_v.x * 5 + k) * Math.sin(_v.y * 4 + k * 2) * Math.sin(_v.z * 5 + k * 3); p.setXYZ(i, _v.x * r * s, _v.y * r * s, _v.z * r * s); }
    g.computeVertexNormals(); return g;
  }
  // a flat shape (points in x, y) given thickness, centred on z = 0, with rounded-ish edges from the bevel
  function slab(pts, depth, bevel) {
    const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -depth / 2); g.deleteAttribute('normal'); const m = mergeVerts(g); m.computeVertexNormals(); return m;
  }
  const dummy = new THREE.Object3D();
  function place(geo, p, r, s) {
    dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
    if (r && r.isQuaternion) dummy.quaternion.copy(r); else dummy.rotation.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0, (r && r[3]) || 'XYZ');
    if (s === undefined || s === null) dummy.scale.set(1, 1, 1); else if (typeof s === 'number') dummy.scale.set(s, s, s); else dummy.scale.set(s[0], s[1], s[2]);
    dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix); return g;
  }
  const qDir = (from, to) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...from).normalize(), new THREE.Vector3(...to).normalize());

  // ---------- the part builder: pieces added to a group are merged per material, tinted per vertex, and inked ----------
  // B = builder(); B.add(geo, mat, pos, rot, scl, { tint: colour or fn(v, n), ink: width (0 none) }); B.build(group, inkMaterial)
  function builder() {
    const BK = new Map();
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _m3 = new THREE.Matrix3();
    return {
      add(geo, mat, pos, rot, scl, o) {
        o = o || {};
        if (rot && rot.isQuaternion) _q.copy(rot); else { _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0, (rot && rot[3]) || 'XYZ'); _q.setFromEuler(_e); }
        _s.set(...(scl === undefined || scl === null ? [1, 1, 1] : typeof scl === 'number' ? [scl, scl, scl] : scl));
        _m4.compose(_p.set(pos ? pos[0] : 0, pos ? pos[1] : 0, pos ? pos[2] : 0), _q, _s); _m3.getNormalMatrix(_m4);
        let b = BK.get(mat); if (!b) BK.set(mat, (b = { P: [], N: [], U: [], C: [], W: [], I: [] }));
        if (!geo.attributes.normal) geo.computeVertexNormals();
        const p = geo.attributes.position, nn = geo.attributes.normal, u = geo.attributes.uv, base = b.P.length / 3;
        const tint = o.tint === undefined ? null : typeof o.tint === 'string' ? rgb(o.tint) : o.tint, ink = o.ink === undefined ? 1 : o.ink;
        for (let i = 0; i < p.count; i++) {
          _v.fromBufferAttribute(p, i).applyMatrix4(_m4); _n.fromBufferAttribute(nn, i).applyMatrix3(_m3).normalize();
          b.P.push(_v.x, _v.y, _v.z); b.N.push(_n.x, _n.y, _n.z);
          if (o.uv) { const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z); if (ay > ax && ay > az) b.U.push(_v.x / o.uv[0], _v.z / o.uv[0]); else if (ax > az) b.U.push(_v.z / o.uv[0], _v.y / o.uv[1]); else b.U.push(_v.x / o.uv[0], _v.y / o.uv[1]); }
          else b.U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
          const c = !tint ? [1, 1, 1] : typeof tint === 'function' ? tint(_v, _n, i) : tint; b.C.push(c[0], c[1], c[2]); b.W.push(ink);
        }
        const flip = _m4.determinant() < 0; // a mirrored piece: wind its triangles the other way so they still face out
        const idx = geo.index ? (k) => geo.index.getX(k) : (k) => k, cnt = geo.index ? geo.index.count : p.count;
        for (let k = 0; k < cnt; k += 3) { if (flip) b.I.push(idx(k) + base, idx(k + 2) + base, idx(k + 1) + base); else b.I.push(idx(k) + base, idx(k + 1) + base, idx(k + 2) + base); }
      },
      // a box from corners
      box(mat, x0, y0, z0, x1, y1, z1, o) { this.add(BOXG, mat, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], null, [x1 - x0, y1 - y0, z1 - z0], o); },
      build(group, ink, o) {
        o = o || {}; const out = [];
        for (const [mat, b] of BK) {
          if (!b.P.length) continue;
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.N, 3));
          g.setAttribute('uv', new THREE.Float32BufferAttribute(b.U, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.C, 3));
          g.setAttribute('inkw', new THREE.Float32BufferAttribute(b.W, 1)); g.setIndex(b.I); g.computeBoundingSphere();
          mat.vertexColors = true;
          const m = new THREE.Mesh(g, mat); m.castShadow = o.cast !== false; m.receiveShadow = !!o.receive; group.add(m); out.push(m);
          if (ink && b.W.some((w) => w > 0)) { const im = new THREE.Mesh(g, ink); im.raycast = () => {}; group.add(im); out.push(im); }
        }
        BK.clear(); return out;
      },
    };
  }
  const BOXG = new THREE.BoxGeometry(1, 1, 1);

  // ---------- eyes: a painted texture on a flattened sphere ----------
  const eyeCache = new Map();
  function eyeTex(iris, opts) {
    opts = opts || {};
    const key = iris.join() + JSON.stringify(opts); if (eyeCache.has(key)) return eyeCache.get(key);
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = opts.white || '#fbf7ee'; g.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2 + (opts.low || 0), rx = opts.rx || 40, ry = opts.ry || 50;
    const gr = g.createLinearGradient(0, cy - ry, 0, cy + ry); gr.addColorStop(0, iris[0]); gr.addColorStop(.55, iris[1]); gr.addColorStop(1, iris[2] || iris[1]);
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = opts.pupil || '#120f1a'; g.beginPath(); g.ellipse(cx, cy + 2, rx * (opts.slit ? .22 : .5), ry * .58, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx - rx * .35, cy - ry * .38, rx * .32, ry * .26, -.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(cx + rx * .3, cy + ry * .35, rx * .13, 0, TAU); g.fill();
    if (opts.lid) { // a heavy, sleepy upper lid over the top of the eye, with a dark lash line along its edge
      const k = opts.lidK || .45, y0 = S * k;
      g.fillStyle = opts.lid; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, 0); g.lineTo(S, y0 - 6); g.quadraticCurveTo(S / 2, y0 + 14, 0, y0 - 6); g.closePath(); g.fill();
      g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, y0 - 6); g.quadraticCurveTo(S / 2, y0 + 14, S, y0 - 6); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); eyeCache.set(key, t); return t;
  }
  // an eye on a surface: at point p, facing normal n (blended with +Z by fwd), sized sx, sy, sz; returns its geometry
  function eyeGeo(p, n, sx, sy, sz, fwd, roll) {
    const g = new THREE.SphereGeometry(1, 22, 16), P = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < P.count; i++) { uv.setXY(i, P.getX(i) * .5 + .5, P.getY(i) * .5 + .5); P.setXYZ(i, P.getX(i) * sx, P.getY(i) * sy, P.getZ(i) * sz); }
    const zA = new THREE.Vector3(...n).normalize().lerp(new THREE.Vector3(0, 0, 1), fwd === undefined ? .3 : fwd).normalize();
    const xA = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
    const m = new THREE.Matrix4().makeBasis(xA, yA, zA);
    if (roll) m.multiply(new THREE.Matrix4().makeRotationZ(roll));
    m.setPosition(p[0], p[1], p[2]);
    g.applyMatrix4(m); g.computeVertexNormals(); return g;
  }
  // a point on an ellipsoid (centre C, radii R) at azimuth az (0 = +Z) and elevation el, pushed out by off; and its normal
  function onBall(C, R, az, el, off) {
    const x = Math.sin(az) * Math.cos(el), y = Math.sin(el), z = Math.cos(az) * Math.cos(el);
    const n = new THREE.Vector3(x / R[0], y / R[1], z / R[2]).normalize();
    return { p: [C[0] + x * R[0] + n.x * (off || 0), C[1] + y * R[1] + n.y * (off || 0), C[2] + z * R[2] + n.z * (off || 0)], n: [n.x, n.y, n.z] };
  }
  // canvas texture helper
  function canvasTex(w, h, draw, o) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); if (o && o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } if (o && o.pixel) { t.magFilter = THREE.NearestFilter; } t.anisotropy = 4; return t;
  }
  // a soft round sprite texture (glows, sparkles)
  const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });

  return { TAU, PI, cl, sm, lerp, rgb, ramp, RIM, INK, SEE, SEEFN, WIND, toon, inkMat, mkGeo, surf, lathe, tube, rbox, lumpy, slab, place, qDir, builder, eyeTex, eyeGeo, onBall, canvasTex, glowTex, mergeVerts, BOXG };
})();
