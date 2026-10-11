// wall and ceiling decor (v2)
// Everything here is decoration painted into the cached room layer: frames, shelves, clocks, neon, string lights,
// pendants, sconces. None of it is solid. Positions are on the back wall (y 0-84) unless it says otherwise.
const W = {};
/* tiny procedural pictures for frames */
W.art = function (c, x, y, w, h, kind, seed) {
  const r = IM.rng(seed || 1, Math.round(x), 7);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (kind === 'land') {
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#8ec5e8'], [1, '#f6e3b8']]); c.fillRect(x, y, w, h);
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(x + w * 0.7, y + h * 0.3, h * 0.13, 0, 7); c.fill();
    c.fillStyle = '#6d9a82'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.62); c.quadraticCurveTo(x + w * 0.3, y + h * 0.4, x + w * 0.55, y + h * 0.66); c.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w, y + h * 0.7); c.lineTo(x + w, y + h); c.fill();
    c.fillStyle = '#4a7a5e'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.82); c.quadraticCurveTo(x + w * 0.5, y + h * 0.66, x + w, y + h * 0.84); c.lineTo(x + w, y + h); c.fill();
  } else if (kind === 'sea') {
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#f7d9a8'], [0.45, '#f5a97a'], [0.46, '#3a6ea8'], [1, '#1f3f6e']]); c.fillRect(x, y, w, h);
    c.fillStyle = '#fff3d0'; c.beginPath(); c.arc(x + w * 0.5, y + h * 0.45, h * 0.14, Math.PI, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 3, y + h * (0.55 + i * 0.1)); c.quadraticCurveTo(x + w / 2, y + h * (0.52 + i * 0.1), x + w - 3, y + h * (0.56 + i * 0.1)); c.stroke(); }
  } else if (kind === 'abstract') {
    c.fillStyle = '#f2ead8'; c.fillRect(x, y, w, h);
    const cols = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653'];
    for (let i = 0; i < 4; i++) { c.fillStyle = cols[i]; if (i % 2) { c.beginPath(); c.arc(x + w * (0.2 + r() * 0.6), y + h * (0.2 + r() * 0.6), h * (0.12 + r() * 0.12), 0, 7); c.fill(); } else c.fillRect(x + w * r() * 0.6, y + h * r() * 0.6, w * (0.2 + r() * 0.2), h * (0.2 + r() * 0.2)); }
  } else if (kind === 'city') {
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#3a4a78'], [1, '#e8a87c']]); c.fillRect(x, y, w, h);
    c.fillStyle = '#1b2236'; for (let i = 0; i < 6; i++) { const bw = w / 6, bh = h * (0.3 + r() * 0.45); c.fillRect(x + i * bw, y + h - bh, bw + 0.5, bh); }
    c.fillStyle = 'rgba(255,224,150,.8)'; for (let i = 0; i < 14; i++) c.fillRect(x + 3 + r() * (w - 6), y + h * (0.45 + r() * 0.45), 1.2, 1.2);
  } else if (kind === 'botanical') {
    c.fillStyle = '#f6f1e7'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#4a7a5e'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w / 2, y + h - 3); c.quadraticCurveTo(x + w * 0.4, y + h * 0.5, x + w / 2, y + 4); c.stroke();
    c.fillStyle = '#6d9a82'; for (let i = 0; i < 6; i++) { const ly = y + h - 8 - i * (h - 14) / 6, s = i % 2 ? 1 : -1; c.beginPath(); c.ellipse(x + w / 2 + s * 4.4, ly, 4.6, 1.8, s * -0.5, 0, 7); c.fill(); }
  } else if (kind === 'portrait') {
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#b9a8d6'], [1, '#e8c4b8']]); c.fillRect(x, y, w, h);
    c.fillStyle = '#3a3340'; c.beginPath(); c.arc(x + w / 2, y + h * 0.4, h * 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + w / 2, y + h * 1.05, w * 0.4, h * 0.38, 0, 0, 7); c.fill();
  } else if (kind === 'bike') {
    c.fillStyle = '#f6ead0'; c.fillRect(x, y, w, h); c.strokeStyle = '#e76f51'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + w * 0.3, y + h * 0.66, h * 0.2, 0, 7); c.arc(x + w * 0.72, y + h * 0.66, h * 0.2, 0, 7); c.moveTo(x + w * 0.3, y + h * 0.66); c.lineTo(x + w * 0.5, y + h * 0.4); c.lineTo(x + w * 0.72, y + h * 0.66); c.moveTo(x + w * 0.5, y + h * 0.4); c.lineTo(x + w * 0.62, y + h * 0.4); c.stroke();
  } else if (kind === 'coffee') {
    c.fillStyle = '#f3e6c8'; c.fillRect(x, y, w, h); c.fillStyle = '#7a4a2a'; rr(c, x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.38, 3); c.fill(); c.strokeStyle = '#7a4a2a'; c.lineWidth = 1.4; c.beginPath(); c.arc(x + w * 0.72, y + h * 0.56, h * 0.1, -1.4, 1.4); c.stroke(); c.strokeStyle = 'rgba(122,74,42,.5)'; c.beginPath(); c.moveTo(x + w * 0.42, y + h * 0.34); c.quadraticCurveTo(x + w * 0.36, y + h * 0.24, x + w * 0.44, y + h * 0.14); c.moveTo(x + w * 0.56, y + h * 0.34); c.quadraticCurveTo(x + w * 0.62, y + h * 0.24, x + w * 0.54, y + h * 0.14); c.stroke();
  } else if (kind === 'pizza') {
    c.fillStyle = '#f6e7cb'; c.fillRect(x, y, w, h); c.fillStyle = '#d99a4a'; c.beginPath(); c.arc(x + w / 2, y + h / 2, h * 0.36, 0, 7); c.fill(); c.fillStyle = '#f4d58d'; c.beginPath(); c.arc(x + w / 2, y + h / 2, h * 0.3, 0, 7); c.fill(); c.fillStyle = '#c0392b'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x + w / 2 + (r() - 0.5) * h * 0.4, y + h / 2 + (r() - 0.5) * h * 0.4, 1.8, 0, 7); c.fill(); }
  } else if (kind === 'bread') {
    c.fillStyle = '#fdf1d8'; c.fillRect(x, y, w, h); c.fillStyle = '#d99a4a'; c.beginPath(); c.ellipse(x + w / 2, y + h * 0.56, w * 0.34, h * 0.24, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,60,10,.5)'; c.lineWidth = 0.9; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + w / 2 + i * 6 - 2, y + h * 0.42); c.lineTo(x + w / 2 + i * 6 + 2, y + h * 0.62); c.stroke(); }
  } else if (kind === 'tooth') {
    c.fillStyle = '#d7f0f5'; c.fillRect(x, y, w, h); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x + w * 0.3, y + h * 0.3); c.quadraticCurveTo(x + w * 0.5, y + h * 0.2, x + w * 0.7, y + h * 0.3); c.quadraticCurveTo(x + w * 0.76, y + h * 0.6, x + w * 0.62, y + h * 0.82); c.quadraticCurveTo(x + w * 0.5, y + h * 0.6, x + w * 0.38, y + h * 0.82); c.quadraticCurveTo(x + w * 0.24, y + h * 0.6, x + w * 0.3, y + h * 0.3); c.fill(); c.strokeStyle = '#3aa6b9'; c.lineWidth = 1; c.stroke();
  } else if (kind === 'heart') {
    c.fillStyle = '#eef6f8'; c.fillRect(x, y, w, h); c.strokeStyle = '#d63b4b'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 4, y + h * 0.55); c.lineTo(x + w * 0.3, y + h * 0.55); c.lineTo(x + w * 0.4, y + h * 0.3); c.lineTo(x + w * 0.55, y + h * 0.8); c.lineTo(x + w * 0.65, y + h * 0.55); c.lineTo(x + w - 4, y + h * 0.55); c.stroke();
  } else if (kind === 'music') {
    c.fillStyle = '#2a2335'; c.fillRect(x, y, w, h); c.fillStyle = '#f3e6a1'; c.beginPath(); c.arc(x + w * 0.4, y + h * 0.7, 3, 0, 7); c.arc(x + w * 0.7, y + h * 0.62, 3, 0, 7); c.fill(); c.fillRect(x + w * 0.4 + 2, y + h * 0.2, 1.2, h * 0.5); c.fillRect(x + w * 0.7 + 2, y + h * 0.15, 1.2, h * 0.5); c.fillRect(x + w * 0.4 + 2, y + h * 0.2, w * 0.3 + 1, 2);
  } else if (kind === 'fish') {
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#8ee0ff'], [1, '#2a6f97']]); c.fillRect(x, y, w, h); c.fillStyle = '#ffd166'; c.beginPath(); c.ellipse(x + w * 0.5, y + h * 0.5, w * 0.22, h * 0.14, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + w * 0.7, y + h * 0.5); c.lineTo(x + w * 0.84, y + h * 0.36); c.lineTo(x + w * 0.84, y + h * 0.64); c.fill();
  } else if (kind === 'dollar') {
    c.fillStyle = '#e6efe0'; c.fillRect(x, y, w, h); c.strokeStyle = '#2f6b4c'; c.lineWidth = 1; c.strokeRect(x + 3, y + 3, w - 6, h - 6); signText(c, '$', x + w / 2, y + h / 2 + 0.5, Math.min(w, h) * 0.5, '#2f6b4c');
  } else { c.fillStyle = '#e9e3d4'; c.fillRect(x, y, w, h); }
  c.restore();
};
/* a framed picture: shadow, frame, cream mount, art, glass glint */
W.frame = function (c, x, y, w, h, kind, fcol, seed) {
  if (w < 4 || h < 4) return;
  fcol = fcol || '#6b4a30';
  IM.shadow(c, x - 2, y - 2, w + 4, h + 4, 1.5, 4, 0.4, 1.5, 3);
  c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, shade(fcol, 0.2)], [1, shade(fcol, -0.25)]]); c.fillRect(x - 2.4, y - 2.4, w + 4.8, h + 4.8);
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x - 2.4, y - 2.4, w + 4.8, 1); c.fillRect(x - 2.4, y - 2.4, 1, h + 4.8);
  c.fillStyle = '#f3ecdc'; c.fillRect(x, y, w, h);
  const m = Math.max(2, Math.min(w, h) * 0.1);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + m - 0.6, y + m - 0.6, w - 2 * m + 1.2, h - 2 * m + 1.2);
  W.art(c, x + m, y + m, w - 2 * m, h - 2 * m, kind, seed);
  IM.glints(c, x, y, w, h, 0.18);
};
/* a wall clock: the face is painted once, the hands are drawn live from the game clock */
W.clock = function (c, x, y, r, col) {
  IM.shadow(c, x - r, y - r, r * 2, r * 2, r, 4, 0.4, 1.4, 2.6);
  c.fillStyle = IM.grad(c, x - r, y - r, x + r, y + r, [[0, '#f0f4f6'], [1, '#7a8791']]); c.beginPath(); c.arc(x, y, r + 1.8, 0, 7); c.fill();
  c.fillStyle = col || '#fbfaf4'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(' + IM.INK + ',.7)'; c.lineWidth = 0.9; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(x + Math.cos(a) * (r - (i % 3 ? 1.6 : 2.8)), y + Math.sin(a) * (r - (i % 3 ? 1.6 : 2.8))); c.lineTo(x + Math.cos(a) * (r - 0.6), y + Math.sin(a) * (r - 0.6)); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.5, Math.PI, Math.PI * 1.6); c.lineTo(x - r * 0.3, y - r * 0.3); c.fill();
  (LAYER.clocks || (LAYER.clocks = [])).push([x, y, r]);
};
function liveClocks(c) {
  const L = LAYER.clocks; if (!L || !S) return;
  const mm = S.t % 60, hh = (S.t / 60) % 12;
  for (let i = 0; i < L.length; i++) {
    const x = L[i][0], y = L[i][1], r = L[i][2];
    c.lineCap = 'round'; c.strokeStyle = '#1b2026';
    c.lineWidth = Math.max(1.2, r * 0.14); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(hh / 12 * 6.283) * r * 0.5, y - Math.cos(hh / 12 * 6.283) * r * 0.5); c.stroke();
    c.lineWidth = Math.max(0.9, r * 0.09); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(mm / 60 * 6.283) * r * 0.78, y - Math.cos(mm / 60 * 6.283) * r * 0.78); c.stroke();
    c.lineCap = 'butt'; c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x, y, 1.3, 0, 7); c.fill();
  }
}
/* a floating wooden shelf with things on it */
W.shelf = function (c, x, y, w, kind) {
  const r = IM.rng(Math.round(x), Math.round(y), 21);
  IM.shadow(c, x, y + 1, w, 4, 1, 4, 0.34, 1, 4);
  // things first (they stand on the board)
  let px = x + 5;
  while (px < x + w - 6) {
    const k = kind === 'books' ? 'book' : kind === 'kitchen' ? ['jar', 'mug', 'jar', 'plant'][(r() * 4) | 0] : kind === 'plants' ? 'plant' : kind === 'bottles' ? 'bottle' : ['jar', 'mug', 'plant', 'book', 'vase'][(r() * 5) | 0];
    if (k === 'jar') { const jw = 6 + r() * 3, jh = 8 + r() * 5, col = ['#e9c46a', '#c0392b', '#8ac926', '#f4a261', '#8ecae6'][(r() * 5) | 0]; c.fillStyle = 'rgba(210,235,245,.6)'; rr(c, px, y - jh, jw, jh, 1.4); c.fill(); c.fillStyle = col; rr(c, px + 1, y - jh * 0.7, jw - 2, jh * 0.68, 1); c.fill(); c.fillStyle = '#d9c36a'; c.fillRect(px - 0.3, y - jh - 1.4, jw + 0.6, 2); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(px + 1, y - jh * 0.8, 1, jh * 0.5); px += jw + 2.4; }
    else if (k === 'mug') { const col = ['#f4f1ea', '#e76f51', '#2a9d8f', '#3d5a80'][(r() * 4) | 0]; c.fillStyle = col; rr(c, px, y - 6, 6, 6, 1.2); c.fill(); c.strokeStyle = col; c.lineWidth = 1.1; c.beginPath(); c.arc(px + 7, y - 3.4, 1.8, -1.3, 1.3); c.stroke(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(px + 1, y - 5.4, 1, 4); px += 10.4; }
    else if (k === 'plant') { c.fillStyle = '#a4623f'; c.beginPath(); c.moveTo(px, y - 5); c.lineTo(px + 7, y - 5); c.lineTo(px + 6, y); c.lineTo(px + 1, y); c.fill(); c.fillStyle = '#3f9a62'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(px + 1.2 + i * 1.6, y - 9 - (i % 2) * 2, 1.4, 4, -0.5 + i * 0.35, 0, 7); c.fill(); } px += 10; }
    else if (k === 'book') { const n = 2 + ((r() * 3) | 0); for (let i = 0; i < n; i++) { const bh = 8 + r() * 5, col = ['#c0392b', '#2980b9', '#27ae60', '#e0b23a', '#8e44ad'][(r() * 5) | 0]; c.fillStyle = col; c.fillRect(px, y - bh, 3.6, bh); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(px, y - bh, 0.9, bh); px += 3.8; } px += 1.4; }
    else if (k === 'vase') { c.fillStyle = '#8ecae6'; c.beginPath(); c.moveTo(px + 1, y); c.lineTo(px + 5, y); c.lineTo(px + 6, y - 6); c.lineTo(px, y - 6); c.fill(); c.fillStyle = '#ff7a95'; c.beginPath(); c.arc(px + 3, y - 8, 2, 0, 7); c.fill(); px += 9; }
    else if (k === 'bottle') { const col = ['#2a6f97', '#8a3a3a', '#2f7d4f', '#d4a017'][(r() * 4) | 0]; PROP.bottle(c, px, y - 13, 4.6, 13, col); px += 7; }
    else px += 8;
  }
  c.fillStyle = IM.grad(c, 0, y, 0, y + 4, [[0, '#b58a5a'], [1, '#6b4a30']]); c.fillRect(x, y, w, 3.6);
  c.fillStyle = 'rgba(255,240,214,.45)'; c.fillRect(x, y, w, 0.9); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x, y + 3.6, w, 1);
  c.fillStyle = '#3a2a1c'; c.fillRect(x + 4, y + 3.6, 2, 3); c.fillRect(x + w - 6, y + 3.6, 2, 3);
};
/* neon tube lettering: dark housing, a hot core, glow at night */
W.neon = function (c, text, cx, y, size, col, kind) {
  c.font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.shadowColor = col; c.shadowBlur = 5 * (c.getTransform ? c.getTransform().a : 1);
  c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = 2.2; c.strokeText(text, cx, y);
  c.restore();
  c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillText(text, cx + 0.8, y + 1.6);
  c.lineWidth = 3; c.strokeStyle = shade(col, -0.1); c.strokeText(text, cx, y);
  c.fillStyle = shade(col, 0.82); c.fillText(text, cx, y);
  const w = c.measureText(text).width;
  addEmit(cx, y, w * 0.62, kind == null ? 0 : kind, 0.5);
  addLight(cx, y + 26, w * 0.7, 40, kind == null ? 0 : kind, 0.45);
};
/* a string of warm bulbs on a sagging wire */
W.stringLights = function (c, x0, x1, y, sag, n, cols) {
  c.strokeStyle = 'rgba(' + IM.INK + ',.55)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); c.stroke();
  for (let i = 0; i <= n; i++) {
    const t = i / n, bx = x0 + (x1 - x0) * t, by = y + 2 * sag * t * (1 - t) * 2 * 0.5 * 1 + 2 * sag * t * (1 - t) * 1 - 0 + 0, col = cols ? cols[i % cols.length] : '#fff0b0';
    const yy = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(bx + 1, yy + 6.6, 2.2, 2.6, 0, 0, 7); c.fill();
    c.fillStyle = '#2a2f36'; c.fillRect(bx - 0.9, yy, 1.8, 2.4);
    c.fillStyle = col; c.beginPath(); c.ellipse(bx, yy + 5, 2.2, 2.8, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(bx - 0.6, yy + 4, 0.8, 0, 7); c.fill();
    addEmit(bx, yy + 5, 12, 0, 0.42);
    void by;
  }
  addLight((x0 + x1) / 2, y + 36, (x1 - x0) * 0.55, 56, 0, 0.7);
};
/* a pendant lamp seen from above: shade ring, bright inside, a soft pool on the floor at night */
W.pendant = function (c, x, y, r, col, kind) {
  col = col || '#2f3a4a';
  IM.shadow(c, x - r, y - r, r * 2, r * 2, r, 6, 0.3, 2, 5);
  c.fillStyle = IM.grad(c, x - r, y - r, x + r, y + r, [[0, shade(col, 0.25)], [1, shade(col, -0.3)]]); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.34, r * 0.5, Math.PI * 0.9, Math.PI * 1.7); c.lineTo(x - r * 0.3, y - r * 0.34); c.fill();
  c.fillStyle = '#f1dca0'; c.beginPath(); c.arc(x, y, r * 0.4, 0, 7); c.fill();
  c.fillStyle = '#8a8f96'; c.beginPath(); c.arc(x, y, r * 0.14, 0, 7); c.fill();
  addLight(x, y + 6, r * 6, r * 4.4, kind || 0, 0.85); addEmit(x, y, r * 1.6, kind || 0, 0.3);
};
W.sconce = function (c, x, y, kind) {
  IM.shadow(c, x - 4, y - 7, 8, 14, 2, 4, 0.34, 1, 2);
  c.fillStyle = '#2b3138'; c.fillRect(x - 1.5, y - 8, 3, 4); c.fillRect(x - 3.5, y - 4, 7, 2);
  c.fillStyle = '#fff0c0'; rr(c, x - 3, y - 2, 6, 9, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 2, y - 1, 1.4, 6);
  c.fillStyle = '#2b3138'; c.fillRect(x - 3.5, y + 7, 7, 1.6);
  addLight(x, y + 20, 56, 46, kind || 0, 0.8); addEmit(x, y + 2, 16, kind || 0, 0.6);
};
/* a poster / health notice with a bold shape */
W.poster = function (c, x, y, w, h, bg, fg, kind) {
  IM.shadow(c, x, y, w, h, 1, 3, 0.36, 1, 2.4);
  c.fillStyle = bg; c.fillRect(x, y, w, h);
  c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(0,0,0,.1)']]); c.fillRect(x, y, w, h);
  c.fillStyle = fg;
  if (kind === 'cross') { c.fillRect(x + w * 0.4, y + h * 0.18, w * 0.2, h * 0.42); c.fillRect(x + w * 0.22, y + h * 0.3, w * 0.56, h * 0.18); }
  else if (kind === 'tooth') { c.beginPath(); c.moveTo(x + w * 0.28, y + h * 0.2); c.quadraticCurveTo(x + w * 0.5, y + h * 0.1, x + w * 0.72, y + h * 0.2); c.quadraticCurveTo(x + w * 0.78, y + h * 0.5, x + w * 0.62, y + h * 0.66); c.quadraticCurveTo(x + w * 0.5, y + h * 0.46, x + w * 0.38, y + h * 0.66); c.quadraticCurveTo(x + w * 0.22, y + h * 0.5, x + w * 0.28, y + h * 0.2); c.fill(); }
  else if (kind === 'apple') { c.beginPath(); c.arc(x + w * 0.5, y + h * 0.42, w * 0.26, 0, 7); c.fill(); c.fillStyle = '#4c9a54'; c.fillRect(x + w * 0.48, y + h * 0.12, 1.4, 5); c.beginPath(); c.ellipse(x + w * 0.6, y + h * 0.16, 4, 2, -0.5, 0, 7); c.fill(); }
  else if (kind === 'wave') { c.strokeStyle = fg; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 3, y + h * (0.28 + i * 0.16)); c.quadraticCurveTo(x + w * 0.35, y + h * (0.18 + i * 0.16), x + w * 0.6, y + h * (0.28 + i * 0.16)); c.quadraticCurveTo(x + w * 0.8, y + h * (0.36 + i * 0.16), x + w - 3, y + h * (0.28 + i * 0.16)); c.stroke(); } }
  else if (kind === 'chart') { [0.3, 0.5, 0.4, 0.7].forEach((t, i) => c.fillRect(x + 4 + i * ((w - 8) / 4), y + h * 0.7 - t * h * 0.5, (w - 8) / 4 - 2, t * h * 0.5)); }
  c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x + 4, y + h - 9, w - 8, 1.4); c.fillRect(x + 4, y + h - 5.4, w * 0.6, 1.2);
  c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + w / 2, y + 2, 1, 0, 7); c.fill();
};
/* a ceiling vent grille and a pipe run, for the industrial rooms */
W.vent = function (c, x, y, w) {
  IM.shadow(c, x, y, w, 8, 1, 3, 0.3, 1, 2);
  c.fillStyle = IM.grad(c, 0, y, 0, y + 8, [[0, '#d9dde0'], [1, '#8a979f']]); c.fillRect(x, y, w, 8);
  c.fillStyle = 'rgba(' + IM.INK + ',.45)'; for (let k = 0; k < 4; k++) c.fillRect(x + 2, y + 1.4 + k * 1.7, w - 4, 0.9);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x, y, w, 0.9);
};
W.pipe = function (c, x0, x1, y, r, col) {
  col = col || '#8a96a0';
  IM.shadow(c, x0, y - r, x1 - x0, r * 2, r, 3, 0.3, 0, 2.4);
  c.fillStyle = IM.grad(c, 0, y - r, 0, y + r, [[0, shade(col, 0.4)], [0.4, col], [1, shade(col, -0.35)]]); c.fillRect(x0, y - r, x1 - x0, r * 2);
  for (let x = x0 + 18; x < x1 - 4; x += 46) { c.fillStyle = shade(col, -0.2); c.fillRect(x, y - r - 1, 4, r * 2 + 2); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y - r - 1, 1, r * 2 + 2); }
};
/* a hanging banner / pennant row */
W.bunting = function (c, x0, x1, y, cols, n) {
  c.strokeStyle = 'rgba(' + IM.INK + ',.5)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + 8, x1, y); c.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, bx = x0 + (x1 - x0) * t, yy = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + 8) + t * t * y, pw = (x1 - x0) / n * 0.78;
    c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.moveTo(bx - pw / 2 + 1, yy + 1.4); c.lineTo(bx + pw / 2 + 1, yy + 1.4); c.lineTo(bx + 1, yy + pw * 1.1 + 1.4); c.fill();
    c.fillStyle = cols[i % cols.length]; c.beginPath(); c.moveTo(bx - pw / 2, yy); c.lineTo(bx + pw / 2, yy); c.lineTo(bx, yy + pw * 1.1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(bx - pw / 2, yy); c.lineTo(bx, yy); c.lineTo(bx - pw * 0.2, yy + pw * 0.7); c.closePath(); c.fill();
  }
};
/* painted floor stripes / decals (these sit on the floor, under the furniture) */
W.floorStripe = function (c, x, y, w, h, col, dash) {
  c.fillStyle = col; if (dash) { for (let k = 0; k < (w > h ? w : h); k += dash * 2) c.fillRect(w > h ? x + k : x, w > h ? y : y + k, w > h ? dash : w, w > h ? h : dash); } else c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, y, w, 1);
};
