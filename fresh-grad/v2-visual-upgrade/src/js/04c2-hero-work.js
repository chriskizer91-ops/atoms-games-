/* ============================ the workplace exterior, one per degree ============================
   Same footprint and entrance for every employer; wall, roof and accent come from the degree, and each gets
   details that say what the company does. */
const W_WORK_HERO = {
  cs: { mat: 'panel', roofMat: 'seam', rp: null, room: 9, upper: [3, wServerRoom], glow: 1 },
  eng: { mat: 'seam', roofMat: 'seam', rp: null, room: 9, noLeft: true, glow: 5 },
  nurse: { mat: 'panel', roofMat: 'seam', rp: null, room: 10, noRight: true, glow: 2 },
  biz: { mat: 'stucco', roofMat: 'tile', rp: null, room: 10, lobby: wConfRoom, glow: 4 },
  edu: { mat: 'brick', roofMat: 'shingle', rp: null, room: 10, glow: 0 },
  cook: { mat: 'stucco', roofMat: 'tile', rp: null, room: 8, glow: 5 }
};

function wPaintServer(g, W, H) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b1626'); bg.addColorStop(1, '#16324c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  wGlow(g, W * 0.5, 0, W * 0.9, '120,200,255', 0.35);
  [[0.08, 0.22], [0.38, 0.24], [0.7, 0.22]].forEach(p => {
    const rx = W * p[0], rw = W * p[1], ry = H * 0.14;
    const rg = g.createLinearGradient(rx, 0, rx + rw, 0); rg.addColorStop(0, '#2a3946'); rg.addColorStop(1, '#141e28');
    g.fillStyle = rg; g.fillRect(rx, ry, rw, H - ry); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(rx, ry, 1, H - ry);
    for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(rx + 1.5, ry + 2 + k * (H - ry - 4) / 7, rw - 3, 1.2); g.fillStyle = 'rgba(100,150,190,.25)'; g.fillRect(rx + 1.5, ry + 3.2 + k * (H - ry - 4) / 7, rw - 3, 0.6); }
  });
  wFadeV(g, 0, H * 0.8, W, H * 0.2, 0, 0.5, '0,10,20');
}
function wServerRoom(c, x, y, w, h, on, px, py) {
  wBlitInside(c, wInsideSprite('srv', w, h, wPaintServer), x, y, w, h, px * 1.6, py * 1.6, 0.97);
  const t = REDUCED ? 0 : FX.time;
  for (let i = 0; i < 9; i++) {
    const lit = REDUCED ? i % 2 === 0 : Math.sin(t * (3 + i * 0.7) + i * 2.1) > 0.05;
    c.fillStyle = lit ? (i % 3 ? '#5be3a0' : '#6fd1ff') : 'rgba(20,60,50,.8)';
    c.fillRect(x + w * (0.12 + (i % 3) * 0.3) + px * 1.6, y + h * (0.3 + Math.floor(i / 3) * 0.2) + py * 1.6, 2, 1.3);
  }
}
function wPaintConf(g, W, H) {
  const wl = g.createLinearGradient(0, 0, 0, H); wl.addColorStop(0, '#e9dff0'); wl.addColorStop(1, '#bba8cc');
  g.fillStyle = wl; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f6f1fa'; g.fillRect(W * 0.3, H * 0.1, W * 0.4, H * 0.3); g.strokeStyle = '#4a3560'; g.lineWidth = 1.2; g.strokeRect(W * 0.3, H * 0.1, W * 0.4, H * 0.3);
  g.fillStyle = '#7a5aa0'; g.fillRect(W * 0.34, H * 0.18, W * 0.14, H * 0.05); g.fillStyle = '#e0b0ff'; g.fillRect(W * 0.34, H * 0.28, W * 0.3, H * 0.03); g.fillRect(W * 0.34, H * 0.34, W * 0.2, H * 0.03);
  for (let i = 0; i < 3; i++) { const lx = W * (0.25 + i * 0.25); wGlow(g, lx, H * 0.08, H * 0.4, '255,236,190', 0.5); g.fillStyle = '#fff4d0'; g.fillRect(lx - 4, 0, 8, 2.4); }
  const tg = g.createLinearGradient(0, H * 0.58, 0, H * 0.74); tg.addColorStop(0, '#8a5a36'); tg.addColorStop(1, '#5a3a22');
  g.fillStyle = tg; rr(g, W * 0.08, H * 0.58, W * 0.84, H * 0.16, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(W * 0.1, H * 0.58, W * 0.8, 1.2);
  for (let i = 0; i < 6; i++) { const cx = W * (0.14 + i * 0.145); g.fillStyle = '#2a2236'; rr(g, cx - 4.4, H * 0.4, 8.8, H * 0.22, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(cx - 3, H * 0.41, 6, 1); }
  for (let i = 0; i < 6; i++) { const cx = W * (0.14 + i * 0.145); g.fillStyle = '#2a2236'; rr(g, cx - 4.4, H * 0.78, 8.8, H * 0.2, 3); g.fill(); }
}
function wConfRoom(c, x, y, w, h, on, px, py) {
  wBlitInside(c, wInsideSprite('conf', w, h, wPaintConf), x, y, w, h, px * 1.6, py * 1.6, 0.94);
}

function wGlassCanopy(c, cx, bot, roofCol) {
  wFadeV(c, cx - 46, bot - 71, 92, 14, 0.34, 0, '8,12,28');
  c.strokeStyle = '#3a4650'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 40, bot - 92); c.lineTo(cx - 44, bot - 78); c.moveTo(cx + 40, bot - 92); c.lineTo(cx + 44, bot - 78); c.stroke();
  c.fillStyle = '#2b3138'; c.fillRect(cx - 42, bot - 94, 5, 3); c.fillRect(cx + 37, bot - 94, 5, 3);
  const gg = c.createLinearGradient(0, bot - 78, 0, bot - 70); gg.addColorStop(0, 'rgba(210,236,250,.95)'); gg.addColorStop(1, 'rgba(130,180,208,.9)');
  c.fillStyle = gg; c.beginPath(); c.moveTo(cx - 44, bot - 78); c.lineTo(cx + 44, bot - 78); c.lineTo(cx + 48, bot - 70); c.lineTo(cx - 48, bot - 70); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(cx - 30, bot - 78); c.lineTo(cx - 16, bot - 78); c.lineTo(cx - 22, bot - 70); c.lineTo(cx - 36, bot - 70); c.fill();
  c.fillStyle = shade(roofCol, 0.1); c.fillRect(cx - 48, bot - 70.6, 96, 2.4); c.fillRect(cx - 44, bot - 79.6, 88, 2);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(cx - 44, bot - 79.6, 88, 0.8);
  c.strokeStyle = shade(roofCol, 0.2); c.lineWidth = 0.9; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx + k * 18, bot - 78); c.lineTo(cx + k * 19.5, bot - 70); c.stroke(); }
}
function wGear(c, x, y, r, col, teeth, holeCol) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a = i / (teeth * 2) * 6.2832, rr2 = i % 2 ? r * 0.78 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  c.closePath(); c.fill();
  c.fillStyle = holeCol; c.beginPath(); c.arc(x, y, r * 0.34, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 3.5, 4.9); c.lineTo(x - r * 0.3, y - r * 0.3); c.fill();
}
function wCrossBadge(c, x, y, r) {
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(x + 0.8, y + 1.2, r + 1, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = '#d63b4b'; c.fillRect(x - r * 0.18, y - r * 0.6, r * 0.36, r * 1.2); c.fillRect(x - r * 0.6, y - r * 0.18, r * 1.2, r * 0.36);
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, r - 0.5, 0, 7); c.stroke();
}
const W_WORK_DETAIL = {
  cs(c, b, d, ft, bot, cx, r) {
    wPaintRoofProp(c, 4, b.x + 36, b.y, r); wPaintRoofProp(c, 2, b.x + b.w - 66, b.y, r); wPaintRoofProp(c, 0, b.x + 108, b.y, r);
    [b.x + 26, b.x + b.w - 26].forEach(x => {
      const y = b.y + 24;
      c.strokeStyle = d.accent; c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + 0.52; c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); } c.closePath(); c.stroke();
      c.fillStyle = d.accent; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); c.strokeStyle = d.accent; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 3.4); c.stroke();
    });
    c.strokeStyle = '#2b3138'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(b.x + b.w - 7, ft + 14); c.lineTo(b.x + b.w - 7, bot - 14); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(b.x + b.w - 8, ft + 14, 0.8, bot - ft - 28);
  },
  eng(c, b, d, ft, bot, cx, r) {
    wPaintRoofProp(c, 1, b.x + 176, b.y, r); wPaintRoofProp(c, 1, b.x + 222, b.y, r); wPaintRoofProp(c, 0, b.x + 96, b.y, r);
    [b.x + 26, b.x + b.w - 26].forEach(x => wGear(c, x, b.y + 24, 10.5, d.accent, 8, shade(d.roof, -0.3)));
    // the roll-up workshop door
    const dx = b.x + 17, dw = 78, dy = bot - 60;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(dx - 4, dy - 4, dw + 8, 64);
    for (let i = 0; i < dw + 8; i += 10) { c.fillStyle = (i / 10) % 2 ? '#1d2228' : '#ffb347'; c.fillRect(dx - 4 + i, dy - 4, 10, 4); }
    c.fillStyle = '#2b3138'; c.fillRect(dx - 3, dy, 3, 60); c.fillRect(dx + dw, dy, 3, 60);
    const og = c.createLinearGradient(0, dy, 0, dy + 26); og.addColorStop(0, '#15191e'); og.addColorStop(1, '#2a323a');
    c.fillStyle = og; c.fillRect(dx, dy, dw, 26);
    wGlow(c, dx + 24, dy + 4, 26, '255,236,190', 0.45); wGlow(c, dx + 58, dy + 4, 26, '255,236,190', 0.4);
    c.fillStyle = '#fff6d0'; c.fillRect(dx + 14, dy + 1, 20, 2); c.fillRect(dx + 48, dy + 1, 20, 2);
    // a lathe and a hoist in the dark
    c.fillStyle = '#3a4650'; c.fillRect(dx + 8, dy + 14, 36, 8); c.fillStyle = '#5a6a78'; c.fillRect(dx + 8, dy + 14, 36, 1.4); c.fillStyle = '#ffb347'; c.fillRect(dx + 12, dy + 9, 8, 6);
    c.strokeStyle = '#8a9298'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx + 62, dy); c.lineTo(dx + 62, dy + 12); c.stroke(); c.fillStyle = '#c9ced2'; c.fillRect(dx + 59.5, dy + 12, 5, 4);
    // the lowered slats
    for (let y = dy + 26; y < dy + 60; y += 4) {
      const sg = c.createLinearGradient(0, y, 0, y + 4); sg.addColorStop(0, '#b4bcc3'); sg.addColorStop(1, '#7b858c');
      c.fillStyle = sg; c.fillRect(dx, y, dw, 3.4); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(dx, y, dw, 0.8); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(dx, y + 3.2, dw, 0.8);
    }
    c.fillStyle = '#2b3138'; c.fillRect(dx, dy + 24, dw, 3); c.fillStyle = '#ffb347'; c.fillRect(dx + dw / 2 - 5, dy + 56, 10, 2.6);
    // bollards
    [dx - 2, dx + dw + 2].forEach(bx => { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(bx + 3, bot + 3, 5, 1.8, 0, 0, 7); c.fill(); c.fillStyle = '#ffcb3a'; c.fillRect(bx - 1.6, bot - 12, 5.2, 14); c.fillStyle = '#1d2228'; c.fillRect(bx - 1.6, bot - 8, 5.2, 2.4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx - 1.6, bot - 12, 1.2, 14); });
  },
  nurse(c, b, d, ft, bot, cx, r) {
    wPaintRoofProp(c, 0, b.x + 36, b.y, r); wPaintRoofProp(c, 1, b.x + b.w - 70, b.y, r);
    wCrossBadge(c, b.x + 26, b.y + 24, 10.5); wCrossBadge(c, b.x + b.w - 26, b.y + 24, 10.5);
    // the ambulance bay
    const bx = b.x + b.w - 94, bw = 80, by = bot - 62;
    c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, bx - 3, by - 5, bw + 6, 67, 6); c.fill();
    c.fillStyle = '#eef3f5'; rr(c, bx - 4, by - 6, bw + 8, 14, 4); c.fill();
    for (let i = 0; i < bw + 8; i += 14) { c.fillStyle = '#d63b4b'; c.beginPath(); c.moveTo(bx - 4 + i, by - 6); c.lineTo(bx - 4 + i + 7, by - 6); c.lineTo(bx - 4 + i + 3.5, by + 8); c.lineTo(bx - 4 + i - 3.5, by + 8); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx - 4, by - 6, bw + 8, 1.2); c.fillStyle = '#d63b4b'; c.fillRect(bx - 4, by + 8, bw + 8, 3);
    const ig = c.createLinearGradient(0, by + 11, 0, bot); ig.addColorStop(0, '#2a323a'); ig.addColorStop(1, '#14181d');
    c.fillStyle = ig; c.fillRect(bx, by + 11, bw, bot - by - 11);
    c.font = '800 6.5px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('EMERGENCY', bx + bw / 2, by + 20);
    // ambulance, nose on
    const ax = bx + bw / 2, ay = bot - 8;
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(ax, ay + 2, 30, 3.4, 0, 0, 7); c.fill();
    const body = c.createLinearGradient(ax - 28, 0, ax + 28, 0); body.addColorStop(0, '#f2f5f7'); body.addColorStop(0.5, '#ffffff'); body.addColorStop(1, '#cfd6da');
    c.fillStyle = body; rr(c, ax - 28, ay - 34, 56, 34, 6); c.fill();
    c.fillStyle = '#d63b4b'; c.fillRect(ax - 28, ay - 16, 56, 4);
    const ws = c.createLinearGradient(0, ay - 31, 0, ay - 17); ws.addColorStop(0, '#2c4a6a'); ws.addColorStop(1, '#162a40');
    c.fillStyle = ws; rr(c, ax - 22, ay - 31, 44, 15, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(ax - 18, ay - 30); c.lineTo(ax - 8, ay - 30); c.lineTo(ax - 14, ay - 17); c.lineTo(ax - 22, ay - 17); c.fill();
    c.fillStyle = '#3a4650'; c.fillRect(ax - 14, ay - 10, 28, 6); c.fillStyle = 'rgba(255,255,255,.3)'; for (let k = 0; k < 4; k++) c.fillRect(ax - 12 + k * 7, ay - 9, 3, 4);
    c.fillStyle = '#ffe7a0'; c.beginPath(); c.arc(ax - 21, ay - 8, 3, 0, 7); c.arc(ax + 21, ay - 8, 3, 0, 7); c.fill();
    c.fillStyle = '#1a1e24'; c.fillRect(ax - 25, ay - 2, 9, 3.4); c.fillRect(ax + 16, ay - 2, 9, 3.4);
    c.fillStyle = '#d63b4b'; c.fillRect(ax - 1.4, ay - 28, 2.8, 8); c.fillRect(ax - 4, ay - 25.6, 8, 2.8);
    c.fillStyle = '#9aa3aa'; c.fillRect(ax - 14, ay - 38, 28, 4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(ax - 14, ay - 38, 28, 1);
    // wheelchair rail
    c.strokeStyle = '#8f9aa1'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(b.x + 100, bot - 8); c.lineTo(b.x + 100, bot - 22); c.lineTo(b.x + 60, bot - 22); c.stroke();
  },
  biz(c, b, d, ft, bot, cx, r) {
    wPaintRoofProp(c, 0, b.x + 60, b.y, r); wPaintRoofProp(c, 5, b.x + b.w - 100, b.y, r);
    // fluted columns either side of the entrance
    [cx - 36, cx + 36].forEach(px => {
      const top = bot - 78, h = bot - 12 - top;
      const cg = c.createLinearGradient(px - 5, 0, px + 5, 0); cg.addColorStop(0, '#d9d0e2'); cg.addColorStop(0.4, '#f6f1fa'); cg.addColorStop(1, '#a89cb6');
      c.fillStyle = 'rgba(8,10,28,.25)'; c.fillRect(px + 4, top + 4, 4, h); c.fillStyle = cg; c.fillRect(px - 5, top, 10, h);
      c.fillStyle = 'rgba(0,0,0,.14)'; for (let k = -3; k <= 3; k += 2) c.fillRect(px + k * 1.2, top + 6, 0.8, h - 10);
      c.fillStyle = '#efe8f4'; c.fillRect(px - 7, top - 3, 14, 5); c.fillRect(px - 6.4, bot - 18, 12.8, 6); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(px - 7, top - 3, 14, 1); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px - 7, top + 1, 14, 1);
    });
    // brass wPlaque and flags
    c.fillStyle = '#c9a24a'; c.fillRect(cx + 54, bot - 44, 16, 11); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(cx + 54, bot - 44, 16, 1); c.fillStyle = 'rgba(60,40,10,.6)'; for (let k = 0; k < 3; k++) c.fillRect(cx + 56, bot - 41 + k * 2.6, 9 + (k % 2) * 3, 0.9);
    [[b.x + 10, '#e0b0ff'], [b.x + b.w - 10, '#4a3560']].forEach(p => {
      c.fillStyle = '#6a737a'; c.fillRect(p[0] - 1, b.y - 44, 2, 44); c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(p[0], b.y - 45, 2.2, 0, 7); c.fill();
      c.fillStyle = p[1]; c.beginPath(); c.moveTo(p[0] + 1, b.y - 42); c.quadraticCurveTo(p[0] + 10, b.y - 38, p[0] + 18, b.y - 42); c.lineTo(p[0] + 18, b.y - 31); c.quadraticCurveTo(p[0] + 10, b.y - 35, p[0] + 1, b.y - 31); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(p[0] + 2, b.y - 41, 14, 1.4);
    });
  },
  edu(c, b, d, ft, bot, cx, r) {
    // the school bell cupola
    const base = b.y, bw = 40;
    c.fillStyle = 'rgba(8,10,28,.25)'; c.fillRect(cx - bw / 2 - 1, base - 12, bw + 4, 13);
    const bg = c.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0); bg.addColorStop(0, '#f0e6d0'); bg.addColorStop(1, '#b8a888');
    c.fillStyle = bg; c.fillRect(cx - bw / 2, base - 12, bw, 12); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(cx - bw / 2, base - 12, bw, 1.4);
    c.fillStyle = '#6a2a20'; c.fillRect(cx - bw / 2 - 2, base - 14, bw + 4, 3);
    const tg = c.createLinearGradient(cx - 13, 0, cx + 13, 0); tg.addColorStop(0, '#f6eedc'); tg.addColorStop(1, '#bfae8a');
    c.fillStyle = tg; c.fillRect(cx - 13, base - 38, 26, 25);
    c.fillStyle = '#2a1a14'; c.beginPath(); c.moveTo(cx - 8, base - 15); c.lineTo(cx - 8, base - 30); c.arc(cx, base - 30, 8, Math.PI, 0); c.lineTo(cx + 8, base - 15); c.closePath(); c.fill();
    c.fillStyle = '#d9a42a'; c.beginPath(); c.moveTo(cx - 5, base - 20); c.quadraticCurveTo(cx - 6, base - 31, cx, base - 31); c.quadraticCurveTo(cx + 6, base - 31, cx + 5, base - 20); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(cx - 3.6, base - 29, 1.4, 8); c.fillStyle = '#7a5a10'; c.fillRect(cx - 0.8, base - 20, 1.6, 3.4);
    c.fillStyle = '#c9722a'; c.beginPath(); c.moveTo(cx - 17, base - 38); c.lineTo(cx, base - 58); c.lineTo(cx + 17, base - 38); c.closePath(); c.fill();
    c.fillStyle = '#8a3b2e'; c.beginPath(); c.moveTo(cx - 17, base - 38); c.lineTo(cx, base - 58); c.lineTo(cx + 17, base - 38); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(cx - 17, base - 38); c.lineTo(cx, base - 58); c.lineTo(cx - 4, base - 38); c.fill();
    c.strokeStyle = '#2b3138'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, base - 58); c.lineTo(cx, base - 64); c.stroke(); c.fillStyle = '#2b3138'; c.beginPath(); c.moveTo(cx + 1, base - 63); c.lineTo(cx + 8, base - 61); c.lineTo(cx + 1, base - 59); c.fill();
    // a flag and an apple emblem on the sign band
    [b.x + 24, b.x + b.w - 24].forEach(x => {
      const y = b.y + 24;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(x + 0.8, y + 2, 7.4, 0, 7); c.fill();
      c.fillStyle = '#d63b4b'; c.beginPath(); c.arc(x - 2.4, y + 1, 5, 0, 7); c.arc(x + 2.4, y + 1, 5, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x - 3.2, y - 1, 1.8, 0, 7); c.fill();
      c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y - 3); c.lineTo(x + 1, y - 8); c.stroke(); c.fillStyle = '#4fae62'; c.beginPath(); c.ellipse(x + 4, y - 7, 3.4, 1.6, -0.4, 0, 7); c.fill();
    });
    // paper art taped up behind the lower windows is handled by the rooms; a bike rack by the steps
    c.strokeStyle = '#8f9aa1'; c.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const px = b.x + 108 + k * 8; c.beginPath(); c.moveTo(px, bot - 2); c.lineTo(px, bot - 10); c.arc(px + 4, bot - 10, 4, Math.PI, 0); c.lineTo(px + 8, bot - 2); c.stroke(); }
  },
  cook(c, b, d, ft, bot, cx, r) {
    // kitchen exhaust hood and stack on the roof
    const hx = b.x + 34;
    c.fillStyle = 'rgba(8,10,28,.28)'; c.fillRect(hx - 2, b.y - 4, 56, 4);
    const hg = c.createLinearGradient(hx, 0, hx + 52, 0); hg.addColorStop(0, '#d9a56a'); hg.addColorStop(0.5, '#b8783f'); hg.addColorStop(1, '#7a4a28');
    c.fillStyle = hg; c.beginPath(); c.moveTo(hx, b.y); c.lineTo(hx + 52, b.y); c.lineTo(hx + 44, b.y - 18); c.lineTo(hx + 8, b.y - 18); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(hx, b.y); c.lineTo(hx + 8, b.y - 18); c.lineTo(hx + 18, b.y - 18); c.lineTo(hx + 8, b.y); c.fill();
    c.fillStyle = '#9a6a3c'; c.fillRect(hx + 18, b.y - 36, 16, 19); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(hx + 18, b.y - 36, 3, 19); c.fillStyle = '#5a3a24'; c.fillRect(hx + 14, b.y - 39, 24, 4);
    wPaintRoofProp(c, 1, b.x + b.w - 70, b.y, r);
    // string lights and a copper pan sign
    const ly = b.y + 6;
    c.strokeStyle = 'rgba(30,22,16,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x + 12, ly - 4); c.quadraticCurveTo(cx, ly + 16, b.x + b.w - 12, ly - 4); c.stroke();
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, bx = b.x + 12 + t * (b.w - 24), by = (1 - t) * (1 - t) * (ly - 4) + 2 * t * (1 - t) * (ly + 16) + t * t * (ly - 4) + 3;
      c.fillStyle = '#ffe4a0'; c.beginPath(); c.arc(bx, by, 2, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(bx - 0.5, by - 0.5, 0.7, 0, 7); c.fill();
    }
    const px = b.x + b.w - 20, py = bot - 62;
    c.strokeStyle = '#2b3138'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px - 12, py - 8); c.lineTo(px + 12, py - 8); c.stroke(); c.lineWidth = 0.9; c.beginPath(); c.moveTo(px - 6, py - 8); c.lineTo(px - 6, py - 2); c.moveTo(px + 6, py - 8); c.lineTo(px + 6, py - 2); c.stroke();
    const pg = c.createRadialGradient(px - 3, py + 2, 1, px, py + 6, 12); pg.addColorStop(0, '#f2b87a'); pg.addColorStop(0.6, '#c9753f'); pg.addColorStop(1, '#8a4a24');
    c.fillStyle = pg; c.beginPath(); c.arc(px, py + 6, 10, 0, 7); c.fill(); c.strokeStyle = '#6a3a1c'; c.lineWidth = 1.4; c.beginPath(); c.arc(px, py + 6, 9.4, 0, 7); c.stroke();
    c.fillStyle = '#6a3a1c'; c.fillRect(px + 8, py + 4.6, 9, 2.6);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(px - 3.4, py + 2.6, 3, 3.6, 5.2); c.stroke();
  }
};
function wHeroWork(c, b, d, rh) {
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, id = d.id, r = mulberry32(900 + id.charCodeAt(0) * 7 + id.length);
  for (let row = 0; row < 2; row++) {
    const ry = ft + 16 + row * 56;
    c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(b.x + 12, ry, b.w - 24, 42);
    wFadeV(c, b.x + 12, ry, b.w - 24, 9, 0.26, 0, '0,0,0');
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(b.x + 12, ry + 41, b.w - 24, 1);
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(b.x + 12, ry, b.w - 24, 1);
  }
  c.fillStyle = d.accent; c.globalAlpha = 0.9; c.fillRect(b.x, ft + 6, b.w, 3); c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(b.x, ft + 6, b.w, 1); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(b.x, ft + 9, b.w, 1); wFadeV(c, b.x, ft + 10, b.w, 5, 0.2, 0, '8,10,28');
  wGlassCanopy(c, cx, bot, d.roof);
  if (W_WORK_DETAIL[id]) W_WORK_DETAIL[id](c, b, d, ft, bot, cx, r);
}
/* the moving parts: LED strip glow after dark, the ambulance light bar, kitchen steam */
function wWorkLive(c, b, d, lit) {
  const ft = b.y + 46, bot = b.y + b.h, hv = W_WORK_HERO[d.id] || W_WORK_HERO.cs;
  if (FX.nf > 0.05 && lit) for (let k = 1; k <= 3; k++) addEmit(b.x + b.w * k / 4, ft + 7.5, 40, hv.glow, 0.22);
  const t = REDUCED ? 0 : FX.time;
  if (d.id === 'nurse') {
    const bx = b.x + b.w - 94 + 40, ay = bot - 8, ph = Math.floor(t * 3) % 2;
    c.fillStyle = ph ? '#ff4d5e' : '#ffb0b8'; c.fillRect(bx - 12, ay - 37, 10, 3); c.fillStyle = ph ? '#9ac4ff' : '#4d86e0'; c.fillRect(bx + 2, ay - 37, 10, 3);
    if (FX.nf > 0.05) { addEmit(bx - 7, ay - 36, 16, 2, ph ? 0.6 : 0.2); addEmit(bx + 7, ay - 36, 16, 1, ph ? 0.2 : 0.6); }
  } else if (d.id === 'cook' && !REDUCED) {
    const hx = b.x + 34 + 26;
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.25 + i / 6) % 1;
      c.fillStyle = 'rgba(245,248,252,' + (0.34 * (1 - p)).toFixed(3) + ')'; c.beginPath(); c.arc(hx + Math.sin(p * 5 + i) * 5 + p * 26 * FX.wind, b.y - 40 - p * 52, 4 + p * 11, 0, 7); c.fill();
    }
    if (FX.nf > 0.05 && lit) for (let i = 0; i <= 14; i += 2) { const tt = i / 14; addEmit(b.x + 12 + tt * (b.w - 24), b.y + 5 + 40 * tt * (1 - tt), 9, 5, 0.5); }
  }
}
