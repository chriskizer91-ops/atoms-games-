// grassC movesets: Blaze Mane (the Dandylion line's mane flares and it charges), Core Burrow (Wormapple ducks into its
// apple and rolls in), and the Shadow moves, which any body can use: Shade Swipe (a dark claw rake), Venom Mist (a purple
// cloud), Scare Flap (a flapping rise and a burst of shadow with eyes in it) and Night Pounce (down into a shadow pool and
// up out of one at the target). The crows flap their wings and the lions flare their manes through their own act() hooks;
// Scarecrown's two little crows fly at the target during Scare Flap.
(() => {
  'use strict';
  const { sm, lerp, cl, PI, TAU } = KIT;
  const SHADOW = ['#b48ad8', '#6e46a0', '#3a2260'];

  // ---------- body actions ----------
  // rearing up with the mane shaking out (the lions' act() puffs the mane up on this)
  CREATURE_ACTIONS.maneflare = { dur: .75, f(u, o) { const a = sm(0, .3, u) * (1 - sm(.65, 1, u)); o.rx = -.25 * a; o.y = .03 * a; o.z = -.04 * a; o.sy = 1 + .1 * a; o.sx = o.sz = 1 + .05 * a + .03 * Math.sin(u * 70) * a; } };
  // a forward roll about its middle (one and a half turns)
  CREATURE_ACTIONS.coreroll = { dur: .5, f(u, o) { const a = sm(0, 1, u) * TAU * 1.5, hc = .22; o.rx = a; o.y = hc * (1 - Math.cos(a)); o.z = -hc * Math.sin(a); } };
  // flapping up into the air, then lunging forward at the top
  CREATURE_ACTIONS.scareflap = { dur: 1.05, hit: .62, f(u, o) { const up = sm(0, .3, u) * (1 - sm(.72, 1, u)), lunge = Math.sin(cl((u - .5) / .3, 0, 1) * PI); o.y = .26 * up + .025 * Math.sin(u * TAU * 5) * up; o.z = .14 * lunge; o.rx = -.18 * up + .4 * lunge; o.sy = 1 + .05 * Math.sin(u * TAU * 5) * up; } };
  // melting flat into a shadow, and springing back up out of one
  CREATURE_ACTIONS.shadowsink = { dur: .4, hold: true, f(u, o) { const k = sm(0, 1, u); o.sy = Math.max(.02, 1 - .98 * k); o.sx = o.sz = 1 + .4 * k; } };
  CREATURE_ACTIONS.shadowrise = { dur: .32, f(u, o) { const k = sm(0, .7, u); o.sy = lerp(.02, 1, k) * (1 + .25 * Math.sin(k * PI)); o.sx = o.sz = lerp(1.4, 1, k); } };

  // ---------- shared bits ----------
  let POOLTEX = null;
  const poolTex = () => POOLTEX || (POOLTEX = KIT.canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 63); gr.addColorStop(0, 'rgba(12,5,22,1)'); gr.addColorStop(.55, 'rgba(30,14,52,.95)'); gr.addColorStop(.82, 'rgba(80,46,130,.55)'); gr.addColorStop(1, 'rgba(110,70,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }));
  // a pool of shadow on the ground
  function pool(h, at, r) {
    const m = h.add(new THREE.Mesh(new THREE.CircleGeometry(1, 40), h.own(new THREE.MeshBasicMaterial({ map: poolTex(), transparent: true, depthWrite: false }))));
    m.rotation.x = -PI / 2; m.position.copy(at); m.position.y += 1.4; m.renderOrder = 5; m.scale.setScalar(.01);
    h.ring(m.position.clone().setY(m.position.y + .3), SHADOW[0], { r0: r * .3, r1: r * 1.1, dur: .45, thick: .08 });
    return { m, grow: (d) => G.tween(d, (k) => m.scale.setScalar(r * G.easeOut(k))), shrink: (d) => G.tween(d, (k) => m.scale.setScalar(Math.max(.01, r * (1 - k)))).then(() => h.drop(m)) };
  }
  // dark wisps rising (drawn dark, not added)
  const wisp = (h, p, r) => h.fx.emit({ x: p.x + G.rand(-r, r), y: p.y + G.rand(0, r * .4), z: p.z + G.rand(-r, r), vy: G.rand(20, 50), life: .6, size: G.rand(9, 15), shape: 'glow', color: G.pick(['#3a2260', '#24143c', '#5a3a8a']) });
  // the dark accent where a Shadow move lands (the battle adds its white hit flash on top)
  function shadowHit(h, at, k) {
    k = k || 1;
    h.ring(at, SHADOW[0], { face: 'cam', r0: 4, r1: 30 * k, dur: .4, thick: .12 });
    h.fx.burst('sparkle', at, Math.round(12 * k), { speed: 80, colors: ['#b48ad8', '#e0c8ff', '#6e46a0'], size: 9, add: true, g: 10 });
    h.fx.burst('glow', at, Math.round(10 * k), { speed: 50, colors: ['#3a2260', '#24143c'], size: 15, g: -10, life: .6 });
  }
  const FEATHER = KIT.slab([[0, 0], [2, 2], [2.4, 6], [1.2, 9], [0, 10.4], [-1.4, 8], [-2.2, 4], [-1.6, 1.5]], .5, .2);
  // one of Scarecrown's little crows, off its arm and flying at the target; resolves to a function that flies it home
  function crowFly(h, u, t, part, i) {
    u.model.root.updateMatrixWorld(true);
    const c = part.clone(true), p0 = part.getWorldPosition(new THREE.Vector3());
    part.getWorldQuaternion(c.quaternion); part.getWorldScale(c.scale); c.position.copy(p0); h.S.add(c); part.visible = false;
    const wl = c.getObjectByName(part.name + 'wl'), wr = c.getObjectByName(part.name + 'wr');
    const flap = h.every(() => { const f = Math.sin(G.t * 38 + i * 2) * .9; if (wl) wl.rotation.z = f; if (wr) wr.rotation.z = -f; });
    const sd = i ? 1 : -1, H = h.H(t), tgt = h.center(t, .5).addScaledVector(h.sideOf(h.flat(u.home, t.home)), sd * H * .42).addScaledVector(h.flat(t.home, u.home), H * .3);
    const go = G.sleep(.12 * i).then(() => G.tween(.6, (k) => { const p = c.position.clone(); c.position.lerpVectors(p0, tgt, G.ease(k)); c.position.y += Math.sin(k * PI) * 10; if (p.distanceToSquared(c.position) > 1e-4) c.lookAt(c.position.clone().add(c.position.clone().sub(p))); }));
    return async () => {
      await go; const p1 = c.position.clone();
      await G.tween(.5, (k) => { u.model.root.updateMatrixWorld(true); const home = part.getWorldPosition(new THREE.Vector3()), p = c.position.clone(); c.position.lerpVectors(p1, home, G.ease(k)); c.position.y += Math.sin(k * PI) * 16; if (k < .9) c.lookAt(c.position.clone().add(c.position.clone().sub(p))); });
      flap(); h.S.remove(c); part.visible = true;
    };
  }

  // ---------- Fire: Blaze Mane ----------
  MOVES3D.define('blazemane', (h) => async (u, t) => {
    const fx = h.fx, P = u.model.parts;
    const hp = () => (P.head ? P.head.getWorldPosition(new THREE.Vector3()) : h.center(u, .7)), R = () => h.H(u) * .42;
    CC.sfx('status'); u.model.play('maneflare'); u.model.flash(.7, '#ff7a20');
    const flame = () => G.pick(['#ffe070', '#ff9a30', '#ff5a20']);
    const halo = h.glow('#ff8a2a', 10, 0);
    // the mane catches: flames lick up all round it
    const lick = h.every(() => { const p = hp(), r = R(); halo.position.copy(p); for (let i = 0; i < 3; i++) { const a = Math.random() * TAU; fx.emit({ x: p.x + Math.cos(a) * r * .9, y: p.y + Math.sin(a) * r * .8, z: p.z + G.rand(-r, r) * .4, vx: Math.cos(a) * 25, vy: 35 + Math.max(0, Math.sin(a)) * 30, life: .4, size: G.rand(9, 15), shape: 'ember', color: flame(), add: true }); } });
    await G.tween(.55, (k) => { halo.scale.setScalar(R() * (2 + 1.2 * k)); halo.material.opacity = .8 * k; });
    h.ring(hp(), '#ffb040', { face: 'cam', r0: 4, r1: R() * 2.2, dur: .45, thick: .14 });
    // and it charges in, the fire streaming back off it
    CC.sfx('throw'); u.model.play('attack');
    const trail = h.every(() => { const p = hp(); for (let i = 0; i < 3; i++) fx.emit({ x: p.x + G.rand(-8, 8), y: p.y + G.rand(-8, 10), z: p.z + G.rand(-8, 8), vy: G.rand(10, 40), life: .45, size: G.rand(10, 16), shape: 'ember', color: flame(), add: true }); });
    const back = await h.dash(u, t, { frac: .7, dur: .24 });
    trail(); lick();
    h.flash(h.center(t, .5), '#ffb040', 64, .35);
    fx.burst('ember', h.center(t, .5), 16, { speed: 90, colors: ['#ffe070', '#ff9a30', '#ff5a20'], size: 12, add: true, g: -30 });
    G.tween(.3, (k) => { halo.material.opacity = .8 * (1 - k); }).then(() => h.drop(halo));
    return back;
  });

  // ---------- Plant: Core Burrow ----------
  MOVES3D.define('coreburrow', (h) => async (u, t) => {
    CC.sfx('status'); u.model.play('tuck');
    await G.sleep(.3);
    // tucked away inside, its skin hardens: a green glint closes over it
    const sh = h.shield(u, '#a8e88a');
    await G.tween(.25, (k) => { sh.g.scale.setScalar(sh.r * (.6 + .5 * G.easeOut(k))); sh.fill.material.opacity = .25; });
    G.tween(.25, (k) => { sh.g.scale.setScalar(sh.r * (1.1 + .2 * k)); sh.edges.material.opacity = .9 * (1 - k); sh.fill.material.opacity = .25 * (1 - k); }).then(() => h.drop(sh.g));
    // then it rolls in and bonks the target
    CC.sfx('throw'); u.model.play('coreroll');
    const root = u.model.root, leaves = h.every(() => { if (Math.random() < .5) h.fx.emit({ x: root.position.x + G.rand(-8, 8), y: 3, z: root.position.z + G.rand(-8, 8), vy: G.rand(20, 50), vx: G.rand(-20, 20), life: .5, size: 8, shape: 'leaf', color: G.pick(['#a8e88a', '#4fb04a', '#6ac84a']), spin: 8 }); if (Math.random() < .4) h.dust(root.position, 1, 4); });
    const back = await h.dash(u, t, { frac: .64, dur: .42, hop: 1 });
    leaves(); u.model.play('hop'); h.env.shake(3);
    h.ring(h.center(t, .45), '#a8e88a', { face: 'cam', r0: 4, r1: 28, dur: .35, thick: .12 });
    h.fx.burst('star', h.center(t, .7), 6, { speed: 60, colors: ['#ffffff', '#fff4c0'], size: 10, add: true, g: 20 });
    return back;
  });

  // ---------- Shadow: Shade Swipe ----------
  MOVES3D.define('shadeswipe', (h) => async (u, t) => {
    await h.act(u, 'crouch'); CC.sfx('throw'); u.model.play('attack');
    const back = await h.dash(u, t, { frac: .52, dur: .18 });
    // three dark claw marks raked down across the target
    const c = h.center(t, .5), cam = h.toCam(c), right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cam).normalize(), up = new THREE.Vector3().crossVectors(cam, right);
    const R = h.H(t) * .6, dir = right.clone().sub(up).normalize(), perp = right.clone().add(up).normalize(), claws = [];
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * R * .4, base = c.clone().addScaledVector(cam, R * .6).addScaledVector(perp, off);
      const pts = [base.clone().addScaledVector(dir, -R), base.clone().addScaledVector(perp, R * .22), base.clone().addScaledVector(dir, R)];
      const s = h.stream(pts, (k) => .5 + 4.4 * Math.sin(k * PI), h.streamMat('#c8a0f0', '#3a1c64', '#ffffff', { stripe: 6, speed: 3 }), 24);
      claws.push(G.sleep(i * .04).then(() => s.grow(.09)).then(() => s));
    }
    const done = await Promise.all(claws);
    shadowHit(h, c, .8);
    return () => Promise.all([back(), ...done.map((s) => s.fade(.3))]);
  });

  // ---------- Shadow: Venom Mist ----------
  MOVES3D.define('venommist', (h) => async (u, t) => {
    u.model.play('puff'); CC.sfx('shoot'); await G.sleep(.3);
    u.model.play('spit'); await G.sleep(.15);
    const from = u.model.mouth(new THREE.Vector3()), to = h.center(t, .5);
    const c = h.cloud(from, { color: '#8a5ab8', size: 8, n: 9, w: 2.2, emissive: '#3a1a5a', ei: .45 });
    const motes = h.every(() => {
      const p = c.g.position;
      if (Math.random() < .7) h.fx.emit({ x: p.x + G.rand(-14, 14), y: p.y + G.rand(-6, 8), z: p.z + G.rand(-10, 10), vy: G.rand(10, 30), life: .7, size: G.rand(5, 9), shape: 'bubble', color: G.pick(['#c89af0', '#9a5ad8', '#e0c8ff']) });
      if (Math.random() < .5) h.fx.emit({ x: p.x + G.rand(-12, 12), y: p.y + G.rand(-6, 6), z: p.z + G.rand(-8, 8), vy: G.rand(-5, 10), life: .6, size: G.rand(10, 16), shape: 'glow', color: G.pick(['#6e46a0', '#4a2a78']) });
    });
    await G.tween(.55, (k) => { c.g.position.lerpVectors(from, to, G.ease(k)); c.g.position.y += Math.sin(k * PI) * 10; c.op = .85 * Math.min(1, k * 3); c.g.scale.setScalar(.5 + .9 * k); c.g.rotation.y += G.dt; });
    // it wraps the target, which reels
    t.model.play('shake'); t.model.flash(.7, '#a060e0');
    h.ring(t.model.root.position.clone().setY(1), '#9a5ad8', { r0: 6, r1: h.H(t) * .9, dur: .6, normal: true, op: .5, thick: .2 });
    await G.tween(.45, (k) => { c.op = .85 * (1 - k); c.g.scale.setScalar(1.4 + .4 * k); });
    motes(); c.done();
  });

  // ---------- Shadow: Scare Flap ----------
  MOVES3D.define('scareflap', (h) => async (u, t) => {
    CC.sfx('throw'); u.model.play('scareflap');
    const P = u.model.parts, fly = ['crowL', 'crowR'].filter((n) => P[n]).map((n, i) => crowFly(h, u, t, P[n], i));
    // loose feathers whirl off as it flaps up
    const gust = h.every(() => { if (Math.random() < .4) { const p = h.center(u, .5); h.fx.emit({ x: p.x + G.rand(-20, 20), y: p.y + G.rand(-10, 10), z: p.z + G.rand(-10, 10), vy: G.rand(-20, 10), vx: G.rand(-30, 30), life: .7, size: G.rand(7, 11), shape: 'leaf', color: G.pick(['#3a2f28', '#2a221d', '#56473a']), spin: 6 }); } });
    await G.sleep(.5);
    // a fan of dark feathers flung at the target
    const to = h.center(t, .55), all = [];
    for (let i = 0; i < 7; i++) {
      const f = h.solid((B) => B.add(FEATHER, h.toon('#ffffff'), [0, -5, 0], null, null, { tint: (v) => KIT.rgb(v.y > -1 ? '#56473a' : '#2a221d') }));
      f.userData.point = true; f.scale.setScalar(1.2);
      const from = h.center(u, .7).add(h.V(G.rand(-12, 12), G.rand(-6, 8), G.rand(-8, 8))), at = to.clone().add(h.V(G.rand(-10, 10), G.rand(-8, 10), G.rand(-8, 8)));
      f.position.copy(from);
      all.push(G.sleep(i * .035).then(() => h.throwIt(f, from, at, .22, 6)).then(() => h.drop(f)));
    }
    await Promise.all(all); gust();
    // the scare: a burst of shadow at the target, two glowing eyes opening in it
    CC.sfx('status');
    const c = h.cloud(to, { color: '#24143c', size: 8, n: 9, w: 2.4, h: 1.2, emissive: '#1a0a30', ei: .3 });
    const cam = h.toCam(to), right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), cam).normalize(), eyes = [h.glow('#ffa030', 10, 0), h.glow('#ffa030', 10, 0)];
    h.ring(to, SHADOW[0], { face: 'cam', r0: 4, r1: h.H(t) * .9, dur: .45, thick: .14 });
    h.fx.burst('glow', to, 16, { speed: 70, colors: SHADOW.slice(1).concat(['#24143c']), size: 15, g: -10, life: .6 });
    t.model.play('shake');
    await G.tween(.22, (k) => {
      c.op = .9 * k; c.g.scale.setScalar(.4 + 1.1 * G.easeOut(k));
      eyes.forEach((g, i) => { g.position.copy(to).addScaledVector(right, (i ? 1 : -1) * 7).add(h.V(0, 5, 0)).addScaledVector(cam, 16); g.material.opacity = k; g.scale.set(12, 4 + 5 * k, 1); });
    });
    return async () => {
      await G.tween(.4, (k) => { c.op = .9 * (1 - k); c.g.scale.setScalar(1.5 + .3 * k); eyes.forEach((g) => { g.material.opacity = 1 - k; }); });
      c.done(); eyes.forEach((g) => h.drop(g));
      await Promise.all(fly.map((f) => f()));
    };
  });

  // ---------- Shadow: Night Pounce ----------
  MOVES3D.define('nightpounce', (h) => async (u, t) => {
    const root = u.model.root, start = root.position.clone(), d = h.flat(u.home, t.home), Hu = h.H(u), Ht = h.H(t);
    // it melts down into its own shadow...
    CC.sfx('status'); u.model.play('crouch');
    const p1 = pool(h, start, Math.max(Hu, u.scale * (CREATURE_DEFS[u.mon.id].width || .5)) * .75);
    await p1.grow(.25);
    const wisps = h.every(() => { if (Math.random() < .7) wisp(h, root.position, Hu * .4); });
    await h.act(u, 'shadowsink');
    root.visible = false; p1.shrink(.2);
    // ...the shadow opens again right in front of the target...
    const at = start.clone().lerp(t.model.root.position, .74), p2 = pool(h, at, Ht * .7);
    await p2.grow(.25);
    // ...and it springs up out of it, high over the target, and pounces down
    root.position.copy(at); root.visible = true; u.model.play('shadowrise'); CC.sfx('throw');
    const top = at.clone().addScaledVector(d, -Ht * .15); top.y = start.y + Ht * .75 + Hu * .15;
    await G.tween(.3, (k) => { root.position.lerpVectors(at, top, k); root.position.y = lerp(at.y, top.y, G.easeOut(k)); if (Math.random() < .8) wisp(h, root.position, Hu * .3); });
    wisps(); u.model.play('tuck');
    await G.sleep(.1);
    const end = start.clone().lerp(t.model.root.position, .86);
    u.model.play('attack');
    await G.tween(.14, (k) => { root.position.lerpVectors(top, end, k * k); if (Math.random() < .9) h.streak(root.position.clone().add(h.V(0, Hu * .5, 0)), root.position.clone().add(h.V(0, Hu * .5 + 26, 0)).addScaledVector(d, -12), SHADOW[0]); });
    h.env.shake(4); shadowHit(h, h.center(t, .5), 1.3); p2.shrink(.35);
    return () => G.tween(.42, (k) => { root.position.lerpVectors(end, start, G.ease(k)); root.position.y = lerp(end.y, start.y, k) + Math.sin(k * PI) * Hu * .5; });
  });
})();
