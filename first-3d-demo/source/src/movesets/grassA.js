// movesets/grassA.js: the Tuftail line's Grass Swipe and the Bolt moves (Static Zap, Shock Pulse, Thunder Snap, and the
// Bumblop line's Static Hop). The Bolt moves are shared (Tsunadrake and Typhoonewt know Static Zap and Thunder Snap),
// so they start from u.model.mouth() or center(u) and use only the common body actions.
// Lightning is a jagged chain of thin additive cylinders (a white core in a yellow glow), redrawn every few frames so it
// crackles; static is short arcs that jump between points round a body.

// body actions for these moves (any creature can play them)
// a full spin on the spot that swings the tail through the target (Grass Swipe); the fox line also sweeps its tail in act()
CREATURE_ACTIONS.grassswipe = { dur: .6, hit: .42, f(u, o) { const k = KIT.sm(.05, .75, u); o.ry = -k * Math.PI * 2; o.y = Math.sin(u * Math.PI) * .05; o.rz = Math.sin(u * Math.PI) * .12; o.z = .1 * Math.sin(Math.min(1, u * 1.4) * Math.PI); o.sy = 1 - .06 * Math.sin(u * Math.PI); } };
// two quick hops on the spot, buzzing with static, before the leap (Static Hop)
CREATURE_ACTIONS.statichop = { dur: .7, f(u, o) { const h = (u * 2) % 1; o.y = Math.sin(h * Math.PI) * .12; o.sy = h < .18 ? 1 - .14 * Math.sin(h / .18 * Math.PI) : 1 + .06 * Math.sin((h - .18) / .82 * Math.PI); o.sx = o.sz = 2 - o.sy; o.rz = Math.sin(u * 70) * .035; } };

(() => {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const BOLT = DATA.TYPE_COLORS.Bolt, PLANT = DATA.TYPE_COLORS.Plant; // ['#fff07a', '#f0c828', '#a07c10']
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), UP = new THREE.Vector3(0, 1, 0);

  // a lightning bolt from a to b: draw(a, b, upto) lays a fresh jagged path (upto: how much of it shows, 0 to 1)
  function bolt(h, o) {
    o = o || {};
    const g = h.add(new THREE.Group());
    const mc = h.own(new THREE.MeshBasicMaterial({ color: o.core || '#fffbe6', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const mg = h.own(new THREE.MeshBasicMaterial({ color: o.color || BOLT[1], transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
    const r = o.r || 1, n = o.n || 9, jit = o.jit || 6, forks = o.forks === undefined ? 2 : o.forks;
    const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), q = new THREE.Quaternion(), d = new THREE.Vector3();
    function path(a, b, nn, jj) {
      d.copy(b).sub(a); p1.crossVectors(d, Math.abs(d.y) / (d.length() || 1) > .9 ? new THREE.Vector3(1, 0, 0) : UP).normalize(); p2.crossVectors(d, p1).normalize();
      const pts = [a.clone()];
      for (let i = 1; i < nn; i++) { const k = i / nn, amp = jj * Math.pow(Math.sin(k * PI), .6); pts.push(a.clone().addScaledVector(d, k).addScaledVector(p1, G.rand(-amp, amp)).addScaledVector(p2, G.rand(-amp, amp))); }
      pts.push(b.clone()); return pts;
    }
    function chain(B, pts, upto, rk) {
      const m = upto * (pts.length - 1);
      for (let i = 0; i < pts.length - 1 && i < m; i++) {
        const a = pts[i], b = i + 1 > m ? pts[i].clone().lerp(pts[i + 1], m - i) : pts[i + 1], len = a.distanceTo(b); if (len < 1e-3) continue;
        q.setFromUnitVectors(UP, d.copy(b).sub(a).normalize());
        const mid = [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2];
        B.add(CYL, mc, mid, q, [r * rk, len + r * rk, r * rk], { ink: 0 }); B.add(CYL, mg, mid, q, [r * rk * 3.4, len + r * rk * 2, r * rk * 3.4], { ink: 0 });
      }
    }
    const api = {
      g, pts: null,
      draw(a, b, upto) {
        for (const c of [...g.children]) { g.remove(c); c.geometry.dispose(); }
        upto = upto === undefined ? 1 : upto;
        const B = KIT.builder(), pts = path(a, b, n, jit); api.pts = pts; chain(B, pts, upto, 1);
        for (let f = 0; f < forks; f++) { const i = 1 + Math.floor(Math.random() * (n - 2)); if (i / n > upto) continue; const s = pts[i], e = s.clone().add(new THREE.Vector3(G.rand(-1, 1), G.rand(-1, .4), G.rand(-1, 1)).normalize().multiplyScalar(jit * G.rand(1.6, 2.6))); chain(B, path(s, e, 3, jit * .5), 1, .6); }
        B.build(g, null); g.children.forEach((c) => { c.renderOrder = 9; c.frustumCulled = false; });
      },
      set op(v) { mc.opacity = v; mg.opacity = .55 * v; },
      done() { h.drop(g); },
    };
    return api;
  }
  // static crackling round a creature for dur seconds: arcs jumping between points round its body, and sparks
  function crackle(h, s, dur, o) {
    o = o || {};
    const R = Math.max(h.H(s) * .5, 8), arcs = [0, 1, 2, 3].slice(0, o.n || 2).map(() => bolt(h, { r: o.r || 1, n: 4, jit: R * .18, forks: 0 }));
    const halo = h.glow(BOLT[0], h.H(s) * 1.5, 0);
    let t = 0, next = 0;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    return G.tween(dur, (k) => {
      t += G.dt;
      const c = h.center(s, .5); halo.position.copy(c); halo.material.opacity = (.18 + .14 * Math.random()) * Math.sin(k * PI);
      if (t >= next) { next = t + .05; for (const a of arcs) {
        if (Math.random() < .25) { a.op = 0; continue; }
        // an arc that leaps off the body and back: both ends on a shell round it, bowed outward
        const n0 = V3(G.rand(-1, 1), G.rand(-.6, 1), G.rand(-1, 1)).normalize(), n1 = n0.clone().add(V3(G.rand(-.7, .7), G.rand(-.7, .7), G.rand(-.7, .7))).normalize();
        a.draw(c.clone().addScaledVector(n0, R * .85), c.clone().addScaledVector(n1, R * 1.05)); a.op = G.rand(.7, 1);
      } }
      if (Math.random() < .6) { const p = c.clone().add(V3(G.rand(-1, 1), G.rand(-.8, 1), G.rand(-1, 1)).normalize().multiplyScalar(R)); h.fx.emit({ x: p.x, y: p.y, z: p.z, vx: G.rand(-30, 30), vy: G.rand(-10, 40), vz: G.rand(-30, 30), life: .25, size: G.rand(5, 9), shape: 'sparkle', color: G.pick(BOLT.slice(0, 2).concat(['#ffffff'])), add: true }); }
    }).then(() => { arcs.forEach((a) => a.done()); h.drop(halo); });
  }
  // a burst of electricity where something lands
  function zapBurst(h, at, k) {
    k = k || 1;
    h.flash(at, '#fff6b0', 34 * k, .25);
    h.ring(at, BOLT[0], { face: 'cam', r0: 4, r1: 26 * k, dur: .35, thick: .1 });
    h.fx.burst('sparkle', at, Math.round(14 * k), { speed: 110, colors: [BOLT[0], BOLT[1], '#ffffff'], size: 8, add: true, g: 0, life: .4, spin: 8 });
    const arcs = [0, 1, 2].map(() => bolt(h, { r: .8, n: 4, jit: 4 * k, forks: 0 }));
    return G.tween(.3, (q) => { for (const a of arcs) { if (Math.random() < .5) { const dir = new THREE.Vector3(G.rand(-1, 1), G.rand(-1, 1), G.rand(-1, 1)).normalize(); a.draw(at.clone().addScaledVector(dir, 3), at.clone().addScaledVector(dir, 16 * k * G.rand(.7, 1.2))); } a.op = 1 - q; } }).then(() => arcs.forEach((a) => a.done()));
  }
  // charge: sparks drawn in to a point, a glow swelling there
  function charge(h, at, dur, size) {
    const gl = h.glow(BOLT[0], 2, .9);
    return G.tween(dur, (k) => {
      const p = typeof at === 'function' ? at() : at; gl.position.copy(p); gl.scale.setScalar((size || 14) * (.2 + .8 * k) * (1 + .15 * Math.sin(k * 60)));
      if (Math.random() < .8) { const a = Math.random() * TAU, e = G.rand(-1, 1), R = 16; h.fx.emit({ x: p.x + Math.cos(a) * R, y: p.y + e * R, z: p.z + Math.sin(a) * R, vx: -Math.cos(a) * R * 4, vy: -e * R * 4, vz: -Math.sin(a) * R * 4, life: .25, size: 5, shape: 'sparkle', color: G.pick([BOLT[0], '#ffffff']), add: true }); }
    }).then(() => gl);
  }

  // ---------- Static Zap (Bolt, basic): a small crackling zap from the mouth ----------
  MOVES3D.define('staticzap', (h) => async (u, t) => {
    u.model.play('cast'); CC.sfx('shoot');
    const mouth = () => u.model.mouth(new THREE.Vector3());
    const gl = await charge(h, mouth, .3, 12);
    const from = mouth(), to = h.center(t), z = bolt(h, { r: .95, n: 8, jit: 5, forks: 1 });
    await G.tween(.08, (k) => { z.draw(from, to, k); gl.position.copy(from); });
    zapBurst(h, to, .8);
    return () => G.tween(.25, (k) => { if (k < .6 && Math.random() < .6) z.draw(from, to); z.op = 1 - k; gl.material.opacity = .9 * (1 - k); }).then(() => { z.done(); h.drop(gl); });
  });

  // ---------- Shock Pulse (Bolt, status): it gathers static, then sends a crackling ring of electricity at the target ----------
  MOVES3D.define('shockpulse', (h) => async (u, t) => {
    u.model.play('puff'); CC.sfx('status');
    await crackle(h, u, .35, { n: 2 });
    CC.sfx('shoot');
    const from = h.center(u, .5), to = h.center(t, .5), d = to.clone().sub(from), dn = d.clone().normalize();
    const ringG = h.add(new THREE.Group()); ringG.position.copy(from); ringG.lookAt(to);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1, .09, 6, 40), h.own(new THREE.MeshBasicMaterial({ color: BOLT[0], transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }))); torus.renderOrder = 8; ringG.add(torus);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(1, 32), h.own(new THREE.MeshBasicMaterial({ color: BOLT[1], transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))); ringG.add(inner);
    const arcs = [0, 1, 2, 3].map(() => bolt(h, { r: .9, n: 5, jit: 3, forks: 0 }));
    const rim = (R, a) => new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0).applyQuaternion(ringG.quaternion).add(ringG.position);
    await G.tween(.42, (k) => {
      const R = 6 + 16 * G.easeOut(k); ringG.position.copy(from).addScaledVector(d, G.ease(k)); ringG.scale.setScalar(R); ringG.rotation.z += G.dt * 4;
      torus.material.opacity = .85 * (1 - .3 * k);
      arcs.forEach((a, i) => { const a0 = i / arcs.length * TAU + k * 9 + G.rand(-.3, .3); a.draw(rim(R, a0), rim(R, a0 + G.rand(.6, 1.1))); });
      if (Math.random() < .7) { const p = rim(R, Math.random() * TAU); h.fx.emit({ x: p.x, y: p.y, z: p.z, vx: -dn.x * 20, vy: G.rand(-10, 20), vz: -dn.z * 20, life: .3, size: 6, shape: 'sparkle', color: G.pick([BOLT[0], '#ffffff']), add: true }); }
    });
    arcs.forEach((a) => a.done()); h.drop(ringG);
    // it hits: the target is wrapped in static and jolts
    zapBurst(h, to, 1); t.model.flash(.9, BOLT[0]); t.model.play('shake');
    h.ring(t.model.root.position.clone().setY(1.5), BOLT[1], { r0: 6, r1: 40, dur: .45, thick: .1 });
    await Promise.all([crackle(h, t, .55, { n: 3 }), G.sleep(.2).then(() => t.model.flash(.7, BOLT[0]))]);
  });

  // ---------- Thunder Snap (Bolt, strong): it sends a spark into the sky; a storm cloud gathers over the target and a
  // lightning bolt strikes it from above ----------
  MOVES3D.define('thundersnap', (h) => async (u, t) => {
    u.model.play('roar'); CC.sfx('status');
    const cr = crackle(h, u, .55, { n: 3, r: .7 });
    await G.sleep(.3);
    // a spark shoots up out of its mouth
    const m0 = u.model.mouth(new THREE.Vector3()), up = m0.clone().add(new THREE.Vector3(G.rand(-6, 6), 140, 0)), s1 = bolt(h, { r: .9, n: 10, jit: 6, forks: 1 });
    CC.sfx('shoot');
    await G.tween(.12, (k) => s1.draw(m0, up, k));
    G.tween(.2, (k) => { s1.op = 1 - k; }).then(() => s1.done());
    await cr;
    // the storm cloud over the target
    const camR = new THREE.Vector3(1, 0, 0).applyQuaternion(h.env.camera.quaternion).setY(0).normalize();
    const top = t.model.root.position.clone().setY(h.center(t, 1).y + 18).addScaledVector(camR, -h.H(t) * .95), c = h.cloud(top, { color: '#3e3a52', size: 10, n: 9, w: 2.4, emissive: '#2a2850', ei: .3 });
    const glowIn = h.glow(BOLT[0], 40, 0); glowIn.position.copy(top);
    await G.tween(.4, (k) => { c.op = .95 * k; c.g.scale.setScalar(.5 + .5 * G.easeOut(k)); glowIn.material.opacity = Math.random() < .25 ? .7 : .05; });
    // the strike
    CC.sfx('superhit');
    const to = h.center(t, .55), ground = t.model.root.position.clone().setY(1), big = bolt(h, { r: 2, n: 12, jit: 9, forks: 3 });
    await G.tween(.07, (k) => big.draw(top.clone().add(new THREE.Vector3(0, -6, 0)), to, k));
    h.env.shake(7); t.model.flash(1, '#fff8c0');
    h.flash(to, '#ffffff', 110, .3); h.flash(top, BOLT[0], 70, .4);
    h.ring(ground, BOLT[0], { r0: 8, r1: 70, dur: .5, thick: .12 });
    h.fx.burst('sparkle', ground.clone().setY(4), 24, { speed: 130, colors: [BOLT[0], BOLT[1], '#ffffff'], size: 9, add: true, g: 120, up: .7, life: .5 });
    zapBurst(h, to, 1.4);
    return () => G.tween(.55, (k) => {
      if (k < .5 && Math.random() < .5) big.draw(top.clone().add(new THREE.Vector3(0, -6, 0)), to);
      big.op = k < .5 ? (Math.random() < .3 ? .3 : 1) : 1 - (k - .5) * 2; glowIn.material.opacity = k < .5 ? (Math.random() < .3 ? .8 : .2) : 0; c.op = .95 * (1 - k * k);
    }).then(() => { big.done(); h.drop(glowIn); c.done(); });
  });

  // ---------- Static Hop (Bolt, signature, the Bumblop line): two hops on the spot crackling with static, then it bounds
  // in and lands on the target in a snap of electricity ----------
  MOVES3D.define('statichop', (h) => async (u, t) => {
    CC.sfx('status'); u.model.play('statichop');
    await crackle(h, u, .7, { n: 3 });
    CC.sfx('throw'); u.model.play('hop');
    const trail = h.every(() => { const p = h.center(u, .5); for (let i = 0; i < 2; i++) h.fx.emit({ x: p.x + G.rand(-6, 6), y: p.y + G.rand(-6, 6), z: p.z + G.rand(-6, 6), vx: G.rand(-10, 10), vy: G.rand(-10, 10), life: .35, size: G.rand(5, 8), shape: 'sparkle', color: G.pick([BOLT[0], BOLT[1], '#ffffff']), add: true }); });
    const arc = bolt(h, { r: .9, n: 5, jit: 5, forks: 0 });
    const flick = h.every(() => { if (Math.random() < .5) { const c = h.center(u, .5), R = h.H(u) * .45; arc.draw(c.clone().add(new THREE.Vector3(G.rand(-R, R), G.rand(-R, R), G.rand(-R, R))), c.clone().add(new THREE.Vector3(G.rand(-R, R), G.rand(-R, R), G.rand(-R, R)))); } });
    const back = await h.leap(u, t, { frac: .78, height: h.H(u) * (u.isFoe ? .8 : 1.1), up: .36, hang: .05, down: .14 });
    trail(); flick(); arc.done();
    u.model.play('hop');
    const at = h.center(t, .55);
    zapBurst(h, at, 1.2); t.model.flash(.8, BOLT[0]);
    h.ring(t.model.root.position.clone().setY(1.5), BOLT[0], { r0: 6, r1: 48, dur: .4, thick: .1 });
    crackle(h, t, .4, { n: 2 });
    return back;
  });

  // ---------- Grass Swipe (Plant, signature, the Tuftail line): it darts in and spins, sweeping its tail through the
  // target in a green crescent of cut grass; a glint for the critical edge ----------
  MOVES3D.define('grassswipe', (h) => async (u, t) => {
    await h.act(u, 'crouch'); CC.sfx('throw');
    u.model.play('attack');
    const back = await h.dash(u, t, { frac: .6, dur: .2 });
    CC.sfx('shoot');
    const spin = h.act(u, 'grassswipe');
    await G.sleep(.12);
    // the crescent: a curve swept round the front of the target, a little downhill
    const tc = h.center(t, .5), d = h.flat(u.model.root.position, t.model.root.position), sd = h.sideOf(d), R = h.H(t) * .62, pts = [];
    for (let i = 0; i <= 10; i++) { const a = -1.3 + i / 10 * 2.6; pts.push(tc.clone().addScaledVector(d, -Math.cos(a) * R).addScaledVector(sd, Math.sin(a) * R * 1.1).add(new THREE.Vector3(0, (i / 10 - .5) * -R * .7, 0))); }
    const sl = h.stream(pts, (k) => .5 + 5.5 * Math.pow(Math.sin(k * PI), .8), h.streamMat('#c8f4a0', PLANT[2], '#ffffff', { stripe: 26, speed: 30, wob: .4 }), 50);
    const blades = h.every(() => { const p = sl.curve.getPointAt(Math.min(1, sl.mat.uniforms.uHead.value)); for (let i = 0; i < 2; i++) h.fx.emit({ x: p.x, y: p.y, z: p.z, vx: G.rand(-40, 40), vy: G.rand(0, 50), vz: G.rand(-40, 40), g: 80, life: .5, size: G.rand(7, 11), shape: 'leaf', color: G.pick(PLANT), spin: G.rand(-12, 12) }); });
    await Promise.all([sl.grow(.16), spin]);
    blades();
    // the glint of a clean cut
    const gl = h.glow('#ffffff', 2); gl.position.copy(pts[7]);
    G.tween(.3, (k) => { gl.scale.setScalar(28 * Math.sin(k * PI)); gl.material.opacity = 1 - k * .5; }).then(() => h.drop(gl));
    h.fx.burst('star', pts[7], 4, { speed: 40, colors: ['#ffffff', '#f4ffd0'], size: 10, add: true, g: 0, life: .35 });
    h.fx.burst('leaf', tc, 12, { speed: 90, colors: PLANT, size: 10, g: 70, spin: 12 });
    return () => Promise.all([sl.fade(.3), G.sleep(.12).then(back)]);
  });
})();
