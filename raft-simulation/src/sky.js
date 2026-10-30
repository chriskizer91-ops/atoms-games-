import * as THREE from 'three';

// Shared sky state. weather.js rewrites these every frame (time of day and
// weather); the sky, the water and the lights all read the same objects.
// sunDir is the direction light comes from: the sun by day, the moon by night.
export const SKY = {
  sunDir: new THREE.Vector3(0.62, 0.45, -0.64).normalize(),
  sunColor: new THREE.Color(1.0, 0.86, 0.68),
  zenith: new THREE.Color(0x2f73c4),
  horizon: new THREE.Color(0xbcd6e2),
  ground: new THREE.Color(0x0d3a4c),
  trueSun: new THREE.Vector3(0.62, 0.45, -0.64).normalize(),
  moonDir: new THREE.Vector3(-0.6, 0.4, 0.6).normalize(),
  night: 0,
  cover: 0,     // extra cloud cover, 0..1
  storm: 0,     // storm darkness, 0..1
  flash: 0,     // lightning, 0..1
};

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always on the far plane
  }`;

const FRAG = /* glsl */ `
  uniform vec3 uSunDir, uSunColor, uZenith, uHorizon, uGround, uMoonDir;
  uniform float uTime, uSunDisc, uNight, uCover, uStorm, uFlash;
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
    float sd = max(dot(d, uSunDir), 0.0); // uSunDir here is the true sun

    float t = pow(1.0 - clamp(h, 0.0, 1.0), 4.5);
    vec3 col = mix(uZenith, uHorizon, t);
    col += uSunColor * (pow(sd, 5.0) * 0.22 * (0.35 + t) + pow(sd, 90.0) * 0.5 + pow(sd, 900.0) * 1.8);

    if (h < 0.0) col = mix(uHorizon, uGround, clamp(-h * 5.0, 0.0, 1.0));

    // Night: stars and the moon, hidden behind cloud.
    float clear = 1.0;
    if (h > 0.0) {
      vec3 c = floor(d * 380.0);
      float st = hash(c.xy + c.z * 17.13);
      float star = step(0.9975, st) * (0.6 + 0.4 * sin(uTime * 3.0 + st * 80.0));
      col += vec3(0.9, 0.95, 1.0) * star * uNight * 2.2 * smoothstep(0.02, 0.2, h);
    }
    float md = max(dot(d, uMoonDir), 0.0);
    col += vec3(0.75, 0.82, 1.0) * (smoothstep(0.99945, 0.99965, md) * 6.0 + pow(md, 60.0) * 0.25) * uNight;

    // Cumulus on a flat layer overhead: perspective squashes them toward the horizon.
    if (h > 0.0) {
      vec2 uv = d.xz / (h + 0.06) * 0.9 + vec2(uTime * 0.006, uTime * 0.002) * (1.0 + uStorm * 3.0);
      float n = fbm(uv);
      float thr = mix(0.5, 0.28, uCover);
      float cover = smoothstep(thr, thr + 0.24, n);
      float towardSun = fbm(uv + uSunDir.xz * 0.12);
      float lit = clamp(0.62 + (n - towardSun) * 4.0, 0.22, 1.2);
      vec3 shadowCol = mix(uHorizon, uZenith, 0.35) * 0.82;
      vec3 top = mix(vec3(1.06, 1.03, 0.98), vec3(0.27, 0.3, 0.34), uStorm);
      top = mix(top, vec3(0.16, 0.2, 0.28), uNight);
      vec3 cloud = mix(shadowCol * (1.0 - uStorm * 0.6), top, lit);
      cloud += uSunColor * pow(sd, 10.0) * 0.8 * (1.0 - cover * 0.6) * (1.0 - uNight); // silver lining
      cloud += vec3(0.7, 0.75, 1.0) * uFlash * 2.5 * lit;
      float fade = smoothstep(0.0, 0.2, h);
      cloud = mix(uHorizon, cloud, smoothstep(0.0, 0.35, h));
      col = mix(col, cloud, cover * fade * 0.96);
      clear = 1.0 - cover * fade;
    }

    col += uSunColor * smoothstep(0.99962, 0.99982, sd) * 28.0 * uSunDisc * clear * (1.0 - uNight);
    col += vec3(0.5, 0.55, 0.7) * uFlash * 0.6;

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
      uSunDir: { value: SKY.trueSun },
      uSunColor: { value: SKY.sunColor },
      uZenith: { value: SKY.zenith },
      uHorizon: { value: SKY.horizon },
      uGround: { value: SKY.ground },
      uTime: { value: 0 },
      uSunDisc: { value: sunDisc },
      uMoonDir: { value: SKY.moonDir },
      uNight: { value: 0 },
      uCover: { value: 0 },
      uStorm: { value: 0 },
      uFlash: { value: 0 },
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
  const cubeRT = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
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
      for (const u of [mat.uniforms, envMat.uniforms]) {
        u.uNight.value = SKY.night;
        u.uCover.value = SKY.cover;
        u.uStorm.value = SKY.storm;
      }
      mat.uniforms.uFlash.value = SKY.flash;
      mat.uniforms.uTime.value = time;
      sky.position.copy(camPos);
    },
  };
}
