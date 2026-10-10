/* ============================ furniture drawing ============================ */
const FURN_FLAT = { rug: 1, mat: 1, notice: 1 };
function box(c, x, y, w, h, col, top) {
  // soft contact shadow, then a top surface with a darker front edge
  c.fillStyle = 'rgba(10,12,26,.13)'; rr(c, x - 1, y + h - 5, w + 5, 11, 5); c.fill();
  c.fillStyle = 'rgba(10,12,26,.16)'; rr(c, x + 1, y + h - 3, w + 1, 7, 3); c.fill();
  c.fillStyle = col; rr(c, x, y, w, h, 2.5); c.fill();
  const fh = Math.min(7, h * 0.22);
  c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, x, y + h - fh, w, fh, 2.5); c.fill();
  c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(x + w - 3, y + 2, 3, h - 4);
  c.fillStyle = top || 'rgba(255,255,255,.22)'; rr(c, x, y, w, Math.min(4, h), 2); c.fill();
}
function lbl(c, f, col) {
  if (!f.label) return;
  // dark lettering on pale furniture, white on everything else
  if (!col && f.c) { const q = hexRgb(f.c); if (q[0] * 0.3 + q[1] * 0.6 + q[2] * 0.1 > 165) col = '#39424d'; }
  signText(c, f.label, f.x + f.w / 2, f.y + f.h / 2 + 1, f.fs || 10, col || '#fff');
}
const FURN = {
  rug(c, f) { c.fillStyle = f.c || '#a64b4b'; rr(c, f.x, f.y, f.w, f.h, 10); c.fill(); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 3; rr(c, f.x + 8, f.y + 8, f.w - 16, f.h - 16, 6); c.stroke(); },
  mat(c, f) { c.fillStyle = f.c || '#5a4a3a'; rr(c, f.x, f.y, f.w, f.h, 4); c.fill(); },
  notice(c, f) { c.fillStyle = f.c || '#c9a06a'; c.fillRect(f.x, f.y, f.w, f.h); c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(f.x + 5 + i * (f.w / 4), f.y + 5, f.w / 4 - 8, f.h - 10); },
  bed(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#6b4a30');
    c.fillStyle = '#eef0f6'; c.fillRect(f.x + 4, f.y + 6, f.w - 8, f.h - 10);
    c.fillStyle = f.c || '#4a78b5'; c.fillRect(f.x + 4, f.y + f.h * 0.36, f.w - 8, f.h * 0.64 - 4);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(f.x + 4, f.y + f.h * 0.36, f.w - 8, 4);
    c.fillStyle = '#fff'; rr(c, f.x + 8, f.y + 10, f.w / 2 - 12, 22, 6); c.fill(); rr(c, f.x + f.w / 2 + 4, f.y + 10, f.w / 2 - 12, 22, 6); c.fill();
  },
  hbed(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#9fb0b8');
    c.fillStyle = '#f4f7f9'; c.fillRect(f.x + 4, f.y + 6, f.w - 8, f.h - 12);
    c.fillStyle = f.c || '#6fb7c9'; c.fillRect(f.x + 4, f.y + f.h * 0.42, f.w - 8, f.h * 0.58 - 6);
    c.fillStyle = '#fff'; rr(c, f.x + 10, f.y + 10, f.w - 20, 18, 6); c.fill();
    c.fillStyle = '#5a6672'; c.fillRect(f.x - 3, f.y, 3, f.h); c.fillRect(f.x + f.w, f.y, 3, f.h);
  },
  sofa(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#b6554e', 'rgba(255,255,255,.15)');
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(f.x, f.y, f.w, Math.max(12, f.h * 0.3));
    c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(f.x, f.y, 10, f.h); c.fillRect(f.x + f.w - 10, f.y, 10, f.h);
    c.fillStyle = 'rgba(0,0,0,.12)'; const n = Math.max(2, Math.round(f.w / 56)); for (let i = 1; i < n; i++) c.fillRect(f.x + i * f.w / n - 1, f.y + f.h * 0.34, 2, f.h * 0.66);
  },
  table(c, f) { box(c, f.x, f.y, f.w, f.h, f.c || '#9c7a4f'); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(f.x, f.y + f.h - 5, f.w, 5); lbl(c, f); },
  round(c, f) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h / 2 + 4, f.w / 2, f.h / 2, 0, 0, 7); c.fill();
    c.fillStyle = f.c || '#9c7a4f'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h / 2 - 2, f.w / 2 - 6, f.h / 2 - 7, 0, 0, 7); c.fill();
  },
  desk(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#b98a55');
    if (f.pc !== false) {
      const mx = f.x + f.w / 2 - 14;
      c.fillStyle = '#20262d'; c.fillRect(mx, f.y + 5, 28, 17); c.fillStyle = f.screen || '#6fd1ff'; c.fillRect(mx + 2, f.y + 7, 24, 12);
      c.fillStyle = '#c9cdd2'; c.fillRect(mx + 6, f.y + 26, 16, 4);
    }
    lbl(c, f);
  },
  chair(c, f) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(f.x + 1, f.y + f.h - 2, f.w, 4); c.fillStyle = f.c || '#4a5568'; rr(c, f.x, f.y, f.w, f.h, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(f.x + 2, f.y + 2, f.w - 4, 4); },
  stool(c, f) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h - 2, f.w / 2, 4, 0, 0, 7); c.fill(); c.fillStyle = f.c || '#c0392b'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(f.x + f.w / 2 - 2, f.y + f.h / 2 - 2, f.w / 4, f.h / 4, 0, 0, 7); c.fill(); },
  counter(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#8b6240');
    c.fillStyle = f.top || '#d9d3c6'; c.fillRect(f.x, f.y, f.w, Math.min(f.h * 0.55, 26));
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(f.x, f.y, f.w, 3); lbl(c, f, '#fff');
  },
  register(c, f) {
    FURN.counter(c, Object.assign({}, f, { label: null }));
    c.fillStyle = '#2a2f36'; c.fillRect(f.x + f.w / 2 - 14, f.y + 4, 28, 16); c.fillStyle = '#9be7a8'; c.fillRect(f.x + f.w / 2 - 11, f.y + 6, 22, 7);
    c.fillStyle = '#3a414a'; c.fillRect(f.x + f.w / 2 - 12, f.y + 20, 24, 5);
  },
  shelf(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#7d8a94', 'rgba(255,255,255,.25)');
    const rows = f.h > 52 ? 3 : 2, cols = ['#e63946', '#f4a261', '#8ac926', '#ffca3a', '#4cc9f0', '#c77dff', '#f1faee'];
    for (let r = 0; r < rows; r++) {
      const ry = f.y + 6 + r * ((f.h - 10) / rows);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(f.x + 3, ry + (f.h - 10) / rows - 4, f.w - 6, 2);
      for (let x = f.x + 6, i = 0; x < f.x + f.w - 10; x += 12, i++) { c.fillStyle = (f.cols || cols)[(i + r * 2 + (f.s || 0)) % (f.cols || cols).length]; c.fillRect(x, ry, 9, (f.h - 10) / rows - 6); }
    }
    if (f.label) { c.fillStyle = '#f6f1e7'; c.fillRect(f.x + 4, f.y + f.h - 12, f.w - 8, 10); signText(c, f.label, f.x + f.w / 2, f.y + f.h - 6.5, 8, '#33261a'); }
  },
  bookshelf(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#6b4a30');
    const rows = Math.max(2, Math.floor(f.h / 22)), cols = ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1'];
    for (let r = 0; r < rows; r++) { const ry = f.y + 5 + r * ((f.h - 8) / rows); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(f.x + 3, ry + (f.h - 8) / rows - 3, f.w - 6, 3); for (let x = f.x + 5, i = 0; x < f.x + f.w - 8; x += 7, i++) { c.fillStyle = cols[(i * 3 + r) % cols.length]; c.fillRect(x, ry + 2 + (i % 3), 5, (f.h - 8) / rows - 7 - (i % 3)); } }
  },
  fridge(c, f) { box(c, f.x, f.y, f.w, f.h, '#e6ecef', 'rgba(255,255,255,.4)'); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(f.x, f.y + f.h * 0.4, f.w, 2); c.fillStyle = '#9aa7ad'; c.fillRect(f.x + f.w - 8, f.y + 8, 3, 14); c.fillRect(f.x + f.w - 8, f.y + f.h * 0.4 + 6, 3, 14); },
  stove(c, f) { box(c, f.x, f.y, f.w, f.h, '#4a5058', 'rgba(255,255,255,.18)'); c.fillStyle = '#1c2026'; [[0.28, 0.4], [0.72, 0.4], [0.28, 0.72], [0.72, 0.72]].forEach(p => { c.beginPath(); c.arc(f.x + f.w * p[0], f.y + f.h * p[1] + 2, Math.min(f.w, f.h) * 0.16, 0, 7); c.fill(); }); lbl(c, f); },
  sink(c, f) { box(c, f.x, f.y, f.w, f.h, f.c || '#b9b2a2', 'rgba(255,255,255,.35)'); c.fillStyle = '#8fb6c9'; rr(c, f.x + f.w / 2 - 15, f.y + 8, 30, f.h - 16, 4); c.fill(); c.fillStyle = '#9aa7ad'; c.fillRect(f.x + f.w / 2 - 2, f.y + 3, 4, 8); },
  tv(c, f) { box(c, f.x, f.y, f.w, f.h, '#20262d', 'rgba(255,255,255,.1)'); c.fillStyle = '#3d6ea3'; c.fillRect(f.x + 4, f.y + 3, f.w - 8, f.h - 8); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(f.x + 4, f.y + 3, (f.w - 8) * 0.4, f.h - 8); },
  plant(c, f) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h - 1, f.w / 2, 4, 0, 0, 7); c.fill(); c.fillStyle = '#9a5b3a'; c.fillRect(f.x + f.w / 2 - 8, f.y + f.h - 12, 16, 12); c.fillStyle = '#3f9a62'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h - 20, f.w / 2 - 1, 0, 7); c.fill(); c.fillStyle = '#5db77a'; c.beginPath(); c.arc(f.x + f.w / 2 - 4, f.y + f.h - 24, f.w / 3, 0, 7); c.fill(); },
  cooler(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#cfe3ee', 'rgba(255,255,255,.4)');
    const cols = ['#4cc9f0', '#f4a261', '#8ac926', '#e63946', '#ffca3a'];
    for (let x = f.x + 5, i = 0; x < f.x + f.w - 9; x += 12, i++) for (let r = 0; r < 2; r++) { c.fillStyle = cols[(i + r) % cols.length]; c.fillRect(x, f.y + 8 + r * 20, 8, 15); }
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(f.x + 2, f.y + 6, f.w * 0.3, f.h - 12);
  },
  bench(c, f) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(f.x + 2, f.y + f.h - 2, f.w, 5); c.fillStyle = '#5a3d2b'; c.fillRect(f.x + 6, f.y + f.h - 8, 5, 8); c.fillRect(f.x + f.w - 11, f.y + f.h - 8, 5, 8); c.fillStyle = f.c || '#9a6b45'; c.fillRect(f.x, f.y + 4, f.w, f.h - 10); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(f.x, f.y + 4, f.w, 3); },
  machine(c, f) { box(c, f.x, f.y, f.w, f.h, f.c || '#4a4f55', 'rgba(255,255,255,.22)'); c.fillStyle = f.screen || '#6fd1ff'; c.fillRect(f.x + 5, f.y + 8, f.w - 10, Math.min(18, f.h * 0.3)); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(f.x + 5, f.y + f.h - 14, f.w - 10, 8); lbl(c, f); },
  cabinet(c, f) { box(c, f.x, f.y, f.w, f.h, f.c || '#8b6240'); c.fillStyle = 'rgba(0,0,0,.22)'; const n = Math.max(2, Math.round(f.w / 36)); for (let i = 1; i < n; i++) c.fillRect(f.x + i * f.w / n - 1, f.y + 6, 2, f.h - 8); c.fillStyle = '#e9c46a'; for (let i = 0; i < n; i++) c.fillRect(f.x + (i + 0.5) * f.w / n - 1, f.y + f.h * 0.5, 3, 6); lbl(c, f); },
  booth(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#a83a3a');
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(f.x, f.y, f.w, 12); c.fillRect(f.x, f.y + f.h - 14, f.w, 14);
    c.fillStyle = '#d9d3c6'; c.fillRect(f.x + 12, f.y + 22, f.w - 24, f.h - 44); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(f.x + 12, f.y + 22, f.w - 24, 3);
    c.fillStyle = '#c0392b'; c.fillRect(f.x + f.w / 2 - 4, f.y + f.h / 2 - 3, 4, 6); c.fillStyle = '#f1c40f'; c.fillRect(f.x + f.w / 2 + 2, f.y + f.h / 2 - 3, 4, 6);
  },
  jukebox(c, f) { box(c, f.x, f.y, f.w, f.h, '#a83a3a', 'rgba(255,255,255,.25)'); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h * 0.38, f.w * 0.32, Math.PI, 0); c.fill(); c.fillRect(f.x + f.w * 0.18, f.y + f.h * 0.38, f.w * 0.64, f.h * 0.3); c.fillStyle = '#20262d'; c.fillRect(f.x + f.w * 0.25, f.y + f.h * 0.44, f.w * 0.5, f.h * 0.14); },
  mailbox(c, f) { box(c, f.x, f.y, f.w, f.h, '#8a95a0'); for (let x = f.x + 4; x < f.x + f.w - 18; x += 22) { c.fillStyle = '#5f6b76'; c.fillRect(x, f.y + 6, 18, f.h - 10); c.fillStyle = '#e9c46a'; c.fillRect(x + 6, f.y + 10, 6, 3); } },
  server(c, f) { box(c, f.x, f.y, f.w, f.h, '#2a2f36', 'rgba(255,255,255,.12)'); for (let y = f.y + 8; y < f.y + f.h - 8; y += 10) { c.fillStyle = '#394049'; c.fillRect(f.x + 4, y, f.w - 8, 7); c.fillStyle = (y / 10 | 0) % 2 ? '#3bff6a' : '#ffd23b'; c.fillRect(f.x + f.w - 12, y + 2, 3, 3); } },
  bean(c, f) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h - 2, f.w / 2, 5, 0, 0, 7); c.fill(); c.fillStyle = f.c || '#e76f51'; c.beginPath(); c.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(f.x + f.w / 2 - 4, f.y + f.h / 2 - 5, f.w / 4, f.h / 5, 0, 0, 7); c.fill(); },
  board(c, f) { c.fillStyle = '#7a7a7a'; c.fillRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6); c.fillStyle = f.c || '#fbfbf7'; c.fillRect(f.x, f.y, f.w, f.h); c.strokeStyle = '#5a7bd8'; c.lineWidth = 2; c.beginPath(); c.moveTo(f.x + 10, f.y + 12); c.lineTo(f.x + f.w * 0.55, f.y + 12); c.moveTo(f.x + 10, f.y + 24); c.lineTo(f.x + f.w * 0.8, f.y + 24); c.stroke(); lbl(c, f, '#33415c'); }
};
function drawFurn(c, f) { (FURN[f.t] || FURN.table)(c, f); }

/* richer versions of the furniture people look at most */
Object.assign(FURN, {
  rug(c, f) {
    const col = f.c || '#a64b4b';
    c.fillStyle = 'rgba(10,12,26,.12)'; rr(c, f.x + 2, f.y + 3, f.w, f.h, 10); c.fill();
    c.fillStyle = col; rr(c, f.x, f.y, f.w, f.h, 9); c.fill();
    c.fillStyle = PAT.fleck; rr(c, f.x, f.y, f.w, f.h, 9); c.fill();
    c.strokeStyle = shade(col, 0.42); c.lineWidth = 2.5; rr(c, f.x + 7, f.y + 7, f.w - 14, f.h - 14, 5); c.stroke();
    c.strokeStyle = shade(col, -0.25); c.lineWidth = 1.5; rr(c, f.x + 13, f.y + 13, f.w - 26, f.h - 26, 3); c.stroke();
    c.fillStyle = shade(col, 0.3);
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2, d = Math.min(f.w, f.h) * 0.2;
    c.beginPath(); c.moveTo(cx, cy - d); c.lineTo(cx + d * 1.6, cy); c.lineTo(cx, cy + d); c.lineTo(cx - d * 1.6, cy); c.closePath(); c.fill();
  },
  bed(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#6b4a30');
    c.fillStyle = '#8a6240'; rr(c, f.x - 2, f.y - 4, f.w + 4, 12, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(f.x, f.y - 3, f.w, 2);
    c.fillStyle = '#eef0f6'; rr(c, f.x + 4, f.y + 8, f.w - 8, f.h - 13, 4); c.fill();
    const col = f.c || '#4a78b5', dy = f.y + f.h * 0.38;
    c.fillStyle = col; rr(c, f.x + 3, dy, f.w - 6, f.h * 0.62 - 5, 5); c.fill();
    c.fillStyle = shade(col, 0.25); rr(c, f.x + 3, dy, f.w - 6, 9, 4); c.fill();
    c.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 1; i < 4; i++) c.fillRect(f.x + 3 + i * (f.w - 6) / 4, dy + 10, 1.5, f.h * 0.62 - 17);
    [f.x + 8, f.x + f.w / 2 + 4].forEach(px => {
      c.fillStyle = 'rgba(0,0,0,.12)'; rr(c, px + 1, f.y + 13, f.w / 2 - 12, 22, 7); c.fill();
      c.fillStyle = '#ffffff'; rr(c, px, f.y + 11, f.w / 2 - 12, 22, 7); c.fill();
    });
  },
  sofa(c, f) {
    const col = f.c || '#b6554e';
    box(c, f.x, f.y, f.w, f.h, shade(col, -0.18), 'rgba(255,255,255,.12)');
    c.fillStyle = shade(col, -0.05); rr(c, f.x, f.y, f.w, Math.max(13, f.h * 0.34), 5); c.fill();
    const n = Math.max(2, Math.round(f.w / 56)), cw = (f.w - 20) / n, sy = f.y + f.h * 0.34;
    for (let i = 0; i < n; i++) {
      c.fillStyle = col; rr(c, f.x + 10 + i * cw + 1, sy, cw - 2, f.h * 0.66 - 6, 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, f.x + 10 + i * cw + 4, sy + 3, cw - 8, 5, 2.5); c.fill();
    }
    c.fillStyle = shade(col, -0.12); rr(c, f.x, f.y + 6, 11, f.h - 8, 5); c.fill(); rr(c, f.x + f.w - 11, f.y + 6, 11, f.h - 8, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; rr(c, f.x + 2, f.y + 8, 7, 5, 2.5); c.fill(); rr(c, f.x + f.w - 9, f.y + 8, 7, 5, 2.5); c.fill();
  },
  plant(c, f) {
    const cx = f.x + f.w / 2, by = f.y + f.h, sw = REDUCED ? 0 : Math.sin(FX.time * 1.1 + f.x) * 0.8;
    c.fillStyle = 'rgba(10,12,26,.2)'; c.beginPath(); c.ellipse(cx, by - 1, f.w / 2, 4, 0, 0, 7); c.fill();
    c.fillStyle = '#a4623f'; c.beginPath(); c.moveTo(cx - 9, by - 13); c.lineTo(cx + 9, by - 13); c.lineTo(cx + 7, by); c.lineTo(cx - 7, by); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(cx - 9, by - 13, 18, 2);
    c.fillStyle = '#2c7a4c';
    for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.42; c.save(); c.translate(cx, by - 13); c.rotate(a + Math.PI / 2 + sw * 0.03); c.beginPath(); c.ellipse(0, -11, 4.2, 12, 0, 0, 7); c.fill(); c.restore(); }
    c.fillStyle = '#4fae6a';
    for (let i = 0; i < 4; i++) { const a = -2.3 + i * 0.5; c.save(); c.translate(cx, by - 14); c.rotate(a + Math.PI / 2 - sw * 0.03); c.beginPath(); c.ellipse(0, -8, 3, 9, 0, 0, 7); c.fill(); c.restore(); }
  },
  tv(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#1b2027', 'rgba(255,255,255,.1)');
    const t = REDUCED ? 0 : FX.time, on = FX.nf > 0.25;
    const g = c.createLinearGradient(f.x, 0, f.x + f.w, 0);
    g.addColorStop(0, on ? mix('#3d6ea3', '#7a5ac8', 0.5 + 0.5 * Math.sin(t * 1.3)) : '#27384a'); g.addColorStop(1, on ? mix('#5ab0c9', '#e07a5f', 0.5 + 0.5 * Math.sin(t * 0.9 + 1)) : '#1f2c3a');
    c.fillStyle = g; c.fillRect(f.x + 4, f.y + 3, f.w - 8, f.h - 8);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(f.x + 6, f.y + f.h - 5); c.lineTo(f.x + f.w * 0.3, f.y + 3); c.lineTo(f.x + f.w * 0.44, f.y + 3); c.lineTo(f.x + f.w * 0.2, f.y + f.h - 5); c.closePath(); c.fill();
    if (on) { litRect(f.x + 4, f.y + 3, f.w - 8, f.h - 8); addLight(f.x + f.w / 2, f.y + f.h + 60, 130, 90, 1, 0.4 + 0.1 * Math.sin(t * 5)); }
  },
  table(c, f) {
    const col = f.c || '#9c7a4f';
    box(c, f.x, f.y, f.w, f.h, col);
    c.fillStyle = 'rgba(60,30,10,.1)'; for (let yy = f.y + 6; yy < f.y + f.h - 7; yy += 6) c.fillRect(f.x + 3, yy, f.w - 6, 1);
    c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, f.x + 4, f.y + 4, f.w * 0.4, Math.max(2, f.h * 0.3), 2); c.fill();
    lbl(c, f);
  },
  round(c, f) {
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2, col = f.c || '#9c7a4f';
    c.fillStyle = 'rgba(10,12,26,.2)'; c.beginPath(); c.ellipse(cx + 1, cy + 6, f.w / 2, f.h / 2, 0, 0, 7); c.fill();
    c.fillStyle = shade(col, -0.3); c.beginPath(); c.ellipse(cx, cy + 3, f.w / 2, f.h / 2, 0, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, f.w / 2, f.h / 2, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(60,30,10,.14)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, f.w / 3.2, f.h / 3.2, 0, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(cx - f.w * 0.12, cy - f.h * 0.14, f.w / 4, f.h / 6, -0.3, 0, 7); c.fill();
  },
  desk(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#b98a55');
    if (f.pc !== false) {
      const mx = f.x + f.w / 2 - 15, scr = f.screen || '#6fd1ff';
      c.fillStyle = '#14181d'; rr(c, mx, f.y + 4, 30, 19, 2.5); c.fill();
      c.fillStyle = scr; c.fillRect(mx + 2, f.y + 6, 26, 14);
      c.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < 3; i++) c.fillRect(mx + 5, f.y + 9 + i * 3.5, 9 + ((i * 7) % 10), 1.4);
      c.fillStyle = '#14181d'; c.fillRect(mx + 12, f.y + 23, 6, 3);
      c.fillStyle = '#dfe3e7'; rr(c, mx + 4, f.y + 27, 20, 5, 1.5); c.fill();
      if (f.w > 70 && f.h > 30) { c.fillStyle = '#f4f1ea'; c.beginPath(); c.arc(mx + 38, f.y + 14, 4, 0, 7); c.fill(); c.fillStyle = '#5a3b2a'; c.beginPath(); c.arc(mx + 38, f.y + 14, 2.6, 0, 7); c.fill(); }
      if (FX.nf > 0.25) { litRect(mx + 2, f.y + 6, 26, 14); addEmit(mx + 15, f.y + 13, 22, 1, 0.25); }
    }
    lbl(c, f);
  },
  chair(c, f) {
    const col = f.c || '#4a5568';
    c.fillStyle = 'rgba(10,12,26,.18)'; rr(c, f.x + 1, f.y + f.h - 3, f.w, 6, 3); c.fill();
    c.fillStyle = shade(col, -0.2); rr(c, f.x, f.y, f.w, f.h, 5); c.fill();
    c.fillStyle = col; rr(c, f.x + 2, f.y + f.h * 0.32, f.w - 4, f.h * 0.6, 4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; rr(c, f.x + 2, f.y + 1.5, f.w - 4, 3.5, 2); c.fill();
  },
  fridge(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#e8edf0', 'rgba(255,255,255,.5)');
    const g = c.createLinearGradient(f.x, 0, f.x + f.w, 0); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
    c.fillStyle = g; c.fillRect(f.x, f.y + 3, f.w, f.h - 8);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(f.x, f.y + f.h * 0.4, f.w, 2);
    c.fillStyle = '#8f9ba2'; rr(c, f.x + f.w - 9, f.y + 8, 3.5, 15, 1.5); c.fill(); rr(c, f.x + f.w - 9, f.y + f.h * 0.4 + 6, 3.5, 15, 1.5); c.fill();
    c.fillStyle = '#ffd166'; c.fillRect(f.x + 7, f.y + 10, 8, 9); c.fillStyle = '#ef476f'; c.fillRect(f.x + 18, f.y + 13, 6, 6);
  },
  stove(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#4a5058', 'rgba(255,255,255,.2)');
    const r = Math.min(f.w, f.h) * 0.16;
    [[0.28, 0.38], [0.72, 0.38], [0.28, 0.7], [0.72, 0.7]].forEach((p, i) => {
      const bx = f.x + f.w * p[0], by = f.y + f.h * p[1] + 1;
      c.fillStyle = '#15181d'; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
      c.strokeStyle = i === 1 ? '#ff7a45' : '#5d666d'; c.lineWidth = 1.4; c.beginPath(); c.arc(bx, by, r * 0.6, 0, 7); c.stroke();
    });
    c.fillStyle = '#d9dde0'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(f.x + f.w * (0.2 + i * 0.2), f.y + f.h - 3.5, 1.6, 0, 7); c.fill(); }
    lbl(c, f);
  },
  cooler(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#cfe3ee', 'rgba(255,255,255,.5)');
    c.fillStyle = '#eaf6fb'; c.fillRect(f.x + 3, f.y + 5, f.w - 6, f.h - 12);
    const cols = ['#4cc9f0', '#f4a261', '#8ac926', '#e63946', '#ffca3a'];
    for (let x = f.x + 6, i = 0; x < f.x + f.w - 10; x += 12, i++) for (let r = 0; r < 2; r++) { c.fillStyle = cols[(i + r) % cols.length]; rr(c, x, f.y + 8 + r * 20, 8, 15, 2.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 1.5, f.y + 10 + r * 20, 1.5, 9); }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(f.x + 3, f.y + 25, f.w - 6, 2);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(f.x + 5, f.y + f.h - 8); c.lineTo(f.x + f.w * 0.28, f.y + 6); c.lineTo(f.x + f.w * 0.4, f.y + 6); c.lineTo(f.x + f.w * 0.17, f.y + f.h - 8); c.closePath(); c.fill();
    if (FX.nf > 0.25) { litRect(f.x + 3, f.y + 5, f.w - 6, f.h - 12); addEmit(f.x + f.w / 2, f.y + f.h / 2, f.w * 0.6, 1, 0.22); }
  },
  counter(c, f) {
    box(c, f.x, f.y, f.w, f.h, f.c || '#8b6240');
    const top = f.top || '#d9d3c6', th = Math.min(f.h * 0.55, 26), rgb = hexRgb(top);
    c.fillStyle = top; rr(c, f.x, f.y, f.w, th, 2.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(f.x + 2, f.y, f.w - 4, 2.5);
    c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(f.x, f.y + th, f.w, 2);
    if (f.label) signText(c, f.label, f.x + f.w / 2, f.y + th / 2 + 1, f.fs || 10, rgb[0] * 0.3 + rgb[1] * 0.6 + rgb[2] * 0.1 > 150 ? '#3a3226' : '#ffffff');
  },
  jukebox(c, f) {
    box(c, f.x, f.y, f.w, f.h, '#a83a3a', 'rgba(255,255,255,.25)');
    const t = REDUCED ? 0 : FX.time, cols = ['#ffd166', '#ff7a95', '#7ae0ff', '#9bff8a'];
    c.fillStyle = cols[Math.floor(t * 1.5) % 4]; c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h * 0.38, f.w * 0.34, Math.PI, 0); c.fill(); c.fillRect(f.x + f.w * 0.16, f.y + f.h * 0.38, f.w * 0.68, f.h * 0.3);
    c.fillStyle = '#1b2027'; c.fillRect(f.x + f.w * 0.25, f.y + f.h * 0.44, f.w * 0.5, f.h * 0.14);
    c.fillStyle = '#e4e8ea'; c.fillRect(f.x + f.w * 0.2, f.y + f.h * 0.74, f.w * 0.6, 3);
    addEmit(f.x + f.w / 2, f.y + f.h * 0.4, f.w, 4, 0.3);
  }
});

