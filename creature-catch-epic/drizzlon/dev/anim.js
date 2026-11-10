// Contact sheet: plays a move with a fixed time step and lays frames out in a grid.
//   ?move=tackle&t0=0&t1=1.6&n=12&cols=4&cam=side|front|q|wide|free&pre=1.0
import * as THREE from 'three';
import { Stage } from '../src/stage.js';
const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1800), H = +(q.get('h') || 1200);
const n = +(q.get('n') || 12), cols = +(q.get('cols') || 4), rows = Math.ceil(n / cols);
const cw = Math.floor(W / cols), ch = Math.floor(H / rows);
const canvas = document.getElementById('c');
const out = document.getElementById('o'); out.width = W; out.height = H; out.style.width = W + 'px'; out.style.height = H + 'px';
const g = out.getContext('2d');
const stage = new Stage(canvas, { preserve: true, grass: +(q.get('grass') || 5000), shadowSize: 1024, cinematic: q.get('cam') === 'cine' });
stage.setSize(cw, ch, 1); canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'; canvas.style.visibility = 'hidden';
await stage.load('../model/drizzlon.glb?' + Date.now());
window.stage = stage;
const CAMS = { side: [-Math.PI / 2, 0.10, 3.4, [0, 0.42, 0.7]], q: [-1.2, 0.16, 3.3, [0, 0.38, 0.62]], walk: [-1.57, 0.12, 3.6, [-0.5, 0.3, 0.2]], legs: [-1.2, 0.1, 1.5, [0, 0.2, 0.0]], legsf: [0.3, 0.1, 1.5, [0, 0.2, 0.0]], front: [0.25, 0.1, 3.6, [0, 0.4, 0.3]], wide: [-1.9, 0.28, 4.6, [0, 0.5, 0.7]],
  close: [-2.3, 0.12, 1.7, [0, 0.38, 0.1]], back: [-2.8, 0.25, 3.0, [0, 0.4, 0.6]], top: [-1.57, 1.2, 4, [0, 0.2, 0.7]], face: [-0.5, 0.06, 0.95, [0, 0.49, 0.24]], cine: [-2.15, 0.16, 3.3, [0, 0.36, 0.62]] };
const c = CAMS[q.get('cam') || 'q'];
Object.assign(stage.orbit, { yaw: c[0], pitch: c[1], dist: c[2] }); stage.orbit.focus.fromArray(c[3]);
const dt = 1 / 60, pre = +(q.get('pre') ?? 0.5);
const move = q.get('move'), t0 = +(q.get('t0') || 0), t1 = +(q.get('t1') || 1.5);
Math.seedrandom = null;
let s = 1234567; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
for (let t = 0; t < pre; t += dt) stage.update(dt);
import('../src/moves.js').then(() => {});
const ov = q.get('P');
if (ov) { const o = JSON.parse(ov); const { MOVES } = await import('../src/moves.js'); MOVES.dbg = { id: 'dbg', dur: 99, blendIn: 0.2, pose: (t, P) => { for (const k in o) P[k] = o[k]; } }; stage.play('dbg'); }
if (move) stage.play(move);
let time = 0;
for (let i = 0; i < n; i++) {
  const target = n > 1 ? t0 + (t1 - t0) * i / (n - 1) : t0;
  while (time < target - 1e-6) { stage.update(dt); time += dt; }
  stage.camInit = stage.camInit && true;
  stage.render();
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  g.drawImage(canvas, x, y);
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, 86, 22); g.fillStyle = '#fff'; g.font = '14px monospace'; g.fillText(target.toFixed(2) + 's', x + 6, y + 16);
}
window.DONE = true;
