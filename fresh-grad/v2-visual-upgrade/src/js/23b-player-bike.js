/* ---------- the player on a bike, with an umbrella in the rain ---------- */
function drawBike(c, x, y, col, face, ph) {
  const f = face || 1;
  c.fillStyle = 'rgba(6,10,22,.28)'; c.beginPath(); c.ellipse(x, y + 1, 17, 3.2, 0, 0, 7); c.fill();
  c.strokeStyle = '#1d2129'; c.lineWidth = 2;
  c.beginPath(); c.arc(x - 10, y - 6, 6.5, 0, 7); c.stroke(); c.beginPath(); c.arc(x + 10, y - 6, 6.5, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(200,210,220,.5)'; c.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) { const a = ph + i * 2.09; [-10, 10].forEach(wx => { c.beginPath(); c.moveTo(x + wx - Math.cos(a) * 6, y - 6 - Math.sin(a) * 6); c.lineTo(x + wx + Math.cos(a) * 6, y - 6 + Math.sin(a) * 6); c.stroke(); }); }
  c.strokeStyle = col; c.lineWidth = 2.4; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - 10, y - 6); c.lineTo(x - 2, y - 6); c.lineTo(x + 5 * f, y - 15); c.lineTo(x - 5 * f, y - 15); c.lineTo(x - 2, y - 6);
  c.moveTo(x - 10, y - 6); c.lineTo(x - 5 * f, y - 15); c.moveTo(x + 10 * f, y - 6); c.lineTo(x + 7 * f, y - 18); c.stroke();
  c.lineJoin = 'miter';
  c.fillStyle = '#1d2129'; c.fillRect(x - 6 * f - 3, y - 17, 6, 2); c.fillRect(x + 5 * f, y - 19.5, 5 * f, 1.8);
  // pedals turn
  c.strokeStyle = '#3a414a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 2 - Math.cos(ph) * 3.5, y - 6 - Math.sin(ph) * 3.5); c.lineTo(x - 2 + Math.cos(ph) * 3.5, y - 6 + Math.sin(ph) * 3.5); c.stroke();
}
function drawUmbrella(c, x, y) {
  const top = y - 58;
  c.strokeStyle = '#2b2f36'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 6, top + 4); c.lineTo(x + 6, y - 22); c.stroke();
  c.fillStyle = 'rgba(6,10,22,.15)'; c.beginPath(); c.ellipse(x + 6, y + 2, 16, 4, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(x - 14, top, x + 26, top); g.addColorStop(0, '#2a6f97'); g.addColorStop(0.5, '#3d8fc0'); g.addColorStop(1, '#245d80');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - 14, top + 8); c.quadraticCurveTo(x + 6, top - 12, x + 26, top + 8);
  for (let i = 3; i >= 0; i--) c.quadraticCurveTo(x - 14 + i * 10 + 5, top + 4, x - 14 + i * 10, top + 8);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x - 8, top + 4); c.quadraticCurveTo(x + 2, top - 6, x + 8, top - 4); c.lineTo(x + 2, top + 2); c.closePath(); c.fill();
}
function drawPlayerTown(c) {
  const ride = ridingBike() && !FX.demo, look = Object.assign({}, PLAYER_LOOK, { face: S.face, phase: G.phase || 0, moving: !!G.moving });
  if (ride) {
    G.pedal = (G.pedal || 0) + (G.moving ? 0.3 : 0);
    drawBike(c, S.px, S.py, S.own.bike ? S.own.bikeCol : '#9aa7ad', S.face, G.pedal);
    look.moving = false; look.me = false;
    c.save(); c.translate(0, -9); drawPerson(c, S.px, S.py, look); c.restore();
    c.strokeStyle = 'rgba(255,194,71,.8)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(S.px, S.py + 1, 19, 6, 0, 0, 7); c.stroke();
  } else drawPerson(c, S.px, S.py, look);
  if (S.own.umbrella && FX.A && FX.A.rain > 0.25) drawUmbrella(c, S.px, S.py - (ride ? 9 : 0));
}

