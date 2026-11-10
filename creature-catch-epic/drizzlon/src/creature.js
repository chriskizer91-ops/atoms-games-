// Loads drizzlon.glb and dresses it in its real materials.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeScaleTexture, makeSkinMaterial, makeMembraneMaterial, makeEyeMaterial, makeWaterMaterial } from './materials.js';

export function makeShared() {
  return {
    uTime: { value: 0 },
    uWet: { value: 0.0 },
    uFlash: { value: 0.0 },
    uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uSunDirView: { value: new THREE.Vector3(0, 1, 0) },
    uSunDir: { value: new THREE.Vector3(-0.55, 0.72, 0.42).normalize() },
    uSunColor: { value: new THREE.Color(1.0, 0.93, 0.78) },
    uSkyTop: { value: new THREE.Color().setRGB(0.10, 0.30, 0.78) },
    uSkyHorizon: { value: new THREE.Color().setRGB(0.62, 0.82, 1.0) },
    uSkyGround: { value: new THREE.Color().setRGB(0.16, 0.30, 0.12) },
    scaleTex: makeScaleTexture(),
  };
}

export async function loadDrizzlon(src, shared) {
  const loader = new GLTFLoader();
  const gltf = await new Promise((res, rej) => {
    if (typeof src === 'string') loader.load(src, res, undefined, rej);
    else loader.parse(src, '', res, rej);
  });
  const root = gltf.scene;
  const meta = root.userData || {};
  const bones = {};
  const meshes = {};
  root.traverse((o) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isSkinnedMesh) meshes[o.name] = o;
  });
  const skin = makeSkinMaterial(shared);
  const memb = makeMembraneMaterial(shared);
  const eyeL = makeEyeMaterial(shared, 1), eyeR = makeEyeMaterial(shared, -1);
  ['L', 'R'].forEach((k, i) => {
    const e = meta.eyes[k];
    skin.userData.uniforms.uEyeSurf.value[i].fromArray(e.surf);
    skin.userData.uniforms.uEyeRight.value[i].fromArray(e.right);
    skin.userData.uniforms.uEyeUp.value[i].fromArray(e.up);
  });
  meshes.body.material = skin;
  meshes.membrane.material = memb;
  meshes.eyeL.material = eyeL;
  meshes.eyeR.material = eyeR;
  for (const m of Object.values(meshes)) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; }
  meshes.eyeL.castShadow = meshes.eyeR.castShadow = false;
  meshes.membrane.receiveShadow = false;

  // The droplet rides on the tail-tip bone as a plain mesh, so it can wobble, swell and let go.
  const dropBone = bones.drop;
  const dropSkinned = meshes.droplet;
  const g = dropSkinned.geometry.clone();
  g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight');
  const rest = new THREE.Vector3();
  restPosition(dropBone, rest);
  g.translate(-rest.x, -rest.y, -rest.z);
  const water = makeWaterMaterial(shared, { wobble: 0.0035, wobbleFreq: 34, glow: 0.22 });
  const droplet = new THREE.Mesh(g, water);
  droplet.castShadow = true;
  droplet.frustumCulled = false;
  dropBone.add(droplet);
  dropSkinned.parent.remove(dropSkinned);
  delete meshes.droplet;

  // rest pose bookkeeping
  const restPos = {}, restLocal = {};
  for (const [n, b] of Object.entries(bones)) {
    restLocal[n] = b.position.clone();
    restPos[n] = restPosition(b, new THREE.Vector3());
  }
  return { root, bones, meshes, meta, droplet, mats: { skin, memb, eyeL, eyeR, water }, restPos, restLocal, shared };
}

function restPosition(bone, out) {
  out.set(0, 0, 0);
  let b = bone;
  while (b && b.isBone) { out.add(b.position); b = b.parent; }
  return out;
}
