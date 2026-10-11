/* ---------- weather: snowfall, storms, fog ---------- */
const STORM = { flash: 0, next: 4, rumble: 0, again: 0, bolt: null };
const FLAKE = atmoSprite(32, 32, (g) => {
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
});
const FOGBANK = atmoSprite(512, 160, (g) => {
  const r = mulberry32(61);
  for (let k = 0; k < 9; k++) {
    const x = 90 + r() * 330, y = 60 + r() * 40, rd = 50 + r() * 50;
    const gr = g.createRadialGradient(x, y, rd * 0.1, x, y, rd);
    gr.addColorStop(0, 'rgba(236,241,246,.8)'); gr.addColorStop(0.6, 'rgba(236,241,246,.38)'); gr.addColorStop(1, 'rgba(236,241,246,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rd * 1.6, rd * 0.8, 0, 0, 7); g.fill();
  }
});
/* a forked bolt as segments in picture-relative coordinates (x0, y0, x1, y1) */
function stormBolt() {
  const segs = [], r = Math.random;
  let x = 0.15 + r() * 0.7, y = 0;
  const branch = (bx, by, n, dirx) => { for (let i = 0; i < n; i++) { const nx = bx + dirx * (0.01 + r() * 0.03), ny = by + 0.05 + r() * 0.07; segs.push([bx, by, nx, ny]); bx = nx; by = ny; } };
  while (y < 0.98) {
    const nx = x + (r() - 0.5) * 0.07, ny = Math.min(1, y + 0.06 + r() * 0.08);
    segs.push([x, y, nx, ny]);
    if (r() < 0.28) branch(nx, ny, 2 + Math.floor(r() * 3), r() < 0.5 ? -1 : 1);
    x = nx; y = ny;
  }
  return segs;
}
function drawWeatherPlus(c, cv, A, dpr, dt) {
  const w = cv.width, h = cv.height, tm = FX.time, tier = atmoTier();
  if (A.snow > 0.02 && !REDUCED) {
    const SN = A.snow, T = tier > 1 ? 1 : 0.6, gust = Math.sin(tm * 0.33) * 0.6 + Math.sin(tm * 0.8 + 1) * 0.3, drift = 18 + gust * 26;
    // far: fine specks, mid: small flakes, near: big soft flakes close to the lens
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath();
    const nF = Math.round(170 * SN * T);
    for (let i = 0; i < nF; i++) {
      const sp = 22 + (i % 4) * 6, s = (0.8 + (i % 3) * 0.35) * dpr;
      const y = ((i * 91.7 + tm * sp * dpr) % (h + 40)) - 20, x = ((i * 157.3 + Math.sin(tm * 0.6 + i) * 14 * dpr + tm * drift * 0.5 * dpr) % (w + 40)) - 20;
      c.rect(x, y, s, s);
    }
    c.fill();
    const nM = Math.round(84 * SN * T);
    for (let i = 0; i < nM; i++) {
      const sp = 44 + (i % 5) * 12, s = (4.5 + (i % 4) * 1.5) * dpr;
      const y = ((i * 113.3 + 17 + tm * sp * dpr) % (h + 60)) - 30, x = ((i * 191.7 + Math.sin(tm * 0.8 + i * 1.3) * 26 * dpr + tm * drift * dpr) % (w + 60)) - 30;
      c.globalAlpha = 0.55 + (i % 3) * 0.15; c.drawImage(FLAKE, x - s / 2, y - s / 2, s, s);
    }
    const nN = Math.round(20 * SN * T);
    for (let i = 0; i < nN; i++) {
      const sp = 80 + (i % 4) * 18, s = (13 + (i % 5) * 3.5) * dpr;
      const y = ((i * 211.3 + 41 + tm * sp * dpr) % (h + 100)) - 50, x = ((i * 277.7 + Math.sin(tm * 0.7 + i * 2.1) * 42 * dpr + tm * drift * 1.7 * dpr) % (w + 100)) - 50;
      c.globalAlpha = 0.34 + (i % 3) * 0.1; c.drawImage(FLAKE, x - s / 2, y - s / 2, s, s);
    }
    c.globalAlpha = 1;
    const sg = c.createLinearGradient(0, h * 0.55, 0, h); sg.addColorStop(0, 'rgba(226,236,252,0)'); sg.addColorStop(1, 'rgba(226,236,252,' + (0.14 * SN).toFixed(3) + ')');
    c.fillStyle = sg; c.fillRect(0, h * 0.55, w, h * 0.45);
    c.fillStyle = 'rgba(220,232,250,' + (0.07 * SN).toFixed(3) + ')'; c.fillRect(0, 0, w, h);
  }
  if (A.storm > 0.3 && !REDUCED) {
    const d = dt || 0.016;
    STORM.next -= d;
    if (STORM.next <= 0) { STORM.flash = 1; STORM.again = 0.1 + Math.random() * 0.12; STORM.bolt = stormBolt(); STORM.next = 5 + Math.random() * 9; STORM.rumble = 0.6 + Math.random() * 1.2; }
    if (STORM.again > 0) { STORM.again -= d; if (STORM.again <= 0) STORM.flash = Math.max(STORM.flash, 0.75); }
    if (STORM.rumble > 0) { STORM.rumble -= d; if (STORM.rumble <= 0) SFX.thunder(); }
    if (STORM.flash > 0.01) {
      c.fillStyle = 'rgba(214,226,255,' + (0.3 * STORM.flash * STORM.flash).toFixed(3) + ')'; c.fillRect(0, 0, w, h);
      STORM.flash *= Math.pow(0.02, d);
    }
  }
  if (A.fog > 0.02) {
    const FG = A.fog;
    // denser toward the distance, thinner near the lens
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(226,233,240,' + (0.46 * FG).toFixed(3) + ')'); g.addColorStop(0.55, 'rgba(226,233,240,' + (0.26 * FG).toFixed(3) + ')'); g.addColorStop(1, 'rgba(226,233,240,' + (0.12 * FG).toFixed(3) + ')');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // banks of mist drifting at three depths, anchored to the street so they slide as you walk
    const m = dpr * CAM.k, span = WORLD.w + 1000;
    for (let L = 0; L < 3; L++) {
      const bw = (520 + L * 170) * m, bh = bw * 160 / 512;
      c.globalAlpha = (0.42 - L * 0.08) * FG;
      for (let i = 0; i < 5; i++) {
        const wx = ((i * 743 + L * 311 + (REDUCED ? 0 : tm) * (4 + L * 3)) % span) - 500, wy = TOP_Y + 80 + L * 230 + ((i * 131 + L * 37) % 170);
        const sx = (wx - CAM.x) * m, sy = (wy - CAM.y) * m;
        if (sx + bw < 0 || sx - bw > w || sy + bh < 0 || sy - bh > h) continue;
        c.drawImage(FOGBANK, sx - bw / 2, sy - bh / 2, bw, bh);
      }
    }
    c.globalAlpha = 1;
  }
}

/* ---------- particles: coins, hearts, sparkles, footprints ---------- */
const PFX = [];
const TRACKS = [];
function pfxScene() { return S ? sceneKey() : ''; }
function burst(kind, n, o) {
  if (!S || REDUCED && kind !== 'text') return;
  o = o || {};
  const x = o.x != null ? o.x : S.px, y = o.y != null ? o.y : S.py - 34, sc = pfxScene();
  if (kind === 'text') { PFX.push({ k: 'text', x, y: y - 12, vx: 0, vy: -26, life: 1.6, max: 1.6, txt: o.txt, col: o.col || '#ffe08a', sc }); return; }
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * (kind === 'confetti' ? 2.6 : 1.8), sp = (kind === 'coin' ? 90 : 50) + Math.random() * 70;
    PFX.push({ k: kind, x: x + (Math.random() - 0.5) * 10, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9 + Math.random() * 0.6, max: 1.5, rot: Math.random() * 6, col: o.col || ['#ff7eb6', '#ffd166', '#6fd1ff', '#8ac926'][i % 4], sc });
  }
  if (PFX.length > 260) PFX.splice(0, PFX.length - 260);
}
function updParticles(dt) {
  for (let i = PFX.length - 1; i >= 0; i--) {
    const p = PFX[i];
    p.life -= dt;
    if (p.life <= 0) { PFX.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot = (p.rot || 0) + dt * 6;
    if (p.k === 'coin' || p.k === 'confetti') p.vy += 260 * dt;
    else if (p.k === 'heart' || p.k === 'spark') { p.vy *= 0.97; p.vx *= 0.95; p.vy -= 10 * dt; }
    else if (p.k === 'text') p.vy *= 0.97;
  }
  // footprints in the snow, puffs of dust otherwise
  if (S && S.scene === 'town' && G.moving && !REDUCED) {
    G.stepAcc = (G.stepAcc || 0) + dt;
    if (G.stepAcc > 0.22) {
      G.stepAcc = 0; G.stepSide = !G.stepSide;
      if (WINTER()) { TRACKS.push({ x: S.px + (G.stepSide ? 3 : -3), y: S.py + 1, t: 9, bike: ridingBike() }); if (TRACKS.length > 90) TRACKS.shift(); }
    }
  }
  for (let i = TRACKS.length - 1; i >= 0; i--) { TRACKS[i].t -= dt; if (TRACKS[i].t <= 0) TRACKS.splice(i, 1); }
}
function drawTracks(c) {
  if (!TRACKS.length) return;
  for (const t of TRACKS) {
    const a = Math.min(1, t.t / 3);
    if (t.bike) {
      // a tyre line pressed into the snow: dark groove with a lit lip
      c.fillStyle = 'rgba(96,120,158,' + (0.34 * a).toFixed(3) + ')'; c.fillRect(t.x - 4.5, t.y - 0.8, 9, 1.6);
      c.fillStyle = 'rgba(255,255,255,' + (0.5 * a).toFixed(3) + ')'; c.fillRect(t.x - 4.5, t.y - 1.5, 9, 0.7);
    } else {
      // a boot print: heel and sole, a shaded dent and a bright rim on the sunny side
      const fx = t.x + (t.x % 2 > 1 ? 0.4 : -0.4);
      c.fillStyle = 'rgba(255,255,255,' + (0.55 * a).toFixed(3) + ')'; c.beginPath(); c.ellipse(fx + 0.5, t.y - 0.6, 2.5, 1.5, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(100,124,162,' + (0.38 * a).toFixed(3) + ')'; c.beginPath(); c.ellipse(fx, t.y, 2.2, 1.2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(78,100,138,' + (0.22 * a).toFixed(3) + ')'; c.beginPath(); c.ellipse(fx - 0.3, t.y + 0.15, 1.2, 0.6, 0, 0, 7); c.fill();
    }
  }
}
function pfxText(c, p, a) {
  c.globalAlpha = a;
  c.font = '800 13.5px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(12,16,28,.8)'; c.strokeText(p.txt, p.x, p.y + 0.8);
  c.lineWidth = 3; c.strokeStyle = 'rgba(12,16,28,.9)'; c.strokeText(p.txt, p.x, p.y);
  c.fillStyle = p.col; c.fillText(p.txt, p.x, p.y);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.save(); c.beginPath(); c.rect(p.x - 80, p.y - 8, 160, 5); c.clip(); c.fillText(p.txt, p.x, p.y); c.restore();
  c.lineJoin = 'miter'; c.globalAlpha = 1;
}
function drawParticles(c) {
  if (!PFX.length) return;
  const sc = pfxScene();
  for (const p of PFX) {
    if (p.sc !== sc) continue;
    const a = clamp(p.life / p.max * 1.6, 0, 1);
    if (p.k === 'text') { FX.over.push(() => pfxText(c, p, a)); continue; }
    c.globalAlpha = a;
    if (p.k === 'coin') {
      const sx = Math.abs(Math.cos(p.rot)) * 4 + 0.6;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.45; c.drawImage(GLOW[5], p.x - 11, p.y - 11, 22, 22); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
      c.fillStyle = '#a8731a'; c.beginPath(); c.ellipse(p.x, p.y + 0.8, sx, 4.4, 0, 0, 7); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.ellipse(p.x, p.y, sx, 4.2, 0, 0, 7); c.fill();
      if (sx > 1.8) { c.strokeStyle = '#e0a02a'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(p.x, p.y, sx * 0.62, 2.7, 0, 0, 7); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(p.x - sx * 0.5, p.y - 3, Math.max(0.6, sx * 0.35), 2.2);
    } else if (p.k === 'heart') {
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.4; c.drawImage(GLOW[4], p.x - 11, p.y - 11, 22, 22); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
      c.fillStyle = p.col; c.beginPath(); c.moveTo(p.x, p.y + 3.4); c.bezierCurveTo(p.x - 6.4, p.y - 2, p.x - 3.2, p.y - 7, p.x, p.y - 3.2); c.bezierCurveTo(p.x + 3.2, p.y - 7, p.x + 6.4, p.y - 2, p.x, p.y + 3.4); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(p.x - 2.6, p.y - 3.1, 1.3, 0.8, -0.6, 0, 7); c.fill();
    } else if (p.k === 'spark') {
      const r = 3.2, tw = 0.75 + 0.25 * Math.sin(p.rot * 3);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.55; c.drawImage(GLOW[5], p.x - 13, p.y - 13, 26, 26); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
      c.fillStyle = p.col; c.beginPath(); c.moveTo(p.x, p.y - r * 1.7 * tw); c.lineTo(p.x + r * 0.4, p.y - r * 0.4); c.lineTo(p.x + r * 1.7 * tw, p.y); c.lineTo(p.x + r * 0.4, p.y + r * 0.4); c.lineTo(p.x, p.y + r * 1.7 * tw); c.lineTo(p.x - r * 0.4, p.y + r * 0.4); c.lineTo(p.x - r * 1.7 * tw, p.y); c.lineTo(p.x - r * 0.4, p.y - r * 0.4); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, 0.9, 0, 7); c.fill();
    } else if (p.k === 'confetti') {
      const flip = Math.cos(p.rot * 1.7);
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = flip > 0 ? p.col : shade(p.col, -0.25); c.fillRect(-2.5, -1.4 * Math.max(0.25, Math.abs(flip)), 5, 2.8 * Math.max(0.25, Math.abs(flip))); c.restore();
    }
  }
  c.globalAlpha = 1;
}

/* ---------- markers: where you can interact ---------- */
function drawSpotMarkers(c, d) {
  const tm = REDUCED ? 0 : FX.time, col = (PLACES[d.id] && PLACES[d.id].col) || '#ffc247';
  for (const s of d.spots) {
    if (s.id === 'exit' || (s.when && !s.when())) continue;
    const dist = Math.hypot(S.px - s.x, S.py - s.y);
    if (dist > 420) continue;
    const near = G.near === s.id, bob = Math.sin(tm * 3 + s.x * 0.05) * 2.5, y = s.y - 30 + bob, sc = near ? 1.25 : 1;
    const a = near ? 1 : clamp(1.15 - dist / 420, 0.35, 0.85);
    // ground shadow and a soft pool of light on the floor
    c.globalAlpha = a * 0.5; c.fillStyle = 'rgba(10,12,26,.5)'; c.beginPath(); c.ellipse(s.x, s.y + 4, 9 * sc * (1 - bob * 0.02), 3 * sc, 0, 0, 7); c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (near ? 0.5 : 0.3); c.drawImage(GLOW[near ? 5 : 0], s.x - 24 * sc, s.y + 4 - 9 * sc, 48 * sc, 18 * sc);
    c.globalAlpha = a * 0.5; c.drawImage(GLOW[near ? 5 : 0], s.x - 16 * sc, y - 16 * sc, 32 * sc, 32 * sc); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = a;
    // a faceted gem: light top, deeper bottom, a bright centre
    const top = near ? '#ffe9a8' : '#ffffff', bot = near ? '#ffc247' : shade(col, 0.55), edge = near ? '#2b1c00' : col;
    const gg = c.createLinearGradient(0, y - 8 * sc, 0, y + 8 * sc); gg.addColorStop(0, top); gg.addColorStop(1, bot);
    c.fillStyle = gg; c.strokeStyle = edge; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(s.x, y - 8 * sc); c.lineTo(s.x + 7 * sc, y); c.lineTo(s.x, y + 8 * sc); c.lineTo(s.x - 7 * sc, y); c.closePath(); c.fill(); c.stroke();
    c.lineJoin = 'miter';
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(s.x, y - 7 * sc); c.lineTo(s.x + 5.6 * sc, y - 0.6 * sc); c.lineTo(s.x, y - 0.6 * sc); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(s.x, y + 7 * sc); c.lineTo(s.x + 5.6 * sc, y + 0.6 * sc); c.lineTo(s.x, y + 0.6 * sc); c.closePath(); c.fill();
    c.fillStyle = edge; c.beginPath(); c.arc(s.x, y, 2.2 * sc, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(s.x - 0.7 * sc, y - 0.7 * sc, 0.7 * sc, 0, 7); c.fill();
    if (near) {
      const pr = 14 + Math.sin(tm * 5) * 2, ph = (tm * 1.2) % 1;
      c.strokeStyle = 'rgba(255,194,71,.8)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(s.x, s.y + 4, pr, pr * 0.4, 0, 0, 7); c.stroke();
      c.globalAlpha = a * (1 - ph) * 0.6; c.lineWidth = 1; c.beginPath(); c.ellipse(s.x, s.y + 4, pr * (1 + ph * 0.7), pr * 0.4 * (1 + ph * 0.7), 0, 0, 7); c.stroke();
    }
  }
  c.globalAlpha = 1;
}
function drawDoorMarkers(c) {
  const tm = REDUCED ? 0 : FX.time;
  for (const id of ENTERABLE) {
    const d = DOORS[id]; if (!d || id === 'park') continue;
    const dist = Math.hypot(S.px - d.x, S.py - d.y);
    if (dist > 300) continue;
    const open = isOpen(id), near = G.near === id, a = clamp(1.2 - dist / 300, 0, 1) * (near ? 1 : 0.7);
    const pr = 18 + Math.sin(tm * 4) * 2.5, cy = d.y - 6, ry = pr * 0.36;
    // floor glow
    const gr = c.createRadialGradient(d.x, cy, 2, d.x, cy, pr);
    gr.addColorStop(0, open ? 'rgba(255,214,120,.34)' : 'rgba(190,200,215,.16)'); gr.addColorStop(1, open ? 'rgba(255,194,71,0)' : 'rgba(170,180,195,0)');
    c.globalAlpha = a; c.fillStyle = gr; c.beginPath(); c.ellipse(d.x, cy, pr, ry, 0, 0, 7); c.fill();
    // ring: a soft outer line, a crisp inner line, and when you are close, marching dashes
    c.strokeStyle = open ? 'rgba(255,194,71,.28)' : 'rgba(170,180,195,.22)'; c.lineWidth = near ? 4.4 : 3.2; c.beginPath(); c.ellipse(d.x, cy, pr, ry, 0, 0, 7); c.stroke();
    c.strokeStyle = open ? 'rgba(255,205,98,.95)' : 'rgba(176,186,200,.75)'; c.lineWidth = near ? 2.2 : 1.4; c.beginPath(); c.ellipse(d.x, cy, pr, ry, 0, 0, 7); c.stroke();
    if (near && c.setLineDash) {
      c.setLineDash([5, 6]); c.lineDashOffset = -tm * 14; c.strokeStyle = open ? 'rgba(255,240,190,.8)' : 'rgba(210,218,228,.6)'; c.lineWidth = 1; c.beginPath(); c.ellipse(d.x, cy, pr - 4, ry - 1.6, 0, 0, 7); c.stroke(); c.setLineDash([]);
    }
    if (open) { const ph = (tm * 0.8) % 1; c.globalAlpha = a * (1 - ph) * 0.5; c.strokeStyle = 'rgba(255,205,98,.9)'; c.lineWidth = 1; c.beginPath(); c.ellipse(d.x, cy, pr * (1 + ph * 0.45), ry * (1 + ph * 0.45), 0, 0, 7); c.stroke(); }
    c.globalAlpha = 1;
  }
}
/* where you clicked: a small marker with a ripple that keeps spreading */
function drawTargetMarker(c) {
  const t = G.target, tm = REDUCED ? 0 : FX.time, r = 8 + Math.sin(FX.time * 8) * 1.6, ph = (tm * 1.4) % 1;
  c.fillStyle = 'rgba(255,194,71,.1)'; c.beginPath(); c.ellipse(t.x, t.y, r * 1.5, r * 0.82, 0, 0, 7); c.fill();
  c.globalAlpha = 1 - ph; c.strokeStyle = 'rgba(255,214,120,.8)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(t.x, t.y, r * (1 + ph * 1.2), r * 0.55 * (1 + ph * 1.2), 0, 0, 7); c.stroke(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(20,24,40,.5)'; c.lineWidth = 4; c.beginPath(); c.ellipse(t.x, t.y, r, r * 0.55, 0, 0, 7); c.stroke();
  c.strokeStyle = '#ffc247'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#ffc247'; c.beginPath(); c.ellipse(t.x, t.y, 2.4, 1.4, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(t.x - 0.6, t.y - 0.3, 0.8, 0.4, 0, 0, 7); c.fill();
}

/* ---------- screen wipe between places ---------- */
const WIPE = { t: 0, phase: '', cb: null, x: 0, y: 0 };
function wipeTo(cb) {
  if (WIPE.phase || REDUCED) { cb(); return; }
  const st = $('#stage'), r = st.getBoundingClientRect(), wr = $('#world').getBoundingClientRect();
  WIPE.x = (S.px - CAM.x) * CAM.k + (wr.left - r.left); WIPE.y = (S.py - 24 - CAM.y) * CAM.k + (wr.top - r.top);
  WIPE.t = 0; WIPE.phase = 'close'; WIPE.cb = cb; WIPE.w = r.width; WIPE.h = r.height;
  $('#wipe').hidden = false;
  SFX.whoosh();
}
function stepWipe(dt) {
  if (!WIPE.phase) return;
  WIPE.t += dt;
  const el = $('#wipe'), R = Math.hypot(WIPE.w, WIPE.h);
  let r;
  if (WIPE.phase === 'close') {
    const k = clamp(WIPE.t / 0.32, 0, 1); r = R * (1 - k * k);
    if (k >= 1) { WIPE.phase = 'hold'; WIPE.t = 0; try { WIPE.cb && WIPE.cb(); } catch (e) { console.error(e); } WIPE.cb = null; WIPE.x = WIPE.w / 2; WIPE.y = WIPE.h * 0.56; }
  } else if (WIPE.phase === 'hold') { r = 0; if (WIPE.t > 0.08) { WIPE.phase = 'open'; WIPE.t = 0; } }
  else {
    const k = clamp(WIPE.t / 0.42, 0, 1); r = R * (1 - (1 - k) * (1 - k) * (1 - k));
    if (k >= 1) { WIPE.phase = ''; el.hidden = true; return; }
  }
  // a feathered iris with a thin warm rim just inside its edge
  const r0 = Math.max(0, r - 14), r1 = Math.max(r0, r - 3), r2 = Math.max(r1, r - 0.5), r3 = Math.max(r2, r);
  el.style.background = 'radial-gradient(circle at ' + WIPE.x.toFixed(1) + 'px ' + WIPE.y.toFixed(1) + 'px, rgba(8,12,22,0) ' + r0.toFixed(1) + 'px, rgba(255,194,71,.2) ' + r1.toFixed(1) + 'px, rgba(8,12,22,.94) ' + r2.toFixed(1) + 'px, #080c16 ' + (r3 + 0.5).toFixed(1) + 'px)';
}

/* ---------- confetti across the whole screen, for big moments ---------- */
const CONF = { p: [], c: null };
function confetti(n) {
  if (REDUCED) return;
  const cv = $('#confetti'); if (!cv) return;
  const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; cv.hidden = false; CONF.c = cv.getContext('2d'); CONF.dpr = dpr;
  const cols = ['#ffc247', '#ff7eb6', '#6fd1ff', '#8ac926', '#ff7a59', '#c77dff', '#ffffff'];
  for (let i = 0; i < (n || 160); i++) CONF.p.push({ x: w * (0.5 + (Math.random() - 0.5) * 0.3), y: h * 0.45, vx: (Math.random() - 0.5) * 900, vy: -300 - Math.random() * 700, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, col: cols[i % cols.length], life: 2.6 + Math.random() * 1.4, sh: i % 5 });
}
function stepConfetti(dt) {
  if (!CONF.p.length) return;
  const c = CONF.c, cv = $('#confetti');
  c.setTransform(CONF.dpr, 0, 0, CONF.dpr, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  for (let i = CONF.p.length - 1; i >= 0; i--) {
    const p = CONF.p[i];
    p.life -= dt; if (p.life <= 0) { CONF.p.splice(i, 1); continue; }
    p.vy += 900 * dt; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, p.life);
    const fl = Math.cos(p.rot * 1.3), af = Math.abs(fl);
    c.fillStyle = fl > 0 ? p.col : shade(p.col, -0.28);
    if (p.sh === 3) { c.beginPath(); c.ellipse(0, 0, p.w * 0.42, p.w * 0.42 * Math.max(0.2, af), 0, 0, 7); c.fill(); }
    else if (p.sh === 4) {
      // a streamer: a ribbon that ripples as it falls
      c.lineWidth = 2.2; c.strokeStyle = c.fillStyle; c.lineCap = 'round'; c.beginPath(); c.moveTo(-p.w * 1.3, 0);
      c.bezierCurveTo(-p.w * 0.5, -p.h * 1.6 * fl, p.w * 0.5, p.h * 1.6 * fl, p.w * 1.3, 0); c.stroke(); c.lineCap = 'butt';
    } else {
      c.fillRect(-p.w / 2, -p.h / 2 * af, p.w, p.h * af + 0.5);
      if (af > 0.5) { c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(-p.w / 2, -p.h / 2 * af, p.w, Math.max(0.5, p.h * af * 0.3)); }
    }
    c.restore();
  }
  if (!CONF.p.length) { c.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
}

/* ---------- a little generative music ---------- */
const MUSIC = {
  on: false, ctx: null, master: null, next: 0, step: 0, timer: null,
  start() {
    SFX.init(); const c = SFX.ctx; if (!c || this.timer) return;
    this.ctx = c; this.master = c.createGain(); this.master.gain.value = 0.0001; this.master.connect(c.destination);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; this.lp = lp; lp.connect(this.master);
    this.master.gain.setTargetAtTime(0.5, c.currentTime, 1.2);
    this.next = c.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 120);
  },
  stop() {
    if (!this.timer) return;
    clearInterval(this.timer); this.timer = null;
    const m = this.master; try { m.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); setTimeout(() => { try { m.disconnect(); } catch (e) { /* gone */ } }, 1500); } catch (e) { /* gone */ }
  },
  note(f, t, d, type, v) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.08, d * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.lp); o.start(t); o.stop(t + d + 0.05);
  },
  tick() {
    if (!this.ctx || !G.sound) return;
    const c = this.ctx, beat = 0.42;
    // chords drift with the time of day: bright by day, soft and low at night
    const night = S ? (S.t < 6 * 60 || S.t >= 20 * 60) : false, se = season();
    const prog = night ? [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]] : se === 'winter' ? [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]] : [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
    const scale = night ? [57, 60, 62, 64, 67, 69] : [60, 62, 64, 67, 69, 72, 74];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    while (this.next < c.currentTime + 0.4) {
      const t = this.next, s = this.step, ch = prog[Math.floor(s / 16) % prog.length];
      if (s % 16 === 0) ch.forEach((m, i) => this.note(mtof(m - 12), t + i * 0.02, beat * 15, 'triangle', 0.018));
      if (s % 4 === 0) this.note(mtof(ch[0] - 24), t, beat * 3.6, 'sine', 0.035);
      if (!night || s % 2 === 0) { if (hash01(s, Math.floor(s / 64), 7) < (night ? 0.28 : 0.42)) this.note(mtof(scale[Math.floor(hash01(s, 3, 9) * scale.length)]), t, beat * 1.8, 'sine', 0.022); }
      this.next += beat / 2; this.step++;
    }
  }
};

/* ---------- extra sounds ---------- */
SFX.noiseHit = function (dur, freq, q, vol, sweep) {
  if (!G.sound || !this.ctx) return;
  try {
    const c = this.ctx, len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.4);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, c.currentTime + dur);
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  } catch (e) { /* audio is optional */ }
};
SFX.thunder = function () { this.noiseHit(2.6, 90, 0.7, 0.5); this.noiseHit(1.2, 160, 0.9, 0.25); };
SFX.whoosh = function () { this.noiseHit(0.45, 500, 1.2, 0.12, 2400); };
SFX.fanfare = function () { [523, 659, 784, 1046].forEach((f, i) => this.beep(f, 0.32, 'triangle', 0.06, i * 0.11)); this.beep(1318, 0.6, 'triangle', 0.05, 0.48); };
SFX.splash = function () { this.noiseHit(0.5, 1200, 0.8, 0.18, 400); };
SFX.reel = function () { this.beep(900 + Math.random() * 200, 0.03, 'square', 0.012); };
