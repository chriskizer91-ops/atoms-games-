// battle.js: Creature Catch's battles, with the game's own rules (CC's startBattle: damage, type match-ups, same-type bonus,
// critical hits, accuracy, stat stages, burn and sleep, the foe's choices, catching, running, XP and levels) staged in 3D:
// a clearing with two grassy pads, your creature with its back to you and the foe facing you, the cube thrown to send them
// out, each move with its own effect, and a cube that wobbles, clicks and sparkles when you catch something.
const BATTLE = (() => {
  'use strict';
  const B = {}; let R = null;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1.5, 1, 5000);
  const ALLY = new THREE.Vector3(-58, 0, 34), FOE = new THREE.Vector3(62, 0, -112), TRAINER = new THREE.Vector3(104, 0, -160), YOU = new THREE.Vector3(-104, 0, 72);
  let fx = null, built = false, sky = null, MV = null, catcher = null;
  const stage = new THREE.Group(); scene.add(stage);
  const FOG = new THREE.Fog('#bfe0f4', 500, 1400);
  // ---------- the clearing ----------
  function build() {
    if (built) return; built = true;
    scene.add(new THREE.AmbientLight('#ffffff', .38), new THREE.HemisphereLight('#e4eeff', '#6a7a4a', .34));
    const sun = new THREE.DirectionalLight('#fff0d8', .68); sun.position.set(-160, 260, 140); sun.target.position.set(0, 0, -30); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 1, far: 900 }); sun.shadow.bias = -.001;
    scene.add(sun, sun.target);
    scene.fog = FOG;
    const skyU = { uTop: { value: new THREE.Color('#5aa0e8') }, uBot: { value: new THREE.Color('#d8eef8') } };
    sky = new THREE.Mesh(new THREE.SphereGeometry(2200, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU, vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform vec3 uTop; uniform vec3 uBot; varying vec3 vD; void main() { gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.02, 0.5, vD.y)), 1.0); }' }));
    sky.userData = skyU; scene.add(sky);
    // the ground: painted grass, darker toward the edge, and a worn path of dirt between the pads
    const gt = KIT.canvasTex(256, 256, (g) => { g.fillStyle = '#74c450'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { g.fillStyle = ['#86d25c', '#5aa840', '#6cbc48', '#9ae070'][i % 4]; g.fillRect(Math.random() * 256 | 0, Math.random() * 256 | 0, 2, 1 + (i % 3)); } }, { repeat: true });
    gt.repeat.set(12, 12); gt.magFilter = THREE.NearestFilter;
    const gm = KIT.toon('#ffffff', { mat: { map: gt } }); const ground = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), gm); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; stage.add(ground);
    const Bd = KIT.builder(), MATp = PLACES.MAT;
    for (const [p, r] of [[ALLY, 40], [FOE, 40]]) {
      Bd.add(new THREE.CylinderGeometry(r, r + 3, 3, 32), MATp.vc, [p.x, 0, p.z], null, [1, 1, .62], { tint: (v, n) => KIT.rgb(n.y > .5 ? '#d8bc84' : '#a88a58') });
      Bd.add(new THREE.TorusGeometry(r + 1, 2.6, 6, 32), MATp.vc, [p.x, 1.8, p.z], [Math.PI / 2, 0, 0], [1, .62, 1], { tint: '#5aa840' });
    }
    // a ring of trees round the clearing, and tufts of grass near the pads
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, r = 380 + (i % 3) * 70 + Math.sin(i * 7) * 30; if (Math.cos(a - .9) > .92) continue; Bd.add(KIT.lumpy(26 + (i % 4) * 6, i, .2), MATp.leaf, [Math.cos(a) * r, 34 + (i % 3) * 8, Math.sin(a) * r - 120], [i, 0, 0], [1, 1.15, 1], { tint: (v, n) => KIT.rgb(n.y > .4 ? '#5aa848' : n.y > -.2 ? '#3f8a3a' : '#2a6e34') }); Bd.add(new THREE.CylinderGeometry(4, 5, 30, 8), MATp.vc, [Math.cos(a) * r, 12, Math.sin(a) * r - 120], null, null, { tint: '#6a4628' }); }
    for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 260, bx = Math.cos(a) * r + 10, bz = Math.sin(a) * r - 40; if (bx > -150 && bx < 150 && bz > -175 && bz < 260) continue; Bd.add(KIT.lumpy(6 + Math.random() * 5, i, .25), MATp.leaf, [bx, 2, bz], null, [1.3, .8, 1.3], { tint: (v, n) => KIT.rgb(n.y > .5 ? '#6cbc48' : '#3e8a30') }); }
    Bd.build(stage, KIT.inkMat({ k: PLACES.PXINK }), { cast: true, receive: true });
    fx = FX.make(scene);
    catcher = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: .3 })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = .2; catcher.receiveShadow = true; catcher.visible = false; scene.add(catcher);
    MV = MOVES3D.make({ scene, fx, camera, top: (s, up) => top(s, up), shake: (k) => { cam.shake = Math.max(cam.shake, k); } });
  }

  // ---------- the rules, as Creature Catch has them ----------
  const stageMult = (n) => (n >= 0 ? 1 + .25 * n : 1 / (1 + .25 * -n));
  const nm = (s) => (s.isFoe ? (B.wild ? 'The wild ' : 'The foe\'s ') : '') + MON.name(s.mon);
  const nmShort = (s) => MON.name(s.mon);
  function stats(s) { const b = MON.stats(s.mon); return { atk: b.atk * stageMult(s.st.atk) * (s.mon.status === 'burn' ? .75 : 1), def: b.def * stageMult(s.st.def), spd: b.spd * stageMult(s.st.spd) * (s.mon.status === 'shock' ? .75 : 1) }; }
  function damage(user, target, move, crit) {
    const a = stats(user), d = stats(target), L = user.mon.lv;
    const mult = move.type ? DATA.typeMult(move.type, MON.sp(target.mon).types) : 1, stab = move.type && MON.sp(user.mon).types.indexOf(move.type) >= 0 ? 1.25 : 1;
    const dmg = (((2 * L / 5 + 2) * move.power * a.atk / d.def) / 50 + 2) * mult * stab * G.rand(.9, 1) * (crit ? 1.5 : 1);
    return { dmg: mult === 0 ? 0 : Math.max(1, Math.floor(dmg)), mult };
  }
  const STATUS_TEXT = { burn: 'was burned!', sleep: 'fell asleep!', shock: 'is shocked! It may be unable to move!', poison: 'was poisoned!' };
  const STATUS_TAG = { burn: ['BRN', '#f0602c'], sleep: ['SLP', '#8a8aa0'], shock: ['SHK', '#d8a810'], poison: ['PSN', '#9a4ac8'] };
  // the sparks, bubbles and embers a creature gives off while it has a status
  function statusFx(s, n) {
    const st = s.mon.status, at = top(s, .5);
    for (let i = 0; i < n; i++) {
      const p = { x: at.x + G.rand(-12, 12) * s.scale / 40, y: at.y + G.rand(-10, 14) * s.scale / 40, z: at.z + G.rand(-8, 8) * s.scale / 40 };
      if (st === 'shock') fx.emit(Object.assign(p, { vx: G.rand(-40, 40), vy: G.rand(-40, 40), vz: G.rand(-20, 20), life: .18, size: 7, shape: 'star', color: G.pick(['#fff07a', '#ffffff']), add: true }));
      else if (st === 'poison') fx.emit(Object.assign(p, { vy: G.rand(10, 22), life: .9, size: 6, shape: 'bubble', color: G.pick(['#b46ae0', '#8a3ac8']), add: true }));
      else if (st === 'burn') fx.emit(Object.assign(p, { vy: G.rand(18, 30), life: .6, size: 6, shape: 'ember', color: G.pick(['#ffb040', '#ff6a20']), add: true }));
    }
  }
  const STAT_NAME = { atk: 'Attack', def: 'Defense', spd: 'Speed', acc: 'accuracy' }, STAT_SHORT = { atk: 'ATTACK', def: 'DEFENSE', spd: 'SPEED', acc: 'ACCURACY' };

  // ---------- a side: a creature, its 3D model on its pad, its HP as shown ----------
  function side(mon, isFoe) {
    const s = { mon, isFoe, st: { atk: 0, def: 0, spd: 0, acc: 0 }, hpShown: mon.hp, xpShown: null, home: (isFoe ? FOE : ALLY).clone() };
    s.model = makeCreature(mon.id, { seed: isFoe ? 3 : 7 });
    const sp = CREATURE_DEFS[mon.id], big = Math.max(sp.height, (sp.width || .5) * .9);
    const grow = isFoe ? (sp.size || 1) : Math.sqrt(sp.size || 1); // your own side is closer to the camera: big forms grow less there
    let k = (isFoe ? 54 : 40) * grow / big;
    if (LOOK.painted) { // as tall on screen as the 2D game's sprites
      const d = s.home.distanceTo(PAINTCAM[0]), px = (isFoe ? LOOK.foeTall : LOOK.allyTall) / 160 * 2 * d * Math.tan(19 * Math.PI / 180);
      k = px * grow / big;
    }
    s.scale = k; s.model.root.scale.setScalar(k); s.model.root.position.copy(s.home);
    const other = isFoe ? ALLY : FOE, face = Math.atan2(other.x - s.home.x, other.z - s.home.z);
    s.model.root.rotation.y = isFoe ? face + .55 : face - .2;
    s.model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    s.model.root.visible = false; scene.add(s.model.root);
    return s;
  }
  function drop(s) { if (s && s.model) scene.remove(s.model.root); }
  const top = (s, up) => s.model.root.position.clone().add(new THREE.Vector3(0, (up === undefined ? .55 : up) * s.scale * MON_H(s), 0));
  const MON_H = (s) => CREATURE_DEFS[s.mon.id].height;

  // ---------- the look: the 3D clearing, or one of the game's paintings behind the 3D creatures ----------
  const DEF = { ALLY: ALLY.clone(), FOE: FOE.clone(), TRAINER: TRAINER.clone(), YOU: YOU.clone() };
  const LOOK = { painted: null, foeTall: 40, allyTall: 44 };
  const PAINTCAM = [new THREE.Vector3(0, 58, 210), new THREE.Vector3(0, 14, 0)];
  const paintTex = {};
  function painting(key) {
    if (paintTex[key]) return paintTex[key];
    const img = new Image(), t = new THREE.Texture(img); img.onload = () => { t.needsUpdate = true; }; img.src = PAINTINGS[key];
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    t.offset.set(0, -26 / 160); // shifted up 26 px, as the 2D game draws it, so the arena sits above the text box
    t.wrapT = THREE.MirroredRepeatWrapping; // and the strip it leaves at the bottom is the grass, mirrored
    return (paintTex[key] = t);
  }
  // where a point on the 240 x 160 screen meets the ground, seen from the painted view
  function groundAt(sx, sy) {
    const c = new THREE.PerspectiveCamera(38, 1.5, 1, 5000); c.position.copy(PAINTCAM[0]); c.lookAt(PAINTCAM[1]); c.updateMatrixWorld(); c.updateProjectionMatrix();
    const v = new THREE.Vector3(sx / 120 - 1, 1 - sy / 80, .5).unproject(c), d = v.sub(c.position).normalize();
    return c.position.clone().addScaledVector(d, -c.position.y / d.y);
  }
  function setLook(key) {
    LOOK.painted = key || null;
    stage.visible = sky.visible = !key; catcher.visible = !!key;
    scene.background = key ? painting(key) : null; scene.fog = key ? null : FOG;
    if (key) { FOE.copy(groundAt(172, 80)); ALLY.copy(groundAt(66, 106)); TRAINER.copy(groundAt(206, 70)); YOU.copy(groundAt(-30, 150)); }
    else { FOE.copy(DEF.FOE); ALLY.copy(DEF.ALLY); TRAINER.copy(DEF.TRAINER); YOU.copy(DEF.YOU); }
  }

  // ---------- the camera ----------
  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), shake: 0, want: null };
  const SHOTS = {
    main: () => [new THREE.Vector3(-36, 64, 196), new THREE.Vector3(14, 10, -38)],
    demo: () => [new THREE.Vector3(-22, 76, 236), new THREE.Vector3(8, 6, -44)],
    // in front of your creature, for evolving
    evolve: () => { const d = FOE.clone().sub(ALLY).setY(0).normalize(); return [ALLY.clone().addScaledVector(d, 110).add(new THREE.Vector3(0, 46, 0)), ALLY.clone().add(new THREE.Vector3(0, 20, 0))]; },
    foe: () => [FOE.clone().add(new THREE.Vector3(-40, 34, 124)), FOE.clone().add(new THREE.Vector3(0, 18, 0))],
    trainer: () => [TRAINER.clone().add(new THREE.Vector3(-30, 26, 80)), TRAINER.clone().add(new THREE.Vector3(0, 18, 0))],
    you: () => [YOU.clone().add(new THREE.Vector3(-26, 40, 70)), new THREE.Vector3(-10, 14, -30)],
    ally: () => [ALLY.clone().add(new THREE.Vector3(-36, 34, 80)), ALLY.clone().add(new THREE.Vector3(6, 16, -10))],
    cube: () => [FOE.clone().add(new THREE.Vector3(-56, 44, 140)), FOE.clone().add(new THREE.Vector3(0, 8, 0))],
  };
  const shot = (name, snap) => { const [p, l] = LOOK.painted && name !== 'evolve' ? PAINTCAM : SHOTS[name](); cam.want = { p, l }; if (snap) { cam.pos.copy(p); cam.look.copy(l); } };
  function aim(dt) {
    if (cam.want) { const k = 1 - Math.exp(-dt * 4); cam.pos.lerp(cam.want.p, k); cam.look.lerp(cam.want.l, k); }
    camera.position.copy(cam.pos); cam.shake = Math.max(0, cam.shake - dt * 10);
    if (cam.shake > 0) camera.position.add(new THREE.Vector3(Math.sin(G.t * 61) * cam.shake, Math.cos(G.t * 47) * cam.shake * .6, 0));
    camera.lookAt(cam.look);
  }

  // ---------- effects ----------
  const TC = (type, i) => (DATA.TYPE_COLORS[type] || DATA.TYPE_COLORS.Normal)[i || 0];
  function burstAt(p, type, n, o) {
    const cols = DATA.TYPE_COLORS[type] || DATA.TYPE_COLORS.Normal;
    const kind = { Water: 'bubble', Plant: 'leaf', Fire: 'ember', Normal: 'star' }[type] || 'star';
    fx.burst(kind, p, n || 14, Object.assign({ speed: 60, colors: cols.slice(0, 2), size: 7, life: .6, add: type === 'Fire', spread: 6 }, o || {}));
  }
  // particles flying from one creature to the other along an arc; resolves when they land
  function volley(from, to, kind, cols, o) {
    o = o || {}; const n = o.n || 10, dur = o.dur || .45, add = !!o.add;
    for (let i = 0; i < n; i++) {
      const delay = i * (o.gap || .035), d = dur * G.rand(.85, 1.1);
      setTimeout(() => {
        const a = from.clone(), b = to.clone().add(new THREE.Vector3(G.rand(-5, 5), G.rand(-4, 6), G.rand(-5, 5)));
        const g = 8 * (o.arc === undefined ? 30 : o.arc) / (d * d);
        fx.emit({ x: a.x, y: a.y, z: a.z, vx: (b.x - a.x) / d, vy: (b.y - a.y) / d + g * d / 2, vz: (b.z - a.z) / d, g, life: d, size: o.size || 7, shape: kind, color: G.pick(cols), add, spin: 6, fade: false });
      }, delay * 1000);
    }
    return G.sleep((n - 1) * (o.gap || .035) + dur);
  }
  const ring = (p, col, size) => fx.emit({ x: p.x, y: p.y, z: p.z, life: .5, size: size || 10, grow: 160, shape: 'bubble', color: col, add: true });
  const moveAnim = (user, target, move) => MV.play(move.id, user, target);
  async function hitFx(target, mult, crit, type) {
    const p = top(target, .45);
    target.model.play('hit'); target.model.flash(1, '#ffffff');
    MV.impact(type || 'Normal', p, mult > 1 || crit);
    CC.sfx(mult > 1 ? 'superhit' : mult < 1 ? 'weakhit' : 'hit');
    await G.sleep(.35);
  }
  // HP bars slide to the new value
  const hpTo = (s, sec) => { const from = s.hpShown, to = s.mon.hp; return G.tween(sec || .5, (k) => { s.hpShown = G.lerp(from, to, k); }); };
  // a line that floats up from a creature (MISS, CRITICAL!, LEVEL UP!)
  const popAt = (s, str, col, size) => { const v = top(s, 1.05).project(camera); UI.pop(str, (v.x * .5 + .5) * 240, (1 - (v.y * .5 + .5)) * 160, col, size); };

  // ---------- moves ----------
  async function applyStatus(target, st, quiet) {
    if (target.mon.status || target.mon.hp <= 0) { if (!quiet) await UI.say('But it failed!'); return; }
    target.mon.status = st; if (st === 'sleep') { target.mon.sleep = G.randi(1, 3); target.model.setSleep(true); }
    CC.sfx('status');
    if (st === 'burn') burstAt(top(target, .5), 'Fire', 12);
    if (st === 'shock' || st === 'poison') { statusFx(target, 14); target.model.flash(.9, st === 'shock' ? '#fff07a' : '#b46ae0'); if (st === 'shock') target.model.play('shake'); }
    if (st === 'sleep') for (let i = 0; i < 3; i++) fx.emit({ x: target.home.x + 8, y: top(target, 1).y, z: target.home.z, vx: 8, vy: 14, life: 1.2, size: 9, shape: 'z', color: '#ffffff', delay: i });
    await UI.say(nm(target) + ' ' + STATUS_TEXT[st]);
  }
  async function applyStat(s, stat, n) {
    const cur = s.st[stat], next = G.clamp(cur + n, -3, 3);
    if (next === cur) { await UI.say(nm(s) + '\'s ' + STAT_NAME[stat] + ' won\'t go any ' + (n > 0 ? 'higher!' : 'lower!')); return; }
    s.st[stat] = next;
    popAt(s, STAT_SHORT[stat] + (n > 0 ? ' UP' : ' DOWN'), n > 0 ? '#ffa04a' : '#7aa8f0');
    CC.sfx(n > 0 ? 'statup' : 'statdown');
    if (n < 0) for (let i = 0; i < 12; i++) fx.emit({ x: s.home.x + G.rand(-14, 14), y: top(s, 1).y, z: s.home.z + G.rand(-10, 10), vy: -40, life: .6, size: 5, shape: 'dust', color: '#7aa8f0', add: true });
    await UI.say(nm(s) + '\'s ' + STAT_NAME[stat] + (n > 0 ? ' rose!' : ' fell!'));
  }
  async function canAct(s) {
    const m = s.mon;
    if (m.status === 'sleep') {
      m.sleep--;
      if (m.sleep < 0) { m.status = null; s.model.setSleep(false); await UI.say(nm(s) + ' woke up!'); return true; }
      fx.emit({ x: s.home.x + 8, y: top(s, 1).y, z: s.home.z, vx: 10, vy: 16, life: 1.2, size: 9, shape: 'z', color: '#ffffff' });
      await UI.say(nm(s) + ' is fast asleep.'); return false;
    }
    if (m.status === 'shock' && Math.random() < .25) { statusFx(s, 16); s.model.play('shake'); s.model.flash(.8, '#fff07a'); CC.sfx('status'); await UI.say(nm(s) + ' is shocked and can\'t move!'); return false; }
    return true;
  }
  async function useMove(user, target, mvId) {
    const move = Object.assign({ id: mvId }, DATA.MOVES[mvId]), fx_ = move.fx || {};
    if (mvId !== 'struggle') { const slot = user.mon.moves.find((x) => x.id === mvId); if (slot) slot.pp = Math.max(0, slot.pp - 1); }
    await UI.say(nm(user) + ' used ' + move.name + '!', { auto: .35 });
    if (move.acc && !(!move.power && (fx_.self || fx_.heal))) {
      const acc = move.acc * stageMult(user.st.acc);
      if (Math.random() * 100 >= acc) { user.model.play('attack'); await G.sleep(.4); popAt(target, 'MISS', '#d8d0c8'); await UI.say(nm(user) + '\'s attack missed!'); return; }
    }
    let back = await moveAnim(user, target, move);
    if (move.power) {
      // a move that hits more than once lands each hit in turn (Rock Fetch); a draining move gives some back (Cheek Stash)
      const hits = fx_.hits ? G.randi(fx_.hits[0], fx_.hits[1]) : 1; let total = 0, last = null, anyCrit = false, n = 0;
      for (let h = 0; h < hits && target.mon.hp > 0; h++) {
        if (h > 0) { await G.sleep(.28); back = null; } // the move's own animation already shows every hit
        const crit = Math.random() < (fx_.crit ? .25 : .0625), r = damage(user, target, move, crit);
        target.mon.hp = Math.max(0, target.mon.hp - r.dmg); total += r.dmg; last = r; n++; anyCrit = anyCrit || crit;
        if (crit) popAt(target, 'CRITICAL!', '#ffe040', 12);
        else if (r.mult > 1 && h === 0) popAt(target, 'SUPER EFFECTIVE!', '#ff8a3a');
        else if (r.mult < 1 && h === 0) popAt(target, 'not very effective', '#a8c0d0', 9);
        await Promise.all([hitFx(target, r.mult, crit, move.type), hpTo(target), back ? back() : null]);
      }
      const r = last;
      if (hits > 1) await UI.say('Hit ' + n + ' times!');
      if (anyCrit) await UI.say(n > 1 ? 'A critical hit landed!' : 'A critical hit!');
      if (r.mult > 1) await UI.say('It\'s super effective!'); else if (r.mult < 1) await UI.say('It\'s not very effective...');
      if (fx_.drain && user.mon.hp > 0) {
        const heal = Math.max(1, Math.floor(total * fx_.drain)), max = MON.maxHp(user.mon);
        if (user.mon.hp < max) {
          const a = top(target, .5), b = top(user, .5);
          for (let i = 0; i < 10; i++) fx.emit({ x: a.x, y: a.y, z: a.z, vx: (b.x - a.x) / .5 + G.rand(-10, 10), vy: (b.y - a.y) / .5 + G.rand(-10, 10), vz: (b.z - a.z) / .5, life: .5, size: 6, shape: 'glow', color: '#c8ffd0', add: true, delay: i * .03 });
          await G.sleep(.5); user.mon.hp = Math.min(max, user.mon.hp + heal); await hpTo(user, .4); await UI.say(nm(user) + ' drained some health!');
        }
      }
      if (fx_.recoil && user.mon.hp > 0) { user.mon.hp = Math.max(0, user.mon.hp - Math.max(1, Math.floor(r.dmg * fx_.recoil))); await Promise.all([hitFx(user, 1, false, 'Normal'), hpTo(user)]); await UI.say(nm(user) + ' is hit with recoil!'); }
      if (fx_.status && target.mon.hp > 0 && !target.mon.status && Math.random() * 100 < (fx_.chance || 100)) await applyStatus(target, fx_.status, true);
    } else {
      if (back) await back();
      if (fx_.heal) { const max = MON.maxHp(user.mon); if (user.mon.hp >= max) { await UI.say('But ' + nmShort(user) + ' is already at full health!'); return; } user.mon.hp = Math.min(max, user.mon.hp + Math.floor(max * fx_.heal)); await hpTo(user); await UI.say(nm(user) + ' regained health!'); }
      else if (fx_.status) await applyStatus(target, fx_.status);
      else if (fx_.stat) await applyStat(fx_.self ? user : target, fx_.stat, fx_.stages);
    }
  }
  async function residual(s) {
    const m = s.mon; if (m.hp <= 0 || (m.status !== 'burn' && m.status !== 'poison')) return;
    const burn = m.status === 'burn';
    m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(MON.maxHp(m) / (burn ? 16 : 8))));
    if (burn) burstAt(top(s, .4), 'Fire', 10, { speed: 30 }); else statusFx(s, 14);
    s.model.flash(.8, burn ? '#ff8a4a' : '#b46ae0'); await hpTo(s, .4);
    await UI.say(nm(s) + ' is hurt by its ' + (burn ? 'burn!' : 'poison!'));
  }
  function foeChoice() {
    const f = B.foe, m = f.mon, opts = m.moves.filter((x) => x.pp > 0);
    if (!opts.length) return 'struggle';
    if (B.wild) return G.pick(opts).id;
    let best = null, bs = -1;
    for (const x of opts) {
      const mv = DATA.MOVES[x.id]; let sc;
      if (mv.power) sc = mv.power * DATA.typeMult(mv.type, MON.sp(B.ally.mon).types) * (MON.sp(m).types.indexOf(mv.type) >= 0 ? 1.25 : 1);
      else if (mv.fx.status) sc = B.ally.mon.status ? 0 : 45;
      else if (mv.fx.heal) sc = m.hp < MON.maxHp(m) / 2 ? 70 : 0;
      else if (mv.fx.stat) { const s = mv.fx.self ? f : B.ally; sc = (mv.fx.stages > 0 ? s.st[mv.fx.stat] >= 3 : s.st[mv.fx.stat] <= -3) ? 0 : 30; }
      else sc = 30;
      sc *= G.rand(.7, 1.3); if (sc > bs) { bs = sc; best = x.id; }
    }
    return best;
  }

  // ---------- sending out, calling back, fainting ----------
  async function throwFrom(fromPos, to, who) { // a cube arcs from a hand to a pad, opens, and the creature appears
    const cube = makeCube(); cube.root.scale.setScalar(26); scene.add(cube.root);
    const a = fromPos.clone(), b = to.clone().add(new THREE.Vector3(0, 6, 0));
    CC.sfx('throw');
    await G.tween(.5, (k) => { cube.root.position.lerpVectors(a, b, k); cube.root.position.y += Math.sin(k * Math.PI) * 40; cube.spin.rotation.set(k * 9, k * 4, 0); });
    cube.spin.rotation.set(0, who.isFoe ? .3 : Math.PI - .5, 0);
    await G.tween(.15, (k) => { cube.open = k; });
    fx.burst('sparkle', b, 16, { speed: 70, colors: ['#ffffff', '#fff0b0', '#c8a8f8'], add: true, size: 8, g: 0 });
    who.model.root.visible = true; who.model.reset(); who.model.play('appear'); CC.sfx('select');
    await G.tween(.3, (k) => { cube.open = 1 - k; cube.root.scale.setScalar(26 * (1 - k)); });
    scene.remove(cube.root);
    await G.sleep(.25);
  }
  // when the cube leaves the thrower's hand: our people let go at manifest.events.throw (0.5 s), the old ones at .42-.44 s
  const throwWait = (p, old) => (p && p.throwAt ? p.throwAt : old);
  async function faintAnim(s) { CC.sfx('faint'); await s.model.play('faint'); }

  // ---------- catching ----------
  function catchChance(m) {
    const max = MON.maxHp(m), st = m.status;
    return G.clamp((1 - m.hp / max) * 70 + (st === 'sleep' ? 15 : st ? 8 : 0) + (DATA.RARITY_BONUS[DATA.CREATURES[m.id].rarity] || 0) + 0, 5, 95);
  }
  async function throwCube() {
    G.state.bag.cube--;
    await UI.say('You threw a Basic Cube!', { auto: .2 });
    const f = B.foe, cube = makeCube(); cube.root.scale.setScalar(26); scene.add(cube.root);
    shot('cube');
    if (B.you) B.you.play('throw', true); await G.sleep(B.you ? throwWait(B.you, .42) : .42);
    const a = B.you ? B.you.anchor('hand', new THREE.Vector3()) : YOU.clone().add(new THREE.Vector3(0, 20, 0)), b = top(f, .55);
    CC.sfx('throw');
    await G.tween(.6, (k) => { cube.root.position.lerpVectors(a, b, k); cube.root.position.y += Math.sin(k * Math.PI) * 46; cube.spin.rotation.set(k * 12, k * 5, 0); });
    cube.spin.rotation.set(0, .4, 0);
    await G.tween(.18, (k) => { cube.open = k; });
    fx.burst('sparkle', b, 18, { speed: 70, colors: ['#ffffff', '#fff0b0'], add: true, size: 8, g: 0 });
    f.model.play('vanish'); CC.sfx('select');
    await G.sleep(.42);
    await G.tween(.15, (k) => { cube.open = 1 - k; });
    const floor = f.home.clone().add(new THREE.Vector3(0, 3.9, 0));
    await G.tween(.3, (k) => { cube.root.position.lerpVectors(b, floor, k * k); });
    CC.sfx('bump'); fx.burst('dust', floor, 8, { speed: 30, colors: ['#e8dcc0'], size: 6, g: 10 });
    const caught = Math.random() * 100 < catchChance(f.mon), wobbles = caught ? 3 : G.randi(0, 2);
    for (let i = 0; i < wobbles; i++) {
      await G.sleep(.45); CC.sfx('wobble');
      await G.tween(.4, (k) => { cube.spin.rotation.z = Math.sin(k * Math.PI * 2) * .45 * (i % 2 ? -1 : 1); cube.button = Math.sin(k * Math.PI); });
    }
    await G.sleep(.4);
    if (caught) {
      CC.sfx('catch'); cube.button = 1;
      fx.burst('star', floor.clone().add(new THREE.Vector3(0, 6, 0)), 14, { speed: 60, colors: ['#ffffff', '#f8e050', '#c88af8'], size: 9, add: true, g: 60 });
      await G.tween(.3, (k) => { cube.root.position.y = floor.y + Math.sin(k * Math.PI) * 6; });
      await UI.say('Gotcha! ' + MON.name(f.mon) + ' was caught!');
      f.mon.caughtHere = true;
      await gainXp(f.mon);
      const where = STORY.addCreature(f.mon);
      if (where === 'vault') await UI.say('Your party is full, so ' + MON.name(f.mon) + ' was sent to the Cube Vault.');
      scene.remove(cube.root);
      return true;
    }
    CC.sfx('breakout'); cube.open = 1;
    fx.burst('star', top(f, .4), 12, { speed: 70, colors: ['#ffffff'], size: 7, add: true });
    f.model.reset(); f.model.root.visible = true; f.model.play('appear');
    await G.sleep(.2); scene.remove(cube.root);
    shot('main');
    await UI.say(['Oh no! It broke free!', 'Argh! Almost had it!', 'Aww! It appeared to be caught!', 'Shoot! It was so close, too!'][wobbles]);
    return false;
  }

  // ---------- winning and growing ----------
  const xpScale = (foeLv, lv) => G.clamp(1 + .08 * (foeLv - lv), .5, 1.5);
  async function gainXp(foeMon) {
    const party = G.state.party, fought = Object.keys(B.fought).map(Number).filter((i) => party[i] && party[i].hp > 0);
    if (!fought.length) return;
    const total = Math.max(1, Math.floor(MON.sp(foeMon).xpYield * foeMon.lv / 5 * (B.wild ? 1 : 1.5))), each = Math.max(1, Math.ceil(total / fought.length));
    for (const i of fought) await grow(party[i], Math.max(1, Math.round(each * xpScale(foeMon.lv, party[i].lv))));
  }
  async function grow(m, gain) {
    const s = B.ally && B.ally.mon === m ? B.ally : null, name = MON.name(m);
    await UI.say(name + ' gained ' + gain + ' XP!');
    const target = m.xp + gain;
    while (m.lv < 50) {
      const next = MON.xpFor(m.lv + 1), from = m.xp, to = Math.min(target, next);
      if (s) { CC.sfx('xp'); await G.tween(.5, (k) => { s.xpShown = G.lerp(from, to, k); }); }
      m.xp = to; if (m.xp < next) break;
      const before = MON.stats(m); m.lv++; const after = MON.stats(m); m.hp += after.hp - before.hp;
      if (s) { s.hpShown = m.hp; for (let i = 0; i < 16; i++) fx.emit({ x: s.home.x + G.rand(-18, 18), y: G.rand(0, 6), z: s.home.z + G.rand(-12, 12), vy: G.rand(40, 80), life: .9, size: 6, shape: 'star', color: G.pick(['#f8e050', '#ffffff']), add: true }); popAt(s, 'LEVEL UP!', '#f8e050'); s.model.play('happy'); }
      CC.sfx('levelup');
      await UI.say(name + ' grew to Lv ' + m.lv + '!');
      if (MON.canEvolve(m) && EVOLVE) m.evoAsk = true;
      for (const mv of MON.newMovesAt(m.id, m.lv)) await STORY.learnMove(m, mv);
    }
    if (s) s.xpShown = null;
  }

  // ---------- choosing what to do ----------
  function actionMenu() {
    return new Promise((resolve) => {
      let sel = 0; const labels = ['Fight', 'Bag', 'Swap', 'Run'];
      const scr = {
        name: 'action',
        update() { if (G.input.pressed.left || G.input.pressed.right) { sel ^= 1; CC.sfx('blip'); } if (G.input.pressed.up || G.input.pressed.down) { sel ^= 2; CC.sfx('blip'); } if (G.input.pressed.a) { CC.sfx('select'); G.pop(scr); resolve(sel); } },
        draw() {
          UI.box(0, 112, 132, 48); UI.text('What will', 9, 119); UI.text(nmShort(B.ally) + ' do?', 9, 134);
          UI.box(130, 112, 110, 48);
          labels.forEach((l, i) => { const x = 146 + (i % 2) * 50, y = 120 + Math.floor(i / 2) * 18; UI.text(l, x, y); if (i === sel) UI.cursor(x - 9, y + 2); });
        },
      };
      G.push(scr);
    });
  }
  function moveMenu() {
    return new Promise((resolve) => {
      const moves = B.ally.mon.moves; let sel = 0;
      const scr = {
        name: 'moves',
        update() {
          const n = moves.length, was = sel;
          if (G.input.pressed.left || G.input.pressed.right) sel = (sel ^ 1) < n ? sel ^ 1 : sel;
          if (G.input.pressed.up || G.input.pressed.down) sel = (sel ^ 2) < n ? sel ^ 2 : sel;
          if (sel !== was) CC.sfx('blip');
          if (G.input.pressed.a) { if (moves[sel].pp <= 0) { CC.sfx('bump'); return; } CC.sfx('select'); G.pop(scr); resolve(moves[sel].id); }
          if (G.input.pressed.b) { CC.sfx('back'); G.pop(scr); resolve(null); }
        },
        draw() {
          UI.box(0, 112, 164, 48);
          moves.forEach((x, i) => { const px = 14 + (i % 2) * 76, py = 120 + Math.floor(i / 2) * 18; UI.text(DATA.MOVES[x.id].name, px, py, x.pp > 0 ? '#1c1624' : '#a89c90', { size: 9 }); if (i === sel) UI.cursor(px - 9, py + 2); });
          const mv = DATA.MOVES[moves[sel].id];
          UI.box(162, 112, 78, 48); UI.textNum('PP ' + moves[sel].pp + '/' + mv.pp, 170, 120, '#1c1624', { size: 9 });
          const tc = DATA.TYPE_COLORS[mv.type] || DATA.TYPE_COLORS.Normal; UI.rect(170, 136, 60, 12, tc[1]); UI.rect(170, 136, 60, 2, tc[0]); UI.text((mv.type || '').toUpperCase(), 200, 137, '#ffffff', { size: 9, align: 'center', shadow: tc[2] });
        },
      };
      G.push(scr);
    });
  }
  async function chooseAction() {
    shot('main');
    while (true) {
      const a = await actionMenu();
      if (a === 0) { const mv = await moveMenu(); if (mv) return { kind: 'move', move: mv }; }
      else if (a === 1) {
        const items = [{ label: 'Basic Cube', right: 'x' + G.state.bag.cube, disabled: !G.state.bag.cube }, { label: 'Potion', right: 'x' + G.state.bag.potion, disabled: !G.state.bag.potion }];
        const c = await UI.menu(items, { title: 'Bag', y: 50 });
        if (c === 0) { if (!B.wild) { await UI.say('You can\'t catch another trainer\'s creature!'); continue; } return { kind: 'cube' }; }
        if (c === 1) { const i = await STORY.pickCreature('Use a Potion on which?'); if (i < 0) continue; const m = G.state.party[i]; if (m.hp <= 0 || m.hp >= MON.maxHp(m)) { await UI.say('It won\'t have any effect.'); continue; } return { kind: 'potion', index: i }; }
      } else if (a === 2) {
        const i = await STORY.pickCreature('Send out which?');
        if (i < 0) continue; const m = G.state.party[i];
        if (m === B.ally.mon) { await UI.say(nmShort(B.ally) + ' is already out!'); continue; }
        if (m.hp <= 0) { await UI.say(MON.name(m) + ' has no energy left to battle!'); continue; }
        return { kind: 'swap', index: i };
      } else if (a === 3) { if (!B.wild) { await UI.say('You can\'t run from a trainer battle!'); continue; } return { kind: 'run' }; }
    }
  }

  // ---------- the battle ----------
  async function sendAlly(i, first) {
    if (B.ally) drop(B.ally);
    B.allyIndex = i; B.ally = side(G.state.party[i], false); B.fought[i] = true;
    shot(first ? 'you' : 'ally');
    await UI.say('Go, ' + nmShort(B.ally) + '!', { auto: .3 });
    if (B.you) { B.you.play('throw', true); await G.sleep(throwWait(B.you, .44)); }
    await throwFrom(B.you ? B.you.anchor('hand', new THREE.Vector3()) : YOU.clone().add(new THREE.Vector3(0, 20, 0)), ALLY, B.ally);
  }
  async function checkFaints() {
    if (B.foe.mon.hp <= 0) {
      await faintAnim(B.foe); await UI.say(nm(B.foe) + ' fainted!');
      await gainXp(B.foe.mon);
      if (B.wild || B.foeIndex >= B.foeTeam.length - 1) return 'win';
      B.foeIndex++; drop(B.foe); B.foe = side(B.foeTeam[B.foeIndex], true);
      await UI.say(B.trainer.name + ' sent out ' + MON.name(B.foe.mon) + '!', { auto: .4 });
      await throwFrom(TRAINER.clone().add(new THREE.Vector3(0, 20, 0)), FOE, B.foe);
      return 'next';
    }
    if (B.ally.mon.hp <= 0) {
      await faintAnim(B.ally); await UI.say(nmShort(B.ally) + ' fainted!');
      const next = G.state.party.findIndex((m) => m.hp > 0);
      if (next < 0) return 'lose';
      const i = await STORY.pickCreature('Send out which?', true);
      await sendAlly(i >= 0 && G.state.party[i].hp > 0 ? i : next);
      return 'next';
    }
    return null;
  }
  async function battle() {
    if (B.wild) {
      shot('foe', true); B.foe.model.root.visible = true; B.foe.model.play('hop');
      fx.burst('leaf', top(B.foe, .2), 14, { speed: 60, colors: ['#5ab848', '#90e070', '#2f7a2a'], size: 7, g: 80 });
      await UI.say('A wild ' + MON.name(B.foe.mon) + ' jumped out!');
    } else {
      shot('trainer', true);
      await UI.say(B.trainer.name + ' wants to battle!');
      if (B.trainer.intro) await UI.say(B.trainer.intro, { who: B.trainer.name });
      shot('foe');
      await UI.say(B.trainer.name + ' sent out ' + MON.name(B.foe.mon) + '!', { auto: .4 });
      if (B.them) { B.them.play('throw', true); await G.sleep(throwWait(B.them, .44)); }
      await throwFrom(B.them ? B.them.anchor('hand', new THREE.Vector3()) : TRAINER.clone().add(new THREE.Vector3(0, 20, 0)), FOE, B.foe);
    }
    await sendAlly(B.allyIndex, true);
    while (true) {
      const act = await chooseAction(), foeMove = foeChoice();
      if (act.kind === 'run') {
        B.runs++; const a = stats(B.ally).spd, b = stats(B.foe).spd;
        if (a >= b || Math.random() * 100 < 50 + 10 * B.runs) { CC.sfx('back'); await UI.say('Got away safely!'); return 'run'; }
        await UI.say('Couldn\'t get away!');
      } else if (act.kind === 'cube') { if (await throwCube()) return 'caught'; }
      else if (act.kind === 'potion') { G.state.bag.potion--; const m = G.state.party[act.index], s = m === B.ally.mon ? B.ally : null; m.hp = Math.min(MON.maxHp(m), m.hp + 30); CC.sfx('heal'); if (s) { for (let i = 0; i < 14; i++) fx.emit({ x: s.home.x + G.rand(-14, 14), y: G.rand(0, 14), z: s.home.z + G.rand(-10, 10), vy: 30, life: .8, size: 6, shape: 'sparkle', color: '#c8ffd0', add: true }); await hpTo(s); } await UI.say(MON.name(m) + ' was healed!'); }
      else if (act.kind === 'swap') { await UI.say('Come back, ' + nmShort(B.ally) + '!', { auto: .3 }); await B.ally.model.play('vanish'); await sendAlly(act.index); }
      let order = [];
      if (act.kind === 'move') {
        const pa = (DATA.MOVES[act.move].fx || {}).priority || 0, pb = (DATA.MOVES[foeMove].fx || {}).priority || 0, sa = stats(B.ally).spd, sb = stats(B.foe).spd;
        const allyFirst = pa !== pb ? pa > pb : sa !== sb ? sa > sb : Math.random() < .5;
        order = allyFirst ? [['ally', act.move], ['foe', foeMove]] : [['foe', foeMove], ['ally', act.move]];
      } else order = [['foe', foeMove]];
      let ended = false;
      for (let i = 0; i < order.length && !ended; i++) {
        const user = order[i][0] === 'ally' ? B.ally : B.foe, target = user === B.ally ? B.foe : B.ally;
        if (user.mon.hp <= 0 || target.mon.hp <= 0) continue;
        shot('main');
        if (await canAct(user)) await useMove(user, target, order[i][1]);
        const r = await checkFaints(); if (r) { if (r !== 'next') return r; ended = true; }
      }
      if (ended) continue;
      for (const who of [B.ally, B.foe]) { await residual(who); const r2 = await checkFaints(); if (r2) { if (r2 !== 'next') return r2; break; } }
    }
  }
  // the panels: the foe's top left, yours bottom right with your HP numbers and XP
  function drawPanels(ax, ay) {
    if (!B.foe || !B.ally || B.evolving) return;
    const panel = (s, x, y, mine) => {
      if (!s.model.root.visible && !s.shownOnce) return; s.shownOnce = true;
      const m = s.mon, max = MON.maxHp(m), h = mine ? 34 : 26;
      UI.box(x, y, 104, h);
      UI.text(MON.name(m), x + 6, y + 4, '#1c1624', { size: 9 }); UI.textNum('Lv' + m.lv, x + 98, y + 4, '#6a5a50', { size: 9, align: 'right' });
      UI.text('HP', x + 6, y + 15, '#a84a2a', { size: 8 }); UI.bar(x + 20, y + 17, 78, s.hpShown / max);
      if (m.status && STATUS_TAG[m.status]) { const [tag, c] = STATUS_TAG[m.status]; UI.rect(x + 66, y + 4, 26, 9, c); UI.text(tag, x + 79, y + 4, '#fff', { size: 8, align: 'center', shadow: false }); }
      if (mine) { UI.textNum(Math.ceil(s.hpShown) + '/' + max, x + 98, y + 22, '#1c1624', { size: 9, align: 'right' }); const lo = MON.xpFor(m.lv), hi = MON.xpFor(m.lv + 1), xp = s.xpShown != null ? s.xpShown : m.xp; UI.rect(x + 6, y + 31, 92, 2, '#5a5060'); UI.rect(x + 6, y + 31, Math.round(92 * G.clamp((xp - lo) / (hi - lo), 0, 1)), 2, '#58a8f0'); }
    };
    panel(B.foe, 4, 4, false); panel(B.ally, ax == null ? 132 : ax, ay == null ? 72 : ay, true);
  }
  const screen = { name: 'battle', draw: drawPanels };
  function update(dt) {
    const t = G.t;
    for (const s of [B.ally, B.foe]) if (s) { s.model.update(t, dt, 0); if (s.mon.status && s.mon.hp > 0 && s.model.root.visible && Math.random() < dt * 5) statusFx(s, 1); }
    for (const p of [B.you, B.them]) if (p) p.animate(0, 0, t, dt);
    KIT.WIND.uT.value = t; KIT.SEE.uSee.value.set(0, 0, 0);
    if (MV) MV.update(dt);
    if (B.tick) B.tick(dt);
    aim(dt);
  }
  function render(dt) { fx.update(dt, G.frame.h * G.frame.pr * .9); R.render(scene, camera); }
  const faceCam = new THREE.PerspectiveCamera(30, 1, .5, 3000), _v = new THREE.Vector3();
  function faceShot(who) {
    const m = B.trainer && who === B.trainer.name ? B.them : who === 'You' ? B.you : null; if (!m) return null;
    m.anchor('head', _v); const head = _v.clone().add(new THREE.Vector3(0, -3, 0)), yaw = m.root.rotation.y;
    faceCam.position.set(head.x + Math.sin(yaw + .35) * 38, head.y + 3, head.z + Math.cos(yaw + .35) * 38); faceCam.lookAt(head); faceCam.updateProjectionMatrix();
    return { scene, camera: faceCam };
  }
  // ---------- evolving: the two shapes flicker, faster and faster, then the new one stands there (B stops it) ----------
  async function evolveScene(m) {
    const into = DATA.CREATURES[m.id].evo.into, name = MON.name(m), newName = DATA.CREATURES[into].name;
    if (B.foe) B.foe.model.root.visible = false;
    for (const p of [B.you, B.them]) if (p) p.root.visible = false;
    B.evolving = true;
    const own = B.ally && B.ally.mon === m, old = own ? B.ally : side(m, false); if (!own) B.extra.push(old);
    old.model.reset(); old.model.root.visible = true;
    const nw = side(Object.assign({}, m, { id: into }), false); B.extra.push(nw);
    nw.model.root.position.copy(old.home); nw.model.root.rotation.y = old.model.root.rotation.y; nw.model.root.visible = false;
    shot('evolve');
    CC.sfx('status');
    await UI.say('What? ' + name + ' is evolving!', { auto: .8 });
    let t = 0, cancelled = false;
    const at = top(old, .5);
    await new Promise((ok) => {
      B.tick = (dt) => {
        t += dt; BATTLE._evo = t; if (G.input.pressed.b) cancelled = true;
        const showNew = Math.sin(t * (1.6 + t * t * .9) * Math.PI) > 0;
        old.model.root.visible = !showNew; nw.model.root.visible = showNew; nw.model.update(G.t, dt, 0);
        old.model.flash(1, '#ffffff'); nw.model.flash(1, '#ffffff');
        if (Math.random() < dt * 24) fx.emit({ x: at.x + G.rand(-30, 30), y: at.y + G.rand(-24, 30), z: at.z + G.rand(-20, 20), vy: G.rand(10, 30), life: .8, size: 7, shape: 'sparkle', color: G.pick(['#fff4c0', '#c8e8ff', '#ffffff']), add: true });
        if (t >= 4.4 || cancelled) { B.tick = null; ok(); }
      };
    });
    if (cancelled) {
      nw.model.root.visible = false; old.model.root.visible = true;
      await UI.say('Huh? ' + name + ' stopped evolving! It will ask again after another win.');
      m.evoAsk = true;
      return false;
    }
    old.model.root.visible = false; nw.model.root.visible = true; nw.model.flash(1, '#ffffff'); nw.model.play('happy');
    MV.flash(at, '#ffffff', 120, .6); MV.ring(old.home.clone().setY(1.5), '#fff4c0', { r0: 10, r1: 90, dur: .7, op: .8 });
    for (let i = 0; i < 30; i++) fx.emit({ x: at.x, y: at.y, z: at.z, vx: G.rand(-90, 90), vy: G.rand(-20, 110), vz: G.rand(-90, 90), g: 80, life: 1.1, size: 7, shape: 'star', color: G.pick(['#f8e050', '#ffffff', '#c8e8ff']), add: true });
    CC.sfx('levelup');
    const before = MON.maxHp(m); m.id = into; m.hp = Math.max(1, Math.min(MON.maxHp(m), m.hp + MON.maxHp(m) - before));
    G.state.caught[into] = 1; G.state.seen[into] = 1;
    await UI.say('Congratulations! Your ' + name + ' evolved into ' + newName + '!');
    for (const mv of MON.newMovesAt(into, m.lv)) await STORY.learnMove(m, mv);
    if (MON.canEvolve(m)) m.evoAsk = true; // already past its next stage's level too
    return true;
  }
  // Chapter 1 has no evolving (our evolved forms aren't modelled yet); ?evolve turns the earlier demo's evolving back on
  const EVOLVE = /[?&]evolve/.test(location.search);
  // after a win: anyone who reached its evolution level gets asked (one that fainted waits for a later win)
  async function evolveParty() {
    for (const m of G.state.party) {
      if (!m.evoAsk) continue;
      if (!MON.canEvolve(m)) { delete m.evoAsk; continue; }
      if (m.hp <= 0) continue;
      delete m.evoAsk;
      if (await UI.yesNo(MON.name(m) + ' is ready to evolve! Let it?')) { while (await evolveScene(m) && m.evoAsk && MON.canEvolve(m) && (await UI.yesNo(MON.name(m) + ' is ready to evolve again! Let it?'))) delete m.evoAsk; }
      else { await UI.say(MON.name(m) + ' stayed as it is. It will ask again after another win.'); m.evoAsk = true; }
    }
  }
  // opts: { wild: mon } or { trainer: { name, look, team, intro, winText, loseText }, canLose }
  async function fight(opts) {
    build(); setLook(G.look.battle === 'painted' ? opts.paint || (WORLD.info && WORLD.info.map.id === 'meadow' ? 'meadow' : 'village') : null);
    Object.assign(B, { wild: !!opts.wild, trainer: opts.trainer || null, runs: 0, fought: {}, foeIndex: 0, ally: null, foe: null, you: null, them: null, extra: [], tick: null });
    B.foeTeam = opts.wild ? [opts.wild] : opts.trainer.team;
    B.allyIndex = Math.max(0, G.state.party.findIndex((m) => m.hp > 0));
    B.foe = side(B.foeTeam[0], true);
    B.you = WORLD.person(G.state.look); B.you.root.position.copy(YOU); B.you.root.rotation.y = Math.PI - .6; scene.add(B.you.root);
    if (B.trainer) { B.them = WORLD.person(B.trainer.look); B.them.root.position.copy(TRAINER); B.them.root.rotation.y = -.5; scene.add(B.them.root); }
    if (LOOK.painted) for (const [m, at, tall] of [[B.you, YOU, 44], [B.them, TRAINER, 40]]) if (m) m.root.scale.multiplyScalar(tall / 160 * 2 * at.distanceTo(PAINTCAM[0]) * Math.tan(19 * Math.PI / 180) / 24);
    fx.clear();
    const was = { update: G.update, render: G.render, face: UI.faceShot };
    G.update = update; G.render = render; BATTLE.active = true; UI.faceShotFn = faceShot;
    G.push(screen);
    if (CC.music) CC.music.play(opts.vs === 'rival' ? 'rival' : opts.trainer ? 'trainer' : 'wild');
    await G.fade(.35, 0);
    let result;
    try { result = await battle(); } catch (e) { console.error(e); result = 'run'; }
    if (result === 'win') {
      if (CC.music) CC.music.play('victory');
      if (B.trainer) { shot('trainer'); if (B.them) B.them.play('surprise'); await UI.say(B.trainer.winText, { who: B.trainer.name }); G.state.coins += B.trainer.coins || 0; await UI.say('You got ' + (B.trainer.coins || 0) + ' coins for winning!'); }
    } else if (result === 'lose' && B.trainer) { shot('trainer'); if (B.them) B.them.play('cheer'); await UI.say(B.trainer.loseText, { who: B.trainer.name }); }
    else if (result === 'lose') await UI.say('You have no creatures left that can fight!');
    if (result === 'win' || result === 'caught') { try { await evolveParty(); } catch (e) { console.error(e); } }
    await G.fade(.4, 1);
    G.pop(screen);
    for (const s of [B.ally, B.foe].concat(B.extra)) drop(s);
    B.extra = []; B.tick = null; B.evolving = false;
    if (B.you) scene.remove(B.you.root); if (B.them) scene.remove(B.them.root);
    for (const m of G.state.party) { m.status = m.status === 'sleep' ? null : m.status; }
    G.update = was.update; G.render = was.render; BATTLE.active = false; UI.faceShotFn = null; G.fadeCol = '#000000';
    // your walking companion is the first in your party: an evolution changes it
    const lead = G.state.party[0];
    if (lead && WORLD.follower && WORLD.follower.id && WORLD.follower.id !== lead.id) { const F_ = WORLD.follower, keep = { x: F_.x, y: F_.y, px: F_.px, pz: F_.pz, dir: F_.dir }; WORLD.setFollower(lead.id); Object.assign(WORLD.follower, keep); }
    return result;
  }

  // ---------- the Move Demo: every early move of the five first creatures, played on demand ----------
  // every creature with both a model and game data; each faces one it hits hard, if there is one
  const DEMO_MONS = Object.keys(DATA.CREATURES).filter((id) => CREATURE_DEFS[id]);
  const DEMO_FOE = { drizzlon: 'embroak', mossback: 'drizzlon', embroak: 'mossback', clovermouse: 'hopsprout', hopsprout: 'clovermouse' };
  const foeFor = (id) => { const q = (location.search.match(/[?&]vs=(\w+)/) || [])[1]; if (q && CREATURE_DEFS[q]) return q; if (DEMO_FOE[id]) return DEMO_FOE[id]; const ty = DATA.CREATURES[id].types[0]; return DEMO_MONS.find((o) => o !== id && DATA.typeMult(ty, DATA.CREATURES[o].types) > 1) || (id === 'clovermouse' ? 'hopsprout' : 'clovermouse'); };
  const LOOKS = [[null, '3D clearing'], ['meadow', 'Painted meadow'], ['village', 'Painted village yard']];
  async function demo(opts) {
    build(); opts = opts || {};
    const D = { i: Math.max(0, DEMO_MONS.indexOf(opts.who)), sel: 0, look: opts.look || 0, flip: false, busy: false, stop: false, msg: null };
    BATTLE._demo = D; // for the test pages
    Object.assign(B, { wild: false, trainer: null, you: null, them: null, ally: null, foe: null });
    const movesOf = (id) => { const out = []; for (const e of DATA.CREATURES[id].learn) if (out.indexOf(e[1]) < 0 && DATA.MOVES[e[1]]) out.push(e[1]); return out; };
    const list = () => ['all'].concat(movesOf(DEMO_MONS[D.i]));
    function stageUp() {
      drop(B.ally); drop(B.foe); fx.clear(); MV.update(99);
      setLook(LOOKS[D.look][0]);
      const me = DEMO_MONS[D.i], them = foeFor(me);
      B.ally = side(MON.make(D.flip ? them : me, 20), false); B.foe = side(MON.make(D.flip ? me : them, 20), true);
      for (const s_ of [B.ally, B.foe]) { s_.model.root.visible = true; s_.shownOnce = true; }
      shot('demo', true);
    }
    const user = () => (D.flip ? B.foe : B.ally), target = () => (D.flip ? B.ally : B.foe);
    function settle(s_) { // back home, as it was
      s_.model.root.position.copy(s_.home); s_.model.root.scale.setScalar(s_.scale); s_.model.root.visible = true;
      const other = s_.isFoe ? ALLY : FOE, face = Math.atan2(other.x - s_.home.x, other.z - s_.home.z);
      s_.model.root.rotation.y = s_.isFoe ? face + .55 : face - .2; s_.st = { atk: 0, def: 0, spd: 0, acc: 0 };
    }
    async function playOne(id) {
      const u = user(), t = target(), move = Object.assign({ id }, DATA.MOVES[id]), f = move.fx || {};
      D.msg = [MON.name(u.mon) + ' used ' + move.name + '!'];
      if (f.heal) { u.mon.hp = Math.ceil(MON.maxHp(u.mon) * .45); u.hpShown = u.mon.hp; }
      shot('demo');
      const back = await MV.play(id, u, t);
      const popAt = (s_, str, col, size) => { const v = top(s_, .8).project(camera); UI.pop(str, (v.x * .5 + .5) * 240, Math.max(46, (1 - (v.y * .5 + .5)) * 160), col, size); };
      if (move.power) {
        const r = damage(u, t, move, false);
        t.mon.hp = Math.max(1, t.mon.hp - r.dmg);
        if (r.mult > 1) { popAt(t, 'SUPER EFFECTIVE!', '#ff8a3a'); D.msg.push('It\'s super effective!'); }
        else if (r.mult < 1) { popAt(t, 'not very effective', '#a8c0d0', 9); D.msg.push('It\'s not very effective...'); }
        if (f.crit) D.msg.push('A move that lands critical hits more often.');
        if (f.status) { D.msg.push('It can leave the target ' + { burn: 'burned.', shock: 'shocked.', poison: 'poisoned.', sleep: 'asleep.' }[f.status]); t.mon.status = f.status; statusFx(t, 16); }
        if (f.drain) D.msg.push('It drains some health back.');
        if (f.hits) D.msg.push('It hits more than once.');
        await Promise.all([hitFx(t, r.mult, false, move.type), hpTo(t), back ? back() : null]);
      } else {
        if (back) await back();
        if (f.heal) { u.mon.hp = MON.maxHp(u.mon); await hpTo(u, .7); D.msg.push(MON.name(u.mon) + ' regained health!'); }
        else if (f.status === 'sleep') {
          t.model.setSleep(true); CC.sfx('status'); D.msg.push(MON.name(t.mon) + ' fell asleep!');
          for (let i = 0; i < 3; i++) fx.emit({ x: t.home.x + 8, y: top(t, 1).y, z: t.home.z, vx: 8, vy: 14, life: 1.2, size: 9, shape: 'z', color: '#ffffff', delay: i * .5 });
          await G.sleep(1.8); t.model.setSleep(false);
        } else if (f.status === 'burn') {
          CC.sfx('status'); D.msg.push(MON.name(t.mon) + ' was burned!');
          for (let i = 0; i < 3; i++) { burstAt(top(t, .4), 'Fire', 8, { speed: 30 }); t.model.flash(.8, '#ff8a4a'); await G.sleep(.35); }
        } else if (f.status === 'shock' || f.status === 'poison') {
          const sh = f.status === 'shock'; CC.sfx('status'); t.mon.status = f.status; D.msg.push(MON.name(t.mon) + (sh ? ' is shocked!' : ' was poisoned!'));
          if (sh) t.model.play('shake');
          for (let i = 0; i < 3; i++) { statusFx(t, 12); t.model.flash(.8, sh ? '#fff07a' : '#b46ae0'); await G.sleep(.35); }
        } else if (f.stat) {
          const s_ = f.self ? u : t, up = f.stages > 0;
          popAt(s_, STAT_SHORT[f.stat] + (up ? ' UP' : ' DOWN'), up ? '#ffa04a' : '#7aa8f0'); CC.sfx(up ? 'statup' : 'statdown');
          if (!up) for (let i = 0; i < 12; i++) fx.emit({ x: s_.home.x + G.rand(-14, 14), y: top(s_, 1).y, z: s_.home.z + G.rand(-10, 10), vy: -40, life: .6, size: 5, shape: 'dust', color: '#7aa8f0', add: true });
          D.msg.push(MON.name(s_.mon) + '\'s ' + STAT_NAME[f.stat] + (up ? ' rose!' : ' fell!'));
        }
      }
      await G.sleep(.9);
      for (const s_ of [B.ally, B.foe]) { s_.mon.hp = MON.maxHp(s_.mon); s_.mon.status = null; settle(s_); }
      await Promise.all([hpTo(B.ally, .3), hpTo(B.foe, .3)]);
      D.msg = null;
    }
    async function run(sel) {
      D.busy = true; D.stop = false;
      const ids = list(), todo = ids[sel] === 'all' ? ids.slice(1) : [ids[sel]];
      for (const id of todo) { if (D.stop) break; await playOne(id); await G.sleep(.25); }
      D.busy = false; D.msg = null;
    }
    let done = null;
    const screen_ = {
      name: 'movedemo',
      update() {
        const inp = G.input.pressed;
        if (D.busy) { if (inp.b) { D.stop = true; CC.sfx('back'); } return; }
        const ids = list();
        if (G.repeat('down')) { D.sel = (D.sel + 1) % ids.length; CC.sfx('blip'); }
        if (G.repeat('up')) { D.sel = (D.sel + ids.length - 1) % ids.length; CC.sfx('blip'); }
        if (inp.left || inp.right) { D.i = (D.i + (inp.right ? 1 : DEMO_MONS.length - 1)) % DEMO_MONS.length; D.sel = Math.min(D.sel, list().length - 1); CC.sfx('select'); stageUp(); }
        else if (inp.start) { D.look = (D.look + 1) % LOOKS.length; CC.sfx('select'); stageUp(); }
        else if (inp.l || inp.r) { D.flip = !D.flip; CC.sfx('select'); stageUp(); }
        else if (inp.a) { CC.sfx('select'); run(D.sel); }
        else if (inp.b) { CC.sfx('back'); done(); }
      },
      draw() {
        drawPanels(132, 4);
        UI.box(2, 110, 236, 48);
        if (D.msg) { D.msg.slice(0, 2).forEach((l, i) => UI.text(l, 10, 117 + i * 16, '#1c1624')); if (D.busy && list()[D.sel] === 'all') UI.text('B: stop', 230, 147, '#8a7a70', { size: 8, align: 'right' }); return; }
        const me = DEMO_MONS[D.i], ids = list(), id = ids[D.sel], mv = DATA.MOVES[id];
        const nmW = UI.textWidth(DATA.CREATURES[me].name);
        UI.text('◀', 10, 115, '#a84a2a'); UI.text(DATA.CREATURES[me].name, 22, 115, '#1c1624'); UI.text('▶', 26 + nmW, 115, '#a84a2a');
        UI.text(LOOKS[D.look][1], 230, 116, '#7a6a60', { size: 8, align: 'right' });
        if (id === 'all') { UI.text('▲▼  Play all ' + (ids.length - 1) + ' moves', 10, 131, '#1c1624'); }
        else {
          UI.text('▲▼  ' + mv.name, 10, 131, '#1c1624');
          const c = TC(mv.type, 1), tw = 44; UI.rect(150, 131, tw, 11, c); UI.text(mv.type.toUpperCase(), 150 + tw / 2, 132, '#ffffff', { size: 8, align: 'center', shadow: false });
          UI.textNum(mv.power ? 'POW ' + mv.power : 'EFFECT', 230, 132, '#6a5a50', { size: 9, align: 'right' });
        }
        UI.text('A play  MENU backdrop  L/R swap  B exit', 120, 146, '#7a6a60', { size: 8, align: 'center' });
      },
    };
    const was = { update: G.update, render: G.render };
    G.update = update; G.render = render; BATTLE.active = true;
    stageUp(); G.push(screen_);
    if (CC.music) CC.music.play('wild');
    await G.fade(.35, 0);
    await new Promise((res) => { done = res; });
    await G.fade(.4, 1);
    G.pop(screen_); drop(B.ally); drop(B.foe); B.ally = B.foe = null; fx.clear(); setLook(null);
    G.update = was.update; G.render = was.render; BATTLE.active = false;
  }
  return { fight, demo, setup(r) { R = r; }, faceShot, active: false, camera, scene, _B: B };
})();
