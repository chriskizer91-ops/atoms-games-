import { ISLAND_SIZES, WORLD } from './config.js';

// The chart (M). Islands you have sighted, drawn by size; the line you have
// travelled; where the current is taking you. With a sail built, click an
// island to set a course for it.

const $ = (id) => document.getElementById(id);
const DOT = { small: 5, medium: 8, large: 12 };
const ZOOMS = [700, 1400, 2800];

export function createMap({ islands, hasSail, audio, onCourse }) {
  const el = {
    root: $('map'),
    canvas: $('map-canvas'),
    info: $('map-info'),
    course: $('map-course'),
    clear: $('map-clear'),
    zoom: $('map-zoom'),
  };
  const ctx = el.canvas.getContext('2d');
  let open = false;
  let zoomI = 1;
  let hover = null;
  let spots = [];  // [{ rec, x, y, r }]

  const sizeName = (rec) => (rec.kind === 'lighthouse' ? 'Lighthouse island' : `${ISLAND_SIZES[rec.size].label} island`);

  function draw() {
    const W = el.canvas.clientWidth, H = el.canvas.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (el.canvas.width !== Math.round(W * dpr)) { el.canvas.width = Math.round(W * dpr); el.canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const st = islands.state;
    const range = ZOOMS[zoomI];
    const scale = Math.min(W, H) / 2 / range;
    const cx = W / 2, cy = H / 2;
    const toS = (x, z) => [cx + (x - st.rw.x) * scale, cy + (z - st.rw.z) * scale];

    // paper and grid
    ctx.fillStyle = '#e9dcb8';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, Math.max(W, H) * 0.7);
    grad.addColorStop(0, 'rgba(255,250,235,0)');
    grad.addColorStop(1, 'rgba(120,90,50,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(90,70,40,0.16)';
    ctx.lineWidth = 1;
    const step = WORLD.chunk;
    const x0 = Math.floor((st.rw.x - range * 2) / step) * step;
    const z0 = Math.floor((st.rw.z - range * 2) / step) * step;
    for (let x = x0; x < st.rw.x + range * 2; x += step) { const [sx] = toS(x, 0); ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke(); }
    for (let z = z0; z < st.rw.z + range * 2; z += step) { const [, sy] = toS(0, z); ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke(); }

    // sight ring
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(60,90,110,0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, WORLD.sight * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // trail
    if (st.trail.length > 1) {
      ctx.strokeStyle = 'rgba(150,60,40,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      st.trail.forEach(([x, z], i) => { const [sx, sy] = toS(x, z); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
      const [rx, ry] = toS(st.rw.x, st.rw.z);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // course line
    const dest = st.dest != null ? st.chart.get(st.dest) : null;
    if (dest) {
      const [dx, dy] = toS(dest.x, dest.z);
      ctx.strokeStyle = 'rgba(40,90,130,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
    }

    // islands
    spots = [];
    const labels = [];  // placed label boxes, so close islands don't print over each other
    ctx.font = '600 12px "Barlow Semi Condensed", system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const rec of islands.chartView(range * 1.6)) {
      const [sx, sy] = toS(rec.x, rec.z);
      const r = Math.max(DOT[rec.size] || 8, rec.R * scale);
      spots.push({ rec, x: sx, y: sy, r: r + 6 });
      // shallows, sand, green
      ctx.fillStyle = 'rgba(120,180,190,0.45)';
      ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9c38a';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rec.visited ? '#6f9a45' : '#86a35a';
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.62, 0, Math.PI * 2); ctx.fill();
      if (rec.kind === 'lighthouse') {
        ctx.fillStyle = '#b8342b';
        ctx.beginPath(); ctx.moveTo(sx - 3, sy + 4); ctx.lineTo(sx + 3, sy + 4); ctx.lineTo(sx + 1.5, sy - 8); ctx.lineTo(sx - 1.5, sy - 8); ctx.closePath(); ctx.fill();
        if (rec.lit) { ctx.fillStyle = 'rgba(255,215,120,0.9)'; ctx.beginPath(); ctx.arc(sx, sy - 9, 3, 0, Math.PI * 2); ctx.fill(); }
      }
      if (hover === rec || dest === rec) {
        ctx.strokeStyle = dest === rec ? '#28597f' : '#3b2a1d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, r + 7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#3b2a1d';
      const label = `${sizeName(rec)}${rec.visited ? ' ✓' : ''}`;
      const w = ctx.measureText(label).width;
      const box = { x0: sx - w / 2 - 3, x1: sx + w / 2 + 3, y0: sy + r + 4, y1: sy + r + 20 };
      const clash = labels.some((b) => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1);
      if (!clash || hover === rec || dest === rec) {
        ctx.fillText(label, sx, sy + r + 16);
        labels.push(box);
      }
    }

    // the raft
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-st.heading + Math.PI);
    ctx.fillStyle = '#8a4b2b';
    ctx.strokeStyle = '#f6eed8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // compass and scale
    ctx.fillStyle = '#3b2a1d';
    ctx.font = '700 15px "Barlow Semi Condensed", system-ui, sans-serif';
    ctx.fillText('N', W - 30, 28);
    ctx.beginPath(); ctx.moveTo(W - 30, 34); ctx.lineTo(W - 25, 52); ctx.lineTo(W - 35, 52); ctx.closePath(); ctx.fill();
    const bar = 200 * scale;
    ctx.fillRect(20, H - 24, bar, 3);
    ctx.font = '600 12px "Barlow Semi Condensed", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('200 m', 20, H - 30);
  }

  function info() {
    const st = islands.state;
    const sail = hasSail();
    const dest = st.dest != null ? st.chart.get(st.dest) : null;
    const lines = [];
    if (islands.resting) lines.push('Resting alongside an island.');
    if (dest) {
      const d = Math.round(Math.hypot(dest.x - st.rw.x, dest.z - st.rw.z));
      lines.push(`Sailing to the ${sizeName(dest).toLowerCase()}: ${d} m, about ${Math.max(1, Math.round(d / WORLD.sail / 60))} min.`);
    } else if (sail) {
      lines.push('Sail up. Click an island to set a course for it.');
    } else {
      lines.push('No sail: the current carries you north and pulls you to islands close to your line. Build a sail to steer.');
    }
    const seen = [...st.chart.values()].filter((r) => r.seen).length;
    const visited = [...st.chart.values()].filter((r) => r.visited).length;
    lines.push(`${seen} island${seen === 1 ? '' : 's'} charted, ${visited} visited.`);
    if (hover) lines.push(`${sizeName(hover)}, ${Math.round(Math.hypot(hover.x - st.rw.x, hover.z - st.rw.z))} m away${hover.visited ? ', visited' : ''}.`);
    el.info.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    el.clear.hidden = !dest;
    el.zoom.textContent = `Zoom: ${['near', 'mid', 'far'][zoomI]}`;
  }

  function pick(e) {
    const r = el.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bestD = Infinity;
    for (const s of spots) {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < s.r && d < bestD) { bestD = d; best = s.rec; }
    }
    return best;
  }

  el.canvas.addEventListener('mousemove', (e) => {
    const h = pick(e);
    if (h !== hover) { hover = h; draw(); info(); }
  });
  el.canvas.addEventListener('click', (e) => {
    const rec = pick(e);
    if (!rec) return;
    if (!hasSail()) { audio.error(); el.course.textContent = 'You need a sail to steer. Build one with the hammer (it needs a crafting table).'; return; }
    islands.setDestination(rec.id);
    audio.pickup();
    el.course.textContent = `Course set for the ${sizeName(rec).toLowerCase()}.`;
    onCourse?.(rec);
    draw(); info();
  });
  el.clear.addEventListener('click', () => {
    islands.setDestination(null);
    el.course.textContent = 'Course cleared: drifting with the current.';
    draw(); info();
  });
  el.zoom.addEventListener('click', () => { zoomI = (zoomI + 1) % ZOOMS.length; draw(); info(); });
  el.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomI = Math.max(0, Math.min(ZOOMS.length - 1, zoomI + (e.deltaY > 0 ? 1 : -1)));
    draw(); info();
  }, { passive: false });

  return {
    get isOpen() { return open; },
    open() {
      open = true;
      hover = null;
      el.course.textContent = '';
      el.root.hidden = false;
      draw();
      info();
    },
    close() {
      open = false;
      el.root.hidden = true;
    },
    // keep it live while open (the raft keeps moving)
    tick() {
      if (open) { draw(); info(); }
    },
  };
}
