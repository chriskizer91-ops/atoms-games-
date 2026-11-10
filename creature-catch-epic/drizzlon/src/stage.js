// Puts everything on stage: creature, dummy, effects, camera, and the update loop.
import * as THREE from 'three';
import { loadDrizzlon, makeShared } from './creature.js';
import { makeEnvironment } from './env.js';
import { Rig } from './rig.js';
import { Animator } from './anim.js';
import { FX } from './fx.js';
import { Dummy } from './dummy.js';
import { MOVES } from './moves.js';

export class Stage {
  constructor(canvas, opts = {}) {
    this.opts = opts;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.antialias ?? true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.shared = makeShared();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 120);
    this.env = makeEnvironment(r, this.scene, this.shared, opts);
    this.fx = new FX(this.scene, this.shared, this);
    this.dummy = new Dummy(this.scene);
    this.targetPos = new THREE.Vector3(0, 0, 1.5);
    this.dummy.setPosition(this.targetPos, 0);
    // camera: the viewer orbits a focus point; moves may borrow the camera for a shot
    this.orbit = { yaw: -1.2, pitch: 0.16, dist: 3.3, focus: new THREE.Vector3(0, 0.36, 0.62) };
    this.shot = { w: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30, active: false };
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.camInit = false;
    this.shake = 0; this.time = 0; this.cinematic = opts.cinematic ?? true;
    this.wetGround = [0, 0];
    this.onMoveEnd = null;
  }
  async load(src) {
    const D = this.D = await loadDrizzlon(src, this.shared);
    this.scene.add(D.root);
    this.rig = new Rig(D);
    this.rig.placeAt(new THREE.Vector3(0, 0, 0), 0);
    const ctx = this.ctx = { stage: this, rig: this.rig, fx: this.fx, dummy: this.dummy, D, shared: this.shared, target: this.targetPos, dist: this.targetPos.z,
      mouth: (out = new THREE.Vector3()) => this.rig.pointWorld('head', _mouth.fromArray(D.meta.mouth), out),
      dropPos: (out = new THREE.Vector3()) => this.rig.pointWorld('drop', _mouth.fromArray(D.meta.dropCenter), out),
      forward: new THREE.Vector3(0, 0, 1) };
    this.anim = new Animator(this.rig, ctx);
    this.rig.lookTarget.set(0, 0.45, 1.5);
    this.update(0);
    return this;
  }
  play(name) {
    const m = MOVES[name]; if (!m || this.anim.busy) return false;
    this.fx.clear();
    this.current = name;
    this.anim.play(m, () => { this.current = null; this.shot.active = false; if (this.onMoveEnd) this.onMoveEnd(name); });
    return true;
  }
  setSize(w, h, dpr = 1) { this.renderer.setPixelRatio(dpr); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.fx.puffs.mat.uniforms.uScale.value = this.fx.glows.mat.uniforms.uScale.value = h * dpr * 0.9; }
  addShake(a) { this.shake = Math.min(1.2, this.shake + a); }
  hitStop(s) { this.anim.hitStop = Math.max(this.anim.hitStop, s); }
  update(dtReal) {
    const dt = this.anim ? this.anim.update(dtReal) : dtReal;
    this.time += dt; this.shared.uTime.value = this.time;
    this.dummy.update(dt, this.fx);
    this.fx.update(dt, this.camera);
    // the head watches the target; during moves the move decides how much
    if (this.rig) { if (this.ctx._lookOverride) this.rig.lookTarget.copy(this.ctx._lookOverride); else this.dummy.center(this.rig.lookTarget); }
    // wet patches dry out
    const gu = this.env.groundU;
    gu.uWetPos.value.w = Math.max(0, gu.uWetPos.value.w - dt * 0.12); gu.uWetPos2.value.w = Math.max(0, gu.uWetPos2.value.w - dt * 0.12);
    if (this.env.pushU) { const p = this.env.pushU.value; p.z += dt * 7; p.w *= Math.exp(-dt * 3.2); }
    this.shared.uWet.value = Math.max(0, this.shared.uWet.value - dt * 0.15);
    this.updateCamera(dt);
  }
  wetAt(x, z, radius, amount = 1) {
    const gu = this.env.groundU; const slot = (this._wetSlot = 1 - (this._wetSlot || 0)) ? gu.uWetPos2 : gu.uWetPos;
    slot.value.set(x, z, radius, amount);
  }
  pushGrass(x, z, power = 1) { if (this.env.pushU) this.env.pushU.value.set(x, z, 0.2, power * 0.2); }
  /** Moves call this every frame they want the camera: pos/look in world space. */
  setShot(pos, look, fov = 30) { if (!this.cinematic) return; this.shot.pos.copy(pos); this.shot.look.copy(look); this.shot.fov = fov; this.shot.active = true; }
  updateCamera(dt) {
    const o = this.orbit, cam = this.camera;
    const cp = Math.cos(o.pitch);
    _a.set(o.focus.x + Math.sin(o.yaw) * cp * o.dist, o.focus.y + Math.sin(o.pitch) * o.dist, o.focus.z + Math.cos(o.yaw) * cp * o.dist);
    _b.copy(o.focus);
    const s = this.shot;
    s.w += ((s.active ? 1 : 0) - s.w) * (1 - Math.exp(-dt * (s.active ? 5 : 3.2)));
    let fov = 30;
    if (s.w > 0.001) { const k = s.w * s.w * (3 - 2 * s.w); _a.lerp(s.pos, k); _b.lerp(s.look, k); fov = 30 + (s.fov - 30) * k; }
    // a tall, narrow screen: widen the lens first, then step back, and lift the camera clear of the grass
    const fit = Math.max(1, 1.5 / cam.aspect);
    if (fit > 1) {
      const wide = Math.min(1.5, Math.sqrt(fit));
      const back = fit / (Math.tan(fov * wide * Math.PI / 360) / Math.tan(fov * Math.PI / 360));
      fov *= wide;
      _a.sub(_b).multiplyScalar(Math.max(1, back)).add(_b);
      _a.y = Math.max(_a.y, 0.3 + 0.12 * (fit - 1));
    }
    _a.y = Math.max(_a.y, 0.1);
    if (!this.camInit || dt === 0) { this.camPos.copy(_a); this.camLook.copy(_b); this.camInit = true; }
    const kk = 1 - Math.exp(-dt * 14);
    this.camPos.lerp(_a, kk); this.camLook.lerp(_b, kk);
    cam.position.copy(this.camPos);
    if (this.shake > 0.001) {
      const t = this.time * 55, a = this.shake * this.shake * 0.045;
      cam.position.x += Math.sin(t * 1.3) * a; cam.position.y += Math.sin(t * 1.7 + 1) * a; cam.position.z += Math.sin(t * 1.1 + 2) * a;
      this.shake *= Math.exp(-dt * 6.5);
    }
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.lookAt(this.camLook);
    cam.updateMatrixWorld();
    this.shared.uSunDirView.value.copy(this.shared.uSunDir.value).transformDirection(cam.matrixWorldInverse);
    this.env.update(cam);
    // keep the sun's shadow box centred on the action
    const sun = this.env.sun; sun.target.position.set(0, 0, 0.75); sun.position.copy(this.shared.uSunDir.value).multiplyScalar(6).add(sun.target.position);
  }
  render() { this.renderer.render(this.scene, this.camera); }
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _mouth = new THREE.Vector3();
