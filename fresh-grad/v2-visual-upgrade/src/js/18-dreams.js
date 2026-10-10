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
function hideDream() { $('#dream').hidden = true; DR.d = null; }
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
  const u = Math.min(w, h) / 100, bad = mood === 'bad';
  c.save();
  if (m === 'clouds') {
    for (let i = 0; i < 6; i++) {
      const x = (((i * 0.21 + t * 0.018 * (1 + i * 0.2)) % 1.4) - 0.2) * w, y = (0.16 + i * 0.12) * h;
      c.fillStyle = 'rgba(255,255,255,.16)';
      [[0, 0, 9], [8, -3, 7], [-8, -2, 6], [15, 1, 5]].forEach(p => { c.beginPath(); c.arc(x + p[0] * u, y + p[1] * u, p[2] * u, 0, 7); c.fill(); });
    }
  } else if (m === 'plates') {
    for (let i = 0; i < 9; i++) {
      const a = bad ? Math.max(0, Math.sin(t * 0.8 + i * 1.3)) * 0.25 : 0.22;
      const x = (0.08 + i * 0.105) * w, y = (0.72 + Math.sin(t * 1.1 + i) * 0.04) * h;
      c.fillStyle = (bad ? 'rgba(180,180,200,' : 'rgba(255,230,170,') + a.toFixed(3) + ')';
      c.beginPath(); c.arc(x, y, 6 * u, 0, 7); c.fill();
      c.beginPath(); c.arc(x, y, 3.6 * u, 0, 7); c.strokeStyle = 'rgba(255,255,255,' + (a * 0.8).toFixed(3) + ')'; c.lineWidth = 2; c.stroke();
    }
  } else if (m === 'confetti') {
    for (let i = 0; i < 46; i++) {
      const x = ((i * 0.137) % 1) * w + Math.sin(t + i) * 3 * u, y = (((i * 0.31 + t * 0.07) % 1.1) - 0.05) * h;
      c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.fillStyle = ['#ffc247', '#ff6b6b', '#5bd39b', '#47b8ff', '#ffffff'][i % 5];
      c.globalAlpha = 0.6; c.fillRect(-1.2 * u, -0.6 * u, 2.4 * u, 1.2 * u); c.restore();
    }
  } else if (m === 'sun') {
    const cx = w * 0.72, cy = h * 0.28;
    const g = c.createRadialGradient(cx, cy, 2, cx, cy, 34 * u);
    g.addColorStop(0, 'rgba(255,236,160,.9)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 34 * u, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,230,160,.25)'; c.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const a = t * 0.15 + i * 0.449; c.beginPath(); c.moveTo(cx + Math.cos(a) * 14 * u, cy + Math.sin(a) * 14 * u); c.lineTo(cx + Math.cos(a) * 46 * u, cy + Math.sin(a) * 46 * u); c.stroke(); }
  } else if (m === 'water') {
    const cx = w * 0.5, cy = h * 0.78;
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.18 + i / 5) % 1);
      c.strokeStyle = (bad ? 'rgba(120,130,160,' : 'rgba(150,220,255,') + ((1 - p) * (bad ? 0.2 : 0.4)).toFixed(3) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, cy, p * 46 * u, p * 12 * u, 0, 0, 7); c.stroke();
    }
  } else if (m === 'clock') {
    const cx = w * 0.5, cy = h * 0.5, R = 30 * u, sp = bad ? 2.6 : 0.5;
    c.strokeStyle = bad ? 'rgba(255,120,120,.28)' : 'rgba(255,255,255,.2)'; c.lineWidth = 4;
    c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88); c.lineTo(cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97); c.stroke(); }
    c.lineWidth = 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * sp) * R * 0.8, cy + Math.sin(t * sp) * R * 0.8); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * sp / 12) * R * 0.55, cy + Math.sin(t * sp / 12) * R * 0.55); c.stroke();
  } else if (m === 'hall') {
    const cx = w * 0.5 + Math.sin(t * 0.7) * 3 * u, cy = h * 0.5;
    for (let i = 0; i < 14; i++) {
      const p = ((i + t * 1.6) % 14) / 14, s = Math.pow(p, 2.2);
      c.strokeStyle = 'rgba(255,110,110,' + (0.04 + s * 0.3).toFixed(3) + ')'; c.lineWidth = 1 + s * 4;
      c.strokeRect(cx - s * 60 * u, cy - s * 44 * u, s * 120 * u, s * 88 * u);
    }
  } else if (m === 'letters') {
    for (let i = 0; i < 26; i++) {
      const x = ((i * 0.171) % 1) * w, y = (((i * 0.23 + t * 0.09) % 1.15) - 0.1) * h;
      c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.8 + i) * 0.6); c.fillStyle = 'rgba(240,230,220,.22)'; c.fillRect(-3 * u, -4 * u, 6 * u, 8 * u);
      c.fillStyle = 'rgba(220,60,60,.4)'; c.fillRect(-2 * u, -2.5 * u, 4 * u, 0.9 * u); c.restore();
    }
  }
  c.restore();
}
function drawDream(dt) {
  const d = DR.d;
  if (!d || !DR.cv) return;
  DR.t += dt;
  const cv = DR.cv, c = DR.c, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.max(1, Math.round(cv.clientWidth * dpr)), ph = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  const mood = $('#dream').dataset.mood, pal = DREAM_PAL[mood] || DREAM_PAL.calm, bad = mood === 'bad';
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, ph); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  c.fillStyle = g; c.fillRect(0, 0, pw, ph);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const bx = (0.5 + 0.38 * Math.sin(DR.t * 0.11 + i * 1.9)) * pw, by = (0.45 + 0.3 * Math.cos(DR.t * 0.09 + i * 2.3)) * ph, br = Math.max(pw, ph) * (0.3 + 0.08 * i);
    c.globalAlpha = bad ? 0.1 : 0.16; c.drawImage(GLOW[bad ? 2 : mood === 'good' ? (i % 2 ? 5 : 4) : 1], bx - br, by - br, br * 2, br * 2);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  dreamMotif(c, d.motif, DR.t, pw, ph, mood);
  for (const p of DR.parts) {
    if (bad) { p.y += p.v * dt * 1.2; p.x += Math.sin(DR.t * 3 + p.ph) * 0.0008; if (p.y > 1.05) p.y = -0.05; }
    else { p.y -= p.v * dt * 0.8; if (p.y < -0.05) p.y = 1.05; }
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(DR.t * 1.4 + p.ph));
    c.fillStyle = bad ? 'rgba(10,0,6,' + (0.5 * tw).toFixed(3) + ')' : 'rgba(255,240,200,' + (0.55 * tw).toFixed(3) + ')';
    c.beginPath(); c.arc(p.x * pw, p.y * ph, p.r * dpr * (bad ? 2.4 : 1), 0, 7); c.fill();
  }
  if (bad) {
    if (Math.sin(DR.t * 3.1) > 0.96) { c.fillStyle = 'rgba(255,60,60,.07)'; c.fillRect(0, (Math.sin(DR.t * 40) * 0.5 + 0.5) * ph, pw, ph * 0.04); }
    const e = 0.5 + 0.5 * Math.sin(DR.t * 2.2);
    for (let i = 0; i < 3; i++) {
      const bx = (0.15 + i * 0.35) * pw, by = (0.22 + (i % 2) * 0.5) * ph, op = Math.max(0, Math.sin(DR.t * 0.9 + i * 2.1)) * 0.5;
      c.fillStyle = 'rgba(255,230,230,' + op.toFixed(3) + ')'; c.beginPath(); c.arc(bx, by, 3 * dpr, 0, 7); c.arc(bx + 22 * dpr, by, 3 * dpr, 0, 7); c.fill();
    }
    const vg = c.createRadialGradient(pw / 2, ph / 2, Math.min(pw, ph) * 0.2, pw / 2, ph / 2, Math.max(pw, ph) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,0,10,' + (0.45 + 0.2 * e).toFixed(3) + ')');
    c.fillStyle = vg; c.fillRect(0, 0, pw, ph);
  } else {
    const vg = c.createRadialGradient(pw / 2, ph / 2, Math.min(pw, ph) * 0.3, pw / 2, ph / 2, Math.max(pw, ph) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,20,.45)');
    c.fillStyle = vg; c.fillRect(0, 0, pw, ph);
  }
}
