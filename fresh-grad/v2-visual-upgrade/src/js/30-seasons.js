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
  if (se === 'winter') { wWinterGround(c, x0, y0, x1, y1); return; }
  // trees shed on, or bloom over, the ground beneath them in every part of town
  wTreeLitter(c, se, x0, y0, x1, y1);
  if (y1 < PARK_Y) return;
  const ya = Math.max(y0, PARK_Y + 6);
  if (se === 'autumn') {
    c.fillStyle = 'rgba(214,150,60,.2)'; c.fillRect(x0, ya, vw, Math.min(H, y1) - ya);
    wLeafScatter(c, x0, ya, x1, Math.min(H, y1), 0.3);
  } else if (se === 'spring') {
    c.fillStyle = 'rgba(150,255,120,.05)'; c.fillRect(x0, ya, vw, Math.min(H, y1) - ya);
    wPetalScatter(c, x0, ya, x1, Math.min(H, y1), 0.1);
  } else {
    c.fillStyle = 'rgba(40,170,70,.07)'; c.fillRect(x0, ya, vw, Math.min(H, y1) - ya);
    c.fillStyle = 'rgba(255,230,120,.04)'; c.fillRect(x0, ya, vw, Math.min(H, y1) - ya);
  }
}
/* drawn every frame over the live ground: ice on the pond */
function seasonLive(c, vx0, vy0, vx1, vy1) {
  if (!WINTER()) return;
  if (!(POND.x + POND.rx > vx0 && POND.x - POND.rx < vx1 && POND.y + POND.ry > vy0 && POND.y - POND.ry < vy1)) return;
  wDrawIce(c);
}
/* trees change with the seasons */
function seasonTree(c, t, cx, cy, r, k) {
  const se = season();
  if (se === 'winter') {
    wDrawBare(c, t, cx, cy);
    c.fillStyle = '#f6fafd'; c.beginPath(); c.ellipse(t.x, t.y + 1, r * 0.8, r * 0.26, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,175,205,.4)'; c.beginPath(); c.ellipse(t.x + r * 0.15, t.y + 2.4, r * 0.7, r * 0.16, 0, 0, Math.PI); c.fill();
    return true;
  }
  if (se === 'autumn' || (se === 'spring' && k < 0.28)) { wDrawCanopy(c, t, cx, cy, wTreePal(k, se)); return true; }
  return false;
}
function snowOnPine(c, x, w, ty, r, sx) {
  c.fillStyle = 'rgba(246,250,253,.95)';
  c.beginPath(); c.moveTo(x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.lineTo(x + sx, ty - r * 1.12); c.lineTo(x + w * 0.5 + sx * 0.4, ty - r * 0.5); c.quadraticCurveTo(x + sx * 0.7, ty - r * 0.38, x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.fill();
}
/* snow on the rooftops, with icicles */
function snowRoof(c, b) {
  if (!WINTER()) return;
  const rh = b.kind === 'deco' ? (b.style === 'tower' ? 24 : 36) : b.kind === 'apt' ? 44 : b.kind === 'diner' ? 40 : b.kind === 'work' || b.kind === 'shop' || b.kind === 'clinic' ? 46 : 34;
  const w = Math.round(b.w), s = wspr('sr' + (b.id || b.x) + '|' + w + '|' + rh, w + 22, rh + 28, g => wPaintSnowRoof(g, b, w, rh));
  c.drawImage(s.cv, b.x - 11, b.y - 9, s.w, s.h);
}
