/* a building's walls, texture and roof band never change, so each one is painted once and kept as a sprite */
const SHELL = new Map();
function baseBuilding(c, b, rh, o) {
  o = o || {};
  const res = (typeof GC !== 'undefined' && GC.res) || 1, key = (b.id || b.x) + '|' + b.wall + '|' + res;
  let sp = SHELL.get(key);
  if (!sp) {
    sp = document.createElement('canvas'); sp.width = Math.ceil((b.w + 16) * res); sp.height = Math.ceil((b.h + 8) * res);
    const g = sp.getContext('2d'); g.setTransform(res, 0, 0, res, -(b.x - 8) * res, -(b.y - 1) * res);
    paintShell(g, b, rh, o);
    if (SHELL.size > 26) SHELL.clear();
    SHELL.set(key, sp);
  }
  c.drawImage(sp, b.x - 8, b.y - 1, b.w + 16, b.h + 8);
}
function paintShell(c, b, rh, o) {
  const x = b.x, y = b.y, w = b.w, h = b.h, bot = y + h;
  c.fillStyle = 'rgba(8,12,28,.26)'; c.fillRect(x - 4, bot - 2, w + 8, 6);
  const g = c.createLinearGradient(0, y + rh, 0, bot);
  g.addColorStop(0, shade(b.wall, 0.1)); g.addColorStop(1, shade(b.wall, -0.1));
  c.fillStyle = g; c.fillRect(x, y + rh, w, h - rh);
  patFill(c, o.mat || 'stucco', x, y + rh, w, h - rh, o.matA == null ? 1 : o.matA);
  c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(x, y + rh, 5, h - rh);
  c.fillStyle = 'rgba(0,0,0,.17)'; c.fillRect(x + w - 7, y + rh, 7, h - rh);
  c.fillStyle = shade(b.wall, -0.4); c.fillRect(x, bot - 9, w, 9);
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, bot - 9, w, 1.5);
  const rg = c.createLinearGradient(0, y, 0, y + rh); rg.addColorStop(0, shade(b.roof, 0.14)); rg.addColorStop(1, shade(b.roof, -0.14));
  c.fillStyle = rg; c.fillRect(x - 7, y, w + 14, rh);
  c.fillStyle = shade(b.roof, 0.36); c.fillRect(x - 7, y, w + 14, 3);
  c.fillStyle = shade(b.roof, -0.42); c.fillRect(x - 7, y + rh - 4, w + 14, 4);
  const sg = c.createLinearGradient(0, y + rh, 0, y + rh + 15); sg.addColorStop(0, 'rgba(0,0,0,.3)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sg; c.fillRect(x, y + rh, w, 15);
}
/* how many home and office windows are lit at this hour */
function litChance(office) {
  const h = S ? S.t / 60 : 20;
  if (office) return h >= 22 || h < 5 ? 0.14 : h < 8 ? 0.3 : 0.5;
  return h >= 23.5 || h < 4.8 ? 0.12 : h >= 22.5 ? 0.42 : h < 8 ? 0.55 : 0.78;
}

function drawApartment(c, b) {
  const rh = 44; baseBuilding(c, b, rh, { mat: 'brick' });
  roofProps(c, b, 11);
  const cx = b.x + b.w / 2, bot = b.y + b.h, ft = b.y + rh, p = 1 - litChance(false), day = S ? S.day : 1;
  nameSign(c, 'MAPLE COURT', cx, b.y + rh / 2 + 2, 19, '#f3d9b8');
  c.fillStyle = 'rgba(255,236,214,.24)'; c.fillRect(b.x, ft + 78, b.w, 4); c.fillRect(b.x, ft + 140, b.w, 4);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
    const wx = b.x + 22 + i * 49, wy = ft + 24 + r * 62;
    windowAt(c, wx, wy, 31, 36, hash01(i, r, 12 + day) > p);
    if (hash01(i, r, 5) > 0.45) flowerBox(c, wx - 3, wy + 39, 37, i + r * 3);
    else { c.fillStyle = shade(b.wall, -0.32); c.fillRect(wx - 4, wy + 39, 39, 4); }
  }
  for (let i = 0; i < 5; i++) if (i !== 2) windowAt(c, b.x + 22 + i * 49, bot - 68, 31, 38, hash01(i, 9, 12 + day) > p);
  // ivy climbing the west corner
  for (let i = 0; i < 16; i++) {
    c.fillStyle = i % 3 ? '#3d8a55' : '#55a563';
    c.beginPath(); c.arc(b.x + 4 + hash01(i, 3, 1) * 13, bot - 12 - i * 9.5 - hash01(i, 4, 1) * 5, 4.4 + hash01(i, 5, 1) * 2.6, 0, 7); c.fill();
  }
  // entrance canopy
  c.fillStyle = '#3f6b54'; c.beginPath(); c.moveTo(cx - 36, bot - 70); c.quadraticCurveTo(cx, bot - 96, cx + 36, bot - 70); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(cx - 30, bot - 73); c.quadraticCurveTo(cx, bot - 92, cx + 30, bot - 73); c.quadraticCurveTo(cx, bot - 86, cx - 30, bot - 73); c.fill();
  c.fillStyle = '#2c4d3c'; c.fillRect(cx - 36, bot - 71, 72, 4);
  doorAt(c, cx, bot, 38, 58, '#5a3b2a', { lit: true });
  c.fillStyle = '#f4ead8'; rr(c, cx - 11, bot - 81, 22, 10, 3); c.fill();
  signText(c, '12', cx, bot - 75.5, 9, '#33261a');
  sconce(c, cx - 32, bot - 46); sconce(c, cx + 32, bot - 46);
}
function drawWork(c, b) {
  const d = job(); const wb = { x: b.x, y: b.y, w: b.w, h: b.h, wall: d.wall, roof: d.roof };
  const rh = 46; baseBuilding(c, wb, rh, { mat: 'panel' });
  roofProps(c, b, 23);
  const nm = d.employer, cx = b.x + b.w / 2, bot = b.y + b.h, ft = b.y + rh;
  const open = isOpen('work'), lit = open || (FX.nf > 0.05 && S && S.t < 22 * 60);
  nameSign(c, nm.toUpperCase(), cx, b.y + rh / 2 + 2, nm.length > 16 ? 15 : 18, d.accent, lit, 1);
  c.fillStyle = d.accent; c.globalAlpha = 0.85; c.fillRect(b.x, ft + 6, b.w, 3); c.globalAlpha = 1;
  for (let r = 0; r < 2; r++) {
    c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(b.x + 12, ft + 16 + r * 56, b.w - 24, 42);
    for (let i = 0; i < 5; i++) windowAt(c, b.x + 18 + i * 52, ft + 20 + r * 56, 36, 34, lit && hash01(i, r, 31 + (S ? S.day : 0)) > (open ? 0.12 : 0.55));
  }
  windowAt(c, b.x + 20, bot - 62, 70, 44, lit); windowAt(c, b.x + b.w - 90, bot - 62, 70, 44, lit);
  // glass canopy over the lobby doors
  c.fillStyle = shade(d.roof, 0.12); c.fillRect(cx - 44, bot - 78, 88, 7);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(cx - 44, bot - 78, 88, 1.6);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(cx - 40, bot - 71, 80, 4);
  doorAt(c, cx, bot, 46, 60, '#2a3b4a', { glass: true, lit });
  planter(c, cx - 44, bot + 2, 0); planter(c, cx + 44, bot + 2, 1);
}
function drawShop(c, b) {
  const rh = 46; baseBuilding(c, b, rh, { mat: 'siding' });
  roofProps(c, b, 37);
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, open = isOpen('grocery'), lit = open || FX.nf > 0.05;
  nameSign(c, 'CORNER GROCERY', cx, b.y + rh / 2 + 2, 18, '#e9ffef', open, 3);
  awning(c, b.x - 5, ft + 4, b.w + 10, 26, '#2f8a5b', '#f4f7f2');
  windowAt(c, b.x + 14, ft + 40, 78, 66, lit); windowAt(c, b.x + b.w - 92, ft + 40, 78, 66, lit);
  // produce on show behind the glass
  const pc = ['#e63946', '#f4a261', '#8ac926', '#ffca3a', '#b5651d'];
  [b.x + 14, b.x + b.w - 92].forEach((wx, k) => {
    c.fillStyle = 'rgba(90,60,30,.55)'; c.fillRect(wx, ft + 88, 78, 18);
    for (let i = 0; i < 9; i++) { c.fillStyle = pc[(i + k * 2) % pc.length]; c.beginPath(); c.arc(wx + 7 + i * 8, ft + 87 - (i % 2) * 3, 4.2, 0, 7); c.fill(); }
  });
  doorAt(c, cx, bot, 40, 62, '#2f4f40', { glass: true, lit });
  if (open) { c.fillStyle = '#f4f7f2'; rr(c, cx - 13, bot - 44, 26, 11, 3); c.fill(); signText(c, 'OPEN', cx, bot - 38.2, 8, '#2f6b4c'); }
  // crates out front
  const cols = ['#e63946', '#f4a261', '#8ac926', '#ffca3a'];
  for (let i = 0; i < 4; i++) {
    const x = b.x + 20 + i * 22;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 1, bot - 1, 20, 3);
    c.fillStyle = '#8a5a34'; c.fillRect(x, bot - 15, 20, 14);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, bot - 9, 20, 1.5); c.fillRect(x + 9, bot - 15, 1.5, 14);
    c.fillStyle = cols[i];
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + 4 + k * 4.2, bot - 16 - (k % 2) * 2.4, 3.6, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x + 7, bot - 19, 1.2, 0, 7); c.fill();
  }
  sconce(c, cx - 30, bot - 50); sconce(c, cx + 30, bot - 50);
}
function drawDiner(c, b) {
  const rh = 40; baseBuilding(c, b, rh, { mat: 'siding', matA: 0.5 });
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, open = isOpen('diner'), lit = open || FX.nf > 0.05;
  // chrome trim and a roof sign
  c.fillStyle = '#e4e8ea'; c.fillRect(b.x - 7, b.y + rh - 11, b.w + 14, 4);
  c.fillStyle = '#9aa3aa'; c.fillRect(b.x - 7, b.y + rh - 7, b.w + 14, 1.5);
  c.fillStyle = '#7b848b'; c.fillRect(b.x + b.w - 44, b.y - 16, 8, 16); c.fillStyle = '#5d666d'; c.fillRect(b.x + b.w - 47, b.y - 19, 14, 4);
  c.fillStyle = '#2a1418'; rr(c, cx - 80, b.y - 20, 160, 42, 12); c.fill();
  c.strokeStyle = open ? '#ff7a95' : '#7a4a55'; c.lineWidth = 2; rr(c, cx - 76, b.y - 16, 152, 34, 9); c.stroke();
  nameSign(c, "DOT'S DINER", cx, b.y + 2, 20, open ? '#fff3df' : '#b9a59a', open, 4);
  if (open && FX.nf > 0.05) { litRect(cx - 78, b.y - 18, 156, 38); addLight(cx, b.y + 40, 150, 70, 4, 0.5); }
  // checker band
  for (let i = 0; i < b.w / 10; i++) { c.fillStyle = i % 2 ? '#f5efe6' : '#2a2226'; c.fillRect(b.x + i * 10, ft + 34, Math.min(10, b.w - i * 10), 5); c.fillStyle = i % 2 ? '#2a2226' : '#f5efe6'; c.fillRect(b.x + i * 10, ft + 39, Math.min(10, b.w - i * 10), 5); }
  windowAt(c, b.x + 14, ft + 54, 80, 50, lit); windowAt(c, b.x + b.w - 94, ft + 54, 80, 50, lit);
  windowAt(c, b.x + 14, ft + 6, 40, 22, lit); windowAt(c, b.x + b.w - 54, ft + 6, 40, 22, lit);
  // booth backs seen through the glass
  [b.x + 14, b.x + b.w - 94].forEach(wx => { c.fillStyle = 'rgba(120,30,36,.7)'; rr(c, wx + 8, ft + 84, 26, 20, 5); c.fill(); rr(c, wx + 46, ft + 84, 26, 20, 5); c.fill(); });
  doorAt(c, cx, bot, 38, 58, '#6a2b2b', { lit });
  c.fillStyle = open ? '#ff4d6d' : '#4a252d'; rr(c, cx - 22, ft + 6, 44, 18, 5); c.fill();
  signText(c, open ? 'OPEN' : 'CLOSED', cx, ft + 15.5, 10, open ? '#fff' : '#9a6a75');
  if (open && FX.nf > 0.05) { litRect(cx - 22, ft + 6, 44, 18); addEmit(cx, ft + 15, 34, 4, 0.5); }
  c.fillStyle = '#e4e8ea'; c.fillRect(b.x, bot - 12, b.w, 3);
}
function drawClinic(c, b) {
  const rh = 46; baseBuilding(c, b, rh, { mat: 'panel', matA: 0.7 });
  roofProps(c, b, 53);
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2;
  nameSign(c, 'ST. ANNE CLINIC', cx, b.y + rh / 2 + 2, 17, '#e8f6ff', true, 1);
  c.fillStyle = '#4d86a8'; c.fillRect(b.x, ft + 8, b.w, 5);
  for (let i = 0; i < 5; i++) windowAt(c, b.x + 20 + i * 50, ft + 24, 32, 34, hash01(i, 2, 61) > 0.25);
  windowAt(c, b.x + 22, bot - 66, 70, 44, true); windowAt(c, b.x + b.w - 92, bot - 66, 70, 44, true);
  // lit cross
  c.fillStyle = '#fff'; rr(c, cx - 19, ft + 66, 38, 38, 8); c.fill();
  c.fillStyle = '#d63b4b'; c.fillRect(cx - 5, ft + 71, 10, 28); c.fillRect(cx - 14, ft + 80, 28, 10);
  if (FX.nf > 0.05) { litRect(cx - 19, ft + 66, 38, 38); addEmit(cx, ft + 85, 40, 2, 0.4); addLight(cx, bot + 6, 120, 60, 1, 0.6); }
  c.fillStyle = '#d63b4b'; c.fillRect(cx - 44, bot - 58, 88, 8);
  signText(c, 'EMERGENCY', cx, bot - 53.6, 7, '#fff');
  doorAt(c, cx, bot, 40, 46, '#9ec3d6', { glass: true, lit: true });
}

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

