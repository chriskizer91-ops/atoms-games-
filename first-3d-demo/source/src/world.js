// world.js: walking about in 3D. Tile by tile, as Creature Catch moves, but smooth: the camera follows over your shoulder
// from above (hold L or R to swing it round for a look; it springs back), your lead creature follows a step behind, and
// people turn to face you when you talk to them. Doors swing open, the tall grass parts round your legs and shakes when
// something is hiding in it. Day and night, the sky and the moon are here too, for the story's moments.
const WORLD = (() => {
  'use strict';
  const T = 16, MS = 24 / 1.13, MC = 24; // people: 24 px tall; creatures: their model metres x 24
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const YAW = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
  const ORDER = ['up', 'right', 'down', 'left'];
  const W = { mapId: null, info: null, busy: 0, scene: null, camera: null, npcs: [], cooldown: 0, night: 0, ctl: null, quarter: 0 };
  let R = null;

  // ---------- the scene: lights, sky, the moon, particles ----------
  function setup(renderer) {
    R = renderer;
    const s = W.scene = new THREE.Scene();
    W.camera = new THREE.PerspectiveCamera(35, 1.5, 1, 4000);
    W.amb = new THREE.AmbientLight('#ffffff', .36); W.hemi = new THREE.HemisphereLight('#e4eeff', '#6a7a4a', .34);
    W.sun = new THREE.DirectionalLight('#fff0d8', .68); W.sun.castShadow = true;
    const mob = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
    W.sun.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048); Object.assign(W.sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 800 });
    W.sun.shadow.bias = -.0012; W.sun.shadow.radius = 2;
    s.add(W.amb, W.hemi, W.sun, W.sun.target);
    s.fog = new THREE.Fog('#9cc8e8', 380, 900); s.background = new THREE.Color('#9cc8e8');
    // the sky: a dome with a gradient, stars that show at night, and the moon
    const skyU = { uTop: { value: new THREE.Color('#5aa0e8') }, uBot: { value: new THREE.Color('#cfe6f8') }, uStar: { value: 0 }, uT: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uBot; uniform float uStar; uniform float uT; varying vec3 vD;\nfloat h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\n' +
        'void main() { float k = smoothstep(-0.05, 0.6, vD.y); vec3 c = mix(uBot, uTop, k); vec3 q = floor(vD * 300.0); float s = step(0.996, h(q)) * smoothstep(0.0, 0.3, vD.y) * (0.6 + 0.4 * sin(uT * 2.0 + h(q + 3.0) * 30.0)); gl_FragColor = vec4(c + vec3(s) * uStar, 1.0); }' }));
    sky.renderOrder = -10; sky.frustumCulled = false; s.add(sky); W.sky = sky; W.skyU = skyU;
    const moon = new THREE.Group(); s.add(moon); W.moon = moon;
    const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({ color: '#f8f0d0', fog: false, transparent: true }));
    const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#c8d8ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); moonHalo.scale.setScalar(260);
    moon.add(moonHalo, moonDisc); W.moonDisc = moonDisc; W.moonHalo = moonHalo; moon.visible = false;
    W.fx = FX.make(s);
    // an emote bubble ('!', '?', '...') over someone's head
    const bub = (ch) => KIT.canvasTex(32, 32, (g) => { g.fillStyle = '#3a2a22'; g.beginPath(); g.ellipse(16, 14, 14, 12, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(12, 24); g.lineTo(16, 31); g.lineTo(20, 24); g.fill(); g.fillStyle = '#fbf3e0'; g.beginPath(); g.ellipse(16, 14, 12, 10, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = ch === '!' ? '#e84838' : '#3a2a22'; g.font = 'bold 18px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 16, 15); });
    W.emoteTex = { '!': bub('!'), '?': bub('?'), '...': bub('…'), heart: bub('♥') };
    W.emote = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.emoteTex['!'], depthTest: false, transparent: true })); W.emote.scale.set(10, 10, 1); W.emote.visible = false; W.emote.renderOrder = 30; s.add(W.emote);
  }

  // ---------- day and night ----------
  W.setNight = (k) => {
    W.night = k; const L = G.lerp, c = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
    const inside = W.info && W.info.map.indoors;
    W.amb.intensity = inside ? .42 : L(.36, .3, k); W.amb.color = c('#ffffff', '#6a78c8');
    W.hemi.intensity = inside ? .26 : L(.34, .22, k); W.hemi.color = c('#e4eeff', '#5a6ab0'); W.hemi.groundColor = c('#7a8a5a', '#1a2040');
    W.sun.intensity = inside ? .42 : L(.68, .28, k); W.sun.color = c('#fff2dc', '#a8b8ff');
    const sky = c('#9cc8e8', '#1a1e44'); W.scene.background = sky; W.scene.fog.color = sky;
    W.skyU.uTop.value = c('#5aa0e8', '#0c0e2a'); W.skyU.uBot.value = c('#cfe6f8', '#3a3a7a'); W.skyU.uStar.value = k;
    if (inside) { W.scene.background = new THREE.Color('#1b1626'); W.scene.fog.color = W.scene.background; }
    W.sky.visible = !inside;
    for (const l of W.lamps || []) l.intensity = k * l.userData.base;
  };

  // ---------- people and creatures in the world ----------
  function person(key, height) {
    const L = LOOKS[key], m = makePerson({ look: L.look, ready: L.ready, detail: key.startsWith('player') ? 1 : .8 });
    m.root.scale.setScalar(MS * (height || L.height || 1)); m.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return m;
  }
  W.person = person;
  function creature(id) { const c = makeCreature(id, { seed: Math.random() * 9 }); c.root.scale.setScalar(MC * Math.sqrt(c.size || 1)); c.root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return c; }
  W.creature = creature;
  const P = W.player = { x: 4, y: 12, dir: 'down', px: 0, pz: 0, mv: null, model: null, yaw: 0, phase: 0, walk: 0, run: false, look: 'player-a' };
  const F = W.follower = { model: null, id: null, x: 0, y: 0, px: 0, pz: 0, mv: null, yaw: 0, walk: 0, trail: [], hidden: false };
  W.setPlayer = (look) => { if (P.model) W.scene.remove(P.model.root); P.look = look; P.model = person(look); W.scene.add(P.model.root, P.model.fx); };
  W.setFollower = (id) => {
    if (F.model) { W.scene.remove(F.model.root); F.model = null; }
    F.id = id; if (!id) return;
    F.model = creature(id); W.scene.add(F.model.root); F.x = P.x; F.y = P.y; F.px = P.px; F.pz = P.pz; F.trail = [];
  };

  // ---------- going somewhere ----------
  W.enter = (mapId, x, y, dir) => {
    if (W.info) W.scene.remove(W.info.group);
    for (const n of W.npcs) W.scene.remove(n.model.root);
    W.mapId = mapId; const info = W.info = PLACES.build(mapId); W.scene.add(info.group);
    if (!info.lampLights) { info.lampLights = []; for (const d of info.map.decor || []) if (d.k === 'lamp') { const L = new THREE.PointLight('#ffb050', 0, 110, 1.4); L.position.set(d.x * T + 13.5, 18, d.y * T + 9); L.userData.base = 1.6; info.group.add(L); info.lampLights.push(L); } }
    W.lamps = info.lampLights;
    if (mapId === 'willow-in' && !G.flags.starter) STORY.setTable();
    if (STORY.onEnter) STORY.onEnter(mapId, info);
    if (!info.npcs) {
      info.npcs = (STORY.NPCS[mapId] || []).map((d) => {
        const n = Object.assign({ dir: 'down' }, d); n.x0 = n.x; n.y0 = n.y; n.model = person(n.look, n.height); n.px = n.x * T + 8; n.pz = n.y * T + 9; n.yaw = YAW[n.dir]; n.walk = 0; n.phase = 0; n.mv = null; n.patT = 2 + Math.random() * 2; n.patI = 0;
        return n;
      });
    }
    W.npcs = info.npcs;
    for (const n of W.npcs) W.scene.add(n.model.root);
    P.x = x; P.y = y; P.dir = dir || P.dir; P.px = x * T + 8; P.pz = y * T + 9; P.mv = null; P.yaw = YAW[P.dir];
    F.x = x; F.y = y; F.px = P.px; F.pz = P.pz; F.mv = null; F.trail = []; F.yaw = P.yaw;
    W.quarter = 0; free.yaw = 0;
    W.applyLook();
    W.setNight(W.night); W.snap = true;
    if (CC.music) CC.music.play(info.map.music || 'village');
    W.cooldown = 2;
    G.flags.map = mapId;
  };
  const visible = (n) => !n.when || n.when();
  W.npcAt = (x, y) => W.npcs.find((n) => visible(n) && n.x === x && n.y === y && !n.ghost);
  W.npcByName = (name) => W.npcs.find((n) => n.name === name && visible(n));
  function blocked(x, y) { return W.info.solidAt(x, y) || !!W.npcAt(x, y); }
  function exitAt(x, y) {
    const m = W.info.map;
    for (const e of m.exits || []) {
      if (e.side === 'top' && y < 0 && x >= e.x0 && x <= e.x1) return e;
      if (e.side === 'bottom' && y >= m.h && x >= e.x0 && x <= e.x1) return e;
      if (e.side === 'right' && x >= m.w && y >= e.y0 && y <= e.y1) return e;
      if (e.side === 'left' && x < 0 && y >= e.y0 && y <= e.y1) return e;
    }
    return null;
  }
  const doorAt = (x, y) => { for (const id in W.info.doors) { const d = W.info.doors[id]; if (d.tile[0] === x && d.tile[1] === y) return d; } return null; };
  // runs a moment: the player can't move while it plays
  W.run = async (fn) => { W.busy++; try { await fn(); } finally { W.busy--; } };

  // ---------- moving ----------
  function startMove(a, dir, speed) {
    const d = DIRS[dir]; a.mv = { fx: a.px, fz: a.pz, tx: (a.x + d[0]) * T + 8, tz: (a.y + d[1]) * T + 9, k: 0, speed, nx: a.x + d[0], ny: a.y + d[1] };
  }
  function stepMove(a, dt) {
    if (!a.mv) return false;
    a.mv.k = Math.min(1, a.mv.k + a.mv.speed * dt);
    const was = [a.px, a.pz];
    a.px = G.lerp(a.mv.fx, a.mv.tx, a.mv.k); a.pz = G.lerp(a.mv.fz, a.mv.tz, a.mv.k);
    a.dist = Math.hypot(a.px - was[0], a.pz - was[1]);
    if (a.mv.k >= 1) { a.x = a.mv.nx; a.y = a.mv.ny; const done = a.mv.done; a.mv = null; if (done) done(); return true; }
    return false;
  }
  // a person walks a list of steps ('up', 'left', ...), as CC.npcWalk
  W.npcWalk = async (n, steps, speed) => {
    for (const s of steps) { n.dir = s; await new Promise((ok) => { startMove(n, s, speed || 3.6); n.mv.done = ok; }); }
  };
  W.walkPlayer = async (steps, speed) => {
    for (const s of steps) { P.dir = s; await new Promise((ok) => { follow(); startMove(P, s, speed || 4); P.mv.done = ok; }); }
  };
  function follow() { // the follower takes the player's last spot
    if (!F.model) return;
    F.trail.push([P.x, P.y]);
    if (F.trail.length > 1) { const [tx, ty] = F.trail.shift(); if (tx !== F.x || ty !== F.y) { const dx = tx - F.x, dy = ty - F.y; const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; if (Math.abs(dx) + Math.abs(dy) === 1) { F.dir = dir; startMove(F, dir, P.mv ? P.mv.speed : 4); } else { F.x = tx; F.y = ty; F.px = tx * T + 8; F.pz = ty * T + 9; } } }
  }
  let bumpT = 0;
  function heldDir() {
    for (const d of ['up', 'down', 'left', 'right']) if (G.input.held[d]) return d;
    return null;
  }
  async function arrive() {
    const map = W.info.map, t = W.info.tileAt(P.x, P.y);
    if (map.indoors && t === 'm') { const e = map.exits[0]; await W.run(() => useExit(e)); return; }
    if (STORY.onStep && (await STORY.onStep(P.x, P.y))) return;
    if (W.cooldown > 0) W.cooldown--;
    if (t === ',' && map.spawns && W.cooldown <= 0 && G.state.party.length && Math.random() < .12) await W.run(() => STORY.wildEncounter(map.spawns));
  }
  async function useExit(e) {
    if (STORY.beforeExit && (await STORY.beforeExit(e))) return;
    if (!e.to || !PLACES.MAPS[e.to]) return;
    await G.fade(.3, 1);
    const side = e.side === 'right' || e.side === 'left', tx = side ? e.tx : e.fixedX ? e.tx0 : e.tx0 + (P.x - e.x0), ty = side ? e.ty0 + (P.y - e.y0) : e.ty;
    W.enter(e.to, tx, ty, { top: 'up', bottom: 'down', right: 'right', left: 'left' }[e.side]);
    UI.toast(PLACES.MAPS[e.to].name);
    await G.fade(.3, 0);
  }
  async function enterDoor(d) {
    if (!d.room) { if (STORY.lockedDoor) await STORY.lockedDoor(d); return; }
    CC.sfx('select');
    await G.tween(.25, (k) => { d.open = k; });
    const m = PLACES.MAPS[d.room];
    await G.fade(.25, 1); d.open = 0;
    W.enter(d.room, m.inside[0], m.inside[1], 'up');
    UI.toast(m.name);
    await G.fade(.25, 0);
  }
  W.useExit = useExit;
  function updatePlayer(dt) {
    const free_ = !W.busy && G.top() === W.screen;
    // L and R swing the camera round while held, to peek; let go and it springs back. Walking never turns with it.
    const swing = free_ && !W.info.map.indoors && !W.dio() ? (G.input.held.l ? 1 : 0) - (G.input.held.r ? 1 : 0) : 0;
    free.yaw = swing * .8;
    if (free_) {
      if (G.input.pressed.start) { CC.sfx('select'); W.run(() => STORY.fieldMenu()); return; }
      if (G.input.pressed.a && !P.mv) { interact(); return; }
      P.run = G.input.held.b;
      const d = heldDir();
      if (d && !P.mv) {
        P.dir = d; const [dx, dy] = DIRS[d], nx = P.x + dx, ny = P.y + dy;
        const ex = exitAt(nx, ny), door = doorAt(nx, ny);
        if (ex) { W.run(async () => { if (STORY.beforeExit && (await STORY.beforeExit(ex))) return; follow(); startMove(P, d, 4); await new Promise((ok) => { P.mv.done = ok; }); await useExit(ex); }); }
        else if (door && !door.room && !W.info.map.indoors) { W.run(() => STORY.lockedDoor(door)); }
        else if (door && !W.info.map.indoors) { W.run(async () => { follow(); startMove(P, d, 3); await G.sleep(.02); await enterDoor(door); }); }
        else if (STORY.blockStep && STORY.blockStep(nx, ny)) { /* a script stops you */ }
        else if (!blocked(nx, ny)) { follow(); startMove(P, d, P.run ? 7.5 : 4.2); P.mv.done = () => { arrive(); }; }
        else if ((bumpT -= dt) <= 0) { CC.sfx('bump'); bumpT = .35; }
      }
    }
  }
  async function interact() {
    const [dx, dy] = DIRS[P.dir], tx = P.x + dx, ty = P.y + dy;
    let n = W.npcAt(tx, ty);
    const dec = (W.info.map.decor || []).find((d) => d.x === tx && d.y === ty);
    if (!n && dec && dec.counter) n = W.npcAt(tx + dx, ty + dy);
    if (n && n.talk) { await W.run(async () => { const was = n.dir; n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[P.dir]; await n.talk(n); if (!n.keepDir) n.dir = n.mv ? n.dir : was; }); return; }
    const sign = W.info.map.signs && W.info.map.signs[tx + ',' + ty];
    if (sign) { await W.run(() => UI.say(sign)); return; }
    if (dec && dec.talk) { await W.run(() => (STORY.furniture ? STORY.furniture(dec) : UI.say(dec.talk))); return; }
    if (F.model && F.x === tx && F.y === ty && STORY.talkFollower) await W.run(() => STORY.talkFollower());
  }

  // the look of the town: the 3D world (a camera you can swing to peek) or the diorama (a fixed camera over painted ground)
  W.dio = () => !!(W.info && W.info.diorama);
  W.applyLook = () => {
    if (!W.info) return;
    PLACES.setLook(W.info, G.look.town);
    if (W.info.map.indoors) Object.assign(free, { elev: .82, hv: 128, fov: 35 });
    else if (W.dio()) Object.assign(free, { elev: .9, hv: 172, fov: 27 });
    else Object.assign(free, { elev: .64, hv: 132, fov: 35 });
    W.snap = true;
  };
  // ---------- the camera: follows you from above; L and R turn it; scripts can steer it ----------
  const cam = { tx: 0, ty: 12, tz: 0, yaw: 0, elev: .64, fov: 35, hv: 132 };
  const free = { yaw: 0, elev: .64, hv: 132, fov: 35 };
  W.cam = cam; W.free = free;
  function aim(dt) {
    if (W.ctl) { W.ctl(cam, dt); return; }
    let fx = P.px, fz = P.pz - 2;
    if (W.focus) { fx = W.focus.x; fz = W.focus.z; }
    const map = W.info.map;
    if (map.indoors) { fx = G.clamp(fx, map.w * T / 2 - 8, map.w * T / 2 + 8); fz = G.clamp(fz, 50, map.h * T - 40); }
    else if (W.dio() && !W.focus) { const hw = free.hv * 1.5 / 2 - T * .5; fx = map.w * T > hw * 2 ? G.clamp(fx, hw, map.w * T - hw) : map.w * T / 2; fz = G.clamp(fz, free.hv * .38, Math.max(free.hv * .38, map.h * T - free.hv * .5)); }
    const k = W.snap ? 1 : 1 - Math.exp(-dt * 6); W.snap = false;
    cam.tx = G.lerp(cam.tx, fx, k); cam.tz = G.lerp(cam.tz, fz, k); cam.ty = G.lerp(cam.ty, 12, k);
    cam.yaw += G.wrapA(free.yaw - cam.yaw) * Math.min(1, k * 1.4); cam.elev = G.lerp(cam.elev, free.elev, k); cam.hv = G.lerp(cam.hv, free.hv, k); cam.fov = G.lerp(cam.fov, free.fov || 35, k);
  }
  W.place = (c, C) => {
    C = C || W.camera;
    const fov = c.fov * Math.PI / 180, dist = c.hv / 2 / Math.tan(fov / 2), sy = Math.sin(c.yaw), cy = Math.cos(c.yaw), ce = Math.cos(c.elev), se = Math.sin(c.elev);
    C.fov = c.fov; C.position.set(c.tx + dist * sy * ce, c.ty + dist * se, c.tz + dist * cy * ce);
    C.up.set(0, 1, 0); C.near = Math.max(1, dist * .05); C.far = dist + 3000; C.updateProjectionMatrix(); C.lookAt(c.tx, c.ty, c.tz);
    return dist;
  };

  // ---------- each frame ----------
  const _v = new THREE.Vector3();
  function animActor(a, model, dt, t, isCreature) {
    const moving = !!a.mv;
    a.walk = G.lerp(a.walk || 0, moving ? 1 : 0, Math.min(1, dt * 10));
    const want = YAW[a.dir] !== undefined ? YAW[a.dir] : a.yaw;
    a.yaw += G.wrapA(want - a.yaw) * Math.min(1, dt * 14);
    model.root.position.set(a.px, 0, a.pz); model.root.rotation.y = a.yaw;
    if (isCreature) model.update(t, dt, a.walk);
    else { a.phase = (a.phase || 0) + (a.dist || 0) / MS * model.PHASE_PER_M; a.dist = 0; model.animate(a.phase, a.walk * (a.mv && a.mv.speed > 6 ? 1 : 1), t, dt); }
  }
  W.update = (dt) => {
    if (!W.info) return;
    const t = G.t;
    updatePlayer(dt);
    stepMove(P, dt); stepMove(F, dt);
    for (const n of W.npcs) {
      const vis = visible(n); n.model.root.visible = vis; if (!vis) continue;
      stepMove(n, dt);
      if (n.patrol && !W.busy && !n.mv) { // walking a loop, a step every so often
        n.patT -= dt;
        if (n.patT <= 0) { n.patT = 1.2 + Math.random() * 1.5; const [tx, ty] = n.patrol[n.patI = (n.patI + 1) % n.patrol.length]; const dx = Math.sign(tx - n.x), dy = Math.sign(ty - n.y); const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : null; if (dir && !blocked(n.x + DIRS[dir][0], n.y + DIRS[dir][1]) && !(P.x === n.x + DIRS[dir][0] && P.y === n.y + DIRS[dir][1])) { n.dir = dir; startMove(n, dir, 3); n.mv.done = () => {}; } else n.patI = (n.patI + n.patrol.length - 1) % n.patrol.length; }
      }
      if (!n.mv && !W.busy && Math.random() < dt * .08 && !n.model.busy) n.model.play(G.pick(['look', 'nod']));
      animActor(n, n.model, dt, t, false);
    }
    if (P.model) animActor(P, P.model, dt, t, false);
    if (F.model) { F.model.root.visible = !F.hidden; animActor(F, F.model, dt, t, true); }
    if (P.model) P.model.root.visible = !P.hidden;
    PLACES.update(W.info, t, dt);
    PLACES.GRASSU.uP.value.set(P.px, P.pz); PLACES.GRASSU.uQ.value.set(F.px, F.pz);
    if (PLACES.GRASSU.uR.value.z >= 0) PLACES.GRASSU.uR.value.z += dt;
    // chimney smoke
    for (const s of W.info.smoke) if (Math.random() < dt * 4) W.fx.emit({ x: s[0] + G.rand(-1, 1), y: s[1], z: s[2], vx: G.rand(-1, 3), vy: G.rand(6, 10), vz: G.rand(-1, 1), life: 2.4, size: 5, grow: 4, shape: 'glow', color: '#e8e4ec', a: .55, drag: .3 });
    if (W.emote.visible && W.emote.userData.who) { W.emote.userData.who.anchor('head', _v); W.emote.position.copy(_v).add(new THREE.Vector3(0, 8 + Math.max(0, .15 - W.emote.userData.t) * 30, 0)); W.emote.userData.t += dt; }
    W.skyU.uT.value = t;
    aim(dt);
  };
  W.showEmote = (model, kind) => { W.emote.material.map = W.emoteTex[kind || '!']; W.emote.userData = { who: model, t: 0 }; W.emote.visible = !!model; };
  W.hideEmote = () => { W.emote.visible = false; };
  W.render = (dt) => {
    const dist = W.place(cam);
    const tgt = _v.set(cam.tx, 0, cam.tz);
    W.sun.position.set(tgt.x - 110, 220, tgt.z + 140); W.sun.target.position.copy(tgt);
    W.moon.position.set(cam.tx - 200, 520, cam.tz - 900); W.moon.lookAt(W.camera.position);
    // see-through: whatever stands between the camera and you is cut away round you
    if (P.model && !W.info.map.indoors) {
      P.model.anchor('chest', _v); _v.project(W.camera);
      const fw = G.frame.w * G.frame.pr, fh = G.frame.h * G.frame.pr;
      KIT.SEE.uSee.value.set((_v.x * .5 + .5) * fw, (_v.y * .5 + .5) * fh, fh * .11); KIT.SEE.uSeeZ.value = _v.z * .5 + .5 - .0004;
    } else KIT.SEE.uSee.value.set(0, 0, 0);
    W.fx.update(dt, G.frame.h * G.frame.pr * .9);
    R.render(W.scene, W.camera);
  };
  // the speaker's close-up beside the dialog: whoever is talking, filmed from in front of their face
  const faceCam = new THREE.PerspectiveCamera(30, 1, .5, 2000);
  W.faceShot = (who) => {
    const m = who === 'You' ? P.model : (W.npcByName(who) || {}).model;
    if (!m) return null;
    m.anchor('head', _v); const head = _v.clone().add(new THREE.Vector3(0, -3, 0));
    const yaw = m.root.rotation.y, d = 30;
    faceCam.position.set(head.x + Math.sin(yaw + .35) * d, head.y + 6, head.z + Math.cos(yaw + .35) * d); faceCam.lookAt(head); faceCam.near = d - 12; faceCam.updateProjectionMatrix();
    return { scene: W.scene, camera: faceCam };
  };
  W.screen = { name: 'world', draw() { if (STORY.hud) STORY.hud(); } };
  return Object.assign(W, { setup, T, MS, MC, DIRS, YAW, follow, startMove });
})();
