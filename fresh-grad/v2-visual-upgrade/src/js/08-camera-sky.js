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
const NIGHT_KEY = [[8, 12, 34], [24, 34, 78], [98, 112, 180], 1, 0, 0];
const SKY_KEYS = [
  [0, ...NIGHT_KEY], [4.6, ...NIGHT_KEY],
  [5.5, [44, 58, 112], [236, 150, 130], [170, 152, 192], 0.7, 0, 0.3],
  [6.4, [104, 160, 222], [255, 214, 170], [255, 228, 204], 0.15, 0.55, 0.8],
  [8, [84, 160, 232], [206, 232, 248], [255, 255, 255], 0, 1, 0],
  [16.2, [84, 160, 232], [206, 232, 248], [255, 255, 255], 0, 1, 0],
  [17.8, [92, 140, 214], [255, 208, 140], [255, 230, 194], 0.06, 0.9, 1],
  [18.9, [62, 76, 150], [255, 138, 92], [238, 174, 154], 0.5, 0.5, 0.8],
  [19.8, [30, 38, 92], [130, 78, 128], [152, 136, 190], 0.88, 0.1, 0.2],
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
    star: clamp((nf - 0.4) / 0.6, 0, 1) * (1 - W.cloud)
  };
}
/* kept for older callers: night darkness and warmth as plain numbers */
function dayLight(t) { const A = skyAt(t, S ? S.day : 1); return { a: 0.58 * A.nf, warm: 0.16 * A.warm }; }

function beginFrame(A) {
  FX.A = A; FX.nf = clamp(A.nf, 0, 1);
  FX.glows.length = 0; FX.lights.length = 0; FX.emit.length = 0; FX.beams.length = 0; FX.over.length = 0;
  FX.wind = 0.3 + A.rain * 0.7 + A.cloud * 0.2 + (A.snow || 0) * 0.3;
  const L = lerp(1.5, 0.42, A.el);
  FX.sh.a = 0.3 * A.sh; FX.sh.dx = -A.sunX * L * 1.15; FX.sh.dy = 0.34 + L * 0.5;
  const n = clamp(A.nf * 1.15, 0, 1);
  FX.glassA = rgbS(mix3(mix3(A.top, [255, 255, 255], 0.3), [30, 44, 72], n));
  FX.glassB = rgbS(mix3(mix3(A.bot, A.top, 0.45), [20, 30, 54], n));
  FX.glint = (0.34 * (1 - n)).toFixed(2);
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
  const tm = FX.time, vw = vx1 - vx0;
  const g = c.createLinearGradient(0, 0, 0, TOP_Y);
  g.addColorStop(0, rgbS(A.top)); g.addColorStop(0.62, rgbS(mix3(A.top, A.bot, 0.55))); g.addColorStop(1, rgbS(A.bot));
  c.fillStyle = g; c.fillRect(vx0 - 4, -600, vw + 8, TOP_Y + 600);
  // stars
  if (A.star > 0.02) {
    c.fillStyle = '#ffffff';
    for (const s of STARS) {
      const tw = REDUCED ? 0.8 : 0.55 + 0.45 * Math.sin(tm * 1.7 + s.p);
      c.globalAlpha = A.star * tw; c.fillRect(vx0 + s.x * vw, s.y * (TOP_Y - 70), s.s, s.s);
    }
    c.globalAlpha = 1;
  }
  // sun and moon ride an arc across whatever part of the sky is on screen
  if (A.sunUp) {
    const sx = vx0 + vw * (0.5 + A.sunX * 0.4), sy = TOP_Y - 34 - A.el * 250;
    const low = 1 - A.el, a = (1 - A.cloud * 0.8);
    c.globalAlpha = 0.55 * a; c.drawImage(GLOW[low > 0.6 ? 5 : 0], sx - 190, sy - 190, 380, 380);
    c.globalAlpha = a; c.fillStyle = rgbS(mix3([255, 250, 224], [255, 170, 96], clamp(low * 1.3 - 0.3, 0, 1)));
    c.beginPath(); c.arc(sx, sy, 24, 0, 7); c.fill(); c.globalAlpha = 1;
  } else if (A.mf >= 0) {
    const mx = vx0 + vw * (0.86 - A.mf * 0.72), my = TOP_Y - 60 - Math.sin(Math.PI * A.mf) * 210, a = 1 - A.cloud * 0.75;
    c.globalAlpha = 0.4 * a; c.drawImage(GLOW[1], mx - 110, my - 110, 220, 220);
    c.globalAlpha = a; c.fillStyle = '#f2f5ff'; c.beginPath(); c.arc(mx, my, 17, 0, 7); c.fill();
    c.fillStyle = rgbS(mix3(A.top, [200, 208, 235], 0.25)); c.beginPath(); c.arc(mx + 7, my - 4, 14, 0, 7); c.fill();
    c.globalAlpha = 1;
  }
  // clouds
  const cc = mix3(mix3([255, 255, 255], A.bot, 0.3 + 0.4 * A.warm), [70, 80, 122], clamp(A.nf * 0.9, 0, 1));
  const cd = mix3(cc, A.top, 0.4), n = 9 + Math.round(A.cloud * 8);
  for (let i = 0; i < n; i++) {
    const sp = 5 + (i % 4) * 3, span = WORLD.w + 1400;
    const x = ((i * 431.7 + (REDUCED ? 0 : tm) * sp) % span) - 500 + CAM.x * 0.22, y = 34 + ((i * 67) % 190), s = 0.8 + ((i * 37) % 10) / 9;
    if (x + 150 * s < vx0 || x - 150 * s > vx1) continue;
    c.globalAlpha = 0.86;
    c.fillStyle = rgbS(cd);
    c.beginPath(); c.ellipse(x, y + 9 * s, 78 * s, 15 * s, 0, 0, 7); c.fill();
    c.fillStyle = rgbS(cc);
    c.beginPath(); c.arc(x - 38 * s, y, 22 * s, 0, 7); c.arc(x - 8 * s, y - 13 * s, 30 * s, 0, 7); c.arc(x + 28 * s, y - 5 * s, 25 * s, 0, 7); c.arc(x + 54 * s, y + 3 * s, 16 * s, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  if (A.cloud > 0.02) { c.fillStyle = rgbaS(mix3(A.bot, [120, 128, 142], 0.5), A.cloud * 0.5); c.fillRect(vx0 - 4, 0, vw + 8, TOP_Y); }
  // two layers of distant towers, drifting slower than the street
  const af = [A.amb[0] / 255, A.amb[1] / 255, A.amb[2] / 255];
  [0, 1].forEach(layer => {
    const par = layer ? 0.26 : 0.46, base = layer ? [92, 108, 136] : [128, 146, 172];
    const col = mix3(A.bot, [base[0] * af[0], base[1] * af[1], base[2] * af[2]], layer ? 0.6 : 0.26);
    const colS = rgbS(col), colL = rgbS(mix3(col, A.bot, 0.3));
    for (const s of SKYLINE[layer]) {
      const x = s.x + CAM.x * par;
      if (x > vx1 || x + s.w < vx0) continue;
      const ty = TOP_Y - s.h;
      c.fillStyle = colS; c.fillRect(x, ty, s.w, s.h);
      if (s.top === 1) c.fillRect(x + s.w * 0.25, ty - 12, s.w * 0.5, 12);
      else if (s.top === 2) { c.fillRect(x + s.w / 2 - 1.5, ty - 26, 3, 26); c.fillRect(x + s.w * 0.3, ty - 7, s.w * 0.4, 7); }
      else if (s.top === 3) { c.beginPath(); c.moveTo(x, ty); c.lineTo(x + s.w * 0.5, ty - 16); c.lineTo(x + s.w, ty); c.closePath(); c.fill(); }
      c.fillStyle = colL; c.fillRect(x, ty, 4, s.h);
      if (layer) {
        // windows: a pale grid by day, a scatter of lit rooms after dark
        const lit = A.nf > 0.25;
        c.fillStyle = lit ? 'rgba(255,214,140,' + (0.9 * A.nf).toFixed(3) + ')' : 'rgba(255,255,255,.08)';
        let ry = 0;
        for (let yy = ty + 9; yy < TOP_Y - 14; yy += 15, ry++) {
          let rx = 0;
          for (let xx = x + 7; xx < x + s.w - 9; xx += 13, rx++) if (!lit || hash01(s.seed, ry, rx) > 0.62) c.fillRect(xx, yy, 6, 8);
        }
      }
    }
  });
  // tree line and the wall at the edge of town
  c.fillStyle = '#3c7550';
  c.beginPath();
  for (let x = Math.floor(vx0 / 34) * 34 - 34; x < vx1 + 34; x += 34) { const r = 17 + hash01(x, 3, 9) * 9; c.moveTo(x + r, TOP_Y - 12); c.arc(x, TOP_Y - 12, r, 0, 7); }
  c.fill();
  c.fillStyle = '#4c8a5c';
  c.beginPath();
  for (let x = Math.floor(vx0 / 34) * 34 - 17; x < vx1 + 34; x += 34) { const r = 11 + hash01(x, 5, 9) * 6; c.moveTo(x + r, TOP_Y - 9); c.arc(x, TOP_Y - 9, r, 0, 7); }
  c.fill();
  c.fillStyle = '#5a6570'; c.fillRect(vx0 - 4, TOP_Y - 10, vw + 8, 14);
  c.fillStyle = '#7b8791'; c.fillRect(vx0 - 4, TOP_Y - 10, vw + 8, 3);
  c.fillStyle = 'rgba(0,0,0,.2)'; for (let x = Math.floor(vx0 / 60) * 60; x < vx1; x += 60) c.fillRect(x, TOP_Y - 7, 1.5, 11);
}

function inCross(x0, x1) { return STREETS_X.some(cx => x1 > cx - STREET_W / 2 && x0 < cx + STREET_W / 2); }
function inRoadY(y0, y1) { return ROADS_H.some(r => y1 > r.y && y0 < r.y + r.h); }

