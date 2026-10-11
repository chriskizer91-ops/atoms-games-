/* ============================ the cast: figure rig ============================
   One parametric figure draws the Graduate, the Dean and every classmate. Units are "figure px" at scale 1 with the origin at the feet
   (y up is negative): head ~35 tall on a ~154 tall body (about 1 : 4.4). Arms are two-bone IK chains driven by wrist targets, so the same
   rig can wave, clap, shake hands and hold a diploma overhead. Light comes from the upper left (CIN_LIGHT). */
const CIN_LIGHT = [-0.62, -0.78];
const CIN_SH = { x: -20, y: -106 };            // shoulder offset magnitude (x mirrors per side)
const CIN_UP = 29, CIN_FORE = 27.5;               // upper arm / forearm
const CIN_HEAD_Y = -137;                        // head centre

/* --- pure helpers --- */
function cinBlink(ct, seed) {
  // a quick blink every ~3.6 s, offset per person
  const p = ((ct * 0.278) + (seed || 0) * 0.37) % 1, d = Math.abs(p - 0.5) * 2 * 3.6;
  return clamp(1 - Math.max(0, 0.16 - d) / 0.16, 0.12, 1);
}
/* damped pendulum kicks: events = [[time, amplitude], ...] */
function cinSwing(ct, events, w) {
  let a = 0;
  for (let i = 0; i < events.length; i++) { const dt = ct - events[i][0]; if (dt > 0 && dt < 3.5) a += events[i][1] * Math.exp(-dt * 2.1) * Math.sin(dt * (w || 8.5)); }
  return a;
}
/* two-bone IK: elbow position for shoulder S, wrist target T. side = -1 (screen left) or +1 */
function cinIK(sx, sy, tx, ty, side) {
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
  const reach = CIN_UP + CIN_FORE - 0.6;
  if (d > reach) { dx *= reach / d; dy *= reach / d; tx = sx + dx; ty = sy + dy; d = reach; }
  if (d < 6) d = 6;
  const a = (CIN_UP * CIN_UP - CIN_FORE * CIN_FORE + d * d) / (2 * d), h = Math.sqrt(Math.max(0, CIN_UP * CIN_UP - a * a));
  const ux = dx / d, uy = dy / d, bx = sx + ux * a, by = sy + uy * a;
  const e1 = [bx - uy * h, by + ux * h], e2 = [bx + uy * h, by - ux * h];
  const sc = e => e[1] * 0.6 + side * e[0] * 0.4;      // prefer lower and outward
  return { e: sc(e1) > sc(e2) ? e1 : e2, w: [tx, ty] };
}
function cinCapsule(c, x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  c.beginPath(); c.moveTo(x0 + nx * w0, y0 + ny * w0); c.lineTo(x1 + nx * w1, y1 + ny * w1);
  c.arc(x1, y1, w1, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true); c.lineTo(x0 - nx * w0, y0 - ny * w0);
  c.arc(x0, y0, w0, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true); c.closePath();
}

/* ---------- ground shadow: soft contact blob plus a long cast shadow away from the key light ---------- */
function cinShadow(c, x, y, s, k) {
  k = k == null ? 1 : k;
  c.save(); c.translate(x, y);
  const far = 74 * s;
  c.fillStyle = cnLG(c, 0, 0, far, 0, [[0, 'rgba(8,8,28,' + (0.36 * k) + ')'], [1, 'rgba(8,8,28,0)']]);
  c.beginPath(); c.ellipse(far * 0.46, -1 * s, far * 0.62, 6 * s, -0.045, 0, CN_TAU); c.fill();
  c.fillStyle = cnRG(c, 0, 0, 0, 0, 0, 36 * s, [[0, 'rgba(6,6,24,' + (0.55 * k) + ')'], [1, 'rgba(6,6,24,0)']]);
  c.beginPath(); c.ellipse(5 * s, 0, 38 * s, 7 * s, 0, 0, CN_TAU); c.fill();
  c.restore();
}

/* ---------- hands (local frame: origin at the wrist, +x along the forearm toward the fingers) ---------- */
function cinHand(c, x, y, ang, s, kind, skin, lod) {
  const sh = cnShade(skin, -0.24), hi = cnShade(skin, 0.18);
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const fing = (ox, oy, len, a0, curl, w) => {
    const a1 = a0 + curl, mx = ox + Math.cos(a0) * len * 0.55, my = oy + Math.sin(a0) * len * 0.55;
    const ex = mx + Math.cos(a1) * len * 0.45, ey = my + Math.sin(a1) * len * 0.45;
    c.strokeStyle = sh; c.lineWidth = w + 0.9; c.beginPath(); c.moveTo(ox, oy); c.lineTo(mx, my); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = skin; c.lineWidth = w; c.beginPath(); c.moveTo(ox, oy); c.lineTo(mx, my); c.lineTo(ex, ey); c.stroke();
  };
  if (kind === 'fist' || kind === 'hold') {
    c.fillStyle = skin; cnRR(c, 0, -4.4, 8, 8.8, 3.4); c.fill();
    c.fillStyle = sh; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(6.4, -2.4 + i * 2.6, 1.2, 0, CN_TAU); c.fill(); }
    c.fillStyle = hi; c.beginPath(); c.ellipse(3, -3, 2.8, 1.1, 0, 0, CN_TAU); c.fill();
    c.strokeStyle = skin; c.lineWidth = 3; c.beginPath(); c.moveTo(1, -3.4); c.lineTo(6, -5.2); c.stroke();
  } else if (kind === 'shake') {
    c.fillStyle = skin; cnRR(c, 0, -4.2, 7.4, 8.4, 3); c.fill();
    fing(7, -2.4, 7.4, 0.05, 0.16, 2.5); fing(7.2, -0.2, 8, 0.02, 0.14, 2.5); fing(7, 2, 7.4, 0.04, 0.2, 2.4);
    c.strokeStyle = skin; c.lineWidth = 3; c.beginPath(); c.moveTo(1.6, -4.4); c.lineTo(5.6, -8.2); c.lineTo(9, -8.6); c.stroke();
  } else if (kind === 'point') {
    c.fillStyle = skin; cnRR(c, 0, -4, 7, 8, 3); c.fill();
    fing(7, -1.8, 9.6, -0.04, 0.0, 2.5); fing(7, 0.6, 6, 0.2, 0.9, 2.4); fing(6.4, 2.6, 5.4, 0.3, 1.0, 2.3);
    c.strokeStyle = skin; c.lineWidth = 3; c.beginPath(); c.moveTo(1.4, 3.6); c.lineTo(5.4, 5.6); c.stroke();
  } else {
    // relaxed / open / wave / clap: a palm with four fingers and a thumb
    const open = kind === 'open' || kind === 'wave', spread = kind === 'wave' ? 0.2 : open ? 0.1 : 0.02, curl = open ? 0.06 : kind === 'clap' ? 0.02 : 0.42;
    c.fillStyle = skin; cnRR(c, 0, -4.4, 7.4, 8.8, 3.2); c.fill();
    if (!lod) {
      fing(7, -3.3, 6.2, -spread * 1.5, curl, 2.3); fing(7.4, -1.1, 7.2, -spread * 0.5, curl, 2.4); fing(7.4, 1.2, 6.8, spread * 0.5, curl * 1.1, 2.4); fing(6.8, 3.2, 5.4, spread * 1.5, curl * 1.3, 2.2);
      c.strokeStyle = skin; c.lineWidth = 3; c.beginPath(); c.moveTo(1.4, 4.2); c.lineTo(4.6, 6.8); c.lineTo(7, 7.6); c.stroke();
    } else { c.fillStyle = skin; c.beginPath(); c.ellipse(9, 0, 4.6, 3.2, 0, 0, CN_TAU); c.fill(); }
    c.fillStyle = hi; c.beginPath(); c.ellipse(3, -2.6, 2.6, 1, 0, 0, CN_TAU); c.fill();
  }
  c.restore();
}

/* ---------- one arm: sleeve chain + hand. Returns the wrist (figure px) ---------- */
function cinArm(c, o, side, tx, ty, kind, lod) {
  const sx = side * 20, sy = -106;
  const ik = cinIK(sx, sy, tx, ty, side), E = ik.e, W = ik.w;
  if (lod >= 2) {      // small on screen: flat sleeves and a mitten hand
    const g0 = o.gown, fa0 = Math.atan2(W[1] - E[1], W[0] - E[0]);
    c.fillStyle = g0; cinCapsule(c, sx, sy, E[0], E[1], 8.6, 7.6); c.fill();
    cinCapsule(c, E[0], E[1], W[0], W[1], 7.6, 10); c.fill();
    c.fillStyle = cnShade(g0, -0.5); c.beginPath(); c.ellipse(W[0], W[1], 10, 2.4, fa0 + Math.PI / 2, 0, CN_TAU); c.fill();
    if (kind !== 'none') { c.fillStyle = o.skin; c.beginPath(); c.ellipse(W[0] + Math.cos(fa0) * 6, W[1] + Math.sin(fa0) * 6, 5.4, 4, fa0, 0, CN_TAU); c.fill(); }
    return { w: W, e: E, a: fa0 };
  }
  const gown = o.gown, dark = cnShade(gown, -0.42), lit = cnShade(gown, 0.2);
  // upper arm: a rounded sleeve
  const fa = Math.atan2(W[1] - E[1], W[0] - E[0]), nx = -Math.sin(fa), ny = Math.cos(fa);
  const ua = Math.atan2(E[1] - sy, E[0] - sx), unx = -Math.sin(ua), uny = Math.cos(ua);
  // lit side of the sleeve faces the light
  const lg = (px, py, nx2, ny2, r, base) => { const sgn = (nx2 * CIN_LIGHT[0] + ny2 * CIN_LIGHT[1]) > 0 ? 1 : -1; return cnLG(c, px + nx2 * r * sgn, py + ny2 * r * sgn, px - nx2 * r * sgn, py - ny2 * r * sgn, [[0, cnShade(base, 0.2)], [0.45, base], [1, dark]]); };
  c.fillStyle = lg((sx + E[0]) / 2, (sy + E[1]) / 2, unx, uny, 8, gown);
  cinCapsule(c, sx, sy, E[0], E[1], 8.2, 7.4); c.fill();
  // bell sleeve (forearm): narrow at the elbow, wide at the cuff, with a bulge for drape
  const wr = 9.4, er = 7.3, mx = (E[0] + W[0]) / 2 + nx * 1.0, my = (E[1] + W[1]) / 2 + ny * 1.0;
  c.beginPath(); c.moveTo(E[0] + nx * er, E[1] + ny * er); c.quadraticCurveTo(mx + nx * 7.8, my + ny * 7.8, W[0] + nx * wr, W[1] + ny * wr);
  c.lineTo(W[0] - nx * wr, W[1] - ny * wr); c.quadraticCurveTo(mx - nx * 7.8, my - ny * 7.8, E[0] - nx * er, E[1] - ny * er); c.closePath();
  c.fillStyle = lg((E[0] + W[0]) / 2, (E[1] + W[1]) / 2, nx, ny, 11, gown); c.fill();
  // drape folds
  if (!lod) {
    c.strokeStyle = 'rgba(6,10,40,.28)'; c.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(E[0] + nx * i * 3.4, E[1] + ny * i * 3.4); c.lineTo(W[0] + nx * i * 8.4, W[1] + ny * i * 8.4); c.stroke(); }
    c.strokeStyle = 'rgba(180,200,255,.16)'; c.beginPath(); c.moveTo(E[0] + nx * 5.6, E[1] + ny * 5.6); c.lineTo(W[0] + nx * 5.2, W[1] + ny * 5.2); c.stroke();
  }
  // elbow cap hides the joint
  c.fillStyle = gown; c.beginPath(); c.arc(E[0], E[1], 6.9, 0, CN_TAU); c.fill();
  // sleeve opening with a darker lining
  c.save(); c.translate(W[0], W[1]); c.rotate(fa + Math.PI / 2);
  c.fillStyle = cnShade(gown, -0.55); c.beginPath(); c.ellipse(0, 0, wr, 2.6, 0, 0, CN_TAU); c.fill();
  c.strokeStyle = cnShade(gown, 0.26); c.lineWidth = 1.1; c.beginPath(); c.ellipse(0, 0, wr, 2.6, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  c.restore();
  // the hand sticks out of the cuff
  if (kind !== 'none') cinHand(c, W[0] + Math.cos(fa) * 1.2, W[1] + Math.sin(fa) * 1.2, fa, 1, kind || 'relax', o.skin, lod);
  return { w: W, e: E, a: fa };
}

/* ---------- the head: skin, hair, face and (optionally) the mortarboard ---------- */
function cinHead(c, o, ct) {
  const look = o.look || 0, tilt = o.tilt || 0, em = o.emote || {}, lod = o.lod || 0;
  c.save(); c.translate(0, (o.bakeHead ? 0 : CIN_HEAD_Y) + (o.headDy || 0)); c.rotate(tilt);
  const skin = o.skin, sh = cnShade(skin, -0.22), shDeep = cnShade(skin, -0.42), hiS = cnShade(skin, 0.14);
  // neck
  c.fillStyle = shDeep; c.fillRect(-6.2, 10, 12.4, 14);
  c.fillStyle = cnRG(c, 0, 12, 1, 0, 14, 8, [[0, 'rgba(0,0,0,.34)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(-7, 9, 14, 12);
  // hair behind the head
  const hs = o.hairStyle || 'short', hair = o.hair, hairD = cnShade(hair, -0.38), hairL = cnShade(hair, 0.32);
  if (hs === 'long') {      // two locks falling over the shoulders (the mass behind the neck is drawn before the gown, see cinHairBack)
    [-1, 1].forEach(sd => {
      c.fillStyle = hair; c.beginPath(); c.moveTo(sd * 12.5, -6); c.bezierCurveTo(sd * 21, 6, sd * 22.5, 26, sd * 17.5, 42); c.lineTo(sd * 9.5, 42); c.bezierCurveTo(sd * 13.5, 26, sd * 11.5, 10, sd * 10.5, 0); c.closePath(); c.fill();
      c.strokeStyle = hairL; c.globalAlpha = 0.4; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sd * 14, 4); c.quadraticCurveTo(sd * 19, 18, sd * 15.5, 36); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = hairD; c.beginPath(); c.ellipse(sd * 13.5, 42, 4.2, 1.8, 0, 0, CN_TAU); c.fill();
    });
  }
  if (hs === 'pony') { c.fillStyle = hair; c.beginPath(); c.moveTo(12, -3); c.quadraticCurveTo(30, 6, 24, 36); c.quadraticCurveTo(18, 20, 10, 8); c.closePath(); c.fill(); c.fillStyle = hairL; c.beginPath(); c.ellipse(14, -2, 3, 5, 0.4, 0, CN_TAU); c.fill(); }
  // ears (the far one is hidden when the head is turned)
  const ex = look * 1.3;
  c.fillStyle = sh; c.beginPath(); c.ellipse(-14.4 + ex, 1.5, 2.8, 4.4, 0, 0, CN_TAU); c.fill(); c.beginPath(); c.ellipse(14.4 + ex, 1.5, 2.8, 4.4, 0, 0, CN_TAU); c.fill();
  c.fillStyle = shDeep; c.beginPath(); c.ellipse(-14.8 + ex, 1.8, 1.1, 2.4, 0, 0, CN_TAU); c.ellipse(14.8 + ex, 1.8, 1.1, 2.4, 0, 0, CN_TAU); c.fill();
  // face shape
  const faceP = () => { c.beginPath(); c.moveTo(0, -17.4); c.bezierCurveTo(9.6, -17.4, 15.4, -10, 14.9, -1); c.bezierCurveTo(14.4, 9, 8.6, 17.6, 0, 17.6); c.bezierCurveTo(-8.6, 17.6, -14.4, 9, -14.9, -1); c.bezierCurveTo(-15.4, -10, -9.6, -17.4, 0, -17.4); c.closePath(); };
  c.save(); c.translate(look * 1.0, 0);
  faceP(); c.fillStyle = cnRG(c, -5 + look * 2, -6, 1, 0, 0, 22, [[0, hiS], [0.55, skin], [1, sh]]); c.fill();
  // cheek/jaw shade away from the light, chin occlusion and the board's shadow across the brow (no clipping: tinted fills of the same shape)
  faceP(); c.fillStyle = cnLG(c, 4, 0, 16, 0, [[0, 'rgba(60,20,10,0)'], [1, 'rgba(60,20,10,.26)']]); c.fill();
  faceP(); c.fillStyle = cnLG(c, 0, 7, 0, 17.6, [[0, 'rgba(60,20,10,0)'], [1, 'rgba(60,20,10,.2)']]); c.fill();
  if (o.cap !== false) { faceP(); c.fillStyle = cnLG(c, 0, -17, 0, -4, [[0, 'rgba(10,8,30,.42)'], [1, 'rgba(10,8,30,0)']]); c.fill(); }
  // face details
  const fx = look * 2.1, br = em.brow || 0, smile = em.smile != null ? em.smile : 0.35, open = em.open || 0, blink = em.eyes === 'closed' ? 0.1 : (o.blinkQ != null ? o.blinkQ : cinBlink(ct, o.seed));
  const cheek = em.blush != null ? em.blush : 0.28;
  if (lod < 2) { c.fillStyle = 'rgba(255,110,120,' + cheek + ')'; c.beginPath(); c.ellipse(-8.6 + fx, 5.4, 3.6, 2.4, 0, 0, CN_TAU); c.ellipse(8.6 + fx, 5.4, 3.6, 2.4, 0, 0, CN_TAU); c.fill(); }
  // brows
  const bcol = o.browCol || cnShade(hair, -0.15);
  c.strokeStyle = bcol; c.lineWidth = o.heavyBrow ? 2.2 : 1.7; c.lineCap = 'round';
  [-1, 1].forEach(sd => { const bx = sd * 5.8 + fx, by = -6.2 - br * 1.8 - (em.eyes === 'happy' ? 0.8 : 0), tl = (em.worry || 0) * sd * -0.4; c.beginPath(); c.moveTo(bx - 3.1, by + 0.5 + (sd < 0 ? tl : -tl) * 3); c.quadraticCurveTo(bx, by - 1.2, bx + 3.1, by + 0.6 + (sd < 0 ? -tl : tl) * 3); c.stroke(); });
  // eyes
  [-1, 1].forEach(sd => {
    const ex2 = sd * 5.7 + fx + look * 0.9, ey = -1.4;
    if (em.eyes === 'happy') { c.strokeStyle = '#2a1d18'; c.lineWidth = 1.7; c.beginPath(); c.arc(ex2, ey + 1.1, 2.7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    else {
      c.fillStyle = '#231a1a'; c.beginPath(); c.ellipse(ex2, ey, 2.45, 2.95 * blink, 0, 0, CN_TAU); c.fill();
      if (blink > 0.4) { c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(ex2 - 0.8, ey - 1.0, 0.85, 0, CN_TAU); c.fill(); if (lod < 1) { c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(ex2 + 0.9, ey + 1, 0.5, 0, CN_TAU); c.fill(); } }
      if (lod < 1) { c.strokeStyle = 'rgba(30,18,16,.5)'; c.lineWidth = 0.9; c.beginPath(); c.arc(ex2, ey - 0.3, 3, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    }
    if (o.crowFeet) { c.strokeStyle = 'rgba(90,40,24,.4)'; c.lineWidth = 0.8; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(ex2 + sd * 3.6, ey + k * 1.4); c.lineTo(ex2 + sd * 6.4, ey + k * 2.4 - 0.4); c.stroke(); } }
    if (o.glasses) { c.strokeStyle = '#1d1a24'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(ex2, ey, 4.7, 4.3, 0, 0, CN_TAU); c.stroke(); c.fillStyle = 'rgba(190,220,255,.2)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.9; c.beginPath(); c.arc(ex2, ey, 3.5, Math.PI * 1.15, Math.PI * 1.5); c.stroke(); }
  });
  if (o.glasses) { c.strokeStyle = '#1d1a24'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1.0 + fx, -1.8); c.lineTo(1.0 + fx, -1.8); c.moveTo(-10.6 + fx, -2); c.lineTo(-14.6 + ex, -1.5); c.moveTo(10.6 + fx, -2); c.lineTo(14.6 + ex, -1.5); c.stroke(); }
  // nose
  if (lod < 1) { c.strokeStyle = 'rgba(120,56,36,.5)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx * 0.9 - 0.4, 1.6); c.quadraticCurveTo(fx * 0.9 + 1.6, 4.2, fx * 0.9 - 0.8, 4.8); c.stroke();
  c.fillStyle = 'rgba(255,240,224,.35)'; c.beginPath(); c.ellipse(fx * 0.9 - 1.2, 2.2, 0.9, 1.5, 0, 0, CN_TAU); c.fill(); }
  // mouth
  const my = 9.2, mx = fx * 0.8;
  if (open > 0.08) {
    const w = 4.4 + smile * 2.4, hgt = 1.2 + open * 5.2;
    c.fillStyle = '#4a1218'; c.beginPath(); c.moveTo(mx - w, my - 0.8); c.quadraticCurveTo(mx, my + hgt * 1.5, mx + w, my - 0.8); c.quadraticCurveTo(mx, my - 1.9, mx - w, my - 0.8); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.moveTo(mx - w, my - 0.8); c.quadraticCurveTo(mx, my + hgt * 1.5, mx + w, my - 0.8); c.quadraticCurveTo(mx, my - 1.9, mx - w, my - 0.8); c.closePath(); c.clip();
    c.fillStyle = '#fbf6ee'; c.fillRect(mx - w, my - 2, w * 2, 2.5); c.fillStyle = '#d8506a'; c.beginPath(); c.ellipse(mx, my + hgt * 0.95, w * 0.55, hgt * 0.38, 0, 0, CN_TAU); c.fill(); c.restore();
  } else {
    c.strokeStyle = '#7a2e2a'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(mx - 4.6 * (0.7 + smile * 0.5), my - smile * 0.4); c.quadraticCurveTo(mx, my + 1.6 + smile * 3.2, mx + 4.6 * (0.7 + smile * 0.5), my - smile * 0.4); c.stroke();
  }
  if (o.laughLines) { c.strokeStyle = 'rgba(110,50,30,.4)'; c.lineWidth = 0.9; [-1, 1].forEach(sd => { c.beginPath(); c.arc(mx + sd * 7.6, my - 1, 4.2, sd < 0 ? Math.PI * 1.25 : Math.PI * 1.75 - 0.6, sd < 0 ? Math.PI * 1.75 + 0.6 : Math.PI * 1.75, false); c.stroke(); }); }
  c.restore();
  // front hair
  cinHairFront(c, o, hs, hair, hairD, hairL, ct);
  // tear of joy
  if (o.tears) { const tp = (ct * 0.9 + (o.seed || 0)) % 1; c.fillStyle = 'rgba(160,220,255,.85)'; [-1, 1].forEach(sd => { c.beginPath(); c.ellipse(sd * 8 + look * 2, 3 + tp * 8, 1.2, 1.9, 0, 0, CN_TAU); c.fill(); }); }
  // mortarboard
  if (o.cap !== false) cinMortar(c, o, ct);
  c.restore();
}
function cinHairFront(c, o, hs, hair, hairD, hairL, ct) {
  const wind = Math.sin(ct * 2.1 + (o.seed || 0)) * 0.6, mess = o.messy || 0;
  c.save();
  if (hs === 'afro') {
    c.fillStyle = hair; c.beginPath(); c.arc(0, -8, 22.5, Math.PI * 0.94, Math.PI * 2.06); c.lineTo(15, -2); c.quadraticCurveTo(0, -11, -15, -2); c.closePath(); c.fill();
    c.fillStyle = hairL; for (let i = 0; i < 16; i++) { const a = Math.PI + i * 0.2, r = 18 + (i % 3) * 2; c.globalAlpha = 0.5; c.beginPath(); c.arc(Math.cos(a) * r, -8 + Math.sin(a) * r, 1.6, 0, CN_TAU); c.fill(); }
    c.globalAlpha = 1; c.strokeStyle = 'rgba(255,220,170,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(0, -8, 21.6, Math.PI * 1.05, Math.PI * 1.55); c.stroke();
  } else if (hs === 'curly') {
    c.fillStyle = hair;
    for (let i = 0; i < 15; i++) { const a = Math.PI * (0.98 + i * 0.075), r = 15.5 + (i % 2) * 2.4; c.beginPath(); c.arc(Math.cos(a) * r, -3 + Math.sin(a) * (r + 1), 5.2 + (i % 3) * 0.7, 0, CN_TAU); c.fill(); }
    c.beginPath(); c.ellipse(0, -11, 14, 8, 0, 0, CN_TAU); c.fill();
    c.fillStyle = hairL; c.globalAlpha = 0.45; for (let i = 0; i < 7; i++) { const a = Math.PI * (1.0 + i * 0.07), r = 16.4; c.beginPath(); c.arc(Math.cos(a) * r, -3 + Math.sin(a) * (r + 1) - 1.5, 2.4, 0, CN_TAU); c.fill(); } c.globalAlpha = 1;
  } else if (hs === 'bald') {
    // thin silver hair at the sides, with a bald crown
    c.fillStyle = hair; c.beginPath(); c.moveTo(-15.2, -6); c.quadraticCurveTo(-16.4, 0, -14.4, 5); c.quadraticCurveTo(-11, 1, -11.4, -8); c.closePath(); c.fill(); c.beginPath(); c.moveTo(15.2, -6); c.quadraticCurveTo(16.4, 0, 14.4, 5); c.quadraticCurveTo(11, 1, 11.4, -8); c.closePath(); c.fill();
  } else {
    // short / long / pony: a full cap of hair with a swept fringe
    c.fillStyle = hair; c.beginPath();
    c.moveTo(-15.6, 2); c.bezierCurveTo(-17.2, -12, -9, -21, 1, -20.6); c.bezierCurveTo(11, -20.6, 17.2, -12, 15.6, 2);
    c.bezierCurveTo(15, -4, 13.6, -8, 11, -10.6);
    // fringe: three swept locks
    c.bezierCurveTo(7.6, -7.4, 4.4, -9.6, 1.4 + wind * 0.3, -9);
    c.bezierCurveTo(-2.6, -8.4, -6.6, -10, -10.8 + mess, -8.2);
    c.bezierCurveTo(-13.2, -6.4, -14.4, -3, -15.6, 2);
    c.closePath(); c.fill();
    // side tufts at the ears
    c.beginPath(); c.moveTo(-15.6, 0); c.quadraticCurveTo(-18.4 - mess, 5, -14.4, 8.4); c.quadraticCurveTo(-14.4, 3.4, -13.2, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(15.6, 0); c.quadraticCurveTo(18.4 + mess, 5, 14.4, 8.4); c.quadraticCurveTo(14.4, 3.4, 13.2, 0); c.closePath(); c.fill();
    // volume and a highlight sweep
    c.fillStyle = hairL; c.globalAlpha = 0.42; c.beginPath(); c.moveTo(-12.6, -9); c.bezierCurveTo(-10, -17, -3, -19.4, 3.6, -19); c.bezierCurveTo(-3, -16, -8, -12.6, -11.2, -7.2); c.closePath(); c.fill(); c.globalAlpha = 1;
    if (!o.lod) { c.strokeStyle = hairD; c.lineWidth = 0.9; c.globalAlpha = 0.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-9 + i * 4.6, -19.6 + Math.abs(i - 2) * 0.8); c.quadraticCurveTo(-6 + i * 4.2 + wind * 0.2, -13, -8.4 + i * 4.5, -9.6); c.stroke(); } c.globalAlpha = 1; }
    if (mess) { c.strokeStyle = hair; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 + i * 4.4, -19); c.quadraticCurveTo(-8 + i * 5 + wind, -26 - (i % 2) * 2, -3 + i * 5 + mess * 2, -25); c.stroke(); } }
  }
  c.restore();
}
function cinMortar(c, o, ct) {
  const cap = o.capCol || '#0f1626', cy = -16.6 + (o.capDy || 0);
  // band hugging the head
  c.fillStyle = cnLG(c, -16, 0, 16, 0, [[0, cnShade(cap, 0.22)], [0.5, cap], [1, cnShade(cap, -0.4)]]);
  c.beginPath(); c.moveTo(-15.4, cy + 1); c.quadraticCurveTo(-16.4, cy + 11, -13.6, cy + 12.4); c.lineTo(13.6, cy + 12.4); c.quadraticCurveTo(16.4, cy + 11, 15.4, cy + 1); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-14, cy + 10, 28, 2.4);
  // the board: thickness first, then the top face, tilted back a touch so we read the diamond
  const hw = 33, hh = 9.6, th = 2.8, t = o.boardTilt || 0;
  c.save(); c.translate(0, cy); c.rotate(t);
  c.fillStyle = cnShade(cap, -0.5); c.beginPath(); c.moveTo(-hw, th); c.lineTo(0, hh + th); c.lineTo(hw, th); c.lineTo(hw, 0); c.lineTo(0, hh); c.lineTo(-hw, 0); c.closePath(); c.fill();
  c.fillStyle = cnLG(c, -hw, -hh, hw, hh, [[0, cnShade(cap, 0.34)], [0.45, cnShade(cap, 0.04)], [1, cnShade(cap, -0.3)]]);
  c.beginPath(); c.moveTo(-hw, 0); c.lineTo(0, -hh); c.lineTo(hw, 0); c.lineTo(0, hh); c.closePath(); c.fill();
  // sheen band and edge light
  if (!o.lod) { c.save(); c.clip(); c.fillStyle = 'rgba(190,210,255,.14)'; c.beginPath(); c.moveTo(-26, 2); c.lineTo(-6, -9); c.lineTo(4, -9); c.lineTo(-16, 5); c.closePath(); c.fill(); c.restore(); }
  c.strokeStyle = 'rgba(210,225,255,.55)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-hw, 0); c.lineTo(0, -hh); c.lineTo(hw * 0.35, -hh * 0.65); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.moveTo(hw, 0); c.lineTo(0, hh); c.stroke();
  // button, cord and the tassel (a damped pendulum from the corner)
  c.fillStyle = '#f0b429'; c.beginPath(); c.arc(0, -0.6, 2.4, 0, CN_TAU); c.fill(); c.fillStyle = '#fff3b8'; c.beginPath(); c.arc(-0.7, -1.4, 0.9, 0, CN_TAU); c.fill();
  const th0 = (o.tassel || 0);
  c.strokeStyle = '#f0b429'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -0.6); c.quadraticCurveTo(hw * 0.5, hh * 0.1, hw - 3, 0.6); c.stroke();
  if (!o.noTassel) { c.save(); c.translate(hw - 3, 0.6); cinTasselDraw(c, th0); c.restore(); }
  c.restore();
  c.restore();
}
/* the tassel as a pendulum hanging from the board corner (origin), th0 radians of swing */
function cinTasselDraw(c, th0) {
  c.save(); c.rotate(th0);
  c.strokeStyle = '#f0b429'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 7); c.stroke();
  c.fillStyle = cnLG(c, -2.6, 0, 2.6, 0, [[0, '#fff0a8'], [0.5, '#f0b429'], [1, '#b9811b']]); cnRR(c, -2.8, 6, 5.6, 5.4, 2); c.fill();
  c.fillStyle = '#d99b1b'; c.fillRect(-3, 10.2, 6, 1.2);
  for (let i = -4; i <= 4; i++) { c.strokeStyle = i % 2 ? '#f6c750' : '#c58f1f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(i * 0.7, 11); c.quadraticCurveTo(i * 1.2 + th0 * 3, 17, i * 1.35 + th0 * 6, 23.5 + (Math.abs(i) % 2) * 1.2); c.stroke(); }
  c.restore();
}

/* the costume (gown, drape, collar, stole) baked once at 4 px per unit and cached by look */
const CIN_GOWNS = {};
function cinGownSprite(o) {
  const key = [o.gown, o.stole, o.collar, o.tie, o.flare].join('|');
  let g = CIN_GOWNS[key];
  if (g) return g;
  const X0 = -46, Y0 = -116, W = 92, H = 96, sc = 4, cv = cnMk(W * sc, H * sc), c = cv.getContext('2d');
  c.scale(sc, sc); c.translate(-X0, -Y0);
  const bob = 0, sway = 0, ph = 0, walkA = 0, lod = 0, hemY = -26, hemLen = 36;
  const gown = o.gown || '#1d2e6b', stole = o.stole || '#f0b429';
  const ob = o;
  // gown body
  const top = -107 + bob * 0.6, wAt = t2 => 21 + 14.2 * Math.pow(t2, 1.35), bellow = (ob.flare || 1);
  const edge = (t2, sd) => sd * wAt(t2) * bellow + sway * t2 * t2 * 1.0;
  const hemWave = xx => hemY + Math.sin(xx * 0.19 + ph * 1.4) * 1.2 * (0.35 + walkA) + (1 - Math.abs(xx) / 36) * 2.4;
  const bodyPath = () => {
    c.beginPath(); c.moveTo(-8, top - 3);
    c.bezierCurveTo(-14, top - 2, -21, top + 1, -21.5, top + 7);
    for (let i = 1; i <= 10; i++) { const t2 = i / 10, yy = lerp(top + 7, hemY, t2); c.lineTo(edge(t2, -1), yy); }
    for (let i = 0; i <= 14; i++) { const xx = lerp(-1, 1, i / 14) * hemLen * bellow + sway; c.lineTo(xx, hemWave(xx - sway)); }
    for (let i = 10; i >= 1; i--) { const t2 = i / 10, yy = lerp(top + 7, hemY, t2); c.lineTo(edge(t2, 1), yy); }
    c.bezierCurveTo(21, top + 1, 14, top - 2, 8, top - 3); c.closePath();
  };
  bodyPath();
  c.fillStyle = cnLG(c, -36, 0, 36, 0, [[0, cnShade(gown, 0.22)], [0.35, gown], [0.7, cnShade(gown, -0.2)], [1, cnShade(gown, -0.5)]]); c.fill();
  c.save(); bodyPath(); c.clip();
  // vertical drape: pleats hanging from a yoke, fanning toward the hem
  const pleats = lod ? 4 : 9;
  for (let k = -pleats; k <= pleats; k++) {
    const f = k / pleats, xt = f * 13, xb = f * 34 * bellow + sway * 0.9 + Math.sin(k * 2.3) * 1.2;
    c.strokeStyle = 'rgba(4,8,36,' + (0.24 + (k % 2) * 0.1) + ')'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(xt, top + 8); c.bezierCurveTo(xt + f * 6, top + 34, xb * 0.86, -64, xb, hemY + 3); c.stroke();
    if (!lod) { c.strokeStyle = 'rgba(170,190,255,' + (0.1 + (k % 2) * 0.06) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xt - 1.6, top + 8); c.bezierCurveTo(xt - 1.6 + f * 6, top + 34, xb * 0.86 - 1.6, -64, xb - 1.8, hemY + 3); c.stroke(); }
  }
  // belly fold, chest light and heavy occlusion toward the hem
  c.fillStyle = cnLG(c, 0, top, 0, hemY, [[0, 'rgba(190,210,255,.14)'], [0.3, 'rgba(190,210,255,0)'], [0.75, 'rgba(0,0,20,.18)'], [1, 'rgba(0,0,20,.5)']]); c.fillRect(-48, top - 4, 96, hemY - top + 12);
  c.strokeStyle = 'rgba(4,8,36,.3)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-18, -74 + bob * 0.4); c.quadraticCurveTo(0, -70 + bob * 0.4, 18, -75 + bob * 0.4); c.stroke();
  // hem band
  c.fillStyle = 'rgba(0,0,20,.32)'; c.beginPath(); for (let i = 0; i <= 14; i++) { const xx = lerp(-1, 1, i / 14) * hemLen * bellow + sway; c.lineTo(xx, hemWave(xx - sway) - 3.4); } for (let i = 14; i >= 0; i--) { const xx = lerp(-1, 1, i / 14) * hemLen * bellow + sway; c.lineTo(xx, hemWave(xx - sway) + 2); } c.closePath(); c.fill();
  c.restore();
  // rim light on the sun-facing edge
  c.strokeStyle = 'rgba(160,185,255,.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-21.4, top + 8); for (let i = 1; i <= 10; i++) c.lineTo(edge(i / 10, -1) + 0.5, lerp(top + 7, hemY, i / 10)); c.stroke();
  c.strokeStyle = 'rgba(0,0,20,.4)'; c.beginPath(); c.moveTo(21.4, top + 8); for (let i = 1; i <= 10; i++) c.lineTo(edge(i / 10, 1) - 0.5, lerp(top + 7, hemY, i / 10)); c.stroke();
  // shoulders: a yoke seam
  c.strokeStyle = 'rgba(0,0,20,.25)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-20, top + 8); c.quadraticCurveTo(0, top + 14, 20, top + 8); c.stroke();
  // shirt at the neck (the player's coral tee!) and the V of the gown
  const collar = ob.collar || '#f4f0e6';
  c.fillStyle = cnShade(collar, -0.3); c.beginPath(); c.moveTo(-9, top - 3.4); c.lineTo(9, top - 3.4); c.lineTo(0, top + 17); c.closePath(); c.fill();
  c.fillStyle = collar; c.beginPath(); c.moveTo(-8, top - 3.4); c.quadraticCurveTo(0, top + 6.4, 8, top - 3.4); c.quadraticCurveTo(0, top + 1.6, -8, top - 3.4); c.closePath(); c.fill();
  c.fillStyle = cnShade(collar, -0.22); c.beginPath(); c.moveTo(-8, top - 3.4); c.quadraticCurveTo(0, top + 6.4, 8, top - 3.4); c.lineTo(8, top - 1.2); c.quadraticCurveTo(0, top + 8.6, -8, top - 1.2); c.closePath(); c.fill();
  if (ob.tie) { c.fillStyle = ob.tie; c.beginPath(); c.moveTo(-2, top + 3); c.lineTo(2, top + 3); c.lineTo(3, top + 20); c.lineTo(0, top + 24); c.lineTo(-3, top + 20); c.closePath(); c.fill(); }
  // the stole: two panels with a woven edge and fringe
  const stoleHi = cnShade(stole, 0.4), stoleLo = cnShade(stole, -0.34);
  [-1, 1].forEach(sd => {
    const x0 = sd * 7.6, x1 = sd * 17 + sway * 0.78, yb = -40 + bob * 0.3 - (walkA * Math.sin(ph + sd) * 1.2);
    c.beginPath(); c.moveTo(x0 - sd * 1.6, top - 2); c.lineTo(x0 + sd * 6.6, top - 1); c.bezierCurveTo(x1 + sd * 7, top + 28, x1 + sd * 6.4, yb - 20, x1 + sd * 5.6, yb); c.lineTo(x1 - sd * 4.6, yb); c.bezierCurveTo(x1 - sd * 5.6, yb - 20, x0 - sd * 0.8, top + 28, x0 - sd * 1.6, top - 2); c.closePath();
    c.fillStyle = cnLG(c, x0 - 8, 0, x0 + 10, 0, sd < 0 ? [[0, stoleHi], [0.4, stole], [1, stoleLo]] : [[0, stole], [0.5, cnShade(stole, -0.16)], [1, stoleLo]]); c.fill();
    c.save(); c.clip();
    c.strokeStyle = 'rgba(100,60,0,.5)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x0 + sd * (1 + k * 1.8), top); c.bezierCurveTo(x1 + sd * (1 + k * 1.8), top + 30, x1 + sd * (1 + k * 1.8), yb - 16, x1 + sd * (1 + k * 1.8), yb); c.stroke(); }
    c.strokeStyle = 'rgba(255,246,190,.55)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0 - sd * 0.6, top); c.bezierCurveTo(x1 - sd * 1.6, top + 30, x1 - sd * 1.6, yb - 16, x1 - sd * 1.4, yb); c.stroke();
    c.fillStyle = cnLG(c, 0, top, 0, yb, [[0, 'rgba(0,0,0,.28)'], [0.2, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.18)']]); c.fillRect(-40, top - 2, 80, yb - top + 4);
    c.restore();
    c.strokeStyle = stoleLo; c.lineWidth = 1.1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x1 + k * 2, yb); c.lineTo(x1 + k * 2.2 + sway * 0.05, yb + 4.6); c.stroke(); }
  });
  g = CIN_GOWNS[key] = { cv, x: X0, y: Y0, w: W, h: H };
  return g;
}

/* small heads (wide shots) come from a sprite cache keyed by a quantised expression, so a crowd of ten costs a handful of blits */
const CIN_HEADS = { map: new Map(), n: 0 };
function cinHeadCached(c, o, ct) {
  const em = o.emote || {}, q = (v, st) => Math.round((v || 0) / st) * st;
  const blinkQ = cinBlink(ct, o.seed) < 0.6 ? 0.12 : 1;
  const k = { look: q(o.look, 0.5), tilt: q(o.tilt, 0.03), messy: o.messy ? 1 : 0 };
  const eq = { smile: q(em.smile != null ? em.smile : 0.35, 0.5), open: q(em.open, 0.5), brow: q(em.brow, 0.5), worry: q(em.worry, 1), blush: 0.28, eyes: em.eyes === 'happy' ? 'happy' : 'open' };
  const key = [o.skin, o.hair, o.hairStyle, o.glasses ? 1 : 0, o.cap === false ? 0 : 1, o.capCol, o.seed, k.look, k.tilt, k.messy, eq.smile, eq.open, eq.brow, eq.worry, eq.eyes, blinkQ, o.headDy || 0].join('|');
  let h = CIN_HEADS.map.get(key);
  if (!h) {
    const X0 = -46, Y0 = -60, W = 92, H = 108, sc = 1.6, cv = cnMk(W * sc, H * sc), g = cv.getContext('2d');
    g.scale(sc, sc); g.translate(-X0, -Y0);
    const oq = Object.assign({}, o, { look: k.look, tilt: k.tilt, tassel: 0, noTassel: true, emote: eq, bakeHead: true, blinkQ, lod: 1, t: 0, tears: false });
    cinHead(g, oq, 0);
    h = { cv, x: X0, y: Y0, w: W, h: H };
    if (CIN_HEADS.n > 400) { CIN_HEADS.map.clear(); CIN_HEADS.n = 0; }
    CIN_HEADS.map.set(key, h); CIN_HEADS.n++;
  }
  c.drawImage(h.cv, h.x, CIN_HEAD_Y + h.y, h.w, h.h);
  if (o.cap !== false) {      // the tassel swings live
    c.save(); c.translate(0, CIN_HEAD_Y + (o.headDy || 0)); c.rotate(o.tilt || 0); c.translate(30, -16.6 + 0.6 + (o.capDy || 0)); cinTasselDraw(c, o.tassel || 0); c.restore();
  }
}

/* hair that hangs behind the neck: drawn before the gown so the shoulders overlap it */
function cinHairBack(c, o, bob) {
  if (o.hairStyle !== 'long') return;
  const hy = CIN_HEAD_Y + bob * 0.8, hair = o.hair;
  c.fillStyle = cnShade(hair, -0.3); c.beginPath(); c.moveTo(-16.5, hy - 8); c.bezierCurveTo(-25, hy + 10, -23.5, hy + 34, -18, hy + 52); c.lineTo(18, hy + 52); c.bezierCurveTo(23.5, hy + 34, 25, hy + 10, 16.5, hy - 8); c.closePath(); c.fill();
  c.strokeStyle = cnShade(hair, 0.25); c.globalAlpha = 0.35; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-14, hy + 4); c.quadraticCurveTo(-18, hy + 24, -13, hy + 44); c.stroke(); c.globalAlpha = 1;
}

/* ====================================================================================
   THE FIGURE
   o: x-less options. gown, stole, skin, hair, hairStyle, cap, capCol, tassel, look, tilt, emote, walk, walkAmt, lean, bob,
      armL / armR = {x, y, k} wrist target (figure px, hand kind k), collar, glasses, seed, t (time), lod, shoes, trousers
   returns the hands/head in world coords for props to latch onto
   ==================================================================================== */
function cinFigure(c, x, y, s, o) {
  o = o || {};
  if (o.shake != null || o.up != null) o = cinCompat(o);
  const ct = o.t || 0, walkA = o.walkAmt != null ? o.walkAmt : (o.walk ? 1 : 0), ph = o.walk || 0, lod = o.lod || 0;
  const breathe = Math.sin(ct * 1.9 + (o.seed || 0) * 2) * 0.5;
  const bob = -Math.abs(Math.sin(ph)) * 2.8 * walkA + (o.bob || 0) + breathe * (1 - walkA);
  const sway = (o.sway != null ? o.sway : 0) + Math.sin(ph - 0.9) * 3.2 * walkA;      // cloth lags the stride
  const lean = (o.lean || 0) + walkA * 0.022 * (o.dir || 1);
  const gown = o.gown || '#1d2e6b', stole = o.stole || '#f0b429', dark = cnShade(gown, -0.5), lit = cnShade(gown, 0.24);
  const hemY = -26 - (bob * 0.4);
  const ret = { hands: {}, head: null, cap: null };
  if (o.shadow !== false) cinShadow(c, x, y, s, o.shadowK);
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(lean);
  // long hair behind the body
  // legs and shoes
  const legA = Math.sin(ph) * 11 * walkA, legB = -legA, liftA = Math.max(0, Math.cos(ph)) * 4 * walkA, liftB = Math.max(0, -Math.cos(ph)) * 4 * walkA;
  [[-9, legA, liftA], [9, legB, liftB]].forEach(l => {
    const fx = l[0] + l[1], fy = -l[2];
    c.fillStyle = o.trousers || '#161c30'; cinCapsule(c, l[0] * 0.7, hemY - 4, fx, fy - 6, 6.6, 5.4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(fx - 4.6, fy - 20, 1.8, 14);
    // two-tone shoe: dark upper, pale sole and a heel
    c.fillStyle = o.shoeSole || '#cfc7b6'; cnRR(c, fx - 8.4, fy - 1.8, 18.6, 4.4, 2); c.fill();
    c.fillStyle = o.shoes || '#10131b'; c.beginPath(); c.moveTo(fx - 7.6, fy - 1.8); c.quadraticCurveTo(fx - 7, fy - 8, fx - 1.6, fy - 8.4); c.lineTo(fx + 3.6, fy - 6.6); c.quadraticCurveTo(fx + 10, fy - 4.6, fx + 9.8, fy - 1.8); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(fx - 2, fy - 6, 3.2, 1.1, -0.2, 0, CN_TAU); c.fill();
  });
  cinHairBack(c, o, bob);
  // gown body + stole + collar come from a baked sprite (drawn once per costume); the cloth lag is a skew about the shoulders
  const spr = cinGownSprite(o);
  c.save(); c.translate(0, bob * 0.6);
  const kk = sway / 79, pl = 1 + Math.sin(ph * 2) * 0.012 * walkA;
  c.transform(pl, 0, kk, 1, -kk * -107, 0);
  c.drawImage(spr.cv, spr.x, spr.y, spr.w, spr.h);
  c.restore();
  // arms
  const sl = o.armL || { x: -26, y: -52, k: 'relax' }, sr = o.armR || { x: 26, y: -52, k: 'relax' };
  const swing = Math.sin(ph) * 7 * walkA;
  const aL = cinArm(c, { gown, skin: o.skin }, -1, sl.x + (sl.free === false ? 0 : swing * 0.6), sl.y - Math.abs(swing) * 0.2, sl.k, lod);
  const aR = cinArm(c, { gown, skin: o.skin }, 1, sr.x - (sr.free === false ? 0 : swing * 0.6), sr.y - Math.abs(swing) * 0.2, sr.k, lod);
  ret.hands.L = aL; ret.hands.R = aR;
  // head
  c.save(); c.translate(0, bob * 0.8);
  if (lod >= 2) cinHeadCached(c, o, ct); else cinHead(c, o, ct);
  c.restore();
  c.restore();
  // world-space results
  const cs = Math.cos(lean), sn = Math.sin(lean), wp = (px, py) => [x + (px * cs - py * sn) * s, y + (px * sn + py * cs) * s];
  ret.hands.L.world = wp(aL.w[0], aL.w[1]); ret.hands.R.world = wp(aR.w[0], aR.w[1]);
  ret.head = wp(0, CIN_HEAD_Y + bob * 0.8); ret.capTop = wp(0, CIN_HEAD_Y + bob * 0.8 - 22);
  ret.hx = ret.hands.R.world[0]; ret.hy = ret.hands.R.world[1];
  return ret;
}
/* the original drawGrad options (shake / up) mapped onto wrist targets */
function cinCompat(o) {
  const n = Object.assign({}, o), d = o.dir || 1;
  const a1 = o.shake || 0, a2 = o.up || 0;
  let hx = 29, hy = -52; hx = lerp(hx, 60, a1); hy = lerp(hy, -82, a1); hx = lerp(hx, 30, a2); hy = lerp(hy, -162, a2);
  n.armL = { x: -29 * d, y: -52, k: 'relax' }; n.armR = { x: hx * d, y: hy, k: 'shake' };
  if (d < 0) { const t = n.armL; n.armL = n.armR; n.armR = t; }
  n.shake = n.up = null; n.look = d * 0.6; n.t = n.t || 0;
  return n;
}
