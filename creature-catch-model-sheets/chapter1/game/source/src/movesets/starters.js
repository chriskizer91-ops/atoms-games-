// movesets/starters.js: the Earth moves Elderoak and Infernotoad learn (and the Pebblepup line too): Pebble Toss (a rock
// pulled out of the ground and thrown), Dust Cloud (dust scraped up and kicked at the target, lowering its accuracy) and
// Quake Stomp (it rears up and slams down; the ground cracks across to the target and rocks burst up under it).
// Two body actions any creature can play: dustkick (two scrapes and a forward fling) and quakestomp (rear up, slam down).
CREATURE_ACTIONS.dustkick = { dur: .8, hit: .55, f(u, o) {
  const sm = KIT.sm, scr = u < .46 ? Math.abs(Math.sin(u / .46 * Math.PI * 2)) : 0, kick = sm(.46, .55, u) * (1 - sm(.62, 1, u));
  o.rx = .12 * scr + .16 * kick; o.z = -.035 * scr + .07 * kick; o.sy = 1 - .05 * scr - .03 * kick; o.sx = o.sz = 1 + .03 * scr;
} };
CREATURE_ACTIONS.quakestomp = { dur: 1.0, hit: .5, f(u, o) {
  const sm = KIT.sm, up = sm(0, .42, u) * (1 - sm(.42, .5, u)), slam = sm(.44, .5, u) * (1 - sm(.56, 1, u));
  o.rx = -.3 * up + .08 * slam; o.y = .09 * up; o.z = -.03 * up + .03 * slam;
  o.sy = 1 + .1 * up - .2 * slam; o.sx = o.sz = 1 - .03 * up + .12 * slam; o.rz = .035 * Math.sin(u * 55) * slam;
} };

(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const E = () => DATA.TYPE_COLORS.Earth; // light, mid, dark
  // a faceted rock: a dodecahedron (or a spike: a cone) pushed about, flat shaded, light on top
  function rockGeo(r, seed, spike) {
    let g = spike ? new THREE.ConeGeometry(r, r * spike, 6, 2) : new THREE.DodecahedronGeometry(r, 0);
    g.deleteAttribute('normal'); g = KIT.mergeVerts(g);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .22 * Math.sin(x * 7.1 / r + seed) * Math.sin(y * 5.3 / r + seed * 2) * Math.sin(z * 6.7 / r + seed * 3); p.setXYZ(i, x * k, spike && y > r * spike * .45 ? y : y * k, z * k); }
    g = g.toNonIndexed(); g.computeVertexNormals(); return g;
  }
  const rockTint = (top) => (v, n) => KIT.rgb(n.y > .45 ? E()[0] : n.y > -.3 ? (top !== undefined && v.y > top ? E()[0] : E()[1]) : E()[2]);
  const rock = (h, r, seed, spike) => h.solid((B) => B.add(rockGeo(r, seed || 1, spike), h.toon('#ffffff'), [0, 0, 0], null, null, { tint: rockTint(spike ? r * spike * .3 : undefined) }));
  // chips of rock flying out of a spot and bouncing to rest, then gone
  function chips(h, at, n, size, speed) {
    const list = [];
    for (let i = 0; i < n; i++) { const c = rock(h, size * G.rand(.5, 1), i * 1.9 + 1), a = Math.random() * TAU, sp = speed * G.rand(.5, 1); c.position.copy(at); list.push({ c, v: h.V(Math.cos(a) * sp, G.rand(.6, 1.2) * speed, Math.sin(a) * sp), s: h.V(G.rand(-9, 9), G.rand(-9, 9), G.rand(-9, 9)), life: G.rand(.6, .9) }); }
    const stop = h.every((dt) => { for (const q of list) { if (q.life <= 0) continue; q.life -= dt; q.v.y -= 260 * dt; q.c.position.addScaledVector(q.v, dt); if (q.c.position.y < size * .5) { q.c.position.y = size * .5; q.v.y *= -.3; q.v.x *= .6; q.v.z *= .6; } q.c.rotation.x += q.s.x * dt; q.c.rotation.z += q.s.z * dt; if (q.life < .2) q.c.scale.setScalar(Math.max(.01, q.life / .2)); if (q.life <= 0) h.drop(q.c); } if (list.every((q) => q.life <= 0)) stop(); });
  }
  const dustAt = (h, at, n, o) => h.fx.burst('dust', at, n, Object.assign({ speed: 60, colors: [E()[0], E()[1], '#d8c8a0'], size: 9, g: 90, spread: 10, up: .5, life: .7 }, o || {}));

  // ---------- Pebble Toss: it rears up as a rock pops out of the ground in front of it, then throws it in an arc ----------
  MOVES3D.define('pebbletoss', (h) => async (u, t) => {
    const d = h.flat(u.home, t.home), Hu = h.H(u), start = u.model.root.position.clone().addScaledVector(d, Hu * .55).setY(0);
    const r = rock(h, Math.max(4.5, Hu * .13), 3); r.position.copy(start); r.scale.setScalar(.3);
    CC.sfx('bump'); dustAt(h, start, 8, { speed: 40 });
    u.model.play('cast');
    const lift = h.center(u, .95).addScaledVector(d, Hu * .35);
    await G.tween(.34, (k) => { r.position.lerpVectors(start, lift, G.easeOut(k)); r.rotation.x += G.dt * 5; r.scale.setScalar(.3 + .7 * G.easeOut(k)); });
    CC.sfx('throw');
    const to = h.center(t, .5);
    await h.throwIt(r, lift.clone(), to, .32, 16, [10, 4, 7], (p) => { if (Math.random() < .6) h.fx.emit({ x: p.x, y: p.y, z: p.z, life: .35, size: G.rand(5, 8), shape: 'dust', color: G.pick(E()), vy: 10 }); });
    h.drop(r);
    chips(h, to, 6, Math.max(2, Hu * .05), 60); dustAt(h, to, 14, { g: 160, speed: 70 });
  });

  // ---------- Dust Cloud: two scrapes at the ground and a fling; a cloud of dust rolls over the target and hangs there ----------
  MOVES3D.define('dustcloud', (h) => async (u, t) => {
    const d = h.flat(u.home, t.home), Hu = h.H(u), feet = () => u.model.root.position.clone().addScaledVector(d, Hu * .35).setY(2);
    const p = h.act(u, 'dustkick'); CC.sfx('rustle');
    for (const w of [.1, .3]) setTimeout(() => dustAt(h, feet(), 6, { speed: 30, up: .7 }), w * 1000);
    await p; CC.sfx('shoot');
    const from = feet().add(h.V(0, Hu * .15, 0)), to = h.center(t, .45), c = h.cloud(from, { color: '#c8a878', size: Math.max(8, h.H(t) * .24), n: 12, w: 2.6, h: 1 });
    const motes = h.every(() => { if (Math.random() < .8) h.fx.emit({ x: c.g.position.x + G.rand(-14, 14), y: c.g.position.y + G.rand(-8, 8), z: c.g.position.z + G.rand(-10, 10), vx: G.rand(-14, 14), vy: G.rand(-4, 14), life: .6, size: G.rand(5, 9), shape: 'dust', color: G.pick([E()[0], E()[1], '#e8dcc0']) }); });
    await G.tween(.5, (k) => { c.g.position.lerpVectors(from, to, G.ease(k)); c.g.position.y += Math.sin(k * PI) * 10; c.op = .9 * Math.min(1, k * 4); c.g.scale.setScalar(.3 + 1.1 * k); c.g.rotation.y += G.dt * 1.5; });
    t.model.play('shake');
    return async () => { await G.tween(.55, (k) => { c.op = .9 * (1 - k); c.g.scale.setScalar(1.4 + .4 * k); c.g.position.y += G.dt * 8; }); motes(); c.done(); };
  });

  // ---------- Quake Stomp: it rears up and slams down; cracks race across the ground and rocks burst up under the target ----------
  MOVES3D.define('quakestomp', (h) => async (u, t) => {
    const Hu = h.H(u), Ht = h.H(t), a = u.model.root.position.clone().setY(0), b = t.model.root.position.clone().setY(0), d = h.flat(a, b), sd = h.sideOf(d);
    CC.sfx('throw');
    await h.act(u, 'quakestomp');
    CC.sfx('superhit'); h.env.shake(8);
    dustAt(h, a.clone().addScaledVector(d, Hu * .3), 22, { speed: 90, spread: Hu * .5, up: .35 });
    h.ring(a.clone().setY(1.2), E()[0], { r0: 6, r1: Hu * 1.6, dur: .55, normal: true, op: .75, thick: .14 });
    // the cracks: jagged dark lines along the ground, opening from its feet to the target's, with a branch or two
    const crackMat = h.own(new THREE.MeshBasicMaterial({ color: '#33241a', transparent: true, opacity: .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    const segs = [], line = (p0, dir, len, n, w, at0) => { let p = p0.clone(); for (let i = 0; i < n; i++) { const q = p.clone().addScaledVector(dir, len / n).addScaledVector(h.sideOf(dir), G.rand(-1, 1) * len / n * .6); const m = h.add(new THREE.Mesh(new THREE.BoxGeometry(w * (1 - .5 * i / n), .2, p.distanceTo(q) + w * .5), crackMat)); m.position.lerpVectors(p, q, .5).setY(.5); m.lookAt(q.clone().setY(.5)); m.visible = false; m.renderOrder = 3; segs.push({ m, at: at0 + i / n * (1 - at0) * .9, p: m.position.clone() }); p = q; } return p; };
    const dist = a.distanceTo(b), start = a.clone().addScaledVector(d, Hu * .25);
    line(start, d, dist - Hu * .25, 18, 7, 0);
    for (const [k, s, l] of [[.3, 1, .25], [.55, -1, .22], [.75, 1, .18]]) line(start.clone().addScaledVector(d, dist * k), d.clone().addScaledVector(sd, s * .9).normalize(), dist * l, 5, 4.5, k);
    const Wt = Math.max(Ht, t.scale * (CREATURE_DEFS[t.mon.id].width || .5));
    for (let i = 0; i < 6; i++) line(b.clone(), h.V(Math.cos(i / 6 * TAU), 0, Math.sin(i / 6 * TAU)), Wt * .75, 3, 4.5, .95);
    let shown = 0;
    await G.tween(.42, (k) => { for (const s of segs) if (!s.m.visible && s.at <= k) { s.m.visible = true; if (++shown % 3 === 0) h.fx.emit({ x: s.p.x, y: 2, z: s.p.z, vy: G.rand(20, 50), life: .5, size: G.rand(7, 11), shape: 'dust', color: G.pick(E()) }); } h.env.shake(3); });
    for (const s of segs) s.m.visible = true;
    // the rocks: spikes bursting up in a ring under the target, a big one in the middle
    CC.sfx('superhit'); h.env.shake(9);
    const R = Math.max(Wt * .55, 14), spikes = [];
    for (let i = 0; i < 9; i++) { const ang = i / 8 * TAU + .3, big = i === 8, rr = big ? 0 : R * G.rand(.8, 1.05), sz = (big ? .22 : .15 + (i % 2) * .04) * Ht + 2, sp = big ? 2.6 : 2.3, s = rock(h, sz, i + 2, sp); s.position.copy(b).add(h.V(Math.cos(ang) * rr, 0, Math.sin(ang) * rr)); s.userData.tilt = big ? [0, 0] : [Math.sin(ang) * .5, -Math.cos(ang) * .5]; s.userData.h = sz * sp; spikes.push(s); }
    dustAt(h, b, 26, { speed: 110, spread: R, up: .8, g: 140 }); chips(h, b.clone().setY(4), 8, Math.max(2, Ht * .05), 80);
    const tr = t.model.root, y0 = t.home.y;
    G.tween(.4, (k) => { tr.position.y = y0 + Math.sin(k * PI) * Ht * .22; }).then(() => { tr.position.y = y0; });
    await G.tween(.14, (k) => { const e = G.easeOut(k); for (const s of spikes) { s.position.y = (e - 1) * s.userData.h * .9; s.rotation.set(s.userData.tilt[0] * e, 0, s.userData.tilt[1] * e); s.scale.setScalar(.5 + .5 * e); } });
    return async () => {
      await G.sleep(.35);
      G.tween(.45, (k) => { crackMat.opacity = .9 * (1 - k); }).then(() => { for (const s of segs) h.drop(s.m); });
      await G.tween(.32, (k) => { for (const s of spikes) { s.position.y = -k * s.userData.h; } });
      for (const s of spikes) h.drop(s);
    };
  });
})();
