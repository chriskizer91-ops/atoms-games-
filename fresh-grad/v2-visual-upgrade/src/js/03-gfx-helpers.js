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
  makePat('brick', 256, 0.5, (g, n, r) => {
    const bw = 32, bh = 16, rows = n / bh, cols = n / bw;
    for (let row = 0; row < rows; row++) for (let col = -1; col <= cols; col++) {
      const wc = ((col % cols) + cols) % cols, v = hash01(row, wc, 41), u = hash01(row, wc, 42), t = hash01(row, wc, 43);
      const x = col * bw + (row % 2) * bw / 2, y = row * bh;
      if (v < 0.08) g.fillStyle = 'rgba(28,12,8,' + (0.2 + u * 0.15).toFixed(3) + ')';
      else if (v < 0.5) g.fillStyle = 'rgba(30,14,8,' + (u * 0.17).toFixed(3) + ')';
      else if (v < 0.78) g.fillStyle = 'rgba(255,238,215,' + (u * 0.13).toFixed(3) + ')';
      else g.fillStyle = 'rgba(255,140,90,' + (u * 0.11).toFixed(3) + ')';
      g.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      g.fillStyle = 'rgba(255,255,255,' + (0.08 + t * 0.07).toFixed(3) + ')'; g.fillRect(x + 1, y + 1, bw - 2, 2.5);
      g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(x + 1, y + bh - 4, bw - 2, 3);
      if (t > 0.86) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 4 + u * 12, y + 4 + t * 3, 5 + u * 6, 1.4); }
    }
    // pale sand mortar, with the course above throwing a dark lip onto it
    for (let row = 0; row < rows; row++) {
      g.fillStyle = 'rgba(222,204,178,.4)'; g.fillRect(0, row * bh, n, 2);
      for (let col = -1; col <= cols; col++) g.fillRect(col * bw + (row % 2) * bw / 2, row * bh, 2, bh);
      g.fillStyle = 'rgba(34,20,14,.34)'; g.fillRect(0, row * bh, n, 1);
      for (let col = -1; col <= cols; col++) g.fillRect(col * bw + (row % 2) * bw / 2, row * bh, 1, bh);
    }
    speck(g, n, r, 900, ['rgba(0,0,0,.09)', 'rgba(255,255,255,.1)', 'rgba(255,190,140,.08)'], 1, 1.8);
  });
  makePat('siding', 128, 0.5, (g, n, r) => {
    for (let y = 0; y < n; y += 16) {
      const q = g.createLinearGradient(0, y, 0, y + 16); q.addColorStop(0, 'rgba(255,255,255,.2)'); q.addColorStop(0.2, 'rgba(255,255,255,.05)'); q.addColorStop(0.8, 'rgba(0,0,0,.05)'); q.addColorStop(1, 'rgba(0,0,0,.1)');
      g.fillStyle = q; g.fillRect(0, y, n, 16);
      g.fillStyle = 'rgba(0,0,0,.26)'; g.fillRect(0, y + 13, n, 3);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, y, n, 2);
      for (let k = 0; k < 6; k++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.07)'; g.fillRect(r() * n, y + 2 + r() * 10, 8 + r() * 30, 0.8); }
      g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect((y / 16 * 41) % n, y + 1, 1.2, 12);
    }
  });
  makePat('panel', 192, 0.5, (g, n, r) => {
    for (let y = 0; y < n; y += 64) for (let x = 0; x < n; x += 96) {
      const v = r(); g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.1).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.1).toFixed(3) + ')'; g.fillRect(x, y, 96, 64);
      const q = g.createLinearGradient(x, y, x + 96, y + 64); q.addColorStop(0, 'rgba(255,255,255,.1)'); q.addColorStop(0.5, 'rgba(255,255,255,0)'); q.addColorStop(1, 'rgba(0,0,0,.07)');
      g.fillStyle = q; g.fillRect(x, y, 96, 64);
      g.fillStyle = 'rgba(0,0,0,.09)'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 24, y + 4, 1.4, 56);
      g.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 24 + 1.4, y + 4, 1, 56);
      [[5, 5], [91, 5], [5, 59], [91, 59]].forEach(p => { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(x + p[0] + 0.4, y + p[1] + 0.5, 1.7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + p[0] - 0.2, y + p[1] - 0.3, 1, 0, 7); g.fill(); });
    }
    g.fillStyle = 'rgba(0,0,0,.24)'; for (let y = 0; y < n; y += 64) g.fillRect(0, y, n, 2); for (let x = 0; x < n; x += 96) g.fillRect(x, 0, 2, n);
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < n; y += 64) g.fillRect(0, y + 2, n, 1.5);
  });
  makePat('stucco', 128, 0.5, (g, n, r) => {
    for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.025)' : 'rgba(255,255,255,.03)'; g.beginPath(); g.ellipse(r() * n, r() * n, 6 + r() * 14, 4 + r() * 10, r() * 3, 0, 7); g.fill(); }
    speck(g, n, r, 640, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.1)'], 1, 3);
    g.strokeStyle = 'rgba(0,0,0,.035)'; g.lineWidth = 1.2; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(r() * n, r() * n, 5 + r() * 9, r() * 6, r() * 6 + 1.6); g.stroke(); }
  });
  makePat('paver', 192, 0.5, (g, n, r) => {
    const s = 48;
    for (let row = 0; row < n / s; row++) for (let col = -1; col < n / s; col++) {
      const v = r();
      g.fillStyle = v < 0.5 ? 'rgba(60,50,30,' + (v * 0.13).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.2).toFixed(3) + ')';
      g.fillRect(col * s + (row % 2) * s / 2, row * s, s, s);
    }
    g.fillStyle = 'rgba(70,60,45,.22)';
    for (let row = 0; row < n / s; row++) { g.fillRect(0, row * s, n, 2); for (let col = 0; col <= n / s; col++) g.fillRect(col * s + (row % 2) * s / 2, row * s, 2, s); }
    g.fillStyle = 'rgba(255,255,255,.16)'; for (let row = 0; row < n / s; row++) { g.fillRect(0, row * s + 2, n, 1); for (let col = 0; col <= n / s; col++) g.fillRect(col * s + (row % 2) * s / 2 + 2, row * s + 2, 1, s - 2); }
    speck(g, n, r, 200, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.08)'], 1, 2.5);
  });
  makePat('asphalt', 256, 0.5, (g, n, r) => {
    for (let i = 0; i < 34; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.022)'; g.beginPath(); g.ellipse(r() * n, r() * n, 10 + r() * 28, 6 + r() * 16, r() * 3, 0, 7); g.fill(); }
    speck(g, n, r, 1800, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.1)', 'rgba(180,190,200,.06)', 'rgba(210,190,160,.05)'], 1, 3.2);
    g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { let x = r() * n, y = r() * n; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 34; y += (r() - 0.3) * 22; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { let x = r() * n, y = r() * n; g.beginPath(); g.moveTo(x + 1, y + 1); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += (r() - 0.3) * 20; g.lineTo(x + 1, y + 1); } g.stroke(); }
  });
  makePat('grass', 256, 0.5, (g, n, r) => {
    for (let i = 0; i < 16; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,110,60,.045)' : 'rgba(190,235,120,.06)'; g.beginPath(); g.ellipse(r() * n, r() * n, 16 + r() * 26, 9 + r() * 14, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 640; i++) {
      const x = r() * n, y = r() * n, l = 3 + r() * 7, v = r();
      g.strokeStyle = v < 0.4 ? 'rgba(30,90,45,' + (0.12 + v * 0.3).toFixed(3) + ')' : v < 0.75 ? 'rgba(190,235,140,' + (0.06 + (v - 0.4) * 0.3).toFixed(3) + ')' : 'rgba(110,170,70,.18)';
      g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 5, y - l); g.stroke();
    }
    for (let i = 0; i < 22; i++) { const x = r() * n, y = r() * n; g.fillStyle = 'rgba(40,100,50,.28)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + Math.cos(k * 2.1) * 2.2, y + Math.sin(k * 2.1) * 2.2, 1.7, 0, 7); g.fill(); } }
    speck(g, n, r, 40, ['rgba(120,90,50,.16)'], 1, 2);
  });
  makePat('gravel', 128, 0.5, (g, n, r) => { speck(g, n, r, 640, ['rgba(120,95,60,.14)', 'rgba(255,250,235,.18)', 'rgba(90,75,55,.12)', 'rgba(160,130,90,.12)'], 1.5, 3.8); });
  makePat('fleck', 128, 0.5, (g, n, r) => { speck(g, n, r, 700, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.07)'], 1, 2.5); });
  makePat('stone', 192, 0.5, (g, n, r) => {
    const bw = 64, bh = 32, nc = n / bw;
    for (let row = 0; row < n / bh; row++) for (let col = -1; col <= nc; col++) {
      const wc = ((col % nc) + nc) % nc, v = hash01(row, wc, 51);
      const x = col * bw + (row % 2) * bw / 2, y = row * bh;
      g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.14).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.2).toFixed(3) + ')';
      g.fillRect(x, y, bw, bh);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2, y + 2, bw - 4, 2);
    }
    g.fillStyle = 'rgba(0,0,0,.32)';
    for (let row = 0; row < n / bh; row++) { g.fillRect(0, row * bh, n, 2); for (let col = -1; col <= nc; col++) g.fillRect(col * bw + (row % 2) * bw / 2, row * bh, 2, bh); }
    speck(g, n, r, 420, ['rgba(0,0,0,.09)', 'rgba(255,255,255,.1)'], 1, 2.4);
  });
  makePat('shingle', 128, 0.5, (g, n, r) => {
    const rh = 16, tw = 16, nc = n / tw;
    for (let row = 0; row < n / rh; row++) for (let col = -1; col <= nc; col++) {
      const wc = ((col % nc) + nc) % nc, v = hash01(row, wc, 61);
      const x = col * tw + (row % 2) * tw / 2, y = row * rh;
      g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.2).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.16).toFixed(3) + ')';
      g.fillRect(x, y, tw, rh);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y, 1.4, rh);
    }
    for (let row = 0; row < n / rh; row++) { g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(0, row * rh + rh - 3, n, 3); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(0, row * rh, n, 1.5); }
  });
  makePat('seam', 128, 0.5, (g, n, r) => {
    for (let x = 0; x < n; x += 32) {
      const q = g.createLinearGradient(x, 0, x + 32, 0); q.addColorStop(0, 'rgba(255,255,255,.18)'); q.addColorStop(0.5, 'rgba(255,255,255,0)'); q.addColorStop(1, 'rgba(0,0,0,.14)');
      g.fillStyle = q; g.fillRect(x, 0, 32, n);
      g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x, 0, 2, n); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 2, 0, 1.2, n);
    }
    speck(g, n, r, 120, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.06)'], 1, 2);
  });
  makePat('tile', 128, 0.5, (g, n, r) => {
    const rh = 16, tw = 16, nc = n / tw;
    for (let row = 0; row < n / rh; row++) for (let col = -1; col <= nc; col++) {
      const x = col * tw + (row % 2) * tw / 2, y = row * rh, v = hash01(row, ((col % nc) + nc) % nc, 71);
      g.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.2).toFixed(3) + ')' : 'rgba(255,200,150,' + ((v - 0.5) * 0.16).toFixed(3) + ')';
      g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + tw, y - 4); g.lineTo(x + tw, y + rh - 8); g.arc(x + tw / 2, y + rh - 8, tw / 2, 0, Math.PI); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.4; g.beginPath(); g.arc(x + tw / 2, y + rh - 8, tw / 2 - 0.7, 0.1, Math.PI - 0.1); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(x + tw / 2, y + rh - 9.5, tw / 2 - 2.4, 0.5, Math.PI - 0.5); g.stroke();
    }
  });
  makePat('concrete', 128, 0.5, (g, n, r) => {
    for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.035)'; g.beginPath(); g.ellipse(r() * n, r() * n, 8 + r() * 18, 5 + r() * 12, r() * 3, 0, 7); g.fill(); }
    speck(g, n, r, 520, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.1)'], 1, 2.2);
  });
  makePat('leaf', 128, 0.5, (g, n, r) => {
    for (let i = 0; i < 360; i++) {
      const x = r() * n, y = r() * n, a = r() * 6.283, v = r(), s = 2.4 + r() * 3.4;
      g.fillStyle = v < 0.45 ? 'rgba(10,50,30,' + (0.18 + r() * 0.16).toFixed(3) + ')' : v < 0.8 ? 'rgba(200,250,150,' + (0.1 + r() * 0.14).toFixed(3) + ')' : 'rgba(255,255,220,.1)';
      g.beginPath(); g.ellipse(x, y, s, s * 0.5, a, 0, 7); g.fill();
    }
  });
})();
function patFill(c, name, x, y, w, h, a) {
  const p = PAT[name]; if (!p) return;
  if (a != null) c.globalAlpha = a;
  c.fillStyle = p; c.fillRect(x, y, w, h);
  c.globalAlpha = 1;
}

/* a window: sky-coloured glass by day with a room behind it; a lived-in warm room when lit after dark.
   o.style 0 plain, 1 classic (lintel and stone sill), 2 modern, 3 shop; o.inside(c, x, y, w, h, lit, px, py) paints
   something behind the glass (shop displays); o.room picks the room glimpse. */
function windowAt(c, x, y, w, h, lit, o) {
  const sty = o && o.style != null ? o.style : 1, v8 = hash01(Math.round(x), Math.round(y), 7);
  let v = w >= 60 ? 8 + Math.floor(v8 * 3) : h < 30 ? [0, 1, 3, 4, 1][Math.floor(v8 * 5)] : Math.floor(v8 * 8);
  if (o && o.room != null) v = o.room;
  const ws = wWinSet(w, h, sty, v), P = W_WIN_P, on = lit && FX.nf > 0.05;
  wGlassPane(c, x, y, w, h, lit, v, ws, o && o.inside);
  if (!ws.fr) ws.fr = wspr('wf' + ws.qw + 'x' + ws.qh + 's' + sty + 'v' + (v & 3), ws.qw + P * 2, ws.qh + P + W_WIN_PB, g => wPaintWinFrame(g, ws.qw, ws.qh, sty, v));
  c.drawImage(ws.fr.cv, x - P + (w - ws.qw) / 2, y - P + (h - ws.qh) / 2, ws.fr.w, ws.fr.h);
  if (sty !== 2 && w >= 26 && w <= 40 && h >= 30 && hash01(Math.round(x), Math.round(y), 19) > 0.9) { const ac = wspr('ac', 28, 36, wPaintAC); c.drawImage(ac.cv, x + w / 2 - 14, y + h - 17, 28, 36); }
  if (sty !== 2 && w >= 26 && w <= 40 && h >= 30) { const hc = hash01(Math.round(x), Math.round(y), 23); if (hc > 0.955) { const col = ['#e8883a', '#6a6f78', '#1f2228', '#e9e2d3'][Math.floor(hc * 100) % 4], ct = wspr('cat' + col, 16, 14, g => wPaintCat(g, col)); c.drawImage(ct.cv, x + w * 0.3, y + h - 11, 16, 14); } }
  if (WINTER()) {
    c.fillStyle = 'rgba(246,250,253,.92)'; c.fillRect(x - 3.5, y + h + 2.2, w + 7, 1.8);
    if (!on) { c.fillStyle = 'rgba(240,248,255,.2)'; c.fillRect(x, y + h - 5, w, 5); c.fillRect(x, y, 3, h); }
  }
  if (on) litRect(x, y, w, h, w >= 60 ? 1 : 0);
}
function flowerBox(c, x, y, w, seed) {
  const iw = Math.round(w), se = season();
  const s = wspr('fb' + iw + 's' + (seed % 9) + se, iw + 4, 30, g => wPaintFlowerBox(g, iw, seed % 9, se));
  c.drawImage(s.cv, x - 2, y - 18, s.w, s.h);
}
function doorAt(c, cx, bottom, w, h, col, o) {
  o = o || {};
  const glass = !!o.glass, geo = wDoorGeom(w, h, glass), glassLit = o.lit && FX.nf > 0.05;
  for (let i = 0; i < 2; i++) {
    const p = geo[i], v = glass ? 10 : i ? 3 : 0, ws = wWinSet(p[2], p[3], 2, v);
    wGlassPane(c, cx + p[0], bottom + p[1], p[2], p[3], o.lit, v, ws);
  }
  const s = wDoorSprite(w, h, col, glass);
  c.drawImage(s.cv, cx - w / 2 - W_DOOR_OX, bottom - h - W_DOOR_OY, s.w, s.h);
  if (!glass && WINTER()) { const wr = wspr('wreath', 16, 18, wPaintWreath); c.drawImage(wr.cv, cx - 8, bottom - h * 0.62 - 8, 16, 18); }
  if (glassLit) litRect(cx - w / 2 + 3, bottom - h + 4, w - 6, glass ? h - 12 : h * 0.42, 1);
}
/* a wall lantern beside a door */
function sconce(c, x, y) {
  const on = FX.nf > 0.05, s = wspr('sc' + (on ? 1 : 0), 32, 32, g => wPaintSconce(g, on));
  c.drawImage(s.cv, x - 16, y - 16, 32, 32);
  if (on) { litRect(x - 2.5, y - 2, 5, 7); addLight(x, y + 18, 46, 40, 0, 0.75); addEmit(x, y + 1, 14, 0, 0.5); }
}
function signText(c, text, cx, y, size, col) {
  c.font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = col; c.fillText(text, cx, y);
}
/* lettering with a soft drop, for building names; lit like a sign box after dark when `glow` is set */
function nameSign(c, text, cx, y, size, col, glow, kind) {
  const s = wSignSprite(text, size, col);
  c.drawImage(s.cv, cx - s.w / 2, y - s.h / 2, s.w, s.h);
  if (glow && FX.nf > 0.05) {
    const w = s.tw;
    litRect(cx - w / 2 - 3, y - size * 0.55, w + 6, size * 1.1);
    addEmit(cx, y, w * 0.62, kind == null ? 0 : kind, 0.34);
  }
}
/* striped shop awning with a fabric valance and a soft shadow on the wall below */
function awning(c, x, y, w, h, colA, colB) {
  const iw = Math.round(w), win = WINTER(), s = wspr('aw' + iw + 'x' + h + colA + colB + (win ? 'w' : ''), iw, h + 26, g => { wPaintAwning(g, iw, h, colA, colB, iw + h); if (win) wSnowAwning(g, iw, h); });
  c.drawImage(s.cv, x, y, w, s.h);
}
function roofProps(c, b, seed) {
  const n = 1 + Math.floor(hash01(seed, 1, 2) * 2.99), y = b.y;
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(hash01(seed, i, 3) * W_ROOF_KINDS), px = b.x + 16 + ((i + hash01(seed, i, 4) * 0.7) / n) * (b.w - 62);
    wPaintRoofProp(c, kind, px, y, mulberry32(seed * 17 + i));
  }
}
