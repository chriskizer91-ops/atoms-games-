// movesets/meadow.js: the Meadow batch's signature moves. Cheek Stash (Puffmunk, Stashmunk: a quick bite, and the berries
// it knocks loose fly back into its cheeks), Wool Puff (the sheep: the cloud wool swells up and bumps the target), Lucky
// Leaf (Clove Tastical: the clover off its hood grows, spins and flies), Fantastic Hop (Hoppin Pop: a huge hop and a kick).
(() => {
  'use strict';
  const { PI, TAU, sm } = KIT;
  // body actions for these moves (the creatures' own act() moves their cheeks, wool and legs under the same names)
  CREATURE_ACTIONS.cheekstash = { dur: .9, f(u, o) { const k = Math.sin(u * PI); o.sx = o.sz = 1 + .07 * k; o.sy = 1 - .03 * k + .03 * Math.sin(u * 30) * k; o.ry = .14 * Math.sin(u * 22) * k; o.y = .03 * Math.abs(Math.sin(u * PI * 3)) * (1 - u); } };
  CREATURE_ACTIONS.woolpuff = { dur: .9, f(u, o) { const a = Math.sin(Math.min(1, u / .45) * PI / 2) * (1 - .8 * sm(.55, 1, u)); o.sx = o.sz = 1 + .12 * a; o.sy = 1 + .07 * a + .03 * Math.sin(u * 40) * a; o.y = .02 * a; } };
  CREATURE_ACTIONS.fantastichop = { dur: .55, hit: .2, f(u, o) { const k = Math.sin(u * PI); o.rx = .4 * k; o.y = -.03 * k; o.sy = 1 - .08 * k; o.sz = 1 + .08 * k; } };

  const HEART = [[0, 0], [3, 3], [4.6, 6], [3.6, 8.2], [1.5, 8.7], [0, 7.2], [-1.5, 8.7], [-3.6, 8.2], [-4.6, 6], [-3, 3]];

  // ---------- Cheek Stash ----------
  MOVES3D.define('cheekstash', (h) => {
    const { V, fx } = h, NC = DATA.TYPE_COLORS.Normal;
    const berry = (r) => h.solid((B) => {
      B.add(new THREE.SphereGeometry(r, 14, 10), h.toon('#ffffff'), null, null, null, { tint: (v, n) => KIT.rgb(n.y > .55 ? '#ff9a8a' : n.y > -.25 ? '#e0242a' : '#a01418') });
      B.add(new THREE.CylinderGeometry(r * .12, r * .12, r * .7, 5), h.toon('#ffffff'), [0, r * 1.1, 0], null, null, { tint: '#5a3a10', ink: .5 });
    });
    return async (u, t) => {
      await h.act(u, 'crouch'); CC.sfx('throw'); u.model.play('chomp');
      const back = await h.dash(u, t, { frac: .7, dur: .18, hop: 2 });
      const at = h.center(t, .6);
      h.ring(at, '#ffffff', { face: 'cam', r0: 3, r1: 20, dur: .25, thick: .12 });
      fx.burst('star', at, 7, { speed: 70, colors: [NC[0], '#ffffff'], size: 8, add: true, g: 0 });
      return async () => {
        const home = back();
        // berries knocked loose arc back into its cheeks, each trailing a little light (the 25% it drains)
        const all = [];
        for (let i = 0; i < 4; i++) {
          const b = berry(G.rand(4, 5)), from = at.clone().add(V(G.rand(-9, 9), G.rand(-4, 8), G.rand(-6, 6))), to = new THREE.Vector3();
          b.position.copy(from); b.scale.setScalar(.01);
          all.push(G.sleep(.04 + i * .09).then(() => G.tween(.5, (k) => {
            u.model.mouth(to); b.position.lerpVectors(from, to, G.ease(k)); b.position.y += Math.sin(k * PI) * (16 + i * 5);
            b.scale.setScalar(Math.min(1, k * 5) * (1 - .5 * sm(.8, 1, k))); b.rotation.x += G.dt * 9; b.rotation.z += G.dt * 5;
            if (Math.random() < .7) fx.emit({ x: b.position.x, y: b.position.y, z: b.position.z, life: .35, size: G.rand(4, 7), shape: 'sparkle', color: G.pick(['#ffffff', NC[0], '#ffd0c8']), add: true });
          })).then(() => { h.drop(b); fx.burst('sparkle', to, 4, { speed: 30, colors: ['#ffffff', '#ffe0d8'], size: 6, add: true, g: 0 }); }));
        }
        await home;
        u.model.play('cheekstash'); CC.sfx('heal');
        await Promise.all(all);
        fx.burst('sparkle', h.center(u, .75), 10, { speed: 45, colors: ['#ffffff', NC[0], '#ffd0c8'], size: 7, add: true, g: -20 });
        await G.sleep(.35);
      };
    };
  });

  // ---------- Wool Puff ----------
  MOVES3D.define('woolpuff', (h) => {
    const { V, fx } = h, NC = DATA.TYPE_COLORS.Normal;
    const bolty = (s) => ((DATA.CREATURES[s.mon.id] || {}).types || []).includes('Bolt');
    const spark = (at, n) => fx.burst('star', at, n, { speed: 110, colors: ['#fff07a', '#f0c828', '#ffffff'], size: 7, add: true, g: 0, life: .35 });
    return async (u, t) => {
      CC.sfx('statup'); u.model.play('woolpuff');
      // tufts of cloud pop off its wool as it swells
      const c0 = h.center(u, .5), R = h.H(u) * .5, d = h.flat(u.home, t.home), sd = h.sideOf(d);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + G.rand(-.3, .3), dir = sd.clone().multiplyScalar(Math.cos(a)).add(V(0, Math.sin(a) * .8 + .2, 0)).addScaledVector(d, G.rand(-.4, .2)).normalize();
        const p0 = c0.clone().addScaledVector(dir, R * .8), c = h.cloud(p0, { color: '#f2eee0', size: G.rand(3.5, 5), n: 3, w: 1.4, h: .8, d: 1 });
        G.sleep(i * .04).then(() => G.tween(.55, (k) => { c.op = .95 * Math.sin(k * PI); c.g.position.copy(p0).addScaledVector(dir, R * .7 * G.easeOut(k)); c.g.scale.setScalar(.5 + .8 * k); })).then(() => c.done());
      }
      if (bolty(u)) for (let i = 0; i < 3; i++) G.sleep(.1 + i * .12).then(() => spark(c0.clone().add(V(G.rand(-R, R) * .6, G.rand(-R, R) * .5, 0)), 4));
      await G.sleep(.45);
      CC.sfx('throw'); u.model.play('attack');
      const back = await h.dash(u, t, { frac: .64, dur: .22, hop: 6 });
      // a soft, big bump: a burst of cloud where it lands
      const at = h.center(t, .5), c = h.cloud(at, { color: '#f4f0e4', size: 8, n: 8, w: 2.4 });
      G.tween(.55, (k) => { c.op = .9 * (1 - k); c.g.scale.setScalar(.6 + 1.1 * G.easeOut(k)); }).then(() => c.done());
      h.ring(at, '#ffffff', { face: 'cam', r0: 4, r1: 32, dur: .35, thick: .14 });
      fx.burst('dust', at, 14, { speed: 90, colors: ['#ffffff', NC[0], '#d8e0f0'], size: 7, g: 40, up: .4, life: .5 });
      if (bolty(u)) spark(at, 10);
      return async () => {
        await back();
        // the wool settles, thicker than before
        u.model.play('puff');
        h.ring(u.model.root.position.clone().setY(2), '#e8e4d8', { r0: R * .4, r1: R * 1.6, dur: .5, normal: true, op: .6, thick: .16 });
        fx.burst('sparkle', h.center(u, .6), 8, { speed: 40, colors: ['#ffffff', NC[0]], size: 7, add: true, g: -10 });
        await G.sleep(.3);
      };
    };
  });

  // ---------- Lucky Leaf ----------
  MOVES3D.define('luckyleaf', (h) => {
    const { V, fx } = h, PC = DATA.TYPE_COLORS.Plant;
    const heart = KIT.slab(HEART, .8, .3);
    const clover = () => {
      const inner = h.solid((B) => {
        for (let i = 0; i < 4; i++) B.add(heart, h.toon('#ffffff'), [0, 0, 0], [0, 0, i * PI / 2 + PI / 4], null, { tint: (v) => KIT.rgb(Math.abs(v.x * Math.cos(i * PI / 2 + PI / 4) + v.y * Math.sin(i * PI / 2 + PI / 4)) < .5 ? '#a8e050' : '#4eaa30') });
        B.add(new THREE.SphereGeometry(1.4, 10, 8), h.toon('#ffffff'), [0, 0, .3], null, [1, 1, .5], { tint: '#3a7a22' });
        B.add(new THREE.CylinderGeometry(.5, .35, 6, 5), h.toon('#ffffff'), [0, -4.5, 0], [0, 0, .3], null, { tint: '#3a7a22' });
      });
      h.S.remove(inner); const outer = h.add(new THREE.Group()); outer.add(inner); return { outer, inner };
    };
    return async (u, t) => {
      CC.sfx('shiny'); u.model.play('cast');
      // the clover lifts off its hood and grows, spinning, shedding golden sparkles
      const hc = u.model.parts.clover, top = h.center(u, 1.2), start = new THREE.Vector3();
      if (hc) { u.model.root.updateMatrixWorld(true); hc.getWorldPosition(start); hc.visible = false; } else start.copy(top);
      const c = clover(); c.outer.position.copy(start); c.outer.scale.setScalar(.25);
      await G.tween(.5, (k) => {
        const e = G.easeOut(k); c.outer.position.lerpVectors(start, top, e); c.outer.scale.setScalar(.25 + 1.1 * e);
        c.outer.lookAt(h.env.camera.position); c.inner.rotation.z += G.dt * (6 + 14 * k);
        if (Math.random() < .8) { const a = Math.random() * TAU, r = 12 * e + 4; fx.emit({ x: top.x + Math.cos(a) * r, y: c.outer.position.y + Math.sin(a) * r, z: top.z, vy: 10, life: .4, size: G.rand(5, 8), shape: 'sparkle', color: G.pick(['#fff4a0', '#ffe060', '#ffffff', PC[0]]), add: true }); }
      });
      h.flash(top, '#fff4a0', 34, .25); CC.sfx('shoot');
      // thrown: spinning flat like a disc on a curving path, a trail of luck behind it
      const from = c.outer.position.clone(), to = h.center(t, .55), sd = h.sideOf(h.flat(u.home, t.home));
      const path = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(to, .5).addScaledVector(sd, 30).add(V(0, 16, 0)), to);
      c.outer.rotation.set(-PI / 2 + .55, 0, 0); c.inner.rotation.set(0, 0, 0);
      await G.tween(.42, (k) => {
        path.getPoint(k, c.outer.position); c.inner.rotation.z += G.dt * 26; c.outer.rotation.z = Math.sin(k * PI) * .4;
        for (let i = 0; i < 2; i++) fx.emit({ x: c.outer.position.x + G.rand(-3, 3), y: c.outer.position.y + G.rand(-3, 3), z: c.outer.position.z + G.rand(-3, 3), vy: G.rand(-6, 6), life: .45, size: G.rand(5, 9), shape: G.pick(['sparkle', 'leaf']), color: G.pick(['#fff4a0', '#ffe060', PC[0], PC[1]]), add: true, spin: 6 });
      });
      // a lucky strike: gold stars and the clover bursting into leaves
      h.drop(c.outer);
      h.flash(to, '#fff0a0', 56, .35);
      h.ring(to, '#ffe070', { face: 'cam', r0: 4, r1: 34, dur: .4, thick: .12 });
      fx.burst('star', to, 12, { speed: 100, colors: ['#fff4a0', '#ffe060', '#ffffff'], size: 10, add: true, g: 10 });
      fx.burst('leaf', to, 12, { speed: 80, colors: [PC[0], PC[1], '#7ac840'], size: 10, g: 60, spin: 10 });
      // and a new clover sprouts on its hood
      if (hc) G.sleep(.35).then(() => { hc.visible = true; u.model.root.updateMatrixWorld(true); const p = hc.getWorldPosition(new THREE.Vector3()); fx.burst('sparkle', p, 8, { speed: 35, colors: ['#fff4a0', PC[0], '#ffffff'], size: 7, add: true, g: -10 }); });
    };
  });

  // ---------- Fantastic Hop ----------
  MOVES3D.define('fantastichop', (h) => {
    const { V, fx } = h, PC = DATA.TYPE_COLORS.Plant;
    const PETAL = ['#f48c9c', '#fcd2d2', '#e8708a'];
    return async (u, t) => {
      await h.act(u, 'crouch'); CC.sfx('throw');
      const root = u.model.root;
      h.dust(root.position, 14, 12);
      h.ring(root.position.clone().setY(1.5), '#f4ecd8', { r0: 6, r1: 44, dur: .4, normal: true, op: .6, thick: .12 });
      // up, higher than it has ever hopped, shedding petals and leaves
      const shed = h.every(() => { if (Math.random() < .6) { const p = root.position; fx.emit({ x: p.x + G.rand(-10, 10), y: p.y + h.H(u) * G.rand(.3, .8), z: p.z + G.rand(-8, 8), vx: G.rand(-20, 20), vy: G.rand(-10, 20), g: 40, drag: 1, life: .8, size: G.rand(7, 10), shape: 'leaf', color: G.pick([...PETAL, PC[0], PC[1]]), spin: 8 }); } });
      const back = await h.leap(u, t, { frac: .76, height: h.H(u) * (u.isFoe ? 1.05 : 1.35), up: .45, hang: .12, down: .14, spin: 1 });
      shed();
      // the kick: it comes down hind feet first
      u.model.play('fantastichop'); CC.sfx('superhit');
      const at = h.center(t, .55);
      h.ring(t.model.root.position.clone().setY(1.5), '#ffffff', { r0: 6, r1: 50, dur: .4, op: .8 });
      h.ring(at, PC[0], { face: 'cam', r0: 4, r1: 30, dur: .35, thick: .12 });
      fx.burst('leaf', at, 16, { speed: 110, colors: [...PETAL, PC[0]], size: 10, g: 60, spin: 10 });
      h.env.shake(4);
      return async () => {
        await back();
        // faster now: two quick little hops in place, speed lines streaming off
        const d = h.flat(u.home, t.home);
        for (let i = 0; i < 2; i++) {
          u.model.play('hop');
          for (let j = 0; j < 3; j++) { const p = root.position.clone().add(V(0, h.H(u) * G.rand(.2, .7), 0)).addScaledVector(h.sideOf(d), G.rand(-14, 14)); h.streak(p, p.clone().addScaledVector(d, -G.rand(20, 34)), '#e8ffd0'); }
          await G.sleep(.2);
        }
      };
    };
  });
})();
