// Drizzlon's nine moves. Each one is a little performance: a wind-up you can read,
// the action itself, a hit that lands on a real target, and a settle back to rest.
import * as THREE from 'three';
import { kf, smooth, pulse, clamp01 } from './rig.js';
import { rand, makeSprite } from './fx.js';
import { makeWaterMaterial } from './materials.js';

const V3 = THREE.Vector3;
const v = (x, y, z) => new V3(x, y, z);
const _a = v(), _b = v(), _c = v();
export const MOVES = {};
export const MOVE_LIST = [];
function def(id, m) { m.id = id; MOVES[id] = m; MOVE_LIST.push(m); }

const FWD = v(0, 0, 1);
/** The fighting face: brows down, cheeks up, pupils narrowed to slits. */
const fierce = (P, k) => { P.brow = k; P.squint = 0.75 * k; P.slit = k; P.lidTop = 0.2 + 0.12 * k; P.pupil = 1 - 0.12 * k; };
const feet = (P, which, a, x, y, z) => { for (const f of which) { P['fa' + f] = a; P['fx' + f] = (f[1] === 'L' ? 1 : -1) * x; P['fy' + f] = y; P['fz' + f] = z; } };
const FRONT = ['FL', 'FR'], HIND = ['HL', 'HR'], ALL = ['FL', 'FR', 'HL', 'HR'];
const footDust = (c, n = 6, power = 1) => { for (const f of ALL) { const L = c.rig.legs[f]; _a.copy(L.plant).setY(0.03); c.fx.dust(_a, n, { speed: 0.6 * power, size: 0.14 * power, alpha: 0.3 }); } };
function bezier(pts) {
  const tmp = pts.map(() => v());
  return (u, out) => {
    for (let i = 0; i < pts.length; i++) tmp[i].copy(pts[i]);
    for (let n = pts.length - 1; n > 0; n--) for (let i = 0; i < n; i++) tmp[i].lerp(tmp[i + 1], u);
    return out.copy(tmp[0]);
  };
}
/** Little rising or falling glints that say "stat went up / down". */
function statGlints(c, pos, up, color, n = 16) {
  for (let i = 0; i < n; i++) c.fx.after(i * 0.03, () => {
    _a.set(pos.x + rand(-0.22, 0.22), pos.y + (up ? rand(0, 0.25) : rand(0.5, 0.8)), pos.z + rand(-0.22, 0.22));
    c.fx.glows.add({ x: _a.x, y: _a.y, z: _a.z, vx: 0, vy: up ? 0.9 : -0.9, vz: 0, t: 0, life: 0.7, s0: 0.07, s1: 0.02, a: 0.95, fin: 0.15, r: color[0], gc: color[1], b: color[2], drag: 0.5 });
  });
}

// =================================================================== TACKLE
def('tackle', {
  name: 'Tackle', type: 'Normal', kind: 'basic', dur: 1.7, blurb: 'A low, shoulder-first charge.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.15, 1.2, 1.6) * 0.8;
    // wind up: sink back over the hind legs, head low, frills pinned
    const wind = pulse(t, 0.0, 0.28, 0.34, 0.42), dash = pulse(t, 0.34, 0.40, 0.52, 0.56), hitK = pulse(t, 0.52, 0.55, 0.62, 0.74);
    const back = pulse(t, 0.66, 0.80, 1.08, 1.16);
    P.rootZ = kf(t, [[0, 0], [0.30, -0.06, 'out'], [0.36, -0.04, 'in'], [0.53, 0.86, 'lin'], [0.66, 0.80, 'out'], [1.12, 0, 'io'], [1.25, -0.035, 'out'], [1.45, 0, 'io']]);
    P.rootY = kf(t, [[0.36, 0], [0.45, 0.07, 'out'], [0.53, 0.03, 'in'], [0.66, 0.02], [0.88, 0.17, 'out'], [1.12, 0, 'in']]);
    P.hipsY += -0.055 * wind - 0.03 * dash - 0.05 * pulse(t, 1.10, 1.16, 1.2, 1.4);
    P.hipsZ += -0.05 * wind + 0.03 * hitK;
    P.pitch += -0.10 * wind + 0.06 * dash - 0.12 * hitK + 0.22 * back - 0.06 * pulse(t, 1.10, 1.16, 1.2, 1.4);
    P.neckPitch += -0.30 * wind - 0.42 * dash - 0.25 * hitK + 0.1 * back;
    P.headPitch += 0.10 * wind + 0.20 * dash + 0.05 * hitK;
    P.look = 1 - 0.7 * pulse(t, 0.3, 0.36, 0.6, 0.8);
    P.earBack += pulse(t, 0.05, 0.25, 0.62, 0.9);
    fierce(P, pulse(t, 0.04, 0.24, 0.85, 1.25)); P.blinkHold = pulse(t, 0.50, 0.53, 0.60, 0.70);
    P.jaw = kf(t, [[0, 0.12], [0.25, 0.0], [0.52, 0.0], [0.56, 0.45, 'out'], [0.9, 0.2], [1.3, 0.3], [1.7, 0.12]]);
    P.tailLift += 0.9 * wind - 1.6 * dash + 0.8 * back; P.tailBase += -0.5 * dash + 0.3 * hitK; P.tailStiff = 1 + 1.5 * dash;
    P.wingOpen += -0.14 * dash + 0.5 * back + 0.25 * pulse(t, 0.52, 0.56, 0.6, 0.7); P.wingFlap += 0.35 * back;
    P.sz = 1 + 0.07 * dash - 0.10 * pulse(t, 0.52, 0.55, 0.58, 0.68); P.sy = 1 - 0.03 * dash + 0.06 * pulse(t, 0.52, 0.55, 0.58, 0.68) - 0.07 * pulse(t, 1.10, 1.15, 1.18, 1.34);
    // legs: pounce out long, gather, hop back
    const air1 = pulse(t, 0.36, 0.40, 0.50, 0.54), air2 = pulse(t, 0.68, 0.74, 1.04, 1.12);
    P.air = Math.max(air1, air2);
    feet(P, FRONT, 0, 0, 0.03 * air1 + 0.05 * air2, 0.11 * air1 + 0.02 * air2);
    feet(P, HIND, 0, 0, 0.02 * air1 + 0.06 * air2, -0.12 * air1 + 0.05 * air2);
    P.spinePitch += 0.12 * wind - 0.1 * dash;
  },
  events: [
    [0.36, (c) => { for (const f of HIND) { _a.copy(c.rig.legs[f].plant).setY(0.03); c.fx.dust(_a, 8, { dir: v(0, 0.3, -1), push: 1.2, speed: 1.0 }); } }],
    [0.53, (c) => {
      const p = c.dummy.center(v()).add(v(0, -0.02, -0.03));
      c.dummy.hit(FWD, 1.05); c.fx.impact(p, 1.1, FWD); c.fx.dust(v(p.x, 0.05, p.z), 12, { speed: 1.2 });
      c.stage.addShake(0.55); c.stage.hitStop(0.075);
    }],
    [1.12, (c) => footDust(c, 4, 0.8)],
  ],
  cam(t, c) {
    const k = smooth(0.25, 0.55, t), z = c.rig.rootPos.z;
    c.stage.setShot(_a.set(-2.3 + 0.3 * k, 0.42, 0.9 + z * 0.45), _b.set(0, 0.34, 0.55 + z * 0.55), 30 - 4 * pulse(t, 0.3, 0.55, 0.7, 1.0));
  },
});

// =================================================================== GROWL
def('growl', {
  name: 'Growl', type: 'Normal', kind: 'util', dur: 2.2, blurb: 'A rattling growl that saps the foe\'s Attack.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.2, 1.7, 2.1) * 0.85;
    const inh = pulse(t, 0.0, 0.42, 0.50, 0.60), roar = pulse(t, 0.52, 0.62, 1.50, 1.75), vib = roar;
    P.stance = 0.022 * pulse(t, 0.1, 0.4, 1.7, 2.1);
    P.pitch += 0.13 * inh - 0.11 * roar; P.hipsZ += -0.03 * inh + 0.045 * roar; P.hipsY += 0.012 * inh - 0.04 * roar;
    P.neckPitch += 0.28 * inh - 0.22 * roar; P.headPitch += 0.22 * inh + 0.12 * roar;
    P.chestY += 0.012 * inh; P.sy = 1 + 0.035 * inh - 0.015 * roar; P.sx = 1 + 0.03 * inh;
    P.jaw = kf(t, [[0, 0.12], [0.4, 0.02], [0.52, 0.05], [0.62, 1.05, 'out3'], [1.5, 0.95], [1.75, 0.15], [2.2, 0.12]]) + Math.sin(t * 61) * 0.035 * vib;
    P.headRoll += Math.sin(t * 73) * 0.022 * vib; P.headYaw += Math.sin(t * 57) * 0.02 * vib + Math.sin(t * 5.5) * 0.07 * vib;
    P.sx += Math.sin(t * 67) * 0.006 * vib;
    P.earSpread += 0.9 * inh + 0.5 * roar; P.earBack += 0.55 * roar;
    P.wingOpen += 0.35 * inh + 0.72 * roar; P.wingFlap += 0.12 * inh + 0.26 * roar + Math.sin(t * 43) * 0.03 * vib; P.wingSweep += -0.25 * roar;
    P.tailLift += 0.7 * inh + 0.3 * roar; P.tailWag += 1.3 * roar; P.tailWagFreq = 13;
    P.browRaise = 0.5 * inh; fierce(P, pulse(t, 0.44, 0.58, 1.6, 1.95)); P.squint += 0.25 * roar;
    P.crest += 0.8 * roar;
  },
  start(c) { c._g = 0; },
  tick(t, dt, c) {
    if (t > 0.62 && t < 1.5) {
      c._g -= dt;
      if (c._g <= 0) {
        c._g = 0.085;
        const m = c.mouth(v()), d = c.dummy.center(v()).sub(m).normalize();
        c.fx.ring(m.clone().addScaledVector(d, 0.05), { normal: d, r0: 0.06, r1: 0.62, dur: 0.62, alpha: 0.55, w0: 0.16, w1: 0.05, vel: d.clone().multiplyScalar(2.3), wob: 0.035, color: [0.82, 0.93, 1.0] });
        if (Math.random() < 0.7) c.fx.droplets(m, 2, { dir: d, speed: 1.6, spread: 0.3, up: 0.1, size: 0.005, life: 0.5 });
      }
      c.dummy.shiver = smooth(0.75, 0.95, t); c.dummy.droop = smooth(0.8, 1.4, t);
      c.stage.addShake(dt * 0.9);
    }
  },
  events: [
    [1.5, (c) => { c.dummy.shiver = 0; statGlints(c, c.dummy.center(v()).setY(0.2), false, [1.0, 0.45, 0.35]); }],
    [1.8, (c) => { const m = c.mouth(v()); c.fx.mist(m, 5, { dir: v(0, 0.2, 1), speed: 0.5, size: 0.1, alpha: 0.3 }); }],
    [2.15, (c) => { c.dummy.droop = 0; }],
  ],
  cam(t, c) { c.stage.setShot(_a.set(-1.5, 0.55, 1.75), _b.set(0, 0.42, 0.55), 30 - 5 * pulse(t, 0.4, 0.7, 1.5, 1.9)); },
});

// =================================================================== RALLY
def('rally', {
  name: 'Rally', type: 'Normal', kind: 'util', dur: 2.3, blurb: 'Rears up and psychs itself up. Raises Attack.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.2, 1.8, 2.2) * 0.85;
    const gather = pulse(t, 0.0, 0.3, 0.36, 0.46), up = pulse(t, 0.36, 0.56, 1.28, 1.44), land = pulse(t, 1.42, 1.48, 1.52, 1.75);
    P.hipsY += -0.065 * gather - 0.015 * up - 0.05 * land; P.hipsZ += -0.045 * up;
    P.pitch += -0.06 * gather + 0.80 * kf(t, [[0.36, 0], [0.56, 1, 'back'], [1.28, 0.95], [1.44, 0, 'in']]) - 0.08 * land;
    P.spinePitch += 0.18 * up; P.neckPitch += -0.3 * gather - 0.55 * up + 0.55 * pulse(t, 0.55, 0.7, 1.15, 1.3);
    P.headPitch += 0.1 * up + 0.35 * pulse(t, 0.55, 0.7, 1.15, 1.3);
    P.look = 1 - 0.9 * pulse(t, 0.3, 0.5, 1.3, 1.6);
    feet(P, FRONT, up, 0, 0.0, 0.0);
    const paddle = Math.sin(t * 13);
    P.fyFL = 0.035 * up + 0.03 * paddle * up; P.fyFR = 0.035 * up - 0.03 * paddle * up; P.fzFL = 0.05 * up; P.fzFR = 0.05 * up; P.fxFL = 0.01 * up; P.fxFR = -0.01 * up;
    P.stance = 0.02 * up;
    P.wingOpen += -0.15 * gather + 0.95 * up; P.wingFlap += 0.42 * up + Math.sin(t * 9) * 0.22 * up; P.wingSweep += -0.15 * up;
    P.jaw = kf(t, [[0, 0.12], [0.3, 0], [0.5, 0.1], [0.62, 1.0, 'out3'], [1.2, 0.9], [1.45, 0.1], [2.3, 0.14]]);
    P.headRoll += Math.sin(t * 60) * 0.015 * pulse(t, 0.6, 0.7, 1.15, 1.25);
    P.tailLift += -0.5 * gather + 0.9 * up; P.tailWag += 0.9 * up; P.tailWagFreq = 8;
    P.earSpread += 1.0 * up; P.crest += 1.0 * up;
    P.blinkHold = pulse(t, 0.05, 0.2, 0.36, 0.44); fierce(P, 0.7 * pulse(t, 0.5, 0.65, 1.25, 1.4) + 0.9 * pulse(t, 1.4, 1.55, 2.0, 2.3)); P.eyeGlow = 0.55 * pulse(t, 0.5, 0.7, 1.5, 2.0);
    P.dropScale = 1 + 0.35 * up + 0.05 * Math.sin(t * 20) * up; P.dropGlow = 0.6 * up;
    P.sy = 1 + 0.05 * pulse(t, 0.4, 0.5, 0.56, 0.7) - 0.06 * land;
  },
  start(c) {
    // two ribbons of water wind up around the body
    c._aura = [0, 1].map((i) => {
      const s = c.fx.stream((u, out) => { const a = u * 9.5 + i * Math.PI; const r = 0.36 - 0.16 * u; return out.set(Math.cos(a) * r, 0.03 + u * 1.25, -0.03 + Math.sin(a) * r); }, (u) => 0.024 * (1 - 0.6 * u), { segs: 70, sides: 7, spray: 0.4, shadow: false });
      return s;
    });
  },
  tick(t, dt, c) {
    const h = kf(t, [[0.45, 0], [1.15, 1, 'out']]), tl = kf(t, [[0.75, 0], [1.4, 1, 'in']]);
    for (const s of c._aura) { s.head = h; s.tail = tl; }
    if (t > 0.5 && t < 1.3) { c.shared.uWet.value = Math.min(1, c.shared.uWet.value + dt * 2.5); if (Math.random() < 0.5) { const a = rand(6.28); c.fx.sparkles(_a.set(Math.cos(a) * 0.3, rand(0.1, 0.9), Math.sin(a) * 0.3), 1, { speed: 0.2, rise: 0.8, size: 0.05, life: 0.6 }); } }
  },
  events: [
    [0.42, (c) => { c.fx.ring(v(0, 0, 0), { r0: 0.1, r1: 0.9, dur: 0.6, alpha: 0.5 }); c.fx.mist(v(0, 0.08, 0), 10, { size: 0.22, speed: 0.9, alpha: 0.25, floor: true }); }],
    [0.62, (c) => { const m = c.mouth(v()); c.fx.ring(m, { normal: v(0, 0.8, 0.6).normalize(), r0: 0.05, r1: 0.5, dur: 0.5, alpha: 0.5, vel: v(0, 1.2, 0.9), w0: 0.15, w1: 0.05 }); c.stage.addShake(0.2); }],
    [1.46, (c) => { for (const f of FRONT) { _a.copy(c.rig.legs[f].plant).setY(0.02); c.fx.dust(_a, 7, { speed: 1.0 }); c.fx.ring(_a, { r0: 0.03, r1: 0.4, dur: 0.4, alpha: 0.5, color: [0.9, 0.85, 0.7] }); } c.stage.addShake(0.4); c.stage.pushGrass(0, 0.1, 0.6); }],
    [1.55, (c) => { statGlints(c, v(0, 0.05, 0), true, [1.0, 0.55, 0.25], 20); c.fx.glow(v(0, 0.4, 0), { size: 1.6, life: 0.4, color: [1.0, 0.7, 0.4], alpha: 0.35 }); }],
  ],
  end(c) { for (const s of c._aura) c.fx.killStream(s); },
  cam(t, c) { const k = pulse(t, 0.3, 0.6, 1.4, 1.9); c.stage.setShot(_a.set(-1.25 - 0.2 * k, 0.28 - 0.1 * k, 1.55), _b.set(0, 0.42 + 0.22 * k, 0.05), 32); },
});

// =================================================================== SPLASH JAB
def('splashjab', {
  name: 'Splash Jab', type: 'Water', kind: 'basic', dur: 1.75, blurb: 'Hops in and jabs with a burst from its tail droplet.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.12, 1.3, 1.7) * 0.85;
    const hop = pulse(t, 0.10, 0.16, 0.30, 0.36), low = pulse(t, 0.30, 0.38, 0.86, 1.0), whip = kf(t, [[0.30, 0], [0.47, 1, 'in3'], [0.56, 0.86, 'out'], [0.86, 0.9], [1.05, 0, 'io']]);
    const hopBack = pulse(t, 0.92, 0.98, 1.20, 1.26);
    P.rootZ = kf(t, [[0.10, 0], [0.34, 0.50, 'io'], [0.92, 0.50], [1.24, 0, 'io']]);
    P.rootY = 0.10 * Math.sin(Math.PI * clamp01((t - 0.12) / 0.22)) + 0.12 * Math.sin(Math.PI * clamp01((t - 0.94) / 0.30));
    P.air = Math.max(hop, hopBack);
    feet(P, ALL, 0, 0, 0.05 * (hop + hopBack), 0.02 * hop - 0.02 * hopBack);
    P.hipsY += -0.04 * pulse(t, 0, 0.1, 0.12, 0.16) - 0.045 * low + 0.045 * whip - 0.05 * pulse(t, 1.22, 1.27, 1.3, 1.5);
    P.pitch += 0.12 * hop - 0.38 * whip - 0.05 * low + 0.15 * hopBack; P.hipsZ += 0.03 * whip;
    P.spinePitch += -0.10 * whip; P.neckPitch += -0.12 * low - 0.45 * whip; P.headPitch += 0.42 * whip;
    // the tail swings up and over like a scorpion's and stabs forward
    P.tailArch += -0.22 * pulse(t, 0.08, 0.26, 0.30, 0.38) + 0.85 * whip - 0.25 * pulse(t, 0.47, 0.50, 0.56, 0.72);
    P.tailLift += -0.5 * pulse(t, 0.08, 0.26, 0.30, 0.38);
    P.tailStiff = 1 + 3.5 * pulse(t, 0.28, 0.34, 0.8, 0.95);
    P.wingOpen += 0.5 * hop + 0.35 * low + 0.4 * hopBack; P.wingFlap += 0.3 * hop + 0.3 * hopBack - 0.15 * low; P.wingSweep += 0.35 * low;
    P.earBack += 0.8 * low; fierce(P, pulse(t, 0.06, 0.2, 0.9, 1.2)); P.blinkHold = pulse(t, 0.46, 0.48, 0.52, 0.6) * 0.7; P.jaw = 0.12 + 0.5 * pulse(t, 0.44, 0.5, 0.7, 0.9);
    P.dropScale = kf(t, [[0, 1], [0.30, 1.0], [0.44, 1.5, 'out'], [0.50, 0.25, 'in'], [1.0, 0.3], [1.5, 1.08, 'out'], [1.75, 1.0]]);
    P.dropGlow = 0.9 * pulse(t, 0.3, 0.44, 0.48, 0.6);
    P.sy = 1 - 0.06 * pulse(t, 1.22, 1.27, 1.3, 1.45);
  },
  events: [
    [0.34, (c) => footDust(c, 3, 0.7)],
    [0.47, (c) => {
      const from = c.dropPos(v()), to = c.dummy.center(v());
      const mid = from.clone().lerp(to, 0.5).add(v(0, 0.05, 0));
      const path = bezier([from, mid, to]);
      const s = c.fx.stream(path, (u, k) => 0.035 + 0.045 * Math.pow(k, 3), { segs: 30, sides: 9, spray: 1.5 });
      c.fx.glow(from, { size: 0.5, life: 0.2, color: [0.6, 0.9, 1] });
      c.fx.run(0.09, (k) => { s.head = k; }, () => {
        c.dummy.hit(FWD, 0.7); c.dummy.wet(2.5); c.fx.splash(to, 1.6); c.fx.impact(to, 0.7, FWD); c.stage.addShake(0.35); c.stage.hitStop(0.05);
        c.fx.droplets(to, 26, { dir: v(0, 0.5, -1), spread: 0.9, speed: 2.6, up: 0.5, size: 0.014 });
        c.fx.run(0.16, (k) => { s.tail = k; }, () => c.fx.killStream(s));
      });
    }],
    [0.58, (c) => c.stage.wetAt(0, 1.25, 0.5, 0.7)],
    [1.26, (c) => footDust(c, 3, 0.7)],
    [1.34, (c) => { const p = c.dropPos(v()); c.fx.sparkles(p, 6, { speed: 0.4, size: 0.04 }); }],
  ],
  cam(t, c) { const z = c.rig.rootPos.z; c.stage.setShot(_a.set(-1.9, 0.55, 1.3 + z * 0.3), _b.set(0, 0.45, 0.5 + z * 0.6), 30); },
});

// =================================================================== SOAK
def('soak', {
  name: 'Soak', type: 'Water', kind: 'util', dur: 3.1, blurb: 'Lobs its droplet skyward to rain on the foe. Lowers Speed.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.2, 2.5, 3.0) * 0.7;
    const aim = pulse(t, 0.0, 0.38, 0.44, 0.52), flick = pulse(t, 0.44, 0.50, 0.56, 0.75), dance = pulse(t, 0.95, 1.2, 2.2, 2.5);
    P.pitch += 0.16 * aim - 0.12 * flick + 0.05 * dance; P.hipsY += -0.03 * aim + 0.02 * flick;
    P.neckPitch += 0.20 * aim + 0.25 * pulse(t, 0.5, 0.7, 0.95, 1.2); P.headPitch += 0.15 * aim + 0.2 * pulse(t, 0.5, 0.7, 0.95, 1.2);
    P.look = 1 - 0.6 * pulse(t, 0.3, 0.5, 0.9, 1.2);
    P.tailArch += -0.25 * aim + 0.55 * flick; P.tailLift += -0.5 * aim; P.tailCurl += -0.4 * aim; P.tailStiff = 1 + 2 * pulse(t, 0.4, 0.44, 0.7, 0.9);
    P.dropScale = kf(t, [[0, 1], [0.40, 1.55, 'out'], [0.47, 1.6], [0.50, 0.2, 'in'], [2.3, 0.25], [2.8, 1.06, 'out'], [3.1, 1]]);
    P.dropGlow = 0.7 * aim;
    P.wingOpen += 0.3 * aim + 0.25 * dance + 0.1 * Math.sin(t * 14) * dance; P.wingFlap += 0.1 * Math.sin(t * 14) * dance;
    // pleased with itself while the rain falls: a little bounce and wiggle
    const b = Math.sin(t * 11.5);
    P.hipsY += (-0.02 + 0.014 * Math.abs(b)) * dance; P.roll += 0.06 * Math.sin(t * 5.75) * dance; P.headRoll += 0.16 * Math.sin(t * 5.75 + 0.6) * dance;
    P.spineYaw += 0.08 * Math.sin(t * 5.75) * dance;
    P.tailWag += 1.6 * dance; P.tailWagFreq = 11.5; P.tailLift += 0.4 * dance;
    fierce(P, 0.6 * pulse(t, 0.25, 0.4, 0.5, 0.65)); P.browRaise = 0.7 * dance; P.smile = 0.8 * dance; P.lidBot = 0.25 * dance; P.jaw = 0.12 + 0.3 * dance + 0.1 * b * dance; P.earSpread += 0.8 * dance;
  },
  events: [
    [0.5, (c) => {
      // the droplet leaves the tail as a wobbling ball
      const from = c.dropPos(v()), top = c.dummy.top(v()).add(v(0, 0.5, 0));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), makeWaterMaterial(c.shared, { wobble: 0.02, wobbleFreq: 22, glow: 0.35 }));
      ball.castShadow = true;
      const path = bezier([from, from.clone().lerp(top, 0.4).add(v(0, 0.75, 0)), top]);
      c.fx.droplets(from, 8, { speed: 1, up: 0.8 });
      c.fx.addObject(ball, 0.42, (k) => { path(k, ball.position); ball.scale.setScalar(1 + 0.25 * Math.sin(k * 20)); c.fx.mist(ball.position, 1, { size: 0.07, alpha: 0.2, speed: 0.05, life: 0.3 }); }, () => {
        c.fx.splash(top, 1.2); c.fx.glow(top, { size: 0.9, life: 0.3, color: [0.7, 0.9, 1] });
        // cloud
        const cloud = new THREE.Group(); cloud.position.copy(top);
        const puffs = [];
        for (let i = 0; i < 11; i++) { const s = makeSprite(i % 3 === 0 ? 0x9fb0cc : 0x6f7f9e, 0); s.position.set(rand(-0.34, 0.34), rand(-0.05, 0.1), rand(-0.2, 0.2)); s.userData.s = rand(0.34, 0.56); cloud.add(s); puffs.push(s); }
        c._cloud = cloud; c._rainOn = true;
        c.fx.addObject(cloud, 2.0, (k, dt) => {
          const a = Math.min(1, k * 7) * (1 - smooth(0.8, 1, k));
          for (const s of puffs) { s.material.opacity = 0.9 * a; const sc = s.userData.s * (0.5 + 0.5 * Math.min(1, k * 6)) * (1 + 0.05 * Math.sin(c.shared.uTime.value * 3 + s.position.x * 9)); s.scale.set(sc, sc * 0.72, 1); }
          if (k < 0.8) { c.fx.rain(top.clone().setY(top.y - 0.06), 0.36, Math.random() < 0.9 ? 3 : 2, { wind: 0.05 }); }
        }, () => { c._rainOn = false; });
      });
    }],
    [1.0, (c) => { c.dummy.wet(5); c.dummy.droop = 0.8; c.stage.wetAt(0, 1.5, 0.95, 1); }],
    [1.9, (c) => statGlints(c, c.dummy.center(v()).setY(0.2), false, [0.4, 0.7, 1.0])],
    [2.9, (c) => { c.dummy.droop = 0; }],
  ],
  tick(t, dt, c) {
    if (c._rainOn) { c.dummy.shiver = 0.25; if (Math.random() < 0.5) { const p = c.dummy.top(_a); p.x += rand(-0.2, 0.2); p.z += rand(-0.2, 0.2); c.fx.mist(p, 1, { size: 0.09, alpha: 0.25, speed: 0.3, life: 0.35 }); c.fx.droplets(p, 1, { speed: 0.9, up: 0.5, size: 0.007, life: 0.6 }); } } else c.dummy.shiver = 0;
  },
  cam(t, c) { const k = smooth(0.4, 1.0, t) * (1 - smooth(2.3, 2.9, t)); c.stage.setShot(_a.set(-2.5 - 0.5 * k, 0.6 + 0.25 * k, 1.6 + 0.3 * k), _b.set(0, 0.42 + 0.3 * k, 0.6 + 0.35 * k), 30 + 4 * k); },
});

// =================================================================== DRIZZLE DART
const DART_T = [0.40, 0.55, 0.70];
def('drizzledart', {
  name: 'Drizzle Dart', type: 'Water', kind: 'sig', dur: 1.75, blurb: 'Its own move: springs up and spits three darts before the foe can blink.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.06, 1.35, 1.7) * 0.85;
    const crouch = pulse(t, 0.0, 0.08, 0.12, 0.18), up = pulse(t, 0.12, 0.30, 0.86, 1.10);
    P.rootY = kf(t, [[0.12, 0], [0.32, 0.40, 'out'], [0.86, 0.36], [1.10, 0, 'in']]) + 0.02 * Math.sin(t * 19) * up;
    let rec = 0, shot = 0;
    for (const d of DART_T) { rec += smooth(d, d + 0.03, t); shot += pulse(t, d - 0.035, d, d + 0.02, d + 0.11); }
    P.rootZ = -0.045 * rec * (1 - smooth(0.9, 1.25, t));
    P.air = pulse(t, 0.13, 0.17, 1.02, 1.10);
    feet(P, FRONT, 0, 0.0, 0.055 * up, 0.035 * up); feet(P, HIND, 0, 0.0, 0.05 * up, 0.03 * up);
    P.hipsY += -0.07 * crouch - 0.06 * pulse(t, 1.08, 1.13, 1.16, 1.4);
    P.pitch += -0.22 * up + 0.12 * shot; P.spinePitch += -0.10 * up;
    P.neckPitch += 0.1 * up - 0.25 * pulse(t, 0.3, 0.36, 0.8, 0.9) + 0.30 * shot; P.headPitch += 0.14 * shot;
    P.jaw = 0.1 + 0.75 * shot + 0.1 * up;
    // fast wing beats to hang in the air
    const beat = Math.sin(t * 40);
    P.wingOpen += 0.85 * pulse(t, 0.06, 0.14, 1.05, 1.25); P.wingFlap += (0.15 + 0.55 * beat) * up + 0.5 * pulse(t, 0.1, 0.14, 0.2, 0.28); P.wingCup += 0.4 * Math.max(0, -beat) * up;
    P.hipsY += 0.012 * beat * up;
    P.tailLift += -1.1 * up; P.tailBase += -0.35 * up + 0.2 * shot; P.tailWag += 0.5 * up; P.tailWagFreq = 20;
    P.earBack += 0.5 * up + 0.5 * shot; fierce(P, pulse(t, 0.0, 0.1, 0.95, 1.3)); P.squint += 0.3 * shot;
    P.sy = 1 + 0.06 * pulse(t, 0.12, 0.2, 0.24, 0.34) - 0.08 * pulse(t, 1.08, 1.12, 1.15, 1.32); P.crest += 0.5 * up;
  },
  events: [
    [0.13, (c) => footDust(c, 4, 0.9)],
    ...DART_T.map((d, i) => [d, (c) => {
      const from = c.mouth(v()), to = c.dummy.center(v()).add(v([0, -0.08, 0.07][i], [0.03, -0.07, 0.08][i], 0));
      c.fx.glow(from, { size: 0.3, life: 0.12, color: [0.7, 0.92, 1] }); c.fx.droplets(from, 5, { dir: v(0, 0, 1), spread: 0.5, speed: 1.2, up: 0.1, size: 0.006, life: 0.4 });
      c.fx.dart(from, to, 0.13, { size: 1.25, arc: 0.0, onHit: (p) => { c.dummy.hit(v(0, 0, 1), 0.38); c.fx.splash(p, 0.7); c.fx.impact(p, 0.5, FWD); c.stage.addShake(0.18); if (i === 2) c.dummy.wet(2); } });
    }]),
    [1.1, (c) => { footDust(c, 5, 0.9); c.stage.addShake(0.12); }],
  ],
  cam(t, c) { const k = pulse(t, 0.1, 0.35, 0.9, 1.3); c.stage.setShot(_a.set(-1.7, 0.5 + 0.25 * k, 1.9), _b.set(0, 0.4 + 0.3 * k, 0.6), 31); },
});

// =================================================================== BODY SLAM
def('bodyslam', {
  name: 'Body Slam', type: 'Normal', kind: 'strong', dur: 2.6, blurb: 'A high leap and a belly-first drop with its whole weight.',
  pose(t, P, c) {
    P.idle = 1 - pulse(t, 0, 0.15, 2.0, 2.5) * 0.85;
    const crouch = pulse(t, 0.0, 0.34, 0.42, 0.50), rise = pulse(t, 0.44, 0.52, 0.72, 0.86), fall = pulse(t, 0.74, 0.90, 1.02, 1.06), hitK = pulse(t, 1.02, 1.04, 1.12, 1.24);
    const off = pulse(t, 1.14, 1.24, 1.70, 1.80), land = pulse(t, 1.76, 1.81, 1.86, 2.1);
    const DZ = c ? c.dist - 0.10 : 1.4;
    P.rootZ = kf(t, [[0.44, 0], [1.03, DZ, 'lin'], [1.16, DZ], [1.78, 0, 'lin'], [1.9, -0.05, 'out'], [2.15, 0, 'io']]);
    P.rootY = kf(t, [[0.44, 0], [0.76, 1.22, 'out'], [1.03, 0.69, 'in'], [1.10, 0.56, 'out'], [1.16, 0.60], [1.42, 0.98, 'out'], [1.78, 0, 'in']]);
    P.air = pulse(t, 0.45, 0.50, 1.74, 1.80);
    P.hipsY += -0.095 * crouch - 0.07 * land; P.yaw += Math.sin(t * 32) * 0.05 * pulse(t, 0.1, 0.2, 0.36, 0.42);
    P.pitch += -0.08 * crouch + 0.55 * rise - 0.30 * fall - 0.15 * hitK + 0.45 * off - 0.1 * land;
    P.spinePitch += 0.15 * crouch - 0.12 * rise + 0.25 * fall; P.neckPitch += -0.2 * crouch - 0.15 * rise + 0.25 * fall + 0.2 * hitK; P.headPitch += 0.2 * fall;
    P.look = 1 - 0.8 * pulse(t, 0.4, 0.5, 1.8, 2.0);
    // tucked on the way up, spread-eagled on the way down
    const tuck = rise * (1 - fall), spread = Math.max(fall, hitK);
    feet(P, FRONT, 0, 0.06 * spread, 0.07 * tuck + 0.05 * spread + 0.05 * off, 0.03 * tuck + 0.10 * spread);
    feet(P, HIND, 0, 0.07 * spread, 0.08 * tuck + 0.04 * spread + 0.06 * off, 0.05 * tuck - 0.13 * spread + 0.04 * off);
    P.wingOpen += 0.9 * pulse(t, 0.5, 0.74, 1.72, 1.95); P.wingFlap += -0.3 * rise + 0.62 * fall + 0.25 * off + 0.3 * hitK; P.wingCup += 0.5 * fall;
    P.tailLift += 0.9 * crouch - 1.0 * rise + 1.3 * fall + 0.6 * off; P.tailBase += 0.35 * fall; P.tailStiff = 1.4;
    P.jaw = 0.12 + 0.85 * pulse(t, 0.7, 0.85, 1.1, 1.3) + 0.2 * off;
    P.earBack += 0.9 * rise + 0.3 * off; P.earSpread += 1.0 * fall; fierce(P, pulse(t, 0.06, 0.3, 1.25, 1.6)); P.blinkHold = pulse(t, 1.0, 1.03, 1.12, 1.22);
    P.sy = 1 + 0.10 * pulse(t, 0.45, 0.52, 0.6, 0.72) - 0.30 * pulse(t, 1.02, 1.045, 1.09, 1.2) - 0.10 * pulse(t, 1.77, 1.81, 1.84, 2.0) + 0.04 * off;
    P.sx = P.sz = 1 + 0.16 * pulse(t, 1.02, 1.045, 1.09, 1.2) + 0.05 * pulse(t, 1.77, 1.81, 1.84, 2.0) - 0.04 * pulse(t, 0.45, 0.52, 0.6, 0.72);
    // shake it off
    const shk = pulse(t, 2.0, 2.08, 2.3, 2.5); P.roll += Math.sin(t * 38) * 0.07 * shk; P.headRoll += Math.sin(t * 38 + 1) * 0.12 * shk; P.earSpread += shk;
  },
  events: [
    [0.45, (c) => { footDust(c, 7, 1.2); c.fx.ring(v(0, 0, 0), { r0: 0.1, r1: 0.7, dur: 0.4, alpha: 0.45, color: [0.9, 0.85, 0.7] }); c.stage.pushGrass(0, 0, 0.5); }],
    [1.03, (c) => {
      const p = c.dummy.top(v());
      c.dummy.squash(1.7); c.dummy.hit(v(0, 0, 1), 0.25);
      c.fx.impact(p, 1.6, v(0, 1, 0)); c.fx.glow(p, { size: 1.6, life: 0.2, color: [1, 1, 1] });
      const g = v(c.target.x, 0, c.target.z);
      c.fx.ring(g, { r0: 0.2, r1: 2.2, dur: 0.6, alpha: 0.75, w0: 0.3, w1: 0.03, color: [1, 0.97, 0.88] });
      c.fx.ring(g, { r0: 0.15, r1: 1.4, dur: 0.75, alpha: 0.5, color: [0.9, 0.82, 0.65] });
      for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; c.fx.dust(_a.set(g.x + Math.cos(a) * 0.3, 0.05, g.z + Math.sin(a) * 0.3), 2, { dir: v(Math.cos(a), 0.25, Math.sin(a)), push: 1.6, speed: 1.3, size: 0.24 }); }
      c.stage.addShake(1.1); c.stage.hitStop(0.10); c.stage.pushGrass(g.x, g.z, 1.6);
    }],
    [1.79, (c) => { footDust(c, 7, 1.2); c.stage.addShake(0.35); c.fx.ring(v(0, 0, 0), { r0: 0.1, r1: 0.8, dur: 0.45, alpha: 0.4, color: [0.9, 0.85, 0.7] }); c.stage.pushGrass(0, 0, 0.7); }],
  ],
  cam(t, c) {
    const k = pulse(t, 0.3, 0.7, 1.5, 2.0), y = c.rig.rootPos.y, z = c.rig.rootPos.z;
    c.stage.setShot(_a.set(-3.1 - 0.6 * k, 0.35 + 0.1 * k, 1.05), _b.set(0, 0.36 + y * 0.7, 0.3 + z * 0.55), 32 + 8 * k);
  },
});

// =================================================================== TORRENT CRASH
def('torrentcrash', {
  name: 'Torrent Crash', type: 'Water', kind: 'strong', dur: 3.6, blurb: 'Calls up a towering torrent and brings it down on the foe.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.2, 2.9, 3.5) * 0.9;
    const charge = pulse(t, 0.0, 0.5, 0.72, 0.9), rear = pulse(t, 0.66, 0.92, 1.04, 1.12), slam = pulse(t, 1.06, 1.13, 1.95, 2.4), hold = pulse(t, 1.12, 1.2, 1.9, 2.3);
    P.stance = 0.03 * pulse(t, 0.1, 0.5, 2.6, 3.2);
    P.hipsY += -0.055 * charge - 0.01 * rear - 0.05 * slam; P.hipsZ += -0.05 * rear + 0.05 * slam;
    P.pitch += -0.05 * charge + 0.62 * rear - 0.14 * slam; P.spinePitch += 0.15 * rear - 0.08 * slam;
    P.neckPitch += -0.25 * charge - 0.1 * rear - 0.12 * slam; P.headPitch += 0.12 * charge + 0.45 * rear + 0.15 * slam;
    P.look = 1 - 0.8 * pulse(t, 0.6, 0.8, 1.0, 1.15);
    feet(P, FRONT, rear, 0.01 * rear, 0.05 * rear, 0.04 * rear);
    P.wingOpen += 0.95 * pulse(t, 0.1, 0.7, 2.3, 2.9); P.wingFlap += 0.18 * charge + 0.58 * rear + 0.22 * hold + Math.sin(t * 47) * 0.035 * hold; P.wingSweep += -0.2 * hold; P.wingCup += 0.35 * rear;
    P.tailArch += 0.12 * charge - 0.3 * rear + 0.62 * kf(t, [[1.04, 0], [1.14, 1, 'in3'], [1.9, 0.9], [2.4, 0]]);
    P.tailLift += 0.4 * charge; P.tailCurl += -0.4 * charge; P.tailStiff = 1 + 2.5 * pulse(t, 0.9, 1.05, 2.0, 2.4);
    P.tailWag += 0.4 * charge; P.tailWagFreq = 16;
    P.dropScale = kf(t, [[0, 1], [0.7, 2.3, 'io'], [1.08, 2.5], [1.16, 1.6, 'out'], [1.9, 1.4], [2.3, 0.3, 'in'], [2.8, 0.35], [3.3, 1.08, 'out'], [3.6, 1]]);
    P.dropGlow = 1.2 * pulse(t, 0.1, 0.7, 1.9, 2.4);
    P.jaw = kf(t, [[0, 0.12], [0.6, 0.0], [0.9, 0.25], [1.12, 1.05, 'out3'], [1.9, 0.95], [2.3, 0.15], [3.6, 0.12]]) + Math.sin(t * 59) * 0.03 * hold;
    P.headRoll += Math.sin(t * 71) * 0.02 * hold; P.sx = 1 + Math.sin(t * 66) * 0.005 * hold;
    P.eyeGlow = 1.0 * pulse(t, 0.2, 0.7, 2.0, 2.6); fierce(P, pulse(t, 0.1, 0.45, 2.3, 2.8)); P.blinkHold = 0.8 * pulse(t, 2.85, 2.95, 3.15, 3.3);
    P.earSpread += 0.8 * charge + 1.0 * rear; P.earBack += 0.7 * hold; P.crest += 1.0 * pulse(t, 0.3, 0.8, 2.0, 2.5);
    P.sy = 1 + 0.04 * rear - 0.06 * pulse(t, 1.08, 1.13, 1.18, 1.4);
    // shake the water off at the end
    const shk = pulse(t, 2.85, 2.95, 3.2, 3.4); P.roll += Math.sin(t * 36) * 0.07 * shk; P.headRoll += Math.sin(t * 36 + 1) * 0.13 * shk; P.spineYaw += Math.sin(t * 36) * 0.05 * shk; P.earSpread += shk;
  },
  start(c) { c._tor = null; c._torHit = false; },
  tick(t, dt, c) {
    // charging: water is drawn up out of the ground toward the swelling droplet
    if (t < 1.0) {
      const dp = c.dropPos(_a);
      const n = t * 3;
      for (let i = 0; i < n; i++) if (Math.random() < 0.5) {
        const a = rand(6.28), r = rand(0.35, 0.9);
        _b.set(Math.cos(a) * r, 0.02, -0.15 + Math.sin(a) * r);
        _c.copy(dp).sub(_b);
        const T = 0.55;
        c.fx.drops.length < c.fx.dropMax && c.fx.drops.push({ x: _b.x, y: _b.y, z: _b.z, vx: _c.x / T, vy: _c.y / T + 0.5 * 3 * T, vz: _c.z / T, s: 0.009 * rand(0.6, 1.3), life: T, t: 0, g: 3, splash: false, stretch: 1.4 });
      }
      if (Math.random() < 0.3) c.fx.ring(_b.set(rand(-0.6, 0.6), 0, rand(-0.7, 0.4)), { r0: 0.02, r1: 0.16, dur: 0.5, alpha: 0.4 });
      if (Math.random() < 0.4) c.fx.mist(_b.set(rand(-0.5, 0.5), 0.05, rand(-0.6, 0.4)), 1, { size: 0.2, alpha: 0.18, speed: 0.3, rise: 0.3, life: 0.9 });
      c.shared.uWet.value = Math.min(1, c.shared.uWet.value + dt * 1.2);
    }
    const s = c._tor;
    if (s) {
      s.head = kf(t, [[1.12, 0], [1.56, 1, 'in']]); s.tail = kf(t, [[1.95, 0], [2.4, 1, 'in']]);
      c.stage.addShake(dt * (t < 2.0 ? 1.6 : 0.5));
      if (c._torHit && s.head - s.tail > 0.02) {
        // it keeps pouring onto the target
        const p = c.dummy.center(_a);
        c.fx.droplets(p, 5, { dir: v(0, 0.6, 0), spread: 1, speed: 2.8, up: 0.7, size: 0.016, life: 1.2 });
        c.fx.mist(_b.set(p.x + rand(-0.3, 0.3), 0.15, p.z + rand(-0.3, 0.3)), 2, { size: 0.5, alpha: 0.3, speed: 1.2, rise: 0.4, life: 1.0 });
        if (Math.random() < 0.4) c.fx.ring(_b.set(p.x, 0, p.z), { r0: 0.2, r1: 1.6, dur: 0.6, alpha: 0.35 });
        c.dummy.tiltV.x += dt * 30; c.dummy.sqV -= dt * 10;
      }
    }
  },
  events: [
    [0.15, (c) => c.fx.ring(v(0, 0, -0.1), { r0: 1.3, r1: 0.15, dur: 0.75, alpha: 0.5, w0: 0.05, w1: 0.2 })],
    [0.45, (c) => c.fx.ring(v(0, 0, -0.1), { r0: 1.1, r1: 0.12, dur: 0.6, alpha: 0.5, w0: 0.05, w1: 0.2 })],
    [1.10, (c) => {
      // paws slam down, the torrent leaps from the droplet and arcs over
      for (const f of FRONT) { _a.copy(c.rig.legs[f].plant).setY(0.02); c.fx.dust(_a, 8, { speed: 1.1 }); c.fx.splash(_a, 0.8, { ground: true }); }
      c.stage.addShake(0.6); c.stage.pushGrass(0, 0.1, 0.9);
      const from = c.dropPos(v()), to = c.dummy.center(v()).add(v(0, 0.15, 0));
      const path = bezier([from, v(from.x, from.y + 1.25, from.z - 0.25), v(0, 2.55, 0.55), v(0, 1.9, 1.52), to]);
      c._torPath = path; c._torFrom = from;
      c._tor = c.fx.stream((u, out) => { path(u, out); const w = Math.sin(u * 20 - c.shared.uTime.value * 9) * 0.035 * Math.sin(Math.PI * u); out.x += w; return out; },
        (u, k) => 0.05 + 0.11 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + 0.06 * Math.pow(k, 4), { segs: 80, sides: 12, spray: 5, foam: 1.0 });
      c.fx.glow(from, { size: 1.4, life: 0.35, color: [0.6, 0.9, 1] }); c.fx.droplets(from, 30, { speed: 3, up: 1.2, size: 0.015 });
    }],
    [1.56, (c) => {
      c._torHit = true;
      const p = c.dummy.center(v()), g = v(c.target.x, 0, c.target.z);
      c.dummy.hit(v(0, 0, 1), 1.5); c.dummy.squash(1.2); c.dummy.wet(8);
      c.fx.impact(p, 1.8, v(0, 1, 0));
      c.fx.droplets(p, 160, { speed: 4.6, up: 1.1, size: 0.02, jitter: 0.2, life: 1.8 });
      c.fx.mist(g.clone().setY(0.3), 40, { size: 0.9, speed: 2.6, alpha: 0.42, life: 1.6, rise: 0.5 });
      for (let i = 0; i < 4; i++) c.fx.after(i * 0.09, () => c.fx.ring(g, { r0: 0.2, r1: 2.6 + i * 0.5, dur: 0.8, alpha: 0.7 - i * 0.12, w0: 0.25, w1: 0.03 }));
      c.stage.addShake(1.2); c.stage.hitStop(0.08); c.stage.pushGrass(g.x, g.z, 2.2); c.stage.wetAt(g.x, g.z, 2.3, 1);
    }],
    [2.0, (c) => { const g = v(c.target.x, 2.2, c.target.z); for (let i = 0; i < 6; i++) c.fx.after(i * 0.08, () => c.fx.rain(g, 1.6, 12, { speed: 2.4, wind: 0.2 })); }],
    [2.45, (c) => { if (c._tor) { c.fx.killStream(c._tor); c._tor = null; } }],
    [2.95, (c) => { c.fx.droplets(v(0, 0.35, 0), 40, { speed: 1.8, up: 0.5, size: 0.008, jitter: 0.15 }); }],
  ],
  end(c) { if (c._tor) { c.fx.killStream(c._tor); c._tor = null; } },
  cam(t, c) {
    const ch = pulse(t, 0.0, 0.6, 0.95, 1.2), big = smooth(1.0, 1.5, t) * (1 - smooth(2.7, 3.4, t));
    _a.set(-1.25, 0.26, 1.1).lerp(_c.set(-3.6, 0.5, 0.2), big); _b.set(0, 0.5, -0.05).lerp(_c.set(0, 0.95, 0.8), big);
    if (ch < 0.01 && big < 0.01) { _a.set(-2.0, 0.45, 1.5); _b.set(0, 0.4, 0.4); }
    c.stage.setShot(_a, _b, 32 + 10 * big);
  },
});

// =================================================================== GUARD UP
def('guardup', {
  name: 'Guard Up', type: 'Normal', kind: 'util', dur: 2.4, blurb: 'Hunkers behind its wings and a shell of water. Raises Defense.',
  pose(t, P) {
    P.idle = 1 - pulse(t, 0, 0.2, 1.9, 2.3) * 0.85;
    const brace = pulse(t, 0.12, 0.42, 1.55, 1.95), snap = pulse(t, 0.3, 0.42, 0.5, 0.7);
    P.rootZ = -0.035 * brace; P.stance = 0.03 * brace;
    P.hipsY += -0.075 * brace - 0.02 * snap; P.pitch += -0.07 * brace; P.hipsZ += -0.02 * brace;
    P.neckPitch += -0.34 * brace; P.headPitch += 0.16 * brace; P.spinePitch += 0.12 * brace;
    // wings come round in front like two shields; tail wraps the feet
    P.wingOpen += 0.72 * brace; P.wingSweep += -1.05 * brace; P.wingFlap += -0.12 * brace; P.wingCup += 1.0 * brace;
    P.tailSide += 3.0 * brace; P.tailLift += -1.3 * brace; P.tailBase += -0.25 * brace; P.tailCurl += -0.6 * brace;
    P.earBack += 1.0 * brace; fierce(P, 0.8 * brace); P.squint += 0.3 * brace; P.jaw = 0.12 - 0.12 * brace; P.crest += -0.4 * brace;
    P.dropGlow = 0.8 * pulse(t, 0.4, 0.6, 1.4, 1.7); P.dropScale = 1 + 0.15 * pulse(t, 0.4, 0.6, 1.4, 1.7);
    P.sy = 1 - 0.03 * snap;
    P.look = 1 - 0.3 * brace;
  },
  events: [
    [0.3, (c) => footDust(c, 3, 0.6)],
    [0.45, (c) => {
      // a dome of water rises from the ground and settles into a shell
      const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uT: c.shared.uTime, uK: { value: 0 }, uFade: { value: 1 }, uPulse: { value: 0 }, uTop: c.shared.uSkyTop, uSun: c.shared.uSunDir },
        vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL; uniform float uT;
          void main(){ vL = position; vec3 p = position * (1.0 + 0.012 * sin(position.y * 22.0 - uT * 5.0)); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vW; varying vec3 vL; uniform float uT, uK, uFade, uPulse; uniform vec3 uSun;
          float h3(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
          float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
            return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y), mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
          void main(){
            if (vL.y > uK) discard;
            vec3 N = normalize(vN), V = normalize(cameraPosition - vW); float ndv = abs(dot(N, V));
            float fr = pow(1. - ndv, 2.4);
            // water sheeting down the shell: long streaks and a slow swirl
            float streak = n3(vec3(vL.x * 9., vL.y * 2.2 + uT * 1.6, vL.z * 9.));
            float fine = n3(vec3(vL.x * 30., vL.y * 7. + uT * 3.2, vL.z * 30.));
            float sheet = smoothstep(.45, .8, streak * .7 + fine * .3);
            float rim = smoothstep(.07, .0, uK - vL.y);
            vec3 R = reflect(-V, N);
            float spec = pow(max(dot(R, uSun), 0.), 90.) * 2.0 + pow(max(R.y, 0.), 3.) * .25;
            vec3 col = mix(vec3(.05, .34, .85), vec3(.45, .82, 1.), fr) + vec3(.75, .93, 1.) * (sheet * .55 + rim * 1.3 + uPulse) + spec;
            float a = (.07 + fr * .6 + sheet * .22 + rim * .8 + uPulse * .5 + spec * .6) * uFade;
            gl_FragColor = vec4(col, a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      const dome = new THREE.Mesh(g, mat); dome.position.set(0, 0, -0.02); dome.scale.set(0.62, 0.86, 0.72); dome.renderOrder = 7;
      c.fx.ring(v(0, 0, -0.02), { r0: 0.1, r1: 0.75, dur: 0.5, alpha: 0.7 });
      c.fx.addObject(dome, 1.55, (k) => {
        const tt = k * 1.55;
        mat.uniforms.uK.value = smooth(0, 0.42, tt) * 1.02; mat.uniforms.uFade.value = 1 - smooth(1.2, 1.5, tt);
        mat.uniforms.uPulse.value = pulse(tt, 0.42, 0.46, 0.5, 0.75) * 0.9;
        if (tt < 0.42 && Math.random() < 0.8) { const a = rand(6.28); c.fx.droplets(_a.set(Math.cos(a) * 0.6, 0.02, Math.sin(a) * 0.7), 1, { speed: 0.7, up: 1.6, size: 0.008, life: 0.6, splash: false }); }
      }, () => {
        // the shell lets go and falls as rain
        for (let i = 0; i < 70; i++) { const a = rand(6.28), ph = rand(0, 1.5); c.fx.droplets(_a.set(Math.cos(a) * Math.cos(ph) * 0.6, 0.05 + Math.sin(ph) * 0.84, Math.sin(a) * Math.cos(ph) * 0.7), 1, { speed: 0.5, up: 0.2, size: 0.01, life: 1 }); }
        c.fx.mist(v(0, 0.3, 0), 10, { size: 0.5, alpha: 0.2, speed: 0.6 });
        c.stage.wetAt(0, 0, 0.9, 0.7);
      });
    }],
    [0.9, (c) => { c.fx.glow(v(0, 0.4, 0), { size: 2.0, life: 0.35, color: [0.5, 0.8, 1.0], alpha: 0.35 }); c.shared.uWet.value = 0.8; }],
    [1.5, (c) => statGlints(c, v(0, 0.05, 0), true, [0.4, 0.75, 1.0], 20)],
  ],
  cam(t, c) { const k = pulse(t, 0.2, 0.6, 1.6, 2.1); c.stage.setShot(_a.set(-1.35 - 0.2 * k, 0.5, 1.75), _b.set(0, 0.36, 0.05), 31); },
});

// =================================================================== WALK and RUN
// Not attacks: a lap of the clearing to show the gait. Paws are placed on the ground and stay
// where they land while the body travels over them.
const WALK_OFF = { HL: 0.0, FL: 0.25, HR: 0.5, FR: 0.75 };      // lateral-sequence walk, like a lizard or a dog
const RUN_OFF = { HL: 0.0, HR: 0.10, FL: 0.46, FR: 0.56 };      // bounding gallop: hind pair, then front pair
function lap(id, o) {
  def(id, {
    name: o.name, type: 'Motion', kind: 'motion', dur: o.dur, blurb: o.blurb, blendIn: 0.25, blendOut: 0.35,
    start(c) { c._loc = { th: 0, phase: 0, speed: 0 }; },
    tick(t, dt, c) {
      const L = c._loc, R = o.radius, total = Math.PI * 2;
      const remain = (total - L.th) * R;
      // ease away from a standstill and settle back into one
      const want = Math.min(o.speed, Math.max(0.12, remain * o.brake)) * smooth(0, o.accel, t);
      L.speed += (want - L.speed) * (1 - Math.exp(-dt * 8));
      const ds = L.th >= total ? 0 : L.speed * dt;
      L.th = Math.min(total, L.th + ds / R); L.phase += ds / o.stride;
      L.moving = L.th < total - 1e-4;
      c.rig.moveTo(_a.set(-R + R * Math.cos(L.th), 0, R * Math.sin(L.th)), -L.th);
      // look where it is going
      _b.set(-R + R * Math.cos(L.th + 0.9), 0.4, R * Math.sin(L.th + 0.9)); c._lookOverride = _b;
      if (o.dust && L.moving && Math.random() < dt * 14) { const f = ['HL', 'HR', 'FL', 'FR'][Math.floor(Math.random() * 4)]; _c.copy(c.rig.legs[f].plant).setY(0.03); c.fx.dust(_c, 1, { size: 0.12, alpha: 0.22, speed: 0.4 }); }
    },
    pose(t, P, c) {
      const L = (c && c._loc) || { phase: 0, speed: 0, moving: false };
      const g = clamp01(L.speed / (o.speed * 0.5)) * (L.moving ? 1 : 0);
      const a = L.phase * Math.PI * 2;
      P.idle = 1 - 0.75 * g;
      P.gait = L.moving ? 1 : 0; P.gaitPhase = L.phase; P.gaitDuty = o.duty; P.gaitPeriod = o.stride / Math.max(0.2, L.speed); P.gaitLift = o.lift; P.gaitOff = o.off;
      P.look = 0.55;
      o.body(P, a, g, t);
    },
    end(c) { c.rig.moveTo(_a.set(0, 0, 0), 0); c._lookOverride = null; },
    cam(t, c) { o.cam(t, c); },
  });
}
lap('walk', {
  name: 'Walk', blurb: 'A lap at a walk: each paw lifts in turn, the spine sways, the tail follows.', dur: 8.4, radius: 0.55, speed: 0.46, stride: 0.30, duty: 0.70, lift: 0.036, off: WALK_OFF, accel: 0.5, brake: 2.2,
  body(P, a, g) {
    P.hipsY += (-0.006 - 0.005 * Math.cos(2 * a)) * g;
    P.roll += 0.035 * Math.sin(a + 0.4) * g; P.spineRoll += -0.05 * Math.sin(a + 0.4) * g;
    // the spine bends side to side with the legs, the neck and head counter it so the gaze stays level
    P.yaw += 0.07 * Math.sin(a) * g; P.spineYaw += -0.16 * Math.sin(a + 0.3) * g; P.neckYaw += 0.07 * Math.sin(a + 0.3) * g; P.headYaw += 0.03 * Math.sin(a + 0.3) * g;
    P.neckPitch += (-0.04 + 0.025 * Math.sin(2 * a + 1.2)) * g; P.headPitch += 0.03 * Math.sin(2 * a + 2.0) * g;
    P.tailSide += 1.5 * Math.sin(a - 1.2) * g; P.tailLift += (-0.25 + 0.12 * Math.sin(2 * a)) * g; P.tailWag = 0.1;
    P.wingOpen += 0.02 * Math.sin(2 * a) * g; P.earSpread += 0.1 * g; P.jaw += 0.03 * g;
  },
  cam(t, c) { const p = c.rig.rootPos; c.stage.setShot(_a.set(-2.75, 0.5, 0.85), _b.set(p.x * 0.75 - 0.1, 0.3, p.z * 0.6 + 0.1), 30); },
});
lap('run', {
  name: 'Run', blurb: 'A lap at a bounding gallop: hind legs drive, front legs catch, the back flexes.', dur: 4.4, radius: 0.9, speed: 2.05, stride: 0.74, duty: 0.36, lift: 0.07, off: RUN_OFF, accel: 0.35, brake: 3.2, dust: true,
  body(P, a, g) {
    // one bound per cycle: gather (back arched, legs under), then extend (back long, legs out)
    const ext = Math.sin(a + 0.6);
    P.rootY = (0.045 + 0.045 * Math.sin(a * 1 - 1.2)) * g;
    P.hipsY += -0.02 * g; P.pitch += (0.02 + 0.13 * Math.sin(a + 1.9)) * g; P.spinePitch += -0.22 * ext * g;
    P.neckPitch += (-0.16 - 0.10 * Math.sin(a + 1.9)) * g; P.headPitch += (0.10 + 0.06 * Math.sin(a + 1.9)) * g;
    P.roll += -0.16 * g;                                   // leans into the turn
    P.tailLift += (-0.9 + 0.35 * Math.sin(a - 0.8)) * g; P.tailStiff = 1.3; P.tailWag = 0.1;
    P.earBack += 0.85 * g; P.wingOpen += (-0.1 + 0.06 * ext) * g; P.crest += -0.3 * g;
    P.jaw += 0.22 * g; P.lidTop += 0.06 * g; P.brow = 0.35 * g; P.squint = 0.3 * g;
    P.sz = 1 + 0.03 * ext * g;
  },
  cam(t, c) { const p = c.rig.rootPos; c.stage.setShot(_a.set(-3.6, 0.6, 1.1), _b.set(p.x * 0.6 - 0.35, 0.3, p.z * 0.6 + 0.1), 32); },
});
