/* ============================ the audience ============================
   Three seated tiers seen from behind, then a blurred foreground row. Bodies (shoulders, shirts, chairs) are baked per tier;
   heads are pre-blurred sprites drawn with a bounce, so the crowd can ripple and then erupt without per-frame vector work. */
const CIN_TIERS = [
  { depth: 1.04, y: 640, s: 0.58, dx: 50, x0: -560, n: 47, blur: 1.5, haze: 0.40, bounce: 1.0, seed: 301 },
  { depth: 1.12, y: 698, s: 0.82, dx: 70, x0: -600, n: 35, blur: 0.9, haze: 0.22, bounce: 1.3, seed: 302 },
  { depth: 1.26, y: 782, s: 1.12, dx: 96, x0: -640, n: 27, blur: 0.6, haze: 0.08, bounce: 1.7, seed: 303 }
];
const CIN_SKIN = ['#e0ac86', '#f2c9a5', '#8f5d3d', '#d99d77', '#c48a64', '#6b4430', '#f6d6b8'];
const CIN_HAIR = ['#2b2118', '#7a4a2a', '#1a1a1a', '#d8c27a', '#9a9aa2', '#4a2e1c', '#c9c0b4', '#8a3b22'];
const CIN_SHIRT = ['#2a3a62', '#3a2a44', '#1f3c4c', '#4a2630', '#2c4a3a', '#3c3c52', '#5a4a3a', '#233350'];

function cinBuildCrowd() {
  const L = CN.L, S = CN.S;
  L.floorFront = cnLayer(-900, 560, 3200, 800, 0.4, g => {
    g.fillStyle = cnLG(g, 0, 560, 0, 1360, [[0, '#122c28'], [0.2, '#0c2024'], [0.55, '#08121c'], [1, '#05080f']]); g.fillRect(-900, 560, 3200, 800);
    // warm spill from the stage lip, mown stripes, blades of grass catching the light
    g.fillStyle = cnLG(g, 0, 560, 0, 700, [[0, 'rgba(255,196,110,.22)'], [1, 'rgba(255,196,110,0)']]); g.fillRect(-900, 560, 3200, 140);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? 'rgba(120,200,140,.04)' : 'rgba(0,0,0,.08)'; g.fillRect(-900, 566 + i * i * 2.4, 3200, 6 + i * 2); }
    const r = mulberry32(55);
    for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(150,220,150,' + (0.05 + r() * 0.1) + ')'; const x = -900 + r() * 3200, y = 566 + r() * 700; g.fillRect(x, y, 1.2, 2 + r() * 3.5); }
    // the stage's cast shadow along its base and a few dropped programmes
    g.fillStyle = cnLG(g, 0, 556, 0, 600, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-900, 556, 3200, 44);
  });
  S.tiers = CIN_TIERS.map(T => cinMakeTier(T));
  S.fg = cinMakeForeground();
  S.balloons = cinMakeBalloons();
}

/* people of one tier (deterministic) */
function cinPeople(T) {
  const rnd = mulberry32(T.seed), out = [];
  for (let i = 0; i < T.n; i++) {
    const p = {
      i, x: T.x0 + i * T.dx + (rnd() - 0.5) * T.dx * 0.55, y: T.y + (rnd() - 0.5) * 7 * T.s + (i % 2) * 6 * T.s,
      v: Math.floor(rnd() * 12), shirt: Math.floor(rnd() * CIN_SHIRT.length), skin: Math.floor(rnd() * CIN_SKIN.length), hair: Math.floor(rnd() * CIN_HAIR.length),
      h: 0.93 + rnd() * 0.14, ph: rnd() * 6.28, arm: rnd() < 0.34, wave: rnd() < 0.5, phone: false, sign: -1
    };
    out.push(p);
  }
  return out;
}
function cinMakeTier(T) {
  const rnd = mulberry32(T.seed + 9), people = cinPeople(T);
  const s = T.s, lw = 2600, lh = 90 * s + 330;
  // mark special people (fixed picks so the cast of the crowd is the same every run)
  const pick = k => Math.floor(T.n * (k % 97) / 97);
  if (T.depth === CIN_TIERS[1].depth) {
    [[0.31, 0], [0.38, 1], [0.46, 2], [0.57, 3], [0.64, 4], [0.73, 5]].forEach((q, n) => { const p = people[Math.floor(T.n * q[0])]; p.sign = q[1]; p.arm = false; });
    [0.42, 0.68].forEach(q => { const p = people[Math.floor(T.n * q)]; p.phone = true; p.arm = false; });
  } else if (T.depth === CIN_TIERS[2].depth) {
    [0.4, 0.62].forEach(q => { const p = people[Math.floor(T.n * q)]; p.phone = true; p.arm = false; });
  } else { [0.35, 0.58, 0.8].forEach(q => { const p = people[Math.floor(T.n * q)]; p.phone = true; p.arm = false; }); }
  // body layer
  const body = cnLayer(T.x0 - 120, T.y - 78 * s, lw, lh, 0.8, g => {
    // folding chairs: pale backs with a metal frame, visible in the gaps
    people.forEach(p => {
      const cx = p.x, top = p.y + 6 * s;
      g.fillStyle = cnMix('#8d99a8', '#26335a', T.haze + 0.2); cnRR(g, cx - 28 * s, top - 4 * s, 56 * s, 40 * s, 4 * s); g.fill();
      g.strokeStyle = cnMix('#7d8794', '#1a2236', T.haze + 0.2); g.lineWidth = 2 * s; g.beginPath(); g.moveTo(cx - 26 * s, top + 34 * s); g.lineTo(cx - 28 * s, top + 120 * s); g.moveTo(cx + 26 * s, top + 34 * s); g.lineTo(cx + 28 * s, top + 120 * s); g.stroke();
    });
    people.forEach(p => {
      const col = cnMix(CIN_SHIRT[p.shirt], '#26335a', T.haze), cx = p.x, ty = p.y + 8 * s * p.h;
      g.fillStyle = col;
      g.beginPath(); g.moveTo(cx - 36 * s, ty + 60 * s); g.quadraticCurveTo(cx - 38 * s, ty + 8 * s, cx - 14 * s, ty + 2 * s); g.lineTo(cx + 14 * s, ty + 2 * s); g.quadraticCurveTo(cx + 38 * s, ty + 8 * s, cx + 36 * s, ty + 60 * s); g.lineTo(cx + 36 * s, ty + 330); g.lineTo(cx - 36 * s, ty + 330); g.closePath(); g.fill();
      g.fillStyle = cnLG(g, cx - 36 * s, 0, cx + 36 * s, 0, [[0, 'rgba(255,230,190,.16)'], [0.45, 'rgba(255,230,190,0)'], [1, 'rgba(6,8,30,.34)']]); g.fill();
      // rim light on the shoulder line (the stage is lit and in front of them)
      g.strokeStyle = 'rgba(255,214,160,' + (0.5 - T.haze * 0.5) + ')'; g.lineWidth = 1.5 * s + 0.4; g.beginPath(); g.moveTo(cx - 36 * s, ty + 40 * s); g.quadraticCurveTo(cx - 38 * s, ty + 8 * s, cx - 14 * s, ty + 2 * s); g.stroke();
      g.strokeStyle = 'rgba(255,214,160,' + (0.22 - T.haze * 0.2) + ')'; g.beginPath(); g.moveTo(cx - 14 * s, ty + 2 * s); g.lineTo(cx + 14 * s, ty + 2 * s); g.quadraticCurveTo(cx + 38 * s, ty + 8 * s, cx + 36 * s, ty + 26 * s); g.stroke();
      // collar / seam
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, ty + 4 * s); g.lineTo(cx, ty + 70 * s); g.stroke();
    });
    // toddlers riding on two grown-ups' shoulders
    [Math.floor(T.n * 0.2), Math.floor(T.n * 0.77)].forEach(i => {
      const p = people[i], cx = p.x, ty = p.y + 8 * s * p.h - 54 * s;
      g.fillStyle = cnMix('#e8a24a', '#3d4c78', T.haze); cnRR(g, cx - 13 * s, ty, 26 * s, 26 * s, 8 * s); g.fill();
      g.fillStyle = cnMix(CIN_SKIN[p.skin], '#3d4c78', T.haze + 0.1); g.beginPath(); g.arc(cx, ty - 8 * s, 10 * s, 0, CN_TAU); g.fill();
      g.fillStyle = cnMix('#5a3a22', '#26304c', T.haze); g.beginPath(); g.arc(cx, ty - 10 * s, 10 * s, Math.PI * 0.92, Math.PI * 0.08 + Math.PI * 2); g.fill();
      g.strokeStyle = cnMix(CIN_SKIN[p.skin], '#3d4c78', T.haze); g.lineWidth = 4 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 12 * s, ty + 6 * s); g.lineTo(cx - 24 * s, ty - 10 * s); g.moveTo(cx + 12 * s, ty + 6 * s); g.lineTo(cx + 24 * s, ty - 10 * s); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = 'rgba(255,214,160,.4)'; g.fillRect(cx - 13 * s, ty, 2 * s, 20 * s);
    });
    // atmospheric haze toward the back
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(70,92,150,' + (T.haze * 0.35) + ')'; g.fillRect(T.x0 - 120, T.y - 78 * s, lw, lh); g.globalCompositeOperation = 'source-over';
  });
  const soft = cnSoftLayer(body, T.blur);
  // pre-blurred head sprites
  const u = 1.6, cell = Math.ceil(110 * s * u), heads = [];
  for (let v = 0; v < 12; v++) {
    const cv = cnMk(cell, cell), g = cv.getContext('2d');
    cinCrowdHead(g, cell / 2, cell * 0.58, s * u, v, T);
    heads.push(cnSoften(cv, T.blur * u));
  }
  const arms = [];
  for (let k = 0; k < 2; k++) {
    const cv = cnMk(Math.ceil(40 * s * u), Math.ceil(110 * s * u)), g = cv.getContext('2d');
    // an upraised arm: sleeve, forearm, open hand; drawn pointing up from the bottom centre
    const w = cv.width, h = cv.height, x = w / 2;
    g.strokeStyle = cnMix('#3a4a78', '#3d4c78', T.haze); g.lineWidth = 11 * s * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, h - 4 * s * u); g.lineTo(x + (k ? 3 : -3) * s * u, h * 0.4); g.stroke();
    g.strokeStyle = cnMix(CIN_SKIN[k + 1], '#3d4c78', T.haze * 0.9); g.lineWidth = 8 * s * u; g.beginPath(); g.moveTo(x + (k ? 3 : -3) * s * u, h * 0.42); g.lineTo(x + (k ? 5 : -5) * s * u, h * 0.2); g.stroke();
    g.fillStyle = cnMix(CIN_SKIN[k + 1], '#3d4c78', T.haze * 0.9); g.beginPath(); g.arc(x + (k ? 5 : -5) * s * u, h * 0.16, 7.5 * s * u, 0, CN_TAU); g.fill();
    g.fillStyle = 'rgba(255,214,160,.4)'; g.fillRect(x - 6 * s * u, h * 0.4, 2 * s * u, h * 0.5);
    arms.push(cnSoften(cv, T.blur * u * 0.8));
  }
  return { T, people, body: soft, heads, arms, cell, u, rnd: mulberry32(T.seed + 4) };
}
/* a head seen from behind: hair mass with a warm rim from the stage lights */
function cinCrowdHead(g, cx, cy, u, v, T) {
  const skin = CIN_SKIN[v % CIN_SKIN.length], hair = CIN_HAIR[(v * 3 + 1) % CIN_HAIR.length];
  const hz = T.haze, hc = cnMix(hair, '#2a3558', hz), sc = cnMix(skin, '#3d4c78', hz + 0.12);
  // neck
  g.fillStyle = cnMix(sc, '#000000', 0.25); g.fillRect(cx - 6 * u, cy + 12 * u, 12 * u, 16 * u);
  const style = v;
  if (style === 5 || style === 11) { // long hair falling past the shoulders
    g.fillStyle = hc; g.beginPath(); g.moveTo(cx - 16 * u, cy - 4 * u); g.quadraticCurveTo(cx - 20 * u, cy + 26 * u, cx - 14 * u, cy + 38 * u); g.lineTo(cx + 14 * u, cy + 38 * u); g.quadraticCurveTo(cx + 20 * u, cy + 26 * u, cx + 16 * u, cy - 4 * u); g.closePath(); g.fill();
  }
  // ears
  if (style !== 5 && style !== 8) { g.fillStyle = sc; g.beginPath(); g.ellipse(cx - 15.2 * u, cy + 1 * u, 2.6 * u, 4 * u, 0, 0, CN_TAU); g.ellipse(cx + 15.2 * u, cy + 1 * u, 2.6 * u, 4 * u, 0, 0, CN_TAU); g.fill(); }
  // head / hair
  const rx = (style === 6 ? 21 : 15.6) * u, ry = (style === 6 ? 21 : 17.4) * u;
  g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, CN_TAU); g.fill();
  if (style === 1 || style === 3 || style === 7) { g.fillStyle = sc; g.beginPath(); g.ellipse(cx, cy + 12 * u, 11 * u, 6 * u, 0, 0, Math.PI); g.fill(); } // nape
  if (style === 4) { g.fillStyle = cnMix(skin, '#3d4c78', hz + 0.1); g.beginPath(); g.ellipse(cx, cy + 3 * u, 12 * u, 11 * u, 0, 0, CN_TAU); g.fill(); g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy - 4 * u, 15.6 * u, 12 * u, 0, Math.PI, 0); g.fill(); }
  if (style === 7) { g.fillStyle = hc; g.beginPath(); g.arc(cx, cy - 20 * u, 7 * u, 0, CN_TAU); g.fill(); }
  if (style === 8) { // wide sun hat
    g.fillStyle = cnMix('#e8d9a8', '#3d4c78', hz); cnEll(g, cx, cy - 4 * u, 27 * u, 8 * u, 0); g.fill();
    g.fillStyle = cnMix('#d9c48a', '#3d4c78', hz); g.beginPath(); g.ellipse(cx, cy - 8 * u, 14 * u, 11 * u, 0, Math.PI, 0); g.fill(); g.fillStyle = cnMix('#c9402f', '#3d4c78', hz); g.fillRect(cx - 14 * u, cy - 9 * u, 28 * u, 3 * u);
  }
  if (style === 9) { g.fillStyle = cnMix('#2c4a7a', '#26304c', hz); g.beginPath(); g.ellipse(cx, cy - 4 * u, 16 * u, 14 * u, 0, Math.PI, 0); g.fill(); g.fillRect(cx - 16 * u, cy - 4 * u, 32 * u, 4 * u); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(cx - 4 * u, cy - 6 * u, 8 * u, 2 * u); }
  if (style === 10) { g.fillStyle = cnMix('#c9402f', '#3d4c78', hz); g.beginPath(); g.ellipse(cx, cy - 2 * u, 16.4 * u, 15 * u, 0, Math.PI * 0.9, Math.PI * 2.1); g.fill(); }
  // rim light on the top-left edge and a fine strand texture
  g.strokeStyle = 'rgba(255,220,170,' + (0.8 - hz * 0.9) + ')'; g.lineWidth = 2.2 * u; g.beginPath(); g.ellipse(cx, cy, rx - 0.4 * u, ry - 0.4 * u, 0, Math.PI * 0.95, Math.PI * 1.62); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,' + (0.1 - hz * 0.1) + ')'; g.lineWidth = 0.8 * u; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 3 * u, cy - 14 * u); g.lineTo(cx + i * 3.6 * u, cy + 8 * u); g.stroke(); }
  g.fillStyle = cnLG(g, cx - rx, 0, cx + rx, 0, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(4,6,24,.38)']]);
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, CN_TAU); g.fill();
}

/* foreground silhouettes: big, dark, very soft */
function cinMakeForeground() {
  const rnd = mulberry32(404), s = 1.9, items = [];
  const L = cnLayer(-700, 780, 2700, 520, 0.6, g => {
    for (let i = 0; i < 12; i++) {
      const x = -560 + i * 214 + (rnd() - 0.5) * 70, y = 900 + (i % 2) * 40 + rnd() * 20, col = cnMix('#0a1220', CIN_SHIRT[i % 8], 0.18);
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 90, 1300); g.quadraticCurveTo(x - 100, y + 70, x - 40, y + 40); g.lineTo(x + 40, y + 40); g.quadraticCurveTo(x + 100, y + 70, x + 90, 1300); g.closePath(); g.fill();
      g.fillStyle = cnMix(CIN_HAIR[(i * 3) % 8], '#05080f', 0.55); g.beginPath(); g.ellipse(x, y, 32, 36, 0, 0, CN_TAU); g.fill();
      g.strokeStyle = 'rgba(255,200,140,.4)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 31, 35, 0, Math.PI * 0.95, Math.PI * 1.6); g.stroke();
      if (i % 4 === 1) { g.strokeStyle = col; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 52, y + 80); g.lineTo(x + 78, y - 60); g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(x + 80, y - 74, 15, 0, CN_TAU); g.fill(); }
    }
  });
  return { soft: cnSoftLayer(L, 5.5) };
}
function cinMakeBalloons() {
  const cols = ['#ff6b6b', '#ffc247', '#47b8ff', '#5bd39b', '#a393ff', '#ff9a3d', '#f4f0e6'], out = [];
  const spr = cols.map(col => {
    const cv = cnMk(44, 56), g = cv.getContext('2d');
    g.fillStyle = cnRG(g, 15, 16, 2, 22, 24, 22, [[0, cnShade(col, 0.5)], [0.35, col], [1, cnShade(col, -0.38)]]);
    g.beginPath(); g.moveTo(22, 4); g.bezierCurveTo(40, 4, 42, 30, 22, 46); g.bezierCurveTo(2, 30, 4, 4, 22, 4); g.fill();
    g.fillStyle = cnShade(col, -0.3); g.beginPath(); g.moveTo(22, 46); g.lineTo(18, 52); g.lineTo(26, 52); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(14, 14, 3.4, 6.4, -0.5, 0, CN_TAU); g.fill();
    return cv;
  });
  const rnd = mulberry32(88);
  [[60, 0], [112, 1], [166, 2], [1118, 3], [1176, 4], [1230, 5], [-120, 6], [1380, 0]].forEach((p, i) => {
    out.push({ x: p[0], y: 560 + rnd() * 40, ph: rnd() * 6.28, spr: spr[p[1] % 7], len: 70 + rnd() * 40, tie: [p[0] + (rnd() - 0.5) * 20, 676] });
  });
  return out;
}

/* ====================================================================================
   draw: back to front
   ==================================================================================== */
function cinCrowdDraw(c, V, ct) {
  const L = CN.L, S = CN.S;
  cinSet(c, V, 1.03); cnBlit(c, L.floorFront);
  const cheer = cnS5((ct - 9.8) / 1.2) * (1 - cnS5((ct - 15.2) / 0.8) * 0.0);
  for (let t = 0; t < S.tiers.length; t++) {
    const tr = S.tiers[t], T = tr.T;
    cinSet(c, V, T.depth);
    cnBlit(c, tr.body);
    if (t === 1) cinBalloons(c, ct);
    cinTierPeople(c, tr, ct, cheer);
  }
  // foreground: heavy bokeh, only really seen in the wide shots
  cinSet(c, V, 1.62); cnBlit(c, S.fg.soft);
  cinBokeh(c, ct);
}
function cinTierPeople(c, tr, ct, cheer) {
  const T = tr.T, s = T.s, u = tr.u, cell = tr.cell / u, ppl = tr.people;
  // visible x range in this layer is limited by the world-space culling the caller sets via c's transform; cull cheaply
  const V = CN.V, depth = T.depth, scl = V.k * (1 + (V.z - 1) * depth), ex = 640 + (V.cx - 640) * depth;
  const half = V.pw / scl / 2 + 120, lo = ex - half, hi = ex + half;
  for (let i = 0; i < ppl.length; i++) {
    const p = ppl[i];
    if (p.x < lo || p.x > hi) continue;
    const idle = Math.sin(ct * 1.3 + p.x * 0.012 + p.ph) * 0.9 * s + (p.wave ? Math.sin(ct * 2.6 - p.x * 0.008) * 0.9 * s : 0);
    const jump = Math.abs(Math.sin(ct * (4.2 + (i % 3) * 0.7) + p.ph)) * (cheer * 9 * s * T.bounce);
    const sway = Math.sin(ct * 1.1 + p.ph * 2) * (0.6 + cheer * 2.4) * s;
    const hy = p.y - 6 * s * p.h - jump - idle, hx = p.x + sway;
    // raised arms when cheering; the keen ones also wave a little before the eruption
    const armAmt = p.arm ? clamp(cheer * 1.4, 0, 1) : 0;
    if (armAmt > 0.05) {
      const a = tr.arms[i % 2], ang = Math.sin(ct * (6 + (i % 4)) + p.ph) * 0.28 * armAmt, ax = p.x + (i % 2 ? 24 : -24) * s, ay = p.y + 20 * s - jump * 0.6;
      c.save(); c.translate(ax, ay); c.rotate(ang); const ah = a.height / u * armAmt; c.drawImage(a, -a.width / u / 2, -ah, a.width / u, ah); c.restore();
    }
    c.drawImage(tr.heads[p.v % 12], hx - cell / 2, hy - cell * 0.58 - 6 * s, cell, cell);
    if (p.phone) cinPhone(c, p, s, ct, jump, T);
    if (p.sign >= 0) cinSign(c, p, s, ct, jump, T);
  }
}
function cinPhone(c, p, s, ct, jump, T) {
  const x = p.x + 22 * s + Math.sin(ct * 1.4 + p.ph) * 1.2 * s, y = p.y - 50 * s - jump * 0.7 - 4;
  c.strokeStyle = cnMix('#2a3a62', '#3d4c78', T.haze); c.lineWidth = 8 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x + 24 * s, p.y + 30 * s); c.lineTo(x, y + 14 * s); c.stroke(); c.lineCap = 'butt';
  c.fillStyle = '#0c1018'; cnRR(c, x - 8 * s, y - 14 * s, 16 * s, 28 * s, 2.4 * s); c.fill();
  c.fillStyle = cnMix('#bfe2ff', '#6f8fc0', T.haze); cnRR(c, x - 6.6 * s, y - 12.5 * s, 13.2 * s, 25 * s, 1.6 * s); c.fill();
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(CN.S.glowB, x - 24 * s, y - 24 * s, 48 * s, 48 * s); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function cinSign(c, p, s, ct, jump, T) {
  const cols = ['#5bd39b', '#47b8ff', '#ffc247', '#ff6b6b', '#f4f0e6', '#a393ff'], col = cnMix(cols[p.sign % 6], '#4a5a88', T.haze);
  const sway = Math.sin(ct * 1.2 + p.ph) * 0.05 + (ct > 9.8 ? Math.sin(ct * 5 + p.ph) * 0.06 : 0);
  const x = p.x - 18 * s, y = p.y + 16 * s - jump * 0.5;
  c.save(); c.translate(x, y); c.rotate(sway);
  c.strokeStyle = cnMix('#a88358', '#3d4c78', T.haze); c.lineWidth = 3.4 * s; c.beginPath(); c.moveTo(0, 6 * s); c.lineTo(0, -70 * s); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-26 * s + 2, -112 * s + 3, 52 * s, 38 * s);
  c.fillStyle = col; c.fillRect(-26 * s, -112 * s, 52 * s, 38 * s);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(-26 * s, -112 * s, 52 * s, 3 * s);
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(-26 * s, -78 * s, 52 * s, 4 * s);
  c.fillStyle = 'rgba(255,240,200,.7)'; c.fillRect(-26 * s, -112 * s, 7 * s, 4 * s); c.fillRect(19 * s, -78 * s, 7 * s, 4 * s);
  c.restore();
}
function cinBalloons(c, ct) {
  CN.S.balloons.forEach(b => {
    const sw = Math.sin(ct * 0.9 + b.ph) * 7, bx = b.x + sw, by = b.y + Math.sin(ct * 1.2 + b.ph) * 4;
    c.strokeStyle = 'rgba(230,230,240,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx, by + 50); c.quadraticCurveTo(bx - sw * 0.5, by + 50 + b.len * 0.5, b.tie[0], b.tie[1]); c.stroke();
    c.drawImage(b.spr, bx - 22, by - 4, 44, 56);
  });
}
/* out-of-focus lights in the foreground: phone screens and camera flashes as soft discs */
function cinBokeh(c, ct) {
  c.globalCompositeOperation = 'lighter';
  const cheer = cnS5((ct - 9.8) / 1.2);
  for (let i = 0; i < 9; i++) {
    const x = -300 + i * 250 + Math.sin(i * 3.1) * 60, y = 870 + (i % 3) * 42 + Math.sin(ct * 0.8 + i) * 4;
    const tw = 0.5 + 0.5 * Math.sin(ct * (1.2 + i * 0.13) + i * 2);
    const flash = (ct > 9.8 && ct < 14.6) ? Math.max(0, Math.sin(ct * 7.3 + i * 5.1)) ** 6 : 0;
    c.globalAlpha = 0.10 + tw * 0.07 + flash * 0.5 * cheer;
    c.drawImage(i % 2 ? CN.S.glowB : CN.S.glowW, x - 34, y - 34, 68, 68);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
