/* people */
function lookStyle(o) {
  if (o.style != null) return o.style;
  const a = o.shirt || '#000000', b = o.hair || '#000000';
  return (a.charCodeAt(1) + a.charCodeAt(3) * 3 + b.charCodeAt(2) * 5 + b.charCodeAt(5)) % 5;
}
function drawPerson(c, x, y, o) {
  const s = o.s || 1, mv = !!o.moving, ph = o.phase || 0, face = o.face || 1;
  const st = mv ? Math.sin(ph) : 0;
  const bob = mv ? Math.abs(Math.cos(ph)) * 1.5 * s : (REDUCED ? 0 : Math.sin(FX.time * 2.1 + x * 0.07) * 0.35 * s);
  const style = lookStyle(o);
  c.fillStyle = 'rgba(6,10,22,.3)'; c.beginPath(); c.ellipse(x, y + 1, 8.6 * s, 3 * s, 0, 0, 7); c.fill();
  if (o.me) {
    const pr = 12.5 + (REDUCED ? 0 : Math.sin(FX.time * 3) * 0.9);
    c.strokeStyle = 'rgba(255,194,71,.85)'; c.lineWidth = 1.5 * s;
    c.beginPath(); c.ellipse(x, y + 1, pr * s, pr * 0.42 * s, 0, 0, 7); c.stroke();
  }
  // legs and shoes
  const lA = Math.max(0, st) * 2.6 * s, lB = Math.max(0, -st) * 2.6 * s, sx = st * 1.5 * s * face;
  c.fillStyle = o.pants;
  rr(c, x - 5.6 * s + sx, y - 13.5 * s, 4.8 * s, 12.5 * s - lA, 1.8 * s); c.fill();
  rr(c, x + 0.8 * s - sx, y - 13.5 * s, 4.8 * s, 12.5 * s - lB, 1.8 * s); c.fill();
  c.fillStyle = '#20242c';
  rr(c, x - 6.2 * s + sx + (face > 0 ? 0 : -1.2 * s), y - 2.6 * s - lA, 6.6 * s, 3 * s, 1.4 * s); c.fill();
  rr(c, x + 0.4 * s - sx + (face > 0 ? 0 : -1.2 * s), y - 2.6 * s - lB, 6.6 * s, 3 * s, 1.4 * s); c.fill();
  // torso
  const ty = y - 27.5 * s - bob;
  c.fillStyle = o.shirt; rr(c, x - 7.6 * s, ty, 15.2 * s, 16 * s, 4.6 * s); c.fill();
  c.fillStyle = 'rgba(0,0,0,.14)'; rr(c, x - 7.6 * s, ty + 10.5 * s, 15.2 * s, 5.5 * s, 3 * s); c.fill();
  c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, x - 6 * s, ty + 1 * s, 5 * s, 6 * s, 2.4 * s); c.fill();
  // arms swing against the legs
  const arm = shade(o.shirt, -0.16), aw = st * 3 * s;
  c.strokeStyle = arm; c.lineWidth = 3.5 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 8 * s, ty + 3 * s); c.lineTo(x - 9.4 * s - aw * 0.5 * face, ty + 12 * s - Math.abs(aw) * 0.3); c.stroke();
  c.beginPath(); c.moveTo(x + 8 * s, ty + 3 * s); c.lineTo(x + 9.4 * s + aw * 0.5 * face, ty + 12 * s - Math.abs(aw) * 0.3); c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = o.skin;
  c.beginPath(); c.arc(x - 9.4 * s - aw * 0.5 * face, ty + 13 * s - Math.abs(aw) * 0.3, 1.9 * s, 0, 7); c.fill();
  c.beginPath(); c.arc(x + 9.4 * s + aw * 0.5 * face, ty + 13 * s - Math.abs(aw) * 0.3, 1.9 * s, 0, 7); c.fill();
  // head
  const hy = y - 33.5 * s - bob;
  c.fillRect(x - 2 * s, hy + 4.5 * s, 4 * s, 3 * s);
  c.beginPath(); c.arc(x, hy, 6.7 * s, 0, 7); c.fill();
  c.fillStyle = o.hair;
  if (o.back) {
    c.beginPath(); c.arc(x, hy - 0.4 * s, 7 * s, 0, 7); c.fill();
    if (style === 1 || style === 2) { rr(c, x - 7 * s, hy - 1 * s, 14 * s, 9.5 * s, 3 * s); c.fill(); }
  } else {
    if (style === 3) {
      // a cap
      c.fillStyle = shade(o.shirt, -0.28);
      c.beginPath(); c.arc(x, hy - 1.2 * s, 7 * s, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      c.fillRect(x - 7 * s, hy - 2.6 * s, 14 * s, 2.2 * s);
      rr(c, x + (face > 0 ? 1 : -8.5) * s, hy - 2.6 * s, 7.5 * s, 2.2 * s, 1 * s); c.fill();
    } else {
      c.beginPath(); c.arc(x, hy - 1.3 * s, 7 * s, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      c.fillRect(x - 7 * s, hy - 2.4 * s, 2.3 * s, 4.2 * s); c.fillRect(x + 4.7 * s, hy - 2.4 * s, 2.3 * s, 4.2 * s);
      if (style === 1) { rr(c, x - 7.6 * s, hy - 2 * s, 3.2 * s, 10 * s, 1.5 * s); c.fill(); rr(c, x + 4.4 * s, hy - 2 * s, 3.2 * s, 10 * s, 1.5 * s); c.fill(); }
      else if (style === 2) { c.beginPath(); c.arc(x - face * 1.5 * s, hy - 8.3 * s, 3.3 * s, 0, 7); c.fill(); }
      else if (style === 4) { c.beginPath(); c.arc(x - face * 2 * s, hy - 5.6 * s, 3.6 * s, 0, 7); c.arc(x + face * 2.6 * s, hy - 6 * s, 3 * s, 0, 7); c.fill(); }
    }
    const blink = !REDUCED && ((FX.time * 0.31 + x * 0.013 + (o.pants ? o.pants.charCodeAt(2) : 0) * 0.07) % 1) > 0.965;
    c.fillStyle = '#1a1c22';
    if (blink) { c.fillRect(x - 3.2 * s + face * 1.4 * s, hy + 0.2 * s, 2.2 * s, 0.8 * s); c.fillRect(x + 1 * s + face * 1.4 * s, hy + 0.2 * s, 2.2 * s, 0.8 * s); }
    else {
      c.beginPath(); c.arc(x - 2.1 * s + face * 1.4 * s, hy + 0.3 * s, 1.05 * s, 0, 7); c.arc(x + 2.1 * s + face * 1.4 * s, hy + 0.3 * s, 1.05 * s, 0, 7); c.fill();
    }
    c.fillStyle = 'rgba(210,90,80,.22)';
    c.beginPath(); c.arc(x - 3.7 * s + face * 1.2 * s, hy + 2.5 * s, 1.5 * s, 0, 7); c.arc(x + 3.7 * s + face * 1.2 * s, hy + 2.5 * s, 1.5 * s, 0, 7); c.fill();
  }
}
