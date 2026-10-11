/* ============================ the pond, alive ============================
   Drawn every frame while the pond is on screen: sky tint, caustic ripples, glitter, pads, reeds and ducks. */
function wPondLive(c, tm, A) {
  const P = POND, still = REDUCED;
  // the water takes on the colour of the sky
  c.fillStyle = rgbaS(mix3(A.top, A.bot, 0.5), 0.2 + 0.25 * A.warm);
  c.beginPath(); c.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, 7); c.fill();
  c.save(); c.beginPath(); c.ellipse(P.x, P.y, P.rx - 1, P.ry - 1, 0, 0, 7); c.clip();
  // sky glow near the far shore, darker near the camera
  const gl = c.createLinearGradient(0, P.y - P.ry, 0, P.y + P.ry); gl.addColorStop(0, 'rgba(255,255,255,' + (0.16 * (1 - A.nf)).toFixed(3) + ')'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(6,30,60,.12)');
  c.fillStyle = gl; c.fillRect(P.x - P.rx, P.y - P.ry, P.rx * 2, P.ry * 2);
  // caustic ripples: pale crests with a faint shadow underneath
  c.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const ph = still ? i : tm * 0.5 + i * 1.7;
    const sx = P.x - 170 + ((i * 61) % 340) + Math.sin(ph) * 9, sy = P.y - 74 + ((i * 37) % 148) + Math.cos(ph * 0.7) * 2.4;
    const al = 0.3 + 0.28 * Math.sin(ph * 1.3), len = 11 + (i % 4) * 4;
    c.strokeStyle = 'rgba(6,40,80,' + (al * 0.4).toFixed(3) + ')'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(sx - len, sy + 1.8); c.quadraticCurveTo(sx, sy - 2, sx + len, sy + 1.8); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(sx - len, sy); c.quadraticCurveTo(sx, sy - 3.5, sx + len, sy); c.stroke();
  }
  c.lineCap = 'butt';
  // glitter on the surface in daylight
  const day = (1 - A.nf) * (1 - A.cloud * 0.6) * (A.rain > 0.2 ? 0.3 : 1);
  if (day > 0.1) for (let i = 0; i < 26; i++) {
    const tw = still ? 0.8 : Math.sin(tm * (1.4 + (i % 5) * 0.3) + i * 3.1);
    if (tw < 0.55) continue;
    const gx = P.x + (hash01(i, 1, 131) - 0.5) * P.rx * 1.7, gy = P.y + (hash01(i, 2, 132) - 0.5) * P.ry * 1.5, s = 1.5 + tw * 2.2;
    c.strokeStyle = 'rgba(255,255,245,' + (0.85 * day * (tw - 0.4)).toFixed(3) + ')'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(gx - s, gy); c.lineTo(gx + s, gy); c.moveTo(gx, gy - s * 0.6); c.lineTo(gx, gy + s * 0.6); c.stroke();
  }
  c.restore();
  // lily pads, each with a notch, veins and a drop of light
  [[-90, 20], [30, -40], [110, 30], [-10, 52], [70, -10], [-130, -18]].forEach((p, i) => {
    const lx = P.x + p[0], ly = P.y + p[1] + (still ? 0 : Math.sin(tm + i) * 1.2), rot = i * 1.3;
    c.fillStyle = 'rgba(10,40,60,.28)'; c.beginPath(); c.ellipse(lx + 1.2, ly + 2.2, 12.5, 5.4, 0, 0, 7); c.fill();
    c.save(); c.translate(lx, ly); c.scale(1, 0.44); c.rotate(rot);
    const pg = c.createRadialGradient(-3, -3, 1, 0, 0, 12); pg.addColorStop(0, i % 2 ? '#6fcf80' : '#7dd68a'); pg.addColorStop(1, i % 2 ? '#3f9a55' : '#4fae62');
    c.fillStyle = pg; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 12, 0.35, 6.0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,70,40,.35)'; c.lineWidth = 0.8; for (let k = 0; k < 5; k++) { const a = 0.9 + k * 1.05; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 10.4, 3.6, 5.0); c.stroke();
    c.restore();
    if (i % 3 === 0) {
      c.save(); c.translate(lx + 3, ly - 2.6);
      for (let k = 0; k < 8; k++) { c.save(); c.rotate(k / 8 * 6.283); c.fillStyle = k % 2 ? '#ffe3ec' : '#ffc6d9'; c.beginPath(); c.ellipse(0, -3.4, 1.7, 3.6, 0, 0, 7); c.fill(); c.restore(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 0, 1.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-0.5, -0.5, 0.5, 0, 7); c.fill();
      c.restore();
    }
  });
  // reeds and cattails along the west bank
  for (let i = 0; i < 16; i++) {
    const a = 2.45 + i * 0.07, bx = P.x + Math.cos(a) * (P.rx + 2), by = P.y + Math.sin(a) * (P.ry + 2), sw = still ? 0 : Math.sin(tm * 1.4 + i) * 2 * (0.5 + FX.wind), h = 20 + (i % 3) * 5;
    c.strokeStyle = i % 2 ? '#3f7447' : '#4f8a55'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw * 0.5, by - h * 0.55, bx + sw, by - h); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = '#6aa66a'; c.beginPath(); c.moveTo(bx + 1, by); c.quadraticCurveTo(bx + 7 + sw * 0.4, by - h * 0.4, bx + 9 + sw * 0.6, by - h * 0.62); c.stroke();
    if (i % 2) { c.fillStyle = '#6b4a30'; rr(c, bx + sw - 1.5, by - h - 8, 3, 8.5, 1.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx + sw - 1.2, by - h - 7, 0.9, 6); c.strokeStyle = '#3a2a1a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx + sw, by - h - 8); c.lineTo(bx + sw, by - h - 12); c.stroke(); }
  }
  // ducks doing slow laps, each trailing a V of ripples
  for (let i = 0; i < 3; i++) {
    const a = (still ? 0 : tm * (0.07 + i * 0.012)) + i * 2.2, dir = Math.sin(a) > 0 ? -1 : 1;
    const dx = P.x + Math.cos(a) * P.rx * (0.5 - i * 0.1), dy = P.y + Math.sin(a) * P.ry * (0.42 - i * 0.08) - 6 + i * 9;
    c.strokeStyle = 'rgba(255,255,255,.42)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(dx - dir * 6, dy + 2.4); c.lineTo(dx - dir * 24, dy - 1.4); c.moveTo(dx - dir * 6, dy + 3.4); c.lineTo(dx - dir * 24, dy + 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(dx, dy + 3.4, 11, 3.6, 0, 0, 7); c.stroke();
    const white = i === 1, bodyC = white ? '#f4f1ea' : '#8a6a4c';
    c.fillStyle = 'rgba(8,30,50,.3)'; c.beginPath(); c.ellipse(dx, dy + 3.6, 8, 2.2, 0, 0, 7); c.fill();
    c.fillStyle = bodyC; c.beginPath(); c.ellipse(dx, dy, 7.8, 4.4, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(dx - dir * 7, dy - 1); c.lineTo(dx - dir * 11.4, dy - 3.6); c.lineTo(dx - dir * 7.4, dy + 1.4); c.fill();
    c.fillStyle = white ? '#dcd8cc' : '#6a4f36'; c.beginPath(); c.ellipse(dx - dir * 1.4, dy - 0.2, 4.4, 2.4, 0.1 * dir, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(dx + dir * 1.2, dy - 2.2, 3.6, 1, 0, 0, 7); c.fill();
    c.fillStyle = white ? '#f4f1ea' : '#2f6b4c'; c.beginPath(); c.arc(dx + dir * 6.4, dy - 4.2, 3.3, 0, 7); c.fill(); c.fillRect(dx + dir * 4.8 - 1.2, dy - 4, 2.6, 3.4);
    if (!white) { c.fillStyle = '#f4f1ea'; c.fillRect(dx + dir * 4.6 - 1.4, dy - 2.4, 2.8, 0.9); }
    c.fillStyle = '#f0a030'; c.beginPath(); c.moveTo(dx + dir * 9, dy - 4.8); c.lineTo(dx + dir * 12.6, dy - 3.8); c.lineTo(dx + dir * 9, dy - 2.8); c.fill();
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(dx + dir * 7.2, dy - 4.8, 0.65, 0, 7); c.fill();
  }
}
