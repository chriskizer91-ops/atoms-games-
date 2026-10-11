/* ============================ cinematic stage set ============================
   Back wall, banner, velvet curtains with tie-backs, gold-braided valance, plank floor, podium, flowers, bunting.
   The static set is baked once (1.5 px per world unit, plus a softened twin for rack focus); the live bits are drawn per frame. */
const CIN_FLOOR = { x0: 128, x1: 1152, y0: 498, y1: 552 };

function cinBuildStage() {
  const L = CN.L;
  L.stage = cnLayer(96, 28, 1100, 620, 1.5, g => {
    cinWall(g);
    cinBanner(g);
    cinCurtain(g, 0);
    cinCurtain(g, 1);
    cinValance(g);
    cinFloor(g);
    cinPodium(g);
    cinFlowers(g, 150, 530, 0);
    cinFlowers(g, 1128, 530, 1);
  });
  L.stageSoft = cnSoftLayer(L.stage, 2.2);
  // a few reusable sprites
  if (!CN.S.flags) CN.S.flags = ['#ff6b6b', '#ffc247', '#47b8ff', '#5bd39b', '#a393ff', '#ff9a3d'].map(col => {
    const cv = cnMk(60, 76), g = cv.getContext('2d');
    g.scale(2, 2);
    g.fillStyle = col; g.beginPath(); g.moveTo(2, 1); g.lineTo(28, 1); g.lineTo(15, 35); g.closePath(); g.fill();
    g.fillStyle = cnLG(g, 2, 0, 28, 0, [[0, 'rgba(255,255,255,.34)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,30,.34)']]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(2, 1, 26, 2.4);
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(15, 3); g.lineTo(15, 33); g.moveTo(8, 3); g.lineTo(13, 24); g.moveTo(22, 3); g.lineTo(17, 24); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([2, 1.6]); g.beginPath(); g.moveTo(4, 4.4); g.lineTo(26, 4.4); g.stroke();
    return cv;
  });
}

/* ---------- back wall: a navy drape with soft pleats, wash from the upper left ---------- */
function cinWall(g) {
  const x0 = 258, x1 = 1022, y0 = 106, y1 = 500;
  g.fillStyle = cnLG(g, 0, y0, 0, y1, [[0, '#131c38'], [0.32, '#202d58'], [0.78, '#283766'], [1, '#18203f']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const rnd = mulberry32(12);
  for (let x = x0 - 10; x < x1;) {
    const w = 22 + rnd() * 20, a = 0.05 + rnd() * 0.07;
    g.fillStyle = cnLG(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,0)'], [0.32, 'rgba(176,196,255,' + a + ')'], [0.62, 'rgba(0,0,12,' + (a * 1.3) + ')'], [1, 'rgba(0,0,12,0)']]);
    g.fillRect(x, y0, w, y1 - y0);
    x += w * 0.8;
  }
  // fine weave
  g.fillStyle = 'rgba(255,255,255,.025)'; for (let y = y0; y < y1; y += 3) g.fillRect(x0, y, x1 - x0, 1);
  // sun wash from the left, cool falloff to the right
  g.fillStyle = cnLG(g, x0, 0, x1, 0, [[0, 'rgba(255,214,150,.20)'], [0.35, 'rgba(255,214,150,.05)'], [1, 'rgba(10,10,40,.34)']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  // soft gobo: faint gold diamonds high on the drape
  g.strokeStyle = 'rgba(240,180,41,.07)'; g.lineWidth = 1;
  for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { const cx = x0 + 32 + i * 66 + (j % 2) * 33, cy = 300 + j * 62; g.beginPath(); g.moveTo(cx, cy - 18); g.lineTo(cx + 12, cy); g.lineTo(cx, cy + 18); g.lineTo(cx - 12, cy); g.closePath(); g.stroke(); }
  // occlusion: under the valance, beside the curtains, against the floor
  g.fillStyle = cnLG(g, 0, y0, 0, y0 + 60, [[0, 'rgba(4,6,20,.62)'], [1, 'rgba(4,6,20,0)']]); g.fillRect(x0, y0, x1 - x0, 60);
  g.fillStyle = cnLG(g, x0, 0, x0 + 70, 0, [[0, 'rgba(4,6,20,.55)'], [1, 'rgba(4,6,20,0)']]); g.fillRect(x0, y0, 70, y1 - y0);
  g.fillStyle = cnLG(g, x1, 0, x1 - 70, 0, [[0, 'rgba(4,6,20,.6)'], [1, 'rgba(4,6,20,0)']]); g.fillRect(x1 - 70, y0, 70, y1 - y0);
  g.fillStyle = cnLG(g, 0, y1 - 38, 0, y1, [[0, 'rgba(4,6,20,0)'], [1, 'rgba(4,6,20,.5)']]); g.fillRect(x0, y1 - 38, x1 - x0, 38);
  // dark plinth at the bottom of the wall
  g.fillStyle = '#10151f'; g.fillRect(x0, y1 - 14, x1 - x0, 14); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y1 - 14, x1 - x0, 1.5);
}

/* ---------- the banner (text stays: FRESH GRAD STATE / CLASS OF 2026) ---------- */
function cinBanner(g) {
  const bx = 380, by = 150, bw = 520, bh = 130;
  // ropes up to the valance
  [bx + 40, bx + bw - 40].forEach(x => {
    g.strokeStyle = '#2a1d0a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 108); g.lineTo(x, by + 2); g.stroke();
    g.strokeStyle = '#d6a336'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x, 108); g.lineTo(x, by + 2); g.stroke();
    g.strokeStyle = 'rgba(255,244,190,.7)'; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x - 0.8, 108); g.lineTo(x - 0.8, by + 2); g.stroke(); g.setLineDash([]);
  });
  // cast shadow on the wall (key light is upper left, so the shadow falls down and right)
  g.fillStyle = 'rgba(2,4,16,.5)'; cnRR(g, bx + 8, by + 12, bw, bh, 8); g.fill();
  g.fillStyle = 'rgba(2,4,16,.25)'; cnRR(g, bx + 14, by + 20, bw + 8, bh + 6, 12); g.fill();
  // gold frame with bevel
  g.fillStyle = cnLG(g, bx, by, bx + bw, by + bh, [[0, '#ffe392'], [0.3, '#d9a62f'], [0.6, '#f6cb55'], [1, '#a9740f']]); cnRR(g, bx, by, bw, bh, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(bx + 4, by + 1.5, bw - 8, 1.6);
  g.fillStyle = 'rgba(70,40,0,.55)'; g.fillRect(bx + 4, by + bh - 3, bw - 8, 1.6);
  // navy panel
  const px = bx + 7, py = by + 7, pw = bw - 14, ph = bh - 14;
  g.fillStyle = cnLG(g, 0, py, 0, py + ph, [[0, '#2a478f'], [0.5, '#1d3478'], [1, '#14275f']]); cnRR(g, px, py, pw, ph, 3); g.fill();
  const rnd = mulberry32(4);
  for (let x = px; x < px + pw; x += 14 + rnd() * 18) { g.fillStyle = cnLG(g, x, 0, x + 18, 0, [[0, 'rgba(255,255,255,.05)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,30,.10)']]); g.fillRect(x, py, 18, ph); }
  g.fillStyle = cnLG(g, 0, py, 0, py + 22, [[0, 'rgba(0,0,30,.4)'], [1, 'rgba(0,0,30,0)']]); g.fillRect(px, py, pw, 22);
  g.fillStyle = cnLG(g, 0, py + ph - 20, 0, py + ph, [[0, 'rgba(0,0,30,0)'], [1, 'rgba(0,0,30,.35)']]); g.fillRect(px, py + ph - 20, pw, 20);
  // inner gold hairline with corner notches
  g.strokeStyle = 'rgba(246,200,80,.9)'; g.lineWidth = 1.5; g.strokeRect(px + 8, py + 8, pw - 16, ph - 16);
  g.strokeStyle = 'rgba(246,200,80,.4)'; g.lineWidth = 1; g.strokeRect(px + 12, py + 12, pw - 24, ph - 24);
  [[px + 8, py + 8], [px + pw - 8, py + 8], [px + 8, py + ph - 8], [px + pw - 8, py + ph - 8]].forEach(p => {
    g.fillStyle = '#f6c750'; g.beginPath(); g.arc(p[0], p[1], 4.2, 0, CN_TAU); g.fill();
    g.fillStyle = '#7a4d00'; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, CN_TAU); g.fill();
  });
  // lettering
  const cx = bx + bw / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  try { g.letterSpacing = '5px'; } catch (e) { /* older engines ignore it */ }
  g.font = '700 21px ' + CN_SERIF;
  g.fillStyle = 'rgba(2,6,24,.65)'; g.fillText('FRESH GRAD STATE', cx + 2.5, by + 40 + 2);
  g.fillStyle = cnLG(g, 0, by + 30, 0, by + 50, [[0, '#ffe9a6'], [1, '#e2a82c']]); g.fillText('FRESH GRAD STATE', cx + 2.5, by + 40);
  try { g.letterSpacing = '1px'; } catch (e) { /* ignore */ }
  // rule with a diamond
  g.strokeStyle = 'rgba(246,200,80,.7)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(cx - 190, by + 63); g.lineTo(cx - 14, by + 63); g.moveTo(cx + 14, by + 63); g.lineTo(cx + 190, by + 63); g.stroke();
  g.fillStyle = '#f6c750'; g.beginPath(); g.moveTo(cx, by + 58); g.lineTo(cx + 6, by + 63); g.lineTo(cx, by + 68); g.lineTo(cx - 6, by + 63); g.closePath(); g.fill();
  g.font = '800 56px ' + CN_DISPLAY;
  g.fillStyle = 'rgba(2,6,24,.7)'; g.fillText('CLASS OF 2026', cx + 1, by + 98 + 4);
  g.fillStyle = cnLG(g, 0, by + 72, 0, by + 124, [[0, '#ffffff'], [0.55, '#fff6df'], [1, '#e9d29a']]); g.fillText('CLASS OF 2026', cx + 1, by + 98);
  g.strokeStyle = 'rgba(246,200,80,.55)'; g.lineWidth = 1; g.strokeText('CLASS OF 2026', cx + 1, by + 98);
  try { g.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  g.textAlign = 'start';
}

/* ---------- velvet curtain with fold strips, a gold tie-back and tassel, fringe hem ---------- */
function cinCurtain(g, side) {
  const yT = 100, yB = 506, yC = 330;
  const mir = x => side ? 1280 - x : x;
  const xo = 162;                                    // outer edge (left curtain)
  const inner = y => y < yC ? lerp(318, 262, smooth((y - yT) / (yC - yT))) : lerp(262, 330, smooth((y - yC) / (yB - yC)));
  const N = 14, rnd = mulberry32(side ? 91 : 61);
  const fold = [];
  for (let i = 0; i <= N; i++) fold.push((i + (i && i < N ? (rnd() - 0.5) * 0.5 : 0)) / N);
  const wine = '#7a1f33', hi = side ? '#8e2a40' : '#b13a52', dk = '#4a0f1e';
  const ptsAt = (f, y) => mir(xo + (inner(y) - xo) * f + Math.sin(y * 0.02 + f * 9) * 1.5);
  for (let i = 0; i < N; i++) {
    g.beginPath();
    for (let y = yT; y <= yB; y += 14) g.lineTo(ptsAt(fold[i], y), y);
    for (let y = yB; y >= yT; y -= 14) g.lineTo(ptsAt(fold[i + 1], y), y);
    g.closePath();
    const xa = ptsAt(fold[i], 300), xb = ptsAt(fold[i + 1], 300), a = Math.min(xa, xb), b = Math.max(xa, xb);
    g.fillStyle = cnLG(g, a, 0, b, 0, i % 2 ? [[0, dk], [0.35, wine], [0.6, hi], [1, wine]] : [[0, wine], [0.25, hi], [0.55, wine], [1, dk]]);
    g.fill();
  }
  // soft overall light: sun side vs shade side, plus occlusion under the valance and above the hem
  const shadeSide = side ? 'rgba(6,2,16,.42)' : 'rgba(6,2,16,.16)';
  g.fillStyle = cnLG(g, mir(xo), 0, mir(330), 0, [[0, side ? 'rgba(6,2,16,.20)' : 'rgba(255,200,160,.12)'], [1, shadeSide]]); g.fillRect(Math.min(mir(xo), mir(330)), yT, 170, yB - yT);
  g.fillStyle = cnLG(g, 0, yT, 0, yT + 64, [[0, 'rgba(4,0,10,.6)'], [1, 'rgba(4,0,10,0)']]); g.fillRect(Math.min(mir(xo), mir(330)) - 4, yT, 180, 64);
  g.fillStyle = cnLG(g, 0, yB - 60, 0, yB, [[0, 'rgba(4,0,10,0)'], [1, 'rgba(4,0,10,.45)']]); g.fillRect(Math.min(mir(xo), mir(330)) - 4, yB - 60, 180, 60);
  // velvet sheen: faint diagonal streaks on a few crests
  g.strokeStyle = 'rgba(255,200,210,.07)'; g.lineWidth = 2;
  for (let i = 1; i < N; i += 3) { g.beginPath(); for (let y = yT + 20; y < yB - 20; y += 14) g.lineTo(ptsAt(fold[i] + 0.012, y), y); g.stroke(); }
  // tie-back: gold rope around the gathered curtain, hook rosette on the wall side, tassel
  const xi = inner(yC), ax = mir(xo - 6), bx2 = mir(xi + 6), ty = yC;
  g.strokeStyle = '#3a2808'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ty - 4); g.quadraticCurveTo((ax + bx2) / 2, ty + 12, bx2, ty + 2); g.stroke();
  g.strokeStyle = '#e0ae3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(ax, ty - 4); g.quadraticCurveTo((ax + bx2) / 2, ty + 12, bx2, ty + 2); g.stroke();
  g.strokeStyle = 'rgba(255,240,170,.8)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ax, ty - 6); g.quadraticCurveTo((ax + bx2) / 2, ty + 9, bx2, ty); g.stroke();
  g.strokeStyle = 'rgba(90,50,0,.5)'; g.lineWidth = 1; g.setLineDash([2, 2.2]); g.beginPath(); g.moveTo(ax, ty - 3); g.quadraticCurveTo((ax + bx2) / 2, ty + 13, bx2, ty + 3); g.stroke(); g.setLineDash([]);
  g.lineCap = 'butt';
  g.fillStyle = '#e0ae3a'; g.beginPath(); g.arc(ax, ty - 4, 8, 0, CN_TAU); g.fill();
  g.fillStyle = '#7a4d00'; g.beginPath(); g.arc(ax, ty - 4, 4, 0, CN_TAU); g.fill(); g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(ax - 1, ty - 5, 1.6, 0, CN_TAU); g.fill();
  // tassel hanging from the rope
  const tx = (ax + bx2) / 2, tY = ty + 10;
  g.strokeStyle = '#d9a52f'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, tY); g.lineTo(tx, tY + 12); g.stroke();
  g.fillStyle = cnRG(g, tx - 2, tY + 16, 1, tx, tY + 18, 7, [[0, '#ffe9a0'], [1, '#c58f1f']]); g.beginPath(); g.arc(tx, tY + 17, 5, 0, CN_TAU); g.fill();
  for (let i = -5; i <= 5; i++) { g.strokeStyle = i % 2 ? '#e8b940' : '#b9811b'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tx + i * 0.7, tY + 21); g.lineTo(tx + i * 1.5, tY + 44 + Math.abs(i) * 0.4); g.stroke(); }
  g.fillStyle = '#d9a52f'; g.fillRect(tx - 5, tY + 20, 10, 3);
  // hem: gold band and bullion fringe
  const hx0 = Math.min(mir(xo), mir(330)) - 6, hx1 = Math.max(mir(xo), mir(330)) + 6;
  g.fillStyle = cnLG(g, 0, yB - 6, 0, yB + 4, [[0, '#ffe392'], [0.5, '#d9a62f'], [1, '#8c5d08']]); g.fillRect(hx0, yB - 6, hx1 - hx0, 9);
  for (let x = hx0; x < hx1; x += 3.4) { g.strokeStyle = (x / 3.4 | 0) % 2 ? '#e7b53b' : '#a9740f'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, yB + 3); g.lineTo(x + Math.sin(x) * 0.6, yB + 13 + (x * 7 % 3)); g.stroke(); }
}

/* ---------- valance with gold braid and tassels, brass rail ---------- */
function cinValance(g) {
  const x0 = 150, x1 = 1130, yT = 74, n = 10, sw = (x1 - x0) / n;
  // soft shadow on what is below
  g.fillStyle = cnLG(g, 0, 112, 0, 142, [[0, 'rgba(2,0,10,.5)'], [1, 'rgba(2,0,10,0)']]); g.fillRect(x0, 112, x1 - x0, 30);
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * sw, xb = xa + sw;
    g.beginPath(); g.moveTo(xa, yT); g.lineTo(xb, yT); g.lineTo(xb, 106); g.quadraticCurveTo((xa + xb) / 2, 138, xa, 106); g.closePath();
    g.fillStyle = cnLG(g, 0, yT, 0, 124, [[0, '#9e2c45'], [0.5, '#7a1f33'], [1, '#541022']]); g.fill();
    g.save(); g.clip();
    for (let k = 1; k < 9; k++) {
      const f = k / 9, xt = xa + sw * f, xbm = xa + sw * (0.5 + (f - 0.5) * 0.9);
      g.strokeStyle = 'rgba(30,0,10,.3)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(xt, yT); g.quadraticCurveTo(xt + (f - 0.5) * 6, 100, xbm, 106 + 28 * (1 - Math.abs(f - 0.5) * 2) * 0.9); g.stroke();
      g.strokeStyle = 'rgba(255,170,190,.16)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(xt + 2, yT); g.quadraticCurveTo(xt + 2 + (f - 0.5) * 6, 100, xbm + 2, 106 + 28 * (1 - Math.abs(f - 0.5) * 2) * 0.9); g.stroke();
    }
    g.fillStyle = cnLG(g, xa, 0, xb, 0, [[0, 'rgba(255,190,200,.16)'], [0.18, 'rgba(255,190,200,0)'], [1, 'rgba(0,0,10,.22)']]); g.fillRect(xa, yT, sw, 70);
    g.restore();
    // braid along the scallop
    g.strokeStyle = '#4a3208'; g.lineWidth = 5; g.beginPath(); g.moveTo(xa, 106); g.quadraticCurveTo((xa + xb) / 2, 138, xb, 106); g.stroke();
    g.strokeStyle = '#e8b940'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(xa, 106); g.quadraticCurveTo((xa + xb) / 2, 138, xb, 106); g.stroke();
    g.strokeStyle = 'rgba(255,245,190,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xa, 105); g.quadraticCurveTo((xa + xb) / 2, 136.4, xb, 105); g.stroke();
    // tassel at each join
    const tx = xb;
    if (i < n - 1) { g.fillStyle = '#e8b940'; g.beginPath(); g.arc(tx, 110, 3.6, 0, CN_TAU); g.fill(); for (let q = -3; q <= 3; q++) { g.strokeStyle = q % 2 ? '#f0c453' : '#b9811b'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx + q * 0.6, 113); g.lineTo(tx + q * 1.1, 128); g.stroke(); } }
  }
  // brass rail across the top with finials
  g.fillStyle = cnLG(g, 0, 62, 0, 78, [[0, '#ffe9a0'], [0.4, '#d9a52f'], [1, '#7a4d00']]); g.fillRect(x0 - 12, 64, x1 - x0 + 24, 11);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 - 12, 65, x1 - x0 + 24, 1.6);
  [x0 - 14, x1 + 14].forEach(x => { g.fillStyle = cnRG(g, x - 2, 66, 1, x, 69, 9, [[0, '#fff1b8'], [1, '#a9740f']]); g.beginPath(); g.arc(x, 69.5, 8, 0, CN_TAU); g.fill(); });
  // brackets
  for (let i = 0; i <= n; i += 2) { const x = x0 + i * sw; g.fillStyle = '#6b4a08'; g.fillRect(x - 3, 74, 6, 6); }
}

/* ---------- plank floor, lip and fascia ---------- */
function cinFloor(g) {
  const F = CIN_FLOOR, rows = 8, ph = (F.y1 - F.y0) / rows;
  for (let r = 0; r < rows; r++) {
    const y = F.y0 + r * ph, tint = hash01(r, 3, 9);
    g.fillStyle = cnMix('#85653f', '#a98558', 0.2 + tint * 0.55 + r * 0.02); g.fillRect(F.x0, y, F.x1 - F.x0, ph + 0.6);
    // butt joints and grain
    let x = F.x0 - hash01(r, 5, 5) * 170;
    while (x < F.x1) {
      const len = 150 + hash01(r, Math.floor(x), 7) * 180, xa = Math.max(F.x0, x), xb = Math.min(F.x1, x + len);
      if (xb > xa) {
        g.fillStyle = cnMix('#85653f', '#b08c5e', hash01(r, Math.floor(x), 11) * 0.7); g.fillRect(xa, y, xb - xa, ph);
        g.strokeStyle = 'rgba(40,22,6,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xa, y); g.lineTo(xa, y + ph); g.stroke();
        for (let k = 0; k < 3; k++) {
          const gy = y + 1.2 + k * ph / 3 + hash01(r, k, Math.floor(x)) * 1.2, ph0 = hash01(k, r, 3) * 6;
          g.strokeStyle = k % 2 ? 'rgba(60,34,10,.16)' : 'rgba(255,230,170,.12)'; g.lineWidth = 0.8; g.beginPath();
          for (let gx = xa; gx <= xb; gx += 8) g.lineTo(gx, gy + Math.sin(gx * 0.06 + ph0) * 0.7);
          g.stroke();
        }
        if (hash01(r, Math.floor(x), 17) > 0.8) { const kx = xa + (xb - xa) * hash01(r, Math.floor(x), 19); g.strokeStyle = 'rgba(50,28,8,.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, y + ph * 0.5, 4, 1.6, 0, 0, CN_TAU); g.stroke(); g.beginPath(); g.ellipse(kx, y + ph * 0.5, 2, 0.8, 0, 0, CN_TAU); g.stroke(); }
      }
      x += len;
    }
    g.fillStyle = 'rgba(30,16,4,.42)'; g.fillRect(F.x0, y, F.x1 - F.x0, 1);
    g.fillStyle = 'rgba(255,236,190,.14)'; g.fillRect(F.x0, y + 1, F.x1 - F.x0, 0.8);
  }
  // scuffs where people walk
  for (let i = 0; i < 46; i++) { const sx = 200 + hash01(i, 1, 1) * 820, sy = F.y0 + 6 + hash01(i, 2, 1) * 44; g.strokeStyle = i % 2 ? 'rgba(255,240,200,.16)' : 'rgba(40,22,6,.22)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 5 + hash01(i, 3, 1) * 14, sy - 1.4 + hash01(i, 4, 1) * 2.8); g.stroke(); }
  // depth: darker against the wall, a long soft sheen across the front half
  g.fillStyle = cnLG(g, 0, F.y0, 0, F.y1, [[0, 'rgba(8,8,24,.46)'], [0.22, 'rgba(8,8,24,.12)'], [0.62, 'rgba(255,240,210,.10)'], [1, 'rgba(255,240,210,.02)']]); g.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
  // soft wine reflections from the curtains and navy from the wall
  g.fillStyle = cnLG(g, 150, 0, 330, 0, [[0, 'rgba(160,40,70,.20)'], [1, 'rgba(160,40,70,0)']]); g.fillRect(150, F.y0, 190, 44);
  g.fillStyle = cnLG(g, 1130, 0, 950, 0, [[0, 'rgba(160,40,70,.18)'], [1, 'rgba(160,40,70,0)']]); g.fillRect(950, F.y0, 190, 44);
  // lip
  g.fillStyle = '#d9b37e'; g.fillRect(F.x0, F.y1, F.x1 - F.x0, 2.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(F.x0, F.y1, F.x1 - F.x0, 0.9);
  // fascia: framed panels, gold edge, soft shadow at the base
  const fy0 = F.y1 + 2.4, fy1 = 612;
  g.fillStyle = cnLG(g, 0, fy0, 0, fy1, [[0, '#6f5038'], [0.4, '#634732'], [1, '#3d2a1c']]); g.fillRect(F.x0, fy0, F.x1 - F.x0, fy1 - fy0);
  g.fillStyle = '#e0ae3a'; g.fillRect(F.x0, fy0 + 3, F.x1 - F.x0, 2); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(F.x0, fy0 + 5, F.x1 - F.x0, 1.4);
  for (let x = F.x0 + 14; x < F.x1 - 30; x += 102) {
    g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x, fy0 + 14, 88, 34);
    g.fillStyle = 'rgba(255,224,170,.14)'; g.fillRect(x, fy0 + 14, 88, 1.2); g.fillRect(x, fy0 + 14, 1.2, 34);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 87, fy0 + 14, 1.2, 34); g.fillRect(x, fy0 + 47, 88, 1.2);
    for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(30,16,4,.12)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + 4, fy0 + 20 + k * 7); g.lineTo(x + 84, fy0 + 20 + k * 7 + Math.sin(x + k) * 0.8); g.stroke(); }
  }
  g.fillStyle = cnLG(g, F.x0, 0, F.x1, 0, [[0, 'rgba(255,214,150,.12)'], [0.5, 'rgba(255,214,150,0)'], [1, 'rgba(6,6,24,.30)']]); g.fillRect(F.x0, fy0, F.x1 - F.x0, fy1 - fy0);
  g.fillStyle = cnLG(g, 0, fy1 - 18, 0, fy1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); g.fillRect(F.x0, fy1 - 18, F.x1 - F.x0, 18);
  // footlights: a row of small warm lamps along the base
  for (let x = F.x0 + 26; x < F.x1 - 10; x += 52) { g.fillStyle = '#ffe3a0'; g.fillRect(x - 3, fy1 - 9, 6, 3.4); g.fillStyle = '#6b4a08'; g.fillRect(x - 3, fy1 - 5.6, 6, 1.6); }
  // end caps of the stage
  g.fillStyle = '#4a3322'; g.fillRect(F.x0 - 4, F.y1 - 6, 6, fy1 - F.y1 + 6); g.fillRect(F.x1 - 2, F.y1 - 6, 6, fy1 - F.y1 + 6);
}

/* ---------- the podium, a proper lectern ---------- */
function cinPodium(g) {
  const pb = 532, pt = 428, cx = 950;
  // contact shadow
  g.fillStyle = 'rgba(8,6,20,.45)'; cnEll(g, cx + 14, pb + 2, 62, 8, 0); g.fill();
  // body
  g.fillStyle = cnLG(g, cx - 52, 0, cx + 52, 0, [[0, '#8d6a47'], [0.35, '#7a573a'], [0.7, '#664630'], [1, '#4c3322']]);
  g.beginPath(); g.moveTo(cx - 48, pt); g.lineTo(cx + 48, pt); g.lineTo(cx + 54, pb - 8); g.lineTo(cx - 54, pb - 8); g.closePath(); g.fill();
  // grain
  for (let i = 0; i < 16; i++) { g.strokeStyle = i % 2 ? 'rgba(40,22,6,.14)' : 'rgba(255,230,180,.10)'; g.lineWidth = 0.9; g.beginPath(); const x = cx - 46 + i * 6.2; g.moveTo(x, pt); g.lineTo(x + (x - cx) * 0.06, pb - 8); g.stroke(); }
  // inset panel with bevel
  g.fillStyle = 'rgba(0,0,0,.24)'; g.fillRect(cx - 38, pt + 22, 76, 66); g.fillStyle = 'rgba(255,226,170,.22)'; g.fillRect(cx - 38, pt + 22, 76, 1.4); g.fillRect(cx - 38, pt + 22, 1.4, 66);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cx + 37, pt + 22, 1.4, 66); g.fillRect(cx - 38, pt + 87, 76, 1.4);
  // fluted pilasters
  [-46, 38].forEach(dx => { for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx + dx + k * 3, pt + 14, 1.6, 82); g.fillStyle = 'rgba(255,226,170,.14)'; g.fillRect(cx + dx + k * 3 + 1.6, pt + 14, 0.9, 82); } });
  // medallion with a laurel ring
  const my = pt + 56;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx + 2, my + 3, 21, 0, CN_TAU); g.fill();
  g.fillStyle = cnRG(g, cx - 7, my - 8, 2, cx, my, 22, [[0, '#fff0b0'], [0.5, '#e8b940'], [1, '#9b6a0c']]); g.beginPath(); g.arc(cx, my, 21, 0, CN_TAU); g.fill();
  g.fillStyle = cnRG(g, cx + 6, my + 8, 2, cx, my, 17, [[0, '#f6cc58'], [1, '#c58f1f']]); g.beginPath(); g.arc(cx, my, 16, 0, CN_TAU); g.fill();
  g.strokeStyle = 'rgba(110,70,0,.7)'; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, my, 16, 0, CN_TAU); g.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI * 0.62 + i * 0.2; [-1, 1].forEach(sd => { const lx = cx + sd * Math.cos(a - 0.9) * -12.4 * 1, ly = my + Math.sin(a) * 12.4; g.fillStyle = 'rgba(120,76,0,.65)'; g.beginPath(); g.ellipse(cx + sd * Math.sin(a * 1.0 - 0.6) * 11, ly, 3.2, 1.5, sd * (a - 1.5), 0, CN_TAU); g.fill(); }); }
  g.fillStyle = '#fff0b0'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.6 : 6; g.lineTo(cx + Math.cos(a) * r, my + Math.sin(a) * r); } g.closePath(); g.fill();
  // base moulding
  g.fillStyle = '#4c3322'; g.fillRect(cx - 60, pb - 10, 120, 10); g.fillStyle = 'rgba(255,226,170,.3)'; g.fillRect(cx - 60, pb - 10, 120, 1.4);
  // sloped reading desk (top face) and a lip
  g.fillStyle = cnLG(g, cx - 56, 0, cx + 56, 0, [[0, '#b58a5c'], [0.5, '#9b7249'], [1, '#6f4e32']]);
  g.beginPath(); g.moveTo(cx - 40, pt - 14); g.lineTo(cx + 40, pt - 14); g.lineTo(cx + 58, pt + 1); g.lineTo(cx - 58, pt + 1); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,240,200,.35)'; g.beginPath(); g.moveTo(cx - 40, pt - 14); g.lineTo(cx + 40, pt - 14); g.lineTo(cx + 36, pt - 10); g.lineTo(cx - 36, pt - 10); g.closePath(); g.fill();
  g.fillStyle = '#5a3d28'; g.fillRect(cx - 58, pt + 1, 116, 5); g.fillStyle = 'rgba(255,226,170,.4)'; g.fillRect(cx - 58, pt + 1, 116, 1.2);
  // a sheet of notes and a gold ribbon marker on the desk
  g.fillStyle = 'rgba(250,244,226,.9)'; g.beginPath(); g.moveTo(cx - 20, pt - 11); g.lineTo(cx + 6, pt - 11); g.lineTo(cx + 8, pt - 2); g.lineTo(cx - 24, pt - 2); g.closePath(); g.fill();
  g.strokeStyle = '#c9402f'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 6, pt - 2); g.lineTo(cx - 8, pt + 8); g.stroke();
  // gooseneck microphone
  g.strokeStyle = '#14181f'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 22, pt - 10); g.bezierCurveTo(cx + 30, pt - 52, cx + 8, pt - 60, cx - 8, pt - 66); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 21, pt - 11); g.bezierCurveTo(cx + 29, pt - 52, cx + 7, pt - 61, cx - 9, pt - 67); g.stroke();
  g.lineCap = 'butt';
  g.save(); g.translate(cx - 12, pt - 68); g.rotate(-0.5);
  g.fillStyle = '#1b2029'; cnEll(g, 0, 0, 5.4, 9, 0); g.fill();
  g.fillStyle = 'rgba(160,170,190,.55)'; for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) { g.fillRect(i * 1.4 - 0.3, j * 3 - 0.3, 0.7, 0.7); }
  g.strokeStyle = '#6c7584'; g.lineWidth = 1; cnEll(g, 0, 0, 5.4, 9, 0); g.stroke();
  g.restore();
}
/* the glint that twinkles on the microphone (live) */
function cinMicGlint(c, ct) {
  const a = 0.5 + 0.5 * Math.sin(ct * 2.2), x = 950 - 16, y = 428 - 71;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.9;
  c.drawImage(CN.S.glowW, x - 9, y - 9, 18, 18);
  c.strokeStyle = 'rgba(255,255,240,' + (0.7 * a) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 7 * a - 2, y); c.lineTo(x + 7 * a + 2, y); c.moveTo(x, y - 7 * a - 2); c.lineTo(x, y + 7 * a + 2); c.stroke();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* ---------- flower arrangements in cream urns ---------- */
function cinFlowers(g, x, base, side) {
  const rnd = mulberry32(side ? 202 : 101);
  g.fillStyle = 'rgba(8,6,20,.4)'; cnEll(g, x + 6, base + 3, 30, 6, 0); g.fill();
  // foliage
  for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.1 + rnd() * 0.8), d = 20 + rnd() * 30; g.fillStyle = cnMix('#2f6b3f', '#5f9f4a', rnd()); g.save(); g.translate(x + Math.cos(a) * 6, base - 30); g.rotate(a); g.beginPath(); g.ellipse(d * 0.5, 0, d * 0.5, 4.4, 0, 0, CN_TAU); g.fill(); g.restore(); }
  // urn
  g.fillStyle = cnLG(g, x - 18, 0, x + 18, 0, [[0, '#f6efe0'], [0.5, '#d8cdb6'], [1, '#8c8470']]);
  g.beginPath(); g.moveTo(x - 12, base - 32); g.quadraticCurveTo(x - 24, base - 14, x - 14, base); g.lineTo(x + 14, base); g.quadraticCurveTo(x + 24, base - 14, x + 12, base - 32); g.closePath(); g.fill();
  g.fillStyle = '#2f5aa8'; g.fillRect(x - 17, base - 18, 34, 4); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x - 17, base - 18, 34, 1);
  g.fillStyle = '#e0ae3a'; g.fillRect(x - 13, base - 33, 26, 3.4);
  // blooms
  const cols = ['#f8f1e6', '#eaa4b8', '#f0b429', '#c9402f', '#d9c0f0'];
  for (let i = 0; i < 34; i++) {
    const a = -Math.PI * (0.05 + rnd() * 0.9), d = 6 + rnd() * 40, bx = x + Math.cos(a) * d * 0.9, by = base - 34 + Math.sin(a) * d * 0.9, r = 4.6 + rnd() * 3.4, col = cols[Math.floor(rnd() * cols.length)];
    g.fillStyle = cnShade(col, -0.28); g.beginPath(); g.arc(bx, by, r, 0, CN_TAU); g.fill();
    for (let p = 0; p < 6; p++) { const pa = p * 1.047 + rnd(); g.fillStyle = cnShade(col, p % 2 ? 0.02 : -0.08); g.beginPath(); g.arc(bx + Math.cos(pa) * r * 0.5, by + Math.sin(pa) * r * 0.5, r * 0.55, 0, CN_TAU); g.fill(); }
    g.fillStyle = cnShade(col, 0.28); g.beginPath(); g.arc(bx - r * 0.25, by - r * 0.3, r * 0.34, 0, CN_TAU); g.fill();
  }
  // a gold ribbon bow on the urn
  g.fillStyle = '#e0ae3a'; g.beginPath(); g.moveTo(x, base - 22); g.lineTo(x - 10, base - 28); g.lineTo(x - 8, base - 16); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x, base - 22); g.lineTo(x + 10, base - 28); g.lineTo(x + 8, base - 16); g.closePath(); g.fill();
  g.fillStyle = '#b9811b'; g.beginPath(); g.arc(x, base - 22, 3, 0, CN_TAU); g.fill();
}

/* ====================================================================================
   live parts of the stage
   ==================================================================================== */
/* soft focus: when the camera is tight on the hands the set behind drifts out of focus */
function cinFocusAmt(ct) {
  return cnS5((ct - 6.45) / 0.5) * (1 - cnS5((ct - 8.15) / 0.6)) * 0.95;
}
function cinStageLive(c, V, ct) {
  const L = CN.L, f = cinFocusAmt(ct);
  if (f > 0.92) cnBlit(c, L.stageSoft);
  else { cnBlit(c, L.stage); if (f > 0.02) cnBlit(c, L.stageSoft, f); }
  // light sweeping over the banner every few seconds
  const ph = ((ct * 0.16) % 1), sx = 380 - 120 + ph * 760, a = Math.sin(ph * Math.PI);
  if (a > 0.02) {
    c.save(); cnRR(c, 387, 157, 506, 116, 3); c.clip(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = cnLG(c, sx, 150, sx + 90, 280, [[0, 'rgba(255,240,200,0)'], [0.5, 'rgba(255,240,200,' + (0.2 * a) + ')'], [1, 'rgba(255,240,200,0)']]);
    c.beginPath(); c.moveTo(sx - 40, 150); c.lineTo(sx + 60, 150); c.lineTo(sx + 130, 282); c.lineTo(sx + 30, 282); c.closePath(); c.fill();
    c.restore(); c.globalCompositeOperation = 'source-over';
  }
  cinBunting(c, ct);
  cinMicGlint(c, ct);
  // truss lamps glow a little
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45;
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function cinBunting(c, ct) {
  const flags = CN.S.flags, wind = REDUCED ? 0.4 : 1;
  const P0 = [-140, 26], P1 = [640, 130], P2 = [1420, 26];
  c.strokeStyle = 'rgba(28,32,48,.9)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(P0[0], P0[1]); c.quadraticCurveTo(P1[0], P1[1], P2[0], P2[1]); c.stroke();
  const n = 30;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, u = 1 - t;
    const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
    const dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
    const ang = Math.atan2(dy, dx);
    const sw = Math.sin(ct * 1.7 + i * 0.8) * 0.09 * wind + Math.sin(ct * 0.7 + i * 0.3) * 0.04 * wind;
    c.save(); c.translate(x, y); c.rotate(ang * 0.55 + sw);
    c.globalAlpha = 0.25; c.fillStyle = '#000'; c.beginPath(); c.moveTo(-11, 5); c.lineTo(17, 5); c.lineTo(5, 38); c.closePath(); c.fill(); c.globalAlpha = 1;
    c.drawImage(flags[i % 6], -15, -1, 30, 38);
    c.restore();
  }
}
function cinStageFront(c, V, ct) { /* hook: things that overlay the cast on the stage plane */ }
