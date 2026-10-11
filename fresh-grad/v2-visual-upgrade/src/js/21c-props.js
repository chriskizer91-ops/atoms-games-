// small props: things that sit on furniture and shelves (v2)
// All front or top views, a few pixels big, painted once into the cached room. Nothing here is solid.
const PROP = {};
PROP.mug = function (c, x, y, col, r) {
  r = r || 3.6;
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 1.2, y + 1.6, r + 0.6, r * 0.8, 0, 0, 7); c.fill();
  c.strokeStyle = col || '#f4f1ea'; c.lineWidth = 1.5; c.beginPath(); c.arc(x + r + 0.6, y, r * 0.55, -1.2, 1.2); c.stroke();
  c.fillStyle = col || '#f4f1ea'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = '#4a2b17'; c.beginPath(); c.arc(x, y, r * 0.72, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, 7); c.fill();
};
PROP.paper = function (c, x, y, w, h, rot, lines) {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot || 0);
  c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(-w / 2 + 1, -h / 2 + 1.4, w, h);
  c.fillStyle = '#f7f4ec'; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = 'rgba(70,90,130,.45)'; for (let i = 0; i < (lines || 4); i++) c.fillRect(-w / 2 + 2, -h / 2 + 2.4 + i * 2.6, w - 4 - (i % 2) * 3, 0.9);
  c.restore();
};
PROP.notebook = function (c, x, y, w, h, col) {
  c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x + 1, y + 1.4, w, h);
  c.fillStyle = col || '#3d5a80'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + 2.4, y, 1.2, h);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + w * 0.35, y + h * 0.28, w * 0.5, h * 0.2);
};
PROP.book = function (c, x, y, w, h, col) {
  c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x + 0.8, y + 1.2, w, h);
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.fillStyle = shade(col, -0.25); c.fillRect(x, y, 2.2, h);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y, w, 0.9);
  c.fillStyle = '#f3e6a1'; c.fillRect(x + w * 0.3, y + h * 0.3, w * 0.5, 0.9);
};
PROP.keyboard = function (c, x, y, w, h) {
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; rr(c, x + 0.6, y + 1.2, w, h, 1.5); c.fill();
  c.fillStyle = '#d9dde0'; rr(c, x, y, w, h, 1.5); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 1, y, w - 2, 0.8);
  c.fillStyle = 'rgba(70,80,92,.55)'; for (let r = 0; r < 2; r++) for (let k = 0; k < w - 3; k += 2.4) c.fillRect(x + 1.4 + k, y + 1.2 + r * (h - 2.6) / 2, 1.5, (h - 3) / 2 - 0.6);
};
PROP.monitor = function (c, x, y, w, h, scr) {
  // front view: bezel, glass, neck and foot
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; rr(c, x + 1, y + 2, w, h + 5, 2); c.fill();
  c.fillStyle = '#15191f'; rr(c, x, y, w, h, 2.2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 1, y + 0.3, w - 2, 0.8);
  c.fillStyle = scr || '#223244'; c.fillRect(x + 1.8, y + 1.8, w - 3.6, h - 3.6);
  IM.glints(c, x + 1.8, y + 1.8, w - 3.6, h - 3.6, 0.16);
  c.fillStyle = '#3a414a'; c.fillRect(x + w / 2 - 2.2, y + h, 4.4, 3);
  c.fillStyle = '#c9cdd2'; rr(c, x + w / 2 - 6, y + h + 2.4, 12, 2.6, 1.2); c.fill();
};
PROP.laptop = function (c, x, y, w, h, scr) {
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; rr(c, x + 1, y + 1.5, w, h, 1.8); c.fill();
  c.fillStyle = '#b8bec6'; rr(c, x, y + h * 0.5, w, h * 0.5, 1.6); c.fill();
  c.fillStyle = 'rgba(40,48,58,.45)'; for (let k = 0; k < 3; k++) c.fillRect(x + 2, y + h * 0.58 + k * 2, w - 4, 1);
  c.fillStyle = '#20262d'; rr(c, x + 1, y, w - 2, h * 0.52, 1.6); c.fill();
  c.fillStyle = scr || '#4a90c2'; c.fillRect(x + 2.4, y + 1.2, w - 4.8, h * 0.52 - 2.8);
};
PROP.plantSm = function (c, x, y, k) {
  k = k || 1; c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, 4 * k, 1.8 * k, 0, 0, 7); c.fill();
  c.fillStyle = '#b8654a'; c.beginPath(); c.moveTo(x - 3 * k, y - 3 * k); c.lineTo(x + 3 * k, y - 3 * k); c.lineTo(x + 2 * k, y + 1); c.lineTo(x - 2 * k, y + 1); c.closePath(); c.fill();
  c.fillStyle = '#3f9a62'; for (let i = 0; i < 5; i++) { const a = -2.5 + i * 0.5; c.beginPath(); c.ellipse(x + Math.cos(a) * 2.6 * k, y - 4 * k + Math.sin(a) * 2.6 * k, 1.5 * k, 3.4 * k, a + 1.57, 0, 7); c.fill(); }
  c.fillStyle = '#7ad28c'; c.beginPath(); c.arc(x - 0.8 * k, y - 6 * k, 1.2 * k, 0, 7); c.fill();
};
PROP.lampDesk = function (c, x, y, col) {
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 1.5, y + 2, 5, 2.2, 0, 0, 7); c.fill();
  c.fillStyle = '#2d3238'; c.beginPath(); c.ellipse(x, y, 3.6, 1.8, 0, 0, 7); c.fill();
  c.strokeStyle = '#2d3238'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y - 7); c.lineTo(x + 2, y - 11); c.stroke();
  c.fillStyle = col || '#f4c26b'; c.beginPath(); c.moveTo(x - 1, y - 12.5); c.lineTo(x + 6, y - 10.5); c.lineTo(x + 4, y - 7); c.lineTo(x - 2, y - 9); c.closePath(); c.fill();
};
PROP.cup = function (c, x, y, col) {   // a takeaway cup seen from above
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, 3.6, 2.8, 0, 0, 7); c.fill();
  c.fillStyle = col || '#f6f1e7'; c.beginPath(); c.arc(x, y, 3.4, 0, 7); c.fill();
  c.fillStyle = '#3a2a20'; c.beginPath(); c.arc(x, y, 2.3, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x - 1, y - 1, 0.9, 0, 7); c.fill();
};
PROP.plate = function (c, x, y, r, food) {
  c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(x + 1, y + 1.6, r, r * 0.86, 0, 0, 7); c.fill();
  c.fillStyle = '#f7f3ea'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, r * 0.66, 0, 7); c.stroke();
  if (food) { c.fillStyle = food; c.beginPath(); c.arc(x, y, r * 0.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.12, y - r * 0.14, r * 0.14, 0, 7); c.fill(); }
};
PROP.shaker = function (c, x, y, col) { c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 0.8, y + 1.2, 2, 1.5, 0, 0, 7); c.fill(); c.fillStyle = col || '#dfe6ea'; c.beginPath(); c.arc(x, y, 1.9, 0, 7); c.fill(); c.fillStyle = '#9aa7ad'; c.beginPath(); c.arc(x, y, 0.9, 0, 7); c.fill(); };
PROP.napkins = function (c, x, y, w, h) { c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 0.8, y + 1.2, w, h); c.fillStyle = '#c9ced2'; c.fillRect(x, y, w, h); c.fillStyle = '#f6f1e7'; c.fillRect(x + 0.8, y + 0.6, w - 1.6, h - 1.4); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + w / 2 - 0.4, y + 1, 0.8, h - 2); };
PROP.vase = function (c, x, y, col, fl) {
  c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, 3, 1.8, 0, 0, 7); c.fill();
  c.fillStyle = col || '#8ecae6'; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
  const r = IM.rng(Math.round(x), Math.round(y), 3);
  for (let i = 0; i < 5; i++) { c.fillStyle = (fl || ['#ff7a95', '#ffd166', '#ffffff'])[i % 3]; c.beginPath(); c.arc(x + (r() - 0.5) * 6, y + (r() - 0.5) * 6 - 1, 1.5 + r() * 0.8, 0, 7); c.fill(); }
};
PROP.candle = function (c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 0.8, y + 1, 2.4, 1.6, 0, 0, 7); c.fill(); c.fillStyle = '#7a1f33'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(x, y - 0.3, 1.1, 0, 7); c.fill(); addEmit(x, y, 9, 0, 0.3); };
PROP.bottle = function (c, x, y, w, h, col) {
  c.fillStyle = col; rr(c, x, y + h * 0.32, w, h * 0.68, w * 0.28); c.fill(); rr(c, x + w * 0.3, y + h * 0.08, w * 0.4, h * 0.3, 1); c.fill();
  c.fillStyle = shade(col, -0.35); c.fillRect(x + w * 0.28, y, w * 0.44, h * 0.1);
  c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x + w * 0.18, y + h * 0.4, w * 0.16, h * 0.4);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x + w * 0.1, y + h * 0.56, w * 0.8, h * 0.18);
};

/* ---------- stock for shelves and racks: rows of products, in front view ----------
   Each draws into the strip [x0, x1] standing on baseline `by`, no taller than `mh`. Colours come from `cols`. */
PROP.stockItem = {
  box(c, x, by, w, h, col, r) {
    c.fillStyle = col; c.fillRect(x, by - h, w, h);
    c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x, by - h, w, 1); c.fillRect(x, by - h, 1, h);
    c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x + w - 1.3, by - h, 1.3, h); c.fillRect(x, by - 1.2, w, 1.2);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 1.4, by - h * 0.62, w - 2.8, h * 0.26);
    c.fillStyle = shade(col, -0.3); c.fillRect(x + 2.2, by - h * 0.56, Math.max(1, (w - 4.4) * (0.4 + r() * 0.4)), 1.2);
  },
  can(c, x, by, w, h, col, r) {
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, shade(col, 0.2)], [0.45, col], [1, shade(col, -0.25)]]); c.fillRect(x, by - h, w, h);
    c.fillStyle = '#cfd5d9'; c.fillRect(x, by - h, w, 1.6); c.fillRect(x, by - 1.6, w, 1.6);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 1, by - h + 1.6, 1.2, h - 3.2);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x, by - h * 0.62, w, h * 0.22);
  },
  bottle(c, x, by, w, h, col) { PROP.bottle(c, x, by - h, w, h, col); },
  bag(c, x, by, w, h, col, r) {
    c.fillStyle = col; rr(c, x, by - h, w, h, 1.8); c.fill();
    c.fillStyle = shade(col, -0.18); c.beginPath(); c.moveTo(x, by - h); for (let k = 0; k <= w; k += 1.8) c.lineTo(x + k, by - h + ((k / 1.8) % 2 ? 1.6 : 0)); c.lineTo(x + w, by - h + 3); c.lineTo(x, by - h + 3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 1.2, by - h + 4, 1.4, h - 6);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x + w / 2, by - h * 0.45, Math.min(w * 0.26, 3), 0, 7); c.fill();
  },
  jar(c, x, by, w, h, col) {
    c.fillStyle = 'rgba(210,235,245,.6)'; rr(c, x, by - h * 0.86, w, h * 0.86, 1.8); c.fill();
    c.fillStyle = col; rr(c, x + 1, by - h * 0.7, w - 2, h * 0.68, 1.4); c.fill();
    c.fillStyle = '#d9c36a'; c.fillRect(x - 0.3, by - h, w + 0.6, h * 0.16);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x + 1.2, by - h * 0.74, 1.2, h * 0.5);
  },
  tube(c, x, by, w, h, col) {
    c.fillStyle = col; rr(c, x, by - h, w, h, 1.4); c.fill(); c.fillStyle = '#f4f1ea'; c.fillRect(x + w * 0.2, by - h - 2.4, w * 0.6, 3);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 1, by - h + 2, 1.2, h - 4); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x + 1.2, by - h * 0.5, w - 2.4, 2.6);
  },
  sack(c, x, by, w, h, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x + 1, by); c.quadraticCurveTo(x - 1, by - h * 0.6, x + w * 0.3, by - h * 0.82); c.lineTo(x + w * 0.4, by - h); c.lineTo(x + w * 0.6, by - h); c.lineTo(x + w * 0.7, by - h * 0.82); c.quadraticCurveTo(x + w + 1, by - h * 0.6, x + w - 1, by); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + w * 0.22, by - h * 0.7, 1.4, h * 0.55); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + w * 0.2, by - h * 0.5, w * 0.6, h * 0.2);
  }
};
PROP.stock = function (c, kind, x0, x1, by, mh, seed, cols) {
  const r = IM.rng(seed, Math.round(x0), Math.round(by)), kinds = { cereal: ['box'], snack: ['bag', 'bag', 'box'], lunch: ['can', 'bag', 'box', 'jar'], dinner: ['box', 'jar', 'can', 'bag'], pills: ['bottle', 'box', 'bottle'], aid: ['box', 'tube', 'box'], cold: ['bottle', 'box', 'bottle', 'jar'], skin: ['tube', 'jar', 'bottle'], bar: ['box', 'bag'], paint: ['can'], garden: ['sack', 'bag', 'jar'], pipes: ['can', 'tube', 'box'], gear: ['bottle', 'box', 'bag'], dry: ['sack', 'can', 'jar'], parts: ['box', 'jar', 'can'], hair: ['bottle', 'tube', 'jar'], mix: ['box', 'can', 'bag', 'bottle', 'jar'] };
  const ks = kinds[kind] || kinds.mix;
  let x = x0 + 1.5;
  while (x < x1 - 3) {
    const k = ks[(r() * ks.length) | 0], col = cols[(r() * cols.length) | 0];
    let w = k === 'can' ? 6 + r() * 2 : k === 'bottle' ? 5 + r() * 2.5 : k === 'tube' ? 4.5 + r() * 1.5 : k === 'sack' ? 9 + r() * 4 : 7 + r() * 5;
    const h = Math.min(mh, mh * (0.62 + r() * 0.38) * (k === 'can' ? 0.75 : 1));
    if (x + w > x1 - 1) break;
    PROP.stockItem[k](c, x, by, w, h, col, r);
    x += w + 0.8 + r() * 1.4;
  }
};
/* a row of book spines, some leaning, a few lying flat at the end */
PROP.books = function (c, x0, x1, by, mh, seed) {
  const r = IM.rng(seed, Math.round(x0), Math.round(by)), pal = ['#c0392b', '#2980b9', '#27ae60', '#e0b23a', '#8e44ad', '#d9722b', '#ece3d0', '#2c3e50', '#16a085', '#b5495b', '#6b4a30'];
  let x = x0 + 1;
  while (x < x1 - 4) {
    if (r() < 0.07 && x < x1 - 26) {   // a flat stack
      const n = 2 + ((r() * 2) | 0);
      for (let k = 0; k < n; k++) { const bw = 14 + r() * 8, col = pal[(r() * pal.length) | 0]; c.fillStyle = col; c.fillRect(x, by - 3 * (k + 1), bw, 3); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, by - 3 * (k + 1), bw, 0.8); c.fillStyle = '#f3e6c8'; c.fillRect(x + bw - 2.4, by - 3 * (k + 1) + 0.6, 2, 1.8); }
      x += 20 + r() * 4; continue;
    }
    const w = 3.6 + r() * 4.2, h = mh * (0.62 + r() * 0.38), col = pal[(r() * pal.length) | 0];
    const lean = r() < 0.06 && x < x1 - 12 ? 0.25 : 0;
    c.save(); if (lean) { c.translate(x + w, by); c.rotate(-lean); c.translate(-(x + w), -by); }
    c.fillStyle = col; c.fillRect(x, by - h, w, h);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, by - h, 0.9, h); c.fillRect(x, by - h, w, 0.9);
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + w - 1, by - h, 1, h);
    if (r() < 0.7) { c.fillStyle = r() < 0.5 ? '#e9d28a' : 'rgba(255,255,255,.65)'; c.fillRect(x, by - h + 3, w, 1); c.fillRect(x, by - 5, w, 1); }
    if (r() < 0.4 && w > 5) { c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 1.2, by - h * 0.62, w - 2.4, h * 0.2); }
    c.restore();
    x += w + (lean ? 5 : 0.2);
  }
};

/* things left on countertops, by name; a room style lists which ones suit it (ROOM_STYLE[id].cprops) */
PROP.on = {
  dome(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.beginPath(); c.ellipse(x + 1.4, y + 2.4, 8, 3.4, 0, 0, 7); c.fill(); c.fillStyle = '#d9dde0'; c.beginPath(); c.ellipse(x, y + 1.6, 7.6, 3, 0, 0, 7); c.fill(); c.fillStyle = '#e8c27a'; c.beginPath(); c.ellipse(x, y - 0.4, 5.6, 2.8, 0, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x, y - 1.2, 1.2, 0, 7); c.fill(); c.fillStyle = 'rgba(210,235,245,.5)'; c.beginPath(); c.arc(x, y + 0.6, 7, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - 2.4, y - 3, 1.6, 0, 7); c.fill(); },
  cups(c, x, y) { for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(x + i * 5 + 1, y + 1.6, 2.8, 2.2, 0, 0, 7); c.fill(); c.fillStyle = i % 2 ? '#f6f1e7' : '#e63946'; c.beginPath(); c.arc(x + i * 5, y, 2.8, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.arc(x + i * 5, y, 1.7, 0, 7); c.fill(); } },
  napkins(c, x, y) { PROP.napkins(c, x - 4, y - 3, 8, 6); },
  shakers(c, x, y) { PROP.shaker(c, x - 3, y); PROP.shaker(c, x + 3, y + 0.6, '#e9c46a'); },
  sauce(c, x, y) { c.fillStyle = '#c0392b'; rr(c, x - 5, y - 4, 4.4, 9, 1.8); c.fill(); c.fillStyle = '#f1c40f'; rr(c, x + 1, y - 4, 4.4, 9, 1.8); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 4.4, y - 2, 0.8, 5); c.fillRect(x + 1.6, y - 2, 0.8, 5); },
  menu(c, x, y) { PROP.paper(c, x - 5, y - 6, 10, 13, 0.1, 5); PROP.paper(c, x - 3, y - 5, 10, 13, -0.08, 5); },
  mugs(c, x, y) { PROP.mug(c, x - 5, y, '#f4f1ea', 3.2); PROP.mug(c, x + 4, y + 1, '#e76f51', 3.2); },
  jar(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x - 3, y + 5, 8, 2); c.fillStyle = 'rgba(210,235,245,.7)'; rr(c, x - 4, y - 5, 8, 10, 2); c.fill(); c.fillStyle = '#ffd166'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x - 2 + (i % 3) * 2, y + 2 - ((i / 3) | 0) * 3, 1.5, 0, 7); c.fill(); } c.fillStyle = '#c0392b'; c.fillRect(x - 4.4, y - 6.4, 8.8, 2); },
  bucket(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(x + 1.2, y + 2, 5, 3, 0, 0, 7); c.fill(); c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.fillStyle = '#c0392b'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x, y, 5, i * 1.0472, i * 1.0472 + 0.5236); c.lineTo(x, y); c.fill(); } c.fillStyle = '#ffe08a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + (i % 3 - 1) * 2.2, y + ((i / 3) | 0) * 2 - 1.4, 1.5, 0, 7); c.fill(); } },
  box(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x - 6, y - 4, 13, 10); c.fillStyle = '#e8d3a8'; c.fillRect(x - 7, y - 5, 13, 10); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 7, y - 5, 13, 1); c.fillStyle = '#c0392b'; c.fillRect(x - 3, y - 2, 5, 2); c.fillStyle = '#e0c590'; c.fillRect(x - 5, y - 8, 13, 4); },
  bell(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.ellipse(x + 1, y + 2, 4, 2, 0, 0, 7); c.fill(); c.fillStyle = IM.grad(c, x - 4, 0, x + 4, 0, [[0, '#f6e6aa'], [1, '#a8801e']]); c.beginPath(); c.arc(x, y, 3.8, Math.PI, 0); c.lineTo(x + 4, y + 1.6); c.lineTo(x - 4, y + 1.6); c.closePath(); c.fill(); c.fillStyle = '#d4a017'; c.fillRect(x - 0.8, y - 5, 1.6, 1.6); },
  clipboard(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.fillRect(x - 4, y - 5, 10, 13); c.fillStyle = '#8a6a3c'; c.fillRect(x - 5, y - 6, 10, 13); c.fillStyle = '#f7f4ec'; c.fillRect(x - 4, y - 4, 8, 10); c.fillStyle = '#9aa7ad'; c.fillRect(x - 2, y - 7, 4, 2.4); c.fillStyle = 'rgba(70,90,130,.5)'; for (let i = 0; i < 3; i++) c.fillRect(x - 3, y - 2 + i * 2.6, 6, 0.8); },
  brochures(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.fillRect(x - 6, y - 1, 13, 7); c.fillStyle = '#cfd8dc'; c.fillRect(x - 7, y - 2, 13, 7); ['#e63946', '#3aa6b9', '#ffd166'].forEach((col, i) => { c.fillStyle = col; c.fillRect(x - 6 + i * 4, y - 7, 3.4, 6); }); },
  plant(c, x, y) { PROP.plantSm(c, x, y + 4, 1); },
  pizzabox(c, x, y) { c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.fillRect(x - 8, y - 6, 18, 18); c.fillStyle = '#e8d3a8'; c.fillRect(x - 9, y - 7, 18, 18); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 9, y - 7, 18, 1.2); c.fillStyle = '#2f7d4f'; c.fillRect(x - 5, y - 1, 10, 3); c.fillStyle = '#c0392b'; c.fillRect(x - 5, y + 3, 6, 2); },
  register(c, x, y) { PROP.monitor(c, x - 8, y - 8, 16, 11, '#1a2a1e'); c.fillStyle = '#3a414a'; rr(c, x - 9, y + 5, 18, 4, 1.4); c.fill(); }
};
