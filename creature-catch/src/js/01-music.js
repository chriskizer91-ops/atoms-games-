// The soundtrack: GBA-style chiptune played by Web Audio, no files. Each track is a chord list plus a melody;
// the bass, the arpeggio and the drums are patterns played over each chord. CC.music.play('route') crossfades.
//
// Notes: 'E5:4' is E in octave 5 held for 4 sixteenths; '-:2' is a rest. Bar lines '|' are only for reading.
// Bass and arpeggio patterns use chord steps: R (root), 3, 5, 8 (octave), 10 (the third, an octave up).
// Drums: k (kick), s (snare), h (hat), o (open hat).
var CC = window.CC || (window.CC = {});

(function () {
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(name) { // 'F#5' -> 78
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
    if (!m) return null;
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  function freq(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  // 'C#m' -> { root: 1, minor: true }
  function chord(name) {
    var m = /^([A-G])([#b]?)(m?)/.exec(name);
    return { root: NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), minor: !!m[3] };
  }
  var STEP = { R: 0, '1': 0, '3': null, '5': 7, '8': 12, '10': null };
  function chordStep(c, step, oct) {
    var base = 12 * (oct + 1) + c.root, third = c.minor ? 3 : 4;
    if (step === '3') return base + third;
    if (step === '10') return base + 12 + third;
    return base + STEP[step];
  }
  function tokens(str) { return str.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean).map(function (t) { var p = t.split(':'); return [p[0], +(p[1] || 1)]; }); }

  // a track's notes as events on a grid of sixteenths: { at, len, midi | drum, ch }
  function build(tr) {
    var cl = tr.chordLen || 16, chords = tr.chords.map(chord), len = chords.length * cl, ev = [];
    var at = 0;
    tokens(tr.lead).forEach(function (t) { if (t[0] !== '-') ev.push({ at: at, len: t[1], midi: midi(t[0]), ch: 'lead' }); at += t[1]; });
    if (tr.echo) ev.filter(function (e) { return e.ch === 'lead'; }).forEach(function (e) { ev.push({ at: (e.at + 3) % len, len: e.len, midi: e.midi, ch: 'echo' }); });
    ['bass', 'arp'].forEach(function (ch) {
      if (!tr[ch]) return;
      var pat = tokens(tr[ch]), oct = ch === 'bass' ? (tr.bassOct || 2) : (tr.arpOct || 4);
      chords.forEach(function (c, ci) {
        var a = ci * cl;
        while (a < (ci + 1) * cl) {
          pat.forEach(function (t) { if (a < (ci + 1) * cl && t[0] !== '-') ev.push({ at: a, len: t[1], midi: chordStep(c, t[0], oct), ch: ch }); a += t[1]; });
        }
      });
    });
    if (tr.drums) {
      var dp = tokens(tr.drums), d = 0;
      while (d < len) dp.forEach(function (t) { if (d < len && t[0] !== '-') ev.push({ at: d, len: t[1], drum: t[0], ch: 'drums' }); d += t[1]; });
    }
    var byStep = [];
    ev.forEach(function (e) { (byStep[e.at] = byStep[e.at] || []).push(e); });
    return { len: len, byStep: byStep, bpm: tr.bpm, tr: tr };
  }

  // ---------- the instruments ----------
  var waves = {}, noiseBuf = null;
  function pulse(ac, duty) { // a pulse wave with a narrow duty cycle, the GBA's thin square
    var k = 'p' + duty;
    if (waves[k]) return waves[k];
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) im[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * duty);
    return (waves[k] = ac.createPeriodicWave(re, im));
  }
  function noise(ac) {
    if (noiseBuf) return noiseBuf;
    var n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuf = b);
  }
  var VOICE = { // wave, volume, how long the note rings (fraction of its length), vibrato
    lead: { wave: 'pulse25', vol: 0.12, gate: 0.92, vib: true },
    echo: { wave: 'pulse25', vol: 0.04, gate: 0.8 },
    arp: { wave: 'pulse12', vol: 0.045, gate: 0.6 },
    bass: { wave: 'triangle', vol: 0.2, gate: 0.85 },
  };
  function playNote(ac, out, e, t, stepDur, tr) {
    if (e.drum) return playDrum(ac, out, e.drum, t);
    var v = Object.assign({}, VOICE[e.ch], (tr.voices || {})[e.ch]), dur = e.len * stepDur * v.gate, f = freq(e.midi);
    var o = ac.createOscillator(), g = ac.createGain();
    if (v.wave === 'pulse25') o.setPeriodicWave(pulse(ac, 0.25));
    else if (v.wave === 'pulse12') o.setPeriodicWave(pulse(ac, 0.125));
    else o.type = v.wave;
    o.frequency.setValueAtTime(f, t);
    if (v.vib && dur > 0.35) { // a little vibrato on long notes, after they start
      var lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.25);
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v.vol, t + 0.008);
    g.gain.linearRampToValueAtTime(v.vol * 0.7, t + Math.min(0.12, dur * 0.5));
    g.gain.setValueAtTime(v.vol * 0.7, t + Math.max(0.01, dur - 0.03));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function playDrum(ac, out, d, t) {
    var g = ac.createGain();
    g.connect(out);
    if (d === 'k') {
      var o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); o.start(t); o.stop(t + 0.18);
      return;
    }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter();
    s.buffer = noise(ac);
    var long = d === 's' ? 0.13 : d === 'o' ? 0.12 : 0.035;
    f.type = d === 's' ? 'bandpass' : 'highpass'; f.frequency.value = d === 's' ? 1800 : 7000;
    g.gain.setValueAtTime(d === 's' ? 0.13 : 0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + long);
    s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + long + 0.01);
  }

  // ---------- the player: looks a little ahead and schedules what's coming ----------
  var built = {}, cur = null, want = null, timer = null;
  function tick() {
    var A = CC.audio();
    if (!A || !cur) return;
    var ac = A.ac;
    while (cur.next < ac.currentTime + 0.15) {
      var list = cur.song.byStep[cur.step];
      if (list) for (var i = 0; i < list.length; i++) playNote(ac, cur.gain, list[i], cur.next, cur.stepDur, cur.song.tr);
      cur.step = (cur.step + 1) % cur.song.len;
      cur.next += cur.stepDur;
    }
  }
  function start(id) {
    var A = CC.audio();
    if (!A || !CC.TRACKS[id]) return;
    var ac = A.ac, song = built[id] || (built[id] = build(CC.TRACKS[id]));
    if (cur) { // fade the old one out
      var old = cur.gain;
      old.gain.setValueAtTime(old.gain.value, ac.currentTime); old.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4);
      setTimeout(function () { old.disconnect(); }, 600);
    }
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.linearRampToValueAtTime(1, ac.currentTime + 0.3);
    g.connect(A.music);
    cur = { id: id, song: song, step: 0, next: ac.currentTime + 0.08, stepDur: 60 / song.bpm / 4, gain: g };
    if (!timer) timer = setInterval(tick, 25);
  }
  CC.music = {
    play: function (id) {
      if (!id || (cur && cur.id === id) || want === id && !CC.audio()) { want = id; return; }
      want = id;
      start(id);
    },
    stop: function () {
      var A = CC.audio();
      if (cur && A) { var old = cur.gain; old.gain.linearRampToValueAtTime(0.0001, A.ac.currentTime + 0.3); setTimeout(function () { old.disconnect(); }, 500); }
      cur = null; want = null;
    },
    current: function () { return cur ? cur.id : want; },
    unlocked: function () { if (want && !cur) start(want); },
  };

  // which track plays where
  var MAP_TRACK = CC.MAP_TRACK = { village: 'village', meadow: 'route', grassland: 'route', forest: 'route', water: 'route', desert: 'route', cave: 'cave', snow: 'snow', swamp: 'swamp', ruins: 'ruins', spire: 'spire' };
  CC.mapTrack = function (mapId) {
    if (MAP_TRACK[mapId]) return MAP_TRACK[mapId];
    var m = CC.MAPS[mapId];
    if (m && m.indoors) { // rooms play their town's music: the village's, Copperbell's, or the outpost's cozy version
      var out = m.exits && m.exits[0] && m.exits[0].to;
      return out === 'village' ? 'village' : MAP_TRACK[out] === 'town' ? 'town' : 'outpost';
    }
    return 'route';
  };
  CC.battleTrack = function (opts) {
    if (opts.music) return opts.music;
    return { guide: 'guide', rival: 'rival', boss: 'boss', trainer: 'trainer' }[opts.vs] || (opts.boss ? 'boss' : opts.trainer ? 'trainer' : 'wild');
  };

  // ---------- the tracks ----------
  CC.TRACKS = {
    title: {
      bpm: 100, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
      lead: 'E5:4 G5:4 C6:6 B5:2 | A5:4 G5:4 D5:8 | C5:4 E5:4 A5:6 G5:2 | F5:4 E5:4 C5:8 | E5:4 G5:4 C6:4 D6:4 | E6:6 D6:2 B5:8 | C6:4 A5:4 F5:4 A5:4 | G5:12 -:4',
      bass: 'R:2 R:2 5:2 R:2 8:2 R:2 5:2 R:2', arp: '1 3 5 8', drums: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2', echo: true,
    },
    village: {
      bpm: 92, chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'],
      lead: 'A5:4 C6:2 A5:2 G5:4 F5:4 | E5:4 G5:4 C5:8 | D5:4 F5:2 A5:2 G5:4 F5:4 | D5:12 -:4 | A5:4 C6:4 F6:4 E6:2 D6:2 | C6:4 G5:4 E5:8 | D6:4 C6:2 Bb5:2 A5:4 G5:4 | E5:8 G5:8',
      bass: 'R:4 5:4 8:4 5:4', arp: '1:2 5:2 3:2 5:2', drums: 'k:4 h:4 s:4 h:4', voices: { lead: { vol: 0.1 } },
    },
    outpost: {
      bpm: 84, chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'],
      lead: 'G5:4 E5:4 C5:4 E5:4 | A5:6 G5:2 E5:8 | F5:4 A5:4 C6:4 A5:4 | G5:12 -:4 | E6:4 D6:2 C6:2 G5:8 | A5:4 C6:4 E6:8 | D6:4 C6:2 A5:2 F5:4 A5:4 | G5:8 B5:8',
      bass: 'R:4 5:4 R:4 5:4', arp: '1:2 3:2 5:2 3:2', drums: 'h:4 h:4 h:4 h:4', voices: { lead: { wave: 'triangle', vol: 0.16 } },
    },
    route: {
      bpm: 128, chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D'],
      lead: 'B4:2 D5:2 G5:4 F#5:2 G5:2 A5:4 | F#5:4 D5:4 A4:8 | G5:2 F#5:2 E5:4 B4:4 E5:4 | G5:6 E5:2 C5:8 | B5:4 A5:2 G5:2 D6:8 | C6:2 B5:2 A5:4 F#5:8 | E5:2 G5:2 C6:4 B5:2 A5:2 G5:4 | A5:12 -:4',
      bass: 'R:2 R:2 R:2 R:2 5:2 5:2 8:2 5:2', arp: '1 5 8 5', drums: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2',
    },
    cave: {
      bpm: 84, chords: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'C', 'Bb', 'A'], echo: true,
      lead: 'D5:6 F5:2 A5:8 | Bb5:4 A5:4 F5:8 | G5:6 Bb5:2 D6:4 C6:4 | C#6:12 -:4 | A5:6 F5:2 D5:8 | E5:4 G5:4 C6:8 | D6:4 C6:4 Bb5:4 G5:4 | A5:8 E5:8',
      bass: 'R:8 5:8', arp: '1:2 5:2 8:2 5:2', drums: 'k:8 -:4 h:4', voices: { arp: { vol: 0.03 } },
    },
    snow: {
      bpm: 96, chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'],
      lead: 'E6:2 C6:2 A5:4 B5:2 C6:2 E6:4 | F6:4 E6:2 C6:2 A5:8 | G5:2 C6:2 E6:4 D6:2 C6:2 G5:4 | B5:8 D6:8 | C6:4 B5:2 A5:2 E5:8 | F5:2 A5:2 C6:4 A5:4 F5:4 | G5:4 B5:4 D6:4 G6:4 | G#5:8 B5:8',
      bass: 'R:4 -:4 5:4 -:4', arp: '8 5 3 5', arpOct: 5, drums: 'h:4 h:4 h:4 h:2 h:2', voices: { lead: { wave: 'pulse12', vol: 0.11 }, arp: { vol: 0.03 } },
    },
    swamp: {
      bpm: 76, chords: ['Em', 'Em', 'C', 'B', 'Em', 'G', 'Am', 'B'],
      lead: 'E5:3 G5:1 B5:4 A5:2 G5:2 E5:4 | D5:4 E5:12 | G5:4 E5:4 C5:4 E5:4 | D#5:8 F#5:8 | B5:4 A5:2 G5:2 F#5:4 E5:4 | D5:4 G5:4 B5:8 | C6:4 B5:2 A5:2 E5:8 | F#5:8 D#5:8',
      bass: 'R:3 R:1 -:4 5:3 5:1 -:4', drums: 'k:4 -:2 h:2 s:4 -:2 h:2', voices: { lead: { vol: 0.1 } },
    },
    ruins: {
      bpm: 88, chords: ['Bm', 'G', 'Em', 'F#', 'Bm', 'G', 'A', 'F#'], echo: true,
      lead: 'F#5:4 B5:4 A5:2 G5:2 F#5:4 | G5:4 D5:4 B4:8 | E5:4 G5:4 B5:2 A#5:2 B5:4 | C#6:8 A#5:8 | D6:4 C#6:2 B5:2 F#5:8 | G5:2 A5:2 B5:4 D6:8 | E6:4 D6:2 C#6:2 A5:8 | A#5:8 F#5:8',
      bass: 'R:4 R:4 5:4 8:4', arp: '1 3 5 3', drums: 'k:4 h:2 h:2 -:4 h:4', voices: { arp: { vol: 0.03 } },
    },
    spire: {
      bpm: 70, chords: ['E', 'C#m', 'A', 'B', 'E', 'G#m', 'A', 'B'], echo: true,
      lead: 'B5:4 G#5:4 E6:8 | E6:4 D#6:2 C#6:2 G#5:8 | A5:4 C#6:4 E6:4 F#6:4 | D#6:8 B5:8 | G#6:6 F#6:2 E6:8 | D#6:4 B5:4 G#5:8 | C#6:4 E6:4 A6:4 G#6:2 F#6:2 | F#6:8 D#6:8',
      bass: 'R:8 5:8', arp: '1 5 8 5', drums: 'h:8 h:8', voices: { lead: { wave: 'triangle', vol: 0.17 } },
    },
    // the expansion's places
    town: { // Copperbell: a busy hill town with bells in it
      bpm: 112, chords: ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb', 'F'],
      lead: 'D5:4 F5:4 Bb5:6 A5:2 | C6:4 A5:4 F5:8 | G5:4 Bb5:4 D6:6 C6:2 | Bb5:4 G5:4 Eb5:8 | F5:2 G5:2 Bb5:4 D6:4 F6:4 | Eb6:4 C6:4 A5:8 | G5:4 Bb5:2 C6:2 Eb6:4 D6:4 | C6:12 -:4',
      bass: 'R:4 5:4 R:4 5:4', arp: '1:2 3:2 5:2 8:2', drums: 'k:4 h:2 h:2 s:4 h:4', voices: { arp: { wave: 'triangle', vol: 0.05 } },
    },
    seaside: { // Driftwood Cove and Lantern Isle
      bpm: 104, chords: ['C', 'Am', 'Dm', 'G', 'C', 'Em', 'F', 'G'], echo: true,
      lead: 'E5:6 G5:2 C6:8 | A5:4 C6:4 E6:8 | F6:4 E6:2 D6:2 A5:8 | B5:12 -:4 | C6:4 E6:4 G6:6 F6:2 | E6:4 B5:4 G5:8 | A5:2 C6:2 F6:4 E6:4 D6:4 | D6:8 G5:8',
      bass: 'R:4 -:2 5:2 R:4 8:4', arp: '1 5 8 5', drums: 'k:4 h:4 s:4 h:2 h:2',
    },
    temple: { // the Dawn Temple: warm and old
      bpm: 90, chords: ['Em', 'F', 'Em', 'D', 'Em', 'F', 'G', 'F'], echo: true,
      lead: 'E5:4 F5:4 B5:8 | A5:2 G5:2 F5:4 E5:8 | G5:4 A5:4 B5:4 C6:4 | D6:12 -:4 | E6:4 F6:2 E6:2 B5:8 | C6:4 B5:2 A5:2 F5:8 | G5:4 B5:4 D6:4 C6:4 | B5:8 F5:8',
      bass: 'R:4 R:4 5:4 R:4', arp: '1 3 5 3', drums: 'k:4 -:4 k:2 k:2 s:4', voices: { arp: { vol: 0.03 } },
    },
    hollow: { // the Hollow Deep: sad and quiet, not scary
      bpm: 64, chords: ['Am', 'Em', 'F', 'C', 'Dm', 'Am', 'E', 'E'], echo: true,
      lead: 'E5:8 C5:4 A4:4 | B4:8 G4:8 | A4:4 C5:4 F5:8 | E5:12 -:4 | F5:4 E5:4 D5:8 | C5:4 B4:4 A4:8 | G#4:4 B4:4 E5:8 | -:16',
      bass: 'R:16', arp: '1:4 5:4 8:4 5:4', drums: 'h:8 h:8', voices: { lead: { wave: 'triangle', vol: 0.16 }, arp: { vol: 0.03 } },
    },
    lullaby: { // calming Gloaming: a soft lullaby instead of battle music
      bpm: 72, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C'], echo: true,
      lead: 'C6:4 A5:4 F5:8 | D6:4 C6:4 A5:8 | Bb5:4 D6:4 F6:6 E6:2 | E6:8 C6:8 | A5:4 C6:4 F6:8 | E6:4 C6:4 A5:8 | G5:4 Bb5:4 D6:4 C6:4 | C6:16',
      bass: 'R:8 5:8', arp: '1:2 3:2 5:2 8:2', drums: 'h:8 h:8', voices: { lead: { wave: 'triangle', vol: 0.17 }, arp: { wave: 'pulse12', vol: 0.03 } },
    },
    wild: {
      bpm: 150, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'G', 'E'],
      lead: 'A5:2 A5:2 C6:2 A5:2 E6:4 D6:2 C6:2 | C6:2 A5:2 F5:4 A5:4 C6:4 | B5:2 B5:2 D6:2 B5:2 G6:4 F6:2 D6:2 | E6:4 D6:2 B5:2 G#5:8 | A5:2 C6:2 E6:2 A6:2 G6:4 E6:4 | F6:4 E6:2 C6:2 A5:8 | B5:2 D6:2 G6:2 F6:2 D6:4 B5:4 | E6:4 G#6:4 B6:8',
      bass: 'R:2 R:2 8:2 R:2 R:2 R:2 8:2 R:2', arp: '1 3 5 3', drums: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2',
    },
    trainer: {
      bpm: 140, chords: ['Dm', 'C', 'Bb', 'A', 'Gm', 'A', 'Dm', 'A'],
      lead: 'D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 | G5:2 E5:2 C5:4 E5:2 G5:2 C6:4 | D6:4 C6:2 Bb5:2 F5:4 D5:4 | E5:2 A5:2 C#6:4 E6:8 | D6:4 Bb5:4 G5:4 Bb5:4 | C#6:4 A5:4 E5:4 C#6:4 | F6:4 E6:2 D6:2 A5:8 | E6:6 C#6:2 A5:8',
      bass: 'R:2 8:2 R:2 8:2 5:2 8:2 R:2 5:2', arp: '1 5 8 5', drums: 'k:2 h:2 s:2 k:2 k:2 h:2 s:2 h:2',
    },
    guide: {
      bpm: 132, chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'B'],
      lead: 'E5:4 G5:2 B5:2 E6:8 | D6:2 C6:2 B5:4 G5:8 | B5:2 D6:2 G6:4 F#6:2 E6:2 D6:4 | A5:12 -:4 | G6:4 F#6:2 E6:2 B5:8 | C6:2 E6:2 G6:4 E6:8 | F#6:4 E6:2 D6:2 A5:8 | D#6:4 F#6:4 B6:8',
      bass: 'R:2 R:2 5:2 R:2 8:2 R:2 5:2 5:2', arp: '1 3 5 8', drums: 'k:2 h:2 s:2 h:2 k:2 s:1 s:1 s:2 o:2',
    },
    rival: {
      bpm: 160, chords: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G'],
      lead: 'C5:2 Eb5:2 G5:2 C6:2 Bb5:2 G5:2 C6:4 | Eb6:4 C6:4 Ab5:8 | D6:2 Bb5:2 F5:2 Bb5:2 D6:4 F6:4 | G6:6 F6:2 D6:8 | Eb6:2 D6:2 C6:2 G5:2 C6:2 D6:2 Eb6:4 | C6:4 Ab5:4 Eb5:8 | F5:2 Ab5:2 C6:2 F6:2 Eb6:4 D6:4 | B5:4 D6:4 G6:8',
      bass: 'R:2 R:2 8:2 R:2 5:2 R:2 8:2 5:2', arp: '1 3 5 3', drums: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 o:2',
    },
    boss: {
      bpm: 120, chords: ['F#m', 'D', 'E', 'C#', 'F#m', 'D', 'Bm', 'C#'],
      lead: 'F#5:8 C#6:4 A5:4 | D6:6 C#6:2 A5:8 | B5:4 G#5:4 E5:4 B5:4 | C#6:4 F5:4 G#5:8 | A5:2 C#6:2 F#6:4 E6:2 D6:2 C#6:4 | D6:4 F#6:4 A6:8 | B5:4 D6:4 F#6:2 E6:2 D6:4 | C#6:8 G#5:8',
      bass: 'R:2 R:2 R:2 8:2 R:2 R:2 5:2 R:2', bassOct: 1, arp: '1 5 8 5', drums: 'k:2 k:2 s:2 h:2 k:2 h:2 s:2 s:2', echo: true,
      voices: { bass: { wave: 'square', vol: 0.07 } },
    },
    victory: {
      bpm: 132, chords: ['C', 'F', 'G', 'C'],
      lead: 'G5:2 G5:2 G5:2 C6:10 | A5:4 C6:4 F6:8 | D6:2 E6:2 F6:2 G6:2 B5:4 D6:4 | C6:12 -:4',
      bass: 'R:2 5:2 8:2 5:2', arp: '1 3 5 8', drums: 'k:4 s:4 k:4 s:4',
    },
    credits: {
      bpm: 96, chords: ['D', 'A', 'Bm', 'G', 'G', 'A', 'D', 'A'], echo: true,
      lead: 'F#5:4 A5:4 D6:6 C#6:2 | E6:4 C#6:4 A5:8 | B5:4 D6:4 F#6:6 E6:2 | D6:4 B5:4 G5:8 | G5:4 B5:4 D6:4 G6:4 | F#6:4 E6:4 C#6:8 | D6:4 F#6:4 A6:6 G6:2 | F#6:8 E6:8',
      bass: 'R:4 5:4 8:4 5:4', arp: '1:2 5:2 8:2 5:2', drums: 'k:4 h:4 s:4 h:4',
    },
  };
})();
