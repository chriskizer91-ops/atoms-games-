/* ============================ the fishing view ============================
   A lit, layered pond: sky and sun or moon from the real time of day, hazy far hills and two rows of trees (painted once, then tinted by the
   ambient colour), water with depth, rippled reflections, sun glints, lily pads, reeds, fish moving under the surface, a believable rod,
   line and bobber with splash rings, and the two meters. Ice fishing swaps the water for ice, a hole and snow. All of it is drawing only. */
const FD = { last: '', fx: [], t: 0, puff: 0, ripples: [] };
function fvTrees(g, w, h, hz, se, ice) {
  const hill = (col, base, amp, seed, alpha) => { g.fillStyle = col; g.globalAlpha = alpha; g.beginPath(); g.moveTo(0, hz); for (let i = 0; i <= 24; i++) g.lineTo(w * i / 24, hz - base - amp * (0.5 + 0.5 * Math.sin(i * 0.7 + seed)) - amp * 0.5 * Math.sin(i * 1.9 + seed * 2)); g.lineTo(w, hz); g.closePath(); g.fill(); g.globalAlpha = 1; };
  hill(ice ? '#c9d9e6' : '#6f9bb0', h * 0.1, h * 0.07, 1, 0.55); hill(ice ? '#bccfdf' : '#5a8a8c', h * 0.05, h * 0.05, 4, 0.7);
  const tc = ice ? ['#c9d6e2', '#e3ebf3', '#b8c8d8'] : se === 'autumn' ? ['#c0502a', '#e7b24a', '#d9822b', '#a8432a'] : se === 'spring' ? ['#3f8a52', '#e58aa6', '#4fa565', '#f5c6d4'] : ['#2f7d4f', '#3f8a52', '#4fa565', '#2a6e48'];
  if (ice) {
    // firs behind, bare snowy trees in front
    for (let i = 0; i < 26; i++) {
      const x = (i + hash01(i, 1, 3) * 0.7) * w / 25, fh = (30 + hash01(i, 2, 3) * 26) * (h / 480), base = hz - 3;
      g.fillStyle = '#4a5e66'; g.globalAlpha = 0.75;
      for (let k = 0; k < 4; k++) { const ty = base - fh * (k * 0.26), tw2 = fh * (0.5 - k * 0.09); g.beginPath(); g.moveTo(x, ty - fh * 0.34); g.lineTo(x + tw2, ty); g.lineTo(x - tw2, ty); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x, ty - fh * 0.34); g.lineTo(x + tw2 * 0.62, ty - fh * 0.1); g.quadraticCurveTo(x, ty - fh * 0.2, x - tw2 * 0.62, ty - fh * 0.1); g.closePath(); g.fill(); g.fillStyle = '#4a5e66'; }
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 12; i++) {
      const x = (i + hash01(i, 4, 3) * 0.8) * w / 11, th = (46 + hash01(i, 5, 3) * 34) * (h / 480), base = hz - 1;
      g.strokeStyle = '#4a4650'; g.lineCap = 'round'; g.lineWidth = 4 * (h / 480); g.beginPath(); g.moveTo(x, base); g.lineTo(x + (hash01(i, 6, 3) - 0.5) * 6, base - th * 0.6); g.stroke();
      const tip = (px, py, ang, len, lw, d) => { const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len; g.lineWidth = lw; g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke(); if (d > 0) { tip(ex, ey, ang - 0.5 - hash01(Math.round(px), d, 1) * 0.3, len * 0.7, lw * 0.7, d - 1); tip(ex, ey, ang + 0.5 + hash01(Math.round(py), d, 2) * 0.3, len * 0.7, lw * 0.7, d - 1); } else { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(ex, ey - 1, 3.4, 1.7, 0, 0, 7); g.fill(); } };
      tip(x, base - th * 0.6, -Math.PI / 2, th * 0.42, 3 * (h / 480), 3);
    }
    g.lineCap = 'butt';
  } else for (let row = 0; row < 2; row++) {
    const n = row ? 15 : 22, hazy = row === 0;
    for (let i = 0; i < n; i++) {
      const x = (i + hash01(i, row, 3) * 0.6) * w / (n - 1) - 10, rr2 = (hazy ? 14 : 22) * (h / 480) + hash01(i, 2 + row, 3) * (hazy ? 12 : 18) * (h / 480), base = hz - (hazy ? 4 : 2) - row * 0;
      if (!hazy) { g.fillStyle = ice ? '#5b5a64' : '#4a3322'; g.fillRect(x - 2.2, base - rr2 * 0.9, 4.4, rr2 * 0.9 + 2); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x - 2.2, base - rr2 * 0.9, 1.4, rr2 * 0.9); }
      const col = tc[Math.floor(hash01(i, 5 + row, 7) * tc.length)];
      for (let k = 0; k < 3; k++) {
        const cx = x + (k - 1) * rr2 * 0.55, cy = base - rr2 * (hazy ? 0.7 : 1.15) + (k === 1 ? -rr2 * 0.22 : 0), r = rr2 * (k === 1 ? 1 : 0.78);
        const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
        gr.addColorStop(0, shade(col, hazy ? 0.05 : 0.28)); gr.addColorStop(0.65, col); gr.addColorStop(1, shade(col, -0.34));
        g.globalAlpha = hazy ? 0.7 : 1; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.globalAlpha = 1;
        if (ice && !hazy) { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(cx, cy - r * 0.45, r * 0.7, r * 0.28, 0, 0, 7); g.fill(); }
      }
    }
  }
  // the bank: grass or snow, with stones
  g.fillStyle = SK.lin(g, 0, hz - 6, 0, hz + 7, [[0, ice ? '#f4f8fb' : '#78b45c'], [0.5, ice ? '#dde7ee' : '#4f8f45'], [1, ice ? '#aebfcc' : '#2f5a30']]); g.fillRect(0, hz - 5, w, 12);
  for (let i = 0; i < 26; i++) { const sx = w * hash01(i, 8, 1), sw = 4 + hash01(i, 9, 1) * 8; g.fillStyle = ice ? 'rgba(150,170,190,.55)' : 'rgba(90,86,76,.7)'; g.beginPath(); g.ellipse(sx, hz + 3, sw, 2.4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(sx - 1, hz + 2, sw * 0.6, 1, 0, 0, 7); g.fill(); }
  if (se === 'spring') for (let i = 0; i < 24; i++) { g.fillStyle = ['#fff', '#ffd1e6', '#ffe58a'][i % 3]; g.beginPath(); g.arc(w * hash01(i, 11, 1), hz - 2 + hash01(i, 12, 1) * 5, 1.5, 0, 7); g.fill(); }
}
function fvCloud(c, x, y, s, a, col) {
  c.save(); c.globalAlpha = a; c.fillStyle = col;
  [[0, 0, 22], [22, -5, 17], [-22, -3, 15], [40, 3, 11], [-38, 4, 10], [8, -12, 14]].forEach(p => { c.beginPath(); c.arc(x + p[0] * s, y + p[1] * s, p[2] * s, 0, 7); c.fill(); });
  c.globalAlpha = a * 0.5; c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x + 4 * s, y - 14 * s, 10 * s, 0, 7); c.arc(x - 16 * s, y - 6 * s, 8 * s, 0, 7); c.fill();
  c.restore();
}
function fvFishShadow(c, x, y, s, a, dir, ph) {
  c.save(); c.translate(x, y); c.scale(dir * s, s); c.fillStyle = 'rgba(6,28,48,' + a.toFixed(3) + ')';
  c.beginPath(); c.moveTo(-14, 0); c.bezierCurveTo(-10, -5.5, 2, -6, 9, -1.4); c.lineTo(17 + Math.sin(ph) * 2, -6 + Math.sin(ph) * 2); c.quadraticCurveTo(14, 0, 17 + Math.sin(ph) * 2, 6 + Math.sin(ph) * 2); c.lineTo(9, 1.4); c.bezierCurveTo(2, 6, -10, 5.5, -14, 0); c.fill();
  c.restore();
}
function fvSplash(x, y, big) {
  if (REDUCED) return;
  FD.fx.push({ k: 'ring', x, y, t: 0, max: big ? 1.1 : 0.8, r: big ? 46 : 28 }, { k: 'ring', x, y, t: -0.12, max: big ? 1.1 : 0.8, r: big ? 66 : 38 });
  const n = big ? 14 : 8;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, v = 80 + Math.random() * (big ? 170 : 100); FD.fx.push({ k: 'drop', x, y, vx: Math.cos(a) * v * 0.5, vy: Math.sin(a) * v, t: 0, max: 0.6 + Math.random() * 0.3 }); }
}
function fishView(dt) {
  const cv = $('#fishCv'); if (!cv) return;
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext('2d'), w = r.width, h = r.height, tm = REDUCED ? 0 : FX.time, ice = WINTER(), se = season(), u = h / 480;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  FD.t += dt || 0.016;
  const A = FX.A || skyAt(S.t, S.day), hz = h * 0.34, night = A.nf > 0.5, amb = A.amb;
  const cloudy = A.cloud > 0.2;
  // ---- sky, stars, sun or moon
  c.fillStyle = SK.lin(c, 0, 0, 0, hz, [[0, rgbS(A.top)], [1, rgbS(A.bot)]]); c.fillRect(0, 0, w, hz + 2);
  if (A.star > 0.02) for (let i = 0; i < 46; i++) { const tw = 0.5 + 0.5 * Math.sin(tm * 1.7 + i * 2.1); c.fillStyle = 'rgba(255,255,255,' + (A.star * (0.35 + 0.55 * tw)).toFixed(3) + ')'; c.fillRect(hash01(i, 1, 2) * w, hash01(i, 3, 4) * hz * 0.85, 1.3, 1.3); }
  let sx, sy;
  if (A.sunUp) { sx = w * (0.5 - A.sunX * 0.36); sy = hz * (0.86 - A.el * 0.66); } else { const mf = clamp(A.mf, 0, 1); sx = w * (0.88 - mf * 0.76); sy = hz * (0.88 - Math.sin(mf * Math.PI) * 0.7); }
  if (A.sunUp) { AK.light(c, sx, sy, 130 * u + 40, A.warm > 0.5 ? '#ffb070' : '#fff0c0', 0.5 * (1 - A.cloud * 0.7)); c.fillStyle = A.warm > 0.5 ? '#ffe2b0' : '#fff7d6'; c.beginPath(); c.arc(sx, sy, 12 * u + 2, 0, 7); c.fill(); }
  else if (night) { AK.light(c, sx, sy, 80 * u + 24, '#cfd8ff', 0.4 * (1 - A.cloud)); c.fillStyle = '#f4f1dc'; c.beginPath(); c.arc(sx, sy, 12 * u + 2, 0, 7); c.fill(); c.fillStyle = 'rgba(160,170,190,.35)'; [[-3, -2, 3], [3, 3, 2.4], [-1, 4, 1.6]].forEach(q => { c.beginPath(); c.arc(sx + q[0] * u, sy + q[1] * u, q[2] * u, 0, 7); c.fill(); }); }
  const cc = night ? 'rgb(120,130,170)' : 'rgb(255,255,255)', ca = (night ? 0.35 : 0.85) * (cloudy ? 1 : 0.8);
  for (let i = 0; i < (cloudy ? 7 : 4); i++) fvCloud(c, ((i * 0.27 + tm * (0.0035 + i * 0.0007)) % 1.4 - 0.2) * w, hz * (0.16 + (i % 3) * 0.2), (0.9 + (i % 3) * 0.3) * u * (h > w ? 1.4 : 1), ca * (cloudy ? 1.05 : 0.9), i % 2 ? cc : (night ? 'rgb(150,160,200)' : 'rgb(246,250,255)'));
  // ---- far bank: hills and two rows of trees, tinted by the ambient light
  const aq = amb.map(v => Math.round(v / 14) * 14), SL = AK.layer('fv|' + se + '|' + (ice ? 1 : 0) + '|' + Math.round(h) + '|' + aq.join('-'), w, h, dpr, (g, ww, hh) => { fvTrees(g, ww, hh, hz, se, ice); const lum = (aq[0] + aq[1] + aq[2]) / 765, al = clamp((1 - lum) * 1.2, 0, 0.8); if (al > 0.01) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(' + Math.round(aq[0] * 0.35) + ',' + Math.round(aq[1] * 0.4) + ',' + Math.round(aq[2] * 0.6) + ',' + al.toFixed(3) + ')'; g.fillRect(0, 0, ww, hh); g.globalCompositeOperation = 'source-over'; } });
  c.drawImage(SL, 0, 0, w, h);
  // ---- water or ice
  const top = mix3(A.bot, [70, 150, 195], 0.55), bot = mix3(A.top, [14, 54, 100], 0.7);
  if (ice) { c.fillStyle = SK.lin(c, 0, hz, 0, h, [[0, '#e6f1f8'], [0.5, '#cfe3ef'], [1, '#a9cbe0']]); c.fillRect(0, hz + 2, w, h - hz); }
  else {
    c.fillStyle = SK.lin(c, 0, hz, 0, h, [[0, rgbS(top)], [0.45, rgbS(mix3(top, bot, 0.5))], [1, rgbS(bot)]]); c.fillRect(0, hz + 2, w, h - hz);
    // the trees mirrored in the water, in wobbling strips
    const sy0 = hz - h * 0.3, sh = h * 0.3 + 8, strips = 16, L = SL;
    c.save(); c.beginPath(); c.rect(0, hz + 2, w, h * 0.3); c.clip();
    for (let i = 0; i < strips; i++) { c.globalAlpha = (night ? 0.2 : 0.3) * (1 - i / strips * 0.85); const yy = sh / strips * i, off = Math.sin(tm * 1.6 + i * 0.9) * (1 + i * 0.25) * u; c.save(); c.translate(0, hz + 2 + (sh - yy) - sh / strips * 0.0); c.scale(1, -1); c.drawImage(L, off * dpr, (sy0 + yy) * dpr + (sh / strips) * 0.0, w * dpr, (sh / strips) * dpr + 1, 0, 0, w, sh / strips + 0.6); c.restore(); }
    c.restore();
  }
  // ---- light on the water: a glitter path under the sun or moon, and drifting wave strokes
  if (!ice) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const gl = A.sunUp ? (A.warm > 0.5 ? [255, 214, 150] : [255, 244, 210]) : [220, 230, 255], ga = A.sunUp ? 0.5 * (1 - A.cloud * 0.8) : night ? 0.4 * (1 - A.cloud) : 0;
    if (ga > 0.02) for (let i = 0; i < 26; i++) { const k = i / 25, yy = hz + 6 + k * (h - hz) * 0.7, ww2 = (10 + k * 60) * u * (0.5 + 0.5 * Math.sin(tm * 2.2 + i * 1.7)), xx = sx + Math.sin(tm * 0.8 + i * 2.3) * (4 + k * 40) * u; c.fillStyle = AK.rgba(gl, ga * (1 - k * 0.5) * (0.4 + 0.6 * Math.abs(Math.sin(tm * 3 + i * 5.1)))); c.fillRect(xx - ww2 / 2, yy, ww2, 1.6 + k * 1.4); }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.2;
    for (let i = 0; i < 20; i++) { const k = (i % 10) / 10, yy = hz + 14 + k * (h - hz - 20), x = ((i * 97 + tm * (8 + k * 14)) % (w + 120)) - 60, ln = (14 + k * 26) * u; c.beginPath(); c.moveTo(x - ln, yy); c.quadraticCurveTo(x, yy - 2 - k * 3, x + ln, yy); c.stroke(); }
    // lily pads that drift and bob, one with a flower
    [[0.15, 0.55], [0.62, 0.46], [0.85, 0.7], [0.48, 0.82], [0.28, 0.72]].forEach((p, i) => {
      const lx = w * p[0] + Math.sin(tm * 0.35 + i) * 3, ly = h * p[1] + Math.sin(tm * 0.8 + i * 2) * 1.2, lr = (11 + p[1] * 14) * u * 1.15;
      c.fillStyle = 'rgba(10,40,60,.28)'; c.beginPath(); c.ellipse(lx + 2, ly + 3, lr, lr * 0.4, 0, 0, 7); c.fill();
      c.fillStyle = SK.lin(c, lx - lr, ly, lx + lr, ly, [[0, '#3f9a55'], [1, '#69c47a']]); c.beginPath(); c.moveTo(lx, ly); c.ellipse(lx, ly, lr, lr * 0.4, 0.2 * (i - 2) * 0.3, 0.45, 6.0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,90,40,.4)'; c.lineWidth = 0.8; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + Math.cos(0.9 + k * 1.3) * lr * 0.9, ly + Math.sin(0.9 + k * 1.3) * lr * 0.36); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(lx - lr * 0.3, ly - lr * 0.1, lr * 0.4, lr * 0.1, 0, 0, 7); c.fill();
      if (i === 1 && se !== 'autumn') { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#ffd6e4' : '#ffb3cf'; c.beginPath(); c.ellipse(lx + 4 + Math.cos(k) * 3.4 * u, ly - 4 * u + Math.sin(k) * 1.8 * u, 2.6 * u, 1.3 * u, k, 0, 7); c.fill(); } c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(lx + 4, ly - 4 * u, 1.6 * u, 0, 7); c.fill(); }
    });
    if (se === 'autumn') ['#d9822b', '#c0502a', '#e7b24a', '#a8432a', '#d9822b'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(((i * 230 + tm * 7) % (w + 40)) - 20, h * (0.5 + i * 0.09), 5 * u, 2.4 * u, i + Math.sin(tm + i) * 0.3, 0, 7); c.fill(); });
    // the bobber's neighbourhood gets rings that come and go
    for (let i = 0; i < 4; i++) { const k = (tm * 0.12 + i / 4) % 1, rx = w * (0.22 + hash01(i, Math.floor(tm * 0.12 + i / 4), 5) * 0.6), ry = h * (0.5 + hash01(i, Math.floor(tm * 0.12 + i / 4), 6) * 0.38); c.strokeStyle = 'rgba(255,255,255,' + (0.28 * Math.sin(k * Math.PI)).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(rx, ry, (6 + k * 34) * u, (6 + k * 34) * u * 0.28, 0, 0, 7); c.stroke(); }
  } else {
    // ice: frost, cracks and snow banks
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) { let x = w * hash01(i, 1, 1), y = hz + 20 + hash01(i, 2, 1) * (h - hz - 40); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (hash01(i, 10 + k, 1) - 0.4) * 80; y += (hash01(i, 20 + k, 1) - 0.5) * 40; c.lineTo(x, y); } c.stroke(); }
    c.strokeStyle = 'rgba(120,160,190,.35)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(w * hash01(i, 5, 1), hz + 30 + hash01(i, 6, 1) * (h - hz - 60)); c.lineTo(w * hash01(i, 7, 1), hz + 30 + hash01(i, 8, 1) * (h - hz - 60)); c.stroke(); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(sx, hz + 40 * u, 120 * u, 14 * u, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = '#f6fafd'; [[0.08, 0.93, 90, 22], [0.92, 0.9, 100, 24], [0.5, 0.99, 140, 22], [0.3, 0.97, 60, 14]].forEach(p => { c.beginPath(); c.ellipse(w * p[0], h * p[1], p[2] * u, p[3] * u, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(160,185,210,.5)'; c.beginPath(); c.ellipse(w * p[0], h * p[1] + p[3] * u * 0.4, p[2] * u * 0.9, p[3] * u * 0.4, 0, 0, 7); c.fill(); c.fillStyle = '#f6fafd'; });
  }
  // everything above sits under the ambient tint; lights are added after
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(' + Math.round(lerp(amb[0], 255, 0.25)) + ',' + Math.round(lerp(amb[1], 255, 0.25)) + ',' + Math.round(lerp(amb[2], 255, 0.25)) + ')'; c.fillRect(0, hz + 4, w, h - hz); c.restore();
  // ---- the bobber, the line, the rod and what is under the water
  const bx = w * (0.34 + FS.dist * 0.38), by = h * (0.66 - FS.dist * 0.2), tipX0 = w * 0.1, tipY0 = h * 0.22;
  if (FD.last !== FS.phase) {
    if (FS.phase === 'wait' && FD.last === 'cast') fvSplash(bx, by + 6, false);
    else if (FS.phase === 'reel') fvSplash(bx, by + 6, true);
    else if (FS.phase === 'done') fvSplash(bx, by + 6, true);
    else if (FS.phase === 'bite') FD.fx.push({ k: 'ring', x: bx, y: by + 6, t: 0, max: 0.7, r: 30 });
    FD.last = FS.phase;
  }
  let dip = 0;
  if (FS.phase === 'wait') { dip = Math.sin(tm * 2) * 1.5; if (FS.nib > 0) dip += Math.sin(FS.nib * 30) * 4; }
  else if (FS.phase === 'bite') dip = 10 + Math.sin(tm * 30) * 3; else if (FS.phase === 'reel') dip = 6 + Math.sin(tm * 20) * 3;
  const showBob = FS.phase !== 'cast';
  if (!ice) {
    // fish under the surface, drifting in slow loops; one comes to look at the bobber when something is about to happen
    for (let i = 0; i < 4; i++) {
      const dir = i % 2 ? -1 : 1, k = (tm * (0.018 + i * 0.004) * dir + hash01(i, 1, 9) + 10) % 1, fx0 = w * (-0.1 + k * 1.2), fy0 = h * (0.5 + hash01(i, 2, 9) * 0.36) + Math.sin(tm * 0.7 + i * 3) * 6;
      const near = showBob && (FS.phase === 'bite' || FS.nib > 0) && i === 0, fx = near ? bx - 26 * dir * (FS.phase === 'bite' ? 0.2 : 1) + Math.sin(tm * 5) * 3 : fx0, fy = near ? by + 24 * u : fy0;
      fvFishShadow(c, fx, fy, (0.8 + hash01(i, 3, 9) * 0.7) * u, 0.1 + 0.05 * Math.sin(tm + i) + (near ? 0.12 : 0), near ? -1 : dir, tm * 6 + i);
    }
    if (showBob && FS.phase === 'reel' && FS.fish) { const fx = bx + Math.sin(tm * 3) * 24 + (FS.fy - 0.5) * 60; fvFishShadow(c, fx, by + 28 * u, 1.5 * u, 0.3, Math.sin(tm * 3) > 0 ? 1 : -1, tm * 14); }
  }
  if (ice) {
    c.fillStyle = '#0e2230'; c.beginPath(); c.ellipse(bx, by + 4, 32 * u, 11 * u, 0, 0, 7); c.fill();
    c.fillStyle = SK.lin(c, bx, by - 6, bx, by + 14, [[0, '#14344a'], [1, '#0a1824']]); c.beginPath(); c.ellipse(bx, by + 5, 27 * u, 8.6 * u, 0, 0, 7); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3.4; c.beginPath(); c.ellipse(bx, by + 4, 32 * u, 11 * u, 0, 0, 7); c.stroke(); c.strokeStyle = 'rgba(120,160,190,.7)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(bx, by + 6, 25 * u, 7 * u, 0, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(bx - 8 * u, by + 1, 10 * u, 2 * u, 0, 0, 7); c.fill();
    if (showBob && FS.phase === 'reel') { c.fillStyle = 'rgba(8,24,36,.5)'; c.beginPath(); c.ellipse(bx + Math.sin(tm * 3) * 10, by + 6, 14 * u, 4 * u, 0, 0, 7); c.fill(); }
  }
  // ripples and splashes live in FD.fx
  for (let i = FD.fx.length - 1; i >= 0; i--) {
    const p = FD.fx[i]; p.t += dt || 0.016;
    if (p.t >= p.max) { FD.fx.splice(i, 1); continue; }
    if (p.t < 0) continue;
    const k = p.t / p.max;
    if (p.k === 'ring') { c.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - k)).toFixed(3) + ')'; c.lineWidth = 1.6 * (1 - k * 0.6); c.beginPath(); c.ellipse(p.x, p.y, p.r * k, p.r * k * 0.3, 0, 0, 7); c.stroke(); }
    else { p.vy += 520 * (dt || 0.016); p.x += p.vx * (dt || 0.016); p.y += p.vy * (dt || 0.016); c.fillStyle = 'rgba(235,248,255,' + (0.85 * (1 - k)).toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, 1.7 * u + 0.6, 0, 7); c.fill(); }
  }
  if (showBob) {
    // soft contact rings, and a reflection of the float
    if (!ice) { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const k = ((tm * (FS.phase === 'bite' ? 1.6 : 0.6)) + i / 3) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(bx, by + 6 + dip * 0.2, (6 + k * 34) * u, (6 + k * 34) * u * 0.3, 0, 0, 7); c.stroke(); } c.globalAlpha = 1; c.fillStyle = 'rgba(230,57,70,.22)'; c.beginPath(); c.ellipse(bx, by + 9 + dip * 0.4, 4.6 * u, 6 * u, 0, 0, 7); c.fill(); }
  }
  // rod: cork handle, reel, a tapering blank with guides, the tip bending when a fish pulls
  const bend = FS.phase === 'reel' ? 8 + Math.sin(tm * 17) * 2 : FS.phase === 'bite' ? 5 : 0, tipX = tipX0 - bend * 0.25, tipY = tipY0 + bend;
  c.lineCap = 'round';
  const bx0 = -10, by0 = h * 1.02, mx = tipX * 0.55, my = (by0 + tipY) / 2 - bend * 0.5;
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 8; c.beginPath(); c.moveTo(bx0 + 3, by0 + 3); c.quadraticCurveTo(mx + 3, my + 3, tipX + 3, tipY + 3); c.stroke();
  c.strokeStyle = '#2b1d12'; c.lineWidth = 6.5; c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo(mx, my, tipX, tipY); c.stroke();
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo(mx, my, tipX, tipY); c.stroke();
  c.strokeStyle = 'rgba(255,230,180,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx0 + 1, by0 - 1); c.quadraticCurveTo(mx + 1, my - 1, tipX + 0.5, tipY - 0.5); c.stroke();
  c.strokeStyle = '#c47a3a'; c.lineWidth = 5.5; c.beginPath(); c.moveTo(bx0, by0); c.lineTo(tipX0 * 0.42 - 2, h * 0.64); c.stroke();
  c.strokeStyle = '#8a5a2a'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const f = i / 6; c.beginPath(); c.moveTo(bx0 + (tipX0 * 0.42 - 2 - bx0) * f - 3, by0 + (h * 0.64 - by0) * f); c.lineTo(bx0 + (tipX0 * 0.42 - 2 - bx0) * f + 3, by0 + (h * 0.64 - by0) * f); c.stroke(); }
  c.fillStyle = '#9aa7ad'; c.beginPath(); c.arc(tipX0 * 0.3, h * 0.78, 8, 0, 7); c.fill(); c.fillStyle = '#5a666d'; c.beginPath(); c.arc(tipX0 * 0.3, h * 0.78, 4.4, 0, 7); c.fill(); c.strokeStyle = '#d8dee2'; c.lineWidth = 1.4; c.beginPath(); c.arc(tipX0 * 0.3, h * 0.78, 8, 3.4, 5.2); c.stroke(); c.fillStyle = '#e9edf0'; c.beginPath(); c.arc(tipX0 * 0.3 + 6, h * 0.78 - 8, 1.8, 0, 7); c.fill();
  for (let i = 1; i <= 3; i++) { const f = 0.35 + i * 0.2, gx = (bx0 + 2 * (1 - f) * f * mx + 0) , gy = 0; void gx; void gy; const q = (a, b2, cc, tt) => (1 - tt) * (1 - tt) * a + 2 * (1 - tt) * tt * b2 + tt * tt * cc; c.strokeStyle = '#d8dee2'; c.lineWidth = 1.2; c.beginPath(); c.arc(q(bx0, mx, tipX, f), q(by0, my, tipY, f), 2.4, 0, 7); c.stroke(); }
  c.lineCap = 'butt';
  if (showBob) {
    // the line: a gentle sag when slack, taut and trembling while reeling
    const sag = FS.phase === 'reel' ? 6 : FS.phase === 'bite' ? 28 : 64;
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(tipX, tipY); c.quadraticCurveTo((tipX + bx) / 2, Math.min(tipY, by) + sag * u + (FS.phase === 'reel' ? Math.sin(tm * 30) * 1.2 : 0), bx, by + dip - 9);
    c.stroke();
    // the float: a bright sphere with a stripe, a stem, and a little highlight
    const fy = by + dip - 3;
    c.fillStyle = '#2b2f36'; c.fillRect(bx - 1, fy - 17, 2, 7); c.fillStyle = '#ffd24a'; c.fillRect(bx - 1, fy - 17, 2, 2.4);
    const g1 = c.createRadialGradient(bx - 3, fy - 4, 1, bx, fy, 9); g1.addColorStop(0, '#ff8a8a'); g1.addColorStop(1, '#c0222c');
    c.fillStyle = g1; c.beginPath(); c.arc(bx, fy, 8.6, Math.PI, 0); c.fill();
    const g2 = c.createRadialGradient(bx - 3, fy + 3, 1, bx, fy, 9); g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, '#cfd6dc');
    c.fillStyle = g2; c.beginPath(); c.arc(bx, fy, 8.6, 0, Math.PI); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 0.8; c.beginPath(); c.arc(bx, fy, 8.6, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(bx - 3.6, fy - 4, 2.4, 1.3, -0.6, 0, 7); c.fill();
    if (FS.phase === 'bite') { c.fillStyle = '#ffc247'; c.shadowColor = '#ffc247'; c.shadowBlur = 14; c.font = '800 ' + Math.round(40 * Math.max(0.7, u)) + 'px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.fillText('!', bx, by - 30); c.shadowBlur = 0; }
  }
  // ---- foreground: reeds and cattails
  if (!ice) {
    for (let i = 0; i < 17; i++) {
      const rightSide = i < 10, x = rightSide ? w - 8 - i * 10.5 * Math.max(0.85, u) : 6 + (i - 10) * 11 * Math.max(0.85, u), sw = Math.sin(tm * 1.4 + i) * 3, hh = (46 + (i % 4) * 14 + hash01(i, 1, 1) * 18) * u * 1.05;
      c.strokeStyle = i % 3 ? '#2e6a36' : '#3f7a3f'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, h + 2); c.quadraticCurveTo(x + sw * 0.4, h - hh * 0.5, x + sw, h - hh); c.stroke();
      if (i % 3 === 0) { c.fillStyle = '#6b4a30'; rr(c, x + sw - 2.2, h - hh - 12 * u, 4.4, 14 * u, 2.2); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + sw - 1.4, h - hh - 11 * u, 1.2, 10 * u); }
    }
    c.lineCap = 'butt';
  } else {
    // a breath of steam from the angler, now and then
    FD.puff += dt || 0.016;
    if (!REDUCED) for (let i = 0; i < 3; i++) { const k = ((FD.puff * 0.4) + i / 3) % 1; c.fillStyle = 'rgba(255,255,255,' + (0.35 * Math.sin(k * Math.PI)).toFixed(3) + ')'; c.beginPath(); c.arc(w * 0.12 + k * 40 * u + Math.sin(FD.puff + i) * 4, h * 0.82 - k * 50 * u, (6 + k * 16) * u, 0, 7); c.fill(); }
  }
  // sun shafts through the trees and a gentle vignette
  if (A.sunUp && A.cloud < 0.5 && !REDUCED) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x0 = sx + (i - 1) * 40 * u; c.fillStyle = SK.lin(c, x0, 0, x0 + 80 * u, h * 0.7, [[0, 'rgba(255,240,200,.06)'], [1, 'rgba(255,240,200,0)']]); c.beginPath(); c.moveTo(x0 - 8 * u, 0); c.lineTo(x0 + 10 * u, 0); c.lineTo(x0 + 120 * u, h * 0.8); c.lineTo(x0 + 40 * u, h * 0.8); c.closePath(); c.fill(); } c.restore(); }
  if (night) { const moonOn = A.mf >= 0; if (moonOn) AK.light(c, sx, hz + 30 * u, 60 * u, '#cfd8ff', 0.16); }
  AK.vignette(c, w, h, 0.4, [4, 10, 24], 0.45);
  // ---- the two meters
  if (FS.phase === 'cast') {
    const mx = w * 0.3, my = h * 0.9, mw = w * 0.4, pw = clamp(FS.pow, 0, 1);
    // a faint arc previews where the cast would land
    const tx = w * (0.34 + pw * 0.38), ty = h * (0.66 - pw * 0.2);
    c.setLineDash([3, 6]); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tipX0, tipY0); c.quadraticCurveTo((tipX0 + tx) / 2, Math.min(tipY0, ty) - 50 * u, tx, ty); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(tx, ty + 6, 12 * u, 4 * u, 0, 0, 7); c.stroke();
    c.fillStyle = 'rgba(8,12,22,.66)'; rr(c, mx - 6, my - 6, mw + 12, 22, 11); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#0a1a26'; rr(c, mx, my, mw, 10, 5); c.fill();
    const g2 = c.createLinearGradient(mx, 0, mx + mw, 0); g2.addColorStop(0, '#6fd1ff'); g2.addColorStop(0.55, '#ffd36a'); g2.addColorStop(1, '#ff8a4a');
    c.fillStyle = g2; rr(c, mx, my, Math.max(8, mw * pw), 10, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; rr(c, mx + 2, my + 1.4, Math.max(6, mw * pw - 4), 2.6, 1.3); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(mx + mw * i / 10, my + 7); c.lineTo(mx + mw * i / 10, my + 10); c.stroke(); }
    const mk = mx + mw * pw; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(mk, my - 3); c.lineTo(mk - 5, my - 10); c.lineTo(mk + 5, my - 10); c.closePath(); c.fill(); AK.light(c, mk, my + 5, 14, '#ffd36a', 0.6);
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '600 11px "DM Sans",sans-serif'; c.textAlign = 'center'; c.fillText('Further out = rarer fish', w / 2, my - 14);
  }
  if (FS.phase === 'reel') {
    const bx2 = w - 64, top = h * 0.12, bh = h * 0.72, half = (hasPerk('angler') ? 0.15 : 0.12) * (FS.fish.r >= 3 ? 0.85 : 1);
    // a glass panel, a sleek tube with ticks, and a liquid progress tube beside it
    c.fillStyle = 'rgba(6,12,22,.78)'; rr(c, bx2 - 12, top - 14, 58, bh + 28, 16); c.fill(); c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.07)'; rr(c, bx2 - 11, top - 13, 56, 10, 8); c.fill();
    c.fillStyle = SK.lin(c, bx2, 0, bx2 + 26, 0, [[0, '#06161f'], [0.5, '#0f3040'], [1, '#06161f']]); rr(c, bx2, top, 26, bh, 9); c.fill();
    c.strokeStyle = 'rgba(160,215,255,.3)'; c.lineWidth = 1; for (let i = 0; i <= 10; i++) { const ty = top + bh * i / 10; c.beginPath(); c.moveTo(bx2 + 1, ty); c.lineTo(bx2 + (i % 5 ? 5 : 9), ty); c.stroke(); }
    const zy = top + bh * (1 - FS.zone), zh = bh * half * 2, pulse = 0.65 + 0.15 * Math.sin(tm * 6);
    const zg = c.createLinearGradient(bx2, 0, bx2 + 26, 0); zg.addColorStop(0, '#5aa81c'); zg.addColorStop(0.4, '#b6f04a'); zg.addColorStop(1, '#4a9a18');
    c.save(); c.shadowColor = 'rgba(160,255,80,' + pulse.toFixed(2) + ')'; c.shadowBlur = 16; c.fillStyle = zg; rr(c, bx2 + 2, zy - zh / 2, 22, zh, 7); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, bx2 + 5, zy - zh / 2 + 2, 5, Math.max(4, zh - 4), 2.5); c.fill();
    const fy = top + bh * (1 - FS.fy), inside = Math.abs(FS.fy - FS.zone) < half;
    if (inside) AK.light(c, bx2 + 13, fy, 24, '#c8ff80', 0.7);
    c.strokeStyle = inside ? 'rgba(220,255,160,.9)' : 'rgba(255,255,255,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(bx2 + 13, fy, 12.5, 0, 7); c.stroke();
    fishArt(c, FS.fish.r === 0 ? FISH[0] : FS.fish, bx2 + 13, fy, 0.5);
    c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, bx2 + 1, top + 1, 6, bh - 2, 3); c.fill();
    c.fillStyle = '#06161f'; rr(c, bx2 + 32, top, 9, bh, 4.5); c.fill(); c.strokeStyle = 'rgba(160,215,255,.25)'; c.stroke();
    const ph = bh * FS.prog, pg = c.createLinearGradient(0, top + bh, 0, top); pg.addColorStop(0, '#e63946'); pg.addColorStop(0.5, '#ffc247'); pg.addColorStop(1, '#8ac926');
    c.save(); rr(c, bx2 + 32, top, 9, bh, 4.5); c.clip(); c.fillStyle = pg; c.fillRect(bx2 + 32, top + bh - ph, 9, ph); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); const wy = top + bh - ph; c.moveTo(bx2 + 32, wy); for (let k = 0; k <= 9; k++) c.lineTo(bx2 + 32 + k, wy + Math.sin(tm * 5 + k) * 1.2); c.lineTo(bx2 + 41, wy + 3); c.lineTo(bx2 + 32, wy + 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(bx2 + 34, top, 2, bh); c.restore();
  }
  // weather over the top
  if (A.rain > 0.05 || A.snow > 0.05) {
    if (A.snow > 0) { c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 70; i++) { const x = (i * 53.7 + tm * 20 + Math.sin(tm + i) * 14) % w, y = (i * 91.3 + tm * 50) % h; c.beginPath(); c.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 7); c.fill(); } }
    else { c.strokeStyle = 'rgba(210,225,255,.4)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 70; i++) { const x = (i * 53.7 + tm * 80) % w, y = (i * 91.3 + tm * 520) % h; c.moveTo(x, y); c.lineTo(x - 3, y + 10); } c.stroke(); if (!ice) { c.strokeStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 12; i++) { const k = (tm * 2 + i * 0.37) % 1, x = (i * 131.7) % w, y = hz + 20 + ((i * 71.3) % (h - hz - 20)); c.beginPath(); c.ellipse(x, y, k * 10, k * 3, 0, 0, 7); c.globalAlpha = 1 - k; c.stroke(); c.globalAlpha = 1; } } }
  }
}
