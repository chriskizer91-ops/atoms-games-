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
  patFill(c, 'concrete', x0, TOP_Y + 4, vw, BAND1 - TOP_Y - 4, 0.9);
  // paving: pale pavement, then a darker plaza behind the south row, cut into slabs
  c.fillStyle = PAVE; c.fillRect(x0, BAND1, vw, PARK_Y - BAND1);
  c.fillStyle = '#c9c2b4'; c.fillRect(x0, R1b + 50, vw, BAND2 - R1b - 50);
  STREETS_X.forEach(cx => { c.fillStyle = PAVE; c.fillRect(cx - STREET_W / 2 - 20, TOP_Y + 4, STREET_W + 40, SH); });
  wSlabs(c, 0, BAND1, W, ROAD1.y - BAND1, x0, vy0, x1, vy1, 48, 50, false, 301);
  wSlabs(c, 0, R1b, W, 50, x0, vy0, x1, vy1, 48, 50, false, 302);
  wSlabs(c, 0, R1b + 50, W, BAND2 - R1b - 50, x0, vy0, x1, vy1, 64, 58, true, 303);
  wSlabs(c, 0, BAND2, W, ROAD2.y - BAND2, x0, vy0, x1, vy1, 48, 50, false, 304);
  wSlabs(c, 0, R2b, W, PARK_Y - R2b, x0, vy0, x1, vy1, 48, 50, false, 305);
  STREETS_X.forEach(cx => { wSlabs(c, cx - STREET_W / 2 - 20, TOP_Y + 4, 20, SH, x0, vy0, x1, vy1, 20, 50, false, 306); wSlabs(c, cx + STREET_W / 2, TOP_Y + 4, 20, SH, x0, vy0, x1, vy1, 20, 50, false, 307); });
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
    c.fillStyle = 'rgba(64,72,82,.4)'; for (let x = Math.floor(x0 / 7) * 7; x < x1; x += 7) { const h = hash01(x, r.y, 41); if (h < 0.5) { c.fillRect(x, r.y + 6, 1.4 + h * 3, 1.4); c.fillRect(x + 2, r.y + r.h - 7.4, 1.4 + h * 3, 1.4); } }
  });
  STREETS_X.forEach(cx => { c.fillStyle = 'rgba(16,20,26,.12)'; c.fillRect(cx - 31, TOP_Y + 4, 18, SH); c.fillRect(cx + 13, TOP_Y + 4, 18, SH); c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(cx - 24, TOP_Y + 4, 4, SH); c.fillRect(cx + 20, TOP_Y + 4, 4, SH); });
  // curbs: lit top edge, shaded face
  ROADS_H.forEach(r => {
    c.fillStyle = '#f1ede4'; c.fillRect(x0, r.y - 5, vw, 3);
    c.fillStyle = '#8d877b'; c.fillRect(x0, r.y - 2, vw, 3.5);
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x0, r.y + 1.5, vw, 3); c.fillRect(x0, r.y + r.h - 2.5, vw, 2.5);
    c.fillStyle = '#f1ede4'; c.fillRect(x0, r.y + r.h, vw, 3.5);
    c.fillStyle = '#b5afa3'; c.fillRect(x0, r.y + r.h + 3.5, vw, 1.5);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x0, r.y - 5, vw, 0.9); c.fillRect(x0, r.y + r.h, vw, 0.9);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x0, r.y - 2, vw, 0.9); c.fillRect(x0, r.y + r.h + 3.5, vw, 0.9);
  });
  STREETS_X.forEach(cx => {
    const a = cx - STREET_W / 2, b = cx + STREET_W / 2;
    c.fillStyle = '#f1ede4'; c.fillRect(a - 4, TOP_Y + 4, 4, SH); c.fillRect(b, TOP_Y + 4, 4, SH);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(a, TOP_Y + 4, 2.5, SH); c.fillRect(b - 2.5, TOP_Y + 4, 2.5, SH);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(a - 4, TOP_Y + 4, 0.9, SH); c.fillRect(b, TOP_Y + 4, 0.9, SH);
  });
  // open the curbs where roads meet
  INTERSECTIONS.forEach(it => {
    if (it.x1 < x0 - 60 || it.x0 > x1 + 60) return;
    c.fillStyle = ASPH; c.fillRect(it.x0 - 4.5, it.y0 + 1, it.x1 - it.x0 + 9, it.y1 - it.y0 - 2); c.fillRect(it.x0, it.y0 - 6, it.x1 - it.x0, it.y1 - it.y0 + 12);
    patFill(c, 'asphalt', it.x0 - 4.5, it.y0 - 6, it.x1 - it.x0 + 9, it.y1 - it.y0 + 12, 0.8);
    c.fillStyle = 'rgba(10,12,16,.1)'; c.fillRect(it.x0 + 9, it.y0 + 2, 18, it.y1 - it.y0 - 4); c.fillRect(it.x1 - 27, it.y0 + 2, 18, it.y1 - it.y0 - 4);
  });
  // lane markings, worn
  STREETS_X.forEach(cx => { for (let y = TOP_Y + 20; y < PARK_Y - 20; y += 76) { if (inRoadY(y - 50, y + 88)) continue; wDash(c, cx - 2, y, 4, 38, y + cx); } });
  ROADS_H.forEach(r => { for (let x = Math.floor(x0 / 76) * 76 + 10; x < x1; x += 76) { if (inCross(x - 50, x + 88)) continue; wDash(c, x, r.y + r.h / 2 - 2, 38, 4, x + r.y); } });
  // stop lines and crosswalks
  INTERSECTIONS.forEach(it => {
    if (it.x1 < x0 - 90 || it.x0 > x1 + 90) return;
    const hh = it.y1 - it.y0, ww = it.x1 - it.x0, s0 = it.cx * 3 + it.y0;
    wStripe(c, it.x0 - 54, it.y0 + 5, 4, hh / 2 - 7, s0 + 1); wStripe(c, it.x1 + 50, it.y0 + hh / 2 + 2, 4, hh / 2 - 7, s0 + 2);
    wStripe(c, it.x0 + 5, it.y0 - 56, ww / 2 - 7, 4, s0 + 3); wStripe(c, it.x0 + ww / 2 + 2, it.y1 + 52, ww / 2 - 7, 4, s0 + 4);
    for (let i = 0; i < 4; i++) {
      wStripe(c, it.x0 - 44 + i * 10, it.y0 + 5, 6, hh - 10, s0 + 10 + i); wStripe(c, it.x1 + 6 + i * 10, it.y0 + 5, 6, hh - 10, s0 + 20 + i);
      wStripe(c, it.x0 + 5, it.y0 - 46 + i * 10, ww - 10, 6, s0 + 30 + i); wStripe(c, it.x0 + 5, it.y1 + 8 + i * 10, ww - 10, 6, s0 + 40 + i);
    }
  });
  wRoadDetail(c, x0, vy0, x1, vy1);

  // ---- the park ----
  const ya = Math.max(PARK_Y, vy0), yb = Math.min(H, vy1);
  if (yb > ya) {
    const gg = c.createLinearGradient(0, PARK_Y, 0, H); gg.addColorStop(0, '#7bbd70'); gg.addColorStop(1, '#62a761');
    c.fillStyle = gg; c.fillRect(x0, ya, vw, yb - ya);
    wParkGrass(c, x0, ya, x1, yb);
  }
  if (vy0 < PARK_Y + 10 && vy1 > PARK_Y - 10) {
    c.fillStyle = '#c9c3b6'; c.fillRect(x0, PARK_Y - 1.5, vw, 3.5);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x0, PARK_Y - 1.5, vw, 0.9);
    c.fillStyle = '#8f897c'; c.fillRect(x0, PARK_Y + 2, vw, 1.6);
    wFadeV(c, x0, PARK_Y + 3.6, vw, 6, 0.3, 0, '8,24,16');
    c.fillStyle = 'rgba(0,0,0,.2)'; for (let x = Math.floor(x0 / 48) * 48; x < x1; x += 48) c.fillRect(x, PARK_Y - 1.5, 0.9, 3.5);
  }
  if (yb > ya) {
    wParkPaths(c, x0, ya, x1, yb);
    wPlaza(c, x0, ya, x1, yb);
    wParkBeds(c, x0, ya, x1, yb);
    for (let i = 0; i < BLANKETS.length; i++) { const bl = BLANKETS[i]; if (bl.x < x0 - 60 || bl.x > x1 + 60 || bl.y < vy0 - 50 || bl.y > vy1 + 30) continue; wBlanket(c, bl, i); }
    for (const f of FLOWERS) {
      if (f.x < x0 - 10 || f.x > x1 + 10 || f.y < vy0 - 10 || f.y > vy1 + 10) continue;
      wFlowerDot(c, f);
    }
  }
  for (const t of TREES) if (t.x > x0 - 30 && t.x < x1 + 30 && t.y > vy0 - 12 && t.y < vy1 + 14) wTreeBase(c, t);
  wPond(c, x0, vy0, x1, vy1);
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
  if (POND.x + POND.rx + 20 > x0 && POND.x - POND.rx - 20 < x1 && POND.y + POND.ry + 30 > vy0 && POND.y - POND.ry - 40 < vy1) wPondLive(c, tm, A);
  // puddles after rain
  if (A.wet > 0.03) {
    const pc = rgbaS(mix3(A.top, [70, 86, 110], 0.5), 0.55 * A.wet);
    for (const p of PUDDLES) {
      if (p.x < x0 - 50 || p.x > x1 + 50) continue;
      const pr = 0.6 + 0.4 * A.wet;
      c.fillStyle = 'rgba(8,12,22,' + (0.22 * A.wet).toFixed(3) + ')'; c.beginPath(); c.ellipse(p.x, p.y + 0.6, p.rx * pr + 1.2, p.ry * pr + 1, 0, 0, 7); c.fill();
      c.fillStyle = pc; c.beginPath(); c.ellipse(p.x, p.y, p.rx * pr, p.ry * pr, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,' + (0.1 * A.wet).toFixed(3) + ')'; c.beginPath(); c.ellipse(p.x, p.y - p.ry * 0.3, p.rx * pr * 0.8, p.ry * pr * 0.35, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,' + (0.3 * A.wet).toFixed(3) + ')'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(p.x - p.rx * 0.2, p.y - p.ry * 0.25, p.rx * 0.45, p.ry * 0.35, 0, 3.4, 5.6); c.stroke();
      if (A.rain > 0.1 && !REDUCED) { const ph = (tm * 1.6 + p.p) % 1; c.globalAlpha = (1 - ph) * A.rain; c.beginPath(); c.ellipse(p.x + Math.sin(p.p * 9) * p.rx * 0.4, p.y, ph * 9, ph * 3.4, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
    }
  }
}
