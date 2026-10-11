/* ============================ seasonal painters ============================ */
function wLeafAt(c, x, y, col, rot, s) {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 2.6 * s, 1.5 * s, rot, 0, 7); c.fill();
  c.strokeStyle = 'rgba(60,20,8,.3)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - Math.cos(rot) * 2.4 * s, y - Math.sin(rot) * 2.4 * s); c.lineTo(x + Math.cos(rot) * 2.4 * s, y + Math.sin(rot) * 2.4 * s); c.stroke();
}
function wLeafScatter(c, x0, y0, x1, y1, dens) {
  const cols = ['#d9822b', '#c0502a', '#e7b24a', '#a8432a', '#f0c35a', '#8a5a1e'];
  for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) for (let y = Math.floor(y0 / 14) * 14; y < y1; y += 14) {
    const v = hash01(x, y, 21); if (v > dens) continue;
    wLeafAt(c, x + hash01(x, y, 23) * 12, y + hash01(x, y, 24) * 12, cols[Math.floor(hash01(x, y, 22) * cols.length)], v * 9, 0.9 + hash01(x, y, 25) * 0.5);
  }
}
function wPetalScatter(c, x0, y0, x1, y1, dens) {
  for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) for (let y = Math.floor(y0 / 16) * 16; y < y1; y += 16) {
    const v = hash01(x, y, 31); if (v > dens) continue;
    const px = x + hash01(x, y, 32) * 14, py = y + hash01(x, y, 33) * 14;
    c.fillStyle = v < 0.04 ? '#ffd0e0' : '#ffffff'; c.beginPath(); c.ellipse(px, py, 1.7, 1, v * 40, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,200,215,.5)'; c.beginPath(); c.ellipse(px + 0.4, py + 0.3, 0.9, 0.5, v * 40, 0, 7); c.fill();
  }
}
/* leaf piles, petal drifts and dappled shade round each tree, on the pavement as well as in the park */
function wTreeLitter(c, se, x0, y0, x1, y1) {
  for (const t of TREES) {
    if (t.x < x0 - 40 || t.x > x1 + 40 || t.y < y0 - 20 || t.y > y1 + 40) continue;
    const park = t.y > PARK_Y, k = t.tone, seed = (t.x * 7 + t.y) | 0;
    if (se === 'autumn') {
      const pal = wTreePal(k, 'autumn'), cols = [pal.dk, pal.md, pal.lt, pal.md, '#8a5a1e'], n = park ? 26 : 12;
      for (let i = 0; i < n; i++) {
        const a = hash01(seed, i, 1) * 6.283, d = Math.sqrt(hash01(seed, i, 2)) * t.r * 1.15;
        wLeafAt(c, t.x + Math.cos(a) * d + 6, t.y + 5 + Math.sin(a) * d * 0.36, cols[i % cols.length], hash01(seed, i, 3) * 6, 1 + hash01(seed, i, 4) * 0.5);
      }
      for (let p = 0; p < 2; p++) { const px = t.x + (p ? 18 : -16) + (hash01(seed, p, 5) - 0.5) * 12, py = t.y + 8 + hash01(seed, p, 6) * 5; c.fillStyle = 'rgba(70,40,12,.25)'; c.beginPath(); c.ellipse(px, py + 1, 7, 2.6, 0, 0, 7); c.fill(); for (let i = 0; i < 12; i++) wLeafAt(c, px + (hash01(seed, p * 20 + i, 7) - 0.5) * 11, py + (hash01(seed, p * 20 + i, 8) - 0.5) * 3.4, cols[i % cols.length], hash01(seed, i, 9) * 6, 1); }
    } else if (se === 'spring') {
      if (!(k < 0.28 || k < 0.07)) continue;
      const n = park ? 40 : 18;
      for (let i = 0; i < n; i++) {
        const a = hash01(seed, i, 11) * 6.283, d = Math.sqrt(hash01(seed, i, 12)) * t.r * 1.3;
        const px = t.x + Math.cos(a) * d + 8, py = t.y + 5 + Math.sin(a) * d * 0.4;
        c.fillStyle = i % 3 ? '#ffd0e0' : '#ffffff'; c.beginPath(); c.ellipse(px, py, 1.8, 1.05, i, 0, 7); c.fill();
      }
    } else if (park) {
      c.fillStyle = 'rgba(6,50,30,.13)'; c.beginPath(); c.ellipse(t.x - 5, t.y + 5, t.r * 1.05, t.r * 0.4, 0, 0, 7); c.fill();
      for (let i = 0; i < 9; i++) { const a = hash01(seed, i, 13) * 6.283, d = Math.sqrt(hash01(seed, i, 14)) * t.r * 0.9; c.fillStyle = 'rgba(255,255,190,.16)'; c.beginPath(); c.ellipse(t.x - 5 + Math.cos(a) * d, t.y + 5 + Math.sin(a) * d * 0.36, 2.2 + hash01(seed, i, 15) * 1.8, 1 + hash01(seed, i, 16), 0.3, 0, 7); c.fill(); }
    }
  }
}
function wWinterGround(c, x0, y0, x1, y1) {
  const H = WORLD.h, vw = x1 - x0, F = FOUNTAIN;
  if (y0 < PARK_Y) {
    c.fillStyle = 'rgba(240,246,255,.22)'; c.fillRect(x0, TOP_Y + 4, vw, PARK_Y - TOP_Y - 4);
    // snow banked against the curbs, grubby on the road side
    ROADS_H.forEach(r => {
      if (r.y - 14 > y1 || r.y + r.h + 16 < y0) return;
      c.fillStyle = 'rgba(110,100,96,.3)'; c.fillRect(x0, r.y - 2.2, vw, 1.6); c.fillRect(x0, r.y + r.h + 1, vw, 1.6);
      for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
        if (STREETS_X.some(cx => Math.abs(x - cx) < 110)) continue;
        const h1 = 4 + hash01(x, r.y, 3) * 4, h2 = 3 + hash01(x, r.y, 5) * 4;
        [[r.y - 4, h1], [r.y + r.h + 4, h2]].forEach(p => {
          c.fillStyle = 'rgba(120,150,190,.35)'; c.beginPath(); c.ellipse(x + 11, p[0] + 1.8, 14.5, p[1], 0, 0, 7); c.fill();
          c.fillStyle = '#f4f8fc'; c.beginPath(); c.ellipse(x + 11, p[0], 14, p[1], 0, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(x + 9, p[0] - p[1] * 0.35, 8, p[1] * 0.45, 0, 0, 7); c.fill();
        });
      }
      c.fillStyle = 'rgba(150,175,205,.35)'; c.fillRect(x0, r.y - 1, vw, 2); c.fillRect(x0, r.y + r.h + 7, vw, 1.5);
    });
    // drifts along the foot of every building
    ALL_BLD.forEach(b => {
      const bot = b.y + b.h; if (b.x > x1 + 30 || b.x + b.w < x0 - 30 || bot < y0 - 10 || bot > y1 + 10) return;
      for (let x = b.x; x < b.x + b.w; x += 18) {
        const h = hash01(x | 0, bot, 41), w = 8 + h * 10;
        c.fillStyle = 'rgba(150,175,205,.3)'; c.beginPath(); c.ellipse(x + 9, bot + 3.2, w + 1, 2.6 + h, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(248,251,254,.92)'; c.beginPath(); c.ellipse(x + 9, bot + 2, w, 2.4 + h, 0, 0, 7); c.fill();
      }
    });
    // flakes caught in the pavement joints
    for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) for (let y = Math.max(TOP_Y + 6, Math.floor(y0 / 30) * 30); y < Math.min(PARK_Y, y1); y += 30) {
      const h = hash01(x, y, 43); if (h > 0.22) continue;
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x + hash01(x, y, 44) * 28, y + hash01(x, y, 45) * 28, 3 + h * 12, 1 + h * 3, 0, 0, 7); c.fill();
    }
  }
  if (y1 > PARK_Y) {
    const ya = Math.max(y0, PARK_Y + 6), yb = Math.min(H, y1);
    const g = c.createLinearGradient(0, PARK_Y, 0, H); g.addColorStop(0, '#eef4fa'); g.addColorStop(1, '#dde8f2');
    c.globalAlpha = 0.95; c.fillStyle = g; c.fillRect(x0, ya, vw, yb - ya); c.globalAlpha = 1;
    // drifts with a sunlit crown and a blue shadow side
    for (let x = Math.floor(x0 / 90) * 90 - 90; x < x1 + 90; x += 90) for (let y = PARK_Y + 30; y < H; y += 70) {
      const v = hash01(x, y, 11), px = x + v * 60, py = y + hash01(x, y, 12) * 40, rx = 26 + v * 30, ry = 6 + v * 5;
      if (py < y0 - 20 || py > y1 + 20 || px < x0 - 80 || px > x1 + 80) continue;
      c.fillStyle = 'rgba(160,185,220,' + (0.2 + v * 0.1).toFixed(3) + ')'; c.beginPath(); c.ellipse(px + 3, py + 2.4, rx, ry, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(px - rx * 0.2, py - ry * 0.3, rx * 0.6, ry * 0.5, 0, 0, 7); c.fill();
    }
    for (let x = Math.floor(x0 / 24) * 24; x < x1; x += 24) for (let y = Math.max(ya, Math.floor(y0 / 24) * 24); y < yb; y += 24) {
      const h = hash01(x, y, 51); if (h > 0.07) continue;
      const px = x + hash01(x, y, 52) * 22, py = y + hash01(x, y, 53) * 22;
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - 2.2, py); c.lineTo(px + 2.2, py); c.moveTo(px, py - 2.2); c.lineTo(px, py + 2.2); c.stroke();
      c.strokeStyle = 'rgba(190,215,255,.7)'; c.beginPath(); c.moveTo(px - 3.4, py + 1); c.lineTo(px + 3.4, py + 1); c.stroke();
    }
    // packed-snow paths with boot tracks
    parkPaths(c, 4); c.fillStyle = '#b9c7d6'; c.fill();
    parkPaths(c, 0); c.fillStyle = '#d6e0ea'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.save(); parkPaths(c, 0); c.clip(); c.fillRect(x0, F.y - 9, vw, 5); c.fillRect(F.x - 20, PARK_Y, 6, FOUNTAIN.y - PARK_Y); c.restore();
    c.fillStyle = 'rgba(120,140,170,.4)';
    for (let x = Math.floor(x0 / 18) * 18; x < x1; x += 18) { c.beginPath(); c.ellipse(x + 3, F.y - 5, 3, 1.3, 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 11, F.y + 5, 3, 1.3, -0.2, 0, 7); c.fill(); }
    // the plaza keeps its pattern under a dusting
    c.fillStyle = 'rgba(206,218,232,.82)'; c.beginPath(); c.ellipse(F.x, F.y, 150, 96, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(120,140,165,.28)'; c.lineWidth = 2; [150, 112, 78].forEach(r => { c.beginPath(); c.ellipse(F.x, F.y, r, r * 0.64, 0, 0, 7); c.stroke(); });
    c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; c.moveTo(F.x + Math.cos(a) * 78, F.y + Math.sin(a) * 50); c.lineTo(F.x + Math.cos(a) * 150, F.y + Math.sin(a) * 96); } c.stroke();
    // snow over the pond bank, leaving the shore stones peeking through
    c.fillStyle = 'rgba(236,243,250,.86)'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx + 13, POND.ry + 13, 0, 0, 7); c.ellipse(POND.x, POND.y, POND.rx + 1, POND.ry + 1, 0, 0, 7, true); c.fill('evenodd');
  }
}
function wPaintSnowRoof(g, b, w, rh) {
  g.translate(11, 9);
  // soft mound along the parapet
  g.fillStyle = 'rgba(150,175,208,.45)'; g.beginPath(); g.moveTo(-8, 4.6); for (let i = -8; i < w + 8; i += 12) g.lineTo(Math.min(w + 8, i + 12), 4.6); g.lineTo(w + 8, 6); g.lineTo(-8, 6); g.fill();
  const sg = g.createLinearGradient(0, -8, 0, 4); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#e3edf7');
  g.fillStyle = sg; g.beginPath(); g.moveTo(-9, 3.4);
  for (let i = -9; i <= w + 9; i += 12) { const hh = 5 + hash01(b.x | 0, i, 3) * 4.4; g.quadraticCurveTo(i + 6, -hh, Math.min(w + 9, i + 12), -1); }
  g.lineTo(w + 9, 4); g.lineTo(-9, 4); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-8, 0); for (let i = -9; i <= w + 9; i += 12) g.quadraticCurveTo(i + 6, -5.4 - hash01(b.x | 0, i, 3) * 4.4, Math.min(w + 9, i + 12), -1.6); g.stroke();
  g.fillStyle = 'rgba(160,185,215,.6)'; g.fillRect(-9, 3.4, w + 18, 1.6);
  // icicles hanging from the cornice
  for (let i = 5; i < w - 3; i += 8.4) {
    const L = 3 + hash01(b.x | 0, i, 7) * 9, x = i + hash01(b.x | 0, i, 8) * 3, y = rh;
    g.fillStyle = 'rgba(214,238,252,.92)'; g.beginPath(); g.moveTo(x - 1.5, y); g.lineTo(x + 1.5, y); g.lineTo(x + 0.2, y + L); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x - 1.5, y); g.lineTo(x - 0.4, y); g.lineTo(x - 0.1, y + L * 0.7); g.closePath(); g.fill();
  }
}
function wPaintIce(g, rx, ry, seed) {
  const R = mulberry32(seed);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.save(); g.clip();
  const ig = g.createRadialGradient(-40, -20, 10, 0, 0, rx); ig.addColorStop(0, '#f0f8fc'); ig.addColorStop(0.6, '#cfe6f2'); ig.addColorStop(1, '#a9cde2');
  g.fillStyle = ig; g.fillRect(-rx, -ry, rx * 2, ry * 2);
  g.fillStyle = 'rgba(70,130,170,.14)'; g.beginPath(); g.ellipse(24, 10, rx * 0.5, ry * 0.45, 0, 0, 7); g.fill();
  for (let i = 0; i < 40; i++) { const x = (R() - 0.5) * rx * 1.8, y = (R() - 0.5) * ry * 1.7; g.fillStyle = 'rgba(255,255,255,' + (0.18 + R() * 0.3).toFixed(3) + ')'; g.beginPath(); g.ellipse(x, y, 1 + R() * 3, 0.8 + R() * 1.6, R() * 3, 0, 7); g.fill(); }
  // cracks fanning out from two impact points
  [[-30, -10], [70, 24]].forEach(o => {
    for (let k = 0; k < 7; k++) {
      let x = o[0], y = o[1], a = k / 7 * 6.283 + R(); g.beginPath(); g.moveTo(x, y);
      const pts = [[x, y]]; for (let s = 0; s < 6; s++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * (14 + R() * 18); y += Math.sin(a) * (8 + R() * 10); pts.push([x, y]); }
      g.strokeStyle = 'rgba(80,130,170,.4)'; g.lineWidth = 1.5; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1] + 1) : g.moveTo(p[0], p[1] + 1)); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    }
  });
  const sh = g.createLinearGradient(-rx * 0.6, -ry, rx * 0.2, ry); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.4, 'rgba(255,255,255,.3)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(-rx, -ry, rx * 2, ry * 2);
  for (let i = 0; i < 6; i++) { const a = R() * 6.283; g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.ellipse(Math.cos(a) * rx * 0.86, Math.sin(a) * ry * 0.84, 16 + R() * 20, 4 + R() * 5, a, 0, 7); g.fill(); }
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, rx - 1.5, ry - 1.5, 0, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(120,160,190,.4)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, rx - 4, ry - 4, 0, 0, 7); g.stroke();
}
function wDrawIce(c) {
  const P = POND, s = wspr('ice', P.rx * 2 + 6, P.ry * 2 + 6, g => { g.translate(P.rx + 3, P.ry + 3); wPaintIce(g, P.rx, P.ry, 77); });
  c.drawImage(s.cv, P.x - P.rx - 3, P.y - P.ry - 3, s.w, s.h);
  const t = REDUCED ? 0 : FX.time, day = 1 - FX.nf * 0.7;
  for (let i = 0; i < 9; i++) {
    const tw = REDUCED ? 0.8 : Math.sin(t * (1.6 + i * 0.3) + i * 2.3); if (tw < 0.4) continue;
    const gx = P.x + (hash01(i, 1, 141) - 0.5) * P.rx * 1.6, gy = P.y + (hash01(i, 2, 142) - 0.5) * P.ry * 1.4, sz = 1.8 + tw * 2.6;
    c.strokeStyle = 'rgba(255,255,255,' + (0.9 * day * tw).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(gx - sz, gy); c.lineTo(gx + sz, gy); c.moveTo(gx, gy - sz * 0.7); c.lineTo(gx, gy + sz * 0.7); c.stroke();
  }
}
