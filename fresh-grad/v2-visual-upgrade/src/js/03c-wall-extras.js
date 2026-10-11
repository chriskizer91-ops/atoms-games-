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
