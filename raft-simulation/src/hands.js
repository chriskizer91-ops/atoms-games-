import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Your arms, seen through your own eyes: a hand closed round whatever it
// holds (fingers of three joints each, knuckles, nails, a thumb laid over the
// top), a wrist, a forearm with some shape to it, and a sleeve rolled to the
// elbow. Everything about one arm is a handful of merged meshes, so two arms
// cost six draw calls.
//
// Hand frame (the same one the tools are built in): the grip runs along +Y
// through the origin, the back of the hand is on +x, the wrist is toward +z.
// The forearm carries on along +z. A left arm is the same thing mirrored.

const Y = new THREE.Vector3(0, 1, 0);
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpM = new THREE.Matrix4();

// A tapered limb segment from a to b.
function seg(a, b, ra, rb, sides = 10) {
  const d = tmpV.subVectors(b, a);
  const len = d.length();
  const g = new THREE.CylinderGeometry(rb, ra, len, sides, 1, true);
  tmpQ.setFromUnitVectors(Y, d.clone().normalize());
  g.applyQuaternion(tmpQ);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
function ball(p, r, sx = 1, sy = 1, sz = 1, w = 10, h = 8) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.scale(sx, sy, sz);
  g.translate(p.x, p.y, p.z);
  return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flat = (g) => (g.index ? g.toNonIndexed() : g);

// A chain of joints: tapered segments with a ball at every joint.
function chain(pts, radii, out, sides = 10) {
  for (let i = 0; i < pts.length; i++) {
    out.push(ball(pts[i], radii[i] * (i === 0 ? 1.1 : 1.02)));
    if (i < pts.length - 1) out.push(seg(pts[i], pts[i + 1], radii[i], radii[i + 1], sides));
  }
}

// A nail set into the top of a fingertip: thin along `normal`, lying along `along`.
function nail(tip, prev, normal, r, out) {
  const along = tip.clone().sub(prev).normalize();
  const n = normal.clone().addScaledVector(along, -normal.dot(along)).normalize();
  const side = new THREE.Vector3().crossVectors(along, n).normalize();
  const g = new RoundedBoxGeometry(0.0035, r * 1.45, r * 1.5, 2, 0.0015);
  tmpM.makeBasis(n, side, along);
  g.applyMatrix4(tmpM);
  const p = tip.clone().addScaledVector(along, -r * 0.45).addScaledVector(n, r * 0.86);
  g.translate(p.x, p.y, p.z);
  out.push(g);
}

// Where a cupped hand's fingers curve round: the middle and radius of what it holds.
export const CUP = { x: -0.035, z: -0.009, r: 0.078 };

// cup: an open hand under something round (food) instead of a fist round a handle.
function handGeometry(cup = false) {
  const skin = [];
  const nails = [];
  // Fingers: index at the top (+y), little finger at the bottom. Each wraps
  // the grip from the knuckle (back of the hand), over the front, and round
  // to the palm side.
  const fingers = [
    { y: 0.0335, len: 0.96, r: 0.0116 },
    { y: 0.0112, len: 1.0, r: 0.012 },
    { y: -0.0112, len: 0.95, r: 0.0114 },
    { y: -0.032, len: 0.8, r: 0.0101 },
  ];
  const cx = cup ? CUP.x : 0, cz = cup ? CUP.z : 0;
  const at = (a, R, y) => V(cx + R * Math.cos(a), y, cz - R * Math.sin(a));
  for (const f of fingers) {
    let pts;
    if (cup) {
      // Fingers a little spread, lying along the round of the thing.
      const a0 = -0.34, y = f.y * 1.22;
      const a1 = a0 + 0.6 * f.len, a2 = a1 + 0.48 * f.len, a3 = a2 + 0.4 * f.len;
      pts = [at(a0, CUP.r - 0.004, f.y), at(a1, CUP.r + 0.002, y), at(a2, CUP.r + 0.002, y * 1.08), at(a3, CUP.r, y * 1.12)];
    } else {
      const a0 = -0.34;
      const a1 = a0 + 1.36 * f.len;
      const a2 = a1 + 1.02 * f.len;
      const a3 = a2 + 0.8 * f.len;
      // Fingers close in toward each other a little at the tips.
      pts = [at(a0, 0.0365, f.y), at(a1, 0.0335, f.y * 0.98), at(a2, 0.0295, f.y * 0.95), at(a3, 0.0245, f.y * 0.92)];
    }
    chain(pts, [f.r * 1.06, f.r, f.r * 0.92, f.r * 0.84], skin);
    nail(pts[3], pts[2], V(pts[3].x - cx, 0, pts[3].z - cz).normalize(), f.r * 0.84, nails);
  }
  // Thumb: from the pad at the base of the palm, over the top of the grip,
  // to lie across the index finger.
  const th = cup
    ? [V(0.03, 0.04, 0.046), V(0.02, 0.07, 0.028), V(0.0, 0.087, 0.008), V(-0.022, 0.091, -0.012)]
    : [V(0.03, 0.04, 0.046), V(0.023, 0.057, 0.012), V(0.004, 0.0605, -0.018), V(-0.016, 0.053, -0.034)];
  chain(th, [0.016, 0.0138, 0.0124, 0.0112], skin);
  nail(th[3], th[2], cup ? V(0.5, 1, -0.2).normalize() : V(0.1, 1, -0.35).normalize(), 0.0112, nails);

  // Back of the hand and palm, the pads at the heel, and the wrist.
  // The back of the hand is a rounded pad, not a slab: fuller toward the knuckles.
  skin.push(ball(V(0.0365, 0, 0.044), 1, 0.0205, 0.05, 0.053, 16, 12));
  skin.push(ball(V(0.041, 0.004, 0.022), 1, 0.014, 0.043, 0.026, 12, 10));
  skin.push(ball(V(0.025, 0.031, 0.058), 0.024, 0.85, 1, 1.25));
  skin.push(ball(V(0.024, -0.03, 0.062), 0.022, 0.8, 1, 1.3));
  // tendons fanning from the wrist to the knuckles
  for (const f of fingers) skin.push(seg(V(0.052, f.y * 0.55, 0.082), V(0.05, f.y, 0.016), 0.0045, 0.0055, 6));
  const wrist = new THREE.CylinderGeometry(0.0335, 0.031, 0.08, 14, 1, true);
  wrist.rotateX(Math.PI / 2);
  wrist.scale(0.8, 1, 1);
  wrist.translate(0.031, 0, 0.118);
  skin.push(wrist);
  // The little bone that stands out at the side of the wrist.
  skin.push(ball(V(0.05, -0.022, 0.108), 0.011, 0.7, 1, 1.2));
  return {
    skin: mergeGeometries(skin.map(flat)),
    nails: mergeGeometries(nails.map(flat)),
  };
}

// Forearm from the wrist back past the elbow, with muscle toward the elbow.
function forearmGeometry() {
  const prof = [[0.15, 0.0318], [0.2, 0.034], [0.27, 0.0395], [0.35, 0.0455], [0.43, 0.0475], [0.52, 0.046], [0.6, 0.045]];
  const pts = prof.map(([z, r]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(pts, 16);
  g.rotateX(Math.PI / 2);
  g.scale(0.86, 1, 1);
  g.translate(0.03, 0, 0);
  return g;
}

// Sleeve rolled up to the elbow: soft folds along it and a fat rolled cuff.
function sleeveGeometry() {
  const pts = [];
  for (let k = 0; k <= 12; k++) {
    const z = 0.43 + (0.24 * k) / 12;
    pts.push(new THREE.Vector2(0.06 + 0.0035 * Math.sin(k * 2.1) + 0.006 * (k / 12), z));
  }
  const g = new THREE.LatheGeometry(pts, 18);
  g.rotateX(Math.PI / 2);
  g.translate(0.03, 0, 0);
  const parts = [flat(g)];
  for (const [z, r] of [[0.425, 0.0165], [0.447, 0.014]]) {
    const t = new THREE.TorusGeometry(0.058, r, 8, 20);
    t.translate(0.03, 0, z);
    parts.push(flat(t));
  }
  const cuff = mergeGeometries(parts.slice(1));
  return { sleeve: parts[0], cuff };
}

let GEO = null;
function geo() {
  if (!GEO) {
    const fist = handGeometry(false), cup = handGeometry(true);
    GEO = { fist: fist.skin, fistNails: fist.nails, cup: cup.skin, cupNails: cup.nails, forearm: forearmGeometry(), ...sleeveGeometry() };
  }
  return GEO;
}

// The wrist joint, in the arm's frame: the hand bends here.
const WRIST = new THREE.Vector3(0.031, 0, 0.135);

// mats: { skin, nail, sleeve, cuff }. Returns the arm group, with `hand`: the
// group to hang a held thing in (its origin is the middle of the grip).
export function makeArm(mats, { left = false } = {}) {
  const G = geo();
  const arm = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.copy(WRIST);
  const hand = new THREE.Group();
  hand.position.copy(WRIST).negate();
  pivot.add(hand);
  const fist = new THREE.Group();
  fist.add(new THREE.Mesh(G.fist, mats.skin), new THREE.Mesh(G.fistNails, mats.nail));
  const cup = new THREE.Group();
  cup.add(new THREE.Mesh(G.cup, mats.skin), new THREE.Mesh(G.cupNails, mats.nail));
  cup.visible = false;
  hand.add(fist, cup);
  const forearm = new THREE.Mesh(G.forearm, mats.skin);
  const sleeve = new THREE.Mesh(G.sleeve, mats.sleeve);
  const cuff = new THREE.Mesh(G.cuff, mats.cuff);
  arm.add(pivot, forearm, sleeve, cuff);
  if (left) arm.scale.x = -1;

  const ex = new THREE.Vector3(), ey = new THREE.Vector3(), ez = new THREE.Vector3(), m = new THREE.Matrix4();
  return {
    arm, hand, forearm, sleeve, cuff,
    setCup(on) { fist.visible = !on; cup.visible = on; },
    // Place the arm: the grip at `pos`, the forearm running back along `fore`
    // (hand toward elbow), and the grip axis along `grip`, as near as the
    // wrist allows. All in the space the arm lives in.
    pose(pos, fore, grip) {
      ez.copy(fore).normalize();
      const along = grip.dot(ez) / grip.length();
      ey.copy(grip).addScaledVector(ez, -grip.dot(ez)).normalize();
      ex.crossVectors(ey, ez);
      m.makeBasis(ex, ey, ez);
      arm.quaternion.setFromRotationMatrix(m);
      arm.position.copy(pos);
      // What is left over is the wrist's to make up: at most about 40 degrees.
      const dev = Math.max(-0.7, Math.min(0.7, Math.asin(Math.max(-1, Math.min(1, along)))));
      pivot.rotation.x = dev;
    },
  };
}

export function handMaterials(base) {
  const skin = base.skin.clone();
  skin.roughness = 0.6;
  const nail = new THREE.MeshStandardMaterial({ color: skin.color.clone().lerp(new THREE.Color(0xf2d6cc), 0.55), roughness: 0.35 });
  return { skin, nail };
}
