/* ============================ hero details for the key buildings ============================
   hero* painters run once while a building's shell is painted. *Window / *Booths / etc. are `inside` callbacks that
   paint what sits behind a shop window (cached, then slid a little with the camera). */

/* a small cached rectangle wPlaque (OPEN signs, house numbers) */
function wPlaque(c, cx, cy, w, h, text, bg, fg, size) {
  size = size || (h > 14 ? 10 : 7.5);
  const s = wspr('pl' + W_FONT_GEN + '|' + w + 'x' + h + bg + fg + text + size, w + 8, h + 8, g => {
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, 5, 6, w, h, 3); g.fill();
    const q = g.createLinearGradient(0, 4, 0, 4 + h); q.addColorStop(0, shade(bg, 0.14)); q.addColorStop(1, shade(bg, -0.16));
    g.fillStyle = q; rr(g, 4, 4, w, h, 3); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 0.9; rr(g, 4.6, 4.6, w - 1.2, h - 1.2, 2.6); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(6, 5, w - 4, 1);
    g.font = '800 ' + size + 'px "DM Sans","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(text, 4 + w / 2 + 0.5, 4 + h / 2 + 1); g.fillStyle = fg; g.fillText(text, 4 + w / 2, 4 + h / 2 + 0.5);
  });
  c.drawImage(s.cv, cx - w / 2 - 4, cy - h / 2 - 4, s.w, s.h);
}
/* sprites for the stuff behind a window: painted a little larger than the glass so parallax never shows an edge */
function wInsideSprite(key, w, h, paint) {
  const iw = Math.round(w), ih = Math.round(h);
  return wspr('in' + key + iw + 'x' + ih, iw + W_WIN_IM * 2, ih + W_WIN_IM * 2, g => { g.translate(W_WIN_IM, W_WIN_IM); paint(g, iw, ih); });
}
function wBlitInside(c, s, x, y, w, h, px, py, a) {
  const res = wres(), IM = W_WIN_IM, sw = s.w - IM * 2, sh = s.h - IM * 2;
  if (a != null) c.globalAlpha = a;
  c.drawImage(s.cv, (IM + px) * res, (IM + py) * res, sw * res, sh * res, x, y, w, h);
  if (a != null) c.globalAlpha = 1;
}

/* ---------- Maple Court ---------- */
function wPaintIvy(c, x0, bot, hgt, se, r) {
  const cols = { spring: ['#5fb04f', '#7fcf63', '#3f8a3f'], summer: ['#2f7a45', '#3f9a55', '#58b468', '#245f3a'], autumn: ['#b8321f', '#d9582a', '#e8943a', '#8a2418'], winter: ['#6a4a2e', '#7a5a38'] }[se];
  c.strokeStyle = '#4a3624'; c.lineWidth = 1.5; c.lineCap = 'round';
  const stems = [];
  for (let s = 0; s < 3; s++) { let x = x0 + 4 + s * 6, y = bot - 12; const pts = [[x, y]]; while (y > bot - hgt) { x += (r() - 0.5) * 7; y -= 8 + r() * 6; pts.push([x, y]); } stems.push(pts); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.forEach(p => c.lineTo(p[0], p[1])); c.stroke(); }
  c.lineCap = 'butt';
  const n = se === 'winter' ? 36 : 260;
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 0.8), ly = bot - 14 - t * hgt, lx = x0 + 1 + r() * r() * 26 * (1 - t * 0.5) + (r() < 0.5 ? 0 : 5 * (1 - t));
    const col = cols[Math.floor(r() * cols.length)], sz = 3 + r() * 2.4, a = r() * 6.28;
    c.fillStyle = col; c.beginPath(); c.ellipse(lx, ly, sz, sz * 0.62, a, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(lx - 0.6, ly - 0.7, sz * 0.5, sz * 0.26, a, 0, 7); c.fill();
    if (i % 7 === 0) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(lx + 1, ly + 1.4, sz * 0.8, sz * 0.4, a, 0, 7); c.fill(); }
  }
}
function wPaintBarrel(c, cx, bot, col, w) {
  const y0 = bot - 70, hw = w / 2, apex = bot - 98;
  wFadeV(c, cx - hw + 4, y0, w - 8, 22, 0.32, 0, '10,10,26');
  const g = c.createLinearGradient(cx - hw, 0, cx + hw, 0); g.addColorStop(0, shade(col, -0.22)); g.addColorStop(0.3, shade(col, 0.1)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.28));
  c.fillStyle = g; c.beginPath(); c.moveTo(cx - hw, y0); c.quadraticCurveTo(cx - hw * 0.1, apex - 6, cx + hw, y0); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.9;
  for (let i = 1; i < 6; i++) { const t = i / 6, ex = cx - hw + w * t; c.beginPath(); c.moveTo(cx + (t - 0.5) * 8, apex + 2); c.lineTo(ex, y0 - 1); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - hw + 5, y0 - 3); c.quadraticCurveTo(cx - hw * 0.1, apex - 1, cx + hw - 12, y0 - 7); c.stroke();
  const vg = c.createLinearGradient(0, y0 - 1, 0, y0 + 6); vg.addColorStop(0, shade(col, -0.1)); vg.addColorStop(1, shade(col, -0.34));
  c.fillStyle = vg; c.fillRect(cx - hw, y0 - 1, w, 6);
  c.fillStyle = shade(col, -0.4); for (let x = cx - hw; x < cx + hw - 2; x += 6) { c.beginPath(); c.moveTo(x, y0 + 5); c.lineTo(x + 6, y0 + 5); c.lineTo(x + 3, y0 + 8.5); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(cx - hw, y0 - 1, w, 0.9);
  c.fillStyle = '#c9a24a'; c.fillRect(cx - hw - 1, y0 - 1.5, 2, 9); c.fillRect(cx + hw - 1, y0 - 1.5, 2, 9);
}
function wHeroApartment(c, b, rh) {
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, se = season(), r = mulberry32(777);
  // stone ledges under the windows that have no flower box
  for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
    if (hash01(i, row, 5) > 0.45) continue;
    const wx = b.x + 22 + i * 49, wy = ft + 24 + row * 62;
    c.fillStyle = 'rgba(8,10,22,.28)'; c.fillRect(wx - 3, wy + 43, 37, 2.6);
    c.fillStyle = shade(b.wall, -0.16); c.fillRect(wx - 4, wy + 39, 39, 4);
    c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(wx - 4, wy + 39, 39, 1);
    c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(wx - 4, wy + 42, 39, 1);
    c.fillStyle = shade(b.wall, -0.3); c.fillRect(wx, wy + 43, 3, 4); c.fillRect(wx + 28, wy + 43, 3, 4);
  }
  wShFireStair(c, b.x + b.w - 17, 11, [ft + 76, ft + 138, bot - 16]);
  wPaintIvy(c, b.x, bot, 150, se, r);
  wPaintBarrel(c, cx, bot, '#3f6b54', 76);
  // house number plate
  c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, cx - 11, bot - 80, 22, 10, 3); c.fill();
  c.fillStyle = '#f4ead8'; rr(c, cx - 11, bot - 81, 22, 10, 3); c.fill();
  c.strokeStyle = 'rgba(120,90,50,.5)'; c.lineWidth = 0.8; rr(c, cx - 10, bot - 80, 20, 8, 2.4); c.stroke();
  c.font = '800 9px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#33261a'; c.fillText('12', cx, bot - 75.5);
  // brass door-bell panel and mail slots by the steps
  c.fillStyle = '#c9a24a'; c.fillRect(cx + 22, bot - 36, 5, 9); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(cx + 22, bot - 36, 5, 1);
  c.fillStyle = 'rgba(60,40,10,.7)'; for (let k = 0; k < 3; k++) c.fillRect(cx + 23.2, bot - 34 + k * 2.7, 2.6, 1.2);
  // stoop railings
  c.strokeStyle = '#1d242b'; c.lineWidth = 1.4; [cx - 30, cx + 30].forEach(px => { c.beginPath(); c.moveTo(px, bot - 12); c.lineTo(px, bot - 24); c.stroke(); });
}

/* ---------- Corner Grocery ---------- */
function wPaintGroceryWin(g, W, H, k) {
  const wl = g.createLinearGradient(0, 0, 0, H); wl.addColorStop(0, 'rgba(240,226,190,.92)'); wl.addColorStop(1, 'rgba(210,186,140,.92)');
  g.fillStyle = wl; g.fillRect(0, 0, W, H);
  wFadeV(g, 0, 0, W, 10, 0.3, 0, '30,20,10');
  const prod = ['#e63946', '#f4a261', '#8ac926', '#ffca3a', '#b5651d', '#7a4fb0'];
  const r = mulberry32(k * 91 + 5);
  [0.26, 0.5, 0.74].forEach((fy, si) => {
    const y = H * fy;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(4, y + 3, W - 8, 3);
    g.fillStyle = '#9a6a3c'; g.fillRect(3, y, W - 6, 3.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(3, y, W - 6, 0.9);
    let x = 6;
    while (x < W - 8) {
      if (si === 0) { const bw = 3.4 + r() * 2, bh = 7 + r() * 5; g.fillStyle = prod[Math.floor(r() * prod.length)]; g.fillRect(x, y - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 0.5, y - bh + 1, 1, bh - 2); x += bw + 1.2; }
      else { const cr = 4 + r() * 1.4; g.fillStyle = prod[Math.floor(r() * prod.length)]; for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(x + cr + j * cr * 1.5, y - cr * 0.85 - (j % 2) * 2, cr, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + cr + j * cr * 1.5 - cr * 0.3, y - cr * 1.2 - (j % 2) * 2, cr * 0.28, 0, 7); g.fill(); g.fillStyle = prod[Math.floor(r() * prod.length)]; } x += cr * 5.6; }
    }
  });
  g.fillStyle = '#6a4a2e'; g.fillRect(0, H - 14, W, 14); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, H - 14, W, 1.2);
  for (let i = 0; i < 6; i++) { g.fillStyle = prod[(i + k) % prod.length]; g.beginPath(); g.arc(W * 0.1 + i * W * 0.16, H - 17 - (i % 2) * 3, 4.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(W * 0.1 + i * W * 0.16 - 1.4, H - 19 - (i % 2) * 3, 1.3, 0, 7); g.fill(); }
  [W * 0.18, W * 0.62].forEach(x => { g.fillStyle = '#f6f1e7'; g.fillRect(x, 2, 14, 6); g.fillStyle = '#d63b4b'; g.fillRect(x + 2, 4.5, 10, 1.4); g.strokeStyle = 'rgba(60,40,20,.7)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x + 3, 0); g.lineTo(x + 3, 2); g.moveTo(x + 11, 0); g.lineTo(x + 11, 2); g.stroke(); });
}
function wGroceryIn(k) {
  return (c, x, y, w, h, on, px, py) => {
    wBlitInside(c, wInsideSprite('gro' + k, w, h, (g, W, H) => wPaintGroceryWin(g, W, H, k)), x, y, w, h, px * 1.6, py * 1.6, 0.94);
    c.fillStyle = 'rgba(255,255,255,.94)'; c.font = '800 8px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(k ? 'FRESH DAILY' : 'LOCAL PRODUCE', x + w / 2, y + h * 0.1);
  };
}
const W_GROCERY_IN = [wGroceryIn(0), wGroceryIn(1)];
function wGroceryWindow(k) { return W_GROCERY_IN[k]; }
function wHeroGrocery(c, b, rh) {
  const bot = b.y + b.h, cx = b.x + b.w / 2;
  // crates and baskets out front
  const cols = ['#e63946', '#f4a261', '#8ac926', '#ffca3a'], r = mulberry32(31);
  for (let i = 0; i < 4; i++) {
    const x = b.x + 20 + i * 22;
    c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(x + 1, bot - 1, 21, 3.4);
    const cg = c.createLinearGradient(0, bot - 15, 0, bot - 1); cg.addColorStop(0, '#9a6a3c'); cg.addColorStop(1, '#6a4524');
    c.fillStyle = cg; c.fillRect(x, bot - 15, 20, 14);
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x, bot - 9, 20, 1.5); c.fillRect(x + 9, bot - 15, 1.5, 14);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, bot - 15, 20, 1.2); c.fillRect(x, bot - 15, 1.2, 14);
    c.fillStyle = '#c9a56a'; c.fillRect(x + 1, bot - 12.5, 18, 1.2);
    for (let k = 0; k < 7; k++) {
      c.fillStyle = cols[i]; const px = x + 2.4 + (k % 4) * 4.4 + (k > 3 ? 2 : 0), py = bot - 15.6 - (k > 3 ? 3.2 : 0) - (k % 2) * 1;
      c.beginPath(); c.arc(px, py, 2.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(px - 0.8, py - 1, 0.9, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.arc(px + 0.9, py + 1.2, 1.3, 0, 7); c.fill();
    }
    if (i === 1) { c.fillStyle = '#f6f1e7'; c.fillRect(x + 4, bot - 6.5, 12, 4); c.fillStyle = '#d63b4b'; c.fillRect(x + 5, bot - 5.4, 6, 1.2); }
  }
  // stack of shopping baskets and a chalk menu on the wall
  [0, 1, 2].forEach(i => { c.fillStyle = i % 2 ? '#d63b4b' : '#e0463b'; rr(c, b.x + b.w - 56, bot - 18 - i * 3.2, 17, 5, 1.6); c.fill(); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(b.x + b.w - 54, bot - 16.4 - i * 3.2); c.lineTo(b.x + b.w - 41, bot - 16.4 - i * 3.2); c.stroke(); });
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b.x + b.w - 30, bot - 53, 20, 26);
  c.fillStyle = '#26332c'; c.fillRect(b.x + b.w - 31, bot - 54, 20, 26); c.strokeStyle = '#9a6a3c'; c.lineWidth = 1.6; c.strokeRect(b.x + b.w - 30.2, bot - 53.2, 18.4, 24.4);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(b.x + b.w - 27, bot - 49, 12, 1.2); c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 4; k++) c.fillRect(b.x + b.w - 27, bot - 45 + k * 3.6, 6 + (k % 2) * 4, 0.9);
  c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(b.x + b.w - 15.5, bot - 41, 1.6, 0, 7); c.fill();
}

/* ---------- Dot's Diner ---------- */
function wNeonSign(c, text, cx, y, size, open, kind) {
  const s = wspr('ne' + W_FONT_GEN + (open ? 1 : 0) + text + size, 200, 80, g => {
    const ox = 20, oy = 14, bx = ox, by = oy, bw = 160, bh = 42;
    // braces down to the roof
    g.fillStyle = '#2a3036'; g.fillRect(bx + 22, by + bh - 1, 3, 12); g.fillRect(bx + bw - 25, by + bh - 1, 3, 12);
    g.fillStyle = 'rgba(8,12,28,.3)'; rr(g, bx + 3, by + 4, bw, bh, 12); g.fill();
    // chrome rim and cabinet
    const rg = g.createLinearGradient(0, by, 0, by + bh); rg.addColorStop(0, '#f2f5f7'); rg.addColorStop(0.5, '#9aa3aa'); rg.addColorStop(1, '#5d666d');
    g.fillStyle = rg; rr(g, bx, by, bw, bh, 12); g.fill();
    const fg = g.createLinearGradient(0, by + 3, 0, by + bh - 3); fg.addColorStop(0, '#3a1a22'); fg.addColorStop(1, '#1d0c12');
    g.fillStyle = fg; rr(g, bx + 3, by + 3, bw - 6, bh - 6, 9.5); g.fill();
    g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, bx + 5, by + 5, bw - 10, (bh - 10) * 0.42, 6); g.fill();
    // tube border
    const bc = open ? '#ff7a95' : '#7a4a55';
    if (open) { g.strokeStyle = 'rgba(255,100,140,.22)'; g.lineWidth = 6; rr(g, bx + 6, by + 6, bw - 12, bh - 12, 7); g.stroke(); }
    g.strokeStyle = open ? '#d6456a' : '#4a2a33'; g.lineWidth = 3; rr(g, bx + 6, by + 6, bw - 12, bh - 12, 7); g.stroke();
    g.strokeStyle = open ? '#ffd0dc' : bc; g.lineWidth = 1.5; rr(g, bx + 6, by + 6, bw - 12, bh - 12, 7); g.stroke();
    // lettering as neon tube
    g.font = '800 ' + size + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const tx = bx + bw / 2, ty = by + bh / 2 + 0.5;
    if (open) { g.strokeStyle = 'rgba(255,170,190,.28)'; g.lineWidth = 6; g.strokeText(text, tx, ty); g.strokeStyle = 'rgba(255,170,190,.4)'; g.lineWidth = 3.6; g.strokeText(text, tx, ty); }
    g.fillStyle = open ? '#fff3df' : '#b9a59a'; g.fillText(text, tx, ty);
    g.strokeStyle = open ? '#fffaf0' : '#d6c4ba'; g.lineWidth = 0.6; g.strokeText(text, tx, ty);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(bx + 18, by + bh - 9, bw - 36, 1);
  });
  c.drawImage(s.cv, cx - 100, y - 36, 200, 80);
  if (open && FX.nf > 0.05) { litRect(cx - 56, y - 11, 112, 22); addEmit(cx, y, 70, kind == null ? 0 : kind, 0.34); }
}
function wPaintDinerWin(g, W, H) {
  const wl = g.createLinearGradient(0, 0, 0, H); wl.addColorStop(0, 'rgba(250,236,214,.9)'); wl.addColorStop(1, 'rgba(226,200,170,.9)');
  g.fillStyle = wl; g.fillRect(0, 0, W, H);
  // checkered floor in perspective
  const fy = H * 0.74;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#f6f1e7' : '#2a2226'; g.fillRect(i * W / 14, fy + j * (H - fy) / 3, W / 14 + 0.5, (H - fy) / 3 + 0.5); }
  wFadeV(g, 0, fy, W, 6, 0.35, 0, '10,6,12');
  // counter with stools along the back
  g.fillStyle = '#c9ced2'; g.fillRect(W * 0.04, H * 0.55, W * 0.92, 4); g.fillStyle = '#7a1f2c'; g.fillRect(W * 0.04, H * 0.55 + 4, W * 0.92, H * 0.19);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W * 0.04, H * 0.55, W * 0.92, 1);
  for (let i = 0; i < 5; i++) { const sx = W * (0.14 + i * 0.18); g.fillStyle = '#d63b4b'; g.beginPath(); g.ellipse(sx, H * 0.7, 4.2, 2, 0, 0, 7); g.fill(); g.fillStyle = '#8a9298'; g.fillRect(sx - 0.7, H * 0.7, 1.4, H * 0.26); }
  // booth backs by the window, with tufted vinyl
  [W * 0.1, W * 0.58].forEach(bx => {
    g.fillStyle = '#8f1d2c'; rr(g, bx, H * 0.38, W * 0.3, H * 0.4, 5); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(bx + 3, H * 0.38 + 1.5, W * 0.3 - 6, 1.2);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 1; k < 5; k++) g.fillRect(bx + k * W * 0.06, H * 0.4, 1, H * 0.34);
    g.fillStyle = '#e9e2d3'; g.fillRect(bx + W * 0.04, H * 0.82, W * 0.22, 2.4);
  });
  // pendant lamps and a menu board
  for (let i = 0; i < 3; i++) { const lx = W * (0.2 + i * 0.3); g.strokeStyle = 'rgba(40,30,22,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, H * 0.12); g.stroke(); g.fillStyle = '#d63b4b'; g.beginPath(); g.moveTo(lx - 5, H * 0.2); g.lineTo(lx + 5, H * 0.2); g.lineTo(lx + 2.4, H * 0.12); g.lineTo(lx - 2.4, H * 0.12); g.fill(); g.fillStyle = '#fff2c0'; g.fillRect(lx - 3.5, H * 0.2, 7, 1.2); }
  g.fillStyle = '#1f2a24'; g.fillRect(W * 0.38, H * 0.2, W * 0.24, H * 0.16); g.strokeStyle = '#c9ced2'; g.lineWidth = 1; g.strokeRect(W * 0.38, H * 0.2, W * 0.24, H * 0.16);
  g.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) g.fillRect(W * 0.41, H * (0.235 + k * 0.04), W * (0.12 + (k % 2) * 0.05), 0.9);
}
function wDinerBooths(c, x, y, w, h, on, px, py) {
  wBlitInside(c, wInsideSprite('din', w, h, wPaintDinerWin), x, y, w, h, px * 1.6, py * 1.6, 0.95);
}
function wHeroDiner(c, b, rh) {
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, w = b.w;
  // chrome trim band with reflected sky
  const cg = c.createLinearGradient(0, ft - 11, 0, ft - 3); cg.addColorStop(0, '#f6f8f9'); cg.addColorStop(0.45, '#c9d0d4'); cg.addColorStop(0.55, '#7b858c'); cg.addColorStop(1, '#dfe5e8');
  c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(b.x - 7, ft - 3, w + 14, 3);
  c.fillStyle = cg; c.fillRect(b.x - 7, ft - 11, w + 14, 8.4);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(b.x - 7, ft - 11, w + 14, 1); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b.x - 7, ft - 3.4, w + 14, 0.9);
  for (let x = b.x - 2; x < b.x + w + 5; x += 22) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x, ft - 7, 0.9, 0, 7); c.fill(); }
  // flat roof: coping, kitchen vent stack and the sign's braces
  c.fillStyle = '#7b848b'; c.fillRect(b.x + w - 44, b.y - 18, 8, 18); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(b.x + w - 44, b.y - 18, 2, 18);
  c.fillStyle = '#5d666d'; c.fillRect(b.x + w - 47, b.y - 21, 14, 4); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(b.x + w - 47, b.y - 21, 14, 1);
  c.fillStyle = '#6a737a'; c.fillRect(b.x + 30, b.y - 10, 26, 10); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(b.x + 30, b.y - 10, 26, 1.4);
  c.fillStyle = '#2a3036'; for (let k = 0; k < 4; k++) c.fillRect(b.x + 34 + k * 5.5, b.y - 7.5, 3, 5);
  // checker band with a glossy edge
  const n = Math.ceil(w / 10);
  for (let i = 0; i < n; i++) {
    const cw = Math.min(10, w - i * 10);
    c.fillStyle = i % 2 ? '#f5efe6' : '#2a2226'; c.fillRect(b.x + i * 10, ft + 34, cw, 5); c.fillStyle = i % 2 ? '#2a2226' : '#f5efe6'; c.fillRect(b.x + i * 10, ft + 39, cw, 5);
  }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(b.x, ft + 34, w, 1.2); wFadeV(c, b.x, ft + 44, w, 6, 0.28, 0, '10,6,12');
  c.fillStyle = '#c9ced2'; c.fillRect(b.x, ft + 33, w, 1.2); c.fillRect(b.x, ft + 44, w, 1.2);
  // red and white wall stripes beside the door, bottom chrome strip
  for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.2)' : 'rgba(150,20,30,.2)'; c.fillRect(cx - 52 + i * 15, ft + 60, 15, bot - ft - 72); }
  c.fillStyle = '#e4e8ea'; c.fillRect(b.x, bot - 12, w, 3); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(b.x, bot - 12, w, 1); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(b.x, bot - 9, w, 1);
  // gooseneck lamps over the windows
  [b.x + 54, b.x + w - 54].forEach(lx => {
    c.strokeStyle = '#2a3036'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(lx, ft + 49); c.quadraticCurveTo(lx, ft + 40, lx + 9, ft + 42); c.stroke();
    c.fillStyle = '#d63b4b'; c.beginPath(); c.moveTo(lx + 5, ft + 41); c.lineTo(lx + 14, ft + 41); c.lineTo(lx + 12, ft + 46); c.lineTo(lx + 7, ft + 46); c.fill();
  });
}

/* ---------- St. Anne Clinic ---------- */
function wPaintClinicWin(g, W, H) {
  const wl = g.createLinearGradient(0, 0, 0, H); wl.addColorStop(0, 'rgba(236,244,248,.92)'); wl.addColorStop(1, 'rgba(206,222,230,.92)');
  g.fillStyle = wl; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(W * (0.08 + i * 0.24), 1, W * 0.16, 2.4); }
  g.fillStyle = '#6fa4c4'; g.fillRect(0, H * 0.5, W, H * 0.04);
  for (let i = 0; i < 5; i++) { const sx = W * (0.07 + i * 0.19); g.fillStyle = '#3f7ea6'; rr(g, sx, H * 0.62, W * 0.14, H * 0.2, 2.4); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(sx + 1, H * 0.62 + 1, W * 0.14 - 2, 1.2); g.fillStyle = '#5d6a74'; g.fillRect(sx + 2, H * 0.82, 1.4, H * 0.14); g.fillRect(sx + W * 0.14 - 3.4, H * 0.82, 1.4, H * 0.14); }
  g.fillStyle = '#b8683f'; g.fillRect(W * 0.9, H * 0.76, W * 0.06, H * 0.12); g.fillStyle = '#3f9a55'; g.beginPath(); g.ellipse(W * 0.93, H * 0.66, W * 0.05, H * 0.2, 0, 0, 7); g.fill();
  g.fillStyle = '#f6f1e7'; g.fillRect(W * 0.2, H * 0.14, W * 0.18, H * 0.2); g.fillStyle = '#d63b4b'; g.fillRect(W * 0.28, H * 0.17, W * 0.02, H * 0.14); g.fillRect(W * 0.24, H * 0.22, W * 0.1, H * 0.03);
}
function wClinicWaiting(c, x, y, w, h, on, px, py) {
  wBlitInside(c, wInsideSprite('cli', w, h, wPaintClinicWin), x, y, w, h, px * 1.6, py * 1.6, 0.94);
}
function wHeroClinic(c, b, rh) {
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2;
  // blue band with a highlight
  c.fillStyle = '#4d86a8'; c.fillRect(b.x, ft + 8, b.w, 5); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(b.x, ft + 8, b.w, 1); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(b.x, ft + 12, b.w, 1); wFadeV(c, b.x, ft + 13, b.w, 5, 0.22, 0, '10,20,40');
  // the lit cross cabinet
  c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, cx - 18, ft + 69, 38, 38, 8); c.fill();
  const cg = c.createLinearGradient(0, ft + 66, 0, ft + 104); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#dfe8ec');
  c.fillStyle = cg; rr(c, cx - 19, ft + 66, 38, 38, 8); c.fill();
  c.strokeStyle = '#9aa7ae'; c.lineWidth = 1.4; rr(c, cx - 18.3, ft + 66.7, 36.6, 36.6, 7.4); c.stroke();
  const rg = c.createLinearGradient(0, ft + 71, 0, ft + 99); rg.addColorStop(0, '#ee4a5a'); rg.addColorStop(1, '#bf2f3f');
  c.fillStyle = rg; c.fillRect(cx - 5, ft + 71, 10, 28); c.fillRect(cx - 14, ft + 80, 28, 10);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(cx - 5, ft + 71, 10, 1.2); c.fillRect(cx - 14, ft + 80, 28, 1.2);
  // emergency light box and glass canopy
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(cx - 43, bot - 56, 88, 9);
  const eg = c.createLinearGradient(0, bot - 58, 0, bot - 50); eg.addColorStop(0, '#e9505f'); eg.addColorStop(1, '#b52b3a');
  c.fillStyle = eg; c.fillRect(cx - 44, bot - 58, 88, 8); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(cx - 44, bot - 58, 88, 1);
  c.font = '800 7px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('EMERGENCY', cx, bot - 53.6);
  // wheelchair ramp rail, bollards, accessibility plate
  c.strokeStyle = '#8f9aa1'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(b.x + 12, bot - 6); c.lineTo(b.x + 12, bot - 22); c.lineTo(b.x + 64, bot - 22); c.lineTo(b.x + 64, bot - 6); c.stroke();
  c.lineWidth = 0.9; c.beginPath(); c.moveTo(b.x + 12, bot - 14); c.lineTo(b.x + 64, bot - 14); c.stroke();
  c.fillStyle = '#2a6f97'; c.fillRect(b.x + 72, bot - 44, 12, 12); c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x + 77.5, bot - 40, 1.5, 0, 7); c.fill(); c.fillRect(b.x + 77, bot - 38.5, 1.2, 3.4); c.fillRect(b.x + 77, bot - 35.2, 3.4, 1);
  // hours plate by the door
  c.fillStyle = '#e9e2d3'; c.fillRect(cx + 32, bot - 46, 20, 14); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(cx + 32, bot - 32, 20, 1); c.fillStyle = '#2a6f97'; c.fillRect(cx + 34, bot - 43, 16, 1.4); c.fillStyle = 'rgba(60,70,80,.7)'; for (let k = 0; k < 3; k++) c.fillRect(cx + 34, bot - 40 + k * 2.6, 9 + (k % 2) * 4, 0.9);
}
