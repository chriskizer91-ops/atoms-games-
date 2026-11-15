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
  flashDir: new THREE.Vector3(0, 0.3, -1).normalize(),   // where the stroke is, on the chart
  sunset: 0,    // how much sunrise or sunset colour is in the sky, 0..1
  rainbow: 0,   // a rainbow after rain, 0..1
  // a shooting star: where it starts and ends on the dome, and how far along it is (-1 = none)
  meteorA: new THREE.Vector3(0, 1, 0),
  meteorB: new THREE.Vector3(0, 1, 0),
  meteorT: -1,
  // where the brightest thing in the sky is, in the scene (sun, or moon by night), and how strong its light shafts are
  discDir: new THREE.Vector3(0.62, 0.45, -0.64).normalize(),
  rays: 0,
};

// The colours sunrise and sunset lay round the horizon. The sea's haze uses
// the same ones, so sky and water meet without a seam.
export const SUNSET_GLSL = /* glsl */ `
  vec3 sunsetBands(vec3 col, vec3 d, vec3 sunDir, float amount) {
    vec2 sh = normalize(sunDir.xz + vec2(1e-5));
    vec2 dh = normalize(d.xz + vec2(1e-5));
    float az = dot(dh, sh) * 0.5 + 0.5;                 // 1 toward the sun, 0 opposite it
    float up = 1.0 - clamp(d.y, 0.0, 1.0);
    float low = pow(up, 7.0);                           // hugging the horizon
    float mid = pow(up, 2.6);
    col += vec3(1.35, 0.42, 0.08) * low * az * az * amount * 0.55;         // fire by the sun
    col += vec3(0.95, 0.38, 0.45) * mid * (0.2 + 0.8 * az) * amount * 0.24; // rose above it
    // opposite the sun: the earth's shadow rising, dusky violet under a pink band
    col = mix(col, col * vec3(0.78, 0.74, 1.08) + vec3(0.07, 0.04, 0.11), amount * (1.0 - az) * mid * 0.7);
    return col;
  }`;

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // always on the far plane
  }`;

const FRAG = /* glsl */ `
  uniform vec3 uSunDir, uSunColor, uZenith, uHorizon, uGround, uMoonDir, uMeteorA, uMeteorB, uFlashDir;
  uniform float uTime, uSunDisc, uNight, uCover, uStorm, uFlash, uSunset, uRainbow, uMeteorT;
  varying vec3 vDir;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
  float fbm5(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = ROT * p; a *= 0.5; }
    return v;
  }
  float fbm3(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = ROT * p; a *= 0.5; }
    return v;
  }
  ${SUNSET_GLSL}

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float sd = max(dot(d, uSunDir), 0.0); // uSunDir here is the true sun
    float day = 1.0 - uNight;
    float lowSun = 1.0 - smoothstep(0.05, 0.45, uSunDir.y);
    // Lightning lights the cloud round the stroke far more than the rest of the sky.
    float fl = uFlash * (0.22 + 0.78 * pow(max(dot(d, uFlashDir), 0.0), 5.0));

    float t = pow(1.0 - clamp(h, 0.0, 1.0), 4.5);
    vec3 col = mix(uZenith, uHorizon, t);
    if (uSunset > 0.001) col = sunsetBands(col, d, uSunDir, uSunset);
    // The sun's glow is smothered by storm cloud and dulled by overcast. Low
    // in the sky it spreads wide.
    float sunVis = clamp(1.0 - 0.85 * uStorm - 0.3 * uCover, 0.08, 1.0);
    col += uSunColor * sunVis * (pow(sd, 5.0) * 0.22 * (0.35 + t) * (1.0 + 1.2 * lowSun) + pow(sd, 90.0) * 0.5 + pow(sd, 900.0) * 1.8);

    if (h < 0.0) col = mix(col, uGround, clamp(-h * 5.0, 0.0, 1.0));

    // ---- night: stars, the Milky Way, a shooting star, the moon ----
    float clear = 1.0;
    if (uNight > 0.01 && h > 0.0) {
      vec3 c = floor(d * 380.0);
      float st = hash(c.xy + c.z * 17.13);
      float star = step(0.9975, st) * (0.6 + 0.4 * sin(uTime * 3.0 + st * 80.0));
      vec3 tint = mix(vec3(1.0, 0.86, 0.72), vec3(0.78, 0.88, 1.0), fract(st * 91.0));
      // The Milky Way: a soft band of light, mottled with dust and crowded with faint stars.
      float band = exp(-pow(dot(d, vec3(0.3293, 0.4704, -0.8187)), 2.0) * 20.0);
      vec3 c2 = floor(d * 760.0);
      float st2 = hash(c2.xy * 1.3 + c2.z * 7.7);
      float faint = step(0.9968 - band * 0.014, st2) * 0.4;
      float dust = fbm3(d.xy * 6.0 + d.z * 3.0);
      vec3 milky = vec3(0.42, 0.5, 0.78) * band * (0.2 + 1.1 * dust * dust) * 0.42;
      col += (tint * star * 2.2 + vec3(0.85, 0.9, 1.0) * faint + milky) * uNight * smoothstep(0.02, 0.2, h);
      if (uMeteorT >= 0.0) {
        vec3 p = normalize(mix(uMeteorA, uMeteorB, uMeteorT));
        vec3 q = normalize(mix(uMeteorA, uMeteorB, max(0.0, uMeteorT - 0.3)));
        vec3 pq = p - q;
        float along = clamp(dot(d - q, pq) / max(dot(pq, pq), 1e-6), 0.0, 1.0);
        float off = length(d - (q + pq * along));
        col += vec3(1.0, 0.95, 0.85) * smoothstep(0.0035, 0.0, off) * along * sin(uMeteorT * 3.14159) * 6.0 * uNight;
      }
    }
    float md = dot(d, uMoonDir);
    if (uNight > 0.01 && md > 0.9) {
      // The moon: a disc with grey seas on it, and a halo.
      vec3 mx = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
      vec3 my = cross(mx, uMoonDir);
      vec2 mp = vec2(dot(d, mx), dot(d, my)) * 55.0;
      float seas = 0.72 + 0.28 * smoothstep(0.35, 0.62, noise(mp * 1.6 + 3.0));
      float disc = smoothstep(0.99935, 0.9996, md);
      col += vec3(0.78, 0.85, 1.0) * (disc * 5.5 * seas + pow(md, 60.0) * 0.25 + pow(md, 700.0) * 0.5) * uNight;
    }

    if (h > 0.0) {
      vec2 dh = normalize(d.xz + vec2(1e-5));
      float az = dot(dh, normalize(uSunDir.xz + vec2(1e-5))) * 0.5 + 0.5;
      vec3 warm = vec3(1.3, 0.6, 0.34);

      // High cirrus: thin streaks far above everything else.
      vec2 cu = d.xz / (h + 0.32) * vec2(0.45, 1.5) + vec2(uTime * 0.0016, uTime * 0.0005);
      float ci = fbm3(cu) * fbm3(cu * 0.41 + 5.3);
      ci = smoothstep(0.2, 0.46, ci) * 0.55 * (1.0 - 0.8 * uStorm) * smoothstep(0.02, 0.25, h);
      vec3 ciCol = mix(vec3(1.0, 1.0, 1.02) * (0.1 + 0.9 * day), warm * 1.05, uSunset * (0.35 + 0.65 * az)) + uSunColor * pow(sd, 6.0) * 0.5 * day;
      col = mix(col, ciCol, ci);
      clear -= ci * 0.6;

      // Cumulus on a flat layer overhead: perspective squashes them toward the horizon.
      vec2 uv = d.xz / (h + 0.06) * 0.9 + vec2(uTime * 0.006, uTime * 0.002) * (1.0 + uStorm * 3.0);
      float n = fbm5(uv);
      float thr = mix(0.5, 0.28, uCover);
      float cover = smoothstep(thr, thr + 0.24, n);
      float towardSun = fbm5(uv + uSunDir.xz * 0.12);
      float lit = clamp(0.62 + (n - towardSun) * 4.0, 0.22, 1.2);
      vec3 shadowCol = mix(uHorizon, uZenith, 0.35) * 0.82;
      shadowCol = mix(shadowCol, vec3(0.3, 0.2, 0.36) * (0.4 + 0.6 * day), uSunset * 0.55);
      vec3 top = mix(vec3(1.06, 1.03, 0.98), vec3(0.27, 0.3, 0.34), uStorm);
      top = mix(top, warm, uSunset * (0.3 + 0.7 * az) * (1.0 - uStorm));
      top = mix(top, vec3(0.16, 0.2, 0.28), uNight);
      vec3 cloud = mix(shadowCol * (1.0 - uStorm * 0.6), top, lit);
      cloud += uSunColor * pow(sd, 10.0) * 0.8 * (1.0 - cover * 0.6) * day * (1.0 - 0.9 * uStorm); // silver lining
      cloud += vec3(0.7, 0.75, 1.0) * fl * 2.2 * lit;
      float fade = smoothstep(0.0, 0.2, h);
      cloud = mix(uHorizon, cloud, smoothstep(0.0, 0.35, h));
      col = mix(col, cloud, cover * fade * 0.96);
      clear -= cover * fade;

      // Far cloud standing on the horizon: towers a long way off, lit from the sun's side.
      float gaps = smoothstep(0.3 - 0.3 * uCover, 0.62, noise(dh * 1.4 + 9.0));
      float topH = (0.02 + 0.1 * (noise(dh * 3.1 + 3.0) * 0.65 + noise(dh * 8.3 + 1.7) * 0.35)) * gaps;
      float bank = smoothstep(topH, topH - 0.018, h) * step(0.004, topH);
      float bh = clamp(h / max(topH, 0.001), 0.0, 1.0);
      vec3 bankCol = mix(shadowCol, top, 0.25 + 0.75 * bh * (0.45 + 0.55 * az));
      bankCol = mix(bankCol, uHorizon, 0.38);
      bankCol += vec3(0.7, 0.75, 1.0) * fl * 1.5;
      bankCol *= 0.4 + 0.6 * day;
      col = mix(col, bankCol, bank * 0.85);
      clear -= bank;
      clear = max(clear, 0.0);
    }

    // After rain, with the sun behind you: a rainbow.
    if (uRainbow > 0.001 && h > -0.02) {
      float ang = degrees(acos(clamp(dot(d, -uSunDir), -1.0, 1.0)));
      float r = (ang - 40.4) / 2.2; // violet on the inside, red on the outside
      if (r > -0.4 && r < 1.4) {
        vec3 spec = clamp(vec3(smoothstep(0.3, 0.85, r), 1.0 - abs(r - 0.5) * 2.1, 1.0 - smoothstep(0.1, 0.62, r)), 0.0, 1.0);
        float in1 = smoothstep(-0.3, 0.1, r) * (1.0 - smoothstep(0.9, 1.3, r));
        col += spec * in1 * uRainbow * 0.42 * smoothstep(-0.02, 0.1, h) * (0.6 + 0.4 * (1.0 - clear));
      }
    }

    // The sun's disc swells and reddens as it nears the horizon.
    float edge = mix(0.99962, 0.9989, lowSun);
    col += uSunColor * smoothstep(edge, edge + 0.0002, sd) * mix(28.0, 16.0, lowSun) * uSunDisc * clear * day;
    col += vec3(0.5, 0.55, 0.7) * fl * 0.45;

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
      uSunset: { value: 0 },
      uRainbow: { value: 0 },
      uMeteorA: { value: SKY.meteorA },
      uMeteorB: { value: SKY.meteorB },
      uMeteorT: { value: -1 },
      uFlashDir: { value: SKY.flashDir },
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
  const extraScenes = [];

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
    // Turn the dome (and the light captured from it) with the chart.
    setYaw(yaw) {
      sky.rotation.y = yaw;
      scene.environmentRotation.y = yaw;
      for (const sc of extraScenes) sc.environmentRotation.y = yaw;
    },
    // Other scenes lit by the same captured sky (the first-person arm).
    follow(sc) { extraScenes.push(sc); },
    update(time, camPos) {
      for (const u of [mat.uniforms, envMat.uniforms]) {
        u.uNight.value = SKY.night;
        u.uCover.value = SKY.cover;
        u.uStorm.value = SKY.storm;
        u.uSunset.value = SKY.sunset;
      }
      mat.uniforms.uRainbow.value = SKY.rainbow;
      mat.uniforms.uMeteorT.value = SKY.meteorT;
      mat.uniforms.uFlash.value = SKY.flash;
      mat.uniforms.uTime.value = time;
      sky.position.copy(camPos);
    },
  };
}
