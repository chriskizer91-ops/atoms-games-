/* ============================ activity kit: shared helpers for the full-screen moments ============================
   Used by the shift games, the scenes, the dreams and the fishing view. Nothing in here touches game state.
   AK  : small canvas helpers (glow sprites, grain, offscreen caches, colour maths)
   JFX : a tiny particle layer that floats above the shift-game card (bursts, confetti, smoke, rings) */
const AK = {
  _glow: new Map(), _cache: new Map(), _grain: null,
  /* parse '#rgb', '#rrggbb', 'rgb(...)' or [r,g,b] into [r,g,b] */
  rgb(c) { return Array.isArray(c) ? c : hexRgb(c); },
  rgba(c, a) { const v = AK.rgb(c); return 'rgba(' + Math.round(v[0]) + ',' + Math.round(v[1]) + ',' + Math.round(v[2]) + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; },
  mixA(a, b, t) { const A = AK.rgb(a), B = AK.rgb(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; },
  /* a soft round light sprite in one colour, painted once and reused with drawImage */
  glow(col) {
    const v = AK.rgb(col), key = v.map(Math.round).join(',');
    let cv = AK._glow.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const g = cv.getContext('2d'), rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    rg.addColorStop(0, 'rgba(' + key + ',1)'); rg.addColorStop(0.25, 'rgba(' + key + ',.62)'); rg.addColorStop(0.55, 'rgba(' + key + ',.2)'); rg.addColorStop(1, 'rgba(' + key + ',0)');
    g.fillStyle = rg; g.fillRect(0, 0, 96, 96);
    if (AK._glow.size < 200) AK._glow.set(key, cv);
    return cv;
  },
  /* additive light blob at x,y with radius r */
  light(c, x, y, r, col, a) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a == null ? 1 : a;
    c.drawImage(AK.glow(col), x - r, y - r, r * 2, r * 2); c.restore();
  },
  /* 160px of film grain, painted once; fill with c.fillStyle = AK.grain(c) at low alpha */
  grain(c) {
    if (!AK._grain) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 160;
      const g = cv.getContext('2d'), im = g.createImageData(160, 160), r = mulberry32(8191);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0);
      AK._grain = c.createPattern(cv, 'repeat');
    }
    return AK._grain;
  },
  /* offscreen layer painted once per key and size; paint(g, w, h) draws in css pixels */
  layer(key, w, h, dpr, paint) {
    const k = key + '|' + Math.round(w) + 'x' + Math.round(h) + '@' + dpr;
    let e = AK._cache.get(k);
    if (e) return e;
    if (AK._cache.size > 24) AK._cache.clear();
    e = document.createElement('canvas'); e.width = Math.max(2, Math.round(w * dpr)); e.height = Math.max(2, Math.round(h * dpr));
    const g = e.getContext('2d'); g.scale(dpr, dpr);
    paint(g, w, h);
    AK._cache.set(k, e);
    return e;
  },
  dropLayers(prefix) { for (const k of Array.from(AK._cache.keys())) if (!prefix || k.indexOf(prefix) === 0) AK._cache.delete(k); },
  /* a 4-point sparkle */
  star(c, x, y, r, pinch) {
    const p = pinch == null ? 0.22 : pinch;
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x + r * p, y - r * p, x + r, y); c.quadraticCurveTo(x + r * p, y + r * p, x, y + r); c.quadraticCurveTo(x - r * p, y + r * p, x - r, y); c.quadraticCurveTo(x - r * p, y - r * p, x, y - r); c.closePath();
  },
  vignette(c, w, h, a, tint, inner) {
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * (inner == null ? 0.32 : inner), w / 2, h / 2, Math.max(w, h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, AK.rgba(tint || [4, 6, 14], a));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  },
  /* wrap an id string like 'abc' into a stable 0..1 number */
  h1(a, b, c2) { return hash01(a | 0, b | 0, c2 | 0); }
};

/* ---------- the particle layer above a shift game ---------- */
const JFX = {
  p: [], raf: 0, last: 0, cv: null, c: null, W: 0, H: 0, dpr: 1,
  ready() {
    const card = $('#job .jcard'); if (!card) return false;
    let cv = $('#jfx');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'jfx'; cv.setAttribute('aria-hidden', 'true'); card.appendChild(cv); }
    const r = card.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    JFX.cv = cv; JFX.c = cv.getContext('2d'); JFX.W = r.width; JFX.H = r.height; JFX.dpr = dpr; JFX.rect = r;
    return true;
  },
  /* where an element's centre sits inside the card (css px) */
  pos(ref, fx, fy) {
    if (!JFX.ready()) return null;
    if (!ref || ref.getBoundingClientRect === undefined) return ref ? { x: ref.x, y: ref.y } : null;
    const rr = ref.getBoundingClientRect(), hr = JFX.rect;
    return { x: rr.left - hr.left + rr.width * (fx == null ? 0.5 : fx), y: rr.top - hr.top + rr.height * (fy == null ? 0.5 : fy) };
  },
  add(o) { if (JFX.p.length < 260) JFX.p.push(o); if (!JFX.raf) { JFX.last = performance.now(); JFX.raf = requestAnimationFrame(JFX.step); } },
  clear() { JFX.p.length = 0; if (JFX.c && JFX.cv) JFX.c.clearRect(0, 0, JFX.cv.width, JFX.cv.height); },
  /* kind: spark | confetti | stars | puff | ring | splat | smoke | steam | coins */
  burst(ref, kind, o) {
    if (REDUCED) return;
    const P = JFX.pos(ref, o && o.fx, o && o.fy); if (!P) return;
    o = o || {};
    const col = o.col || '#ffc247', n = o.n || 14, R = Math.random;
    if (kind === 'spark') {
      for (let i = 0; i < n; i++) { const a = R() * 6.283, v = (o.v || 160) * (0.35 + R() * 0.9); JFX.add({ k: 's', x: P.x, y: P.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 520, life: 0, max: 0.45 + R() * 0.4, r: 1.6 + R() * 2.4, col: Array.isArray(col) ? col[i % col.length] : col }); }
    } else if (kind === 'splat') {
      JFX.add({ k: 'ring', x: P.x, y: P.y, life: 0, max: 0.34, r: 6, r2: o.r || 38, col, w: 3 });
      JFX.add({ k: 'blob', x: P.x, y: P.y, life: 0, max: 0.5, r: 8, r2: o.r ? o.r * 0.7 : 24, col });
      for (let i = 0; i < n; i++) { const a = R() * 6.283, v = 90 + R() * 190; JFX.add({ k: 's', x: P.x, y: P.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 640, life: 0, max: 0.4 + R() * 0.35, r: 1.8 + R() * 2.6, col: Array.isArray(col) ? col[i % col.length] : col }); }
    } else if (kind === 'confetti') {
      const cols = o.cols || ['#ffc247', '#ff7eb6', '#6fd1ff', '#8ac926', '#ff7a59', '#c77dff', '#ffffff'];
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.4, v = 220 + R() * 360; JFX.add({ k: 'c', x: P.x, y: P.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 620, life: 0, max: 1.5 + R() * 0.8, w: 5 + R() * 5, h: 3 + R() * 4, rot: R() * 6, vr: (R() - 0.5) * 16, col: cols[i % cols.length] }); }
    } else if (kind === 'stars') {
      for (let i = 0; i < n; i++) { const a = R() * 6.283, v = 40 + R() * 120; JFX.add({ k: 'st', x: P.x + (R() - 0.5) * 30, y: P.y + (R() - 0.5) * 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 90, life: 0, max: 0.9 + R() * 0.7, r: 5 + R() * 8, rot: R() * 3, vr: (R() - 0.5) * 4, col: Array.isArray(col) ? col[i % col.length] : col }); }
    } else if (kind === 'ring') {
      JFX.add({ k: 'ring', x: P.x, y: P.y, life: 0, max: o.max || 0.55, r: o.r0 || 10, r2: o.r || 60, col, w: o.w || 3 });
    } else if (kind === 'smoke') {
      for (let i = 0; i < n; i++) JFX.add({ k: 'pf', x: P.x + (R() - 0.5) * (o.spread || 40), y: P.y, vx: (R() - 0.5) * 24, vy: -(30 + R() * 50), g: -6, life: -R() * 0.35, max: 1.1 + R() * 0.8, r: 12 + R() * 10, r2: 38 + R() * 26, col, a: o.a || 0.5 });
    } else if (kind === 'steam') {
      for (let i = 0; i < n; i++) JFX.add({ k: 'pf', x: P.x + (R() - 0.5) * (o.spread || 30), y: P.y, vx: (R() - 0.5) * 14, vy: -(36 + R() * 30), g: -4, life: -R() * 0.3, max: 0.9 + R() * 0.6, r: 6 + R() * 5, r2: 22 + R() * 14, col: col || '#ffffff', a: o.a || 0.28 });
    } else if (kind === 'coins') {
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 1.6, v = 200 + R() * 260; JFX.add({ k: 'coin', x: P.x, y: P.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, life: 0, max: 1.1 + R() * 0.4, r: 5 + R() * 2, ph: R() * 6 }); }
    }
  },
  step(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - JFX.last) / 1000)); JFX.last = now;
    const cv = JFX.cv, c = JFX.c;
    if (!cv || !cv.isConnected || !JFX.p.length) { JFX.raf = 0; if (c && cv) c.clearRect(0, 0, cv.width, cv.height); JFX.p.length = 0; return; }
    c.setTransform(JFX.dpr, 0, 0, JFX.dpr, 0, 0); c.clearRect(0, 0, JFX.W, JFX.H);
    for (let i = JFX.p.length - 1; i >= 0; i--) {
      const p = JFX.p[i];
      p.life += dt;
      if (p.life >= p.max) { JFX.p.splice(i, 1); continue; }
      if (p.life < 0) continue;
      const u = p.life / p.max;
      if (p.vx !== undefined) { p.vy += (p.g || 0) * dt; p.vx *= 0.992; p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.k === 's') {
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - u; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r * (1 - u * 0.5), 0, 7); c.fill();
        c.globalAlpha = (1 - u) * 0.35; c.beginPath(); c.arc(p.x, p.y, p.r * 2.6, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
      } else if (p.k === 'c') {
        p.rot += p.vr * dt; const f = Math.abs(Math.cos(p.rot * 1.3));
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, (1 - u) * 2); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2 * f, p.w, p.h * f + 0.6); c.restore();
      } else if (p.k === 'st') {
        p.rot += p.vr * dt; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.sin(u * Math.PI); c.fillStyle = p.col; AK.star(c, 0, 0, p.r * (0.5 + 0.5 * Math.sin(u * Math.PI)), 0.2); c.fill(); c.restore();
      } else if (p.k === 'ring') {
        const e = 1 - Math.pow(1 - u, 3); c.globalAlpha = (1 - u) * 0.9; c.strokeStyle = p.col; c.lineWidth = p.w * (1 - u * 0.7); c.beginPath(); c.arc(p.x, p.y, p.r + (p.r2 - p.r) * e, 0, 7); c.stroke();
      } else if (p.k === 'blob') {
        const e = 1 - Math.pow(1 - u, 3), r = p.r + (p.r2 - p.r) * e; c.globalAlpha = (1 - u) * 0.5; c.fillStyle = p.col; c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.62, 0, 0, 7); c.fill();
      } else if (p.k === 'pf') {
        const r = p.r + (p.r2 - p.r) * u; c.globalAlpha = p.a * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u); c.drawImage(AK.glow(p.col), p.x - r, p.y - r, r * 2, r * 2);
      } else if (p.k === 'coin') {
        p.ph += dt * 10; const f = Math.abs(Math.cos(p.ph)); c.globalAlpha = Math.min(1, (1 - u) * 2.5); c.fillStyle = '#ffc247'; c.beginPath(); c.ellipse(p.x, p.y, p.r * Math.max(0.2, f), p.r, 0, 0, 7); c.fill(); c.fillStyle = '#fff3c4'; c.beginPath(); c.ellipse(p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.4 * Math.max(0.2, f), p.r * 0.4, 0, 0, 7); c.fill();
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    JFX.raf = JFX.p.length ? requestAnimationFrame(JFX.step) : 0;
    if (!JFX.p.length) c.clearRect(0, 0, JFX.W, JFX.H);
  }
};
