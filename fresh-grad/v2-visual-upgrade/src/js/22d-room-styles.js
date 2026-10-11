/* ============================ per-room looks (v2) ============================
   Each room gets a style: wall material, window dressing, floor refinements, night ambience and lamp pools, plus an
   `extra` painter for wall art and floor decals and an optional `live` painter for small moving things.
   Nothing here touches furniture footprints, spots, doors or any gameplay data. */
/* a few shapes only a couple of rooms need */
W.chandelier = function (c, x, y, r) {
  IM.shadow(c, x - r, y - r, r * 2, r * 2, r, 7, 0.32, 3, 6);
  c.strokeStyle = '#c9a45c'; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r * 0.55, 0, 7); c.stroke();
  c.strokeStyle = '#8a6a2e'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r; c.fillStyle = '#fff1c4'; c.beginPath(); c.arc(bx, by, 2.8, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(bx - 0.6, by - 0.6, 1, 0, 7); c.fill(); }
  c.fillStyle = '#d4a017'; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
  addLight(x, y + 6, r * 7, r * 5.6, 0, 0.9); addEmit(x, y, r * 2.6, 0, 0.7);
};
W.hood = function (c, x, w) {   // a commercial extractor hood over a row of ranges
  IM.shadow(c, x, 4, w, 70, 3, 8, 0.4, 3, 6);
  c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, '#cfd6db'], [0.4, '#eef2f4'], [1, '#8a979f']]); c.beginPath(); c.moveTo(x + 14, 6); c.lineTo(x + w - 14, 6); c.lineTo(x + w, 62); c.lineTo(x, 62); c.closePath(); c.fill();
  IM.brushed(c, x, 6, w, 56, 0.9);
  c.fillStyle = '#2a2f36'; rr(c, x + 6, 56, w - 12, 10, 2); c.fill(); for (let k = x + 10; k < x + w - 10; k += 5) { c.fillStyle = '#6b747b'; c.fillRect(k, 58, 3, 6); }
  c.fillStyle = '#fff3c4'; for (let k = 0; k < Math.max(2, Math.floor(w / 60)); k++) { c.beginPath(); c.arc(x + 20 + k * (w - 40) / Math.max(1, Math.floor(w / 60) - 1 || 1), 52, 2.4, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 16, 6, w - 32, 1.2);
  addEmit(x + w / 2, 58, w * 0.4, 0, 0.35);
};
W.potRack = function (c, x, w) {
  c.fillStyle = IM.grad(c, 0, 10, 0, 14, [[0, '#cfd6db'], [1, '#7a8791']]); c.fillRect(x, 10, w, 3);
  const r = IM.rng(x, w, 3);
  for (let i = 0; i < Math.floor(w / 22); i++) { const px = x + 10 + i * 22, hh = 14 + r() * 8, col = ['#b87333', '#8a96a0', '#2b2f36'][i % 3]; c.strokeStyle = '#7a8791'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, 13); c.lineTo(px, 17); c.stroke(); IM.shadow(c, px - 7, 17, 14, hh, 3, 3, 0.3, 1, 2); c.fillStyle = IM.grad(c, px - 7, 0, px + 7, 0, [[0, shade(col, 0.3)], [1, shade(col, -0.3)]]); rr(c, px - 7, 17, 14, hh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(px - 5, 19, 1.4, hh - 6); }
};
W.extinguisher = function (c, x, y) {
  IM.shadow(c, x - 4, y, 8, 16, 3, 3, 0.35, 1, 2);
  c.fillStyle = IM.grad(c, x - 4, 0, x + 4, 0, [[0, '#f26d6d'], [0.5, '#d63b4b'], [1, '#8f1f2d']]); rr(c, x - 4, y + 3, 8, 13, 3); c.fill();
  c.fillStyle = '#2b2f36'; c.fillRect(x - 1.4, y - 1, 2.8, 4); c.fillRect(x - 3, y + 1, 6, 1.6); c.fillStyle = '#f6f1e7'; c.fillRect(x - 3, y + 8, 6, 3);
};
W.wallTV = function (c, x, y, w, h) {
  IM.shadow(c, x, y, w, h, 2, 4, 0.4, 1.5, 3);
  c.fillStyle = '#10141a'; rr(c, x, y, w, h, 2); c.fill(); c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, '#1b2a3a'], [1, '#0c141c']]); c.fillRect(x + 1.6, y + 1.6, w - 3.2, h - 3.2); IM.glints(c, x + 1.6, y + 1.6, w - 3.2, h - 3.2, 0.16);
};
W.sanitizer = function (c, x, y) {
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 1, y + 1.4, 7, 12); c.fillStyle = '#e8eef1'; rr(c, x, y, 7, 12, 1.6); c.fill(); c.fillStyle = '#3aa6b9'; c.fillRect(x + 1, y + 2, 5, 4); c.fillStyle = '#9aa7ad'; c.fillRect(x + 1.6, y + 9, 3.8, 1.6);
};
/* a floor decal: a rounded brass inlay line, or a painted guide line */
W.inlay = function (c, x, y, w, h, col, lw, r) { c.strokeStyle = col; c.lineWidth = lw || 1.6; rr(c, x, y, w, h, r || 4); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.6; rr(c, x + 0.6, y + 0.6, w - 1.2, h - 1.2, r || 4); c.stroke(); };
const NIGHT_WARM = [150, 134, 162], NIGHT_COOL = [140, 146, 178];

ROOM_STYLE.apartment = {
  neon: false, night: [152, 134, 162], fridge: 'enamel',
  wall: { kind: 'plaster', wains: 'panel', wcol: '#cdbd9f' },
  win: { frame: '#efe6d2', treat: 'curtain', tcol: '#e7dcc2' },
  floors: [{ grout: 'rgba(110,98,82,.3)' }, { kind: 'wood', ph: 14, pl: 56, col: '#8a6a40' }, { ph: 26, pl: 180 }],
  lamps: [[180, 260, 240, 190, 0, 0.9], [450, 262, 190, 150, 0, 0.85], [765, 240, 230, 170, 0, 0.9], [832, 132, 100, 80, 0, 0.7], [660, 450, 250, 160, 0, 0.5]],
  extra(c, d) {
    // kitchen wall: a shelf of jars and mugs, a framed print and a clock
    W.shelf(c, 396, 38, 96, 'kitchen'); W.frame(c, 408, 10, 34, 20, 'botanical', '#d9c9a6', 5); W.clock(c, 520, 26, 11);
    // living wall: prints above the telly, bedhead art and a bedside sconce
    W.frame(c, 668, 14, 40, 30, 'sea', '#5a3b2a', 7); W.frame(c, 866, 12, 28, 36, 'abstract', '#2b2f36', 9); W.frame(c, 902, 12, 28, 36, 'portrait', '#2b2f36', 11);
    W.sconce(c, 848, 56, 0);
  },
  over(c, d) { W.pendant(c, 448, 272, 8, '#c9a45c', 0); }
};
ROOM_STYLE.grocery = {
  neon: false, night: NIGHT_COOL, fridge: 'steel',
  wall: { kind: 'plaster', wains: 'tile', wcol: '#d9ebdf' },
  win: { frame: '#e8efe9', treat: 'awning', tcol: '#2f8a5b' },
  floors: [{ col2: 'rgba(60,140,100,.11)', grout: 'rgba(70,96,80,.3)' }],
  lamps: [[200, 220, 230, 160, 1, 0.8], [550, 200, 260, 170, 1, 0.8], [900, 220, 230, 160, 1, 0.8], [200, 440, 230, 160, 1, 0.6], [550, 440, 260, 160, 1, 0.6], [900, 440, 230, 160, 1, 0.6]],
  extra(c, d) {
    W.bunting(c, 250, 430, 8, ['#2f8a5b', '#f6f1e7', '#ffc247', '#f6f1e7'], 7); W.bunting(c, 670, 840, 8, ['#2f8a5b', '#f6f1e7', '#ffc247', '#f6f1e7'], 7);
    W.poster(c, 40, 14, 22, 32, '#ffdf9a', '#c0392b', 'apple'); W.poster(c, 1040, 14, 22, 32, '#cfe9d4', '#2f8a5b', 'apple');
    W.clock(c, 1000, 28, 11);
    // painted aisle guide lines on the floor
    W.floorStripe(c, 90, 330, 920, 3, 'rgba(47,138,91,.35)', 0);
  }
};
ROOM_STYLE.diner = {
  neon: true, neonKind: 4, night: [146, 128, 150], cprops: ['napkins', 'dome', 'sauce', 'cups', 'menu', 'shakers', 'dome'],
  wall: { kind: 'plaster', wains: 'tile', wcol: '#c9473f', rail: true },
  win: { frame: '#d9d9d6', treat: 'valance', tcol: '#a83a3a' },
  floors: [{ col2: 'rgba(190,52,52,.62)', grout: 'rgba(90,60,56,.3)' }],
  lamps: [[300, 190, 200, 130, 0, 0.85], [500, 190, 220, 130, 0, 0.85], [700, 190, 200, 130, 0, 0.85], [150, 360, 180, 140, 0, 0.55], [850, 360, 180, 140, 0, 0.55], [500, 440, 260, 150, 0, 0.5]],
  extra(c, d) {
    W.clock(c, 330, 30, 12, '#fffaf0'); W.frame(c, 660, 12, 44, 28, 'music', '#a83a3a', 3);
    W.neon(c, 'OPEN', 740, 26, 11, '#ff5a8a', 4);
    // chrome rail and a red-white checker band
    c.fillStyle = IM.grad(c, 0, 66, 0, 72, [[0, '#f4f6f7'], [1, '#8a979f']]); c.fillRect(34, 65, 932, 4);
    for (let i = 0; i < 64; i++) { c.fillStyle = i % 2 ? '#c0392b' : '#f6f1e7'; c.fillRect(34 + i * 14.6, 69, 14.6, 3.2); }
  },
  bench: null
};
ROOM_STYLE.clinic = {
  night: [150, 160, 182], fridge: 'steel', bench: '#4d86a8', cprops: ['clipboard', 'brochures', 'bell', 'plant'],
  wall: { kind: 'plaster', wains: 'tile', wcol: '#d5e7ee' },
  win: { frame: '#f2f6f8', treat: 'blind' },
  floors: [{ col: '#e6eef2', grout: 'rgba(120,150,160,.28)' }, { col: '#d0e3ec' }],
  lamps: [[220, 230, 250, 170, 1, 0.85], [520, 300, 250, 170, 1, 0.8], [260, 440, 250, 160, 1, 0.8], [780, 190, 200, 150, 1, 0.8], [800, 400, 200, 150, 1, 0.6]],
  extra(c, d) {
    W.poster(c, 372, 14, 30, 42, '#e8f4f8', '#3aa6b9', 'cross'); W.poster(c, 410, 14, 28, 42, '#fff1d8', '#d63b4b', 'apple'); W.poster(c, 700, 14, 30, 42, '#e0f0f6', '#4d86a8', 'wave');
    W.sanitizer(c, 640, 36); W.clock(c, 580, 28, 11);
    // a lit cross over the door
    c.save(); c.shadowColor = '#ff6a78'; c.shadowBlur = 4 * (c.getTransform ? c.getTransform().a : 1); c.fillStyle = '#ff7a86'; c.fillRect(497, 21, 6, 34); c.fillRect(483, 35, 34, 6); c.restore();
    addEmit(500, 38, 28, 2, 0.4);
    // guide lines on the floor, from the door to the exam room
    W.floorStripe(c, 497, 340, 3, 210, 'rgba(58,166,185,.5)', 0); W.floorStripe(c, 503, 340, 3, 210, 'rgba(95,200,140,.5)', 0);
    W.floorStripe(c, 500, 337, 164, 3, 'rgba(58,166,185,.5)', 0); W.floorStripe(c, 500, 343, 164, 3, 'rgba(95,200,140,.5)', 0);
  }
};
ROOM_STYLE.pharmacy = {
  night: NIGHT_COOL, fridge: 'steel',
  wall: { kind: 'plaster', wains: 'tile', wcol: '#d3eadb' },
  win: { frame: '#eef4ef', treat: 'blind' },
  floors: [{ col: '#edf4ee', grout: 'rgba(110,150,126,.28)' }],
  lamps: [[200, 220, 240, 170, 1, 0.8], [480, 330, 260, 190, 1, 0.8], [740, 230, 230, 160, 1, 0.8], [230, 440, 220, 160, 1, 0.6], [740, 450, 220, 160, 1, 0.6]],
  extra(c, d) {
    W.poster(c, 380, 14, 28, 38, '#e8f6ec', '#2f9d6a', 'cross'); W.poster(c, 620, 14, 28, 38, '#fff1d8', '#e63946', 'apple'); W.clock(c, 830, 30, 11);
    c.save(); c.shadowColor = '#52e0a0'; c.shadowBlur = 4 * (c.getTransform ? c.getTransform().a : 1); c.fillStyle = '#58e8a8'; c.fillRect(747, 19, 8, 32); c.fillRect(735, 31, 32, 8); c.restore();
    addEmit(751, 35, 28, 3, 0.45);
  }
};
ROOM_STYLE.bank = {
  night: [148, 136, 150],
  wall: { kind: 'plaster', wains: 'marble', wcol: '#e0d8c2', crown: true },
  win: { frame: '#8a7a55', treat: 'curtain', tcol: '#7a1f33' },
  floors: [{ kind: 'marble', size: 74, col: '#efe9dc' }],
  lamps: [[480, 330, 280, 190, 0, 0.9], [480, 480, 260, 170, 0, 0.8], [150, 380, 200, 160, 0, 0.7], [800, 340, 200, 160, 0, 0.7], [480, 190, 280, 150, 0, 0.6]],
  extra(c, d) {
    W.clock(c, 330, 30, 14, '#fbf3df'); W.frame(c, 610, 14, 38, 46, 'portrait', '#c9a45c', 2); W.frame(c, 664, 14, 38, 46, 'portrait', '#c9a45c', 8);
    W.inlay(c, 60, 120, 840, 410, '#c9a45c', 1.6, 8);
  },
  over(c, d) { W.chandelier(c, 480, 320, 13); W.chandelier(c, 480, 470, 11); }
};
ROOM_STYLE.books = {
  night: [150, 130, 150],
  wall: { kind: 'plaster', wains: 'panel', wcol: '#7a5a3a', stripe: '#b9895a' },
  win: { frame: '#5a3b2a', treat: 'curtain', tcol: '#2f5a4a' },
  floors: [{ kind: 'parquet', size: 48, col: '#b98a5a' }],
  lamps: [[200, 330, 220, 160, 0, 0.8], [480, 300, 240, 170, 0, 0.85], [790, 420, 240, 170, 0, 0.9], [300, 480, 200, 140, 0, 0.6]],
  extra(c, d) {
    W.frame(c, 56, 16, 30, 38, 'portrait', '#c9a45c', 2); W.frame(c, 244, 16, 52, 36, 'land', '#5a3b2a', 4); W.frame(c, 322, 16, 36, 36, 'botanical', '#5a3b2a', 5);
    W.frame(c, 600, 16, 36, 36, 'sea', '#5a3b2a', 6); W.frame(c, 650, 16, 28, 38, 'portrait', '#c9a45c', 7);
    W.shelf(c, 840, 40, 70, 'books');
  },
  over(c, d) { [[200, 330], [480, 300], [790, 420]].forEach(p => W.pendant(c, p[0], p[1], 7.4, '#1f5a46', 0)); }
};
ROOM_STYLE.bakery = {
  night: [152, 132, 148],
  wall: { kind: 'plaster', wains: 'tile', wcol: '#f0dcc0' },
  win: { frame: '#c47a3a', treat: 'valance', tcol: '#c47a3a' },
  floors: [{ col2: 'rgba(196,122,58,.14)', grout: 'rgba(140,96,56,.28)' }],
  lamps: [[300, 210, 230, 150, 0, 0.9], [520, 210, 220, 150, 0, 0.85], [750, 220, 200, 150, 0, 0.75], [250, 400, 220, 160, 0, 0.6], [600, 420, 230, 160, 0, 0.6]],
  extra(c, d) {
    W.clock(c, 585, 28, 12, '#fff8e8'); W.shelf(c, 700, 40, 100, 'kitchen');
    W.frame(c, 830, 14, 22, 30, 'bread', '#a8642a', 2);
  },
  over(c, d) { [[300, 200], [520, 200], [750, 205]].forEach(p => W.pendant(c, p[0], p[1], 6.4, '#c47a3a', 0)); },
  live(c, d) {   // flour hanging in the warm air
    if (REDUCED) return; const t = FX.time;
    c.fillStyle = 'rgba(255,250,236,.55)';
    for (let i = 0; i < 16; i++) { const x = 120 + hash01(i, 3, 5) * 640 + Math.sin(t * 0.3 + i * 2.1) * 14, y = 100 + hash01(i, 4, 6) * 380 + Math.cos(t * 0.25 + i) * 10; c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 0.8 + i); c.fillRect(x, y, 1.5, 1.5); }
    c.globalAlpha = 1;
  }
};
ROOM_STYLE.hardware = {
  night: [140, 138, 150],
  wall: { kind: 'brick', col: '#c9c1b2', wains: 'metal', wcol: '#8a95a0' },
  win: { frame: '#5a6672', treat: 'none' },
  floors: [{ kind: 'plain', col: '#cfcac0' }, { kind: 'wood', col: '#c9a06a' }],
  lamps: [[170, 220, 240, 170, 0, 0.75], [520, 230, 260, 170, 0, 0.75], [850, 200, 240, 170, 0, 0.8], [250, 440, 240, 160, 0, 0.6], [770, 400, 260, 190, 0, 0.8]],
  extra(c, d) {
    W.extinguisher(c, 60, 36); W.clock(c, 610, 28, 11, '#fbfaf4'); W.poster(c, 700, 14, 26, 38, '#ffe27a', '#2b2f36', 'chart'); W.poster(c, 740, 14, 26, 38, '#d9e6ef', '#c0392b', 'cross');
    // safety stripes round the showroom and at the door
    W.floorStripe(c, 596, 246, 348, 4, '#f4c20d', 6); W.floorStripe(c, 596, 550, 348, 4, '#f4c20d', 6); W.floorStripe(c, 596, 246, 4, 308, '#f4c20d', 6); W.floorStripe(c, 940, 246, 4, 308, '#f4c20d', 6);
    W.floorStripe(c, 400, 500, 200, 4, '#f4c20d', 8);
  },
  over(c, d) { [[170, 220], [520, 230], [850, 200]].forEach(p => W.pendant(c, p[0], p[1], 6.4, '#4a545c', 0)); }
};
ROOM_STYLE.cinema = {
  neon: true, neonKind: 0, night: [124, 100, 124], sofa: 'leather', cprops: ['bucket', 'cups', 'jar', 'box', 'bucket'],
  wall: { kind: 'velvet', col: '#5a1f2e', wains: 'velvet', wcol: '#4a1826', crown: true },
  win: { frame: '#d4a017', treat: 'curtain', tcol: '#7a1f33' },
  floors: [{ col: '#5a1f2e', col2: 'rgba(255,200,80,.08)', motif: 'rgba(255,200,90,.16)' }],
  lamps: [[500, 200, 300, 180, 0, 0.6], [150, 360, 200, 150, 0, 0.55], [850, 330, 200, 150, 0, 0.55], [500, 480, 260, 160, 0, 0.55], [760, 60, 160, 110, 0, 0.7], [880, 60, 160, 110, 0, 0.7]],
  extra(c, d) {
    W.sconce(c, 320, 40, 0); W.sconce(c, 640, 40, 0);
    W.inlay(c, 60, 120, 880, 400, 'rgba(212,160,23,.55)', 1.6, 8);
    // gold stars along the frieze
    c.fillStyle = 'rgba(255,224,150,.5)'; for (let i = 0; i < 20; i++) { const x = 40 + i * 47; c.beginPath(); for (let k = 0; k < 5; k++) { const a = -1.5708 + k * 1.2566; c.lineTo(x + Math.cos(a) * 2.6, 44 + Math.sin(a) * 2.6); const a2 = a + 0.6283; c.lineTo(x + Math.cos(a2) * 1.1, 44 + Math.sin(a2) * 1.1); } c.closePath(); c.fill(); }
  }
};
ROOM_STYLE.salon = {
  night: [152, 132, 156],
  wall: { kind: 'plaster', wains: 'panel', wcol: '#ecc9d9', stripe: '#c05d8a' },
  win: { frame: '#f6f1f4', treat: 'valance', tcol: '#c05d8a' },
  floors: [{ col: '#f7f1f4', col2: 'rgba(192,93,138,.14)', grout: 'rgba(150,90,120,.26)' }],
  lamps: [[170, 190, 200, 140, 0, 0.9], [340, 190, 200, 140, 0, 0.9], [510, 190, 200, 140, 0, 0.9], [740, 220, 220, 150, 0, 0.7], [200, 440, 240, 160, 0, 0.6], [520, 420, 220, 150, 0, 0.6]],
  extra(c, d) {
    W.shelf(c, 600, 36, 42, 'bottles'); W.clock(c, 580, 28, 11, '#fff'); W.frame(c, 840, 14, 28, 36, 'portrait', '#c05d8a', 4);
    W.stringLights(c, 640, 830, 70, 4, 8, ['#fff0b0', '#ffc3da']);
  }
};
ROOM_STYLE.laundry = {
  night: NIGHT_COOL,
  wall: { kind: 'plaster', wains: 'tile', wcol: '#c8e4ea' },
  win: { frame: '#2a9d8f', treat: 'none' },
  floors: [{ col: '#e9eef0', col2: 'rgba(42,157,143,.14)', grout: 'rgba(80,130,130,.28)' }],
  lamps: [[250, 200, 240, 170, 1, 0.85], [560, 220, 260, 170, 1, 0.85], [820, 200, 240, 170, 1, 0.85], [500, 380, 300, 170, 1, 0.6], [250, 440, 230, 150, 1, 0.5], [800, 450, 230, 150, 1, 0.5]],
  extra(c, d) {
    W.clock(c, 700, 30, 12, '#fbfaf4'); W.poster(c, 160, 14, 24, 40, '#e0f3f1', '#2a9d8f', 'wave'); W.poster(c, 200, 14, 24, 40, '#fff1d8', '#e76f51', 'apple');
    W.floorStripe(c, 160, 160, 700, 3, 'rgba(42,157,143,.3)', 0);
  },
  live(c, d) {   // soap bubbles lifting off the washers
    if (REDUCED) return; const t = FX.time;
    for (let i = 0; i < 9; i++) { const p = (t * 0.07 + hash01(i, 2, 3)) % 1, x = 190 + hash01(i, 4, 5) * 420 + Math.sin(p * 9 + i) * 8, y = 170 - p * 90, r = 2 + hash01(i, 6, 7) * 3; c.globalAlpha = Math.sin(p * Math.PI) * 0.6; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.8; c.fillStyle = 'rgba(190,230,245,.25)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke(); }
    c.globalAlpha = 1;
  }
};
ROOM_STYLE.bikes = {
  night: [140, 138, 152],
  wall: { kind: 'brick', col: '#cfd4d9', wains: 'metal', wcol: '#8a95a0' },
  win: { frame: '#e76f51', treat: 'none' },
  floors: [{ kind: 'plain', col: '#cdd1d5' }],
  lamps: [[200, 190, 240, 170, 0, 0.75], [480, 260, 260, 180, 0, 0.8], [760, 200, 240, 170, 0, 0.8], [300, 400, 260, 170, 0, 0.6], [740, 450, 220, 150, 0, 0.6]],
  extra(c, d) {
    W.frame(c, 330, 14, 40, 30, 'bike', '#e76f51', 4); W.clock(c, 600, 28, 11, '#fbfaf4');
    W.floorStripe(c, 70, 296, 460, 3, 'rgba(231,111,81,.4)', 0);
    // oil and tyre marks by the repair bench
    c.fillStyle = 'rgba(' + IM.INK + ',.1)'; c.beginPath(); c.ellipse(700, 190, 22, 9, 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(760, 330, 14, 6, -0.3, 0, 7); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.12)'; c.lineWidth = 5; c.beginPath(); c.moveTo(520, 520); c.quadraticCurveTo(560, 430, 640, 400); c.stroke();
  },
  over(c, d) { [[200, 190], [480, 260], [760, 200]].forEach(p => W.pendant(c, p[0], p[1], 6.4, '#2b2f36', 0)); }
};
ROOM_STYLE.cafe = {
  neon: true, neonKind: 0, night: [146, 122, 140], cprops: ['dome', 'mugs', 'jar', 'dome', 'cups'],
  wall: { kind: 'plaster', wains: 'bead', wcol: '#7a5738', stripe: '#c9a97c' },
  win: { frame: '#3d5a80', treat: 'curtain', tcol: '#b8a07a' },
  floors: [{ ph: 24, pl: 150, col: '#a8774a' }],
  lamps: [[125, 330, 220, 160, 0, 0.9], [295, 430, 220, 160, 0, 0.85], [495, 330, 220, 160, 0, 0.9], [790, 380, 260, 180, 0, 0.8], [450, 190, 280, 150, 0, 0.7]],
  extra(c, d) {
    W.stringLights(c, 340, 630, 8, 7, 14);
    W.frame(c, 312, 14, 28, 30, 'coffee', '#3d5a80', 3);
    W.shelf(c, 350, 56, 56, 'kitchen');
  },
  over(c, d) { [[125, 325], [295, 425], [495, 325]].forEach(p => W.pendant(c, p[0], p[1], 7, '#e8c46a', 0)); },
  live(c, d) {   // steam off the espresso machine
    if (REDUCED) return; const t = FX.time;
    for (let i = 0; i < 5; i++) { const p = (t * 0.25 + i / 5) % 1; c.fillStyle = 'rgba(245,248,252,' + (0.3 * (1 - p)).toFixed(3) + ')'; c.beginPath(); c.arc(362 + Math.sin(p * 6 + i) * 3, 100 - p * 26, 2 + p * 5, 0, 7); c.fill(); }
  }
};
ROOM_STYLE.pizza = {
  neon: true, neonKind: 2, night: [148, 122, 128], cprops: ['pizzabox', 'shakers', 'napkins', 'cups', 'sauce'],
  wall: { kind: 'brick', col: '#b9604a', wains: 'tile', wcol: '#e9dcc0' },
  win: { frame: '#2f7d4f', treat: 'awning', tcol: '#2f7d4f' },
  floors: [{ col2: 'rgba(47,125,79,.16)', grout: 'rgba(90,70,50,.3)' }],
  lamps: [[170, 190, 210, 150, 5, 0.95], [450, 220, 240, 150, 0, 0.8], [200, 400, 220, 150, 0, 0.6], [640, 360, 240, 160, 0, 0.6], [790, 330, 200, 150, 0, 0.7]],
  extra(c, d) {
    W.bunting(c, 250, 380, 8, ['#2f7d4f', '#f6f1e7', '#c0392b'], 9); W.frame(c, 250, 22, 40, 28, 'pizza', '#2f7d4f', 5); W.clock(c, 590, 30, 11, '#fff8e8');
    W.shelf(c, 100, 38, 120, 'bottles');
  },
  over(c, d) { [[450, 220], [200, 400], [640, 360]].forEach(p => W.pendant(c, p[0], p[1], 6.6, '#c0392b', 0)); }
};
ROOM_STYLE.dentist = {
  night: NIGHT_COOL, bench: '#3aa6b9', cprops: ['clipboard', 'brochures', 'bell', 'plant'],
  wall: { kind: 'plaster', wains: 'tile', wcol: '#cfe9ee' },
  win: { frame: '#eef7f9', treat: 'blind' },
  floors: [{ col: '#cfe3e8', col2: 'rgba(58,166,185,.14)' }, { col: '#eef6f8', grout: 'rgba(110,160,176,.26)' }],
  lamps: [[220, 220, 250, 170, 1, 0.85], [330, 420, 250, 170, 1, 0.8], [760, 200, 230, 170, 1, 0.85], [760, 420, 200, 150, 1, 0.7]],
  extra(c, d) {
    W.poster(c, 540, 14, 26, 40, '#e0f4f8', '#3aa6b9', 'tooth'); W.poster(c, 574, 14, 26, 40, '#fff1d8', '#e76f51', 'apple'); W.clock(c, 700, 26, 11);
    W.sanitizer(c, 620, 38);
  }
};

/* ---------- the five workplaces ---------- */
const OFFICE_GRID = (x0, x1, y0, y1, nx, ny, rx, ry, kind, a) => { const L = []; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) L.push([x0 + (x1 - x0) * (nx === 1 ? 0.5 : i / (nx - 1)), y0 + (y1 - y0) * (ny === 1 ? 0.5 : j / (ny - 1)), rx, ry, kind, a]); return L; };
ROOM_STYLE.work_cs = {
  night: [126, 138, 178], fridge: 'steel', bench: '#5a6a8a',
  wall: { kind: 'plaster', wains: 'panel', wcol: '#b9c3d6' },
  win: { frame: '#68758c', treat: 'blind' },
  floors: [{ tiles: 48, col: '#8e9bb0', wearX: 220 }, { kind: 'plain', col: '#bdb6a6', joint: 90 }, { col2: 'rgba(60,90,120,.1)' }, { tiles: 48, wearX: 940 }],
  lamps: OFFICE_GRID(150, 640, 200, 500, 4, 3, 190, 150, 1, 0.8).concat([[940, 200, 190, 140, 1, 0.8], [940, 500, 200, 150, 0, 0.7]]),
  extra(c, d) {
    W.clock(c, 848, 30, 10, '#fbfaf4'); W.frame(c, 1014, 14, 36, 36, 'abstract', '#3a4a66', 3);
    W.floorStripe(c, 52, 184, 156, 3, '#f4c20d', 6);
    // cables trunking along the floor from the racks
    c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(120, 186, 6, 60); c.fillStyle = '#6b7a8f'; c.fillRect(119, 185, 6, 58); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(119, 185, 1.4, 58);
  }
};
ROOM_STYLE.work_eng = {
  night: [128, 130, 150], fridge: 'steel', bench: '#5a6672',
  wall: { kind: 'brick', col: '#cdd1d6', wains: 'metal', wcol: '#8a95a0' },
  win: { frame: '#4a545c', treat: 'none' },
  floors: [{ kind: 'plain', col: '#b9bec4', joint: 118 }, { kind: 'plain', col: '#bdb6a6', joint: 90 }, { col2: 'rgba(60,90,120,.1)' }, { tiles: 48 }],
  lamps: OFFICE_GRID(150, 640, 200, 500, 4, 3, 180, 140, 0, 0.8).concat([[940, 200, 190, 140, 1, 0.7], [940, 500, 200, 150, 0, 0.7]]),
  extra(c, d) {
    W.pipe(c, 40, 786, 9, 3.4, '#8a96a0'); W.vent(c, 330, 66, 40);
    W.extinguisher(c, 62, 34); W.clock(c, 810, 30, 10, '#fbfaf4'); W.poster(c, 740, 14, 28, 36, '#ffe27a', '#2b2f36', 'chart');
    // safety markings round the machines and the walkways
    W.floorStripe(c, 52, 188, 240, 4, '#f4c20d', 8); W.floorStripe(c, 52, 540, 730, 4, '#f4c20d', 10);
    W.floorStripe(c, 52, 188, 4, 70, '#f4c20d', 8);
    c.fillStyle = 'rgba(' + IM.INK + ',.12)'; c.beginPath(); c.ellipse(240, 220, 24, 9, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(420, 360, 30, 12, -0.2, 0, 7); c.fill();
  }
};
ROOM_STYLE.work_nurse = {
  night: [138, 150, 176], fridge: 'steel', bench: '#4d86a8',
  wall: { kind: 'plaster', wains: 'tile', wcol: '#cfe6ee' },
  win: { frame: '#f2f6f8', treat: 'blind' },
  floors: [{ col: '#e3edf0', col2: 'rgba(100,170,190,.16)', grout: 'rgba(120,150,160,.28)' }, { kind: 'plain', col: '#bdb6a6', joint: 90 }, { col2: 'rgba(60,90,120,.1)' }, { tiles: 48 }],
  lamps: OFFICE_GRID(150, 640, 200, 500, 4, 3, 190, 150, 1, 0.85).concat([[940, 200, 190, 140, 1, 0.8], [940, 500, 200, 150, 0, 0.7]]),
  extra(c, d) {
    // wall-mounted patient monitors above the three beds
    [95, 235, 375].forEach(x => { W.wallTV(c, x - 22, 20, 44, 28); c.fillStyle = '#9aa7ad'; c.fillRect(x - 3, 48, 6, 4); });
    W.poster(c, 418, 14, 30, 38, '#e8f4f8', '#3aa6b9', 'cross'); W.sanitizer(c, 772, 36);
    W.floorStripe(c, 52, 290, 730, 3, 'rgba(58,166,185,.45)', 0); W.floorStripe(c, 52, 296, 730, 3, 'rgba(95,200,140,.45)', 0);
  },
  live(c, d) {   // a heart trace on each monitor
    const t = REDUCED ? 0 : FX.time;
    [95, 235, 375].forEach((x, k) => {
      const x0 = x - 20, y0 = 22, w = 40, h = 24;
      c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
      c.fillStyle = '#0b1a12'; c.fillRect(x0, y0, w, h);
      c.strokeStyle = '#3bff6a'; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i <= w; i += 1) { const ph = ((i + t * 24 + k * 13) % 40) / 40; let v = 0; if (ph > 0.3 && ph < 0.34) v = -2; else if (ph >= 0.34 && ph < 0.4) v = 9 * Math.sin((ph - 0.34) / 0.06 * Math.PI); else if (ph >= 0.4 && ph < 0.44) v = -3; else if (ph > 0.55 && ph < 0.68) v = -2 * Math.sin((ph - 0.55) / 0.13 * Math.PI); const yy = y0 + h * 0.62 - v; if (i) c.lineTo(x0 + i, yy); else c.moveTo(x0 + i, yy); }
      c.stroke();
      c.fillStyle = '#ffd23b'; c.fillRect(x0 + w - 9, y0 + 2, 6, 2); c.fillStyle = '#4cc9f0'; c.fillRect(x0 + 3, y0 + 2, 8, 2);
      c.restore(); IM.glints(c, x0, y0, w, h, 0.14);
      if (FX.nf > 0.05) { litRect(x0, y0, w, h); addEmit(x, 34, 22, 3, 0.25); }
    });
  }
};
ROOM_STYLE.work_biz = {
  night: [138, 128, 156], fridge: 'steel', bench: '#6a5a8a', sofa: 'leather',
  wall: { kind: 'plaster', wains: 'panel', wcol: '#c9bdd6', stripe: '#a99bb8' },
  win: { frame: '#5a4a6e', treat: 'curtain', tcol: '#6a5a8a' },
  floors: [{ tiles: 48, col: '#9a8aa8', wearX: 330 }, { kind: 'plain', col: '#bdb6a6', joint: 90 }, { col2: 'rgba(60,90,120,.1)' }, { tiles: 48, wearX: 940 }],
  lamps: OFFICE_GRID(150, 640, 200, 500, 4, 3, 190, 150, 0, 0.75).concat([[570, 160, 250, 130, 0, 0.9], [940, 200, 190, 140, 1, 0.8], [940, 500, 200, 150, 0, 0.7]]),
  extra(c, d) {
    W.clock(c, 560, 30, 11, '#fbfaf4'); W.frame(c, 40, 22, 44, 30, 'city', '#4a3560', 2);
 W.frame(c, 1014, 14, 36, 36, 'abstract', '#4a3560', 4);
    W.inlay(c, 450, 104, 240, 110, 'rgba(201,164,92,.5)', 1.4, 6);
  },
  over(c, d) { W.pendant(c, 570, 156, 9, '#2f3a4a', 0); }
};
ROOM_STYLE.work_cook = {
  night: [150, 134, 140], fridge: 'steel', bench: '#a83a3a',
  wall: { kind: 'tile', col: '#ebe5d6', wains: 'tile', wcol: '#d8d0bd' },
  win: { frame: '#8a7a5a', treat: 'none' },
  floors: [{ size: 44, col: '#c9a893', col2: 'rgba(120,60,40,.2)', grout: 'rgba(80,50,40,.4)' }, { kind: 'plain', col: '#bdb6a6', joint: 90 }, { col2: 'rgba(60,90,120,.1)' }, { tiles: 48 }],
  lamps: OFFICE_GRID(150, 640, 200, 500, 4, 3, 180, 140, 0, 0.8).concat([[200, 170, 240, 130, 5, 0.8], [940, 200, 190, 140, 1, 0.8], [940, 500, 200, 150, 0, 0.7]]),
  extra(c, d) {
    W.hood(c, 56, 300); W.potRack(c, 372, 80); W.clock(c, 780, 30, 10, '#fbfaf4'); W.extinguisher(c, 46, 36);
    c.fillStyle = 'rgba(' + IM.INK + ',.35)'; rr(c, 290, 330, 40, 26, 3); c.fill(); c.strokeStyle = '#7a8791'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(294 + k * 6, 333); c.lineTo(294 + k * 6, 353); c.stroke(); }
    W.floorStripe(c, 52, 190, 300, 3, '#f4c20d', 8);
  }
};
