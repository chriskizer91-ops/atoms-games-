/* ============================ cinematic backdrop ============================
   Sky, clouds, hills, the campus with its brick clock tower, big oaks and lamp-posts. All baked once; clouds and birds are
   drawn live (cheap sprites) so the sky keeps moving. Light comes from the upper left, where the sun sits. */
const CIN_SUN = { x: 140, y: 150 };

function cinBuildBackdrop() {
  const L = CN.L, S = CN.S;
  // sky: smooth, so a very low-res bake is plenty
  L.sky = cnLayer(-2600, -1500, 6400, 2100, 0.12, g => {
    g.fillStyle = cnLG(g, 0, -1500, 0, 600, [[0, '#17479f'], [0.45, '#2f78d2'], [0.7, '#5fa6e8'], [0.86, '#a6d2f2'], [1, '#fbe0bc']]);
    g.fillRect(-2600, -1500, 6400, 2100);
    g.fillStyle = cnRG(g, CIN_SUN.x, CIN_SUN.y, 0, CIN_SUN.x, CIN_SUN.y, 760, [[0, 'rgba(255,244,210,.5)'], [0.25, 'rgba(255,236,190,.22)'], [0.6, 'rgba(255,226,170,.06)'], [1, 'rgba(255,226,170,0)']]);
    g.fillRect(-2600, -1500, 6400, 2100);
    // a warm haze band along the horizon
    g.fillStyle = cnLG(g, 0, 300, 0, 560, [[0, 'rgba(255,214,160,0)'], [1, 'rgba(255,214,160,.5)']]); g.fillRect(-2600, 300, 6400, 260);
  });
  // cloud sprites (lit upper left, bluish underside) and their placement
  S.clouds = [cinCloudSprite(11, 420, 170), cinCloudSprite(23, 360, 150), cinCloudSprite(37, 500, 190), cinCloudSprite(41, 300, 120), cinCloudSprite(53, 440, 160)];
  S.cloudPlan = [
    // layer 0 (far, slow, small), layer 1 (nearer, drifting a little faster, larger)
    [0, -500, 150, 0.34, 3.2, 0], [0, 760, 90, 0.5, 2.6, 1], [0, 1750, 170, 0.4, 3.6, 3], [0, 2500, 70, 0.55, 2.2, 4],
    [1, -250, 20, 0.95, 5.5, 2], [1, 1100, -40, 0.8, 6.5, 0], [1, 2150, 40, 1.0, 4.8, 4], [1, 560, 10, 0.7, 7.5, 1]
  ];
  L.hillFar = cnLayer(-1400, 250, 4200, 280, 0.45, g => {
    cinRidge(g, -1400, 2800, 400, 60, 3, '#bdd3d4', '#a9c4c4', 0, 0);
    cinRidge(g, -1400, 2800, 436, 46, 8, '#a8c2bf', '#98b5ae', 0, 0);
    g.fillStyle = 'rgba(214,232,244,.35)'; g.fillRect(-1400, 250, 4200, 280);
  });
  L.hillMid = cnLayer(-1400, 320, 4200, 240, 0.55, g => {
    cinRidge(g, -1400, 2800, 450, 44, 21, '#8fb79a', '#719f83', 1, 9);
    cinRidge(g, -1400, 2800, 484, 30, 22, '#77a587', '#5f9371', 1, 11);
    g.fillStyle = 'rgba(200,226,240,.18)'; g.fillRect(-1400, 320, 4200, 240);
  });
  L.hillNear = cnLayer(-1300, 372, 4000, 220, 0.7, g => {
    cinRidge(g, -1300, 2700, 520, 34, 41, '#5d9a62', '#3e7a4c', 1, 15);
    g.fillStyle = cnLG(g, 0, 500, 0, 592, [[0, 'rgba(40,90,60,0)'], [1, 'rgba(24,60,48,.9)']]); g.fillRect(-1300, 500, 4000, 92);
  });
  L.campus = cnLayer(-1100, 40, 3400, 520, 0.7, g => {
    cinHall(g, -820, 470, 520, 118, '#cdbfa4', '#a3957c', 2, true);       // stone library, left
    cinHall(g, 1340, 470, 470, 126, '#b56b52', '#8b4a38', 3, false);     // brick hall, right
    cinTower(g, 1218, 474, 1.0);
    cinHall(g, 1860, 470, 360, 100, '#c9b793', '#a08e6c', 4, true);
    cinBushes(g, -900, 2200, 470, 6);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(206,226,244,.2)'; g.fillRect(-1100, 40, 3400, 520); g.globalCompositeOperation = 'source-over';
  });
  L.trees = cnLayer(-1200, -120, 3800, 700, 0.8, g => {
    cinOak(g, -330, 478, 1.15, 5);
    cinOak(g, 1262, 478, 1.0, 6);
    cinOak(g, -640, 478, 1.3, 7);
    cinOak(g, 1760, 478, 1.2, 8);
    cinLamp(g, 96, 478, 224);
    cinLamp(g, 1190, 478, 224);
    cinLamp(g, -300, 478, 200);
    cinLamp(g, 1500, 478, 200);
  });
  L.lawn = cnLayer(-1400, 440, 4200, 900, 0.5, g => {
    g.fillStyle = cnLG(g, 0, 440, 0, 1340, [[0, '#6fae62'], [0.18, '#5a9b58'], [0.5, '#2f6b4a'], [1, '#14302c']]); g.fillRect(-1400, 440, 4200, 900);
    for (let i = 0; i < 26; i++) { const y = 460 + i * i * 1.15; g.fillStyle = i % 2 ? 'rgba(255,255,200,.05)' : 'rgba(0,30,20,.07)'; g.fillRect(-1400, y, 4200, 8 + i * 1.6); }
    // dew sparkle on the grass near the horizon
    const r = mulberry32(31);
    for (let i = 0; i < 220; i++) { const x = -1400 + r() * 4200, y = 446 + r() * 120; g.fillStyle = 'rgba(255,255,230,' + (0.15 + r() * 0.25) + ')'; g.fillRect(x, y, 1.6, 1); }
  });
}

/* ---------- sky, sun, clouds, birds (live) ---------- */
function cinSky(c, V, ct) { cnBlit(c, CN.L.sky); }
function cinSun(c, V, ct) {
  const S = CN.S, sx = CIN_SUN.x, sy = CIN_SUN.y;
  c.globalCompositeOperation = 'lighter';
  // slow crepuscular shafts fanning out from the sun
  for (let i = 0; i < 7; i++) {
    const a = 0.12 + i * 0.2 + Math.sin(ct * 0.15 + i) * 0.015, w = 0.05 + (i % 3) * 0.02;
    c.fillStyle = cnLG(c, sx, sy, sx + Math.cos(a) * 1500, sy + Math.sin(a) * 1500, [[0, 'rgba(255,240,200,.15)'], [1, 'rgba(255,240,200,0)']]);
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - w) * 1600, sy + Math.sin(a - w) * 1600); c.lineTo(sx + Math.cos(a + w) * 1600, sy + Math.sin(a + w) * 1600); c.closePath(); c.fill();
  }
  c.globalAlpha = 0.34; c.drawImage(S.glowW, sx - 340, sy - 340, 680, 680);
  c.globalAlpha = 0.7; c.drawImage(S.glowW, sx - 120, sy - 120, 240, 240);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = cnRG(c, sx, sy, 0, sx, sy, 42, [[0, '#ffffff'], [0.72, '#fffbe8'], [1, 'rgba(255,248,214,0)']]);
  c.beginPath(); c.arc(sx, sy, 42, 0, CN_TAU); c.fill();
}
function cinCloudSprite(seed, w, h) {
  const rnd = mulberry32(seed), cv = cnMk(w, h), g = cv.getContext('2d');
  const n = 12 + Math.floor(rnd() * 5), puffs = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), hump = Math.sin(t * Math.PI);
    puffs.push([w * (0.14 + 0.72 * t) + (rnd() - 0.5) * w * 0.05, h * (0.66 - hump * 0.3) + (rnd() - 0.5) * h * 0.08, h * (0.17 + 0.2 * hump + rnd() * 0.09)]);
  }
  puffs.push([w * 0.5, h * 0.4, h * 0.3]);
  puffs.forEach(p => { g.fillStyle = cnRG(g, p[0], p[1], p[2] * 0.15, p[0], p[1], p[2], [[0, 'rgba(255,255,255,1)'], [0.62, 'rgba(255,255,255,.93)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(p[0], p[1], p[2], 0, CN_TAU); g.fill(); });
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = cnLG(g, 0, h * 0.74, 0, h * 0.98, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.95)']]); g.fillRect(0, h * 0.74, w, h * 0.26);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = cnLG(g, 0, 0, w * 0.4, h, [[0, 'rgba(255,248,226,0)'], [0.55, 'rgba(176,200,232,.30)'], [1, 'rgba(110,142,196,.62)']]); g.fillRect(0, 0, w, h);
  puffs.forEach(p => { g.fillStyle = cnRG(g, p[0] - p[2] * 0.3, p[1] - p[2] * 0.35, 0, p[0] - p[2] * 0.3, p[1] - p[2] * 0.35, p[2] * 0.8, [[0, 'rgba(255,252,238,.85)'], [1, 'rgba(255,252,238,0)']]); g.fillRect(p[0] - p[2], p[1] - p[2], p[2] * 2, p[2] * 2); });
  g.globalCompositeOperation = 'source-over';
  return cv;
}
function cinClouds(c, ct, layer) {
  const S = CN.S, span = 3400;
  for (let i = 0; i < S.cloudPlan.length; i++) {
    const p = S.cloudPlan[i];
    if (p[0] !== layer) continue;
    const sp = S.clouds[p[5]], sc = p[4] * 0.2 + 0.6 + p[0] * 0.4;
    const x = ((p[1] + ct * (3.5 + p[0] * 6) * p[3] + 1400) % span + span) % span - 1400;
    c.globalAlpha = layer === 0 ? 0.78 : 0.95;
    c.drawImage(sp, x, p[2] - sp.height * sc * 0.5, sp.width * sc, sp.height * sc);
  }
  c.globalAlpha = 1;
}
function cinBirds(c, V, ct) {
  cinSet(c, V, 0.4);
  c.strokeStyle = 'rgba(30,44,70,.7)'; c.lineWidth = 1.6; c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const sp = 22 + i * 3, x = ((i * 410 + ct * sp + 800) % 2600) - 700, y = 120 + (i % 3) * 38 + Math.sin(ct * 0.6 + i) * 10 + i * 6;
    const fl = Math.sin(ct * (7 + i * 0.7) + i * 2) * 0.6, sz = 7 + (i % 2) * 2;
    c.beginPath(); c.moveTo(x - sz, y - 2 - fl * sz * 0.5); c.quadraticCurveTo(x - sz * 0.4, y - sz * 0.55 + fl * 2, x, y); c.quadraticCurveTo(x + sz * 0.4, y - sz * 0.55 + fl * 2, x + sz, y - 2 - fl * sz * 0.5); c.stroke();
  }
}

/* ---------- ridges with textured tree lines ---------- */
function cinRidge(g, x0, x1, base, amp, seed, colA, colB, trees, treeR) {
  const rnd = mulberry32(seed), f1 = 0.004 + rnd() * 0.002, f2 = 0.011 + rnd() * 0.004, p1 = rnd() * 6, p2 = rnd() * 6;
  const yAt = x => base - amp * (0.5 + 0.34 * Math.sin(x * f1 + p1) + 0.2 * Math.sin(x * f2 + p2));
  g.beginPath(); g.moveTo(x0, base + 200);
  for (let x = x0; x <= x1; x += 12) g.lineTo(x, yAt(x));
  g.lineTo(x1, base + 200); g.closePath();
  g.fillStyle = cnLG(g, 0, base - amp, 0, base + 60, [[0, colA], [1, colB]]); g.fill();
  if (!trees) return;
  for (let x = x0; x <= x1; x += 6 + rnd() * 7) {
    const r = treeR * (0.55 + rnd() * 0.7), y = yAt(x) + rnd() * 4;
    const sh = rnd();
    g.fillStyle = cnMix(colA, '#1f4a35', 0.25 + sh * 0.3); g.beginPath(); g.arc(x, y, r, 0, CN_TAU); g.fill();
    g.fillStyle = cnMix(colA, '#d9f0b0', 0.14 + sh * 0.2); g.beginPath(); g.arc(x - r * 0.28, y - r * 0.3, r * 0.58, 0, CN_TAU); g.fill();
  }
  g.fillStyle = cnLG(g, 0, base - amp * 0.2, 0, base + 40, [[0, 'rgba(20,50,40,0)'], [1, 'rgba(20,50,40,.5)']]); g.fillRect(x0, base - amp * 0.2, x1 - x0, 240);
}

/* ---------- buildings ---------- */
function cinBrickFill(g, x, y, w, h, base, seed, mortar) {
  g.fillStyle = base; g.fillRect(x, y, w, h);
  const rnd = mulberry32(seed);
  for (let r = 0, yy = y; yy < y + h; r++, yy += 7) {
    for (let xx = x - (r % 2) * 8; xx < x + w; xx += 16) {
      const t = rnd(), x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + 15);
      if (x1 <= x0) continue;
      g.fillStyle = t < 0.28 ? 'rgba(255,214,176,.10)' : t < 0.6 ? 'rgba(50,16,8,.10)' : 'rgba(0,0,0,0)';
      g.fillRect(x0, yy, x1 - x0, 6);
    }
    g.fillStyle = mortar || 'rgba(235,206,180,.22)'; g.fillRect(x, Math.min(yy + 6, y + h - 1), w, 1);
  }
}
function cinHall(g, x, base, w, h, col, dark, seed, stone) {
  const y = base - h;
  if (stone) { g.fillStyle = col; g.fillRect(x, y, w, h); for (let i = 0; i < h / 10; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)'; g.fillRect(x, y + i * 10, w, 1); } }
  else cinBrickFill(g, x, y, w, h, col, seed);
  // roof + cornice
  g.fillStyle = '#6a6f78'; g.beginPath(); g.moveTo(x - 8, y + 2); g.lineTo(x + 18, y - 22); g.lineTo(x + w - 18, y - 22); g.lineTo(x + w + 8, y + 2); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x - 8, y + 2); g.lineTo(x + 18, y - 22); g.lineTo(x + 44, y - 22); g.lineTo(x + 20, y + 2); g.closePath(); g.fill();
  g.fillStyle = '#e7dfcd'; g.fillRect(x - 4, y, w + 8, 6);
  // windows: tall, white-framed, dark glass with a sky glint
  const rows = h > 110 ? 2 : 1, cols = Math.floor(w / 38);
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const wx = x + 16 + i * ((w - 32) / Math.max(1, cols - 1)) - 9, wy = y + 16 + r * 50;
    g.fillStyle = '#e9e2d0'; g.fillRect(wx - 2, wy - 2, 22, 38);
    g.fillStyle = cnLG(g, wx, wy, wx + 18, wy + 34, [[0, '#a9c7e3'], [0.5, '#4a6585'], [1, '#2b3c58']]); g.fillRect(wx, wy, 18, 34);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(wx, wy + 16); g.lineTo(wx + 9, wy); g.lineTo(wx + 18, wy); g.lineTo(wx + 18, wy + 4); g.lineTo(wx + 4, wy + 34); g.lineTo(wx, wy + 34); g.closePath(); g.fill();
    g.fillStyle = '#e9e2d0'; g.fillRect(wx + 8, wy, 2, 34); g.fillRect(wx, wy + 15, 18, 2);
  }
  // portico columns in the middle
  g.fillStyle = '#efe8d6'; for (let i = 0; i < 4; i++) g.fillRect(x + w / 2 - 36 + i * 22, y + h - 56, 7, 56);
  g.fillStyle = '#dcd3bd'; g.fillRect(x + w / 2 - 44, y + h - 62, 94, 8);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, base - 6, w, 6);
  g.fillStyle = cnLG(g, x, 0, x + w, 0, [[0, 'rgba(255,236,196,.14)'], [0.5, 'rgba(255,236,196,0)'], [1, 'rgba(14,16,40,.28)']]); g.fillRect(x, y - 22, w, h + 22);
}
function cinTower(g, bx, by, s) {
  g.save(); g.translate(bx, by); g.scale(s, s);
  const W = 36, H = 252;
  cinBrickFill(g, -W, -H, W * 2, H, '#a9533f', 77);
  // light and shade across the shaft
  g.fillStyle = cnLG(g, -W, 0, W, 0, [[0, 'rgba(255,230,184,.30)'], [0.42, 'rgba(255,230,184,0)'], [0.75, 'rgba(30,12,40,.18)'], [1, 'rgba(18,10,40,.45)']]); g.fillRect(-W, -H, W * 2, H);
  // stone quoins, bands, plinth
  g.fillStyle = '#e4dcc8'; for (let i = 0; i < 18; i++) { const yy = -H + i * 14; g.fillRect(-W, yy, 10 + (i % 2) * 4, 8); g.fillRect(W - 10 - (i % 2) * 4, yy + 7, 10 + (i % 2) * 4, 8); }
  g.fillStyle = '#e8e0cc'; g.fillRect(-W - 4, -64, W * 2 + 8, 5); g.fillRect(-W - 4, -150, W * 2 + 8, 5); g.fillRect(-W - 5, -6, W * 2 + 10, 6);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-W - 4, -59, W * 2 + 8, 3); g.fillRect(-W - 4, -145, W * 2 + 8, 3);
  // arrow slits
  g.fillStyle = '#1a1520';
  g.fillRect(-3, -112, 6, 24); g.fillRect(-3, -40, 6, 22);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-3, -112, 2, 24);
  // clock face
  const cy = -204;
  g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(0, cy, 25, 0, CN_TAU); g.fill();
  g.fillStyle = cnRG(g, -6, cy - 8, 2, 0, cy, 22, [[0, '#fffdf4'], [1, '#e3dac4']]); g.beginPath(); g.arc(0, cy, 20.5, 0, CN_TAU); g.fill();
  g.strokeStyle = '#2b2530'; g.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(a) * 16.5, cy + Math.sin(a) * 16.5); g.lineTo(Math.cos(a) * 19, cy + Math.sin(a) * 19); g.stroke(); }
  g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, cy); g.lineTo(-8, cy - 5.5); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, cy); g.lineTo(3, cy - 15.5); g.stroke();
  g.fillStyle = '#c9402f'; g.beginPath(); g.arc(0, cy, 1.7, 0, CN_TAU); g.fill();
  // cornice with dentils, belfry, roof
  g.fillStyle = '#e4dcc8'; g.fillRect(-W - 8, -H - 10, W * 2 + 16, 10);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 12; i++) g.fillRect(-W - 5 + i * 7, -H - 2, 3.4, 4);
  const bt = -H - 54;
  g.fillStyle = '#dbd2bc'; g.fillRect(-27, bt, 54, 44);
  g.fillStyle = '#2c2330'; for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-21 + i * 24, bt + 40); g.lineTo(-21 + i * 24, bt + 14); g.arc(-15 + i * 24, bt + 14, 6, Math.PI, 0); g.lineTo(-9 + i * 24, bt + 40); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-27, bt, 3, 44);
  g.fillStyle = 'rgba(14,16,40,.22)'; g.fillRect(12, bt, 15, 44);
  g.fillStyle = '#e4dcc8'; g.fillRect(-31, bt - 6, 62, 7);
  g.fillStyle = '#5f9d88'; g.beginPath(); g.moveTo(-32, bt - 6); g.lineTo(0, bt - 76); g.lineTo(32, bt - 6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,230,.26)'; g.beginPath(); g.moveTo(-32, bt - 6); g.lineTo(0, bt - 76); g.lineTo(-4, bt - 6); g.closePath(); g.fill();
  g.fillStyle = 'rgba(10,30,50,.3)'; g.beginPath(); g.moveTo(32, bt - 6); g.lineTo(0, bt - 76); g.lineTo(6, bt - 6); g.closePath(); g.fill();
  g.strokeStyle = '#2b2a30'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, bt - 76); g.lineTo(0, bt - 100); g.moveTo(-9, bt - 90); g.lineTo(9, bt - 90); g.stroke();
  g.fillStyle = '#f0b429'; g.beginPath(); g.arc(0, bt - 78, 3, 0, CN_TAU); g.fill();
  g.restore();
}
function cinBushes(g, x0, x1, base, seed) {
  const rnd = mulberry32(seed);
  for (let x = x0; x < x1; x += 26 + rnd() * 40) {
    const r = 18 + rnd() * 22, y = base - r * 0.3;
    g.fillStyle = cnMix('#2f6b3f', '#173a2c', rnd() * 0.5); g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(190,235,140,.2)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.7, r * 0.5, 0, Math.PI, 0); g.fill();
  }
  g.fillStyle = 'rgba(8,24,20,.35)'; g.fillRect(x0, base - 3, x1 - x0, 8);
}
function cinOak(g, x, base, s, seed) {
  const rnd = mulberry32(seed);
  g.save(); g.translate(x, base); g.scale(s, s);
  // trunk with a few roots, lit from the left
  g.fillStyle = '#4a3526'; g.beginPath(); g.moveTo(-26, 4); g.quadraticCurveTo(-16, -30, -14, -120); g.lineTo(14, -120); g.quadraticCurveTo(16, -30, 30, 4); g.closePath(); g.fill();
  g.fillStyle = cnLG(g, -20, 0, 20, 0, [[0, 'rgba(255,214,160,.28)'], [0.5, 'rgba(255,214,160,0)'], [1, 'rgba(10,8,30,.4)']]); g.fillRect(-28, -120, 58, 124);
  g.strokeStyle = 'rgba(20,12,8,.35)'; g.lineWidth = 1.4; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-10 + i * 3.4, 0); g.quadraticCurveTo(-8 + i * 3, -60, -9 + i * 3.6, -118); g.stroke(); }
  // canopy: many soft blobs, dark inside, bright rim upper-left
  const blobs = [];
  for (let i = 0; i < 46; i++) { const a = rnd() * CN_TAU, d = Math.sqrt(rnd()); blobs.push([Math.cos(a) * d * 150, -210 + Math.sin(a) * d * 96, 34 + rnd() * 34]); }
  blobs.sort((p, q) => p[1] - q[1]);
  blobs.forEach(b => {
    g.fillStyle = cnRG(g, b[0] - b[2] * 0.25, b[1] - b[2] * 0.3, b[2] * 0.1, b[0], b[1], b[2], [[0, cnMix('#5f9f4a', '#2a5a38', clamp((b[1] + 120) / 110, 0, 1) * 0.55)], [0.65, cnMix('#2f6b3f', '#173a2c', clamp((b[1] + 120) / 110, 0, 1) * 0.5)], [1, 'rgba(23,58,44,.0)']]);
    g.beginPath(); g.arc(b[0], b[1], b[2], 0, CN_TAU); g.fill();
  });
  for (let i = 0; i < 160; i++) { const a = rnd() * CN_TAU, d = Math.sqrt(rnd()), px = Math.cos(a) * d * 160, py = -210 + Math.sin(a) * d * 100; g.fillStyle = (px < 0 && py < -200) ? 'rgba(220,245,150,.35)' : 'rgba(10,40,30,.22)'; g.beginPath(); g.arc(px, py, 2 + rnd() * 3, 0, CN_TAU); g.fill(); }
  g.restore();
}
function cinLamp(g, x, base, h) {
  g.save(); g.translate(x, base);
  const dark = '#1b2630';
  g.fillStyle = dark; g.fillRect(-9, -14, 18, 14); g.fillRect(-6, -26, 12, 12); g.fillRect(-3.4, -h, 6.8, h - 20);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-3.4, -h, 1.8, h - 20); g.fillRect(-9, -14, 2, 14);
  g.fillRect(-7, -h + 28, 14, 3);
  g.strokeStyle = dark; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -h + 32); g.quadraticCurveTo(-18, -h + 30, -20, -h + 10); g.moveTo(0, -h + 32); g.quadraticCurveTo(18, -h + 30, 20, -h + 10); g.stroke();
  [-20, 20].forEach(dx => {
    g.fillStyle = dark; g.fillRect(dx - 6, -h + 8, 12, 3);
    g.fillStyle = cnRG(g, dx - 2, -h - 4, 1, dx, -h, 11, [[0, '#fffbe6'], [1, '#f1deae']]); g.beginPath(); g.arc(dx, -h, 9, 0, CN_TAU); g.fill();
    g.fillStyle = dark; g.beginPath(); g.moveTo(dx - 9, -h - 4); g.lineTo(dx, -h - 15); g.lineTo(dx + 9, -h - 4); g.closePath(); g.fill();
  });
  g.fillStyle = dark; g.beginPath(); g.arc(0, -h - 2, 4, 0, CN_TAU); g.fill();
  g.restore();
}
