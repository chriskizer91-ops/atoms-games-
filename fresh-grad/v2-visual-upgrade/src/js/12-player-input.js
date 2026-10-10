/* ============================ player movement and input ============================ */
G.phase = 0; G.moving = false; G.stuck = 0;

function updatePlayer(dt) {
  const K = G.keys;
  let dx = (K.right ? 1 : 0) - (K.left ? 1 : 0), dy = (K.down ? 1 : 0) - (K.up ? 1 : 0);
  if (dx || dy) { G.target = null; G.autoEnter = null; G.pathQ = []; }
  else if (G.target) {
    const ex = G.target.x - S.px, ey = G.target.y - S.py, d = Math.hypot(ex, ey);
    if (d < 4) {
      if (G.pathQ && G.pathQ.length) G.target = G.pathQ.shift();
      else {
        G.target = null;
        if (G.autoEnter) { const id = G.autoEnter; G.autoEnter = null; enterBuilding(id); }
      }
    } else { dx = ex / d; dy = ey / d; }
  }
  const len = Math.hypot(dx, dy);
  G.moving = false;
  if (len > 0) {
    dx /= len; dy /= len;
    let sp = 140;
    if (S.energy < 20) sp *= 0.75; else if (S.energy < 35) sp *= 0.9;
    if (S.hunger < 10 || S.thirst < 10) sp *= 0.85;
    if (S.scene === 'town' && ridingBike()) sp *= 1.6;
    if (hasPerk('feet')) sp *= 1.12;
    sp *= dt;
    if (G.target && !(K.left || K.right || K.up || K.down)) sp = Math.min(sp, Math.hypot(G.target.x - S.px, G.target.y - S.py));
    let moved = false;
    const nx = S.px + dx * sp;
    if (!solidNow(nx, S.py)) { S.px = nx; moved = true; }
    const ny = S.py + dy * sp;
    if (!solidNow(S.px, ny)) { S.py = ny; moved = true; }
    if (Math.abs(dx) > 0.15) S.face = dx > 0 ? 1 : -1;
    G.moving = moved;
    if (moved) { G.phase += dt * 11; G.stuck = 0; if (S.scene === 'town') lifeEv('steps', sp / 1.6); }
    else if (G.target) { G.stuck += dt; if (G.stuck > 0.35) { G.target = null; G.autoEnter = null; G.pathQ = []; G.stuck = 0; } }
  }
}

const NEAR_NAME = { apartment: 'your apartment', grocery: 'Corner Grocery', diner: "Dot's Diner", park: 'the park fountain', clinic: 'St. Anne Clinic' };
function placeName(id) { return id === 'work' ? job().employer : NEAR_NAME[id]; }
function updateNear() {
  let best = null, txt = '', open = true;
  if (!G.inside && !G.skip) {
    if (S.scene === 'school') {
      const sp = schoolNear();
      if (sp) { best = sp.id; txt = sp.prompt(); }
    } else if (S.scene === 'int') {
      const sp = intNear();
      if (sp) { best = sp.id; txt = sp.prompt; }
    } else {
      for (const id of ENTERABLE) {
        if (hideNear(id)) continue;
        const d = DOORS[id];
        const ok = id === 'park' ? Math.hypot(S.px - d.x, S.py - d.y) < 60 : (Math.abs(S.px - d.x) < 46 && S.py > d.y - 30 && S.py < d.y + 40);
        if (ok) { best = id; open = isOpen(id); txt = (NEAR_VERB[id] || 'Enter ') + placeName(id) + (open ? '' : ' (closed)'); break; }
      }
      if (!best) { const bs = busNear(); if (bs) { best = 'bus:' + bs.id; txt = 'Take the bus from ' + bs.name; } }
      if (!best) { const n = talkNear(); if (n) { best = 'npc:' + n.id; txt = 'Talk to ' + n.name; } }
    }
  }
  const p = $('#prompt');
  if (best !== G.near) {
    G.near = best;
    if (!best) p.hidden = true;
  }
  if (best) {
    const sig = txt + open;
    if (p.dataset.sig !== sig) {
      p.dataset.sig = sig;
      p.innerHTML = '';
      p.append(document.createTextNode(txt));
      const kb = document.createElement('kbd'); kb.textContent = 'E'; p.appendChild(kb);
      p.classList.toggle('closed', !open);
    }
    p.hidden = false;
  }
}

function enterBuilding(id) {
  if (!S || G.mode !== 'play' || G.inside || G.skip || G.menu || WIPE.phase) return;
  SFX.init();
  if (!id.startsWith('npc:') && !id.startsWith('bus:')) SFX.chime('door');
  G.keys = {}; G.target = null; G.autoEnter = null; G.pathQ = [];
  if (id.startsWith('npc:')) {
    const n = folkPos(id.slice(4));
    if (!n || Math.hypot(n.x - S.px, n.y - S.py) > 110) return;
    G.talk = null; G.inside = id; openPanel(id); $('#prompt').hidden = true; return;
  }
  if (S.scene === 'school') {
    if (id === 'exit') { wipeTo(leaveSchool); return; }
    G.inside = 'sch:' + id; openPanel(G.inside); $('#prompt').hidden = true; return;
  }
  if (S.scene === 'int') {
    if (id === 'exit') { wipeTo(leaveInterior); return; }
    G.inside = 'ispot:' + id; openPanel(G.inside); $('#prompt').hidden = true; return;
  }
  if (id.startsWith('bus:')) { G.inside = id; openPanel(id); $('#prompt').hidden = true; return; }
  if (id === 'work' && job().id === 'edu' && isOpen('work')) { wipeTo(enterSchool); return; }
  if (id !== 'park' && INT[id] && isOpen(id)) { wipeTo(() => enterInterior(id)); return; }
  G.inside = id;
  if (id === 'park') stampPlace('park');
  openPanel(id);
  $('#prompt').hidden = true;
}

function worldPoint(e) {
  const r = $('#world').getBoundingClientRect();
  return { x: CAM.x + (e.clientX - r.left) / CAM.k, y: CAM.y + (e.clientY - r.top) / CAM.k };
}
function freeNear(x, y) {
  const dm = sceneDims(sceneKey()), lo = S.scene === 'town' ? TOP_Y + 8 : S.scene === 'school' ? 112 : INT[S.intId].b.y1;
  x = clamp(x, 20, dm.w - 20); y = clamp(y, lo, dm.h - 16);
  if (!solidNow(x, y)) return { x, y };
  for (let r = 8; r < 160; r += 8) for (let a = 0; a < 6.28; a += 0.5) {
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (!solidNow(px, py)) return { x: px, y: py };
  }
  return { x: S.px, y: S.py };
}
function onWorldTap(e) {
  if (!S || G.mode !== 'play' || G.inside || G.skip || G.menu || WIPE.phase) return;
  SFX.init();
  const p = worldPoint(e);
  if (S.scene === 'school') {
    for (const s of SCH_SPOTS) {
      const T = s.id.startsWith('talk-');
      if (Math.hypot(p.x - s.x, p.y - (T ? s.y - 28 : s.y)) < (T ? 34 : 28)) { walkTo(s.x, s.y, s.id); return; }
    }
    const q = freeNear(p.x, p.y); walkTo(q.x, q.y, null); return;
  }
  if (S.scene === 'int') {
    const d = INT[S.intId];
    for (const f of d.folkObjs) {
      if (Math.abs(p.x - f.x) < 26 && p.y > f.y - 54 && p.y < f.y + 12) { const q = freeNear(f.x, f.y + 40); walkTo(q.x, q.y, 'npc:' + f.id); return; }
    }
    for (const s of d.spots) {
      if (s.when && !s.when()) continue;
      if (Math.hypot(p.x - s.x, p.y - s.y) < 34) { const q = freeNear(s.x, s.y); walkTo(q.x, q.y, s.id); return; }
    }
    const q = freeNear(p.x, p.y); walkTo(q.x, q.y, null); return;
  }
  for (const n of NPCS) {
    if (n.id && Math.abs(p.x - n.x) < 24 && p.y > n.y - 52 && p.y < n.y + 10) {
      if (Math.hypot(n.x - S.px, n.y - S.py) < 64) { enterBuilding('npc:' + n.id); return; }
      const q = freeNear(n.x + (S.px < n.x ? -34 : 34), n.y + 4);
      walkTo(q.x, q.y, 'npc:' + n.id); return;
    }
  }
  for (const s of BUS_STOPS) {
    if (Math.abs(p.x - s.x) < 42 && p.y > s.y - 96 && p.y < s.y + 6) { walkTo(s.x, s.y + 22, 'bus:' + s.id); return; }
  }
  for (const b of ALL_BLD) {
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
      if (b.kind === 'deco' && !b.place) { walkTo(b.x + b.w / 2, b.y + b.h + 14, null); toast(b.name + ' is not open to visitors.', ''); return; }
      const bid = b.place || b.id;
      walkTo(DOORS[bid].x, DOORS[bid].y, ENTERABLE.includes(bid) ? bid : null);
      return;
    }
  }
  if (((p.x - POND.x) / POND.rx) ** 2 + ((p.y - POND.y) / POND.ry) ** 2 < 1) { walkTo(DOORS.pond.x, DOORS.pond.y, 'pond'); return; }
  if (Math.abs(p.x - BANDSTAND.x) < 80 && p.y > BANDSTAND.y - 105 && p.y < BANDSTAND.y + 20) { walkTo(DOORS.concert.x, DOORS.concert.y, concertOn() ? 'concert' : null); return; }
  if (marketOn() && p.x > 1020 && p.x < 1360 && p.y > MARKET.y - 130 && p.y < MARKET.y) { walkTo(DOORS.market.x, DOORS.market.y, 'market'); return; }
  if (Math.hypot(p.x - FOUNTAIN.x, (p.y - FOUNTAIN.y) * 1.3) < FOUNTAIN.r + 14) { walkTo(DOORS.park.x, DOORS.park.y, 'park'); return; }
  const q = freeNear(p.x, p.y); walkTo(q.x, q.y, null);
}

const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
function bindInput() {
  window.addEventListener('keydown', e => {
    if (G.mode !== 'play') return;
    const k = KEYMAP[e.code];
    if (k && !G.inside && !G.skip && !G.menu) { G.keys[k] = true; e.preventDefault(); return; }
    if (e.code === 'KeyE' || ((e.code === 'Enter' || e.code === 'Space') && !(document.activeElement && document.activeElement.tagName === 'BUTTON'))) {
      if (G.near && !G.inside && !G.skip && !G.menu) { e.preventDefault(); enterBuilding(G.near); }
    }
    if (e.code === 'Escape') {
      if (G.menu) closeMenu();
      else if (G.inside && !G.skip) closePanel(true);
      else if (!G.skip) openMenu();
    }
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) delete G.keys[k]; });
  window.addEventListener('blur', () => { G.keys = {}; });
  $('#world').addEventListener('pointerdown', onWorldTap);
  $('#prompt').addEventListener('click', () => { if (G.near) enterBuilding(G.near); });
  $$('#pad button').forEach(b => {
    const d = b.dataset.d;
    const on = e => { e.preventDefault(); if (!G.inside && !G.skip) G.keys[d] = true; };
    const off = () => { delete G.keys[d]; };
    b.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, off));
  });
}
