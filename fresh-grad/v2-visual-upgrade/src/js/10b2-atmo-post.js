// ============================ v2 atmosphere passes ============================
// Bloom, golden-hour light shafts and dust, lens flare, the wet-street look, soft shadows and the CSS post layers.
// Heavy passes work on small offscreen canvases that are allocated once and resized only when the view changes, and
// every one of them is skipped when it cannot be seen (time of day, weather) or when the quality tuner steps down.
FX.refl = [];
function atmoTier() { return REDUCED ? 1 : (QUAL.cap < 0.8 ? 0 : 2); }
/* stand-ins for passes that run indoors, where there is no weather and no street to light */
const ATMO_IN = { rain: 0, fog: 0, snow: 0, warm: 0, sh: 0, cloud: 0 };
const ATMO_NOVIS = { trees: [], poles: [], bld: [], people: [], cars: [] };

/* soft sprites: a headlight cone with soft edges, cloud shadows, a snow flake, a puff of steam, flare pieces */
const BEAM2 = atmoSprite(192, 120, (g, w, h) => {
  const m = document.createElement('canvas'); m.width = w; m.height = h;
  const mg = m.getContext('2d'); mg.globalCompositeOperation = 'lighter'; mg.fillStyle = 'rgba(255,255,255,.1)';
  for (let i = 0; i < 10; i++) { const t = Math.tan(lerp(0.4, 0.09, i / 9)); mg.beginPath(); mg.moveTo(0, 60); mg.lineTo(w, 60 - w * t); mg.lineTo(w, 60 + w * t); mg.closePath(); mg.fill(); }
  const gr = g.createRadialGradient(0, 60, 0, 0, 60, w);
  gr.addColorStop(0, 'rgba(255,246,218,1)'); gr.addColorStop(0.28, 'rgba(255,238,194,.55)'); gr.addColorStop(0.65, 'rgba(255,232,184,.16)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(m, 0, 0);
});
const PUFF = atmoSprite(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});
const CSH = [0, 1, 2].map(i => atmoSprite(512, 256, (g) => {
  const r = mulberry32(900 + i * 13);
  for (let k = 0; k < 7; k++) {
    const x = 120 + r() * 270, y = 100 + r() * 60, rd = 70 + r() * 60;
    const gr = g.createRadialGradient(x, y, rd * 0.15, x, y, rd);
    gr.addColorStop(0, 'rgba(10,18,44,.9)'); gr.addColorStop(0.6, 'rgba(10,18,44,.55)'); gr.addColorStop(1, 'rgba(10,18,44,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rd * 1.25, rd * 0.8, 0, 0, 7); g.fill();
  }
}));
const FLARE = {
  disc: atmoSprite(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }),
  ring: atmoSprite(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 34, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }),
  streak: atmoSprite(256, 16, (g) => { const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 6, 256, 4); const v = g.createRadialGradient(128, 8, 0, 128, 8, 8); v.addColorStop(0, 'rgba(255,255,255,.8)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(100, 0, 56, 16); })
};

/* ---------- bloom and light shafts, composited once at the end ---------- */
const GLW = { a: document.createElement('canvas'), b: document.createElement('canvas'), s: document.createElement('canvas'), q: document.createElement('canvas'), w: 0, h: 0 };
GLW.ca = GLW.a.getContext('2d'); GLW.cb = GLW.b.getContext('2d'); GLW.cs = GLW.s.getContext('2d'); GLW.cq = GLW.q.getContext('2d');
function atmoGlow(c, cv, m, A, vis, sky) {
  const tier = atmoTier(), nf = FX.nf, on = Math.min(1, nf * 1.3), G2 = FX.glows, E = FX.emit;
  const bloomK = tier > 0 && on > 0.03 && (G2.length || E.length) ? 0.55 * Math.pow(on, 1.6) * (1 + A.rain * 0.5 + A.fog * 0.9 + (A.snow || 0) * 0.2) : 0;
  const shaftK = tier > 0 && sky ? A.warm * A.sh * (1 - A.cloud * 0.9) * (1 - A.rain) * (1 - nf * 0.8) : 0;
  if (bloomK < 0.02 && shaftK < 0.03) return;
  const bw = Math.ceil(cv.width / 8), bh = Math.ceil(cv.height / 8), aw = bw * 2, ah = bh * 2, qw = Math.max(1, Math.ceil(bw / 2)), qh = Math.max(1, Math.ceil(bh / 2));
  if (GLW.w !== cv.width || GLW.h !== cv.height) {
    GLW.w = cv.width; GLW.h = cv.height; GLW.a.width = aw; GLW.a.height = ah; GLW.b.width = bw; GLW.b.height = bh; GLW.s.width = bw; GLW.s.height = bh; GLW.q.width = qw; GLW.q.height = qh;
  }
  const ga = GLW.ca, gb = GLW.cb, gs = GLW.cs, gq = GLW.cq;
  gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'source-over'; gb.globalAlpha = 1; gb.clearRect(0, 0, bw, bh);
  if (bloomK > 0.02) {
    ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-over'; ga.globalAlpha = 1; ga.clearRect(0, 0, aw, ah);
    const mq = m / 4; ga.setTransform(mq, 0, 0, mq, -CAM.x * mq, -CAM.y * mq); ga.globalCompositeOperation = 'lighter';
    ga.fillStyle = 'rgb(255,226,170)';
    for (let i = 0; i < G2.length; i += 5) { ga.globalAlpha = G2[i + 2] * G2[i + 3] > 2400 ? 0.12 : 0.55; ga.fillRect(G2[i] - 1.5, G2[i + 1] - 1.5, G2[i + 2] + 3, G2[i + 3] + 3); }
    for (let i = 0; i < E.length; i += 5) { ga.globalAlpha = Math.min(1, E[i + 4] * 0.42); ga.drawImage(GLOW[E[i + 3]], E[i] - E[i + 2] * 1.2, E[i + 1] - E[i + 2] * 1.2, E[i + 2] * 2.4, E[i + 2] * 2.4); }
    ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalCompositeOperation = 'source-over'; ga.globalAlpha = 1;
    gb.imageSmoothingEnabled = true; gb.globalAlpha = Math.min(1, bloomK); gb.drawImage(GLW.a, 0, 0, aw, ah, 0, 0, bw, bh); gb.globalAlpha = 1;
    gq.setTransform(1, 0, 0, 1, 0, 0); gq.clearRect(0, 0, qw, qh); gq.imageSmoothingEnabled = true; gq.drawImage(GLW.b, 0, 0, bw, bh, 0, 0, qw, qh);
    gb.globalCompositeOperation = 'lighter'; gb.globalAlpha = 0.9; gb.drawImage(GLW.q, 0, 0, qw, qh, 0, 0, bw, bh);
    gb.globalAlpha = 1; gb.globalCompositeOperation = 'source-over';
  }
  if (shaftK > 0.03) {
    gs.setTransform(1, 0, 0, 1, 0, 0); gs.globalCompositeOperation = 'source-over'; gs.globalAlpha = 1; gs.clearRect(0, 0, bw, bh);
    const mq = m / 8, tm = REDUCED ? 0 : FX.time, dx = FX.sh.dx, dy = FX.sh.dy, ln = Math.hypot(dx, dy) || 1, vx = dx / ln, vy = dy / ln;
    gs.setTransform(mq, 0, 0, mq, -CAM.x * mq, -CAM.y * mq); gs.globalCompositeOperation = 'lighter';
    const x0 = CAM.x - 40, x1 = CAM.x + CAM.vw + 40, y0 = CAM.y - 40, y1 = CAM.y + CAM.vh + 40, sc = FX.sunc || [255, 214, 150];
    const u0 = x0 * vy - y0 * vx, u1 = x1 * vy - y0 * vx, u2 = x0 * vy - y1 * vx, u3 = x1 * vy - y1 * vx;
    const umin = Math.min(u0, u1, u2, u3), umax = Math.max(u0, u1, u2, u3);
    const t0 = Math.min(x0 * vx + y0 * vy, x1 * vx + y0 * vy, x0 * vx + y1 * vy, x1 * vx + y1 * vy), t1 = Math.max(x0 * vx + y0 * vy, x1 * vx + y0 * vy, x0 * vx + y1 * vy, x1 * vx + y1 * vy);
    const nx = vy, ny = -vx, S0 = 140;
    for (let k = Math.floor(umin / S0); k <= Math.ceil(umax / S0); k++) {
      if (hash01(k, 7, 3) < 0.42) continue;
      const u = k * S0 + (hash01(k, 2, 9) - 0.5) * S0 * 0.5, w = 26 + hash01(k, 5, 1) * 74, al = (0.4 + hash01(k, 8, 2) * 0.6) * (0.82 + 0.18 * Math.sin(tm * 0.35 + k * 1.7));
      const cx = u * vy + ((t0 + t1) / 2) * vx, cy = -u * vx + ((t0 + t1) / 2) * vy;
      const g0 = gs.createLinearGradient(cx - nx * w / 2, cy - ny * w / 2, cx + nx * w / 2, cy + ny * w / 2);
      const col = Math.round(sc[0]) + ',' + Math.round(sc[1]) + ',' + Math.round(sc[2]);
      g0.addColorStop(0, 'rgba(' + col + ',0)'); g0.addColorStop(0.5, 'rgba(' + col + ',' + (0.4 * al * shaftK).toFixed(3) + ')'); g0.addColorStop(1, 'rgba(' + col + ',0)');
      gs.fillStyle = g0; gs.beginPath();
      const ax = u * vy + t0 * vx, ay = -u * vx + t0 * vy, bx = u * vy + t1 * vx, by = -u * vx + t1 * vy;
      gs.moveTo(ax - nx * w / 2, ay - ny * w / 2); gs.lineTo(bx - nx * w / 2, by - ny * w / 2); gs.lineTo(bx + nx * w / 2, by + ny * w / 2); gs.lineTo(ax + nx * w / 2, ay + ny * w / 2); gs.closePath(); gs.fill();
    }
    // narrow beams slip through the tree canopies
    for (const t of vis.trees) {
      const sd = dx > 0 ? -1 : 1, px = t.x + sd * t.r * 0.35, py = t.y - 56, L = 96, w2 = 11;
      const ex = px + vx * L, ey = py + vy * L, g1 = gs.createLinearGradient(px, py, ex, ey);
      const col = Math.round(sc[0]) + ',' + Math.round(sc[1]) + ',' + Math.round(sc[2]);
      g1.addColorStop(0, 'rgba(' + col + ',' + (0.2 * shaftK).toFixed(3) + ')'); g1.addColorStop(1, 'rgba(' + col + ',0)');
      gs.fillStyle = g1; gs.beginPath(); gs.moveTo(px - nx * 3, py - ny * 3); gs.lineTo(px + nx * 3, py + ny * 3); gs.lineTo(ex + nx * w2, ey + ny * w2); gs.lineTo(ex - nx * w2, ey - ny * w2); gs.closePath(); gs.fill();
    }
    // fade the shafts in from the top of the picture and out toward the bottom
    gs.setTransform(1, 0, 0, 1, 0, 0); gs.globalCompositeOperation = 'destination-in';
    const vf = gs.createLinearGradient(0, 0, 0, bh); vf.addColorStop(0, 'rgba(0,0,0,.1)'); vf.addColorStop(0.3, 'rgba(0,0,0,.85)'); vf.addColorStop(0.7, 'rgba(0,0,0,.7)'); vf.addColorStop(1, 'rgba(0,0,0,.15)');
    gs.fillStyle = vf; gs.fillRect(0, 0, bw, bh); gs.globalCompositeOperation = 'source-over';
    gb.globalCompositeOperation = 'lighter'; gb.globalAlpha = 1; gb.drawImage(GLW.s, 0, 0); gb.globalCompositeOperation = 'source-over';
  }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.globalAlpha = 1;
  c.drawImage(GLW.b, 0, 0, bw, bh, 0, 0, bw * 8, bh * 8);
  // dust motes turning in the light
  if (shaftK > 0.1 && !REDUCED && tier > 1) {
    const tm = FX.time, W = cv.width, H = cv.height, sc = FX.sunc || [255, 214, 150];
    c.fillStyle = 'rgb(' + Math.round(sc[0]) + ',' + Math.round(sc[1]) + ',' + Math.round(sc[2]) + ')';
    for (let i = 0; i < 30; i++) {
      const px = ((hash01(i, 1, 1) * W + tm * (3 + (i % 5) * 2) * m * 0.4) % W), py = (hash01(i, 2, 2) * H * 0.9 + H * 0.05 + Math.sin(tm * 0.6 + i * 1.7) * 9 * m * 0.5);
      c.globalAlpha = shaftK * (0.18 + 0.5 * Math.abs(Math.sin(tm * 1.2 + i * 2.3)));
      const s2 = (0.9 + hash01(i, 3, 3) * 1.3) * m * 0.7; c.fillRect(px, py, s2, s2);
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* lens flare ghosts when the sun is on screen */
function atmoFlare(c, cv, m, A) {
  if (!A.sunUp || A.cloud > 0.75 || A.rain > 0.2 || atmoTier() < 1) return;
  const sp = skySunPos(A, CAM.x, CAM.vw), px = (sp.x - CAM.x) * m, py = (sp.y - CAM.y) * m, W = cv.width, H = cv.height;
  if (px < -W * 0.2 || px > W * 1.2 || py < -H * 0.2 || py > H * 1.1) return;
  // strongest when the sun is well inside the picture, fading at the borders
  const ex = 1 - clamp(Math.max(Math.abs(px / W - 0.5) - 0.38, Math.abs(py / H - 0.4) - 0.4) * 5, 0, 1), k = ex * (1 - A.cloud) * 0.8 * clamp((TOP_Y - 120 - sp.y) / 50, 0, 1);
  if (k < 0.03) return;
  const sc = FX.sunc || [255, 230, 190], cx = W / 2, cy = H / 2, vx = cx - px, vy = cy - py;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
  const col = [[255, 190, 120], [160, 210, 255], [255, 150, 200], [255, 240, 190], [140, 255, 200]];
  c.globalAlpha = 0.34 * k; c.drawImage(FLARE.streak, px - 230 * m * 0.5, py - 10 * m * 0.5, 460 * m * 0.5, 20 * m * 0.5);
  const T = [0.32, 0.55, 0.9, 1.25, 1.65], R = [26, 14, 36, 18, 44];
  for (let i = 0; i < T.length; i++) {
    const x = px + vx * T[i], y = py + vy * T[i], r = R[i] * Math.max(1, m * 0.7);
    c.globalAlpha = (i === 2 ? 0.16 : 0.1) * k; c.drawImage(i % 2 ? FLARE.ring : FLARE.disc, x - r, y - r, r * 2, r * 2);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* ---------- the wet look ---------- */
function atmoWetGround(c, A, vx0, vy0, vx1, vy1) {
  const wet = A.wet, rain = A.rain;
  if (wet < 0.03 && rain < 0.03) return;
  const tm = REDUCED ? 0 : FX.time, w = Math.max(wet, rain * 0.8), sky = mix3(A.bot, A.top, 0.3);
  // asphalt darkens and picks up a cool sheen of the sky
  const sheen = (x, y, cw, ch, vert) => {
    c.fillStyle = 'rgba(12,20,40,' + (0.16 * w).toFixed(3) + ')'; c.fillRect(x, y, cw, ch);
    const g = vert ? c.createLinearGradient(x, 0, x + cw, 0) : c.createLinearGradient(0, y, 0, y + ch);
    g.addColorStop(0, rgbaS(sky, 0.02 * w)); g.addColorStop(0.5, rgbaS(sky, (0.1 + 0.1 * (1 - FX.nf)) * w)); g.addColorStop(1, rgbaS(sky, 0.02 * w));
    c.fillStyle = g; c.fillRect(x, y, cw, ch);
  };
  for (const r of ROADS_H) { const y0 = Math.max(r.y, vy0), y1 = Math.min(r.y + r.h, vy1); if (y1 > y0) sheen(vx0, r.y, vx1 - vx0, r.h, false); }
  for (const cx of STREETS_X) { const xa = cx - STREET_W / 2, xb = cx + STREET_W / 2; if (xb > vx0 && xa < vx1) sheen(xa, TOP_Y, STREET_W, PARK_Y - TOP_Y, true); }
  // puddles: rings that spread and fade
  if (rain > 0.05 && !REDUCED) {
    c.lineWidth = 1;
    for (const p of PUDDLES) {
      if (p.x < vx0 - 60 || p.x > vx1 + 60 || p.y < vy0 - 30 || p.y > vy1 + 30) continue;
      for (let k = 0; k < 2; k++) {
        const ph = (tm * 1.3 + p.p + k * 0.5) % 1, s = Math.floor(tm * 1.3 + p.p + k * 0.5);
        const ox = (hash01(s, Math.round(p.x), k) - 0.5) * p.rx * 1.2, oy = (hash01(s, Math.round(p.y), k + 3) - 0.5) * p.ry * 1.2;
        c.strokeStyle = 'rgba(235,245,255,' + ((1 - ph) * 0.5 * rain).toFixed(3) + ')';
        c.beginPath(); c.ellipse(p.x + ox, p.y + oy, 1 + ph * 10, 0.4 + ph * 3.6, 0, 0, 7); c.stroke();
        if (ph < 0.35) { c.beginPath(); c.ellipse(p.x + ox, p.y + oy, 0.5 + ph * 5, 0.2 + ph * 1.8, 0, 0, 7); c.stroke(); }
      }
    }
    // splashes on road and pavement across the picture
    const n = Math.round(46 * rain * (atmoTier() > 1 ? 1 : 0.5)), strips = [[BAND1 + 4, ROAD1.y + ROAD1.h + 46], [BAND2 + 4, ROAD2.y + ROAD2.h + 50]];
    c.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      const life = 0.42, u = (tm / life + i * 0.37) % 1, seed = Math.floor(tm / life + i * 0.37);
      const st = strips[i % 2], ya = Math.max(st[0], vy0), yb = Math.min(st[1], vy1);
      if (yb <= ya) continue;
      const x = vx0 + hash01(seed, i, 11) * (vx1 - vx0), y = ya + hash01(seed, i, 12) * (yb - ya);
      c.strokeStyle = 'rgba(225,238,255,' + ((1 - u) * 0.55 * rain).toFixed(3) + ')';
      c.beginPath(); c.ellipse(x, y, 0.8 + u * 4.2, 0.3 + u * 1.5, 0, 0, 7); c.stroke();
      if (u < 0.3) { c.beginPath(); c.moveTo(x - 1.5, y); c.lineTo(x - 2.5, y - 3.5 * (1 - u * 3)); c.moveTo(x + 1.5, y); c.lineTo(x + 2.6, y - 3 * (1 - u * 3)); c.stroke(); }
    }
  }
}
/* mirrored smears of lamps, traffic lights and headlights, added over the finished night picture */
function atmoWetReflect(c, m, A, vis) {
  const wet = A.wet; if (wet < 0.08 || FX.nf < 0.12 || atmoTier() < 1) return;
  const on = Math.min(1, FX.nf * 1.2) * wet, R = FX.refl;
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m); c.globalCompositeOperation = 'lighter';
  for (const p of vis.poles) { if (p.h !== 58) continue; c.globalAlpha = 0.34 * on; c.drawImage(GLOW[0], p.x - 8, p.y + 6, 16, 110); c.globalAlpha = 0.16 * on; c.drawImage(GLOW[0], p.x - 20, p.y + 8, 40, 60); }
  for (let i = 0; i < R.length; i += 5) { c.globalAlpha = Math.min(1, R[i + 3] * on); c.drawImage(GLOW[R[i + 2]], R[i] - R[i + 4] * 0.5, R[i + 1], R[i + 4], R[i + 4] * 3.4); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.setTransform(1, 0, 0, 1, 0, 0);
}

/* drips fall from the lamp heads in steady rain */
function atmoDrips(c, m, A, vis) {
  if (A.rain < 0.1 || REDUCED) return;
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m); c.fillStyle = 'rgba(214,232,255,.8)';
  for (const p of vis.poles) {
    if (p.h !== 58) continue;
    for (let k = 0; k < 2; k++) { const ph = (FX.time * 1.5 + p.x * 0.013 + k * 0.5) % 1; c.globalAlpha = (1 - ph) * 0.8 * A.rain; c.beginPath(); c.ellipse(p.x + (k ? 4.5 : -4.5), p.y - 52 + ph * ph * 40, 0.7, 1.5, 0, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- drifting cloud shadows and dappled leaf shade ---------- */
function atmoCloudShadows(c, A, vx0, vy0, vx1, vy1) {
  if (!(A.sh > 0.05 || A.cloud > 0.3)) return;
  const a = 0.17 * (1 - A.nf) * (0.6 + A.cloud * 0.6), tm = REDUCED ? 0 : FX.time;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 613 + tm * (9 + i * 1.6)) % (WORLD.w + 900)) - 450, y = TOP_Y + 180 + ((i * 347) % 1500), w = 700, h = 350;
    if (x + w / 2 < vx0 || x - w / 2 > vx1 || y + h / 2 < vy0 || y - h / 2 > vy1) continue;
    c.globalAlpha = a; c.drawImage(CSH[i % 3], x - w / 2, y - h / 2, w, h);
  }
  c.globalAlpha = 1;
}
function atmoDapple(c, vis, A) {
  const sh = FX.sh; if (sh.a < 0.1 || !vis.trees.length || A.nf > 0.5) return;
  const tm = REDUCED ? 0 : FX.time, dx = sh.dx, dy = sh.dy, sc = FX.sunc || [255, 244, 214];
  c.fillStyle = 'rgba(' + Math.round(sc[0]) + ',' + Math.round(sc[1]) + ',' + Math.round(sc[2]) + ',' + clamp(sh.a * 0.85, 0, 0.3).toFixed(3) + ')';
  c.beginPath();
  for (const t of vis.trees) {
    const ex = t.x + dx * 30, ey = t.y + dy * 18, rx = t.r * 0.95, ry = t.r * 0.46;
    for (let i = 0; i < 9; i++) {
      const a = hash01(Math.round(t.x), i, 5) * 6.283, d = Math.sqrt(hash01(Math.round(t.y), i, 6)) * 0.9, wob = Math.sin(tm * 0.9 + i * 2.1 + t.x) * 1.4 * (0.4 + FX.wind);
      const px = ex + Math.cos(a) * rx * d + wob, py = ey + Math.sin(a) * ry * d, s = 1.3 + hash01(i, Math.round(t.x), 7) * 2.2;
      c.moveTo(px + s * 1.5, py); c.ellipse(px, py, s * 1.5, s * 0.8, 0, 0, 6.2832);
    }
  }
  c.fill();
}

/* ---------- CSS post layers: grain and a very light tilt-shift on the top and bottom edges ---------- */
const ATMO_DOM = (function () {
  try {
    const st = document.getElementById('stage'), vig = document.getElementById('vig');
    if (!st || !vig) return null;
    const mk = id => { const d = document.createElement('div'); d.id = id; d.setAttribute('aria-hidden', 'true'); st.insertBefore(d, vig.nextSibling); return d; };
    const tb = mk('atmoTiltB'), tt = mk('atmoTiltT'), gr = mk('atmoGrain');
    // a small tile of fine noise, made once
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), im = g.createImageData(128, 128), r = mulberry32(2024);
    for (let i = 0; i < im.data.length; i += 4) { const v = 96 + Math.floor(r() * 64); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    gr.style.backgroundImage = 'url(' + cv.toDataURL('image/png') + ')';
    return { st, tb, tt, gr };
  } catch (e) { return null; }
})();
