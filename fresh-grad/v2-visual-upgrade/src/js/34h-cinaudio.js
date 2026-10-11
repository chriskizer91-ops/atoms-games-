/* ============================ cutscene sound ============================
   Built on SFX.ctx with our own helpers (SFX is read-only for this pass). Everything is quiet and respects G.sound.
   Discrete cues are fired from cinAudioTick(prev, ct) so they stay in step with CUT.t; the existing SFX.applause calls stay in the controller.
   Score: a soft crowd murmur and birds, footsteps, a string-like swell on the walk that resolves into a warm chord on the handshake,
   paper foley, camera shutters, a whoosh for the toss and a big resonant chord under the white flash. */
const CIN_A = { out: null, noise: null, live: [], steps: null, on: false, rev: null };

function cinAOk() { return !!(SFX.ctx && G.sound && CIN_A.on); }
function cinNoiseBuf() {
  const c = SFX.ctx;
  if (CIN_A.noise && CIN_A.noise.sampleRate === c.sampleRate) return CIN_A.noise;
  const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  const rnd = mulberry32(5);
  for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
  return (CIN_A.noise = b);
}
function cinAStart() { /* kept for symmetry */ }
function cinAudioStart() {
  CIN_A.on = false; CIN_A.live = [];
  const c = SFX.ctx;
  if (!c || !G.sound) return;
  try {
    CIN_A.on = true;
    const out = c.createGain(); out.gain.value = 0.0001; out.gain.setTargetAtTime(0.9, c.currentTime, 0.5); out.connect(c.destination);
    // a short feedback delay as a cheap hall for the chords
    const rev = c.createGain(), dl = c.createDelay(0.6), fb = c.createGain(), lp = c.createBiquadFilter();
    dl.delayTime.value = 0.27; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 1800;
    rev.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(out);
    CIN_A.out = out; CIN_A.rev = rev;
    // crowd murmur: band-passed noise with a slow swell
    const src = c.createBufferSource(); src.buffer = cinNoiseBuf(); src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.5;
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.03, c.currentTime + 0.3, 0.8);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.23; lg.gain.value = 0.008; lfo.connect(lg); lg.connect(g.gain);
    src.connect(bp); bp.connect(g); g.connect(out); src.start(); lfo.start();
    CIN_A.live.push({ stop() { try { src.stop(); lfo.stop(); } catch (e) { /* done */ } }, g });
    CIN_A.murmur = g;
    // footstep times: one per half stride of the walk, sampled from the same function the picture uses
    CIN_A.steps = [];
    let last = 0;
    for (let t = 2.6; t < 6.4; t += 0.01) { const n = Math.floor((cinGradX(t) - 214) / 36); if (n > last) { CIN_A.steps.push(t); last = n; } }
  } catch (e) { CIN_A.on = false; }
}
function cinAudioStop() {
  const c = SFX.ctx;
  if (!c || !CIN_A.on) { CIN_A.on = false; return; }
  CIN_A.on = false;
  try {
    CIN_A.out.gain.cancelScheduledValues(c.currentTime); CIN_A.out.gain.setTargetAtTime(0.0001, c.currentTime, 0.25);
    const live = CIN_A.live; CIN_A.live = [];
    setTimeout(() => { live.forEach(n => n.stop && n.stop()); try { CIN_A.out.disconnect(); } catch (e) { /* done */ } }, 1500);
  } catch (e) { /* audio is optional */ }
}

/* ---------- voices ---------- */
function cinTone(f, t0, dur, type, vol, atk, detune, dest) {
  const c = SFX.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + atk); g.gain.setTargetAtTime(0.0001, t0 + atk + dur * 0.35, dur * 0.28);
  o.connect(g); g.connect(dest || CIN_A.out); o.start(t0); o.stop(t0 + atk + dur + 0.6);
  return g;
}
function cinNoiseHit(t0, dur, f0, f1, vol, type, q) {
  const c = SFX.ctx, s = c.createBufferSource(); s.buffer = cinNoiseBuf();
  const bp = c.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || 0.8; bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(bp); bp.connect(g); g.connect(CIN_A.out); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
}
/* a string-ish pad: detuned saws through a low-pass that opens as it swells, with vibrato */
function cinPad(notes, t0, rise, hold, fall, vol, open) {
  const c = SFX.ctx, g = c.createGain(), lp = c.createBiquadFilter(), v = c.createOscillator(), vg = c.createGain();
  lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(380, t0); lp.frequency.exponentialRampToValueAtTime(open || 2200, t0 + rise);
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + rise); g.gain.setValueAtTime(vol, t0 + rise + hold); g.gain.setTargetAtTime(0.0001, t0 + rise + hold, fall / 3);
  v.frequency.value = 5.2; vg.gain.value = 7; v.connect(vg);
  const oscs = [];
  notes.forEach((f, i) => [-7, 6].forEach(dt => { const o = c.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; o.detune.value = dt; vg.connect(o.detune); o.connect(lp); o.start(t0); o.stop(t0 + rise + hold + fall + 0.5); oscs.push(o); }));
  lp.connect(g); g.connect(CIN_A.out); g.connect(CIN_A.rev);
  v.start(t0); v.stop(t0 + rise + hold + fall + 0.5);
}
function cinBell(f, t0, vol, dur) {
  const c = SFX.ctx;
  [1, 2.01, 3.02].forEach((m, i) => cinTone(f * m, t0, dur / (i + 1), 'sine', vol / (1 + i * 1.6), 0.01, 0, CIN_A.rev));
}
function cinChirp(t0, f, vol) {
  const c = SFX.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.5, t0 + 0.07); o.frequency.exponentialRampToValueAtTime(f * 1.15, t0 + 0.13);
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
  o.connect(g); g.connect(CIN_A.out); o.start(t0); o.stop(t0 + 0.2);
}

/* ---------- the cue sheet, fired in time order from the main loop ---------- */
const CIN_CUES = [
  [0.9, () => cinChirp(SFX.ctx.currentTime, 3100, 0.012)], [1.45, () => { const t = SFX.ctx.currentTime; cinChirp(t, 3700, 0.01); cinChirp(t + 0.18, 3400, 0.008); }],
  [2.2, () => cinChirp(SFX.ctx.currentTime, 2900, 0.01)], [3.3, () => { const t = SFX.ctx.currentTime; cinChirp(t, 3500, 0.01); cinChirp(t + 0.16, 3900, 0.009); }],
  [4.6, () => cinChirp(SFX.ctx.currentTime, 3300, 0.008)], [5.5, () => cinChirp(SFX.ctx.currentTime, 3000, 0.008)],
  // the walk: a rising string swell (A minor add 9) that opens up as the Graduate nears the podium
  [2.5, () => { const t = SFX.ctx.currentTime; cinPad([110, 164.81, 220, 261.63, 329.63], t, 3.6, 0.5, 1.1, 0.034, 2600); cinTone(82.41, t, 4.6, 'sine', 0.05, 1.8); }],
  // the handshake: it resolves into a warm major chord
  [6.75, () => { const t = SFX.ctx.currentTime; cinPad([130.81, 196, 261.63, 329.63, 523.25], t, 0.5, 1.2, 2.4, 0.04, 3200); cinBell(523.25, t + 0.05, 0.05, 2.2); cinBell(783.99, t + 0.35, 0.028, 2.0); }],
  [7.02, () => cinNoiseHit(SFX.ctx.currentTime, 0.22, 3200, 7200, 0.05, 'highpass', 0.5)],
  [7.45, () => cinNoiseHit(SFX.ctx.currentTime, 0.14, 2200, 4800, 0.03, 'highpass', 0.5)],
  // the diploma goes up, the crowd erupts
  [9.65, () => { const t = SFX.ctx.currentTime; cinTone(392, t, 0.9, 'triangle', 0.03, 0.12); cinTone(523.25, t + 0.06, 0.9, 'triangle', 0.03, 0.12); cinTone(659.25, t + 0.12, 1.0, 'triangle', 0.03, 0.12); }],
  // the toss
  [11.55, () => { const t = SFX.ctx.currentTime; cinNoiseHit(t, 0.7, 260, 3400, 0.11, 'bandpass', 0.7); cinNoiseHit(t + 0.1, 0.9, 500, 5200, 0.05, 'bandpass', 1.2); cinTone(220, t, 0.5, 'sine', 0.03, 0.02); cinBell(1046.5, t + 0.2, 0.03, 1.4); }],
  // the white flash: a big resonant chord
  [14.3, () => { const t = SFX.ctx.currentTime; cinPad([65.41, 130.81, 196, 261.63, 329.63, 392, 493.88], t, 1.0, 0.9, 3.2, 0.06, 4200); cinBell(523.25, t + 0.9, 0.06, 3.5); cinBell(1046.5, t + 1.0, 0.035, 3.5); cinBell(1567.98, t + 1.1, 0.02, 3.0); }]
];
// camera shutters once the crowd is up
const CIN_CLICKS = [10.0, 10.22, 10.55, 10.9, 11.15, 11.3, 12.05, 12.4, 12.75, 13.15, 13.4, 13.85, 14.1];
function cinAudioTick(prev, ct) {
  if (!cinAOk() || ct - prev > 0.3 || ct < prev) return;
  try {
    const c = SFX.ctx;
    for (let i = 0; i < CIN_CUES.length; i++) { const q = CIN_CUES[i]; if (q[0] > prev && q[0] <= ct) q[1](); }
    for (let i = 0; i < CIN_CLICKS.length; i++) if (CIN_CLICKS[i] > prev && CIN_CLICKS[i] <= ct) { const t = c.currentTime; cinNoiseHit(t, 0.012, 4200, 3000, 0.07, 'bandpass', 1.5); cinNoiseHit(t + 0.035, 0.02, 2600, 1800, 0.05, 'bandpass', 1.2); }
    const st = CIN_A.steps || [];
    for (let i = 0; i < st.length; i++) if (st[i] > prev && st[i] <= ct) { const t = c.currentTime; cinNoiseHit(t, 0.07, 700, 220, 0.05, 'lowpass', 0.7); cinTone(95, t, 0.1, 'sine', 0.03, 0.005); }
    // the murmur gives way to the applause that SFX.applause() starts at 10.2
    if (prev < 9.6 && ct >= 9.6 && CIN_A.murmur) CIN_A.murmur.gain.setTargetAtTime(0.012, c.currentTime, 0.4);
    if (prev < 15.0 && ct >= 15.0 && CIN_A.murmur) CIN_A.murmur.gain.setTargetAtTime(0.0001, c.currentTime, 0.3);
  } catch (e) { /* audio is optional */ }
}
