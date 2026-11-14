// Runs in headless Chromium (compare.js): the shipped rig against the reference kit, bone for bone, over 900 frames.
// It is copied next to the reference build (./ref) before it is bundled; RAFT_PEOPLE is replaced by the path of src/people.
import * as THREE from 'three';
import { MeshoptSimplifier } from './ref/kit/meshopt_simplifier.js';
import { MF_PERSON } from './ref/kit/person-kit.js';
import refFarm from './ref/folk/farm-lad.js';
import refPie from './ref/folk/pie-seller.js';
import { buildBody } from 'RAFT_PEOPLE/body.js';
import farm from 'RAFT_PEOPLE/folk/farm-lad.js';
import pie from 'RAFT_PEOPLE/folk/pie-seller.js';
const REF = { 'farm-lad': refFarm, 'pie-seller': refPie }, NEW = { 'farm-lad': farm, 'pie-seller': pie };
window.__compare = async (id) => {
  await MeshoptSimplifier.ready;
  const D = REF[id], person = Object.assign(D.person(), D.scale || {}, { weight: D.weights.quarter.weight });
  const prepared = await MF_PERSON.prepare(person, { body: D.tex.body, face: D.tex.face, fit: D.fit, faceFit: D.faceFit, skin: D.skinColour, SKIN: D.SKIN });
  const hook = (B, t) => { B.hR[1] += 0.1 * Math.sin(t * 3); B.hipR[1] += 0.2 * Math.sin(t); B.ftL[2] *= 1.1; };
  const A = MF_PERSON.make(person, prepared, { onBase: hook }); await Promise.all(A.loading);
  const body = await buildBody(NEW[id], { onBase: hook }), B = body.rig;
  const keys = (FP) => [{ t: 0.3, hR: [-0.36, 1.5, 0.12], eR: [-1, -0.5, -0.2], fR: FP.open, twR: -0.5, wrR: [-0.15, 0.35], hd: [-0.1, -0.04, -0.08], sp: [-0.05, 0.2, -0.03], mouth: 2 },
    { t: 0.7, hL: [0.2, 1.2, 0.4], eL: [0.6, -0.6, -0.5], fL: FP.fist, twL: 0.8, hip: [0.02, -0.05, 0.01], ftR: [0, 0.1, 0.2, 0.1, 0.3] }, { t: 1.2, eyes: 1 }];
  A.defAction('probe', 1.6, keys(A.FP), { outro: 0.4 }); B.defAction('probe', 1.6, keys(B.FP), { outro: 0.4 });
  const sa = new THREE.Scene(), sb = new THREE.Scene(); sa.add(A.root); sb.add(B.root);
  A.root.position.set(1, 0.2, -2); B.root.position.set(1, 0.2, -2); A.root.rotation.y = B.root.rotation.y = 0.7;
  sa.updateMatrixWorld(true); sb.updateMatrixWorld(true);
  let worst = 0, where = '', phase = 0, t = 0; const dt = 1 / 60;
  const scaleOk = A.root.scale.distanceTo(B.root.scale) < 1e-9 && A.debug.SK.head.scale.distanceTo(B.SK.head.scale) < 1e-9;
  for (let i = 0; i < 900; i++) {
    const wb = i < 100 ? 0 : i < 500 ? Math.min(1, (i - 100) / 30) : Math.max(0, 1 - (i - 500) / 30), rb = i > 250 && i < 450 ? Math.min(1, (i - 250) / 40) : 0;
    if (wb > 0) phase += dt * (7 + 3 * rb); t += dt;
    if (i === 40 || i === 300 || i === 640) { A.play('probe', true); B.play('probe', true); }
    A.animate(phase, wb, t, dt, rb); B.animate(phase, wb, t, dt, rb);
    sa.updateMatrixWorld(true); sb.updateMatrixWorld(true);
    for (const b of B.bones) {
      const a = A.debug.SK[b.name], ea = a.matrixWorld.elements, eb = b.matrixWorld.elements;
      for (let k = 0; k < 16; k++) { const d = Math.abs(ea[k] - eb[k]); if (d > worst) { worst = d; where = `${b.name} frame ${i}`; } }
    }
  }
  // the baked points against the kit's own
  const ref = {}; for (const k in A.debug.meshes) ref[k] = A.debug.meshes[k];
  const geo = {}; for (const m of body.meshes) geo[m.name] = m.geometry.attributes.position.count;
  let dp = 0; for (const k of ['face', 'hand']) { const p = ref[k].geometry.attributes.position.array, q = body.meshes.find((m) => m.name === k).geometry.attributes.position.array; for (let i = 0; i < p.length; i++) dp = Math.max(dp, Math.abs(p[i] - q[i])); }
  return { id, bones: B.bones.length, refBones: A.bones.length, scaleOk, worstBoneMatrixDifference: worst, where, facePointError: dp, points: geo, refTriangles: A.triangles };
};
