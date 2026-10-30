import * as THREE from 'three';
import { rand } from './util.js';

// One instanced mesh for every little chunk: spray, splinters, blood in the water.
const MAX = 400;

export function createFx(scene) {
  const geo = new THREE.TetrahedronGeometry(0.06, 0);
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, material, MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  scene.add(mesh);

  const parts = [];
  for (let i = 0; i < MAX; i++) {
    parts.push({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1, rot: new THREE.Euler(), spin: 0, drag: 0, grav: 9.8 });
    mesh.setColorAt(i, new THREE.Color(0xffffff));
  }
  let cursor = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const color = new THREE.Color();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < MAX; i++) mesh.setMatrixAt(i, zero);

  function emit(pos, opts) {
    const n = opts.count || 10;
    for (let k = 0; k < n; k++) {
      const pt = parts[cursor];
      const idx = cursor;
      cursor = (cursor + 1) % MAX;
      pt.life = pt.max = rand(opts.life?.[0] ?? 0.5, opts.life?.[1] ?? 1.0);
      pt.p.copy(pos);
      if (opts.spread) {
        pt.p.x += rand(-opts.spread, opts.spread);
        pt.p.z += rand(-opts.spread, opts.spread);
      }
      const sp = opts.speed ?? 3;
      const dir = opts.dir || { x: 0, y: 1, z: 0 };
      pt.v.set(
        dir.x * sp + rand(-1, 1) * sp * (opts.jitter ?? 0.5),
        dir.y * sp + rand(0.2, 1) * sp * (opts.up ?? 0.6),
        dir.z * sp + rand(-1, 1) * sp * (opts.jitter ?? 0.5)
      );
      pt.s = rand(opts.size?.[0] ?? 0.6, opts.size?.[1] ?? 1.4);
      pt.rot.set(rand(0, 6), rand(0, 6), rand(0, 6));
      pt.spin = rand(-8, 8);
      pt.drag = opts.drag ?? 0.6;
      pt.grav = opts.gravity ?? 9.8;
      color.set(Array.isArray(opts.color) ? opts.color[k % opts.color.length] : opts.color ?? 0xffffff);
      mesh.setColorAt(idx, color);
    }
    mesh.instanceColor.needsUpdate = true;
  }

  return {
    splash(pos, scale = 1) {
      emit(pos, { count: Math.round(14 * scale), color: [0xeaf8fb, 0xbfe6ee, 0x9fd6e2], speed: 2.6 * scale, up: 0.9, jitter: 0.6, life: [0.4, 0.9], size: [0.7, 1.5] });
    },
    splinters(pos) {
      emit(pos, { count: 10, color: [0x9c7146, 0x6b4a2c, 0xb48a5a], speed: 2.2, up: 0.9, jitter: 0.8, life: [0.5, 1.0], size: [0.8, 1.6] });
    },
    blood(pos) {
      emit(pos, { count: 16, color: [0x8e2a24, 0x6f1f1a, 0xa1352b], speed: 0.8, up: 0.25, jitter: 0.9, spread: 0.25, gravity: 0.6, drag: 3, life: [0.8, 1.6], size: [0.5, 1.1] });
    },
    dust(pos) {
      emit(pos, { count: 6, color: [0xd8c39a, 0xbfa67a], speed: 1.2, up: 0.8, jitter: 0.9, gravity: 3, life: [0.3, 0.6], size: [0.5, 1] });
    },
    update(dt) {
      for (let i = 0; i < MAX; i++) {
        const pt = parts[i];
        if (pt.life <= 0) continue;
        pt.life -= dt;
        if (pt.life <= 0) {
          mesh.setMatrixAt(i, zero);
          continue;
        }
        pt.v.y -= pt.grav * dt;
        pt.v.multiplyScalar(Math.max(0, 1 - pt.drag * dt));
        pt.p.addScaledVector(pt.v, dt);
        pt.rot.x += pt.spin * dt;
        pt.rot.y += pt.spin * dt * 0.7;
        const k = Math.min(1, pt.life / (pt.max * 0.5));
        sc.setScalar(pt.s * k);
        q.setFromEuler(pt.rot);
        m4.compose(pt.p, q, sc);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
