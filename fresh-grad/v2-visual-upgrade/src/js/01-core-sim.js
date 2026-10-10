/* ============================ helpers ============================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = n => '$' + (Math.abs(n - Math.round(n)) > 0.004 ? n.toFixed(2) : String(Math.round(n)));
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function clockStr(t) {
  t = Math.floor(t);
  let h = Math.floor(t / 60), m = t % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ap;
}
function hoursStr(mins) {
  const h = mins / 60;
  return (Math.round(h * 10) / 10) + 'h';
}
function weekdayOf(day) { return (day - 1) % 7; } // day 1 is a Sunday
function isWorkday(day) { const w = weekdayOf(day); return w >= 1 && w <= 5; }
function isNight(t) { return t >= 20 * 60 || t < 6 * 60; }
function period(t) {
  const h = t / 60;
  if (h >= 5 && h < 11) return 'b';
  if (h >= 11 && h < 16) return 'l';
  if (h >= 16 && h < 23) return 'd';
  return null;
}
const PERIOD_NAME = { b: 'Breakfast', l: 'Lunch', d: 'Dinner' };
const PERIOD_RANGE = { b: '5 AM to 11 AM', l: '11 AM to 4 PM', d: '4 PM to 11 PM' };

/* ============================ constants ============================ */
const TIME_RATE = 1.5;        // game minutes per real second at 1x (one game hour = 40 real seconds)
const RENT = 450;
const LATE_FEE = 25;
const EVICT_AFTER = 3;        // days late before eviction
const SAVE_KEY = 'freshgrad.save.v1';
const SHIFTS = {
  am: { name: 'Morning shift', start: 8 * 60, end: 12 * 60 },
  pm: { name: 'Afternoon shift', start: 13 * 60, end: 17 * 60 }
};
const HOURS = { apartment: [0, 24], park: [0, 24], clinic: [0, 24], grocery: [7, 22], diner: [6, 23], work: [7, 18] };

/* Degrees decide the job. drain = how hard a work minute hits each need. */
const DEGREES = [
  { id: 'cs', field: 'Science in Computer Science', short: 'Computer Science', job: 'Software Developer', employer: 'Northgate Software', rate: 25,
    drain: { hunger: 0.9, thirst: 1.0, energy: 0.85 }, raiseEvery: 10, freeCoffee: true,
    pros: ['$25/hr take-home', 'Free coffee in the office kitchen', 'Desk job, so you tire slowly'], cons: [],
    wall: '#5f7fa8', roof: '#2f3f5a', accent: '#6fd1ff' },
  { id: 'eng', field: 'Science in Mechanical Engineering', short: 'Engineering', job: 'Design Engineer', employer: 'Keller Dynamics', rate: 26,
    drain: { hunger: 1.0, thirst: 1.0, energy: 1.1 }, raiseEvery: 10,
    pros: ['$26/hr, the best pay in town'], cons: ['Demanding projects wear you out faster'],
    wall: '#8a8f98', roof: '#444a55', accent: '#ffb347' },
  { id: 'nurse', field: 'Science in Nursing', short: 'Nursing', job: 'Registered Nurse', employer: 'Mercy General Hospital', rate: 24,
    drain: { hunger: 1.2, thirst: 1.15, energy: 1.35 }, raiseEvery: 10, lunchCost: 4,
    pros: ['$24/hr take-home', 'Cafeteria lunch for $4'], cons: ['On your feet all shift: hunger, thirst and fatigue hit hard'],
    wall: '#e8eef0', roof: '#c9444f', accent: '#ff6b7a' },
  { id: 'biz', field: 'Arts in Business Administration', short: 'Business', job: 'Account Manager', employer: 'Harlan & Pike', rate: 22,
    drain: { hunger: 1.0, thirst: 1.0, energy: 1.0 }, raiseEvery: 6,
    pros: ['$22/hr take-home', 'Raises come faster: +5% every 6 shifts'], cons: [],
    wall: '#9b7bb0', roof: '#4a3560', accent: '#e0b0ff' },
  { id: 'edu', field: 'Arts in Elementary Education', short: 'Education', job: 'Third Grade Teacher', employer: 'Lakeview Elementary', rate: 18,
    drain: { hunger: 0.85, thirst: 0.9, energy: 0.8 }, raiseEvery: 10, lunchCost: 3,
    pros: ['Work inside the school: teach classes, lead lunch duty and chat with coworkers', 'Gentle on your energy', 'Teacher lunch for $3'], cons: ['$18/hr is a tight budget'],
    wall: '#e3b04f', roof: '#9a3b2e', accent: '#fff1b0' },
  { id: 'cook', field: 'Arts in Culinary Arts', short: 'Culinary Arts', job: 'Line Cook', employer: 'The Copper Pan', rate: 16,
    drain: { hunger: 0.7, thirst: 1.2, energy: 1.1 }, raiseEvery: 10, freeLunch: true,
    pros: ['Free staff lunch every shift', 'Hunger drains slowly around food'], cons: ['$16/hr, the lowest pay', 'Hot kitchen: you get thirsty'],
    wall: '#c46a3b', roof: '#5b2a1d', accent: '#ffd08a' }
];
const DEG = id => DEGREES.find(d => d.id === id) || DEGREES[0];

/* ============================ state ============================ */
let S = null; // saved game state
const G = {   // runtime state, never saved
  mode: 'title', inside: null, skip: null, collapse: null, speed: 1, acc: 0,
  keys: {}, target: null, autoEnter: null, near: null, menu: false, sound: true,
  lastSave: 0, lastHud: 0
};

function newState(degId) {
  return {
    v: 2, degree: degId, day: 1, t: 16 * 60,
    hunger: 70, thirst: 75, energy: 70, money: 420,
    pantry: { b: 0, l: 0, d: 0 },
    meals: { b: false, l: false, d: false },
    shiftsDone: { am: false, pm: false },
    rent: { due: 8, paid: false, late: 0 },
    shifts: 0, pending: 0, starve: 0, over: null,
    px: DOORS.apartment.x, py: DOORS.apartment.y + 30, face: 1, scene: 'town', intId: null, townX: 0, townY: 0, friends: {}, townTalk: {}, calm: false, sch: newSch(),
    stats: { earned: 0, spent: 0, slept: 0, collapses: 0, mealsEaten: 0 }
  };
}
const job = () => DEG(S.degree);
const curRate = () => job().rate * (1 + 0.05 * Math.floor(S.shifts / job().raiseEvery)) * (1 + 0.03 * (S.skill || 0)) * (1 + 0.12 * (S.promo || 0));
const payMult = () => (S.energy < 20 ? 0.7 : S.energy < 35 ? 0.85 : 1) * lifePay();

const CLOSED_DOW = {};
function closedOn(id, day) { const c = CLOSED_DOW[id]; return !!(c && c.includes(weekdayOf(day))); }
function isOpen(id) {
  if (id === 'work' && !isWorkday(S.day)) return false;
  const H = HOURS[id]; if (!H) return true;
  const a = H[0], b = H[1], h = S.t / 60;
  if (b > 24 && h < b - 24) return !closedOn(id, S.day - 1);
  return h >= a && h < b && !closedOn(id, S.day);
}
function closedWhy(id) {
  if (id === 'work' && !isWorkday(S.day)) return 'Closed on weekends. Back on Monday at 7:00 AM.';
  const a = HOURS[id][0], h = S.t / 60, opens = clockStr(a * 60);
  if (!closedOn(id, S.day) && h < a) return 'Closed right now. Opens at ' + opens + '.';
  let d = S.day + 1, n = 0;
  while (closedOn(id, d) && n++ < 7) d++;
  const when = d === S.day + 1 ? ' tomorrow.' : ' on ' + DOW_LONG[weekdayOf(d)] + '.';
  return (closedOn(id, S.day) ? 'Closed today.' : 'Closed for the night.') + ' Opens at ' + opens + (id === 'work' ? ' on the next workday.' : when);
}

/* ============================ toasts ============================ */
function toast(msg, kind) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { el.classList.add('out'); }, 3200);
  setTimeout(() => { el.remove(); }, 3700);
}

/* ============================ sound ============================ */
const SFX = {
  ctx: null, noise: null, gain: null, timer: null,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch (e) { this.ctx = null; }
  },
  beep(f, d, type, v, delay) {
    if (!G.sound || !this.ctx) return;
    try {
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v || 0.05, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + d + 0.05);
    } catch (e) { /* audio is optional */ }
  },
  chime(kind) {
    if (kind === 'pay') { this.beep(660, 0.12, 'triangle', 0.06); this.beep(990, 0.2, 'triangle', 0.06, 0.1); }
    else if (kind === 'eat') { this.beep(300, 0.08, 'square', 0.03); this.beep(380, 0.1, 'square', 0.03, 0.09); }
    else if (kind === 'drink') { this.beep(520, 0.07, 'sine', 0.05); this.beep(430, 0.09, 'sine', 0.05, 0.07); }
    else if (kind === 'bad') { this.beep(160, 0.35, 'sawtooth', 0.04); }
    else if (kind === 'door') { this.beep(240, 0.08, 'triangle', 0.05); }
    else { this.beep(500, 0.08, 'triangle', 0.04); }
  },
  applause(on) {
    if (!this.ctx) return;
    try {
      const c = this.ctx;
      if (on) {
        if (this.gain) return;
        const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.5;
        const g = c.createGain(); g.gain.value = 0.0001;
        src.connect(f); f.connect(g); g.connect(c.destination); src.start();
        this.noise = src; this.gain = g;
        this.timer = setInterval(() => {
          if (!G.sound || !this.gain) return;
          this.gain.gain.setTargetAtTime(0.03 + Math.random() * 0.07, c.currentTime, 0.04);
        }, 90);
      } else if (this.gain) {
        clearInterval(this.timer);
        const g = this.gain, n = this.noise;
        g.gain.setTargetAtTime(0.0001, c.currentTime, 0.3);
        setTimeout(() => { try { n.stop(); } catch (e) { /* already stopped */ } }, 1500);
        this.gain = null; this.noise = null;
      }
    } catch (e) { /* audio is optional */ }
  }
};

/* ============================ save / load ============================ */
function saveGame() {
  if (!S || S.over) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be unavailable */ }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !(s.v >= 1 && s.v <= 2) || !DEGREES.some(d => d.id === s.degree) || s.over) return null;
    return s;
  } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
/* ============================ simulation ============================ */
/* act: 'idle' | 'sleep' | 'nap' | 'work' */
function tickMinute(act) {
  const j = job();
  let mh = 1, mt = 1, me = 1;
  if (act === 'sleep') { mh = 0.4; mt = 0.4; }
  else if (act === 'nap') { mh = 0.6; mt = 0.6; }
  else if (act === 'work' || act === 'school') { mh = j.drain.hunger; mt = j.drain.thirst; me = j.drain.energy; }

  S.hunger = clamp(S.hunger - (6 / 60) * mh * (hasPerk('stomach') ? 0.88 : 1), 0, 100);
  S.thirst = clamp(S.thirst - (8 / 60) * mt * (hasPerk('camel') ? 0.88 : 1), 0, 100);
  if (act === 'sleep') S.energy = clamp(S.energy + 11 / 60 * sleepBoost('sleep'), 0, 100);
  else if (act === 'nap') S.energy = clamp(S.energy + 8 / 60 * sleepBoost('nap'), 0, 100);
  else S.energy = clamp(S.energy - (4.2 / 60) * me * (isNight(S.t) ? 1.15 : 1) * lifeDrain(), 0, 100);
  lifeMinute(act);

  if (act === 'work') S.pending += (curRate() / 60) * payMult();

  if (S.hunger <= 0 || S.thirst <= 0) S.starve++; else S.starve = 0;
  if (!G.collapse) {
    if (S.starve >= 120) G.collapse = S.hunger <= 0 ? 'hunger' : 'thirst';
    else if (S.energy <= 0) G.collapse = 'energy';
  }

  S.t++;
  if (S.t >= 1440) { S.t = 0; newDay(); }
  if (S.t === 300) {
    S.meals = { b: false, l: false, d: false };
    S.shiftsDone = { am: false, pm: false };
    S.sch = newSch(); G.lesson = null; G.talk = null;
  }
  if (j.id === 'edu') schoolMinute();
  if (S.scene === 'int' && !isOpen(intBuilding(S.intId))) G.kick = true;
  if (S.t === 360 && act !== 'sleep' && act !== 'nap') {
    if (S.energy < 40) toast('You are running on fumes after the night. Everything feels heavy.', 'warn');
    else toast('The sun is up.', '');
  }
  if (S.t % 60 === 0) {
    const now = Date.now();
    if (now - G.lastSave > 1500) { G.lastSave = now; saveGame(); }
  }
}

/* advance returns how many minutes actually passed (stops early on collapse or game over) */
function advance(mins, act) {
  let n = 0;
  for (; n < mins; n++) {
    tickMinute(act || 'idle');
    if (G.collapse || S.over) { n++; break; }
  }
  return n;
}

function newDay() {
  S.day++;
  lifeNewDay();
  const R = S.rent, w = weekdayOf(S.day);
  toast(DOW_LONG[w] + ', day ' + S.day, '');
  if (S.day > R.due) {
    if (R.paid) {
      S.rentStreak = Math.max(0, (S.rentStreak || 0) + 1);
      R.due += 7; R.paid = false; R.late = 0;
    } else {
      R.late = S.day - R.due;
      if (R.late === 1) toast('Rent is late. A ' + fmt(LATE_FEE) + ' fee now applies. Pay at your apartment.', 'bad');
      else if (R.late <= EVICT_AFTER) toast('Rent is ' + R.late + ' days late. Pay today or lose your apartment.', 'bad');
      if (R.late > EVICT_AFTER) {
        S.over = 'evicted';
      }
    }
  }
}

/* ============================ collapse ============================ */
function doCollapse() {
  const why = G.collapse;
  G.collapse = null;
  if (G.skip) endSkip(true);
  closePanel(true);
  S.stats.collapses++;
  addMood(-10);
  const bill = Math.min(S.money, 45);
  S.money -= bill; S.stats.spent += bill;
  for (let i = 0; i < 360; i++) tickMinute('sleep');
  G.collapse = null;
  S.hunger = Math.max(S.hunger, 35);
  S.thirst = Math.max(S.thirst, 45);
  S.energy = Math.max(S.energy, 45);
  S.starve = 0;
  S.px = DOORS.clinic.x; S.py = DOORS.clinic.y + 30; G.target = null; G.autoEnter = null; G.pathQ = [];
  S.scene = 'town'; S.intId = null; G.lesson = null; G.talk = null; CAM.ready = false;
  SFX.chime('bad');
  const why2 = why === 'energy' ? 'You were so tired you fell asleep on your feet.'
    : why === 'hunger' ? 'You went too long without food and passed out.'
    : 'You went too long without water and passed out.';
  openNotice('You blacked out', why2 + ' Someone carried you to the clinic. You woke up at ' + clockStr(S.t) + ' and were billed ' + fmt(bill) + '. A nurse gave you water and a snack.');
  if (S.over) showOver();
}

/* ============================ time skips (sleep, naps, shifts) ============================ */
function startSkip(o) {
  // o: {mins, secs, act, title, sub, kind, shift, onEnd, dream, activity}
  closePanel(false);
  G.skip = { left: o.mins, total: o.mins, rate: o.mins / Math.max(0.5, o.secs), acc: 0, act: o.act, kind: o.kind, shift: o.shift, onEnd: o.onEnd, worked: 0, startT: S.t, dream: o.dream || null, paused: false, choiceDone: false, job: null, perfMult: 0, rank: '' };
  if (o.dream) { showDream(o.dream); return; }
  if (o.activity && JA.games[o.activity]) { JA.open(G.skip, o); return; }
  if (o.scene) { SC.open(G.skip, o); return; }
  $('#skipTitle').textContent = o.title;
  $('#skipSub').textContent = o.sub || '';
  $('#skipClock').textContent = clockStr(S.t);
  $('#skipBar span').style.width = '0%';
  $('#skip').hidden = false;
}
function stepSkip(dt) {
  const k = G.skip, J = k.job;
  if (J) { if (G.menu) return; JA.frame(dt); }
  if (k.paused) return;
  let n;
  if (J && J.beat) n = Math.floor(k.total * clamp(J.progress, 0, 1) + 1e-6) - (k.total - k.left);
  else {
    k.acc += k.rate * dt * (k.dream || J ? 1 : G.speed);
    n = Math.floor(k.acc);
    if (n > 0) k.acc -= n;
  }
  if (n <= 0) return;
  n = Math.min(n, k.left);
  const done = advance(n, k.act);
  k.left -= done;
  if (k.act === 'work') k.worked += done;
  const frac = 1 - k.left / k.total;
  if (k.dream) updateDream(frac);
  else if (k.scene) SC.update(frac);
  else if (!J) { $('#skipClock').textContent = clockStr(S.t); $('#skipBar span').style.width = (100 * frac) + '%'; }
  if (G.collapse || S.over) endSkip(false);
  else if (k.left <= 0) { if (J && J.phase === 'play') JA.finish(); else endSkip(false); }
  else if (k.dream && k.dream.choice && !k.choiceDone && frac >= 0.5) { k.paused = true; showDreamChoice(); }
}
function endSkip(aborted) {
  const k = G.skip;
  if (!k) return;
  G.skip = null;
  $('#skip').hidden = true;
  if (k.scene) SC.close();
  JA.leave(k);
  hideDream();
  if (k.kind === 'work') {
    const pay = Math.round(S.pending * (k.perfMult || 1) * 100) / 100;
    S.pending = 0;
    S.money += pay; S.stats.earned += pay;
    if (k.shift) S.shiftsDone[k.shift] = true;
    if (k.worked >= 180) S.shifts++;
    if (k.rank) addMood({ S: 4, A: 3, B: 1, C: 0, D: -2 }[k.rank.slice(-1)] || 0);
    if (k.worked >= 180) lifeEv('shift', { perf: k.rank ? JA.lastPerf : 0.3, rank: k.rank ? k.rank.slice(-1) : 'D' });
    if (pay > 0) { toast('Shift done: ' + hoursStr(k.worked) + ' worked, +' + fmt(pay) + (k.rank ? ' (' + k.rank + ')' : ''), 'good'); SFX.chime('pay'); }
  }
  if (k.kind === 'nap' && !aborted && k.dream) applyDreamEffect(k.dream);
  if (k.kind === 'sleep') {
    S.fx.sleepaid = 0;
    const slept = k.total - k.left;
    S.stats.slept += slept;
    if (!aborted && k.dream) applyDreamEffect(k.dream);
    toast('You slept ' + hoursStr(slept) + '. Energy is at ' + Math.round(S.energy) + '.', S.energy < 50 ? 'warn' : 'good');
    if (!aborted && S.logPrev && S.logPrev.day < S.day) setTimeout(showRecap, 350);
  }
  if (!aborted && k.onEnd) k.onEnd();
  if (!aborted && !G.collapse && !S.over && G.inside) renderPanel();
  if (!aborted && !G.collapse && !S.over && G.inside) $('#panel').hidden = false;
}

/* ============================ eating and drinking ============================ */
function canSpend(c) { return S.money + 1e-9 >= c; }
function spend(c) { S.money = Math.round((S.money - c) * 100) / 100; S.stats.spent += c; }
/* returns a reason string if the action is not possible, else '' */
function eatBlock(h) { return h > 0 && S.hunger >= 80 ? 'You are too full right now.' : ''; }
function drinkBlock(t) { return t > 0 && S.thirst >= 92 ? 'You are not thirsty.' : ''; }
function applyIntake(o) {
  // o: {hunger, thirst, energy, mins, meal}
  S.hunger = clamp(S.hunger + (o.hunger || 0), 0, 100);
  S.thirst = clamp(S.thirst + (o.thirst || 0), 0, 100);
  S.energy = clamp(S.energy + (o.energy || 0), 0, 100);
  if (o.meal) {
    const p = period(S.t);
    if (p) S.meals[p] = true;
    S.stats.mealsEaten++;
    addMood(2);
    lifeEv('meal');
  }
  if (o.mins) advance(o.mins, 'idle');
}

/* ============================ goal text and status chips ============================ */
function goalText() {
  const R = S.rent, w = weekdayOf(S.day);
  if (!R.paid && R.late > 0) return 'Rent is late. Pay it at your apartment before you are evicted.';
  if (!R.paid && S.day >= R.due - 1) return 'Rent is due ' + (S.day === R.due ? 'tonight' : 'Sunday') + '. Pay it at your apartment.';
  if (S.hunger < 30) return 'You are hungry. Eat something at the apartment, diner or grocery store.';
  if (S.thirst < 30) return 'You are thirsty. Tap water, the park fountain or a drink from the store will do.';
  if (S.energy < 25) return 'You are exhausted. Get some sleep at your apartment.';
  if (isNight(S.t)) return S.t >= 20 * 60 || S.t < 2 * 60 ? 'It is late. Head home and go to sleep, or stay up and pay for it in the morning.' : 'It is the middle of the night. Sleep at your apartment to feel human tomorrow.';
  if (isWorkday(S.day) && job().id === 'edu') {
    const g = schoolGoal();
    if (S.t < 16 * 60 && g) return g;
  } else if (isWorkday(S.day)) {
    if (!S.shiftsDone.am && S.t < 11 * 60) return 'Head to work. The morning shift runs 8 AM to 12 PM at ' + job().employer + '.';
    if (!S.shiftsDone.pm && S.t >= 12 * 60 && S.t < 16 * 60) return 'Afternoon shift runs 1 PM to 5 PM. Grab lunch first if you have not.';
  }
  const lg = lifeGoal(); if (lg) return lg;
  if (w === 0 || w === 6) return 'It is the weekend. Stock the pantry, rest up, and treat yourself: a movie, a book or a new haircut.';
  const p = period(S.t);
  if (p && !S.meals[p]) return PERIOD_NAME[p] + ' time. Eat to keep your hunger up.';
  return 'Keep an eye on hunger, thirst, energy and mood. Money from work pays rent every Sunday.';
}
function statusChips() {
  const c = [];
  if (S.energy < 20) c.push(['Exhausted', 0]); else if (S.energy < 35) c.push(['Drowsy', 1]);
  if (S.hunger < 10) c.push(['Starving', 0]); else if (S.hunger < 30) c.push(['Hungry', 1]);
  if (S.thirst < 10) c.push(['Parched', 0]); else if (S.thirst < 30) c.push(['Thirsty', 1]);
  if (S.mood < 25) c.push(['Gloomy', 0]); else if (S.mood < 40) c.push(['Low mood', 1]); else if (S.mood >= 75) c.push(['Upbeat', 2]);
  if (toothOn()) c.push(['Toothache', 0]);
  if (S.clean >= 5) c.push(['Wrinkled clothes', 1]);
  if (fxOn('sharp')) c.push(['Fresh cut', 2]);
  return c;
}
