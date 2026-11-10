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

