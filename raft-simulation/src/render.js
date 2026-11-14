import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Frame: (1) the scene without water into a small colour+depth target, which
// the water samples to show what is beneath it; (2) the full scene, then the
// first-person arm in its own depth layer; (3) bloom; (4) tone map to screen.

// refract: size of the under-the-sea picture next to the screen. shadowEvery:
// redraw the sun's shadows every this many frames. grid: how finely the sea
// is meshed.
export const QUALITY = {
  high: { label: 'High', pixelRatio: 1.5, shadows: 2048, bloom: true, refract: 0.85, msaa: 4, shadowEvery: 1, grid: 240 },
  medium: { label: 'Medium', pixelRatio: 1.15, shadows: 1024, bloom: true, refract: 0.6, msaa: 2, shadowEvery: 2, grid: 200 },
  low: { label: 'Low', pixelRatio: 0.85, shadows: 0, bloom: false, refract: 0.45, msaa: 0, shadowEvery: 2, grid: 150 },
};

const SHADOW_SPAN = 13;

// `aboveWaterOnly`: things the under-water pass must skip (the sky, and
// sprites that already draw over the water in the main pass).
export function createPipeline({ renderer, scene, camera, vmScene, vmCamera, ocean, sun, sky, aboveWaterOnly }) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const s = sun.shadow.camera;
  s.left = -SHADOW_SPAN; s.right = SHADOW_SPAN; s.top = SHADOW_SPAN; s.bottom = -SHADOW_SPAN;
  s.near = 1; s.far = 90;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun.target);

  const depthTex = new THREE.DepthTexture(1, 1);
  depthTex.type = THREE.UnsignedIntType;
  const refractRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture: depthTex });
  ocean.setSources({ scene: refractRT.texture, depth: depthTex, sky: sky.reflection });
  ocean.setCamera(camera);

  let q = null;
  let qName = '';
  let composer = null;
  let vmPass = null;
  let bloom = null;
  let size = { w: 1, h: 1 };
  let scale = 1;        // extra resolution scale from the frame-rate watch (1 = as the level says)
  let frameNo = 0;
  const hidden = [];
  // Hide whatever is marked as wholly above the water (userData.above), for
  // the pass that only needs what lies under it. Stops at the first marked
  // object on each branch, so the walk is short.
  function hideAbove(o) {
    if (!o.visible) return;
    if (o.userData.above) { o.visible = false; hidden.push(o); return; }
    const ch = o.children;
    for (let i = 0; i < ch.length; i++) hideAbove(ch[i]);
  }

  function build() {
    if (composer) {
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
    }
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    vmPass = new RenderPass(vmScene, vmCamera);
    vmPass.clear = false;
    vmPass.clearDepth = true;
    composer.addPass(vmPass);
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.45, 1.0);
    // A stray broken pixel (not-a-number or absurdly bright, which bump
    // shading can produce on a triangle's edge) would be smeared by the glow
    // into a white glare across the picture. Keep such pixels out of it.
    const hp = bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace(
      'vec4 texel = texture2D( tDiffuse, vUv );',
      'vec4 texel = texture2D( tDiffuse, vUv );\n\t\t\tif ( any( isnan( texel.rgb ) ) || any( isinf( texel.rgb ) ) ) texel.rgb = vec3( 0.0 );\n\t\t\ttexel.rgb = clamp( texel.rgb, 0.0, 24.0 );',
    );
    hp.needsUpdate = true;
    bloom.enabled = q.bloom;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  function resize(w, h) {
    size = { w, h };
    const pr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.pixelRatio) * scale);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    refractRT.setSize(Math.max(1, Math.floor(w * pr * q.refract)), Math.max(1, Math.floor(h * pr * q.refract)));
    ocean.setScreen(Math.floor(w * pr), Math.floor(h * pr));
  }

  const focus = new THREE.Vector3();
  const api = {
    get quality() { return qName; },

    setQuality(name) {
      const next = QUALITY[name] || QUALITY.medium;
      const rebuild = !q || q.msaa !== next.msaa;
      q = next;
      qName = name in QUALITY ? name : 'medium';
      sun.castShadow = q.shadows > 0;
      if (q.shadows) {
        sun.shadow.mapSize.set(q.shadows, q.shadows);
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
      }
      if (rebuild) build();
      bloom.enabled = q.bloom;
      ocean.setDetail(q.grid);
      scale = 1;
      resize(size.w, size.h);
    },

    // The frame-rate watch trims or restores sharpness a step at a time.
    get scale() { return scale; },
    setScale(k) {
      k = Math.max(0.55, Math.min(1, k));
      if (k === scale) return;
      scale = k;
      resize(size.w, size.h);
    },

    resize,

    render(showArm, around) {
      // Shadow box follows the player, snapped so shadows don't crawl. It only
      // moves on the frames the shadows are redrawn, so the two always agree.
      const shadowFrame = frameNo++ % q.shadowEvery === 0;
      if (shadowFrame) {
        focus.set(Math.round(around.x * 4) / 4, 0, Math.round(around.z * 4) / 4);
        sun.target.position.copy(focus);
        sun.position.copy(focus).addScaledVector(sky.sunDir, 45);
      }

      // The water only needs what is under it: the sky, the deck, the trees
      // and everything else above the surface sit this pass out. (Shadows are
      // redrawn in the main pass, where everything is there to cast them.)
      // (Except the very first time, when the shadow map doesn't exist yet.)
      renderer.shadowMap.needsUpdate = sun.castShadow && !sun.shadow.map;
      ocean.mesh.visible = false;
      for (const o of aboveWaterOnly) o.visible = false;
      hidden.length = 0;
      hideAbove(scene);
      renderer.setRenderTarget(refractRT);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      ocean.mesh.visible = true;
      for (const o of aboveWaterOnly) o.visible = true;
      for (let i = 0; i < hidden.length; i++) hidden[i].visible = true;

      renderer.shadowMap.needsUpdate = shadowFrame;

      vmPass.enabled = showArm;
      composer.render();
    },
  };
  api.setQuality('medium');
  return api;
}
