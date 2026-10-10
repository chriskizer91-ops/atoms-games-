/* ============================ graduation cutscene ============================ */
const CUT = { t: 0, cv: null, c: null, hats: [], conf: [], seeded: false, ended: false };
const CUT_END = 19.6;
const CUT_CAPS = [
  [0.7, 3.4, 'Narrator', 'Commencement day. Four years of lectures, group projects and cheap coffee.'],
  [3.7, 6.3, 'Announcer', 'And now, our final graduate of the day!'],
  [7.0, 9.7, 'Dean', 'Congratulations. Go do something wonderful.'],
  [9.9, 12.2, 'Narrator', 'A diploma. Heavy paper, a gold seal and no idea what happens next.'],
  [12.4, 15.0, 'Everyone', 'Hats in the air!']
];
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

function drawGrad(c, x, y, s, o) {
  const dir = o.dir || 1;
  const bob = o.walk ? Math.abs(Math.sin(o.walk)) * 4 * s : 0, sw = o.walk ? Math.sin(o.walk) * 7 * s : 0;
  c.fillStyle = '#141b2b';
  c.fillRect(x - 14 * s + sw, y - 24 * s, 11 * s, 24 * s); c.fillRect(x + 3 * s - sw, y - 24 * s, 11 * s, 24 * s);
  c.fillStyle = '#0b0f18';
  c.fillRect(x - 17 * s + sw, y - 4 * s, 16 * s, 5 * s); c.fillRect(x + 1 * s - sw, y - 4 * s, 16 * s, 5 * s);
  c.fillStyle = o.gown; c.beginPath();
  c.moveTo(x - 22 * s, y - 98 * s - bob); c.lineTo(x + 22 * s, y - 98 * s - bob);
  c.lineTo(x + 33 * s, y - 20 * s - bob * 0.5); c.lineTo(x - 33 * s, y - 20 * s - bob * 0.5); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x - 3 * s, y - 98 * s - bob, 6 * s, 78 * s);
  if (o.stole) { c.fillStyle = o.stole; c.fillRect(x - 22 * s, y - 98 * s - bob, 9 * s, 62 * s); c.fillRect(x + 13 * s, y - 98 * s - bob, 9 * s, 62 * s); }
  // arms
  c.strokeStyle = o.gown; c.lineWidth = 11 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - dir * 22 * s, y - 90 * s - bob); c.lineTo(x - dir * 29 * s, y - 52 * s - bob + sw * 0.3); c.stroke();
  const a1 = o.shake || 0, a2 = o.up || 0;
  let hx = x + dir * 29 * s, hy = y - 52 * s - bob;
  hx = lerp(hx, x + dir * 60 * s, a1); hy = lerp(hy, y - 82 * s - bob, a1);
  hx = lerp(hx, x + dir * 30 * s, a2); hy = lerp(hy, y - 162 * s - bob, a2);
  c.beginPath(); c.moveTo(x + dir * 22 * s, y - 90 * s - bob); c.lineTo(hx, hy); c.stroke();
  c.fillStyle = o.skin; c.beginPath(); c.arc(hx, hy, 5.8 * s, 0, 7); c.fill();
  // head
  c.fillStyle = o.skin; c.beginPath(); c.arc(x, y - 118 * s - bob, 17 * s, 0, 7); c.fill();
  c.fillStyle = o.hair; c.beginPath(); c.arc(x, y - 123 * s - bob, 17.6 * s, Math.PI, 0); c.fill();
  c.fillStyle = '#222'; c.fillRect(x - 8 * s + dir * 3 * s, y - 120 * s - bob, 3 * s, 4.5 * s); c.fillRect(x + 5 * s + dir * 3 * s, y - 120 * s - bob, 3 * s, 4.5 * s);
  c.strokeStyle = '#7a3b2b'; c.lineWidth = 1.7 * s; c.lineCap = 'butt';
  c.beginPath(); c.arc(x + dir * 3 * s, y - 112 * s - bob, 5.5 * s, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  if (o.cap !== false) {
    const ty = y - 139 * s - bob;
    c.fillStyle = o.capCol || '#0f1626'; c.fillRect(x - 15 * s, ty, 30 * s, 10 * s);
    c.beginPath(); c.moveTo(x - 32 * s, ty); c.lineTo(x, ty - 12 * s); c.lineTo(x + 32 * s, ty); c.lineTo(x, ty + 10 * s); c.closePath(); c.fill();
    c.strokeStyle = '#f0b429'; c.lineWidth = 2.2 * s;
    const tw = (o.tassel || 0);
    c.beginPath(); c.moveTo(x, ty - 1 * s); c.quadraticCurveTo(x + 20 * s + tw * 6 * s, ty - 2 * s, x + (25 + tw * 10) * s, ty + 18 * s); c.stroke();
    c.fillStyle = '#f0b429'; c.fillRect(x + (23 + tw * 10) * s, ty + 18 * s, 5 * s, 9 * s);
  }
  return { hx, hy };
}
function drawDiploma(c, x, y, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = '#f6f0dc'; rr(c, -24, -7, 48, 14, 6); c.fill();
  c.fillStyle = '#c9402f'; c.fillRect(-4, -8, 8, 16);
  c.restore();
}
function cutSeed() {
  const rnd = mulberry32(8);
  CUT.hats = []; CUT.conf = [];
  const xs = [250, 300, 350, 400, 450, 500, 550, 600, 700];
  xs.forEach((x, i) => CUT.hats.push({ x, y: x === 700 ? 380 : 380, vx: (rnd() - 0.5) * 260, vy: -(520 + rnd() * 320), r: rnd() * 6, vr: (rnd() - 0.5) * 12, mine: x === 700, col: '#0f1626' }));
  for (let i = 0; i < 150; i++) {
    const a = rnd() * Math.PI * 2, sp = 120 + rnd() * 520;
    CUT.conf.push({ x: 640, y: 330, vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp - 200, w: 6 + rnd() * 6, h: 3 + rnd() * 4, r: rnd() * 6, vr: (rnd() - 0.5) * 16, col: ['#ffc247', '#ff6b6b', '#5bd39b', '#47b8ff', '#a393ff', '#ffffff'][i % 6] });
  }
}

function drawCutScene(ct) {
  const cv = CUT.cv, c = CUT.c;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth, h = cv.clientHeight;
  const pw = Math.max(1, Math.round(w * dpr)), ph = Math.max(1, Math.round(h * dpr));
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, pw, ph);
  const k = Math.min(pw / 1280, ph / 720);
  c.setTransform(k, 0, 0, k, (pw - 1280 * k) / 2, (ph - 720 * k) / 2);
  c.save(); c.beginPath(); c.rect(0, 0, 1280, 720); c.clip();

  // sky and tree line
  const sky = c.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, '#3f8fe0'); sky.addColorStop(0.6, '#9ad0f7'); sky.addColorStop(1, '#fff0d2');
  c.fillStyle = sky; c.fillRect(0, 0, 1280, 720);
  c.globalAlpha = 0.7; c.drawImage(GLOW[0], 1110 - 240, 110 - 240, 480, 480); c.globalAlpha = 1;
  c.fillStyle = '#fff6c9'; c.beginPath(); c.arc(1110, 110, 46, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.85)';
  [[120, 150, 1], [520, 60, 0.7], [900, 190, 0.8]].forEach(p => { const cx2 = ((p[0] + ct * 9) % 1500) - 110, s2 = p[2]; c.beginPath(); c.arc(cx2 - 40 * s2, p[1], 26 * s2, 0, 7); c.arc(cx2, p[1] - 16 * s2, 36 * s2, 0, 7); c.arc(cx2 + 44 * s2, p[1] - 4 * s2, 28 * s2, 0, 7); c.ellipse(cx2, p[1] + 12 * s2, 86 * s2, 16 * s2, 0, 0, 7); c.fill(); });
  c.fillStyle = '#5da06a'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(80 + i * 160, 440, 120, 80, 0, 0, 7); c.fill(); }
  c.fillStyle = '#4c8a58'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(150 + i * 170, 470, 100, 60, 0, 0, 7); c.fill(); }
  // stage
  c.fillStyle = '#7a1f33'; c.fillRect(170, 90, 90, 410); c.fillRect(1020, 90, 90, 410);
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.1)'; c.fillRect(170 + i * 15, 90, 7, 410); c.fillRect(1020 + i * 15, 90, 7, 410); }
  c.fillStyle = '#5c1526'; c.fillRect(160, 78, 960, 30); c.fillStyle = '#f0b429'; c.fillRect(160, 104, 960, 4);
  c.fillStyle = '#25304d'; c.fillRect(260, 120, 760, 380);
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 9; i++) c.fillRect(280 + i * 84, 120, 6, 380);
  c.fillStyle = '#1a2f6b'; c.fillRect(380, 150, 520, 130);
  c.strokeStyle = '#f0b429'; c.lineWidth = 4; c.strokeRect(388, 158, 504, 114);
  signText(c, 'FRESH GRAD STATE', 640, 188, 24, '#f0b429');
  signText(c, 'CLASS OF 2026', 640, 236, 56, '#ffffff');
  c.fillStyle = '#8b6a4a'; c.fillRect(150, 496, 980, 44);
  { const sg2 = c.createLinearGradient(0, 496, 0, 540); sg2.addColorStop(0, 'rgba(255,240,210,.28)'); sg2.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = sg2; c.fillRect(150, 496, 980, 44); }
  c.fillStyle = '#6b4d35'; c.fillRect(150, 540, 980, 54);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 12; i++) c.fillRect(150 + i * 82, 496, 3, 44);
  // bunting
  c.strokeStyle = '#334'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 70); c.quadraticCurveTo(640, 110, 1280, 70); c.stroke();
  const bc = ['#ff6b6b', '#ffc247', '#47b8ff', '#5bd39b'];
  for (let i = 0; i < 22; i++) {
    const x = 30 + i * 58, y = 70 + Math.sin((x / 1280) * Math.PI) * 31;
    c.fillStyle = bc[i % 4]; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x, y + 30); c.closePath(); c.fill();
  }
  // podium
  c.fillStyle = '#6b4a30'; c.beginPath(); c.moveTo(900, 520); c.lineTo(1000, 520); c.lineTo(990, 400); c.lineTo(910, 400); c.closePath(); c.fill();
  c.fillStyle = '#8b6240'; c.fillRect(896, 392, 108, 14);
  c.fillStyle = '#f0b429'; c.beginPath(); c.arc(950, 462, 17, 0, 7); c.fill();
  c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(950, 392); c.lineTo(950, 350); c.lineTo(930, 340); c.stroke();

  // other graduates, tossing hats later
  const toss = ct > 11.6;
  const crowd = [250, 300, 350, 400, 450, 500, 550, 600];
  crowd.forEach((x, i) => {
    const up = ct > 10.8 ? smooth((ct - 10.8) / 0.6) : 0;
    drawGrad(c, x, 530, 0.62, { gown: '#1d2e6b', skin: ['#e0ac86', '#f2c9a5', '#8f5d3d', '#d99d77'][i % 4], hair: ['#2b2118', '#7a4a2a', '#1a1a1a', '#d8c27a'][i % 4], cap: !toss, tassel: Math.sin(ct * 3 + i) * 0.4, up, dir: 1 });
  });

  // dean and player
  const wk = clamp((ct - 2.6) / 4.0, 0, 1), e = wk < 0.5 ? 2 * wk * wk : 1 - Math.pow(-2 * wk + 2, 2) / 2;
  const px = lerp(250, 700, e), walking = ct > 2.6 && ct < 6.6;
  const shake = smooth((ct - 6.2) / 0.6) * (1 - smooth((ct - 8.4) / 0.5));
  const up = smooth((ct - 9.6) / 0.7);
  const deanHand = drawGrad(c, 830, 530, 1, { gown: '#1b1b21', stole: '#d4a017', skin: '#e6b995', hair: '#cfcfd4', dir: -1, shake: 0.35 + shake * 0.65, capCol: '#1b1b21', tassel: 0 });
  const me = drawGrad(c, px, 530, 1, { gown: '#1d2e6b', stole: '#f0b429', skin: '#e8b48f', hair: '#2a1f18', dir: 1, walk: walking ? ct * 9 : 0, shake, up, cap: !toss, tassel: ct > 8.8 && ct < 10.4 ? Math.sin((ct - 8.8) * 8) : 0 });
  // diploma
  const give = smooth((ct - 6.9) / 0.6);
  if (ct < 6.2) drawDiploma(c, deanHand.hx - 14, deanHand.hy, -0.3);
  else drawDiploma(c, lerp(deanHand.hx - 14, me.hx + 6, give), lerp(deanHand.hy, me.hy - 4, give), lerp(-0.3, up > 0.1 ? -0.6 : 0.2, give));

  // audience
  for (let row = 0; row < 3; row++) {
    const y = 640 + row * 46, tone = ['#0e1a28', '#142333', '#1a2d41'][row];
    for (let i = -1; i < 22; i++) {
      const x = i * 64 + (row % 2) * 30 + Math.sin(i * 7.3 + row) * 8;
      const cheer = ct > 9.8 ? smooth((ct - 9.8) / 1.2) : 0;
      const bounce = Math.sin(ct * (3 + (i % 3)) + i) * (3 + cheer * 7);
      const arm = cheer > 0.2 && (i + row) % 3 === 0;
      c.fillStyle = tone;
      c.beginPath(); c.ellipse(x, y + 50, 34, 40, 0, Math.PI, 0); c.fill();
      c.beginPath(); c.arc(x, y + bounce, 20, 0, 7); c.fill();
      if (arm) { c.strokeStyle = tone; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 22, y + 34); c.lineTo(x + 30, y - 38 - cheer * 14 + bounce); c.stroke(); }
      if (row === 0 && i % 5 === 2 && ct > 4) {
        c.fillStyle = ['#ffc247', '#ff6b6b', '#5bd39b', '#47b8ff'][i % 4]; c.fillRect(x - 24, y - 70 + bounce, 48, 32);
        c.fillStyle = tone; c.fillRect(x - 2, y - 38 + bounce, 4, 30); c.fillStyle = tone;
      }
    }
  }

  // hats and confetti
  if (toss) {
    const t = ct - 11.6;
    CUT.hats.forEach(hh => {
      const x = hh.x + hh.vx * t, y = hh.y + hh.vy * t + 450 * t * t, r = hh.r + hh.vr * t;
      if (y > 760) return;
      c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = '#0f1626';
      c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, -9); c.lineTo(26, 0); c.lineTo(0, 9); c.closePath(); c.fill();
      c.fillStyle = '#f0b429'; c.fillRect(-1.5, -1.5, 3, 3); c.restore();
    });
    const t2 = ct - 11.8;
    if (t2 > 0) CUT.conf.forEach(p => {
      const x = p.x + p.vx * t2 * 0.8, y = p.y + p.vy * t2 + 260 * t2 * t2;
      if (y > 740 || y < -40) return;
      c.save(); c.translate(x, y); c.rotate(p.r + p.vr * t2); c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
    });
  }
  // stage light: two follow spots, a warm wash, camera flashes and a soft vignette
  c.globalCompositeOperation = 'lighter';
  [[300, -40], [980, -40]].forEach(s => {
    const g2 = c.createLinearGradient(s[0], s[1], px, 520); g2.addColorStop(0, 'rgba(255,240,200,.2)'); g2.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g2; c.beginPath(); c.moveTo(s[0] - 14, s[1]); c.lineTo(s[0] + 14, s[1]); c.lineTo(px + 95, 540); c.lineTo(px - 95, 540); c.closePath(); c.fill();
  });
  if (ct > 9.8 && ct < 14.6) for (let i = 0; i < 5; i++) {
    const tick = Math.floor(ct * 9) + i * 31, fx = hash01(tick, 3, 1) * 1280, fy = 640 + hash01(tick, 5, 2) * 70;
    c.globalAlpha = (1 - ((ct * 9) % 1)) * 0.9; c.drawImage(GLOW[1], fx - 46, fy - 46, 92, 92);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  const cvg = c.createRadialGradient(640, 330, 260, 640, 360, 820); cvg.addColorStop(0, 'rgba(6,8,20,0)'); cvg.addColorStop(1, 'rgba(6,8,20,.55)');
  c.fillStyle = cvg; c.fillRect(0, 0, 1280, 720);
  c.restore();

  // overlays: fade in, flash, black
  c.setTransform(1, 0, 0, 1, 0, 0);
  let fade = 0;
  if (ct < 1.1) fade = 1 - ct / 1.1;
  if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + fade.toFixed(3) + ')'; c.fillRect(0, 0, pw, ph); }
  if (ct > 14.4) {
    const f = clamp((ct - 14.4) / 0.9, 0, 1), b = clamp((ct - 15.3) / 0.35, 0, 1);
    c.fillStyle = 'rgba(255,255,255,' + (f * (1 - b)).toFixed(3) + ')'; c.fillRect(0, 0, pw, ph);
    if (b > 0) { c.fillStyle = 'rgba(0,0,0,' + b.toFixed(3) + ')'; c.fillRect(0, 0, pw, ph); }
  }
}

let cutRaf = 0, cutLast = 0, cutCardStage = 0;
function startCutscene() {
  SFX.init();
  G.mode = 'cut';
  $('#title').hidden = true; $('#cut').hidden = false; $('#degree').hidden = true; $('#game').hidden = true;
  CUT.cv = $('#cutCanvas'); CUT.c = CUT.cv.getContext('2d');
  CUT.t = 0; CUT.ended = false; cutCardStage = 0; cutSeed();
  $('#cutCard').hidden = true; $('#cutCard p').className = '';
  $('#cutCap').style.opacity = 0;
  cutLast = performance.now();
}
function cutUpdate(dt) {
  if (CUT.ended) return;
  CUT.t += dt;
  const ct = CUT.t;
  drawCutScene(ct);
  if (ct > 10.2 && ct < 16) SFX.applause(true); else if (ct >= 16) SFX.applause(false);
  // captions with a typewriter effect
  let cap = null;
  for (const cc of CUT_CAPS) if (ct >= cc[0] && ct < cc[1]) cap = cc;
  const box = $('#cutCap');
  if (cap) {
    box.style.opacity = 1;
    const n = Math.floor((ct - cap[0]) * 38);
    box.querySelector('b').textContent = cap[2];
    box.querySelector('span').textContent = cap[3].slice(0, n);
  } else box.style.opacity = 0;
  // black title card
  const card = $('#cutCard'), p = card.querySelector('p');
  if (ct > 15.4 && cutCardStage === 0) { cutCardStage = 1; card.hidden = false; p.textContent = 'Diploma in hand.'; requestAnimationFrame(() => p.classList.add('on')); }
  if (ct > 17.4 && cutCardStage === 1) { cutCardStage = 2; p.classList.remove('on'); setTimeout(() => { p.textContent = 'Now, what does it say?'; p.classList.add('on'); }, 500); }
  if (ct > CUT_END) finishCut();
}
function finishCut() {
  if (CUT.ended) return;
  CUT.ended = true;
  SFX.applause(false);
  $('#cut').hidden = true;
  $('#cutCard').hidden = true;
  showDegreeScreen();
}

