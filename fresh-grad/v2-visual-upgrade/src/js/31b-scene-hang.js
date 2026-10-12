/* ---------------------------- hanging out with a friend: one little set per place ---------------------------- */
function scHangRoom(g, w, h, place) {
  const wallH = h * 0.7;
  const floor = (a, b, plank) => {
    g.fillStyle = SK.lin(g, 0, wallH, 0, h, [[0, a], [1, b]]); g.fillRect(0, wallH, w, h - wallH);
    if (plank) { g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.2; for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.03, wallH); g.lineTo(w / 2 + i * w * 0.14, h); g.stroke(); } }
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, wallH, w, 2);
  };
  if (place === 'cafe') {
    g.fillStyle = SK.lin(g, 0, 0, 0, wallH, [[0, '#2f1f18'], [1, '#5a3a28']]); g.fillRect(0, 0, w, wallH);
    for (let x = 0; x < w; x += 34) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x, 0, 2, wallH); g.fillStyle = 'rgba(255,220,180,.06)'; g.fillRect(x + 2, 0, 3, wallH); }
    g.fillStyle = '#25382f'; rr(g, w * 0.08, h * 0.12, w * 0.24, h * 0.34, 5); g.fill(); g.strokeStyle = '#a06f3f'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = 'rgba(244,241,230,.75)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w * 0.11, h * (0.17 + i * 0.055)); g.lineTo(w * (0.18 + hash01(i, 1, 1) * 0.1), h * (0.17 + i * 0.055)); g.stroke(); g.fillStyle = 'rgba(244,241,230,.7)'; g.fillRect(w * 0.285, h * (0.162 + i * 0.055), w * 0.02, 2.4); } g.lineCap = 'butt';
    g.fillStyle = '#10181a'; rr(g, w * 0.66, h * 0.1, w * 0.26, h * 0.4, 5); g.fill(); g.fillStyle = SK.lin(g, 0, h * 0.1, 0, h * 0.5, [[0, '#1c2c3c'], [1, '#34505a']]); g.fillRect(w * 0.67, h * 0.115, w * 0.24, h * 0.37);
    for (let i = 0; i < 18; i++) AK.light(g, w * (0.68 + hash01(i, 1, 2) * 0.22), h * (0.14 + hash01(i, 2, 2) * 0.3), 6 + hash01(i, 3, 2) * 12, ['#ffd27a', '#ff9a6a', '#9fd8ff'][i % 3], 0.5);
    g.fillStyle = '#10181a'; g.fillRect(w * 0.78 - 2, h * 0.1, 4, h * 0.4);
    floor('#7a5232', '#3a2416', true);
  } else if (place === 'pizza') {
    g.fillStyle = '#8a3a2c'; g.fillRect(0, 0, w, wallH);
    for (let r = 0; r < 14; r++) for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(' + (hash01(k, r, 5) > 0.5 ? '255,200,170' : '60,10,5') + ',' + (0.05 + hash01(k, r, 6) * 0.08).toFixed(2) + ')'; g.fillRect(k * w / 13 + (r % 2) * w / 26 - w / 26, r * wallH / 14, w / 13 - 2, wallH / 14 - 2); }
    g.fillStyle = '#2a1410'; g.beginPath(); g.moveTo(w * 0.04, wallH); g.lineTo(w * 0.04, h * 0.26); g.quadraticCurveTo(w * 0.15, h * 0.12, w * 0.26, h * 0.26); g.lineTo(w * 0.26, wallH); g.closePath(); g.fill();
    g.fillStyle = '#e0e0d8'; g.strokeStyle = '#5a4a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.035, wallH); g.lineTo(w * 0.035, h * 0.255); g.quadraticCurveTo(w * 0.15, h * 0.1, w * 0.265, h * 0.255); g.lineTo(w * 0.265, wallH); g.stroke();
    g.strokeStyle = '#ff6b4a'; g.lineWidth = 3.4; g.shadowColor = '#ff5a3a'; g.shadowBlur = 16; g.beginPath(); g.moveTo(w * 0.64, h * 0.1); g.lineTo(w * 0.76, h * 0.1); g.lineTo(w * 0.7, h * 0.28); g.closePath(); g.stroke(); g.fillStyle = '#ffd166'; g.shadowColor = '#ffd166'; g.beginPath(); g.arc(w * 0.69, h * 0.14, 3, 0, 7); g.arc(w * 0.72, h * 0.12, 2.6, 0, 7); g.arc(w * 0.7, h * 0.19, 3, 0, 7); g.fill(); g.shadowBlur = 0;
    for (let i = 0; i < 9; i++) { const lx = w * (0.3 + i * 0.07), ly = h * (0.06 + Math.sin(i * 1.3) * 0.015 + 0.02); g.strokeStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(lx, ly - 4); g.lineTo(lx + w * 0.07, ly); g.stroke(); AK.light(g, lx, ly + 3, 10, '#ffd9a0', 0.8); g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(lx, ly + 3, 2.4, 0, 7); g.fill(); }
    floor('#6a4630', '#2a1a12', true);
  } else if (place === 'diner') {
    g.fillStyle = '#2b5a60'; g.fillRect(0, 0, w, wallH); g.fillStyle = '#d7dcdf'; g.fillRect(0, h * 0.34, w, 6); g.fillStyle = SK.lin(g, 0, h * 0.34, 0, wallH, [[0, '#c9473f'], [1, '#8a2a28']]); g.fillRect(0, h * 0.34 + 6, w, wallH - h * 0.34 - 6);
    for (let x = 0; x < w; x += 26) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, h * 0.34 + 6, 2, wallH); }
    g.fillStyle = '#10181a'; rr(g, w * 0.34, h * 0.08, w * 0.32, h * 0.22, 5); g.fill(); g.fillStyle = SK.lin(g, 0, h * 0.08, 0, h * 0.3, [[0, '#14283c'], [1, '#2e4a58']]); g.fillRect(w * 0.345, h * 0.09, w * 0.31, h * 0.2);
    for (let i = 0; i < 12; i++) AK.light(g, w * (0.36 + hash01(i, 1, 3) * 0.28), h * (0.12 + hash01(i, 2, 3) * 0.14), 5 + hash01(i, 3, 3) * 9, ['#ffd27a', '#ff9a6a', '#9fd8ff'][i % 3], 0.5);
    g.fillStyle = '#2a2a30'; rr(g, w * 0.04, h * 0.1, w * 0.16, h * 0.56, 10); g.fill(); g.fillStyle = '#d4a017'; g.beginPath(); g.arc(w * 0.12, h * 0.2, w * 0.07, Math.PI, 0); g.fill(); g.fillStyle = '#ff7eb6'; g.fillRect(w * 0.06, h * 0.3, w * 0.12, h * 0.05); g.fillStyle = '#6fd1ff'; g.fillRect(w * 0.06, h * 0.38, w * 0.12, h * 0.05); g.fillStyle = '#ffd166'; g.fillRect(w * 0.06, h * 0.46, w * 0.12, h * 0.05);
    for (let r = 0; r < 8; r++) { const y0 = wallH + (h - wallH) * Math.pow(r / 8, 1.3), y1 = wallH + (h - wallH) * Math.pow((r + 1) / 8, 1.3), sc = 1 + r * 0.3, sc1 = 1 + (r + 1) * 0.3; for (let k = -9; k < 11; k++) { g.fillStyle = (k + r) % 2 ? '#202228' : '#eaeaea'; g.beginPath(); g.moveTo(w / 2 + k * w * 0.08 * sc, y0); g.lineTo(w / 2 + (k + 1) * w * 0.08 * sc, y0); g.lineTo(w / 2 + (k + 1) * w * 0.08 * sc1, y1); g.lineTo(w / 2 + k * w * 0.08 * sc1, y1); g.closePath(); g.fill(); } }
    g.fillStyle = '#1f6a72'; rr(g, w * 0.2, h * 0.4, w * 0.6, h * 0.34, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, w * 0.21, h * 0.41, w * 0.58, h * 0.03, 5); g.fill();
  } else if (place === 'books') {
    g.fillStyle = SK.lin(g, 0, 0, 0, wallH, [[0, '#241c2c'], [1, '#463654']]); g.fillRect(0, 0, w, wallH);
    for (let side = 0; side < 2; side++) for (let row = 0; row < 4; row++) {
      const y = h * (0.06 + row * 0.16), x0 = side ? w * 0.68 : 0;
      for (let k = 0; k < 17; k++) { const bw = w * 0.012 + hash01(k, row, side) * w * 0.008, bx = x0 + k * w * 0.0188, bh = h * (0.08 + hash01(k, row, 9 + side) * 0.05); g.fillStyle = ['#7a2a3a', '#2a5a7a', '#c9a24a', '#3a7a5a', '#8a5aa0', '#c0603a', '#e9e0cf'][Math.floor(hash01(k, row, 5 + side) * 7)]; g.fillRect(bx, y + h * 0.14 - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(bx, y + h * 0.14 - bh, 1, bh); }
      g.fillStyle = '#2a1c14'; g.fillRect(x0, y + h * 0.14, w * 0.32, 4);
    }
    g.fillStyle = SK.lin(g, 0, h * 0.1, 0, wallH, [[0, 'rgba(255,220,160,0)'], [1, 'rgba(255,220,160,.12)']]); g.fillRect(w * 0.32, h * 0.1, w * 0.36, h * 0.6);
    g.fillStyle = '#8a3a3a'; g.beginPath(); g.ellipse(w / 2, h * 0.82, w * 0.3, h * 0.06, 0, 0, 7); g.fill(); floor('#5a3d27', '#2a1a12', true);
    g.fillStyle = '#8a3a3a'; g.beginPath(); g.ellipse(w / 2, h * 0.86, w * 0.3, h * 0.07, 0, 0, 7); g.fill(); g.strokeStyle = '#d4a017'; g.lineWidth = 2; g.stroke();
  } else if (place === 'park') {
    g.fillStyle = SK.lin(g, 0, 0, 0, wallH, [[0, '#6fb8e6'], [1, '#dcf0e4']]); g.fillRect(0, 0, w, wallH);
    for (let i = 0; i < 7; i++) { const tx = w * (0.03 + i * 0.16 + hash01(i, 4, 4) * 0.04), tr = h * (0.14 + hash01(i, 5, 5) * 0.08); g.fillStyle = '#5a3d27'; g.fillRect(tx - 3, h * 0.3, 6, h * 0.4); ['#2e7a48', '#3f9458', '#58ae68'].forEach((cc, k) => { g.fillStyle = cc; g.beginPath(); g.arc(tx + (k - 1) * tr * 0.5, h * 0.3 - k * 3, tr * (0.85 - k * 0.1), 0, 7); g.fill(); }); }
    g.fillStyle = SK.lin(g, 0, wallH - h * 0.1, 0, h, [[0, '#4f9d58'], [1, '#2f6a3a']]); g.fillRect(0, wallH - h * 0.1, w, h);
    g.fillStyle = '#cdb98a'; g.beginPath(); g.moveTo(w * 0.35, h); g.lineTo(w * 0.47, wallH - h * 0.1); g.lineTo(w * 0.53, wallH - h * 0.1); g.lineTo(w * 0.65, h); g.closePath(); g.fill();
    // the fountain's basin; the spray is live
    g.fillStyle = '#8fb7c9'; g.beginPath(); g.ellipse(w * 0.5, h * 0.6, w * 0.1, h * 0.04, 0, 0, 7); g.fill(); g.fillStyle = '#c9d6dc'; g.beginPath(); g.ellipse(w * 0.5, h * 0.585, w * 0.1, h * 0.035, 0, Math.PI, 0); g.fill(); g.fillStyle = '#a6c9da'; g.beginPath(); g.ellipse(w * 0.5, h * 0.59, w * 0.085, h * 0.028, 0, 0, 7); g.fill(); g.fillStyle = '#b6c3ca'; g.fillRect(w * 0.495, h * 0.5, w * 0.01, h * 0.09);
    g.fillStyle = '#7a5232'; rr(g, w * 0.14, h * 0.62, w * 0.2, 7, 3); g.fill(); g.fillRect(w * 0.15, h * 0.62, 4, h * 0.1); g.fillRect(w * 0.32, h * 0.62, 4, h * 0.1); g.fillStyle = '#8a6240'; g.fillRect(w * 0.14, h * 0.56, w * 0.2, 5);
  } else if (place === 'bakery') {
    g.fillStyle = SK.lin(g, 0, 0, 0, wallH, [[0, '#f6e0c8'], [1, '#e8c39c']]); g.fillRect(0, 0, w, wallH);
    for (let x = 0; x < w; x += 26) { g.fillStyle = (x / 26) % 2 ? '#e8603c' : '#fff6e8'; g.fillRect(x, 0, 26, h * 0.1); }
    g.fillStyle = SK.lin(g, 0, h * 0.1, 0, h * 0.14, [[0, 'rgba(0,0,0,.25)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, h * 0.1, w, h * 0.04);
    g.fillStyle = '#9b6a3a'; g.fillRect(0, h * 0.55, w, h * 0.17); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, h * 0.55, w, 3);
    g.fillStyle = 'rgba(200,235,255,.28)'; g.fillRect(w * 0.04, h * 0.3, w * 0.58, h * 0.26); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.strokeRect(w * 0.04, h * 0.3, w * 0.58, h * 0.26);
    for (let i = 0; i < 9; i++) { const px = w * (0.07 + (i % 5) * 0.11), py = h * (i < 5 ? 0.5 : 0.42); g.fillStyle = ['#d9a066', '#f4d9a0', '#c0784a', '#f2b8c8', '#d9a066'][i % 5]; g.beginPath(); g.ellipse(px, py, w * 0.03, h * 0.035, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(px - 4, py - 4, w * 0.012, h * 0.01, -0.4, 0, 7); g.fill(); }
    g.fillStyle = '#5a3d27'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w * (0.72 + i * 0.07), h * 0.27 + (i % 2) * 14, w * 0.03, h * 0.05, 0.3, 0, 7); g.fill(); g.fillStyle = '#c9884a'; g.beginPath(); g.ellipse(w * (0.72 + i * 0.07), h * 0.265 + (i % 2) * 14, w * 0.025, h * 0.04, 0.3, 0, 7); g.fill(); g.fillStyle = '#5a3d27'; }
    floor('#c9a070', '#8a6038', false);
    for (let r = 0; r < 6; r++) for (let k = -8; k < 10; k++) { g.fillStyle = (k + r) % 2 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)'; g.fillRect(w / 2 + k * w * 0.09, wallH + r * (h - wallH) / 6, w * 0.09, (h - wallH) / 6); }
  } else {
    // cinema lobby
    g.fillStyle = SK.lin(g, 0, 0, 0, wallH, [[0, '#1a0a14'], [1, '#3a1624']]); g.fillRect(0, 0, w, wallH);
    [[0.1, '#ff9f43', '#c0392b'], [0.36, '#4cc9f0', '#274a9a'], [0.62, '#c77dff', '#6a2a9a']].forEach((p, i) => { g.fillStyle = '#0a0508'; g.fillRect(w * p[0] - 4, h * 0.08 - 4, w * 0.22 + 8, h * 0.4 + 8); g.fillStyle = SK.lin(g, 0, h * 0.08, 0, h * 0.48, [[0, p[1]], [1, p[2]]]); g.fillRect(w * p[0], h * 0.08, w * 0.22, h * 0.4); g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(w * p[0], h * 0.48); for (let k = 0; k <= 8; k++) g.lineTo(w * p[0] + w * 0.22 * k / 8, h * (0.4 + 0.04 * Math.sin(k + i * 2))); g.lineTo(w * p[0] + w * 0.22, h * 0.48); g.closePath(); g.fill(); AK.light(g, w * (p[0] + 0.11), h * 0.28, w * 0.18, p[1], 0.18); });
    for (let i = 0; i < 16; i++) { const bx = w * (0.04 + i * 0.062); AK.light(g, bx, h * 0.04, 8, '#ffe2a0', 0.8); g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(bx, h * 0.04, 2.2, 0, 7); g.fill(); }
    g.fillStyle = SK.lin(g, 0, wallH, 0, h, [[0, '#6a0f24'], [1, '#2a0610']]); g.fillRect(0, wallH, w, h - wallH); g.fillStyle = '#d4a017'; g.fillRect(w * 0.12, wallH, 3, h - wallH); g.fillRect(w * 0.88, wallH, 3, h - wallH);
  }
}
function scMugs(c, x, y, s, t, steam) {
  [-1, 1].forEach(sd => {
    const mx = x + sd * 11 * s;
    c.fillStyle = SK.lin(c, mx - 6 * s, 0, mx + 6 * s, 0, [[0, '#d8d1c0'], [0.4, '#fbf6ea'], [1, '#b9b19e']]); rr(c, mx - 5.5 * s, y - 8 * s, 11 * s, 9 * s, 2.2 * s); c.fill();
    c.strokeStyle = '#ece6d6'; c.lineWidth = 1.4 * s; c.beginPath(); c.arc(mx + 6.4 * s, y - 3.6 * s, 2.6 * s, -1.3, 1.3); c.stroke();
    c.fillStyle = '#6a4630'; c.beginPath(); c.ellipse(mx, y - 7.6 * s, 4.8 * s, 1.2 * s, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,240,220,.7)'; c.beginPath(); c.ellipse(mx, y - 7.6 * s, 2.2 * s, 0.6 * s, 0, 0, 7); c.fill();
    if (steam) SK.steam(c, mx, y - 9 * s, t + sd, s * 0.6, '#fff', 2);
  });
}
function scHangProps(c, w, h, t, place, ty, s) {
  const tw = w * 0.28, tx = w * 0.36, tyy = ty - 15 * s;
  if (place === 'park') {
    // a fountain spray with falling drops
    for (let i = 0; i < 18; i++) { const a = (i / 18) * 2 - 1, k = (t * 0.9 + hash01(i, 1, 1)) % 1, px = w * 0.5 + a * w * 0.07 * Math.min(1, k * 1.6), py = h * 0.5 + (k * k * 1.2 - k) * h * 0.09 * (1 - Math.abs(a) * 0.4) + k * h * 0.07; c.fillStyle = 'rgba(210,240,255,' + (0.8 * (1 - k * 0.4)).toFixed(2) + ')'; c.beginPath(); c.arc(px, py, 1.5, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(210,240,255,.4)'; c.beginPath(); c.ellipse(w * 0.5, h * 0.592, w * (0.04 + 0.01 * Math.sin(t * 2)), h * 0.012, 0, 0, 7); c.fill();
    for (let i = 0; i < 7; i++) { const k = (t * 0.07 + hash01(i, 2, 2)) % 1, lx = w * k, ly = h * (0.2 + hash01(i, 3, 2) * 0.5) + Math.sin(t * 2 + i) * 10; c.fillStyle = WINTER() ? 'rgba(255,255,255,.85)' : season() === 'autumn' ? '#d9822b' : season() === 'spring' ? '#ffc8da' : '#f6f1c0'; c.beginPath(); c.ellipse(lx, ly, 3, 1.6, t + i, 0, 7); c.fill(); }
    return;
  }
  // a small table for two
  c.fillStyle = 'rgba(8,12,24,.25)'; c.beginPath(); c.ellipse(w / 2, ty + 2, tw * 0.7, 6, 0, 0, 7); c.fill();
  const cloth = place === 'pizza' ? 'checker' : place === 'diner' ? '#d7dcdf' : place === 'bakery' ? '#fff6e8' : place === 'cinema' ? '#3a1624' : '#7a5232';
  c.fillStyle = '#5a3d27'; c.fillRect(w * 0.49, tyy + 5 * s, w * 0.02, 10 * s);
  if (cloth === 'checker') { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#c0392b' : '#fff6e8'; c.fillRect(tx + i * tw / 8, tyy + j * 4 * s, tw / 8, 4 * s); } }
  else { c.fillStyle = cloth; rr(c, tx, tyy, tw, 8 * s, 4 * s); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(tx + 3, tyy, tw - 6, 1.6); }
  if (place === 'cafe' || place === 'bakery' || place === 'diner' || place === 'books') scMugs(c, w / 2, tyy, s, t, place !== 'diner');
  if (place === 'pizza') { c.fillStyle = '#c9a06a'; c.beginPath(); c.ellipse(w / 2, tyy - 1 * s, 14 * s, 4 * s, 0, 0, 7); c.fill(); c.fillStyle = '#e8a23a'; c.beginPath(); c.ellipse(w / 2, tyy - 2 * s, 12 * s, 3.2 * s, 0, 0, 7); c.fill(); c.fillStyle = '#c0392b'; [[-6, -2.4], [0, -3.2], [6, -2.2], [-3, -1.2], [3, -1.4]].forEach(p => { c.beginPath(); c.ellipse(w / 2 + p[0] * s, tyy + p[1] * s, 2 * s, 0.7 * s, 0, 0, 7); c.fill(); }); SK.steam(c, w / 2, tyy - 5 * s, t, s * 0.7, '#fff', 3); }
  if (place === 'cinema') { c.fillStyle = '#d2392c'; c.beginPath(); c.moveTo(w / 2 - 8 * s, tyy - 12 * s); c.lineTo(w / 2 + 8 * s, tyy - 12 * s); c.lineTo(w / 2 + 6 * s, tyy); c.lineTo(w / 2 - 6 * s, tyy); c.closePath(); c.fill(); c.fillStyle = '#fff6e8'; for (let i = 0; i < 3; i++) c.fillRect(w / 2 - 7 * s + i * 5 * s, tyy - 12 * s, 2.4 * s, 12 * s); c.fillStyle = '#ffe9a8'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(w / 2 + (i - 3) * 2.4 * s, tyy - 13.5 * s - (i % 2) * 2 * s, 2.6 * s, 0, 7); c.fill(); } }
  if (place === 'diner') { [-8, 8].forEach(sd => { c.fillStyle = 'rgba(255,255,255,.4)'; rr(c, w / 2 + sd * s - 2.4 * s, tyy - 14 * s, 4.8 * s, 14 * s, 1.4 * s); c.fill(); c.fillStyle = '#ff9ec8'; c.fillRect(w / 2 + sd * s - 2.2 * s, tyy - 8 * s, 4.4 * s, 8 * s); c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2 + sd * s, tyy - 14.5 * s, 3 * s, 0, 7); c.fill(); c.strokeStyle = '#e8603c'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2 + sd * s + 1, tyy - 14 * s); c.lineTo(w / 2 + sd * s + 3, tyy - 20 * s); c.stroke(); }); }
  if (place === 'pizza') { const fl = 0.6 + 0.4 * Math.sin(t * 9) * Math.sin(t * 5.3); AK.light(c, w * 0.15, h * 0.6, w * 0.16, '#ff8a3d', 0.55 * fl); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#ffb347' : '#ff7a3d'; c.beginPath(); c.moveTo(w * 0.09 + i * w * 0.018, h * 0.68); c.quadraticCurveTo(w * 0.1 + i * w * 0.018 + Math.sin(t * 8 + i) * 3, h * (0.6 - 0.02 * fl), w * 0.11 + i * w * 0.018, h * 0.68); c.fill(); } }
  if (place === 'cafe') { for (let i = 0; i < 3; i++) { const lx = w * (0.3 + i * 0.2); c.strokeStyle = '#1a1210'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, h * 0.12); c.stroke(); c.fillStyle = '#c0834a'; c.beginPath(); c.moveTo(lx - 12, h * 0.17); c.lineTo(lx + 12, h * 0.17); c.lineTo(lx + 6, h * 0.12); c.lineTo(lx - 6, h * 0.12); c.closePath(); c.fill(); AK.light(c, lx, h * 0.2, w * 0.1, '#ffd9a0', 0.4 + 0.03 * Math.sin(t * 2 + i)); } }
  if (place === 'bakery') SK.motes(c, t, w * 0.05, h * 0.1, w * 0.95, h * 0.9, 24, 12, '#fff6e0', 0.55);
  if (place === 'diner') { const nf = 0.8 + 0.2 * Math.sin(t * 20) * (Math.sin(t * 0.7) > 0.95 ? 1 : 0); AK.light(c, w * 0.12, h * 0.4, w * 0.12, '#ff7eb6', 0.35 * nf); }
}
function scBubble(c, x, y, k, s, flip) {
  const e = Math.min(1, k * 7), sc = 0.7 + 0.3 * (1 - Math.pow(1 - e, 3)), bw = 34 * s, bh = 22 * s;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha = Math.min(1, e * 1.3);
  c.fillStyle = 'rgba(8,12,24,.3)'; rr(c, -bw + 2, -bh + 4, bw * 2, bh * 1.5, 14 * s); c.fill();
  c.fillStyle = '#ffffff'; rr(c, -bw, -bh * 1.2, bw * 2, bh * 1.5, 14 * s); c.fill();
  c.beginPath(); c.moveTo(-5 * s, bh * 0.3 - 1); c.lineTo(6 * s, bh * 0.3 - 1); c.lineTo(flip * 9 * s, bh * 0.3 + 11 * s); c.closePath(); c.fill();
  c.restore();
}
function scHang(c, w, h, t, fr, o) {
  const place = o.place || 'cafe', s = h / 110, ty = h * 0.86;
  c.drawImage(scLayer('hang|' + place + artSceneTag(o), w, h, (g, W, H) => artSceneBg(g, W, H, o) || scHangRoom(g, W, H, place)), 0, 0, w, h);
  AK.light(c, w * 0.5, -h * 0.1, w * 0.5, place === 'park' ? '#fff6d0' : '#ffd9a0', place === 'park' ? 0.22 : 0.26);
  scHangProps(c, w, h, t, place, ty, s);
  const turn = Math.floor(t / 1.6) % 2, k = (t % 1.6) / 1.6, hop = (who) => (who === turn ? -Math.abs(Math.sin(t * 7)) * 0.9 * s * (k < 0.8 ? 1 : 0) : 0);
  drawPerson(c, w * 0.34, ty + hop(0), Object.assign({}, PLAYER_LOOK, { s, face: 1, moving: false, me: false }));
  drawPerson(c, w * 0.66, ty + hop(1), Object.assign({}, o.friend, { s, face: -1, moving: false, me: false }));
  // speech bubbles take turns; the icon changes every few seconds
  const bu = h / 428, bxp = turn ? w * 0.66 : w * 0.34, byp = ty - 56 * s, ic = Math.floor(t / 3.2) % 3, cx = bxp + (turn ? -2 : 2) * bu;
  scBubble(c, cx, byp, k, bu, turn ? 1 : -1);
  c.globalAlpha = Math.min(1, k * 7);
  if (ic === 0) { c.fillStyle = '#3a4a62'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(cx + i * 11 * bu, byp - 4 * bu - Math.sin(t * 6 + i) * 1.6 * bu, 3.8 * bu, 0, 7); c.fill(); } }
  else if (ic === 1) SK.heart(c, cx, byp - 3 * bu, bu * 1.1, '#ff7eb6');
  else { c.fillStyle = '#c98a00'; c.font = '800 ' + Math.round(18 * bu) + 'px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ha ha', cx, byp - 4 * bu); }
  c.globalAlpha = 1;
  if (place === 'cinema') AK.light(c, w * 0.5, h * 0.3, w * 0.4, '#ffd9a0', 0.12);
  SK.motes(c, t, 0, 0, w, h, 22, 14, '#ffffff', 0.35);
}
