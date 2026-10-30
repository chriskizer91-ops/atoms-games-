import * as THREE from 'three';

// Low afternoon sun: long shadows and a glitter path on the water.
export const SKY = {
  sunDir: new THREE.Vector3(0.62, 0.45, -0.64).normalize(),
  sunColor: new THREE.Color(1.0, 0.86, 0.68),
  zenith: new THREE.Color(0x2f73c4),
  horizon: new THREE.Color(0xbcd6e2),
  ground: new THREE.Color(0x0d3a4c),
};

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always on the far plane
  }`;

const FRAG = /* glsl */ `
  uniform vec3 uSunDir, uSunColor, uZenith, uHorizon, uGround;
  uniform float uTime, uSunDisc;
  varying vec3 vDir;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float sd = max(dot(d, uSunDir), 0.0);

    float t = pow(1.0 - clamp(h, 0.0, 1.0), 4.5);
    vec3 col = mix(uZenith, uHorizon, t);
    col += uSunColor * (pow(sd, 5.0) * 0.22 * (0.35 + t) + pow(sd, 90.0) * 0.5 + pow(sd, 900.0) * 1.8);

    if (h < 0.0) col = mix(uHorizon, uGround, clamp(-h * 5.0, 0.0, 1.0));

    // Cumulus on a flat layer overhead: perspective squashes them toward the horizon.
    if (h > 0.0) {
      vec2 uv = d.xz / (h + 0.06) * 0.9 + vec2(uTime * 0.006, uTime * 0.002);
      float n = fbm(uv);
      float cover = smoothstep(0.5, 0.74, n);
      float towardSun = fbm(uv + uSunDir.xz * 0.12);
      float lit = clamp(0.62 + (n - towardSun) * 4.0, 0.22, 1.2);
      vec3 shadowCol = mix(uHorizon, uZenith, 0.35) * 0.82;
      vec3 cloud = mix(shadowCol, vec3(1.06, 1.03, 0.98), lit);
      cloud += uSunColor * pow(sd, 10.0) * 0.8 * (1.0 - cover * 0.6); // silver lining
      float fade = smoothstep(0.0, 0.2, h);
      cloud = mix(uHorizon, cloud, smoothstep(0.0, 0.35, h));
      col = mix(col, cloud, cover * fade * 0.96);
    }

    col += uSunColor * smoothstep(0.99962, 0.99982, sd) * 28.0 * uSunDisc;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function skyMaterial(sunDisc) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSunDir: { value: SKY.sunDir },
      uSunColor: { value: SKY.sunColor },
      uZenith: { value: SKY.zenith },
      uHorizon: { value: SKY.horizon },
      uGround: { value: SKY.ground },
      uTime: { value: 0 },
      uSunDisc: { value: sunDisc },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
}

export function createSky(scene, renderer) {
  const geo = new THREE.SphereGeometry(900, 48, 24);
  const mat = skyMaterial(1);
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  // A sharp sky cube for water reflections and a prefiltered copy (no sun
  // disc; the real sun light handles highlights) for every other material.
  const skyScene = new THREE.Scene();
  const envMat = skyMaterial(0);
  skyScene.add(new THREE.Mesh(geo, envMat));
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cubeCam = new THREE.CubeCamera(1, 1000, cubeRT);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;

  function capture(time) {
    envMat.uniforms.uTime.value = time;
    cubeCam.update(renderer, skyScene);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromCubemap(cubeRT.texture);
    scene.environment = envRT.texture;
    return envRT.texture;
  }

  return {
    mesh: sky,
    reflection: cubeRT.texture,
    capture,
    get environment() { return envRT?.texture; },
    update(time, camPos) {
      mat.uniforms.uTime.value = time;
      sky.position.copy(camPos);
    },
  };
}
