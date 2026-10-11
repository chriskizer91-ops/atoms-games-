/* ---------- the title screen shows the real town on a slow pan ---------- */
const TITLE = { S: null, c: null, x: 0, dir: 1, drawn: false, w: 0, h: 0, heroA: 0 };

/* small presentation helpers around the canvas: a grain tile for the CSS layer and a gentle pointer parallax (DOM only) */
const TITLE_FX = { init: false, busy: false };
function titleFxInit() {
  if (TITLE_FX.init) return;
  TITLE_FX.init = true;
  const root = $('#title');
  if (!root) return;
  // warm the first illustrated stills so the opening shot is ready the moment New game is pressed
  try { if (ART.on) ['cutscene/still-01-quad', 'cutscene/still-02a-lecture', 'cutscene/still-02b-group', 'cutscene/still-02c-coffee', 'cutscene/still-02d-allnighter'].forEach(k => ART.get(k)); } catch (e) { /* art is optional */ }
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), id = g.createImageData(128, 128), d = id.data, rnd = mulberry32(31);
    for (let p = 0; p < d.length; p += 4) { const v = rnd() * 2 - 1; d[p] = d[p + 1] = d[p + 2] = v > 0 ? 255 : 0; d[p + 3] = Math.abs(v) * 170; }
    g.putImageData(id, 0, 0);
    root.style.setProperty('--t-grain', 'url(' + cv.toDataURL('image/png') + ')');
  } catch (e) { /* no grain if the canvas cannot be read */ }
  if (!REDUCED) root.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || TITLE_FX.busy) return;
    TITLE_FX.busy = true;
    requestAnimationFrame(() => {
      TITLE_FX.busy = false;
      const r = root.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      root.style.setProperty('--t-px', (nx * -14).toFixed(1) + 'px'); root.style.setProperty('--t-py', (ny * -8).toFixed(1) + 'px');
    });
  });
}

function titleFrame(dt) {
  const cv = $('#titleCanvas');
  if (!cv || cv.clientWidth < 2) return;
  titleFxInit();
  if (!TITLE.S) { TITLE.S = newState('cs'); TITLE.S.day = 1 + 7 * Math.floor(Math.random() * 4); TITLE.S.t = 18 * 60 + 5; TITLE.S.px = -9999; TITLE.S.py = -9999; TITLE.x = 150; }
  if (!TITLE.c) TITLE.c = cv.getContext('2d');
  if (REDUCED && TITLE.drawn && TITLE.w === cv.clientWidth && TITLE.h === cv.clientHeight && TITLE.heroA >= 1) return;
  const keep = S; S = TITLE.S;
  try {
    const sz = sizeCanvas(cv), k = Math.max(sz.h / 640, sz.w / 1500);
    const vw = sz.w / k, vh = sz.h / k;
    if (!REDUCED) {
      FX.time += dt;
      S.t += dt * 5; if (S.t >= 1440) { S.t -= 1440; }
      TITLE.x += TITLE.dir * dt * 26;
      const maxX = WORLD.w - vw;
      if (TITLE.x > maxX) { TITLE.x = maxX; TITLE.dir = -1; } else if (TITLE.x < 0) { TITLE.x = 0; TITLE.dir = 1; }
      updateNpcs(dt); updateCars(dt);
    }
    CAM.x = clamp(TITLE.x, 0, Math.max(0, WORLD.w - vw)); CAM.y = clamp(BAND1 + 96 - vh, 0, 400); CAM.k = k; CAM.vw = vw; CAM.vh = vh;
    FX.demo = true; FX.fade = 0;
    // optional key art (title/hero-wide, title/hero-tall) fades in over the live town, then replaces it
    const hero = ART.on ? ART.get(sz.h > sz.w * 1.05 ? 'title/hero-tall' : 'title/hero-wide') : null;
    if (hero) TITLE.heroA = Math.min(1, TITLE.heroA + (REDUCED ? 1 : dt * 0.9)); else TITLE.heroA = 0;
    if (TITLE.heroA < 1) paintTown(TITLE.c, cv, sz, k, dt);
    if (hero && TITLE.heroA > 0) {
      const c = TITLE.c, e = TITLE.x / Math.max(1, WORLD.w - vw);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = TITLE.heroA;
      ART.cover(c, hero, 0, 0, cv.width, cv.height, 0.5 + (e - 0.5) * 0.06, 0.5, 1.04 + 0.03 * (TITLE.dir > 0 ? e : 1 - e));
      c.globalAlpha = 1;
    }
    TITLE.drawn = true; TITLE.w = cv.clientWidth; TITLE.h = cv.clientHeight;
    TITLE.n = (TITLE.n || 0) + 1;
    if (TITLE.n % 20 === 1) {
      const mid = CAM.x + vw / 2, stop = [BUS_STOPS[0], BUS_STOPS[1], BUS_STOPS[3]].reduce((a, b) => Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a);
      $('#titleClock').textContent = stop.name + ' · ' + clockStr(S.t);
      $('#app').style.setProperty('--sky', rgbS(mix3(FX.A.bot, [150, 170, 255], FX.A.nf * 0.8)));
    }
  } finally { S = keep; FX.demo = false; CAM.ready = false; }
}

