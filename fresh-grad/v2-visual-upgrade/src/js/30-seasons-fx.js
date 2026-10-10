/* ============================ seasons, weather and juice ============================ */
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_NAME = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
function seasonOf(day) { return SEASONS[Math.floor((Math.max(1, day || 1) - 1) / 7) % 4]; }
const season = () => seasonOf(S ? S.day : 1);
const WINTER = () => season() === 'winter';

/* park paths, the same shapes the ground painter uses */
function parkPaths(c, gr) {
  const W = WORLD.w;
  c.beginPath();
  c.rect(FOUNTAIN.x - 28 - gr, PARK_Y + 2, 56 + gr * 2, FOUNTAIN.y - PARK_Y);
  c.rect(80 - gr, FOUNTAIN.y - 14 - gr, W - 160 + gr * 2, 28 + gr * 2);
  c.rect(780 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr); c.rect(2040 - gr, PARK_Y + 2, 40 + gr * 2, 700 + gr);
  c.moveTo(FOUNTAIN.x + 190 + gr, FOUNTAIN.y); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 190 + gr, 124 + gr, 0, 0, 6.2832);
}
/* painted once into each cached ground chunk */
function seasonGround(c, x0, y0, x1, y1) {
  const se = season(), H = WORLD.h, vw = x1 - x0;
  if (y1 < PARK_Y - 40 && se !== 'winter') return;
  if (se === 'winter') {
    // frost on the paving, snow banked against the curbs
    c.fillStyle = 'rgba(240,246,255,.22)'; c.fillRect(x0, TOP_Y + 4, vw, PARK_Y - TOP_Y - 4);
    ROADS_H.forEach(r => {
      c.fillStyle = '#f4f8fc';
      for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
        if (STREETS_X.some(cx => Math.abs(x - cx) < 110)) continue;
        const h1 = 4 + hash01(x, r.y, 3) * 4, h2 = 3 + hash01(x, r.y, 5) * 4;
        c.beginPath(); c.ellipse(x + 11, r.y - 4, 14, h1, 0, 0, 7); c.fill();
        c.beginPath(); c.ellipse(x + 11, r.y + r.h + 4, 14, h2, 0, 0, 7); c.fill();
      }
      c.fillStyle = 'rgba(150,175,205,.35)'; c.fillRect(x0, r.y - 1, vw, 2); c.fillRect(x0, r.y + r.h + 7, vw, 1.5);
    });
    if (y1 > PARK_Y) {
      const g = c.createLinearGradient(0, PARK_Y, 0, H); g.addColorStop(0, '#eef4fa'); g.addColorStop(1, '#dde8f2');
      c.fillStyle = g; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
      // drifts and blue shadows
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) for (let y = PARK_Y + 30; y < H; y += 70) {
        const v = hash01(x, y, 11);
        c.fillStyle = v < 0.5 ? 'rgba(170,195,225,.22)' : 'rgba(255,255,255,.7)';
        c.beginPath(); c.ellipse(x + v * 60, y + hash01(x, y, 12) * 40, 26 + v * 30, 6 + v * 5, 0, 0, 7); c.fill();
      }
      parkPaths(c, 4); c.fillStyle = '#b9c7d6'; c.fill();
      parkPaths(c, 0); c.fillStyle = '#d6e0ea'; c.fill();
      c.fillStyle = 'rgba(140,160,185,.35)';
      for (let x = Math.floor(x0 / 18) * 18; x < x1; x += 18) { c.fillRect(x, FOUNTAIN.y - 6, 6, 2); c.fillRect(x + 8, FOUNTAIN.y + 4, 6, 2); }
      c.fillStyle = '#c9d4df'; c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, 150, 96, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,140,165,.25)'; c.lineWidth = 2; [150, 112, 78].forEach(r => { c.beginPath(); c.ellipse(FOUNTAIN.x, FOUNTAIN.y, r, r * 0.64, 0, 0, 7); c.stroke(); });
      c.fillStyle = '#e8eef4'; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx + 11, POND.ry + 11, 0, 0, 7); c.fill();
    }
    return;
  }
  if (y1 < PARK_Y) return;
  if (se === 'autumn') {
    c.fillStyle = 'rgba(214,150,60,.22)'; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
    const cols = ['#d9822b', '#c0502a', '#e7b24a', '#a8432a', '#f0c35a'];
    for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) for (let y = PARK_Y + 8; y < H; y += 14) {
      const v = hash01(x, y, 21); if (v > 0.32) continue;
      c.fillStyle = cols[Math.floor(hash01(x, y, 22) * cols.length)];
      c.beginPath(); c.ellipse(x + hash01(x, y, 23) * 12, y + hash01(x, y, 24) * 12, 2.6, 1.4, v * 9, 0, 7); c.fill();
    }
  } else if (se === 'spring') {
    for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) for (let y = PARK_Y + 8; y < H; y += 16) {
      const v = hash01(x, y, 31); if (v > 0.12) continue;
      c.fillStyle = v < 0.05 ? '#ffd6e4' : '#ffffff';
      c.beginPath(); c.arc(x + hash01(x, y, 32) * 14, y + hash01(x, y, 33) * 14, 1.6, 0, 7); c.fill();
    }
  } else {
    c.fillStyle = 'rgba(255,230,120,.06)'; c.fillRect(x0, PARK_Y + 6, vw, H - PARK_Y - 6);
  }
}
/* drawn every frame over the live ground: ice on the pond */
function seasonLive(c, vx0, vy0, vx1, vy1) {
  if (!WINTER()) return;
  if (!(POND.x + POND.rx > vx0 && POND.x - POND.rx < vx1 && POND.y + POND.ry > vy0 && POND.y - POND.ry < vy1)) return;
  const g = c.createRadialGradient(POND.x - 40, POND.y - 20, 10, POND.x, POND.y, POND.rx);
  g.addColorStop(0, '#e9f5fb'); g.addColorStop(1, '#b6d6e8');
  c.fillStyle = g; c.beginPath(); c.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 40 + i * 18; c.beginPath(); c.moveTo(POND.x + Math.cos(a) * r * 0.4, POND.y + Math.sin(a) * r * 0.2); c.lineTo(POND.x + Math.cos(a + 0.4) * r, POND.y + Math.sin(a + 0.4) * r * 0.45); c.stroke(); }
  c.strokeStyle = 'rgba(120,160,190,.35)';
  [[-60, 10, 50], [80, -20, 40], [20, 40, 30]].forEach(p => { c.beginPath(); c.ellipse(POND.x + p[0], POND.y + p[1], p[2], p[2] * 0.3, 0.3, 0, 5); c.stroke(); });
}
/* trees change with the seasons */
function seasonTree(c, t, cx, cy, r, k) {
  const se = season();
  const blob = (ox, oy, rr2, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx + ox * r, cy + oy * r, rr2 * r, 0, 7); c.fill(); };
  if (se === 'winter') {
    // bare branches with snow along the tops
    c.strokeStyle = '#5a3d27'; c.lineCap = 'round';
    const br = [[0, 1, -0.2, -1.1, 3], [0, 0.4, -0.8, -0.5, 2.2], [0, 0.3, 0.8, -0.6, 2.2], [-0.4, -0.3, -0.7, -1, 1.4], [0.4, -0.2, 0.55, -1.05, 1.4], [0, -0.3, 0.2, -1.2, 1.6]];
    br.forEach(b => { c.lineWidth = b[4]; c.beginPath(); c.moveTo(cx + b[0] * r, cy + b[1] * r); c.lineTo(cx + b[2] * r, cy + b[3] * r); c.stroke(); });
    c.lineCap = 'butt';
    c.fillStyle = '#f6fafd';
    br.forEach((b, i) => { c.beginPath(); c.ellipse(cx + (b[0] + b[2]) / 2 * r, cy + (b[1] + b[3]) / 2 * r - 1.5, r * 0.22, 2, Math.atan2(b[3] - b[1], b[2] - b[0]) * (i % 2 ? 1 : 0.6), 0, 7); c.fill(); });
    c.beginPath(); c.ellipse(t.x, t.y + 1, r * 0.8, r * 0.26, 0, 0, 7); c.fill();
    return true;
  }
  let dk, md, lt;
  if (se === 'autumn') {
    const p = [['#9a3b22', '#c8552a', '#e98a3a'], ['#a8641c', '#d98f22', '#f2bf4a'], ['#7a2f2a', '#b0402f', '#dc6a3c'], ['#6b6a28', '#9a8f2c', '#c9b54a']][Math.floor(k * 4) % 4];
    [dk, md, lt] = p;
  } else if (se === 'spring' && k < 0.28) { dk = '#b85c7c'; md = '#e58aa6'; lt = '#ffc3d4'; }
  else return false;
  blob(0, 0.16, 1.02, dk); blob(-0.5, 0.2, 0.62, dk); blob(0.52, 0.22, 0.6, dk);
  blob(-0.34, -0.08, 0.66, md); blob(0.36, -0.04, 0.62, md); blob(0, -0.36, 0.72, md);
  blob(-0.26, -0.44, 0.44, lt); blob(0.22, -0.3, 0.3, lt); blob(-0.52, -0.02, 0.24, lt);
  return true;
}
function snowOnPine(c, x, w, ty, r, sx) {
  c.fillStyle = 'rgba(246,250,253,.95)';
  c.beginPath(); c.moveTo(x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.lineTo(x + sx, ty - r * 1.12); c.lineTo(x + w * 0.5 + sx * 0.4, ty - r * 0.5); c.quadraticCurveTo(x + sx * 0.7, ty - r * 0.38, x - w * 0.5 + sx * 0.4, ty - r * 0.5); c.fill();
}
/* snow on the rooftops, with icicles */
function snowRoof(c, b) {
  if (!WINTER()) return;
  const x = b.x - 7, w = b.w + 14, y = b.y;
  c.fillStyle = '#f6fafd';
  c.beginPath(); c.moveTo(x, y + 3);
  for (let i = 0; i <= w; i += 12) c.quadraticCurveTo(x + i + 6, y - 5 - hash01(b.x, i, 3) * 3, x + Math.min(w, i + 12), y - 1);
  c.lineTo(x + w, y + 4); c.lineTo(x, y + 4); c.closePath(); c.fill();
  c.fillStyle = 'rgba(160,185,215,.5)'; c.fillRect(x, y + 3, w, 1.5);
  const rh = b.kind === 'deco' ? (b.style === 'tower' ? 24 : 36) : b.kind === 'apt' ? 44 : 34;
  c.fillStyle = 'rgba(230,245,255,.9)';
  for (let i = 6; i < w - 4; i += 9) { const L = 3 + hash01(b.x, i, 7) * 8; c.beginPath(); c.moveTo(x + i - 1.6, y + rh); c.lineTo(x + i + 1.6, y + rh); c.lineTo(x + i, y + rh + L); c.closePath(); c.fill(); }
}

/* ---------- weather: snowfall, storms, fog ---------- */
const STORM = { flash: 0, next: 4, rumble: 0 };
function drawWeatherPlus(c, cv, A, dpr, dt) {
  const w = cv.width, h = cv.height, tm = FX.time;
  if (A.snow > 0.02 && !REDUCED) {
    const n = Math.round(170 * A.snow);
    c.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < n; i++) {
      const sp = 40 + (i % 5) * 14, s = (1.2 + (i % 4) * 0.7) * dpr;
      const y = ((i * 91.7 + tm * sp * dpr) % (h + 40)) - 20, x = ((i * 157.3 + Math.sin(tm * 0.8 + i) * 30 * dpr + tm * 20 * dpr) % (w + 40)) - 20;
      c.globalAlpha = 0.5 + (i % 3) * 0.2; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(220,232,250,' + (0.08 * A.snow).toFixed(3) + ')'; c.fillRect(0, 0, w, h);
  }
  if (A.storm > 0.3 && !REDUCED) {
    STORM.next -= dt || 0.016;
    if (STORM.next <= 0) { STORM.flash = 1; STORM.next = 5 + Math.random() * 9; STORM.rumble = 0.6 + Math.random() * 1.2; }
    if (STORM.rumble > 0) { STORM.rumble -= dt || 0.016; if (STORM.rumble <= 0) SFX.thunder(); }
    if (STORM.flash > 0.01) {
      c.fillStyle = 'rgba(235,240,255,' + (0.55 * STORM.flash * STORM.flash).toFixed(3) + ')'; c.fillRect(0, 0, w, h);
      STORM.flash *= Math.pow(0.02, dt || 0.016);
    }
  }
  if (A.fog > 0.02) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(225,232,238,' + (0.55 * A.fog).toFixed(3) + ')'); g.addColorStop(1, 'rgba(225,232,238,' + (0.25 * A.fog).toFixed(3) + ')');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.18 * A.fog;
    for (let i = 0; i < 5; i++) { const x = ((i * 0.27 + tm * 0.012) % 1.4 - 0.2) * w, y = h * (0.2 + i * 0.15); c.drawImage(GLOW[1], x - w * 0.4, y - h * 0.12, w * 0.8, h * 0.24); }
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
    c.fillStyle = 'rgba(120,145,180,' + (0.3 * Math.min(1, t.t / 3)).toFixed(3) + ')';
    if (t.bike) c.fillRect(t.x - 4, t.y - 0.6, 8, 1.2);
    else { c.beginPath(); c.ellipse(t.x, t.y, 2.2, 1.2, 0, 0, 7); c.fill(); }
  }
}
function drawParticles(c) {
  if (!PFX.length) return;
  const sc = pfxScene();
  for (const p of PFX) {
    if (p.sc !== sc) continue;
    const a = clamp(p.life / p.max * 1.6, 0, 1);
    c.globalAlpha = a;
    if (p.k === 'coin') {
      const sx = Math.abs(Math.cos(p.rot)) * 4 + 0.6;
      c.fillStyle = '#c98f1e'; c.beginPath(); c.ellipse(p.x, p.y + 0.6, sx, 4.4, 0, 0, 7); c.fill();
      c.fillStyle = '#ffd34d'; c.beginPath(); c.ellipse(p.x, p.y, sx, 4.2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(p.x - sx * 0.4, p.y - 2.5, Math.max(0.6, sx * 0.4), 2);
    } else if (p.k === 'heart') {
      c.fillStyle = p.col; c.beginPath(); c.moveTo(p.x, p.y + 3); c.bezierCurveTo(p.x - 6, p.y - 2, p.x - 3, p.y - 6.5, p.x, p.y - 3); c.bezierCurveTo(p.x + 3, p.y - 6.5, p.x + 6, p.y - 2, p.x, p.y + 3); c.fill();
    } else if (p.k === 'spark') {
      const r = 3.2; c.fillStyle = p.col; c.beginPath(); c.moveTo(p.x, p.y - r * 1.6); c.lineTo(p.x + r * 0.4, p.y - r * 0.4); c.lineTo(p.x + r * 1.6, p.y); c.lineTo(p.x + r * 0.4, p.y + r * 0.4); c.lineTo(p.x, p.y + r * 1.6); c.lineTo(p.x - r * 0.4, p.y + r * 0.4); c.lineTo(p.x - r * 1.6, p.y); c.lineTo(p.x - r * 0.4, p.y - r * 0.4); c.closePath(); c.fill();
    } else if (p.k === 'confetti') {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-2.5, -1.4, 5, 2.8); c.restore();
    } else if (p.k === 'text') {
      c.font = '800 13px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 3.5; c.strokeStyle = 'rgba(12,16,28,.75)'; c.strokeText(p.txt, p.x, p.y); c.fillStyle = p.col; c.fillText(p.txt, p.x, p.y);
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
    c.globalAlpha = a * 0.5; c.fillStyle = 'rgba(10,12,26,.5)'; c.beginPath(); c.ellipse(s.x, s.y + 4, 9 * sc, 3 * sc, 0, 0, 7); c.fill();
    c.globalAlpha = a;
    c.fillStyle = near ? '#ffc247' : '#fffaf0'; c.strokeStyle = near ? '#2b1c00' : col; c.lineWidth = 2;
    c.beginPath(); c.moveTo(s.x, y - 8 * sc); c.lineTo(s.x + 7 * sc, y); c.lineTo(s.x, y + 8 * sc); c.lineTo(s.x - 7 * sc, y); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = near ? '#2b1c00' : col; c.beginPath(); c.arc(s.x, y, 2.2 * sc, 0, 7); c.fill();
    if (near) { c.strokeStyle = 'rgba(255,194,71,.8)'; c.lineWidth = 1.6; const pr = 14 + Math.sin(tm * 5) * 2; c.beginPath(); c.ellipse(s.x, s.y + 4, pr, pr * 0.4, 0, 0, 7); c.stroke(); }
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
    const pr = 18 + Math.sin(tm * 4) * 2.5;
    c.globalAlpha = a;
    c.strokeStyle = open ? 'rgba(255,194,71,.9)' : 'rgba(170,180,195,.7)'; c.lineWidth = near ? 2.4 : 1.6;
    c.beginPath(); c.ellipse(d.x, d.y - 6, pr, pr * 0.36, 0, 0, 7); c.stroke();
    if (open) { c.fillStyle = 'rgba(255,194,71,.16)'; c.fill(); }
    c.globalAlpha = 1;
  }
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
  el.style.background = 'radial-gradient(circle at ' + WIPE.x.toFixed(1) + 'px ' + WIPE.y.toFixed(1) + 'px, rgba(8,12,22,0) ' + Math.max(0, r - 1).toFixed(1) + 'px, #080c16 ' + r.toFixed(1) + 'px)';
}

/* ---------- confetti across the whole screen, for big moments ---------- */
const CONF = { p: [], c: null };
function confetti(n) {
  if (REDUCED) return;
  const cv = $('#confetti'); if (!cv) return;
  const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; cv.hidden = false; CONF.c = cv.getContext('2d'); CONF.dpr = dpr;
  const cols = ['#ffc247', '#ff7eb6', '#6fd1ff', '#8ac926', '#ff7a59', '#c77dff', '#ffffff'];
  for (let i = 0; i < (n || 160); i++) CONF.p.push({ x: w * (0.5 + (Math.random() - 0.5) * 0.3), y: h * 0.45, vx: (Math.random() - 0.5) * 900, vy: -300 - Math.random() * 700, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, col: cols[i % cols.length], life: 2.6 + Math.random() * 1.4 });
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
    c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.rot * 1.3)), p.w, p.h * Math.abs(Math.cos(p.rot * 1.3)) + 0.5); c.restore();
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
