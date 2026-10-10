/* ============================ seasons, weather and juice ============================ */
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_NAME = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
function seasonOf(day) { return SEASONS[Math.floor((Math.max(1, day || 1) - 1) / 7) % 4]; }
const season = () => seasonOf(S ? S.day : 1);
const WINTER = () => season() === 'winter';

/* park paths, the same shapes the ground painter uses */
function parkPaths(c, gr) {
  const W = WORLD.w;
  c.beginPath();
  c.rect(FOUNTAIN.x - 28 - gr, PARK_Y + 2, 56 + gr * 2, FOUNTAIN.y - PARK_Y);
  c.rect(80 - gr, FOUNTAIN.y - 14 - gr, W - 160 + gr * 2, 28 + gr * 2);
  c.rect(780 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr); c.rect(2040 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr);
  c.moveTo(FOUNTAIN.x + 190 + gr, FOUNTAIN.y); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190 + gr, 124 + gr, 0, 0, 6.2832);
}
/* painted once into each cached ground chunk */
function seasonGround(c, x0, y0, x1, y1) {
  const se = season(), H = WORLD.h, vw = x1 - x0;
  if (y1 < PARK_Y - 40 && se !== 'winter') return;
  if (se === 'winter') {
    // frost on the paving, snow banked against the curbs
    c.fillStyle = 'rgba(240,246,255,.22)'; c.fillRect(x0, TOP_Y + 4, vw, PARK_Y - TOP_Y - 4);
    ROADS_H.forEach(r => {
      c.fillStyle = '#f4f8fc';
      for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
        if (STREETS_X.some(cx => Math.abs(x - cx) < 110)) continue;
        const h1 = 4 + hash01(x, r.y, 3) * 4, h2 = 3 + hash01(x, r.y, 5) * 4;
        c.beginPath(); c.ellipse(x + 11, r.y - 4, 14, h1, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(x + 11, r.y + r.h + 4, 14, h2, 0, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(150,175,205,.35)'; c.fillRect(x0, r.y - 1, vw, 2); c.fillRect(x0, r.y + r.h + 7, vw, 1.5);
    });
    if (y1 > PARK_Y) {
      const g = c.createLinearGradient(0, PARK_Y, 0, H); g.addColorStop(0, '#eef4fa'); g.addColorStop(1, '#dde8f2');
      c.fillStyle = g; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
      // drifts and blue shadows
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) for (let y = PARK_Y + 30; y < H; y += 70) {
        const v = hash01(x, y, 11);
        c.fillStyle = v < 0.5 ? 'rgba(170,195,225,.22)' : 'rgba(255,255,255,.7)';
        c.beginPath(); c.ellipse(x + v * 60, y + hash01(x, y, 12) * 40, 26 + v * 30, 6 + v * 5, 0, 0, 7); c.fill();
      }
      parkPaths(c, 4); c.fillStyle = '#b9c7d6'; c.fill();
      parkPaths(c, 0); c.fillStyle = '#d6e0ea'; c.fill();
      c.fillStyle = 'rgba(140,160,185,.35)';
      for (let x = Math.floor(x0 / 18) * 18; x < x1; x += 18) { c.fillRect(x, FOUNTAIN.y - 6, 6, 2); c.fillRect(x + 8, FOUNTAIN.y + 4, 6, 2); }
      c.fillStyle = '#c9d4df'; c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 150, 96, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,140,165,.25)'; c.lineWidth = 2; [150, 112, 78].forEach(r => { c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, r, r * 0.64, 0, 0, 7); c.stroke(); });
      c.fillStyle = '#e8eef4'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx + 11, POND.ry + 11, 0, 0, 7); c.fill();
    }
    return;
  }
  if (y1 < PARK_Y) return;
  if (se === 'autumn') {
    c.fillStyle = 'rgba(214,150,60,.22)'; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
    const cols = ['#d9822b', '#c0502a', '#e7b24a', '#a8432a', '#f0c35a'];
    for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) for (let y = PARK_Y + 8; y < H; y += 14) {
      const v = hash01(x, y, 21); if (v > 0.32) continue;
      c.fillStyle = cols[Math.floor(hash01(x, y, 22) * cols.length)];
      c.beginPath(); c.ellipse(x + hash01(x, y, 23) * 12, y + hash01(x, y, 24) * 12, 2.6, 1.4, v * 9, 0, 7); c.fill();
    }
  } else if (se === 'spring') {
    for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) for (let y = PARK_Y + 8; y < H; y += 16) {
      const v = hash01(x, y, 31); if (v > 0.12) continue;
      c.fillStyle = v < 0.05 ? '#ffd6e4' : '#ffffff';
      c.beginPath(); c.arc(x + hash01(x, y, 32) * 14, y + hash01(x, y, 33) * 14, 1.6, 0, 7); c.fill();
    }
  } else {
    c.fillStyle = 'rgba(255,230,120,.06)'; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
  }
}
/* drawn every frame over the live ground: ice on the pond */
function seasonLive(c, vx0, vy0, vx1, vy1) {
  if (!WINTER()) return;
  if (!(POND.x + POND.rx > vx0 && POND.x - POND.rx < vx1 && POND.y + POND.ry > vy0 && POND.y - POND.ry < vy1)) return;
  const g = c.createRadialGradient(POND.x - 40, POND.y - 20, 10, POND.x, POND.y, POND.rx);
  g.addColorStop(0, '#e9f5fb'); g.addColorStop(1, '#b6d6e8');
  c.fillStyle = g; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 40 + i * 18; c.beginPath(); c.moveTo(POND.x + Math.cos(a) * r * 0.4, POND.y + Math.sin(a) * r * 0.2); c.lineTo(POND.x + Math.cos(a + 0.4) * r, POND.y + Math.sin(a + 0.4) * r * 0.45); c.stroke(); }
  c.strokeStyle = 'rgba(120,160,190,.35)';
  [[-60, 10, 50], [80, -20, 40], [20, 40, 30]].forEach(p => { c.beginPath(); c.ellipse(POND.x + p[0], POND.y + p[1], p[2], p[2] * 0.3, 0.3, 0, 5); c.stroke(); });
}
/* trees change with the seasons */
function seasonTree(c, t, cx, cy, r, k) {
  const se = season();
  const blob = (ox, oy, rr2, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx + ox * r, cy + oy * r, rr2 * r, 0, 7); c.fill(); };
  if (se === 'winter') {
    // bare branches with snow along the tops
    c.strokeStyle = '#5a3d27'; c.lineCap = 'round';
    const br = [[0, 1, -0.2, -1.1, 3], [0, 0.4, -0.8, -0.5, 2.2], [0, 0.3, 0.8, -0.6, 2.2], [-0.4, -0.3, -0.7, -1, 1.4], [0.4, -0.2, 0.55, -1.05, 1.4], [0, -0.3, 0.2, -1.2, 1.6]];
    br.forEach(b => { c.lineWidth = b[4]; c.beginPath(); c.moveTo(cx + b[0] * r, cy + b[1] * r); c.lineTo(cx + b[2] * r, cy + b[3] * r); c.stroke(); });
    c.lineCap = 'butt';
    c.fillStyle = '#f6fafd';
    br.forEach((b, i) => { c.beginPath(); c.ellipse(cx + (b[0] + b[2]) / 2 * r, cy + (b[1] + b[3]) / 2 * r - 1.5, r * 0.22, 2, Math.atan2(b[3] - b[1], b[2] - b[0]) * (i % 2 ? 1 : 0.6), 0, 7); c.fill(); });
    c.beginPath(); c.ellipse(t.x, t.y + 1, r * 0.8, r * 0.26, 0, 0, 7); c.fill();
    return true;
  }
  let dk, md, lt;
  if (se === 'autumn') {
    const p = [['#9a3b22', '#c8552a', '#e98a3a'], ['#a8641c', '#d98f22', '#f2bf4a'], ['#7a2f2a', '#b0402f', '#dc6a3c'], ['#6b6a28', '#9a8f2c', '#c9b54a']][Math.floor(k * 4) % 4];
    [dk, md, lt] = p;
  } else if (se === 'spring' && k < 0.28) { dk = '#b85c7c'; md = '#e58aa6'; lt = '#ffc3d4'; }
  else return false;
  blob(0, 0.16, 1.02, dk); blob(-0.5, 0.2, 0.62, dk); blob(0.52, 0.22, 0.6, dk);
  blob(-0.34, -0.08, 0.66, md); blob(0.36, -0.04, 0.62, md); blob(0, -0.36, 0.72, md);
  blob(-0.26, -0.44, 0.44, lt); blob(0.22, -0.3, 0.3, lt); blob(-0.52, -0.02, 0.24, lt);
  return true;
}
function snowOnPine(c, x, w, ty, r, sx) {
  c.fillStyle = 'rgba(246,250,253,.95)';
  c.beginPath(); c.moveTo(x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.lineTo(x + sx, ty - r * 1.12); c.lineTo(x + w * 0.5 + sx * 0.4, ty - r * 0.5); c.quadraticCurveTo(x + sx * 0.7, ty - r * 0.38, x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.fill();
}
/* snow on the rooftops, with icicles */
function snowRoof(c, b) {
  if (!WINTER()) return;
  const x = b.x - 7, w = b.w + 14, y = b.y;
  c.fillStyle = '#f6fafd';
  c.beginPath(); c.moveTo(x, y + 3);
  for (let i = 0; i <= w; i += 12) c.quadraticCurveTo(x + i + 6, y - 5 - hash01(b.x, i, 3) * 3, x + Math.min(w, i + 12), y - 1);
  c.lineTo(x + w, y + 4); c.lineTo(x, y + 4); c.closePath(); c.fill();
  c.fillStyle = 'rgba(160,185,215,.5)'; c.fillRect(x, y + 3, w, 1.5);
  const rh = b.kind === 'deco' ? (b.style === 'tower' ? 24 : 36) : b.kind === 'apt' ? 44 : 34;
  c.fillStyle = 'rgba(230,245,255,.9)';
  for (let i = 6; i < w - 4; i += 9) { const L = 3 + hash01(b.x, i, 7) * 8; c.beginPath(); c.moveTo(x + i - 1.6, y + rh); c.lineTo(x + i + 1.6, y + rh); c.lineTo(x + i, y + rh + L); c.closePath(); c.fill(); }
}

