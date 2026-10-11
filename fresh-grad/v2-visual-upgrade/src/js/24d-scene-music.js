/* ---------------------------- open mic, the bandstand concert, and the record player ---------------------------- */
function scStageRoom(g, w, h, concert) {
  g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.7, [[0, '#0d0816'], [0.6, '#241238'], [1, '#3a1c4a']]); g.fillRect(0, 0, w, h);
  // a backdrop of velvet with gold fringe, and a truss of lamps over the stage
  for (let x = 0; x < w; x += 9) { g.fillStyle = SK.lin(g, x, 0, x + 9, 0, [[0, 'rgba(0,0,0,.38)'], [0.5, 'rgba(190,120,255,.10)'], [1, 'rgba(0,0,0,.34)']]); g.fillRect(x, h * 0.06, 9, h * 0.58); }
  g.fillStyle = '#d4a017'; g.fillRect(0, h * 0.62, w, 3); g.fillStyle = SK.lin(g, 0, h * 0.62, 0, h * 0.66, [[0, 'rgba(255,220,120,.5)'], [1, 'rgba(255,220,120,0)']]); g.fillRect(0, h * 0.623, w, h * 0.04);
  g.fillStyle = '#1a1424'; g.fillRect(0, 0, w, h * 0.06); g.fillStyle = '#5a5068'; g.fillRect(0, h * 0.055, w, 2);
  for (let i = 0; i < 9; i++) { const lx = w * (0.07 + i * 0.108); g.fillStyle = '#2b2438'; rr(g, lx - 7, h * 0.02, 14, h * 0.045, 3); g.fill(); AK.light(g, lx, h * 0.05, 12, ['#ffd9a0', '#ff9ac8', '#9ad8ff'][i % 3], 0.55); }
  if (concert) { g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(w * hash01(i, 1, 1), h * (0.08 + hash01(i, 2, 1) * 0.5), 1 + hash01(i, 3, 1) * 1.6, 0, 7); g.fill(); } }
  else { // a neon microphone on the wall
    g.strokeStyle = '#ff7eb6'; g.lineWidth = 3.4; g.lineCap = 'round'; g.shadowColor = '#ff7eb6'; g.shadowBlur = 18;
    rr(g, w * 0.5 - 12, h * 0.16, 24, 40, 12); g.stroke(); g.beginPath(); g.arc(w * 0.5, h * 0.27, 20, 0.15, Math.PI - 0.15); g.moveTo(w * 0.5, h * 0.27 + 20); g.lineTo(w * 0.5, h * 0.34); g.moveTo(w * 0.5 - 10, h * 0.34); g.lineTo(w * 0.5 + 10, h * 0.34); g.stroke(); g.shadowBlur = 0; g.lineCap = 'butt';
  }
  // the stage floor: boards in perspective, a lip at the front
  g.fillStyle = SK.lin(g, 0, h * 0.64, 0, h * 0.92, [[0, '#6a4630'], [0.55, '#4a2f1f'], [1, '#2a1a12']]); g.fillRect(0, h * 0.64, w, h * 0.28);
  for (let i = -10; i <= 10; i++) { g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2 + i * w * 0.02, h * 0.64); g.lineTo(w / 2 + i * w * 0.12, h * 0.92); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, h * 0.64, w, 2);
  g.fillStyle = '#1b1020'; g.fillRect(0, h * 0.915, w, h * 0.09); g.fillStyle = '#c9a24a'; g.fillRect(0, h * 0.915, w, 2.4);
}
function scCrowd(c, w, h, t, beat, light) {
  // two rows of silhouettes with phones and raised hands
  for (let r = 0; r < 2; r++) {
    const n = 11 - r * 2, y = h * (1.0 - r * 0.03 + 0.02) + r * 0, hr = w * (0.034 + (1 - r) * 0.012);
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5 + (r ? 0.5 : 0)) * w / n + Math.sin(i * 4.1 + r) * 6, bob = Math.sin(t * 4 * beat + i * 1.3) * (r ? 1.6 : 2.4), hy = y - hr * (1.7 + hash01(i, r, 2) * 0.35) + bob;
      c.fillStyle = r ? '#0a0612' : '#04020a';
      rr(c, x - hr * 1.5, hy + hr * 0.9, hr * 3, hr * 3, hr * 1.1); c.fill();
      c.beginPath(); c.arc(x, hy, hr, 0, 7); c.fill();
      c.strokeStyle = AK.rgba(light, r ? 0.3 : 0.4); c.lineWidth = 1.4; c.beginPath(); c.arc(x, hy, hr, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.beginPath(); c.moveTo(x - hr * 1.5, hy + hr * 1.6); c.quadraticCurveTo(x - hr * 1.5, hy + hr * 0.9, x - hr * 0.6, hy + hr * 0.9); c.stroke();
      const act = hash01(i, r, 5);
      if (act > 0.58) {                        // an arm up: a phone with its screen on, or an open hand
        const ax = x + (act > 0.8 ? 1 : -1) * hr * 1.25, up = hy - hr * (1.4 + Math.sin(t * 3 + i) * 0.2);
        c.strokeStyle = c.fillStyle; c.lineWidth = hr * 0.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, hy + hr * 1.5); c.lineTo(ax + (act > 0.8 ? 1 : -1) * hr * 0.3, up); c.stroke(); c.lineCap = 'butt';
        if (act > 0.7 && act < 0.9) { c.fillStyle = '#10121a'; rr(c, ax + (act > 0.8 ? 1 : -1) * hr * 0.3 - hr * 0.42, up - hr * 0.95, hr * 0.84, hr * 1.3, 2); c.fill(); c.fillStyle = 'rgba(190,225,255,' + (0.7 + 0.3 * Math.sin(t * 2 + i)).toFixed(2) + ')'; c.fillRect(ax + (act > 0.8 ? 1 : -1) * hr * 0.3 - hr * 0.34, up - hr * 0.86, hr * 0.68, hr * 1.1); AK.light(c, ax + (act > 0.8 ? 1 : -1) * hr * 0.3, up - hr * 0.3, hr * 2.2, '#bfe3ff', 0.35); }
        else { c.fillStyle = '#0a0612'; c.beginPath(); c.arc(ax + (act > 0.8 ? 1 : -1) * hr * 0.3, up - hr * 0.1, hr * 0.42, 0, 7); c.fill(); }
      }
    }
  }
}
function scDrumKit(c, x, y, s, t) {
  // a kick drum facing us, two toms, a hi-hat and a crash that shimmers when struck
  c.fillStyle = '#7a1a22'; c.beginPath(); c.ellipse(x, y - 12 * s, 17 * s, 17 * s, 0, 0, 7); c.fill(); c.strokeStyle = '#d9dde0'; c.lineWidth = 2.4 * s; c.stroke();
  c.fillStyle = SK.rad(c, x, y - 12 * s, 2, 15 * s, [[0, '#d63a42'], [1, '#6a1218']]); c.beginPath(); c.ellipse(x, y - 12 * s, 14 * s, 14 * s, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(x - 5 * s, y - 18 * s, 6 * s, 3 * s, -0.6, 0, 7); c.fill();
  [[-14, -30, 8], [12, -31, 8.5]].forEach(p => { c.fillStyle = '#2a2430'; rr(c, x + p[0] * s - p[2] * s, y + p[1] * s, p[2] * 2 * s, 8 * s, 2 * s); c.fill(); c.fillStyle = '#efe9dc'; c.beginPath(); c.ellipse(x + p[0] * s, y + p[1] * s, p[2] * s, 3 * s, 0, 0, 7); c.fill(); c.strokeStyle = '#c9ced2'; c.lineWidth = 1.2 * s; c.stroke(); });
  const hit = Math.max(0, Math.sin(t * 7.5)), hit2 = Math.max(0, Math.sin(t * 7.5 + 2.4));
  [[-30, -36, 12, hit2], [26, -44, 14, hit]].forEach((p, i) => { c.fillStyle = '#d9b34a'; c.save(); c.translate(x + p[0] * s, y + p[1] * s); c.rotate((i ? 0.12 : -0.1) + Math.sin(t * 40) * 0.02 * p[3]); c.beginPath(); c.ellipse(0, 0, p[2] * s, 2.6 * s, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,' + (0.3 + p[3] * 0.4).toFixed(2) + ')'; c.beginPath(); c.ellipse(-2 * s, -0.6 * s, p[2] * 0.6 * s, 1 * s, 0, 0, 7); c.fill(); c.restore(); c.strokeStyle = '#9aa1a7'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x + p[0] * s, y + p[1] * s); c.lineTo(x + p[0] * s * 0.9, y - 6 * s); c.stroke(); });
}
SCENES.music = function (c, w, h, t, fr, o) {
  if (o.records) return scRecords(c, w, h, t, fr, o);
  const concert = o.kind === 'concert', s = h / 120, sy = h * 0.8, cx = w / 2;
  c.drawImage(scLayer('mus|' + (concert ? 'c' : 'm'), w, h, (g, W, H) => scStageRoom(g, W, H, concert)), 0, 0, w, h);
  const cols = ['#ffe0b0', '#ff8fc4', '#8fd4ff'];
  // moving heads: three beams that find the singer, swinging gently, with haze between
  for (let i = 0; i < 3; i++) {
    const x0 = w * (0.16 + i * 0.34), tx = cx + Math.sin(t * 0.55 + i * 2.1) * w * (0.1 + i * 0.03), tw = w * 0.15;
    SK.shaft(c, x0, h * 0.05, w * 0.012, tx, sy, tw, cols[i], 0.3);
  }
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const hx = ((hash01(i, 1, 1) + t * 0.01 * (i % 2 ? 1 : -1) + 10) % 1) * w, hy = h * (0.25 + hash01(i, 2, 1) * 0.4); c.globalAlpha = 0.08; c.drawImage(AK.glow(cols[i % 3]), hx - w * 0.2, hy - h * 0.16, w * 0.4, h * 0.32); }
  c.restore();
  // a pool of light and the singer's shadow
  c.save(); c.translate(cx, sy + 2); c.scale(1, 0.22); AK.light(c, 0, 0, w * 0.2, '#ffe9c0', 0.55); c.restore();
  if (concert) {
    scDrumKit(c, w * 0.76, h * 0.76, h / 170, t);
    drawPerson(c, w * 0.76, h * 0.7, Object.assign({}, NPC_LOOK[6], { s: s * 0.82, face: -1, moving: false, me: false }));
    drawPerson(c, w * 0.24, h * 0.76, Object.assign({}, NPC_LOOK[1], { s: s * 0.9, face: 1, moving: false, me: false }));
    c.fillStyle = '#7a3a1c'; c.save(); c.translate(w * 0.24, h * 0.76 - 13 * s); c.rotate(-0.5); rr(c, -7 * s, -3 * s, 20 * s, 6.5 * s, 3 * s); c.fill(); c.fillStyle = '#c47a3a'; c.fillRect(8 * s, -1 * s, 22 * s, 2.4 * s); c.restore();
  }
  drawPerson(c, cx, sy, Object.assign({}, o.singer || NPC_LOOK[3], { s, face: 1, moving: false, me: false }));
  // mic stand with a boom, and a guitar for the open mic
  c.strokeStyle = '#2b2f36'; c.lineWidth = 2.4 * s / 1.4; c.beginPath(); c.moveTo(cx + 13 * s, sy); c.lineTo(cx + 13 * s, sy - 30 * s); c.lineTo(cx + 7.5 * s, sy - 31.5 * s); c.stroke();
  c.fillStyle = '#c9ced3'; c.beginPath(); c.ellipse(cx + 18 * s, sy + 1, 6 * s, 1.8 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#3a4048'; c.beginPath(); c.ellipse(cx + 6.4 * s, sy - 31.8 * s, 2.8 * s, 2.2 * s, 0.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(cx + 5.6 * s, sy - 32.6 * s, 0.8 * s, 0, 7); c.fill();
  const strum = Math.sin(t * 8) * 1.2 * s;
  c.save(); c.translate(cx - 2 * s, sy - 14 * s + strum * 0.2); c.rotate(0.3);
  c.fillStyle = SK.lin(c, -9 * s, -6 * s, 9 * s, 6 * s, [[0, '#d98a44'], [1, '#8a4a22']]); c.beginPath(); c.ellipse(-3 * s, 1 * s, 8 * s, 6 * s, 0, 0, 7); c.ellipse(4 * s, 0, 5.4 * s, 4.4 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#1a0f08'; c.beginPath(); c.arc(1 * s, 0, 2 * s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-5 * s, -2 * s, 4 * s, 1.6 * s, -0.5, 0, 7); c.fill();
  c.strokeStyle = '#5a3320'; c.lineWidth = 2.6 * s; c.beginPath(); c.moveTo(8 * s, -0.5 * s); c.lineTo(26 * s, -9 * s); c.stroke(); c.strokeStyle = '#dfd5bd'; c.lineWidth = 0.5 * s; c.beginPath(); c.moveTo(0, 0); c.lineTo(26 * s, -9 * s); c.stroke();
  c.restore();
  // notes drifting up through the light
  for (let i = 0; i < 6; i++) { const k = (t * 0.22 + i / 6) % 1, x = w * (0.28 + 0.44 * hash01(i, 3, Math.floor(t * 0.22 + i / 6))) + Math.sin(t * 1.4 + i) * 8; c.globalAlpha = Math.sin(k * Math.PI) * 0.9; SK.note(c, x, h * (0.66 - k * 0.5), h / 190, i % 2 ? '#ffe9a8' : '#ffb3d6', i % 3 === 0); }
  c.globalAlpha = 1;
  scCrowd(c, w, h, t, concert ? 1.2 : 0.8, '#ffd9a0');
};
function scRecords(c, w, h, t, fr, o) {
  const s = h / 100;
  c.drawImage(scLayer('rec', w, h, (g, W, H) => {
    g.fillStyle = SK.lin(g, 0, 0, 0, H, [[0, '#2a1a1a'], [1, '#4a2f24']]); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,220,180,.05)'; for (let x = 0; x < W; x += 26) g.fillRect(x, 0, 8, H * 0.68);
    g.fillStyle = '#2a1812'; g.fillRect(W * 0.04, H * 0.2, W * 0.26, 4);
    for (let k = 0; k < 9; k++) { const bh = H * (0.1 + hash01(k, 1, 3) * 0.07); g.fillStyle = ['#7a2a3a', '#2a5a7a', '#c9a24a', '#3a7a5a', '#8a5aa0', '#c0603a'][k % 6]; g.fillRect(W * 0.05 + k * W * 0.027, H * 0.2 - bh, W * 0.022, bh); }
    g.fillStyle = '#3a8a52'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(W * 0.9 + (k - 3) * W * 0.012, H * 0.5 - Math.abs(k - 3) * 4, W * 0.013, H * 0.09, (k - 3) * 0.28, 0, 7); g.fill(); } g.fillStyle = '#e9e4d8'; rr(g, W * 0.875, H * 0.5, W * 0.05, H * 0.1, 4); g.fill();
    g.fillStyle = SK.lin(g, 0, H * 0.66, 0, H, [[0, '#8a5a38'], [1, '#4a2f1d']]); g.fillRect(0, H * 0.66, W, H * 0.34);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, H * 0.66, W, 2);
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, H * (0.7 + i * 0.03), W, 1.2); }
  }), 0, 0, w, h);
  AK.light(c, w * 0.16, h * 0.22, w * 0.5, '#ffd9a0', 0.4);
  const cx = w * 0.5, cy = h * 0.52, r = Math.min(w, h) * 0.27;
  // speakers either side, the cones pushing to the beat
  const beat = REDUCED ? 0 : Math.max(0, Math.sin(t * 7)) * 0.05;
  [[w * 0.1, 0], [w * 0.9, 1]].forEach(sp => {
    const sx = sp[0], sy = h * 0.62, sw = w * 0.13, sh = h * 0.5;
    c.fillStyle = SK.lin(c, sx - sw / 2, 0, sx + sw / 2, 0, [[0, '#5a3a24'], [0.5, '#7a5232'], [1, '#43291a']]); rr(c, sx - sw / 2, sy - sh / 2, sw, sh, 8); c.fill();
    c.fillStyle = '#1b1410'; c.beginPath(); c.arc(sx, sy + sh * 0.12, sw * 0.36 * (1 + beat), 0, 7); c.fill(); c.fillStyle = SK.rad(c, sx, sy + sh * 0.12, 1, sw * 0.3 * (1 + beat), [[0, '#6a6e74'], [1, '#2a2d31']]); c.beginPath(); c.arc(sx, sy + sh * 0.12, sw * 0.3 * (1 + beat), 0, 7); c.fill();
    c.fillStyle = '#1b1410'; c.beginPath(); c.arc(sx, sy - sh * 0.26, sw * 0.14, 0, 7); c.fill(); c.fillStyle = '#9aa0a6'; c.beginPath(); c.arc(sx, sy - sh * 0.26, sw * 0.1, 0, 7); c.fill();
  });
  // the deck: wooden plinth, platter, a record in motion with a fixed highlight, and the tonearm settling in
  SK.shadow(c, cx, cy + r * 1.1, r * 1.6, r * 0.2, 0.5);
  c.fillStyle = SK.lin(c, cx - r * 1.5, 0, cx + r * 1.5, 0, [[0, '#6b4a30'], [0.5, '#8a6240'], [1, '#5a3d27']]); rr(c, cx - r * 1.5, cy - r * 1.15, r * 3, r * 2.3, 12); c.fill();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(cx - r * 1.5 + 4, cy - r * 1.15 + 2, r * 3 - 8, 2);
  c.fillStyle = '#c3c9ce'; c.beginPath(); c.arc(cx, cy, r * 1.04, 0, 7); c.fill();
  c.fillStyle = '#0e0e10'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let i = 1; i < 14; i++) { c.beginPath(); c.arc(cx, cy, r * (0.32 + i * 0.048), 0, 7); c.stroke(); }
  c.save(); c.translate(cx, cy); c.rotate(t * 3.4); c.fillStyle = o.label || '#e76f51'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-r * 0.3, -1, r * 0.6, 2); c.fillStyle = '#fff'; c.beginPath(); c.arc(r * 0.18, 0, 2.2, 0, 7); c.fill(); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = SK.lin(c, cx - r, cy - r, cx + r, cy + r, [[0, 'rgba(255,255,255,0)'], [0.45, 'rgba(255,255,255,.2)'], [0.55, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.restore();
  c.fillStyle = '#d8dde0'; c.beginPath(); c.arc(cx, cy, 2.4, 0, 7); c.fill();
  const arm = 0.16 + clamp(fr, 0, 1) * 0.16, px = cx + r * 1.28, py = cy - r * 0.85;
  c.strokeStyle = '#c9cdd2'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.sin(arm + 0.6) * r * 1.35, py + Math.cos(arm + 0.6) * r * 1.35); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = '#2b2f36'; c.beginPath(); c.arc(px, py, 7, 0, 7); c.fill(); c.fillStyle = '#9aa1a7'; c.beginPath(); c.arc(px, py, 3, 0, 7); c.fill();
  c.fillStyle = '#20242a'; c.save(); c.translate(px - Math.sin(arm + 0.6) * r * 1.35, py + Math.cos(arm + 0.6) * r * 1.35); c.rotate(arm); rr(c, -4, -2, 8, 12, 2); c.fill(); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; AK.light(c, cx, cy, r * 1.7, '#ffcf8a', 0.14); c.restore();
  for (let i = 0; i < 5; i++) { const k = (t * 0.25 + i / 5) % 1; c.globalAlpha = Math.sin(k * Math.PI) * 0.9; SK.note(c, w * (0.3 + 0.4 * hash01(i, 3, Math.floor(t * 0.25 + i / 5))) + Math.sin(t + i) * 8, h * (0.5 - k * 0.45), s / 9, i % 2 ? '#ffe9a8' : '#ffb3d6', i % 3 === 0); }
  c.globalAlpha = 1;
  SK.motes(c, t, w * 0.05, 0, w * 0.6, h * 0.8, 24, 4, '#ffe3b0', 0.6);
}
