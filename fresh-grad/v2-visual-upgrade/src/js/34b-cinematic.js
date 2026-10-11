/* ============================ cinematic core ============================
   A virtual camera (cinCam) shoots a layered set. World space is the 1280x720 stage of the original shot; layers sit at a depth
   (0.1 far .. 1 action plane .. 1.7 foreground) and move/zoom by that fraction of the camera, which gives parallax for free.
   Everything static is baked once into offscreen canvases (cinBuild); per frame we only blit them and animate the live bits. */
const CN = { built: false, L: {}, S: {}, hasFilter: false, dirty: false, res: 1, slow: 0, V: null, tn: 0, frameMs: 16 };
const CN_TAU = Math.PI * 2;
const cnS5 = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

/* ---------- small helpers (own copies so this pass never depends on another pass's helpers) ---------- */
const CN_RGB = {};
function cnRgb(h) {
  let v = CN_RGB[h];
  if (v) return v;
  if (h.charAt(0) === 'r') { const m = h.match(/[\d.]+/g) || [0, 0, 0]; v = [+m[0], +m[1], +m[2]]; return (CN_RGB[h] = v); }   // "rgb(r,g,b)" results of cnMix / cnShade
  let s = h.charAt(0) === '#' ? h.slice(1) : h;
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  v = [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return (CN_RGB[h] = v);
}
function cnMix(a, b, t) {
  const A = cnRgb(a), B = cnRgb(b);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
}
function cnShade(h, t) { return t >= 0 ? cnMix(h, '#ffffff', t) : cnMix(h, '#000000', -t); }
function cnRgba(h, a) { const A = cnRgb(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
function cnMk(w, h) { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; }
function cnLG(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
  return gr;
}
function cnRG(g, x0, y0, r0, x1, y1, r1, stops) {
  const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
  return gr;
}
function cnRR(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function cnEll(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, CN_TAU); }
/* a bake canvas that draws in world units: layer {cv, x, y, w, h}; sc = pixels per world unit */
function cnLayer(x, y, w, h, sc, fn) {
  const cv = cnMk(w * sc, h * sc), g = cv.getContext('2d');
  g.scale(cv.width / w, cv.height / h); g.translate(-x, -y);
  fn(g);
  return { cv, x, y, w, h };
}
/* soft copy of a canvas: real blur when ctx.filter exists, otherwise a down/up-sample (good enough for bokeh-ish depth of field) */
function cnSoften(src, px) {
  const out = cnMk(src.width, src.height), g = out.getContext('2d');
  if (CN.hasFilter) { g.filter = 'blur(' + px + 'px)'; g.drawImage(src, 0, 0); g.filter = 'none'; return out; }
  const f = Math.max(2, Math.round(px * 1.2));
  const a = cnMk(src.width / f, src.height / f); a.getContext('2d').drawImage(src, 0, 0, a.width, a.height);
  const b = cnMk(a.width / 2, a.height / 2); b.getContext('2d').drawImage(a, 0, 0, b.width, b.height);
  g.imageSmoothingQuality = 'high'; g.drawImage(b, 0, 0, out.width, out.height);
  return out;
}
function cnSoftLayer(L, px) { return { cv: cnSoften(L.cv, px * (L.cv.width / L.w)), x: L.x, y: L.y, w: L.w, h: L.h }; }
function cnBlit(c, L, a) {
  // draw only the part of the layer that is inside the current view (cheap in software canvases)
  const v = CN.cur;
  let x0 = L.x, y0 = L.y, x1 = L.x + L.w, y1 = L.y + L.h;
  if (v) { x0 = Math.max(x0, v.x0); y0 = Math.max(y0, v.y0); x1 = Math.min(x1, v.x1); y1 = Math.min(y1, v.y1); if (x1 <= x0 || y1 <= y0) return; }
  const fx = L.cv.width / L.w, fy = L.cv.height / L.h;
  let sx = Math.floor((x0 - L.x) * fx), sy = Math.floor((y0 - L.y) * fy);
  const ex = Math.min(L.cv.width, Math.ceil((x1 - L.x) * fx)), ey = Math.min(L.cv.height, Math.ceil((y1 - L.y) * fy));
  const sw = ex - sx, sh = ey - sy;
  if (sw <= 0 || sh <= 0) return;
  if (a != null && a < 1) c.globalAlpha = a;
  c.drawImage(L.cv, sx, sy, sw, sh, L.x + sx / fx, L.y + sy / fy, sw / fx, sh / fy);
  if (a != null && a < 1) c.globalAlpha = 1;
}
/* radial glow sprite (white, additive friendly) */
function cnGlowSprite(col, size) {
  const cv = cnMk(size, size), g = cv.getContext('2d'), h = size / 2;
  g.fillStyle = cnRG(g, h, h, 0, h, h, h, [[0, cnRgba(col, 1)], [0.2, cnRgba(col, 0.7)], [0.5, cnRgba(col, 0.22)], [0.8, cnRgba(col, 0.05)], [1, cnRgba(col, 0)]]);
  g.fillRect(0, 0, size, size);
  return cv;
}

/* ---------- fonts used on the canvas: ask for them early and re-bake the banner once they arrive ---------- */
function cinFonts() {
  try {
    if (!document.fonts || !document.fonts.load) return;
    const want = ['800 40px "Bricolage Grotesque"', '700 28px "Fraunces"', 'italic 600 28px "Fraunces"', '500 18px "DM Mono"'];
    Promise.all(want.map(f => document.fonts.load(f))).then(() => { CN.fontsOk = true; if (CN.built) CN.dirty = true; }).catch(() => { });
  } catch (e) { /* fonts are optional */ }
}
cinFonts();
const CN_SERIF = '"Fraunces","Iowan Old Style","Palatino Linotype",Georgia,serif';
const CN_DISPLAY = '"Bricolage Grotesque","Trebuchet MS",system-ui,sans-serif';
const CN_MONO = '"DM Mono",ui-monospace,Menlo,Consolas,monospace';

/* ====================================================================================
   CAMERA
   keys: [t, x, y, zoom, roll(deg), tangent]  - Hermite spline through them (tangent 0 = the camera comes to rest there)
   ==================================================================================== */
const CIN_KEYS = [
  [0.0, 560, 262, 0.80, 0, 0],
  [1.6, 596, 298, 0.82, 0, 1],
  [3.3, 600, 392, 0.92, 0, 1],
  [4.6, 520, 372, 1.06, 0, 1],
  [5.7, 650, 366, 1.20, 0, 1],
  [6.35, 758, 432, 1.52, 0, 0.6],
  [6.95, 768, 448, 3.1, 0, 0],
  [8.15, 770, 452, 3.4, 0, 0],
  [9.0, 764, 424, 1.62, 0, 0.5],
  [9.9, 722, 348, 1.32, 0, 0.5],
  [10.3, 710, 358, 1.38, 0, 0.3],
  [10.78, 640, 704, 1.62, 0.4, 0],
  [11.05, 648, 698, 1.7, 0.2, 0],
  [11.5, 692, 356, 1.42, -0.3, 0.3],
  [11.7, 690, 352, 1.40, -0.4, 0.2],
  [13.0, 640, 362, 0.86, 0.6, 0.6],
  [14.6, 628, 372, 0.82, 0.2, 0.2],
  [19.6, 628, 372, 0.82, 0, 0]
];
function cinSpline(K, t) {
  const n = K.length;
  if (t <= K[0][0]) return K[0].slice(1, 5);
  if (t >= K[n - 1][0]) return K[n - 1].slice(1, 5);
  let i = 0;
  while (i < n - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], dt = b[0] - a[0], u = (t - a[0]) / dt;
  const pa = K[Math.max(0, i - 1)], pb = K[Math.min(n - 1, i + 2)];
  const out = [];
  const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  for (let q = 1; q <= 4; q++) {
    const ma = (b[q] - pa[q]) / (b[0] - pa[0]) * a[5];
    const mb = (pb[q] - a[q]) / (pb[0] - a[0]) * b[5];
    out.push(h00 * a[q] + h10 * dt * ma + h01 * b[q] + h11 * dt * mb);
  }
  return out;
}
/* where the Graduate stands, as a pure function of time (shared by camera, figures and sound) */
function cinGradX(ct) {
  const w = clamp((ct - 2.6) / 3.7, 0, 1);
  // ease in, steady stride, ease out
  const a = 0.22, b = 0.78, v = 1 / (1 - a / 2 - (1 - b) / 2);
  let p;
  if (w < a) p = v * w * w / (2 * a);
  else if (w < b) p = v * (a / 2 + (w - a));
  else p = v * (a / 2 + (b - a) + ((w - b) - (w - b) * (w - b) / (2 * (1 - b))));
  return lerp(214, 712, clamp(p, 0, 1));
}
function cinCam(ct) {
  const k = cinSpline(CIN_KEYS, ct);
  let x = k[0], y = k[1], z = k[2], roll = k[3];
  // the camera leads the Graduate a little during the walk instead of sitting on a fixed track
  if (ct > 2.9 && ct < 6.5) {
    const gx = cinGradX(ct), m = cnS5((ct - 2.9) / 0.9) * (1 - cnS5((ct - 5.6) / 0.9));
    x = lerp(x, gx + 70, m * 0.55);
  }
  const hand = REDUCED ? 0 : 1;
  x += Math.sin(ct * 0.63) * 3.2 * hand; y += Math.sin(ct * 0.91 + 1.3) * 2.2 * hand;
  // a tiny thump when the crowd erupts and when the hats go up
  let shake = 0;
  if (!REDUCED) {
    shake += Math.max(0, 1 - Math.abs(ct - 10.2) / 0.5) * 2.2 + Math.max(0, 1 - Math.abs(ct - 11.62) / 0.45) * 3.4;
  }
  return { x, y, z, roll: roll * Math.PI / 180 * (REDUCED ? 0.3 : 1), shake };
}
/* letterbox amount 0..1 (1 = full bars): in at the start, out for the cards */
function cinBars(ct) {
  const open = cnS5((ct - 0.15) / 1.5);
  const out = cnS5((ct - 14.9) / 0.5);
  return clamp(open * (1 - out), 0, 1);
}

/* the view for this frame: output size, camera, and the world->screen mapping helper */
function cinView(pw, ph, ct) {
  const cam = cinCam(ct), aspect = pw / ph, portrait = aspect < 1.0;
  const k = ph / 720;
  // narrower than 16:9: pull the zoom back a little and keep the subject inside the frame instead of shrinking into a postage stamp
  const narrow = clamp(Math.pow(aspect / (16 / 9), 0.32), 0.64, 1);
  let z = cam.z * narrow;
  const visW = pw / (k * z);
  let cx = cam.x;
  if (visW < 1280 / Math.max(1, cam.z) * 0.98) {
    const sx = cinFocusX(ct), m = visW * 0.5 - visW * 0.2;
    cx = clamp(cx, sx - m, sx + m);
  }
  const barF = cinBars(ct) * (portrait ? 0.05 : 0.105);
  const oy = ph * 0.5 - (portrait ? ph * 0.07 : 0);
  return { pw, ph, k, z, cx, cy: cam.y, roll: cam.roll, ox: pw / 2 + (REDUCED ? 0 : Math.sin(ct * 90) * cam.shake), oy: oy + (REDUCED ? 0 : Math.cos(ct * 77) * cam.shake), bar: ph * barF, portrait, aspect, ct, narrow, camz: cam.z };
}
/* the horizontal point of interest, used to crop to the action on narrow screens */
function cinFocusX(ct) {
  const gx = cinGradX(ct);
  if (ct < 2.6) return 600;
  if (ct < 6.3) return gx + 40;
  if (ct < 9.4) return 765;
  return 700;
}
/* apply the transform of a layer at `depth` (1 = the action plane) */
function cinSet(c, V, depth) {
  const s = V.k * (1 + (V.z - 1) * depth);
  const ex = 640 + (V.cx - 640) * depth, ey = 360 + (V.cy - 360) * depth;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.translate(V.ox, V.oy);
  if (V.roll) c.rotate(V.roll);
  c.scale(s, s);
  c.translate(-ex, -ey);
  // visible world rectangle on this layer (used to blit only what is on screen)
  const rm = Math.abs(Math.sin(V.roll)) * (V.pw + V.ph) / s + 6 / s;
  CN.cur = { x0: ex - V.ox / s - rm, x1: ex + (V.pw - V.ox) / s + rm, y0: ey - V.oy / s - rm, y1: ey + (V.ph - V.oy) / s + rm, s, ex, ey };
}
/* world point on a layer -> screen px (for flares and HTML-free overlays) */
function cinToScreen(V, depth, wx, wy) {
  const s = V.k * (1 + (V.z - 1) * depth);
  const ex = 640 + (V.cx - 640) * depth, ey = 360 + (V.cy - 360) * depth;
  let x = (wx - ex) * s, y = (wy - ey) * s;
  if (V.roll) { const cs = Math.cos(V.roll), sn = Math.sin(V.roll); const rx = x * cs - y * sn; y = x * sn + y * cs; x = rx; }
  return [V.ox + x, V.oy + y, s];
}

/* ====================================================================================
   BUILD (once per run; the layers do not depend on the viewport size)
   ==================================================================================== */
function cinBuild() {
  if (CN.built) return;
  try { CN.hasFilter = 'filter' in cnMk(2, 2).getContext('2d'); } catch (e) { CN.hasFilter = false; }
  cinBuildBackdrop();
  cinBuildStage();
  cinBuildCrowd();
  cinBuildPost();
  cinGrainUrl();
  if (typeof cinBuildCast === 'function') cinBuildCast();
  CN.built = true;
  try { ART.preload(cinArtKeys()); } catch (e) { /* art is optional */ }
}
function cinArtKeys() {
  const ks = CUT_SHOTS.map(s => s.k);
  ks.push('cutscene/plate-stage-empty', 'cutscene/plate-crowd-front', 'cutscene/plate-crowd-back', 'cutscene/plate-podium', 'cutscene/sprites-hats-confetti');
  ks.push('chars/grad/pose-idle', 'chars/grad/pose-walk-a', 'chars/grad/pose-walk-b', 'chars/grad/pose-handshake', 'chars/grad/pose-diploma-up', 'chars/grad/pose-cap-toss', 'chars/grad/pose-wave', 'chars/grad/pose-nervous');
  ks.push('chars/dean/pose-idle', 'chars/dean/pose-handshake', 'chars/dean/pose-clap', 'chars/dean/pose-point-announce');
  ks.push('chars/ch-05-classmates-stand', 'chars/ch-05-classmates-cheer', 'chars/ch-05-classmates-toss');
  ks.push('ui/paper-navy-card');
  return ks;
}

/* post-processing sprites: vignette, grain tiles, glow sprites */
function cinBuildPost() {
  const S = CN.S;
  S.vig = cnMk(320, 180);
  { const g = S.vig.getContext('2d'); g.fillStyle = cnRG(g, 160, 92, 40, 160, 92, 230, [[0, 'rgba(4,6,16,0)'], [0.55, 'rgba(4,6,16,0.10)'], [0.82, 'rgba(4,6,16,0.46)'], [1, 'rgba(4,6,16,0.82)']]); g.fillRect(0, 0, 320, 180);
    // a hair of chromatic fringe baked into the vignette: cool on the left edge, warm on the right
    g.globalCompositeOperation = 'screen';
    g.fillStyle = cnLG(g, 0, 0, 30, 0, [[0, 'rgba(90,170,255,.10)'], [1, 'rgba(90,170,255,0)']]); g.fillRect(0, 0, 30, 180);
    g.fillStyle = cnLG(g, 320, 0, 290, 0, [[0, 'rgba(255,120,90,.10)'], [1, 'rgba(255,120,90,0)']]); g.fillRect(290, 0, 30, 180); }
  S.grain = [];
  const rnd = mulberry32(777);
  for (let i = 0; i < 4; i++) {
    const cv = cnMk(192, 192), g = cv.getContext('2d'), id = g.createImageData(192, 192), d = id.data;
    for (let p = 0; p < d.length; p += 4) { const v = (rnd() - 0.5) * 2; d[p] = d[p + 1] = d[p + 2] = v > 0 ? 255 : 0; d[p + 3] = Math.abs(v) * 150; }
    g.putImageData(id, 0, 0);
    S.grain.push(cv);
  }
  S.glowW = cnGlowSprite('#fff4d6', 128);
  S.glowA = cnGlowSprite('#ffc247', 128);
  S.glowB = cnGlowSprite('#9fd2ff', 128);
  S.glowR = cnGlowSprite('#ff9a7a', 128);
  // anamorphic streak for the sun flare
  S.streak = cnMk(512, 32);
  { const g = S.streak.getContext('2d'); g.fillStyle = cnLG(g, 0, 0, 512, 0, [[0, 'rgba(255,230,180,0)'], [0.5, 'rgba(255,244,214,.9)'], [1, 'rgba(255,230,180,0)']]); g.fillRect(0, 12, 512, 8); g.globalCompositeOperation = 'destination-in'; g.fillStyle = cnLG(g, 0, 0, 0, 32, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, 512, 32); }
  // lens ring
  S.ring = cnMk(128, 128);
  { const g = S.ring.getContext('2d'); g.strokeStyle = cnRG(g, 64, 64, 30, 64, 64, 62, [[0, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,214,150,.0)'], [0.9, 'rgba(255,200,140,.55)'], [1, 'rgba(255,200,140,0)']]); g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 52, 0, CN_TAU); g.stroke(); }
}

/* ====================================================================================
   RENDER
   ==================================================================================== */
function cinRender(c, cv, ct) {
  if (!CN.built) cinBuild();
  if (CN.dirty) { CN.dirty = false; cinBuildStage(); }
  const w = cv.clientWidth || 1280, h = cv.clientHeight || 720;
  // adaptive resolution: if the machine cannot keep up, quietly draw fewer pixels (the canvas is stretched by CSS); never goes back up mid-scene
  const nowT = performance.now();
  if (CN.lastT && nowT - CN.lastT < 400) {
    CN.frameMs = CN.frameMs * 0.92 + (nowT - CN.lastT) * 0.08; CN.slow++;
    if (CN.slow > 90 && CN.frameMs > 55 && CN.res > 0.6) { CN.res = Math.max(0.6, CN.res * 0.8); CN.slow = 0; CN.frameMs = 30; }
  }
  CN.lastT = nowT;
  // render size: the device ratio, capped so a huge screen never costs more than ~1600px across
  // render scale: the device ratio, limited to ~1.4 megapixels and ~1600 px on the long side, times the adaptive factor
  const sc = Math.min(window.devicePixelRatio || 1, Math.sqrt(1.4e6 / Math.max(1, w * h)), 1600 / Math.max(w, h, 1)) * CN.res;
  const pw = Math.max(2, Math.round(w * sc)), ph = Math.max(2, Math.round(h * sc));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  const V = cinView(pw, ph, ct);
  CN.V = V;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#05070d'; c.fillRect(0, 0, pw, ph);
  if (ct >= 15.4) { cinCards(c, V, ct); cinFxDom(V, ct); return; }
  cinScene(c, V, ct);
  cinStills(c, V, ct);
  cinPost(c, V, ct);
  cinFxDom(V, ct);
}
/* the scene proper: sky, set, cast, audience, particles, light */
function cinScene(c, V, ct) {
  const L = CN.L, PL = cinArtPlates();
  // when the camera is deep inside the opaque set (the handshake close-up) nothing behind it can be seen, so skip it all
  cinSet(c, V, 1);
  const q = CN.cur, covered = q.x0 > 172 && q.x1 < 1108 && q.y0 > 84 && q.y1 < 604;
  if (!covered && !PL.stage) {
    // the far scenery is soft anyway (depth of field), so it is painted at half resolution and upscaled once
    const hw = Math.max(2, Math.round(V.pw * 0.5)), hh = Math.max(2, Math.round(V.ph * 0.5));
    if (!CN.bd || CN.bd.width !== hw || CN.bd.height !== hh) { CN.bd = cnMk(hw, hh); CN.bdc = CN.bd.getContext('2d'); }
    const g = CN.bdc, fx = hw / V.pw, fy = hh / V.ph;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const V2 = Object.assign({}, V, { pw: hw, ph: hh, k: V.k * fx, ox: V.ox * fx, oy: V.oy * fy });
    cinSet(g, V2, 0.08); cinSky(g, V2, ct);
    cinSet(g, V2, 0.35); cinSun(g, V2, ct);
    cinSet(g, V2, 0.28); cinClouds(g, ct, 0);
    cinSet(g, V2, 0.34); cnBlit(g, L.hillFar);
    cinSet(g, V2, 0.46); cnBlit(g, L.hillMid);
    cinSet(g, V2, 0.62); cnBlit(g, L.campus);
    cinSet(g, V2, 0.52); cinClouds(g, ct, 1);
    cinBirds(g, V2, ct);
    cinSet(g, V2, 0.76); cnBlit(g, L.hillNear);
    cinSet(g, V2, 0.9); cnBlit(g, L.trees);
    cinSet(g, V2, 0.96); cnBlit(g, L.lawn);
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(CN.bd, 0, 0, V.pw, V.ph);
  }
  // the stage and the action
  cinSet(c, V, 1);
  if (PL.stage) cinStagePlate(c, V, ct, PL); else cinStageLive(c, V, ct);
  cinCastDraw(c, V, ct);
  cinStageFront(c, V, ct);
  // audience tiers, balloons, foreground
  if (PL.stage && (PL.back || PL.front)) cinCrowdPlates(c, V, ct, PL); else cinCrowdDraw(c, V, ct);
  cinParticles(c, V, ct);
  cinLight(c, V, ct);
}

/* ---------- optional stills, cross-faded over the procedural scene ---------- */
function cinStills(c, V, ct) {
  CN.stillA = 0;
  if (!ART.on) return;
  const bar = V.bar, top = bar, hgt = V.ph - bar * 2;
  for (let i = 0; i < CUT_SHOTS.length; i++) {
    const s = CUT_SHOTS[i];
    if (s.card || ct < s.a - 0.01 || ct > s.b + 0.01) continue;
    const img = ART.get(s.k);
    if (!img) continue;
    const u = clamp((ct - s.a) / (s.b - s.a), 0, 1), f = Math.min(0.2, (s.b - s.a) * 0.3);
    const al = Math.min(cnS5((ct - s.a) / f), 1 - cnS5((ct - (s.b - f)) / f));
    if (al <= 0.003) continue;
    CN.stillA = Math.max(CN.stillA, al);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.save(); c.beginPath(); c.rect(0, top, V.pw, hgt); c.clip();
    c.globalAlpha = al;
    const e = REDUCED ? u : cnS5(u);
    ART.cover(c, img, 0, top, V.pw, hgt, lerp(s.fx0, s.fx1, e), lerp(s.fy0, s.fy1, e), lerp(s.z0, s.z1, e));
    c.globalAlpha = 1;
    if (s.mem) { // faded warm "memory" grade + soft edge
      c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(255,226,186,' + (0.55 * al).toFixed(3) + ')'; c.fillRect(0, top, V.pw, hgt);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(40,24,12,' + (0.18 * al).toFixed(3) + ')'; c.fillRect(0, top, V.pw, hgt);
    }
    c.restore();
  }
}

/* ---------- post: grade, bloom hints, flare, vignette, grain ---------- */
function cinGrade(ct) {
  // cool and anticipatory -> neutral on the walk -> warm and triumphant from the diploma on
  const warm = cnS5((ct - 5.8) / 4.2) * 0.55 + cnS5((ct - 11.2) / 2.2) * 0.45;
  return warm;
}
function cinPost(c, V, ct) {
  // the canvas only gets the lens flare; grade, vignette, grain, bars and fades are DOM layers (cinFxDom)
  c.setTransform(1, 0, 0, 1, 0, 0);
  cinFlare(c, V, ct);
}
/* post layers as CSS: set a handful of custom properties per frame, only when they change */
function cinFxDom(V, ct) {
  if (!CN.dom) CN.dom = { root: $('#cut'), flash: $('#cutFlash'), last: {} };
  const D = CN.dom, st = D.last, root = D.root, set = (k, v) => { if (st[k] !== v) { st[k] = v; root.style.setProperty(k, v); } };
  if (!root) return;
  const warm = cinGrade(ct);
  // grade: cool and anticipatory -> warm and triumphant, as a multiply tint (keeps the blacks black; the cards get none of it)
  const coolM = [226, 238, 255], warmM = [255, 244, 224], g = ct >= 15.4 ? 1 : 0;
  set('--cut-mul', 'rgb(' + [0, 1, 2].map(i => g ? 255 : Math.round(lerp(coolM[i], warmM[i], warm))).join(',') + ')');
  set('--cut-vig', (clamp(0.8 + Math.sin(ct * 0.9) * 0.05 + (ct > 11.5 ? 0 : 0.06), 0, 1)).toFixed(2));
  const px = Math.round(V.bar * ((root.clientHeight || V.ph) / V.ph));
  set('--cut-bar', px + 'px');
  // fade up from black, then the white flash into black
  let a = 0, col = '0,0,0';
  if (ct < 1.1) a = 1 - ct / 1.1;
  if (ct > 14.4 && ct < 16.3) {
    const f = clamp((ct - 14.4) / 0.9, 0, 1), b = clamp((ct - 15.3) / 0.35, 0, 1), o = clamp((ct - 15.65) / 0.55, 0, 1);
    const wa = (REDUCED ? f * 0.55 : f) * (1 - b), ba = b * (1 - o);
    if (ba > wa) { a = ba; col = '0,0,0'; } else { a = wa; col = '255,250,238'; }
  }
  a = Math.round(a * 100) / 100;
  if (st.fa !== a) { st.fa = a; D.flash.style.opacity = a; }
  if (st.fc !== col) { st.fc = col; D.flash.style.background = 'rgb(' + col + ')'; }
}
/* the grain tile as an image for the CSS layer */
function cinGrainUrl() {
  const S = CN.S;
  try { const root = $('#cut'); if (root && S.grain) root.style.setProperty('--cut-grain', 'url(' + S.grain[0].toDataURL('image/png') + ')'); } catch (e) { /* tainted or unavailable: no grain */ }
}
