/* ---------- label-aware table tops: produce stand, bakery table, folding table, drafting table ... (v2) ---------- */
const TBL = {};
TBL.plate = function (c, f, text, th) {   // a small cream placard at the front edge of the top
  const w = Math.min(f.w - 12, text.length * (f.fs || 9) * 0.66 + 12), x = f.x + f.w / 2 - w / 2, y = f.y + th - 13;
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; rr(c, x + 0.8, y + 1.4, w, 11, 2.4); c.fill();
  c.fillStyle = IM.grad(c, 0, y, 0, y + 11, [[0, '#fbf8ef'], [1, '#e2dac6']]); rr(c, x, y, w, 11, 2.4); c.fill();
  signText(c, text, f.x + f.w / 2, y + 5.8, Math.min(f.fs || 9, 9), '#33261a');
};
TBL.basket = function (c, x, y, w, h, col) {
  c.fillStyle = 'rgba(' + IM.INK + ',.28)'; rr(c, x + 1, y + 1.6, w, h, 2); c.fill();
  c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#c9a06a'], [1, '#8a6a3c']]); rr(c, x, y, w, h, 2.4); c.fill();
  c.strokeStyle = 'rgba(70,44,16,.35)'; c.lineWidth = 0.7; c.beginPath(); for (let k = 3; k < w; k += 3.4) { c.moveTo(x + k, y + 1); c.lineTo(x + k, y + h - 1); } for (let k = 3; k < h; k += 3.4) { c.moveTo(x + 1, y + k); c.lineTo(x + w - 1, y + k); } c.stroke();
  c.fillStyle = 'rgba(255,240,214,.3)'; c.fillRect(x + 1, y, w - 2, 1);
  const r = IM.rng(Math.round(x), Math.round(y), 5);
  c.save(); rr(c, x + 1.4, y + 1.4, w - 2.8, h - 2.8, 2); c.clip();
  for (let i = 0; i < 9; i++) { const fx = x + 3 + r() * (w - 6), fy = y + 3 + r() * (h - 6), rad = 2.8 + r() * 1.2; c.fillStyle = col[i % col.length]; c.beginPath(); c.arc(fx, fy, rad, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.arc(fx - rad * 0.3, fy - rad * 0.3, rad * 0.32, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.beginPath(); c.arc(fx + rad * 0.3, fy + rad * 0.4, rad * 0.5, 0, Math.PI); c.fill(); }
  c.restore();
};
TBL.produce = function (c, f, th) {
  const sets = [['#e63946', '#d62839'], ['#ff9f1c', '#f48c06'], ['#8ac926', '#6a994e'], ['#ffd166', '#f9c74f'], ['#9b2226', '#bb3e03'], ['#6a994e', '#386641']];
  const n = Math.max(3, Math.floor((f.w - 10) / 38)), bw = (f.w - 10) / n - 4;
  for (let i = 0; i < n; i++) TBL.basket(c, f.x + 6 + i * (bw + 4), f.y + 5, bw, th - 22, sets[i % sets.length]);
};
TBL.bakery = function (c, f, th) {
  const n = Math.max(3, Math.floor((f.w - 10) / 30));
  c.fillStyle = '#e8dcc0'; rr(c, f.x + 5, f.y + 4, f.w - 10, th - 20, 2); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.12)'; c.fillRect(f.x + 6, f.y + th - 17, f.w - 12, 1);
  for (let i = 0; i < n; i++) {
    const x = f.x + 12 + i * ((f.w - 24) / n), y = f.y + 6, k = i % 3;
    c.fillStyle = 'rgba(' + IM.INK + ',.25)';
    if (k === 0) { c.beginPath(); c.ellipse(x + 14, y + 12, 15, 5, -0.3, 0, 7); c.fill(); c.fillStyle = '#d99a4a'; c.beginPath(); c.ellipse(x + 13, y + 10, 15, 4.4, -0.3, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,60,10,.5)'; c.lineWidth = 0.8; for (let s = -3; s <= 3; s++) { c.beginPath(); c.moveTo(x + 13 + s * 4, y + 7 - s * 1.2); c.lineTo(x + 15 + s * 4, y + 11 - s * 1.2); c.stroke(); } c.fillStyle = 'rgba(255,240,200,.45)'; c.beginPath(); c.ellipse(x + 10, y + 8.4, 8, 1.4, -0.3, 0, 7); c.fill(); }
    else if (k === 1) { c.beginPath(); c.ellipse(x + 11, y + 11, 11, 8, 0, 0, 7); c.fill(); c.fillStyle = '#c9803a'; c.beginPath(); c.ellipse(x + 10, y + 9, 11, 8, 0, 0, 7); c.fill(); c.fillStyle = '#e0a45a'; c.beginPath(); c.ellipse(x + 9, y + 7.6, 8, 5, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,240,200,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 5, y + 9); c.quadraticCurveTo(x + 10, y + 4, x + 15, y + 9); c.stroke(); }
    else { for (let s = 0; s < 3; s++) { c.fillStyle = '#e9b86a'; c.beginPath(); c.arc(x + 4 + s * 9, y + 10 - (s % 2) * 2, 4.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x + 2.8 + s * 9, y + 8.6 - (s % 2) * 2, 1.4, 0, 7); c.fill(); } }
  }
};
TBL.folding = function (c, f, th) {
  const cols = ['#f6f1e7', '#8ecae6', '#e9c46a', '#ff7a59', '#9be7a8', '#c9b3e6'];
  const n = Math.floor((f.w - 20) / 38);
  for (let i = 0; i < n; i++) {
    const x = f.x + 12 + i * ((f.w - 24) / n);
    if (i === Math.floor(n / 2) || i === Math.floor(n / 2) - 1) continue;   // leave the middle clear for the label
    const h = 3 + (i % 3);
    for (let k = 0; k < h; k++) { c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + 1, f.y + 8 + (3 - k) * 3.6 + 1, 24, 4); c.fillStyle = cols[(i + k) % cols.length]; rr(c, x, f.y + 8 + (3 - k) * 3.6, 24, 4.2, 1); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 1, f.y + 8 + (3 - k) * 3.6, 22, 0.9); }
  }
};
TBL.drafting = function (c, f, th) {
  c.fillStyle = IM.grad(c, f.x, f.y, f.x + f.w, f.y + th, [[0, '#3a6ea8'], [1, '#27508a']]); rr(c, f.x + 5, f.y + 5, f.w - 10, th - 11, 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.6; for (let gx = f.x + 9; gx < f.x + f.w - 6; gx += 6) { c.beginPath(); c.moveTo(gx, f.y + 6); c.lineTo(gx, f.y + th - 7); c.stroke(); } for (let gy = f.y + 9; gy < f.y + th - 6; gy += 6) { c.beginPath(); c.moveTo(f.x + 6, gy); c.lineTo(f.x + f.w - 6, gy); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1; c.strokeRect(f.x + f.w * 0.16, f.y + 11, f.w * 0.28, th - 24); c.beginPath(); c.arc(f.x + f.w * 0.7, f.y + th * 0.5, th * 0.24, 0, 7); c.moveTo(f.x + f.w * 0.55, f.y + th * 0.5); c.lineTo(f.x + f.w * 0.85, f.y + th * 0.5); c.stroke();
  c.fillStyle = '#e9c46a'; c.fillRect(f.x + 4, f.y + th - 8, f.w - 8, 2); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(f.x + 4, f.y + th - 6, f.w - 8, 0.8);
  c.fillStyle = '#f4f1ea'; rr(c, f.x + f.w - 14, f.y + 6, 8, 8, 1.4); c.fill(); c.fillStyle = '#e63946'; c.fillRect(f.x + f.w - 12, f.y + 3, 1.2, 6); c.fillStyle = '#2a6f97'; c.fillRect(f.x + f.w - 9.6, f.y + 3.4, 1.2, 6);
};
TBL.conference = function (c, f, th) {
  c.fillStyle = IM.grad(c, f.x, f.y, f.x + f.w, f.y + th, [[0, 'rgba(255,255,255,.22)'], [0.4, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,.1)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(f.x + 2, f.y + 2, f.w - 4, th - 3);
  [0.18, 0.5, 0.82].forEach((t, i) => { const px = f.x + f.w * t; PROP.notebook(c, px - 6, f.y + 6, 12, 15, i === 1 ? '#e8e2d2' : '#f4f1ea'); c.fillStyle = '#2b2f36'; c.fillRect(px + 8, f.y + 8, 1.2, 8); PROP.cup(c, px + 14, f.y + 12, '#9bd1e8'); PROP.notebook(c, px - 6, f.y + th - 24, 12, 15, '#3a3340'); PROP.cup(c, px + 14, f.y + th - 16, '#9bd1e8'); });
  c.fillStyle = '#2b2f36'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + th * 0.5, 7, 0, 7); c.fill(); c.fillStyle = '#4a525c'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + th * 0.5, 4.4, 0, 7); c.fill(); c.fillStyle = '#3bff6a'; c.fillRect(f.x + f.w / 2 - 1, f.y + th * 0.5 - 6, 2, 1);
};
TBL.prep = function (c, f, th) {
  const r = IM.rng(fsd(f), 6, 6);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; rr(c, f.x + 8, f.y + 7, 36, th - 17, 2); c.fill(); c.fillStyle = '#e8d3a8'; rr(c, f.x + 7, f.y + 6, 36, th - 17, 2); c.fill(); IM.grain(c, f.x + 7, f.y + 6, 36, th - 17, 3, 0.8);
  for (let i = 0; i < 9; i++) { c.fillStyle = ['#e63946', '#8ac926', '#ffd166', '#f4a261'][i % 4]; c.beginPath(); c.arc(f.x + 12 + r() * 26, f.y + 11 + r() * (th - 28), 2 + r() * 1.4, 0, 7); c.fill(); }
  c.fillStyle = '#dfe5e9'; c.fillRect(f.x + 48, f.y + 10, 20, 2); c.fillStyle = '#6b4a30'; c.fillRect(f.x + 66, f.y + 9.4, 8, 3.2);
  c.fillStyle = IM.grad(c, 0, f.y + 6, 0, f.y + 18, [[0, '#f0f4f6'], [1, '#8a979f']]); c.beginPath(); c.ellipse(f.x + f.w - 26, f.y + 14, 11, 6.6, 0, 0, 7); c.fill(); c.fillStyle = '#7a8791'; c.beginPath(); c.ellipse(f.x + f.w - 26, f.y + 14, 8.6, 4.6, 0, 0, 7); c.fill();
};
TBL.slips = function (c, f, th) {
  PROP.paper(c, f.x + 8, f.y + 5, 10, 13, -0.08, 3); PROP.paper(c, f.x + 20, f.y + 6, 10, 13, 0.06, 3);
  c.strokeStyle = '#c9a45c'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(f.x + f.w - 18, f.y + 8); c.quadraticCurveTo(f.x + f.w - 14, f.y + 22, f.x + f.w - 8, f.y + 14); c.stroke(); c.fillStyle = '#1b3a5c'; c.fillRect(f.x + f.w - 12, f.y + 6, 2.4, 11);
};
/* which tops get which content; `plate` means the label moves to a placard instead of sitting in the middle */
TBL.pick = function (lab) {
  if (/PRODUCE/.test(lab)) return ['produce', true];
  if (/BAKERY/.test(lab)) return ['bakery', true];
  if (/FOLDING/.test(lab)) return ['folding', false];
  if (/DRAFTING|BLUEPRINTS/.test(lab)) return ['drafting', true];
  if (/CONFERENCE/.test(lab)) return ['conference', true];
  if (/PREP/.test(lab)) return ['prep', false];
  if (/SLIPS/.test(lab)) return ['slips', false];
  return null;
};
