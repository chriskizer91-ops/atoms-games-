/* ============================ v2 sky: volumetric clouds, richer skyline, sun, moon, stars, rare sights ============================
   Everything here is painted by drawSky() (08-camera-sky.js). Clouds are small cached sprites that are re-tinted
   when the time of day moves on (one per frame), the skyline uses cached window patterns, nothing allocates per frame. */
const SKYPOS = { x: 0, y: 0, low: 0 };
function skySunPos(A, vx0, vw) {
  SKYPOS.x = vx0 + vw * (0.5 + A.sunX * 0.4); SKYPOS.y = TOP_Y - 34 - A.el * 250; SKYPOS.low = 1 - A.el;
  return SKYPOS;
}
/* soft round sprites the sky and weather share: a white puff, a bright flare disc, a flake */
function atmoSprite(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); return cv; }
const SKY_RAYS = atmoSprite(320, 320, (g, w, h) => {
  g.translate(w / 2, h / 2);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + hash01(i, 3, 3) * 0.2, wd = 0.05 + hash01(i, 5, 3) * 0.06, len = 90 + hash01(i, 9, 3) * 70;
    const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    gr.addColorStop(0, 'rgba(255,240,205,.55)'); gr.addColorStop(1, 'rgba(255,240,205,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - wd) * len, Math.sin(a - wd) * len); g.lineTo(Math.cos(a + wd) * len, Math.sin(a + wd) * len); g.closePath(); g.fill();
  }
});
const SKY_MOON = atmoSprite(96, 96, (g, w, h) => {
  const gr = g.createRadialGradient(40, 38, 4, 48, 48, 34);
  gr.addColorStop(0, '#fffefa'); gr.addColorStop(0.6, '#f0f1f4'); gr.addColorStop(1, '#d5d8e2');
  g.fillStyle = gr; g.beginPath(); g.arc(48, 48, 34, 0, 7); g.fill();
  const r = mulberry32(33);
  g.fillStyle = 'rgba(120,128,150,.2)';
  [[36, 38, 9], [58, 52, 11], [44, 62, 6], [60, 34, 5], [32, 54, 5], [50, 44, 4]].forEach(m => { g.beginPath(); g.arc(m[0], m[1], m[2], 0, 7); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(30 + r() * 36, 30 + r() * 36, 1 + r() * 2.4, 0, 7); g.fill(); }
});

/* ---------- clouds ---------- */
const SKYC = { spr: [], key: [], n: 6, ready: false };
function skyCloudPal(A) {
  const nf = clamp(A.nf * 0.9, 0, 1), warm = A.warm;
  let lit = mix3(mix3([255, 255, 255], A.bot, 0.22 + 0.5 * warm), [74, 88, 140], nf);
  let mid = mix3(lit, A.top, 0.2), shade = mix3(lit, A.top, 0.55);
  shade = [shade[0] * 0.9, shade[1] * 0.9, shade[2] * 0.97];
  if (A.cloud > 0.02) {
    const g = 0.3 + 0.7 * (1 - A.nf), k = A.cloud;
    lit = mix3(lit, [214 * g, 218 * g, 228 * g], k * 0.55); mid = mix3(mid, [164 * g, 170 * g, 184 * g], k * 0.6); shade = mix3(shade, [112 * g, 118 * g, 136 * g], k * 0.65);
  }
  if (A.storm > 0.05) {
    const g = 0.25 + 0.75 * (1 - A.nf), k = A.storm;
    lit = mix3(lit, [118 * g, 124 * g, 142 * g], k * 0.8); mid = mix3(mid, [78 * g, 84 * g, 104 * g], k * 0.85); shade = mix3(shade, [42 * g, 46 * g, 64 * g], k * 0.9);
  }
  const rim = mix3(mix3([255, 236, 208], [255, 168, 104], warm), [150, 170, 230], nf);
  return { lit, mid, shade, rim, rimA: clamp(0.35 + warm * 0.55, 0, 1) * (1 - nf * 0.7) * (1 - A.cloud * 0.5) };
}
function skyCloudKey(p) {
  const q = a => Math.round(a[0] / 8) + ',' + Math.round(a[1] / 8) + ',' + Math.round(a[2] / 8);
  return q(p.lit) + '|' + q(p.mid) + '|' + q(p.shade) + '|' + q(p.rim) + '|' + Math.round(p.rimA * 5);
}
function skyBuildCloud(i, p) {
  const cv = SKYC.spr[i] || (SKYC.spr[i] = document.createElement('canvas'));
  cv.width = 448; cv.height = 176;
  const g = cv.getContext('2d'), r = mulberry32(41 + i * 17), n = 7 + (i % 3), L = [];
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n, mid = 1 - Math.abs(u - 0.5) * 2, rad = 24 + mid * (32 + r() * 22) + r() * 10;
    L.push({ x: 58 + u * 332 + (r() - 0.5) * 24, y: 122 - rad * (0.5 + r() * 0.38), r: rad });
  }
  const lobe = (x, y, rd, col, a) => {
    const gr = g.createRadialGradient(x, y, rd * 0.12, x, y, rd);
    gr.addColorStop(0, rgbaS(col, a)); gr.addColorStop(0.7, rgbaS(col, a * 0.94)); gr.addColorStop(1, rgbaS(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rd, 0, 7); g.fill();
  };
  for (const l of L) lobe(l.x + 2, l.y + 9, l.r, p.shade, 1);
  for (const l of L) lobe(l.x - 2, l.y + 1, l.r * 0.92, p.mid, 1);
  for (const l of L) lobe(l.x - l.r * 0.2, l.y - l.r * 0.24, l.r * 0.66, p.lit, 0.96);
  g.globalCompositeOperation = 'source-atop';
  const bg = g.createLinearGradient(0, 60, 0, 150); bg.addColorStop(0, rgbaS(p.shade, 0)); bg.addColorStop(1, rgbaS(p.shade, 0.7));
  g.fillStyle = bg; g.fillRect(0, 0, 448, 176);
  if (p.rimA > 0.05) {
    g.strokeStyle = rgbaS(p.rim, p.rimA); g.lineWidth = 3; g.lineCap = 'round';
    for (const l of L) { if (l.r < 40) continue; g.beginPath(); g.arc(l.x - 2, l.y + 1, l.r * 0.9, Math.PI * 1.05, Math.PI * 1.62); g.stroke(); }
  }
  g.globalCompositeOperation = 'destination-out';
  const fg = g.createLinearGradient(0, 128, 0, 158); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fg; g.fillRect(0, 120, 448, 56);
  g.globalCompositeOperation = 'source-over';
}
function skyClouds(c, A, vx0, vx1) {
  const tm = REDUCED ? 0 : FX.time, pal = skyCloudPal(A), key = skyCloudKey(pal);
  if (!SKYC.ready) { for (let i = 0; i < SKYC.n; i++) { skyBuildCloud(i, pal); SKYC.key[i] = key; } SKYC.ready = true; }
  else for (let i = 0; i < SKYC.n; i++) if (SKYC.key[i] !== key) { skyBuildCloud(i, pal); SKYC.key[i] = key; break; }
  const n = 9 + Math.round(A.cloud * 8) + (A.storm > 0.1 ? 3 : 0), flip = A.sunX > 0, span = WORLD.w + 1400, big = 1 + A.storm * 0.35;
  for (let i = 0; i < n; i++) {
    const sp = 5 + (i % 4) * 3, s = (0.72 + ((i * 37) % 10) / 12) * big;
    const x = ((i * 431.7 + tm * sp) % span) - 500 + CAM.x * 0.22, y = 40 + ((i * 67) % 190) + A.storm * 22;
    const w = 238 * s, h = w * 176 / 448;
    if (x + w / 2 < vx0 || x - w / 2 > vx1) continue;
    const spr = SKYC.spr[i % SKYC.n]; if (!spr) continue;
    c.globalAlpha = 0.82 + (i % 3) * 0.06;
    if (flip) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(spr, -w / 2, y - h * 0.74, w, h); c.restore(); }
    else c.drawImage(spr, x - w / 2, y - h * 0.74, w, h);
  }
  c.globalAlpha = 1;
}

/* ---------- skyline: three layers of distant towers with depth haze ---------- */
const SKY_LAYERS = [
  { par: 0.58, base: [152, 172, 198], haze: 0.62, win: 0, hmin: 80, hmax: 250, wmin: 36, wmax: 84, pitch: 0.5 },
  { par: 0.42, base: [122, 140, 168], haze: 0.4, win: 1, hmin: 60, hmax: 230, wmin: 40, wmax: 92, pitch: 0.55 },
  { par: 0.27, base: [88, 104, 134], haze: 0.16, win: 1, hmin: 46, hmax: 200, wmin: 44, wmax: 100, pitch: 0.6 }
];
const SKY3 = SKY_LAYERS.map((L, li) => {
  const r = mulberry32(110 + li * 31), out = []; let x = -2300;
  while (x < WORLD.w + 500) {
    const w = L.wmin + r() * (L.wmax - L.wmin), h = L.hmin + r() * r() * (L.hmax - L.hmin), kind = Math.floor(r() * 7), seed = Math.floor(r() * 9999);
    const rects = [[0, 0, w, h]], tris = [];
    let mast = 0;
    if (kind === 1) { const u = h * (0.18 + r() * 0.12); rects.push([w * 0.16, -u, w * 0.68, u]); if (r() < 0.6) rects.push([w * 0.3, -u - h * 0.1, w * 0.4, h * 0.1]); }
    else if (kind === 2) { rects.push([w * 0.3, -9, w * 0.4, 9]); mast = 20 + r() * 40; rects.push([w / 2 - 1.2, -9 - mast, 2.4, mast]); }
    else if (kind === 3) { rects.push([w * 0.12, -h * 0.14, w * 0.76, h * 0.14], [w * 0.28, -h * 0.24, w * 0.44, h * 0.1], [w * 0.42, -h * 0.34, w * 0.16, h * 0.1]); mast = 14; rects.push([w / 2 - 1, -h * 0.34 - mast, 2, mast]); }
    else if (kind === 4) { const tx = w * (0.2 + r() * 0.4); rects.push([tx, -17, 14, 12], [tx + 1, -5, 2, 5], [tx + 11, -5, 2, 5]); tris.push([tx - 1.5, -17, tx + 7, -24, tx + 15.5, -17]); }
    else if (kind === 5) { tris.push([0, 0, w, 0, w, -h * 0.16]); }
    else if (kind === 6 && li > 0 && r() < 0.5) { const mh = 70 + r() * 50, jx = w * 0.5; rects.push([jx - 1.4, -mh, 2.8, mh], [jx - 30, -mh, 66, 2.2], [jx - 30, -mh, 2.2, 10], [jx + 31, -mh - 6, 6, 8]); mast = mh; }
    out.push({ x, w, h, rects, tris, seed, blink: (kind === 2 || kind === 3 || kind === 6) && li > 0 ? 1 + mast : 0, topY: mast });
    x += w * (0.62 + r() * 0.5);
  }
  return out;
});
/* window patterns on a 13 x 15 grid, 8 x 8 windows to a tile, drawn at double density: pale glass for the day, dark glass at night,
   and two disjoint sets of lit rooms that switch on one after the other at dusk, in clusters */
const SKY_WIN = (function () {
  const PW = 13, PH = 15, N = 8, out = {};
  const make = (fn, a) => {
    const cv = atmoSprite(PW * N * 2, PH * N * 2, (g, w, h) => { g.scale(2, 2); fn(g); });
    const p = cv.getContext('2d').createPattern(cv, 'repeat');
    try { if (p && p.setTransform) p.setTransform(new DOMMatrix().scale(0.5)); } catch (e) { /* keeps the unscaled tile */ }
    return p;
  };
  const r = mulberry32(5), set = [];
  for (let row = 0; row < N; row++) for (let col = 0; col < N; col++) set.push(r());
  // cluster: a window tends to share its fate with the one before it
  for (let i = 1; i < set.length; i++) if (i % N) set[i] = set[i] * 0.55 + set[i - 1] * 0.45;
  const each = (g, test, col) => { for (let row = 0; row < N; row++) for (let colm = 0; colm < N; colm++) { const v = set[row * N + colm]; if (test(v)) { g.fillStyle = typeof col === 'function' ? col(v, row, colm) : col; g.fillRect(colm * PW + 3.5, row * PH + 3.5, 6, 8); } } };
  out.day = make(g => each(g, () => true, (v) => v > 0.5 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.11)'));
  out.dark = make(g => each(g, () => true, 'rgba(8,12,30,.34)'));
  out.a = make(g => each(g, v => v > 0.62, (v) => v > 0.86 ? 'rgb(200,224,255)' : (v > 0.74 ? 'rgb(255,226,160)' : 'rgb(255,208,128)')));
  out.b = make(g => each(g, v => v > 0.42 && v <= 0.62, (v) => v > 0.55 ? 'rgb(255,214,140)' : 'rgb(255,196,118)'));
  out.PW = PW; out.PH = PH; out.N = N;
  return out;
})();
function skyLayerDraw(c, A, li, vx0, vx1, af) {
  const L = SKY_LAYERS[li], layer = SKY3[li], nf = clamp(A.nf, 0, 1);
  const hazeC = mix3(A.bot, A.top, 0.12);
  const base = [L.base[0] * af[0], L.base[1] * af[1], L.base[2] * af[2]];
  const col = mix3(base, hazeC, L.haze), colS = rgbS(col);
  const edge = mix3(col, [255, 222, 178], clamp(A.warm * 0.55 * (1 - nf), 0, 0.6)), edgeS = rgbS(mix3(edge, hazeC, 0.1));
  c.fillStyle = colS; c.beginPath();
  const vis = [];
  for (const b of layer) {
    const x = b.x + CAM.x * L.par;
    if (x > vx1 || x + b.w < vx0) continue;
    vis.push(b, x);
    const ty = TOP_Y - b.h;
    for (const r of b.rects) c.rect(x + r[0], ty + r[1], r[2], r[3]);
    for (const t of b.tris) { c.moveTo(x + t[0], ty + t[1]); c.lineTo(x + t[2], ty + t[3]); c.lineTo(x + t[4], ty + t[5]); c.closePath(); }
  }
  c.fill();
  c.fillStyle = edgeS; c.beginPath();
  for (let i = 0; i < vis.length; i += 2) { const b = vis[i], x = vis[i + 1]; c.rect(x, TOP_Y - b.h, L.win ? 4 : 3, b.h); }
  c.fill();
  if (L.win) {
    const dayA = (1 - clamp(nf * 2.5, 0, 1)) * 0.9, darkA = clamp(nf * 2, 0, 1) * 0.9, aA = clamp((nf - 0.22) * 3.2, 0, 1), bA = clamp((nf - 0.55) * 2.6, 0, 1);
    for (let i = 0; i < vis.length; i += 2) {
      const b = vis[i], x = vis[i + 1], ty = TOP_Y - b.h;
      const iw = Math.floor((b.w - 12) / SKY_WIN.PW) * SKY_WIN.PW, ih = Math.floor((b.h - 22) / SKY_WIN.PH) * SKY_WIN.PH;
      if (iw < SKY_WIN.PW || ih < SKY_WIN.PH) continue;
      const ox = (b.seed % SKY_WIN.N) * SKY_WIN.PW, oy = (((b.seed >> 3) % SKY_WIN.N)) * SKY_WIN.PH;
      c.save(); c.translate(x + 6 - ox, ty + 9 - oy);
      if (dayA > 0.02) { c.globalAlpha = dayA; c.fillStyle = SKY_WIN.day; c.fillRect(ox, oy, iw, ih); }
      if (darkA > 0.02) { c.globalAlpha = darkA; c.fillStyle = SKY_WIN.dark; c.fillRect(ox, oy, iw, ih); }
      if (aA > 0.02) { c.globalAlpha = aA; c.fillStyle = SKY_WIN.a; c.fillRect(ox, oy, iw, ih); }
      if (bA > 0.02) { c.globalAlpha = bA; c.fillStyle = SKY_WIN.b; c.fillRect(ox, oy, iw, ih); }
      c.restore();
    }
    c.globalAlpha = 1;
  }
  // red obstruction lights blink on the masts after dark
  if (nf > 0.3 && L.win) {
    const tm = REDUCED ? 0 : FX.time;
    for (let i = 0; i < vis.length; i += 2) {
      const b = vis[i], x = vis[i + 1];
      if (!b.blink) continue;
      const on = REDUCED || ((tm * 0.8 + b.seed * 0.37) % 1.6) < 0.7;
      if (!on) continue;
      const px = x + b.w / 2, py = TOP_Y - b.h - b.blink - 8;
      c.globalAlpha = nf; c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill();
      c.globalAlpha = 0.55 * nf; c.globalCompositeOperation = 'lighter'; c.drawImage(GLOW[2], px - 11, py - 11, 22, 22); c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
  }
  // depth haze: the far end of each layer melts into the horizon colour
  const hg = c.createLinearGradient(0, TOP_Y - L.hmax - 40, 0, TOP_Y);
  hg.addColorStop(0, rgbaS(hazeC, 0)); hg.addColorStop(1, rgbaS(hazeC, 0.12 + L.haze * 0.5));
  c.fillStyle = hg; c.fillRect(vx0 - 4, TOP_Y - L.hmax - 40, vx1 - vx0 + 8, L.hmax + 40);
}

/* ---------- rare sights: a plane, a blimp, shooting stars, a rainbow after the rain ---------- */
function skyPlane(c, A, vx0, vx1) {
  const per = 170, ph = (FX.time + 40) % per, dur = 62, vw = vx1 - vx0;
  if (ph > dur) return;
  const lap = Math.floor((FX.time + 40) / per), dir = lap % 2 ? -1 : 1, p = ph / dur;
  const x = (dir > 0 ? vx0 - 80 : vx1 + 80) + dir * p * (vw + 160), y = CAM.y + (TOP_Y - CAM.y) * (0.14 + hash01(lap, 3, 8) * 0.18);
  const nf = clamp(A.nf, 0, 1), body = rgbS(mix3([236, 240, 246], [40, 48, 70], nf * 0.8));
  c.save(); c.translate(x, y); c.scale(dir, 1);
  const tr = c.createLinearGradient(-190, 0, 0, 0); tr.addColorStop(0, 'rgba(255,255,255,0)'); tr.addColorStop(1, 'rgba(255,255,255,' + (0.38 * (1 - nf)).toFixed(2) + ')');
  c.fillStyle = tr; c.fillRect(-190, -1.1, 190, 2.2);
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 11, 2.2, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-3, 0); c.lineTo(-9, 6); c.lineTo(-5, 6); c.lineTo(3, 0.6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-9, -0.5); c.lineTo(-12, -5); c.lineTo(-9.5, -5); c.lineTo(-6, -0.5); c.closePath(); c.fill();
  if (nf > 0.25) {
    const on = (FX.time * 1.3) % 1 < 0.35;
    c.fillStyle = on ? '#ffffff' : '#ff4a3a'; c.globalAlpha = nf; c.beginPath(); c.arc(on ? 0 : -12, on ? 5.4 : -4.6, 1.2, 0, 7); c.fill(); c.globalAlpha = 1;
  }
  c.restore();
}
function skyBlimp(c, A, vx0, vx1) {
  const per = 520, ph = (FX.time + 210) % per, dur = 150;
  if (ph > dur) return;
  const vw = vx1 - vx0, p = ph / dur, x = vx1 + 90 - p * (vw + 180), y = CAM.y + (TOP_Y - CAM.y) * 0.3 + Math.sin(FX.time * 0.3) * 3;
  const nf = clamp(A.nf, 0, 1), lit = rgbS(mix3(mix3([244, 238, 228], A.bot, 0.3), [60, 70, 110], nf * 0.85)), dk = rgbS(mix3(mix3([200, 196, 192], A.bot, 0.3), [36, 44, 80], nf * 0.85));
  c.save(); c.translate(x, y);
  c.fillStyle = dk; c.beginPath(); c.moveTo(-26, -2); c.lineTo(-38, -12); c.lineTo(-32, -2); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-26, 2); c.lineTo(-38, 12); c.lineTo(-32, 2); c.closePath(); c.fill();
  c.fillStyle = lit; c.beginPath(); c.ellipse(0, 0, 36, 12, 0, 0, 7); c.fill();
  c.fillStyle = dk; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(0, 5, 34, 6, 0, 0, Math.PI); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#c0392b'; c.fillRect(-14, -1.5, 22, 3);
  c.fillStyle = dk; c.fillRect(-5, 11, 10, 3.2);
  if (nf > 0.25) { c.fillStyle = '#ffe9a8'; c.globalAlpha = nf; c.beginPath(); c.arc(0, 13, 1.1, 0, 7); c.arc(34, 0, 1, 0, 7); c.fill(); c.globalAlpha = 1; }
  c.restore();
}
function skyShooting(c, A, vx0, vx1) {
  const per = 17, t = FX.time % per, dur = 0.85;
  if (t > dur) return;
  const cyc = Math.floor(FX.time / per), p = t / dur, vw = vx1 - vx0;
  const sx = vx0 + vw * (0.15 + hash01(cyc, 4, 4) * 0.6), sy = CAM.y + (TOP_Y - CAM.y) * (0.06 + hash01(cyc, 5, 4) * 0.25);
  const hx = sx + p * 170, hy = sy + p * 76, tx = hx - 62, ty = hy - 27;
  const g = c.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,' + (0.95 * A.star * Math.sin(p * Math.PI)).toFixed(2) + ')');
  c.strokeStyle = g; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke(); c.lineCap = 'butt';
}
function skyRainbow(c, A, vx0, vx1) {
  if (!(A.wet > 0.2 && A.rain < 0.05 && A.sunUp && A.el < 0.8 && A.nf < 0.1 && A.cloud < 0.7)) return;
  if (hash01(S ? S.day : 1, 61, 7) > 0.5) return;
  const a = clamp((A.wet - 0.2) * 3, 0, 1) * 0.34 * (1 - A.cloud), vw = vx1 - vx0;
  const cx = vx0 + vw * (0.5 - A.sunX * 0.32), cy = TOP_Y + 150, R = 420;
  const cols = ['255,80,80', '255,150,70', '255,226,90', '110,220,120', '90,180,255', '120,110,240', '190,120,240'];
  c.lineWidth = 7; c.globalCompositeOperation = 'lighter';
  cols.forEach((col, i) => { c.strokeStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')'; c.beginPath(); c.arc(cx, cy, R - i * 6.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
  c.globalCompositeOperation = 'source-over';
}
function skyBolt(c, vx0, vx1) {
  const B = typeof STORM !== 'undefined' ? STORM : null;
  if (!B || !B.bolt || B.flash < 0.2) return;
  const vw = vx1 - vx0, yb = TOP_Y - 24, yt = yb - 330;
  c.lineJoin = 'round'; c.lineCap = 'round';
  [[10, 0.18], [4.5, 0.4], [1.8, 0.95]].forEach(w => {
    c.strokeStyle = 'rgba(214,226,255,' + (w[1] * Math.min(1, B.flash * 1.4)).toFixed(3) + ')'; c.lineWidth = w[0]; c.beginPath();
    B.bolt.forEach(seg => { c.moveTo(vx0 + vw * seg[0], yt + (yb - yt) * seg[1]); c.lineTo(vx0 + vw * seg[2], yt + (yb - yt) * seg[3]); });
    c.stroke();
  });
  c.lineJoin = 'miter'; c.lineCap = 'butt';
}

/* ---------- the whole sky ---------- */
function skyBody(c, A, vx0, vx1) {
  const tm = FX.time, vw = vx1 - vx0, nf = clamp(A.nf, 0, 1);
  // gradient with a longer, warmer horizon
  const g = c.createLinearGradient(0, TOP_Y - 330, 0, TOP_Y);
  g.addColorStop(0, rgbS(A.top)); g.addColorStop(0.34, rgbS(mix3(A.top, A.bot, 0.16))); g.addColorStop(0.62, rgbS(mix3(A.top, A.bot, 0.46)));
  g.addColorStop(0.85, rgbS(mix3(A.top, A.bot, 0.8))); g.addColorStop(1, rgbS(A.bot));
  c.fillStyle = g; c.fillRect(vx0 - 4, -600, vw + 8, TOP_Y + 600);
  // sunrise and sunset banding along the horizon: pink above orange above gold
  if (A.warm > 0.05 && A.cloud < 0.9) {
    const w = A.warm * (1 - A.cloud * 0.8), sp = skySunPos(A, vx0, vw);
    const bg = c.createLinearGradient(0, TOP_Y - 190, 0, TOP_Y); bg.addColorStop(0, 'rgba(255,120,170,0)'); bg.addColorStop(0.45, 'rgba(255,128,150,' + (0.16 * w).toFixed(3) + ')'); bg.addColorStop(0.75, 'rgba(255,160,96,' + (0.22 * w).toFixed(3) + ')'); bg.addColorStop(1, 'rgba(255,205,120,' + (0.3 * w).toFixed(3) + ')');
    c.fillStyle = bg; c.fillRect(vx0 - 4, TOP_Y - 190, vw + 8, 190);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * w;
    c.drawImage(GLOW[5], sp.x - 420, TOP_Y - 150, 840, 240);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // milky haze across the night sky
  if (A.star > 0.1) {
    c.save(); c.translate(vx0 + vw * 0.55, TOP_Y - 190); c.rotate(-0.42); c.globalAlpha = 0.16 * A.star; c.globalCompositeOperation = 'lighter';
    c.drawImage(GLOW[1], -vw * 0.7, -52, vw * 1.4, 104);
    c.globalAlpha = 0.1 * A.star; c.drawImage(GLOW[4], -vw * 0.4, -30, vw * 0.8, 60);
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // stars: most are faint and twinkle, a few are bright with a cross of light
  if (A.star > 0.02) {
    const ys = TOP_Y - 70;
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i], tw = REDUCED ? 0.8 : 0.5 + 0.5 * Math.sin(tm * (1.2 + (i % 5) * 0.3) + s.p);
      const x = vx0 + s.x * vw, y = s.y * ys;
      c.globalAlpha = A.star * (0.35 + 0.65 * tw) * (i % 9 === 0 ? 1 : 0.8);
      c.fillStyle = i % 7 === 0 ? '#ffe9c4' : i % 5 === 0 ? '#cfe0ff' : '#ffffff';
      c.fillRect(x, y, s.s, s.s);
      if (i % 13 === 0) {
        c.globalAlpha *= 0.55; c.fillRect(x - 3, y + s.s / 2 - 0.3, 6 + s.s, 0.6); c.fillRect(x + s.s / 2 - 0.3, y - 3, 0.6, 6 + s.s);
      }
    }
    c.globalAlpha = 1;
    skyShooting(c, A, vx0, vx1);
  }
  // sun with bloom and rays
  if (A.sunUp) {
    const sp = skySunPos(A, vx0, vw), low = sp.low, a = 1 - A.cloud * 0.8;
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.62 * a; c.drawImage(GLOW[low > 0.55 ? 5 : 0], sp.x - 300, sp.y - 300, 600, 600);
    c.globalAlpha = 0.5 * a; c.drawImage(GLOW[0], sp.x - 110, sp.y - 110, 220, 220);
    if (!REDUCED || true) {
      c.save(); c.translate(sp.x, sp.y); c.rotate(REDUCED ? 0 : tm * 0.015); c.globalAlpha = (0.2 + low * 0.18) * a * (1 - A.rain);
      c.drawImage(SKY_RAYS, -240, -240, 480, 480); c.restore();
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
    const rd = 23 + low * 7, core = mix3([255, 252, 232], [255, 176, 100], clamp(low * 1.3 - 0.3, 0, 1));
    const sg = c.createRadialGradient(sp.x - rd * 0.2, sp.y - rd * 0.2, rd * 0.1, sp.x, sp.y, rd);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.55, rgbS(core)); sg.addColorStop(1, rgbS(mix3(core, [255, 120, 60], 0.45)));
    c.fillStyle = sg; c.beginPath(); c.arc(sp.x, sp.y, rd, 0, 7); c.fill(); c.globalAlpha = 1;
  } else if (A.mf >= 0) {
    const mx = vx0 + vw * (0.86 - A.mf * 0.72), my = TOP_Y - 60 - Math.sin(Math.PI * A.mf) * 210, a = 1 - A.cloud * 0.75;
    const ph = ((S ? S.day : 1) % 29.5) / 29.5;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.34 * a; c.drawImage(GLOW[1], mx - 150, my - 150, 300, 300);
    c.globalAlpha = 0.25 * a; c.drawImage(GLOW[1], mx - 56, my - 56, 112, 112);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
    c.save(); c.beginPath(); c.arc(mx, my, 17, 0, 7); c.clip();
    c.drawImage(SKY_MOON, mx - 17, my - 17, 34, 34);
    // phase: a shadow disc slides across; at full it sits out of the way
    const k = Math.abs(ph - 0.5) * 2, off = (1 - Math.min(1, k * 1.15)) * 30 * (ph < 0.5 ? -1 : 1);
    if (k > 0.08) {
      c.fillStyle = rgbaS(mix3(A.top, [20, 26, 56], 0.45), 0.93); c.beginPath(); c.arc(mx + off, my - 1, 17, 0, 7); c.fill();
    }
    c.restore(); c.globalAlpha = 1;
  }
  if (A.sunUp || A.mf >= 0) skyRainbow(c, A, vx0, vx1);
  skyClouds(c, A, vx0, vx1);
  // storm: the whole sky goes slate, and lightning draws itself in
  if (A.storm > 0.05) {
    c.fillStyle = 'rgba(26,30,44,' + (0.46 * A.storm).toFixed(3) + ')'; c.fillRect(vx0 - 4, TOP_Y - 360, vw + 8, 360);
    skyBolt(c, vx0, vx1);
  }
  if (A.cloud > 0.02) { c.fillStyle = rgbaS(mix3(A.bot, [120, 128, 142], 0.5), A.cloud * 0.34); c.fillRect(vx0 - 4, 0, vw + 8, TOP_Y); }
  if (A.sunUp && A.nf < 0.4 && A.cloud < 0.5) skyPlane(c, A, vx0, vx1);
  if (A.sunUp && A.nf < 0.5 && A.cloud < 0.4) skyBlimp(c, A, vx0, vx1);
  else if (A.nf > 0.4 && A.cloud < 0.4) skyPlane(c, A, vx0, vx1);
}
function skyHorizon(c, A, vx0, vx1) {
  const vw = vx1 - vx0, af = [A.amb[0] / 255, A.amb[1] / 255, A.amb[2] / 255];
  for (let li = 0; li < 3; li++) skyLayerDraw(c, A, li, vx0, vx1, af);
  // tree line and the wall at the edge of town, lit by the sky colour
  const tf = [lerp(1, af[0], 0.8), lerp(1, af[1], 0.8), lerp(1, af[2], 0.8)], hz = mix3(A.bot, A.top, 0.1), nf = clamp(A.nf, 0, 1);
  const tint = (rgb, k) => rgbS(mix3([rgb[0] * tf[0], rgb[1] * tf[1], rgb[2] * tf[2]], hz, k));
  const far = tint([48, 98, 78], 0.3), near = tint([62, 128, 82], 0.1), hi = tint([112, 176, 104], 0.06);
  c.fillStyle = far; c.beginPath();
  for (let x = Math.floor(vx0 / 34) * 34 - 34; x < vx1 + 34; x += 34) { const r = 17 + hash01(x, 3, 9) * 9; c.moveTo(x + r, TOP_Y - 12); c.arc(x, TOP_Y - 12, r, 0, 7); }
  c.fill();
  c.fillStyle = near; c.beginPath();
  for (let x = Math.floor(vx0 / 34) * 34 - 17; x < vx1 + 34; x += 34) { const r = 11 + hash01(x, 5, 9) * 6; c.moveTo(x + r, TOP_Y - 9); c.arc(x, TOP_Y - 9, r, 0, 7); }
  c.fill();
  // sun-lit crowns and dark undersides give the trees volume
  c.fillStyle = hi; c.globalAlpha = 0.55 * (1 - nf * 0.7); c.beginPath();
  for (let x = Math.floor(vx0 / 34) * 34 - 17; x < vx1 + 34; x += 34) { const r = 11 + hash01(x, 5, 9) * 6; c.moveTo(x - r * 0.15 + r * 0.5, TOP_Y - 9 - r * 0.45); c.arc(x - r * 0.15, TOP_Y - 9 - r * 0.45, r * 0.5, 0, 7); }
  c.fill(); c.globalAlpha = 1;
  const sg = c.createLinearGradient(0, TOP_Y - 26, 0, TOP_Y - 6); sg.addColorStop(0, 'rgba(8,24,22,0)'); sg.addColorStop(1, 'rgba(8,24,22,.4)');
  c.fillStyle = sg; c.fillRect(vx0 - 4, TOP_Y - 26, vw + 8, 20);
  // the wall: stone with a cap, piers and a soft shadow line at its foot
  const wl = c.createLinearGradient(0, TOP_Y - 10, 0, TOP_Y + 4); wl.addColorStop(0, tint([128, 140, 150], 0.04)); wl.addColorStop(0.2, tint([98, 109, 120], 0.04)); wl.addColorStop(1, tint([72, 82, 92], 0.04));
  c.fillStyle = wl; c.fillRect(vx0 - 4, TOP_Y - 10, vw + 8, 14);
  c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(vx0 - 4, TOP_Y - 10, vw + 8, 1.6);
  c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(vx0 - 4, TOP_Y - 8.4, vw + 8, 1.2);
  c.fillStyle = 'rgba(0,0,0,.18)';
  for (let x = Math.floor(vx0 / 60) * 60; x < vx1; x += 60) { c.fillRect(x, TOP_Y - 7, 1.5, 11); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x + 1.5, TOP_Y - 7, 1, 11); c.fillStyle = 'rgba(0,0,0,.18)'; }
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(vx0 - 4, TOP_Y + 2, vw + 8, 2);
}
