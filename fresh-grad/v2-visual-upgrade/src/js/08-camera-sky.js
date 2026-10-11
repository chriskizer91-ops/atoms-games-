/* ============================ camera and rendering ============================ */
const CAM = { x: 0, y: 0, k: 1, ready: false, vw: 800, vh: 500 };
let wctx = null;

/* drawing resolution steps down by itself if a device cannot keep up */
const QUAL = { cap: Math.min(window.devicePixelRatio || 1, 2), avg: 16, t: 0 };
function tuneQuality(ms) {
  if (ms > 400 || document.hidden || (G.mode !== 'play' && G.mode !== 'title')) return;
  QUAL.avg = QUAL.avg * 0.94 + ms * 0.06; QUAL.t += ms;
  if (QUAL.t > 2600 && QUAL.avg > 31 && QUAL.cap > 0.75) { QUAL.cap = QUAL.cap > 1.5 ? 1.5 : QUAL.cap > 1 ? 1 : 0.75; QUAL.t = 0; QUAL.avg = 16; }
}
function sizeCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, QUAL.cap);
  const w = cv.clientWidth, h = cv.clientHeight;
  const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  return { w, h, dpr };
}

/* ---------- sky, sun and weather ----------
   Each key: hour, zenith colour, horizon colour, ambient light (multiplied over the scene),
   night factor (how much the lamps matter), sun-shadow strength, golden-hour warmth. */
const NIGHT_KEY = [[8, 12, 34], [24, 34, 78], [90, 104, 178], 1, 0, 0];
const SKY_KEYS = [
  [0, ...NIGHT_KEY], [4.6, ...NIGHT_KEY],
  [5.5, [44, 58, 112], [240, 150, 134], [176, 150, 196], 0.7, 0, 0.3],
  [6.4, [104, 160, 222], [255, 214, 170], [255, 226, 202], 0.15, 0.55, 0.8],
  [8, [84, 160, 232], [206, 232, 248], [255, 255, 255], 0, 1, 0],
  [16.2, [84, 160, 232], [206, 232, 248], [255, 255, 255], 0, 1, 0],
  [17.8, [92, 140, 214], [255, 208, 140], [255, 228, 192], 0.06, 0.9, 1],
  [18.9, [62, 76, 150], [255, 138, 92], [240, 168, 144], 0.5, 0.5, 0.8],
  [19.8, [30, 38, 92], [136, 76, 132], [150, 122, 188], 0.88, 0.1, 0.2],
  [21, ...NIGHT_KEY], [24.01, ...NIGHT_KEY]
];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/* weather is cosmetic and comes from the day number, so it needs no save data */
function weatherAt(day, t) {
  let cloud = 0, rain = 0, wet = 0, storm = 0, fog = 0;
  const win = seasonOf(day) === 'winter';
  if (day > 2) {
    const r = hash01(day, 77, 3);
    if (r < (win ? 0.34 : 0.2)) {
      const st = 300 + hash01(day, 5, 91) * 720, len = 150 + hash01(day, 9, 9) * 240;
      rain = clamp((t - st) / 40, 0, 1) * clamp((st + len - t) / 40, 0, 1);
      wet = clamp((t - st) / 40, 0, 1) * clamp((st + len + 150 - t) / 150, 0, 1);
      cloud = clamp((t - st + 140) / 140, 0, 1) * clamp((st + len + 160 - t) / 160, 0, 1);
      if (!win && hash01(day, 12, 7) < 0.4) storm = rain;
    } else if (r < 0.42) cloud = 0.55 * clamp(t / 90, 0, 1) * clamp((1440 - t) / 90, 0, 1);
    else if (hash01(day, 21, 4) < 0.3) fog = clamp((t - 300) / 40, 0, 1) * clamp((600 - t) / 90, 0, 1);
  }
  if (win) return { cloud, rain: 0, wet: 0, snow: rain, storm: 0, fog };
  return { cloud, rain, wet, snow: 0, storm, fog };
}
function skyAt(t, day) {
  const h = (t / 60) % 24;
  let i = 0; while (i < SKY_KEYS.length - 2 && h >= SKY_KEYS[i + 1][0]) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], f = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
  let top = mix3(a[1], b[1], f), bot = mix3(a[2], b[2], f), amb = mix3(a[3], b[3], f);
  let nf = lerp(a[4], b[4], f), sh = lerp(a[5], b[5], f), warm = lerp(a[6], b[6], f);
  const W = weatherAt(day, t);
  if (W.cloud > 0) {
    const lum = 0.3 + 0.7 * (1 - nf), k = W.cloud * 0.74;
    top = mix3(top, [150 * lum, 160 * lum, 174 * lum], k); bot = mix3(bot, [198 * lum, 204 * lum, 212 * lum], k);
    const dim = 1 - 0.1 * W.cloud - 0.12 * W.rain;
    amb = [amb[0] * dim * (1 - 0.04 * W.cloud), amb[1] * dim, Math.min(255, amb[2] * (dim + 0.03 * W.cloud))];
    sh *= 1 - 0.85 * W.cloud; warm *= 1 - 0.7 * W.cloud; nf = Math.max(nf, W.rain * 0.22);
  }
  const sf = (h - 5.5) / 14, up = sf > 0 && sf < 1;
  const mf = h >= 19.5 ? (h - 19.5) / 10 : h < 5.5 ? (h + 4.5) / 10 : -1;
  return {
    top, bot, amb, nf, sh, warm, cloud: W.cloud, rain: W.rain, wet: W.wet, snow: W.snow, storm: W.storm, fog: W.fog,
    el: up ? Math.sin(Math.PI * sf) : 0, sunX: Math.cos(Math.PI * clamp(sf, 0, 1)), sunUp: up, sf, mf,
    star: clamp((nf - 0.4) / 0.6, 0, 1) * (1 - W.cloud), hour: h
  };
}
/* kept for older callers: night darkness and warmth as plain numbers */
function dayLight(t) { const A = skyAt(t, S ? S.day : 1); return { a: 0.58 * A.nf, warm: 0.16 * A.warm }; }

function beginFrame(A) {
  FX.A = A; FX.nf = clamp(A.nf, 0, 1);
  FX.glows.length = 0; FX.lights.length = 0; FX.emit.length = 0; FX.beams.length = 0; FX.over.length = 0; FX.refl.length = 0;
  FX.wind = 0.3 + A.rain * 0.7 + A.cloud * 0.2 + (A.snow || 0) * 0.3;
  const L = lerp(1.5, 0.42, A.el);
  FX.sh.a = 0.3 * A.sh; FX.sh.dx = -A.sunX * L * 1.15; FX.sh.dy = 0.34 + L * 0.5;
  const n = clamp(A.nf * 1.15, 0, 1);
  FX.glassA = rgbS(mix3(mix3(A.top, [255, 255, 255], 0.3), [30, 44, 72], n));
  FX.glassB = rgbS(mix3(mix3(A.bot, A.top, 0.45), [20, 30, 54], n));
  FX.glint = (0.34 * (1 - n)).toFixed(2);
  // visual only: shadows are cool teal-navy at noon and warm violet near sunrise and sunset
  FX.shc = mix3([14, 40, 74], [72, 30, 72], clamp(A.warm * 1.1, 0, 1));
  FX.sunc = mix3([255, 244, 214], [255, 150, 84], clamp(A.warm * 1.05, 0, 1));
}

/* ---------- the far skyline ---------- */
const SKYLINE = [[], []];
(function () {
  const r = mulberry32(11);
  [0, 1].forEach(layer => {
    let x = -1500;
    while (x < WORLD.w + 300) {
      const w = (layer ? 44 : 56) + r() * 80, h = (layer ? 50 : 90) + r() * r() * (layer ? 190 : 230);
      SKYLINE[layer].push({ x, w, h, t: r(), top: Math.floor(r() * 4), seed: Math.floor(r() * 9999) });
      x += w * (0.55 + r() * 0.6);
    }
  });
})();
const STARS = [];
(function () { const r = mulberry32(77); for (let i = 0; i < 150; i++) STARS.push({ x: r(), y: r() * r(), s: 0.6 + r() * 1.3, p: r() * 6.28 }); })();

function drawSky(c, A, vx0, vx1) {
  skyBody(c, A, vx0, vx1);
  skyHorizon(c, A, vx0, vx1);
}

function inCross(x0, x1) { return STREETS_X.some(cx => x1 > cx - STREET_W / 2 && x0 < cx + STREET_W / 2); }
function inRoadY(y0, y1) { return ROADS_H.some(r => y1 > r.y && y0 < r.y + r.h); }

