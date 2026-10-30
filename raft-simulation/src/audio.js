// Every sound is synthesised on the fly; there are no audio files.

let ctx = null;
let master = null;
let noiseBuf = null;
let ambience = null;

function noiseBuffer() {
  if (noiseBuf) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function out(pan = 0, gain = 1) {
  const g = ctx.createGain();
  g.gain.value = gain;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p).connect(master);
  } else {
    g.connect(master);
  }
  return g;
}

function noiseHit({ type = 'bandpass', freq = 800, q = 1, dur = 0.3, gain = 0.5, pan = 0, sweepTo = null, attack = 0.005 }) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out(pan));
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

function tone({ type = 'sine', freq = 200, to = null, dur = 0.15, gain = 0.4, pan = 0, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out(pan));
  o.start(t);
  o.stop(t + dur + 0.05);
}

let rainGain = null;
function startRain() {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 1800;
  rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  src.connect(f).connect(rainGain).connect(master);
  src.start();
}

function startAmbience() {
  // Two layers of filtered noise with slow swells: open-ocean wash and close lapping.
  const layers = [
    { freq: 420, q: 0.4, gain: 0.16, rate: 0.11 },
    { freq: 1300, q: 0.7, gain: 0.05, rate: 0.23 },
  ];
  ambience = layers.map((l) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = l.freq;
    f.Q.value = l.q;
    const g = ctx.createGain();
    g.gain.value = l.gain;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = l.rate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = l.gain * 0.6;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(f).connect(g).connect(master);
    src.start();
    lfo.start();
    return { src, lfo };
  });
}

export const audio = {
  unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    startAmbience();
    startRain();
  },

  setMuted(m) {
    if (master) master.gain.value = m ? 0 : 0.8;
  },

  get ready() {
    return !!ctx && ctx.state === 'running';
  },

  splash(pan = 0, big = false) {
    if (!ctx) return;
    noiseHit({ freq: big ? 700 : 1100, q: 0.8, dur: big ? 0.7 : 0.35, gain: big ? 0.6 : 0.35, pan, sweepTo: 300 });
  },
  whoosh(pan = 0) {
    if (!ctx) return;
    noiseHit({ freq: 600, q: 2, dur: 0.25, gain: 0.25, pan, sweepTo: 2400, attack: 0.05 });
  },
  reel() {
    if (!ctx) return;
    tone({ type: 'square', freq: 1800 + Math.random() * 300, dur: 0.02, gain: 0.03 });
  },
  pickup() {
    if (!ctx) return;
    tone({ type: 'triangle', freq: 520, dur: 0.09, gain: 0.25 });
    tone({ type: 'triangle', freq: 780, dur: 0.12, gain: 0.22, delay: 0.07 });
  },
  hammer(pan = 0) {
    if (!ctx) return;
    tone({ type: 'triangle', freq: 310, to: 180, dur: 0.12, gain: 0.5, pan });
    noiseHit({ type: 'highpass', freq: 2500, dur: 0.05, gain: 0.25, pan });
  },
  build() {
    if (!ctx) return;
    [0, 0.12, 0.24].forEach((d, i) => tone({ type: 'triangle', freq: 260 + i * 40, to: 160, dur: 0.1, gain: 0.45, delay: d }));
  },
  swing() {
    if (!ctx) return;
    noiseHit({ freq: 900, q: 1.5, dur: 0.18, gain: 0.15, sweepTo: 2000, attack: 0.03 });
  },
  spearHit(pan = 0) {
    if (!ctx) return;
    tone({ type: 'sine', freq: 140, to: 60, dur: 0.22, gain: 0.7, pan });
    noiseHit({ type: 'lowpass', freq: 900, dur: 0.25, gain: 0.4, pan });
  },
  bite(pan = 0, near = 1) {
    if (!ctx) return;
    const g = 0.25 + 0.45 * near;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => noiseHit({ type: 'bandpass', freq: 1400 + Math.random() * 800, q: 3, dur: 0.06, gain: g, pan }), i * 55);
    }
    tone({ type: 'sine', freq: 90, to: 50, dur: 0.25, gain: g * 0.8, pan });
  },
  crack(pan = 0) {
    if (!ctx) return;
    noiseHit({ type: 'bandpass', freq: 600, q: 1.2, dur: 0.5, gain: 0.7, pan, sweepTo: 200 });
    tone({ type: 'sawtooth', freq: 120, to: 40, dur: 0.4, gain: 0.2, pan });
  },
  hurt() {
    if (!ctx) return;
    tone({ type: 'sine', freq: 110, to: 45, dur: 0.35, gain: 0.8 });
    noiseHit({ type: 'lowpass', freq: 500, dur: 0.3, gain: 0.5 });
  },
  eat() {
    if (!ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => noiseHit({ type: 'bandpass', freq: 500 + Math.random() * 300, q: 2, dur: 0.08, gain: 0.25 }), i * 140);
    }
  },
  warn() {
    if (!ctx) return;
    tone({ type: 'sine', freq: 196, dur: 0.5, gain: 0.25 });
    tone({ type: 'sine', freq: 185, dur: 0.6, gain: 0.25, delay: 0.25 });
  },
  creak(pan = 0) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const base = 70 + Math.random() * 40;
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.4, t + 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f).connect(g).connect(out(pan));
    o.start(t);
    o.stop(t + 0.7);
  },
  setRain(level) {
    if (!rainGain) return;
    rainGain.gain.setTargetAtTime(level * 0.22, ctx.currentTime, 0.5);
  },
  thunder() {
    if (!ctx) return;
    noiseHit({ type: 'lowpass', freq: 220, q: 0.7, dur: 2.6, gain: 0.9, attack: 0.08, sweepTo: 60 });
    setTimeout(() => noiseHit({ type: 'lowpass', freq: 160, q: 0.5, dur: 1.8, gain: 0.6, attack: 0.2, sweepTo: 50 }), 350);
  },
  sizzle() {
    if (!ctx) return;
    noiseHit({ type: 'highpass', freq: 3000, dur: 0.35, gain: 0.06, attack: 0.05 });
  },
  drink() {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) setTimeout(() => tone({ type: 'sine', freq: 300 + Math.random() * 80, to: 180, dur: 0.12, gain: 0.18 }), i * 180);
  },
  error() {
    if (!ctx) return;
    tone({ type: 'square', freq: 160, dur: 0.12, gain: 0.08 });
  },
};
