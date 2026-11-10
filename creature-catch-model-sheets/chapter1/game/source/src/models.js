// models.js: our painted, animated models (the paint-and-bake GLBs), loaded at boot and cloned when the game needs one.
// Each model is a JSON file in the Creature Battle Bay format (assets/models/<id>.json: a base64 GLB, its texture file
// names, and the animation manifest with its effect anchors and clip lengths), packed by game/tools/pack_models.py.
//   MODELS.load(onProgress)   fetches assets/models/index.json and every model in it (with their textures)
//   MODELS.has(id)            a model is loaded for this creature or person id
//   MODELS.creatureBody(id, C) the body for makeCreature (creatures.js): the GLB, its clips, mapped to the game's actions
//   MODELS.person(key)        a person with makePerson's interface, or null (then the old built-in model is used)
// Anything without a model keeps its old built-in-code model, so the game always plays.
// Our models are painted, not cel-shaded: no ink outlines, and a lit material with soft, even light that shows the paint.
const MODELS = (() => {
  'use strict';
  const store = {};
  const BASE = 'assets/';
  const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
  let stats = { creatures: [], people: [], failed: [] };

  // ---------- loading ----------
  async function fetchJson(url, onBytes) {
    const res = await fetch(url); if (!res.ok) throw new Error(url + ': ' + res.status);
    if (!res.body || !res.body.getReader) { const tx = await res.text(); onBytes(tx.length); return JSON.parse(tx); }
    const r = res.body.getReader(), chunks = []; let n = 0;
    for (;;) { const { done, value } = await r.read(); if (done) break; chunks.push(value); n += value.length; onBytes(value.length); }
    const all = new Uint8Array(n); let at = 0; for (const c of chunks) { all.set(c, at); at += c.length; }
    return JSON.parse(new TextDecoder().decode(all));
  }
  const texLoader = new THREE.TextureLoader();
  function tex(file, onBytes) {
    return new Promise((ok) => texLoader.load(BASE + 'textures/' + file, (t) => {
      t.flipY = false; t.encoding = THREE.LinearEncoding; // the game draws in plain (linear) colours: show the paint as painted
      t.anisotropy = 4; onBytes(); ok(t);
    }, undefined, () => { console.warn('[cc] missing texture ' + file); onBytes(); ok(null); }));
  }
  function b64(s) { const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out.buffer; }
  // a component of an attribute, as the shader sees it (r128's getX doesn't undo normalized, quantized storage)
  function comp(attr, i, c) {
    const arr = attr.isInterleavedBufferAttribute ? attr.data.array : attr.array;
    const v = c === 0 ? attr.getX(i) : c === 1 ? attr.getY(i) : c === 2 ? attr.getZ(i) : attr.getW(i);
    if (!attr.normalized) return v;
    if (arr instanceof Int8Array) return Math.max(v / 127, -1); if (arr instanceof Uint8Array) return v / 255;
    if (arr instanceof Int16Array) return Math.max(v / 32767, -1); if (arr instanceof Uint16Array) return v / 65535;
    return v;
  }
  // the real rest-pose box: every 3rd vertex skinned on the CPU, as the GPU would draw it
  function restBox(scene) {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3(), p = new THREE.Vector3(), acc = new THREE.Vector3(), t = new THREE.Vector3();
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry, P = g.attributes.position;
      for (let i = 0; i < P.count; i += 3) {
        p.set(comp(P, i, 0), comp(P, i, 1), comp(P, i, 2));
        if (o.isSkinnedMesh && g.attributes.skinIndex) {
          const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight; let ws = 0; acc.set(0, 0, 0);
          p.applyMatrix4(o.bindMatrix);
          for (let k = 0; k < 4; k++) { const w = comp(SW, i, k); if (!w) continue; const b = comp(SI, i, k); const bone = o.skeleton.bones[b]; if (!bone) continue; _m.multiplyMatrices(bone.matrixWorld, o.skeleton.boneInverses[b]); acc.addScaledVector(t.copy(p).applyMatrix4(_m), w); ws += w; }
          if (ws > 0) p.copy(acc).divideScalar(ws);
        } else p.applyMatrix4(o.matrixWorld);
        box.expandByPoint(p);
      }
    });
    return box;
  }
  async function loadOne(id, onBytes) {
    const d = await fetchJson(BASE + 'models/' + id + '.json', onBytes);
    const loader = new THREE.GLTFLoader();
    const T = d.textures || {};
    const [gltf, map, normalMap, emissiveMap] = await Promise.all([
      new Promise((ok, fail) => loader.parse(b64(d.glb), '', ok, fail)),
      T.map ? tex(T.map, () => {}) : null, T.normalMap ? tex(T.normalMap, () => {}) : null, T.emissiveMap ? tex(T.emissiveMap, () => {}) : null,
    ]);
    const scene = gltf.scene;
    const box = restBox(scene), size = box.getSize(new THREE.Vector3());
    const anchors = {};
    for (const [k, a] of Object.entries((d.manifest && d.manifest.anchors) || {})) {
      const bone = scene.getObjectByName(a.bone); if (!bone) continue;
      const pw = a.pos ? new THREE.Vector3(...a.pos) : bone.getWorldPosition(new THREE.Vector3());
      anchors[k] = { bone: a.bone, local: bone.worldToLocal(pw.clone()), rest: pw };
    }
    const clips = {}; for (const c of gltf.animations) clips[c.name] = c;
    d.glb = null; // the bytes are parsed; let them go
    store[id] = { id, d, kind: d.kind || (d.plan === 'biped' && clips.throw ? 'person' : 'creature'), scene, clips, box, size, anchors, map, normalMap, emissiveMap, manifest: d.manifest || {} };
  }
  async function load(onProgress) {
    let idx;
    try { const r = await fetch(BASE + 'models/index.json'); if (!r.ok) throw new Error(r.status); idx = await r.json(); }
    catch (e) { console.warn('[cc] no models list (' + e.message + '): every creature and person keeps its built-in model'); return stats; }
    const ids = (idx.creatures || []).concat(idx.people || []);
    const total = ids.reduce((s, id) => s + ((idx.bytes && idx.bytes[id]) || 5e5), 0) || 1;
    let got = 0; const tick = (n) => { got += n; if (onProgress) onProgress(Math.min(1, got / total)); };
    // two at a time: steady progress, and the phone isn't asked to decode everything at once
    const queue = ids.slice();
    async function worker() {
      while (queue.length) {
        const id = queue.shift();
        try { await loadOne(id, tick); (store[id].kind === 'person' ? stats.people : stats.creatures).push(id); }
        catch (e) { console.warn('[cc] model ' + id + ' failed to load: ' + e.message); stats.failed.push(id); }
      }
    }
    await Promise.all([worker(), worker()]);
    if (onProgress) onProgress(1);
    console.log('[cc] models: ' + stats.creatures.length + ' creatures (' + stats.creatures.join(', ') + '), ' + stats.people.length + ' people (' + stats.people.join(', ') + ')');
    return stats;
  }
  // a dev aid: ?glbas=willow:player-a,rosa:player-b shows one model in place of another (to try the carried things)
  const ALIAS = {};
  (location.search.match(/[?&]glbas=([\w:,-]+)/) || [, ''])[1].split(',').filter(Boolean).forEach((p) => { const [a, b] = p.split(':'); ALIAS[a] = b; });
  const entry = (id) => store[id] || (ALIAS[id] && store[ALIAS[id]]) || null;
  const off = /[?&]oldmodels/.test(location.search); // ?oldmodels: every model as the old demo built it
  const has = (id) => !off && !!entry(id);

  // ---------- the painted material: lit softly and evenly, a flash colour on top, fades ----------
  const LOOK = { soft: { value: .5 }, lift: { value: 1.08 } }; // how much of the light's direction is evened out, and the brightness of that even part
  function paintMat(E) {
    const m = new THREE.MeshStandardMaterial({ map: E.map, normalMap: E.normalMap || null, emissiveMap: E.emissiveMap || null, emissive: new THREE.Color(E.emissiveMap ? '#ffffff' : '#000000'), roughness: .88, metalness: 0, skinning: true });
    if (E.normalMap) m.normalScale.set(.7, .7);
    const u = { uFlash: { value: new THREE.Vector4(1, 1, 1, 0) }, uSoft: LOOK.soft, uLift: LOOK.lift };
    m.userData.u = u;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = 'uniform vec4 uFlash;\nuniform float uSoft;\nuniform float uLift;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb, diffuseColor.rgb * uLift + totalEmissiveRadiance, uSoft);\n gl_FragColor.rgb = mix(gl_FragColor.rgb, uFlash.rgb, uFlash.a);\n#include <dithering_fragment>');
    };
    m.customProgramCacheKey = () => 'cc-paint';
    return m;
  }
  function anchorOf(E, bones, name, out) {
    const a = E.anchors[name]; if (!a) return null;
    const b = bones[a.bone]; if (!b) return null;
    b.updateWorldMatrix(true, false); return b.localToWorld(out.copy(a.local));
  }
  function cloneBody(E) {
    const body = THREE.SkeletonUtils.clone(E.scene), bones = {};
    const mat = paintMat(E);
    body.traverse((o) => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.material = mat; o.frustumCulled = false; o.castShadow = true; o.receiveShadow = false; } });
    return { body, bones, mat };
  }

  // ---------- creatures: the game's body actions played with our clips ----------
  // clip: which of our clips; from/to: a stretch of it (seconds); hold: stop there and keep the pose; damp: how much of the
  // game's whole-body motion (lunges, tilts) stays on top of the clip; dampS: the same for squash and stretch
  const CLIPS = {
    attack: { clip: 'physical' }, chomp: { clip: 'physical' }, fantastichop: { clip: 'physical' }, dustkick: { clip: 'physical', damp: .5 },
    grassswipe: { clip: 'physical', damp: 1 }, rockfetchfling: { clip: 'special' },
    cast: { clip: 'special' }, spit: { clip: 'special' }, flick: { clip: 'special' },
    roar: { clip: 'boost' }, puff: { clip: 'boost', damp: .6 }, maneflare: { clip: 'boost' }, woolpuff: { clip: 'boost', damp: .6 },
    cheekstash: { clip: 'status', damp: .6 },
    curl: { clip: 'boost_guard' }, tuck: { clip: 'boost_guard', to: .5, hold: true },
    quakestomp: { clip: 'strong_physical', damp: .25 }, scareflap: { clip: 'strong_physical', damp: .5 },
    radiantbeamcharge: { clip: 'strong_special', to: .78, hold: true }, radiantbeamfire: { clip: 'strong_special', from: .78, to: .95, hold: true }, radiantbeamend: { clip: 'strong_special', from: .95 },
    hit: { clip: 'hit', damp: .2 }, faint: { clip: 'faint', hold: true, damp: 0, dampS: 0 }, appear: { clip: 'send_out', damp: 0, dampS: 0 },
  };
  // the moment each clip lands its blow (seconds into the clip, from pipeline/motions.py), to keep each move's hit timing
  const HIT_AT = { physical: .45, special: .34, strong_physical: 1.0, strong_special: .92, boost: .35, boost_guard: .35, status: 1.0 };

  function creatureBody(id, C, D) {
    const E = entry(id); if (!E) return null;
    const { body, bones, mat } = cloneBody(E);
    const k = D.height / Math.max(1e-3, E.size.y); // as tall as the game's own model of it
    body.scale.setScalar(k);
    body.position.set(-(E.box.min.x + E.box.max.x) / 2 * k, -E.box.min.y * k, 0);
    C.rig.add(body);
    C.mats.push(mat);
    const mixer = new THREE.AnimationMixer(body), acts = {};
    for (const n in E.clips) { const a = mixer.clipAction(E.clips[n]); a.enabled = true; acts[n] = a; }
    const len = (n) => (E.clips[n] ? E.clips[n].duration : 1);
    const loops = ['idle', 'walk'].filter((n) => acts[n]);
    for (const n of loops) { acts[n].setLoop(THREE.LoopRepeat, Infinity); acts[n].play(); acts[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
    if (acts.idle) acts.idle.time = Math.random() * len('idle');
    let one = null; const fading = [];
    function start(name, def) {
      const m = CLIPS[name]; if (!m || !acts[m.clip]) { end(); return; } // an action with no clip of ours: just the game's body motion
      const a = acts[m.clip], from = m.from || 0, to = Math.min(len(m.clip), m.to || len(m.clip));
      let ts = (to - from) / Math.max(.05, def.dur);
      if (def.hit && HIT_AT[m.clip] !== undefined && HIT_AT[m.clip] > from && HIT_AT[m.clip] < to) ts = (HIT_AT[m.clip] - from) / Math.max(.03, def.hit * def.dur);
      ts = G.clamp(ts, .35, 4);
      const w0 = one ? one.w : 0;
      if (one && one.a !== a) fading.push({ a: one.a, w: one.w });
      for (let i = fading.length - 1; i >= 0; i--) if (fading[i].a === a) fading.splice(i, 1);
      a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = ts; a.time = from; a.enabled = true; a.paused = false; a.play();
      one = { a, name, to, hold: !!m.hold, w: one && one.a === a ? w0 : 0, done: false, m };
    }
    function end() { if (one) { fading.push({ a: one.a, w: one.w }); one = null; } }
    function update(dt, walk, act) {
      if (one) {
        if (!one.done && one.a.time >= one.to - 1e-3) { if (one.hold) { one.a.paused = true; one.a.time = one.to; } else one.done = true; }
        const keep = one.hold ? !!act && act.name === one.name : !one.done;
        one.w = G.clamp(one.w + (keep ? dt / .08 : -dt / .14), 0, 1);
        if (!keep && one.w <= 0) { one.a.stop(); one = null; }
      }
      for (let i = fading.length - 1; i >= 0; i--) { const f = fading[i]; f.w -= dt / .12; if (f.w <= 0) { f.a.stop(); fading.splice(i, 1); } }
      const used = (one ? one.w : 0) + fading.reduce((s, f) => s + Math.max(0, f.w), 0), rest = Math.max(0, 1 - used);
      const wk = G.clamp(walk || 0, 0, 1);
      if (acts.idle) { acts.idle.setEffectiveWeight(rest * (acts.walk ? 1 - wk : 1)); acts.idle.timeScale = C.blink ? .35 : 1; }
      if (acts.walk) { acts.walk.setEffectiveWeight(rest * wk); acts.walk.timeScale = 1.5; }
      if (one) one.a.setEffectiveWeight(one.w);
      for (const f of fading) f.a.setEffectiveWeight(Math.max(0, f.w));
      mixer.update(dt);
    }
    // the game's whole-body motion for an action our clip already plays: keep only a little of it
    function shape(o, name) {
      const m = CLIPS[name]; if (!m || !acts[m.clip]) return;
      const k = m.damp === undefined ? .35 : m.damp, ks = m.dampS === undefined ? 1 : m.dampS;
      o.x *= k; o.y *= k; o.z *= k; o.rx *= k; o.ry *= k; o.rz *= k;
      o.sx = 1 + (o.sx - 1) * ks; o.sy = 1 + (o.sy - 1) * ks; o.sz = 1 + (o.sz - 1) * ks;
    }
    function anchor(name, out) { return anchorOf(E, bones, name, out) || anchorOf(E, bones, 'mouth', out) || C.root.localToWorld(out.set(0, D.height * .6, .15)); }
    function flash(fk, col) { mat.userData.u.uFlash.value.set(col.r, col.g, col.b, fk * .85); }
    // a frozen copy in its current pose (for afterimages), its bones its own
    function ghost() { const c = THREE.SkeletonUtils.clone(C.root); c.traverse((o) => { if (o.isMesh) o.frustumCulled = false; }); return c; }
    update(0, 0, null);
    return { body, bones, parts: Object.assign({}, bones), start, end, update, shape, anchor, flash, ghost, mixer, entry: E, clips: Object.keys(E.clips) };
  }

  // ---------- people ----------
  const PERSON_CLIPS = { wave: 'wave', cheer: 'cheer', point: 'point', throw: 'throw', talk: 'talk', lose: 'lose', surprise: 'lose', nod: 'talk' };
  const PHK = 11; // walk phase per metre, as makePerson
  function person(key) {
    const E = entry(key); if (!E || E.kind !== 'person' && !ALIAS[key]) return null;
    const { body, bones, mat } = cloneBody(E);
    const root = new THREE.Group(); root.name = key;
    const H = 1.13, k = H / Math.max(1e-3, E.size.y); // the game sizes people as if 1.13 m tall (WORLD.person)
    body.scale.setScalar(k); body.position.set(-(E.box.min.x + E.box.max.x) / 2 * k, -E.box.min.y * k, 0);
    root.add(body);
    const mixer = new THREE.AnimationMixer(body), acts = {};
    for (const n in E.clips) { const a = mixer.clipAction(E.clips[n]); a.enabled = true; acts[n] = a; }
    const len = (n) => (E.clips[n] ? E.clips[n].duration : 1);
    for (const n of ['idle', 'walk', 'run']) if (acts[n]) { acts[n].setLoop(THREE.LoopRepeat, Infinity); acts[n].play(); acts[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
    if (acts.idle) acts.idle.time = Math.random() * len('idle');
    const ev = (E.manifest.events && E.manifest.events.throw) || { release: .5, anchor: 'hand_R' };
    let one = null, lastPh = 0, rate = 0, runK = 0, fadeV = 1; const fading = [];
    function play(name, force) {
      const c = PERSON_CLIPS[name]; if (!c || !acts[c]) return false;
      if (one && !force && one.a.time < one.to - .05) return false;
      const a = acts[c];
      if (one && one.a !== a) fading.push({ a: one.a, w: one.w });
      for (let i = fading.length - 1; i >= 0; i--) if (fading[i].a === a) fading.splice(i, 1);
      a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = 1; a.enabled = true; a.play();
      one = { a, name, to: len(c), w: one && one.a === a ? one.w : 0, done: false };
      return true;
    }
    function animate(phase, walk, t, dt) {
      dt = dt || 0;
      if (dt > 0) { const r = Math.abs(phase - lastPh) / dt; rate = G.lerp(rate, r, Math.min(1, dt * 8)); }
      lastPh = phase;
      const speed = rate / PHK; // metres a second, in the game's 1.13 m person
      runK = G.lerp(runK, speed > 4.3 ? 1 : 0, Math.min(1, dt * 6));
      if (one) {
        if (!one.done && one.a.time >= one.to - 1e-3) one.done = true;
        one.w = G.clamp(one.w + (one.done ? -dt / .2 : dt / .1), 0, 1);
        if (one.done && one.w <= 0) { one.a.stop(); one = null; }
      }
      for (let i = fading.length - 1; i >= 0; i--) { const f = fading[i]; f.w -= dt / .15; if (f.w <= 0) { f.a.stop(); fading.splice(i, 1); } }
      const used = (one ? one.w : 0) + fading.reduce((s, f) => s + Math.max(0, f.w), 0), rest = Math.max(0, 1 - used);
      const wk = G.clamp(walk || 0, 0, 1), rk = acts.run ? runK : 0;
      if (acts.idle) acts.idle.setEffectiveWeight(rest * (1 - wk));
      if (acts.walk) { acts.walk.setEffectiveWeight(rest * wk * (1 - rk)); acts.walk.timeScale = G.clamp(speed / 2.3, .7, 1.9); }
      if (acts.run) { acts.run.setEffectiveWeight(rest * wk * rk); acts.run.timeScale = G.clamp(speed / 5.2, .8, 1.6); }
      if (one) one.a.setEffectiveWeight(one.w);
      for (const f of fading) f.a.setEffectiveWeight(Math.max(0, f.w));
      mixer.update(dt);
      for (const p of props) if (p.tick) p.tick(t, dt);
    }
    const NAMES = { head: null, chest: 'chest', hand: ev.anchor || 'hand_R', hit: 'hand_R' };
    const _a = new THREE.Vector3(), _b = new THREE.Vector3();
    function anchor(name, out) {
      out = out || new THREE.Vector3();
      if (name === 'head') { // the middle of the face, a little above the mouth
        const top = anchorOf(E, bones, 'head_top', _a), mo = anchorOf(E, bones, 'mouth', _b);
        if (top && mo) return out.copy(mo).lerp(top, .45);
        if (top) return out.copy(top);
      }
      return anchorOf(E, bones, NAMES[name] || name, out) || anchorOf(E, bones, 'chest', out) || root.localToWorld(out.set(0, .7, .1));
    }
    function setFade(f) {
      f = G.clamp(+f, 0, 1); if (Math.abs(f - fadeV) < 1e-4) return;
      const tr = f < .999; fadeV = f;
      for (const m of [mat].concat(propMats)) { if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = f; }
      root.visible = f > .002;
    }
    // the thing this person carries (Elder Willow's staff, Rosa's tray...), in a hand
    const props = [], propMats = [];
    const held = HELD[key];
    if (held) for (const h of [].concat(held)) {
      const p = h.make(); const hand = bones[(E.anchors[h.hand] || {}).bone] || bones[h.hand];
      if (!hand) continue;
      p.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; if (propMats.indexOf(o.material) < 0) propMats.push(o.material); } });
      attach(E, body, hand, h.hand, p.group, h);
      props.push(p);
    }
    animate(0, 0, 0, 0);
    return {
      root, fx: new THREE.Group(), bones, animate, play, PHASE_PER_M: PHK, glb: true, throwAt: ev.release,
      reset() { if (one) { fading.push({ a: one.a, w: one.w }); one = null; } },
      get busy() { return !!one && !one.done; }, get action() { return one ? one.name : ''; },
      get progress() { return one ? Math.min(1, one.a.time / one.to) : -1; },
      anchor, setFade, look() {}, aim() {}, guard() {}, setReveal() {}, setOutline() {}, state: {}, ACTIONS: {},
      stats: { model: E.id },
    };
  }
  // a prop goes on a hand bone. Props are built standing in the person's own space (metres of a 1.13 m person, Y up,
  // facing +Z, origin at the grip), so each is placed with the hand's rest pose undone, then follows the hand.
  function attach(E, body, hand, anchorName, group, h) {
    body.updateMatrixWorld(true);
    const a = E.anchors[anchorName];
    const gripScene = a ? a.rest.clone() : hand.getWorldPosition(new THREE.Vector3()); // scene space of the GLB, at rest
    const s = body.scale.x; // GLB units per game metre = 1 / s
    const holder = new THREE.Group();
    // where the grip is and how the props stand, in the GLB scene's space
    const want = new THREE.Matrix4().compose(gripScene.clone().add(new THREE.Vector3(...(h.off || [0, 0, 0])).divideScalar(s)), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(h.rot || [0, 0, 0]))), new THREE.Vector3(1 / s, 1 / s, 1 / s));
    // hand's rest matrix in the scene's space (the body's own transform taken out)
    const handRest = new THREE.Matrix4().copy(body.matrixWorld).invert().multiply(hand.matrixWorld);
    holder.matrix.copy(handRest.invert().multiply(want)); holder.matrix.decompose(holder.position, holder.quaternion, holder.scale);
    holder.add(group); hand.add(holder);
  }

  // ---------- the things people carry, built in code with the painted tiles ----------
  const HELD = {};
  function propMat(tile, rep, col) {
    const t = typeof TILES !== 'undefined' ? TILES.tex(tile, rep) : null;
    return new THREE.MeshLambertMaterial({ map: t, color: col || '#ffffff' });
  }
  const cyl = (r0, r1, h, n) => new THREE.CylinderGeometry(r0, r1, h, n || 10);
  function mesh(geo, mat, p, r, s) { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); return m; }
  // Elder Willow's staff: bark, a gnarled top with a leaf or two
  HELD.willow = { hand: 'hand_L', off: [0, 0, .02], make() {
    const g = new THREE.Group(), bark = propMat('bark', [1, 4]), leaf = propMat('leaves', [1, 1]);
    g.add(mesh(cyl(.022, .028, 1.15, 8), bark, [0, -.32, 0]));
    g.add(mesh(new THREE.TorusGeometry(.05, .02, 6, 10, Math.PI * 1.3), bark, [.03, .3, 0], [0, 0, -.4]));
    g.add(mesh(new THREE.SphereGeometry(.05, 8, 6), leaf, [-.02, .3, .02], null, [1, .5, .8]));
    return { group: g };
  } };
  // Farmer Bramble's pitchfork: a wooden handle, three iron tines
  HELD.bramble = { hand: 'hand_L', off: [0, 0, .02], make() {
    const g = new THREE.Group(), wood = propMat('planks_light', [1, 3]), iron = propMat('iron_rivets', [1, 1]);
    g.add(mesh(cyl(.016, .016, 1.25, 8), wood, [0, -.2, 0]));
    g.add(mesh(new THREE.BoxGeometry(.2, .03, .03), iron, [0, .44, 0]));
    for (const x of [-.09, 0, .09]) g.add(mesh(cyl(.008, .004, .22, 6), iron, [x, .56, 0]));
    return { group: g };
  } };
  // Tinker's bug net: a stick, a hoop and a see-through net
  HELD.tinker = { hand: 'hand_L', off: [0, 0, .02], rot: [.35, 0, 0], make() {
    const g = new THREE.Group(), wood = propMat('planks_light', [1, 2]);
    g.add(mesh(cyl(.012, .012, .8, 8), wood, [0, .15, 0]));
    g.add(mesh(new THREE.TorusGeometry(.11, .008, 6, 20), new THREE.MeshLambertMaterial({ color: '#d8c8a0' }), [0, .66, 0]));
    g.add(mesh(new THREE.ConeGeometry(.11, .22, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#f4f8f0', transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false }), [0, .66, -.1], [-Math.PI / 2, 0, 0]));
    return { group: g };
  } };
  // Rosa's tray with a mug on it, held flat
  HELD.rosa = { hand: 'hand_L', off: [0, .02, .05], make() {
    const g = new THREE.Group(), wood = propMat('wood_polished', [1, 1]);
    g.add(mesh(cyl(.13, .12, .015, 20), wood, [0, 0, .06]));
    g.add(mesh(cyl(.035, .03, .07, 12), new THREE.MeshLambertMaterial({ color: '#f4ecdc' }), [.03, .045, .07]));
    g.add(mesh(new THREE.TorusGeometry(.022, .007, 6, 10), new THREE.MeshLambertMaterial({ color: '#f4ecdc' }), [.07, .045, .07], [0, 0, 0]));
    g.add(mesh(cyl(.03, .03, .005, 12), new THREE.MeshLambertMaterial({ color: '#8a4a22' }), [.03, .078, .07]));
    return { group: g };
  } };
  // Fern's basket: woven, a handle over the top, herbs peeking out
  HELD.fern = { hand: 'hand_L', off: [0, -.02, 0], make() {
    const g = new THREE.Group(), weave = propMat('doormat', [2, 1]), leaf = propMat('leaves_flowers', [1, 1]);
    g.add(mesh(cyl(.1, .075, .1, 14), weave, [0, -.16, 0]));
    g.add(mesh(new THREE.TorusGeometry(.085, .01, 6, 14, Math.PI), weave, [0, -.11, 0]));
    g.add(mesh(new THREE.SphereGeometry(.08, 10, 6), leaf, [0, -.11, 0], null, [1, .45, 1]));
    return { group: g };
  } };
  // Pip's three cubes, stacked on a hand (purple lid, blue base, as the capture cube)
  HELD.pip = { hand: 'hand_L', off: [0, .05, .04], make() {
    const g = new THREE.Group();
    [[-.046, 0, 0], [.046, 0, 0], [0, .088, 0]].forEach(([x, y, z], i) => { const c = makeCube(); c.root.scale.setScalar(.3); c.root.position.set(x, y, z); c.root.rotation.y = (i - 1) * .35; g.add(c.root); });
    return { group: g };
  } };

  return { load, has, creatureBody, person, entry, stats: () => stats, LOOK, CLIPS, HELD, store };
})();
