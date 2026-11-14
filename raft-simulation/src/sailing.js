// Sailing: the wind, and how the raft moves under its sail.
//
// The rules come from the sailing game (Sandcastle Cays), cut to fit a raft:
//  - you can't sail closer than about 50 degrees to the wind (the "no-go
//    zone": the sail flaps and the raft slows to a stop); to go upwind you
//    zig-zag (tack);
//  - you're fastest with the wind from the side (a beam reach);
//  - the wind leans the raft a little and slips it sideways (leeway);
//  - too much sail in a blow overpowers it: it slows and fights to turn up
//    into the wind until you take some sail in;
//  - running before a big swell, a wave under the stern sends it surfing.
//
// Angles: a heading h points the bow along (cos h, sin h) in chart x, z.
// The wind's direction is where it blows FROM, in the same terms. No drawing
// in this file, so the checks can run it directly.

export const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export function wrap(a) {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

function smoothstep(a, b, v) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const SAILING = {
  // Speed through the water (m/s) on the best point of sail, full sail, in
  // the usual trade wind: a little over 6 knots.
  topSpeed: 3.2,
  // How quickly speed builds and fades (per second).
  accel: 0.3,
  decel: 0.42,
  // Most the steering oar turns (radians) and the fastest turn at speed (radians per second).
  rudderMax: 0.55,
  turnRate: 0.36,
  // Hoisting or lowering the sail takes about this long, end to end.
  hoistTime: 2.6,
  // A raft with a patched sail points badly: the edge of the no-go zone, and
  // where the sail is fully drawing.
  noGo: 46 * DEG,
  closeHauled: 60 * DEG,
  // Usual trade-wind strength (m/s, about 13 knots), blowing from the south-east.
  windSpeed: 6.5,
  windFrom: Math.PI / 4,
  // How hard the wind presses (heel, radians, as a keelboat would lean). A
  // wide raft shows only heelShown of it. Past overHeel it's overpowered.
  overHeel: 0.42,
  maxHeel: 0.7,
  heelShown: 0.2,
  // Surfing: extra speed (m/s) per unit of downhill slope under the raft.
  // It takes a real swell: slopes under surfFrom don't count.
  surf: 40,
  surfFrom: 0.032,
  surfMax: 2.0,
  // Sculling with the steering oar: enough to creep the last few metres to a beach.
  scull: 0.9,
};

// How much of top speed the sail gives for a given push (sail area times wind
// strength): more always helps, but less and less. 1 at full sail in the usual wind.
export function sailPower(push) {
  return (1 - Math.exp(-1.8 * push)) / (1 - Math.exp(-1.8));
}

// How hard the sail drives the raft at a given angle off the wind (0 .. 1).
export function drive(twa) {
  const a = Math.abs(twa);
  if (a < SAILING.noGo) return 0;
  if (a < SAILING.closeHauled) return 0.8 * smoothstep(SAILING.noGo, SAILING.closeHauled, a);
  if (a < 95 * DEG) return 0.8 + 0.2 * smoothstep(SAILING.closeHauled, 95 * DEG, a);
  if (a < 150 * DEG) return 1 - 0.12 * smoothstep(95 * DEG, 150 * DEG, a);
  return 0.88 - 0.1 * smoothstep(150 * DEG, Math.PI, a);
}

export function pointOfSail(twa) {
  const a = Math.abs(twa) / DEG;
  if (a < 42) return 'in irons';
  if (a < 60) return 'close-hauled';
  if (a < 80) return 'close reach';
  if (a < 115) return 'beam reach';
  if (a < 155) return 'broad reach';
  return 'running';
}

// ---------- the wind ----------

// The trade wind: steady from the south-east, shifting a few degrees now and
// then, with gusts every so often. `blow` is how much the weather adds
// (0 fair .. 1 full storm). A smooth function of time, so it is the same
// after loading a save.
export function windAt(t, blow = 0, out = { from: 0, speed: 0, gust: 0 }) {
  out.from = wrap(SAILING.windFrom + 0.16 * Math.sin(t / 97) + 0.08 * Math.sin(t / 31 + 1.3) + 0.22 * blow * Math.sin(t / 19 + 0.6));
  const g = Math.max(0, Math.sin(t * 0.21) * Math.sin(t * 0.083 + 0.7));
  out.gust = g * g;
  out.speed = SAILING.windSpeed * (0.86 + 0.12 * Math.sin(t / 53) + 0.95 * blow) * (1 + (0.26 + 0.2 * blow) * out.gust);
  return out;
}

// Wind in plain words, by its speed in knots (the Beaufort scale's names).
export function windWord(knots) {
  if (knots < 4) return 'light air';
  if (knots < 7) return 'light breeze';
  if (knots < 11) return 'gentle breeze';
  if (knots < 17) return 'moderate breeze';
  if (knots < 22) return 'fresh breeze';
  if (knots < 28) return 'strong breeze';
  if (knots < 34) return 'near gale';
  return 'gale';
}

export const KNOTS = 1.94384;

// ---------- the raft ----------

export function newBoat(heading = -Math.PI / 2) {
  return { heading, speed: 0, sailSet: 0, sail: 0, rudder: 0, heel: 0, heelV: 0, scull: 0, vx: 0, vz: 0 };
}

// The true wind angle: where the wind comes from, relative to the bow (+ = from starboard).
export function windAngle(b, w) {
  return wrap(w.from - b.heading);
}

// Advance the raft by dt seconds. helm: { steer -1..1, slope, scull 0..1 }.
// Writes the velocity over the water into b.vx, b.vz (chart metres per second)
// and returns what happened: { over, surfing }.
const ev = { over: 0, surfing: 0 };
export function stepBoat(b, w, helm, dt) {
  // The sail goes up and down at a steady rate.
  const hoist = dt / SAILING.hoistTime;
  b.sail += Math.max(-hoist, Math.min(hoist, b.sailSet - b.sail));
  const twa = windAngle(b, w);
  const windK = Math.min(3, Math.max(0.3, w.speed / SAILING.windSpeed));
  // Leaning too far for the wind: the sail spills it and the oar loses its grip.
  const over = Math.max(0, Math.abs(b.heel) - SAILING.overHeel);
  ev.over = over;

  b.scull += ((helm.scull || 0) - b.scull) * (1 - Math.exp(-dt * 2));
  b.rudder += (helm.steer * SAILING.rudderMax - b.rudder) * (1 - Math.exp(-dt * 3));
  // Turning needs way on (a little turn is always possible, to get out of irons).
  const grip = Math.max(0.3 + 0.7 * Math.min(1, Math.abs(b.speed) / 1.4), 0.8 * b.scull);

  // Speed eases toward what the wind and the sail give.
  const overpowered = Math.max(0.45, 1 - 1.6 * over);
  const d = drive(twa);
  const sailTarget = SAILING.topSpeed * d * sailPower(b.sail * windK) * overpowered;
  let target = Math.min(sailTarget, SAILING.topSpeed * 1.3) + SAILING.scull * b.scull * (1 - 0.6 * Math.min(1, sailTarget / SAILING.topSpeed));
  // Surfing: running or reaching fast, a wave lifting the stern sends it racing down the face.
  const downwind = smoothstep(100 * DEG, 135 * DEG, Math.abs(twa));
  const surf = Math.min(SAILING.surfMax, SAILING.surf * Math.max(0, (helm.slope || 0) - SAILING.surfFrom)) * downwind * smoothstep(1.6, 2.6, b.speed) * Math.min(1, b.sail * 2);
  target += surf;
  ev.surfing = surf;
  // Way carries it through a tack: it coasts when the sail is only flapping.
  let k = target > b.speed ? SAILING.accel : d === 0 ? SAILING.decel * 0.4 : SAILING.decel;
  if (surf > 0.2 && target > b.speed) k = 0.9;
  b.speed += (target - b.speed) * (1 - Math.exp(-dt * k));

  b.heading = wrap(b.heading + (b.rudder / SAILING.rudderMax) * SAILING.turnRate * grip * (1 - 0.5 * Math.min(1, over * 3)) * dt);
  // Overpowered, it tries to turn up into the wind ("rounding up"): steer away, or take in sail.
  if (over > 0 && Math.abs(twa) > SAILING.noGo) b.heading = wrap(b.heading + Math.sign(twa) * 1.5 * over * dt);

  // Leeway: it slips a little sideways, away from the wind, sailing across or into it.
  const side = Math.abs(twa) < 120 * DEG ? 6 * DEG * d * b.sail : 0;
  const lee = (twa >= 0 ? -1 : 1) * b.speed * Math.tan(side); // wind from starboard pushes it to port
  const c = Math.cos(b.heading), s = Math.sin(b.heading);
  // Starboard (to the right of the bow) is (-sin h, cos h).
  b.vx = c * b.speed - s * lee;
  b.vz = s * b.speed + c * lee;

  // Heel: the wind leans it away; a spring brings it back. The push on the
  // sail grows faster than the wind does, so a strong wind leans it a lot.
  let heelTarget = -Math.sign(twa) * b.sail * Math.pow(windK, 1.6) * (0.06 + 0.16 * Math.sin(Math.min(Math.PI, Math.abs(twa) * 1.35))) * (Math.abs(twa) < SAILING.noGo ? 0.2 : 1);
  heelTarget = Math.max(-SAILING.maxHeel, Math.min(SAILING.maxHeel, heelTarget));
  b.heelV += (6 * (heelTarget - b.heel) - 1.6 * b.heelV) * dt;
  b.heel = Math.max(-SAILING.maxHeel, Math.min(SAILING.maxHeel, b.heel + b.heelV * dt));
  return ev;
}

// Where the boom swings for a wind angle: out to the side away from the wind,
// further the more downwind (radians, + = to starboard).
export function boomAngle(twa) {
  const a = Math.abs(twa);
  const out = 0.14 + 1.2 * smoothstep(SAILING.noGo, 165 * DEG, a);
  return twa >= 0 ? -out : out;
}

// How full the sail is (0 = flapping in the no-go zone, 1 = drawing).
export function sailFill(twa) {
  return smoothstep(SAILING.noGo - 8 * DEG, SAILING.noGo + 6 * DEG, Math.abs(twa));
}

// ---------- "sail there for me" ----------

// Steer for a mark `dist` metres off on chart bearing `bearing`. Upwind it
// zig-zags, tacking when the other tack points clearly closer to the mark.
// course: { tack: +1 | -1 }. Returns the helm to apply.
const pilot = { steer: 0, sailSet: 1, scull: 0 };
export function autopilot(b, w, bearing, dist, course) {
  const steerTo = (h) => Math.max(-1, Math.min(1, wrap(h - b.heading) * 2.5));
  pilot.scull = 0;
  if (dist < 40) {
    // Arriving: sail down, scull gently in to the spot.
    pilot.steer = steerTo(bearing);
    pilot.sailSet = 0;
    pilot.scull = 1;
    return pilot;
  }
  let want = bearing;
  let beating = false;
  const off = wrap(bearing - w.from);
  const tackAngle = SAILING.closeHauled + 2 * DEG;
  if (Math.abs(off) < tackAngle) {
    // The mark is upwind: beat toward it on one tack or the other.
    const hA = wrap(w.from + tackAngle);
    const hB = wrap(w.from - tackAngle);
    const cur = course.tack > 0 ? hA : hB;
    const other = course.tack > 0 ? hB : hA;
    if (Math.abs(wrap(bearing - other)) + 25 * DEG < Math.abs(wrap(bearing - cur))) course.tack = -course.tack;
    want = course.tack > 0 ? hA : hB;
    beating = true;
  }
  // Stalled head to wind (in irons)? A few strokes of the oar get it moving again.
  const stalled = Math.abs(b.speed) < 0.4 && Math.abs(wrap(w.from - b.heading)) < SAILING.noGo;
  // Ease off near the mark, and take in sail when it blows hard.
  pilot.sailSet = dist < 90 || w.speed > SAILING.windSpeed * 1.35 ? 0.5 : 1;
  pilot.steer = steerTo(want);
  // Sweep the oar to bring the bow round when there's no way on to steer with.
  const swinging = Math.abs(b.speed) < 1 && Math.abs(wrap(want - b.heading)) > 0.6;
  // Beating to windward the oar is kept working too, to keep way on through the tacks.
  pilot.scull = stalled ? 0.7 : swinging ? 0.8 : beating ? 0.45 : 0;
  return pilot;
}
