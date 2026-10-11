/* ============================ trees ============================
   Trunks, canopies, pines and winter skeletons are painted once per tree into cached sprites. The canopy is two layers
   (shadowed mass behind, sunlit leaves in front) that sway by different amounts, which makes the whole crown feel soft. */
function wTreeSeed(t) { return ((t.x * 13 + t.y * 7) | 0) & 0xffff; }
function wTreePal(k, se) {
  if (se === 'autumn') { const i = Math.floor(k * 4) % 4, p = [['#9a3b22', '#c8552a', '#e98a3a'], ['#a8641c', '#d98f22', '#f2bf4a'], ['#7a2f2a', '#b0402f', '#dc6a3c'], ['#6b6a28', '#9a8f2c', '#c9b54a']][i]; return { dk: p[0], md: p[1], lt: p[2], kind: 'autumn', id: 'a' + i }; }
  if ((se === 'spring' && k < 0.28) || k < 0.07) return { dk: '#b85c7c', md: '#e58aa6', lt: '#ffc3d4', kind: 'blossom', id: 'b' };
  if (k > 0.93) return { dk: '#b5762a', md: '#e0a23c', lt: '#f6cf6a', kind: 'autumn', id: 'y' };
  const kq = Math.round(k * 8) / 8;
  return { dk: mix('#22633f', '#2f7a45', kq), md: mix('#338a52', '#55a556', kq), lt: mix('#5cb46c', '#8fce6a', kq), kind: 'green', id: 'g' + Math.round(k * 8) };
}
function wPaintTrunk(g, v, se) {
  // origin at the foot of the tree
  const r = mulberry32(v * 71 + 9), bark = se === 'winter' ? '#4e3a2a' : '#5a3d27';
  g.fillStyle = 'rgba(8,12,24,.26)'; g.beginPath(); g.ellipse(0, 1.5, 9, 2.6, 0, 0, 7); g.fill();
  // roots flaring into the ground
  g.fillStyle = bark; g.beginPath(); g.moveTo(-8.6, 2); g.quadraticCurveTo(-5.4, 0.4, -4.6, -6); g.lineTo(4.6, -6); g.quadraticCurveTo(5.6, 0.4, 8.8, 2.2); g.lineTo(5, 3); g.lineTo(-5, 3); g.closePath(); g.fill();
  const tg = g.createLinearGradient(-5, 0, 5, 0); tg.addColorStop(0, '#8a6038'); tg.addColorStop(0.3, bark); tg.addColorStop(1, '#2f1f12');
  g.fillStyle = tg; g.beginPath(); g.moveTo(-4.9, -4); g.lineTo(-3.2, -32); g.lineTo(-1.8, -44); g.lineTo(1.8, -44); g.lineTo(3.2, -32); g.lineTo(4.9, -4); g.closePath(); g.fill();
  // bark furrows and knots
  for (let i = 0; i < 7; i++) {
    const x = -4 + i * 1.35 + (r() - 0.5) * 0.6, top = -34 + r() * 8, bot = -2 - r() * 10;
    g.strokeStyle = 'rgba(20,10,4,' + (0.22 + r() * 0.18).toFixed(3) + ')'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, bot); g.quadraticCurveTo(x + (r() - 0.5) * 2, (top + bot) / 2, x * 0.7, top); g.stroke();
    g.strokeStyle = 'rgba(255,230,190,.1)'; g.beginPath(); g.moveTo(x + 0.8, bot); g.quadraticCurveTo(x + 0.8 + (r() - 0.5) * 2, (top + bot) / 2, x * 0.7 + 0.8, top); g.stroke();
  }
  g.fillStyle = 'rgba(20,10,4,.4)'; g.beginPath(); g.ellipse(-1 + r() * 2, -14 - r() * 8, 1.4, 2, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-4, -30, 1.6, 26);
  if (se !== 'winter') { g.fillStyle = 'rgba(80,130,60,.45)'; g.beginPath(); g.ellipse(-3.2, -6, 1.8, 4.4, 0.1, 0, 7); g.fill(); }
  g.strokeStyle = bark; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-1.4, -38); g.lineTo(-7, -46); g.moveTo(1.4, -38); g.lineTo(7, -46); g.stroke(); g.lineCap = 'butt';
}
/* a canopy layer. origin = centre of the crown (x + sway, y - 40) */
const W_LOBES = [
  [0, 0.16, 1.02, 0], [-0.5, 0.2, 0.62, 0], [0.52, 0.22, 0.6, 0], [0, 0.46, 0.7, 0], [-0.8, 0.04, 0.4, 0], [0.8, 0.08, 0.38, 0],
  [-0.34, -0.08, 0.66, 1], [0.36, -0.04, 0.62, 1], [0, -0.36, 0.72, 1], [-0.64, -0.3, 0.36, 1], [0.62, -0.32, 0.34, 1],
  [-0.26, -0.44, 0.44, 2], [0.22, -0.3, 0.3, 2], [-0.52, -0.02, 0.24, 2], [0.05, -0.64, 0.28, 2], [-0.12, -0.14, 0.3, 2]
];
function wPaintCanopy(g, r, pal, seed, layer) {
  const R = mulberry32(seed * 3 + layer * 977), tones = [pal.dk, pal.md, pal.lt];
  const lobes = W_LOBES.filter(l => layer === 0 ? l[3] < 2 : l[3] > 0).map(l => [l[0] + (R() - 0.5) * 0.1, l[1] + (R() - 0.5) * 0.1, l[2] * (0.94 + R() * 0.12), l[3]]);
  lobes.forEach(l => {
    const lx = l[0] * r, ly = l[1] * r, lr = l[2] * r, tone = tones[l[3]];
    const q = g.createRadialGradient(lx - lr * 0.38, ly - lr * 0.42, lr * 0.08, lx, ly, lr);
    q.addColorStop(0, shade(tone, l[3] === 0 ? 0.06 : 0.16)); q.addColorStop(0.6, tone); q.addColorStop(1, shade(tone, -0.2));
    g.fillStyle = q; g.beginPath(); g.arc(lx, ly, lr, 0, 7); g.fill();
    // scalloped edge: clumps of leaves round the rim
    const n = 7 + Math.floor(lr / 5);
    for (let k = 0; k < n; k++) {
      const a = k / n * 6.283 + R() * 0.5, cr = lr * (0.17 + R() * 0.1);
      g.fillStyle = k % 3 === 0 ? shade(tone, -0.14) : tone; g.beginPath(); g.arc(lx + Math.cos(a) * lr * 0.93, ly + Math.sin(a) * lr * 0.93, cr, 0, 7); g.fill();
    }
  });
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = layer === 0 ? 0.55 : 0.7; g.fillStyle = PAT.leaf; g.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8); g.globalAlpha = 1;
  if (layer === 0) wFadeV(g, -r * 1.4, -r * 0.2, r * 2.8, r * 1.5, 0, 0.42, '6,22,16');
  else {
    // sunlit rims on the upper left, and a cool shade on the lower right
    const sg = g.createLinearGradient(-r, -r, r, r); sg.addColorStop(0, 'rgba(255,248,200,.22)'); sg.addColorStop(0.5, 'rgba(255,248,200,0)'); sg.addColorStop(1, 'rgba(10,30,40,.2)');
    g.fillStyle = sg; g.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
  }
  g.globalCompositeOperation = 'source-over';
  if (layer === 1) {
    lobes.filter(l => l[3] === 2).forEach(l => { g.strokeStyle = 'rgba(255,252,220,.4)'; g.lineWidth = 1.2; g.beginPath(); g.arc(l[0] * r, l[1] * r, l[2] * r * 0.92, 3.5, 4.9); g.stroke(); });
    const nd = Math.floor(r * 0.9);
    for (let i = 0; i < nd; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * r * 0.85, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.9 - r * 0.15;
      if (pal.kind === 'blossom') { g.fillStyle = R() < 0.5 ? '#ffffff' : '#ffd6e4'; g.beginPath(); g.arc(x, y, 1 + R() * 1.1, 0, 7); g.fill(); }
      else if (pal.kind === 'autumn') { g.fillStyle = R() < 0.5 ? shade(pal.lt, 0.2) : shade(pal.dk, 0.1); g.beginPath(); g.ellipse(x, y, 1.8, 0.9, R() * 3, 0, 7); g.fill(); }
      else { g.fillStyle = 'rgba(255,255,200,' + (0.1 + R() * 0.14).toFixed(3) + ')'; g.beginPath(); g.ellipse(x, y, 2 + R() * 1.6, 1 + R(), R() * 3, 0, 7); g.fill(); }
    }
  }
}
function wPaintBare(g, r, seed) {
  const R = mulberry32(seed * 11 + 3);
  const limb = (x, y, a, len, w, depth) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, mx = (x + x2) / 2 + (R() - 0.5) * len * 0.25, my = (y + y2) / 2;
    g.strokeStyle = '#4e3a2a'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = Math.max(0.6, w * 0.3); g.beginPath(); g.moveTo(x, y - w * 0.3); g.quadraticCurveTo(mx, my - w * 0.3, x2, y2 - w * 0.3); g.stroke();
    // snow on the upper side
    g.strokeStyle = '#f6fafd'; g.lineWidth = Math.max(1, w * 0.7); g.lineCap = 'round'; g.beginPath(); g.moveTo(x + (x2 - x) * 0.2, y + (y2 - y) * 0.2 - w * 0.55); g.quadraticCurveTo(mx, my - w * 0.6, x + (x2 - x) * 0.85, y + (y2 - y) * 0.85 - w * 0.55); g.stroke(); g.lineCap = 'butt';
    if (depth > 0) { limb(x2, y2, a - 0.45 - R() * 0.3, len * (0.68 + R() * 0.12), w * 0.68, depth - 1); limb(x2, y2, a + 0.45 + R() * 0.3, len * (0.68 + R() * 0.12), w * 0.68, depth - 1); if (R() < 0.5) limb(x + (x2 - x) * 0.55, y + (y2 - y) * 0.55, a + (R() < 0.5 ? -0.9 : 0.9), len * 0.5, w * 0.5, depth - 2); }
  };
  limb(0, r * 0.95, -1.57, r * 0.82, 3.6, 4);
  limb(0, r * 0.75, -2.25, r * 0.72, 2.8, 3); limb(0, r * 0.75, -0.89, r * 0.72, 2.8, 3); limb(0, r * 0.9, -2.75, r * 0.56, 2.2, 3); limb(0, r * 0.9, -0.4, r * 0.56, 2.2, 3);
  g.fillStyle = '#f6fafd'; g.beginPath(); g.ellipse(0, r * 0.95 - 1.5, 5, 2, 0, 0, 7); g.fill();
}
function wPaintPineTier(g, r, i, se, seed) {
  // origin at the centre of the tier's base; the tier rises r*1.12 and is (1.25 - i*.28) r wide each side
  const w = r * (1.25 - i * 0.28), h = r * 1.12, R = mulberry32(seed * 5 + i * 31), cols = ['#1f5a40', '#2a6f4c', '#3a8558'];
  const tg = g.createLinearGradient(-w, 0, w, 0); tg.addColorStop(0, shade(cols[i], 0.18)); tg.addColorStop(0.5, cols[i]); tg.addColorStop(1, shade(cols[i], -0.28));
  g.fillStyle = tg; g.beginPath(); g.moveTo(0, -h);
  const teeth = 7;
  g.lineTo(w, 0); for (let k = 0; k <= teeth; k++) { const t = k / teeth, x = w - 2 * w * t, y = (k % 2 ? 0 : 3.4) + 0.6 * (R() - 0.5); g.lineTo(x, y); }
  g.lineTo(-w, 0); g.closePath(); g.fill();
  g.save(); g.clip(); g.globalAlpha = 0.6; g.fillStyle = PAT.leaf; g.fillRect(-w, -h, w * 2, h + 6); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(8,30,20,.35)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(-w * (1 - k * 0.2), -h * (k * 0.22)); g.quadraticCurveTo(0, -h * (k * 0.22) + 5, w * (1 - k * 0.2), -h * (k * 0.22)); g.stroke(); }
  wFadeV(g, -w, -4, w * 2, 10, 0, 0.4, '4,18,12');
  g.fillStyle = 'rgba(255,255,230,.2)'; g.beginPath(); g.moveTo(0, -h); g.lineTo(-w * 0.86, -1); g.lineTo(-w * 0.2, -1); g.closePath(); g.fill();
  g.restore();
  if (se === 'winter') {
    g.fillStyle = 'rgba(246,250,253,.96)'; g.beginPath(); g.moveTo(-w * 0.5, -h * 0.5); g.lineTo(0, -h); g.lineTo(w * 0.5, -h * 0.5); g.quadraticCurveTo(0, -h * 0.34, -w * 0.5, -h * 0.5); g.fill();
    g.beginPath(); g.moveTo(-w * 0.98, -1); g.quadraticCurveTo(-w * 0.8, -6, -w * 0.6, -3); g.quadraticCurveTo(-w * 0.4, -7, -w * 0.2, -3); g.lineTo(-w * 0.25, 1); g.lineTo(-w * 0.98, 1); g.fill();
  }
}
/* sprites are shared between trees of the same size class, palette and variant, so scrolling into a new stretch of park
   mostly reuses what is already painted */
function wCanopySprites(t, se, pal) {
  const rq = 2 * Math.round(t.r / 2), v = wTreeSeed(t) & 3, W = Math.ceil(rq * 2.9), H = Math.ceil(rq * 2.8), ox = W / 2, oy = H * 0.5;
  const key = 'tc' + se + pal.id + '_' + rq + 'v' + v;
  const mk = layer => wspr(key + 'L' + layer, W, H, g => { g.translate(ox, oy); wPaintCanopy(g, rq, pal, 1000 + v * 77 + pal.id.charCodeAt(0) * 13, layer); });
  return { b: mk(0), f: mk(1), ox, oy, k: t.r / rq };
}
function wDrawCanopy(c, t, cx, cy, pal) {
  const s = wCanopySprites(t, season(), pal), sw = cx - t.x, k = s.k;
  c.drawImage(s.b.cv, cx - s.ox * k - sw * 0.35, cy - s.oy * k, s.b.w * k, s.b.h * k);
  c.drawImage(s.f.cv, cx - s.ox * k + sw * 0.25, cy - s.oy * k, s.f.w * k, s.f.h * k);
}
function wDrawBare(c, t, cx, cy) {
  const rq = 2 * Math.round(t.r / 2), v = wTreeSeed(t) & 3, W = Math.ceil(rq * 2.9), H = Math.ceil(rq * 2.8), ox = W / 2, oy = H * 0.5, k = t.r / rq;
  const s = wspr('tb' + rq + 'v' + v, W, H, g => { g.translate(ox, oy); wPaintBare(g, rq, 500 + v * 53); });
  c.drawImage(s.cv, cx - ox * k, cy - oy * k, W * k, H * k);
}
function wDrawPine(c, t, sway, se) {
  const rq = 2 * Math.round(t.r / 2), v = wTreeSeed(t) & 3, k = t.r / rq;
  for (let i = 0; i < 3; i++) {
    const w = rq * (1.25 - i * 0.28), h = rq * 1.12, ty = t.y - 16 - i * t.r * 0.62, sx = sway * (0.4 + i * 0.3);
    const s = wspr('tp' + se + rq + 'v' + v + 'i' + i, w * 2 + 10, h + 12, g => { g.translate(w + 5, h + 4); wPaintPineTier(g, rq, i, se, 300 + v * 41); });
    c.drawImage(s.cv, t.x + sx * 0.4 - (w + 5) * k, ty - (h + 4) * k, s.w * k, s.h * k);
  }
}
