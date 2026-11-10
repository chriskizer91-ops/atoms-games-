// Look-dev page: several fixed views of the model in one picture.
import * as THREE from 'three';
import { loadDrizzlon, makeShared } from '../src/creature.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1800), H = +(q.get('h') || 1200);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setScissorTest(true);
const scene = new THREE.Scene();
const shared = makeShared();
const bg = new THREE.Color(q.get('bg') || '#c8c8ca');

// simple sky for reflections
const skyScene = new THREE.Scene();
skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
  uniforms: { top: shared.uSkyTop, hor: shared.uSkyHorizon, gnd: shared.uSkyGround, sun: shared.uSunDir },
  vertexShader: 'varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `varying vec3 d; uniform vec3 top,hor,gnd,sun; void main(){ vec3 n=normalize(d); vec3 c=mix(hor,top,pow(max(n.y,0.),.55)); c=mix(c,gnd,smoothstep(.02,-.25,n.y)); c+=vec3(1.,.9,.7)*pow(max(dot(n,sun),0.),60.)*6.; gl_FragColor=vec4(c,1.); }` })));
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(skyScene, 0.02).texture;
scene.environmentIntensity = 0.9;

const sun = new THREE.DirectionalLight(0xfff0d8, 3.0);
sun.position.copy(shared.uSunDir.value).multiplyScalar(3);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -0.8, right: 0.8, top: 0.9, bottom: -0.3, near: 0.1, far: 8 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.004; sun.shadow.radius = 4;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fc8ff, 0.6); fill.position.set(-2, 1.2, -1.5); scene.add(fill);
const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.35 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const D = await loadDrizzlon('../model/drizzlon.glb?' + Date.now(), shared);
scene.add(D.root);
window.D = D; window.THREE = THREE;

// optional test pose: ?pose={"tail3":[0.5,0,0],...} (radians, XYZ)
const pose = q.get('pose');
if (pose) for (const [n, r] of Object.entries(JSON.parse(pose))) if (D.bones[n]) D.bones[n].rotation.set(r[0], r[1], r[2]);
const eye = q.get('eye');
if (eye) { const e = JSON.parse(eye); for (const m of [D.mats.eyeL, D.mats.eyeR]) for (const [k, v] of Object.entries(e)) { const u = m.userData.uniforms[k]; if (u.value.isVector2) u.value.set(v[0], v[1]); else u.value = v; } }

const VIEWS = {
  front: { pos: [0, 0.40, 2.6], at: [0, 0.37, 0], fov: 22 },
  side: { pos: [-2.6, 0.40, 0], at: [0, 0.37, 0], fov: 22 },
  q34: { pos: [-1.5, 0.75, 2.0], at: [0, 0.36, 0], fov: 22 },
  back34: { pos: [1.6, 0.8, -1.9], at: [0, 0.36, -0.05], fov: 22 },
  top: { pos: [0, 2.8, 0.001], at: [0, 0, 0], fov: 20 },
  face: { pos: [-0.38, 0.56, 1.05], at: [0, 0.50, 0.24], fov: 22 },
  face2: { pos: [0.0, 0.50, 1.2], at: [0, 0.50, 0.24], fov: 20 },
  eye: { pos: [0.25, 0.52, 0.72], at: [0.09, 0.50, 0.28], fov: 14 },
  paw: { pos: [-0.5, 0.25, 0.6], at: [-0.1, 0.05, 0.12], fov: 16 },
  low: { pos: [-1.2, 0.12, 1.6], at: [0, 0.36, 0], fov: 24 },
  belly: { pos: [-0.6, 0.02, 1.5], at: [0, 0.25, 0.0], fov: 20 },
  tail: { pos: [1.0, 0.6, -1.3], at: [0, 0.4, -0.25], fov: 16 },
  wing: { pos: [1.2, 0.9, 0.9], at: [0.2, 0.32, 0], fov: 16 },
};
const names = (q.get('views') || 'front,side,q34,back34,face,top').split(',');
const cols = +(q.get('cols') || 3), rows = Math.ceil(names.length / cols);
const cam = new THREE.PerspectiveCamera(22, 1, 0.05, 50);
const cw = W / cols, ch = H / rows;
names.forEach((n, i) => {
  const v = VIEWS[n];
  cam.fov = v.fov; cam.aspect = cw / ch; cam.position.set(...v.pos); cam.lookAt(...v.at); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  shared.uSunDirView.value.copy(shared.uSunDir.value).transformDirection(cam.matrixWorldInverse);
  const x = (i % cols) * cw, y = H - (Math.floor(i / cols) + 1) * ch;
  renderer.setViewport(x, y, cw, ch); renderer.setScissor(x, y, cw, ch);
  renderer.setClearColor(bg); renderer.clear();
  renderer.render(scene, cam);
});
window.DONE = true;
