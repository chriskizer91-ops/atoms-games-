import * as THREE from 'three';
import { buildBody } from './body.js';

// The player's body, for a third-person view: one of Moon Faire's "fair folk"
// (a code-built, skinned person in a painted skin), carried over from that
// game's three r128 kit.
//   kit/rig.js   the kit's skeleton and motion, cut out of it (generated)
//   folk/*.js    each person baked at a quarter of the triangles (generated)
//   body.js      meshes and materials for three r186
//   castaway.js  what the raft game asks of a body: this file
//   port/        the scripts that made kit/ and folk/ from the Moon Faire sources
//
//   const me = await createCastaway();           // or { id: 'pie-seller' }; { glow } see below
//   scene.add(me.root);                          // feet on y = 0, faces +z, real size
//   me.update(dt, s);                            // every frame
//   me.play('stab');                             // 'stab' 'swing' 'throw' 'eat' 'wave'; false if unknown
//   me.handR.add(spearModel);                    // a tool with its grip along +Y through its origin
//
// s, all optional:
//   speed   m/s over the ground (through the water when swimming). The feet keep step with it.
//   run     0..1, walk cycle to run cycle. Left out, it follows the speed: this body walks at about
//           0.9 m/s and is running by 2.4, so the game's 3.6 m/s walk is a run here.
//   moving  0..1. Left out, it is speed > 0.05.
//   swim    0..1, in the water. Moving: lies forward, head up, crawl stroke and flutter kick. Still:
//           upright, treading, hands sculling. Sink root by me.shoulderHeight to put the shoulders awash.
//   hold    null | 'hook' | 'spear' | 'hammer' | 'food': the right forearm comes up and the fist closes.
//   steer   0..1: both fists forward on a tiller (the right keeps its tool if it has one).
//
// glow (createCastaway({ glow }) or me.glow = ...): Moon Faire's skin is partly self-lit, for a night fair.
// 1 is as there; the default 0.25 keeps a face readable under a hat brim without shining after dark. For none
// at night, follow the daylight: me.glow = 0.3 * daylight.
//
// Space: metres, y up. With root.rotation.y = 0 the person faces +z and their
// LEFT is +x. Every bone rests unrotated, so at rest a bone's local axes are
// the person's own: +x their left, +y up, +z forward. me.bones has them by
// name: hips spine1-3 neck head, and for each side (R, L) clav uarm farm hand
// thigh shin foot toe, plus three joints each of thb idx mid rng pnk.

const FOLK = {
  'farm-lad': () => import('./folk/farm-lad.js'),
  'pie-seller': () => import('./folk/pie-seller.js'),
};
export const CASTAWAYS = Object.keys(FOLK);

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const lerp = (a, b, t) => a + (b - a) * t;

// Where the body turns about when it lies forward to swim, and how far.
const HIP_Y = 0.86, PRONE = 1.34, TREAD = 0.14;

// Carrying a tool: where the right wrist goes (the person's own space, as in
// the kit's pose language), the way the elbow points, forearm twist, wrist
// [bend, side-to-side], and which finger pose.
const HOLD = {
  hook: { h: [-0.26, 0.98, 0.22], e: [-0.6, -0.4, -0.9], tw: 0.1, wr: [0.0, 0.2], f: 'grip' },
  spear: { h: [-0.275, 0.95, 0.17], e: [-0.6, -0.3, -1], tw: 0.2, wr: [0.0, 0.35], f: 'grip' },
  hammer: { h: [-0.265, 1.0, 0.22], e: [-0.6, -0.4, -0.9], tw: 0.15, wr: [0.0, 0.15], f: 'grip' },
  food: { h: [-0.2, 1.08, 0.28], e: [-0.7, -0.6, -0.6], tw: 1.0, wr: [0.1, 0], f: 'cup' },
};
// Both fists forward on a tiller at waist height.
const STEER = { y: 1.0, z: 0.36, x: 0.085 };
// Where a grip sits in the kit's hand: [out of the palm, toward the fingertips (negative), toward the thumb], metres.
const GRIP = [0.03, -0.088, 0.004];
// the pose channels of each side, by name
const SIDES = [
  { s: -1, h: 'hR', e: 'eR', tw: 'twR', wr: 'wrR', f: 'fR', ft: 'ftR', kn: 'knR' },
  { s: 1, h: 'hL', e: 'eL', tw: 'twL', wr: 'wrL', f: 'fL', ft: 'ftL', kn: 'knL' },
];
const NONE = {};

export async function createCastaway(opts = {}) {
  const t0 = performance.now();
  const id = opts.id || 'farm-lad';
  if (!FOLK[id]) throw new Error(`no castaway called ${id}`);
  const { default: D } = await FOLK[id]();
  const st = {
    t: 0, phase: 0, wb: 0, rb: 0, sw: 0, mv: 0, stride: 1,
    holdK: 0, steerK: 0, stroke: 0, tread: 0,
    hh: [0, 0, 0], he: [0, 0, 0], htw: 0, hwr: [0, 0], hf: [0, 0, 0, 0, 0, 0],
  };
  const body = await buildBody(D, { onBase, glow: opts.glow });
  const J = body.rig, SK = J.SK, FP = J.FP, size = J.root.scale.y;

  const root = new THREE.Group();
  root.name = `castaway:${id}`;
  root.add(J.root);
  const meshes = body.meshes;

  // ----- hand anchors -----
  // handR is the frame of the game's own first-person hand (tools.js makeHand):
  // the origin is where the fingers close; +Y runs along the grip and comes
  // out of the fist on the thumb side (a spear's point, a hammer's head);
  // +X points from the grip toward the back of the hand; +Z runs up the
  // forearm toward the elbow. So a model sits in handR exactly as it sits in
  // the view-model hand. handL is the mirror image: +Y out of the thumb side,
  // +Z toward the elbow, and the back of the hand on -X.
  const A = 15 * Math.PI / 180, HS = 0.93;
  function anchor(S, s) {
    const g = new THREE.Group();
    g.name = `grip${S}`;
    const c = Math.cos(s * A), sn = Math.sin(s * A);
    // a point of the kit's right hand (fingers -y, palm +x, thumb +z), on either wrist
    const at = (x, y, z) => new THREE.Vector3(-s * x * HS * c - y * HS * sn, -s * x * HS * sn + y * HS * c, z * HS);
    g.position.copy(at(GRIP[0], GRIP[1], GRIP[2]));
    const zt = new THREE.Vector3(-sn, c, 0);                 // up the forearm
    const yt = new THREE.Vector3(0, 0, 1);                   // thumb side
    const xt = new THREE.Vector3().crossVectors(yt, zt);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xt, yt, zt));
    SK[`hand${S}`].add(g);
    return g;
  }
  const handR = anchor('R', -1), handL = anchor('L', 1);

  // ----- one-shot moves, in the kit's pose language (see Moon Faire's EMOTE-KIT.md) -----
  // A move fades in over 0.18 s and out over its last 0.22 s, so the blow of a short one lands near 0.2 s.
  J.defAction('stab', 0.45, [
    { t: 0.07, hR: [-0.31, 0.97, -0.14], eR: [-0.5, -0.2, -1], fR: FP.fist, twR: 0.1, wrR: [0, -0.25], sp: [-0.22, 0.02, 0], hd: [0.12, 0, 0] },
    { t: 0.2, hR: [-0.2, 0.98, 0.52], eR: [-0.6, -0.6, -0.5], wrR: [0, 0.75], sp: [0.26, 0.2, 0], hd: [-0.14, 0, 0] },
    { t: 0.27, hR: [-0.2, 0.97, 0.5] },
  ], { outro: 0.16 });
  J.defAction('swing', 0.5, [
    { t: 0.12, hR: [-0.24, 1.56, -0.2], eR: [-0.7, 1, 0.5], fR: FP.fist, twR: 0.0, wrR: [0, -0.3], sp: [-0.1, -0.1, 0], hd: [0, -0.06, 0] },
    { t: 0.25, hR: [-0.2, 0.93, 0.44], eR: [-0.7, -0.6, -0.5], wrR: [0, 0.8], sp: [0.1, 0.3, 0], hd: [0, 0.12, 0] },
    { t: 0.31, hR: [-0.2, 0.91, 0.44] },
  ], { outro: 0.17 });
  J.defAction('throw', 0.5, [
    { t: 0.12, hR: [-0.36, 1.55, -0.2], eR: [-1, -0.3, -0.6], fR: FP.fist, twR: -0.4, wrR: [-0.3, 0], sp: [-0.3, -0.06, 0], hd: [0.1, -0.04, 0] },
    { t: 0.23, hR: [-0.2, 1.5, 0.42], eR: [-0.8, -0.6, -0.3], fR: FP.open, wrR: [0.3, 0], sp: [0.28, 0.16, 0], hd: [-0.1, 0.03, 0] },
    { t: 0.31, hR: [-0.1, 1.2, 0.5], fR: FP.open },
  ], { outro: 0.17 });
  J.defAction('eat', 1.0, [
    { t: 0.3, hR: [-0.07, 1.35, 0.17], eR: [-0.5, -1, -0.2], fR: FP.cup, twR: 1.1, wrR: [0.4, 0], hd: [0, 0.12, 0], mouth: 1 },
    { t: 0.45, hR: [-0.06, 1.37, 0.16], mouth: 0 }, { t: 0.58, hR: [-0.07, 1.35, 0.17], mouth: 1 }, { t: 0.72, hR: [-0.06, 1.37, 0.16], mouth: 0 },
  ], { outro: 0.26 });
  J.defAction('wave', 1.9, [
    { t: 0.3, hR: [-0.38, 1.5, 0.12], eR: [-1, -0.5, -0.2], fR: FP.open, twR: -0.5, wrR: [-0.15, 0.35], hd: [-0.08, -0.04, -0.06], sp: [-0.05, 0, -0.03], mouth: 2 },
    { t: 0.55, hR: [-0.44, 1.52, 0.12], wrR: [-0.15, -0.4] }, { t: 0.8, hR: [-0.35, 1.52, 0.12], wrR: [-0.15, 0.4] },
    { t: 1.05, hR: [-0.44, 1.52, 0.12], wrR: [-0.15, -0.4] }, { t: 1.3, hR: [-0.36, 1.5, 0.12], wrR: [-0.15, 0.2], mouth: 2 }, { t: 1.6, mouth: 0 },
  ], { outro: 0.5 });
  const MOVES = ['stab', 'swing', 'throw', 'eat', 'wave'];

  // ----- the layer between the kit's idle/walk/run and a one-shot move -----
  // Called by the kit with its base pose B each frame. Nothing here allocates.
  const _h = [0, 0, 0];
  const mix3 = (o, v, k) => { o[0] += (v[0] - o[0]) * k; o[1] += (v[1] - o[1]) * k; o[2] += (v[2] - o[2]) * k; };
  // a point given standing (the person's own space) -> where it is once the body lies forward by `a` about the hips
  function tilt(x, y, z, a, out) {
    const c = Math.cos(a), s = Math.sin(a), dy = y - HIP_Y;
    out[0] = x; out[1] = HIP_Y + dy * c - z * s; out[2] = dy * s + z * c;
    return out;
  }
  const turn = (x, y, z, a, out) => { const c = Math.cos(a), s = Math.sin(a); out[0] = x; out[1] = y * c - z * s; out[2] = y * s + z * c; return out; };
  function onBase(B) {
    // longer steps once the legs cannot turn over any faster
    if (st.stride !== 1) { B.ftR[2] *= st.stride; B.ftL[2] *= st.stride; }
    // carrying a tool in the right hand
    if (st.holdK > 0.001) {
      const k = st.holdK * (1 - 0.15 * st.wb) * (1 - st.sw);
      mix3(B.hR, st.hh, k); mix3(B.eR, st.he, k);
      B.twR += (st.htw - B.twR) * k; B.wrR[0] += (st.hwr[0] - B.wrR[0]) * k; B.wrR[1] += (st.hwr[1] - B.wrR[1]) * k;
      for (let i = 0; i < 6; i++) B.fR[i] += (st.hf[i] - B.fR[i]) * st.holdK;
    }
    // both hands on a tiller
    if (st.steerK > 0.001) {
      const k = st.steerK * (1 - st.sw);
      for (let i = 0; i < 2; i++) {
        const C = SIDES[i], s = C.s, h = B[C.h], e = B[C.e], w = B[C.wr], f = B[C.f];
        if (s < 0 && st.holdK > 0.5) continue;               // the right hand keeps its tool
        _h[0] = s * STEER.x; _h[1] = STEER.y; _h[2] = STEER.z; mix3(h, _h, k);
        _h[0] = s * 0.7; _h[1] = -0.6; _h[2] = -0.6; mix3(e, _h, k);
        B[C.tw] += (0.35 - B[C.tw]) * k; w[0] += (0 - w[0]) * k; w[1] += (-0.2 - w[1]) * k;
        for (let j = 0; j < 6; j++) f[j] += (FP.grip[j] - f[j]) * k;
      }
      B.sp[1] += 0.06 * k;
    }
    // in the water: lying forward and swimming when moving, upright and treading when not
    if (st.sw > 0.001) {
      const k = st.sw, go = st.mv, a = lerp(TREAD, PRONE, go) * k;
      B.hipR[0] *= 1 - k; B.hipR[2] *= 1 - k; B.hipR[1] += (a - B.hipR[1]) * k;
      B.hip[0] *= 1 - k; B.hip[1] *= 1 - k; B.hip[2] *= 1 - k;
      const roll = Math.sin(st.stroke) * 0.2 * go;
      B.hipR[2] += roll * 0.5 * k;
      B.sp[0] += (-roll * 0.9 - B.sp[0]) * k; B.sp[1] += (lerp(-0.04, -0.3, go) - B.sp[1]) * k; B.sp[2] += (roll * 0.6 - B.sp[2]) * k;
      B.hd[0] += (0 - B.hd[0]) * k; B.hd[1] += (lerp(-0.08, -0.9, go) - B.hd[1]) * k; B.hd[2] *= 1 - k;
      B.sh[0] += (0.1 - B.sh[0]) * k; B.sh[1] += (0.1 - B.sh[1]) * k;
      for (let i = 0; i < 2; i++) {
        const C = SIDES[i], s = C.s, h = B[C.h], e = B[C.e], w = B[C.wr], f = B[C.ft], kn = B[C.kn], fg = B[C.f];
        // arms. Crawl: reach past the head, pull down under the chest to the hip, lift out and carry forward over the water.
        const ps = st.stroke + (i ? Math.PI : 0), cs = Math.cos(ps), sn = Math.sin(ps), rec = Math.max(0, -sn);
        const cx = s * (0.19 + 0.17 * rec), cy = 1.27 + 0.45 * cs, cz = 0.06 + (sn > 0 ? 0.3 * sn : 0.2 * sn);
        // Treading: the hands scull out and in just under the surface.
        const pt = st.tread + (i ? 0.6 : 0), tx = s * (0.3 + 0.1 * Math.sin(pt)), ty = 1.14 + 0.02 * Math.sin(pt * 2), tz = 0.27 + 0.06 * Math.cos(pt);
        tilt(lerp(tx, cx, go), lerp(ty, cy, go), lerp(tz, cz, go), a, _h); mix3(h, _h, k);
        turn(s * lerp(1, 0.9, go), lerp(-0.9, 0, go), lerp(-0.5, -0.5 - 0.8 * rec, go), a, _h); mix3(e, _h, k);
        B[C.tw] += (lerp(0.9, 0.5, go) - B[C.tw]) * k;
        w[0] += (0.05 - w[0]) * k; w[1] *= 1 - k;
        for (let j = 0; j < 6; j++) fg[j] += (FP.soft[j] - fg[j]) * k;
        // legs. Crawl: a flutter kick from the hip, legs long. Treading: the knees up a little, the feet circling.
        const pk = st.stroke * 3 + (i ? Math.PI : 0), kick = 0.24 * Math.sin(pk);
        const fx = s * 0.085, fy = HIP_Y - 0.025 - 0.715 * Math.cos(kick), fz = 0.715 * Math.sin(kick) + 0.02;
        const pl = st.tread * 0.9 + (i ? Math.PI : 0);
        const lx = s * (0.15 + 0.06 * Math.cos(pl)), ly = 0.33 + 0.06 * Math.sin(pl), lz = 0.1 + 0.14 * Math.cos(pl);
        tilt(lerp(lx, fx, go), lerp(ly, fy, go), lerp(lz, fz, go), a, _h);
        f[0] += (_h[0] - s * 0.081 - f[0]) * k; f[1] += (_h[1] - 0.105 - f[1]) * k; f[2] += (_h[2] + 0.012 - f[2]) * k;
        f[3] += (s * 0.1 - f[3]) * k; f[4] += (lerp(0.45, 0.75, go) - f[4]) * k; f[5] *= 1 - k; f[6] += (1 - f[6]) * k;
        turn(s * lerp(0.35, 0.1, go), 0, 1, a, _h); mix3(kn, _h, k);
      }
    }
  }

  // ----- measurements, standing at rest -----
  const _v = new THREE.Vector3(), _n = new THREE.Vector3();
  const headPoint = (y, z, out) => { const r = SK.head.userData.rest; return root.worldToLocal(out.set(-r.x, y - r.y, z - r.z).applyMatrix4(SK.head.matrixWorld)); };
  J.animate(0, 0, 0, 0, 0);
  root.updateMatrixWorld(true);
  const height = headPoint(1.645, 0, _v).y;
  const eyeHeight = headPoint(1.5246, 0.09, _v).y;
  const neckRest = root.worldToLocal(SK.neck.getWorldPosition(new THREE.Vector3())).clone();
  // a tool keeps its own size in the hand of a taller or shorter person
  for (const g of [handR, handL]) { g.parent.getWorldScale(_v); g.scale.setScalar(3 / (_v.x + _v.y + _v.z)); }
  const shoulderHeight = neckRest.y - 0.035 * size;

  const api = {
    id, name: D.name, root, skin: D.skin,
    height, eyeHeight,      // metres: the top of the head (without a hat), and the eyes
    // the waterline for swim = 1: sink root by this much and the shoulders are awash, swimming or treading
    shoulderHeight,
    bones: SK, handR, handL,
    meshes,                 // the four skinned meshes: cloth, flat, hand, face (for layers or render order)
    triangles: D.triangles, drawCalls: meshes.length, buildMs: 0,
    // how much of Moon Faire's self-lit skin is kept (see opts.glow); can be changed at any time
    get glow() { return body.glow; }, set glow(v) { body.glow = v; },

    update(dt, s) {
      dt = clamp(dt || 0, 0, 0.1);
      s = s || NONE;
      st.t += dt;
      const speed = s.speed || 0, swim = clamp(s.swim || 0, 0, 1);
      const moving = s.moving == null ? (speed > 0.05 ? 1 : 0) : clamp(s.moving, 0, 1);
      // run: given, or read off the speed (this body walks at 0.9 m/s and runs from about 2.2)
      const run = s.run == null ? smooth(1.3, 2.4, speed / size) : clamp(s.run, 0, 1);
      st.sw += (swim - st.sw) * Math.min(1, dt * 5);
      st.mv += (moving - st.mv) * Math.min(1, dt * 4);
      st.wb += (moving * (1 - swim) - st.wb) * Math.min(1, dt * 8);
      st.rb += (run * (1 - swim) - st.rb) * Math.min(1, dt * 5);
      // feet in step with the ground covered: 0.82 m to a walking stride, 1.5 m to a running one. Past the fastest the
      // legs can turn over (about 3 m/s running), the steps lengthen by up to a third and after that the feet slide.
      if (st.wb > 0.001) {
        const want = Math.max(2, speed / size * lerp(7.66, 4.2, st.rb)), top = lerp(9, 12.6, st.rb), rate = Math.min(want, top);
        st.stride = clamp(want / top, 1, 1.33);
        st.phase += dt * rate;
        if (st.phase > 1e4) st.phase -= TAU * 1000;
      } else st.stride = 1;
      if (st.sw > 0.001) { st.stroke += dt * (2.4 + 1.1 * speed) * st.mv; st.tread += dt * 4.2; }
      // the tool in the right hand
      const hold = s.hold && HOLD[s.hold] ? s.hold : null;
      if (hold) {
        const H = HOLD[hold], k = st.holdK < 0.02 ? 1 : Math.min(1, dt * 10);
        mix3(st.hh, H.h, k); mix3(st.he, H.e, k); st.htw += (H.tw - st.htw) * k; st.hwr[0] += (H.wr[0] - st.hwr[0]) * k; st.hwr[1] += (H.wr[1] - st.hwr[1]) * k;
        const f = FP[H.f]; for (let i = 0; i < 6; i++) st.hf[i] += (f[i] - st.hf[i]) * k;
      }
      st.holdK += ((hold ? 1 : 0) - st.holdK) * Math.min(1, dt * 9);
      st.steerK += (clamp(s.steer || 0, 0, 1) - st.steerK) * Math.min(1, dt * 6);

      J.animate(st.phase, st.wb, st.t, dt, st.rb);

      // swimming: the body turned about its hips, so carry it back until the shoulders are where they stand
      if (st.sw > 0.001) {
        _n.setFromMatrixPosition(SK.neck.matrixWorld); root.worldToLocal(_n);
        const hp = SK.hips.position, sx = J.root.scale;
        hp.x += (neckRest.x - _n.x) / sx.x * st.sw; hp.y += (neckRest.y - _n.y) / sx.y * st.sw; hp.z += (neckRest.z - _n.z) / sx.z * st.sw;
        SK.hips.updateMatrixWorld(true);
      }
    },

    play(name) { return MOVES.includes(name) ? J.play(name, true) : false; },
    get busy() { return J.busy; },
    get action() { return J.action; },
    stop() { J.stop(); },

    setVisible(b) { root.visible = !!b; },
    dispose() {
      root.removeFromParent();
      body.dispose();
    },
  };
  api.buildMs = performance.now() - t0;
  return api;
}
