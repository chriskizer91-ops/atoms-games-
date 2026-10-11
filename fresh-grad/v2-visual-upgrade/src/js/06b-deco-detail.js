/* ============================ filler buildings: shop windows and facade hero details ============================ */
/* what sits behind each shop's window; every painter fills a W x H pane, details are fractions so any width works */
function wShelfRow(g, x, y, w, cols, r, hmin, hmax) {
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, y + 1.5, w, 2); g.fillStyle = '#8a5d3c'; g.fillRect(x, y, w, 2.2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, y, w, 0.7);
  let px = x + 1.5;
  while (px < x + w - 3) { const bw = 2 + r() * 2.4, bh = hmin + r() * (hmax - hmin); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(px, y - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(px, y - bh, 0.7, bh); px += bw + 0.5; }
}
function wShopWall(g, W, H, a, b2) {
  const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, a); q.addColorStop(1, b2); g.fillStyle = q; g.fillRect(0, 0, W, H);
  wFadeV(g, 0, 0, W, 6, 0.25, 0, '20,14,10');
}
const W_SHOPS = {
  _(g, W, H, k) {
    wShopWall(g, W, H, '#e8dcc2', '#cdbb98');
    const dc = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#c77dff'], r = mulberry32(k * 17 + 3);
    g.fillStyle = '#8a5d3c'; g.fillRect(2, H * 0.62, W - 4, 3); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(2, H * 0.62, W - 4, 0.8);
    for (let i = 0; i * 12 + 12 < W; i++) { g.fillStyle = dc[(i + k) % dc.length]; const hh = 9 + (i % 2) * 4; rr(g, 4 + i * 12, H * 0.62 - hh, 8, hh, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(5 + i * 12, H * 0.62 - hh + 1, 1.2, hh - 3); }
    g.fillStyle = '#6a4a2e'; g.fillRect(0, H * 0.82, W, H * 0.18);
  },
  Pharmacy(g, W, H, k) {
    wShopWall(g, W, H, '#eef6f0', '#cfe3d6'); const r = mulberry32(k + 5), cols = ['#f4f7f2', '#e9a23b', '#4aa87a', '#3f7ea6', '#f4f7f2'];
    [0.34, 0.58].forEach(f => wShelfRow(g, 3, H * f, W - 6, cols, r, 4, 8));
    g.fillStyle = '#2f9d6a'; g.fillRect(W / 2 - 2, 3, 4, 12); g.fillRect(W / 2 - 6, 7, 12, 4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W / 2 - 2, 3, 4, 1);
    g.fillStyle = '#f4f7f2'; g.fillRect(0, H * 0.78, W, H * 0.22); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, H * 0.78, W, 1.2);
  },
  'First Bank'(g, W, H) {
    wShopWall(g, W, H, '#e9e6df', '#bdb8ac');
    g.fillStyle = '#c9a24a'; g.fillRect(0, H * 0.5, W, 2); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, H * 0.5, W, 0.7);
    for (let i = 1; i < 4; i++) { g.fillStyle = 'rgba(120,200,230,.45)'; g.fillRect(W * i / 4 - 4, H * 0.18, 8, H * 0.32); g.fillStyle = '#c9a24a'; g.fillRect(W * i / 4 - 4, H * 0.18, 8, 1.2); }
    g.fillStyle = '#2a6f97'; g.fillRect(W * 0.04, H * 0.3, 10, 14); g.fillStyle = '#9fe0f5'; g.fillRect(W * 0.04 + 1.5, H * 0.3 + 2, 7, 5);
    g.fillStyle = '#4a3a2a'; g.fillRect(0, H * 0.78, W, H * 0.22); g.fillStyle = '#3f9a55'; g.beginPath(); g.ellipse(W * 0.92, H * 0.68, 4, 8, 0, 0, 7); g.fill();
  },
  Bookshop(g, W, H, k) {
    wShopWall(g, W, H, '#5a3a24', '#3a2416'); const r = mulberry32(k + 9), cols = ['#c0392b', '#2f6db0', '#e0a82e', '#3f8f5a', '#7a4fb0', '#d9d2c2', '#e07a3f'];
    [0.28, 0.5, 0.72].forEach(f => wShelfRow(g, 2, H * f, W - 4, cols, r, 5, 9));
    g.fillStyle = '#ffe9b0'; g.beginPath(); g.moveTo(W - 14, H * 0.46); g.lineTo(W - 6, H * 0.46); g.lineTo(W - 8, H * 0.38); g.lineTo(W - 12, H * 0.38); g.fill(); wGlow(g, W - 10, H * 0.46, 14, '255,226,150', 0.4);
  },
  Bakery(g, W, H, k) {
    wShopWall(g, W, H, '#f6ead2', '#e6cfa6');
    g.fillStyle = '#9a6a3c'; g.fillRect(0, H * 0.58, W, H * 0.42); g.fillStyle = 'rgba(190,230,250,.45)'; g.fillRect(2, H * 0.4, W - 4, H * 0.2);
    for (let i = 0; i * 11 + 10 < W - 4; i++) { const x = 5 + i * 11; g.fillStyle = '#c98a45'; g.beginPath(); g.ellipse(x + 4, H * 0.54, 5, 3.4, 0, 0, 7); g.fill(); g.fillStyle = '#e0a863'; g.beginPath(); g.ellipse(x + 3, H * 0.52, 3, 1.4, 0, 0, 7); g.fill(); }
    g.fillStyle = '#f4b6c2'; g.fillRect(W - 14, H * 0.3, 10, 4); g.fillRect(W - 12, H * 0.2, 6, 4); g.fillStyle = '#d63b4b'; g.beginPath(); g.arc(W - 9, H * 0.18, 1.4, 0, 7); g.fill();
    g.strokeStyle = '#b8803c'; g.lineWidth = 2.4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(5 + i * 7, H * 0.3); g.lineTo(10 + i * 7, H * 0.08); g.stroke(); }
  },
  Hardware(g, W, H, k) {
    wShopWall(g, W, H, '#c9a56a', '#a9824a');
    g.fillStyle = 'rgba(60,40,20,.22)'; for (let x = 4; x < W; x += 6) for (let y = 4; y < H * 0.7; y += 6) g.fillRect(x, y, 1, 1);
    g.strokeStyle = '#4a545c'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, 6); g.lineTo(8, 18); g.stroke(); g.fillStyle = '#4a545c'; g.fillRect(4, 5, 9, 4);
    g.fillStyle = '#c9ced2'; g.beginPath(); g.moveTo(W * 0.35, 5); g.lineTo(W * 0.35 + 18, 8); g.lineTo(W * 0.35 + 18, 11); g.lineTo(W * 0.35, 9); g.fill(); g.fillStyle = '#8a5d3c'; g.fillRect(W * 0.35 - 6, 5, 6, 4);
    ['#d63b4b', '#2f6db0', '#e0a82e'].forEach((c2, i) => { g.fillStyle = c2; g.fillRect(W * 0.12 + i * 11, H * 0.62, 9, 9); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(W * 0.12 + i * 11, H * 0.62, 9, 1.6); g.fillStyle = '#c9ced2'; g.fillRect(W * 0.12 + i * 11 + 2, H * 0.62 - 1.6, 5, 1.6); });
    g.fillStyle = '#d63b4b'; g.fillRect(W * 0.7, H * 0.4, 14, 16); g.fillStyle = '#4a545c'; g.fillRect(W * 0.7, H * 0.4, 14, 3);
    g.fillStyle = '#5a3a24'; g.fillRect(0, H * 0.82, W, H * 0.18);
  },
  Cinema(g, W, H, k) {
    wShopWall(g, W, H, '#2a1420', '#14080e');
    [[0.1, '#ff7b00'], [0.4, '#4361ee'], [0.7, '#e63946']].forEach(p => { const x = W * p[0]; g.fillStyle = p[1]; g.fillRect(x, 4, W * 0.2, H * 0.55); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, 4, W * 0.2, 1); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 2, H * 0.4, W * 0.2 - 4, 1.6); wGlow(g, x + W * 0.1, H * 0.3, 14, '255,226,170', 0.3); });
    g.fillStyle = '#5c1526'; g.fillRect(0, H * 0.78, W, H * 0.22);
  },
  Salon(g, W, H, k) {
    wShopWall(g, W, H, '#f3d6e4', '#d9a4be');
    g.fillStyle = '#fff'; rr(g, W * 0.08, 4, W * 0.34, H * 0.62, 5); g.fill(); g.fillStyle = 'rgba(190,225,245,.9)'; rr(g, W * 0.08 + 2, 6, W * 0.34 - 4, H * 0.62 - 4, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(W * 0.12, 8); g.lineTo(W * 0.2, 8); g.lineTo(W * 0.14, H * 0.6); g.lineTo(W * 0.1, H * 0.6); g.fill();
    g.fillStyle = '#2a2236'; rr(g, W * 0.55, H * 0.4, W * 0.18, H * 0.3, 4); g.fill(); g.fillRect(W * 0.62, H * 0.7, 3, H * 0.2); g.fillStyle = '#c05d8a'; g.fillRect(W * 0.52, H * 0.3, W * 0.24, 3);
    g.fillStyle = '#7a3a58'; g.fillRect(0, H * 0.84, W, H * 0.16);
  },
  Laundromat(g, W, H, k) {
    wShopWall(g, W, H, '#dff1f0', '#a9d2cf');
    for (let i = 0; i * 17 + 15 < W; i++) { const x = 3 + i * 17; g.fillStyle = '#f4f7f8'; rr(g, x, H * 0.16, 15, H * 0.66, 2); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, H * 0.16 + H * 0.66 - 1, 15, 1); const wg = g.createRadialGradient(x + 6.5, H * 0.52, 1, x + 7.5, H * 0.52, 6); wg.addColorStop(0, '#9ad4ee'); wg.addColorStop(1, '#2f7ea6'); g.fillStyle = wg; g.beginPath(); g.arc(x + 7.5, H * 0.52, 5.4, 0, 7); g.fill(); g.strokeStyle = '#c9ced2'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = '#2a9d8f'; g.fillRect(x + 2, H * 0.22, 4, 2); g.fillStyle = '#e9c46a'; g.fillRect(x + 8, H * 0.22, 4, 2); }
    g.fillStyle = '#e07a3f'; g.fillRect(0, H * 0.88, W, H * 0.12);
  },
  'Bike Shop'(g, W, H, k) {
    wShopWall(g, W, H, '#f0e2d2', '#d5b99c');
    [[0.25, '#e76f51'], [0.62, '#2a9d8f']].forEach(p => { const x = W * p[0], y = H * 0.62; g.strokeStyle = '#20242c'; g.lineWidth = 1.2; g.beginPath(); g.arc(x - 7, y, 6, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 7, y, 6, 0, 7); g.stroke(); g.strokeStyle = p[1]; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x - 2, y - 8); g.lineTo(x + 5, y - 8); g.lineTo(x + 7, y); g.moveTo(x - 2, y - 8); g.lineTo(x, y); g.lineTo(x - 7, y); g.stroke(); });
    g.fillStyle = '#20242c'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(W * 0.9, H * 0.84 - i * 3.4, 6, 2.4, 0, 0, 7); g.fill(); }
    g.fillStyle = '#6a4a2e'; g.fillRect(0, H * 0.86, W, H * 0.14);
  },
  'Cafe Luna'(g, W, H, k) {
    wShopWall(g, W, H, '#cdd9e8', '#9fb2cc');
    for (let i = 0; i < 3; i++) { const lx = W * (0.2 + i * 0.3); g.strokeStyle = 'rgba(30,24,20,.7)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, 8); g.stroke(); g.fillStyle = '#3d5a80'; g.beginPath(); g.moveTo(lx - 4.5, 14); g.lineTo(lx + 4.5, 14); g.lineTo(lx + 2, 8); g.lineTo(lx - 2, 8); g.fill(); wGlow(g, lx, 15, 11, '255,226,150', 0.35); }
    g.fillStyle = '#6a4a2e'; for (let i = 0; i < 2; i++) { const x = W * (0.12 + i * 0.5); g.beginPath(); g.ellipse(x + 8, H * 0.62, 9, 2.6, 0, 0, 7); g.fill(); g.fillRect(x + 7.2, H * 0.62, 1.6, H * 0.22); g.fillStyle = '#f6f1e7'; g.fillRect(x + 4, H * 0.62 - 3, 3, 3); g.fillRect(x + 10, H * 0.62 - 3, 3, 3); g.fillStyle = '#6a4a2e'; }
    g.fillStyle = '#2d3a32'; g.fillRect(W * 0.72, H * 0.22, W * 0.22, H * 0.22); g.fillStyle = 'rgba(255,255,255,.7)'; for (let k2 = 0; k2 < 3; k2++) g.fillRect(W * 0.75, H * (0.27 + k2 * 0.05), W * 0.12, 0.8);
    g.fillStyle = '#3a2a22'; g.fillRect(0, H * 0.86, W, H * 0.14);
  },
  'Pizza Place'(g, W, H, k) {
    wShopWall(g, W, H, '#f4e2c8', '#d8b78e');
    g.fillStyle = '#8a3b2a'; g.beginPath(); g.moveTo(W * 0.62, H * 0.7); g.lineTo(W * 0.62, H * 0.36); g.arc(W * 0.77, H * 0.36, W * 0.15, Math.PI, 0); g.lineTo(W * 0.92, H * 0.7); g.fill(); g.fillStyle = '#ff8a2a'; g.beginPath(); g.moveTo(W * 0.68, H * 0.7); g.lineTo(W * 0.68, H * 0.44); g.arc(W * 0.77, H * 0.44, W * 0.09, Math.PI, 0); g.lineTo(W * 0.86, H * 0.7); g.fill(); wGlow(g, W * 0.77, H * 0.55, 18, '255,140,40', 0.5);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#d63b4b' : '#f6f1e7'; g.fillRect(3 + i * 7, H * 0.5 + j * 6, 7, 6); }
    g.fillStyle = '#e8c06a'; g.beginPath(); g.arc(W * 0.14, H * 0.3, 6, 0, 7); g.fill(); g.fillStyle = '#d63b4b'; g.beginPath(); g.arc(W * 0.12, H * 0.28, 1.6, 0, 7); g.arc(W * 0.17, H * 0.32, 1.6, 0, 7); g.fill();
    g.fillStyle = '#5a3a24'; g.fillRect(0, H * 0.84, W, H * 0.16);
  },
  Dentist(g, W, H, k) {
    wShopWall(g, W, H, '#dff3f6', '#a9d7e0');
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(W * 0.5 - 7, 6); g.quadraticCurveTo(W * 0.5 - 8, 2, W * 0.5 - 2, 4); g.quadraticCurveTo(W * 0.5, 5, W * 0.5 + 2, 4); g.quadraticCurveTo(W * 0.5 + 8, 2, W * 0.5 + 7, 6); g.quadraticCurveTo(W * 0.5 + 6, 12, W * 0.5 + 4, 16); g.quadraticCurveTo(W * 0.5 + 2, 12, W * 0.5, 11); g.quadraticCurveTo(W * 0.5 - 2, 12, W * 0.5 - 4, 16); g.quadraticCurveTo(W * 0.5 - 6, 12, W * 0.5 - 7, 6); g.fill();
    g.strokeStyle = '#3aa6b9'; g.lineWidth = 1; g.stroke();
    for (let i = 0; i < 3; i++) { g.fillStyle = '#3aa6b9'; rr(g, 5 + i * W * 0.3, H * 0.6, W * 0.2, H * 0.2, 2.4); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(6 + i * W * 0.3, H * 0.6 + 1, W * 0.2 - 2, 1); }
    g.fillStyle = '#b8683f'; g.fillRect(W * 0.9, H * 0.76, 5, 6); g.fillStyle = '#3f9a55'; g.beginPath(); g.ellipse(W * 0.9 + 2.5, H * 0.66, 5, 8, 0, 0, 7); g.fill();
  },
  'Law Office'(g, W, H, k) {
    wShopWall(g, W, H, '#4a3626', '#2a1c12'); const r = mulberry32(k + 21);
    wShelfRow(g, 2, H * 0.34, W * 0.5, ['#7a2a2a', '#2a3a5a', '#4a3a2a', '#2f4a3a'], r, 5, 9); wShelfRow(g, 2, H * 0.6, W * 0.5, ['#7a2a2a', '#2a3a5a', '#4a3a2a', '#2f4a3a'], r, 5, 9);
    g.fillStyle = '#6a4a2e'; g.fillRect(W * 0.52, H * 0.62, W * 0.44, 4); g.fillStyle = '#2f7d4f'; g.beginPath(); g.moveTo(W * 0.7, H * 0.62); g.lineTo(W * 0.78, H * 0.62); g.lineTo(W * 0.76, H * 0.46); g.lineTo(W * 0.72, H * 0.46); g.fill(); wGlow(g, W * 0.74, H * 0.5, 12, '255,226,150', 0.4);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.beginPath(); g.moveTo(W * 0.84, H * 0.18); g.lineTo(W * 0.84, H * 0.4); g.moveTo(W * 0.78, H * 0.22); g.lineTo(W * 0.9, H * 0.22); g.stroke();
  },
  'Post Office'(g, W, H, k) {
    wShopWall(g, W, H, '#e8e2d6', '#c4bba8');
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = 3 + i * (W - 6) / 6, y = 4 + j * 8; g.fillStyle = '#c9a24a'; g.fillRect(x, y, (W - 6) / 6 - 1, 7); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x, y, (W - 6) / 6 - 1, 1); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 2, y + 3, 3, 1.2); }
    g.fillStyle = '#2a6f97'; g.fillRect(0, H * 0.62, W, H * 0.12); g.fillStyle = '#d63b4b'; g.fillRect(0, H * 0.74, W, 2); g.fillStyle = '#f6f1e7'; g.fillRect(0, H * 0.78, W, H * 0.22);
  },
  Florist(g, W, H, k) {
    wShopWall(g, W, H, '#e5f1de', '#bcd8ae'); const r = mulberry32(k + 33), cols = ['#ff6f91', '#ffd166', '#f8f9fa', '#c77dff', '#ff9a4d', '#e63946'];
    for (let i = 0; i * 14 + 14 < W; i++) { const x = 4 + i * 14; g.fillStyle = '#6a8a9a'; g.beginPath(); g.moveTo(x, H * 0.7); g.lineTo(x + 11, H * 0.7); g.lineTo(x + 9.5, H * 0.92); g.lineTo(x + 1.5, H * 0.92); g.fill(); for (let f = 0; f < 5; f++) { const fx = x + 1.5 + f * 2, fy = H * 0.34 + r() * H * 0.2; g.strokeStyle = '#3f8a4f'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(fx, H * 0.7); g.lineTo(fx + (r() - 0.5) * 3, fy); g.stroke(); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.arc(fx, fy, 2.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(fx - 0.7, fy - 0.7, 0.8, 0, 7); g.fill(); } }
    g.strokeStyle = '#3f8a4f'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(W * 0.3, 0); g.quadraticCurveTo(W * 0.32, 10, W * 0.28, 16); g.stroke();
  },
  Fitness(g, W, H, k) {
    wShopWall(g, W, H, '#2a2e3a', '#14161e');
    g.fillStyle = 'rgba(180,210,240,.22)'; g.fillRect(2, 3, W * 0.4, H * 0.6); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(5, 3); g.lineTo(11, 3); g.lineTo(6, H * 0.6); g.lineTo(3, H * 0.6); g.fill();
    for (let i = 0; i < 4; i++) { const y = H * 0.5 + i * 3; g.fillStyle = '#6a737a'; g.fillRect(W * 0.5, y, W * 0.4, 1.6); g.fillStyle = '#d63b4b'; g.beginPath(); g.arc(W * 0.5 + 2, y + 0.8, 2.4 + i * 0.3, 0, 7); g.arc(W * 0.9 - 2, y + 0.8, 2.4 + i * 0.3, 0, 7); g.fill(); }
    g.fillStyle = '#4a545c'; g.fillRect(W * 0.5, H * 0.3, W * 0.22, 3); g.fillRect(W * 0.62, H * 0.3, 2, H * 0.2); g.fillStyle = '#c9ced2'; g.fillRect(W * 0.5, H * 0.3, W * 0.22, 0.8);
    g.fillStyle = '#4361ee'; g.fillRect(0, H * 0.9, W, H * 0.1); wGlow(g, W / 2, H * 0.9, W * 0.5, '90,120,255', 0.3);
  },
  'Hotel Arden'(g, W, H, k) {
    wShopWall(g, W, H, '#f0e2c4', '#cfb383');
    wGlow(g, W / 2, 8, W * 0.4, '255,232,170', 0.6); g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, 7); g.stroke();
    for (let i = -2; i <= 2; i++) { g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(W / 2 + i * 5, 9 + Math.abs(i) * 1.6, 1.5, 0, 7); g.fill(); }
    g.fillStyle = '#5a2a30'; g.fillRect(W * 0.18, H * 0.58, W * 0.64, H * 0.18); g.fillStyle = '#c9a24a'; g.fillRect(W * 0.18, H * 0.58, W * 0.64, 1.6); g.beginPath(); g.arc(W * 0.3, H * 0.55, 2, Math.PI, 0); g.fill();
    g.fillStyle = '#7a1f2c'; g.fillRect(0, H * 0.84, W, H * 0.16);
  },
  'Record Store'(g, W, H, k) {
    wShopWall(g, W, H, '#3a2a4a', '#1f1530'); const r = mulberry32(k + 44), cols = ['#ff7eb6', '#6fd1ff', '#ffd166', '#5be3a0', '#c77dff'];
    for (let i = 0; i < 6; i++) { const x = 4 + i * (W - 8) / 6, y = 6 + (i % 2) * 8; g.fillStyle = '#14101e'; g.beginPath(); g.arc(x + 4, y + 4, 5.4, 0, 7); g.fill(); g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(x + 4, y + 4, 2, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 0.6; g.beginPath(); g.arc(x + 4, y + 4, 3.8, 0, 7); g.stroke(); }
    g.fillStyle = '#6a4a2e'; g.fillRect(2, H * 0.66, W - 4, H * 0.2); for (let i = 0; i * 4 + 4 < W - 4; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(3 + i * 4, H * 0.6, 3, H * 0.12); }
  },
  'Toy Shop'(g, W, H, k) {
    wShopWall(g, W, H, '#fdeec4', '#f3c98a');
    ['#ff6f91', '#6fd1ff', '#ffd166'].forEach((c2, i) => { g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(W * (0.15 + i * 0.12), 20); g.lineTo(W * (0.15 + i * 0.12) + (i - 1) * 2, 6); g.stroke(); g.fillStyle = c2; g.beginPath(); g.ellipse(W * (0.15 + i * 0.12) + (i - 1) * 2, 6, 3.6, 4.4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(W * (0.15 + i * 0.12) + (i - 1) * 2 - 1, 4.6, 1, 0, 7); g.fill(); });
    g.fillStyle = '#a8744c'; g.beginPath(); g.arc(W * 0.7, H * 0.58, 6, 0, 7); g.arc(W * 0.7 - 5, H * 0.4, 2.4, 0, 7); g.arc(W * 0.7 + 5, H * 0.4, 2.4, 0, 7); g.fill(); g.beginPath(); g.arc(W * 0.7, H * 0.44, 4.4, 0, 7); g.fill(); g.fillStyle = '#e8c9a0'; g.beginPath(); g.arc(W * 0.7, H * 0.47, 2, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(W * 0.7 - 2.4, H * 0.42, 1, 1); g.fillRect(W * 0.7 + 1.4, H * 0.42, 1, 1);
    ['#e63946', '#2f6db0', '#e0a82e', '#3f8f5a'].forEach((c2, i) => { g.fillStyle = c2; g.fillRect(4 + (i % 2) * 9, H * 0.82 - Math.floor(i / 2) * 9 - 9, 9, 9); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(4 + (i % 2) * 9, H * 0.82 - Math.floor(i / 2) * 9 - 9, 9, 1.4); });
    g.fillStyle = '#c05d3a'; g.fillRect(0, H * 0.86, W, H * 0.14);
  },
  Tailor(g, W, H, k) {
    wShopWall(g, W, H, '#e8dce8', '#c4acc4');
    const mx = W * 0.62; g.fillStyle = '#a8744c'; g.fillRect(mx - 1, H * 0.5, 2, H * 0.4); g.fillStyle = '#e8c9a0'; g.beginPath(); g.ellipse(mx, H * 0.2, 3, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#c77dff'; g.beginPath(); g.moveTo(mx - 5, H * 0.3); g.lineTo(mx + 5, H * 0.3); g.lineTo(mx + 9, H * 0.82); g.lineTo(mx - 9, H * 0.82); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(mx - 5, H * 0.3); g.lineTo(mx - 1, H * 0.3); g.lineTo(mx - 5, H * 0.82); g.lineTo(mx - 9, H * 0.82); g.fill();
    ['#e76f51', '#2a9d8f', '#e9c46a'].forEach((c2, i) => { g.fillStyle = c2; rr(g, 4 + i * 9, H * 0.56, 8, H * 0.3, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(5 + i * 9, H * 0.56 + 1, 1.4, H * 0.3 - 2); });
    g.strokeStyle = '#e9c46a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, 8); for (let i = 0; i < 8; i++) g.lineTo(2 + i * (W - 4) / 8, 8 + (i % 2) * 2); g.stroke();
  },
  'Noodle Bar'(g, W, H, k) {
    wShopWall(g, W, H, '#7a3a2a', '#4a1f18');
    [0.2, 0.5, 0.8].forEach(f => { const x = W * f; g.strokeStyle = 'rgba(30,20,16,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 5); g.stroke(); const lg = g.createRadialGradient(x - 1, 10, 1, x, 11, 7); lg.addColorStop(0, '#ff7a6a'); lg.addColorStop(1, '#c0281f'); g.fillStyle = lg; g.beginPath(); g.ellipse(x, 11, 5, 6.4, 0, 0, 7); g.fill(); g.fillStyle = '#e9c46a'; g.fillRect(x - 2.4, 4.6, 4.8, 1.4); g.fillRect(x - 2.4, 16.6, 4.8, 1.4); wGlow(g, x, 11, 12, '255,120,90', 0.35); });
    g.fillStyle = '#d9b27a'; g.fillRect(0, H * 0.6, W, 4); g.fillStyle = '#3a2418'; g.fillRect(0, H * 0.6 + 4, W, H * 0.4);
    [0.25, 0.65].forEach(f => { g.fillStyle = '#f6f1e7'; g.beginPath(); g.ellipse(W * f, H * 0.58, 6, 2.6, 0, 0, Math.PI); g.fill(); g.fillStyle = '#e8b04a'; g.beginPath(); g.ellipse(W * f, H * 0.56, 5, 1.6, 0, 0, 7); g.fill(); });
  },
  'Pet Store'(g, W, H, k) {
    wShopWall(g, W, H, '#e8f1ee', '#bdd6cf');
    const tg = g.createLinearGradient(0, H * 0.2, 0, H * 0.66); tg.addColorStop(0, '#6fd1ff'); tg.addColorStop(1, '#1f7ea6'); g.fillStyle = tg; g.fillRect(W * 0.08, H * 0.2, W * 0.46, H * 0.46); g.strokeStyle = '#4a545c'; g.lineWidth = 1.4; g.strokeRect(W * 0.08, H * 0.2, W * 0.46, H * 0.46);
    for (let i = 0; i < 4; i++) { const fx = W * (0.14 + i * 0.1), fy = H * (0.32 + (i % 3) * 0.1); g.fillStyle = ['#ff9a3d', '#ffd166', '#ff6f91', '#e9ffef'][i]; g.beginPath(); g.ellipse(fx, fy, 2.6, 1.4, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(fx + 2, fy); g.lineTo(fx + 4.4, fy - 1.4); g.lineTo(fx + 4.4, fy + 1.4); g.fill(); }
    g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.beginPath(); g.arc(W * 0.78, H * 0.38, 6, 0, 7); g.stroke(); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(W * 0.78 + i * 2.2, H * 0.38 - 5.4); g.lineTo(W * 0.78 + i * 2.2, H * 0.38 + 5.4); g.stroke(); } g.fillStyle = '#ffd166'; g.beginPath(); g.arc(W * 0.78, H * 0.42, 2.2, 0, 7); g.fill();
    g.fillStyle = '#c0502a'; g.beginPath(); g.ellipse(W * 0.7, H * 0.84, 9, 3, 0, 0, 7); g.fill();
  },
  Optician(g, W, H, k) {
    wShopWall(g, W, H, '#f2f6f7', '#cddde2');
    for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i * 12 + 12 < W - 2; i++) { const x = 3 + i * 12, y = 6 + r2 * 9; g.strokeStyle = ['#2a2e3a', '#d63b4b', '#3aa6b9', '#c9a24a'][(i + r2) % 4]; g.lineWidth = 1; g.beginPath(); g.arc(x + 3, y + 2, 2.6, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 8.4, y + 2, 2.6, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x + 5.6, y + 2); g.lineTo(x + 5.8, y + 2); g.stroke(); }
    g.fillStyle = '#f6f1e7'; g.fillRect(W * 0.7, H * 0.55, W * 0.24, H * 0.24); g.fillStyle = '#2a2e3a'; for (let i = 0; i < 4; i++) g.fillRect(W * 0.72, H * (0.58 + i * 0.05), 3 - i * 0.5, 1.6 - i * 0.2);
    g.fillStyle = '#3aa6b9'; g.fillRect(0, H * 0.84, W, H * 0.16);
  },
  Gallery(g, W, H, k) {
    wShopWall(g, W, H, '#f6f4ee', '#d9d4c6'); const cols = [['#e76f51', '#264653'], ['#2a9d8f', '#e9c46a'], ['#c77dff', '#4361ee']];
    cols.forEach((p, i) => { const x = W * (0.08 + i * 0.3), w2 = W * 0.22; g.fillStyle = '#2b3138'; g.fillRect(x - 1.6, 5.4, w2 + 3.2, H * 0.46 + 3); g.fillStyle = p[0]; g.fillRect(x, 7, w2, H * 0.46); g.fillStyle = p[1]; g.beginPath(); g.arc(x + w2 * 0.6, 7 + H * 0.2, w2 * 0.28, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, 7, w2, 1.2); g.fillStyle = 'rgba(255,248,224,.5)'; g.beginPath(); g.moveTo(x + w2 / 2 - 2, 0); g.lineTo(x + w2 / 2 + 2, 0); g.lineTo(x + w2 * 0.8, 7); g.lineTo(x + w2 * 0.2, 7); g.fill(); });
    g.fillStyle = '#c9ced2'; g.fillRect(W * 0.4, H * 0.7, 8, H * 0.2); g.fillStyle = '#8f9aa1'; g.beginPath(); g.arc(W * 0.4 + 4, H * 0.66, 4, 0, 7); g.fill();
  }
};
const W_SHOP_FN = new Map();
function wShopInside(name, k) {
  const key = name + k; let f = W_SHOP_FN.get(key);
  if (!f) {
    const painter = W_SHOPS[name] || W_SHOPS._;
    f = (c, x, y, w, h, on, px, py) => wBlitInside(c, wInsideSprite('shp' + name + k, w, h, (g, W, H) => painter(g, W, H, k)), x, y, w, h, px * 1.6, py * 1.6, 0.95);
    W_SHOP_FN.set(key, f);
  }
  return f;
}
function wDecoGrid(b, rh) {
  const tower = b.style === 'tower', shop = b.style === 'shop', ft = b.y + rh, bot = b.y + b.h;
  const cols = Math.max(2, Math.floor((b.w - 28) / 50)), cw = (b.w - 28) / cols, rowsEnd = bot - (shop ? 84 : 70), rowStep = tower ? 40 : 54, rows = [];
  for (let y = ft + 14; y + 34 <= rowsEnd; y += rowStep) rows.push(y);
  return { cols, cw, rows, ft, bot };
}
/* static trimmings of the filler buildings, painted into the shell */
function wHeroDeco(c, b, rh) {
  const tower = b.style === 'tower', shop = b.style === 'shop', gd = wDecoGrid(b, rh), ft = gd.ft, bot = gd.bot, cx = b.x + b.w / 2;
  const brick = !tower && (shop ? (b.seed & 1) : (b.seed & 2));
  if (tower) {
    [b.x + 5, b.x + b.w - 13].forEach((px, i) => {
      const g = c.createLinearGradient(px, 0, px + 8, 0); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(0,0,0,.14)');
      c.fillStyle = g; c.fillRect(px, ft, 8, bot - 12 - ft); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(px, ft, 1, bot - 12 - ft);
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(px - 1, ft, 10, 2);
    });
    c.fillStyle = b.accent; c.globalAlpha = 0.85; c.fillRect(b.x, ft + 4, b.w, 2.6); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(b.x, ft + 4, b.w, 0.9); wFadeSoft(c, b.x, ft + 7, b.w, 4, 0.2);
    gd.rows.forEach(y => {
      c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(b.x + 12, y - 4, b.w - 24, 34); wFadeV(c, b.x + 12, y - 4, b.w - 24, 7, 0.26, 0, '0,0,0');
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(b.x + 12, y + 29.4, b.w - 24, 1); c.fillStyle = 'rgba(255,255,255,.09)'; c.fillRect(b.x + 12, y - 4, b.w - 24, 1);
      for (let i = 1; i < gd.cols; i++) { const mx = b.x + 14 + i * gd.cw; c.fillStyle = 'rgba(210,225,235,.35)'; c.fillRect(mx - 0.8, y - 4, 1.6, 34); }
    });
  } else {
    if (brick) wShCourse(c, b.x, ft + 6, b.w, 3);
    if (!shop) {
      // window ledges where there is no flower box, and the entrance slab
      gd.rows.forEach((y, r) => { for (let i = 0; i < gd.cols; i++) {
        if (hash01(b.seed, r * 7 + i, 4) > 0.6) continue;
        const wx = b.x + 14 + i * gd.cw + 4, ww = gd.cw - 14;
        c.fillStyle = 'rgba(8,10,22,.26)'; c.fillRect(wx - 2, y + 37, ww + 4, 2.4); c.fillStyle = shade(b.wall, -0.16); c.fillRect(wx - 3, y + 33, ww + 6, 3.6); c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(wx - 3, y + 33, ww + 6, 1);
      } });
      const sy = bot - 62;
      c.fillStyle = 'rgba(8,10,22,.3)'; c.fillRect(cx - 32, sy + 7, 64, 3); wFadeSoft(c, cx - 31, sy + 8, 62, 12, 0.3);
      c.fillStyle = shade(b.roof, 0.12); c.fillRect(cx - 34, sy, 68, 7); c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(cx - 34, sy, 68, 1.5); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(cx - 34, sy + 5.6, 68, 1.4);
      c.fillStyle = '#2b3138'; c.fillRect(cx - 32, sy + 7, 2, 5); c.fillRect(cx + 30, sy + 7, 2, 5);
      if (brick && b.seed % 3 === 0) wShFireStair(c, b.x + b.w - 15, 10, gd.rows.map(y => y + 40).concat([bot - 16]));
      if (!tower && b.seed % 5 === 1) wPaintIvy(c, b.x + 1, bot, 90 + (b.seed % 4) * 12, season(), mulberry32(b.seed));
    } else {
      // shop: a hours plate by the door and a lit bulkhead under the windows
      c.fillStyle = '#e9e2d3'; c.fillRect(cx + 22, bot - 38, 12, 9); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(cx + 22, bot - 29, 12, 1); c.fillStyle = 'rgba(60,70,80,.6)'; for (let k = 0; k < 3; k++) c.fillRect(cx + 24, bot - 36 + k * 2.4, 5 + (k % 2) * 3, 0.8);
      c.fillStyle = shade(b.wall, -0.3); c.fillRect(b.x + 12, bot - 15, b.w / 2 - 36, 5); c.fillRect(b.x + b.w / 2 + 26, bot - 15, b.w / 2 - 38, 5);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(b.x + 12, bot - 15, b.w / 2 - 36, 1); c.fillRect(b.x + b.w / 2 + 26, bot - 15, b.w / 2 - 38, 1);
    }
  }
}
/* local alias so this file reads cleanly */
function wFadeSoft(c, x, y, w, h, a) { wFadeV(c, x, y, w, h, a, 0, '8,10,28'); }
