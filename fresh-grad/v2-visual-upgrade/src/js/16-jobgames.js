/* ====================== Software Developer: Bug Hunt ====================== */
const CS_CODE = [
  'async function checkout(cart) {',
  '  const total = sum(cart.items);',
  '  if (total > limit) return fail();',
  '  await charge(user.id, total);',
  "  cache.set('last', total);",
  "  notify(user.email, 'paid');",
  '  return { ok: true, total };',
  '}'
];
const CS_RX = /(\/\/.*$)|('[^']*')|\b(async|await|function|const|let|if|return|new|throw)\b|\b(\d+|true|false)\b|\b([A-Za-z_][\w.]*)(?=\()/g;
function csHighlight(s) {
  const e = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return e.replace(CS_RX, (m, c, str, kw, num, fn) => '<i class="' + (c ? 'c' : str ? 's' : kw ? 'k' : num ? 'n' : 'f') + '">' + m + '</i>');
}
JA.games.cs = {
  name: 'Bug Hunt', glyph: JGLYPH.bug,
  goal: 'Production is live and bugs keep slipping in. Squash each one before its timer runs out.',
  how: ['Tap a bug to fix it. Gold bolts are critical and count double.', 'A bug that times out is a production incident and breaks your streak.', 'On a keyboard, press the line number (1 to 8).'],
  keys: 'Tap bugs to fix them · or press 1–8 for the line',
  quips: ['Zero-downtime hero. The pager stayed silent.', 'Clean deploys all day long.', 'A few bugs slipped through, but nothing fell over.', 'The pager went off more than once.', 'Prod is on fire. Again.'],
  start(J, host) {
    const g = { lines: [], bugs: [], spawn: 0.7, fixed: 0, miss: 0, wFix: 0, wMiss: 0, combo: 0, best: 0, health: 100, spawned: 0 };
    host.innerHTML = '<div class="gm cs"><div class="cs-top"><span class="cs-file"><i></i>checkout.js</span><span class="cs-hb">Prod health<em><b></b></em></span><span class="cs-sk">Streak <b>0</b></span></div><div class="cs-code"></div></div>';
    g.host = host; g.hb = $('.cs-hb b', host); g.sk = $('.cs-sk b', host); g.hbw = $('.cs-hb', host);
    const code = $('.cs-code', host);
    CS_CODE.forEach((src, i) => {
      const row = el('div', 'cl');
      row.innerHTML = '<span class="ln">' + (i + 1) + '</span><code>' + csHighlight(src) + '</code>';
      code.appendChild(row);
      g.lines.push({ row, bug: null, i });
    });
    code.addEventListener('pointerdown', e => {
      const b = e.target.closest('.bug'); if (!b) return;
      e.preventDefault();
      const bug = g.bugs.find(x => x.el === b);
      if (bug) JA.games.cs.fix(J, bug);
    });
    return g;
  },
  spawnBug(J) {
    const g = J.g, free = g.lines.filter(l => !l.bug);
    if (!free.length) return;
    const ln = JPICK(free), crit = J.frac > 0.15 && Math.random() < 0.2;
    const life = (crit ? 2.0 : 3.1 - J.frac * 0.9) * J.focus / J.diff;
    const b = el('button', 'bug' + (crit ? ' crit' : '')); b.type = 'button'; b.tabIndex = -1;
    b.setAttribute('aria-label', (crit ? 'Critical bug' : 'Bug') + ' on line ' + (ln.i + 1));
    b.innerHTML = crit ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 5 13.5h6L10 22l9-12h-6z"/></svg>' : JGLYPH.bug;
    ln.row.appendChild(b); ln.row.classList.add('hot');
    const bug = { ln, el: b, crit, life, t: life, w: crit ? 2 : 1 };
    ln.bug = bug; g.bugs.push(bug); g.spawned++;
    jtone(crit ? 880 : 520, 0.05, 0.02);
  },
  fix(J, bug) {
    const g = J.g, i = g.bugs.indexOf(bug);
    if (i < 0) return;
    g.bugs.splice(i, 1); bug.ln.bug = null;
    g.fixed++; g.wFix += bug.w; g.combo++; g.best = Math.max(g.best, g.combo);
    g.health = Math.min(100, g.health + 3);
    bug.ln.row.classList.remove('hot'); bug.ln.row.classList.add('ok');
    setTimeout(() => bug.ln.row.classList.remove('ok'), 380);
    jpop(g.host, bug.el, bug.crit ? '+2' : (g.combo >= 4 ? 'x' + g.combo : '+1'), bug.crit ? 'gold' : 'good');
    bug.el.classList.add('fixed'); setTimeout(() => bug.el.remove(), 260);
    jtone(660 + Math.min(g.combo, 8) * 40, 0.08, 0.05);
  },
  tick(J, dt) {
    const g = J.g;
    g.spawn -= dt;
    if (g.spawn <= 0 && J.frac < 0.93) {
      if (g.bugs.length < (J.frac < 0.35 ? 3 : 4)) JA.games.cs.spawnBug(J);
      g.spawn = lerp(1.4, 0.8, J.frac) / J.diff * JR(0.85, 1.15);
    }
    for (let i = g.bugs.length - 1; i >= 0; i--) {
      const b = g.bugs[i];
      b.t -= dt;
      b.el.style.setProperty('--p', Math.max(0, b.t / b.life).toFixed(3));
      if (b.t <= 0) {
        g.bugs.splice(i, 1); b.ln.bug = null;
        g.miss++; g.wMiss += b.w; g.combo = 0; g.health = Math.max(0, g.health - 14);
        b.ln.row.classList.remove('hot'); b.ln.row.classList.add('bad');
        setTimeout(() => b.ln.row.classList.remove('bad'), 450);
        jpop(g.host, b.el, 'Incident', 'bad');
        b.el.remove();
        SFX.chime('bad');
      }
    }
    g.hb.style.width = g.health + '%';
    g.hbw.classList.toggle('low', g.health < 40);
    g.sk.textContent = g.combo;
  },
  key(J, e) {
    const n = +e.key;
    if (!(n >= 1 && n <= 8)) return false;
    const ln = J.g.lines[n - 1];
    if (ln.bug) JA.games.cs.fix(J, ln.bug); else J.g.combo = 0;
    return true;
  },
  perf(J) {
    const g = J.g, tot = g.wFix + g.wMiss;
    return tot < 3 ? null : g.wFix / tot;
  },
  result(J) {
    const g = J.g, tot = g.wFix + g.wMiss;
    return { perf: tot ? g.wFix / tot : 0.5, rows: [['Bugs fixed', g.fixed + ' / ' + (g.fixed + g.miss)], ['Best streak', g.best], ['Incidents', g.miss]] };
  }
};

/* ====================== Design Engineer: Pipe Fitter ====================== */
const EN_N = 1, EN_E = 2, EN_S = 4, EN_W = 8;
const enRot = m => ((m << 1) | (m >> 3)) & 15;
function enMask(c) { let m = c.type === 's' ? 10 : 3; for (let i = 0; i < (c.rot & 3); i++) m = enRot(m); return m; }
const EN_D = [[0, -1, EN_N, EN_S], [1, 0, EN_E, EN_W], [0, 1, EN_S, EN_N], [-1, 0, EN_W, EN_E]];
const EN_PATH = { s: 'M0 50H100', c: 'M50 0V30Q50 50 70 50H100' };
function enGenPath(cols, rows) {
  for (let tries = 0; tries < 60; tries++) {
    let c = 0, r = JI(0, rows - 1);
    const path = [[c, r]], seen = {}; seen[c + ',' + r] = 1;
    let guard = 0;
    while (c < cols - 1 && guard++ < 90) {
      const opts = [[1, 0], [1, 0], [0, -1], [0, 1]].filter(d => { const nr = r + d[1]; return nr >= 0 && nr < rows && !seen[(c + d[0]) + ',' + nr]; });
      const d = JPICK(opts); c += d[0]; r += d[1]; path.push([c, r]); seen[c + ',' + r] = 1;
    }
    if (c === cols - 1 && path.length >= cols + 2) return path;
  }
  return cols > 4 ? [[0, 1], [1, 1], [1, 2], [2, 2], [3, 2], [3, 1], [4, 1]] : [[0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3]];
}
JA.games.eng = {
  name: 'Pipe Fitter', glyph: JGLYPH.gear,
  goal: 'A hydraulic line has to run from the pump to the actuator. Turn the pipe sections until the fluid flows all the way through.',
  how: ['Tap a section to turn it a quarter turn.', 'Fluid glows amber as the line connects from the pump.', 'Every sealed line is one finished blueprint. Faster is better.'],
  keys: 'Tap a section to turn it · arrow keys + Enter also work',
  quips: ['Tolerances perfect. The shop floor applauds.', 'Clean lines, tight seals.', 'The line holds, with a few drips.', 'Lots of leaks to chase down.', 'Everything is dripping.'],
  start(J, host) {
    const narrow = window.matchMedia && window.matchMedia('(max-width:520px)').matches;
    const g = { cols: narrow ? 4 : 5, rows: narrow ? 5 : 4, solved: 0, taps: 0, cells: [], path: [], wet: null, sealed: false, wait: 0, cur: null, total: 0, tiles: [] };
    host.innerHTML = '<div class="gm en"><div class="en-top"><span>Blueprint <b class="n">1</b></span><span class="en-st">Line open</span><span>Sealed <b class="s">0</b></span></div><div class="pg"></div></div>';
    g.host = host; g.grid = $('.pg', host); g.grid.style.setProperty('--cols', g.cols); g.n = $('.en-top .n', host); g.s = $('.en-top .s', host); g.st = $('.en-st', host);
    g.grid.addEventListener('pointerdown', e => {
      const b = e.target.closest('.pt'); if (!b) return;
      e.preventDefault();
      JA.games.eng.turn(J, +b.dataset.c, +b.dataset.r);
    });
    g.target = Math.max(2, J.dur / 11);
    J.g = g;
    JA.games.eng.build(J);
    return g;
  },
  build(J) {
    const g = J.g;
    g.path = enGenPath(g.cols, g.rows);
    g.cells = [];
    for (let r = 0; r < g.rows; r++) { g.cells.push([]); for (let c = 0; c < g.cols; c++) g.cells[r].push({ type: Math.random() < 0.5 ? 's' : 'c', rot: JI(0, 3) }); }
    const solRot = {};
    g.path.forEach((p, i) => {
      const prev = g.path[i - 1], next = g.path[i + 1];
      const bit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return dx === 1 ? EN_E : dx === -1 ? EN_W : dy === -1 ? EN_N : EN_S; };
      const m = (prev ? bit(p, prev) : EN_W) | (next ? bit(p, next) : EN_E);
      const type = (m === 10 || m === 5) ? 's' : 'c';
      const cell = { type, rot: 0 };
      for (let k = 0; k < 4; k++) { cell.rot = k; if (enMask(cell) === m) break; }
      solRot[p[0] + ',' + p[1]] = cell.rot;
      g.cells[p[1]][p[0]] = cell;
    });
    // scramble the route until it needs a handful of turns
    for (let tries = 0; tries < 30; tries++) {
      let off = 0;
      g.path.forEach(p => {
        const cell = g.cells[p[1]][p[0]], want = solRot[p[0] + ',' + p[1]];
        cell.rot = Math.random() < 0.8 ? (want + JI(1, 3)) & 3 : want;
        if (enMask(Object.assign({}, cell, { rot: want })) !== enMask(cell)) off++;
      });
      if (off >= 3 && !JA.games.eng.flow(g).solved) break;
    }
    g.sealed = false; g.total++;
    g.n.textContent = g.total; g.st.textContent = 'Line open'; g.st.classList.remove('ok');
    // render
    const sr = g.path[0][1], er = g.path[g.path.length - 1][1];
    const gr = g.grid; gr.innerHTML = ''; g.tiles = [];
    gr.classList.remove('sealed'); gr.classList.add('fresh'); setTimeout(() => gr.classList.remove('fresh'), 360);
    const node = (col, row, cls, label) => {
      const d = el('div', 'pn ' + cls); d.style.gridColumn = col; d.style.gridRow = row;
      d.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="9" width="36" height="22" rx="8"/><circle cx="20" cy="20" r="6"/>' + (cls === 'src' ? '<path d="M20 20 24 15"/>' : '<path d="M14 20h12M20 14v12"/>') + '</svg><small>' + label + '</small>';
      return d;
    };
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const cell = g.cells[r][c];
        const b = el('button', 'pt'); b.type = 'button'; b.tabIndex = -1; b.dataset.c = c; b.dataset.r = r;
        b.setAttribute('aria-label', 'Pipe section, column ' + (c + 1) + ' row ' + (r + 1));
        b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="p0" d="' + EN_PATH[cell.type] + '"/><path class="p1" d="' + EN_PATH[cell.type] + '"/><path class="p2" d="' + EN_PATH[cell.type] + '"/></svg>';
        b.firstChild.style.setProperty('--rot', (cell.rot * 90) + 'deg');
        cell.deg = cell.rot * 90; cell.el = b;
        b.style.gridColumn = c + 2; b.style.gridRow = r + 1;
        gr.appendChild(b);
        g.tiles.push(b);
      }
    }
    gr.appendChild(node(1, sr + 1, 'src', 'PUMP')); gr.appendChild(node(g.cols + 2, er + 1, 'snk', 'ACTUATOR'));
    JA.games.eng.paint(J);
  },
  turn(J, c, r) {
    const g = J.g;
    if (g.sealed) return;
    const cell = g.cells[r][c];
    cell.rot = (cell.rot + 1) & 3; cell.deg += 90; g.taps++;
    cell.el.firstChild.style.setProperty('--rot', cell.deg + 'deg');
    jtone(240 + JI(0, 3) * 30, 0.05, 0.04);
    JA.games.eng.paint(J);
  },
  flow(g) {
    const wet = {}, q = [];
    const s = g.path[0], e = g.path[g.path.length - 1];
    if (enMask(g.cells[s[1]][s[0]]) & EN_W) { wet[s[0] + ',' + s[1]] = 1; q.push(s); }
    while (q.length) {
      const p = q.pop(), m = enMask(g.cells[p[1]][p[0]]);
      EN_D.forEach(d => {
        if (!(m & d[2])) return;
        const nc = p[0] + d[0], nr = p[1] + d[1];
        if (nc < 0 || nr < 0 || nc >= g.cols || nr >= g.rows || wet[nc + ',' + nr]) return;
        if (!(enMask(g.cells[nr][nc]) & d[3])) return;
        wet[nc + ',' + nr] = 1; q.push([nc, nr]);
      });
    }
    return { wet, solved: !!wet[e[0] + ',' + e[1]] && !!(enMask(g.cells[e[1]][e[0]]) & EN_E) };
  },
  paint(J) {
    const g = J.g, f = JA.games.eng.flow(g);
    g.wet = f.wet;
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) g.cells[r][c].el.classList.toggle('wet', !!f.wet[c + ',' + r]);
    const src = $('.pn.src', g.grid), snk = $('.pn.snk', g.grid);
    if (src) src.classList.toggle('wet', !!(enMask(g.cells[g.path[0][1]][g.path[0][0]]) & EN_W));
    if (snk) snk.classList.toggle('wet', f.solved);
    if (f.solved && !g.sealed) {
      g.sealed = true; g.solved++; g.wait = 0.75;
      g.grid.classList.add('sealed'); g.s.textContent = g.solved; g.st.textContent = 'Sealed!'; g.st.classList.add('ok');
      jpop(g.host, snk || g.grid, 'Sealed', 'good');
      jtone(523, 0.1, 0.05); jtone(784, 0.18, 0.05);
      setTimeout(() => jtone(1046, 0.2, 0.04), 110);
    }
  },
  tick(J, dt) {
    const g = J.g;
    if (g.sealed) { g.wait -= dt; if (g.wait <= 0 && J.frac < 0.97) JA.games.eng.build(J); }
  },
  key(J, e) {
    const g = J.g, k = e.key;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (mv) {
      g.cur = g.cur || [0, 0];
      g.cur = [clamp(g.cur[0] + mv[0], 0, g.cols - 1), clamp(g.cur[1] + mv[1], 0, g.rows - 1)];
    } else if (k === 'Enter' || k === ' ' || k === 'r' || k === 'R') {
      g.cur = g.cur || [0, 0];
      JA.games.eng.turn(J, g.cur[0], g.cur[1]);
    } else return false;
    g.tiles.forEach(t => t.classList.remove('cur'));
    if (g.cur) g.cells[g.cur[1]][g.cur[0]].el.classList.add('cur');
    return true;
  },
  progress(J) {
    const g = J.g;
    if (g.sealed) return 1;
    // how far the fluid already reaches along the intended route
    let n = 0;
    for (const p of g.path) { if (g.wet && g.wet[p[0] + ',' + p[1]]) n++; else break; }
    return n / g.path.length;
  },
  perf(J) {
    const g = J.g;
    if (J.t < 6 && !g.solved) return null;
    const part = g.sealed ? 0 : 0.5 * JA.games.eng.progress(J);
    return clamp((g.solved + part) / (g.target * clamp(J.frac, 0.25, 1)), 0, 1);
  },
  result(J) {
    const g = J.g;
    const part = g.sealed ? 0 : 0.5 * JA.games.eng.progress(J);
    return { perf: clamp((g.solved + part) / g.target, 0, 1), rows: [['Lines sealed', g.solved], ['Section turns', g.taps], ['Target', Math.ceil(g.target)]] };
  }
};

/* ====================== Registered Nurse: Triage Rounds ====================== */
const NU_NAMES = ['Maya R.', 'Tom B.', 'Aisha K.', 'Leo M.', 'Grace W.', 'Omar H.', 'Nina P.', 'Hal S.', 'Rosa D.', 'Ben T.', 'Iris C.', 'Jun L.', 'Pia V.', 'Walt G.'];
function nuLevels(p) { return [p.hr >= 120 ? 2 : p.hr >= 100 ? 1 : 0, p.sp < 90 ? 2 : p.sp <= 94 ? 1 : 0, p.tp >= 39.5 ? 2 : p.tp >= 38 ? 1 : 0]; }
function nuGen(frac) {
  const r = Math.random(), w = frac < 0.3 ? [0.46, 0.36] : [0.34, 0.37];
  const cat = r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2;
  const p = { name: JPICK(NU_NAMES), age: JI(6, 84), bed: JI(1, 14), hr: JI(58, 92), sp: JI(96, 99), tp: Math.round(JR(36.4, 37.5) * 10) / 10 };
  const edge = Math.random() < 0.28 + 0.22 * frac;   // some patients sit right on a line
  const set = (which, lvl, ed) => {
    if (which === 0) p.hr = lvl === 2 ? (ed ? 120 : JI(122, 152)) : (ed ? JPICK([100, 119]) : JI(102, 118));
    else if (which === 1) p.sp = lvl === 2 ? (ed ? 89 : JI(82, 89)) : (ed ? JPICK([90, 94]) : JI(91, 94));
    else p.tp = lvl === 2 ? (ed ? 39.5 : Math.round(JR(39.6, 40.8) * 10) / 10) : (ed ? JPICK([38, 39.4]) : Math.round(JR(38.1, 39.3) * 10) / 10);
  };
  if (cat >= 1) {
    const a = JI(0, 2); set(a, cat, edge);
    if (Math.random() < 0.4) set((a + JI(1, 2)) % 3, cat === 2 ? JI(1, 2) : 1, false);
  } else if (edge) {
    const a = JI(0, 2);
    if (a === 0) p.hr = 99; else if (a === 1) p.sp = 95; else p.tp = 37.9;
  }
  p.lv = nuLevels(p);
  p.cat = Math.max(p.lv[0], p.lv[1], p.lv[2]);   // the truth comes from the vitals themselves
  p.w = p.cat === 2 ? 1.5 : 1;
  return p;
}
function nuWhy(p) {
  if (p.cat === 0) return 'All vitals are in the normal range';
  const nm = ['HR ' + p.hr, 'SpO₂ ' + p.sp, 'Temp ' + p.tp.toFixed(1)];
  return nm.filter((x, i) => p.lv[i] === p.cat).join(' · ') + (p.cat === 2 ? ' is critical' : ' is borderline');
}
function nuEcg(ph) {
  const bump = (x, m, s) => Math.exp(-((x - m) * (x - m)) / (2 * s * s));
  return 0.14 * bump(ph, 0.14, 0.03) - 0.14 * bump(ph, 0.285, 0.008) + 1.0 * bump(ph, 0.31, 0.009) - 0.3 * bump(ph, 0.335, 0.009) + 0.24 * bump(ph, 0.56, 0.045);
}
JA.games.nurse = {
  name: 'Triage Rounds', glyph: JGLYPH.cross,
  goal: 'Patients keep arriving at the ward. Read each monitor and sort them fast: stable, monitor or urgent.',
  how: ['Check the three vitals against the rules at the top.', 'The worst single vital decides the group.', 'Urgent patients count extra. Sending a patient too low is the worst mistake.'],
  keys: 'Tap a button · or press 1 stable, 2 monitor, 3 urgent',
  quips: ['Every patient in the right bed. A textbook shift.', 'Sharp eyes and steady hands.', 'Mostly right, with a couple of close calls.', 'Several patients were sorted wrong.', 'Triage went sideways. Time for a long break.'],
  start(J, host) {
    const g = { q: [], arrive: 1.6, w: 0, got: 0, seen: 0, ok: 0, over: 0, under: 0, lost: 0, streak: 0, best: 0, fb: 0, ecg: null };
    host.innerHTML = '<div class="gm nu"><div class="nu-leg"><span class="s"><b>STABLE</b>Everything else</span><span class="m"><b>MONITOR</b>SpO₂ 90–94 · HR 100–119 · T 38–39.4</span><span class="u"><b>URGENT</b>SpO₂ &lt;90 · HR 120+ · T 39.5+</span></div>' +
      '<div class="nu-main"><div class="nu-card"></div><div class="nu-fb"></div></div>' +
      '<div class="nu-btns"><button type="button" class="s" data-a="0"><b>Stable</b><small>1 · send home</small></button><button type="button" class="m" data-a="1"><b>Monitor</b><small>2 · obs bed</small></button><button type="button" class="u" data-a="2"><b>Urgent</b><small>3 · doctor now</small></button></div></div>';
    g.host = host; g.main = $('.nu-main', host); g.card = $('.nu-card', host); g.fbEl = $('.nu-fb', host);
    $('.nu-btns', host).addEventListener('pointerdown', e => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault(); JA.games.nurse.answer(J, +b.dataset.a);
    });
    g.q.push(nuGen(0), nuGen(0));
    J.g = g;
    JA.games.nurse.render(J);
    return g;
  },
  render(J) {
    const g = J.g, p = g.q[0], card = g.card;
    g.ecg = null;
    if (!p) { card.className = 'nu-card empty'; card.innerHTML = '<div class="nu-wait">The ward is quiet<small>Next patient is on the way…</small></div>'; return; }
    card.className = 'nu-card in';
    card.innerHTML = '<div class="nu-id"><b>Bed ' + p.bed + ' · ' + p.name + '</b><small>' + p.age + ' yrs</small><em></em></div>' +
      '<div class="nu-vit"><div class="v hr"><small>HR bpm</small><b>' + p.hr + '</b><canvas width="150" height="46"></canvas></div>' +
      '<div class="v sp"><small>SpO₂ %</small><b>' + p.sp + '</b></div>' +
      '<div class="v tp"><small>TEMP °C</small><b>' + p.tp.toFixed(1) + '</b></div></div>';
    g.ecg = $('canvas', card);
    JA.games.nurse.count(J);
  },
  count(J) {
    const g = J.g, em = $('.nu-id em', g.card);
    if (em) { em.textContent = g.q.length + ' waiting'; em.classList.toggle('hot', g.q.length >= 4); }
  },
  say(J, text, cls) { const g = J.g; g.fbEl.textContent = text; g.fbEl.className = 'nu-fb on ' + (cls || ''); g.fb = 1.9; },
  answer(J, a) {
    const g = J.g, p = g.q[0];
    if (!p) return;
    g.q.shift();
    const s = a === p.cat ? 1 : a > p.cat ? 0.35 : 0;
    g.w += p.w; g.got += s * p.w; g.seen++;
    const old = g.card.cloneNode(true);
    old.className = 'nu-card out o' + a; g.main.appendChild(old); setTimeout(() => old.remove(), 340);
    if (s === 1) {
      g.ok++; g.streak++; g.best = Math.max(g.best, g.streak);
      JA.games.nurse.say(J, (g.streak >= 3 ? g.streak + ' in a row · ' : '') + ['Stable', 'Monitor', 'Urgent'][a] + ': ' + nuWhy(p), 'good');
      jtone(a === 2 ? 880 : 660, 0.08, 0.05);
    } else {
      g.streak = 0;
      if (a > p.cat) g.over++; else g.under++;
      JA.games.nurse.say(J, (a > p.cat ? 'A little cautious' : 'Too low!') + ' · should be ' + ['stable', 'monitor', 'urgent'][p.cat] + ': ' + nuWhy(p), a > p.cat ? 'warn' : 'bad');
      SFX.chime('bad');
    }
    JA.games.nurse.render(J);
  },
  tick(J, dt) {
    const g = J.g;
    g.arrive -= dt;
    if (g.arrive <= 0 && J.frac < 0.94) {
      g.arrive = lerp(3.0, 2.0, J.frac) / J.diff * JR(0.85, 1.15);
      g.q.push(nuGen(J.frac));
      if (g.q.length > 5) {
        const p = g.q.pop();
        g.w += p.w; g.lost++;
        JA.games.nurse.say(J, 'Waiting room full · a patient was diverted', 'bad'); SFX.chime('bad');
      }
      if (g.q.length === 1) JA.games.nurse.render(J); else JA.games.nurse.count(J);
    }
    if (g.fb > 0) { g.fb -= dt; if (g.fb <= 0) g.fbEl.classList.remove('on'); }
    if (g.ecg && g.q[0]) {
      const c = g.ecg.getContext('2d'), W = g.ecg.width, H = g.ecg.height, per = 60 / g.q[0].hr;
      c.clearRect(0, 0, W, H);
      c.lineWidth = 1.8; c.lineJoin = 'round'; c.strokeStyle = '#59f0a0'; c.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const T = J.t + x / W * 2.4, ph = (T % per) / per, y = H * 0.66 - nuEcg(ph) * H * 0.55;
        if (x) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.stroke();
    }
  },
  key(J, e) {
    const a = { '1': 0, '2': 1, '3': 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }[e.key];
    if (a == null) return false;
    JA.games.nurse.answer(J, a);
    return true;
  },
  perf(J) { const g = J.g; return g.seen + g.lost < 3 ? null : g.got / g.w; },
  result(J) {
    const g = J.g;
    return { perf: g.w ? g.got / g.w : 0.5, rows: [['Patients seen', g.seen], ['Triaged correctly', g.ok], ['Sent too low', g.under], ['Diverted', g.lost]] };
  }
};

/* ====================== Account Manager: Close the Deal ====================== */
const BZ_CLIENTS = [['Priya Nair', 'Brightleaf Studio'], ['Marcus Cole', 'Cole & Sons Hardware'], ['Dana Whitfield', 'Orbit Logistics'], ['Tomas Rivera', 'Rivera Foods'], ['Yuki Tanaka', 'Tanaka Tech'], ['Grace Okoye', 'Okoye Capital'], ['Sam Ellery', 'Ellery Print Co.'], ['Lena Fischer', 'Fischer Dental'], ['Raj Patel', 'Patel Freight'], ['Ines Duarte', 'Duarte Design'], ['Walt Henley', 'Henley Motors'], ['Ola Brandt', 'Brandt Bakery']];
const BZ_TIER = [{ n: 'Startup', lo: 20, hi: 40 }, { n: 'Mid-size', lo: 40, hi: 70 }, { n: 'Enterprise', lo: 70, hi: 100 }];
const BZ_MOOD = { eager: { t: 'Eager to buy', a: 0.62, b: 1, face: 'happy' }, steady: { t: 'Open to talk', a: 0.28, b: 0.72, face: 'flat' }, frugal: { t: 'Watching every dollar', a: 0, b: 0.4, face: 'hmm' } };
const BZ_SKIN = ['#f1c9a5', '#d9a07a', '#a8714d', '#7a4a32', '#f6d5b8'], BZ_HAIR = ['#2a1f18', '#5a3a22', '#1a1a1f', '#b8862f', '#7c7c82', '#8a2f2f'];
function bzFace(c, mood) {
  const mouth = { happy: 'M-11 8Q0 21 11 8', flat: 'M-9 12H9', hmm: 'M-9 13Q-2 9 9 14', bad: 'M-10 16Q0 6 10 16', glad: 'M-12 7Q0 24 12 7' }[mood];
  const brow = { bad: 'M-17 -10-6 -6M17 -10 6 -6', hmm: 'M-17 -8-6 -11M6 -10 17 -7', glad: 'M-17 -11-6 -12M6 -12 17 -11' }[mood] || 'M-17 -9-6 -10M6 -10 17 -9';
  return '<svg viewBox="-32 -32 64 64" aria-hidden="true"><circle r="26" fill="' + c.skin + '"/><path d="M-26 -3Q-30 -31 0 -31Q30 -31 26 -3Q21 -19 0 -19Q-21 -19 -26 -3Z" fill="' + c.hair + '"/><circle cx="-9" cy="-1" r="2.7" fill="#1b1410"/><circle cx="9" cy="-1" r="2.7" fill="#1b1410"/><g stroke="#1b1410" stroke-width="2" stroke-linecap="round" fill="none"><path d="' + brow + '"/><path d="' + mouth + '"/></g></svg>';
}
JA.games.biz = {
  name: 'Close the Deal', glyph: JGLYPH.chart,
  goal: 'Clients call in one at a time. Name a price they will accept, as high as you dare, before they hang up.',
  how: ['Each client has a budget range. Their mood hints where in that range they sit.', 'Too high and they push back. Three strikes and they hang up.', 'Lowball and you close, but leave money on the table.'],
  keys: 'Slide to set a price · Enter makes the offer · ← → fine-tune',
  quips: ['Every client signed at the top of their budget.', 'Strong numbers across the board.', 'Decent deals, a few left on the table.', 'Too many calls ended in a hang-up.', 'The phone line went quiet.'],
  start(J, host) {
    const g = { c: null, gap: 0.6, score: 0, deals: 0, rev: 0, calls: 0, hang: 0, left: 0, used: [], lock: false, price: 60, target: Math.max(2, J.dur / 11) };
    host.innerHTML = '<div class="gm bz"><div class="bz-top"><span>Deals <b class="d">0</b></span><span>Closed <b class="r">$0K</b></span></div>' +
      '<div class="bz-call"><div class="bz-face"></div><div class="bz-who"><b class="nm">Incoming call…</b><small class="co"></small><div class="bz-chips"></div></div><div class="bz-hearts" aria-label="Patience"></div></div>' +
      '<div class="bz-say">Phone is ringing…</div><div class="bz-timer"><span></span></div>' +
      '<div class="bz-offer"><button type="button" class="bz-st mn" aria-label="Lower offer">−</button><div class="bz-val"><small>Your offer</small><b>$60K</b></div><button type="button" class="bz-st pl" aria-label="Raise offer">+</button></div>' +
      '<div class="bz-track"><i class="band"></i><input type="range" min="10" max="110" step="1" value="60" aria-label="Offer in thousands of dollars"></div>' +
      '<button type="button" class="btn bz-go">Make offer</button></div>';
    g.host = host;
    g.face = $('.bz-face', host); g.nm = $('.nm', host); g.co = $('.co', host); g.chips = $('.bz-chips', host); g.hearts = $('.bz-hearts', host);
    g.say = $('.bz-say', host); g.val = $('.bz-val b', host); g.band = $('.band', host); g.go = $('.bz-go', host); g.timer = $('.bz-timer span', host);
    g.d = $('.bz-top .d', host); g.r = $('.bz-top .r', host); g.range = $('input', host);
    g.range.addEventListener('input', () => JA.games.biz.setPrice(J, +g.range.value));
    $('.mn', host).addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.setPrice(J, g.price - 1); });
    $('.pl', host).addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.setPrice(J, g.price + 1); });
    g.go.addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.offer(J); });
    return g;
  },
  setPrice(J, v) { const g = J.g; g.price = clamp(Math.round(v), 10, 110); g.range.value = g.price; g.val.textContent = '$' + g.price + 'K'; },
  hearts(J) {
    const g = J.g, n = g.c ? 3 - g.c.strikes : 3;
    g.hearts.innerHTML = [0, 1, 2].map(i => '<svg viewBox="0 0 24 24" class="' + (i < n ? 'on' : '') + '"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>').join('');
  },
  next(J) {
    const g = J.g;
    let nm; do { nm = JPICK(BZ_CLIENTS); } while (g.used.includes(nm[0]) && g.used.length < BZ_CLIENTS.length);
    g.used.push(nm[0]); if (g.used.length > 8) g.used.shift();
    const r = Math.random(), tier = r < 0.3 ? BZ_TIER[0] : r < 0.76 ? BZ_TIER[1] : BZ_TIER[2];
    const mk = JPICK(['eager', 'steady', 'steady', 'frugal', 'eager']), m = BZ_MOOD[mk];
    const max = Math.round(tier.lo + (tier.hi - tier.lo) * JR(m.a, m.b));
    g.c = { name: nm[0], co: nm[1], tier, mood: mk, max, strikes: 0, t: 13 * J.focus, total: 13 * J.focus, skin: JPICK(BZ_SKIN), hair: JPICK(BZ_HAIR) };
    g.calls++; g.lock = false;
    g.nm.textContent = g.c.name; g.co.textContent = g.c.co;
    g.chips.innerHTML = '<i>' + tier.n + '</i><i>Budget $' + tier.lo + '–' + tier.hi + 'K</i><i class="mood ' + mk + '">' + m.t + '</i>';
    g.band.style.left = 'calc(15px + (100% - 30px) * ' + ((tier.lo - 10) / 100).toFixed(3) + ')'; g.band.style.width = 'calc((100% - 30px) * ' + ((tier.hi - tier.lo) / 100).toFixed(3) + ')';
    g.face.innerHTML = bzFace(g.c, m.face);
    g.face.classList.remove('ring'); void g.face.offsetWidth; g.face.classList.add('ring');
    g.say.className = 'bz-say'; g.say.textContent = '“' + JPICK(['Thanks for calling back. What is your number?', 'We have been waiting on a quote. Go ahead.', 'Let us hear it. What will this cost us?', 'I have ten minutes. What is the price?']) + '”';
    g.go.disabled = false;
    JA.games.biz.hearts(J);
    jtone(740, 0.07, 0.04); jtone(988, 0.09, 0.04);
  },
  finishCall(J, text, cls, face) {
    const g = J.g;
    g.lock = true; g.gap = 1.5; g.go.disabled = true;
    g.say.className = 'bz-say ' + cls; g.say.textContent = text;
    if (face) g.face.innerHTML = bzFace(g.c, face);
    g.d.textContent = g.deals; g.r.textContent = '$' + g.rev + 'K';
  },
  offer(J) {
    const g = J.g, c = g.c;
    if (!c || g.lock) return;
    const p = g.price;
    if (p <= c.max) {
      const s = Math.pow(p / c.max, 2) * (1 - 0.2 * c.strikes);
      g.score += s; g.deals++; g.rev += p;
      const left = c.max - p;
      JA.games.biz.finishCall(J, 'Deal at $' + p + 'K!' + (left > 2 ? ' They would have paid up to $' + c.max + 'K.' : ' Right at their ceiling.'), s >= 0.8 ? 'good' : s >= 0.5 ? 'warn' : 'bad', 'glad');
      jpop(g.host, g.val, s >= 0.8 ? 'Great deal' : s >= 0.5 ? 'Closed' : 'Cheap', s >= 0.5 ? 'good' : 'bad');
      jtone(660, 0.08, 0.05); jtone(880, 0.12, 0.05);
    } else {
      c.strikes++;
      JA.games.biz.hearts(J);
      const over = p / c.max;
      if (c.strikes >= 3) {
        g.hang++;
        JA.games.biz.finishCall(J, 'They hung up. Too many lowball lines are fine, too many high ones are not.', 'bad', 'bad');
        SFX.chime('bad');
      } else {
        g.say.className = 'bz-say warn';
        g.say.textContent = '“' + (over <= 1.08 ? 'Hmm, that is a touch steep.' : over <= 1.25 ? 'That is over our budget.' : 'You must be joking.') + '”';
        g.face.innerHTML = bzFace(c, over <= 1.08 ? 'hmm' : 'bad');
        SFX.chime('bad');
      }
    }
  },
  tick(J, dt) {
    const g = J.g;
    if (g.lock || !g.c) {
      g.gap -= dt;
      if (g.gap <= 0 && J.frac < 0.95) JA.games.biz.next(J);
      return;
    }
    const c = g.c;
    c.t -= dt;
    g.timer.style.width = clamp(c.t / c.total, 0, 1) * 100 + '%';
    g.timer.parentNode.classList.toggle('low', c.t < 4);
    if (c.t <= 0) {
      g.hang++;
      JA.games.biz.finishCall(J, 'You took too long. They hung up.', 'bad', 'bad');
      SFX.chime('bad');
    }
  },
  key(J, e) {
    const g = J.g;
    if (e.key === 'ArrowLeft') JA.games.biz.setPrice(J, g.price - (e.shiftKey ? 5 : 1));
    else if (e.key === 'ArrowRight') JA.games.biz.setPrice(J, g.price + (e.shiftKey ? 5 : 1));
    else if (e.key === 'Enter' || e.key === ' ') JA.games.biz.offer(J);
    else return false;
    return true;
  },
  perf(J) {
    const g = J.g;
    if (g.deals + g.hang < 1) return null;
    return clamp(g.score / (g.target * clamp(J.frac, 0.22, 1)), 0, 1);
  },
  result(J) {
    const g = J.g;
    return { perf: clamp(g.score / g.target, 0, 1), rows: [['Deals closed', g.deals], ['Revenue', '$' + g.rev + 'K'], ['Hung up on you', g.hang]] };
  }
};

/* ====================== Third Grade Teacher: Echo Clap ====================== */
const EC_COL = ['#ff8fa3', '#74c0fc', '#ffd43b', '#8ce99a'];
const EC_NOTE = [262, 330, 392, 523];
JA.games.edu = {
  name: 'Echo Clap', glyph: JGLYPH.star,
  bonus: p => Math.round(-2 + 8 * p),
  keys: 'Watch the desks, then repeat the pattern · tap a desk or press 1–4',
  quips: ['The whole class clapped in perfect time.', 'A lovely, steady rhythm.', 'Mostly together.', 'A bit scattered.', 'Wonderful chaos.'],
  start(J, host) {
    const li = G.lesson ? G.lesson.li : 0, base = 3 + (li >= 2 ? 1 : 0);
    const g = { rounds: [base, base + 1], r: 0, seq: [], si: 0, lit: -1, idx: 0, state: 'ready', tm: 1.0, cred: [], perfect: 0, longest: 0 };
    let pads = '';
    for (let i = 0; i < 4; i++) {
      pads += '<button type="button" class="ec-pad" data-i="' + i + '" style="--c:' + EC_COL[i] + '" aria-label="Desk ' + (i + 1) + '"><svg viewBox="0 0 60 70" aria-hidden="true"><circle cx="30" cy="20" r="11" class="hd"/><path d="M12 62Q12 36 30 34Q48 36 48 62Z" class="bd"/></svg><b>' + (i + 1) + '</b></button>';
    }
    host.innerHTML = '<div class="gm ec"><div class="ec-top"><span class="ec-rd">Round 1 of ' + g.rounds.length + '</span><span class="ec-st">Get ready…</span></div><div class="ec-pads">' + pads + '</div><div class="ec-dots"></div></div>';
    g.host = host; g.pads = $$('.ec-pad', host); g.st = $('.ec-st', host); g.rd = $('.ec-rd', host); g.dots = $('.ec-dots', host);
    $('.ec-pads', host).addEventListener('pointerdown', e => {
      const b = e.target.closest('.ec-pad'); if (!b) return;
      e.preventDefault(); JA.games.edu.tap(J, +b.dataset.i);
    });
    return g;
  },
  light(J, i, ms) {
    const g = J.g;
    g.pads.forEach((p, k) => p.classList.toggle('on', k === i));
    if (i >= 0) { jtone(EC_NOTE[i], 0.22, 0.06); if (ms) setTimeout(() => g.pads[i].classList.remove('on'), ms); }
  },
  dotsDraw(J) {
    const g = J.g, n = g.seq.length;
    g.dots.innerHTML = '';
    for (let i = 0; i < n; i++) g.dots.appendChild(el('i', i < g.idx && g.state === 'input' ? 'on' : ''));
  },
  tap(J, i) {
    const g = J.g;
    if (g.state !== 'input') return;
    JA.games.edu.light(J, i, 170);
    if (i === g.seq[g.idx]) {
      g.idx++; JA.games.edu.dotsDraw(J);
      if (g.idx >= g.seq.length) JA.games.edu.endRound(J, true);
    } else JA.games.edu.endRound(J, false);
  },
  endRound(J, ok) {
    const g = J.g;
    g.cred.push(ok ? 1 : (g.idx / g.seq.length) * 0.7);
    if (ok) { g.perfect++; g.longest = Math.max(g.longest, g.seq.length); }
    g.st.textContent = ok ? 'Perfect echo!' : 'Not quite. The class got a little mixed up.';
    g.st.className = 'ec-st ' + (ok ? 'good' : 'bad');
    g.state = 'pause'; g.tm = 1.0;
    if (!ok) { SFX.chime('bad'); g.host.firstChild.classList.add('shake'); setTimeout(() => g.host.firstChild && g.host.firstChild.classList.remove('shake'), 400); }
    else { jtone(523, 0.1, 0.05); jtone(784, 0.2, 0.05); }
  },
  tick(J, dt) {
    const g = J.g;
    g.tm -= dt;
    const R = g.rounds.length;
    if (g.state === 'ready' && g.tm <= 0) {
      const n = g.rounds[g.r]; g.seq = [];
      for (let i = 0; i < n; i++) { let v; do { v = JI(0, 3); } while (i >= 2 && v === g.seq[i - 1] && v === g.seq[i - 2]); g.seq.push(v); }
      g.state = 'show'; g.si = 0; g.lit = -1; g.tm = 0.2; g.idx = 0;
      g.rd.textContent = 'Round ' + (g.r + 1) + ' of ' + R; g.st.textContent = 'Watch the class…'; g.st.className = 'ec-st';
      JA.games.edu.dotsDraw(J);
    } else if (g.state === 'show' && g.tm <= 0) {
      if (g.lit >= 0) { JA.games.edu.light(J, -1); g.lit = -1; g.tm = 0.14; }
      else if (g.si < g.seq.length) { g.lit = g.seq[g.si]; JA.games.edu.light(J, g.lit); g.si++; g.tm = 0.42 / Math.min(1.15, J.diff); }
      else { g.state = 'input'; g.idx = 0; g.tm = 4.5; g.st.textContent = 'Your turn! Repeat it.'; g.st.className = 'ec-st go'; }
    } else if (g.state === 'input' && g.tm <= 0) {
      JA.games.edu.endRound(J, false);
    } else if (g.state === 'pause' && g.tm <= 0) {
      g.r++;
      if (g.r >= R) { g.state = 'done'; J.over = true; J.progress = 1; }
      else { g.state = 'ready'; g.tm = 0.5; }
    }
    if (g.state !== 'done') {
      const sub = g.state === 'input' ? (g.idx / g.seq.length) * 0.9 : g.state === 'pause' ? 1 : g.state === 'show' ? 0.1 : 0;
      J.progress = Math.min(0.999, (g.r + sub) / R);
    }
  },
  key(J, e) {
    const i = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, s: 1, d: 2, f: 3 }[e.key];
    if (i == null) return false;
    JA.games.edu.tap(J, i);
    return true;
  },
  perf(J) { const g = J.g; return g.cred.length ? g.cred.reduce((a, b) => a + b, 0) / g.rounds.length : null; },
  result(J) {
    const g = J.g;
    return { perf: g.cred.reduce((a, b) => a + b, 0) / g.rounds.length, head: 'Class activity', rows: [['Rounds cleared', g.perfect + ' / ' + g.rounds.length], ['Longest echo', g.longest || '–']] };
  }
};

/* ====================== Line Cook: The Line ====================== */
const CK_FOOD = {
  patty: { name: 'Burger patty', time: 5.6, pal: [['#e0a0a0', '#7b4a2e', '#1c1511']] },
  egg: { name: 'Fried egg', time: 4, pal: [['#f6f3ec', '#efd9a3', '#3b2b19'], ['#ffc83d', '#e79a1c', '#2a1a0c']] },
  steak: { name: 'Ribeye', time: 7.2, pal: [['#d0636d', '#6d3c29', '#1c140f']] },
  veg: { name: 'Veg medley', time: 4.8, pal: [['#9bc87a', '#6f9a3c', '#1f1a12'], ['#e86a5a', '#c4452f', '#241510'], ['#f4d35e', '#d9a73a', '#241c0e']] },
  shrimp: { name: 'Shrimp', time: 3.6, pal: [['#bfaaa8', '#ff8f50', '#2a1b14']] }
};
Object.keys(CK_FOOD).forEach(k => { CK_FOOD[k].rgb = CK_FOOD[k].pal.map(p => p.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)))); });
function ckCol(f, pi, m) {
  const P = f.rgb[pi], lo = m < 0.7, a = lo ? P[0] : P[1], b = lo ? P[1] : P[2], t = lo ? m / 0.7 : Math.min(1, (m - 0.7) / 0.3);
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
}
const CK_SHAPE = {
  patty: '<circle cx="60" cy="60" r="25" data-p="0"/><path d="M42 48 74 74M40 60 66 82M52 40 80 62" stroke="#0007" stroke-width="3" stroke-linecap="round" fill="none"/>',
  egg: '<path d="M34 62Q31 38 58 37Q88 35 85 60Q82 86 56 83Q36 82 34 62Z" data-p="0"/><circle cx="60" cy="60" r="11" data-p="1"/><circle cx="56" cy="56" r="3" fill="#fff6" stroke="none"/>',
  steak: '<path d="M36 58Q38 35 62 37Q88 39 85 63Q80 87 55 84Q34 80 36 58Z" data-p="0"/><path d="M44 46Q60 40 76 48" stroke="#fff5" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M45 66 70 76M42 56 66 64" stroke="#0006" stroke-width="3" stroke-linecap="round" fill="none"/>',
  veg: '<circle cx="46" cy="52" r="11" data-p="0"/><circle cx="72" cy="50" r="10" data-p="1"/><circle cx="58" cy="73" r="11" data-p="2"/><circle cx="76" cy="72" r="6" data-p="0"/><circle cx="42" cy="72" r="6" data-p="1"/>',
  shrimp: '<path d="M42 44Q78 30 80 62Q80 84 52 82" data-p="0" data-k="stroke" fill="none" stroke-width="13" stroke-linecap="round"/><path d="M52 82 44 90M52 82 58 91" stroke="#0005" stroke-width="3" stroke-linecap="round" fill="none"/>'
};
JA.games.cook = {
  name: 'The Line', glyph: JGLYPH.flame,
  goal: 'Orders are firing. Keep the pans moving and plate each item right when it is perfectly cooked.',
  how: ['Watch the ring around each pan. Plate when the needle sits in the green stretch.', 'Too raw is wasted, too long burns. Different foods cook at different speeds.', 'More pans fire up as the rush builds. On a keyboard, press 1–4.'],
  keys: 'Tap a pan to plate it · or press 1–4',
  quips: ['Every plate was perfect. The pass is clear.', 'Hot, fast and on time.', 'A few overdone plates went out.', 'Smoke alarm got a workout.', 'The kitchen is a disaster. Grab a fire blanket.'],
  start(J, host) {
    const g = { pans: [], sum: 0, n: 0, perfect: 0, plated: 0, burnt: 0, th: [0, 0, 0.06, 0.18] };
    host.innerHTML = '<div class="gm ck"><div class="ck-top"><span>Plated <b class="p">0</b></span><span class="ck-st">Fire!</span><span>Burnt <b class="b">0</b></span></div><div class="ck-pans"></div></div>';
    g.host = host; g.pEl = $('.ck-top .p', host); g.bEl = $('.ck-top .b', host); g.stEl = $('.ck-st', host);
    const box = $('.ck-pans', host);
    for (let i = 0; i < 4; i++) {
      const b = el('button', 'pan cold'); b.type = 'button'; b.tabIndex = -1; b.dataset.i = i; b.setAttribute('aria-label', 'Pan ' + (i + 1));
      b.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="53" y="92" width="14" height="26" rx="6" class="hd"/><circle cx="60" cy="60" r="45" class="o0"/><circle cx="60" cy="60" r="38" class="o1"/><g class="food"></g>' +
        '<g transform="rotate(-90 60 60)" fill="none" stroke-width="7"><circle class="trk" cx="60" cy="60" r="54" pathLength="100"/><circle class="sw" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="17 100" stroke-dashoffset="-66"/><circle class="pr" cx="60" cy="60" r="54" pathLength="100" stroke-dasharray="0 100" stroke-linecap="round"/></g></svg><span class="nm">Cold</span><span class="key">' + (i + 1) + '</span>';
      box.appendChild(b);
      g.pans.push({ el: b, food: $('.food', b), pr: $('.pr', b), nm: $('.nm', b), st: 'idle', type: null, m: 0, wait: 0.5 + i * 0.5, on: false, fx: 0, parts: [] });
    }
    box.addEventListener('pointerdown', e => {
      const b = e.target.closest('.pan'); if (!b) return;
      e.preventDefault(); JA.games.cook.plate(J, +b.dataset.i);
    });
    return g;
  },
  load(J, s) {
    const g = J.g, f = CK_FOOD[s.type];
    s.food.innerHTML = CK_SHAPE[s.type];
    s.parts = $$('[data-p]', s.food);
    s.parts.forEach(p => { p.dataset.k === 'stroke' ? null : p.setAttribute('stroke', 'none'); });
    s.nm.textContent = f.name;
    s.el.classList.remove('hot', 'burnt', 'done'); s.el.classList.add('cook');
    JA.games.cook.paint(s);
  },
  paint(s) {
    const f = CK_FOOD[s.type];
    s.parts.forEach(p => {
      const col = ckCol(f, +p.dataset.p, s.m);
      if (p.dataset.k === 'stroke') p.style.stroke = col; else p.style.fill = col;
    });
    s.pr.setAttribute('stroke-dasharray', (Math.min(1, s.m) * 100).toFixed(1) + ' 100');
    s.el.classList.toggle('sweet', s.m > 0.66 && s.m <= 0.83);
    s.el.classList.toggle('late', s.m > 0.83);
  },
  grade(m) {
    if (m < 0.3) return null;
    if (m < 0.5) return [0.25, 'Raw'];
    if (m < 0.66) return [0.65, 'Almost'];
    if (m <= 0.83) return [1, 'Perfect'];
    if (m <= 0.93) return [0.7, 'A bit long'];
    return [0.3, 'Overdone'];
  },
  plate(J, i) {
    const g = J.g, s = g.pans[i];
    if (!s || s.st !== 'cook') return;
    const r = JA.games.cook.grade(s.m);
    if (!r) { jpop(g.host, s.el, 'Not yet', ''); s.el.classList.add('nope'); setTimeout(() => s.el.classList.remove('nope'), 260); return; }
    g.sum += r[0]; g.n++; g.plated++;
    if (r[0] === 1) { g.perfect++; jtone(1046, 0.12, 0.05); } else jtone(r[0] >= 0.65 ? 700 : 330, 0.1, 0.04);
    jpop(g.host, s.el, r[1], r[0] === 1 ? 'good' : r[0] >= 0.65 ? 'warn' : 'bad');
    s.st = 'rest'; s.wait = JR(0.35, 0.8); s.type = null;
    s.el.classList.remove('cook', 'sweet', 'late'); s.el.classList.add('done');
    s.nm.textContent = 'Order up!';
    g.pEl.textContent = g.plated;
  },
  tick(J, dt) {
    const g = J.g;
    g.pans.forEach((s, i) => {
      const on = J.frac >= g.th[i];
      if (on && !s.on) { s.on = true; s.el.classList.remove('cold'); s.nm.textContent = 'Hot'; if (i > 1) jpop(g.host, s.el, 'Rush!', ''); }
      if (!s.on) return;
      if (s.st === 'idle' || s.st === 'rest') {
        s.wait -= dt;
        if (s.wait <= 0 && J.frac < 0.92) {
          s.st = 'cook'; s.m = 0;
          const keys = Object.keys(CK_FOOD);
          let t; do { t = JPICK(keys); } while (g.pans.some(o => o !== s && o.type === t) && Math.random() < 0.7);
          s.type = t; JA.games.cook.load(J, s);
        }
      } else if (s.st === 'cook') {
        s.m += dt / (CK_FOOD[s.type].time / J.diff * J.focus);
        if (s.m >= 1.02) {
          s.m = 1; JA.games.cook.paint(s);
          g.n++; g.burnt++; g.bEl.textContent = g.burnt;
          s.st = 'burnt'; s.fx = 0.95; s.type = null;
          s.el.classList.remove('cook', 'sweet', 'late'); s.el.classList.add('burnt');
          s.nm.textContent = 'Burnt!'; jpop(g.host, s.el, 'Burnt!', 'bad'); SFX.chime('bad');
        } else JA.games.cook.paint(s);
      } else if (s.st === 'burnt') {
        s.fx -= dt;
        if (s.fx <= 0) { s.st = 'rest'; s.wait = JR(0.5, 0.9); s.el.classList.remove('burnt'); s.food.innerHTML = ''; s.pr.setAttribute('stroke-dasharray', '0 100'); s.nm.textContent = 'Hot'; }
      }
      if (s.st === 'rest' && s.wait < 0.25 && s.food.firstChild) { s.food.innerHTML = ''; s.pr.setAttribute('stroke-dasharray', '0 100'); s.nm.textContent = 'Hot'; s.el.classList.remove('done'); }
    });
  },
  key(J, e) {
    const i = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
    if (i == null) return false;
    JA.games.cook.plate(J, i);
    return true;
  },
  perf(J) { const g = J.g; return g.n < 3 ? null : g.sum / g.n; },
  result(J) {
    const g = J.g;
    return { perf: g.n ? g.sum / g.n : 0.5, rows: [['Perfect plates', g.perfect], ['Plates sent', g.plated], ['Burnt', g.burnt]] };
  }
};

