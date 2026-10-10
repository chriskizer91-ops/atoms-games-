/* ============================ floors, walls, whole-room drawing ============================ */
function drawFloor(c, f) {
  // f: [x, y, w, h, type, col, col2]
  const [x, y, w, h, type, col, col2] = f;
  c.fillStyle = col; c.fillRect(x, y, w, h);
  if (type === 'wood') {
    for (let yy = y, r = 0; yy < y + h; yy += 26, r++) {
      const ph = Math.min(26, y + h - yy), off = (r * 83) % 160;
      for (let xx = x - 160 + off, k = 0; xx < x + w; xx += 160, k++) {
        const v = hash01(r, k, Math.round(x)), px = Math.max(x, xx), pw = Math.min(x + w, xx + 160) - px;
        if (pw <= 0) continue;
        c.fillStyle = v < 0.5 ? 'rgba(60,30,5,' + (v * 0.2).toFixed(3) + ')' : 'rgba(255,240,210,' + ((v - 0.5) * 0.22).toFixed(3) + ')';
        c.fillRect(px, yy, pw, ph);
        c.fillStyle = 'rgba(70,40,10,.2)'; if (xx > x) c.fillRect(xx, yy, 1.6, ph);
      }
      c.fillStyle = 'rgba(70,40,10,.2)'; c.fillRect(x, yy + ph - 1.6, w, 1.6);
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x, yy, w, 1.2);
    }
  } else if (type === 'tile') {
    c.fillStyle = col2 || 'rgba(0,0,0,.06)';
    for (let yy = 0; yy * 56 < h; yy++) for (let xx = 0; xx * 56 < w; xx++) if ((xx + yy) % 2) c.fillRect(x + xx * 56, y + yy * 56, Math.min(56, w - xx * 56), Math.min(56, h - yy * 56));
    c.fillStyle = 'rgba(0,0,0,.08)';
    for (let xx = x + 56; xx < x + w; xx += 56) c.fillRect(xx - 0.75, y, 1.5, h);
    for (let yy = y + 56; yy < y + h; yy += 56) c.fillRect(x, yy - 0.75, w, 1.5);
    c.fillStyle = 'rgba(255,255,255,.12)';
    for (let yy = y; yy < y + h; yy += 56) c.fillRect(x, yy + 1, w, 1.2);
    patFill(c, 'fleck', x, y, w, h, 0.7);
  } else if (type === 'carpet') {
    c.fillStyle = col2 || 'rgba(255,255,255,.07)'; for (let yy = y + 8; yy < y + h; yy += 18) c.fillRect(x, yy, w, 1.5);
    patFill(c, 'fleck', x, y, w, h);
  } else if (type === 'lino') {
    c.fillStyle = col2 || 'rgba(0,0,0,.08)'; for (let xx = x + 60; xx < x + w; xx += 60) c.fillRect(xx, y, 2, h); for (let yy = y + 60; yy < y + h; yy += 60) c.fillRect(x, yy, w, 2);
    patFill(c, 'fleck', x, y, w, h, 0.6);
    const g = c.createLinearGradient(x, y, x + w * 0.5, y + h); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
  } else patFill(c, 'fleck', x, y, w, h, 0.6);
  // the wall above casts a soft shadow onto the floor
  const sg = c.createLinearGradient(0, y, 0, y + 18); sg.addColorStop(0, 'rgba(10,12,30,.22)'); sg.addColorStop(1, 'rgba(10,12,30,0)');
  c.fillStyle = sg; c.fillRect(x, y, w, Math.min(18, h));
}
function wallBlock(c, r, d) {
  const fh = Math.min(16, r[3] * 0.3);
  const sg = c.createLinearGradient(0, r[1] + r[3], 0, r[1] + r[3] + 12); sg.addColorStop(0, 'rgba(10,12,30,.24)'); sg.addColorStop(1, 'rgba(10,12,30,0)');
  c.fillStyle = sg; c.fillRect(r[0], r[1] + r[3], r[2], 12);
  c.fillStyle = shade(d.wallCol, 0.1); c.fillRect(r[0], r[1], r[2], r[3]);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(r[0], r[1], r[2], Math.min(3, r[3]));
  c.fillStyle = shade(d.wallCol, -0.12); c.fillRect(r[0], r[1] + r[3] - fh, r[2], fh);
  c.fillStyle = d.trim; c.fillRect(r[0], r[1] + r[3] - 4, r[2], 4);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(r[0] + r[2] - 3, r[1], 3, r[3]);
}
/* one cached layer for the static part of whichever room is on screen */
const LAYER = { name: '', res: 0, cv: null };
function layerCache(name, w, h, paint) {
  const res = clamp(Math.min(Math.ceil((FX.m || 1) * 4) / 4, Math.sqrt(6e6 / (w * h))), 1, 2);
  if (LAYER.name !== name || LAYER.res !== res) {
    const cv = LAYER.cv || (LAYER.cv = document.createElement('canvas'));
    cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const g = cv.getContext('2d'); g.setTransform(res, 0, 0, res, 0, 0);
    paint(g);
    LAYER.name = name; LAYER.res = res;
  }
  return LAYER.cv;
}
function drawIntBase(c, d) {
  const A = FX.A;
  c.fillStyle = shade(d.wallCol, -0.16); c.fillRect(0, 0, d.w, d.h);
  c.drawImage(layerCache('int:' + d.id, d.w, d.h, g => d.floors.forEach(f => drawFloor(g, f))), 0, 0, d.w, d.h);
  // back wall: paint, a chair rail, panelling and a baseboard
  const wg = c.createLinearGradient(0, 0, 0, TW); wg.addColorStop(0, shade(d.wallCol, 0.16)); wg.addColorStop(1, shade(d.wallCol, -0.02));
  c.fillStyle = wg; c.fillRect(0, 0, d.w, TW);
  c.fillStyle = shade(d.wallCol, -0.08); c.fillRect(0, TW - 30, d.w, 18);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, TW - 32, d.w, 2);
  c.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 60; x < d.w; x += 64) c.fillRect(x, TW - 28, 1.5, 15);
  c.fillStyle = d.trim; c.fillRect(0, TW - 12, d.w, 12);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(0, TW - 12, d.w, 1.5);
  // side walls and the front wall, seen from above
  const top = shade(d.wallCol, -0.2);
  c.fillStyle = top; c.fillRect(0, 0, 34, d.h); c.fillRect(d.w - 34, 0, 34, d.h);
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, 0, 3, d.h); c.fillRect(d.w - 34, 0, 3, d.h);
  c.fillStyle = d.trim; c.fillRect(30, TW, 5, d.h); c.fillRect(d.w - 35, TW, 5, d.h);
  const lg = c.createLinearGradient(35, 0, 49, 0); lg.addColorStop(0, 'rgba(10,12,30,.2)'); lg.addColorStop(1, 'rgba(10,12,30,0)');
  c.fillStyle = lg; c.fillRect(35, TW, 14, d.h - TW - 42);
  c.fillStyle = top; c.fillRect(0, d.h - 42, d.w, 42);
  c.fillStyle = d.trim; c.fillRect(34, d.h - 46, d.w - 68, 5);
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(34, d.h - 46, d.w - 68, 1.5);
  // front doors: daylight (or the night) shows through the glass
  const ex = d.exit.x;
  c.fillStyle = '#4a3122'; rr(c, ex - 50, d.h - 48, 100, 48, 4); c.fill();
  c.fillStyle = FX.glassA; c.fillRect(ex - 43, d.h - 41, 39, 35); c.fillRect(ex + 4, d.h - 41, 39, 35);
  c.fillStyle = FX.glassB; c.fillRect(ex - 43, d.h - 22, 39, 16); c.fillRect(ex + 4, d.h - 22, 39, 16);
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(ex - 43, d.h - 41, 10, 35); c.fillRect(ex + 4, d.h - 41, 10, 35);
  c.fillStyle = '#e9c46a'; c.fillRect(ex - 3.5, d.h - 27, 2, 9); c.fillRect(ex + 1.5, d.h - 27, 2, 9);
  if (A && A.nf < 0.6) {
    // daylight spilling in through the doors
    const dg = c.createLinearGradient(0, d.h - 46, 0, d.h - 130); dg.addColorStop(0, 'rgba(255,244,214,' + (0.3 * (1 - A.nf)).toFixed(3) + ')'); dg.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = dg; c.beginPath(); c.moveTo(ex - 44, d.h - 46); c.lineTo(ex + 44, d.h - 46); c.lineTo(ex + 80, d.h - 130); c.lineTo(ex - 80, d.h - 130); c.closePath(); c.fill();
  }
  c.fillStyle = 'rgba(10,12,26,.16)'; rr(c, ex - 31, d.h - 67, 64, 20, 4); c.fill();
  c.fillStyle = '#4a3a2c'; rr(c, ex - 32, d.h - 69, 64, 20, 4); c.fill();
  c.strokeStyle = 'rgba(243,230,161,.45)'; c.lineWidth = 1; rr(c, ex - 29, d.h - 66, 58, 14, 2.5); c.stroke();
  signText(c, 'EXIT', ex, d.h - 58.5, 10, '#f3e6a1');
  d.walls.forEach(r => wallBlock(c, r, d));
  FX.wins.length = 0;
  if (d.deco) d.deco(c, d);
  // light through the windows falls across the floor
  if (A && FX.wins.length) {
    const day = A.sh * (1 - A.cloud * 0.5), a = day > 0.04 ? 0.24 * day : 0.1 * A.nf * (1 - A.cloud);
    if (a > 0.01) {
      const dx = -A.sunX * 90, len = 150 + (1 - A.el) * 100, col = day > 0.04 ? (A.warm > 0.4 ? '255,214,160' : '255,244,214') : '170,196,255';
      c.save(); c.beginPath(); c.rect(35, TW, d.w - 70, d.h - TW - 46); c.clip();
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, TW, 0, TW + len); g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = g;
      for (let i = 0; i < FX.wins.length; i += 2) {
        const wx = FX.wins[i], ww = FX.wins[i + 1];
        c.beginPath(); c.moveTo(wx, TW); c.lineTo(wx + ww, TW); c.lineTo(wx + ww + dx + 26, TW + len); c.lineTo(wx + dx - 26, TW + len); c.closePath(); c.fill();
      }
      c.restore();
    }
  }
  // flat things first, then furniture back-to-front
  d.furn.filter(f => FURN_FLAT[f.t] && (!f.when || f.when())).forEach(f => drawFurn(c, f));
  d.furn.filter(f => !FURN_FLAT[f.t] && (!f.when || f.when())).slice().sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach(f => drawFurn(c, f));
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
  const A = FX.A;
  if (FX.nf <= 0.05) return [255, 255, 255];
  for (let y = 150; y < h - 40; y += step * 0.8) for (let x = step * 0.5; x < w; x += step) {
    if (x < CAM.x - 200 || x > CAM.x + CAM.vw + 200 || y < CAM.y - 160 || y > CAM.y + CAM.vh + 160) continue;
    addLight(x, y, 190, 150, 0, 0.5);
  }
  return mix3([255, 255, 255], [196, 172, 170], clamp(A.nf, 0, 1));
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
function winTop(c, x, w) {
  const A = FX.A;
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x - 5, 17, w + 12, 54);
  c.fillStyle = '#6f5f4a'; rr(c, x - 5, 14, w + 10, 55, 3); c.fill();
  if (A) {
    const g = c.createLinearGradient(0, 20, 0, 64); g.addColorStop(0, rgbS(A.top)); g.addColorStop(1, rgbS(A.bot));
    c.fillStyle = g; c.fillRect(x, 20, w, 44);
    if (A.star > 0.3) { c.fillStyle = 'rgba(255,255,255,' + (0.8 * A.star).toFixed(3) + ')'; for (let i = 0; i < 5; i++) c.fillRect(x + 6 + hash01(i, Math.round(x), 1) * (w - 12), 23 + hash01(i, Math.round(x), 2) * 30, 1.3, 1.3); }
    else if (A.nf < 0.5) {
      // rooftops across the street
      c.fillStyle = rgbS(mix3(A.bot, [104, 122, 146], 0.6));
      for (let i = 0; i < 4; i++) { const bw = w / 4, bh = 8 + hash01(i, Math.round(x), 3) * 14; c.fillRect(x + i * bw, 64 - bh, bw + 0.5, bh); }
    }
    if (A.rain > 0.1) { c.strokeStyle = 'rgba(220,235,255,.5)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 7; i++) { const rx = x + ((i * 13 + FX.time * 40) % w); c.moveTo(rx, 22 + (i * 9) % 30); c.lineTo(rx - 2, 30 + (i * 9) % 30); } c.stroke(); }
  } else { c.fillStyle = '#a9d6ea'; c.fillRect(x, 20, w, 44); }
  c.fillStyle = 'rgba(255,255,255,.26)'; c.beginPath(); c.moveTo(x + 2, 64); c.lineTo(x + w * 0.28, 20); c.lineTo(x + w * 0.44, 20); c.lineTo(x + w * 0.16, 64); c.closePath(); c.fill();
  c.fillStyle = '#6f5f4a'; c.fillRect(x + w / 2 - 1.8, 20, 3.6, 44); c.fillRect(x, 40, w, 2.4);
  c.fillStyle = '#e6dccb'; rr(c, x - 8, 66, w + 16, 5, 2); c.fill();
  c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x - 6, 71, w + 12, 2);
  FX.wins.push(x, w);
}
function sign(c, text, cx, y, w, col) { c.fillStyle = col; rr(c, cx - w / 2, y - 11, w, 22, 6); c.fill(); signText(c, text, cx, y + 0.5, 11, '#fff'); }
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
    sign(c, 'LOBBY', 180, 52, 90, '#7a5a3a');
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
    winTop(c, 420, 90); winTop(c, 560, 90);
    c.fillStyle = '#2f8a5b'; for (let i = 0; i < 14; i++) if (i % 2) c.fillRect(300 + i * 36, 66, 36, 14);
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
    c.fillStyle = '#d9d9d6'; c.fillRect(34, 70, 932, 4);
    c.fillStyle = '#a83a3a'; for (let i = 0; i < 32; i++) if (i % 2) c.fillRect(34 + i * 29, 74, 29, 6);
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
    c.fillStyle = '#d63b4b'; c.fillRect(496, 20, 8, 36); c.fillRect(482, 34, 36, 8);
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
