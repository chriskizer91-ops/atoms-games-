/* fixed street details */
const MANHOLES = [], PUDDLES = [], BLANKETS = [{ x: 1130, y: 1452, c: '#e76f51' }, { x: 1905, y: 1660, c: '#3d7ea6' }, { x: 548, y: 1756, c: '#e9c46a' }];
(function () {
  const r = mulberry32(55);
  ROADS_H.forEach(rd => { for (let x = 140; x < WORLD.w; x += 330 + r() * 160) if (!inCross(x - 60, x + 60)) MANHOLES.push({ x, y: rd.y + (r() < 0.5 ? 22 : 58) }); });
  for (let i = 0; i < 46; i++) {
    const road = r() < 0.55, rd = ROADS_H[i % 2];
    const x = 60 + r() * (WORLD.w - 120), y = road ? rd.y + 10 + r() * (rd.h - 20) : (i % 2 ? BAND1 + 22 + r() * 18 : rd.y + rd.h + 14 + r() * 26);
    PUDDLES.push({ x, y, rx: 16 + r() * 26, ry: 4.5 + r() * 5.5, p: r() * 6 });
  }
})();

/* everything on the ground that never changes; painted once into cached chunks */
function drawGroundStatic(c, vx0, vy0, vx1, vy1) {
  const W = WORLD.w, H = WORLD.h;
  const x0 = Math.max(0, vx0 - 4), x1 = Math.min(W, vx1 + 4), vw = Math.max(0, x1 - x0);
  const R1b = ROAD1.y + ROAD1.h, R2b = ROAD2.y + ROAD2.h, SH = PARK_Y - TOP_Y - 4;
  const ASPH = '#434c56', PAVE = '#d9d3c7';
  c.fillStyle = '#4f5964'; c.fillRect(x0, TOP_Y + 4, vw, BAND1 - TOP_Y - 4);
  // paving
  c.fillStyle = PAVE; c.fillRect(x0, BAND1, vw, PARK_Y - BAND1);
  c.fillStyle = '#c9c2b4'; c.fillRect(x0, R1b + 50, vw, BAND2 - R1b - 50);
  STREETS_X.forEach(cx => { c.fillStyle = PAVE; c.fillRect(cx - STREET_W / 2 - 20, TOP_Y + 4, STREET_W + 40, SH); });
  patFill(c, 'paver', x0, TOP_Y + 4, vw, SH);
  // roads
  c.fillStyle = ASPH;
  ROADS_H.forEach(r => c.fillRect(x0, r.y, vw, r.h));
  STREETS_X.forEach(cx => c.fillRect(cx - STREET_W / 2, TOP_Y + 4, STREET_W, SH));
  ROADS_H.forEach(r => patFill(c, 'asphalt', x0, r.y, vw, r.h));
  STREETS_X.forEach(cx => { patFill(c, 'asphalt', cx - STREET_W / 2, TOP_Y + 4, STREET_W, ROAD1.y - TOP_Y - 4); patFill(c, 'asphalt', cx - STREET_W / 2, R1b, STREET_W, ROAD2.y - R1b); patFill(c, 'asphalt', cx - STREET_W / 2, R2b, STREET_W, PARK_Y - R2b); });
  // worn tyre tracks and lane edges
  ROADS_H.forEach(r => {
    c.fillStyle = 'rgba(16,20,26,.12)'; c.fillRect(x0, r.y + 13, vw, 18); c.fillRect(x0, r.y + 49, vw, 18);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x0, r.y + 6, vw, 1.4); c.fillRect(x0, r.y + r.h - 7.4, vw, 1.4);
  });
  STREETS_X.forEach(cx => { c.fillStyle = 'rgba(16,20,26,.12)'; c.fillRect(cx - 31, TOP_Y + 4, 18, SH); c.fillRect(cx + 13, TOP_Y + 4, 18, SH); });
  // curbs: lit top edge, shaded face
  ROADS_H.forEach(r => {
    c.fillStyle = '#f1ede4'; c.fillRect(x0, r.y - 5, vw, 3);
    c.fillStyle = '#8d877b'; c.fillRect(x0, r.y - 2, vw, 3.5);
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x0, r.y + 1.5, vw, 3); c.fillRect(x0, r.y + r.h - 2.5, vw, 2.5);
    c.fillStyle = '#f1ede4'; c.fillRect(x0, r.y + r.h, vw, 3.5);
    c.fillStyle = '#b5afa3'; c.fillRect(x0, r.y + r.h + 3.5, vw, 1.5);
  });
  STREETS_X.forEach(cx => {
    const a = cx - STREET_W / 2, b = cx + STREET_W / 2;
    c.fillStyle = '#f1ede4'; c.fillRect(a - 4, TOP_Y + 4, 4, SH); c.fillRect(b, TOP_Y + 4, 4, SH);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(a, TOP_Y + 4, 2.5, SH); c.fillRect(b - 2.5, TOP_Y + 4, 2.5, SH);
  });
  // open the curbs where roads meet
  INTERSECTIONS.forEach(it => {
    if (it.x1 < x0 - 60 || it.x0 > x1 + 60) return;
    c.fillStyle = ASPH; c.fillRect(it.x0 - 4.5, it.y0 + 1, it.x1 - it.x0 + 9, it.y1 - it.y0 - 2); c.fillRect(it.x0, it.y0 - 6, it.x1 - it.x0, it.y1 - it.y0 + 12);
    patFill(c, 'asphalt', it.x0 - 4.5, it.y0 - 6, it.x1 - it.x0 + 9, it.y1 - it.y0 + 12, 0.8);
  });
  // lane markings
  c.fillStyle = 'rgba(236,214,140,.92)';
  STREETS_X.forEach(cx => { for (let y = TOP_Y + 20; y < PARK_Y - 20; y += 76) { if (inRoadY(y - 50, y + 88)) continue; c.fillRect(cx - 2, y, 4, 38); } });
  ROADS_H.forEach(r => { for (let x = Math.floor(x0 / 76) * 76 + 10; x < x1; x += 76) { if (inCross(x - 50, x + 88)) continue; c.fillRect(x, r.y + r.h / 2 - 2, 38, 4); } });
  // stop lines and crosswalks
  c.fillStyle = 'rgba(255,255,255,.86)';
  INTERSECTIONS.forEach(it => {
    if (it.x1 < x0 - 90 || it.x0 > x1 + 90) return;
    const hh = it.y1 - it.y0, ww = it.x1 - it.x0;
    c.fillRect(it.x0 - 54, it.y0 + 5, 4, hh / 2 - 7); c.fillRect(it.x1 + 50, it.y0 + hh / 2 + 2, 4, hh / 2 - 7);
    c.fillRect(it.x0 + 5, it.y0 - 56, ww / 2 - 7, 4); c.fillRect(it.x0 + ww / 2 + 2, it.y1 + 52, ww / 2 - 7, 4);
    for (let i = 0; i < 4; i++) {
      c.fillRect(it.x0 - 44 + i * 10, it.y0 + 5, 6, hh - 10); c.fillRect(it.x1 + 6 + i * 10, it.y0 + 5, 6, hh - 10);
      c.fillRect(it.x0 + 5, it.y0 - 46 + i * 10, ww - 10, 6); c.fillRect(it.x0 + 5, it.y1 + 8 + i * 10, ww - 10, 6);
    }
  });
  for (const mh of MANHOLES) {
    if (mh.x < x0 - 20 || mh.x > x1 + 20) continue;
    c.fillStyle = '#2f363d'; c.beginPath(); c.ellipse(mh.x, mh.y, 10, 5.4, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath(); c.ellipse(mh.x, mh.y, 7, 3.6, 0, 0, 7); c.stroke();
  }

  // ---- the park ----
  const gg = c.createLinearGradient(0, PARK_Y, 0, H); gg.addColorStop(0, '#7bbd70'); gg.addColorStop(1, '#62a761');
  c.fillStyle = gg; c.fillRect(x0, PARK_Y, vw, H - PARK_Y);
  c.fillStyle = 'rgba(255,255,255,.05)';
  for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) c.fillRect(x, PARK_Y, 60, H - PARK_Y);
  patFill(c, 'grass', x0, PARK_Y, vw, H - PARK_Y);
  c.fillStyle = '#b9b3a6'; c.fillRect(x0, PARK_Y - 1, vw, 4);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x0, PARK_Y + 3, vw, 3);
  // paths: a darker rim, sand, then gravel
  const paths = gr => {
    c.beginPath();
    c.rect(FOUNTAIN.x - 28 - gr, PARK_Y + 2, 56 + gr * 2, FOUNTAIN.y - PARK_Y);
    c.rect(80 - gr, FOUNTAIN.y - 14 - gr, W - 160 + gr * 2, 28 + gr * 2);
    c.rect(780 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr); c.rect(2040 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr);
    c.moveTo(FOUNTAIN.x + 190 + gr, FOUNTAIN.y); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190 + gr, 124 + gr, 0, 0, 6.2832);
  };
  paths(4); c.fillStyle = '#9d8f6d'; c.fill();
  paths(0); c.fillStyle = '#e2d6ba'; c.fill(); c.fillStyle = PAT.gravel; c.fill();
  // the plaza around the fountain
  c.fillStyle = '#d2cbbd'; c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 150, 96, 0, 0, 7); c.fill();
  c.fillStyle = PAT.paver; c.globalAlpha = 0.7; c.fill(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(90,80,60,.2)'; c.lineWidth = 2;
  [150, 112, 78].forEach(r => { c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, r, r * 0.64, 0, 0, 7); c.stroke(); });
  c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; c.moveTo(FOUNTAIN.x + Math.cos(a) * 78, FOUNTAIN.y + Math.sin(a) * 50); c.lineTo(FOUNTAIN.x + Math.cos(a) * 150, FOUNTAIN.y + Math.sin(a) * 96); }
  c.stroke();
  // picnic blankets
  for (const bl of BLANKETS) {
    if (bl.x < x0 - 50 || bl.x > x1 + 50) continue;
    c.save(); c.translate(bl.x, bl.y); c.transform(1, 0, -0.25, 0.62, 0, 0);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-27, -19, 58, 44);
    c.fillStyle = '#f8f4ea'; c.fillRect(-30, -22, 60, 44);
    c.fillStyle = bl.c; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) c.fillRect(-30 + i * 10, -22 + j * 11, 10, 11);
    c.restore();
    c.fillStyle = '#b07a48'; rr(c, bl.x - 4, bl.y - 9, 15, 9, 2); c.fill(); c.strokeStyle = '#8a5d34'; c.lineWidth = 1.5; c.beginPath(); c.arc(bl.x + 3.5, bl.y - 9, 5, Math.PI, 0); c.stroke();
  }
  // flowers
  for (const f of FLOWERS) {
    if (f.x < x0 - 10 || f.x > x1 + 10 || f.y < vy0 - 10 || f.y > vy1 + 10) continue;
    c.fillStyle = 'rgba(40,110,60,.5)'; c.fillRect(f.x + 1, f.y + 2, 1.2, 4);
    c.fillStyle = f.c; c.beginPath(); c.arc(f.x + 1.5, f.y + 1.5, 2.5, 0, 7); c.fill();
    c.fillStyle = f.c === '#ffd166' ? '#e07a3f' : '#ffe08a'; c.fillRect(f.x + 0.9, f.y + 0.9, 1.3, 1.3);
  }
  // ---- pond: banks and still water ----
  if (POND.x + POND.rx + 20 > x0 && POND.x - POND.rx - 20 < x1) {
    c.fillStyle = '#cdbf9f'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx + 11, POND.ry + 11, 0, 0, 7); c.fill();
    c.fillStyle = '#a3956f'; c.beginPath(); c.ellipse(POND.x, POND.y + 1, POND.rx + 3, POND.ry + 3, 0, 0, 7); c.fill();
    const wg = c.createRadialGradient(POND.x, POND.y, 20, POND.x, POND.y, POND.rx);
    wg.addColorStop(0, '#3585c2'); wg.addColorStop(1, '#6cbede');
    c.fillStyle = wg; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
    c.save(); c.clip();
    c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(POND.x - 30, POND.y - POND.ry * 0.9, POND.rx * 0.8, POND.ry * 0.6, 0, 0, 7); c.fill();
    c.restore();
  }
}

/* the ground is cached in square chunks at screen resolution, built as they scroll into view */
const GC = { map: new Map(), res: 0, size: 448, max: 20, tick: 0 };
function drawGround(c, m, vx0, vy0, vx1, vy1) {
  const res = clamp(Math.ceil(m * 4) / 4, 1, 2), Z = GC.size;
  if (GC.res !== res) { GC.map.clear(); GC.res = res; }
  if (GC.season !== season()) { GC.map.clear(); GC.season = season(); MINI = null; }
  GC.tick++;
  const pad = 220;
  const cx0 = Math.max(0, Math.floor((vx0 - pad) / Z)), cx1 = Math.min(Math.ceil(WORLD.w / Z) - 1, Math.floor((vx1 + pad) / Z));
  const cy0 = Math.max(0, Math.floor((vy0 - pad) / Z)), cy1 = Math.min(Math.ceil(WORLD.h / Z) - 1, Math.floor((vy1 + pad) / Z));
  let spare = 1;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const x = cx * Z, y = cy * Z, seen = x < vx1 && x + Z > vx0 && y < vy1 && y + Z > vy0;
    if (y + Z <= TOP_Y) continue;
    const key = cx + cy * 64;
    let ch = GC.map.get(key);
    if (!ch) {
      if (!seen && spare-- <= 0) continue;      // off-screen neighbours are filled in one per frame
      const cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil((Z + 2) * res);
      const g = cv.getContext('2d');
      g.setTransform(res, 0, 0, res, -(x - 1) * res, -(y - 1) * res);
      drawGroundStatic(g, x - 1, y - 1, x + Z + 1, y + Z + 1);
      seasonGround(g, x - 1, y - 1, x + Z + 1, y + Z + 1);
      ch = { cv, used: 0 }; GC.map.set(key, ch);
    }
    ch.used = GC.tick;
    if (seen) c.drawImage(ch.cv, x - 1, y - 1, Z + 2, Z + 2);
  }
  if (GC.map.size > GC.max) {
    let oldK = null, oldU = Infinity;
    GC.map.forEach((v, k) => { if (v.used < oldU) { oldU = v.used; oldK = k; } });
    if (oldK != null && oldU < GC.tick) GC.map.delete(oldK);
  }
}
/* water life and rain puddles, drawn fresh every frame */
function drawGroundLive(c, tm, vx0, vy0, vx1, vy1) {
  const A = FX.A, x0 = vx0 - 4, x1 = vx1 + 4;
  if (POND.x + POND.rx + 20 > x0 && POND.x - POND.rx - 20 < x1 && POND.y + POND.ry + 30 > vy0 && POND.y - POND.ry - 40 < vy1) {
    // the water takes on the colour of the sky
    c.fillStyle = rgbaS(mix3(A.top, A.bot, 0.5), 0.2 + 0.25 * A.warm);
    c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) {
      const ph = REDUCED ? 0 : tm * 0.5 + i * 1.7;
      const sx = POND.x - 150 + ((i * 53) % 300) + Math.sin(ph) * 8, sy = POND.y - 62 + ((i * 37) % 124);
      c.globalAlpha = 0.35 + 0.3 * Math.sin(ph * 1.3);
      c.beginPath(); c.moveTo(sx - 13, sy); c.quadraticCurveTo(sx, sy - 3.5, sx + 13, sy); c.stroke();
    }
    c.globalAlpha = 1;
    // lily pads
    [[-90, 20], [30, -40], [110, 30], [-10, 52], [70, -10], [-130, -18]].forEach((p, i) => {
      const lx = POND.x + p[0], ly = POND.y + p[1] + (REDUCED ? 0 : Math.sin(tm + i) * 1.2);
      c.fillStyle = 'rgba(10,40,60,.25)'; c.beginPath(); c.ellipse(lx + 1, ly + 2, 12, 5, 0, 0, 7); c.fill();
      c.fillStyle = i % 2 ? '#4fae62' : '#63c074'; c.beginPath(); c.moveTo(lx, ly); c.ellipse(lx, ly, 12, 5, 0, 0.4, 6.0); c.closePath(); c.fill();
      if (i % 3 === 0) { c.fillStyle = '#ffd6e4'; c.beginPath(); c.arc(lx + 3, ly - 2, 3, 0, 7); c.fill(); c.fillStyle = '#ffe08a'; c.fillRect(lx + 2.3, ly - 2.7, 1.5, 1.5); }
    });
    // reeds at the west bank
    c.strokeStyle = '#4a7f4f'; c.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) {
      const a = 2.5 + i * 0.09, bx = POND.x + Math.cos(a) * (POND.rx + 2), by = POND.y + Math.sin(a) * (POND.ry + 2), sw = REDUCED ? 0 : Math.sin(tm * 1.4 + i) * 2 * (0.5 + FX.wind);
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw * 0.5, by - 12, bx + sw, by - 20 - (i % 3) * 4); c.stroke();
      if (i % 2) { c.fillStyle = '#6b4a30'; rr(c, bx + sw - 1.3, by - 27 - (i % 3) * 4, 2.6, 7, 1.3); c.fill(); }
    }
    // ducks doing slow laps
    for (let i = 0; i < 3; i++) {
      const a = (REDUCED ? 0 : tm * (0.07 + i * 0.012)) + i * 2.2, dir = Math.sin(a) > 0 ? -1 : 1;
      const dx = POND.x + Math.cos(a) * POND.rx * (0.5 - i * 0.1), dy = POND.y + Math.sin(a) * POND.ry * (0.42 - i * 0.08) - 6 + i * 9;
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(dx - dir * 7, dy + 2); c.lineTo(dx - dir * 22, dy - 1); c.moveTo(dx - dir * 7, dy + 3); c.lineTo(dx - dir * 22, dy + 6); c.stroke();
      c.fillStyle = i === 1 ? '#f4f1ea' : '#8a6a4c'; c.beginPath(); c.ellipse(dx, dy, 7.5, 4.2, 0, 0, 7); c.fill();
      c.fillStyle = i === 1 ? '#f4f1ea' : '#2f6b4c'; c.beginPath(); c.arc(dx + dir * 6.5, dy - 4, 3.2, 0, 7); c.fill();
      c.fillStyle = '#f0a030'; c.fillRect(dx + dir * 9 - (dir < 0 ? 3 : 0), dy - 4.4, 3, 1.6);
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(dx - dir * 1.5, dy + 0.5, 4, 2, 0, 0, 7); c.fill();
    }
  }
  // puddles after rain
  if (A.wet > 0.03) {
    const pc = rgbaS(mix3(A.top, [70, 86, 110], 0.5), 0.55 * A.wet);
    for (const p of PUDDLES) {
      if (p.x < x0 - 50 || p.x > x1 + 50) continue;
      c.fillStyle = pc; c.beginPath(); c.ellipse(p.x, p.y, p.rx * (0.6 + 0.4 * A.wet), p.ry * (0.6 + 0.4 * A.wet), 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,' + (0.3 * A.wet).toFixed(3) + ')'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(p.x - p.rx * 0.2, p.y - p.ry * 0.25, p.rx * 0.45, p.ry * 0.35, 0, 3.4, 5.6); c.stroke();
      if (A.rain > 0.1 && !REDUCED) { const ph = (tm * 1.6 + p.p) % 1; c.globalAlpha = (1 - ph) * A.rain; c.beginPath(); c.ellipse(p.x + Math.sin(p.p * 9) * p.rx * 0.4, p.y, ph * 9, ph * 3.4, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
    }
  }
}

