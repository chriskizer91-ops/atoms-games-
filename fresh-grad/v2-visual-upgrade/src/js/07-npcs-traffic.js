/* ============================ people ============================ */
const NPC_LOOK = [
  { shirt: '#4f9d7a', pants: '#34495e', hair: '#2b2118', skin: '#e0ac86' },
  { shirt: '#c05d8a', pants: '#2f3a4f', hair: '#7a4a2a', skin: '#f2c9a5' },
  { shirt: '#e7b64a', pants: '#3d4a5a', hair: '#1a1a1a', skin: '#8f5d3d' },
  { shirt: '#6f7bd4', pants: '#2b2f3e', hair: '#d8c27a', skin: '#f0c7a4' },
  { shirt: '#d0603f', pants: '#3a3a3a', hair: '#3b2a20', skin: '#b87b55' },
  { shirt: '#5ab0c9', pants: '#41505f', hair: '#222', skin: '#e6b995' },
  { shirt: '#9bb86a', pants: '#4a3f36', hair: '#8a5a2b', skin: '#d99d77' },
  { shirt: '#e86f68', pants: '#2c3e57', hair: '#1c1410', skin: '#a8714f' },
  { shirt: '#f4a261', pants: '#3b4a3f', hair: '#c9a24a', skin: '#f3d0b0' },
  { shirt: '#7b6fd0', pants: '#2f2f45', hair: '#4a2a1a', skin: '#c68a62' },
  { shirt: '#2a9d8f', pants: '#3a3340', hair: '#111', skin: '#74492f' },
  { shirt: '#e5c7e8', pants: '#394a64', hair: '#6a3a2a', skin: '#efc3a0' }
];
const TALKER_COUNT = NPC_LOOK.length;
const PLAYER_LOOK = { shirt: '#ff7a59', pants: '#2c3e57', hair: '#2a1f18', skin: '#e8b48f', me: true, style: 0 };
const NPCS = [];
function randLook(rnd) {
  const sh = ['#4f9d7a', '#c05d8a', '#e7b64a', '#6f7bd4', '#d0603f', '#5ab0c9', '#9bb86a', '#e86f68', '#f4a261', '#7b6fd0', '#2a9d8f', '#cfd6dc', '#6b7a8f'];
  const pa = ['#34495e', '#2f3a4f', '#3d4a5a', '#2b2f3e', '#3a3a3a', '#41505f', '#4a3f36'];
  const ha = ['#2b2118', '#7a4a2a', '#1a1a1a', '#d8c27a', '#3b2a20', '#8a5a2b', '#c9a24a'];
  const sk = ['#e0ac86', '#f2c9a5', '#8f5d3d', '#f0c7a4', '#b87b55', '#d99d77', '#74492f'];
  const p = a => a[Math.floor(rnd() * a.length)];
  return { shirt: p(sh), pants: p(pa), hair: p(ha), skin: p(sk) };
}
function randWalkPoint(rnd, zone) {
  const z = WALK_ZONES[zone % WALK_ZONES.length];
  for (let i = 0; i < 40; i++) {
    const x = z[0] + rnd() * z[2], y = z[1] + rnd() * z[3];
    if (!solidAt(x, y)) return { x, y };
  }
  return { x: z[0] + 20, y: z[1] + 10 };
}
(function makeNpcs() {
  const rnd = mulberry32(99);
  for (let i = 0; i < TALKER_COUNT + 12; i++) {
    const zone = i % WALK_ZONES.length, p = randWalkPoint(rnd, zone);
    const look = i < TALKER_COUNT ? NPC_LOOK[i] : randLook(rnd);
    NPCS.push(Object.assign({ x: p.x, y: p.y, tx: p.x, ty: p.y, zone, wait: rnd() * 4, spd: 26 + rnd() * 18, phase: rnd() * 6, face: 1, moving: false, rnd: mulberry32(1000 + i) }, look));
  }
})();
function updateNpcs(dt) {
  for (const n of NPCS) {
    if (n.id && G.inside === 'npc:' + n.id) { n.moving = false; n.face = S.px >= n.x ? 1 : -1; continue; }
    if (n.id && !G.inside && Math.hypot(n.x - S.px, n.y - S.py) < 70) { n.moving = false; n.wait = Math.max(n.wait, 0.4); n.face = S.px >= n.x ? 1 : -1; continue; }
    if (n.wait > 0) { n.wait -= dt; n.moving = false; continue; }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < 3) {
      n.wait = 1 + n.rnd() * 5;
      let p = null;
      for (let k = 0; k < 6; k++) { const q = randWalkPoint(n.rnd, n.zone); if (Math.hypot(q.x - n.x, q.y - n.y) < 520) { p = q; break; } }
      if (p) { n.tx = p.x; n.ty = p.y; } else { n.tx = n.x + (n.rnd() - 0.5) * 120; n.ty = n.y; }
      if (solidAt(n.tx, n.ty)) { n.tx = n.x; n.ty = n.y; }
      continue;
    }
    const sp = Math.min(d, n.spd * dt * G.speed);
    const nx = n.x + dx / d * sp, ny = n.y + dy / d * sp;
    if (!solidAt(nx, ny)) { n.x = nx; n.y = ny; } else { n.tx = n.x; n.ty = n.y; }
    n.face = dx >= 0 ? 1 : -1; n.moving = true; n.phase += dt * 9;
  }
}

/* ============================ traffic ============================ */
const CAR_COLORS = ['#d64545', '#3d7ea6', '#e9c46a', '#f4f1ea', '#2a9d8f', '#7b6fd0', '#2b2f3e', '#e07a3f', '#8d99ae'];
const INTERSECTIONS = [];
ROADS_H.forEach(r => STREETS_X.forEach(cx => INTERSECTIONS.push({ x0: cx - STREET_W / 2, x1: cx + STREET_W / 2, y0: r.y, y1: r.y + r.h, cx })));
const LANES = [];
ROADS_H.forEach(r => {
  LANES.push({ ax: 'x', dir: 1, c: r.y + 22, from: -120, to: WORLD.w + 120, road: r });
  LANES.push({ ax: 'x', dir: -1, c: r.y + 58, from: -120, to: WORLD.w + 120, road: r });
});
STREETS_X.forEach(cx => {
  LANES.push({ ax: 'y', dir: 1, c: cx - 22, from: TOP_Y - 30, to: PARK_Y + 10, cx });
  LANES.push({ ax: 'y', dir: -1, c: cx + 22, from: TOP_Y - 30, to: PARK_Y + 10, cx });
});
const CARS = [];
(function makeCars() {
  const rnd = mulberry32(7);
  LANES.forEach((ln, li) => {
    const n = ln.ax === 'x' ? 5 : 3, span = ln.to - ln.from;
    for (let i = 0; i < n; i++) {
      const long = ln.ax === 'x' ? 58 : 54;
      CARS.push({ lane: ln, pos: ln.from + (i + rnd() * 0.5) * span / n, len: long, spd: 80 + rnd() * 50, v: 80, col: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)] });
    }
  });
})();
/* light cycle: 0-7s east/west green, 9-16s north/south green, with an all-red gap between */
function lightState(tm) {
  const p = tm % 18;
  return p < 7 ? 'H' : p < 9 ? null : p < 16 ? 'V' : null;
}
function updateCars(dt) {
  const state = lightState(FX.time);
  LANES.forEach(ln => {
    const cars = CARS.filter(k => k.lane === ln).sort((a, b) => (a.pos - b.pos) * ln.dir);
    const green = state === (ln.ax === 'x' ? 'H' : 'V');
    cars.forEach((k, idx) => {
      let target = k.spd;
      const ahead = cars[idx + 1];
      if (ahead) {
        const gap = (ahead.pos - k.pos) * ln.dir - (ahead.len + k.len) / 2;
        if (gap < 16) target = 0; else if (gap < 80) target = Math.min(target, k.spd * (gap - 16) / 64);
      }
      if (!green) {
        INTERSECTIONS.forEach(it => {
          if (ln.ax === 'x' ? (it.y0 !== ln.road.y) : (it.cx !== ln.cx)) return;
          const front = k.pos + ln.dir * k.len / 2;
          const line = ln.ax === 'x' ? (ln.dir > 0 ? it.x0 - 8 : it.x1 + 8) : (ln.dir > 0 ? it.y0 - 8 : it.y1 + 8);
          const dist = (line - front) * ln.dir;
          if (dist >= -3 && dist < 90) target = Math.min(target, dist < 6 ? 0 : k.spd * Math.min(1, dist / 70));
        });
      }
      k.v += clamp(target - k.v, -260 * dt, 90 * dt);
      k.pos += ln.dir * k.v * dt;
      if (ln.dir > 0 && k.pos > ln.to) k.pos = ln.from; else if (ln.dir < 0 && k.pos < ln.from) k.pos = ln.to;
    });
  });
}
function carXY(k) { return k.lane.ax === 'x' ? { x: k.pos, y: k.lane.c } : { x: k.lane.c, y: k.pos }; }
function carKind(k) {
  if (k.kind == null) {
    k.kind = Math.floor(k.spd * 7.3) % 6;           // 0-2 sedan, 3 wagon, 4 van, 5 taxi
    if (k.kind === 5) k.col = '#f2c230';
  }
  return k.kind;
}
function drawCar(c, k) {
  const p = carXY(k), kind = carKind(k), on = FX.nf > 0.05, braking = k.v < k.spd * 0.45;
  const dark = shade(k.col, -0.28), lite = shade(k.col, 0.3);
  if (k.lane.ax === 'x') {
    const x = p.x, y = p.y, L = k.len, d = k.lane.dir;
    c.fillStyle = 'rgba(6,10,22,.3)'; c.beginPath(); c.ellipse(x, y + 9, L / 2 + 1, 4.2, 0, 0, 7); c.fill();
    c.save(); c.translate(x, y); c.scale(d, 1);
    // cabin
    const tall = kind === 4 ? 13 : kind === 3 ? 11 : 10, c0 = kind === 4 ? -L / 2 + 3 : -L / 2 + 9, c1 = kind >= 3 ? L / 2 - 15 : L / 2 - 18;
    c.fillStyle = dark;
    c.beginPath(); c.moveTo(c0, -6); c.lineTo(c0 + (kind === 4 ? 2 : 6), -6 - tall); c.lineTo(c1 - 8, -6 - tall); c.lineTo(c1, -6); c.closePath(); c.fill();
    c.fillStyle = on ? 'rgba(120,150,180,.9)' : 'rgba(176,220,240,.95)';
    c.beginPath(); c.moveTo(c0 + 3, -7); c.lineTo(c0 + (kind === 4 ? 4 : 8), -4 - tall); c.lineTo(c1 - 9, -4 - tall); c.lineTo(c1 - 3, -7); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(c1 - 14, -7); c.lineTo(c1 - 17, -4 - tall); c.lineTo(c1 - 12, -4 - tall); c.lineTo(c1 - 8, -7); c.closePath(); c.fill();
    c.fillStyle = dark; c.fillRect((c0 + c1) / 2 - 1.2, -5 - tall, 2.4, tall);
    // body
    c.fillStyle = k.col; rr(c, -L / 2, -8, L, 13, 4.5); c.fill();
    c.fillStyle = lite; c.fillRect(-L / 2 + 4, -8, L - 9, 2);
    c.fillStyle = dark; c.fillRect(-L / 2 + 2, 2.5, L - 4, 2.5);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect((c0 + c1) / 2 - 0.5, -6, 1, 9);
    if (kind === 5) { c.fillStyle = '#20242c'; rr(c, -5, -9 - tall, 10, 4, 1.5); c.fill(); c.fillStyle = on ? '#fff3b0' : '#f6f1e7'; c.fillRect(-3.5, -8.2 - tall, 7, 2.4); c.fillStyle = '#20242c'; for (let i = 0; i < 6; i++) c.fillRect(-L / 2 + 8 + i * 7, -2, 3.5, 2.4); }
    // wheels
    [-L / 2 + 11, L / 2 - 12].forEach(wx => {
      c.fillStyle = '#14171c'; c.beginPath(); c.arc(wx, 5.5, 5.2, 0, 7); c.fill();
      c.fillStyle = '#9aa3aa'; c.beginPath(); c.arc(wx, 5.5, 2.3, 0, 7); c.fill();
    });
    // lamps
    c.fillStyle = on ? '#fff6c4' : '#f2e9b8'; rr(c, L / 2 - 4, -4.5, 4, 4.5, 1.5); c.fill();
    c.fillStyle = braking ? '#ff3b30' : '#b3352b'; rr(c, -L / 2, -4.5, 3.2, 4.5, 1.2); c.fill();
    c.restore();
    if (on) {
      FX.beams.push(x + d * (L / 2 - 2), y + 3, d > 0 ? 0 : Math.PI);
      addEmit(x + d * (L / 2 - 2), y - 2, 13, 0, 0.9);
      addEmit(x - d * (L / 2 - 1), y - 2, braking ? 15 : 9, 2, braking ? 0.9 : 0.55);
    }
  } else {
    const x = p.x, y = p.y, L = k.len - 8, W = 26, d = k.lane.dir;
    c.fillStyle = 'rgba(6,10,22,.28)'; rr(c, x - W / 2 + 2, y - L / 2 + 5, W + 1, L, 7); c.fill();
    c.save(); c.translate(x, y); c.scale(1, d);
    c.fillStyle = '#14171c'; c.fillRect(-W / 2 - 1.5, -L / 2 + 7, 3, 9); c.fillRect(W / 2 - 1.5, -L / 2 + 7, 3, 9); c.fillRect(-W / 2 - 1.5, L / 2 - 16, 3, 9); c.fillRect(W / 2 - 1.5, L / 2 - 16, 3, 9);
    c.fillStyle = k.col; rr(c, -W / 2, -L / 2, W, L, 7); c.fill();
    c.fillStyle = lite; rr(c, -W / 2 + 3, -L / 2 + 2, W - 6, 3, 1.5); c.fill();
    c.fillStyle = dark; rr(c, -W / 2 + 3, -L / 2 + 10, W - 6, L - 24, 4); c.fill();
    c.fillStyle = on ? 'rgba(120,150,180,.9)' : 'rgba(176,220,240,.95)';
    c.beginPath(); c.moveTo(-W / 2 + 4, L / 2 - 20); c.lineTo(W / 2 - 4, L / 2 - 20); c.lineTo(W / 2 - 6, L / 2 - 13); c.lineTo(-W / 2 + 6, L / 2 - 13); c.closePath(); c.fill();
    c.fillRect(-W / 2 + 5, -L / 2 + 10, W - 10, 4);
    c.fillStyle = shade(k.col, 0.12); rr(c, -W / 2 + 4.5, -L / 2 + 15, W - 9, L - 37, 3); c.fill();
    if (kind === 5) { c.fillStyle = on ? '#fff3b0' : '#f6f1e7'; c.fillRect(-4, -3, 8, 3.5); }
    c.fillStyle = on ? '#fff6c4' : '#f2e9b8'; rr(c, -W / 2 + 2.5, L / 2 - 3.5, 6, 3, 1.2); c.fill(); rr(c, W / 2 - 8.5, L / 2 - 3.5, 6, 3, 1.2); c.fill();
    c.fillStyle = braking ? '#ff3b30' : '#b3352b'; rr(c, -W / 2 + 2.5, -L / 2 + 0.5, 6, 2.6, 1); c.fill(); rr(c, W / 2 - 8.5, -L / 2 + 0.5, 6, 2.6, 1); c.fill();
    c.restore();
    if (on) {
      FX.beams.push(x, y + d * (L / 2 - 2), d > 0 ? Math.PI / 2 : -Math.PI / 2);
      addEmit(x - 8, y + d * (L / 2 - 2), 11, 0, 0.8); addEmit(x + 8, y + d * (L / 2 - 2), 11, 0, 0.8);
      addEmit(x, y - d * (L / 2 - 1), braking ? 16 : 10, 2, braking ? 0.8 : 0.5);
    }
  }
}
function trafficLightItems(c) {
  const st = lightState(FX.time), ph = FX.time % 18, out = [];
  INTERSECTIONS.forEach(it => {
    const hOn = st === 'H', vOn = st === 'V';
    const hYellow = hOn && ph > 6, vYellow = vOn && ph > 15;
    const pole = (x, y, on, yel) => out.push({ x, y, f: () => {
      c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x, y + 1, 5, 1.8, 0, 0, 7); c.fill();
      c.fillStyle = '#232c35'; c.fillRect(x - 3, y - 4, 6, 5); c.fillRect(x - 1.5, y - 36, 3, 33);
      c.fillStyle = '#11151a'; rr(c, x - 5.5, y - 58, 11, 24, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x - 5.5, y - 57, 2, 22);
      const red = !on, grn = on && !yel;
      c.fillStyle = red ? '#ff4038' : '#4a1d1d'; c.beginPath(); c.arc(x, y - 52.5, 2.9, 0, 7); c.fill();
      c.fillStyle = yel ? '#ffd23b' : '#4a4319'; c.beginPath(); c.arc(x, y - 46, 2.9, 0, 7); c.fill();
      c.fillStyle = grn ? '#3bff6a' : '#16402a'; c.beginPath(); c.arc(x, y - 39.5, 2.9, 0, 7); c.fill();
      const ly = red ? y - 52.5 : yel ? y - 46 : y - 39.5;
      if (FX.nf > 0.05) { litRect(x - 3.5, ly - 3.5, 7, 7); addEmit(x, ly, 15, red ? 2 : yel ? 5 : 3, 0.85); }
    } });
    pole(it.x0 - 14, it.y1 + 22, hOn, hYellow); pole(it.x1 + 14, it.y0 - 6, hOn, hYellow);
    pole(it.x0 - 14, it.y0 - 6, vOn, vYellow); pole(it.x1 + 14, it.y1 + 22, vOn, vYellow);
  });
  return out;
}
