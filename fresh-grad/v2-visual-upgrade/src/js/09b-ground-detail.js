/* ============================ ground detail painters ============================
   Painted once per cached chunk. Everything is a function of world coordinates (hash01 of a cell), never of the chunk,
   so features that straddle a chunk edge line up exactly. */
const W_PARK_RECTS = [
  [FOUNTAIN.x - 28, PARK_Y + 2, 56, FOUNTAIN.y - PARK_Y], [80, FOUNTAIN.y - 14, WORLD.w - 160, 28], [780, PARK_Y + 2, 40, 700], [2040, PARK_Y + 2, 40, 700]
];
function wOnPath(x, y, grow) {
  for (const r of W_PARK_RECTS) if (x > r[0] - grow && x < r[0] + r[2] + grow && y > r[1] - grow && y < r[1] + r[3] + grow) return true;
  const ex = (x - FOUNTAIN.x) / (190 + grow), ey = (y - FOUNTAIN.y) / (124 + grow);
  return ex * ex + ey * ey < 1;
}
function wVis(x0, y0, x1, y1, x, y, m) { return x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m; }

/* a run of paving slabs over a rectangle: per-slab tone, joints, hairline cracks, stains and gum */
function wSlabs(c, ax, ay, aw, ah, vx0, vy0, vx1, vy1, sw, sh, bond, seed) {
  const x0 = Math.max(ax, vx0), x1 = Math.min(ax + aw, vx1), y0 = Math.max(ay, vy0), y1 = Math.min(ay + ah, vy1);
  if (x1 <= x0 || y1 <= y0) return;
  c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
  const row0 = Math.floor((y0 - ay) / sh), row1 = Math.floor((y1 - 1 - ay) / sh);
  for (let row = row0; row <= row1; row++) {
    const off = bond && row % 2 ? sw / 2 : 0, y = ay + row * sh;
    const col0 = Math.floor((x0 - ax - off) / sw) - 1, col1 = Math.floor((x1 - 1 - ax - off) / sw);
    for (let col = col0; col <= col1; col++) {
      const x = ax + off + col * sw, h = hash01(col, row, seed), h2 = hash01(col, row, seed + 1), h3 = hash01(col, row, seed + 2), h4 = hash01(col, row, seed + 3);
      if (x + sw < x0 || x > x1) continue;
      c.fillStyle = h < 0.5 ? 'rgba(70,58,40,' + (h * 0.12).toFixed(3) + ')' : 'rgba(255,252,240,' + ((h - 0.5) * 0.22).toFixed(3) + ')';
      c.fillRect(x, y, sw, sh);
      if (h4 < 0.35) { const q = c.createLinearGradient(x, y, x + sw, y + sh); q.addColorStop(0, 'rgba(255,255,255,.07)'); q.addColorStop(1, 'rgba(0,0,0,.05)'); c.fillStyle = q; c.fillRect(x, y, sw, sh); }
      if (h3 < 0.22) { c.fillStyle = 'rgba(58,46,34,' + (0.05 + h * 0.08).toFixed(3) + ')'; c.beginPath(); c.ellipse(x + sw * (0.2 + h2 * 0.6), y + sh * (0.2 + h4 * 0.6), 5 + h * 12, 3 + h2 * 7, h * 3, 0, 7); c.fill(); }
      if (h2 < 0.1) {
        c.strokeStyle = 'rgba(62,52,44,.4)'; c.lineWidth = 0.8; c.beginPath();
        let px = x + sw * (0.15 + h * 0.7), py = y; c.moveTo(px, py);
        for (let k = 0; k < 3; k++) { px += (h3 - 0.5) * 12 + (k - 1) * 3; py += 6 + h4 * 7; c.lineTo(px, py); } c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + sw * (0.15 + h * 0.7) + 0.8, y); c.lineTo(px + 0.8, py); c.stroke();
      }
      if (h4 > 0.9) { c.fillStyle = 'rgba(96,86,86,.55)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + 6 + hash01(col, row, seed + 7 + k) * (sw - 12), y + 6 + hash01(col, row, seed + 9 + k) * (sh - 12), 0.7 + k * 0.25, 0, 7); c.fill(); } }
      if (h2 > 0.93) { c.fillStyle = 'rgba(80,120,70,.5)'; c.fillRect(x + sw * h, y, 1.2, 2.4); c.fillRect(x + sw * h + 1.6, y, 1, 1.8); }
    }
    for (let col = col0; col <= col1; col++) {
      const x = ax + off + col * sw, expo = !bond && (col % 4 === 0);
      c.fillStyle = expo ? 'rgba(46,36,28,.55)' : 'rgba(80,70,56,.34)'; c.fillRect(x - (expo ? 1.2 : 0.7), y, expo ? 2.4 : 1.4, sh);
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + (expo ? 1.2 : 0.7), y, 0.9, sh);
    }
    c.fillStyle = 'rgba(80,70,56,.34)'; c.fillRect(x0, y - 0.7, x1 - x0, 1.4); c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x0, y + 0.7, x1 - x0, 0.9);
  }
  c.restore();
}
function wStripe(c, x, y, w, h, seed) {
  c.fillStyle = 'rgba(255,255,255,.88)'; c.fillRect(x, y, w, h);
  const n = Math.max(3, Math.floor(w * h / 14));
  for (let i = 0; i < n; i++) { c.fillStyle = 'rgba(66,74,84,' + (0.25 + hash01(seed, i, 3) * 0.4).toFixed(3) + ')'; c.fillRect(x + hash01(seed, i, 1) * w, y + hash01(seed, i, 2) * h, 0.8 + hash01(seed, i, 4) * 1.6, 0.8 + hash01(seed, i, 5) * 1.4); }
  c.fillStyle = 'rgba(30,34,40,.16)'; c.fillRect(x, y + h - 0.8, w, 0.8); c.fillRect(x + w - 0.8, y, 0.8, h);
}
function wArrow(c, x, y, dir) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  c.fillStyle = 'rgba(232,232,226,.5)'; c.fillRect(-12, -1.8, 15, 3.6); c.beginPath(); c.moveTo(3, -5.6); c.lineTo(12, 0); c.lineTo(3, 5.6); c.fill();
  c.fillStyle = 'rgba(66,74,84,.55)'; for (let i = 0; i < 14; i++) c.fillRect(-12 + hash01(x | 0, y | 0, i) * 24, -5 + hash01(x | 0, y | 0, i + 20) * 10, 1.4, 1);
  c.restore();
}
function wManhole(c, mh, i) {
  const x = mh.x, y = mh.y, t = i % 3;
  c.fillStyle = 'rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(x, y + 0.9, 11, 6, 0, 0, 7); c.fill();
  if (t === 2) {
    c.fillStyle = '#3a4048'; c.fillRect(x - 11, y - 4.4, 22, 8.8);
    const g = c.createLinearGradient(x - 9, y - 3, x + 9, y + 3); g.addColorStop(0, '#5a636c'); g.addColorStop(1, '#2d343b'); c.fillStyle = g; c.fillRect(x - 9.4, y - 3.4, 18.8, 6.8);
    c.fillStyle = 'rgba(255,255,255,.22)'; for (let k = 0; k < 6; k++) c.fillRect(x - 7 + k * 2.6, y - 2.2, 1, 1); for (let k = 0; k < 6; k++) c.fillRect(x - 7 + k * 2.6, y + 1, 1, 1);
    c.fillStyle = 'rgba(210,216,222,.4)'; for (let k = 0; k < 5; k++) c.fillRect(x - 6 + k * 3, y - 0.5, 2, 0.9);
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 0.8; c.strokeRect(x - 9.4, y - 3.4, 18.8, 6.8);
    return;
  }
  c.fillStyle = '#3a4048'; c.beginPath(); c.ellipse(x, y, 10.4, 5.6, 0, 0, 7); c.fill();
  const g = c.createRadialGradient(x - 2, y - 1.5, 1, x, y, 10); g.addColorStop(0, '#5a636c'); g.addColorStop(1, '#262c32');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 8.8, 4.7, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y, 8.8, 4.7, 0, 3.3, 5.9); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.9;
  if (t === 0) { c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; c.moveTo(x + Math.cos(a) * 2.6, y + Math.sin(a) * 1.4); c.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 4.3); } c.stroke(); c.beginPath(); c.ellipse(x, y, 4, 2.2, 0, 0, 7); c.stroke(); }
  else { for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(x, y, k * 2.3, k * 1.25, 0, 0, 7); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; c.fillRect(x + Math.cos(a) * 6.2 - 0.5, y + Math.sin(a) * 3.3 - 0.4, 1, 0.9); } }
}
/* the bay of roads between two y values: aggregate sheen, patches, cracks, oil and worn paint */
function wRoadWear(c, r, x0, x1, vy0, vy1) {
  if (r.y > vy1 || r.y + r.h < vy0) return;
  // polished wheel tracks
  c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x0, r.y + 20, x1 - x0, 4); c.fillRect(x0, r.y + 56, x1 - x0, 4);
  c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(x0, r.y + 14, x1 - x0, 2); c.fillRect(x0, r.y + 50, x1 - x0, 2);
  const c0 = Math.floor(x0 / 260) - 1, c1 = Math.floor(x1 / 260) + 1;
  for (let ci = c0; ci <= c1; ci++) {
    const h = hash01(ci, r.y, 11), h2 = hash01(ci, r.y, 12), h3 = hash01(ci, r.y, 13), bx = ci * 260 + h * 200;
    if (inCross(bx - 40, bx + 90)) continue;
    if (h2 < 0.34) {
      const pw = 34 + h3 * 40, ph = 14 + h * 12, py = r.y + 12 + h2 * 3 * (r.h - 48);
      c.fillStyle = h3 < 0.5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.035)'; c.fillRect(bx, py, pw, ph);
      c.strokeStyle = 'rgba(16,18,22,.38)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, py + 0.5, pw - 1, ph - 1);
      c.strokeStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.moveTo(bx + 1, py + ph + 1); c.lineTo(bx + pw, py + ph + 1); c.stroke();
    }
    if (h3 < 0.5) {
      c.strokeStyle = 'rgba(14,16,20,.34)'; c.lineWidth = 0.9; c.beginPath(); let px = bx + 30, py = r.y + 8 + h * (r.h - 16); c.moveTo(px, py);
      for (let k = 0; k < 6; k++) { px += 6 + hash01(ci, k, 31) * 9; py += (hash01(ci, k, 32) - 0.5) * 8; c.lineTo(px, py); } c.stroke();
    }
    if (h < 0.4) { c.fillStyle = 'rgba(10,12,16,' + (0.12 + h2 * 0.1).toFixed(3) + ')'; c.beginPath(); c.ellipse(bx + 60, r.y + (h3 < 0.5 ? 22 : 58) + (h - 0.2) * 8, 9 + h2 * 14, 3.4 + h * 3, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(120,100,160,.05)'; c.beginPath(); c.ellipse(bx + 59, r.y + (h3 < 0.5 ? 22 : 58) + (h - 0.2) * 8 - 1, 6 + h2 * 9, 2, 0, 0, 7); c.fill(); }
  }
}
/* yellow centre dashes with chipped paint */
function wDash(c, x, y, w, h, seed) {
  c.fillStyle = 'rgba(236,214,140,.92)'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,248,210,.25)'; c.fillRect(x, y, w, 1);
  for (let i = 0; i < Math.floor(w * h / 16); i++) { c.fillStyle = 'rgba(64,72,82,' + (0.3 + hash01(seed, i, 3) * 0.4).toFixed(3) + ')'; c.fillRect(x + hash01(seed, i, 1) * w, y + hash01(seed, i, 2) * h, 0.8 + hash01(seed, i, 4) * 1.5, 0.8 + hash01(seed, i, 5) * 1.2); }
}
function wTactile(c, x, y, w, h) {
  c.fillStyle = '#e8b830'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y + h - 0.8, w, 0.8);
  for (let xx = x + 2; xx < x + w - 1; xx += 3.2) for (let yy = y + 2; yy < y + h - 1; yy += 3.2) { c.fillStyle = 'rgba(255,240,170,.9)'; c.beginPath(); c.arc(xx, yy, 0.9, 0, 7); c.fill(); c.fillStyle = 'rgba(100,70,0,.35)'; c.beginPath(); c.arc(xx + 0.6, yy + 0.7, 0.8, 0, 7); c.fill(); }
}
function wDrain(c, x, y) {
  c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x - 9, y - 2.4, 18, 5.6); c.fillStyle = '#3a4048'; c.fillRect(x - 9, y - 3, 18, 5.6);
  c.fillStyle = '#12161a'; for (let k = 0; k < 6; k++) c.fillRect(x - 7.6 + k * 2.7, y - 2, 1.5, 3.6);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - 9, y - 3, 18, 0.8);
}
/* all the road furniture painted on the asphalt and curbs */
function wRoadDetail(c, x0, y0, x1, y1) {
  const W = WORLD.w, R1b = ROAD1.y + ROAD1.h, R2b = ROAD2.y + ROAD2.h;
  ROADS_H.forEach(r => wRoadWear(c, r, x0, x1, y0, y1));
  // curb: chips, joints, painted sections, drain grates
  ROADS_H.forEach(r => {
    if (r.y - 12 > y1 || r.y + r.h + 16 < y0) return;
    for (let x = Math.floor(x0 / 90) * 90; x < x1 + 90; x += 90) {
      const h = hash01(x, r.y, 21);
      c.fillStyle = 'rgba(70,60,50,.4)'; c.fillRect(x + h * 20, r.y - 5, 1, 3.5); c.fillRect(x + 40 + h * 20, r.y + r.h, 1, 3.5);
      if (h < 0.22) { c.fillStyle = 'rgba(60,52,44,.55)'; c.fillRect(x + 50 + h * 120, r.y - 4.6, 2.4, 1.6); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 50 + h * 120, r.y - 5, 3, 0.8); }
      if (h > 0.84) { c.fillStyle = 'rgba(60,52,44,.5)'; c.fillRect(x + 20 + h * 30, r.y + r.h + 1, 2.4, 1.6); }
    }
    for (let x = Math.floor(x0 / 240) * 240; x < x1 + 240; x += 240) {
      const dx = x + 90 + hash01(x, r.y, 23) * 60;
      if (inCross(dx - 20, dx + 20)) continue;
      wDrain(c, dx, r.y + 4); wDrain(c, dx + 120, r.y + r.h - 4.4);
    }
    // painted kerb: red beside every hydrant, yellow at each corner
    PROPS.forEach(p => { if (p.t !== 'hydrant') return; const south = p.y > r.y + r.h; if (Math.abs(p.y - (south ? r.y + r.h + 13 : r.y - 7)) > 3) return; const sy = south ? r.y + r.h : r.y - 5; if (p.x > x0 - 30 && p.x < x1 + 30) { c.fillStyle = 'rgba(214,64,52,.9)'; c.fillRect(p.x - 18, sy, 36, 3.6); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(p.x - 18, sy, 36, 0.9); } });
  });
  INTERSECTIONS.forEach(it => {
    if (it.x1 < x0 - 120 || it.x0 > x1 + 120 || it.y1 < y0 - 120 || it.y0 > y1 + 120) return;
    const hh = it.y1 - it.y0, ww = it.x1 - it.x0;
    // faded turn arrows on the approaches
    wArrow(c, it.x0 - 110, it.y0 + 22, 1); wArrow(c, it.x1 + 110, it.y0 + 58, -1);
    // tactile paving at both ends of every zebra
    wTactile(c, it.x0 - 44, it.y0 - 12, 36, 7); wTactile(c, it.x0 - 44, it.y1 + 5, 36, 7); wTactile(c, it.x1 + 8, it.y0 - 12, 36, 7); wTactile(c, it.x1 + 8, it.y1 + 5, 36, 7);
    wTactile(c, it.x0 - 12, it.y0 - 46, 7, 36); wTactile(c, it.x1 + 5, it.y0 - 46, 7, 36); wTactile(c, it.x0 - 12, it.y1 + 8, 7, 36); wTactile(c, it.x1 + 5, it.y1 + 8, 7, 36);
    // tyre scuffs where cars stop
    c.fillStyle = 'rgba(8,10,14,.12)'; for (let k = 0; k < 6; k++) { c.fillRect(it.x0 - 66 - k * 3, it.y0 + 15 + (k % 2) * 3, 12, 1.4); c.fillRect(it.x1 + 54 + k * 3, it.y0 + 51 + (k % 2) * 3, 12, 1.4); }
  });
  // manholes and utility covers
  MANHOLES.forEach((mh, i) => { if (mh.x > x0 - 20 && mh.x < x1 + 20 && mh.y > y0 - 12 && mh.y < y1 + 12) wManhole(c, mh, i); });
}

/* ---------- the park ---------- */
function wParkGrass(c, x0, y0, x1, y1) {
  const H = WORLD.h, W = WORLD.w;
  // broad tone drift in 150 px cells
  const gx0 = Math.floor(x0 / 150) - 1, gx1 = Math.floor(x1 / 150) + 1, gy0 = Math.floor(Math.max(y0, PARK_Y) / 150) - 1, gy1 = Math.floor(y1 / 150) + 1;
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash01(gx, gy, 81), h2 = hash01(gx, gy, 82), px = gx * 150 + h * 150, py = gy * 150 + h2 * 150, pr = 90 + hash01(gx, gy, 83) * 90;
    const dark = h2 < 0.5, q = c.createRadialGradient(px, py, 0, px, py, pr);
    q.addColorStop(0, dark ? 'rgba(20,90,50,.13)' : 'rgba(200,240,130,.12)'); q.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = q; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  // mowing stripes with soft shoulders
  for (let x = Math.floor(x0 / 112) * 112; x < x1; x += 112) {
    const q = c.createLinearGradient(x, 0, x + 56, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(0.2, 'rgba(255,255,255,.05)'); q.addColorStop(0.8, 'rgba(255,255,255,.05)'); q.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = q; c.fillRect(x, PARK_Y, 56, H - PARK_Y);
  }
  patFill(c, 'grass', x0, PARK_Y, x1 - x0, H - PARK_Y);
  // clover, dandelions and bare patches, one decision per 48 px cell
  const cx0 = Math.floor(x0 / 48) - 1, cx1 = Math.floor(x1 / 48) + 1, cy0 = Math.max(Math.floor(y0 / 48) - 1, Math.floor(PARK_Y / 48)), cy1 = Math.floor(y1 / 48) + 1;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const h = hash01(cx, cy, 91), px = cx * 48 + hash01(cx, cy, 92) * 48, py = cy * 48 + hash01(cx, cy, 93) * 48;
    if (py < PARK_Y + 22 || py > H - 6 || wOnPath(px, py, 6)) continue;
    if (h < 0.1) { c.fillStyle = 'rgba(60,150,80,.34)'; for (let k = 0; k < 7; k++) { const a = hash01(cx, cy, 94 + k) * 6.28, d = hash01(cx, cy, 104 + k) * 9; const lx = px + Math.cos(a) * d, ly = py + Math.sin(a) * d * 0.6; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(lx + Math.cos(j * 2.1) * 1.5, ly + Math.sin(j * 2.1) * 1.2, 1.3, 0, 7); c.fill(); } } }
    else if (h < 0.16) { c.strokeStyle = 'rgba(60,130,60,.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(px, py + 3); c.lineTo(px + 0.4, py); c.stroke(); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(px, py - 0.4, 1.7, 0, 7); c.fill(); c.fillStyle = 'rgba(210,225,210,.8)'; c.beginPath(); c.arc(px - 0.5, py - 0.9, 0.6, 0, 7); c.fill(); }
    else if (h < 0.2) { c.strokeStyle = 'rgba(60,130,60,.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(px, py + 3); c.lineTo(px, py); c.stroke(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(px, py - 0.3, 1.8, 0, 7); c.fill(); c.fillStyle = '#f0a000'; c.beginPath(); c.arc(px + 0.4, py, 0.8, 0, 7); c.fill(); }
    else if (h > 0.97) { c.fillStyle = 'rgba(150,120,80,.22)'; c.beginPath(); c.ellipse(px, py, 7, 3, 0, 0, 7); c.fill(); }
  }
  // worn desire lines cutting the corners of the paths
  [[[1200, 1596], [1050, 1700], [880, 1790]], [[1820, 1596], [1960, 1690], [2090, 1810]], [[800, 1400], [700, 1340], [560, 1300]], [[2060, 1370], [2200, 1334], [2390, 1304]], [[1280, 1590], [1180, 1500], [1180, 1420]]].forEach((p, pi) => {
    const minx = Math.min(p[0][0], p[2][0]) - 30, maxx = Math.max(p[0][0], p[2][0]) + 30, miny = Math.min(p[0][1], p[2][1]) - 30, maxy = Math.max(p[0][1], p[2][1]) + 30;
    if (maxx < x0 || minx > x1 || maxy < y0 || miny > y1) return;
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = k < 2 ? 'rgba(176,146,96,' + (0.16 - k * 0.04).toFixed(3) + ')' : 'rgba(196,166,116,.22)'; c.lineWidth = 11 - k * 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.quadraticCurveTo(p[1][0] + (k - 1) * 2, p[1][1], p[2][0], p[2][1]); c.stroke();
    }
    c.lineCap = 'butt';
    for (let t = 0; t < 1; t += 0.03) { const u = 1 - t, tx = u * u * p[0][0] + 2 * u * t * p[1][0] + t * t * p[2][0], ty = u * u * p[0][1] + 2 * u * t * p[1][1] + t * t * p[2][1]; c.fillStyle = 'rgba(70,130,60,.5)'; c.fillRect(tx + (hash01(pi, t * 100 | 0, 5) - 0.5) * 14, ty + (hash01(pi, t * 100 | 0, 6) - 0.5) * 8, 1, 2.4); }
  });
}
function wParkPaths(c, x0, y0, x1, y1) {
  const paths = gr => {
    c.beginPath();
    W_PARK_RECTS.forEach(r => c.rect(r[0] - gr, r[1] - (r === W_PARK_RECTS[1] ? gr : 0), r[2] + gr * 2, r[3] + (r === W_PARK_RECTS[1] ? gr * 2 : gr)));
    c.moveTo(FOUNTAIN.x + 190 + gr, FOUNTAIN.y); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190 + gr, 124 + gr, 0, 0, 6.2832);
  };
  paths(5); c.fillStyle = '#8f8160'; c.fill();
  paths(0); c.fillStyle = '#e2d6ba'; c.fill(); c.fillStyle = PAT.gravel; c.fill();
  c.save(); paths(0); c.clip();
  // worn centre line, inner edge shading, pebbles
  c.strokeStyle = 'rgba(255,248,226,.16)'; c.lineWidth = 12; paths(-2); c.stroke();
  c.strokeStyle = 'rgba(80,62,34,.26)'; c.lineWidth = 7; paths(0); c.stroke();
  const gx0 = Math.floor(x0 / 12), gx1 = Math.floor(x1 / 12), gy0 = Math.floor(Math.max(y0, PARK_Y) / 12), gy1 = Math.floor(y1 / 12);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash01(gx, gy, 111); if (h > 0.2) continue;
    const px = gx * 12 + hash01(gx, gy, 112) * 12, py = gy * 12 + hash01(gx, gy, 113) * 12;
    if (!wOnPath(px, py, 0)) continue;
    c.fillStyle = h < 0.08 ? 'rgba(255,252,240,.55)' : h < 0.14 ? 'rgba(120,98,66,.5)' : 'rgba(200,170,120,.45)'; c.beginPath(); c.ellipse(px, py, 1.3 + h * 5, 0.9 + h * 3, h * 9, 0, 7); c.fill();
  }
  c.restore();
  // stone edging along the borders (skipping where one path runs into another)
  const stone = (px, py, rx, ry, rot, seed) => {
    const t = hash01(seed, px | 0, 7), col = t < 0.33 ? '#b9ae96' : t < 0.66 ? '#a39880' : '#c7bda6';
    c.fillStyle = 'rgba(40,32,20,.3)'; c.beginPath(); c.ellipse(px + 0.6, py + 1.3, rx, ry, rot, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(px, py, rx, ry, rot, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(px - rx * 0.25, py - ry * 0.35, rx * 0.55, ry * 0.4, rot, 0, 7); c.fill();
  };
  W_PARK_RECTS.forEach((r, ri) => {
    const edges = [[r[0], r[1], r[0] + r[2], r[1], 0, -1], [r[0], r[1] + r[3], r[0] + r[2], r[1] + r[3], 0, 1], [r[0], r[1], r[0], r[1] + r[3], -1, 0], [r[0] + r[2], r[1], r[0] + r[2], r[1] + r[3], 1, 0]];
    edges.forEach((e, ei) => {
      const horiz = e[1] === e[3], len = horiz ? e[2] - e[0] : e[3] - e[1], a0 = horiz ? e[0] : e[1];
      for (let s = 0; s < len; s += 8.5) {
        const j = hash01(ri * 9 + ei, s | 0, 3), pos = a0 + s + j * 2;
        const px = horiz ? pos : e[0] + e[4] * 3.2, py = horiz ? e[1] + e[5] * 3.2 : pos;
        if (px < x0 - 6 || px > x1 + 6 || py < y0 - 6 || py > y1 + 6 || py < PARK_Y + 4) continue;
        if (wOnPath(px, py, 0)) continue;
        stone(px, py, horiz ? 4 + j * 1.6 : 2.6 + j, horiz ? 2.5 + j : 4 + j * 1.6, 0, ri * 9 + ei);
      }
    });
  });
  for (let a = 0; a < 6.2832; a += 0.052) {
    const j = hash01(7, (a * 100) | 0, 3), px = FOUNTAIN.x + Math.cos(a) * 195, py = FOUNTAIN.y + Math.sin(a) * 128;
    if (px < x0 - 6 || px > x1 + 6 || py < y0 - 6 || py > y1 + 6) continue;
    let inRect = false; for (const r of W_PARK_RECTS) if (px > r[0] - 3 && px < r[0] + r[2] + 3 && py > r[1] - 3 && py < r[1] + r[3] + 3) inRect = true;
    if (inRect) continue;
    stone(px, py, 4.4 + j * 1.6, 2.6 + j, Math.atan2(Math.cos(a) * 128, -Math.sin(a) * 195), 40);
  }
}
/* the plaza: radial cut stone with inlaid rings */
function wPlaza(c, x0, y0, x1, y1) {
  const F = FOUNTAIN;
  if (F.x + 160 < x0 || F.x - 160 > x1 || F.y + 104 < y0 || F.y - 104 > y1) return;
  c.save(); c.translate(F.x, F.y); c.scale(1, 0.64);
  // rim and base
  c.fillStyle = '#8a8272'; c.beginPath(); c.arc(0, 0, 154, 0, 7); c.fill();
  c.fillStyle = '#d2cbbd'; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill();
  const rings = [[78, 112, 24, 0], [112, 150, 36, 1]];
  rings.forEach(rg => {
    for (let i = 0; i < rg[2]; i++) {
      const a0 = i / rg[2] * 6.2832, a1 = (i + 1) / rg[2] * 6.2832, h = hash01(i, rg[0], 33);
      c.fillStyle = h < 0.5 ? 'rgba(80,66,44,' + (h * 0.18).toFixed(3) + ')' : 'rgba(255,252,238,' + ((h - 0.5) * 0.3).toFixed(3) + ')';
      c.beginPath(); c.arc(0, 0, rg[1], a0, a1); c.arc(0, 0, rg[0], a1, a0, true); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,80,60,.28)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(Math.cos(a0) * rg[0], Math.sin(a0) * rg[0]); c.lineTo(Math.cos(a0) * rg[1], Math.sin(a0) * rg[1]); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(Math.cos(a0 + 0.012) * rg[0], Math.sin(a0 + 0.012) * rg[0]); c.lineTo(Math.cos(a0 + 0.012) * rg[1], Math.sin(a0 + 0.012) * rg[1]); c.stroke();
    }
  });
  // centre disc with a star
  c.fillStyle = '#c4bcab'; c.beginPath(); c.arc(0, 0, 78, 0, 7); c.fill();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, h = hash01(i, 5, 34); c.fillStyle = h < 0.5 ? 'rgba(80,66,44,.1)' : 'rgba(255,252,238,.16)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 78, a, a + 0.3927); c.closePath(); c.fill(); }
  if (PAT.paver) { c.globalAlpha = 0.35; c.fillStyle = PAT.paver; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill(); c.globalAlpha = 1; }
  // inlay bands in a darker stone
  [[78, 3.4], [112, 3], [150, 3.6], [96, 1.2]].forEach(b => { c.strokeStyle = 'rgba(70,62,50,.55)'; c.lineWidth = b[1]; c.beginPath(); c.arc(0, 0, b[0], 0, 7); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.9; c.beginPath(); c.arc(0, 0, b[0] - b[1] / 2 - 0.6, 3.5, 5.5); c.stroke(); });
  c.restore();
}
/* mulch beds with real flowers: a border along the park gate side and crescents around the plaza */
function wFlowerBed(c, pts, seed, wid) {
  c.strokeStyle = '#4a3220'; c.lineWidth = wid + 3; c.lineCap = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
  c.strokeStyle = '#5e4128'; c.lineWidth = wid; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.lineCap = 'butt';
  const pal = ['#ff6f91', '#ffd166', '#f8f9fa', '#c77dff', '#ff9a4d', '#e63946', '#6fb7ff'];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(len / 6));
    for (let k = 0; k < n; k++) {
      const t = (k + hash01(seed, i * 50 + k, 1)) / n, px = a[0] + (b[0] - a[0]) * t + (hash01(seed, i * 50 + k, 2) - 0.5) * wid * 0.8, py = a[1] + (b[1] - a[1]) * t + (hash01(seed, i * 50 + k, 3) - 0.5) * wid * 0.6;
      const h = hash01(seed, i * 50 + k, 4);
      if (h < 0.3) { c.fillStyle = '#3f9a55'; c.beginPath(); c.ellipse(px, py, 3.2, 2.2, h * 6, 0, 7); c.fill(); c.fillStyle = '#58b468'; c.beginPath(); c.ellipse(px - 0.8, py - 0.8, 1.6, 1, h * 6, 0, 7); c.fill(); continue; }
      const col = pal[Math.floor(hash01(seed, i * 50 + k, 5) * pal.length)], pr = 1.3 + h * 1.4;
      c.fillStyle = '#3f9a55'; c.fillRect(px - 0.4, py, 0.9, 3.4);
      c.fillStyle = col; for (let q = 0; q < 5; q++) { const an = q / 5 * 6.283 + h * 6; c.beginPath(); c.arc(px + Math.cos(an) * pr, py + Math.sin(an) * pr, pr * 0.8, 0, 7); c.fill(); }
      c.fillStyle = shade(col, -0.2); c.beginPath(); c.arc(px + 0.3, py + 0.3, pr * 0.5, 0, 7); c.fill(); c.fillStyle = col === '#ffd166' ? '#c0702a' : '#ffe08a'; c.beginPath(); c.arc(px, py, pr * 0.4, 0, 7); c.fill();
    }
  }
}
function wParkBeds(c, x0, y0, x1, y1) {
  const F = FOUNTAIN, H = WORLD.h;
  if (y1 < PARK_Y) return;
  // a border along the sidewalk edge, broken for the gate and the paths
  [[60, 770], [830, 1390], [1610, 2030], [2090, 2940]].forEach((s, si) => {
    if (s[1] < x0 - 10 || s[0] > x1 + 10 || PARK_Y + 20 < y0 - 20) return;
    const pts = []; for (let x = s[0]; x <= s[1]; x += 40) pts.push([x, PARK_Y + 13 + Math.sin(x * 0.02) * 1.6]);
    wFlowerBed(c, pts, 200 + si, 9);
  });
  // crescents round the plaza
  [0.6, 1.1, 2.1, 2.55, 3.7, 4.2, 5.2, 5.75].forEach((a0, i) => {
    const pts = []; for (let k = 0; k <= 6; k++) { const a = a0 + k * 0.07; pts.push([F.x + Math.cos(a) * 214, F.y + Math.sin(a) * 140]); }
    const mx = pts[3][0], my = pts[3][1]; if (mx < x0 - 60 || mx > x1 + 60 || my < y0 - 40 || my > y1 + 40) return;
    let bad = false; pts.forEach(p => { if (wOnPath(p[0], p[1], 8)) bad = true; }); if (bad) return;
    wFlowerBed(c, pts, 300 + i, 8);
  });
}
function wBlanket(c, bl, i) {
  c.fillStyle = 'rgba(20,50,20,.22)'; c.save(); c.translate(bl.x, bl.y); c.transform(1, 0, -0.25, 0.62, 0, 0); c.fillRect(-27, -17, 60, 46);
  c.fillStyle = '#f8f4ea'; c.fillRect(-30, -22, 60, 44);
  c.fillStyle = bl.c; for (let a = 0; a < 12; a++) for (let b2 = 0; b2 < 8; b2++) if ((a + b2) % 2) c.fillRect(-30 + a * 5, -22 + b2 * 5.5, 5, 5.5);
  c.fillStyle = 'rgba(0,0,0,.08)'; for (let a = 0; a < 12; a++) for (let b2 = 0; b2 < 8; b2++) if ((a + b2) % 2 === 0 && (a + b2) % 4 === 0) c.fillRect(-30 + a * 5, -22 + b2 * 5.5, 5, 5.5);
  c.strokeStyle = shade(bl.c, -0.25); c.lineWidth = 1.4; c.strokeRect(-29.3, -21.3, 58.6, 42.6);
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-26 + k * 15, -20 + (k % 2) * 4); c.quadraticCurveTo(-18 + k * 14, -4, -22 + k * 16, 18); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(-28, -8); c.quadraticCurveTo(-8, -4, 10, -12); c.stroke();
  c.restore();
  // a wicker basket, plates, a loaf and a drink on top
  const bx = bl.x, by = bl.y;
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx + 5, by + 1, 9, 3, 0, 0, 7); c.fill();
  const wg = c.createLinearGradient(0, by - 9, 0, by); wg.addColorStop(0, '#c99a5c'); wg.addColorStop(1, '#8f6232'); c.fillStyle = wg; rr(c, bx - 4, by - 9, 15, 9, 2); c.fill();
  c.strokeStyle = 'rgba(70,40,10,.4)'; c.lineWidth = 0.7; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(bx - 3, by - 7.5 + k * 2.2); c.lineTo(bx + 10, by - 7.5 + k * 2.2); c.stroke(); } for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(bx - 2.4 + k * 2.4, by - 9); c.lineTo(bx - 2.4 + k * 2.4, by); c.stroke(); }
  c.strokeStyle = '#8a5d34'; c.lineWidth = 1.5; c.beginPath(); c.arc(bx + 3.5, by - 9, 5, Math.PI, 0); c.stroke();
  c.fillStyle = '#c0392b'; c.beginPath(); c.arc(bx - 12, by - 2, 2.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(bx - 12.8, by - 3, 0.8, 0, 7); c.fill();
  c.fillStyle = '#f6f1e7'; c.beginPath(); c.ellipse(bx + 17, by + 2, 4.4, 1.8, 0, 0, 7); c.fill(); c.fillStyle = '#d99a4a'; c.beginPath(); c.ellipse(bx + 17, by + 1.4, 3, 1.1, 0, 0, 7); c.fill();
  c.fillStyle = i % 2 ? '#3d7ea6' : '#e76f51'; c.fillRect(bx - 18, by + 3, 2.4, 5); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(bx - 18, by + 3, 0.8, 5);
}
function wFlowerDot(c, f) {
  c.strokeStyle = 'rgba(40,120,60,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(f.x + 1.5, f.y + 6); c.lineTo(f.x + 1.5, f.y + 1.5); c.stroke();
  c.fillStyle = 'rgba(40,120,60,.6)'; c.beginPath(); c.ellipse(f.x + 3, f.y + 4.5, 1.8, 0.8, -0.5, 0, 7); c.fill();
  c.fillStyle = f.c; for (let q = 0; q < 5; q++) { const an = q / 5 * 6.283 + f.x; c.beginPath(); c.arc(f.x + 1.5 + Math.cos(an) * 1.5, f.y + 1.5 + Math.sin(an) * 1.5, 1.2, 0, 7); c.fill(); }
  c.fillStyle = f.c === '#ffd166' ? '#e07a3f' : '#ffe08a'; c.beginPath(); c.arc(f.x + 1.5, f.y + 1.5, 0.9, 0, 7); c.fill();
}
/* what sits at the foot of a tree: mulch and roots in the park, an iron grate on the pavement */
function wTreeBase(c, t) {
  if (t.y < PARK_Y) {
    const x = t.x, y = t.y;
    c.fillStyle = 'rgba(50,40,30,.4)'; c.fillRect(x - 15, y - 7, 30, 13); wFadeRound(c, x, y - 1, 15, 7);
    c.fillStyle = '#2f2f33'; c.fillRect(x - 14, y - 6, 28, 12);
    c.fillStyle = '#5a5a60'; c.fillRect(x - 14, y - 6, 28, 1.2); c.fillRect(x - 14, y - 6, 1.2, 12); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x - 14, y + 5, 28, 1);
    c.fillStyle = '#18181b'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) c.fillRect(x - 12 + i * 4.2, y - 4 + j * 3.6, 2.6, 2);
    c.fillStyle = '#6a4a2e'; c.beginPath(); c.ellipse(x, y - 0.5, 5.4, 2.4, 0, 0, 7); c.fill();
    return;
  }
  const x = t.x, y = t.y;
  c.fillStyle = 'rgba(40,28,18,.5)'; c.beginPath(); c.ellipse(x, y + 1, t.r * 0.62, t.r * 0.22, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(70,48,30,.65)'; c.beginPath(); c.ellipse(x, y + 0.5, t.r * 0.5, t.r * 0.17, 0, 0, 7); c.fill();
  c.strokeStyle = '#5a3d27'; c.lineWidth = 2.6; c.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const a = 0.3 + k * 1.6 + hash01(t.x | 0, k, 9); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * t.r * 0.55, y + Math.sin(a) * t.r * 0.2 + 1); c.stroke(); }
  c.lineCap = 'butt';
  c.fillStyle = 'rgba(190,150,100,.5)'; for (let k = 0; k < 14; k++) c.fillRect(x + (hash01(t.x | 0, k, 11) - 0.5) * t.r * 1.1, y + (hash01(t.x | 0, k, 12) - 0.3) * t.r * 0.3, 1.4, 1);
}
function wFadeRound(c, x, y, rx, ry) { /* soft contact ring around a tree pit */
  const q = c.createRadialGradient(x, y, Math.min(rx, ry) * 0.6, x, y, rx * 1.4); q.addColorStop(0, 'rgba(0,0,0,.18)'); q.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = q; c.fillRect(x - rx * 1.4, y - ry * 2, rx * 2.8, ry * 4);
}
/* the pond: shore stones, a graded bed and reflections */
function wPond(c, x0, y0, x1, y1) {
  const P = POND;
  if (P.x + P.rx + 30 < x0 || P.x - P.rx - 30 > x1 || P.y + P.ry + 30 < y0 || P.y - P.ry - 30 > y1) return;
  // damp grass and sandy shore
  const gg = c.createRadialGradient(P.x, P.y, P.rx * 0.8, P.x, P.y, P.rx + 26); gg.addColorStop(0, 'rgba(40,90,60,.45)'); gg.addColorStop(1, 'rgba(40,90,60,0)');
  c.fillStyle = gg; c.beginPath(); c.ellipse(P.x, P.y, P.rx + 26, P.ry + 20, 0, 0, 7); c.fill();
  c.fillStyle = '#d6c9a8'; c.beginPath(); c.ellipse(P.x, P.y, P.rx + 11, P.ry + 11, 0, 0, 7); c.fill();
  c.fillStyle = '#b3a37c'; c.beginPath(); c.ellipse(P.x, P.y + 1, P.rx + 4, P.ry + 4, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(90,70,40,.25)'; c.beginPath(); c.ellipse(P.x, P.y + 1.5, P.rx + 2, P.ry + 2, 0, 0, 7); c.fill();
  const wg = c.createRadialGradient(P.x - 10, P.y - 8, 10, P.x, P.y, P.rx);
  wg.addColorStop(0, '#1a5f94'); wg.addColorStop(0.45, '#2b82bd'); wg.addColorStop(0.8, '#55b4d6'); wg.addColorStop(1, '#8bd3d0');
  c.fillStyle = wg; c.beginPath(); c.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, 7); c.fill();
  c.save(); c.clip();
  // shallows glowing at the rim, depth patches, weed beds seen through the water
  const rg = c.createRadialGradient(P.x, P.y, P.rx * 0.7, P.x, P.y, P.rx); rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,248,210,.22)');
  c.fillStyle = rg; c.fillRect(P.x - P.rx, P.y - P.ry, P.rx * 2, P.ry * 2);
  c.fillStyle = 'rgba(10,50,90,.2)'; c.beginPath(); c.ellipse(P.x + 20, P.y + 8, P.rx * 0.5, P.ry * 0.45, 0, 0, 7); c.fill();
  for (let i = 0; i < 16; i++) { const a = hash01(i, 1, 121) * 6.28, d = 0.72 + hash01(i, 2, 122) * 0.2; c.fillStyle = 'rgba(40,120,80,.22)'; c.beginPath(); c.ellipse(P.x + Math.cos(a) * P.rx * d, P.y + Math.sin(a) * P.ry * d, 9 + hash01(i, 3, 123) * 12, 3 + hash01(i, 4, 124) * 4, a, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(P.x - 30, P.y - P.ry * 0.9, P.rx * 0.8, P.ry * 0.6, 0, 0, 7); c.fill();
  // soft mirror images of the reeds and shore stones
  for (let i = 0; i < 40; i++) { const a = hash01(i, 5, 125) * 6.28, px = P.x + Math.cos(a) * (P.rx - 4), py = P.y + Math.sin(a) * (P.ry - 3); c.fillStyle = 'rgba(30,60,50,.16)'; c.beginPath(); c.ellipse(px, py - 2 * Math.sin(a), 7, 2.6, 0, 0, 7); c.fill(); }
  c.restore();
  // shore stones all round, a little rounder and lighter on the sunny side
  const N = 86;
  for (let i = 0; i < N; i++) {
    const a = i / N * 6.2832 + (hash01(i, 6, 126) - 0.5) * 0.04, h = hash01(i, 7, 127), h2 = hash01(i, 8, 128);
    if (a > 2.45 && a < 3.45) continue;    // the reed bank
    const rx = 5 + h * 5.5, ry = 3 + h2 * 3, px = P.x + Math.cos(a) * (P.rx + 6 + h2 * 3), py = P.y + Math.sin(a) * (P.ry + 5.5 + h2 * 3);
    if (px < x0 - 12 || px > x1 + 12 || py < y0 - 12 || py > y1 + 12) continue;
    c.fillStyle = 'rgba(20,30,40,.35)'; c.beginPath(); c.ellipse(px + 1, py + 1.6, rx + 0.6, ry + 0.6, 0, 0, 7); c.fill();
    const sg = c.createLinearGradient(px, py - ry, px, py + ry); sg.addColorStop(0, h < 0.5 ? '#c0c5c8' : '#d3c9b6'); sg.addColorStop(1, h < 0.5 ? '#7d858b' : '#8e836f');
    c.fillStyle = sg; c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(px - rx * 0.25, py - ry * 0.3, rx * 0.5, ry * 0.35, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(40,110,60,.5)'; if (h2 > 0.7) { c.beginPath(); c.ellipse(px + rx * 0.2, py + ry * 0.4, rx * 0.45, ry * 0.3, 0, 0, 7); c.fill(); }
  }
}
