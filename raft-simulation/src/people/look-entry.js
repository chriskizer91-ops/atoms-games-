// Test page for the castaway (tools/person-look.js bundles and drives it): the
// game's renderer settings, sky and lights, a neutral floor, and named poses.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createSky, SKY } from '../sky.js';
import { createCastaway } from './castaway.js';

(async () => {
  const canvas = document.getElementById('c');
  const W = canvas.width, H = canvas.height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 1500);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x1d4a5a, 0.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.position.copy(SKY.sunDir).multiplyScalar(45);
  scene.add(sun, sun.target);
  const sky = createSky(scene, renderer);
  sky.update(0, camera.position);
  sky.capture(0);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a8782, roughness: 0.9 }));
  floor.receiveShadow = true;
  scene.add(floor);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a6f8f, roughness: 0.25, transparent: true, opacity: 0.72 }));
  water.visible = false; water.receiveShadow = true;
  scene.add(water);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());

  const id = new URLSearchParams(location.search).get('id') || 'castaway-man-A';
  const me = await createCastaway({ id });
  scene.add(me.root);
  // face the sun's side, so the front is lit
  const FACE = Math.atan2(SKY.sunDir.x, SKY.sunDir.z) + 0.55;
  me.root.rotation.y = FACE;

  // a plain stick with its grip along +Y through the origin, like the game's spear
  const stick = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.81, 8), new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.7 }));
  shaft.position.y = 0.455; shaft.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x77797a, roughness: 0.8 }));
  tip.position.y = 1.46; tip.castShadow = true;
  stick.add(shaft, tip);
  // a hammer the same way
  const hammer = new THREE.Group();
  const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.43, 8), shaft.material); hs.position.y = 0.095;
  const hh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.07, 0.19), tip.material); hh.position.set(0, 0.29, -0.015);
  hammer.add(hs, hh); hammer.traverse((m) => { m.castShadow = true; });

  let state = { speed: 0 };
  const step = (sec, s) => { if (s) state = s; const n = Math.max(1, Math.round(sec * 60)); for (let i = 0; i < n; i++) me.update(1 / 60, state); };
  // the camera goes round the person: angle 0 is in front of them
  const view = (angle, dist = 3.4, y = 0.95, lookY = 0.9, fov = 40) => {
    const a = me.root.rotation.y + angle;
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(me.root.position.x + Math.sin(a) * dist, y, me.root.position.z + Math.cos(a) * dist);
    camera.lookAt(me.root.position.x, lookY, me.root.position.z);
  };
  // close on the right hand, from the person's right and a little ahead
  const P = new THREE.Vector3();
  const viewHand = (angle = -1.2, dist = 0.6, up = 0.12) => {
    me.root.updateMatrixWorld(true); me.handR.getWorldPosition(P);
    const a = me.root.rotation.y + angle;
    camera.fov = 30; camera.updateProjectionMatrix();
    camera.position.set(P.x + Math.sin(a) * dist, P.y + up, P.z + Math.cos(a) * dist); camera.lookAt(P);
  };
  const draw = () => { sky.update(0, camera.position); composer.render(); };
  const reset = () => {
    me.stop(); me.root.position.set(0, 0, 0); me.root.rotation.set(0, FACE, 0); water.visible = false;
    stick.removeFromParent(); hammer.removeFromParent();
    step(1.2, { speed: 0 });
  };
  // in the water: the root sunk until the shoulders are awash, a plane at the waterline
  const wet = () => { water.visible = true; me.root.position.y = -me.shoulderHeight; };
  const under = () => { water.visible = false; floor.visible = false; };      // the same, seen whole from the side
  const land = (name, hold) => () => { step(0.4, { speed: 0, hold }); me.play(name); };

  const SHOTS = {
    'stand-front': () => view(0),
    'stand-three-quarter': () => view(0.7),
    'stand-back': () => view(Math.PI),
    'stand-side': () => view(-Math.PI / 2),
    'face': () => view(0.25, 1.0, me.eyeHeight, me.eyeHeight - 0.03, 30),
    'walk': () => { step(1.37, { speed: 0.9, run: 0 }); view(-1.1); },
    'walk-2': () => { step(1.75, { speed: 0.9, run: 0 }); view(0.6); },
    'run': () => { step(1.31, { speed: 3.6, run: 1 }); view(-1.1); },
    'run-2': () => { step(1.52, { speed: 5.4 }); view(0.6); },
    'swim': () => { wet(); step(2.0, { speed: 2.3, swim: 1, moving: 1 }); view(-1.25, 3.6, 0.9, -0.15); },
    'swim-behind': () => { wet(); step(2.3, { speed: 2.3, swim: 1, moving: 1 }); view(Math.PI - 0.35, 3.4, 1.3, -0.1); },
    ...Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => [`swim-under-${i}`, () => { wet(); step(2.0 + i * 0.21, { speed: 2.3, swim: 1, moving: 1 }); under(); view(-Math.PI / 2, 3.6, -0.35, -0.4); }])),
    'tread': () => { wet(); step(2.0, { speed: 0, swim: 1, moving: 0 }); view(0.6, 3.2, 1.0, -0.2); },
    'tread-under': () => { wet(); step(2.3, { speed: 0, swim: 1, moving: 0 }); under(); view(0.6, 3.6, -0.5, -0.6); },
    'tread-under-2': () => { wet(); step(2.9, { speed: 0, swim: 1, moving: 0 }); under(); view(-1.3, 3.6, -0.5, -0.6); },
    'hold-spear': () => { me.handR.add(stick); step(0.8, { speed: 0, hold: 'spear' }); view(-0.9, 3.4, 1.1, 1.0); },
    'hold-spear-fist': () => { me.handR.add(stick); step(0.8, { speed: 0, hold: 'spear' }); viewHand(-1.3); },
    'hold-spear-fist-2': () => { me.handR.add(stick); step(0.8, { speed: 0, hold: 'spear' }); viewHand(0.6, 0.6, 0.3); },
    'hold-hammer-fist': () => { me.handR.add(hammer); step(0.8, { speed: 0, hold: 'hammer' }); viewHand(-2.4, 0.6, 0.2); },
    'hold-spear-walk': () => { me.handR.add(stick); step(1.5, { speed: 3.6, run: 1, hold: 'spear' }); view(-0.9, 3.4, 1.1, 1.0); },
    'hold-hammer': () => { me.handR.add(hammer); step(0.8, { speed: 0, hold: 'hammer' }); view(-0.7, 2.6, 1.2, 1.0); },
    'hold-food': () => { step(0.8, { speed: 0, hold: 'food' }); view(-0.5, 2.6, 1.2, 1.0); },
    'steer': () => { step(0.8, { speed: 0, steer: 1 }); view(-0.8, 3.0, 1.2, 1.0); },
    'steer-left-grip': () => { me.handL.add(hammer); step(0.8, { speed: 0, steer: 1 }); view(0.9, 2.6, 1.2, 1.0); },
    'stab': () => { me.handR.add(stick); land('stab', 'spear')(); step(0.21); view(-1.2, 3.6, 1.1, 1.0); },
    'swing-up': () => { me.handR.add(hammer); land('swing', 'hammer')(); step(0.14); view(-1.2, 3.2, 1.2, 1.1); },
    'swing-up-2': () => { me.handR.add(hammer); land('swing', 'hammer')(); step(0.14); view(0.5, 3.2, 1.2, 1.1); },
    'swing': () => { me.handR.add(hammer); land('swing', 'hammer')(); step(0.26); view(-1.2, 3.2, 1.2, 1.1); },
    'throw-back': () => { land('throw', 'hook')(); step(0.12); view(-1.2, 3.2, 1.2, 1.1); },
    'throw': () => { land('throw', 'hook')(); step(0.24); view(-1.2, 3.2, 1.2, 1.1); },
    'eat': () => { land('eat', 'food')(); step(0.45); view(-0.5, 2.4, 1.3, 1.2); },
    'wave': () => { land('wave')(); step(0.8); view(0.2, 3.2, 1.1, 1.0); },
  };

  window.__look = {
    me, THREE, scene, camera, renderer, names: Object.keys(SHOTS),
    info: { id: me.id, height: me.height, eyeHeight: me.eyeHeight, shoulderHeight: me.shoulderHeight, triangles: me.triangles, drawCalls: me.drawCalls, buildMs: me.buildMs },
    shot(name) { floor.visible = true; reset(); SHOTS[name](); return this.redraw(); },
    redraw() { renderer.info.autoReset = false; renderer.info.reset(); draw(); return renderer.info.render.calls; },
    sun, hemi, sky, SKY,
    // time a second build and count what a frame costs
    async bench() {
      const t = performance.now(); const b = await createCastaway({ id }); const ms = performance.now() - t; b.dispose();
      const t1 = performance.now(); for (let i = 0; i < 600; i++) me.update(1 / 60, { speed: 2, run: 0.5 }); const upd = (performance.now() - t1) / 600;
      return { secondBuildMs: ms, updateMs: upd };
    },
    unknown: me.play('nonsense'),
  };
})().catch((e) => { console.error(e && e.stack || e); window.__look = { failed: String(e) }; });
