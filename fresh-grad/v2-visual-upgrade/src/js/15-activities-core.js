/* ============================ shift activities ============================ */
/* Every job has a hands-on activity in place of the old progress bar. A game builds its own stage, reports a 0..1 performance, and that scales the shift pay (90% to 120% of base). The clock keeps running underneath: the same minutes, hunger, thirst and energy drain as before. */
const JA = { games: {}, lastPerf: 0 };
const JR = (a, b) => a + Math.random() * (b - a);
const JI = (a, b) => Math.floor(JR(a, b + 1));
const JPICK = a => a[Math.floor(Math.random() * a.length)];
const JSHUF = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; } return r; };
const JGLYPH = (function () {
  const wrap = body => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  // an eight-tooth gear traced as one outline
  let teeth = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a), px = -s2, py = c; const p = (r, w) => (12 + c * r + px * w).toFixed(2) + ' ' + (12 + s2 * r + py * w).toFixed(2); teeth += (i ? 'L' : 'M') + p(7.2, -2.5) + 'L' + p(9.7, -1.6) + 'L' + p(9.7, 1.6) + 'L' + p(7.2, 2.5); }
  return {
    bug: wrap('<path d="M8.5 8.5a3.5 3.5 0 0 1 7 0V15a3.5 3.5 0 0 1-7 0z" fill="currentColor" fill-opacity=".16"/><path d="M12 8v11.5M3.5 12.5h5M15.5 12.5h5M5 6.5l3.5 2M19 6.5l-3.5 2M5 19l3.5-2.2M19 19l-3.5-2.2M10 4.2 9 2.5M14 4.2l1-1.7"/>'),
    gear: wrap('<path d="' + teeth + 'Z" fill="currentColor" fill-opacity=".16" transform="rotate(11.25 12 12)"/><circle cx="12" cy="12" r="7.3" fill="currentColor" fill-opacity=".1"/><circle cx="12" cy="12" r="3"/>'),
    cross: wrap('<path d="M9.2 3h5.6v6.2H21v5.6h-6.2V21H9.2v-6.2H3V9.2h6.2z" fill="currentColor" fill-opacity=".16"/><path d="M12 8.5v7M8.5 12h7" stroke-width="1.5" opacity=".7"/>'),
    chart: wrap('<path d="M5 20v-7M12 20V5M19 20v-10M3 20.5h18" /><path d="M4.2 9.5 9 5.2l4 3 7-5" /><path d="M5 20v-7h0M12 20V5" stroke-width="3.2" opacity=".18"/>'),
    star: wrap('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" fill-opacity=".18"/>'),
    flame: wrap('<path d="M12 2.8c.9 4 5.2 5.6 5.2 10.4a5.2 5.2 0 0 1-10.4 0c0-2.2 1.1-3.6 2.3-4.7.3 1.5 1 2.3 2 2.5-.5-3.2-.2-5.6.9-8.2z" fill="currentColor" fill-opacity=".16"/><path d="M12 20a2.500 2.500 0 0 1-2.500-2.500c0-1.400 1-2.200 1.600-3.300.6.800 1 1 1.400 1 .6.6 2 1.400 2 2.800A2.500 2.500 0 0 1 12 20z" stroke-width="1.400" fill="currentColor" fill-opacity=".35"/>')
  };
})();
JA.rank = p => p >= 0.92 ? 'S' : p >= 0.8 ? 'A' : p >= 0.62 ? 'B' : p >= 0.4 ? 'C' : 'D';
JA.RANKS = ['S', 'A', 'B', 'C', 'D'];
JA.mult = p => Math.round((0.9 + (hasPerk('workhorse') ? 0.35 : 0.3) * clamp(p, 0, 1)) * 1000) / 1000;
/* every raise makes the work a little brisker */
JA.diff = () => 1 + Math.min(0.3, 0.03 * Math.floor(S.shifts / job().raiseEvery));
/* tired hands are slower, so timers run a little short */
JA.focus = () => S.energy < 20 ? 0.8 : S.energy < 35 ? 0.9 : 1;
JA.cur = () => (G.skip && G.skip.job) || null;

function jpop(host, ref, text, cls) {
  if (!host || !ref) return;
  const p = el('span', 'jpop ' + (cls || ''), text);
  const hr = host.getBoundingClientRect(), rr = ref.getBoundingClientRect();
  p.style.left = clamp(rr.left - hr.left + rr.width / 2, 48, Math.max(48, hr.width - 48)) + 'px';
  p.style.top = (rr.top - hr.top + rr.height * 0.3) + 'px';
  host.appendChild(p);
  setTimeout(() => p.remove(), 950);
}
const jtone = (f, d, v) => { try { SFX.beep(f, d || 0.09, 'triangle', v || 0.05); } catch (e) { /* audio is optional */ } };

/* ---------- opening, running and closing an activity ---------- */
JA.open = function (k, o) {
  const def = JA.games[o.activity], j = job(), beat = k.kind === 'beat';
  const J = { k, o, def, id: o.activity, beat, phase: 'intro', t: 0, frac: 0, progress: 0, perf: 0, over: false, g: null, dur: Math.max(8, o.secs), diff: JA.diff(), focus: JA.focus(), auto: 0, shown: '', shownClock: '' };
  k.job = J; k.paused = true;
  const root = $('#job');
  root.style.setProperty('--ja', j.accent); root.style.setProperty('--jb', j.roof);
  root.dataset.game = J.id; root.dataset.beat = beat ? '1' : '0';
  $('#jMark').innerHTML = def.glyph;
  $('#jTitle').textContent = beat ? o.title : j.job;
  $('#jSub').textContent = beat ? (o.sub || '') : j.employer + ' · ' + o.title;
  $('#jClock').textContent = clockStr(S.t);
  $('#jLeft').textContent = beat ? '' : hoursStr(k.total) + ' shift';
  $('#jBarFill').style.width = '0%';
  $('#jPerf').textContent = '–';
  $('#jStage').innerHTML = ''; $('#jFoot').textContent = '';
  JFX.clear();
  root.hidden = false;
  if (beat) JA.begin(); else JA.intro(J);
};
JA.intro = function (J) {
  const st = $('#jStage'), d = J.def, jb = job();
  st.innerHTML = '';
  const box = el('div', 'jintro');
  const hero = el('div', 'jhero'); hero.innerHTML = JART[J.id] ? JART[J.id](jb.roof, jb.accent) : ''; box.appendChild(hero);
  const gl = el('div', 'jglyph'); gl.innerHTML = d.glyph; box.appendChild(gl);
  box.appendChild(el('p', 'jeye', 'Today’s shift'));
  box.appendChild(el('h2', '', d.name));
  box.appendChild(el('p', 'jgoal', d.goal));
  const ul = el('ul', 'jhow'); d.how.forEach(t => ul.appendChild(el('li', '', t))); box.appendChild(ul);
  const rec = S.ja && S.ja[J.id];
  if (rec) { const bp = el('p', 'jbest'), brk = JA.rank(rec.best); bp.appendChild(el('span', 'jb-rk r' + brk, brk)); bp.appendChild(el('span', '', 'Your best: ' + brk + ' (' + Math.round(rec.best * 100) + '%) · played ' + rec.plays + (rec.plays === 1 ? ' time' : ' times'))); box.appendChild(bp); }
  const row = el('div', 'jrow');
  const go = el('button', 'btn', 'Clock in'); go.type = 'button';
  const au = el('button', 'btn ghost', 'Autopilot · 90% pay'); au.type = 'button';
  au.title = 'Skip the activity and let the shift run itself';
  go.addEventListener('click', JA.begin); au.addEventListener('click', JA.autopilot);
  row.appendChild(go); row.appendChild(au); box.appendChild(row);
  st.appendChild(box);
  $('#jFoot').textContent = 'Play well to earn up to 120% of base pay';
  try { go.focus({ preventScroll: true }); } catch (e) { /* focus is a nicety */ }
};
JA.begin = function () {
  const J = JA.cur();
  if (!J || J.phase === 'play' || J.phase === 'result') return;
  SFX.init();
  J.phase = 'play'; J.t = 0; J.k.paused = false;
  const st = $('#jStage'); st.innerHTML = '';
  $('#jFoot').textContent = J.def.keys || '';
  J.g = J.def.start(J, st) || {};
};
JA.autopilot = function () {
  const J = JA.cur(), k = G.skip;
  if (!J || J.phase !== 'intro') return;
  k.job = null; k.perfMult = 0.9; k.rank = 'autopilot';
  k.rate = k.left / clamp(k.left / 60 * 0.9, 2, 5);
  k.paused = false;
  $('#job').hidden = true; $('#jStage').innerHTML = '';
  $('#skipTitle').textContent = J.o.title; $('#skipSub').textContent = 'Autopilot · ' + (J.o.sub || '');
  $('#skipClock').textContent = clockStr(S.t); $('#skipBar span').style.width = '0%';
  $('#skip').hidden = false;
};
JA.hud = function (J) {
  const f = J.beat ? J.progress : J.frac;
  $('#jBarFill').style.width = (clamp(f, 0, 1) * 100).toFixed(1) + '%';
  const cl = clockStr(S.t);
  if (cl !== J.shownClock) { J.shownClock = cl; $('#jClock').textContent = cl; }
  const p = J.def.perf(J);
  const txt = p == null ? '–' : JA.rank(p) + ' · ' + Math.round(p * 100) + '%';
  if (txt !== J.shown) { J.shown = txt; $('#jPerf').textContent = txt; }
};
/* called every frame from stepSkip while an activity is on screen */
JA.frame = function (dt) {
  const J = JA.cur();
  if (!J) return;
  if (J.phase === 'play') {
    J.t += dt;
    J.frac = J.beat ? clamp(J.progress, 0, 1) : clamp(1 - G.skip.left / G.skip.total, 0, 1);
    J.def.tick(J, dt);
    JA.hud(J);
  } else if (J.phase === 'result' && J.beat) {
    J.auto -= dt;
    if (J.auto <= 0) endSkip(false);
  }
};
JA.finish = function () {
  const J = JA.cur(), k = G.skip;
  if (!J || J.phase !== 'play') return;
  J.phase = 'result'; k.paused = true;
  const r = J.def.result(J);
  J.perf = clamp(r.perf, 0, 1);
  JA.lastPerf = J.perf;
  const rk = JA.rank(J.perf);
  S.ja = S.ja || {};
  const rec = S.ja[J.id] || (S.ja[J.id] = { best: 0, plays: 0 });
  rec.plays++; rec.best = Math.max(rec.best, Math.round(J.perf * 100) / 100);
  if (!J.beat) { k.perfMult = JA.mult(J.perf); k.rank = 'rank ' + rk; }
  $('#jBarFill').style.width = '100%'; $('#jClock').textContent = clockStr(S.t);
  const pt = rk + ' · ' + Math.round(J.perf * 100) + '%';
  $('#jPerf').textContent = pt; J.shown = pt;
  JA.showResult(J, r, rk);
  SFX.chime(J.perf >= 0.62 ? 'pay' : 'door');
};
JA.showResult = function (J, r, rk) {
  const st = $('#jStage'); st.innerHTML = '';
  const box = el('div', 'jres k' + rk + ' r' + rk + (J.beat ? ' beat' : ''));
  const ring = JA.medal(rk, J.perf); box.appendChild(ring);
  const mid = el('div', 'jres-mid');
  mid.appendChild(el('h2', '', r.head || ['Flawless shift', 'Great shift', 'Solid shift', 'Rough shift', 'Rocky shift'][JA.RANKS.indexOf(rk)]));
  mid.appendChild(el('p', 'jq', J.def.quips[JA.RANKS.indexOf(rk)]));
  box.appendChild(mid);
  const grid = el('div', 'jstats');
  (r.rows || []).forEach(x => { const d = el('div'); d.appendChild(el('b', '', String(x[1]))); d.appendChild(el('small', '', x[0])); grid.appendChild(d); });
  box.appendChild(grid);
  if (J.beat) {
    const bn = J.def.bonus(J.perf);
    box.appendChild(el('p', 'jbonus ' + (bn >= 0 ? 'up' : 'down'), 'Class engagement ' + (bn >= 0 ? '+' : '−') + Math.abs(bn)));
  } else {
    const base = Math.round(S.pending * 100) / 100, mult = JA.mult(J.perf), tot = Math.round(S.pending * mult * 100) / 100;
    const bonus = Math.round((tot - base) * 100) / 100, pc = Math.round((mult - 1) * 100);
    const pay = el('div', 'jpay');
    const hd = el('div', 'jp-head'); hd.appendChild(el('span', '', job().employer)); hd.appendChild(el('b', '', 'Shift slip')); pay.appendChild(hd);
    [['Base pay', fmt(base)], ['Performance ' + (pc >= 0 ? '+' : '−') + Math.abs(pc) + '%', (bonus >= 0 ? '+' : '−') + fmt(Math.abs(bonus))], ['Take-home', fmt(tot)]].forEach((x, i) => {
      const d = el('div', i === 2 ? 'tot' : ''); d.appendChild(el('span', '', x[0])); d.appendChild(el('b', '', x[1])); pay.appendChild(d);
    });
    const ft = el('div', 'jp-foot'); ft.appendChild(el('i', 'jp-bar')); ft.appendChild(el('i', 'jp-stamp', rk)); pay.appendChild(ft);
    box.appendChild(pay);
  }
  const btn = el('button', 'btn', J.beat ? 'Continue' : 'Clock out'); btn.type = 'button';
  btn.addEventListener('click', () => endSkip(false));
  box.appendChild(btn);
  st.appendChild(box);
  J.auto = 1.7;
  $('#jFoot').textContent = J.beat ? '' : 'Pay lands in your wallet when you clock out';
  try { btn.focus({ preventScroll: true }); } catch (e) { /* focus is a nicety */ }
  if (J.perf >= 0.8) { JFX.burst(ring, 'stars', { n: rk === 'S' ? 16 : 8, col: ['#ffd778', '#fff3c4', '#ffffff'] }); if (rk === 'S') JFX.burst(ring, 'confetti', { n: 40 }); }
};
/* the skip is ending (normally, early, or by a blackout): settle the multiplier and clean up */
JA.leave = function (k) {
  const J = k.job;
  if (!J) return;
  if (J.phase === 'play') {
    const p = J.def.perf(J);
    if (J.beat) JA.lastPerf = p == null ? 0.5 : p;
    else { k.perfMult = JA.mult(p == null ? 0.5 : p); k.rank = 'cut short'; }
  } else if (J.phase === 'intro' && !J.beat) { k.perfMult = 0.9; }
  try { if (J.def.stop) J.def.stop(J); } catch (e) { console.error(e); }
  k.job = null;
  JFX.clear();
  $('#job').hidden = true; $('#jStage').innerHTML = '';
};
window.addEventListener('keydown', e => {
  const J = JA.cur();
  if (!J || J.phase !== 'play' || G.menu || e.ctrlKey || e.metaKey || e.altKey) return;
  if (J.def.key && J.def.key(J, e)) e.preventDefault();
});

