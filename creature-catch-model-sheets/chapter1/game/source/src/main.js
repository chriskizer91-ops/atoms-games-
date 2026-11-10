// main.js: the title (a meadow at sunset, the cube turning in the air and the starters peeking out of the grass), choosing
// your explorer, the opening (the dim moon over Home Village at night, then morning), and drawing it all: the 3D view, the
// speakers' live faces beside the dialog box, and the little stage your creatures turn on in the menu.
const MAIN = (() => {
  'use strict';
  let R = null;
  // ---------- the title scene ----------
  const TITLE = (() => {
    let S = null;
    function build() {
      if (S) return S;
      const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1.5, 1, 6000);
      scene.fog = new THREE.Fog('#e8906a', 1100, 3200);
      const skyU = { a: { value: new THREE.Color('#40306e') }, b: { value: new THREE.Color('#e87a5a') }, c: { value: new THREE.Color('#f8c070') } };
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU, vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform vec3 a; uniform vec3 b; uniform vec3 c; varying vec3 vD; void main() { float y = vD.y; vec3 col = y > 0.12 ? mix(b, a, smoothstep(0.12, 0.6, y)) : mix(c, b, smoothstep(-0.02, 0.12, y)); gl_FragColor = vec4(col, 1.0); }' })));
      scene.add(new THREE.AmbientLight('#ffe0d0', .55), new THREE.HemisphereLight('#ffd0b0', '#4a6a3a', .35));
      const sun = new THREE.DirectionalLight('#ffc890', .8); sun.position.set(-200, 120, -400); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 1, far: 1200 }); scene.add(sun);
      const gt = KIT.canvasTex(128, 128, (g) => { g.fillStyle = '#5aa840'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++) { g.fillStyle = ['#6cbc48', '#4a9638', '#78c850'][i % 3]; g.fillRect(Math.random() * 128 | 0, Math.random() * 128 | 0, 2, 2); } }, { repeat: true }); gt.repeat.set(20, 20);
      const ground = new THREE.Mesh(new THREE.CircleGeometry(2400, 48), KIT.toon('#ffffff', { mat: { map: gt } })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const B = KIT.builder(), M = PLACES.MAT;
      for (let i = 0; i < 12; i++) B.add(new THREE.ConeGeometry(300 + (i % 3) * 120, 300 + (i % 4) * 110, 6), M.plain, [(i - 6) * 330, 130, -1500 - (i % 2) * 250], [0, i, 0], null, { tint: (v, n) => KIT.rgb(n.y > .6 ? '#8a6ab0' : n.x > 0 ? '#5a4a8a' : '#6e5a9e') });
      B.add(new THREE.CircleGeometry(500, 32), M.glow, [-300, 1, -800], [-Math.PI / 2, 0, 0], [1, .35, 1], { tint: '#f8b080', ink: 0 });
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 320 + (i % 4) * 40; if (Math.sin(a) < -.3 && Math.abs(Math.cos(a)) < .7) continue; B.add(KIT.lumpy(24 + (i % 3) * 6, i, .2), M.leaf, [Math.cos(a) * r, 34, Math.sin(a) * r - 60], null, [1, 1.2, 1], { tint: (v, n) => KIT.rgb(n.y > .4 ? '#5a9a48' : '#2f6a34') }); }
      B.build(scene, null, { cast: true, receive: true }); // painted, no ink (as our models)
      // a field of tall grass round the cube
      const spots = []; for (let i = 0; i < 900; i++) { const a = Math.random() * Math.PI * 2, r = 12 + Math.sqrt(Math.random()) * 170; spots.push([Math.cos(a) * r, Math.sin(a) * r - 10, 1 + Math.random() * .6]); }
      const im = new THREE.InstancedMesh(PLACES.TUFT, PLACES.grassMat, spots.length), d = new THREE.Object3D();
      spots.forEach(([x, z, s], i) => { d.position.set(x, 0, z); d.scale.setScalar(s); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); im.frustumCulled = false; scene.add(im);
      // the cube, turning in the air with a glow round it
      const cube = makeCube(); cube.root.scale.setScalar(60); scene.add(cube.root);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#fff0e0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .5 })); halo.scale.setScalar(70); scene.add(halo);
      // creatures peeking out of the grass
      const peek = ['drizzlon', 'mossback', 'embroak', 'clovermouse', 'hopsprout'].map((id, i) => { const c = makeCreature(id, { seed: i }); const a = i / 5 * Math.PI * 2 + .3, r = 54 + (i % 2) * 10; c.root.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); c.root.rotation.y = a; c.root.scale.setScalar(36); scene.add(c.root); return c; });
      const explorers = ['player-a', 'player-b'].map((k, i) => { const p = WORLD.person(k); p.root.position.set(i ? 18 : -18, 0, 70); p.root.visible = false; scene.add(p.root); return p; });
      const fx = FX.make(scene, 200);
      S = { scene, cam, cube, halo, peek, explorers, fx, ang: 0, zoom: 0, sel: 0 };
      return S;
    }
    function render(dt) {
      const s = S, t = G.t;
      s.cube.root.position.set(0, 42 + Math.sin(t * 2) * 3, 0); s.cube.spin.rotation.set(Math.sin(t) * .15, t * .8, Math.sin(t * .7) * .1); s.halo.position.copy(s.cube.root.position);
      s.peek.forEach((c, i) => { const k = Math.max(0, Math.sin(t * 1.1 + i * 1.7)); c.root.position.y = -16 + k * 16; c.update(t, dt, 0); });
      s.explorers.forEach((p, i) => { p.animate(0, 0, t, dt); p.root.rotation.y = G.lerp(p.root.rotation.y, i === s.sel ? 0 : (i ? -.5 : .5), Math.min(1, dt * 5)); });
      if (Math.random() < dt * 6) s.fx.emit({ x: G.rand(-40, 40), y: G.rand(10, 60), z: G.rand(-20, 30), vy: 4, life: 2, size: 5, shape: 'sparkle', color: G.pick(['#fff4c0', '#ffd0f0']), add: true });
      s.fx.update(dt, G.frame.h * G.frame.pr * .9);
      PLACES.GRASSU.uT.value = t; KIT.WIND.uT.value = t; PLACES.GRASSU.uP.value.set(-999, -999); KIT.SEE.uSee.value.set(0, 0, 0);
      s.ang += dt * .06;
      const z = G.ease(s.zoom), r = G.lerp(175, 120, z), h = G.lerp(58, 36, z), ly = G.lerp(34, 22, z);
      s.cam.position.set(Math.sin(s.ang * (1 - z)) * r, h, Math.cos(s.ang * (1 - z)) * r); s.cam.lookAt(0, ly, G.lerp(0, 40, z));
      R.render(s.scene, s.cam);
    }
    return { build, render, get S() { return S; } };
  })();
  function titleScreen() {
    return new Promise((resolve) => {
      let sel = 0; const items = ['New Game', 'Move Demo', 'Looks'];
      const scr = {
        update() {
          if (G.input.pressed.up || G.input.pressed.down) { sel = (sel + (G.input.pressed.down ? 1 : items.length - 1)) % items.length; CC.sfx('blip'); }
          if (G.input.pressed.a || G.input.pressed.start) { CC.sfx('select'); G.pop(scr); resolve(items[sel]); }
        },
        draw() {
          UI.text('Creature Catch', 120, 12, '#ffffff', { size: 22, align: 'center', shadow: '#5a2a6e' });
          UI.text('3D: Chapter 1', 120, 38, '#fff4d8', { size: 9, align: 'center', shadow: '#5a2a6e' });
          UI.g.globalAlpha = .9; UI.box(78, 92, 84, 52); UI.g.globalAlpha = 1;
          items.forEach((it, i) => UI.text(it, 92, 98 + i * 15, '#1c1624')); UI.cursor(84, 100 + sel * 15);
          if (Math.floor(G.t * 2) % 2) UI.text('Press A', 120, 148, '#fff8e0', { size: 9, align: 'center', shadow: '#5a3a2a' });
        },
      };
      G.push(scr);
    });
  }
  function chooseExplorer() {
    const S = TITLE.S; S.explorers.forEach((p) => { p.root.visible = true; p.play('wave'); });
    G.tween(1.2, (k) => { S.zoom = k; });
    return new Promise((resolve) => {
      const looks = ['player-a', 'player-b'];
      const scr = {
        update() {
          if (G.input.pressed.left || G.input.pressed.right) { S.sel ^= 1; CC.sfx('blip'); S.explorers[S.sel].play('wave', true); }
          if (G.input.pressed.a) { CC.sfx('select'); S.explorers[S.sel].play('cheer', true); G.pop(scr); resolve(looks[S.sel]); }
        },
        draw() {
          UI.text('Which explorer are you?', 120, 8, '#ffffff', { align: 'center', shadow: '#000000' });
          UI.text('Left / right to choose, A to start.', 120, 146, '#fff4c0', { size: 9, align: 'center', shadow: '#000000' });
        },
      };
      G.push(scr);
    });
  }

  // ---------- the opening: the dim moon over Home Village, then morning ----------
  async function opening(look) {
    G.newState(look);
    const W = WORLD;
    W.setPlayer(look); W.setFollower(null);
    W.enter('village', 4, 12, 'down'); W.player.hidden = true; W.setNight(1); W.moon.visible = true; W.moonDisc.material.opacity = .55; W.moonHalo.material.opacity = .45;
    G.push(W.screen);
    const shots = [{ tx: 176, ty: 210, tz: -60, elev: .04, hv: 380, yaw: 0 }, { tx: 176, ty: 0, tz: 120, elev: .95, hv: 290, yaw: 0 }];
    let k = 0; Object.assign(W.cam, shots[0]);
    W.ctl = (cam, dt) => { k = Math.min(1, k + dt / 9); const e = G.ease(k); for (const key of ['tx', 'ty', 'tz', 'elev', 'hv']) cam[key] = G.lerp(shots[0][key], shots[1][key], e); cam.yaw = 0; cam.fov = 35; };
    if (CC.music) CC.music.play('title');
    await G.fade(1.4, 0);
    await UI.say('For many nights now, the moon over Home Village has been growing dimmer.');
    await UI.say('The villagers look up and worry. Out in the tall grass, the creatures hide and tremble.');
    await G.fade(.8, 1);
    W.ctl = null; W.setNight(0); W.moon.visible = false; W.player.hidden = false; W.snap = true; W.player.dir = 'down';
    if (CC.music) CC.music.play('village');
    await G.fade(.8, 0);
    W.player.model.play('look');
    await UI.say('Welcome to Home Village! Creatures live in the wild all around here, hiding in the tall grass.');
    await UI.say('Arrows (or the pad) to walk, hold B to run, A to talk, and MENU for your creatures. Hold L or R (the Q and E keys) to look around.');
    await UI.say('Elder Willow lives in the big house with the mossy roof. Go and say hello!');
  }

  // ---------- drawing: the view, then the faces and the creature stage in their squares ----------
  const SHOW = (() => {
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .05, 100), models = {};
    scene.background = new THREE.Color('#dfeaf4');
    scene.add(new THREE.AmbientLight('#ffffff', .6), new THREE.HemisphereLight('#ffffff', '#a8b8a0', .4));
    const key = new THREE.DirectionalLight('#fff4e0', .7); key.position.set(-2, 4, 3); scene.add(key);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(.45, .5, .06, 32), KIT.toon('#9ad070')); ped.position.y = -.03; scene.add(ped);
    return { get(id) { if (!models[id]) { models[id] = makeCreature(id); scene.add(models[id].root); } for (const k in models) models[k].root.visible = k === id; return models[id]; }, scene, cam };
  })();
  function viewport(req, sc, bg) {
    const f = G.frame, sx = f.w / 240, sy = f.h / 160, x = req.x * sx, y = f.h - (req.y + req.h) * sy, w = req.w * sx, h = req.h * sy;
    const see = KIT.SEE.uSee.value.clone(); KIT.SEE.uSee.value.set(0, 0, 0);
    R.setScissorTest(true); R.setScissor(x, y, w, h); R.setViewport(x, y, w, h);
    sc.camera.aspect = w / h; sc.camera.updateProjectionMatrix();
    const was = sc.scene.background; if (bg) sc.scene.background = new THREE.Color(bg);
    R.render(sc.scene, sc.camera);
    sc.scene.background = was; R.setScissorTest(false); R.setViewport(0, 0, f.w, f.h); KIT.SEE.uSee.value.copy(see);
  }
  function afterRender(dt) {
    const fr = UI.faceReq;
    if (fr) { const sc = BATTLE.active ? BATTLE.faceShot(fr.who) : WORLD.faceShot(fr.who); if (sc) viewport(fr, sc, '#cfe0f0'); }
    const sh = UI.showcase;
    if (sh) {
      const m = SHOW.get(sh.id); m.update(G.t, dt, 0); m.root.rotation.y = G.t * .7;
      const h = m.height, d = Math.max(h, m.width || .5) * 2.4;
      SHOW.cam.position.set(0, h * .75, d); SHOW.cam.lookAt(0, h * .45, 0);
      viewport(sh, { scene: SHOW.scene, camera: SHOW.cam });
    }
  }
  UI.hasFace = (who) => !!(BATTLE.active ? BATTLE.faceShot(who) : WORLD.info && WORLD.faceShot(who));

  // ---------- loading our painted models and tiles, with a progress bar ----------
  async function loadModels() {
    let k1 = 0, k2 = 0;
    const scr = { draw() {
      const k = k1 * .85 + k2 * .15;
      UI.rect(0, 0, 240, 160, '#1b1626');
      UI.text('Creature Catch', 120, 52, '#ffffff', { size: 18, align: 'center', shadow: '#5a2a6e' });
      UI.text('Loading the painted models...', 120, 82, '#e8e0f8', { size: 9, align: 'center' });
      UI.bar(50, 98, 140, k, '#9a7ae0');
      UI.text(Math.round(k * 100) + '%', 120, 108, '#b8a8d8', { size: 8, align: 'center' });
    } };
    G.push(scr);
    try { await Promise.all([MODELS.load((k) => { k1 = k; }), TILES.load((k) => { k2 = k; })]); } catch (e) { console.error(e); }
    k1 = k2 = 1; await G.sleep(.05);
    G.pop(scr);
  }
  // ---------- start ----------
  async function boot() {
    UI.init();
    const cv = document.getElementById('gl');
    R = G.R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor('#1b1626');
    G.start();
    WORLD.setup(R); BATTLE.setup(R);
    G.afterRender = afterRender;
    if (document.fonts && document.fonts.load) { try { await document.fonts.load('10px Pixelify'); } catch (e) { /* the monospace fallback */ } }
    await loadModels();
    const at = (location.search.match(/[?&]at=(\w+)/) || [])[1];
    if (at === 'moves') { const q = (k) => (location.search.match(new RegExp('[?&]' + k + '=(\\w+)')) || [])[1]; for (;;) await BATTLE.demo({ who: q('who'), look: +(q('bg') || 0) }); }
    if (at === 'lineup') return lineup();
    if (at) return devStart(at);
    TITLE.build();
    G.render = TITLE.render; G.update = null;
    G.fadeA = 1; G.fade(1, 0);
    for (;;) {
      if (CC.music) CC.music.play('title');
      const pick = await titleScreen();
      if (pick === 'Looks') { await STORY.looksMenu(); continue; }
      if (pick !== 'Move Demo') break;
      await G.fade(.4, 1); await BATTLE.demo();
      G.render = TITLE.render; G.update = null; await G.fade(.5, 0);
    }
    const look = await chooseExplorer();
    await G.sleep(.9);
    await G.fade(.6, 1);
    G.render = WORLD.render; G.update = WORLD.update;
    await WORLD.run(() => opening(look));
  }
  // for checking models up close: ?at=lineup&who=drizzlon,player-a,willow&act=attack&yaw=0.5 (the town's light; people
  // scaled as in town, creatures as their town follower size; act plays on all of them, again every 2.5 s)
  function lineup() {
    const q = (k, d) => (location.search.match(new RegExp('[?&]' + k + '=([\\w,.:-]+)')) || [])[1] || d;
    const who = q('who', 'drizzlon,mossback,embroak,player-a,player-b').split(','), act = q('act', ''), yaw = +q('yaw', 0);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#9cc8e8');
    scene.add(new THREE.AmbientLight('#ffffff', .36), new THREE.HemisphereLight('#e4eeff', '#7a8a5a', .34));
    const sun = new THREE.DirectionalLight('#fff2dc', .68); sun.position.set(-110, 220, 140); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80 }); scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), KIT.paint('#7cc456')); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const sp = 24, items = who.map((id, i) => {
      const isP = !!LOOKS[id]; const m = isP ? WORLD.person(id) : WORLD.creature(id);
      m.root.position.set((i - (who.length - 1) / 2) * sp, 0, 0); m.root.rotation.y = yaw; scene.add(m.root); return { m, isP };
    });
    const cam = new THREE.PerspectiveCamera(30, 1.5, 1, 2000), span = who.length * sp;
    const zoom = +q('zoom', 1), dist = (span + 10) / (2 * Math.tan(15 * Math.PI / 180) * 1.5) / zoom; cam.position.set(0, 12 + dist * .16, dist); cam.lookAt(0, 10, 0);
    let next = .8;
    G.update = (dt) => { next -= dt; if (act && next <= 0) { next = 2.5; for (const it of items) { if (it.isP) it.m.play(act, true); else it.m.play(act); } } };
    G.render = (dt) => { for (const it of items) { if (it.isP) it.m.animate(0, 0, G.t, dt); else it.m.update(G.t, dt, 0); } KIT.SEE.uSee.value.set(0, 0, 0); R.render(scene, cam); };
    MAIN.lineupItems = items;
  }
  // a quick start somewhere in the story, for testing (?at=village, willow, meadow, battle, rival, legend)
  async function devStart(at) {
    const look = (location.search.match(/[?&]look=([\w-]+)/) || [])[1] || 'player-a', st = (location.search.match(/[?&]starter=(\w+)/) || [])[1] || 'drizzlon';
    G.newState(look); WORLD.setPlayer(look);
    G.render = WORLD.render; G.update = WORLD.update; G.push(WORLD.screen);
    const lv0 = +((location.search.match(/[?&]lv=(\d+)/) || [])[1] || 5);
    if (at !== 'willow') { G.flags.starter = st; G.state.party.push(MON.make(st, lv0)); G.state.bag.cube = 5; G.state.bag.potion = 3; WORLD.setFollower(st); }
    const spot = { village: ['village', 10, 6, 'up'], willow: ['willow-in', 5, 5, 'up'], meadow: ['meadow', 7, 16, 'up'], battle: ['meadow', 7, 12, 'up'], grassland: ['grassland', 12, 14, 'up'], trial: ['grassland', 12, 3, 'up'], evolve: ['meadow', 7, 12, 'up'], rival: ['willow-in', 5, 5, 'up'], legend: ['willow-in', 5, 5, 'up'], top: ['meadow', 7, 2, 'up'] }[at] || ['village', 10, 6, 'up'];
    WORLD.enter(...spot);
    if (at === 'battle') await WORLD.run(() => STORY.wildEncounter('meadow'));
    if (at === 'trial') { WORLD.player.dir = 'up'; }
    if (at === 'evolve') { const m = G.state.party[0]; m.lv = DATA.CREATURES[m.id].evo.at - 1; m.xp = MON.xpFor(m.lv + 1) - 1; m.hp = MON.maxHp(m); await WORLD.run(() => BATTLE.fight({ wild: MON.make('hopsprout', 3) })); }
    if (at === 'rival') await WORLD.run(() => BATTLE.fight({ vs: 'rival', canLose: true, trainer: { name: 'Juniper', look: 'juniper', coins: 100, winText: 'What?!', loseText: 'Ha!', team: [MON.make(DATA.RIVAL_PICK[st], 5)] } }));
    if (at === 'opening') { G.pop(WORLD.screen); await WORLD.run(() => opening(look)); }
    if (at === 'legend') await WORLD.run(() => STORY.LEGEND.tell(['a', 'b', 'c', 'd'], 'Elder Willow'));
  }
  return { boot, TITLE };
})();
window.addEventListener('load', () => MAIN.boot());
