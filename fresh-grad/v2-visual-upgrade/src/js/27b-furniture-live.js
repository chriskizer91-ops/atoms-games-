// live overlays for furniture (v2)
// Painted every frame on top of the cached room: lit screens, blinking LEDs, flames, fish, tumbling washers.
// Each one repaints a small rectangle that the static painter left dark or neutral, and registers its own light.
// They are cheap on purpose (a handful of fills each) and fall back to a still frame under prefers-reduced-motion.
const LT = () => (REDUCED ? 0 : FX.time);
/* the lit face of a screen: a gradient, rows of pretend text that scroll, a blinking cursor, and a glow when it is dark */
function liveScreen(c, x, y, w, h, col, seed, glow) {
  const t = LT();
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, shade(col, 0.12)], [1, shade(col, -0.18)]]); c.fillRect(x, y, w, h);
  const rows = Math.max(2, Math.floor(h / 3.4)), off = (t * 2.4) % 3.4;
  for (let i = 0; i < rows + 1; i++) {
    const v = hash01(i + Math.floor(t * 0.7), seed, 5), len = (0.25 + hash01(i + Math.floor(t * 0.7), seed, 6) * 0.65) * (w - 5), ind = (v > 0.7 ? 4 : 0);
    c.fillStyle = 'rgba(8,20,30,.42)'; c.fillRect(x + 2.4 + ind, y + 1.4 + i * 3.4 - off, Math.max(2, len - ind), 1.5);
  }
  if (!REDUCED && Math.floor(t * 2) % 2) { c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x + w - 6, y + h - 4.6, 2.2, 3); }
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, y, w, 1.2);
  c.restore();
  IM.glints(c, x, y, w, h, 0.16);
  if (glow !== false && FX.nf > 0.05) { litRect(x, y, w, h); addEmit(x + w / 2, y + h / 2, Math.max(16, w * 0.9), 1, 0.2); }
}
Object.assign(FURN_LIVE, {
  tv(c, f) {
    const t = LT(), on = FX.nf > 0.25, x = f.x + 3, y = f.y + 2.4, w = f.w - 6, h = f.h - 13;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, on ? mix('#3d6ea3', '#7a5ac8', 0.5 + 0.5 * Math.sin(t * 1.3)) : '#27384a'); g.addColorStop(1, on ? mix('#5ab0c9', '#e07a5f', 0.5 + 0.5 * Math.sin(t * 0.9 + 1)) : '#1f2c3a');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    if (on) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + ((t * 18) % (w + 20)) - 10, y, 8, h); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x, y + h * 0.58, w, 1.2); }
    c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(x + 2, y + h); c.lineTo(x + w * 0.3, y); c.lineTo(x + w * 0.44, y); c.lineTo(x + w * 0.16, y + h); c.closePath(); c.fill();
    c.restore();
    if (on) { litRect(x, y, w, h); addLight(f.x + f.w / 2, f.y + f.h + 60, 130, 90, 1, 0.45 + 0.1 * Math.sin(t * 5)); addEmit(f.x + f.w / 2, f.y + 10, f.w * 0.5, 1, 0.2); }
  },
  desk(c, f) {
    if (f.pc === false) return;
    const mx = f.x + f.w / 2 - 15, scr = f.screen || '#6fd1ff';
    liveScreen(c, mx + 1.8, f.y + 4.8, 26.4, 15.4, scr, fsd(f), true);
  },
  machine(c, f) {
    const lab = (f.label || '').toUpperCase(), t = LT(), x = f.x, y = f.y, w = f.w, h = f.h, scr = f.screen || '#6fd1ff';
    if (/SNACKS|SODA/.test(lab) && h >= 60) { litRect(x + 4, y + 14, w - 16, h - 36); if (FX.nf > 0.05) addLight(x + w / 2, y + h + 16, 70, 50, 1, 0.4); return; }
    if (/H2O/.test(lab)) { if (FX.nf > 0.05) addEmit(x + w / 2, y + h * 0.25, 18, 1, 0.3); c.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.2 * Math.sin(t * 2)).toFixed(3) + ')'; c.beginPath(); c.arc(x + w * 0.5, y + h * 0.3 + ((t * 8) % 6), 1.2, 0, 7); c.fill(); return; }
    if (/ARCADE/.test(lab)) { liveScreen(c, x + 10, y + 14, w - 20, h * 0.18, '#f72585', fsd(f), true); c.fillStyle = (Math.floor(t * 3) % 2) ? '#fff6d0' : '#ffd166'; c.fillRect(x + 6, y + 2, w - 12, 4); addEmit(x + w / 2, y + h * 0.25, 30, 4, 0.5); return; }
    if (/CNC|LATHE|3D/.test(lab)) { liveScreen(c, x + w * 0.72, y + 14, w * 0.2, 8, scr, fsd(f), true); c.fillStyle = (Math.floor(t * 2) % 2) ? '#3bff6a' : '#1d8a3a'; c.beginPath(); c.arc(x + w * 0.86, y + 28, 2, 0, 7); c.fill(); return; }
    if (lab === 'BP') { liveScreen(c, x + 8, y + 10, w - 16, 14, scr, fsd(f), true); return; }
    if (/GRILL|FRYER|OVEN/.test(lab)) { c.fillStyle = 'rgba(255,159,67,.85)'; c.fillRect(x + 6, y + 9, w - 12, 5); if (FX.nf > 0.05) { addEmit(x + w / 2, y + 11, 22, 5, 0.3 + 0.06 * Math.sin(t * 7)); } return; }
    if (f.screen) { liveScreen(c, x + 6, y + 8, w - 12, Math.min(16, h * 0.3) - 2, scr, fsd(f), true); }
  },
  server(c, f) {
    const t = LT(), r = IM.rng(fsd(f), 6, 7);
    for (let yy = f.y + 7, i = 0; yy < f.y + f.h - 12; yy += 9, i++) {
      const on = r() < 0.5, blink = hash01(i, fsd(f), Math.floor(t * 3.2)) > 0.4;
      c.fillStyle = on ? (blink ? '#3bff6a' : '#16642a') : (blink ? '#ffd23b' : '#6a5410'); c.fillRect(f.x + f.w - 10.5, yy + 2.6, 2.2, 2.2);
      c.fillStyle = blink ? '#4cc9f0' : '#1b5a72'; c.fillRect(f.x + f.w - 14, yy + 2.6, 2, 2.2);
    }
    if (FX.nf > 0.05) addEmit(f.x + f.w / 2, f.y + f.h * 0.5, 34, 3, 0.18);
  },
  washer(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, dry = !!f.dry, t = LT();
    const cx = x + w / 2, cy = y + h * 0.58, r = Math.min(w * 0.34, (h - 16) * 0.4);
    if (!f.on) { c.fillStyle = '#9aa7ad'; c.fillRect(x + w - 10, y + 4, 4, 3); return; }
    c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.clip();
    c.fillStyle = dry ? '#3a2417' : '#12293a'; c.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (!dry) { c.fillStyle = 'rgba(120,190,230,.5)'; c.fillRect(cx - r, cy + r * 0.1 + Math.sin(t * 3) * 1.2, r * 2, r); }
    const a = t * (dry ? 4 : 6) + f.x;
    ['#e76f51', '#8ecae6', '#e9c46a', '#f6f1e7'].forEach((col, i) => {
      const ang = a + i * 1.57, px = cx + Math.cos(ang) * r * 0.5, py = cy + Math.sin(ang) * r * 0.5;
      c.fillStyle = col; c.beginPath(); c.ellipse(px, py, r * 0.34, r * 0.24, ang, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(px - 1, py - 1, r * 0.14, r * 0.08, ang, 0, 7); c.fill();
    });
    if (dry) { c.fillStyle = 'rgba(255,170,80,.25)'; c.fillRect(cx - r, cy - r, r * 2, r * 2); }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(cx - r * 0.34, cy - r * 0.34, r * 0.4, Math.PI * 1.05, Math.PI * 1.75); c.lineTo(cx - r * 0.34, cy - r * 0.34); c.fill();
    c.restore();
    c.fillStyle = '#3bff6a'; c.fillRect(x + w - 10, y + 4, 4, 3); c.fillStyle = '#5fe39a'; c.fillRect(x + w - 20, y + 5.4, 3 + (Math.floor(t * 2) % 4) * 1.6, 3);
    addEmit(x + w - 8, y + 5, 8, 3, 0.5);
  },
  oven(c, f) {
    const t = LT(), mx = f.x + f.w / 2, my = f.y + f.h * 0.7, fl = REDUCED ? 0.5 : (Math.sin(t * 9) + Math.sin(t * 13.7)) * 0.25 + 0.5;
    const g = c.createRadialGradient(mx, f.y + f.h - 4, 2, mx, f.y + f.h - 4, 24); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.4, '#ff9f43'); g.addColorStop(1, 'rgba(208,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(mx - 19, f.y + f.h); c.lineTo(mx - 19, my + 2); c.arc(mx, my + 2, 19, Math.PI, 0); c.lineTo(mx + 19, f.y + f.h); c.closePath(); c.save(); c.clip(); c.fillRect(mx - 20, my - 20, 40, 40);
    for (let i = 0; i < 4; i++) { const fx = mx - 12 + i * 8 + Math.sin(t * 6 + i) * 1.4, fh = 7 + fl * 7 + (i % 2) * 3; c.fillStyle = i % 2 ? '#ffd166' : '#ff7a2f'; c.beginPath(); c.moveTo(fx - 3.2, f.y + f.h); c.quadraticCurveTo(fx - 1, f.y + f.h - fh * 0.6, fx + Math.sin(t * 8 + i) * 1.6, f.y + f.h - fh); c.quadraticCurveTo(fx + 1, f.y + f.h - fh * 0.6, fx + 3.2, f.y + f.h); c.fill(); }
    c.restore();
    addLight(mx, f.y + f.h + 20, 120, 70, 5, 0.75 + fl * 0.25); addEmit(mx, f.y + f.h - 6, 30 + fl * 6, 5, 0.7 + fl * 0.2);
  },
  jukebox(c, f) {
    const t = LT(), cols = ['#ffd166', '#ff7a95', '#7ae0ff', '#9bff8a'], cx = f.x + f.w / 2, col = cols[Math.floor(t * 1.5) % 4];
    c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.arc(cx, f.y + f.h * 0.4, f.w * 0.37, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.fillStyle = col; c.globalAlpha = 0.5; for (let k = 0; k < 5; k++) c.fillRect(f.x + f.w * 0.2 + k * (f.w * 0.12), f.y + f.h * 0.74, f.w * 0.07, 3); c.globalAlpha = 1;
    addEmit(cx, f.y + f.h * 0.4, f.w, Math.floor(t * 1.5) % 4 === 1 ? 4 : 0, 0.34);
  },
  popcorn(c, f) {
    const t = LT();
    c.save(); rr(c, f.x + 6, f.y + 6, f.w - 12, f.h * 0.56, 4); c.clip();
    for (let i = 0; i < 9; i++) { const px = f.x + 9 + hash01(i, 1, 4) * (f.w - 18), py = f.y + 8 + hash01(i, 2, 4) * (f.h * 0.3) - Math.abs(Math.sin(t * 7 + i)) * 4; c.fillStyle = i % 2 ? '#fff4c9' : '#ffe08a'; c.beginPath(); c.arc(px, py, 2.2, 0, 7); c.fill(); }
    c.restore();
    addEmit(f.x + f.w / 2, f.y + f.h * 0.4, 26, 5, 0.5);
  },
  tank(c, f) {
    const t = LT(), gx = f.x + 4, gy = f.y + 4, gw = f.w - 8, gh = f.h - 15;
    c.save(); c.beginPath(); c.rect(gx, gy, gw, gh - 8); c.clip();
    // waving weed
    c.fillStyle = '#2f9d6a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(gx + 12 + i * (gw - 24) / 3, gy + gh - 18, 3, 9, Math.sin(t + i) * 0.3, 0, 7); c.fill(); }
    ['#ff9f43', '#ffd166', '#f72585'].forEach((col, i) => {
      const tt = t * (0.3 + i * 0.1) + i * 2, fx = gx + 8 + ((Math.sin(tt) + 1) / 2) * (gw - 16), fy = gy + 8 + i * (gh - 26) / 3 + Math.sin(tt * 2.3) * 2, dir = Math.cos(tt) > 0 ? 1 : -1;
      c.fillStyle = col; c.beginPath(); c.ellipse(fx, fy, 4, 2.4, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(fx - 4 * dir, fy); c.lineTo(fx - 7 * dir, fy - 2.5); c.lineTo(fx - 7 * dir, fy + 2.5); c.closePath(); c.fill();
      c.fillStyle = '#20262d'; c.fillRect(fx + 2 * dir - 0.5, fy - 0.8, 1, 1);
    });
    c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 6; i++) { const p = (t * 0.35 + i / 6) % 1; c.beginPath(); c.arc(gx + 10 + (i % 3) * 26 + Math.sin(p * 8 + i) * 1.5, gy + gh - 10 - p * (gh - 14), 0.9 + (i % 2) * 0.5, 0, 7); c.fill(); }
    c.restore();
  },
  claw(c, f) {
    const t = LT(), cx = f.x + f.w / 2 + Math.sin(t * 0.8) * (f.w * 0.22), gy = f.y + 12;
    c.strokeStyle = '#c9cdd2'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, gy); c.lineTo(cx, gy + 12); c.stroke();
    c.fillStyle = '#9aa7ad'; c.fillRect(cx - 2.4, gy + 10, 4.8, 3);
    c.strokeStyle = '#dfe5e9'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 5, gy + 19); c.lineTo(cx - 2, gy + 13); c.moveTo(cx + 5, gy + 19); c.lineTo(cx + 2, gy + 13); c.stroke();
    c.fillStyle = '#fff6d0'; for (let k = 0; k < Math.floor((f.w - 10) / 7); k++) if ((k + Math.floor(t * 4)) % 3 === 0) { c.beginPath(); c.arc(f.x + 7 + k * 7, f.y + 6, 1.8, 0, 7); c.fill(); }
    addEmit(f.x + f.w / 2, f.y + f.h * 0.3, 26, 4, 0.7);
  },
  gadget(c, f) {
    if (f.kind === 'turntable') {
      const t = LT(), x = f.x, y = f.y, w = f.w, h = (f.dh || f.h);
      const cx = x + w * 0.42, cy = y + (h - 7) * 0.5, r = Math.min(w, h - 7) * 0.4;
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r * 0.8, t * 1.8, t * 1.8 + 0.9); c.stroke();
      return;
    }
    c.fillStyle = (Math.floor(LT() * 1.2) % 2) ? '#3bff6a' : '#16642a'; c.fillRect(f.x + 5, f.y + 4, 4, 3);
  },
  stove(c, f) {
    const t = LT(), w = f.w, h = f.h, big = w > 80, fh = Math.min(20, h * 0.42), cols = big ? 3 : 2, rowsN = 2, r = Math.min((w - 8) / cols, (h - fh - 6) / rowsN) * 0.32;
    [[1], [big ? 4 : -1]].forEach(a => {
      const i = a[0]; if (i < 0) return;
      const bx = f.x + 4 + ((i % cols) + 0.5) * (w - 8) / cols, by = f.y + 4 + (((i / cols) | 0) + 0.5) * (h - fh - 6) / rowsN;
      c.strokeStyle = 'rgba(255,140,60,' + (0.55 + 0.25 * Math.sin(t * 6 + i)).toFixed(3) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(bx, by, r * 0.62, 0, 7); c.stroke();
      if (FX.nf > 0.05) addEmit(bx, by, 14, 5, 0.3);
    });
  }
});
