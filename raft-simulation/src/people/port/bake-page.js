// Runs in headless Chromium (bake.js): builds a person with the reference kit and hands back everything the shipped body needs.
// It is copied next to the reference build (./ref) before it is bundled.
import * as THREE from 'three';
import { MeshoptSimplifier } from './ref/kit/meshopt_simplifier.js';
import { MF_PERSON } from './ref/kit/person-kit.js';
import { JESTER_TEX } from './ref/kit/tex.js';
import farm from './ref/folk/farm-lad.js';
import pie from './ref/folk/pie-seller.js';
import man from '__REFIT__/castaway-man.js';
import woman from '__REFIT__/castaway-woman.js';
const FOLK = { 'farm-lad': farm, 'pie-seller': pie };
const REFIT = { [man.id]: man, [woman.id]: woman };
// A refitted castaway in one painted outfit: the new shapes, the proportions, weights and (unless a new one is given) the
// face of the Moon Faire person they were, and the painted sheet with how it sits on the guide (tools/skin_fit.py).
window.__register = (code, o) => {
  const N = REFIT[o.shape], B = FOLK[N.base];
  FOLK[code] = { name: o.name, who: o.who, person: N.person, scale: B.scale, weights: N.weights || B.weights, tex: { body: o.body, face: o.face || B.tex.face },
    fit: o.fit, faceFit: o.faceFit || B.faceFit, skinColour: o.skin || B.skinColour, SKIN: Object.assign({ skin: o.skin || B.skinColour }, o.SKIN || {}) };
};
const load = (url) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; });
async function webp(src, w, h, q) { const im = typeof src === 'string' ? await load(src) : src; const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); return c.toDataURL('image/webp', q); }
window.__ref = { THREE, MF_PERSON, MeshoptSimplifier, FOLK };
window.__bake = async (id, weight) => {
  await MeshoptSimplifier.ready;
  const D = FOLK[id], W = D.weights[weight || 'quarter'];
  const person = Object.assign(D.person(), D.scale || {}, { weight: W.weight });
  const prepared = await MF_PERSON.prepare(person, { body: D.tex.body, face: D.tex.face, fit: D.fit, faceFit: D.faceFit, skin: D.skinColour, SKIN: D.SKIN });
  const J = MF_PERSON.make(person, prepared);
  await Promise.all(J.loading);
  const SK = J.debug.SK, meshes = [];
  for (const key in J.debug.meshes) {
    const m = J.debug.meshes[key], g = m.geometry, attrs = {};
    for (const n in g.attributes) attrs[n] = { itemSize: g.attributes[n].itemSize, array: Array.from(g.attributes[n].array) };
    meshes.push({ key, bake: m.material.userData.bake || null, attrs, index: Array.from(g.index.array), side: m.material.side, visible: m.visible });
  }
  return {
    id, name: D.name, who: D.who, errors: J.personErrors,
    scale: J.root.scale.toArray(), headScale: SK.head.scale.toArray(), spineScale: SK.spine1.scale.x,
    bones: J.bones.map((b) => b.name), skin: prepared.hexSkin, jaw: prepared.jaw, seam: prepared.S.seam == null ? 0.2 : prepared.S.seam,
    front: prepared.front.toArray(), back: prepared.back.toArray(), meshes,
    tex: {
      body: D.tex.body,
      face: await webp(prepared.faceCanvas, 512, 512, 0.86),
      hands: await webp(prepared.textures.hands, 512, 512, 0.86),
      faceSide: await webp(prepared.textures.faceSide, 210, 270, 0.9),
      faceSideA: await webp(JESTER_TEX.faceSideA, 210, 270, 0.9),
    },
  };
};
