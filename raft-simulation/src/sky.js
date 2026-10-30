import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rand } from './util.js';

export const SKY = {
  top: new THREE.Color(0x3d8fd1),
  horizon: new THREE.Color(0xc4e3ec),
  below: new THREE.Color(0x0a3346),
  sunDir: new THREE.Vector3(0.45, 0.55, -0.7).normalize(),
};

export function createSky(scene) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: SKY.top },
      uHorizon: { value: SKY.horizon },
      uBelow: { value: SKY.below },
      uSun: { value: SKY.sunDir },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w; // pin to far plane
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHorizon, uBelow, uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = h > 0.0
          ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
          : mix(uHorizon, uBelow, pow(clamp(-h * 4.0, 0.0, 1.0), 0.5));
        float s = max(dot(d, normalize(uSun)), 0.0);
        col += vec3(1.0, 0.92, 0.75) * (pow(s, 900.0) * 1.6 + pow(s, 24.0) * 0.18);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  // Low-poly cumulus: a few lumpy icosphere clusters far out.
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0x9fb8c8,
    emissiveIntensity: 0.45,
    flatShading: true,
    fog: false,
  });
  const clouds = new THREE.Group();
  for (let c = 0; c < 14; c++) {
    const parts = [];
    const n = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const g = new THREE.IcosahedronGeometry(rand(10, 20), 1);
      g.scale(1, 0.62, 1);
      g.translate(i * rand(10, 16) - n * 6, rand(-2, 4), rand(-6, 6));
      parts.push(g);
    }
    const mesh = new THREE.Mesh(mergeGeometries(parts), cloudMat);
    const a = rand(0, Math.PI * 2);
    const r = rand(380, 620);
    mesh.position.set(Math.cos(a) * r, rand(70, 140), Math.sin(a) * r);
    mesh.rotation.y = rand(0, Math.PI);
    clouds.add(mesh);
  }
  scene.add(clouds);

  return {
    update(dt, camPos) {
      sky.position.copy(camPos);
      clouds.position.x = camPos.x;
      clouds.position.z = camPos.z;
      clouds.rotation.y += dt * 0.0025;
    },
  };
}
