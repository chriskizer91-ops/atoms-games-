/* ============================ filler buildings ============================ */
function drawDeco(c, b) {
  const tower = b.style === 'tower', shop = b.style === 'shop';
  const rh = tower ? 24 : 36, brick = !tower && (shop ? (b.seed & 1) : (b.seed & 2));
  baseBuilding(c, b, rh, { mat: tower ? 'panel' : brick ? 'brick' : shop ? 'siding' : 'stucco', roofMat: tower ? 'seam' : brick ? 'tile' : 'shingle', rp: b.seed, quoin: !!brick && b.seed % 3 !== 1, hero: wHeroDeco });
  const nm = b.name.toUpperCase();
  const ft = b.y + rh, bot = b.y + b.h, cx = b.x + b.w / 2;
  const night = FX.nf > 0.05, open = !S || (b.place ? isOpen(b.place) : S.t >= 7 * 60 && S.t < 21 * 60), day = S ? S.day : 1;
  const p = 1 - litChance(tower), sty = tower ? 2 : brick ? 1 : 0;
  nameSign(c, nm, cx, b.y + rh / 2 + 2, nm.length > 14 ? 12 : 15, b.accent, shop && open, 5);
  const cols = Math.max(2, Math.floor((b.w - 28) / 50)), cw = (b.w - 28) / cols;
  const rowsEnd = bot - (shop ? 84 : 70), rowStep = tower ? 40 : 54;
  let r = 0;
  for (let y = ft + 14; y + 34 <= rowsEnd; y += rowStep, r++) {
    for (let i = 0; i < cols; i++) {
      const lit = night ? hash01(b.seed + day, r, i) > p : false;
      const wx = b.x + 14 + i * cw + 4;
      windowAt(c, wx, y, cw - 14, tower ? 26 : 32, lit, { style: sty, room: tower ? [1, 4, 3, 2][Math.floor(hash01(b.seed, r, i) * 4)] : null });
      if (!tower && !shop && hash01(b.seed, r * 7 + i, 4) > 0.6) flowerBox(c, wx - 3, y + 35, cw - 8, i + r);
      else if (!tower && !shop && hash01(b.seed, r * 7 + i, 4) < 0.22) { const rw = Math.round(cw - 14), rl = wspr('rl' + rw, rw + 10, 22, g => wPaintRail(g, rw)); c.drawImage(rl.cv, wx - 5, y + 32 - 13, rl.w, rl.h); }
    }
  }
  if (shop) {
    awning(c, b.x - 5, bot - 80, b.w + 10, 22, b.accent, '#f6f1e7');
    windowAt(c, b.x + 14, bot - 54, b.w / 2 - 40, 38, night || open, { style: 3, inside: wShopInside(b.name, 0) });
    windowAt(c, b.x + b.w / 2 + 28, bot - 54, b.w / 2 - 42, 38, night || open, { style: 3, inside: wShopInside(b.name, 1) });
    doorAt(c, cx, bot, 34, 50, shade(b.roof, -0.1), { lit: night && open });
    if (open) sconce(c, cx - 26, bot - 40);
  } else {
    doorAt(c, cx, bot, 46, 52, tower ? '#2a3b4a' : shade(b.roof, 0.05), { glass: true, lit: night });
    if (!tower) { sconce(c, cx - 34, bot - 38); sconce(c, cx + 34, bot - 38); }
  }
  if (b.place) placeFacade(c, b);
  if (shop && open) { wWetGlow(c, b.x + 14 + (b.w / 2 - 40) / 2, bot + 4, 70, 44, 0, 0.18); wWetGlow(c, b.x + b.w / 2 + 28 + (b.w / 2 - 42) / 2, bot + 4, 70, 44, 0, 0.18); }
  else if (night && (b.place ? open : false)) wWetGlow(c, cx, bot + 4, 56, 46, 0, 0.16);
}
function drawBusStop(c, s) {
  const on = FX.nf > 0.05;
  wProp(c, 'bus' + (on ? 1 : 0) + season(), s, 56, 100, 112, 112, g => wPaintBus(g, on));
  if (on) { litRect(s.x + 9, s.y - 44, 17, 30); addLight(s.x, s.y + 2, 84, 46, 1, 0.75); addEmit(s.x + 17, s.y - 30, 24, 1, 0.3); }
}

/* ============================ street furniture and park dressing ============================ */
function planter(c, x, y, seed) {
  const se = season(), sd = Math.abs(seed | 0) % 16;
  wProp(c, 'pl' + sd + se, { x, y }, 20, 40, 40, 46, g => wPaintPlanter(g, sd, se));
}
const PROP_DRAW = {
  hydrant(c, p) { wProp(c, 'hy' + (p.v % 5 === 0 ? 1 : 0), p, 14, 22, 28, 26, g => wPaintHydrant(g, p.v)); },
  bin(c, p) { wProp(c, 'bn' + (p.v % 2), p, 14, 24, 28, 28, g => wPaintBin(g, p.v)); },
  planter(c, p) { planter(c, p.x, p.y, p.v); },
  mailbox(c, p) { wProp(c, 'mb', p, 18, 28, 36, 32, g => wPaintMailbox(g, p.v)); },
  aframe(c, p) { wProp(c, 'af', p, 16, 28, 32, 32, g => wPaintAframe(g, p.v)); },
  rack(c, p) { wProp(c, 'rk' + (p.v % 2), p, 26, 30, 52, 36, g => wPaintRack(g, p.v)); },
  news(c, p) { wProp(c, 'nw' + (p.v % 2), p, 14, 26, 28, 30, g => wPaintNews(g, p.v)); },
  bush(c, p) { const r = 9 + (p.v % 5), se = season(); wProp(c, 'bs' + r + '_' + (p.v % 6) + se, p, r * 2 + 6, r * 2.2 + 8, r * 4 + 12, r * 2.6 + 12, g => wPaintBush(g, r, p.v % 6, se)); },
  rock(c, p) { const se = season(); wProp(c, 'ro' + (p.v % 4) + se, p, 16, 22, 32, 26, g => wPaintRock(g, p.v % 4, se)); },
  gate(c, p) {
    wProp(c, 'gt', p, 60, 112, 120, 120, g => wPaintGate(g));
    if (FX.nf > 0.05) [-40, 40].forEach(dx => { litRect(p.x + dx - 5, p.y - 72, 10, 10); addLight(p.x + dx, p.y + 2, 90, 52, 0, 0.8); addEmit(p.x + dx, p.y - 67, 20, 0, 0.6); });
    // the lamp globes on top of each pier
    [-40, 40].forEach(dx => { c.fillStyle = FX.nf > 0.05 ? '#fff0c0' : '#e3e9ec'; c.beginPath(); c.arc(p.x + dx, p.y - 69, 4.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(p.x + dx - 1.4, p.y - 70.6, 1.4, 0, 7); c.fill(); c.strokeStyle = 'rgba(40,36,30,.5)'; c.lineWidth = 0.8; c.beginPath(); c.arc(p.x + dx, p.y - 69, 4.6, 0, 7); c.stroke(); });
  }
};
