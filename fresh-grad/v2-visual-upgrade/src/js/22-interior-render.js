/* ============================ floors, walls, whole-room drawing ============================ */
/* a floor is [x, y, w, h, type, col, col2]; a room's style table may refine it (see ROOM_STYLE) */
function drawFloor(c, f, o) {
  const [x, y, w, h, type, col, col2] = f;
  o = o || {};
  if (o.seed == null) o.seed = (Math.round(x) * 7 + Math.round(y) * 3) % 97;
  const fn = IM.floors[o.kind || type] || IM.floors.plain;
  fn(c, x, y, w, h, o.col || col, o.col2 !== undefined ? o.col2 : col2, o);
  // the wall above casts a soft shadow onto the floor
  if (!o.noShadow) {
    const sg = c.createLinearGradient(0, y, 0, y + 26); sg.addColorStop(0, 'rgba(' + IM.INK + ',.34)'); sg.addColorStop(0.45, 'rgba(' + IM.INK + ',.12)'); sg.addColorStop(1, 'rgba(' + IM.INK + ',0)');
    c.fillStyle = sg; c.fillRect(x, y, w, Math.min(26, h));
  }
}
/* one cached layer for the static part of whichever room is on screen */
const LAYER = { name: '', res: 0, cv: null, rec: null, live: null };
function layerCache(name, w, h, paint) {
  const res = clamp(Math.min(Math.ceil((FX.m || 1) * 4) / 4, Math.sqrt(6e6 / (w * h))), 1, 2);
  if (LAYER.name !== name || LAYER.res !== res) {
    const cv = LAYER.cv || (LAYER.cv = document.createElement('canvas'));
    cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const g = cv.getContext('2d'); g.setTransform(res, 0, 0, res, 0, 0);
    LAYER.res = res; LAYER.name = name; LAYER.live = null; LAYER.clocks = null;
    try { LAYER.rec = captureStatic(() => paint(g)); }
    catch (e) { LAYER.rec = { glows: [], lights: [], emit: [], wins: [] }; if (typeof console !== 'undefined') console.warn('room paint failed', e); }
  }
  return LAYER.cv;
}
function drawIntBase(c, d) {
  ROOMCTX.d = d; ROOMCTX.st = roomStyle(d); ROOMCTX.sc = false;
  const cv = layerCache('int:' + roomSig(d), d.w, d.h, g => paintRoom(g, d)), rec = LAYER.rec;
  drawWindowViews(c, rec);                       // the sky, live, behind the glass holes
  c.drawImage(cv, 0, 0, d.w, d.h);
  replayLights(rec);                             // lamps, signs and screens painted into the layer
  liveFurn(c, d);                                // screens, flames, LEDs, tumbling washers
  liveClocks(c); if (ROOMCTX.st.live) ROOMCTX.st.live(c, d);
  drawRoomLight(c, d, rec);                      // sun pools, door spill, dust
}
/* everything static in a room, once per visit */
function paintRoom(g, d) {
  const st = roomStyle(d);
  d.floors.forEach((f, i) => drawFloor(g, f, st.floors && st.floors[i] ? Object.assign({}, st.floors[i]) : null));
  paintBackWall(g, d, st);
  paintShellEdges(g, d, st);
  paintExitDoor(g, d, st);
  d.walls.forEach(r => wallBlock(g, r, d));
  if (d.deco) d.deco(g, d);
  if (st.extra) st.extra(g, d);
  // flat things first, then furniture back to front
  d.furn.filter(f => FURN_FLAT[f.t] && (!f.when || f.when())).forEach(f => drawFurn(g, f));
  d.furn.filter(f => !FURN_FLAT[f.t] && (!f.when || f.when())).slice().sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach(f => drawFurn(g, f));
  if (st.over) st.over(g, d);
  LAYER.live = d.furn.filter(f => FURN_LIVE[f.t] && (!f.when || f.when()));
  paintRoomGrade(g, d);
}
function liveFurn(c, d) {
  const L = LAYER.live; if (!L) return;
  for (let i = 0; i < L.length; i++) FURN_LIVE[L[i].t](c, L[i], d);
}


/* ============================ walking around, spots and people ============================ */
function folkPos(fid) {
  const n = npcById(fid); if (n) return n;
  if (S.scene === 'int') return INT[S.intId].folkObjs.find(f => f.id === fid) || null;
  return null;
}
function intNear() {
  const d = INT[S.intId]; let best = null, bd = 1e9;
  for (const s of d.spots) { if (s.when && !s.when()) continue; const dist = Math.hypot(S.px - s.x, S.py - s.y); if (dist < s.r && dist < bd) { bd = dist; best = { id: s.id, prompt: s.prompt ? s.prompt() : s.label }; } }
  for (const f of d.folkObjs) { const dist = Math.hypot(S.px - f.x, (S.py - f.y) * 1.1); if (dist < 90 && dist - 14 < bd) { bd = dist - 14; best = { id: 'npc:' + f.id, prompt: 'Talk to ' + f.name }; } }
  return best;
}
function enterInterior(bid) {
  const id = bid === 'work' ? 'work_' + S.degree : bid;
  const d = INT[id];
  if (!d) return;
  S.townX = S.px; S.townY = S.py;
  S.scene = 'int'; S.intId = id; S.px = d.spawn.x; S.py = d.spawn.y; S.face = 1;
  const nst = stampPlace(bid, true);
  G.target = null; G.autoEnter = null; G.near = null; G.pathQ = []; CAM.ready = false;
  $('#prompt').hidden = true;
  d.folkObjs.forEach(f => { f.phase = 0; });
  toast('You step into ' + intName(id) + '.' + (nst ? ' Passport stamp ' + nst + ' of ' + PASSPORT.length + '.' : ''), '');
}
function leaveInterior() {
  const bid = intBuilding(S.intId);
  S.scene = 'town'; S.intId = null;
  const dr = DOORS[bid]; S.px = dr.x; S.py = dr.y + 14; S.face = 1;
  G.target = null; G.autoEnter = null; G.near = null; G.pathQ = []; CAM.ready = false; G.talk = null;
  $('#prompt').hidden = true;
}
/* when the building closes around you, you are shown out */
function checkInteriorHours() {
  if (S.scene !== 'int' || G.skip) return;
  const bid = intBuilding(S.intId);
  if (!isOpen(bid)) {
    toast(intName(S.intId) + ' is closing. You step back outside.', 'warn');
    G.inside = null; $('#panel').hidden = true; G.talk = null;
    leaveInterior();
  }
}

/* what each spot's panel shows: pieces of the old building menus */
function PN(bid, o) {
  return () => {
    const spec = BUILDERS[bid]();
    let secs = spec.sections;
    if (o.secs) secs = secs.filter(s => o.secs.includes(s.h));
    secs = secs.map(s => Object.assign({}, s, { items: o.only ? s.items.filter(it => o.only(it.t)) : s.items })).filter(s => s.items.length);
    return Object.assign({}, spec, {
      sections: secs, title: o.title || spec.title, sub: o.sub !== undefined ? o.sub : spec.sub,
      note: o.note ? (typeof o.note === 'function' ? o.note() : o.note) : spec.note, band: o.band || spec.band, bad: o.note ? false : spec.bad
    });
  };
}
function intSpec(spotId) {
  const d = INT[S.intId], s = d.spots.find(x => x.id === spotId);
  if (!s || !s.panel) return { band: '#3a4a58', title: d.name || 'Here', sub: '', note: '', sections: [] };
  return s.panel();
}

/* ============================ drawing the scene ============================ */
/* indoor lighting: daylight by day, warm lamps overhead once it is dark outside */
function roomLights(w, h, step) {
  const A = FX.A, st = ROOMCTX.st;
  if (FX.nf <= 0.05) return [255, 255, 255];
  const L = st && !ROOMCTX.sc && st.lamps;
  if (L) for (let i = 0; i < L.length; i++) { const l = L[i]; addLight(l[0], l[1], l[2], l[3], l[4] || 0, l[5] == null ? 0.9 : l[5]); }
  else for (let y = 150; y < h - 40; y += step * 0.8) for (let x = step * 0.5; x < w; x += step) {
    if (x < CAM.x - 200 || x > CAM.x + CAM.vw + 200 || y < CAM.y - 160 || y > CAM.y + CAM.vh + 160) continue;
    addLight(x, y, 190, 150, 0, 0.62);
  }
  return mix3([255, 255, 255], (st && st.night) || [150, 136, 160], clamp(A.nf, 0, 1));
}
function targetRing(c) {
  if (!G.target) return;
  const r = 8 + Math.sin(FX.time * 8) * 1.6;
  c.strokeStyle = 'rgba(20,24,40,.45)'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(G.target.x, G.target.y, r, r * 0.55, 0, 0, 7); c.stroke();
  c.strokeStyle = '#ffc247'; c.lineWidth = 2; c.stroke();
}
function renderInterior(dt) {
  const cv = $('#world'), d = INT[S.intId];
  if (!d) return;
  if (!wctx) wctx = cv.getContext('2d');
  const c = wctx, sz = sizeCanvas(cv);
  if (sz.w < 2 || sz.h < 2) return;
  const k = Math.max(clamp(sz.w / 880, 0.72, 1.7), sz.w / d.w, sz.h / d.h);
  const vw = sz.w / k, vh = sz.h / k;
  const tx = clamp(S.px - vw / 2, 0, Math.max(0, d.w - vw)), ty = clamp(S.py - 30 - vh / 2, 0, Math.max(0, d.h - vh));
  if (!CAM.ready) { CAM.x = tx; CAM.y = ty; CAM.ready = true; FX.fade = 1; }
  const f = 1 - Math.exp(-9 * Math.min(dt, 0.05));
  CAM.x = lerp(CAM.x, tx, f); CAM.y = lerp(CAM.y, ty, f); CAM.k = k; CAM.vw = vw; CAM.vh = vh;
  beginFrame(skyAt(S.t, S.day)); FX.demo = false;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#12161d'; c.fillRect(0, 0, cv.width, cv.height);
  const m = sz.dpr * k; FX.m = m;
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m);
  drawIntBase(c, d);
  const items = [];
  d.folkObjs.forEach(fo => items.push({ y: fo.y, f: () => { fo.face = S.px >= fo.x ? 1 : -1; drawPerson(c, fo.x, fo.y, fo); drawNpcTag(c, fo); } }));
  items.push({ y: S.py, f: () => drawPerson(c, S.px, S.py, Object.assign({}, PLAYER_LOOK, { face: S.face, phase: G.phase || 0, moving: !!G.moving })) });
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());
  targetRing(c);
  drawSpotMarkers(c, d); drawParticles(c);
  const amb = roomLights(d.w, d.h, 250);
  lightPass(c, cv, m, { amb });
  runOver(c, m);
  finishFrame(c, cv, dt, 0.56);
  drawMinimap();
}
/* ============================ interior layouts ============================ */
FURN_FLAT.board = 1;
function sign(c, text, cx, y, w, col) {
  const st = ROOMCTX.st, x = cx - w / 2, y0 = y - 11, h = 22;
  IM.shadow(c, x, y0, w, h, 6, 5, 0.36, 1, 3);
  c.fillStyle = IM.grad(c, 0, y0, 0, y0 + h, [[0, shade(col, 0.16)], [0.5, col], [1, shade(col, -0.2)]]); rr(c, x, y0, w, h, 6); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, x + 0.5, y0 + 0.5, w - 1, h - 1, 5.5); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.16)'; rr(c, x + 2.6, y0 + 2.6, w - 5.2, h - 5.2, 4); c.stroke();
  c.fillStyle = 'rgba(' + IM.INK + ',.22)'; rr(c, x + 1, y0 + h - 4, w - 2, 3, 2); c.fill();
  c.fillStyle = IM.grad(c, 0, y0, 0, y0 + h * 0.55, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]); rr(c, x + 1, y0 + 1, w - 2, h * 0.55, 5); c.fill();
  c.fillStyle = 'rgba(' + IM.INK + ',.4)'; c.beginPath(); c.arc(x + 4.5, y, 1.1, 0, 7); c.arc(x + w - 4.5, y, 1.1, 0, 7); c.fill();
  c.font = '800 11px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(' + IM.INK + ',.45)'; c.fillText(text, cx + 0.7, y + 1.4);
  c.fillStyle = '#fff7e8'; c.fillText(text, cx, y + 0.5);
  addEmit(cx, y, Math.min(w * 0.6, 90), st && st.neon ? (st.neonKind || 0) : 0, st && st.neon ? 0.34 : 0.16);
}
const folkAt = (fid, x, y) => ({ id: fid, x, y });
const MEAL_SECS = ['Meals'];

/* ---------- apartment: lobby on the left, Apt 12 on the right ---------- */
defInt('apartment', {
  name: 'Maple Court, Apt 12', w: 1000, h: 640, exit: { x: 180 },
  wallCol: '#d8c9b4', trim: '#a8957a',
  floors: [[34, TW, 296, 514, 'tile', '#d8d2c4'], [330, TW, 28, 514, 'plain', '#b9a07a'], [358, TW, 608, 514, 'wood', '#c9a06a']],
  walls: [[330, TW, 28, 316], [330, 480, 28, 118]],
  deco(c, d) {
    winTop(c, 100, 90); winTop(c, 560, 80); winTop(c, 760, 70);
    sign(c, 'LOBBY', 262, 52, 90, '#7a5a3a');
    c.fillStyle = '#5a3b2a'; c.fillRect(326, 396, 36, 6); c.fillRect(326, 478, 36, 6);
    sign(c, 'APT 12', 344, 438, 56, '#8a4a38');
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(34, 512, 296, 2);
  },
  furn: [
    { t: 'mailbox', x: 60, y: 96, w: 170, h: 34 }, { t: 'plant', x: 270, y: 120, w: 30, h: 32 }, { t: 'plant', x: 46, y: 524, w: 30, h: 32 },
    { t: 'rug', x: 64, y: 372, w: 210, h: 66, c: '#6f7bd4' }, { t: 'desk', x: 70, y: 290, w: 130, h: 50, c: '#8b6240', screen: '#9be7a8' },
    { t: 'bench', x: 160, y: 476, w: 110, h: 28 },
    // the apartment
    { t: 'fridge', x: 380, y: 98, w: 48, h: 70 }, { t: 'sink', x: 432, y: 98, w: 76, h: 50 }, { t: 'stove', x: 512, y: 98, w: 60, h: 50 }, { t: 'counter', x: 576, y: 98, w: 70, h: 50, c: '#8b6240', top: '#d9d3c6' },
    { t: 'tv', x: 700, y: 100, w: 92, h: 24 }, { t: 'rug', x: 660, y: 160, w: 220, h: 150, c: '#8a4a38' }, { t: 'sofa', x: 690, y: 252, w: 150, h: 56 },
    { t: 'bed', x: 850, y: 100, w: 100, h: 140, c: '#4a78b5' }, { t: 'table', x: 812, y: 110, w: 32, h: 32, c: '#7d5434' },
    { t: 'table', x: 400, y: 244, w: 96, h: 56, c: '#9c7a4f' }, { t: 'chair', x: 404, y: 212, w: 26, h: 24 }, { t: 'chair', x: 466, y: 212, w: 26, h: 24 }, { t: 'chair', x: 404, y: 308, w: 26, h: 24 }, { t: 'chair', x: 466, y: 308, w: 26, h: 24 },
    { t: 'plant', x: 926, y: 540, w: 30, h: 32 }, { t: 'bookshelf', x: 380, y: 480, w: 120, h: 60 }
  ],
  spots: [
    { id: 'rent', x: 135, y: 366, r: 56, prompt: () => 'Pay rent at the landlord desk', panel: PN('apartment', { secs: ['Lease'], title: 'Landlord office', sub: 'Maple Court Apartments', band: '#8a4a38' }) },
    { id: 'bed', x: 900, y: 270, r: 50, prompt: () => 'Go to bed', panel: PN('apartment', { secs: ['Rest'], only: t => /bed|Sleep in/.test(t), title: 'Your bed', sub: 'Apt 12' }) },
    { id: 'couch', x: 765, y: 336, r: 56, prompt: () => 'Relax on the couch', panel: () => {
      const spec = PN('apartment', { secs: ['Rest'], only: t => /nap/i.test(t), title: 'The couch', sub: 'Apt 12', note: 'A lumpy couch and a small TV. Good for a nap or a show.' })();
      spec.sections.push({ h: 'Television', items: [{ t: 'Watch a show', d: 'Switch off for a while. Energy +3, mood +5.', tag: '30 min', off: S.energy >= 97 ? 'You are not tired.' : '', go() { applyIntake({ energy: 3, mins: 30 }); addMood(5); toast('A good episode. Energy +3, mood +5.', 'good'); } }] });
      return spec;
    } },
    { id: 'stove', x: 542, y: 178, r: 50, prompt: () => 'Cook a meal', panel: PN('apartment', { secs: ['Kitchen'], only: t => /Cook/.test(t), title: 'The stove', sub: 'Your kitchen' }) },
    { id: 'sink', x: 470, y: 178, r: 46, prompt: () => 'Drink tap water', panel: PN('apartment', { secs: ['Kitchen'], only: t => /tap/.test(t), title: 'The sink', sub: 'Your kitchen' }) },
    { id: 'fridge', x: 404, y: 190, r: 44, prompt: () => 'Check the fridge', panel: () => ({ band: '#8a4a38', title: 'Your fridge', sub: 'Pantry', note: 'Breakfast x' + S.pantry.b + ', Lunch x' + S.pantry.l + ', Dinner x' + S.pantry.d + '. Buy more packs at the Corner Grocery. Cook them at the stove.', sections: [] }) }
  ],
  folks: [folkAt('reyes', 135, 296), folkAt('dev', 232, 214)]
});

/* ---------- grocery ---------- */
defInt('grocery', {
  name: 'Corner Grocery', w: 1100, h: 640, exit: { x: 550 }, wallCol: '#d4e3d4', trim: '#9ab59f',
  floors: [[34, TW, 1032, 514, 'tile', '#ece9e0', 'rgba(60,140,100,.09)']],
  deco(c) {
    winTop(c, 190, 90); winTop(c, 840, 90);
    sign(c, 'CORNER GROCERY', 550, 36, 220, '#2f6b4c');
  },
  furn: [
    { t: 'shelf', x: 60, y: 98, w: 150, h: 56, label: 'SNACKS', s: 1 },
    { t: 'cooler', x: 744, y: 98, w: 90, h: 56 }, { t: 'cooler', x: 840, y: 98, w: 90, h: 56 }, { t: 'cooler', x: 936, y: 98, w: 90, h: 56 },
    { t: 'shelf', x: 110, y: 250, w: 126, h: 46, label: 'BREAKFAST', s: 0 }, { t: 'shelf', x: 240, y: 250, w: 126, h: 46, label: 'BREAKFAST', s: 2 },
    { t: 'shelf', x: 434, y: 250, w: 126, h: 46, label: 'LUNCH', s: 3 }, { t: 'shelf', x: 564, y: 250, w: 126, h: 46, label: 'LUNCH', s: 5 },
    { t: 'shelf', x: 754, y: 250, w: 126, h: 46, label: 'DINNER', s: 1 }, { t: 'shelf', x: 884, y: 250, w: 126, h: 46, label: 'DINNER', s: 4 },
    { t: 'register', x: 90, y: 470, w: 150, h: 46 }, { t: 'register', x: 270, y: 470, w: 150, h: 46 },
    { t: 'table', x: 520, y: 430, w: 180, h: 56, c: '#8a5a34', label: 'FRESH PRODUCE', fs: 10 }, { t: 'table', x: 770, y: 430, w: 180, h: 56, c: '#b98a55', label: 'BAKERY', fs: 10 },
    { t: 'plant', x: 46, y: 300, w: 30, h: 32 }, { t: 'plant', x: 1010, y: 540, w: 30, h: 32 }, { t: 'mat', x: 500, y: 576, w: 100, h: 20 }
  ],
  spots: [
    { id: 'aisleB', x: 238, y: 318, r: 62, prompt: () => 'Browse the breakfast aisle', panel: PN('grocery', { secs: ['Pantry packs'], only: t => /Breakfast/.test(t), title: 'Breakfast aisle', note: 'Oats, eggs and bread. Each pack is 3 servings that you cook at home.' }) },
    { id: 'aisleL', x: 562, y: 318, r: 62, prompt: () => 'Browse the lunch aisle', panel: PN('grocery', { secs: ['Pantry packs'], only: t => /Lunch/.test(t), title: 'Lunch aisle', note: 'Sandwich fixings. Each pack is 3 servings that you cook at home.' }) },
    { id: 'aisleD', x: 882, y: 318, r: 62, prompt: () => 'Browse the dinner aisle', panel: PN('grocery', { secs: ['Pantry packs'], only: t => /Dinner/.test(t), title: 'Dinner aisle', note: 'Pasta, veggies and sauce. Each pack is 3 servings that you cook at home.' }) },
    { id: 'snacks', x: 135, y: 180, r: 54, prompt: () => 'Grab a snack', panel: PN('grocery', { secs: ['Right now'], only: t => /Snack/.test(t), title: 'Snack shelf', note: 'Eat it right away if you are in a hurry.' }) },
    { id: 'cooler', x: 885, y: 182, r: 90, prompt: () => 'Open the drinks cooler', panel: PN('grocery', { secs: ['Right now'], only: t => !/Snack/.test(t), title: 'Drinks cooler', note: 'Cold drinks, from plain water to energy drinks.' }) }
  ],
  folks: [folkAt('tanaka', 165, 460), folkAt('odell', 628, 392)]
});

/* ---------- diner ---------- */
defInt('diner', {
  name: "Dot's Diner", w: 1000, h: 620, exit: { x: 500 }, wallCol: '#e9d9c0', trim: '#c46b5e',
  floors: [[34, TW, 932, 494, 'tile', '#f4efe4', 'rgba(190,60,60,.28)']],
  deco(c) {
    winTop(c, 120, 100); winTop(c, 780, 100);
    sign(c, "DOT'S DINER", 500, 36, 200, '#a83a3a');
  },
  furn: [
    { t: 'machine', x: 262, y: 96, w: 86, h: 34, c: '#7d8a94', label: 'GRILL', fs: 9, screen: '#ff9f43' }, { t: 'machine', x: 356, y: 96, w: 60, h: 34, c: '#cfd8dc', label: 'FRYER', fs: 9, screen: '#ffd166' },
    { t: 'fridge', x: 640, y: 96, w: 48, h: 36 },
    { t: 'counter', x: 240, y: 134, w: 520, h: 46, c: '#a83a3a', top: '#e9e4d8' },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: 'stool', x: 262 + i * 64, y: 192, w: 26, h: 26 })),
    { t: 'booth', x: 50, y: 250, w: 130, h: 92 }, { t: 'booth', x: 50, y: 380, w: 130, h: 92 },
    { t: 'booth', x: 820, y: 250, w: 130, h: 92 }, { t: 'booth', x: 820, y: 380, w: 130, h: 92 },
    { t: 'round', x: 320, y: 330, w: 80, h: 58, c: '#c2a37a' }, { t: 'round', x: 600, y: 330, w: 80, h: 58, c: '#c2a37a' },
    { t: 'stool', x: 296, y: 394, w: 24, h: 24 }, { t: 'stool', x: 406, y: 394, w: 24, h: 24 }, { t: 'stool', x: 576, y: 394, w: 24, h: 24 }, { t: 'stool', x: 686, y: 394, w: 24, h: 24 },
    { t: 'jukebox', x: 880, y: 100, w: 60, h: 80 }, { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 920, y: 520, w: 30, h: 32 }, { t: 'mat', x: 450, y: 560, w: 100, h: 20 }
  ],
  spots: [
    { id: 'counter', x: 500, y: 238, r: 76, prompt: () => 'Order at the counter', panel: PN('diner', { secs: ['Anytime'], title: 'The counter', note: 'Fries, pie, coffee and milkshakes. Anytime.' }) },
    { id: 'boothL', x: 218, y: 300, r: 56, prompt: () => 'Sit in a booth', panel: PN('diner', { secs: MEAL_SECS, title: 'Window booth', note: 'Hot meals are served at set hours, so you can only order the plate that matches the time of day.' }) },
    { id: 'boothR', x: 782, y: 300, r: 56, prompt: () => 'Sit in a booth', panel: PN('diner', { secs: MEAL_SECS, title: 'Corner booth', note: 'Hot meals are served at set hours, so you can only order the plate that matches the time of day.' }) },
    { id: 'tableA', x: 360, y: 372, r: 56, prompt: () => 'Sit at a table', panel: PN('diner', { secs: MEAL_SECS, title: 'Table for one', note: 'Hot meals are served at set hours, so you can only order the plate that matches the time of day.' }) },
    { id: 'jukebox', x: 878, y: 204, r: 52, prompt: () => 'Play the jukebox', panel: () => ({ band: '#a83a3a', title: 'The jukebox', sub: 'Dot\'s Diner', note: 'Chrome, neon and a song for every mood.', stock: [fmt(S.money)], sections: [{ h: 'Pick a song', items: [{ t: 'Play your favorite song', d: 'Energy +3, mood +5. It is a good one.', tag: fmt(1) + ' · 5 min', off: canSpend(1) ? (S.energy >= 97 ? 'You are not tired.' : '') : 'You cannot afford that.', go() { spend(1); applyIntake({ energy: 3, mins: 5 }); addMood(5); toast('Your song comes on. Energy +3, mood +5.', 'good'); } }] }] }) }
  ],
  folks: [folkAt('dot', 800, 134), folkAt('gus', 398, 218)]
});

/* ---------- clinic ---------- */
defInt('clinic', {
  name: 'St. Anne Clinic', w: 1000, h: 620, exit: { x: 500 }, wallCol: '#e6f0f4', trim: '#a9c3cf',
  floors: [[34, TW, 932, 514, 'lino', '#e8f0f3'], [664, TW, 302, 238, 'lino', '#d3e5ee']],
  walls: [[640, TW, 24, 238], [664, 300, 116, 22], [860, 300, 106, 22]],
  deco(c) {
    winTop(c, 100, 90); winTop(c, 250, 90);
    sign(c, 'EXAM', 820, 52, 70, '#4d86a8'); sign(c, 'RECEPTION', 230, 100, 110, '#4d86a8');
  },
  furn: [
    { t: 'counter', x: 90, y: 150, w: 300, h: 50, c: '#4d86a8', top: '#e8f6ff' }, { t: 'desk', x: 150, y: 124, w: 80, h: 26, pc: false, c: '#d9e3e8' },
    { t: 'machine', x: 440, y: 98, w: 60, h: 70, c: '#c0392b', label: 'SNACKS', fs: 8, screen: '#ffd166' }, { t: 'machine', x: 520, y: 98, w: 36, h: 64, c: '#4cc9f0', screen: '#ffffff', label: 'H2O', fs: 8 },
    { t: 'bench', x: 100, y: 330, w: 130, h: 28 }, { t: 'bench', x: 290, y: 330, w: 130, h: 28 }, { t: 'bench', x: 100, y: 450, w: 130, h: 28 }, { t: 'bench', x: 290, y: 450, w: 130, h: 28 },
    { t: 'rug', x: 100, y: 380, w: 320, h: 56, c: '#6fb7c9' }, { t: 'table', x: 470, y: 400, w: 90, h: 44, c: '#9c7a4f' },
    { t: 'plant', x: 46, y: 540, w: 30, h: 32 }, { t: 'plant', x: 604, y: 540, w: 30, h: 32 }, { t: 'plant', x: 596, y: 110, w: 30, h: 32 },
    { t: 'hbed', x: 690, y: 104, w: 80, h: 130 }, { t: 'hbed', x: 830, y: 104, w: 80, h: 130 }, { t: 'cabinet', x: 925, y: 104, w: 36, h: 80, c: '#cfd8dc' },
    { t: 'mat', x: 450, y: 560, w: 100, h: 20 }
  ],
  spots: [
    { id: 'vending', x: 470, y: 188, r: 54, prompt: () => 'Use the vending machine', panel: PN('grocery', { secs: ['Right now'], only: t => /Snack|Bottled/.test(t), title: 'Vending machine', sub: 'Waiting room', band: '#4d86a8', note: 'Snacks and bottled water, no change needed.' }) },
    { id: 'h2o', x: 538, y: 188, r: 44, prompt: () => 'Drink from the water cooler', panel: () => ({ band: '#4d86a8', title: 'Water cooler', sub: 'Waiting room', note: 'Free cold water for patients and visitors.', sections: [{ h: 'Drink', items: [{ t: 'Drink water', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30), go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Cold water. Thirst +30.', 'good'); } }] }] }) },
    { id: 'wait', x: 165, y: 366, r: 60, prompt: () => 'Rest in the waiting room', panel: () => ({ band: '#4d86a8', title: 'Waiting room', sub: 'St. Anne Clinic', note: 'Quiet chairs and soft light. Nobody minds if you sit for a while.', sections: [{ h: 'Rest', items: [{ t: 'Sit for half an hour', d: 'Energy +4.', tag: '30 min', off: S.energy >= 96 ? 'You are not tired.' : '', go() { applyIntake({ energy: 4, mins: 30 }); toast('A calm half hour. Energy +4.', 'good'); } }] }] }) },
    { id: 'vitals', x: 740, y: 274, r: 56, prompt: () => 'Check your vitals', panel: () => {
      const low = [['hunger', S.hunger], ['thirst', S.thirst], ['energy', S.energy]].sort((a, b) => a[1] - b[1])[0];
      const tip = low[1] > 60 ? 'You are in great shape. Keep eating well and sleeping through the night.' : low[0] === 'hunger' ? 'Your hunger is the lowest number. Eat a proper meal soon.' : low[0] === 'thirst' ? 'You are running low on water. Drink before you do anything else.' : 'Your energy is the weakest. A full night of sleep would help the most.';
      return { band: '#4d86a8', title: 'Vitals check', sub: 'Exam room', note: 'Hunger ' + Math.round(S.hunger) + ', thirst ' + Math.round(S.thirst) + ', energy ' + Math.round(S.energy) + ' (out of 100). ' + tip, sections: [] };
    } }
  ],
  folks: [folkAt('imani', 240, 140), folkAt('chen', 796, 262)]
});
