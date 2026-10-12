/* ---------------------------- the salon ---------------------------- */
function scSalonRoom(g, w, h, mx, my, mw, mh) {
  // striped wallpaper over a dado, with a shelf of bottles and a plant
  g.fillStyle = SK.lin(g, 0, 0, 0, h, [[0, '#f6e6ee'], [1, '#e8cfdc']]); g.fillRect(0, 0, w, h);
  for (let x = -10; x < w; x += 30) { g.fillStyle = 'rgba(214,120,160,.14)'; g.fillRect(x, 0, 14, h * 0.7); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 14, 0, 2, h * 0.7); }
  g.fillStyle = '#c47a98'; g.fillRect(0, h * 0.62, w, h * 0.12); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, h * 0.62, w, 3);
  for (let x = 0; x < w; x += 34) { g.fillStyle = 'rgba(80,20,50,.18)'; g.fillRect(x, h * 0.65, 2, h * 0.09); }
  g.fillStyle = '#ede0e6'; g.fillRect(0, h * 0.73, w, h * 0.012);
  // checkered floor in perspective
  for (let r = 0; r < 7; r++) {
    const y0 = h * 0.74 + (h * 0.26) * Math.pow(r / 7, 1.4), y1 = h * 0.74 + (h * 0.26) * Math.pow((r + 1) / 7, 1.4), sc = 1 + r * 0.32, sc1 = 1 + (r + 1) * 0.32;
    for (let k = -8; k < 10; k++) { g.fillStyle = (k + r) % 2 ? '#2b2833' : '#efe4e9'; g.beginPath(); g.moveTo(w / 2 + (k - 0) * w * 0.085 * sc, y0); g.lineTo(w / 2 + (k + 1) * w * 0.085 * sc, y0); g.lineTo(w / 2 + (k + 1) * w * 0.085 * sc1, y1); g.lineTo(w / 2 + k * w * 0.085 * sc1, y1); g.closePath(); g.fill(); }
  }
  g.fillStyle = SK.lin(g, 0, h * 0.74, 0, h, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(60,20,60,.35)']]); g.fillRect(0, h * 0.74, w, h * 0.26);
  // shelf of bottles at the right
  g.fillStyle = '#c9a15a'; g.fillRect(w * 0.8, h * 0.3, w * 0.17, 4); g.fillRect(w * 0.8, h * 0.46, w * 0.17, 4);
  [['#ff7eb6', 0.81], ['#7ad7f0', 0.846], ['#c77dff', 0.88], ['#ffd166', 0.915], ['#8ce99a', 0.945]].forEach((b, i) => { const bh = h * (0.08 + (i % 2) * 0.03), bx = w * b[1]; g.fillStyle = b[0]; rr(g, bx, h * 0.3 - bh, w * 0.026, bh, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(bx + 2, h * 0.3 - bh + 4, 2.4, bh - 10); g.fillStyle = '#fff'; g.fillRect(bx + 2, h * 0.3 - bh * 0.5, w * 0.026 - 4, bh * 0.2); g.fillStyle = '#34303a'; g.fillRect(bx + w * 0.006, h * 0.3 - bh - 5, w * 0.014, 6); });
  [['#fff', 0.81], ['#ff9ec8', 0.85], ['#a6e3f5', 0.89], ['#ffe08a', 0.93]].forEach((b, i) => { g.fillStyle = b[0]; g.globalAlpha = 0.85; rr(g, w * b[1], h * 0.46 - h * 0.06, w * 0.03, h * 0.06, 5); g.fill(); g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(w * b[1] + 2, h * 0.46 - h * 0.055, 2, h * 0.045); });
  // hanging plant at the left
  g.fillStyle = '#c47a98'; rr(g, w * 0.06, h * 0.18, w * 0.07, h * 0.08, 6); g.fill(); g.strokeStyle = '#8a5a6a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(w * 0.07, h * 0.18); g.lineTo(w * 0.095, h * 0.04); g.lineTo(w * 0.12, h * 0.18); g.stroke();
  for (let i = 0; i < 9; i++) { g.strokeStyle = i % 2 ? '#3f9458' : '#58ae68'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * 0.095, h * 0.22); g.quadraticCurveTo(w * (0.04 + i * 0.012), h * (0.3 + (i % 3) * 0.03), w * (0.03 + i * 0.013), h * (0.34 + (i % 4) * 0.04)); g.stroke(); } g.lineCap = 'butt';
  // the mirror: gold frame, bevel, warm vanity bulbs added live
  g.fillStyle = SK.lin(g, mx, my, mx + mw, my + mh, [[0, '#f1d27a'], [0.5, '#b58a2a'], [1, '#e6c05a']]); rr(g, mx - 14, my - 14, mw + 28, mh + 28, mw * 0.5); g.fill();
  g.fillStyle = '#7a5a1a'; rr(g, mx - 7, my - 7, mw + 14, mh + 14, mw * 0.48); g.fill();
}
/* over an illustrated salon wall: only the mirror's gold frame, so the live reflection has its edge */
function scSalonArtFrame(g, mx, my, mw, mh) {
  g.fillStyle = 'rgba(40,10,30,.28)'; rr(g, mx - 18, my - 10, mw + 36, mh + 36, mw * 0.5); g.fill();
  g.fillStyle = SK.lin(g, mx, my, mx + mw, my + mh, [[0, '#f1d27a'], [0.5, '#b58a2a'], [1, '#e6c05a']]); rr(g, mx - 14, my - 14, mw + 28, mh + 28, mw * 0.5); g.fill();
  g.fillStyle = '#7a5a1a'; rr(g, mx - 7, my - 7, mw + 14, mh + 14, mw * 0.48); g.fill();
}
function scSalonScissors(c, x, y, ang, open, s) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  [-1, 1].forEach(side => {
    c.save(); c.rotate(side * open);
    c.fillStyle = SK.lin(c, 0, -3, 0, 3, [[0, '#f3f7fa'], [0.5, '#aebac2'], [1, '#6f7c85']]); c.beginPath(); c.moveTo(0, -2); c.lineTo(-34, -0.5 * side); c.lineTo(0, 2); c.closePath(); c.fill();
    c.strokeStyle = '#e8605e'; c.lineWidth = 3.2; c.beginPath(); c.ellipse(13, side * 7.5, 7.4, 5.4, side * 0.5, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.beginPath(); c.arc(13, side * 7.5, 7, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
    c.restore();
  });
  c.fillStyle = '#5a646c'; c.beginPath(); c.arc(0, 0, 2.2, 0, 7); c.fill();
  c.restore();
}
function scStar(c, x, y, r, a, col) { c.save(); c.globalAlpha = a; c.fillStyle = col; AK.star(c, x, y, r, 0.18); c.fill(); c.globalAlpha = a * 0.5; AK.light(c, x, y, r * 1.8, '#fff6d0', 0.6); c.restore(); }
SCENES.salon = function (c, w, h, t, fr, o) {
  const mw = Math.min(w * 0.46, h * 0.8), mh = mw * 1.08, mx = (w - mw) / 2, my = h * 0.08, after = fr > 0.55;
  c.drawImage(scLayer('sal' + artSceneTag(o), w, h, (g, W, H) => artSceneBg(g, W, H, o) ? scSalonArtFrame(g, mx, my, mw, mh) : scSalonRoom(g, W, H, mx, my, mw, mh)), 0, 0, w, h);
  // inside the mirror
  c.save(); rr(c, mx, my, mw, mh, mw * 0.46); c.clip();
  c.fillStyle = SK.lin(c, 0, my, 0, my + mh, [[0, '#f4fbff'], [0.6, '#d4e8f2'], [1, '#bad3e1']]); c.fillRect(mx, my, mw, mh);
  c.fillStyle = 'rgba(214,120,160,.1)'; for (let x = mx - 10; x < mx + mw; x += 22) c.fillRect(x, my, 9, mh);   // the room, reflected
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(mx, my + mh * 0.72, mw, 2);
  const look = after ? o.after : o.before, s = mh / 44, fy = my + mh * 1.25;
  SK.shadow(c, w / 2, my + mh * 0.98, mw * 0.4, mw * 0.08, 0.2);
  drawPerson(c, w / 2, fy, Object.assign({}, look, { s, face: 1, moving: false, me: false, skin: PLAYER_LOOK.skin }));
  // the cape: floral, with a collar tie and a few folds
  const ty = fy - 27 * s;
  c.fillStyle = SK.lin(c, w / 2 - 16 * s, 0, w / 2 + 16 * s, 0, [[0, '#3b2f4a'], [0.45, '#5a4672'], [1, '#2a2136']]);
  c.beginPath(); c.moveTo(w / 2 - 8.5 * s, ty); c.quadraticCurveTo(w / 2, ty + 3 * s, w / 2 + 8.5 * s, ty); c.lineTo(w / 2 + 17 * s, my + mh + 2); c.lineTo(w / 2 - 17 * s, my + mh + 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(w / 2 + i * 3.2 * s, ty + 3 * s); c.lineTo(w / 2 + i * 6.4 * s, my + mh); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(w / 2 + (hash01(i, 1, 1) - 0.5) * 24 * s, ty + 8 * s + hash01(i, 2, 1) * 16 * s, 1.4 * s, 0, 7); c.fill(); }
  c.fillStyle = '#e8c06a'; c.beginPath(); c.arc(w / 2, ty + 1.5 * s, 1.6 * s, 0, 7); c.fill();
  // hair clippings settle on the cape while the stylist works
  if (!after) { c.fillStyle = o.before.hair; for (let i = 0; i < 16; i++) { const fx = w / 2 + (hash01(i, 2, 9) - 0.5) * 30 * s, fyy = ty + 4 * s + ((t * 26 + i * 19) % (my + mh - ty - 4 * s)); c.save(); c.translate(fx, fyy); c.rotate(t + i); c.fillRect(-2, -0.7, 4, 1.4); c.restore(); } }
  // glass reflections on the mirror
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(mx + mw * 0.12, my + mh * 0.34); c.lineTo(mx + mw * 0.34, my); c.lineTo(mx + mw * 0.46, my); c.lineTo(mx + mw * 0.16, my + mh * 0.42); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(mx + mw * 0.5, my + mh); c.lineTo(mx + mw * 0.7, my); c.lineTo(mx + mw * 0.76, my); c.lineTo(mx + mw * 0.56, my + mh); c.closePath(); c.fill();
  // the reveal: a flash, a sweep of light and a shower of sparkles
  const fl = Math.max(0, 1 - Math.abs(fr - 0.56) / 0.035);
  if (fl > 0) { c.fillStyle = 'rgba(255,255,255,' + (fl * 0.75).toFixed(3) + ')'; c.fillRect(mx, my, mw, mh); }
  if (after) {
    const k = clamp((fr - 0.56) / 0.12, 0, 1), sweep = mx - mw * 0.3 + k * mw * 1.6;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = SK.lin(c, sweep, 0, sweep + mw * 0.3, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,.4)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(mx, my, mw, mh); c.restore();
  }
  c.restore();
  // frame bulbs, twinkling
  const nb = 18;
  for (let i = 0; i < nb; i++) { const a = i / nb * Math.PI * 2, bx = w / 2 + Math.cos(a) * (mw / 2 + 10) * 1.0, by = my + mh / 2 + Math.sin(a) * (mh / 2 + 10); const on = 0.7 + 0.3 * Math.sin(t * 3 + i * 1.7) + (fl > 0 ? fl : 0); AK.light(c, bx, by, 10, '#ffe2a0', 0.55 * Math.min(1, on)); c.fillStyle = '#fff7d8'; c.beginPath(); c.arc(bx, by, 2.2, 0, 7); c.fill(); }
  if (after) for (let i = 0; i < 9; i++) { const k = (t * 0.7 + hash01(i, 5, 5)) % 1, a2 = Math.sin(k * Math.PI); scStar(c, mx + mw * (0.12 + hash01(i, 1, 1) * 0.76), my + mh * (0.1 + hash01(i, 2, 1) * 0.7), 4 + hash01(i, 3, 1) * 8, a2, '#fff6d0'); }
  // the stylist's arm and scissors circle the head while the cut is on
  if (!after) {
    const hx = w / 2 + mw * 0.2 + Math.sin(t * 1.3) * mw * 0.05, hy = my + mh * 0.26 + Math.cos(t * 0.9) * mh * 0.03, op = 0.06 + Math.abs(Math.sin(t * 9)) * 0.42, sc2 = mh / 120;
    const hdx = hx + 22 * sc2, hdy = hy + 3 * sc2;
    c.strokeStyle = '#26242e'; c.lineWidth = mh * 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 1.02, h * 0.86); c.quadraticCurveTo(w * 0.88, h * 0.66, hdx + mw * 0.05, hdy + mh * 0.05); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 1.02, h * 0.84); c.quadraticCurveTo(w * 0.88, h * 0.64, hdx + mw * 0.05, hdy + mh * 0.03); c.stroke();
    c.lineCap = 'butt'; c.fillStyle = PLAYER_LOOK.skin; c.beginPath(); c.ellipse(hdx + 2, hdy + 2, mh * 0.05, mh * 0.04, -0.4, 0, 7); c.fill();
    scSalonScissors(c, hx, hy, -0.3, op, sc2);
    // the comb in the other hand
    const cx = w / 2 - mw * 0.2 + Math.sin(t * 0.8) * 6, cy = my + mh * 0.3; c.fillStyle = '#2a2a33'; rr(c, cx - 14, cy, 28, 5, 2); c.fill(); for (let i = 0; i < 12; i++) c.fillRect(cx - 13 + i * 2.3, cy + 5, 1, 7);
  }
};
/* ---------------------------- the dentist ---------------------------- */
function scDentistRoom(g, w, h) {
  g.fillStyle = SK.lin(g, 0, 0, 0, h, [[0, '#e4f4f8'], [0.6, '#c3e3ec'], [1, '#9ccbd8']]); g.fillRect(0, 0, w, h);
  // ceiling tiles in perspective
  g.strokeStyle = 'rgba(70,120,140,.2)'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, h * 0.04 * i * i * 0.5); g.lineTo(w, h * 0.04 * i * i * 0.5); g.stroke(); }
  for (let i = -8; i < 9; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.04, 0); g.lineTo(w / 2 + i * w * 0.18, h * 0.5); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 5; i++) g.fillRect(0, i * h / 5 + h * 0.1, w, 1.5);
  // a ceiling poster of clouds and a smiling tooth, for something to look at
  g.fillStyle = '#7ec3e6'; rr(g, w * 0.06, h * 0.1, w * 0.3, h * 0.38, 8); g.fill(); g.strokeStyle = '#f6fbff'; g.lineWidth = 4; g.stroke();
  g.fillStyle = SK.lin(g, 0, h * 0.1, 0, h * 0.48, [[0, '#7ec3e6'], [1, '#c6e9f5']]); rr(g, w * 0.065, h * 0.105, w * 0.29, h * 0.37, 6); g.fill();
  g.fillStyle = '#fff'; [[0.12, 0.34, 20], [0.2, 0.37, 26], [0.28, 0.33, 18], [0.17, 0.3, 16]].forEach(p => { g.beginPath(); g.arc(w * p[0], h * p[1], p[2], 0, 7); g.fill(); });
  g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(w * 0.17, h * 0.17); g.quadraticCurveTo(w * 0.15, h * 0.13, w * 0.18, h * 0.135); g.quadraticCurveTo(w * 0.205, h * 0.12, w * 0.225, h * 0.135); g.quadraticCurveTo(w * 0.255, h * 0.13, w * 0.235, h * 0.18); g.quadraticCurveTo(w * 0.23, h * 0.26, w * 0.215, h * 0.26); g.quadraticCurveTo(w * 0.2, h * 0.22, w * 0.195, h * 0.26); g.quadraticCurveTo(w * 0.175, h * 0.26, w * 0.17, h * 0.17); g.fill();
  g.fillStyle = '#1c2a33'; g.beginPath(); g.arc(w * 0.19, h * 0.17, 1.8, 0, 7); g.arc(w * 0.22, h * 0.17, 1.8, 0, 7); g.fill(); g.strokeStyle = '#1c2a33'; g.lineWidth = 1.6; g.beginPath(); g.arc(w * 0.205, h * 0.185, w * 0.012, 0.2, Math.PI - 0.2); g.stroke();
  // a counter along the bottom with a tray of instruments
  g.fillStyle = SK.lin(g, 0, h * 0.84, 0, h, [[0, '#f4f8fa'], [1, '#c3d3da']]); g.fillRect(0, h * 0.86, w, h * 0.14);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, h * 0.86, w, 3);
  g.fillStyle = '#d6e0e5'; rr(g, w * 0.04, h * 0.84, w * 0.28, h * 0.1, 6); g.fill(); g.fillStyle = '#9fb0b9'; rr(g, w * 0.045, h * 0.845, w * 0.27, h * 0.09, 5); g.fill();
  g.strokeStyle = '#eef3f6'; g.lineWidth = 2.6; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w * (0.07 + i * 0.047), h * 0.915); g.lineTo(w * (0.09 + i * 0.047), h * 0.86); g.stroke(); g.fillStyle = '#6c7a83'; g.beginPath(); g.arc(w * (0.09 + i * 0.047), h * 0.858, 2.2, 0, 7); g.fill(); }
  g.lineCap = 'butt';
}
SCENES.dentist = function (c, w, h, t, fr, o) {
  c.drawImage(scLayer('den' + artSceneTag(o), w, h, (g, W, H) => artSceneBg(g, W, H, o) || scDentistRoom(g, W, H)), 0, 0, w, h);
  const q = h / 100;
  // the big lamp on its arm, and a beam that is bright but not blinding
  const lx = w * 0.7, ly = h * 0.2;
  c.strokeStyle = '#a8b4bb'; c.lineWidth = 2.2 * q; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 1.02, h * 0.02); c.lineTo(w * 0.9, h * 0.07); c.lineTo(lx + 12 * q, ly - 6 * q); c.stroke();
  c.fillStyle = '#7d8b93'; c.beginPath(); c.arc(w * 0.9, h * 0.07, 1.8 * q, 0, 7); c.fill(); c.lineCap = 'butt';
  c.fillStyle = SK.lin(c, lx - 14 * q, 0, lx + 14 * q, 0, [[0, '#cdd8dd'], [0.5, '#f6fafb'], [1, '#aab7be']]); c.beginPath(); c.ellipse(lx, ly, 14 * q, 8.5 * q, -0.2, 0, 7); c.fill();
  c.fillStyle = SK.rad(c, lx, ly, 1, 10.5 * q, [[0, '#ffffff'], [0.55, '#fff6d0'], [1, '#ffe9a8']]); c.beginPath(); c.ellipse(lx, ly, 10.5 * q, 6 * q, -0.2, 0, 7); c.fill();
  [[-0.5, -0.1], [0, 0.1], [0.5, -0.05]].forEach(p => { c.fillStyle = '#fff'; c.beginPath(); c.arc(lx + p[0] * 8 * q, ly + p[1] * 4 * q, 1.8 * q, 0, 7); c.fill(); });
  const pulse = 0.22 + 0.04 * Math.sin(t * 3);
  AK.light(c, lx, ly, 22 * q, '#fff2c0', pulse + 0.15);
  SK.shaft(c, lx, ly + 5 * q, 10 * q, w * 0.56, h * 1.02, w * 0.4, '#fff6d6', 0.13);
  c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,230,170,.12)'; c.lineWidth = 1.6; c.beginPath(); c.arc(lx, ly, 16 * q, 0, 7); c.stroke();
  [[0.35, 3.4, 0.14], [0.6, 6.5, 0.07], [0.85, 2.2, 0.12]].forEach(g2 => { const gx = lx + (w * 0.5 - lx) * g2[0], gy = ly + (h * 0.55 - ly) * g2[0]; c.fillStyle = 'rgba(180,220,255,' + g2[2] + ')'; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.3; c.lineTo(gx + Math.cos(a) * g2[1] * q, gy + Math.sin(a) * g2[1] * q); } c.closePath(); c.fill(); }); c.restore();
  SK.motes(c, t, w * 0.35, 0, w * 0.95, h, 26, 6, '#fff6d6', 0.55);
  // the dentist, leaning in with cap, mask and glasses
  const dx = w * 0.34 + Math.sin(t * 0.8) * 7, hr = 15.5 * q, hy = h * 0.4, sy = h * 0.66;
  c.fillStyle = SK.lin(c, dx - 52 * q, 0, dx + 52 * q, 0, [[0, '#1f8a95'], [0.5, '#37b5bd'], [1, '#18737d']]);
  c.beginPath(); c.moveTo(dx - 60 * q, h * 1.02); c.quadraticCurveTo(dx - 58 * q, sy + 4 * q, dx - 22 * q, sy); c.lineTo(dx + 22 * q, sy); c.quadraticCurveTo(dx + 58 * q, sy + 4 * q, dx + 60 * q, h * 1.02); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(dx - 22 * q, sy); c.lineTo(dx, sy + 14 * q); c.lineTo(dx + 22 * q, sy); c.lineTo(dx + 12 * q, sy - 1 * q); c.lineTo(dx, sy + 8 * q); c.lineTo(dx - 12 * q, sy - 1 * q); c.closePath(); c.fill();
  c.fillStyle = '#c28660'; rr(c, dx - 8 * q, hy + hr * 0.9, 16 * q, sy - hy - hr * 0.7, 6 * q); c.fill();
  c.fillStyle = SK.rad(c, dx - hr * 0.3, hy - hr * 0.3, 2, hr * 1.3, [[0, '#dca175'], [1, '#a86a44']]); c.beginPath(); c.ellipse(dx, hy, hr, hr * 1.12, 0, 0, 7); c.fill();
  c.fillStyle = '#b97a52'; c.beginPath(); c.arc(dx - hr * 0.97, hy + hr * 0.1, hr * 0.17, 0, 7); c.arc(dx + hr * 0.97, hy + hr * 0.1, hr * 0.17, 0, 7); c.fill();
  c.fillStyle = '#2a8fc9'; c.beginPath(); c.ellipse(dx, hy - hr * 0.5, hr * 1.04, hr * 0.7, 0, Math.PI, 0); c.fill(); c.fillRect(dx - hr * 1.04, hy - hr * 0.5, hr * 2.08, hr * 0.12);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(dx - hr * 0.3, hy - hr * 0.86, hr * 0.4, hr * 0.12, -0.4, 0, 7); c.fill();
  const eyeY = hy - hr * 0.02, blink = !REDUCED && (t * 0.33) % 1 > 0.96;
  c.fillStyle = '#26211e'; if (blink) { c.fillRect(dx - hr * 0.46, eyeY, hr * 0.24, 1.6); c.fillRect(dx + hr * 0.22, eyeY, hr * 0.24, 1.6); } else { c.beginPath(); c.ellipse(dx - hr * 0.34, eyeY, hr * 0.11, hr * 0.075, 0, 0, 7); c.ellipse(dx + hr * 0.34, eyeY, hr * 0.11, hr * 0.075, 0, 0, 7); c.fill(); }
  c.strokeStyle = '#2a1d16'; c.lineWidth = 0.55 * q; c.lineCap = 'round'; c.beginPath(); c.moveTo(dx - hr * 0.56, eyeY - hr * 0.2); c.quadraticCurveTo(dx - hr * 0.34, eyeY - hr * 0.32, dx - hr * 0.14, eyeY - hr * 0.2); c.moveTo(dx + hr * 0.14, eyeY - hr * 0.2); c.quadraticCurveTo(dx + hr * 0.34, eyeY - hr * 0.32, dx + hr * 0.56, eyeY - hr * 0.2); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = 'rgba(200,235,255,.2)'; c.strokeStyle = 'rgba(40,60,70,.85)'; c.lineWidth = 0.5 * q;
  rr(c, dx - hr * 0.76, eyeY - hr * 0.3, hr * 0.62, hr * 0.44, hr * 0.16); c.fill(); c.stroke(); rr(c, dx + hr * 0.14, eyeY - hr * 0.3, hr * 0.62, hr * 0.44, hr * 0.16); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(dx - hr * 0.14, eyeY - hr * 0.1); c.lineTo(dx + hr * 0.14, eyeY - hr * 0.1); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.4 * q; c.beginPath(); c.arc(dx + hr * 0.52, eyeY - hr * 0.1, hr * 0.12, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
  c.fillStyle = SK.lin(c, 0, hy, 0, hy + hr * 1.0, [[0, '#acdff1'], [1, '#6fb7d4']]); c.beginPath(); c.moveTo(dx - hr * 0.84, eyeY + hr * 0.2); c.quadraticCurveTo(dx, eyeY + hr * 0.08, dx + hr * 0.84, eyeY + hr * 0.2); c.lineTo(dx + hr * 0.66, eyeY + hr * 1.08); c.quadraticCurveTo(dx, eyeY + hr * 1.26, dx - hr * 0.66, eyeY + hr * 1.08); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(30,90,120,.3)'; c.lineWidth = 0.28 * q; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(dx - hr * 0.78, eyeY + hr * (0.2 + i * 0.22)); c.quadraticCurveTo(dx, eyeY + hr * (0.1 + i * 0.24), dx + hr * 0.78, eyeY + hr * (0.2 + i * 0.22)); c.stroke(); }
  // a gloved hand with a dental mirror, jittering as it works
  const gx = w * 0.62 + Math.sin(t * 0.7) * 5, gy = h * 0.78, jt = Math.sin(t * 6) * 2.4;
  c.strokeStyle = '#2a8fc9'; c.lineWidth = 11 * q; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.97, h * 1.05); c.quadraticCurveTo(w * 0.86, h * 0.95, gx + 8, gy + 8); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = '#e8f0f6'; c.beginPath(); c.ellipse(gx, gy, 7 * q, 5.2 * q, -0.5, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(gx - 3, gy + 5, 5 * q, 2 * q, -0.5, 0, 7); c.fill();
  c.strokeStyle = '#b9c5cc'; c.lineWidth = 0.6 * q; c.beginPath(); c.moveTo(gx - 4, gy - 6); c.lineTo(gx - 13 * q + jt, gy - 16 * q); c.stroke();
  c.fillStyle = '#e8f6ff'; c.beginPath(); c.arc(gx - 14 * q + jt, gy - 17 * q, 1.6 * q, 0, 7); c.fill(); c.strokeStyle = '#8fa3ae'; c.lineWidth = 0.4 * q; c.stroke(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(gx - 14.6 * q + jt, gy - 17.6 * q, 0.55 * q, 0, 7); c.fill();
  // the patient's paper bib at the bottom of the frame
  c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.moveTo(w * 0.4, h * 1.02); c.quadraticCurveTo(w * 0.52, h * 0.94, w * 0.64, h * 1.02); c.closePath(); c.fill(); c.strokeStyle = '#9fb2bd'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * 0.45, h * 0.99); c.lineTo(w * 0.49, h * 0.965); c.moveTo(w * 0.59, h * 0.99); c.lineTo(w * 0.55, h * 0.965); c.stroke();
};
