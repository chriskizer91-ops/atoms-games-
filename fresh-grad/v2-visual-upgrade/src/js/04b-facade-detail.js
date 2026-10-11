/* ============================ facade painters ============================
   Static detail that is painted once into each building's cached shell: wall light and weathering, cornices,
   string courses, plinths, downspouts. Nothing here may call litRect/addLight (shells are drawn once). */

/* the wall itself: sun on the top, bounce from the street at the foot, material, weathering */
function wShWall(c, b, rh, o, r) {
  const x = b.x, w = b.w, fy = b.y + rh, bot = b.y + b.h, h = bot - fy;
  const g = c.createLinearGradient(0, fy, 0, bot);
  g.addColorStop(0, shade(b.wall, 0.14)); g.addColorStop(0.5, b.wall); g.addColorStop(1, shade(b.wall, -0.14));
  c.fillStyle = g; c.fillRect(x, fy, w, h);
  patFill(c, o.mat || 'stucco', x, fy, w, h, o.matA == null ? 1 : o.matA);
  c.save(); c.beginPath(); c.rect(x, fy, w, h); c.clip();
  // large soft tone drift so no wall reads as one flat sheet
  for (let i = 0; i < 5; i++) {
    const px = x + r() * w, py = fy + r() * h, pr = 40 + r() * 70, dark = r() < 0.55;
    const q = c.createRadialGradient(px, py, 0, px, py, pr); q.addColorStop(0, dark ? 'rgba(20,16,34,.07)' : 'rgba(255,248,230,.07)'); q.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = q; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  // sun-bleached top, warm bounce light near the street
  wFadeV(c, x, fy, w, h * 0.3, 0.1, 0, '255,248,228');
  wFadeV(c, x, bot - 44, w, 44, 0, 0.12, '255,200,140');
  // soot under the roofline and rain streaks running down from it
  wFadeV(c, x, fy, w, 16, 0.2, 0, '20,16,28');
  const ns = 5 + Math.floor(r() * 5);
  for (let i = 0; i < ns; i++) {
    const sx = x + 6 + r() * (w - 12), len = 30 + r() * 90, sw = 2.5 + r() * 7;
    const q = c.createLinearGradient(0, fy, 0, fy + len); q.addColorStop(0, 'rgba(30,24,34,.09)'); q.addColorStop(1, 'rgba(30,24,34,0)');
    c.fillStyle = q; c.fillRect(sx, fy, sw, len);
  }
  // efflorescence and a few repaired patches
  for (let i = 0; i < 4; i++) { const px = x + r() * w, py = bot - 16 - r() * 40; c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.ellipse(px, py, 10 + r() * 22, 3 + r() * 5, 0, 0, 7); c.fill(); }
  if (o.mat === 'brick' || o.mat === 'stone') for (let i = 0; i < 3; i++) { const px = x + 16 + r() * (w - 48), py = fy + 20 + r() * (h - 80); c.fillStyle = r() < 0.5 ? 'rgba(255,214,170,.1)' : 'rgba(40,18,10,.1)'; c.fillRect(px, py, 14 + r() * 18, 8 + r() * 8); }
  // moss and damp where the wall meets the ground
  if (r() < 0.8) for (let k = 0; k < 2; k++) {
    const mx = x + 10 + r() * (w - 40);
    for (let i = 0; i < 22; i++) { c.fillStyle = r() < 0.5 ? 'rgba(70,110,50,.2)' : 'rgba(110,150,70,.16)'; c.fillRect(mx + (r() - 0.3) * 30, bot - 22 - r() * 16, 1 + r() * 1.8, 1 + r() * 1.8); }
  }
  // light on the left face, shade on the right
  const lg = c.createLinearGradient(x, 0, x + 10, 0); lg.addColorStop(0, 'rgba(255,255,255,.22)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(x, fy, 10, h);
  const dg = c.createLinearGradient(x + w - 12, 0, x + w, 0); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.24)'); c.fillStyle = dg; c.fillRect(x + w - 12, fy, 12, h);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, fy, 1.2, h); c.fillStyle = 'rgba(0,0,0,.34)'; c.fillRect(x + w - 1.2, fy, 1.2, h);
  c.restore();
}
/* plinth, dirt line and the contact shadow on the pavement */
function wShBase(c, b, o) {
  const x = b.x, w = b.w, bot = b.y + b.h, ph = 12;
  wFadeV(c, x - 5, bot, w + 10, 9, 0.4, 0, '8,12,28');
  wFadeV(c, x, bot - ph - 16, w, 16, 0, 0.16, '10,8,20');
  c.fillStyle = shade(b.wall, -0.42); c.fillRect(x, bot - ph, w, ph);
  patFill(c, 'stone', x, bot - ph, w, ph, 0.85);
  wFadeV(c, x, bot - ph, w, ph, 0, 0.3);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, bot - ph, w, 1.4);
  c.fillStyle = 'rgba(0,0,0,.32)'; c.fillRect(x, bot - ph + 1.4, w, 1);
  c.fillStyle = 'rgba(28,22,18,.45)'; c.fillRect(x, bot - 1.4, w, 1.4);
  const r = mulberry32((b.x | 0) * 3 + 17);
  for (let i = 0; i < w / 5; i++) { c.fillStyle = 'rgba(20,16,12,' + (0.06 + r() * 0.12).toFixed(3) + ')'; c.fillRect(x + r() * w, bot - ph + 2 + r() * ph * 0.6, 1 + r() * 2, 1 + r() * 4); }
  // a vent grille or two and an electric meter at the foot of the wall
  if (o && o.meter !== false) {
    const mx = x + 14 + r() * (w - 60);
    c.fillStyle = '#4a545c'; c.fillRect(mx, bot - ph - 11, 10, 8); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(mx, bot - ph - 11, 10, 1);
    c.fillStyle = 'rgba(210,225,235,.7)'; c.beginPath(); c.arc(mx + 5, bot - ph - 7, 2.6, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(mx + 4.4, bot - ph - 8.6, 1.2, 1.8);
    c.strokeStyle = '#3a4650'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(mx + 8, bot - ph - 11); c.lineTo(mx + 8, bot - ph - 24); c.stroke();
    const vx = x + w - 34 - r() * 40; c.fillStyle = '#2d363e'; c.fillRect(vx, bot - ph + 3, 14, 5);
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 4; k++) c.fillRect(vx + 1.5, bot - ph + 4 + k * 1.1, 11, 0.6);
  }
}
/* projecting string course with a shadow underneath */
function wShCourse(c, x, y, w, th, tint) {
  th = th || 4;
  c.fillStyle = tint || 'rgba(255,240,216,.3)'; c.fillRect(x, y, w, th);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x, y, w, 1);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, y + th - 1, w, 1);
  wFadeV(c, x, y + th, w, 6, 0.28, 0, '12,10,26');
}
function wShQuoins(c, b, fy, bot) {
  const bh = 14; let k = 0;
  for (let yy = bot - 12 - bh; yy > fy + 4; yy -= bh, k++) {
    [0, 1].forEach(s => {
      const bw = k % 2 ? 7 : 12, bx = s ? b.x + b.w - bw : b.x;
      c.fillStyle = 'rgba(240,228,200,.5)'; c.fillRect(bx, yy, bw, bh - 1.4);
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(bx, yy, bw, 1);
      c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(bx, yy + bh - 2.4, bw, 1); c.fillRect(s ? bx : bx + bw - 1, yy, 1, bh - 1.4);
    });
  }
}
/* the roof band: material, inset sign board, coping, cornice with dentils and the shadow it throws on the wall */
function wShRoof(c, b, rh, o) {
  const x = b.x, y = b.y, w = b.w, bot = y + rh;
  const rg = c.createLinearGradient(0, y, 0, bot); rg.addColorStop(0, shade(b.roof, 0.18)); rg.addColorStop(0.55, b.roof); rg.addColorStop(1, shade(b.roof, -0.22));
  c.fillStyle = rg; c.fillRect(x - 7, y, w + 14, rh);
  patFill(c, o.roofMat || 'seam', x - 7, y, w + 14, rh, 0.75);
  // inset sign board
  if (o.board !== false) {
    const bx = x + 12, by = y + 8, bw = w - 24, bh = rh - 18;
    c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, bx, by, bw, bh, 3); c.fill();
    wFadeV(c, bx, by, bw, 6, 0.3, 0, '0,0,0');
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(bx + 2, by + bh - 0.6, bw - 4, 1);
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; rr(c, bx + 0.5, by + 0.5, bw - 1, bh - 1, 3); c.stroke();
    [[bx + 5, by + 5], [bx + bw - 5, by + 5], [bx + 5, by + bh - 5], [bx + bw - 5, by + bh - 5]].forEach(p => { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(p[0], p[1], 1.5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(p[0] - 0.3, p[1] - 0.3, 0.8, 0, 7); c.fill(); });
  }
  // coping at the roof edge
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - 9, y + 2.4, w + 18, 2);
  c.fillStyle = shade(b.roof, 0.1); c.fillRect(x - 9, y - 2, w + 18, 4.6);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 9, y - 2, w + 18, 1.2);
  c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(x - 9, y + 1.6, w + 18, 1);
  wFadeV(c, x - 7, y + 4.4, w + 14, 6, 0.24, 0, '0,0,0');
  // cornice
  const cy = bot - 8;
  const cg = c.createLinearGradient(0, cy, 0, bot); cg.addColorStop(0, shade(b.roof, 0.12)); cg.addColorStop(1, shade(b.roof, -0.45));
  c.fillStyle = cg; c.fillRect(x - 9, cy, w + 18, 8);
  c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x - 9, cy, w + 18, 1.1);
  c.fillStyle = shade(b.roof, 0.32);
  for (let dx = x - 5; dx < x + w + 3; dx += 8) c.fillRect(dx, cy + 2.2, 4.4, 3.2);
  c.fillStyle = 'rgba(0,0,0,.4)'; for (let dx = x - 5; dx < x + w + 3; dx += 8) c.fillRect(dx, cy + 5.4, 4.4, 1);
  // the overhang shadow cast down the facade, broken into a comb by the dentils
  wFadeV(c, x, bot, w, 22, 0.4, 0, '10,10,28');
  c.fillStyle = 'rgba(10,10,28,.14)'; for (let dx = x - 5; dx < x + w + 3; dx += 8) c.fillRect(dx, bot, 4.4, 9);
}
/* a rain pipe with bracket collars */
function wShSpout(c, x, y0, y1) {
  const g = c.createLinearGradient(x - 2, 0, x + 2, 0); g.addColorStop(0, '#9aa3aa'); g.addColorStop(0.45, '#c9d0d5'); g.addColorStop(1, '#5d666d');
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 1.6, y0, 2, y1 - y0);
  c.fillStyle = g; c.fillRect(x - 2, y0, 4, y1 - y0);
  c.fillStyle = '#3f4850'; for (let yy = y0 + 12; yy < y1 - 6; yy += 38) { c.fillRect(x - 2.8, yy, 5.6, 1.8); }
  c.fillStyle = '#6a737a'; c.fillRect(x - 3, y1 - 6, 6, 2); c.beginPath(); c.moveTo(x - 2, y1 - 4); c.lineTo(x + 2, y1 - 4); c.lineTo(x + 6, y1); c.lineTo(x - 2, y1); c.fill();
}
/* a hanging bracket sign's iron arm (the board is painted by the caller) */
function wShBracket(c, x, y, len) {
  c.strokeStyle = '#2a3036'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.moveTo(x + 2, y + 12); c.lineTo(x + len * 0.9, y); c.stroke();
  c.fillStyle = '#2a3036'; c.beginPath(); c.arc(x + 1.5, y, 2.2, 0, 7); c.fill();
}
/* iron fire stair for a narrow strip of wall: landings at each given y */
function wShFireStair(c, x, w, ys) {
  c.fillStyle = 'rgba(8,10,22,.24)'; c.fillRect(x + 2, ys[0] - 14, w, ys[ys.length - 1] - ys[0] + 18);
  ys.forEach((y, i) => {
    c.fillStyle = '#242b32'; c.fillRect(x - 1, y, w + 2, 2.4);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - 1, y, w + 2, 0.8);
    c.fillStyle = 'rgba(120,130,140,.5)'; for (let k = 0; k < w; k += 2.4) c.fillRect(x + k, y + 0.8, 0.8, 1.2);
    c.strokeStyle = '#242b32'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 1, y - 11); c.lineTo(x + w + 1, y - 11); c.moveTo(x - 1, y - 5.5); c.lineTo(x + w + 1, y - 5.5); c.stroke();
    c.fillStyle = '#242b32'; for (let k = 0; k <= w; k += 4) c.fillRect(x - 0.4 + k, y - 11, 0.9, 11);
    if (i < ys.length - 1) {
      const y2 = ys[i + 1], dir = i % 2 ? 1 : -1, x0 = dir > 0 ? x + 1 : x + w - 1, x1 = dir > 0 ? x + w - 1 : x + 1;
      c.strokeStyle = '#242b32'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x0, y + 2.4); c.lineTo(x1, y2); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0, y - 7); c.lineTo(x1, y2 - 9); c.stroke();
      c.strokeStyle = 'rgba(120,130,140,.45)'; c.lineWidth = 0.8; for (let k = 1; k < 5; k++) { const t = k / 5; c.beginPath(); c.moveTo(x0 + (x1 - x0) * t - 2.5, y + 2.4 + (y2 - y - 2.4) * t); c.lineTo(x0 + (x1 - x0) * t + 2.5, y + 2.4 + (y2 - y - 2.4) * t); c.stroke(); }
    }
  });
}
