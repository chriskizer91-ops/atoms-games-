export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Frame-rate independent smoothing toward a target.
export const damp = (current, target, rate, dt) => lerp(current, target, 1 - Math.exp(-rate * dt));

export const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

// Turn `from` toward `to` by at most `maxStep` radians.
export const turnToward = (from, to, maxStep) => {
  const d = wrapAngle(to - from);
  return from + clamp(d, -maxStep, maxStep);
};

export function randn() {
  // Box-Muller, good enough for spawn scatter
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function weightedPick(table) {
  let total = 0;
  for (const k in table) total += table[k].weight;
  let r = Math.random() * total;
  for (const k in table) {
    r -= table[k].weight;
    if (r <= 0) return k;
  }
  return Object.keys(table)[0];
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
