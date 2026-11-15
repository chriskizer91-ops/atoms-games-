import * as THREE from 'three';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

// The last step of every frame. It does what the stock output step does
// (filmic tone mapping, conversion for the screen) and three things more:
//
//  - shafts of light: the bright sky round the sun is smeared outward from
//    it, so anything in front (the sail, the mast, a palm, a cloud edge)
//    throws long rays. Worked out on a picture a quarter the size, so it
//    costs about one and a half texture reads per pixel;
//  - a film grade: a little more contrast and colour, cool shadows, warm
//    highlights; greyer and harder in a storm;
//  - a soft vignette that draws the eye in.

const RAY_STEPS = 22;

const RAYS_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uSun;      // where the sun is on screen (0..1; may be a little outside)
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec2 toSun = uSun - vUv;
    float dist = length(toSun * vec2(uAspect, 1.0));
    vec2 stp = toSun * (0.92 / float(${RAY_STEPS}));
    // Start each pixel's march at a slightly different point so the steps don't show as rings.
    float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 uv = vUv + stp * jitter;
    float acc = 0.0, w = 1.0;
    for (int i = 0; i < ${RAY_STEPS}; i++) {
      vec3 c = texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb;
      // Only the sun's own glare counts as a light source.
      acc += smoothstep(1.3, 5.0, max(c.r, max(c.g, c.b))) * w;
      w *= 0.965;
      uv += stp;
    }
    acc /= float(${RAY_STEPS}) * 0.4;
    gl_FragColor = vec4(acc * (1.0 - smoothstep(0.15, 1.15, dist)));
  }`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createFinalPass() {
  const pass = new OutputPass();
  const u = pass.uniforms;
  u.tRays = { value: null };
  u.uRays = { value: 0 };
  u.uRayColor = { value: new THREE.Color(1, 0.9, 0.7) };
  u.uVignette = { value: 0.34 };
  u.uGrade = { value: 1 };
  u.uStorm = { value: 0 };
  const src = pass.material.fragmentShader;
  let frag = src
    .replace('uniform sampler2D tDiffuse;', 'uniform sampler2D tDiffuse;\n\t\tuniform sampler2D tRays;\n\t\tuniform float uRays, uVignette, uGrade, uStorm;\n\t\tuniform vec3 uRayColor;')
    .replace('gl_FragColor = texture2D( tDiffuse, vUv );', 'gl_FragColor = texture2D( tDiffuse, vUv );\n\t\t\tif ( uRays > 0.0 ) gl_FragColor.rgb += texture2D( tRays, vUv ).r * uRayColor * uRays;');
  const tail = frag.lastIndexOf('}');
  frag = `${frag.slice(0, tail)}
			// ---- the grade, in screen colours ----
			vec3 g = gl_FragColor.rgb;
			float l = dot( g, vec3( 0.2126, 0.7152, 0.0722 ) );
			g = mix( vec3( l ), g, 1.0 + 0.14 * uGrade - 0.3 * uStorm );
			g = mix( g, g * g * ( 3.0 - 2.0 * g ), 0.16 * uGrade + 0.12 * uStorm );
			g += ( vec3( -0.014, 0.0, 0.02 ) * ( 1.0 - l ) + vec3( 0.014, 0.005, -0.012 ) * l ) * uGrade * ( 1.0 - uStorm );
			vec2 q = vUv - 0.5;
			g *= 1.0 - uVignette * smoothstep( 0.2, 0.95, dot( q, q ) * 2.2 );
			gl_FragColor.rgb = clamp( g, 0.0, 1.0 );
		}`;
  pass.material.fragmentShader = frag;
  pass.material.needsUpdate = true;

  const raysRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const raysMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uAspect: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: RAYS_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new FullScreenQuad(raysMat);
  u.tRays.value = raysRT.texture;

  const state = { on: true, strength: 0 };
  const v = new THREE.Vector3();
  const baseRender = pass.render.bind(pass);
  const baseSetSize = pass.setSize.bind(pass);
  pass.setSize = (w, h) => {
    baseSetSize(w, h);
    raysRT.setSize(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)));
    raysMat.uniforms.uAspect.value = w / Math.max(1, h);
  };
  pass.render = (renderer, writeBuffer, readBuffer, dt, mask) => {
    u.uRays.value = state.on ? state.strength : 0;
    if (u.uRays.value > 0.004) {
      raysMat.uniforms.tDiffuse.value = readBuffer.texture;
      renderer.setRenderTarget(raysRT);
      quad.render(renderer);
    } else {
      u.uRays.value = 0;
    }
    baseRender(renderer, writeBuffer, readBuffer, dt, mask);
  };

  return {
    pass,
    // Shafts of light on or off (graphics quality).
    setRays(on) { state.on = on; },
    // Each frame: where the bright disc is, how strong its shafts are, its colour, and how stormy it is.
    update(camera, discDir, strength, color, storm) {
      u.uStorm.value = storm;
      state.strength = 0;
      if (strength <= 0.004) return;
      // Is the disc in front of us, and on (or nearly on) the screen?
      v.copy(camera.position).addScaledVector(discDir, 500).project(camera);
      if (v.z > 1 || v.z < -1) return;
      const off = Math.max(Math.abs(v.x), Math.abs(v.y));
      const k = 1 - THREE.MathUtils.smoothstep(off, 1.05, 1.5);
      if (k <= 0) return;
      raysMat.uniforms.uSun.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
      state.strength = strength * k;
      u.uRayColor.value.copy(color);
    },
    dispose() { raysRT.dispose(); },
  };
}
