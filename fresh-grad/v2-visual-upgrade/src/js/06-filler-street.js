/* ============================ filler buildings ============================ */
function drawDeco(c, b) {
  const tower = b.style === 'tower', shop = b.style === 'shop';
  const rh = tower ? 24 : 36;
  baseBuilding(c, b, rh, { mat: tower ? 'panel' : shop ? ((b.seed & 1) ? 'brick' : 'siding') : ((b.seed & 2) ? 'brick' : 'stucco') });
  roofProps(c, b, b.seed);
  const nm = b.name.toUpperCase();
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2;
  const night = FX.nf > 0.05, open = !S || (b.place ? isOpen(b.place) : S.t >= 7 * 60 && S.t < 21 * 60), day = S ? S.day : 1;
  const p = 1 - litChance(tower);
  nameSign(c, nm, cx, b.y + rh / 2 + 2, nm.length > 14 ? 12 : 15, b.accent, shop && open, 5);
  if (tower) {
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(b.x + 6, ft, 5, b.h - rh); c.fillRect(b.x + b.w - 14, ft, 3, b.h - rh);
    c.fillStyle = b.accent; c.globalAlpha = 0.8; c.fillRect(b.x, ft + 4, b.w, 2.5); c.globalAlpha = 1;
  }
  const cols = Math.max(2, Math.floor((b.w - 28) / 50)), cw = (b.w - 28) / cols;
  const rowsEnd = bot - (shop ? 84 : 70), rowStep = tower ? 40 : 54;
  let r = 0;
  for (let y = ft + 14; y + 34 <= rowsEnd; y += rowStep, r++) {
    if (tower) { c.fillStyle = 'rgba(0,0,0,.13)'; c.fillRect(b.x + 12, y - 4, b.w - 24, 34); }
    for (let i = 0; i < cols; i++) {
      const lit = night ? hash01(b.seed + day, r, i) > p : false;
      const wx = b.x + 14 + i * cw + 4;
      windowAt(c, wx, y, cw - 14, tower ? 26 : 32, lit);
      if (!tower && !shop && hash01(b.seed, r * 7 + i, 4) > 0.6) flowerBox(c, wx - 3, y + 35, cw - 8, i + r);
    }
  }
  if (shop) {
    awning(c, b.x - 5, bot - 80, b.w + 10, 22, b.accent, '#f6f1e7');
    windowAt(c, b.x + 14, bot - 54, b.w / 2 - 40, 38, night || open);
    windowAt(c, b.x + b.w / 2 + 28, bot - 54, b.w / 2 - 42, 38, night || open);
    // a little window display
    const dc = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#c77dff'];
    for (let k = 0; k < 2; k++) {
      const wx = k ? b.x + b.w / 2 + 28 : b.x + 14, ww = k ? b.w / 2 - 42 : b.w / 2 - 40;
      c.fillStyle = 'rgba(60,40,30,.45)'; c.fillRect(wx, bot - 24, ww, 8);
      for (let i = 0; i * 13 + 10 < ww; i++) { c.fillStyle = dc[(i + (b.seed % 5) + k) % dc.length]; rr(c, wx + 4 + i * 13, bot - 34 - (i % 2) * 4, 9, 10 + (i % 2) * 4, 2); c.fill(); }
    }
    doorAt(c, cx, bot, 34, 50, shade(b.roof, -0.1), { lit: night && open });
    if (open) sconce(c, cx - 26, bot - 40);
  } else {
    c.fillStyle = shade(b.roof, 0.12); c.fillRect(cx - 34, bot - 62, 68, 7);
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(cx - 34, bot - 62, 68, 1.5);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(cx - 30, bot - 55, 60, 3);
    doorAt(c, cx, bot, 46, 52, tower ? '#2a3b4a' : shade(b.roof, 0.05), { glass: true, lit: night });
    if (!tower) { sconce(c, cx - 34, bot - 38); sconce(c, cx + 34, bot - 38); }
  }
  if (b.place) placeFacade(c, b);
}
function drawBusStop(c, s) {
  const x = s.x, y = s.y, on = FX.nf > 0.05;
  c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x + 2, y + 4, 40, 5, 0, 0, 7); c.fill();
  c.fillStyle = '#3d4852'; c.fillRect(x - 33, y - 54, 4, 56); c.fillRect(x + 29, y - 54, 4, 56);
  c.fillStyle = on ? 'rgba(210,236,250,.5)' : 'rgba(170,215,235,.42)'; c.fillRect(x - 29, y - 48, 58, 40);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(x - 24, y - 8); c.lineTo(x - 8, y - 48); c.lineTo(x + 2, y - 48); c.lineTo(x - 14, y - 8); c.closePath(); c.fill();
  // lit poster
  c.fillStyle = '#f6f1e7'; c.fillRect(x + 9, y - 44, 17, 30);
  c.fillStyle = '#e76f51'; c.fillRect(x + 11, y - 42, 13, 12); c.fillStyle = '#2a6f97'; c.fillRect(x + 11, y - 28, 13, 3); c.fillRect(x + 11, y - 23, 9, 3);
  c.fillStyle = '#2a6f97'; rr(c, x - 38, y - 61, 76, 9, 3); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 36, y - 61, 72, 2);
  c.fillStyle = '#8a5d3c'; c.fillRect(x - 24, y - 17, 30, 4); c.fillStyle = '#3d4852'; c.fillRect(x - 22, y - 13, 3, 13); c.fillRect(x + 1, y - 13, 3, 13);
  // route sign
  c.fillStyle = '#3d4852'; c.fillRect(x - 1, y - 72, 2, 12);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - 82, 12, 0, 7); c.fill();
  c.fillStyle = '#2a6f97'; c.beginPath(); c.arc(x, y - 82, 10, 0, 7); c.fill();
  c.fillStyle = '#fff'; rr(c, x - 6, y - 88, 12, 10, 2); c.fill();
  c.fillStyle = '#2a6f97'; c.fillRect(x - 4.5, y - 86, 9, 3.5); c.fillRect(x - 4, y - 80, 2, 1.6); c.fillRect(x + 2, y - 80, 2, 1.6);
  if (on) { litRect(x + 9, y - 44, 17, 30); addLight(x, y + 2, 84, 46, 1, 0.75); addEmit(x + 17, y - 30, 24, 1, 0.3); }
}

/* ============================ street furniture and park dressing ============================ */
function planter(c, x, y, seed) {
  c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 9, 2.6, 0, 0, 7); c.fill();
  c.fillStyle = '#8f5a3c'; c.beginPath(); c.moveTo(x - 7, y - 11); c.lineTo(x + 7, y - 11); c.lineTo(x + 5.5, y); c.lineTo(x - 5.5, y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 7, y - 11, 14, 1.6);
  c.fillStyle = '#2f7d4f'; c.beginPath(); c.arc(x, y - 16, 8, 0, 7); c.fill();
  c.fillStyle = '#4fa565'; c.beginPath(); c.arc(x - 2.5, y - 18.5, 5, 0, 7); c.fill();
  if (seed % 2 === 0) { const fc = ['#ff6f91', '#ffd166', '#f8f9fa'][seed % 3]; c.fillStyle = fc; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - 5 + i * 3.4, y - 17 - (i % 2) * 4, 1.7, 0, 7); c.fill(); } }
}
const PROP_DRAW = {
  hydrant(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 6, 2, 0, 0, 7); c.fill();
    c.fillStyle = '#d0453c'; rr(c, x - 3.5, y - 13, 7, 13, 2); c.fill(); c.fillRect(x - 5, y - 3, 10, 3); c.fillRect(x - 6, y - 10, 12, 3);
    c.beginPath(); c.arc(x, y - 13, 3.5, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 3, y - 12, 1.5, 9);
  },
  bin(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 8, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = '#3f6b54'; rr(c, x - 6, y - 17, 12, 17, 2); c.fill();
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 3; i++) c.fillRect(x - 4 + i * 3.6, y - 13, 1.4, 10);
    c.fillStyle = '#2c4d3c'; rr(c, x - 7, y - 19.5, 14, 4, 2); c.fill();
  },
  planter(c, p) { planter(c, p.x, p.y, p.v); },
  mailbox(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 8, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = '#24415f'; c.fillRect(x - 5, y - 4, 2, 4); c.fillRect(x + 3, y - 4, 2, 4);
    c.fillStyle = '#2f5f97'; rr(c, x - 7, y - 23, 14, 20, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - 6, y - 21, 3, 15);
    c.fillStyle = '#1d3552'; c.fillRect(x - 4.5, y - 17, 9, 2);
  },
  aframe(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 9, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = '#6b4a30'; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x - 6, y - 21); c.lineTo(x + 6, y - 21); c.lineTo(x + 8, y); c.closePath(); c.fill();
    c.fillStyle = '#23302b'; c.fillRect(x - 5.5, y - 19, 11, 14);
    c.fillStyle = '#f3e6a1'; c.fillRect(x - 3.5, y - 17, 7, 1.4); c.fillStyle = '#ffffff'; c.fillRect(x - 3.5, y - 13.5, 5, 1.2); c.fillRect(x - 3.5, y - 10.5, 6, 1.2);
  },
  rack(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.18)'; c.beginPath(); c.ellipse(x, y + 1, 16, 3, 0, 0, 7); c.fill();
    // a parked bike
    c.strokeStyle = '#20242c'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(x - 8, y - 6, 6, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 8, y - 6, 6, 0, 7); c.stroke();
    c.strokeStyle = p.v % 2 ? '#e76f51' : '#2a9d8f'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(x - 8, y - 6); c.lineTo(x - 2, y - 15); c.lineTo(x + 6, y - 15); c.lineTo(x + 8, y - 6); c.moveTo(x - 2, y - 15); c.lineTo(x + 1, y - 6); c.lineTo(x - 8, y - 6); c.moveTo(x + 6, y - 15); c.lineTo(x + 5, y - 19); c.stroke();
    c.fillStyle = '#20242c'; c.fillRect(x - 5, y - 17, 6, 1.8); c.fillRect(x + 3, y - 20, 5, 1.6);
    c.strokeStyle = '#8f9aa1'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 15, y); c.lineTo(x - 15, y - 11); c.arc(x - 12, y - 11, 3, Math.PI, 0); c.lineTo(x - 9, y); c.stroke();
  },
  news(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 8, 2.4, 0, 0, 7); c.fill();
    c.fillStyle = p.v % 2 ? '#e9c46a' : '#e76f51'; rr(c, x - 6, y - 20, 12, 20, 2); c.fill();
    c.fillStyle = 'rgba(190,225,240,.85)'; c.fillRect(x - 4, y - 17, 8, 8);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 4, y - 6, 8, 2);
  },
  bush(c, p) {
    const x = p.x, y = p.y, r = 9 + (p.v % 5);
    c.fillStyle = 'rgba(8,16,26,.2)'; c.beginPath(); c.ellipse(x, y + 1, r * 1.2, r * 0.36, 0, 0, 7); c.fill();
    c.fillStyle = '#2a7046'; c.beginPath(); c.arc(x - r * 0.55, y - r * 0.5, r * 0.72, 0, 7); c.arc(x + r * 0.55, y - r * 0.5, r * 0.7, 0, 7); c.arc(x, y - r * 0.8, r * 0.86, 0, 7); c.fill();
    c.fillStyle = '#4c9a5a'; c.beginPath(); c.arc(x - r * 0.3, y - r, r * 0.5, 0, 7); c.arc(x + r * 0.45, y - r * 0.75, r * 0.34, 0, 7); c.fill();
    if (p.v % 3 === 0) { c.fillStyle = ['#ff6f91', '#f8f9fa', '#ffd166'][(p.v >> 1) % 3]; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x - r * 0.7 + i * r * 0.36, y - r * (0.6 + (i % 2) * 0.5), 1.6, 0, 7); c.fill(); } }
  },
  rock(c, p) {
    const x = p.x, y = p.y;
    c.fillStyle = 'rgba(8,16,26,.2)'; c.beginPath(); c.ellipse(x, y + 1, 10, 3, 0, 0, 7); c.fill();
    c.fillStyle = '#8f9aa1'; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x - 6, y - 7); c.lineTo(x + 1, y - 10); c.lineTo(x + 8, y - 5); c.lineTo(x + 10, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(x - 6, y - 7); c.lineTo(x + 1, y - 10); c.lineTo(x - 1, y - 5); c.closePath(); c.fill();
  },
  gate(c, p) {
    const x = p.x, y = p.y;
    [-40, 40].forEach(dx => {
      c.fillStyle = 'rgba(8,12,24,.22)'; c.beginPath(); c.ellipse(x + dx, y + 1, 10, 3, 0, 0, 7); c.fill();
      c.fillStyle = '#a9a294'; c.fillRect(x + dx - 6, y - 58, 12, 58);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + dx - 6, y - 58, 3, 58);
      c.fillStyle = '#8b8577'; c.fillRect(x + dx - 8, y - 5, 16, 5); c.fillRect(x + dx - 8, y - 62, 16, 5);
      c.fillStyle = FX.nf > 0.05 ? '#fff0c0' : '#e3e9ec'; c.beginPath(); c.arc(x + dx, y - 67, 4.5, 0, 7); c.fill();
      if (FX.nf > 0.05) { litRect(x + dx - 5, y - 72, 10, 10); addLight(x + dx, y + 2, 90, 52, 0, 0.8); addEmit(x + dx, y - 67, 20, 0, 0.6); }
    });
    c.strokeStyle = '#2c4d3c'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 40, y - 62); c.quadraticCurveTo(x, y - 96, x + 40, y - 62); c.stroke();
    c.fillStyle = '#2c4d3c'; rr(c, x - 36, y - 88, 72, 16, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x - 34, y - 87, 68, 2);
    signText(c, 'CENTRAL PARK', x, y - 79.5, 9, '#f3e6a1');
  }
};

