/* ============================ fish, painted properly ============================
   fishArt(c, f, x, y, s) draws one fish centred on x,y. The unit box is about 48 by 24 (nose at x -19, tail tip at x +24), so the old call sites keep their
   sizes. The body is shaded back-to-belly, with scales, a lateral line, a gill plate, fins with rays and a glassy eye; each species adds its own markings. */
const FISH_LOOK = {
  bluegill: { back: '#27547a', side: '#4f8fc0', belly: '#f0b25a', fin: '#3d7aa8', tall: 1.12, mark: 'bars', ear: '#10243a' },
  perch: { back: '#6a6a22', side: '#d9b13a', belly: '#f4e6a0', fin: '#e8803a', tall: 1.04, mark: 'perch' },
  carp: { back: '#6a4e22', side: '#b08a4a', belly: '#e6d7a6', fin: '#8a6a34', tall: 1.14, mark: 'scales', barbel: true },
  catfish: { back: '#3a3a36', side: '#6b6a60', belly: '#c9c6b4', fin: '#4a4a44', tall: 0.94, mark: 'spots', barbel: true, flat: true },
  trout: { back: '#5a7a4a', side: '#e88aa0', belly: '#fbe8e0', fin: '#e0a090', tall: 0.96, mark: 'trout' },
  sunfish: { back: '#2a6a8a', side: '#f08a3a', belly: '#ffd27a', fin: '#d9732a', tall: 1.2, mark: 'sun', ear: '#7a1c10' },
  pike: { back: '#2f5a2a', side: '#5a8a4a', belly: '#e8f0cc', fin: '#7a9a50', tall: 0.7, mark: 'pike', long: true },
  koi: { back: '#f4f0e6', side: '#fbf8f0', belly: '#ffffff', fin: '#ffd9a0', tall: 1.04, mark: 'koi' },
  icecod: { back: '#7da4ba', side: '#a9d6ea', belly: '#e8f4fa', fin: '#8fb8cc', tall: 1.0, mark: 'cod', barbel: true },
  moonfin: { back: '#7a62c9', side: '#c9b6ff', belly: '#f0e8ff', fin: '#b6a0ff', tall: 1.06, mark: 'moon' }
};
function fishBody(c, L, T, tail) {
  // nose at -19; the spine and belly curves meet at the tail stalk
  c.beginPath(); c.moveTo(-19 * L, 0.6);
  c.bezierCurveTo(-15 * L, -8.6 * T, -4 * L, -10 * T, 6 * L, -4.6 * T);
  c.bezierCurveTo(9 * L, -3.2 * T, 11 * L, -2 * T, 13 * L, -1.7 * T);
  if (tail) { c.lineTo(24 * L, -9.5 * T); c.quadraticCurveTo(20 * L, 0, 24 * L, 9.5 * T); }
  c.lineTo(13 * L, 1.7 * T);
  c.bezierCurveTo(11 * L, 2.4 * T, 9 * L, 3.4 * T, 6 * L, 5 * T);
  c.bezierCurveTo(-4 * L, 10 * T, -15 * L, 9 * T, -19 * L, 0.6);
  c.closePath();
}
function fishArt(c, f, x, y, s) {
  const im = agFishImg(f);
  if (im) { agFishDraw(c, im, x, y, s); return; }
  c.save(); c.translate(x, y); c.scale(s, s);
  if (f.id === 'boot') { fishBoot(c, f); c.restore(); return; }
  const k = FISH_LOOK[f.id] || FISH_LOOK.bluegill, L = k.long ? 1.1 : 1, T = k.tall * (k.long ? 0.7 : 1);
  if (f.id === 'moonfin') { c.globalCompositeOperation = 'lighter'; c.fillStyle = AK.rgba('#b6a0ff', 0.22); c.beginPath(); c.ellipse(0, 0, 30, 17, 0, 0, 7); c.fill(); c.fillStyle = AK.rgba('#e8dcff', 0.16); c.beginPath(); c.ellipse(0, 0, 21, 11, 0, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
  // fins behind the body: dorsal, anal, pelvic
  c.fillStyle = k.fin; c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.5;
  const finRays = rays => { c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.4; for (const r of rays) { c.beginPath(); c.moveTo(r[0], r[1]); c.lineTo(r[2], r[3]); c.stroke(); } c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.5; };
  if (k.long) {
    c.beginPath(); c.moveTo(4 * L, -4.5 * T); c.bezierCurveTo(7 * L, -11 * T, 14 * L, -10 * T, 16 * L, -2.6 * T); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(4 * L, 4.8 * T); c.bezierCurveTo(7 * L, 11 * T, 14 * L, 10 * T, 16 * L, 3 * T); c.closePath(); c.fill(); c.stroke();
  } else {
    c.beginPath(); c.moveTo(-8 * L, -8.6 * T); c.bezierCurveTo(-6 * L, -16 * T, 2 * L, -17 * T, 8 * L, -4.6 * T); c.closePath(); c.fill(); c.stroke();
    finRays([[-5 * L, -9 * T, -3.4 * L, -14.6 * T], [-1 * L, -9.6 * T, 0, -15.6 * T], [3 * L, -8.4 * T, 4.6 * L, -13 * T]]);
    c.beginPath(); c.moveTo(0, 8.7 * T); c.bezierCurveTo(3 * L, 14 * T, 10 * L, 13 * T, 11 * L, 2.8 * T); c.closePath(); c.fill(); c.stroke();
  }
  c.beginPath(); c.moveTo(-7 * L, 7.4 * T); c.bezierCurveTo(-9 * L, 13 * T, -3 * L, 13 * T, -1 * L, 8 * T); c.closePath(); c.fill(); c.stroke();
  // tail
  const grd = (c1, c2, c3) => { const g = c.createLinearGradient(0, -10 * T, 0, 10 * T); g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, c3); return g; };
  c.fillStyle = k.fin; c.beginPath(); c.moveTo(12 * L, -1.7 * T); c.lineTo(24 * L, -10 * T); c.quadraticCurveTo(19.5 * L, 0, 24 * L, 10 * T); c.lineTo(12 * L, 1.7 * T); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(13 * L, i * 0.5); c.lineTo(22.5 * L, i * 2.6 * T); c.stroke(); }
  // barbels for the bottom feeders
  if (k.barbel) { c.strokeStyle = k.back; c.lineWidth = 0.9; c.lineCap = 'round'; for (const sg of [-1, 1]) for (let i = 0; i < (f.id === 'catfish' ? 2 : 1); i++) { c.beginPath(); c.moveTo(-18 * L, 2.4 + i); c.quadraticCurveTo(-23 * L, 4 + i * 3 + sg, -26 * L - i * 2, 8 + i * 3 + sg * 1.4); c.stroke(); } c.lineCap = 'butt'; }
  // the body
  fishBody(c, L, T, false); c.fillStyle = grd(k.back, k.side, k.belly); c.fill();
  c.save(); fishBody(c, L, T, false); c.clip();
  // markings that belong to the species, clipped to the body
  const rand = mulberry32(f.id.length * 97 + f.id.charCodeAt(0));
  if (k.mark === 'bars' || k.mark === 'perch') { c.fillStyle = k.mark === 'perch' ? 'rgba(40,40,10,.55)' : 'rgba(10,30,60,.32)'; for (let i = 0; i < (k.mark === 'perch' ? 6 : 5); i++) { c.beginPath(); c.moveTo(-10 * L + i * 4.4 * L, -11 * T); c.lineTo(-7.6 * L + i * 4.4 * L, -11 * T); c.lineTo(-5.6 * L + i * 4.4 * L, 11 * T); c.lineTo(-8 * L + i * 4.4 * L, 11 * T); c.fill(); } }
  if (k.mark === 'sun') { c.fillStyle = 'rgba(40,120,180,.55)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-12 + i * 2, 1.6 + i * 2.2, 5, 0.9, 0.25, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,200,.7)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(-4 + rand() * 16, -5 + rand() * 9, 0.9, 0, 7); c.fill(); } }
  if (k.mark === 'spots' || k.mark === 'cod') { c.fillStyle = k.mark === 'cod' ? 'rgba(60,90,110,.35)' : 'rgba(20,20,18,.4)'; for (let i = 0; i < 22; i++) { c.beginPath(); c.arc(-14 + rand() * 28, -8 + rand() * 12, 0.7 + rand() * 1.4, 0, 7); c.fill(); } }
  if (k.mark === 'trout') { c.fillStyle = 'rgba(214,60,90,.7)'; c.fillRect(-17, -1.4, 32, 2.8); c.fillStyle = 'rgba(30,50,30,.7)'; for (let i = 0; i < 20; i++) { c.beginPath(); c.arc(-14 + rand() * 28, -8 + rand() * 6, 0.7 + rand() * 0.6, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-17, 0.8, 32, 1); }
  if (k.mark === 'pike') { c.fillStyle = 'rgba(240,240,170,.55)'; for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(-16 + (i % 13) * 3, -6 + Math.floor(i / 13) * 5 + rand() * 2, 1.1, 0.6, 0, 0, 7); c.fill(); } }
  if (k.mark === 'koi') { c.fillStyle = '#ee6a2a'; c.beginPath(); c.ellipse(-8, -3, 8, 6, 0.3, 0, 7); c.ellipse(8, 1, 7, 5, -0.2, 0, 7); c.fill(); c.fillStyle = '#1c1c1f'; c.beginPath(); c.ellipse(0, -5.5, 3.5, 2.6, 0, 0, 7); c.ellipse(11, -3, 2.4, 1.8, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,200,60,.35)'; c.beginPath(); c.ellipse(-3, 3, 8, 2.4, 0, 0, 7); c.fill(); }
  if (k.mark === 'moon') { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 18; i++) { const px = -15 + rand() * 28, py = -7 + rand() * 13; AK.star(c, px, py, 0.9 + rand() * 1.3, 0.25); c.fill(); } }
  // scales: a soft crosshatch of small arcs
  c.strokeStyle = k.mark === 'scales' ? 'rgba(60,40,10,.28)' : 'rgba(0,0,0,.1)'; c.lineWidth = 0.4;
  const sz = k.mark === 'scales' ? 3.6 : 2.6;
  for (let row = 0; row < 7; row++) for (let col = 0; col < 12; col++) { const sx = -12 + col * sz + (row % 2) * sz * 0.5, sy2 = -7 * T + row * sz * 1.1 * T; c.beginPath(); c.arc(sx, sy2, sz * 0.55, 0.3, 2.84); c.stroke(); }
  // belly light, back shade and a long soft highlight along the flank
  c.fillStyle = SK.lin(c, 0, -10 * T, 0, 10 * T, [[0, 'rgba(0,0,0,.28)'], [0.35, 'rgba(0,0,0,0)'], [0.7, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.28)']]); c.fillRect(-20, -11, 40, 22);
  c.fillStyle = 'rgba(255,255,255,.32)'; c.beginPath(); c.ellipse(-3, -4 * T, 12, 1.8 * T, -0.06, 0, 7); c.fill();
  c.restore();
  // outline, lateral line, gill plate, mouth
  fishBody(c, L, T, false); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.7; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-11 * L, -1 * T); c.quadraticCurveTo(0, -2.4 * T, 12 * L, -0.6 * T); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.7; c.beginPath(); c.arc(-9.5 * L, 0.4, 7.2 * T, -1.2, 1.25); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(-8.7 * L, 0.4, 7.2 * T, -1.1, 1.1); c.stroke();
  if (k.ear) { c.fillStyle = k.ear; c.beginPath(); c.ellipse(-8.4 * L, -0.4, 2.4, 1.7, 0, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-19 * L, 1); c.quadraticCurveTo(-16 * L, 2.2, -13.6 * L, 1.4); c.stroke();
  if (k.mark === 'pike') { c.fillStyle = k.side; c.beginPath(); c.moveTo(-19 * L, 0.4); c.lineTo(-23 * L, 0.2); c.quadraticCurveTo(-23 * L, 2.4, -18 * L, 2.6); c.closePath(); c.fill(); c.stroke(); }
  // the eye
  const ex = -14.2 * L, ey = -2.6 * T;
  c.fillStyle = '#f4f1e2'; c.beginPath(); c.arc(ex, ey, 2.7, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.5; c.stroke();
  c.fillStyle = f.id === 'koi' ? '#222' : '#c98a2a'; c.beginPath(); c.arc(ex - 0.2, ey, 1.9, 0, 7); c.fill(); c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(ex - 0.3, ey, 1.2, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 1, ey - 0.8, 0.7, 0, 7); c.fill();
  c.restore();
}
function fishBoot(c, f) {
  // an old leather boot, mud-streaked, with a bit of weed hanging off it
  c.fillStyle = SK.lin(c, -14, -14, 16, 14, [[0, '#7a5638'], [0.55, '#5a3d27'], [1, '#33210f']]);
  c.beginPath(); c.moveTo(-13, -15); c.lineTo(-1, -15); c.lineTo(-1, 1); c.lineTo(15, 3); c.quadraticCurveTo(21, 6, 20, 12); c.lineTo(20, 14); c.lineTo(-14, 14); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.8; c.stroke();
  c.fillStyle = '#2b1c10'; c.fillRect(-14, 10.2, 34, 4.8); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-14, 10.2, 34, 0.8);
  c.fillStyle = '#7a5638'; c.fillRect(-13, -15, 12, 3); c.fillStyle = '#3a2614'; c.fillRect(-13, -13, 12, 1);
  c.strokeStyle = '#d8c9a0'; c.lineWidth = 0.8; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-1.6, -9 + i * 3.4); c.lineTo(-6, -8 + i * 3.4); c.stroke(); } c.lineCap = 'butt';
  c.strokeStyle = 'rgba(210,190,140,.5)'; c.setLineDash([1.6, 1.4]); c.lineWidth = 0.6; c.beginPath(); c.moveTo(3, 4); c.quadraticCurveTo(10, 6, 17, 8); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(70,90,40,.55)'; c.beginPath(); c.ellipse(8, 6, 6, 2.6, 0.2, 0, 7); c.fill();
  c.strokeStyle = '#3f7a3f'; c.lineWidth = 1.2; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-9 + i * 3, 14); c.quadraticCurveTo(-11 + i * 3, 18, -8 + i * 3.4, 21); c.stroke(); } c.lineCap = 'butt';
  c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(-8, -8, 1.8, 5, 0.1, 0, 7); c.fill();
}
