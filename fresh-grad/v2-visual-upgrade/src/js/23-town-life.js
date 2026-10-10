/* ============================ town life: mood, perks, savings, books and errands ============================ */
const absMin = () => (S.day - 1) * 1440 + S.t;
const fxOn = k => !!(S.fx && S.fx[k] && S.fx[k] > absMin());
function giveFx(k, mins) { S.fx[k] = absMin() + mins; }
const doneToday = k => S.daily[k] === S.day;
const markToday = k => { S.daily[k] = S.day; };
function addMood(n) { S.mood = clamp(S.mood + n, 0, 100); if (n >= 3 && typeof burst === 'function') burst('heart', Math.min(7, Math.round(n / 2))); }
const toothOn = () => !!S.fx.tooth && !fxOn('pain');
const ridingBike = () => S.own.bike || S.fx.rent === S.day;

/* fills in everything the newer systems need, for new games and old saves alike */
function ensureLife(s) {
  if (s.mood == null) s.mood = 68;
  s.bank = Object.assign({ bal: 0, auto: false, earned: 0 }, s.bank || {});
  s.look = Object.assign({ shirt: '#ff7a59', pants: '#2c3e57', hair: '#2a1f18', style: 0 }, s.look || {});
  s.own = Object.assign({ rug: '#8a4a38', bikeCol: '#e76f51' }, s.own || {});
  s.books = s.books || {};
  s.skill = s.skill || 0;
  s.fx = s.fx || {};
  s.clean = s.clean || 0;
  if (s.dental == null) s.dental = s.day;
  s.stamps = s.stamps || {};
  s.daily = s.daily || {};
  s.stats = s.stats || {};
  return s;
}
function applyLook() {
  if (!S) return;
  PLAYER_LOOK.shirt = S.look.shirt; PLAYER_LOOK.pants = S.look.pants; PLAYER_LOOK.hair = S.look.hair; PLAYER_LOOK.style = S.look.style;
  if (INT.apartment) applyHome();
}

/* ---------- mood ---------- */
function lifeMinute(act) {
  let d;
  if (act === 'sleep') d = 0.4;
  else if (act === 'nap') d = 0.2;
  else if (act === 'work' || act === 'school') d = -1.2 * job().drain.energy;
  else d = -0.5;
  if (d < 0) {
    if (fxOn('smile')) d *= 0.7;
    if (hasPerk('sunny')) d *= 0.8;
    if (S.clean >= 5) d -= 0.4;
    if (toothOn()) d -= 1.5;
    if (S.hunger < 20 || S.thirst < 20) d -= 0.8;
    if (act === 'idle' && S.scene === 'town' && !S.own.umbrella && weatherAt(S.day, S.t).rain > 0.3) d -= 1;
  }
  S.mood = clamp(S.mood + d / 60, 0, 100);
  if (S.mood >= 75 && S.goals && S.goals.list.some(g => g.ev === 'moodcheck' && !g.done)) lifeEv('moodcheck');
}
/* extra multiplier on energy drain while awake */
function lifeDrain() {
  let m = 1;
  if (fxOn('vit')) m *= 0.85;
  if (S.mood < 25) m *= 1.12;
  if (toothOn()) m *= 1.08;
  if (hasPerk('owl') && (S.t >= 1200 || S.t < 300)) m *= 0.8;
  return m;
}
function sleepBoost(kind) {
  if (kind === 'sleep') return (S.own.mattress ? 1.3 : 1) * (S.fx.sleepaid ? 1.2 : 1) * (hasPerk('sleeper') ? 1.15 : 1);
  return (S.own.curtains ? 1.25 : 1) * (hasPerk('napper') ? 1.3 : 1);
}
/* things that change how much a work minute pays */
function lifePay() {
  let m = 1;
  if (S.mood >= 75) m *= 1.05; else if (S.mood < 25) m *= 0.92;
  if (S.clean >= 5) m *= 0.95;
  if (fxOn('sharp')) m *= 1.03;
  if (hasPerk('early') && G.skip && G.skip.shift === 'am') m *= 1.1;
  return m;
}
function payNote() {
  const parts = [];
  if (S.energy < 20) parts.push('exhausted −30%'); else if (S.energy < 35) parts.push('drowsy −15%');
  if (S.mood >= 75) parts.push('upbeat mood +5%'); else if (S.mood < 25) parts.push('gloomy mood −8%');
  if (S.clean >= 5) parts.push('wrinkled clothes −5%');
  if (fxOn('sharp')) parts.push('fresh haircut +3%');
  let s = '';
  if (S.skill) s += ' Your reading adds +' + (S.skill * 3) + '% to your hourly rate.';
  if (parts.length) s += ' Right now you earn ' + Math.round(payMult() * 100) + '% of that: ' + parts.join(', ') + '.';
  return s;
}
function moodWord(v) { return v >= 75 ? 'Upbeat' : v >= 50 ? 'Content' : v >= 25 ? 'Low' : 'Gloomy'; }

/* ---------- once a day, at midnight ---------- */
function lifeNewDay() {
  S.clean++;
  if (S.clean === 5) toast('You are out of clean clothes. Wrinkled shirts cost you 5% at work. The laundromat can fix that.', 'warn');
  // savings interest
  if (S.bank.bal > 0) {
    const i = Math.round(S.bank.bal * 0.0025 * (hasPerk('saver') ? 2 : 1) * 100) / 100;
    if (i > 0) { S.bank.bal = Math.round((S.bank.bal + i) * 100) / 100; S.bank.earned += i; }
  }
  // rent autopay on the due day
  const R = S.rent;
  if (S.bank.auto && !R.paid && S.day >= R.due) {
    const owed = RENT + (S.day > R.due ? LATE_FEE : 0);
    if (S.bank.bal + S.money + 1e-9 >= owed) {
      const fromBank = Math.min(S.bank.bal, owed);
      S.bank.bal = Math.round((S.bank.bal - fromBank) * 100) / 100;
      if (owed - fromBank > 0) spend(owed - fromBank); else S.stats.spent += owed;
      R.paid = true; R.late = 0;
      toast('Autopay sent ' + fmt(owed) + ' rent to Mrs. Reyes.', 'good');
    } else toast('Autopay failed: you need ' + fmt(owed) + ' between cash and savings.', 'bad');
  }
  if (S.own.plants) addMood(2);
  if (!S.fx.tooth && S.day - S.dental > 9 && Math.random() < 0.14) {
    S.fx.tooth = 1;
    setTimeout(() => toast('Ouch. A toothache. It will sour your mood until a dentist fixes it.', 'bad'), 900);
  }
}

/* ---------- the town passport ---------- */
const PASSPORT = ['apartment', 'work', 'grocery', 'diner', 'clinic', 'park', 'pharmacy', 'bank', 'books', 'bakery', 'hardware', 'cinema', 'salon', 'laundry', 'bikes', 'cafe', 'pizza', 'dentist'];
function stampPlace(id, quiet) {
  if (!S || !PASSPORT.includes(id) || S.stamps[id]) return 0;
  S.stamps[id] = S.day;
  const n = PASSPORT.filter(p => S.stamps[p]).length;
  if (n === PASSPORT.length) {
    addMood(15); S.stats.regular = S.day;
    setTimeout(() => toast('Passport complete! You have been everywhere in town. You are officially a regular. Mood +15.', 'good'), 500);
    SFX.chime('pay');
    return 0;
  }
  lifeEv('stamp');
  if (n > 1 && !quiet) setTimeout(() => toast('New passport stamp: ' + placeTitle(id) + ' (' + n + ' of ' + PASSPORT.length + ').', ''), 450);
  return n > 1 ? n : 0;
}
function placeTitle(id) {
  if (id === 'work') return job().employer;
  if (id === 'park') return 'Town Park';
  if (PLACES[id]) return PLACES[id].name;
  return { apartment: 'Maple Court', grocery: 'Corner Grocery', diner: "Dot's Diner", clinic: 'St. Anne Clinic' }[id] || id;
}

/* ---------- books ---------- */
const BOOKS = [
  { id: 'gen1', title: 'The First-Job Field Guide', price: 14, ch: 3, kind: 'career', blurb: 'Meetings, managers and money. Every new grad gets a copy eventually.' },
  { id: 'cs1', deg: 'cs', title: 'Debugging Like a Detective', price: 20, ch: 3, kind: 'career', blurb: 'Hunt bugs with clues, not guesses.' },
  { id: 'cs2', deg: 'cs', title: 'Clean Code Habits', price: 22, ch: 3, kind: 'career', blurb: 'Small habits that make code easy to change.' },
  { id: 'eng1', deg: 'eng', title: 'Tolerances and Truth', price: 22, ch: 3, kind: 'career', blurb: 'Why every part is a little bit wrong, and how to live with it.' },
  { id: 'eng2', deg: 'eng', title: 'Sketch, Model, Test', price: 20, ch: 3, kind: 'career', blurb: 'A design loop you can run before lunch.' },
  { id: 'nurse1', deg: 'nurse', title: 'The Calm Nurse', price: 20, ch: 3, kind: 'career', blurb: 'Triage, charting and staying steady on a long shift.' },
  { id: 'nurse2', deg: 'nurse', title: 'Charting Made Simple', price: 18, ch: 3, kind: 'career', blurb: 'Write it once, write it right.' },
  { id: 'biz1', deg: 'biz', title: 'The Honest Pitch', price: 20, ch: 3, kind: 'career', blurb: 'Close deals without the sleaze.' },
  { id: 'biz2', deg: 'biz', title: 'Spreadsheets for Humans', price: 18, ch: 3, kind: 'career', blurb: 'Numbers that tell a story.' },
  { id: 'edu1', deg: 'edu', title: 'Thirty Kids, One Plan', price: 18, ch: 3, kind: 'career', blurb: 'Lesson plans that survive contact with a real class.' },
  { id: 'edu2', deg: 'edu', title: 'The Quiet Signal', price: 16, ch: 3, kind: 'career', blurb: 'Classroom calm without raising your voice.' },
  { id: 'cook1', deg: 'cook', title: 'Mise en Place for Life', price: 18, ch: 3, kind: 'career', blurb: 'Everything in its place, in the kitchen and out of it.' },
  { id: 'cook2', deg: 'cook', title: 'Knife Skills, Fast and Safe', price: 20, ch: 3, kind: 'career', blurb: 'Faster prep with all ten fingers.' },
  { id: 'nov1', title: "The Lighthouse Keeper's Year", price: 9, ch: 2, kind: 'novel', blurb: 'A gentle novel about a lonely light and a stubborn gull.' },
  { id: 'nov2', title: 'Midnight at the Diner', price: 9, ch: 2, kind: 'novel', blurb: 'A cozy mystery. The pie is a clue.' },
  { id: 'nov3', title: 'A Map of Small Towns', price: 11, ch: 2, kind: 'novel', blurb: 'Postcards from a road trip that keeps getting longer.' },
  { id: 'nov4', title: 'The Last Train North', price: 10, ch: 2, kind: 'novel', blurb: 'A thriller you will finish in two sittings.' }
];
const bookById = id => BOOKS.find(b => b.id === id);
const shopBooks = () => BOOKS.filter(b => !b.deg || b.deg === S.degree);
const bookOwned = id => S.books[id] != null;
const bookDone = id => bookOwned(id) && S.books[id] >= bookById(id).ch;
function readItems(where) {
  const out = [];
  const bonus = where === 'chair' || where === 'cafe' ? 2 : where === 'books' || where === 'park' ? 1 : 0;
  BOOKS.forEach(b => {
    if (!bookOwned(b.id)) return;
    const done = bookDone(b.id), ch = S.books[b.id];
    if (done && b.kind === 'career') return;
    const mins = (b.kind === 'career' ? 60 : 45) * (hasPerk('bookworm') ? 0.5 : 1);
    out.push({
      t: done ? 'Reread ' + b.title : 'Read ' + b.title,
      d: done ? 'An old favorite. Mood +4.' : 'Chapter ' + (ch + 1) + ' of ' + b.ch + '. ' + (b.kind === 'career' ? 'Finish it for +3% pay for good.' : 'Mood +' + (7 + bonus) + '.'),
      tag: hoursStr(mins), off: S.energy < 8 ? 'You are too tired to read.' : '',
      go() {
        startSkip({ mins, secs: 8, act: 'idle', kind: 'read', title: b.title, sub: done ? 'Rereading' : 'Chapter ' + (ch + 1) + ' of ' + b.ch, scene: 'read', place: where,
          lines: b.kind === 'career' ? ['You underline a sentence twice.', 'A diagram finally makes sense.', 'You make a note to try this at work.'] : ['The story pulls you in.', 'You forget what time it is.', 'One more page. Then another.'],
          onEnd() {
            S.stats.chapters = (S.stats.chapters || 0) + 1; lifeEv('fun');
            if (done) { addMood(4 + bonus); toast('A comfortable reread. Mood +' + (4 + bonus) + '.', 'good'); return; }
            S.books[b.id]++;
            const fin = S.books[b.id] >= b.ch;
            if (b.kind === 'career') {
              addMood(1 + bonus);
              if (fin) { S.skill++; S.stats.booksDone = (S.stats.booksDone || 0) + 1; SFX.chime('pay'); toast('You finished ' + b.title + '. Your hourly rate is now +' + (S.skill * 3) + '% for good.', 'good'); }
              else toast('Chapter done. ' + (b.ch - S.books[b.id]) + ' to go.', 'good');
            } else {
              addMood(7 + bonus + (fin ? 5 : 0));
              if (fin) { S.stats.booksDone = (S.stats.booksDone || 0) + 1; toast('You finished ' + b.title + '. What an ending. Mood +' + (12 + bonus) + '.', 'good'); }
              else toast('A good chapter. Mood +' + (7 + bonus) + '.', 'good');
            }
          } });
      }
    });
  });
  return out;
}
function readSection(where) {
  const it = readItems(where);
  return it.length ? { h: 'Read a book', items: it } : null;
}

/* ---------- savings ---------- */
function bankDeposit(n) { n = Math.min(n, S.money); lifeEv('deposit', n); S.money = Math.round((S.money - n) * 100) / 100; S.bank.bal = Math.round((S.bank.bal + n) * 100) / 100; SFX.chime('pay'); toast('Deposited ' + fmt(n) + '. Savings: ' + fmt(S.bank.bal) + '.', 'good'); }
function bankWithdraw(n) { n = Math.min(n, S.bank.bal); S.bank.bal = Math.round((S.bank.bal - n) * 100) / 100; S.money = Math.round((S.money + n) * 100) / 100; SFX.chime('pay'); toast('Withdrew ' + fmt(n) + '. Savings: ' + fmt(S.bank.bal) + '.', 'good'); }

/* ---------- the player on a bike, with an umbrella in the rain ---------- */
function drawBike(c, x, y, col, face, ph) {
  const f = face || 1;
  c.fillStyle = 'rgba(6,10,22,.28)'; c.beginPath(); c.ellipse(x, y + 1, 17, 3.2, 0, 0, 7); c.fill();
  c.strokeStyle = '#1d2129'; c.lineWidth = 2;
  c.beginPath(); c.arc(x - 10, y - 6, 6.5, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 10, y - 6, 6.5, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(200,210,220,.5)'; c.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) { const a = ph + i * 2.09; [-10, 10].forEach(wx => { c.beginPath(); c.moveTo(x + wx - Math.cos(a) * 6, y - 6 - Math.sin(a) * 6); c.lineTo(x + wx + Math.cos(a) * 6, y - 6 + Math.sin(a) * 6); c.stroke(); }); }
  c.strokeStyle = col; c.lineWidth = 2.4; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - 10, y - 6); c.lineTo(x - 2, y - 6); c.lineTo(x + 5 * f, y - 15); c.lineTo(x - 5 * f, y - 15); c.lineTo(x - 2, y - 6);
  c.moveTo(x - 10, y - 6); c.lineTo(x - 5 * f, y - 15); c.moveTo(x + 10 * f, y - 6); c.lineTo(x + 7 * f, y - 18); c.stroke();
  c.lineJoin = 'miter';
  c.fillStyle = '#1d2129'; c.fillRect(x - 6 * f - 3, y - 17, 6, 2); c.fillRect(x + 5 * f, y - 19.5, 5 * f, 1.8);
  // pedals turn
  c.strokeStyle = '#3a414a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 2 - Math.cos(ph) * 3.5, y - 6 - Math.sin(ph) * 3.5); c.lineTo(x - 2 + Math.cos(ph) * 3.5, y - 6 + Math.sin(ph) * 3.5); c.stroke();
}
function drawUmbrella(c, x, y) {
  const top = y - 58;
  c.strokeStyle = '#2b2f36'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 6, top + 4); c.lineTo(x + 6, y - 22); c.stroke();
  c.fillStyle = 'rgba(6,10,22,.15)'; c.beginPath(); c.ellipse(x + 6, y + 2, 16, 4, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(x - 14, top, x + 26, top); g.addColorStop(0, '#2a6f97'); g.addColorStop(0.5, '#3d8fc0'); g.addColorStop(1, '#245d80');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, top + 8); c.quadraticCurveTo(x + 6, top - 12, x + 26, top + 8);
  for (let i = 3; i >= 0; i--) c.quadraticCurveTo(x - 14 + i * 10 + 5, top + 4, x - 14 + i * 10, top + 8);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x - 8, top + 4); c.quadraticCurveTo(x + 2, top - 6, x + 8, top - 4); c.lineTo(x + 2, top + 2); c.closePath(); c.fill();
}
function drawPlayerTown(c) {
  const ride = ridingBike() && !FX.demo, look = Object.assign({}, PLAYER_LOOK, { face: S.face, phase: G.phase || 0, moving: !!G.moving });
  if (ride) {
    G.pedal = (G.pedal || 0) + (G.moving ? 0.3 : 0);
    drawBike(c, S.px, S.py, S.own.bike ? S.own.bikeCol : '#9aa7ad', S.face, G.pedal);
    look.moving = false; look.me = false;
    c.save(); c.translate(0, -9); drawPerson(c, S.px, S.py, look); c.restore();
    c.strokeStyle = 'rgba(255,194,71,.8)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(S.px, S.py + 1, 19, 6, 0, 0, 7); c.stroke();
  } else drawPerson(c, S.px, S.py, look);
  if (S.own.umbrella && FX.A && FX.A.rain > 0.25) drawUmbrella(c, S.px, S.py - (ride ? 9 : 0));
}

