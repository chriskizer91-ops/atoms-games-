/* ============================ drawing helpers ============================ */
function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
const RGB_CACHE = new Map();
function hexRgb(h) {
  let v = RGB_CACHE.get(h);
  if (v) return v;
  if (h.charAt(0) === '#') {
    let s = h.slice(1);
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  } else {
    const m = h.match(/[\d.]+/g) || [0, 0, 0];
    v = [+m[0], +m[1], +m[2]];
  }
  if (RGB_CACHE.size < 4000) RGB_CACHE.set(h, v);
  return v;
}
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
}
function shade(h, t) { return t >= 0 ? mix(h, '#ffffff', t) : mix(h, '#000000', -t); }
function rgbS(a) { return 'rgb(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ')'; }
function rgbaS(a, al) { return 'rgba(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ',' + al.toFixed(3) + ')'; }
function hash01(a, b, c) {
  let h = (a ^ (b * 374761393) ^ (c * 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) % 10000) / 10000;
}
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* per-frame lighting state. glows: lit rectangles (x,y,w,h,spill). lights: pools painted into the light map
   (x,y,rx,ry,kind,alpha). emit: additive halos drawn over the finished frame (x,y,r,kind,alpha). */
const FX = {
  nf: 0, time: 0, glows: [], lights: [], emit: [], beams: [], wins: [], over: [], A: null, wind: 0.3, fade: 0, demo: false,
  sh: { dx: 0, dy: 0.5, a: 0 }, glassA: '#a9d6ea', glassB: '#8fc4de', glint: '0.30'
};
function addLight(x, y, rx, ry, kind, a) { if (FX.nf > 0.05) FX.lights.push(x, y, rx, ry, kind, a); }
function addEmit(x, y, r, kind, a) { if (FX.nf > 0.05) FX.emit.push(x, y, r, kind, a); }
function litRect(x, y, w, h, spill) { if (FX.nf > 0.05) FX.glows.push(x, y, w, h, spill || 0); }

/* soft radial sprites, one per light colour: 0 warm, 1 cool, 2 red, 3 green, 4 pink, 5 amber, 6 shade (black) */
const GLOW_COL = [[255, 216, 150], [170, 214, 255], [255, 80, 70], [90, 255, 140], [255, 96, 150], [255, 190, 70], [10, 16, 40]];
const GLOW = GLOW_COL.map(col => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, rgbaS(col, 1)); rg.addColorStop(0.22, rgbaS(col, 0.72)); rg.addColorStop(0.5, rgbaS(col, 0.3)); rg.addColorStop(0.78, rgbaS(col, 0.08)); rg.addColorStop(1, rgbaS(col, 0));
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  return cv;
});
/* headlight beam: a cone fading away from the lamp at the left edge */
const BEAM = (function () {
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 96;
  const g = cv.getContext('2d'), lg = g.createLinearGradient(0, 0, 160, 0);
  lg.addColorStop(0, 'rgba(255,240,200,.95)'); lg.addColorStop(0.35, 'rgba(255,236,190,.4)'); lg.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = lg; g.beginPath(); g.moveTo(0, 42); g.lineTo(160, 4); g.lineTo(160, 92); g.lineTo(0, 54); g.closePath(); g.fill();
  return cv;
})();

/* repeating surface textures, drawn once at double density */
const PAT = {};
function makePat(name, size, scale, fn) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  fn(g, size, mulberry32(size * 31 + name.length * 977 + name.charCodeAt(0)));
  const p = g.createPattern(cv, 'repeat');
  try { if (p && p.setTransform) p.setTransform(new DOMMatrix().scale(scale)); } catch (e) { /* older browsers keep the unscaled tile */ }
  PAT[name] = p;
}
(function initPatterns() {
  const speck = (g, n, r, count, cols, s0, s1) => { for (let i = 0; i < count; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; const s = s0 + r() * (s1 - s0); g.fillRect(r() * n, r() * n, s, s); } };
  makePat('brick', 128, 0.5, (g, n, r) => {
    const bw = 32, bh = 16;
    for (let row = 0; row < n / bh; row++) for (let col = -1; col < n / bw; col++) {
      const v = r();
      g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.2).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.16).toFixed(3) + ')';
      g.fillRect(col * bw + (row % 2) * bw / 2, row * bh, bw, bh);
    }
    g.fillStyle = 'rgba(40,18,10,.3)';
    for (let row = 0; row < n / bh; row++) { g.fillRect(0, row * bh, n, 2); for (let col = 0; col <= n / bw; col++) g.fillRect(col * bw + (row % 2) * bw / 2, row * bh, 2, bh); }
    g.fillStyle = 'rgba(255,255,255,.07)';
    for (let row = 0; row < n / bh; row++) g.fillRect(0, row * bh + 2, n, 1.5);
  });
  makePat('siding', 64, 0.5, (g, n) => {
    for (let y = 0; y < n; y += 16) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y + 13, n, 3); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, y, n, 3); }
  });
  makePat('panel', 192, 0.5, (g, n, r) => {
    for (let y = 0; y < n; y += 64) for (let x = 0; x < n; x += 96) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.1).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.1).toFixed(3) + ')'; g.fillRect(x, y, 96, 64); }
    g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < n; y += 64) g.fillRect(0, y, n, 2); for (let x = 0; x < n; x += 96) g.fillRect(x, 0, 2, n);
    g.fillStyle = 'rgba(255,255,255,.1)'; for (let y = 0; y < n; y += 64) g.fillRect(0, y + 2, n, 1.5);
  });
  makePat('stucco', 128, 0.5, (g, n, r) => { speck(g, n, r, 420, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.08)'], 1, 3); });
  makePat('paver', 192, 0.5, (g, n, r) => {
    const s = 48;
    for (let row = 0; row < n / s; row++) for (let col = -1; col < n / s; col++) {
      const v = r();
      g.fillStyle = v < 0.5 ? 'rgba(60,50,30,' + (v * 0.13).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.2).toFixed(3) + ')';
      g.fillRect(col * s + (row % 2) * s / 2, row * s, s, s);
    }
    g.fillStyle = 'rgba(70,60,45,.22)';
    for (let row = 0; row < n / s; row++) { g.fillRect(0, row * s, n, 2); for (let col = 0; col <= n / s; col++) g.fillRect(col * s + (row % 2) * s / 2, row * s, 2, s); }
    speck(g, n, r, 160, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.07)'], 1, 2.5);
  });
  makePat('asphalt', 256, 0.5, (g, n, r) => {
    speck(g, n, r, 1500, ['rgba(255,255,255,.055)', 'rgba(0,0,0,.09)', 'rgba(180,190,200,.05)'], 1, 3);
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { let x = r() * n, y = r() * n; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 34; y += (r() - 0.3) * 22; g.lineTo(x, y); } g.stroke(); }
  });
  makePat('grass', 256, 0.5, (g, n, r) => {
    for (let i = 0; i < 620; i++) {
      const x = r() * n, y = r() * n, l = 3 + r() * 6, v = r();
      g.strokeStyle = v < 0.5 ? 'rgba(30,90,45,' + (0.1 + v * 0.3).toFixed(3) + ')' : 'rgba(190,235,140,' + (0.06 + (v - 0.5) * 0.3).toFixed(3) + ')';
      g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - l); g.stroke();
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(40,110,60,.07)'; g.beginPath(); g.ellipse(r() * n, r() * n, 14 + r() * 22, 8 + r() * 12, r() * 3, 0, 7); g.fill(); }
  });
  makePat('gravel', 128, 0.5, (g, n, r) => { speck(g, n, r, 520, ['rgba(120,95,60,.14)', 'rgba(255,250,235,.16)', 'rgba(90,75,55,.1)'], 1.5, 3.5); });
  makePat('fleck', 128, 0.5, (g, n, r) => { speck(g, n, r, 700, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.07)'], 1, 2.5); });
})();
function patFill(c, name, x, y, w, h, a) {
  const p = PAT[name]; if (!p) return;
  if (a != null) c.globalAlpha = a;
  c.fillStyle = p; c.fillRect(x, y, w, h);
  c.globalAlpha = 1;
}

/* a window: sky-coloured glass by day, a lived-in warm room when lit after dark */
function windowAt(c, x, y, w, h, lit) {
  const on = lit && FX.nf > 0.05;
  c.fillStyle = '#1d2a36'; c.fillRect(x - 2.5, y - 2.5, w + 5, h + 5);
  if (on) {
    const v = hash01(Math.round(x), Math.round(y), 7);
    c.fillStyle = v < 0.3 ? '#ffd27a' : v < 0.62 ? '#ffe3a6' : v < 0.88 ? '#ffc58a' : '#bfe0ff';
    c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, w, h * 0.3);
    c.fillStyle = v > 0.88 ? 'rgba(40,70,120,.25)' : 'rgba(140,70,20,.24)';
    if (v < 0.36) { c.fillRect(x, y, w * 0.2, h); c.fillRect(x + w * 0.8, y, w * 0.2, h); }
    else if (v < 0.66) { for (let yy = y + 3; yy < y + h * 0.62; yy += 5) c.fillRect(x, yy, w, 1.8); }
    else if (w < 60) { c.fillRect(x + w * 0.52, y + h * 0.5, w * 0.34, h * 0.5); c.beginPath(); c.arc(x + w * 0.3, y + h * 0.62, w * 0.11, 0, 7); c.fill(); }
    litRect(x, y, w, h, w >= 60 ? 1 : 0);
  } else {
    c.fillStyle = FX.glassA; c.fillRect(x, y, w, h);
    c.fillStyle = FX.glassB; c.fillRect(x, y + h * 0.5, w, h * 0.5);
    c.fillStyle = 'rgba(255,255,255,' + FX.glint + ')';
    c.beginPath(); c.moveTo(x + w * 0.06, y + h); c.lineTo(x + w * 0.36, y); c.lineTo(x + w * 0.58, y); c.lineTo(x + w * 0.28, y + h); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(16,28,40,.6)'; c.fillRect(x + w / 2 - 0.9, y, 1.8, h);
  if (h >= 30 && w < 60) c.fillRect(x, y + h * 0.48, w, 1.6);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 3.5, y + h + 2.5, w + 7, 2.4);
  c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x - 2.5, y + h + 4.9, w + 5, 2);
}
function flowerBox(c, x, y, w, seed) {
  c.fillStyle = '#6a4630'; c.fillRect(x, y, w, 6);
  c.fillStyle = '#4c9a54'; for (let i = 0; i < w - 3; i += 4) { c.beginPath(); c.arc(x + 2.5 + i, y - 0.5, 3.4, 0, 7); c.fill(); }
  const cols = ['#ff6f91', '#ffd166', '#f8f9fa', '#c77dff', '#ff9a4d'];
  for (let i = 0; i < w - 4; i += 6) { c.fillStyle = cols[(seed + i) % cols.length]; c.beginPath(); c.arc(x + 4 + i, y - 2.6 - (i % 4) * 0.4, 1.9, 0, 7); c.fill(); }
}
function doorAt(c, cx, bottom, w, h, col, o) {
  o = o || {};
  const x = cx - w / 2, y = bottom - h;
  c.fillStyle = '#1c130e'; c.fillRect(x - 3.5, y - 3.5, w + 7, h + 3.5);
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.14)); g.addColorStop(1, shade(col, -0.16));
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const glassLit = o.lit && FX.nf > 0.05;
  c.fillStyle = glassLit ? '#ffdf9c' : FX.glassA;
  if (o.glass) { c.fillRect(x + 3, y + 4, w / 2 - 4.5, h - 12); c.fillRect(cx + 1.5, y + 4, w / 2 - 4.5, h - 12); }
  else { c.fillRect(x + 4, y + 5, w / 2 - 6, h * 0.42); c.fillRect(cx + 2, y + 5, w / 2 - 6, h * 0.42); }
  if (glassLit) litRect(x + 3, y + 4, w - 6, o.glass ? h - 12 : h * 0.42, 1);
  else { c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 4, y + 5, 3, o.glass ? h - 14 : h * 0.4); }
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(cx - 0.8, y, 1.6, h);
  c.fillStyle = '#e9c46a'; c.fillRect(cx - 5, bottom - h * 0.46, 2, 7); c.fillRect(cx + 3, bottom - h * 0.46, 2, 7);
  // step
  c.fillStyle = '#b9b3a6'; c.fillRect(x - 7, bottom - 2, w + 14, 5);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 7, bottom - 2, w + 14, 1.5);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x - 7, bottom + 3, w + 14, 2);
}
/* a wall lantern beside a door */
function sconce(c, x, y) {
  c.fillStyle = '#2b3138'; c.fillRect(x - 1.5, y - 7, 3, 4); c.fillRect(x - 3.5, y - 4, 7, 2);
  c.fillStyle = FX.nf > 0.05 ? '#fff0c0' : '#d9e2e6'; c.fillRect(x - 2.5, y - 2, 5, 7);
  c.fillStyle = '#2b3138'; c.fillRect(x - 3.5, y + 5, 7, 1.6);
  if (FX.nf > 0.05) { litRect(x - 2.5, y - 2, 5, 7); addLight(x, y + 18, 46, 40, 0, 0.75); addEmit(x, y + 1, 14, 0, 0.5); }
}
function signText(c, text, cx, y, size, col) {
  c.font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = col; c.fillText(text, cx, y);
}
/* lettering with a soft drop, for building names; lit like a sign box after dark when `glow` is set */
function nameSign(c, text, cx, y, size, col, glow, kind) {
  c.font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillText(text, cx + 0.8, y + 1.4);
  c.fillStyle = col; c.fillText(text, cx, y);
  if (glow && FX.nf > 0.05) {
    const w = c.measureText(text).width;
    litRect(cx - w / 2 - 3, y - size * 0.55, w + 6, size * 1.1);
    addEmit(cx, y, w * 0.62, kind == null ? 0 : kind, 0.34);
  }
}
/* scalloped, striped shop awning */
function awning(c, x, y, w, h, colA, colB) {
  const n = Math.max(4, Math.round(w / 22)), sw = w / n;
  for (let i = 0; i < n; i++) {
    c.fillStyle = i % 2 ? colB : colA;
    c.beginPath(); c.moveTo(x + i * sw, y); c.lineTo(x + (i + 1) * sw, y); c.lineTo(x + (i + 1) * sw, y + h - 3);
    c.arc(x + (i + 0.5) * sw, y + h - 3, sw / 2, 0, Math.PI); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, w, 3);
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x, y + h * 0.55, w, h * 0.45 - 3);
  const sg = c.createLinearGradient(0, y + h, 0, y + h + 12); sg.addColorStop(0, 'rgba(0,0,0,.26)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sg; c.fillRect(x + 4, y + h, w - 8, 12);
}
function roofProps(c, b, seed) {
  const n = 1 + Math.floor(hash01(seed, 1, 2) * 2.99), y = b.y;
  for (let i = 0; i < n; i++) {
    const t = hash01(seed, i, 3), px = b.x + 16 + ((i + hash01(seed, i, 4) * 0.7) / n) * (b.w - 62);
    if (t < 0.34) {
      c.fillStyle = '#9aa3aa'; c.fillRect(px, y - 14, 30, 14); c.fillStyle = '#7b848b'; c.fillRect(px, y - 4, 30, 4);
      c.fillStyle = '#5d666d'; for (let k = 0; k < 4; k++) c.fillRect(px + 4 + k * 6, y - 11, 3, 6);
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(px, y - 14, 30, 2);
    } else if (t < 0.58) {
      c.fillStyle = '#7b848b'; c.fillRect(px, y - 18, 7, 18); c.fillStyle = '#5d666d'; c.fillRect(px - 2, y - 21, 11, 4);
    } else if (t < 0.8) {
      c.fillStyle = '#4a545c'; c.fillRect(px, y - 30, 2, 30); c.fillRect(px - 7, y - 26, 16, 1.5); c.fillRect(px - 5, y - 21, 12, 1.5);
    } else {
      c.fillStyle = '#6a4f3a'; c.fillRect(px + 2, y - 8, 3, 8); c.fillRect(px + 21, y - 8, 3, 8);
      c.fillStyle = '#8a6a4c'; c.fillRect(px, y - 28, 26, 20);
      c.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 1; k < 4; k++) c.fillRect(px + k * 6.5, y - 28, 1, 20);
      c.fillStyle = '#5a4634'; c.beginPath(); c.moveTo(px - 2, y - 28); c.lineTo(px + 13, y - 36); c.lineTo(px + 28, y - 28); c.closePath(); c.fill();
    }
  }
}
