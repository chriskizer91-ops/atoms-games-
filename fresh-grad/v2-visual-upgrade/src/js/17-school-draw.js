/* ============================ school drawing (v2) ============================
   The school is painted once into the cached layer: hallway lino, lockers with vents and stickers, classrooms with
   boards and kids' art, a library, a cafeteria and a gym with a painted court. Window glass and the front door glass
   are punched out of the layer and filled live with the sky; clocks keep their hands live. */
function lockerRun(c, x0, x1, y) {
  const pal = ['#3f7cac', '#4f9d7a', '#b9703f'];
  const n = Math.max(1, Math.round((x1 - x0) / 42)), w = (x1 - x0) / n;
  IM.shadow(c, x0, y + 8, x1 - x0, 40, 2, 6, 0.34, 2, 5);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w, v = hash01(i, Math.round(x0), 5), base = pal[(i + Math.floor(x0 / 7)) % 3], col = shade(base, (v - 0.5) * 0.14);
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, shade(col, 0.2)], [0.45, col], [1, shade(col, -0.24)]]); c.fillRect(x, y, w - 1, 46);
    c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x, y, w - 1, 2.6); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x, y + 2.6, w - 1, 1.2);
    // the door panel, recessed a little, with louvre vents at the top and bottom
    c.strokeStyle = 'rgba(' + IM.INK + ',.3)'; c.lineWidth = 1; c.strokeRect(x + 2.5, y + 6, w - 6, 35);
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.strokeRect(x + 3.5, y + 7, w - 6, 35);
    for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(' + IM.INK + ',.55)'; c.fillRect(x + 6, y + 9 + k * 3.8, w - 13, 1.6); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 6, y + 10.6 + k * 3.8, w - 13, 0.8); }
    for (let k = 0; k < 2; k++) { c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(x + 6, y + 31 + k * 3.8, w - 13, 1.6); }
    // latch and padlock hole, number plate
    c.fillStyle = IM.grad(c, 0, y + 21, 0, y + 31, [[0, '#f4f6f7'], [1, '#8a979f']]); rr(c, x + w - 11, y + 21, 3.4, 9, 1.6); c.fill();
    c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.beginPath(); c.arc(x + w - 9.3, y + 25, 0.8, 0, 7); c.fill();
    c.fillStyle = '#efe6c4'; c.fillRect(x + 5, y + 18, 6, 3.4); c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(x + 6, y + 19.4, 1, 1); c.fillRect(x + 8, y + 19.4, 1, 1);
    if (v > 0.82) { c.fillStyle = ['#ffd43b', '#ff8fa3', '#ffffff'][i % 3]; c.beginPath(); c.arc(x + w * 0.5, y + 14.5, 2.6, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + w * 0.5 - 1, y + 14, 2, 1); }   // a sticker
    if (v < 0.12) { c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.beginPath(); c.ellipse(x + w * 0.4, y + 34, 4, 2.4, 0.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + w * 0.4 - 2, y + 33, 3, 0.8); }   // a dent
    c.fillStyle = IM.grad(c, 0, y + 41, 0, y + 46, [[0, 'rgba(' + IM.INK + ',.18)'], [1, 'rgba(' + IM.INK + ',.5)']]); c.fillRect(x, y + 41, w - 1, 5);
    c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(x + w - 1, y, 1, 46);
  }
}
/* a school clock: painted live so the hands always show the game time */
function drawClock(c, cx, cy) {
  IM.shadow(c, cx - 14, cy - 14, 28, 28, 14, 4, 0.36, 1.2, 2.4);
  c.fillStyle = IM.grad(c, cx - 14, cy - 14, cx + 14, cy + 14, [[0, '#f4f6f7'], [1, '#6b7782']]); c.beginPath(); c.arc(cx, cy, 15, 0, 7); c.fill();
  c.fillStyle = '#fbfaf4'; c.beginPath(); c.arc(cx, cy, 13, 0, 7); c.fill();
  c.strokeStyle = 'rgba(' + IM.INK + ',.6)'; c.lineWidth = 0.9; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? 10.6 : 9.4; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * 12.2, cy + Math.sin(a) * 12.2); c.stroke(); }
  const mm = S.t % 60, hh = (S.t / 60) % 12;
  c.lineCap = 'round'; c.strokeStyle = '#1b2026';
  c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(hh / 12 * 6.283) * 7, cy - Math.cos(hh / 12 * 6.283) * 7); c.stroke();
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(mm / 60 * 6.283) * 10.4, cy - Math.cos(mm / 60 * 6.283) * 10.4); c.stroke();
  c.lineCap = 'butt'; c.fillStyle = '#c0392b'; c.beginPath(); c.arc(cx, cy, 1.4, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx - 4, cy - 4, 6.4, Math.PI, Math.PI * 1.6); c.lineTo(cx - 4, cy - 4); c.fill();
}
/* little pieces the base painter shares */
function schoolPlate(c, text, cx, y, w, col) {
  const x = cx - w / 2, h = 18;
  IM.shadow(c, x, y, w, h, 5, 4, 0.34, 1, 2.6);
  c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, shade(col, 0.16)], [0.55, col], [1, shade(col, -0.18)]]); rr(c, x, y, w, h, 5); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 4.6); c.stroke();
  c.fillStyle = IM.grad(c, 0, y, 0, y + h * 0.5, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]); rr(c, x + 1, y + 1, w - 2, h * 0.5, 4); c.fill();
  c.font = '800 11px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(' + IM.INK + ',.45)'; c.fillText(text, cx + 0.6, y + h / 2 + 1.3); c.fillStyle = '#fff7e8'; c.fillText(text, cx, y + h / 2 + 0.5);
}
function schoolSlab(c, x, y, w, h, col) {   // a wall seen from above, with a lit cap and plaster
  IM.shadow(c, x, y, w, h, 1.5, 8, 0.36, 3, 5);
  c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, shade(col, 0.1)], [1, shade(col, -0.1)]]); c.fillRect(x, y, w, h);
  IM.pat(c, 'iw_plaster', x, y, w, h, 0.9);
  c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x, y, 1.6, h); c.fillRect(x, y, w, 1.6);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + w - 2, y, 2, h);
}
function schoolWallBand(c, x, y, w, h, col, trim) {   // the back wall of a room: paint, crown, rail, baseboard
  c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, shade(col, -0.06)], [0.3, shade(col, 0.1)], [1, shade(col, -0.02)]]); c.fillRect(x, y, w, h);
  IM.pat(c, 'iw_plaster', x, y, w, h, 1);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y, w, 1.6);
  c.fillStyle = IM.grad(c, 0, y + 1.6, 0, y + 9, [[0, 'rgba(' + IM.INK + ',.22)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(x, y + 1.6, w, 7.4);
  c.fillStyle = IM.grad(c, 0, y + h - 7, 0, y + h, [[0, shade(trim, 0.12)], [1, shade(trim, -0.22)]]); c.fillRect(x, y + h - 7, w, 7);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y + h - 7, w, 1); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x, y + h - 1.2, w, 1.2);
}
function schoolDoorFrame(c, g, y, dir) {   // dir -1 = frame seen on a north wall, 1 = south wall
  const x0 = g[0], x1 = g[1];
  c.fillStyle = 'rgba(' + IM.INK + ',.35)'; c.fillRect(x0, y, x1 - x0, 20);   // the open doorway is dark
  c.fillStyle = IM.grad(c, 0, y, 0, y + 20, [[0, 'rgba(' + IM.INK + ',.5)'], [1, 'rgba(' + IM.INK + ',.1)']]); c.fillRect(x0, y, x1 - x0, 20);
  [x0 - 3, x1 - 3].forEach(px => { c.fillStyle = IM.grad(c, px, 0, px + 6, 0, [[0, '#a07850'], [1, '#5a3b2a']]); c.fillRect(px, y, 6, 20); c.fillStyle = 'rgba(255,240,214,.45)'; c.fillRect(px, y, 1.2, 20); });
  c.fillStyle = IM.grad(c, 0, y + (dir < 0 ? 0 : 17), 0, y + (dir < 0 ? 4 : 20), [[0, '#a07850'], [1, '#5a3b2a']]); c.fillRect(x0 - 3, y + (dir < 0 ? 0 : 17), x1 - x0 + 6, 3.4);
  c.fillStyle = '#c9a45c'; c.fillRect(x0 + 2, y + (dir < 0 ? 17 : 0), x1 - x0 - 4, 2.4); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x0 + 2, y + (dir < 0 ? 17 : 0), x1 - x0 - 4, 0.8);   // brass threshold
}
function schoolBoard(c, x, y, w, h, lines, col) {   // a whiteboard with writing, marker tray and a frame
  IM.shadow(c, x - 4, y - 4, w + 8, h + 8, 2, 5, 0.38, 1.5, 3.4);
  c.fillStyle = IM.grad(c, 0, y - 4, 0, y + h + 4, [[0, '#dfe5e8'], [1, '#7f8a92']]); c.fillRect(x - 4, y - 4, w + 8, h + 8);
  c.fillStyle = col || '#fbfbf7'; c.fillRect(x, y, w, h);
  c.fillStyle = IM.grad(c, x, y, x + w * 0.7, y + h, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(0,0,0,.05)']]); c.fillRect(x, y, w, h);
  c.lineCap = 'round'; lines.forEach(l => { c.strokeStyle = l[0]; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x + l[1], y + l[2]); c.quadraticCurveTo(x + (l[1] + l[3]) / 2, y + l[2] + (l[5] || 0), x + l[3], y + l[4]); c.stroke(); }); c.lineCap = 'butt';
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y, w, 1);
  c.fillStyle = IM.grad(c, 0, y + h + 3, 0, y + h + 7, [[0, '#9aa5ad'], [1, '#6f7a82']]); c.fillRect(x + 10, y + h + 2.4, w - 20, 3.4);
  ['#e63946', '#2a6f97', '#2b2f36'].forEach((cc, i) => { c.fillStyle = cc; c.fillRect(x + 16 + i * 9, y + h + 0.4, 6, 2.6); });
  c.fillStyle = '#e9e4d8'; c.fillRect(x + w - 30, y + h + 0.6, 10, 2.4);
}
function schoolPaper(c, x, y, w, h, kind, seed) {   // a child's drawing taped to the wall
  const r = IM.rng(seed, 1, 2), cols = ['#ff8fa3', '#74c0fc', '#ffd43b', '#8ce99a', '#b197fc', '#ffa94d'];
  IM.shadow(c, x, y, w, h, 0.5, 2.4, 0.34, 0.8, 1.6);
  c.fillStyle = '#fbf7ec'; c.fillRect(x, y, w, h);
  if (kind === 0) { c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(x + w * 0.72, y + h * 0.28, w * 0.14, 0, 7); c.fill(); c.fillStyle = cols[(r() * 6) | 0]; c.fillRect(x + w * 0.2, y + h * 0.5, w * 0.4, h * 0.3); c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(x + w * 0.16, y + h * 0.5); c.lineTo(x + w * 0.4, y + h * 0.28); c.lineTo(x + w * 0.64, y + h * 0.5); c.fill(); }
  else if (kind === 1) { ['#e63946', '#ffd43b', '#4cc9f0', '#8ac926'].forEach((cc, i) => { c.strokeStyle = cc; c.lineWidth = 1.4; c.beginPath(); c.arc(x + w / 2, y + h * 0.82, w * (0.42 - i * 0.08), Math.PI, 0); c.stroke(); }); }
  else { c.fillStyle = cols[(r() * 6) | 0]; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x + w * (0.25 + (i % 2) * 0.5), y + h * (0.3 + ((i / 2) | 0) * 0.4), w * 0.16, 0, 7); c.fill(); c.fillStyle = cols[(r() * 6) | 0]; } }
  c.fillStyle = 'rgba(255,240,200,.8)'; c.fillRect(x - 1, y - 1, 3.4, 3); c.fillRect(x + w - 2.4, y - 1, 3.4, 3);   // tape
}
function drawSchoolBase(c) {
  c.fillStyle = '#262d38'; c.fillRect(0, 0, SCH_W, SCH_H);
  const fl = (x, y, w, h, type, col, col2, o) => drawFloor(c, [x, y, w, h, type, col, col2], o);
  // hallway: waxed lino with a painted red stripe
  fl(40, 440, 2120, 200, 'lino', '#cfd5d8', 'rgba(0,0,0,.06)', { size: 60, noShadow: true });
  c.fillStyle = IM.grad(c, 0, 528, 0, 538, [[0, '#d65a4a'], [1, '#9a3328']]); c.fillRect(40, 530, 2120, 6);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(40, 530, 2120, 1); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(40, 536, 2120, 1);
  // north rooms
  fl(40, 60, 540, 360, 'wood', '#dcb88a', null, { ph: 22, pl: 150 }); fl(608, 60, 392, 360, 'wood', '#d8b484', null, { ph: 22, pl: 150, seed: 11 });
  fl(1028, 60, 352, 360, 'carpet', '#7a6a9a', null, { tiles: 44, wearX: 1204 }); fl(1408, 60, 352, 360, 'carpet', '#8392b3', null, { tiles: 44, wearX: 1584 }); fl(1788, 60, 372, 360, 'carpet', '#8a7968', null, { tiles: 44, wearX: 1974 });
  FURN.rug(c, { x: 1470, y: 230, w: 240, h: 140, c: '#6f7fa6' });
  FURN.rug(c, { x: 1090, y: 330, w: 220, h: 70, c: '#8a76b8' });
  // south rooms
  fl(40, 660, 400, 450, 'tile', '#e6e1d2', 'rgba(0,0,0,.05)'); fl(468, 660, 232, 450, 'lino', '#dfeaef', 'rgba(100,170,190,.12)');
  fl(728, 660, 640, 450, 'tile', '#e9e3d3', '#d2cbb6', { size: 58, grout: 'rgba(110,98,80,.26)' });
  fl(1396, 660, 764, 450, 'wood', '#d9a867', null, { ph: 22, pl: 230, seed: 17 });
  // the gym court: out-of-bounds in a darker maple, painted keys, circles and arcs
  c.fillStyle = 'rgba(120,70,20,.16)'; c.fillRect(1396, 690, 764, 420); c.fillStyle = 'rgba(255,236,200,.12)'; c.fillRect(1450, 720, 660, 340);
  c.fillStyle = 'rgba(180,74,60,.3)'; c.fillRect(1450, 820, 110, 140); c.fillRect(2000, 820, 110, 140);
  c.fillStyle = 'rgba(40,60,120,.18)'; c.beginPath(); c.arc(1780, 890, 50, 0, 7); c.fill();
  const lines = () => { c.beginPath(); c.rect(1450, 720, 660, 340); c.moveTo(1780, 720); c.lineTo(1780, 1060); c.moveTo(1830, 890); c.arc(1780, 890, 50, 0, 7); c.rect(1450, 820, 110, 140); c.rect(2000, 820, 110, 140); c.moveTo(1560, 925); c.arc(1560, 890, 35, Math.PI / 2, -Math.PI / 2, true); c.moveTo(2000, 925); c.arc(2000, 890, 35, Math.PI / 2, -Math.PI / 2); c.moveTo(1450 + 150 * Math.cos(-1.35), 890 + 150 * Math.sin(-1.35)); c.arc(1450, 890, 150, -1.35, 1.35); c.moveTo(2110 + 150 * Math.cos(Math.PI - 1.35), 890 + 150 * Math.sin(Math.PI - 1.35)); c.arc(2110, 890, 150, Math.PI - 1.35, Math.PI + 1.35); };
  c.strokeStyle = 'rgba(' + IM.INK + ',.16)'; c.lineWidth = 5; lines(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.88)'; c.lineWidth = 3; lines(); c.stroke();
  c.fillStyle = IM.grad(c, 1396, 660, 2160, 1110, [[0, 'rgba(255,240,210,.14)'], [0.5, 'rgba(255,240,210,0)'], [1, 'rgba(255,240,210,.08)']]); c.fillRect(1396, 660, 764, 450);
  // walls: back walls of the north rooms, outer walls, partitions
  schoolWallBand(c, 30, 30, 2140, 36, '#ebe5d6', '#c9c2b0');
  c.fillStyle = IM.grad(c, 28, 0, 40, 0, [[0, '#6a6454'], [1, '#8b8574']]); c.fillRect(28, 30, 12, 1110); c.fillStyle = IM.grad(c, 2160, 0, 2172, 0, [[0, '#8b8574'], [1, '#6a6454']]); c.fillRect(2160, 30, 12, 1110);
  c.fillStyle = IM.grad(c, 0, 1110, 0, 1140, [[0, '#8b8574'], [1, '#5f5a4c']]); c.fillRect(28, 1110, 2144, 30); IM.pat(c, 'iw_plaster', 28, 1110, 2144, 30, 0.9);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(28, 1110, 2144, 1.4);
  SCH.northSeps.forEach(s => schoolSlab(c, s[0], 30, s[1] - s[0], 410, '#b9b2a2'));
  SCH.southSeps.forEach(s => schoolSlab(c, s[0], 640, s[1] - s[0], 480, '#b9b2a2'));
  wallSegs(SCH.northGaps, 420, 40, 2160, 20).forEach(r => schoolSlab(c, r[0], r[1], r[2], r[3], '#a69f8f'));
  wallSegs(SCH.southGaps, 640, 40, 2160, 20).forEach(r => schoolSlab(c, r[0], r[1], r[2], r[3], '#a69f8f'));
  SCH.northGaps.forEach(g => schoolDoorFrame(c, g, 420, -1));
  SCH.southGaps.forEach(g => schoolDoorFrame(c, g, 640, 1));
  // south room wall faces (decor sits here)
  Object.values(SCH.southRooms).forEach(r => schoolWallBand(c, r[0], 660, r[1] - r[0], 30, '#d8d2c2', '#c4bda9'));
  // lockers on the hallway walls, between the doorways
  LOCKERS_N.forEach(l => lockerRun(c, l[0], l[1], 440));
  LOCKERS_S.forEach(l => lockerRun(c, l[0], l[1], 594));
  // water fountain: steel cabinet, a bowl, a bubbler and a push bar
  IM.shadow(c, 550, 444, 60, 38, 3, 5, 0.34, 2, 4);
  c.fillStyle = IM.grad(c, 550, 0, 610, 0, [[0, '#dfe5e9'], [0.5, '#9aa7ad'], [1, '#6f7b84']]); rr(c, 550, 444, 60, 38, 3); c.fill(); IM.brushed(c, 550, 444, 60, 38, 0.8, 3);
  c.fillStyle = '#7d8a90'; c.fillRect(550, 440, 60, 6); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(550, 440, 60, 1.2);
  c.fillStyle = IM.grad(c, 0, 452, 0, 466, [[0, '#8fb6c9'], [1, '#d7ecf5']]); rr(c, 562, 451, 36, 14, 6); c.fill(); c.strokeStyle = '#dfe5e9'; c.lineWidth = 1.4; rr(c, 562, 451, 36, 14, 6); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(574, 456, 8, 2.2, -0.2, 0, 7); c.fill(); c.fillStyle = '#2a3037'; c.beginPath(); c.arc(580, 459, 1.4, 0, 7); c.fill();
  c.strokeStyle = '#e4eaed'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(580, 451); c.lineTo(580, 447); c.stroke(); IM.knob(c, 600, 474, 2.6, '#e4eaed');
  // front doors: frame, kick plates, push bars; the glass shows the street live
  IM.shadow(c, 186, 1100, 108, 40, 4, 8, 0.4, 0, -3);
  c.fillStyle = IM.grad(c, 186, 0, 294, 0, [[0, '#5a3d2b'], [0.5, '#6a4934'], [1, '#43291b']]); rr(c, 186, 1108, 108, 32, 4); c.fill();
  FX.wins.push(192, 1112, 44, 24, 1); FX.wins.push(244, 1112, 44, 24, 1);
  c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(192, 1112, 44, 24); c.fillRect(244, 1112, 44, 24); c.restore();
  [192, 244].forEach(gx => { c.fillStyle = 'rgba(' + IM.INK + ',.45)'; c.fillRect(gx - 1, 1111, 46, 2); IM.glints(c, gx, 1112, 44, 24, 0.2); });
  c.fillStyle = '#e9d9a2'; rr(c, 235.6, 1118, 3, 12, 1.4); c.fill(); rr(c, 241.4, 1118, 3, 12, 1.4); c.fill();
  c.fillStyle = IM.grad(c, 0, 1098, 0, 1108, [[0, '#d2c7a8'], [1, '#9c9276']]); c.fillRect(176, 1106, 128, 2.6);
  IM.shadow(c, 216, 1086, 48, 17, 4, 4, 0.3, 1, 2); c.fillStyle = '#241719'; rr(c, 216, 1086, 48, 17, 4); c.fill();
  c.save(); c.shadowColor = 'rgba(255,60,50,.8)'; c.shadowBlur = 6 * (c.getTransform ? c.getTransform().a : 1); signText(c, 'EXIT', 240, 1098, 11, '#ff6a58'); c.restore(); signText(c, 'EXIT', 240, 1098, 11, '#ffb0a0'); addEmit(240, 1098, 36, 2, 0.45);
  // hallway banner and door signs
  c.save(); c.shadowColor = 'rgba(' + IM.INK + ',.3)'; c.shadowBlur = 3; signText(c, 'LAKEVIEW EAGLES', 1100, 565, 16, '#b44a3c'); c.restore();
  [[310, 'YOUR CLASSROOM', 128, '#9a3b2e'], [804, 'ROOM 4', 70, '#6a3b8a'], [1204, 'LIBRARY', 84, '#5a4a7a'], [1584, 'TEACHERS LOUNGE', 138, '#3a5a7a'], [1974, 'PRINCIPAL', 96, '#4a4a4a']].forEach(r => schoolPlate(c, r[1], r[0], 444, r[2], r[3]));
  [[240, 'FRONT OFFICE', 112, '#6a5a3a'], [584, 'NURSE', 68, '#4d86a8'], [1048, 'CAFETERIA', 96, '#2f7d4f'], [1778, 'GYM', 60, '#9a6a2e']].forEach(r => schoolPlate(c, r[1], r[0], 616, r[2], r[3]));
  // classrooms: alphabet cards, a board, children's drawings; clocks are drawn live
  const cards = (x, y, cols) => cols.forEach((col, i) => { IM.shadow(c, x + i * 22, y, 16, 20, 1, 2.4, 0.3, 0.8, 1.6); c.fillStyle = col; c.fillRect(x + i * 22, y, 16, 20); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + i * 22, y, 16, 1.2); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x + i * 22 + 8, y + 10, 4.4, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x + i * 22 + 8, y + 10, 2, 0, 7); c.fill(); });
  schoolBoard(c, 190, 66, 240, 36, [['#5a7bd8', 12, 12, 100, 12, -2], ['#5a7bd8', 12, 24, 180, 24, 3], ['#d65a5a', 120, 12, 160, 12, 0]]);
  cards(54, 40, ['#ffb347', '#6fd1ff', '#8ae29a', '#ff8fa3']);
  [150, 196, 236, 282].forEach((x, i) => schoolPaper(c, x + 96, 40, 20, 22, i % 3, i + 3));
  schoolBoard(c, 694, 66, 220, 36, [['#8a5ad8', 12, 14, 114, 14, 2], ['#8a5ad8', 12, 26, 150, 26, -2]]);
  cards(626, 40, ['#f4a261', '#74c0fc', '#ffd43b', '#b197fc']);
  [730, 774, 818, 862].forEach((x, i) => schoolPaper(c, x + 16, 40, 20, 22, (i + 1) % 3, i + 9));
  // library, lounge and the principal's office: windows with a live view
  const win = (x, y, w, h) => {
    IM.shadow(c, x - 4, y - 3, w + 8, h + 6, 2, 4, 0.4, 1, 2.6);
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, '#f4f1ea'], [1, '#cfc9bb']]); c.fillRect(x - 4, y - 3, w + 8, h + 6);
    FX.wins.push(x, y, w, h, 0);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(x, y, w, h); c.restore();
    c.fillStyle = IM.grad(c, 0, y, 0, y + 6, [[0, 'rgba(' + IM.INK + ',.45)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(x, y, w, 6); IM.glints(c, x, y, w, h, 0.18);
    c.fillStyle = '#f4f1ea'; c.fillRect(x + w / 2 - 1.6, y, 3.2, h); c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x + w / 2 + 1.6, y, 0.8, h);
    c.fillStyle = IM.grad(c, 0, y + h, 0, y + h + 4, [[0, '#fbf8ef'], [1, '#c9bfa8']]); c.fillRect(x - 6, y + h, w + 12, 3.4);
  };
  win(1040, 38, 90, 24); win(1260, 38, 90, 24); win(1480, 38, 90, 24);
  W.poster(c, 1730, 34, 22, 30, '#e9eef0', '#3a5a7a', 'chart');
  IM.shadow(c, 1830, 36, 100, 26, 2, 4, 0.36, 1, 2.6); c.fillStyle = IM.grad(c, 1826, 32, 1934, 66, [[0, '#9a7248'], [1, '#5a3d24']]); c.fillRect(1827, 33, 106, 32); c.fillStyle = '#2d3a32'; c.fillRect(1830, 36, 100, 26); IM.pat(c, 'iw_noise', 1830, 36, 100, 26, 0.6); signText(c, 'STAFF BOARD', 1880, 49, 10, '#f3e6a1');
  W.frame(c, 1960, 38, 24, 22, 'portrait', '#c9a45c', 3); W.frame(c, 1996, 38, 24, 22, 'portrait', '#c9a45c', 8);
  c.save(); c.shadowColor = 'rgba(' + IM.INK + ',.4)'; c.shadowBlur = 3; signText(c, 'LIBRARY', 1204, 50, 14, '#f0e6ff'); c.restore();
  // south room decor
  IM.shadow(c, 1000, 664, 100, 22, 2, 4, 0.36, 1, 2.6); c.fillStyle = '#7a5a3a'; c.fillRect(997, 661, 106, 28); c.fillStyle = '#2d3a32'; c.fillRect(1000, 664, 100, 22); IM.pat(c, 'iw_noise', 1000, 664, 100, 22, 0.6); signText(c, 'TATER TOTS', 1050, 675, 10, '#f3e6a1');
  c.fillStyle = IM.grad(c, 0, 668, 0, 684, [[0, '#fbf8ef'], [1, '#e2dac6']]); rr(c, 160, 666, 160, 20, 3); c.fill(); c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 1; rr(c, 160.5, 666.5, 159, 19, 3); c.stroke(); signText(c, 'LAKEVIEW ELEMENTARY', 240, 676, 11, '#7a5a3a');
  c.save(); c.shadowColor = '#ff6a78'; c.shadowBlur = 4 * (c.getTransform ? c.getTransform().a : 1); c.fillStyle = '#e63946'; c.fillRect(580, 668, 10, 4); c.fillRect(578, 662, 14, 3); c.restore();
  IM.shadow(c, 1700, 664, 156, 22, 3, 4, 0.36, 1, 2.6); c.fillStyle = IM.grad(c, 1700, 664, 1856, 686, [[0, '#f1dc9a'], [1, '#c9a45c']]); rr(c, 1700, 664, 156, 22, 3); c.fill(); signText(c, 'GO EAGLES', 1778, 676, 13, '#9a3b2e');
  W.bunting(c, 1420, 1690, 664, ['#b44a3c', '#f1dc9a', '#2a4a7a'], 10); W.bunting(c, 1870, 2140, 664, ['#b44a3c', '#f1dc9a', '#2a4a7a'], 10);
  // the cafeteria and gym share a pale wall band: a service hatch frame above the kitchen
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(1160, 662, 180, 2);
}
function schoolFurn(c) {
  const F = (t, r, o) => drawFurn(c, Object.assign({ t, x: r[0], y: r[1], w: r[2], h: r[3] }, o || {}));
  // small chairs tucked under the children's desks, then the desks with a few things on them
  const chair = (cx, cy) => { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(cx + 1, cy + 18, 9, 3, 0, 0, 7); c.fill(); c.fillStyle = IM.grad(c, 0, cy + 4, 0, cy + 20, [[0, '#e8a246'], [1, '#b9741f']]); rr(c, cx - 8, cy + 6, 16, 12, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(cx - 6, cy + 7, 12, 1.4); c.fillStyle = '#2b2f36'; c.fillRect(cx - 7, cy + 17, 2, 3); c.fillRect(cx + 5, cy + 17, 2, 3); };
  DESK3_ROWS.forEach(cy => DESK3_COLS.forEach(cx => chair(cx, cy + 10)));
  DESK4_ROWS.forEach(cy => DESK4_COLS.forEach(cx => chair(cx, cy + 10)));
  const desk = (cx, cy) => { F('table', [cx - 23, cy - 12, 46, 24], { c: '#b98a55' }); const k = hash01(cx, cy, 3); if (k < 0.5) PROP.notebook(c, cx - 14, cy - 8, 11, 9, ['#3d5a80', '#c0392b', '#2a9d8f', '#8e44ad'][(k * 8) | 0]); else PROP.paper(c, cx - 14, cy - 9, 10, 11, k * 0.3 - 0.1, 3); if (k > 0.3 && k < 0.8) { c.fillStyle = '#ffd43b'; c.fillRect(cx + 6, cy - 3, 9, 1.8); c.fillStyle = '#e63946'; c.fillRect(cx + 14, cy - 3, 1.6, 1.8); } };
  DESK3_ROWS.forEach(cy => DESK3_COLS.forEach(cx => desk(cx, cy)));
  DESK4_ROWS.forEach(cy => DESK4_COLS.forEach(cx => desk(cx, cy)));
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
  // cafeteria benches (not in the way: the children sit on them) then the tables
  [[840, 800], [1000, 800], [840, 930], [1000, 930]].forEach(p => {
    [-26, 44].forEach(dy => { IM.shadow(c, p[0] + 4, p[1] + dy, 106, 12, 3, 4, 0.26, 1.5, 3); c.fillStyle = IM.grad(c, 0, p[1] + dy, 0, p[1] + dy + 12, [[0, '#d9a05b'], [1, '#a8742e']]); rr(c, p[0] + 4, p[1] + dy, 106, 11, 3); c.fill(); IM.grain(c, p[0] + 4, p[1] + dy, 106, 11, p[0] + dy, 0.8); c.fillStyle = 'rgba(255,240,214,.4)'; c.fillRect(p[0] + 6, p[1] + dy, 102, 1); });
    F('table', [p[0], p[1], 114, 30], { c: '#c2a37a' });
  });
  F('table', [1210, 790, 110, 30], { c: '#9c7a4f' }); F('plant', [1330, 1060, 30, 32]);
  F('counter', [60, 720, 150, 40], { c: '#6a5a3a', top: '#e8dcc2', label: 'FRONT DESK', fs: 10 }); F('cabinet', [330, 672, 100, 44], { c: '#8a95a0', label: 'TROPHIES', fs: 9 }); F('bench', [60, 980, 120, 28]);
  F('plant', [380, 1060, 30, 32]);
  F('bench', [1410, 960, 120, 28]);
  // gym hoops: glass backboard, a bracket, an orange rim with a net
  [[1410, 1], [2130, -1]].forEach(p => {
    const bx = p[0], dir = p[1], rx = bx + (dir > 0 ? 21 : -7);
    IM.shadow(c, bx, 720, 14, 120, 2, 5, 0.34, 2, 4);
    c.fillStyle = IM.grad(c, bx, 0, bx + 14, 0, [[0, '#f4f6f7'], [1, '#aab6bd']]); c.fillRect(bx, 720, 14, 120); c.fillStyle = 'rgba(200,225,240,.6)'; c.fillRect(bx + 3, 726, 8, 108); c.strokeStyle = 'rgba(' + IM.INK + ',.35)'; c.lineWidth = 1; c.strokeRect(bx + 3.5, 760.5, 7, 40);
    c.strokeStyle = '#7a8791'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(bx + (dir > 0 ? 14 : 0), 780); c.lineTo(rx + (dir > 0 ? 0 : 0), 780); c.stroke();
    const cx = bx + (dir > 0 ? 14 : 0) + dir * 12;
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx + k * 3.4, 773); c.lineTo(cx + k * 1.6, 787); c.stroke(); }
    c.strokeStyle = '#e07a3f'; c.lineWidth = 3; c.beginPath(); c.arc(cx, 780, 10, 0, 7); c.stroke(); c.strokeStyle = 'rgba(255,220,170,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, 779, 10, Math.PI * 1.1, Math.PI * 1.8); c.stroke();
  });
  c.fillStyle = '#6b4a30'; c.fillRect(1520, 740, 36, 4);
  // lunch table plaques
  c.fillStyle = '#3a5a7a'; rr(c, 1226, 774, 78, 14, 4); c.fill(); signText(c, 'STAFF TABLE', 1265, 781.5, 9, '#fff');
  c.fillStyle = '#3a5a7a'; rr(c, 1543, 220, 84, 14, 4); c.fill(); signText(c, 'LUNCH TABLE', 1585, 227.5, 9, '#fff');
  const tray = (x, y) => { c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.beginPath(); c.ellipse(x + 1, y + 1.6, 11, 6, 0, 0, 7); c.fill(); c.fillStyle = '#e9e4d8'; c.beginPath(); c.ellipse(x, y, 11, 6, 0, 0, 7); c.fill(); c.fillStyle = '#e6a15a'; c.fillRect(x - 5, y - 4, 10, 6); c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + 6, y - 1, 2.5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 5, y - 4, 10, 1); };
  tray(1240, 805); tray(1290, 805); tray(1560, 266); tray(1610, 266);
  // lunch trays on the student tables
  [[840, 800], [1000, 800], [840, 930], [1000, 930]].forEach(p => { tray(p[0] + 28, p[1] + 14); tray(p[0] + 86, p[1] + 14); });
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
  ROOMCTX.d = null; ROOMCTX.st = roomStyle({ id: 'school', trim: '#a69f8f', wallCol: '#ebe5d6' }); ROOMCTX.sc = true;
  const cvs = layerCache('school', SCH_W, SCH_H, g => { drawSchoolBase(g); schoolFurn(g); });
  drawWindowViews(c, LAYER.rec);
  c.drawImage(cvs, 0, 0, SCH_W, SCH_H);
  replayLights(LAYER.rec);
  drawClock(c, 520, 54); drawClock(c, 970, 54);
  c.save(); c.beginPath(); c.rect(1028, 66, 732, 354); c.clip(); c.globalCompositeOperation = 'screen'; sunPools(c, LAYER.rec.wins, 66); c.restore();
  sortedSchoolItems(c).forEach(it => it.f());
  targetRing(c);
  const amb = roomLights(SCH_W, SCH_H, 260);
  lightPass(c, cv, m, { amb });
  finishFrame(c, cv, dt, 0.56);
  drawMinimap();
}
