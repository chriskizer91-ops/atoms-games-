function drawTree(c, t) {
  const x = t.x, y = t.y, r = t.r;
  const sway = REDUCED ? 0 : Math.sin(FX.time * 1.25 + x * 0.013) * (0.9 + FX.wind * 2.6);
  c.fillStyle = 'rgba(8,16,26,.22)'; c.beginPath(); c.ellipse(x, y + 2, r * 0.7, r * 0.24, 0, 0, 7); c.fill();
  c.fillStyle = '#5a3d27'; c.beginPath(); c.moveTo(x - 5, y + 1); c.lineTo(x - 3.2 + sway * 0.3, y - 32); c.lineTo(x + 3.2 + sway * 0.3, y - 32); c.lineTo(x + 5, y + 1); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(x - 3.6, y - 28, 2, 27);
  const k = t.tone, cx = x + sway, cy = y - 40;
  if (k > 0.3 && k < 0.42 && y > PARK_Y) {
    // a pine
    const cols = ['#1f5a40', '#2a6f4c', '#3a8558'];
    for (let i = 0; i < 3; i++) {
      const w = r * (1.25 - i * 0.28), ty = y - 16 - i * r * 0.62, sx = sway * (0.4 + i * 0.3);
      c.fillStyle = cols[i]; c.beginPath(); c.moveTo(x - w + sx * 0.4, ty); c.lineTo(x + sx, ty - r * 1.12); c.lineTo(x + w + sx * 0.4, ty); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(x - w * 0.9 + sx * 0.4, ty); c.lineTo(x + sx, ty - r * 1.12); c.lineTo(x - w * 0.2 + sx * 0.4, ty); c.closePath(); c.fill();
      if (WINTER()) snowOnPine(c, x, w, ty, r, sx);
    }
    return;
  }
  if (seasonTree(c, t, cx, cy, r, k)) return;
  let dk, md, lt;
  if (k < 0.07) { dk = '#b85c7c'; md = '#e58aa6'; lt = '#ffc3d4'; }
  else if (k > 0.93) { dk = '#b5762a'; md = '#e0a23c'; lt = '#f6cf6a'; }
  else { dk = mix('#22633f', '#2f7a45', k); md = mix('#338a52', '#55a556', k); lt = mix('#5cb46c', '#8fce6a', k); }
  const blob = (ox, oy, rr2, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx + ox * r, cy + oy * r, rr2 * r, 0, 7); c.fill(); };
  blob(0, 0.16, 1.02, dk); blob(-0.5, 0.2, 0.62, dk); blob(0.52, 0.22, 0.6, dk);
  blob(-0.34, -0.08, 0.66, md); blob(0.36, -0.04, 0.62, md); blob(0, -0.36, 0.72, md);
  blob(-0.26, -0.44, 0.44, lt); blob(0.22, -0.3, 0.3, lt); blob(-0.52, -0.02, 0.24, lt);
}
function drawBench(c, b) {
  const x = b.x, y = b.y;
  c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 4, 21, 4, 0, 0, 7); c.fill();
  c.fillStyle = '#2b3138'; c.fillRect(x - 17, y - 20, 3, 23); c.fillRect(x + 14, y - 20, 3, 23); c.fillRect(x - 18, y + 1, 6, 2); c.fillRect(x + 12, y + 1, 6, 2);
  c.fillStyle = '#8a5d3c'; c.fillRect(x - 20, y - 21, 40, 4); c.fillRect(x - 20, y - 15, 40, 4);
  c.fillStyle = '#a8744c'; c.fillRect(x - 20, y - 9, 40, 5);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 20, y - 21, 40, 1.2); c.fillRect(x - 20, y - 9, 40, 1.4);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 20, y - 4.5, 40, 1.5);
}
function drawLamp(c, l) {
  const x = l.x, y = l.y, on = FX.nf > 0.05;
  c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 7, 2.4, 0, 0, 7); c.fill();
  c.fillStyle = '#232c35'; c.fillRect(x - 3.5, y - 5, 7, 6); c.fillRect(x - 1.6, y - 50, 3.2, 46);
  c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x - 1.6, y - 50, 1, 46);
  c.fillStyle = '#232c35'; c.fillRect(x - 6, y - 52, 12, 2.4);
  c.beginPath(); c.moveTo(x - 7, y - 63); c.lineTo(x + 7, y - 63); c.lineTo(x + 4, y - 67); c.lineTo(x - 4, y - 67); c.closePath(); c.fill();
  c.fillStyle = on ? mix('#dfe7ea', '#fff3c8', FX.nf) : '#dfe7ea';
  c.beginPath(); c.moveTo(x - 6, y - 63); c.lineTo(x + 6, y - 63); c.lineTo(x + 4.5, y - 52); c.lineTo(x - 4.5, y - 52); c.closePath(); c.fill();
  if (on) {
    litRect(x - 6, y - 63, 12, 11);
    addLight(x, y + 6, 128, 70, 0, 0.95); addLight(x, y - 50, 60, 60, 0, 0.5);
    addEmit(x, y - 57, 30, 0, 0.75);
  }
}
function drawFountain(c, f, tm) {
  const R = f.r;
  c.fillStyle = 'rgba(8,12,24,.22)'; c.beginPath(); c.ellipse(f.x, f.y + 10, R + 8, (R + 8) * 0.56, 0, 0, 7); c.fill();
  c.fillStyle = '#8f9aa1'; c.beginPath(); c.ellipse(f.x, f.y + 3, R + 4, (R + 4) * 0.62, 0, 0, 7); c.fill();
  c.fillStyle = '#d3dade'; c.beginPath(); c.ellipse(f.x, f.y - 4, R + 4, (R + 4) * 0.62, 0, 0, 7); c.fill();
  c.fillStyle = '#b3bdc3'; c.beginPath(); c.ellipse(f.x, f.y - 4, R - 2, (R - 2) * 0.6, 0, 0, 7); c.fill();
  const wg = c.createRadialGradient(f.x, f.y - 8, 2, f.x, f.y - 4, R);
  wg.addColorStop(0, '#9fe0f5'); wg.addColorStop(1, '#3f9fd0');
  c.fillStyle = wg; c.beginPath(); c.ellipse(f.x, f.y - 4, R - 6, (R - 6) * 0.58, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { const p = ((tm * 0.45 + i / 3) % 1); c.globalAlpha = (1 - p) * 0.8; c.beginPath(); c.ellipse(f.x, f.y - 4, 8 + p * 32, (8 + p * 32) * 0.58, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
  // pedestal and upper bowl
  c.fillStyle = '#aeb8be'; c.fillRect(f.x - 5, f.y - 34, 10, 32);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(f.x - 5, f.y - 34, 3, 32);
  c.fillStyle = '#c9d2d6'; c.beginPath(); c.ellipse(f.x, f.y - 34, 17, 6, 0, 0, 7); c.fill();
  c.fillStyle = '#6fc3e8'; c.beginPath(); c.ellipse(f.x, f.y - 35.5, 13, 4, 0, 0, 7); c.fill();
  c.fillStyle = '#aeb8be'; c.fillRect(f.x - 2.5, f.y - 46, 5, 12);
  if (WINTER()) {
    // frozen solid for the winter
    const ig = c.createRadialGradient(f.x - 10, f.y - 10, 2, f.x, f.y - 4, R);
    ig.addColorStop(0, '#f2fbff'); ig.addColorStop(1, '#b3d6ea');
    c.fillStyle = ig; c.beginPath(); c.ellipse(f.x, f.y - 4, R - 6, (R - 6) * 0.58, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(f.x - 20, f.y - 2); c.lineTo(f.x + 6, f.y - 10); c.lineTo(f.x + 22, f.y - 4); c.stroke();
    c.fillStyle = '#f6fafd'; c.beginPath(); c.ellipse(f.x, f.y - 37, 16, 5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(225,242,255,.95)';
    for (let i = 0; i < 7; i++) { const ix = f.x - 13 + i * 4.3, L = 5 + (i % 3) * 3; c.beginPath(); c.moveTo(ix - 1.4, f.y - 33); c.lineTo(ix + 1.4, f.y - 33); c.lineTo(ix, f.y - 33 + L); c.closePath(); c.fill(); }
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
    c.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ph)).toFixed(3) + ')'; c.beginPath(); c.arc(x0 + ex * 10, y0 + 25 + ey * 16, 1 + ph * 3.4, 0, 7); c.fill();
  }
  if (FX.nf > 0.05) { addLight(f.x, f.y - 6, 150, 100, 1, 0.75); addEmit(f.x, f.y - 24, 60, 1, 0.35); }
}
