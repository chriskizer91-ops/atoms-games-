/* ---------- animated scenes for longer activities ---------- */
const SC = { o: null, t: 0, ctx: null, w: 0, h: 0, line: -1 };
SC.open = function (k, o) {
  k.scene = o.scene; SC.o = o; SC.t = 0; SC.line = -1; SC.frac = 0;
  $('#sceneTitle').textContent = o.title || '';
  $('#sceneSub').textContent = o.sub || '';
  $('#sceneClock').textContent = clockStr(S.t);
  $('#sceneBar').style.width = '0%';
  $('#sceneLine').textContent = '';
  $('#scene').dataset.kind = o.scene;
  $('#scene').hidden = false;
  SC.size();
};
SC.size = function () {
  const cv = $('#sceneCv'), r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  SC.ctx = cv.getContext('2d'); SC.w = r.width; SC.h = r.height; SC.dpr = dpr;
};
SC.update = function (frac) {
  $('#sceneClock').textContent = clockStr(S.t);
  $('#sceneBar').style.width = (100 * frac) + '%';
  SC.frac = frac;
  const L = SC.o && SC.o.lines;
  if (L && L.length) {
    const i = Math.min(L.length - 1, Math.floor(frac * L.length));
    if (i !== SC.line) { SC.line = i; const e = $('#sceneLine'); e.textContent = L[i]; e.classList.remove('in'); void e.offsetWidth; e.classList.add('in'); }
  }
};
SC.close = function () { $('#scene').hidden = true; SC.o = null; };
SC.draw = function (dt) {
  if (!SC.o) return;
  SC.t += dt;
  SC.size();
  const c = SC.ctx;
  c.setTransform(SC.dpr, 0, 0, SC.dpr, 0, 0);
  try { (SCENES[SC.o.scene] || SCENES.read)(c, SC.w, SC.h, REDUCED ? 0.5 : SC.t, SC.frac || 0, SC.o); } catch (e) { console.error(e); }
};
const SCENES = {
  cinema(c, w, h, t, fr, o) {
    const pal = o.pal || ['#ff9f43', '#4cc9f0', '#c77dff'];
    c.fillStyle = '#07070d'; c.fillRect(0, 0, w, h);
    const sx = w * 0.12, sy = h * 0.08, sw = w * 0.76, sh = h * 0.5;
    const shot = Math.floor(t / 2.4), mix2 = (t % 2.4) / 2.4;
    const ca = pal[shot % pal.length], cb = pal[(shot + 1) % pal.length];
    const g = c.createLinearGradient(sx, sy, sx + sw, sy + sh); g.addColorStop(0, ca); g.addColorStop(1, mix(cb, '#000000', 0.3));
    // projector beam
    c.globalCompositeOperation = 'lighter';
    const bg = c.createLinearGradient(w / 2, h, w / 2, sy); bg.addColorStop(0, 'rgba(255,255,255,.0)'); bg.addColorStop(1, 'rgba(255,240,220,.08)');
    c.fillStyle = bg; c.beginPath(); c.moveTo(w / 2 - 6, h * 0.98); c.lineTo(sx, sy + sh); c.lineTo(sx + sw, sy + sh); c.closePath(); c.fill();
    c.globalCompositeOperation = 'source-over';
    // screen and what is on it
    c.fillStyle = '#1a1420'; c.fillRect(sx - 8, sy - 8, sw + 16, sh + 16);
    c.fillStyle = g; c.fillRect(sx, sy, sw, sh);
    c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
    if (fr < 0.07 || fr > 0.93) {
      c.fillStyle = '#000'; c.fillRect(sx, sy, sw, sh);
      c.fillStyle = '#f5e6c8'; c.font = '700 ' + Math.round(sh * 0.13) + 'px "Bricolage Grotesque",serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(fr < 0.07 ? (o.film || 'Feature') : 'THE END', sx + sw / 2, sy + sh / 2);
    } else {
      // hills, a horizon and a figure crossing the frame
      const ph = t * 0.4 + shot;
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(sx + sw * (0.2 + 0.6 * ((shot * 0.37) % 1)), sy + sh * 0.3, sh * 0.12, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.moveTo(sx, sy + sh);
      for (let i = 0; i <= 12; i++) c.lineTo(sx + sw * i / 12, sy + sh * (0.62 + 0.1 * Math.sin(i * 0.9 + ph)));
      c.lineTo(sx + sw, sy + sh); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.moveTo(sx, sy + sh);
      for (let i = 0; i <= 12; i++) c.lineTo(sx + sw * i / 12, sy + sh * (0.8 + 0.06 * Math.sin(i * 1.7 - ph * 1.3)));
      c.lineTo(sx + sw, sy + sh); c.closePath(); c.fill();
      const fx = sx + sw * (((t * 0.08 + shot * 0.3) % 1.2) - 0.1);
      c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.arc(fx, sy + sh * 0.6, sh * 0.04, 0, 7); c.fill(); c.fillRect(fx - sh * 0.03, sy + sh * 0.63, sh * 0.06, sh * 0.12);
    }
    c.restore();
    // the glow of the screen on the room
    const glow = c.createRadialGradient(w / 2, sy + sh, 10, w / 2, sy + sh, w * 0.7); glow.addColorStop(0, rgbaS(hexRgb(ca), 0.22)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    // seat backs and heads
    for (let row = 0; row < 3; row++) {
      const y = h * (0.7 + row * 0.12), n = 7 + row, rw = w / n;
      for (let i = 0; i < n; i++) {
        const x = rw * (i + 0.5) + (row % 2 ? rw * 0.25 : 0) - rw * 0.12;
        const filled = hash01(i, row, 7) > 0.35;
        if (filled) {
          c.fillStyle = '#0d0b12'; c.beginPath(); c.arc(x, y - rw * 0.2, rw * 0.17, 0, 7); c.fill();
          c.strokeStyle = rgbaS(hexRgb(ca), 0.35); c.lineWidth = 1.2; c.beginPath(); c.arc(x, y - rw * 0.2, rw * 0.17, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        }
        c.fillStyle = row === 2 ? '#3a0f1c' : '#2a0a14'; rr(c, x - rw * 0.36, y - rw * 0.06, rw * 0.72, rw * 0.5, rw * 0.1); c.fill();
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x - rw * 0.34, y - rw * 0.05, rw * 0.68, 2);
      }
    }
    if (o.popcorn) {
      const px = w * 0.86, py = h * 0.97;
      c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(px - 22, py - 46); c.lineTo(px + 22, py - 46); c.lineTo(px + 16, py); c.lineTo(px - 16, py); c.closePath(); c.fill();
      c.fillStyle = '#f6f1e7'; for (let i = 0; i < 3; i++) c.fillRect(px - 17 + i * 13, py - 46, 6, 46);
      c.fillStyle = '#ffe9a8'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(px - 18 + (i % 5) * 9, py - 50 - Math.floor(i / 5) * 7 - (i % 2) * 3, 6, 0, 7); c.fill(); }
    }
  },
  laundry(c, w, h, t) {
    c.fillStyle = '#d9e6ec'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c4d6df'; c.fillRect(0, h * 0.78, w, h * 0.22);
    c.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < w; x += 46) c.fillRect(x, h * 0.78, 2, h * 0.22);
    const n = 3, ww = Math.min(w / (n + 0.6), h * 0.62), gap = (w - ww * n) / (n + 1);
    for (let i = 0; i < n; i++) {
      const x = gap + i * (ww + gap), y = h * 0.78 - ww * 1.06;
      c.fillStyle = 'rgba(0,0,0,.12)'; rr(c, x + 4, y + 8, ww, ww * 1.06, 10); c.fill();
      c.fillStyle = '#f4f7f9'; rr(c, x, y, ww, ww * 1.06, 10); c.fill();
      c.fillStyle = '#e1e8ec'; c.fillRect(x, y, ww, ww * 0.16);
      c.fillStyle = '#2a9d8f'; c.beginPath(); c.arc(x + ww * 0.8, y + ww * 0.08, ww * 0.035, 0, 7); c.fill();
      c.fillStyle = '#9aa7ad'; for (let k = 0; k < 3; k++) c.fillRect(x + ww * (0.12 + k * 0.1), y + ww * 0.06, ww * 0.06, ww * 0.04);
      const cx = x + ww / 2, cy = y + ww * 0.6, r = ww * 0.34;
      c.fillStyle = '#b9c4ca'; c.beginPath(); c.arc(cx, cy, r + 8, 0, 7); c.fill();
      c.fillStyle = '#20313d'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.save(); c.beginPath(); c.arc(cx, cy, r - 2, 0, 7); c.clip();
      c.fillStyle = 'rgba(120,190,230,.5)'; c.fillRect(cx - r, cy + r * 0.1 + Math.sin(t * 3 + i) * r * 0.06, r * 2, r);
      const cols = ['#e76f51', '#e9c46a', '#8ecae6', '#ffffff', '#c77dff', '#2a9d8f'];
      for (let k = 0; k < 6; k++) {
        const a = t * (2.4 + i * 0.3) + k * 1.05, rr2 = r * (0.35 + 0.25 * (k % 2));
        c.fillStyle = cols[(k + i) % cols.length]; c.beginPath(); c.ellipse(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2, r * 0.26, r * 0.15, a, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.7)';
      for (let k = 0; k < 7; k++) { const by = cy + r - ((t * 40 + k * 23 + i * 11) % (r * 2)); c.beginPath(); c.arc(cx - r * 0.6 + hash01(k, i, 3) * r * 1.2, by, 2 + hash01(k, i, 4) * 3, 0, 7); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx - r * 0.3, cy - r * 0.3, r * 0.5, Math.PI * 1.05, Math.PI * 1.6); c.lineTo(cx - r * 0.3, cy - r * 0.3); c.fill();
    }
  },
  read(c, w, h, t, fr, o) {
    const bgc = { home: ['#3b2a22', '#5a3d2b'], chair: ['#3b2a22', '#6b4a30'], cafe: ['#2d3a3a', '#46605a'], books: ['#2c2433', '#4a3b55'], park: ['#2f6a44', '#7ab36f'] }[o.place] || ['#3b2a22', '#5a3d2b'];
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bgc[0]); g.addColorStop(1, bgc[1]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const lg = c.createRadialGradient(w * 0.75, h * 0.1, 10, w * 0.6, h * 0.4, w * 0.7); lg.addColorStop(0, 'rgba(255,220,150,.35)'); lg.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = lg; c.fillRect(0, 0, w, h);
    const bw = Math.min(w * 0.7, h * 1.3), bh = bw * 0.52, bx = (w - bw) / 2, by = h * 0.24;
    c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, bx + 6, by + 12, bw, bh, 8); c.fill();
    c.fillStyle = o.cover || '#7a2a2a'; rr(c, bx - 6, by - 4, bw + 12, bh + 12, 8); c.fill();
    c.fillStyle = '#fbf6ea'; c.fillRect(bx, by, bw / 2 - 2, bh); c.fillStyle = '#f6efe0'; c.fillRect(bx + bw / 2 + 2, by, bw / 2 - 2, bh);
    c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(bx + bw / 2 - 6, by, 12, bh);
    c.fillStyle = 'rgba(60,50,40,.55)';
    for (let side = 0; side < 2; side++) for (let i = 0; i < 9; i++) {
      const lw = (bw / 2 - 36) * (0.6 + 0.4 * hash01(i, side, Math.floor(t / 2.2)));
      c.fillRect(bx + 16 + side * (bw / 2 + 2), by + 18 + i * (bh - 36) / 9, lw, 3);
    }
    // a page turning
    const p = (t % 2.2) / 2.2;
    if (p < 0.35) {
      const k = p / 0.35, px = bx + bw / 2 + (bw / 2 - 2) * Math.cos(k * Math.PI);
      c.fillStyle = 'rgba(255,252,244,.96)'; c.beginPath(); c.moveTo(bx + bw / 2, by); c.quadraticCurveTo(px, by - 16 * Math.sin(k * Math.PI), px, by + 8); c.lineTo(px, by + bh - 8); c.quadraticCurveTo(px, by + bh, bx + bw / 2, by + bh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.12)'; c.stroke();
    }
    // a mug with steam
    const mx = bx + bw + 10 > w - 50 ? w - 60 : bx + bw + 20, my = by + bh + 10;
    c.fillStyle = '#e9e4d8'; rr(c, mx, my, 34, 34, 5); c.fill(); c.strokeStyle = '#e9e4d8'; c.lineWidth = 4; c.beginPath(); c.arc(mx + 36, my + 16, 8, -1.2, 1.2); c.stroke();
    c.fillStyle = '#6b4a30'; c.fillRect(mx + 4, my + 4, 26, 5);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const s = (t * 0.6 + i / 3) % 1; c.globalAlpha = 1 - s; c.beginPath(); c.moveTo(mx + 9 + i * 8, my - 4 - s * 30); c.quadraticCurveTo(mx + 3 + i * 8 + Math.sin(t * 2 + i) * 6, my - 14 - s * 30, mx + 9 + i * 8, my - 24 - s * 30); c.stroke(); }
    c.globalAlpha = 1;
  },
  salon(c, w, h, t, fr, o) {
    c.fillStyle = '#efe3ea'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(200,120,160,.12)'; for (let x = 0; x < w; x += 28) c.fillRect(x, 0, 14, h);
    const mw = Math.min(w * 0.5, h * 0.8), mh = mw * 1.05, mx = (w - mw) / 2, my = h * 0.06;
    c.fillStyle = '#d4a017'; rr(c, mx - 12, my - 12, mw + 24, mh + 24, mw * 0.5); c.fill();
    c.fillStyle = '#cfe3ee'; rr(c, mx, my, mw, mh, mw * 0.46); c.fill();
    c.save(); rr(c, mx, my, mw, mh, mw * 0.46); c.clip();
    c.fillStyle = '#b9d2e0'; c.fillRect(mx, my + mh * 0.75, mw, mh * 0.25);
    const look = fr > 0.55 ? o.after : o.before, s = mh / 44;
    drawPerson(c, w / 2, my + mh * 1.25, Object.assign({}, look, { s, face: 1, moving: false, me: false, skin: PLAYER_LOOK.skin }));
    // a cape
    c.fillStyle = '#3a3340'; c.beginPath(); c.moveTo(w / 2 - 9 * s, my + mh * 1.25 - 27 * s); c.lineTo(w / 2 + 9 * s, my + mh * 1.25 - 27 * s); c.lineTo(w / 2 + 16 * s, my + mh); c.lineTo(w / 2 - 16 * s, my + mh); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(mx + mw * 0.15, my + mh * 0.2); c.lineTo(mx + mw * 0.35, my); c.lineTo(mx + mw * 0.45, my); c.lineTo(mx + mw * 0.2, my + mh * 0.35); c.closePath(); c.fill();
    c.restore();
    if (fr < 0.55) {
      // scissors snipping and falling clippings
      const sxx = w / 2 + mw * 0.32 + Math.sin(t * 1.3) * 18, syy = my + mh * 0.25 + Math.cos(t * 0.9) * 14, o2 = Math.abs(Math.sin(t * 9)) * 0.5;
      c.strokeStyle = '#8f9aa1'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sxx, syy); c.lineTo(sxx - 30 * Math.cos(o2), syy - 30 * Math.sin(o2)); c.stroke();
      c.beginPath(); c.moveTo(sxx, syy); c.lineTo(sxx - 30 * Math.cos(-o2), syy - 30 * Math.sin(-o2)); c.stroke();
      c.lineCap = 'butt';
      c.strokeStyle = '#e76f9a'; c.lineWidth = 3; c.beginPath(); c.arc(sxx + 7, syy - 5, 6, 0, 7); c.stroke(); c.beginPath(); c.arc(sxx + 7, syy + 5, 6, 0, 7); c.stroke();
      c.fillStyle = o.before.hair;
      for (let i = 0; i < 14; i++) { const fy = (t * 60 + i * 37) % (h * 0.8); c.fillRect(w / 2 - mw * 0.3 + hash01(i, 2, 9) * mw * 0.6, my + mh * 0.3 + fy * 0.6, 4, 1.6); }
    } else {
      c.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 6; i++) { const a = t * 2 + i, r = 6 + 4 * Math.sin(t * 4 + i); const px = mx + mw * hash01(i, 1, 1), py = my + mh * 0.2 + mh * 0.5 * hash01(i, 2, 1); c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r * 0.3, py - r * 0.3); c.lineTo(px + r, py); c.lineTo(px + r * 0.3, py + r * 0.3); c.lineTo(px, py + r); c.lineTo(px - r * 0.3, py + r * 0.3); c.lineTo(px - r, py); c.lineTo(px - r * 0.3, py - r * 0.3); c.closePath(); c.fill(); void a; }
    }
  },
  dentist(c, w, h, t) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dff1f7'); g.addColorStop(1, '#b9dde8');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 6; i++) c.fillRect(0, i * h / 6, w, 1.5);
    // a ceiling poster of clouds to look at
    c.fillStyle = '#8ecae6'; rr(c, w * 0.08, h * 0.12, w * 0.3, h * 0.36, 8); c.fill();
    c.fillStyle = '#fff'; [[0.16, 0.26, 18], [0.24, 0.3, 24], [0.3, 0.24, 16]].forEach(p => { c.beginPath(); c.arc(w * p[0] + Math.sin(t * 0.5) * 6, h * p[1], p[2], 0, 7); c.fill(); });
    // the big lamp
    const lx = w * 0.62, ly = h * 0.32;
    c.strokeStyle = '#9aa7ad'; c.lineWidth = 6; c.beginPath(); c.moveTo(w, h * 0.05); c.lineTo(lx + 40, ly - 30); c.stroke();
    c.fillStyle = '#e8eef0'; c.beginPath(); c.ellipse(lx, ly, 70, 44, -0.2, 0, 7); c.fill();
    const lg = c.createRadialGradient(lx, ly, 4, lx, ly, 60); lg.addColorStop(0, '#fffbe6'); lg.addColorStop(1, '#ffe9a8');
    c.fillStyle = lg; c.beginPath(); c.ellipse(lx, ly, 54, 32, -0.2, 0, 7); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.05 * Math.sin(t * 3); c.drawImage(GLOW[0], lx - 160, ly - 160, 320, 320); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the dentist leaning in, mask and all
    const dx = w * 0.3 + Math.sin(t * 0.8) * 10, dy = h * 0.95;
    c.fillStyle = '#e8f4f8'; rr(c, dx - 80, dy - 90, 160, 120, 40); c.fill();
    c.fillStyle = '#c68a62'; c.beginPath(); c.arc(dx, dy - 130, 52, 0, 7); c.fill();
    c.fillStyle = '#2b2118'; c.beginPath(); c.arc(dx, dy - 145, 54, Math.PI, 0); c.fill();
    c.fillStyle = '#8ecae6'; rr(c, dx - 40, dy - 128, 80, 46, 14); c.fill();
    c.fillStyle = '#1a1c22'; c.beginPath(); c.arc(dx - 18, dy - 140, 4, 0, 7); c.arc(dx + 18, dy - 140, 4, 0, 7); c.fill();
    c.strokeStyle = '#9aa7ad'; c.lineWidth = 3; c.beginPath(); c.moveTo(dx + 70, dy - 60); c.lineTo(dx + 110 + Math.sin(t * 6) * 4, dy - 120); c.stroke();
  },
  music(c, w, h, t, fr, o) {
    c.fillStyle = '#120d1a'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, h * 0.7, 0, h); g.addColorStop(0, '#5a3b2a'); g.addColorStop(1, '#2b1c12'); c.fillStyle = g; c.fillRect(0, h * 0.72, w, h * 0.28);
    c.globalCompositeOperation = 'lighter';
    const sp = c.createLinearGradient(w / 2, 0, w / 2, h * 0.75); sp.addColorStop(0, 'rgba(255,230,170,.0)'); sp.addColorStop(1, 'rgba(255,230,170,.22)');
    c.fillStyle = sp; c.beginPath(); c.moveTo(w / 2 - 20, 0); c.lineTo(w / 2 + 20, 0); c.lineTo(w / 2 + 120, h * 0.78); c.lineTo(w / 2 - 120, h * 0.78); c.closePath(); c.fill();
    c.globalAlpha = 0.5; c.drawImage(GLOW[5], w / 2 - 140, h * 0.62, 280, 120); c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    if (o.records) {
      // a turntable
      const cx = w / 2, cy = h * 0.5, r = Math.min(w, h) * 0.26;
      c.fillStyle = '#6b4a30'; rr(c, cx - r * 1.5, cy - r * 1.15, r * 3, r * 2.3, 12); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 1; i < 6; i++) { c.beginPath(); c.arc(cx, cy, r * i / 6, 0, 7); c.stroke(); }
      c.fillStyle = o.label || '#e76f51'; c.beginPath(); c.arc(cx, cy, r * 0.3, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(t * 3.5) * r * 0.18, cy + Math.sin(t * 3.5) * r * 0.18, 3, 0, 7); c.fill();
      c.strokeStyle = '#c9cdd2'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + r * 1.3, cy - r * 0.9); c.lineTo(cx + r * 1.2, cy + r * 0.2); c.lineTo(cx + r * 0.6, cy + r * 0.5); c.stroke();
    } else {
      const s = h / 120;
      drawPerson(c, w / 2, h * 0.8, Object.assign({}, o.singer || NPC_LOOK[3], { s, face: 1, moving: false, me: false }));
      c.strokeStyle = '#2b2f36'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2 + 16 * s, h * 0.8); c.lineTo(w / 2 + 14 * s, h * 0.8 - 30 * s); c.stroke();
      c.fillStyle = '#2b2f36'; c.beginPath(); c.arc(w / 2 + 12 * s, h * 0.8 - 31 * s, 3 * s, 0, 7); c.fill();
      // guitar
      c.fillStyle = '#c47a3a'; c.beginPath(); c.ellipse(w / 2 - 2 * s, h * 0.8 - 14 * s, 7 * s, 5 * s, 0.3, 0, 7); c.fill();
      c.strokeStyle = '#5a3b2a'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(w / 2 + 3 * s, h * 0.8 - 16 * s); c.lineTo(w / 2 + 16 * s, h * 0.8 - 24 * s); c.stroke();
      // a few heads in the crowd
      c.fillStyle = '#05030a'; for (let i = 0; i < 9; i++) { const x = (i + 0.5) * w / 9; c.beginPath(); c.arc(x, h - 8 + Math.sin(t * 2 + i) * 2, w / 26, 0, 7); c.fill(); c.fillRect(x - w / 20, h - 4, w / 10, 10); }
    }
    c.fillStyle = 'rgba(255,233,168,.85)'; c.font = '700 ' + Math.round(h * 0.07) + 'px serif'; c.textAlign = 'center';
    for (let i = 0; i < 5; i++) { const k = (t * 0.25 + i / 5) % 1; c.globalAlpha = Math.sin(k * Math.PI); c.fillText(i % 2 ? '♪' : '♫', w * (0.25 + 0.5 * hash01(i, 3, Math.floor(t * 0.25 + i / 5))), h * (0.65 - k * 0.55)); }
    c.globalAlpha = 1;
  }
};

