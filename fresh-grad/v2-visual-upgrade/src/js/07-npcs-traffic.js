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
// ---------- v2 cars: body gradients and highlights, wheel arches with turning hubcaps, glass that reflects the sky,
// lamps with glow, taxi sign and delivery van. Same footprint and lamp/beam hooks as before. ----------
function carWheel(c, wx, wy, r, pos, spd) {
  c.fillStyle = '#0c0f13'; c.beginPath(); c.arc(wx, wy, r + 1.3, Math.PI, 0); c.fill();
  c.fillStyle = '#16191f'; c.beginPath(); c.arc(wx, wy, r, 0, 7); c.fill();
  c.strokeStyle = '#2a2f37'; c.lineWidth = 0.9; c.beginPath(); c.arc(wx, wy, r - 0.5, 0, 7); c.stroke();
  c.fillStyle = '#aab3ba'; c.beginPath(); c.arc(wx, wy, r * 0.52, 0, 7); c.fill();
  if (spd > 120) { c.fillStyle = 'rgba(210,218,224,.35)'; c.beginPath(); c.arc(wx, wy, r * 0.5, 0, 7); c.fill(); }
  else {
    const a0 = pos / r; c.strokeStyle = '#5a636b'; c.lineWidth = 0.8; c.beginPath();
    for (let i = 0; i < 5; i++) { const a = a0 + i * 1.2566; c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * r * 0.5, wy + Math.sin(a) * r * 0.5); }
    c.stroke();
  }
  c.fillStyle = '#4a525a'; c.beginPath(); c.arc(wx, wy, r * 0.16, 0, 7); c.fill();
}
function carGlass(c, x0, y0, x1, y1) {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, FX.glassA); g.addColorStop(1, FX.glassB);
  c.fillStyle = g;
}
// The static body of each car (colour, kind, view, time-of-day glass) is painted once into a small sprite and blitted;
// wheels, tail lamps, shadows and the light hooks stay live.
const CAR_SPR = new Map();
function carSideStatic(c, k, kind, L, on, glint, sunny) {
  const dark = shade(k.col, -0.3), lite = shade(k.col, 0.32), mid = shade(k.col, -0.12);
    const tall = kind === 4 ? 13 : kind === 3 ? 11 : 10, c0 = kind === 4 ? -L / 2 + 3 : -L / 2 + 9, c1 = kind >= 3 ? L / 2 - 15 : L / 2 - 18, mx = (c0 + c1) / 2;
    c.fillStyle = dark; c.beginPath(); c.moveTo(c0, -6); c.lineTo(c0 + (kind === 4 ? 2 : 6), -6 - tall); c.lineTo(c1 - 8, -6 - tall); c.lineTo(c1, -6); c.closePath(); c.fill();
    if (kind === 4) {
      // cargo box: painted panels with ribs and a stripe, only the cab has glass
      c.fillStyle = lite; rr(c, c0, -6 - tall, c1 - 4 - c0, tall + 1, 1.5); c.fill();
      c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < 6; i++) c.fillRect(c0 + i * ((c1 - 4 - c0) / 6), -5 - tall, 0.8, tall);
      c.fillStyle = shade(k.col, -0.18); c.fillRect(c0, -4 - tall * 0.5, c1 - 4 - c0, 2.6);
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(c0 + 1, -5.4 - tall, c1 - 6 - c0, 1);
      carGlass(c, 0, -6 - tall, 0, -6); c.beginPath(); c.moveTo(c1 - 4, -6.5); c.lineTo(c1 - 4, -4 - tall); c.lineTo(c1 + 2, -4 - tall * 0.58); c.lineTo(c1 + 5, -6.5); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,' + (0.5 * glint + 0.1).toFixed(2) + ')'; c.beginPath(); c.moveTo(c1 - 3, -6.6); c.lineTo(c1 - 3, -4.6 - tall); c.lineTo(c1 - 1.4, -4.8 - tall * 0.9); c.lineTo(c1 + 0.6, -6.6); c.closePath(); c.fill();
    } else {
      // roof highlight, glass in two panes with a pillar between, a diagonal glint
      c.strokeStyle = 'rgba(255,255,255,' + (sunny ? 0.42 : 0.2) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(c0 + (kind === 4 ? 2 : 6) + 1, -6.6 - tall); c.lineTo(c1 - 8.5, -6.6 - tall); c.stroke();
      carGlass(c, 0, -6 - tall, 0, -6);
      c.beginPath(); c.moveTo(c0 + 3, -7); c.lineTo(c0 + 7.4, -4.4 - tall); c.lineTo(c1 - 9, -4.4 - tall); c.lineTo(c1 - 3, -7); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,' + (0.18 + glint * 0.6).toFixed(2) + ')'; c.beginPath(); c.moveTo(c1 - 15, -7); c.lineTo(c1 - 18.5, -4.6 - tall); c.lineTo(c1 - 13.4, -4.6 - tall); c.lineTo(c1 - 8.6, -7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(c0 + 5, -7); c.lineTo(c0 + 8.2, -4.6 - tall); c.lineTo(c0 + 10.4, -4.6 - tall); c.lineTo(c0 + 7.6, -7); c.closePath(); c.fill();
      c.fillStyle = dark; c.fillRect(mx - 1.2, -5 - tall, 2.4, tall);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(mx - 1.2, -5 - tall, 0.7, tall);
      if (kind === 3) { c.fillStyle = '#2a2f36'; c.fillRect(c0 + 7, -7.6 - tall, c1 - c0 - 15, 1.1); }
    }
    // body
    c.fillStyle = k.col; rr(c, -L / 2, -8, L, 13, 4.5); c.fill();
    c.save(); rr(c, -L / 2, -8, L, 13, 4.5); c.clip();
    c.fillStyle = lite; c.globalAlpha = sunny ? 0.85 : 0.5; c.fillRect(-L / 2, -8, L, 2.4); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(-L / 2, -5.6, L, 2.4);
    c.fillStyle = dark; c.globalAlpha = 0.6; c.fillRect(-L / 2, 1.6, L, 4); c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-L / 2, -2.4, L, 0.8); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-L / 2, -1.6, L, 0.6);
    c.restore();
    // doors: seams, handles
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(mx - 0.5, -6, 1, 9); c.fillRect(c0 + 1.5, -5.5, 0.8, 8); c.fillRect(c1 - 1, -5.5, 0.8, 8);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(mx + 2.5, -3.6, 3, 1); c.fillRect(mx - 7, -3.6, 3, 1);
    // bumpers and a side mirror
    c.fillStyle = '#2c3138'; rr(c, -L / 2 - 0.4, 1.6, 4.4, 3.6, 1.4); c.fill(); rr(c, L / 2 - 4, 1.6, 4.4, 3.6, 1.4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(L / 2 - 3.4, 1.9, 3, 0.7);
    c.fillStyle = mid; rr(c, c1 - 9.5, -7.4, 3.2, 2, 1); c.fill();
    if (kind === 5) {
      // taxi: lit roof sign and a chequered band
      c.fillStyle = '#20242c'; rr(c, -5, -9.4 - tall, 10, 4.4, 1.5); c.fill();
      c.fillStyle = on ? '#fff3b0' : '#f6f1e7'; c.fillRect(-3.6, -8.6 - tall, 7.2, 2.6); c.fillStyle = '#9a7a10'; c.fillRect(-2.4, -7.9 - tall, 4.8, 0.7);
      c.fillStyle = '#20242c'; for (let i = 0; i < 7; i++) c.fillRect(-L / 2 + 6 + i * 7, -2.1, 3.5, 1.6);
    }
    // lamps: a lens with a bright core, tail lamp that glows when braking
    const hg = c.createLinearGradient(L / 2 - 4, 0, L / 2, 0); hg.addColorStop(0, on ? '#fff6c4' : '#e8dfae'); hg.addColorStop(1, on ? '#ffffff' : '#f4efd0');
    c.fillStyle = hg; rr(c, L / 2 - 4.4, -4.8, 4.4, 4.8, 1.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(L / 2 - 3.6, -4.2, 2.2, 0.9);
}
function carTopStatic(c, k, kind, L, W, on, glint, sunny) {
  const dark = shade(k.col, -0.3), lite = shade(k.col, 0.32), mid = shade(k.col, -0.12);
    c.fillStyle = '#101318'; rr(c, -W / 2 - 2, -L / 2 + 6, 3.6, 10, 1.4); c.fill(); rr(c, W / 2 - 1.6, -L / 2 + 6, 3.6, 10, 1.4); c.fill(); rr(c, -W / 2 - 2, L / 2 - 17, 3.6, 10, 1.4); c.fill(); rr(c, W / 2 - 1.6, L / 2 - 17, 3.6, 10, 1.4); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(-W / 2 - 1.6, -L / 2 + 7, 0.9, 8); c.fillRect(-W / 2 - 1.6, L / 2 - 16, 0.9, 8);
    // body, lit from the left
    const bg = c.createLinearGradient(-W / 2, 0, W / 2, 0); bg.addColorStop(0, shade(k.col, 0.14)); bg.addColorStop(0.5, k.col); bg.addColorStop(1, shade(k.col, -0.2));
    c.fillStyle = bg; rr(c, -W / 2, -L / 2, W, L, 7); c.fill();
    c.fillStyle = lite; c.globalAlpha = 0.7; rr(c, -W / 2 + 3, -L / 2 + 1.6, W - 6, 2.6, 1.3); c.fill(); c.globalAlpha = 1;
    // hood and bonnet creases at the front
    c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, -W / 2 + 4, L / 2 - 12.5, W - 8, 8, 3); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-W / 2 + 6, L / 2 - 12.5); c.lineTo(-W / 2 + 6, L / 2 - 5); c.moveTo(W / 2 - 6, L / 2 - 12.5); c.lineTo(W / 2 - 6, L / 2 - 5); c.stroke();
    // roof and glass
    c.fillStyle = dark; rr(c, -W / 2 + 3, -L / 2 + 10, W - 6, L - 24, 4); c.fill();
    carGlass(c, 0, L / 2 - 20, 0, L / 2 - 12);
    c.beginPath(); c.moveTo(-W / 2 + 4, L / 2 - 20); c.lineTo(W / 2 - 4, L / 2 - 20); c.lineTo(W / 2 - 6, L / 2 - 13); c.lineTo(-W / 2 + 6, L / 2 - 13); c.closePath(); c.fill();
    c.fillRect(-W / 2 + 5, -L / 2 + 10, W - 10, 4);
    c.fillStyle = 'rgba(255,255,255,' + (0.2 + glint * 0.6).toFixed(2) + ')'; c.beginPath(); c.moveTo(-W / 2 + 6, L / 2 - 19.4); c.lineTo(-W / 2 + 12, L / 2 - 19.4); c.lineTo(-W / 2 + 10.5, L / 2 - 13.6); c.lineTo(-W / 2 + 7.4, L / 2 - 13.6); c.closePath(); c.fill();
    const rg = c.createLinearGradient(-W / 2 + 4.5, 0, W / 2 - 4.5, 0); rg.addColorStop(0, shade(k.col, 0.2)); rg.addColorStop(1, shade(k.col, 0.02));
    c.fillStyle = rg; rr(c, -W / 2 + 4.5, -L / 2 + 15, W - 9, L - 37, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,' + (sunny ? 0.3 : 0.15) + ')'; rr(c, -W / 2 + 5.5, -L / 2 + 16, 4, L - 39, 2); c.fill();
    if (kind === 4) { c.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < 4; i++) c.fillRect(-W / 2 + 5, -L / 2 + 18 + i * ((L - 44) / 3), W - 10, 0.9); }
    if (kind === 5) { c.fillStyle = '#20242c'; rr(c, -5, -4, 10, 5.4, 1.6); c.fill(); c.fillStyle = on ? '#fff3b0' : '#f6f1e7'; c.fillRect(-4, -3.2, 8, 3.2); }
    // side mirrors
    c.fillStyle = mid; rr(c, -W / 2 - 1.8, L / 2 - 19, 2.8, 2.2, 1); c.fill(); rr(c, W / 2 - 1, L / 2 - 19, 2.8, 2.2, 1); c.fill();
    // lamps
    c.fillStyle = on ? '#fff6c4' : '#f2e9b8'; rr(c, -W / 2 + 2.5, L / 2 - 3.8, 6.4, 3.2, 1.2); c.fill(); rr(c, W / 2 - 8.9, L / 2 - 3.8, 6.4, 3.2, 1.2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-W / 2 + 3.4, L / 2 - 3.2, 2.6, 0.8); c.fillRect(W / 2 - 8, L / 2 - 3.2, 2.6, 0.8);
    c.fillStyle = '#2c3138'; rr(c, -W / 2 + 9.6, L / 2 - 3.2, W - 19.2, 2.4, 1); c.fill();
}
function carSprite(c, k, kind, axis, L, W, on, glint, sunny) {
  const m = c.getTransform ? Math.abs(c.getTransform().a) : 1, R = Math.min(3, Math.max(1, Math.ceil(m - 0.15)));
  const key = axis + kind + k.col + L + (on ? 1 : 0) + (sunny ? 1 : 0) + '|' + Math.floor((S ? S.t : 0) / 30) + '|' + R;
  let e = CAR_SPR.get(key);
  if (!e) {
    if (CAR_SPR.size > 120) CAR_SPR.clear();
    const cv = document.createElement('canvas'), g = (axis === 'x');
    const w = g ? L + 6 : W + 8, h = g ? 33 : L + 4, ox = w / 2, oy = g ? 25 : h / 2;
    cv.width = Math.ceil(w * R); cv.height = Math.ceil(h * R);
    const x = cv.getContext('2d'); x.setTransform(R, 0, 0, R, ox * R, oy * R);
    if (g) carSideStatic(x, k, kind, L, on, glint, sunny); else carTopStatic(x, k, kind, L, W, on, glint, sunny);
    e = { cv, w, h, ox, oy }; CAR_SPR.set(key, e);
  }
  return e;
}
function drawCar(c, k) {
  const p = carXY(k), kind = carKind(k), on = FX.nf > 0.05, braking = k.v < k.spd * 0.45;
  const sd = FX.sh.a > 0.02 ? FX.sh.dx : 0, glint = parseFloat(FX.glint) || 0, sunny = FX.sh.a > 0.12;
  if (k.lane.ax === 'x') {
    const x = p.x, y = p.y, L = k.len, d = k.lane.dir;
    c.fillStyle = 'rgba(6,10,22,.14)'; c.beginPath(); c.ellipse(x + sd * 3, y + 9.6, L / 2 + 4, 5.2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(6,10,22,.3)'; c.beginPath(); c.ellipse(x + sd * 1.4, y + 9, L / 2 - 1, 3, 0, 0, 7); c.fill();
    c.save(); c.translate(x, y); c.scale(d, 1);
    const e = carSprite(c, k, kind, 'x', L, 0, on, glint, sunny);
    c.drawImage(e.cv, -e.ox, -e.oy, e.w, e.h);
    carWheel(c, -L / 2 + 11, 5.5, 5.2, p.x * d, k.v); carWheel(c, L / 2 - 12, 5.5, 5.2, p.x * d, k.v);
    c.fillStyle = braking ? '#ff4a3c' : '#a83026'; rr(c, -L / 2, -4.8, 3.4, 4.8, 1.2); c.fill();
    c.fillStyle = braking ? 'rgba(255,200,180,.8)' : 'rgba(255,255,255,.2)'; c.fillRect(-L / 2 + 0.6, -4.2, 1.4, 0.9);
    c.restore();
    if (on) {
      FX.beams.push(x + d * (L / 2 - 2), y + 3, d > 0 ? 0 : Math.PI);
      addEmit(x + d * (L / 2 - 2), y - 2, 15, 0, 0.95);
      addEmit(x - d * (L / 2 - 1), y - 2, braking ? 17 : 10, 2, braking ? 0.95 : 0.55);
    }
    if (FX.A && FX.A.wet > 0.08) {
      FX.refl.push(x + d * (L / 2 - 2), y + 9, 0, 0.4, 16); FX.refl.push(x - d * (L / 2 - 1), y + 9, 2, braking ? 0.45 : 0.26, braking ? 15 : 10);
    }
  } else {
    const x = p.x, y = p.y, L = k.len - 8, W = 26, d = k.lane.dir;
    c.fillStyle = 'rgba(6,10,22,.12)'; rr(c, x - W / 2 + 1 + sd * 2.5, y - L / 2 + 5, W + 4, L + 2, 8); c.fill();
    c.fillStyle = 'rgba(6,10,22,.26)'; rr(c, x - W / 2 + 2 + sd * 1.2, y - L / 2 + 5, W - 1, L, 7); c.fill();
    c.save(); c.translate(x, y); c.scale(1, d);
    const e = carSprite(c, k, kind, 'y', L, W, on, glint, sunny);
    c.drawImage(e.cv, -e.ox, -e.oy, e.w, e.h);
    c.fillStyle = braking ? '#ff4a3c' : '#a83026'; rr(c, -W / 2 + 2.5, -L / 2 + 0.5, 6.4, 2.8, 1); c.fill(); rr(c, W / 2 - 8.9, -L / 2 + 0.5, 6.4, 2.8, 1); c.fill();
    if (braking) { c.fillStyle = 'rgba(255,215,200,.6)'; c.fillRect(-W / 2 + 3.2, -L / 2 + 1, 4.6, 0.8); c.fillRect(W / 2 - 8.2, -L / 2 + 1, 4.6, 0.8); }
    c.restore();
    if (on) {
      FX.beams.push(x, y + d * (L / 2 - 2), d > 0 ? Math.PI / 2 : -Math.PI / 2);
      addEmit(x - 8, y + d * (L / 2 - 2), 12, 0, 0.9); addEmit(x + 8, y + d * (L / 2 - 2), 12, 0, 0.9);
      addEmit(x, y - d * (L / 2 - 1), braking ? 17 : 10, 2, braking ? 0.9 : 0.5);
    }
    if (FX.A && FX.A.wet > 0.08) {
      FX.refl.push(x - 8, y + d * (L / 2 + 4), 0, 0.3, 12); FX.refl.push(x + 8, y + d * (L / 2 + 4), 0, 0.3, 12);
      FX.refl.push(x, y - d * (L / 2 - 4), 2, braking ? 0.4 : 0.22, 12);
    }
  }
}
function trafficLightItems(c) {
  const st = lightState(FX.time), ph = FX.time % 18, out = [];
  INTERSECTIONS.forEach(it => {
    const hOn = st === 'H', vOn = st === 'V';
    const hYellow = hOn && ph > 6, vYellow = vOn && ph > 15;
    const pole = (x, y, on, yel) => out.push({ x, y, f: () => {
      // ground contact shadow, footing and a pole lit from the left
      c.fillStyle = 'rgba(8,12,24,.2)'; c.beginPath(); c.ellipse(x + 1.4, y + 1, 5.6, 2, 0, 0, 7); c.fill();
      c.fillStyle = '#1b222a'; c.fillRect(x - 3.4, y - 4, 6.8, 5); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 3.4, y - 4, 6.8, 0.9);
      const pg = c.createLinearGradient(x - 1.5, 0, x + 1.5, 0); pg.addColorStop(0, '#4a5662'); pg.addColorStop(0.45, '#2b343d'); pg.addColorStop(1, '#161c22');
      c.fillStyle = pg; c.fillRect(x - 1.5, y - 36, 3, 33);
      c.fillStyle = '#1b222a'; c.fillRect(x - 2.4, y - 14, 4.8, 1.6); c.fillRect(x - 2.4, y - 33, 4.8, 1.4);
      // the housing, a back plate and a hood over each lens
      c.fillStyle = '#0c1014'; rr(c, x - 6.4, y - 59, 12.8, 26, 3.2); c.fill();
      const hg = c.createLinearGradient(x - 5.5, 0, x + 5.5, 0); hg.addColorStop(0, '#2c343d'); hg.addColorStop(0.35, '#171c22'); hg.addColorStop(1, '#0d1115');
      c.fillStyle = hg; rr(c, x - 5.5, y - 58, 11, 24, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 5.2, y - 56.5, 1.2, 21); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x - 5, y - 58, 10, 0.9);
      const red = !on, grn = on && !yel, ys = [y - 52.5, y - 46, y - 39.5];
      const lens = (ly, lit, col, dim) => {
        c.fillStyle = '#05070a'; c.beginPath(); c.arc(x, ly, 3.5, 0, 7); c.fill();
        c.fillStyle = lit ? col : dim; c.beginPath(); c.arc(x, ly, 2.9, 0, 7); c.fill();
        if (lit) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - 0.7, ly - 0.8, 1.2, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.5; c.beginPath(); c.arc(x, ly, 3.1, 0, 7); c.stroke(); }
        else { c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(x - 0.8, ly - 0.9, 0.9, 0, 7); c.fill(); }
        c.fillStyle = '#0a0d11'; c.beginPath(); c.moveTo(x - 4.2, ly - 1); c.quadraticCurveTo(x, ly - 5.4, x + 4.2, ly - 1); c.lineTo(x + 4.2, ly - 2.4); c.quadraticCurveTo(x, ly - 6.4, x - 4.2, ly - 2.4); c.closePath(); c.fill();
      };
      lens(ys[0], red, '#ff4038', '#4a1d1d'); lens(ys[1], yel, '#ffd23b', '#4a4319'); lens(ys[2], grn, '#3bff6a', '#16402a');
      const ly = red ? ys[0] : yel ? ys[1] : ys[2], kd = red ? 2 : yel ? 5 : 3;
      if (FX.nf > 0.05) { litRect(x - 3.5, ly - 3.5, 7, 7); addEmit(x, ly, 17, kd, 0.9); }
      else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; c.drawImage(GLOW[kd], x - 8, ly - 8, 16, 16); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      if (FX.A && FX.A.wet > 0.08) FX.refl.push(x, y + 6, kd, 0.5, 11);
    } });
    pole(it.x0 - 14, it.y1 + 22, hOn, hYellow); pole(it.x1 + 14, it.y0 - 6, hOn, hYellow);
    pole(it.x0 - 14, it.y0 - 6, vOn, vYellow); pole(it.x1 + 14, it.y1 + 22, vOn, vYellow);
  });
  return out;
}
