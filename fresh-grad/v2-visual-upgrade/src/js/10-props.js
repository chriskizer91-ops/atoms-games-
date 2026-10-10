/* ---------- props placed once ---------- */
const PROPS = [];
(function makeProps() {
  const rnd = mulberry32(314);
  const nearStreet = x => STREETS_X.some(cx => Math.abs(x - cx) < 96);
  const nearBus = (x, y) => BUS_STOPS.some(s => Math.abs(s.x - x) < 76 && Math.abs(s.y - y) < 60);
  const nearLamp = (x, y) => LAMPS.some(l => Math.abs(l.x - x) < 24 && Math.abs(l.y - y) < 22);
  const kinds = ['hydrant', 'bin', 'planter', 'planter', 'mailbox', 'rack', 'news', 'bin', 'planter'];
  [ROAD1.y - 7, ROAD1.y + ROAD1.h + 13, ROAD2.y - 7, ROAD2.y + ROAD2.h + 13].forEach(y => {
    for (let x = 70 + rnd() * 60; x < WORLD.w - 60; x += 78 + rnd() * 96) {
      if (nearStreet(x) || nearBus(x, y) || nearLamp(x, y)) continue;
      PROPS.push({ t: kinds[Math.floor(rnd() * kinds.length)], x, y, v: Math.floor(rnd() * 100) });
    }
  });
  // pots and sandwich boards at shop fronts
  DECO.forEach(b => {
    const cx = b.x + b.w / 2, bot = b.y + b.h;
    if (b.style === 'shop') {
      PROPS.push({ t: 'planter', x: cx + 30, y: bot + 3, v: b.seed % 100 });
      if (b.seed % 3 !== 0) PROPS.push({ t: 'aframe', x: b.x + 26 + (b.seed % 2) * (b.w - 52), y: bot + 12, v: b.seed % 100 });
    } else if (b.style === 'flat') { PROPS.push({ t: 'planter', x: cx - 40, y: bot + 3, v: (b.seed + 1) % 100 }); PROPS.push({ t: 'planter', x: cx + 40, y: bot + 3, v: b.seed % 100 }); }
  });
  PROPS.push({ t: 'aframe', x: BLD.diner.x + 36, y: BLD.diner.y + BLD.diner.h + 13, v: 4 });
  PROPS.push({ t: 'planter', x: BLD.diner.x + BLD.diner.w - 30, y: BLD.diner.y + BLD.diner.h + 4, v: 2 }, { t: 'planter', x: BLD.clinic.x + 40, y: BLD.clinic.y + BLD.clinic.h + 4, v: 6 }, { t: 'planter', x: BLD.clinic.x + BLD.clinic.w - 40, y: BLD.clinic.y + BLD.clinic.h + 4, v: 3 });
  PROPS.push({ t: 'rack', x: BLD.apartment.x + 44, y: BLD.apartment.y + BLD.apartment.h + 6, v: 1 }, { t: 'planter', x: BLD.apartment.x + BLD.apartment.w - 34, y: BLD.apartment.y + BLD.apartment.h + 4, v: 8 });
  // park: bushes, rocks and a gate
  let tries = 0, n = 0;
  const onPath = (x, y) => Math.abs(y - FOUNTAIN.y) < 34 || Math.abs(x - 800) < 40 || Math.abs(x - 2060) < 40 || (Math.abs(x - FOUNTAIN.x) < 50 && y < FOUNTAIN.y) || Math.hypot((x - FOUNTAIN.x) / 1.5, y - FOUNTAIN.y) < 150;
  while (n < 90 && tries++ < 1500) {
    const x = 40 + rnd() * (WORLD.w - 80), y = PARK_Y + 26 + rnd() * 690;
    if (onPath(x, y)) continue;
    if (((x - POND.x) / (POND.rx + 26)) ** 2 + ((y - POND.y) / (POND.ry + 22)) ** 2 < 1) continue;
    PROPS.push({ t: rnd() < 0.82 ? 'bush' : 'rock', x, y, v: Math.floor(rnd() * 100) }); n++;
  }
  PROPS.push({ t: 'gate', x: FOUNTAIN.x, y: PARK_Y + 12, v: 0 });
})();

function inView(x0, y0, x1, y1) { return x1 > CAM.x - 60 && x0 < CAM.x + CAM.vw + 60 && y1 > CAM.y - 100 && y0 < CAM.y + CAM.vh + 60; }

