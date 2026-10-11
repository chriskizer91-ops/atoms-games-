/* ============================ interior materials and light helpers (v2) ============================
   Everything here is drawing-only. It paints into the cached room layer (once per room), so it may be as detailed as
   it likes: no Math.random (seeded hash01 / mulberry32 only), no time or night dependence. Key light is the sun from
   the upper left: highlights sit on top/left edges, shadows fall to the lower right. */
const IM = {};
IM.rgba = (col, a) => { const q = hexRgb(col); return 'rgba(' + (q[0] | 0) + ',' + (q[1] | 0) + ',' + (q[2] | 0) + ',' + (+a).toFixed(3) + ')'; };
IM.lum = col => { const q = hexRgb(col); return (q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11) / 255; };
IM.sat = col => { const q = hexRgb(col), mx = Math.max(q[0], q[1], q[2]), mn = Math.min(q[0], q[1], q[2]); return mx ? (mx - mn) / mx : 0; };
IM.rng = (a, b, c) => mulberry32((((hash01(a | 0, b | 0, c | 0) * 4294967295) >>> 0) || 1));
IM.INK = '14,16,40';          // shadow colour: deep navy violet, never black
IM.CREAM = '255,244,222';     // highlight colour: warm cream, never pure white

/* soft drop shadow only (the caster itself is drawn off-canvas), blur in world units */
IM.shadow = function (c, x, y, w, h, r, blur, a, ox, oy) {
  const s = c.getTransform ? c.getTransform().a : 1, B = 7000;
  c.save();
  c.shadowColor = 'rgba(' + IM.INK + ',' + a + ')'; c.shadowBlur = blur * s; c.shadowOffsetX = B + (ox || 0) * s; c.shadowOffsetY = (oy || 0) * s;
  c.fillStyle = '#000'; rr(c, x - B / s, y, w, h, r); c.fill();
  c.restore();
};
/* the standard furniture shadow: a wide soft one plus a tight contact line */
IM.contact = function (c, x, y, w, h, r, k) {
  k = k || 1;
  IM.shadow(c, x, y + 2, w, h, r, 9 * k, 0.26, 3.5 * k, 5.5 * k);
  IM.shadow(c, x, y + 1, w, h, r, 2.6, 0.34, 1, 2);
};
IM.bevel = function (c, x, y, w, h, r, hi, lo) {
  hi = hi == null ? 0.34 : hi; lo = lo == null ? 0.2 : lo;
  c.save(); rr(c, x, y, w, h, r); c.clip();
  c.fillStyle = 'rgba(' + IM.CREAM + ',' + hi + ')'; c.fillRect(x, y, w, 1.2); c.fillRect(x, y, 1.2, h);
  c.fillStyle = 'rgba(' + IM.INK + ',' + lo + ')'; c.fillRect(x, y + h - 1.4, w, 1.4); c.fillRect(x + w - 1.4, y, 1.4, h);
  c.restore();
};
IM.grad = function (c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; };
/* a rounded slab with a light-from-upper-left gradient */
IM.slab = function (c, x, y, w, h, r, col, k) {
  k = k == null ? 1 : k;
  c.fillStyle = IM.grad(c, x, y, x + w * 0.5, y + h, [[0, shade(col, 0.12 * k)], [0.55, col], [1, shade(col, -0.09 * k)]]);
  rr(c, x, y, w, h, r); c.fill();
};
IM.clip = function (c, x, y, w, h, r, fn) { c.save(); rr(c, x, y, w, h, r || 0); c.clip(); fn(); c.restore(); };
IM.pat = function (c, name, x, y, w, h, a, r) {
  const p = PAT[name]; if (!p) return;
  c.save(); if (r) { rr(c, x, y, w, h, r); c.clip(); }
  c.globalAlpha = a == null ? 1 : a; c.fillStyle = p; c.fillRect(x, y, w, h); c.restore();
};
/* seeded flecks */
IM.flecks = function (c, x, y, w, h, n, seed, cols, s0, s1) {
  const r = IM.rng(seed, Math.round(x), Math.round(y));
  for (let i = 0; i < n; i++) { c.fillStyle = cols[(r() * cols.length) | 0]; const s = s0 + r() * (s1 - s0); c.fillRect(x + r() * w, y + r() * h, s, s); }
};
/* diagonal glass reflections */
IM.glints = function (c, x, y, w, h, a) {
  a = a == null ? 0.28 : a;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const s = Math.min(w, h);
  c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.beginPath(); c.moveTo(x - 2, y + h); c.lineTo(x + w * 0.34 + s * 0.2, y); c.lineTo(x + w * 0.34 + s * 0.2 + Math.max(4, w * 0.12), y); c.lineTo(x + Math.max(4, w * 0.12) - 2, y + h); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,' + a * 0.5 + ')'; c.beginPath(); c.moveTo(x + w * 0.2, y + h); c.lineTo(x + w * 0.54 + s * 0.2, y); c.lineTo(x + w * 0.54 + s * 0.2 + 3, y); c.lineTo(x + w * 0.2 + 3, y + h); c.closePath(); c.fill();
  c.restore();
};
/* wood grain along x inside a rect (a tabletop, a counter edge) */
IM.grain = function (c, x, y, w, h, seed, a, vertical) {
  const r = IM.rng(seed, Math.round(x), Math.round(y)), n = Math.max(3, Math.round((vertical ? w : h) / 4.5));
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.lineWidth = 0.6;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.3 + r() * 0.5) / n, dark = r() < 0.66;
    c.strokeStyle = dark ? 'rgba(52,28,8,' + ((0.05 + r() * 0.09) * a).toFixed(3) + ')' : 'rgba(255,236,200,' + ((0.04 + r() * 0.07) * a).toFixed(3) + ')';
    c.beginPath();
    if (vertical) { const gx = x + t * w, wob = (r() - 0.5) * 2.4; c.moveTo(gx, y); c.bezierCurveTo(gx + wob, y + h * 0.33, gx - wob, y + h * 0.66, gx + wob * 0.5, y + h); }
    else { const gy = y + t * h, wob = (r() - 0.5) * 2.4; c.moveTo(x, gy); c.bezierCurveTo(x + w * 0.33, gy + wob, x + w * 0.66, gy - wob, x + w, gy + wob * 0.5); }
    c.stroke();
  }
  c.restore();
};
IM.brushed = function (c, x, y, w, h, a, r) { IM.pat(c, 'iw_brush', x, y, w, h, a == null ? 1 : a, r); };
IM.weave = function (c, x, y, w, h, a, r) { IM.pat(c, 'iw_weave', x, y, w, h, (a == null ? 1 : a) * 0.7, r); };
/* a small round-ended light screw / bolt / rivet */
IM.rivet = function (c, x, y, col) { c.fillStyle = col || 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x, y, 0.9, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.beginPath(); c.arc(x + 0.5, y + 0.6, 0.7, 0, 7); c.fill(); };
/* knob / dial: dark rim, bright face, highlight */
IM.knob = function (c, x, y, r, col) {
  c.fillStyle = 'rgba(' + IM.INK + ',.4)'; c.beginPath(); c.arc(x + 0.4, y + 0.8, r + 0.4, 0, 7); c.fill();
  c.fillStyle = col || '#d9dde0'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, 7); c.fill();
};
/* a lit rectangular screen face (the live pass repaints the inside, this is the off state) */
IM.screen = function (c, x, y, w, h, tint) {
  c.fillStyle = '#10151b'; rr(c, x - 1.5, y - 1.5, w + 3, h + 3, 2); c.fill();
  c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, tint || '#223244'], [1, '#0e1620']]); c.fillRect(x, y, w, h);
  IM.glints(c, x, y, w, h, 0.12);
};

/* ---------- repeating surface textures ---------- */
(function initInteriorPatterns() {
  const speck = (g, n, r, count, cols, s0, s1) => { for (let i = 0; i < count; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; const s = s0 + r() * (s1 - s0); g.fillRect(r() * n, r() * n, s, s); } };
  makePat('iw_noise', 128, 0.5, (g, n, r) => speck(g, n, r, 1000, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.06)'], 1, 1.7));
  makePat('iw_weave', 8, 0.5, (g) => {
    // a fine plain weave: 2px cells, light and dark alternating, so it reads as cloth rather than a grid
    for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2) {
      g.fillStyle = ((x + y) / 2) % 2 === 0 ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.09)'; g.fillRect(x, y, 2, 2);
    }
  });
  makePat('iw_brush', 128, 0.5, (g, n, r) => {
    for (let i = 0; i < 150; i++) { const y = r() * n, l = 20 + r() * 100, x = r() * n; g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,' + (0.03 + r() * 0.07).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.03 + r() * 0.06).toFixed(3) + ')'; g.fillRect(x, y, l, 1); g.fillRect(x - n, y, l, 1); }
  });
  makePat('iw_leather', 64, 0.5, (g, n, r) => {
    for (let y = 0; y < n; y += 6) for (let x = 0; x < n; x += 6) {
      const ox = x + (r() - 0.5) * 3, oy = y + (r() - 0.5) * 3;
      g.fillStyle = 'rgba(0,0,0,.10)'; g.beginPath(); g.ellipse(ox + 3, oy + 3, 2.6, 2.2, r(), 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(ox + 2.2, oy + 2.2, 1.5, 1.2, 0, 0, 7); g.fill();
    }
  });
  makePat('iw_carpet', 64, 0.5, (g, n, r) => {
    for (let i = 0; i < 700; i++) { const x = r() * n, y = r() * n, a = r() * 6.28, l = 1.5 + r() * 2; g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,' + (0.05 + r() * 0.07).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.06 + r() * 0.08).toFixed(3) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  });
  makePat('iw_lino', 128, 0.5, (g, n, r) => {
    const cols = ['rgba(255,255,255,.2)', 'rgba(0,0,0,.09)', 'rgba(120,150,170,.14)', 'rgba(255,230,200,.14)'];
    for (let i = 0; i < 260; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; g.beginPath(); g.ellipse(r() * n, r() * n, 0.8 + r() * 2.4, 0.6 + r() * 1.6, r() * 3, 0, 7); g.fill(); }
  });
  makePat('iw_conc', 256, 0.5, (g, n, r) => {
    for (let i = 0; i < 26; i++) { const x = r() * n, y = r() * n, rad = 18 + r() * 46, rg = g.createRadialGradient(x, y, 0, x, y, rad); const dk = r() < 0.5; rg.addColorStop(0, dk ? 'rgba(0,0,0,.022)' : 'rgba(255,255,255,.03)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    speck(g, n, r, 900, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.09)'], 1, 2.4);
    for (let i = 0; i < 22; i++) { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.arc(r() * n, r() * n, 0.5 + r() * 1.1, 0, 7); g.fill(); }
  });
  makePat('iw_plaster', 128, 0.5, (g, n, r) => {
    for (let i = 0; i < 16; i++) { const x = r() * n, y = r() * n, rad = 10 + r() * 28, rg = g.createRadialGradient(x, y, 0, x, y, rad); const dk = r() < 0.5; rg.addColorStop(0, dk ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.045)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    speck(g, n, r, 360, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.05)'], 1, 2.2);
  });
  makePat('iw_nap', 32, 0.5, (g, n, r) => {
    for (let x = 0; x < n; x += 2) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.09)'; g.fillRect(x, 0, 1, n); }
    speck(g, n, r, 160, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.07)'], 1, 1.5);
  });
  makePat('iw_cork', 64, 0.5, (g, n, r) => {
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,50,20,' + (0.1 + r() * 0.2).toFixed(3) + ')' : 'rgba(255,225,170,' + (0.08 + r() * 0.15).toFixed(3) + ')'; g.beginPath(); g.ellipse(r() * n, r() * n, 0.6 + r() * 1.8, 0.5 + r() * 1.2, r() * 3, 0, 7); g.fill(); }
  });
  makePat('iw_tilewall', 32, 0.5, (g) => {
    g.fillStyle = 'rgba(40,36,34,.22)'; g.fillRect(0, 15, 32, 1.4); g.fillRect(15, 0, 1.4, 16); g.fillRect(0, 31, 32, 1.4); g.fillRect(31, 16, 1.4, 16);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 15); g.fillRect(16, 16, 1, 15);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(2, 2, 12, 5); g.fillRect(18, 18, 12, 5);
  });
  makePat('iw_diamond', 32, 0.5, (g) => {
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 16); g.lineTo(16, 0); g.lineTo(32, 16); g.lineTo(16, 32); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.arc(16, 16, 1.2, 0, 7); g.fill();
  });
})();

/* ---------- floors ---------- */
IM.floors = {};
IM.floors.wood = function (c, x, y, w, h, col, col2, o) {
  const ph = o.ph || 26, pl = o.pl || 168, seed = o.seed || 3;
  c.fillStyle = shade(col, -0.12); c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let r = 0, yy = y; yy < y + h; yy += ph, r++) {
    const off = Math.floor(hash01(r, seed, 5) * pl);
    for (let k = -1, xx = x - off; xx < x + w; xx += pl, k++) {
      const v = hash01(r, k, seed + 11), len = pl;
      const tone = (v - 0.5) * 0.2, px = Math.max(x, xx), pw = Math.min(x + w, xx + len) - px;
      if (pw <= 0) continue;
      // each board has its own tone, so the floor reads as separate pieces of timber
      c.fillStyle = IM.grad(c, 0, yy, 0, yy + ph, [[0, shade(col, 0.05 + tone)], [1, shade(col, -0.04 + tone)]]);
      c.fillRect(px, yy, pw, ph - 1.4);
      const gr = IM.rng(r, k, seed + 21);
      c.save(); c.beginPath(); c.rect(px, yy, pw, ph - 1.4); c.clip(); c.lineWidth = 0.6;
      const ng = 5 + ((gr() * 3) | 0);
      for (let g = 0; g < ng; g++) {
        const gy = yy + 2 + gr() * (ph - 5), dark = gr() < 0.68, wob = (gr() - 0.5) * 2.6, x0 = xx + gr() * 22, x1 = xx + len - gr() * 30;
        c.strokeStyle = dark ? 'rgba(58,30,8,' + (0.06 + gr() * 0.1).toFixed(3) + ')' : 'rgba(255,238,205,' + (0.05 + gr() * 0.08).toFixed(3) + ')';
        c.beginPath(); c.moveTo(x0, gy); c.bezierCurveTo(x0 + (x1 - x0) * 0.3, gy + wob, x0 + (x1 - x0) * 0.7, gy - wob, x1, gy + wob * 0.4); c.stroke();
      }
      if (v > 0.88) {   // a knot, with the grain bending round it
        const kx = xx + 30 + gr() * (len - 60), ky = yy + 7 + gr() * (ph - 14);
        c.strokeStyle = 'rgba(58,30,8,.2)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(kx, ky, 5.5, 2.8, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(kx, ky, 3, 1.6, 0, 0, 7); c.stroke();
        c.fillStyle = 'rgba(58,30,8,.28)'; c.beginPath(); c.ellipse(kx, ky, 1.5, 0.9, 0, 0, 7); c.fill();
      }
      c.restore();
      // board end: a thin dark gap and the lit lip of the next board
      c.fillStyle = 'rgba(40,20,6,.42)'; c.fillRect(xx, yy, 1.3, ph);
      c.fillStyle = 'rgba(255,238,205,.12)'; c.fillRect(xx + 1.3, yy, 0.9, ph - 1.4);
    }
    c.fillStyle = 'rgba(38,18,4,.42)'; c.fillRect(x, yy + ph - 1.4, w, 1.4);
    c.fillStyle = 'rgba(255,240,212,.14)'; c.fillRect(x, yy + ph, w, 1);
  }
  IM.pat(c, 'iw_noise', x, y, w, h, 0.9);
  // varnish: a long soft sheen across the room, brighter toward the windows
  c.fillStyle = IM.grad(c, x, y, x + w * 0.55, y + h, [[0, 'rgba(255,238,205,.15)'], [0.5, 'rgba(255,238,205,0)'], [1, 'rgba(255,238,205,.05)']]); c.fillRect(x, y, w, h);
  c.restore();
};
IM.floors.parquet = function (c, x, y, w, h, col, col2, o) {
  const s = o.size || 48, seed = o.seed || 4;
  c.fillStyle = shade(col, -0.1); c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const tx = x + i * s, ty = y + j * s, horiz = (i + j) % 2 === 0, st = s / 4;
    for (let k = 0; k < 4; k++) {
      const v = hash01(i * 4 + k, j, seed), tone = (v - 0.5) * 0.09;
      const bx = horiz ? tx : tx + k * st, by = horiz ? ty + k * st : ty, bw = horiz ? s : st, bh = horiz ? st : s;
      c.fillStyle = IM.grad(c, bx, by, horiz ? bx : bx + bw, horiz ? by + bh : by, [[0, shade(col, 0.07 + tone)], [1, shade(col, -0.05 + tone)]]);
      c.fillRect(bx, by, bw, bh);
      IM.grain(c, bx, by, bw, bh, i * 17 + j * 5 + k, 0.55, !horiz);
      c.fillStyle = 'rgba(40,20,6,.28)'; if (horiz) c.fillRect(bx, by + bh - 1, bw, 1); else c.fillRect(bx + bw - 1, by, 1, bh);
      c.fillStyle = 'rgba(255,238,205,.1)'; if (horiz) c.fillRect(bx, by, bw, 0.8); else c.fillRect(bx, by, 0.8, bh);
    }
    c.fillStyle = 'rgba(30,14,4,.2)'; c.fillRect(tx, ty, s, 1); c.fillRect(tx, ty, 1, s);
  }
  IM.pat(c, 'iw_noise', x, y, w, h, 0.8);
  c.fillStyle = IM.grad(c, x, y, x + w * 0.6, y + h, [[0, 'rgba(255,238,205,.16)'], [0.55, 'rgba(255,238,205,0)']]); c.fillRect(x, y, w, h);
  c.restore();
};
IM.floors.tile = function (c, x, y, w, h, col, col2, o) {
  const s = o.size || 56, seed = o.seed || 7;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const tx = x + i * s, ty = y + j * s, v = hash01(i, j, seed);
    if (col2 && (i + j) % 2) { c.fillStyle = col2; c.fillRect(tx, ty, s, s); }
    c.fillStyle = v < 0.5 ? 'rgba(' + IM.INK + ',' + (v * 0.09).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.13).toFixed(3) + ')';
    c.fillRect(tx, ty, s, s);
    // glazed face: lighter toward the upper left of every tile
    c.fillStyle = IM.grad(c, tx, ty, tx + s, ty + s, [[0, 'rgba(255,255,255,.14)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(' + IM.INK + ',.06)']]); c.fillRect(tx, ty, s, s);
    c.fillStyle = 'rgba(255,255,255,.26)'; c.fillRect(tx + 1, ty + 1, s - 2, 1.1); c.fillRect(tx + 1, ty + 1, 1.1, s - 2);
    c.fillStyle = 'rgba(' + IM.INK + ',.12)'; c.fillRect(tx + 1, ty + s - 2.3, s - 2, 1.2); c.fillRect(tx + s - 2.3, ty + 1, 1.2, s - 2);
    if (v > 0.93) { c.strokeStyle = 'rgba(' + IM.INK + ',.16)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(tx + s * 0.2, ty + s * 0.8); c.lineTo(tx + s * 0.45, ty + s * 0.55); c.lineTo(tx + s * 0.4, ty + s * 0.4); c.stroke(); }
  }
  c.fillStyle = o.grout || 'rgba(70,60,56,.34)';
  for (let i = 1; i < nx; i++) c.fillRect(x + i * s - 0.8, y, 1.6, h);
  for (let j = 1; j < ny; j++) c.fillRect(x, y + j * s - 0.8, w, 1.6);
  IM.pat(c, 'iw_lino', x, y, w, h, 0.45); IM.pat(c, 'iw_noise', x, y, w, h, 0.6);
  // wet-look reflection of the room light, two long soft streaks
  c.fillStyle = IM.grad(c, x, y, x + w * 0.4, y + h, [[0, 'rgba(255,255,255,.12)'], [0.3, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,.07)'], [0.78, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h);
  c.restore();
};
IM.floors.marble = function (c, x, y, w, h, col, col2, o) {
  const s = o.size || 74, seed = o.seed || 9;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const tx = x + i * s, ty = y + j * s, v = hash01(i, j, seed), r = IM.rng(i, j, seed);
    c.fillStyle = (i + j) % 2 ? 'rgba(120,108,88,.10)' : 'rgba(255,255,255,.14)'; c.fillRect(tx, ty, s, s);
    c.fillStyle = v < 0.5 ? 'rgba(' + IM.INK + ',' + (v * 0.07).toFixed(3) + ')' : 'rgba(255,250,235,' + ((v - 0.5) * 0.12).toFixed(3) + ')'; c.fillRect(tx, ty, s, s);
    c.save(); c.beginPath(); c.rect(tx, ty, s, s); c.clip();
    for (let k = 0; k < 3; k++) {   // veins
      const x0 = tx + r() * s, y0 = ty - 4, x1 = tx + r() * s, y1 = ty + s + 4;
      c.strokeStyle = 'rgba(120,106,86,' + (0.05 + r() * 0.07).toFixed(3) + ')'; c.lineWidth = 0.4 + r() * 0.9; c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + (r() - 0.5) * 50, ty + s * 0.3, x1 + (r() - 0.5) * 50, ty + s * 0.7, x1, y1); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x0 + 1.4, y0); c.bezierCurveTo(x0 + 1.4 + (r() - 0.5) * 50, ty + s * 0.3, x1 + 1.4 + (r() - 0.5) * 50, ty + s * 0.7, x1 + 1.4, y1); c.stroke();
    }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(tx + 1, ty + 1, s - 2, 1.1); c.fillRect(tx + 1, ty + 1, 1.1, s - 2);
    c.fillStyle = 'rgba(' + IM.INK + ',.13)'; c.fillRect(tx + 1, ty + s - 2.2, s - 2, 1.2); c.fillRect(tx + s - 2.2, ty + 1, 1.2, s - 2);
  }
  c.fillStyle = 'rgba(86,74,56,.34)';
  for (let i = 1; i < nx; i++) c.fillRect(x + i * s - 0.7, y, 1.4, h);
  for (let j = 1; j < ny; j++) c.fillRect(x, y + j * s - 0.7, w, 1.4);
  IM.pat(c, 'iw_noise', x, y, w, h, 0.5);
  c.fillStyle = IM.grad(c, x, y, x + w * 0.5, y + h, [[0, 'rgba(255,255,255,.22)'], [0.3, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,.12)'], [0.7, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h);
  c.restore();
};
IM.floors.carpet = function (c, x, y, w, h, col, col2, o) {
  const seed = o.seed || 5;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  IM.pat(c, 'iw_carpet', x, y, w, h, 1);
  // broad pile direction bands, like a freshly vacuumed floor
  for (let yy = y + 6; yy < y + h; yy += 18) { c.fillStyle = (yy / 18 | 0) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; c.fillRect(x, yy, w, 9); }
  if (col2) { c.fillStyle = col2; for (let yy = y + 8; yy < y + h; yy += 18) c.fillRect(x, yy, w, 1.2); }
  if (o.motif) {   // the repeating pattern of a theatre carpet
    const s = 56;
    for (let j = 0; j * s < h + s; j++) for (let i = 0; i * s < w + s; i++) {
      const cx = x + i * s + (j % 2 ? s / 2 : 0), cy = y + j * s + s / 2;
      c.fillStyle = o.motif; c.beginPath(); c.moveTo(cx, cy - 9); c.lineTo(cx + 6, cy); c.lineTo(cx, cy + 9); c.lineTo(cx - 6, cy); c.closePath(); c.fill();
      c.fillStyle = IM.rgba('#ffffff', 0.05); c.beginPath(); c.arc(cx + s / 2, cy, 1.8, 0, 7); c.arc(cx, cy + s / 2, 1.8, 0, 7); c.fill();
    }
  }
  if (o.tiles) {   // modular carpet tiles: slightly different tones and fine seams
    const s = o.tiles;
    for (let j = 0; j * s < h; j++) for (let i = 0; i * s < w; i++) { const v = hash01(i, j, seed); c.fillStyle = v < 0.5 ? 'rgba(0,0,0,' + (v * 0.07).toFixed(3) + ')' : 'rgba(255,255,255,' + ((v - 0.5) * 0.08).toFixed(3) + ')'; c.fillRect(x + i * s, y + j * s, s, s); }
    c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i * s < w; i++) c.fillRect(x + i * s - 0.5, y, 1, h); for (let j = 1; j * s < h; j++) c.fillRect(x, y + j * s - 0.5, w, 1);
  }
  // worn path: the pile flattens where people walk, from the door toward the middle
  const wx = o.wearX == null ? x + w / 2 : o.wearX;
  const wg = c.createRadialGradient(wx, y + h - 20, 10, wx, y + h * 0.55, h * 0.7);
  wg.addColorStop(0, 'rgba(255,255,255,.06)'); wg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = wg; c.fillRect(x, y, w, h);
  IM.pat(c, 'iw_noise', x, y, w, h, 0.7);
  c.restore();
};
IM.floors.lino = function (c, x, y, w, h, col, col2, o) {
  const s = o.size || 60;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  IM.pat(c, 'iw_lino', x, y, w, h, 1);
  // sheet seams with a lit edge
  c.fillStyle = col2 || 'rgba(0,0,0,.08)';
  for (let xx = x + s; xx < x + w; xx += s) { c.fillRect(xx, y, 1.8, h); }
  for (let yy = y + s; yy < y + h; yy += s) { c.fillRect(x, yy, w, 1.8); }
  c.fillStyle = 'rgba(255,255,255,.28)';
  for (let xx = x + s; xx < x + w; xx += s) c.fillRect(xx + 1.8, y, 0.9, h);
  for (let yy = y + s; yy < y + h; yy += s) c.fillRect(x, yy + 1.8, w, 0.9);
  // a few scuffs where shoes drag
  const r = IM.rng(Math.round(x), Math.round(y), 31);
  c.strokeStyle = 'rgba(' + IM.INK + ',.07)'; c.lineWidth = 1.4; c.lineCap = 'round';
  for (let i = 0; i < Math.round(w * h / 38000); i++) { const sx = x + 20 + r() * (w - 40), sy = y + 20 + r() * (h - 40), a = r() * 3; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * (8 + r() * 14), sy + Math.sin(a) * 4); c.stroke(); }
  c.lineCap = 'butt';
  IM.pat(c, 'iw_noise', x, y, w, h, 0.6);
  // waxed: bright soft reflections
  c.fillStyle = IM.grad(c, x, y, x + w * 0.45, y + h, [[0, 'rgba(255,255,255,.17)'], [0.35, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,.09)'], [0.76, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h);
  c.restore();
};
IM.floors.plain = function (c, x, y, w, h, col, col2, o) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  IM.pat(c, 'iw_conc', x, y, w, h, 1);
  const r = IM.rng(Math.round(x), Math.round(y), 41);
  // trowel sweeps
  c.lineWidth = 1.2;
  for (let i = 0; i < Math.round(w * h / 26000) + 2; i++) { const cx = x + r() * w, cy = y + r() * h, rad = 30 + r() * 60; c.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; c.beginPath(); c.arc(cx, cy, rad, r() * 6, r() * 6 + 1.3); c.stroke(); }
  // expansion joints and a hairline crack
  const js = o.joint || 124;
  c.fillStyle = 'rgba(' + IM.INK + ',.2)';
  for (let xx = x + js; xx < x + w; xx += js) c.fillRect(xx, y, 1.8, h);
  for (let yy = y + js; yy < y + h; yy += js) c.fillRect(x, yy, w, 1.8);
  c.fillStyle = 'rgba(255,255,255,.12)';
  for (let xx = x + js; xx < x + w; xx += js) c.fillRect(xx + 1.8, y, 0.8, h);
  for (let yy = y + js; yy < y + h; yy += js) c.fillRect(x, yy + 1.8, w, 0.8);
  c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 0.7;
  for (let i = 0; i < 2; i++) { let px = x + r() * w, py = y + r() * h; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 24; py += r() * 14; c.lineTo(px, py); } c.stroke(); }
  c.fillStyle = IM.grad(c, x, y, x + w * 0.5, y + h, [[0, 'rgba(255,255,255,.1)'], [0.4, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h);
  c.restore();
};
