/* ============================ dreams ============================ */
const DR = { d: null, t: 0, parts: [], cv: null, c: null };
const fillTxt = s => s.replace(/\{job\}/g, job().job.toLowerCase()).replace(/\{employer\}/g, job().employer);

/* Each dream: title, motif (what the background shows), beats (lines shown over the night),
   choice (a decision in the middle), and the energy it leaves you with. */
const GOOD_DREAMS = [
  { id: 'fly', title: 'Above the Rooftops', motif: 'clouds',
    beats: ['You lift off the sidewalk without even trying.', 'The town spreads out below you, tiny and glowing.', 'The apartment, the diner and the fountain all wave back.', 'You glide home on a warm wind.'],
    choice: { q: 'A bright cloud drifts close. Ride it, or keep flying?', opts: [{ t: 'Ride the cloud', note: 'It carries you gently, humming like a lullaby.', energy: 10 }, { t: 'Keep flying', note: 'You race the wind and win.', energy: 8 }] } },
  { id: 'feast', title: "The Feast at Dot's", motif: 'plates', hunger: 6,
    beats: ['Dot waves you in. Every table is piled with food.', 'Pancakes, pie and a milkshake that never empties.', 'Everyone you have met this week is at the counter, laughing.', 'You are full and nobody has a bill.'],
    choice: { q: 'Dot slides over one last plate. Share it, or keep it?', opts: [{ t: 'Share it', note: 'The whole diner cheers and passes it around.', energy: 10 }, { t: 'Keep it', note: 'It is the best bite you have ever had.', energy: 8 }] } },
  { id: 'grad', title: 'Graduation Encore', motif: 'confetti',
    beats: ['The auditorium doors open for a second graduation.', 'Every seat is full, and every face is smiling at you.', 'Your name is called and the roof shakes with applause.', 'The caps go up and none of them come down.'],
    choice: { q: 'The dean hands you the microphone. Say a few words, or just wave?', opts: [{ t: 'Say a few words', note: 'You say exactly the right thing.', energy: 10 }, { t: 'Just wave', note: 'The crowd roars anyway.', energy: 8 }] } },
  { id: 'perfect', title: 'The Perfect Day', motif: 'sun',
    beats: ['Everything at {employer} goes right today.', 'You are a great {job}, and everyone says so.', 'Lunch arrives hot and right on time.', 'You walk home with the sun on your shoulders.'],
    choice: { q: 'Your boss offers you a surprise day off. Take it, or stay and shine?', opts: [{ t: 'Take the day off', note: 'You spend it by the pond with a book.', energy: 10 }, { t: 'Stay and shine', note: 'You feel unstoppable.', energy: 8 }] } },
  { id: 'pond', title: 'Picnic by the Pond', motif: 'water',
    beats: ['The ducks in the park have learned to quack in rhythm.', 'A blanket, a basket and a cold drink are waiting.', 'The water is perfectly still and the sky is perfectly blue.', 'Nobody needs anything from you.'],
    choice: { q: 'The ducks wander over. Feed them, or let them be?', opts: [{ t: 'Feed them', note: 'They waddle off in a happy parade.', energy: 10 }, { t: 'Let them be', note: 'You watch them drift across the pond.', energy: 8 }] } }
];
const BAD_DREAMS = [
  { id: 'late', title: 'Late for Day One', motif: 'clock',
    beats: ['It is 8:01 AM and you are not at {employer}.', 'The building keeps sliding further away as you run.', 'Everyone is waiting. You have forgotten how to be a {job}.', 'The clock hands spin faster and faster.'],
    choice: { q: 'The door is right there. Walk in anyway, or run back home?', opts: [{ t: 'Walk in anyway', note: 'Nobody even looks up. It was fine all along.', energy: -3, faced: true }, { t: 'Run back home', note: 'The street stretches and your legs turn to lead.', energy: -10 }] } },
  { id: 'hall', title: 'The Endless Hallway', motif: 'hall',
    beats: ['You are in a hallway and the end keeps moving away.', 'Every door you pass is locked.', 'Your footsteps get louder with every step.', 'The lights flicker one by one.'],
    choice: { q: 'A door glows at the end. Open it, or turn back?', opts: [{ t: 'Open it', note: 'Sunlight. It was only your own bedroom.', energy: -3, faced: true }, { t: 'Turn back', note: 'The hallway folds in behind you.', energy: -10 }] } },
  { id: 'rent', title: 'Notice on the Door', motif: 'letters', when: () => !S.rent.paid,
    beats: ['Papers slide under your door, then pile up to the ceiling.', 'Every one says RENT DUE in big red letters.', 'Footsteps stop right outside your apartment.', 'Someone is knocking, slowly.'],
    choice: { q: 'The landlord knocks again. Open the door, or hide?', opts: [{ t: 'Open the door', note: 'The landlord just wanted to say hello.', energy: -3, faced: true }, { t: 'Hide', note: 'The knocking gets louder and louder.', energy: -10 }] } },
  { id: 'empty', title: 'Empty Plates', motif: 'plates', when: () => S.hunger < 50,
    beats: ['You sit down to dinner and the plates are empty.', 'You open the fridge and it is full of echoes.', 'The diner is closed, the grocery is closed, everything is closed.', 'Your stomach rumbles louder than the thunder.'],
    choice: { q: 'A plate appears, but it is cold. Eat it anyway, or wait?', opts: [{ t: 'Eat it anyway', note: 'It warms up with every bite.', energy: -3, faced: true }, { t: 'Wait', note: 'It disappears while you watch.', energy: -10 }] } },
  { id: 'alarm', title: "The Alarm That Won't Stop", motif: 'clock',
    beats: ['An alarm is ringing and you cannot find it.', 'You check the couch, the sink, the oven.', 'It rings from inside the walls.', 'The ringing has a rhythm now, like a heartbeat.'],
    choice: { q: 'You find the clock. Smash it, or switch it off?', opts: [{ t: 'Switch it off', note: 'Silence. Warm, heavy silence.', energy: -3, faced: true }, { t: 'Smash it', note: 'It splits into a hundred smaller alarms.', energy: -10 }] } },
  { id: 'dry', title: 'Dry Mouth', motif: 'water', when: () => S.thirst < 40,
    beats: ['The fountain in the park is running dry.', 'You cup your hands and catch only sand.', 'The pond shrinks until it is a puddle.', 'You can hear water, but you cannot find it.'],
    choice: { q: 'A glass of water sits across a long room. Walk to it, or stay put?', opts: [{ t: 'Walk to it', note: 'It is cold and clear and endless.', energy: -3, faced: true }, { t: 'Stay put', note: 'The room stretches out another mile.', energy: -10 }] } }
];

function makeDream(kind, mins) {
  const long = kind === 'sleep' && mins >= 180;
  if (kind === 'nap' && Math.random() < 0.4) {
    return { id: 'none', title: 'A Quiet Nap', motif: 'calm', good: null, beats: ['You close your eyes for a moment.', 'Nothing but warm, quiet dark.'], choice: null, scale: 0 };
  }
  let bad = 0.3;
  if (S.hunger < 30) bad += 0.15; if (S.thirst < 25) bad += 0.15;
  if (S.rent.late > 0) bad += 0.2; else if (!S.rent.paid && S.day >= S.rent.due - 1) bad += 0.08;
  if (S.money < 50) bad += 0.1; if (S.energy < 25) bad += 0.08;
  if (S.hunger > 60 && S.thirst > 50 && S.rent.paid) bad -= 0.15;
  if (S.mood < 30) bad += 0.1; else if (S.mood > 70) bad -= 0.08;
  if (S.fx && S.fx.scary) { bad += 0.2; S.fx.scary = 0; }
  if (S.calm) { bad -= 0.2; S.calm = false; }
  const isBad = Math.random() < clamp(bad, 0.05, 0.75);
  const pool = (isBad ? BAD_DREAMS : GOOD_DREAMS).filter(d => !d.when || d.when());
  const base = pool[Math.floor(Math.random() * pool.length)];
  const d = { id: base.id, title: base.title, motif: base.motif, good: !isBad, hunger: base.hunger || 0, scale: long ? 1 : 0.5 };
  d.beats = base.beats.map(fillTxt);
  d.choice = null;
  if (long) d.choice = { q: base.choice.q, opts: base.choice.opts.map(o => Object.assign({}, o)) };
  else if (kind === 'sleep') d.beats = d.beats.slice(0, 2);
  else d.beats = d.beats.slice(0, 2);
  d.defaultEnergy = isBad ? -10 : 8;
  return d;
}

/* ---------- on-screen dream ---------- */
function showDream(d) {
  DR.d = d; DR.t = 0; DR.parts = [];
  for (let i = 0; i < 70; i++) DR.parts.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 3, v: 0.02 + Math.random() * 0.05, ph: Math.random() * 6 });
  DR.cv = $('#dreamCanvas'); DR.c = DR.cv.getContext('2d');
  const dr = $('#dream');
  dr.dataset.mood = d.good === null ? 'calm' : d.good ? 'good' : 'bad';
  $('#dreamKind').textContent = d.good === null ? 'Resting' : d.good ? 'A good dream' : 'A bad dream';
  $('#dreamTitle').textContent = d.title;
  $('#dreamLine').textContent = ''; $('#dreamLine').style.opacity = 1;
  $('#dreamChoice').hidden = true;
  $('#dreamClock').textContent = clockStr(S.t);
  $('#dreamBar span').style.width = '0%';
  d.lineIdx = -1;
  updateDream(0);
  if (d.good) { SFX.beep(523, 0.5, 'sine', 0.03); SFX.beep(659, 0.6, 'sine', 0.03, 0.2); }
  else if (d.good === false) { SFX.beep(98, 1.0, 'sawtooth', 0.025); }
  dr.hidden = false;
}
function hideDream() { $('#dream').hidden = true; DR.d = null; AK.dropLayers('dr|'); }
function setDreamLine(text) {
  const el2 = $('#dreamLine');
  el2.style.opacity = 0;
  setTimeout(() => { el2.textContent = text; el2.style.opacity = 1; }, 250);
}
function updateDream(frac) {
  const d = DR.d; if (!d) return;
  const n = d.beats.length, idx = Math.min(n - 1, Math.floor(frac * n * 0.999));
  if (idx !== d.lineIdx) { d.lineIdx = idx; if (!d.pick) setDreamLine(d.beats[idx]); }
  $('#dreamClock').textContent = clockStr(S.t);
  $('#dreamBar span').style.width = (frac * 100) + '%';
}
function showDreamChoice() {
  const d = DR.d, ch = d.choice;
  $('#dreamQ').textContent = ch.q;
  $('#dreamA').textContent = ch.opts[0].t; $('#dreamB').textContent = ch.opts[1].t;
  $('#dreamChoice').hidden = false;
}
function chooseDream(i) {
  const k = G.skip, d = DR.d;
  if (!k || !d || !d.choice || !k.paused) return;
  d.pick = d.choice.opts[i];
  $('#dreamChoice').hidden = true;
  setDreamLine(d.pick.note);
  k.paused = false; k.choiceDone = true;
}
function wakeEarly() {
  const k = G.skip;
  if (!k || !k.dream) return;
  if (k.paused) { k.dream.pick = null; $('#dreamChoice').hidden = true; k.paused = false; k.choiceDone = true; }
  k.rate = k.total / 1.4;
}
function applyDreamEffect(d) {
  if (!d || d.good === null) { S.lastDream = { title: d ? d.title : '', good: null, day: S.day }; return; }
  const raw = d.pick ? d.pick.energy : d.defaultEnergy;
  const e = Math.round(raw * d.scale);
  S.energy = clamp(S.energy + e, d.good ? 0 : 5, 100);
  if (d.hunger) S.hunger = clamp(S.hunger + Math.round(d.hunger * d.scale), 0, 100);
  S.lastDream = { title: d.title, good: d.good, day: S.day };
  addMood(d.good ? 6 : d.pick && d.pick.faced ? 0 : -5);
  S.stats[d.good ? 'goodDreams' : 'badDreams'] = (S.stats[d.good ? 'goodDreams' : 'badDreams'] || 0) + 1;
  if (d.good) { toast('Good dream: ' + d.title + '. You wake up refreshed. Energy +' + e + '.', 'good'); SFX.chime('pay'); }
  else if (d.pick && d.pick.faced) { toast('Bad dream: ' + d.title + '. You faced it and woke up calmer. Energy ' + e + '.', 'warn'); }
  else { toast('Bad dream: ' + d.title + '. You wake up shaken. Energy ' + e + '.', 'bad'); SFX.chime('bad'); }
}

/* ---------- dream backdrop ---------- */
const DREAM_PAL = { good: ['#1b1c52', '#2d7a93'], bad: ['#07040a', '#3d0c1c'], calm: ['#0a1020', '#1c2a45'] };
function dreamMotif(c, m, t, w, h, mood) {
  const paint = { clouds: dsClouds, plates: dsPlates, confetti: dsConfetti, sun: dsSun, water: dsWater, clock: dsClock, hall: dsHall, letters: dsLetters, calm: dsCalm }[m] || dsCalm;
  paint(c, t, w, h, mood);
}
function drawDream(dt) {
  const d = DR.d;
  if (!d || !DR.cv) return;
  DR.t += dt;
  const cv = DR.cv, c = DR.c, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight), pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  DR.dpr = dpr;
  const mood = $('#dream').dataset.mood, bad = mood === 'bad', tm = REDUCED ? 2.4 : DR.t;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  // a slow push-in with a little sway, like a camera that cannot quite hold still
  const z = 1.04 + 0.02 * Math.sin(tm * 0.11), dx = Math.sin(tm * 0.07) * w * 0.012, dy = Math.cos(tm * 0.05) * h * 0.01;
  c.save(); c.translate(w / 2 + dx, h / 2 + dy); c.scale(z, z); c.translate(-w / 2, -h / 2);
  dreamMotif(c, d.motif, tm, w, h, mood);
  c.restore();
  // drifting motes: warm light rising in good dreams, soot falling in bad ones
  for (const p of DR.parts) {
    if (bad) { p.y += p.v * dt * 1.2; p.x += Math.sin(DR.t * 3 + p.ph) * 0.0008; if (p.y > 1.05) p.y = -0.05; }
    else { p.y -= p.v * dt * 0.8; if (p.y < -0.05) p.y = 1.05; }
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(tm * 1.4 + p.ph)), r = p.r * (bad ? 3.4 : 2.2);
    c.globalAlpha = (bad ? 0.35 : 0.5) * tw; c.drawImage(AK.glow(bad ? [30, 6, 14] : [255, 238, 190]), p.x * w - r, p.y * h - r, r * 2, r * 2);
  }
  c.globalAlpha = 1;
  if (bad) {
    dsTendrils(c, tm, w, h);
    const e = 0.5 + 0.5 * Math.sin(tm * 2.2);
    // pairs of pale eyes opening in the dark
    for (let i = 0; i < 3; i++) {
      const bx = (0.15 + i * 0.35) * w, by = (0.22 + (i % 2) * 0.5) * h, op = Math.max(0, Math.sin(tm * 0.9 + i * 2.1)) * 0.5;
      if (op > 0.02) { AK.light(c, bx + 11, by, 22, '#ff9a9a', op * 0.35); c.fillStyle = 'rgba(255,232,232,' + op.toFixed(3) + ')'; c.beginPath(); c.ellipse(bx, by, 3.2, 2, 0, 0, 7); c.ellipse(bx + 22, by, 3.2, 2, 0, 0, 7); c.fill(); }
    }
    // hairline cracks spreading across the glass
    c.strokeStyle = 'rgba(255,90,100,' + (0.1 + 0.1 * Math.max(0, Math.sin(tm * 1.7))).toFixed(3) + ')'; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { let x = w * hash01(i, 21, 3), y = h * hash01(i, 22, 3); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (hash01(i, k, 23) - 0.5) * w * 0.12; y += (hash01(i, k, 24) - 0.5) * h * 0.12; c.lineTo(x, y); } c.stroke(); }
    const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,0,10,' + (0.5 + 0.2 * e).toFixed(3) + ')');
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
    // the odd glitch: thin bands of red and cyan tear across the picture for a heartbeat
    if (!REDUCED && Math.sin(DR.t * 0.83) > 0.97 && Math.sin(DR.t * 31) > 0) {
      for (let i = 0; i < 4; i++) { const gy = hash01(Math.floor(DR.t * 24), i, 5) * h, gh = h * (0.008 + hash01(i, 6, 6) * 0.03); c.fillStyle = i % 2 ? 'rgba(40,220,255,.12)' : 'rgba(255,50,70,.16)'; c.fillRect((i % 2 ? 1 : -1) * 12, gy, w, gh); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, gy + gh, w, 1); }
    }
  } else {
    // good and calm dreams glow: a soft bloom from above, and a deep blue vignette
    c.save(); c.globalCompositeOperation = 'lighter'; AK.light(c, w * 0.5, -h * 0.05, w * 0.7, mood === 'good' ? '#ffe0b0' : '#9fb4ff', mood === 'good' ? 0.16 : 0.08); c.restore();
    const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(4,6,28,.5)');
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
  }
  c.fillStyle = AK.grain(c); c.globalAlpha = 0.035; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
}
