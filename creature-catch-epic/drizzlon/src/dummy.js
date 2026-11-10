// A sprung training dummy: something solid for the attacks to land on.
import * as THREE from 'three';

function woodMat(base, ring, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 });
  m.userData.u = { uWet: opts.uWet, uFlash: opts.uFlash };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWet = opts.uWet; sh.uniforms.uFlash = opts.uFlash;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec3 vLp;').replace('#include <begin_vertex>', '#include <begin_vertex>\n vLp = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vLp; uniform float uWet, uFlash;
      float wh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(wh(i), wh(i+vec2(1,0)), f.x), mix(wh(i+vec2(0,1)), wh(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `
        float ang = atan(vLp.x, vLp.z);
        float grain = wn(vec2(ang * ${opts.grainA ?? '6.0'}, vLp.y * ${opts.grainY ?? '40.0'})) * 0.6 + wn(vec2(ang * 19.0, vLp.y * 9.0)) * 0.4;
        vec3 wc = mix(${base}, ${ring}, grain);
        ${opts.extra ?? ''}
        wc *= mix(1.0, 0.55, uWet);
        diffuseColor.rgb *= mix(wc, vec3(1.0), uFlash);`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(0.85, 0.22, uWet);');
  };
  m.customProgramCacheKey = () => 'wood|' + base + ring + (opts.extra ?? '') + (opts.grainA ?? '') + (opts.grainY ?? '');
  return m;
}

export class Dummy {
  constructor(scene) {
    this.uWet = { value: 0 }; this.uFlash = { value: 0 };
    const o = { uWet: this.uWet, uFlash: this.uFlash };
    this.root = new THREE.Group();
    // stone base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.07, 28), new THREE.MeshStandardMaterial({ color: 0x8b8e94, roughness: 0.9 }));
    base.position.y = 0.035; base.castShadow = base.receiveShadow = true; this.root.add(base);
    // spring
    this.pivot = new THREE.Group(); this.pivot.position.y = 0.07; this.root.add(this.pivot);
    const coil = [];
    for (let i = 0; i <= 90; i++) { const t = i / 90; coil.push(new THREE.Vector3(Math.cos(t * Math.PI * 9) * 0.075, t * 0.13, Math.sin(t * Math.PI * 9) * 0.075)); }
    this.spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 180, 0.012, 7), new THREE.MeshStandardMaterial({ color: 0x555a66, roughness: 0.35, metalness: 0.9 }));
    this.spring.castShadow = true; this.pivot.add(this.spring);
    // body: a stout log wrapped in rope, with a round painted target
    this.body = new THREE.Group(); this.body.position.y = 0.13; this.pivot.add(this.body);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.62, 28, 8), woodMat('vec3(0.33, 0.20, 0.10)', 'vec3(0.52, 0.34, 0.18)', o));
    log.position.y = 0.31; log.castShadow = log.receiveShadow = true; this.body.add(log);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.012, 28), woodMat('vec3(0.62, 0.45, 0.25)', 'vec3(0.78, 0.60, 0.36)', { ...o, extra: 'float rr = length(vLp.xz); wc = mix(wc, wc * 0.72, smoothstep(0.35, 0.65, fract(rr * 46.0)) * 0.6);' }));
    cap.position.y = 0.626; this.body.add(cap);
    const ropeM = new THREE.MeshStandardMaterial({ color: 0xc9b27c, roughness: 1 });
    for (const y of [0.09, 0.115, 0.52, 0.545]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.186 - (y > 0.3 ? 0.012 : 0), 0.014, 8, 36), ropeM); r.rotation.x = Math.PI / 2; r.position.y = y; r.castShadow = true; this.body.add(r); }
    // target board facing the attacker (-Z)
    const board = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 40), woodMat('vec3(0.80, 0.66, 0.42)', 'vec3(0.90, 0.78, 0.55)', { ...o, grainA: '3.0', grainY: '4.0',
      extra: 'float rr = length(vLp.xz) / 0.2; float rings = step(rr, 0.28) + step(0.52, rr) * step(rr, 0.76); wc = mix(wc, vec3(0.74, 0.10, 0.07), rings * step(0.0, -vLp.y + 0.02) * 0.92); wc *= 1.0 - 0.25 * smoothstep(0.9, 1.0, rr);' }));
    board.rotation.x = Math.PI / 2; board.position.set(0, 0.33, -0.19); board.castShadow = true; this.body.add(board);
    this.board = board;
    // two stick arms
    const stickM = woodMat('vec3(0.36, 0.23, 0.12)', 'vec3(0.50, 0.33, 0.18)', o);
    for (const sx of [1, -1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.34, 8), stickM); a.rotation.z = sx * 1.25; a.position.set(sx * 0.28, 0.44, 0); a.castShadow = true; this.body.add(a); }
    scene.add(this.root);
    // spring state: tilt (x, z) and squash
    this.tilt = new THREE.Vector2(); this.tiltV = new THREE.Vector2(); this.sq = 0; this.sqV = 0;
    this.shiver = 0; this.droop = 0; this.droopT = 0; this.wetT = 0; this.time = 0; this.flashT = 0;
    this.dripT = 0;
  }
  setPosition(p, facing) { this.root.position.copy(p); this.root.rotation.y = facing; }
  /** World point at the middle of the target. */
  center(out = new THREE.Vector3(), h = 0) { return this.board.getWorldPosition(out).add(_t.set(0, h, 0)); }
  top(out = new THREE.Vector3()) { return out.set(0, 0.64, 0).applyMatrix4(this.body.matrixWorld); }
  /** dir: world direction of the blow; power ~1 for a solid hit. */
  hit(dir, power = 1) {
    _t.copy(dir).setY(0).normalize().applyQuaternion(_q.copy(this.root.quaternion).invert());
    this.tiltV.x += _t.z * power * 9; this.tiltV.y += -_t.x * power * 9;
    this.sqV -= power * 2.5; this.flashT = 0.09;
  }
  squash(power = 1) { this.sqV -= power * 9; this.flashT = 0.1; }
  wet(seconds = 6) { this.wetT = Math.max(this.wetT, seconds); }
  update(dt, fx) {
    this.time += dt;
    const k = 95, c = 5.2;
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      this.tiltV.x += (-k * this.tilt.x - c * this.tiltV.x) * h; this.tiltV.y += (-k * this.tilt.y - c * this.tiltV.y) * h;
      this.tilt.x += this.tiltV.x * h; this.tilt.y += this.tiltV.y * h;
      this.sqV += (-260 * this.sq - 13 * this.sqV) * h; this.sq += this.sqV * h;
    }
    this.tilt.x = THREE.MathUtils.clamp(this.tilt.x, -1.05, 1.05); this.tilt.y = THREE.MathUtils.clamp(this.tilt.y, -1.05, 1.05);
    this.sq = THREE.MathUtils.clamp(this.sq, -0.5, 0.35);
    this.droopT += (this.droop - this.droopT) * (1 - Math.exp(-dt * 5));
    const sh = this.shiver;
    this.pivot.rotation.set(this.tilt.x + this.droopT * 0.22 + Math.sin(this.time * 61) * 0.02 * sh, 0, this.tilt.y + Math.sin(this.time * 47) * 0.03 * sh);
    const s = 1 + this.sq;
    this.spring.scale.set(1 + (1 - s) * 0.25, Math.max(0.2, s), 1 + (1 - s) * 0.25);
    this.body.position.y = 0.13 * Math.max(0.2, s);
    this.body.scale.set(1 - this.sq * 0.25, 1 + this.sq * 0.35 - this.droopT * 0.05, 1 - this.sq * 0.25);
    this.flashT = Math.max(0, this.flashT - dt); this.uFlash.value = this.flashT > 0 ? 0.75 : 0;
    this.wetT = Math.max(0, this.wetT - dt);
    const wetGoal = Math.min(1, this.wetT / 1.5);
    this.uWet.value += (wetGoal - this.uWet.value) * (1 - Math.exp(-dt * 3));
    if (this.uWet.value > 0.3 && fx) {
      this.dripT -= dt;
      if (this.dripT < 0) { this.dripT = 0.07; const a = Math.random() * 6.28; _t.set(Math.cos(a) * 0.19, 0.25 + Math.random() * 0.45, Math.sin(a) * 0.19).applyMatrix4(this.body.matrixWorld); fx.droplets(_t, 1, { speed: 0.1, up: 0, size: 0.008, life: 0.8 }); }
    }
  }
}
const _t = new THREE.Vector3(), _q = new THREE.Quaternion();
