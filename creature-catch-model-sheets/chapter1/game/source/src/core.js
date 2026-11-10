// core.js: the clock, input (keys and the touch pad), the screen stack, timed moments, and the frame (the 3D canvas with
// the 240 x 160 pixel UI canvas laid over it). Creature Catch's own sound effects and music are ported as they are (cc-sfx.js,
// cc-music.js) onto a small CC object.
var CC = window.CC = { opts: { music: 6, sfx: 8, text: 1 } };
const G = window.G = {
  W: 240, H: 160, t: 0, dt: 0, screens: [], jobs: [], flags: {}, fadeA: 0, fadeCol: '#000000',
};
G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
G.lerp = (a, b, k) => a + (b - a) * k;
G.ease = (k) => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
G.easeOut = (k) => 1 - (1 - k) * (1 - k);
G.rand = (a, b) => a + Math.random() * (b - a);
G.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
G.pick = (a) => a[Math.floor(Math.random() * a.length)];
G.wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---------- timed moments on the game's clock ----------
G.tween = (sec, fn) => new Promise((ok) => G.jobs.push({ d: Math.max(1e-3, sec), e: 0, fn, ok }));
G.sleep = (sec) => G.tween(sec, null);
function runJobs(dt) {
  for (const j of G.jobs.slice()) { j.e = Math.min(j.d, j.e + dt); if (j.fn) j.fn(j.e / j.d); if (j.e >= j.d) { G.jobs.splice(G.jobs.indexOf(j), 1); j.ok(); } }
}
G.fade = (sec, to) => { const from = G.fadeA; return G.tween(sec, (k) => { G.fadeA = G.lerp(from, to, k); }); };

// ---------- screens: the top one gets input; all of them draw, bottom first ----------
G.push = (s) => { G.screens.push(s); return s; };
G.pop = (s) => { const i = G.screens.indexOf(s); if (i >= 0) G.screens.splice(i, 1); };
G.top = () => G.screens[G.screens.length - 1];

// ---------- input ----------
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Escape: 'b', KeyK: 'b', Backspace: 'b', Enter: 'start', KeyM: 'start', KeyQ: 'l', KeyE: 'r' };
G.input = { held: {}, pressed: {}, rep: {} };
const downNow = {};
window.addEventListener('keydown', (e) => { const k = KEYS[e.code]; if (!k) return; e.preventDefault(); if (!downNow[k]) { downNow[k] = true; G.input.pressed[k] = true; } CC.audioUnlock(); });
window.addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (!k) return; downNow[k] = false; });
window.addEventListener('blur', () => { for (const k in downNow) downNow[k] = false; });
// a held key repeats (menus): first after .32 s, then every .09 s
G.repeat = (k) => {
  if (G.input.pressed[k]) { G.input.rep[k] = .32; return true; }
  if (!G.input.held[k]) return false;
  G.input.rep[k] = (G.input.rep[k] || 0) - G.dt;
  if (G.input.rep[k] <= 0) { G.input.rep[k] = .09; return true; }
  return false;
};
function bindPad() {
  const map = { bUp: 'up', bDown: 'down', bLeft: 'left', bRight: 'right', bA: 'a', bB: 'b', bStart: 'start', bL: 'l', bR: 'r' };
  for (const id in map) {
    const el = document.getElementById(id); if (!el) continue; const k = map[id];
    const on = (e) => { e.preventDefault(); CC.audioUnlock(); if (!downNow[k]) G.input.pressed[k] = true; downNow[k] = true; el.classList.add('on'); };
    const off = (e) => { e.preventDefault(); downNow[k] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  }
  // sliding a thumb across the d-pad moves between directions
  const dp = document.getElementById('padL');
  if (dp) dp.addEventListener('pointermove', (e) => {
    if (!e.pressure && e.pointerType !== 'touch') return;
    const el = document.elementFromPoint(e.clientX, e.clientY); if (!el || !el.classList.contains('dir')) return;
    for (const d of ['bUp', 'bDown', 'bLeft', 'bRight']) { const b = document.getElementById(d), k = map[d]; if (b === el) { if (!downNow[k]) G.input.pressed[k] = true; downNow[k] = true; b.classList.add('on'); } else if (downNow[k]) { downNow[k] = false; b.classList.remove('on'); } }
  });
  document.body.addEventListener('pointerdown', () => CC.audioUnlock(), { passive: true });
}

// ---------- the frame: fit a 3:2 screen to the window, with the pad below it (upright) or either side (sideways) ----------
G.frame = { w: 720, h: 480, pr: 1 };
function resize() {
  const touch = document.body.classList.contains('touch'), vw = window.innerWidth, vh = window.innerHeight;
  const side = touch && vw > vh;
  document.body.classList.toggle('side', side);
  let w, h;
  if (!touch) { w = Math.min(vw - 16, (vh - 16) * 1.5); }
  else if (side) { w = Math.min(vw - 2 * 170, vh * 1.5); }
  else { w = Math.min(vw, (vh - 230) * 1.5); }
  w = Math.max(240, Math.floor(w)); h = Math.floor(w / 1.5);
  const fr = document.getElementById('frame'); fr.style.width = w + 'px'; fr.style.height = h + 'px';
  const pr = /[?&]lowres/.test(location.search) ? .5 : Math.min(window.devicePixelRatio || 1, 2, 1700 / w);
  G.frame = { w, h, pr };
  if (G.R) { G.R.setPixelRatio(pr); G.R.setSize(w, h, false); }
  if (side) { // a pad half each side, scaled to fit the height
    const k = Math.min(1.25, vh / 230, (vw - w) / 2 / 185);
    for (const [id, x] of [['padL', 4], ['padR', vw - 180 * k - 4]]) { const el = document.getElementById(id); el.style.transform = 'scale(' + k + ')'; el.style.left = x + 'px'; el.style.right = 'auto'; el.style.top = (vh - 210 * k) / 2 + 'px'; }
  } else for (const id of ['padL', 'padR']) { const el = document.getElementById(id); el.style.transform = ''; el.style.left = ''; el.style.right = ''; el.style.top = ''; }
}

// ---------- the loop ----------
G.update = null; // the world or battle, set by main.js
G.render = null;
let last = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(G.maxDt || .05, Math.max(0, (now - last) / 1000)); last = now;
  if (G.stopAt != null) dt = Math.max(0, Math.min(dt, G.stopAt - G.t)); // for testing: hold the clock at a moment
  G.dt = dt; G.t += dt;
  for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'l', 'r']) G.input.held[k] = !!downNow[k];
  runJobs(dt);
  const top = G.top();
  if (top && top.update) top.update(dt);
  if (G.update) G.update(dt);
  G.input.pressed = {};
  const t0 = performance.now();
  if (G.render) G.render(dt);
  if (G.perf) { G.perf.n++; G.perf.ms += performance.now() - t0; if (G.perf.n >= 20) { console.log('[t] frame ms ' + (G.perf.ms / G.perf.n).toFixed(1)); G.perf.n = 0; G.perf.ms = 0; } }
  if (G.afterRender) G.afterRender(dt);
  UI.draw();
}
G.perf = /[?&]perf/.test(location.search) ? { n: 0, ms: 0 } : null;
G.maxDt = /[?&]fast/.test(location.search) ? .2 : .05;
// the looks you pick in the Looks menu, kept for next time: town '3d' | 'diorama', battles '3d' | 'painted'.
// Chapter 1 starts in the diorama town with the painted battles (a key of its own, so the earlier demo's saved choice doesn't carry over)
G.LOOK_KEY = 'cc3d-ch1-look';
G.look = (() => { try { const v = JSON.parse(localStorage.getItem(G.LOOK_KEY)); if (v && v.town && v.battle) return v; } catch (e) { /* none saved */ } return { town: 'diorama', battle: 'painted' }; })();
{ const m = location.search.match(/[?&]town=(\w+)/), n = location.search.match(/[?&]fights=(\w+)/); if (m) G.look.town = m[1]; if (n) G.look.battle = n[1]; }
G.saveLook = () => { try { localStorage.setItem(G.LOOK_KEY, JSON.stringify(G.look)); } catch (e) { /* storage off */ } };
G.start = () => {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  bindPad(); resize();
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 150));
  requestAnimationFrame((n) => { last = n; loop(n); });
};
