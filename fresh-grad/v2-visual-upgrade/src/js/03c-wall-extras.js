/* a wrought-iron Juliet balcony rail across the lower part of a window */
function wPaintRail(g, w) {
  const x0 = 5, y0 = 3;
  g.fillStyle = 'rgba(8,12,24,.2)'; g.fillRect(x0 + 1, y0 + 14, w, 2);
  g.strokeStyle = '#1d242b'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 - 2.4, y0 + 1); g.lineTo(x0 + w + 2.4, y0 + 1); g.stroke();
  g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 - 2.4, y0 + 13); g.lineTo(x0 + w + 2.4, y0 + 13); g.stroke();
  g.lineWidth = 0.9; for (let x = x0; x <= x0 + w + 0.5; x += 4) { g.beginPath(); g.moveTo(x, y0 + 1); g.lineTo(x, y0 + 13); g.stroke(); }
  for (let x = x0 + 2; x < x0 + w; x += 8) { g.beginPath(); g.arc(x, y0 + 7, 2, 0, 6.3); g.stroke(); }
  g.fillStyle = '#1d242b'; [x0 - 2.4, x0 + w + 2.4].forEach(x => { g.beginPath(); g.arc(x, y0 + 1, 1.5, 0, 7); g.fill(); g.fillRect(x - 0.7, y0 + 1, 1.4, 12.4); });
  g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x0 - 2, y0 + 0.4); g.lineTo(x0 + w + 2, y0 + 0.4); g.stroke();
}
/* snow lying along the sloped top of an awning, with a few drips at the hem */
function wSnowAwning(g, w, h) {
  const sg = g.createLinearGradient(0, 0, 0, h * 0.5); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#dfe9f4');
  g.fillStyle = sg; g.beginPath(); g.moveTo(-1, 3.4);
  for (let x = 0; x < w; x += 11) g.quadraticCurveTo(x + 5.5, -2.4 - hash01(x, w, 5) * 2.4, Math.min(w + 1, x + 11), 1.6);
  g.lineTo(w + 1, h * 0.46); for (let x = w; x > 0; x -= 9) g.lineTo(x - 4.5, h * 0.46 - 2 - hash01(x, h, 6) * 3); g.lineTo(-1, h * 0.4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(150,175,208,.5)'; g.fillRect(0, h * 0.4, w, 1.2);
}
/* a pane of reflected light on wet pavement under a lit shop front */
function wWetGlow(c, x, y, w, h, kind, a) {
  const A = FX.A; if (!A || A.wet < 0.1 || FX.nf < 0.2) return;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * A.wet * FX.nf); c.drawImage(GLOW[kind], x - w / 2, y, w, h); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
/* a winter wreath with a red bow, hung on a door */
function wPaintWreath(g) {
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(8.8, 9.4, 6.4, 0, 7); g.fill();
  g.strokeStyle = '#2d6a4a'; g.lineWidth = 3.6; g.beginPath(); g.arc(8, 8.4, 5.4, 0, 7); g.stroke();
  g.strokeStyle = '#4fae62'; g.lineWidth = 1.8; g.beginPath(); g.arc(8, 8.4, 5.4, 0.6, 4.2); g.stroke();
  g.fillStyle = '#e63946'; for (let i = 0; i < 5; i++) { const a = i * 1.25; g.beginPath(); g.arc(8 + Math.cos(a) * 5.4, 8.4 + Math.sin(a) * 5.4, 0.9, 0, 7); g.fill(); }
  g.fillStyle = '#d63b4b'; g.beginPath(); g.moveTo(8, 13.6); g.lineTo(4.2, 11.4); g.lineTo(4.4, 15.8); g.closePath(); g.moveTo(8, 13.6); g.lineTo(11.8, 11.4); g.lineTo(11.6, 15.8); g.closePath(); g.fill();
  g.fillStyle = '#a8222f'; g.beginPath(); g.arc(8, 13.6, 1.3, 0, 7); g.fill();
}
/* a pair of pumpkins and a corn-stalk bundle by a doorstep */
function wPaintPumpkins(g) {
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(11, 14.5, 10, 2.4, 0, 0, 7); g.fill();
  [[7, 10, 5.4], [14.6, 11, 4]].forEach((p, i) => {
    const q = g.createRadialGradient(p[0] - 1.6, p[1] - 2, 1, p[0], p[1], p[2] + 1); q.addColorStop(0, '#ffb04a'); q.addColorStop(1, '#d8661a');
    g.fillStyle = q; g.beginPath(); g.ellipse(p[0], p[1], p[2], p[2] * 0.82, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,50,0,.35)'; g.lineWidth = 0.7; for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(p[0] + k * p[2] * 0.4, p[1], p[2] * 0.3, p[2] * 0.78, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#5a7a2a'; g.fillRect(p[0] - 0.8, p[1] - p[2] * 0.95, 1.8, 2.4);
  });
  g.strokeStyle = '#c9a24a'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(19 + k, 14); g.lineTo(18 + k * 1.4, 3 - k); g.stroke(); }
  g.fillStyle = '#8a6a2a'; g.fillRect(18, 9, 6, 1.4);
}
/* a window air conditioner wedged in the sash: grille, side pleats, drip stain below */
function wPaintAC(g) {
  g.fillStyle = 'rgba(8,12,24,.28)'; g.fillRect(4, 15.4, 22, 2.4);
  const bg = g.createLinearGradient(0, 2, 0, 15); bg.addColorStop(0, '#f2f4f5'); bg.addColorStop(1, '#bcc3c8');
  g.fillStyle = '#9aa3aa'; g.fillRect(1, 3, 3, 11); g.fillRect(24, 3, 3, 11);
  g.fillStyle = 'rgba(255,255,255,.5)'; for (let y = 4; y < 14; y += 2) { g.fillRect(1, y, 3, 0.7); g.fillRect(24, y, 3, 0.7); }
  g.fillStyle = bg; rr(g, 3.4, 2, 21.2, 13, 1.6); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 0.7; rr(g, 3.7, 2.3, 20.6, 12.4, 1.4); g.stroke();
  g.fillStyle = '#6a737a'; g.fillRect(13, 4, 9.4, 8.6); g.fillStyle = '#2a3036'; for (let k = 0; k < 6; k++) g.fillRect(13.6, 4.8 + k * 1.4, 8.2, 0.8);
  g.fillStyle = '#4a545c'; g.fillRect(5.4, 4, 5.6, 2.4); g.fillStyle = '#5be3a0'; g.fillRect(6.2, 4.7, 1.2, 1); g.fillStyle = '#c9ced2'; g.beginPath(); g.arc(8.6, 9.6, 1.6, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(8.4, 8.6, 0.5, 1.4);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(3.8, 2.2, 20, 0.8);
  g.fillStyle = '#7a848b'; g.fillRect(5, 15, 18, 1.4);
  const dg = g.createLinearGradient(0, 17, 0, 34); dg.addColorStop(0, 'rgba(50,60,70,.32)'); dg.addColorStop(1, 'rgba(50,60,70,0)'); g.fillStyle = dg; g.fillRect(8, 17, 2.2, 17); g.fillRect(15, 17, 1.4, 12);
}
