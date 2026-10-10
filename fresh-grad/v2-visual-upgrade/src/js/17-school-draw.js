/* ============================ school drawing ============================ */
function lockerRun(c, x0, x1, y) {
  const lk = ['#3f7cac', '#4f9d7a', '#b9703f'];
  const n = Math.max(1, Math.round((x1 - x0) / 42)), w = (x1 - x0) / n;
  c.fillStyle = 'rgba(10,12,30,.16)'; c.fillRect(x0, y + 46, x1 - x0, 5);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w, col = lk[(i + Math.floor(x0 / 7)) % 3];
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.14)); g.addColorStop(1, shade(col, -0.14));
    c.fillStyle = g; c.fillRect(x, y, w - 1, 46);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x, y, w - 1, 3);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 6, y + 9, w - 13, 2); c.fillRect(x + 6, y + 14, w - 13, 2); c.fillRect(x + 6, y + 19, w - 13, 2);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y + 42, w - 1, 4);
    c.fillStyle = '#e4e8ea'; rr(c, x + w - 11, y + 28, 3, 9, 1.5); c.fill();
    c.fillStyle = '#f4d35e'; c.fillRect(x + 5, y + 28, 5, 3);
  }
}
function drawClock(c, cx, cy) {
  c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 2; c.stroke();
  const mm = S.t % 60, hh = (S.t / 60) % 12;
  c.strokeStyle = '#222'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(hh / 12 * 6.283) * 7, cy - Math.cos(hh / 12 * 6.283) * 7); c.stroke();
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(mm / 60 * 6.283) * 11, cy - Math.cos(mm / 60 * 6.283) * 11); c.stroke();
}
function drawSchoolBase(c) {
  c.fillStyle = '#262d38'; c.fillRect(0, 0, SCH_W, SCH_H);
  const fl = (x, y, w, h, type, col, col2) => drawFloor(c, [x, y, w, h, type, col, col2]);
  // hallway
  fl(40, 440, 2120, 200, 'lino', '#cfd5d8', 'rgba(0,0,0,.06)');
  c.fillStyle = '#b44a3c'; c.fillRect(40, 530, 2120, 6);
  // north rooms
  fl(40, 60, 540, 360, 'wood', '#dcb88a'); fl(608, 60, 392, 360, 'wood', '#d8b484');
  fl(1028, 60, 352, 360, 'carpet', '#7a6a9a'); fl(1408, 60, 352, 360, 'carpet', '#8392b3'); fl(1788, 60, 372, 360, 'carpet', '#8a7968');
  c.fillStyle = '#9aa8c8'; c.fillRect(1470, 230, 240, 140);
  c.fillStyle = '#9a86bd'; c.fillRect(1090, 330, 220, 70);
  // south rooms
  fl(40, 660, 400, 450, 'tile', '#e6e1d2', 'rgba(0,0,0,.05)'); fl(468, 660, 232, 450, 'lino', '#dfeaef', 'rgba(100,170,190,.12)');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 11; x++) { c.fillStyle = (x + y) % 2 ? '#e6e1d2' : '#d8d2bf'; c.fillRect(728 + x * 58.2, 660 + y * 56.3, 58.2, 56.3); }
  fl(1396, 660, 764, 450, 'wood', '#d9a867');
  // gym court markings
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3;
  c.strokeRect(1450, 720, 660, 340); c.beginPath(); c.moveTo(1780, 720); c.lineTo(1780, 1060); c.stroke();
  c.beginPath(); c.arc(1780, 890, 50, 0, 7); c.stroke(); c.strokeRect(1450, 820, 110, 140); c.strokeRect(2000, 820, 110, 140);
  // walls: back walls of the north rooms, outer walls, partitions
  c.fillStyle = '#ebe5d6'; c.fillRect(30, 30, 2140, 36);
  c.fillStyle = '#c9c2b0'; c.fillRect(30, 62, 2140, 4);
  c.fillStyle = '#8b8574'; c.fillRect(28, 30, 12, 1110); c.fillRect(2160, 30, 12, 1110); c.fillRect(28, 1110, 2144, 30);
  c.fillStyle = '#b9b2a2';
  SCH.northSeps.forEach(s => c.fillRect(s[0], 30, s[1] - s[0], 410));
  SCH.southSeps.forEach(s => c.fillRect(s[0], 640, s[1] - s[0], 480));
  c.fillStyle = '#a69f8f';
  wallSegs(SCH.northGaps, 420, 40, 2160, 20).forEach(r => c.fillRect(r[0], r[1], r[2], r[3]));
  wallSegs(SCH.southGaps, 640, 40, 2160, 20).forEach(r => c.fillRect(r[0], r[1], r[2], r[3]));
  c.fillStyle = '#7a5a3a';
  SCH.northGaps.forEach(g => { c.fillRect(g[0] - 2, 420, 4, 20); c.fillRect(g[1] - 2, 420, 4, 20); });
  SCH.southGaps.forEach(g => { c.fillRect(g[0] - 2, 640, 4, 20); c.fillRect(g[1] - 2, 640, 4, 20); });
  // south room wall faces (decor sits here)
  c.fillStyle = '#d8d2c2';
  Object.values(SCH.southRooms).forEach(r => c.fillRect(r[0], 660, r[1] - r[0], 30));
  c.fillStyle = '#c4bda9'; Object.values(SCH.southRooms).forEach(r => c.fillRect(r[0], 686, r[1] - r[0], 4));
  // lockers on the hallway walls, between the doorways
  LOCKERS_N.forEach(l => lockerRun(c, l[0], l[1], 440));
  LOCKERS_S.forEach(l => lockerRun(c, l[0], l[1], 594));
  // water fountain
  c.fillStyle = '#9aa7ad'; c.fillRect(550, 444, 60, 38); c.fillStyle = '#6fb7e0'; c.fillRect(562, 452, 36, 12); c.fillStyle = '#7d8a90'; c.fillRect(550, 440, 60, 6);
  // front doors
  c.fillStyle = '#5a3b2a'; c.fillRect(186, 1108, 108, 32);
  c.fillStyle = '#7ec8e3'; c.fillRect(192, 1112, 44, 24); c.fillRect(244, 1112, 44, 24);
  signText(c, 'EXIT', 240, 1098, 11, '#d63b4b');
  // hallway banners and door signs
  signText(c, 'LAKEVIEW EAGLES', 1100, 565, 16, '#b44a3c');
  [[310, 'YOUR CLASSROOM', 128, '#9a3b2e'], [804, 'ROOM 4', 70, '#6a3b8a'], [1204, 'LIBRARY', 84, '#5a4a7a'], [1584, 'TEACHERS LOUNGE', 138, '#3a5a7a'], [1974, 'PRINCIPAL', 96, '#4a4a4a']].forEach(r => {
    c.fillStyle = r[3]; rr(c, r[0] - r[2] / 2, 444, r[2], 18, 5); c.fill(); signText(c, r[1], r[0], 453.5, 11, '#ffffff');
  });
  [[240, 'FRONT OFFICE', 112, '#6a5a3a'], [584, 'NURSE', 68, '#4d86a8'], [1048, 'CAFETERIA', 96, '#2f7d4f'], [1778, 'GYM', 60, '#9a6a2e']].forEach(r => {
    c.fillStyle = r[3]; rr(c, r[0] - r[2] / 2, 616, r[2], 18, 5); c.fill(); signText(c, r[1], r[0], 625.5, 11, '#ffffff');
  });
  // room decor
  const mkPoster = (x, y, cols) => cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(x + i * 22, y, 16, 20); });
  c.fillStyle = '#7a7a7a'; c.fillRect(186, 62, 248, 44); c.fillStyle = '#fbfbf7'; c.fillRect(190, 66, 240, 36);
  c.strokeStyle = '#5a7bd8'; c.lineWidth = 2; c.beginPath(); c.moveTo(202, 78); c.lineTo(290, 78); c.moveTo(202, 90); c.lineTo(370, 90); c.stroke();
  c.strokeStyle = '#d65a5a'; c.beginPath(); c.moveTo(310, 78); c.lineTo(350, 78); c.stroke();
  mkPoster(54, 40, ['#ffb347', '#6fd1ff', '#8ae29a', '#ff8fa3']); drawClock(c, 520, 54);
  c.fillStyle = '#7a7a7a'; c.fillRect(690, 62, 228, 44); c.fillStyle = '#fbfbf7'; c.fillRect(694, 66, 220, 36);
  c.strokeStyle = '#8a5ad8'; c.lineWidth = 2; c.beginPath(); c.moveTo(706, 80); c.lineTo(820, 80); c.stroke();
  mkPoster(626, 40, ['#f4a261', '#74c0fc', '#ffd43b', '#b197fc']); drawClock(c, 970, 54);
  c.fillStyle = '#a9d6ea'; c.fillRect(1040, 38, 90, 24); c.fillRect(1260, 38, 90, 24); c.fillStyle = '#fff'; c.fillRect(1083, 38, 3, 24); c.fillRect(1303, 38, 3, 24);
  c.fillStyle = '#a9d6ea'; c.fillRect(1480, 38, 90, 24); c.fillStyle = '#fff'; c.fillRect(1523, 38, 3, 24);
  c.fillStyle = '#e9eef0'; c.fillRect(1730, 36, 22, 30);
  c.fillStyle = '#2d3a32'; c.fillRect(1830, 36, 100, 26); signText(c, 'STAFF BOARD', 1880, 49, 10, '#f3e6a1');
  c.fillStyle = '#e8dcc2'; c.fillRect(1960, 36, 24, 28); c.fillRect(1996, 36, 24, 28); c.fillStyle = '#c9a24a'; c.fillRect(1966, 42, 12, 8); c.fillRect(2002, 42, 12, 8);
  signText(c, 'LIBRARY', 1204, 50, 14, '#f0e6ff');
  // south room decor
  c.fillStyle = '#2d3a32'; c.fillRect(1000, 664, 100, 22); signText(c, 'TATER TOTS', 1050, 675, 10, '#f3e6a1');
  signText(c, 'LAKEVIEW ELEMENTARY', 240, 676, 11, '#7a5a3a');
  c.fillStyle = '#d63b4b'; c.fillRect(580, 668, 10, 4); c.fillRect(578, 662, 14, 3);
  signText(c, 'GO EAGLES', 1778, 676, 13, '#9a6a2e');
}
function schoolFurn(c) {
  const F = (t, r, o) => drawFurn(c, Object.assign({ t, x: r[0], y: r[1], w: r[2], h: r[3] }, o || {}));
  DESK3_ROWS.forEach(cy => DESK3_COLS.forEach(cx => F('table', [cx - 23, cy - 12, 46, 24], { c: '#b98a55' })));
  DESK4_ROWS.forEach(cy => DESK4_COLS.forEach(cx => F('table', [cx - 23, cy - 12, 46, 24], { c: '#b98a55' })));
  F('table', [292, 150, 36, 24], { c: '#7a5638' }); F('desk', [56, 100, 96, 28], { c: '#8b6240', pc: false }); F('desk', [650, 100, 96, 28], { c: '#8b6240', pc: false });
  F('plant', [48, 380, 30, 32]); F('plant', [540, 380, 30, 32]);
  F('bookshelf', [1048, 98, 100, 44]); F('bookshelf', [1156, 98, 100, 44]); F('bookshelf', [1264, 98, 100, 44]); F('bookshelf', [1040, 190, 36, 150]); F('bookshelf', [1332, 190, 36, 150]);
  F('table', [1120, 260, 92, 64], { c: '#9c7a4f' }); F('table', [1240, 260, 92, 64], { c: '#9c7a4f' }); F('desk', [1040, 372, 100, 34], { c: '#8b6240' });
  F('sofa', [1428, 98, 120, 40], { c: '#b6554e' }); F('machine', [1700, 98, 36, 34], { c: '#4a4f55', screen: '#ff9f43' }); c.fillStyle = '#e63946'; c.fillRect(1714, 108, 6, 4);
  F('counter', [1560, 98, 100, 34], { c: '#8b6240', top: '#d9d3c6' }); F('table', [1520, 240, 130, 48], { c: '#8b6240' }); F('machine', [1428, 300, 50, 60], { c: '#cfd8dc', label: 'COPY', fs: 9 });
  F('plant', [1730, 360, 30, 32]);
  F('desk', [1900, 150, 150, 50], { c: '#6b4a30' }); F('cabinet', [1808, 100, 100, 40], { c: '#8a95a0' }); F('bookshelf', [2060, 100, 90, 44]);
  F('chair', [1940, 230, 26, 24]); F('chair', [1990, 230, 26, 24]); F('plant', [2110, 360, 30, 32]);
  F('hbed', [490, 720, 70, 100]); F('hbed', [580, 720, 70, 100]); F('desk', [570, 950, 110, 40], { c: '#d9e3e8' }); F('plant', [660, 1060, 30, 32]);
  F('counter', [740, 690, 240, 36], { c: '#8a949c', top: '#cfd8dc', label: 'SERVING LINE', fs: 10 }); F('stove', [1160, 672, 180, 44], { label: 'KITCHEN' });
  [[840, 800], [1000, 800], [840, 930], [1000, 930]].forEach(p => F('table', [p[0], p[1], 114, 30], { c: '#c2a37a' }));
  F('table', [1210, 790, 110, 30], { c: '#9c7a4f' }); F('plant', [1330, 1060, 30, 32]);
  F('counter', [60, 720, 150, 40], { c: '#6a5a3a', top: '#e8dcc2', label: 'FRONT DESK', fs: 10 }); F('cabinet', [330, 672, 100, 44], { c: '#8a95a0', label: 'TROPHIES', fs: 9 }); F('bench', [60, 980, 120, 28]);
  F('plant', [380, 1060, 30, 32]);
  F('bench', [1410, 960, 120, 28]);
  c.fillStyle = '#e9e4d8'; c.fillRect(1410, 720, 14, 120); c.fillRect(2130, 720, 14, 120);
  c.strokeStyle = '#e07a3f'; c.lineWidth = 3; c.beginPath(); c.arc(1431, 780, 10, 0, 7); c.stroke(); c.beginPath(); c.arc(2123, 780, 10, 0, 7); c.stroke();
  c.fillStyle = '#6b4a30'; c.fillRect(1520, 740, 36, 4);
  // lunch table plaques
  c.fillStyle = '#3a5a7a'; rr(c, 1226, 774, 78, 14, 4); c.fill(); signText(c, 'STAFF TABLE', 1265, 781.5, 9, '#fff');
  c.fillStyle = '#3a5a7a'; rr(c, 1543, 220, 84, 14, 4); c.fill(); signText(c, 'LUNCH TABLE', 1585, 227.5, 9, '#fff');
  const tray = (x, y) => { c.fillStyle = '#e9e4d8'; c.beginPath(); c.ellipse(x, y, 11, 6, 0, 0, 7); c.fill(); c.fillStyle = '#e6a15a'; c.fillRect(x - 5, y - 4, 10, 6); c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + 6, y - 1, 2.5, 0, 7); c.fill(); };
  tray(1240, 805); tray(1290, 805); tray(1560, 266); tray(1610, 266);
}
function sortedSchoolItems(c) {
  const items = [], sc = S.sch, t = performance.now() / 1000;
  const mood = (100 - sc.mood) / 100;
  // Ms. Park's class is in session through the day
  if (S.t >= 8 * 60 && S.t < 11 * 60 + 25 || S.t >= 12 * 60 + 20 && S.t < 15 * 60 + 40) PARK_KIDS.forEach(k => items.push({ y: k.y, f: () => drawPerson(c, k.x, k.y, Object.assign({ s: 0.82, back: true }, k)) }));
  if (sc.kids !== 'away') KIDS.forEach((k, i) => {
    const inClass = sc.kids === 'class';
    const jiggle = inClass && !k.moving ? Math.sin(t * 2.5 + i * 1.7) * 1.4 * mood : 0;
    items.push({ y: k.y, f: () => drawPerson(c, k.x, k.y + jiggle, Object.assign({ s: 0.82, back: inClass && !k.moving }, k, { face: k.face })) });
  });
  TEACHERS.forEach(tc => {
    items.push({ y: tc.y, f: () => {
      drawPerson(c, tc.x, tc.y, Object.assign({ s: 1, face: tc.x < S.px ? 1 : -1, phase: 0, moving: false }, tc.look));
      if (!sc.talked[tc.id]) {
        const bob = Math.sin(t * 4) * 2;
        c.fillStyle = '#ffc247'; c.beginPath(); c.arc(tc.x, tc.y - 52 + bob, 7, 0, 7); c.fill();
        signText(c, '!', tc.x, tc.y - 51.5 + bob, 11, '#2b1c00');
      }
    } });
  });
  if (period(S.t) === 'l' && !S.meals.l) {
    const bob = Math.sin(t * 5) * 3;
    [[1265, 772], [1585, 216]].forEach(p => items.push({ y: 9999, f: () => { c.fillStyle = '#ffc247'; c.beginPath(); c.moveTo(p[0] - 8, p[1] + bob - 14); c.lineTo(p[0] + 8, p[1] + bob - 14); c.lineTo(p[0], p[1] + bob - 2); c.closePath(); c.fill(); } }));
  }
  items.push({ y: S.py, f: () => drawPerson(c, S.px, S.py, Object.assign({}, PLAYER_LOOK, { face: S.face, phase: G.phase || 0, moving: !!G.moving })) });
  items.sort((a, b) => a.y - b.y);
  return items;
}
function renderSchool(dt) {
  const cv = $('#world');
  if (!wctx) wctx = cv.getContext('2d');
  const c = wctx, sz = sizeCanvas(cv);
  if (sz.w < 2 || sz.h < 2) return;
  const k = Math.max(clamp(sz.w / 880, 0.72, 1.7), sz.w / SCH_W, sz.h / SCH_H);
  const vw = sz.w / k, vh = sz.h / k;
  const tx = clamp(S.px - vw / 2, 0, Math.max(0, SCH_W - vw)), ty = clamp(S.py - 30 - vh / 2, 0, Math.max(0, SCH_H - vh));
  if (!CAM.ready) { CAM.x = tx; CAM.y = ty; CAM.ready = true; FX.fade = 1; }
  const f = 1 - Math.exp(-9 * Math.min(dt, 0.05));
  CAM.x = lerp(CAM.x, tx, f); CAM.y = lerp(CAM.y, ty, f); CAM.k = k; CAM.vw = vw; CAM.vh = vh;
  beginFrame(skyAt(S.t, S.day)); FX.demo = false; FX.wins.length = 0;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#12161d'; c.fillRect(0, 0, cv.width, cv.height);
  const m = sz.dpr * k; FX.m = m;
  c.setTransform(m, 0, 0, m, -CAM.x * m, -CAM.y * m);
  c.drawImage(layerCache('school', SCH_W, SCH_H, g => { drawSchoolBase(g); schoolFurn(g); }), 0, 0, SCH_W, SCH_H);
  drawClock(c, 520, 54); drawClock(c, 970, 54);
  sortedSchoolItems(c).forEach(it => it.f());
  targetRing(c);
  const amb = roomLights(SCH_W, SCH_H, 260);
  lightPass(c, cv, m, { amb });
  finishFrame(c, cv, dt, 0.56);
  drawMinimap();
}
