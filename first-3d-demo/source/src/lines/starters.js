// lines/starters.js: the three starters grown up, each grown from its base form's code so a family reads as one creature
// growing up. Drizzlon's line: Rapidrake (standing now, a long neck, a wave at the end of its tail) and Tsunadrake (Water/
// Bolt: wings of breaking waves, lightning down its flanks, a crown of fins). Mossback's: Thornshell (a high dome of leaves,
// vines and thorns over a mossy rim) and Elderoak (Plant/Earth: a stone shell with a little oak growing out of it).
// Embroak's: Cinderfrog (a crest of fire down its back, spotted) and Infernotoad (Fire/Earth: charcoal rock skin, glowing
// lava cracks, a mane of fire).
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  // a smooth curve through [t, value] pairs (radii along tubes)
  const curve = (pairs) => (t) => {
    for (let i = 1; i < pairs.length; i++) if (t <= pairs[i][0]) { const [t0, a] = pairs[i - 1], [t1, b] = pairs[i], k = (t - t0) / (t1 - t0); return a + (b - a) * k * k * (3 - 2 * k); }
    return pairs[pairs.length - 1][1];
  };
  const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  // a point on a tube's surface: at t along pts, on the side away from (or toward, sgn -1) the direction `belly`
  function along(pts, t, rFn, belly, sgn) {
    const cv = new THREE.CatmullRomCurve3(pts.map(V3)), p = cv.getPointAt(t), tg = cv.getTangentAt(t), n = V3(belly);
    n.addScaledVector(tg, -n.dot(tg)).normalize().multiplyScalar(-(sgn || 1));
    const r = rFn(t); return { p: [p.x + n.x * r, p.y + n.y * r, p.z + n.z * r], n: [n.x, n.y, n.z], tg: [tg.x, tg.y, tg.z], c: p, r };
  }
  // a lightning bolt on a canvas: centred at x, y, length len along angle a, width w
  function bolt(g, x, y, len, w, a, fill, edge) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
    const pts = [[-.5, 0], [-.05, -.55], [-.1, -.05], [.5, 0], [.05, .55], [.1, .05]];
    pts.forEach(([u, v], i) => { const px = u * len, py = v * w; if (i) g.lineTo(px, py); else g.moveTo(px, py); });
    g.closePath(); g.fillStyle = fill || '#ffe23a'; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = 2; g.stroke(); }
    g.restore();
  }

  // =====================================================================================================================
  // Drizzlon's line
  // =====================================================================================================================
  const B1 = '#2f8ef0', B2 = '#0b5fca', B3 = '#4fb2f4', MINT = '#84f4e0', PALE = '#c5f6e0', DK = '#123a8a';
  const PAL1 = { B1, B2, B3 }, PAL2 = { B1: '#2366e6', B2: '#0a3aa8', B3: '#3f8ef2' };
  const tintOf = (P) => (v, n) => KIT.rgb(n.y > .5 ? P.B3 : n.y > -.35 ? P.B1 : P.B2), bodyTint = tintOf(PAL1);
  // the long body's skin, painted round a tube (v 0 the belly, .5 the back): a mint belly band with ribs, a lighter back;
  // o.bolts: lightning down the flanks (Tsunadrake)
  function drakeSkin(C, o) {
    o = o || {}; const { B1, B2, B3 } = o.pal || PAL1;
    return C.paint(1024, 256, (g, W, H) => {
      const bw = o.band || .15, gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, PALE); gr.addColorStop(.05, MINT); gr.addColorStop(bw, MINT); gr.addColorStop(bw + .004, B2); gr.addColorStop(.28, B1); gr.addColorStop(.5, B3); gr.addColorStop(.72, B1); gr.addColorStop(1 - bw - .004, B2); gr.addColorStop(1 - bw, MINT); gr.addColorStop(.95, MINT); gr.addColorStop(1, PALE);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#3cc6be'; for (let x = W * .02; x < W; x += W / (o.ribs || 30)) { g.fillRect(x, 0, 4, bw * H); g.fillRect(x, (1 - bw) * H, 4, bw * H); }
      g.fillStyle = DK; g.fillRect(0, bw * H - 2, W, 4); g.fillRect(0, (1 - bw) * H - 2, W, 4);
      if (o.bolts) for (const [u, v, a, l] of o.bolts) for (const vv of [v, 1 - v]) CPAINT.wrap(g, W, (ox) => bolt(g, u * W + ox, vv * H, l * W, H * (o.bw || .09), a * (vv === v ? 1 : -1), '#ffe23a', '#c89a10'));
    });
  }
  // a skin for the thighs and shoulders (sphere uv: .25 its front, 0 and .5 its sides), with a bolt on each side
  const legSkin = (C, bolts, P) => C.paint(256, 128, (g, W, H) => {
    const { B1, B2, B3 } = P || PAL1;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, B3); gr.addColorStop(.4, B1); gr.addColorStop(1, B2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (bolts) for (const u of [0, .5, 1]) bolt(g, u * W, H * .5, H * .7, W * .07, 1.25, '#ffe23a', '#c89a10');
  });

  // the drake's skeleton, shared by Rapidrake and Tsunadrake: d holds the measurements
  function drake(C, K, d) {
    const blue = C.M(), mint = C.M(), horn = C.M(), dark = C.M(), PP = d.pal || PAL1, skin = drakeSkin(C, Object.assign({ pal: PP }, d.skin)), lskin = legSkin(C, d.bolts, PP);
    const { B1, B2, B3 } = PP, bodyTint = tintOf(PP);
    // the body and neck: one tube from the rump, along the back, up the neck into the head
    const body = C.part('body', null, [0, 0, 0]);
    const BP = d.spine, BR = curve(d.spineR), BELLY = [0, -1, 1.2];
    C.build(body, (b) => {
      b.add(K.tube(BP, 48, 22, BR, 1, (c, n) => n.set(...BELLY)), skin, null, null, null, { ink: 1 });
      C.ell(b, blue, BP[0], [BR(0) * 1.02, BR(0) * 1.02, BR(0) * .9], { tint: bodyTint });
      // the pale ovals down its spine, and small mint spikes up the back of the neck
      for (let i = 0; i < d.ovals; i++) { const t = .06 + i * (.56 / d.ovals), a = along(BP, t, BR, BELLY); b.add(new THREE.SphereGeometry(1, 10, 8), mint, a.p, K.qDir([0, 0, 1], a.n), [.016 * d.k, .022 * d.k, .007], { tint: i % 2 ? '#6ad8ec' : '#8ae4f0', ink: .5 }); }
      for (let i = 0; i < (d.neckSpikes === undefined ? 4 : d.neckSpikes); i++) { const t = .72 + i * .065, a = along(BP, t, BR, BELLY); b.add(new THREE.ConeGeometry(.014 * d.k, .035 * d.k, 8), mint, a.p, K.qDir([0, 1, 0], [a.n[0] - a.tg[0] * .6, a.n[1] - a.tg[1] * .6, a.n[2] - a.tg[2] * .6]), null, { tint: '#3fc8ea', ink: .5 }); }
    });
    // four legs: shoulders and thighs, white claws
    for (const [nm, sd, front] of [['legFR', -1, 1], ['legFL', 1, 1], ['legBR', -1, 0], ['legBL', 1, 0]]) {
      const L = front ? d.front : d.hind, lg = C.part(nm, null, [sd * L.x, L.y, L.z]);
      C.build(lg, (b) => {
        C.ell(b, lskin, [0, -.02, 0], L.top, { rot: [0, sd < 0 ? PI : 0, 0] });
        b.add(K.tube(L.shin.map(([x, y, z]) => [sd * x, y, z]), 12, 12, curve(L.r)), blue, null, null, null, { tint: (v, n) => K.rgb(n.y < -.5 || n.z < -.6 ? B2 : n.y > .5 ? B3 : B1) });
        const f = L.shin[L.shin.length - 1];
        C.ell(b, blue, [sd * f[0], f[1] - .012, f[2] + .022], [.038 * d.k, .02 * d.k, .05 * d.k], { tint: B1 });
        for (const dd of d.claws || [-1, 0, 1]) C.ell(b, horn, [sd * f[0] + dd * .02 * d.k, f[1] - .02 * d.k, f[2] + .062 * d.k], [.011 * d.k, .012 * d.k, .015 * d.k], { tint: '#ffffff', ink: .4, seg: 10, segv: 7 });
      });
    }
    // the tail: back from the rump, down, and curling up at its end into a breaking wave
    const tail = C.part('tail', null, d.tailAt);
    const TP = d.tail, TR = (t) => d.tailR * (1 - .72 * t) + .012, TB = [0, -1, -1];
    C.build(tail, (b) => {
      b.add(K.tube(TP, 40, 14, TR, 1, (c, n) => n.set(...TB)), d.tailSkin ? drakeSkin(C, Object.assign({ pal: PP }, d.tailSkin)) : skin, null, null, null, {});
      for (let i = 0; i < d.tailSpikes; i++) { const t = .08 + i * (.78 / d.tailSpikes), a = along(TP, t, TR, TB); b.add(new THREE.ConeGeometry(.017 * d.k * (1 - .4 * t), .045 * d.k * (1 - .3 * t), 8), mint, a.p, K.qDir([0, 1, 0], [a.n[0] - a.tg[0] * .7, a.n[1] - a.tg[1] * .7, a.n[2] - a.tg[2] * .7]), null, { tint: '#3fc8ea', ink: .5 }); }
    });
    const end = TP[TP.length - 1], wave = C.part('wave', tail, end);
    C.build(wave, (b) => {
      const WP = d.wave, side = (c, n) => n.set(1, 0, 0);
      b.add(K.tube(WP, 30, 12, curve([[0, d.waveR * .75], [.35, d.waveR], [1, .012]]), .42, side), mint, null, null, null, { tint: (v, n) => K.rgb(v.y > WP[3][1] - .025 && n.y > .2 ? '#ffffff' : n.y > .45 ? '#e4f8ff' : n.y < -.3 ? '#3a96ec' : '#8fd4ff') });
      for (const [p, r] of d.foam) C.ell(b, mint, p, [r * .6, r, r], { tint: '#ffffff', ink: .5, seg: 14, segv: 10 });
    });
    return { blue, mint, horn, dark, skin, lskin, P: PP };
  }
  // wings of the bat kind, mint over blue bones (Rapidrake); o: at, rot, scale
  function batWings(C, K, mats, o) {
    for (const sd of [-1, 1]) {
      const w = C.part(sd < 0 ? 'wingR' : 'wingL', null, [sd * o.at[0], o.at[1], o.at[2]], [0, sd * o.rot[1], sd * o.rot[2]]);
      w.scale.setScalar(o.s); w.userData.rest.s.setScalar(o.s);
      C.build(w, (b) => {
        const P = [[0, 0], [.06, .13], [.13, .23], [.2, .27], [.3, .3], [.43, .345], [.36, .26], [.41, .17], [.31, .15], [.31, .065], [.21, .07], [.18, -.005], [.09, .03], [.03, -.03]].map(([x, y]) => [x * sd, y]);
        b.add(K.slab(sd < 0 ? P.slice().reverse() : P, .009, .003), mats.mint, null, null, null, { tint: (v) => K.rgb(v.y > .12 || Math.abs(v.x) < .12 ? MINT : '#a8f8e8') });
        b.add(K.tube([[0, 0, 0], [sd * .065, .13, 0], [sd * .14, .23, 0], [sd * .3, .3, 0], [sd * .43, .345, 0]], 20, 6, (t) => .018 * (1 - .6 * t)), mats.blue, null, null, null, { tint: B1 });
        for (const [x, y] of [[.41, .17], [.31, .065], [.18, -.005]]) b.add(K.tube([[sd * .2, .265, .002], [sd * (x * .6 + .08), y * .6 + .1, .002], [sd * x, y, .002]], 6, 4, () => .006), mats.blue, null, null, null, { tint: '#2a7ae0', ink: 0 });
      });
    }
  }
  // the fin-ears, as Drizzlon's
  function finEars(C, K, head, mats, at, s, rot) {
    for (const sd of [-1, 1]) {
      const fin = C.part(sd < 0 ? 'finR' : 'finL', head, [sd * at[0], at[1], at[2]], [0, sd * rot[0], sd * rot[1]]);
      fin.scale.setScalar(s); fin.userData.rest.s.setScalar(s);
      C.build(fin, (b) => {
        const P = [[0, -.03], [.04, .085], [.065, .045], [.11, .095], [.11, .035], [.15, .045], [.12, -.0], [.13, -.035], [.06, -.045]].map(([x, y]) => [x * sd, y]);
        b.add(K.slab(sd < 0 ? P.slice().reverse() : P, .01, .003), mats.mint, null, null, null, { tint: (v) => K.rgb(Math.abs(v.x) > .1 * s ? PALE : MINT) });
        for (const [x, y] of [[.04, .085], [.11, .095], [.15, .045], [.13, -.035]]) b.add(K.tube([[0, 0, .004], [sd * x * .55, y * .55, .006], [sd * x * .92, y * .92, .006]], 4, 4, () => .006), mats.blue, null, null, null, { tint: '#2a7ae0', ink: 0 });
      });
    }
  }
  // a lightning bolt's outline, along +y, length L, width w
  const boltShape = (L, w) => [[-.25 * w, .5 * L], [.55 * w, .5 * L], [.12 * w, .08 * L], [.5 * w, .1 * L], [-.35 * w, -.5 * L], [-.06 * w, -.04 * L], [-.45 * w, -.06 * L]];
  // wings of breaking waves (Tsunadrake): a blue fan with lightning across it, its outer edge three crests curling over in foam
  function waveWings(C, K, mats, o) {
    const yel = C.M('#ffffff', { mat: { emissive: new THREE.Color('#806000'), emissiveIntensity: .35 } });
    for (const sd of [-1, 1]) {
      const w = C.part(sd < 0 ? 'wingR' : 'wingL', null, [sd * o.at[0], o.at[1], o.at[2]], [0, sd * o.rot[1], sd * o.rot[2]]);
      w.scale.setScalar(o.s); w.userData.rest.s.setScalar(o.s);
      const X = (pts) => pts.map(([x, y, z]) => [x * sd, y, z || 0]);
      C.build(w, (b) => {
        const P = [[0, -.05], [.02, .15], [.1, .3], [.22, .38], [.36, .42], [.5, .38], [.56, .28], [.6, .15], [.52, .02], [.4, -.08], [.25, -.12], [.1, -.1]].map(([x, y]) => [x * sd, y]);
        b.add(K.slab(sd < 0 ? P.slice().reverse() : P, .012, .003), mats.blue, null, null, null, { tint: (v) => K.rgb(v.y > .3 ? PAL2.B3 : Math.abs(v.x) > .3 ? PAL2.B1 : '#1a58d0') });
        b.add(K.tube(X([[0, 0], [.08, .2], [.2, .36], [.36, .42]]), 14, 8, (t) => .026 * (1 - .5 * t)), mats.blue, null, null, null, { tint: PAL2.B2 });
        for (const [x, y, a, L] of [[.3, .2, -.5, .3], [.43, .02, -.9, .2]]) { const bs = boltShape(L, .09).map(([u, v]) => [u * sd, v]); b.add(K.slab(sd < 0 ? bs.slice().reverse() : bs, .021, 0), yel, [sd * x, y, 0], [0, 0, sd * a], null, { tint: '#ffe23a', ink: .35 }); }
        // the crests: thick flattened curls breaking outward, white along their tops, light blue under, foam on the lips
        for (const [pts, r] of [[[[.14, .36], [.28, .48], [.44, .54], [.58, .5], [.64, .4], [.6, .3], [.52, .31], [.5, .37]], .085], [[[.46, .2], [.56, .27], [.66, .23], [.68, .12], [.63, .06], [.57, .08], [.56, .13]], .07], [[[.3, -.05], [.42, .0], [.52, -.05], [.53, -.14], [.48, -.18], [.43, -.15]], .055]]) {
          b.add(K.tube(X(pts), 32, 12, curve([[0, r * .6], [.3, r], [.75, r * .55], [1, .012]]), .5, (c, n) => n.set(0, 0, 1)), mats.mint, null, null, null, { tint: (v, n) => K.rgb(n.y > .12 ? '#ffffff' : n.y > -.15 ? '#9ad6ff' : n.y > -.5 ? '#3f8ef2' : '#1a58d0') });
          for (let i = 1; i < pts.length - 2; i++) { const q = pts[i], r2 = r * (1 - .12 * i); C.ell(b, mats.mint, [sd * q[0], q[1] + r2 * .8, 0], [r2 * .55, r2 * .42, r2 * .6], { tint: '#ffffff', ink: .5, seg: 12, segv: 8 }); }
        }
      });
    }
  }
  const drakeIdle = (C, t, dt, walk) => {
    const P = C.parts, f = 1 + walk * 2;
    P.tail.rotation.y = Math.sin(t * 1.5 * f) * .14; P.tail.rotation.x = Math.sin(t * 1.1) * .04; P.wave.rotation.x = Math.sin(t * 2.3) * .1;
    const flap = Math.sin(t * (walk ? 10 : 2.6)) * (walk ? .3 : .07);
    P.wingL.rotation.y -= flap; P.wingR.rotation.y += flap;
    P.finL.rotation.y += Math.sin(t * 4.1) * .08; P.finR.rotation.y -= Math.sin(t * 4.1 + 1) * .08;
    P.head.rotation.x = Math.sin(t * 1.1) * .04; P.head.rotation.z = Math.sin(t * .7) * .05; P.head.position.y += Math.sin(t * 2.4) * .005;
    if (walk) { const s = Math.sin(t * 10); P.legFR.rotation.x = s * .45; P.legBL.rotation.x = s * .45; P.legFL.rotation.x = -s * .45; P.legBR.rotation.x = -s * .45; }
  };
  const drakeAct = (C, name, u) => {
    const P = C.parts, sm = KIT.sm, k = Math.sin(u * PI);
    if (name === 'attack' || name === 'cast' || name === 'roar' || name === 'happy' || name === 'puff') { const f = Math.sin(u * 40) * .5 * k; P.wingL.rotation.y -= f; P.wingR.rotation.y += f; P.wingL.rotation.z += .25 * k; P.wingR.rotation.z -= .25 * k; }
    if (name === 'attack') { P.head.rotation.x += .25 * k; P.legFL.rotation.x -= .3 * k; P.legFR.rotation.x -= .3 * k; }
    if (name === 'spit' || name === 'roar') { const a = Math.sin(Math.min(1, u / .34) * PI / 2) * (1 - sm(.34, .44, u)), b = u > .3 ? Math.sin(Math.min(1, (u - .3) / .5) * PI) : 0; P.head.rotation.x += -.45 * a + .3 * b; P.head.position.z += .04 * b; P.wingL.rotation.y -= .4 * b; P.wingR.rotation.y += .4 * b; }
    if (name === 'curl' || name === 'tuck') { const q = name === 'tuck' ? Math.min(1, u * 3) : k; P.wingL.rotation.y += .5 * q; P.wingR.rotation.y -= .5 * q; P.head.rotation.x += .3 * q; P.tail.rotation.y += .6 * q; for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].rotation.x += (l[3] === 'F' ? -.5 : .5) * q; }
    if (name === 'hop' || name === 'happy') { P.legFL.rotation.x -= .4 * k; P.legFR.rotation.x -= .4 * k; P.legBL.rotation.x += .3 * k; P.legBR.rotation.x += .3 * k; }
    if (name === 'hit') P.head.rotation.x -= .3 * k;
    if (name === 'quakestomp') { const a = sm(0, .4, u) * (1 - sm(.45, .55, u)); P.legFL.rotation.x -= .7 * a; P.legFR.rotation.x -= .7 * a; P.head.rotation.x -= .3 * a; }
    if (name === 'dustkick') { const s = u < .46 ? Math.sin(u / .46 * PI * 2) : 0, f = sm(.46, .55, u) * (1 - sm(.62, 1, u)); P.legFL.rotation.x += .6 * s - .5 * f; P.legFR.rotation.x -= .6 * s + .5 * f; P.tail.rotation.y += .3 * s; }
  };

  // ---------- Rapidrake (sheet: standing now, a long neck, bat wings, horns swept back, a wave at the end of its tail) ----------
  CREATURE_DEFS.rapidrake = {
    height: .8, eyeY: .62, width: .6, size: 1.15, mouth: [0, -.04, .15],
    build(C, K) {
      const m = drake(C, K, {
        k: 1, ovals: 9, tailSpikes: 9, skin: { ribs: 34 },
        spine: [[0, .26, -.2], [0, .255, -.08], [0, .26, .05], [0, .29, .14], [0, .385, .195], [0, .47, .205], [0, .55, .2], [0, .6, .215]],
        spineR: [[0, .085], [.14, .088], [.34, .096], [.47, .106], [.6, .074], [.78, .056], [1, .05]],
        front: { x: .07, y: .25, z: .13, top: [.045, .068, .055], shin: [[0, -.03, 0], [0, -.13, .012], [0, -.225, 0]], r: [[0, .038], [1, .03]] },
        hind: { x: .08, y: .25, z: -.14, top: [.066, .095, .086], shin: [[0, -.05, -.01], [0, -.13, -.05], [0, -.225, -.015]], r: [[0, .038], [1, .03]] },
        tailAt: [0, .25, -.24], tailR: .075,
        tail: [[0, 0, .06], [0, -.03, -.07], [0, -.06, -.2], [0, -.055, -.32], [0, -.015, -.42], [0, .05, -.47], [0, .12, -.48]],
        wave: [[0, -.02, 0], [0, .06, .0], [0, .14, .02], [0, .17, .08], [0, .14, .14], [0, .09, .15], [0, .07, .11]], waveR: .085,
        foam: [[[0, .17, .05], .03], [[0, .155, .12], .022], [[0, .02, -.035], .03]],
      });
      // the head: rounder than a grown dragon's, the muzzle longer than Drizzlon's, horns swept back, a peak on its crown
      const head = C.part('head', null, [0, .615, .235]);
      C.build(head, (b) => {
        C.ell(b, m.blue, [0, 0, 0], [.082, .076, .086], { tint: bodyTint });
        C.ell(b, m.blue, [0, -.028, .075], [.058, .043, .07], { tint: (v, n) => K.rgb(n.y > .35 ? B3 : n.y < -.5 ? PALE : B1) });
        for (const sd of [-1, 1]) C.ell(b, m.dark, [sd * .02, -.012, .142], [.007, .005, .004], { tint: '#0a2a6a', ink: 0, seg: 8, segv: 6 });
        b.add(K.tube([[-.05, -.04, .085], [-.03, -.056, .125], [0, -.062, .138], [.03, -.056, .125], [.05, -.04, .085]], 12, 5, () => .0035), m.dark, null, null, null, { tint: '#0a2a6a', ink: 0 });
        for (const sd of [-1, 1]) b.add(K.tube([[sd * .03, .05, -.02], [sd * .05, .1, -.06], [sd * .066, .145, -.12], [sd * .062, .165, -.19]], 14, 10, (t) => .023 * (1 - .88 * t) + .002), m.horn, null, null, null, { tint: (v, n) => K.rgb(n.x * (v.x > 0 ? 1 : -1) > .3 ? '#d8cfae' : '#f4ecd2') });
        b.add(new THREE.ConeGeometry(.016, .05, 8), m.blue, [0, .085, .0], [-.35, 0, 0], null, { tint: B2, ink: .6 });
        for (let i = 0; i < 3; i++) { const { p, n } = K.onBall([0, 0, 0], [.082, .076, .086], PI, .7 - i * .4, .003); b.add(new THREE.SphereGeometry(1, 10, 8), m.mint, p, K.qDir([0, 0, 1], n), [.016, .021, .007], { tint: '#a8f0f4', ink: .5 }); }
      });
      C.eyePair(head, [0, 0, 0], [.082, .076, .086], .5, .14, [.03, .038, .012], ['#0b2a7a', '#1f6ad8', '#8ad0ff'], { fwd: .2 });
      finEars(C, K, head, m, [.07, .015, -.03], .9, [.75, .25]);
      batWings(C, K, m, { at: [.06, .33, .1], rot: [0, 1.0, .0], s: 1 });
    },
    idle: drakeIdle, act: drakeAct,
  };

  // ---------- Tsunadrake (sheet: Water/Bolt, bigger and heavier, wings of breaking waves, lightning down its flanks and tail,
  // a crown of white fins swept back, fierce yellow eyes) ----------
  CREATURE_DEFS.tsunadrake = {
    height: .93, eyeY: .66, width: 1.0, size: 1.3, mouth: [0, -.045, .17],
    build(C, K) {
      const m = drake(C, K, {
        k: 1.3, ovals: 0, neckSpikes: 0, tailSpikes: 0, bolts: true, pal: PAL2, claws: [-1.5, -.5, .5, 1.5],
        skin: { ribs: 30, bolts: [[.2, .3, .3, .07], [.44, .3, -.4, .06], [.3, .38, .2, .05]] },
        tailSkin: { ribs: 22, bw: .16, bolts: [[.12, .5, 0, .12], [.33, .5, 0, .12], [.54, .5, 0, .11], [.74, .5, 0, .09]] },
        spine: [[0, .27, -.3], [0, .27, -.15], [0, .28, .02], [0, .31, .16], [0, .39, .24], [0, .48, .265], [0, .56, .27], [0, .61, .285]],
        spineR: [[0, .1], [.14, .11], [.34, .12], [.48, .13], [.62, .1], [.8, .078], [1, .066]],
        front: { x: .1, y: .26, z: .18, top: [.062, .09, .075], shin: [[0, -.03, 0], [.01, -.14, .012], [.02, -.235, 0]], r: [[0, .05], [1, .04]] },
        hind: { x: .11, y: .27, z: -.19, top: [.085, .115, .105], shin: [[0, -.06, -.01], [.01, -.14, -.06], [.02, -.245, -.015]], r: [[0, .05], [1, .04]] },
        tailAt: [0, .27, -.33], tailR: .095,
        tail: [[0, 0, .07], [0, -.03, -.08], [0, -.065, -.23], [0, -.06, -.37], [0, -.02, -.46], [0, .05, -.51], [0, .13, -.52]],
        wave: [[0, -.02, 0], [0, .07, .0], [0, .16, .025], [0, .19, .095], [0, .155, .16], [0, .1, .17], [0, .08, .12]], waveR: .1,
        foam: [[[0, .19, .05], .036], [[0, .175, .13], .026], [[0, .025, -.04], .036], [[0, .11, .01], .03]],
      });
      // the head: longer in the muzzle, a heavy brow over fierce yellow eyes, the crown of fins swept back
      const head = C.part('head', null, [0, .645, .3]); head.scale.setScalar(1.15); head.userData.rest.s.setScalar(1.15);
      C.build(head, (b) => {
        const P2 = m.P, bt = tintOf(P2);
        C.ell(b, m.blue, [0, 0, 0], [.088, .074, .095], { tint: bt });
        C.ell(b, m.blue, [0, -.03, .085], [.056, .042, .085], { tint: (v, n) => K.rgb(n.y > .35 ? P2.B3 : n.y < -.5 ? MINT : P2.B1) });
        for (const sd of [-1, 1]) { C.ell(b, m.dark, [sd * .02, -.012, .166], [.007, .005, .004], { tint: '#0a2a6a', ink: 0, seg: 8, segv: 6 }); C.ell(b, m.blue, [sd * .045, .035, .05], [.04, .016, .045], { rot: [0, 0, sd * -.35], tint: P2.B2, ink: .6 }); }
        b.add(K.tube([[-.05, -.045, .09], [-.03, -.058, .14], [0, -.063, .158], [.03, -.058, .14], [.05, -.045, .09]], 12, 5, () => .0035), m.dark, null, null, null, { tint: '#0a2a6a', ink: 0 });
        // the crown: five white fins, the middle one tallest, fanned out and swept back
        for (const [x0, x1, y1, z1, r] of [[0, 0, .31, -.2, .03], [.02, .07, .27, -.18, .027], [.04, .14, .21, -.15, .024], [.055, .19, .13, -.12, .02]]) for (const sd of x0 ? [-1, 1] : [1]) {
          b.add(K.tube([[sd * x0, .05, -.01], [sd * (x0 + x1) * .45, y1 * .55, z1 * .4], [sd * x1 * .85, y1 * .85, z1 * .8], [sd * x1, y1, z1]], 14, 8, (t) => r * (1 - .9 * t) + .002, .45, (c, n) => n.set(0, 0, 1)), m.horn, null, null, null, { tint: (v, n) => K.rgb(Math.hypot(v.x, v.y - .05) < .07 ? MINT : Math.abs(n.z) > .6 ? '#ffffff' : '#d8f4ee') });
        }
        for (const sd of [-1, 1]) C.ell(b, m.mint, [sd * .085, .0, -.055], [.016, .022, .016], { tint: '#f08aa0', ink: .4 });
      });
      C.eyePair(head, [0, 0, 0], [.088, .074, .095], .52, .14, [.03, .03, .012], ['#7a4a00', '#f0b020', '#ffe070'], { fwd: .2, roll: .3, tex: { lid: m.P.B1, lidK: .3 } });
      finEars(C, K, head, m, [.072, .01, -.035], 1.05, [.8, .2]);
      waveWings(C, K, m, { at: [.08, .4, .02], rot: [0, .95, 0], s: 1 });
    },
    idle: drakeIdle, act: drakeAct,
  };

  // =====================================================================================================================
  // Mossback's line
  // =====================================================================================================================
  // the shell is an ellipsoid dome (C0, R0) cut off by its rim, which arches up at the front over the head
  const rimY = (d, a) => d.rim + d.arch * Math.pow(Math.max(0, Math.cos(a)), 3);
  const domeR = (d, y) => d.R0[0] * Math.sqrt(Math.max(0, 1 - Math.pow((y - d.C0[1]) / d.R0[1], 2)));
  // a point on the dome at azimuth a (0 the front) and s from the top (0) to the rim (1); and its normal
  function domeAt(d, a, s, off) {
    const top = d.C0[1] + d.R0[1], y = top - s * (top - rimY(d, a)), r = domeR(d, y), p = [Math.sin(a) * r, y, Math.cos(a) * r];
    const n = new THREE.Vector3(p[0] / (d.R0[0] * d.R0[0]), (y - d.C0[1]) / (d.R0[1] * d.R0[1]), p[2] / (d.R0[2] * d.R0[2])).normalize();
    return { p: [p[0] + n.x * (off || 0), p[1] + n.y * (off || 0), p[2] + n.z * (off || 0)], n: [n.x, n.y, n.z] };
  }
  function domeGeo(K, d, segs) {
    const top = d.C0[1] + d.R0[1], prof = []; for (let i = 0; i <= 12; i++) { const y = top - (top - d.rim) * Math.sin(i / 12 * PI / 2); prof.push([domeR(d, y), y]); }
    prof[0][0] = 0;
    return K.lathe(prof, segs || 48, { lin: true, sub: 2, fn(out, a) { const y0 = out[1], y = top - (top - y0) * (top - rimY(d, a)) / (top - d.rim), r = domeR(d, y); out[0] = Math.sin(a) * r; out[1] = y; out[2] = Math.cos(a) * r; } });
  }
  // a leaf lying on the dome at (a, s), pointing downhill, its tip lifted
  const LEAF = KIT.slab([[0, 0], [.024, .022], [.032, .052], [.024, .08], [0, .102], [-.024, .08], [-.032, .052], [-.024, .022]], .006, .002);
  function leafOn(b, K, mat, d, a, s, scl, col, lift, turn) {
    const { p, n: nn } = domeAt(d, a, s, .002), N = V3(nn), up = new THREE.Vector3(0, 1, 0);
    const down = up.clone().addScaledVector(N, -N.dot(up)).negate(); if (down.lengthSq() < 1e-4) down.set(Math.sin(a), 0, Math.cos(a)); down.normalize(); if (turn) down.applyAxisAngle(N, turn);
    const dir = down.clone().addScaledVector(N, lift).normalize(), side = new THREE.Vector3().crossVectors(dir, N).normalize(), face = new THREE.Vector3().crossVectors(side, dir).normalize();
    b.add(LEAF, mat, p, new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, dir, face)), scl, { tint: K.rgb(col), ink: .45 });
  }
  // a vine over the dome from (a0, s0) to (a1, s1), bowing through s mid, wiggling
  function vinePts(d, a0, s0, a1, s1, mid, wig, off) {
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, s = u < .5 ? s0 + (mid - s0) * Math.sin(u * PI) : s1 + (mid - s1) * Math.sin(u * PI), a = a0 + (a1 - a0) * u + wig * Math.sin(u * PI * 3); pts.push(domeAt(d, a, Math.max(.02, s), off).p); }
    return pts;
  }
  function flowerAt(C, parent, pos, n, s) {
    const f = C.part('flower' + (C._fl = (C._fl || 0) + 1), parent, pos); f.quaternion.copy(KIT.qDir([0, 1, 0], n)); f.userData.rest.r.copy(f.rotation); f.scale.setScalar(s); f.userData.rest.s.setScalar(s);
    const petal = C._petal || (C._petal = C.M());
    C.build(f, (b) => {
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; C.ell(b, petal, [Math.sin(a) * .022, 0, Math.cos(a) * .022], [.02, .007, .015], { rot: [0, a, 0], tint: '#f47a8a', ink: .5, seg: 10, segv: 6 }); }
      C.ell(b, petal, [0, .005, 0], [.011, .009, .011], { tint: '#f8d838', ink: .4, seg: 8, segv: 6 });
    });
    return f;
  }
  // the turtle under the shell, grown from Mossback's: head, plastron, four legs, a short tail. d: measurements, colours
  function turtle(C, K, d) {
    const skin = C.M(), nail = C.M(), cream = C.M(), dark = C.M(), moss = C.M();
    const skinTint = (v, n) => K.rgb(spotty(v, .5) ? d.SPOT : n.y > .45 ? d.SK3 : n.y > -.3 ? d.SK : d.SK2);
    // the plastron: a tan ring under the shell's edge, and the striped plate in front under the chin
    const under = C.part('under', null, [0, 0, 0]);
    C.build(under, (b) => {
      C.ell(b, cream, [0, d.underY, -.01], d.underR, { tint: (v, n) => K.rgb(n.y > .4 ? '#8a7440' : Math.floor((v.y - d.underY) * 90 + 10) % 2 ? '#c4a862' : '#b0924e'), ink: .7 });
      C.ell(b, cream, d.plate[0], d.plate[1], { tint: (v) => K.rgb(Math.floor(v.y * 55) % 2 ? '#d4bc78' : '#b89c58'), ink: .6 });
    });
    const head = C.part('head', null, d.headAt);
    C.build(head, (b) => {
      const R = d.headR;
      b.add(K.tube([[0, -.03, -.2], [0, -.02, -.12], [0, 0, -.03]], 8, 12, () => R[1] * .72), skin, null, null, null, { tint: skinTint });
      C.ell(b, skin, [0, 0, 0], R, { tint: (v, n) => K.rgb(n.y < -.25 || (n.z > .55 && v.y < -R[1] * .25) ? d.JAW : spotty(v, .4) && n.y > .2 ? d.SPOT : n.y > .45 ? d.SK3 : d.SK) });
      C.ell(b, skin, [0, -R[1] * .35, R[2] * .55], [R[0] * .62, R[1] * .48, R[2] * .5], { tint: d.JAW, ink: .4 });
      b.add(K.tube([[-R[0] * .4, -R[1] * .38, R[2] * .98], [0, -R[1] * .5, R[2] * 1.04], [R[0] * .4, -R[1] * .38, R[2] * .98]], 10, 6, () => .005), dark, null, null, null, { tint: '#3a3418', ink: 0 });
      for (const sd of [-1, 1]) C.ell(b, dark, [sd * .016, -R[1] * .05, R[2] * 1.02], [.006, .005, .004], { tint: '#3a3418', ink: 0, seg: 8, segv: 6 });
      // leafy tufts at its cheeks
      if (d.cheek) for (const sd of [-1, 1]) for (const [dy, rz] of [[0, .5], [-.03, 1.3]]) b.add(LEAF, moss, [sd * R[0] * .92, -R[1] * .35 + dy, R[2] * .25], [0, sd * .9, sd * rz], 1.1, { tint: d.cheek, ink: .45 });
    });
    C.eyePair(head, [0, 0, 0], d.headR, .5, .14, d.eye, ['#3a2412', '#7a5230', '#c09060'], { tex: { lid: d.SK, lidK: .46 }, fwd: .2 });
    for (const [nm, x, z] of [['legFR', -d.legX, d.legZ[0]], ['legFL', d.legX, d.legZ[0]], ['legBR', -d.legX, d.legZ[1]], ['legBL', d.legX, d.legZ[1]]]) {
      const lg = C.part(nm, null, [x, d.legY, z]), r = d.legR, h = d.legY;
      C.build(lg, (b) => {
        b.add(K.lathe([[0, .04], [r * .9, .03], [r, -h * .4], [r * 1.08, -h * .85], [0, -h]], 16), skin, null, null, null, { tint: d.legTint || skinTint });
        C.ell(b, moss, [0, .0, 0], [r * 1.02, r * .7, r * 1.02], { tint: (v, n) => K.rgb(spotty(v, .3) ? d.MOSS2 : d.MOSS), ink: .5 });
        for (const dd of [-1.5, -.5, .5, 1.5]) C.ell(b, nail, [dd * r * .44, -h * .9, r * .9], [r * .2, r * .2, r * .2], { tint: '#f2e2a8', ink: .4, seg: 12, segv: 8 });
      });
    }
    const tail = C.part('tail', null, d.tailAt);
    C.build(tail, (b) => b.add(new THREE.ConeGeometry(.034, .1, 10), skin, [0, 0, -.035], [-1.75, 0, 0], null, { tint: d.SK }));
    return { skin, nail, cream, dark, moss };
  }
  const turtleIdle = (C, t, dt, walk) => {
    const P = C.parts;
    P.head.position.z += Math.sin(t * .9) * .008; P.head.rotation.x = Math.sin(t * .9) * .05; P.head.rotation.y = Math.sin(t * .4) * .12;
    if (P.tree) { P.tree.rotation.z = Math.sin(t * 1.1) * .03; P.tree.rotation.x = Math.sin(t * .8 + 1) * .02; }
    if (walk) { const s = Math.sin(t * 9); P.legFR.rotation.x = s * .35; P.legBL.rotation.x = s * .35; P.legFL.rotation.x = -s * .35; P.legBR.rotation.x = -s * .35; }
  };
  const turtleAct = (C, name, u) => {
    const P = C.parts, k = Math.sin(u * PI);
    if (name === 'attack') P.head.position.z += k * .07;
    if (name === 'hit') P.head.position.z -= k * .07;
    if (name === 'spit' || name === 'chomp') { const b = u > .3 ? Math.sin(Math.min(1, (u - .3) / .5) * PI) : -Math.sin(u / .3 * PI / 2) * .5; P.head.position.z += .08 * b; P.head.rotation.x -= .15 * Math.max(0, -b); }
    if (name === 'curl' || name === 'tuck') { const q = name === 'tuck' ? Math.min(1, u * 3) : Math.sin(Math.min(1, u * 1.25) * PI / 2) * (1 - Math.max(0, (u - .8) / .2)); P.head.position.z -= .15 * q; P.head.position.y -= .03 * q; P.head.scale.multiplyScalar(1 - .35 * q); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) { P[l].scale.y *= 1 - .65 * q; P[l].position.y += .04 * q; } P.tail.scale.multiplyScalar(1 - .8 * q); }
    if (name === 'puff' || name === 'happy' || name === 'roar') { if (P.tree) { P.tree.scale.multiplyScalar(1 + .1 * k); P.tree.rotation.z += Math.sin(u * 30) * .05 * k; } if (P.bush) P.bush.scale.multiplyScalar(1 + .06 * k); }
    if (name === 'dustkick') { const s = u < .46 ? Math.sin(u / .46 * PI * 2) : 0, f = KIT.sm(.46, .55, u) * (1 - KIT.sm(.62, 1, u)); P.legFL.rotation.x += .5 * s - .4 * f; P.legFR.rotation.x -= .5 * s + .4 * f; P.head.position.z += .03 * f; }
    if (name === 'quakestomp') { const a = KIT.sm(0, .4, u) * (1 - KIT.sm(.44, .5, u)); P.legFL.rotation.x -= .8 * a; P.legFR.rotation.x -= .8 * a; P.legFL.position.y += .04 * a; P.legFR.position.y += .04 * a; P.head.rotation.x -= .25 * a; if (P.tree) P.tree.rotation.x += Math.sin(Math.max(0, u - .45) * 40) * .08 * (1 - u); }
  };

  // ---------- Thornshell (sheet: the shell a high dome of leaves wound with brown vines, cream thorns, pink flowers, a
  // furry rim of moss arching over its head; a bigger sleepy face with leafy cheeks, mossy legs) ----------
  const TD = { C0: [0, .2, 0], R0: [.34, .44, .34], rim: .21, arch: .2 };
  CREATURE_DEFS.thornshell = {
    mouth: [0, -.05, .12], height: .66, eyeY: .26, width: .7, size: 1.15,
    build(C, K) {
      const m = turtle(C, K, { SK: '#8e9a34', SK2: '#687624', SK3: '#aab84e', SPOT: '#6a8a2a', JAW: '#c8b878', MOSS: '#7cbc2c', MOSS2: '#a8d84a', cheek: '#6ab82a',
        underY: .15, underR: [.3, .06, .31], plate: [[0, .16, .26], [.13, .08, .06]],
        headAt: [0, .26, .37], headR: [.128, .1, .114], eye: [.038, .042, .014],
        legX: .175, legY: .18, legZ: [.2, -.18], legR: .095, tailAt: [0, .12, -.33] });
      const shell = C.part('bush', null, [0, 0, 0]);
      const mound = C.M(), leaf = C.M(), vine = C.M(), thorn = C.M(), rim = C.M();
      C.build(shell, (b) => {
        b.add(domeGeo(K, TD), mound, null, null, null, { tint: (v, n) => K.rgb(n.y > .6 ? '#2a5a1a' : '#1e4a14') });
        // leaves in rings from the crown down to the rim
        let sd = 23; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const cols = ['#3e8a1e', '#4a9624', '#367e1a', '#56a22a', '#62ac30', '#428e20'];
        [[.04, 4], [.12, 8], [.2, 12], [.28, 15], [.36, 18], [.44, 20], [.52, 22], [.6, 24], [.68, 25], [.76, 26]].forEach(([s0, n], ri) => { for (let i = 0; i < n; i++) {
          const a = (i + (ri % 2) * .5) / n * TAU + (rr() - .5) * .3, s1 = Math.min(.8 - .3 * Math.pow(Math.max(0, Math.cos(a)), 2), s0 + (rr() - .5) * .05);
          leafOn(b, K, leaf, TD, a, s1, 1.2 + rr() * .35, cols[Math.floor(rr() * cols.length)], .08 + rr() * .14, (rr() - .5) * 2.2);
        } });
        // the brown vines winding over it, thorns along them
        for (const [a0, s0, a1, s1, mid, wig] of [[-1.9, .8, 1.4, .78, .15, .25], [-.6, .78, 2.6, .8, .3, .2], [.9, .8, 3.9, .78, .22, .3], [2.2, .78, 5.2, .8, .35, .25], [-2.6, .75, -.2, .2, .4, .3]]) {
          const pts = vinePts(TD, a0, s0, a1, s1, mid, wig, .03);
          b.add(K.tube(pts, 30, 6, (t) => .021 * (1 - .3 * Math.abs(t - .5))), vine, null, null, null, { tint: (v, n) => K.rgb(n.y > .5 ? '#a8743e' : '#7a4a24'), ink: .7 });
          for (const t of [.2, .45, .7]) { const cv = new THREE.CatmullRomCurve3(pts.map(V3)), p = cv.getPointAt(t), dn = p.clone().sub(V3(TD.C0)).normalize(); b.add(new THREE.ConeGeometry(.016, .07, 8), thorn, [p.x + dn.x * .03, p.y + dn.y * .03, p.z + dn.z * .03], K.qDir([0, 1, 0], [dn.x, dn.y + .4, dn.z]), null, { tint: (v, n) => K.rgb(n.y > 0 ? '#e8d49a' : '#c4a868'), ink: .55 }); }
        }
        // the big thorn on top, and a few more poking out of the leaves
        b.add(new THREE.ConeGeometry(.028, .12, 9), thorn, [.0, .66, -.03], [-.35, 0, -.1], null, { tint: (v, n) => K.rgb(n.y > .2 ? '#d8b870' : '#a88040'), ink: .6 });
        for (const [a, s1] of [[1.3, .62], [-1.2, .6], [2.4, .5], [-2.2, .45], [.5, .8], [-.4, .78], [3.1, .55]]) { const { p, n } = domeAt(TD, a, s1, .035); b.add(new THREE.ConeGeometry(.016, .07, 8), thorn, p, K.qDir([0, 1, 0], [n[0], n[1] + .3, n[2]]), null, { tint: '#e0c888', ink: .55 }); }
        // the furry rim of moss, arching up over its head
        const RP = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, y = rimY(TD, a), r = domeR(TD, y) + .008; RP.push([Math.sin(a) * r, y, Math.cos(a) * r]); }
        b.add(K.tube(RP, 192, 8, (t) => .036 * (1 + .2 * Math.sin(t * TAU * 48) * Math.sin(t * TAU * 9 + 1)), 1, null, true), rim, null, null, null, { tint: (v) => K.rgb(spotty(v, .2) ? '#a8d84a' : '#86c432'), ink: .8 });
      });
      for (const [a, s1, k] of [[.45, .3, 1.5], [1.1, .55, 1.4], [1.3, .75, 1.2], [-1.0, .35, 1.4], [2.6, .4, 1.4], [-2.3, .6, 1.3]]) { const { p, n } = domeAt(TD, a, s1, .04); flowerAt(C, shell, p, n, k * 1.25); }
    },
    idle: turtleIdle, act: turtleAct,
  };

  // ---------- Elderoak (sheet: Plant/Earth, the shell gone to grey stone plates under leaves, vines and pink flowers, an oak
  // growing out of the top, its roots over the shell, pebbles round its foot, a broad flat crown; a green mossy head) ----------
  const ED = { C0: [0, .19, 0], R0: [.36, .34, .36], rim: .2, arch: .15 };
  CREATURE_DEFS.elderoak = {
    mouth: [0, -.05, .12], height: .82, eyeY: .29, width: .74, size: 1.3,
    build(C, K) {
      const stone = (v, n) => K.rgb(n.y > .35 ? (spotty(v, .2) ? '#8ac840' : '#6aa830') : spotty(v, .35) ? '#6e5e44' : '#8a7a5a');
      const m = turtle(C, K, { SK: '#7aa83a', SK2: '#5a8a2a', SK3: '#94c050', SPOT: '#4e8a26', JAW: '#ccb478', MOSS: '#6aa830', MOSS2: '#8ac840', cheek: null, legTint: stone,
        underY: .15, underR: [.32, .06, .33], plate: [[0, .17, .28], [.14, .085, .06]],
        headAt: [0, .275, .46], headR: [.122, .096, .112], eye: [.036, .036, .014],
        legX: .19, legY: .19, legZ: [.22, -.2], legR: .1, tailAt: [0, .13, -.35] });
      const shellSkin = C.paint(1024, 256, (g, W, H) => {
        g.fillStyle = '#3e3424'; g.fillRect(0, 0, W, H);
        let sd = 5; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const plate = (x, y, w, h) => { const c = ['#8a8464', '#7e7658', '#948c6c', '#857a5a'][Math.floor(rr() * 4)]; g.fillStyle = c; g.beginPath(); g.roundRect(x + 5, y + 5, w - 10, h - 10, Math.min(w, h) * .3); g.fill(); g.fillStyle = 'rgba(255,250,220,.18)'; g.beginPath(); g.ellipse(x + w * .42, y + h * .38, w * .26, h * .2, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(40,30,20,.25)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + w * (.2 + rr() * .6), y + h * (.3 + rr() * .5), 3 + rr() * 4, 0, TAU); g.fill(); } };
        plate(-20, -20, W + 40, H * .2 + 20);
        for (const [y0, y1, n, o] of [[.2, .48, 7, 0], [.48, .74, 10, .5], [.74, 1.02, 14, 0]]) for (let i = -1; i <= n; i++) CPAINT.wrap(g, W, (ox) => plate((i + o) / n * W + ox, y0 * H, W / n, (y1 - y0) * H));
      });
      const shell = C.part('bush', null, [0, 0, 0]);
      const leaf = C.M(), root = C.M(), pebble = C.M(), rim = C.M();
      C.build(shell, (b) => {
        b.add(domeGeo(K, ED, 56), shellSkin, null, null, null, {});
        // the oak's roots, down over the shell from the foot of its trunk
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .3, pts = vinePts(ED, a, .02, a + (i % 2 ? .45 : -.45), .74 + (i % 3) * .05, .3, .1, .014); b.add(K.tube(pts, 30, 8, (t) => .036 * (1 - .75 * t) + .006), root, null, null, null, { tint: (v, n) => K.rgb(n.y > .55 ? '#a8743e' : '#7a4a24'), ink: .7 }); }
        // the leaves: thick round the rim and in patches higher up, green vines between
        let sd = 31; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const cols = ['#5aa82a', '#6ab830', '#4e9a24', '#78c23a', '#62b02c'];
        for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + (rr() - .5) * .2, s1 = .6 + rr() * .25 - .3 * Math.pow(Math.max(0, Math.cos(a)), 2); leafOn(b, K, leaf, ED, a, s1, 1.15 + rr() * .35, cols[Math.floor(rr() * 5)], .08 + rr() * .14, (rr() - .5) * 2.4); }
        for (const [pa, ps] of [[.5, .3], [-.8, .35], [1.9, .4], [-2.2, .38], [3.0, .3], [-.1, .45], [1.2, .5]]) for (let i = 0; i < 5; i++) leafOn(b, K, leaf, ED, pa + (rr() - .5) * .5, ps + (rr() - .5) * .14, 1.1 + rr() * .35, cols[Math.floor(rr() * 5)], .15 + rr() * .2, rr() * TAU);
        for (const [a0, s0, a1, s1, mid, wig] of [[-1.5, .8, 1.2, .78, .4, .2], [.8, .8, 3.6, .8, .45, .25], [2.6, .78, 5.0, .8, .5, .2]]) b.add(K.tube(vinePts(ED, a0, s0, a1, s1, mid, wig, .014), 40, 6, () => .007), leaf, null, null, null, { tint: '#4a8a22', ink: .5 });
        // pebbles round the trunk
        for (let i = 0; i < 7; i++) { const { p } = domeAt(ED, i / 7 * TAU + .6, .17 + (i % 2) * .05, .012); b.add(K.lumpy(.026 + (i % 3) * .006, i * 1.7, .2), pebble, p, null, [1, .75, 1], { tint: (v, n) => K.rgb(n.y > .3 ? '#f0e4bc' : '#c8b88c'), ink: .6 }); }
        const RP = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, y = rimY(ED, a), r = domeR(ED, y) + .004; RP.push([Math.sin(a) * r, y, Math.cos(a) * r]); }
        b.add(K.tube(RP, 128, 8, () => .022, 1, null, true), rim, null, null, null, { tint: (v, n) => K.rgb(n.y > .2 ? '#7a6a4a' : '#5a4a32'), ink: .8 });
      });
      for (const [a, s1, k] of [[.25, .2, 1.4], [-.9, .45, 1.3], [1.0, .55, 1.3], [2.2, .45, 1.3], [-2.4, .55, 1.3], [3.0, .7, 1.2], [.7, .75, 1.1]]) { const { p, n } = domeAt(ED, a, s1, .035); flowerAt(C, shell, p, n, k); }
      // the oak: a twisting trunk flaring into its roots, branches up into a broad flat crown of leafy clumps
      const tree = C.part('tree', shell, [0, .5, -.01]);
      const bark = C.M(), crown = C.M();
      C.build(tree, (b) => {
        const BT = (v, n) => K.rgb(n.y > .6 ? '#a8743e' : n.x > .3 ? '#8a5a2e' : '#6e4220');
        b.add(K.tube([[0, -.08, 0], [0, .03, .005], [.014, .09, -.01], [-.006, .15, .004]], 16, 12, curve([[0, .11], [.25, .062], [1, .046]])), bark, null, null, null, { tint: BT });
        for (const [x, y, z] of [[.16, .2, .05], [-.15, .2, .06], [.03, .2, -.17], [-.08, .21, -.12], [.08, .2, .15]]) b.add(K.tube([[0, .12, 0], [x * .45, .16, z * .45], [x, y, z]], 10, 8, (t) => .03 * (1 - .5 * t)), bark, null, null, null, { tint: BT });
        const CT = (v, n) => K.rgb(n.y > .45 ? (spotty(v, .3) ? '#8ac83e' : '#74b632') : n.y > -.15 ? (spotty(v, .3) ? '#5aa22c' : '#4a9026') : '#2a5e1a');
        b.add(K.lumpy(.17, 1, .16), crown, [0, .25, 0], null, [1.35, .62, 1.35], { tint: CT, ink: .8 });
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .2, r = .245 + (i % 2) * .02; b.add(K.lumpy(.12, i * 2.3, .2), crown, [Math.sin(a) * r, .22 + (i % 3) * .015, Math.cos(a) * r * .95], null, [1.1, .72, 1.1], { tint: CT, ink: .8 }); }
        for (const [x, z] of [[.1, .08], [-.11, .06], [.02, -.12], [-.06, -.03], [.05, .0]]) b.add(K.lumpy(.1, x * 40, .2), crown, [x, .3, z], null, [1.2, .6, 1.2], { tint: CT, ink: .8 });
      });
    },
    idle: turtleIdle, act: turtleAct,
  };

  // =====================================================================================================================
  // Embroak's line
  // =====================================================================================================================
  // a texture painted round an ellipsoid's sphere uv from cells on the sphere itself (so there's no seam or pinching):
  // fn(d1, d2, i, y) -> [r, g, b] for each pixel, d1 and d2 its chord distances to the nearest two seeds, i the nearest's index
  function sphereCells(W, H, n, seed, fn) {
    let sd = seed; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const S = []; for (let i = 0; i < n; i++) { const z = rr() * 2 - 1, a = rr() * TAU, q = Math.sqrt(1 - z * z); S.push([q * Math.cos(a), z, q * Math.sin(a)]); }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H), D = im.data;
    for (let j = 0; j < H; j++) { const th = (j + .5) / H * PI, y = Math.cos(th), q = Math.sin(th);
      for (let i = 0; i < W; i++) { const ph = (i + .5) / W * TAU, x = -Math.cos(ph) * q, z = Math.sin(ph) * q; let d1 = 9, d2 = 9, k = 0;
        for (let m = 0; m < n; m++) { const dx = x - S[m][0], dy = y - S[m][1], dz = z - S[m][2], dd = dx * dx + dy * dy + dz * dz; if (dd < d1) { d2 = d1; d1 = dd; k = m; } else if (dd < d2) d2 = dd; }
        const col = fn(Math.sqrt(d1), Math.sqrt(d2), k, y), o = (j * W + i) * 4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255; } }
    g.putImageData(im, 0, 0); return { c, g };
  }
  const hex = (h) => { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; };
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // a flame tongue: a lathe teardrop, its tip curled back (curl) and to the side (lean)
  const flameGeo = (K, w, h, curl, lean) => K.lathe([[0, h], [w * .1, h * .82], [w * .3, h * .55], [w * .42, h * .3], [w * .36, h * .1], [0, 0]], 12, { fn(o) { const k = Math.pow(o[1] / h, 2); o[2] -= curl * h * k; o[0] += (lean || 0) * h * k; } });
  const flameTint = (h, y0) => (v) => { const k = (v.y - y0) / h; return KIT.rgb(k > .7 ? '#ffd23a' : k > .36 ? '#ff8a1a' : '#e23c16'); };
  // the frog grown from Embroak's: d holds measurements, skins and the flames
  function frog(C, K, d) {
    const skin = d.skin, belly = C.M(), dark = C.M(), toe = d.toeMat || C.M();
    const flame = C.M('#ffffff', { mat: { emissive: new THREE.Color('#ff5010'), emissiveIntensity: .25 } });
    const body = C.part('body', null, d.bodyAt, [d.bodyRx, 0, 0]);
    C.build(body, (b) => C.ell(b, skin, [0, 0, 0], d.bodyR, { seg: 32, segv: 20 }));
    const bel = C.part('belly', body, d.bellyAt);
    C.build(bel, (b) => C.ell(b, belly, [0, 0, 0], d.bellyR, { tint: (v) => K.rgb(Math.floor(v.y * 60 + 50) % 3 === 0 ? d.BEL2 : d.BEL), ink: .5 }));
    const throat = C.part('throat', null, d.throatAt);
    C.build(throat, (b) => C.ell(b, belly, [0, 0, 0], d.throatR, { tint: d.BEL, ink: .4 }));
    // the head: wide and flat, the eyes up on top, a heavy brow, a wide mouth
    const head = C.part('head', null, d.headAt);
    const HR = d.headR, ER = d.eyeR;
    const hskin = d.headSkin || skin, hT = d.headTint;
    C.build(head, (b) => {
      C.ell(b, hskin, [0, 0, 0], HR, { seg: 28, tint: hT });
      C.ell(b, belly, [0, -HR[1] * .55, HR[2] * .18], [HR[0] * .82, HR[1] * .45, HR[2] * .8], { tint: d.BEL, ink: .5 });
      for (const sd of [-1, 1]) { C.ell(b, hskin, [sd * HR[0] * .52, HR[1] * .7, HR[2] * .2], ER, { tint: hT }); const BY = d.browY || [.5, .95, .8]; b.add(K.tube([[sd * HR[0] * .2, HR[1] * .95 + ER[1] * BY[0], HR[2] * .5 + (d.browZ || 0)], [sd * HR[0] * .5, HR[1] * .95 + ER[1] * BY[1], HR[2] * .45 + (d.browZ || 0)], [sd * HR[0] * .8, HR[1] * .8 + ER[1] * BY[2], HR[2] * .25]], 10, 8, (t) => d.brow * (1 - .5 * t)), d.browMat || dark, null, null, null, { tint: d.BROW, ink: .6 }); }
      b.add(K.tube([[-HR[0] * .82, -HR[1] * .15, HR[2] * .55], [-HR[0] * .45, -HR[1] * .38, HR[2] * .86], [0, -HR[1] * .45, HR[2] * .98], [HR[0] * .45, -HR[1] * .38, HR[2] * .86], [HR[0] * .82, -HR[1] * .15, HR[2] * .55]], 18, 6, () => .008), dark, null, null, null, { tint: '#3a0a0a', ink: 0 });
      for (const sd of [-1, 1]) C.ell(b, dark, [sd * .025, HR[1] * .35, HR[2] * .97], [.008, .006, .004], { tint: '#3a0a0a', ink: 0, seg: 8, segv: 6 });
    });
    C.eyePair(head, [0, HR[1] * .7, HR[2] * .2], [ER[0] * 2.05, ER[1], ER[2]], .6, d.eyeEl === undefined ? .25 : d.eyeEl, d.eye, d.iris, { tex: d.eyeTex, fwd: d.eyeFwd || .35, roll: d.roll === undefined ? .25 : d.roll });
    if (d.eyeOut) for (const e of C.eyes.slice(-2)) e.position.z += d.eyeOut;
    if (d.tongue) {
      const tng = C.part('tongue', head, [-HR[0] * .47, -HR[1] * .45, HR[2] * .86]), q = d.tongue;
      C.build(tng, (b) => b.add(K.tube([[0, 0, 0], [-.05 * q, -.012 * q, .035 * q], [-.11 * q, -.006 * q, .05 * q], [-.16 * q, .02 * q, .04 * q]], 12, 8, (t) => (.017 * (1 - .3 * t) + .004) * q, .5), C.M(), null, null, null, { tint: '#ec6a7a' }));
      const ember = C.part('ember', tng, [-.175 * q, .04 * q, .04 * q]);
      C.build(ember, (b) => b.add(flameGeo(K, .07 * q, .1 * q, .15, -.3), C.M('#ffffff', { mat: { emissive: new THREE.Color('#ff8a10'), emissiveIntensity: .9 } }), [0, -.03 * q, 0], null, null, { tint: flameTint(.1 * q, -.03 * q), ink: .3 }));
      C.glow(ember, [0, 0, 0], '#ffb040', .16 * q); C.glow(ember, [0, .005, 0], '#ffffff', .06 * q);
      const L = new THREE.PointLight('#ff8a2a', .6, 1.4, 2); L.userData.base = .6; ember.add(L); C.lights.push(L);
    }
    for (const sd of [-1, 1]) {
      const A = d.arm, f = C.part(sd < 0 ? 'armR' : 'armL', null, [sd * A.x, A.y, A.z]);
      C.build(f, (b) => {
        b.add(K.tube([[0, .03, -.02], [sd * .02 * A.k, -.06 * A.k, .02 * A.k], [sd * .035 * A.k, -A.y + .02, .04 * A.k]], 10, 12, () => A.r), d.armSkin || skin, null, null, null, { tint: d.armTint });
        if (d.ring) { C.ell(b, belly, [sd * A.r * .62, -.025, A.r * .62], [A.r * .2, A.r * .62, A.r * .62], { rot: [0, sd * .8, 0], tint: '#fed43a', ink: .5 }); C.ell(b, belly, [sd * A.r * .72, -.025, A.r * .72], [A.r * .14, A.r * .38, A.r * .38], { rot: [0, sd * .8, 0], tint: '#a8203a', ink: 0 }); }
        for (const dd of [-1.5, -.5, .5, 1.5]) { const tp = [sd * .035 * A.k + dd * .028 * A.k, -A.y + .012, .1 * A.k + (1.5 - Math.abs(dd)) * .012]; b.add(K.tube([[sd * .035 * A.k, -A.y + .015, .045 * A.k], tp], 3, 6, () => .012 * A.k), d.armSkin || skin, null, null, null, { tint: d.armTint }); C.ell(b, toe, tp, [.017 * A.k, .012 * A.k, .017 * A.k], { tint: d.TOE, ink: .4, seg: 10, segv: 7 }); }
      });
      const T = d.thigh, h = C.part(sd < 0 ? 'hipR' : 'hipL', null, [sd * T.x, T.y, T.z]);
      C.build(h, (b) => {
        C.ell(b, d.thighSkin || skin, [0, 0, 0], T.r, { rot: [-.35, sd < 0 ? PI : 0, 0], seg: 28 });
        C.ell(b, skin, [sd * .02, -T.y + .02, T.r[2] * .5], [T.r[0] * .55, .025, T.r[2] * .7]);
        for (const dd of [-1.5, -.5, .5, 1.5]) { const tp = [sd * .03 + dd * .034 * T.k, -T.y + .014, T.r[2] * 1.1 + (1.5 - Math.abs(dd)) * .015 * T.k]; b.add(K.tube([[sd * .025 + dd * .012, -T.y + .02, T.r[2] * .7], tp], 3, 6, () => .012 * T.k), skin, null, null, null, {}); C.ell(b, toe, tp, [.019 * T.k, .013 * T.k, .019 * T.k], { tint: d.TOE, ink: .4, seg: 10, segv: 7 }); }
      });
    }
    // the flames: tongues up its brow and down its back, smaller ones either side
    const fl = C.part('flames', null, [0, 0, 0]);
    C.build(fl, (b) => { for (const [x, y, z, w, hh, rx, rz] of d.flames) { b.add(flameGeo(K, w, hh, .3, 0), flame, [x, y, z], [rx, 0, rz], null, { tint: flameTint(hh * Math.cos(rx) * Math.cos(rz), y), ink: .45 }); b.add(flameGeo(K, w * .55, hh * .55, .2, 0), flame, [x, y, z + w * .2], [rx, 0, rz], null, { tint: '#ffc23a', ink: 0 }); } });
    return { skin, belly, dark, flame };
  }
  const frogIdle = (C, t, dt, walk) => {
    const P = C.parts;
    const g = Math.max(0, Math.sin(t * 3.2)); P.throat.scale.set(1 + g * .3, 1 + g * .4, 1 + g * .45);
    if (P.tongue) { P.tongue.rotation.y = Math.sin(t * 1.7) * .12; P.tongue.rotation.z = Math.sin(t * 2.3) * .08; }
    P.head.rotation.z = Math.sin(t * .8) * .04;
    P.flames.scale.y = 1 + .05 * Math.sin(t * 13) + .03 * Math.sin(t * 7.7); P.flames.rotation.z = Math.sin(t * 2.1) * .012;
    if (P.smoke) { P.smoke.rotation.z = Math.sin(t * 1.6) * .25; P.smoke.position.y += (t * .03) % .02; P.smoke.scale.y = 1 + .1 * Math.sin(t * 2.2); }
  };
  const frogAct = (C, name, u) => {
    const P = C.parts, k = Math.sin(u * PI);
    if (name === 'attack' || name === 'cast' || name === 'spin') { P.hipL.rotation.x = -k * .5; P.hipR.rotation.x = -k * .5; }
    if ((name === 'flick' || name === 'spit') && P.tongue) {
      const a = Math.min(1, u / .3) * (1 - Math.min(1, Math.max(0, (u - .3) / .06))), b = u > .3 ? Math.min(1, (u - .3) / .06) * (1 - Math.min(1, Math.max(0, (u - .55) / .4))) : 0;
      P.tongue.rotation.y += -.5 * a + 1.45 * b; P.tongue.rotation.z += .3 * a - .15 * b; P.tongue.scale.x *= 1 + 2.2 * b; P.ember.scale.multiplyScalar(1 + .6 * b); P.throat.scale.multiplyScalar(1 + .3 * a);
    }
    if (name === 'spit' && !P.tongue) { const b = u > .3 ? Math.sin(Math.min(1, (u - .3) / .4) * PI) : 0; P.head.rotation.x -= .25 * b; P.throat.scale.multiplyScalar(1 + .5 * Math.sin(Math.min(1, u / .34) * PI)); }
    if (name === 'puff' || name === 'roar') { P.throat.scale.multiplyScalar(1 + 1.1 * k); P.flames.scale.multiplyScalar(1 + .25 * k); }
    if (name === 'happy' || name === 'cast') P.flames.scale.y *= 1 + .2 * k;
    if (name === 'hit') P.flames.scale.multiplyScalar(1 - .2 * k);
    if (name === 'dustkick') { const s = u < .46 ? Math.sin(u / .46 * PI * 2) : 0, f = KIT.sm(.46, .55, u) * (1 - KIT.sm(.62, 1, u)); P.armL.rotation.x += .5 * s - .5 * f; P.armR.rotation.x -= .5 * s + .5 * f; }
    if (name === 'quakestomp') { const a = KIT.sm(0, .4, u) * (1 - KIT.sm(.44, .5, u)); P.armL.rotation.x -= .9 * a; P.armR.rotation.x -= .9 * a; P.armL.position.y += .05 * a; P.armR.position.y += .05 * a; P.flames.scale.multiplyScalar(1 + .3 * KIT.sm(.45, .55, u) * (1 - u)); }
  };
  // a flame crest along a path from the brow back over the rump: n tongues, tallest at the front, a row either side
  function crest(path, n, h0, h1, w, side) {
    const out = [], cv = new THREE.CatmullRomCurve3(path.map(V3));
    for (let i = 0; i < n; i++) { const t = i / (n - 1), p = cv.getPointAt(t), hh = h0 + (h1 - h0) * t, rx = -.35 - .6 * t;
      out.push([0, p.y - .01, p.z, w * (1 - .3 * t), hh, rx, 0]);
      if (side) for (const sd of [-1, 1]) out.push([sd * side * (1 - .25 * t), p.y - .035 - .03 * t, p.z + .01, w * .75, hh * (i % 2 ? .55 : .72), rx * .8, sd * -.55]);
    }
    return out;
  }

  // ---------- Cinderfrog (sheet: bigger and fiercer, a crest of fire from its brow down its back, crimson spots, a yellow
  // ring on each arm, angry yellow eyes, the ember on its tongue grown to a flame, a wisp of smoke) ----------
  CREATURE_DEFS.cinderfrog = {
    height: .6, eyeY: .42, width: .66, size: 1.15, hopper: true, mouth: [0, -.04, .15], mouthPart: 'ember',
    build(C, K) {
      const O = hex('#fa5e12'), O2 = hex('#cf2a1a'), O3 = hex('#ff8a2a'), SP = hex('#a8203a'), SP2 = hex('#7a1028');
      const spots = (back) => { const { c, g } = sphereCells(512, 256, back ? 34 : 26, back ? 7 : 11, (d1, d2, i, y) => { const base = y > .3 ? mixc(O, O3, (y - .3) / .7) : mixc(O2, O, (y + 1) / 1.3); return d1 < .21 ? (d1 > .18 ? SP2 : SP) : base; });
        if (back) for (const [u, yb, yt, w] of [[.75, .55, .05, .08], [.66, .7, .25, .045], [.84, .7, .25, .045]]) CPAINT.flame(g, u * c.width, yb * c.height, yt * c.height, w * c.width, '#fee019', '#ff9a20');
        const t = new THREE.CanvasTexture(c); return C.M('#ffffff', { mat: { map: t } }); };
      const skin = spots(true), thighSkin = spots(false);
      const plain = C.M(), ot = (v, n) => K.rgb(n.y > .55 ? '#ff8a2a' : n.y > -.3 ? '#fa5e12' : '#cf2a1a');
      frog(C, K, { skin, thighSkin, headSkin: plain, headTint: ot, armSkin: plain, armTint: ot, roll: -.35, BEL: '#fde08a', BEL2: '#f4c860', BROW: '#a82a14', TOE: '#ffb040', brow: .009, browY: [.35, .75, .85], browZ: .01,
        bodyAt: [0, .18, -.05], bodyRx: -.25, bodyR: [.19, .18, .18], bellyAt: [0, .0, .12], bellyR: [.13, .14, .08],
        throatAt: [0, .27, .17], throatR: [.1, .055, .045],
        headAt: [0, .345, .07], headR: [.175, .09, .145], eyeR: [.07, .066, .066], eye: [.07, .068, .026], eyeEl: .2, eyeFwd: .45, iris: ['#5a1a05', '#c8501a', '#f0a040'], eyeTex: { white: '#fde762', rx: 32, ry: 38, lid: '#e8501a', lidK: .26 },
        tongue: 1.2, ring: true,
        arm: { x: .12, y: .16, z: .12, r: .037, k: 1.15 }, thigh: { x: .185, y: .1, z: -.08, r: [.085, .1, .13], k: 1.1 },
        flames: [[0, .41, .1, .17, .2, -.15, 0], [-.075, .4, .08, .13, .15, -.25, .4], [.075, .4, .08, .13, .15, -.25, -.4], [-.17, .32, .05, .1, .12, -.3, .9], [.17, .32, .05, .1, .12, -.3, -.9]]
          .concat(crest([[0, .42, .02], [0, .4, -.1], [0, .33, -.2], [0, .22, -.26]], 7, .18, .1, .15, .075)),
      });
      const smoke = C.part('smoke', null, [.13, .47, -.02]);
      C.build(smoke, (b) => b.add(K.tube([[0, 0, 0], [.02, .035, 0], [-.012, .07, 0], [.015, .105, 0], [-.005, .14, 0]], 24, 6, (t) => .011 * (1 - .5 * t)), C.M(), null, null, null, { tint: '#d8d0e4', ink: .3 }));
    },
    idle: frogIdle, act: frogAct,
  };

  // ---------- Infernotoad (sheet: Fire/Earth, huge and squat, charcoal rock skin split by glowing lava cracks, a mane of
  // fire over its head and down its back, a cream throat in folds, glowing eyes under a heavy brow, glowing toes) ----------
  CREATURE_DEFS.infernotoad = {
    height: .68, eyeY: .4, width: .78, size: 1.3, hopper: true, mouth: [0, -.05, .15],
    build(C, K) {
      const R1 = hex('#4a3428'), R2 = hex('#5e4434'), RD = hex('#2a1a14'), L1 = hex('#ffe060'), L2 = hex('#ff8a1a'), L3 = hex('#c8401a');
      const lava = (n, seed) => {
        const colour = sphereCells(512, 256, n, seed, (d1, d2) => { const e = d2 - d1; return e < .016 ? L1 : e < .04 ? L2 : e < .055 ? L3 : e < .075 ? RD : mixc(R2, R1, Math.min(1, d1 * 2.2)); });
        const glow = sphereCells(512, 256, n, seed, (d1, d2) => { const e = d2 - d1; return e < .016 ? [255, 230, 200] : e < .04 ? [170, 110, 80] : e < .055 ? [60, 25, 10] : [0, 0, 0]; });
        return C.M('#ffffff', { mat: { map: new THREE.CanvasTexture(colour.c), emissiveMap: new THREE.CanvasTexture(glow.c), emissive: new THREE.Color('#ff6a10'), emissiveIntensity: .6 } });
      };
      const skin = lava(60, 3), thighSkin = lava(30, 9);
      const toe = C.M('#ffffff', { mat: { emissive: new THREE.Color('#ff7a10'), emissiveIntensity: .6 } });
      frog(C, K, { skin, thighSkin, toeMat: toe, roll: -.3, eyeOut: .012, BEL: '#fcd27a', BEL2: '#e8b052', BROW: '#3a2418', TOE: '#ffa030', brow: .024, browY: [.15, .55, .6], browZ: .02,
        bodyAt: [0, .21, -.07], bodyRx: -.2, bodyR: [.25, .21, .23], bellyAt: [0, -.01, .15], bellyR: [.16, .14, .09],
        throatAt: [0, .27, .21], throatR: [.14, .05, .05],
        headAt: [0, .33, .12], headR: [.2, .085, .16], eyeR: [.062, .055, .058], eye: [.052, .046, .022], eyeEl: -.05, eyeFwd: .75, iris: ['#c84a00', '#ffb020', '#fff070'], eyeTex: { white: '#ffd040', rx: 34, ry: 40, lid: '#4a3428', lidK: .24, pupil: '#3a0a00' },
        arm: { x: .16, y: .17, z: .13, r: .05, k: 1.3 }, thigh: { x: .22, y: .11, z: -.1, r: [.1, .12, .15], k: 1.3 },
        flames: [[0, .39, .1, .18, .21, -.2, 0], [-.085, .38, .08, .15, .19, -.25, .35], [.085, .38, .08, .15, .19, -.25, -.35], [-.16, .35, .05, .13, .16, -.3, .7], [.16, .35, .05, .13, .16, -.3, -.7], [-.22, .29, .02, .11, .13, -.3, 1.0], [.22, .29, .02, .11, .13, -.3, -1.0]]
          .concat(crest([[0, .41, .02], [0, .42, -.08], [0, .38, -.18], [0, .29, -.27]], 8, .2, .12, .17, .11)),
      });
    },
    idle: frogIdle, act: frogAct,
  };
})();
