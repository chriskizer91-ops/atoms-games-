// The showcase app: boots the stage, builds the move buttons, runs the loop.
import { Stage } from './stage.js';
import { MOVES, MOVE_LIST } from './moves.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view'), stageBox = $('stage');
const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;

function glbBytes() {
  const el = $('glb');
  if (!el) return null;
  const b64 = el.textContent.trim();
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function boot() {
  const stage = new Stage(canvas, { grass: mobile ? 12000 : 22000, shadowSize: mobile ? 1024 : 2048 });
  let dpr = Math.min(devicePixelRatio || 1, mobile ? 1.75 : 2);
  const resize = () => { const r = stageBox.getBoundingClientRect(); if (r.width > 0 && r.height > 0) stage.setSize(Math.round(r.width), Math.round(r.height), dpr); };
  resize();
  new ResizeObserver(resize).observe(stageBox);
  await stage.load(glbBytes() || 'model/drizzlon.glb');
  window.stage = stage;

  // ---- buttons
  const KIND = { basic: 'basic', util: 'status', sig: 'signature', strong: 'strong', motion: 'gait' };
  const queue = [];
  const btns = {};
  const make = (m, host) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'move t-' + m.type.toLowerCase() + (m.kind === 'sig' ? ' sig' : ''); b.id = 'move-' + m.id;
    b.innerHTML = `<span class="mv-name">${m.name}</span><span class="mv-meta"><i></i>${m.type === 'Motion' ? 'gait' : m.type + ' · ' + KIND[m.kind]}</span>`;
    b.addEventListener('click', () => request(m.id));
    host.appendChild(b); btns[m.id] = b;
  };
  MOVE_LIST.filter((m) => m.kind !== 'motion').forEach((m) => make(m, $('moves')));
  MOVE_LIST.filter((m) => m.kind === 'motion').forEach((m) => make(m, $('gaits')));

  const cap = $('caption');
  let capTimer = 0;
  function showCaption(m) {
    $('cap-name').textContent = m.name; $('cap-blurb').textContent = m.blurb;
    $('cap-type').textContent = m.type === 'Motion' ? 'Gait' : m.type; cap.className = 'caption on t-' + m.type.toLowerCase();
    clearTimeout(capTimer);
  }
  function start(id) {
    if (!stage.play(id)) return false;
    for (const k in btns) btns[k].classList.toggle('playing', k === id);
    btns[id].classList.remove('queued');
    showCaption(MOVES[id]);
    return true;
  }
  function request(id) {
    if (stage.anim.busy) { if (!queue.includes(id) && queue.length < 12) { queue.push(id); btns[id].classList.add('queued'); } return; }
    start(id);
  }
  stage.onMoveEnd = () => {
    for (const k in btns) btns[k].classList.remove('playing');
    if (queue.length) { const next = queue.shift(); setTimeout(() => start(next), 350); } else capTimer = setTimeout(() => cap.classList.remove('on'), 1600);
  };
  $('play-all').addEventListener('click', () => { MOVE_LIST.filter((m) => m.kind !== 'motion').forEach((m) => request(m.id)); });

  // ---- toggles
  let slow = false;
  $('slow').addEventListener('click', (e) => { slow = !slow; e.currentTarget.setAttribute('aria-pressed', slow); });
  const camBtn = $('cam');
  const setCine = (on) => { stage.cinematic = on; if (!on) stage.shot.active = false; camBtn.setAttribute('aria-pressed', on); camBtn.querySelector('b').textContent = on ? 'Auto' : 'Free'; };
  camBtn.addEventListener('click', () => setCine(!stage.cinematic));

  // ---- orbit: drag to look around, pinch or wheel to zoom
  const pts = new Map(); let pinch = 0;
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  canvas.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p[0], dy = e.clientY - p[1]; p[0] = e.clientX; p[1] = e.clientY;
    const o = stage.orbit;
    if (pts.size === 1) {
      if (stage.cinematic && Math.abs(dx) + Math.abs(dy) > 2) setCine(false);
      o.yaw -= dx * 0.0065; o.pitch = Math.min(1.25, Math.max(0.02, o.pitch + dy * 0.005));
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch > 0) o.dist = Math.min(7, Math.max(1.3, o.dist * pinch / d));
      pinch = d; if (stage.cinematic) setCine(false);
    }
  });
  const up = (e) => { pts.delete(e.pointerId); pinch = 0; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); stage.orbit.dist = Math.min(7, Math.max(1.3, stage.orbit.dist * Math.exp(e.deltaY * 0.001))); }, { passive: false });

  // ---- loop, with the resolution easing off if the device struggles
  let last = performance.now(), acc = 0, frames = 0, slowK = 1;
  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000); last = now;
    slowK += ((slow ? 0.22 : 1) - slowK) * 0.15;
    stage.update(raw * slowK);
    stage.render();
    acc += raw; frames++;
    if (frames === 50) { const avg = acc / frames; if (avg > 0.030 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); resize(); } acc = 0; frames = 0; }
    requestAnimationFrame(frame);
  }
  $('loading').hidden = true;
  requestAnimationFrame((t) => { last = t; frame(t); });
}
boot().catch((e) => { console.error(e); const l = $('loading'); l.hidden = false; l.textContent = 'Drizzlon could not start on this device (it needs WebGL 2). ' + (e && e.message ? e.message : ''); });
