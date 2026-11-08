// ui.js: Creature Catch's own 2D interface, ported as it is (CC.text, CC.box, CC.say, CC.menu and the rest from the original
// game): the cream boxes with dark brown borders, the Pixelify font with hand-made pixel digits, the typewriter dialog, menus.
// It draws on a 240 x 160 canvas laid over the 3D one. What's new: the speaker's face beside the dialog box is their 3D
// model, filmed live (UI.face asks the 3D view for a close-up in that square).
const UI = (() => {
  const cv = () => document.getElementById('ui');
  let g = null;
  const FONT = 'Pixelify', TS = 11, INK = '#1c1624'; // the dialog's text size and ink
  const text = (str, x, y, color, opts) => {
    opts = opts || {};
    str = String(str).replace(/f([filt])/g, 'f‌$1');
    g.font = (opts.size || 10) + 'px ' + FONT + ', monospace'; g.textBaseline = 'top'; g.textAlign = opts.align || 'left';
    if (opts.shadow !== false) { g.fillStyle = opts.shadow || 'rgba(0,0,0,0.14)'; g.fillText(str, x + .4, y + .45); }
    g.fillStyle = color || INK; g.fillText(str, x, y);
  };
  const DIGITS = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'], ' ': ['', '', '', '', '', '', ''],
  };
  const numWidth = (str) => String(str).length * 6 - 1;
  const num = (str, x, y, color, align) => {
    str = String(str); if (align === 'right') x -= numWidth(str);
    for (let pass = 0; pass < 2; pass++) {
      g.fillStyle = pass ? (color || INK) : 'rgba(0,0,0,0.12)';
      for (let i = 0; i < str.length; i++) { const rows = DIGITS[str[i]] || DIGITS[' ']; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === '1') g.fillRect(Math.round(x) + i * 6 + c + (pass ? 0 : .5), Math.round(y) + r + (pass ? 0 : .5), 1, 1); }
    }
  };
  const textWidth = (str, size) => { g.font = (size || 10) + 'px ' + FONT + ', monospace'; return g.measureText(str).width; };
  function numParts(str) { const parts = String(str).split(/(\d[\d\/]*)/); return parts.map((t, i) => ({ t, num: i % 2 === 1, pad: i % 2 ? (/ $/.test(parts[i - 1]) ? 2 : 0) : (i && /^ /.test(t) ? 2 : 0) })); }
  const textNumWidth = (str, size) => numParts(str).reduce((w, p) => w + p.pad + (p.num ? numWidth(p.t) : textWidth(p.t, size || 10)), 0);
  const textNum = (str, x, y, color, opts) => {
    opts = opts || {}; const size = opts.size || 10, w = textNumWidth(str, size);
    if (opts.align === 'center') x -= w / 2; else if (opts.align === 'right') x -= w;
    numParts(str).forEach((p) => { x += p.pad; if (p.num) { num(p.t, x, y + Math.round((size - 6) / 2), color); x += numWidth(p.t); } else if (p.t) { text(p.t, x, y, color, { size, shadow: opts.shadow }); x += textWidth(p.t, size); } });
    return w;
  };
  const wrap = (str, w, size) => { const out = []; String(str).split('\n').forEach((para) => { let line = ''; para.split(' ').forEach((word) => { const t = line ? line + ' ' + word : word; if (textNumWidth(t, size) > w && line) { out.push(line); line = word; } else line = t; }); out.push(line); }); return out; };
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const box = (x, y, w, h, opts) => {
    opts = opts || {};
    g.fillStyle = '#3a2a22'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = opts.edge || '#c8a878'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    if (opts.hole) { g.clearRect(x + 3, y + 3, w - 6, h - 6); return; }
    g.fillStyle = opts.fill || '#fbf3e0'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle = 'rgba(200,168,120,0.25)'; g.fillRect(x + 2, y + h - 4, w - 4, 2);
  };
  const cursor = (x, y) => { const bob = Math.round(Math.sin(G.t * 8)); g.fillStyle = '#3a2a22'; for (let i = 0; i < 4; i++) g.fillRect(x + bob + i, y + i, 1, 7 - i * 2); };
  const hpColor = (k) => (k > .5 ? '#48c050' : k > .2 ? '#f0c020' : '#e84838');
  const bar = (x, y, w, k, color) => { rect(x - 1, y - 1, w + 2, 5, '#3a2a22'); rect(x, y, w, 3, '#5a5060'); rect(x, y, Math.round(w * G.clamp(k, 0, 1)), 3, color || hpColor(k)); rect(x, y, Math.round(w * G.clamp(k, 0, 1)), 1, 'rgba(255,255,255,0.35)'); };
  const scrollArrow = (x, y, dir) => { const bob = Math.round(Math.sin(G.t * 6)) * dir; g.fillStyle = '#6a3a2a'; for (let i = 0; i < 3; i++) g.fillRect(x + i, y + bob + (dir > 0 ? i : 2 - i), 7 - i * 2, 1); };

  // ---------- the speaker's face: a live close-up of their 3D model ----------
  let faceReq = null; // { who, x, y, w, h } in UI pixels, read by the 3D view after it draws
  const face = (who, x, y, size) => {
    if (!who || !UI.hasFace || !UI.hasFace(who)) return false;
    box(x, y, size, size, { hole: true }); faceReq = { who, x: x + 3, y: y + 3, w: size - 6, h: size - 6 }; return true;
  };
  function speakerTag(who) {
    const w = textWidth(who, 9) + 10, hasFace = face(who, 4, 61, 42);
    box(hasFace ? 48 : 4, 99, w, 14, { fill: '#f0e2c8' }); text(who, (hasFace ? 48 : 4) + 5, 101, '#6a3a2a', { size: 9 });
  }

  // ---------- dialog ----------
  const say = (txt, opts) => {
    opts = opts || {};
    return new Promise((resolve) => {
      const lines = wrap(txt, 222, TS); let page = 0, shown = 0;
      const scr = {
        name: 'say', who: opts.who,
        update(dt) {
          const pageText = lines.slice(page * 2, page * 2 + 2).join('\n');
          if (shown < pageText.length) { shown += dt * (G.input.held.a || G.input.held.b ? 160 : [30, 55, 110][CC.opts.text]); if (G.input.pressed.a || G.input.pressed.b) shown = pageText.length; return; }
          if (opts.auto != null) { opts.auto -= dt; if (opts.auto > 0) return; } else if (!(G.input.pressed.a || G.input.pressed.b)) return;
          if (opts.auto == null) CC.sfx('blip');
          if ((page + 1) * 2 < lines.length) { page++; shown = 0; return; }
          G.pop(scr); resolve();
        },
        draw() {
          box(0, 112, 240, 48);
          const pageText = lines.slice(page * 2, page * 2 + 2).join('\n').slice(0, Math.floor(shown));
          pageText.split('\n').forEach((l, i) => textNum(l, 9, 117 + i * 16, INK, { size: TS }));
          if (opts.who) speakerTag(opts.who);
          const done = Math.floor(shown) >= lines.slice(page * 2, page * 2 + 2).join('\n').length;
          if (done && opts.auto == null && Math.floor(G.t * 3) % 2) { rect(226, 149, 6, 2, '#6a3a2a'); rect(228, 151, 2, 2, '#6a3a2a'); }
        },
      };
      G.push(scr);
    });
  };
  const talk = async (who, lines) => { for (const l of lines) await say(l, { who }); };
  const menu = (items, opts) => {
    opts = opts || {};
    return new Promise((resolve) => {
      let sel = opts.start || 0; const rowH = opts.rowH || 14, head = opts.title ? 14 : 0;
      const labels = items.map((it) => (typeof it === 'string' ? { label: it } : it));
      const w = opts.w || Math.max(...labels.map((l) => textNumWidth(l.label, 10) + (l.right ? textNumWidth(String(l.right), 10) + 12 : 0))) + 26;
      const room = opts.y != null ? G.H - 2 - opts.y : 108;
      const fit = (pad) => opts.maxRows || Math.max(3, Math.floor((room - 10 - head - pad * 2) / rowH));
      const rows = labels.length > fit(0) ? Math.min(labels.length, fit(3)) : labels.length; let top = 0;
      const pad = rows < labels.length ? 3 : 0, h = rows * rowH + 10 + head + pad * 2;
      const x = opts.x != null ? opts.x : G.W - w - 2, y = opts.y != null ? opts.y : 110 - h;
      const follow = () => { top = G.clamp(top, Math.max(0, sel - rows + 1), Math.min(sel, labels.length - rows)); };
      follow();
      const scr = {
        name: 'menu',
        update() {
          const was = sel, n = labels.length;
          if (G.repeat('down')) sel = (sel + 1) % n;
          if (G.repeat('up')) sel = (sel + n - 1) % n;
          if (sel !== was) { follow(); CC.sfx('blip'); if (opts.onMove) opts.onMove(sel); }
          if (G.input.pressed.a) { if (labels[sel].disabled) { CC.sfx('bump'); return; } CC.sfx('select'); G.pop(scr); resolve(sel); }
          else if ((G.input.pressed.b || (opts.startCloses && G.input.pressed.start)) && !opts.noCancel) { CC.sfx('back'); G.pop(scr); resolve(-1); }
        },
        draw() {
          if (opts.under) opts.under(sel);
          box(x, y, w, h);
          let ty = y + 6;
          if (opts.title) { textNum(opts.title, x + 8, ty, '#6a3a2a', { size: 9 }); ty += 14; }
          ty += pad;
          labels.slice(top, top + rows).forEach((l, i) => { textNum(l.label, x + 16, ty + i * rowH, l.disabled ? '#a89c90' : '#1c1624'); if (l.right != null) textNum(String(l.right), x + w - 8, ty + i * rowH, '#6a5a50', { align: 'right' }); });
          cursor(x + 7, ty + (sel - top) * rowH + 2);
          if (top > 0) scrollArrow(x + w - 14, ty - 4, -1);
          if (top + rows < labels.length) scrollArrow(x + w - 14, ty + rows * rowH, 1);
        },
      };
      G.push(scr);
    });
  };
  const questionBox = (lines, who) => () => { box(0, 112, 240, 48); lines.forEach((l, i) => textNum(l, 9, 117 + i * 16, INK, { size: TS })); if (who) speakerTag(who); };
  const yesNo = async (question, who, opts) => {
    await say(question, { who });
    const lines = wrap(question, 222, TS), lastP = Math.floor((lines.length - 1) / 2) * 2;
    return (await menu(['Yes', 'No'], Object.assign({ y: 74, under: questionBox(lines.slice(lastP, lastP + 2), who) }, opts))) === 0;
  };
  const ask = (question, options, who) => { const lines = wrap(question, 222, TS); return menu(options, { under: questionBox(lines.slice(0, 2), who), y: 108 - (options.length * 14 + 10) }); };
  // a line that floats up and fades (damage, "LEVEL UP!"), at a UI point
  const pops = [];
  const pop = (str, x, y, color, size) => pops.push({ str, x, y, color: color || '#ffffff', size: size || 10, t: 0 });
  // a toast in the corner (a place's name as you walk in)
  let toastT = 0, toastS = '';
  const toast = (s) => { toastS = s; toastT = 2.6; };

  // the canvas is as sharp as the screen it is shown on: 240 x 160 layout units, drawn K device pixels each
  let K = 0;
  function fit() {
    const c = cv(), f = G.frame, k = Math.max(2, Math.min(8, Math.round(f.w * (f.pr || 1) / 240)));
    if (k !== K || c.width !== 240 * k) { K = k; c.width = 240 * k; c.height = 160 * k; g = c.getContext('2d'); }
    g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = true;
  }
  function draw() {
    if (!g) g = cv().getContext('2d');
    fit();
    g.clearRect(0, 0, 240, 160); faceReq = null;
    for (const s of G.screens) if (s.draw) s.draw();
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += G.dt; if (p.t > 1.1) { pops.splice(i, 1); continue; }
      g.globalAlpha = 1 - G.clamp((p.t - .7) / .4, 0, 1); text(p.str, p.x, p.y - p.t * 14, p.color, { size: p.size, align: 'center', shadow: '#1a1426' }); g.globalAlpha = 1;
    }
    if (toastT > 0) {
      toastT -= G.dt; const k = Math.min(1, toastT / .4, (2.6 - toastT) / .3), w = textWidth(toastS, 10) + 18;
      g.globalAlpha = G.clamp(k, 0, 1); box(4, 4, w, 18); text(toastS, 13, 8, '#6a3a2a'); g.globalAlpha = 1;
    }
    if (G.fadeA > 0) { g.globalAlpha = G.clamp(G.fadeA, 0, 1); rect(0, 0, 240, 160, G.fadeCol); g.globalAlpha = 1; }
  }
  return {
    get g() { return g; }, text, num, numWidth, textNum, textNumWidth, textWidth, wrap, rect, box, cursor, hpColor, bar, scrollArrow,
    say, talk, menu, yesNo, ask, pop, toast, draw, get faceReq() { return faceReq; }, hasFace: null,
    init() { g = cv().getContext('2d'); },
  };
})();
