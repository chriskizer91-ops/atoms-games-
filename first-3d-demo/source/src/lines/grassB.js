// lines/grassB.js: the Grassland's Pebblepup line (Pebblepup, Boulderhound, Cragmastiff) and Dewt line (Dewt, Monsoonewt,
// Typhoonewt), built from their turnaround sheets. Each line shares one builder that grows with the stage, so a family
// reads as one creature growing up.
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const K0 = KIT;
  const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const sin01 = (u) => Math.sin(Math.min(1, Math.max(0, u)) * PI);
  const sm = K0.sm;
  // a rounded, faceted stone (welded so its ink stays whole)
  const STONE = (() => { const g = K0.mergeVerts(new THREE.DodecahedronGeometry(1, 0)); g.computeVertexNormals(); return g; })();
  const GEM = (() => { const g = K0.mergeVerts(new THREE.OctahedronGeometry(1, 0)); g.computeVertexNormals(); return g; })();
  const BLOCK = K0.rbox(1, 1, 1, .26, 2);
  const stoneTint = (cols) => (v, n) => K0.rgb(n.y > .55 ? cols[0] : n.y > -.15 ? cols[1] : cols[2]);
  const GREY = ['#8e8e98', '#686872', '#474751'];
  const GREY2 = ['#9c9894', '#76726e', '#52504e'];
  // a stone lying on an ellipsoid (centre C0, radii R) at azimuth az, elevation el; s its size; o.h its height off the surface
  function stoneOn(b, mat, C0, R, az, el, s, o) {
    o = o || {};
    const { p, n } = K0.onBall(C0, R, az, el, -s * (o.sink === undefined ? .2 : o.sink));
    const q = K0.qDir([0, 1, 0], n); q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.tw || (az * 3.1 + el * 5.3)));
    b.add(o.geo || STONE, mat, p, q, [s * (o.w || 1), s * (o.h || .45), s * (o.d || 1)], { tint: stoneTint(o.cols || GREY), ink: o.ink === undefined ? .6 : o.ink });
  }
  // a stone at a point, its up along n
  function stoneAt(b, mat, p, n, s, o) {
    o = o || {};
    const q = K0.qDir([0, 1, 0], n); q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.tw || 0));
    b.add(o.geo || STONE, mat, p, q, Array.isArray(s) ? s : [s, s * (o.h || .6), s], { tint: stoneTint(o.cols || GREY), ink: o.ink === undefined ? .6 : o.ink });
  }

  // ================= the Pebblepup line =================
  // P: the stage's numbers. Returns the materials and tints for the stage's own extras.
  function dogCore(C, K, P) {
    const m = { fur: C.M(), cream: C.M(), dark: C.M(), stone: C.M(), pink: C.M(), ear: C.M(), mouth: C.M() };
    const F = P.fur, CR = P.cream, E = P.ear;
    const furT = (v, n) => K.rgb(n.y > .45 ? F[0] : n.y > -.35 ? F[1] : F[2]);
    const creamT = (v, n) => K.rgb(n.y > .35 ? CR[0] : n.y > -.45 ? CR[1] : CR[2]);
    const earT = (v, n) => K.rgb(n.y > .3 ? E[0] : E[1]);
    // the body, level, with a pale bib under the chin
    const body = C.part('body', null, P.body.p);
    C.build(body, (b) => {
      C.ell(b, m.fur, [0, 0, 0], P.body.r, { tint: furT });
      if (P.body.chest) C.ell(b, m.fur, P.body.chest.c, P.body.chest.r, { tint: furT });
      if (P.body.rump) C.ell(b, m.fur, P.body.rump.c, P.body.rump.r, { tint: furT });
      C.ell(b, m.cream, P.bib.c, P.bib.r, { tint: creamT, ink: .5 });
      // a fluffy point under the bib
      b.add(new THREE.ConeGeometry(P.bib.r[0] * .45, P.bib.r[1] * .9, 8), m.cream, [0, P.bib.c[1] - P.bib.r[1] * .85, P.bib.c[2] + P.bib.r[2] * .2], [PI - .3, 0, 0], null, { tint: CR[1], ink: .5 });
    });
    // four legs, pivots at the shoulders and hips; pale paws with toes (and dark claws when grown)
    const L = P.leg;
    for (const [nm, sd, z, back] of [['legFR', -1, L.zF, 0], ['legFL', 1, L.zF, 0], ['legBR', -1, L.zB, 1], ['legBL', 1, L.zB, 1]]) {
      const lg = C.part(nm, null, [sd * L.x, L.top, z]);
      const top = L.top, r = L.r * (back ? 1.06 : 1), pw = L.paw;
      C.build(lg, (b) => {
        b.add(K.lathe([[0, .05], [r * 1.05, .015], [r * .9, -top * .5], [r, -top * .8], [pw[0] * .8, -top + pw[1] * 1.3], [0, -top + pw[1]]], 14), m.fur, null, null, null, { tint: furT });
        if (back) C.ell(b, m.fur, [sd * .008, .01, -.012], L.thigh, { tint: furT });
        C.ell(b, m.cream, [0, -top + pw[1], pw[2] * .3], pw, { tint: creamT, seg: 16, segv: 10 });
        const nt = L.toes || 3;
        for (let i = 0; i < nt; i++) {
          const d = (i - (nt - 1) / 2) / ((nt - 1) / 2);
          C.ell(b, m.cream, [d * pw[0] * .55, -top + pw[1] * .85, pw[2] * 1.05], [pw[0] * (nt > 3 ? .26 : .32), pw[1] * .8, pw[0] * .34], { tint: CR[0], ink: .45, seg: 10, segv: 8 });
          if (L.claw) C.ell(b, m.dark, [d * pw[0] * .55, -top + pw[1] * .55, pw[2] * 1.05 + pw[0] * .3], [pw[0] * .16, pw[1] * .5, pw[0] * .2], { tint: L.claw, ink: .3, seg: 8, segv: 6 });
        }
      });
    }
    // the head: a round skull, a pale muzzle, the nose, a jaw that opens
    const head = C.part('head', null, P.head.p);
    const HR = P.head.r;
    C.build(head, (b) => {
      C.ell(b, m.fur, [0, 0, 0], HR, { tint: furT });
      if (P.cheek) C.ell(b, m.cream, P.cheek.c, P.cheek.r, { tint: creamT, ink: .4 });
      C.ell(b, m.cream, P.muz.c, P.muz.r, { tint: creamT });
      // the inside of the mouth, seen when the jaw drops
      C.ell(b, m.mouth, [0, P.muz.c[1] - P.muz.r[1] * .75, P.muz.c[2] + P.muz.r[2] * .05], [P.muz.r[0] * .78, P.muz.r[1] * .55, P.muz.r[2] * .82], { tint: '#6a1e2a', ink: 0 });
      // the nose: a pebble for the pup (it won't let go of it), a black nose when grown
      const nz = P.muz.c[2] + P.muz.r[2] * .92, ny = P.muz.c[1] + P.muz.r[1] * .45;
      if (P.pebbleNose) stoneAt(b, m.stone, [0, ny, nz], [0, .3, 1], [P.nose[0], P.nose[1], P.nose[2]], { tw: .3, ink: .7 });
      else C.ell(b, m.dark, [0, ny, nz], P.nose, { tint: (v, n) => K.rgb(n.y > .5 ? '#5a5258' : '#2a2228'), ink: .6, seg: 14, segv: 10 });
      // the line down from the nose, and the smile
      const mz = P.muz.c[2] + P.muz.r[2] * .82, my = P.muz.c[1] - P.muz.r[1] * .35, w = P.muz.r[0];
      b.add(K.tube([[0, ny - P.nose[1] * .7, nz - .006], [0, my, mz + .004]], 4, 5, () => .0035), m.dark, null, null, null, { tint: '#3a2420', ink: 0 });
      b.add(K.tube([[-w * .85, my + .01, mz - w * .55], [-w * .4, my - .008, mz - .005], [0, my, mz + .004], [w * .4, my - .008, mz - .005], [w * .85, my + .01, mz - w * .55]], 12, 5, () => .004), m.dark, null, null, null, { tint: '#3a2420', ink: 0 });
      if (P.onHead) P.onHead(b, m, K);
    });
    C.eyePair(head, [0, 0, 0], HR, P.eye.az, P.eye.el, P.eye.size, P.eye.iris, { fwd: .3, tex: P.eye.tex });
    if (P.brow) C.build(head, (b) => { for (const sd of [-1, 1]) { const { p } = K.onBall([0, 0, 0], HR, sd * P.eye.az, P.eye.el + .42, .004); b.add(K.tube([[p[0] + sd * .03, p[1] + .004, p[2] - .012], [p[0], p[1] - .006, p[2]], [p[0] - sd * .028, p[1] - .022, p[2] + .002]], 6, 5, (t) => .008 * (1 - .4 * t)), m.dark, null, null, null, { tint: P.brow, ink: 0 }); } });
    // the jaw, under the muzzle, with the tongue
    const jaw = C.part('jaw', head, [0, P.muz.c[1] - P.muz.r[1] * .55, P.muz.c[2] - P.muz.r[2] * .35]);
    C.build(jaw, (b) => {
      C.ell(b, m.cream, [0, -P.muz.r[1] * .32, P.muz.r[2] * .55], [P.muz.r[0] * .78, P.muz.r[1] * .48, P.muz.r[2] * .8], { tint: creamT, ink: .6 });
      C.ell(b, m.pink, [0, -P.muz.r[1] * .05, P.muz.r[2] * .7], [P.muz.r[0] * .5, P.muz.r[1] * .18, P.muz.r[2] * .55], { tint: '#e8788a', ink: 0 });
      if (P.fangs) for (const sd of [-1, 1]) b.add(new THREE.ConeGeometry(.008, .022, 6), m.cream, [sd * P.muz.r[0] * .5, P.muz.r[1] * .18, P.muz.r[2] * 1.15], null, null, { tint: '#ffffff', ink: .4 });
    });
    jaw.rotation.x = P.jawOpen || 0; jaw.userData.rest.r.x = P.jawOpen || 0;
    // the tongue, hanging out (the pup's flops out over its chin)
    if (P.tongue) {
      const tg = C.part('tongue', head, P.tongue.p, [P.tongue.rx, 0, 0]);
      C.build(tg, (b) => { C.ell(b, m.pink, [0, -P.tongue.r[1] * .8, 0], P.tongue.r, { tint: (v, n) => K.rgb(n.z > .3 ? '#f0889a' : '#d8607a'), ink: .6, seg: 14, segv: 10 }); b.add(K.tube([[0, -.004, P.tongue.r[2] * .95], [0, -P.tongue.r[1] * 1.3, P.tongue.r[2] * .9]], 3, 4, () => .0025), m.dark, null, null, null, { tint: '#b84a62', ink: 0 }); });
    }
    // the ears: big and floppy, hanging from the top of the head, tipped out
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * P.earAt[0], P.earAt[1], P.earAt[2]], [P.earRot[0], sd * P.earRot[1], sd * P.earRot[2]]);
      const inner = new THREE.Group(); inner.rotation.y = -sd * (P.earFace || 0); ear.add(inner);
      C.build(inner, (b) => {
        C.ell(b, m.ear, [sd * .005, -P.earR[1] * .9, 0], P.earR, { tint: earT, seg: 18, segv: 14 });
        if (P.onEar) P.onEar(b, m, sd, K);
      });
    }
    // the tail
    const tail = C.part('tail', null, P.tail.p);
    C.build(tail, (b) => {
      const tT = (v, n) => K.rgb(n.y > .2 || n.z > .5 ? P.tailC[0] : P.tailC[1]), tl = P.tail.pts[P.tail.pts.length - 1], tr = P.tail.r(1);
      b.add(K.tube(P.tail.pts, 20, 12, P.tail.r, P.tail.flat || 1, P.tail.flat ? (c, n) => n.set(1, 0, 0) : undefined), m.fur, null, null, null, { tint: tT });
      C.ell(b, m.fur, tl, [tr * (P.tail.flat || 1), tr, tr], { tint: tT, seg: 12, segv: 8 });
      if (P.onTail) P.onTail(b, m, K);
    });
    return { m, furT, creamT, body, head, tail };
  }
  // shared motion for the line: tail wags, ears flop, legs walk, the head nods
  function dogIdle(C, t, dt, walk, k) {
    const P = C.parts;
    const wag = Math.sin(t * (8 - k * 2)) * (.32 - k * .08) * (1 + walk);
    P.tail.rotation.z = wag; P.tail.rotation.x = Math.sin(t * 1.3) * .06;
    P.head.rotation.z = Math.sin(t * .9) * .06; P.head.rotation.x = Math.sin(t * 1.4) * .04; P.head.position.y += Math.sin(t * 2.4) * .004;
    P.earL.rotation.z += Math.sin(t * 2.2) * .05; P.earR.rotation.z -= Math.sin(t * 2.2 + .6) * .05;
    if (P.tongue) { P.tongue.rotation.x += Math.sin(t * 7) * .08; P.tongue.scale.y *= 1 + .06 * Math.sin(t * 7); }
    if (walk > 0) { const s = Math.sin(C.parts.body.userData.ph = (C.parts.body.userData.ph || 0) + dt * 12 * walk); P.legFR.rotation.x = s * .55; P.legBL.rotation.x = s * .55; P.legFL.rotation.x = -s * .55; P.legBR.rotation.x = -s * .55; P.earL.rotation.z += Math.abs(s) * .12; P.earR.rotation.z -= Math.abs(s) * .12; }
  }
  function dogAct(C, name, u, k) {
    const P = C.parts, b = sin01(u);
    const ears = (a) => { P.earL.rotation.z += a; P.earR.rotation.z -= a; };
    if (name === 'attack') { P.head.position.z += .04 * b; P.jaw.rotation.x += .4 * b; ears(-.3 * b); P.legFL.rotation.x -= .5 * b; P.legFR.rotation.x -= .5 * b; P.legBL.rotation.x += .4 * b; P.legBR.rotation.x += .4 * b; }
    if (name === 'hit') { ears(.45 * b); P.head.rotation.x -= .2 * b; P.tail.rotation.x += .4 * b; }
    if (name === 'roar' || name === 'spit' || name === 'cast') { P.head.rotation.x -= .3 * b; P.jaw.rotation.x += .55 * b; ears(.25 * b); }
    if (name === 'chomp') { P.jaw.rotation.x += .5 * Math.abs(Math.sin(u * TAU * 2)) * (1 - u); P.head.position.z += .03 * b; }
    if (name === 'happy' || name === 'hop' || name === 'puff') { P.tail.rotation.z += Math.sin(u * 50) * .5 * b; ears(.35 * b); P.jaw.rotation.x += .25 * b; }
    if (name === 'shake') { P.head.rotation.y += Math.sin(u * 30) * .3 * (1 - u); ears(Math.sin(u * 30) * .3); }
    if (name === 'curl' || name === 'tuck' || name === 'crouch') { const q = name === 'curl' ? b : Math.min(1, u * 3); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) { P[l].scale.y *= 1 - .45 * q; } P.head.position.y -= .04 * q; P.head.rotation.x += .25 * q; P.tail.rotation.x += .4 * q; }
    if (name === 'sleep') { P.head.rotation.x += .35; P.head.position.y -= .05; ears(-.15); P.tail.rotation.x += .6; for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].scale.y *= .6; }
    if (name === 'faint') { ears(-.3 * Math.min(1, u * 2)); }
    if (name === 'spin') { P.tail.rotation.z += .6 * b; ears(.4 * b); }
    // Rock Fetch: nose down to grab the rock, then a toss of the head
    if (name === 'rockfetchdip') { const q = sm(0, .6, u); P.head.rotation.x += .55 * q; P.head.position.z += .03 * q; P.head.position.y -= .06 * q; P.jaw.rotation.x += .5 * Math.sin(Math.min(1, u * 1.5) * PI); P.tail.rotation.z += Math.sin(u * 40) * .4; }
    if (name === 'rockfetchfling') { const a = sm(0, .45, u) * (1 - sm(.45, .6, u)), c = sm(.45, .58, u) * (1 - sm(.7, 1, u)); P.head.rotation.x += -.6 * a + .45 * c; P.jaw.rotation.x += .55 * c; ears(.35 * a - .3 * c); P.tail.rotation.z += Math.sin(u * 40) * .3; }
    if (name === 'dewdropstretch') { ears(-.5); }
  }
  // stones scattered over an ellipsoid, a fixed pattern per seed
  function scatterStones(b, mat, C0, R, list, o) { for (const [az, el, s] of list) stoneOn(b, mat, C0, R, az, el, s, o); }

  // ---------- Pebblepup (sheet: a taupe puppy standing four-square, grey stone patches in its fur and on its big floppy
  // ears, a pale muzzle and bib, a pebble for a nose, tongue out, a curled-up tail) ----------
  const PUP = {
    fur: ['#9c8876', '#857262', '#66574a'], cream: ['#eedcbc', '#dcc4a0', '#bea27e'], ear: ['#87735f', '#6c5b4c'], tailC: ['#c8ae8c', '#a88f72'],
    body: { p: [0, .235, -.01], r: [.135, .12, .24], rump: { c: [0, .01, -.14], r: [.125, .11, .1] } },
    bib: { c: [0, .04, .19], r: [.08, .09, .065] },
    head: { p: [0, .44, .2], r: [.135, .125, .125] },
    cheek: { c: [0, -.065, .055], r: [.1, .055, .085] },
    muz: { c: [0, -.042, .108], r: [.07, .05, .078] }, nose: [.034, .028, .026], pebbleNose: true,
    eye: { az: .52, el: .03, size: [.046, .056, .017], iris: ['#1e0e06', '#5a2e14', '#a0602e'] },
    tongue: { p: [.004, -.088, .175], rx: -.25, r: [.026, .036, .012] },
    jawOpen: .12,
    earAt: [.1, .095, -.01], earRot: [-.05, 0, .62], earFace: .75, earR: [.03, .13, .088],
    leg: { x: .088, zF: .14, zB: -.16, top: .19, r: .046, thigh: [.062, .085, .08], paw: [.05, .027, .06] },
    tail: { p: [0, .3, -.225], pts: [[0, -.03, .045], [0, .05, -.03], [0, .14, -.055], [0, .205, -.03], [0, .22, .02], [0, .19, .055]], r: (t) => .043 * (1 - .45 * t) + .008 },
  };
  PUP.onHead = (b, m) => {
    const HR = PUP.head.r;
    stoneOn(b, m.stone, [0, 0, 0], HR, 0, 1.12, .06, { tw: .4, h: .55 });
    stoneOn(b, m.stone, [0, 0, 0], HR, 2.6, .9, .03);
    stoneOn(b, m.stone, [0, 0, 0], HR, -2.4, .55, .026);
  };
  PUP.onEar = (b, m, sd) => {
    for (const [y, z, s] of [[-.075, .028, .036], [-.165, -.025, .04], [-.215, .04, .026], [-.11, -.05, .022]]) stoneAt(b, m.stone, [sd * .03, y, z], [sd, 0, 0], s, { h: .55, tw: y * 30 });
  };
  PUP.onTail = (b, m) => { for (const [p, n, s] of [[[0, .1, -.08], [0, .2, -1], .022], [[.0, .19, -.065], [0, .6, -1], .018], [[0, .03, -.05], [0, .4, -1], .02]]) stoneAt(b, m.stone, p, n, s); };
  CREATURE_DEFS.pebblepup = {
    height: .6, eyeY: .45, width: .4, size: 1, mouth: [0, -.07, .2],
    build(C, K) {
      const d = dogCore(C, K, PUP), BR = PUP.body.r;
      C.build(d.body, (b) => {
        scatterStones(b, d.m.stone, [0, 0, 0], BR, [
          [1.25, .4, .052], [1.8, .55, .06], [2.35, .25, .05], [1.55, -.15, .042], [2.7, .7, .036], [1.05, -.05, .03], [2.05, -.3, .034],
          [-1.3, .45, .056], [-1.85, .3, .058], [-2.4, .55, .048], [-1.6, -.2, .04], [-2.75, .2, .036], [-1.0, .1, .03], [-2.15, -.25, .034],
          [PI, 1.3, .07], [.5, 1.2, .034], [-.6, 1.15, .032], [2.9, 1.0, .036], [-2.9, .95, .03],
        ], { h: .6 });
      });
      // a stone on the outside of each leg
      for (const [nm, sd, back] of [['legFR', -1, 0], ['legFL', 1, 0], ['legBR', -1, 1], ['legBL', 1, 1]]) C.build(C.parts[nm], (b) => stoneAt(b, d.m.stone, [sd * .045, back ? -.02 : -.07, .012], [sd, .1, .4], back ? .03 : .024, { tw: sd + back }));
    },
    idle(C, t, dt, walk) { dogIdle(C, t, dt, walk, 0); },
    act(C, name, u) { dogAct(C, name, u, 0); },
  };

  // ---------- Boulderhound (sheet: taller and broad-chested, tan with dark brown ears, boulders on its shoulders, a heart
  // of stone on its chest, a row of rocks from its crown down its spine and tail, a feathery tail, black claws, a grin) ----------
  const HOUND = {
    fur: ['#bc9a6c', '#9e7e56', '#74583a'], cream: ['#e8d2a8', '#d4b88c', '#b0966c'], ear: ['#6e4c32', '#4e3422'], tailC: ['#d4b484', '#b08e62'],
    body: { p: [0, .3, -.03], r: [.15, .128, .27], chest: { c: [0, .025, .13], r: [.16, .148, .15] }, rump: { c: [0, -.005, -.17], r: [.14, .125, .11] } },
    bib: { c: [0, -.02, .25], r: [.1, .11, .06] },
    head: { p: [0, .5, .25], r: [.126, .118, .118] },
    cheek: { c: [0, -.06, .045], r: [.088, .05, .08] },
    muz: { c: [0, -.04, .1], r: [.064, .046, .086] }, nose: [.028, .02, .02],
    eye: { az: .5, el: .07, size: [.034, .036, .013], iris: ['#2a1206', '#6a3a14', '#a8682a'] }, brow: '#3a2418',
    jawOpen: .42, fangs: true,
    earAt: [.095, .075, -.02], earRot: [-.05, 0, .4], earFace: .6, earR: [.03, .12, .075],
    leg: { x: .105, zF: .17, zB: -.19, top: .23, r: .054, thigh: [.074, .1, .095], paw: [.06, .03, .07], toes: 4, claw: '#2a2428' },
    tail: { p: [0, .37, -.29], pts: [[0, -.03, .05], [0, .04, -.06], [0, .12, -.14], [0, .2, -.2], [0, .27, -.22]], r: (t) => .028 + .055 * Math.sin(Math.min(1, t * 1.15) * PI * .85), flat: .45 },
  };
  HOUND.onHead = (b, m) => {
    const HR = HOUND.head.r;
    // the crown of rocks
    for (const [az, el, s] of [[0, 1.0, .06], [0, 1.45, .07], [PI, 1.1, .065], [PI, .6, .055], [.75, .95, .05], [-.75, .95, .05], [2.1, 1.0, .045], [-2.1, 1.0, .045], [1.3, .7, .04], [-1.3, .7, .04]]) stoneOn(b, m.stone, [0, 0, 0], HR, az, el, s, { h: .7, sink: .1 });
  };
  HOUND.onTail = (b, m) => {
    for (const [p, n, s] of [[[0, .07, -.04], [0, 1, -.4], .05], [[0, .14, -.1], [0, 1, -.6], .046], [[0, .21, -.155], [0, 1, -.8], .04], [[0, .27, -.19], [0, 1, -.6], .034]]) stoneAt(b, m.stone, p, n, s, { h: .7 });
    // feathery fringe below
    const cv = new THREE.CatmullRomCurve3(HOUND.tail.pts.map((p) => new THREE.Vector3(...p)));
    for (let i = 0; i < 7; i++) { const t = .25 + i * .11, p = cv.getPointAt(t), r = HOUND.tail.r(t); for (const sd of [-1, 1]) b.add(new THREE.ConeGeometry(.02, .07, 5), m.fur, [sd * .01, p.y - r * .5, p.z - r * .9], [-2.2 + t * .5, 0, sd * .25], null, { tint: HOUND.tailC[i % 2], ink: .5 }); }
  };
  CREATURE_DEFS.boulderhound = {
    height: .68, eyeY: .52, width: .5, size: 1.15, mouth: [0, -.07, .18],
    build(C, K) {
      const d = dogCore(C, K, HOUND), BR = HOUND.body.r, m = d.m;
      C.build(d.body, (b) => {
        // the shoulder boulders, the chest heart, the spine
        for (const sd of [-1, 1]) b.add(BLOCK, m.stone, [sd * .175, .03, .17], [.15, sd * .35, sd * -.12], [.14, .2, .2], { tint: stoneTint(GREY), ink: .8 });
        for (const sd of [-1, 1]) stoneAt(b, m.stone, [sd * .245, .07, .19], [sd, .5, .3], [.06, .03, .07], { cols: GREY2 });
        const heart = K.slab([[0, -.075], [.075, -.01], [.085, .035], [.05, .06], [0, .035], [-.05, .06], [-.085, .035], [-.075, -.01]], .03, .012);
        b.add(heart, m.stone, [0, -.005, .292], [-.15, 0, 0], null, { tint: (v, n) => K.rgb(n.y > .4 ? GREY2[0] : n.z > .7 ? '#8c8882' : GREY2[2]), ink: .7 });
        const sp = [[0, .15, .17, .065], [0, .15, .08, .075], [0, .145, -.02, .08], [0, .14, -.11, .078], [0, .13, -.2, .07], [.08, .12, .1, .05], [-.08, .12, .1, .05], [.075, .115, -.06, .05], [-.075, .115, -.06, .05]];
        for (const [x, y, z, s] of sp) stoneAt(b, m.stone, [x, y, z], [x * 4, 1, 0], s, { h: .75, tw: z * 20 });
        for (const sd of [-1, 1]) for (const [az, el, s] of [[1.75, .3, .04], [2.2, .05, .042], [1.5, -.25, .034], [2.6, .4, .036]]) stoneOn(b, m.stone, [0, 0, 0], BR, sd * az, el, s, { geo: GEM, w: .7, h: .35, d: 1.1, tw: 0, cols: GREY2 });
      });
      for (const [nm, sd, back] of [['legFR', -1, 0], ['legFL', 1, 0], ['legBR', -1, 1], ['legBL', 1, 1]]) C.build(C.parts[nm], (b) => stoneAt(b, m.stone, [sd * .05, back ? -.03 : -.1, .02], [sd, 0, .5], [.022, .014, .034], { geo: GEM, cols: GREY2 }));
    },
    idle(C, t, dt, walk) { dogIdle(C, t, dt, walk, 1); },
    act(C, name, u) { dogAct(C, name, u, 1); },
  };

  // ---------- Cragmastiff (sheet: huge and shaggy, cream fur in tufts, a helmet of rock, blocks on its chest and shoulders,
  // a mossy crag on its back with little pine trees and a waterfall running down to its tail) ----------
  const MAST = {
    fur: ['#e4c08a', '#c89e66', '#9a7446'], cream: ['#f2dcb2', '#dcc092', '#b89a6c'], ear: ['#6e4a30', '#4e3420'], tailC: ['#e0bc86', '#c09a64'],
    body: { p: [0, .3, -.03], r: [.215, .17, .31], chest: { c: [0, .03, .17], r: [.215, .175, .16] }, rump: { c: [0, 0, -.2], r: [.19, .15, .13] } },
    bib: { c: [0, -.03, .3], r: [.12, .13, .06] },
    head: { p: [0, .54, .32], r: [.155, .145, .14] },
    cheek: { c: [0, -.065, .045], r: [.1, .058, .09] },
    muz: { c: [0, -.045, .108], r: [.072, .052, .088] }, nose: [.032, .023, .022],
    eye: { az: .5, el: .07, size: [.033, .032, .013], iris: ['#4a2a08', '#a8641a', '#e0a040'] }, brow: '#3a2418',
    jawOpen: .38, fangs: true,
    earAt: [.108, .065, -.02], earRot: [-.05, 0, .3], earFace: .6, earR: [.034, .14, .08],
    leg: { x: .145, zF: .21, zB: -.23, top: .17, r: .072, thigh: [.09, .1, .11], paw: [.074, .034, .084], toes: 4, claw: '#2a2428' },
    tail: { p: [0, .4, -.34], pts: [[0, -.03, .06], [0, .06, -.06], [0, .19, -.11], [0, .32, -.07], [0, .37, .02], [0, .33, .08]], r: (t) => .05 + .05 * Math.sin(Math.min(1, t * 1.1) * PI * .8), flat: .6 },
  };
  MAST.onHead = (b, m) => {
    const HR = MAST.head.r;
    // the rock helmet, peaked at the top
    for (const [az, el, s, h] of [[0, .95, .065, .6], [0, 1.4, .075, 1.0], [.6, 1.1, .062, .8], [-.6, 1.1, .062, .8], [1.15, .8, .056, .7], [-1.15, .8, .056, .7], [PI, 1.1, .065, .8], [2.2, .9, .055, .7], [-2.2, .9, .055, .7], [1.55, .25, .045, .6], [-1.55, .25, .045, .6], [.35, .62, .04, .5], [-.35, .62, .04, .5]]) stoneOn(b, m.stone, [0, 0, 0], HR, az, el, s, { h, sink: .1, cols: GREY2 });
    b.add(GEM, m.stone, [0, HR[1] + .07, -.01], [0, .5, 0], [.05, .07, .05], { tint: stoneTint(GREY2), ink: .7 });
    shag(b, m.fur, [0, 0, 0], HR, 30, 7, { el0: -.9, el1: .2, skipFront: .7, len: .07, r: .028, cols: MAST.fur });
  };
  MAST.onTail = (b, m) => {
    const cv = new THREE.CatmullRomCurve3(MAST.tail.pts.map((p) => new THREE.Vector3(...p))), rr = rng(5);
    for (let i = 0; i < 26; i++) { const t = .08 + i * .034, p = cv.getPointAt(t), tg = cv.getTangentAt(t); const sd = i % 2 ? 1 : -1, n = new THREE.Vector3(sd * .8, -tg.z, tg.y).normalize(); const r = MAST.tail.r(t); b.add(new THREE.ConeGeometry(.032, .1, 5), m.fur, [p.x + n.x * r * .6, p.y + n.y * r, p.z + n.z * r], K0.qDir([0, 1, 0], [n.x, n.y - .3, n.z - .3]), null, { tint: K0.rgb(MAST.fur[rr() < .5 ? 0 : 1]), ink: .45 }); }
    for (const [p, n, s] of [[[0, .1, -.1], [0, .5, -1], .036], [[0, .22, -.12], [0, .3, -1], .032]]) stoneAt(b, m.stone, p, n, s, { h: .7, cols: GREY2 });
  };
  // shaggy tufts over an ellipsoid: n of them, pointing out and down
  function shag(b, mat, C0, R, n, seed, o) {
    const rr = rng(seed), down = new THREE.Vector3(0, -1, 0);
    for (let i = 0; i < n; i++) {
      const az = rr() * TAU, el = o.el0 + rr() * (o.el1 - o.el0);
      if (o.skipFront && Math.cos(az) > Math.cos(o.skipFront) && el > -.5) continue;
      if (o.skipBack && Math.cos(az) < -Math.cos(o.skipBack)) continue;
      const { p, n: nn } = K0.onBall(C0, R, az, el, -.01), N = new THREE.Vector3(...nn), dir = N.clone().multiplyScalar(.6).add(down.clone().multiplyScalar(.8)).normalize();
      const len = (o.len || .08) * (.75 + rr() * .5);
      b.add(new THREE.ConeGeometry((o.r || .03) * (.8 + rr() * .4), len, 5), mat, [p[0] + dir.x * len * .4, p[1] + dir.y * len * .4, p[2] + dir.z * len * .4], K0.qDir([0, 1, 0], [dir.x, dir.y, dir.z]), null, { tint: K0.rgb(o.cols[Math.floor(rr() * 2)]), ink: .45 });
    }
  }
  CREATURE_DEFS.cragmastiff = {
    height: .8, eyeY: .55, width: .56, size: 1.3, mouth: [0, -.075, .19],
    build(C, K) {
      const d = dogCore(C, K, MAST), BR = MAST.body.r, m = d.m;
      const moss = C.M(), pine = C.M(), wood = C.M();
      // the waterfall: pale stripes that run down it
      const fall = C.paint(64, 64, (g, W, H) => { g.fillStyle = '#7ac8f4'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8f8ff'; for (let i = 0; i < 6; i++) g.fillRect(i * W / 6 + (i % 2) * 3, 0, 4, H); g.fillStyle = '#b4e4ff'; for (let i = 0; i < 4; i++) g.fillRect(0, i * H / 4 + 4, W, 6); });
      fall.emissive = new THREE.Color('#1a5aa0'); fall.emissiveIntensity = .35; fall.userData.e0 = fall.emissive.clone(); fall.userData.i0 = .35; fall.map.repeat.set(3, 1);
      C.fall = fall;
      C.build(d.body, (b) => {
        shag(b, m.fur, [0, 0, 0], BR, 120, 11, { el0: -1.1, el1: .45, len: .09, r: .034, cols: MAST.fur });
        shag(b, m.fur, MAST.body.chest.c, MAST.body.chest.r, 34, 12, { el0: -1.0, el1: .5, skipBack: 1.2, len: .1, r: .036, cols: MAST.fur });
        // blocks on the chest and shoulders
        for (const sd of [-1, 1]) {
          b.add(BLOCK, m.stone, [sd * .19, .05, .2], [.2, sd * .4, sd * -.15], [.13, .16, .15], { tint: stoneTint(GREY2), ink: .8 });
          b.add(BLOCK, m.stone, [sd * .215, -.06, .12], [.1, sd * .5, sd * .2], [.08, .09, .09], { tint: stoneTint(GREY2), ink: .8 });
          b.add(BLOCK, m.stone, [sd * .07, -.03, .315], [.3, sd * .5, .4], [.075, .075, .05], { tint: stoneTint(GREY2), ink: .8 });
          for (const [az, el, s] of [[1.7, .2, .046], [2.2, -.15, .044], [1.4, -.4, .04], [2.6, .1, .04], [1.95, -.5, .036], [1.2, .05, .04]]) stoneOn(b, m.stone, [0, 0, 0], BR, sd * az, el, s, { geo: GEM, w: .7, h: .35, d: 1.1, tw: 0, cols: GREY2 });
        }
        // the crag on its back: stacked boulders, moss, pines
        const crag = [[0, .15, .15, .095, .6], [.06, .17, .05, .115, .7], [-.06, .18, -.04, .115, .7], [.05, .17, -.15, .11, .7], [-.04, .14, -.25, .095, .6],
          [0, .27, .02, .1, .9], [.02, .31, -.09, .105, 1.0], [-.03, .26, -.18, .09, .9], [.0, .38, -.05, .07, 1.1], [.09, .22, -.04, .07, .8], [-.09, .23, -.1, .07, .8]];
        for (const [x, y, z, s, h] of crag) stoneAt(b, m.stone, [x, y, z], [x * 2, 1, z * .5], s, { h, tw: z * 13 + x * 7, cols: GREY2, ink: .7 });
        for (const [x, y, z, r] of [[.05, .37, -.0, .05], [-.06, .33, -.1, .045], [.06, .31, -.19, .04], [-.07, .22, .08, .045], [.07, .24, -.1, .04], [0, .21, .17, .04]]) C.ell(b, moss, [x, y, z], [r, r * .35, r * 1.1], { tint: (v, n) => K.rgb(n.y > .5 ? '#9ac83e' : '#6a9a2a'), ink: .5, seg: 12, segv: 6 });
        for (const [x, y, z, s] of [[.03, .39, -.06, 1.1], [-.07, .34, -.12, .85], [.08, .32, -.2, .75], [-.05, .27, .07, .8]]) {
          b.add(new THREE.CylinderGeometry(.008, .01, .03, 6), wood, [x, y + .01 * s, z], null, s, { tint: '#6a4a2a', ink: .4 });
          for (let k = 0; k < 3; k++) b.add(new THREE.ConeGeometry(.04 * s * (1 - k * .25), .06 * s, 8), pine, [x, y + (.04 + k * .035) * s, z], null, null, { tint: (v, n) => K.rgb(n.y > .45 ? '#4a9a3a' : '#2a6a2a'), ink: .55 });
        }
        // the waterfall, down each side of the crag to the rump, with foam at the foot
        for (const sd of [-1, 1]) {
          const pts = [[sd * .03, .33, -.1], [sd * .09, .27, -.16], [sd * .14, .17, -.24], [sd * .165, .05, -.3], [sd * .16, -.02, -.33]];
          b.add(K.tube(pts, 20, 8, (t) => .045 + .02 * t, .25, (c, n) => n.set(sd, .4, -.3)), fall, null, null, null, { ink: .4 });
          for (const [dx, dy, dz, r] of [[.0, -.03, -.335, .028], [sd * .025, -.04, -.32, .02], [-sd * .02, -.035, -.345, .018]]) C.ell(b, moss, [sd * .16 + dx, dy, dz], [r, r * .8, r], { tint: '#eefaff', ink: .4, seg: 10, segv: 8 });
        }
      });
      for (const [nm, sd, back] of [['legFR', -1, 0], ['legFL', 1, 0], ['legBR', -1, 1], ['legBL', 1, 1]]) C.build(C.parts[nm], (b) => {
        stoneAt(b, m.stone, [sd * .072, back ? -.03 : -.06, .03], [sd, 0, .5], [.026, .016, .04], { geo: GEM, cols: GREY2 });
        stoneAt(b, m.stone, [sd * .02, -.02, .07], [0, 0, 1], [.022, .014, .032], { geo: GEM, cols: GREY2 });
        shag(b, m.fur, [0, -.1, 0], [.075, .05, .08], 10, nm.length * 3 + sd, { el0: -.4, el1: .5, len: .06, r: .026, cols: MAST.fur });
      });
    },
    idle(C, t, dt, walk) { dogIdle(C, t, dt, walk, 2); if (C.fall) C.fall.map.offset.x = -t * .9; },
    act(C, name, u) { dogAct(C, name, u, 2); },
  };
  // ================= the Dewt line =================
  // see-through water: a glassy toon material, paler through the middle, deeper at the edges, with a hard toon glint
  const GLASS = '{ vec3 gN = normalize(normal), gV = normalize(vViewPosition); float gF = 1.0 - abs(dot(gN, gV));\n' +
    ' gl_FragColor.rgb = mix(gl_FragColor.rgb + vec3(0.0, 0.015, 0.03), gl_FragColor.rgb * vec3(0.5, 0.68, 0.95), smoothstep(0.42, 0.95, gF));\n' +
    ' float gS = pow(max(dot(gN, normalize(normalize(vec3(-0.4, 0.75, 0.5)) + gV)), 0.0), 36.0);\n' +
    ' gl_FragColor.rgb += vec3(step(0.6, gS) * 0.55 + smoothstep(0.15, 0.6, gS) * 0.12); }\n';
  function glassM(C, em, ei) {
    const m = C.M('#ffffff', { mat: { emissive: new THREE.Color(em || '#2a6ad8'), emissiveIntensity: ei === undefined ? .12 : ei } });
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh) => { prev(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', GLASS + '#include <dithering_fragment>'); };
    m.customProgramCacheKey = () => 'cc-toon-glassB';
    return m;
  }
  const DROP = K0.lathe([[0, .085], [.016, .06], [.04, .02], [.044, -.01], [.032, -.038], [0, -.048]], 14);
  const BUBT = (v, n) => K0.rgb(n.y > .5 ? '#e4f6ff' : n.y > -.3 ? '#8ccaf4' : '#4e9ae6');
  const bubble = (C, b, mat, p, r) => C.ell(b, mat, p, [r, r, r], { tint: BUBT, ink: .55, seg: 16, segv: 12 });
  // a frill: a scalloped petal of water, pale blue with a white rim
  const PETAL = K0.slab([[0, 0], [.028, .02], [.036, .055], [.026, .085], [0, .1], [-.026, .085], [-.036, .055], [-.028, .02]], .012, .004);
  // tinted by the petal's own vertices (index i), so the white rim stays on the rim however it is turned
  const byIndex = (geo, fn) => { const P = geo.attributes.position, out = []; for (let i = 0; i < P.count; i++) out.push(K0.rgb(fn(P.getX(i), P.getY(i)))); return (v, n, i) => out[i]; };
  const petalT = byIndex(PETAL, (x, y) => Math.abs(x) > .029 || y > .095 ? '#eef8ff' : y > .045 ? '#5aa2ee' : '#3a84e0');
  const WAVE = K0.slab([[0, 0], [-.012, .03], [.0, .06], [.025, .078], [.055, .074], [.07, .058], [.052, .05], [.04, .058], [.028, .046], [.03, .026], [.05, .01], [.08, 0]], .014, .004);
  const waveT = byIndex(WAVE, (x, y) => y > .064 || (y > .044 && x > .036 && x < .062) ? '#eef8ff' : y > .03 ? '#5aa2ee' : '#3a84e0');
  // a spot of white on the skin: a flat little disc
  function spot(C, b, mat, C0, R, az, el, r) { const { p, n } = K0.onBall(C0, R, az, el, -.002); C.ell(b, mat, p, [r, r, r * .3], { rot: new THREE.Euler().setFromQuaternion(K0.qDir([0, 0, 1], n)).toArray(), tint: '#ffffff', ink: 0, seg: 10, segv: 6 }); }
  function newtCore(C, K, P) {
    const m = { skin: glassM(C, P.em, P.ei), bub: glassM(C, '#3a7ae0', .3), cream: C.M('#ffffff', { mat: { emissive: new THREE.Color('#5a6a8a'), emissiveIntensity: .12 } }), dark: C.M(), white: C.M('#ffffff', { mat: { emissive: new THREE.Color('#ffffff'), emissiveIntensity: .35 } }), frill: glassM(C, '#1a4ab0', .1) };
    const S = P.skin, CR = P.cream;
    const skinT = (v, n) => K.rgb(n.y > .45 ? S[0] : n.y > -.45 ? S[1] : S[2]);
    const bodyT = (v, n) => K.rgb(n.y < -.45 ? CR[0] : n.y < -.3 ? CR[1] : n.y > .45 ? S[0] : S[1]);
    const creamT = (v, n) => K.rgb(n.y > -.2 ? CR[0] : CR[1]);
    const body = C.part('body', null, P.body.p);
    C.build(body, (b) => {
      C.ell(b, m.skin, [0, 0, 0], P.body.r, { tint: bodyT });
      C.ell(b, m.cream, P.chest.c, P.chest.r, { tint: creamT, ink: .4 });
      for (const [x, y, z, r] of P.spine) bubble(C, b, m.bub, [x, y, z], r);
      const rr = rng(P.seed || 3);
      for (let i = 0; i < P.spots; i++) spot(C, b, m.white, [0, 0, 0], P.body.r, (rr() < .5 ? -1 : 1) * (.6 + rr() * 2.2), -.2 + rr() * 1.1, P.spotR * (.7 + rr() * .6));
    });
    const L = P.leg;
    for (const [nm, sd, z, back] of [['legFR', -1, L.zF, 0], ['legFL', 1, L.zF, 0], ['legBR', -1, L.zB, 1], ['legBL', 1, L.zB, 1]]) {
      const lg = C.part(nm, null, [sd * L.x, L.y, z]);
      C.build(lg, (b) => {
        const fx = sd * L.out, fy = -L.len + .012, fz = back ? -.005 : .02;
        if (back) C.ell(b, m.skin, [sd * .01, -.005, -.01], L.haunch, { tint: skinT });
        b.add(K.tube([[0, .01, 0], [sd * L.out * .6, -L.len * .4, fz * .5], [fx, fy + .02, fz]], 8, 10, (t) => L.r * (1 - .25 * t)), m.skin, null, null, null, { tint: skinT });
        C.ell(b, m.skin, [fx, fy, fz + .01], [L.r * 1.1, L.r * .45, L.r * 1.1], { tint: skinT, seg: 12, segv: 8 });
        for (let i = 0; i < 4; i++) { const a = (i - 1.5) * .5 + sd * .35, tx = fx + Math.sin(a) * L.r * 1.9, tz = fz + .01 + Math.cos(a) * L.r * 1.9; b.add(K.tube([[fx, fy, fz + .01], [tx, fy - .002, tz]], 3, 6, () => L.r * .32), m.skin, null, null, null, { tint: S[1], ink: .5 }); C.ell(b, m.skin, [tx, fy, tz], [L.r * .45, L.r * .4, L.r * .45], { tint: S[0], ink: .5, seg: 10, segv: 8 }); }
      });
    }
    // the head: big and round, a cream jaw, big eyes, a little smile
    const head = C.part('head', null, P.head.p);
    const HR = P.head.r;
    C.build(head, (b) => {
      C.ell(b, m.skin, [0, 0, 0], HR, { tint: skinT });
      C.ell(b, m.cream, P.jaw.c, P.jaw.r, { tint: creamT, ink: .4 });
      const mo = []; for (let i = 0; i <= 8; i++) { const a = (i / 8 - .5) * .75; mo.push(K.onBall([0, 0, 0], HR, a, P.mouthEl - Math.cos(a * 4) * .05 + .05, .002).p); }
      b.add(K.tube(mo, 14, 5, () => .0042), m.dark, null, null, null, { tint: S[3] || '#123a7a', ink: 0 });
      for (const sd of [-1, 1]) { const { p } = K.onBall([0, 0, 0], HR, sd * .1, P.mouthEl + .2, .001); C.ell(b, m.dark, p, [.006, .004, .004], { tint: S[3] || '#123a7a', ink: 0, seg: 8, segv: 6 }); }
      for (const [x, y, z, r] of P.crest) bubble(C, b, m.bub, [x, y, z], r);
      const rr = rng(P.seed + 7 || 9);
      for (let i = 0; i < (P.headSpots || 0); i++) spot(C, b, m.white, [0, 0, 0], HR, (rr() < .5 ? -1 : 1) * (1.2 + rr() * 1.6), .1 + rr() * .9, P.spotR * .8);
    });
    C.eyePair(head, [0, 0, 0], HR, P.eye.az, P.eye.el, P.eye.size, P.eye.iris, { fwd: .3 });
    // the tail: back, then up into a curl
    const tail = C.part('tail', null, P.tail.p);
    C.build(tail, (b) => {
      const tl = P.tail.pts[P.tail.pts.length - 1], tr = P.tail.r(1);
      b.add(K.tube(P.tail.pts, 36, 12, P.tail.r), m.skin, null, null, null, { tint: bodyT });
      C.ell(b, m.skin, tl, [tr, tr, tr], { tint: S[0], seg: 10, segv: 8 });
      const cv = new THREE.CatmullRomCurve3(P.tail.pts.map((p) => new THREE.Vector3(...p)));
      for (const [t, r] of P.tailBub || []) { const p = cv.getPointAt(t), tg = cv.getTangentAt(t), up = new THREE.Vector3(0, 1, 0).addScaledVector(tg, -tg.y).normalize(), rad = P.tail.r(t); bubble(C, b, m.bub, [p.x + up.x * rad * .85, p.y + up.y * rad * .85, p.z + up.z * rad * .85], r); }
      for (let i = 0; i < (P.tailSpots || 0); i++) { const t = .08 + i * .8 / P.tailSpots, p = cv.getPointAt(t), rad = P.tail.r(t); for (const sd of [-1, 1]) C.ell(b, m.white, [p.x + sd * rad * .97, p.y, p.z], [P.spotR * .3, P.spotR * .8, P.spotR * .8], { tint: '#ffffff', ink: 0, seg: 8, segv: 6 }); }
      if (P.onTail) P.onTail(b, m, cv, K);
    });
    return { m, skinT, body, head, tail, HR };
  }
  function newtIdle(C, t, dt, walk, k) {
    const P = C.parts;
    P.tail.rotation.y = Math.sin(t * 1.6) * (.16 - k * .04) * (1 + walk); P.tail.rotation.x = Math.sin(t * 1.1) * .04;
    P.head.rotation.z = Math.sin(t * .8) * .06; P.head.rotation.x = Math.sin(t * 1.3) * .04; P.head.position.y += Math.sin(t * 2.4) * .005;
    if (walk > 0) { const s = Math.sin(P.body.userData.ph = (P.body.userData.ph || 0) + dt * 12 * walk); P.legFR.rotation.y = s * .5; P.legBL.rotation.y = s * .5; P.legFL.rotation.y = s * .5; P.legBR.rotation.y = s * .5; P.legFR.position.y += Math.max(0, s) * .02; P.legBL.position.y += Math.max(0, s) * .02; P.legFL.position.y += Math.max(0, -s) * .02; P.legBR.position.y += Math.max(0, -s) * .02; P.body.rotation.y = s * .06; }
    if (C.drops) C.drops.forEach((d, i) => { const ph = (t * 1.1 + i / C.drops.length) % 1; d.position.y -= ph * .14; d.scale.setScalar(.9 * Math.min(1, ph * 6) * (1 - sm(.75, 1, ph))); });
    if (P.cloud) { P.cloud.position.y += Math.sin(t * 1.7) * .008; P.cloud.rotation.y = Math.sin(t * .6) * .15; }
    if (P.storm) { P.storm.rotation.y = Math.sin(t * .4) * .06; P.storm.position.y += Math.sin(t * 1.5) * .006; }
    if (C.bolts) { const f = Math.pow(Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.9)), 2); C.bolts.emissiveIntensity = C.bolts.userData.i0 + f * .9; }
  }
  function newtAct(C, name, u, k) {
    const P = C.parts, b = sin01(u);
    if (name === 'attack' || name === 'chomp') { P.head.position.z += .04 * b; P.tail.rotation.x += .3 * b; }
    if (name === 'hit') { P.head.rotation.x -= .25 * b; P.tail.rotation.y += Math.sin(u * 30) * .3 * (1 - u); }
    if (name === 'roar' || name === 'spit' || name === 'cast') { P.head.rotation.x -= .3 * b; P.tail.rotation.x -= .25 * b; }
    if (name === 'happy' || name === 'hop' || name === 'puff' || name === 'spin') { P.tail.rotation.y += Math.sin(u * 30) * .4 * b; }
    if (name === 'shake') P.head.rotation.y += Math.sin(u * 30) * .3 * (1 - u);
    if (name === 'curl' || name === 'tuck' || name === 'crouch' || name === 'sleep') { const q = name === 'curl' ? b : name === 'sleep' ? 1 : Math.min(1, u * 3); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].scale.y *= 1 - .4 * q; P.head.position.y -= .03 * q; P.head.rotation.x += (name === 'sleep' ? .3 : .15) * q; P.tail.rotation.y += .3 * q; }
    if (name === 'dewdropstretch') { P.tail.rotation.x -= .45; P.head.position.z += .03; for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].rotation.x += l[3] === 'F' ? -.6 : .6; }
    if (name === 'rockfetchdip') { P.head.rotation.x += .4 * sm(0, .6, u); }
    if (name === 'rockfetchfling') { P.head.rotation.x += -.5 * sin01(u / .5) + .4 * sin01((u - .45) / .4); }
    if (P.cloud && (name === 'hit' || name === 'hop' || name === 'happy')) P.cloud.position.y += .04 * b;
  }
  // a lumpy cloud: puffs round an ellipse, tinted top to bottom
  function cloudPuffs(C, b, mat, R, n, seed, cols, y0) {
    const rr = rng(seed);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rr() * .3, ring = i % 3 === 0 ? .5 : 1, s = R[1] * (.85 + rr() * .5) * (ring < 1 ? 1.3 : 1) * (n > 12 ? 1.25 : 1); b.add(K0.lumpy(1, i * 1.7, .12), mat, [Math.sin(a) * R[0] * ring, y0 + (ring < 1 ? R[1] * .5 : 0) + (rr() - .5) * R[1] * .4, Math.cos(a) * R[2] * ring], [rr(), rr() * 6, 0], [s * 1.25, s, s * 1.15], { tint: (v, nn) => K0.rgb(nn.y > .45 ? cols[0] : nn.y > -.25 ? cols[1] : cols[2]), ink: .8 }); }
  }


  // the storm cloud: two rings of small puffs round the rim and a fill on top, each outer puff marked with a swirl
  function stormPuffs(C, b, mat, swirlM) {
    const rr = rng(21), cols = ['#9a9aa6', '#6e6e7a', '#484854'], T = (v, n) => K0.rgb(n.y > .45 ? cols[0] : n.y > -.25 ? cols[1] : cols[2]);
    const puff = (p, s, k) => b.add(K0.lumpy(1, k, .1), mat, p, [rr(), rr() * 6, 0], [s * 1.2, s * .9, s * 1.1], { tint: T, ink: .8 });
    for (const [n, rx, rz, y, s0] of [[16, .3, .35, .09, .09], [13, .25, .3, .17, .08], [7, .12, .16, .16, .09]]) for (let i = 0; i < n; i++) {
      const a = i / n * TAU + rr() * .2, s = s0 * (.85 + rr() * .35), p = [Math.sin(a) * rx, y + (rr() - .5) * .02, Math.cos(a) * rz];
      puff(p, s, i * 1.7 + y * 10);
      if (n === 16 && i % 2 === 0) { // a swirl on its outward face
        const nn = new THREE.Vector3(Math.sin(a), .1, Math.cos(a)).normalize(), u = new THREE.Vector3(0, 1, 0).cross(nn).normalize(), w = nn.clone().cross(u), c = new THREE.Vector3(...p).addScaledVector(nn, s * 1.12), pts = [];
        for (let j = 0; j <= 10; j++) { const t = j / 10, ang = t * TAU * 1.2, r = s * .55 * (1 - t * .8); pts.push(c.clone().addScaledVector(u, Math.cos(ang) * r).addScaledVector(w, Math.sin(ang) * r * .8).addScaledVector(nn, -s * .25 * (Math.cos(ang) * r / s) ** 2).toArray()); }
        b.add(K0.tube(pts, 20, 4, () => .0045), swirlM, null, null, null, { tint: '#3a3a46', ink: 0 });
      }
    }
  }

  // ---------- Dewt (sheet: a little newt of clear water, a big round head with a crest of three bubbles, a cream jaw
  // and belly, bubbles down its back, splayed froggy toes, a tail that curls up into a spiral) ----------
  const DEWT = {
    skin: ['#a2d2f4', '#78b8ec', '#5296dc', '#1e4a9a'], cream: ['#f8f2d8', '#e2dcc2'], em: '#2a6ad8', ei: .12, seed: 3,
    body: { p: [0, .165, -.03], r: [.1, .088, .17] }, chest: { c: [0, -.01, .12], r: [.078, .072, .062] },
    head: { p: [0, .31, .17], r: [.158, .128, .13] }, jaw: { c: [0, -.064, .035], r: [.13, .06, .098] }, mouthEl: -.5,
    eye: { az: .47, el: -.04, size: [.042, .052, .016], iris: ['#0a2a8a', '#1e5ad8', '#7ab8ff'] },
    crest: [[0, .132, -.01, .042], [.1, .098, -.07, .034], [-.1, .098, -.07, .034], [0, .085, -.115, .03]],
    spine: [[0, .086, -.03, .03], [0, .078, -.09, .026], [0, .062, -.14, .022]], spots: 10, spotR: .016, headSpots: 3,
    leg: { x: .075, zF: .1, zB: -.12, y: .11, len: .11, out: .03, r: .036, haunch: [.05, .055, .06] },
    tail: { p: [0, .15, -.19], pts: [[0, 0, .03], [0, -.012, -.08], [0, .03, -.16], [0, .12, -.2], [0, .21, -.17], [0, .23, -.1], [0, .19, -.07], [0, .155, -.09], [0, .16, -.13]], r: (t) => .058 * (1 - .78 * t) + .01 },
    tailBub: [[.12, .02], [.24, .018]], tailSpots: 4,
  };
  CREATURE_DEFS.dewt = {
    height: .5, eyeY: .31, width: .36, size: 1, mouth: [0, -.07, .12],
    build(C, K) { newtCore(C, K, DEWT); },
    idle(C, t, dt, walk) { newtIdle(C, t, dt, walk, 0); },
    act(C, name, u) { newtAct(C, name, u, 0); },
  };

  // ---------- Monsoonewt (sheet: deeper blue with white spots, a mane of white-rimmed water frills round the back of its
  // head and down its back and tail, bubbles along its spine, a little grey raincloud dripping over its head) ----------
  const MONS = {
    skin: ['#4c9cee', '#2a76dc', '#1c56bc', '#0e2e7a'], cream: ['#f8f2d8', '#e2dcc2'], em: '#1a4ab0', ei: .12, seed: 5,
    body: { p: [0, .19, -.04], r: [.1, .088, .21] }, chest: { c: [0, -.01, .15], r: [.078, .075, .066] },
    head: { p: [0, .34, .2], r: [.148, .12, .128] }, jaw: { c: [0, -.06, .04], r: [.122, .056, .094] }, mouthEl: -.48,
    eye: { az: .47, el: -.03, size: [.038, .047, .015], iris: ['#0a2a7a', '#1e50c8', '#7ab0ff'] },
    crest: [[0, .122, -.02, .034], [.075, .1, -.075, .03], [-.075, .1, -.075, .03]],
    spine: [[0, .085, .04, .028], [0, .086, -.04, .03], [0, .08, -.11, .027], [0, .066, -.17, .023]], spots: 22, spotR: .013, headSpots: 4,
    leg: { x: .078, zF: .13, zB: -.15, y: .135, len: .135, out: .035, r: .036, haunch: [.052, .058, .064] },
    tail: { p: [0, .18, -.24], pts: [[0, 0, .03], [0, -.01, -.1], [0, .04, -.2], [0, .14, -.26], [0, .25, -.23], [0, .28, -.15], [0, .245, -.11], [0, .205, -.13]], r: (t) => .058 * (1 - .75 * t) + .011 },
    tailBub: [[.15, .022], [.3, .02], [.45, .018], [.58, .016]], tailSpots: 6,
  };
  // the frill mane behind the head and the wave crest along the back and tail
  function mane(b, mat, n, rIn, len, y0, z0, spread, scale) {
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - .5) * spread, dir = [Math.sin(a), Math.cos(a)];
      b.add(PETAL, mat, [dir[0] * rIn, y0 + dir[1] * rIn, z0], [0, 0, -a], [scale * (1 + .15 * Math.cos(a * 2)), len, scale], { tint: petalT, ink: .55 });
    }
  }
  MONS.onTail = (b, m, cv) => { for (let i = 0; i < 6; i++) { const t = .18 + i * .1, p = cv.getPointAt(t), tg = cv.getTangentAt(t), r = MONS.tail.r(t), up = new THREE.Vector3(0, 1, 0).addScaledVector(tg, -tg.y).normalize(); const ang = Math.atan2(-tg.y, -tg.z); b.add(WAVE, m.frill, [p.x, p.y + up.y * r * .6, p.z + up.z * r * .6], [-ang, PI / 2, 0, 'YXZ'], [1.2 - i * .07, 1.2 - i * .07, 1.5], { tint: waveT, ink: .55 }); } };
  CREATURE_DEFS.monsoonewt = {
    height: .64, eyeY: .34, width: .4, size: 1.15, mouth: [0, -.07, .12],
    build(C, K) {
      const d = newtCore(C, K, MONS), m = d.m;
      C.build(d.head, (b) => {
        // the mane: two fans of frills behind the head, one round the sides and one lower
        for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const a = -.3 + i * .38, p = K.onBall([0, 0, 0], d.HR, sd * (1.75 + i * .12), 1.05 - i * .38, -.01).p; b.add(PETAL, m.frill, p, [0, sd * (1.2 + i * .1), sd * -(.9 + a), 'YXZ'], [1.1, 1.05, 1.1], { tint: petalT, ink: .55 }); }
        for (const [x, y, z, r] of [[.06, .03, -.12, .022], [-.06, .03, -.12, .022]]) bubble(C, b, m.bub, [x, y, z], r);
      });
      C.build(d.body, (b) => { for (let i = 0; i < 5; i++) { const z = .1 - i * .065; b.add(WAVE, m.frill, [0, .055 + Math.cos(i * .5) * .01, z - .02], [0, PI / 2, 0], [1.3, 1.2, 1.6], { tint: waveT, ink: .55 }); } });
      // the raincloud, and the drops that fall from it
      const cl = C.part('cloud', null, [0, .575, .17]);
      const cm = C.M('#ffffff', { mat: { emissive: new THREE.Color('#40404c'), emissiveIntensity: .15 } });
      C.build(cl, (b) => cloudPuffs(C, b, cm, [.085, .034, .055], 7, 4, ['#dcdce4', '#b0b0bc', '#86868f'], 0));
      C.drops = [];
      const dm = glassM(C, '#2a6ad8', .35);
      for (let i = 0; i < 3; i++) { const dp = C.part('drop' + i, cl, [(i - 1) * .055, -.05, (i % 2 ? .02 : -.015)]); C.build(dp, (b) => b.add(DROP, dm, null, null, .42, { tint: (v, n) => K.rgb(n.y > .3 ? '#e4f8ff' : '#62b8f4'), ink: .5 })); C.drops.push(dp); }
    },
    idle(C, t, dt, walk) { newtIdle(C, t, dt, walk, 1); },
    act(C, name, u) { newtAct(C, name, u, 1); },
  };

  // ---------- Typhoonewt (sheet: long and blue with a row of white spots, a great rosette of water frills round its head,
  // a long tail curling up into a loop with a rainbow fan at the tip, riding a dark storm cloud that crackles yellow) ----------
  const TYPH = {
    skin: ['#4a9aee', '#2a76dc', '#1c56bc', '#0e2a70'], cream: ['#f8f2d8', '#e2dcc2'], em: '#1a46a8', ei: .12, seed: 8,
    body: { p: [0, .38, -.02], r: [.098, .084, .26] }, chest: { c: [0, -.005, .2], r: [.08, .08, .07] },
    head: { p: [0, .54, .25], r: [.13, .108, .12] }, jaw: { c: [0, -.055, .04], r: [.108, .05, .09] }, mouthEl: -.45,
    eye: { az: .45, el: -.01, size: [.033, .04, .014], iris: ['#0a2470', '#1a48b8', '#6aa0f0'] },
    crest: [[0, .115, -.0, .028]],
    spine: [[0, .083, .1, .022], [0, .086, .02, .024], [0, .085, -.06, .024], [0, .078, -.14, .022], [0, .066, -.21, .02]], spots: 26, spotR: .012, headSpots: 2,
    leg: { x: .08, zF: .17, zB: -.18, y: .34, len: .1, out: .035, r: .034, haunch: [.054, .06, .068] },
    tail: { p: [0, .36, -.27], pts: [[0, 0, .04], [.02, -.02, -.08], [.06, .02, -.17], [.1, .13, -.21], [.12, .26, -.18], [.12, .32, -.09], [.1, .29, -.02]], r: (t) => .056 * (1 - .7 * t) + .012 },
    tailBub: [[.2, .022], [.34, .022], [.48, .02], [.62, .019], [.76, .017]], tailSpots: 7,
  };
  TYPH.onTail = (b, m, cv, K) => {
    // the rainbow fan at the tip, opening forward and up
    const tip = cv.getPointAt(1), cols = ['#f04848', '#f8962a', '#f8e040', '#5ad05a', '#3a9af0', '#9a5ad8'];
    cols.forEach((c, i) => b.add(new THREE.TorusGeometry(.035 + i * .021, .0118, 6, 18, PI * .8), m.cream, [tip.x, tip.y + .005, tip.z + .005], [0, -PI / 2, PI * .15], null, { tint: c, ink: i === 0 || i === 5 ? .6 : .25 }));
    for (let i = 0; i < 4; i++) { const t = .55 + i * .1, p = cv.getPointAt(t), tg = cv.getTangentAt(t), r = TYPH.tail.r(t); b.add(PETAL, m.frill, [p.x - r * .6, p.y, p.z], K.qDir([0, 1, 0], [-1, -tg.z * .5, tg.y * .5]), [1, 1, 1], { tint: petalT, ink: .5 }); }
  };
  CREATURE_DEFS.typhoonewt = {
    height: .8, eyeY: .54, width: .62, size: 1.3, mouth: [0, -.065, .11],
    build(C, K) {
      const d = newtCore(C, K, TYPH), m = d.m;
      C.build(d.head, (b) => {
        // the rosette: a ring of frills round the back of the head, and an inner ring
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; b.add(PETAL, m.frill, [Math.sin(a) * .095, .015 + Math.cos(a) * .085, -.06], [-.75, 0, -a, 'ZXY'], [1.4, 1.5, 1.2], { tint: petalT, ink: .55 }); }
        for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * 3.4; b.add(PETAL, m.frill, [Math.sin(a) * .1, .02 + Math.cos(a) * .09, -.01], [-.2, 0, -a, 'ZXY'], [1.05, 1.1, 1], { tint: petalT, ink: .5 }); }
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .3; b.add(PETAL, m.frill, [Math.sin(a) * .05, .015 + Math.cos(a) * .045, -.1], [-1.3, 0, -a, 'ZXY'], [1.2, 1.3, 1.1], { tint: petalT, ink: .5 }); }
        for (let i = 0; i < 6; i++) { const a = (i / 5 - .5) * 2.2; bubble(C, b, m.bub, [Math.sin(a) * .135, .03 + Math.cos(a) * .115, -.04], .02); }
      });
      C.build(d.body, (b) => { for (let i = 0; i < 6; i++) { const z = .18 - i * .075; b.add(WAVE, m.frill, [0, .05, z - .02], [0, PI / 2, 0], [1.25, 1.15, 1.6], { tint: waveT, ink: .55 }); } });
      // the storm cloud it rides, cracked with yellow
      const storm = C.part('storm', null, [0, 0, -.03]);
      const sm_ = C.M('#ffffff', { mat: { emissive: new THREE.Color('#202030'), emissiveIntensity: .15 } });
      const bolt = C.M('#ffffff', { mat: { emissive: new THREE.Color('#f8c020'), emissiveIntensity: .8 } }); C.bolts = bolt; const swirl = C.M();
      C.build(storm, (b) => {
        stormPuffs(C, b, sm_, swirl);
        const rr = rng(31);
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * TAU + .4, el = -.25 + rr() * .4, R = [.41, .13, .46];
          for (let j = 0; j < 3; j++) { const p0 = K.onBall([0, .11, 0], R, a + (j - 1) * .1, el + (j % 2 ? .2 : -.12), .0).p, p1 = K.onBall([0, .11, 0], R, a + (j - .5) * .1, el + (j % 2 ? -.12 : .2), .0).p; b.add(K.tube([p0, p1], 2, 5, () => .009), bolt, null, null, null, { tint: '#ffe050', ink: .6 }); }
        }
      });
    },
    idle(C, t, dt, walk) { newtIdle(C, t, dt, walk, 2); },
    act(C, name, u) { newtAct(C, name, u, 2); },
  };
})();
