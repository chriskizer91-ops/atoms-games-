// movesets/grassB.js: Rock Fetch (the Pebblepup line), Dewdrop Dash (the Dewt line), and the shared Lumen moves Glow Flash
// and Radiant Beam (any creature: the light gathers at its mouth or chest).
(() => {
  'use strict';
  const { sm, PI, TAU, lerp } = KIT;
  const STONE = (() => { const g = KIT.mergeVerts(new THREE.DodecahedronGeometry(1, 0)); g.computeVertexNormals(); return g; })();
  const EARTH = DATA.TYPE_COLORS.Earth, WATER = DATA.TYPE_COLORS.Water, LUMEN = DATA.TYPE_COLORS.Lumen;

  // ---------- body actions these moves add ----------
  // Rock Fetch: nose down to the dirt and grab (held), then rear back and toss the head (the rock leaves at the hit)
  CREATURE_ACTIONS.rockfetchdip = { dur: .3, hold: true, f(u, o) { const k = sm(0, .7, u); o.rx = .28 * k; o.y = -.02 * k; o.z = .05 * k; o.sy = 1 - .06 * k; } };
  CREATURE_ACTIONS.rockfetchfling = { dur: .5, hit: .5, f(u, o) { const a = sm(0, .45, u) * (1 - sm(.47, .57, u)), b = sm(.47, .57, u) * (1 - sm(.7, 1, u)), d = 1 - sm(0, .3, u); o.rx = .28 * d - .34 * a + .24 * b; o.z = .05 * d - .04 * a + .11 * b; o.y = .03 * a; o.sy = 1 + .07 * a - .05 * b; } };
  // Dewdrop Dash: drawn out long and low, like a drop on the move (held through the dash)
  CREATURE_ACTIONS.dewdropstretch = { dur: .22, hold: true, f(u, o) { const k = sm(0, 1, u); o.sz = 1 + .32 * k; o.sy = 1 - .2 * k; o.sx = 1 - .1 * k; o.rx = .1 * k; o.y = .01 * k; } };
  // Radiant Beam: rear up a little while the light gathers, then lean into the beam and hold it, then settle
  CREATURE_ACTIONS.radiantbeamcharge = { dur: .7, hold: true, f(u, o) { const k = sm(0, 1, u); o.rx = -.16 * k; o.y = .03 * k; o.sy = 1 + .05 * k; o.sx = 1 + .012 * Math.sin(u * 90) * k; } };
  CREATURE_ACTIONS.radiantbeamfire = { dur: .25, hold: true, f(u, o) { const k = sm(0, 1, u); o.rx = -.16 + .24 * k; o.z = .05 * k; o.y = .03 * (1 - k); o.sy = 1.05 - .09 * k; o.sx = 1 + .02 * Math.sin(u * 120); } };
  CREATURE_ACTIONS.radiantbeamend = { dur: .35, f(u, o) { const k = 1 - sm(0, 1, u); o.rx = .08 * k; o.z = .05 * k; o.sy = 1 - .04 * k; } };

  // ---------- Rock Fetch: Earth, signature, two hits ----------
  // The Pebblepup line noses a rock out of the ground, carries it up in its mouth, and flings it with a toss of its head;
  // then fetches a second one, quicker. The first landing shows its own hit; the move resolves on the second.
  MOVES3D.define('rockfetch', (h) => async (u, t) => {
    const { V, fx } = h, Hh = h.H(u), d = h.flat(u.home, t.home), sd = h.sideOf(d);
    const rockMat = h.toon('#ffffff');
    const mkRock = () => h.solid((B) => {
      B.add(STONE, rockMat, null, [G.rand(0, 3), G.rand(0, 3), 0], [1, .82, .92], { tint: (v, n) => KIT.rgb(n.y > .5 ? '#a4a4ae' : n.y > -.2 ? '#7a7a84' : '#55555f'), ink: .9 });
      B.add(STONE, rockMat, [.55, .35, .2], [1, 2, 0], .32, { tint: '#8a8a94', ink: .7 });
    });
    const shards = (at, n) => {
      fx.burst('dust', at, n, { speed: 90, colors: [EARTH[0], EARTH[1], '#8a8a94', '#6a6a74'], size: 6, g: 220, up: .6, life: .6 });
      fx.burst('dust', at.clone().setY(2), Math.round(n * .7), { speed: 40, colors: ['#e8dcc0', EARTH[0]], size: 9, g: 20, spread: 8, up: .3, life: .7 });
      h.ring(at, EARTH[0], { face: 'cam', r0: 3, r1: 22, dur: .3, thick: .1 });
    };
    const fetch = async (i) => {
      const quick = i > 0 ? .75 : 1, rs = Hh * .13;
      // nose to the dirt: the rock pops up out of the ground and into its mouth
      u.model.play('rockfetchdip'); CC.sfx('bump');
      const r = mkRock(); r.scale.setScalar(.01);
      const mouth = new THREE.Vector3(), ground = u.model.mouth(mouth).clone().setY(0);
      h.dust(ground, 8, 6); fx.burst('dust', ground.clone().setY(1), 6, { speed: 50, colors: [EARTH[1], EARTH[2]], size: 5, g: 200, up: .9, life: .4 });
      await G.tween(.26 * quick, (k) => { u.model.mouth(mouth); r.position.lerpVectors(ground, mouth, G.easeOut(k)); r.position.y += Math.sin(k * PI) * Hh * .12 - rs * .5 * k; r.scale.setScalar(rs * Math.min(1, .2 + k * 1.2)); r.rotation.y += G.dt * 6; });
      // carried in its mouth while it rears back, and let go at the toss
      const hold = h.every(() => { u.model.mouth(r.position); r.position.y -= rs * .5; });
      CC.sfx('throw');
      await h.act(u, 'rockfetchfling');
      hold();
      const from = r.position.clone(), to = h.center(t, .45).addScaledVector(sd, (i ? -1 : 1) * Hh * .1).add(V(0, G.rand(-2, 3), 0));
      await h.throwIt(r, from, to, .28 * quick, Hh * .55, [14, 9, 6], (p) => { if (Math.random() < .5) fx.emit({ x: p.x, y: p.y, z: p.z, vy: 8, life: .3, size: 5, shape: 'dust', color: EARTH[0] }); });
      h.drop(r);
      shards(to, i ? 16 : 12);
      return to;
    };
    const at = await fetch(0);
    // the first hit, shown here (the battle shows the second)
    t.model.play('hit'); t.model.flash(.9, '#ffffff'); h.impact('Earth', at, false); CC.sfx('hit');
    await G.sleep(.12);
    await fetch(1);
  });

  // ---------- Dewdrop Dash: Water, signature, always goes first ----------
  // Water beads all over the Dewt line, it stretches long and low and zig-zags in at the foe in a blur of droplets,
  // leaving watery afterimages, and bursts against it in a splash; then darts home.
  MOVES3D.define('dewdropdash', (h) => async (u, t) => {
    const { V, fx } = h, Hh = h.H(u), root = u.model.root;
    await h.act(u, 'crouch'); CC.sfx('shoot');
    // beads of water gather on its skin
    u.model.flash(.7, WATER[0]);
    const c0 = h.center(u, .45);
    for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, r = Hh * G.rand(.5, .8); fx.emit({ x: c0.x + Math.cos(a) * r, y: c0.y + G.rand(-.4, .5) * Hh, z: c0.z + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vz: -Math.sin(a) * r * 4, vy: G.rand(-10, 10), life: .22, size: G.rand(5, 8), shape: 'bubble', color: G.pick([WATER[0], '#ffffff']) }); }
    await G.sleep(.16);
    u.model.play('dewdropstretch');
    const start = root.position.clone(), end = start.clone().lerp(t.model.root.position, .7), d = h.flat(start, end), sd = h.sideOf(d);
    const legs = [start.clone().lerp(end, .3).addScaledVector(sd, Hh * .75), start.clone().lerp(end, .64).addScaledVector(sd, -Hh * .6), end];
    const trail = (p) => {
      for (let i = 0; i < 3; i++) fx.emit({ x: p.x + G.rand(-1, 1) * Hh * .3, y: G.rand(.1, .8) * Hh, z: p.z + G.rand(-1, 1) * Hh * .3, vx: -d.x * G.rand(20, 60), vz: -d.z * G.rand(20, 60), vy: G.rand(10, 50), g: 160, life: .45, size: G.rand(4, 8), shape: G.pick(['bubble', 'dust', 'glow']), color: G.pick([WATER[0], WATER[1], '#ffffff']), add: Math.random() < .3 });
    };
    let from = start.clone();
    for (let j = 0; j < legs.length; j++) {
      const to = legs[j];
      h.ghost(u, '#8fd0ff');
      if (j === legs.length - 1) u.model.play('attack');
      const a = from.clone();
      await G.tween(.085, (k) => { root.position.lerpVectors(a, to, k); root.position.y = Math.sin(k * PI) * Hh * .06; trail(root.position); });
      const p = root.position.clone().add(V(0, Hh * G.rand(.25, .6), 0)); h.streak(p, p.clone().add(a.clone().sub(to).setY(0).multiplyScalar(.9)), '#a8dcff');
      from = to.clone();
    }
    // the splash
    const at = h.center(t, .4);
    h.ring(at, '#ffffff', { face: 'cam', r0: 4, r1: 30, dur: .35, thick: .1 });
    fx.burst('bubble', at, 14, { speed: 80, colors: [WATER[0], '#ffffff'], size: 8, g: 90 });
    fx.burst('dust', at, 18, { speed: 110, colors: ['#a8dcff', '#ffffff', WATER[1]], size: 5, g: 200, up: .8 });
    await G.sleep(.08);
    return () => { h.ghost(u, '#8fd0ff'); u.model.play('hop'); return G.tween(.26, (k) => { root.position.lerpVectors(end, start, G.ease(k)); root.position.y = Math.sin(k * PI) * Hh * .12; if (Math.random() < .5) trail(root.position); }); };
  });

  // ---------- Glow Flash: Lumen, basic (shared: Sunmane, Sylvantail, ...) ----------
  // A warm glow swells at the creature's chest, flares, and rolls across into the foe as a bright flash.
  MOVES3D.define('glowflash', (h) => async (u, t) => {
    const { V, fx } = h, Hh = h.H(u), d = h.flat(u.home, t.home);
    u.model.play('cast'); CC.sfx('shoot');
    const w = (CREATURE_DEFS[u.mon.id].width || .5) * u.scale;
    const chest = h.center(u, .45).addScaledVector(d, w * .45);
    const g1 = h.glow('#ffe49a', 4), g2 = h.glow('#ffffff', 2); g1.position.copy(chest); g2.position.copy(chest);
    const L = h.add(new THREE.PointLight('#ffd880', 0, Hh * 3, 2)); L.position.copy(chest);
    u.model.flash(.6, '#fff0b0');
    await G.tween(.3, (k) => {
      g1.scale.setScalar(4 + Hh * .8 * k); g2.scale.setScalar(2 + Hh * .35 * k); L.intensity = 1.6 * k;
      if (Math.random() < .7) { const a = Math.random() * TAU, r = Hh * .7; fx.emit({ x: chest.x + Math.cos(a) * r, y: chest.y + G.rand(-.5, .5) * r, z: chest.z + Math.sin(a) * r, vx: -Math.cos(a) * r * 3.5, vz: -Math.sin(a) * r * 3.5, life: .28, size: 6, shape: 'sparkle', color: G.pick([LUMEN[0], LUMEN[1], '#ffffff']), add: true }); }
    });
    h.ring(chest, '#ffe49a', { face: 'cam', r0: 3, r1: Hh * .9, dur: .3, thick: .12 });
    h.flash(chest, '#fff4c8', Hh * 1.4, .25);
    const to = h.center(t, .5);
    await G.tween(.15, (k) => { g1.position.lerpVectors(chest, to, k); g2.position.copy(g1.position); L.position.copy(g1.position); fx.emit({ x: g1.position.x, y: g1.position.y, z: g1.position.z, life: .3, size: 9, shape: 'glow', color: '#ffe49a', add: true }); });
    h.flash(to, '#fff4c0', Hh * 2, .35); h.flash(to, '#ffc850', Hh * 1.2, .5);
    fx.burst('sparkle', to, 14, { speed: 90, colors: [LUMEN[0], LUMEN[1], '#ffffff'], size: 9, add: true, g: 0 });
    h.drop(g1); h.drop(g2);
    G.tween(.3, (k) => { L.intensity = 1.6 * (1 - k); }).then(() => h.drop(L));
  });

  // ---------- Radiant Beam: Lumen, strong (shared) ----------
  // Light streams in and gathers into a blazing ball at the creature's mouth, then it leans in and fires a thick
  // golden beam into the foe, rings of light racing along it; the beam thins and fades as it settles.
  MOVES3D.define('radiantbeam', (h) => async (u, t) => {
    const { V, fx } = h, Hh = h.H(u), tmp = new THREE.Vector3();
    u.model.play('radiantbeamcharge'); CC.sfx('statup');
    const orb = h.glow('#ffe08a', 3), core = h.glow('#ffffff', 1.5);
    const L = h.add(new THREE.PointLight('#ffd070', 0, Hh * 4, 2));
    const ball = h.add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), h.own(new THREE.MeshBasicMaterial({ color: '#fff2c0' })))); ball.renderOrder = 9; ball.scale.setScalar(.01);
    const follow = () => { u.model.mouth(tmp); orb.position.copy(tmp); core.position.copy(tmp); L.position.copy(tmp); ball.position.copy(tmp); };
    const pull = h.every(() => { follow(); for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, e = G.rand(-.8, .8), r = Hh * G.rand(.7, 1.1); fx.emit({ x: tmp.x + Math.cos(a) * Math.cos(e) * r, y: tmp.y + Math.sin(e) * r, z: tmp.z + Math.sin(a) * Math.cos(e) * r, vx: -Math.cos(a) * Math.cos(e) * r * 3.3, vy: -Math.sin(e) * r * 3.3, vz: -Math.sin(a) * Math.cos(e) * r * 3.3, life: .3, size: G.rand(5, 8), shape: G.pick(['sparkle', 'glow']), color: G.pick([LUMEN[0], LUMEN[1], '#ffffff']), add: true }); } });
    await G.tween(.7, (k) => { orb.scale.setScalar(3 + Hh * .9 * k); core.scale.setScalar(1.5 + Hh * .4 * k); L.intensity = 2 * k; ball.scale.setScalar(.01 + Hh * .075 * G.easeOut(k) * (1 + .08 * Math.sin(k * 60))); });
    pull();
    u.model.play('radiantbeamfire'); CC.sfx('superhit');
    await G.sleep(.1);
    follow();
    const from = tmp.clone(), to = h.center(t, .5), dir = to.clone().sub(from), len = dir.length(); dir.normalize();
    const R = Math.max(3.2, Hh * .13);
    const outerM = h.streamMat('#ffe49a', '#e0a030', '#fff8e0', { add: true, stripe: 18, speed: 24, wob: .8 }); outerM.uniforms.uOp.value = .45;
    const innerM = h.streamMat('#fff6d0', '#f0c850', '#ffffff', { add: true, stripe: 30, speed: 40, wob: .3 });
    const end = to.clone().addScaledVector(dir, R);
    const pts = [from, from.clone().lerp(end, .5), end];
    const outer = h.stream(pts, (k) => R * 1.9 * (.55 + .45 * sm(0, .12, k)), outerM, 30);
    const inner = h.stream(pts, (k) => R * (.6 + .4 * sm(0, .1, k)), innerM, 30);
    const head = h.glow('#fff4c0', R * 5);
    await Promise.all([inner.grow(.16, head), outer.grow(.18)]);
    h.drop(head); env_shake(h, 4);
    // holding the beam: rings race down it, the light splashes off the foe
    const hit = h.glow('#fff4c0', R * 7); hit.position.copy(to);
    const rings = h.every(() => { if (Math.random() < .25) h.ring(from.clone().addScaledVector(dir, R), '#fff0b0', { face: dir, r0: R * 1.3, r1: R * 2.4, dur: .32, move: dir.clone().multiplyScalar(len * .9), op: .8, thick: .1 }); if (Math.random() < .8) fx.emit({ x: to.x, y: to.y, z: to.z, vx: G.rand(-90, 90), vy: G.rand(-30, 90), vz: G.rand(-90, 90), g: 60, life: .4, size: G.rand(6, 10), shape: 'sparkle', color: G.pick([LUMEN[0], '#ffffff', LUMEN[1]]), add: true }); });
    await G.tween(.4, (k) => { hit.scale.setScalar(R * (6 + 2 * Math.sin(k * 40))); orb.scale.setScalar(Hh * .7 * (1 + .1 * Math.sin(k * 50))); });
    rings();
    return () => {
      u.model.play('radiantbeamend');
      return Promise.all([inner.fade(.35), outer.fade(.3), G.tween(.35, (k) => { orb.scale.setScalar(Hh * .7 * (1 - k) + .01); core.scale.setScalar(Hh * .3 * (1 - k) + .01); hit.scale.setScalar(R * 6 * (1 - k) + .01); L.intensity = 2 * (1 - k); ball.scale.setScalar(Hh * .075 * (1 - k) + .01); })]).then(() => { h.drop(ball); h.drop(orb); h.drop(core); h.drop(hit); h.drop(L); });
    };
  });
  const env_shake = (h, k) => { if (h.env && h.env.shake) h.env.shake(k); };
})();
