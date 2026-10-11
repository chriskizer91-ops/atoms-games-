/* people */
function lookStyle(o) {
  if (o.style != null) return o.style;
  const a = o.shirt || '#000000', b = o.hair || '#000000';
  return (a.charCodeAt(1) + a.charCodeAt(3) * 3 + b.charCodeAt(2) * 5 + b.charCodeAt(5)) % 5;
}

// ---- v2 figures -------------------------------------------------------------------------------------------------
// Everything is drawn in a local frame: feet at (0,0), +y down, the figure about 41 units tall, then scaled by `s`.
// The footprint (feet position, ~40 px height, 15 px shoulders) matches the v1 chibi sprite so collision, name tags,
// speech bubbles, click targets and interaction rings keep lining up. Palettes (tints, shades, garment, shoes) are
// worked out once per look and cached.
const PP_PAL = new Map();
// garment by exact shirt colour for the things the clothes shop sells, otherwise picked from the colour so a person
// always wears the same thing: 0 tee, 1 button-down, 2 sweater, 3 polo, 5 flannel
const PP_GARM = { '#ff7a59': 0, '#2a9d8f': 0, '#3d5a80': 1, '#e9c46a': 2, '#f6f1e7': 1, '#7b6fd0': 3, '#c0392b': 5, '#2b2f36': 0 };
const PP_SHOES = [['#f3efe6', '#c8c2b4', 0], ['#2c3038', '#9aa1a9', '#4a525e'], ['#7a5236', '#2a1c12', '#9a6c46'], ['#1e2229', '#6d747d', '#39404a'], ['#c9573f', '#efe8d8', '#f2c65a']];
function ppHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function ppPal(o) {
  const shirt = o.shirt || '#8a8f98', pants = o.pants || '#34495e', hair = o.hair || '#2b2118', skin = o.skin || '#e0ac86';
  const key = shirt + pants + hair + skin;
  let p = PP_PAL.get(key);
  if (p) return p;
  const hs = ppHash(key), hsh = ppHash(shirt), hp = ppHash(pants);
  const sh = PP_SHOES[hp % PP_SHOES.length];
  p = {
    key, shirt, shirtL: shade(shirt, 0.2), shirtLL: shade(shirt, 0.4), shirtD: shade(shirt, -0.2), shirtDD: shade(shirt, -0.38),
    pants, pantsL: shade(pants, 0.22), pantsD: shade(pants, -0.26), pantsDD: shade(pants, -0.45),
    hair, hairL: shade(hair, 0.3), hairLL: shade(hair, 0.55), hairD: shade(hair, -0.32),
    skin, skinL: shade(skin, 0.16), skinD: shade(skin, -0.15), skinDD: shade(skin, -0.34),
    cap: shade(shirt, -0.28), capL: shade(shirt, -0.12), capD: shade(shirt, -0.46),
    garm: PP_GARM[shirt] !== undefined ? PP_GARM[shirt] : [0, 0, 1, 2, 3, 0][hsh % 6],
    pt: hp % 3, shoe: sh, seed: (hs % 1000) / 1000,
    lum: (hexRgb(skin)[0] * 0.3 + hexRgb(skin)[1] * 0.59 + hexRgb(skin)[2] * 0.11) / 255
  };
  if (PP_PAL.size > 600) PP_PAL.clear();
  PP_PAL.set(key, p);
  return p;
}
function ppSeg(c, x0, y0, x1, y1, w, col) {
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}
/* contact shadow that leans away from the sun */
function ppShadow(c, x, y, s, dx, dy) {
  const ox = dx * 1.9 * s, oy = Math.min(1.4, dy * 0.7) * s;
  c.fillStyle = 'rgba(8,12,30,.11)'; c.beginPath(); c.ellipse(x + ox * 1.5, y + 1.1 + oy, 11 * s, 3.9 * s, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(8,12,30,.24)'; c.beginPath(); c.ellipse(x + ox, y + 0.8 + oy * 0.6, 7.4 * s, 2.5 * s, 0, 0, 7); c.fill();
}
/* the player's marigold identification ring */
function ppRing(c, x, y, s) {
  const t = REDUCED ? 0 : FX.time, pr = (12.4 + (REDUCED ? 0 : Math.sin(t * 3) * 0.8)) * s, ry = pr * 0.42, cy = y + 1;
  c.fillStyle = 'rgba(255,194,71,.1)'; c.beginPath(); c.ellipse(x, cy, pr, ry, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,194,71,.28)'; c.lineWidth = 3.4 * s; c.beginPath(); c.ellipse(x, cy, pr, ry, 0, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(255,205,98,.95)'; c.lineWidth = 1.3 * s; c.beginPath(); c.ellipse(x, cy, pr, ry, 0, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(255,238,178,.42)'; c.lineWidth = 0.7 * s; c.beginPath(); c.ellipse(x, cy, pr - 2.8 * s, ry - 1.2 * s, 0, 0, 7); c.stroke();
  c.fillStyle = '#fff3c4';
  for (let i = 0; i < 3; i++) {
    const a = t * 1.5 + i * 2.094;
    c.globalAlpha = 0.55 + 0.4 * Math.sin(a * 2 + 1); c.beginPath(); c.arc(x + Math.cos(a) * pr, cy + Math.sin(a) * ry, 1 * s, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
}
function ppShoe(c, P, ax, gy, f, me) {
  const sh = P.shoe, up = me ? '#f3efe6' : sh[0], so = me ? '#c8c2b4' : sh[1], ac = me ? '#ff7a59' : (sh[2] === 0 ? P.shirt : sh[2]);
  c.fillStyle = up; c.beginPath();
  c.moveTo(ax - 2.9 * f, gy - 3.1); c.lineTo(ax + 0.7 * f, gy - 3.5);
  c.quadraticCurveTo(ax + 4 * f, gy - 3.1, ax + 5.1 * f, gy - 1); c.lineTo(ax + 5.1 * f, gy); c.lineTo(ax - 2.9 * f, gy); c.closePath(); c.fill();
  c.fillStyle = ac; c.beginPath(); c.moveTo(ax + 2.3 * f, gy - 2.7); c.quadraticCurveTo(ax + 4.4 * f, gy - 2.6, ax + 5.1 * f, gy - 1); c.lineTo(ax + 5.1 * f, gy - 0.9); c.lineTo(ax + 2.3 * f, gy - 0.9); c.closePath(); c.fill();
  c.fillStyle = so; c.fillRect(Math.min(ax - 2.9 * f, ax + 5.1 * f), gy - 1, 8, 1);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(ax - 2.5 * f, gy - 2.9); c.lineTo(ax + 0.6 * f, gy - 3.3); c.lineTo(ax + 0.6 * f, gy - 2.8); c.lineTo(ax - 2.5 * f, gy - 2.5); c.closePath(); c.fill();
}
/* a sleeved or bare arm: shoulder -> elbow -> hand */
function ppArm(c, P, sgn, face, mv, ph, back, g, depth, tgt) {
  const sw = mv ? Math.sin(ph + (sgn < 0 ? Math.PI : 0)) : 0;
  const th = sw * 0.42, idle = REDUCED || mv ? 0 : Math.sin(FX.time * 1.9 + P.seed * 6) * 0.05;
  const thu = th * 0.8 + sgn * 0.1 + idle, thf = thu + Math.max(0, th) * 0.55 + 0.1 + (mv ? 0.1 : 0);
  const sx = tgt ? sgn * 5.2 : sgn * 6.9, sy = -26.2;
  let ex = sx + (face * Math.sin(thu) + sgn * 0.12) * 6.2, ey = sy + Math.cos(thu) * 6.2;
  let hx = ex + (face * Math.sin(thf) + sgn * 0.05) * 5.7, hy = ey + Math.cos(thf) * 5.7;
  if (tgt) {
    // reach for a point (the handlebar): two bones, the elbow dropping below the line
    const dx = tgt[0] - sx, dy = tgt[1] - sy, dl = Math.hypot(dx, dy) || 1, d = Math.min(dl, 11.7), ux = dx / dl, uy = dy / dl;
    const a = (6.2 * 6.2 - 5.7 * 5.7 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, 6.2 * 6.2 - a * a));
    let qx = -uy, qy = ux; if (qy < 0) { qx = -qx; qy = -qy; }
    ex = sx + ux * a + qx * hh; ey = sy + uy * a + qy * hh; hx = sx + ux * d; hy = sy + uy * d;
  }
  const long = g === 1 || g === 2 || g === 5, d = depth > 0;
  const sl = d ? P.shirtD : P.shirt, sk = d ? P.skinD : P.skin;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (long) {
    ppSeg(c, sx, sy, ex, ey, 3.7, sl); ppSeg(c, ex, ey, hx, hy, 3.2, sl);
    ppSeg(c, sx - sgn * 0.5, sy, ex - sgn * 0.5, ey, 1, d ? P.shirtDD : P.shirtL);
    // cuff
    const k = 0.78, cx = ex + (hx - ex) * k, cy = ey + (hy - ey) * k;
    ppSeg(c, cx, cy, hx + (ex - hx) * 0.08, hy + (ey - hy) * 0.08, 3.5, g === 2 ? P.shirtDD : (g === 1 ? P.shirtLL : P.shirtD));
    if (g === 2) ppSeg(c, cx, cy, hx, hy, 3.5, P.shirtD);
  } else {
    // short sleeve: sleeve to part-way down the upper arm, then bare arm
    const k = 0.62, mx = sx + (ex - sx) * k, my = sy + (ey - sy) * k;
    ppSeg(c, mx, my, ex, ey, 3, sk); ppSeg(c, ex, ey, hx, hy, 2.7, sk);
    ppSeg(c, sx, sy, mx, my, 3.9, sl);
    ppSeg(c, mx, my, mx + (ex - mx) * 0.2, my + (ey - my) * 0.2, 4, d ? P.shirtDD : P.shirtD);
    ppSeg(c, sx - sgn * 0.55, sy, mx - sgn * 0.55, my, 1, d ? P.shirtDD : P.shirtL);
  }
  // hand
  c.fillStyle = sk; c.beginPath(); c.arc(hx, hy + 0.5, 1.8, 0, 7); c.fill();
  if (!d) { c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(hx - 0.5, hy, 0.8, 0, 7); c.fill(); }
  c.lineCap = 'butt';
}
function ppTorso(c, P, back, g, hemY, lean) {
  const top = -28;
  c.fillStyle = P.shirt; c.beginPath();
  c.moveTo(-7.2, top + 1.6);
  c.quadraticCurveTo(-7.7, top + 0.2, -4.4, top - 0.1); c.lineTo(4.4, top - 0.1);
  c.quadraticCurveTo(7.7, top + 0.2, 7.2, top + 1.6);
  c.quadraticCurveTo(6.9, -21.5, 6.1, -18); c.quadraticCurveTo(6.3, -16, 6.5, hemY);
  c.lineTo(-6.5, hemY); c.quadraticCurveTo(-6.3, -16, -6.1, -18); c.quadraticCurveTo(-6.9, -21.5, -7.2, top + 1.6);
  c.closePath(); c.fill();
  c.save(); c.clip();
  // volume: light side left, core shadow right, waist occlusion
  c.fillStyle = P.shirtL; c.globalAlpha = 0.45; c.beginPath(); c.moveTo(-7.8, top); c.lineTo(-2.2, top); c.quadraticCurveTo(-3.6, -20, -3, hemY); c.lineTo(-7.8, hemY); c.closePath(); c.fill();
  c.fillStyle = P.shirtD; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(7.8, top); c.lineTo(3.3, top); c.quadraticCurveTo(4.4, -20, 3.6, hemY); c.lineTo(7.8, hemY); c.closePath(); c.fill();
  c.globalAlpha = 0.28; c.fillStyle = P.shirtDD; c.fillRect(-8, hemY - 3.2, 16, 3.4);
  // folds
  c.globalAlpha = 0.3; c.strokeStyle = P.shirtDD; c.lineWidth = 0.55;
  c.beginPath(); c.moveTo(-5.4, -23.6); c.quadraticCurveTo(-3.4, -21.4, -4.3, -19.2); c.moveTo(5.2, -22.8); c.quadraticCurveTo(3.4, -20.6, 4.2, -18.2); c.moveTo(-1.5, hemY - 0.5); c.quadraticCurveTo(-0.8, hemY - 3, -2, hemY - 5.4); c.stroke();
  c.globalAlpha = 1;
  if (g === 5) {
    // flannel plaid
    c.globalAlpha = 0.34; c.strokeStyle = P.shirtDD; c.lineWidth = 1.1; c.beginPath();
    for (let xx = -6; xx <= 6; xx += 3.1) { c.moveTo(xx, top); c.lineTo(xx, hemY); }
    for (let yy = top + 2; yy < hemY; yy += 3.1) { c.moveTo(-8, yy); c.lineTo(8, yy); }
    c.stroke(); c.globalAlpha = 0.28; c.strokeStyle = P.shirtLL; c.lineWidth = 0.55; c.beginPath();
    for (let xx = -4.45; xx <= 6; xx += 3.1) { c.moveTo(xx, top); c.lineTo(xx, hemY); }
    for (let yy = top + 3.55; yy < hemY; yy += 3.1) { c.moveTo(-8, yy); c.lineTo(8, yy); }
    c.stroke(); c.globalAlpha = 1;
  }
  c.restore();
  // hem and trims
  if (g === 2) {
    c.fillStyle = P.shirtD; c.fillRect(-6.5, hemY - 2, 13, 2.2); c.fillStyle = P.shirtDD; c.globalAlpha = 0.5;
    for (let xx = -5.8; xx < 6.5; xx += 1.3) c.fillRect(xx, hemY - 2, 0.35, 2.2);
    c.globalAlpha = 1;
  } else { c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(-6.4, hemY - 0.7, 12.8, 0.8); }
}
function ppCollar(c, P, g, back) {
  const top = -28;
  if (back) {
    c.strokeStyle = P.shirtD; c.lineWidth = 1; c.beginPath(); c.moveTo(-3.4, top - 0.1); c.quadraticCurveTo(0, top + 1.3, 3.4, top - 0.1); c.stroke();
    if (g === 1 || g === 3 || g === 5) { c.fillStyle = P.shirtL; c.fillRect(-3.8, top - 0.6, 7.6, 1.3); }
    c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, top + 1); c.lineTo(0, -15); c.stroke();
    return;
  }
  if (g === 0 || g === 2) {
    // crew neck: bare skin V under the rim
    c.fillStyle = P.skinD; c.beginPath(); c.moveTo(-3.3, top - 0.1); c.quadraticCurveTo(0, top + 3.2, 3.3, top - 0.1); c.closePath(); c.fill();
    c.strokeStyle = g === 2 ? P.shirtDD : P.shirtD; c.lineWidth = g === 2 ? 1.5 : 1; c.beginPath(); c.moveTo(-3.5, top - 0.2); c.quadraticCurveTo(0, top + 3.6, 3.5, top - 0.2); c.stroke();
    c.strokeStyle = P.shirtL; c.lineWidth = 0.5; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(-3.2, top + 0.4); c.quadraticCurveTo(0, top + 4, 3.2, top + 0.4); c.stroke(); c.globalAlpha = 1;
  } else {
    // collared: skin V, two collar flaps, placket and buttons
    c.fillStyle = P.skinD; c.beginPath(); c.moveTo(-2.7, top - 0.1); c.lineTo(0, top + 3.9); c.lineTo(2.7, top - 0.1); c.closePath(); c.fill();
    c.fillStyle = P.shirtLL; c.strokeStyle = P.shirtD; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(-0.2, top + 3.9); c.lineTo(-4, top - 0.6); c.lineTo(-1.6, top - 1.4); c.lineTo(-0.1, top + 1.1); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0.2, top + 3.9); c.lineTo(4, top - 0.6); c.lineTo(1.6, top - 1.4); c.lineTo(0.1, top + 1.1); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = P.shirtD; c.lineWidth = 0.5; c.beginPath(); c.moveTo(0, top + 3.9); c.lineTo(0, g === 3 ? top + 9 : -15.5); c.stroke();
    c.fillStyle = P.shirtLL;
    const nb = g === 3 ? 2 : 4;
    for (let i = 0; i < nb; i++) { c.beginPath(); c.arc(0.55, top + 6 + i * (g === 3 ? 2.2 : 3.4), 0.5, 0, 7); c.fill(); }
    if (g === 3) { c.fillStyle = P.shirtD; c.fillRect(-0.9, top + 3.7, 1.8, 6.4); c.fillStyle = P.shirtLL; c.beginPath(); c.arc(0, top + 6.3, 0.45, 0, 7); c.arc(0, top + 8.6, 0.45, 0, 7); c.fill(); }
    if (g === 1) { c.fillStyle = P.shirtD; c.globalAlpha = 0.5; c.fillRect(2.4, -24.5, 2.4, 2.6); c.globalAlpha = 1; c.strokeStyle = P.shirtD; c.lineWidth = 0.4; c.strokeRect(2.4, -24.5, 2.4, 2.6); }
  }
}
function ppLeg(c, P, hx, fx, lift, f, pt) {
  const hy = -14.2, ay = -2.6 - lift;
  const kx = (hx + fx) / 2 + f * lift * 0.5, ky = (hy + ay) / 2 - lift * 0.1;
  c.lineCap = 'round'; c.lineJoin = 'round';
  ppSeg(c, hx, hy, kx, ky, 5.3, P.pants); ppSeg(c, kx, ky, fx, ay, 4.5, P.pants);
  // light left, shade right, so the two legs separate
  c.globalAlpha = 0.55; ppSeg(c, hx - 1.45, hy + 1, kx - 1.35, ky, 1.3, P.pantsL); ppSeg(c, kx - 1.3, ky, fx - 1.1, ay, 1.1, P.pantsL);
  c.globalAlpha = 0.6; ppSeg(c, hx + 1.7, hy + 1, kx + 1.6, ky, 1.2, P.pantsD); ppSeg(c, kx + 1.5, ky, fx + 1.3, ay, 1.1, P.pantsD);
  c.globalAlpha = 1;
  if (pt === 2) { c.globalAlpha = 0.4; ppSeg(c, hx, hy + 1, kx, ky, 0.5, P.pantsL); ppSeg(c, kx, ky, fx, ay, 0.5, P.pantsL); c.globalAlpha = 1; }
  else if (pt === 0) { c.globalAlpha = 0.35; ppSeg(c, hx + 2.3, hy + 2, kx + 2.1, ky, 0.4, P.pantsL); c.globalAlpha = 1; }
  // cuff
  ppSeg(c, fx, ay - 1.6, fx, ay + 0.4, 4.9, P.pantsD);
  c.lineCap = 'butt';
}
/* a leg that reaches a pedal: hip, knee (bending forward) and ankle, with the shoe on the pedal */
function ppRideLeg(c, P, hx, ax, ay, f, me) {
  const hy = -14.2, dx = ax - hx, dy = ay - hy, dl = Math.hypot(dx, dy) || 1, d = Math.min(dl, 12.5), ux = dx / dl, uy = dy / dl;
  const hh = Math.sqrt(Math.max(0, 6.3 * 6.3 - (d / 2) * (d / 2)));
  let qx = -uy, qy = ux; if (qx * f < 0) { qx = -qx; qy = -qy; }
  const kx = hx + ux * d / 2 + qx * hh, ky = hy + uy * d / 2 + qy * hh, ex = hx + ux * d, ey = hy + uy * d;
  c.lineCap = 'round'; c.lineJoin = 'round';
  ppSeg(c, hx, hy, kx, ky, 5.3, P.pants); ppSeg(c, kx, ky, ex, ey, 4.5, P.pants);
  c.globalAlpha = 0.5; ppSeg(c, hx - 1.3, hy + 1, kx - 1.2, ky, 1.2, P.pantsL); ppSeg(c, kx - 1.1, ky, ex - 1, ey, 1, P.pantsL);
  c.globalAlpha = 0.55; ppSeg(c, hx + 1.6, hy + 1, kx + 1.5, ky, 1.1, P.pantsD); ppSeg(c, kx + 1.4, ky, ex + 1.2, ey, 1, P.pantsD); c.globalAlpha = 1;
  ppSeg(c, ex, ey - 1.4, ex, ey + 0.3, 4.9, P.pantsD);
  c.lineCap = 'butt';
  ppShoe(c, P, ax, ay + 2.6, f, me);
}
function ppHairBack(c, P, style, hx, hy, f, mv, sway) {
  if (style === 1) {
    // long hair behind the shoulders
    c.fillStyle = P.hairD; c.beginPath();
    c.moveTo(hx - 5.9, hy - 0.5); c.bezierCurveTo(hx - 6.6, hy - 7.6, hx + 6.6, hy - 7.6, hx + 5.9, hy - 0.5);
    c.lineTo(hx + 6.5 + sway, hy + 9.4); c.quadraticCurveTo(hx + sway * 0.5, hy + 11.8, hx - 6.5 + sway, hy + 9.4); c.closePath(); c.fill();
    c.fillStyle = P.hair; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(hx - 1.4, hy + 5, 2.1, 4.6, 0.1, 0, 7); c.fill(); c.globalAlpha = 1;
  }
}
function ppHairFront(c, P, style, hx, hy, f, face, mv, sway, capOn) {
  c.fillStyle = P.hair;
  if (style === 3) return;
  // base cap of hair that most styles share: top of the head, temples, a hairline
  const hl = style === 2 ? 3.7 : 2.7;
  c.beginPath();
  c.moveTo(hx - 5.1, hy + 1.0);
  c.bezierCurveTo(hx - 6, hy - 3.2, hx - 3.8, hy - 6.9, hx + 0.2, hy - 6.8);
  c.bezierCurveTo(hx + 4.6, hy - 6.8, hx + 6.2, hy - 3.2, hx + 5.1, hy + 1.0);
  c.lineTo(hx + 4.6, hy + (style === 1 ? 0.4 : 1.8));
  c.lineTo(hx + 4.0, hy - 1.2);
  if (style === 1) { c.bezierCurveTo(hx + 2.4, hy - 3.8, hx + 0.6, hy - 4.6, hx, hy - 5); c.bezierCurveTo(hx - 0.6, hy - 4.6, hx - 2.4, hy - 3.8, hx - 4.0, hy - 1.2); }
  else c.bezierCurveTo(hx + 2.6 + f * 0.8, hy - hl - 1.5, hx - 2.6 + f * 0.8, hy - hl - 0.9, hx - 4.0, hy - 1.2);
  c.lineTo(hx - 4.6, hy + (style === 1 ? 0.4 : 1.8)); c.closePath(); c.fill();
  if (style === 1) {
    // side locks falling over the shoulders
    c.beginPath(); c.moveTo(hx - 5, hy - 1.4); c.bezierCurveTo(hx - 7, hy + 3, hx - 7.6 + sway * 0.4, hy + 7, hx - 6.2 + sway, hy + 10); c.quadraticCurveTo(hx - 4.4 + sway, hy + 9.2, hx - 4.2, hy + 5); c.quadraticCurveTo(hx - 4, hy + 1, hx - 3.6, hy - 1.4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(hx + 5, hy - 1.4); c.bezierCurveTo(hx + 7, hy + 3, hx + 7.6 + sway * 0.4, hy + 7, hx + 6.2 + sway, hy + 10); c.quadraticCurveTo(hx + 4.4 + sway, hy + 9.2, hx + 4.2, hy + 5); c.quadraticCurveTo(hx + 4, hy + 1, hx + 3.6, hy - 1.4); c.closePath(); c.fill();
  }
  if (style === 2) {
    // top knot with a tie
    c.beginPath(); c.arc(hx - f * 0.4, hy - 8, 2.9, 0, 7); c.fill();
    c.fillStyle = P.hairD; c.fillRect(hx - f * 0.4 - 2.1, hy - 6.4, 4.2, 1.2);
    c.fillStyle = P.hairL; c.globalAlpha = 0.65; c.beginPath(); c.ellipse(hx - f * 0.4 - 0.9, hy - 8.9, 1.2, 0.8, -0.5, 0, 7); c.fill(); c.globalAlpha = 1;
  } else if (style === 4) {
    // curls
    c.fillStyle = P.hair;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.04 + i * 0.115), r = 2.2 + ((i * 7) % 3) * 0.25;
      c.beginPath(); c.arc(hx + Math.cos(a) * 4.8, hy - 1.2 + Math.sin(a) * 5.2, r, 0, 7); c.fill();
    }
    c.beginPath(); c.arc(hx - 1.2, hy - 6.8, 2.4, 0, 7); c.arc(hx + 1.8, hy - 6.6, 2.2, 0, 7); c.fill();
    c.strokeStyle = P.hairL; c.globalAlpha = 0.55; c.lineWidth = 0.55;
    for (let i = 0; i < 8; i++) { const a = Math.PI * (1.1 + i * 0.12); c.beginPath(); c.arc(hx + Math.cos(a) * 5.1, hy - 1.6 + Math.sin(a) * 5.4, 1.2, 3.4, 5.2); c.stroke(); }
    c.globalAlpha = 1;
  }
  // volume highlight and a few strands
  if (style !== 4) {
    c.strokeStyle = P.hairL; c.globalAlpha = 0.6; c.lineWidth = 1.05; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - 4.4, hy - 3.2); c.quadraticCurveTo(hx - 3.2, hy - 6, hx + 0.8, hy - 6.1); c.stroke();
    c.globalAlpha = 0.45; c.strokeStyle = P.hairD; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(hx + 1.5, hy - 6.3); c.quadraticCurveTo(hx + 3.8, hy - 5, hx + 4.4, hy - 2.4); c.moveTo(hx - 1.2, hy - 5.6); c.quadraticCurveTo(hx - 0.4, hy - 4, hx - 2.2 * f, hy - 2.6); c.stroke();
    c.globalAlpha = 1; c.lineCap = 'butt';
  }
}
function ppCap(c, P, hx, hy, f) {
  // hair tufts, the crown, panel seams and the bill
  c.fillStyle = P.hair; c.beginPath(); c.arc(hx - 4.8, hy + 0.9, 1.9, 0, 7); c.arc(hx + 4.8, hy + 0.9, 1.9, 0, 7); c.fill();
  c.fillStyle = P.cap; c.beginPath();
  c.moveTo(hx - 5.5, hy - 1.4); c.bezierCurveTo(hx - 6.2, hy - 7.2, hx + 6.2, hy - 7.2, hx + 5.5, hy - 1.4); c.closePath(); c.fill();
  c.save(); c.clip();
  c.fillStyle = P.capL; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(hx - 2.2, hy - 5, 3, 2, -0.4, 0, 7); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = P.capD; c.lineWidth = 0.5; c.beginPath();
  c.moveTo(hx, hy - 7.2); c.lineTo(hx, hy - 1.4); c.moveTo(hx, hy - 7); c.quadraticCurveTo(hx - 3.6, hy - 5, hx - 4.6, hy - 1.4); c.moveTo(hx, hy - 7); c.quadraticCurveTo(hx + 3.6, hy - 5, hx + 4.6, hy - 1.4); c.stroke();
  c.restore();
  c.fillStyle = P.capD; c.fillRect(hx - 5.6, hy - 2.1, 11.2, 1.4);
  c.fillStyle = P.capL; c.beginPath(); c.arc(hx, hy - 6.9, 0.7, 0, 7); c.fill();
  // bill
  c.fillStyle = P.capD; c.beginPath();
  c.moveTo(hx + f * 1.6, hy - 2.1); c.quadraticCurveTo(hx + f * 7.2, hy - 2.7, hx + f * 9.4, hy - 0.5); c.quadraticCurveTo(hx + f * 6, hy + 0.4, hx + f * 1.6, hy - 0.5); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(hx + f * 2, hy - 2); c.quadraticCurveTo(hx + f * 6.4, hy - 2.4, hx + f * 8.2, hy - 1); c.lineTo(hx + f * 7.8, hy - 1.4); c.quadraticCurveTo(hx + f * 5.6, hy - 1.9, hx + f * 2, hy - 1.5); c.closePath(); c.fill();
}
function ppFace(c, P, o, hx, hy, f, mv, blink, glance, capOn, style) {
  const near = f;
  // brows, eyes, nose, mouth, cheeks
  if (!capOn) {
    c.strokeStyle = P.hairD; c.lineWidth = 0.7; c.lineCap = 'round'; c.beginPath();
    c.moveTo(hx - 3.2 + f * 0.9, hy - 1.85); c.quadraticCurveTo(hx - 2 + f * 0.9, hy - 2.55, hx - 0.8 + f * 0.9, hy - 1.95);
    c.moveTo(hx + 0.8 + f * 0.9, hy - 1.95); c.quadraticCurveTo(hx + 2 + f * 0.9, hy - 2.55, hx + 3.2 + f * 0.9, hy - 1.85); c.stroke(); c.lineCap = 'butt';
  }
  for (let e = -1; e <= 1; e += 2) {
    const ex = hx + e * 2 + f * 0.95, ey = hy + 0.45, big = e === near ? 1 : 0.86;
    if (blink) { c.strokeStyle = '#2a2120'; c.lineWidth = 0.55; c.beginPath(); c.moveTo(ex - 1 * big, ey + 0.3); c.lineTo(ex + 1 * big, ey + 0.3); c.stroke(); continue; }
    c.fillStyle = '#f6f2ea'; c.beginPath(); c.ellipse(ex, ey, 1.15 * big, 1.08 * big, 0, 0, 7); c.fill();
    c.fillStyle = '#2b2321'; c.beginPath(); c.arc(ex + f * 0.34 + glance, ey + 0.1, 0.78 * big, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + f * 0.38 + glance - 0.3, ey - 0.3, 0.3, 0, 7); c.fill();
    c.strokeStyle = 'rgba(30,22,22,.75)'; c.lineWidth = 0.45; c.beginPath(); c.arc(ex, ey + 0.1, 1.3 * big, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  }
  // nose
  c.fillStyle = P.skinD; c.beginPath(); c.ellipse(hx + f * 1.3, hy + 1.9, 0.62, 0.5, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(hx + f * 1.1, hy + 1.2, 0.4, 0, 7); c.fill();
  // mouth
  c.strokeStyle = o.me ? '#8a3a38' : 'rgba(120,52,50,.85)'; c.lineWidth = 0.55; c.lineCap = 'round'; c.beginPath();
  c.moveTo(hx + f * 0.8 - 0.95, hy + 3.15); c.quadraticCurveTo(hx + f * 0.8, hy + 3.9, hx + f * 0.8 + 0.95, hy + 3.15); c.stroke(); c.lineCap = 'butt';
  // cheeks
  c.fillStyle = 'rgba(232,98,92,' + (0.1 + (1 - P.lum) * 0.06 + 0.1).toFixed(2) + ')';
  c.beginPath(); c.ellipse(hx - 3.2 + f * 0.8, hy + 2.5, 1.5, 1, 0, 0, 7); c.ellipse(hx + 3.2 + f * 0.8, hy + 2.5, 1.5, 1, 0, 0, 7); c.fill();
}
/* the figure in its local frame; `st` carries the animation state (already quantised when drawn into a cached sprite) */
function ppBody(c, o, P, style, st) {
  const mv = st.mv, ph = st.ph, face = st.face, back = st.back, rd = st.rd, bob = st.bob, lean = st.lean, sway = st.sway, breathe = st.breathe;
  const g = P.garm, tucked = g === 1 || g === 3;
  const hemY = tucked ? -14.6 : -13.2;
  const f = face;
  c.save();
  if (rd) {
    // pedalling: the pedals sit on the bike's crank at (3f, -3.2) from the hips, one leg each side of it
    const an = o.ride * f, bx = 3 * f, by = -3.2;
    ppRideLeg(c, P, -0.6 * f, bx - Math.cos(an) * 3.2, by - Math.sin(an) * 3.2 - 2, f, false);
    ppRideLeg(c, P, 0.6 * f, bx + Math.cos(an) * 3.2, by + Math.sin(an) * 3.2 - 2, f, false);
  } else {
    // legs: the stepping leg lifts and bends, the other pushes back
    const l0 = mv ? Math.max(0, Math.cos(ph)) * 2.9 : 0, l1 = mv ? Math.max(0, -Math.cos(ph)) * 2.9 : 0;
    const f0 = -2.7 + (mv ? Math.sin(ph) * 4.2 * f : 0), f1 = 2.7 + (mv ? -Math.sin(ph) * 4.2 * f : 0);
    const order = mv && Math.sin(ph) * f < 0;
    if (order) { ppLeg(c, P, -2.6, f0, l0, f, P.pt); ppLeg(c, P, 2.6, f1, l1, f, P.pt); } else { ppLeg(c, P, 2.6, f1, l1, f, P.pt); ppLeg(c, P, -2.6, f0, l0, f, P.pt); }
    ppShoe(c, P, f0, -l0, f, o.me); ppShoe(c, P, f1, -l1, f, o.me);
  }
  // everything above the hips bobs and leans into the walk
  c.translate(0, -bob);
  c.translate(0, -14); c.transform(1, 0, -lean / 16, 1, 0, 0); c.translate(0, 14);
  const hx = (mv ? f * 0.5 : 0) + (back ? 0 : f * 0.35), hy = -34.3 + (mv ? 0 : breathe * 0.1);
  // far arm and long hair sit behind the torso
  const grip = rd ? [14.6 * f - lean * 0.19, -17] : null;
  ppArm(c, P, -f, f, mv, ph, back, g, 1, grip);
  if (style === 1) ppHairBack(c, P, 1, hx, hy, f, mv, sway * 0.6);
  // belt for tucked shirts, then the torso
  if (tucked) { c.fillStyle = '#2a2118'; c.fillRect(-6.4, -15.2, 12.8, 1.5); c.fillStyle = '#cdaa5a'; c.fillRect(-1 + f * 0.5, -15.2, 2, 1.5); }
  c.save(); c.translate(0, breathe * 0.12); ppTorso(c, P, back, g, hemY + sway * 0.0, lean); ppCollar(c, P, g, back); c.restore();
  ppArm(c, P, f, f, mv, ph, back, g, 0, grip);
  // neck and head
  c.fillStyle = P.skinD; c.beginPath(); c.moveTo(hx * 0.5 - 2, -29.2); c.lineTo(hx * 0.5 + 2, -29.2); c.lineTo(hx * 0.8 + 1.9, hy + 3); c.lineTo(hx * 0.8 - 1.9, hy + 3); c.closePath(); c.fill();
  c.fillStyle = P.skin; c.beginPath(); c.moveTo(hx * 0.5 - 2, -29.2); c.lineTo(hx * 0.5 - 0.3, -29.2); c.lineTo(hx * 0.8 - 0.2, hy + 3); c.lineTo(hx * 0.8 - 1.9, hy + 3); c.closePath(); c.fill();
  if (back) {
    c.fillStyle = P.hair; c.beginPath(); c.ellipse(hx, hy - 0.3, 5.3, 5.7, 0, 0, 7); c.fill();
    c.fillRect(hx - 4.4, hy + 2.8, 8.8, 2);
    if (style === 1) { c.beginPath(); c.moveTo(hx - 5.6, hy + 1); c.lineTo(hx + 5.6, hy + 1); c.lineTo(hx + 6.3 + sway, hy + 10); c.quadraticCurveTo(hx + sway * 0.5, hy + 12, hx - 6.3 + sway, hy + 10); c.closePath(); c.fill(); }
    if (style === 2) { c.beginPath(); c.arc(hx, hy - 7.6, 2.8, 0, 7); c.fill(); c.fillStyle = P.hairD; c.fillRect(hx - 2, hy - 6, 4, 1.1); }
    if (style === 4) { for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i * 0.125); c.beginPath(); c.arc(hx + Math.cos(a) * 4.9, hy - 1 + Math.sin(a) * 5.3, 2.3, 0, 7); c.fill(); } }
    if (style === 3) {
      c.fillStyle = P.cap; c.beginPath(); c.moveTo(hx - 5.6, hy - 0.4); c.bezierCurveTo(hx - 6.4, hy - 7.4, hx + 6.4, hy - 7.4, hx + 5.6, hy - 0.4); c.closePath(); c.fill();
      c.fillStyle = P.capD; c.fillRect(hx - 5.6, hy - 1.2, 11.2, 1.4); c.fillStyle = P.capL; c.beginPath(); c.arc(hx, hy - 7, 0.7, 0, 7); c.fill();
    }
    c.strokeStyle = P.hairL; c.globalAlpha = 0.5; c.lineWidth = 0.9; c.beginPath(); c.arc(hx + 0.4, hy - 2.2, 3.3, Math.PI * 1.15, Math.PI * 1.75); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = P.skin; c.beginPath(); c.ellipse(hx - 5.2, hy + 1.2, 0.9, 1.3, 0, 0, 7); c.ellipse(hx + 5.2, hy + 1.2, 0.9, 1.3, 0, 0, 7); c.fill();
  } else {
    // head: ellipse with a slightly narrower jaw, ears, soft shading
    c.fillStyle = P.skin; c.beginPath(); c.ellipse(hx, hy, 4.75, 5.05, 0, 0, 7); c.ellipse(hx, hy + 2.2, 3.95, 3.5, 0, 0, 7); c.fill();
    c.fillStyle = P.skinD; c.beginPath(); c.ellipse(hx - 4.7, hy + 0.9, 0.95, 1.35, 0, 0, 7); c.ellipse(hx + 4.7, hy + 0.9, 0.95, 1.35, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(hx, hy, 4.75, 5.05, 0, 0, 7); c.ellipse(hx, hy + 2.2, 3.95, 3.5, 0, 0, 7); c.clip();
    c.fillStyle = P.skinL; c.globalAlpha = 0.4; c.beginPath(); c.ellipse(hx - 2.6, hy - 1.6, 2.4, 3.2, -0.3, 0, 7); c.fill();
    c.fillStyle = P.skinD; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(hx + 4.8, hy + 1.5, 2.4, 5, 0, 0, 7); c.fill();
    c.fillStyle = P.skinDD; c.globalAlpha = 0.18; c.beginPath(); c.ellipse(hx, hy + 6.8, 5, 2.2, 0, 0, 7); c.fill();
    c.restore(); c.globalAlpha = 1;
    const blink = st.blink, glance = st.glance;
    if (style === 3) { ppFace(c, P, o, hx, hy, f, mv, blink, glance, true, style); ppCap(c, P, hx, hy, f); }
    else { ppFace(c, P, o, hx, hy, f, mv, blink, glance, false, style); ppHairFront(c, P, style, hx, hy, f, face, mv, sway * 0.6, false); }
  }
  // rim light when the sun is low and warm
  if (st.rim > 0.02) {
    const k = st.rim, sd = st.rimSide;
    c.strokeStyle = 'rgba(255,214,150,' + (0.55 * k).toFixed(3) + ')'; c.lineWidth = 0.9; c.lineCap = 'round';
    c.beginPath();
    c.arc(hx, hy - 0.4, 5.1, sd > 0 ? -1.15 : Math.PI + 0.15, sd > 0 ? 0.35 : Math.PI + 1.3);
    c.moveTo(sd * 7.4, -26.4); c.lineTo(sd * 6.3, -17);
    c.stroke(); c.lineCap = 'butt';
  }
  c.restore();
}

// Standing and walking figures are cached as small sprites (one per look, facing, walk-cycle step and idle state) and
// blitted, so a crowd costs a handful of canvas calls each. Kids at other sizes, riders and the big salon/mic scenes draw directly.
const PP_SPR = new Map(), PP_ST = { mv: false, ph: 0, face: 1, back: false, rd: false, bob: 0, lean: 0, sway: 0, breathe: 0, blink: false, glance: 0, rim: 0, rimSide: 1 };
const PP_W = 30, PP_H = 47, PP_OX = 15, PP_OY = 44;
function drawPerson(c, x, y, o) {
  const s = o.s || 1, mv = !!o.moving, face = o.face || 1, back = !!o.back;
  const P = ppPal(o), style = lookStyle(o), A = FX.A, tm = FX.time;
  const sunny = !!(A && S && S.scene === 'town' && FX.sh.a > 0.02);
  const rd = o.ride != null;   // seated on a bike: o.ride is the pedal phase
  if (!rd) { ppShadow(c, x, y, s, sunny ? FX.sh.dx : 0, sunny ? FX.sh.dy : 0.4); if (o.me) ppRing(c, x, y, s); }
  const st = PP_ST, cache = !rd && s <= 1.5 && c.getTransform;
  let ph = o.phase || 0;
  if (cache && mv) ph = Math.round((((ph % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 16) % 16 * 6.2832 / 16;
  const cs = mv ? Math.cos(ph) : 0;
  let breathe = mv || REDUCED ? 0 : Math.sin(tm * 1.9 + x * 0.07 + P.seed * 6.283);
  if (cache && !mv) breathe = breathe > 0.4 ? 1 : breathe < -0.4 ? -1 : 0;
  st.mv = mv; st.ph = ph; st.face = face; st.back = back; st.rd = rd; st.breathe = breathe;
  st.bob = mv ? Math.abs(cs) * 1.25 : breathe * 0.22;
  st.lean = rd ? face * 4.5 : mv ? face * 1.4 : 0;
  st.sway = mv ? Math.sin(ph * 2 + 1) * 0.6 : (cache || REDUCED ? 0 : Math.sin(tm * 1.3 + P.seed * 9) * 0.25);
  st.blink = !back && !REDUCED && !mv && ((tm * 0.31 + x * 0.013 + P.seed * 3) % 1) > 0.965;
  st.glance = 0;
  st.rim = 0; st.rimSide = 1;
  if (sunny && A.warm > 0.25 && A.nf < 0.7) { st.rim = clamp(A.warm * A.sh * 1.4, 0, 1) * (1 - A.nf); st.rimSide = A.sunX > 0 ? 1 : -1; if (cache) st.rim = Math.round(st.rim * 4) / 4; }
  if (!cache) {
    // direct: any scale, riders and the big close-ups keep their time-based glance
    st.glance = mv || REDUCED ? 0 : Math.sin(tm * 0.55 + P.seed * 20) * 0.3;
    c.save(); c.translate(rd ? x - 5 * face * s : x, rd ? y - 2.8 * s : y); c.scale(s, s);
    ppBody(c, o, P, style, st);
    c.restore();
    return;
  }
  const m = Math.abs(c.getTransform().a), R = Math.min(3, Math.max(1, Math.ceil(m * s - 0.15)));
  const key = P.key + (o.me ? 'M' : '') + '|' + face + '|' + style + '|' + (back ? 1 : 0) + '|' + (mv ? Math.round(ph * 16 / 6.2832) : 'i' + breathe + (st.blink ? 'b' : '')) + '|' + st.rim + st.rimSide + '|' + R;
  let spr = PP_SPR.get(key);
  if (!spr) {
    if (PP_SPR.size > 220) PP_SPR.clear();
    spr = document.createElement('canvas'); spr.width = PP_W * R; spr.height = PP_H * R;
    const g = spr.getContext('2d'); g.setTransform(R, 0, 0, R, PP_OX * R, PP_OY * R);
    ppBody(g, o, P, style, st);
    PP_SPR.set(key, spr);
  }
  c.drawImage(spr, x - PP_OX * s, y - PP_OY * s, PP_W * s, PP_H * s);
}
