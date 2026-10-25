// Core: the screen, the loop, input, screens stack, waiting helpers, drawing helpers, sound, saves.
var CC = window.CC || (window.CC = {});
CC.W = 240; CC.H = 160;

(function () {
  var canvas = document.getElementById('screen');
  var g = canvas.getContext('2d');
  CC.canvas = canvas; CC.g = g;
  var scale = 1;

  // the biggest scale that fits w x h (whole pixels when there's room)
  function fit(w, h) { var s = Math.min(w / CC.W, h / CC.H); return s >= 2 ? Math.floor(s) : s; }
  // Sizes the canvas to the window, inside the notch and home bar insets (the body's padding). On a touch screen the pad
  // goes under the canvas (upright, scaled down on phones narrower than its two halves) or, when that gives a bigger
  // game, one half on each side of it (sideways), as wide as the canvas leaves them. The halves' size comes from the CSS.
  CC.resize = function () {
    var body = document.body, cs = window.getComputedStyle(body), inset = function (k) { return parseFloat(cs['padding' + k]) || 0; };
    var inL = inset('Left'), inR = inset('Right'), inT = inset('Top');
    var availW = window.innerWidth - inL - inR, availH = window.innerHeight - inT - inset('Bottom');
    var s = fit(availW, availH);
    if (body.classList.contains('touch')) {
      var pad = document.getElementById('pad'), halves = [document.getElementById('padL'), document.getElementById('padR')];
      var pw = halves[0].offsetWidth, ph = halves[0].offsetHeight;
      var kU = Math.min(1, availW / (2 * pw)), sU = fit(availW, availH - ph * kU);
      var kS = CC.clamp((availW - Math.min(2 * CC.W, availH * CC.W / CC.H)) / 2 / pw, 0.7, 1), sS = fit(availW - 2 * pw * kS, availH);
      var side = availW > availH && sS >= sU, k = side ? kS : kU;
      body.classList.toggle('side', side);
      pad.style.height = side ? '' : ph * k + 'px';
      var rightX = side ? window.innerWidth - inR - pw * k : pad.clientWidth - pw * k, y = side ? inT + (availH - ph * k) / 2 : 0;
      halves.forEach(function (h, i) {
        h.style.left = (i ? rightX : side ? inL : 0) + 'px'; h.style.right = 'auto'; h.style.top = y + 'px';
        h.style.transform = k < 1 ? 'scale(' + k + ')' : '';
      });
      s = side ? sS : sU;
    }
    var cssW = Math.floor(CC.W * s), cssH = Math.floor(CC.H * s);
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    scale = canvas.width / CC.W;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.imageSmoothingEnabled = false;
  };
  window.addEventListener('resize', CC.resize);

  // ---------- input ----------
  var KEYS = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b', Enter: 'start', KeyM: 'start',
    KeyQ: 'l', KeyU: 'l', KeyE: 'r', KeyO: 'r',
  };
  var held = {}, pressed = {}, repeatT = {};
  CC.input = { held: held, pressed: pressed };
  function down(b) { if (!held[b]) { pressed[b] = true; repeatT[b] = 0.35; } held[b] = true; CC.audioUnlock(); }
  function up(b) { held[b] = false; }
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return; // typing a code
    var b = KEYS[e.code]; if (!b) return; e.preventDefault(); if (!e.repeat) down(b);
  });
  window.addEventListener('keyup', function (e) { var b = KEYS[e.code]; if (b) up(b); });
  window.addEventListener('blur', function () { for (var k in held) held[k] = false; });

  // on-screen pad for touch
  var PAD = { bUp: 'up', bDown: 'down', bLeft: 'left', bRight: 'right', bA: 'a', bB: 'b', bStart: 'start', bL: 'l', bR: 'r' };
  function enableTouch() {
    if (document.body.classList.contains('touch')) return;
    document.body.classList.add('touch'); CC.resize();
  }
  window.addEventListener('touchstart', enableTouch, { passive: true });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  Object.keys(PAD).forEach(function (id) {
    var el = document.getElementById(id), b = PAD[id], dir = /^(up|down|left|right)$/.test(b);
    function on(e) { e.preventDefault(); el.classList.add('on'); down(b); }
    function off(e) { e.preventDefault(); el.classList.remove('on'); up(b); }
    el.addEventListener('pointerdown', function (e) {
      // the d-pad lets go of a touch, so a thumb sliding onto another direction presses that one (A, B and MENU keep it)
      if (dir && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      on(e);
    });
    if (dir) el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch' || (e.buttons & 1)) on(e); });
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  });

  // a menu cursor wants repeats while a direction is held
  CC.repeat = function (b) {
    return !!(pressed[b] || pressed[b + '_rep']);
  };

  // ---------- screens ----------
  // A screen is { update(dt), draw(), opaque }. Only the top one updates; all draw from the lowest opaque one up.
  CC.stack = [];
  CC.push = function (s) { CC.stack.push(s); return s; };
  CC.pop = function (s) {
    var i = CC.stack.lastIndexOf(s);
    if (i >= 0) CC.stack.splice(i, 1);
  };
  CC.top = function () { return CC.stack[CC.stack.length - 1]; };

  // ---------- waiting ----------
  var waiters = [];
  CC.until = function (pred) { return new Promise(function (res) { waiters.push({ pred: pred, res: res }); }); };
  CC.sleep = function (sec) { var t = CC.time + sec; return CC.until(function () { return CC.time >= t; }); };
  // runs fn(k) each frame with k going 0 to 1 over sec
  CC.tween = function (sec, fn) {
    var t0 = CC.time;
    fn(0);
    return CC.until(function () { var k = Math.min(1, (CC.time - t0) / sec); fn(k); return k >= 1; });
  };

  // ---------- loop ----------
  CC.time = 0;
  var last = 0;
  // a screen that throws is reported once (not every frame), and the game keeps running. The error is thrown again
  // outside the loop, so the page still sees it as uncaught (window.onerror, and the tests' page errors)
  function oops(s, e) {
    if (s.threw) return;
    s.threw = true; console.error('Creature Catch: ' + (s.name || 'a screen') + ' broke:', e);
    setTimeout(function () { throw e; });
  }
  var loop = { name: 'the main loop' };
  function frame(now) {
    try { step(now); } catch (e) { oops(loop, e); }
    finally { for (var p in pressed) delete pressed[p]; requestAnimationFrame(frame); } // the next frame always comes
  }
  function step(now) {
    var gap = (now - last) / 1000; last = now;
    var dt = Math.min(0.05, gap || 0.016) * ((CC.dev && CC.dev.speed) || 1);
    CC.time += dt; CC.dt = dt;
    // play time: real time while a game is going (battles, menus and talking too), not a hidden tab's gap or dev speed
    if (CC.state && CC.world && CC.stack.indexOf(CC.world) >= 0 && gap > 0 && gap < 1) CC.state.playTime = (CC.state.playTime || 0) + gap;
    for (var k in repeatT) if (held[k]) { repeatT[k] -= dt; if (repeatT[k] <= 0) { pressed[k + '_rep'] = true; repeatT[k] += 0.09; } }
    var top = CC.top();
    if (top && top.update) { try { top.update(dt); } catch (e) { oops(top, e); } }
    var ws = waiters; waiters = [];
    ws.forEach(function (w) {
      var done = true;
      try { done = w.pred(); } catch (e) { oops({ name: 'a wait' }, e); } // a wait that breaks ends, so its script goes on
      if (done) w.res(); else waiters.push(w);
    });
    // draw
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.imageSmoothingEnabled = false; g.globalAlpha = 1;
    g.fillStyle = '#000'; g.fillRect(0, 0, CC.W, CC.H);
    var from = 0;
    for (var i = CC.stack.length - 1; i >= 0; i--) if (CC.stack[i].opaque) { from = i; break; }
    for (var j = from; j < CC.stack.length; j++) {
      var s = CC.stack[j];
      g.save();
      try { s.draw(); } catch (e) { oops(s, e); } finally { g.restore(); }
    }
    CC.fx.draw();
  }
  CC.start = function () { CC.resize(); requestAnimationFrame(function (t) { last = t; frame(t); }); };
})();

// ---------- small helpers ----------
CC.rand = function (a, b) { return a + Math.random() * (b - a); };
CC.randi = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
CC.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
CC.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
CC.lerp = function (a, b, k) { return a + (b - a) * k; };
CC.ease = function (k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
CC.easeOut = function (k) { return 1 - (1 - k) * (1 - k); };

// ---------- drawing ----------
CC.FONT = 'Pixelify';
CC.text = function (str, x, y, color, opts) {
  var g = CC.g; opts = opts || {};
  str = String(str).replace(/f([filt])/g, 'f\u200c$1'); // break the font's ligatures
  g.font = (opts.size || 10) + 'px ' + CC.FONT + ', monospace';
  g.textBaseline = 'top';
  g.textAlign = opts.align || 'left';
  if (opts.shadow !== false) { g.fillStyle = opts.shadow || 'rgba(0,0,0,0.18)'; g.fillText(str, x + 0.5, y + 0.6); }
  g.fillStyle = color || '#2a2230';
  g.fillText(str, x, y);
};
// Numbers in a hand-made 5 x 7 pixel font: the main font's small "2" reads as an "8".
var DIGITS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'], ' ': ['', '', '', '', '', '', ''],
};
CC.numWidth = function (str) { return String(str).length * 6 - 1; };
// draws digits (and / and spaces); x is the left edge, or the right edge with align 'right'
CC.num = function (str, x, y, color, align) {
  var g = CC.g; str = String(str);
  if (align === 'right') x -= CC.numWidth(str);
  for (var pass = 0; pass < 2; pass++) {
    g.fillStyle = pass ? (color || '#2a2230') : 'rgba(0,0,0,0.15)';
    for (var i = 0; i < str.length; i++) {
      var rows = DIGITS[str[i]] || DIGITS[' '];
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) if (rows[r][c] === '1') g.fillRect(Math.round(x) + i * 6 + c + (pass ? 0 : 0.5), Math.round(y) + r + (pass ? 0 : 0.5), 1, 1);
    }
  }
};
// a line of text whose numbers use the pixel digits; opts: size (of the words, default 10), align (left, center,
// right), shadow. Only digits, / and spaces go to CC.num; everything else is drawn in the font.
// the line in parts, numbers apart; the font's space is narrow beside the pixel digits, so a number after a space,
// and a word after a number and a space, get 2 px more (pad)
function numParts(str) {
  var parts = String(str).split(/(\d[\d\/]*)/);
  return parts.map(function (t, i) {
    return { t: t, num: i % 2 === 1, pad: i % 2 ? (/ $/.test(parts[i - 1]) ? 2 : 0) : (i && /^ /.test(t) ? 2 : 0) };
  });
}
CC.textNumWidth = function (str, size) {
  return numParts(str).reduce(function (w, p) { return w + p.pad + (p.num ? CC.numWidth(p.t) : CC.textWidth(p.t, size || 10)); }, 0);
};
CC.textNum = function (str, x, y, color, opts) {
  opts = opts || {};
  var size = opts.size || 10, w = CC.textNumWidth(str, size);
  if (opts.align === 'center') x -= w / 2; else if (opts.align === 'right') x -= w;
  numParts(str).forEach(function (p) {
    x += p.pad;
    if (p.num) { CC.num(p.t, x, y + Math.round((size - 6) / 2), color); x += CC.numWidth(p.t); }
    else if (p.t) { CC.text(p.t, x, y, color, { size: size, shadow: opts.shadow }); x += CC.textWidth(p.t, size); }
  });
  return w;
};
CC.textWidth = function (str, size) {
  CC.g.font = (size || 10) + 'px ' + CC.FONT + ', monospace';
  return CC.g.measureText(str).width;
};
// wraps text to lines no wider than w (measured with the pixel digits, which CC.textNum draws and are a little wider)
CC.wrap = function (str, w, size) {
  var out = [];
  String(str).split('\n').forEach(function (para) {
    var line = '';
    para.split(' ').forEach(function (word) {
      var t = line ? line + ' ' + word : word;
      if (CC.textNumWidth(t, size) > w && line) { out.push(line); line = word; } else line = t;
    });
    out.push(line);
  });
  return out;
};
CC.rect = function (x, y, w, h, c) { CC.g.fillStyle = c; CC.g.fillRect(x, y, w, h); };
// the cream box with a dark brown border used by every menu
CC.box = function (x, y, w, h, opts) {
  opts = opts || {};
  var g = CC.g;
  g.fillStyle = '#3a2a22'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = opts.edge || '#c8a878'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = opts.fill || '#fbf3e0'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = 'rgba(200,168,120,0.25)'; g.fillRect(x + 2, y + h - 4, w - 4, 2);
};
CC.cursor = function (x, y) {
  var g = CC.g, bob = Math.round(Math.sin(CC.time * 8));
  g.fillStyle = '#3a2a22';
  for (var i = 0; i < 4; i++) g.fillRect(x + bob + i, y + i, 1, 7 - i * 2);
};
CC.hpColor = function (k) { return k > 0.5 ? '#48c050' : k > 0.2 ? '#f0c020' : '#e84838'; };
CC.bar = function (x, y, w, k, color) {
  CC.rect(x - 1, y - 1, w + 2, 5, '#3a2a22');
  CC.rect(x, y, w, 3, '#5a5060');
  CC.rect(x, y, Math.round(w * CC.clamp(k, 0, 1)), 3, color || CC.hpColor(k));
  CC.rect(x, y, Math.round(w * CC.clamp(k, 0, 1)), 1, 'rgba(255,255,255,0.35)');
};

// ---------- sound (synth beeps, no files) ----------
// Two volume knobs (CC.opts.sfx and CC.opts.music, 0 to 10): sound effects and the music each have their own gain.
(function () {
  var ac = null, muted = false, sfxGain = null, musicGain = null;
  CC.audioUnlock = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    sfxGain = ac.createGain(); sfxGain.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.connect(ac.destination);
    CC.setVolumes();
    if (CC.music) CC.music.unlocked();
  };
  CC.audio = function () { return ac && { ac: ac, music: musicGain, sfx: sfxGain }; };
  CC.setVolumes = function () {
    if (!ac) return;
    var o = CC.opts || {};
    sfxGain.gain.value = (o.sfx == null ? 8 : o.sfx) / 8;
    musicGain.gain.value = (o.music == null ? 6 : o.music) / 10 * 0.55;
  };
  function tone(freq, dur, type, vol, slide, delay) {
    if (!ac || muted) return;
    var t = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), v = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    v.gain.setValueAtTime((vol || 0.08), t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v); v.connect(sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, delay) {
    if (!ac || muted) return;
    var t = ac.currentTime + (delay || 0), n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ac.createBufferSource(), v = ac.createGain();
    s.buffer = buf; v.gain.value = vol || 0.1; s.connect(v); v.connect(sfxGain); s.start(t);
  }
  CC.sfx = function (name) {
    switch (name) {
      case 'blip': tone(880, 0.05, 'square', 0.04); break;
      case 'select': tone(660, 0.05, 'square', 0.05); tone(990, 0.07, 'square', 0.05, 0, 0.05); break;
      case 'back': tone(440, 0.07, 'square', 0.04, 0.7); break;
      case 'bump': tone(110, 0.08, 'triangle', 0.08); break;
      case 'rustle': noise(0.18, 0.06); break;
      case 'encounter': [0, 0.08, 0.16, 0.24].forEach(function (d, i) { tone(330 + i * 110, 0.07, 'square', 0.05, 0, d); }); break;
      case 'hit': noise(0.12, 0.12); tone(160, 0.12, 'square', 0.06, 0.5); break;
      case 'superhit': noise(0.2, 0.16); tone(220, 0.2, 'sawtooth', 0.07, 0.3); break;
      case 'weakhit': noise(0.08, 0.06); break;
      case 'throw': tone(500, 0.25, 'triangle', 0.06, 2); break;
      case 'wobble': tone(240, 0.08, 'square', 0.05); tone(200, 0.08, 'square', 0.05, 0, 0.09); break;
      case 'catch': [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'square', 0.05, 0, i * 0.1); }); break;
      case 'breakout': noise(0.15, 0.1); tone(300, 0.2, 'square', 0.05, 0.4); break;
      case 'faint': tone(400, 0.5, 'square', 0.05, 0.2); break;
      case 'heal': [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'triangle', 0.06, 0, i * 0.11); }); break;
      case 'levelup': [392, 523, 659, 784].forEach(function (f, i) { tone(f, 0.1, 'square', 0.05, 0, i * 0.08); }); break;
      case 'buy': tone(988, 0.06, 'square', 0.05); tone(1319, 0.12, 'square', 0.05, 0, 0.06); break;
      case 'statup': tone(400, 0.25, 'triangle', 0.06, 2.2); break;
      case 'statdown': tone(700, 0.25, 'triangle', 0.06, 0.4); break;
      case 'evolve': [262, 330, 392, 523, 392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.06, 0, i * 0.14); }); break;
      case 'status': tone(300, 0.2, 'sawtooth', 0.04, 0.6); break;
      case 'shoot': noise(0.1, 0.05); tone(700, 0.12, 'square', 0.03, 0.5); break;
      case 'xp': tone(880, 0.04, 'square', 0.025); tone(1175, 0.04, 'square', 0.025, 0, 0.05); break;
      case 'shiny': [1568, 2093, 1568, 2637].forEach(function (f, i) { tone(f, 0.08, 'square', 0.035, 0, i * 0.07); }); break;
      case 'gate': noise(0.5, 0.12); tone(70, 0.5, 'triangle', 0.1, 0.6); tone(55, 0.4, 'square', 0.04, 0.8, 0.2); break;
      case 'chest': [392, 523, 659, 1047].forEach(function (f, i) { tone(f, 0.09, 'square', 0.045, 0, i * 0.07); }); break;
      case 'charm': [523, 523, 523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, i === 7 ? 0.4 : 0.11, 'square', 0.05, 0, [0, 0.12, 0.24, 0.36, 0.48, 0.66, 0.78, 0.96][i]); }); break;
      case 'moon': [659, 784, 988, 1319, 988, 1319, 1568].forEach(function (f, i) { tone(f, 0.5, 'sine', 0.05, 0, i * 0.22); }); break;
      case 'boss': [110, 104, 98, 92].forEach(function (f, i) { tone(f, 0.35, 'sawtooth', 0.06, 0.9, i * 0.3); }); noise(1.2, 0.08); break;
    }
  };
})();

// ---------- options (kept apart from the save, so they apply on the title screen too) ----------
CC.OPTS_KEY = 'creature-catch-options';
CC.opts = { music: 6, sfx: 8, text: 1, follower: true, daynight: 'clock' };
try { var savedOpts = JSON.parse(localStorage.getItem(CC.OPTS_KEY) || '{}'); for (var ok in savedOpts) CC.opts[ok] = savedOpts[ok]; } catch (e) { /* defaults */ }
CC.saveOpts = function () { try { localStorage.setItem(CC.OPTS_KEY, JSON.stringify(CC.opts)); } catch (e) { /* no storage */ } CC.setVolumes(); };

// ---------- saves ----------
// Three save files. File 1 uses the key the game always used, so older saves show up there.
CC.SLOTS = 3;
CC.slot = 1;
CC.slotKey = function (n) { return 'creature-catch-save-' + (n || CC.slot); };
CC.SAVE_KEY = CC.slotKey(1);
function readSlot(n) { try { var s = localStorage.getItem(CC.slotKey(n)); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
// any save at all (no number), or that file
CC.hasSave = function (n) {
  if (n) return !!readSlot(n);
  for (var i = 1; i <= CC.SLOTS; i++) if (readSlot(i)) return true;
  return false;
};
CC.saveGame = function () {
  try { localStorage.setItem(CC.slotKey(), JSON.stringify(CC.state)); CC.opts.lastSlot = CC.slot; CC.saveOpts(); return true; } catch (e) { return false; }
};
CC.loadGame = function (n) {
  var s = readSlot(n || CC.slot);
  if (!s) return false;
  if (n) CC.slot = n;
  CC.state = s;
  // a shiny that evolved before v12 wasn't marked shiny for its new form in the Creature Log
  (s.party || []).concat(s.vault || []).forEach(function (m) { if (m && m.shiny) { s.shinyCaught = s.shinyCaught || {}; s.shinyCaught[m.id] = 1; } });
  return true;
};
CC.deleteSave = function (n) { try { localStorage.removeItem(CC.slotKey(n)); } catch (e) { /* no storage */ } };
// what a file holds, for the file picker
CC.saveInfo = function (n) {
  var s = readSlot(n);
  if (!s) return null;
  var charms = ['trial1', 'trialForest', 'trialWater', 'trialCave', 'trialDesert', 'trialSnow', 'trialSwamp', 'trialRuins'].filter(function (k) { return s.flags && s.flags[k]; }).length;
  var lead = s.party && s.party[0];
  return { look: s.look || 'player-a', lead: lead && lead.id, leadLv: lead && lead.lv, caught: Object.keys(s.caught || {}).filter(function (id) { return CC.CREATURES && CC.CREATURES[id]; }).length,
    charms: charms, time: s.playTime || 0, place: (CC.MAPS && CC.MAPS[s.map] && CC.MAPS[s.map].name) || '', moon: !!(s.flags && s.flags.moonRestored) };
};
