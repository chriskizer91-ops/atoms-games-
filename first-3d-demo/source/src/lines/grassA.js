// lines/grassA.js: the Tuftail line (Tuftail, Verdantail, Sylvantail: a fox whose tail is grass, then leaves, then two
// flowering plumes) and the Bumblop line (Bumblop, Bumblazer, Queenbuzz: half bee, half bunny, growing from a fuzzy ball
// to a crackling sprite to the crowned queen of the hive). Built from their turnaround sheets in the style of creatures.js.
(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  // a smooth pseudo-random value from a point, the same for the same point (so a sphere's seam stays closed)
  const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

  // ======================================================================================================================
  // the fox family
  // ======================================================================================================================
  const FOX = { O1: '#f47a1e', O2: '#cf5416', O3: '#ff9d3e', CR: '#fde2b0', CR2: '#f3c98c', BR: '#5c2a14', BR2: '#7a3a1a' };
  // a leaf: flat, pointed, base at the origin, pointing +Y
  const leafShape = (w, l) => [[0, 0], [w * .55, l * .18], [w, l * .45], [w * .7, l * .78], [0, l], [-w * .7, l * .78], [-w, l * .45], [-w * .55, l * .18]];
  // a small white flower with a yellow heart, facing +Z
  function flower(b, K, mat, at, q, s) {
    const petal = new THREE.SphereGeometry(1, 7, 4);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const p = new THREE.Vector3(Math.sin(a) * .016 * s, Math.cos(a) * .016 * s, 0).applyQuaternion(q); b.add(petal, mat, [at[0] + p.x, at[1] + p.y, at[2] + p.z], new THREE.Quaternion().multiplyQuaternions(q, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -a)), [.011 * s, .016 * s, .005 * s], { tint: '#fffdf4', ink: .35 }); }
    const c = new THREE.Vector3(0, 0, .004 * s).applyQuaternion(q);
    b.add(petal, mat, [at[0] + c.x, at[1] + c.y, at[2] + c.z], q, [.008 * s, .008 * s, .005 * s], { tint: '#f8b820', ink: .3 });
  }
  // a frame that lies on a surface: y along dir, z out of the surface (n)
  function frame(dir, n) {
    const N = new THREE.Vector3(...n).normalize(), D = new THREE.Vector3(...dir); D.addScaledVector(N, -D.dot(N)).normalize();
    const X = new THREE.Vector3().crossVectors(D, N).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, D, N));
  }

  // S: the stage's proportions and extras
  function buildFox(C, K, S) {
    const { O1, O2, O3, CR, CR2, BR } = FOX;
    const fur = C.M(), cream = C.M(), dark = C.M(), grass = C.M(), leaf = C.M(), eyeD = C.M();
    const petal = S.glowPetals ? C.M('#ffffff', { mat: { emissive: new THREE.Color('#fff2b0'), emissiveIntensity: .35 } }) : C.M();
    const furT = (v, n) => K.rgb(n.y > .5 ? O3 : n.y > -.35 ? O1 : O2);
    const g = S.g || 1; // overall scale of the stage
    // ---- the body: a long oval, cream underneath at the chest
    const BR_ = S.bodyR;
    const body = C.part('body', null, [0, S.bodyY, 0]);
    C.build(body, (b) => {
      C.ell(b, fur, [0, 0, 0], BR_, { tint: (v, n) => n.y < -.6 && v.z > 0 ? K.rgb(CR) : furT(v, n) });
      // the neck up to the head
      b.add(K.tube([[0, BR_[1] * .2, BR_[2] * .55], [0, BR_[1] * .9, BR_[2] * .85], [0, S.headY - S.bodyY - .05 * g, S.headZ - .02 * g]], 10, 14, (t) => (BR_[0] * .78) * (1 - .25 * t)), fur, null, null, null, { tint: furT });
      // the bib: a cream ruff down the chest, jagged at the bottom
      const bz = BR_[2] * .9, bw = BR_[0] * (S.bibW || .85);
      C.ell(b, cream, [0, BR_[1] * .45, bz], [bw, BR_[1] * 1.25 * (S.bibH || 1), .05 * g], { tint: (v, n) => K.rgb(n.y < -.3 ? CR2 : CR), ink: .5, rot: [-.35, 0, 0] });
      for (let i = 0; i < 5; i++) { const x = (i - 2) / 2 * bw * .8, y = BR_[1] * (S.bibH || 1) * -.55 - (2 - Math.abs(i - 2)) * .008 * g; b.add(new THREE.ConeGeometry(.02 * g, .06 * g, 6), cream, [x, y, bz + .03 * g], [PI - .25, 0, x * 2], null, { tint: CR2, ink: .5 }); }
      // the rump, a little rounder
      C.ell(b, fur, [0, .005 * g, -BR_[2] * .55], [BR_[0] * 1.08, BR_[1] * 1.0, BR_[2] * .5], { tint: furT });
      if (S.leafy) { // leaf markings lying on its back and flanks (Sylvantail)
        let sd = 9; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const lg = K.slab(leafShape(.016, .06), .004, .0015);
        for (let i = 0; i < S.leafy; i++) { const az = (i / S.leafy) * TAU * 1.0 + rr() * .4, el = -.1 + rr() * .9; if (Math.cos(az) > .5 && el < .4) continue; const { p, n } = K.onBall([0, 0, 0], BR_, az, el, .002); b.add(lg, leaf, p, frame([0, -.5, 1], n), 1 + rr() * .5, { tint: K.rgb(rr() > .5 ? '#4fae36' : '#2f8a2e'), ink: .4 }); }
      }
    });
    // ---- legs: straight, orange above, socks below (dark brown, or cream), paws
    const legs = [['legFR', -1, S.legFZ], ['legFL', 1, S.legFZ], ['legBR', -1, S.legBZ], ['legBL', 1, S.legBZ]];
    for (const [nm, sd, z] of legs) {
      const hind = z < 0, top = S.bodyY, L = top;
      const lg = C.part(nm, null, [sd * S.legX, top, z]);
      C.build(lg, (b) => {
        const r0 = (hind ? .042 : .032) * g, r1 = .022 * g;
        b.add(K.lathe([[0, .02 * g], [r0, 0], [r0 * .9, -L * .35], [r1 * 1.05, -L * .7], [r1, -L * .9], [0, -L * .97]], 14, { sz: hind ? 1.25 : 1 }), fur, null, null, null, { tint: (v, n) => K.rgb(v.y < -L * S.sock ? S.sockCol || BR : n.y > .3 ? O3 : O1) });
        if (hind) C.ell(b, fur, [sd * .005 * g, -L * .2, -.005 * g], [r0 * 1.15, L * .3, r0 * 1.35], { tint: furT });
        C.ell(b, dark, [0, -L + .016 * g, .014 * g], [.027 * g, .018 * g, .036 * g], { tint: S.pawCol || BR, ink: .7 });
        if (S.claws) for (const d of [-1, 0, 1]) C.ell(b, dark, [d * .012 * g, -L + .008 * g, .045 * g], [.006 * g, .006 * g, .008 * g], { tint: BR, ink: .3 });
        if (S.vines) { // a vine wound round the shin, a leaf or two on it
          const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14, a = k * TAU * 1.6 + (sd > 0 ? 1 : 0), y = -L * (.88 - .5 * k), r = lerp_(r1 * 1.15, r0 * .95, k) + .004 * g; pts.push([Math.sin(a) * r, y, Math.cos(a) * r * (hind ? 1.2 : 1)]); }
          b.add(K.tube(pts, 40, 5, () => .0065 * g), leaf, null, null, null, { tint: '#3e9a2e', ink: .5 });
          const lg2 = K.slab(leafShape(.013, .045), .004, .0015);
          for (const k of [.25, .7]) { const i = Math.round(k * 14), p = pts[i]; b.add(lg2, leaf, p, frame([sd * .3, 1, .2], [p[0], 0, p[2]]), g, { tint: '#6ac83e', ink: .4 }); }
        }
      });
    }
    // ---- the head: round, a pointed muzzle, a cream face, cheek fluff, green eyes
    const H = S.headR;
    const head = C.part('head', null, [0, S.headY, S.headZ]);
    C.build(head, (b) => {
      C.ell(b, fur, [0, 0, 0], H, { tint: (v, n) => n.y < -.3 && n.z > .25 ? K.rgb(CR) : furT(v, n) });
      // the muzzle, pointing forward and a little down, cream below
      C.ell(b, fur, [0, -H[1] * .3, H[2] * .82], [H[0] * .4, H[1] * .36, H[2] * .62], { rot: [.12, 0, 0], tint: (v, n) => K.rgb(n.y < .2 ? CR : O3) });
      C.ell(b, dark, [0, -H[1] * .17, H[2] * 1.42], [.013 * g, .01 * g, .01 * g], { tint: '#1c1010', ink: .4 });
      b.add(K.tube([[-.016 * g, -H[1] * .5, H[2] * 1.22], [-.006 * g, -H[1] * .56, H[2] * 1.29], [0, -H[1] * .5, H[2] * 1.33], [.006 * g, -H[1] * .56, H[2] * 1.29], [.016 * g, -H[1] * .5, H[2] * 1.22]], 8, 5, () => .0032 * g), dark, null, null, null, { tint: '#3a1a10', ink: 0 });
      // cheek fluff: tufts sticking out sideways and down
      for (const sd of [-1, 1]) for (const [y, z, l, a] of [[-.25, .25, .06, .35], [-.5, .1, .055, .9], [.05, .2, .045, -.1]]) b.add(new THREE.ConeGeometry(.022 * g, l * g * (S.cheek || 1), 6), fur, [sd * H[0] * .9, H[1] * y, H[2] * z], [0, 0, sd * -(PI / 2 + a)], [1, 1, .6], { tint: (v) => K.rgb(Math.abs(v.x) > H[0] * 1.15 ? CR : O1), ink: .6 });
      // a tuft on the crown
      for (const d of [-1, 0, 1]) b.add(new THREE.ConeGeometry(.016 * g, .05 * g, 6), fur, [d * .022 * g, H[1] * .88, H[2] * .25 - Math.abs(d) * .01], [.3, 0, -d * .45], [1, 1, .6], { tint: O3, ink: .6 });
      if (S.crown) { // a ring of leaves round the crown, and a white flower on the brow (Sylvantail)
        const lg = K.slab(leafShape(.018, .07), .005, .002);
        for (let i = 0; i < 9; i++) { const az = (i / 9 - .5) * 2.4, { p, n } = K.onBall([0, 0, 0], H, az, .75, .002); b.add(lg, leaf, p, frame([Math.sin(az) * .6, 1, Math.cos(az) * -.2], n), g * (1.1 - Math.abs(i - 4) * .05), { tint: K.rgb(i % 2 ? '#4fb036' : '#2f8a2e'), ink: .45 }); }
        const { p, n } = K.onBall([0, 0, 0], H, 0, .62, .006); flower(b, K, petal, p, frame([0, 1, 0], n), 1.5 * g);
      }
    });
    C.eyePair(head, [0, 0, 0], H, S.eyeAz || .6, .06, [.034 * g, .04 * g, .014 * g], ['#0e4a1a', '#2f9a3a', '#9ae08a'], { fwd: .3, roll: S.eyeRoll || 0 });
    // ---- the ears: big and pointed, cream inside, dark brown tips
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * H[0] * .55, H[1] * .6, -H[2] * .1], [-.1, sd * -.2, sd * -(S.earTilt || .32)]);
      C.build(ear, (b) => {
        const eh = S.earH, ew = S.earW;
        b.add(new THREE.ConeGeometry(1, 1, 14, 3), fur, [0, eh / 2, 0], null, [ew, eh, ew * .42], { tint: (v) => K.rgb(v.y > eh * (S.tipK || .7) ? BR : O1) });
        b.add(new THREE.ConeGeometry(1, 1, 12, 2), cream, [0, eh * .44, ew * .3], [-.06, 0, 0], [ew * .66, eh * .8, ew * .2], { tint: (v) => K.rgb(v.y > eh * .62 && !S.earPlain ? '#c08060' : CR), ink: .4 });
        if (S.earLeaf) b.add(K.slab(leafShape(.014, .06), .004, .0015), leaf, [0, eh * .15, ew * .42], [-.1, 0, 0], g, { tint: '#4fae36', ink: .4 });
      });
    }
    return { fur, cream, dark, grass, leaf, petal, furT };
  }
  const lerp_ = (a, b, t) => a + (b - a) * t;


  // a leafy plume (Verdantail, Sylvantail): a dark core along a curve, covered in leaves pointing to its tip, white flowers
  function plume(C, K, part, m, spine, rMax, o) {
    o = o || {};
    const cv = new THREE.CatmullRomCurve3(spine.map((p) => new THREE.Vector3(...p)));
    const rF = (t) => rMax * (.3 + .7 * Math.sin(Math.min(1, t * .9 + .08) * PI)) * (1 - .4 * t * t) + .006;
    let sd = o.seed || 5; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    C.build(part, (b) => {
      b.add(K.tube(spine, 36, 14, (t) => rF(t) * .9), m.leaf, null, null, null, { tint: '#24601e', ink: .2 });
      const lg = K.slab(leafShape(.024, .085), .006, 0), cols = ['#4fae36', '#2f8a2e', '#78c840', '#3c9c30', '#5cb83a'];
      const NS = o.ns || 15, NA = o.na || 9, T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), up = new THREE.Vector3(1, 0, 0);
      const flowers = [];
      for (let i = 0; i < NS; i++) {
        const t = (i + .4) / NS, p = cv.getPointAt(t); cv.getTangentAt(t, T);
        A.crossVectors(T, up).normalize(); B.crossVectors(T, A).normalize();
        const r = rF(t), na = Math.max(5, Math.round(NA * (.5 + r / rMax * .6)));
        for (let j = 0; j < na; j++) {
          const a = (j + (i % 2) * .5) / na * TAU + rr() * .35; N.copy(A).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
          const pos = p.clone().addScaledVector(N, r * .8), dir = T.clone().multiplyScalar(.75).addScaledVector(N, .55).normalize(), nn = N.clone().multiplyScalar(.75).addScaledVector(T, -.55).normalize();
          b.add(lg, m.leaf, [pos.x, pos.y, pos.z], frame([dir.x, dir.y, dir.z], [nn.x, nn.y, nn.z]), (o.leafK || 1) * (1.1 - .45 * t) * (.85 + .3 * rr()), { tint: K.rgb(cols[Math.floor(rr() * cols.length)]), ink: .45 });
          if (rr() < (o.flowers || .07) && t > .15 && t < .9) flowers.push([pos.clone().addScaledVector(N, r * .32), N.clone()]);
        }
      }
      // the tip: a last few leaves along the curve
      const pe = cv.getPointAt(1); cv.getTangentAt(1, T);
      for (let j = 0; j < 4; j++) { const a = j / 4 * TAU; A.crossVectors(T, up).normalize(); B.crossVectors(T, A).normalize(); N.copy(A).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a)); const d = T.clone().addScaledVector(N, .4).normalize(); b.add(lg, m.leaf, [pe.x, pe.y, pe.z], frame([d.x, d.y, d.z], [N.x, N.y, N.z]), (o.leafK || 1) * .8, { tint: K.rgb(cols[j]), ink: .45 }); }
      for (const [p, n] of flowers) flower(b, K, m.petal, [p.x, p.y, p.z], frame([0, 1, 0], [n.x, n.y, n.z]), 1.5 * (o.flowerK || 1));
    });
  }
  // the ordinary orange fur at the root of a plume
  function furTuft(C, K, part, m, dir, len, w) {
    C.build(part, (b) => {
      const D = new THREE.Vector3(...dir).normalize();
      for (const [ox, oy, k] of [[0, 0, 1], [.025, -.01, .8], [-.025, -.01, .8], [0, .02, .7]]) b.add(new THREE.ConeGeometry(w * k, len * k, 8), m.fur, [ox + D.x * len * k * .45, oy + D.y * len * k * .45, D.z * len * k * .45], K.qDir([0, 1, 0], [D.x + ox * 3, D.y + oy * 3, D.z]), [1, 1, .8], { tint: (v) => K.rgb(v.distanceTo(new THREE.Vector3(0, 0, 0)) > len * .75 ? '#f8b060' : '#e2581a'), ink: .6 });
    });
  }

  // the grass bundle (Tuftail): blades rising from a round, striped bulb and flaring out at the top
  function grassBundle(C, K, tail, mat, g) {
    C.build(tail, (b) => {
      C.ell(b, mat, [0, .14 * g, 0], [.12 * g, .13 * g, .12 * g], { tint: '#2f6e22', ink: 0 });
      const cols = ['#9ad842', '#3f8a2a', '#7cc23a', '#4c9a2a'];
      const ring = (n, rMax, hTop, flare, off, ci) => { for (let i = 0; i < n; i++) {
        const a = (i + off) / n * TAU, sx = Math.sin(a), cz = Math.cos(a), w = (k) => [sx * k, cz * k];
        const pts = [[0, 0, 0], [.6 * rMax, .05], [rMax, .14], [rMax * .9, .24 * hTop], [rMax * .8 + flare * .5, .31 * hTop], [rMax * .8 + flare, .33 * hTop - flare * .4]].map((p, j) => j === 0 ? [sx * .02 * g, 0, cz * .02 * g] : [w(p[0] * g)[0], p[1] * g, w(p[0] * g)[1]]);
        b.add(K.tube(pts, 16, 6, (t) => (.042 * Math.sin(Math.min(1, t * 1.15 + .12) * PI * .95) + .003) * g, .32, (c, nn) => nn.set(sx, 0, cz)), mat, null, null, null, { tint: cols[(i + ci) % cols.length], ink: .55 });
      } };
      ring(16, .15, 1, .05, 0, 0);
      ring(10, .1, 1.15, .06, .5, 1);
      ring(5, .04, 1.3, .05, .25, 2);
    });
  }

  // ---------- Tuftail (sheet: a little orange fox standing four-square, big dark-tipped ears, a cream bib, dark socks,
  // and a tail that is one big bundle of grass, round and striped at the bottom and flaring at the top) ----------
  CREATURE_DEFS.tuftail = {
    height: .62, eyeY: .4, width: .52, size: 1, mouth: [0, -.04, .11],
    build(C, K) {
      const m = buildFox(C, K, { g: 1, bodyY: .21, bodyR: [.078, .072, .155], headY: .37, headZ: .135, headR: [.118, .1, .1], legX: .048, legFZ: .1, legBZ: -.11, sock: .55, earH: .2, earW: .078, earTilt: .3, tipK: .62 });
      const tail = C.part('tail', null, [0, .2, -.16], [-.7, 0, 0]);
      grassBundle(C, K, tail, m.grass, 1);
    },
    idle(C, t, dt, walk) {
      const P = C.parts, f = 1 + walk * 2;
      P.tail.rotation.z = Math.sin(t * 1.7 * f) * .12; P.tail.rotation.x += Math.sin(t * 1.1) * .05;
      P.head.rotation.z = Math.sin(t * .8) * .06; P.head.rotation.x = Math.sin(t * 1.3) * .04;
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.4)), 20); P.earL.rotation.z -= tw * .25; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.2 + 2)), 20) * .25;
      if (walk) { const s = Math.sin(t * 12); P.legFR.rotation.x = s * .45; P.legBL.rotation.x = s * .45; P.legFL.rotation.x = -s * .45; P.legBR.rotation.x = -s * .45; }
    },
    act(C, name, u) { foxAct(C, name, u); },
  };


  // ---------- Verdantail (sheet: taller and leaner, long legs wound with vines, a big leafy plume of a tail rising behind
  // and curling forward at the top, dotted with white flowers; leaves in its ears) ----------
  CREATURE_DEFS.verdantail = {
    height: .76, eyeY: .48, width: .6, size: 1.15, mouth: [0, -.04, .125],
    build(C, K) {
      const m = buildFox(C, K, { g: 1.1, bodyY: .27, bodyR: [.078, .07, .19], bibH: 1.15, headY: .465, headZ: .19, headR: [.105, .088, .095], cheek: 1.3, eyeAz: .64, eyeRoll: .12, legX: .05, legFZ: .13, legBZ: -.14, sock: .9, vines: true, earH: .2, earW: .066, earTilt: .22, tipK: 2, earPlain: true, earLeaf: true });
      const tail = C.part('tail', null, [0, .29, -.2]);
      furTuft(C, K, C.part('tuft', tail, [0, 0, 0]), m, [0, -.35, -1], .14, .035);
      plume(C, K, tail, m, [[0, 0, 0], [0, .07, -.13], [0, .2, -.21], [0, .34, -.18], [0, .41, -.07], [0, .37, .03]], .185, { seed: 7, flowers: .06, leafK: 1.4, na: 11, ns: 15 });
    },
    idle(C, t, dt, walk) {
      const P = C.parts, f = 1 + walk * 2;
      P.tail.rotation.z = Math.sin(t * 1.3 * f) * .08; P.tail.rotation.x = Math.sin(t * 1.0) * .04; P.tuft.rotation.y = Math.sin(t * 2.2) * .2;
      P.head.rotation.z = Math.sin(t * .7) * .05; P.head.rotation.y = Math.sin(t * .45) * .08;
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.3)), 20); P.earL.rotation.z -= tw * .2; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 20) * .2;
      if (walk) { const s = Math.sin(t * 11); P.legFR.rotation.x = s * .45; P.legBL.rotation.x = s * .45; P.legFL.rotation.x = -s * .45; P.legBR.rotation.x = -s * .45; }
    },
    act(C, name, u) { foxAct(C, name, u); },
  };

  // ---------- Sylvantail (sheet: the forest spirit; leaves grow all over its coat and wind round its cream legs, a crown
  // of leaves with a white flower on its brow, and two great flowering plumes that curl up either side like a heart) ----------
  CREATURE_DEFS.sylvantail = {
    height: .84, eyeY: .53, width: .78, size: 1.3, mouth: [0, -.04, .13],
    build(C, K) {
      const m = buildFox(C, K, { g: 1.18, bodyY: .3, bodyR: [.085, .075, .2], bibW: 1.0, bibH: 1.3, headY: .515, headZ: .2, headR: [.108, .092, .098], cheek: 1.5, eyeAz: .64, eyeRoll: .1, legX: .055, legFZ: .14, legBZ: -.15, sock: .55, sockCol: FOX.CR, pawCol: FOX.CR, claws: true, vines: true, leafy: 30, crown: true, earH: .2, earW: .068, earTilt: .24, tipK: 2, earPlain: true, earLeaf: true, glowPetals: true });
      for (const sd of [-1, 1]) {
        const tl = C.part(sd < 0 ? 'tail2' : 'tail', null, [sd * .03, .32, -.21]);
        if (sd > 0) furTuft(C, K, C.part('tuft', tl, [-.03, 0, 0]), m, [0, -.3, -1], .15, .04);
        plume(C, K, tl, m, [[0, 0, 0], [sd * .09, .05, -.11], [sd * .21, .16, -.15], [sd * .27, .31, -.11], [sd * .22, .43, -.03], [sd * .12, .43, .03]], .15, { seed: sd < 0 ? 11 : 23, flowers: .08, na: 10, ns: 14, leafK: 1.25 });
      }
      // a soft light in the flowers (it is Lumen)
      C.glow(C.parts.head, [0, .1, .06], '#fff4c0', .07);
    },
    idle(C, t, dt, walk) {
      const P = C.parts, f = 1 + walk * 2;
      P.tail.rotation.z = Math.sin(t * 1.2 * f) * .07; P.tail2.rotation.z = Math.sin(t * 1.2 * f + 1.2) * .07; P.tail.rotation.x = Math.sin(t * .9) * .04; P.tail2.rotation.x = Math.sin(t * .9 + .8) * .04;
      P.tuft.rotation.y = Math.sin(t * 2.2) * .2;
      P.head.rotation.z = Math.sin(t * .7) * .05; P.head.rotation.y = Math.sin(t * .45) * .08;
      const tw = Math.pow(Math.max(0, Math.sin(t * 1.3)), 20); P.earL.rotation.z -= tw * .2; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 20) * .2;
      if (walk) { const s = Math.sin(t * 10); P.legFR.rotation.x = s * .45; P.legBL.rotation.x = s * .45; P.legFL.rotation.x = -s * .45; P.legBR.rotation.x = -s * .45; }
    },
    act(C, name, u) { foxAct(C, name, u); },
  };

  // what a fox's tail, head and legs do in the body actions (all three stages)
  function foxAct(C, name, u) {
    const P = C.parts, k = Math.sin(u * PI), tails = [P.tail, P.tail2].filter(Boolean);
    if (name === 'attack' || name === 'chomp') { P.head.position.z += .03 * k; for (const tl of tails) tl.rotation.x -= .35 * k; P.legFL.rotation.x -= .4 * k; P.legFR.rotation.x -= .4 * k; }
    if (name === 'hit') { P.head.rotation.x -= .25 * k; for (const tl of tails) tl.rotation.x += .3 * k; P.earL.rotation.z -= .3 * k; P.earR.rotation.z += .3 * k; }
    if (name === 'happy' || name === 'hop') { for (const tl of tails) tl.rotation.z += Math.sin(u * TAU * 3) * .35; P.earL.rotation.z -= .2 * k; P.earR.rotation.z += .2 * k; }
    if (name === 'spit' || name === 'roar') { P.head.rotation.x -= .3 * k; for (const tl of tails) tl.rotation.x -= .3 * k; }
    if (name === 'crouch' || name === 'tuck') { const c = Math.min(1, u * 2); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) P[l].scale.y *= 1 - .25 * c; P.head.position.y -= .02 * c; for (const tl of tails) tl.rotation.x -= .25 * c; }
    if (name === 'faint' || name === 'sleep') { P.head.rotation.x += .3; P.earL.rotation.z -= .25; P.earR.rotation.z += .25; }
    if (name === 'grassswipe') { // the tail swept round in front of it, as the body spins
      const w = Math.sin(Math.min(1, u / .7) * PI); for (const tl of tails) { tl.rotation.x -= .5 * w; tl.rotation.z += (tl === P.tail2 ? -1 : 1) * .8 * w; }
      P.head.rotation.y += .4 * w;
    }
  }
  // ======================================================================================================================
  // the bee-bunny family
  // ======================================================================================================================
  const BEE = { Y: '#f6c81e', Y2: '#d8a414', Y3: '#ffe35a', D: '#2e2426', D2: '#1c1618', PALE: '#fbe9a0' };
  // a fuzzy ball: a sphere with tufts pushed out of it (uv kept, so it takes a painted skin); calm(x, y, z) quiets the fuzz
  function fuzzBall(seg, amt, freq, seed, calm) {
    const g = new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), az = Math.atan2(x, z), el = Math.asin(Math.max(-1, Math.min(1, y)));
      const f = Math.abs(Math.sin(az * freq + seed + Math.sin(el * 7) * .8)) * Math.abs(Math.sin(el * freq * .8 + az * 2 + seed));
      const k = 1 + amt * (Math.pow(f, 3) - .25) * (1 - Math.pow(Math.abs(y), 6)) * (calm ? calm(x, y, z) : 1);
      p.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals(); return g;
  }
  // a skin with zigzag bands round it: bands [v0, v1] (0 the top, 1 the bottom), teeth (even) round the whole way
  function zigSkin(C, base, col, bands, teeth, amp, extra) {
    return C.paint(512, 256, (g, W, H) => {
      g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = col;
      for (const [v0, v1] of bands) {
        g.beginPath();
        for (let i = 0; i <= teeth; i++) g.lineTo(i / teeth * W, (v0 + (i % 2 ? amp : -amp)) * H);
        for (let i = teeth; i >= 0; i--) g.lineTo(i / teeth * W, (v1 + (i % 2 ? amp : -amp)) * H);
        g.closePath(); g.fill();
      }
      if (extra) extra(g, W, H);
    });
  }
  const ellPts = (cx, cy, rx, ry, rot, n, sd) => { const P = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; P.push([(cx + x * Math.cos(rot) - y * Math.sin(rot)) * sd, cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return sd < 0 ? P.reverse() : P; };
  // a pair of bee wings on one side (upper and lower), in the part's xy plane, veins if asked
  function wings(C, K, part, mat, sd, W, o) {
    o = o || {};
    C.build(part, (b) => {
      for (const [cx, cy, rx, ry, rot] of W) {
        b.add(K.slab(ellPts(cx, cy, rx, ry, rot, 28, sd), .006, .002), mat, null, null, null, { tint: (v) => K.rgb(Math.hypot(v.x - cx * sd, v.y - cy) < Math.min(rx, ry) * .55 ? o.c1 || '#fbfaf0' : o.c2 || '#e6e2cc'), ink: .5 });
        if (o.vein) for (const f of [-.5, 0, .5]) { const ex = cx + Math.cos(rot + f * .6) * rx * .9, ey = cy + Math.sin(rot + f * .6) * ry * .9 * (1 + f * .5); b.add(K.tube([[0, 0, .006], [sd * (cx * .6 + ex * .4) * .9, cy * .5 + ey * .5, .006], [sd * ex, ey, .006]], 8, 4, () => .0028), o.vein, null, null, null, { tint: o.veinCol || '#f2d040', ink: 0 }); }
      }
    });
  }
  // antennae: thin and dark, a round yellow knob on the tip (glowing, if asked)
  function antennae(C, K, head, at, pts, knob, mat, knobMat, glow) {
    for (const sd of [-1, 1]) {
      const an = C.part(sd < 0 ? 'antR' : 'antL', head, [sd * at[0], at[1], at[2]]);
      const P = pts.map(([x, y, z]) => [sd * x, y, z]), e = P[P.length - 1];
      C.build(an, (b) => { b.add(K.tube(P, 14, 6, (t) => knob * .3 * (1 - .4 * t) + .002), mat, null, null, null, { tint: BEE.D, ink: .6 }); C.ell(b, knobMat, e, [knob, knob, knob], { tint: (v, n) => K.rgb(n.y > .3 ? '#fff07a' : '#f6c020'), ink: .6 }); });
      if (glow) C.glow(an, e, '#fff27a', knob * 5);
    }
  }
  // a long floppy lop ear hanging down the side of the head, banded yellow and dark
  function lopEar(C, K, head, mat, sd, at, len, w, bands, spread) {
    const sp = spread || 1;
    const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * at[0], at[1], at[2]], [0, 0, 0]);
    C.build(ear, (b) => b.add(K.tube([[0, 0, 0], [sd * w * .9 * sp, .01, .005], [sd * w * 1.5 * sp, -len * .3, .01], [sd * w * 1.6 * sp, -len * .7, .015], [sd * w * 1.4 * sp, -len, .01]], 20, 12, (t) => w * (.75 + .35 * Math.sin(t * PI)) * (t > .9 ? Math.sqrt(Math.max(0, 1 - (t - .9) / .1)) * .6 + .4 : 1), .62, (c, nn) => nn.set(sd, 0, 0)), mat, null, null, null, { tint: (v) => { const k = -v.y / len + .02 * Math.sign(Math.sin(v.z * 160)); for (const [a, c] of bands) if (k < a) return K.rgb(c); return K.rgb(BEE.D); } }));
    return ear;
  }

  // ---------- Bumblop (sheet: a round fuzzy ball, yellow with dark zigzag bands, a pale chest ruff, long lop ears banded
  // yellow and dark, two knobbed antennae, two pairs of small cream wings, little stubby feet; it hovers) ----------
  CREATURE_DEFS.bumblop = {
    height: .6, eyeY: .34, width: .5, size: 1, mouth: [0, -.045, .146],
    build(C, K) {
      const { Y, Y3, D, PALE } = BEE;
      const fur = C.M(), dark = C.M(), wing = C.M(), knob = C.M();
      const bodySkin = zigSkin(C, Y, D, [[.4, .47], [.56, .63], [.71, .78], [.87, 1.1]], 26, .02);
      const headSkin = zigSkin(C, Y, D, [], 24, .02, (g, W, H) => { g.fillStyle = D; g.beginPath(); for (let i = 0; i <= 12; i++) g.lineTo(W * (.52 + i / 12 * .46), H * (.3 + (i % 2 ? .03 : -.03))); for (let i = 12; i >= 0; i--) g.lineTo(W * (.52 + i / 12 * .46), H * (.42 + (i % 2 ? .03 : -.03))); g.fill(); });
      const fl = C.part('float', null, [0, 0, 0]);
      const body = C.part('body', fl, [0, .2, -.01]);
      C.build(body, (b) => {
        b.add(fuzzBall(48, .14, 15, .3), bodySkin, null, null, [.2, .175, .19]);
        // the pale ruff under its chin, jagged at the bottom
        for (let i = 0; i < 9; i++) { const az = (i - 4) / 4 * .85, { p, n } = K.onBall([0, 0, 0], [.2, .175, .19], az, .32 - Math.abs(i - 4) * .03, -.012); b.add(new THREE.ConeGeometry(.036, .1, 7), fur, p, K.qDir([0, -1, 0], [n[0] * .5, -1, n[2] * .7]), [1, 1, .55], { tint: (v, nn) => K.rgb(nn.y > .2 ? Y3 : PALE), ink: .5 }); }
      });
      const head = C.part('head', fl, [0, .335, .035]);
      const HR = [.165, .142, .152];
      C.build(head, (b) => {
        b.add(fuzzBall(48, .12, 15, 1.7, (x, y, z) => z > .3 && y < .7 ? .12 : 1), headSkin, null, null, HR);
        b.add(K.tube([[-.022, -.042, .145], [-.011, -.052, .151], [0, -.045, .155], [.011, -.052, .151], [.022, -.042, .145]], 10, 5, () => .0042), dark, null, null, null, { tint: '#2a1a10', ink: 0 });
        for (const sd of [-1, 1]) b.add(K.tube([[sd * .03, .062, .138], [sd * .05, .072, .128], [sd * .07, .068, .114]], 6, 4, () => .005), dark, null, null, null, { tint: D, ink: 0 });
      });
      C.eyePair(head, [0, 0, 0], HR, .33, .03, [.034, .043, .016], ['#120c08', '#1e160e', '#2a2018'], { fwd: .35, tex: { white: '#140e0a' } });
      for (const sd of [-1, 1]) lopEar(C, K, head, fur, sd, [.12, .085, .0], .27, .056, [[.26, Y], [.42, D], [.56, Y]], 1.25);
      antennae(C, K, head, [.035, .125, .02], [[0, 0, 0], [.012, .08, .015], [.04, .15, .01], [.075, .19, 0]], .026, dark, knob, false);
      for (const sd of [-1, 1]) wings(C, K, C.part(sd < 0 ? 'wingR' : 'wingL', fl, [sd * .07, .4, -.12], [0, sd * .7, 0]), wing, sd, [[.09, .065, .078, .052, .5], [.09, -.035, .055, .036, -.35]], { c1: '#f6f4e8', c2: '#dcd8c4' });
      for (const [nm, x, z] of [['footFR', -.08, .08], ['footFL', .08, .08], ['footBR', -.085, -.08], ['footBL', .085, -.08]]) C.build(C.part(nm, fl, [x, .03, z]), (b) => C.ell(b, fur, [0, 0, .01], [.042, .028, .05], { tint: (v, n) => K.rgb(n.y < -.3 ? '#c89a10' : Y) }));
    },
    idle(C, t, dt, walk) { beeIdle(C, t, walk, .016, 40); },
    act(C, name, u) { beeAct(C, name, u); },
  };

  // ---------- Bumblazer (sheet: it stands up now, lean, dark with yellow zigzag chevrons, a pale ruff, tall pointed ears
  // with a lightning bolt inside, glowing antenna knobs, big veined wings in a haze of yellow sparks, a little tail tuft) ----------
  CREATURE_DEFS.bumblazer = {
    height: .84, eyeY: .6, width: .62, size: 1.15, mouth: [0, -.035, .088],
    build(C, K) {
      const { Y, Y3, D, PALE } = BEE;
      const fur = C.M(), dark = C.M(), wing = C.M(), knob = C.M('#ffffff', { mat: { emissive: new THREE.Color('#ffe040'), emissiveIntensity: .6 } }), vein = C.M('#ffffff', { mat: { emissive: new THREE.Color('#ffd820'), emissiveIntensity: .4 } });
      const skin = zigSkin(C, D, Y, [[.18, .26], [.38, .46], [.58, .66], [.78, .86]], 8, -.06);
      const band = (k0) => (v) => { const k = ((-v.y + k0) * 22) % 2; return K.rgb(k > 0 && k < .75 ? Y : D); };
      const fl = C.part('float', null, [0, 0, 0]);
      const body = C.part('body', fl, [0, .37, 0]);
      C.build(body, (b) => {
        C.ell(b, skin, [0, 0, 0], [.095, .13, .082], { seg: 28, segv: 20 });
        C.ell(b, skin, [0, -.1, -.008], [.09, .07, .08]);
        // the pale ruff round its neck, hanging over the chest in points
        for (let i = 0; i < 11; i++) { const az = (i - 5) / 5 * 1.5, { p, n } = K.onBall([0, 0, 0], [.095, .13, .082], az, .62 - Math.abs(i - 5) * .02, -.01); b.add(new THREE.ConeGeometry(.03, .09, 7), fur, p, K.qDir([0, -1, 0], [n[0] * .6, -1, n[2] * .8]), [1, 1, .55], { tint: (v, nn) => K.rgb(nn.y > .2 ? '#fff4c8' : PALE), ink: .5 }); }
        C.ell(b, fur, [0, .1, .02], [.075, .04, .065], { tint: PALE, ink: .4 });
      });
      const tail = C.part('tail', fl, [0, .27, -.075]);
      C.build(tail, (b) => { for (const [x, y, k] of [[0, .02, 1], [.03, 0, .8], [-.03, 0, .8], [0, -.025, .7]]) b.add(new THREE.ConeGeometry(.028 * k, .09 * k, 7), fur, [x, y, -.03], K.qDir([0, 1, 0], [x * 6, .6 + y * 8, -1]), [1, 1, .7], { tint: Y3, ink: .55 }); });
      // the head: yellow face, dark crown with a yellow streak down the middle, a small muzzle, cheek tufts
      const HR = [.085, .078, .078];
      const head = C.part('head', fl, [0, .585, .02]);
      C.build(head, (b) => {
        C.ell(b, fur, [0, 0, 0], HR, { tint: (v, n) => K.rgb((n.y > .38 || n.z < -.15) && !(Math.abs(n.x) < .14 && n.y > .15 && n.z > -.7) ? D : Y) });
        C.ell(b, fur, [0, -.03, .06], [.042, .03, .032], { tint: (v, n) => K.rgb(n.y < 0 ? PALE : Y3), ink: .4 });
        C.ell(b, dark, [0, -.018, .092], [.01, .007, .006], { tint: '#1a1010', ink: .3 });
        b.add(K.tube([[-.016, -.038, .084], [-.007, -.045, .089], [0, -.04, .092], [.007, -.045, .089], [.016, -.038, .084]], 8, 5, () => .003), dark, null, null, null, { tint: '#2a1a10', ink: 0 });
        for (const sd of [-1, 1]) for (const [y, a, l] of [[-.02, .3, .05], [-.045, .75, .045]]) b.add(new THREE.ConeGeometry(.018, l, 6), fur, [sd * HR[0] * .9, y, .01], [0, 0, sd * -(PI / 2 + a)], [1, 1, .6], { tint: Y3, ink: .55 });
        for (const sd of [-1, 1]) b.add(K.tube([[sd * .018, .036, .07], [sd * .036, .044, .062], [sd * .055, .036, .05]], 6, 4, () => .005), dark, null, null, null, { tint: D, ink: 0 });
      });
      C.eyePair(head, [0, 0, 0], HR, .4, .04, [.026, .03, .012], ['#1c1408', '#3a2a14', '#6a5020'], { fwd: .3, roll: .18 });
      // tall pointed ears, a yellow bolt inside each
      for (const sd of [-1, 1]) {
        const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * .045, .06, -.01], [-.08, 0, sd * -.22]);
        const eh = .2, ew = .066;
        C.build(ear, (b) => {
          b.add(new THREE.ConeGeometry(1, 1, 14, 3), fur, [0, eh / 2, 0], null, [ew, eh, ew * .4], { tint: D });
          const bolt = [[-.35, .1], [.15, .5], [-.05, .52], [.32, .9], [-.18, .46], [.02, .44], [-.1, .1]].map(([x, y]) => [x * ew * 1.5, y * eh]);
          b.add(K.slab(bolt, .005, .001), dark, [0, .006, ew * .4 + .009], [-Math.atan2(ew * .4, eh), 0, 0], null, { tint: Y, ink: 0 });
        });
      }
      antennae(C, K, head, [.02, .07, .03], [[0, 0, 0], [.008, .07, .012], [.03, .13, .008], [.055, .16, 0]], .019, dark, knob, true);
      // arms at its sides, legs planted, banded
      for (const sd of [-1, 1]) {
        const arm = C.part(sd < 0 ? 'armR' : 'armL', fl, [sd * .095, .45, .005], [0, 0, sd * .18]);
        C.build(arm, (b) => { b.add(K.tube([[0, .01, 0], [sd * .01, -.07, .01], [sd * .005, -.14, .025]], 10, 10, (t) => .03 - .006 * t), fur, null, null, null, { tint: band(.0) }); C.ell(b, fur, [sd * .004, -.155, .03], [.032, .03, .032], { tint: D }); for (const d of [-1, 0, 1]) C.ell(b, fur, [sd * .004 + d * .013, -.17, .05], [.008, .008, .008], { tint: Y, ink: .3 }); });
        const leg = C.part(sd < 0 ? 'legR' : 'legL', fl, [sd * .058, .265, 0]);
        C.build(leg, (b) => {
          C.ell(b, fur, [sd * .01, -.05, -.005], [.052, .075, .058], { tint: band(.02) });
          b.add(K.tube([[sd * .01, -.08, 0], [sd * .015, -.16, -.01], [sd * .015, -.24, .0]], 10, 10, (t) => .04 - .008 * t), fur, null, null, null, { tint: band(.02) });
          C.ell(b, fur, [sd * .015, -.245, .03], [.042, .022, .065], { tint: D });
          for (const d of [-1, 0, 1]) C.ell(b, fur, [sd * .015 + d * .022, -.25, .088], [.009, .009, .012], { tint: Y, ink: .3 });
        });
      }
      // two pairs of veined wings, and the sparks round them
      for (const sd of [-1, 1]) {
        const w = C.part(sd < 0 ? 'wingR' : 'wingL', fl, [sd * .04, .48, -.07], [0, sd * .55, 0]);
        wings(C, K, w, wing, sd, [[.13, .1, .14, .068, .55], [.11, -.03, .095, .045, -.35]], { c1: '#e2ecf4', c2: '#b4c6d8', vein, veinCol: '#ffe050' });
        for (const [x, y, s] of [[.27, .22, .04], [.3, .1, .03], [.2, -.08, .035], [.06, .22, .03], [.18, .27, .025], [.24, -.02, .02]]) C.glow(w, [sd * x, y, .02], '#ffe840', s);
      }
    },
    idle(C, t, dt, walk) { beeIdle(C, t, walk, .014, 46); const P = C.parts; P.tail.rotation.y = Math.sin(t * 3) * .2; P.earL.rotation.z = Math.sin(t * 1.7) * .05; P.earR.rotation.z = -Math.sin(t * 1.9) * .05; P.armL.rotation.x = Math.sin(t * 2) * .06; P.armR.rotation.x = Math.sin(t * 2 + 1) * .06; },
    act(C, name, u) { C.earUp = true; beeAct(C, name, u); const P = C.parts, k = Math.sin(u * PI); if (name === 'hit') { P.earL.rotation.x -= .4 * k; P.earR.rotation.x -= .4 * k; } },
  };

  // ---------- Queenbuzz (sheet: the queen of the hive, on four banded legs, a great cape of pale gold petal-fur round her
  // shoulders, long dark lop ears with yellow chevrons, a little gold crown, a honeycomb brooch, tall veined wings, and a
  // big round striped bee's body behind) ----------
  CREATURE_DEFS.queenbuzz = {
    height: .96, eyeY: .62, width: .82, size: 1.3, mouth: [0, -.04, .112],
    build(C, K) {
      const { Y, Y2, Y3, D, PALE } = BEE;
      const fur = C.M(), dark = C.M(), wing = C.M(), petal = C.M(), knob = C.M('#ffffff', { mat: { emissive: new THREE.Color('#ffc820'), emissiveIntensity: .3 } }), gold = C.M('#ffffff', { mat: { emissive: new THREE.Color('#a06a00'), emissiveIntensity: .25 } }), vein = C.M();
      const bodySkin = zigSkin(C, Y, D, [[.28, .36], [.48, .56], [.68, .76], [.88, 1.1]], 14, .035);
      const abSkin = zigSkin(C, Y, D, [[.22, .3], [.4, .48], [.58, .66], [.76, .84]], 14, .035);
      const band = (v) => { const k = ((-v.y + .012 * Math.sign(Math.sin(v.x * 90 + v.z * 60))) * 26) % 2; return K.rgb(k > 0 && k < .9 ? D : Y); };
      const body = C.part('body', null, [0, .3, 0]);
      C.build(body, (b) => C.ell(b, bodySkin, [0, 0, 0], [.15, .14, .19], { seg: 28, segv: 20 }));
      const ab = C.part('abdomen', null, [0, .29, -.17]);
      C.build(ab, (b) => {
        b.add(fuzzBall(44, .07, 13, 2.3), abSkin, [0, .0, -.17], [-.35, 0, 0], [.165, .16, .175]);
        for (const [x, y, k] of [[0, 0, 1], [.035, -.01, .8], [-.035, -.01, .8], [0, -.04, .75]]) b.add(new THREE.ConeGeometry(.035 * k, .11 * k, 7), fur, [x, .12 + y, -.27], K.qDir([0, 1, 0], [x * 5, 1, -.7]), [1, 1, .7], { tint: Y3, ink: .55 });
      });
      for (const [nm, x, z] of [['legFR', -.09, .11], ['legFL', .09, .11], ['legBR', -.1, -.09], ['legBL', .1, -.09]]) {
        const lg = C.part(nm, null, [x, .24, z]);
        C.build(lg, (b) => {
          b.add(K.lathe([[0, .03], [.05, .01], [.048, -.1], [.042, -.2], [0, -.215]], 14), fur, null, null, null, { tint: band });
          C.ell(b, fur, [0, -.212, .02], [.05, .03, .062], { tint: (v, n) => K.rgb(n.y < -.3 ? '#e0b840' : '#fbe08a') });
          for (const d of [-1, 1]) b.add(K.tube([[d * .015, -.2, .07], [d * .016, -.222, .08]], 3, 4, () => .003), dark, null, null, null, { tint: '#6a4a10', ink: 0 });
        });
      }
      // the cape: pale gold petals round the shoulders, short at the collar, long down the sides and back
      const mane = C.part('mane', null, [0, .46, .07]);
      C.build(mane, (b) => {
        const cols = ['#f6c83a', '#f8d252', '#eeb42c', '#fbdc6a', '#f2c040'];
        let sd = 31; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const lay = (n, r, y, len, w, down, skipFront, k0) => { const g = K.slab(leafShape(w, len), .006, .002); for (let i = 0; i < n; i++) {
          const az = (i + k0) / n * TAU - PI; if (skipFront && Math.abs(az) < skipFront) continue;
          const o = [Math.sin(az), 0, Math.cos(az)], dir = [o[0] * (1 - down), -down, o[2] * (1 - down)], nn = [o[0] * down, 1 - down + .2, o[2] * down];
          b.add(g, petal, [o[0] * r * 1.1, y, o[2] * r * .9], frame(dir, nn), .9 + rr() * .25, { tint: K.rgb(cols[Math.floor(rr() * cols.length)]), ink: .5 });
        } };
        lay(20, .17, -.03, .32, .066, .8, .5, 0);
        lay(16, .14, .03, .25, .058, .7, .35, .5);
        lay(12, .09, .07, .14, .045, .55, 0, .25);
        // the honeycomb brooch on the chest
        for (const [x, y] of [[0, .012], [-.012, -.008], [.012, -.008]]) C.ell(b, gold, [x, y + .0, .13], [.012, .012, .008], { tint: '#ffd040', ink: .4 });
        b.add(new THREE.TorusGeometry(.026, .005, 6, 18), gold, [0, 0, .128], null, null, { tint: '#e8a818', ink: .4 });
      });
      // the head: a round yellow face, a pale muzzle, amber eyes, a gold crown
      const HR = [.112, .102, .102];
      const head = C.part('head', null, [0, .6, .14]);
      C.build(head, (b) => {
        C.ell(b, fur, [0, 0, 0], HR, { tint: (v, n) => K.rgb(n.y > .6 ? Y : n.y < -.4 ? Y2 : '#f8cc30') });
        C.ell(b, fur, [0, -.04, .07], [.05, .035, .04], { tint: '#fbe08a', ink: .4 });
        C.ell(b, dark, [0, -.025, .108], [.01, .007, .006], { tint: '#3a2010', ink: .3 });
        b.add(K.tube([[-.018, -.05, .1], [-.008, -.058, .106], [0, -.052, .109], [.008, -.058, .106], [.018, -.05, .1]], 8, 5, () => .0035), dark, null, null, null, { tint: '#3a2010', ink: 0 });
        for (const sd of [-1, 1]) for (const [y, a, l] of [[-.02, .4, .06], [-.055, .9, .05]]) b.add(new THREE.ConeGeometry(.022, l, 6), fur, [sd * HR[0] * .85, y, .02], [0, 0, sd * -(PI / 2 + a)], [1, 1, .6], { tint: Y3, ink: .55 });
      });
      C.eyePair(head, [0, 0, 0], HR, .36, .05, [.03, .036, .013], ['#3a2008', '#8a5a10', '#d8a030'], { fwd: .3 });
      for (const sd of [-1, 1]) lopEar(C, K, head, fur, sd, [.09, .07, -.01], .34, .055, [[.1, Y], [.24, D], [.33, Y], [.5, D], [.6, Y], [.78, D], [.86, Y]], 1.4);
      const crown = C.part('crown', head, [0, .095, .0], [-.15, 0, 0]);
      C.build(crown, (b) => {
        b.add(new THREE.CylinderGeometry(.042, .048, .028, 18), gold, [0, 0, 0], null, null, { tint: (v, n) => K.rgb(n.y > .5 ? '#ffe060' : '#f0b020') });
        for (let i = 0; i < 5; i++) { const a = (i - 2) * .55; b.add(new THREE.ConeGeometry(.012, i === 2 ? .06 : .04, 6), gold, [Math.sin(a) * .04, .03 + (i === 2 ? .012 : 0), Math.cos(a) * .04], null, null, { tint: '#f8c828', ink: .4 }); C.ell(b, gold, [Math.sin(a) * .044, .015, Math.cos(a) * .044], [.009, .009, .009], { tint: '#ffd850', ink: .3 }); }
        C.ell(b, gold, [0, .02, .046], [.014, .014, .01], { tint: '#ffb020', ink: .4 });
      });
      antennae(C, K, head, [.03, .095, -.02], [[0, 0, 0], [.015, .09, .01], [.05, .18, 0], [.095, .23, -.01]], .034, dark, knob, false);
      for (const sd of [-1, 1]) wings(C, K, C.part(sd < 0 ? 'wingR' : 'wingL', null, [sd * .07, .53, -.06], [0, sd * .6, 0]), wing, sd, [[.12, .17, .2, .11, 1.1], [.17, .0, .15, .07, -.12]], { c1: '#e4f6ee', c2: '#b8dccf', vein, veinCol: '#f0c840' });
    },
    idle(C, t, dt, walk) { beeIdle(C, t, walk, 0, 14, .12); const P = C.parts; P.crown.rotation.z = Math.sin(t * 1.1) * .04; P.abdomen.rotation.x = Math.sin(t * 2.4) * .04; P.abdomen.rotation.y = Math.sin(t * 1.3) * .06; P.mane.scale.y = 1 + Math.sin(t * 2.4) * .015; },
    act(C, name, u) { beeAct(C, name, u); const P = C.parts, k = Math.sin(u * PI); if (name === 'attack' || name === 'roar' || name === 'puff') P.abdomen.rotation.x -= .3 * k; if (name === 'happy') P.abdomen.rotation.y += Math.sin(u * TAU * 2) * .4; },
  };

  // hovering: the whole bee bobs, the wings buzz, the ears and antennae sway
  function beeIdle(C, t, walk, bob, buzz, amp) {
    const P = C.parts;
    if (P.float) P.float.position.y += bob * (1.1 + Math.sin(t * 3.1)) * (walk ? 1.6 : 1);
    const fl = Math.sin(t * buzz) * (amp || .38);
    for (const [w, sd] of [[P.wingL, 1], [P.wingR, -1], [P.wingL2, 1], [P.wingR2, -1]]) if (w) w.rotation.y += sd * fl;
    if (P.earL) { P.earL.rotation.z = Math.sin(t * 2.1) * .06; P.earR.rotation.z = -Math.sin(t * 2.1 + .7) * .06; P.earL.rotation.x = Math.sin(t * 1.4) * .05; P.earR.rotation.x = Math.sin(t * 1.6) * .05; }
    if (P.antL) { P.antL.rotation.z = Math.sin(t * 2.6) * .12; P.antR.rotation.z = -Math.sin(t * 2.9 + 1) * .12; P.antL.rotation.x = Math.sin(t * 1.7) * .08; P.antR.rotation.x = Math.sin(t * 1.9) * .08; }
    P.head.rotation.z += Math.sin(t * .8) * .05;
    if (walk && P.legL) { const s = Math.sin(t * 11); P.legL.rotation.x = s * .4; P.legR.rotation.x = -s * .4; if (P.armL) { P.armL.rotation.x = -s * .3; P.armR.rotation.x = s * .3; } }
    if (walk && P.legFR) { const s = Math.sin(t * 9); P.legFR.rotation.x = s * .35; P.legBL.rotation.x = s * .35; P.legFL.rotation.x = -s * .35; P.legBR.rotation.x = -s * .35; }
  }
  function beeAct(C, name, u) {
    const P = C.parts, k = Math.sin(u * PI), buzz = (f) => { for (const [w, sd] of [[P.wingL, 1], [P.wingR, -1], [P.wingL2, 1], [P.wingR2, -1]]) if (w) w.rotation.y += sd * Math.sin(u * 90) * .5 * f; };
    if (name === 'attack' || name === 'cast' || name === 'happy' || name === 'hop' || name === 'puff' || name === 'roar' || name === 'statichop' || name === 'spin') buzz(k);
    if (P.earL && !C.earUp) {
      if (name === 'hit' || name === 'hop' || name === 'statichop') { P.earL.rotation.z -= .7 * k; P.earR.rotation.z += .7 * k; }
      if (name === 'attack' || name === 'cast') { P.earL.rotation.x -= .5 * k; P.earR.rotation.x -= .5 * k; }
      if (name === 'happy' || name === 'shake') { P.earL.rotation.z -= Math.abs(Math.sin(u * TAU * 2)) * .5; P.earR.rotation.z += Math.abs(Math.sin(u * TAU * 2)) * .5; }
    }
    if (name === 'faint' || name === 'sleep') { if (P.float) P.float.position.y -= .02; P.head.rotation.x += .25; }
    if (P.armL && (name === 'attack' || name === 'cast' || name === 'chomp')) { P.armL.rotation.x -= 1.2 * k; P.armR.rotation.x -= 1.2 * k; }
    if (P.armL && name === 'roar') { P.armL.rotation.z += .6 * k; P.armR.rotation.z -= .6 * k; }
    if (name === 'spit' || name === 'roar') P.head.rotation.x -= .25 * k;
  }
})();
