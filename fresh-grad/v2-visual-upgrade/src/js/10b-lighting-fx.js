// every sun shadow goes into one path and is filled once, so overlaps never stack up. A wide faint stroke and a tighter one
// give the soft penumbra (it grows with the length of the shadow), and a second, shorter path deepens the contact core.
function shadowPass(c, vis) {
  const sh = FX.sh;
  if (sh.a < 0.02) return;
  const dx = sh.dx, dy = sh.dy, Lg = Math.hypot(dx, dy), shc = FX.shc || [22, 28, 66];
  const cs = Math.round(shc[0]) + ',' + Math.round(shc[1]) + ',' + Math.round(shc[2]);
  c.beginPath();
  for (const b of vis.bld) {
    const base = b.y + b.h - 1, hh = b.h * 0.26, ox = dx * hh, oy = dy * hh;
    c.moveTo(b.x, base); c.lineTo(b.x + b.w, base); c.lineTo(b.x + b.w + ox, base + oy); c.lineTo(b.x + ox, base + oy); c.closePath();
  }
  for (const t of vis.trees) {
    const ex = t.x + dx * 30, ey = t.y + dy * 18;
    c.moveTo(t.x - 3.5, t.y); c.lineTo(t.x + 3.5, t.y); c.lineTo(ex + 3, ey); c.lineTo(ex - 3, ey); c.closePath();
    c.moveTo(ex + t.r * 1.05, ey); c.ellipse(ex, ey, t.r * 1.05, t.r * 0.52, 0, 0, 6.2832);
  }
  for (const p of vis.poles) {
    const ex = p.x + dx * p.h, ey = p.y + dy * p.h * 0.6;
    c.moveTo(p.x - 1.5, p.y); c.lineTo(p.x + 1.5, p.y); c.lineTo(ex + 2.5, ey); c.lineTo(ex - 2.5, ey); c.closePath();
    c.moveTo(ex + 6, ey); c.ellipse(ex, ey, p.h > 55 ? 6.5 : 4, p.h > 55 ? 3.2 : 2.4, 0, 0, 6.2832);
  }
  for (const p of vis.people) {
    // a figure: legs, torso, shoulders and a head, stretched along the sun's direction
    const mx = p.x + dx * 14, my = p.y + dy * 8.5, ex = p.x + dx * 27, ey = p.y + dy * 16.5;
    c.moveTo(p.x - 4, p.y); c.lineTo(p.x + 4, p.y); c.lineTo(mx + 5.8, my); c.lineTo(ex + 2.4, ey); c.lineTo(ex - 2.4, ey); c.lineTo(mx - 5.8, my); c.closePath();
    c.moveTo(ex + dx * 3 + 4.8, ey + dy * 2); c.ellipse(ex + dx * 3, ey + dy * 2, 4.8, 3.3, 0, 0, 6.2832);
  }
  for (const k of vis.cars) {
    const p = carXY(k), hx = k.lane.ax === 'x' ? k.len / 2 : 13, hy = k.lane.ax === 'x' ? 6 : (k.len - 8) / 2;
    c.rect(p.x - hx + dx * 12, p.y - hy + 6 + dy * 7, hx * 2, hy * 2);
  }
  c.lineJoin = 'round';
  c.lineWidth = 3.5 + 4 * Lg; c.strokeStyle = 'rgba(' + cs + ',' + (sh.a * 0.16).toFixed(3) + ')'; c.stroke();
  c.lineWidth = 1.8 + 2 * Lg; c.strokeStyle = 'rgba(' + cs + ',' + (sh.a * 0.3).toFixed(3) + ')'; c.stroke();
  c.lineJoin = 'miter';
  c.fillStyle = 'rgba(' + cs + ',' + sh.a.toFixed(3) + ')'; c.fill();
  // contact cores: shadow is darkest where things touch the ground
  c.beginPath();
  for (const b of vis.bld) {
    const base = b.y + b.h - 1, hh = b.h * 0.26 * 0.34, ox = dx * hh, oy = dy * hh;
    c.moveTo(b.x, base); c.lineTo(b.x + b.w, base); c.lineTo(b.x + b.w + ox, base + oy); c.lineTo(b.x + ox, base + oy); c.closePath();
  }
  for (const t of vis.trees) { c.moveTo(t.x + t.r * 0.46, t.y + 2); c.ellipse(t.x + dx * 4, t.y + 2 + dy * 1.5, t.r * 0.46, t.r * 0.17, 0, 0, 6.2832); }
  c.fillStyle = 'rgba(' + cs + ',' + (sh.a * 0.5).toFixed(3) + ')'; c.fill();
}

/* ---------- light map: the scene is multiplied by ambient light plus every lamp, window and headlight ---------- */
const LM = { cv: document.createElement('canvas'), c: null, q: 4 };
LM.c = LM.cv.getContext('2d');
function lightPass(c, cv, m, opt) {
  const A = FX.A, nf = FX.nf, fixed = !!(opt && opt.amb);
  let amb = fixed ? opt.amb : A.amb;
  // lightning lights the whole street for an instant
  if (!fixed && A.storm > 0.05) {
    // a thunderstorm darkens and cools the street; the flashes light it up again
    const sd = 1 - 0.24 * A.storm;
    amb = [amb[0] * sd * 0.96, amb[1] * sd * 0.98, Math.min(255, amb[2] * (sd + 0.06))];
    if (A.storm > 0.3 && STORM.flash > 0.02) amb = mix3(amb, [205, 214, 255], clamp(STORM.flash * 0.85, 0, 1));
  }
  const need = amb[0] < 251 || amb[1] < 251 || amb[2] < 251;
  if (need) {
    const q = LM.q, lw = Math.ceil(cv.width / q), lh = Math.ceil(cv.height / q), l = LM.c;
    if (LM.cv.width !== lw || LM.cv.height !== lh) { LM.cv.width = lw; LM.cv.height = lh; }
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1;
    l.fillStyle = rgbS(amb); l.fillRect(0, 0, lw, lh);
    const mq = m / q; l.setTransform(mq, 0, 0, mq, -CAM.x * mq, -CAM.y * mq);
    // colour grade: the sunny side of the picture runs warm, the far side cool and a little deeper
    const gk = !fixed ? A.sh * (0.35 + A.warm * 0.65) * (1 - A.nf) * (1 - A.cloud * 0.7) : 0;
    if (gk > 0.04) {
      const sd = A.sunX > 0 ? 1 : -1, g0 = l.createLinearGradient(CAM.x + (sd > 0 ? CAM.vw : 0), 0, CAM.x + (sd > 0 ? 0 : CAM.vw), 0);
      g0.addColorStop(0, 'rgba(255,' + Math.round(lerp(250, 236, A.warm)) + ',' + Math.round(lerp(244, 206, A.warm)) + ',' + clamp(gk, 0, 1).toFixed(3) + ')');
      g0.addColorStop(1, 'rgba(226,236,255,' + clamp(gk * 0.9, 0, 1).toFixed(3) + ')');
      l.globalCompositeOperation = 'multiply'; l.fillStyle = g0; l.fillRect(CAM.x - 4, CAM.y - 4, CAM.vw + 8, CAM.vh + 8); l.globalCompositeOperation = 'source-over';
    }
    if (opt && opt.sky && CAM.y < TOP_Y) {
      // the sky is already painted in its night colours, so leave it alone
      l.fillStyle = '#fff'; l.fillRect(CAM.x - 20, CAM.y - 20, CAM.vw + 40, TOP_Y - 46 - CAM.y + 20);
      const sg = l.createLinearGradient(0, TOP_Y - 46, 0, TOP_Y - 2); sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      l.fillStyle = sg; l.fillRect(CAM.x - 20, TOP_Y - 47, CAM.vw + 40, 45);
    }
    l.globalCompositeOperation = 'lighter';
    const G2 = FX.glows, on = Math.min(1, nf * 1.3);
    l.fillStyle = 'rgb(255,238,204)'; l.globalAlpha = on;
    for (let i = 0; i < G2.length; i += 5) l.fillRect(G2[i] - 1, G2[i + 1] - 1, G2[i + 2] + 2, G2[i + 3] + 2);
    for (let i = 0; i < G2.length; i += 5) {
      if (!G2[i + 4]) continue;
      const w = G2[i + 2], cx = G2[i] + w / 2, by = G2[i + 1] + G2[i + 3];
      l.globalAlpha = 0.6 * on; l.drawImage(GLOW[0], cx - w * 0.95, by - 8, w * 1.9, 74);
    }
    const Ls = FX.lights;
    for (let i = 0; i < Ls.length; i += 6) { l.globalAlpha = Math.min(1, Ls[i + 5] * on); l.drawImage(GLOW[Ls[i + 4]], Ls[i] - Ls[i + 2], Ls[i + 1] - Ls[i + 3], Ls[i + 2] * 2, Ls[i + 3] * 2); }
    const Bs = FX.beams;
    l.globalAlpha = 0.9 * on;
    for (let i = 0; i < Bs.length; i += 3) { l.save(); l.translate(Bs[i], Bs[i + 1]); l.rotate(Bs[i + 2]); l.drawImage(BEAM2, 0, -49, 168, 98); l.restore(); }
    l.globalAlpha = 1; l.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.imageSmoothingEnabled = true;
    c.drawImage(LM.cv, 0, 0, lw, lh, 0, 0, lw * q, lh * q);
    c.globalCompositeOperation = 'source-over';
  }
  const E = FX.emit;
  if (E.length) {
    c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m);
    c.globalCompositeOperation = 'lighter';
    const on = Math.min(1, nf * 1.3);
    for (let i = 0; i < E.length; i += 5) { c.globalAlpha = Math.min(1, E[i + 4] * on); c.drawImage(GLOW[E[i + 3]], E[i] - E[i + 2], E[i + 1] - E[i + 2], E[i + 2] * 2, E[i + 2] * 2); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // rooms and the school get their bloom here; the town adds it after the wet reflections (see paintTown)
  if (fixed) atmoGlow(c, cv, m, ATMO_IN, ATMO_NOVIS, false);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/* name tags and speech bubbles sit above the lighting so they stay readable at night */
function runOver(c, m) {
  if (!FX.over.length) return;
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m);
  for (const f of FX.over) f();
  c.setTransform(1, 0, 0, 1, 0, 0);
}
/* the last touches over any scene. The lens vignette and the golden-hour wash are CSS layers over the canvas,
   so they cost the canvas nothing; here we only set how strong they are and draw the scene fade. */
const POST = { vig: -1, warm: -1, side: '', wc: '', q: '', sc: '' };
function finishFrame(c, cv, dt, vig, warm, fromRight) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  let a = vig == null ? 0.24 : vig;
  if (S && S.energy < 20 && !FX.demo) a += (20 - S.energy) / 20 * 0.5;
  a = Math.round(Math.min(1, a) * 50) / 50; warm = Math.round((warm || 0) * 50) / 50;
  const sc = FX.sunc || [255, 170, 90], wc = Math.round(sc[0] / 8) * 8 + ',' + Math.round((sc[1] * 0.92) / 8) * 8 + ',' + Math.round((sc[2] * 0.7) / 8) * 8;
  const qs = QUAL.cap < 0.8 ? 'lo' : 'hi', scn = S && S.scene === 'town' ? 't' : 'i';
  if (!FX.demo && (a !== POST.vig || warm !== POST.warm || (warm > 0 && (fromRight ? 'r' : 'l') !== POST.side) || (warm > 0 && wc !== POST.wc) || qs !== POST.q || scn !== POST.sc)) {
    POST.vig = a; POST.warm = warm; POST.side = fromRight ? 'r' : 'l'; POST.wc = wc; POST.q = qs; POST.sc = scn;
    const st = $('#stage');
    if (st) { st.style.setProperty('--vig', a); st.style.setProperty('--warm', warm); st.style.setProperty('--wc', wc); st.dataset.sun = POST.side; st.dataset.q = qs; st.dataset.sc = scn; }
  }
  if (FX.fade > 0.004) {
    c.fillStyle = 'rgba(9,14,22,' + (FX.fade * FX.fade).toFixed(3) + ')'; c.fillRect(0, 0, cv.width, cv.height);
    FX.fade = Math.max(0, FX.fade - dt * 2.4);
  }
}

/* small living things: leaves, petals, butterflies, birds, steam, fireflies */
function drawLife(c, A, vx0, vy0, vx1, vy1) {
  if (REDUCED) return;
  const tm = FX.time, dayA = clamp(1 - A.nf * 1.6, 0, 1) * (1 - A.rain);
  // leaves and petals drifting off the park trees, tumbling as they turn
  const LSE = season(), NL = LSE === 'winter' ? 0 : LSE === 'autumn' ? 64 : 34;
  for (let i = 0; i < NL; i++) {
    const t = TREES[(i * 7 + 3) % TREES.length], p = (tm * (0.1 + (i % 5) * 0.014) + i * 0.37) % 1;
    const x = t.x + Math.sin(i * 12.9) * 16 + Math.sin(p * 7 + i) * 9 + p * 46 * FX.wind, y = t.y - 52 + p * 54;
    if (x < vx0 - 10 || x > vx1 + 10 || y < vy0 - 10 || y > vy1 + 10) continue;
    const col = LSE === 'autumn' ? ['#d9822b', '#c0502a', '#e7b24a', '#a8432a'][i % 4] : LSE === 'spring' ? (i % 2 ? '#ffc3d4' : '#fffaf2') : i % 3 ? '#8fce6a' : '#e0b84a';
    c.save(); c.translate(x, y); c.rotate(p * 9 + i); c.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p * 8 + i * 1.9)));
    c.globalAlpha = Math.sin(p * Math.PI) * 0.92; c.fillStyle = col;
    c.beginPath();
    if (LSE === 'spring') { c.moveTo(-2.6, 0); c.quadraticCurveTo(-1, -2.6, 2.4, -0.4); c.quadraticCurveTo(2.9, 0.3, 2.2, 0.7); c.quadraticCurveTo(-0.6, 2.4, -2.6, 0); c.fill(); }
    else {
      c.moveTo(-3.8, 0); c.quadraticCurveTo(-0.6, -3, 3.8, 0); c.quadraticCurveTo(-0.6, 3, -3.8, 0); c.fill();
      c.strokeStyle = 'rgba(40,30,10,.38)'; c.lineWidth = 0.45; c.beginPath(); c.moveTo(-3.7, 0); c.lineTo(3.2, 0); c.moveTo(-0.6, 0); c.lineTo(0.8, -1.5); c.moveTo(-0.6, 0); c.lineTo(0.8, 1.5); c.stroke();
    }
    c.restore();
  }
  c.globalAlpha = 1;
  if (dayA > 0.05 && LSE !== 'winter') {
    for (let i = 0; i < 16; i++) {
      const f = FLOWERS[(i * 29 + 5) % FLOWERS.length];
      const x = f.x + Math.sin(tm * 0.6 + i) * 34 + Math.sin(tm * 2.1 + i * 2) * 7, y = f.y - 12 + Math.cos(tm * 0.8 + i * 1.7) * 18;
      if (x < vx0 - 10 || x > vx1 + 10 || y < vy0 - 10 || y > vy1 + 10) continue;
      const fl = Math.abs(Math.sin(tm * 13 + i * 2.3)), wc = ['#ffd166', '#ffffff', '#ff9ec4', '#9ad1ff'][i % 4], ang = Math.sin(tm * 0.6 + i) * 0.5;
      c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = dayA;
      c.fillStyle = wc;
      c.beginPath(); c.ellipse(-2.4 * fl - 0.5, -1.4, 2.8 * fl + 0.4, 2.7, -0.5, 0, 7); c.ellipse(2.4 * fl + 0.5, -1.4, 2.8 * fl + 0.4, 2.7, 0.5, 0, 7); c.fill();
      c.fillStyle = shade(wc, -0.14); c.beginPath(); c.ellipse(-1.9 * fl - 0.4, 1.4, 2 * fl + 0.3, 1.8, 0.4, 0, 7); c.ellipse(1.9 * fl + 0.4, 1.4, 2 * fl + 0.3, 1.8, -0.4, 0, 7); c.fill();
      c.fillStyle = 'rgba(40,24,30,.6)'; c.beginPath(); c.arc(-2.6 * fl, -2, 0.6 * fl + 0.1, 0, 7); c.arc(2.6 * fl, -2, 0.6 * fl + 0.1, 0, 7); c.fill();
      c.fillStyle = '#3a2a20'; c.fillRect(-0.45, -2.6, 0.9, 5.4);
      c.restore();
    }
    // a flock crossing every so often
    const cyc = (tm % 44) / 44;
    if (cyc < 0.42) {
      const p = cyc / 0.42, lap = Math.floor(tm / 44), dir = lap % 2 ? -1 : 1;
      const bx = (dir > 0 ? vx0 - 120 : vx1 + 120) + dir * p * (vx1 - vx0 + 240), by = vy0 + (vy1 - vy0) * (0.22 + hash01(lap, 3, 5) * 0.4) - p * 60;
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < 7; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
        const x = bx - dir * row * 15, y = by + side * row * 9, fl = Math.sin(tm * 9 + i * 0.8) * 3.8;
        c.fillStyle = 'rgba(22,28,66,' + (0.12 * dayA).toFixed(3) + ')'; c.beginPath(); c.ellipse(x + 30, y + 90, 5, 2, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(28,34,50,' + (0.85 * dayA).toFixed(3) + ')'; c.lineWidth = 1.7;
        c.beginPath(); c.moveTo(x - 6.4, y - fl * 0.8); c.bezierCurveTo(x - 4, y - fl - 1.6, x - 1.6, y - 1.4, x, y + 0.6); c.bezierCurveTo(x + 1.6, y - 1.4, x + 4, y - fl - 1.6, x + 6.4, y - fl * 0.8); c.stroke();
        c.fillStyle = 'rgba(28,34,50,' + (0.9 * dayA).toFixed(3) + ')'; c.beginPath(); c.ellipse(x, y + 0.8, 1.9, 1.3, 0, 0, 7); c.fill();
      }
      c.lineCap = 'butt'; c.lineJoin = 'miter';
    }
  }
  c.globalAlpha = 1;
  // steam from the diner's kitchen vent
  const dn = BLD.diner, vxp = dn.x + dn.w - 40, vyp = dn.y - 20;
  if (isOpen('diner') && vxp > vx0 - 60 && vxp < vx1 + 60) {
    for (let i = 0; i < 7; i++) {
      const p = (tm * 0.22 + i / 7) % 1, r = 6 + p * 15;
      c.globalAlpha = 0.5 * (1 - p); c.drawImage(PUFF, vxp + Math.sin(p * 5 + i) * 6 + p * 30 * FX.wind - r, vyp - p * 62 - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
  }
  // fireflies in the park after dark
  if (A.nf > 0.5 && A.rain < 0.1 && LSE !== 'winter') {
    for (let i = 0; i < 46; i++) {
      const bx = 60 + hash01(i, 1, 2) * (WORLD.w - 120), by = PARK_Y + 40 + hash01(i, 3, 4) * 660;
      const x = bx + Math.sin(tm * 0.31 + i * 1.3) * 46 + Math.sin(tm * 0.9 + i) * 10, y = by + Math.cos(tm * 0.27 + i * 2.1) * 28;
      if (x < vx0 - 20 || x > vx1 + 20 || y < vy0 - 20 || y > vy1 + 20) continue;
      const pulse = Math.max(0, Math.sin(tm * 1.9 + i * 2.7));
      if (pulse > 0.08) { FX.emit.push(x, y, 5 + pulse * 5, 5, pulse); c.globalAlpha = pulse; c.fillStyle = '#f4ff9a'; c.beginPath(); c.arc(x, y, 0.9, 0, 7); c.fill(); c.globalAlpha = 1; }
    }
  }
}

/* rain in three depths: faint far streaks, mid streaks and a few long bright ones near the lens, with wind gusts */
function drawWeather(c, cv, A, dpr) {
  const w = cv.width, h = cv.height;
  if (A.rain > 0.02 && !REDUCED) {
    const tm = FX.time, R = A.rain, gust = Math.sin(tm * 0.37) * 0.5 + Math.sin(tm * 0.91 + 2) * 0.25, slant = 0.2 + 0.1 * gust + A.storm * 0.12;
    const T = atmoTier() > 1 ? 1 : 0.6;
    const LY = [[70, 1050, 9, 14, 0.2, 0.8], [84, 1450, 15, 23, 0.34, 1.1], [26, 2050, 27, 42, 0.5, 1.7]];
    for (let li = 0; li < 3; li++) {
      const Ln = LY[li], n = Math.round(Ln[0] * R * T);
      c.strokeStyle = 'rgba(206,224,255,' + (Ln[4] * (0.7 + 0.3 * R)).toFixed(3) + ')'; c.lineWidth = Ln[5] * dpr; c.beginPath();
      for (let i = 0; i < n; i++) {
        const sp = Ln[1] + (i % 7) * 90, len = (Ln[2] + (i % 5) * (Ln[3] - Ln[2]) / 4) * dpr;
        const y = ((i * 71.3 + li * 131 + tm * sp * dpr) % (h + 100)) - 50, x = ((i * 137.7 + li * 57 + tm * slant * sp * dpr) % (w + 260)) - 130;
        c.moveTo(x, y); c.lineTo(x - len * slant, y - len);
      }
      c.stroke();
    }
    c.fillStyle = 'rgba(150,170,200,' + (0.07 * R).toFixed(3) + ')'; c.fillRect(0, 0, w, h);
  }
}

function paintTown(c, cv, sz, k, dt) {
  const A = skyAt(S.t, S.day);
  beginFrame(A);
  const m = sz.dpr * k, vw = CAM.vw, vh = CAM.vh;
  const vx0 = CAM.x, vy0 = CAM.y, vx1 = CAM.x + vw, vy1 = CAM.y + vh;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#6fae6a'; c.fillRect(0, 0, cv.width, cv.height);
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m);
  if (vy0 < TOP_Y + 8) drawSky(c, A, vx0, vx1);
  drawGround(c, m, vx0, vy0, vx1, vy1);
  drawGroundLive(c, FX.time, vx0, vy0, vx1, vy1);
  atmoWetGround(c, A, vx0, vy0, vx1, vy1);
  seasonLive(c, vx0, vy0, vx1, vy1);
  if (!FX.demo) drawTracks(c);

  // gather what is on screen
  const items = [], vis = { bld: [], trees: [], poles: [], people: [], cars: [] };
  for (const b of ALL_BLD) {
    if (!inView(b.x - 110, b.y - 40, b.x + b.w + 110, b.y + b.h + 90)) continue;
    vis.bld.push(b);
    items.push({ y: b.y + b.h, f: () => {
      if (b.kind === 'deco') drawDeco(c, b);
      else if (b.kind === 'apt') drawApartment(c, b);
      else if (b.kind === 'work') drawWork(c, b);
      else if (b.kind === 'shop') drawShop(c, b);
      else if (b.kind === 'diner') drawDiner(c, b);
      else drawClinic(c, b);
      snowRoof(c, b);
    } });
  }
  for (const t of TREES) if (inView(t.x - 80, t.y - 80, t.x + 80, t.y + 40)) { vis.trees.push(t); items.push({ y: t.y, f: () => drawTree(c, t) }); }
  for (const b of BENCHES) if (inView(b.x - 30, b.y - 30, b.x + 30, b.y)) items.push({ y: b.y, f: () => drawBench(c, b) });
  for (const l of LAMPS) if (inView(l.x - 130, l.y - 70, l.x + 130, l.y + 80)) { vis.poles.push({ x: l.x, y: l.y, h: 58 }); items.push({ y: l.y, f: () => drawLamp(c, l) }); }
  for (const s of BUS_STOPS) if (inView(s.x - 80, s.y - 90, s.x + 80, s.y + 40)) items.push({ y: s.y, f: () => drawBusStop(c, s) });
  for (const p of PROPS) if (inView(p.x - 80, p.y - 100, p.x + 80, p.y + 50)) items.push({ y: p.y, f: () => PROP_DRAW[p.t](c, p) });
  parkItems(items, inView, c);
  if (inView(FOUNTAIN.x - 150, FOUNTAIN.y - 110, FOUNTAIN.x + 150, FOUNTAIN.y + 100)) items.push({ y: FOUNTAIN.y + 6, f: () => drawFountain(c, FOUNTAIN, REDUCED ? 0 : FX.time) });
  for (const n of NPCS) if (inView(n.x - 20, n.y - 80, n.x + 20, n.y)) { vis.people.push(n); items.push({ y: n.y, f: () => { drawPerson(c, n.x, n.y, n); if (!FX.demo) drawNpcTag(c, n); } }); }
  for (const car of CARS) { const p = carXY(car); if (inView(p.x - 150, p.y - 150, p.x + 150, p.y + 150)) { vis.cars.push(car); items.push({ y: p.y + 10, f: () => drawCar(c, car) }); } }
  trafficLightItems(c).forEach(it => { if (inView(it.x - 20, it.y - 60, it.x + 20, it.y)) { vis.poles.push({ x: it.x, y: it.y, h: 50 }); items.push(it); } });
  if (!FX.demo) {
    vis.people.push({ x: S.px, y: S.py });
    items.push({ y: S.py, f: () => drawPlayerTown(c) });
    addLight(S.px, S.py - 8, 84, 58, 0, 0.34);
  }

  // drifting cloud shadows, then sun shadows and dappled leaf shade, under everything
  atmoCloudShadows(c, A, vx0, vy0, vx1, vy1);
  shadowPass(c, vis);
  atmoDapple(c, vis, A);

  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.f();

  if (G.target && !FX.demo) drawTargetMarker(c);
  if (!FX.demo) { drawDoorMarkers(c); drawGigMarker(c); drawParticles(c); }
  drawLife(c, A, vx0, vy0, vx1, vy1);
  // fog scatters lamp light into soft halos
  if (A.fog > 0.1 && FX.nf > 0.05) for (const p of vis.poles) { if (p.h === 58) addEmit(p.x, p.y - 57, 62, 0, 0.5 * A.fog); }
  lightPass(c, cv, m, { sky: true });
  atmoWetReflect(c, m, A, vis);
  atmoDrips(c, m, A, vis);
  atmoGlow(c, cv, m, A, vis, true);
  atmoFlare(c, cv, m, A);
  runOver(c, m);
  drawWeather(c, cv, A, sz.dpr);
  drawWeatherPlus(c, cv, A, sz.dpr, dt);
  atmoTilt(c, cv);
  finishFrame(c, cv, dt, 0.5 + A.nf * 0.2, A.sh > 0.04 ? A.warm : 0, A.sunX > 0);
}

function render(dt) {
  const cv = $('#world');
  if (!cv || !S) return;
  if (S.scene !== 'town') TRACKS.length = 0;
  if (S.scene === 'school') { renderSchool(dt); return; }
  if (S.scene === 'int') { renderInterior(dt); return; }
  if (!wctx) wctx = cv.getContext('2d');
  const c = wctx, sz = sizeCanvas(cv);
  if (sz.w < 2 || sz.h < 2) return;
  const k = Math.max(clamp(sz.w / 880, 0.72, 1.7), sz.w / WORLD.w, sz.h / WORLD.h);
  const vw = sz.w / k, vh = sz.h / k;
  const tx = clamp(S.px - vw / 2, 0, Math.max(0, WORLD.w - vw));
  const ty = clamp(S.py - 40 - vh / 2, 0, Math.max(0, WORLD.h - vh));
  if (!CAM.ready) { CAM.x = tx; CAM.y = ty; CAM.ready = true; FX.fade = 1; }
  const f = 1 - Math.exp(-9 * Math.min(dt, 0.05));
  CAM.x = lerp(CAM.x, tx, f); CAM.y = lerp(CAM.y, ty, f); CAM.k = k; CAM.vw = vw; CAM.vh = vh;
  FX.demo = false;
  paintTown(c, cv, sz, k, dt);
  drawMinimap();
}

