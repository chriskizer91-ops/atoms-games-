// A quiet score that plays itself. No recordings: a few soft tones made on
// the spot, picked from a scale that follows the hour and the weather.
//   day    bright five-note scale, short rising phrases, a warm held chord
//   dusk   the same notes a little lower and slower, longer echoes
//   night  a minor scale, sparse and low
//   storm  no tune at all: only a low held note under the wind
// Small flourishes mark the moments that matter (land, a catch, treasure).

const MOODS = {
  day: { root: 60, scale: [0, 2, 4, 7, 9], chords: [[0, 7, 16], [5, 12, 21], [-3, 4, 12], [7, 14, 23]], gap: [5, 11], step: 0.42, low: 0, high: 9, echo: 0.3 },
  dusk: { root: 58, scale: [0, 2, 4, 7, 9], chords: [[0, 7, 14], [5, 12, 19], [-2, 5, 14]], gap: [7, 13], step: 0.55, low: -2, high: 7, echo: 0.42 },
  night: { root: 57, scale: [0, 3, 5, 7, 10], chords: [[-12, 7, 15], [-7, 5, 12], [-14, 3, 10]], gap: [9, 18], step: 0.7, low: -4, high: 5, echo: 0.5 },
};
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export function createMusic() {
  let ctx = null, bus = null, wet = null, fb = null;
  let on = true, level = 0;
  const st = { mood: 'day', next: 4, chordIn: 2, chord: 0, at: 2, storm: 0, drone: null, droneGain: null };

  function setup(audioCtx, out) {
    ctx = audioCtx;
    bus = ctx.createGain();
    bus.gain.value = 0;
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.46;
    fb = ctx.createGain();
    fb.gain.value = 0.3;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1900;
    wet = ctx.createGain();
    wet.gain.value = 0.55;
    bus.connect(out);
    bus.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(wet);
    wet.connect(out);
  }

  // One plucked note: a soft sine with a little of its octave, dying away.
  function pluck(midi, when, vel = 1, dur = 2.4) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.11 * vel, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(bus);
    const a = ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = hz(midi);
    const b = ctx.createOscillator();
    b.type = 'triangle';
    b.frequency.value = hz(midi + 12);
    const bg = ctx.createGain();
    bg.gain.value = 0.16;
    a.connect(g);
    b.connect(bg).connect(g);
    a.start(when); b.start(when);
    a.stop(when + dur + 0.1); b.stop(when + dur + 0.1);
  }

  // A held chord: slow in, slow out.
  function pad(notes, when, dur, vel = 1) {
    for (const n of notes) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.028 * vel, when + dur * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, when + dur);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 700;
      f.connect(g).connect(bus);
      for (const det of [-5, 4]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = hz(n);
        o.detune.value = det;
        o.connect(f);
        o.start(when);
        o.stop(when + dur + 0.1);
      }
    }
  }

  // The scale's note at a step up or down from its root.
  function note(m, i) {
    const n = m.scale.length;
    const oct = Math.floor(i / n), k = ((i % n) + n) % n;
    return m.root + oct * 12 + m.scale[k];
  }

  function phrase(m) {
    // A short walk on the scale: mostly steps, now and then a leap, ending on a rest.
    const count = 3 + Math.floor(Math.random() * 4);
    let t = ctx.currentTime + 0.1;
    for (let k = 0; k < count; k++) {
      const leap = Math.random() < 0.25 ? (Math.random() < 0.5 ? -2 : 2) : (Math.random() < 0.55 ? 1 : -1);
      st.at = Math.max(m.low, Math.min(m.high, st.at + leap));
      pluck(note(m, st.at), t, 0.6 + Math.random() * 0.4, 2.2 + Math.random());
      t += m.step * (Math.random() < 0.3 ? 2 : 1);
    }
  }

  return {
    get on() { return on; },
    setOn(v) { on = !!v; },

    // A flourish: 'find' (land, a first catch), 'prize' (treasure, a rescue), 'dawn'.
    sting(kind = 'find') {
      if (!ctx || !on || st.storm > 0.6) return;
      const m = MOODS[st.mood];
      const t0 = ctx.currentTime + 0.05;
      const up = kind === 'prize' ? [0, 2, 4, 5, 7, 9] : kind === 'dawn' ? [0, 2, 4] : [0, 2, 4, 5];
      up.forEach((i, k) => pluck(note(m, i), t0 + k * 0.11, 0.95, 2.8));
      if (kind === 'prize') pad(m.chords[0].map((c) => m.root + c), t0, 5, 1.4);
      st.next = Math.max(st.next, 6);
    },

    // mood: { night 0..1, sunset 0..1, storm 0..1 }; live: playing (not paused, not on a menu screen).
    update(dt, audioCtx, out, mood, live) {
      if (!audioCtx) return;
      if (!ctx) setup(audioCtx, out);
      level += ((on && live ? 0.9 : 0) - level) * Math.min(1, dt * 0.8);
      bus.gain.value = level;
      wet.gain.value = 0.55 * level;
      if (!on || !live || ctx.state !== 'running') return;
      st.storm = mood.storm;
      const key = mood.night > 0.55 ? 'night' : mood.sunset > 0.35 ? 'dusk' : 'day';
      if (key !== st.mood) { st.mood = key; st.chordIn = Math.min(st.chordIn, 1.5); st.at = 1; }
      const m = MOODS[key];
      fb.gain.value = m.echo;

      st.chordIn -= dt;
      if (st.chordIn <= 0) {
        const dur = 13 + Math.random() * 6;
        st.chordIn = dur * 0.72;
        st.chord = (st.chord + 1 + Math.floor(Math.random() * 2)) % m.chords.length;
        // In a storm only the bottom of the chord sounds.
        const notes = m.chords[st.chord].map((c) => m.root - 12 + c);
        pad(mood.storm > 0.6 ? [notes[0] - 12] : notes, ctx.currentTime + 0.05, dur, mood.storm > 0.6 ? 1.6 : 1);
      }
      st.next -= dt;
      if (st.next <= 0) {
        st.next = m.gap[0] + Math.random() * (m.gap[1] - m.gap[0]);
        if (mood.storm < 0.6) phrase(m);
      }
    },
  };
}
