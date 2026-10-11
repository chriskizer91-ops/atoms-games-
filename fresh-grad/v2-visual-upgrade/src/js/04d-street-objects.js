function drawTree(c, t) {
  const x = t.x, y = t.y, r = t.r, se = season();
  const sway = REDUCED ? 0 : Math.sin(FX.time * 1.25 + x * 0.013) * (0.9 + FX.wind * 2.6);
  c.fillStyle = 'rgba(8,16,26,.22)'; c.beginPath(); c.ellipse(x, y + 2, r * 0.7, r * 0.24, 0, 0, 7); c.fill();
  const seed = wTreeSeed(t), ts = wspr('tk' + (seed & 7) + se, 40, 56, g => { g.translate(20, 50); wPaintTrunk(g, seed & 7, se); });
  c.drawImage(ts.cv, x - 20, y - 50, 40, 56);
  const k = t.tone, cx = x + sway, cy = y - 40;
  if (k > 0.3 && k < 0.42 && y > PARK_Y) { wDrawPine(c, t, sway, se); return; }
  if (seasonTree(c, t, cx, cy, r, k)) return;
  wDrawCanopy(c, t, cx, cy, wTreePal(k, se));
}
function drawBench(c, b) {
  const se = season();
  wProp(c, 'bench' + se, b, 28, 30, 56, 40, g => { wPaintBench(g); if (se === 'winter') { g.fillStyle = '#f6fafd'; g.fillRect(-20, -10.8, 40, 1.8); g.fillRect(-20, -23.4, 40, 1.4); g.beginPath(); g.ellipse(0, -9.6, 18, 1.2, 0, 0, 7); g.fill(); } });
}
function wPaintLamp(g) {
  g.fillStyle = 'rgba(8,12,24,.24)'; g.beginPath(); g.ellipse(0, 1, 8, 2.6, 0, 0, 7); g.fill();
  const iron = '#232c35';
  // fluted plinth and tapering shaft
  const pg = g.createLinearGradient(-5.4, 0, 5.4, 0); pg.addColorStop(0, '#3d4852'); pg.addColorStop(0.5, iron); pg.addColorStop(1, '#10161c');
  g.fillStyle = pg; g.beginPath(); g.moveTo(-5.6, 0); g.lineTo(5.6, 0); g.lineTo(4.2, -7); g.lineTo(-4.2, -7); g.closePath(); g.fill();
  g.fillStyle = '#10161c'; g.fillRect(-3.6, -9.6, 7.2, 2.6); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-5.4, -0.6, 10.8, 0.6); g.fillRect(-3.6, -9.6, 7.2, 0.7);
  const sg = g.createLinearGradient(-2.2, 0, 2.2, 0); sg.addColorStop(0, '#55616c'); sg.addColorStop(0.4, iron); sg.addColorStop(1, '#0e1319');
  g.fillStyle = sg; g.beginPath(); g.moveTo(-2.3, -9.6); g.lineTo(2.3, -9.6); g.lineTo(1.4, -51); g.lineTo(-1.4, -51); g.closePath(); g.fill();
  [-20, -34].forEach(y => { g.fillStyle = '#10161c'; g.fillRect(-3, y, 6, 2.2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-3, y, 6, 0.7); });
  // scrolled brackets under the lantern
  g.strokeStyle = iron; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-1.4, -43); g.quadraticCurveTo(-7, -44, -6.4, -50.6); g.moveTo(1.4, -43); g.quadraticCurveTo(7, -44, 6.4, -50.6); g.stroke();
  g.beginPath(); g.arc(-6.6, -47, 1.4, 0, 7); g.arc(6.6, -47, 1.4, 0, 7); g.stroke();
  // lantern: base ring, frame around the (live) glass, hood and finial
  g.fillStyle = iron; g.fillRect(-6.2, -52.8, 12.4, 2.4); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-6.2, -52.8, 12.4, 0.7);
  g.strokeStyle = iron; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-6, -63); g.lineTo(-4.5, -52.4); g.moveTo(6, -63); g.lineTo(4.5, -52.4); g.moveTo(0, -63); g.lineTo(0, -52.4); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-0.6, -62.6, 0.5, 10);
  g.fillStyle = iron; g.beginPath(); g.moveTo(-7.8, -63); g.lineTo(7.8, -63); g.lineTo(4.2, -67.8); g.lineTo(-4.2, -67.8); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(-7.8, -63); g.lineTo(-4.2, -67.8); g.lineTo(-1.6, -67.8); g.lineTo(-4.6, -63); g.fill();
  g.fillStyle = '#10161c'; g.fillRect(-2.6, -70.4, 5.2, 2.8); g.beginPath(); g.arc(0, -71.8, 1.7, 0, 7); g.fill(); g.fillRect(-0.4, -76, 0.8, 4);
}
function drawLamp(c, l) {
  const x = l.x, y = l.y, on = FX.nf > 0.05;
  c.fillStyle = on ? mix('#dfe7ea', '#fff3c8', FX.nf) : '#dfe7ea';
  c.beginPath(); c.moveTo(x - 6, y - 63); c.lineTo(x + 6, y - 63); c.lineTo(x + 4.5, y - 52); c.lineTo(x - 4.5, y - 52); c.closePath(); c.fill();
  c.fillStyle = on ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.7)'; c.fillRect(x - 4.2, y - 62, 1.6, 9);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + 2.6, y - 62, 2, 9);
  wProp(c, 'lamp', l, 15, 78, 30, 82, g => wPaintLamp(g));
  if (on) {
    litRect(x - 6, y - 63, 12, 11);
    addLight(x, y + 6, 128, 70, 0, 0.95); addLight(x, y - 50, 60, 60, 0, 0.5);
    addEmit(x, y - 57, 30, 0, 0.75);
  }
}

/* ---------- the fountain ---------- */
function wPaintFountainBase(g, R, se) {
  g.fillStyle = 'rgba(8,12,24,.24)'; g.beginPath(); g.ellipse(0, 10, R + 8, (R + 8) * 0.56, 0, 0, 7); g.fill();
  const rx = R + 4, ry = rx * 0.62;
  // outer wall: shaded face between the lower and upper ellipses, with joints and a carved band
  const wg = g.createLinearGradient(-rx, 0, rx, 0); wg.addColorStop(0, '#b4bdc3'); wg.addColorStop(0.35, '#8f9aa1'); wg.addColorStop(1, '#5d676e');
  g.fillStyle = wg; g.beginPath(); g.ellipse(0, 3, rx, ry, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(0, 3, rx, ry, 0, 0.3, 1.2); g.lineTo(0, -4); g.fill();
  for (let i = 0; i < 28; i++) { const a = 0.15 + i / 28 * 2.85; g.strokeStyle = 'rgba(30,36,42,.35)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(Math.cos(a) * rx, Math.sin(a) * ry - 4); g.lineTo(Math.cos(a) * rx, Math.sin(a) * ry + 3); g.stroke(); }
  for (let i = 0; i < 14; i++) { const a = 0.22 + i / 14 * 2.7, x = Math.cos(a) * (rx - 1), y = Math.sin(a) * (ry - 1) + 1; g.fillStyle = 'rgba(20,28,34,.38)'; g.beginPath(); g.arc(x, y, 1.6, Math.PI, 0); g.lineTo(x + 1.6, y + 2.6); g.lineTo(x - 1.6, y + 2.6); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 1.2, rx - 0.6, ry - 0.6, 0, 0.2, 2.95); g.stroke();
  // coping
  const cg = g.createRadialGradient(-12, -16, 6, 0, -4, rx); cg.addColorStop(0, '#eef2f4'); cg.addColorStop(1, '#bcc5ca');
  g.fillStyle = cg; g.beginPath(); g.ellipse(0, -4, rx, ry, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(70,80,90,.25)'; g.lineWidth = 0.9; for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * (rx - 5), Math.sin(a) * (ry - 3) - 4); g.lineTo(Math.cos(a) * rx, Math.sin(a) * ry - 4); g.stroke(); }
  g.fillStyle = '#9aa5ab'; g.beginPath(); g.ellipse(0, -4, R - 2, (R - 2) * 0.6, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, -4, R - 2, (R - 2) * 0.6, 0, 3.4, 6.0); g.fill();
  const wr = R - 6, wy = (R - 6) * 0.58;
  if (se === 'winter') {
    const ig = g.createRadialGradient(-10, -10, 2, 0, -4, R); ig.addColorStop(0, '#f2fbff'); ig.addColorStop(1, '#b3d6ea');
    g.fillStyle = ig; g.beginPath(); g.ellipse(0, -4, wr, wy, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-20, -2); g.lineTo(6, -10); g.lineTo(22, -4); g.moveTo(-8, -6); g.lineTo(-14, -14); g.stroke();
    g.strokeStyle = 'rgba(120,170,200,.4)'; g.beginPath(); g.moveTo(10, -1); g.lineTo(18, 4); g.stroke();
    g.fillStyle = '#f6fafd'; g.beginPath(); g.ellipse(0, -9, rx - 3, ry * 0.5, 0, Math.PI, 0); g.fill(); g.fillStyle = 'rgba(160,185,215,.4)'; g.beginPath(); g.ellipse(0, -8, rx - 6, ry * 0.5, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    return;
  }
  const wg2 = g.createRadialGradient(0, -8, 2, 0, -4, R); wg2.addColorStop(0, '#9fe0f5'); wg2.addColorStop(0.7, '#4fb0dc'); wg2.addColorStop(1, '#2f84b8');
  g.fillStyle = wg2; g.beginPath(); g.ellipse(0, -4, wr, wy, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(10,50,90,.3)'; g.beginPath(); g.ellipse(0, -4, wr, wy, 0, 3.4, 6.0); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(0, -4, wr - 1, wy - 0.6, 0, 0.3, 2.8); g.stroke();
  g.fillStyle = 'rgba(70,130,70,.35)'; for (let i = 0; i < 8; i++) { const a = 0.3 + i * 0.35; g.fillRect(Math.cos(a) * (wr - 1) - 0.8, Math.sin(a) * (wy - 1) - 4, 1.6, 1.4); }
}
function wPaintFountainTop(g, se) {
  // pedestal: plinth, urn-shaped stem with rings, bowl, spout
  const sg = g.createLinearGradient(-8, 0, 8, 0); sg.addColorStop(0, '#d9e0e4'); sg.addColorStop(0.45, '#aeb8be'); sg.addColorStop(1, '#6f7a82');
  g.fillStyle = 'rgba(8,12,24,.2)'; g.beginPath(); g.ellipse(0, -1, 11, 3.6, 0, 0, 7); g.fill();
  g.fillStyle = '#8f9aa1'; g.beginPath(); g.ellipse(0, -2, 10, 3.4, 0, 0, 7); g.fill(); g.fillStyle = '#cbd3d8'; g.beginPath(); g.ellipse(0, -4, 9, 3, 0, 0, 7); g.fill();
  g.fillStyle = sg; g.beginPath(); g.moveTo(-6.4, -4); g.lineTo(6.4, -4); g.lineTo(3.4, -12); g.quadraticCurveTo(7.4, -18, 3.2, -24); g.lineTo(3.6, -33); g.lineTo(-3.6, -33); g.lineTo(-3.2, -24); g.quadraticCurveTo(-7.4, -18, -3.4, -12); g.closePath(); g.fill();
  [-12, -24, -31].forEach(y => { g.fillStyle = '#c9d2d6'; g.fillRect(-6, y, 12, 1.6); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-6, y, 12, 0.6); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-6, y + 1.2, 12, 0.5); });
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-5, -20, 1.4, 6);
  // upper bowl
  const bg = g.createLinearGradient(-17, 0, 17, 0); bg.addColorStop(0, '#e2e8eb'); bg.addColorStop(0.5, '#c9d2d6'); bg.addColorStop(1, '#8a959c');
  g.fillStyle = bg; g.beginPath(); g.ellipse(0, -32, 17, 6.6, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, -30.4, 16.4, 5.2, 0, 0.1, 3.0); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(0, -32.4, 16.6, 6.2, 0, 3.4, 5.9); g.stroke();
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.4; g.fillStyle = '#9aa5ab'; g.beginPath(); g.arc(Math.cos(a) * 15.6, -33 + Math.sin(a) * 5.4, 1.5, 0, 7); g.fill(); }
  if (se === 'winter') {
    g.fillStyle = '#f6fafd'; g.beginPath(); g.ellipse(0, -35, 16, 5, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(225,242,255,.95)'; for (let i = 0; i < 7; i++) { const ix = -13 + i * 4.3, L = 5 + (i % 3) * 3; g.beginPath(); g.moveTo(ix - 1.4, -29); g.lineTo(ix + 1.4, -29); g.lineTo(ix, -29 + L); g.closePath(); g.fill(); }
  } else {
    const wg = g.createRadialGradient(-3, -37, 1, 0, -35.5, 13); wg.addColorStop(0, '#b6ecfb'); wg.addColorStop(1, '#5eb6e0');
    g.fillStyle = wg; g.beginPath(); g.ellipse(0, -35.5, 13, 4.2, 0, 0, 7); g.fill();
  }
  const cg = g.createLinearGradient(-3, 0, 3, 0); cg.addColorStop(0, '#d9e0e4'); cg.addColorStop(1, '#7a858c');
  g.fillStyle = cg; g.fillRect(-2.5, -46, 5, 12); g.fillStyle = '#c9d2d6'; g.beginPath(); g.arc(0, -47.4, 3.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(-1, -48.4, 1.2, 0, 7); g.fill();
}
function drawFountain(c, f, tm) {
  const R = f.r, se = season(), win = se === 'winter';
  wProp(c, 'fb' + se, f, 80, 60, 160, 112, g => wPaintFountainBase(g, R, se));
  if (!win) {
    // ripples spreading across the basin and foam round the pedestal
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) { const p = ((tm * 0.45 + i / 3) % 1); c.globalAlpha = (1 - p) * 0.8; c.beginPath(); c.ellipse(f.x, f.y - 4, 8 + p * 32, (8 + p * 32) * 0.58, 0, 0, 7); c.stroke(); }
    c.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.283 + 0.2, p = ((tm * 1.1 + i * 0.37) % 1), rr2 = 9 + p * 6;
      c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - p)).toFixed(3) + ')'; c.beginPath(); c.ellipse(f.x + Math.cos(a) * rr2, f.y - 3 + Math.sin(a) * rr2 * 0.55, 2.2 - p * 0.8, 1.2, 0, 0, 7); c.fill();
    }
  }
  wProp(c, 'ft' + se, f, 30, 62, 60, 70, g => wPaintFountainTop(g, se));
  if (win) {
    if (FX.nf > 0.05) { addLight(f.x, f.y - 6, 150, 100, 1, 0.75); addEmit(f.x, f.y - 24, 60, 1, 0.35); }
    return;
  }
  // water arcing out of the top and spilling from the bowl
  c.fillStyle = 'rgba(214,242,255,.92)';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.3, ph = (tm * 1.25 + i * 0.29) % 1;
    const px = f.x + Math.cos(a) * ph * 14, py = f.y - 48 - Math.sin(ph * Math.PI) * 15 + ph * 12 + Math.sin(a) * ph * 3;
    c.beginPath(); c.arc(px, py, 1.9 - ph * 0.7, 0, 7); c.fill();
  }
  c.strokeStyle = 'rgba(200,236,255,.55)'; c.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4, ex = Math.cos(a), ey = Math.sin(a) * 0.4, ph = (tm * 1.7 + i * 0.41) % 1;
    const x0 = f.x + ex * 15, y0 = f.y - 33 + ey * 6;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + ex * 7, y0 + 6, x0 + ex * 10, y0 + 24 + ey * 16); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 - 0.6, y0); c.quadraticCurveTo(x0 + ex * 7 - 0.6, y0 + 6, x0 + ex * 10 - 0.6, y0 + 24 + ey * 16); c.stroke(); c.strokeStyle = 'rgba(200,236,255,.55)'; c.lineWidth = 1.6;
    c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ph)).toFixed(3) + ')'; c.beginPath(); c.arc(x0 + ex * 10, y0 + 25 + ey * 16, 1 + ph * 3.4, 0, 7); c.fill();
  }
  if (FX.nf > 0.05) { addLight(f.x, f.y - 6, 150, 100, 1, 0.75); addEmit(f.x, f.y - 24, 60, 1, 0.35); }
}
