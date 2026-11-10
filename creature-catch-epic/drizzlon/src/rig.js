// Drizzlon's animation rig.
//
// A pose is a flat set of named channels (crouch, pitch, jaw, wingOpen ...). The rig turns
// channels into bone rotations, then:
//   - solves the four legs so paws stay planted (and steps them when the body moves),
//   - lets the tail, frills, crest, wing fingers and the tail droplet lag and overshoot,
//   - aims head and eyes at a look target, and blinks.
import * as THREE from 'three';

const V3 = THREE.Vector3, Q = THREE.Quaternion;
const X = new V3(1, 0, 0), Y = new V3(0, 1, 0), Z = new V3(0, 0, 1);
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _q = new Q(), _q2 = new Q(), _m = new THREE.Matrix4();

export const DEFAULTS = {
  // placement (metres / radians), relative to the home spot and facing
  rootX: 0, rootY: 0, rootZ: 0, rootYaw: 0, rootPitch: 0, rootRoll: 0,
  sx: 1, sy: 1, sz: 1,                 // squash and stretch of the whole body
  // body
  hipsX: 0, hipsY: 0, hipsZ: 0, pitch: 0, yaw: 0, roll: 0,   // pitch + = nose up
  spinePitch: 0, spineYaw: 0, spineRoll: 0, chestY: 0,
  neckPitch: 0, neckYaw: 0, headPitch: 0, headYaw: 0, headRoll: 0,
  jaw: 0.12, breath: 0,
  // tail (lift + = up, side + = to its left)
  tailLift: 0, tailSide: 0, tailCurl: 0, tailBase: 0, tailArch: 0, tailWag: 0, tailWagFreq: 9, tailStiff: 1,
  // wings: open 0 = folded on the back, 1 = spread; flap + = raised
  wingOpen: 0.22, wingFlap: 0, wingSweep: 0, wingFlapL: 0, wingFlapR: 0, wingCup: 0,
  // frills and crest
  earBack: 0, earSpread: 0, crest: 0,
  // face
  lidTop: 0.2, lidBot: 0.0, lidTilt: 0, smile: 0, pupil: 1, eyeGlow: 0, blinkHold: 0,
  brow: 0, browRaise: 0, squint: 0, slit: 0,   // brow + = scowl; squint pushes the cheeks up under the eyes
  look: 1, lookX: 0, lookY: 0,        // look: how much the head follows the look target
  // feet: a = attached to the body (0 planted .. 1 carried), x/y/z offsets in metres
  air: 0, stance: 0, stepThr: 0.05,
  gait: 0, gaitPhase: 0, gaitDuty: 0.68, gaitPeriod: 0.62, gaitLift: 0.035,   // a driven walk / run cycle
  faFL: 0, fxFL: 0, fyFL: 0, fzFL: 0, faFR: 0, fxFR: 0, fyFR: 0, fzFR: 0,
  faHL: 0, fxHL: 0, fyHL: 0, fzHL: 0, faHR: 0, fxHR: 0, fyHR: 0, fzHR: 0,
  // droplet
  dropScale: 1, dropGlow: 0,
  idle: 1,
};

// scorpion arch: stand the tail up from its root, straighten its resting bend, hook the tip forward
const ARCH = [1.1, 0.1, -0.6, -0.6, 0.0, 0.35, 0.45, 0.45];
const FEET = ['FL', 'FR', 'HL', 'HR'];
const LEGB = { FL: ['armL1', 'armL2', 'armL3'], FR: ['armR1', 'armR2', 'armR3'], HL: ['legL1', 'legL2', 'legL3'], HR: ['legR1', 'legR2', 'legR3'] };

export class Rig {
  constructor(D) {
    this.D = D;
    this.names = Object.keys(D.bones);
    // parents-first order
    this.order = [];
    const walk = (b) => { if (b.isBone) this.order.push(b.name); b.children.forEach(walk); };
    walk(D.bones.root);
    this.parent = {}; this.lpos = {}; this.lq = {}; this.mp = {}; this.mq = {};
    for (const n of this.order) {
      const b = D.bones[n];
      this.parent[n] = b.parent && b.parent.isBone ? b.parent.name : null;
      this.lpos[n] = b.position.clone();
      this.lq[n] = new Q(); this.mp[n] = new V3(); this.mq[n] = new Q();
    }
    this.rest = {};
    for (const n of this.order) this.rest[n] = D.restPos[n].clone();
    this.restLocal = {};
    for (const n of this.order) this.restLocal[n] = this.lpos[n].clone();
    this.P = { ...DEFAULTS };
    this.home = new V3(0, 0, 0); this.facing = 0;
    this.rootPos = new V3(); this.rootQ = new Q(); this.rootScale = new V3(1, 1, 1);
    this.rootMat = new THREE.Matrix4(); this.rootInv = new THREE.Matrix4();
    this.time = 0;
    // legs
    this.legs = {};
    for (const f of FEET) {
      const [a, b, c] = LEGB[f];
      const H = this.rest[a], K = this.rest[b], A = this.rest[c];
      const front = f[0] === 'F';
      const pole = new V3(0, 0, front ? -1 : 1);
      const r1 = K.clone().sub(H), r2 = A.clone().sub(K);
      const dHA = A.clone().sub(H).normalize();
      const bend = pole.clone().addScaledVector(dHA, -pole.dot(dHA)).normalize();
      const n = dHA.clone().cross(bend).normalize();
      this.legs[f] = {
        bones: [a, b, c], front, pole, l1: r1.length(), l2: r2.length(),
        restB1: basis(r1.clone().normalize(), n), restB2: basis(r2.clone().normalize(), n),
        ankle: A.clone(), attach: front ? 'chest' : 'hips',
        attachOff: A.clone().sub(this.rest[front ? 'chest' : 'hips']),
        plant: new V3(), step: null, init: false, lift: 0,
      };
    }
    // springs
    this.springs = [];
    const add = (bone, tip, stiff, zeta, maxAng, grav = 0) => this.springs.push({ bone, tip: tip.clone(), stiff, damp: 2 * Math.sqrt(stiff) * zeta, maxAng, grav, p: new V3(), v: new V3(), init: false });
    for (let i = 1; i <= 8; i++) {
      const n = 'tail' + i, child = i < 8 ? 'tail' + (i + 1) : 'drop';
      add(n, this.lpos[child], 260 - i * 22, 0.42, 0.55);
    }
    add('drop', new V3(0, 0.06, 0), 150, 0.28, 0.7);
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const eb = this.rest['ear' + s];
      for (const [k, tip] of [['t', [0.115, 0.136, -0.155]], ['m', [0.158, 0.003, -0.139]], ['b', [0.09, -0.1, -0.073]]]) {
        add(`ear${s}_${k}`, new V3(tip[0] * sx, tip[1], tip[2]), 320, 0.33, 0.5);
      }
      add(`wing${s}_f1a`, new V3(0.115 * sx, 0.022, -0.022), 420, 0.5, 0.25);
      add(`wing${s}_f1b`, new V3(0.117 * sx, -0.054, -0.026), 300, 0.4, 0.4);
      add(`wing${s}_f2`, new V3(0.185 * sx, -0.192, -0.064), 300, 0.45, 0.3);
      add(`wing${s}_f3`, new V3(0.078 * sx, -0.26, -0.064), 300, 0.45, 0.3);
    }
    add('crest1', this.lpos.crest2, 380, 0.4, 0.3);
    add('crest2', new V3(0, 0.03, -0.09), 240, 0.35, 0.5);
    // face state
    this.blinkT = 2; this.blink = 0; this.saccT = 1; this.sacc = new THREE.Vector2();
    this.lookTarget = new V3(0, 0.5, 3); this.lookYaw = 0; this.lookPitch = 0;
    this.gaze = new THREE.Vector2();
    this.dropVel = new V3();
    this.teleport = true;
  }

  placeAt(home, facing) { this.home.copy(home); this.facing = facing; this.teleport = true; }
  moveTo(home, facing) { this.home.copy(home); this.facing = facing; }

  // ---------------------------------------------------------------- helpers
  fk(n) {
    const p = this.parent[n];
    if (!p) { this.mp[n].copy(this.lpos[n]); this.mq[n].copy(this.lq[n]); return; }
    this.mq[n].copy(this.mq[p]).multiply(this.lq[n]);
    this.mp[n].copy(this.lpos[n]).applyQuaternion(this.mq[p]).add(this.mp[p]);
  }
  fkAll() { for (const n of this.order) this.fk(n); }
  fkSubtree(n) { const pre = n; for (const m of this.order) if (m === n || this.isUnder(m, pre)) this.fk(m); }
  isUnder(m, anc) { let p = this.parent[m]; while (p) { if (p === anc) return true; p = this.parent[p]; } return false; }
  setModelQuat(n, q) {
    this.mq[n].copy(q);
    const p = this.parent[n];
    this.lq[n].copy(p ? _qs.copy(this.mq[p]).invert().multiply(this.mq[n]) : this.mq[n]);
  }
  toWorld(v) { return v.applyMatrix4(this.rootMat); }
  toModel(v) { return v.applyMatrix4(this.rootInv); }
  /** World position of a bone (after update). */
  boneWorld(n, out = new V3()) { return out.copy(this.mp[n]).applyMatrix4(this.rootMat); }
  /** World position of a point given in a bone's rest-pose coordinates (the sculpt's own space). */
  pointWorld(bone, restPoint, out = new V3()) {
    return out.copy(restPoint).sub(this.rest[bone]).applyQuaternion(this.mq[bone]).add(this.mp[bone]).applyMatrix4(this.rootMat);
  }
  dirWorld(bone, dir, out = new V3()) { return out.copy(dir).applyQuaternion(this.mq[bone]).applyQuaternion(this.rootQ); }

  // ---------------------------------------------------------------- main update
  update(P, dt) {
    this.P = P; this.time += dt;
    const lq = this.lq, e = (n, x, y, z) => lq[n].setFromEuler(_e.set(x, y, z, 'YXZ'));
    // root
    const cf = Math.cos(this.facing), sf = Math.sin(this.facing);
    this.rootPos.set(this.home.x + P.rootX * cf + P.rootZ * sf, this.home.y + P.rootY, this.home.z - P.rootX * sf + P.rootZ * cf);
    this.rootQ.setFromEuler(_e.set(-P.rootPitch, this.facing + P.rootYaw, -P.rootRoll, 'YXZ'));
    this.rootScale.set(P.sx, P.sy, P.sz);
    this.rootMat.compose(this.rootPos, this.rootQ, this.rootScale);
    this.rootInv.copy(this.rootMat).invert();

    // body channels -> local rotations
    const br = P.breath;
    for (const n of this.order) { lq[n].identity(); this.lpos[n].copy(this.restLocal[n]); }
    this.lpos.hips.x += P.hipsX; this.lpos.hips.y += P.hipsY; this.lpos.hips.z += P.hipsZ;
    e('hips', -P.pitch, P.yaw, -P.roll);
    e('spine', -P.spinePitch * 0.5, P.spineYaw * 0.5, -P.spineRoll * 0.5);
    e('chest', -P.spinePitch * 0.5 - br * 0.02, P.spineYaw * 0.5, -P.spineRoll * 0.5);
    this.lpos.chest.y += P.chestY + br * 0.004;
    e('neck1', -P.neckPitch * 0.5 - this.lookPitch * 0.2, P.neckYaw * 0.5 + this.lookYaw * 0.22, 0);
    e('neck2', -P.neckPitch * 0.5 - this.lookPitch * 0.25, P.neckYaw * 0.5 + this.lookYaw * 0.28, 0);
    e('head', -P.headPitch - this.lookPitch * 0.55, P.headYaw + this.lookYaw * 0.5, -P.headRoll);
    e('jaw', (P.jaw - 0.36) * 0.80, 0, 0);
    // tail: a travelling wave plus lift/side/curl
    for (let i = 1; i <= 8; i++) {
      const k = i / 8, n = 'tail' + i;
      const wag = Math.sin(this.time * P.tailWagFreq - i * 0.55) * P.tailWag * (0.25 + 0.75 * k) * 0.22;
      const side = (P.tailSide * 0.16) + wag;
      const lift = P.tailLift * 0.14 * (1.15 - k * 0.5) + P.tailCurl * 0.20 * k * k + (i <= 2 ? P.tailBase * 0.5 : 0) + P.tailArch * ARCH[i - 1];
      // curl is around the creature's left-right axis; side bend is around the axis that swings this bone sideways
      _q.setFromAxisAngle(X, lift);
      const d = _v.copy(this.restLocal[i < 8 ? 'tail' + (i + 1) : 'drop']).normalize();
      const ax = _v2.crossVectors(d, X);
      if (ax.lengthSq() < 1e-6) ax.set(0, 0, 1); else ax.normalize();
      _q2.setFromAxisAngle(ax, side);
      lq[n].copy(_q2).multiply(_q);
    }
    // wings
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const o = P.wingOpen, fold = 1 - Math.min(1, o), over = Math.max(0, o - 1);
      const flap = P.wingFlap + (s === 'L' ? P.wingFlapL : P.wingFlapR);
      // folded: the arm swings back along the body and drops; fingers close like a fan
      _q.setFromAxisAngle(Y, sx * (fold * 1.15 + P.wingSweep));
      _q2.setFromAxisAngle(Z, sx * (flap - fold * 0.35 + over * 0.15));
      lq['wing' + s].copy(_q).multiply(_q2);
      _q.setFromAxisAngle(X, fold * 0.5);
      lq['wing' + s].multiply(_q);
      lq[`wing${s}_f1a`].setFromAxisAngle(Z, -sx * (fold * 1.0 - over * 0.12) + sx * flap * 0.10);
      lq[`wing${s}_f1b`].setFromAxisAngle(Z, -sx * (fold * 0.35 + P.wingCup * 0.5) - sx * flap * 0.25);
      lq[`wing${s}_f2`].setFromAxisAngle(Z, -sx * (fold * 0.52 - over * 0.05));
      lq[`wing${s}_f3`].setFromAxisAngle(Z, -sx * (fold * 0.08 - over * 0.02) + sx * P.wingCup * 0.2);
      // frills: back + = pinned against the neck, spread + = fanned wide
      _q.setFromAxisAngle(Y, sx * P.earBack * 0.75);
      _q2.setFromAxisAngle(X, P.earBack * 0.2);
      lq['ear' + s].copy(_q).multiply(_q2);
      lq[`ear${s}_t`].setFromAxisAngle(Z, sx * (P.earSpread * 0.30 - P.earBack * 0.28));
      lq[`ear${s}_m`].setFromAxisAngle(Z, sx * (-P.earBack * 0.05));
      lq[`ear${s}_b`].setFromAxisAngle(Z, sx * (-P.earSpread * 0.30 + P.earBack * 0.25));
    }
    // face: brow ridges swing down toward the nose for a scowl, cheeks push up for a squint
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1, E = this.D.meta.eyes[s];
      _v.fromArray(E.axis);
      lq['brow' + s].setFromAxisAngle(_v, sx * (P.brow * 0.40 - P.browRaise * 0.12));
      _v2.fromArray(E.up);
      this.lpos['brow' + s].addScaledVector(_v2, P.browRaise * 0.012 - P.brow * 0.004).addScaledVector(_v, P.brow * 0.003);
      this.lpos['cheek' + s].addScaledVector(_v2, P.squint * 0.014).addScaledVector(_v, P.squint * 0.004);
    }
    e('crest1', -P.crest * 0.25, 0, 0);
    e('crest2', -P.crest * 0.45, 0, 0);

    this.fkAll();
    this.solveLegs(P, dt);
    this.runSprings(P, dt);
    this.face(P, dt);

    // write to the real skeleton
    const B = this.D.bones;
    for (const n of this.order) { B[n].quaternion.copy(lq[n]); B[n].position.copy(this.lpos[n]); }
    B.root.position.copy(this.rootPos); B.root.quaternion.copy(this.rootQ); B.root.scale.copy(this.rootScale);
    // droplet
    const dv = this.springs[8].v.length();
    const st = Math.min(0.35, dv * 0.12);
    const ds = P.dropScale;
    this.D.droplet.scale.set(ds * (1 - st * 0.35), ds * (1 + st), ds * (1 - st * 0.35));
    this.D.droplet.visible = ds > 0.02;
    this.D.mats.water.uniforms.uGlow.value = 0.22 + P.dropGlow;
    this.teleport = false;
  }

  // ---------------------------------------------------------------- legs
  solveLegs(P, dt) {
    const anyStepping = { A: false, B: false };
    for (const f of FEET) if (this.legs[f].step) anyStepping[pairOf(f)] = true;
    for (const f of FEET) {
      const L = this.legs[f];
      const sx = f[1] === 'L' ? 1 : -1;
      const fa = Math.min(1, Math.max(P.air, P['fa' + f]));
      const ox = P['fx' + f], oy = P['fy' + f], oz = P['fz' + f];
      // where this paw would like to stand, on the ground under the body (world)
      const home = _v.set(L.ankle.x + sx * P.stance + P.hipsX * 0.7, 0, L.ankle.z + P.hipsZ * 0.7);
      home.applyMatrix4(this.rootMat); home.y = this.home.y;
      if (!L.init || this.teleport) { L.plant.copy(home); L.step = null; L.init = true; L.prevHome = home.clone(); L.vel = new V3(); L.swinging = false; L.from = new V3(); }
      if (dt > 0) { L.vel.copy(home).sub(L.prevHome).multiplyScalar(1 / dt); } L.prevHome.copy(home);
      if (fa > 0.5) { L.plant.copy(home); L.step = null; }
      // stepping
      let lift = 0;
      if (P.gait > 0.5 && fa < 0.5) {
        // a driven gait: each paw has its slot in the cycle; planted for the stance part, swung forward for the rest
        L.step = null;
        const ph = ((P.gaitPhase + (P.gaitOff ? P.gaitOff[f] : 0)) % 1 + 1) % 1;
        if (ph >= P.gaitDuty) {
          const sw = (ph - P.gaitDuty) / (1 - P.gaitDuty);
          if (!L.swinging) { L.swinging = true; L.from.copy(L.plant); }
          const T = P.gaitPeriod, ahead = (1 - sw) * (1 - P.gaitDuty) * T + P.gaitDuty * T * 0.5;
          _v3.copy(home).addScaledVector(L.vel, ahead);
          const k = sw * sw * (3 - 2 * sw);
          L.plant.lerpVectors(L.from, _v3, k);
          lift = Math.sin(Math.PI * sw) * P.gaitLift * (1 + 0.3 * Math.sin(Math.PI * sw));
        } else L.swinging = false;
      } else if (L.step) {
        const s = L.step; s.t += dt / s.dur;
        if (s.t >= 1) { L.plant.copy(s.to); L.step = null; } else {
          const k = s.t * s.t * (3 - 2 * s.t);
          L.plant.lerpVectors(s.from, s.to, k);
          lift = Math.sin(Math.PI * s.t) * s.h;
        }
      } else if (fa < 0.5) {
        const d = Math.hypot(home.x - L.plant.x, home.z - L.plant.z);
        const other = pairOf(f) === 'A' ? 'B' : 'A';
        if (d > P.stepThr && (!anyStepping[other] || d > P.stepThr * 2.6)) {
          L.step = { from: L.plant.clone(), to: home.clone(), t: 0, dur: THREE.MathUtils.clamp(0.20 - d * 0.5, 0.10, 0.20), h: 0.022 + d * 0.3 };
          anyStepping[pairOf(f)] = true;
        }
      }
      L.lift = lift + Math.max(0, oy);
      // planted target (model space)
      const tp = _v2.copy(L.plant); tp.y = this.home.y;
      this.toModel(tp);
      tp.x += ox * (1 - fa); tp.z += oz * (1 - fa);
      tp.y = L.ankle.y + lift + oy * (1 - fa);
      // carried target: rides on the chest or hips
      if (fa > 0) {
        const ta = _v3.copy(L.attachOff); ta.x += ox; ta.y += oy; ta.z += oz;
        ta.applyQuaternion(this.mq[L.attach]).add(this.mp[L.attach]);
        tp.lerp(ta, fa);
      }
      this.ik(L, tp, fa);
    }
  }

  ik(L, target, fa) {
    const [b1, b2, b3] = L.bones;
    const H = this.mp[b1];
    const d = _va.copy(target).sub(H);
    let a = d.length();
    const maxR = (L.l1 + L.l2) * 0.999, minR = Math.abs(L.l1 - L.l2) + 0.02;
    if (a > maxR) { d.multiplyScalar(maxR / a); a = maxR; }
    if (a < minR) { d.multiplyScalar(minR / a); a = minR; }
    const dir = _vb.copy(d).multiplyScalar(1 / a);
    // knees and elbows keep their natural bend direction, carried with the body
    const pole = _vc.copy(L.pole).applyQuaternion(this.mq[L.attach]);
    const bend = pole.addScaledVector(dir, -pole.dot(dir));
    if (bend.lengthSq() < 1e-8) bend.set(0, 0, L.front ? -1 : 1);
    bend.normalize();
    const cosH = THREE.MathUtils.clamp((L.l1 * L.l1 + a * a - L.l2 * L.l2) / (2 * L.l1 * a), -1, 1);
    const sinH = Math.sqrt(1 - cosH * cosH);
    const knee = _vd.copy(H).addScaledVector(dir, L.l1 * cosH).addScaledVector(bend, L.l1 * sinH);
    const ankle = _ve.copy(H).add(d);
    const n = _vf.crossVectors(dir, bend).normalize();
    // upper
    const d1 = _vg.copy(knee).sub(H).normalize();
    this.setModelQuat(b1, aimQuat(L.restB1, d1, n, _qa));
    this.fk(b2);
    const d2 = _vg.copy(ankle).sub(knee).normalize();
    this.setModelQuat(b2, aimQuat(L.restB2, d2, n, _qa));
    this.fk(b3);
    // foot: flat on the ground when planted, toes hanging when lifted or carried
    const hang = Math.min(1, L.lift * 9) * 0.5 + fa * 0.45;
    _qa.copy(this.mq[L.attach]);
    // keep only the turn (yaw) of the body for a planted foot
    const yaw = Math.atan2(2 * (_qa.w * _qa.y + _qa.x * _qa.z), 1 - 2 * (_qa.y * _qa.y + _qa.x * _qa.x));
    _qb.setFromAxisAngle(Y, yaw);
    _qb.slerp(_qa, fa);
    _qc.setFromAxisAngle(X, hang);
    this.setModelQuat(b3, _qb.multiply(_qc));
  }

  // ---------------------------------------------------------------- springs
  runSprings(P, dt) {
    const h = Math.min(dt, 1 / 30) / 2;
    for (const s of this.springs) {
      const n = s.bone;
      this.fk(n);
      const tipM = _v.copy(s.tip).applyQuaternion(this.mq[n]).add(this.mp[n]);
      const tipW = _v2.copy(tipM).applyMatrix4(this.rootMat);
      if (!s.init || this.teleport || dt <= 0) { s.p.copy(tipW); s.v.set(0, 0, 0); s.init = true; continue; }
      const stiff = s.stiff * (n.startsWith('tail') ? P.tailStiff : 1);
      for (let i = 0; i < 2; i++) {
        _v3.copy(tipW).sub(s.p).multiplyScalar(stiff).addScaledVector(s.v, -s.damp);
        s.v.addScaledVector(_v3, h); s.p.addScaledVector(s.v, h);
      }
      const base = _v3.copy(this.mp[n]).applyMatrix4(this.rootMat);
      const dA = _va.copy(tipW).sub(base).normalize();
      const dS = _vb.copy(s.p).sub(base).normalize();
      let ang = dA.angleTo(dS);
      if (ang > s.maxAng) {
        // pull the particle back onto the limit cone
        _q.setFromUnitVectors(dA, dS); _q2.identity().slerp(_q, s.maxAng / ang);
        dS.copy(dA).applyQuaternion(_q2);
        const len = tipW.distanceTo(base);
        s.p.copy(base).addScaledVector(dS, len);
        s.v.multiplyScalar(0.6);
        ang = s.maxAng;
      }
      if (ang > 1e-5) {
        // rotation in world, converted to model space
        _q.setFromUnitVectors(dA, dS);
        _q2.copy(this.rootQ).invert().multiply(_q).multiply(this.rootQ);
        this.setModelQuat(n, _q2.multiply(this.mq[n]));
      }
    }
    // children of spring bones that are not springs themselves
    this.fk('drop'); this.fk('crest2');
  }

  // ---------------------------------------------------------------- face
  face(P, dt) {
    // head follows the look target, eyes do the rest
    const head = this.mp.head, t = _v.copy(this.lookTarget).applyMatrix4(this.rootInv).sub(head);
    _q.copy(this.mq.chest).invert(); t.applyQuaternion(_q);
    const yawT = THREE.MathUtils.clamp(Math.atan2(t.x, t.z), -1.1, 1.1) * P.look;
    const pitchT = THREE.MathUtils.clamp(Math.atan2(t.y - 0.06, Math.hypot(t.x, t.z)), -0.6, 0.7) * P.look;
    const k = 1 - Math.exp(-dt * 7);
    if (this.teleport) { this.lookYaw = yawT; this.lookPitch = pitchT; }
    this.lookYaw += (yawT - this.lookYaw) * k; this.lookPitch += (pitchT - this.lookPitch) * k;
    // blink
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkT = 1.8 + Math.random() * 3.8; this.blink = 1e-3; if (Math.random() < 0.18) this.blinkT = 0.28; }
    let lid = 0;
    if (this.blink > 0) {
      this.blink += dt;
      const b = this.blink;
      lid = b < 0.06 ? b / 0.06 : b < 0.10 ? 1 : b < 0.24 ? 1 - (b - 0.10) / 0.14 : 0;
      if (b >= 0.24) this.blink = 0;
    }
    lid = Math.max(lid, P.blinkHold);
    // tiny eye darts
    this.saccT -= dt;
    if (this.saccT < 0) { this.saccT = 0.5 + Math.random() * 1.6; this.sacc.set((Math.random() - 0.5) * 0.10, (Math.random() - 0.5) * 0.06); }
    const remYaw = (yawT - this.lookYaw) * 0.5, remPitch = (pitchT - this.lookPitch) * 0.5;
    const gx = THREE.MathUtils.clamp(-remYaw * 0.9 + P.lookX + this.sacc.x * P.idle, -0.3, 0.3);
    const gy = THREE.MathUtils.clamp(remPitch * 0.9 + P.lookY + this.sacc.y * P.idle, -0.25, 0.25);
    this.gaze.x += (gx - this.gaze.x) * (1 - Math.exp(-dt * 30)); this.gaze.y += (gy - this.gaze.y) * (1 - Math.exp(-dt * 30));
    for (const [m, side] of [[this.D.mats.eyeL, 1], [this.D.mats.eyeR, -1]]) {
      const u = m.userData.uniforms;
      u.uGaze.value.set(this.gaze.x - side * 0.10, this.gaze.y);   // eyes sit on the sides of the head; turn them in a little
      u.uLidTop.value = Math.max(P.lidTop + P.brow * 0.10, lid);
      u.uLidBot.value = Math.max(P.lidBot + P.squint * 0.30, lid * 0.6);
      u.uSlit.value = P.slit;
      u.uLidTilt.value = P.lidTilt + P.brow * 0.5;
      u.uSmile.value = P.smile;
      u.uPupil.value = P.pupil;
      u.uGlow.value = P.eyeGlow;
    }
  }
}

const _e = new THREE.Euler();
const _va = new V3(), _vb = new V3(), _vc = new V3(), _vd = new V3(), _ve = new V3(), _vf = new V3(), _vg = new V3();
const _qa = new Q(), _qb = new Q(), _qc = new Q(), _qs = new Q();
const _mb = new THREE.Matrix4(), _mr = new THREE.Matrix4();

function pairOf(f) { return (f === 'FL' || f === 'HR') ? 'A' : 'B'; }
function basis(d, n) {
  const b = new V3().crossVectors(d, n).normalize();
  const n2 = new V3().crossVectors(b, d).normalize();
  return new THREE.Matrix4().makeBasis(d, n2, b);
}
/** Rotation that takes the rest frame (aim, plane normal) to the wanted aim and plane normal. */
function aimQuat(restBasis, d, n, out) {
  const b = _vc.crossVectors(d, n).normalize();
  const n2 = _vf.crossVectors(b, d).normalize();
  _mb.makeBasis(d, n2, b);
  _mr.copy(restBasis).transpose();
  _mb.multiply(_mr);
  return out.setFromRotationMatrix(_mb);
}

// ------------------------------------------------------------------ keyframe helpers
const EASE = {
  lin: (t) => t,
  io: (t) => t * t * (3 - 2 * t),
  in: (t) => t * t,
  in3: (t) => t * t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  out3: (t) => 1 - (1 - t) ** 3,
  back: (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  spring: (t) => 1 - Math.exp(-6 * t) * Math.cos(11 * t),
  hold: () => 0,
};
/** Keyframes: kf(t, [[time, value, easeIntoThisKey], ...]) */
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * (EASE[b[2] || 'io'])(u);
    }
  }
  return keys[keys.length - 1][1];
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const pulse = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t));
