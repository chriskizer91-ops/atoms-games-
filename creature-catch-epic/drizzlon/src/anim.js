// Plays the idle "alive" layer and blends moves over it.
import { DEFAULTS, kf, smooth } from './rig.js';

/** The always-on life layer: breathing, weight shifts, tail sway, frill flicks. */
export function idlePose(P, t, st) {
  const br = Math.sin(t * 2.3);
  P.breath = br;
  P.hipsY += -0.014 + br * 0.0025;
  P.hipsX += Math.sin(t * 0.47) * 0.007;
  P.roll += Math.sin(t * 0.47 + 0.6) * 0.012;
  P.spineYaw += Math.sin(t * 0.31) * 0.03;
  P.headRoll += Math.sin(t * 0.41 + 1.0) * 0.035;
  P.headPitch += Math.sin(t * 0.63) * 0.025 + br * 0.008;
  P.neckPitch += br * 0.012;
  P.jaw += 0.02 + br * 0.015;
  P.tailSide += Math.sin(t * 0.8) * 0.9;
  P.tailLift += Math.sin(t * 1.1 + 1) * 0.12;
  P.tailCurl += Math.sin(t * 0.9) * 0.10;
  P.tailWag += 0.35; P.tailWagFreq = 2.4;
  P.earSpread += 0.15 + Math.sin(t * 1.3) * 0.08;
  P.wingOpen += br * 0.012;
  P.crest += br * 0.03;
  // now and then: a frill flick, a wing ruffle
  st.flickT -= st.dt;
  if (st.flickT < 0) { st.flickT = 2.5 + Math.random() * 4; st.flick = 0; st.flickKind = Math.random() < 0.6 ? 0 : 1; }
  if (st.flick < 1) {
    st.flick += st.dt * 2.6;
    const k = Math.sin(Math.PI * Math.min(1, st.flick));
    if (st.flickKind === 0) { P.earBack += k * 0.5; P.earSpread -= k * 0.3; } else { P.wingOpen += k * 0.16; P.wingFlap += k * 0.12; }
  }
}

export class Animator {
  constructor(rig, ctx) {
    this.rig = rig; this.ctx = ctx; this.time = 0;
    this.move = null; this.mt = 0; this.fired = 0; this.onEnd = null;
    this.st = { flickT: 2, flick: 1, flickKind: 0, dt: 0 };
    this.timeScale = 1; this.hitStop = 0;
  }
  play(move, onEnd) {
    this.move = move; this.mt = 0; this.fired = 0; this.onEnd = onEnd || null;
    this.events = (move.events || []).slice().sort((a, b) => a[0] - b[0]);
    if (move.start) move.start(this.ctx);
  }
  get busy() { return !!this.move; }
  update(dt) {
    if (this.hitStop > 0) { this.hitStop -= dt; dt *= 0.05; }
    this.time += dt; this.st.dt = dt;
    const P = { ...DEFAULTS };
    idlePose(P, this.time, this.st);
    if (this.move) {
      const m = this.move;
      this.mt += dt;
      const t = this.mt;
      const Pm = { ...DEFAULTS };
      // the move keeps a little of the idle life (breathing), scaled by its own "idle" channel
      const Pi = { ...DEFAULTS }; m.pose(t, Pi, this.ctx);
      const idleAmt = Pi.idle;
      for (const k in P) Pm[k] = (typeof P[k] === 'number') ? DEFAULTS[k] + (P[k] - DEFAULTS[k]) * idleAmt : P[k];
      m.pose(t, Pm, this.ctx);
      const w = smooth(0, m.blendIn ?? 0.10, t) * (1 - smooth(m.dur - (m.blendOut ?? 0.3), m.dur, t));
      for (const k in P) if (typeof P[k] === 'number') P[k] += (Pm[k] - P[k]) * w;
      if (m.tick) m.tick(t, dt, this.ctx);
      if (m.cam) m.cam(t, this.ctx);
      while (this.fired < this.events.length && this.events[this.fired][0] <= t) { this.events[this.fired][1](this.ctx); this.fired++; }
      if (t >= m.dur) { const cb = this.onEnd; this.move = null; this.onEnd = null; if (m.end) m.end(this.ctx); if (cb) cb(); }
    }
    this.rig.update(P, dt);
    return dt;
  }
}
