import { SAILING, KNOTS, pointOfSail, windWord, wrap } from './sailing.js';

// The sailing dial (bottom right, once a sail is built): which way the wind
// blows across the raft, the zone you can't sail into, where north is, how
// fast you're going and how the sail is set. The bow is always at the top.

const $ = (id) => document.getElementById(id);
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const SAIL_WORD = (s) => (s <= 0.01 ? 'down' : s < 0.75 ? 'half up' : 'full');
const POINT_NOTE = {
  'in irons': 'in irons: the sail only flaps',
  'close-hauled': 'close-hauled',
  'close reach': 'close reach',
  'beam reach': 'beam reach',
  'broad reach': 'broad reach',
  running: 'running before the wind',
};

export function createSailHud() {
  const el = { root: $('sailhud'), dial: $('sail-dial'), speed: $('sail-speed'), point: $('sail-point'), wind: $('sail-wind'), state: $('sail-state'), keys: $('sail-keys') };
  const ctx = el.dial.getContext('2d');
  const SIZE = 116;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  el.dial.width = el.dial.height = Math.round(SIZE * dpr);
  let timer = 0;
  let shown = false;
  const text = (node, s) => { if (node.textContent !== s) node.textContent = s; };

  function draw(v) {
    const R = SIZE / 2, r = R - 9;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.translate(R, R);
    // face
    ctx.fillStyle = 'rgba(9, 22, 30, 0.55)';
    ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(241, 232, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    // The no-go zone: headings too close to the wind, centred on where it blows from.
    const a = v.twa - Math.PI / 2; // canvas angles start at the right; the bow is up
    ctx.fillStyle = v.inIrons ? 'rgba(239, 91, 76, 0.42)' : 'rgba(239, 91, 76, 0.2)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r - 1, a - SAILING.noGo, a + SAILING.noGo); ctx.closePath(); ctx.fill();
    // north
    const n = -v.bearing - Math.PI / 2;
    ctx.fillStyle = '#f1e8d4';
    ctx.font = '700 11px "Barlow Semi Condensed", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', Math.cos(n) * (r + 0.5), Math.sin(n) * (r + 0.5));
    for (let k = 1; k < 8; k++) {
      const t = n + (k * Math.PI) / 4;
      ctx.strokeStyle = 'rgba(241, 232, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(t) * (r - 3), Math.sin(t) * (r - 3)); ctx.lineTo(Math.cos(t) * (r + 2), Math.sin(t) * (r + 2)); ctx.stroke();
    }
    // the wind: an arrow blowing in from the rim, longer in a blow
    const len = 13 + Math.min(16, v.windSpeed * 1.2);
    const x0 = Math.cos(a) * (r - 3), y0 = Math.sin(a) * (r - 3);
    const x1 = Math.cos(a) * (r - 3 - len), y1 = Math.sin(a) * (r - 3 - len);
    ctx.strokeStyle = '#8fd4ea';
    ctx.fillStyle = '#8fd4ea';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 - Math.cos(a) * 5, y1 - Math.sin(a) * 5);
    ctx.lineTo(x1 + Math.cos(a + 1.9) * 5.5, y1 + Math.sin(a + 1.9) * 5.5);
    ctx.lineTo(x1 + Math.cos(a - 1.9) * 5.5, y1 + Math.sin(a - 1.9) * 5.5);
    ctx.closePath(); ctx.fill();
    // the raft, bow up, with its boom
    ctx.fillStyle = '#b88a55';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(-8, -9, 16, 18); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(0, -14); ctx.lineTo(8, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (v.sail > 0.03) {
      ctx.strokeStyle = '#f1e8d4';
      ctx.lineWidth = 2 + 1.5 * v.sail;
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(Math.sin(v.boom) * 13, -3 + Math.cos(v.boom) * 13); ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return {
    // v: { show, dt, wind {from, speed, gust}, heading (chart), speed (m/s over the sea), sail, sailSet,
    //      boom, helm, course, over, surfing }
    update(v) {
      if (v.show !== shown) { shown = v.show; el.root.hidden = !shown; timer = 0; }
      if (!shown) return;
      timer -= v.dt;
      if (timer > 0) return;
      timer = 0.1;
      const twa = wrap(v.wind.from - (Math.PI / 2 - v.heading));
      const kn = v.speed * KNOTS;
      const wkn = v.wind.speed * KNOTS;
      const up = v.sail > 0.03;
      const point = pointOfSail(twa);
      draw({ twa, bearing: Math.PI - v.heading, windSpeed: v.wind.speed, sail: v.sail, boom: v.boom, inIrons: up && point === 'in irons' });
      text(el.speed, `${kn.toFixed(1)} kn`);
      text(el.point, v.surfing > 0.3 ? 'surfing!' : up ? POINT_NOTE[point] : v.speed > 0.3 ? 'adrift on the current' : 'at rest');
      const dir = COMPASS[Math.round((((Math.atan2(Math.cos(v.wind.from), -Math.sin(v.wind.from)) / (Math.PI * 2)) + 1) % 1) * 8) % 8];
      text(el.wind, `Wind ${Math.round(wkn)} kn from the ${dir} · ${windWord(wkn)}`);
      text(el.state, v.over > 0.02 ? 'Sail: too much for this wind' : `Sail: ${SAIL_WORD(v.sailSet)}${v.course ? ' · holding course' : ''}`);
      el.state.classList.toggle('warn', v.over > 0.02);
      text(el.keys, v.helm ? 'A D steer · W S sail up, down · E let go' : '');
      el.root.classList.toggle('helm', !!v.helm);
    },
  };
}
