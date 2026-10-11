/* ---------- animated scenes for longer activities ---------- */
// Every scene is a function (c, w, h, t, fr, o): c is already scaled to css pixels, t is the scene clock in seconds, fr is how far through the
// activity we are (0..1) and o is the activity's own options. Static set dressing is painted once into AK.layer caches ("sc|...");
// only what moves is drawn each frame. SC.draw finishes every scene with the shared grade, vignette, letterbox and grain (SK.finish).
const SC = { o: null, t: 0, ctx: null, w: 0, h: 0, line: -1 };
SC.open = function (k, o) {
  k.scene = o.scene; SC.o = o; SC.t = 0; SC.line = -1; SC.frac = 0;
  AK.dropLayers('sc|');
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
SC.close = function () { $('#scene').hidden = true; SC.o = null; AK.dropLayers('sc|'); };
SC.draw = function (dt) {
  if (!SC.o) return;
  SC.t += dt;
  SC.size();
  const c = SC.ctx;
  c.setTransform(SC.dpr, 0, 0, SC.dpr, 0, 0);
  const tt = REDUCED ? 0.5 : SC.t;
  try { (SCENES[SC.o.scene] || SCENES.read)(c, SC.w, SC.h, tt, SC.frac || 0, SC.o); SK.finish(c, SC.w, SC.h, tt, SC.o); } catch (e) { console.error(e); }
};
const scLayer = (name, w, h, paint) => AK.layer('sc|' + name, w, h, SC.dpr, paint);

/* ---------------------------- the movie theatre ---------------------------- */
function scCinemaRoom(g, w, h, sx, sy, sw, sh) {
  g.fillStyle = SK.lin(g, 0, 0, 0, h, [[0, '#0b0911'], [0.5, '#17101d'], [1, '#09070d']]); g.fillRect(0, 0, w, h);
  // acoustic ribs on both side walls, and warm wall lamps
  for (let x = 0; x < w; x += 10) {
    if (x > sx - 6 && x < sx + sw + 6) continue;
    g.fillStyle = SK.lin(g, x, 0, x + 10, 0, [[0, 'rgba(0,0,0,.55)'], [0.5, 'rgba(150,110,150,.13)'], [1, 'rgba(0,0,0,.55)']]); g.fillRect(x, h * 0.03, 10, h * 0.62);
  }
  [sx * 0.42, w - sx * 0.42].forEach(lx => { AK.light(g, lx, h * 0.38, h * 0.2, '#ffb36b', 0.5); g.fillStyle = '#ffe2b0'; rr(g, lx - 3, h * 0.36, 6, h * 0.05, 3); g.fill(); });
  // the floor and its aisle lights
  g.fillStyle = SK.lin(g, 0, h * 0.58, 0, h, [[0, '#1a0c14'], [1, '#07040a']]); g.fillRect(0, h * 0.6, w, h * 0.4);
  for (let i = 0; i < 7; i++) { const k = i / 6, y = h * (0.64 + k * 0.34); [w * (0.5 - 0.05 - k * 0.12), w * (0.5 + 0.05 + k * 0.12)].forEach(lx => { AK.light(g, lx, y, 5 + k * 8, '#ffb347', 0.9); g.fillStyle = '#ffd78a'; g.beginPath(); g.arc(lx, y, 1 + k * 1.6, 0, 7); g.fill(); }); }
  // velvet curtains pulled to each side, with a scalloped valance and gold fringe
  const curtain = (xa, xb) => {
    const W = xb - xa;
    g.fillStyle = '#4a0b1c'; g.fillRect(xa, 0, W, h * 0.64);
    for (let i = 0; i < 8; i++) { const fx = xa + W * i / 8; g.fillStyle = SK.lin(g, fx, 0, fx + W / 8, 0, [[0, 'rgba(0,0,0,.55)'], [0.45, 'rgba(255,100,125,.22)'], [1, 'rgba(0,0,0,.5)']]); g.fillRect(fx, 0, W / 8, h * 0.64); }
    g.fillStyle = SK.lin(g, 0, h * 0.34, 0, h * 0.66, [[0, 'rgba(10,6,14,0)'], [1, 'rgba(10,6,14,.96)']]); g.fillRect(xa, h * 0.34, W, h * 0.32);
  };
  curtain(0, sx + sw * 0.03); curtain(sx + sw * 0.97, w);
  g.fillStyle = '#030207'; g.fillRect(sx - 7, sy - 7, sw + 14, sh + 14);
  g.fillStyle = '#5e1026'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h * 0.055);
  const n = 8; for (let i = 0; i < n; i++) { const x1 = w - w * i / n, x2 = w - w * (i + 1) / n; g.quadraticCurveTo((x1 + x2) / 2, h * 0.12, x2, h * 0.055); }
  g.closePath(); g.fill();
  g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.12, [[0, 'rgba(255,120,140,.25)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.4)']]); g.fill();
  g.strokeStyle = '#d4a017'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(w, h * 0.055);
  for (let i = 0; i < n; i++) { const x1 = w - w * i / n, x2 = w - w * (i + 1) / n; g.quadraticCurveTo((x1 + x2) / 2, h * 0.12, x2, h * 0.055); } g.stroke();
}
function scCinemaScreen(c, sx, sy, sw, sh, t, fr, o, ca, cb, shot, ph) {
  c.save(); c.beginPath(); c.rect(sx, sy, sw, sh); c.clip();
  if (fr < 0.07 || fr > 0.93) {
    c.fillStyle = SK.rad(c, sx + sw / 2, sy + sh / 2, 0, sw * 0.6, [[0, '#15110f'], [1, '#020202']]); c.fillRect(sx, sy, sw, sh);
    c.fillStyle = '#f5e6c8'; c.font = '700 ' + Math.round(sh * 0.14) + 'px "Fraunces","Bricolage Grotesque",serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,220,160,.6)'; c.shadowBlur = 14;
    c.fillText(fr < 0.07 ? (o.film || 'Feature') : 'THE END', sx + sw / 2, sy + sh / 2); c.shadowBlur = 0;
    c.fillStyle = 'rgba(245,230,200,.5)'; c.fillRect(sx + sw * 0.38, sy + sh * 0.62, sw * 0.24, 1.5);
  } else {
    const rise = shot % 3;
    c.fillStyle = SK.lin(c, 0, sy, 0, sy + sh, [[0, shade(ca, -0.35)], [0.5, ca], [1, mix(cb, '#ffe9cf', 0.4)]]); c.fillRect(sx, sy, sw, sh);
    const sunx = sx + sw * (0.2 + 0.6 * ((shot * 0.37) % 1)), suny = sy + sh * (0.28 + 0.1 * rise);
    AK.light(c, sunx, suny, sh * 0.8, '#fff2d0', 0.7); c.fillStyle = '#fff6dc'; c.beginPath(); c.arc(sunx, suny, sh * 0.07, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 3; i++) { const cx = sx + ((i * 0.37 + t * 0.012 + shot * 0.2) % 1.3 - 0.15) * sw; c.beginPath(); c.ellipse(cx, sy + sh * (0.2 + i * 0.08), sw * 0.09, sh * 0.025, 0, 0, 7); c.ellipse(cx + sw * 0.05, sy + sh * (0.18 + i * 0.08), sw * 0.06, sh * 0.03, 0, 0, 7); c.fill(); }
    [[0.56, 0.1, 0.16, 0.9, 0.25], [0.7, 0.07, 0.3, 1.5, 0.45], [0.84, 0.05, 0.6, 2.1, 0.7]].forEach((L, li) => {
      c.fillStyle = li === 0 ? mix(ca, '#2a2040', 0.55) : li === 1 ? mix(ca, '#120c1e', 0.72) : 'rgba(7,5,12,.9)';
      c.beginPath(); c.moveTo(sx, sy + sh);
      for (let i = 0; i <= 14; i++) c.lineTo(sx + sw * i / 14, sy + sh * (L[0] + L[1] * Math.sin(i * 0.9 + shot * 1.7 + li * 2 + t * L[2] * 0.12) + L[1] * 0.4 * Math.sin(i * 2.3 + li)));
      c.lineTo(sx + sw, sy + sh); c.closePath(); c.fill();
    });
    // a runner crossing the foreground
    const fx = sx + sw * (((t * 0.075 + shot * 0.31) % 1.3) - 0.15), by = sy + sh * 0.86, uu = sh * 0.0072, sw2 = Math.sin(t * 9);
    c.strokeStyle = '#07050c'; c.fillStyle = '#07050c'; c.lineWidth = 3.2 * uu; c.lineCap = 'round';
    c.beginPath(); c.arc(fx, by - 30 * uu, 3.2 * uu, 0, 7); c.fill();
    c.beginPath(); c.moveTo(fx, by - 26 * uu); c.lineTo(fx + 1.5 * uu, by - 14 * uu); c.stroke();
    c.beginPath(); c.moveTo(fx + 1.5 * uu, by - 14 * uu); c.lineTo(fx + (4 + sw2 * 5) * uu, by); c.moveTo(fx + 1.5 * uu, by - 14 * uu); c.lineTo(fx + (-4 - sw2 * 5) * uu, by); c.stroke();
    c.beginPath(); c.moveTo(fx, by - 23 * uu); c.lineTo(fx + (5 + sw2 * 4) * uu, by - 16 * uu); c.moveTo(fx, by - 23 * uu); c.lineTo(fx + (-5 - sw2 * 4) * uu, by - 16 * uu); c.stroke();
    c.lineCap = 'butt';
  }
  // projector flicker, grain and the odd scratch
  if (!REDUCED) {
    const gs = Math.floor(t * 24);
    c.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 26; i++) c.fillRect(sx + hash01(i, gs, 3) * sw, sy + hash01(i, gs, 4) * sh, 1.2, 1.2);
    if (hash01(gs, 7, 7) > 0.94) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(sx + hash01(gs, 8, 8) * sw, sy, 1, sh); }
  }
  c.fillStyle = SK.rad(c, sx + sw / 2, sy + sh / 2, sh * 0.3, sw * 0.62, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.5)']]); c.fillRect(sx, sy, sw, sh);
  c.restore();
}
function scPopcorn(c, w, h, t) {
  const px = w * 0.89, py = h * 0.985, s = h / 135;
  AK.light(c, px, py - 20 * s, 34 * s, '#ffe0a0', 0.18);
  c.fillStyle = '#ffe9a8';
  for (let i = 0; i < 14; i++) { const a = hash01(i, 1, 1), b = hash01(i, 2, 1); c.beginPath(); c.arc(px - 12 * s + a * 24 * s, py - 24 * s - b * 8 * s - (i % 3) * 1.5 * s, 3.4 * s + b * s, 0, 7); c.fill(); c.fillStyle = i % 2 ? '#ffe9a8' : '#fff4cf'; }
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(px - 5 * s, py - 31 * s, 1.4 * s, 0, 7); c.fill();
  const g = SK.lin(c, px - 14 * s, 0, px + 14 * s, 0, [[0, '#a6271d'], [0.5, '#d2392c'], [1, '#8d1f17']]);
  c.fillStyle = g; c.beginPath(); c.moveTo(px - 15 * s, py - 24 * s); c.lineTo(px + 15 * s, py - 24 * s); c.lineTo(px + 11 * s, py); c.lineTo(px - 11 * s, py); c.closePath(); c.fill();
  c.fillStyle = 'rgba(250,244,230,.92)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(px - 15 * s + (i * 2 + 0.5) * 5 * s, py - 24 * s); c.lineTo(px - 15 * s + (i * 2 + 1.5) * 5 * s, py - 24 * s); c.lineTo(px - 11 * s + (i * 2 + 1.5) * 3.6 * s, py); c.lineTo(px - 11 * s + (i * 2 + 0.5) * 3.6 * s, py); c.closePath(); c.fill(); }
  // an occasional kernel pops up
  const k = (t * 0.5) % 1; if (k < 0.5) { c.fillStyle = '#fff4cf'; c.beginPath(); c.arc(px + Math.sin(k * 9) * 6 * s, py - 32 * s - Math.sin(k * Math.PI * 2) * 12 * s, 2.6 * s, 0, 7); c.fill(); }
}
function scCinemaAudience(c, w, h, t, ca, sx, sy, sw, sh) {
  const rim = AK.rgba(ca, 0.5);
  for (let r = 0; r < 3; r++) {
    const rw = w * (0.088 + r * 0.013), n = Math.ceil(w / rw) + 1, y = h * (0.745 + r * 0.108), s = rw;
    for (let i = 0; i < n; i++) {
      const x = rw * (i + 0.5) + (r % 2 ? rw * 0.5 : 0) - rw * 0.5;
      if (Math.abs(x - w * 0.5) < rw * 0.55) continue;          // the aisle
      const occ = hash01(i, r, 7) > 0.24, mood = hash01(i, r, 9);
      const sway = Math.sin(t * 0.55 + i * 1.7 + r) * s * 0.012, laugh = mood > 0.84 ? Math.max(0, Math.sin(t * 3.2 + i * 2.3)) * s * 0.05 : 0;
      // the seat back
      c.fillStyle = SK.lin(c, 0, y - s * 0.22, 0, y + s * 0.5, [[0, r === 2 ? '#7a2438' : '#68202f'], [0.18, r === 2 ? '#521628' : '#44101f'], [1, '#1c0710']]);
      rr(c, x - s * 0.4, y - s * 0.2, s * 0.8, s * 0.72, s * 0.14); c.fill();
      c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, x - s * 0.36, y - s * 0.19, s * 0.72, s * 0.05, s * 0.03); c.fill();
      c.fillStyle = '#12060c'; rr(c, x - s * 0.5, y + s * 0.05, s * 0.1, s * 0.36, s * 0.04); c.fill(); rr(c, x + s * 0.4, y + s * 0.05, s * 0.1, s * 0.36, s * 0.04); c.fill();
      if (occ) {
        const hx = x + sway + (mood < 0.14 ? s * 0.12 : 0), hy = y - s * 0.22 - laugh, hr = s * 0.17;
        c.fillStyle = '#0a0810'; rr(c, hx - s * 0.3, hy + hr * 0.7, s * 0.6, s * 0.32, s * 0.14); c.fill();
        c.fillStyle = '#0d0a13'; c.beginPath(); c.arc(hx, hy, hr, 0, 7); c.fill();
        if (hash01(i, r, 11) > 0.72) { c.fillStyle = '#100d16'; c.beginPath(); c.arc(hx - hr * 0.8, hy - hr * 0.2, hr * 0.5, 0, 7); c.fill(); }     // a bun or a pony
        c.strokeStyle = rim; c.lineWidth = 1.3; c.beginPath(); c.arc(hx, hy, hr, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
        c.beginPath(); c.moveTo(hx - s * 0.3, hy + hr * 1.1); c.quadraticCurveTo(hx - s * 0.3, hy + hr * 0.7, hx - s * 0.12, hy + hr * 0.68); c.stroke();
      }
    }
  }
}
/* ---------------------------- the laundromat ---------------------------- */
function scLaundryRoom(g, w, h) {
  // tiled wall, a dado of deeper tiles, windows, and the floor
  g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.72, [[0, '#dfeaee'], [1, '#c3d6dd']]); g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,120,140,.14)'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.72); g.stroke(); }
  for (let y = 0; y < h * 0.72; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = SK.lin(g, 0, h * 0.5, 0, h * 0.72, [[0, '#5aa6b8'], [1, '#3f8aa0']]); g.fillRect(0, h * 0.5, w, h * 0.22);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, h * 0.5, w, 2);
  g.strokeStyle = 'rgba(10,40,60,.2)'; for (let x = 0; x < w; x += 28) { g.beginPath(); g.moveTo(x, h * 0.5); g.lineTo(x, h * 0.72); g.stroke(); }
  g.fillStyle = SK.lin(g, 0, h * 0.72, 0, h, [[0, '#c9d3d8'], [1, '#8d9aa3']]); g.fillRect(0, h * 0.72, w, h * 0.28);
  for (let r = 0; r < 6; r++) { const y = h * 0.72 + (h * 0.28) * (r / 6) ** 1.2, y2 = h * 0.72 + (h * 0.28) * ((r + 1) / 6) ** 1.2; for (let c2 = -6; c2 < 14; c2++) { if ((c2 + r) % 2) { g.fillStyle = 'rgba(255,255,255,.18)'; const xa = w * 0.5 + (c2 - 4) * (w * 0.14) * (1 + r * 0.22), xb = w * 0.5 + (c2 - 3) * (w * 0.14) * (1 + (r + 1) * 0.22); g.beginPath(); g.moveTo(xa - (w * 0.5 - xa) * r * 0.0, y); g.lineTo(xb, y); g.lineTo(xb + (xb - w / 2) * 0.03, y2); g.lineTo(xa + (xa - w / 2) * 0.03, y2); g.closePath(); g.fill(); } } }
  g.fillStyle = '#7e8d96'; g.fillRect(0, h * 0.715, w, h * 0.012);
  // ceiling strips and windows with bright frames
  g.fillStyle = 'rgba(255,255,255,.55)'; rr(g, w * 0.18, h * 0.03, w * 0.26, h * 0.025, 4); g.fill(); rr(g, w * 0.56, h * 0.03, w * 0.26, h * 0.025, 4); g.fill();
  const win = (x, y, ww, hh) => {
    g.fillStyle = '#8a98a0'; g.fillRect(x - 4, y - 4, ww + 8, hh + 8);
    g.fillStyle = SK.lin(g, 0, y, 0, y + hh, [[0, '#fdf6e0'], [1, '#bfe3f4']]); g.fillRect(x, y, ww, hh);
    g.fillStyle = '#8a98a0'; g.fillRect(x + ww / 2 - 1.5, y, 3, hh); g.fillRect(x, y + hh / 2 - 1.5, ww, 3);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 4, y + 4, ww * 0.18, hh - 8);
  };
  win(w * 0.07, h * 0.1, w * 0.16, h * 0.3); win(w * 0.77, h * 0.1, w * 0.16, h * 0.3);
  // a shelf of detergent above the machines and a wall clock
  g.fillStyle = '#9b7a52'; g.fillRect(w * 0.34, h * 0.2, w * 0.32, 5); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(w * 0.34, h * 0.2 + 5, w * 0.32, 4);
  [['#3b7ddd', 0.35], ['#e8603c', 0.4], ['#ffd23f', 0.45], ['#5ac18e', 0.51], ['#c77dff', 0.56]].forEach((b, i) => { const bx = w * b[1], bh = h * (0.06 + (i % 2) * 0.012); g.fillStyle = b[0]; rr(g, bx, h * 0.2 - bh, w * 0.034, bh, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx + 3, h * 0.2 - bh + 3, 3, bh - 8); g.fillStyle = '#f6f1e4'; g.fillRect(bx + 3, h * 0.2 - bh * 0.55, w * 0.034 - 6, bh * 0.25); });
  g.fillStyle = '#f6f1e4'; g.beginPath(); g.arc(w * 0.5, h * 0.1, h * 0.05, 0, 7); g.fill(); g.strokeStyle = '#4a5a64'; g.lineWidth = 3; g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(w * 0.5, h * 0.1); g.lineTo(w * 0.5, h * 0.07); g.moveTo(w * 0.5, h * 0.1); g.lineTo(w * 0.52, h * 0.105); g.stroke();
}
function scMachine(c, x, y, mw, mh, t, i, fr, dryer) {
  const s = mw / 100, jx = REDUCED ? 0 : Math.sin(t * 46 + i * 2) * 0.5, jy = REDUCED ? 0 : Math.cos(t * 53 + i) * 0.4;
  c.save(); c.translate(jx, jy);
  SK.shadow(c, x + mw / 2, y + mh + 4, mw * 0.55, 8, 0.45);
  // cabinet
  c.fillStyle = SK.lin(c, x, 0, x + mw, 0, [[0, '#dfe7eb'], [0.12, '#fbfdfe'], [0.85, '#eaf0f3'], [1, '#aeb9c0']]); rr(c, x, y, mw, mh, 8 * s); c.fill();
  c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(x + 4 * s, y + mh * 0.82, mw - 8 * s, 2);
  // control panel
  c.fillStyle = '#c9d4da'; rr(c, x + 5 * s, y + 5 * s, mw - 10 * s, mh * 0.17, 5 * s); c.fill();
  c.fillStyle = '#0a1a22'; rr(c, x + 10 * s, y + 9 * s, 30 * s, mh * 0.1, 3 * s); c.fill();
  const p = clamp(fr, 0, 1); c.fillStyle = dryer ? '#ffb347' : '#5ad2ff'; c.fillRect(x + 12 * s, y + 9 * s + mh * 0.1 - 5 * s, 26 * s * p, 2.4 * s); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 12 * s, y + 12 * s, 14 * s, 1.6 * s);
  for (let k = 0; k < 2; k++) { c.fillStyle = '#6c7a83'; c.beginPath(); c.arc(x + mw - 22 * s + k * 12 * s, y + 5 * s + mh * 0.085, 4.4 * s, 0, 7); c.fill(); c.fillStyle = '#e8eff2'; c.beginPath(); c.arc(x + mw - 22 * s + k * 12 * s, y + 5 * s + mh * 0.085, 3.2 * s, 0, 7); c.fill(); c.fillStyle = '#25323a'; c.fillRect(x + mw - 22.6 * s + k * 12 * s, y + 5 * s + mh * 0.085 - 3.2 * s, 1.2 * s, 3 * s); }
  c.fillStyle = Math.sin(t * 3 + i) > 0 ? '#44e08a' : '#1c7a4a'; c.beginPath(); c.arc(x + mw - 8 * s, y + 9 * s, 2.2 * s, 0, 7); c.fill();
  // the door: chrome ring, glass and the drum behind it
  const cx = x + mw / 2, cy = y + mh * 0.6, r = Math.min(mw * 0.38, mh * 0.3);
  c.fillStyle = SK.lin(c, cx - r, cy - r, cx + r, cy + r, [[0, '#f4f8fa'], [0.5, '#a9b6bd'], [1, '#7d8c95']]); c.beginPath(); c.arc(cx, cy, r + 7 * s, 0, 7); c.fill();
  c.fillStyle = '#394852'; c.beginPath(); c.arc(cx, cy, r + 2 * s, 0, 7); c.fill();
  c.fillStyle = SK.rad(c, cx, cy, 0, r, [[0, dryer ? '#2b2118' : '#1a3040'], [1, '#0b161d']]); c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(cx, cy, r - 1, 0, 7); c.clip();
  if (!dryer) { c.fillStyle = 'rgba(110,190,235,.5)'; const wl = cy + r * 0.12 + Math.sin(t * 3 + i) * r * 0.07; c.beginPath(); c.moveTo(cx - r, wl); for (let k = 0; k <= 10; k++) c.lineTo(cx - r + r * 2 * k / 10, wl + Math.sin(t * 5 + k + i) * 2); c.lineTo(cx + r, cy + r); c.lineTo(cx - r, cy + r); c.closePath(); c.fill(); }
  const cols = ['#e76f51', '#e9c46a', '#8ecae6', '#ffffff', '#c77dff', '#2a9d8f', '#f4a261'];
  const sp = t * (dryer ? 3.4 : 2.2 + i * 0.3);
  for (let k = 0; k < 8; k++) { const a = sp + k * 0.8, rr2 = r * (0.34 + 0.26 * (k % 3) / 2); c.fillStyle = cols[(k + i * 2) % cols.length]; c.save(); c.translate(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); c.rotate(a * 1.4); rr(c, -r * 0.2, -r * 0.12, r * 0.4, r * 0.24, r * 0.06); c.fill(); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(-r * 0.2, 0, r * 0.4, r * 0.1); c.restore(); }
  if (!dryer) { c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 9; k++) { const by = cy + r - ((t * 34 + k * 19 + i * 11) % (r * 2)); c.beginPath(); c.arc(cx - r * 0.65 + hash01(k, i, 3) * r * 1.3, by, 1.6 + hash01(k, i, 4) * 3, 0, 7); c.fill(); } }
  else AK.light(c, cx, cy + r * 0.3, r * 1.1, '#ff9a3d', 0.25);
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.34)'; c.beginPath(); c.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.55, r * 0.28, -0.7, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(cx, cy, r, Math.PI * 0.1, Math.PI * 0.9); c.fill();
  c.restore();
}
/* ---------------------------- reading ---------------------------- */
const SC_READ_BG = { home: ['#3a2a30', '#6a4638'], chair: ['#34261f', '#74502f'], cafe: ['#23302f', '#4f6b62'], books: ['#27202f', '#54406a'], park: ['#2e6a8a', '#8cc27a'] };
function scReadRoom(g, w, h, place) {
  const bg = SC_READ_BG[place] || SC_READ_BG.home;
  g.fillStyle = SK.lin(g, 0, 0, 0, h, [[0, bg[0]], [1, bg[1]]]); g.fillRect(0, 0, w, h);
  if (place === 'books') {
    // two walls of shelves running away from us
    for (let side = 0; side < 2; side++) for (let row = 0; row < 5; row++) {
      const y = h * (0.06 + row * 0.15);
      g.fillStyle = '#2a1c14'; g.fillRect(side ? w * 0.7 : 0, y + h * 0.12, w * 0.3, 4);
      for (let k = 0; k < 18; k++) { const bw = w * 0.012 + hash01(k, row, side) * w * 0.008, bx = (side ? w * 0.7 : 0) + k * w * 0.0166, bh = h * (0.07 + hash01(k, row, 9 + side) * 0.04); g.fillStyle = ['#7a2a3a', '#2a5a7a', '#c9a24a', '#3a7a5a', '#8a5aa0', '#c0603a', '#e9e0cf'][Math.floor(hash01(k, row, 5 + side) * 7)]; g.fillRect(bx, y + h * 0.12 - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(bx, y + h * 0.12 - bh, 1, bh); }
    }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(w * 0.3, 0, w * 0.4, h * 0.6);
    g.fillStyle = SK.lin(g, 0, h * 0.1, 0, h * 0.6, [[0, 'rgba(255,220,160,.0)'], [1, 'rgba(255,220,160,.12)']]); g.fillRect(w * 0.3, h * 0.1, w * 0.4, h * 0.5);
  } else if (place === 'cafe') {
    g.fillStyle = '#10181a'; g.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.48);
    g.fillStyle = SK.lin(g, 0, h * 0.08, 0, h * 0.56, [[0, '#1b2b3a'], [1, '#31484f']]); g.fillRect(w * 0.07, h * 0.1, w * 0.86, h * 0.44);
    for (let i = 0; i < 26; i++) { const lx = w * (0.08 + hash01(i, 1, 1) * 0.84), ly = h * (0.14 + hash01(i, 2, 1) * 0.38), lr = 3 + hash01(i, 3, 1) * 9; AK.light(g, lx, ly, lr * 2.2, ['#ffd27a', '#ff9a6a', '#9fd8ff', '#ffe9b0'][i % 4], 0.55); }
    g.fillStyle = '#10181a'; g.fillRect(w * 0.5 - 2, h * 0.08, 4, h * 0.48);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(w * 0.1, h * 0.1); g.lineTo(w * 0.24, h * 0.1); g.lineTo(w * 0.14, h * 0.54); g.lineTo(w * 0.07, h * 0.54); g.closePath(); g.fill();
    g.fillStyle = '#8b6240'; g.fillRect(0, h * 0.56, w, h * 0.44);
  } else if (place === 'park') {
    g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.5, [[0, '#7ec4e8'], [1, '#d6efe0']]); g.fillRect(0, 0, w, h * 0.55);
    for (let i = 0; i < 5; i++) { const tx = w * (0.08 + i * 0.22 + hash01(i, 4, 4) * 0.06), tr = h * (0.16 + hash01(i, 5, 5) * 0.08); g.fillStyle = '#4b3524'; g.fillRect(tx - 3, h * 0.28, 6, h * 0.28); ['#2e7a48', '#3f9458', '#58ae68'].forEach((cc, k) => { g.fillStyle = cc; g.beginPath(); g.arc(tx + (k - 1) * tr * 0.4, h * 0.26 - k * 2, tr * (0.8 - k * 0.1), 0, 7); g.fill(); }); }
    g.fillStyle = SK.lin(g, 0, h * 0.5, 0, h, [[0, '#4f9d58'], [1, '#2f6a3a']]); g.fillRect(0, h * 0.52, w, h * 0.48);
  } else if (place === 'chair') {
    g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.7, [[0, '#2b1f1a'], [1, '#4a3022']]); g.fillRect(0, 0, w, h * 0.7);
    g.fillStyle = '#5a3a24'; rr(g, w * 0.04, h * 0.06, w * 0.34, h * 0.62, w * 0.06); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, w * 0.06, h * 0.08, w * 0.08, h * 0.58, w * 0.04); g.fill();
    g.fillStyle = '#6d4630'; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(w * (0.09 + i * 0.07), h * (0.14 + j * 0.1), 2.6, 0, 7); g.fill(); }
    g.fillStyle = '#6d4a30'; g.fillRect(0, h * 0.7, w, h * 0.3);
  } else {
    // home: wallpaper, a shelf, a plant
    g.fillStyle = SK.lin(g, 0, 0, 0, h * 0.62, [[0, '#3b2a30'], [1, '#573a34']]); g.fillRect(0, 0, w, h * 0.62);
    g.fillStyle = 'rgba(255,220,200,.05)'; for (let x = 0; x < w; x += 26) g.fillRect(x, 0, 9, h * 0.62);
    g.fillStyle = '#2a1c18'; g.fillRect(w * 0.06, h * 0.26, w * 0.36, 5);
    for (let k = 0; k < 11; k++) { const bh = h * (0.08 + hash01(k, 1, 2) * 0.05); g.fillStyle = ['#7a2a3a', '#2a5a7a', '#c9a24a', '#3a7a5a', '#8a5aa0', '#c0603a'][k % 6]; g.fillRect(w * 0.07 + k * w * 0.03, h * 0.26 - bh, w * 0.025, bh); }
    g.fillStyle = '#e9e4d8'; rr(g, w * 0.78, h * 0.34, w * 0.06, h * 0.1, 4); g.fill(); g.fillStyle = '#3a8a52'; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(w * 0.81 + (k - 3) * w * 0.012, h * 0.28 - Math.abs(k - 3) * 3, w * 0.012, h * 0.07, (k - 3) * 0.25, 0, 7); g.fill(); }
    g.fillStyle = '#8a6240'; g.fillRect(0, h * 0.62, w, h * 0.38);
  }
  // the table top
  g.fillStyle = SK.lin(g, 0, h * 0.58, 0, h, [[0, place === 'park' ? '#b98a56' : '#7a5232'], [1, place === 'park' ? '#8a6238' : '#4a3020']]); g.fillRect(0, place === 'park' ? h * 0.66 : h * 0.6, w, h * 0.4);
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 8; i++) g.fillRect(0, h * (0.64 + i * 0.045), w, 1.4);
}
const SCENES = {
  cinema(c, w, h, t, fr, o) {
    const pal = o.pal || ['#ff9f43', '#4cc9f0', '#c77dff'];
    const sx = w * 0.15, sy = h * 0.1, sw = w * 0.7, sh = h * 0.43;
    const shot = Math.floor(t / 2.4), ph = (t % 2.4) / 2.4, ca = pal[shot % pal.length], cb = pal[(shot + 1) % pal.length];
    c.drawImage(scLayer('cin', w, h, (g, W, H) => scCinemaRoom(g, W, H, sx, sy, sw, sh)), 0, 0, w, h);
    const flick = REDUCED ? 1 : 0.95 + 0.05 * Math.sin(t * 37) * Math.sin(t * 11.3);
    // the beam from the booth sits behind the picture, so only the part above the frame shows
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = SK.lin(c, 0, -h * 0.05, 0, sy + sh, [[0, 'rgba(255,240,220,0)'], [1, 'rgba(255,240,220,.14)']]); c.beginPath(); c.moveTo(w * 0.5 - 3, -h * 0.05); c.lineTo(w * 0.5 + 3, -h * 0.05); c.lineTo(sx + sw, sy + sh); c.lineTo(sx, sy + sh); c.closePath(); c.fill();
    c.restore();
    c.globalAlpha = ph < 0.04 ? 0.55 + ph / 0.04 * 0.45 : flick;
    scCinemaScreen(c, sx, sy, sw, sh, t, fr, o, ca, cb, shot, ph);
    c.globalAlpha = 1;
    SK.motes(c, t, sx + sw * 0.05, 0, sx + sw * 0.95, sy + sh, 38, 3, '#fff0dc', 0.8);
    AK.light(c, w * 0.5, sy + sh * 0.9, w * 0.62, ca, 0.2 * flick);
    scCinemaAudience(c, w, h, t, ca, sx, sy, sw, sh);
    if (o.popcorn) scPopcorn(c, w, h, t);
  },
  laundry(c, w, h, t, fr, o) {
    c.drawImage(scLayer('lau', w, h, (g, W, H) => scLaundryRoom(g, W, H)), 0, 0, w, h);
    // sun through the windows, slowly crossing the floor
    const sh = Math.sin(t * 0.08) * w * 0.02;
    SK.shaft(c, w * 0.15 + sh, h * 0.12, w * 0.14, w * 0.35 + sh * 2, h * 0.95, w * 0.2, '#fff3c8', 0.2);
    SK.shaft(c, w * 0.85 - sh, h * 0.12, w * 0.14, w * 0.65 - sh * 2, h * 0.95, w * 0.2, '#fff3c8', 0.16);
    SK.motes(c, t, w * 0.1, h * 0.1, w * 0.9, h * 0.9, 34, 5, '#ffffff', 0.55);
    // a folding table with a basket at the right, machines in a row
    const n = 3, mw = Math.min(w * 0.25, h * 0.58), gap = (w - mw * n) / (n + 1), my = h * 0.72 - mw * 1.12 + h * 0.02, mh = mw * 1.12;
    for (let i = 0; i < n; i++) scMachine(c, gap + i * (mw + gap), my, mw, mh, t, i, (fr * 0.9 + i * 0.05) % 1, i === 2);
    // steam from the dryer vent and soap suds floating up from the washers
    SK.steam(c, gap + 2 * (mw + gap) + mw * 0.5, my - 4, t, h / 90, '#ffffff', 3);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.strokeStyle = 'rgba(160,210,235,.8)'; c.lineWidth = 1;
    for (let i = 0; i < 16; i++) { const k = (t * 0.12 + hash01(i, 1, 1)) % 1, bx = gap + (i % 2) * (mw + gap) + mw * (0.15 + hash01(i, 2, 2) * 0.7) + Math.sin(t * 1.4 + i) * 5, by = my + mh * 0.5 - k * h * 0.45, br = 2 + hash01(i, 3, 3) * 4; c.globalAlpha = Math.sin(k * Math.PI) * 0.8; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(bx - br * 0.4, by - br * 0.5, br * 0.4, 1); c.fillStyle = 'rgba(255,255,255,.55)'; }
    c.globalAlpha = 1;
  },
  read(c, w, h, t, fr, o) {
    const place = o.place || 'home', park = place === 'park';
    c.drawImage(scLayer('rd|' + place, w, h, (g, W, H) => scReadRoom(g, W, H, place)), 0, 0, w, h);
    const bw = Math.min(w * 0.6, h * 1.16), bh = bw * 0.5, bx = (w - bw) / 2, by = h * 0.37, sp = bw / 2, u = h / 100;
    // light: a green-shaded table lamp for indoor places, dappled sun under the trees outdoors
    if (!park) {
      const lx = w * 0.85, ly = h * 0.3;
      SK.shadow(c, w * 0.9, h * 0.7, 30 * u / 2, 4 * u / 2, 0.5);
      c.strokeStyle = '#26262b'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.9, h * 0.68); c.lineTo(w * 0.9, h * 0.56); c.lineTo(lx + 8, ly + 8); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = '#2a2a30'; c.beginPath(); c.ellipse(w * 0.9, h * 0.69, 22, 6, 0, 0, 7); c.fill();
      c.fillStyle = SK.lin(c, lx - 30, 0, lx + 30, 0, [[0, '#1f5a46'], [0.5, '#36906f'], [1, '#164a39']]); c.beginPath(); c.moveTo(lx - 12, ly - 14); c.lineTo(lx + 12, ly - 14); c.lineTo(lx + 32, ly + 10); c.lineTo(lx - 32, ly + 10); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(lx - 12, ly - 14); c.lineTo(lx - 5, ly - 14); c.lineTo(lx - 18, ly + 10); c.lineTo(lx - 32, ly + 10); c.closePath(); c.fill();
      AK.light(c, lx, ly + 10, w * 0.5, '#ffd9a0', 0.5 + 0.03 * Math.sin(t * 2.3));
      SK.shaft(c, lx, ly + 10, 50, w * 0.52, h * 0.78, bw * 0.95, '#ffe2b0', 0.22);
      c.fillStyle = '#fff3c8'; c.beginPath(); c.ellipse(lx, ly + 10, 14, 3.4, 0, 0, 7); c.fill();
    } else {
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(30,70,50,.28)'; c.fillRect(0, h * 0.5, w, h * 0.5); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) { const px = w * (0.1 + hash01(i, 1, 1) * 0.8) + Math.sin(t * 0.5 + i * 1.3) * 7, py = h * (0.46 + hash01(i, 2, 1) * 0.5), pr = w * (0.025 + hash01(i, 3, 1) * 0.035); c.globalAlpha = 0.16 + 0.1 * Math.sin(t * 0.9 + i); c.fillStyle = '#fff3c0'; c.beginPath(); c.ellipse(px, py, pr, pr * 0.7, hash01(i, 4, 1) * 3, 0, 7); c.fill(); }
      c.restore();
    }
    // the book, a little off-square, with a thick block of pages and a soft shadow
    c.save(); c.translate(w / 2, by + bh / 2); c.rotate(-0.018); c.translate(-w / 2, -(by + bh / 2));
    SK.shadow(c, w / 2 + 6, by + bh + 16, bw * 0.56, bh * 0.2, 0.6);
    c.fillStyle = shade(o.cover || '#7a2a2a', -0.28); rr(c, bx - 10, by + 2, bw + 20, bh + 18, 9); c.fill();
    c.fillStyle = o.cover || '#7a2a2a'; rr(c, bx - 10, by - 6, bw + 20, bh + 14, 9); c.fill(); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(bx - 10, by - 6, bw + 20, 2);
    c.fillStyle = '#d9cfb6'; c.fillRect(bx + 2, by + bh - 1, bw - 4, 8); c.strokeStyle = 'rgba(120,100,70,.5)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(bx + 4, by + bh - 1 + k * 1.6); c.lineTo(bx + bw - 4, by + bh - 1 + k * 1.6); c.stroke(); }
    c.fillStyle = SK.lin(c, bx, 0, bx + sp, 0, [[0, '#f1e8d3'], [0.8, '#fcf7ea'], [1, '#d4caaf']]); c.beginPath(); c.moveTo(bx, by + 4); c.quadraticCurveTo(bx + sp * 0.5, by - 4, bx + sp - 1, by); c.lineTo(bx + sp - 1, by + bh); c.quadraticCurveTo(bx + sp * 0.5, by + bh - 6, bx, by + bh - 2); c.closePath(); c.fill();
    c.fillStyle = SK.lin(c, bx + sp, 0, bx + bw, 0, [[0, '#d4caaf'], [0.2, '#fcf7ea'], [1, '#efe5cd']]); c.beginPath(); c.moveTo(bx + sp + 1, by); c.quadraticCurveTo(bx + sp * 1.5, by - 4, bx + bw, by + 4); c.lineTo(bx + bw, by + bh - 2); c.quadraticCurveTo(bx + sp * 1.5, by + bh - 6, bx + sp + 1, by + bh); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,52,36,.55)';
    for (let side = 0; side < 2; side++) for (let i = 0; i < 11; i++) { const lw = (sp - 44) * (0.62 + 0.38 * hash01(i, side, Math.floor(t / 2.2))); c.fillRect(bx + 22 + side * (sp + 4), by + 20 + i * (bh - 46) / 11, lw, 2.2); if (i === 0 && !side) { c.fillStyle = 'rgba(120,40,40,.6)'; c.fillRect(bx + 22, by + 18, 14, 5); c.fillStyle = 'rgba(70,52,36,.55)'; } }
    c.fillStyle = SK.lin(c, bx + sp - 18, 0, bx + sp + 18, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,.24)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(bx + sp - 18, by, 36, bh);
    const p = (t % 2.2) / 2.2;
    if (p < 0.38) {
      const k = p / 0.38, px = bx + sp + (sp - 2) * Math.cos(k * Math.PI), lift = Math.sin(k * Math.PI);
      c.fillStyle = SK.lin(c, bx + sp, 0, px, 0, [[0, '#d4caaf'], [0.55, '#fffaf0'], [1, '#f1e8d2']]);
      c.beginPath(); c.moveTo(bx + sp, by); c.quadraticCurveTo((bx + sp + px) / 2, by - 24 * lift, px, by + 6 - 10 * lift); c.lineTo(px, by + bh - 8); c.quadraticCurveTo((bx + sp + px) / 2, by + bh + 4 - 16 * lift, bx + sp, by + bh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.14)'; c.stroke();
      c.fillStyle = 'rgba(70,52,36,.4)'; for (let i = 0; i < 8; i++) { const fx = bx + sp + (px - bx - sp) * 0.15; c.fillRect(Math.min(bx + sp, px) + Math.abs(px - bx - sp) * 0.12, by + 22 + i * 24, Math.abs(px - bx - sp) * 0.7, 2); void fx; }
    }
    c.strokeStyle = '#d8a128'; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx + sp - 3, by + bh); c.quadraticCurveTo(bx + sp - 8, by + bh + 14, bx + sp - 2 + Math.sin(t * 1.2) * 2, by + bh + 26); c.stroke(); c.lineCap = 'butt';
    c.restore();
    // a mug with steam to one side, and a place-specific prop to the other
    const mx = bx - 62, my = by + bh * 0.58;
    SK.shadow(c, mx + 20, my + 40, 30, 7, 0.5);
    c.fillStyle = SK.lin(c, mx, 0, mx + 38, 0, [[0, '#ded7c6'], [0.35, '#fbf6ea'], [1, '#bdb5a2']]); rr(c, mx, my, 38, 38, 7); c.fill();
    c.strokeStyle = '#e9e4d8'; c.lineWidth = 4.5; c.beginPath(); c.arc(mx + 40, my + 19, 9, -1.3, 1.3); c.stroke();
    c.fillStyle = '#4a2f1c'; c.beginPath(); c.ellipse(mx + 19, my + 4, 16, 4, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(mx + 14, my + 3, 6, 1.6, 0, 0, 7); c.fill();
    SK.steam(c, mx + 19, my - 4, t, 1, '#fff', 3);
    const px2 = bx + bw + 14, py2 = by + bh * 0.62;
    if (place === 'cafe') { c.fillStyle = '#f4efe4'; c.beginPath(); c.ellipse(px2 + 26, py2 + 30, 36, 11, 0, 0, 7); c.fill(); c.fillStyle = '#e0c06a'; c.beginPath(); c.moveTo(px2 + 8, py2 + 28); c.quadraticCurveTo(px2 + 26, py2 + 4, px2 + 46, py2 + 28); c.quadraticCurveTo(px2 + 26, py2 + 22, px2 + 8, py2 + 28); c.fill(); c.strokeStyle = 'rgba(120,70,20,.5)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(px2 + 16 + i * 8, py2 + 25); c.lineTo(px2 + 18 + i * 8, py2 + 15); c.stroke(); } }
    else if (place === 'books' || place === 'home') { [['#7a2a3a', 0], ['#2a5a7a', 1], ['#c9a24a', 2]].forEach(b => { c.fillStyle = b[0]; rr(c, px2 + 4 - b[1] * 3, py2 + 36 - b[1] * 11, 62, 11, 2); c.fill(); c.fillStyle = '#efe6d0'; c.fillRect(px2 + 6 - b[1] * 3, py2 + 38 - b[1] * 11, 58, 6); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px2 + 4 - b[1] * 3, py2 + 36 - b[1] * 11, 62, 1.6); }); }
    SK.motes(c, t, w * 0.3, 0, w * 0.95, h * 0.8, 36, 9, '#ffe9b8', 0.7);
  }
};
