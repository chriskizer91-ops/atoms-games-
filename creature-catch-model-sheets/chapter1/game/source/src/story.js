// story.js: the opening of Creature Catch, in 3D. The people of Home Village and the Meadow Path with their own lines from
// the game (CC.NPCS, CC.SIGNS, willowHouse, healingHut...), Elder Willow's three starters on his table, Juniper bursting in,
// the legend of Lunarion told under the stars, the tall grass, the field menu, and the end of the demo at the Grassland.
const STORY = (() => {
  'use strict';
  const F = () => G.flags, say = UI.say, talk = UI.talk;
  const T = 16;
  // ---------- the game state ----------
  G.newState = (look) => { G.state = { look, party: [], vault: [], bag: { cube: 0, potion: 0 }, coins: 300, lastHeal: { map: 'home-in', x: 4, y: 4 }, caught: {}, seen: {} }; G.flags = {}; };
  const addCreature = (m) => { G.state.caught[m.id] = 1; if (G.state.party.length < 4) { G.state.party.push(m); return 'party'; } G.state.vault.push(m); return 'vault'; };
  const healParty = () => G.state.party.forEach(MON.heal);
  async function restAndHeal() { await G.fade(.3, 1); healParty(); CC.sfx('heal'); await G.sleep(.9); await G.fade(.3, 0); await say('Your creatures are healed and full of energy!'); }

  // ---------- the people ----------
  // the Cube Vault: swap a creature resting there with one in your party
  async function cubeVault(who) {
    const V = G.state.vault, o = who ? { who } : undefined;
    if (!V.length) { await say('The Vault is empty. Catch more than four creatures and the extras rest here.', o); return; }
    while (V.length) {
      const i = await UI.menu(V.map((m) => ({ label: MON.name(m), right: 'Lv' + m.lv })).concat([{ label: 'Done' }]), { title: 'Cube Vault: ' + V.length + ' resting', y: 8 });
      if (i < 0 || i === V.length) return;
      const j = await pickCreature('Swap ' + MON.name(V[i]) + ' for which?');
      if (j < 0) continue;
      const out = G.state.party[j]; G.state.party[j] = V[i]; V[i] = out; CC.sfx('select');
      if (j === 0 && WORLD.follower && WORLD.follower.id) { const F_ = WORLD.follower, keep = { x: F_.x, y: F_.y, px: F_.px, pz: F_.pz, dir: F_.dir }; WORLD.setFollower(G.state.party[0].id); Object.assign(WORLD.follower, keep); }
      await say(MON.name(G.state.party[j]) + ' joined your party, and ' + MON.name(out) + ' went to rest in the Vault.');
    }
  }
  async function healingHut(who, spot) {
    G.state.lastHeal = spot;
    await say(who === 'Hazel' ? 'Welcome to the Healing Hut! I\'m Hazel.' : 'Welcome!', { who });
    while (true) {
      const c = await UI.ask('How can I help?', ['Heal my creatures', 'Cube Vault', 'Bye'], who);
      if (c === 0) { if (!G.state.party.length) { await say('You don\'t have any creatures yet!', { who }); continue; } await say('Let me take care of them.', { who }); const n = WORLD.npcByName(who); if (n) n.model.play('nod'); await restAndHeal(); }
      else if (c === 1) { if (!G.state.party.length) { await say('The Vault holds the creatures you catch once your party of 4 is full.', { who }); continue; } await cubeVault(who); }
      else { await say('Take care out there!', { who }); return; }
    }
  }
  async function shop() {
    await say('Welcome to Pip\'s Cube Shop! Cubes, potions, all fresh.', { who: 'Pip' });
    while (true) {
      const c = await UI.menu([{ label: 'Basic Cube', right: '50' }, { label: 'Potion', right: '60' }, 'Done'], { title: 'Coins: ' + G.state.coins, y: 40 });
      if (c < 0 || c === 2) break;
      const price = c === 0 ? 50 : 60, item = c === 0 ? 'cube' : 'potion';
      if (G.state.coins < price) { await say('You don\'t have enough coins.', { who: 'Pip' }); continue; }
      G.state.coins -= price; G.state.bag[item]++; CC.sfx('buy');
      await say('Here you go! One ' + (c === 0 ? 'Basic Cube' : 'Potion') + '.', { who: 'Pip' });
    }
    await say('Come again!', { who: 'Pip' });
  }
  const NPCS = {
    village: [
      { name: 'Tinker', look: 'tinker', x: 12, y: 1, dir: 'down', talk: async () => {
        if (!F().starter) await say('Elder Willow is looking for you! His house is the big one with the mossy roof.', { who: 'Tinker' });
        else await talk('Tinker', ['Creatures hide in tall grass. Walk through it and one might jump out!', 'Knock it down a bit, then throw a cube. Sleeping or frozen ones are easiest to catch!']);
      } },
      { name: 'Juniper', look: 'juniper', x: 9, y: 2, dir: 'down', patrol: [[9, 2], [12, 2], [12, 3], [9, 3]], when: () => F().starter && !F().juniperLeft, talk: async () => {
        await talk('Juniper', F().juniper1 === 'won' ? ['Don\'t get cocky. That was a warm-up!', 'I\'m off to beat Farmer Bramble\'s trial before you. See ya!'] : ['Still thinking about our battle? Ha!', 'Type advantage matters, but so does training. Catch more creatures!']);
      } },
      { name: 'Rosa', look: 'rosa', x: 9, y: 13, dir: 'down', when: () => false, talk: async () => { await talk('Rosa', ['Lovely day for the Meadow Path.', 'The creatures out there are plain Normal types. They don\'t care whether you picked water, fire or plant, so it\'s fair training for everyone.']); } },
    ],
    'willow-in': [
      { name: 'Elder Willow', look: 'willow', x: 5, y: 3, dir: 'down', talk: () => willowHouse() },
      { name: 'Juniper', look: 'juniper', x: 5, y: 7, dir: 'up', ghost: false, when: () => F().juniperIn, talk: () => {} },
    ],
    'hut-in': [{ name: 'Hazel', look: 'hazel', x: 5, y: 2, dir: 'down', talk: () => healingHut('Hazel', { map: 'hut-in', x: 5, y: 4 }) }],
    'shop-in': [{ name: 'Pip', look: 'pip', x: 4, y: 2, dir: 'down', talk: () => shop() }],
    'inn-in': [{ name: 'Rosa', look: 'rosa', x: 5, y: 2, dir: 'down', talk: () => innkeeper() }],
    'outpost-in': [{ name: 'Fern', look: 'fern', x: 4, y: 2, dir: 'down', talk: () => healingHut('Fern', { map: 'outpost-in', x: 4, y: 4 }) }],
    grassland: [
      { name: 'Farmer Bramble', id: 'bramble', look: 'bramble', x: 12, y: 1, dir: 'down', talk: () => brambleTrial() },
      { name: 'Farm Kid', look: 'farmkid', x: 6, y: 11, dir: 'right', talk: async () => {
        await talk('Farm Kid', ['Dandylion lives here, but it\'s super rare. I\'ve only seen its fluffy mane once!', 'Tuftail loves the tall grass by the trees.']);
      } },
    ],
    meadow: [{ name: 'Ranger Oakley', look: 'oakley', x: 3, y: 8, dir: 'right', talk: async () => {
      await talk('Ranger Oakley', ['I\'m Ranger Oakley. I keep the Forest, but I like to scout the meadow.', 'Every region has an outpost with a Healing Hut. The Grassland one is just north of here.', 'You can swap creatures with the Cube Vault at any Healing Hut.']);
    } }],
  };
  // Tinker won't let you leave without a creature
  function blockStep(nx, ny) {
    if (WORLD.mapId === 'village' && ny <= 0 && !F().starter) {
      WORLD.run(async () => { const t = WORLD.npcByName('Tinker'); if (t) { t.dir = 'left'; WORLD.showEmote(t.model, '!'); CC.sfx('encounter'); } await say('Wait! It\'s not safe out there without a creature! Go see Elder Willow first.', { who: 'Tinker' }); WORLD.hideEmote(); if (t) t.dir = 'down'; });
      return true;
    }
    return false;
  }
  async function furniture(d) {
    if (d.talk === 'bed') { if (await UI.yesNo('Take a quick nap?')) { G.state.lastHeal = { map: 'home-in', x: 2, y: 4 }; await restAndHeal(); } return; }
    await say(d.talk);
  }
  async function talkFollower() {
    const m = G.state.party[0]; if (!m) return;
    WORLD.follower.model.play('happy'); CC.sfx('blip');
    await say(MON.name(m) + G.pick([' looks up at you happily.', ' is sniffing the air.', ' wants to keep exploring!', ' nuzzles your hand.']));
  }

  // ---------- picking the starter at Elder Willow's table ----------
  const tableCubes = [];
  function setTable() { // three cubes on the table, as the game's art shows them, the first time you're in the room
    const info = PLACES.build('willow-in'); if (info.cubesSet) return; info.cubesSet = true;
    const t = info.starterTable;
    DATA.STARTERS.forEach((id, i) => { const c = makeCube(); c.root.scale.setScalar(20); c.root.position.set(t.x + (i - 1) * 10, t.y + 3, t.z); c.root.rotation.y = (i - 1) * .2; info.group.add(c.root); tableCubes.push({ id, cube: c }); });
  }
  function starterSelect() {
    return new Promise((resolve) => {
      const t = PLACES.build('willow-in').starterTable, W = WORLD;
      const mons = DATA.STARTERS.map((id, i) => { const c = W.creature(id), D = CREATURE_DEFS[id]; c.root.scale.setScalar(15 * .52 / Math.max(D.height, (D.width || .5) * .85)); c.root.position.set(t.x + (i - 1) * 11, t.y + 1, t.z + 2); c.root.rotation.y = 0; c.root.visible = false; W.scene.add(c.root); return c; });
      let sel = 0, busy = true, k0 = 0;
      const was = W.ctl; const c0 = Object.assign({}, W.cam);
      W.ctl = (cam, dt) => { k0 = Math.min(1, k0 + dt * 1.5); const e = G.ease(k0); cam.tx = G.lerp(c0.tx, t.x + (sel - 1) * 4, e * .9 + .1 * Math.min(1, dt * 4)); cam.ty = G.lerp(c0.ty, t.y + 6, e); cam.tz = G.lerp(c0.tz, t.z, e); cam.elev = G.lerp(c0.elev, .32, e); cam.hv = G.lerp(c0.hv, 46, e); cam.yaw = 0; };
      W.player.hidden = true; if (W.follower.model) W.follower.hidden = true;
      (async () => {
        await G.sleep(.5);
        for (let i = 0; i < 3; i++) { const c = tableCubes[i].cube; CC.sfx('select'); await G.tween(.15, (k) => { c.open = k; }); mons[i].root.visible = true; mons[i].play('appear'); W.fx.burst('sparkle', mons[i].root.position.clone().add(new THREE.Vector3(0, 6, 0)), 10, { speed: 30, colors: ['#ffffff', '#fff0b0'], add: true, size: 5, g: 0 }); await G.tween(.15, (k) => { c.open = 1 - k; c.root.scale.setScalar(20 * (1 - k * .999)); }); }
        busy = false;
      })();
      const upd = () => { mons.forEach((m, i) => { m.update(G.t, G.dt, 0); m.root.rotation.y = G.lerp(m.root.rotation.y, i === sel ? 0 : (i - 1) * -.4, Math.min(1, G.dt * 6)); }); };
      const scr = {
        name: 'starter',
        update() {
          upd(); if (busy) return;
          if (G.input.pressed.left) { sel = (sel + 2) % 3; CC.sfx('blip'); mons[sel].play('hop'); }
          if (G.input.pressed.right) { sel = (sel + 1) % 3; CC.sfx('blip'); mons[sel].play('hop'); }
          if (G.input.pressed.a) {
            CC.sfx('select'); busy = true; const id = DATA.STARTERS[sel];
            mons[sel].play('happy');
            UI.yesNo('Choose ' + DATA.CREATURES[id].name + ', ' + DATA.STARTER_BLURB[id] + '? (' + DATA.CREATURES[id].types[0] + ' type)', null, { y: 40 }).then((yes) => {
              busy = false;
              if (yes) { G.pop(scr); resolve({ id, mons, sel, done: () => { W.ctl = was; W.player.hidden = false; W.follower.hidden = false; } }); }
            });
          }
        },
        draw() {
          if (busy && G.top() === scr) { if (!mons.some((m) => m.root.visible)) return; }
          { const tw = Math.max(UI.textWidth('Choose your first creature', 10), UI.textWidth('Left / right to look, A to choose', 8)) + 18; UI.box(120 - tw / 2, 3, tw, 28); UI.text('Choose your first creature', 120, 6, '#6a3a2a', { align: 'center' }); UI.text('Left / right to look, A to choose', 120, 19, '#6a5a50', { align: 'center', size: 8 }); }
          if (G.top() !== scr) return;
          const id = DATA.STARTERS[sel], c = DATA.CREATURES[id], tc = DATA.TYPE_COLORS[c.types[0]];
          UI.box(0, 120, 240, 40);
          UI.text(c.name, 9, 125, '#1c1624', { size: 12 });
          const w = UI.textWidth(c.types[0].toUpperCase(), 9) + 10, bx = 14 + UI.textWidth(c.name, 12); UI.rect(bx, 127, w, 12, tc[1]); UI.rect(bx, 127, w, 2, tc[0]); UI.text(c.types[0].toUpperCase(), bx + w / 2, 128, '#ffffff', { size: 9, align: 'center', shadow: tc[2] });
          UI.text(DATA.STARTER_BLURB[id].replace(/^the /, 'The ') + '. ' + DATA.CREATURES[id].types[0] + ' beats ' + { Water: 'Fire', Fire: 'Plant', Plant: 'Water' }[DATA.CREATURES[id].types[0]] + '.', 9, 143, '#4a3a40', { size: 10 });
        },
      };
      G.push(scr);
    });
  }

  // ---------- the legend, told under the stars ----------
  const LEGEND = (() => {
    let built = null;
    function build() {
      if (built) return built;
      const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1.5, 1, 6000);
      scene.background = new THREE.Color('#0c0e26');
      const skyU = { uStar: { value: 1 }, uT: { value: 0 }, uDim: { value: 0 } };
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
        vertexShader: 'varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uStar; uniform float uT; uniform float uDim; varying vec3 vD; float h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\nvoid main() { vec3 c = mix(vec3(0.22, 0.2, 0.42), vec3(0.03, 0.04, 0.14), smoothstep(-0.05, 0.6, vD.y)); vec3 q = floor(vD * 400.0); float s = step(0.995, h(q)) * (0.5 + 0.5 * sin(uT * 2.0 + h(q + 3.0) * 40.0)); c += vec3(s) * uStar * (1.0 - uDim * 0.6); c *= 1.0 - uDim * 0.35; gl_FragColor = vec4(c, 1.0); }' })));
      scene.add(new THREE.AmbientLight('#8a90d8', .5)); const key = new THREE.DirectionalLight('#c8d8ff', .5); key.position.set(-200, 300, -400); scene.add(key);
      // hills and the far ruins, black against the sky
      const B = KIT.builder(), dark = KIT.toon('#ffffff', { vc: true });
      for (let i = 0; i < 9; i++) B.add(new THREE.ConeGeometry(260 + i * 20, 200 + (i % 3) * 90, 7), dark, [(i - 4) * 300, 60, -1500 - (i % 2) * 200], [0, i, 0], null, { tint: '#1e1a40' });
      B.add(new THREE.CylinderGeometry(1600, 1600, 20, 32), dark, [0, -10, -400], null, null, { tint: '#18243a' });
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; B.box(dark, Math.cos(a) * 40 - 5, 0, -700 + Math.sin(a) * 40 - 5, Math.cos(a) * 40 + 5, 60 + (i % 2) * 20, -700 + Math.sin(a) * 40 + 5, { tint: '#2a2850' }); }
      B.add(new THREE.CylinderGeometry(30, 34, 14, 12), dark, [0, 7, -700], null, null, { tint: '#3a3868' });
      B.build(scene, KIT.inkMat({ k: 40 }));
      // the moon
      const moon = new THREE.Group(); moon.position.set(640, 640, -1500); scene.add(moon);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(70, 40), new THREE.MeshBasicMaterial({ color: '#f8f0d0', transparent: true }));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#c8d8ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); halo.scale.setScalar(420); moon.add(halo, disc);
      // Lunarion in the stars: a winged wolf, drawn line by line
      const pts = [[9, 6], [7, 8.5], [6, 11], [4.6, 8.6], [3, 6.5], [-1, 6.6], [-4.5, 6.2], [-7.5, 8.6], [-4.2, 3], [-5, 0], [0, 3.2], [3.6, 2.6], [4.4, 0], [5.4, 4.4], [-1, 7], [-3, 12], [-1.4, 15.5], [1, 13], [2.6, 16], [3.4, 11.6], [7.6, 6.8]];
      const lines = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [6, 8], [8, 9], [8, 10], [10, 11], [11, 12], [11, 13], [13, 4], [13, 0], [0, 20], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 4]];
      const S = 26, O = new THREE.Vector3(-60, 300, -900), P3 = pts.map(([x, y]) => new THREE.Vector3(O.x + x * S, O.y + y * S, O.z + Math.sin(x) * 20));
      const starMat = new THREE.SpriteMaterial({ map: KIT.glowTex, color: '#e8f0ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
      const stars = P3.map((p) => { const s = new THREE.Sprite(starMat.clone()); s.position.copy(p); s.scale.setScalar(36); scene.add(s); return s; });
      const lg = new THREE.BufferGeometry(), LP = new Float32Array(lines.length * 6); lines.forEach(([a, b], i) => { LP.set([P3[a].x, P3[a].y, P3[a].z, P3[b].x, P3[b].y, P3[b].z], i * 6); });
      lg.setAttribute('position', new THREE.BufferAttribute(LP, 3)); lg.setDrawRange(0, 0);
      const lineMat = new THREE.LineBasicMaterial({ color: '#a8c8ff', transparent: true, opacity: .8, blending: THREE.AdditiveBlending });
      scene.add(new THREE.LineSegments(lg, lineMat));
      const fx = FX.make(scene, 200);
      built = { scene, cam, skyU, moon, disc, halo, stars, lg, nLines: lines.length, lineMat, fx, P3, k: { draw: 0, star: 0, glow: 0, dim: 0, fly: 0 } };
      return built;
    }
    function render(dt) {
      const L = built, k = L.k; L.skyU.uT.value = G.t; L.skyU.uDim.value = k.dim;
      L.lg.setDrawRange(0, Math.floor(k.draw * L.nLines) * 2); L.lineMat.opacity = .8 * (1 - k.dim * .7) + .2 * k.glow;
      L.stars.forEach((s, i) => { s.material.opacity = k.star * (.75 + .25 * Math.sin(G.t * 3 + i)) * (1 - k.dim * .6) + k.glow * .5; s.scale.setScalar(30 + k.glow * 20); });
      L.disc.material.color.setHSL(.13, .6 - k.dim * .45, .9 - k.dim * .5); L.halo.material.opacity = .9 - k.dim * .75; L.halo.scale.setScalar(420 - k.dim * 200);
      if (k.fly > 0 && k.fly < 1 && Math.random() < .7) { const p = L.P3[Math.floor(Math.random() * L.P3.length)]; L.fx.emit({ x: p.x, y: p.y, z: p.z, vx: (L.moon.position.x - p.x) * .6, vy: (L.moon.position.y - p.y) * .6, vz: (L.moon.position.z - p.z) * .6, life: 1.4, size: 30, shape: 'sparkle', color: '#e8f0ff', add: true }); }
      L.fx.update(dt, G.frame.h * G.frame.pr * .9);
      const c = L.cam; c.position.set(0 + Math.sin(G.t * .05) * 30, 60 + k.rise * 40, 300); c.lookAt(40, 330 + k.rise * 40, -900);
      G.R.render(L.scene, c);
    }
    async function tell(lines, who) {
      const L = build(); Object.assign(L.k, { draw: 0, star: 0, glow: 0, dim: 0, fly: 0, rise: 0 });
      await G.fade(.5, 1);
      const was = G.render; G.render = render;
      await G.fade(.8, 0);
      const anim = (key, to, sec) => G.tween(sec, (k) => { L.k[key] = G.lerp(L.k[key], to, k); });
      anim('star', 1, 1.5); anim('draw', 1, 4); anim('rise', 1, 14);
      await say(lines[0], { who });
      anim('glow', 1, 1); CC.sfx('moon'); L.k.fly = .5;
      await say(lines[1], { who });
      L.k.fly = 0; anim('glow', 0, 1); anim('dim', 1, 3);
      await say(lines[2], { who });
      await say(lines[3], { who });
      await G.fade(.6, 1); G.render = was; await G.fade(.5, 0);
    }
    return { tell };
  })();

  // ---------- Elder Willow's house ----------
  async function willowHouse() {
    const W = WORLD, willow = W.npcByName('Elder Willow');
    if (F().starter) {
      const caught = Object.keys(G.state.caught).length;
      await talk('Elder Willow', ['How is your Creature Log coming along? ' + caught + ' caught so far!', 'Farmer Bramble guards the trail at the top of the Grassland. Beat his trial and he\'ll open the way to the Forest.']);
      return;
    }
    await talk('Elder Willow', ['Ah, there you are! Today is the day you get your very first creature.', 'Three cubes, three friends. Their types go round in a circle: Water beats Fire, Fire beats Plant, and Plant beats Water.', 'Take your time. Pick the one that feels right.']);
    const pick = await starterSelect();
    F().starter = pick.id;
    const m = MON.make(pick.id, 5); addCreature(m);
    CC.sfx('catch');
    const chosen = pick.mons[pick.sel]; chosen.play('happy');
    // the other two go back into their cubes
    pick.mons.forEach((c, i) => { if (i !== pick.sel) { c.play('vanish'); const cb = tableCubes[i].cube; G.tween(.3, (k) => { cb.root.scale.setScalar(20 * k + .01); }); } });
    await say('You received ' + DATA.CREATURES[pick.id].name + '!');
    await say('A fine choice. Look after each other.', { who: 'Elder Willow' });
    pick.mons.forEach((c, i) => { if (i !== pick.sel) W.scene.remove(c.root); });
    W.scene.remove(chosen.root); pick.done();
    tableCubes.splice(pick.sel, 1)[0].cube.root.visible = false;
    W.setFollower(pick.id); { const fx = W.info.solidAt(W.player.x - 1, W.player.y) ? W.player.x + 1 : W.player.x - 1; Object.assign(W.follower, { x: fx, y: W.player.y, px: fx * T + 8, pz: W.player.y * T + 9, dir: 'up' }); } W.follower.model.play('appear');
    // Juniper bursts in through the door and marches up beside you
    const rival = DATA.RIVAL_PICK[pick.id];
    const jun = W.npcs.find((n) => n.name === 'Juniper'); Object.assign(jun, { x: 5, y: 7, px: 5 * T + 8, pz: 7 * T + 9, dir: 'up' }); F().juniperIn = true;
    CC.sfx('bump'); W.cam.ty += 3;
    await say('BANG! The door flies open.');
    W.showEmote(W.player.model, '!'); W.player.dir = 'down'; await G.sleep(.5); W.hideEmote();
    if (W.player.x === 5) await W.npcWalk(jun, ['up', 'right', 'up']); else await W.npcWalk(jun, ['up', 'up']);
    jun.dir = W.player.x === 5 ? 'left' : 'right'; W.player.dir = W.player.x === 5 ? 'right' : 'left';
    await talk('Juniper', ['Gramps! I\'m here for my creature! Oh. You beat me to it?']);
    jun.dir = 'up'; jun.model.play('point');
    const rc = tableCubes.find((c) => c.id === rival); if (rc) { await G.tween(.3, (k) => { rc.cube.root.position.y += 1.2; rc.cube.root.scale.setScalar(20 * (1 - k) + .01); }); rc.cube.root.visible = false; }
    jun.dir = W.player.x === 5 ? 'left' : 'right';
    await talk('Juniper', ['Fine! Then I\'ll take ' + DATA.CREATURES[rival].name + '. ' + DATA.CREATURES[rival].types[0] + ' beats ' + DATA.CREATURES[pick.id].types[0] + ', you know!', 'Let\'s see whose creature is tougher. Battle me!']);
    jun.model.play('cheer');
    await battleTransition();
    const result = await BATTLE.fight({ vs: 'rival', canLose: true, trainer: { name: 'Juniper', look: 'juniper', coins: 100, winText: 'What?! I had the type advantage! Next time, I\'m winning.', loseText: 'Ha! Told you. Type advantage, baby!', team: [MON.make(rival, 5)] } });
    F().juniper1 = result === 'win' ? 'won' : 'lost';
    healParty();
    W.snap = true; if (CC.music) CC.music.play('village');
    await G.fade(.4, 0);
    await say(result === 'win' ? 'Ha ha! What a match. Let me patch up your creatures.' : 'Don\'t be glum. Losing teaches you things. Let me patch you both up.', { who: 'Elder Willow' });
    if (willow) willow.model.play('nod'); CC.sfx('heal');
    W.fx.burst('sparkle', new THREE.Vector3(W.follower.px, 8, W.follower.pz), 14, { speed: 30, colors: ['#c8ffd0', '#ffffff'], add: true, size: 5, g: -10 });
    jun.model.play('wave');
    await say('I\'ll be ahead of you the whole way! See you out there!', { who: 'Juniper' });
    if (jun.x === 6) await W.npcWalk(jun, ['down', 'down']); else await W.npcWalk(jun, ['down', 'right', 'down']);
    await G.tween(.3, (k) => { jun.pz += 1; });
    F().juniperIn = false;
    G.state.bag.cube += 5; G.state.bag.potion += 3; CC.sfx('buy');
    await say('Elder Willow gave you 5 Basic Cubes and 3 Potions!');
    await say('Now, sit a moment. There is something you should know before you go.', { who: 'Elder Willow' });
    await LEGEND.tell(['Long ago, the old book says, a guardian kept the moon alight: Lunarion, a silver wolf with wings full of stars.', 'Each night it flew up from the Moon Altar, far north in the Night Ruins, and the moon shone bright.', 'Now the moon fades a little more every night, and the creatures hide in the grass, afraid.', 'I\'m too old for the journey. But a trainer with a good heart might reach the altar and find out why.'], 'Elder Willow');
    await talk('Elder Willow', ['Cubes catch wild creatures. Weaken one first, and catching gets much easier.', 'Head north through the Meadow Path to the Grassland. Each region has a guide who keeps the trail. Win their trials, and they\'ll open the way to the Moon Altar.']);
    UI.toast('Head north to the Meadow Path');
  }

  // ---------- the battle transition: bars sweep in from both sides, flashing (as Creature Catch's) ----------
  function battleTransition() {
    let k = 0;
    const scr = { draw() { const flash = k < .3 && Math.floor(k * 20) % 2; if (flash) { UI.g.globalAlpha = .6; UI.rect(0, 0, 240, 160, '#ffffff'); UI.g.globalAlpha = 1; } const kk = G.clamp((k - .3) / .7, 0, 1); for (let i = 0; i < 10; i++) { const w = 240 * G.ease(G.clamp(kk * 1.6 - i * .06, 0, 1)); UI.rect(i % 2 ? 240 - w : 0, i * 16, w, 16, '#1e1626'); } } };
    G.push(scr);
    return G.tween(.9, (t) => { k = t; }).then(() => { G.pop(scr); G.fadeA = 1; G.fadeCol = '#1e1626'; });
  }

  // ---------- the tall grass ----------
  async function wildEncounter(key) {
    const W = WORLD, P = W.player, sp = DATA.SPAWNS[key];
    const night = WORLD.night > .5, ok = (x) => !sp.time || !sp.time[x] || (sp.time[x] === 'night') === night;
    const r = Math.random() * 100; let tier = r < 60 ? 'common' : r < 90 ? 'uncommon' : 'rare'; if (!(sp[tier] || []).filter(ok).length) tier = 'common';
    const lv = G.randi(sp.levels[0], sp.levels[1]), id = DATA.wildForm(G.pick(sp[tier].filter(ok).length ? sp[tier].filter(ok) : sp.common), lv);
    W.cooldown = 3;
    const d = W.DIRS[P.dir]; let hx = P.x + d[0], hy = P.y + d[1];
    if (W.info.tileAt(hx, hy) !== ',' || W.npcAt(hx, hy)) { hx = P.x; hy = P.y; }
    const gx = hx * T + 8, gz = hy * T + 9;
    CC.sfx('rustle'); PLACES.GRASSU.uR.value.set(gx, gz, 0);
    for (let i = 0; i < 12; i++) W.fx.emit({ x: gx + G.rand(-6, 6), y: 8, z: gz + G.rand(-6, 6), vx: G.rand(-30, 30), vy: G.rand(20, 50), vz: G.rand(-30, 30), g: 90, life: .7, size: 4, shape: 'leaf', color: G.pick(['#5ab848', '#90e070', '#2f7a2a']), spin: 8 });
    W.showEmote(P.model, '!'); CC.sfx('encounter');
    await G.sleep(.4);
    // it hops out of the grass toward you
    const c = W.creature(id); c.root.scale.setScalar(W.MC * .9); c.root.position.set(gx, 0, gz); c.root.rotation.y = Math.atan2(P.px - gx, P.pz - gz); W.scene.add(c.root);
    c.play('hop'); const from = new THREE.Vector3(gx, 0, gz), to = new THREE.Vector3(G.lerp(gx, P.px, hx === P.x && hy === P.y ? 0 : .35), 0, G.lerp(gz, P.pz, hx === P.x && hy === P.y ? 0 : .35));
    const upd = { update() { c.update(G.t, G.dt, 0); } }; const was = G.update; G.update = (dt) => { was(dt); upd.update(); };
    await G.tween(.45, (k) => { c.root.position.lerpVectors(from, to, k); c.root.position.y = Math.sin(k * Math.PI) * 12; });
    c.play('roar'); await G.sleep(.5);
    W.hideEmote(); PLACES.GRASSU.uR.value.set(-999, -999, -99);
    await battleTransition();
    G.update = was; W.scene.remove(c.root);
    G.state.seen[id] = 1;
    const result = await BATTLE.fight({ wild: MON.make(id, lv) });
    W.snap = true; if (CC.music) CC.music.play(W.info.map.music);
    if (result === 'lose') await blackout(); else { G.fadeCol = '#000000'; await G.fade(.35, 0); }
    if (result === 'caught') { const m = G.state.party[G.state.party.length - 1]; if (m && m.caughtHere && G.state.party.length === 2 && !F().caughtFirst) { F().caughtFirst = true; await say('Your first catch! ' + MON.name(m) + ' joined your team. Press MENU to see your creatures.'); } }
    W.cooldown = 3;
  }
  async function blackout() {
    G.fadeCol = '#000000'; G.fadeA = 1;
    healParty(); const h = G.state.lastHeal;
    WORLD.enter(h.map, h.x, h.y, 'down');
    await G.fade(.4, 0);
    await say((h.map === 'hut-in' ? 'You hurried back to the Healing Hut.' : h.map === 'outpost-in' ? 'You hurried back to the Grassland Outpost.' : h.map === 'inn-in' ? 'You hurried back to Rosa\'s Inn.' : 'You hurried back to your house.') + ' Your creatures are rested and ready.');
  }

  // ---------- learning, choosing ----------
  async function learnMove(m, mv) {
    const name = MON.name(m), mvName = DATA.MOVES[mv].name;
    if (m.moves.length < 4) { m.moves.push({ id: mv, pp: DATA.MOVES[mv].pp }); CC.sfx('levelup'); await say(name + ' learned ' + mvName + '!'); return; }
    await say(name + ' wants to learn ' + mvName + '. But ' + name + ' already knows four moves.');
    if (!(await UI.yesNo('Forget a move to make room for ' + mvName + '?'))) { await say(name + ' did not learn ' + mvName + '.'); return; }
    const i = await UI.menu(m.moves.map((x) => DATA.MOVES[x.id].name).concat(['Keep them all']), { title: 'Forget which?', y: 30 });
    if (i < 0 || i >= 4) { await say(name + ' did not learn ' + mvName + '.'); return; }
    const old = DATA.MOVES[m.moves[i].id].name; m.moves[i] = { id: mv, pp: DATA.MOVES[mv].pp };
    await say('1, 2, and... Poof! ' + name + ' forgot ' + old + ' and learned ' + mvName + '!');
  }
  function pickCreature(title, must) {
    const party = G.state.party;
    return UI.menu(party.map((m) => ({ label: MON.name(m) + '  Lv' + m.lv, right: m.hp + '/' + MON.maxHp(m), disabled: false })), { title, y: 20, noCancel: !!must });
  }

  // ---------- the field menu: your creatures (each shown turning on a little stage), the bag ----------
  const SHOW = { id: null, model: null };
  async function creatureCard(i) {
    const m = G.state.party[i], sp = MON.sp(m), st = MON.stats(m);
    SHOW.id = m.id;
    await new Promise((resolve) => {
      const scr = {
        update() { if (G.input.pressed.a || G.input.pressed.b) { CC.sfx('back'); G.pop(scr); resolve(); } },
        draw() {
          UI.box(0, 0, 240, 160, { fill: '#fbf3e0' });
          UI.box(6, 6, 100, 100, { hole: true }); UI.showcase = { id: m.id, x: 9, y: 9, w: 94, h: 94 };
          UI.text(sp.name, 114, 8, '#1c1624', { size: 12 }); UI.textNum('Lv' + m.lv, 232, 10, '#6a5a50', { align: 'right' });
          sp.types.forEach((t, k) => { const tc = DATA.TYPE_COLORS[t], w = UI.textWidth(t.toUpperCase(), 8) + 8; UI.rect(114 + k * 40, 24, w, 11, tc[1]); UI.text(t.toUpperCase(), 114 + k * 40 + w / 2, 25, '#fff', { size: 8, align: 'center', shadow: tc[2] }); });
          UI.text('HP', 114, 40, '#a84a2a', { size: 9 }); UI.bar(130, 43, 70, m.hp / st.hp); UI.textNum(m.hp + '/' + st.hp, 232, 40, '#1c1624', { size: 9, align: 'right' });
          UI.textNum('ATK ' + st.atk + '   DEF ' + st.def + '   SPD ' + st.spd, 114, 54, '#4a3a40', { size: 9 });
          m.moves.forEach((x, k) => { const mv = DATA.MOVES[x.id]; UI.text(mv.name, 114, 70 + k * 11, '#1c1624', { size: 9 }); UI.textNum(x.pp + '/' + mv.pp, 232, 70 + k * 11, '#6a5a50', { size: 9, align: 'right' }); });
          const lore = UI.wrap(DATA.LORE[m.id].lore, 224, 9).slice(0, 4); lore.forEach((l, k) => UI.text(l, 8, 112 + k * 11, '#4a3a40', { size: 9 }));
        },
      };
      G.push(scr);
    });
    UI.showcase = null;
  }
  // the Looks menu: switch the town between the 3D world and the diorama, and battles between the 3D clearing and the paintings
  async function looksMenu() {
    const TOWN = { '3d': '3D world', diorama: 'Diorama' }, FIGHT = { '3d': '3D clearing', painted: 'Painted' };
    let sel = 0;
    while (true) {
      const i = await UI.menu([{ label: 'Town', right: TOWN[G.look.town] }, { label: 'Battles', right: FIGHT[G.look.battle] }, { label: 'Done' }], { title: 'Looks', y: 24, start: sel, w: 160 });
      if (i < 0 || i === 2) return;
      sel = i;
      if (i === 0) { G.look.town = G.look.town === 'diorama' ? '3d' : 'diorama'; if (WORLD.info) WORLD.applyLook(); }
      else G.look.battle = G.look.battle === 'painted' ? '3d' : 'painted';
      G.saveLook();
    }
  }
  async function fieldMenu() {
    while (true) {
      const items = ['Creatures', 'Bag', 'Creature Log', 'Looks'].concat(F().vaultKey ? ['Cube Vault'] : []).concat(['Close']);
      const c0 = await UI.menu(items, { y: 4, startCloses: true }), c = c0 < 0 ? -1 : ['Creatures', 'Bag', 'Creature Log', 'Looks', 'Cube Vault', 'Close'].indexOf(items[c0]);
      if (c < 0 || c === 5) return;
      if (c === 3) { await looksMenu(); continue; }
      if (c === 4) { await cubeVault(); continue; }
      if (c === 0) {
        if (!G.state.party.length) { await say('You don\'t have any creatures yet.'); continue; }
        while (true) { const i = await pickCreature('Your creatures'); if (i < 0) break; await creatureCard(i); }
      } else if (c === 1) {
        const i = await UI.menu([{ label: 'Basic Cube', right: 'x' + G.state.bag.cube }, { label: 'Potion', right: 'x' + G.state.bag.potion }, { label: 'Coins', right: G.state.coins }], { title: 'Bag', y: 30 });
        if (i === 1 && G.state.bag.potion && G.state.party.length) {
          const k = await pickCreature('Use a Potion on which?'); if (k < 0) continue; const m = G.state.party[k];
          if (m.hp <= 0 || m.hp >= MON.maxHp(m)) { await say('It won\'t have any effect.'); continue; }
          G.state.bag.potion--; m.hp = Math.min(MON.maxHp(m), m.hp + 30); CC.sfx('heal'); await say(MON.name(m) + ' was healed!');
        } else if (i === 0) await say(DATA.ITEMS.cube.info);
      } else if (c === 2) {
        const all = Object.keys(DATA.CREATURES);
        await UI.menu(all.map((id) => ({ label: G.state.caught[id] ? DATA.CREATURES[id].name : G.state.seen[id] ? DATA.CREATURES[id].name + ' (seen)' : '???', right: G.state.caught[id] ? 'caught' : '' })), { title: 'Creature Log: ' + Object.keys(G.state.caught).length + ' caught', y: 10 });
      }
    }
  }

  // ---------- Rosa's Inn: rest until morning or until night (some creatures only come out after dark) ----------
  let innTalks = 0;
  async function innkeeper() {
    const who = 'Rosa', lines = ['Welcome to the Inn! Need a rest? I\'ll wake you at sunrise, or at nightfall, whichever you like.', 'Some creatures only come out after dark. A night\'s rest here is the easy way to meet them.'];
    await say(lines[innTalks++ % lines.length], { who });
    const c = await UI.ask('Rest at the Inn? (30 coins, and your creatures are healed)', ['Until morning', 'Until night', 'No thanks'], who);
    if (c === 2 || c < 0) { await say('Come back any time, dear.', { who }); return; }
    if (G.state.coins < 30) { await say('Oh, you\'re a little short. Next time, then!', { who }); return; }
    G.state.coins -= 30;
    await G.fade(.5, 1);
    healParty(); CC.sfx('heal'); G.state.lastHeal = { map: 'inn-in', x: 5, y: 5 };
    WORLD.setNight(c === 1 ? 1 : 0);
    await G.sleep(1.2); await G.fade(.5, 0);
    await say(c === 0 ? 'You slept until morning. The sun is up, and your creatures are full of energy!' : 'You rested until nightfall. Your creatures are full of energy! The night creatures will be out.');
  }
  // ---------- the Grassland: Farmer Bramble's trail trial, the log, the barn ----------
  const trainerTeam = (list) => list.map(([id, lv]) => MON.make(DATA.wildForm(id, lv), lv));
  async function brambleTrial() {
    const W = WORLD, who = 'Farmer Bramble';
    if (F().trial1) { await say('The Forest trail is all yours. Mind the owls!', { who }); return; }
    await talk(who, ['Howdy! I\'m Farmer Bramble, guide of the Grassland.', 'That fallen log is the only way into the Forest, and I only clear it for trainers who can handle the creatures out there.']);
    if (!(await UI.yesNo('Ready for my trail trial?', who))) { await say('Come back when you\'re ready. The outpost will patch you up.', { who }); return; }
    const r = await BATTLE.fight({ vs: 'guide', trainer: { name: who, look: 'bramble', coins: 240,
      intro: 'My critters have been working the fields all morning. Show me what you\'ve got!',
      winText: 'Well I\'ll be! You\'ve earned it.', loseText: 'Ha! Not quite yet. Rest up and try again.',
      team: trainerTeam([['hopsprout', 7], ['pebblepup', 7], ['tuftail', 8]]) } });
    W.snap = true; if (CC.music) CC.music.play(W.info.map.music);
    if (r === 'lose') { await blackout(); return; }
    G.fadeCol = '#000000'; await G.fade(.35, 0);
    if (r !== 'win') return;
    F().trial1 = true;
    CC.sfx('catch'); await say('You got the Leaf Trail Charm!');
    await talk(who, ['One more thing. Hazel asked me to hand you this if you passed.']);
    F().vaultKey = true; CC.sfx('buy'); await say('You got the Vault Key! Now you can open the Cube Vault from the menu, anywhere.');
    await say('Now, let\'s shift this log. Hup!', { who });
    const n = W.npcByName(who); if (n) { n.dir = 'up'; n.model.play('throw'); }
    CC.sfx('bump'); F().logCleared = true; await PLACES.clearLog(W.info, true);
    if (n) await W.npcWalk(n, ['right', 'right', 'right', 'down']);
    if (n) n.dir = 'down';
    await say('Farmer Bramble rolled the log out of the way. The trail into the Forest is open!');
  }
  function onEnter(mapId, info) {
    if (mapId !== 'grassland') return;
    if (F().logCleared) { PLACES.clearLog(info, false); const n = (info.npcs || []).find((x) => x.id === 'bramble'); if (n && n.x === 12 && n.y === 1) Object.assign(n, { x: 15, y: 2, px: 15 * T + 8, pz: 2 * T + 9 }); }
  }
  async function lockedDoor(d) {
    if (WORLD.mapId === 'grassland') await say('Farmer Bramble\'s farmhouse. The door\'s latched; he\'s out in the fields.');
    else await say('It\'s locked.');
  }
  // ---------- the end of Chapter 1: the trail north into the Forest, once the log is gone ----------
  async function beforeExit(e) {
    if (e.to === 'orchard') { await WORLD.run(() => say('The trail east runs on to Willowbrook Orchard. That\'s for the next chapter.')); WORLD.player.dir = 'left'; return true; }
    if (e.to !== 'forest') return false;
    const W = WORLD;
    await W.run(async () => {
      const c0 = Object.assign({}, W.cam); let k = 0;
      W.ctl = (cam, dt) => { k = Math.min(1, k + dt * .35); const e2 = G.ease(k); cam.tz = G.lerp(c0.tz, -60, e2); cam.ty = G.lerp(c0.ty, 30, e2); cam.elev = G.lerp(c0.elev, .3, e2); cam.hv = G.lerp(c0.hv, 200, e2); cam.tx = G.lerp(c0.tx, 8 * T, e2); };
      if (W.follower.model) W.follower.model.play('happy');
      await G.sleep(2.2);
      const caught = Object.keys(G.state.caught).length - 1;
      await say('The trail runs on north into the Forest, where Ranger Oakley keeps watch. That\'s Chapter 2.');
      await new Promise((resolve) => {
        const scr = {
          update() { if (G.input.pressed.a) { CC.sfx('select'); G.pop(scr); resolve(); } },
          draw() {
            UI.box(30, 22, 180, 104);
            UI.text('End of Chapter 1', 120, 30, '#6a3a2a', { size: 12, align: 'center' });
            UI.text('Creature Catch, in 3D', 120, 46, '#1c1624', { align: 'center' });
            const lines = ['Lead: ' + MON.name(G.state.party[0]) + ' Lv' + G.state.party[0].lv, 'Creatures caught: ' + Math.max(0, caught) + ' of ' + Object.keys(DATA.CREATURES).length, 'Juniper\'s battle: ' + (F().juniper1 === 'won' ? 'won' : 'lost'), 'Leaf Trail Charm: earned'];
            lines.forEach((l, i) => UI.textNum(l, 46, 64 + i * 13, '#4a3a40', { size: 9 }));
            if (Math.floor(G.t * 2) % 2) UI.text('A to keep exploring', 120, 108, '#6a5a50', { size: 9, align: 'center' });
          },
        };
        G.push(scr);
      });
      W.ctl = null; W.player.dir = 'down';
    });
    return true;
  }
  async function onStep(x, y) { return false; }
  return { NPCS, blockStep, furniture, talkFollower, wildEncounter, learnMove, pickCreature, addCreature, fieldMenu, looksMenu, beforeExit, onEnter, lockedDoor, onStep, setTable, battleTransition, healParty, LEGEND, SHOW };
})();
