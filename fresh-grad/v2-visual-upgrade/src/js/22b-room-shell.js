// the room shell: walls, doors, windows, light (v2)
// The whole static room (floor, walls, fixtures, furniture) is painted once into LAYER. Window glass and the door glass
// are punched out of that layer and filled live with the sky, so a room follows the time of day without a repaint.
// Light that moves or depends on the hour (sun pools, door spill, dust, lamp pools) is drawn live and kept cheap.
const ROOM_STYLE = {};
const ROOMCTX = { d: null, st: null, sc: false };
/* defaults for every room, so a new room still looks designed */
function roomStyle(d) {
  const st = ROOM_STYLE[d.id] || (ROOM_STYLE[d.id] = {});
  if (st._ready) return st;
  st._ready = true;
  st.wall = Object.assign({ kind: 'plaster', wains: 'panel', crown: true, rail: true }, st.wall || {});
  st.win = Object.assign({ frame: shade(d.trim || '#a69f8f', -0.25), treat: 'none', tcol: '#b04a3a' }, st.win || {});
  st.night = st.night || [150, 136, 160];
  return st;
}
/* the cache is repainted whenever something visible about the room changes (a purchase, a new day) */
const ROOM_SIG = {};
function roomSig(d) {
  let s = d.id + (typeof S !== 'undefined' && S ? ':' + S.day : '');
  for (let i = 0; i < d.furn.length; i++) { const f = d.furn[i]; if (f.when) s += f.when() ? '1' : '0'; if (f.c) s += f.c.charAt(1) + f.c.charAt(4); }
  const fn = ROOM_SIG[d.id]; if (fn) s += fn(d);
  return s;
}
/* run a painter and keep the lights, glows and windows it registers, so they can be replayed every frame */
function captureStatic(fn) {
  const sv = { g: FX.glows, l: FX.lights, e: FX.emit, w: FX.wins, nf: FX.nf };
  const rec = { glows: [], lights: [], emit: [], wins: [] };
  FX.glows = rec.glows; FX.lights = rec.lights; FX.emit = rec.emit; FX.wins = rec.wins; FX.nf = 1;
  try { fn(); } finally { FX.glows = sv.g; FX.lights = sv.l; FX.emit = sv.e; FX.wins = sv.w; FX.nf = sv.nf; }
  return rec;
}
function replayLights(rec) {
  if (!rec || FX.nf <= 0.05) return;
  const G = FX.glows, L = FX.lights, E = FX.emit;
  for (let i = 0; i < rec.glows.length; i++) G.push(rec.glows[i]);
  for (let i = 0; i < rec.lights.length; i++) L.push(rec.lights[i]);
  for (let i = 0; i < rec.emit.length; i++) E.push(rec.emit[i]);
}

/* ---------- back wall ---------- */
function wainscot(c, W, y0, y1, kind, col, st) {
  const h = y1 - y0;
  c.fillStyle = col; c.fillRect(0, y0, W, h);
  if (kind === 'panel') {
    for (let x = 34; x < W - 34; x += 60) {
      const pw = Math.min(60, W - 34 - x);
      c.fillStyle = shade(col, 0.05); c.fillRect(x + 5, y0 + 3, pw - 10, h - 6);
      c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + 5, y0 + 3, pw - 10, 1.2); c.fillRect(x + 5, y0 + 3, 1.2, h - 6);
      c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 5, y0 + h - 4.2, pw - 10, 1.2); c.fillRect(x + pw - 6.2, y0 + 3, 1.2, h - 6);
    }
  } else if (kind === 'bead') {
    for (let x = 0; x < W; x += 6) { c.fillStyle = 'rgba(' + IM.INK + ',.16)'; c.fillRect(x, y0, 1, h); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 1, y0, 1, h); }
  } else if (kind === 'tile') {
    IM.pat(c, 'iw_tilewall', 0, y0, W, h, 1);
  } else if (kind === 'brick') {
    IM.pat(c, 'brick', 0, y0, W, h, 1);
  } else if (kind === 'marble') {
    const r = IM.rng(5, 5, 5);
    for (let x = 34; x < W - 34; x += 90) {
      c.fillStyle = IM.grad(c, x, y0, x + 90, y1, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(0,0,0,.06)']]); c.fillRect(x, y0, 90, h);
      c.strokeStyle = 'rgba(110,96,76,.22)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + r() * 90, y0); c.bezierCurveTo(x + r() * 90, y0 + h * 0.3, x + r() * 90, y0 + h * 0.7, x + r() * 90, y1); c.stroke();
      c.fillStyle = 'rgba(90,76,56,.3)'; c.fillRect(x, y0, 1.2, h);
    }
  } else if (kind === 'velvet') {
    IM.pat(c, 'iw_nap', 0, y0, W, h, 1); IM.pat(c, 'iw_diamond', 0, y0, W, h, 1);
  } else if (kind === 'metal') {
    IM.pat(c, 'panel', 0, y0, W, h, 1); IM.brushed(c, 0, y0, W, h, 0.8);
  }
  if (kind !== 'tile' && kind !== 'brick') IM.pat(c, 'iw_plaster', 0, y0, W, h, 0.6);
}
function paintBackWall(c, d, st) {
  const W = d.w, wc = d.wallCol, wl = st.wall, TWH = TW;
  // paint, lighter toward the middle of the wall and darker up under the ceiling
  c.fillStyle = IM.grad(c, 0, 0, 0, TWH, [[0, shade(wc, -0.06)], [0.3, shade(wc, 0.1)], [0.72, shade(wc, 0.03)], [1, shade(wc, -0.04)]]);
  c.fillRect(0, 0, W, TWH);
  if (wl.kind === 'tile') { c.fillStyle = wl.col || shade(wc, 0.08); c.fillRect(0, 0, W, 54); IM.pat(c, 'iw_tilewall', 0, 0, W, 54, 1); }
  else if (wl.kind === 'brick') { c.fillStyle = wl.col || shade(wc, -0.1); c.fillRect(0, 0, W, 54); IM.pat(c, 'brick', 0, 0, W, 54, 1); }
  else if (wl.kind === 'velvet') { c.fillStyle = wl.col || shade(wc, -0.05); c.fillRect(0, 0, W, 54); IM.pat(c, 'iw_nap', 0, 0, W, 54, 1); IM.pat(c, 'iw_diamond', 0, 0, W, 54, 1); }
  else if (wl.kind === 'metal') { c.fillStyle = wl.col || shade(wc, -0.03); c.fillRect(0, 0, W, 54); IM.pat(c, 'panel', 0, 0, W, 54, 1); IM.brushed(c, 0, 0, W, 54, 0.6); }
  else IM.pat(c, 'iw_plaster', 0, 0, W, 54, 1);
  if (wl.stripe) { c.fillStyle = IM.rgba(wl.stripe, 0.13); for (let x = 34; x < W - 34; x += 20) c.fillRect(x, 8, 8, 44); }
  // crown moulding and the shadow it throws
  if (wl.crown) {
    c.fillStyle = shade(wc, 0.22); c.fillRect(0, 0, W, 7);
    c.fillStyle = IM.grad(c, 0, 0, 0, 7, [[0, 'rgba(255,255,255,.35)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(' + IM.INK + ',.2)']]); c.fillRect(0, 0, W, 7);
    c.fillStyle = IM.grad(c, 0, 7, 0, 22, [[0, 'rgba(' + IM.INK + ',.26)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(0, 7, W, 15);
  } else { c.fillStyle = IM.grad(c, 0, 0, 0, 16, [[0, 'rgba(' + IM.INK + ',.24)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(0, 0, W, 16); }
  // chair rail
  const wcol = wl.wcol || shade(wc, -0.07);
  if (wl.wains !== 'none') {
    if (wl.rail) {
      c.fillStyle = IM.grad(c, 0, 49, 0, 55, [[0, shade(d.trim, 0.2)], [1, shade(d.trim, -0.05)]]); c.fillRect(0, 49, W, 5);
      c.fillStyle = 'rgba(255,255,255,.42)'; c.fillRect(0, 49, W, 1.2);
      c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(0, 54, W, 1.4);
      c.fillStyle = IM.grad(c, 0, 49, 0, 36, [[0, 'rgba(' + IM.INK + ',.0)'], [1, 'rgba(' + IM.INK + ',0)']]);
    }
    wainscot(c, W, 55.4, 72, wl.wains, wcol, st);
    // the rail shades the panelling just below it
    c.fillStyle = IM.grad(c, 0, 55, 0, 63, [[0, 'rgba(' + IM.INK + ',.2)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(0, 55, W, 8);
  }
  // baseboard with depth
  c.fillStyle = IM.grad(c, 0, 72, 0, 84, [[0, shade(d.trim, 0.12)], [0.5, d.trim], [1, shade(d.trim, -0.2)]]); c.fillRect(0, 72, W, 12);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(0, 72, W, 1.3);
  c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(0, 74.2, W, 1);
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(0, 82.6, W, 1.4);
  // wall furniture: sockets and a switch, scuffs near the floor
  const r = IM.rng(d.w, d.h, 61);
  for (let i = 0; i < 4; i++) {
    const x = 60 + r() * (W - 140), y = 62 + r() * 3;
    c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x + 0.8, y + 1, 7, 10);
    c.fillStyle = '#ece6d8'; rr(c, x, y, 7, 10, 1.3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x, y, 7, 1);
    c.fillStyle = '#6b655a'; c.fillRect(x + 2.2, y + 2.4, 0.9, 2.2); c.fillRect(x + 4, y + 2.4, 0.9, 2.2); c.fillRect(x + 2.2, y + 6, 0.9, 2.2); c.fillRect(x + 4, y + 6, 0.9, 2.2);
  }
  for (let i = 0; i < 7; i++) { const x = 40 + r() * (W - 80); c.fillStyle = 'rgba(' + IM.INK + ',' + (0.04 + r() * 0.05).toFixed(3) + ')'; c.beginPath(); c.ellipse(x, 79 + r() * 3, 5 + r() * 9, 1.4 + r(), 0, 0, 7); c.fill(); }
  // corners turn dark where two walls meet
  c.fillStyle = IM.grad(c, 34, 0, 100, 0, [[0, 'rgba(' + IM.INK + ',.16)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(34, 0, 66, TWH);
  c.fillStyle = IM.grad(c, W - 34, 0, W - 100, 0, [[0, 'rgba(' + IM.INK + ',.16)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(W - 100, 0, 66, TWH);
}
/* side walls and the front wall are seen from above, with a baseboard strip on the room side */
function paintShellEdges(c, d, st) {
  const W = d.w, H = d.h, wc = d.wallCol, top = shade(wc, -0.2);
  c.fillStyle = top; c.fillRect(0, 0, 34, H); c.fillRect(W - 34, 0, 34, H);
  c.fillStyle = IM.grad(c, 0, 0, 34, 0, [[0, shade(wc, -0.3)], [0.6, top], [1, shade(wc, -0.14)]]); c.fillRect(0, 0, 34, H);
  c.fillStyle = IM.grad(c, W - 34, 0, W, 0, [[0, shade(wc, -0.14)], [0.4, top], [1, shade(wc, -0.3)]]); c.fillRect(W - 34, 0, 34, H);
  IM.pat(c, 'iw_plaster', 0, 0, 34, H, 0.9); IM.pat(c, 'iw_plaster', W - 34, 0, 34, H, 0.9);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(0, 0, 3, H); c.fillRect(W - 34, 0, 3, H);
  c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(30, 0, 1.2, H); c.fillRect(W - 34, 0, 1.2, H);
  // inner baseboard strips
  const strip = (x, w) => {
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, shade(d.trim, 0.1)], [1, shade(d.trim, -0.18)]]); c.fillRect(x, TW, w, H - TW);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, TW, w, 1);
  };
  strip(30, 5); strip(W - 35, 5);
  // wall shadow on the floor
  c.fillStyle = IM.grad(c, 35, 0, 58, 0, [[0, 'rgba(' + IM.INK + ',.3)'], [0.4, 'rgba(' + IM.INK + ',.1)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(35, TW, 23, H - TW - 42);
  c.fillStyle = IM.grad(c, W - 35, 0, W - 58, 0, [[0, 'rgba(' + IM.INK + ',.3)'], [0.4, 'rgba(' + IM.INK + ',.1)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(W - 58, TW, 23, H - TW - 42);
  // front wall
  c.fillStyle = IM.grad(c, 0, H - 42, 0, H, [[0, shade(wc, -0.26)], [1, shade(wc, -0.36)]]); c.fillRect(0, H - 42, W, 42);
  IM.pat(c, 'iw_plaster', 0, H - 42, W, 42, 0.9);
  c.fillStyle = IM.grad(c, 0, H - 52, 0, H - 41, [[0, 'rgba(' + IM.INK + ',0)'], [1, 'rgba(' + IM.INK + ',.28)']]); c.fillRect(34, H - 52, W - 68, 11);
  c.fillStyle = IM.grad(c, 0, H - 46, 0, H - 41, [[0, shade(d.trim, 0.12)], [1, shade(d.trim, -0.2)]]); c.fillRect(34, H - 46, W - 68, 5);
  c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(34, H - 46, W - 68, 1.2);
}
/* the glass of the front door shows the street live; this paints the frame, push bars and a threshold */
function paintExitDoor(c, d, st) {
  const ex = d.exit.x, H = d.h;
  IM.shadow(c, ex - 50, H - 48, 100, 48, 4, 8, 0.4, 0, -3);
  c.fillStyle = IM.grad(c, ex - 50, 0, ex + 50, 0, [[0, '#5a3d2b'], [0.5, '#6a4934'], [1, '#43291b']]); rr(c, ex - 50, H - 48, 100, 48, 4); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(ex - 49, H - 47.5, 98, 1.2);
  // glass is punched out here and filled live with the street
  FX.wins.push(ex - 43, H - 41, 39, 35, 1); FX.wins.push(ex + 4, H - 41, 39, 35, 1);
  c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(ex - 43, H - 41, 39, 35); c.fillRect(ex + 4, H - 41, 39, 35); c.restore();
  [ex - 43, ex + 4].forEach(gx => {
    c.fillStyle = 'rgba(' + IM.INK + ',.45)'; c.fillRect(gx - 1.2, H - 42.2, 41.4, 2.4); c.fillRect(gx - 1.2, H - 42.2, 2.4, 37.4);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(gx + 38, H - 41, 1.2, 35);
    IM.glints(c, gx, H - 41, 39, 35, 0.2);
  });
  // kick plates, bars, brass pulls
  c.fillStyle = IM.grad(c, ex - 50, 0, ex + 50, 0, [[0, '#8a6a3a'], [0.5, '#c9a45c'], [1, '#7a5a2e']]);
  c.fillRect(ex - 43, H - 5, 39, 4); c.fillRect(ex + 4, H - 5, 39, 4);
  c.fillStyle = '#e9d9a2'; rr(c, ex - 9, H - 29, 3.2, 14, 1.4); c.fill(); rr(c, ex + 5.8, H - 29, 3.2, 14, 1.4); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(ex - 8.4, H - 28, 0.9, 11); c.fillRect(ex + 6.4, H - 28, 0.9, 11);
  c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(ex - 0.8, H - 41, 1.6, 36);
  // threshold plate and the lit EXIT sign
  c.fillStyle = IM.grad(c, 0, H - 48, 0, H - 44, [[0, '#d2c7a8'], [1, '#9c9276']]); c.fillRect(ex - 56, H - 49.5, 112, 2.6);
  IM.shadow(c, ex - 31, H - 68, 62, 20, 4, 5, 0.3, 1, 2);
  c.fillStyle = '#241719'; rr(c, ex - 32, H - 69, 64, 20, 4); c.fill();
  c.fillStyle = IM.grad(c, 0, H - 69, 0, H - 49, [[0, 'rgba(255,255,255,.16)'], [0.5, 'rgba(255,255,255,0)']]); rr(c, ex - 32, H - 69, 64, 20, 4); c.fill();
  c.strokeStyle = 'rgba(255,214,150,.38)'; c.lineWidth = 1; rr(c, ex - 29, H - 66, 58, 14, 2.5); c.stroke();
  c.save(); c.shadowColor = 'rgba(255,60,50,.8)'; c.shadowBlur = 6 * (c.getTransform ? c.getTransform().a : 1); signText(c, 'EXIT', ex, H - 58.5, 10, '#ff6a58'); c.restore();
  signText(c, 'EXIT', ex, H - 58.5, 10, '#ffb0a0');
  addEmit(ex, H - 58.5, 36, 2, 0.45);
}
/* ---------- walls that divide a room ---------- */
function wallBlock(c, r, d) {
  const [x, y, w, h] = r, st = roomStyle(d), wc = d.wallCol;
  IM.shadow(c, x, y, w, h, 2, 9, 0.4, 3, 6);
  const fh = Math.min(16, h * 0.3);
  c.fillStyle = shade(wc, 0.02); c.fillRect(x, y, w, h);
  c.fillStyle = IM.grad(c, x, y, x + w, y, [[0, shade(wc, 0.14)], [1, shade(wc, -0.02)]]); c.fillRect(x, y, w, h - fh);
  IM.pat(c, 'iw_plaster', x, y, w, h, 0.9);
  c.fillStyle = 'rgba(255,255,255,.36)'; c.fillRect(x, y, w, Math.min(2.4, h)); c.fillRect(x, y, 1.6, h);   // lit cap edge
  // the south end of the wall is its front face: paint, a rail and a baseboard
  c.fillStyle = IM.grad(c, 0, y + h - fh, 0, y + h, [[0, shade(wc, -0.1)], [1, shade(wc, -0.22)]]); c.fillRect(x, y + h - fh, w, fh);
  c.fillStyle = 'rgba(255,255,255,.24)'; c.fillRect(x, y + h - fh, w, 1.2);
  c.fillStyle = IM.grad(c, 0, y + h - 5, 0, y + h, [[0, shade(d.trim, 0.1)], [1, shade(d.trim, -0.25)]]); c.fillRect(x, y + h - 5, w, 5);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + w - 2.6, y, 2.6, h);
  c.fillStyle = 'rgba(' + IM.INK + ',.1)'; c.fillRect(x, y + h - fh, w, 0.9);
}

/* ---------- windows: the frame is static, the glass is live ---------- */
function winTop(c, x, w) {
  const st = ROOMCTX.st || { win: { frame: '#6f5f4a', treat: 'none', tcol: '#b04a3a' } }, wn = st.win, fr = wn.frame;
  // the recess in the wall: shadow along the top and the left jamb
  IM.shadow(c, x - 6, 14, w + 12, 56, 3, 6, 0.42, 1, 3);
  c.fillStyle = fr; rr(c, x - 6, 13, w + 12, 57, 3); c.fill();
  c.fillStyle = IM.grad(c, x - 6, 0, x + w + 6, 0, [[0, shade(fr, 0.18)], [0.5, fr], [1, shade(fr, -0.2)]]); rr(c, x - 6, 13, w + 12, 57, 3); c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x - 5, 13.5, w + 10, 1.2);
  FX.wins.push(x, 20, w, 44, 0);
  c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(x, 20, w, 44); c.restore();
  // inner reveal: the glass sits back in the wall
  c.fillStyle = IM.grad(c, 0, 20, 0, 30, [[0, 'rgba(' + IM.INK + ',.55)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(x, 20, w, 10);
  c.fillStyle = IM.grad(c, x, 0, x + 8, 0, [[0, 'rgba(' + IM.INK + ',.4)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(x, 20, 8, 44);
  IM.glints(c, x, 20, w, 44, 0.2);
  // mullions
  c.fillStyle = fr; c.fillRect(x + w / 2 - 1.8, 20, 3.6, 44); c.fillRect(x, 40.6, w, 2.6);
  c.fillStyle = 'rgba(255,255,255,.26)'; c.fillRect(x + w / 2 - 1.8, 20, 1, 44); c.fillRect(x, 40.6, w, 0.9);
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + w / 2 + 1.2, 20, 0.8, 44); c.fillRect(x, 42.6, w, 0.8);
  // sill: a stone slab with a lit edge and a shadow on the wall below
  IM.shadow(c, x - 9, 66, w + 18, 6, 2, 4, 0.4, 0, 3);
  c.fillStyle = IM.grad(c, 0, 65, 0, 72, [[0, '#f0e8d8'], [1, '#c9bfa8']]); rr(c, x - 9, 65, w + 18, 6.4, 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 8, 65, w + 16, 1);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x - 8, 70, w + 16, 1.2);
  // window dressing
  const tr = wn.treat;
  if (tr === 'curtain') {
    const cw = Math.max(12, w * 0.2), col = wn.tcol;
    [[x - 8, cw], [x + w - cw + 8, cw]].forEach((p, i) => {
      IM.shadow(c, p[0], 10, p[1], 58, 3, 5, 0.3, i ? -1 : 1, 2);
      c.fillStyle = IM.grad(c, p[0], 0, p[0] + p[1], 0, [[0, shade(col, i ? -0.1 : 0.1)], [1, shade(col, i ? 0.1 : -0.1)]]); c.beginPath(); c.moveTo(p[0], 10); c.lineTo(p[0] + p[1], 10); c.lineTo(p[0] + p[1] + (i ? -2 : 2), 62); c.lineTo(p[0] + (i ? 4 : -2), 66); c.closePath(); c.fill();
      for (let k = 1; k < 4; k++) { c.fillStyle = k % 2 ? 'rgba(255,255,255,.14)' : 'rgba(' + IM.INK + ',.2)'; c.fillRect(p[0] + k * p[1] / 4 - 1, 11, 1.8, 52); }
      IM.weave(c, p[0], 10, p[1], 56, 0.6);
    });
    c.fillStyle = IM.grad(c, 0, 8, 0, 13, [[0, '#c9a45c'], [1, '#7a5a2e']]); c.fillRect(x - 12, 8, w + 24, 3.4); c.fillStyle = '#e9d9a2'; c.beginPath(); c.arc(x - 12, 9.7, 2.2, 0, 7); c.arc(x + w + 12, 9.7, 2.2, 0, 7); c.fill();
  } else if (tr === 'blind') {
    c.save(); c.beginPath(); c.rect(x, 20, w, 18); c.clip();
    for (let yy = 20; yy < 38; yy += 3.6) { c.fillStyle = IM.grad(c, 0, yy, 0, yy + 3.4, [[0, '#f3eee2'], [1, '#c5bca6']]); c.fillRect(x, yy, w, 3); c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x, yy + 3, w, 0.8); }
    c.restore(); c.fillStyle = '#e8e0cc'; c.fillRect(x - 2, 18, w + 4, 3);
  } else if (tr === 'valance') {
    const col = wn.tcol, n = Math.max(3, Math.round(w / 18)), sw = w / n;
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? shade(col, 0.15) : col; c.beginPath(); c.moveTo(x + i * sw, 16); c.lineTo(x + (i + 1) * sw, 16); c.lineTo(x + (i + 1) * sw, 25); c.arc(x + (i + 0.5) * sw, 25, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x, 16, w, 2); c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x, 24, w, 1.5);
  } else if (tr === 'awning') {
    const col = wn.tcol, n = Math.max(4, Math.round(w / 16)), sw = (w + 10) / n;
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#f6f1e7' : col; c.beginPath(); c.moveTo(x - 5 + i * sw, 14); c.lineTo(x - 5 + (i + 1) * sw, 14); c.lineTo(x - 5 + (i + 1) * sw, 26); c.arc(x - 5 + (i + 0.5) * sw, 26, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(' + IM.INK + ',.18)'; c.fillRect(x - 5, 22, w + 10, 5); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 5, 14, w + 10, 2);
  }
}
/* live window view: sky, sun or moon, far rooftops (moving a little with the camera) and weather */
function drawWindowViews(c, rec) {
  const A = FX.A; if (!rec || !A) return;
  const W = rec.wins, tm = REDUCED ? 0 : FX.time;
  for (let i = 0; i < W.length; i += 5) {
    const x = W[i], y = W[i + 1], w = W[i + 2], h = W[i + 3], kind = W[i + 4];
    if (kind === 1) {   // the street seen through the door glass
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, FX.glassA); g.addColorStop(1, FX.glassB); c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(' + IM.INK + ',' + (0.18 + 0.3 * FX.nf).toFixed(3) + ')'; c.fillRect(x, y + h * 0.62, w, h * 0.38);
      continue;
    }
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const hs = h / 44;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgbS(A.top)); g.addColorStop(1, rgbS(A.bot)); c.fillStyle = g; c.fillRect(x, y, w, h);
    const cx = x + w / 2, par = clamp((cx - CAM.x - CAM.vw / 2) * 0.05, -8, 8);
    if (A.star > 0.25) { c.fillStyle = 'rgba(255,255,255,' + (0.85 * A.star).toFixed(3) + ')'; for (let k = 0; k < 7; k++) c.fillRect(x + 4 + hash01(k, Math.round(x), 1) * (w - 8), y + 3 + hash01(k, Math.round(x), 2) * 22 * hs, 1.3, 1.3); }
    if (A.sunUp && A.nf < 0.8) { const sx = x + w * (0.5 + A.sunX * 0.34), sy = y + h * 0.5 - A.el * h * 0.35; c.globalAlpha = 0.6 * (1 - A.cloud * 0.8); c.drawImage(GLOW[A.warm > 0.4 ? 5 : 0], sx - 26 * hs, sy - 26 * hs, 52 * hs, 52 * hs); c.globalAlpha = 1; }
    else if (A.mf >= 0) { const mx = x + w * (0.8 - A.mf * 0.6), my = y + 10 * hs + Math.sin(Math.PI * A.mf) * 4; c.globalAlpha = 0.8 * (1 - A.cloud * 0.7); c.fillStyle = '#eef2ff'; c.beginPath(); c.arc(mx, my, 4.2 * Math.max(0.7, hs), 0, 7); c.fill(); c.globalAlpha = 1; }
    if (A.cloud > 0.05 || A.nf < 0.4) { c.globalAlpha = 0.55 + A.cloud * 0.3; c.fillStyle = rgbS(mix3([255, 255, 255], A.bot, 0.3 + 0.3 * A.warm)); for (let k = 0; k < 2; k++) { const px = x + ((k * 53 + tm * (1.4 + k * 0.6)) % (w + 40)) - 20; c.beginPath(); c.ellipse(px, y + (10 + k * 9) * hs, 14, 3.4 * hs, 0, 0, 7); c.ellipse(px + 7, y + (8 + k * 9) * hs, 9, 3.4 * hs, 0, 0, 7); c.fill(); } c.globalAlpha = 1; }
    // rooftops across the street, two depths
    const lit = A.nf > 0.25;
    for (let layer = 0; layer < 2; layer++) {
      c.fillStyle = rgbS(mix3(A.bot, layer ? [88, 104, 132] : [118, 134, 160], 0.62 - layer * 0.1)).replace('rgb', 'rgb');
      const nb = 5; for (let k = 0; k < nb; k++) { const bw = w / nb * 1.15, bh = ((layer ? 8 : 14) + hash01(k, Math.round(x), 3 + layer) * (layer ? 12 : 16)) * hs, bx = x + k * (w / nb) - 3 + par * (layer ? 0.5 : 1);
        c.fillRect(bx, y + h - bh, bw, bh + 1);
        if (lit && layer === 0) { c.fillStyle = 'rgba(255,214,140,.8)'; for (let q = 0; q < 3; q++) if (hash01(k, q, Math.round(x)) > 0.45) c.fillRect(bx + 3 + q * 6, y + h - bh + 4 + (q % 2) * 5, 2.4, 3); c.fillStyle = rgbS(mix3(A.bot, [118, 134, 160], 0.62)); }
      }
    }
    if (A.rain > 0.1) { c.strokeStyle = 'rgba(220,235,255,.55)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 8; k++) { const rx = x + ((k * 13 + tm * 60) % w), ry = y + ((k * 9 + tm * 120) % h); c.moveTo(rx, ry); c.lineTo(rx - 2, ry + 7); } c.stroke(); }
    if (A.snow > 0.1) { c.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 10; k++) { const sx = x + ((k * 17 + tm * 10 + Math.sin(tm + k) * 3) % w), sy = y + ((k * 11 + tm * 22) % h); c.fillRect(sx, sy, 1.6, 1.6); } }
    if (A.fog > 0.05) { c.fillStyle = 'rgba(225,232,240,' + (0.5 * A.fog).toFixed(3) + ')'; c.fillRect(x, y, w, h); }
    c.restore();
  }
}
/* ---------- live light: sun pools on the floor, door spill, drifting dust ---------- */
/* sun (or moon) pools falling from each sky window onto the floor below its wall, broken up by the mullion */
function sunPools(c, W, baseY) {
  const A = FX.A; if (!A) return;
  const tm = REDUCED ? 0 : FX.time;
  const day = A.sh * (1 - A.cloud * 0.5), a = day > 0.04 ? 0.3 * day : 0.16 * A.nf * (1 - A.cloud);
  if (a <= 0.01) return;
  const dx = -A.sunX * 90, len = 150 + (1 - A.el) * 110, col = day > 0.04 ? (A.warm > 0.4 ? '255,206,140' : '255,240,208') : '150,180,255';
  for (let i = 0; i < W.length; i += 5) {
    if (W[i + 4] !== 0) continue;
    const wx = W[i], ww = W[i + 2], hw = ww / 2 - 2;
    for (let pass = 0; pass < 2; pass++) {
      const grow = pass ? 0 : 7, al = pass ? a : a * 0.4;
      const g = c.createLinearGradient(0, baseY, 0, baseY + len); g.addColorStop(0, 'rgba(' + col + ',' + (al * 0.5).toFixed(3) + ')'); g.addColorStop(0.1, 'rgba(' + col + ',' + al.toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(' + col + ',' + (al * 0.5).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = g;
      [[wx, hw], [wx + ww / 2 + 2, hw]].forEach(p => {
        c.beginPath(); c.moveTo(p[0] - grow * 0.4, baseY); c.lineTo(p[0] + p[1] + grow * 0.4, baseY); c.lineTo(p[0] + p[1] + dx + 22 + grow, baseY + len); c.lineTo(p[0] + dx - 22 - grow, baseY + len); c.closePath(); c.fill();
      });
    }
    if (day > 0.05 && !REDUCED) {   // dust motes turning in the beam
      c.fillStyle = 'rgba(255,248,226,' + (0.5 * day).toFixed(3) + ')';
      for (let k = 0; k < 6; k++) {
        const t = (tm * (0.03 + k * 0.007) + hash01(k, Math.round(wx), 9)) % 1, px = wx + hash01(k, Math.round(wx), 4) * ww + dx * t * 0.8 + Math.sin(tm * 0.5 + k * 2) * 5, py = baseY + 10 + t * len * 0.8;
        c.globalAlpha = Math.sin(t * Math.PI) * 0.9; c.fillRect(px, py, 1.5, 1.5);
      }
      c.globalAlpha = 1;
    }
  }
}
function drawRoomLight(c, d, rec) {
  const A = FX.A; if (!A) return;
  c.save(); c.beginPath(); c.rect(35, TW, d.w - 70, d.h - TW - 46); c.clip();
  c.globalCompositeOperation = 'screen';
  sunPools(c, rec.wins, TW);
  // daylight (or the night street) spilling in at the front door
  if (A.nf < 0.6) {
    const ex = d.exit.x, H = d.h, dg = c.createLinearGradient(0, H - 46, 0, H - 150); dg.addColorStop(0, 'rgba(255,244,214,' + (0.34 * (1 - A.nf) * (1 - A.cloud * 0.4)).toFixed(3) + ')'); dg.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = dg; c.beginPath(); c.moveTo(ex - 44, H - 46); c.lineTo(ex + 44, H - 46); c.lineTo(ex + 86, H - 150); c.lineTo(ex - 86, H - 150); c.closePath(); c.fill();
  }
  c.restore();
}
/* the last touch on the static layer: darker corners where walls meet the floor */
function paintRoomGrade(c, d) {
  const W = d.w, H = d.h, x0 = 35, x1 = W - 35, y0 = TW, y1 = H - 46;
  const corner = (cx, cy, r, a) => { const g = c.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(' + IM.INK + ',' + a + ')'); g.addColorStop(1, 'rgba(' + IM.INK + ',0)'); c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2); };
  c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
  corner(x0, y0, 150, 0.22); corner(x1, y0, 150, 0.22); corner(x0, y1, 120, 0.18); corner(x1, y1, 120, 0.18);
  c.restore();
}
