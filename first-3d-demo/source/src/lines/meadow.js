// lines/meadow.js: the Meadow Path's evolutions and its uncommon and rare finds. Clove Tastical (Clovermouse grown up, in a
// hooded cloak of clover leaves), Hoppin Pop (Hopsprout grown up, a crown of flowers and big leaf wings), Puffmunk and
// Stashmunk (chipmunks with stuffed cheeks; Stashmunk with an acorn cap and two baskets), and the cloud sheep: Fleecling,
// Cloudram (a thunderhead of wool and lightning horns) and Tempestram (a storm with rain inside and a rainbow on top).
(() => {
  'use strict';
  const { PI, TAU } = KIT;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // keep only the triangles whose centre passes keep(x, y, z) (in the geometry's own space)
  function cutTris(g, keep) {
    const p = g.attributes.position, I = g.index.array, out = [];
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k], b = I[k + 1], c = I[k + 2];
      if (keep((p.getX(a) + p.getX(b) + p.getX(c)) / 3, (p.getY(a) + p.getY(b) + p.getY(c)) / 3, (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3)) out.push(a, b, c);
    }
    g.setIndex(out); return g;
  }
  // a rotation whose local +y points along dir and local +z along face
  function basisQ(dir, face) {
    const d = V3(...dir).normalize(), f = V3(...face); f.addScaledVector(d, -f.dot(d)).normalize();
    const s = new THREE.Vector3().crossVectors(d, f).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(s, d, f));
  }
  const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  // a clover leaflet: a heart, point at the origin, lobes up +y
  const HEART = [[0, 0], [.03, .03], [.046, .06], [.036, .082], [.015, .087], [0, .072], [-.015, .087], [-.036, .082], [-.046, .06], [-.03, .03]];
  // a rounder clover leaflet for the cape: broad, with a small notch at the far end
  const ROUND = [[0, 0], [.035, .012], [.058, .04], [.064, .072], [.05, .098], [.025, .108], [0, .097], [-.025, .108], [-.05, .098], [-.064, .072], [-.058, .04], [-.035, .012]];
  // a pointed leaf along +y, length 1, and a petal
  const LEAFP = [[0, 0], [.11, .12], [.17, .34], [.15, .6], [.09, .84], [0, 1], [-.09, .84], [-.15, .6], [-.17, .34], [-.11, .12]];
  const PETALP = [[0, 0], [.22, .25], [.27, .6], [.13, .9], [0, 1], [-.13, .9], [-.27, .6], [-.22, .25]];
  const scaleP = (P, sx, sy) => P.map(([x, y]) => [x * sx, y * (sy || sx)]);
  // tint a slab by its own (unplaced) coordinates: fn(x, y) -> colour
  const localTint = (geo, fn, K) => { const p = geo.attributes.position; return (v, n, i) => K.rgb(fn(p.getX(i), p.getY(i))); };
  // a four-leaf clover lying in its own xz plane, facing +y (lift: how far each leaflet tips up)
  function clover4(b, K, mat, at, rot, s, lift, cols) {
    const heart = K.slab(HEART, .012, .004);
    for (let i = 0; i < 4; i++) {
      const az = i / 4 * TAU + PI / 4, g = K.place(heart, [Math.sin(az) * .004, 0, Math.cos(az) * .004], [-PI / 2 + lift, az + PI, 0, 'YXZ'], 1);
      b.add(g, mat, at, rot, s, { tint: localTint(heart, (x) => (Math.abs(x) < .006 ? cols[0] : cols[1]), K), ink: .7 });
    }
    b.add(new THREE.SphereGeometry(1, 10, 8), mat, at, rot, [s * .016, s * .01, s * .016], { tint: cols[0], ink: .4 });
  }
  // a five-petal flower facing local +z at pos, oriented by quaternion q
  function flower(b, K, mat, pos, q, s, cols) {
    const pet = K.slab(PETALP, .008, .003);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b.add(K.place(pet, [0, 0, 0], [0, 0, a], [.05, .05, 1]), mat, pos, q, s, { tint: localTint(pet, (x, y) => (y < .35 ? cols[1] : cols[0]), K), ink: .5 }); }
    b.add(K.place(new THREE.SphereGeometry(1, 10, 8), [0, 0, .006], null, [.016, .016, .01]), mat, pos, q, s, { tint: cols[2], ink: .4 });
  }
  // closed, happy eyes: two little arches on a head ellipsoid
  function happyEyes(b, K, mat, C0, R, az, el, w, h, col) {
    for (const sd of [-1, 1]) {
      const pts = []; for (let k = 0; k <= 6; k++) { const s = k / 3 - 1; pts.push(K.onBall(C0, R, sd * (az + s * w), el + h * (1 - s * s), .003).p); }
      b.add(K.tube(pts, 12, 5, () => .0065), mat, null, null, null, { tint: col, ink: 0 });
    }
  }
  // a flat spiral facing +z, on a dome of radius dome (for wool swirls), as a tube
  function spiral(R0, turns, dome) { const pts = []; const n = Math.round(turns * 16); for (let k = 0; k <= n; k++) { const t = k / n, a = t * turns * TAU, r = R0 * (.12 + .88 * t); pts.push([Math.cos(a) * r, Math.sin(a) * r, Math.sqrt(Math.max(0, dome * dome - r * r)) - dome]); } return pts; }

  // ======================= Clove Tastical =======================
  // (sheet: standing up on its hind legs, a clover-leaf hood with a lime rim, the ears out through it, a clover on top,
  //  a cape of heart-shaped clover leaves, a yellow flower brooch, the pink tail curling up with a clover tied on)
  CREATURE_DEFS.clovetastical = {
    height: .74, eyeY: .46, width: .5, size: 1.15, mouth: [0, -.055, .11],
    build(C, K) {
      const fur = C.M(), pink = C.M(), clover = C.M(), cream = C.M(), dark = C.M(), gold = C.M(), leafM = C.M();
      const hoodM = C.M('#ffffff', { mat: { side: THREE.DoubleSide } });
      const F = '#aa9c94', F2 = '#857670', F3 = '#c6bab2', PK = '#f4a99d';
      const G1 = '#3e9c2a', G2 = '#2e8022', G3 = '#5cb434', VEIN = '#a8e050', LIME = '#bde23c';
      const furTint = (v, n) => K.rgb(n.y > .45 ? F3 : n.y > -.3 ? F : F2);
      // legs: standing, grey shins and long pink feet
      for (const sd of [-1, 1]) {
        const lg = C.part(sd < 0 ? 'legR' : 'legL', null, [sd * .062, .15, 0]);
        C.build(lg, (b) => {
          b.add(K.tube([[0, .02, 0], [sd * .004, -.06, .005], [sd * .006, -.125, .012]], 8, 10, (t) => .036 - .01 * t), fur, null, null, null, { tint: furTint });
          C.ell(b, pink, [sd * .008, -.137, .035], [.038, .018, .06], { tint: PK });
          for (const d of [-1, 0, 1]) C.ell(b, pink, [sd * .008 + d * .018, -.14, .088], [.011, .01, .012], { tint: '#f8c0b8', ink: .3 });
        });
      }
      // the body: a round grey torso, the cream belly down the front
      const body = C.part('body', null, [0, 0, 0]);
      C.build(body, (b) => {
        C.ell(b, fur, [0, .225, -.005], [.105, .135, .092], { tint: furTint });
        C.ell(b, cream, [0, .2, .04], [.078, .112, .06], { tint: '#f4e8d2', ink: .5 });
      });
      // the arms, folded up in front of its chest, pink paws
      for (const sd of [-1, 1]) {
        const a = C.part(sd < 0 ? 'armR' : 'armL', null, [sd * .085, .3, .02]);
        C.build(a, (b) => {
          b.add(K.tube([[0, 0, 0], [sd * .005, -.04, .04], [-sd * .02, -.055, .075]], 8, 8, () => .022), fur, null, null, null, { tint: F });
          C.ell(b, pink, [-sd * .026, -.055, .09], [.022, .024, .02], { tint: PK, ink: .4 });
        });
      }
      // the cape: a bell of green from the collar down to the knees, open down the front, with rows of clover leaves on it
      const cloak = C.part('cloak', null, [0, 0, 0]);
      C.build(cloak, (b) => {
        const bell = K.lathe([[.06, .385], [.1, .36], [.13, .315], [.142, .26], [.15, .19], [.158, .12], [.163, .085]], 30, { sz: .92, sub: 2 });
        cutTris(bell, (x, y, z) => !(Math.abs(Math.atan2(x, z)) < .62 && y < .345));
        b.add(bell, hoodM, null, null, null, { tint: (v, n) => K.rgb(v.y > .3 ? G1 : G2), ink: .6 });
        const heart = K.slab(ROUND, .01, .003), r = rnd(11);
        const veinT = localTint(heart, (x, y) => (Math.abs(x) < .0035 || (y > .025 && y < .085 && Math.abs(Math.abs(x) - (y - .025) * .7) < .0035) ? VEIN : y > .05 ? G3 : G1), K);
        const R = (y) => (y > .36 ? .085 : y > .3 ? .13 : y > .2 ? .145 : .158);
        for (const [y0, n, gap, s, back, fl] of [[.265, 9, .5, 1.5, 9, .3], [.375, 8, .3, 1.3, 2.35, .62]]) {
          for (let i = 0; i < n; i++) {
            const az = (i + .5) / n * TAU - PI + (r() - .5) * .1; if (Math.abs(az) < gap || Math.abs(az) > back) continue;
            const rr = R(y0) + .012, p = [Math.sin(az) * rr, y0 + (r() - .5) * .01, Math.cos(az) * rr * .92];
            const out = [Math.sin(az), .3, Math.cos(az)], dir = [Math.sin(az) * (fl + r() * .12), -1, Math.cos(az) * (fl + r() * .12)];
            b.add(heart, leafM, p, basisQ(dir, out), s * (.92 + r() * .16), { tint: veinT, ink: .8 });
          }
        }
        // the big leaf down its back from the hood, veined
        const big = K.slab([[-.14, 0], [-.135, -.07], [-.09, -.15], [0, -.23], [.09, -.15], [.135, -.07], [.14, 0], [.06, .02], [0, .026], [-.06, .02]], .01, .003);
        const bp = big.attributes.position, B0 = bp.array.slice(); for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i), a = x / .14; bp.setX(i, Math.sin(a) * (.14 + z)); bp.setZ(i, Math.cos(a) * (.14 + z) - .14); } big.computeVertexNormals();
        b.add(big, leafM, [0, .392, -.09], [.55, PI, 0], 1, { tint: (v, n, i) => { const ax = Math.abs(B0[i * 3]), y = B0[i * 3 + 1]; let vein = ax < .005; for (const c of [-.17, -.11, -.05]) if (ax < .1 && Math.abs(y - c - ax * .8) < .0045) vein = true; return K.rgb(vein ? VEIN : y > -.12 ? '#36962a' : G2); }, ink: .9 });
      });
      // the brooch: a yellow four-petal flower at the collar, with lime curls either side
      const brooch = C.part('brooch', cloak, [0, .335, .088]);
      brooch.scale.setScalar(1.4); brooch.userData.rest.s.setScalar(1.4);
      C.build(brooch, (b) => {
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + PI / 4; C.ell(b, gold, [Math.sin(a) * .02, Math.cos(a) * .02, 0], [.018, .018, .01], { tint: (v, n) => K.rgb(n.y > .3 ? '#ffe46a' : '#f8c020'), ink: .5 }); }
        C.ell(b, gold, [0, 0, .008], [.011, .011, .008], { tint: '#f09018', ink: .4 });
        for (const sd of [-1, 1]) { const P = spiral(.016, 1.4, 1).map(([x, y]) => [sd * (.045 + x), .008 + y, .0]); b.add(K.tube(P, 20, 5, () => .004), clover, null, null, null, { tint: LIME, ink: .4 }); }
      });
      // the head: Clovermouse's, with brown eyes and an open, happy mouth
      const head = C.part('head', null, [0, .455, .02]);
      const HR = [.118, .106, .104];
      C.build(head, (b) => {
        C.ell(b, fur, [0, 0, 0], HR, { tint: furTint });
        C.ell(b, cream, [0, -.048, .064], [.054, .037, .045], { tint: '#f6ecdc', ink: .4 });
        C.ell(b, pink, [0, -.016, .108], [.016, .012, .012], { tint: '#f07a90', ink: .4 });
        C.ell(b, dark, [0, -.058, .098], [.022, .016, .01], { tint: '#7a2030', ink: .3 });
        C.ell(b, pink, [0, -.064, .102], [.013, .008, .006], { tint: '#f47a8a', ink: 0 });
        for (const sd of [-1, 1]) C.ell(b, pink, [sd * .066, -.036, .078], [.022, .014, .008], { tint: '#f4949a', ink: 0, rot: [0, sd * .7, 0] });
      });
      C.eyePair(head, [0, 0, 0], HR, .37, .02, [.04, .05, .016], ['#2a1408', '#6a3a1a', '#a86a3a'], { fwd: .3 });
      // the hood: a shell round the head, open at the face, a lime rim round the opening
      const hood = C.part('hood', head, [0, .012, -.012]);
      const HD = [.142, .136, .14], ax = V3(0, -.12, 1).normalize(), ca = .52, sa = .854, e1 = V3(1, 0, 0), e2 = new THREE.Vector3().crossVectors(ax, e1);
      C.build(hood, (b) => {
        const g = cutTris(new THREE.SphereGeometry(1, 32, 20), (x, y, z) => { const l = Math.hypot(x, y, z); return y > -.6 && (x * ax.x + y * ax.y + z * ax.z) / l < ca; });
        b.add(g, hoodM, null, null, HD, { tint: (v, n) => K.rgb(v.y > .09 ? G3 : v.y > -.02 ? G1 : G2), ink: .9 });
        const rim = []; for (let k = 0; k <= 40; k++) { const s = -PI / 2 + k / 40 * TAU; const d = ax.clone().multiplyScalar(ca).addScaledVector(e1, Math.cos(s) * sa).addScaledVector(e2, Math.sin(s) * sa); if (d.y > -.56) rim.push([d.x * HD[0], d.y * HD[1], d.z * HD[2]]); }
        rim.sort((p, q) => Math.atan2(p[0], p[1] + .02) - Math.atan2(q[0], q[1] + .02));
        b.add(K.tube(rim, 44, 8, () => .013), clover, null, null, null, { tint: LIME, ink: .7 });
        for (const sd of [-1, 1]) { const P = spiral(.015, 1.3, 1).map(([x, y]) => [sd * (.098 + x), .065 + y, .1]); b.add(K.tube(P, 18, 5, () => .004), clover, null, null, null, { tint: LIME, ink: .4 }); }
      });
      // the ears: very big and round, out through the hood
      for (const sd of [-1, 1]) {
        const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * .12, .09, -.04], [0, sd * -.3, sd * -.5]);
        C.build(ear, (b) => {
          b.add(new THREE.CylinderGeometry(.106, .106, .022, 30), fur, [sd * .04, .062, 0], [PI / 2, 0, 0], null, { tint: F });
          b.add(new THREE.CylinderGeometry(.074, .074, .01, 30), pink, [sd * .041, .058, .013], [PI / 2, 0, 0], null, { tint: '#f39a9a', ink: .3 });
        });
      }
      // the clover on top of the hood, its leaflets cupped up
      const clv = C.part('clover', hood, [0, .132, .015], [.5, 0, 0]);
      C.build(clv, (b) => clover4(b, K, clover, [0, 0, 0], null, 1.55, .5, ['#3a7a22', '#4eaa30']));
      // the tail: out behind it, round to its left, up and curled at the top, a little clover tied on halfway
      const tail = C.part('tail', null, [.02, .1, -.1]);
      const TP = [[0, 0, 0], [.06, -.03, -.05], [.15, -.02, -.07], [.22, .04, -.06], [.26, .13, -.04], [.27, .22, -.03], [.255, .29, -.02], [.215, .31, -.02], [.19, .28, -.02], [.205, .25, -.02], [.23, .262, -.02]];
      C.build(tail, (b) => b.add(K.tube(TP, 44, 8, (t) => .016 * (1 - .45 * t) + .004), pink, null, null, null, { tint: PK }));
      const tc = C.part('tailClover', tail, [.262, .15, -.03], [0, .9, -.2]);
      C.build(tc, (b) => { clover4(b, K, clover, [0, 0, .015], [PI / 2, 0, 0], .75, .15, ['#5a9a2e', '#86d040']); b.add(new THREE.TorusGeometry(.019, .006, 6, 16), clover, [0, 0, 0], [PI / 2, 0, 0], null, { tint: '#4a8a2a', ink: .4 }); });
    },
    idle(C, t, dt, walk) {
      const P = C.parts;
      P.tail.rotation.y = Math.sin(t * 1.6) * .18; P.tail.rotation.z = Math.sin(t * 1.1) * .06;
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.3)), 20); P.earL.rotation.z -= tw * .3; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 20) * .3;
      P.head.rotation.z = Math.sin(t * .9) * .06; P.head.rotation.x = Math.sin(t * 6) * .01;
      P.clover.rotation.y = Math.sin(t * 1.2) * .15; P.cloak.rotation.y = Math.sin(t * 1.4) * .03; P.cloak.scale.x = 1 + .015 * Math.sin(t * 2.4);
      P.armL.rotation.x = Math.sin(t * 2.4) * .05; P.armR.rotation.x = Math.sin(t * 2.4) * .05;
      if (walk) { const s = Math.sin(t * 12); P.legL.rotation.x = s * .45; P.legR.rotation.x = -s * .45; P.cloak.rotation.z = s * .03; }
    },
    act(C, name, u) {
      const P = C.parts, k = Math.sin(u * PI);
      if (name === 'attack' || name === 'chomp') { P.armL.rotation.x -= .9 * k; P.armR.rotation.x -= .9 * k; P.head.position.z += .02 * k; }
      if (name === 'cast') { const a = Math.sin(Math.min(1, u / .45) * PI / 2) * (1 - Math.max(0, (u - .5) / .5)); P.armL.rotation.x -= 2.2 * a; P.armR.rotation.x -= 2.2 * a; P.armL.rotation.z -= .3 * a; P.armR.rotation.z += .3 * a; P.cloak.scale.x *= 1 + .08 * a; P.cloak.scale.z *= 1 + .08 * a; }
      if (name === 'spit' || name === 'roar') { P.head.rotation.x -= .2 * k; P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
      if (name === 'puff' || name === 'happy') { P.earL.rotation.z -= .4 * k; P.earR.rotation.z += .4 * k; P.clover.rotation.y += u * 8; P.armL.rotation.x -= .8 * k; P.armR.rotation.x -= .8 * k; }
      if (name === 'spin') { P.cloak.scale.x *= 1 + .25 * k; P.cloak.scale.z *= 1 + .25 * k; P.cloak.position.y -= .04 * k; P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
      if (name === 'hit') { P.earL.rotation.z += .3 * k; P.earR.rotation.z -= .3 * k; }
      if (name === 'curl' || name === 'tuck') { P.armL.rotation.x -= .5 * k; P.armR.rotation.x -= .5 * k; P.head.rotation.x += .25 * k; P.cloak.scale.x *= 1 + .1 * k; P.cloak.scale.z *= 1 + .1 * k; }
    },
  };

  // ======================= Hoppin Pop =======================
  // (sheet: Hopsprout taller and bolder: a crown of pink flowers, curled antennae, a pink petal collar, two big leaf wings
  //  folded along its back, big hind legs, and a flowering vine hanging off the tip of its tail)
  CREATURE_DEFS.hoppinpop = {
    height: .56, eyeY: .38, width: .56, size: 1.15, hopper: true, mouth: [0, -.065, .1],
    build(C, K) {
      const lime = C.M(), leaf = C.M(), wing = C.M(), dark = C.M(), petal = C.M(), cream = C.M();
      const L1 = '#8bd424', L2 = '#3e8e22', L3 = '#c8f42a', PALE = '#eefcb0', BEL = '#f8e2a4';
      const PK = ['#f48c9c', '#fcd2d2', '#f8a818'];
      const limeTint = (v, n) => K.rgb(n.y > .4 ? L3 : n.y > -.35 ? L1 : L2);
      const body = C.part('body', null, [0, 0, 0]);
      C.build(body, (b) => {
        C.ell(b, lime, [0, .205, .05], [.078, .085, .085], { tint: (v, n) => K.rgb(n.z > .3 && n.y < .2 ? BEL : n.y > .4 ? L3 : L1) });
        const AB = [[0, .21, 0], [0, .2, -.12], [0, .18, -.24], [0, .165, -.31]];
        b.add(K.tube(AB, 20, 14, (t) => .07 * (1 - .55 * t * t) + .014), lime, null, null, null, { tint: (v, n) => K.rgb(n.y < -.35 ? BEL : n.y > .3 ? L3 : L1) });
        C.ell(b, lime, [0, .165, -.315], [.026, .026, .022], { tint: L1 });
      });
      // the collar: pointed pink petals round its neck, green leaves between
      const collar = C.part('collar', null, [0, .255, .11]);
      C.build(collar, (b) => {
        const pet = K.slab(scaleP(PETALP, .085, .14), .008, .003), lf = K.slab(scaleP(LEAFP, .075, .12), .007, .003);
        const A = V3(0, .5, .87).normalize(), e1 = V3(1, 0, 0), e2 = new THREE.Vector3().crossVectors(A, e1);
        for (let i = 0; i < 14; i++) {
          const s = i / 14 * TAU + .1, rd = e1.clone().multiplyScalar(Math.cos(s)).addScaledVector(e2, Math.sin(s));
          if (rd.y > .55) continue; // not up under its chin at the back
          const p = rd.clone().multiplyScalar(.07), dir = rd.clone().addScaledVector(A, -.45).add(V3(0, -.25, 0)), face = A.clone().addScaledVector(rd, .3);
          const isLeaf = i % 2 === 1;
          b.add(isLeaf ? lf : pet, isLeaf ? leaf : petal, [p.x, p.y, p.z], basisQ([dir.x, dir.y, dir.z], [face.x, face.y, face.z]), isLeaf ? .95 : 1.05, { tint: isLeaf ? localTint(lf, (x) => (Math.abs(x) < .004 ? '#9ae050' : '#4aa82a'), K) : localTint(pet, (x, y) => (y > .1 ? '#fcd0d0' : y > .045 ? '#f490a0' : '#e8708a'), K), ink: .6 });
        }
      });
      // the head: bigger and rounder than Hopsprout's, a pale muzzle and a wide open smile, small brown eyes
      const head = C.part('head', null, [0, .345, .15]);
      const HR = [.148, .132, .122];
      C.build(head, (b) => {
        C.ell(b, lime, [0, 0, 0], HR, { tint: limeTint });
        C.ell(b, cream, [0, -.05, .06], [.082, .056, .06], { tint: '#e8f8a8', ink: .4 });
        C.ell(b, dark, [0, -.068, .108], [.032, .019, .013], { tint: '#8a2030', ink: .3 });
        C.ell(b, dark, [0, -.076, .112], [.019, .008, .008], { tint: '#f4808a', ink: 0 });
        for (const sd of [-1, 1]) { b.add(new THREE.ConeGeometry(.006, .014, 6), cream, [sd * .014, -.054, .116], [PI, 0, 0], null, { tint: '#ffffff', ink: 0 }); C.ell(b, cream, [sd * .08, -.035, .075], [.022, .014, .008], { tint: '#f4a0a0', ink: 0, rot: [0, sd * .7, 0] }); }
      });
      C.eyePair(head, [0, 0, 0], HR, .4, .14, [.034, .042, .014], ['#2a1406', '#5a3010', '#8a5020'], { fwd: .2 });
      // the crown: pink flowers and buds on a bed of leaves over the top of its head
      const crown = C.part('crown', head, [0, .095, -.005]);
      C.build(crown, (b) => {
        const lf = K.slab(scaleP(LEAFP, .07, .11), .007, .003), r = rnd(5);
        for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, out = [Math.sin(a), .45, Math.cos(a)]; b.add(lf, leaf, [Math.sin(a) * .06, -.01, Math.cos(a) * .056], basisQ([Math.sin(a), .25, Math.cos(a)], [0, 1, 0]), 1 + r() * .3, { tint: localTint(lf, (x) => (Math.abs(x) < .004 ? '#9ae050' : i % 2 ? '#4aa82a' : '#5cbc30'), K), ink: .6 }); }
        C.ell(b, leaf, [0, 0, 0], [.09, .035, .085], { tint: '#4aa82a', ink: .5 });
        flower(b, K, petal, [0, .04, .07], basisQ([0, 1, -.3], [0, .35, 1]), 2.1, PK);
        for (const [a, y, s] of [[1.2, .03, 1.6], [-1.2, .03, 1.6], [2.4, .035, 1.5], [-2.4, .035, 1.5]]) flower(b, K, petal, [Math.sin(a) * .072, y, Math.cos(a) * .066], basisQ([0, 1, 0], [Math.sin(a), .4, Math.cos(a)]), s, PK);
        for (const a of [.6, -.6, 1.8, -1.8, PI, 2.9, -2.9]) {
          const p = [Math.sin(a) * .088, .02, Math.cos(a) * .08], d = [Math.sin(a), .9, Math.cos(a)];
          b.add(new THREE.SphereGeometry(1, 10, 8), petal, p, basisQ(d, [0, 0, 1]), [.022, .036, .022], { tint: (v, n) => K.rgb(n.y > .3 ? '#fcc8c8' : '#f08a98'), ink: .5 });
        }
      });
      // the antennae: up out of the crown and curled outward at the tips
      for (const sd of [-1, 1]) {
        const an = C.part(sd < 0 ? 'antR' : 'antL', head, [sd * .035, .11, .0]);
        const P = [[0, 0, 0], [sd * .015, .08, .01], [sd * .045, .16, .0], [sd * .09, .22, -.01]];
        for (let k = 1; k <= 18; k++) { const a = 2.6 - k / 18 * 1.35 * TAU, r = .055 * (1 - .65 * k / 18); P.push([sd * (.138 + Math.cos(a) * r), .193 + Math.sin(a) * r, -.01]); }
        C.build(an, (b) => b.add(K.tube(P, 40, 7, (t) => .013 * (1 - .4 * t) + .004), lime, null, null, null, { tint: (v, n) => K.rgb(n.y > .2 ? L3 : L1), ink: .6 }));
      }
      // the wings: two big leaves either side, folded along its back like a roof, tips raised behind
      const wings = C.part('wings', body, [0, .27, .03]);
      C.build(wings, (b) => {
        const big = K.slab(scaleP(LEAFP, .42, .46), .008, .003), small = K.slab(scaleP(LEAFP, .3, .38), .007, .003);
        const tintOf = (g, c1, c2) => localTint(g, (x, y) => (Math.abs(x) < .006 || (Math.abs(x) > .012 && Math.abs(((y - Math.abs(x) * 1.3) % .065)) < .006) ? '#b8f060' : x > 0 ? c1 : c2), K);
        for (const sd of [-1, 1]) {
          b.add(small, wing, [sd * .035, .0, 0], basisQ([sd * .12, .42, -1], [sd * .9, .4, 0]), 1, { tint: tintOf(small, '#3e9a2a', '#2e7a22'), ink: .8 });
          b.add(big, wing, [sd * .05, .02, .02], basisQ([sd * .08, .3, -1], [sd * .85, .52, 0]), 1, { tint: tintOf(big, '#78d038', '#56b42e'), ink: .9 });
        }
      });
      for (const sd of [-1, 1]) {
        // four front legs, each bent out at the knee, longer than Hopsprout's
        for (const [j, z, fz] of [[0, .09, .14], [1, .02, -.02]]) {
          const lg = C.part('leg' + j + (sd < 0 ? 'R' : 'L'), null, [sd * .05, .19, z]);
          C.build(lg, (b) => { b.add(K.tube([[0, 0, 0], [sd * .08, .04, (fz - z) * .3], [sd * .14, .03, (fz - z) * .6], [sd * .175, -.07, fz - z], [sd * .19, -.18, fz - z + .01]], 16, 7, (t) => .025 * (1 - .4 * t) + .006), lime, null, null, null, { tint: (v, n) => K.rgb(n.y > .3 ? L3 : L1), ink: .6 }); C.ell(b, lime, [sd * .192, -.184, fz - z + .028], [.019, .01, .028], { tint: L2, ink: .4 }); });
        }
        // the big hind leg: a thick thigh back to a high knee, the shin down to the ground behind
        const h = C.part(sd < 0 ? 'hindR' : 'hindL', null, [sd * .075, .19, -.05]);
        C.build(h, (b) => {
          b.add(K.tube([[0, -.01, .04], [sd * .04, .06, -.07], [sd * .065, .13, -.19], [sd * .07, .16, -.25]], 16, 12, (t) => .054 * (1 - .6 * t) + .01, .8), lime, null, null, null, { tint: (v, n) => K.rgb(n.x * sd > .55 && n.y > -.2 ? PALE : n.y > .3 ? L3 : L1) });
          C.ell(b, lime, [sd * .07, .16, -.25], [.024, .024, .024], { tint: L1, ink: .5 });
          b.add(K.tube([[sd * .07, .16, -.25], [sd * .08, .06, -.27], [sd * .085, -.06, -.28], [sd * .085, -.18, -.26]], 14, 7, (t) => .019 * (1 - .3 * t) + .005), lime, null, null, null, { tint: L1, ink: .6 });
          C.ell(b, lime, [sd * .085, -.184, -.23], [.021, .011, .038], { tint: L2, ink: .5 });
        });
      }
      // the vine off the tip of its tail: a pink flower, buds, and a curl
      const vine = C.part('vine', null, [0, .165, -.33]);
      C.build(vine, (b) => {
        const VP = [[0, 0, 0], [.012, -.04, -.025], [-.012, -.08, -.03], [.01, -.12, -.035], [-.006, -.155, -.03], [0, -.18, -.02]];
        b.add(K.tube(VP, 24, 6, () => .008), leaf, null, null, null, { tint: '#3e8a2a', ink: .6 });
        const tw = []; for (let k = 0; k <= 20; k++) { const a = k / 20 * TAU * 2.2; tw.push([Math.cos(a) * .014, -k / 20 * .17, -.028 + Math.sin(a) * .014]); }
        b.add(K.tube(tw, 40, 4, () => .003), leaf, null, null, null, { tint: '#6ac040', ink: .3 });
        flower(b, K, petal, [0, -.03, -.05], basisQ([0, 1, 0], [0, -.1, -1]), 1.7, PK);
        for (const [p, s] of [[[.018, -.09, -.04], 1], [[-.016, -.13, -.04], .8], [[.008, -.17, -.03], .7]]) b.add(new THREE.SphereGeometry(1, 10, 8), petal, p, null, [.013 * s, .02 * s, .013 * s], { tint: (v, n) => K.rgb(n.y > .3 ? '#fcc8c8' : '#f08a98'), ink: .5 });
        C.ell(b, leaf, [0, -.19, -.02], [.012, .02, .012], { tint: '#6ac040', ink: .4 });
      });
    },
    idle(C, t, dt, walk) {
      const P = C.parts;
      P.antL.rotation.z = Math.sin(t * 2.1) * .12; P.antR.rotation.z = -Math.sin(t * 2.4 + 1) * .12; P.antL.rotation.x = Math.sin(t * 1.3) * .08; P.antR.rotation.x = Math.sin(t * 1.5) * .08;
      P.head.rotation.z = Math.sin(t * .8) * .06; P.wings.rotation.x = Math.sin(t * 9) * .015; P.vine.rotation.x = Math.sin(t * 1.7) * .12; P.vine.rotation.z = Math.sin(t * 1.3) * .1;
      P.crown.rotation.y = Math.sin(t * .9) * .05;
    },
    act(C, name, u) {
      const P = C.parts, k = Math.sin(u * PI);
      if (name === 'attack' || name === 'hop' || name === 'happy' || name === 'spin') { P.hindL.rotation.x = -k * .7; P.hindR.rotation.x = -k * .7; P.wings.rotation.x = -k * .4; P.vine.rotation.x += .6 * k; }
      if (name === 'crouch') { const c = Math.min(1, u * 2); P.hindL.rotation.x = .35 * c; P.hindR.rotation.x = .35 * c; P.antL.rotation.x += .3 * c; P.antR.rotation.x += .3 * c; }
      if (name === 'tuck') { P.hindL.rotation.x = -1.1; P.hindR.rotation.x = -1.1; P.wings.rotation.x = -.5; P.antL.rotation.x -= .4; P.antR.rotation.x -= .4; P.vine.rotation.x += .9; }
      if (name === 'spit' || name === 'chomp' || name === 'roar') { P.head.position.z += .04 * k; P.antL.rotation.x += .5 * k; P.antR.rotation.x += .5 * k; P.collar.scale.multiplyScalar(1 + .25 * k); }
      if (name === 'puff' || name === 'cast') { P.collar.scale.multiplyScalar(1 + .3 * k); P.crown.scale.multiplyScalar(1 + .15 * k); P.wings.rotation.x -= .3 * k; }
      if (name === 'fantastichop') { P.hindL.rotation.x = -1.3 * k; P.hindR.rotation.x = -1.3 * k; P.wings.rotation.x -= .6 * k; P.vine.rotation.x += 1.1 * k; P.antL.rotation.x -= .5 * k; P.antR.rotation.x -= .5 * k; }
    },
  };

  // ======================= Puffmunk and Stashmunk =======================
  // (sheets: a round chipmunk sitting up, the cheeks stuffed huge with red berries poking out, eyes shut tight with joy,
  //  stripes down its head and back, a big striped tail curling up behind. Stashmunk: bigger, an acorn cap, a basket of
  //  nuts and berries on either hip, a green leaf held across its chest)
  function munk(C, K, S) {
    const fur = C.M(), cream = C.M(), dark = C.M(), berry = C.M(), wood = C.M(), leaf = C.M();
    const FU = '#b86a26', FU2 = '#8a4a1a', FU3 = '#d88a40', CR = '#fadcaa', CR2 = '#e8bc80', DK = '#6a3412', FT = '#7a4016';
    const k = S ? 1.12 : 1; // Stashmunk is rounder all over
    const furTint = (v, n) => K.rgb(n.y > .45 ? FU3 : n.y > -.35 ? FU : FU2);
    const berryTint = (v, n) => K.rgb(n.y > .55 ? '#ff9a8a' : n.y > -.25 ? '#e0242a' : '#a01418');
    // painted skins on spheres turned on their sides (poles left and right), so the stripes run front to back over the
    // top: canvas x .25 is the front, .5 the top, .75 the back; canvas y .5 is the middle, 0 its right side, 1 its left
    const band = (g, W, H, x0, x1, y0, y1, c) => { g.fillStyle = c; for (const [a, b] of [[y0, y1], [1 - y1, 1 - y0]]) g.fillRect(x0 * W, a * H, (x1 - x0) * W, (b - a) * H); };
    const shade = (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, FU2); gr.addColorStop(.2, FU); gr.addColorStop(.5, FU3); gr.addColorStop(.8, FU); gr.addColorStop(1, FU2); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
    const bodySkin = C.paint(512, 256, (g, W, H) => {
      shade(g, W, H);
      band(g, W, H, .55, .97, .465, .5, DK); band(g, W, H, .56, .95, .42, .465, CR); band(g, W, H, .58, .93, .33, .37, DK); band(g, W, H, .58, .92, .29, .33, CR);
      band(g, W, H, .5, .9, .12, .155, DK); band(g, W, H, .5, .88, .09, .12, CR);
    });
    const headSkin = C.paint(512, 256, (g, W, H) => {
      shade(g, W, H);
      band(g, W, H, .33, .88, .475, .5, DK); band(g, W, H, .34, .86, .44, .475, CR); band(g, W, H, .4, .8, .37, .395, DK);
    });
    const SIDE = [0, 0, PI / 2];
    const body = C.part('body', null, [0, 0, 0]);
    C.build(body, (b) => {
      C.ell(b, bodySkin, [0, .16 * k, -.01], [.16 * k, .17 * k, .15 * k], { rot: SIDE, seg: 32, segv: 24 });
      C.ell(b, cream, [0, .145 * k, .06 * k], [.12 * k, .13 * k, .1 * k], { tint: (v, n) => K.rgb(n.y > -.3 ? CR : CR2), ink: .5 });
      for (const sd of [-1, 1]) {
        C.ell(b, fur, [sd * .11 * k, .07, .02], [.075 * k, .07, .095 * k], { tint: furTint });
        C.ell(b, fur, [sd * .085 * k, .018, .1 * k], [.058, .022, .065], { tint: FT });
      }
    });
    // the head: round, stripes over the top, a cream face, eyes shut in two happy arches, a little open mouth
    const head = C.part('head', null, [0, .36 * k, .03]);
    const HR = [.14 * k, .122 * k, .12 * k];
    C.build(head, (b) => {
      C.ell(b, headSkin, [0, 0, 0], [HR[1], HR[0], HR[2]], { rot: SIDE, seg: 32, segv: 24 });
      C.ell(b, cream, [0, -.03 * k, .065 * k], [.085 * k, .065 * k, .06 * k], { tint: CR, ink: .4 });
      C.ell(b, dark, [0, -.012 * k, .122 * k], [.014, .01, .01], { tint: '#3a1a0a', ink: .3 });
      C.ell(b, dark, [0, -.05 * k, .113 * k], [.024, .018, .01], { tint: '#7a1a24', ink: .3 });
      C.ell(b, dark, [0, -.057 * k, .117 * k], [.014, .008, .006], { tint: '#f47a8a', ink: 0 });
      happyEyes(b, K, dark, [0, 0, 0], HR, .34, .13, .13, .05, '#3a1a0a');
    });
    // the ears: rounded points, cream inside
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, S ? [sd * .118, .09, -.02] : [sd * .078, .09, -.02], [0, 0, sd * (S ? -.75 : -.3)]);
      C.build(ear, (b) => {
        b.add(K.lathe([[0, .1], [.02, .085], [.042, .05], [.05, .015], [.045, -.01]], 14, { sz: .5 }), fur, null, null, null, { tint: furTint });
        b.add(K.lathe([[0, .085], [.016, .07], [.03, .04], [.034, .01], [.03, -.005]], 12, { sz: .3, cz: .016 }), cream, null, null, null, { tint: '#f6d8b0', ink: .3 });
      });
    }
    // the cheeks: stuffed to bursting, berries poking out at the sides
    for (const sd of [-1, 1]) {
      const ch = C.part(sd < 0 ? 'cheekR' : 'cheekL', head, [sd * .1 * k, -.048 * k, .048 * k]);
      const CRr = [.108 * k, .096 * k, .094 * k];
      C.build(ch, (b) => {
        C.ell(b, cream, [0, 0, 0], CRr, { tint: (v, n) => K.rgb(n.y > -.4 ? CR : CR2) });
        for (const [az, el, r] of [[1.05, .55, .028], [1.35, .2, .03], [.75, .85, .024], [1.6, .6, .022]]) { const { p } = K.onBall([0, 0, 0], CRr, sd * az, el, .012); C.ell(b, berry, p, [r * k, r * k, r * k], { tint: berryTint, ink: .6, seg: 12, segv: 9 }); }
      });
    }
    // the paws, up in front of its mouth: a berry (Puffmunk) or a long green leaf held across its chest (Stashmunk)
    const paws = C.part('paws', null, [0, .245 * k, .15 * k]);
    C.build(paws, (b) => {
      if (!S) {
        C.ell(b, berry, [0, .005, .035], [.045, .042, .042], { tint: berryTint, ink: .7 });
        b.add(K.tube([[0, .045, .035], [.005, .062, .03]], 3, 5, () => .004), leaf, null, null, null, { tint: '#5a3a10', ink: .3 });
        for (const sd of [-1, 1]) C.ell(b, fur, [sd * .045, -.01, .03], [.03, .035, .03], { tint: FU2, ink: .5 });
      } else {
        const lf = K.slab(scaleP(LEAFP, .07, .3), .012, .004);
        b.add(lf, leaf, [-.12, .09, .03], basisQ([1, -.85, .05], [0, .15, 1]), 1, { tint: localTint(lf, (x) => (Math.abs(x) < .004 ? '#9ae060' : x > 0 ? '#5cb838' : '#3e9a2a'), K), ink: .8 });
        for (const sd of [-1, 1]) C.ell(b, fur, [sd * .045, sd * -.025 + .01, .055], [.032, .036, .03], { tint: FU2, ink: .5 });
      }
    });
    // the tail: up behind it in a big S, the tip curling back, striped along its length
    const tail = C.part('tail', null, [0, .1 * k, -.12 * k]);
    const ts = S ? 1.18 : 1;
    const TP = [[0, 0, 0], [0, .04, -.1], [0, .14, -.17], [0, .25, -.18], [0, .34, -.16], [0, .39, -.21], [0, .37, -.3], [0, .29, -.33]].map(([x, y, z]) => [x, y * ts * k * .88, z * ts]);
    // (painted along its length: canvas y .5 and 0/1 are its two flat sides, .25 and .75 its edges)
    const tailSkin = C.paint(256, 128, (g, W, H) => {
      g.fillStyle = FU; g.fillRect(0, 0, W, H);
      for (const c of [0, .5, 1]) { g.fillStyle = CR; g.fillRect(0, (c - .17) * H, W, .34 * H); g.fillStyle = DK; g.fillRect(0, (c - .11) * H, W, .22 * H); g.fillStyle = FU3; g.fillRect(0, (c - .04) * H, W, .08 * H); }
      for (const c of [.25, .75]) { g.fillStyle = CR; g.fillRect(0, (c - .05) * H, W, .1 * H); }
    });
    const rT = (t) => (.068 + .03 * Math.sin(t * PI)) * ts * (t > .88 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - .88) / .12, 2))) : 1) + .002;
    C.build(tail, (b) => b.add(K.tube(TP, 48, 18, rT, 1.1, (c, n) => n.set(1, 0, 0)), tailSkin));
    // Stashmunk's acorn cap and baskets
    if (S) {
      const cap = C.part('cap', head, [0, .055, -.012], [-.12, 0, 0]);
      C.build(cap, (b) => {
        const fr = (x) => x - Math.floor(x);
        b.add(K.lathe([[0, .095], [.07, .088], [.125, .064], [.158, .028], [.168, -.008], [.16, -.028]], 36, { sub: 3 }), wood, null, null, null, { tint: (v) => { const row = v.y * 55, col = Math.atan2(v.x, v.z) / TAU * 22 + Math.floor(row) * .5; return K.rgb(fr(row) < .2 || fr(col) < .14 ? '#6a3a14' : v.y > .06 ? '#c08048' : '#a8682e'); } });
        b.add(K.tube([[0, .09, 0], [0, .12, .005], [.01, .14, .0]], 6, 8, (t) => .016 - .005 * t), wood, null, null, null, { tint: '#8a5020', ink: .6 });
      });
      for (const sd of [-1, 1]) {
        const bk = C.part(sd < 0 ? 'basketR' : 'basketL', null, [sd * .175, .22, -.055], [0, sd * .3, sd * -.06]);
        bk.scale.setScalar(1.2); bk.userData.rest.s.setScalar(1.2);
        C.build(bk, (b) => {
          b.add(K.lathe([[.072, .062], [.084, .03], [.082, -.01], [.07, -.05], [.042, -.076], [0, -.082]], 24, { sub: 2 }), wood, null, null, null, { tint: (v) => { const a = Math.floor((Math.atan2(v.x, v.z) / TAU + .5) * 16), r = Math.floor((v.y + .1) * 45); return K.rgb((a + r) % 2 ? '#b87838' : '#8a5222'); } });
          b.add(new THREE.TorusGeometry(.072, .01, 6, 24), wood, [0, .062, 0], [PI / 2, 0, 0], null, { tint: '#7a4418', ink: .6 });
          const r = rnd(sd > 0 ? 3 : 9), lf = K.slab(scaleP(LEAFP, .045, .08), .006, .002);
          for (let i = 0; i < 11; i++) { const a = i * 2.4, rr = i < 1 ? 0 : i < 5 ? .03 : .055, h = i < 1 ? .115 : i < 5 ? .095 : .07; const nut = (i + (sd > 0 ? 1 : 0)) % 3 !== 0; C.ell(b, nut ? wood : berry, [Math.sin(a) * rr, h, Math.cos(a) * rr], nut ? [.028, .024, .028] : [.021, .021, .021], { tint: nut ? (v, n) => K.rgb(n.y > .3 ? '#e0a050' : '#b8782e') : berryTint, ink: .5, seg: 12, segv: 9 }); }
          for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + r(); b.add(lf, leaf, [Math.sin(a) * .06, .07, Math.cos(a) * .06], basisQ([Math.sin(a), .6, Math.cos(a)], [Math.cos(a), .3, -Math.sin(a)]), 1, { tint: '#4aa82a', ink: .5 }); }
        });
      }
      // a leaf strap from each basket up over its shoulders
      C.build(body, (b) => { for (const sd of [-1, 1]) b.add(K.tube([[sd * .2, .27, -.03], [sd * .17, .33, -.08], [sd * .09, .37, -.13], [0, .38, -.15]], 10, 5, () => .01, .5), leaf, null, null, null, { tint: '#4aa82a', ink: .5 }); });
    }
  }
  const munkIdle = (C, t, dt, walk) => {
    const P = C.parts;
    P.tail.rotation.x = Math.sin(t * 1.7) * .06; P.tail.rotation.z = Math.sin(t * 1.2) * .08;
    P.head.rotation.z = Math.sin(t * .9) * .05; P.head.rotation.x = Math.sin(t * 7) * .012;
    const ch = 1 + .03 * Math.sin(t * 7); P.cheekL.scale.setScalar(ch); P.cheekR.scale.setScalar(ch);
    P.paws.position.y += Math.sin(t * 7) * .004;
    const tw = Math.pow(Math.max(0, Math.sin(t * 1.4)), 16); P.earL.rotation.z -= tw * .25; P.earR.rotation.z += tw * .25;
    if (walk) P.tail.rotation.x += Math.sin(t * 14) * .1;
  };
  const munkAct = (C, name, u) => {
    const P = C.parts, k = Math.sin(u * PI);
    if (name === 'attack' || name === 'chomp') { P.paws.position.z += .05 * k; P.head.position.z += Math.abs(Math.sin(u * PI * 4)) * .025 * (1 - u); }
    if (name === 'cheekstash') { const s = 1 + .45 * Math.sin(Math.min(1, u * 1.6) * PI / 2) * (1 - Math.max(0, (u - .7) / .3) * .6) + .06 * Math.sin(u * 40) * k; P.cheekL.scale.setScalar(s); P.cheekR.scale.setScalar(s); P.paws.position.y += .03 * k; P.paws.position.z -= .02 * k; P.tail.rotation.x -= .25 * k; }
    if (name === 'puff' || name === 'happy') { const s = 1 + .25 * k; P.cheekL.scale.setScalar(s); P.cheekR.scale.setScalar(s); P.tail.scale.multiplyScalar(1 + .12 * k); P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
    if (name === 'spit' || name === 'roar') { P.head.rotation.x -= .2 * k; P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
    if (name === 'hit' || name === 'shake') P.tail.rotation.x -= .3 * k;
    if (name === 'curl' || name === 'tuck') { P.tail.rotation.x += .5 * k; P.head.rotation.x += .2 * k; P.head.position.y -= .02 * k; }
  };
  CREATURE_DEFS.puffmunk = { height: .56, eyeY: .38, width: .48, size: 1, mouth: [0, -.05, .12], build(C, K) { munk(C, K, 0); }, idle: munkIdle, act: munkAct };
  CREATURE_DEFS.stashmunk = { height: .66, eyeY: .43, width: .6, size: 1.15, mouth: [0, -.055, .13], build(C, K) { munk(C, K, 1); }, idle: munkIdle, act: (C, name, u) => { munkAct(C, name, u); const P = C.parts, k = Math.sin(u * PI); if (name === 'hit' || name === 'attack' || name === 'hop') { P.basketL.rotation.z -= .2 * k; P.basketR.rotation.z += .2 * k; } } };

  // ======================= Fleecling, Cloudram and Tempestram =======================
  // (sheets: a sheep of real cloud: lobed wool puffs, white on top and blue underneath, swirls on its brow and back, a dark
  //  brown face, short dark legs. Fleecling: floppy ears, eyes shut, a raindrop hanging from its wool. Cloudram: fuller,
  //  stern, curled brown horns streaked with yellow lightning. Tempestram: a storm: rain falls in the dark gaps of its wool,
  //  a rainbow arcs over its back, the horns glow)
  function sheep(C, K, S) {
    const wool = C.M(), face = C.M(), hoof = C.M(), horn = C.M(), core = C.M();
    const WT = S === 2 ? ['#e6e2d2', '#c4cadc', '#93a4cc', '#6e82b2'] : S === 1 ? ['#e8e2cc', '#cdd0d8', '#9eb0d0', '#7a8ebe'] : ['#ebe2c6', '#d6d2bc', '#a8b6d0', '#8a9ec4'];
    const BRy = [.155, .185, .23][S];
    const woolTint = (v, n) => { const k = .6 * n.y + .4 * v.y / BRy; return K.rgb(k > .42 ? WT[0] : k > .02 ? WT[1] : k > -.4 ? WT[2] : WT[3]); };
    const FC = '#4a3226', FC2 = '#5e4232', HF = '#3a2a22';
    const sc = [1, 1.12, 1.25][S];
    const BC = [0, .27 * sc, -.02], BR = [[.2, .155, .22], [.235, .185, .25], [.26, .23, .28]][S];
    const faceGap = S ? (d) => !(d[2] > .3 && d[1] > -.06 && Math.abs(d[0]) < .75) : (d) => !(d[2] > .5 && d[1] > -.3 && Math.abs(d[0]) < .6); // no wool over its face (or horns)
    const puffs = (b, mat, C0, R, n, rp, o) => {
      o = o || {}; const r = rnd(o.seed || 7);
      for (let i = 0; i < n; i++) {
        const y = 1 - 2 * (i + .5) / n, rad = Math.sqrt(1 - y * y), az = i * 2.39996 + (o.rot || 0), d = [Math.sin(az) * rad, y, Math.cos(az) * rad];
        if (o.keep && !o.keep(d)) continue;
        const s = rp * (.8 + r() * .45), sk = o.sink || .86;
        b.add(K.lumpy(1, i * 1.7 + (o.seed || 0), .1), mat, [C0[0] + d[0] * R[0] * sk, C0[1] + d[1] * R[1] * sk, C0[2] + d[2] * R[2] * sk], [r() * 6, r() * 6, 0], s, { tint: o.tint || woolTint, ink: o.ink === undefined ? .9 : o.ink });
      }
    };
    // legs: short and dark (longer for the rams), little hooves
    const LH = [.12, .15, .17][S] * sc, LX = BR[0] * .45, LZ = BR[2] * .5;
    for (const [nm, x, z] of [['legFR', -LX, LZ], ['legFL', LX, LZ], ['legBR', -LX, -LZ], ['legBL', LX, -LZ]]) {
      const lg = C.part(nm, null, [x, LH, z]);
      C.build(lg, (b) => {
        b.add(K.tube([[0, .06, 0], [0, -LH * .5, .004], [0, -LH + .02, .008]], 8, 10, (t) => (.034 + .006 * t) * sc), face, null, null, null, { tint: (v, n) => K.rgb(n.y > .3 ? FC2 : FC) });
        C.ell(b, hoof, [0, -LH + .016, .012], [.036 * sc, .02, .04 * sc], { tint: HF, ink: .6 });
        b.add(new THREE.BoxGeometry(.004, .03, .03), hoof, [0, -LH + .016, .045 * sc], null, null, { tint: '#1e1410', ink: 0 });
      });
    }
    // the wool: a core and puffs all over it, swirls on the back
    const fleece = C.part('wool', null, BC);
    C.build(fleece, (b) => {
      if (S === 2) {
        // the storm inside: a dark core streaked with rain, seen through the gaps between bands of puffs
        const rain = C.paint(512, 256, (g, W, H) => { g.fillStyle = '#2e3a6a'; g.fillRect(0, 0, W, H); const r = rnd(3); for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, l = 14 + r() * 30; g.strokeStyle = r() < .5 ? '#6a9ae8' : '#4a6ac0'; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + l); g.stroke(); } });
        C.ell(b, rain, [0, 0, 0], [BR[0] * .97, BR[1] * .97, BR[2] * .97]);
        let cnt = 0; const band = (d) => { const el = Math.asin(d[1]); cnt++; return faceGap(d) && (el > .72 || el < -.42 || (d[2] > .55 && el < .2) || (Math.abs(el - .15) < .14 && cnt % 2 === 0)); };
        puffs(b, wool, [0, 0, 0], BR, 120, .074, { keep: band, sink: 1 });
      } else {
        C.ell(b, wool, [0, 0, 0], [BR[0] * .9, BR[1] * .9, BR[2] * .9], { tint: woolTint, ink: 0 });
        puffs(b, wool, [0, 0, 0], BR, S ? 34 : 30, S ? .118 : .104, { sink: .74, keep: faceGap });
      }
      // swirls: the back, and on the rams the chest and flank
      const sw = [[0, 0, -1, .07]];
      if (S) sw.push([.82, -.2, -.5, .05], [-.82, -.2, -.5, .05], [0, -.25, 1, .045]);
      for (const [x, y, z, R0] of sw) {
        const d = V3(x, y, z).normalize(), c = V3(d.x * BR[0], d.y * BR[1], d.z * BR[2]).multiplyScalar(.82), Rp = R0 * 1.7;
        const q = basisQ([0, 1, 0], [d.x, d.y, d.z]);
        b.add(K.lumpy(1, 3, .05), wool, [c.x, c.y, c.z], null, Rp, { tint: woolTint, ink: .9 });
        b.add(K.tube(spiral(R0 * .9, 1.7, Rp), 34, 5, () => .006 * sc), core, [c.x + d.x * (Rp + .002), c.y + d.y * (Rp + .002), c.z + d.z * (Rp + .002)], q, 1, { tint: S === 2 ? '#7a90c8' : '#98acd4', ink: 0 });
      }
      // Tempestram: the rainbow over its back
      if (S === 2) {
        const cols = ['#f04040', '#f89a30', '#f8e040', '#58c848', '#4a8af0', '#8a5ad8'];
        cols.forEach((c, i) => b.add(new THREE.TorusGeometry(.18 - i * .016, .0095, 6, 30, PI), core, [0, BR[1] * .86, -BR[2] * .1], [-.6, 0, 0], null, { tint: c, ink: i === 0 || i === 5 ? .5 : 0 }));
      }
    });
    // the drop of rain that hangs from Fleecling's wool
    if (S === 0) {
      const drop = C.part('drop', fleece, [BR[0] * .8, -BR[1] * .62, -BR[2] * .5]);
      drop.scale.setScalar(1.5); drop.userData.rest.s.setScalar(1.5);
      const drip = C.M('#ffffff', { mat: { emissive: new THREE.Color('#1a5ad0'), emissiveIntensity: .3 } });
      C.build(drop, (b) => b.add(K.lathe([[0, .0], [.006, -.012], [.017, -.036], [.019, -.05], [.013, -.062], [0, -.066]], 14), drip, null, null, null, { tint: (v, n) => K.rgb(n.y > .3 || (n.x < -.4 && v.y > -.04) ? '#e4f8ff' : n.y > -.3 ? '#7ad0f8' : '#3a8ae8'), ink: .6 }));
      C.glow(drop, [0, -.045, .01], '#9ae0ff', .05);
    }
    // the head: a dark brown face out of the front of the wool, a tuft of wool over its brow with a swirl
    const head = C.part('head', null, [[0, .315, .2], [0, .385, .25], [0, .45, .285]][S]);
    const FR = [[.1, .086, .085], [.088, .084, .09], [.092, .088, .095]][S];
    C.build(head, (b) => {
      C.ell(b, face, [0, 0, 0], FR, { tint: (v, n) => K.rgb(n.y > .4 ? FC2 : FC) });
      C.ell(b, face, [0, -.032, FR[2] * .55], [FR[0] * .62, FR[1] * .58, FR[2] * .55], { tint: FC2, ink: .3 });
      C.ell(b, face, [0, -.03, FR[2] * 1.04], [.009, .006, .005], { tint: '#2a1a14', ink: 0 });
      b.add(K.tube([[-.018, -.062, FR[2] * .98], [-.009, -.068, FR[2] * 1.01], [0, -.063, FR[2] * 1.03], [.009, -.068, FR[2] * 1.01], [.018, -.062, FR[2] * .98]], 10, 4, () => .003), face, null, null, null, { tint: '#22140e', ink: 0 });
      if (S === 0) happyEyes(b, K, face, [0, 0, 0], FR, .4, .06, .14, .045, '#1e120c');
      // the tuft over its brow
      puffs(b, wool, [0, FR[1] * .75, -.02], [FR[0] * 1.1, FR[1] * .7, FR[2] * 1.0], 12, .045 * sc, { keep: (d) => d[1] > -.1 && d[2] < .8, sink: .85, seed: 3 });
      const tp = [0, FR[1] * .95, FR[2] * .5], Rt = .042 * sc;
      b.add(K.lumpy(1, 5, .05), wool, tp, null, Rt, { tint: woolTint, ink: .9 });
      const tn = V3(0, .45, 1).normalize();
      b.add(K.tube(spiral(.028 * sc, 1.6, Rt), 30, 5, () => .0045 * sc), core, [tp[0], tp[1] + tn.y * (Rt + .002), tp[2] + tn.z * (Rt + .002)], basisQ([0, 1, 0], [0, .45, 1]), 1, { tint: '#98acd4', ink: 0 });
    });
    if (S) C.eyePair(head, [0, 0, 0], FR, .45, .08, [.03, .026, .012], S === 2 ? ['#a03a0a', '#e07a18', '#f8b040'] : ['#3a2a10', '#6a5020', '#8a7030'], { tex: { white: '#f4ecc0', lid: FC, lidK: .3, rx: 34, ry: 40 }, fwd: .25, roll: -.42 });
    // the ears: Fleecling's long floppy ones; small ones under the rams' horns
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * FR[0] * .85, .02, -.01], [0, 0, sd * (S ? 1.35 : .75)]);
      const EL = S ? .04 : .09;
      C.build(ear, (b) => {
        C.ell(b, face, [0, -EL, 0], [S ? .026 : .04, EL, .02], { tint: FC });
        C.ell(b, face, [0, -EL * 1.05, .012], [S ? .016 : .026, EL * .8, .01], { tint: '#b8644a', ink: .3 });
      });
    }
    // the rams' horns: thick spirals curling back, down and forward round the ears, streaked with lightning
    if (S) {
      const hs = S === 2 ? 1.5 : 1.3;
      for (const sd of [-1, 1]) {
        const hp = C.part(sd < 0 ? 'hornR' : 'hornL', head, [sd * .03, .035, -.03]);
        const P = []; const N = 24;
        for (let i = 0; i <= N; i++) { const t = i / N, th = -.15 + t * 6.2, R = (.075 - .05 * t) * hs; P.push([sd * (.11 * Math.sin(Math.min(1, t * 2) * PI / 2) * hs + .012 * t), R * Math.cos(th) - .02 * hs, -R * Math.sin(th) - .005]); }
        C.build(hp, (b) => {
          const NR = 14, NS = 60, g = K.tube(P, NS, NR, (t) => (.05 * (1 - .72 * t) + .008) * hs);
          const tri = (x) => Math.abs((x % 1 + 1) % 1 * 2 - 1);
          C.ell(b, horn, P[0], [.05 * hs, .05 * hs, .05 * hs], { tint: '#5e361a', ink: .5 });
          b.add(g, horn, null, null, null, { tint: (v, n, i) => { const ring = Math.floor(i / (NR + 1)), t = ring / NS, j = (i % (NR + 1)) / NR; const z1 = .25 + .24 * (tri(t * 6) - .5), z2 = .75 + .24 * (tri(t * 6 + .5) - .5); if (Math.abs(j - z1) < .07 || Math.abs(j - z2) < .07) return K.rgb(S === 2 ? '#fff060' : '#f8d030'); return K.rgb(Math.floor(t * 14) % 2 ? '#5e361a' : '#764824'); } });
        });
      }
    }
  }
  const sheepIdle = (C, t, dt, walk) => {
    const P = C.parts;
    const br = 1 + .02 * Math.sin(t * 2.4); P.wool.scale.set(br, 1 + .015 * Math.sin(t * 2.4 + .5), br);
    P.head.rotation.x = Math.sin(t * .8) * .05; P.head.rotation.z = Math.sin(t * .6) * .05; P.head.rotation.y = Math.sin(t * .37) * .1;
    P.earL.rotation.z += Math.sin(t * 1.9) * .08; P.earR.rotation.z -= Math.sin(t * 2.1 + 1) * .08;
    if (P.drop) { P.drop.rotation.z = Math.sin(t * 2.6) * .25; P.drop.rotation.x = Math.sin(t * 1.9) * .15; }
    if (walk) { const s = Math.sin(t * 12); P.legFR.rotation.x = s * .5; P.legBL.rotation.x = s * .5; P.legFL.rotation.x = -s * .5; P.legBR.rotation.x = -s * .5; }
  };
  const sheepAct = (C, name, u) => {
    const P = C.parts, k = Math.sin(u * PI);
    if (name === 'puff' || name === 'woolpuff' || name === 'curl') { const s = name === 'woolpuff' ? 1 + .32 * Math.sin(Math.min(1, u / .45) * PI / 2) * (1 - .7 * Math.max(0, (u - .55) / .45)) + .04 * Math.sin(u * 50) * k : 1 + .2 * k; P.wool.scale.multiplyScalar(s); P.head.position.y += .02 * (s - 1); P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
    if (name === 'attack' || name === 'chomp') { P.head.rotation.x += .45 * k; P.head.position.z += .03 * k; }
    if (name === 'roar' || name === 'spit' || name === 'cast') { P.head.rotation.x -= .35 * k; P.wool.scale.multiplyScalar(1 + .06 * k); }
    if (name === 'hit' || name === 'shake') { P.earL.rotation.z -= .4 * k; P.earR.rotation.z += .4 * k; P.wool.scale.multiplyScalar(1 + .05 * Math.sin(u * 30) * (1 - u)); }
    if (name === 'tuck') { P.head.rotation.x += .5 * Math.min(1, u * 3); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].scale.y *= 1 - .4 * Math.min(1, u * 3); }
  };
  CREATURE_DEFS.fleecling = { height: .55, eyeY: .33, width: .5, size: 1, mouth: [0, -.06, .08], build(C, K) { sheep(C, K, 0); }, idle: sheepIdle, act: sheepAct };
  CREATURE_DEFS.cloudram = { height: .64, eyeY: .4, width: .58, size: 1.15, mouth: [0, -.06, .09], build(C, K) { sheep(C, K, 1); }, idle: sheepIdle, act: sheepAct };
  CREATURE_DEFS.tempestram = { height: .74, eyeY: .5, width: .66, size: 1.3, mouth: [0, -.06, .1], build(C, K) { sheep(C, K, 2); }, idle: sheepIdle, act: sheepAct };
})();
