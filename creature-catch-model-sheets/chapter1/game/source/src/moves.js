// moves.js: every move the opening's creatures know, staged in 3D. Each move is the creature's own body motion (rearing
// back to spit, a tongue lash, a crouch and leap, curling into a shell) and its effect, built from a few kinds of thing:
//   streams    a tube along a curve that grows from the mouth to the target and pulls in after (water jets, the fire whip,
//              vines, the big wave), painted by a shader with moving stripes
//   projectiles  cel-shaded, ink-outlined meshes thrown along arcs (leaves, darts, fireballs, thorns)
//   rings, clouds, shields, auras, afterimages, flashes, and the particle layer (fx.js)
// MOVES3D.make(env) -> { play(id, user, target) -> Promise<back | undefined>, impact(type, at, big), update(dt) }
//   env: { scene, fx, camera, top(side, up), shake(k) }; a side: { model, home, scale, isFoe, mon }
//   play resolves the moment the move lands (when damage shows); a returned back() finishes it (a dash home, a stream
//   pulling in), and runs alongside the hit.
const MOVES3D = (() => {
  'use strict';
  const { lerp, sm, PI, TAU } = KIT;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // moves added by other files: MOVES3D.define(id, (h) => async (user, target) => back | undefined), where h holds the helpers below
  const DEFS = {};
  const define = (id, factory) => { DEFS[id] = factory; };
  function make(env) {
    const S = env.scene, fx = env.fx;
    const U = { uT: { value: 0 } };
    const live = new Set();
    const every = (fn) => { live.add(fn); return () => live.delete(fn); };
    function update(dt) { U.uT.value += dt; for (const f of [...live]) f(dt); }
    const add = (o) => { S.add(o); return o; };
    const drop = (o) => { if (!o) return; S.remove(o); o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material && m.material.userData.own) m.material.dispose(); }); };
    const own = (m) => { m.userData.own = true; return m; };
    const INK = KIT.inkMat({ k: 55 });
    const toon = (c, o) => own(KIT.toon(c, o));
    const center = (s, up) => env.top(s, up === undefined ? .45 : up);
    const flat = (a, b) => { const d = b.clone().sub(a); d.y = 0; return d.normalize(); };
    const sideOf = (d) => V(-d.z, 0, d.x);
    const toCam = (p) => env.camera.position.clone().sub(p).normalize();
    const H = (s) => s.scale * CREATURE_DEFS[s.mon.id].height;
    // a body motion, resolving at its hit moment (or its end)
    const act = (s, name) => new Promise((ok) => { let done = false; const fin = () => { if (!done) { done = true; ok(); } }; s.model.play(name, fin).then(fin); });

    // ---------- pieces ----------
    function glow(color, size, op) {
      const s = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: KIT.glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op === undefined ? 1 : op })));
      s.scale.setScalar(size); s.renderOrder = 8; return add(s);
    }
    function flash(at, color, size, dur) { const g = glow(color, size * .4); g.position.copy(at); return G.tween(dur || .3, (k) => { g.scale.setScalar(size * (.4 + .6 * G.easeOut(k))); g.material.opacity = 1 - k; }).then(() => drop(g)); }
    // a ring that grows and fades: on the ground, or facing a direction (face), or toward the camera (face: 'cam')
    function ring(at, color, o) {
      o = o || {};
      const m = add(new THREE.Mesh(new THREE.TorusGeometry(1, o.thick || .07, 6, 44), own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o.op || .9, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }))));
      m.position.copy(at); m.renderOrder = 7;
      if (o.face === 'cam') m.lookAt(env.camera.position); else if (o.face) m.lookAt(at.clone().add(o.face)); else m.rotation.x = PI / 2;
      const r0 = o.r0 || 2, r1 = o.r1 || 30, move = o.move || null;
      return G.tween(o.dur || .5, (k) => { const r = lerp(r0, r1, G.easeOut(k)); m.scale.set(r, r, r); m.material.opacity = (o.op || .9) * (1 - k * k); if (move) m.position.copy(at).addScaledVector(move, k); }).then(() => drop(m));
    }
    // a stream: a tube along a curve, its visible stretch from uTail to uHead (0 to 1 along it)
    function streamMat(c1, c2, core, o) {
      o = o || {};
      return own(new THREE.ShaderMaterial({
        uniforms: { uHead: { value: 0 }, uTail: { value: 0 }, uT: U.uT, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) }, uC3: { value: new THREE.Color(core) }, uOp: { value: 1 }, uWob: { value: o.wob || 0 }, uStripe: { value: o.stripe || 30 }, uSpeed: { value: o.speed || 12 } },
        vertexShader: 'uniform float uT; uniform float uWob; varying vec2 vUv; varying vec3 vN; varying vec3 vV;\n' +
          'void main() { vUv = uv; vec3 p = position + normal * uWob * sin(uv.x * 46.0 - uT * 20.0 + uv.y * 6.283); vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform float uHead; uniform float uTail; uniform float uT; uniform float uOp; uniform float uStripe; uniform float uSpeed; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; varying vec2 vUv; varying vec3 vN; varying vec3 vV;\n' +
          'void main() { float a = smoothstep(uTail, uTail + 0.06, vUv.x) * (1.0 - smoothstep(uHead - 0.03, uHead, vUv.x)); if (a < 0.01) discard;\n' +
          ' float st = 0.5 + 0.5 * sin(vUv.x * uStripe - uT * uSpeed + vUv.y * 12.566); float face = abs(dot(normalize(vN), normalize(vV)));\n' +
          ' vec3 c = mix(uC2, uC1, smoothstep(0.15, 0.55, face)); c = mix(c, uC3, smoothstep(0.7, 1.0, face) * 0.55 + step(0.82, st) * 0.45);\n' +
          ' gl_FragColor = vec4(c, a * uOp * (face < 0.2 ? 1.0 : 0.92)); }',
        transparent: true, depthWrite: !!o.solid, side: THREE.DoubleSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
      }));
    }
    function stream(pts, rFn, mat, segs) {
      const m = add(new THREE.Mesh(KIT.tube(pts.map((p) => [p.x, p.y, p.z]), segs || 64, 12, rFn), mat)); m.renderOrder = 6; m.frustumCulled = false;
      const curve = new THREE.CatmullRomCurve3(pts);
      return { m, curve, mat, grow(dur, head) { return G.tween(dur, (k) => { mat.uniforms.uHead.value = k * 1.06; if (head) curve.getPointAt(Math.min(1, k), head.position); }); },
        pull(dur) { return G.tween(dur, (k) => { mat.uniforms.uTail.value = k * 1.05; }).then(() => drop(m)); },
        fade(dur) { return G.tween(dur, (k) => { mat.uniforms.uOp.value = 1 - k; }).then(() => drop(m)); } };
    }
    // a cel-shaded, outlined mesh built from the kit (for leaves, darts, thorns, clovers)
    function solid(fn) { const g = new THREE.Group(), B = KIT.builder(); fn(B); B.build(g, INK); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return add(g); }
    const LEAF = KIT.slab([[0, 0], [2.4, 2.2], [3.2, 5.2], [2.4, 8], [0, 10.2], [-2.4, 8], [-3.2, 5.2], [-2.4, 2.2]], .6, .2);
    const leafMesh = (c) => solid((B) => { B.add(LEAF, toon('#ffffff'), [0, -5, 0], null, null, { tint: (v) => KIT.rgb(Math.abs(v.x) < .35 ? '#3e8a2a' : c || '#6ac84a') }); });
    // thrown along an arc from a to b; spin: radians per second; trail(p): called each frame with its position
    function throwIt(o, a, b, dur, arc, spin, trail) {
      return G.tween(dur, (k) => {
        o.position.lerpVectors(a, b, k); o.position.y += Math.sin(k * PI) * (arc || 0);
        if (spin) { o.rotation.x += spin[0] * G.dt; o.rotation.y += spin[1] * G.dt; o.rotation.z += spin[2] * G.dt; }
        else if (o.userData.point) { const vel = b.clone().sub(a); vel.y += Math.cos(k * PI) * PI * (arc || 0); o.quaternion.setFromUnitVectors(V(0, 1, 0), vel.normalize()); }
        if (trail) trail(o.position, k);
      });
    }
    // a puff of lumpy clouds
    function cloud(at, o) {
      const g = add(new THREE.Group()); g.position.copy(at);
      const mat = toon(o.color, { mat: { transparent: true, opacity: 0, emissive: new THREE.Color(o.emissive || '#000000'), emissiveIntensity: o.ei || 0 } });
      mat.depthWrite = false;
      for (let i = 0; i < (o.n || 7); i++) { const m = new THREE.Mesh(KIT.lumpy(o.size * (.55 + Math.random() * .5), i * 2.1, .22), mat); m.position.set((Math.random() - .5) * o.size * (o.w || 2.2), (Math.random() - .5) * o.size * (o.h || .7), (Math.random() - .5) * o.size * (o.d || 1.4)); m.userData.ph = Math.random() * 6; g.add(m); m.renderOrder = 6; }
      const stop = every((dt) => { g.children.forEach((m, i) => { m.position.y += Math.sin(U.uT.value * 2 + m.userData.ph) * .02; m.rotation.y += dt * .3; }); });
      return { g, mat, set op(v) { mat.opacity = v; }, get op() { return mat.opacity; }, done() { stop(); drop(g); } };
    }
    // a bubble of hexagons round a creature
    function shield(s, color) {
      const g = add(new THREE.Group()); g.position.copy(center(s, .45));
      const r = Math.max(H(s), s.scale * (CREATURE_DEFS[s.mon.id].width || .5)) * .78;
      const ico = new THREE.IcosahedronGeometry(1, 1);
      const fill = new THREE.Mesh(ico, own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false })));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(ico), own(new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, blending: THREE.AdditiveBlending })));
      g.add(fill, edges); g.scale.setScalar(.01); g.userData.r = r;
      return { g, fill, edges, r };
    }
    // a column of light round a creature with sparks rising (Rally, healing)
    function aura(s, c1, c2, dur, shape) {
      const h = H(s) * 1.3, r = Math.max(H(s), s.scale * (CREATURE_DEFS[s.mon.id].width || .5)) * .55, at = s.model.root.position.clone();
      const mat = own(new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uC: { value: new THREE.Color(c1) }, uOp: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uT; uniform vec3 uC; uniform float uOp; varying vec2 vUv; void main() { float s = 0.6 + 0.4 * sin(vUv.x * 50.0 + vUv.y * 8.0 - uT * 9.0); float a = (1.0 - vUv.y) * smoothstep(0.0, 0.15, vUv.y) * s; gl_FragColor = vec4(uC, a * uOp); }' }));
      const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, h, 28, 1, true), mat)); m.position.copy(at).setY(h / 2); m.renderOrder = 7;
      const stop = every(() => { if (Math.random() < .6) fx.emit({ x: at.x + G.rand(-r, r), y: G.rand(0, h * .4), z: at.z + G.rand(-r * .8, r * .8), vy: G.rand(40, 80), life: .8, size: G.rand(5, 9), shape: shape || 'sparkle', color: G.pick([c1, c2, '#ffffff']), add: true }); });
      ring(at.clone().setY(1), c2, { r0: r * .4, r1: r * 1.6, dur: .6 });
      return G.tween(dur, (k) => { mat.uniforms.uOp.value = Math.sin(k * PI) * .9; m.scale.set(1 + .1 * Math.sin(k * 20), 1, 1 + .1 * Math.sin(k * 20)); }).then(() => { stop(); drop(m); });
    }
    // ghost copies of a creature, left where it was
    function ghost(s, color) {
      // (our GLB models: a copy with its own bones, frozen in the pose it was in, drawn with a skinning material)
      const c = s.model.ghost ? s.model.ghost() : s.model.root.clone(true), mat = own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, skinning: !!s.model.ghost }));
      const kill = []; c.traverse((o) => { if (o.isLight || o.isSprite) kill.push(o); else if (o.isMesh) { if (o.material.side === THREE.BackSide) o.visible = false; else o.material = mat; } });
      kill.forEach((o) => o.parent && o.parent.remove(o)); add(c);
      return G.tween(.45, (k) => { mat.opacity = .45 * (1 - k); }).then(() => S.remove(c));
    }
    // a quick white streak along a line (speed lines)
    function streak(a, b, color) {
      const len = a.distanceTo(b), m = add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1, 5), own(new THREE.MeshBasicMaterial({ color: color || '#ffffff', transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }))));
      m.position.lerpVectors(a, b, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); m.scale.set(1, len, 1);
      return G.tween(.22, (k) => { m.material.opacity = .8 * (1 - k); m.scale.set(1 - k, len, 1 - k); }).then(() => drop(m));
    }
    const dust = (at, n, spread) => fx.burst('dust', at.clone().setY(2), n || 8, { speed: 34, colors: ['#e8dcc0', '#d8c8a0', '#f4ecd8'], size: 7, g: 30, spread: spread || 8, up: .2, life: .6 });

    // a dash at the target and home again (the returned function); o: frac of the way, dur, hop height, lines
    async function dash(u, t, o) {
      o = o || {};
      const root = u.model.root, start = root.position.clone(), end = start.clone().lerp(t.model.root.position, o.frac || .66), d = flat(start, end);
      let last = start.clone();
      await G.tween(o.dur || .2, (k) => {
        const e = k * k; root.position.lerpVectors(start, end, e); root.position.y = Math.sin(k * PI) * (o.hop || 3);
        if (o.lines !== false && k > .2) { const p = root.position.clone().add(V(0, H(u) * G.rand(.2, .7), 0)).addScaledVector(sideOf(d), G.rand(-H(u) * .4, H(u) * .4)); streak(p, p.clone().addScaledVector(d, -G.rand(18, 34))); }
        if (Math.random() < .6) dust(root.position, 2, 4);
        last.copy(root.position);
      });
      return () => G.tween(o.backDur || .32, (k) => { root.position.lerpVectors(end, start, G.ease(k)); root.position.y = Math.sin(k * PI) * 8; });
    }
    // a leap: up, across, and down onto (near) the target; spin: flips in the air
    async function leap(u, t, o) {
      const root = u.model.root, start = root.position.clone(), end = start.clone().lerp(t.model.root.position, o.frac || .82);
      const top = start.clone().lerp(end, o.apexAt || .5).setY(o.height || 70);
      if (o.spin) u.model.play('spin');
      await G.tween(o.up || .38, (k) => { const e = G.easeOut(k); root.position.lerpVectors(start, top, k); root.position.y = top.y * e; });
      if (o.hang) await G.sleep(o.hang);
      await G.tween(o.down || .16, (k) => { root.position.lerpVectors(top, end, k * k); if (Math.random() < .8) streak(root.position.clone().add(V(0, H(u) * .5, 0)), root.position.clone().add(V(0, H(u) * .5 + 26, 0)).addScaledVector(flat(start, end), -14)); });
      return () => G.tween(.38, (k) => { root.position.lerpVectors(end, start, G.ease(k)); root.position.y = Math.sin(k * PI) * 22; });
    }

    // ---------- landing: what a hit looks like, by type ----------
    function impact(type, at, big) {
      const k = big ? 1.5 : 1;
      flash(at, '#ffffff', 30 * k, .22);
      env.shake(big ? 5 : 2.5);
      if (type === 'Water') {
        ring(at, '#8fd0ff', { face: 'cam', r0: 4, r1: 24 * k, dur: .4, thick: .12 });
        fx.burst('bubble', at, 12 * k, { speed: 70, colors: ['#8fd0ff', '#ffffff', '#3a8ee8'], size: 8, g: 60, add: false });
        fx.burst('dust', at, 16 * k, { speed: 90, colors: ['#a8dcff', '#ffffff'], size: 4, g: 160, up: .8 });
      } else if (type === 'Fire') {
        flash(at, '#ff8a2a', 46 * k, .4);
        ring(at, '#ffb040', { face: 'cam', r0: 4, r1: 26 * k, dur: .4, thick: .14 });
        fx.burst('ember', at, 18 * k, { speed: 80, colors: ['#ffe070', '#ff9a30', '#ff5a20'], size: 10, add: true, g: -20 });
      } else if (type === 'Plant') {
        ring(at, '#a8e88a', { face: 'cam', r0: 4, r1: 22 * k, dur: .4 });
        fx.burst('leaf', at, 12 * k, { speed: 80, colors: ['#a8e88a', '#4fb04a', '#6ac84a'], size: 9, g: 60, spin: 10 });
      } else if (type === 'Bolt') {
        flash(at, '#fff07a', 40 * k, .3);
        ring(at, '#fff07a', { face: 'cam', r0: 4, r1: 24 * k, dur: .32, thick: .1 });
        fx.burst('star', at, 14 * k, { speed: 110, colors: ['#fff07a', '#ffffff', '#f0c828'], size: 8, add: true, g: 0 });
      } else if (type === 'Earth') {
        ring(at.clone().setY(1.5), '#e0c08a', { r0: 4, r1: 26 * k, dur: .45, thick: .14 });
        fx.burst('dust', at, 18 * k, { speed: 80, colors: ['#e0c08a', '#a8784a', '#6a4a2c'], size: 7, g: 140, up: .6 });
      } else if (type === 'Lumen') {
        flash(at, '#fff4c0', 50 * k, .4);
        ring(at, '#fff4c0', { face: 'cam', r0: 4, r1: 28 * k, dur: .45, thick: .1 });
        fx.burst('sparkle', at, 14 * k, { speed: 70, colors: ['#fff8d8', '#f0dc8a', '#ffffff'], size: 9, add: true, g: -10 });
      } else if (type === 'Shadow') {
        ring(at, '#6e46a0', { face: 'cam', r0: 4, r1: 24 * k, dur: .4, thick: .16 });
        fx.burst('glow', at, 12 * k, { speed: 70, colors: ['#b48ad8', '#6e46a0', '#3a2260'], size: 10, add: false, g: -10 });
      } else {
        ring(at, '#ffffff', { face: 'cam', r0: 3, r1: 22 * k, dur: .3, thick: .1 });
        fx.burst('star', at, 10 * k, { speed: 80, colors: ['#ffffff', '#fff4c0'], size: 9, add: true, g: 20 });
      }
    }

    // ---------- the moves ----------
    const M = {};
    // Normal
    M.tackle = async (u, t) => {
      await act(u, 'crouch'); CC.sfx('throw'); u.model.play('attack');
      return dash(u, t, { frac: .68, dur: .2 });
    };
    M.struggle = M.tackle;
    M.bodyslam = async (u, t) => {
      await act(u, 'crouch'); CC.sfx('throw'); u.model.play('tuck');
      const back = await leap(u, t, { frac: .8, height: H(u) * (u.isFoe ? .85 : 1.2), up: .42, down: .15 });
      u.model.play('hop'); dust(u.model.root.position, 18, 14);
      ring(u.model.root.position.clone().setY(1.5), '#f4ecd8', { r0: 6, r1: 60, dur: .5, normal: true, op: .7, thick: .12 });
      env.shake(7);
      return back;
    };
    M.growl = async (u, t) => {
      u.model.play('roar'); CC.sfx('status');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t), d = to.clone().sub(from);
      for (let i = 0; i < 3; i++) setTimeout(() => ring(from, '#ffffff', { face: d, r0: 3, r1: 26, dur: .55, move: d.clone().multiplyScalar(.85), op: .8, thick: .09 }), i * 170);
      await G.sleep(.7); t.model.play('shake'); await G.sleep(.4);
    };
    M.rally = async (u) => { u.model.play('puff'); CC.sfx('statup'); await aura(u, '#ff8a3a', '#ffd060', 1.0); };
    M.guardup = async (u) => {
      u.model.play('curl'); CC.sfx('statup');
      const sh = shield(u, '#7ac8ff');
      await G.tween(.3, (k) => { sh.g.scale.setScalar(sh.r * (k < .7 ? k / .7 * 1.15 : lerp(1.15, 1, (k - .7) / .3))); });
      await G.tween(.6, (k) => { sh.g.rotation.y += G.dt * 1.2; sh.edges.material.opacity = .6 + .4 * Math.sin(k * 30); sh.fill.material.opacity = .14 + .1 * Math.sin(k * 15); });
      await G.tween(.25, (k) => { sh.g.scale.setScalar(sh.r * (1 + .2 * k)); sh.edges.material.opacity = .9 * (1 - k); sh.fill.material.opacity = .2 * (1 - k); });
      drop(sh.g);
    };
    M.quickstep = async (u, t) => {
      CC.sfx('shoot'); u.model.play('hop');
      const root = u.model.root, start = root.position.clone(), sd = sideOf(flat(u.home, t.home));
      for (const [o, b] of [[22, 0], [-22, 0], [12, 0], [0, 0]]) {
        ghost(u, '#ffffff'); const from = root.position.clone(), to = start.clone().addScaledVector(sd, o);
        await G.tween(.09, (k) => { root.position.lerpVectors(from, to, k); }); dust(root.position, 3, 3);
      }
      await G.sleep(.2);
    };
    M.luckynibble = async (u, t) => {
      CC.sfx('shiny');
      const c = solid((B) => { const heart = KIT.slab([[0, 0], [3, 3], [4.6, 6], [3.6, 8.2], [1.5, 8.7], [0, 7.2], [-1.5, 8.7], [-3.6, 8.2], [-4.6, 6], [-3, 3]], .7, .25); for (let i = 0; i < 4; i++) B.add(heart, toon('#ffffff'), [0, 0, 0], [0, 0, i * PI / 2 + PI / 4], null, { tint: '#7ac840' }); });
      c.position.copy(center(u, 1.15)); c.scale.setScalar(.1);
      await G.tween(.4, (k) => { c.scale.setScalar(.1 + .9 * G.easeOut(Math.min(1, k * 2))); c.rotation.y = k * TAU * 1.5; c.lookAt(env.camera.position); c.rotateZ(k * 6); });
      flash(c.position, '#fff4a0', 30, .25); drop(c);
      u.model.play('chomp');
      const back = await dash(u, t, { frac: .7, dur: .18 });
      fx.burst('sparkle', center(t, .7), 10, { speed: 60, colors: ['#ffe060', '#ffffff', '#7ac840'], size: 8, add: true, g: 0 });
      return back;
    };
    M.springkick = async (u, t) => {
      await act(u, 'crouch'); CC.sfx('throw'); u.model.play('tuck');
      const back = await leap(u, t, { frac: .78, height: H(u) * (u.isFoe ? 1 : 1.5), up: .4, hang: .08, down: .13, spin: 1 });
      u.model.play('attack');
      ring(t.model.root.position.clone().setY(1.5), '#ffffff', { r0: 6, r1: 44, dur: .4, op: .8 });
      return back;
    };
    // Water
    M.splashjab = async (u, t) => {
      await act(u, 'spit'); CC.sfx('shoot');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t), mid = from.clone().lerp(to, .5).add(V(0, 12, 0));
      const s = stream([from, mid, to], (k) => 2.6 + 1.6 * Math.sin(k * PI) + 1.2 * k, streamMat('#7ac4ff', '#1f5ab0', '#ffffff', { wob: .5, stripe: 34, speed: 18 }));
      const head = glow('#a8e0ff', 14); await s.grow(.2, head);
      drop(head);
      return () => s.pull(.22);
    };
    M.drizzledart = async (u, t) => {
      await act(u, 'spit'); CC.sfx('shoot');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t), shots = [];
      for (let i = 0; i < 3; i++) {
        const d = solid((B) => B.add(KIT.lathe([[0, 7], [.9, 5], [2.4, 1.5], [2.6, -.5], [1.7, -2.2], [0, -2.8]], 14), toon('#ffffff', { mat: { emissive: new THREE.Color('#1a5ad0'), emissiveIntensity: .3 } }), null, null, null, { tint: (v, n) => KIT.rgb(n.y > .3 ? '#e4f8ff' : '#4ab0f8') }));
        d.userData.point = true; d.position.copy(from);
        const jit = V(G.rand(-6, 6), G.rand(-4, 6), G.rand(-6, 6));
        shots.push(G.sleep(i * .07).then(() => throwIt(d, from, to.clone().add(jit), .16, 2, null, (p) => fx.emit({ x: p.x, y: p.y, z: p.z, life: .25, size: 6, shape: 'glow', color: '#8fd0ff', add: true }))).then(() => { drop(d); fx.burst('bubble', to.clone().add(jit), 4, { speed: 50, colors: ['#8fd0ff', '#ffffff'], size: 6, g: 60 }); }));
      }
      await Promise.all(shots);
    };
    M.soak = async (u, t) => {
      u.model.play('spit'); CC.sfx('shoot'); await G.sleep(.25);
      const above = center(t, 1.2).add(V(0, 22, 0)), c = cloud(above, { color: '#7a8ab0', size: 9, n: 8, w: 2.6 });
      await G.tween(.3, (k) => { c.op = .95 * k; c.g.scale.setScalar(.4 + .6 * k); });
      const stop = every(() => { for (let i = 0; i < 3; i++) fx.emit({ x: above.x + G.rand(-20, 20), y: above.y - 4, z: above.z + G.rand(-12, 12), vy: -160, life: .3, size: 4, shape: 'dust', color: '#8fd0ff' }); });
      ring(t.model.root.position.clone().setY(1), '#5aa0e8', { r0: 4, r1: 34, dur: 1, normal: true, op: .45, thick: .2 });
      t.model.play('shake'); await G.sleep(.9); stop();
      await G.tween(.3, (k) => { c.op = .95 * (1 - k); }); c.done();
    };
    M.torrentcrash = async (u, t) => {
      u.model.play('roar'); CC.sfx('superhit');
      const base = u.model.root.position.clone(), d = flat(base, t.home), sd = sideOf(d), to = center(t, .35);
      const pts = [base.clone().addScaledVector(d, -24).addScaledVector(sd, -10).setY(2), base.clone().addScaledVector(d, -10).setY(60), base.clone().lerp(t.home, .45).setY(96), to.clone().addScaledVector(d, -24).setY(70), to];
      const s = stream(pts, (k) => 5 + 9 * Math.sin(Math.min(1, k * 1.2) * PI * .9), streamMat('#5ab0f8', '#123e8a', '#ffffff', { wob: 1.6, stripe: 22, speed: 14 }), 90);
      const stop = every(() => { const p = s.curve.getPointAt(Math.min(1, s.mat.uniforms.uHead.value)); if (Math.random() < .9) fx.emit({ x: p.x + G.rand(-6, 6), y: p.y + G.rand(-4, 6), z: p.z + G.rand(-6, 6), vy: G.rand(-10, 30), life: .5, size: G.rand(5, 10), shape: 'bubble', color: G.pick(['#ffffff', '#a8dcff']), g: 80 }); });
      await s.grow(.55); stop();
      fx.burst('dust', to, 40, { speed: 150, colors: ['#a8dcff', '#ffffff', '#5ab0f8'], size: 6, g: 200, up: .9 });
      return () => s.pull(.35);
    };
    // Plant
    M.leafflick = async (u, t) => {
      await act(u, 'spit'); CC.sfx('shoot');
      const from = center(u, .75), to = center(t), sd = sideOf(flat(u.home, t.home)), all = [];
      for (let i = 0; i < 5; i++) {
        const lf = leafMesh(G.pick(['#6ac84a', '#8ad84a', '#4fb04a'])), off = (i - 2) * 16;
        lf.position.copy(from); lf.scale.setScalar(1.3);
        const mid = from.clone().lerp(to, .5).addScaledVector(sd, off).add(V(0, 18 - Math.abs(off) * .3, 0));
        const path = new THREE.QuadraticBezierCurve3(from, mid, to.clone().add(V(G.rand(-4, 4), G.rand(-3, 5), 0)));
        all.push(G.sleep(i * .05).then(() => G.tween(.42, (k) => { path.getPoint(k, lf.position); lf.rotation.x += G.dt * 14; lf.rotation.z += G.dt * 22; if (Math.random() < .5) fx.emit({ x: lf.position.x, y: lf.position.y, z: lf.position.z, life: .3, size: 5, shape: 'sparkle', color: '#c8ffa0', add: true }); })).then(() => drop(lf)));
      }
      await Promise.all(all);
    };
    M.thornbarrage = async (u, t) => {
      u.model.play('roar'); CC.sfx('shoot');
      const to = center(t), all = [];
      for (let i = 0; i < 10; i++) {
        const th = solid((B) => { B.add(new THREE.ConeGeometry(1.8, 11, 7), toon('#ffffff'), [0, 0, 0], null, null, { tint: (v) => KIT.rgb(v.y > 2 ? '#e8e0a0' : '#5a7a2a') }); });
        th.userData.point = true;
        const from = center(u, .9).add(V(G.rand(-14, 14), G.rand(-2, 10), G.rand(-8, 8))), at = to.clone().add(V(G.rand(-8, 8), G.rand(-6, 8), G.rand(-6, 6)));
        th.position.copy(from);
        all.push(G.sleep(i * .055).then(() => throwIt(th, from, at, .26, 6)).then(() => { drop(th); fx.burst('leaf', at, 3, { speed: 50, colors: ['#6ac84a', '#a8e88a'], size: 7, g: 60 }); if (i % 3 === 0) env.shake(1.5); }));
      }
      await Promise.all(all);
    };
    M.sporenap = async (u, t) => {
      u.model.play('puff'); CC.sfx('shoot');
      const from = center(u, .9), to = center(t, .6), c = cloud(from, { color: '#e8f0a0', size: 7, n: 9, w: 2, emissive: '#c8e070', ei: .5 });
      const motes = every(() => { if (Math.random() < .8) fx.emit({ x: c.g.position.x + G.rand(-16, 16), y: c.g.position.y + G.rand(-8, 10), z: c.g.position.z + G.rand(-10, 10), vy: G.rand(-6, 10), vx: G.rand(-8, 8), life: .9, size: G.rand(4, 7), shape: 'glow', color: G.pick(['#f4ffb0', '#d8f080', '#ffffff']), add: true }); });
      await G.tween(.85, (k) => { c.g.position.lerpVectors(from, to, G.ease(k)); c.g.position.y += Math.sin(k * PI) * 14; c.op = .75 * Math.min(1, k * 3); c.g.scale.setScalar(.6 + .9 * k); });
      t.model.setSleep(true);
      await G.tween(.5, (k) => { c.op = .75 * (1 - k); c.g.scale.setScalar(1.5 + .3 * k); });
      motes(); c.done(); t.model.setSleep(false);
    };
    M.mossmend = async (u) => {
      u.model.play('puff'); CC.sfx('heal');
      const base = u.model.root.position.clone(), h = H(u) * 1.25, r = Math.max(H(u), u.scale * (CREATURE_DEFS[u.mon.id].width || .5)) * .55, vines = [];
      for (let v = 0; v < 3; v++) {
        const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12, a = v / 3 * TAU + k * TAU * 1.1; pts.push(base.clone().add(V(Math.cos(a) * r * (1 - .3 * k), k * h, Math.sin(a) * r * (1 - .3 * k)))); }
        const s = stream(pts, (k) => 1.6 * (1 - .5 * k) + .4, streamMat('#6ac84a', '#2a6a24', '#c8ffa0', { stripe: 18, speed: 6, solid: true }));
        vines.push(s);
      }
      await Promise.all(vines.map((s, i) => G.sleep(i * .08).then(() => s.grow(.5))));
      for (let i = 0; i < 6; i++) { const lf = leafMesh('#8ad84a'), a = i / 6 * TAU; lf.position.copy(base).add(V(Math.cos(a) * r * .9, h * (.3 + .1 * i), Math.sin(a) * r * .9)); lf.rotation.set(G.rand(-1, 1), a, G.rand(-1, 1)); lf.scale.setScalar(.01); G.tween(.25, (k) => lf.scale.setScalar(1.1 * k)).then(() => G.sleep(.5)).then(() => G.tween(.2, (k) => lf.scale.setScalar(1.1 * (1 - k)))).then(() => drop(lf)); }
      flash(center(u, .5), '#a8ffa0', 70, .6);
      fx.burst('sparkle', center(u, .5), 20, { speed: 50, colors: ['#c8ffd0', '#ffffff', '#a8e88a'], size: 8, add: true, g: -30 });
      await G.sleep(.5);
      await Promise.all(vines.map((s) => s.pull(.35)));
    };
    // Fire
    function fireball(r) {
      const g = add(new THREE.Group());
      const core = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), own(KIT.toon('#ffd060', { mat: { emissive: new THREE.Color('#ff7a20'), emissiveIntensity: .9 } }))); g.add(core);
      const a = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#ff8a2a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); a.scale.setScalar(r * 5); g.add(a);
      const b = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#fff4c0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); b.scale.setScalar(r * 2.2); g.add(b);
      const L = new THREE.PointLight('#ff8a2a', 1.2, r * 18, 2); g.add(L);
      return g;
    }
    const fireTrail = (p) => { for (let i = 0; i < 2; i++) fx.emit({ x: p.x + G.rand(-2, 2), y: p.y + G.rand(-2, 2), z: p.z + G.rand(-2, 2), vy: G.rand(10, 30), life: .35, size: G.rand(6, 11), shape: 'ember', color: G.pick(['#ffe070', '#ff9a30', '#ff5a20']), add: true }); };
    M.embertap = async (u, t) => {
      await act(u, 'flick'); CC.sfx('shoot');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t), em = u.model.parts.ember;
      if (em) em.visible = false;
      const fb = fireball(3.2); fb.position.copy(from);
      await throwIt(fb, from, to, .38, 22, null, fireTrail);
      drop(fb); if (em) G.sleep(.4).then(() => { em.visible = true; });
    };
    M.emberlash = async (u, t) => {
      await act(u, 'flick'); CC.sfx('shoot');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t, .55), d = flat(u.home, t.home), sd = sideOf(d);
      const pts = [from, from.clone().addScaledVector(d, 30).addScaledVector(sd, 34).add(V(0, 26, 0)), to.clone().addScaledVector(sd, 20).add(V(0, 16, 0)), to, to.clone().addScaledVector(sd, -22).add(V(0, -8, 0))];
      const s = stream(pts, (k) => 1.5 + 3.2 * Math.sin(Math.min(1, k * 1.1) * PI * .8), streamMat('#ffd060', '#ff3a10', '#fff8d0', { add: true, wob: .9, stripe: 40, speed: 26 }), 80);
      const head = glow('#ffb040', 22);
      const stop = every(() => { const p = s.curve.getPointAt(Math.min(1, s.mat.uniforms.uHead.value)); fireTrail(p); });
      await s.grow(.26, head); stop(); drop(head);
      return () => s.fade(.3);
    };
    M.cinderhaze = async (u, t) => {
      u.model.play('puff'); await G.sleep(.35); u.model.play('spit'); CC.sfx('shoot');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t, .55), c = cloud(from, { color: '#4a3a3a', size: 7, n: 10, w: 2.2 });
      const embers = every(() => { if (Math.random() < .7) fx.emit({ x: c.g.position.x + G.rand(-14, 14), y: c.g.position.y + G.rand(-8, 8), z: c.g.position.z + G.rand(-10, 10), vy: G.rand(10, 30), life: .5, size: G.rand(4, 7), shape: 'ember', color: G.pick(['#ffb040', '#ff5a20']), add: true }); });
      await G.tween(.75, (k) => { c.g.position.lerpVectors(from, to, G.ease(k)); c.op = .85 * Math.min(1, k * 3); c.g.scale.setScalar(.5 + 1.1 * k); c.g.rotation.y += G.dt; });
      t.model.play('shake');
      await G.tween(.6, (k) => { c.op = .85 * (1 - k); c.g.scale.setScalar(1.6 + .4 * k); });
      embers(); c.done();
    };
    M.flareburst = async (u, t) => {
      u.model.play('puff'); CC.sfx('statup');
      const from = u.model.mouth(new THREE.Vector3()), to = center(t, .5), fb = fireball(2); fb.position.copy(from).add(V(0, 8, 0));
      const pull = every(() => { const a = Math.random() * TAU, r = 26; fx.emit({ x: fb.position.x + Math.cos(a) * r, y: fb.position.y + G.rand(-10, 10), z: fb.position.z + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vz: -Math.sin(a) * r * 3, life: .3, size: 6, shape: 'ember', color: G.pick(['#ffe070', '#ff9a30']), add: true }); });
      await G.tween(.6, (k) => { fb.scale.setScalar(1 + 2.4 * k); });
      pull(); await act(u, 'spit'); CC.sfx('superhit');
      await throwIt(fb, fb.position.clone(), to, .36, 14, null, (p) => { fireTrail(p); fireTrail(p); });
      drop(fb);
      // a pillar of fire where it lands
      const pm = streamMat('#ffd060', '#ff3a10', '#fff8d0', { add: true, stripe: 20, speed: 20, wob: 1.4 }), base = t.model.root.position.clone();
      const pil = stream([base.clone().setY(0), base.clone().setY(30), base.clone().setY(70)], (k) => 16 * (1 - .6 * k) + 2, pm, 30);
      pil.grow(.25).then(() => G.sleep(.25)).then(() => pil.fade(.35));
      ring(base.clone().setY(1.5), '#ff9a30', { r0: 8, r1: 60, dur: .55, thick: .12 });
    };

    const HELP = { S, fx, env, U, V, every, add, drop, own, INK, toon, center, flat, sideOf, toCam, H, act, glow, flash, ring, streamMat, stream, solid, leafMesh, throwIt, cloud, shield, aura, ghost, streak, dust, dash, leap, impact, M };
    for (const id in DEFS) { try { M[id] = DEFS[id](HELP); } catch (e) { console.error('moveset', id, e); } }
    async function play(id, u, t) {
      const f = M[id] || M.tackle;
      try { return await f(u, t); } catch (e) { console.error('move', id, e); return undefined; }
    }
    return { play, impact, update, has: (id) => !!M[id], ring, flash, aura };
  }
  return { make, define, defined: () => Object.keys(DEFS) };
})();
