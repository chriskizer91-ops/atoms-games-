/* a building's walls, texture, roof band and fixed trimmings never change, so each one is painted once and kept as a sprite.
   The sprite reaches 64 px above the roofline for roof furniture and signs. */
const SHELL = new Map();
const W_SH_T = 64, W_SH_S = 12, W_SH_B = 10;
function baseBuilding(c, b, rh, o) {
  o = o || {};
  const res = (typeof GC !== 'undefined' && GC.res) || 1, key = (b.id || b.x) + '|' + b.wall + '|' + res + '|' + season() + '|' + W_FONT_GEN;
  let sp = SHELL.get(key);
  if (sp) { SHELL.delete(key); SHELL.set(key, sp); }
  else {
    const W = b.w + W_SH_S * 2, H = b.h + W_SH_T + W_SH_B;
    sp = document.createElement('canvas'); sp.width = Math.ceil(W * res); sp.height = Math.ceil(H * res);
    const g = sp.getContext('2d'), sx = sp.width / W, sy = sp.height / H;
    g.setTransform(sx, 0, 0, sy, -(b.x - W_SH_S) * sx, -(b.y - W_SH_T) * sy);
    paintShell(g, b, rh, o);
    while (SHELL.size >= (res > 1.5 ? 24 : 30)) SHELL.delete(SHELL.keys().next().value);
    SHELL.set(key, sp);
  }
  c.drawImage(sp, b.x - W_SH_S, b.y - W_SH_T, b.w + W_SH_S * 2, b.h + W_SH_T + W_SH_B);
}
function paintShell(c, b, rh, o) {
  const bot = b.y + b.h, r = mulberry32(((b.x * 31 + b.y * 17) | 0) + (o.seedAdd || 0));
  wShWall(c, b, rh, o, r);
  if (o.quoin) wShQuoins(c, b, b.y + rh, bot);
  (o.courses || []).forEach(dy => wShCourse(c, b.x, b.y + rh + dy, b.w, 4));
  wShBase(c, b, o);
  if (o.spout !== false) wShSpout(c, b.x + b.w - 6, b.y + rh + 8, bot - 12);
  wShRoof(c, b, rh, o);
  if (o.hero) o.hero(c, b, rh);
  if (o.rp != null) roofProps(c, b, o.rp);
}
/* how many home and office windows are lit at this hour */
function litChance(office) {
  const h = S ? S.t / 60 : 20;
  if (office) return h >= 22 || h < 5 ? 0.14 : h < 8 ? 0.3 : 0.5;
  return h >= 23.5 || h < 4.8 ? 0.12 : h >= 22.5 ? 0.42 : h < 8 ? 0.55 : 0.78;
}

function drawApartment(c, b) {
  const rh = 44; baseBuilding(c, b, rh, { mat: 'brick', quoin: true, courses: [78, 140], roofMat: 'tile', rp: 11, spout: false, hero: wHeroApartment });
  const cx = b.x + b.w / 2, bot = b.y + b.h, ft = b.y + rh, p = 1 - litChance(false), day = S ? S.day : 1;
  nameSign(c, 'MAPLE COURT', cx, b.y + rh / 2 + 2, 19, '#f3d9b8');
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
    const wx = b.x + 22 + i * 49, wy = ft + 24 + r * 62;
    windowAt(c, wx, wy, 31, 36, hash01(i, r, 12 + day) > p, { style: 1 });
    if (hash01(i, r, 5) > 0.45) flowerBox(c, wx - 3, wy + 39, 37, i + r * 3);
  }
  for (let i = 0; i < 5; i++) if (i !== 2) windowAt(c, b.x + 22 + i * 49, bot - 68, 31, 38, hash01(i, 9, 12 + day) > p, { style: 1 });
  doorAt(c, cx, bot, 38, 58, '#5a3b2a', { lit: true });
  sconce(c, cx - 32, bot - 46); sconce(c, cx + 32, bot - 46);
}
function drawWork(c, b) {
  const d = job(); const wb = { id: 'work_' + d.id, x: b.x, y: b.y, w: b.w, h: b.h, wall: d.wall, roof: d.roof };
  const rh = 46, hv = W_WORK_HERO[d.id] || W_WORK_HERO.cs;
  baseBuilding(c, wb, rh, { mat: hv.mat, roofMat: hv.roofMat, rp: hv.rp, board: true, hero: (g, bb, rh2) => wHeroWork(g, b, d, rh2) });
  const nm = d.employer, cx = b.x + b.w / 2, bot = b.y + b.h, ft = b.y + rh;
  const open = isOpen('work'), lit = open || (FX.nf > 0.05 && S && S.t < 22 * 60);
  nameSign(c, nm.toUpperCase(), cx, b.y + rh / 2 + 2, nm.length > 16 ? 15 : 18, d.accent, lit, 1);
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 5; i++) windowAt(c, b.x + 18 + i * 52, ft + 20 + r * 56, 36, 34, lit && hash01(i, r, 31 + (S ? S.day : 0)) > (open ? 0.12 : 0.55), { style: 2, room: [1, 4, 3, 2][Math.floor(hash01(i, r, 9) * 4)], inside: hv.upper && r === 1 && i === hv.upper[0] ? hv.upper[1] : null });
  }
  if (!hv.noLeft) windowAt(c, b.x + 20, bot - 62, 70, 44, lit, { style: 2, room: hv.room, inside: hv.lobby });
  if (!hv.noRight) windowAt(c, b.x + b.w - 90, bot - 62, 70, 44, lit, { style: 2, room: hv.room, inside: hv.lobby });
  doorAt(c, cx, bot, 46, 60, '#2a3b4a', { glass: true, lit });
  wWorkLive(c, b, d, lit);
  planter(c, cx - 44, bot + 2, 0); planter(c, cx + 44, bot + 2, 1);
}
function drawShop(c, b) {
  const rh = 46; baseBuilding(c, b, rh, { mat: 'siding', roofMat: 'shingle', rp: 37, hero: wHeroGrocery });
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, open = isOpen('grocery'), lit = open || FX.nf > 0.05;
  nameSign(c, 'CORNER GROCERY', cx, b.y + rh / 2 + 2, 18, '#e9ffef', open, 3);
  awning(c, b.x - 5, ft + 4, b.w + 10, 26, '#2f8a5b', '#f4f7f2');
  windowAt(c, b.x + 14, ft + 40, 78, 66, lit, { style: 3, inside: wGroceryWindow(0) }); windowAt(c, b.x + b.w - 92, ft + 40, 78, 66, lit, { style: 3, inside: wGroceryWindow(1) });
  doorAt(c, cx, bot, 40, 62, '#2f4f40', { glass: true, lit });
  if (open) wPlaque(c, cx, bot - 38.2, 26, 11, 'OPEN', '#f4f7f2', '#2f6b4c');
  sconce(c, cx - 30, bot - 50); sconce(c, cx + 30, bot - 50);
}
function drawDiner(c, b) {
  const rh = 40; baseBuilding(c, b, rh, { mat: 'siding', matA: 0.5, roofMat: 'seam', board: false, spout: false, hero: wHeroDiner });
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2, open = isOpen('diner'), lit = open || FX.nf > 0.05;
  wNeonSign(c, "DOT'S DINER", cx, b.y + 2, 20, open, 4);
  if (open && FX.nf > 0.05) { litRect(cx - 78, b.y - 18, 156, 38); addLight(cx, b.y + 40, 150, 70, 4, 0.5); }
  windowAt(c, b.x + 14, ft + 54, 80, 50, lit, { style: 3, inside: wDinerBooths }); windowAt(c, b.x + b.w - 94, ft + 54, 80, 50, lit, { style: 3, inside: wDinerBooths });
  windowAt(c, b.x + 14, ft + 6, 40, 22, lit, { style: 0 }); windowAt(c, b.x + b.w - 54, ft + 6, 40, 22, lit, { style: 0 });
  doorAt(c, cx, bot, 38, 58, '#6a2b2b', { lit });
  wPlaque(c, cx, ft + 15.5, 44, 18, open ? 'OPEN' : 'CLOSED', open ? '#ff4d6d' : '#4a252d', open ? '#fff' : '#9a6a75', 10);
  if (open && FX.nf > 0.05) { litRect(cx - 22, ft + 6, 44, 18); addEmit(cx, ft + 15, 34, 4, 0.5); }
}
function drawClinic(c, b) {
  const rh = 46; baseBuilding(c, b, rh, { mat: 'panel', matA: 0.7, roofMat: 'seam', rp: 53, hero: wHeroClinic });
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2;
  nameSign(c, 'ST. ANNE CLINIC', cx, b.y + rh / 2 + 2, 17, '#e8f6ff', true, 1);
  for (let i = 0; i < 5; i++) windowAt(c, b.x + 20 + i * 50, ft + 24, 32, 34, hash01(i, 2, 61) > 0.25, { style: 2, room: [1, 4, 1, 0, 4][i] });
  windowAt(c, b.x + 22, bot - 66, 70, 44, true, { style: 2, inside: wClinicWaiting }); windowAt(c, b.x + b.w - 92, bot - 66, 70, 44, true, { style: 2, inside: wClinicWaiting });
  if (FX.nf > 0.05) { litRect(cx - 19, ft + 66, 38, 38); addEmit(cx, ft + 85, 40, 2, 0.4); addLight(cx, bot + 6, 120, 60, 1, 0.6); }
  doorAt(c, cx, bot, 40, 46, '#9ec3d6', { glass: true, lit: true });
}
