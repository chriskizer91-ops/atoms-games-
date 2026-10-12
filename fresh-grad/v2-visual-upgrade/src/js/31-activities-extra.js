/* ============================ new things to do: fishing, deliveries, the market, concerts, friends ============================ */
const NEAR_VERB = { park: 'Visit ', pond: 'Fish at ', market: 'Shop at ', concert: 'Listen at ' };
const MARKET = { x: 1200, y: 1574 }, BANDSTAND = { x: 1790, y: 1528 };
DOORS.pond = { x: POND.x + 70, y: POND.y - POND.ry - 14 };
DOORS.market = { x: MARKET.x, y: MARKET.y };
DOORS.concert = { x: BANDSTAND.x, y: BANDSTAND.y + 46 };
ENTERABLE.push('pond', 'market', 'concert');
Object.assign(NEAR_NAME, { pond: 'the pond', market: 'the farmers market', concert: 'the bandstand' });
HOURS.pond = [0, 24]; HOURS.market = [8, 14]; CLOSED_DOW.market = [0, 1, 2, 3, 4, 5]; HOURS.concert = [18, 20]; CLOSED_DOW.concert = [1, 2, 3, 4, 5, 6];
Object.assign(PLACE_ICON, { pond: ['#2a6f97', 'fish'], market: ['#8ac926', 'basket'], concert: ['#c77dff', 'note'] });
const placeTitle0 = placeTitle;
placeTitle = function (id) { return { pond: 'Park pond', market: 'Farmers market', concert: 'Bandstand' }[id] || placeTitle0(id); };
// clear trees and add a solid footprint where the bandstand and market stalls stand
for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i]; if (Math.hypot(t.x - BANDSTAND.x, t.y - BANDSTAND.y) < 120 || (t.x > 1040 && t.x < 1360 && t.y > 1440 && t.y < 1560)) TREES.splice(i, 1); }
BOXES.push({ x: BANDSTAND.x - 64, y: BANDSTAND.y - 18, w: 128, h: 30 });

/* ---------- park structures: the bandstand and, on Saturdays, market stalls ---------- */
const marketOn = () => S && weekdayOf(S.day) === 6 && S.t >= 7.5 * 60 && S.t < 14.5 * 60;
const concertOn = () => S && weekdayOf(S.day) === 0 && S.t >= 17.75 * 60 && S.t < 20.25 * 60;
const STALLS = [[1080, '#e76f51', ['#e63946', '#f4a261', '#8ac926']], [1180, '#2a9d8f', ['#ffd166', '#f4a261', '#e9c46a']], [1300, '#c77dff', ['#ff7eb6', '#ffd166', '#ffffff']]];
function drawStall(c, x, y, col, goods, vendor) {
  c.fillStyle = 'rgba(8,12,24,.22)'; c.beginPath(); c.ellipse(x, y + 3, 48, 8, 0, 0, 7); c.fill();
  // crates under the table, with produce spilling over the top
  [[-30, '#a8774a'], [26, '#9a6a3f']].forEach((cr, ci) => {
    const cx = x + cr[0];
    c.fillStyle = cr[1]; c.fillRect(cx - 10, y - 11, 20, 12); c.fillStyle = 'rgba(0,0,0,.26)'; c.fillRect(cx - 10, y - 7, 20, 1.2); c.fillRect(cx - 10, y - 3, 20, 1.2); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(cx - 10, y - 11, 20, 1.4);
    for (let i = 0; i < 4; i++) { c.fillStyle = goods[(i + ci) % goods.length]; c.beginPath(); c.arc(cx - 7.5 + i * 5, y - 12.5 - (i % 2), 3.1, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(cx - 8.4 + i * 5, y - 13.6 - (i % 2), 0.9, 0, 7); c.fill(); }
  });
  // posts, with a lit edge
  c.fillStyle = '#5a3d27'; c.fillRect(x - 38, y - 52, 3.4, 54); c.fillRect(x + 35, y - 52, 3.4, 54);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - 38, y - 52, 1, 54); c.fillRect(x + 35, y - 52, 1, 54);
  if (vendor) drawPerson(c, x, y - 18, vendor);
  // the table: wood top, a cloth with a scalloped hem and soft folds
  c.fillStyle = '#8b6240'; c.fillRect(x - 40, y - 20, 80, 18); c.fillStyle = '#a8774a'; c.fillRect(x - 40, y - 22, 80, 5);
  c.fillStyle = '#f6f1e7'; c.fillRect(x - 40, y - 17, 80, 9);
  c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 1; i < 8; i++) c.fillRect(x - 40 + i * 10, y - 17, 1.4, 9);
  c.fillStyle = '#f6f1e7'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(x - 36 + i * 8, y - 8, 4, 0, Math.PI); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 40, y - 22, 80, 1);
  // goods: fruit with a highlight and a stem, and a jar or two
  for (let i = 0; i < 9; i++) {
    const gx = x - 33 + i * 8.2, gy = y - 25 - (i % 2) * 2;
    if (i % 4 === 3) { c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, gx - 3.2, gy - 5, 6.4, 8, 1.4); c.fill(); c.fillStyle = goods[i % goods.length]; c.fillRect(gx - 2.6, gy - 2, 5.2, 5); c.fillStyle = '#c9a24a'; c.fillRect(gx - 3.4, gy - 6, 6.8, 1.8); }
    else { c.fillStyle = goods[i % goods.length]; c.beginPath(); c.arc(gx, gy, 3.8, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.arc(gx + 0.8, gy + 1.2, 3, 0.2, 2.9); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(gx - 1.2, gy - 1.3, 1.1, 0, 7); c.fill(); c.strokeStyle = '#3a6a30'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(gx, gy - 3.6); c.lineTo(gx + 0.8, gy - 5.2); c.stroke(); }
  }
  // a little chalkboard price sign
  c.fillStyle = '#25382f'; rr(c, x + 25, y - 38, 14, 11, 1.6); c.fill(); c.strokeStyle = '#a06f3f'; c.lineWidth = 1; c.stroke(); c.strokeStyle = 'rgba(244,241,230,.8)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + 27, y - 35); c.lineTo(x + 35, y - 35); c.moveTo(x + 27, y - 31.5); c.lineTo(x + 33, y - 31.5); c.stroke();
  // striped canopy: scallops, a shaded underside and a row of bunting
  const n = 6, w = 92, sw = w / n;
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#f6f1e7' : col; c.beginPath(); c.moveTo(x - w / 2 + i * sw, y - 66); c.lineTo(x - w / 2 + (i + 1) * sw, y - 66); c.lineTo(x - w / 2 + (i + 1) * sw, y - 52); c.arc(x - w / 2 + (i + 0.5) * sw, y - 52, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x - w / 2 + (i + 0.5) * sw, y - 52, sw / 2, 0, Math.PI); c.lineTo(x - w / 2 + (i + 0.5) * sw, y - 52); c.fill(); }
  c.fillStyle = shade(col, -0.2); c.beginPath(); c.moveTo(x - w / 2, y - 66); c.lineTo(x, y - 80); c.lineTo(x + w / 2, y - 66); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x - w / 2, y - 66); c.lineTo(x, y - 80); c.lineTo(x - w * 0.15, y - 66); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - w / 2, y - 66, w, 2);
  c.fillStyle = 'rgba(8,12,24,.2)'; c.fillRect(x - w / 2 + 4, y - 50, w - 8, 5);
  for (let i = 0; i < 9; i++) { c.fillStyle = goods[i % goods.length]; c.beginPath(); c.moveTo(x - 40 + i * 10, y - 47); c.lineTo(x - 36 + i * 10, y - 47); c.lineTo(x - 38 + i * 10, y - 42); c.closePath(); c.fill(); }
  if (FX.nf > 0.05) addLight(x, y + 4, 80, 40, 5, 0.4);
}
function drawBandstand(c) {
  const x = BANDSTAND.x, y = BANDSTAND.y;
  c.fillStyle = 'rgba(8,12,24,.22)'; c.beginPath(); c.ellipse(x, y + 8, 78, 16, 0, 0, 7); c.fill();
  // stone steps at the front, then the round deck with boards and a lit rim
  c.fillStyle = '#b4ad9d'; c.beginPath(); c.ellipse(x, y + 17, 52, 11, 0, 0, Math.PI); c.fill(); c.fillStyle = '#c9c2b4'; c.beginPath(); c.ellipse(x, y + 14, 52, 10, 0, 0, Math.PI); c.fill();
  c.fillStyle = '#c9c2b4'; c.beginPath(); c.ellipse(x, y, 70, 18, 0, 0, 7); c.fill();
  c.fillStyle = '#a69f8f'; c.fillRect(x - 70, y, 140, 10); c.beginPath(); c.ellipse(x, y + 10, 70, 18, 0, 0, Math.PI); c.fill();
  c.fillStyle = 'rgba(0,0,0,.14)'; for (let i = -3; i <= 3; i++) c.fillRect(x + i * 20 - 0.6, y + 1, 1.2, 9);
  c.fillStyle = '#e8e1d0'; c.beginPath(); c.ellipse(x, y, 66, 16, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(120,100,70,.28)'; c.lineWidth = 1; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(x + i * 14, y - 15.4 * Math.sqrt(Math.max(0, 1 - (i * 14 / 66) ** 2))); c.lineTo(x + i * 14, y + 15.4 * Math.sqrt(Math.max(0, 1 - (i * 14 / 66) ** 2))); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x, y - 1, 64, 14, 0, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (concertOn()) {
    [[-34, NPC_LOOK[3], 'guitar'], [0, NPC_LOOK[9], 'mic'], [34, NPC_LOOK[6], 'drum']].forEach(m => {
      const px = x + m[0], py = y + 4;
      drawPerson(c, px, py, Object.assign({}, m[1], { face: m[0] > 0 ? -1 : 1, moving: false, phase: 0 }));
      if (m[2] === 'guitar') { c.fillStyle = '#c47a3a'; c.beginPath(); c.ellipse(px + 2, py - 16, 6, 4.5, 0.4, 0, 7); c.fill(); c.strokeStyle = '#5a3b2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + 6, py - 18); c.lineTo(px + 16, py - 26); c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(px, py - 17.5, 2.6, 1.2, 0.4, 0, 7); c.fill(); }
      if (m[2] === 'drum') { c.fillStyle = '#e63946'; c.beginPath(); c.ellipse(px - 10, py - 10, 8, 4, 0, 0, 7); c.fill(); c.fillStyle = '#f6f1e7'; c.beginPath(); c.ellipse(px - 10, py - 12, 8, 3, 0, 0, 7); c.fill(); c.fillStyle = '#d9b34a'; c.beginPath(); c.ellipse(px + 14, py - 22, 6, 1.4, -0.1, 0, 7); c.fill(); }
      if (m[2] === 'mic') { c.strokeStyle = '#2b2f36'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px + 9, py); c.lineTo(px + 9, py - 30); c.stroke(); c.fillStyle = '#5a6672'; c.beginPath(); c.arc(px + 9, py - 31, 2.4, 0, 7); c.fill(); }
    });
    if (!REDUCED) { c.fillStyle = 'rgba(255,233,168,.9)'; c.font = '700 13px serif'; c.textAlign = 'center'; for (let i = 0; i < 4; i++) { const k = (FX.time * 0.3 + i / 4) % 1; c.globalAlpha = Math.sin(k * Math.PI); c.fillText(i % 2 ? '♪' : '♫', x - 40 + i * 26, y - 60 - k * 50); } c.globalAlpha = 1; }
  }
  // a low railing between the posts, then the posts themselves with a bevel and a plinth
  c.strokeStyle = '#e8e1d0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 62, y + 9); c.lineTo(x - 30, y + 14); c.moveTo(x + 30, y + 14); c.lineTo(x + 62, y + 9); c.stroke();
  c.fillStyle = '#d9d2c2'; for (let i = 0; i < 4; i++) { c.fillRect(x - 58 + i * 8, y + 4 + i * 1.2, 1.6, 6); c.fillRect(x + 36 + i * 8, y + 8.6 - i * 1.2, 1.6, 6); }
  c.fillStyle = '#f4efe4';
  [-60, -30, 30, 60].forEach(dx => { c.fillRect(x + dx - 2.5, y - 66, 5, 66); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + dx - 2.5, y - 66, 1.4, 66); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x + dx + 1.1, y - 66, 1.4, 66); c.fillStyle = '#d9d2c2'; c.fillRect(x + dx - 4, y - 3, 8, 4); c.fillStyle = '#f4efe4'; });
  // the roof: shingle rows, a trim and a gold finial
  c.fillStyle = '#2f7d4f'; c.beginPath(); c.moveTo(x - 76, y - 64); c.lineTo(x, y - 100); c.lineTo(x + 76, y - 64); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 1; for (let i = 1; i < 5; i++) { const ry = y - 64 - i * 7, hw = 76 * (1 - (i * 7) / 36); c.beginPath(); c.moveTo(x - hw, ry); c.lineTo(x + hw, ry); c.stroke(); }
  c.fillStyle = '#25663f'; c.fillRect(x - 76, y - 66, 152, 6); c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(x - 70, y - 66); c.lineTo(x, y - 97); c.lineTo(x - 20, y - 66); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x - 76, y - 60, 152, 2.4);
  c.fillStyle = '#d4a017'; c.beginPath(); c.arc(x, y - 102, 4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x - 1.2, y - 103.2, 1.2, 0, 7); c.fill();
  c.strokeStyle = '#d4a017'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 98); c.lineTo(x, y - 100); c.stroke();
  if (WINTER()) { c.fillStyle = '#f6fafd'; c.beginPath(); c.moveTo(x - 72, y - 66); c.lineTo(x, y - 98); c.lineTo(x + 72, y - 66); c.quadraticCurveTo(x, y - 80, x - 72, y - 66); c.fill(); }
  // bunting under the eave
  for (let i = 0; i < 12; i++) { c.fillStyle = ['#ffd166', '#ff7eb6', '#6fd1ff', '#ffffff'][i % 4]; const bx = x - 66 + i * 12; c.beginPath(); c.moveTo(bx, y - 58); c.lineTo(bx + 8, y - 58); c.lineTo(bx + 4, y - 51 + Math.sin(i) * 0.6); c.closePath(); c.fill(); }
  if (concertOn() && FX.nf > 0.05) { addLight(x, y + 10, 160, 70, 5, 0.9); for (let i = 0; i < 9; i++) addEmit(x - 72 + i * 18, y - 64, 8, i % 2 ? 4 : 5, 0.8); }
  if (concertOn()) { for (let i = 0; i < 9; i++) { c.fillStyle = ['#ffd166', '#ff7eb6', '#6fd1ff'][i % 3]; c.beginPath(); c.arc(x - 72 + i * 18, y - 62, 2.4, 0, 7); c.fill(); } }
}
const CROWD = [[-70, 70], [-40, 86], [0, 92], [44, 84], [76, 70], [-90, 96], [96, 96]];
function parkItems(items, inView, c) {
  if (inView(BANDSTAND.x - 100, BANDSTAND.y - 120, BANDSTAND.x + 100, BANDSTAND.y + 40)) items.push({ y: BANDSTAND.y + 10, f: () => drawBandstand(c) });
  if (concertOn()) CROWD.forEach((p, i) => { const x = BANDSTAND.x + p[0], y = BANDSTAND.y + p[1]; if (inView(x - 20, y - 60, x + 20, y + 5)) items.push({ y, f: () => drawPerson(c, x, y, Object.assign({}, NPC_LOOK[(i * 5) % NPC_LOOK.length], { back: true, moving: false, phase: 0, face: 1 })) }); });
  if (marketOn()) STALLS.forEach((s, i) => { const y = MARKET.y - 42; if (inView(s[0] - 60, y - 90, s[0] + 60, y + 10)) items.push({ y, f: () => drawStall(c, s[0], y, s[1], s[2], Object.assign({}, NPC_LOOK[(i * 3 + 2) % NPC_LOOK.length], { face: 1, moving: false, phase: 0 })) }); });
}

BUILDERS.market = function () {
  const se = season(), produce = { spring: 'strawberries and asparagus', summer: 'tomatoes and sweet corn', autumn: 'apples and squash', winter: 'potatoes and winter greens' }[se];
  const drink = se === 'winter' || se === 'autumn' ? ['Hot apple cider', { thirst: 24, mood: 4 }] : ['Fresh lemonade', { thirst: 32, mood: 3 }];
  const mk = (name, cost, o) => { const it = shopItem(name, cost, o); const g = it.go; it.go = function () { g(); lifeEv('market'); }; return it; };
  return {
    band: '#5a8f2a', title: 'Farmers market', sub: 'Central Park · Saturdays 8 AM to 2 PM',
    note: 'Local farms, honey, flowers and today\'s ' + produce + '.', stock: stockChips(),
    sections: [
      { h: 'For your pantry', items: [{ t: 'Farm box', d: 'Fresh ' + produce + '. Two breakfasts and two lunches for your pantry.', tag: fmt(12), off: canSpend(12) ? '' : 'You cannot afford that.', go() { spend(12); S.pantry.b += 2; S.pantry.l += 2; addMood(2); SFX.chime('pay'); lifeEv('market'); toast('A farm box for your pantry. Breakfast +2, lunch +2.', 'good'); } }] },
      { h: 'Treats', items: [mk(drink[0], 3, Object.assign({ mins: 5 }, drink[1])), mk('Jar of local honey', 6, { mood: 4, d: 'A spoonful for the road.' }), { t: 'Bouquet of flowers', d: 'For your apartment. Mood +2 every morning for three days.', tag: fmt(8), off: canSpend(8) ? '' : 'You cannot afford that.', go() { spend(8); S.fx.flowers = S.day + 3; addMood(3); SFX.chime('pay'); lifeEv('market'); toast('Fresh flowers for Apt 12.', 'good'); } }] }
    ]
  };
};
BUILDERS.concert = function () {
  return {
    band: '#6b3fa0', title: 'Sunset concert', sub: 'The bandstand · Sundays 6 to 8 PM',
    note: 'The town band plays old favorites while the sun goes down. Free for everyone.',
    sections: [{ h: 'Listen', items: [{ t: 'Find a spot on the grass', d: 'An hour of music. Mood +14.', tag: '1h', off: doneToday('concert') ? 'You already caught the concert tonight.' : '', go() {
      markToday('concert');
      startSkip({ mins: 60, secs: 8, act: 'idle', kind: 'concert', title: 'Sunset concert', sub: 'The bandstand', scene: 'music', singer: NPC_LOOK[9], lines: ['The band tunes up.', 'Couples dance on the grass.', 'Everyone sings the chorus.', 'Applause rolls across the park.'], onEnd() { addMood(14); lifeEv('fun'); toast('What a lovely evening. Mood +14.', 'good'); } });
    } }] }]
  };
};

/* ---------- fishing ---------- */
const FISH = [
  { id: 'bluegill', n: 'Bluegill', r: 1, val: 4, sz: [12, 20], col: '#4f8fc0' },
  { id: 'perch', n: 'Yellow perch', r: 1, val: 5, sz: [15, 25], col: '#d9b13a' },
  { id: 'carp', n: 'Carp', r: 2, val: 7, sz: [30, 60], col: '#b08a4a', ok: () => season() !== 'winter' },
  { id: 'catfish', n: 'Catfish', r: 2, val: 9, sz: [35, 70], col: '#6b6a60', ok: () => S.t >= 19 * 60 || S.t < 5 * 60 },
  { id: 'trout', n: 'Rainbow trout', r: 2, val: 10, sz: [25, 45], col: '#e88aa0', ok: () => S.t < 11 * 60 && ['spring', 'autumn'].includes(season()) },
  { id: 'sunfish', n: 'Pumpkinseed', r: 2, val: 8, sz: [10, 18], col: '#f08a3a', ok: () => season() === 'summer' },
  { id: 'pike', n: 'Northern pike', r: 3, val: 16, sz: [50, 90], col: '#5a8a4a', ok: () => ['autumn', 'winter'].includes(season()) },
  { id: 'koi', n: 'Golden koi', r: 3, val: 24, sz: [30, 55], col: '#ffb020', ok: () => S.t >= 6 * 60 && S.t < 19 * 60 },
  { id: 'icecod', n: 'Ice cod', r: 3, val: 18, sz: [25, 40], col: '#a9d6ea', ok: () => season() === 'winter' },
  { id: 'boot', n: 'Old boot', r: 0, val: 0, sz: [28, 30], col: '#5a3d27' },
  { id: 'moonfin', n: 'Moonfin', r: 4, val: 60, sz: [40, 70], col: '#c9b6ff', ok: () => (S.t >= 21 * 60 || S.t < 4 * 60) && weatherAt(S.day, S.t).cloud < 0.3 }
];
const RARITY = ['Junk', 'Common', 'Uncommon', 'Rare', 'Legendary'];
function rollFish(dist) {
  const pool = FISH.filter(f => !f.ok || f.ok());
  const w = pool.map(f => f.r === 0 ? 1.3 : f.r === 1 ? 10 : f.r === 2 ? 5 : f.r === 3 ? 1.4 * luck() * (0.8 + dist * 0.5) : 0.4 * luck() * (0.6 + dist * 0.8));
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { x -= w[i]; if (x <= 0) return pool[i]; }
  return pool[0];
}
BUILDERS.pond = function () {
  const n = Object.keys(S.fishLog).length, ice = WINTER();
  const items = [];
  if (S.own.rod) items.push({ t: ice ? 'Fish through the ice' : 'Cast a line', d: 'Tap to cast, tap when the bobber dips, then hold to reel. Each try takes about 15 minutes.', tag: '15 min', off: S.energy < 8 ? 'You are too tired to fish.' : '', go() { closePanel(true); startFishing(); } });
  items.push({ t: 'Sit by the water', d: 'Watch the ' + (ice ? 'skaters' : 'ducks') + ' for a while. Mood +3.', tag: '20 min', off: doneToday('pondsit') ? 'You have already watched them today.' : '', go() { markToday('pondsit'); applyIntake({ mins: 20 }); addMood(3); toast('A peaceful twenty minutes. Mood +3.', 'good'); } });
  const caught = FISH.filter(f => S.fishLog[f.id]).map(f => f.n + (S.fishLog[f.id].n > 1 ? ' x' + S.fishLog[f.id].n : ''));
  return {
    band: '#2a6f97', title: 'The park pond', sub: ice ? 'Frozen solid. Ice fishing allowed.' : 'Ducks, lily pads and fish',
    note: (S.own.rod ? '' : 'You need a fishing rod. Hank\'s Hardware sells them. ') + (n ? 'Fish journal (' + n + ' of ' + FISH.length + '): ' + caught.join(', ') + '.' : 'Different fish bite in different seasons and at different times of day. Some only come out at night.'),
    stock: [S.own.rod ? 'Rod ready' : 'No rod', 'Journal ' + n + '/' + FISH.length], sections: [{ h: 'At the water', items }]
  };
};

const FS = { on: false };
function startFishing() {
  G.menu = true; G.keys = {}; FS.on = true;
  Object.assign(FS, { phase: 'cast', t: 0, pow: 0, dist: 0.5, wait: 0, bite: 0, fish: null, zone: 0.3, zv: 0, fy: 0.5, fv: 0, ft: 0, prog: 0.35, hold: false, nib: 0, msg: '' });
  const ov = $('#fishing'); ov.hidden = false;
  $('#fishTitle').textContent = WINTER() ? 'Ice fishing' : 'Fishing';
  setFishMsg('Tap to cast');
  $('#fishResult').hidden = true;
  SFX.init();
}
function setFishMsg(m) { $('#fishMsg').textContent = m; }
function fishTap(down) {
  if (!FS.on) return;
  if (FS.phase === 'reel') { FS.hold = down; return; }
  if (!down) return;
  if (FS.phase === 'cast') {
    FS.dist = FS.pow; FS.phase = 'wait'; FS.t = 0;
    FS.wait = (2.2 + Math.random() * 4.2) * (hasPerk('angler') ? 0.6 : 1);
    applyIntake({ mins: 15 });
    SFX.splash(); setFishMsg('Wait for a bite...');
    if (G.collapse || S.over) { endFishing(); return; }
  } else if (FS.phase === 'wait') {
    FS.wait += 1.4; setFishMsg('Too soon! The fish got nervous.');
  } else if (FS.phase === 'bite') {
    FS.fish = rollFish(FS.dist);
    FS.phase = 'reel'; FS.t = 0; FS.prog = 0.35; FS.zone = 0.35; FS.zv = 0; FS.fy = 0.5;
    setFishMsg(FS.fish.r === 0 ? 'Something heavy...' : FS.fish.r >= 3 ? 'A big one! Hold to reel!' : 'Hooked! Hold to reel.');
  }
}
function stepFishing(dt) {
  if (!FS.on) return;
  FS.t += dt;
  if (FS.phase === 'cast') FS.pow = (Math.sin(FS.t * 2.6 - Math.PI / 2) + 1) / 2;
  else if (FS.phase === 'wait') {
    if (FS.t > FS.wait) { FS.phase = 'bite'; FS.t = 0; setFishMsg('Bite! Tap now!'); SFX.beep(880, 0.08, 'square', 0.04); }
    else if (Math.random() < dt * 0.5) FS.nib = 0.4;
  } else if (FS.phase === 'bite') {
    if (FS.t > 0.95) { FS.phase = 'cast'; FS.t = 0; setFishMsg('It got away. Tap to cast again.'); }
  } else if (FS.phase === 'reel') {
    const f = FS.fish, diff = [0.5, 0.6, 0.85, 1.15, 1.5][f.r] * (hasPerk('angler') ? 0.8 : 1);
    FS.ft -= dt;
    if (FS.ft <= 0) { FS.ftarget = 0.08 + Math.random() * 0.84; FS.ft = (0.5 + Math.random() * 1.1) / diff; }
    FS.fv += ((FS.ftarget - FS.fy) * 6 * diff - FS.fv * 3) * dt; FS.fy = clamp(FS.fy + FS.fv * dt, 0.03, 0.97);
    FS.zv += (FS.hold ? 2.6 : -2.2) * dt; FS.zv *= Math.pow(0.35, dt); FS.zone = clamp(FS.zone + FS.zv * dt, 0, 1);
    if (FS.zone <= 0 || FS.zone >= 1) FS.zv *= -0.3;
    const half = (hasPerk('angler') ? 0.15 : 0.12) * (f.r >= 3 ? 0.85 : 1), inside = Math.abs(FS.fy - FS.zone) < half;
    FS.prog = clamp(FS.prog + (inside ? 0.32 : -0.24 * diff) * dt, 0, 1);
    if (inside && Math.random() < dt * 12) SFX.reel();
    if (FS.prog >= 1) catchFish();
    else if (FS.prog <= 0) { FS.phase = 'cast'; FS.t = 0; setFishMsg('The line went slack. It got away. Tap to cast again.'); SFX.chime('bad'); }
  }
  drawFishing(dt);
}
function catchFish() {
  const f = FS.fish, size = Math.round(f.sz[0] + Math.random() * (f.sz[1] - f.sz[0]));
  FS.phase = 'done';
  const rec = S.fishLog[f.id] || (S.fishLog[f.id] = { n: 0, best: 0 });
  const isNew = !rec.n; rec.n++; rec.best = Math.max(rec.best, size);
  if (f.r > 0) { S.stats.fish = (S.stats.fish || 0) + 1; lifeEv('fish'); gainXP(5 + f.r * 8 + (isNew ? 10 : 0)); addMood(2 + f.r); }
  SFX.fanfare();
  const res = $('#fishResult'); res.hidden = false;
  const cv = $('#fishPic'), g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); res.dataset.r = f.r; drawFishPic(g, f, cv.width / 2, cv.height / 2, cv.width / 240 * 3.4);
  $('#fishName').textContent = f.n + (isNew ? ' · New!' : '');
  $('#fishInfo').textContent = f.r === 0 ? 'Well, it is a boot. Somebody lost it years ago.' : RARITY[f.r] + ' · ' + size + ' cm' + (size >= rec.best && rec.n > 1 ? ' · personal best' : '');
  $('#fishKeep').hidden = f.r === 0; $('#fishSell').hidden = f.r === 0;
  $('#fishSell').textContent = 'Sell for ' + fmt(f.val + Math.round(size / 10));
  FS.val = f.val + Math.round(size / 10);
  setFishMsg('');
  if (f.id === 'moonfin') confetti(200);
}
function fishChoice(k) {
  if (k === 'keep') { S.pantry.d += 1; toast('Fresh fish for dinner. Dinner +1 in your pantry.', 'good'); }
  else if (k === 'sell') { addM(FS.val); toast('Sold for ' + fmt(FS.val) + '.', 'good'); }
  $('#fishResult').hidden = true; FS.phase = 'cast'; FS.t = 0; setFishMsg('Tap to cast');
}
function endFishing() { FS.on = false; $('#fishing').hidden = true; G.menu = false; updateHud(); AK.dropLayers('fv|'); FD.fx.length = 0; FD.last = ''; }
function drawFishPic(c, f, x, y, s) { fishArt(c, f, x, y, s); agFishCard(c, f, x, y, s); }
function drawFishing(dt) { fishView(dt); }
function bindFishing() {
  const cv = $('#fishCv');
  cv.addEventListener('pointerdown', e => { e.preventDefault(); fishTap(true); });
  window.addEventListener('pointerup', () => fishTap(false));
  window.addEventListener('keydown', e => { if (!FS.on) return; if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) fishTap(true); } else if (e.code === 'Escape') { e.stopImmediatePropagation(); endFishing(); } }, true);
  window.addEventListener('keyup', e => { if (FS.on && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) fishTap(false); }, true);
  $('#fishLeave').addEventListener('click', endFishing);
  $('#fishKeep').addEventListener('click', () => fishChoice('keep'));
  $('#fishSell').addEventListener('click', () => fishChoice('sell'));
  $('#fishAgain').addEventListener('click', () => fishChoice('again'));
}

/* ---------- pizza deliveries for Sal ---------- */
const gigHours = () => isWorkday(S.day) ? [17, 21] : [11, 21];
const gigOpen = () => { const h = gigHours(), t = S.t / 60; return t >= h[0] && t < h[1]; };
const GIG_SPOTS = ['apartment', 'grocery', 'diner', 'clinic', 'pharmacy', 'bank', 'books', 'bakery', 'hardware', 'cinema', 'salon', 'laundry', 'bikes', 'cafe', 'dentist', 'work'];
const GIG_NAMES = ['the Hendersons', 'a hungry customer', 'the night shift', 'a birthday party', 'Mr. Bell', 'a study group', 'the staff room', 'Walt', 'a first date'];
function startGig() {
  const from = DOORS.pizza, opts = GIG_SPOTS.filter(id => Math.hypot(DOORS[id].x - from.x, DOORS[id].y - from.y) > 500);
  const to = opts[Math.floor(Math.random() * opts.length)], d = DOORS[to];
  const dist = Math.abs(d.x - from.x) + Math.abs(d.y - from.y);
  const speed = 140 * (ridingBike() ? 1.6 : 1) * (hasPerk('feet') ? 1.12 : 1);
  G.gig = { to, x: d.x, y: d.y, limit: Math.round(dist / speed * 1.6 + 12), t: 0, who: GIG_NAMES[Math.floor(Math.random() * GIG_NAMES.length)], hazard: weatherAt(S.day, S.t).rain > 0.2 || weatherAt(S.day, S.t).snow > 0.2 };
  G.inside = null; $('#panel').hidden = true;
  wipeTo(() => { leaveInterior(); });
  toast('Deliver a pie to ' + G.gig.who + ' at ' + placeTitle(to) + '. Go!', 'good');
  $('#gig').hidden = false;
}
function stepGig(dt) {
  if (!G.gig || !S) return;
  const g = G.gig;
  if (!G.menu && !G.skip && !WIPE.phase) g.t += dt;
  const left = g.limit - g.t;
  $('#gigTo').textContent = placeTitle(g.to);
  $('#gigTime').textContent = left >= 0 ? Math.ceil(left) + 's' : 'Late';
  $('#gig').classList.toggle('late', left < 0);
  $('#gigBar').style.width = clamp(left / g.limit, 0, 1) * 100 + '%';
  if (S.scene === 'town' && Math.hypot(S.px - g.x, S.py - g.y) < 54) finishGig();
  if (left < -60) { toast('The customer gave up. Sal is not thrilled.', 'warn'); G.gig = null; $('#gig').hidden = true; }
}
function finishGig() {
  const g = G.gig, left = g.limit - g.t;
  const base = left >= 0 ? 6 : 4, tip = left >= 0 ? Math.round((2 + 9 * left / g.limit) * (hasPerk('charm') ? 1.5 : 1)) : 0, haz = g.hazard ? 3 : 0;
  const pay = base + tip + haz;
  addM(pay); S.stats.deliveries = (S.stats.deliveries || 0) + 1;
  lifeEv('deliver'); gainXP(left >= 0 ? 18 : 8); addMood(left >= 0 ? 3 : 0);
  SFX.chime('pay');
  toast((left >= 0 ? 'Delivered with ' + Math.ceil(left) + 's to spare! ' : 'Delivered, a bit late. ') + fmt(base) + ' pay' + (tip ? ' + ' + fmt(tip) + ' tip' : '') + (haz ? ' + ' + fmt(haz) + ' bad-weather bonus' : '') + '. Head back to Sal\'s for another.', 'good');
  G.gig = null; $('#gig').hidden = true;
}
function drawGigMarker(c) {
  if (!G.gig || S.scene !== 'town') return;
  const g = G.gig, tm = REDUCED ? 0 : FX.time;
  // a beam of warm light over the drop-off, wider at the ground, with a soft pool and two rings that pulse outward
  const grd = c.createLinearGradient(0, g.y - 170, 0, g.y); grd.addColorStop(0, 'rgba(255,194,71,0)'); grd.addColorStop(1, 'rgba(255,194,71,.4)');
  c.fillStyle = grd; c.beginPath(); c.moveTo(g.x - 7, g.y - 170); c.lineTo(g.x + 7, g.y - 170); c.lineTo(g.x + 17, g.y); c.lineTo(g.x - 17, g.y); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,194,71,.18)'; c.beginPath(); c.ellipse(g.x, g.y, 30, 11, 0, 0, 7); c.fill();
  c.strokeStyle = '#ffc247'; c.lineWidth = 2.5; const pr = 24 + Math.sin(tm * 5) * 4; c.beginPath(); c.ellipse(g.x, g.y, pr, pr * 0.4, 0, 0, 7); c.stroke();
  const k2 = (tm * 0.8) % 1; c.strokeStyle = 'rgba(255,194,71,' + (0.5 * (1 - k2)).toFixed(3) + ')'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(g.x, g.y, 14 + k2 * 34, (14 + k2 * 34) * 0.4, 0, 0, 7); c.stroke();
  c.setLineDash([4, 6]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.lineDashOffset = -tm * 14; c.beginPath(); c.ellipse(g.x, g.y, 32, 12.8, 0, 0, 7); c.stroke(); c.setLineDash([]);
  // a floating pin with the pizza icon, bobbing, with its shadow on the ground
  const by = g.y - 90 + Math.sin(tm * 3) * 5;
  c.fillStyle = 'rgba(8,12,22,.3)'; c.beginPath(); c.ellipse(g.x, g.y + 2, 12 - Math.sin(tm * 3) * 2, 4, 0, 0, 7); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(g.x, by + 26); c.bezierCurveTo(g.x - 6, by + 16, g.x - 16, by + 8, g.x - 16, by - 2); c.arc(g.x, by - 2, 16, Math.PI, 0); c.bezierCurveTo(g.x + 16, by + 8, g.x + 6, by + 16, g.x, by + 26); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(230,57,70,.9)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(g.x - 6, by - 9, 4, 2, -0.6, 0, 7); c.fill();
  placeIcon(c, 'pizza', g.x, by - 2, 0.85, '#e63946');
  addEmit(g.x, g.y - 20, 40, 5, 0.6);
  if (!REDUCED) for (let i = 0; i < 6; i++) { const k = (tm * 0.5 + i / 6) % 1; c.fillStyle = 'rgba(255,230,150,' + (0.8 * Math.sin(k * Math.PI)).toFixed(3) + ')'; AK.star(c, g.x + Math.sin(i * 2.3) * 14, g.y - 10 - k * 90, 2 + (i % 3), 0.2); c.fill(); }
  // an arrow at the screen edge when the drop-off is out of view
  const vx0 = CAM.x, vy0 = CAM.y, vx1 = CAM.x + CAM.vw, vy1 = CAM.y + CAM.vh;
  if (g.x < vx0 || g.x > vx1 || g.y < vy0 || g.y > vy1) {
    const cx = (vx0 + vx1) / 2, cy = (vy0 + vy1) / 2, a = Math.atan2(g.y - cy, g.x - cx);
    const m = 28 / CAM.k, ax = clamp(cx + Math.cos(a) * CAM.vw, vx0 + m, vx1 - m), ay = clamp(cy + Math.sin(a) * CAM.vh, vy0 + m + 40 / CAM.k, vy1 - m);
    c.save(); c.translate(ax, ay); c.rotate(a); c.scale(1 / CAM.k * 1.4, 1 / CAM.k * 1.4);
    c.fillStyle = 'rgba(8,12,22,.7)'; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,194,71,.55)'; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = '#ffc247'; c.beginPath(); c.moveTo(12, 0); c.lineTo(-6, -9); c.lineTo(-2, 0); c.lineTo(-6, 9); c.closePath(); c.fill();
    c.restore();
  }
}
function drawPizzaBox(c, x, y) {
  c.fillStyle = 'rgba(8,12,22,.25)'; c.fillRect(x - 9, y - 21, 18, 2);
  c.fillStyle = '#b98c52'; c.fillRect(x - 9, y - 26, 18, 5); c.fillStyle = '#e8d2a6'; c.fillRect(x - 9, y - 28.5, 18, 3);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 9, y - 28.5, 18, 0.8); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 9, y - 22.4, 18, 1);
  c.fillStyle = '#c0392b'; c.fillRect(x - 3, y - 25.5, 6, 2); c.fillStyle = '#fff6e8'; c.fillRect(x - 1.4, y - 25.2, 2.8, 1.2);
}
const drawPlayerTown0 = drawPlayerTown;
drawPlayerTown = function (c) {
  drawPlayerTown0(c);
  if (G.gig) drawPizzaBox(c, S.px, S.py - (ridingBike() ? 9 : 0));
};

/* ---------- friends text you to hang out ---------- */
const HANG_PLACES = { weekday: [['cafe', 18, 21], ['pizza', 18, 21], ['diner', 18, 21], ['books', 17, 20]], weekend: [['park', 13, 17], ['cafe', 10, 14], ['bakery', 9, 12], ['pizza', 13, 18], ['cinema', 14, 18]] };
const INVITE_LINES = {
  cafe: ['Coffee at Cafe Luna? My treat-ish.', 'I need a latte and a friend. Cafe Luna?'],
  pizza: ['Pizza at Sal\'s? I am starving.', 'Sal says hi. Come split a pie with me.'],
  diner: ['Dot made fresh pie. You in?', 'Booth at Dot\'s, come keep me company.'],
  books: ['Browsing at Dog-Ear. Come help me pick something?', 'I found a book you would love. Dog-Ear?'],
  park: ['Nice day for the park. Meet me by the fountain?', 'Walk around the pond? Meet at the fountain.'],
  bakery: ['Cinnamon rolls at Rise & Shine. Now or never.', 'Bakery breakfast? I will save you a seat.'],
  cinema: ['Want to catch something at the Starlight?', 'Movie lobby, popcorn, gossip. Starlight?']
};
function inviteTick() {
  // runs once each morning
  for (const m of S.msgs) if (m.inv && m.inv.status === 'open' && (m.inv.day < S.day)) {
    m.inv.status = 'missed'; S.friends[m.inv.fid] = Math.max(0, (S.friends[m.inv.fid] || 0) - 1);
    addMsg(m.from, 'Hey, I waited for you yesterday. Maybe next time?');
  }
  if (S.msgs.some(m => m.inv && m.inv.status === 'open')) return;
  const pals = Object.keys(S.friends).filter(id => S.friends[id] >= 3 && folkById(id));
  if (!pals.length || Math.random() > 0.55) return;
  const fid = pals[Math.floor(Math.random() * pals.length)], f = folkById(fid);
  const opts = isWorkday(S.day) ? HANG_PLACES.weekday : HANG_PLACES.weekend, p = opts[Math.floor(Math.random() * opts.length)];
  if (p[0] !== 'park' && closedOn(p[0], S.day)) return;
  const lines = INVITE_LINES[p[0]];
  const inv = { fid, place: p[0], from: p[1] * 60, to: p[2] * 60, day: S.day, status: 'open' };
  addMsg(f.name, lines[Math.floor(Math.random() * lines.length)] + ' ' + clockStr(inv.from).replace(':00', '') + ' to ' + clockStr(inv.to).replace(':00', '') + '?', { fid, inv });
}
function hangCheck() {
  if (!S || G.skip || G.menu || G.inside || WIPE.phase) return;
  const m = S.msgs.find(x => x.inv && x.inv.status === 'open' && x.inv.day === S.day);
  if (!m || S.t < m.inv.from || S.t >= m.inv.to) return;
  const here = m.inv.place === 'park' ? (S.scene === 'town' && Math.hypot(S.px - FOUNTAIN.x, S.py - FOUNTAIN.y) < 230) : (S.scene === 'int' && S.intId === m.inv.place);
  if (!here) return;
  m.inv.status = 'done';
  const f = folkById(m.inv.fid);
  toast(f.name + ' waves you over.', 'good');
  startSkip({ mins: 60, secs: 9, act: 'idle', kind: 'hang', title: 'Hanging out with ' + f.name, sub: placeTitle(m.inv.place), scene: 'hang', place: m.inv.place, friend: folkLook(m.inv.fid),
    lines: [f.name + ' tells you about their week.', 'You both laugh way too loud.', 'You trade stories about work.', '"Same time next week?"'],
    onEnd() { S.friends[m.inv.fid] = (S.friends[m.inv.fid] || 0) + 2; S.stats.hangouts = (S.stats.hangouts || 0) + 1; addMood(16); lifeEv('fun'); gainXP(30); toast('A great time with ' + f.name + '. Mood +16, and you are closer friends now.', 'good'); } });
}
SCENES.hang = function (c, w, h, t, fr, o) { scHang(c, w, h, t, fr, o); };

/* Sal hires riders */
(function () {
  const sp = INT.pizza.spots.find(s => s.id === 'counter'), p0 = sp.panel;
  sp.panel = () => {
    const s = p0(), h = gigHours(), open = gigOpen();
    const sec = { h: 'Delivery shifts', items: [{
      t: G.gig ? 'You are already out on a delivery' : 'Take a delivery', d: 'Run a hot pie across town before the timer runs out. ' + fmt(6) + ' a run, plus a tip for speed. ' + (ridingBike() ? 'Your bike will help.' : 'A bike makes this much easier.'),
      tag: fmt(6) + ' + tip', off: G.gig ? 'Finish your current run first.' : !open ? 'Sal needs riders ' + (isWorkday(S.day) ? 'weekday evenings, 5 to 9 PM' : 'weekends, 11 AM to 9 PM') + '.' : S.energy < 12 ? 'You are too tired to run deliveries.' : '',
      go() { startGig(); } }] };
    if (open) s.sections.unshift(sec); else s.sections.push(sec);
    if (S.stats.deliveries) s.stock = (s.stock || []).concat(['Runs ' + S.stats.deliveries]);
    return s;
  };
})();
function hideNear(id) { return (id === 'market' && !marketOn()) || (id === 'concert' && !concertOn()); }

/* each morning: the day log rolls over, new goals, texts from friends */
const lifeNewDay1 = lifeNewDay;
lifeNewDay = function () {
  lifeNewDay1();
  rollLog();
  ensureGoals();
  if (S.fx.flowers && S.fx.flowers >= S.day) addMood(2);
  const se = seasonOf(S.day);
  if (se !== seasonOf(S.day - 1)) addMsg('Maple Town Bulletin', {
    spring: 'Spring is here! Blossoms in Central Park, and the pond is full of trout in the mornings.',
    summer: 'Summer! Long days, warm nights and pumpkinseed sunfish in the pond.',
    autumn: 'Autumn has arrived. The park trees are turning, and the pike are biting.',
    winter: 'Winter is here. The pond is frozen, so bring a rod for ice fishing. Bundle up!'
  }[se]);
  if (weekdayOf(S.day) === 6 && !S.rent.paid) addMsg('Mrs. Reyes', 'Friendly reminder, dear: rent is due tomorrow, Sunday. ' + fmt(RENT) + '.');
  if (weekdayOf(S.day) === 6) addMsg('Maple Town Bulletin', 'Farmers market in Central Park today, 8 AM to 2 PM. Fresh ' + { spring: 'strawberries', summer: 'tomatoes', autumn: 'apples', winter: 'potatoes' }[se] + '!');
  inviteTick();
  checkAch();
};
function welcomeTexts() {
  addMsg('Mrs. Reyes', 'Welcome to Maple Court, dear! Rent is ' + fmt(RENT) + ' every Sunday. Knock if you need anything.');
  addMsg(bossName(), 'Welcome aboard. Your first shift is Monday at 8 AM. Do good work and promotions come quickly here.');
}

function folkLook(fid) {
  const f = folkById(fid), n = npcById(fid), src = (f && f.look) || n || NPC_LOOK[0];
  return { shirt: src.shirt, pants: src.pants, hair: src.hair, skin: src.skin, style: src.style };
}

