/* ============================ progression: levels, perks, goals, promotions, trophies, the phone ============================ */
const ensureLife0 = ensureLife;
ensureLife = function (s) {
  ensureLife0(s);
  if (s.xp == null) s.xp = 0;
  if (s.lvl == null) s.lvl = 1;
  s.perks = s.perks || [];
  if (s.perkPicks == null) s.perkPicks = 0;
  s.ach = s.ach || {};
  if (s.promo == null) s.promo = 0;
  s.perfHist = s.perfHist || [];
  s.msgs = s.msgs || [];
  s.fishLog = s.fishLog || {};
  s.goals = s.goals || null;
  if (!s.log) s.log = newLog(s);
  return s;
};
const hasPerk = id => !!(S && S.perks && S.perks.includes(id));

/* ---------- experience ---------- */
const xpNeed = L => 100 + 50 * (L - 1);
function xpInto() { let L = 1, x = S.xp; while (x >= xpNeed(L)) { x -= xpNeed(L); L++; } return { L, x, need: xpNeed(L) }; }
function gainXP(n, why) {
  if (!S || n <= 0) return;
  S.xp += n; S.log.xp = (S.log.xp || 0) + n;
  burst('text', 0, { txt: '+' + n + ' XP', col: '#c9b6ff', y: S.py - 50 });
  const L = xpInto().L;
  if (L > S.lvl) {
    S.perkPicks += L - S.lvl; S.lvl = L;
    SFX.fanfare();
  }
  updatePhoneBadge();
}

/* ---------- perks: pick one each time you level up ---------- */
const PERKS = [
  { id: 'early', n: 'Early Bird', d: 'Morning shifts pay 10% more.', ic: 'sun' },
  { id: 'owl', n: 'Night Owl', d: 'After 8 PM, your energy drains 20% slower.', ic: 'moon' },
  { id: 'stomach', n: 'Iron Stomach', d: 'Hunger drains 12% slower.', ic: 'plate' },
  { id: 'camel', n: 'Camel', d: 'Thirst drains 12% slower.', ic: 'drop' },
  { id: 'social', n: 'Social Butterfly', d: 'Chatting lifts your mood twice as much.', ic: 'chat' },
  { id: 'coupon', n: 'Coupon Clipper', d: 'Food packs and loaves give an extra serving.', ic: 'basket' },
  { id: 'napper', n: 'Power Napper', d: 'Naps restore 30% more energy.', ic: 'zz' },
  { id: 'sleeper', n: 'Deep Sleeper', d: 'A night in bed restores 15% more energy.', ic: 'moon' },
  { id: 'bookworm', n: 'Bookworm', d: 'Reading a chapter takes half the time.', ic: 'book' },
  { id: 'feet', n: 'Quick Feet', d: 'Walk and ride 12% faster around town.', ic: 'bike' },
  { id: 'lucky', n: 'Lucky Streak', d: 'Better odds at the claw machine, the lost and found and the pond.', ic: 'star' },
  { id: 'workhorse', n: 'Workhorse', d: 'Great shifts pay up to +25% instead of +20%.', ic: 'brief' },
  { id: 'sunny', n: 'Sunny Disposition', d: 'Your mood drains 20% slower.', ic: 'sun' },
  { id: 'saver', n: 'Penny Saver', d: 'Your savings earn double interest.', ic: 'dollar' },
  { id: 'charm', n: 'Charmer', d: 'Delivery and open mic tips are 50% bigger.', ic: 'chat' },
  { id: 'angler', n: 'Angler', d: 'Fish bite sooner and are easier to reel in.', ic: 'fish' }
];
const perkById = id => PERKS.find(p => p.id === id);
function perkChoices() {
  const left = PERKS.filter(p => !S.perks.includes(p.id));
  if (left.length <= 2) return left;
  const seed = S.lvl * 31 + S.perks.length * 7;
  const a = Math.floor(hash01(seed, 1, 5) * left.length);
  let b = Math.floor(hash01(seed, 2, 9) * (left.length - 1)); if (b >= a) b++;
  return [left[a], left[b]];
}
const luck = () => hasPerk('lucky') ? 1.35 : 1;

/* ---------- life events feed goals, trophies and the day log ---------- */
function lifeEv(ev, data) {
  if (!S) return;
  ensureGoals();
  const G0 = S.goals;
  for (const g of G0.list) {
    if (g.done || g.ev !== ev) continue;
    const def = GOALS.find(x => x.id === g.id);
    if (def && def.ok && !def.ok(data)) continue;
    g.prog = Math.min(g.need, g.prog + (typeof data === 'number' ? data : 1));
    if (g.prog >= g.need) {
      g.done = true; S.stats.goalsDone = (S.stats.goalsDone || 0) + 1; S.log.goals = (S.log.goals || 0) + 1;
      toast('Daily goal done: ' + g.t + '. +' + g.xp + ' XP', 'good'); SFX.chime('pay');
      gainXP(g.xp);
      if (G0.list.every(x => x.done) && !G0.bonus) { G0.bonus = true; setTimeout(() => { toast('All three goals done today! Bonus +40 XP.', 'good'); gainXP(40); burst('spark', 14, { col: '#ffc247' }); }, 900); }
    }
  }
  if (ev === 'shift') {
    S.perfHist.push(Math.round(data.perf * 100) / 100); if (S.perfHist.length > 12) S.perfHist.shift();
    if (data.rank === 'S') S.stats.sRanks = (S.stats.sRanks || 0) + 1;
    S.log.best = Math.max(S.log.best || 0, data.perf);
    gainXP(Math.round(20 + 30 * data.perf));
    checkPromotion();
  }
  if (ev === 'lesson') { S.perfHist.push(Math.round(data.perf * 100) / 100); if (S.perfHist.length > 12) S.perfHist.shift(); S.log.best = Math.max(S.log.best || 0, data.perf); gainXP(Math.round(10 + 15 * data.perf)); }
  if (ev === 'fun') S.log.fun = (S.log.fun || 0) + 1;
  if (ev === 'stamp') gainXP(15);
  checkAch();
}
const GOALS = [
  { id: 'shift', t: 'Work a full shift', ev: 'shift', need: 1, xp: 30, when: () => isWorkday(S.day) && job().id !== 'edu' },
  { id: 'rankB', t: 'Earn a B rank or better at work', ev: 'shift', need: 1, xp: 40, ok: d => d.perf >= 0.62, when: () => isWorkday(S.day) && job().id !== 'edu' },
  { id: 'lesson', t: 'Teach two lessons', ev: 'lesson', need: 2, xp: 35, when: () => isWorkday(S.day) && job().id === 'edu' },
  { id: 'meals', t: 'Eat three meals', ev: 'meal', need: 3, xp: 30 },
  { id: 'chat', t: 'Chat with three people', ev: 'chat', need: 3, xp: 25 },
  { id: 'fun', t: 'Do something fun: a movie, a book, music or a show', ev: 'fun', need: 1, xp: 25 },
  { id: 'explore', t: 'Visit a place you have never been', ev: 'stamp', need: 1, xp: 30, when: () => PASSPORT.some(p => !S.stamps[p]) },
  { id: 'save', t: 'Put $50 or more into savings', ev: 'deposit', need: 50, xp: 25, when: () => S.money > 150 },
  { id: 'fish', t: 'Catch a fish at the park pond', ev: 'fish', need: 1, xp: 30, when: () => S.own.rod },
  { id: 'deliver', t: 'Finish two pizza deliveries', ev: 'deliver', need: 2, xp: 35, when: () => !isWorkday(S.day) },
  { id: 'mood', t: 'Get your mood above 75', ev: 'moodcheck', need: 1, xp: 25, when: () => S.mood < 70 },
  { id: 'walk', t: 'Walk 3,000 steps around town', ev: 'steps', need: 3000, xp: 20 },
  { id: 'treat', t: 'Treat yourself at the bakery or Cafe Luna', ev: 'treat', need: 1, xp: 20 },
  { id: 'market', t: 'Shop at the farmers market', ev: 'market', need: 1, xp: 30, when: () => weekdayOf(S.day) === 6 }
];
function ensureGoals() {
  if (S.goals && S.goals.day === S.day) return;
  const pool = GOALS.filter(g => !g.when || g.when());
  const pri = pool.filter(g => ['shift', 'lesson', 'market', 'deliver'].includes(g.id));
  const rest = pool.filter(g => !pri.includes(g));
  const pick = pri.slice(0, 1);
  let i = 0;
  while (pick.length < 3 && rest.length) { const k = Math.floor(hash01(S.day, i++, 17) * rest.length); pick.push(rest.splice(k, 1)[0]); }
  S.goals = { day: S.day, bonus: false, list: pick.map(g => ({ id: g.id, t: g.t, ev: g.ev, need: g.need, prog: 0, xp: g.xp, done: false })) };
}

/* ---------- promotions ---------- */
const TITLES = {
  cs: ['Software Developer', 'Senior Developer', 'Lead Developer', 'Principal Engineer'],
  eng: ['Design Engineer', 'Senior Engineer', 'Lead Engineer', 'Chief Engineer'],
  nurse: ['Registered Nurse', 'Charge Nurse', 'Nurse Manager', 'Director of Nursing'],
  biz: ['Account Manager', 'Senior Account Manager', 'Account Director', 'Partner'],
  edu: ['Third Grade Teacher', 'Lead Teacher', 'Assistant Principal', 'Principal'],
  cook: ['Line Cook', 'Sous Chef', 'Chef de Cuisine', 'Executive Chef']
};
const PROMO_AT = [8, 20, 36];
const titleNow = () => TITLES[S.degree][Math.min(3, S.promo)];
const promoAvg = () => { const h = S.perfHist.slice(-6); return h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0; };
function promoNote() {
  if (S.promo >= 3) return 'You hold the top title in your field.';
  const need = PROMO_AT[S.promo], left = Math.max(0, need - S.shifts);
  return (left ? left + ' more full shift' + (left > 1 ? 's' : '') + ' and ' : '') + 'an average of B (62%) or better over your last six shifts earns ' + TITLES[S.degree][S.promo + 1] + '. Your average: ' + Math.round(promoAvg() * 100) + '%.';
}
function checkPromotion() {
  if (S.promo >= 3 || S.shifts < PROMO_AT[S.promo]) return;
  if (S.perfHist.length < 3 || promoAvg() < 0.62) {
    if (S.promoWarn !== S.promo) { S.promoWarn = S.promo; setTimeout(() => toast('Promotion review: your manager wants to see more B ranks or better first.', 'warn'), 1200); }
    return;
  }
  S.promo++;
  S.queue = S.queue || []; S.queue.push({ k: 'promo', tier: S.promo });
  addMsg(bossName(), 'Congratulations. You are now ' + titleNow() + '. Your pay goes up 12% starting today. Well earned.');
}
function bossName() { return { cs: 'Dana Whitlock', eng: 'Mr. Keller', nurse: 'Head Nurse Rosalind', biz: 'Ms. Pike', edu: 'Principal Ortiz', cook: 'Chef Marisol' }[S.degree]; }

/* ---------- trophies ---------- */
const ACH = [
  ['pay1', 'First paycheck', 'Finish your first full shift.', () => S.shifts >= 1],
  ['srank', 'Flawless', 'Earn an S rank at work.', () => (S.stats.sRanks || 0) >= 1],
  ['s5', 'On a roll', 'Earn five S ranks.', () => (S.stats.sRanks || 0) >= 5],
  ['promo1', 'Moving up', 'Get your first promotion.', () => S.promo >= 1],
  ['promo3', 'Top of the field', 'Reach the highest title in your career.', () => S.promo >= 3],
  ['lvl5', 'Getting the hang of it', 'Reach level 5.', () => S.lvl >= 5],
  ['lvl10', 'Pillar of the community', 'Reach level 10.', () => S.lvl >= 10],
  ['week', 'One week down', 'Make it to day 8.', () => S.day >= 8],
  ['seasons', 'Four seasons', 'Make it to day 22 and see winter.', () => S.day >= 22],
  ['rent4', 'Model tenant', 'Pay rent on time four weeks running.', () => (S.rentStreak || 0) >= 4],
  ['save1k', 'Rainy day fund', 'Have $1,000 in savings.', () => S.bank.bal >= 1000],
  ['passport', 'Regular', 'Collect every passport stamp.', () => PASSPORT.every(p => S.stamps[p])],
  ['friends5', 'Popular', 'Become friends with five people.', () => Object.values(S.friends).filter(v => v >= 4).length >= 5],
  ['book3', 'Bookworm', 'Finish three books.', () => (S.stats.booksDone || 0) >= 3],
  ['films5', 'Cinephile', 'Watch five movies.', () => (S.stats.films || 0) >= 5],
  ['look', 'Fresh look', 'Get a haircut.', () => (S.stats.cuts || 0) >= 1],
  ['bike', 'Two wheels', 'Buy a bike.', () => !!S.own.bike],
  ['home', 'Home sweet home', 'Own every home upgrade from Hank\'s.', () => HOME_GOODS.every(g => S.own[g.k])],
  ['fish10', 'Angler', 'Catch ten fish.', () => (S.stats.fish || 0) >= 10],
  ['moonfin', 'Legend of the pond', 'Catch the Moonfin.', () => !!S.fishLog.moonfin],
  ['deliver10', 'Rush hour', 'Finish ten pizza deliveries.', () => (S.stats.deliveries || 0) >= 10],
  ['stage', 'Brave', 'Perform at the open mic.', () => (S.stats.gigs || 0) >= 1],
  ['goals10', 'Go-getter', 'Complete ten daily goals.', () => (S.stats.goalsDone || 0) >= 10],
  ['hang3', 'Good company', 'Hang out with friends three times.', () => (S.stats.hangouts || 0) >= 3]
];
function checkAch() {
  if (!S || !S.ach) return;
  for (const a of ACH) {
    if (S.ach[a[0]]) continue;
    let ok = false; try { ok = a[3](); } catch (e) { ok = false; }
    if (ok) {
      S.ach[a[0]] = S.day;
      setTimeout(() => { trophyToast(a[1], a[2]); SFX.fanfare(); }, 600);
      gainXP(40);
    }
  }
}
function trophyToast(name, desc) {
  const box = $('#toasts'); if (!box) return;
  const t = el('div', 'toast trophy');
  t.appendChild(el('b', '', 'Trophy unlocked: ' + name)); t.appendChild(el('span', '', desc));
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 4200); setTimeout(() => t.remove(), 4700);
}

/* ---------- messages on your phone ---------- */
function addMsg(from, text, extra) {
  if (!S) return;
  S.msgs.push(Object.assign({ id: (S.msgs.length ? S.msgs[S.msgs.length - 1].id + 1 : 1), from, text, day: S.day, t: S.t, read: false }, extra || {}));
  if (S.msgs.length > 40) S.msgs.splice(0, S.msgs.length - 40);
  updatePhoneBadge();
  if (G.mode === 'play' && !G.phone) toast('New text from ' + from + '.', '');
}
const unread = () => S && S.msgs ? S.msgs.filter(m => !m.read).length : 0;
function updatePhoneBadge() {
  const b = $('#bPhone'); if (!b || !S) return;
  const n = unread() + (S.perkPicks > 0 ? 1 : 0);
  b.dataset.n = n ? String(n) : '';
}

/* ---------- the day log and the morning recap ---------- */
function newLog(s) { return { day: s.day, e0: s.stats.earned || 0, s0: s.stats.spent || 0, m0: s.mood == null ? 68 : s.mood, xp: 0, goals: 0, best: 0, fun: 0 }; }
function rollLog() {
  const L = S.log;
  S.logPrev = Object.assign({}, L, { earned: Math.round(((S.stats.earned || 0) - L.e0) * 100) / 100, spent: Math.round(((S.stats.spent || 0) - L.s0) * 100) / 100, m1: S.mood, goalsOf: S.goals ? S.goals.list.length : 3 });
  S.log = newLog(S);
}
function forecast(day) {
  const W = weatherAt(day, 13 * 60), Wm = weatherAt(day, 7 * 60);
  if (W.snow > 0 || weatherAt(day, 17 * 60).snow > 0 || Wm.snow > 0) return ['Snow', 'snow'];
  if (W.storm > 0 || weatherAt(day, 17 * 60).storm > 0) return ['Thunderstorms', 'storm'];
  const anyRain = [7, 10, 13, 16, 19].some(h => weatherAt(day, h * 60).rain > 0.1);
  if (anyRain) return ['Rain showers', 'rain'];
  if (Wm.fog > 0.2) return ['Morning fog', 'fog'];
  if (W.cloud > 0.3) return ['Cloudy', 'cloud'];
  return ['Clear skies', 'sun'];
}
function showRecap() {
  const P = S.logPrev; if (!P || S.recapDay === S.day) return;
  S.recapDay = S.day;
  ensureGoals();
  const box = $('#recapBody'); box.innerHTML = '';
  $('#recapTitle').textContent = 'Good morning';
  $('#recapSub').textContent = DOW_LONG[weekdayOf(S.day)] + ', day ' + S.day + ' · ' + SEASON_NAME[season()];
  const fc = forecast(S.day);
  const fx = el('div', 'rc-fc'); fx.dataset.k = fc[1];
  const ic = document.createElement('canvas'); ic.width = 152; ic.height = 152; ic.setAttribute('aria-hidden', 'true'); drawWeatherIcon(ic.getContext('2d'), fc[1], 76, 76, 3.1); fx.appendChild(ic);
  const ft = el('div'); ft.appendChild(el('b', '', fc[0])); ft.appendChild(el('small', '', season() === 'winter' ? 'Bundle up. The pond is frozen.' : season() === 'autumn' ? 'Leaves everywhere. Perfect for a walk.' : season() === 'spring' ? 'Blossoms in the park.' : 'Warm and bright.'));
  fx.appendChild(ft); box.appendChild(fx);
  box.appendChild(el('h3', '', 'Yesterday'));
  const grid = el('div', 'rc-grid');
  const md = Math.round(P.m1 - P.m0);
  [['Earned', fmt(P.earned)], ['Spent', fmt(P.spent)], ['XP', '+' + (P.xp || 0)], ['Goals', (P.goals || 0) + ' of ' + (P.goalsOf || 3)], ['Mood', String(Math.round(P.m1)), md], ['Best shift', P.best ? JA.rank(P.best) : '–']].forEach(r => {
    const d = el('div'); d.appendChild(el('small', '', r[0])); const b = el('b', '', r[1]);
    if (r[2]) b.appendChild(el('em', r[2] > 0 ? 'up' : 'down', (r[2] > 0 ? '+' : '−') + Math.abs(r[2])));
    d.appendChild(b); grid.appendChild(d);
  });
  box.appendChild(grid);
  box.appendChild(el('h3', '', 'Today\'s goals'));
  const ul = el('ul', 'rc-goals');
  S.goals.list.forEach(g => { const li = el('li'); li.appendChild(el('span', '', g.t)); li.appendChild(el('b', '', '+' + g.xp + ' XP')); ul.appendChild(li); });
  box.appendChild(ul);
  const ev = todaysEvents(); if (ev.length) { box.appendChild(el('h3', '', 'Around town')); const u2 = el('ul', 'rc-ev'); ev.forEach(e => u2.appendChild(el('li', '', e))); box.appendChild(u2); }
  $('#recap').hidden = false; G.menu = true; G.keys = {};
}
function closeRecap() { $('#recap').hidden = true; G.menu = false; }
function todaysEvents() {
  const w = weekdayOf(S.day), out = [];
  if (w === 6) out.push('Farmers market in Central Park, 8 AM to 2 PM.');
  if (w === 0) out.push('Sunset concert by the fountain, 6 to 8 PM.');
  if (w === 5 || w === 6) out.push('Open mic at Cafe Luna, 7 to 9 PM.');
  if (w === 5) out.push('Pizza Friday: whole pies $11 at Sal\'s.');
  if (w === 2) out.push('Cheap Tuesday at the Starlight: every show $6.');
  if (!isWorkday(S.day)) out.push('Sal\'s needs delivery riders today, 11 AM to 9 PM.');
  const inv = (S.msgs || []).find(m => m.inv && m.inv.day === S.day && m.inv.status === 'open');
  if (inv) out.push(inv.from + ' wants to meet at ' + placeTitle(inv.inv.place) + ', ' + clockStr(inv.inv.from).replace(':00', '') + ' to ' + clockStr(inv.inv.to).replace(':00', '') + '.');
  return out;
}
function drawWeatherIcon(c, kind, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  const sunDisc = (ox, oy, r, glow) => {
    if (glow) { const gl = c.createRadialGradient(ox, oy, r * 0.5, ox, oy, r * 2.1); gl.addColorStop(0, 'rgba(255,214,100,.5)'); gl.addColorStop(1, 'rgba(255,214,100,0)'); c.fillStyle = gl; c.beginPath(); c.arc(ox, oy, r * 2.1, 0, 7); c.fill(); }
    c.strokeStyle = '#ffd34d'; c.lineWidth = 2.4;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(ox + Math.cos(a) * (r + 4), oy + Math.sin(a) * (r + 4)); c.lineTo(ox + Math.cos(a) * (r + 8), oy + Math.sin(a) * (r + 8)); c.stroke(); }
    const g = c.createRadialGradient(ox - r * 0.35, oy - r * 0.4, r * 0.1, ox, oy, r); g.addColorStop(0, '#fff6c4'); g.addColorStop(0.5, '#ffd34d'); g.addColorStop(1, '#ffa42a');
    c.fillStyle = g; c.beginPath(); c.arc(ox, oy, r, 0, 7); c.fill();
  };
  const cloud = (ox, oy, top, bot) => {
    const g = c.createLinearGradient(0, oy - 16, 0, oy + 9); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = 'rgba(8,14,30,.28)'; c.beginPath(); c.ellipse(ox + 2, oy + 12, 17, 3, 0, 0, 7); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(ox - 8, oy, 8, 0, 7); c.arc(ox + 2, oy - 5, 10, 0, 7); c.arc(ox + 11, oy + 1, 7, 0, 7); c.rect(ox - 8, oy, 19, 8); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.3; c.beginPath(); c.arc(ox + 2, oy - 5, 8.4, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  };
  if (kind === 'sun' || kind === 'fog') {
    sunDisc(0, -2, 10, true);
    if (kind === 'fog') { c.strokeStyle = 'rgba(220,230,242,.92)'; c.lineWidth = 3; [6, 12].forEach((yy, i) => { c.beginPath(); c.moveTo(-16 + i * 3, yy); c.lineTo(16 - i * 2, yy); c.stroke(); }); }
  } else {
    if (kind === 'cloud') sunDisc(8, -9, 7, true);
    const storm = kind === 'storm';
    cloud(0, -4, storm ? '#aab4c4' : '#fbfdff', storm ? '#5d6878' : '#c9d6e4');
    if (kind === 'rain' || storm) { c.strokeStyle = '#6fd1ff'; c.lineWidth = 2.2; [-8, 0, 8].forEach(xx => { c.beginPath(); c.moveTo(xx, 9); c.lineTo(xx - 3, 16); c.stroke(); }); }
    if (storm) { const g = c.createLinearGradient(0, 5, 0, 20); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#ffb52e'); c.fillStyle = g; c.beginPath(); c.moveTo(2, 5); c.lineTo(-4, 13); c.lineTo(0, 13); c.lineTo(-3, 20); c.lineTo(5, 10); c.lineTo(1, 10); c.closePath(); c.fill(); }
    if (kind === 'snow') { c.fillStyle = '#ffffff'; [-8, 0, 8, -4, 4].forEach((xx, i) => { c.beginPath(); c.arc(xx, 10 + (i > 2 ? 6 : 0), 2, 0, 7); c.fill(); }); c.strokeStyle = 'rgba(190,220,250,.8)'; c.lineWidth = 0.8; [-8, 0, 8].forEach(xx => { c.beginPath(); c.arc(xx, 10, 2.6, 0, 7); c.stroke(); }); }
  }
  c.restore();
}

/* ---------- big moments: level ups and promotions ---------- */
function canPopup() { return G.mode === 'play' && S && !S.over && !G.skip && !WIPE.phase && !G.collapse && $('#recap').hidden && $('#lvl').hidden && !G.phone && !G.menu && G.inside !== 'notice'; }
function popupTick() {
  if (!canPopup()) return;
  if (S.queue && S.queue.length) { const q = S.queue.shift(); if (q.k === 'promo') showPromo(q.tier); return; }
  if (S.perkPicks > 0) showLevelUp();
}
function showLevelUp() {
  const box = $('#lvlBody'); box.innerHTML = '';
  const ch = perkChoices();
  const lv = S.lvl - S.perkPicks + 1;
  $('#lvlKicker').textContent = 'Level up';
  $('#lvlNum').textContent = lv;
  $('#lvlTitle').textContent = ch.length ? 'Pick a perk' : 'You have every perk';
  $('#lvlSub').textContent = ch.length ? 'It stays with you for the rest of the game.' : 'Take a $50 bonus instead.';
  const row = el('div', 'perks');
  if (!ch.length) {
    const b = el('button', 'perk'); b.type = 'button'; { const cv0 = document.createElement('canvas'); cv0.width = 96; cv0.height = 96; perkIcon(cv0.getContext('2d'), 'dollar'); b.appendChild(cv0); } b.appendChild(el('b', '', '$50 bonus')); b.appendChild(el('span', '', 'Cash in your pocket.'));
    b.addEventListener('click', () => { addM(50); S.perkPicks--; closeLevelUp(); }); row.appendChild(b);
  }
  ch.forEach(p => {
    const b = el('button', 'perk'); b.type = 'button';
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; perkIcon(cv.getContext('2d'), p.ic); b.appendChild(cv);
    b.appendChild(el('b', '', p.n)); b.appendChild(el('span', '', p.d));
    b.addEventListener('click', () => { S.perks.push(p.id); S.perkPicks--; SFX.chime('pay'); toast('New perk: ' + p.n + '. ' + p.d, 'good'); closeLevelUp(); });
    row.appendChild(b);
  });
  box.appendChild(row);
  $('#lvl').dataset.kind = 'level'; $('#lvl').hidden = false; G.menu = true; G.keys = {};
  confetti(140);
}
function showPromo(tier) {
  const box = $('#lvlBody'); box.innerHTML = '';
  $('#lvlKicker').textContent = 'Promotion';
  $('#lvlNum').textContent = '★';
  $('#lvlTitle').textContent = TITLES[S.degree][tier];
  $('#lvlSub').textContent = job().employer + ' · your hourly pay goes up 12%.';
  const p = el('p', 'promo-note', 'Your hard work paid off. ' + bossName() + ' calls you into the office and shakes your hand. ' + (tier < 3 ? 'Next title: ' + TITLES[S.degree][tier + 1] + '.' : 'You have reached the top.'));
  box.appendChild(p);
  const b = el('button', 'btn'); b.type = 'button'; b.textContent = 'Celebrate'; b.addEventListener('click', closeLevelUp); box.appendChild(b);
  $('#lvl').dataset.kind = 'promo'; $('#lvl').hidden = false; G.menu = true; G.keys = {};
  gainXP(100); addMood(15); confetti(220); SFX.fanfare();
}
function closeLevelUp() { $('#lvl').hidden = true; G.menu = false; updatePhoneBadge(); updateHud(); }
function perkIcon(c, ic) {
  c.clearRect(0, 0, 96, 96);
  /* a collectible medallion: metallic rim, deep violet dish, soft glow behind the glyph, gloss */
  c.save(); c.shadowColor = 'rgba(183,156,255,.6)'; c.shadowBlur = 8;
  const rim = c.createLinearGradient(12, 6, 84, 90); rim.addColorStop(0, '#fff2c0'); rim.addColorStop(0.45, '#e9b24a'); rim.addColorStop(1, '#8f5a14');
  c.fillStyle = rim; c.beginPath(); c.arc(48, 48, 44, 0, 7); c.fill(); c.restore();
  const g = c.createRadialGradient(40, 30, 4, 48, 50, 40); g.addColorStop(0, '#6a58bd'); g.addColorStop(0.55, '#33296d'); g.addColorStop(1, '#171238');
  c.fillStyle = g; c.beginPath(); c.arc(48, 48, 38, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(48, 48, 38.5, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(255,240,190,.6)'; c.lineWidth = 1.4; c.beginPath(); c.arc(48, 48, 41.5, Math.PI * 0.95, Math.PI * 1.6); c.stroke();
  const gl = c.createRadialGradient(48, 48, 2, 48, 48, 30); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(48, 48, 30, 0, 7); c.fill();
  const map = { sun: 'sun', moon: 'moon', plate: 'plate', drop: 'drop', chat: 'chat', basket: 'basket', zz: 'zz', book: 'book', bike: 'bike', star: 'star', brief: 'brief', dollar: 'dollar', fish: 'fish' };
  const k = map[ic] || 'star';
  if (['plate', 'basket', 'book', 'bike', 'brief', 'dollar'].includes(k)) { c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 4; c.shadowOffsetY = 2; placeIcon(c, k, 48, 48, 2, '#fff'); c.restore(); }
  else {
    c.save(); c.translate(48, 48); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
    if (k === 'sun') { const sg = c.createRadialGradient(-4, -4, 2, 0, 0, 13); sg.addColorStop(0, '#fff6c4'); sg.addColorStop(1, '#ffb52e'); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 12, 0, 7); c.fill(); c.strokeStyle = '#ffd34d'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * 17, Math.sin(a) * 17); c.lineTo(Math.cos(a) * 23, Math.sin(a) * 23); c.stroke(); } }
    else if (k === 'moon') { c.fillStyle = '#e6ecff'; c.beginPath(); c.arc(0, 0, 18, 0.9, 5.4); c.arc(7, -4, 14, 5.0, 1.3, true); c.fill(); }
    else if (k === 'drop') { const dg = c.createLinearGradient(0, -20, 0, 18); dg.addColorStop(0, '#b6ebff'); dg.addColorStop(1, '#3aa6e8'); c.fillStyle = dg; c.beginPath(); c.moveTo(0, -20); c.quadraticCurveTo(16, 2, 0, 18); c.quadraticCurveTo(-16, 2, 0, -20); c.fill(); }
    else if (k === 'chat') { c.fillStyle = '#ff7eb6'; c.beginPath(); rr(c, -20, -16, 40, 26, 10); c.fill(); c.beginPath(); c.moveTo(-8, 8); c.lineTo(-14, 20); c.lineTo(2, 9); c.fill(); c.shadowColor = 'transparent'; c.fillStyle = 'rgba(255,255,255,.9)'; [-9, 0, 9].forEach(xx => { c.beginPath(); c.arc(xx, -3, 2.4, 0, 7); c.fill(); }); }
    else if (k === 'zz') { c.font = '800 26px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Zz', 0, 2); }
    else if (k === 'fish') { c.fillStyle = '#6fd1ff'; c.beginPath(); c.ellipse(-3, 0, 17, 9, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(12, 0); c.lineTo(22, -9); c.lineTo(22, 9); c.closePath(); c.fill(); c.shadowColor = 'transparent'; c.fillStyle = '#1b1636'; c.beginPath(); c.arc(-12, -2, 2.4, 0, 7); c.fill(); }
    else { const sg = c.createLinearGradient(0, -21, 0, 21); sg.addColorStop(0, '#fff3a0'); sg.addColorStop(1, '#ffb52e'); c.fillStyle = sg; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 21, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
    c.restore();
  }
  const gloss = c.createLinearGradient(0, 8, 0, 48); gloss.addColorStop(0, 'rgba(255,255,255,.3)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gloss; c.beginPath(); c.ellipse(48, 28, 26, 16, 0, 0, 7); c.fill();
}

/* ---------- the phone ---------- */
const PHONE = { tab: 'today' };
function openPhone(tab) {
  if (!S || G.mode !== 'play' || G.skip || G.menu) return;
  G.phone = true; G.menu = true; G.keys = {};
  if (tab) PHONE.tab = tab;
  renderPhone();
  $('#phone').hidden = false;
  SFX.chime('door');
}
function closePhone() { if (!G.phone) return; G.phone = false; G.menu = false; $('#phone').hidden = true; updatePhoneBadge(); }
function renderPhone() {
  $('#phTime').textContent = clockStr(S.t).replace(' ', ' ');
  $$('#phone .ph-tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === PHONE.tab); const n = b.dataset.tab === 'msgs' ? unread() : 0; b.dataset.n = n ? String(n) : ''; });
  const box = $('#phBody'); box.innerHTML = ''; box.scrollTop = 0;
  ({ today: phToday, map: phMap, msgs: phMsgs, career: phCareer, trophies: phTrophies })[PHONE.tab](box);
}
/* v2 presentation helpers shared by the phone and the menu: stamp art, map anchors, trophy glyphs */
const TROPHY_GLYPH = { pay1: 'brief', srank: 'star', s5: 'sparkle', promo1: 'up', promo3: 'trophy', lvl5: 'bolt', lvl10: 'heart', week: 'calendar', seasons: 'sun', rent4: 'key', save1k: 'dollar', passport: 'stamp', friends5: 'users', book3: 'book', films5: 'film', look: 'scissors', bike: 'bike', home: 'home', fish10: 'fish', moonfin: 'moon', deliver10: 'scooter', stage: 'mic', goals10: 'flag', hang3: 'chat' };
/* a passport stamp on a 96px canvas: scalloped double ring, dotted inner ring, the place icon, ink bleed and worn specks. rotated a little per place. unstamped = a pencil outline. */
function drawStampArt(c, id, got) {
  const P = PLACE_ICON[id] || ['#556', 'home'];
  c.clearRect(0, 0, 96, 96);
  c.save(); c.translate(48, 48);
  c.rotate((hash01(id.length * 7, id.charCodeAt(0), 11) - 0.5) * 0.6);
  if (!got) {
    c.strokeStyle = 'rgba(95,72,40,.42)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(0, 0, 38, 0, 7); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(95,72,40,.2)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 31, 0, 7); c.stroke();
    placeIcon(c, P[1], 0, 0, 1.7, 'rgba(95,72,40,.3)');
    c.restore(); return;
  }
  const ink = uiShade(P[0], 0.72);
  c.shadowColor = ink; c.shadowBlur = 3.2; c.strokeStyle = ink; c.fillStyle = ink;
  c.lineWidth = 3.2; c.beginPath(); c.arc(0, 0, 41, 0, 7); c.stroke();
  c.lineWidth = 1.3; c.beginPath(); c.arc(0, 0, 36.5, 0, 7); c.stroke();
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * 44, Math.sin(a) * 44, 1.5, 0, 7); c.fill(); }
  c.setLineDash([1.6, 3.6]); c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 29, 0, 7); c.stroke(); c.setLineDash([]);
  c.shadowBlur = 2; placeIcon(c, P[1], 0, -1, 2.1, ink);
  c.lineWidth = 2; c.beginPath(); c.moveTo(-17, 20); c.lineTo(17, 20); c.stroke();
  [[-26, 12], [26, 12]].forEach(p => { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 1.6 : 3.6, a = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); } c.closePath(); c.fill(); });
  /* worn ink: seeded specks erased from the stamp */
  c.shadowBlur = 0; c.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 46; k++) {
    const a = hash01(id.length, k, 5) * 6.283, r = Math.sqrt(hash01(id.charCodeAt(1) || 3, k, 9)) * 44;
    c.globalAlpha = 0.25 + hash01(k, id.length, 2) * 0.55; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, 0.6 + hash01(k, 4, id.length) * 1.5, 0, 7); c.fill();
  }
  c.restore();
}
function uiShade(hex, k) {
  const h = String(hex).replace('#', ''), f = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const n = [0, 2, 4].map(i => Math.round(parseInt(f.slice(i, i + 2), 16) * k));
  return 'rgb(' + n.join(',') + ')';
}
/* where a passport place sits on the world map */
function placeAnchor(id) {
  if (BLD[id]) return { x: BLD[id].x + BLD[id].w / 2, y: BLD[id].y + BLD[id].h / 2 };
  if (id === 'park') return { x: FOUNTAIN.x, y: FOUNTAIN.y };
  const b = PLACES[id] && PLACES[id].b; return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : { x: 0, y: 0 };
}
function phToday(box) {
  const X = xpInto();
  const hd = el('div', 'ph-level');
  const ring = el('div', 'ring'); ring.style.setProperty('--p', (X.x / X.need).toFixed(3)); ring.appendChild(el('b', '', String(X.L))); ring.appendChild(el('small', '', 'Level'));
  hd.appendChild(ring);
  const info = el('div');
  info.appendChild(el('b', '', titleNow()));
  info.appendChild(el('span', '', X.x + ' / ' + X.need + ' XP to level ' + (X.L + 1)));
  const fc = forecast(S.day);
  info.appendChild(el('span', 'muted', SEASON_NAME[season()] + ' · ' + fc[0] + ' · Mood ' + Math.round(S.mood)));
  hd.appendChild(info);
  { const wx = document.createElement('canvas'); wx.width = 92; wx.height = 92; wx.className = 'ph-wx'; wx.setAttribute('aria-hidden', 'true'); drawWeatherIcon(wx.getContext('2d'), fc[1], 46, 46, 2); hd.appendChild(wx); }
  box.appendChild(hd);
  if (S.perkPicks > 0) { const b = el('button', 'btn ph-cta', 'Choose your level ' + (S.lvl - S.perkPicks + 1) + ' perk'); b.type = 'button'; b.addEventListener('click', () => { closePhone(); showLevelUp(); }); box.appendChild(b); }
  ensureGoals();
  box.appendChild(el('h4', '', 'Today\'s goals'));
  S.goals.list.forEach(g => {
    const r = el('div', 'goal' + (g.done ? ' done' : ''));
    const top = el('div', 'gtop'); top.appendChild(el('i', 'chk')); top.appendChild(el('span', '', g.t)); top.appendChild(el('b', '', g.done ? 'Done' : '+' + g.xp + ' XP')); r.appendChild(top);
    const bar = el('div', 'gbar'); const sp = el('span'); sp.style.width = (100 * g.prog / g.need) + '%'; bar.appendChild(sp); r.appendChild(bar);
    if (g.need > 1 && !g.done) r.appendChild(el('small', '', (g.need >= 50 ? Math.round(g.prog).toLocaleString() + ' / ' + g.need.toLocaleString() : g.prog + ' of ' + g.need)));
    box.appendChild(r);
  });
  const ev = todaysEvents();
  if (ev.length) { box.appendChild(el('h4', '', 'Around town today')); const u = el('ul', 'ph-ev'); ev.forEach(e => u.appendChild(el('li', '', e))); box.appendChild(u); }
  if (S.perks.length) {
    box.appendChild(el('h4', '', 'Your perks')); const w = el('div', 'ph-perks');
    S.perks.forEach(id => { const p = perkById(id); const c2 = el('span'); const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; perkIcon(cv.getContext('2d'), p.ic); c2.appendChild(cv); c2.appendChild(document.createTextNode(p.n)); c2.title = p.d; w.appendChild(c2); });
    box.appendChild(w);
  }
}
function phMap(box) {
  box.appendChild(el('p', 'muted', 'Tap a place to walk there. Stamps: ' + PASSPORT.filter(p => S.stamps[p]).length + ' of ' + PASSPORT.length + '.'));
  /* the map: the cached world painting plus a pin per passport place (pins are real buttons, same action as the list below) */
  const card = el('div', 'ph-mapcard');
  const cv = document.createElement('canvas'); const mw = 672; cv.width = mw; cv.height = Math.round(mw * WORLD.h / WORLD.w); cv.setAttribute('aria-hidden', 'true');
  if (!MINI) buildMini();
  { const c = cv.getContext('2d'); c.drawImage(MINI, 0, 0, cv.width, cv.height); const k = cv.width / WORLD.w, g = c.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.3, cv.width / 2, cv.height / 2, cv.width * 0.62); g.addColorStop(0, 'rgba(6,10,22,0)'); g.addColorStop(1, 'rgba(6,10,22,.38)'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    if (FX.nf > 0.05) { c.fillStyle = 'rgba(10,16,50,' + (0.4 * FX.nf).toFixed(3) + ')'; c.fillRect(0, 0, cv.width, cv.height); }
    const px = S.px * k, py = S.py * k; c.fillStyle = 'rgba(255,122,89,.3)'; c.beginPath(); c.arc(px, py, 13, 0, 7); c.fill(); c.fillStyle = '#ff7a59'; c.beginPath(); c.arc(px, py, 7, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.stroke(); }
  card.appendChild(cv);
  PASSPORT.forEach(id => {
    const a = placeAnchor(id), P = PLACE_ICON[id] || ['#556', 'home'];
    const pin = el('button', 'ph-pin' + (S.stamps[id] ? ' got' : '')); pin.type = 'button'; pin.dataset.go = id; pin.dataset.name = placeTitle(id); pin.setAttribute('aria-label', 'Walk to ' + placeTitle(id));
    pin.style.left = (a.x / WORLD.w * 100).toFixed(2) + '%'; pin.style.top = (a.y / WORLD.h * 100).toFixed(2) + '%'; pin.style.setProperty('--pc', P[0]);
    pin.innerHTML = '<span class="pd"></span>' + uiIcon(P[1], '', 2.2).replace('<svg ', '<svg style="color:#fff" ');
    card.appendChild(pin);
  });
  box.appendChild(card);
  /* the passport: a navy cover and a paper page of stamps */
  const n = PASSPORT.filter(p => S.stamps[p]).length;
  const book = el('div', 'pp-book');
  const cover = el('div', 'pp-cover');
  const emb = el('span', 'pp-emb'); emb.innerHTML = uiIcon('stamp', '', 1.6); cover.appendChild(emb);
  const ct = el('div'); ct.style.flex = '1'; ct.appendChild(el('b', '', 'Town passport')); ct.appendChild(el('small', '', n + ' of ' + PASSPORT.length + ' stamps'));
  const pg = el('div', 'pp-prog'); const pgs = el('span'); pg.style.setProperty('--w', (100 * n / PASSPORT.length).toFixed(1) + '%'); pg.appendChild(pgs); ct.appendChild(pg); cover.appendChild(ct);
  book.appendChild(cover);
  const list = el('div', 'ph-places');
  PASSPORT.forEach(id => {
    const b = el('button', 'pl' + (S.stamps[id] ? ' got' : '')); b.type = 'button';
    const cv2 = document.createElement('canvas'); cv2.width = 96; cv2.height = 96; drawStampArt(cv2.getContext('2d'), id, !!S.stamps[id]);
    b.appendChild(cv2);
    const tx = el('div'); tx.appendChild(el('b', '', placeTitle(id)));
    const open = id === 'park' || id === 'apartment' || isOpen(id);
    tx.appendChild(el('small', open ? 'on' : '', open ? 'Open now' : (HOURS[id] ? hoursText(id).replace(/\.$/, '') : 'Closed')));
    b.appendChild(tx); b.dataset.go = id;
    list.appendChild(b);
  });
  book.appendChild(list);
  box.appendChild(book);
}
function phMsgs(box) {
  const ms = S.msgs.slice().reverse();
  if (!ms.length) { box.appendChild(el('p', 'muted', 'No messages yet. Make some friends around town.')); return; }
  ms.forEach(m => {
    const r = el('div', 'msg' + (m.read ? '' : ' new'));
    const av = el('span', 'av', m.from.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Nurse|Chef|Head Nurse|Principal)\s+/, '').charAt(0)); { const hu = Math.round(hash01(m.from.length, m.from.charCodeAt(0), 3) * 360); av.style.backgroundColor = 'hsl(' + hu + ',55%,45%)'; }
    r.appendChild(av);
    const tx = el('div'); const hd = el('div', 'mh'); hd.appendChild(el('b', '', m.from)); hd.appendChild(el('small', '', (m.day === S.day ? 'Today' : 'Day ' + m.day) + ' · ' + clockStr(m.t))); tx.appendChild(hd);
    const bub = el('div', 'bub'); bub.appendChild(el('p', '', m.text));
    if (m.inv) {
      const st = m.inv.status, past = m.inv.day < S.day || (m.inv.day === S.day && S.t >= m.inv.to);
      const tag = el('span', 'inv ' + st, st === 'done' ? 'You went. Great time.' : st === 'missed' || (st === 'open' && past) ? 'Missed' : 'Meet at ' + placeTitle(m.inv.place) + ', ' + clockStr(m.inv.from).replace(':00', '') + ' to ' + clockStr(m.inv.to).replace(':00', ''));
      bub.appendChild(tag);
      if (st === 'open' && !past) { const go = el('button', 'chip-btn', 'Walk there'); go.type = 'button'; go.dataset.go = m.inv.place; bub.appendChild(go); }
    }
    tx.appendChild(bub);
    r.appendChild(tx); box.appendChild(r);
    m.read = true;
  });
}
function phCareer(box) {
  const j = job();
  const hd = el('div', 'ph-career');
  hd.appendChild(el('small', '', j.employer));
  hd.appendChild(el('b', '', titleNow()));
  const steps = el('div', 'ladder');
  TITLES[S.degree].slice().map((t, i) => [t, i]).reverse().forEach(([t, i]) => { const s = el('div', 'rung' + (i <= S.promo ? ' on' : '') + (i === S.promo ? ' cur' : '')); s.appendChild(el('i', 'ck')); s.appendChild(el('span', '', t)); steps.appendChild(s); });
  hd.appendChild(steps);
  box.appendChild(hd);
  { const pn = el('div', 'promo-prog'); pn.appendChild(el('p', '', promoNote())); if (S.promo < 3) { const pb = el('div', 'pb'); const ps = el('span'); pb.style.setProperty('--w', (100 * clamp(S.shifts / PROMO_AT[S.promo], 0, 1)).toFixed(1) + '%'); pb.appendChild(ps); pn.appendChild(pb); } box.appendChild(pn); }
  const grid = el('div', 'ph-stats');
  [['Hourly rate', fmt(Math.round(curRate() * 100) / 100)], ['Shifts', S.shifts], ['S ranks', S.stats.sRanks || 0], ['Earned', fmt(Math.round(S.stats.earned))]].forEach(r => { const d = el('div'); d.appendChild(el('small', '', r[0])); d.appendChild(el('b', '', String(r[1]))); grid.appendChild(d); });
  box.appendChild(grid);
  if (S.perfHist.length) {
    box.appendChild(el('h4', '', 'Recent shifts'));
    const row = el('div', 'ranks');
    S.perfHist.slice(-10).forEach(p => { const rk = JA.rank(p); row.appendChild(el('span', 'r' + rk, rk)); });
    box.appendChild(row);
  }
}
function phTrophies(box) {
  const got = ACH.filter(a => S.ach[a[0]]).length;
  box.appendChild(el('p', 'muted', got + ' of ' + ACH.length + ' trophies'));
  const g = el('div', 'ph-troph');
  ACH.forEach(a => { const d = el('div', 'tr' + (S.ach[a[0]] ? ' got' : '')); const m = el('span', 'tmed'); m.innerHTML = uiIcon(TROPHY_GLYPH[a[0]] || 'trophy', '', 1.9); m.setAttribute('aria-hidden', 'true'); d.appendChild(m); d.appendChild(el('b', '', a[1])); d.appendChild(el('small', '', a[2])); g.appendChild(d); });
  box.appendChild(g);
}
function bindPhone() {
  $('#bPhone').addEventListener('click', () => { SFX.init(); if (G.phone) closePhone(); else openPhone(); });
  $('#phClose').addEventListener('click', closePhone);
  $('#phone').addEventListener('pointerdown', e => { if (e.target === $('#phone')) closePhone(); });
  $$('#phone .ph-tabs button').forEach(b => b.addEventListener('click', () => { PHONE.tab = b.dataset.tab; renderPhone(); }));
  $('#phBody').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { closePhone(); goToPlace(b.dataset.go); } });
  $('#recapGo').addEventListener('click', closeRecap);
  window.addEventListener('keydown', e => {
    if (G.mode !== 'play') return;
    if (e.code === 'KeyP' && !G.skip && (!G.menu || G.phone)) { e.preventDefault(); if (G.phone) closePhone(); else openPhone(); }
    else if (e.code === 'Escape' && G.phone) { e.stopImmediatePropagation(); closePhone(); }
    else if (e.code === 'Escape' && !$('#recap').hidden) { e.stopImmediatePropagation(); closeRecap(); }
  }, true);
}
/* the menu keeps a short summary; the phone has the rest */
renderLife = function () {
  const box = $('#mLife'); if (!box || !S) return;
  box.innerHTML = '';
  const X = xpInto();
  const rows = [['Level', X.L + ' · ' + X.x + '/' + X.need + ' XP', 'lv'], ['Title', titleNow(), 'ti'], ['Mood', Math.round(S.mood) + ' · ' + moodWord(S.mood), 'mo'], ['Savings', fmt(S.bank.bal), 'sv']];
  const st = el('div', 'life');
  rows.forEach(r => {
    const d = el('div', r[2]); d.appendChild(el('small', '', r[0])); d.appendChild(el('b', '', r[1]));
    if (r[2] === 'lv') { const bar = el('i', 'xpb'); const sp = el('span'); sp.style.width = (100 * X.x / X.need).toFixed(1) + '%'; bar.appendChild(sp); d.appendChild(bar); }
    st.appendChild(d);
  });
  box.appendChild(st);
  const own = el('p', 'own'); own.appendChild(document.createTextNode('Your goals, map, messages, career and trophies are on your phone. Press ')); own.appendChild(el('kbd', '', 'P')); own.appendChild(document.createTextNode(' or tap Phone.'));
  box.appendChild(own);
};
