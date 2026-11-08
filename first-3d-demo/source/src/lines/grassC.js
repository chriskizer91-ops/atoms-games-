// grassC.js: Dandylion and Sunmane (the dandelion lion cub and its blazing grown form), Wormapple (an apple with a worm
// living in it), and Scarecrowl and Scarecrown (a crow in a scarecrow's hat, and the tall straw scarecrow it becomes).
// Built from their turnaround sheets in the style of creatures.js: toon shading, vertex tints and painted skins, ink.
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  // points spread evenly over a sphere
  const fib = (n) => { const out = []; for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996; out.push([Math.sin(a) * r, y, Math.cos(a) * r]); } return out; };
  // a turn putting local +y along dir, with local +z as near to face as it can be
  const aim = (dir, face) => {
    const y = V3(dir).normalize(), z = V3(face); z.addScaledVector(y, -z.dot(y)); if (z.lengthSq() < 1e-6) { z.set(0, 1, 0).addScaledVector(y, -y.y); if (z.lengthSq() < 1e-6) z.set(1, 0, 0); } z.normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
  };
  // vertex colours worked out once from a geometry's own positions (the builder's tint gets the vertex index)
  const byLocal = (geo, fn) => { const p = geo.attributes.position, c = []; for (let i = 0; i < p.count; i++) c.push(KIT.rgb(fn(p.getX(i), p.getY(i), p.getZ(i)))); return (v, n, i) => c[i]; };
  // a painted material that lights itself a little (flames, glowing eyes, the lantern's face)
  const selfLit = (m, k, map) => { m.emissiveMap = map || m.map; m.emissive.set('#ffffff'); m.emissiveIntensity = k; m.userData.e0 = m.emissive.clone(); m.userData.i0 = k; m.needsUpdate = true; return m; };
  const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  // ================= the lions =================
  // the body both lions share, grown by s (and a longer leg lh, and a head at hy, hz) so the family reads as one creature
  function lionBody(C, K, o) {
    const s = o.s, lh = o.lh, len = o.len || 1, bw = o.bw || 1, hf = o.hf || 1;
    const fur = C.M(), cream = C.M(), dark = C.M();
    const furT = (v, n) => K.rgb(n.y > .5 ? o.Y3 : n.y > -.4 ? o.Y : o.Y2);
    const bellyT = (v, n) => K.rgb(n.y < -.6 ? o.CR : n.y > .5 ? o.Y3 : n.y > -.35 ? o.Y : o.Y2);
    const by = lh + .065 * s;
    const body = C.part('body', null, [0, by, -.05 * s]);
    C.build(body, (b) => {
      C.ell(b, fur, [0, 0, 0], [.086 * s * bw, .074 * s, .15 * s * len], { tint: bellyT });
      C.ell(b, fur, [0, .008 * s, -.105 * s * len], [.086 * s * bw, .079 * s, .085 * s], { tint: bellyT });
      C.ell(b, fur, [0, .012 * s, .1 * s * len], [.084 * s * bw, .082 * s, .085 * s], { tint: bellyT });
    });
    // four legs: straight, cream paws with two toe lines; haunches on the hind ones
    for (const [nm, sd, z] of [['legFR', -1, .07], ['legFL', 1, .07], ['legBR', -1, -.17], ['legBL', 1, -.17]]) {
      const back = z < 0, top = by + (back ? .015 : -.005) * s, x = sd * (back ? .056 : .05) * s * bw, lw = o.lw || 1;
      const lg = C.part(nm, null, [x, top, z * s * len]);
      C.build(lg, (b) => {
        if (back) C.ell(b, fur, [sd * .01 * s, -.01 * s, 0], [.052 * s * lw, .072 * s, .078 * s], { tint: furT });
        b.add(K.tube([[0, 0, 0], [0, -top * .5, (back ? -.012 : .006) * s], [0, -top + .03 * s, 0]], 10, 10, (t) => (.033 - .007 * t) * s * lw), fur, null, null, null, { tint: furT });
        C.ell(b, cream, [0, -top + .023 * s, .014 * s], [.036 * s * lw, .024 * s, .046 * s * lw], { tint: o.CR });
        for (const d of [-1, 1]) b.add(K.tube([[d * .012 * s * lw, -top + .036 * s, .052 * s * lw], [d * .013 * s * lw, -top + .012 * s, .06 * s * lw]], 3, 4, () => .0028 * s), dark, null, null, null, { tint: '#9a6a34', ink: 0 });
      });
    }
    // the head: round and wide, a cream muzzle and chin, a small brown nose, a soft smile
    const head = C.part('head', null, [0, lh + o.hy * s, o.hz * s]);
    const h = s * hf, HR = [.105 * h, .092 * h, .09 * h], sn = o.snout || 1;
    C.build(head, (b) => {
      C.ell(b, fur, [0, 0, 0], HR, { tint: furT });
      C.ell(b, fur, [0, -.03 * h, .025 * h], [.094 * h, .066 * h, .07 * h], { tint: furT });
      C.ell(b, cream, [0, -.036 * h, (.066 + .02 * (sn - 1)) * h], [.054 * h, .036 * h, .042 * h * sn], { tint: o.CR, ink: .5 });
      C.ell(b, cream, [0, -.064 * h, .05 * h], [.04 * h, .02 * h, .036 * h], { tint: o.CR, ink: .4 });
      const nz = (.104 + .04 * (sn - 1)) * h;
      C.ell(b, dark, [0, -.014 * h, nz], [.019 * h, .012 * h, .011 * h], { tint: '#7a3a1e', ink: .4 });
      b.add(K.tube([[0, -.024 * h, nz - .002 * h], [0, -.044 * h, nz - .004 * h]], 3, 4, () => .0028 * h), dark, null, null, null, { tint: '#5a2a14', ink: 0 });
      b.add(K.tube([[-.026 * h, -.046 * h, nz - .014 * h], [-.012 * h, -.054 * h, nz - .006 * h], [0, -.045 * h, nz - .004 * h], [.012 * h, -.054 * h, nz - .006 * h], [.026 * h, -.046 * h, nz - .014 * h]], 10, 4, () => .003 * h), dark, null, null, null, { tint: '#5a2a14', ink: 0 });
    });
    C.eyePair(head, [0, 0, 0], HR, .4, .07, [.033 * h, .04 * h, .015 * h], o.iris, { fwd: .3, tex: o.eyeTex });
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * .078 * h, .07 * h, .012 * h], [-.1, sd * -.25, sd * -.5]);
      C.build(ear, (b) => {
        C.ell(b, fur, [0, .03 * h, 0], [.036 * h, .036 * h, .015 * h], { tint: o.Y });
        C.ell(b, dark, [0, .028 * h, .009 * h], [.024 * h, .025 * h, .008 * h], { tint: o.EAR, ink: .3 });
      });
    }
    // the tail: a thin rope from the rump, curving up behind, ending in its tip (a dandelion, a flame)
    const tail = C.part('tail', null, [0, by + .03 * s, -.215 * s * len]);
    const TP = o.tail.map((p) => p.map((c) => c * s));
    C.build(tail, (b) => b.add(K.tube(TP, 22, 8, (t) => (.016 - .005 * t) * s), fur, null, null, null, { tint: furT }));
    const tip = C.part('tailTip', tail, TP[TP.length - 1]);
    return { fur, cream, dark, head, HR, tip };
  }
  function lionIdle(C, t, dt, walk, st) {
    const P = C.parts;
    P.tail.rotation.z = Math.sin(t * 1.7) * .22; P.tail.rotation.x = Math.sin(t * 1.1) * .07; P.tailTip.rotation.y = Math.sin(t * 1.3) * .5;
    P.head.rotation.z = Math.sin(t * .8) * .05; P.head.rotation.x = Math.sin(t * 1.2) * .03;
    const tw = Math.pow(Math.max(0, Math.sin(t * 1.3)), 24); P.earL.rotation.z -= tw * .35; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 24) * .35;
    if (walk > 0) { const s = Math.sin(st.walkPh) * .55 * Math.min(1, walk * 2); P.legFL.rotation.x = s; P.legBR.rotation.x = s; P.legFR.rotation.x = -s; P.legBL.rotation.x = -s; P.tail.rotation.z *= 1.6; }
  }
  function lionAct(C, name, u) {
    const P = C.parts, k = Math.sin(u * PI);
    if (name === 'attack' || name === 'chomp') { P.tail.rotation.x -= .5 * k; P.earL.rotation.x -= .4 * k; P.earR.rotation.x -= .4 * k; P.legFL.rotation.x -= .5 * k; P.legFR.rotation.x -= .5 * k; }
    if (name === 'hit') { P.earL.rotation.z -= .4 * k; P.earR.rotation.z += .4 * k; P.head.rotation.x -= .2 * k; }
    if (name === 'roar' || name === 'maneflare' || name === 'spit' || name === 'cast') { P.head.rotation.x -= .25 * k; P.tail.rotation.x -= .6 * k; P.tailTip.scale.multiplyScalar(1 + .4 * k); }
    if (name === 'roar' || name === 'maneflare' || name === 'puff' || name === 'happy') { const f = 1 + .22 * k + .04 * Math.sin(u * 60) * k; for (const m of ['mane', 'maneIn', 'maneOut']) if (P[m]) P[m].scale.multiplyScalar(f); }
    if (name === 'crouch') { const c = Math.min(1, u * 2); P.legBL.rotation.x += .3 * c; P.legBR.rotation.x += .3 * c; P.tail.rotation.x -= .3 * c; }
    if (name === 'tuck' || name === 'curl') { const c = Math.min(1, u * 3); for (const l of ['legFL', 'legFR']) P[l].rotation.x -= .9 * c; for (const l of ['legBL', 'legBR']) P[l].rotation.x += .9 * c; }
  }

  // ---------- Dandylion (sheet: a yellow lion cub, a big round mane of dandelion clocks, a yellow puff on its tail) ----------
  // each puff of the mane: a domed disc with a scalloped rim, painted cream with creases and a brown star at its heart
  let PUFF = null;
  const puffGeo = () => {
    if (PUFF) return PUFF;
    const g = new THREE.SphereGeometry(1, 20, 7); g.rotateX(PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .1 * Math.cos(8 * Math.atan2(y, x)) * (1 - Math.abs(z));
      uv.setXY(i, x * .5 + .5, y * .5 + .5); p.setXYZ(i, x * f, y * f, z * (z > 0 ? .7 : .3));
    }
    g.computeVertexNormals(); return (PUFF = g);
  };
  CREATURE_DEFS.dandylion = {
    height: .62, eyeY: .35, width: .5, size: 1, mouth: [0, -.05, .1],
    build(C, K) {
      const L = lionBody(C, K, { s: 1, lh: .12, hy: .224, hz: .155, bw: 1.4, lw: 1.25, hf: 1.22, Y: '#f6c21c', Y2: '#d8960e', Y3: '#fdd84a', CR: '#f8e8c4', EAR: '#a8682a',
        iris: ['#2a1206', '#6a3a14', '#a8702c'], tail: [[0, 0, 0], [0, -.005, -.05], [0, .03, -.09], [0, .1, -.104], [0, .17, -.1], [0, .2, -.095]] });
      const puffM = C.paint(128, 128, (g, W) => {
        g.fillStyle = '#e8d4a6'; g.fillRect(0, 0, W, W);
        const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, '#fff8e2'); gr.addColorStop(.55, '#f8eacb'); gr.addColorStop(1, '#dcc292'); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
        g.strokeStyle = '#a8804c'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.stroke(); g.strokeStyle = '#6a4424'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(170,128,76,.5)'; g.lineWidth = 3; g.lineCap = 'round';
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; g.beginPath(); g.moveTo(64 + Math.cos(a) * 24, 64 + Math.sin(a) * 24); g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); g.stroke(); }
        g.strokeStyle = '#8a5428'; g.lineWidth = 5;
        for (let i = 0; i < 3; i++) { const a = i / 3 * PI + .3; g.beginPath(); g.moveTo(64 - Math.cos(a) * 15, 64 - Math.sin(a) * 15); g.lineTo(64 + Math.cos(a) * 15, 64 + Math.sin(a) * 15); g.stroke(); }
      });
      const core = C.M();
      // the mane: a ball of dandelion clocks all round the head and shoulders, open at the face
      const mane = C.part('mane', L.head, [0, .03, -.15]);
      const R = [.2, .205, .15], rr = seeded(11), G0 = puffGeo();
      C.build(mane, (b) => {
        C.ell(b, core, [0, 0, 0], R, { tint: '#d8bf8c', ink: .3 });
        const dirs = fib(46).concat([[0, Math.sin(.42), Math.cos(.42)]]);
        for (const d of dirs) {
          const az = Math.atan2(d[0], d[2]), el = Math.asin(cl(d[1], -1, 1));
          if (Math.abs(az) < .5 && el > -.4 && el < .2) continue;  // behind the face
          if (el < -.62 && Math.abs(az) > 1.2) continue;               // inside the body
          const { p, n } = K.onBall([0, 0, 0], R, az, el, .004), sc = .07 * (.9 + rr() * .2);
          const q = K.qDir([0, 0, 1], n).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rr() * TAU));
          b.add(G0, puffM, p, q, [sc, sc, sc * 1.25], { ink: .8 });
        }
      });
      // the tail's puff: a little yellow dandelion
      const pom = C.part('pom', L.tip, [0, .03, -.005]);
      C.build(pom, (b) => {
        C.ell(b, core, [0, 0, 0], [.04, .04, .034], { tint: '#e8a414', ink: .3 });
        for (const d of fib(32)) b.add(new THREE.ConeGeometry(.015, .064, 5), core, [d[0] * .056, d[1] * .056, d[2] * .046], K.qDir([0, 1, 0], d), null, { tint: Math.abs(d[2]) > .7 ? '#fce048' : '#f6c41e', ink: .4 });
      });
    },
    idle(C, t, dt, walk, st) { lionIdle(C, t, dt, walk, st); C.parts.mane.scale.multiplyScalar(1 + .012 * Math.sin(t * 2.4)); C.parts.pom.rotation.z = t * .6; },
    act(C, name, u) { lionAct(C, name, u); },
  };

  // ---------- Sunmane (sheet: a grown lion, golden, a mane of flame-shaped petals swept back, a cream ruff, a flame on its tail) ----------
  CREATURE_DEFS.sunmane = {
    height: .82, eyeY: .5, width: .62, size: 1.25, mouth: [0, -.065, .13],
    build(C, K) {
      const s = 1.28;
      const L = lionBody(C, K, { s, lh: .2, len: 1.1, hy: .224, hz: .2, snout: 1.3, bw: 1.2, lw: 1.15, hf: 1.15, Y: '#f4b828', Y2: '#d08a14', Y3: '#fcd456', CR: '#fbeccc', EAR: '#b06420',
        iris: ['#6a2a06', '#d07010', '#f8b830'], eyeTex: { lid: '#f4b828', lidK: .34, rx: 36, ry: 46 },
        tail: [[0, 0, 0], [.01, -.03, -.06], [.04, -.02, -.11], [.075, .04, -.125], [.095, .1, -.11], [.1, .15, -.09]] });
      // two petal skins: the outer ones deep orange with red edges, the inner ones yellow
      const petalSkin = (edge, mid, heart) => selfLit(C.paint(64, 128, (g, W, H) => { g.fillStyle = edge; g.fillRect(0, 0, W, H); CPAINT.flame(g, W / 2, H + 4, 10, W * .4, mid, heart); g.fillStyle = 'rgba(255,240,170,.45)'; g.fillRect(W / 2 - 2, H * .35, 4, H * .5); }), .22);
      const outer = petalSkin('#d83c16', '#fa7a1a', '#ffb82e'), inner = petalSkin('#f47a1a', '#ffb02a', '#ffd85a');
      const PET = (() => {
        const g = K.slab([[.5, 0], [.8, .14], [.96, .4], [.82, .66], [.62, .86], [.5, 1], [.38, .86], [.18, .66], [.04, .4], [.2, .14]], .05, .02), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i) - .5, y = p.getY(i); p.setXYZ(i, x, y, p.getZ(i) - .3 * y * y); }
        g.computeVertexNormals(); return g;
      })();
      // rings of petals round the face, sweeping back over the neck and shoulders
      const ring = (b, mat, beta, gamma, n, len, wid, ph, up) => {
        for (let i = 0; i < n; i++) {
          const a = (i + ph) / n * TAU, sb = Math.sin(beta), cb = Math.cos(beta);
          const hs = s * 1.15, base = [Math.cos(a) * sb * .1 * hs, .012 * hs + Math.sin(a) * sb * .1 * hs, -.035 * hs + cb * .09 * hs];
          const dir = [Math.cos(a) * Math.sin(gamma), Math.sin(a) * Math.sin(gamma) + (up || .08), Math.cos(gamma)];
          const face = [-Math.cos(a) * Math.cos(gamma), -Math.sin(a) * Math.cos(gamma), Math.sin(gamma)];
          const L_ = len * s * (1 + .12 * Math.sin(a * 3 + beta * 5));
          b.add(PET, mat, base, aim(dir, face), [wid * s, L_, L_], { ink: .45 });
        }
      };
      const d2r = PI / 180;
      const mOut = C.part('maneOut', L.head, [0, 0, 0]), mIn = C.part('maneIn', L.head, [0, 0, 0]);
      C.build(mOut, (b) => {
        ring(b, outer, 62 * d2r, 102 * d2r, 12, .19, .12, .5);
        ring(b, outer, 92 * d2r, 120 * d2r, 12, .2, .125, 0, .2);
        ring(b, outer, 122 * d2r, 140 * d2r, 11, .18, .125, .5, .45);
        ring(b, inner, 152 * d2r, 160 * d2r, 8, .15, .12, 0, .6);
      });
      C.build(mIn, (b) => { ring(b, inner, 40 * d2r, 84 * d2r, 11, .14, .1, 0); ring(b, inner, 165 * d2r, 172 * d2r, 4, .11, .1, .25, .7); });
      // the cream ruff on its chest, under the chin
      const ruff = C.part('ruff', null, [0, .37, .19]);
      C.build(ruff, (b) => {
        C.ell(b, L.cream, [0, -.02, 0], [.07, .085, .05], { tint: '#fbeccc' });
        const tuft = K.slab([[-.03, 0], [.03, 0], [.022, -.05], [0, -.085], [-.022, -.05]], .012, .004);
        for (const [x, y, z, r] of [[0, -.05, .03, 0], [-.035, -.04, .02, .35], [.035, -.04, .02, -.35], [-.018, -.08, .025, .15], [.018, -.08, .025, -.15], [0, -.1, .02, 0]]) b.add(tuft, L.cream, [x, y, z], [-.25, 0, r], null, { tint: '#fff4dc', ink: .4 });
      });
      // the tail's flame: a bud of petals
      const bud = C.part('bud', L.tip, [0, .01, 0]);
      C.build(bud, (b) => {
        b.add(PET, inner, [0, 0, 0], aim([0, 1, 0], [0, 0, 1]), [.07 * s, .1 * s, .1 * s], { ink: .45 });
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.add(PET, i % 2 ? outer : inner, [0, -.01, 0], aim([Math.sin(a) * .7, 1, Math.cos(a) * .7], [Math.sin(a), 0, Math.cos(a)]), [.06 * s, .085 * s, .085 * s], { ink: .45 }); }
      });
      C.glow(bud, [0, .05, 0], '#ff9a30', .14);
    },
    idle(C, t, dt, walk, st) {
      lionIdle(C, t, dt, walk, st);
      const P = C.parts; P.maneOut.scale.multiplyScalar(1 + .02 * Math.sin(t * 7.3) * Math.sin(t * 2.1)); P.maneIn.scale.multiplyScalar(1 + .025 * Math.sin(t * 9.1 + 1));
      P.bud.scale.y *= 1 + .1 * Math.sin(t * 11) * Math.sin(t * 3.7); P.bud.rotation.y = t * .8;
    },
    act(C, name, u) { lionAct(C, name, u); },
  };

  // ---------- Wormapple (sheet: a shiny red apple, stem and leaf, a little green worm waving from a hole in its front) ----------
  const HOLE_AZ = .7, HOLE_Y = .215, HOLE_R = .238;
  const holeN = new THREE.Vector3(Math.sin(HOLE_AZ), -.04, Math.cos(HOLE_AZ)).normalize();
  // the worm ducks into its hole (k 0 out, 1 gone)
  function wormHide(C, k) { if (k <= 0) return; const w = C.parts.worm; w.position.addScaledVector(holeN, -.065 * k); w.position.y -= .1 * k; w.scale.multiplyScalar(1 - .45 * k); w.rotation.x += .5 * k; }
  CREATURE_DEFS.wormapple = {
    height: .6, eyeY: .34, width: .52, size: 1, hopper: true, mouth: [0, -.022, .045],
    build(C, K) {
      const skin = C.paint(512, 256, (g, W, H) => {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7a100c'); gr.addColorStop(.14, '#c82216'); gr.addColorStop(.35, '#e2301c'); gr.addColorStop(.7, '#d0261a'); gr.addColorStop(.92, '#a01810'); gr.addColorStop(1, '#6a0e0a');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
                const hl = (u, v, w, h) => { g.fillStyle = 'rgba(255,160,130,.5)'; g.beginPath(); g.ellipse(u * W, v * H, w * W, h * H, -.2, 0, TAU); g.fill(); g.fillStyle = '#ffe6d8'; g.beginPath(); g.ellipse(u * W - w * W * .15, v * H - h * H * .2, w * W * .42, h * H * .4, -.2, 0, TAU); g.fill(); g.beginPath(); g.ellipse(u * W + w * W * .5, v * H + h * H * .7, w * W * .18, h * H * .14, 0, 0, TAU); g.fill(); };
        hl(.385, .3, .032, .1); hl(.13, .3, .028, .09);
      });
      const dark = C.M(), stemM = C.M(), leafM = C.M(), worm = C.M();
      const PROF = []; for (let i = 0; i <= 30; i++) { const th = i / 30 * PI; PROF.push([.24 * Math.pow(Math.sin(th), .85) * (1 + .07 * Math.cos(th)), .232 + .222 * Math.cos(th) - .052 * Math.exp(-Math.pow(th / .3, 2)) + .026 * Math.exp(-Math.pow((PI - th) / .26, 2))]); }
      const body = C.part('body', null, [0, 0, 0]);
      const hp = new THREE.Vector3(Math.sin(HOLE_AZ) * HOLE_R, HOLE_Y, Math.cos(HOLE_AZ) * HOLE_R), q = K.qDir([0, 0, 1], holeN.toArray());
      C.build(body, (b) => {
        b.add(K.lathe(PROF, 44, { lin: true, fn: (out, a, v) => { const k = sm(.6, 1, v), w = .035 * k * Math.cos(5 * a); out[0] *= 1 + w; out[2] *= 1 + w; out[1] -= .3 * w * .3; } }), skin);
        // the hole: dark inside, a ring of bitten apple round it
        C.ell(b, dark, hp.clone().addScaledVector(holeN, -.011).toArray(), [.056, .062, .016], { rot: q, tint: '#2a0606', ink: .5 });
        b.add(new THREE.TorusGeometry(.059, .009, 6, 26), dark, hp.clone().addScaledVector(holeN, -.002).toArray(), q, [1, 1.08, 1], { tint: '#9a1a10', ink: .4 });
      });
      // the stem leaning to its left, the leaf off to its right
      const stem = C.part('stem', body, [0, .405, 0]);
      C.build(stem, (b) => {
        b.add(K.tube([[0, -.03, 0], [.006, .04, 0], [.026, .095, 0], [.056, .128, 0]], 12, 8, (t) => .017 - .004 * t), stemM, null, null, null, { tint: (v, n) => K.rgb(n.y > .3 || n.x < -.4 ? '#a8683a' : '#7a4218') });
        C.ell(b, stemM, [.057, .129, 0], [.013, .006, .013], { rot: [0, 0, -.75], tint: '#d09a5a', ink: .4 });
      });
      const leaf = C.part('leaf', body, [-.012, .43, .0], [0, .45, PI - .55]);
      leaf.scale.setScalar(1.25); leaf.userData.rest.s.setScalar(1.25);
      C.build(leaf, (b) => {
        const g = K.slab([[0, 0], [.05, .036], [.11, .056], [.17, .05], [.22, .024], [.25, .002], [.2, -.026], [.13, -.042], [.06, -.032]], .008, .003), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + .5 * x * x); }
        g.computeVertexNormals();
        b.add(g, leafM, null, null, null, { tint: byLocal(g, (x, y) => (y > .004 ? '#8ed444' : '#5aa62a')) });
        b.add(K.tube([[.0, 0, .005], [.08, .006, .008], [.16, .004, .018], [.235, .001, .032]], 10, 4, () => .0035), leafM, null, null, null, { tint: '#c8f080', ink: 0 });
      });
      // the worm: up out of the hole and waving, segmented lime, big shiny eyes, a happy open mouth
      const wp = C.part('worm', body, hp.toArray(), [0, HOLE_AZ, 0]);
      const WP = [[0, -.03, -.07], [0, -.01, -.012], [.004, .016, .028], [.012, .05, .044], [.016, .078, .04]];
      C.build(wp, (b) => {
        b.add(K.tube(WP, 20, 12, (t) => .041 - .005 * t), worm, null, null, null, { tint: (v, n, i) => { const t = Math.floor(i / 13) / 20; return K.rgb(n.z > .6 && v.y > -.01 ? '#c4ec58' : Math.floor(t * 8) % 2 ? '#5ea820' : '#8ed22e'); } });
      });
      const head = C.part('head', wp, [.018, .106, .036]);
      const HR = [.058, .052, .05];
      C.build(head, (b) => {
        C.ell(b, worm, [0, 0, 0], HR, { tint: (v, n) => K.rgb(n.y > .5 ? '#b8ea48' : n.y > -.4 ? '#98d834' : '#74b828') });
        C.ell(b, dark, [0, -.021, .045], [.017, .012, .007], { tint: '#b81e28', ink: 0 });
        C.ell(b, dark, [.004, -.026, .047], [.009, .005, .004], { tint: '#f07080', ink: 0 });
        for (const sd of [-1, 1]) C.ell(b, worm, [sd * .037, -.014, .037], [.01, .006, .004], { tint: '#f4a0a0', ink: 0 });
      });
      C.eyePair(head, [0, 0, 0], HR, .36, .2, [.02, .026, .01], ['#0a0a0c', '#16161a', '#2a2a30'], { fwd: .35 });
      const arm = C.part('arm', wp, [.045, .06, .03], [0, 0, -.2]);
      C.build(arm, (b) => { b.add(K.tube([[0, 0, 0], [.024, .01, .006], [.042, .036, .01]], 8, 8, () => .013), worm, null, null, null, { tint: '#8ed22e', ink: .6 }); C.ell(b, worm, [.044, .04, .01], [.016, .016, .013], { tint: '#a8e23e', ink: .5 }); });
    },
    idle(C, t, dt, walk, st) {
      const P = C.parts, ph = (t % 5.2) / 5.2;
      // now and then the worm ducks down into its apple, and pops back up
      const k = ph < .56 ? 0 : ph < .62 ? sm(.56, .62, ph) : ph < .78 ? 1 : 1 - sm(.78, .84, ph);
      const pop = ph > .8 && ph < .9 ? Math.sin((ph - .8) / .1 * PI) : 0;
      P.worm.rotation.z = Math.sin(t * 2.2) * .12; P.worm.rotation.x = Math.sin(t * 1.6) * .06;
      P.head.rotation.z = Math.sin(t * 1.7) * .15; P.head.rotation.y = Math.sin(t * 1.1) * .2; P.head.scale.y *= 1 + .18 * pop; P.head.scale.x *= 1 - .08 * pop;
      P.arm.rotation.z += Math.sin(t * 7) * .45; P.arm.rotation.x = Math.sin(t * 3.5) * .2;
      P.leaf.rotation.x += Math.sin(t * 1.6) * .07; P.stem.rotation.z = Math.sin(t * 1.6 + .5) * .04;
      if (walk > 0) P.leaf.rotation.x += Math.sin(st.walkPh) * .2;
      wormHide(C, k);
    },
    act(C, name, u) {
      const P = C.parts, b = Math.sin(u * PI);
      if (name === 'attack' || name === 'chomp' || name === 'spit' || name === 'flick') { P.worm.rotation.x -= .45 * b; P.head.rotation.x -= .2 * b; }
      if (name === 'hit') wormHide(C, .8 * b);
      if (name === 'tuck' || name === 'sleep' || name === 'coreroll' || name === 'shadowsink') wormHide(C, Math.min(1, u * 3.5) + (name === 'coreroll' ? 1 : 0));
      if (name === 'curl') wormHide(C, sm(0, .2, u) * (1 - sm(.8, 1, u)));
      if (name === 'happy' || name === 'puff' || name === 'roar' || name === 'cast') { P.arm.rotation.z += Math.sin(u * 40) * .6; P.head.rotation.x -= .25 * b; P.leaf.rotation.x -= .3 * b; }
      if (name === 'faint') { P.worm.rotation.x += 1.1 * u; P.head.rotation.x += .6 * u; }
    },
  };

  // ================= the crows =================
  const FE = ['#3a2f28', '#2a221d', '#56473a'], ST = ['#e0aa48', '#c48c36', '#a06e28', '#ecc060'];
  // a feather (or a ragged strip of straw): a long point along +x, centred on y
  const featherGeo = (K, len, wid) => K.slab([[0, -wid * .5], [len * .35, -wid * .6], [len * .75, -wid * .42], [len, 0], [len * .78, wid * .34], [len * .38, wid * .52], [0, wid * .45]], .006, .002);
  const featherSkin = (C, base, line) => C.paint(256, 128, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H); g.strokeStyle = line; g.lineWidth = 3;
    for (let r = 0; r < 8; r++) for (let i = 0; i < 18; i++) { const x = (i + (r % 2) * .5) / 18 * W, y = (r + .7) / 8 * H; g.beginPath(); g.moveTo(x - W / 36, y - H / 16); g.quadraticCurveTo(x, y + H / 22, x + W / 36, y - H / 16); g.stroke(); }
  });
  // the crow's head: round, black, a big grey beak, eyes that glow orange
  function crowHead(C, K, head, HR, beakL) {
    const fe = C.M(), beak = C.M();
    C.build(head, (b) => {
      C.ell(b, fe, [0, 0, 0], HR, { tint: (v, n) => K.rgb(n.y > .45 ? FE[2] : n.y > -.3 ? FE[0] : FE[1]) });
      b.add(new THREE.ConeGeometry(.024 * HR[0] / .074, beakL, 12), beak, [0, -.014 * HR[1] / .068, HR[2] * .82 + beakL * .32], [PI / 2 + .32, 0, 0], [.78, 1, 1], { tint: (v, n) => K.rgb(n.y > .1 ? '#a09890' : '#6a625a') });
    });
    C.eyePair(head, [0, 0, 0], HR, .48, .08, [.025 * HR[0] / .074, .029 * HR[0] / .074, .011], ['#ffc040', '#ff7a10', '#d04008'], { fwd: .4, tex: { white: '#1e1612', rx: 46, ry: 54, pupil: '#ffe8a0', slit: true } });
    selfLit(C.mats[C.mats.length - 1], .45);
    for (const sd of [-1, 1]) C.glow(head, [sd * HR[0] * .46, HR[1] * .08, HR[2] * .95], '#ff8a20', HR[0] * .75);
  }
  // the scarecrow's hat: a wide droopy brim fringed with straw, a tall cone flopping over to its right, green patches
  function strawHat(C, K, hat, s, crown) {
    const straw = C.M(), patch = C.M(), rr = seeded(crown ? 23 : 7);
    const CP = [[0, -.005, 0], [0, .055, -.01], [-.004, .105, -.018], [-.026, .142, -.02], [-.062, .152, -.006], [-.088, .128, .012]].map((p) => p.map((c) => c * s));
    const rF = (t) => (.056 * Math.pow(1 - t, .75) + .008) * s * (1 + .08 * Math.sin(t * 24)), curve = new THREE.CatmullRomCurve3(CP.map(V3));
    // a point on the cone's surface at t along it, round at angle az (0 front)
    const onCone = (t, az, out) => { const c = curve.getPointAt(t), tg = curve.getTangentAt(t), side = new THREE.Vector3(1, 0, 0).addScaledVector(tg, -tg.x).normalize(), fr = new THREE.Vector3().crossVectors(side, tg).normalize(); const n = side.multiplyScalar(Math.sin(az)).addScaledVector(fr, Math.cos(az)).normalize(); return { p: c.addScaledVector(n, rF(t) + (out || 0)), n, tg }; };
    C.build(hat, (b) => {
      b.add(K.lathe([[0, .03], [.07, .026], [.13, .01], [.175, -.016], [.2, -.04], [.198, -.05], [.17, -.036], [.11, -.012], [.05, -.0], [0, .004]].map(([r, y]) => [r * s, y * s]), 36, { fn: (out, a, v, r) => { out[1] += .012 * s * Math.sin(5 * a + 1) * (r / (.2 * s)); } }), straw, null, null, null, { tint: (v, n) => K.rgb(n.y > .35 ? '#c8903c' : n.y > -.35 ? '#a8742c' : '#7a4e20') });
      for (let i = 0; i < 60; i++) { // the fringe
        const a = i / 60 * TAU + (rr() - .5) * .1, wave = .012 * s * Math.sin(5 * a + 1), len = (.04 + rr() * .05) * s, dir = [Math.sin(a) * .6, -.8, Math.cos(a) * .6];
        const p = [Math.sin(a) * .19 * s + dir[0] * len * .4, -.044 * s + wave + dir[1] * len * .4, Math.cos(a) * .19 * s + dir[2] * len * .4];
        b.add(K.BOXG, straw, p, aim(dir, [Math.sin(a), 0, Math.cos(a)]), [.018 * s, len, .005 * s], { tint: ST[Math.floor(rr() * 4)], ink: .45 });
      }
      for (let i = 0; i < 14; i++) { // straw hair under the brim, at the sides and back of the head
        const a = 1.15 + i / 13 * (TAU - 2.3), len = (.05 + rr() * .03) * s, dir = [Math.sin(a) * .25, -1, Math.cos(a) * .25];
        b.add(K.BOXG, straw, [Math.sin(a) * .085 * s, -.02 * s - len * .45, Math.cos(a) * .085 * s], aim(dir, [Math.sin(a), 0, Math.cos(a)]), [.012 * s, len, .004 * s], { tint: ST[Math.floor(rr() * 4)], ink: .35 });
      }
      b.add(K.tube(CP, 26, 14, rF), straw, null, null, null, { tint: (v, n) => K.rgb(n.y > .55 ? '#d09a40' : n.x > .35 ? '#a8742c' : '#bc863a') });
      const sq = K.slab([[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], .006, .002);
      for (const [t, az, w] of crown ? [[.12, -.55, .04], [.16, PI - .3, .036]] : [[.14, -.6, .036], [.18, PI - .5, .032]]) { const o = onCone(t, az, .001); b.add(sq, patch, o.p.toArray(), aim(o.tg.toArray(), o.n.toArray()), [w * s, w * s, 1], { tint: '#6e7a2a', ink: .55 }); }
      if (crown) { // a golden crown round the cone
        const o = curve.getPointAt(.26), tg = curve.getTangentAt(.26), r = rF(.26) + .006 * s, qq = K.qDir([0, 1, 0], tg.toArray());
        b.add(new THREE.CylinderGeometry(r, r * 1.04, .026 * s, 24, 1, true), patch, o.toArray(), qq, null, { tint: '#f0c040', ink: .5 });
        b.add(new THREE.TorusGeometry(r * 1.02, .005 * s, 5, 24), patch, o.clone().addScaledVector(tg, -.012 * s).toArray(), qq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)), null, { tint: '#c88a1c', ink: .4 });
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * TAU, side = new THREE.Vector3(1, 0, 0).addScaledVector(tg, -tg.x).normalize(), fr = new THREE.Vector3().crossVectors(side, tg).normalize();
          const n = side.multiplyScalar(Math.sin(a)).addScaledVector(fr, Math.cos(a)), p = o.clone().addScaledVector(n, r * 1.02).addScaledVector(tg, .03 * s);
          b.add(new THREE.ConeGeometry(.012 * s, .036 * s, 4), patch, p.toArray(), K.qDir([0, 1, 0], tg.clone().addScaledVector(n, .25).toArray()), null, { tint: '#f8d050', ink: .45 });
          b.add(new THREE.OctahedronGeometry(.007 * s, 0), patch, o.clone().addScaledVector(n, r * 1.05).toArray(), null, null, { tint: i % 2 ? '#e05a30' : '#5ab0a0', ink: .3 });
        }
      }
    });
  }
  function crowFeet(C, K, leg, y, s) {
    const foot = C.M();
    C.build(leg, (b) => {
      for (const a of [-.5, 0, .5, PI]) {
        const d = [Math.sin(a), 0, Math.cos(a)], L = (a === PI ? .03 : .05) * s;
        b.add(K.tube([[0, y + .004 * s, .006 * s], [d[0] * L * .55, y - .003 * s, .006 * s + d[2] * L * .55], [d[0] * L, y - .002 * s, .006 * s + d[2] * L]], 4, 5, () => .0072 * s), foot, null, null, null, { tint: '#8c8274', ink: .6 });
        b.add(new THREE.ConeGeometry(.0055 * s, .018 * s, 5), foot, [d[0] * (L + .006 * s), y - .004 * s, .006 * s + d[2] * (L + .006 * s)], K.qDir([0, 1, 0], [d[0], -.45, d[2]]), null, { tint: '#3a342e', ink: .4 });
      }
    });
  }
  function crowIdle(C, t, rate) {
    // a crow's head: still, then a quick turn to look somewhere else
    const per = 1.7 * (rate || 1), n = Math.floor(t / per), rnd = (k) => (((Math.sin(k * 12.9898) * 43758.5) % 1 + 1) % 1 - .5) * .7, k = sm(0, .1, (t % per) / per);
    return rnd(n - 1) + (rnd(n) - rnd(n - 1)) * k;
  }

  // ---------- Scarecrowl (sheet: a black crow under a tattered straw hat, wings held out, an orange bandana) ----------
  CREATURE_DEFS.scarecrowl = {
    height: .62, eyeY: .37, width: .6, size: 1, mouth: [0, -.03, .11],
    build(C, K) {
      const fe = C.M(), straw = C.M(), cloth = C.M(), skin = featherSkin(C, FE[0], '#5a4a3c');
      const body = C.part('body', null, [0, .205, 0]);
      C.build(body, (b) => {
        C.ell(b, skin, [0, 0, 0], [.095, .112, .085]);
        b.add(new THREE.TorusGeometry(.058, .016, 8, 24), cloth, [0, .09, .008], [PI / 2 + .25, 0, 0], [1, 1.05, 1], { tint: '#d86e22' });
      });
      const tail = C.part('tail', null, [0, .13, -.06]);
      C.build(tail, (b) => { for (const x of [-.03, 0, .03]) { const g = featherGeo(K, .12, .04); b.add(g, fe, [x * .6, 0, 0], K.qDir([1, 0, 0], [x * 3, -.7, -.62]), null, { tint: x ? FE[1] : FE[0], ink: .5 }); } });
      for (const sd of [-1, 1]) { const lg = C.part(sd < 0 ? 'legR' : 'legL', null, [sd * .045, .11, .0]); C.build(lg, (b) => b.add(K.tube([[0, .03, 0], [0, -.04, .004], [0, -.1, .006]], 6, 6, () => .011), cloth, null, null, null, { tint: '#e0782a', ink: .6 })); crowFeet(C, K, lg, -.103, 1); }
      // the wings, held out to the sides like a scarecrow's arms, straw poking out between the feathers
      for (const sd of [-1, 1]) {
        const w = C.part(sd < 0 ? 'wingR' : 'wingL', null, [sd * .075, .27, -.012], [0, sd * .28, 0]);
        C.build(w, (b) => {
          C.ell(b, fe, [sd * .04, -.012, 0], [.058, .042, .036], { tint: (v, n) => K.rgb(n.y > .3 ? FE[2] : FE[0]) });
          for (let i = 0; i < 7; i++) {
            const th = .4 - i * .21, len = .16 + .06 * Math.sin(i / 6 * PI) + .025 * i / 6, g = featherGeo(K, len, .05);
            b.add(g, fe, [sd * .03, -.012 - i * .007, .004 * (7 - i)], [0, 0, sd * th], [sd, 1, 1], { tint: byLocal(g, (x, y) => (y > .012 ? FE[2] : i % 2 ? FE[1] : FE[0])), ink: .5 });
          }
          for (let i = 0; i < 6; i++) { const th = .3 - i * .22, len = .07 + .035 * (i % 2); b.add(K.BOXG, straw, [sd * (.07 + len * .5) * Math.cos(th), -.012 + (.07 + len * .5) * Math.sin(th), .03], [0, 0, sd * th], [len, .012, .004], { tint: ST[i % 4], ink: .4 }); }
        });
      }
      const scarf = C.part('scarf', null, [0, .298, .07], [-.28, 0, 0]);
      C.build(scarf, (b) => {
        const P = [[-.075, 0], [.075, 0], [.064, -.028], [.05, -.052], [.038, -.078], [.02, -.1], [.007, -.124], [-.008, -.104], [-.024, -.114], [-.032, -.086], [-.05, -.064], [-.062, -.03]];
        const g = K.slab(P, .008, .002); b.add(g, cloth, null, null, null, { tint: byLocal(g, (x, y) => (y > -.015 ? '#e8822c' : y < -.07 ? '#c8601c' : '#de7426')) });
        b.add(K.slab([[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], .004, .001), cloth, [.012, -.052, .006], [0, 0, .2], [.028, .028, 1], { tint: '#6e7a2a', ink: .5 });
      });
      const head = C.part('head', null, [0, .36, .02]);
      crowHead(C, K, head, [.08, .074, .078], .078);
      const hat = C.part('hat', head, [0, .058, -.016], [-.3, 0, .06]);
      strawHat(C, K, hat, 1, false);
    },
    idle(C, t, dt, walk, st) {
      const P = C.parts, f = Math.sin(t * 2.2) * .06;
      P.wingL.rotation.z += f; P.wingR.rotation.z -= f;
      P.hat.rotation.z += Math.sin(t * 1.3) * .035; P.scarf.rotation.x += Math.sin(t * 1.8) * .04;
      P.head.rotation.y = crowIdle(C, t); P.head.rotation.z = Math.sin(t * .9) * .05;
      P.tail.rotation.x = Math.sin(t * 1.4) * .06;
      if (walk > 0) { const s = Math.sin(st.walkPh) * .5; P.legL.rotation.x = s; P.legR.rotation.x = -s; P.wingL.rotation.z += Math.abs(s) * .3; P.wingR.rotation.z -= Math.abs(s) * .3; }
    },
    act(C, name, u) {
      const P = C.parts, k = Math.sin(u * PI);
      if (['attack', 'cast', 'happy', 'hop', 'roar', 'puff', 'spin', 'scareflap', 'maneflare', 'shadowrise'].includes(name)) { const f = Math.sin(u * TAU * (name === 'scareflap' ? 5 : 3)) * .7 * k; P.wingL.rotation.z += f; P.wingR.rotation.z -= f; }
      if (name === 'hit') { P.wingL.rotation.z += .5 * k; P.wingR.rotation.z -= .5 * k; P.hat.position.y += .02 * k; }
      if (name === 'curl' || name === 'tuck' || name === 'shadowsink') { const c = name === 'curl' ? k : Math.min(1, u * 3); P.wingL.rotation.y -= 1.1 * c; P.wingR.rotation.y += 1.1 * c; P.wingL.rotation.z -= .5 * c; P.wingR.rotation.z += .5 * c; }
      if (name === 'faint' || name === 'sleep') { const c = Math.min(1, u * 2); P.wingL.rotation.z -= .6 * c; P.wingR.rotation.z += .6 * c; }
      if (name === 'spit' || name === 'chomp') { P.head.rotation.x += .25 * k; P.head.position.z += .03 * k; }
    },
  };

  // ---------- Scarecrown (sheet: a tall straw scarecrow with a crow's head, a crowned hat, a ragged cloak of feathers and
  // straw, a long orange scarf, two little crows perched on its outstretched arms and a pumpkin lantern in its right hand) ----------
  function littleCrow(C, K, parent, name, pos, yaw) {
    const fe = C.M(), cw = C.part(name, parent, pos, [0, yaw, 0]);
    C.build(cw, (b) => {
      C.ell(b, fe, [0, 0, 0], [.034, .032, .05], { tint: (v, n) => K.rgb(n.y > .4 ? FE[2] : FE[0]) });
      for (const x of [-.008, .008]) b.add(featherGeo(K, .06, .03), fe, [x, .004, -.04], K.qDir([1, 0, 0], [x * 6, -.3, -1]), null, { tint: FE[1], ink: .5 });
      for (const x of [-.012, .012]) b.add(K.tube([[x, -.025, .005], [x, -.04, .01]], 3, 4, () => .004), fe, null, null, null, { tint: '#8c8274', ink: .4 });
    });
    for (const sd of [-1, 1]) {
      const w = C.part(name + (sd < 0 ? 'wr' : 'wl'), cw, [sd * .03, .012, .01]);
      C.build(w, (b) => { const g = featherGeo(K, .075, .036); b.add(g, fe, [0, 0, 0], new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd > 0 ? -PI / 2 - .15 : PI / 2 + .15, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, 0, -.25))), null, { tint: byLocal(g, (x, y) => (y > .006 ? FE[2] : FE[0])), ink: .5 }); });
    }
    const hd = C.part(name + 'Head', cw, [0, .035, .036]);
    C.build(hd, (b) => {
      C.ell(b, fe, [0, 0, 0], [.028, .027, .028], { tint: (v, n) => K.rgb(n.y > .4 ? FE[2] : FE[0]) });
      b.add(new THREE.ConeGeometry(.011, .034, 8), fe, [0, -.005, .038], [PI / 2 + .25, 0, 0], [.8, 1, 1], { tint: '#9a9088', ink: .5 });
      for (const sd of [-1, 1]) C.ell(b, C.M('#ffffff', { mat: { emissive: new THREE.Color('#ff7a10'), emissiveIntensity: .8 } }), [sd * .018, .006, .017], [.007, .008, .005], { tint: '#ffb030', ink: .4 });
    });
    for (const sd of [-1, 1]) C.glow(hd, [sd * .022, .006, .02], '#ff8a20', .045);
    return cw;
  }
  CREATURE_DEFS.scarecrown = {
    height: .86, eyeY: .63, width: .78, size: 1.25, mouth: [0, -.032, .125],
    build(C, K) {
      const fe = C.M(), straw = C.M(), cloth = C.M(), patch = C.M(), twine = C.M(), skin = featherSkin(C, FE[0], '#5a4a3c'), rr = seeded(5);
      const sq = K.slab([[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], .005, .0015);
      const strip = K.slab([[-.5, 0], [.5, 0], [.46, -.4], [.28, -.74], [0, -1], [-.26, -.72], [-.46, -.38]], .006, .002);
      const stripTint = (k) => (k < .56 ? FE[k < .3 ? 0 : 1] : k < .94 ? ST[k < .7 ? 1 : k < .82 ? 0 : 2] : '#8a6a3a');
      // the cloak: a long bell from the neck to the knees, hung with layers of ragged feathers and straw
      const PROF = [[0, .6], [.06, .595], [.11, .57], [.145, .52], [.165, .44], [.19, .34], [.22, .24], [.24, .16], [.22, .14], [.1, .13], [0, .13]], SZ = .72;
      const cloakR = (y) => { for (let i = 1; i < 7; i++) { const a = PROF[i], c = PROF[i + 1]; if (y <= a[1] && y >= c[1]) return a[0] + (c[0] - a[0]) * (a[1] - y) / (a[1] - c[1]); } return .12; };
      const body = C.part('body', null, [0, 0, 0]);
      C.build(body, (b) => {
        b.add(K.lathe(PROF, 30, { sz: SZ }), skin);
        for (const [y, n, L, w] of [[.575, 13, .12, .05], [.5, 15, .14, .052], [.42, 17, .15, .054], [.34, 19, .16, .055], [.26, 21, .17, .055]]) {
          for (let i = 0; i < n; i++) {
            const a = (i + (n % 2) * .5 + (rr() - .5) * .4) / n * TAU, r = cloakR(y), dr = (cloakR(y - .05) - r) / .05;
            const out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a) * SZ).normalize(), p = [Math.sin(a) * r, y, Math.cos(a) * r * SZ];
            const upT = new THREE.Vector3(-out.x * dr, 1, -out.z * dr).normalize(), nrm = out.clone().addScaledVector(upT, -out.dot(upT)).normalize();
            const up = upT.clone().multiplyScalar(-1).addScaledVector(nrm, .32).normalize().multiplyScalar(-1);
            const L_ = L * (.85 + rr() * .3);
            b.add(strip, fe, p, aim(up.toArray(), nrm.toArray()), [w * (.85 + rr() * .3), L_, 1], { tint: stripTint(rr()), ink: .45 });
          }
        }
        for (const [x, y, w] of [[-.07, .43, .04], [.06, .32, .036], [-.12, .25, .034], [.1, .5, .03]]) { const a = Math.asin(x / cloakR(y)), r = cloakR(y) + .028; b.add(sq, patch, [Math.sin(a) * r, y, Math.cos(a) * r * SZ + .01], [0, a * .8, .15 * (rr() - .5)], [w, w, 1], { tint: '#6e7a2a', ink: .55 }); }
        b.add(new THREE.TorusGeometry(.075, .024, 8, 26), cloth, [0, .575, .015], [PI / 2 + .2, 0, 0], [1, 1.12, 1], { tint: (v, n) => K.rgb(n.y > .3 ? '#f08a34' : '#d0621c') });
      });
      // the scarf's long end, down its front on its left
      const scarf = C.part('scarf', null, [.035, .56, .1]);
      C.build(scarf, (b) => {
        b.add(K.tube([[0, 0, 0], [.035, -.08, .045], [.07, -.18, .07], [.1, -.29, .085], [.125, -.4, .085]], 20, 8, (t) => .042 + .008 * t, .25), cloth, null, null, null, { tint: (v, n, i) => K.rgb(Math.floor(i / 9) % 5 === 2 ? '#c85a1a' : n.z > 0 ? '#ec7c2a' : '#c85a1a') });
        b.add(K.slab([[-.03, 0], [.03, 0], [.034, -.03], [.018, -.05], [.006, -.03], [-.008, -.055], [-.03, -.03]], .008, .002), cloth, [.125, -.395, .085], [0, 0, -.18], null, { tint: '#e06e24' });
      });
      // straw legs bound with twine, grey bird feet with long talons
      for (const sd of [-1, 1]) {
        const lg = C.part(sd < 0 ? 'legR' : 'legL', null, [sd * .085, .17, 0]);
        C.build(lg, (b) => {
          b.add(new THREE.CylinderGeometry(.036, .03, .13, 14, 1), straw, [0, -.06, 0], null, null, { tint: (v, n) => { const a = Math.atan2(n.x, n.z); return K.rgb(Math.floor((a + PI) / TAU * 14) % 2 ? ST[1] : ST[2]); } });
          for (const y of [-.02, -.095]) b.add(new THREE.TorusGeometry(.036, .007, 5, 18), twine, [0, y, 0], [PI / 2, 0, 0], null, { tint: '#8a5a2a', ink: .4 });
          for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .3; b.add(K.BOXG, straw, [Math.sin(a) * .036, -.13, Math.cos(a) * .036], aim([Math.sin(a) * .5, -1, Math.cos(a) * .5], [Math.sin(a), 0, Math.cos(a)]), [.01, .04, .004], { tint: ST[i % 4], ink: .35 }); }
          b.add(K.tube([[0, -.12, .0], [0, -.155, .006]], 3, 6, () => .013), fe, null, null, null, { tint: '#8c8274', ink: .6 });
        });
        crowFeet(C, K, lg, -.163, 1.3);
      }
      // the arms, held out: ragged sleeves, grey claws for hands
      for (const sd of [-1, 1]) {
        const arm = C.part(sd < 0 ? 'armR' : 'armL', null, [sd * .12, .535, .0], [0, 0, sd * -.08]);
        C.build(arm, (b) => {
          b.add(K.tube([[0, 0, 0], [sd * .12, -.004, .01], [sd * .235, -.01, .02]], 12, 10, (t) => .056 - .018 * t), fe, null, null, null, { tint: (v, n) => K.rgb(n.y > .4 ? FE[2] : FE[0]) });
          for (let i = 0; i < 8; i++) { const x = sd * (.015 + .03 * i), L = .17 + .05 * Math.sin(i * 1.7 + 1) + .05 * (i < 4 ? 1 : 0); b.add(strip, fe, [x, -.02, .038 - .008 * (i % 2)], aim([sd * .2, 1, -.25], [0, 0, 1]), [.054, L, 1], { tint: stripTint(((i * .37 + (sd > 0 ? .2 : 0)) % 1)), ink: .45 }); b.add(strip, fe, [x + sd * .015, -.02, -.035], aim([sd * .15, 1, .25], [0, 0, -1]), [.044, L * .9, 1], { tint: stripTint(((i * .53 + .4) % 1)), ink: .45 }); }
          for (let i = 0; i < 5; i++) { const x = sd * (.03 + .045 * i); b.add(strip, fe, [x, .035, .0], aim([sd * .9, .3, 0], [0, 1, 0]), [.04, .07, 1], { tint: stripTint(((i * .61 + .1) % 1)), ink: .45 }); }
          for (let i = 0; i < 5; i++) { const a = (i - 2) * .5; b.add(strip, fe, [sd * .225, -.01 + Math.sin(a) * .03, .02 + Math.cos(a) * .03], aim([-sd, -.6, 0], [0, Math.sin(a), Math.cos(a)]), [.04, .08, 1], { tint: stripTint(((i * .43 + .3) % 1)), ink: .45 }); }
          C.ell(b, fe, [sd * .25, -.014, .022], [.02, .018, .02], { tint: '#8c8274', ink: .5 });
          for (const d of [-1, 0, 1]) b.add(K.tube([[sd * .255, -.014, .022 + d * .012], [sd * .275, -.02, .026 + d * .014], [sd * .28, -.038, .024 + d * .012]], 5, 5, () => .0065), fe, null, null, null, { tint: '#8c8274', ink: .5 });
        });
        const cw = littleCrow(C, K, arm, sd < 0 ? 'crowR' : 'crowL', [sd * .215, .1, .01], sd < 0 ? .7 : -.7); cw.scale.setScalar(1.4); cw.userData.rest.s.setScalar(1.4);
      }
      // the pumpkin lantern, hung from its right hand on a twist of rope
      const lan = C.part('lantern', C.parts.armR, [-.272, -.034, .024]);
      const pumpkin = selfLit(C.paint(256, 128, (g, W, H) => {
        g.fillStyle = '#ee8420'; g.fillRect(0, 0, W, H); g.fillStyle = '#c85e14'; for (let i = 0; i < 8; i++) g.fillRect(((i + .5) / 8 + 1 / 16) * W - 3, 0, 6, H);
        g.fillStyle = '#ffd860'; const fx = W * .5;
        const tri = (x, y, w, h) => { g.beginPath(); g.moveTo(x - w, y + h); g.lineTo(x + w, y + h); g.lineTo(x, y - h); g.closePath(); g.fill(); };
        tri(fx - 18, H * .42, 10, 9); tri(fx + 18, H * .42, 10, 9); tri(fx, H * .53, 5, 5);
        g.beginPath(); g.moveTo(fx - 34, H * .6); for (let i = 0; i <= 8; i++) g.lineTo(fx - 34 + i * 8.5, H * (i % 2 ? .66 : .62)); g.lineTo(fx + 34, H * .6); for (let i = 8; i >= 0; i--) g.lineTo(fx - 34 + i * 8.5, H * (i % 2 ? .74 : .79)); g.closePath(); g.fill();
      }), .9, KIT.canvasTex(256, 128, (g, W, H) => {
        g.fillStyle = '#2a1206'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffe070'; const fx = W * .5;
        const tri = (x, y, w, h) => { g.beginPath(); g.moveTo(x - w, y + h); g.lineTo(x + w, y + h); g.lineTo(x, y - h); g.closePath(); g.fill(); };
        tri(fx - 18, H * .42, 10, 9); tri(fx + 18, H * .42, 10, 9); tri(fx, H * .53, 5, 5);
        g.beginPath(); g.moveTo(fx - 34, H * .6); for (let i = 0; i <= 8; i++) g.lineTo(fx - 34 + i * 8.5, H * (i % 2 ? .66 : .62)); g.lineTo(fx + 34, H * .6); for (let i = 8; i >= 0; i--) g.lineTo(fx - 34 + i * 8.5, H * (i % 2 ? .74 : .79)); g.closePath(); g.fill();
      }));
      C.build(lan, (b) => {
        b.add(K.tube([[0, 0, 0], [.004, -.03, 0], [-.003, -.06, 0], [0, -.075, 0]], 8, 5, () => .006), twine, null, null, null, { tint: '#b08850', ink: .5 });
        b.add(K.lathe([[0, .062], [.035, .06], [.068, .038], [.08, 0], [.07, -.036], [.04, -.058], [0, -.06]], 32, { fn: (out, a) => { const f = .93 + .07 * Math.abs(Math.cos(4 * a)); out[0] *= f; out[2] *= f; } }), pumpkin, [0, -.14, 0]);
        b.add(K.tube([[0, -.082, 0], [.004, -.07, 0], [.012, -.062, 0]], 4, 6, () => .009), twine, null, null, null, { tint: '#5a6a2a', ink: .5 });
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, len = .05 + (i % 3) * .012; b.add(K.BOXG, straw, [Math.sin(a) * .03, -.2 - len * .4, Math.cos(a) * .03], aim([Math.sin(a) * .4, -1, Math.cos(a) * .4], [Math.sin(a), 0, Math.cos(a)]), [.012, len, .004], { tint: ST[i % 4], ink: .35 }); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .4; b.add(K.BOXG, straw, [Math.sin(a) * .02, -.075, Math.cos(a) * .02], aim([Math.sin(a), .5, Math.cos(a)], [0, 1, 0]), [.01, .035, .004], { tint: ST[(i + 1) % 4], ink: .35 }); }
      });
      C.glow(lan, [0, -.14, .07], '#ffb040', .2);
      const head = C.part('head', null, [0, .645, .035]);
      crowHead(C, K, head, [.088, .082, .086], .095);
      const hat = C.part('hat', head, [0, .066, -.02], [-.28, 0, .06]);
      strawHat(C, K, hat, 1.15, true);
    },
    idle(C, t, dt, walk, st) {
      const P = C.parts;
      P.lantern.rotation.z = Math.sin(t * 1.4) * .14; P.lantern.rotation.x = Math.sin(t * 1.1) * .08;
      P.armL.rotation.z += Math.sin(t * 1.2) * .04; P.armR.rotation.z -= Math.sin(t * 1.2 + .6) * .04;
      P.head.rotation.y = crowIdle(C, t, 1.3) * .7; P.head.rotation.z = Math.sin(t * .8) * .04; P.hat.rotation.z += Math.sin(t * 1.1) * .03;
      P.scarf.rotation.z = Math.sin(t * 1.5) * .05; P.scarf.rotation.x = Math.sin(t * 1.1) * .04;
      P.crowLHead.rotation.y = crowIdle(C, t + 3, .8); P.crowRHead.rotation.y = crowIdle(C, t + 7, .9);
      P.crowL.position.y += Math.abs(Math.sin(t * 2.3)) * .004; P.crowR.position.y += Math.abs(Math.sin(t * 2.1 + 1)) * .004;
      const ff = Math.pow(Math.max(0, Math.sin(t * .9)), 30) * Math.sin(t * 40) * .5; P.crowLwl.rotation.z += ff; P.crowLwr.rotation.z -= ff;
      if (walk > 0) { const s = Math.sin(st.walkPh) * .4; P.legL.rotation.x = s; P.legR.rotation.x = -s; P.lantern.rotation.x += s * .4; }
    },
    act(C, name, u) {
      const P = C.parts, k = Math.sin(u * PI);
      if (['attack', 'cast', 'happy', 'roar', 'puff', 'scareflap', 'maneflare'].includes(name)) { const f = Math.sin(u * TAU * 2) * .3 * k; P.armL.rotation.z += f + .2 * k; P.armR.rotation.z -= f + .2 * k; P.lantern.rotation.z += .5 * k; }
      if (['hit', 'roar', 'scareflap', 'happy', 'attack', 'shake'].includes(name)) {
        const f = Math.sin(u * TAU * 5) * .8 * k;
        for (const c of ['crowL', 'crowR']) { P[c].position.y += .03 * k; P[c + 'wl'].rotation.z += f; P[c + 'wr'].rotation.z -= f; }
      }
      if (name === 'curl' || name === 'tuck' || name === 'shadowsink') { const c = name === 'curl' ? k : Math.min(1, u * 3); P.armL.rotation.y -= .7 * c; P.armR.rotation.y += .7 * c; P.armL.rotation.z -= .4 * c; P.armR.rotation.z += .4 * c; }
      if (name === 'faint' || name === 'sleep') { const c = Math.min(1, u * 2); P.armL.rotation.z -= .5 * c; P.armR.rotation.z += .5 * c; }
    },
  };
})();
