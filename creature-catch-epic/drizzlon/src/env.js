// The stage: sky, sun, meadow clearing, grass, rocks.
import * as THREE from 'three';

function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SKY_FRAG = /* glsl */`
  varying vec3 vDir; uniform vec3 uTop, uHor, uGnd, uSun, uSunColor; uniform float uTime, uClouds;
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*n2(p); p = p*2.03 + 7.1; a *= .5; } return s; }
  void main(){
    vec3 d = normalize(vDir);
    vec3 c = mix(uHor, uTop, pow(max(d.y, 0.), .55));
    c = mix(c, uGnd, smoothstep(.02, -.25, d.y));
    float s = max(dot(d, uSun), 0.);
    c += uSunColor * (pow(s, 600.) * 30. + pow(s, 40.) * .55 + pow(s, 6.) * .18);
    if (uClouds > .5 && d.y > .0) {
      vec2 uv = d.xz / (d.y + .18) * 1.3 + vec2(uTime * .006, 0.);
      float cl = smoothstep(.48, .78, fbm(uv)) * smoothstep(.0, .18, d.y);
      float lit = smoothstep(.3, .9, fbm(uv + uSun.xz * .08));
      c = mix(c, mix(vec3(.72,.80,.95), vec3(1.,.98,.94), lit), cl * .85);
    }
    gl_FragColor = vec4(c, 1.);
  }`;

export function makeEnvironment(renderer, scene, shared, opts = {}) {
  const env = { update() {} };
  const sunDir = shared.uSunDir.value;
  // ---- sky
  const skyU = { uTop: shared.uSkyTop, uHor: shared.uSkyHorizon, uGnd: shared.uSkyGround, uSun: shared.uSunDir, uSunColor: shared.uSunColor, uTime: shared.uTime, uClouds: { value: 1 } };
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader: SKY_FRAG });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMat);
  sky.frustumCulled = false; sky.renderOrder = -10;
  scene.add(sky);
  // reflections come from the same sky
  const pm = new THREE.PMREMGenerator(renderer);
  const skyScene = new THREE.Scene();
  const sky2 = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { ...skyU, uClouds: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: SKY_FRAG }));
  skyScene.add(sky2);
  scene.environment = pm.fromScene(skyScene, 0.03).texture;
  scene.environmentIntensity = 0.85;
  scene.fog = new THREE.Fog(new THREE.Color().setRGB(0.55, 0.74, 0.93), 9, 34);

  // ---- lights
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.1);
  sun.position.copy(sunDir).multiplyScalar(6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(opts.shadowSize || 2048, opts.shadowSize || 2048);
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 14 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.006; sun.shadow.radius = 3.5;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0x8fc4ff, 0.55); fill.position.set(-3, 2, -2.5); scene.add(fill);
  env.sun = sun;

  // ---- ground
  const gmat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  env.groundU = { uWetPos: { value: new THREE.Vector4(0, 0, 0, 0) }, uWetPos2: { value: new THREE.Vector4(0, 0, 0, 0) } };
  gmat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, env.groundU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = (modelMatrix * vec4(position, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWp; uniform vec4 uWetPos, uWetPos2; float gWet;
      float gh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(gh(i), gh(i+vec2(1,0)), f.x), mix(gh(i+vec2(0,1)), gh(i+vec2(1,1)), f.x), f.y); }
      float gfbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*gn(p); p=p*2.1+3.7; a*=.5; } return s; }`)
      .replace('#include <color_fragment>', `
        vec2 gp = vWp.xz;
        float n1 = gfbm(gp * 1.3), n2 = gfbm(gp * 7.0 + 11.0), n3 = gn(gp * 60.0);
        float r = length(gp - vec2(0.0, 0.75));
        float arena = 1.0 - smoothstep(1.35 + (n1 - 0.5) * 1.1, 2.3 + (n1 - 0.5) * 1.1, r);     // worn earth where creatures spar
        vec3 grass = mix(vec3(0.060, 0.230, 0.030), vec3(0.200, 0.420, 0.060), n1);
        grass = mix(grass, vec3(0.30, 0.46, 0.09), n2 * 0.35);
        vec3 dirt = mix(vec3(0.270, 0.170, 0.085), vec3(0.420, 0.300, 0.160), n2);
        dirt *= 0.82 + 0.36 * n3;
        vec3 gc = mix(grass * (0.85 + 0.3 * n3), dirt, arena * (0.55 + 0.45 * smoothstep(0.35, 0.65, n2)));
        gWet = max(uWetPos.w * (1.0 - smoothstep(uWetPos.z * 0.55, uWetPos.z, length(gp - uWetPos.xy) + (n2 - 0.5) * 0.25)),
                   uWetPos2.w * (1.0 - smoothstep(uWetPos2.z * 0.55, uWetPos2.z, length(gp - uWetPos2.xy) + (n2 - 0.5) * 0.25)));
        gc *= mix(1.0, 0.50, gWet);
        diffuseColor.rgb *= gc;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(0.95, 0.12, gWet * gWet);');
  };
  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), gmat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  // ---- grass blades (thin out toward the sparring ground)
  const R = rng(11);
  const blade = new THREE.BufferGeometry();
  const bw = 0.008;
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-bw, 0, 0, bw, 0, 0, -bw * 0.7, 0.5, 0, bw * 0.7, 0.5, 0, 0, 1, 0], 3));
  blade.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
  blade.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  const N = opts.grass ?? 22000;
  const gm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide });
  gm.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.uniforms.uPush = env.pushU = { value: new THREE.Vector4(0, 0, 0, 0) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n uniform float uTime; uniform vec4 uPush; varying float vH; varying float vTint;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.);
        float hh = position.y; vH = hh; vTint = fract(ip.x * 12.9898 + ip.z * 78.233);
        float w = sin(uTime * 1.7 + ip.x * 1.3 + ip.z * 0.9) * 0.10 + sin(uTime * 3.1 + ip.x * 3.7) * 0.04;
        transformed.x += w * hh * hh; transformed.z += w * 0.5 * hh * hh;
        // blades right in front of the lens lie down so they never block the view
        transformed.y *= smoothstep(0.7, 2.0, distance(ip.xyz, cameraPosition));
        // shockwaves flatten the grass outward
        vec2 dp = ip.xz - uPush.xy; float dl = length(dp);
        float push = uPush.w * exp(-pow((dl - uPush.z) / 0.5, 2.0));
        transformed.xz += normalize(dp + 1e-4) * push * hh * hh * 2.2 / max(length(vec3(instanceMatrix[1])), 0.1);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n varying float vH; varying float vTint;')
      .replace('#include <color_fragment>', `
        vec3 gcol = mix(vec3(0.030, 0.150, 0.020), mix(vec3(0.240, 0.520, 0.070), vec3(0.420, 0.600, 0.100), vTint), vH);
        diffuseColor.rgb *= gcol;`);
  };
  const grass = new THREE.InstancedMesh(blade, gm, N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  let placed = 0;
  for (let i = 0; i < N * 6 && placed < N; i++) {
    const a = R() * Math.PI * 2, rad = 0.4 + Math.pow(R(), 0.7) * 11;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad + 0.75;
    const rr = Math.hypot(x, z - 0.75);
    const keep = rr < 1.5 ? 0.02 : rr < 2.4 ? (rr - 1.5) / 0.9 * 0.8 : 1;
    if (R() > keep) continue;
    p.set(x, 0, z); e.set((R() - 0.5) * 0.5, R() * Math.PI, (R() - 0.5) * 0.5); q.setFromEuler(e);
    const h = 0.05 + R() * 0.10 + (rr > 4 ? R() * 0.12 : 0);
    s.set(1 + R(), h, 1);
    grass.setMatrixAt(placed++, m4.compose(p, q, s));
  }
  grass.count = placed; grass.receiveShadow = true; grass.frustumCulled = false;
  scene.add(grass);

  // ---- rocks and far hills
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7d8086, roughness: 0.9, flatShading: false });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.IcosahedronGeometry(1, 3);
    const pos = g.attributes.position, sd = R() * 100;
    for (let k = 0; k < pos.count; k++) {
      _v.fromBufferAttribute(pos, k);
      const n = Math.sin(_v.x * 3.1 + sd) * Math.cos(_v.y * 2.7 + sd) * 0.16 + Math.sin(_v.z * 5.3 + sd * 2) * 0.07;
      _v.multiplyScalar(1 + n); _v.y *= 0.62;
      pos.setXYZ(k, _v.x, _v.y, _v.z);
    }
    g.computeVertexNormals();
    const rock = new THREE.Mesh(g, rockMat);
    const a = R() * Math.PI * 2, rad = 2.9 + R() * 3.2, sc = 0.12 + R() * 0.32;
    rock.position.set(Math.cos(a) * rad, sc * 0.2, Math.sin(a) * rad + 0.75); rock.scale.setScalar(sc); rock.rotation.y = R() * 6;
    rock.castShadow = rock.receiveShadow = true; scene.add(rock);
  }
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x3f7a35, roughness: 1 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + R() * 0.3, rad = 22 + R() * 9, w = 6 + R() * 7;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), hillMat);
    hill.position.set(Math.cos(a) * rad, -0.6, Math.sin(a) * rad); hill.scale.set(w, 2.0 + R() * 3.4, w * (0.7 + R() * 0.5));
    scene.add(hill);
  }
  // simple round trees on the hills
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 }), leafM = new THREE.MeshStandardMaterial({ color: 0x2c6b2a, roughness: 1 });
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2, rad = 11 + R() * 9, h = 1.6 + R() * 1.6;
    const t = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, h, 7), trunkM); tr.position.y = h / 2; t.add(tr);
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + R() * 0.4, 1), leafM); l.position.set((R() - 0.5) * 0.7, h + 0.2 + R() * 0.5, (R() - 0.5) * 0.7); l.scale.y = 0.85; t.add(l); }
    t.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad + 0.75); scene.add(t);
  }
  env.sky = sky;
  env.update = (camera) => { sky.position.copy(camera.position); };
  return env;
}
const _v = new THREE.Vector3();
