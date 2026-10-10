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
/* v2: the world is painted once into MINI (roads, park, pond, buildings with accents, labels, bus stops). */
/* MINI_FRAME holds the glass frame (gloss, vignette, corner marks, compass), painted once. Per frame: night tint, camera box, target, player. */
let MINI = null;
let MINI_FRAME = null;
const MINI_KEY = { apartment: '#e07a5f', work: '#4f8fe0', grocery: '#3fbf7a', diner: '#e8505b', clinic: '#f4f7f9' };
function paintWorldMap(c, s) {
  const W = WORLD.w, H = WORLD.h, se = season(), rnd = mulberry32(77);
  c.save(); c.scale(s, s);
  const px = 1 / s;
  /* ground */
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#222e3b'); g.addColorStop(1, '#2d3b49');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#1b2530'; c.fillRect(0, 0, W, TOP_Y);
  /* pavement between the building rows */
  g = c.createLinearGradient(0, BAND1, 0, PARK_Y); g.addColorStop(0, '#d2cbbb'); g.addColorStop(1, '#bfb8a8');
  c.fillStyle = g; c.fillRect(0, BAND1, W, PARK_Y - BAND1);
  c.fillStyle = 'rgba(120,108,88,.18)'; for (let x = 0; x < W; x += 60) c.fillRect(x, BAND1, px * 0.5, PARK_Y - BAND1);
  /* roads: asphalt, curbs, lane marks, crosswalks */
  const asphalt = '#4b5662';
  ROADS_H.forEach(r => {
    c.fillStyle = asphalt; c.fillRect(0, r.y, W, r.h);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, r.y, W, 5); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(0, r.y + r.h - 3, W, 3);
    c.fillStyle = '#f2c14e'; for (let x = 10; x < W; x += 64) c.fillRect(x, r.y + r.h / 2 - 2, 34, 4);
  });
  STREETS_X.forEach(cx => {
    c.fillStyle = asphalt; c.fillRect(cx - STREET_W / 2, TOP_Y, STREET_W, PARK_Y - TOP_Y);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cx - STREET_W / 2, TOP_Y, 4, PARK_Y - TOP_Y); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(cx + STREET_W / 2 - 3, TOP_Y, 3, PARK_Y - TOP_Y);
    c.fillStyle = '#f2c14e'; for (let y = TOP_Y + 6; y < PARK_Y; y += 64) c.fillRect(cx - 2, y, 4, 34);
    ROADS_H.forEach(r => { c.fillStyle = asphalt; c.fillRect(cx - STREET_W / 2, r.y, STREET_W, r.h); c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) c.fillRect(cx - STREET_W / 2 + 8 + i * 15, r.y - 18, 8, 16); });
  });
  /* park */
  const gr = se === 'winter' ? ['#eef4fa', '#d9e5f0'] : se === 'autumn' ? ['#b4b160', '#98984e'] : ['#6fbd6c', '#4f9a52'];
  g = c.createLinearGradient(0, PARK_Y, 0, H); g.addColorStop(0, gr[0]); g.addColorStop(1, gr[1]);
  c.fillStyle = g; c.fillRect(0, PARK_Y, W, H - PARK_Y);
  const patch = se === 'winter' ? ['rgba(180,200,225,.35)', 'rgba(255,255,255,.55)'] : se === 'autumn' ? ['rgba(210,140,60,.28)', 'rgba(240,200,90,.22)'] : ['rgba(40,110,60,.22)', 'rgba(170,230,140,.22)'];
  for (let i = 0; i < 260; i++) { c.fillStyle = patch[i % 2]; c.beginPath(); c.ellipse(rnd() * W, PARK_Y + 10 + rnd() * (H - PARK_Y - 20), 30 + rnd() * 70, 14 + rnd() * 30, rnd() * 3, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, PARK_Y, W, 6);
  /* paths and the plaza */
  const path = '#eadfc4', edge = 'rgba(120,100,60,.35)';
  const strokePaths = () => {
    c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190, 124, 0, 0, 7);
    c.rect(80, FOUNTAIN.y - 16, W - 160, 32); c.rect(FOUNTAIN.x - 30, PARK_Y, 60, FOUNTAIN.y - PARK_Y); c.rect(776, PARK_Y, 48, 700); c.rect(2036, PARK_Y, 48, 700);
  };
  c.save(); strokePaths(); c.lineWidth = 8; c.strokeStyle = edge; c.stroke(); c.restore();
  c.fillStyle = se === 'winter' ? '#dfe8f1' : path; strokePaths(); c.fill();
  c.strokeStyle = 'rgba(120,100,60,.2)'; c.lineWidth = px * 0.8; [150, 112].forEach(r => { c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, r, r * 0.65, 0, 0, 7); c.stroke(); });
  /* pond with a shore and a glint */
  c.fillStyle = se === 'winter' ? '#cfe3f0' : '#e7dfc8'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx + 14, POND.ry + 14, 0, 0, 7); c.fill();
  g = c.createRadialGradient(POND.x - 50, POND.y - 30, 10, POND.x, POND.y, POND.rx); g.addColorStop(0, se === 'winter' ? '#eef8fd' : '#8fd8f6'); g.addColorStop(1, se === 'winter' ? '#bcd8e8' : '#3b9ccf');
  c.fillStyle = g; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = px * 1; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx * 0.72, POND.ry * 0.62, 0, 3.4, 4.8); c.stroke();
  /* fountain */
  c.fillStyle = '#dfe3e8'; c.beginPath(); c.arc(FOUNTAIN.x, FOUNTAIN.y, 58, 0, 7); c.fill();
  g = c.createRadialGradient(FOUNTAIN.x - 10, FOUNTAIN.y - 10, 4, FOUNTAIN.x, FOUNTAIN.y, 44); g.addColorStop(0, '#a6e4fa'); g.addColorStop(1, '#4aa6d8');
  c.fillStyle = g; c.beginPath(); c.arc(FOUNTAIN.x, FOUNTAIN.y, 44, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(FOUNTAIN.x, FOUNTAIN.y, 10, 0, 7); c.fill();
  /* trees: a soft shadow, a dark canopy and a lit top */
  const tc = se === 'winter' ? ['#aebdcb', '#cfdae5', '#eef3f8'] : se === 'autumn' ? ['#b8702a', '#d98b36', '#efbf5a'] : ['#2f7a45', '#4aa05a', '#86cf7a'];
  TREES.forEach(t => {
    const r = Math.max(22, t.r * 1.4), cy = t.y - 20;
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(t.x + 8, cy + 10, r, 0, 7); c.fill();
    c.fillStyle = tc[0]; c.beginPath(); c.arc(t.x, cy, r, 0, 7); c.fill();
    c.fillStyle = tc[1]; c.beginPath(); c.arc(t.x - r * 0.12, cy - r * 0.14, r * 0.74, 0, 7); c.fill();
    c.fillStyle = tc[2]; c.beginPath(); c.arc(t.x - r * 0.3, cy - r * 0.34, r * 0.34, 0, 7); c.fill();
  });
  /* buildings: shadow, wall, roof band, awning accent, outline */
  const block = (b, accent) => {
    c.fillStyle = 'rgba(8,12,24,.34)'; c.fillRect(b.x + 10, b.y + 12, b.w, b.h);
    c.fillStyle = b.wall; c.fillRect(b.x, b.y, b.w, b.h);
    g = c.createLinearGradient(b.x, b.y, b.x + b.w, b.y); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.14)');
    c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
    c.fillStyle = b.roof || '#555'; c.fillRect(b.x, b.y, b.w, 42);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(b.x, b.y, b.w, px * 0.9);
    if (accent) { c.fillStyle = accent; c.fillRect(b.x + 6, b.y + b.h - 22, b.w - 12, 14); }
    c.strokeStyle = 'rgba(8,12,24,.5)'; c.lineWidth = px * 0.9; c.strokeRect(b.x, b.y, b.w, b.h);
  };
  DECO.forEach(b => block(b, b.place ? PLACES[b.place].col : b.accent));
  Object.values(BLD).forEach(b => {
    block(b, MINI_KEY[b.id]);
    c.strokeStyle = MINI_KEY[b.id]; c.lineWidth = px * 2.2; c.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = px * 0.8; c.strokeRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
  });
  /* labels and place icons */
  c.textAlign = 'center'; c.textBaseline = 'middle';
  [['apartment', 'H'], ['work', 'W'], ['grocery', 'G'], ['diner', 'D'], ['clinic', '+']].forEach(p => {
    const b = BLD[p[0]], cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 10;
    c.fillStyle = 'rgba(8,12,24,.35)'; c.beginPath(); c.arc(cx + 3, cy + 5, 66, 0, 7); c.fill();
    c.fillStyle = p[0] === 'clinic' ? '#d63b4b' : MINI_KEY[p[0]]; c.beginPath(); c.arc(cx, cy, 64, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = px * 1.4; c.stroke();
    c.fillStyle = '#fff'; c.font = '800 88px "DM Sans", sans-serif'; c.fillText(p[1], cx, cy + 4);
  });
  Object.keys(PLACES).forEach(id => {
    const b = PLACES[id].b; if (!b) return;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 24;
    c.fillStyle = 'rgba(8,12,24,.4)'; c.beginPath(); c.arc(cx, cy, 44, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = px * 0.8; c.stroke();
    placeIcon(c, PLACES[id].icon, cx, cy, 2.4, '#fff');
  });
  /* bus stops */
  BUS_STOPS.forEach(b => {
    c.fillStyle = 'rgba(8,12,24,.4)'; c.beginPath(); c.arc(b.x + 3, b.y + 5, 38, 0, 7); c.fill();
    c.fillStyle = '#2a8fd0'; c.beginPath(); c.arc(b.x, b.y, 36, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = px * 1.2; c.stroke();
    c.fillStyle = '#fff'; c.font = '800 44px "DM Sans", sans-serif'; c.fillText('B', b.x, b.y + 3);
  });
  c.restore();
}
function buildMini() {
  const cv = document.createElement('canvas'), w = 760, s = w / WORLD.w;
  cv.width = w; cv.height = Math.round(WORLD.h * s);
  paintWorldMap(cv.getContext('2d'), s);
  MINI = cv;
}
function buildMiniFrame(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'), R = 26;
  /* edge vignette keeps the map seated inside the glass */
  let g = c.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, w * 0.62); g.addColorStop(0, 'rgba(6,10,22,0)'); g.addColorStop(1, 'rgba(6,10,22,.5)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  /* top gloss */
  g = c.createLinearGradient(0, 0, 0, h * 0.5); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.save(); rr(c, 3, 3, w - 6, h * 0.5, R - 3); c.clip(); c.fillStyle = g; c.fillRect(0, 0, w, h * 0.5); c.restore();
  /* inner hairline and corner marks */
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; rr(c, 4, 4, w - 8, h - 8, R - 4); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.4; c.lineCap = 'round';
  [[14, 14, 1, 1], [w - 14, 14, -1, 1], [14, h - 14, 1, -1], [w - 14, h - 14, -1, -1]].forEach(m => { c.beginPath(); c.moveTo(m[0] + m[2] * 14, m[1]); c.lineTo(m[0] + m[2] * 4, m[1]); c.lineTo(m[0], m[1] + m[3] * 4); c.lineTo(m[0], m[1] + m[3] * 14); c.stroke(); });
  /* compass */
  const cx = w - 34, cy = h - 38;
  c.fillStyle = 'rgba(8,14,26,.72)'; c.beginPath(); c.arc(cx, cy, 20, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(cx, cy - 14); c.lineTo(cx + 5, cy + 2); c.lineTo(cx - 5, cy + 2); c.closePath(); c.fill();
  c.fillStyle = '#e8eef5'; c.beginPath(); c.moveTo(cx, cy + 14); c.lineTo(cx + 5, cy - 2); c.lineTo(cx - 5, cy - 2); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.font = '800 11px "DM Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', cx, cy - 27);
  MINI_FRAME = cv;
}
function drawMinimap() {
  const el = $('#mini');
  if (!el) return;
  const show = S && S.scene === 'town' && G.mode === 'play';
  if (el.hidden === show) el.hidden = !show;
  if (!show) return;
  if (!MINI) buildMini();
  if (!MINI_FRAME || MINI_FRAME.width !== el.width || MINI_FRAME.height !== el.height) buildMiniFrame(el.width, el.height);
  const c = el.getContext('2d'), k = el.width / WORLD.w;
  c.clearRect(0, 0, el.width, el.height);
  c.drawImage(MINI, 0, 0, el.width, el.height);
  if (FX.nf > 0.05) { c.fillStyle = 'rgba(10,16,50,' + (0.42 * FX.nf).toFixed(3) + ')'; c.fillRect(0, 0, el.width, el.height); }
  /* what the camera sees */
  const vx = CAM.x * k, vy = CAM.y * k, vw = (CAM.vw || 800) * k, vh = (CAM.vh || 500) * k;
  c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(vx, vy, vw, vh);
  c.strokeStyle = 'rgba(8,14,26,.55)'; c.lineWidth = 3.4; c.strokeRect(vx, vy, vw, vh);
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.7; c.strokeRect(vx, vy, vw, vh);
  const t = REDUCED ? 0 : (FX.time || 0);
  /* where you are walking to */
  if (G.target) {
    const q = (G.pathQ && G.pathQ.length ? G.pathQ[G.pathQ.length - 1] : G.target), qx = q.x * k, qy = q.y * k, pu = REDUCED ? 0 : (Math.sin(t * 5) + 1) * 0.5;
    c.strokeStyle = 'rgba(8,14,26,.7)'; c.lineWidth = 4.2; c.beginPath(); c.arc(qx, qy, 6 + pu * 2, 0, 7); c.stroke();
    c.strokeStyle = '#ffc247'; c.lineWidth = 2.4; c.beginPath(); c.arc(qx, qy, 6 + pu * 2, 0, 7); c.stroke();
    c.fillStyle = '#ffc247'; c.beginPath(); c.arc(qx, qy, 2, 0, 7); c.fill();
  }
  /* you: a coral dot with a pulsing halo */
  const ph = REDUCED ? 0.5 : (Math.sin(t * 3.2) + 1) * 0.5, px = S.px * k, py = S.py * k;
  c.fillStyle = 'rgba(255,122,89,' + (0.34 - ph * 0.24).toFixed(3) + ')'; c.beginPath(); c.arc(px, py, 8 + ph * 8, 0, 7); c.fill();
  c.fillStyle = 'rgba(8,14,26,.55)'; c.beginPath(); c.arc(px + 0.8, py + 1.4, 6.6, 0, 7); c.fill();
  c.fillStyle = '#ff7a59'; c.beginPath(); c.arc(px, py, 5.6, 0, 7); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(px - 1.6, py - 1.8, 1.6, 0, 7); c.fill();
  c.drawImage(MINI_FRAME, 0, 0);
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
