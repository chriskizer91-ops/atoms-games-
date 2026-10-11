/* ============================ cinematic effects ============================
   Diploma (rolled paper, ribbon, wax seal), tumbling mortarboards with a slow-motion window, confetti with flutter, follow-spot beams
   with dust, camera flashes, sun flare and the two black cards. All deterministic in ct. */

/* ---------- the diploma ---------- */
function cinDiploma(c, x, y, ang, s, detail) {
  const L = 58, R = 6.8, d = detail || 0;
  if (d < 0) {      // far away: a cream roll with a red band
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    c.fillStyle = '#efe6cc'; cnRR(c, -L / 2, -R, L, R * 2, R * 0.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-L / 2 + 3, -R + 1.2, L - 6, 2);
    c.fillStyle = '#c9402f'; c.fillRect(0, -R - 0.4, 7, R * 2 + 0.8);
    c.restore(); return;
  }
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  // soft shadow
  c.fillStyle = 'rgba(6,8,28,.22)'; c.beginPath(); c.ellipse(1.5, R + 1.2, L * 0.46, 2.4, 0, 0, CN_TAU); c.fill();
  // body: a heavy cream roll, lit from above-left
  c.fillStyle = cnLG(c, 0, -R, 0, R, [[0, '#fffbf0'], [0.28, '#f8f1de'], [0.7, '#dcd1b0'], [1, '#a79d7c']]);
  cnRR(c, -L / 2, -R, L, R * 2, R * 0.5); c.fill();
  // open ends: you can see the spiral of the paper
  c.fillStyle = '#e4dabb'; c.beginPath(); c.ellipse(-L / 2 + 0.6, 0, 2.7, R, 0, 0, CN_TAU); c.fill();
  c.strokeStyle = 'rgba(120,104,70,.65)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(-L / 2 + 0.6, 0, 1.7, R * 0.72, 0, 0.4, 5.9); c.stroke(); c.beginPath(); c.ellipse(-L / 2 + 0.6, 0, 0.8, R * 0.38, 0, 0.6, 5.8); c.stroke();
  c.fillStyle = '#cabf9c'; c.beginPath(); c.ellipse(L / 2 - 0.4, 0, 2.4, R, 0, 0, CN_TAU); c.fill();
  c.strokeStyle = 'rgba(90,76,50,.6)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(L / 2 - 0.4, 0, 1.4, R * 0.7, 0, 0.5, 5.8); c.stroke();
  // highlight along the top and a curled seam edge
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-2, -R * 0.62, L * 0.4, 1.2, 0, 0, CN_TAU); c.fill();
  c.strokeStyle = 'rgba(110,96,64,.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-L / 2 + 3, R * 0.3); c.bezierCurveTo(-10, R * 0.55, 10, R * 0.12, L / 2 - 3, R * 0.5); c.stroke();
  if (d > 0.05) {      // paper fibres and a deckled look, only when the camera is close
    c.globalAlpha = d;
    for (let i = 0; i < 70; i++) { const fx = -L / 2 + 3 + hash01(i, 1, 5) * (L - 6), fy = -R + 1 + hash01(i, 2, 5) * (R * 2 - 2), fl = 1.6 + hash01(i, 3, 5) * 3.4, fa = (hash01(i, 4, 5) - 0.5) * 0.6; c.strokeStyle = hash01(i, 5, 5) > 0.5 ? 'rgba(130,110,70,.22)' : 'rgba(255,255,255,.35)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); c.stroke(); }
    c.globalAlpha = 1;
  }
  // red ribbon band with a bow, and the gold wax seal
  const rx = 2;
  c.fillStyle = cnLG(c, 0, -R, 0, R, [[0, '#e2594a'], [0.4, '#c9402f'], [1, '#8d241a']]); c.fillRect(rx - 3.8, -R - 0.4, 7.6, R * 2 + 0.8);
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(rx - 3.8, -R - 0.4, 1.4, R * 2 + 0.8);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(rx + 2.4, -R - 0.4, 1.4, R * 2 + 0.8);
  // bow: two loops and two tails
  c.fillStyle = '#c9402f'; c.beginPath(); c.ellipse(rx - 3.4, R * 0.1, 3.6, 2.3, -0.5, 0, CN_TAU); c.fill(); c.beginPath(); c.ellipse(rx + 3.8, R * 0.1, 3.6, 2.3, 0.5, 0, CN_TAU); c.fill();
  c.fillStyle = '#a82f22'; c.beginPath(); c.moveTo(rx, R * 0.2); c.lineTo(rx - 3.6, R + 4.6); c.lineTo(rx - 1.2, R + 3.4); c.lineTo(rx + 0.4, R + 5.2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(rx, R * 0.2); c.lineTo(rx + 2.8, R + 5.4); c.lineTo(rx + 1.4, R + 3.6); c.lineTo(rx + 4.6, R + 3.8); c.closePath(); c.fill();
  c.fillStyle = '#d9483a'; c.beginPath(); c.arc(rx, R * 0.14, 1.8, 0, CN_TAU); c.fill();
  // seal
  const sx = rx - 0.2, sy = -R * 0.34;
  c.fillStyle = cnRG(c, sx - 1.2, sy - 1.4, 0.4, sx, sy, 4.6, [[0, '#fff0b0'], [0.5, '#f0b429'], [1, '#a9740f']]); c.beginPath(); c.arc(sx, sy, 4.3, 0, CN_TAU); c.fill();
  c.strokeStyle = 'rgba(120,76,0,.7)'; c.lineWidth = 0.6; c.beginPath(); c.arc(sx, sy, 3.1, 0, CN_TAU); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(sx - 1.3, sy - 1.4, 0.9, 0, CN_TAU); c.fill();
  if (d > 0.3) { c.globalAlpha = d; c.strokeStyle = 'rgba(120,76,0,.6)'; c.lineWidth = 0.4; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(sx + Math.cos(a) * 3.1, sy + Math.sin(a) * 3.1); c.lineTo(sx + Math.cos(a) * 4.2, sy + Math.sin(a) * 4.2); c.stroke(); } c.globalAlpha = 1; }
  c.restore();
}

/* ====================================================================================
   hats and confetti
   ==================================================================================== */
/* slow motion: the toss plays at ~0.28x speed and eases back to normal over 1.3 s (a pure function of time) */
function cinWarp(t) {
  if (t <= 0) return 0;
  const D = 1.3, u = Math.min(1, t / D);
  const w = 0.28 * Math.min(t, D) + 0.72 * D * (u * u * u - u * u * u * u / 2);
  return REDUCED ? t : w + Math.max(0, t - D);
}
function cinMakeHats() {
  const rnd = mulberry32(8), hats = [];
  for (let i = 0; i < 8; i++) {
    const h = CIN_CLASS[i].h, s = 0.8 * h;
    hats.push({ x: cinClassX(i), y: CIN_STAGE_Y.cls - 163 * s, vx: (rnd() - 0.5) * 210 + (i - 3.5) * 16, vy: -(380 + rnd() * 260), yaw: rnd() * 6, pitch: rnd() * 2, roll: (rnd() - 0.5) * 0.6, vyaw: (rnd() - 0.5) * 9, vpitch: (rnd() - 0.5) * 7, vroll: (rnd() - 0.5) * 9, mine: false, sc: s * 1.04, z: 1 + rnd() * 0.15, lag: rnd() * 0.05 });
  }
  hats.push({ x: CIN_GRAD_END + 2, y: CIN_STAGE_Y.grad - 164, vx: 36, vy: -690, yaw: 0.4, pitch: 0.6, roll: 0.1, vyaw: 5, vpitch: 4.4, vroll: 3.2, mine: true, sc: 1.05, z: 1.05, lag: 0 });
  return hats;
}
const CIN_GRAV = 400;
function cinHatPos(h, tw) { return [h.x + h.vx * tw, h.y + h.vy * tw + CIN_GRAV * 0.5 * tw * tw]; }
function cinDrawHat(c, h, tw, alpha, trail) {
  const p = cinHatPos(h, tw), vx = h.vx, vy = h.vy + CIN_GRAV * tw;
  const a = 26 * h.sc * (1 + Math.min(0.5, tw * 0.22));
  const yaw = Math.PI / 4 + h.yaw + h.vyaw * tw, pitch = 0.42 + h.pitch * 0 + h.vpitch * tw * 0.6, roll = h.roll + h.vroll * tw * 0.35;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => {
    const x = q[0] * a, z = q[1] * a, x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const X = x1, Y = z1 * sp;
    return [p[0] + X * cr - Y * sr, p[1] + X * sr + Y * cr];
  });
  const top = cp > 0, th = 3.2 * h.sc * cp, ox = -sr * th, oy = cr * th;
  c.globalAlpha = alpha;
  // thickness
  c.fillStyle = '#05070d'; c.beginPath(); pts.forEach((q, i) => c[i ? 'lineTo' : 'moveTo'](q[0], q[1])); pts.slice().reverse().forEach(q => c.lineTo(q[0] + ox, q[1] + oy)); c.closePath(); c.fill();
  // top face
  c.fillStyle = top ? '#0f1626' : '#070a12'; c.beginPath(); pts.forEach((q, i) => c[i ? 'lineTo' : 'moveTo'](q[0], q[1])); c.closePath(); c.fill();
  c.fillStyle = 'rgba(150,175,235,' + (top ? 0.2 : 0.08) + ')'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.lineTo((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2); c.lineTo((pts[0][0] + pts[3][0]) / 2, (pts[0][1] + pts[3][1]) / 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(200,220,255,.5)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke();
  if (trail) { c.globalAlpha = 1; return p; }
  if (top) { c.fillStyle = '#f0b429'; c.beginPath(); c.arc(p[0], p[1], 2.2 * h.sc, 0, CN_TAU); c.fill(); }
  // the tassel hangs from a corner and trails behind the motion
  const corner = pts.reduce((m, q) => (q[0] > m[0] ? q : m), pts[0]);
  const ang = clamp(-vx * 0.0011 + Math.sin(tw * 9 + h.yaw * 3) * 0.3 * Math.exp(-tw * 0.5), -0.9, 0.9);
  const len = 20 * h.sc * (1 + clamp(-vy * 0.0006, -0.2, 0.35));
  c.save(); c.translate(corner[0], corner[1]); c.rotate(ang);
  c.strokeStyle = '#f0b429'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len * 0.35); c.stroke();
  c.fillStyle = '#f0b429'; cnRR(c, -2.4, len * 0.3, 4.8, len * 0.28, 1.5); c.fill();
  for (let i = -3; i <= 3; i++) { c.strokeStyle = i % 2 ? '#f6c750' : '#b9811b'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(i * 0.7, len * 0.56); c.quadraticCurveTo(i * 1.2, len * 0.8, i * 1.6 + ang * 4, len); c.stroke(); }
  c.restore();
  c.globalAlpha = 1;
  return p;
}
function cinMakeConfetti() {
  const rnd = mulberry32(21), out = [], cols = ['#ffc247', '#ff6b6b', '#5bd39b', '#47b8ff', '#a393ff', '#ffffff', '#ff9ac0', '#ff7a59'];
  const N = 230;
  for (let i = 0; i < N; i++) {
    const kind = i % 3;          // 0 left cannon, 1 right cannon, 2 overhead shower
    const z = 0.9 + rnd() * 0.85;
    let x, y, vx, vy;
    if (kind === 0) { x = 190; y = 520; const a = -(0.9 + rnd() * 0.55), sp = 420 + rnd() * 620; vx = Math.cos(a) * sp * 0.9; vy = Math.sin(a) * sp; }
    else if (kind === 1) { x = 1090; y = 520; const a = -(Math.PI - 0.9 - rnd() * 0.55), sp = 420 + rnd() * 620; vx = Math.cos(a) * sp * 0.9; vy = Math.sin(a) * sp; }
    else { x = 120 + rnd() * 1040; y = -220 - rnd() * 140; vx = (rnd() - 0.5) * 80; vy = 80 + rnd() * 120; }
    out.push({ x, y, vx, vy, w: 5 + rnd() * 6, h: 3 + rnd() * 4, col: cols[Math.floor(rnd() * cols.length)], t0: 11.8 + (kind === 2 ? 0.4 + rnd() * 1.8 : rnd() * 0.25), z, vt: 55 + rnd() * 60, k: 1.6 + rnd() * 1.2, ph: rnd() * 6.28, fr: 6 + rnd() * 9, sw: 10 + rnd() * 26, sf: 1.4 + rnd() * 2, rot: rnd() * 6.28, vr: (rnd() - 0.5) * 9, kind, streamer: i % 17 === 0, sparkle: i % 9 === 0 });
  }
  return out;
}
function cinConfPos(p, ct) {
  const t = ct - p.t0;
  if (t <= 0) return null;
  const tw = cinWarp(t + 0.0) ;        // slow motion applies to the early flight only (see cinWarp)
  const e = 1 - Math.exp(-p.k * tw);
  const x = p.x + p.vx * e / p.k + Math.sin(tw * p.sf + p.ph) * p.sw * Math.min(1, tw * 0.8);
  const y = p.y + p.vt * tw + (p.vy - p.vt) * e / p.k;
  return [x, y, tw];
}
function cinParticles(c, V, ct) {
  if (ct < 11.55) return;
  const L = CN.S, hats = CUT.hats, conf = CUT.conf;
  const t = ct - 11.62, tw = cinWarp(t);
  // confetti in three depth bins: far (small, crisp), mid, near (big, soft)
  const bins = [[0.96, 0.9, 1.1], [1.2, 1.3, 1.5], [1.6, 99, 99]];
  const bounds = [[0, 1.1], [1.1, 1.4], [1.4, 9]];
  for (let b = 0; b < 3; b++) {
    cinSet(c, V, b === 0 ? 0.96 : b === 1 ? 1.2 : 1.58);
    const near = b === 2;
    for (let i = 0; i < conf.length; i++) {
      const p = conf[i];
      if (p.z < bounds[b][0] || p.z >= bounds[b][1]) continue;
      const pos = cinConfPos(p, ct);
      if (!pos || pos[1] > 1100) continue;
      if (pos[0] < CN.cur.x0 - 30 || pos[0] > CN.cur.x1 + 30 || pos[1] < CN.cur.y0 - 30 || pos[1] > CN.cur.y1 + 30) continue;
      const flip = Math.cos(pos[2] * p.fr + p.ph), sc = near ? 1.9 : b ? 1.25 : 0.9;
      c.save(); c.translate(pos[0], pos[1]); c.rotate(p.rot + p.vr * pos[2] * 0.5);
      c.globalAlpha = near ? 0.62 : 0.95; c.fillStyle = p.col;
      c.fillRect(-p.w * sc / 2, -p.h * sc * Math.abs(flip) / 2 - 0.4, p.w * sc, Math.max(0.8, p.h * sc * Math.abs(flip)));
      if (flip < 0) { c.globalAlpha *= 0.35; c.fillStyle = '#fff'; c.fillRect(-p.w * sc / 2, -p.h * sc * Math.abs(flip) / 2, p.w * sc, Math.max(0.6, p.h * sc * Math.abs(flip))); }
      c.restore();
      if (p.sparkle && !near) { const tw2 = Math.max(0, Math.sin(ct * 9 + p.ph * 3)) ** 4; if (tw2 > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = tw2 * 0.8; c.drawImage(L.glowW, pos[0] - 9, pos[1] - 9, 18, 18); c.globalCompositeOperation = 'source-over'; } }
    }
    c.globalAlpha = 1;
    // streamers: ribbons that curl behind a fast head
    if (b === 1) for (let i = 0; i < conf.length; i++) {
      const p = conf[i]; if (!p.streamer) continue;
      c.strokeStyle = p.col; c.lineWidth = 2.6; c.lineCap = 'round'; c.globalAlpha = 0.9; c.beginPath();
      let started = false;
      for (let j = 0; j < 14; j++) {
        const pp = cinConfPos(p, ct - j * 0.05);
        if (!pp) break;
        const px = pp[0] + Math.sin(j * 0.9 + ct * 6 + p.ph) * (j * 1.1), py = pp[1] + Math.cos(j * 0.8 + ct * 5 + p.ph) * (j * 0.9);
        if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py);
      }
      c.stroke(); c.globalAlpha = 1;
    }
  }
  // the mortarboards: motion trails near the top of the throw, then a clean pass
  cinSet(c, V, 1.04);
  for (let i = 0; i < hats.length; i++) {
    const h = hats[i], tt = tw - h.lag;
    if (tt <= 0) continue;
    const p0 = cinHatPos(h, tt);
    if (p0[1] > 960) continue;
    if (tt < 0.7 && !REDUCED) for (let k = 2; k >= 1; k--) { const ti = Math.max(0, tt - k * 0.06); cinDrawHat(c, h, ti, 0.07 + (3 - k) * 0.04, true); }
    cinDrawHat(c, h, tt, 1, false);
  }
}

/* ====================================================================================
   light: follow spots with dust, floor pools, sun shafts, camera flashes, lamp bloom
   ==================================================================================== */
function cinSpotTarget(ct, which) {
  const gx = ct < 6.3 ? cinGradX(ct) : CIN_GRAD_END;
  if (which === 0) {                         // follows the Graduate
    if (ct < 2.5) return [310, 536];
    if (ct < 6.4) return [gx, 536];
    if (ct < 9.5) return [lerp(gx, 769, 0.6), 520];
    return [gx + Math.sin(ct * 0.7) * 40, 530];
  }
  if (ct < 6.0) return [lerp(900, 830, cnS5((ct - 2) / 3)), 536];
  if (ct < 9.5) return [lerp(830, 769, 0.5), 520];
  return [830 + Math.sin(ct * 0.6 + 2) * 50, 532];
}
function cinLight(c, V, ct) {
  const S = CN.S;
  cinSet(c, V, 1);
  const q = CN.cur, tight = V.z > 2;
  c.globalCompositeOperation = 'lighter';
  const wash = ct < 3 ? cnS5((ct - 0.6) / 1.2) : 1;
  const spots = [[300, -70, 0], [990, -70, 1]];
  const pools = [];
  for (let k = 0; k < 2; k++) {
    const sp = spots[k], t = cinSpotTarget(ct, k), ox = sp[0], oy = sp[1], tx = t[0], ty = t[1], wB = 118;
    const warm = k ? '255,236,200' : '255,244,214';
    // one fill per beam: a hot core fading to a soft edge is faked by the gradient along its length
    c.fillStyle = cnLG(c, ox, oy, tx, ty, [[0, 'rgba(' + warm + ',' + ((tight ? 0.1 : 0.2) * wash) + ')'], [0.7, 'rgba(' + warm + ',' + ((tight ? 0.06 : 0.11) * wash) + ')'], [1, 'rgba(' + warm + ',' + ((tight ? 0.04 : 0.07) * wash) + ')']]);
    c.beginPath(); c.moveTo(ox - 10, oy); c.lineTo(ox + 10, oy); c.lineTo(tx + wB, ty + 4); c.lineTo(tx - wB, ty + 4); c.closePath(); c.fill();
    // light pool on the planks
    if (ty + 40 > q.y0 && ty - 20 < q.y1) {
      c.save(); c.translate(tx, ty + 6); c.scale(1, 0.18);
      c.fillStyle = cnRG(c, 0, 0, 0, 0, 0, 150, [[0, 'rgba(' + warm + ',' + (0.2 * wash) + ')'], [0.5, 'rgba(' + warm + ',' + (0.09 * wash) + ')'], [1, 'rgba(' + warm + ',0)']]); c.beginPath(); c.arc(0, 0, 150, 0, CN_TAU); c.fill();
      c.restore();
    }
    pools.push([tx, ty, ox, oy, wB]);
  }
  // dust motes drifting in the beams
  const nm = REDUCED ? 14 : (tight ? 30 : 46);
  for (let i = 0; i < nm; i++) {
    const k = i & 1, p = pools[k], u = hash01(i, 11, 3), sd = hash01(i, 12, 4) * 2 - 1;
    const t = (u + ct * (0.012 + hash01(i, 13, 5) * 0.012)) % 1, w = lerp(8, p[4], t) * sd;
    const x = lerp(p[2], p[0], t) + w + Math.sin(ct * 0.7 + i) * 6, y = lerp(p[3], p[1], t) + Math.sin(ct * 0.5 + i * 2) * 8;
    if (x < q.x0 || x > q.x1 || y < q.y0 || y > q.y1) continue;
    c.globalAlpha = (0.25 + 0.35 * Math.sin(ct * 1.3 + i * 1.7) ** 2) * Math.min(1, t * 3) * wash;
    const r = 1.6 + hash01(i, 14, 6) * 2.4; c.drawImage(S.glowW, x - r, y - r, r * 2, r * 2);
  }
  c.globalAlpha = 1;
  // long sun shafts raking across the set (warm, very soft) - only worth the fill in wide shots
  if (V.z < 1.6) {
    const sa = 0.032 + cinGrade(ct) * 0.04;
    for (let i = 0; i < 2; i++) {
      const x0 = -60 + i * 520 + Math.sin(ct * 0.12 + i * 2) * 40;
      c.fillStyle = cnLG(c, x0, -80, x0 + 520, 760, [[0, 'rgba(255,236,190,' + sa + ')'], [1, 'rgba(255,236,190,0)']]);
      c.beginPath(); c.moveTo(x0, -80); c.lineTo(x0 + 110, -80); c.lineTo(x0 + 700, 780); c.lineTo(x0 + 460, 780); c.closePath(); c.fill();
    }
  }
  // footlight glow along the stage lip
  if (q.y1 > 590 && q.y0 < 625) {
    c.globalAlpha = 0.34 * wash;
    for (let x = CIN_FLOOR.x0 + 26; x < CIN_FLOOR.x1 - 10; x += 52) { if (x < q.x0 - 20 || x > q.x1 + 20) continue; c.drawImage(S.glowA, x - 14, 596, 28, 22); }
    c.globalAlpha = 1;
  }
  // camera flashes in the audience once the cheering starts
  if (ct > 9.8 && ct < 14.7 && !REDUCED && V.z < 1.7) {
    cinSet(c, V, 1.16);
    const tick = Math.floor(ct * 9), f = 1 - ((ct * 9) % 1);
    for (let i = 0; i < 6; i++) {
      const fx = -200 + hash01(tick + i * 31, 3, 1) * 1700, fy = 640 + hash01(tick + i * 31, 5, 2) * 120, sz = 46 + hash01(i, tick, 3) * 40;
      c.globalAlpha = f * 0.9; c.drawImage(S.glowW, fx - sz, fy - sz, sz * 2, sz * 2);
      c.globalAlpha = f * 0.5; c.fillStyle = 'rgba(255,255,255,1)'; c.fillRect(fx - sz * 0.9, fy - 0.7, sz * 1.8, 1.4); c.fillRect(fx - 0.7, fy - sz * 0.9, 1.4, sz * 1.8);
    }
    c.globalAlpha = 1;
  }
  // bloom on the street lamps
  if (V.z < 1.4) {
    cinSet(c, V, 0.9);
    c.globalAlpha = 0.5;
    [[76, 254], [116, 254], [1170, 254], [1210, 254], [-320, 278], [-280, 278], [1480, 278], [1520, 278]].forEach(p => c.drawImage(S.glowW, p[0] - 40, p[1] - 40, 80, 80));
    c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';
}

/* sun flare in screen space */
function cinFlare(c, V, ct) {
  if (ct > 14.5) return;
  const S = CN.S, sp = cinToScreen(V, 0.35, CIN_SUN.x, CIN_SUN.y), pw = V.pw, ph = V.ph;
  const sx = sp[0], sy = sp[1];
  const mx = pw * 0.15, my = ph * 0.15;
  const vis = clamp((sx + pw * 0.2) / (pw * 0.3), 0, 1) * clamp((pw * 1.2 - sx) / (pw * 0.3), 0, 1) * clamp((sy + ph * 0.2) / (ph * 0.3), 0, 1) * clamp((ph * 1.1 - sy) / (ph * 0.3), 0, 1);
  const flare = vis * (ct < 0.8 ? 0 : 1) * (REDUCED ? 0.5 : 1) * (1 - (CN.stillA || 0));
  if (flare < 0.02) return;
  const k = V.k, cx = pw / 2, cy = ph / 2;
  c.globalCompositeOperation = 'lighter';
  const fade = Math.min(1, flare);
  // big warm bloom and anamorphic streak
  c.globalAlpha = 0.35 * fade; c.drawImage(S.glowW, sx - 260 * k, sy - 260 * k, 520 * k, 520 * k);
  c.globalAlpha = 0.13 * fade; c.drawImage(S.streak, sx - 520 * k, sy - 10 * k, 1040 * k, 20 * k);
  // ghosts along the axis through the centre of the frame
  const gh = [[0.5, 60, 'glowB', 0.12], [0.85, 36, 'glowA', 0.12], [1.25, 90, 'glowR', 0.08], [1.6, 46, 'glowB', 0.1], [2.0, 120, 'glowA', 0.06]];
  gh.forEach(g => { const gx = lerp(sx, cx, g[0]) + (cx - sx) * (g[0] - 1) * 0 + 0, gy = lerp(sy, cy, g[0]); const gxx = sx + (cx - sx) * g[0] * 1.0, gyy = sy + (cy - sy) * g[0] * 1.0; c.globalAlpha = g[3] * fade; c.drawImage(S[g[2]], gxx - g[1] * k, gyy - g[1] * k, g[1] * 2 * k, g[1] * 2 * k); });
  c.globalAlpha = 0.22 * fade; const rx = sx + (cx - sx) * 1.5, ry = sy + (cy - sy) * 1.5; c.drawImage(S.ring, rx - 80 * k, ry - 80 * k, 160 * k, 160 * k);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* ====================================================================================
   the two black cards ("Diploma in hand." / "Now, what does it say?") - the text itself is HTML
   ==================================================================================== */
function cinCards(c, V, ct) {
  const pw = V.pw, ph = V.ph, S = CN.S, u = ct - 15.4;
  c.setTransform(1, 0, 0, 1, 0, 0);
  const breath = REDUCED ? 0 : Math.sin(u * 0.9) * 0.5 + 0.5;
  // illustrated sunset still behind the cards, when it exists
  const shot = CUT_SHOTS.find(s => s.card), img = shot && ART.on ? ART.get(shot.k) : null;
  c.fillStyle = '#04060c'; c.fillRect(0, 0, pw, ph);
  if (img) {
    const e = clamp(u / 4.3, 0, 1), al = cnS5(u / 0.8);
    c.globalAlpha = al; ART.cover(c, img, 0, 0, pw, ph, lerp(shot.fx0, shot.fx1, e), lerp(shot.fy0, shot.fy1, e), lerp(shot.z0, shot.z1, e)); c.globalAlpha = 1;
    c.fillStyle = 'rgba(4,6,14,' + (0.38 + breath * 0.08) + ')'; c.fillRect(0, 0, pw, ph);
  } else {
    c.fillStyle = cnRG(c, pw * 0.5, ph * 0.62, 0, pw * 0.5, ph * 0.62, Math.max(pw, ph) * 0.62, [[0, '#1a2a4a'], [0.45, '#0d1628'], [1, '#02030a']]); c.fillRect(0, 0, pw, ph);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = cnRG(c, pw * 0.5, ph * 0.5, 0, pw * 0.5, ph * 0.5, Math.max(pw, ph) * 0.4, [[0, 'rgba(240,180,41,' + (0.10 + breath * 0.03) + ')'], [1, 'rgba(240,180,41,0)']]); c.fillRect(0, 0, pw, ph);
    // slow golden motes rising
    const n = REDUCED ? 14 : 44;
    for (let i = 0; i < n; i++) {
      const x = hash01(i, 21, 1) * pw + Math.sin(ct * 0.4 + i) * 14, y = ph - ((hash01(i, 22, 2) * ph + (ct - 15.4) * (10 + hash01(i, 23, 3) * 16)) % ph), r = (1.4 + hash01(i, 24, 4) * 2.6) * V.k;
      c.globalAlpha = (0.12 + 0.3 * Math.sin(ct * 1.1 + i * 1.9) ** 2) * cnS5(u / 1.2); c.drawImage(S.glowA, x - r * 4, y - r * 4, r * 8, r * 8);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  // the rolled diploma, drifting between the two cards
  const dk = cnS5((ct - 16.2) / 0.9);
  if (dk > 0.01) {
    const sc = ph / 720 * 1.9, glow = 0.5 + 0.5 * Math.sin(ct * 1.5), cx = pw / 2, cy = ph * (V.portrait ? 0.7 : 0.72) + Math.sin(ct * 0.8) * 4 * V.k;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.2 + glow * 0.1) * dk; c.drawImage(S.glowA, cx - 130 * sc, cy - 90 * sc, 260 * sc, 180 * sc); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = dk; cinDiploma(c, cx, cy, -0.35 + Math.sin(ct * 0.7) * 0.05, sc, 0.4); c.globalAlpha = 1;
  }
  // fade in from the white-out/black
  const f = 1 - cnS5(u / 0.5); if (f > 0) { c.fillStyle = 'rgba(0,0,0,' + f.toFixed(3) + ')'; c.fillRect(0, 0, pw, ph); }
}
