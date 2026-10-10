/* ============================ HUD ============================ */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function rentLine() {
  const R = S.rent;
  if (R.paid) return { t: 'Rent paid', c: '' };
  if (R.late > 0) return { t: 'Rent LATE ' + R.late + 'd', c: 'bad' };
  const n = R.due - S.day;
  const when = n <= 0 ? 'due today' : n === 1 ? 'due tomorrow' : 'due Sun, ' + n + ' days';
  return { t: 'Rent ' + fmt(RENT) + ' ' + when, c: n <= 2 ? 'warn' : '' };
}
let lastGoal = '', lastChips = '', hudMoney = 0, hudMoneyS = null;
function updateHud() {
  if (!S) return;
  const hud = $('#hud');
  const w = weekdayOf(S.day);
  $('#hDow').textContent = DOW[w];
  $('#hTime').textContent = clockStr(S.t);
  $('#hDay').textContent = 'Day ' + S.day;
  const h = S.t / 60;
  hud.dataset.tod = isNight(S.t) && !(h >= 5 && h < 6.5) ? 'night' : ((h >= 17.5 && h < 20) || (h >= 5 && h < 6.5)) ? 'dusk' : 'day';
  { const X = xpInto(), pb = $('#bPhone'); pb.querySelector('.lv').textContent = 'Lv ' + X.L; pb.style.setProperty('--xpp', Math.round(X.x / X.need * 100) + '%'); }
  hud.style.setProperty('--p', (S.t / 1440 * 100).toFixed(1) + '%');
  if (FX.A) $('#app').style.setProperty('--sky', rgbS(mix3(FX.A.bot, [150, 170, 255], FX.A.nf * 0.8)));
  if (hudMoneyS !== S) { hudMoneyS = S; hudMoney = S.money; }
  else if (Math.abs(S.money - hudMoney) > 0.004) {
    const dm = S.money - hudMoney; hudMoney = S.money;
    const fl = el('span', 'delta ' + (dm > 0 ? 'up' : 'down'), (dm > 0 ? '+' : '\u2212') + fmt(Math.abs(dm)));
    $('.money').appendChild(fl); setTimeout(() => fl.remove(), 1500);
  }
  ['hunger', 'thirst', 'energy', 'mood'].forEach(k => {
    const g = $('.gauge[data-k=' + k + ']');
    const v = Math.round(S[k]);
    g.querySelector('.bar span').style.width = v + '%';
    g.querySelector('.v').textContent = v;
    g.classList.toggle('low', v < 25);
  });
  const p = period(S.t);
  $$('.meals span').forEach(sp => {
    sp.classList.toggle('got', !!S.meals[sp.dataset.m]);
    sp.classList.toggle('now', sp.dataset.m === p);
  });
  $('#hMoney').textContent = fmt(S.money);
  const r = rentLine();
  const rs = $('#hRent'); rs.textContent = r.t; rs.className = r.c;
  const g = goalText();
  if (g !== lastGoal) { lastGoal = g; $('#goalText').textContent = g; }
  const chips = statusChips();
  const sig = chips.map(c => c.join(':')).join('|');
  if (sig !== lastChips) {
    lastChips = sig;
    const box = $('#chips'); box.innerHTML = '';
    chips.forEach(c => box.appendChild(el('i', c[1] === 2 ? 'good' : c[1] ? 'mild' : '', c[0])));
  }
}

/* ============================ panels ============================ */
let PANEL_ITEMS = [];
function openPanel(id) {
  G.inside = id;
  renderPanel();
  $('#panel').hidden = false;
}
function closePanel(full) {
  $('#panel').hidden = true;
  if (full) { G.inside = null; G.notice = null; G.talk = null; saveGame(); }
}
function openNotice(title, text) {
  G.notice = { band: '#7a2a2a', title, sub: '', note: text, bad: true, sections: [], cta: 'Continue' };
  G.inside = 'notice';
  G.keys = {};
  $('#prompt').hidden = true;
  renderPanel();
  $('#panel').hidden = false;
}
function closedSpec(id) {
  const names = { apartment: 'Apartment', work: job().employer, grocery: 'Corner Grocery', diner: "Dot's Diner", park: 'Park' };
  return { band: PLACES[id] ? PLACES[id].col : '#3a4a58', title: names[id] || placeTitle(id), sub: 'Closed', note: closedWhy(id) + (PLACES[id] ? ' ' + hoursText(id) : ''), sections: [] };
}
function renderPanel() {
  const id = G.inside;
  if (!id || !S) return;
  const spec = id === 'notice' ? G.notice : id.startsWith('sch:') ? schoolSpec(id.slice(4)) : id.startsWith('npc:') ? townTalkSpec(id.slice(4)) : id.startsWith('ispot:') ? intSpec(id.slice(6)) : id.startsWith('bus:') ? busSpec(+id.slice(4)) : (!isOpen(id) ? closedSpec(id) : BUILDERS[id]());
  PANEL_ITEMS = [];
  $('#pHead').style.setProperty('--band', spec.band);
  $('#pTitle').textContent = spec.title;
  $('#pSub').textContent = spec.sub || '';
  $('#pSub').hidden = !spec.sub;
  const body = $('#pBody'); body.innerHTML = '';
  if (spec.note) body.appendChild(el('div', 'note' + (spec.bad ? ' bad' : ''), spec.note));
  if (spec.stock) {
    const st = el('div', 'stock');
    spec.stock.forEach(s => st.appendChild(el('span', '', s)));
    body.appendChild(st);
  }
  (spec.sections || []).forEach(sec => {
    const box = el('div', 'sec');
    box.appendChild(el('h3', '', sec.h));
    sec.items.forEach(it => {
      const b = el('button', 'opt'); b.type = 'button';
      b.dataset.i = PANEL_ITEMS.length; PANEL_ITEMS.push(it);
      b.appendChild(el('b', '', it.t));
      b.appendChild(el('small', it.off ? 'why' : '', it.off || it.d || ''));
      if (it.tag) b.appendChild(el('span', 'tag', it.tag));
      if (it.off) b.disabled = true;
      box.appendChild(b);
    });
    body.appendChild(box);
  });
  const leave = el('button', 'btn ghost', spec.cta || 'Leave'); leave.type = 'button'; leave.dataset.leave = '1';
  body.appendChild(leave);
}
function afterAction() {
  if (G.collapse || S.over || G.skip) return;
  if (G.kick && !G.skip) { G.kick = false; checkInteriorHours(); updateHud(); return; }
  if (G.inside && G.inside !== 'notice' && !G.inside.includes(':') && !isOpen(G.inside)) {
    toast(placeName(G.inside) + ' just closed. You step back outside.', 'warn');
    closePanel(true);
    return;
  }
  renderPanel();
  updateHud();
}
function bindPanel() {
  $('#pBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.leave) { closePanel(true); return; }
    const it = PANEL_ITEMS[+b.dataset.i];
    if (!it || it.off) return;
    SFX.init();
    it.go();
    afterAction();
  });
  $('#pClose').addEventListener('click', () => closePanel(true));
  $('#panel').addEventListener('pointerdown', e => { if (e.target === $('#panel')) closePanel(true); });
}

/* ============================ building menus ============================ */
function minsUntil(target) { const m = (target - S.t + 1440) % 1440; return m === 0 ? 1440 : m; }
function stockChips() {
  return ['Breakfast x' + S.pantry.b, 'Lunch x' + S.pantry.l, 'Dinner x' + S.pantry.d, fmt(S.money)];
}
function buyDrink(name, cost, o) {
  return {
    t: name, d: o.d, tag: fmt(cost),
    off: drinkBlock(o.thirst || 0) && !o.energy ? drinkBlock(o.thirst) : (!canSpend(cost) ? 'You cannot afford that.' : ''),
    go() { spend(cost); applyIntake({ thirst: o.thirst, hunger: o.hunger, energy: o.energy, mins: o.mins || 5 }); SFX.chime('drink'); toast(name + '. ' + o.msg, 'good'); }
  };
}
function mealItem(key, name, cost, o) {
  const p = period(S.t);
  let off = '';
  if (p !== key) off = name + ' is served ' + PERIOD_RANGE[key] + '.';
  else if (eatBlock(1)) off = eatBlock(1);
  else if (cost > 0 && !canSpend(cost)) off = 'You cannot afford that.';
  return {
    t: name, d: o.d, tag: (cost > 0 ? fmt(cost) + ' · ' : 'free · ') + o.mins + ' min', off,
    go() { if (cost > 0) spend(cost); applyIntake({ hunger: o.hunger, thirst: o.thirst || 0, mins: o.mins, meal: true }); SFX.chime('eat'); toast(name + '. Hunger +' + o.hunger + '.', 'good'); }
  };
}

const BUILDERS = {
  apartment() {
    const R = S.rent, t = S.t, night = isNight(t);
    const owed = RENT + (R.late > 0 ? LATE_FEE : 0);
    const wakeDay = t >= 12 * 60 ? S.day + 1 : S.day;
    const ww = weekdayOf(wakeDay), weekendMorning = ww === 0 || ww === 6;
    const sleepItem = (label, target, d) => {
      const mins = minsUntil(target);
      return {
        t: label, d, tag: hoursStr(mins),
        off: night ? '' : 'You are not ready for bed yet. Nap, or wait until 8 PM.',
        go() {
          startSkip({ mins, secs: mins >= 180 ? 24 : 12, act: 'sleep', kind: 'sleep', title: 'Sleeping', sub: 'Waking at ' + clockStr(target), dream: makeDream('sleep', mins) });
        }
      };
    };
    const rest = [sleepItem('Go to bed until 6:00 AM', 360, 'Restores about 11 energy per hour slept.')];
    if (weekendMorning) rest.push(sleepItem('Sleep in until 9:00 AM', 540, 'Weekend lie-in. No shift tomorrow.'));
    rest.push({
      t: 'Take a nap', d: 'Two hours on the couch. Restores about 16 energy.', tag: '2h',
      off: S.energy >= 90 ? 'You are not tired.' : night ? 'It is night. Go to bed instead.' : '',
      go() { startSkip({ mins: 120, secs: 8, act: 'nap', kind: 'nap', title: 'Napping', sub: 'Two hours on the couch', dream: makeDream('nap', 120) }); }
    });
    const kitchen = [{
      t: 'Drink tap water', d: 'Free. Thirst +35.', tag: '5 min', off: drinkBlock(35),
      go() { applyIntake({ thirst: 35, mins: 5 }); SFX.chime('drink'); toast('Cold tap water. Thirst +35.', 'good'); }
    }];
    const p = period(t);
    [['b', 'Cook breakfast'], ['l', 'Cook lunch'], ['d', 'Cook dinner']].forEach(([k, label]) => {
      let off = '';
      if (p !== k) off = PERIOD_NAME[k] + ' is ' + PERIOD_RANGE[k] + '.';
      else if (S.pantry[k] <= 0) off = 'No servings left. Buy a ' + PERIOD_NAME[k].toLowerCase() + ' pack at the grocery store.';
      else off = eatBlock(1);
      kitchen.push({
        t: label, d: 'Uses 1 serving. You have ' + S.pantry[k] + '. Hunger +48.', tag: '30 min', off,
        go() { S.pantry[k]--; applyIntake({ hunger: 48, thirst: 4, mins: 30, meal: true }); SFX.chime('eat'); toast(PERIOD_NAME[k] + ' at home. Hunger +48.', 'good'); }
      });
    });
    let rentOff = '';
    if (R.paid) rentOff = 'Paid. Next rent is due Sunday, day ' + (R.due + 7) + '.';
    else if (S.day < R.due - 4) rentOff = 'Rent can be paid starting ' + DOW_LONG[weekdayOf(R.due - 4)] + ', day ' + (R.due - 4) + '.';
    else if (!canSpend(owed)) rentOff = 'You need ' + fmt(owed) + '.';
    const lease = [{
      t: 'Pay rent', d: R.paid ? 'You are square with the landlord.' : (R.late > 0 ? 'Includes a ' + fmt(LATE_FEE) + ' late fee.' : 'Due Sunday, day ' + R.due + '.'),
      tag: fmt(owed), off: rentOff,
      go() { spend(owed); if (owed > RENT) S.rentStreak = -1; R.paid = true; R.late = 0; addMood(3); SFX.chime('pay'); toast('Rent paid. ' + fmt(owed) + ' to the landlord.', 'good'); }
    }];
    let note = DOW_LONG[weekdayOf(S.day)] + ', ' + clockStr(t) + '. ';
    let bad = false;
    if (!R.paid && R.late > 0) { note = 'Your rent is ' + R.late + ' day' + (R.late > 1 ? 's' : '') + ' late. Pay by the end of ' + DOW_LONG[weekdayOf(R.due + EVICT_AFTER)] + ' or you are evicted.'; bad = true; }
    else if (night) note += 'Sleep gets you back to full energy. If you stay up, you start tomorrow tired.';
    else note += 'Your place: one couch, one bed, a working sink and a tiny kitchen.';
    if (S.lastDream && S.lastDream.title && S.lastDream.day === S.day && t < 12 * 60) note += ' You dreamed: ' + S.lastDream.title + (S.lastDream.good === false ? ' (a bad dream).' : S.lastDream.good ? ' (a good dream).' : '.');
    return {
      band: '#8a4a38', title: 'Maple Court, Apt 12', sub: 'Home', note, bad, stock: stockChips(),
      sections: [{ h: 'Rest', items: rest }, { h: 'Kitchen', items: kitchen }, { h: 'Lease', items: lease }]
    };
  },

  work() {
    const j = job(), t = S.t;
    const shifts = ['am', 'pm'].map(k => {
      const SH = SHIFTS[k];
      let off = '';
      if (S.shiftsDone[k]) off = 'You already worked this shift today.';
      else if (t > SH.end - 60) off = 'Too late to start this shift.';
      else if (t < SH.start - 30) off = 'Clock-in opens at ' + clockStr(SH.start - 30) + '.';
      const startAt = Math.max(t, SH.start), mins = SH.end - startAt;
      const est = Math.round((mins / 60) * curRate() * payMult() * 100) / 100;
      return {
        t: SH.name + ', ' + clockStr(SH.start).replace(':00', '') + ' to ' + clockStr(SH.end).replace(':00', ''),
        d: 'Play ' + JA.games[j.id].name + ' for up to +20%. About ' + fmt(est) + ' base pay. Hunger, thirst and energy keep draining.', tag: hoursStr(mins), off,
        go() {
          if (S.t < SH.start) advance(SH.start - S.t, 'idle');
          if (G.collapse || S.over) return;
          const left = SH.end - S.t;
          startSkip({ mins: left, secs: clamp(left / 60 * 11, 14, 48), act: 'work', kind: 'work', shift: k, title: SH.name, sub: j.job + ' at ' + j.employer, activity: j.id });
        }
      };
    });
    const brk = [{
      t: 'Water cooler', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30),
      go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Water cooler. Thirst +30.', 'good'); }
    }];
    const coffeeCost = j.freeCoffee ? 0 : 1.5;
    brk.push({
      t: 'Coffee', d: 'Energy +12.' + (j.freeCoffee ? ' Free in the office kitchen.' : ''), tag: (coffeeCost ? fmt(coffeeCost) : 'free') + ' · 5 min',
      off: coffeeCost && !canSpend(coffeeCost) ? 'You cannot afford that.' : '',
      go() { if (coffeeCost) spend(coffeeCost); applyIntake({ energy: 12, thirst: 4, mins: 5 }); SFX.chime('drink'); toast('Coffee. Energy +12.', 'good'); }
    });
    if (j.freeLunch || j.lunchCost) {
      const cost = j.freeLunch ? 0 : j.lunchCost;
      const item = mealItem('l', j.freeLunch ? 'Staff lunch' : 'Cafeteria lunch', cost, { hunger: 56, mins: 30, d: j.freeLunch ? 'The kitchen feeds you. Hunger +56.' : 'Hunger +56.' });
      brk.push(item);
    }
    const nextRaise = job().raiseEvery - (S.shifts % job().raiseEvery);
    let note = j.job + ' at ' + j.employer + '. You earn ' + fmt(Math.round(curRate() * 100) / 100) + ' an hour take-home. ' + nextRaise + ' full shift' + (nextRaise > 1 ? 's' : '') + ' until your next 5% raise.';
    note += payNote();
    return {
      band: j.roof, title: j.employer, sub: j.job, note,
      stock: ['Shifts worked ' + S.shifts, 'Earned ' + fmt(Math.round(S.stats.earned)), fmt(S.money)].concat(S.ja && S.ja[j.id] ? ['Best ' + JA.rank(S.ja[j.id].best) + ' ' + Math.round(S.ja[j.id].best * 100) + '%'] : []),
      sections: [{ h: 'Today\'s shifts', items: shifts }, { h: 'Break room', items: brk }]
    };
  },

  grocery() {
    const packs = [['b', 'Breakfast pack', 8, 'Oats, eggs and bread for 3 breakfasts.'], ['l', 'Lunch pack', 11, 'Sandwich fixings for 3 lunches.'], ['d', 'Dinner pack', 15, 'Pasta, veggies and sauce for 3 dinners.']].map(([k, name, cost, d]) => ({
      t: name, d: d + ' You have ' + S.pantry[k] + '.', tag: fmt(cost), off: canSpend(cost) ? '' : 'You cannot afford that.',
      go() { spend(cost); S.pantry[k] += 3 + (hasPerk('coupon') ? 1 : 0); SFX.chime('pay'); toast(name + ' added to your pantry.', 'good'); }
    }));
    const now = [
      { t: 'Snack bar', d: 'Eat it now. Hunger +14.', tag: fmt(2) + ' · 5 min', off: eatBlock(14) || (canSpend(2) ? '' : 'You cannot afford that.'),
        go() { spend(2); applyIntake({ hunger: 14, mins: 5 }); SFX.chime('eat'); toast('Snack bar. Hunger +14.', 'good'); } },
      buyDrink('Bottled water', 1.5, { thirst: 35, d: 'Thirst +35.', msg: 'Thirst +35.' }),
      buyDrink('Orange juice', 3, { thirst: 38, hunger: 6, d: 'Thirst +38, hunger +6.', msg: 'Thirst +38.' }),
      buyDrink('Soda', 2, { thirst: 22, energy: 4, d: 'Thirst +22, energy +4.', msg: 'Thirst +22.' }),
      buyDrink('Energy drink', 4, { thirst: 8, energy: 25, d: 'Energy +25, thirst +8.', msg: 'Energy +25.' })
    ];
    return {
      band: '#2f6b4c', title: 'Corner Grocery', sub: 'Open 7 AM to 10 PM',
      note: 'Packs go to your pantry and get cooked at home, which is the cheapest way to eat. Each pack is 3 servings.',
      stock: stockChips(), sections: [{ h: 'Pantry packs', items: packs }, { h: 'Right now', items: now }]
    };
  },

  diner() {
    const meals = [
      mealItem('b', 'Breakfast plate', 11, { hunger: 55, thirst: 5, mins: 40, d: 'Eggs, hash browns, toast. Hunger +55.' }),
      mealItem('l', 'Lunch special', 14, { hunger: 58, thirst: 5, mins: 40, d: 'Burger, fries and a pickle. Hunger +58.' }),
      mealItem('d', 'Dinner plate', 19, { hunger: 62, thirst: 5, mins: 45, d: 'Meatloaf, mash and gravy. Hunger +62.' })
    ];
    const other = [
      { t: 'Fries and pie', d: 'Hunger +20.', tag: fmt(5) + ' · 25 min', off: eatBlock(20) || (canSpend(5) ? '' : 'You cannot afford that.'),
        go() { spend(5); applyIntake({ hunger: 20, mins: 25 }); SFX.chime('eat'); toast('Fries and pie. Hunger +20.', 'good'); } },
      { t: 'Ice water', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30),
        go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Ice water. Thirst +30.', 'good'); } },
      buyDrink('Coffee', 3, { thirst: 8, energy: 12, mins: 15, d: 'Energy +12, thirst +8.', msg: 'Energy +12.' }),
      buyDrink('Milkshake', 5, { thirst: 25, hunger: 10, mins: 20, d: 'Thirst +25, hunger +10.', msg: 'Thirst +25.' })
    ];
    return {
      band: '#8f2d2d', title: "Dot's Diner", sub: 'Open 6 AM to 11 PM',
      note: 'Hot meals are served at set hours, so you can only order the plate that matches the time of day.',
      stock: [fmt(S.money), 'Now: ' + (period(S.t) ? PERIOD_NAME[period(S.t)] : 'Late night')],
      sections: [{ h: 'Meals', items: meals }, { h: 'Anytime', items: other }]
    };
  },

  park() {
    const items = [
      { t: 'Drink from the fountain', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30),
        go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Fountain water. Thirst +30.', 'good'); } },
      { t: 'Sit on a bench', d: 'Rest your legs and watch the ducks. Energy +4, mood +5.', tag: '30 min', off: S.energy >= 96 && S.mood >= 95 ? 'You are not tired.' : '',
        go() { applyIntake({ energy: 4, mins: 30 }); addMood(5); toast('A quiet half hour. Energy +4, mood +5.', 'good'); } }
    ];
    return {
      band: '#2f7d4f', title: 'Town Park', sub: 'Always open',
      note: isNight(S.t) ? 'The fountain glows in the dark. It is quiet out here.' : 'Ducks on the pond, kids on the grass, and a fountain that is safe to drink from.',
      sections: [{ h: 'The fountain', items }]
    };
  }
};
