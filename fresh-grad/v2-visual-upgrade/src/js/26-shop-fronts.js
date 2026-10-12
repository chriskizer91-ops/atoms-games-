/* ============================ every shop on the street opens its doors ============================ */
const PLACES = {
  pharmacy: { deco: 'Pharmacy', name: 'Main Street Pharmacy', hours: [8, 22], col: '#2f9d6a', icon: 'pill' },
  bank: { deco: 'First Bank', name: 'First Bank', hours: [8, 19], closed: [0], col: '#2a6f97', icon: 'dollar' },
  books: { deco: 'Bookshop', name: 'Dog-Ear Books', hours: [9, 21], col: '#8a5a3c', icon: 'book' },
  bakery: { deco: 'Bakery', name: 'Rise & Shine Bakery', hours: [6, 18], col: '#d08a3a', icon: 'bread' },
  hardware: { deco: 'Hardware', name: 'Hank\'s Hardware', hours: [8, 20], col: '#c0392b', icon: 'hammer' },
  cinema: { deco: 'Cinema', name: 'Starlight Cinema', hours: [11, 24], col: '#7a1f33', icon: 'film' },
  salon: { deco: 'Salon', name: 'Bianca\'s Salon', hours: [9, 20], closed: [1], col: '#c05d8a', icon: 'scissors' },
  laundry: { deco: 'Laundromat', name: 'Suds Laundromat', hours: [6, 24], col: '#2a9d8f', icon: 'washer' },
  bikes: { deco: 'Bike Shop', name: 'Spoke & Sprocket Bikes', hours: [9, 19], col: '#e76f51', icon: 'bike' },
  cafe: { deco: 'Cafe Luna', name: 'Cafe Luna', hours: [7, 21], col: '#3d5a80', icon: 'cup' },
  pizza: { deco: 'Pizza Place', name: 'Sal\'s Pizza Place', hours: [11, 25], col: '#2f7d4f', icon: 'pizza' },
  dentist: { deco: 'Dentist', name: 'Bright Smile Dental', hours: [9, 19], closed: [0], col: '#3aa6b9', icon: 'tooth' }
};
const PLACE_ICON = {
  apartment: ['#e07a5f', 'home'], work: ['#4f8fe0', 'brief'], grocery: ['#3fbf7a', 'basket'], diner: ['#e8505b', 'plate'], clinic: ['#d63b4b', 'cross'], park: ['#2f7d4f', 'tree']
};
Object.keys(PLACES).forEach(id => {
  const P = PLACES[id];
  const b = DECO.find(d => d.name === P.deco);
  if (!b) return;
  b.place = id; P.b = b;
  DOORS[id] = { x: b.x + b.w / 2, y: b.y + b.h + 14 };
  ENTERABLE.push(id);
  NEAR_NAME[id] = P.name;
  HOURS[id] = P.hours;
  if (P.closed) CLOSED_DOW[id] = P.closed;
  PLACE_ICON[id] = [P.col, P.icon];
});
function hoursText(id) {
  const H = HOURS[id]; if (!H) return '';
  const end = H[1] >= 24 ? (H[1] === 24 ? 'midnight' : clockStr((H[1] - 24) * 60)) : clockStr(H[1] * 60);
  let s = 'Open ' + clockStr(H[0] * 60).replace(':00', '') + ' to ' + end.replace(':00', '');
  const cd = CLOSED_DOW[id];
  if (cd) s += ', closed ' + cd.map(i => DOW_LONG[i] + 's').join(' and ');
  return s + '.';
}

/* ---------- little icons for signs, the minimap and the passport ---------- */
function placeIcon(c, kind, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
  const P = () => c.beginPath();
  switch (kind) {
    case 'home': P(); c.moveTo(-8, -1); c.lineTo(0, -8); c.lineTo(8, -1); c.moveTo(-6, -3); c.lineTo(-6, 7); c.lineTo(6, 7); c.lineTo(6, -3); c.stroke(); c.fillRect(-1.6, 2, 3.2, 5); break;
    case 'brief': P(); rr(c, -8, -4, 16, 11, 2); c.stroke(); P(); c.moveTo(-3, -4); c.lineTo(-3, -7); c.lineTo(3, -7); c.lineTo(3, -4); c.stroke(); c.fillRect(-8, 0, 16, 1.6); break;
    case 'basket': P(); c.moveTo(-8, -2); c.lineTo(8, -2); c.lineTo(6, 7); c.lineTo(-6, 7); c.closePath(); c.stroke(); P(); c.moveTo(-5, -2); c.quadraticCurveTo(0, -11, 5, -2); c.stroke(); break;
    case 'plate': P(); c.arc(1.5, 0, 6.5, 0, 7); c.stroke(); P(); c.moveTo(-8, -7); c.lineTo(-8, 7); c.stroke(); P(); c.arc(1.5, 0, 2.5, 0, 7); c.fill(); break;
    case 'cross': c.fillRect(-2.5, -8, 5, 16); c.fillRect(-8, -2.5, 16, 5); break;
    case 'tree': P(); c.arc(0, -2.5, 6, 0, 7); c.fill(); c.fillRect(-1.3, 2, 2.6, 6); break;
    case 'pill': c.rotate(-0.7); P(); rr(c, -8, -3.6, 16, 7.2, 3.6); c.stroke(); P(); c.moveTo(0, -3.6); c.lineTo(0, 3.6); c.stroke(); c.fillRect(0, -2.6, 6.8, 5.2); break;
    case 'dollar': c.font = '800 17px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 0, 1); break;
    case 'book': P(); c.moveTo(0, -5); c.quadraticCurveTo(-4, -8, -8, -6); c.lineTo(-8, 6); c.quadraticCurveTo(-4, 4, 0, 7); c.quadraticCurveTo(4, 4, 8, 6); c.lineTo(8, -6); c.quadraticCurveTo(4, -8, 0, -5); c.lineTo(0, 7); c.stroke(); break;
    case 'bread': P(); c.moveTo(-8, 3); c.quadraticCurveTo(0, -11, 8, 3); c.quadraticCurveTo(0, 0, -8, 3); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; [-3, 0.5, 4].forEach(v => { P(); c.moveTo(v - 1, -3); c.lineTo(v + 1, 1); c.stroke(); }); break;
    case 'hammer': c.rotate(0.6); c.fillRect(-1.2, -3, 2.4, 12); P(); rr(c, -7, -8, 14, 5, 1.5); c.fill(); break;
    case 'film': P(); rr(c, -8, -6, 16, 12, 2); c.stroke(); for (let i = -1; i <= 1; i++) { c.fillRect(-5 + (i + 1) * 4.2, -4.5, 2, 2); c.fillRect(-5 + (i + 1) * 4.2, 2.5, 2, 2); } break;
    case 'scissors': P(); c.arc(-4, 5, 3, 0, 7); c.stroke(); P(); c.arc(4, 5, 3, 0, 7); c.stroke(); P(); c.moveTo(-2.5, 2.5); c.lineTo(5, -8); c.moveTo(2.5, 2.5); c.lineTo(-5, -8); c.stroke(); break;
    case 'washer': P(); rr(c, -7, -8, 14, 16, 2); c.stroke(); P(); c.arc(0, 1.5, 4, 0, 7); c.stroke(); c.fillRect(-5, -6, 3, 1.6); break;
    case 'bike': P(); c.arc(-5, 3, 4, 0, 7); c.stroke(); P(); c.arc(5, 3, 4, 0, 7); c.stroke(); P(); c.moveTo(-5, 3); c.lineTo(-1, -4); c.lineTo(4, -4); c.lineTo(5, 3); c.moveTo(-1, -4); c.lineTo(0, 3); c.lineTo(-5, 3); c.moveTo(4, -4); c.lineTo(3, -7); c.stroke(); break;
    case 'cup': P(); c.moveTo(-7, -3); c.lineTo(5, -3); c.lineTo(4, 7); c.lineTo(-6, 7); c.closePath(); c.fill(); P(); c.arc(6, 1.5, 3, -1.4, 1.4); c.stroke(); P(); c.moveTo(-3, -6); c.quadraticCurveTo(-5, -8, -3, -10); c.moveTo(1, -6); c.quadraticCurveTo(-1, -8, 1, -10); c.stroke(); break;
    case 'pizza': P(); c.moveTo(-8, -6); c.quadraticCurveTo(0, -10, 8, -6); c.lineTo(0, 8); c.closePath(); c.stroke(); [[-3, -4], [2.5, -3.5], [0, 1]].forEach(p => { P(); c.arc(p[0], p[1], 1.5, 0, 7); c.fill(); }); break;
    case 'tooth': P(); c.moveTo(-7, -4); c.quadraticCurveTo(-7, -9, -2, -8); c.quadraticCurveTo(0, -7, 2, -8); c.quadraticCurveTo(7, -9, 7, -4); c.quadraticCurveTo(6, 1, 4.5, 8); c.quadraticCurveTo(3, 8, 2, 3); c.quadraticCurveTo(0, 1, -2, 3); c.quadraticCurveTo(-3, 8, -4.5, 8); c.quadraticCurveTo(-6, 1, -7, -4); c.fill(); break;
    case 'fish': P(); c.ellipse(-2, 0, 7, 4, 0, 0, 7); c.fill(); P(); c.moveTo(4, 0); c.lineTo(9, -4.5); c.lineTo(9, 4.5); c.closePath(); c.fill(); break;
    case 'note': c.fillRect(1.5, -8, 2, 12); c.fillRect(1.5, -8, 6, 2); P(); c.ellipse(-0.5, 4.5, 3.6, 2.8, -0.4, 0, 7); c.fill(); break;
    default: P(); c.arc(0, 0, 5, 0, 7); c.fill();
  }
  c.restore();
}

/* ---------- storefront details: a round badge, an OPEN sign and the cinema marquee ---------- */
const FILMS = [
  { t: 'Paper Moon Bakery', g: 'Comedy', mood: 22, pal: ['#ffb4a2', '#ffd166', '#e5989b'], lines: ['A baker and a rival baker. Flour everywhere.', 'The whole room laughs at once.', 'A wedding cake falls. On purpose?', 'Everyone leaves smiling.'] },
  { t: 'The Long Fuse', g: 'Action', mood: 18, energy: 4, pal: ['#ff7b00', '#d00000', '#ffba08'], lines: ['A train, a bridge and a ticking clock.', 'Your popcorn hand freezes mid-air.', 'An explosion you can feel in your seat.', 'The hero walks away. Of course.'] },
  { t: 'Seven Quiet Rooms', g: 'Drama', mood: 16, calm: true, pal: ['#5c677d', '#33415c', '#979dac'], lines: ['A family house and one long summer.', 'Someone behind you sniffles.', 'A letter, finally read aloud.', 'You feel lighter, somehow.'] },
  { t: 'Night of the Lantern', g: 'Horror', mood: 14, scary: true, pal: ['#2b2d42', '#8d0801', '#4a4e69'], lines: ['A lantern in a window that should be empty.', 'Do not open that door. They open the door.', 'Half the room screams. You do too.', 'You will be thinking about this tonight.'] },
  { t: 'Small Town, Big Sky', g: 'Romance', mood: 20, pal: ['#f4acb7', '#9d8189', '#ffcad4'], lines: ['Two strangers and one umbrella.', 'A dance at the county fair.', 'A misunderstanding. A long drive.', 'They kiss at the bus stop. Of course they do.'] },
  { t: 'Robo-Pup Returns', g: 'Animated', mood: 24, pal: ['#4cc9f0', '#f72585', '#b5179e'], lines: ['A tiny robot dog gets lost in the city.', 'The kids in row three cheer.', 'Robo-Pup learns to swim. Sort of.', 'You may have teared up. A little.'] },
  { t: 'Orbit Station Nine', g: 'Sci-fi', mood: 19, pal: ['#3a0ca3', '#4361ee', '#4cc9f0'], lines: ['A space station hums in the dark.', 'Something knocks on the hull.', 'Stars stretch into lines.', 'Home, at last, on a blue horizon.'] },
  { t: 'The Pie Detective', g: 'Mystery', mood: 18, pal: ['#bc6c25', '#dda15e', '#606c38'], lines: ['A missing recipe and six suspects.', 'You were sure it was the butler.', 'It was not the butler.', 'The pie was the clue all along.'] },
  { t: 'Kickoff', g: 'Sports', mood: 20, energy: 3, pal: ['#2d6a4f', '#95d5b2', '#ffd60a'], lines: ['A team nobody believes in.', 'Training montage. Great music.', 'The final seconds of the big game.', 'The crowd on screen and in the room goes wild.'] }
];
const SHOWS = [12 * 60, 15 * 60, 18 * 60, 21 * 60];
const filmsToday = () => [0, 1, 2].map(i => FILMS[(S.day * 3 + i * 4) % FILMS.length]);
function filmAt(k) { return filmsToday()[k % 3]; }

/* a round badge hanging over a shop door: cream ring, glossy coloured face, white icon */
function wPaintBadge(g, P) {
  const r = 13;
  g.fillStyle = 'rgba(8,12,28,.3)'; g.beginPath(); g.arc(21.2, 23.2, r + 2.4, 0, 7); g.fill();
  g.strokeStyle = '#2a3036'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(20, 1); g.lineTo(20, 5.4); g.stroke();
  const rg = g.createLinearGradient(6, 6, 34, 34); rg.addColorStop(0, '#fffaf0'); rg.addColorStop(1, '#cfc6b2');
  g.fillStyle = rg; g.beginPath(); g.arc(20, 22, r + 2, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.8; g.beginPath(); g.arc(20, 22, r + 1.6, 0, 7); g.stroke();
  const dg = g.createRadialGradient(15, 16, 1, 20, 22, r); dg.addColorStop(0, shade(P.col, 0.28)); dg.addColorStop(0.6, P.col); dg.addColorStop(1, shade(P.col, -0.3));
  g.fillStyle = dg; g.beginPath(); g.arc(20, 22, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.9; g.beginPath(); g.arc(20, 22, r - 1.8, 0, 7); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(20, 22, r * 0.92, Math.PI * 1.05, Math.PI * 1.75); g.lineTo(17, 18); g.fill();
  g.save(); g.translate(0.8, 1); placeIcon(g, P.icon, 20, 22, 0.85, 'rgba(0,0,0,.3)'); g.restore();
  placeIcon(g, P.icon, 20, 22, 0.85, '#fff');
  [[20, 8.6], [20, 35.4], [6.6, 22], [33.4, 22]].forEach(p => { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(p[0] + 0.3, p[1] + 0.4, 0.9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(p[0], p[1], 0.7, 0, 7); g.fill(); });
}
function wPaintOpenSign(g, open) {
  g.strokeStyle = '#2a3036'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(11, 0); g.lineTo(15, 5); g.lineTo(19, 0); g.moveTo(25, 0); g.lineTo(29, 5); g.lineTo(33, 0); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.34)'; rr(g, 4.4, 8, 31, 13, 3.4); g.fill();
  const bg = g.createLinearGradient(0, 6, 0, 19); bg.addColorStop(0, '#2a2430'); bg.addColorStop(1, '#14101a');
  g.fillStyle = bg; rr(g, 4, 6, 31, 13, 3.4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 0.8; rr(g, 4.4, 6.4, 30.2, 12.2, 3); g.stroke();
  if (open) { g.strokeStyle = 'rgba(255,90,110,.28)'; g.lineWidth = 3.4; rr(g, 6.6, 8.6, 26.4, 7.8, 2); g.stroke(); g.strokeStyle = 'rgba(255,120,138,.85)'; g.lineWidth = 1; rr(g, 6.6, 8.6, 26.4, 7.8, 2); g.stroke(); }
  g.font = '800 7.5px "DM Sans","Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (open) { g.strokeStyle = 'rgba(255,90,110,.4)'; g.lineWidth = 2.6; g.lineJoin = 'round'; g.strokeText('OPEN', 19.5, 12.8); }
  g.fillStyle = open ? '#ff7a8a' : '#6b7280'; g.fillText(open ? 'OPEN' : 'CLOSED', 19.5, 12.8);
  if (open) { g.fillStyle = '#ffd0d6'; g.fillText('OPEN', 19.5, 12.5); }
}
function wPaintPoster(g, ff, genre) {
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(2.4, 4, 24, 38);
  const fg = g.createLinearGradient(0, 2, 0, 40); fg.addColorStop(0, '#f0c84a'); fg.addColorStop(1, '#a8780f'); g.fillStyle = fg; g.fillRect(1, 2, 24, 38);
  const pg = g.createLinearGradient(0, 4, 0, 38); pg.addColorStop(0, ff.pal[0]); pg.addColorStop(1, ff.pal[1]); g.fillStyle = pg; g.fillRect(3, 4, 20, 34);
  g.save(); g.beginPath(); g.rect(3, 4, 20, 34); g.clip();
  g.fillStyle = 'rgba(0,0,0,.35)';
  if (genre === 'Action') { g.fillStyle = ff.pal[2]; g.beginPath(); g.arc(13, 18, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(13, 18, 3, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(3, 24, 20, 3); }
  else if (genre === 'Horror') { g.fillStyle = '#e8e2c8'; g.beginPath(); g.arc(17, 12, 4.4, 0, 7); g.fill(); g.fillStyle = '#12080c'; g.beginPath(); g.moveTo(3, 26); g.lineTo(8, 19); g.lineTo(13, 24); g.lineTo(18, 17); g.lineTo(23, 26); g.lineTo(23, 30); g.lineTo(3, 30); g.fill(); g.fillRect(11, 21, 3, 5); }
  else if (genre === 'Romance') { g.fillStyle = 'rgba(255,255,255,.85)'; [[9, 15, 3], [16, 20, 4]].forEach(h => { g.beginPath(); g.arc(h[0] - h[2] * 0.5, h[1], h[2] * 0.6, 0, 7); g.arc(h[0] + h[2] * 0.5, h[1], h[2] * 0.6, 0, 7); g.moveTo(h[0] - h[2], h[1] + 1); g.lineTo(h[0], h[1] + h[2] * 1.4); g.lineTo(h[0] + h[2], h[1] + 1); g.fill(); }); }
  else if (genre === 'Animated') { g.fillStyle = '#e9f2f6'; rr(g, 7, 11, 12, 10, 2.4); g.fill(); g.fillStyle = '#1a1e24'; g.fillRect(9.4, 14, 2.6, 2.6); g.fillRect(14, 14, 2.6, 2.6); g.fillStyle = ff.pal[1]; g.fillRect(10, 18.6, 6, 1.2); g.fillStyle = '#e9f2f6'; g.fillRect(12.4, 8, 1.4, 3); g.beginPath(); g.arc(13, 7.6, 1.4, 0, 7); g.fill(); }
  else if (genre === 'Sci-fi') { g.fillStyle = ff.pal[2]; g.beginPath(); g.arc(13, 17, 6, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(13, 17, 10, 2.6, -0.4, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) g.fillRect(4 + i * 3.4, 6 + (i % 3) * 2, 1, 1); }
  else if (genre === 'Mystery') { g.strokeStyle = '#f6f1e7'; g.lineWidth = 1.6; g.beginPath(); g.arc(12, 16, 5, 0, 7); g.moveTo(15.6, 19.6); g.lineTo(20, 24); g.stroke(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(12, 16, 4, 0, 7); g.fill(); }
  else if (genre === 'Sports') { g.fillStyle = '#f6f1e7'; g.beginPath(); g.arc(13, 18, 6, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(7, 18); g.lineTo(19, 18); g.moveTo(13, 12); g.lineTo(13, 24); g.stroke(); g.fillStyle = ff.pal[0]; g.fillRect(3, 28, 20, 4); }
  else { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(9, 17, 4.2, 0, 7); g.arc(17, 19, 4.2, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(7.4, 16, 1.2, 1.2); g.fillRect(10.4, 16, 1.2, 1.2); g.fillRect(15.4, 18, 1.2, 1.2); g.fillRect(18.4, 18, 1.2, 1.2); g.beginPath(); g.arc(9, 19.4, 1.6, 0, Math.PI); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.82)'; g.fillRect(6, 31, 14, 2); g.fillRect(8, 34.4, 10, 1.4);
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(3, 4); g.lineTo(11, 4); g.lineTo(3, 20); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 0.8; g.strokeRect(1.4, 2.4, 23.2, 37.2);
}
function wPaintMarquee(g, mw) {
  g.fillStyle = 'rgba(8,6,16,.3)'; rr(g, 3, 8, mw + 4, 36, 5); g.fill();
  const cg = g.createLinearGradient(0, 4, 0, 40); cg.addColorStop(0, '#8a1f38'); cg.addColorStop(0.5, '#5c1526'); cg.addColorStop(1, '#3a0c18');
  g.fillStyle = cg; rr(g, 4, 4, mw, 34, 4); g.fill();
  g.strokeStyle = '#e0b84a'; g.lineWidth = 1.6; rr(g, 4.8, 4.8, mw - 1.6, 32.4, 3.4); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.8; rr(g, 6.4, 6.4, mw - 4.8, 29.2, 2.4); g.stroke();
  // letterboard with track lines
  g.fillStyle = '#1a1018'; g.fillRect(10.4, 10.4, mw - 12.8, 22.4);
  const bg = g.createLinearGradient(0, 11, 0, 32); bg.addColorStop(0, '#fffaf0'); bg.addColorStop(1, '#ebe1cc'); g.fillStyle = bg; g.fillRect(11, 11, mw - 14, 21);
  g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(11, 11, mw - 14, 2.6); g.strokeStyle = 'rgba(120,100,70,.28)'; g.lineWidth = 0.6; for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(11, 11 + k * 7); g.lineTo(mw - 3, 11 + k * 7); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(11, 31.2, mw - 14, 0.9);
  g.fillStyle = '#e0b84a'; [4, mw + 4].forEach(x => { g.beginPath(); g.moveTo(x, 21); g.lineTo(x + (x < 10 ? -4 : 4), 18); g.lineTo(x + (x < 10 ? -4 : 4), 24); g.fill(); });
}
function placeFacade(c, b) {
  const P = PLACES[b.place]; if (!P) return;
  const shop = b.style === 'shop', cx = b.x + b.w / 2, bot = b.y + b.h;
  const open = !S || isOpen(b.place), night = FX.nf > 0.05;
  if (b.place === 'cinema') {
    // a marquee with chasing bulbs
    const mw = Math.min(150, b.w - 30), mx = cx - mw / 2, my = bot - 100;
    const ms = wspr('mq' + Math.round(mw), mw + 8, 46, g => wPaintMarquee(g, Math.round(mw)));
    c.drawImage(ms.cv, mx - 4, my - 4, ms.w, ms.h);
    const f = S ? filmAt(Math.max(0, SHOWS.findIndex(s => s + 120 > S.t))) : FILMS[0];
    c.font = '800 9px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1a1420';
    let title = f.t.toUpperCase(); while (c.measureText(title).width > mw - 20 && title.length > 4) title = title.slice(0, -2) + '…';
    c.fillText(open ? title : 'CLOSED · OPENS 11 AM', cx, my + 17.5);
    const n = Math.floor(mw / 8), tick = Math.floor((FX.time || 0) * 6);
    for (let i = 0; i < n; i++) {
      const on = open && (i + tick) % 3 !== 0, bx = mx + 4 + i * (mw - 8) / (n - 1);
      for (let k = 0; k < 2; k++) {
        const by = k ? my + 31.5 : my + 2.5;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(bx, by + 0.5, 2.2, 0, 7); c.fill();
        c.fillStyle = on ? '#fff0b8' : '#8a6a3a'; c.beginPath(); c.arc(bx, by, 1.7, 0, 7); c.fill();
        if (on) { c.fillStyle = 'rgba(255,230,150,.35)'; c.beginPath(); c.arc(bx, by, 3.2, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(bx - 0.5, by - 0.5, 0.5, 0, 7); c.fill();
      }
    }
    if (open && night) { litRect(mx, my, mw, 34); addEmit(cx, my + 17, mw * 0.7, 5, 0.5); addLight(cx, bot + 10, 110, 60, 5, 0.6); }
    // two posters by the door
    [cx - 64, cx + 44].forEach((px, i) => {
      const ff = S ? filmsToday()[i + 1] : FILMS[i + 1];
      const ps = wspr('po' + ff.t, 28, 44, g => wPaintPoster(g, ff, ff.g));
      c.drawImage(ps.cv, px - 3, bot - 58, ps.w, ps.h);
      if (night) litRect(px, bot - 54, 20, 34);
    });
  } else {
    // a round badge over the door
    const by = shop ? bot - 69 : bot - 76;
    const bs = wspr('bd' + b.place, 40, 44, g => wPaintBadge(g, P));
    c.drawImage(bs.cv, cx - 20, by - 22, bs.w, bs.h);
    if (night && open) { addEmit(cx, by, 30, 0, 0.35); }
  }
  // an OPEN sign in the window or beside the door (the cinema has its marquee instead)
  if (b.place === 'cinema') return;
  const sx = shop ? cx + 44 + Math.min(18, b.w / 2 - 70) : cx + 58, sy = shop ? bot - 46 : bot - 40;
  const os = wspr('op' + (open ? 1 : 0), 40, 26, g => wPaintOpenSign(g, open));
  c.drawImage(os.cv, sx - 19.5, sy - 12.5, os.w, os.h);
  if (open && night) addEmit(sx, sy, 22, 2, 0.5);
}

