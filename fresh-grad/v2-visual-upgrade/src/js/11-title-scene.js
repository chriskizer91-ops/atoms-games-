/* ---------- the title screen shows the real town on a slow pan ---------- */
const TITLE = { S: null, c: null, x: 0, dir: 1, drawn: false, w: 0, h: 0 };
function titleFrame(dt) {
  const cv = $('#titleCanvas');
  if (!cv || cv.clientWidth < 2) return;
  if (!TITLE.S) { TITLE.S = newState('cs'); TITLE.S.day = 1 + 7 * Math.floor(Math.random() * 4); TITLE.S.t = 18 * 60 + 5; TITLE.S.px = -9999; TITLE.S.py = -9999; TITLE.x = 150; }
  if (!TITLE.c) TITLE.c = cv.getContext('2d');
  if (REDUCED && TITLE.drawn && TITLE.w === cv.clientWidth && TITLE.h === cv.clientHeight) return;
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
    paintTown(TITLE.c, cv, sz, k, dt);
    TITLE.drawn = true; TITLE.w = cv.clientWidth; TITLE.h = cv.clientHeight;
    TITLE.n = (TITLE.n || 0) + 1;
    if (TITLE.n % 20 === 1) {
      const mid = CAM.x + vw / 2, stop = [BUS_STOPS[0], BUS_STOPS[1], BUS_STOPS[3]].reduce((a, b) => Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a);
      $('#titleClock').textContent = stop.name + ' \u00b7 ' + clockStr(S.t);
      $('#app').style.setProperty('--sky', rgbS(mix3(FX.A.bot, [150, 170, 255], FX.A.nf * 0.8)));
    }
  } finally { S = keep; FX.demo = false; CAM.ready = false; }
}

