/* ============================ dream painters ============================
   One painter per motif. Each lays down a cached backdrop (gradients, stars, skylines: painted once per size) and animates a few layers on top.
   Good dreams are luminous and soft; bad ones are cold, tilted and a little wrong. All painters work in css pixels (the canvas is scaled by DR.dpr). */
const dsLayer = (name, w, h, paint) => AK.layer('dr|' + name, w, h, DR.dpr, paint);
function dsCloudSprite(kind) {
  return AK.layer('dr|cl' + kind, 240, 110, 2, g => {
    const cols = kind === 0 ? ['#ffd0c4', '#e89ab8', '#a874b8'] : kind === 1 ? ['#fff0e4', '#ffc8b8', '#e8a0b0'] : ['#ffffff', '#ffe8d8', '#f4b8b8'];
    for (let k = 0; k < 11; k++) {
      const x = 22 + k * 19 + (hash01(k, kind, 1) - 0.5) * 8, r = 16 + hash01(k, kind, 2) * 20 * (1 - Math.abs(k - 5) / 7), y = 78 - r * 0.7 - hash01(k, kind, 3) * 8;
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.5, r * 0.1, x, y, r); gr.addColorStop(0, cols[0]); gr.addColorStop(0.6, cols[1]); gr.addColorStop(1, cols[2]);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = SK.lin(g, 0, 70, 0, 110, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]); g.fillRect(0, 70, 240, 40);
  });
}
function dsClouds(c, t, w, h) {
  const u = Math.min(w, h) / 100, hz = h * 0.8;
  c.drawImage(dsLayer('clouds', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#15124a'], [0.34, '#43358a'], [0.58, '#b45f8a'], [0.74, '#ff9a78'], [0.8, '#ffd49a'], [0.8001, '#2a1f5e'], [1, '#0a0724']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.2 + hash01(i, 3, 3) * 0.6).toFixed(2) + ')'; g.fillRect(hash01(i, 1, 1) * W, hash01(i, 2, 1) * H * 0.55, 1.2, 1.2); }
    AK.light(g, W * 0.68, H * 0.8, W * 0.6, '#ff9a70', 0.7); AK.light(g, W * 0.68, H * 0.8, W * 0.22, '#fff0c0', 0.9);
    g.save(); g.beginPath(); g.rect(0, 0, W, H * 0.8); g.clip(); g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(W * 0.68, H * 0.8, 7.5 * (Math.min(W, H) / 100), 0, 7); g.fill(); g.restore();
    // the town seen from above, lights spreading out in the dusk
    for (let i = 0; i < 700; i++) {
      const k = Math.pow(hash01(i, 5, 5), 1.5), y = H * 0.8 + k * H * 0.2, x = hash01(i, 6, 6) * W, s2 = 1 + k * 3.4;
      const warm = hash01(i, 7, 7) > 0.2; g.fillStyle = warm ? 'rgba(255,200,120,' + (0.4 + k * 0.5).toFixed(2) + ')' : 'rgba(180,210,255,' + (0.3 + k * 0.4).toFixed(2) + ')'; g.fillRect(x, y, s2, s2 * 0.8);
      if (i % 9 === 0) AK.light(g, x, y, s2 * 5, warm ? '#ffc878' : '#aad0ff', 0.45);
    }
    g.strokeStyle = 'rgba(255,190,120,.16)'; g.lineWidth = 1; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, H * (0.82 + i * 0.022)); g.lineTo(W, H * (0.82 + i * 0.022 + (hash01(i, 8, 8) - 0.5) * 0.02)); g.stroke(); }
  }), 0, 0, w, h);
  // god rays from the low sun
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i * 0.22 + Math.sin(t * 0.1 + i) * 0.04, x0 = w * 0.68, y0 = hz; c.fillStyle = 'rgba(255,200,150,' + (0.05 + 0.03 * Math.sin(t * 0.7 + i * 1.7)).toFixed(3) + ')'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a - 0.05) * w * 1.2, y0 + Math.sin(a - 0.05) * w * 1.2); c.lineTo(x0 + Math.cos(a + 0.05) * w * 1.2, y0 + Math.sin(a + 0.05) * w * 1.2); c.closePath(); c.fill(); }
  c.restore();
  // three banks of cloud drifting at different speeds, lit warm from the sun side
  for (let layer = 0; layer < 3; layer++) {
    const sp = dsCloudSprite(layer);
    for (let i = 0; i < 4; i++) {
      const x = (((i * 0.31 + hash01(i, layer, 2)) + t * (0.006 + layer * 0.01) + 10) % 1.4 - 0.3) * w, y = hz - (0.02 + layer * 0.07) * h - hash01(i, layer, 5) * h * 0.08 + Math.sin(t * 0.3 + i + layer) * 3, cw = u * (16 + layer * 13) * (0.8 + hash01(i, layer, 6) * 0.5);
      c.globalAlpha = 0.55 + layer * 0.2; c.drawImage(sp, x - cw / 2, y - cw * 0.46, cw, cw * 110 / 240);
    }
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const k = (t * 0.03 + i * 0.2) % 1, bx = w * (1.1 - k * 1.3), by = h * (0.3 + i * 0.05) + Math.sin(t * 0.8 + i) * 6, fl = Math.sin(t * 7 + i * 2) * 3; c.strokeStyle = 'rgba(40,20,60,.55)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx - 7, by - fl); c.quadraticCurveTo(bx - 3, by - 3, bx, by); c.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - fl); c.stroke(); }
}
function dsPlate(c, x, y, r, col, rim) {
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x + r * 0.06, y + r * 0.22, r * 1.05, r * 0.3, 0, 0, 7); c.fill();
  c.fillStyle = rim; c.beginPath(); c.ellipse(x, y, r, r * 0.3, 0, 0, 7); c.fill();
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y - r * 0.02, r * 0.78, r * 0.22, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, r * 0.98, r * 0.29, 0, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
}
function dsFood(c, kind, x, y, r, t) {
  if (kind === 0) { for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? '#d9954a' : '#e8ad62'; c.beginPath(); c.ellipse(x, y - r * 0.08 - i * r * 0.11, r * 0.5, r * 0.15, 0, 0, 7); c.fill(); } c.fillStyle = '#ffe9a0'; rr(c, x - r * 0.1, y - r * 0.46, r * 0.2, r * 0.1, 2); c.fill(); c.fillStyle = 'rgba(140,70,20,.75)'; c.beginPath(); c.ellipse(x, y - r * 0.4, r * 0.4, r * 0.1, 0, 0, 7); c.fill(); }
  else if (kind === 1) { c.fillStyle = '#c9884a'; c.beginPath(); c.moveTo(x - r * 0.4, y - r * 0.02); c.lineTo(x + r * 0.4, y - r * 0.1); c.lineTo(x + r * 0.28, y - r * 0.38); c.closePath(); c.fill(); c.fillStyle = '#7a3a2a'; c.beginPath(); c.moveTo(x - r * 0.38, y - r * 0.06); c.lineTo(x + r * 0.36, y - r * 0.14); c.lineTo(x + r * 0.28, y - r * 0.32); c.closePath(); c.fill(); c.fillStyle = '#fff6e8'; c.beginPath(); c.ellipse(x + r * 0.2, y - r * 0.4, r * 0.12, r * 0.08, 0, 0, 7); c.fill(); }
  else if (kind === 2) { c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, x - r * 0.18, y - r * 0.7, r * 0.36, r * 0.64, r * 0.06); c.fill(); c.fillStyle = '#ff9ec8'; c.fillRect(x - r * 0.16, y - r * 0.46, r * 0.32, r * 0.4); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - r * 0.72, r * 0.2, 0, 7); c.fill(); c.fillStyle = '#d63a42'; c.beginPath(); c.arc(x + r * 0.05, y - r * 0.9, r * 0.07, 0, 7); c.fill(); }
  else { [['#d63a42', -0.26, -0.1], ['#8ac926', 0.04, -0.14], ['#ff9a3d', 0.28, -0.06]].forEach(f => { c.fillStyle = f[0]; c.beginPath(); c.arc(x + f[1] * r, y + f[2] * r, r * 0.17, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x + f[1] * r - r * 0.05, y + f[2] * r - r * 0.06, r * 0.04, 0, 7); c.fill(); }); }
  if (kind < 2) SK.steam(c, x, y - r * 0.4, t + x * 0.01, r / 38, 'rgba(255,240,220,1)', 2);
}
function dsPlates(c, t, w, h, mood) {
  const bad = mood === 'bad', u = Math.min(w, h) / 100;
  c.drawImage(dsLayer('plates|' + mood, w, h, (g, W, H) => {
    const U = Math.min(W, H) / 100;
    g.fillStyle = bad ? SK.lin(g, 0, 0, 0, H, [[0, '#06080e'], [0.5, '#141c28'], [1, '#05070b']]) : SK.lin(g, 0, 0, 0, H, [[0, '#2a1208'], [0.5, '#6a3a1c'], [1, '#2a1409']]); g.fillRect(0, 0, W, H);
    if (bad) { for (let i = 0; i < 6; i++) { const x = W * (0.08 + i * 0.17); g.fillStyle = SK.lin(g, 0, H * 0.1, 0, H * 0.55, [[0, 'rgba(150,190,255,.0)'], [0.5, 'rgba(150,190,255,.14)'], [1, 'rgba(150,190,255,0)']]); g.fillRect(x, H * 0.1, W * 0.07, H * 0.45); } }
    else { for (let i = 0; i < 26; i++) AK.light(g, W * hash01(i, 1, 1), H * (0.05 + hash01(i, 2, 1) * 0.45), U * (3 + hash01(i, 3, 1) * 8), ['#ffd9a0', '#ffb070', '#ffe9c8'][i % 3], 0.38); }
    // the long table running away, with its edge catching the light
    g.fillStyle = bad ? SK.lin(g, 0, H * 0.56, 0, H, [[0, '#26303e'], [1, '#080b10']]) : SK.lin(g, 0, H * 0.56, 0, H, [[0, '#8a5530'], [1, '#2e180c']]); g.fillRect(0, H * 0.56, W, H * 0.44);
    g.strokeStyle = bad ? 'rgba(160,200,255,.1)' : 'rgba(255,220,170,.12)'; g.lineWidth = 1; for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W / 2 + i * W * 0.012, H * 0.56); g.lineTo(W / 2 + i * W * 0.1, H); g.stroke(); }
    g.fillStyle = bad ? 'rgba(170,210,255,.2)' : 'rgba(255,230,180,.3)'; g.fillRect(0, H * 0.56, W, 2);
    if (!bad) AK.light(g, W / 2, H * 0.62, W * 0.6, '#ffc080', 0.3);
  }), 0, 0, w, h);
  // a pendant lamp: steady and warm for a feast, swinging and failing for an empty table
  const sw = bad ? Math.sin(t * 0.9) * 0.14 : Math.sin(t * 0.3) * 0.02, lx = w * 0.5 + Math.sin(sw) * h * 0.4, ly = h * 0.4;
  const flick = bad ? (Math.sin(t * 13) * Math.sin(t * 5.1) > 0.35 ? 0.35 : 1) : 1;
  c.strokeStyle = bad ? '#10151c' : '#1c1008'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w * 0.5, 0); c.lineTo(lx, ly - 12 * u * 0.6); c.stroke();
  c.fillStyle = bad ? '#2a3442' : '#c0834a'; c.beginPath(); c.moveTo(lx - 7 * u, ly); c.lineTo(lx - 2.5 * u, ly - 8 * u); c.lineTo(lx + 2.5 * u, ly - 8 * u); c.lineTo(lx + 7 * u, ly); c.closePath(); c.fill();
  SK.shaft(c, lx, ly, 10 * u, w * 0.5, h * 0.95, w * 0.5, bad ? '#a8c8ff' : '#ffd9a0', 0.22 * flick);
  AK.light(c, lx, ly + 2 * u, 22 * u, bad ? '#a8c8ff' : '#ffd9a0', 0.55 * flick);
  // plates in three rows, each a little smaller and higher than the last
  for (let row = 2; row >= 0; row--) {
    const n = 6 + (row % 2), py = h * (0.66 + row * 0.1), r = u * (4.2 + row * 1.8);
    for (let i = 0; i < n; i++) {
      const base = (i + 0.5) / n * w + (row % 2 ? 0 : w / n * 0.0);
      const bob = Math.sin(t * 1.1 + i + row) * (bad ? 4 : 2.5), drift = bad ? Math.sin(t * 0.4 + i * 1.7 + row) * u * 6 + (i - n / 2) * Math.sin(t * 0.2) * u * 2 : 0;
      const al = bad ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 0.8 + i * 1.3 + row * 0.7) * 0.5 + 0.7) : 1;
      c.globalAlpha = Math.min(1, al);
      dsPlate(c, base + drift, py + bob, r, bad ? '#8f9aa8' : '#fff7ea', bad ? '#aab4c2' : '#fffdf6');
      if (!bad) dsFood(c, (i + row) % 4, base, py + bob, r, t);
    }
  }
  c.globalAlpha = 1;
}
function dsConfetti(c, t, w, h) {
  const u = Math.min(w, h) / 100;
  c.drawImage(dsLayer('confetti', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#0e0c34'], [0.5, '#2a1c5a'], [1, '#150f34']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) AK.light(g, W * hash01(i, 1, 1), H * (0.05 + hash01(i, 2, 1) * 0.6), (Math.min(W, H) / 100) * (3 + hash01(i, 3, 1) * 8), ['#ffd778', '#ff8fb8', '#8fd0ff'][i % 3], 0.3);
    g.fillStyle = '#5e1030'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H * 0.07); for (let i = 0; i < 10; i++) { const x1 = W - W * i / 10, x2 = W - W * (i + 1) / 10; g.quadraticCurveTo((x1 + x2) / 2, H * 0.14, x2, H * 0.07); } g.closePath(); g.fill();
    g.strokeStyle = '#d4a017'; g.lineWidth = 2; g.beginPath(); g.moveTo(W, H * 0.07); for (let i = 0; i < 10; i++) { const x1 = W - W * i / 10, x2 = W - W * (i + 1) / 10; g.quadraticCurveTo((x1 + x2) / 2, H * 0.14, x2, H * 0.07); } g.stroke();
    g.fillStyle = SK.lin(g, 0, H * 0.7, 0, H, [[0, '#2a1c3a'], [1, '#0a0614']]); g.fillRect(0, H * 0.74, W, H * 0.26);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) { const x = (i + 0.5 + r * 0.4) * W / 17, y = H * (0.84 + r * 0.07), hr = (Math.min(W, H) / 100) * (2.4 + r * 0.9); g.fillStyle = r === 0 ? '#120b26' : r === 1 ? '#0c071b' : '#06030f'; g.beginPath(); g.arc(x, y, hr, 0, 7); g.fill(); g.fillRect(x - hr * 1.3, y + hr * 0.6, hr * 2.6, H); }
  }), 0, 0, w, h);
  const cols = ['#ffd778', '#ff8fb8', '#8fd0ff'];
  for (let i = 0; i < 3; i++) { const x0 = w * (0.2 + i * 0.3), tx = w * 0.5 + Math.sin(t * 0.6 + i * 2.1) * w * 0.28; SK.shaft(c, x0, 0, w * 0.01, tx, h * 0.82, w * 0.18, cols[i], 0.22); }
  // arms in the crowd
  for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) { const x = (i + 0.5 + r * 0.4) * w / 17, y = h * (0.84 + r * 0.07) - u * (2.4 + r * 0.9) * 0.4, a = Math.sin(t * 3.2 + i * 1.3 + r) * 0.4; c.strokeStyle = r ? '#0c071b' : '#120b26'; c.lineWidth = u * 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - u * 2, y); c.lineTo(x - u * (3 + a), y - u * (7 + Math.sin(t * 3 + i) * 2)); c.moveTo(x + u * 2, y); c.lineTo(x + u * (3 - a), y - u * (7 + Math.cos(t * 3 + i) * 2)); c.stroke(); }
  c.lineCap = 'butt';
  // caps flung in the air, ribbons and glitter
  for (let i = 0; i < 14; i++) {
    const k = (t * 0.17 + i / 14) % 1, x = w * (0.08 + hash01(i, 1, 2) * 0.84) + Math.sin(k * 6 + i) * u * 3, y = h * (0.82 - Math.sin(k * Math.PI) * (0.55 + hash01(i, 2, 2) * 0.25)), rot = k * 9 + i, fl = Math.abs(Math.cos(rot * 0.7));
    c.save(); c.translate(x, y); c.rotate(Math.sin(rot) * 0.6); c.scale(1, 0.4 + 0.6 * fl); c.fillStyle = '#16122e'; c.beginPath(); c.moveTo(0, -u * 2.4); c.lineTo(u * 4.2, 0); c.lineTo(0, u * 2.4); c.lineTo(-u * 4.2, 0); c.closePath(); c.fill(); c.fillStyle = '#2a2450'; c.fillRect(-u * 1.8, u * 0.4, u * 3.6, u * 1.4); c.strokeStyle = '#ffc247'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(u * 3, u * 1.2, u * 3.6, u * 3.4); c.stroke(); c.fillStyle = '#ffc247'; c.beginPath(); c.arc(0, 0, 1.2, 0, 7); c.fill(); c.restore();
  }
  for (let i = 0; i < 54; i++) {
    const k = (t * (0.05 + hash01(i, 3, 3) * 0.05) + hash01(i, 1, 1)) % 1.1 - 0.05, x = hash01(i, 2, 2) * w + Math.sin(t * 1.6 + i) * u * 3, y = k * h, ang = t * 2.2 + i, fl = Math.abs(Math.cos(ang));
    c.save(); c.translate(x, y); c.rotate(ang * 0.4); c.globalAlpha = 0.85; c.fillStyle = ['#ffc247', '#ff6b9a', '#5bd39b', '#47b8ff', '#ffffff', '#c77dff'][i % 6];
    if (i % 4 === 0) { c.strokeStyle = c.fillStyle; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-u * 2, 0); c.quadraticCurveTo(0, u * 2 * Math.sin(ang * 2), u * 2, 0); c.stroke(); } else c.fillRect(-u * 0.9, -u * 0.45 * fl, u * 1.8, u * 0.9 * fl + 0.6);
    c.restore();
  }
  c.globalAlpha = 1;
}
function dsSun(c, t, w, h) {
  const u = Math.min(w, h) / 100, sx = w * 0.72, sy = h * 0.28;
  c.drawImage(dsLayer('sun', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#4fa3de'], [0.3, '#9ad0e8'], [0.52, '#ffe2a8'], [0.62, '#ffc47a'], [1, '#ffb070']]); g.fillRect(0, 0, W, H);
    const layers = [['#d8b0b8', 0.5, 0.05, 1], ['#b8a8a8', 0.56, 0.06, 2], ['#8fb078', 0.62, 0.07, 3], ['#5f9a4a', 0.7, 0.08, 4], ['#3f7a38', 0.8, 0.1, 5]];
    layers.forEach(L => { g.fillStyle = L[0]; g.beginPath(); g.moveTo(0, H); for (let i = 0; i <= 32; i++) g.lineTo(W * i / 32, H * L[1] - H * L[2] * (0.5 + 0.5 * Math.sin(i * 0.45 + L[3] * 1.7)) - H * L[2] * 0.5 * Math.sin(i * 1.1 + L[3])); g.lineTo(W, H); g.closePath(); g.fill(); g.fillStyle = SK.lin(g, 0, H * L[1] - H * L[2] * 1.2, 0, H * L[1] + H * 0.1, [[0, 'rgba(255,230,190,.35)'], [1, 'rgba(255,230,190,0)']]); g.fill(); });
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * 0.5, H * 0.66); g.bezierCurveTo(W * 0.4, H * 0.74, W * 0.62, H * 0.8, W * 0.46, H * 0.95); g.stroke(); g.lineCap = 'butt';
    for (let i = 0; i < 60; i++) { const x = hash01(i, 1, 1) * W, y = H * (0.6 + hash01(i, 2, 1) * 0.3), s2 = 2 + (y / H - 0.6) * 22; g.fillStyle = 'rgba(60,110,50,.5)'; g.beginPath(); g.arc(x, y, s2 * 0.7, 0, 7); g.fill(); g.fillStyle = 'rgba(200,240,140,.3)'; g.beginPath(); g.arc(x - s2 * 0.25, y - s2 * 0.25, s2 * 0.35, 0, 7); g.fill(); }
  }), 0, 0, w, h);
  AK.light(c, sx, sy, 46 * u, '#fff0c0', 0.55); AK.light(c, sx, sy, 16 * u, '#ffffff', 0.7);
  c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(sx, sy, 6.5 * u, 0, 7); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const a = t * 0.07 + i * 0.5236; c.fillStyle = 'rgba(255,236,170,' + (0.06 + 0.04 * Math.sin(t * 0.8 + i * 1.3)).toFixed(3) + ')'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a - 0.07) * w, sy + Math.sin(a - 0.07) * w); c.lineTo(sx + Math.cos(a + 0.07) * w, sy + Math.sin(a + 0.07) * w); c.closePath(); c.fill(); }
  [[0.3, 2.4, 0.12, '#9fd8ff'], [0.52, 4, 0.08, '#ffe08a'], [0.74, 1.8, 0.14, '#ffb0d0'], [0.92, 5.5, 0.05, '#ffffff']].forEach(f => { const fx = sx + (w * 0.4 - sx) * f[0] * 1.3, fy = sy + (h * 0.8 - sy) * f[0] * 1.3; c.fillStyle = AK.rgba(f[3], f[2]); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.lineTo(fx + Math.cos(a) * f[1] * u, fy + Math.sin(a) * f[1] * u); } c.closePath(); c.fill(); });
  c.restore();
  for (let i = 0; i < 3; i++) { const k = (t * 0.015 + i * 0.37) % 1.3 - 0.15; fvCloud(c, k * w, h * (0.12 + i * 0.07), u * 0.2 * (0.8 + i * 0.25), 0.7, 'rgba(255,255,255,1)'); }
  // butterflies tracing slow loops
  for (let i = 0; i < 2; i++) { const bx = w * (0.3 + i * 0.3) + Math.sin(t * 0.6 + i * 3) * w * 0.1, by = h * (0.62 + i * 0.08) + Math.sin(t * 1.2 + i) * h * 0.04, fl = Math.abs(Math.sin(t * 9 + i)); c.fillStyle = i ? '#ff9ec8' : '#ffd24a'; c.beginPath(); c.ellipse(bx - 3 * u * fl, by, 2.6 * u * (0.3 + fl), 1.9 * u, -0.4, 0, 7); c.ellipse(bx + 3 * u * fl, by, 2.6 * u * (0.3 + fl), 1.9 * u, 0.4, 0, 7); c.fill(); c.fillStyle = '#3a2a20'; c.fillRect(bx - 0.5, by - 2, 1, 4); }
}
function dsWater(c, t, w, h, mood) {
  const bad = mood === 'bad', u = Math.min(w, h) / 100;
  if (bad) return dsDry(c, t, w, h);
  const hz = h * 0.46;
  c.drawImage(dsLayer('water', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H * 0.46, [[0, '#262a66'], [0.5, '#8a5a9a'], [1, '#ffb090']]); g.fillRect(0, 0, W, H * 0.46);
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.2 + hash01(i, 3, 3) * 0.5).toFixed(2) + ')'; g.fillRect(hash01(i, 1, 1) * W, hash01(i, 2, 1) * H * 0.3, 1.2, 1.2); }
    AK.light(g, W * 0.5, H * 0.46, W * 0.5, '#ffb890', 0.7);
    g.fillStyle = '#10142e'; g.beginPath(); g.moveTo(0, H * 0.46); for (let i = 0; i <= 40; i++) g.lineTo(W * i / 40, H * 0.46 - (4 + hash01(i, 5, 5) * 18 + (Math.sin(i * 0.5) + 1) * 8) * (H / 480)); g.lineTo(W, H * 0.46); g.closePath(); g.fill();
    g.fillStyle = SK.lin(g, 0, H * 0.46, 0, H, [[0, '#a8607a'], [0.2, '#4a4a8a'], [1, '#0a1230']]); g.fillRect(0, H * 0.46, W, H * 0.54);
  }), 0, 0, w, h);
  // the sky's colour glittering in a path below the horizon, and rings spreading from a few points
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 34; i++) { const k = i / 33, yy = hz + 4 + k * h * 0.5, ww = (8 + k * 70) * (u / 4) * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.9)); c.fillStyle = 'rgba(255,190,150,' + (0.4 * (1 - k * 0.6) * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.6 + i * 3.1)))).toFixed(3) + ')'; c.fillRect(w * 0.5 + Math.sin(t * 0.7 + i) * (3 + k * 30) - ww / 2, yy, ww, 1.6 + k * 1.6); }
  c.restore();
  for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) { const k = (t * 0.2 + i / 3 + r * 0.31) % 1, cx = w * (0.25 + r * 0.2), cy = h * (0.62 + (r % 2) * 0.14); c.strokeStyle = 'rgba(190,220,255,' + (0.4 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy, k * 14 * u, k * 14 * u * 0.26, 0, 0, 7); c.stroke(); }
  // lily pads with blossoms
  [[0.2, 0.7], [0.55, 0.78], [0.8, 0.66], [0.38, 0.88], [0.7, 0.9]].forEach((p, i) => { const lx = w * p[0] + Math.sin(t * 0.4 + i) * 3, ly = h * p[1] + Math.sin(t * 0.9 + i * 2) * 1.5, lr = u * (4 + p[1] * 3); c.fillStyle = 'rgba(6,20,40,.35)'; c.beginPath(); c.ellipse(lx + 2, ly + 3, lr, lr * 0.34, 0, 0, 7); c.fill(); c.fillStyle = '#3f9a6a'; c.beginPath(); c.moveTo(lx, ly); c.ellipse(lx, ly, lr, lr * 0.34, 0, 0.4, 6.0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(lx - lr * 0.3, ly - lr * 0.06, lr * 0.4, lr * 0.08, 0, 0, 7); c.fill(); if (i % 2 === 0) { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#ffd0e4' : '#ffa8cc'; c.beginPath(); c.ellipse(lx + Math.cos(k) * lr * 0.2, ly - lr * 0.28 + Math.sin(k) * lr * 0.08, lr * 0.2, lr * 0.09, k, 0, 7); c.fill(); } c.fillStyle = '#ffe58a'; c.beginPath(); c.arc(lx, ly - lr * 0.27, lr * 0.08, 0, 7); c.fill(); } });
  // two ducks crossing, with wakes
  for (let i = 0; i < 2; i++) { const k = (t * (0.02 + i * 0.008) + i * 0.5) % 1.3 - 0.15, dx = w * (i ? 1.1 - k * 1.2 : k), dy = h * (0.58 + i * 0.1), dir = i ? -1 : 1, s = u * 0.42; c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(dx - dir * 6 * s, dy + 5 * s); c.lineTo(dx - dir * 36 * s, dy + 9 * s); c.moveTo(dx - dir * 6 * s, dy + 5 * s); c.lineTo(dx - dir * 36 * s, dy + 1 * s); c.stroke(); c.fillStyle = '#1a1830'; c.beginPath(); c.ellipse(dx, dy + 3 * s + Math.sin(t * 3 + i) * 0.6, 8 * s, 4.2 * s, 0, 0, 7); c.fill(); c.beginPath(); c.arc(dx + dir * 7 * s, dy - 3 * s, 3.2 * s, 0, 7); c.fill(); c.fillStyle = '#d98a2a'; c.beginPath(); c.moveTo(dx + dir * 9.5 * s, dy - 3.4 * s); c.lineTo(dx + dir * 13.5 * s, dy - 2.4 * s); c.lineTo(dx + dir * 9.5 * s, dy - 1.4 * s); c.closePath(); c.fill(); }
  // mist and fireflies
  for (let i = 0; i < 4; i++) { const mx = ((t * 0.01 * (i % 2 ? 1 : -1) + hash01(i, 1, 1) + 10) % 1.4 - 0.2) * w; c.globalAlpha = 0.1; c.drawImage(AK.glow('#ffd0e0'), mx - w * 0.3, h * (0.5 + i * 0.08) - h * 0.05, w * 0.6, h * 0.1); }
  c.globalAlpha = 1;
  for (let i = 0; i < 22; i++) { const x = w * hash01(i, 5, 1) + Math.sin(t * 0.5 + i * 2) * 14, y = h * (0.3 + hash01(i, 6, 1) * 0.55) + Math.cos(t * 0.6 + i) * 10, a = Math.max(0, Math.sin(t * 1.3 + i * 1.7)); AK.light(c, x, y, u * 3.4, '#e8ff9a', a * 0.9); }
  c.strokeStyle = '#10142e'; c.lineWidth = 2.4; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const x = i < 8 ? w * 0.01 + i * w * 0.012 : w * 0.99 - (i - 8) * w * 0.012, sw = Math.sin(t * 1.3 + i) * 4; c.beginPath(); c.moveTo(x, h + 2); c.quadraticCurveTo(x + sw * 0.4, h * 0.88, x + sw, h * (0.78 - (i % 4) * 0.025)); c.stroke(); }
  c.lineCap = 'butt';
}
function dsDry(c, t, w, h) {
  const u = Math.min(w, h) / 100;
  c.drawImage(dsLayer('dry', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H * 0.4, [[0, '#8a4a30'], [1, '#e8b080']]); g.fillRect(0, 0, W, H * 0.4);
    g.fillStyle = SK.lin(g, 0, H * 0.4, 0, H, [[0, '#9a5a34'], [0.4, '#6a3a22'], [1, '#2a140c']]); g.fillRect(0, H * 0.4, W, H * 0.6);
    for (let i = 0; i < 28; i++) { g.fillStyle = 'rgba(' + (hash01(i, 9, 9) > 0.5 ? '40,16,8' : '255,200,150') + ',.07)'; g.beginPath(); g.ellipse(W * hash01(i, 1, 1), H * (0.45 + hash01(i, 2, 1) * 0.5), W * 0.08, H * 0.03, 0, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,6,2,.8)'; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { let x = W * hash01(i, 3, 3), y = H * (0.42 + hash01(i, 4, 3) * 0.58); const k = (y / H - 0.4) / 0.6; g.lineWidth = 1 + k * 3.4; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (hash01(i, s, 5) - 0.5) * (30 + k * 80); y += (hash01(i, s, 6) - 0.3) * (14 + k * 40); g.lineTo(x, y); } g.stroke(); }
    g.lineCap = 'butt';
    g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(W * 0.78, H * 0.18, Math.min(W, H) * 0.05, 0, 7); g.fill(); AK.light(g, W * 0.78, H * 0.18, W * 0.3, '#ffd8a0', 0.7);
  }), 0, 0, w, h);
  // a puddle that shrinks away and comes back, and cracks glowing red in the dark
  const pk = 0.5 + 0.5 * Math.sin(t * 0.35), pr = u * (3 + pk * 11);
  c.fillStyle = 'rgba(30,60,90,.7)'; c.beginPath(); c.ellipse(w * 0.5, h * 0.78, pr * 2.4, pr * 0.62, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(160,210,255,.35)'; c.beginPath(); c.ellipse(w * 0.5 - pr * 0.4, h * 0.775, pr * 1.2, pr * 0.2, 0, 0, 7); c.fill();
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,100,50,' + (0.12 + 0.08 * Math.sin(t * 2)).toFixed(3) + ')'; c.lineWidth = 2; for (let i = 0; i < 14; i++) { let x = w * hash01(i, 13, 3), y = h * (0.5 + hash01(i, 14, 3) * 0.45); c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (hash01(i, s, 15) - 0.5) * 80; y += (hash01(i, s, 16) - 0.3) * 30; c.lineTo(x, y); } c.stroke(); } c.restore();
  // mirage: wavering streaks along the horizon
  for (let i = 0; i < 9; i++) { const y = h * 0.4 + i * u * 0.7, off = Math.sin(t * 1.4 + i * 0.9) * u * 3; c.fillStyle = 'rgba(255,230,190,' + (0.1 - i * 0.008).toFixed(3) + ')'; c.fillRect(off, y, w, 1.6); }
  for (let i = 0; i < 30; i++) { const x = ((hash01(i, 1, 1) + t * (0.03 + hash01(i, 2, 1) * 0.04)) % 1) * w, y = h * (0.45 + hash01(i, 3, 1) * 0.5) + Math.sin(t + i) * 6; c.fillStyle = 'rgba(210,150,100,' + (0.15 + hash01(i, 4, 1) * 0.25).toFixed(2) + ')'; c.beginPath(); c.arc(x, y, 1 + hash01(i, 5, 1) * 2.4, 0, 7); c.fill(); }
}
function dsClock(c, t, w, h, mood) {
  const bad = mood === 'bad', u = Math.min(w, h) / 100, cx = w * 0.5, cy = h * 0.5, R = 30 * u, sp = bad ? 2.6 : 0.5;
  c.drawImage(dsLayer('clock|' + mood, w, h, (g, W, H) => {
    g.fillStyle = SK.rad(g, W / 2, H / 2, 0, Math.max(W, H) * 0.7, bad ? [[0, '#3a0a16'], [0.6, '#12040a'], [1, '#050206']] : [[0, '#2a3a6a'], [1, '#0a1020']]); g.fillRect(0, 0, W, H);
  }), 0, 0, w, h);
  // gears turning behind the face, in opposite directions
  [[-1.1, -0.55, 18, 14, 0.4], [1.2, 0.5, 26, 18, -0.3], [0.5, -0.9, 12, 10, 0.7], [-0.7, 0.8, 15, 12, -0.5]].forEach((G, gi) => {
    const gx = cx + G[0] * R * 1.3, gy = cy + G[1] * R * 1.2, gr = G[2] * u * 0.9, a0 = t * G[4] * (bad ? 2.4 : 0.5);
    c.save(); c.translate(gx, gy); c.rotate(a0); c.fillStyle = bad ? 'rgba(90,18,34,.55)' : 'rgba(80,110,180,.35)'; c.beginPath();
    for (let i = 0; i < G[3] * 2; i++) { const a = i / (G[3] * 2) * 6.283, rr2 = i % 2 ? gr * 0.82 : gr; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath(); c.fill();
    c.fillStyle = bad ? '#12040a' : '#0a1020'; c.beginPath(); c.arc(0, 0, gr * 0.34, 0, 7); c.fill(); c.restore();
  });
  // pulses leaving the face
  for (let i = 0; i < 3; i++) { const k = (t * (bad ? 0.8 : 0.25) + i / 3) % 1; c.strokeStyle = (bad ? 'rgba(255,90,90,' : 'rgba(170,200,255,') + (0.35 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R * (1 + k * 1.2), 0, 7); c.stroke(); }
  const fg = SK.rad(c, cx, cy, R * 0.2, R, bad ? [[0, '#2a0a12'], [1, '#12040a']] : [[0, '#1c2a52'], [1, '#0c1430']]); c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.strokeStyle = bad ? 'rgba(255,120,120,.5)' : 'rgba(255,255,255,.35)'; c.lineWidth = 0.6 * u; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.lineWidth = 0.25 * u; c.beginPath(); c.arc(cx, cy, R * 1.06, 0, 7); c.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, mj = i % 5 === 0; c.strokeStyle = bad ? 'rgba(255,150,150,' + (mj ? 0.8 : 0.35) + ')' : 'rgba(255,255,255,' + (mj ? 0.7 : 0.3) + ')'; c.lineWidth = mj ? 0.7 * u : 0.25 * u; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * (mj ? 0.84 : 0.9), cy + Math.sin(a) * R * (mj ? 0.84 : 0.9)); c.lineTo(cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97); c.stroke(); }
  // hands, with a smear of earlier positions behind the fast one
  const ha = t * sp, ma = t * sp / 12;
  for (let g2 = 6; g2 >= 1; g2--) { c.strokeStyle = (bad ? 'rgba(255,90,90,' : 'rgba(200,220,255,') + (0.06 * (7 - g2)).toFixed(3) + ')'; c.lineWidth = 0.7 * u; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ha - g2 * 0.12) * R * 0.82, cy + Math.sin(ha - g2 * 0.12) * R * 0.82); c.stroke(); }
  c.lineCap = 'round'; c.strokeStyle = bad ? '#ff8a8a' : '#e8f0ff'; c.lineWidth = 0.7 * u; c.beginPath(); c.moveTo(cx - Math.cos(ha) * R * 0.14, cy - Math.sin(ha) * R * 0.14); c.lineTo(cx + Math.cos(ha) * R * 0.82, cy + Math.sin(ha) * R * 0.82); c.stroke();
  c.lineWidth = 1.1 * u; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ma) * R * 0.55, cy + Math.sin(ma) * R * 0.55); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = bad ? '#ff6b6b' : '#fff'; c.beginPath(); c.arc(cx, cy, 1.4 * u, 0, 7); c.fill();
  if (bad) for (let i = 0; i < 16; i++) { const k = (t * 0.25 + hash01(i, 1, 1)) % 1, x = w * hash01(i, 2, 2), y = h * k; c.fillStyle = 'rgba(255,110,110,.4)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + u * 1.6, y + u * 3); c.lineTo(x - u * 0.8, y + u * 2.2); c.closePath(); c.fill(); }
}
function dsHall(c, t, w, h, mood) {
  const bad = mood === 'bad', u = Math.min(w, h) / 100, vx = w * 0.5 + Math.sin(t * 0.7) * 2.2 * u, vy = h * 0.46, T = 0.8 + 0.14 * Math.sin(t * 0.4);
  const edge = { l: -w * 0.15, r: w * 1.15, t: -h * 0.18, b: h * 1.2 };
  c.fillStyle = '#080308'; c.fillRect(0, 0, w, h);
  // the corridor's planes
  const quad = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  const at = (e, p) => [vx + (e[0] - vx) * p, vy + (e[1] - vy) * p];
  const FAR = 0.07;
  const L0 = at([edge.l, edge.t], FAR), R0 = at([edge.r, edge.t], FAR), L1 = at([edge.l, edge.b], FAR), R1 = at([edge.r, edge.b], FAR);
  quad([[edge.l, edge.t], L0, L1, [edge.l, edge.b]], SK.lin(c, edge.l, 0, vx, 0, [[0, '#2a0c14'], [1, '#150609']]));
  quad([[edge.r, edge.t], R0, R1, [edge.r, edge.b]], SK.lin(c, edge.r, 0, vx, 0, [[0, '#2a0c14'], [1, '#150609']]));
  quad([[edge.l, edge.t], [edge.r, edge.t], R0, L0], SK.lin(c, 0, edge.t, 0, vy, [[0, '#120508'], [1, '#2a0e14']]));
  quad([[edge.l, edge.b], [edge.r, edge.b], R1, L1], SK.lin(c, 0, edge.b, 0, vy, [[0, '#1a0a10'], [1, '#3a1420']]));
  // floor tiles and wall panels slide toward us, the world stretching in and out
  for (let i = 0; i < 16; i++) { const d = ((i + t * 1.6) % 16) / 16, p = FAR + (1 - FAR) * Math.pow(d, 2.4 * T); const a = at([edge.l, edge.b], p), b2 = at([edge.r, edge.b], p); c.strokeStyle = 'rgba(255,110,110,' + (0.03 + p * 0.22).toFixed(3) + ')'; c.lineWidth = 1 + p * 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.stroke(); const ta = at([edge.l, edge.t], p), tb = at([edge.r, edge.t], p); c.beginPath(); c.moveTo(ta[0], ta[1]); c.lineTo(tb[0], tb[1]); c.stroke(); }
  // doors down both walls, every one locked
  for (let i = 0; i < 12; i++) {
    const d = ((i + t * 1.6) % 12) / 12, p = FAR + (1 - FAR) * Math.pow(d, 2.4 * T), side = i % 2 ? 1 : -1, ex = side < 0 ? edge.l : edge.r;
    const a = at([ex, edge.t * 0.1 + h * 0.15], p), b2 = at([ex, h * 0.88], p), a2 = at([ex, edge.t * 0.1 + h * 0.15], p * 0.93), b3 = at([ex, h * 0.88], p * 0.93);
    c.fillStyle = 'rgba(' + (60 + p * 60) + ',20,24,' + (0.5 + p * 0.45).toFixed(2) + ')'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a2[0], a2[1]); c.lineTo(b3[0], b3[1]); c.lineTo(b2[0], b2[1]); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,170,120,' + (0.1 + p * 0.5).toFixed(2) + ')'; c.lineWidth = 1 + p * 2; c.stroke();
    c.fillStyle = 'rgba(255,200,120,' + (0.2 + p * 0.7).toFixed(2) + ')'; c.beginPath(); c.arc((a[0] + a2[0]) / 2 + (side < 0 ? 1 : -1) * Math.abs(a2[0] - a[0]) * 0.1, (a[1] + b2[1]) / 2, 1 + p * 3, 0, 7); c.fill();
  }
  // ceiling lights, the near ones dying one by one
  for (let i = 0; i < 9; i++) {
    const d = ((i + t * 1.6) % 9) / 9, p = FAR + (1 - FAR) * Math.pow(d, 2.4 * T), P = at([vx, edge.t], p), on = Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i) > -0.2 ? 1 : 0.25;
    AK.light(c, P[0], P[1] + 3 * u * p * 8, u * (2 + p * 22), '#ffb0a0', 0.55 * on); c.fillStyle = 'rgba(255,230,210,' + (0.9 * on).toFixed(2) + ')'; c.fillRect(P[0] - u * (0.6 + p * 4), P[1], u * (1.2 + p * 8), 2 + p * 4);
  }
  // the door at the far end glowing, and breathing
  const gl = 0.7 + 0.3 * Math.sin(t * 1.3);
  AK.light(c, vx, vy, u * 24 * gl, '#ffe8c0', 0.9); c.fillStyle = '#fff2d8'; c.fillRect(vx - u * 1.4, vy - u * 2.6, u * 2.8, u * 5.2);
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = SK.rad(c, vx, vy, 0, Math.max(w, h) * 0.8, [[0, 'rgba(255,60,60,0)'], [1, 'rgba(255,60,60,' + (0.14 + 0.06 * Math.sin(t * 2)).toFixed(3) + ')']]); c.fillRect(0, 0, w, h); c.restore();
}
function dsLetters(c, t, w, h) {
  const u = Math.min(w, h) / 100;
  c.drawImage(dsLayer('letters', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#0a0710'], [0.7, '#1c0f20'], [1, '#2a1424']]); g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a1a22'; g.fillRect(0, H * 0.72, W, H * 0.28); g.strokeStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, H * (0.72 + i * 0.025)); g.lineTo(W, H * (0.72 + i * 0.025)); g.stroke(); }
    g.fillStyle = '#160c14'; rr(g, W * 0.7, H * 0.12, W * 0.2, H * 0.62, 6); g.fill(); g.fillStyle = '#240f1a'; rr(g, W * 0.715, H * 0.15, W * 0.17, H * 0.26, 4); g.fill(); rr(g, W * 0.715, H * 0.44, W * 0.17, H * 0.26, 4); g.fill();
    g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(W * 0.725, H * 0.45, 4, 0, 7); g.fill();
    g.fillStyle = SK.lin(g, 0, H * 0.74, 0, H * 0.78, [[0, 'rgba(255,200,140,.8)'], [1, 'rgba(255,200,140,0)']]); g.fillRect(W * 0.7, H * 0.735, W * 0.2, H * 0.03);
  }), 0, 0, w, h);
  // somebody standing behind the door: two shadows under it, and a knock now and then
  const kn = Math.max(0, Math.sin(t * 4.2)) * (Math.sin(t * 0.9) > 0.2 ? 1 : 0);
  c.fillStyle = 'rgba(6,2,8,.9)'; c.fillRect(w * 0.74, h * 0.738, w * 0.025, h * 0.024); c.fillRect(w * 0.82, h * 0.738, w * 0.025, h * 0.024);
  if (kn > 0.5) { c.strokeStyle = 'rgba(255,200,140,.4)'; c.lineWidth = 2; c.beginPath(); c.arc(w * 0.8, h * 0.4, u * (3 + kn * 10), 0, 7); c.stroke(); }
  AK.light(c, w * 0.8, h * 0.76, w * 0.15, '#ffc890', 0.2 + 0.1 * kn);
  // the pile builds on the floor
  const grow = Math.min(1, 0.15 + DR.t * 0.025);
  for (let i = 0; i < 90; i++) { const x = w * (0.1 + hash01(i, 1, 1) * 0.6), y = h * 1.0 - hash01(i, 2, 1) * h * 0.2 * grow - u * 1, a = (hash01(i, 3, 1) - 0.5) * 1.2; if (hash01(i, 2, 1) * grow * 1.2 > (1 - Math.abs(x / w - 0.4) * 1.4) * 0.8) continue; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = 'rgb(' + Math.round(210 + hash01(i, 4, 1) * 30) + ',' + Math.round(200 + hash01(i, 5, 1) * 25) + ',' + Math.round(190 + hash01(i, 6, 1) * 20) + ')'; c.fillRect(-u * 3.2, -u * 2.2, u * 6.4, u * 4.4); c.fillStyle = 'rgba(200,40,40,.7)'; c.fillRect(-u * 2.4, -u * 1.2, u * 4.8, u * 0.7); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-u * 3.2, u * 1.6, u * 6.4, u * 0.6); c.restore(); }
  // paper keeps sliding in under the door and drifting down from the dark
  for (let i = 0; i < 34; i++) {
    const k = (t * (0.05 + hash01(i, 3, 3) * 0.05) + hash01(i, 1, 1)) % 1.1 - 0.05, x = w * (0.1 + hash01(i, 2, 2) * 0.6) + Math.sin(t * 0.9 + i) * u * 4, y = k * h, a = Math.sin(t * 0.8 + i) * 0.8;
    c.save(); c.translate(x, y); c.rotate(a); c.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(t * 1.4 + i))); c.fillStyle = 'rgba(244,236,222,.85)'; c.fillRect(-u * 2.6, -u * 3.2, u * 5.2, u * 6.4); c.fillStyle = 'rgba(210,50,50,.85)'; c.fillRect(-u * 1.9, -u * 1.8, u * 3.8, u * 0.9); c.fillRect(-u * 1.9, u * 0.1, u * 2.6, u * 0.5); c.restore();
  }
}
function dsCalm(c, t, w, h) {
  const u = Math.min(w, h) / 100;
  c.drawImage(dsLayer('calm', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#070b1c'], [0.6, '#131f40'], [1, '#1f2c52']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.15 + hash01(i, 3, 3) * 0.55).toFixed(2) + ')'; g.fillRect(hash01(i, 1, 1) * W, hash01(i, 2, 1) * H, 1.1 + (i % 7 === 0 ? 0.8 : 0), 1.1 + (i % 7 === 0 ? 0.8 : 0)); }
  }), 0, 0, w, h);
  // slow ribbons of light and a soft moon
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let r = 0; r < 3; r++) { c.beginPath(); for (let i = 0; i <= 40; i++) { const x = w * i / 40, y = h * (0.3 + r * 0.1) + Math.sin(i * 0.3 + t * 0.2 + r * 2) * h * 0.05 + Math.sin(i * 0.11 + t * 0.13) * h * 0.04; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineTo(w, h * 0.7); c.lineTo(0, h * 0.7); c.closePath(); c.fillStyle = SK.lin(c, 0, h * 0.2, 0, h * 0.7, [[0, 'rgba(' + (r === 0 ? '120,200,255' : r === 1 ? '170,140,255' : '120,255,200') + ',.10)'], [1, 'rgba(0,0,0,0)']]); c.fill(); }
  c.restore();
  AK.light(c, w * 0.7, h * 0.24, 36 * u, '#cfd8ff', 0.45); c.fillStyle = '#f4f1dc'; c.beginPath(); c.arc(w * 0.7, h * 0.24, 5.5 * u, 0, 7); c.fill(); c.fillStyle = 'rgba(160,170,200,.3)'; c.beginPath(); c.arc(w * 0.7 - 1.5 * u, h * 0.24 - u, 1.4 * u, 0, 7); c.arc(w * 0.7 + 1.6 * u, h * 0.24 + 1.5 * u, 1 * u, 0, 7); c.fill();
  for (let i = 0; i < 6; i++) { const tw = Math.max(0, Math.sin(t * 1.1 + i * 2.3)); if (tw > 0.2) { c.save(); c.globalAlpha = tw; c.fillStyle = '#fff'; AK.star(c, w * hash01(i, 8, 1), h * (0.1 + hash01(i, 9, 1) * 0.5), 3 + tw * 3, 0.15); c.fill(); c.restore(); } }
}
/* bad dreams get tendrils creeping in from the corners, hairline cracks and the odd glitch */
function dsTendrils(c, t, w, h) {
  c.save(); c.lineCap = 'round';
  const m = Math.min(w, h);
  for (let i = 0; i < 9; i++) {
    const corner = i % 4, bx = corner % 2 ? w : 0, by = corner < 2 ? 0 : h, sx = corner % 2 ? -1 : 1, sy = corner < 2 ? 1 : -1, len = (0.16 + hash01(i, 1, 1) * 0.16) * Math.max(w, h) * (0.85 + 0.15 * Math.sin(t * 0.5 + i));
    const y0 = by + sy * hash01(i, 2, 1) * h * 0.3, x1 = bx + sx * len * 0.3, y1 = by + sy * (hash01(i, 3, 1) * h * 0.25 + Math.sin(t * 0.8 + i) * 16), x2 = bx + sx * len * 0.6, y2 = by + sy * (hash01(i, 4, 1) * h * 0.3 + Math.cos(t * 0.7 + i) * 18), x3 = bx + sx * len, y3 = by + sy * hash01(i, 5, 1) * h * 0.4;
    // a tapering root: many short strokes, thick at the edge of the screen and a thread at the tip
    let px = bx, py = y0;
    for (let k = 1; k <= 22; k++) {
      const u2 = k / 22, v = 1 - u2, x = v * v * v * bx + 3 * v * v * u2 * x1 + 3 * v * u2 * u2 * x2 + u2 * u2 * u2 * x3, y = v * v * v * y0 + 3 * v * v * u2 * y1 + 3 * v * u2 * u2 * y2 + u2 * u2 * u2 * y3;
      c.strokeStyle = 'rgba(8,0,10,' + (0.78 - u2 * 0.3).toFixed(3) + ')'; c.lineWidth = Math.max(1, m * 0.026 * (1 - u2) * (1 - u2) + 1.2); c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke(); px = x; py = y;
    }
  }
  c.restore();
}
