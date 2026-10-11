/* ============================ street furniture, painted as cached sprites ============================
   Every painter draws around an origin at the prop's feet (the x,y the game stores). wProp caches the result. */
function wProp(c, key, p, ox, oy, w, h, paint) {
  const s = wspr(key, w, h, g => { g.translate(ox, oy); paint(g); });
  c.drawImage(s.cv, p.x - ox, p.y - oy, w, h);
}
function wShadow(g, rx, ry, a, dx) { g.fillStyle = 'rgba(8,12,24,' + (a || 0.26) + ')'; g.beginPath(); g.ellipse(dx || 0, 1.2, rx, ry, 0, 0, 7); g.fill(); }
function wPaintHydrant(g, v) {
  const col = v % 5 === 0 ? '#e8b82e' : '#d0453c', dk = shade(col, -0.34), lt = shade(col, 0.3);
  wShadow(g, 8, 2.4);
  g.fillStyle = dk; g.fillRect(-5.4, -3.2, 10.8, 3.2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-5.4, -3.2, 10.8, 0.8);
  const bg = g.createLinearGradient(-3.8, 0, 3.8, 0); bg.addColorStop(0, lt); bg.addColorStop(0.35, col); bg.addColorStop(1, dk);
  g.fillStyle = bg; rr(g, -3.8, -12, 7.6, 10, 1.4); g.fill();
  g.fillStyle = dk; g.fillRect(-4.2, -11, 8.4, 1.4); g.fillRect(-4.2, -4.8, 8.4, 1.2);
  [-1, 1].forEach(s => { const x = s * 5.6; g.fillStyle = bg; rr(g, s < 0 ? -7.6 : 3.8, -9.4, 3.8, 4.4, 1); g.fill(); g.fillStyle = dk; g.fillRect(x - 0.8 + (s < 0 ? -1.6 : 1.6) - 0.4, -8.6, 0.9, 2.8); g.fillStyle = '#c9ced2'; g.beginPath(); g.arc(s * 7.2, -7.2, 0.9, 0, 7); g.fill(); });
  g.fillStyle = bg; g.beginPath(); g.arc(0, -12, 3.9, Math.PI, 0); g.fill();
  g.fillStyle = dk; g.fillRect(-1.4, -17, 2.8, 2.4); g.fillStyle = lt; g.fillRect(-1.4, -17, 1, 2.4);
  g.fillStyle = '#b8bfc4'; g.beginPath(); g.arc(0, -7.4, 2.1, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 0.7; g.stroke();
  g.strokeStyle = 'rgba(40,46,52,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-5, -7.2); g.quadraticCurveTo(-4, -3.4, -1.6, -5); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-3.2, -11, 0.9, 8);
}
function wPaintBin(g, v) {
  wShadow(g, 9, 2.6);
  const solid = v % 2 === 1, col = solid ? '#2f5f97' : '#3f6b54';
  const bg = g.createLinearGradient(-6.5, 0, 6.5, 0); bg.addColorStop(0, shade(col, 0.22)); bg.addColorStop(0.5, col); bg.addColorStop(1, shade(col, -0.3));
  g.fillStyle = bg; g.beginPath(); g.moveTo(-6.4, -16.6); g.lineTo(6.4, -16.6); g.lineTo(5.4, 0); g.lineTo(-5.4, 0); g.closePath(); g.fill();
  if (solid) { g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(-4.4, -12.4, 8.8, 2.8); g.fillStyle = col; g.fillRect(-3.2, -11.8, 1.8, 1.6); g.fillRect(0, -11.8, 1.8, 1.6); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-5.8, -6, 11.6, 1); }
  else { g.fillStyle = 'rgba(8,16,12,.55)'; for (let i = 0; i < 5; i++) g.fillRect(-4.4 + i * 2.2, -14.4, 1.2, 12.6); g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 5; i++) g.fillRect(-4.4 + i * 2.2, -14.4, 0.5, 12.6); }
  g.fillStyle = shade(col, -0.34); g.fillRect(-6.2, -15, 12.4, 1.4); g.fillRect(-5.6, -3.4, 11.2, 1.4);
  g.fillStyle = shade(col, -0.2); rr(g, -7.2, -19.8, 14.4, 4.4, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-6.2, -19.6, 12.4, 0.9);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-2.6, -18.4, 5.2, 1.2);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-5.8, -16, 0.9, 15);
}
function wPaintPlanter(g, seed, se) {
  const kind = seed % 4, pot = ['#8f5a3c', '#8a8f94', '#4a4f58', '#b8683f'][(seed >> 1) % 4];
  wShadow(g, 10, 2.8);
  const pg = g.createLinearGradient(-7.4, 0, 7.4, 0); pg.addColorStop(0, shade(pot, 0.22)); pg.addColorStop(0.5, pot); pg.addColorStop(1, shade(pot, -0.32));
  g.fillStyle = pg; g.beginPath(); g.moveTo(-7.2, -11); g.lineTo(7.2, -11); g.lineTo(5.6, 0); g.lineTo(-5.6, 0); g.closePath(); g.fill();
  g.fillStyle = shade(pot, -0.2); g.fillRect(-5.8, -3, 11.6, 1); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-6.5, -7.4, 13, 0.9);
  g.fillStyle = shade(pot, 0.14); rr(g, -8, -13, 16, 3.2, 1.2); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-7.4, -13, 14.8, 0.9);
  g.fillStyle = '#3a2a1a'; g.fillRect(-6.6, -12.6, 13.2, 1.4);
  const gr = se === 'winter' ? ['#2d6a4a', '#3f8a5c', '#235a40'] : se === 'autumn' ? ['#8a8f3a', '#b0802a', '#6a7a30'] : ['#2f7d4f', '#4fa565', '#3f9a55'];
  const r = mulberry32(seed * 37 + 5);
  if (kind === 3) {      // topiary ball on a stem
    g.fillStyle = '#5a3d27'; g.fillRect(-0.8, -22, 1.6, 10);
    g.fillStyle = gr[0]; g.beginPath(); g.arc(0, -25, 8, 0, 7); g.fill(); g.fillStyle = gr[1]; g.beginPath(); g.arc(-2.4, -27, 5.6, 0, 7); g.fill(); g.fillStyle = gr[2]; g.beginPath(); g.arc(-3.6, -28.4, 2.6, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(2, -21.4, 6, 2, 0, 0, 7); g.fill();
  } else if (kind === 2) {  // ornamental grass
    for (let i = 0; i < 14; i++) { const a = -1.1 + i * 0.17, len = 10 + r() * 7; g.strokeStyle = gr[i % 3]; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(Math.sin(a) * len * 0.6, -12 - len * 0.7, Math.sin(a) * len * 1.05, -12 - len * 0.9 + Math.abs(a) * 3); g.stroke(); }
  } else {
    [[0, -17.5, 8.4, 0], [-4.4, -16.4, 5.4, 1], [4.6, -16.6, 5.4, 2], [-1.6, -21.4, 5, 1]].forEach(b => { g.fillStyle = gr[b[3] % 3]; g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(-3, -20.4, 3.4, 0, 7); g.fill();
  }
  if (se === 'winter') { g.fillStyle = '#f6fafd'; g.beginPath(); g.ellipse(0, kind === 3 ? -32 : kind === 2 ? -17 : -24, kind === 3 ? 5.4 : 7, 2.2, 0, 0, 7); g.fill(); return; }
  if (kind === 0 || kind === 1) {
    const pal = se === 'autumn' ? ['#e8883a', '#f2c14a', '#c0502a'] : ['#ff6f91', '#ffd166', '#f8f9fa', '#c77dff', '#ff9a4d'];
    const col = pal[seed % pal.length], n = 5 + (seed % 3);
    for (let i = 0; i < n; i++) {
      const px = -6.4 + i * (12.8 / (n - 1)) + (r() - 0.5) * 2, py = -19 - (i % 2) * 4.4 - r() * 3, c2 = i % 3 === 2 ? pal[(seed + 1) % pal.length] : col;
      g.fillStyle = c2; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.beginPath(); g.arc(px + Math.cos(a) * 1.5, py + Math.sin(a) * 1.5, 1.1, 0, 7); g.fill(); }
      g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(px, py, 0.8, 0, 7); g.fill();
    }
  }
}
function wPaintMailbox(g, v) {
  wShadow(g, 8.5, 2.5);
  g.fillStyle = '#1d2d44'; g.fillRect(-5.4, -5, 2.2, 5); g.fillRect(3.2, -5, 2.2, 5); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-5.4, -5, 0.8, 5);
  const bg = g.createLinearGradient(-7.4, 0, 7.4, 0); bg.addColorStop(0, '#5a8fd0'); bg.addColorStop(0.4, '#2f5f97'); bg.addColorStop(1, '#1d3a64');
  g.fillStyle = bg; g.beginPath(); g.moveTo(-7.4, -4); g.lineTo(-7.4, -18); g.arc(0, -18, 7.4, Math.PI, 0); g.lineTo(7.4, -4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(0, -18, 7.4, Math.PI, Math.PI * 1.6); g.lineTo(-1, -23); g.fill();
  g.fillStyle = '#16293f'; g.fillRect(-5.2, -17.4, 10.4, 2.2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-5.2, -15.4, 10.4, 0.7);
  g.fillStyle = '#e9e2d3'; g.fillRect(-4.6, -12.4, 9.2, 5.6); g.fillStyle = '#c0392b'; g.fillRect(-3.8, -11.4, 7.4, 1); g.fillStyle = 'rgba(40,50,60,.7)'; g.fillRect(-3.8, -9.2, 5.4, 0.7); g.fillRect(-3.8, -7.9, 3.6, 0.7);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-7.4, -4.8, 14.8, 0.9);
  g.fillStyle = '#d63b4b'; g.fillRect(7.4, -14, 2.2, 5); g.fillRect(7.4, -14, 4.6, 1.6);
}
function wPaintAframe(g, v) {
  wShadow(g, 10, 2.5);
  g.fillStyle = '#5a3d24'; g.beginPath(); g.moveTo(-8.4, 0); g.lineTo(-6.2, -22); g.lineTo(6.2, -22); g.lineTo(8.4, 0); g.lineTo(6.4, 0); g.lineTo(5, -19.4); g.lineTo(-5, -19.4); g.lineTo(-6.4, 0); g.closePath(); g.fill();
  const wg = g.createLinearGradient(-8, 0, 8, 0); wg.addColorStop(0, '#8a6038'); wg.addColorStop(1, '#5a3d24'); g.fillStyle = wg; g.beginPath(); g.moveTo(-8.4, 0); g.lineTo(-6.2, -22); g.lineTo(-4.4, -22); g.lineTo(-6.4, 0); g.fill(); g.beginPath(); g.moveTo(8.4, 0); g.lineTo(6.2, -22); g.lineTo(4.4, -22); g.lineTo(6.4, 0); g.fill();
  g.fillStyle = '#6b4a30'; g.fillRect(-6.4, -22.6, 12.8, 2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-6.4, -22.6, 12.8, 0.8);
  const bg = g.createLinearGradient(0, -20, 0, -4); bg.addColorStop(0, '#26332c'); bg.addColorStop(1, '#1b2520');
  g.fillStyle = bg; g.fillRect(-5.4, -19.4, 10.8, 15.4); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-5.4, -19.4, 10.8, 3);
  g.fillStyle = '#f3e6a1'; g.fillRect(-3.6, -17.6, 7.2, 1.4); g.fillStyle = '#fff'; g.fillRect(-3.6, -14, 5, 1); g.fillRect(-3.6, -11.4, 6.4, 1); g.fillRect(-3.6, -8.8, 4, 1);
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 0.8; g.beginPath(); g.arc(2.6, -7.2, 1.4, 0, 6.28); g.stroke(); g.fillStyle = '#e9c46a'; g.fillRect(-4.4, -6.4, 0.9, 0.9);
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-5.4, -4.6, 10.8, 0.7);
}
function wPaintRack(g, v) {
  wShadow(g, 17, 3.2);
  const frame = v % 2 ? '#e76f51' : '#2a9d8f';
  g.strokeStyle = 'rgba(20,24,30,.9)'; g.lineWidth = 1.5;
  [-8.4, 8.4].forEach(x => { g.beginPath(); g.arc(x, -6.2, 6.2, 0, 7); g.stroke(); });
  g.strokeStyle = 'rgba(160,170,178,.55)'; g.lineWidth = 0.5; [-8.4, 8.4].forEach(x => { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; g.beginPath(); g.moveTo(x, -6.2); g.lineTo(x + Math.cos(a) * 6, -6.2 + Math.sin(a) * 6); g.stroke(); } });
  g.strokeStyle = frame; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-8.4, -6.2); g.lineTo(-2.6, -15.4); g.lineTo(5.6, -15.4); g.lineTo(8.4, -6.2); g.moveTo(-2.6, -15.4); g.lineTo(0.6, -6.2); g.lineTo(-8.4, -6.2); g.moveTo(5.6, -15.4); g.lineTo(4.8, -19.6); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-2.6, -15.9); g.lineTo(5.6, -15.9); g.stroke();
  g.fillStyle = '#20242c'; rr(g, -5.6, -18.2, 6.4, 2.2, 1); g.fill(); g.fillRect(2.4, -21.2, 5.6, 1.8); g.fillRect(4.4, -21, 0.9, 2);
  g.fillStyle = '#c9ced2'; g.beginPath(); g.arc(0.6, -6.2, 1.2, 0, 7); g.fill();
  g.strokeStyle = '#8f9aa1'; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-16, -11.4); g.arc(-13, -11.4, 3, Math.PI, 0); g.lineTo(-10, 0); g.stroke(); g.beginPath(); g.moveTo(10, 0); g.lineTo(10, -11.4); g.arc(13, -11.4, 3, Math.PI, 0); g.lineTo(16, 0); g.stroke(); g.lineCap = 'butt';
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-16.4, -2); g.lineTo(-16.4, -11); g.moveTo(9.6, -2); g.lineTo(9.6, -11); g.stroke();
}
function wPaintNews(g, v) {
  wShadow(g, 8.5, 2.5);
  const col = v % 2 ? '#e9c46a' : '#e76f51';
  const bg = g.createLinearGradient(-6.8, 0, 6.8, 0); bg.addColorStop(0, shade(col, 0.2)); bg.addColorStop(0.5, col); bg.addColorStop(1, shade(col, -0.3));
  g.fillStyle = bg; rr(g, -6.6, -20.6, 13.2, 20.6, 2); g.fill();
  g.fillStyle = 'rgba(8,12,24,.5)'; rr(g, -4.6, -18.4, 9.2, 9.2, 1.4); g.fill();
  const gg = g.createLinearGradient(0, -18, 0, -9.6); gg.addColorStop(0, 'rgba(200,226,240,.9)'); gg.addColorStop(1, 'rgba(150,190,215,.9)'); g.fillStyle = gg; g.fillRect(-4.2, -18, 8.4, 8.4);
  g.fillStyle = '#f4f1e6'; g.fillRect(-3.2, -17, 6.4, 2.6); g.fillStyle = 'rgba(40,40,40,.7)'; g.fillRect(-2.6, -16.4, 3.6, 0.8); g.fillRect(-2.6, -15.2, 5, 0.5);
  g.fillStyle = '#e8e2d0'; g.fillRect(-3.6, -13.6, 7.2, 2.4); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(-3.6, -18); g.lineTo(-0.6, -18); g.lineTo(-3.6, -12); g.fill();
  g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-4.6, -8.4, 9.2, 2); g.fillStyle = '#9aa3aa'; g.fillRect(-1.6, -7.8, 3.2, 0.9); g.fillRect(-3, -5, 6, 1.4);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-6.2, -20, 0.9, 19);
}
function wPaintBush(g, r, v, se) {
  wShadow(g, r * 1.24, r * 0.38, 0.24);
  const R = mulberry32(v * 29 + r), base = se === 'autumn' ? ['#7a7a2c', '#a07a2a', '#c9902f'] : se === 'winter' ? ['#1f5a40', '#2a6f4c', '#3a8558'] : ['#245f3c', '#2a7046', '#4c9a5a'];
  const lobes = [[-0.55, -0.5, 0.72], [0.55, -0.5, 0.7], [0, -0.82, 0.86], [-0.2, -0.3, 0.8], [0.3, -0.3, 0.6]];
  lobes.forEach((l, i) => {
    const lx = l[0] * r, ly = l[1] * r, lr = l[2] * r;
    const q = g.createRadialGradient(lx - lr * 0.35, ly - lr * 0.4, lr * 0.1, lx, ly, lr); q.addColorStop(0, shade(base[2], 0.12)); q.addColorStop(0.55, base[1]); q.addColorStop(1, base[0]);
    g.fillStyle = q; g.beginPath(); g.arc(lx, ly, lr, 0, 7); g.fill();
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + R() * 0.4; g.fillStyle = base[(k + i) % 3]; g.beginPath(); g.arc(lx + Math.cos(a) * lr * 0.9, ly + Math.sin(a) * lr * 0.9, lr * 0.22, 0, 7); g.fill(); }
  });
  g.save(); g.beginPath(); lobes.forEach(l => { g.moveTo(l[0] * r + l[2] * r, l[1] * r); g.arc(l[0] * r, l[1] * r, l[2] * r, 0, 7); }); g.clip();
  g.globalAlpha = 0.6; g.fillStyle = PAT.leaf; g.fillRect(-r * 1.6, -r * 2, r * 3.2, r * 2.2); g.globalAlpha = 1;
  wFadeV(g, -r * 1.6, -r * 0.5, r * 3.2, r * 0.6, 0, 0.3, '8,24,16');
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(-r * 0.3, -r * 1.2, r * 0.42, 0, 7); g.fill();
  if (se === 'winter') { g.fillStyle = '#f6fafd'; g.beginPath(); g.ellipse(-r * 0.1, -r * 1.55, r * 0.8, r * 0.28, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-r * 0.7, -r * 1.0, r * 0.4, r * 0.18, -0.3, 0, 7); g.fill(); return; }
  if (v % 3 === 0) {
    const col = se === 'autumn' ? '#e8883a' : ['#ff6f91', '#f8f9fa', '#ffd166'][(v >> 1) % 3];
    for (let i = 0; i < 9; i++) { const px = -r * 0.8 + R() * r * 1.6, py = -r * (0.4 + R() * 1.0); g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.beginPath(); g.arc(px + Math.cos(a) * 1.3, py + Math.sin(a) * 1.3, 1, 0, 7); g.fill(); } g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(px, py, 0.7, 0, 7); g.fill(); }
  } else if (v % 3 === 1 && se !== 'autumn') { g.fillStyle = '#c0392b'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-r * 0.7 + R() * r * 1.4, -r * (0.3 + R() * 0.9), 1.1, 0, 7); g.fill(); } }
}
function wPaintRock(g, v, se) {
  wShadow(g, 12, 3.2, 0.26);
  const gg = g.createLinearGradient(-10, -10, 10, 0); gg.addColorStop(0, '#b2bbc1'); gg.addColorStop(0.5, '#8f9aa1'); gg.addColorStop(1, '#5d676e');
  g.fillStyle = gg; g.beginPath(); g.moveTo(-9.6, 0); g.lineTo(-7.4, -6.4); g.lineTo(-2.6, -9.4); g.lineTo(2.4, -10.4); g.lineTo(7.6, -6); g.lineTo(10.4, 0); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(-7.4, -6.4); g.lineTo(-2.6, -9.4); g.lineTo(2.4, -10.4); g.lineTo(-0.6, -5.4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(20,28,36,.3)'; g.beginPath(); g.moveTo(2.4, -10.4); g.lineTo(7.6, -6); g.lineTo(10.4, 0); g.lineTo(3.6, 0); g.lineTo(2, -5); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,40,50,.4)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-1, -9); g.lineTo(0.4, -5); g.lineTo(-1.6, -2); g.stroke();
  g.fillStyle = 'rgba(70,130,60,.55)'; for (let i = 0; i < 9; i++) g.fillRect(-8 + hash01(v, i, 1) * 8, -1.4 - hash01(v, i, 2) * 3, 1.6, 1.2);
  if (se === 'winter') { g.fillStyle = '#f6fafd'; g.beginPath(); g.moveTo(-7.4, -6.4); g.lineTo(-2.6, -9.4); g.lineTo(2.4, -10.4); g.lineTo(7, -6.8); g.quadraticCurveTo(0, -5.6, -7.4, -6.4); g.fill(); }
}
function wPaintGate(g) {
  [-40, 40].forEach(dx => {
    g.save(); g.translate(dx, 0); wShadow(g, 12, 3.4, 0.28);
    const pg = g.createLinearGradient(-6, 0, 6, 0); pg.addColorStop(0, '#c4bdad'); pg.addColorStop(0.4, '#a9a294'); pg.addColorStop(1, '#7a7466');
    g.fillStyle = pg; g.fillRect(-6, -58, 12, 58);
    g.fillStyle = 'rgba(0,0,0,.14)'; for (let y = -50; y < -6; y += 11) g.fillRect(-6, y, 12, 1); g.fillStyle = 'rgba(255,255,255,.2)'; for (let y = -49; y < -6; y += 11) g.fillRect(-6, y, 12, 0.8);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-6, -58, 3, 58);
    g.fillStyle = '#8b8577'; g.fillRect(-8.4, -6, 16.8, 6); g.fillRect(-8, -63, 16, 6); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-8.4, -6, 16.8, 1); g.fillRect(-8, -63, 16, 1);
    g.fillStyle = '#6a6458'; g.fillRect(-7, -57.4, 14, 1.2);
    g.fillStyle = '#44403a'; g.fillRect(-4.6, -65.4, 9.2, 3); g.fillRect(-1, -72, 2, 7);
    g.restore();
  });
  g.strokeStyle = '#1f3a2c'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-40, -62); g.quadraticCurveTo(0, -96, 40, -62); g.stroke();
  g.strokeStyle = '#2f5a44'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-40, -62); g.quadraticCurveTo(0, -96, 40, -62); g.stroke();
  g.strokeStyle = '#1f3a2c'; g.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { const t = i / 3.6 * 0.5 + 0.5, x = -40 + 80 * t, y = (1 - t) * (1 - t) * -62 + 2 * t * (1 - t) * -96 + t * t * -62; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); }
  g.strokeStyle = '#1f3a2c'; g.lineWidth = 1.4; g.beginPath(); g.arc(-26, -70, 4, 0, 5); g.moveTo(26 + 4, -70); g.arc(26, -70, 4, 3.5, 2.2, true); g.stroke();
  const pg = g.createLinearGradient(0, -88, 0, -72); pg.addColorStop(0, '#356a50'); pg.addColorStop(1, '#244a38'); g.fillStyle = pg; rr(g, -36, -88, 72, 16, 5); g.fill();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 1; rr(g, -34.6, -86.6, 69.2, 13.2, 4); g.stroke(); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-34, -87, 68, 2);
  g.font = '800 9px "Bricolage Grotesque","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText('CENTRAL PARK', 0.5, -79); g.fillStyle = '#f3e6a1'; g.fillText('CENTRAL PARK', 0, -79.5);
}
function wPaintBench(g) {
  wShadow(g, 23, 4, 0.26);
  // cast-iron ends with scrolled armrests
  [-1, 1].forEach(s => {
    const x = s * 16.4;
    g.fillStyle = '#242b32'; g.fillRect(x - 1.7, -20, 3.4, 23); g.fillRect(x - 3.4 - 0, 1, 6.8, 2);
    g.strokeStyle = '#242b32'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, -9); g.quadraticCurveTo(x - s * 6, -9, x - s * 6, -14); g.stroke();
    g.beginPath(); g.arc(x - s * 4.6, -9, 2, 0, 7); g.stroke();
    g.fillStyle = '#242b32'; g.fillRect(x - 2.4, -16.4, 4.8, 1.8);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x - 1.7, -20, 0.8, 23);
  });
  const slat = (y, h, c1, c2) => { const q = g.createLinearGradient(0, y, 0, y + h); q.addColorStop(0, c1); q.addColorStop(1, c2); g.fillStyle = q; g.fillRect(-20, y, 40, h); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-20, y, 40, 0.9); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-20, y + h - 0.8, 40, 0.8); g.fillStyle = 'rgba(40,20,8,.18)'; for (let k = 0; k < 4; k++) g.fillRect(-18 + k * 9.4 + (y % 3), y + 1.2, 6 + k, 0.6); g.fillStyle = '#2a2f36'; [-16.4, 16.4].forEach(bx => g.fillRect(bx - 0.6, y + h / 2 - 0.5, 1.2, 1.2)); };
  slat(-22, 4.2, '#9a6a44', '#7a4f2e'); slat(-16.4, 4.2, '#9a6a44', '#7a4f2e'); slat(-9.4, 5.4, '#b8844f', '#8a5d3c');
  g.fillStyle = 'rgba(0,0,0,.24)'; g.fillRect(-20, -4, 40, 1.8);
}
