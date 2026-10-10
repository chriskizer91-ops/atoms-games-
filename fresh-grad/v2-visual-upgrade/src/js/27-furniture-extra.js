/* ---------- furniture for the new rooms ---------- */
Object.assign(FURN_FLAT, { stage: 1, runner: 1 });
function bottle(c, x, y, col) { c.fillStyle = col; rr(c, x, y, 5, 10, 1.5); c.fill(); c.fillRect(x + 1.5, y - 3, 2, 3); }
Object.assign(FURN, {
  cloth(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#f6f1e7');
    c.save(); rr(c, f.x, f.y, f.w, f.h - 5, 2.5); c.clip();
    c.fillStyle = f.c || '#c0392b'; const sz = 11;
    for (let y = 0; y * sz < f.h; y++) for (let x = 0; x * sz < f.w; x++) if ((x + y) % 2 === 0) c.fillRect(f.x + x * sz, f.y + y * sz, sz, sz);
    c.restore();
    c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(f.x, f.y + f.h - 5, f.w, 5);
    c.fillStyle = '#c47a3a'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h / 2 - 2, 7, 0, 7); c.fill(); c.fillStyle = '#f4c26b'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h / 2 - 2, 5.5, 0, 7); c.fill();
  },
  runner(c, f) {
    c.fillStyle = f.c || '#7a1f33'; c.fillRect(f.x, f.y, f.w, f.h);
    c.fillStyle = '#d4a017'; c.fillRect(f.x + 4, f.y, 3, f.h); c.fillRect(f.x + f.w - 7, f.y, 3, f.h);
    c.fillStyle = 'rgba(255,255,255,.06)'; for (let y = f.y + 10; y < f.y + f.h; y += 20) c.fillRect(f.x + 10, y, f.w - 20, 2);
  },
  armchair(c, f) {
    const col = f.c || '#8a4a38';
    c.fillStyle = 'rgba(10,12,26,.16)'; rr(c, f.x - 1, f.y + f.h - 6, f.w + 4, 11, 5); c.fill();
    c.fillStyle = shade(col, -0.12); rr(c, f.x, f.y, f.w, f.h, 8); c.fill();
    c.fillStyle = col; rr(c, f.x + 7, f.y + 12, f.w - 14, f.h - 16, 6); c.fill();
    c.fillStyle = shade(col, -0.2); rr(c, f.x, f.y, f.w, 13, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(f.x + 9, f.y + 14, f.w - 18, 3);
  },
  pcase(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#8b6240', 'rgba(255,255,255,.2)');
    c.fillStyle = 'rgba(210,235,245,.55)'; c.fillRect(f.x + 4, f.y + 3, f.w - 8, f.h * 0.62);
    const items = f.items || ['#d9a05b', '#c47a3a', '#f4d58d', '#e76f51', '#f6e7cb'];
    for (let i = 0, x = f.x + 9; x < f.x + f.w - 14; x += 16, i++) {
      const col = items[i % items.length];
      c.fillStyle = col;
      if (f.kind === 'pizza') { c.beginPath(); c.arc(x + 6, f.y + f.h * 0.34, 7, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x + 4, f.y + f.h * 0.3, 1.6, 0, 7); c.arc(x + 8, f.y + f.h * 0.38, 1.6, 0, 7); c.fill(); }
      else if (i % 3 === 0) { c.beginPath(); c.moveTo(x, f.y + f.h * 0.5); c.quadraticCurveTo(x + 6, f.y + 4, x + 12, f.y + f.h * 0.5); c.closePath(); c.fill(); }
      else { rr(c, x, f.y + f.h * 0.2, 11, f.h * 0.3, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 2, f.y + f.h * 0.22, 7, 2); }
    }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(f.x + 4, f.y + 3, f.w - 8, 2);
    if (FX.nf > 0.05) litRect(f.x + 4, f.y + 3, f.w - 8, f.h * 0.6);
  },
  popcorn(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#c0392b', 'rgba(255,255,255,.25)');
    c.fillStyle = 'rgba(255,248,220,.85)'; c.fillRect(f.x + 5, f.y + 4, f.w - 10, f.h * 0.6);
    c.fillStyle = '#ffe08a'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(f.x + 8 + hash01(i, 1, 4) * (f.w - 16), f.y + f.h * 0.4 + hash01(i, 2, 4) * f.h * 0.22 - (REDUCED ? 0 : Math.abs(Math.sin(FX.time * 7 + i)) * 3), 2.4, 0, 7); c.fill(); }
    c.fillStyle = '#f6f1e7'; c.fillRect(f.x + 4, f.y + f.h - 10, f.w - 8, 4);
    addEmit(f.x + f.w / 2, f.y + f.h * 0.4, 26, 5, 0.6);
  },
  salonchair(c, f) {
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    c.fillStyle = 'rgba(10,12,26,.18)'; c.beginPath(); c.ellipse(cx, f.y + f.h - 2, f.w / 2, 6, 0, 0, 7); c.fill();
    c.fillStyle = '#9aa7ad'; c.beginPath(); c.ellipse(cx, f.y + f.h - 6, f.w * 0.3, 5, 0, 0, 7); c.fill();
    c.fillStyle = f.c || '#3a3340'; rr(c, f.x + 4, f.y + 8, f.w - 8, f.h - 18, 8); c.fill();
    c.fillStyle = shade(f.c || '#3a3340', 0.15); rr(c, f.x + 2, f.y, f.w - 4, 14, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(f.x + 8, f.y + 16, f.w - 16, 3);
    void cy;
  },
  washer(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.dry ? '#e6dcd0' : '#f4f7f9', 'rgba(255,255,255,.6)');
    const cx = f.x + f.w / 2, cy = f.y + f.h * 0.52, r = Math.min(f.w, f.h) * 0.3;
    c.fillStyle = '#b9c4ca'; c.beginPath(); c.arc(cx, cy, r + 3, 0, 7); c.fill();
    c.fillStyle = f.dry ? '#3a2e28' : '#20313d'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    if (f.on) {
      const a = (REDUCED ? 0 : FX.time) * (f.dry ? 4 : 6) + f.x;
      ['#e76f51', '#8ecae6', '#e9c46a'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(cx + Math.cos(a + i * 2.1) * r * 0.5, cy + Math.sin(a + i * 2.1) * r * 0.5, r * 0.32, 0, 7); c.fill(); });
      c.fillStyle = '#3bff6a'; c.fillRect(f.x + f.w - 10, f.y + 4, 4, 3);
      addEmit(f.x + f.w - 8, f.y + 5, 8, 3, 0.6);
    } else { c.fillStyle = '#9aa7ad'; c.fillRect(f.x + f.w - 10, f.y + 4, 4, 3); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx - r * 0.3, cy - r * 0.3, r * 0.45, Math.PI, Math.PI * 1.6); c.lineTo(cx - r * 0.3, cy - r * 0.3); c.fill();
  },
  bikedisp(c, f) {
    c.fillStyle = 'rgba(10,12,26,.16)'; c.fillRect(f.x, f.y + f.h - 4, f.w, 6);
    c.fillStyle = '#5a6672'; c.fillRect(f.x, f.y + f.h - 6, f.w, 4);
    const n = Math.max(1, Math.floor(f.w / 50)), cols = f.cols || ['#e76f51', '#2a9d8f', '#e9c46a', '#4361ee'];
    for (let i = 0; i < n; i++) {
      const x = f.x + (i + 0.5) * f.w / n;
      c.save(); c.translate(x, f.y + f.h - 4); c.scale(1.35, 1.35);
      drawBike(c, 0, 0, cols[i % cols.length], 1, i);
      c.restore();
    }
  },
  oven(c, f) {
    const cx = f.x + f.w / 2;
    c.fillStyle = 'rgba(10,12,26,.2)'; c.beginPath(); c.ellipse(cx, f.y + f.h, f.w / 2, 8, 0, 0, 7); c.fill();
    c.fillStyle = '#9a4a32'; c.beginPath(); c.moveTo(f.x, f.y + f.h); c.lineTo(f.x, f.y + f.h * 0.45); c.quadraticCurveTo(cx, f.y - f.h * 0.4, f.x + f.w, f.y + f.h * 0.45); c.lineTo(f.x + f.w, f.y + f.h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
    for (let r = 0; r < 4; r++) { c.beginPath(); c.moveTo(f.x, f.y + f.h * (0.55 + r * 0.12)); c.lineTo(f.x + f.w, f.y + f.h * (0.55 + r * 0.12)); c.stroke(); }
    const mx = cx, my = f.y + f.h * 0.7;
    c.fillStyle = '#1a0d08'; c.beginPath(); c.moveTo(mx - 20, f.y + f.h); c.lineTo(mx - 20, my); c.arc(mx, my, 20, Math.PI, 0); c.lineTo(mx + 20, f.y + f.h); c.closePath(); c.fill();
    const fl = REDUCED ? 0.5 : (Math.sin(FX.time * 9) + Math.sin(FX.time * 13.7)) * 0.25 + 0.5;
    const g = c.createRadialGradient(mx, f.y + f.h - 4, 2, mx, f.y + f.h - 4, 22); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.4, '#ff9f43'); g.addColorStop(1, 'rgba(208,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(mx, f.y + f.h - 6, 16, 10 + fl * 5, 0, 0, 7); c.fill();
    c.fillStyle = '#5a6672'; c.fillRect(cx - 4, f.y - f.h * 0.2, 8, f.h * 0.25);
    addLight(mx, f.y + f.h + 20, 120, 70, 5, 0.9); addEmit(mx, f.y + f.h - 6, 30, 5, 0.9);
  },
  dentchair(c, f) {
    c.fillStyle = 'rgba(10,12,26,.16)'; rr(c, f.x - 2, f.y + 6, f.w + 6, f.h, 14); c.fill();
    c.fillStyle = '#9aa7ad'; c.fillRect(f.x + f.w / 2 - 6, f.y + f.h * 0.45, 12, f.h * 0.2);
    c.fillStyle = f.c || '#3aa6b9'; rr(c, f.x, f.y, f.w, f.h, 14); c.fill();
    c.fillStyle = shade(f.c || '#3aa6b9', 0.2); rr(c, f.x + 8, f.y + 6, f.w - 16, 22, 10); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(f.x + 8, f.y + 34, f.w - 16, 3);
    // the lamp arm
    c.strokeStyle = '#c9cdd2'; c.lineWidth = 3; c.beginPath(); c.moveTo(f.x + f.w + 16, f.y + f.h * 0.4); c.lineTo(f.x + f.w + 16, f.y - 6); c.lineTo(f.x + f.w / 2 + 6, f.y - 2); c.stroke();
    c.fillStyle = '#fff6d0'; c.beginPath(); c.ellipse(f.x + f.w / 2 + 4, f.y - 2, 9, 5, 0, 0, 7); c.fill();
    addEmit(f.x + f.w / 2 + 4, f.y - 2, 18, 0, 0.6);
  },
  teller(c, f) {
    FURN.counter(c, Object.assign({}, f, { label: null }));
    const n = f.n || 3;
    for (let i = 0; i <= n; i++) { c.fillStyle = '#c9b78a'; c.fillRect(f.x + i * (f.w - 4) / n, f.y - 18, 4, 22); }
    c.fillStyle = 'rgba(200,230,240,.38)'; c.fillRect(f.x + 2, f.y - 18, f.w - 4, 16);
    c.fillStyle = '#c9b78a'; c.fillRect(f.x, f.y - 20, f.w, 3);
    for (let i = 0; i < n; i++) { c.fillStyle = '#2a6f97'; rr(c, f.x + (i + 0.5) * f.w / n - 14, f.y - 30, 28, 9, 3); c.fill(); signText(c, String(i + 1), f.x + (i + 0.5) * f.w / n, f.y - 25.5, 7, '#fff'); }
  },
  rack(c, f) {
    c.fillStyle = 'rgba(10,12,26,.14)'; c.fillRect(f.x, f.y + f.h - 2, f.w, 5);
    c.fillStyle = '#8f9aa1'; c.fillRect(f.x, f.y, 3, f.h); c.fillRect(f.x + f.w - 3, f.y, 3, f.h); c.fillRect(f.x, f.y + 2, f.w, 3);
    const cols = f.cols || ['#ff7a59', '#2a9d8f', '#e9c46a', '#6f7bd4', '#c05d8a', '#f6f1e7', '#3a3340'];
    for (let i = 0, x = f.x + 8; x < f.x + f.w - 14; x += 13, i++) {
      c.fillStyle = cols[i % cols.length]; rr(c, x, f.y + 5, 11, f.h - 8, 3); c.fill();
      c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x + 8, f.y + 5, 3, f.h - 8);
    }
  },
  tank(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#3a414a', 'rgba(255,255,255,.2)');
    const g = c.createLinearGradient(0, f.y, 0, f.y + f.h); g.addColorStop(0, '#6fd1ff'); g.addColorStop(1, '#2a6f97');
    c.fillStyle = g; c.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 14);
    c.fillStyle = '#e9c46a'; c.fillRect(f.x + 4, f.y + f.h - 14, f.w - 8, 4);
    c.fillStyle = '#2f9d6a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(f.x + 12 + i * (f.w - 24) / 3, f.y + f.h - 18, 3, 9, Math.sin((REDUCED ? 0 : FX.time) + i) * 0.3, 0, 7); c.fill(); }
    ['#ff9f43', '#ffd166', '#f72585'].forEach((col, i) => {
      const t = (REDUCED ? 0 : FX.time) * (0.3 + i * 0.1) + i * 2, fx = f.x + 10 + ((Math.sin(t) + 1) / 2) * (f.w - 20), fy = f.y + 10 + i * (f.h - 24) / 3, dir = Math.cos(t) > 0 ? 1 : -1;
      c.fillStyle = col; c.beginPath(); c.ellipse(fx, fy, 4, 2.4, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(fx - 4 * dir, fy); c.lineTo(fx - 7 * dir, fy - 2.5); c.lineTo(fx - 7 * dir, fy + 2.5); c.closePath(); c.fill();
    });
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(f.x + 6, f.y + 6, 4, f.h - 20);
    addEmit(f.x + f.w / 2, f.y + f.h / 2, 30, 1, 0.5);
  },
  claw(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#f72585', 'rgba(255,255,255,.25)');
    c.fillStyle = 'rgba(210,235,250,.6)'; c.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h * 0.55);
    ['#ffd166', '#4cc9f0', '#8ac926', '#ff9f43'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(f.x + 12 + i * (f.w - 22) / 3, f.y + f.h * 0.5, 5, 0, 7); c.fill(); });
    const cx = f.x + f.w / 2 + Math.sin((REDUCED ? 0 : FX.time) * 0.8) * (f.w * 0.25);
    c.strokeStyle = '#c9cdd2'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, f.y + 6); c.lineTo(cx, f.y + 16); c.moveTo(cx - 4, f.y + 20); c.lineTo(cx, f.y + 16); c.lineTo(cx + 4, f.y + 20); c.stroke();
    c.fillStyle = '#ffe9a8'; c.fillRect(f.x + 4, f.y + f.h * 0.66, f.w - 8, 6);
    addEmit(f.x + f.w / 2, f.y + f.h * 0.3, 26, 4, 0.7);
  },
  crate(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#b98a55');
    c.fillStyle = 'rgba(0,0,0,.14)'; for (let x = f.x + 12; x < f.x + f.w - 6; x += 14) c.fillRect(x, f.y + 3, 2, f.h - 6);
    if (f.fill) { const cols = f.fill; for (let i = 0, x = f.x + 6; x < f.x + f.w - 10; x += 9, i++) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(x + 4, f.y + 8 + (i % 2) * 3, 4.5, 0, 7); c.fill(); } }
    lbl(c, f);
  },
  posts(c, f) {
    const n = Math.max(2, Math.round(f.w / 70));
    c.strokeStyle = '#a83a3a'; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i < n; i++) { const x = f.x + i * f.w / (n - 1); if (i) c.quadraticCurveTo(x - f.w / (n - 1) / 2, f.y + 6, x, f.y - 8); else c.moveTo(x, f.y - 8); }
    c.stroke();
    for (let i = 0; i < n; i++) { const x = f.x + i * f.w / (n - 1); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, f.y + f.h, 6, 2.5, 0, 0, 7); c.fill(); c.fillStyle = '#d4a017'; c.fillRect(x - 1.8, f.y - 10, 3.6, f.h + 10); c.beginPath(); c.arc(x, f.y - 11, 3, 0, 7); c.fill(); }
  },
  stage(c, f) {
    c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, f.x + 3, f.y + 5, f.w, f.h, 6); c.fill();
    c.fillStyle = f.c || '#6b4a30'; rr(c, f.x, f.y, f.w, f.h, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.08)'; for (let y = f.y + 10; y < f.y + f.h; y += 14) c.fillRect(f.x + 4, y, f.w - 8, 1.5);
    c.fillStyle = shade(f.c || '#6b4a30', -0.25); c.fillRect(f.x, f.y + f.h - 6, f.w, 6);
  },
  mic(c, f) {
    const x = f.x + f.w / 2;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, f.y + f.h, 7, 2.5, 0, 0, 7); c.fill();
    c.strokeStyle = '#2b2f36'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, f.y + f.h); c.lineTo(x, f.y + 4); c.stroke();
    c.fillStyle = '#5a6672'; c.beginPath(); c.arc(x, f.y + 3, 3.4, 0, 7); c.fill();
  },
  lamp(c, f) {
    const x = f.x + f.w / 2;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, f.y + f.h, 8, 3, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a3340'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, f.y + f.h); c.lineTo(x, f.y + 10); c.stroke();
    c.fillStyle = f.c || '#f4d58d'; c.beginPath(); c.moveTo(x - 9, f.y + 12); c.lineTo(x + 9, f.y + 12); c.lineTo(x + 6, f.y); c.lineTo(x - 6, f.y); c.closePath(); c.fill();
    addLight(x, f.y + f.h + 6, 110, 70, 0, 0.95); addEmit(x, f.y + 8, 22, 0, 0.8);
  },
  gadget(c, f) {
    // a small machine sitting on a counter: coffee maker, turntable or espresso machine
    if (f.dh) f = Object.assign({}, f, { h: f.dh });
    if (f.kind === 'turntable') {
      box(c, f.x, f.y, f.w, f.h, '#6b4a30', 'rgba(255,255,255,.2)');
      const cx = f.x + f.w * 0.42, cy = f.y + f.h * 0.48, r = Math.min(f.w, f.h) * 0.36;
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.fillStyle = '#e76f51'; c.beginPath(); c.arc(cx, cy, r * 0.32, 0, 7); c.fill();
      c.strokeStyle = '#c9cdd2'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(f.x + f.w - 6, f.y + 5); c.lineTo(f.x + f.w - 8, cy + 2); c.lineTo(cx + r * 0.5, cy + r * 0.3); c.stroke();
      return;
    }
    const big = f.kind === 'espresso';
    box(c, f.x, f.y, f.w, f.h, big ? '#c9cdd2' : '#2b2f36', 'rgba(255,255,255,.35)');
    c.fillStyle = big ? '#3a414a' : '#1a1c22'; c.fillRect(f.x + 4, f.y + f.h * 0.45, f.w - 8, f.h * 0.3);
    c.fillStyle = '#e9e4d8'; rr(c, f.x + f.w / 2 - 5, f.y + f.h * 0.5, 10, 9, 2); c.fill();
    c.fillStyle = big ? '#e63946' : '#3bff6a'; c.fillRect(f.x + 5, f.y + 4, 4, 3);
    if (big) { c.fillStyle = '#e9e4d8'; rr(c, f.x + f.w * 0.2 - 4, f.y + f.h * 0.5, 9, 9, 2); c.fill(); rr(c, f.x + f.w * 0.8 - 4, f.y + f.h * 0.5, 9, 9, 2); c.fill(); }
  },
  atm(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#3a414a', 'rgba(255,255,255,.2)');
    c.fillStyle = '#6fd1ff'; c.fillRect(f.x + 6, f.y + 6, f.w - 12, f.h * 0.35);
    c.fillStyle = '#c9cdd2'; for (let i = 0; i < 9; i++) c.fillRect(f.x + 8 + (i % 3) * 8, f.y + f.h * 0.5 + Math.floor(i / 3) * 6, 6, 4);
    c.fillStyle = '#2a6f97'; c.fillRect(f.x, f.y - 4, f.w, 6); signText(c, 'ATM', f.x + f.w / 2, f.y - 1, 6, '#fff');
    addEmit(f.x + f.w / 2, f.y + 14, 20, 1, 0.6);
  },
  booktable(c, f) {
    FURN.table(c, Object.assign({}, f, { label: null }));
    const cols = ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22'];
    for (let i = 0, x = f.x + 8; x < f.x + f.w - 18; x += 22, i++) {
      const n = 2 + (i % 3);
      for (let k = 0; k < n; k++) { c.fillStyle = cols[(i + k) % cols.length]; rr(c, x - (k % 2), f.y + 6 + (f.h * 0.5) - k * 5, 18, 5, 1); c.fill(); }
    }
    if (f.label) { c.fillStyle = '#f6f1e7'; rr(c, f.x + f.w / 2 - 30, f.y + f.h - 14, 60, 10, 2); c.fill(); signText(c, f.label, f.x + f.w / 2, f.y + f.h - 8.5, 7, '#33261a'); }
  },
  pegboard(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#c9a06a');
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = f.y + 6; y < f.y + f.h - 4; y += 7) for (let x = f.x + 5; x < f.x + f.w - 3; x += 7) c.fillRect(x, y, 1.4, 1.4);
    const tools = ['#c0392b', '#2b2f36', '#e9c46a', '#2a6f97', '#5a6672'];
    for (let i = 0, x = f.x + 10; x < f.x + f.w - 12; x += 20, i++) {
      c.fillStyle = tools[i % tools.length];
      if (i % 3 === 0) { c.fillRect(x, f.y + 6, 3, f.h - 14); c.fillRect(x - 4, f.y + 6, 11, 5); }
      else if (i % 3 === 1) { c.fillRect(x, f.y + 10, 2.6, f.h - 18); c.beginPath(); c.arc(x + 1.3, f.y + 9, 4, 0, 7); c.fill(); }
      else { rr(c, x - 2, f.y + 8, 10, f.h - 16, 3); c.fill(); }
    }
  }
});

/* ---------- things painted on the back wall ---------- */
function wallPoster(c, x, w, cols, text) {
  c.fillStyle = '#d4a017'; c.fillRect(x - 3, 10, w + 6, 64);
  const g = c.createLinearGradient(0, 13, 0, 71); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  c.fillStyle = g; c.fillRect(x, 13, w, 58);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x + w * 0.65, 30, w * 0.18, 0, 7); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(x, 60); c.quadraticCurveTo(x + w / 2, 44, x + w, 58); c.lineTo(x + w, 71); c.lineTo(x, 71); c.closePath(); c.fill();
  c.font = '800 7px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
  let t = text.toUpperCase(); while (c.measureText(t).width > w - 6 && t.length > 4) t = t.slice(0, -2) + '…';
  c.fillText(t, x + w / 2, 65);
  if (FX.nf > 0.05) litRect(x, 13, w, 58);
}
function chalkboard(c, x, w, title, lines) {
  c.fillStyle = '#6b4a30'; c.fillRect(x - 4, 8, w + 8, 66);
  c.fillStyle = '#23302b'; c.fillRect(x, 12, w, 58);
  c.font = '700 8px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3e6a1'; c.fillText(title, x + w / 2, 21);
  c.font = '500 6.5px "DM Sans",sans-serif'; c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left';
  lines.forEach((l, i) => c.fillText(l, x + 6, 32 + i * 9));
}
function wallMirror(c, x, w) {
  c.fillStyle = '#d4a017'; rr(c, x - 4, 6, w + 8, 70, 18); c.fill();
  const g = c.createLinearGradient(x, 10, x + w, 72); g.addColorStop(0, '#e6f2f7'); g.addColorStop(1, '#a9c7d6');
  c.fillStyle = g; rr(c, x, 10, w, 62, 15); c.fill();
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(x + 8, 60); c.lineTo(x + w * 0.4, 14); c.lineTo(x + w * 0.55, 14); c.lineTo(x + 18, 66); c.closePath(); c.fill();
  if (FX.nf > 0.05) { for (let i = 0; i < 4; i++) { c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(x + 6 + i * (w - 12) / 3, 8, 2.4, 0, 7); c.fill(); } addEmit(x + w / 2, 10, w * 0.6, 0, 0.4); }
}
function vaultDoor(c, x) {
  c.fillStyle = '#6b6f76'; c.beginPath(); c.arc(x, 44, 38, 0, 7); c.fill();
  c.fillStyle = '#9aa1a9'; c.beginPath(); c.arc(x, 44, 31, 0, 7); c.fill();
  c.strokeStyle = '#6b6f76'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(x, 44); c.lineTo(x + Math.cos(a) * 18, 44 + Math.sin(a) * 18); c.stroke(); }
  c.fillStyle = '#c9cdd2'; c.beginPath(); c.arc(x, 44, 7, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x - 8, 34, 14, Math.PI, Math.PI * 1.6); c.lineTo(x - 8, 34); c.fill();
}
function wheelWall(c, x, w) {
  for (let i = 0; i * 34 + 17 < w; i++) {
    const cx = x + 17 + i * 34, cy = 30 + (i % 2) * 18;
    c.strokeStyle = '#2b2f36'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.stroke();
    c.strokeStyle = '#9aa7ad'; c.lineWidth = 0.8; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 6; c.beginPath(); c.moveTo(cx - Math.cos(a) * 13, cy - Math.sin(a) * 13); c.lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13); c.stroke(); }
  }
}
