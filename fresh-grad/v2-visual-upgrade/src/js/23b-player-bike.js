/* ---------- the player on a bike, with an umbrella in the rain ---------- */
/* a bicycle seen from the side: fenders, frame tubes, turning spokes, chain and crank, saddle, bars and a lamp.
   x, y is the point on the ground between the wheels (footprint as before); `face` is the way it points; `ph` turns wheels and cranks. */
function drawBike(c, x, y, col, face, ph) {
  const f = face || 1, tire = '#171a20', rim = '#c9d1d8', tm = FX.time;
  const dk = shade(col, -0.32), lt = shade(col, 0.38), turn = (ph || 0);
  // soft ground shadow
  c.fillStyle = 'rgba(6,10,22,.14)'; c.beginPath(); c.ellipse(x + 1, y + 1.4, 19, 4, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(6,10,22,.26)'; c.beginPath(); c.ellipse(x, y + 1, 15, 2.6, 0, 0, 7); c.fill();
  const wheel = wx => {
    // tyre, rim, spokes
    c.strokeStyle = tire; c.lineWidth = 2.3; c.beginPath(); c.arc(wx, y - 6, 6.4, 0, 7); c.stroke();
    c.strokeStyle = rim; c.lineWidth = 0.7; c.beginPath(); c.arc(wx, y - 6, 5.2, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(205,214,222,.55)'; c.lineWidth = 0.5; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = turn * 1.2 + i * 0.7854; c.moveTo(wx, y - 6); c.lineTo(wx + Math.cos(a) * 5.2, y - 6 + Math.sin(a) * 5.2); }
    c.stroke();
    c.fillStyle = '#5a636c'; c.beginPath(); c.arc(wx, y - 6, 1.1, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.6; c.beginPath(); c.arc(wx, y - 6, 7, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  };
  wheel(x - 10 * f); wheel(x + 10 * f);
  const rx = x - 10 * f, fx = x + 10 * f, bx = x - 2 * f, by = y - 6, stx = x - 5 * f, sty = y - 14.6, htx = x + 6.2 * f;
  // fenders over both wheels
  c.strokeStyle = dk; c.lineWidth = 1.3; c.lineCap = 'round';
  c.beginPath(); c.arc(rx, y - 6, 7.8, Math.PI * (f > 0 ? 1.08 : 1.05), Math.PI * (f > 0 ? 1.95 : 1.92)); c.stroke(); c.beginPath(); c.arc(fx, y - 6, 7.8, Math.PI * (f > 0 ? 1.05 : 1.08), Math.PI * (f > 0 ? 1.92 : 1.95)); c.stroke();
  // chain, between the chainring and the rear sprocket
  c.strokeStyle = 'rgba(30,34,40,.85)'; c.lineWidth = 0.8; c.setLineDash && c.setLineDash([1.2, 1]); c.lineDashOffset = -turn * 3;
  c.beginPath(); c.moveTo(bx, by - 2.6); c.lineTo(rx, by - 2.2); c.moveTo(bx, by + 2.6); c.lineTo(rx, by + 2.2); c.stroke(); c.setLineDash && c.setLineDash([]);
  // frame: tubes with a lit edge
  c.lineJoin = 'round';
  const tube = (pts, w, colr) => { c.strokeStyle = colr; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
  tube([rx, by, bx, by, htx, y - 14, stx, sty, bx, by], 2.5, col); tube([rx, by, stx, sty], 2.2, col); tube([htx, y - 15.2, stx, sty], 2.2, col); tube([fx, by, x + 7.2 * f, y - 18.4], 2.2, dk);
  c.globalAlpha = 0.7; tube([bx, by - 0.9, htx, y - 14.9, stx, sty - 0.9], 0.8, lt); c.globalAlpha = 1;
  c.fillStyle = '#2b3138'; c.beginPath(); c.arc(bx, by, 1.7, 0, 7); c.fill();
  // cranks and pedals turn
  const an = turn * f, px = Math.cos(an) * 3.2, py = Math.sin(an) * 3.2;
  c.strokeStyle = '#3a414a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx - px, by - py); c.lineTo(bx + px, by + py); c.stroke();
  c.fillStyle = '#1d2129'; c.fillRect(bx + px - 1.8, by + py - 0.5, 3.6, 1.2); c.fillRect(bx - px - 1.8, by - py - 0.5, 3.6, 1.2);
  // saddle and post, handlebar stem, grips and a brake lever
  c.strokeStyle = '#2b3138'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(stx, sty); c.lineTo(stx - 0.3 * f, sty - 2.4); c.stroke();
  c.fillStyle = '#4a2f20'; c.beginPath(); c.moveTo(stx - 3.6 * f, sty - 2.4); c.quadraticCurveTo(stx, sty - 4, stx + 3.8 * f, sty - 2.6); c.lineTo(stx + 3.8 * f, sty - 1.6); c.lineTo(stx - 3.6 * f, sty - 1.6); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(Math.min(stx - 2.6 * f, stx + 1.4 * f), sty - 3, 4, 0.7);
  c.strokeStyle = '#2b3138'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 7.2 * f, y - 18.4); c.lineTo(x + 7.8 * f, y - 20.6); c.lineTo(x + 11.2 * f, y - 20.4); c.stroke();
  c.fillStyle = '#16191e'; c.fillRect(Math.min(x + 9.2 * f, x + 12.6 * f), y - 21.2, 3.4, 1.6);
  c.strokeStyle = '#8a929a'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + 10.6 * f, y - 20.4); c.lineTo(x + 12.2 * f, y - 18.6); c.stroke();
  // a little headlamp
  const lampOn = FX.nf > 0.05;
  c.fillStyle = lampOn ? '#fff4c2' : '#d8dde0'; c.beginPath(); c.arc(x + 12.8 * f, y - 16.8, 1.5, 0, 7); c.fill();
  if (lampOn && !FX.demo) addEmit(x + 12.8 * f, y - 16.8, 9, 0, 0.45);
  c.lineJoin = 'miter'; c.lineCap = 'butt';
}
/* an umbrella: eight ribs, scalloped panels, beads of water and drips from the tips */
function drawUmbrella(c, x, y) {
  const top = y - 58, cx = x + 6, ye = top + 8, R = 20, tm = REDUCED ? 0 : FX.time;
  c.fillStyle = 'rgba(6,10,22,.13)'; c.beginPath(); c.ellipse(cx, y + 2, 17, 4.4, 0, 0, 7); c.fill();
  // pole with a curved wooden handle
  c.strokeStyle = '#2b2f36'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, top + 4); c.lineTo(cx, y - 22); c.stroke();
  c.strokeStyle = '#6a4630'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, y - 24); c.lineTo(cx, y - 21); c.arc(cx + 2, y - 21, 2, Math.PI, Math.PI * 0.2, true); c.stroke(); c.lineCap = 'butt';
  // under-surface seen at the rim, then the panels
  c.fillStyle = '#16384f'; c.beginPath(); c.ellipse(cx, ye + 0.5, R, 3, 0, 0, Math.PI); c.fill();
  const pts = []; for (let i = 0; i <= 8; i++) pts.push(cx - R + i * (R * 2 / 8));
  for (let i = 0; i < 8; i++) {
    const a = pts[i], b = pts[i + 1], mid = (a + b) / 2;
    c.fillStyle = i % 2 ? '#2f7fb0' : '#3a8fc2';
    c.beginPath(); c.moveTo(cx, top - 4); c.quadraticCurveTo(a + (cx - a) * 0.25, top + 1, a, ye); c.quadraticCurveTo(mid, ye - 3.4, b, ye); c.quadraticCurveTo(b + (cx - b) * 0.25, top + 1, cx, top - 4); c.closePath(); c.fill();
  }
  // shading: light from the left, a core shadow on the right, a glossy streak
  const sg = c.createLinearGradient(cx - R, 0, cx + R, 0); sg.addColorStop(0, 'rgba(255,255,255,.2)'); sg.addColorStop(0.45, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(8,24,44,.36)');
  c.fillStyle = sg; c.beginPath(); c.moveTo(cx, top - 4); c.quadraticCurveTo(cx - R * 0.9, top + 1, cx - R, ye); for (let i = 0; i < 8; i++) c.quadraticCurveTo((pts[i] + pts[i + 1]) / 2, ye - 3.4, pts[i + 1], ye); c.quadraticCurveTo(cx + R * 0.9, top + 1, cx, top - 4); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(8,30,52,.5)'; c.lineWidth = 0.6; c.beginPath(); for (let i = 1; i < 8; i++) { c.moveTo(cx, top - 4); c.quadraticCurveTo(pts[i] + (cx - pts[i]) * 0.25, top + 1, pts[i], ye - 0.5); } c.stroke();
  c.fillStyle = 'rgba(255,255,255,.38)'; c.beginPath(); c.moveTo(cx - 9, top + 2.4); c.quadraticCurveTo(cx - 3, top - 4.6, cx + 2, top - 3.2); c.lineTo(cx - 2, top + 0.6); c.closePath(); c.fill();
  c.fillStyle = '#1d2129'; c.beginPath(); c.moveTo(cx - 0.8, top - 4); c.lineTo(cx, top - 8); c.lineTo(cx + 0.8, top - 4); c.closePath(); c.fill();
  // beads of water on the canopy and drips off the rim
  c.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 5; i++) { const bx = cx - 12 + hash01(i, 3, 3) * 24, by = top + 2 + hash01(i, 4, 3) * 5; c.beginPath(); c.arc(bx, by, 0.7, 0, 7); c.fill(); }
  for (let i = 0; i < 8; i += 2) {
    const p = REDUCED ? 0.4 : (tm * 1.3 + i * 0.29) % 1, dx = pts[i], dy = ye + p * p * 26;
    c.fillStyle = 'rgba(214,232,255,' + (0.8 * (1 - p * p)).toFixed(2) + ')'; c.beginPath(); c.ellipse(dx, dy, 0.8, 1.4 + p, 0, 0, 7); c.fill();
  }
}
function drawPlayerTown(c) {
  const ride = ridingBike() && !FX.demo, look = Object.assign({}, PLAYER_LOOK, { face: S.face, phase: G.phase || 0, moving: !!G.moving });
  if (ride) {
    G.pedal = (G.pedal || 0) + (G.moving ? 0.3 : 0);
    drawBike(c, S.px, S.py, S.own.bike ? S.own.bikeCol : '#9aa7ad', S.face, G.pedal);
    look.moving = false; look.me = false; look.ride = G.pedal;
    drawPerson(c, S.px, S.py, look);
    // the gold ring, around the whole bike
    const t = REDUCED ? 0 : FX.time, pr = 19 + (REDUCED ? 0 : Math.sin(t * 3) * 0.8);
    c.strokeStyle = 'rgba(255,194,71,.26)'; c.lineWidth = 3.4; c.beginPath(); c.ellipse(S.px, S.py + 1, pr, pr * 0.32, 0, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,205,98,.95)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(S.px, S.py + 1, pr, pr * 0.32, 0, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,238,178,.4)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(S.px, S.py + 1, pr - 3, pr * 0.32 - 1, 0, 0, 7); c.stroke();
  } else drawPerson(c, S.px, S.py, look);
  if (S.own.umbrella && FX.A && FX.A.rain > 0.25) drawUmbrella(c, S.px, S.py + (ride ? 3 : 0));
}

