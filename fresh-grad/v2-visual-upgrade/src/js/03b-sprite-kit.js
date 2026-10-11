/* ============================ world sprite kit ============================
   Small painted sprites (window frames, room glimpses, doors, awnings, lettering, props) are drawn once
   at the current ground resolution and blitted every frame. Everything here is cosmetic. */
const W_SPR = { m: new Map(), px: 0, budget: 9e6 };
function wres() { return (typeof GC !== 'undefined' && GC.res) || 1; }
/* web fonts arrive late; lettering sprites made before that are rebuilt */
let W_FONT_GEN = 0;
try { if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { W_FONT_GEN++; }); } catch (e) { /* no font events */ }
function wspr(key, w, h, paint) {
  const res = wres(), k = key + '|' + res;
  let s = W_SPR.m.get(k);
  if (s) return s;
  const cw = Math.max(1, Math.ceil(w * res)), ch = Math.max(1, Math.ceil(h * res));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.setTransform(cw / w, 0, 0, ch / h, 0, 0);
  paint(g, w, h);
  s = { cv, w, h };
  W_SPR.px += cw * ch; W_SPR.m.set(k, s);
  if (W_SPR.px > W_SPR.budget) {
    for (const [kk, v] of W_SPR.m) { if (W_SPR.px <= W_SPR.budget * 0.7) break; W_SPR.px -= v.cv.width * v.cv.height; W_SPR.m.delete(kk); }
  }
  return s;
}
function wBlit(c, s, x, y, w, h) { c.drawImage(s.cv, x, y, w == null ? s.w : w, h == null ? s.h : h); }
/* a soft vertical or horizontal fade used all over for ambient occlusion */
function wFadeV(g, x, y, w, h, a0, a1, rgb) {
  const q = g.createLinearGradient(0, y, 0, y + h), c = rgb || '0,0,0';
  q.addColorStop(0, 'rgba(' + c + ',' + a0 + ')'); q.addColorStop(1, 'rgba(' + c + ',' + a1 + ')');
  g.fillStyle = q; g.fillRect(x, y, w, h);
}
function wFadeH(g, x, y, w, h, a0, a1, rgb) {
  const q = g.createLinearGradient(x, 0, x + w, 0), c = rgb || '0,0,0';
  q.addColorStop(0, 'rgba(' + c + ',' + a0 + ')'); q.addColorStop(1, 'rgba(' + c + ',' + a1 + ')');
  g.fillStyle = q; g.fillRect(x, y, w, h);
}
function wGlow(g, x, y, r, rgb, a) {
  const q = g.createRadialGradient(x, y, 0, x, y, r);
  q.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2);
}

/* ---------- rooms glimpsed through glass ---------- */
const W_WIN_P = 8, W_WIN_PB = 18, W_WIN_IM = 3;
const W_CURT = ['#d9603b', '#4f8fc0', '#e0b24a', '#8a5ac8', '#4fae92', '#e5708f'];
const W_BOOKS = ['#c0392b', '#2f6db0', '#e0a82e', '#3f8f5a', '#7a4fb0', '#d9d2c2', '#e07a3f'];
const W_ROOMS = [
  /* 0 curtains */ (g, W, H, r, N, T, c1) => {
    const cw = W * 0.27, col = T(c1);
    [0, 1].forEach(i => {
      const x0 = i ? W - cw : 0, s = i ? -1 : 1, e = i ? W : 0;
      const lg = g.createLinearGradient(x0, 0, x0 + cw, 0); lg.addColorStop(0, shade(col, i ? -0.2 : -0.1)); lg.addColorStop(0.5, col); lg.addColorStop(1, shade(col, i ? -0.1 : -0.2));
      g.fillStyle = lg; g.beginPath(); g.moveTo(e, 0); g.lineTo(e + s * cw, 0); g.lineTo(e + s * cw * 0.72, H * 0.56); g.lineTo(e + s * cw * 0.98, H); g.lineTo(e, H); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(e + s * cw * k / 4, 0); g.quadraticCurveTo(e + s * cw * (k / 4 - 0.07), H * 0.5, e + s * cw * (k / 4 + 0.02), H); g.stroke(); }
      g.fillStyle = shade(col, 0.2); g.fillRect(Math.min(e, e + s * cw), H * 0.55, cw * 0.78, 1.4);
    });
    g.fillStyle = N ? '#8a5f34' : '#4a3a28'; g.fillRect(0, 0, W, 1.6);
    const px = W * (0.42 + r() * 0.16);
    g.fillStyle = T('#b8683f'); g.beginPath(); g.moveTo(px - 3.4, H - 5.5); g.lineTo(px + 3.4, H - 5.5); g.lineTo(px + 2.4, H); g.lineTo(px - 2.4, H); g.fill();
    g.fillStyle = T('#3f9a55'); [[-3, -9, 2.8], [2.2, -11, 3.2], [0, -7, 3]].forEach(p => { g.beginPath(); g.ellipse(px + p[0], H + p[1], p[2], p[2] * 1.5, p[0] * 0.2, 0, 7); g.fill(); });
  },
  /* 1 blinds */ (g, W, H, r, N, T) => {
    const bh = H * (0.5 + r() * 0.2);
    g.fillStyle = T('#e8dcc2'); g.fillRect(0, 0, W, bh);
    for (let y = 0; y < bh; y += 2.7) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y + 1.8, W, 0.9); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y, W, 0.6); }
    g.fillStyle = T('#b9ab8e'); g.fillRect(0, bh, W, 1.8);
    g.strokeStyle = 'rgba(70,56,40,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(W * 0.86, 0); g.lineTo(W * 0.86, bh + 6); g.stroke();
    g.fillStyle = 'rgba(70,56,40,.9)'; g.fillRect(W * 0.86 - 0.8, bh + 5, 1.6, 2.4);
  },
  /* 2 shelves */ (g, W, H, r, N, T) => {
    [0.38, 0.72].forEach((fy, si) => {
      const y = H * fy; g.fillStyle = T('#7a5232'); g.fillRect(W * 0.08, y, W * 0.84, 1.8);
      let x = W * 0.11;
      while (x < W * 0.86) {
        const bw = 1.6 + r() * 2.2, bh = 4 + r() * 5.5;
        if (r() < 0.14) { x += 3 + r() * 3; continue; }
        g.fillStyle = T(W_BOOKS[Math.floor(r() * W_BOOKS.length)]); g.fillRect(x, y - bh, bw, bh);
        g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x, y - bh, 0.6, bh);
        x += bw + 0.3;
      }
      if (si === 1) { g.fillStyle = T('#d9c9a6'); g.beginPath(); g.arc(W * 0.78, y - 3, 2.8, 0, 7); g.fill(); }
    });
    const lx = W * 0.82, ly = H * 0.96;
    g.fillStyle = T('#51402e'); g.fillRect(lx - 0.8, ly - 9, 1.6, 9);
    g.fillStyle = N ? '#fff0c0' : '#8c8a7a'; g.beginPath(); g.moveTo(lx - 4.5, ly - 9); g.lineTo(lx + 4.5, ly - 9); g.lineTo(lx + 2.8, ly - 14); g.lineTo(lx - 2.8, ly - 14); g.fill();
    if (N) wGlow(g, lx, ly - 11, 13, '255,226,150', 0.5);
  },
  /* 3 pendant lamp */ (g, W, H, r, N, T) => {
    const lx = W * (0.34 + r() * 0.3);
    g.strokeStyle = 'rgba(40,30,22,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, H * 0.3); g.stroke();
    if (N) wGlow(g, lx, H * 0.4, H * 0.7, '255,238,190', 0.7);
    g.fillStyle = N ? '#fff6d6' : '#6a655b'; g.beginPath(); g.moveTo(lx - 5.5, H * 0.42); g.lineTo(lx + 5.5, H * 0.42); g.lineTo(lx + 2.4, H * 0.3); g.lineTo(lx - 2.4, H * 0.3); g.closePath(); g.fill();
    const fx = lx > W / 2 ? W * 0.1 : W * 0.7;
    g.fillStyle = T('#c9a56a'); g.fillRect(fx, H * 0.34, 8, 10); g.fillStyle = T(W_CURT[Math.floor(r() * W_CURT.length)]); g.fillRect(fx + 1.2, H * 0.34 + 1.2, 5.6, 7.6);
    g.fillStyle = T('#7a4f30'); g.fillRect(W * 0.12, H * 0.84, W * 0.76, 2.2);
    g.fillStyle = T('#e8e2d2'); g.beginPath(); g.moveTo(W * 0.3, H * 0.84); g.lineTo(W * 0.36, H * 0.84); g.lineTo(W * 0.35, H * 0.72); g.lineTo(W * 0.31, H * 0.72); g.fill();
    g.fillStyle = T('#e56f8f'); g.beginPath(); g.arc(W * 0.33, H * 0.7, 2.2, 0, 7); g.fill();
  },
  /* 4 roller shade */ (g, W, H, r, N, T) => {
    const bh = H * (0.4 + r() * 0.35);
    const sg = g.createLinearGradient(0, 0, 0, bh); sg.addColorStop(0, T('#f4ead2')); sg.addColorStop(1, T('#d8cba8'));
    g.fillStyle = sg; g.fillRect(0, 0, W, bh);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, bh - 2, W, 2); g.fillStyle = T('#a89878'); g.fillRect(0, bh, W, 1.4);
    g.fillStyle = 'rgba(70,56,40,.8)'; g.beginPath(); g.arc(W / 2, bh + 4, 1.6, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(W * 0.12, 2, 1.4, bh - 5);
  },
  /* 5 someone at home */ (g, W, H, r, N, T) => {
    const sx = W * (0.3 + r() * 0.4), hr = Math.max(3.2, H * 0.11);
    g.fillStyle = T('#c9a56a'); g.fillRect(W * 0.12, H * 0.16, 7, 9); g.fillStyle = T(W_CURT[Math.floor(r() * W_CURT.length)]); g.fillRect(W * 0.12 + 1, H * 0.16 + 1, 5, 7);
    const col = N ? '#4a2c1a' : '#262a33';
    g.fillStyle = col; g.beginPath(); g.ellipse(sx, H * 1.02, hr * 2.1, hr * 1.7, 0, Math.PI, 0); g.fill();
    g.fillRect(sx - hr * 0.45, H * 0.62, hr * 0.9, hr * 1.1);
    g.beginPath(); g.arc(sx, H * 0.55, hr, 0, 7); g.fill();
    g.fillStyle = N ? '#2e1a10' : '#171a20'; g.beginPath(); g.arc(sx, H * 0.55 - hr * 0.2, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    if (N) { g.fillStyle = 'rgba(255,214,150,.45)'; g.fillRect(sx + hr * 0.6, H * 0.52, 0.9, hr * 0.8); }
  },
  /* 6 plants */ (g, W, H, r, N, T) => {
    const hx = W * (0.2 + r() * 0.15);
    g.strokeStyle = 'rgba(40,30,22,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(hx, 0); g.lineTo(hx, H * 0.2); g.stroke();
    g.fillStyle = T('#b8683f'); g.beginPath(); g.moveTo(hx - 4, H * 0.2); g.lineTo(hx + 4, H * 0.2); g.lineTo(hx + 2.8, H * 0.2 + 5); g.lineTo(hx - 2.8, H * 0.2 + 5); g.fill();
    g.strokeStyle = T('#3f9a55'); g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(hx + (i - 2.5) * 1.4, H * 0.2 + 3); g.quadraticCurveTo(hx + (i - 2.5) * 3, H * 0.4, hx + (i - 2.5) * 2.2, H * (0.45 + r() * 0.25)); g.stroke(); }
    g.fillStyle = T('#7a5232'); g.fillRect(W * 0.52, H * 0.62, W * 0.4, 1.8);
    [0.58, 0.76].forEach(f => {
      g.fillStyle = T('#c9753f'); g.fillRect(W * f - 2.5, H * 0.62 - 5, 5, 5);
      g.fillStyle = T('#3f9a55'); g.beginPath(); g.ellipse(W * f, H * 0.62 - 8, 3.4, 3.8, 0, 0, 7); g.fill();
    });
  },
  /* 7 television room */ (g, W, H, r, N, T) => {
    const tx = W * 0.5, tw = W * 0.38, ty = H * 0.34, th = H * 0.28;
    if (N) { g.fillStyle = 'rgba(30,50,110,.55)'; g.fillRect(0, 0, W, H); wGlow(g, tx + tw / 2, ty + th / 2, W * 0.7, '120,170,255', 0.55); }
    const sg = g.createLinearGradient(tx, ty, tx + tw, ty + th);
    if (N) { sg.addColorStop(0, '#cfe4ff'); sg.addColorStop(0.5, '#7fb2ff'); sg.addColorStop(1, '#c6d8ff'); } else { sg.addColorStop(0, '#20242b'); sg.addColorStop(1, '#101318'); }
    g.fillStyle = '#14171d'; g.fillRect(tx - 1, ty - 1, tw + 2, th + 2); g.fillStyle = sg; g.fillRect(tx, ty, tw, th);
    g.fillStyle = N ? '#2a1a14' : '#3a2c22'; g.fillRect(tx + tw * 0.2, ty + th + 1, tw * 0.6, 2.4);
    g.fillStyle = N ? '#3a2430' : '#4a3a3a'; rr(g, W * 0.06, H * 0.64, W * 0.4, H * 0.4, 3); g.fill();
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(W * 0.08, H * 0.66, W * 0.36, 1.2);
  },
  /* 8 cafe */ (g, W, H, r, N, T) => {
    for (let i = 0; i < 4; i++) {
      const lx = W * (0.14 + i * 0.24);
      g.strokeStyle = 'rgba(40,30,22,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, H * 0.2); g.stroke();
      if (N) wGlow(g, lx, H * 0.26, H * 0.45, '255,226,150', 0.55);
      g.fillStyle = N ? '#fff2c6' : '#77705f'; g.beginPath(); g.moveTo(lx - 4.5, H * 0.28); g.lineTo(lx + 4.5, H * 0.28); g.lineTo(lx + 2.2, H * 0.2); g.lineTo(lx - 2.2, H * 0.2); g.fill();
    }
    g.fillStyle = T('#2d3a32'); g.fillRect(W * 0.12, H * 0.3, W * 0.3, H * 0.2);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.8; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(W * 0.15, H * (0.35 + i * 0.05)); g.lineTo(W * (0.22 + r() * 0.16), H * (0.35 + i * 0.05)); g.stroke(); }
    g.fillStyle = T('#8a5a36'); g.fillRect(0, H * 0.74, W, H * 0.07); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, H * 0.74, W, 1.4);
    g.fillStyle = T('#5a3a24'); g.fillRect(0, H * 0.81, W, H * 0.19);
    for (let i = 0; i < 5; i++) { const sx = W * (0.1 + i * 0.19); g.fillStyle = T('#3a2a22'); g.beginPath(); g.ellipse(sx, H * 0.88, 3.2, 1.4, 0, 0, 7); g.fill(); g.fillRect(sx - 0.6, H * 0.88, 1.2, H * 0.1); }
  },
  /* 9 office */ (g, W, H, r, N, T) => {
    for (let i = 0; i < 3; i++) { g.fillStyle = N ? 'rgba(255,255,240,.85)' : 'rgba(255,255,255,.2)'; g.fillRect(W * (0.1 + i * 0.31), 1, W * 0.2, 2.4); }
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(W * 0.42, H * 0.2, 1.4, H * 0.8);
    for (let i = 0; i < 3; i++) {
      const dx = W * (0.07 + i * 0.32);
      g.fillStyle = T('#7a6a56'); g.fillRect(dx, H * 0.7, W * 0.24, 2);
      g.fillStyle = T('#4a4238'); g.fillRect(dx + 2, H * 0.72, 1.6, H * 0.28); g.fillRect(dx + W * 0.24 - 4, H * 0.72, 1.6, H * 0.28);
      g.fillStyle = N ? '#a9d4ff' : '#1c2128'; g.fillRect(dx + W * 0.06, H * 0.5, W * 0.1, H * 0.18);
      if (N) wGlow(g, dx + W * 0.11, H * 0.6, 9, '150,200,255', 0.35);
    }
    g.fillStyle = T('#b8683f'); g.fillRect(W * 0.92, H * 0.78, 5, 6); g.fillStyle = T('#3f9a55'); g.beginPath(); g.ellipse(W * 0.92 + 2.5, H * 0.74, 5, 6, 0, 0, 7); g.fill();
  },
  /* 10 lobby */ (g, W, H, r, N, T) => {
    for (let i = 0; i < 3; i++) { const lx = W * (0.25 + i * 0.25); wGlow(g, lx, H * 0.12, N ? H * 0.5 : 1, '255,232,170', 0.55); g.fillStyle = N ? '#fff4d0' : '#7a735f'; g.beginPath(); g.arc(lx, H * 0.1, 2.4, 0, 7); g.fill(); }
    g.fillStyle = T(W_CURT[Math.floor(r() * W_CURT.length)]); g.fillRect(W * 0.34, H * 0.26, W * 0.32, H * 0.24); g.strokeStyle = T('#c9a56a'); g.lineWidth = 1.4; g.strokeRect(W * 0.34, H * 0.26, W * 0.32, H * 0.24);
    g.fillStyle = T('#6b4a2c'); rr(g, W * 0.3, H * 0.72, W * 0.4, H * 0.14, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(W * 0.3, H * 0.72, W * 0.4, 1.4);
    [0.07, 0.86].forEach(f => { g.fillStyle = T('#8a5a36'); g.fillRect(W * f, H * 0.82, W * 0.07, H * 0.16); g.fillStyle = T('#3f9a55'); g.beginPath(); g.ellipse(W * f + W * 0.035, H * 0.6, W * 0.05, H * 0.24, 0, 0, 7); g.fill(); g.fillStyle = T('#5fba72'); g.beginPath(); g.ellipse(W * f + W * 0.02, H * 0.5, W * 0.025, H * 0.14, 0.3, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, H * 0.9, W, H * 0.1);
  }
];
function wPaintRoom(g, w, h, v, night, seed) {
  const IM = W_WIN_IM, W = w + IM * 2, H = h + IM * 2, N = night;
  const r = mulberry32(seed * 977 + v * 31 + 5);
  const c1 = W_CURT[Math.floor(r() * W_CURT.length)];
  const T = col => N ? col : mix(col, '#39414d', 0.42);
  const rg = g.createLinearGradient(0, 0, 0, H);
  if (N) { rg.addColorStop(0, '#ffeab4'); rg.addColorStop(0.55, '#ffd48a'); rg.addColorStop(1, '#e9a35f'); }
  else { rg.addColorStop(0, '#6d6657'); rg.addColorStop(0.6, '#8a8272'); rg.addColorStop(1, '#6a6254'); }
  if (v === 7 && N) { rg.addColorStop(0, '#16224a'); rg.addColorStop(1, '#2a3f7a'); }
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  if (!(v === 7 && N)) { g.fillStyle = N ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)'; g.fillRect(0, 0, W, H * 0.07); }
  const fl = g.createLinearGradient(0, H * 0.86, 0, H); fl.addColorStop(0, N ? 'rgba(120,70,30,.0)' : 'rgba(0,0,0,0)'); fl.addColorStop(1, N ? 'rgba(120,70,30,.45)' : 'rgba(0,0,0,.3)');
  g.fillStyle = fl; g.fillRect(0, H * 0.86, W, H * 0.14);
  W_ROOMS[v](g, W, H, r, N, T, c1);
  // the room recedes: darker corners
  const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(20,10,0,0)'); vg.addColorStop(1, N ? 'rgba(90,40,10,.38)' : 'rgba(10,14,24,.34)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
function wPaintGlint(g, w, h) {
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
  const sl = h * 0.34;
  const lg = g.createLinearGradient(w * 0.16, 0, w * 0.64, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.beginPath(); g.moveTo(w * 0.06, h); g.lineTo(w * 0.36, 0); g.lineTo(w * 0.58, 0); g.lineTo(w * 0.28, h); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(w * 0.64, h); g.lineTo(w * 0.82, 0); g.lineTo(w * 0.9, 0); g.lineTo(w * 0.72, h); g.closePath(); g.fill();
  const hg = g.createLinearGradient(0, 0, 0, sl); hg.addColorStop(0, 'rgba(255,255,255,.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hg; g.fillRect(0, 0, w, sl);
  g.restore();
}
/* the frame: casing, reveal, sill, lintel, drip streaks. The glass area stays see-through (except soft reveal shadows). */
function wPaintWinFrame(g, w, h, sty, seed) {
  const P = W_WIN_P, x = P, y = P, ct = sty === 2 ? 1.8 : sty === 3 ? 3.2 : 2.5;
  const r = mulberry32(seed * 7 + 3);
  // soft occlusion on the wall around the opening
  for (let i = 3; i >= 1; i--) { g.fillStyle = 'rgba(14,18,34,' + (0.05 * (4 - i)).toFixed(3) + ')'; rr(g, x - ct - i * 1.3, y - ct - i * 1.3, w + 2 * ct + i * 2.6, h + 2 * ct + i * 2.9, 2 + i); g.fill(); }
  if (sty === 1) {
    // lintel with a keystone
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - ct - 3, y - ct - 4.2, w + 2 * ct + 6, 5);
    g.fillStyle = '#dbd1ba'; g.fillRect(x - ct - 3.5, y - ct - 5, w + 2 * ct + 7, 4.4);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - ct - 3.5, y - ct - 5, w + 2 * ct + 7, 1);
    g.fillStyle = 'rgba(120,100,70,.35)'; g.fillRect(x - ct - 3.5, y - ct - 1.4, w + 2 * ct + 7, 0.9);
    g.fillStyle = '#e9e0c9'; g.beginPath(); g.moveTo(x + w / 2 - 3.6, y - ct - 5); g.lineTo(x + w / 2 + 3.6, y - ct - 5); g.lineTo(x + w / 2 + 2.6, y - ct - 0.6); g.lineTo(x + w / 2 - 2.6, y - ct - 0.6); g.fill();
    wFadeV(g, x - ct - 2, y - ct - 0.6, w + 2 * ct + 4, 4, 0.22, 0, '10,10,24');
  } else if (sty === 0) {
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x - ct - 1, y - ct - 1.4, w + 2 * ct + 2, 1.2);
  }
  // casing ring
  g.fillStyle = sty === 2 ? '#26323f' : '#1d2a36';
  g.beginPath(); g.rect(x - ct, y - ct, w + 2 * ct, h + 2 * ct); g.rect(x, y, w, h); g.fill('evenodd');
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x - ct, y - ct, w + 2 * ct, 0.9); g.fillRect(x - ct, y - ct, 0.9, h + 2 * ct);
  g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x - ct, y + h + ct - 0.9, w + 2 * ct, 0.9); g.fillRect(x + w + ct - 0.9, y - ct, 0.9, h + 2 * ct);
  // reveal: sun is upper-left, so the top and left inner faces sit in shade
  let q = g.createLinearGradient(0, y, 0, y + 9); q.addColorStop(0, 'rgba(8,14,30,.4)'); q.addColorStop(1, 'rgba(8,14,30,0)');
  g.fillStyle = q; g.fillRect(x, y, w, 9);
  q = g.createLinearGradient(x, 0, x + 6, 0); q.addColorStop(0, 'rgba(8,14,30,.26)'); q.addColorStop(1, 'rgba(8,14,30,0)');
  g.fillStyle = q; g.fillRect(x, y, 6, h);
  g.fillStyle = 'rgba(255,255,255,.26)'; g.fillRect(x + w - 1, y + 1, 1, h - 1); g.fillRect(x + 1, y + h - 1, w - 1, 1);
  // muntins
  if (w >= 24) {
    g.fillStyle = 'rgba(14,24,36,.78)'; g.fillRect(x + w / 2 - 0.9, y, 1.8, h);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + w / 2 - 0.9, y, 0.7, h);
  }
  if (h >= 30 && w < 60) {
    g.fillStyle = 'rgba(14,24,36,.78)'; g.fillRect(x, y + h * 0.48, w, 1.7);
    g.fillStyle = 'rgba(255,255,255,.26)'; g.fillRect(x, y + h * 0.48, w, 0.7);
  }
  // sill, drip edge and weathering
  const sw = w + 2 * ct + (sty === 2 ? 3 : 7), sx = x + w / 2 - sw / 2, sy = y + h + ct;
  if (sty !== 2) {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(sx + 0.5, sy + 2.6, sw - 1, 2.2);
    g.fillStyle = sty === 3 ? '#9a9486' : '#d8cfb8'; g.fillRect(sx, sy, sw, 3);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(sx, sy, sw, 1);
    g.fillStyle = 'rgba(70,56,36,.38)'; g.fillRect(sx, sy + 2.2, sw, 0.8);
    wFadeV(g, sx + 1, sy + 3.6, sw - 2, 5, 0.3, 0, '10,10,24');
  } else {
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(sx, sy, sw, 1.2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(sx, sy + 1.2, sw, 1.6);
    wFadeV(g, sx, sy + 2.8, sw, 4, 0.26, 0, '10,10,24');
  }
  const ns = 1 + Math.floor(r() * 2.2);
  for (let i = 0; i < ns; i++) {
    const sx2 = x + 2 + r() * (w - 4), len = 8 + r() * 9, wd = 1.4 + r() * 2;
    q = g.createLinearGradient(0, sy + 3, 0, sy + 3 + len); q.addColorStop(0, 'rgba(40,34,28,.18)'); q.addColorStop(1, 'rgba(40,34,28,0)');
    g.fillStyle = q; g.fillRect(sx2, sy + 3, wd, len);
  }
}
/* window kit: everything a window needs, built once per size */
const W_WINSET = new Map(); let W_WINSET_RES = 0;
function wWinSet(w, h, sty, v) {
  const res = wres();
  if (res !== W_WINSET_RES || W_WINSET.size > 700) { W_WINSET.clear(); W_WINSET_RES = res; }
  const qw = Math.round(w), qh = Math.round(h), key = ((qw * 512 + qh) * 4 + sty) * 16 + v;
  let s = W_WINSET.get(key); if (s) return s;
  const P = W_WIN_P, IM = W_WIN_IM;
  s = { qw, qh, ni: null, fr: null };
  s.gl = wspr('wg' + qw + 'x' + qh, qw, qh, g => wPaintGlint(g, qw, qh));
  s.di = wspr('wid' + qw + 'x' + qh + 'v' + v, qw + IM * 2, qh + IM * 2, g => wPaintRoom(g, qw, qh, v, false, qw * 13 + qh));
  W_WINSET.set(key, s); return s;
}
function wWinNight(s, v) {
  if (!s.ni) s.ni = wspr('win' + s.qw + 'x' + s.qh + 'v' + v, s.qw + W_WIN_IM * 2, s.qh + W_WIN_IM * 2, g => wPaintRoom(g, s.qw, s.qh, v, true, s.qw * 13 + s.qh));
  return s.ni;
}
/* sky-coloured glass with a room behind it that slides a little against the frame as the camera moves */
function wGlassPane(c, x, y, w, h, lit, v, ws, inside) {
  const nf = FX.nf, on = lit && nf > 0.05, ni = nf > 0.05;
  const px = clamp((CAM.x + CAM.vw * 0.5 - (x + w * 0.5)) * 0.011, -2.8, 2.8) * (REDUCED ? 0 : 1), py = clamp((CAM.y + CAM.vh * 0.5 - (y + h * 0.5)) * 0.007, -1.8, 1.8) * (REDUCED ? 0 : 1);
  const sw = ws.qw, sh = ws.qh, res = wres(), IM = W_WIN_IM;
  c.fillStyle = FX.glassA; c.fillRect(x, y, w, h);
  c.fillStyle = FX.glassB; c.fillRect(x, y + h * 0.5, w, h * 0.5);
  const mixA = on ? clamp((nf - 0.05) * 3.4, 0, 1) : 0;
  const dayA = on ? (1 - mixA) * 0.3 : ni ? 0.26 : 0.3;
  if (dayA > 0.02) { c.globalAlpha = dayA; c.drawImage(ws.di.cv, (IM + px) * res, (IM + py) * res, sw * res, sh * res, x, y, w, h); }
  if (mixA > 0.01) {
    const n = wWinNight(ws, v);
    c.globalAlpha = mixA; c.drawImage(n.cv, (IM + px) * res, (IM + py) * res, sw * res, sh * res, x, y, w, h);
    if (v === 7 && !REDUCED) { c.fillStyle = 'rgba(160,200,255,' + (0.1 + 0.1 * Math.sin(FX.time * 9 + x)).toFixed(3) + ')'; c.fillRect(x + w * 0.5, y + h * 0.34, w * 0.38, h * 0.28); }
  }
  c.globalAlpha = 1;
  if (inside) inside(c, x, y, w, h, on, px, py);
  const ga = (+FX.glint) * (1 - mixA);
  if (ga > 0.01) { c.globalAlpha = ga; c.drawImage(ws.gl.cv, x, y, w, h); c.globalAlpha = 1; }
}

/* ---------- doors ---------- */
function wDoorGeom(w, h, glass) {
  const x = -w / 2, y = -h;
  if (glass) return [[x + 3, y + 4, w / 2 - 4.5, h - 12], [1.5, y + 4, w / 2 - 4.5, h - 12]];
  return [[x + 4, y + 5, w / 2 - 6, h * 0.42], [2, y + 5, w / 2 - 6, h * 0.42]];
}
function wPaintDoor(g, w, h, col, glass, ox, oy) {
  // local origin (ox, oy) is the door's bottom centre
  g.save(); g.translate(ox, oy);
  const x = -w / 2, y = -h;
  // lintel / header and casing
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 7, y - 8, w + 14, 6);
  g.fillStyle = '#e6dcc6'; g.fillRect(x - 8, y - 9, w + 16, 6);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 8, y - 9, w + 16, 1.2);
  g.fillStyle = 'rgba(90,70,40,.32)'; g.fillRect(x - 8, y - 4.4, w + 16, 1);
  g.fillStyle = '#f4ecda'; g.beginPath(); g.moveTo(-5, y - 9); g.lineTo(5, y - 9); g.lineTo(3.6, y - 3.6); g.lineTo(-3.6, y - 3.6); g.fill();
  wFadeV(g, x - 5, y - 3, w + 10, 5, 0.28, 0, '10,10,24');
  g.fillStyle = '#1c130e'; g.fillRect(x - 3.5, y - 3.5, w + 7, h + 3.5);
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x - 3.5, y - 3.5, w + 7, 0.9); g.fillRect(x - 3.5, y - 3.5, 0.9, h + 3.5);
  // leaves
  const lg = g.createLinearGradient(x, 0, x + w, 0); lg.addColorStop(0, shade(col, 0.16)); lg.addColorStop(0.5, col); lg.addColorStop(1, shade(col, -0.2));
  g.fillStyle = lg; g.fillRect(x, y, w, h);
  const geo = wDoorGeom(w, h, glass);
  g.globalCompositeOperation = 'destination-out'; geo.forEach(p => g.fillRect(p[0], p[1], p[2], p[3])); g.globalCompositeOperation = 'source-over';
  if (glass) {
    // aluminium stiles around each pane and a push bar
    geo.forEach(p => {
      g.fillStyle = 'rgba(210,220,228,.9)'; g.beginPath(); g.rect(p[0] - 2.5, p[1] - 2.5, p[2] + 5, p[3] + 5); g.rect(p[0], p[1], p[2], p[3]); g.fill('evenodd');
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(p[0] - 2.5, p[1] - 2.5, p[2] + 5, 0.8);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(p[0] - 2.5, p[1] + p[3] + 1.7, p[2] + 5, 0.8);
      const q = g.createLinearGradient(p[0], 0, p[0] + p[2], 0); q.addColorStop(0, 'rgba(8,14,30,.3)'); q.addColorStop(0.3, 'rgba(8,14,30,0)');
      g.fillStyle = q; g.fillRect(p[0], p[1], p[2], p[3]);
      wFadeV(g, p[0], p[1], p[2], 7, 0.4, 0, '8,14,30');
    });
    g.fillStyle = '#c9d2d8'; g.fillRect(x + 4, -h * 0.44, w / 2 - 7, 1.6); g.fillRect(2.5, -h * 0.44, w / 2 - 7, 1.6);
    g.fillStyle = '#3a4650'; g.fillRect(x + 4, -h * 0.44 + 1.6, w / 2 - 7, 0.7); g.fillRect(2.5, -h * 0.44 + 1.6, w / 2 - 7, 0.7);
  } else {
    // timber leaves: framed upper lights and raised lower panels
    geo.forEach(p => {
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.rect(p[0] - 1.6, p[1] - 1.6, p[2] + 3.2, p[3] + 3.2); g.rect(p[0], p[1], p[2], p[3]); g.fill('evenodd');
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(p[0] - 1.6, p[1] - 1.6, p[2] + 3.2, 0.7);
      wFadeV(g, p[0], p[1], p[2], 6, 0.45, 0, '8,14,30');
    });
    [x + 4, 2].forEach(px => {
      const pw = w / 2 - 6, py = y + h * 0.58, ph = h * 0.34;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px - 0.8, py - 0.8, pw + 1.6, ph + 1.6);
      g.fillStyle = shade(col, -0.06); g.fillRect(px, py, pw, ph);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(px, py, pw, 0.9); g.fillRect(px, py, 0.9, ph);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px, py + ph - 0.9, pw, 0.9); g.fillRect(px + pw - 0.9, py, 0.9, ph);
    });
    g.fillStyle = '#d4a53a'; g.fillRect(-w / 2 + 6, y + h * 0.5 - 2, 6, 1.6);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-w / 2 + 6, y + h * 0.5 - 0.7, 6, 0.8);
  }
  // seam, hinges and handles
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-0.8, y, 1.6, h); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(0.8, y, 0.6, h);
  g.fillStyle = '#e9c46a'; g.fillRect(-5, -h * 0.46, 2, 7); g.fillRect(3, -h * 0.46, 2, 7);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-5, -h * 0.46, 0.7, 7); g.fillRect(3, -h * 0.46, 0.7, 7);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-3.4, -h * 0.46 + 1, 0.8, 6); g.fillRect(4.6, -h * 0.46 + 1, 0.8, 6);
  // kick plates
  const kg = g.createLinearGradient(0, -7, 0, 0); kg.addColorStop(0, '#d8dde0'); kg.addColorStop(1, '#8a9298');
  g.fillStyle = kg; g.fillRect(x + 2, -7, w - 4, 6.4); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 2, -7, w - 4, 0.8);
  [x + 3.4, x + w - 4.4].forEach(sx => { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(sx, -5.4, 1, 1); g.fillRect(sx, -2.6, 1, 1); });
  // doorstep and mat
  g.fillStyle = 'rgba(8,12,24,.28)'; g.fillRect(x - 9, 4, w + 18, 4);
  g.fillStyle = '#b9b3a6'; g.fillRect(x - 7, -2, w + 14, 5);
  g.fillStyle = '#d6d0c2'; g.fillRect(x - 7, -2, w + 14, 1.8);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x - 7, -2, w + 14, 0.8);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 7, 2.2, w + 14, 0.8);
  g.fillStyle = '#9a948a'; g.fillRect(x - 11, 3, w + 22, 2.6); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 11, 3, w + 22, 0.9);
  const mw = w * 0.62;
  g.fillStyle = glass ? '#2c3a48' : '#6a3f2a'; rr(g, -mw / 2, 6, mw, 4.4, 1); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) g.fillRect(-mw / 2 + 2 + i * (mw - 4) / 6, 7, 0.8, 2.4);
  g.restore();
}
const W_DOOR_OX = 16, W_DOOR_OY = 36;
function wDoorSprite(w, h, col, glass) {
  return wspr('dr' + w + 'x' + h + col + (glass ? 'g' : 'w'), w + W_DOOR_OX * 2, h + W_DOOR_OY + 14, g => wPaintDoor(g, w, h, col, glass, w / 2 + W_DOOR_OX, h + W_DOOR_OY));
}

/* ---------- awnings ---------- */
function wPaintAwning(g, w, h, colA, colB, seed) {
  const n = Math.max(4, Math.round(w / 22)), sw = w / n, r = mulberry32(seed + 11);
  const top = 3, vy = h * 0.56;
  // the cast shadow on the facade below
  wFadeV(g, 4, h + 4, w - 8, 16, 0.3, 0, '12,10,26');
  for (let i = 0; i < n; i++) {
    const x0 = i * sw, col = i % 2 ? colB : colA;
    // slanted top, then the hanging valance
    const sg = g.createLinearGradient(0, top, 0, vy); sg.addColorStop(0, shade(col, 0.2)); sg.addColorStop(1, shade(col, -0.04));
    g.fillStyle = sg; g.fillRect(x0, top, sw, vy - top);
    const vg = g.createLinearGradient(0, vy, 0, h + sw * 0.5); vg.addColorStop(0, shade(col, -0.16)); vg.addColorStop(0.7, shade(col, -0.02)); vg.addColorStop(1, shade(col, -0.2));
    g.fillStyle = vg; g.beginPath(); g.moveTo(x0, vy); g.lineTo(x0 + sw, vy); g.lineTo(x0 + sw, h - 3); g.arc(x0 + sw / 2, h - 3, sw / 2, 0, Math.PI); g.closePath(); g.fill();
    // fabric creases
    g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = 0.9;
    for (let k = 0; k < 2; k++) { const cx = x0 + sw * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(cx, top + 2); g.quadraticCurveTo(cx + (r() - 0.5) * 3, vy * 0.6, cx + (r() - 0.5) * 2, h - 2); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0 + sw * 0.22, top + 2); g.lineTo(x0 + sw * 0.24, h - 5); g.stroke();
    // binding and hem stitches along the scallop
    g.strokeStyle = shade(col, -0.34); g.lineWidth = 1.5; g.beginPath(); g.arc(x0 + sw / 2, h - 3, sw / 2 - 0.7, 0.04, Math.PI - 0.04); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.7; g.setLineDash([1.6, 1.8]); g.beginPath(); g.arc(x0 + sw / 2, h - 3, sw / 2 - 3, 0.1, Math.PI - 0.1); g.stroke(); g.setLineDash([]);
  }
  // seams between stripes
  g.fillStyle = 'rgba(0,0,0,.16)'; for (let i = 1; i < n; i++) g.fillRect(i * sw - 0.4, top, 0.8, h - 2 - top);
  // roller bar, fold line and light from the upper left
  wFadeH(g, 0, top, w, h - top, 0.1, -0.0, '255,255,255');
  wFadeH(g, w * 0.55, top, w * 0.45, h, 0, 0.12, '0,0,0');
  g.fillStyle = '#3a3f46'; g.fillRect(0, 0, w, 3.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 0, w, 1);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, vy - 0.6, w, 1.4); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, vy + 0.8, w, 0.8);
  g.fillStyle = '#2b3138'; g.fillRect(-1.5, 0, 3, vy + 2); g.fillRect(w - 1.5, 0, 3, vy + 2);
}

/* ---------- lettering ---------- */
let W_SIGN_CTX = null;
function wSignSprite(text, size, col) {
  const font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif';
  const key = 'sg' + W_FONT_GEN + '|' + size + '|' + col + '|' + text;
  const res = wres(), k = key + '|' + res;
  let s = W_SPR.m.get(k); if (s) return s;
  if (!W_SIGN_CTX) W_SIGN_CTX = document.createElement('canvas').getContext('2d');
  W_SIGN_CTX.font = font; const tw = W_SIGN_CTX.measureText(text).width;
  const rgb = hexRgb(col), c2 = (rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11) < 125 ? shade(col, 0.42) : col;
  const W = Math.ceil(tw + 16), H = Math.ceil(size * 1.5 + 10);
  s = wspr(key, W, H, g => {
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const cx = W / 2, cy = H / 2;
    g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = Math.max(2, size * 0.14); g.strokeText(text, cx + 0.5, cy + 1.2);
    g.fillStyle = shade(c2, -0.62); g.globalAlpha = 0.7; g.fillText(text, cx + 0.9, cy + 1.7); g.fillText(text, cx + 0.45, cy + 0.85); g.globalAlpha = 1;
    const lg = g.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5); lg.addColorStop(0, shade(c2, 0.28)); lg.addColorStop(0.5, c2); lg.addColorStop(1, shade(c2, -0.16));
    g.fillStyle = lg; g.fillText(text, cx, cy);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, cy - size * 0.52, W, size * 0.16); g.globalCompositeOperation = 'source-over';
  });
  s.tw = tw; return s;
}

/* a cat sitting on a window sill, seen from behind */
function wPaintCat(g, col) {
  g.fillStyle = col; g.beginPath(); g.ellipse(7, 9, 4.6, 4.4, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(7, 4.2, 3, 0, 7); g.fill(); g.beginPath(); g.moveTo(4.4, 2.8); g.lineTo(4.6, -0.4); g.lineTo(6.6, 1.4); g.fill(); g.beginPath(); g.moveTo(9.6, 2.8); g.lineTo(9.4, -0.4); g.lineTo(7.4, 1.4); g.fill();
  g.strokeStyle = col; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(11, 11); g.quadraticCurveTo(15, 11, 14, 6); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(5.4, 7.4, 1.2, 2.6, 0.3, 0, 7); g.fill();
}
/* ---------- wall lantern ---------- */
function wPaintSconce(g, on) {
  // origin at the lamp's mount point (x, y of the original call) = (16, 16)
  g.save(); g.translate(16, 16);
  g.fillStyle = 'rgba(8,12,24,.28)'; g.fillRect(-4, -2, 8, 10);
  g.fillStyle = '#2b3138'; g.fillRect(-1.5, -9, 3, 5); g.fillRect(-4.2, -4.4, 8.4, 2.4);
  g.fillStyle = '#3a424b'; g.fillRect(-4.2, -4.4, 8.4, 0.8);
  const gl = g.createLinearGradient(-2.5, 0, 2.5, 0);
  if (on) { gl.addColorStop(0, '#fff6d4'); gl.addColorStop(0.5, '#fff0c0'); gl.addColorStop(1, '#ffd98a'); } else { gl.addColorStop(0, '#eef3f5'); gl.addColorStop(0.5, '#d9e2e6'); gl.addColorStop(1, '#a9b6bc'); }
  g.fillStyle = gl; g.fillRect(-2.5, -2, 5, 7);
  g.fillStyle = '#2b3138'; g.fillRect(-0.4, -2, 0.8, 7); g.fillRect(-3.4, 5, 6.8, 1.8);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-4.2, 5, 8.4, 0.6);
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-2.5, 3.6, 5, 1.4);
  g.restore();
}

/* ---------- window boxes ---------- */
function wPaintFlowerBox(g, w, seed, se) {
  const r = mulberry32(seed * 131 + w), oy = 18;
  g.fillStyle = 'rgba(8,10,22,.3)'; g.fillRect(2, oy + 6.5, w + 2, 2.4); wFadeV(g, 3, oy + 6, w, 5, 0.22, 0, '10,10,24');
  const bg = g.createLinearGradient(0, oy, 0, oy + 7); bg.addColorStop(0, '#8a5a3a'); bg.addColorStop(1, '#58361f');
  g.fillStyle = bg; g.fillRect(2, oy, w, 6.6);
  g.fillStyle = 'rgba(0,0,0,.26)'; for (let x = 8; x < w - 2; x += 9) g.fillRect(x, oy + 0.6, 0.9, 5.4);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(2, oy, w, 1); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(2, oy + 5.8, w, 0.8);
  g.fillStyle = '#d8b472'; g.fillRect(2, oy + 2.6, w, 0.6); g.fillStyle = '#2a1c12'; g.fillRect(3, oy - 0.4, w - 2, 1.4);
  const greens = se === 'winter' ? ['#2d6a4a', '#3f8a5c', '#235a40'] : se === 'autumn' ? ['#6a8a3a', '#8a9a3c', '#566e2c'] : ['#3f9a55', '#58b468', '#2f7d4a'];
  const n = Math.floor(w / 3.2);
  for (let i = 0; i < n; i++) {
    const x = 3 + i * (w - 3) / n + r() * 1.6, hh = 3.4 + r() * 3.8;
    g.fillStyle = greens[Math.floor(r() * 3)]; g.beginPath(); g.ellipse(x, oy - 1.4, 2.4, hh * 0.9, (r() - 0.5) * 0.7, 0, 7); g.fill();
  }
  if (se === 'winter') {
    g.fillStyle = '#f6fafd'; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(3 + i * (w - 3) / n + 1, oy - 4.6 - r() * 2, 2.2, 1, 0, 0, 7); g.fill(); }
    g.fillRect(2, oy - 0.8, w, 1.2); return;
  }
  const pal = se === 'autumn' ? ['#e8883a', '#f2c14a', '#c0502a', '#f6e0a0'] : se === 'spring' ? ['#ffc3d4', '#ffffff', '#ffe08a', '#c9a8ff'] : ['#ff6f91', '#ffd166', '#f8f9fa', '#c77dff', '#ff9a4d', '#e63946'];
  const cnt = Math.max(3, Math.floor(w / 4.6));
  for (let i = 0; i < cnt; i++) {
    const x = 4 + (i + 0.5) * (w - 5) / cnt + (r() - 0.5) * 1.6, y = oy - 3.6 - r() * 5.2, col = pal[Math.floor(r() * pal.length)], pr = 1.15 + r() * 0.5;
    g.fillStyle = col;
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + r(); g.beginPath(); g.arc(x + Math.cos(a) * pr, y + Math.sin(a) * pr, pr * 0.78, 0, 7); g.fill(); }
    g.fillStyle = shade(col, -0.12); g.beginPath(); g.arc(x + 0.3, y + 0.3, pr * 0.5, 0, 7); g.fill();
    g.fillStyle = col === '#ffd166' || col === '#ffe08a' || col === '#f2c14a' ? '#c0702a' : '#ffe08a'; g.beginPath(); g.arc(x, y, pr * 0.38, 0, 7); g.fill();
  }
}

/* ---------- roof furniture ---------- */
const W_ROOF_KINDS = 9;
function wPaintRoofProp(g, kind, px, y, r) {
  const metal = '#9aa3aa', dark = '#5d666d', mid = '#7b848b';
  const hi = (x, yy, w, h) => { g.fillStyle = 'rgba(255,255,255,.34)'; g.fillRect(x, yy, w, Math.min(h, 1.6)); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x, yy, 1.6, h); };
  const sh = (x, w) => { g.fillStyle = 'rgba(8,12,28,.28)'; g.fillRect(x, y - 1.5, w, 3); };
  if (kind === 0) {            // air handler with fan grille and louvres
    sh(px - 2, 36);
    const gr = g.createLinearGradient(px, 0, px + 30, 0); gr.addColorStop(0, '#b3bbc1'); gr.addColorStop(1, '#7d868d');
    g.fillStyle = gr; g.fillRect(px, y - 15, 30, 15); hi(px, y - 15, 30, 15);
    g.fillStyle = dark; g.fillRect(px - 1.4, y - 16.4, 32.8, 2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(px - 1.4, y - 16.4, 32.8, 0.8);
    g.fillStyle = '#2a3238'; g.beginPath(); g.arc(px + 10, y - 8, 5.2, 0, 7); g.fill();
    g.strokeStyle = '#59636a'; g.lineWidth = 0.8; for (let k = 1; k < 3; k++) { g.beginPath(); g.arc(px + 10, y - 8, k * 1.7, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(px + 10, y - 13); g.lineTo(px + 10, y - 3); g.moveTo(px + 5, y - 8); g.lineTo(px + 15, y - 8); g.stroke();
    g.fillStyle = dark; for (let k = 0; k < 5; k++) g.fillRect(px + 18, y - 12 + k * 2.4, 9, 1.1);
    g.fillStyle = mid; g.fillRect(px + 30, y - 6, 8, 2); g.fillRect(px + 36, y - 6, 2, 6);
  } else if (kind === 1) {     // vent stack with rain cap
    sh(px - 2, 14);
    const gr = g.createLinearGradient(px, 0, px + 8, 0); gr.addColorStop(0, '#a7b0b6'); gr.addColorStop(1, '#6a737a');
    g.fillStyle = gr; g.fillRect(px, y - 20, 8, 20); hi(px, y - 20, 8, 20);
    g.fillStyle = mid; g.fillRect(px - 1, y - 6, 10, 2);
    g.fillStyle = dark; g.beginPath(); g.moveTo(px - 3.4, y - 20); g.lineTo(px + 4, y - 25); g.lineTo(px + 11.4, y - 20); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(px - 3.4, y - 20); g.lineTo(px + 4, y - 25); g.lineTo(px + 1, y - 20); g.fill();
  } else if (kind === 2) {     // mast aerial
    sh(px - 3, 8);
    g.fillStyle = '#4a545c'; g.fillRect(px, y - 34, 2, 34); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(px, y - 34, 0.8, 34);
    [[-8, -29, 18], [-6, -23, 14], [-5, -17, 12]].forEach(a => { g.fillRect(px + a[0], y + a[1], a[2], 1.4); g.fillRect(px + a[0], y + a[1] - 2, 1.2, 4.6); g.fillRect(px + a[0] + a[2] - 1.2, y + a[1] - 2, 1.2, 4.6); });
    g.strokeStyle = 'rgba(40,46,52,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(px + 1, y - 24); g.lineTo(px - 14, y); g.moveTo(px + 1, y - 24); g.lineTo(px + 16, y); g.stroke();
    g.fillStyle = '#d63b4b'; g.beginPath(); g.arc(px + 1, y - 35, 1.4, 0, 7); g.fill();
  } else if (kind === 3) {     // wooden water tank on stilts
    sh(px - 2, 32);
    g.fillStyle = '#4a3828'; g.fillRect(px + 1, y - 9, 2.4, 9); g.fillRect(px + 21, y - 9, 2.4, 9); g.strokeStyle = '#4a3828'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 3, y - 8); g.lineTo(px + 21, y - 1); g.moveTo(px + 21, y - 8); g.lineTo(px + 3, y - 1); g.stroke();
    const wg = g.createLinearGradient(px, 0, px + 26, 0); wg.addColorStop(0, '#a47a54'); wg.addColorStop(0.45, '#8a6a4c'); wg.addColorStop(1, '#5e4630');
    g.fillStyle = wg; g.beginPath(); g.moveTo(px, y - 10); g.lineTo(px + 26, y - 10); g.lineTo(px + 25, y - 27); g.lineTo(px + 1, y - 27); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 1; k < 6; k++) g.fillRect(px + k * 4.3, y - 27, 0.9, 17);
    g.fillStyle = '#2f3840'; g.fillRect(px, y - 14, 26, 1.6); g.fillRect(px + 0.6, y - 22, 24.8, 1.6);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(px + 1, y - 27, 3, 17);
    g.fillStyle = '#5a4634'; g.beginPath(); g.moveTo(px - 2.4, y - 27); g.lineTo(px + 13, y - 36); g.lineTo(px + 28.4, y - 27); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(px - 2.4, y - 27); g.lineTo(px + 13, y - 36); g.lineTo(px + 8, y - 27); g.fill();
  } else if (kind === 4) {     // satellite dish
    sh(px - 2, 20);
    g.fillStyle = '#6a737a'; g.fillRect(px + 7, y - 7, 3, 7); g.fillRect(px + 3, y - 2, 11, 2);
    g.save(); g.translate(px + 8.5, y - 12); g.rotate(-0.5);
    const dg = g.createRadialGradient(-2, -2, 1, 0, 0, 10); dg.addColorStop(0, '#f4f7f9'); dg.addColorStop(1, '#a5aeb5');
    g.fillStyle = dg; g.beginPath(); g.ellipse(0, 0, 9.5, 6.4, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(60,70,80,.7)'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(0, 0, 9.5, 6.4, 0, 0, 7); g.stroke();
    g.strokeStyle = '#59636a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(0, 0); g.lineTo(9, -7); g.stroke(); g.fillStyle = '#59636a'; g.beginPath(); g.arc(9, -7, 1.4, 0, 7); g.fill();
    g.restore();
  } else if (kind === 5) {     // skylight
    sh(px - 2, 36);
    g.fillStyle = '#5d666d'; g.fillRect(px, y - 5, 32, 5);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(px, y - 5, 32, 1);
    const sg = g.createLinearGradient(px, y - 14, px + 32, y - 5); sg.addColorStop(0, '#d4ecf6'); sg.addColorStop(1, '#7eb6d2');
    g.fillStyle = sg; g.beginPath(); g.moveTo(px + 3, y - 5); g.lineTo(px + 8, y - 14); g.lineTo(px + 24, y - 14); g.lineTo(px + 29, y - 5); g.closePath(); g.fill();
    g.strokeStyle = '#4a545c'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + 3, y - 5); g.lineTo(px + 8, y - 14); g.lineTo(px + 24, y - 14); g.lineTo(px + 29, y - 5); g.moveTo(px + 16, y - 14); g.lineTo(px + 16, y - 5); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(px + 9, y - 13); g.lineTo(px + 13, y - 13); g.lineTo(px + 9, y - 6); g.lineTo(px + 6, y - 6); g.fill();
  } else if (kind === 6) {     // solar panels
    sh(px - 2, 34);
    for (let k = 0; k < 2; k++) {
      const x0 = px + k * 16;
      g.fillStyle = '#3a4650'; g.fillRect(x0 + 6, y - 5, 2, 5);
      const pg = g.createLinearGradient(x0, y - 18, x0 + 14, y - 5); pg.addColorStop(0, '#2a4a7a'); pg.addColorStop(1, '#1a2c52');
      g.fillStyle = pg; g.beginPath(); g.moveTo(x0, y - 7); g.lineTo(x0 + 3, y - 18); g.lineTo(x0 + 17, y - 18); g.lineTo(x0 + 14, y - 7); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(160,190,230,.5)'; g.lineWidth = 0.6; for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(x0 + j * 3.5 - 0.5, y - 7 - 0); g.lineTo(x0 + j * 3.5 + 2.5, y - 18); g.stroke(); }
      g.beginPath(); g.moveTo(x0 + 1.5, y - 12.5); g.lineTo(x0 + 15.5, y - 12.5); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x0 + 3, y - 18); g.lineTo(x0 + 8, y - 18); g.lineTo(x0 + 4, y - 7); g.lineTo(x0, y - 7); g.fill();
    }
  } else if (kind === 8) {     // brick chimney with a pot
    sh(px - 2, 18);
    const bg = g.createLinearGradient(px, 0, px + 14, 0); bg.addColorStop(0, '#b8684a'); bg.addColorStop(1, '#7a3f2e');
    g.fillStyle = bg; g.fillRect(px, y - 24, 14, 24);
    g.fillStyle = 'rgba(40,16,10,.3)'; for (let k = 0; k < 6; k++) g.fillRect(px, y - 22 + k * 4, 14, 0.8); for (let k = 0; k < 6; k++) g.fillRect(px + 3 + (k % 2) * 6, y - 22 + k * 4, 0.8, 4);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(px, y - 24, 1.6, 24);
    g.fillStyle = '#8a8f94'; g.fillRect(px - 2, y - 27, 18, 3.4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px - 2, y - 27, 18, 0.9);
    g.fillStyle = '#b8683f'; g.fillRect(px + 3, y - 33, 8, 6.4); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(px + 4, y - 33.4, 6, 1.6);
  } else {                     // stair bulkhead with a service door
    sh(px - 2, 34);
    const bg = g.createLinearGradient(px, 0, px + 30, 0); bg.addColorStop(0, '#c9c1b2'); bg.addColorStop(1, '#9a9282');
    g.fillStyle = bg; g.fillRect(px, y - 20, 30, 20); hi(px, y - 20, 30, 20);
    g.fillStyle = '#6a6458'; g.fillRect(px - 1.6, y - 22, 33.2, 2.8); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px - 1.6, y - 22, 33.2, 0.9);
    g.fillStyle = '#3f4a52'; g.fillRect(px + 17, y - 14, 8, 14); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px + 17, y - 14, 1.2, 14);
    g.fillStyle = '#e9c46a'; g.fillRect(px + 18.4, y - 7, 1.4, 1.4);
    wFadeV(g, px, y - 20, 30, 20, 0, 0.14);
  }
}
