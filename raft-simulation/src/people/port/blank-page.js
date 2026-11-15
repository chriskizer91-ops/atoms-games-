// Runs in headless Chromium (blank.js): builds a refitted person with the reference kit and draws
//  - the painting guide: plain greys, flat light, from the front (left half) and from behind (right half), 1536 x 1024.
//    Each half is 1.5 m wide (x -0.75 to 0.75) and 2 m tall (y -0.1 to 1.9): the frame Moon Faire's skins are laid on by;
//  - a coloured look from a few sides, standing and mid-stride, to check the shapes.
// It is copied next to the reference build (./ref) before it is bundled.
import * as THREE from 'three';
import { MeshoptSimplifier } from './ref/kit/meshopt_simplifier.js';
import { MF_PERSON } from './ref/kit/person-kit.js';
import farm from './ref/folk/farm-lad.js';
import pie from './ref/folk/pie-seller.js';
import man from '__REFIT__/castaway-man.js';
import woman from '__REFIT__/castaway-woman.js';
const FOLK = { 'farm-lad': farm, 'pie-seller': pie };
const NEW = { [man.id]: man, [woman.id]: woman };
const WORD = { wine: 'sleeve', cloth: 'forearm', leggings: 'legs', boot: 'boots', sole: 'soles' };
const GREY = { torso: 0x9c9c9c, wine: 0x929292, cloth: 0xa6a6a6, leggings: 0x858585, boot: 0x666666, sole: 0x5a5a5a, face: 0xd6d6d6, hand: 0xd6d6d6 };
const OWN = [0xbcbcbc, 0x8a8a8a, 0xcacaca, 0x787878, 0xacacac, 0x989898, 0xd0d0d0];

window.__blank = async (id, opts = {}) => {
  await MeshoptSimplifier.ready;
  const N = NEW[id], D = FOLK[N.base];
  const person = Object.assign(N.person(), D.scale || {}, N.scale || {});
  const spec = N.person();        // an untouched copy, for the colours of the check pictures
  // any skin will do to get the shapes built: the paint is replaced below
  const prepared = await MF_PERSON.prepare(person, { body: D.tex.body, face: D.tex.face, fit: D.fit, faceFit: D.faceFit, skin: D.skinColour, SKIN: {} });
  const J = MF_PERSON.make(person, prepared);
  await Promise.all(J.loading);
  const canvas = document.createElement('canvas');
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.add(J.root);
  if (J.fx) J.fx.visible = false;
  const meshes = [];
  J.root.traverse((m) => { if (m.isSkinnedMesh) meshes.push(m); });
  const partOf = (m) => (m.material.userData.bake && m.material.userData.bake.part) || m.name;
  const parts = meshes.map((m) => ({ name: m.name, part: partOf(m), tris: m.geometry.index ? m.geometry.index.count / 3 : 0 }));
  const hex = (v) => (v && typeof v === 'object' ? v.color : v);
  const colourOf = (m) => {
    const p = partOf(m), w = WORD[m.name] || p;
    let c = hex((spec.parts || {})[p]) || hex((spec.parts || {})[p.replace(/^p_/, '')]) || hex((spec.colors || {})[w]);
    if (!c || c === 'skin' || m.name === 'face' || m.name === 'hand') c = D.skinColour;
    if (opts.debug) console.warn(m.name, p, w, c);
    return c;
  };

  // ---- the painting guide ----
  J.skeleton.pose();
  const keep = J.root.scale.clone();
  J.root.scale.set(1, 1, 1);
  J.root.updateMatrixWorld(true);
  const amb = new THREE.AmbientLight(0xffffff, 0.74 * Math.PI), sun = new THREE.DirectionalLight(0xffffff, 0.42 * Math.PI);
  scene.add(amb, sun, sun.target);
  let i = 0;
  const painted = meshes.map((m) => m.material);
  for (const m of meshes) m.material = new THREE.MeshLambertMaterial({ color: GREY[m.name] || OWN[i++ % OWN.length], side: THREE.DoubleSide });
  R.setSize(768, 1024, false);
  R.setClearColor(0x6e6e6e, 1);
  const guide = [];
  for (const z of [5, -5]) {
    const cam = new THREE.OrthographicCamera(-0.75, 0.75, 1.9, -0.1, 0.1, 20);
    cam.position.set(0, 0, z); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
    sun.position.set(z > 0 ? 0.6 : -0.6, 1.2, z); sun.target.position.set(0, 0.9, 0); sun.target.updateMatrixWorld();
    R.clear(); R.render(scene, cam); guide.push(canvas.toDataURL('image/png'));
  }

  // ---- a colour key for each outfit: the guide again, each part in the base colour it is to be painted ----
  const keys = {};
  for (const o of opts.outfits || []) {
    for (const m of meshes) {
      const nm = m.name.replace(/^p_/, ''), w = WORD[m.name] || nm;
      let c = o.colors[nm] || o.colors[w];
      if (!c || c === 'skin') c = o.skin || D.skinColour;
      m.material = new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
    }
    keys[o.code] = [];
    for (const z of [5, -5]) {
      const cam = new THREE.OrthographicCamera(-0.75, 0.75, 1.9, -0.1, 0.1, 20);
      cam.position.set(0, 0, z); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
      sun.position.set(z > 0 ? 0.6 : -0.6, 1.2, z); sun.target.position.set(0, 0.9, 0); sun.target.updateMatrixWorld();
      R.clear(); R.render(scene, cam); keys[o.code].push(canvas.toDataURL('image/png'));
    }
  }

  // ---- the coloured look ----
  J.root.scale.copy(keep);
  meshes.forEach((m) => { m.material = new THREE.MeshStandardMaterial({ color: colourOf(m), roughness: 0.85, side: THREE.DoubleSide }); });
  amb.intensity = 1.6; sun.intensity = 2.6;
  R.setSize(520, 760, false);
  R.setClearColor(0x8fa3b0, 1);
  const look = [];
  const shot = (yaw, walk) => {
    if (walk) J.animate(walk, 1, 1, 0.016, opts.run ? 1 : 0); else { J.animate(0, 0, 0, 0, 0); }
    J.root.updateMatrixWorld(true);
    const cam = new THREE.PerspectiveCamera(22, 520 / 760, 0.1, 50);
    cam.position.set(Math.sin(yaw) * 5.2, 1.0, Math.cos(yaw) * 5.2); cam.lookAt(0, 0.88, 0);
    sun.position.set(2, 4, 3); sun.target.position.set(0, 0.9, 0); sun.target.updateMatrixWorld();
    R.clear(); R.render(scene, cam); look.push(canvas.toDataURL('image/jpeg', 0.9));
  };
  shot(0, 0); shot(0.75, 0); shot(Math.PI / 2, 0); shot(Math.PI, 0); shot(0.6, 1.6); shot(Math.PI / 2, 3.9);
  meshes.forEach((m, k) => { m.material = painted[k]; });
  return { id, errors: J.personErrors, parts, guide, keys, look, height: keep.y * 1.65, skin: D.skinColour };
};
