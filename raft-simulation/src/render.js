import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Frame: (1) the scene without water into a small colour+depth target, which
// the water samples to show what is beneath it; (2) the full scene, then the
// first-person arm in its own depth layer; (3) bloom; (4) tone map to screen.

export const QUALITY = {
  high: { label: 'High', pixelRatio: 1.5, shadows: 2048, bloom: true, refract: 1, msaa: 4 },
  medium: { label: 'Medium', pixelRatio: 1.15, shadows: 1024, bloom: true, refract: 0.75, msaa: 4 },
  low: { label: 'Low', pixelRatio: 0.85, shadows: 0, bloom: false, refract: 0.5, msaa: 0 },
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
    bloom.enabled = q.bloom;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  function resize(w, h) {
    size = { w, h };
    const pr = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
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
      resize(size.w, size.h);
    },

    resize,

    render(showArm, around) {
      // Shadow box follows the player, snapped so shadows don't crawl.
      focus.set(Math.round(around.x * 4) / 4, 0, Math.round(around.z * 4) / 4);
      sun.target.position.copy(focus);
      sun.position.copy(focus).addScaledVector(sky.sunDir, 45);
      renderer.shadowMap.needsUpdate = true;

      // The water only needs what is under it.
      ocean.mesh.visible = false;
      for (const o of aboveWaterOnly) o.visible = false;
      renderer.setRenderTarget(refractRT);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      ocean.mesh.visible = true;
      for (const o of aboveWaterOnly) o.visible = true;

      vmPass.enabled = showArm;
      composer.render();
    },
  };
  api.setQuality('medium');
  return api;
}
