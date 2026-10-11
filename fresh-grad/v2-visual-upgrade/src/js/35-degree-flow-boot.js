/* ============================ degree picker ============================ */
let pickedDegree = null, typeTimer = 0;
function showDegreeScreen() {
  G.mode = 'degree';
  const scr = $('#degree'); scr.hidden = false; scr.scrollTop = 0;
  degSetup();
  pickedDegree = null;
  $('#dField').textContent = '';
  $('#dField').classList.remove('typing');
  $('#offer').innerHTML = '';
  $('#offer').appendChild(el('p', '', 'Choose a degree to see the job it leads to.'));
  const list = $('#degList'); list.innerHTML = '';
  DEGREES.forEach((d, i) => {
    const b = el('button', 'deg'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.dataset.id = d.id;
    b.style.setProperty('--c', d.wall); b.style.setProperty('--r', d.roof); b.style.setProperty('--a', d.accent); b.style.setProperty('--i', i);
    b.appendChild(degEmblem(d));
    b.appendChild(el('b', '', d.short));
    b.appendChild(el('span', '', d.job));
    b.appendChild(el('em', '', '$' + d.rate + '/hr'));
    list.appendChild(b);
  });
  const btn = $('#btnAccept'); btn.disabled = true; btn.textContent = 'Pick a degree';
}
function pickDegree(id) {
  const d = DEG(id); pickedDegree = id;
  $$('#degList .deg').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  clearInterval(typeTimer);
  const f = $('#dField'); let i = 0; f.textContent = ''; f.classList.add('typing');
  typeTimer = setInterval(() => { i++; f.textContent = d.field.slice(0, i); if (i >= d.field.length) { clearInterval(typeTimer); f.classList.remove('typing'); } }, 28);
  // the seal is stamped again and the sheet settles
  const seal = $('#degree .seal'), dp = $('#degree .diploma');
  if (seal) { seal.classList.remove('stamped'); void seal.offsetWidth; seal.classList.add('stamped'); }
  if (dp) { dp.classList.add('pop'); setTimeout(() => dp.classList.remove('pop'), 420); }
  const label = d.field.startsWith('Arts') ? 'Arts' : 'Science';
  const off = $('#offer'); off.innerHTML = '';
  off.style.setProperty('--c', d.wall); off.style.setProperty('--r', d.roof);
  off.appendChild(degEmblem(d));
  off.appendChild(el('h3', '', d.job));
  off.appendChild(el('div', 'meta', d.employer + '. Bachelor of ' + label + '.'));
  off.appendChild(el('div', 'pay', '$' + d.rate + '/hr  \u00b7  about $' + (d.rate * 40) + ' a week'));
  const ul = el('ul');
  d.pros.forEach(t => ul.appendChild(el('li', '', t)));
  d.cons.forEach(t => ul.appendChild(el('li', 'minus', t)));
  off.appendChild(ul);
  const btn = $('#btnAccept'); btn.disabled = false; btn.textContent = 'Accept the job at ' + d.employer;
  // on a narrow screen the diploma sits below the cards: bring it into view
  if (window.innerWidth <= 820) { const sd = $('#degree .dg-side'); if (sd && sd.scrollIntoView) setTimeout(() => sd.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }), 120); }
}
/* ============================ game flow ============================ */
function showOnly(id) {
  ['title', 'cut', 'degree', 'game'].forEach(s => { $('#' + s).hidden = s !== id; });
}
function resetRuntime() {
  G.inside = null; G.skip = null; G.collapse = null; G.keys = {}; G.target = null; G.autoEnter = null;
  G.near = null; G.menu = false; G.acc = 0; G.notice = null; G.overShown = false;
  CAM.ready = false; lastGoal = ''; lastChips = ''; G.trail = []; G.lesson = null; G.talk = null; G.pathQ = []; G.kick = false;
  ['panel', 'skip', 'menu', 'over', 'dream', 'scene', 'phone', 'lvl', 'recap', 'fishing', 'gig', 'wipe'].forEach(i => { $('#' + i).hidden = true; });
  G.phone = false; G.gig = null; FS.on = false; WIPE.phase = ''; PFX.length = 0; TRACKS.length = 0;
  SC.o = null;
  DR.d = null;
  $('#prompt').hidden = true; $('#toasts').innerHTML = '';
}
function beginPlay(intro) {
  resetRuntime();
  if (G.music !== false) G.music = true;
  if (G.sound && G.music) MUSIC.start();
  G.mode = 'play';
  showOnly('game');
  ensureLife(S); applyLook();
  if (S.scene === 'int' && !INT[S.intId]) { S.scene = 'town'; S.intId = null; }
  if (S.scene === 'school') placeKids();
  updateHud();
  if (intro) {
    const j = job();
    toast('Welcome to town. It is Sunday evening and your first shift at ' + j.employer + ' is Monday at 8 AM.', 'good');
    setTimeout(() => toast('Stock up on food, eat, and get to bed. Walk with WASD or tap the map.', ''), 600);
    setTimeout(() => toast('Every shop on the street is open. Tap Phone (or press P) for your goals, a map and texts.', 'good'), 1300);
  }
}
function startNewGame(id) {
  S = ensureLife(newState(id));
  welcomeTexts(); ensureGoals();
  clearSave(); saveGame();
  beginPlay(true);
}
function continueGame() {
  const s = loadSave();
  if (!s) return;
  S = ensureLife(s);
  if (!S.scene) S.scene = 'town';
  if (!S.sch) S.sch = newSch();
  if (!S.v || S.v < 2) { S.v = 2; S.scene = 'town'; S.intId = null; S.px = DOORS.apartment.x; S.py = DOORS.apartment.y + 30; G.target = null; }
  if (!S.friends) S.friends = {};
  if (S.scene === 'town' && solidAt(S.px, S.py)) { S.px = DOORS.apartment.x; S.py = DOORS.apartment.y + 30; }
  if (!S.townTalk) S.townTalk = {};
  beginPlay(false);
  toast('Welcome back. ' + DOW_LONG[weekdayOf(S.day)] + ', ' + clockStr(S.t) + '.', '');
}
function toTitle() {
  resetRuntime();
  G.mode = 'title';
  S = null;
  showOnly('title');
  $('#btnContinue').hidden = !loadSave();
}

/* menu */
function openMenu() {
  if (G.menu || G.mode !== 'play') return;
  G.menu = true; G.keys = {};
  $('#mConfirm').hidden = true; $('#mRestart').textContent = 'Start over';
  renderLife();
  $('#menu').hidden = false;
}
function closeMenu() { G.menu = false; $('#menu').hidden = true; }

/* game over */
function showOver() {
  G.overShown = true;
  if (G.skip) endSkip(true);
  closePanel(true);
  clearSave();
  $('#oTitle').textContent = 'Evicted';
  $('#oSub').textContent = 'Rent went unpaid for too long and the landlord changed the locks.';
  const st = $('#oStats'); st.innerHTML = '';
  [['Days lived', S.day], ['Cash on hand', fmt(Math.round(S.money))], ['Savings', fmt(Math.round(S.bank ? S.bank.bal : 0))], ['Places visited', PASSPORT.filter(p => S.stamps && S.stamps[p]).length + ' of ' + PASSPORT.length], ['Total earned', fmt(Math.round(S.stats.earned))], ['Meals eaten', S.stats.mealsEaten], ['Hours slept', Math.round(S.stats.slept / 60)], ['Blackouts', S.stats.collapses]].forEach(r => {
    const d = el('div'); d.appendChild(el('b', '', String(r[1]))); d.appendChild(el('small', '', r[0])); st.appendChild(d);
  });
  $('#over').hidden = false;
}

/* ============================ main loop ============================ */
let lastFrame = performance.now();
function update(dt) {
  if (G.mode === 'cut') { cutUpdate(dt); return; }
  if (G.mode !== 'play' || !S) return;
  FX.time += dt;
  if (!S.over) {
    if (G.skip) stepSkip(dt);
    else if (!G.inside && !G.menu) {
      updatePlayer(dt);
      if (S.scene === 'school') trailUpdate();
      G.acc += dt * TIME_RATE * G.speed;
      let guard = 0;
      while (G.acc >= 1 && guard++ < 60) {
        G.acc -= 1; tickMinute(actNow());
        if (G.collapse || S.over) break;
      }
    }
    if (S.scene === 'school') updateKids(dt); else if (S.scene === 'town') { updateNpcs(dt); updateCars(dt); }
    if (G.collapse) doCollapse();
  }
  if (S.over && !G.overShown) showOver();
  if (G.kick && !G.skip && !G.collapse && !S.over) { G.kick = false; checkInteriorHours(); }
  updateNear();
  if (G.mode === 'play' && S) { popupTick(); hangCheck(); }
  const now = performance.now();
  if (now - G.lastHud > 120) { G.lastHud = now; updateHud(); }
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  tuneQuality(now - lastFrame);
  lastFrame = now;
  try {
    update(dt);
    updParticles(dt); stepWipe(dt); stepConfetti(dt); stepGig(dt); stepFishing(dt);
    if (G.mode === 'play' && S) { if (!(G.skip && (G.skip.job || G.skip.scene))) render(dt); }
    if (G.skip && G.skip.scene) SC.draw(dt);
    else if (G.mode === 'title') titleFrame(dt);
    if (G.skip && G.skip.dream) drawDream(dt);
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}

/* ============================ boot ============================ */
function boot() {
  bindInput();
  bindPanel();
  $('#btnStart').addEventListener('click', () => { SFX.init(); startCutscene(); });
  $('#btnContinue').addEventListener('click', () => { SFX.init(); continueGame(); });
  $('#cutSkip').addEventListener('click', finishCut);
  $('#degList').addEventListener('click', e => { const b = e.target.closest('.deg'); if (b) pickDegree(b.dataset.id); });
  $('#btnAccept').addEventListener('click', () => { if (pickedDegree) { SFX.chime('pay'); startNewGame(pickedDegree); } });
  $('#bMenu').addEventListener('click', openMenu);
  $('#mClose').addEventListener('click', closeMenu);
  $('#mResume').addEventListener('click', closeMenu);
  bindPhone(); bindFishing();
  window.addEventListener('keydown', e => { if (!$('#lvl').hidden && e.code === 'Escape') e.stopImmediatePropagation(); }, true);
  $('#mLife').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goToPlace(b.dataset.go); });
  $('#mRestart').addEventListener('click', () => {
    if ($('#mConfirm').hidden) { $('#mConfirm').hidden = false; $('#mRestart').textContent = 'Yes, start over'; return; }
    closeMenu(); clearSave(); toTitle();
  });
  $('#oAgain').addEventListener('click', toTitle);
  $('#dreamA').addEventListener('click', () => chooseDream(0));
  $('#dreamB').addEventListener('click', () => chooseDream(1));
  $('#dreamWake').addEventListener('click', wakeEarly);
  $('#bSpeed').addEventListener('click', () => {
    G.speed = G.speed === 1 ? 2 : G.speed === 2 ? 4 : 1;
    $('#bSpeed').textContent = G.speed + 'x';
  });
  $('#bSound').addEventListener('click', () => {
    SFX.init();
    if (G.sound && G.music) { G.music = false; MUSIC.stop(); }
    else if (G.sound) { G.sound = false; SFX.applause(false); }
    else { G.sound = true; G.music = true; MUSIC.start(); }
    $('#bSound').textContent = !G.sound ? 'Muted' : G.music ? 'Music' : 'Sound';
  });
  const fitTop = () => $('#app').style.setProperty('--top-h', ($('#stage').offsetTop || 0) + 'px');
  if (window.ResizeObserver) { const ro = new ResizeObserver(fitTop); ro.observe($('#hud')); ro.observe($('#goal')); }
  window.addEventListener('resize', fitTop);
  toTitle();
  requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(frame); });
}
boot();
