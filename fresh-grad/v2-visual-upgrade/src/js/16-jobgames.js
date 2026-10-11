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
/* the editor dresses the plain highlighter output: punctuation gets its own colour, indent guides and a minimap */
function csDress(h) {
  return h.split(/(<[^>]+>)/).map((seg, i) => i % 2 ? seg : seg.replace(/(?:&(?:lt|gt|amp);|[{}()\[\];,.=!+\-*:?|])+/g, m => '<i class="p">' + m + '</i>')).join('');
}
function csMini(src) {
  const ind = src.match(/^ */)[0].length;
  let h = '';
  src.trim().split(/(\s+)/).forEach(t => {
    if (!/\S/.test(t)) return;
    const k = /^(async|await|function|const|let|if|return)$/.test(t) ? 'k' : /^'/.test(t) ? 's' : /^(\d|true$|false$)/.test(t) ? 'n' : /\(/.test(t) ? 'f' : 'x';
    h += '<s class="' + k + '" style="width:' + Math.max(2, Math.min(24, t.length * 1.7)) + 'px"></s>';
  });
  return '<span class="mm" style="padding-left:' + (ind * 2.6) + 'px">' + h + '</span>';
}
const CS_DEFS = '<svg class="cs-defs" width="0" height="0" aria-hidden="true" style="position:absolute"><defs>' +
  '<linearGradient id="csShell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".55" stop-color="#e0443f"/><stop offset="1" stop-color="#8f1d28"/></linearGradient>' +
  '<linearGradient id="csBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c4"/><stop offset="1" stop-color="#ffb21f"/></linearGradient></defs></svg>';
const CS_BEETLE = '<svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="#25090d" stroke-width="1.7" stroke-linecap="round" fill="none"><path d="M9.5 11 4.5 8M9 17H3.5M10 23l-4.5 3.5M22.5 11l5-3M23 17h5.5M22 23l4.5 3.5M13.5 6 11.5 2.5M18.5 6l2-3.5"/></g>' +
  '<ellipse cx="16" cy="19.5" rx="8.5" ry="10" fill="url(#csShell)" stroke="#3a0f14" stroke-width="1"/><path d="M16 10.5V29.5" stroke="#3a0f14" stroke-width="1.1"/>' +
  '<circle cx="12.2" cy="17" r="1.9" fill="#2a0d10" opacity=".8"/><circle cx="19.8" cy="17" r="1.9" fill="#2a0d10" opacity=".8"/><circle cx="12.4" cy="23.5" r="1.5" fill="#2a0d10" opacity=".8"/><circle cx="19.6" cy="23.5" r="1.5" fill="#2a0d10" opacity=".8"/>' +
  '<path d="M10.5 15.5Q11.5 11.5 15 11.2" stroke="#fff" stroke-opacity=".55" stroke-width="1.7" stroke-linecap="round" fill="none"/>' +
  '<ellipse cx="16" cy="9" rx="5" ry="3.8" fill="#3a1218" stroke="#25090d" stroke-width=".8"/><circle cx="14" cy="8.6" r="1.3" fill="#fff"/><circle cx="18" cy="8.6" r="1.3" fill="#fff"/><circle cx="14.3" cy="8.8" r=".6" fill="#25090d"/><circle cx="17.7" cy="8.8" r=".6" fill="#25090d"/></svg>';
const CS_BOLT = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19 2.5 7.5 18.5H15l-2.5 11.5L25 13h-7.5z" fill="url(#csBolt)" stroke="#fff4b8" stroke-width="1.1" stroke-linejoin="round"/><path d="M4.5 8.5 8 11 6 14.5M27.5 22l-3.5-2.5 2-3.5M26 6l-3 1.5M6 25l3-1.5" stroke="#fff4b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".85"/></svg>';
JA.games.cs = {
  name: 'Bug Hunt', glyph: JGLYPH.bug,
  goal: 'Production is live and bugs keep slipping in. Squash each one before its timer runs out.',
  how: ['Tap a bug to fix it. Gold bolts are critical and count double.', 'A bug that times out is a production incident and breaks your streak.', 'On a keyboard, press the line number (1 to 8).'],
  keys: 'Tap bugs to fix them · or press 1–8 for the line',
  quips: ['Zero-downtime hero. The pager stayed silent.', 'Clean deploys all day long.', 'A few bugs slipped through, but nothing fell over.', 'The pager went off more than once.', 'Prod is on fire. Again.'],
  start(J, host) {
    const g = { lines: [], bugs: [], spawn: 0.7, fixed: 0, miss: 0, wFix: 0, wMiss: 0, combo: 0, best: 0, health: 100, spawned: 0 };
    host.innerHTML = '<div class="gm cs">' + CS_DEFS + '<div class="cs-top"><span class="cs-hb">Prod health<em><b></b></em></span><span class="cs-sk">Streak <b>0</b></span></div>' +
      '<div class="cs-win"><div class="cs-bar"><span class="cs-lights"><i></i><i></i><i></i></span><span class="cs-tabs"><span class="cs-file">checkout.js</span><span>cart.js</span><span>pay.js</span></span>' +
      '<span class="br"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="4.5" cy="3.5" r="1.8"/><circle cx="4.5" cy="12.5" r="1.8"/><circle cx="11.5" cy="6.5" r="1.8"/><path d="M4.5 5.3v5.4M11.5 8.3c0 2.5-3 2.2-7 2.2"/></svg>main</span></div>' +
      '<div class="cs-body"><div class="cs-code"></div><div class="cs-map"></div></div>' +
      '<div class="cs-status"><span>JavaScript</span><span class="nb">No bugs</span><span class="sp"></span><span>UTF-8</span><span>LF</span></div></div></div>';
    g.host = host; g.hb = $('.cs-hb b', host); g.sk = $('.cs-sk b', host); g.hbw = $('.cs-hb', host);
    g.win = $('.cs-win', host); g.nb = $('.cs-status .nb', host); g.nbT = '';
    const code = $('.cs-code', host), mini = $('.cs-map', host);
    CS_CODE.forEach((src, i) => {
      const row = el('div', 'cl');
      row.innerHTML = '<span class="ln">' + (i + 1) + '</span><span class="gut"></span><code><i class="ig" style="--n:' + src.match(/^ */)[0].length + '"></i>' + csDress(csHighlight(src)) + '</code>';
      code.appendChild(row);
      const mr = el('div', 'mr'); mr.innerHTML = csMini(src); mini.appendChild(mr);
      g.lines.push({ row, bug: null, i, mm: mr });
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
    b.innerHTML = crit ? CS_BOLT : CS_BEETLE;
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
    JFX.burst(bug.el, 'splat', { col: bug.crit ? ['#ffc247', '#fff3c4', '#ffffff'] : ['#ff6b6b', '#ff9d8a', '#ffd0d0'], n: bug.crit ? 18 : 11, r: bug.crit ? 52 : 40 });
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
      b.el.classList.toggle('urgent', b.t / b.life < 0.3);
      if (b.t <= 0) {
        g.bugs.splice(i, 1); b.ln.bug = null;
        g.miss++; g.wMiss += b.w; g.combo = 0; g.health = Math.max(0, g.health - 14);
        b.ln.row.classList.remove('hot'); b.ln.row.classList.add('bad');
        setTimeout(() => b.ln.row.classList.remove('bad'), 450);
        jpop(g.host, b.el, 'Incident', 'bad');
        JFX.burst(b.el, 'ring', { col: '#ff6b6b', r: 60 }); g.win.classList.add('shake'); setTimeout(() => g.win.classList.remove('shake'), 400);
        b.el.remove();
        SFX.chime('bad');
      }
    }
    g.hb.style.width = g.health + '%';
    g.hbw.classList.toggle('low', g.health < 40);
    g.sk.textContent = g.combo;
    g.lines.forEach(l => l.mm.classList.toggle('hot', !!l.bug));
    const nbT = g.bugs.length ? g.bugs.length + (g.bugs.length === 1 ? ' bug' : ' bugs') : 'No bugs';
    if (nbT !== g.nbT) { g.nbT = nbT; g.nb.textContent = nbT; g.nb.classList.toggle('bad', g.bugs.length > 0); }
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
/* ---- pipe art: a tube shaded in layers, flanges at each end, fluid bubbles that flow along the run ---- */
function enTileSvg(type) {
  const d = EN_PATH[type];
  const ends = type === 's' ? [[0, 50, 0], [100, 50, 0]] : [[50, 0, 90], [100, 50, 0]];
  const fl = ends.map(e => '<g transform="rotate(' + e[2] + ' ' + e[0] + ' ' + e[1] + ')"><rect x="' + (e[0] - 3.5) + '" y="' + (e[1] - 18) + '" width="7" height="36" rx="1.5"/><circle cx="' + e[0] + '" cy="' + (e[1] - 12.5) + '" r="1.7"/><circle cx="' + e[0] + '" cy="' + (e[1] + 12.5) + '" r="1.7"/><path d="M' + (e[0] - 2) + ' ' + (e[1] - 16) + 'V' + (e[1] + 16) + '"/></g>').join('');
  let p = '';
  for (let i = 0; i < 6; i++) p += '<path class="p' + i + '" d="' + d + '"/>';
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' + p + '<path class="p6" d="' + d + '"/><path class="p7" d="' + d + '"/><g class="fl">' + fl + '</g></svg>';
}
const EN_PUMP = '<ellipse cx="28" cy="51" rx="25" ry="3" fill="#000" opacity=".35"/><rect class="mt" x="3" y="46" width="40" height="5" rx="2"/>' +
  '<rect class="body" x="4" y="19" width="17" height="27" rx="5"/><path d="M9 22v21M13 22v21M17 22v21" stroke="#0a1b30" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
  '<circle class="body" cx="30" cy="28" r="14.5"/><circle class="dk" cx="30" cy="28" r="10.5"/>' +
  '<g class="imp">' + [0, 1, 2, 3, 4, 5].map(k => '<path d="M30 28V18.5Q35 20.500 33.500 26Z" fill="#9db2c8" transform="rotate(' + (k * 60) + ' 30 28)"/>').join('') + '</g><circle class="mt" cx="30" cy="28" r="2.4"/>' +
  '<rect class="mt" x="42" y="22.5" width="12" height="11"/><rect class="mt" x="51" y="19" width="5" height="18" rx="1.5"/>' +
  '<circle cx="30" cy="9.500" r="6.200" fill="#e8f1f8" stroke="#071220" stroke-width="1"/><path d="M26 11.500a4.200 4.200 0 0 1 8 0" stroke="#27384e" stroke-width="1" fill="none" opacity=".6"/><path class="nd" d="M30 9.500 34 7"/>';
const EN_ACT = '<ellipse cx="29" cy="51" rx="19" ry="3" fill="#000" opacity=".35"/><rect class="mt" x="13" y="46" width="28" height="5" rx="2"/>' +
  '<rect class="mt" x="0" y="19" width="5" height="18" rx="1.5"/><rect class="mt" x="3" y="22.500" width="12" height="11"/>' +
  '<rect class="body" x="13" y="13" width="28" height="31" rx="6"/><path d="M20 15v27M26 15v27M32 15v27" stroke="#0a1b30" stroke-width="1.5" opacity=".6"/><rect x="15" y="15" width="3" height="27" rx="1.500" fill="#fff" opacity=".16"/>' +
  '<g class="rod"><rect class="mt" x="41" y="25" width="10" height="6" rx="1.500"/><circle class="mt" cx="52.500" cy="28" r="3.600"/><circle class="dk" cx="52.500" cy="28" r="1.300"/></g><circle class="led" cx="27" cy="8.500" r="2.800"/>';
JA.games.eng = {
  name: 'Pipe Fitter', glyph: JGLYPH.gear,
  goal: 'A hydraulic line has to run from the pump to the actuator. Turn the pipe sections until the fluid flows all the way through.',
  how: ['Tap a section to turn it a quarter turn.', 'Fluid glows amber as the line connects from the pump.', 'Every sealed line is one finished blueprint. Faster is better.'],
  keys: 'Tap a section to turn it · arrow keys + Enter also work',
  quips: ['Tolerances perfect. The shop floor applauds.', 'Clean lines, tight seals.', 'The line holds, with a few drips.', 'Lots of leaks to chase down.', 'Everything is dripping.'],
  start(J, host) {
    const narrow = window.matchMedia && window.matchMedia('(max-width:520px)').matches;
    const g = { cols: narrow ? 4 : 5, rows: narrow ? 5 : 4, solved: 0, taps: 0, cells: [], path: [], wet: null, sealed: false, wait: 0, cur: null, total: 0, tiles: [] };
    host.innerHTML = '<div class="gm en"><div class="en-top"><span>Blueprint <b class="n">1</b></span><span class="en-st">Line open</span><span>Sealed <b class="s">0</b></span></div>' +
      '<div class="en-sheet"><i class="en-rule"></i><div class="pg"></div><div class="en-tb" aria-hidden="true"><span>HYDRAULIC LINE</span><span>REV A</span><span>SHEET 1 / 1</span></div></div></div>';
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
    const gr = g.grid; gr.innerHTML = ''; g.tiles = []; g.pw = null;
    gr.classList.remove('sealed'); gr.classList.add('fresh'); setTimeout(() => gr.classList.remove('fresh'), 360);
    const node = (col, row, cls, label) => {
      const d = el('div', 'pn ' + cls); d.style.gridColumn = col; d.style.gridRow = row;
      d.innerHTML = '<svg viewBox="0 0 56 56" aria-hidden="true">' + (cls === 'src' ? EN_PUMP : EN_ACT) + '</svg><small>' + label + '</small>';
      return d;
    };
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const cell = g.cells[r][c];
        const b = el('button', 'pt'); b.type = 'button'; b.tabIndex = -1; b.dataset.c = c; b.dataset.r = r;
        b.setAttribute('aria-label', 'Pipe section, column ' + (c + 1) + ' row ' + (r + 1));
        b.innerHTML = enTileSvg(cell.type);
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
    const pw = g.pw; g.pw = f.wet;
    if (pw) for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) if (pw[c + ',' + r] && !f.wet[c + ',' + r]) JFX.burst(g.cells[r][c].el, 'steam', { n: 8, spread: 26, a: 0.55 });
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) g.cells[r][c].el.classList.toggle('wet', !!f.wet[c + ',' + r]);
    const src = $('.pn.src', g.grid), snk = $('.pn.snk', g.grid);
    if (src) src.classList.toggle('wet', !!(enMask(g.cells[g.path[0][1]][g.path[0][0]]) & EN_W));
    if (snk) snk.classList.toggle('wet', f.solved);
    if (f.solved && !g.sealed) {
      g.sealed = true; g.solved++; g.wait = 0.75;
      g.grid.classList.add('sealed'); g.s.textContent = g.solved; g.st.textContent = 'Sealed!'; g.st.classList.add('ok');
      jpop(g.host, snk || g.grid, 'Sealed', 'good');
      JFX.burst(snk || g.grid, 'spark', { col: ['#ffd27a', '#fff3c4', '#ffb347'], n: 16, v: 200 }); JFX.burst(snk || g.grid, 'ring', { col: '#ffb347', r: 80 });
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
/* the bedside monitor: a sweeping trace with a gap ahead of the beam, like the real thing */
const NU_PLETH = ph => { const a = ph < 0.62 ? Math.pow(Math.sin(ph / 0.62 * Math.PI), 1.6) : 0; const b = 0.2 * Math.exp(-Math.pow((ph - 0.78) / 0.07, 2)); return a * 0.85 + b; };
function nuTrace(cv, J, per, fn, col, top, amp) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, k = W / 300, sweep = 2.8, ph0 = (J.t % sweep) / sweep, base = J.t - ph0 * sweep, hx = ph0 * W, gap = W * 0.07;
  c.clearRect(0, 0, W, H);
  c.strokeStyle = 'rgba(120,255,190,.07)'; c.lineWidth = 1; c.beginPath();
  for (let x = 0; x <= W; x += W / 15) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = 0; y <= H; y += H / 4) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
  const yAt = x => { const tt = x <= hx ? base + x / W * sweep : base - sweep + x / W * sweep; return H * top - fn((((tt % per) + per) % per) / per) * H * amp; };
  const rgb = AK.rgb(col);
  const path = (x0, x1) => { c.beginPath(); for (let x = x0; x <= x1; x += 2) { const y = yAt(x); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); } };
  c.lineJoin = 'round'; c.lineCap = 'round';
  const gr = c.createLinearGradient(Math.max(0, hx - W * 0.55), 0, hx, 0);
  gr.addColorStop(0, 'rgba(' + rgb.join(',') + ',.22)'); gr.addColorStop(1, 'rgba(' + rgb.join(',') + ',1)');
  path(0, hx); c.strokeStyle = 'rgba(' + rgb.join(',') + ',.16)'; c.lineWidth = 7 * k; c.stroke(); c.strokeStyle = gr; c.lineWidth = 2.4 * k; c.stroke();
  if (hx + gap < W) { path(hx + gap, W); c.strokeStyle = 'rgba(' + rgb.join(',') + ',.2)'; c.lineWidth = 2.2 * k; c.stroke(); }
  const hy = yAt(hx); c.fillStyle = '#fff'; c.beginPath(); c.arc(hx, hy, 2.6 * k, 0, 7); c.fill(); AK.light(c, hx, hy, 12 * k, col, 0.9);
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
    g.ecg = null; g.pleth = null;
    if (!p) { card.className = 'nu-card empty'; card.innerHTML = '<div class="nu-wait">The ward is quiet<small>Next patient is on the way…</small></div>'; return; }
    card.className = 'nu-card in';
    card.innerHTML = '<div class="nu-id"><b>Bed ' + p.bed + ' · ' + p.name + '</b><small>' + p.age + ' yrs</small><em></em></div>' +
      '<div class="nu-mon"><div class="nu-scr"><div class="nu-leds"><i class="hb"></i><span>LIVE</span><span class="al"><i></i><i></i></span></div>' +
      '<div class="nu-vit"><div class="v hr"><small>HR bpm</small><b>' + p.hr + '</b><canvas width="300" height="92"></canvas></div>' +
      '<div class="v sp"><small>SpO₂ %</small><b>' + p.sp + '</b><canvas width="300" height="92"></canvas></div>' +
      '<div class="v tp"><small>TEMP °C</small><b>' + p.tp.toFixed(1) + '</b><div class="thm"><i style="width:' + (clamp((p.tp - 35) / 7, 0.05, 1) * 100).toFixed(0) + '%"></i></div></div></div></div></div>';
    card.style.setProperty('--per', (60 / p.hr).toFixed(3) + 's');
    g.ecg = $('canvas', card); g.pleth = $$('canvas', card)[1];
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
    { const oc = $$('canvas', old), sc = $$('canvas', g.card); oc.forEach((cv, i) => { try { cv.getContext('2d').drawImage(sc[i], 0, 0); } catch (e) { /* the copy is cosmetic */ } }); }
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
      const per = 60 / g.q[0].hr;
      nuTrace(g.ecg, J, per, nuEcg, '#59f0a0', 0.66, 0.55);
      if (g.pleth) nuTrace(g.pleth, J, per, ph => NU_PLETH((ph + 0.82) % 1), '#5ad2ff', 0.86, 0.62);
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
/* a client portrait: deterministic hair, glasses and jacket per name, and an expression per mood */
function bzFace(c, mood) {
  const hs = Array.from(c.name).reduce((q, ch) => q * 31 + ch.charCodeAt(0), 7) | 0, hv = k => hash01(hs, k, 11);
  const style = Math.floor(hv(1) * 6), jacket = ['#2f4a6e', '#3b3b52', '#5a2f3a', '#2f5a4a', '#4a3a2a', '#394a66'][Math.floor(hv(2) * 6)], tie = ['#c0392b', '#e0b84a', '#3a7bd5', '#2f9e6e', '#8e44ad'][Math.floor(hv(3) * 5)], glasses = hv(4) > 0.62;
  const sk = c.skin, skd = shade(sk, -0.14), skl = shade(sk, 0.12), hr = c.hair, hrl = shade(hr, 0.22), ink = '#1b1410';
  const mouth = { happy: 'M-6 9.5Q0 14 6 9.5', flat: 'M-4.5 11H4.5', hmm: 'M-5 12Q-1 9.5 5 12.5', bad: 'M-6 13.5Q0 8.5 6 13.5', glad: 'M-7.5 8.5Q0 17 7.5 8.5Z' }[mood];
  const brow = { bad: 'M-12.5 -8.5-5 -6M12.5 -8.5 5 -6', hmm: 'M-12.5 -7-5.5 -9.5M5.5 -9.5 12.5 -6', glad: 'M-12.5 -9-5.5 -10.5M5.5 -10.5 12.5 -9' }[mood] || 'M-12.5 -8.5-5.5 -9M5.5 -9 12.5 -8.5';
  let back = '', front = '';
  if (style === 3) back = '<path d="M-17 -6Q-21 14 -15 24L-9 22 -9 -4zM17 -6Q21 14 15 24L9 22 9 -4z" fill="' + hr + '"/>';
  if (style === 5) back = '<circle cx="0" cy="-23" r="6.5" fill="' + hr + '"/><circle cx="-1.8" cy="-24.8" r="2" fill="' + hrl + '" opacity=".5"/>';
  if (style === 0) front = '<path d="M-16.5 -4Q-19 -24 0 -23.5Q19 -24 16.5 -4Q14 -14 0 -15.5Q-14 -14 -16.5 -4Z" fill="' + hr + '"/><path d="M-9 -20Q-2 -23 5 -21" stroke="' + hrl + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>';
  else if (style === 1) front = '<path d="M-16.5 -3Q-18 -25 2 -24Q19 -23 16.5 -3Q15 -12 8 -15Q-4 -12 -9 -17Q-14 -13 -16.5 -3Z" fill="' + hr + '"/><path d="M-6 -21Q2 -24 11 -20" stroke="' + hrl + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>';
  else if (style === 2) front = '<g fill="' + hr + '"><circle cx="-10" cy="-17" r="7.5"/><circle cx="0" cy="-20.5" r="8"/><circle cx="10" cy="-17" r="7.5"/><circle cx="-15" cy="-9" r="5"/><circle cx="15" cy="-9" r="5"/></g><circle cx="-3" cy="-23" r="2.4" fill="' + hrl + '" opacity=".4"/>';
  else if (style === 3) front = '<path d="M-16.5 0Q-19 -24 0 -23.5Q19 -24 16.5 0Q13 -15 2 -14Q-8 -14 -16.5 0Z" fill="' + hr + '"/><path d="M-8 -20Q0 -23 7 -20" stroke="' + hrl + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>';
  else if (style === 4) front = '<path d="M-16 -2Q-17 -10 -13 -13Q-15 -6 -14 1zM16 -2Q17 -10 13 -13Q15 -6 14 1z" fill="' + hr + '"/><ellipse cx="-3" cy="-15" rx="6" ry="2" fill="#fff" opacity=".22"/>';
  else front = '<path d="M-16.5 -4Q-19 -24 0 -23.5Q19 -24 16.5 -4Q14 -14 0 -16Q-14 -14 -16.5 -4Z" fill="' + hr + '"/><circle cx="0" cy="-27" r="0.01"/>';
  let eyes;
  if (mood === 'glad') eyes = '<path d="M-11.5 -2.5Q-8 -6.5 -4.5 -2.5M4.5 -2.5Q8 -6.5 11.5 -2.5" stroke="' + ink + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  else eyes = '<ellipse cx="-8" cy="-2" rx="3.7" ry="' + (mood === 'bad' ? 2.4 : 3) + '" fill="#fff"/><ellipse cx="8" cy="-2" rx="3.7" ry="' + (mood === 'bad' ? 2.4 : 3) + '" fill="#fff"/><circle cx="-7.6" cy="-1.8" r="2.1" fill="' + (hv(5) > 0.5 ? '#3a2a1c' : '#2a4a5a') + '"/><circle cx="8.4" cy="-1.8" r="2.1" fill="' + (hv(5) > 0.5 ? '#3a2a1c' : '#2a4a5a') + '"/><circle cx="-7.6" cy="-1.8" r="1" fill="' + ink + '"/><circle cx="8.4" cy="-1.8" r="1" fill="' + ink + '"/><circle cx="-6.7" cy="-2.8" r=".8" fill="#fff"/><circle cx="9.3" cy="-2.8" r=".8" fill="#fff"/>';
  const gl = glasses ? '<g fill="rgba(200,230,255,.14)" stroke="#1c2430" stroke-width="1.4"><rect x="-13.5" y="-6.5" width="11" height="9" rx="3.5"/><rect x="2.5" y="-6.5" width="11" height="9" rx="3.5"/></g><path d="M-2.5 -3Q0 -4.5 2.5 -3M-13.5 -3-16.5 -4M13.5 -3 16.5 -4" stroke="#1c2430" stroke-width="1.2" fill="none"/>' : '';
  return '<svg viewBox="-32 -32 64 64" aria-hidden="true">' +
    '<path d="M-34 34Q-33 21 -15 18L-6 16 0 27 6 16 15 18Q33 21 34 34Z" fill="' + jacket + '"/><path d="M-34 34Q-33 21 -15 18L-12 24Q-25 26 -30 34Z" fill="#fff" opacity=".08"/>' +
    '<path d="M-6 16 0 27 6 16 3.6 14.6 0 20.5-3.6 14.6Z" fill="#f4f6f8"/><path d="M-2.2 21H2.2L3.2 30.5 0 33.5-3.2 30.5Z" fill="' + tie + '"/><path d="M-15 18 -6 16 0 27-9 22Z" fill="#0000001f"/>' +
    back + '<path d="M-5 9V17Q0 21.500 5 17V9Z" fill="' + skd + '"/><circle cx="-16" cy="1" r="3.4" fill="' + skd + '"/><circle cx="16" cy="1" r="3.4" fill="' + skd + '"/>' +
    '<ellipse cx="0" cy="-3" rx="15.8" ry="18.2" fill="' + sk + '"/><path d="M-15 2Q-13 15 0 15.200Q13 15 15 2Q12 12 0 12.500Q-12 12 -15 2Z" fill="' + skd + '" opacity=".55"/><ellipse cx="-6" cy="-9" rx="7" ry="5" fill="' + skl + '" opacity=".32"/>' +
    front + (mood === 'glad' ? '<circle cx="-10.500" cy="4.500" r="3" fill="#ff7a8a" opacity=".32"/><circle cx="10.500" cy="4.500" r="3" fill="#ff7a8a" opacity=".32"/>' : '') +
    eyes + gl + '<g stroke="' + ink + '" stroke-width="1.9" stroke-linecap="round" fill="none"><path d="' + brow + '"/></g>' +
    '<path d="M0 -1.500Q-2.800 5 -0.500 6.200Q1 6.800 2.500 5.600" stroke="' + skd + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    (mood === 'glad' ? '<path d="' + mouth + '" fill="#5a1c24"/><path d="M-5.500 9.500Q0 12 5.500 9.500" stroke="#fff" stroke-width="1.8" fill="none" opacity=".9"/>' : '<path d="' + mouth + '" stroke="#4a1f1f" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>') +
    (mood === 'bad' ? '<path d="M19 -9Q22 -4 19 -1Q16 -4 19 -9Z" fill="#9fd8ff" opacity=".85"/>' : '') + '</svg>';
}
function bzDialSvg() {
  const cx = 120, cy = 112, R = 80, pt = (v, r) => { const a = Math.PI * (1 - (v - 10) / 100); return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]; };
  let ticks = '';
  for (let v = 10; v <= 110; v += 5) { const mj = v % 10 === 0, a = pt(v, mj ? 65 : 69), b = pt(v, 74); ticks += '<path class="dtk' + (mj ? ' mj' : '') + '" d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" stroke-width="' + (mj ? 1.6 : 1) + '" stroke-linecap="round"/>'; }
  const arc = r => 'M' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy;
  return '<svg class="bz-dial" viewBox="0 0 240 128" aria-hidden="true"><path class="dtrk" d="' + arc(R) + '" fill="none" stroke-width="12" stroke-linecap="round"/>' +
    '<path class="dband" d="' + arc(R) + '" fill="none" stroke-width="12" pathLength="100" stroke-dasharray="0 200"/>' +
    '<path class="dval" d="' + arc(92) + '" fill="none" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="0 200"/>' + ticks +
    '<g class="nd"><path d="M120 112H40" stroke="#ffc247" stroke-width="3" stroke-linecap="round"/><path d="M120 112H40" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round" transform="translate(0 -.8)"/><circle cx="120" cy="112" r="7.500" fill="#ffc247" stroke="#0a121c" stroke-width="2.500"/><circle cx="118" cy="110" r="2" fill="#fff" opacity=".6"/></g></svg>';
}
function bzDial(g) {
  if (!g.nd) return;
  g.nd.style.transform = 'rotate(' + ((g.price - 10) / 100 * 180).toFixed(1) + 'deg)';
  g.dv.setAttribute('stroke-dasharray', Math.max(0.001, g.price - 10) + ' 200');
  if (g.c) { g.db.setAttribute('stroke-dasharray', (g.c.tier.hi - g.c.tier.lo) + ' 200'); g.db.setAttribute('stroke-dashoffset', String(-(g.c.tier.lo - 10))); }
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
      '<div class="bz-offer"><button type="button" class="bz-st mn" aria-label="Lower offer">−</button><div class="bz-val"><small>Your offer</small>' + bzDialSvg() + '<b>$60K</b></div><button type="button" class="bz-st pl" aria-label="Raise offer">+</button></div>' +
      '<div class="bz-track"><i class="band"></i><input type="range" min="10" max="110" step="1" value="60" aria-label="Offer in thousands of dollars"></div>' +
      '<button type="button" class="btn bz-go">Make offer</button></div>';
    g.host = host;
    g.callEl = $('.bz-call', host); g.face = $('.bz-face', host); g.nm = $('.nm', host); g.co = $('.co', host); g.chips = $('.bz-chips', host); g.hearts = $('.bz-hearts', host);
    g.say = $('.bz-say', host); g.val = $('.bz-val b', host); g.band = $('.band', host); g.go = $('.bz-go', host); g.timer = $('.bz-timer span', host);
    g.d = $('.bz-top .d', host); g.r = $('.bz-top .r', host); g.range = $('input', host);
    g.nd = $('.bz-dial .nd', host); g.dv = $('.bz-dial .dval', host); g.db = $('.bz-dial .dband', host);
    g.range.addEventListener('input', () => JA.games.biz.setPrice(J, +g.range.value));
    bzDial(g);
    $('.mn', host).addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.setPrice(J, g.price - 1); });
    $('.pl', host).addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.setPrice(J, g.price + 1); });
    g.go.addEventListener('pointerdown', e => { e.preventDefault(); JA.games.biz.offer(J); });
    return g;
  },
  setPrice(J, v) { const g = J.g; g.price = clamp(Math.round(v), 10, 110); g.range.value = g.price; g.val.textContent = '$' + g.price + 'K'; bzDial(g); },
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
    bzDial(g);
    g.face.classList.remove('ring'); void g.face.offsetWidth; g.face.classList.add('ring');
    g.say.className = 'bz-say'; g.say.textContent = '“' + JPICK(['Thanks for calling back. What is your number?', 'We have been waiting on a quote. Go ahead.', 'Let us hear it. What will this cost us?', 'I have ten minutes. What is the price?']) + '”';
    g.go.disabled = false; g.callEl.classList.add('live');
    JA.games.biz.hearts(J);
    jtone(740, 0.07, 0.04); jtone(988, 0.09, 0.04);
  },
  finishCall(J, text, cls, face) {
    const g = J.g;
    g.lock = true; g.gap = 1.5; g.go.disabled = true; g.callEl.classList.remove('live');
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
      JFX.burst(g.val, 'confetti', { n: s >= 0.8 ? 46 : s >= 0.5 ? 22 : 8 }); if (s >= 0.8) JFX.burst(g.face, 'stars', { n: 8, col: ['#ffd778', '#fff3c4'] });
    } else {
      c.strikes++;
      JA.games.biz.hearts(J);
      const over = p / c.max;
      if (c.strikes >= 3) {
        g.hang++;
        JA.games.biz.finishCall(J, 'They hung up. Too many lowball lines are fine, too many high ones are not.', 'bad', 'bad');
        SFX.chime('bad'); g.host.firstChild.classList.add('shake'); setTimeout(() => g.host.firstChild && g.host.firstChild.classList.remove('shake'), 400);
      } else {
        g.say.className = 'bz-say warn';
        g.say.textContent = '“' + (over <= 1.08 ? 'Hmm, that is a touch steep.' : over <= 1.25 ? 'That is over our budget.' : 'You must be joking.') + '”';
        g.face.innerHTML = bzFace(c, over <= 1.08 ? 'hmm' : 'bad');
        SFX.chime('bad'); g.say.classList.add('shake'); setTimeout(() => g.say.classList.remove('shake'), 400);
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
/* four cartoon kids at their desks; hands meet and the mouth opens when a desk lights up */
const EC_KID = [
  { skin: '#f1c9a5', hair: '#5a3a22', style: 'pig' }, { skin: '#d9a07a', hair: '#1a1a1f', style: 'spike' },
  { skin: '#7a4a32', hair: '#15151a', style: 'puff' }, { skin: '#f6d5b8', hair: '#8a2f2f', style: 'bob' }
];
function ecKid(i) {
  const k = EC_KID[i], skd = shade(k.skin, -0.14), h = k.hair;
  let back = '', front = '';
  if (k.style === 'pig') { back = '<circle cx="23" cy="27" r="6.500" fill="' + h + '"/><circle cx="57" cy="27" r="6.500" fill="' + h + '"/><path d="M23 33 20 40M57 33 60 40" stroke="' + h + '" stroke-width="3.500" stroke-linecap="round"/>'; front = '<path d="M25 30Q25 15 40 15Q55 15 55 30Q51 22 40 22Q29 22 25 30Z" fill="' + h + '"/><circle cx="23" cy="27" r="2.600" fill="#ff8fa3"/><circle cx="57" cy="27" r="2.600" fill="#ff8fa3"/>'; }
  else if (k.style === 'spike') front = '<path d="M25 30 26 16 31 21 34 11 39 19 44 10 48 19 53 14 55 30Q50 22 40 22Q30 22 25 30Z" fill="' + h + '"/>';
  else if (k.style === 'puff') { back = '<circle cx="28" cy="19" r="8" fill="' + h + '"/><circle cx="40" cy="14" r="9" fill="' + h + '"/><circle cx="52" cy="19" r="8" fill="' + h + '"/><circle cx="24" cy="28" r="5" fill="' + h + '"/><circle cx="56" cy="28" r="5" fill="' + h + '"/>'; front = '<path d="M26 28Q27 20 40 20Q53 20 54 28Q48 23 40 23Q32 23 26 28Z" fill="' + h + '"/>'; }
  else { back = '<path d="M24 28Q22 46 28 48L52 48Q58 46 56 28Z" fill="' + h + '"/>'; front = '<path d="M24 30Q24 14 40 14Q56 14 56 30Q54 25 49 24Q40 27 31 24Q26 25 24 30Z" fill="' + h + '"/>'; }
  const wood = '<linearGradient id="ecWd' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a46a"/><stop offset="1" stop-color="#8a5a32"/></linearGradient>';
  return '<svg viewBox="0 0 80 106" aria-hidden="true"><defs>' + wood + '</defs>' +
    '<ellipse cx="40" cy="70" rx="34" ry="6" fill="#000" opacity=".25"/>' + back +
    '<path d="M16 80Q15 54 40 51Q65 54 64 80Z" fill="var(--c)"/><path d="M16 80Q15 58 28 53Q22 66 24 80Z" fill="#fff" opacity=".18"/><path d="M33 51Q40 58 47 51" stroke="#fff" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>' +
    '<rect x="35" y="43" width="10" height="9" rx="3" fill="' + skd + '"/><circle cx="25" cy="34" r="3.200" fill="' + skd + '"/><circle cx="55" cy="34" r="3.200" fill="' + skd + '"/><circle cx="40" cy="33" r="15.500" fill="' + k.skin + '"/><ellipse cx="34" cy="27" rx="6" ry="4" fill="#fff" opacity=".16"/>' +
    front + '<circle cx="31" cy="40" r="3" fill="#ff7a8a" opacity=".3"/><circle cx="49" cy="40" r="3" fill="#ff7a8a" opacity=".3"/>' +
    '<g class="ey" fill="#1b1410"><circle cx="34" cy="34" r="2"/><circle cx="46" cy="34" r="2"/><circle cx="34.700" cy="33.200" r=".7" fill="#fff"/><circle cx="46.700" cy="33.200" r=".7" fill="#fff"/></g>' +
    '<g class="eh" fill="none" stroke="#1b1410" stroke-width="1.800" stroke-linecap="round"><path d="M31.500 34.500Q34 31 36.500 34.500M43.500 34.500Q46 31 48.500 34.500"/></g>' +
    '<path class="mo" d="M35.500 40.500Q40 44 44.500 40.500" stroke="#7a2a2a" stroke-width="1.800" fill="none" stroke-linecap="round"/><ellipse class="mo2" cx="40" cy="41.500" rx="4.200" ry="3.200" fill="#7a2a2a"/>' +
    '<g class="armr" stroke="var(--c)" stroke-width="7.500" stroke-linecap="round" fill="none"><path d="M20 62Q17 74 29 76"/><path d="M60 62Q63 74 51 76"/></g><circle class="armr" cx="30" cy="76" r="4.200" fill="' + k.skin + '"/><circle class="armr" cx="50" cy="76" r="4.200" fill="' + k.skin + '"/>' +
    '<g class="armc" stroke="var(--c)" stroke-width="7.500" stroke-linecap="round" fill="none"><path d="M20 62Q22 66 35 61"/><path d="M60 62Q58 66 45 61"/></g><circle class="armc" cx="37" cy="60" r="4.400" fill="' + k.skin + '"/><circle class="armc" cx="43" cy="60" r="4.400" fill="' + k.skin + '"/>' +
    '<g class="sk"><path d="M40 49V43M31 52 27 48M49 52 53 48"/></g><path class="nt" d="M60 22V8l8-2.500v13M60 20.500a3.200 2.400 0 1 1-.01 0M68 17.500a3.200 2.400 0 1 1-.01 0" fill="var(--c)" stroke="var(--c)" stroke-width="1.600" stroke-linejoin="round"/>' +
    '<rect x="4" y="76" width="72" height="9" rx="3" fill="url(#ecWd' + i + ')"/><rect x="4" y="76" width="72" height="2.200" rx="1.100" fill="#fff" opacity=".4"/><rect x="9" y="85" width="62" height="21" fill="#6b432a"/><rect x="9" y="85" width="62" height="3" fill="#000" opacity=".25"/></svg>';
}
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
      pads += '<button type="button" class="ec-pad" data-i="' + i + '" style="--c:' + EC_COL[i] + '" aria-label="Desk ' + (i + 1) + '">' + ecKid(i) + '<b>' + (i + 1) + '</b></button>';
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
    else { jtone(523, 0.1, 0.05); jtone(784, 0.2, 0.05); JFX.burst($('.ec-pads', g.host), 'stars', { n: 10, col: ['#ffd43b', '#fff3c4', '#ff8fa3', '#74c0fc', '#8ce99a'] }); }
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
  patty: '<circle data-p="0" cx="60" cy="60" r="26"/><circle cx="60" cy="60" r="26" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2.4"/><g fill="#000" opacity=".16"><circle cx="48" cy="52" r="1.6"/><circle cx="62" cy="47" r="1.3"/><circle cx="71" cy="58" r="1.7"/><circle cx="52" cy="68" r="1.5"/><circle cx="66" cy="72" r="1.2"/><circle cx="57" cy="60" r="1.4"/><circle cx="44" cy="62" r="1.2"/></g><path class="grill" d="M42 46 74 78M38 58 62 82M52 38 82 66"/><ellipse class="glaze" cx="52" cy="50" rx="11" ry="5" transform="rotate(-30 52 50)"/><circle class="char" cx="60" cy="60" r="26"/>',
  egg: '<path data-p="0" d="M34 62Q31 38 58 37Q88 35 85 60Q82 86 56 83Q36 82 34 62Z"/><path d="M34 62Q31 38 58 37Q88 35 85 60Q82 86 56 83Q36 82 34 62Z" fill="none" stroke="#b86a2a" stroke-width="3.4" style="opacity:calc(var(--m,0)*1.1)"/><circle data-p="1" cx="60" cy="60" r="11"/><ellipse cx="56" cy="55.5" rx="4.2" ry="2.6" fill="#fff" opacity=".6" transform="rotate(-25 56 55.5)"/><g fill="#fff" opacity=".4"><circle cx="42" cy="50" r="2"/><circle cx="76" cy="70" r="2.4"/><circle cx="48" cy="74" r="1.6"/></g><ellipse class="glaze" cx="48" cy="46" rx="9" ry="3.4" transform="rotate(-20 48 46)"/><path class="char" d="M34 62Q31 38 58 37Q88 35 85 60Q82 86 56 83Q36 82 34 62Z"/>',
  steak: '<path data-p="0" d="M36 58Q38 35 62 37Q88 39 85 63Q80 87 55 84Q34 80 36 58Z"/><path d="M39 55Q40 41 58 39" stroke="#f1d2bf" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".55"/><path d="M44 46Q60 40 76 48" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round" fill="none"/><path class="grill" d="M45 66 70 76M42 56 66 64M52 78 76 86"/><ellipse class="glaze" cx="56" cy="48" rx="12" ry="4.5" transform="rotate(-12 56 48)"/><path class="char" d="M36 58Q38 35 62 37Q88 39 85 63Q80 87 55 84Q34 80 36 58Z"/>',
  veg: '<circle data-p="0" cx="45" cy="53" r="10"/><circle data-p="0" cx="39" cy="48" r="5.6"/><circle data-p="0" cx="51" cy="46" r="6"/><rect data-p="0" x="42.500" y="58" width="5" height="7" rx="2"/><circle data-p="1" cx="73" cy="52" r="9.600"/><circle cx="70.500" cy="48.500" r="2.800" fill="#fff" opacity=".5"/><path data-p="2" d="M52 71Q58 62 68 68Q73 77 62 81Q51 81 52 71Z"/><circle data-p="0" cx="78" cy="72" r="6"/><circle data-p="1" cx="42" cy="73" r="6.200"/><circle cx="40.500" cy="71" r="1.600" fill="#fff" opacity=".5"/><circle class="char" cx="60" cy="62" r="24"/>',
  shrimp: '<path data-p="0" data-k="stroke" d="M42 44Q78 30 80 62Q80 84 52 82" fill="none" stroke-width="13" stroke-linecap="round"/><path d="M50 40q4 8 4 16M60 38q5 10 4 20M70 40q4 10 3 21" stroke="#000" stroke-opacity=".22" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M52 82 44 90M52 82 58 91" stroke="#0005" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M44 40Q76 28 79 56" stroke="#fff" stroke-opacity=".32" stroke-width="2.6" fill="none" stroke-linecap="round"/><path class="charS" d="M42 44Q78 30 80 62Q80 84 52 82" stroke-width="13" stroke-linecap="round"/>'
};
const CK_DEFS = '<svg class="ck-defs" width="0" height="0" aria-hidden="true" style="position:absolute"><defs>' +
  '<radialGradient id="ckRim" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="#9aa5b0"/><stop offset=".55" stop-color="#4b535c"/><stop offset="1" stop-color="#1c2025"/></radialGradient>' +
  '<radialGradient id="ckIn" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#2d3239"/><stop offset=".8" stop-color="#171a1f"/><stop offset="1" stop-color="#0d0f12"/></radialGradient></defs></svg>';
let CK_FLAMES = '<circle cx="60" cy="60" r="48.500" fill="none" stroke="#ff8a3d" stroke-width="7" opacity=".26"/>';
for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832, x = 60 + Math.cos(a) * 45.500, y = 60 + Math.sin(a) * 45.500; CK_FLAMES += '<g class="fg" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (a * 57.2958 + 90).toFixed(1) + ') scale(' + (0.65 + hash01(i, 3, 3) * 0.7).toFixed(2) + ')"><path class="fo" d="M-3 0Q-3.500 -4.500 0 -9Q3.500 -4.500 3 0Z"/><path class="fi" d="M-1.600 0Q-1.800 -2.600 0 -5Q1.800 -2.600 1.600 0Z"/></g>'; }
let CK_SIZZLE = '';
for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + 0.3, r = 33 + (i % 2) * 2; CK_SIZZLE += '<circle cx="' + (60 + Math.cos(a) * r).toFixed(1) + '" cy="' + (60 + Math.sin(a) * r).toFixed(1) + '" r="2.600"/>'; }
const CK_PAN = '<g class="grate"><circle cx="60" cy="60" r="50"/><path d="M10 60H110M60 10V110" stroke-opacity=".6"/></g><g class="fl">' + CK_FLAMES + '</g>' +
  '<circle class="o0" cx="60" cy="60" r="43"/><circle class="o1" cx="60" cy="60" r="37"/>' +
  '<path class="shn" d="M38 48Q42 38 54 34Q44 38 41 50Z"/><ellipse class="oil" cx="72" cy="74" rx="9" ry="4" transform="rotate(-30 72 74)"/><circle class="oil" cx="45" cy="76" r="2.400"/>' +
  '<g class="sz">' + CK_SIZZLE + '</g><g class="food" transform="translate(60 60) scale(.98) translate(-60 -60)"></g>' +
  '<g transform="rotate(-90 60 60)" fill="none" stroke-width="4.500"><circle class="trk" cx="60" cy="60" r="56.500" pathLength="100"/><circle class="sw" cx="60" cy="60" r="56.500" pathLength="100" stroke-dasharray="17 100" stroke-dashoffset="-66"/><circle class="pr" cx="60" cy="60" r="56.500" pathLength="100" stroke-dasharray="0 100" stroke-linecap="round"/></g>' +
  '<g transform="rotate(40 60 60)"><rect class="hd" x="96" y="55.500" width="23" height="9" rx="4.500"/><rect class="hdh" x="98" y="57" width="19" height="2.200" rx="1.100"/><circle cx="115" cy="60" r="1.500" fill="#0a0c10"/></g>';
const CK_BELL = '<svg class="bell" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1.500 1.500 0 0 1 1.500 1.500 6 6 0 0 1 4.500 5.800V15l2 3H4l2-3v-4.700a6 6 0 0 1 4.500-5.800A1.500 1.500 0 0 1 12 3z" fill="currentColor"/><path d="M10 19.500a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.600" fill="none" stroke-linecap="round"/></svg>';
JA.games.cook = {
  name: 'The Line', glyph: JGLYPH.flame,
  goal: 'Orders are firing. Keep the pans moving and plate each item right when it is perfectly cooked.',
  how: ['Watch the ring around each pan. Plate when the needle sits in the green stretch.', 'Too raw is wasted, too long burns. Different foods cook at different speeds.', 'More pans fire up as the rush builds. On a keyboard, press 1–4.'],
  keys: 'Tap a pan to plate it · or press 1–4',
  quips: ['Every plate was perfect. The pass is clear.', 'Hot, fast and on time.', 'A few overdone plates went out.', 'Smoke alarm got a workout.', 'The kitchen is a disaster. Grab a fire blanket.'],
  start(J, host) {
    const g = { pans: [], sum: 0, n: 0, perfect: 0, plated: 0, burnt: 0, th: [0, 0, 0.06, 0.18] };
    let rail = '';
    for (let i = 0; i < 4; i++) rail += '<div class="tk off" style="--r:' + ((i % 2 ? 1.4 : -1.2) + (i - 1.5) * 0.4).toFixed(1) + 'deg"><div class="tk-p"><b>Pan off</b><small><span>Ticket</span><i>' + (i + 1) + '</i></small></div></div>';
    host.innerHTML = CK_DEFS + '<div class="gm ck"><div class="ck-top"><span>Plated <b class="p">0</b></span><span class="ck-st">Fire!</span><span>Burnt <b class="b">0</b></span></div><div class="ck-rail">' + rail + '</div><div class="ck-pans"></div></div>';
    g.host = host; g.pEl = $('.ck-top .p', host); g.bEl = $('.ck-top .b', host); g.stEl = $('.ck-st', host);
    g.tks = $$('.tk', host).map(e => ({ el: e, b: $('b', e), sp: $('small span', e) }));
    const box = $('.ck-pans', host);
    for (let i = 0; i < 4; i++) {
      const b = el('button', 'pan cold'); b.type = 'button'; b.tabIndex = -1; b.dataset.i = i; b.setAttribute('aria-label', 'Pan ' + (i + 1));
      b.innerHTML = '<svg class="pv" viewBox="0 0 120 120" aria-hidden="true">' + CK_PAN + '</svg><span class="nm">Cold</span><span class="key">' + (i + 1) + '</span>' + CK_BELL;
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
    s.no = (g.no = (g.no || 0) + 1);
    JA.games.cook.paint(s);
  },
  paint(s) {
    const f = CK_FOOD[s.type];
    s.parts.forEach(p => {
      const col = ckCol(f, +p.dataset.p, s.m);
      if (p.dataset.k === 'stroke') p.style.stroke = col; else p.style.fill = col;
    });
    s.pr.setAttribute('stroke-dasharray', (Math.min(1, s.m) * 100).toFixed(1) + ' 100');
    s.el.style.setProperty('--m', Math.min(1, s.m).toFixed(3));
    s.el.classList.toggle('sweet', s.m > 0.66 && s.m <= 0.83);
    s.el.classList.toggle('late', s.m > 0.83);
  },
  rail(J) {
    const g = J.g;
    g.pans.forEach((s, i) => {
      const k = g.tks[i]; if (!k) return;
      const nm = s.st === 'cook' && s.type ? CK_FOOD[s.type].name : '', key = (s.on ? 'o' : 'x') + nm + (nm ? s.no : '');
      if (s.tkK === key) return; s.tkK = key;
      k.b.textContent = nm || (s.on ? 'Waiting' : 'Pan off'); k.sp.textContent = nm ? 'No. ' + s.no : 'Ticket';
      k.el.classList.toggle('hot', !!nm); k.el.classList.toggle('off', !nm);
    });
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
    s.el.classList.remove('ding'); void s.el.offsetWidth; s.el.classList.add('ding'); JFX.burst(s.el, r[0] === 1 ? 'stars' : 'spark', { n: r[0] === 1 ? 7 : 6, col: r[0] === 1 ? ['#ffd778', '#fff3c4'] : ['#ffb347', '#ffd08a'], fy: 0.4 });
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
          JFX.burst(s.el, 'smoke', { col: '#8a8a8a', n: 9, spread: 50, fy: 0.45, a: 0.55 });
        } else JA.games.cook.paint(s);
      } else if (s.st === 'burnt') {
        s.fx -= dt;
        if (s.fx <= 0) { s.st = 'rest'; s.wait = JR(0.5, 0.9); s.el.classList.remove('burnt'); s.food.innerHTML = ''; s.pr.setAttribute('stroke-dasharray', '0 100'); s.nm.textContent = 'Hot'; }
      }
      if (s.st === 'rest' && s.wait < 0.25 && s.food.firstChild) { s.food.innerHTML = ''; s.pr.setAttribute('stroke-dasharray', '0 100'); s.nm.textContent = 'Hot'; s.el.classList.remove('done'); }
    });
    JA.games.cook.rail(J);
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

