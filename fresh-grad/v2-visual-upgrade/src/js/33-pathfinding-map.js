/* ============================ pathfinding, minimap and buses ============================ */
const PF = { C: 12, g: {} };
function pfGrid(key) {
  let g = PF.g[key];
  if (g) return g;
  const dm = sceneDims(key), C = PF.C, cols = Math.ceil(dm.w / C), rows = Math.ceil(dm.h / C);
  const bl = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const cx = q * C + C / 2, cy = r * C + C / 2; bl[r * cols + q] = (solidKey(key, cx, cy) || solidKey(key, cx - 4, cy - 4) || solidKey(key, cx + 4, cy - 4) || solidKey(key, cx - 4, cy + 4) || solidKey(key, cx + 4, cy + 4)) ? 1 : 0; }
  g = PF.g[key] = { cols, rows, bl };
  return g;
}
/* returns waypoints from (x0,y0) to (x1,y1), or null when no route exists */
function findPath(x0, y0, x1, y1, key) {
  key = key || sceneKey();
  const g = pfGrid(key), C = PF.C, cols = g.cols, rows = g.rows, bl = g.bl;
  const cellOf = (x, y) => clamp(Math.floor(y / C), 0, rows - 1) * cols + clamp(Math.floor(x / C), 0, cols - 1);
  const nearest = i => {
    if (!bl[i]) return i;
    const cx = i % cols, cy = (i / cols) | 0;
    for (let r = 1; r < 30; r++) {
      let best = -1, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const qx = cx + dx, qy = cy + dy;
        if (qx < 0 || qy < 0 || qx >= cols || qy >= rows) continue;
        const k = qy * cols + qx;
        if (!bl[k]) { const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = k; } }
      }
      if (best >= 0) return best;
    }
    return -1;
  };
  const s = nearest(cellOf(x0, y0)), e = nearest(cellOf(x1, y1));
  if (s < 0 || e < 0) return null;
  const goalFree = !solidKey(key, x1, y1);
  const goal = goalFree ? { x: x1, y: y1 } : { x: (e % cols) * C + C / 2, y: ((e / cols) | 0) * C + C / 2 };
  const prev = new Int32Array(cols * rows).fill(-1), q = new Int32Array(cols * rows);
  let qh = 0, qt = 0; q[qt++] = s; prev[s] = s;
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = s === e;
  while (qh < qt && !found) {
    const cur = q[qh++], cx = cur % cols, cy = (cur / cols) | 0;
    for (let d = 0; d < 8; d++) {
      const nx = cx + D[d][0], ny = cy + D[d][1];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const k = ny * cols + nx;
      if (bl[k] || prev[k] >= 0) continue;
      if (d >= 4 && (bl[cy * cols + nx] || bl[ny * cols + cx])) continue;
      prev[k] = cur; q[qt++] = k;
      if (k === e) { found = true; break; }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = e; k !== s; k = prev[k]) cells.push(k);
  cells.reverse();
  const pts = [{ x: x0, y: y0 }].concat(cells.map(k => ({ x: (k % cols) * C + C / 2, y: ((k / cols) | 0) * C + C / 2 })));
  pts.push(goal);
  const losGrid = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.hypot(dx, dy) / 6);
    for (let i = 1; i < n; i++) if (bl[cellOf(a.x + dx * i / n, a.y + dy * i / n)]) return false;
    return true;
  };
  const losExact = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.hypot(dx, dy) / 5);
    for (let i = 1; i < n; i++) if (solidKey(key, a.x + dx * i / n, a.y + dy * i / n)) return false;
    return true;
  };
  const out = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !(losGrid(pts[i], pts[j]) && losExact(pts[i], pts[j]))) j--;
    out.push(pts[j]); i = j;
  }
  return out;
}
function walkTo(x, y, autoId) {
  const pts = findPath(S.px, S.py, x, y);
  G.autoEnter = autoId || null;
  if (!pts || !pts.length) { G.target = { x, y }; G.pathQ = []; return; }
  G.target = pts[0]; G.pathQ = pts.slice(1);
}
function schoolGo(tx, ty, autoId) { walkTo(tx, ty, autoId); }

/* ---------- minimap ---------- */
let MINI = null;
function buildMini() {
  const cv = document.createElement('canvas'), s = 380 / WORLD.w;
  cv.width = 380; cv.height = Math.round(WORLD.h * s);
  const c = cv.getContext('2d');
  c.scale(s, s);
  c.fillStyle = '#31404f'; c.fillRect(0, 0, WORLD.w, WORLD.h);
  c.fillStyle = '#25313e'; c.fillRect(0, 0, WORLD.w, TOP_Y);
  c.fillStyle = '#c9c3b6'; c.fillRect(0, BAND1, WORLD.w, PARK_Y - BAND1);
  c.fillStyle = '#56616d';
  ROADS_H.forEach(r => c.fillRect(0, r.y, WORLD.w, r.h));
  STREETS_X.forEach(cx => c.fillRect(cx - STREET_W / 2, TOP_Y, STREET_W, PARK_Y - TOP_Y));
  c.fillStyle = WINTER() ? '#e3ebf3' : season() === 'autumn' ? '#a9a85a' : '#6fb86c'; c.fillRect(0, PARK_Y, WORLD.w, WORLD.h - PARK_Y);
  c.fillStyle = WINTER() ? '#b9c6d2' : season() === 'autumn' ? '#d08a3a' : '#5aa35c'; TREES.forEach(t => { if (t.y > PARK_Y) { c.beginPath(); c.arc(t.x, t.y - 20, 30, 0, 7); c.fill(); } });
  c.fillStyle = '#e2d6ba'; c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190, 124, 0, 0, 7); c.fill();
  c.fillRect(80, FOUNTAIN.y - 16, WORLD.w - 160, 32); c.fillRect(FOUNTAIN.x - 30, PARK_Y, 60, FOUNTAIN.y - PARK_Y); c.fillRect(776, PARK_Y, 48, 700); c.fillRect(2036, PARK_Y, 48, 700);
  c.fillStyle = '#58b4e0'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(FOUNTAIN.x, FOUNTAIN.y, 44, 0, 7); c.fill();
  DECO.forEach(b => { c.fillStyle = '#8b96a3'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = '#a5afba'; c.fillRect(b.x, b.y, b.w, 40); });
  const key = { apartment: '#e07a5f', work: '#4f8fe0', grocery: '#3fbf7a', diner: '#e8505b', clinic: '#f4f7f9' };
  Object.values(BLD).forEach(b => { c.fillStyle = key[b.id]; c.fillRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16); });
  DECO.forEach(b => { if (b.place) { c.fillStyle = PLACES[b.place].col; c.fillRect(b.x + 6, b.y + 44, b.w - 12, b.h - 50); } });
  c.fillStyle = '#2a6f97'; BUS_STOPS.forEach(b => { c.beginPath(); c.arc(b.x, b.y, 30, 0, 7); c.fill(); });
  MINI = cv;
}
function drawMinimap() {
  const el = $('#mini');
  if (!el) return;
  const show = S && S.scene === 'town' && G.mode === 'play';
  if (el.hidden === show) el.hidden = !show;
  if (!show) return;
  if (!MINI) buildMini();
  const c = el.getContext('2d'), k = el.width / WORLD.w;
  c.clearRect(0, 0, el.width, el.height);
  c.drawImage(MINI, 0, 0, el.width, el.height);
  if (FX.nf > 0.05) { c.fillStyle = 'rgba(10,16,50,' + (0.4 * FX.nf).toFixed(3) + ')'; c.fillRect(0, 0, el.width, el.height); }
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5;
  c.strokeRect(CAM.x * k, CAM.y * k, (CAM.vw || 800) * k, (CAM.vh || 500) * k);
  c.font = '700 13px "DM Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  [['apartment', 'H'], ['work', 'W'], ['grocery', 'G'], ['diner', 'D'], ['clinic', '+']].forEach(p => { const b = BLD[p[0]]; c.fillStyle = p[0] === 'clinic' ? '#d63b4b' : '#fff'; c.fillText(p[1], (b.x + b.w / 2) * k, (b.y + b.h / 2) * k + 1); });
  c.fillStyle = '#fff'; c.font = '700 10px "DM Sans", sans-serif'; BUS_STOPS.forEach(b => c.fillText('B', b.x * k, b.y * k + 0.5));
  Object.keys(PLACES).forEach(id => { const b = PLACES[id].b; if (b) placeIcon(c, PLACES[id].icon, (b.x + b.w / 2) * k, (b.y + b.h / 2 + 22) * k, 0.48, '#fff'); });
  if (G.target) { const q = (G.pathQ && G.pathQ.length ? G.pathQ[G.pathQ.length - 1] : G.target); c.strokeStyle = '#ffc247'; c.lineWidth = 2; c.beginPath(); c.arc(q.x * k, q.y * k, 5, 0, 7); c.stroke(); }
  const pr = 7 + (REDUCED ? 0 : Math.sin(FX.time * 4) * 1.5);
  c.fillStyle = 'rgba(255,194,71,.3)'; c.beginPath(); c.arc(S.px * k, S.py * k, pr + 4, 0, 7); c.fill();
  c.fillStyle = '#ffc247'; c.beginPath(); c.arc(S.px * k, S.py * k, 5.5, 0, 7); c.fill();
  c.strokeStyle = '#2b1c00'; c.lineWidth = 2; c.stroke();
}

/* ---------- buses ---------- */
const BUS_FARE = 2;
function busMins(a, b) { return clamp(Math.round(Math.hypot(a.x - b.x, a.y - b.y) / 250) + 4, 6, 18); }
function busNear() {
  for (const s of BUS_STOPS) if (Math.abs(S.px - s.x) < 50 && Math.abs(S.py - (s.y + 14)) < 46) return s;
  return null;
}
function busSpec(i) {
  const here = BUS_STOPS[i];
  const items = BUS_STOPS.filter(s => s.id !== i).map(s => {
    const m = busMins(here, s);
    return {
      t: 'Ride to ' + s.name, d: 'About ' + m + ' minutes by bus.', tag: fmt(BUS_FARE) + ' · ' + m + ' min', off: canSpend(BUS_FARE) ? '' : 'You cannot afford that.',
      go() {
        spend(BUS_FARE); advance(m, 'idle');
        if (G.collapse || S.over) return;
        S.px = s.x; S.py = s.y + 24; G.target = null; G.pathQ = []; G.autoEnter = null; CAM.ready = false;
        G.inside = null; $('#panel').hidden = true; SFX.chime('door');
        toast('The bus drops you at ' + s.name + '.', '');
      }
    };
  });
  return { band: '#2a6f97', title: here.name + ' bus stop', sub: 'City Transit', note: 'Two dollars gets you across town in minutes, which beats a long walk.', stock: [fmt(S.money)], sections: [{ h: 'Where to?', items }] };
}
