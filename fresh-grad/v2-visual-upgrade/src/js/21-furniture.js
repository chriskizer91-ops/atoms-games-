/* ============================ furniture drawing (v2) ============================
   Each painter draws the static look of one piece into the cached room layer: a top face, a lit front face, a soft
   contact shadow, material (wood grain, fabric weave, brushed steel, glass) and props. Footprints (f.x, f.y, f.w, f.h)
   are the collision boxes and are never changed. Anything that moves or glows by the hour lives in FURN_LIVE. */
const FURN_FLAT = { rug: 1, mat: 1, notice: 1 };
/* live overlays (screens, flames, LEDs, tumbling washers): drawn every frame over the cached room, kept cheap */
const FURN_LIVE = {};
const fsd = f => ((f.x * 7 + f.y * 13 + f.w * 3) | 0);
/* a solid block seen from the front and above: lit top face, shaded front face, soft shadow. Returns the faces. */
function box(c, x, y, w, h, col, top, o) {
  o = o || {};
  const fh = o.fh != null ? o.fh : Math.min(8, Math.max(4, h * 0.22)), r = o.r != null ? o.r : 2.5, fy = y + h - fh;
  if (!o.noShadow) IM.contact(c, x, y, w, h, r, o.k);
  c.fillStyle = IM.grad(c, 0, fy, 0, y + h, [[0, shade(col, -0.2)], [1, shade(col, -0.4)]]);
  rr(c, x, fy - 3, w, fh + 3, r); c.fill();
  c.fillStyle = IM.grad(c, x, y, x + w * 0.7, fy, [[0, shade(col, 0.14)], [0.5, col], [1, shade(col, -0.08)]]);
  rr(c, x, y, w, Math.max(2, h - fh), r); c.fill();
  c.fillStyle = 'rgba(255,246,226,.5)'; c.fillRect(x + r, y + 0.2, w - 2 * r, 1); c.fillRect(x + 0.2, y + r, 1, Math.max(1, h - fh - 2 * r));
  c.fillStyle = 'rgba(255,246,226,.26)'; c.fillRect(x + 1.5, fy - 1.2, w - 3, 1);
  c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + w - 1.6, y + 2, 1.6, Math.max(1, h - fh - 2));
  c.fillStyle = 'rgba(' + IM.INK + ',.38)'; c.fillRect(x + 1.5, y + h - 1.2, w - 3, 1.2);
  if (top) { c.fillStyle = top; rr(c, x, y, w, Math.min(3, h), 2); c.fill(); }
  return { tx: x, ty: y, tw: w, th: Math.max(2, h - fh), fy, fh };
}
function lbl(c, f, col) {
  if (!f.label) return;
  // dark lettering on pale furniture, white on everything else
  if (!col && f.c) { const q = hexRgb(f.c); if (q[0] * 0.3 + q[1] * 0.6 + q[2] * 0.1 > 165) col = '#39424d'; }
  const light = !col || col === '#fff' || col === '#ffffff';
  const sz = f.fs || 10, cx = f.x + f.w / 2, cy = f.y + f.h / 2 + 1;
  c.font = '800 ' + sz + 'px "Bricolage Grotesque","Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = light ? 'rgba(' + IM.INK + ',.45)' : 'rgba(255,255,255,.6)'; c.fillText(f.label, cx + (light ? 0.7 : 0.5), cy + (light ? 1.1 : 0.9));
  c.fillStyle = col || '#fff'; c.fillText(f.label, cx, cy);
}
/* a small plaque for the name of a machine or cabinet, so lettering never sits on top of its detail */
function plaque(c, f, text, y, dark) {
  const sz = Math.min(f.fs || 8, 8), w = Math.min(f.w - 6, text.length * sz * 0.66 + 8), x = f.x + f.w / 2 - w / 2;
  c.fillStyle = 'rgba(' + IM.INK + ',.32)'; rr(c, x + 0.8, y + 1.2, w, 10, 2); c.fill();
  c.fillStyle = dark ? '#20262d' : IM.grad(c, 0, y, 0, y + 10, [[0, '#fbf8ef'], [1, '#e2dac6']]); rr(c, x, y, w, 10, 2); c.fill();
  if (dark) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 1, y, w - 2, 0.8); }
  signText(c, text, f.x + f.w / 2, y + 5.2, sz, dark ? '#f6f1e7' : '#33261a');
}
const FURN = {
  rug(c, f) {
    const col = f.c || '#a64b4b', x = f.x, y = f.y, w = f.w, h = f.h, sd = fsd(f), r = Math.min(9, h / 4);
    const horiz = w >= h * 1.15;
    // fringe at the two short ends
    c.strokeStyle = shade(col, 0.55); c.lineWidth = 1; c.beginPath();
    if (horiz) for (let yy = y + 5; yy < y + h - 4; yy += 2.6) { c.moveTo(x, yy); c.lineTo(x - 4, yy + (hash01(yy | 0, sd, 1) - 0.5) * 1.6); c.moveTo(x + w, yy); c.lineTo(x + w + 4, yy + (hash01(yy | 0, sd, 2) - 0.5) * 1.6); }
    else for (let xx = x + 5; xx < x + w - 4; xx += 2.6) { c.moveTo(xx, y); c.lineTo(xx + (hash01(xx | 0, sd, 1) - 0.5) * 1.6, y - 4); c.moveTo(xx, y + h); c.lineTo(xx + (hash01(xx | 0, sd, 2) - 0.5) * 1.6, y + h + 4); }
    c.stroke();
    IM.shadow(c, x, y, w, h, r, 4, 0.3, 1.5, 2.5);
    c.fillStyle = shade(col, -0.2); rr(c, x, y, w, h, r); c.fill();
    // woven border: a dark band with a row of cream marks and a thin keyline
    c.fillStyle = shade(col, -0.05); rr(c, x + 3, y + 3, w - 6, h - 6, r - 2); c.fill();
    c.fillStyle = 'rgba(255,240,214,.34)';
    for (let xx = x + 8; xx < x + w - 10; xx += 8) { c.fillRect(xx, y + 5, 3.4, 2); c.fillRect(xx, y + h - 7, 3.4, 2); }
    for (let yy = y + 8; yy < y + h - 10; yy += 8) { c.fillRect(x + 5, yy, 2, 3.4); c.fillRect(x + w - 7, yy, 2, 3.4); }
    c.strokeStyle = 'rgba(255,240,214,.5)'; c.lineWidth = 1; rr(c, x + 10, y + 10, w - 20, h - 20, 3); c.stroke();
    const ix = x + 12, iy = y + 12, iw = w - 24, ih = h - 24;
    c.fillStyle = IM.grad(c, ix, iy, ix + iw, iy + ih, [[0, shade(col, 0.1)], [1, shade(col, -0.06)]]); c.fillRect(ix, iy, iw, ih);
    const cx = x + w / 2, cy = y + h / 2, d = Math.min(iw / 3.5, ih / 2) * 0.92, k = sd & 3;
    if (k < 2) {   // a nested diamond medallion
      [1, 0.72, 0.46].forEach((s, i) => { c.fillStyle = i % 2 ? shade(col, -0.18) : shade(col, 0.3 - i * 0.04); c.beginPath(); c.moveTo(cx, cy - d * s); c.lineTo(cx + d * s * 1.7, cy); c.lineTo(cx, cy + d * s); c.lineTo(cx - d * s * 1.7, cy); c.closePath(); c.fill(); });
      c.fillStyle = shade(col, 0.5); c.beginPath(); c.arc(cx, cy, d * 0.12, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,240,214,.3)'; [[ix, iy], [ix + iw, iy], [ix, iy + ih], [ix + iw, iy + ih]].forEach((p, i) => { c.beginPath(); c.arc(p[0], p[1], Math.min(iw, ih) * 0.2, i * 1.5708, i * 1.5708 + 1.5708); c.lineTo(p[0], p[1]); c.fill(); });
    } else if (k === 2) {   // bands
      const nb = Math.max(3, Math.round((horiz ? iw : ih) / 14)); for (let i = 0; i < nb; i++) { c.fillStyle = i % 3 === 0 ? 'rgba(255,240,214,.3)' : i % 3 === 1 ? 'rgba(0,0,0,.1)' : 'rgba(255,240,214,.1)'; if (horiz) c.fillRect(ix + (i + 0.5) * iw / nb - 2, iy, 4, ih); else c.fillRect(ix, iy + (i + 0.5) * ih / nb - 2, iw, 4); }
    } else {   // a lattice of small diamonds
      for (let yy = iy + 8; yy < iy + ih - 4; yy += 14) for (let xx = ix + 10 + ((yy - iy) % 28 ? 7 : 0); xx < ix + iw - 6; xx += 14) { c.fillStyle = 'rgba(255,240,214,.3)'; c.beginPath(); c.moveTo(xx, yy - 4); c.lineTo(xx + 4, yy); c.lineTo(xx, yy + 4); c.lineTo(xx - 4, yy); c.closePath(); c.fill(); }
    }
    IM.weave(c, x, y, w, h, 0.9, r); IM.pat(c, 'iw_carpet', x, y, w, h, 0.9, r);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + r, y, w - 2 * r, 1); c.fillRect(x, y + r, 1, h - 2 * r);
    c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x + r, y + h - 1.2, w - 2 * r, 1.2);
  },
  mat(c, f) {
    const col = f.c || '#5a4a3a', x = f.x, y = f.y, w = f.w, h = f.h;
    IM.shadow(c, x, y, w, h, 4, 3, 0.35, 1, 1.8);
    c.fillStyle = shade(col, -0.35); rr(c, x, y, w, h, 4); c.fill();
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, shade(col, 0.1)], [1, shade(col, -0.12)]]); rr(c, x + 2, y + 2, w - 4, h - 4, 3); c.fill();
    c.fillStyle = 'rgba(0,0,0,.28)'; for (let xx = x + 4; xx < x + w - 4; xx += 2.4) c.fillRect(xx, y + 3, 1, h - 6);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let xx = x + 5.2; xx < x + w - 4; xx += 2.4) c.fillRect(xx, y + 3, 0.8, h - 6);
    c.strokeStyle = 'rgba(255,240,214,.36)'; c.lineWidth = 1.2; rr(c, x + 5, y + 5, w - 10, h - 10, 2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 3, y + 0.5, w - 6, 1);
  },
  notice(c, f) {
    c.fillStyle = '#7a5a3a'; c.fillRect(f.x - 2, f.y - 2, f.w + 4, f.h + 4); c.fillStyle = f.c || '#c9a06a'; c.fillRect(f.x, f.y, f.w, f.h); IM.pat(c, 'iw_cork', f.x, f.y, f.w, f.h, 1);
    for (let i = 0; i < 4; i++) PROP.paper(c, f.x + 5 + i * (f.w / 4), f.y + 5, f.w / 4 - 8, f.h - 10, (i - 1.5) * 0.04, 3);
  },
  bed(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#4a78b5', sd = fsd(f);
    IM.contact(c, x - 2, y - 4, w + 4, h + 4, 4);
    // frame, headboard with raised panels
    c.fillStyle = IM.grad(c, 0, y + h - 10, 0, y + h, [[0, '#7a5738'], [1, '#4a301c']]); rr(c, x, y + h - 14, w, 14, 3); c.fill();
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, '#8a6240'], [0.5, '#9a7248'], [1, '#6b4a30']]); rr(c, x - 2, y - 5, w + 4, 15, 3); c.fill();
    c.fillStyle = 'rgba(255,240,214,.3)'; c.fillRect(x - 1, y - 4.6, w + 2, 1.2);
    c.fillStyle = 'rgba(' + IM.INK + ',.25)'; for (let i = 0; i < 3; i++) { const px = x + 5 + i * (w - 6) / 3; rr(c, px, y - 2, (w - 6) / 3 - 4, 9, 2); c.fill(); }
    IM.grain(c, x - 2, y - 5, w + 4, 15, sd, 0.9);
    // mattress and sheet
    c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, '#f6f7fb'], [1, '#d9dde8']]); rr(c, x + 3, y + 8, w - 6, h - 17, 5); c.fill();
    // pillows, plump, with a crease down the middle
    [x + 7, x + w / 2 + 3].forEach((px, i) => {
      const pw = w / 2 - 10, py = y + 11;
      IM.shadow(c, px, py, pw, 24, 8, 4, 0.3, 1, 2.5);
      c.fillStyle = IM.grad(c, px, py, px + pw, py + 24, [[0, '#ffffff'], [1, '#dfe3ee']]); rr(c, px, py, pw, 24, 8); c.fill();
      c.strokeStyle = 'rgba(' + IM.INK + ',.16)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 5, py + 12); c.quadraticCurveTo(px + pw / 2, py + 9 + i * 2, px + pw - 5, py + 12); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(px + pw * 0.28, py + 6, pw * 0.2, 2.6, -0.2, 0, 7); c.fill();
      c.strokeStyle = 'rgba(' + IM.INK + ',.1)'; c.beginPath(); c.moveTo(px + 3, py + 21); c.lineTo(px + pw - 3, py + 21); c.stroke();
    });
    // duvet with a folded cuff, quilting, wrinkles and a throw at the foot
    const dy = y + h * 0.4, dh = h - (dy - y) - 9;
    IM.shadow(c, x + 3, dy, w - 6, dh, 6, 4, 0.28, 0, -1.5);
    c.fillStyle = IM.grad(c, x, dy, x + w, dy + dh, [[0, shade(col, 0.14)], [0.5, col], [1, shade(col, -0.14)]]); rr(c, x + 2, dy, w - 4, dh, 6); c.fill();
    IM.clip(c, x + 2, dy, w - 4, dh, 6, () => {
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.beginPath();
      for (let k = -dh; k < w; k += 14) { c.moveTo(x + k, dy); c.lineTo(x + k + dh, dy + dh); c.moveTo(x + k + dh, dy); c.lineTo(x + k, dy + dh); }
      c.stroke();
      c.strokeStyle = 'rgba(' + IM.INK + ',.14)'; for (let i = 0; i < 4; i++) { const wx = x + 8 + hash01(i, sd, 5) * (w - 16), wy = dy + 14 + hash01(i, sd, 6) * (dh - 30); c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 9, wy + 3, wx + 5 + hash01(i, sd, 7) * 12, wy + 9); c.stroke(); }
      const tg = IM.grad(c, 0, y + h - 40, 0, y + h - 22, [[0, shade(col, 0.35)], [1, shade('#f2c14e', -0.05)]]); c.fillStyle = tg; c.fillRect(x, y + h - 36, w, 18);
      c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x, y + h - 36, w, 1.4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y + h - 18, w, 1);
      IM.weave(c, x, y + h - 36, w, 18, 0.9);
    });
    c.fillStyle = IM.grad(c, 0, dy, 0, dy + 11, [[0, '#ffffff'], [1, '#d6dae6']]); rr(c, x + 2, dy - 2, w - 4, 11, 5); c.fill();   // the turned-back sheet
    c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x + 4, dy + 9, w - 8, 1.5);
    IM.weave(c, x + 2, dy, w - 4, dh, 0.8, 6);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 6, dy - 1.4, w - 12, 1);
  },
  hbed(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#6fb7c9';
    IM.contact(c, x - 3, y, w + 6, h, 3);
    c.fillStyle = '#2a2f36'; [[x + 2, y + h - 6], [x + w - 8, y + h - 6]].forEach(p => { c.beginPath(); c.arc(p[0] + 3, p[1] + 3, 3.4, 0, 7); c.fill(); });
    c.fillStyle = IM.grad(c, x, y, x + w, y, [[0, '#dfe5e9'], [1, '#aab6bd']]); rr(c, x, y - 3, w, h + 1, 3); c.fill();
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, '#f9fbfc'], [1, '#d9e1e6']]); rr(c, x + 4, y + 5, w - 8, h - 11, 4); c.fill();
    // headboard panel with a teal band
    c.fillStyle = IM.grad(c, 0, y - 4, 0, y + 8, [[0, '#eef3f6'], [1, '#b9c5cc']]); rr(c, x, y - 4, w, 12, 3); c.fill();
    c.fillStyle = col; c.fillRect(x + 6, y - 1, w - 12, 2.4);
    // pillow
    IM.shadow(c, x + 12, y + 11, w - 24, 17, 6, 3, 0.25, 1, 2);
    c.fillStyle = IM.grad(c, 0, y + 11, 0, y + 28, [[0, '#ffffff'], [1, '#dde5ea']]); rr(c, x + 12, y + 11, w - 24, 17, 6); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 17, y + 20); c.lineTo(x + w - 17, y + 20); c.stroke();
    // blanket with a folded cuff and hospital stripes
    const by = y + h * 0.4;
    c.fillStyle = IM.grad(c, x, by, x + w, by + h * 0.6, [[0, shade(col, 0.16)], [1, shade(col, -0.14)]]); rr(c, x + 4, by, w - 8, h * 0.6 - 7, 4); c.fill();
    c.fillStyle = '#f4f7f9'; rr(c, x + 4, by - 1, w - 8, 9, 3); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.18)'; c.fillRect(x + 6, by + 8, w - 12, 1.2);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 6, by + h * 0.3, w - 12, 2); c.fillRect(x + 6, by + h * 0.3 + 5, w - 12, 1);
    IM.clip(c, x + 4, by, w - 8, h * 0.6 - 7, 4, () => { c.strokeStyle = 'rgba(' + IM.INK + ',.1)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 10, by + 22); c.quadraticCurveTo(x + w / 2, by + 26, x + w - 12, by + 20); c.stroke(); });
    IM.weave(c, x + 4, by, w - 8, h * 0.6 - 7, 0.8, 4);
    // chrome side rails with highlights, foot panel
    c.fillStyle = IM.grad(c, x - 3, 0, x + 0.4, 0, [[0, '#f0f4f6'], [1, '#7a8791']]); c.fillRect(x - 3, y, 3.4, h - 2); c.fillRect(x + w - 0.4, y, 3.4, h - 2);
    c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 2.4, y + 2, 0.9, h - 6); c.fillRect(x + w + 0.4, y + 2, 0.9, h - 6);
    c.fillStyle = IM.grad(c, 0, y + h - 9, 0, y + h, [[0, '#eef3f6'], [1, '#9fadb5']]); rr(c, x, y + h - 9, w, 9, 2.5); c.fill();
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 1, y + h - 1.2, w - 2, 1.2);
  },
  sofa(c, f) {
    const col = f.c || '#b6554e', x = f.x, y = f.y, w = f.w, h = f.h, sd = fsd(f), leather = IM.lum(col) < 0.34 && IM.sat(col) < 0.55 || (ROOMCTX.st && ROOMCTX.st.sofa === 'leather');
    IM.contact(c, x, y + 1, w, h - 2, 6, 1.2);
    // legs under the skirt
    c.fillStyle = '#3a2618'; [x + 5, x + w - 9, x + w * 0.4, x + w * 0.6].forEach(lx => c.fillRect(lx, y + h - 4, 4, 4));
    // back rest, tufted
    const bh = Math.max(14, h * 0.36);
    c.fillStyle = IM.grad(c, 0, y, 0, y + bh, [[0, shade(col, 0.1)], [1, shade(col, -0.2)]]); rr(c, x, y, w, bh + 4, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 6, y + 0.8, w - 12, 1.2);
    const nb = Math.max(3, Math.round(w / 26));
    for (let i = 0; i < nb; i++) {
      const bx = x + 14 + (i + 0.5) * (w - 28) / nb;
      c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx - 9, y + 3); c.lineTo(bx, y + bh * 0.55); c.lineTo(bx + 9, y + 3); c.moveTo(bx - 9, y + bh); c.lineTo(bx, y + bh * 0.55); c.lineTo(bx + 9, y + bh); c.stroke();
      c.fillStyle = shade(col, -0.34); c.beginPath(); c.arc(bx, y + bh * 0.55, 1.5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(bx - 0.4, y + bh * 0.55 - 0.4, 0.6, 0, 7); c.fill();
    }
    // seat cushions with piping, creases and a dent
    const n = Math.max(2, Math.round(w / 56)), cw = (w - 22) / n, sy = y + bh - 1, sh = h - bh - 3;
    for (let i = 0; i < n; i++) {
      const cx0 = x + 11 + i * cw + 0.6;
      IM.shadow(c, cx0, sy, cw - 1.2, sh, 5, 3, 0.3, 0.5, 1.5);
      c.fillStyle = IM.grad(c, cx0, sy, cx0 + cw, sy + sh, [[0, shade(col, 0.18)], [0.5, col], [1, shade(col, -0.1)]]); rr(c, cx0, sy, cw - 1.2, sh, 5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.26)'; c.lineWidth = 1; rr(c, cx0 + 1, sy + 1, cw - 3.2, sh - 2, 4); c.stroke();
      c.fillStyle = 'rgba(' + IM.INK + ',.1)'; c.beginPath(); c.ellipse(cx0 + cw / 2, sy + sh * 0.55, cw * 0.28, sh * 0.2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(cx0 + cw * 0.38, sy + sh * 0.3, cw * 0.22, sh * 0.12, -0.2, 0, 7); c.fill();
      c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(cx0, sy + sh - 1.2, cw - 1.2, 1.2);
    }
    // rolled arms
    [x, x + w - 12].forEach((ax, i) => {
      c.fillStyle = IM.grad(c, ax, 0, ax + 12, 0, [[0, shade(col, i ? -0.14 : 0.1)], [0.5, shade(col, 0.04)], [1, shade(col, i ? 0.08 : -0.18)]]); rr(c, ax, y + 4, 12, h - 4, 6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, ax + 2, y + 6, 4, 6, 2); c.fill();
      c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(ax + (i ? 0 : 11), y + 12, 1.2, h - 16);
    });
    // a throw pillow
    const px = x + (sd & 1 ? 16 : w - 36), pc = shade(col, sd & 2 ? 0.45 : -0.4);
    c.save(); c.translate(px + 10, sy + 9); c.rotate(sd & 1 ? -0.3 : 0.3);
    IM.shadow(c, -10, -9, 20, 18, 4, 3, 0.3, 1, 2); c.fillStyle = IM.grad(c, -10, -9, 10, 9, [[0, shade(pc, 0.18)], [1, shade(pc, -0.12)]]); rr(c, -10, -9, 20, 18, 4); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-8, -7); c.lineTo(8, 7); c.moveTo(8, -7); c.lineTo(-8, 7); c.stroke(); c.restore();
    if (leather) { IM.pat(c, 'iw_leather', x, y, w, h, 0.9, 6); c.fillStyle = IM.grad(c, x, y, x + w * 0.6, y + h, [[0, 'rgba(255,255,255,.18)'], [0.5, 'rgba(255,255,255,0)']]); rr(c, x, y, w, h, 6); c.fill(); }
    else IM.weave(c, x, y, w, h - 1, 0.9, 6);
  },
  table(c, f) {
    const col = f.c || '#9c7a4f', x = f.x, y = f.y, w = f.w, h = f.h, sd = fsd(f), steel = IM.sat(col) < 0.2 && IM.lum(col) > 0.55;
    const fh = Math.min(7, Math.max(4, h * 0.2));
    // legs peek out under the apron
    c.fillStyle = steel ? '#9aa7ad' : shade(col, -0.5); c.fillRect(x + 2, y + h - 3, 4, 3); c.fillRect(x + w - 6, y + h - 3, 4, 3);
    box(c, x, y, w, h, col, null, { fh });
    if (steel) {
      IM.clip(c, x, y, w, h - fh, 2.5, () => { IM.brushed(c, x, y, w, h - fh, 1); c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.3)'], [0.4, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h); });
      c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 1; rr(c, x + 3, y + 3, w - 6, h - fh - 6, 2); c.stroke();
    } else {
      IM.grain(c, x + 1, y + 1, w - 2, h - fh - 2, sd, 1);
      c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, x + 4, y + 4, w * 0.4, Math.max(2, h * 0.24), 2); c.fill();
      c.strokeStyle = 'rgba(255,240,214,.14)'; c.lineWidth = 1; rr(c, x + 2.5, y + 2.5, w - 5, h - fh - 5, 2); c.stroke();
    }
    c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + 1.5, y + h - fh, w - 3, 1);
    const pk = f.label ? TBL.pick(f.label.toUpperCase()) : null;
    if (pk) { TBL[pk[0]](c, f, h - fh); if (pk[1]) TBL.plate(c, f, f.label, h - fh); else lbl(c, f); return; }
    // what people leave on a table, so no two look alike
    if (!f.label && !steel) {
      const k = (sd >> 2) & 3, th = h - fh;
      if (w <= 40) { PROP.lampDesk(c, x + w * 0.62, y + th * 0.62); c.fillStyle = '#e8e2d2'; rr(c, x + 4, y + th * 0.38, 8, 6, 1.5); c.fill(); c.fillStyle = '#3a414a'; c.fillRect(x + 5.4, y + th * 0.38 + 1.4, 5, 2.4); }
      else if (w >= 80 && th >= 30) {
        if (k === 0) { PROP.plate(c, x + w * 0.28, y + th * 0.5, 6.4, '#d9a05b'); PROP.plate(c, x + w * 0.72, y + th * 0.5, 6.4, '#9be7a8'); PROP.cup(c, x + w * 0.5, y + th * 0.3); PROP.shaker(c, x + w * 0.5, y + th * 0.68); }
        else if (k === 1) { PROP.laptop(c, x + w * 0.2, y + th * 0.2, 24, 17, '#4a90c2'); PROP.mug(c, x + w * 0.74, y + th * 0.5); PROP.paper(c, x + w * 0.52, y + th * 0.3, 11, 14, 0.2, 4); }
        else if (k === 2) { PROP.vase(c, x + w * 0.5, y + th * 0.5, '#8ecae6'); PROP.book(c, x + w * 0.14, y + th * 0.3, 15, 11, '#8e44ad'); PROP.mug(c, x + w * 0.82, y + th * 0.4); }
        else { PROP.notebook(c, x + w * 0.2, y + th * 0.25, 13, 17, '#3d5a80'); PROP.cup(c, x + w * 0.55, y + th * 0.45); PROP.plantSm(c, x + w * 0.82, y + th * 0.7); }
      }
    }
    lbl(c, f);
  },
  round(c, f) {
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2, col = f.c || '#9c7a4f', rx = f.w / 2, ry = f.h / 2, sd = fsd(f);
    IM.shadow(c, f.x, f.y + 3, f.w, f.h, ry, 8, 0.28, 3.5, 6);
    // pedestal foot and the thickness of the top
    c.fillStyle = '#3a2f26'; c.beginPath(); c.ellipse(cx, cy + ry * 0.7, rx * 0.34, ry * 0.2, 0, 0, 7); c.fill();
    c.fillStyle = shade(col, -0.45); c.beginPath(); c.ellipse(cx, cy + 4, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = IM.grad(c, f.x, f.y, f.x + f.w * 0.8, f.y + f.h, [[0, shade(col, 0.16)], [0.5, col], [1, shade(col, -0.1)]]); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx - 0.5, ry - 0.5, 0, 0, 7); c.clip(); IM.grain(c, f.x, f.y, f.w, f.h, sd, 0.9); c.restore();
    c.strokeStyle = 'rgba(255,240,214,.4)'; c.lineWidth = 1.1; c.beginPath(); c.ellipse(cx, cy, rx - 1, ry - 1, 0, Math.PI * 0.95, Math.PI * 1.75); c.stroke();
    c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.beginPath(); c.ellipse(cx, cy, rx - 1, ry - 1, 0, 0.2, Math.PI * 0.8); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.4, ry * 0.18, -0.25, 0, 7); c.fill();
    // table settings: a menu stand, shakers, or a little vase
    const k = sd & 3;
    if (k === 0) { PROP.shaker(c, cx - 4, cy - 2); PROP.shaker(c, cx + 1, cy - 1, '#e9c46a'); PROP.napkins(c, cx + 8, cy - 4, 6, 4); }
    else if (k === 1) PROP.vase(c, cx, cy - 1, '#8ecae6');
    else if (k === 2) { PROP.cup(c, cx - 8, cy - 1); PROP.plate(c, cx + 6, cy + 1, 4.6, '#d9a05b'); }
    else PROP.candle(c, cx, cy - 1);
  },
  desk(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#b98a55', sd = fsd(f);
    const fh = Math.min(8, Math.max(4, h * 0.2));
    box(c, x, y, w, h, col, null, { fh });
    IM.grain(c, x + 1, y + 1, w - 2, h - fh - 2, sd, 1);
    c.fillStyle = 'rgba(255,240,214,.12)'; rr(c, x + 3, y + 3, w * 0.5, 4, 2); c.fill();
    // drawers hint on the front face
    c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x + w * 0.62, y + h - fh + 1, 1, fh - 2);
    c.fillStyle = '#d9c36a'; c.fillRect(x + w * 0.8, y + h - fh + 2.2, 4, 1.2);
    if (f.pc !== false) {
      const mx = x + w / 2 - 15;
      PROP.monitor(c, mx, y + 3, 30, 19, '#1c2733');
      PROP.keyboard(c, mx + 3, y + 28, 24, 5.4);
      c.fillStyle = '#d9dde0'; rr(c, mx + 29, y + 29, 4, 5.4, 2); c.fill();   // mouse
      const k = sd & 3;
      if (w > 70 && h > 30) {
        if (k === 0) PROP.mug(c, mx + 42, y + 14);
        else if (k === 1) { PROP.notebook(c, mx + 36, y + 8, 11, 14, '#3d5a80'); }
        else if (k === 2) PROP.lampDesk(c, x + w - 12, y + 14);
        else PROP.plantSm(c, x + w - 12, y + 18, 0.9);
        PROP.paper(c, x + 6, y + 6, 12, 15, -0.12, 4);
      }
    }
    lbl(c, f);
  },
  chair(c, f) {
    const col = f.c || '#4a5568', x = f.x, y = f.y, w = f.w, h = f.h, brown = IM.sat(col) > 0.3 && hexRgb(col)[0] > hexRgb(col)[2] + 20;
    IM.shadow(c, x, y + 3, w, h - 2, 5, 5, 0.3, 2, 4);
    c.fillStyle = '#15181d'; [[x + 1, y + h - 3], [x + w - 5, y + h - 3]].forEach(p => c.fillRect(p[0], p[1], 4, 3));
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, shade(col, -0.2)], [1, shade(col, -0.38)]]); rr(c, x, y, w, h, 5); c.fill();
    // seat
    c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, shade(col, 0.2)], [0.55, col], [1, shade(col, -0.1)]]); rr(c, x + 1.5, y + h * 0.32, w - 3, h * 0.62, 4); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 0.9; rr(c, x + 2.5, y + h * 0.32 + 1, w - 5, h * 0.62 - 2, 3.5); c.stroke();
    // back rest
    c.fillStyle = IM.grad(c, 0, y, 0, y + h * 0.34, [[0, shade(col, 0.16)], [1, shade(col, -0.2)]]); rr(c, x + 0.5, y, w - 1, h * 0.34, 3.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 4, y + 0.8, w - 8, 1);
    if (brown) { c.fillStyle = 'rgba(' + IM.INK + ',.2)'; for (let k = 1; k < 4; k++) c.fillRect(x + k * w / 4 - 0.5, y + 2, 1, h * 0.26); IM.grain(c, x, y + h * 0.32, w, h * 0.62, fsd(f), 0.8, true); }
    else IM.weave(c, x + 1.5, y + h * 0.32, w - 3, h * 0.62, 0.7, 4);
  },
  stool(c, f) {
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2, col = f.c || '#c0392b', rx = f.w / 2, ry = f.h / 2;
    IM.shadow(c, f.x, f.y + 2, f.w, f.h, ry, 5, 0.34, 2.5, 4.5);
    c.fillStyle = '#9aa7ad'; c.beginPath(); c.ellipse(cx, cy + ry * 0.55, rx * 0.45, ry * 0.22, 0, 0, 7); c.fill();
    c.fillStyle = IM.grad(c, 0, f.y, 0, f.y + f.h, [[0, '#f0f4f6'], [1, '#7a8791']]); c.beginPath(); c.ellipse(cx, cy + 2.2, rx, ry, 0, 0, 7); c.fill();   // chrome rim
    c.fillStyle = IM.grad(c, f.x, f.y, f.x + f.w, f.y + f.h, [[0, shade(col, 0.22)], [0.6, col], [1, shade(col, -0.2)]]); c.beginPath(); c.ellipse(cx, cy, rx - 1.4, ry - 1.4, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(cx - rx * 0.3, cy - ry * 0.3, rx * 0.34, ry * 0.2, -0.4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, 7); c.stroke();
    c.fillStyle = shade(col, -0.35); c.beginPath(); c.arc(cx, cy, 1.1, 0, 7); c.fill();
  },
  counter(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#8b6240', top = f.top || '#d9d3c6', rgb = hexRgb(top), th = Math.min(h * 0.58, 27), sd = fsd(f);
    const fh = Math.max(5, h - th);
    box(c, x, y, w, h, col, null, { fh, r: 3 });
    // cabinet front: recessed panels and little handles
    const np = Math.max(1, Math.round(w / 52)), pw = w / np;
    for (let i = 0; i < np; i++) {
      const px = x + i * pw + 3;
      if (fh > 8) {
        c.fillStyle = 'rgba(' + IM.INK + ',.2)'; rr(c, px, y + h - fh + 2, pw - 6, fh - 4, 1.5); c.fill();
        c.strokeStyle = 'rgba(255,240,214,.18)'; c.lineWidth = 0.8; rr(c, px + 0.5, y + h - fh + 2.5, pw - 7, fh - 5, 1.5); c.stroke();
        c.fillStyle = '#e9d28a'; c.fillRect(px + pw / 2 - 4, y + h - fh + 3.4, 7, 1.2);
      }
    }
    // the worktop slab with a lit front edge
    IM.shadow(c, x - 1, y, w + 2, th, 2.5, 3, 0.3, 0, 2);
    c.fillStyle = IM.grad(c, x, y, x + w * 0.6, y + th, [[0, shade(top, 0.14)], [0.55, top], [1, shade(top, -0.07)]]); rr(c, x - 1, y, w + 2, th, 2.5); c.fill();
    const lum = rgb[0] * 0.3 + rgb[1] * 0.6 + rgb[2] * 0.1;
    if (lum > 190) { IM.pat(c, 'iw_lino', x, y, w, th, 0.5, 2.5); c.strokeStyle = 'rgba(110,100,86,.14)'; c.lineWidth = 0.7; for (let k = 0; k < 3; k++) { const vx = x + hash01(k, sd, 3) * w; c.beginPath(); c.moveTo(vx, y); c.quadraticCurveTo(vx + 8, y + th * 0.5, vx - 4, y + th); c.stroke(); } }
    else IM.grain(c, x, y, w, th, sd, 0.8);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 1, y, w - 2, 1.4); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 1, y + th - 2.6, w - 2, 1);
    c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.fillRect(x - 1, y + th, w + 2, 1.6);
    if (f.label) signText(c, f.label, x + w / 2, y + th / 2 + 1, f.fs || 10, lum > 150 ? '#3a3226' : '#ffffff');
    // a few things left on the counter, so no two look alike
    const cp = ROOMCTX.st && ROOMCTX.st.cprops;
    if (cp && !f.label && w > 90 && th > 18 && !f.noprops) {
      const n = Math.max(2, Math.floor((w - 24) / 52));
      for (let i = 0; i < n; i++) { const nm = cp[(i + (sd & 7)) % cp.length]; PROP.on[nm](c, x + 16 + (i + 0.5) * (w - 32) / n, y + th * 0.52 + ((i * 7 + sd) % 3 - 1) * 1.6); }
    } else if (!f.label && w > 90 && th > 18 && !f.noprops) {
      const k = sd & 3;
      if (k === 0) PROP.mug(c, x + w * 0.2, y + th * 0.55);
      else if (k === 1) PROP.napkins(c, x + w * 0.74, y + th * 0.3, 9, 6);
      else if (k === 2) PROP.plantSm(c, x + w * 0.88, y + th * 0.8, 0.9);
      else PROP.paper(c, x + w * 0.3, y + th * 0.2, 10, 12, 0.15, 3);
    }
  },
  register(c, f) {
    FURN.counter(c, Object.assign({}, f, { label: null, noprops: true }));
    const cx = f.x + f.w / 2;
    // till with a customer display, a card reader and a printer
    PROP.monitor(c, cx - 14, f.y + 3, 28, 15, '#1a2a1e');
    c.fillStyle = '#3a414a'; rr(c, cx - 15, f.y + 21, 30, 5, 1.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(cx - 14, f.y + 21, 28, 0.8);
    c.fillStyle = '#c9cdd2'; for (let i = 0; i < 4; i++) c.fillRect(cx - 12 + i * 6.4, f.y + 22.6, 5, 1.6);
    c.fillStyle = '#2b2f36'; rr(c, cx + 20, f.y + 8, 9, 13, 2); c.fill(); c.fillStyle = '#9be7a8'; c.fillRect(cx + 21.6, f.y + 9.6, 5.8, 3);
    c.fillStyle = '#f6f1e7'; c.fillRect(cx - 28, f.y + 10, 8, 12); c.fillStyle = '#e8e2d2'; c.fillRect(cx - 28, f.y + 12, 8, 1);
    PROP.cup(c, f.x + f.w * 0.12, f.y + 14, '#e63946');
  },
  shelf(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, rows = h > 52 ? 3 : h > 36 ? 2 : 1, lab = (f.label || '').toUpperCase();
    const kind = /BREAKFAST/.test(lab) ? 'cereal' : /SNACK/.test(lab) ? 'snack' : /LUNCH/.test(lab) ? 'lunch' : /DINNER/.test(lab) ? 'dinner' : /VITAMIN/.test(lab) ? 'pills' : /FIRST AID/.test(lab) ? 'aid' : /COLD/.test(lab) ? 'cold' : /SKIN/.test(lab) ? 'skin' : /TOOLS/.test(lab) ? 'gear' : /PAINT/.test(lab) ? 'paint' : /GARDEN/.test(lab) ? 'garden' : /PLUMB/.test(lab) ? 'pipes' : /GEAR|CAPS/.test(lab) ? 'gear' : /PRODUCT/.test(lab) ? 'hair' : /DRY/.test(lab) ? 'dry' : /PARTS/.test(lab) ? 'parts' : h < 30 ? 'pills' : 'mix';
    const cols = f.cols || ['#e63946', '#f4a261', '#8ac926', '#ffca3a', '#4cc9f0', '#c77dff', '#f1faee'];
    box(c, x, y, w, h, '#7d8a94', 'rgba(255,255,255,.2)', { fh: 4, noShadow: false });
    // the gondola: dark back panel, steel uprights, shelf boards with lit edges
    const lab_h = f.label ? 12 : 0, ix = x + 3, iw = w - 6, ih = h - 9 - lab_h, iy = y + 4;
    c.fillStyle = '#2e353c'; c.fillRect(ix, iy, iw, ih);
    IM.pat(c, 'iw_noise', ix, iy, iw, ih, 0.5);
    const rh = ih / rows;
    for (let r = 0; r < rows; r++) {
      const by = iy + (r + 1) * rh - 2.2;
      PROP.stock(c, kind, ix, ix + iw, by, rh - 5, (f.s || 0) * 7 + r + fsd(f), cols);
      c.fillStyle = IM.grad(c, 0, by, 0, by + 3, [[0, '#cfd6db'], [1, '#7a8791']]); c.fillRect(ix, by, iw, 2.8);
      c.fillStyle = '#f4f1ea'; for (let k = 0; k < iw / 14; k++) c.fillRect(ix + 3 + k * 14, by + 0.8, 5, 1.2);   // price tags
      c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(ix, by + 2.8, iw, 1.4);
    }
    c.fillStyle = '#9aa7b0'; c.fillRect(x + 1.6, y + 3, 2, h - 8); c.fillRect(x + w - 3.6, y + 3, 2, h - 8);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 1.6, y + 3, 0.8, h - 8);
    if (f.label) { c.fillStyle = IM.grad(c, 0, y + h - 14, 0, y + h - 2, [[0, '#fbf8ef'], [1, '#e2dac6']]); rr(c, x + 4, y + h - 13, w - 8, 10, 2); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.18)'; c.fillRect(x + 5, y + h - 4, w - 10, 1); signText(c, f.label, x + w / 2, y + h - 7.6, 8, '#33261a'); }
  },
  bookshelf(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, sd = fsd(f);
    box(c, x, y, w, h, '#6b4a30', null, { fh: 5 });
    IM.grain(c, x, y, w, h, sd, 0.9);
    const rows = Math.max(2, Math.floor((h - 8) / 19)), iy = y + 4, ih = h - 10, iw = w - 8, ix = x + 4, rh = ih / rows;
    c.fillStyle = '#2a1c12'; c.fillRect(ix, iy, iw, ih);
    for (let r = 0; r < rows; r++) {
      const by = iy + (r + 1) * rh - 2.4;
      PROP.books(c, ix, ix + iw, by, rh - 3, sd + r * 11);
      c.fillStyle = IM.grad(c, 0, by, 0, by + 3, [[0, '#a07850'], [1, '#6b4a30']]); c.fillRect(ix, by, iw, 3);
      c.fillStyle = 'rgba(255,240,214,.4)'; c.fillRect(ix, by, iw, 0.9);
      c.fillStyle = 'rgba(' + IM.INK + ',.4)'; c.fillRect(ix, by + 3, iw, 1.4);
      // shadow cast by the board above, on the books
      if (r) { c.fillStyle = IM.grad(c, 0, by - rh, 0, by - rh + 5, [[0, 'rgba(' + IM.INK + ',.35)'], [1, 'rgba(' + IM.INK + ',0)']]); c.fillRect(ix, by - rh + 3, iw, 5); }
    }
    c.fillStyle = 'rgba(255,240,214,.16)'; c.fillRect(x + 1, y + 1, 1, h - 7);
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + w - 3, y + 3, 1.5, h - 8);
  },
  fridge(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, steel = ROOMCTX.st && ROOMCTX.st.fridge === 'steel', col = steel ? '#c4ccd1' : '#e8edf0', sd = fsd(f);
    box(c, x, y, w, h, col, 'rgba(255,255,255,.4)', { fh: Math.max(10, h - 12) });
    const ty = y + 8, hh = h - 8;
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, 'rgba(255,255,255,.45)'], [0.35, 'rgba(255,255,255,.06)'], [0.75, 'rgba(255,255,255,0)'], [1, 'rgba(' + IM.INK + ',.16)']]); c.fillRect(x + 1, ty, w - 2, hh - 3);
    if (steel) IM.brushed(c, x, ty, w, hh - 3, 1);
    const split = y + h * (f.h > 50 ? 0.4 : 0.55);
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 1, split, w - 2, 1.8); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 1, split + 1.8, w - 2, 0.9);
    c.fillStyle = IM.grad(c, x + w - 9, 0, x + w - 5.4, 0, [[0, '#f4f6f7'], [1, '#7f8c93']]); rr(c, x + w - 9, ty + 3, 3.6, Math.min(16, (split - ty) - 6), 1.6); c.fill(); rr(c, x + w - 9, split + 5, 3.6, Math.min(18, y + h - split - 14), 1.6); c.fill();
    c.fillStyle = 'rgba(' + IM.INK + ',.25)'; c.fillRect(x + w - 5.6, ty + 4, 0.8, 12);
    if (f.w <= 52 && f.h >= 60) {   // magnets, a photo and a shopping list
      c.fillStyle = '#ffd166'; c.fillRect(x + 7, y + 12, 8, 9); c.fillStyle = '#ef476f'; c.fillRect(x + 18, y + 15, 6, 6);
      PROP.paper(c, x + 8, split + 6, 11, 14, 0.08, 4);
      c.fillStyle = '#4361ee'; c.beginPath(); c.arc(x + 22, split + 9, 2, 0, 7); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + 13, split + 6, 1.6, 0, 7); c.fill();
    }
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 4, y + h - 5, w - 8, 1.2); for (let k = 0; k < 5; k++) c.fillRect(x + 5 + k * ((w - 10) / 5), y + h - 4, 1, 2);
    if (sd & 1) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 4, y + 2, w - 8, 1.2); }
  },
  stove(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, big = w > 80, steel = IM.lum('#4a5058') > 0.2;
    const fh = Math.min(20, h * 0.42);
    box(c, x, y, w, h, '#4a5058', 'rgba(255,255,255,.2)', { fh });
    // hob: black glass or steel, burners with grates
    c.fillStyle = IM.grad(c, 0, y, 0, y + h - fh, [[0, '#1a1e24'], [1, '#2a3037']]); rr(c, x + 2, y + 2, w - 4, h - fh - 3, 2); c.fill();
    const nb = big ? 6 : 4, cols = big ? 3 : 2, rowsN = 2, r = Math.min((w - 8) / cols, (h - fh - 6) / rowsN) * 0.32;
    for (let i = 0; i < nb; i++) {
      const bx = x + 4 + ((i % cols) + 0.5) * (w - 8) / cols, by = y + 4 + (((i / cols) | 0) + 0.5) * (h - fh - 6) / rowsN;
      c.fillStyle = '#0b0d10'; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
      c.strokeStyle = (i === 1 || (big && i === 4)) ? '#ff7a45' : '#5d666d'; c.lineWidth = 1.3; c.beginPath(); c.arc(bx, by, r * 0.62, 0, 7); c.stroke();
      c.strokeStyle = '#6b747b'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx - r * 0.95, by); c.lineTo(bx + r * 0.95, by); c.moveTo(bx, by - r * 0.95); c.lineTo(bx, by + r * 0.95); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(bx - r * 0.3, by - r * 0.3, r * 0.3, 0, 7); c.fill();
    }
    // oven door and knobs
    const dy = y + h - fh + 2;
    c.fillStyle = '#2e343b'; rr(c, x + 3, dy, w - 6, fh - 5, 2); c.fill();
    c.fillStyle = IM.grad(c, 0, dy, 0, dy + fh - 8, [[0, 'rgba(120,150,170,.4)'], [1, 'rgba(20,28,36,.3)']]); rr(c, x + 6, dy + 2, w - 12, fh - 10, 1.5); c.fill();
    IM.glints(c, x + 6, dy + 2, w - 12, fh - 10, 0.16);
    c.fillStyle = '#c9cdd2'; c.fillRect(x + 8, dy + 0.4, w - 16, 1.4);
    for (let i = 0; i < Math.round(w / 15); i++) IM.knob(c, x + w * (0.14 + i * 0.72 / Math.max(1, Math.round(w / 15) - 1 || 1)), y + h - 3.6, 1.6, '#d9dde0');
    lbl(c, f);
  },
  sink(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#b9b2a2', dark = IM.lum(col) < 0.3;
    box(c, x, y, w, h, col, 'rgba(255,255,255,.3)', { fh: Math.min(12, h * 0.3) });
    const bw = Math.min(40, w - 16), bx = x + w / 2 - bw / 2, by = y + 8, bh = h - 24;
    c.fillStyle = IM.grad(c, 0, by, 0, by + bh, [[0, dark ? '#101216' : '#6f93a6'], [1, dark ? '#2a2f36' : '#a9ccd9']]); rr(c, bx, by, bw, bh, 5); c.fill();
    c.strokeStyle = dark ? '#4a4f57' : '#dfe6ea'; c.lineWidth = 1.6; rr(c, bx, by, bw, bh, 5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(bx + bw * 0.34, by + bh * 0.34, bw * 0.2, bh * 0.1, -0.2, 0, 7); c.fill();
    c.fillStyle = '#2a3037'; c.beginPath(); c.arc(bx + bw / 2, by + bh * 0.62, 1.6, 0, 7); c.fill();
    // chrome gooseneck tap and handles
    c.strokeStyle = '#d5dde1'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + w / 2, y + 3); c.lineTo(x + w / 2, y + 8); c.stroke();
    c.fillStyle = '#e4eaed'; c.beginPath(); c.arc(x + w / 2, y + 3, 2.8, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x + w / 2 - 0.8, y + 2.2, 1, 0, 7); c.fill();
    c.lineCap = 'butt'; IM.knob(c, x + w / 2 - 9, y + 4, 1.9, '#e4eaed'); IM.knob(c, x + w / 2 + 9, y + 4, 1.9, '#e4eaed');
    // a draining board with a plate and a cup on wide sinks
    if (w > 66 && !dark) { c.fillStyle = 'rgba(' + IM.INK + ',.1)'; for (let k = 0; k < 5; k++) c.fillRect(x + w - 16, by + 2 + k * 3.4, 12, 1); PROP.plate(c, x + 12, y + h * 0.4, 5.4); }
  },
  tv(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    // a low media console under the panel, panel as a thin glossy slab
    IM.contact(c, x, y, w, h, 3);
    c.fillStyle = '#2a2018'; c.fillRect(x + 8, y + h - 5, 5, 5); c.fillRect(x + w - 13, y + h - 5, 5, 5);
    c.fillStyle = IM.grad(c, 0, y + h - 9, 0, y + h - 2, [[0, '#6b4a30'], [1, '#3a2616']]); rr(c, x + 3, y + h - 9, w - 6, 8, 2); c.fill();
    c.fillStyle = 'rgba(255,240,214,.3)'; c.fillRect(x + 5, y + h - 9, w - 10, 1);
    c.fillStyle = '#10141a'; rr(c, x, y, w, h - 8, 2.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 1, y + 0.3, w - 2, 0.8);
    c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, '#27384a'], [1, '#0f1822']]); c.fillRect(x + 3, y + 2.4, w - 6, h - 13);
    IM.glints(c, x + 3, y + 2.4, w - 6, h - 13, 0.2);
    c.fillStyle = '#6b6f76'; c.fillRect(x + w / 2 - 5, y + h - 9, 10, 1);
    c.fillStyle = '#3bff6a'; c.fillRect(x + w - 6, y + h - 12, 1.4, 1.4);
  },
  plant(c, f) {
    const cx = f.x + f.w / 2, by = f.y + f.h, sd = fsd(f), k = sd % 3;
    IM.shadow(c, cx - f.w / 2, by - 6, f.w, 8, 4, 5, 0.32, 3, 3);
    // terracotta pot with a rim, a band and soil
    c.fillStyle = IM.grad(c, cx - 9, 0, cx + 9, 0, [[0, '#c97a52'], [0.5, '#a4623f'], [1, '#7e4a30']]); c.beginPath(); c.moveTo(cx - 9, by - 13); c.lineTo(cx + 9, by - 13); c.lineTo(cx + 7, by); c.lineTo(cx - 7, by); c.closePath(); c.fill();
    c.fillStyle = IM.grad(c, cx - 10, 0, cx + 10, 0, [[0, '#d98a60'], [1, '#8a5234']]); rr(c, cx - 10, by - 15, 20, 4.4, 1.6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(cx - 9, by - 15, 18, 1); c.fillStyle = '#3a2418'; c.fillRect(cx - 8, by - 12.4, 16, 1.6);
    c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(cx - 7, by - 5, 14, 1.2);
    const leaf = (a, len, wd, col, hi, ox, oy) => {
      c.save(); c.translate(cx + (ox || 0), by - 14 + (oy || 0)); c.rotate(a);
      c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(wd, -len * 0.45, 0, -len); c.quadraticCurveTo(-wd, -len * 0.45, 0, 0); c.fill();
      c.strokeStyle = hi; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -len * 0.9); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(wd * 0.1, -len * 0.45, 0, -len); c.quadraticCurveTo(wd, -len * 0.45, 0, 0); c.fill();
      c.restore();
    };
    const r = IM.rng(sd, 3, 4);
    if (k === 0) { for (let i = 0; i < 9; i++) leaf(-1.3 + i * 0.33 + (r() - 0.5) * 0.2, 14 + r() * 7, 3.4 + r() * 1.4, i % 2 ? '#2c7a4c' : '#378d57', 'rgba(255,255,255,.3)'); }   // a leafy fern
    else if (k === 1) { for (let i = 0; i < 7; i++) leaf(-1.4 + i * 0.46 + (r() - 0.5) * 0.3, 11 + r() * 8, 5.4 + r(), i % 2 ? '#2f8a50' : '#3f9e62', 'rgba(255,255,255,.35)', (i - 3) * 1.2, 0); c.fillStyle = '#ff7a95'; c.beginPath(); c.arc(cx + 3, by - 28, 2, 0, 7); c.fill(); }   // broad leaves and a flower
    else { for (let i = 0; i < 6; i++) leaf(-0.7 + i * 0.28 + (r() - 0.5) * 0.12, 20 + r() * 4, 2.5, i % 2 ? '#3d7a45' : '#2f6a3c', '#d9e68a', (i - 3) * 1.6, 0); }   // snake plant
  },
  cooler(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#cfd8de', 'rgba(255,255,255,.5)', { fh: Math.max(10, h - 10) });
    const ix = x + 3, iy = y + 5, iw = w - 6, ih = h - 12;
    c.fillStyle = '#dff1fa'; c.fillRect(ix, iy, iw, ih);
    c.fillStyle = IM.grad(c, 0, iy, 0, iy + ih, [[0, '#f6fcff'], [1, '#bfe0ee']]); c.fillRect(ix, iy, iw, ih);
    const cols = ['#4cc9f0', '#f4a261', '#8ac926', '#e63946', '#ffca3a', '#c77dff'], rows = ih > 36 ? 2 : 1, rh = ih / rows;
    for (let r = 0; r < rows; r++) {
      const by = iy + (r + 1) * rh - 2.6, r2 = IM.rng(fsd(f), r, 1);
      for (let xx = ix + 2; xx < ix + iw - 8; xx += 9) {
        const col = cols[(r2() * cols.length) | 0], bw = 6 + r2() * 1.6, bh = rh - 8;
        PROP.bottle(c, xx, by - bh, bw, bh, col);
      }
      c.fillStyle = IM.grad(c, 0, by, 0, by + 3, [[0, '#dfe8ed'], [1, '#8a979f']]); c.fillRect(ix, by, iw, 2.6);
    }
    const nd = Math.max(1, Math.round(w / 46));
    for (let i = 1; i < nd; i++) { c.fillStyle = '#9aa7b0'; c.fillRect(ix + i * iw / nd - 1, iy, 2, ih); }
    for (let i = 0; i < nd; i++) { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(ix + (i + 1) * iw / nd - 6, iy + ih * 0.3, 1.8, ih * 0.4); }
    IM.glints(c, ix, iy, iw, ih, 0.26);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(ix, iy, iw, 1.2);
    c.fillStyle = '#e63946'; c.fillRect(x + 4, y + h - 5.4, 7, 2.2); c.fillStyle = '#2a2f36'; for (let k = 0; k < 8; k++) c.fillRect(x + w - 30 + k * 3, y + h - 5, 1.6, 3);
    litRect(ix, iy, iw, ih);
  },
  bench(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, sb = ROOMCTX.st && ROOMCTX.st.bench, pad = !!sb || (f.c && IM.sat(f.c) > 0.25 && f.c !== '#9a6b45'), col = f.c || sb || '#9a6b45';
    IM.shadow(c, x + 2, y + 6, w - 2, h - 6, 3, 5, 0.3, 2.5, 4.5);
    c.fillStyle = '#2f2a26'; c.fillRect(x + 6, y + h - 8, 5, 8); c.fillRect(x + w - 11, y + h - 8, 5, 8);
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(x + 6, y + h - 8, 1, 8);
    if (pad) {   // an upholstered waiting bench
      c.fillStyle = IM.grad(c, 0, y + 4, 0, y + h - 4, [[0, shade(col, 0.2)], [1, shade(col, -0.15)]]); rr(c, x, y + 3, w, h - 8, 5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, x + 1.6, y + 4.6, w - 3.2, h - 11.2, 4); c.stroke();
      for (let k = 1; k < Math.round(w / 44); k++) { c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.fillRect(x + k * w / Math.round(w / 44) - 0.6, y + 5, 1.2, h - 12); }
      IM.pat(c, 'iw_leather', x, y + 3, w, h - 8, 0.7, 5);
    } else {
      c.fillStyle = shade(col, -0.35); rr(c, x, y + 5, w, h - 8, 2); c.fill();
      for (let k = 0; k < 3; k++) { const sy = y + 4 + k * ((h - 9) / 3); c.fillStyle = IM.grad(c, 0, sy, 0, sy + (h - 9) / 3, [[0, shade(col, 0.14)], [1, shade(col, -0.08)]]); rr(c, x, sy, w, (h - 9) / 3 - 1, 1.4); c.fill(); IM.grain(c, x, sy, w, (h - 9) / 3 - 1, fsd(f) + k, 1); c.fillStyle = 'rgba(255,240,214,.34)'; c.fillRect(x + 1, sy, w - 2, 0.9); }
    }
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 1, y + h - 5, w - 2, 1.2);
  },
  machine(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#4a4f55', lab = (f.label || '').toUpperCase(), scr = f.screen || '#6fd1ff';
    const vending = /SNACKS|SODA/.test(lab) && h >= 60, dispenser = /H2O/.test(lab), arcade = /ARCADE/.test(lab), industrial = /CNC|LATHE|3D/.test(lab), bp = lab === 'BP', cook = /GRILL|FRYER|OVEN/.test(lab), coffee = /COFFEE/.test(lab) || (f.screen === '#ff9f43' && !cook && !industrial);
    box(c, x, y, w, h, col, 'rgba(255,255,255,.22)', { fh: Math.max(8, Math.min(h * 0.5, 30)) });
    IM.brushed(c, x + 1, y + 1, w - 2, h - 2, 0.8, 2);
    if (vending) {
      const wx = x + 4, wy = y + 14, ww = w - 16, wh = h - 36;
      c.fillStyle = IM.grad(c, 0, y + 2, 0, y + 12, [[0, "#f6f1e7"], [1, "#d9d3c4"]]); rr(c, x + 3, y + 2, w - 6, 10, 2); c.fill(); signText(c, f.label, x + w / 2, y + 7.4, Math.min(f.fs || 8, 8), "#2b2f36");
      c.fillStyle = '#0e1318'; c.fillRect(wx, wy, ww, wh);
      const r = IM.rng(fsd(f), 1, 2), pal = ['#e63946', '#ffca3a', '#4cc9f0', '#8ac926', '#f4a261', '#c77dff'], rowsN = Math.max(2, Math.floor(wh / 12));
      for (let rr_ = 0; rr_ < rowsN; rr_++) { const by = wy + (rr_ + 1) * wh / rowsN - 2; for (let xx = wx + 2; xx < wx + ww - 6; xx += 8) PROP.stockItem[r() < 0.5 ? 'bag' : 'box'](c, xx, by, 6.4, wh / rowsN - 5, pal[(r() * pal.length) | 0], r); c.fillStyle = '#9aa7b0'; c.fillRect(wx, by, ww, 1.2); }
      IM.glints(c, wx, wy, ww, wh, 0.22);
      // keypad and coin slot on the right
      c.fillStyle = '#1b2026'; c.fillRect(x + w - 10, y + 14, 7, wh); c.fillStyle = '#c9cdd2'; for (let k = 0; k < 6; k++) c.fillRect(x + w - 9, y + 17 + k * 4, 5, 2.4);
      c.fillStyle = '#12161b'; rr(c, x + 5, y + h - 20, w - 10, 11, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 6, y + h - 19, w - 12, 0.8);
    } else if (dispenser) {
      c.fillStyle = IM.grad(c, 0, y + 4, 0, y + h * 0.5, [[0, 'rgba(120,200,255,.9)'], [1, 'rgba(60,140,210,.9)']]); rr(c, x + 5, y + 4, w - 10, h * 0.42, 8); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x + 8, y + 7, 2.4, h * 0.34); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 6, y + h * 0.18, w - 12, 1);
      c.fillStyle = '#e6edf0'; rr(c, x + 3, y + h * 0.5, w - 6, h * 0.42, 3); c.fill();
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + w * 0.32, y + h * 0.62, 2.2, 0, 7); c.fill(); c.fillStyle = '#4361ee'; c.beginPath(); c.arc(x + w * 0.68, y + h * 0.62, 2.2, 0, 7); c.fill();
      c.fillStyle = '#3a414a'; c.fillRect(x + w / 2 - 6, y + h * 0.74, 12, 3);
    } else if (arcade) {
      c.fillStyle = '#12151a'; rr(c, x + 4, y + 8, w - 8, h * 0.34, 3); c.fill();
      c.fillStyle = IM.grad(c, x, y + 10, x + w, y + h * 0.4, [[0, '#f72585'], [1, '#7209b7']]); c.fillRect(x + 6, y + 10, w - 12, h * 0.3);
      c.fillStyle = scr; c.fillRect(x + 10, y + 14, w - 20, h * 0.18);
      c.fillStyle = '#20262d'; c.fillRect(x + 3, y + h * 0.54, w - 6, h * 0.18);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + w * 0.3, y + h * 0.62, 2.4, 0, 7); c.fill(); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x + w * 0.62, y + h * 0.6, 1.8, 0, 7); c.arc(x + w * 0.76, y + h * 0.64, 1.8, 0, 7); c.fill();
      c.fillStyle = '#ffd166'; c.fillRect(x + 6, y + 2, w - 12, 4);
    } else if (industrial) {
      c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, shade(col, 0.1)], [1, shade(col, -0.2)]]); rr(c, x + 2, y + 3, w - 4, h - 12, 3); c.fill();
      c.fillStyle = '#f4c20d'; c.fillRect(x + 2, y + 3, w - 4, 4); for (let k = 0; k < w; k += 8) { c.fillStyle = '#20262d'; c.beginPath(); c.moveTo(x + 2 + k, y + 3); c.lineTo(x + 6 + k, y + 3); c.lineTo(x + 2 + k, y + 7); c.closePath(); c.fill(); }
      c.fillStyle = '#10141a'; rr(c, x + 8, y + 12, w * 0.55, h * 0.34, 3); c.fill(); IM.glints(c, x + 8, y + 12, w * 0.55, h * 0.34, 0.22);
      c.fillStyle = '#7a8791'; c.fillRect(x + 12, y + 12 + h * 0.2, w * 0.4, 3);
      c.fillStyle = '#20262d'; rr(c, x + w * 0.7, y + 12, w * 0.24, h * 0.34, 2); c.fill(); c.fillStyle = scr; c.fillRect(x + w * 0.72, y + 14, w * 0.2, 8);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + w * 0.76, y + 28, 2, 0, 7); c.fill(); c.fillStyle = '#3bff6a'; c.beginPath(); c.arc(x + w * 0.86, y + 28, 2, 0, 7); c.fill();
    } else if (bp) {
      c.fillStyle = '#1b2d38'; rr(c, x + 6, y + 8, w - 12, 18, 3); c.fill(); c.fillStyle = scr; c.fillRect(x + 8, y + 10, w - 16, 14);
      c.fillStyle = '#e9e4d8'; rr(c, x + 6, y + 32, w - 12, h - 44, 8); c.fill(); c.strokeStyle = '#9aa7ad'; c.lineWidth = 1.4; rr(c, x + 10, y + 36, w - 20, h - 52, 6); c.stroke();
    } else if (cook) {
      c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#dfe5e8'], [1, '#8d9aa2']]); rr(c, x + 2, y + 2, w - 4, h - 4, 2); c.fill(); IM.brushed(c, x + 2, y + 2, w - 4, h - 4, 1);
      c.fillStyle = '#15191e'; rr(c, x + 5, y + 8, w - 10, Math.min(18, h * 0.4), 2); c.fill();
      c.fillStyle = scr; c.globalAlpha = 0.5; c.fillRect(x + 6, y + 9, w - 12, 5); c.globalAlpha = 1;
      for (let i = 0; i < Math.round(w / 16); i++) IM.knob(c, x + 8 + i * ((w - 16) / Math.max(1, Math.round(w / 16) - 1)), y + h - 9, 2, '#cfd5d9');
    } else if (coffee) {
      c.fillStyle = '#1b1613'; rr(c, x + 3, y + 5, w - 6, h * 0.5, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x + 5, y + 6, w - 10, 1);
      c.fillStyle = '#10141a'; c.fillRect(x + 8, y + 10, w - 16, 7); c.fillStyle = scr; c.fillRect(x + 9, y + 11, w - 18, 5);
      c.fillStyle = '#c9cdd2'; c.fillRect(x + w / 2 - 3, y + h * 0.36, 6, 4); c.fillStyle = '#f4f1ea'; rr(c, x + w / 2 - 5, y + h * 0.52, 10, 8, 2); c.fill();
    } else {
      c.fillStyle = '#10141a'; rr(c, x + 4, y + 6, w - 8, Math.min(20, h * 0.34), 2); c.fill();
      c.fillStyle = scr; c.fillRect(x + 6, y + 8, w - 12, Math.min(16, h * 0.3) - 2); IM.glints(c, x + 6, y + 8, w - 12, Math.min(16, h * 0.3) - 2, 0.18);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 5, y + h - 15, w - 10, 8);
      c.fillStyle = '#c9cdd2'; for (let k = 0; k < (w - 12) / 6; k++) c.fillRect(x + 7 + k * 6, y + h - 13.4, 3.6, 4.4);
    }
    if (!vending && f.label) plaque(c, f, f.label, y + h - 13, IM.lum(col) < 0.5 || industrial || arcade);
  },
  cabinet(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#8b6240', pale = IM.lum(col) > 0.6;
    box(c, x, y, w, h, col, null, { fh: Math.max(6, h * 0.8) });
    const n = Math.max(2, Math.round(w / 36)), dw = (w - 6) / n, lh = f.label ? 13 : 0, h2 = h - lh;
    for (let i = 0; i < n; i++) {
      const dx = x + 3 + i * dw;
      c.fillStyle = 'rgba(' + IM.INK + ',.22)'; rr(c, dx, y + 8, dw - 2, h2 - 12, 1.8); c.fill();
      if (pale) {   // glass-fronted medical cabinet with boxes inside
        c.fillStyle = 'rgba(200,225,235,.7)'; c.fillRect(dx + 1.4, y + 9.4, dw - 4.8, h2 - 15); PROP.stock(c, 'aid', dx + 1.4, dx + dw - 3.4, y + 9.4 + (h2 - 15) / 2 - 1, (h2 - 15) / 2 - 3, i + 3, ['#e63946', '#8ecae6', '#f4f7f9', '#e9c46a']); PROP.stock(c, 'cold', dx + 1.4, dx + dw - 3.4, y + h2 - 8, (h2 - 15) / 2 - 3, i + 9, ['#4cc9f0', '#f4f7f9', '#c77dff']);
        IM.glints(c, dx + 1.4, y + 9.4, dw - 4.8, h2 - 15, 0.3);
      } else { c.strokeStyle = 'rgba(255,240,214,.2)'; c.lineWidth = 0.9; rr(c, dx + 1.6, y + 10, dw - 5.2, h2 - 16, 1.2); c.stroke(); IM.grain(c, dx, y + 8, dw - 2, h2 - 12, fsd(f) + i, 0.8, true); }
      c.fillStyle = '#e9c46a'; rr(c, dx + dw - 6, y + h2 * 0.5 - 2, 2.4, 7, 1); c.fill();
    }
    if (f.label) plaque(c, f, f.label, y + h - 14, !pale);
  },
  booth(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#a83a3a';
    IM.contact(c, x, y, w, h, 5, 1.1);
    c.fillStyle = shade(col, -0.5); rr(c, x, y, w, h, 5); c.fill();
    // the two bench seats, tufted vinyl with piping and chrome rails
    const seat = (sy, sh, flip) => {
      c.fillStyle = IM.grad(c, 0, sy, 0, sy + sh, [[0, shade(col, flip ? -0.1 : 0.16)], [1, shade(col, flip ? 0.16 : -0.14)]]); rr(c, x + 1, sy, w - 2, sh, 5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; rr(c, x + 3, sy + 2, w - 6, sh - 4, 4); c.stroke();
      for (let k = 0; k < Math.round(w / 22); k++) { const bx = x + 12 + k * (w - 24) / Math.max(1, Math.round(w / 22) - 1); c.fillStyle = shade(col, -0.4); c.beginPath(); c.arc(bx, sy + sh / 2, 1.5, 0, 7); c.fill(); c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx - 8, sy + 3); c.lineTo(bx, sy + sh / 2); c.lineTo(bx + 8, sy + 3); c.stroke(); }
      IM.pat(c, 'iw_leather', x + 1, sy, w - 2, sh, 0.8, 5);
    };
    seat(y + 1, 18, false); seat(y + h - 19, 18, true);
    c.fillStyle = IM.grad(c, 0, y + 16, 0, y + 22, [[0, '#f0f4f6'], [1, '#8a979f']]); c.fillRect(x + 3, y + 18, w - 6, 2.4); c.fillRect(x + 3, y + h - 22, w - 6, 2.4);
    // formica table with a chrome edge, napkins, shakers, menu, ketchup and mustard
    const tx = x + 10, ty = y + 24, tw = w - 20, th = h - 48;
    IM.shadow(c, tx, ty, tw, th, 3, 5, 0.34, 1.5, 3);
    c.fillStyle = IM.grad(c, 0, ty, 0, ty + th, [[0, '#f0f4f6'], [1, '#98a5ad']]); rr(c, tx - 1.4, ty - 1.4, tw + 2.8, th + 2.8, 4); c.fill();
    c.fillStyle = IM.grad(c, tx, ty, tx + tw, ty + th, [[0, '#ece7da'], [1, '#d3cdbd']]); rr(c, tx, ty, tw, th, 3); c.fill();
    IM.pat(c, 'iw_lino', tx, ty, tw, th, 0.5, 3);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(tx + 1, ty + 1, tw * 0.5, 1.2);
    PROP.napkins(c, x + w / 2 - 12, y + h / 2 - 5, 7, 6); PROP.shaker(c, x + w / 2 - 2, y + h / 2 - 1); PROP.shaker(c, x + w / 2 + 4, y + h / 2 - 1, '#e9c46a');
    c.fillStyle = '#c0392b'; rr(c, x + w / 2 + 10, y + h / 2 - 7, 4.4, 9, 1.8); c.fill(); c.fillStyle = '#f1c40f'; rr(c, x + w / 2 + 16, y + h / 2 - 7, 4.4, 9, 1.8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + w / 2 + 10.6, y + h / 2 - 5, 0.8, 5); c.fillRect(x + w / 2 + 16.6, y + h / 2 - 5, 0.8, 5);
    PROP.paper(c, x + w / 2 - 28, y + h / 2 - 6, 10, 13, -0.1, 4);
  },
  jukebox(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = '#a83a3a', cx = x + w / 2;
    box(c, x, y, w, h, col, 'rgba(255,255,255,.25)', { fh: Math.max(12, h - 18), r: 4 });
    // arched top with neon tubes, chrome bezels and a record window
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, '#f0f4f6'], [0.5, '#9aa7ad'], [1, '#d9dee2']]); c.beginPath(); c.arc(cx, y + h * 0.4, w * 0.4, Math.PI, 0); c.lineTo(x + w * 0.9, y + h * 0.7); c.lineTo(x + w * 0.1, y + h * 0.7); c.closePath(); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(cx, y + h * 0.4, w * 0.34, Math.PI, 0); c.lineTo(x + w * 0.84, y + h * 0.66); c.lineTo(x + w * 0.16, y + h * 0.66); c.closePath(); c.fill();
    c.fillStyle = '#1b1015'; rr(c, x + w * 0.22, y + h * 0.36, w * 0.56, h * 0.26, 3); c.fill();
    c.fillStyle = '#d6b25a'; c.beginPath(); c.arc(cx, y + h * 0.5, h * 0.1, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(cx, y + h * 0.5, h * 0.075, 0, 7); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(cx, y + h * 0.5, h * 0.03, 0, 7); c.fill();
    c.strokeStyle = '#ff7ac0'; c.lineWidth = 1.4; c.beginPath(); c.arc(cx, y + h * 0.4, w * 0.37, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.fillStyle = '#d9dee2'; c.fillRect(x + w * 0.15, y + h * 0.7, w * 0.7, 3); c.fillStyle = '#e63946'; for (let k = 0; k < 5; k++) c.fillRect(x + w * 0.2 + k * (w * 0.12), y + h * 0.74, w * 0.07, 3);
    c.fillStyle = '#1b1015'; rr(c, x + w * 0.16, y + h * 0.8, w * 0.68, h * 0.12, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; for (let k = 0; k < 8; k++) c.fillRect(x + w * 0.2 + k * 4.4, y + h * 0.82, 1.4, h * 0.08);
    IM.glints(c, x + w * 0.22, y + h * 0.36, w * 0.56, h * 0.26, 0.2);
  },
  mailbox(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#8a95a0', null, { fh: h - 6 });
    IM.brushed(c, x, y, w, h, 0.9, 2);
    const n = Math.floor((w - 8) / 22), dw = (w - 8) / n, r = IM.rng(fsd(f), 4, 5);
    for (let i = 0; i < n; i++) {
      const dx = x + 4 + i * dw;
      c.fillStyle = IM.grad(c, dx, y + 6, dx + dw, y + h - 6, [[0, '#a9b3bc'], [1, '#6b7782']]); rr(c, dx + 1, y + 7, dw - 2.6, h - 13, 1.5); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.8; rr(c, dx + 1.4, y + 7.4, dw - 3.4, h - 14, 1.3); c.stroke();
      c.fillStyle = '#1b2026'; c.fillRect(dx + 4, y + 11, dw - 9, 1.6);    // mail slot
      c.fillStyle = '#e9c46a'; c.beginPath(); c.arc(dx + dw - 6, y + h - 11, 1.5, 0, 7); c.fill();   // key lock
      c.fillStyle = '#f6f1e7'; c.fillRect(dx + 3, y + h - 14, dw - 12, 4);   // name card
      c.fillStyle = 'rgba(' + IM.INK + ',.4)'; c.fillRect(dx + 4, y + h - 12.4, (dw - 14) * (0.5 + r() * 0.5), 0.9);
    }
  },
  server(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#2a2f36', 'rgba(255,255,255,.12)', { fh: Math.max(8, h - 8) });
    c.fillStyle = '#14181d'; c.fillRect(x + 3, y + 5, w - 6, h - 12);
    c.fillStyle = '#8f9aa1'; c.fillRect(x + 1.6, y + 4, 2, h - 9); c.fillRect(x + w - 3.6, y + 4, 2, h - 9);
    const r = IM.rng(fsd(f), 6, 7);
    for (let yy = y + 7, i = 0; yy < y + h - 12; yy += 9, i++) {
      c.fillStyle = IM.grad(c, 0, yy, 0, yy + 7, [[0, '#3f4852'], [1, '#2a3037']]); c.fillRect(x + 4, yy, w - 8, 7.4);
      c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 4, yy, w - 8, 0.8);
      c.fillStyle = '#10141a'; for (let k = 0; k < 4; k++) c.fillRect(x + 6 + k * 5.6, yy + 2, 4.4, 3.2);   // drive bays
      c.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 4; k++) c.fillRect(x + 6 + k * 5.6, yy + 2, 4.4, 0.8);
      c.fillStyle = '#10141a'; for (let k = 0; k < 3; k++) c.fillRect(x + w - 20 + k * 2.2, yy + 1.6, 1, 4);   // vents
      c.fillStyle = r() < 0.5 ? '#3bff6a' : '#ffd23b'; c.fillRect(x + w - 10.5, yy + 2.6, 2.2, 2.2);
    }
    // cable bundle
    ['#3a8fd6', '#e63946', '#f4a261', '#3bff6a'].forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x + 8 + k * 7, y + h - 11); c.quadraticCurveTo(x + 10 + k * 7, y + h - 4, x + 14 + k * 6, y + h - 2); c.stroke(); });
  },
  bean(c, f) {
    const col = f.c || '#e76f51', x = f.x, y = f.y, w = f.w, h = f.h, cx = x + w / 2, cy = y + h / 2;
    IM.shadow(c, x, y + 5, w, h - 3, h / 2, 8, 0.3, 3, 5);
    c.fillStyle = IM.grad(c, x, y, x + w * 0.8, y + h, [[0, shade(col, 0.2)], [0.5, col], [1, shade(col, -0.22)]]);
    c.beginPath(); c.moveTo(x + 4, cy); c.bezierCurveTo(x - 2, y - 2, x + w * 0.4, y - 4, cx + 6, y + 2); c.bezierCurveTo(x + w + 4, y - 2, x + w + 2, cy + 4, x + w - 4, y + h - 4); c.bezierCurveTo(cx + 10, y + h + 3, x + 6, y + h + 1, x + 4, cy); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w * 0.2, y + h * 0.35); c.quadraticCurveTo(cx, y + h * 0.5, x + w * 0.78, y + h * 0.3); c.moveTo(x + w * 0.3, y + h * 0.72); c.quadraticCurveTo(cx, y + h * 0.58, x + w * 0.74, y + h * 0.7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(x + w * 0.24, y + h * 0.4); c.quadraticCurveTo(cx, y + h * 0.54, x + w * 0.8, y + h * 0.34); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(cx - w * 0.14, cy - h * 0.2, w * 0.2, h * 0.12, -0.35, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.setLineDash([2.4, 2.4]); c.lineWidth = 0.9; c.beginPath(); c.ellipse(cx, cy, w * 0.36, h * 0.34, 0, 0, 7); c.stroke(); c.setLineDash([]);
    IM.weave(c, x, y, w, h, 0.5);
  },
  board(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, lab = (f.label || '').toUpperCase(), sd = fsd(f);
    IM.shadow(c, x - 3, y - 3, w + 6, h + 6, 2, 5, 0.34, 1.5, 3.5);
    c.fillStyle = IM.grad(c, 0, y - 3, 0, y + h + 3, [[0, '#d5dadd'], [1, '#7f8a92']]); rr(c, x - 3, y - 3, w + 6, h + 6, 2); c.fill();
    c.fillStyle = f.c || '#fbfbf7'; c.fillRect(x, y, w, h);
    c.fillStyle = IM.grad(c, x, y, x + w * 0.7, y + h, [[0, 'rgba(255,255,255,.4)'], [1, 'rgba(0,0,0,.05)']]); c.fillRect(x, y, w, h);
    const r = IM.rng(sd, 8, 9);
    if (/SPRINT/.test(lab)) {   // a kanban board of sticky notes
      c.strokeStyle = 'rgba(60,70,90,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w / 3, y + 10); c.lineTo(x + w / 3, y + h - 3); c.moveTo(x + 2 * w / 3, y + 10); c.lineTo(x + 2 * w / 3, y + h - 3); c.stroke();
      ['#ffd166', '#8ecae6', '#9be7a8', '#ff9fb2'].forEach((col, i) => { for (let k = 0; k < 3; k++) { const col2 = i === 3 ? '#ffd166' : col, px = x + 5 + ((i * 17 + k * 41) % (w - 24)), py = y + 16 + ((k * 7 + i * 4) % Math.max(4, h - 30)); c.fillStyle = col2; c.fillRect(px, py, 9, 7); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(px, py + 6.2, 9, 0.8); c.fillStyle = 'rgba(60,60,80,.5)'; c.fillRect(px + 1.4, py + 2, 5, 0.8); } });
    } else if (/BLUEPRINT/.test(lab)) {
      c.strokeStyle = 'rgba(40,90,170,.22)'; c.lineWidth = 0.6; for (let gx = x + 6; gx < x + w; gx += 6) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); } for (let gy = y + 6; gy < y + h; gy += 6) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w, gy); c.stroke(); }
      c.strokeStyle = '#1f4f9a'; c.lineWidth = 1.3; c.strokeRect(x + w * 0.2, y + 14, w * 0.3, h - 20); c.beginPath(); c.arc(x + w * 0.7, y + h * 0.58, h * 0.24, 0, 7); c.moveTo(x + w * 0.58, y + h * 0.58); c.lineTo(x + w * 0.82, y + h * 0.58); c.stroke();
    } else if (/TARGET/.test(lab)) {
      c.fillStyle = '#b79bd8'; [0.3, 0.55, 0.42, 0.7].forEach((hh, i) => { c.fillRect(x + w * 0.54 + i * 10, y + h - 4 - hh * (h - 14), 7, hh * (h - 14)); }); c.strokeStyle = '#6a4a9a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w * 0.52, y + 14); c.lineTo(x + w * 0.52, y + h - 4); c.lineTo(x + w - 6, y + h - 4); c.stroke();
      c.beginPath(); c.moveTo(x + 8, y + h * 0.6); c.lineTo(x + 24, y + h * 0.5); c.lineTo(x + 40, y + h * 0.55); c.lineTo(x + 56, y + h * 0.35); c.stroke();
    } else {
      c.strokeStyle = '#5a7bd8'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 10, y + 14); c.quadraticCurveTo(x + w * 0.3, y + 11, x + w * 0.55, y + 13); c.moveTo(x + 10, y + 25); c.quadraticCurveTo(x + w * 0.4, y + 28, x + w * 0.8, y + 24); c.stroke(); c.lineCap = 'butt';
    }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, w, 1);
    c.fillStyle = IM.grad(c, 0, y + h + 3, 0, y + h + 7, [[0, '#9aa5ad'], [1, '#6f7a82']]); c.fillRect(x + 8, y + h + 2.4, w - 16, 3);   // marker tray
    ['#e63946', '#2a6f97', '#2b2f36'].forEach((col, i) => { c.fillStyle = col; c.fillRect(x + 12 + i * 8, y + h + 0.6, 6, 2.4); });
    if (f.label) { c.fillStyle = 'rgba(255,255,255,.82)'; c.fillRect(x + 1, y + 1.4, w - 2, 12.4); c.fillStyle = 'rgba(' + IM.INK + ',.14)'; c.fillRect(x + 1, y + 13.8, w - 2, 0.9); signText(c, f.label, x + w / 2, y + 7.8, Math.min(f.fs || 9, 9.5), '#33415c'); }
  }
};
function drawFurn(c, f) { (FURN[f.t] || FURN.table)(c, f); }
