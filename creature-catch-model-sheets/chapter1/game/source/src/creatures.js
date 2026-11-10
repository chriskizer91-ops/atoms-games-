// creatures.js: the creatures of Creature Catch in 3D, built in code from their sprites and their turnaround sheets, in the
// style of the people (cel shading, a cool rim, ink outlines): the three starters Drizzlon, Mossback and Embroak, and the
// Meadow Path's Clovermouse and Hopsprout. And the capture cube, purple top, blue bottom.
// Units are meters, Y up, facing +Z, feet on y = 0. Each creature returns
//   { root, rig, height, eyeY, update(t, dt, walk), play(name) -> Promise, flash(k, colour), fade(a), glow, busy }
// play: 'attack' (a lunge; hit at its peak), 'cast' (rears up and throws something), 'hit', 'hop', 'happy', 'faint',
//       'appear' (grows out of a flash of light), 'vanish' (shrinks into light, for the cube), 'shake' (no!), 'roar'
const CREATURE_DEFS = {};
// body actions any creature can play, added by the movesets: CREATURE_ACTIONS.stomp = { dur, hit, hold, f(u, o, C, st) }
// (o is the whole-body offset: x y z rx ry rz sx sy sz). A creature's own def.actions win over these.
const CREATURE_ACTIONS = {};
function makeCreature(id, opts) {
  'use strict';
  opts = opts || {};
  const D = CREATURE_DEFS[id] || CREATURE_DEFS.clovermouse;
  const { cl, sm, lerp, PI, TAU, rgb } = KIT;
  const root = new THREE.Group(); root.name = id;
  const rig = new THREE.Group(); root.add(rig);
  const mats = [];
  const M = (c, o) => { const m = KIT.toon(c || '#ffffff', o); m.vertexColors = true; m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; mats.push(m); return m; };
  const ink = KIT.inkMat(); mats.push(ink);
  const C = { id, root, rig, parts: {}, eyes: [], mats, M, ink, glows: [], lights: [], blink: 0, mouth: null };
  // a part: a pivot group under a parent, at a position
  C.part = (name, parent, pos, rot) => { const g = new THREE.Group(); g.name = name; if (pos) g.position.set(pos[0], pos[1], pos[2]); if (rot) g.rotation.set(rot[0], rot[1], rot[2]); (parent || rig).add(g); C.parts[name] = g; g.userData.rest = { p: g.position.clone(), r: g.rotation.clone(), s: g.scale.clone() }; return g; };
  // a painted skin (CPAINT, below): a canvas texture on a toon material of its own
  C.paint = (w, h, draw) => { const t = KIT.canvasTex(w, h, (g) => draw(g, w, h)); t.wrapS = THREE.RepeatWrapping; return M('#ffffff', { mat: { map: t } }); };
  // build pieces into a group: fn(b) adds geometry with b.add / helpers; merged per material
  C.build = (group, fn) => { const b = KIT.builder(); fn(b); return b.build(group, ink); };
  // an ellipsoid
  C.ell = (b, mat, c, r, o) => b.add(new THREE.SphereGeometry(1, (o && o.seg) || 24, (o && o.segv) || 16), mat, c, o && o.rot, r, o);
  // eyes on a head: a pair, at azimuth ±az, elevation el on the ellipsoid (C0, R), sized
  C.eyePair = (group, C0, R, az, el, size, iris, o) => {
    o = o || {};
    const tex = KIT.eyeTex(iris, o.tex || {}), mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: KIT.ramp, emissive: new THREE.Color('#1a1826'), emissiveIntensity: .3 }); mat.userData.e0 = mat.emissive.clone(); mat.userData.i0 = .3; mats.push(mat);
    for (const sd of [-1, 1]) {
      const eg = new THREE.Group(); const { p, n } = KIT.onBall(C0, R, sd * az, el, -(size[2] * .35));
      eg.position.set(p[0], p[1], p[2]); group.add(eg);
      const geo = KIT.eyeGeo([0, 0, 0], n, size[0], size[1], size[2], o.fwd, (o.roll || 0) * -sd);
      const m = new THREE.Mesh(geo, mat); eg.add(m);
      const ig = geo.clone(); ig.setAttribute('inkw', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(.6), 1));
      eg.add(new THREE.Mesh(ig, ink));
      C.eyes.push(eg);
    }
  };
  // a glowing bit (embers, droplets): an additive sprite that follows an object
  C.glow = (parent, pos, color, size) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: KIT.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(pos[0], pos[1], pos[2]); s.scale.setScalar(size); parent.add(s); C.glows.push({ s, size, color }); return s;
  };
  // our painted GLB model, when one is packed for this creature (models.js); otherwise the model built here in code
  const glb = !opts.code && typeof MODELS !== 'undefined' && MODELS.has(id) ? MODELS.creatureBody(id, C, D) : null;
  if (!glb) D.build(C, KIT);
  // ---------- motion ----------
  const st = { t: 0, act: null, blinkIn: 1 + Math.random() * 2, blinkT: -1, walkPh: 0, fadeV: 1, flashV: 0 };
  const off = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
  const ACT = {
    attack: { dur: .55, hit: .32, f(u, o) { const k = u < .3 ? -Math.sin(u / .3 * PI) * .25 : u < .45 ? sm(.3, .42, u) : 1 - sm(.45, 1, u); o.z = k * .42; o.y = Math.sin(cl(u / .5, 0, 1) * PI) * .06; o.rx = (u < .3 ? -.25 * Math.sin(u / .3 * PI) : .3 * Math.sin(cl((u - .3) / .4, 0, 1) * PI)); o.sy = 1 + .08 * Math.sin(u * TAU); o.sz = 1 - .08 * Math.sin(u * TAU); } },
    cast: { dur: .8, hit: .45, f(u, o) { const a = sm(0, .35, u) * (1 - sm(.45, .8, u)), b = Math.sin(cl((u - .38) / .25, 0, 1) * PI); o.rx = -.35 * a + .3 * b; o.y = .05 * a; o.z = .12 * b - .04 * a; o.sy = 1 + .1 * a - .06 * b; } },
    hit: { dur: .5, f(u, o) { const k = Math.sin(cl(u / .5, 0, 1) * PI) * (1 - u); o.z = -.22 * Math.sin(Math.min(1, u * 3) * PI / 2) * (1 - sm(.3, 1, u)); o.rx = -.25 * k; o.rz = .12 * Math.sin(u * 30) * (1 - u); } },
    hop: { dur: .45, f(u, o) { o.y = Math.sin(u * PI) * .14; o.sy = u < .15 ? 1 - .15 * Math.sin(u / .15 * PI) : 1 + .08 * Math.sin((u - .15) / .85 * PI); } },
    happy: { dur: 1.1, f(u, o) { const h = (u * 2) % 1; o.y = Math.sin(h * PI) * .12; o.ry = Math.sin(u * TAU) * .35; o.sy = 1 + .06 * Math.sin(h * PI); } },
    shake: { dur: .7, f(u, o) { o.ry = Math.sin(u * 28) * .3 * (1 - u); } },
    roar: { dur: .9, hit: .35, f(u, o) { const a = Math.sin(cl(u / .9, 0, 1) * PI); o.rx = -.3 * a; o.sy = 1 + .12 * a; o.sx = 1 + .05 * Math.sin(u * 50) * a; } },
    faint: { dur: 1.1, hold: true, f(u, o) { const k = sm(0, .7, u); o.rz = .9 * k; o.y = -.08 * k; o.x = .06 * k; o.sy = 1 - .25 * k; st.fadeV = 1 - sm(.4, 1, u); } },
    appear: { dur: .55, f(u, o) { const k = u < .7 ? sm(0, .7, u) * 1.15 : lerp(1.15, 1, sm(.7, 1, u)); o.sx = o.sy = o.sz = Math.max(.001, k); st.flashV = 1 - sm(.2, .9, u); } },
    vanish: { dur: .4, hold: true, f(u, o) { st.flashV = sm(0, .3, u); const k = 1 - sm(.15, 1, u); o.sx = o.sy = o.sz = Math.max(.001, k); o.y = .25 * sm(.15, 1, u); } },
    sleep: { dur: 1, hold: true, f(u, o) { o.sy = .95; o.rx = .1; C.blink = 1; } },
    // for the moves: a wind-up crouch, rearing back to spit, a tongue flick, puffing up, curling up, a spin, two quick bites
    crouch: { dur: .28, hold: true, f(u, o) { const k = sm(0, 1, u); o.sy = 1 - .2 * k; o.sx = o.sz = 1 + .1 * k; o.rx = .12 * k; } },
    spit: { dur: .6, hit: .34, f(u, o) { const a = sm(0, .3, u) * (1 - sm(.32, .4, u)), b = sm(.3, .38, u) * (1 - sm(.55, 1, u)); o.rx = -.38 * a + .28 * b; o.z = -.04 * a + .09 * b; o.sy = 1 + .08 * a - .05 * b; o.y = .02 * a; } },
    flick: { dur: .75, hit: .36, f(u, o) { const a = sm(0, .25, u) * (1 - sm(.3, .38, u)), b = sm(.3, .36, u) * (1 - sm(.6, 1, u)); o.rx = -.2 * a + .12 * b; o.z = .05 * b; } },
    puff: { dur: 1.0, f(u, o) { const k = Math.sin(cl(u, 0, 1) * PI); o.sx = o.sy = o.sz = 1 + .18 * k + .03 * Math.sin(u * 60) * k; o.y = .04 * k; } },
    curl: { dur: 1.2, f(u, o) { const k = sm(0, .2, u) * (1 - sm(.8, 1, u)); o.sy = 1 - .12 * k; o.sx = o.sz = 1 + .04 * k; } },
    spin: { dur: .55, f(u, o) { o.ry = sm(0, 1, u) * TAU; o.y = Math.sin(u * PI) * .06; } },
    chomp: { dur: .55, hit: .3, f(u, o) { o.rx = .22 * Math.abs(Math.sin(u * TAU * 2)) * (1 - u); o.z = .08 * Math.sin(u * PI); } },
    tuck: { dur: 1, hold: true, f(u, o) { const k = sm(0, .3, u); o.sy = 1 - .12 * k; o.rx = -.25 * k; } },
  };
  function play(name) {
    const def = (D.actions && D.actions[name]) || ACT[name] || CREATURE_ACTIONS[name]; if (!def) return Promise.resolve();
    if (name !== 'faint' && name !== 'vanish') st.fadeV = Math.max(st.fadeV, 0);
    if (glb) glb.start(name, def);
    return new Promise((ok) => { if (st.act && st.act.ok) st.act.ok(); st.act = { name, def, t: 0, ok, hitDone: false }; });
  }
  function reset() { if (glb) glb.end(); if (st.act && st.act.ok) st.act.ok(); st.act = null; st.fadeV = 1; st.flashV = 0; C.blink = 0; Object.assign(off, { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 }); }
  const tmpCol = new THREE.Color();
  let flashCol = new THREE.Color('#ffffff'), lastFade = 1;
  function update(t, dt, walk) {
    st.t += dt;
    for (const g of Object.values(C.parts)) { const r = g.userData.rest; g.position.copy(r.p); g.rotation.copy(r.r); g.scale.copy(r.s); }
    Object.assign(off, { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
    // breathing, and the creature's own idle
    const br = Math.sin(t * 2.4 + (opts.seed || 0));
    if (!glb) { off.sy += .025 * br; off.sx -= .01 * br; } // (our models breathe and walk in their own clips)
    if (walk > 0 && !glb) { st.walkPh += dt * 14 * walk; off.y += Math.abs(Math.sin(st.walkPh)) * .05 * (D.hopper ? 2.2 : 1); off.rz += Math.sin(st.walkPh) * .05 * (D.hopper ? 0 : 1); off.rx += D.hopper ? -.1 * Math.abs(Math.sin(st.walkPh)) : 0; }
    if (D.idle && !glb) D.idle(C, t, dt, walk || 0, st);
    // an action on top
    let u = 0;
    if (st.act) {
      const a = st.act; a.t += dt; u = Math.min(1, a.t / a.def.dur);
      a.def.f(u, off, C, st);
      if (glb) glb.shape(off, a.name); else if (D.act) D.act(C, a.name, u, t);
      if (a.def.hit && !a.hitDone && u >= a.def.hit) { a.hitDone = true; if (a.onHit) a.onHit(); }
      if (u >= 1) { if (a.ok) { a.ok(); a.ok = null; } if (!a.def.hold) st.act = null; }
    }
    rig.position.set(off.x, off.y, off.z); rig.rotation.set(off.rx, off.ry, off.rz); rig.scale.set(off.sx, off.sy, off.sz);
    if (glb) glb.update(dt, walk || 0, st.act);
    // blinking
    if (st.blinkT < 0) { st.blinkIn -= dt; if (st.blinkIn <= 0) { st.blinkT = 0; st.blinkIn = 2 + Math.random() * 3; } }
    let bk = 0; if (st.blinkT >= 0) { st.blinkT += dt; const k = st.blinkT / .16; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) st.blinkT = -1; }
    const close = Math.max(bk, C.blink || 0);
    for (const e of C.eyes) e.scale.y = Math.max(.08, 1 - close * .92);
    // glows flicker
    for (const g of C.glows) { const f = .85 + .15 * Math.sin(t * 23 + g.size) * Math.sin(t * 7.3); g.s.scale.setScalar(g.size * f); g.s.material.opacity = st.fadeV; }
    for (const L of C.lights) L.intensity = L.userData.base * (.85 + .15 * Math.sin(t * 19)) * st.fadeV;
    // flash (hit white, or a type colour) and fade
    st.flashV = Math.max(0, st.flashV - dt * 2.5 * (st.act && st.act.name === 'vanish' ? 0 : 1));
    const fk = cl(st.flashV, 0, 1);
    for (const m of mats) if (m.emissive && m.userData.e0) { m.emissive.copy(m.userData.e0).lerp(flashCol, fk); m.emissiveIntensity = lerp(m.userData.i0, 1, fk); }
    if (glb) glb.flash(fk, flashCol);
    if (Math.abs(st.fadeV - lastFade) > 1e-3) { lastFade = st.fadeV; const tr = st.fadeV < .999; for (const m of mats) { if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = st.fadeV; } root.visible = st.fadeV > .01; }
  }
  // where its mouth is, in the world (for things it breathes or spits); the ember's tip for Embroak
  const _mw = new THREE.Vector3();
  function mouth(out) {
    out = out || new THREE.Vector3();
    if (glb) { root.updateMatrixWorld(true); return glb.anchor(D.mouthPart || 'mouth', out); }
    if (D.mouthPart && C.parts[D.mouthPart]) { root.updateMatrixWorld(true); return C.parts[D.mouthPart].getWorldPosition(out); }
    const hp = C.parts.head; root.updateMatrixWorld(true);
    if (hp) return hp.localToWorld(out.set(...(D.mouth || [0, -.05, .12])));
    return root.localToWorld(out.set(0, D.height * .6, .15));
  }
  const api = {
    mouth,
    glb: !!glb, ghost: glb ? glb.ghost : null, anchor: glb ? (n, out) => glb.anchor(n, out || new THREE.Vector3()) : null,
    id, root, rig, parts: glb ? glb.parts : C.parts, height: D.height, size: D.size || 1, eyeY: D.eyeY || D.height * .7, width: D.width || .5, hopper: !!D.hopper,
    update, reset,
    play(name, onHit) { const p = play(name); if (onHit && st.act) st.act.onHit = onHit; return p; },
    flash(k, col) { st.flashV = k; flashCol = new THREE.Color(col || '#ffffff'); },
    get busy() { return !!st.act && !st.act.def.hold && st.act.t < st.act.def.dur; },
    get act() { return st.act ? st.act.name : ''; },
    fade(a) { st.fadeV = a; },
    setSleep(on) { C.blink = on ? 1 : 0; },
  };
  update(0, 0, 0);
  return api;
}

// ---------- shared bits for the creatures, from their turnaround sheets ----------
// a painted skin: a canvas texture laid round an ellipsoid (SphereGeometry's uv: u 0 = its right side, .25 = front,
// .5 = its left side, .75 = back; v top to bottom). Draw functions get (g, W, H).
const CPAINT = {
  flame(g, x, yb, yt, w, outer, inner) { // a flame pointing up: base at yb, tip at yt
    const h = yb - yt, f = (c, k) => { g.fillStyle = c; g.beginPath(); g.moveTo(x - w * k, yb); g.bezierCurveTo(x - w * k * 1.1, yb - h * .45, x - w * k * .2, yb - h * .55, x - w * k * .15, yb - h * .8 * k - h * .2); g.quadraticCurveTo(x, yt + h * (1 - k) * .9, x + w * k * .1, yb - h * .75 * k - h * .25); g.bezierCurveTo(x + w * k * .5, yb - h * .5, x + w * k * 1.1, yb - h * .4, x + w * k, yb); g.closePath(); g.fill(); };
    f(outer, 1); if (inner) f(inner, .55);
  },
  wrap(g, W, fn) { fn(0); fn(W); fn(-W); },
};
const spotty = (v, k) => Math.sin(v.x * 61 + 1.3) * Math.sin(v.y * 53 + 2.1) * Math.sin(v.z * 47 + .7) > (k || .45);

// ---------- Drizzlon: the little water dragon (sheet: sitting up, mint fin-ears and wings, diamonds down its back) ----------
CREATURE_DEFS.drizzlon = {
  height: .64, eyeY: .44, width: .5, mouth: [0, -.07, .16],
  build(C, K) {
    const B1 = '#2f8ef0', B2 = '#0b5fca', B3 = '#4fb2f4', MINT = '#84f4e0', PALE = '#c5f6e0';
    const blue = C.M(), mint = C.M(), horn = C.M(), dark = C.M(), drip = C.M('#ffffff', { mat: { emissive: new THREE.Color('#1a5ad0'), emissiveIntensity: .35 } });
    const bodyTint = (v, n) => K.rgb(n.y > .5 ? B3 : n.y > -.35 ? B1 : B2);
    const bodySkin = C.paint(512, 256, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, B3); gr.addColorStop(.45, B1); gr.addColorStop(1, B2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.save(); g.beginPath(); g.ellipse(.25 * W, .64 * H, .115 * W, .42 * H, 0, 0, Math.PI * 2); g.clip();
      g.fillStyle = MINT; g.fillRect(0, 0, W, H); g.fillStyle = PALE; g.fillRect(.18 * W, .25 * H, .04 * W, .6 * H);
      g.fillStyle = '#3cc6be'; for (let y = .3 * H; y < H; y += .095 * H) g.fillRect(0, y, W, 4);
      g.restore();
      g.strokeStyle = '#123a8a'; g.lineWidth = 4; g.beginPath(); g.ellipse(.25 * W, .64 * H, .115 * W, .42 * H, 0, 0, Math.PI * 2); g.stroke();
    });
    // the body: sitting up on its haunches, chest forward
    const body = C.part('body', null, [0, .19, -.02], [-.22, 0, 0]);
    C.build(body, (b) => {
      C.ell(b, bodySkin, [0, 0, 0], [.13, .15, .14]);
      // diamonds down its spine
      for (let i = 0; i < 6; i++) { const { p, n } = K.onBall([0, 0, 0], [.13, .15, .14], Math.PI, 1.1 - i * .27, .004); b.add(new THREE.OctahedronGeometry(1, 0), mint, p, K.qDir([0, 0, 1], n), [.022, .03, .012], { tint: i % 2 ? '#3fc8ea' : '#7ae8e8', ink: .5 }); }
    });
    for (const sd of [-1, 1]) { // the haunches and the hind feet
      const h = C.part(sd < 0 ? 'hipR' : 'hipL', null, [sd * .11, .09, -.07]);
      C.build(h, (b) => {
        C.ell(b, blue, [0, 0, 0], [.068, .08, .095], { tint: bodyTint });
        C.ell(b, blue, [sd * .005, -.065, .07], [.05, .026, .062], { tint: B1 });
        for (const d of [-1, 0, 1]) C.ell(b, horn, [sd * .005 + d * .022, -.07, .128], [.011, .013, .016], { tint: '#ffffff', ink: .4 });
      });
    }
    for (const [nm, x] of [['legFR', -.07], ['legFL', .07]]) { // the front legs, straight down
      const lg = C.part(nm, null, [x, .15, .08]);
      C.build(lg, (b) => {
        b.add(K.lathe([[.0, .03], [.044, .015], [.04, -.08], [.045, -.12], [0, -.135]], 14), blue, null, null, null, { tint: (v, n) => K.rgb(n.y < -.5 ? B2 : B1) });
        C.ell(b, blue, [0, -.125, .02], [.048, .026, .055], { tint: B1 });
        for (const d of [-1, 0, 1]) C.ell(b, horn, [d * .02, -.132, .07], [.011, .013, .015], { tint: '#ffffff', ink: .4 });
      });
    }
    // the head: big and round, a short muzzle, two cream horns, the mint diamond on its brow
    const head = C.part('head', null, [0, .42, .05]);
    C.build(head, (b) => {
      C.ell(b, blue, [0, 0, 0], [.158, .145, .14], { tint: bodyTint });
      C.ell(b, blue, [0, -.05, .095], [.088, .062, .062], { tint: (v, n) => K.rgb(n.y > .3 ? B3 : B1) });
      for (const sd of [-1, 1]) C.ell(b, dark, [sd * .024, -.035, .152], [.008, .006, .004], { tint: '#0a2a6a', ink: 0 });
      b.add(K.tube([[-.032, -.078, .138], [0, -.088, .148], [.032, -.078, .138]], 8, 5, () => .004), dark, null, null, null, { tint: '#0a2a6a', ink: 0 });
      for (const sd of [-1, 1]) b.add(K.tube([[sd * .055, .095, -.0], [sd * .064, .15, -.02], [sd * .07, .195, -.045], [sd * .068, .215, -.06]], 12, 10, (t) => .033 * (1 - .9 * t) + .003), horn, null, null, null, { tint: (v, n) => K.rgb(n.x * (v.x > 0 ? 1 : -1) > .3 ? '#d8cfae' : '#f4ecd2') });
      b.add(new THREE.OctahedronGeometry(1, 0), mint, [0, .1, .105], [-.7, 0, 0], [.026, .036, .012], { tint: '#5ad8e8', ink: .5 });
      for (let i = 0; i < 3; i++) { const { p, n } = K.onBall([0, 0, 0], [.158, .145, .14], Math.PI, .9 - i * .45, .004); b.add(new THREE.OctahedronGeometry(1, 0), mint, p, K.qDir([0, 0, 1], n), [.02, .026, .011], { tint: '#3fc8ea', ink: .5 }); }
    });
    C.eyePair(head, [0, 0, 0], [.158, .145, .14], .4, .0, [.052, .066, .02], ['#0b2a7a', '#1f6ad8', '#8ad0ff'], { fwd: .25 });
    // the fin-ears: mint fans with blue ribs, either side of its head
    for (const sd of [-1, 1]) {
      const fin = C.part(sd < 0 ? 'finR' : 'finL', head, [sd * .14, .025, -.03], [0, sd * .55, sd * .15]);
      C.build(fin, (b) => {
        const P = [[0, -.03], [.04, .085], [.065, .045], [.11, .095], [.11, .035], [.15, .045], [.12, -.0], [.13, -.035], [.06, -.045]].map(([x, y]) => [x * sd, y]);
        b.add(K.slab(sd < 0 ? P.slice().reverse() : P, .01, .003), mint, null, null, null, { tint: (v) => K.rgb(Math.abs(v.x) > .1 ? PALE : MINT) });
        for (const [x, y] of [[.04, .085], [.11, .095], [.15, .045], [.13, -.035]]) b.add(K.tube([[0, 0, .004], [sd * x * .55, y * .55, .006], [sd * x * .92, y * .92, .006]], 4, 4, () => .006), blue, null, null, null, { tint: '#2a7ae0', ink: 0 });
      });
    }
    // wings on its back, spread out to the sides
    for (const sd of [-1, 1]) {
      const w = C.part(sd < 0 ? 'wingR' : 'wingL', null, [sd * .085, .29, -.1], [0, sd * -.35, sd * .2]);
      C.build(w, (b) => {
        const P = [[0, 0], [.06, .1], [.13, .165], [.22, .15], [.18, .1], [.225, .05], [.16, .04], [.17, -.01], [.09, .005], [.04, -.03]].map(([x, y]) => [x * sd, y]);
        b.add(K.slab(sd < 0 ? P.slice().reverse() : P, .009, .003), mint, null, null, null, { tint: (v) => K.rgb(v.y > .09 ? MINT : PALE) });
        b.add(K.tube([[0, 0, 0], [sd * .06, .1, 0], [sd * .13, .16, 0], [sd * .22, .15, 0]], 12, 6, (t) => .014 * (1 - .5 * t)), blue, null, null, null, { tint: B1 });
        for (const [x, y] of [[.18, .1], [.16, .04], [.09, .005]]) b.add(K.tube([[sd * .13, .155, .002], [sd * x, y, .002]], 4, 4, () => .006), blue, null, null, null, { tint: '#2a7ae0', ink: 0 });
      });
    }
    // the tail: out behind it and round to its left, curling up, with spikes along the top and the droplet that never dries
    const tail = C.part('tail', null, [0, .1, -.16]);
    const TP = [[0, .02, .06], [0, -.03, -.05], [.06, -.05, -.15], [.15, -.02, -.2], [.21, .08, -.2], [.22, .2, -.16], [.2, .28, -.12]];
    C.build(tail, (b) => {
      b.add(K.tube(TP, 22, 12, (t) => .068 * (1 - .75 * t) + .008), blue, null, null, null, { tint: (v, n) => K.rgb(n.y < -.35 ? MINT : n.y > .4 ? B3 : B1) });
      const cv = new THREE.CatmullRomCurve3(TP.map((p) => new THREE.Vector3(...p)));
      for (let i = 1; i < 7; i++) { const t = .1 + i * .11, p = cv.getPointAt(t), tg = cv.getTangentAt(t); const up = new THREE.Vector3(0, 1, 0).addScaledVector(tg, -tg.y).normalize(); const r = .068 * (1 - .75 * t) + .008; b.add(new THREE.ConeGeometry(.016, .04, 8), mint, [p.x + up.x * r, p.y + up.y * r, p.z + up.z * r], K.qDir([0, 1, 0], [up.x - tg.x * .5, up.y - tg.y * .5, up.z - tg.z * .5]), null, { tint: '#3fc8ea', ink: .5 }); }
    });
    const drop = C.part('drop', tail, [.2, .33, -.11]);
    drop.scale.setScalar(1.35); drop.userData.rest.s.setScalar(1.35);
    C.build(drop, (b) => b.add(K.lathe([[0, .085], [.016, .06], [.04, .02], [.044, -.01], [.032, -.038], [0, -.048]], 18), drip, null, [0, 0, .25], null, { tint: (v, n) => K.rgb(n.y > .35 || (n.x < -.4 && v.y > 0) ? '#e4f8ff' : n.y > -.2 ? '#62c8f8' : '#2a8ae8') }));
    C.glow(drop, [-.012, .01, .03], '#9ae0ff', .07);
  },
  idle(C, t, dt, walk) {
    const P = C.parts, f = 1 + walk * 2;
    P.tail.rotation.y = Math.sin(t * 2 * f) * .22; P.tail.rotation.x = Math.sin(t * 1.3) * .05;
    P.drop.rotation.z = Math.sin(t * 3) * .2;
    const flap = Math.sin(t * (walk ? 12 : 3)) * (walk ? .45 : .1);
    P.wingL.rotation.y -= flap; P.wingR.rotation.y += flap;
    P.finL.rotation.y += Math.sin(t * 4.1) * .08; P.finR.rotation.y -= Math.sin(t * 4.1 + 1) * .08;
    P.head.rotation.x = Math.sin(t * 1.1) * .05; P.head.rotation.z = Math.sin(t * .7) * .06; P.head.position.y += Math.sin(t * 2.4) * .006;
  },
  act(C, name, u) {
    const P = C.parts;
    if (name === 'attack' || name === 'cast' || name === 'roar' || name === 'happy' || name === 'puff') { const f = Math.sin(u * 40) * .6 * Math.sin(u * Math.PI); P.wingL.rotation.y -= f; P.wingR.rotation.y += f; }
    if (name === 'spit' || name === 'roar') { const a = Math.sin(Math.min(1, u / .34) * Math.PI / 2) * (1 - Math.min(1, Math.max(0, (u - .34) / .1))), b = u > .3 ? Math.sin(Math.min(1, (u - .3) / .5) * Math.PI) : 0; P.head.rotation.x += -.45 * a + .3 * b; P.head.position.z += .04 * b; P.wingL.rotation.y -= .5 * b; P.wingR.rotation.y += .5 * b; }
    if (name === 'curl') { const k = Math.sin(u * Math.PI); P.wingL.rotation.y += .6 * k; P.wingR.rotation.y -= .6 * k; P.head.rotation.x += .3 * k; }
  },
};

// ---------- Mossback: the sleepy plant turtle (sheet: a big plated shell, a heap of pointed leaves, half-closed eyes) ----------
CREATURE_DEFS.mossback = {
  mouth: [0, -.04, .12], height: .58, eyeY: .17, width: .62,
  build(C, K) {
    const SK = '#8e9a34', SK2 = '#687624', SK3 = '#aab84e', SPOT = '#5c8a28';
    const skin = C.M(), leaf = C.M(), petal = C.M(), nail = C.M(), rim = C.M();
    const skinTint = (v, n) => K.rgb(spotty(v) ? SPOT : n.y > .45 ? SK3 : n.y > -.3 ? SK : SK2);
    // the shell: a high dome of plates, outlined dark brown, lighter at their centres
    const shellSkin = C.paint(512, 256, (g, W, H) => {
      g.fillStyle = '#4a2e22'; g.fillRect(0, 0, W, H);
      const plate = (x, y, w, h) => { g.fillStyle = '#8e6834'; g.beginPath(); g.roundRect ? g.roundRect(x + 3, y + 3, w - 6, h - 6, 10) : g.rect(x + 3, y + 3, w - 6, h - 6); g.fill(); g.fillStyle = '#b08c44'; g.beginPath(); g.ellipse(x + w * .45, y + h * .42, w * .26, h * .24, 0, 0, Math.PI * 2); g.fill(); };
      plate(-10, -10, W + 20, H * .34);
      for (let i = 0; i < 6; i++) plate((i + .5) / 6 * W - W / 12 + 12, H * .34, W / 6, H * .33);
      for (let i = 0; i < 10; i++) plate(i / 10 * W, H * .67, W / 10, H * .33);
    });
    const shell = C.part('shell', null, [0, .11, -.02]);
    C.build(shell, (b) => {
      b.add(K.lathe([[0, .3], [.1, .292], [.18, .255], [.235, .185], [.262, .1], [.27, .02]], 36, { sz: 1.1, sub: 3 }), shellSkin);
      b.add(new THREE.TorusGeometry(.268, .024, 8, 40), rim, [0, .015, 0], [Math.PI / 2, 0, 0], [1, 1.1, 1], { tint: (v, n) => K.rgb(n.y > .3 ? '#c4a050' : '#8e6834') });
      C.ell(b, skin, [0, -.03, 0], [.24, .045, .27], { tint: '#b8b060', ink: .5 });
    });
    // the bush: a dark mound under a heap of pointed leaves, drooping lower at the sides, and one pink flower
    const bush = C.part('bush', shell, [0, .24, -.01]);
    C.build(bush, (b) => {
      C.ell(b, leaf, [0, -.01, 0], [.215, .16, .245], { tint: '#2f5a1e' });
      // leaves in rings from the crown down, each lying along the mound and pointing away from the top, tips lifted
      const leafG = K.slab([[0, 0], [.024, .022], [.032, .052], [.024, .08], [0, .102], [-.024, .08], [-.032, .052], [-.024, .022]], .006, .002);
      const cols = ['#7cc02a', '#68ad24', '#8fd03a', '#5a9a1e', '#9ad640'];
      let sd = 17; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const C0 = [0, -.01, 0], R0 = [.215, .16, .245], up = new THREE.Vector3(0, 1, 0);
      const rings = [[1.45, 1], [1.25, 6], [1.05, 11], [.85, 15], [.65, 19], [.45, 22], [.25, 24], [.05, 26], [-.15, 26]];
      rings.forEach(([el, n], ri) => { for (let i = 0; i < n; i++) {
        const az = (i + (ri % 2) * .5) / n * Math.PI * 2 + (rr() - .5) * .3, e = el + (rr() - .5) * .12;
        const { p, n: nn } = K.onBall(C0, R0, az, e, .002), N = new THREE.Vector3(...nn);
        const down = up.clone().addScaledVector(N, -N.dot(up)).negate(); if (down.lengthSq() < 1e-4) down.set(Math.sin(az), 0, Math.cos(az)); down.normalize();
        const dir = down.clone().addScaledVector(N, .35 + rr() * .2).normalize(); // the tip: downhill, lifted off the mound
        const side = new THREE.Vector3().crossVectors(dir, N).normalize(), face = new THREE.Vector3().crossVectors(side, dir).normalize();
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, dir, face));
        b.add(leafG, leaf, p, q, .95 + rr() * .4, { tint: K.rgb(cols[Math.floor(rr() * cols.length)]), ink: .45 });
      } });
    });
    const flower = C.part('flower', bush, [.07, .165, .07], [0, 0, 0]);
    flower.scale.setScalar(1.6); flower.userData.rest.s.setScalar(1.6);
    C.build(flower, (b) => {
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; C.ell(b, petal, [Math.sin(a) * .022, 0, Math.cos(a) * .022], [.02, .007, .015], { rot: [0, a, 0], tint: '#f6c0bc', ink: .5 }); }
      C.ell(b, petal, [0, .005, 0], [.012, .009, .012], { tint: '#f8c838', ink: .4 });
    });
    // the head: round and mossy, poking out under the front of the shell, sleepy half-closed eyes and a soft smile
    const head = C.part('head', null, [0, .15, .26]);
    C.build(head, (b) => {
      b.add(K.tube([[0, -.03, -.14], [0, -.01, -.08], [0, 0, -.02]], 8, 12, () => .07), skin, null, null, null, { tint: skinTint });
      C.ell(b, skin, [0, .01, .02], [.108, .098, .102], { tint: skinTint });
      C.ell(b, skin, [0, -.035, .06], [.075, .045, .055], { tint: '#b4bc5a', ink: .4 });
      b.add(K.tube([[-.035, -.035, .117], [0, -.048, .122], [.035, -.035, .117]], 8, 6, () => .005), skin, null, null, null, { tint: '#3a3418', ink: 0 });
    });
    C.eyePair(head, [0, .01, .02], [.108, .098, .102], .46, .1, [.038, .042, .014], ['#3a2412', '#7a5230', '#c09060'], { tex: { lid: '#8e9a34', lidK: .48 }, fwd: .2 });
    for (const [nm, x, z] of [['legFR', -.18, .15], ['legFL', .18, .15], ['legBR', -.18, -.17], ['legBL', .18, -.17]]) {
      const lg = C.part(nm, null, [x, .08, z]);
      C.build(lg, (b) => {
        b.add(K.lathe([[0, .035], [.06, .02], [.062, -.04], [.068, -.07], [0, -.08]], 14), skin, null, null, null, { tint: skinTint });
        for (const d of [-1.5, -.5, .5, 1.5]) C.ell(b, nail, [d * .022, -.072, .056], [.012, .011, .012], { tint: '#f2e2a8', ink: .4 });
      });
    }
    const tail = C.part('tail', null, [0, .07, -.3]);
    C.build(tail, (b) => b.add(new THREE.ConeGeometry(.032, .09, 10), skin, [0, 0, -.03], [-1.75, 0, 0], null, { tint: SK }));
  },
  idle(C, t, dt, walk) {
    const P = C.parts;
    P.head.position.z += Math.sin(t * .9) * .008; P.head.rotation.x = Math.sin(t * .9) * .05; P.head.rotation.y = Math.sin(t * .4) * .12;
    P.bush.rotation.z = Math.sin(t * 1.3) * .025; P.flower.rotation.y = t * .3; P.flower.rotation.z = Math.sin(t * 2) * .1;
    if (walk) { const s = Math.sin(t * 10); P.legFR.rotation.x = s * .4; P.legBL.rotation.x = s * .4; P.legFL.rotation.x = -s * .4; P.legBR.rotation.x = -s * .4; }
  },
  act(C, name, u) {
    const P = C.parts;
    if (name === 'attack') P.head.position.z += Math.sin(u * Math.PI) * .06;
    if (name === 'hit') P.head.position.z -= Math.sin(u * Math.PI) * .07;
    if (name === 'spit' || name === 'chomp') { const b = u > .3 ? Math.sin(Math.min(1, (u - .3) / .5) * Math.PI) : -Math.sin(u / .3 * Math.PI / 2) * .5; P.head.position.z += .07 * b; P.head.rotation.x -= .15 * Math.max(0, -b); }
    if (name === 'curl' || name === 'tuck') { const k = name === 'tuck' ? Math.min(1, u * 3) : Math.sin(Math.min(1, u * 1.25) * Math.PI / 2) * (1 - Math.max(0, (u - .8) / .2)); P.head.position.z -= .13 * k; P.head.position.y -= .03 * k; P.head.scale.multiplyScalar(1 - .35 * k); for (const l of ['legFR', 'legFL', 'legBR', 'legBL']) { P[l].scale.y *= 1 - .7 * k; P[l].position.y += .03 * k; } P.tail.scale.multiplyScalar(1 - .8 * k); }
    if (name === 'puff' || name === 'happy') { P.bush.scale.multiplyScalar(1 + .15 * Math.sin(u * Math.PI)); P.flower.rotation.y += u * 12; }
  },
};

// ---------- Embroak: the cheeky fire frog (sheet: sitting up, yellow-ringed eyes on top, flames up its back) ----------
CREATURE_DEFS.embroak = {
  height: .44, eyeY: .38, width: .58, hopper: true, mouth: [0, -.04, .13], mouthPart: 'ember',
  build(C, K) {
    const O = '#fa5e12', O2 = '#cf2a1a', O3 = '#ff8a2a', Y = '#fee019', BEL = '#fde46a';
    const skin = C.M(), belly = C.M(), tongue = C.M(), dark = C.M();
    const flameSkin = (belly_) => C.paint(512, 256, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, O3); gr.addColorStop(.4, O); gr.addColorStop(1, O2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (belly_) { g.fillStyle = BEL; g.beginPath(); g.ellipse(.25 * W, .7 * H, .13 * W, .42 * H, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff09a'; g.beginPath(); g.ellipse(.24 * W, .62 * H, .06 * W, .2 * H, 0, 0, Math.PI * 2); g.fill(); }
      // flames up the back and sides, yellow with orange hearts
      CPAINT.flame(g, .75 * W, .85 * H, .08 * H, .07 * W, Y, '#ff9a20');
      for (const [u, yb, yt, w] of [[.64, .9, .3, .045], [.86, .9, .3, .045], [.55, .95, .55, .035], [.95, .95, .55, .035], [.02, .9, .6, .03], [.48, .9, .6, .03]]) CPAINT.wrap(g, W, (o) => CPAINT.flame(g, u * W + o, yb * H, yt * H, w * W, Y, '#ff9a20'));
    });
    const bodySkin = flameSkin(true), legSkin = flameSkin(false);
    const body = C.part('body', null, [0, .15, -.03], [-.18, 0, 0]);
    C.build(body, (b) => {
      C.ell(b, bodySkin, [0, 0, 0], [.16, .15, .15]);
    });
    const throat = C.part('throat', body, [0, .02, .13]);
    C.build(throat, (b) => C.ell(b, belly, [0, 0, 0], [.085, .055, .04], { tint: '#fff0a8', ink: .4 }));
    // the head: wide and flat, the eyes up on top in yellow rings, a yellow flame mark between them, a wide grin
    const head = C.part('head', null, [0, .29, .07]);
    C.build(head, (b) => {
      C.ell(b, skin, [0, 0, 0], [.16, .095, .13], { tint: (v, n) => K.rgb(n.y > .55 ? O3 : n.y > -.3 ? O : O2) });
      for (const sd of [-1, 1]) C.ell(b, skin, [sd * .085, .07, .03], [.066, .062, .062], { tint: (v, n) => K.rgb(n.y > .4 ? O3 : O) });
      b.add(new THREE.OctahedronGeometry(1, 0), dark, [0, .085, .1], [-.9, 0, 0], [.018, .03, .008], { tint: Y, ink: .4 });
      b.add(K.tube([[-.13, -.015, .075], [-.07, -.035, .113], [0, -.042, .124], [.07, -.035, .113], [.13, -.015, .075]], 16, 6, () => .007), dark, null, null, null, { tint: '#4a0a0a', ink: 0 });
      C.ell(b, tongue, [-.075, -.04, .108], [.035, .018, .02], { tint: '#7a1a2a', ink: 0 });
    });
    C.eyePair(head, [0, .07, .03], [.14, .062, .066], .62, .3, [.054, .058, .022], ['#2a0a05', '#6a2a10', '#a04a1a'], { tex: { white: '#fde762', rx: 34, ry: 42 }, fwd: .35 });
    // the tongue, out of the corner of its mouth, with the ember on the tip
    const tng = C.part('tongue', head, [-.075, -.042, .112]);
    C.build(tng, (b) => b.add(K.tube([[0, 0, 0], [-.05, -.012, .035], [-.11, -.006, .05], [-.16, .02, .04]], 12, 8, (t) => .017 * (1 - .3 * t) + .004, .5), tongue, null, null, null, { tint: '#ec6a7a' }));
    const ember = C.part('ember', tng, [-.175, .04, .04]);
    C.build(ember, (b) => {
      b.add(K.lathe([[0, .045], [.009, .03], [.023, .008], [.025, -.009], [.016, -.021], [0, -.025]], 14), C.M('#ffffff', { mat: { emissive: new THREE.Color('#ff8a10'), emissiveIntensity: .9 } }), null, null, null, { tint: (v) => K.rgb(v.y > .015 ? '#ffe070' : '#ffb030'), ink: .3 });
    });
    C.glow(ember, [0, 0, 0], '#ffb040', .14); C.glow(ember, [0, .005, 0], '#ffffff', .05);
    const L = new THREE.PointLight('#ff8a2a', .6, 1.2, 2); L.userData.base = .6; ember.add(L); C.lights.push(L);
    for (const sd of [-1, 1]) {
      // front legs, straight down, toes splayed
      const f = C.part(sd < 0 ? 'armR' : 'armL', null, [sd * .1, .12, .1]);
      C.build(f, (b) => {
        b.add(K.tube([[0, .03, -.02], [sd * .015, -.04, .02], [sd * .025, -.11, .03]], 8, 10, () => .032), skin, null, null, null, { tint: (v, n) => K.rgb(n.y > .2 ? O3 : O) });
        for (const d of [-1.5, -.5, .5, 1.5]) b.add(K.tube([[sd * .025, -.115, .035], [sd * .025 + d * .02, -.118, .06 + (1.5 - Math.abs(d)) * .008]], 3, 6, () => .009), skin, null, null, null, { tint: O3 });
      });
      // the big hind legs, folded at its sides, flames on the thighs, long splayed toes
      const h = C.part(sd < 0 ? 'hipR' : 'hipL', null, [sd * .155, .09, -.06]);
      C.build(h, (b) => {
        C.ell(b, legSkin, [0, 0, 0], [.07, .085, .11], { rot: [-.35, 0, 0] });
        C.ell(b, skin, [sd * .02, -.072, .07], [.045, .022, .09], { tint: O });
        for (const d of [-1.5, -.5, .5, 1.5]) b.add(K.tube([[sd * .02 + d * .012, -.085, .12], [sd * .02 + d * .03, -.088, .17 + (1.5 - Math.abs(d)) * .012]], 3, 6, () => .009), skin, null, null, null, { tint: O3 });
      });
    }
  },
  idle(C, t, dt, walk) {
    const P = C.parts;
    const g = Math.max(0, Math.sin(t * 3.2)); P.throat.scale.set(1 + g * .35, 1 + g * .45, 1 + g * .5);
    P.tongue.rotation.y = Math.sin(t * 1.7) * .12; P.tongue.rotation.z = Math.sin(t * 2.3) * .08;
    P.head.rotation.z = Math.sin(t * .8) * .05;
  },
  act(C, name, u) {
    const P = C.parts;
    if (name === 'attack' || name === 'cast' || name === 'spin') { P.hipL.rotation.x = -Math.sin(u * Math.PI) * .6; P.hipR.rotation.x = -Math.sin(u * Math.PI) * .6; }
    if (name === 'flick' || name === 'spit') { // wind the tongue back, then lash it straight out in front, three times as long
      const a = Math.min(1, u / .3) * (1 - Math.min(1, Math.max(0, (u - .3) / .06))), b = u > .3 ? Math.min(1, (u - .3) / .06) * (1 - Math.min(1, Math.max(0, (u - .55) / .4))) : 0;
      P.tongue.rotation.y += -.5 * a + 1.45 * b; P.tongue.rotation.z += .3 * a - .15 * b; P.tongue.scale.x *= 1 + 2.2 * b; P.ember.scale.multiplyScalar(1 + .6 * b);
      P.throat.scale.multiplyScalar(1 + .3 * a);
    }
    if (name === 'puff') { const k = Math.sin(u * Math.PI); P.throat.scale.multiplyScalar(1 + 1.2 * k); }
  },
};

// ---------- Clovermouse (sheet: sitting up, very big round ears, a green beanie with a four-leaf clover on top) ----------
CREATURE_DEFS.clovermouse = {
  height: .6, eyeY: .43, width: .42, mouth: [0, -.055, .125],
  build(C, K) {
    const fur = C.M(), pink = C.M(), clover = C.M(), cream = C.M(), dark = C.M();
    const F = '#aa9c94', F2 = '#857670', F3 = '#c6bab2', PK = '#f4a99d';
    const furTint = (v, n) => K.rgb(n.y > .45 ? F3 : n.y > -.3 ? F : F2);
    const body = C.part('body', null, [0, 0, 0]);
    C.build(body, (b) => {
      b.add(K.lathe([[0, .3], [.07, .29], [.115, .24], [.135, .16], [.135, .085], [.115, .03], [.065, .005], [0, 0]], 24, { sz: .9 }), fur, null, null, null, { tint: furTint });
      C.ell(b, cream, [0, .13, .065], [.088, .11, .065], { tint: '#f2e6d4', ink: .5 });
      for (const sd of [-1, 1]) { C.ell(b, pink, [sd * .06, .02, .075], [.042, .022, .055], { tint: PK }); for (const d of [-1, 0, 1]) C.ell(b, pink, [sd * .06 + d * .016, .015, .125], [.01, .009, .01], { tint: '#f8c0b8', ink: .3 }); }
    });
    const paws = C.part('paws', body, [0, .21, .095]);
    C.build(paws, (b) => { for (const sd of [-1, 1]) C.ell(b, pink, [sd * .035, 0, .01], [.024, .024, .022], { tint: PK, ink: .4 }); });
    const head = C.part('head', null, [0, .38, .01]);
    C.build(head, (b) => {
      C.ell(b, fur, [0, 0, 0], [.142, .124, .12], { tint: furTint });
      C.ell(b, cream, [0, -.04, .07], [.07, .048, .055], { tint: '#f6ecdc', ink: .4 });
      C.ell(b, pink, [0, -.018, .118], [.018, .014, .014], { tint: '#f07a90', ink: .4 });
      b.add(K.tube([[-.018, -.05, .115], [-.008, -.058, .121], [0, -.052, .124], [.008, -.058, .121], [.018, -.05, .115]], 8, 5, () => .0035), dark, null, null, null, { tint: '#5a3030', ink: 0 });
      for (const sd of [-1, 1]) C.ell(b, pink, [sd * .074, -.04, .088], [.024, .015, .008], { tint: '#f4949a', ink: 0, rot: [0, sd * .7, 0] });
    });
    // the ears: very big and round, grey with pink insides, high on either side of the hat
    for (const sd of [-1, 1]) {
      const ear = C.part(sd < 0 ? 'earR' : 'earL', head, [sd * .13, .07, -.03], [0, sd * -.25, sd * -.4]);
      C.build(ear, (b) => {
        b.add(new THREE.CylinderGeometry(.088, .088, .022, 28), fur, [sd * .03, .05, 0], [Math.PI / 2, 0, 0], null, { tint: F });
        b.add(new THREE.CylinderGeometry(.062, .062, .01, 28), pink, [sd * .032, .048, .013], [Math.PI / 2, 0, 0], null, { tint: '#f39a9a', ink: .3 });
      });
    }
    C.eyePair(head, [0, 0, 0], [.142, .124, .12], .38, .0, [.047, .06, .017], ['#0e4a1a', '#3a9a3a', '#a0e8a0'], { fwd: .3 });
    // the hat: a green beanie over the top of the head, with a four-leaf clover lying on top
    const hat = C.part('hat', head, [0, .025, -.012], [-.12, 0, 0]);
    C.build(hat, (b) => {
      b.add(new THREE.SphereGeometry(.13, 26, 12, 0, Math.PI * 2, 0, Math.PI * .47), clover, [0, 0, 0], null, [1.06, 1.0, 1.0], { tint: (v, n) => K.rgb(n.y > .7 ? '#78b83a' : '#5f9a30') });
      b.add(new THREE.TorusGeometry(.135, .013, 6, 28), clover, [0, .012, 0], [Math.PI / 2, 0, 0], [1.04, 1.0, 1], { tint: '#4a7e26', ink: .5 });
    });
    const clv = C.part('clover', hat, [0, .1, .045], [.75, 0, 0]);
    C.build(clv, (b) => {
      const heart = K.slab([[0, 0], [.03, .03], [.046, .06], [.036, .082], [.015, .087], [0, .072], [-.015, .087], [-.036, .082], [-.046, .06], [-.03, .03]], .012, .004);
      for (let i = 0; i < 4; i++) { const az = i / 4 * Math.PI * 2 + Math.PI / 4; b.add(heart, clover, [Math.sin(az) * .004, 0, Math.cos(az) * .004], [-Math.PI / 2 + .12, az + Math.PI, 0, 'YXZ'], [1.25, 1.25, 1.25], { tint: (v) => K.rgb(Math.abs(v.x * Math.cos(az) - v.z * Math.sin(az)) < .006 ? '#5a9a2e' : '#90cb3f') }); }
      C.ell(b, clover, [0, .006, 0], [.016, .01, .016], { tint: '#4a8a2a', ink: .4 });
    });
    // the tail: back, round to its right, then up in an S with a curl at the top
    const tail = C.part('tail', null, [0, .03, -.1]);
    C.build(tail, (b) => b.add(K.tube([[0, 0, 0], [-.05, -.01, -.08], [-.13, .03, -.11], [-.17, .12, -.08], [-.15, .21, -.05], [-.1, .24, -.05], [-.085, .2, -.05], [-.11, .185, -.05]], 30, 8, (t) => .015 * (1 - .5 * t) + .004), pink, null, null, null, { tint: PK }));
  },
  idle(C, t, dt, walk) {
    const P = C.parts;
    P.tail.rotation.y = Math.sin(t * 1.8) * .25; P.tail.rotation.z = Math.sin(t * 1.1) * .08;
    const tw = Math.pow(Math.max(0, Math.sin(t * 1.3)), 20); P.earL.rotation.z -= tw * .3; P.earR.rotation.z += Math.pow(Math.max(0, Math.sin(t * 1.1 + 2)), 20) * .3;
    P.head.rotation.z = Math.sin(t * .9) * .07; P.head.rotation.x = Math.sin(t * 6) * .01;
    P.hat.rotation.z = Math.sin(t * 1.4) * .04; P.paws.position.y += Math.sin(t * 8) * .003;
  },
  act(C, name, u) {
    const P = C.parts;
    if (name === 'attack' || name === 'chomp') { P.paws.position.z += Math.sin(u * Math.PI) * .05; P.head.position.z += Math.abs(Math.sin(u * Math.PI * 4)) * .03 * (1 - u); }
    if (name === 'spit' || name === 'roar') { const b = Math.sin(u * Math.PI); P.head.rotation.x -= .2 * b; P.earL.rotation.z -= .3 * b; P.earR.rotation.z += .3 * b; }
    if (name === 'puff' || name === 'happy') { const b = Math.sin(u * Math.PI); P.earL.rotation.z -= .4 * b; P.earR.rotation.z += .4 * b; P.hat.position.y += .03 * b; }
  },
};

// ---------- Hopsprout (sheet: the body lies level, a big round head, wings along its back, tall bent hind legs) ----------
CREATURE_DEFS.hopsprout = {
  height: .46, eyeY: .27, width: .5, hopper: true, mouth: [0, -.07, .1],
  build(C, K) {
    const lime = C.M(), leaf = C.M(), wing = C.M(), dark = C.M();
    const L1 = '#8bd424', L2 = '#3e8e22', L3 = '#c8f42a', PALE = '#eefcb0';
    const limeTint = (v, n) => K.rgb(n.y > .4 ? L3 : n.y > -.35 ? L1 : L2);
    const body = C.part('body', null, [0, 0, 0]);
    C.build(body, (b) => {
      C.ell(b, lime, [0, .18, .03], [.07, .068, .072], { tint: limeTint });
      const AB = [[0, .185, -.02], [0, .17, -.13], [0, .145, -.26], [0, .125, -.34]];
      b.add(K.tube(AB, 20, 14, (t) => .068 * (1 - .55 * t * t) + .012), lime, null, null, null, { tint: (v, n) => { const s = Math.floor(-v.z * 26) % 2; return K.rgb(n.y < -.4 ? PALE : n.y > .3 ? (s ? L3 : L1) : s ? L1 : L2); } });
      C.ell(b, lime, [0, .125, -.342], [.026, .026, .022], { tint: L1 });
    });
    const wings = C.part('wings', body, [0, .235, -.02]);
    C.build(wings, (b) => { for (const sd of [-1, 1]) { const w = K.slab([[0, 0], [.03, -.05], [.034, -.2], [.022, -.33], [0, -.36], [-.012, -.2], [-.008, -.05]], .007, .003); b.add(w, wing, [sd * .025, 0, 0], [Math.PI / 2 - .14, 0, sd * -.38], [sd, 1, 1], { tint: (v) => K.rgb(Math.abs(Math.abs(v.x) - .03) < .008 ? '#c8f080' : PALE) }); } });
    const head = C.part('head', null, [0, .25, .13]);
    C.build(head, (b) => {
      C.ell(b, lime, [0, 0, 0], [.11, .105, .1], { tint: limeTint });
      C.ell(b, lime, [0, -.055, .05], [.064, .044, .052], { tint: L3 });
      b.add(K.tube([[-.03, -.064, .094], [0, -.078, .1], [.03, -.064, .094]], 8, 5, () => .0045), dark, null, null, null, { tint: '#1e4a12', ink: 0 });
      b.add(K.tube([[0, .095, 0], [0, .14, .008], [0, .175, 0]], 6, 6, () => .009), leaf, null, null, null, { tint: '#3e8a2a', ink: .5 });
      for (const sd of [-1, 1]) b.add(K.slab([[0, 0], [.025, .024], [.058, .028], [.074, .01], [.058, -.01], [.025, -.012]], .008, .003), leaf, [0, .175, 0], [0, 0, sd * .45], [sd, 1, 1], { tint: (v) => K.rgb(Math.abs(v.y - .178) < .003 ? '#3e8a2a' : '#78d24a') });
    });
    C.eyePair(head, [0, 0, 0], [.11, .105, .1], .56, .1, [.052, .066, .022], ['#02200f', '#0c4a1f', '#1e6a2a'], { fwd: .1 });
    for (const sd of [-1, 1]) {
      const an = C.part(sd < 0 ? 'antR' : 'antL', head, [sd * .035, .085, .06]);
      C.build(an, (b) => { b.add(K.tube([[0, 0, 0], [sd * .02, .1, .03], [sd * .06, .2, .02], [sd * .11, .27, -.02]], 16, 5, (t) => .008 * (1 - .5 * t) + .002), lime, null, null, null, { tint: L2, ink: .6 }); C.ell(b, lime, [sd * .112, .272, -.022], [.011, .011, .011], { tint: L3, ink: .5 }); });
      // four front legs, each bent out at the knee
      for (const [j, z, fz] of [[0, .07, .11], [1, -.0, -.02]]) {
        const lg = C.part('leg' + j + (sd < 0 ? 'R' : 'L'), null, [sd * .05, .16, z]);
        C.build(lg, (b) => { b.add(K.tube([[0, 0, 0], [sd * .07, .035, (fz - z) * .3], [sd * .11, .03, (fz - z) * .6], [sd * .13, -.06, fz - z], [sd * .14, -.145, fz - z + .01]], 14, 6, (t) => .014 * (1 - .4 * t) + .003), lime, null, null, null, { tint: L1, ink: .6 }); C.ell(b, lime, [sd * .14, -.15, fz - z + .025], [.014, .008, .022], { tint: L2, ink: .4 }); });
      }
      // the big hind leg: a thick striped thigh up and back to a high knee, the thin shin down to the ground behind
      const h = C.part(sd < 0 ? 'hindR' : 'hindL', null, [sd * .07, .16, -.06]);
      C.build(h, (b) => {
        b.add(K.tube([[0, -.01, .03], [sd * .035, .07, -.08], [sd * .055, .15, -.2], [sd * .06, .18, -.25]], 16, 12, (t) => .046 * (1 - .6 * t) + .008, .8), lime, null, null, null, { tint: (v, n) => K.rgb(n.x * sd > .55 && n.y > -.2 ? PALE : n.y > .3 ? L3 : L1) });
        C.ell(b, lime, [sd * .06, .18, -.25], [.02, .02, .02], { tint: L1, ink: .5 });
        b.add(K.tube([[sd * .06, .18, -.25], [sd * .07, .08, -.27], [sd * .075, -.05, -.28], [sd * .075, -.15, -.26]], 14, 6, (t) => .015 * (1 - .3 * t) + .003), lime, null, null, null, { tint: L2, ink: .6 });
        C.ell(b, lime, [sd * .075, -.155, -.235], [.018, .01, .032], { tint: L2, ink: .5 });
      });
    }
  },
  idle(C, t, dt, walk) {
    const P = C.parts;
    P.antL.rotation.z = Math.sin(t * 2.1) * .15; P.antR.rotation.z = -Math.sin(t * 2.4 + 1) * .15; P.antL.rotation.x = Math.sin(t * 1.3) * .1; P.antR.rotation.x = Math.sin(t * 1.5) * .1;
    P.head.rotation.z = Math.sin(t * .8) * .07; P.wings.rotation.x = Math.sin(t * 9) * .02;
  },
  act(C, name, u) {
    const P = C.parts;
    if (name === 'attack' || name === 'hop' || name === 'happy' || name === 'spin') { const k = Math.sin(u * Math.PI); P.hindL.rotation.x = -k * .7; P.hindR.rotation.x = -k * .7; P.wings.rotation.x = -k * .5; }
    if (name === 'crouch') { const k = Math.min(1, u * 2); P.hindL.rotation.x = .35 * k; P.hindR.rotation.x = .35 * k; }
    if (name === 'tuck') { P.hindL.rotation.x = -1.1; P.hindR.rotation.x = -1.1; P.wings.rotation.x = -.7; P.antL.rotation.x -= .4; P.antR.rotation.x -= .4; }
    if (name === 'spit' || name === 'chomp') { const b = Math.sin(u * Math.PI); P.head.position.z += .05 * b; P.antL.rotation.x += .5 * b; P.antR.rotation.x += .5 * b; }
  },
};

// ---------- the capture cube (sheet: purple top with a lighter top face, a glowing white seam, a round button
// straddling the seam at the front, a hinge at the back; the lid tips up and white light pours out) ----------
function makeCube(kind) {
  const { rgb } = KIT;
  const root = new THREE.Group(), spin = new THREE.Group(); root.add(spin);
  const ink = KIT.inkMat(), top = KIT.toon('#ffffff'), bot = KIT.toon('#ffffff'), band = KIT.toon('#ffffff');
  const seamM = new THREE.MeshBasicMaterial({ color: '#e7f6fd' }), btnM = KIT.toon('#ffffff', { mat: { emissive: new THREE.Color('#c8d8ff'), emissiveIntensity: .25 } });
  const S = .3, R = .05, H = S / 2;
  const cut = (g, upper) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, upper ? Math.max(y, .006) : Math.min(y, -.006)); } g.computeVertexNormals(); return g; };
  const lid = new THREE.Group(); lid.position.set(0, 0, -H); spin.add(lid);
  const bB = KIT.builder();
  bB.add(cut(KIT.rbox(S, S, S, R, 3), false), bot, [0, 0, 0], null, null, { tint: (v, n) => rgb(n.y < -.5 ? '#0a4ad0' : n.x > .6 || n.z > .6 ? '#1a96fc' : '#0184fc') });
  bB.add(new THREE.CylinderGeometry(.052, .052, .02, 24), band, [0, -.003, H + .004], [Math.PI / 2, 0, 0], null, { tint: '#1d095f', ink: .5 });
  bB.add(new THREE.CylinderGeometry(.016, .016, S * .5, 10), band, [0, .0, -H - .008], [0, 0, Math.PI / 2], null, { tint: '#2a2a6a', ink: .5 });
  bB.build(spin, ink);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(S - .02, .012, S - .02), seamM); spin.add(seam);
  const bt = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .016, 24), btnM); bt.rotation.x = Math.PI / 2; bt.position.set(0, 0, H + .014); spin.add(bt);
  const btg = bt.geometry; btg.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(btg.attributes.position.count * 3).fill(1).map((_, i) => rgb('#d8e0ff')[i % 3]), 3)); btnM.vertexColors = true;
  const tB = KIT.builder();
  tB.add(cut(KIT.rbox(S, S, S, R, 3), true), top, [0, 0, H], null, null, { tint: (v, n) => rgb(n.y > .6 ? '#d06af8' : n.x > .6 || n.z > .6 ? '#c030f8' : '#b021f0') });
  tB.build(lid, ink);
  const glowM = new THREE.MeshBasicMaterial({ color: '#fff8e0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(S * .85, S * .85), glowM); inner.rotation.x = -Math.PI / 2; inner.position.y = .008; spin.add(inner);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#fff0c8', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); halo.scale.setScalar(1.2); halo.position.y = .1; spin.add(halo);
  root.traverse((o) => { if (o.isMesh && o.material !== glowM) o.castShadow = true; });
  return {
    root, spin, lid,
    set open(k) { lid.rotation.x = -k * 1.9; glowM.opacity = Math.min(1, k * 1.2); halo.material.opacity = k * .9; },
    set button(k) { btnM.emissiveIntensity = .25 + k * 1.2; },
    set glow(k) { halo.material.opacity = k; btnM.emissiveIntensity = .25 + k; },
  };
}
