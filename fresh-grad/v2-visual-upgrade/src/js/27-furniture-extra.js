/* ---------- furniture for the new rooms (v2) ---------- */
Object.assign(FURN_FLAT, { stage: 1, runner: 1 });
function bottle(c, x, y, col) { PROP.bottle(c, x, y, 5, 11, col); }
Object.assign(FURN, {
  cloth(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#c0392b', sz = 9;
    const fh = 8;
    box(c, x, y, w, h, '#f6f1e7', null, { fh, r: 3 });
    // gingham: stripes one way, then the other, so the overlap reads as the darker check
    IM.clip(c, x, y, w, h - fh + 1, 3, () => {
      c.fillStyle = IM.rgba(col, 0.55); for (let i = 0; i * sz < w; i += 2) c.fillRect(x + i * sz, y, sz, h);
      c.fillStyle = IM.rgba(col, 0.55); for (let j = 0; j * sz < h; j += 2) c.fillRect(x, y + j * sz, w, sz);
      IM.weave(c, x, y, w, h, 0.8);
      c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.28)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(' + IM.INK + ',.1)']]); c.fillRect(x, y, w, h);
    });
    // the cloth drapes over the front edge in folds, with a scalloped hem
    c.fillStyle = IM.grad(c, 0, y + h - fh, 0, y + h, [[0, IM.rgba(col, 0.5)], [1, IM.rgba(col, 0.78)]]); c.fillRect(x + 1, y + h - fh, w - 2, fh - 1);
    for (let k = 0; k < w; k += 9) { c.fillStyle = k % 18 ? 'rgba(255,255,255,.3)' : 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + 1 + k, y + h - fh, 4, fh - 1); }
    // a pizza on a stand, shakers and a candle in a bottle
    const cx = x + w / 2, cy = y + (h - fh) / 2;
    c.fillStyle = 'rgba(' + IM.INK + ',.28)'; c.beginPath(); c.ellipse(cx + 1.4, cy + 2, 13, 10, 0, 0, 7); c.fill();
    c.fillStyle = '#c9cdd2'; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill();
    c.fillStyle = '#d99a4a'; c.beginPath(); c.arc(cx, cy, 10.6, 0, 7); c.fill();
    c.fillStyle = '#f4d58d'; c.beginPath(); c.arc(cx, cy, 8.8, 0, 7); c.fill();
    c.fillStyle = '#c0392b'; [[-4, -3], [3, -4], [5, 2], [-2, 4], [-6, 2], [1, 0]].forEach(p => { c.beginPath(); c.arc(cx + p[0], cy + p[1], 1.9, 0, 7); c.fill(); });
    c.fillStyle = '#4c9a54'; [[-2, -5], [5, -1], [-5, 5]].forEach(p => c.fillRect(cx + p[0], cy + p[1], 1.4, 1.4));
    c.strokeStyle = 'rgba(' + IM.INK + ',.25)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(cx - 9, cy); c.lineTo(cx + 9, cy); c.moveTo(cx, cy - 9); c.lineTo(cx, cy + 9); c.stroke();
    PROP.shaker(c, x + 10, y + 9); PROP.shaker(c, x + 15, y + 11, '#c0392b'); PROP.candle(c, x + w - 12, y + 12);
  },
  runner(c, f) {
    const col = f.c || '#7a1f33', x = f.x, y = f.y, w = f.w, h = f.h;
    IM.shadow(c, x, y, w, h, 2, 4, 0.28, 1.5, 2.5);
    c.fillStyle = col; c.fillRect(x, y, w, h);
    c.fillStyle = IM.grad(c, x, 0, x + w, 0, [[0, shade(col, 0.1)], [0.5, col], [1, shade(col, -0.12)]]); c.fillRect(x, y, w, h);
    // gold borders, a pattern of diamonds down the middle
    c.fillStyle = '#d4a017'; c.fillRect(x + 4, y, 3, h); c.fillRect(x + w - 7, y, 3, h);
    c.fillStyle = 'rgba(255,224,150,.5)'; c.fillRect(x + 4, y, 1, h); c.fillRect(x + w - 7, y, 1, h);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 9, y, 1.4, h); c.fillRect(x + w - 10.4, y, 1.4, h);
    for (let yy = y + 14; yy < y + h - 8; yy += 24) {
      c.fillStyle = 'rgba(212,160,23,.4)'; c.beginPath(); c.moveTo(x + w / 2, yy - 9); c.lineTo(x + w / 2 + 11, yy); c.lineTo(x + w / 2, yy + 9); c.lineTo(x + w / 2 - 11, yy); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x + w / 2, yy, 2, 0, 7); c.fill();
    }
    IM.pat(c, 'iw_carpet', x, y, w, h, 0.9); IM.weave(c, x, y, w, h, 0.5);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, w, 1);
    c.strokeStyle = shade(col, 0.5); c.lineWidth = 1; c.beginPath(); for (let xx = x + 2; xx < x + w - 1; xx += 2.6) { c.moveTo(xx, y); c.lineTo(xx, y - 3); c.moveTo(xx, y + h); c.lineTo(xx, y + h + 3); } c.stroke();
  },
  armchair(c, f) {
    const col = f.c || '#8a4a38', x = f.x, y = f.y, w = f.w, h = f.h;
    IM.contact(c, x, y + 1, w, h - 2, 8, 1.1);
    c.fillStyle = '#2a1c12'; [[x + 3, y + h - 4], [x + w - 7, y + h - 4]].forEach(p => c.fillRect(p[0], p[1], 4, 4));
    c.fillStyle = IM.grad(c, x, y, x, y + h, [[0, shade(col, -0.05)], [1, shade(col, -0.3)]]); rr(c, x, y, w, h, 9); c.fill();
    // wingback with a tufted back
    c.fillStyle = IM.grad(c, 0, y, 0, y + 16, [[0, shade(col, 0.1)], [1, shade(col, -0.2)]]); rr(c, x, y, w, 17, 8); c.fill();
    for (let k = 0; k < 3; k++) { const bx = x + 12 + k * (w - 24) / 2; c.fillStyle = shade(col, -0.35); c.beginPath(); c.arc(bx, y + 8, 1.4, 0, 7); c.fill(); c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx - 7, y + 2); c.lineTo(bx, y + 8); c.lineTo(bx + 7, y + 2); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 8, y + 1, w - 16, 1.2);
    // seat cushion
    IM.shadow(c, x + 8, y + 14, w - 16, h - 22, 6, 3, 0.3, 0, 1.5);
    c.fillStyle = IM.grad(c, x, y + 14, x + w, y + h, [[0, shade(col, 0.2)], [0.55, col], [1, shade(col, -0.12)]]); rr(c, x + 8, y + 14, w - 16, h - 22, 6); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; rr(c, x + 9.4, y + 15.4, w - 18.8, h - 24.8, 5); c.stroke();
    c.fillStyle = 'rgba(' + IM.INK + ',.1)'; c.beginPath(); c.ellipse(x + w / 2, y + h * 0.62, w * 0.22, h * 0.14, 0, 0, 7); c.fill();
    // arms
    [x, x + w - 9].forEach((ax, i) => { c.fillStyle = IM.grad(c, ax, 0, ax + 9, 0, [[0, shade(col, i ? -0.1 : 0.12)], [1, shade(col, i ? 0.08 : -0.16)]]); rr(c, ax, y + 8, 9, h - 12, 4.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, ax + 1.6, y + 10, 3.4, 8, 1.6); c.fill(); });
    IM.weave(c, x, y, w, h - 2, 0.9, 8);
  },
  pcase(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#8b6240', sd = fsd(f), pizza = f.kind === 'pizza';
    box(c, x, y, w, h, col, null, { fh: Math.min(12, h * 0.34), r: 3 });
    // the glass display: tinted, with trays of pastries (or pizzas) on shelves
    const gx = x + 3, gy = y + 3, gw = w - 6, gh = h * 0.64;
    c.fillStyle = IM.grad(c, 0, gy, 0, gy + gh, [[0, '#f8f2e4'], [1, '#e2d6bc']]); c.fillRect(gx, gy, gw, gh);
    const items = f.items || ['#d9a05b', '#c47a3a', '#f4d58d', '#e76f51', '#f6e7cb'], r = IM.rng(sd, 1, 2), by = gy + gh - 3;
    for (let i = 0, px = gx + 6; px < gx + gw - 12; px += 16, i++) {
      const col2 = items[i % items.length];
      if (pizza) {
        c.fillStyle = 'rgba(' + IM.INK + ',.22)'; c.beginPath(); c.ellipse(px + 7, by - gh * 0.3 + 1.6, 9, 6.4, 0, 0, 7); c.fill();
        c.fillStyle = '#c9cdd2'; c.beginPath(); c.ellipse(px + 7, by - gh * 0.3, 9, 6.6, 0, 0, 7); c.fill();
        c.fillStyle = col2; c.beginPath(); c.ellipse(px + 7, by - gh * 0.3, 8, 5.6, 0, 0, 7); c.fill();
        c.fillStyle = '#c0392b'; c.beginPath(); c.arc(px + 4, by - gh * 0.3 - 1, 1.5, 0, 7); c.arc(px + 9, by - gh * 0.3 + 1, 1.5, 0, 7); c.arc(px + 11, by - gh * 0.3 - 1.4, 1.3, 0, 7); c.fill();
        c.strokeStyle = 'rgba(' + IM.INK + ',.22)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(px - 1, by - gh * 0.3); c.lineTo(px + 15, by - gh * 0.3); c.moveTo(px + 7, by - gh * 0.3 - 5.4); c.lineTo(px + 7, by - gh * 0.3 + 5.4); c.stroke();
        continue;
      }
      const k = i % 4;
      if (k === 0) { c.fillStyle = col2; c.beginPath(); c.moveTo(px, by - 2); c.quadraticCurveTo(px + 6, by - gh * 0.62, px + 12, by - 2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(' + IM.INK + ',.2)'; c.lineWidth = 0.8; for (let s = 1; s < 4; s++) { c.beginPath(); c.moveTo(px + s * 3, by - 3); c.lineTo(px + s * 3 + 0.8, by - gh * 0.3 - s % 2 * 2); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(px + 3, by - gh * 0.4, 4, 1.2); }
      else if (k === 1) { c.fillStyle = '#f6e7cb'; rr(c, px, by - gh * 0.34, 12, gh * 0.32, 3); c.fill(); c.fillStyle = col2; rr(c, px, by - gh * 0.34, 12, gh * 0.14, 3); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(px + 6, by - gh * 0.36, 1.5, 0, 7); c.fill(); }
      else if (k === 2) { c.fillStyle = col2; c.beginPath(); c.ellipse(px + 6, by - 5, 6.4, 4.6, 0, 0, 7); c.fill(); c.fillStyle = '#f4ece0'; c.beginPath(); c.ellipse(px + 6, by - 7, 4, 1.8, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px + 2, by - 9, 3, 1); }
      else { c.fillStyle = '#c47a3a'; c.beginPath(); c.arc(px + 6, by - 6, 5.4, Math.PI, 0); c.lineTo(px + 11.4, by - 2); c.lineTo(px + 0.6, by - 2); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; for (let s = 0; s < 4; s++) c.fillRect(px + 2 + s * 2.4, by - 5, 0.8, 3); }
      if (r() < 0.55) { c.fillStyle = '#fffaf0'; c.fillRect(px + 2, by - 0.4, 8, 3); c.fillStyle = '#c0392b'; c.fillRect(px + 3, by + 0.6, 4, 0.9); }
    }
    c.fillStyle = IM.grad(c, 0, gy + gh - 2, 0, gy + gh + 1, [[0, '#cfd6db'], [1, '#7a8791']]); c.fillRect(gx, gy + gh - 2, gw, 3.4);
    c.fillStyle = 'rgba(210,235,245,.28)'; c.fillRect(gx, gy, gw, gh);
    IM.glints(c, gx, gy, gw, gh, 0.3);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(gx, gy, gw, 1.4); c.fillStyle = '#9aa7b0'; c.fillRect(x + 1.6, gy, 2, gh); c.fillRect(x + w - 3.6, gy, 2, gh);
    litRect(gx, gy, gw, gh * 0.9);
  },
  popcorn(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#b92f2f', 'rgba(255,255,255,.25)', { fh: Math.max(10, h * 0.5), r: 4 });
    c.fillStyle = '#d4a017'; c.fillRect(x + 2, y + h - 8, w - 4, 2.4); c.fillRect(x + 2, y + 3, w - 4, 2);
    // the glass kettle chamber full of popcorn
    c.fillStyle = '#fff3d0'; rr(c, x + 6, y + 6, w - 12, h * 0.56, 4); c.fill();
    const r = IM.rng(fsd(f), 2, 3);
    for (let i = 0; i < 26; i++) { c.fillStyle = r() < 0.5 ? '#ffe08a' : '#fff4c9'; c.beginPath(); c.arc(x + 9 + r() * (w - 18), y + 10 + r() * (h * 0.5 - 6), 2 + r() * 1.3, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(210,235,245,.28)'; rr(c, x + 6, y + 6, w - 12, h * 0.56, 4); c.fill(); IM.glints(c, x + 6, y + 6, w - 12, h * 0.56, 0.34);
    c.fillStyle = '#f6f1e7'; c.fillRect(x + 4, y + h - 10, w - 8, 4); for (let k = 0; k < w - 8; k += 6) { c.fillStyle = '#b92f2f'; c.fillRect(x + 4 + k, y + h - 10, 3, 4); }
  },
  salonchair(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#3a3340', cx = x + w / 2;
    IM.shadow(c, x + 4, y + 12, w - 8, h - 14, 14, 7, 0.3, 3, 5);
    // chrome base, pump and footrest
    c.fillStyle = IM.grad(c, 0, y + h - 14, 0, y + h, [[0, '#f0f4f6'], [1, '#7a8791']]); c.beginPath(); c.ellipse(cx, y + h - 6, w * 0.34, 5.4, 0, 0, 7); c.fill();
    c.fillStyle = '#9aa7ad'; c.fillRect(cx - 3.2, y + h * 0.6, 6.4, h * 0.2);
    c.fillStyle = IM.grad(c, 0, y + h - 12, 0, y + h - 6, [[0, '#f0f4f6'], [1, '#8a979f']]); rr(c, cx - w * 0.3, y + h - 12, w * 0.6, 4, 2); c.fill();
    // seat, back and headrest in padded vinyl
    c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]); rr(c, x + 4, y + 14, w - 8, h - 30, 9); c.fill();
    c.fillStyle = IM.grad(c, 0, y, 0, y + 20, [[0, shade(col, 0.22)], [1, shade(col, -0.12)]]); rr(c, x + 3, y, w - 6, 21, 8); c.fill();
    c.fillStyle = IM.grad(c, 0, y - 2, 0, y + 5, [[0, shade(col, 0.3)], [1, shade(col, 0)]]); rr(c, x + w / 2 - 11, y - 3, 22, 8, 4); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; rr(c, x + 5, y + 16, w - 10, h - 34, 7); c.stroke();
    c.fillStyle = 'rgba(' + IM.INK + ',.16)'; c.fillRect(x + 8, y + 22, w - 16, 1.2);
    // chrome armrests
    c.fillStyle = IM.grad(c, 0, y + 14, 0, y + 24, [[0, '#f0f4f6'], [1, '#8a979f']]); rr(c, x, y + 14, 5, h * 0.45, 2.4); c.fill(); rr(c, x + w - 5, y + 14, 5, h * 0.45, 2.4); c.fill();
    c.fillStyle = '#2b2f36'; rr(c, x - 0.6, y + 14, 6.2, 6, 2.6); c.fill(); rr(c, x + w - 5.6, y + 14, 6.2, 6, 2.6); c.fill();
    IM.pat(c, 'iw_leather', x + 3, y, w - 6, h - 16, 0.7, 8);
  },
  washer(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, dry = !!f.dry, col = dry ? '#e6dcd0' : '#f4f7f9';
    box(c, x, y, w, h, col, 'rgba(255,255,255,.6)', { fh: h - 14, r: 3 });
    IM.pat(c, 'iw_noise', x, y, w, h, 0.5, 3);
    // control panel
    c.fillStyle = IM.grad(c, 0, y + 1, 0, y + 14, [[0, shade(col, -0.04)], [1, shade(col, -0.16)]]); rr(c, x + 2, y + 2, w - 4, 11, 2); c.fill();
    c.fillStyle = '#0f1a14'; c.fillRect(x + w - 22, y + 4, 12, 6); c.fillStyle = '#5fe39a'; c.fillRect(x + w - 20, y + 5.4, 8, 3);
    IM.knob(c, x + 9, y + 7.6, 3.2, dry ? '#cdb9a2' : '#cfd8dc'); c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(x + 8.6, y + 5, 0.9, 2.6);
    c.fillStyle = '#9aa7ad'; c.fillRect(x + 16, y + 6, 5, 3); c.fillStyle = '#3a414a'; c.fillRect(x + 17, y + 9, 3, 0.9);
    // porthole: chrome ring, dark glass, drum behind
    const cx = x + w / 2, cy = y + h * 0.58, r = Math.min(w * 0.34, (h - 16) * 0.4);
    IM.shadow(c, cx - r - 3, cy - r - 3, (r + 3) * 2, (r + 3) * 2, r + 3, 3, 0.35, 0.5, 1.5);
    c.fillStyle = IM.grad(c, cx - r, cy - r, cx + r, cy + r, [[0, '#f0f4f6'], [1, '#7a8791']]); c.beginPath(); c.arc(cx, cy, r + 3.4, 0, 7); c.fill();
    c.fillStyle = dry ? '#2a1f1a' : '#142633'; c.beginPath(); c.arc(cx, cy, r + 0.4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; for (let k = 1; k < 3; k++) { c.beginPath(); c.arc(cx, cy, r * k / 3, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(cx - r * 0.34, cy - r * 0.34, r * 0.4, Math.PI * 1.05, Math.PI * 1.75); c.lineTo(cx - r * 0.34, cy - r * 0.34); c.fill();
    c.fillStyle = '#9aa7ad'; c.fillRect(x + 4, y + h - 3, 4, 3); c.fillRect(x + w - 8, y + h - 3, 4, 3);
  },
  bikedisp(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, sd = fsd(f);
    IM.shadow(c, x, y + h - 8, w, 8, 3, 6, 0.3, 2, 3);
    // a low steel rack and a printed floor mat each bike stands on
    c.fillStyle = IM.grad(c, 0, y + h - 7, 0, y + h, [[0, '#8a96a0'], [1, '#4a545e']]); rr(c, x, y + h - 7, w, 5, 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 1, y + h - 7, w - 2, 1);
    const n = Math.max(1, Math.floor(w / 50)), cols = f.cols || ['#e76f51', '#2a9d8f', '#e9c46a', '#4361ee'];
    for (let i = 0; i < n; i++) {
      const bx = x + (i + 0.5) * w / n;
      c.save(); c.translate(bx, y + h - 4); c.scale(1.35, 1.35); drawBike(c, 0, 0, cols[i % cols.length], 1, i); c.restore();
      // price tag hanging from the bars
      c.fillStyle = '#f6f1e7'; rr(c, bx + 10, y + h - 30, 8, 10, 1.5); c.fill(); c.fillStyle = '#c0392b'; c.fillRect(bx + 11.4, y + h - 28, 5.2, 1.4); c.fillStyle = 'rgba(' + IM.INK + ',.5)'; c.fillRect(bx + 11.4, y + h - 25, 5.2, 0.8);
      c.strokeStyle = 'rgba(' + IM.INK + ',.4)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(bx + 10, y + h - 31); c.lineTo(bx + 14, y + h - 30); c.stroke();
    }
    void sd;
  },
  oven(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, cx = x + w / 2;
    IM.shadow(c, x, y + h * 0.3, w, h * 0.7, 10, 9, 0.34, 3, 6);
    // a chimney, then the brick dome with mortar and soot above the mouth
    c.fillStyle = IM.grad(c, cx - 5, 0, cx + 5, 0, [[0, '#8a9097'], [1, '#4a5058']]); c.fillRect(cx - 5, y - h * 0.18, 10, h * 0.3);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(cx - 5, y - h * 0.18, 2, h * 0.3); c.fillStyle = '#2a2f36'; c.fillRect(cx - 7, y - h * 0.2, 14, 4);
    c.save(); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.45); c.quadraticCurveTo(cx, y - h * 0.4, x + w, y + h * 0.45); c.lineTo(x + w, y + h); c.closePath(); c.clip();
    c.fillStyle = IM.grad(c, x, y, x + w, y + h, [[0, '#c0643f'], [0.5, '#9a4a32'], [1, '#6e3322']]); c.fillRect(x, y - h, w, h * 2);
    IM.pat(c, 'brick', x, y - h * 0.4, w, h * 1.4, 1);
    c.fillStyle = IM.grad(c, 0, y + h * 0.4, 0, y + h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(' + IM.INK + ',.3)']]); c.fillRect(x, y, w, h);
    c.fillStyle = IM.grad(c, x, y, x + w * 0.45, y, [[0, 'rgba(255,230,190,.3)'], [1, 'rgba(255,230,190,0)']]); c.fillRect(x, y, w, h);
    c.restore();
    c.strokeStyle = 'rgba(255,200,150,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 3, y + h * 0.5); c.quadraticCurveTo(cx, y - h * 0.3, x + w - 3, y + h * 0.5); c.stroke();
    // the mouth, black with soot, an iron lip
    const mx = cx, my = y + h * 0.7;
    c.fillStyle = '#5a6672'; c.beginPath(); c.moveTo(mx - 23, y + h); c.lineTo(mx - 23, my); c.arc(mx, my, 23, Math.PI, 0); c.lineTo(mx + 23, y + h); c.closePath(); c.fill();
    c.fillStyle = '#140905'; c.beginPath(); c.moveTo(mx - 20, y + h); c.lineTo(mx - 20, my); c.arc(mx, my, 20, Math.PI, 0); c.lineTo(mx + 20, y + h); c.closePath(); c.fill();
    c.fillStyle = IM.grad(c, 0, y + h - 10, 0, y + h, [[0, '#ff9f43'], [1, '#c0392b']]); c.beginPath(); c.ellipse(mx, y + h - 5, 15, 7, 0, 0, 7); c.fill();
    // a stack of split logs and a peel
    c.fillStyle = '#6b4a30'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + w + 6, y + h - 5 - i * 7, 3.4, 0, 7); c.fill(); c.fillStyle = '#c99a62'; c.beginPath(); c.arc(x + w + 6, y + h - 5 - i * 7, 1.6, 0, 7); c.fill(); c.fillStyle = '#6b4a30'; }
  },
  dentchair(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#3aa6b9', cx = x + w / 2;
    IM.shadow(c, x - 2, y + 6, w + 6, h, 14, 8, 0.3, 3, 6);
    // chrome column and base plate
    c.fillStyle = IM.grad(c, 0, y + h * 0.5, 0, y + h, [[0, '#dfe5e9'], [1, '#6f7b84']]); rr(c, cx - 18, y + h - 22, 36, 18, 6); c.fill(); c.fillStyle = '#9aa7ad'; c.fillRect(cx - 6, y + h * 0.5, 12, h * 0.2);
    // padded backrest, seat and legrest, stitched panels
    c.fillStyle = IM.grad(c, x, y, x + w, y, [[0, shade(col, 0.18)], [0.5, col], [1, shade(col, -0.2)]]); rr(c, x, y, w, h * 0.7, 14); c.fill();
    c.fillStyle = IM.grad(c, 0, y + 4, 0, y + 32, [[0, shade(col, 0.34)], [1, shade(col, 0.04)]]); rr(c, x + 14, y + 4, w - 28, 26, 11); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; rr(c, x + 6, y + 36, w - 12, h * 0.46, 9); c.stroke(); rr(c, x + 16, y + 6, w - 32, 22, 9); c.stroke();
    c.fillStyle = 'rgba(' + IM.INK + ',.16)'; c.fillRect(x + 8, y + 42, w - 16, 1.2);
    c.fillStyle = IM.grad(c, x, y + h * 0.66, x, y + h, [[0, shade(col, 0.1)], [1, shade(col, -0.2)]]); rr(c, x + 12, y + h * 0.66, w - 24, h * 0.26, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 18, y + 12, w - 36, 1.4);
    IM.pat(c, 'iw_leather', x, y, w, h * 0.92, 0.6, 12);
    // arm with the operatory light, tray with tools and a suction hose
    c.strokeStyle = '#dfe5e9'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + w + 16, y + h * 0.4); c.lineTo(x + w + 16, y - 6); c.lineTo(cx + 6, y - 2); c.stroke(); c.lineCap = 'butt';
    c.fillStyle = '#c9cdd2'; c.beginPath(); c.arc(x + w + 16, y + h * 0.4, 3.6, 0, 7); c.fill();
    c.fillStyle = IM.grad(c, 0, y - 8, 0, y + 4, [[0, '#fffbe8'], [1, '#c9cdd2']]); c.beginPath(); c.ellipse(cx + 4, y - 2, 11, 6, 0, 0, 7); c.fill(); c.fillStyle = '#fff6d0'; c.beginPath(); c.ellipse(cx + 4, y - 2, 7, 3.4, 0, 0, 7); c.fill();
    c.fillStyle = IM.grad(c, 0, y + h * 0.3, 0, y + h * 0.3 + 6, [[0, '#f0f4f6'], [1, '#9aa7ad']]); rr(c, x + w + 4, y + h * 0.34, 14, 22, 3); c.fill();
    c.fillStyle = '#6b7782'; for (let k = 0; k < 4; k++) c.fillRect(x + w + 6 + k * 3, y + h * 0.34 + 4, 1, 14);
    c.strokeStyle = '#3aa6b9'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + w + 12, y + h * 0.34 + 22); c.quadraticCurveTo(x + w + 4, y + h * 0.7, x + w - 4, y + h * 0.78); c.stroke();
    addEmit(cx + 4, y - 2, 18, 0, 0.6);
  },
  teller(c, f) {
    FURN.counter(c, Object.assign({}, f, { label: null, noprops: true }));
    const x = f.x, y = f.y, w = f.w, n = f.n || 3;
    // brass-framed security glass with slots, ticket number lamps above
    for (let i = 0; i <= n; i++) { c.fillStyle = IM.grad(c, x + i * (w - 4) / n, 0, x + i * (w - 4) / n + 4, 0, [[0, '#f1dc9a'], [1, '#8a6a2e']]); c.fillRect(x + i * (w - 4) / n, y - 18, 4, 22); }
    c.fillStyle = 'rgba(200,230,240,.38)'; c.fillRect(x + 2, y - 18, w - 4, 16); IM.glints(c, x + 2, y - 18, w - 4, 16, 0.22);
    c.fillStyle = IM.grad(c, 0, y - 20, 0, y - 17, [[0, '#f1dc9a'], [1, '#8a6a2e']]); c.fillRect(x, y - 20, w, 3.4);
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * w / n;
      c.fillStyle = '#111a22'; rr(c, cx - 14, y - 31, 28, 10, 3); c.fill(); c.fillStyle = '#2a6f97'; rr(c, cx - 13, y - 30, 26, 8, 2.4); c.fill(); signText(c, String(i + 1), cx, y - 25.5, 7, '#fff');
      c.fillStyle = '#1b2026'; rr(c, cx - 8, y - 4, 16, 2.2, 1); c.fill();           // pass-through slot
      PROP.monitor(c, cx + 14, y + 4, 12, 8, '#1c2733'); PROP.paper(c, cx - 22, y + 4, 8, 10, -0.12, 3);
    }
  },
  rack(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, r = IM.rng(fsd(f), 9, 10);
    IM.shadow(c, x, y + h - 6, w, 8, 3, 6, 0.3, 2, 3);
    // a chrome rail on two posts, garments hanging down
    c.fillStyle = IM.grad(c, 0, y + 2, 0, y + 6, [[0, '#f0f4f6'], [1, '#7a8791']]); c.fillRect(x, y + 2, w, 3.4);
    c.fillStyle = '#7a8791'; c.fillRect(x, y + 2, 3, h - 2); c.fillRect(x + w - 3, y + 2, 3, h - 2);
    const cols = f.cols || ['#ff7a59', '#2a9d8f', '#e9c46a', '#6f7bd4', '#c05d8a', '#f6f1e7', '#3d5a80', '#c0392b'];
    for (let x2 = x + 8, i = 0; x2 < x + w - 14; x2 += 11, i++) {
      const col = cols[(r() * cols.length) | 0], hh = h - 12 - r() * 5;
      c.strokeStyle = '#9aa7ad'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x2 + 5, y + 5); c.lineTo(x2 + 5, y + 8); c.stroke();
      c.fillStyle = IM.grad(c, x2, 0, x2 + 11, 0, [[0, shade(col, 0.16)], [1, shade(col, -0.2)]]);
      c.beginPath(); c.moveTo(x2 + 5, y + 8); c.lineTo(x2 - 1.4, y + 11); c.lineTo(x2 - 1.4, y + 17); c.lineTo(x2 + 2, y + 15); c.lineTo(x2 + 2, y + hh); c.lineTo(x2 + 8.4, y + hh); c.lineTo(x2 + 8.4, y + 15); c.lineTo(x2 + 12, y + 17); c.lineTo(x2 + 12, y + 11); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x2 + 3, y + 8.6, 4, 1.2); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x2 + 5, y + 12, 0.9, hh - 12);
      IM.weave(c, x2 - 1, y + 9, 13, hh - 8, 0.6);
    }
  },
  tank(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#3a414a', 'rgba(255,255,255,.2)', { fh: 12, r: 3 });
    const gx = x + 4, gy = y + 4, gw = w - 8, gh = h - 15;
    c.fillStyle = IM.grad(c, 0, gy, 0, gy + gh, [[0, '#8ee0ff'], [0.6, '#3a9fd0'], [1, '#1f6f9a']]); c.fillRect(gx, gy, gw, gh);
    // light rays, gravel, rocks, plants, a little castle
    c.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(gx + 10 + k * 30, gy); c.lineTo(gx + 20 + k * 30, gy); c.lineTo(gx + 8 + k * 30, gy + gh); c.lineTo(gx - 4 + k * 30, gy + gh); c.closePath(); c.fill(); }
    c.fillStyle = '#d9c28a'; c.fillRect(gx, gy + gh - 9, gw, 9); const r = IM.rng(fsd(f), 3, 4); for (let i = 0; i < 40; i++) { c.fillStyle = ['#b89a5a', '#efe0b0', '#8a7448'][(r() * 3) | 0]; c.beginPath(); c.arc(gx + r() * gw, gy + gh - 8 + r() * 7, 1 + r() * 1.2, 0, 7); c.fill(); }
    c.fillStyle = '#7a7f86'; c.beginPath(); c.moveTo(gx + gw * 0.62, gy + gh - 8); c.lineTo(gx + gw * 0.68, gy + gh - 20); c.lineTo(gx + gw * 0.78, gy + gh - 16); c.lineTo(gx + gw * 0.84, gy + gh - 8); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(gx + gw * 0.68, gy + gh - 20, 3, 8);
    c.fillStyle = '#c9a06a'; c.fillRect(gx + gw * 0.2, gy + gh - 20, 14, 12); c.fillStyle = '#9a7248'; c.fillRect(gx + gw * 0.2 + 3, gy + gh - 16, 8, 8); c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(gx + gw * 0.2 - 2, gy + gh - 20); c.lineTo(gx + gw * 0.2 + 7, gy + gh - 28); c.lineTo(gx + gw * 0.2 + 16, gy + gh - 20); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(gx + 3, gy + 3, 4, gh - 12); IM.glints(c, gx, gy, gw, gh, 0.2);
    c.fillStyle = '#e9c46a'; c.fillRect(gx, gy + gh - 1, gw, 1.4);
    c.fillStyle = IM.grad(c, 0, y, 0, y + 5, [[0, '#d9dde0'], [1, '#6f7b84']]); c.fillRect(x + 2, y + 1, w - 4, 4.4); c.fillStyle = '#fff6d0'; c.fillRect(x + 8, y + 2.4, w - 16, 1.6);
    addEmit(x + w / 2, y + h / 2, 30, 1, 0.5);
  },
  claw(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#f72585', 'rgba(255,255,255,.25)', { fh: h * 0.46, r: 4 });
    // marquee with bulbs, glass cabinet full of plush, prize chute, controls
    c.fillStyle = '#ffd166'; rr(c, x + 3, y + 2, w - 6, 8, 2); c.fill(); c.fillStyle = '#fff6d0'; for (let k = 0; k < Math.floor((w - 10) / 7); k++) { c.beginPath(); c.arc(x + 7 + k * 7, y + 6, 1.6, 0, 7); c.fill(); }
    const gx = x + 5, gy = y + 12, gw = w - 10, gh = h * 0.5;
    c.fillStyle = IM.grad(c, 0, gy, 0, gy + gh, [[0, '#f7e3f2'], [1, '#e4b8da']]); c.fillRect(gx, gy, gw, gh);
    const r = IM.rng(fsd(f), 4, 5), pl = ['#ffd166', '#4cc9f0', '#8ac926', '#ff9f43', '#c77dff', '#ffffff'];
    for (let i = 0; i < 12; i++) { const px = gx + 5 + (i % 4) * (gw - 10) / 3 + (r() - 0.5) * 4, py = gy + gh - 7 - ((i / 4) | 0) * 6 + (r() - 0.5) * 2, col = pl[(r() * pl.length) | 0]; c.fillStyle = col; c.beginPath(); c.arc(px, py, 4.6, 0, 7); c.fill(); c.beginPath(); c.arc(px - 3, py - 3.4, 1.8, 0, 7); c.arc(px + 3, py - 3.4, 1.8, 0, 7); c.fill(); c.fillStyle = '#20262d'; c.fillRect(px - 2, py - 1, 1.2, 1.2); c.fillRect(px + 1, py - 1, 1.2, 1.2); }
    c.strokeStyle = '#9aa7ad'; c.lineWidth = 1; c.strokeRect(gx, gy, gw, gh);
    IM.glints(c, gx, gy, gw, gh, 0.3);
    c.fillStyle = '#1b1015'; rr(c, x + 6, y + h * 0.66, w * 0.5, h * 0.12, 2); c.fill(); c.fillStyle = '#ffe9a8'; c.fillRect(x + 6, y + h * 0.78, w - 12, 5);
    c.fillStyle = '#20262d'; c.beginPath(); c.arc(x + w * 0.24, y + h * 0.9, 3.6, 0, 7); c.fill(); c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + w * 0.24, y + h * 0.9 - 2, 2.6, 0, 7); c.fill();
    c.fillStyle = '#ffd166'; c.beginPath(); c.arc(x + w * 0.62, y + h * 0.9, 2.4, 0, 7); c.fill(); c.fillStyle = '#4cc9f0'; c.beginPath(); c.arc(x + w * 0.78, y + h * 0.9, 2.4, 0, 7); c.fill();
  },
  crate(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#b98a55', lab = (f.label || '').toUpperCase(), fill = f.fill, r = IM.rng(fsd(f), 5, 6);
    const wire = /CART/.test(lab), fh = Math.min(12, h * 0.38);
    box(c, x, y, w, h, col, null, { fh, r: 2.5 });
    IM.clip(c, x, y, w, h, 2.5, () => {
      c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + 3, y + 3, w - 6, h - fh - 4);   // the open top: dark inside
      if (fill) {
        const th = h - fh - 6;
        for (let xx = x + 6, i = 0; xx < x + w - 6; xx += 8, i++) {
          const col2 = fill[i % fill.length], yy = y + 5 + (i % 2) * 3 + r() * 2;
          if (/UMBRELLA/.test(lab)) { c.fillStyle = col2; c.beginPath(); c.moveTo(xx, yy + 8); c.lineTo(xx + 3, yy - 2); c.lineTo(xx + 6, yy + 8); c.closePath(); c.fill(); c.strokeStyle = '#2b2f36'; c.lineWidth = 1; c.beginPath(); c.moveTo(xx + 3, yy + 6); c.lineTo(xx + 3, yy + 12); c.arc(xx + 4.4, yy + 12, 1.4, Math.PI, 0, true); c.stroke(); }
          else if (/TIRE/.test(lab)) { c.fillStyle = '#15181d'; c.beginPath(); c.ellipse(xx + 4, yy + 6, 7, 4.6, 0, 0, 7); c.fill(); c.strokeStyle = '#3a414a'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(xx + 4, yy + 6, 5, 3.2, 0, 0, 7); c.stroke(); c.fillStyle = '#7a8791'; c.beginPath(); c.ellipse(xx + 4, yy + 6, 2, 1.2, 0, 0, 7); c.fill(); }
          else if (/PAINT/.test(lab)) { c.fillStyle = '#9aa7ad'; c.beginPath(); c.ellipse(xx + 4, yy + 5, 5.4, 3.4, 0, 0, 7); c.fill(); c.fillStyle = col2; c.beginPath(); c.ellipse(xx + 4, yy + 4.4, 4, 2.4, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(xx + 2, yy + 3.2, 2, 0.9); }
          else if (/BAGUETTE/.test(lab)) { c.fillStyle = '#d9a05b'; rr(c, xx - 2, yy + 1 + (i % 3) * 2, 18, 3.4, 1.7); c.fill(); c.strokeStyle = 'rgba(120,70,20,.5)'; c.lineWidth = 0.7; for (let s = 0; s < 4; s++) { c.beginPath(); c.moveTo(xx + s * 4, yy + 1.8 + (i % 3) * 2); c.lineTo(xx + s * 4 + 1.8, yy + 4 + (i % 3) * 2); c.stroke(); } }
          else if (/ROLL|DAY/.test(lab) && col2) { c.fillStyle = col2; c.beginPath(); c.ellipse(xx + 4, yy + 5, 5, 3.6, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(xx + 2.6, yy + 3.6, 2, 1, 0, 0, 7); c.fill(); }
          else if (wire) { c.fillStyle = col2; c.beginPath(); c.ellipse(xx + 3, yy + 5, 6, 4, r(), 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(xx + 1.6, yy + 3.4, 2.4, 1.2, 0, 0, 7); c.fill(); }
          else { c.fillStyle = col2; c.beginPath(); c.arc(xx + 4, yy + 5, 4.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(xx + 2.6, yy + 3.4, 1.4, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.beginPath(); c.arc(xx + 5, yy + 6.4, 2.2, 0, Math.PI); c.fill(); }
        }
        void th;
      }
      // slatted front face with nails and a corner brace
      c.fillStyle = IM.grad(c, 0, y + h - fh, 0, y + h, [[0, shade(col, -0.05)], [1, shade(col, -0.3)]]); c.fillRect(x, y + h - fh, w, fh);
      if (wire) { c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.8; for (let xx = x + 2; xx < x + w; xx += 4) { c.beginPath(); c.moveTo(xx, y + h - fh); c.lineTo(xx, y + h); c.stroke(); } for (let yy = y + h - fh + 2.6; yy < y + h; yy += 3.6) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); } }
      else { IM.grain(c, x, y + h - fh, w, fh, fsd(f), 1); for (let s = 1; s < 3; s++) { c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x, y + h - fh + s * fh / 3, w, 1); } for (let xx = x + 6; xx < x + w - 4; xx += 24) { c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(xx, y + h - fh * 0.5, 0.9, 0, 7); c.fill(); } }
    });
    c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x + 1, y + 0.2, w - 2, 1.2);
    if (f.label) { const q = hexRgb(col), light = q[0] * 0.3 + q[1] * 0.6 + q[2] * 0.1 > 165; c.fillStyle = '#f6f1e7'; const lw = Math.min(w - 10, f.label.length * (f.fs || 8) * 0.68 + 8); rr(c, x + w / 2 - lw / 2, y + h - fh + 1.4, lw, fh - 3.4, 2); c.fill(); signText(c, f.label, x + w / 2, y + h - fh / 2 - 0.4, Math.min(f.fs || 8, fh - 4), light ? '#39424d' : '#33261a'); }
  },
  posts(c, f) {
    const n = Math.max(2, Math.round(f.w / 70)), step = f.w / (n - 1), x = f.x, y = f.y;
    for (let i = 0; i < n; i++) {
      const px = x + i * step;
      IM.shadow(c, px - 6, y + f.h - 3, 12, 5, 2.5, 3, 0.35, 1.5, 2);
      c.fillStyle = IM.grad(c, 0, y + f.h - 4, 0, y + f.h + 1, [[0, '#f1dc9a'], [1, '#8a6a2e']]); c.beginPath(); c.ellipse(px, y + f.h, 6.4, 2.6, 0, 0, 7); c.fill();
      c.fillStyle = IM.grad(c, px - 2, 0, px + 2, 0, [[0, '#f6e6aa'], [0.5, '#d4a017'], [1, '#7a5a1e']]); c.fillRect(px - 1.9, y - 10, 3.8, f.h + 10);
      c.fillStyle = IM.grad(c, px - 3.4, y - 14, px + 3.4, y - 8, [[0, '#fbefc0'], [1, '#a8801e']]); c.beginPath(); c.arc(px, y - 11, 3.4, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(px - 1, y - 12.2, 1, 0, 7); c.fill();
    }
    // the velvet rope sags between the posts
    c.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const x0 = x + (i - 1) * step, x1 = x + i * step;
      c.strokeStyle = 'rgba(' + IM.INK + ',.3)'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x0, y - 6); c.quadraticCurveTo((x0 + x1) / 2, y + 12, x1, y - 6); c.stroke();
      c.strokeStyle = '#a83a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y - 8); c.quadraticCurveTo((x0 + x1) / 2, y + 8, x1, y - 8); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0, y - 9); c.quadraticCurveTo((x0 + x1) / 2, y + 7, x1, y - 9); c.stroke();
    }
    c.lineCap = 'butt';
  },
  stage(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, col = f.c || '#6b4a30', fh = 10;
    IM.shadow(c, x, y + 4, w, h, 5, 9, 0.34, 3, 5);
    c.fillStyle = IM.grad(c, 0, y + h - fh, 0, y + h, [[0, shade(col, -0.25)], [1, shade(col, -0.5)]]); rr(c, x, y + h - fh - 2, w, fh + 2, 4); c.fill();
    IM.floors.wood(c, x, y, w, h - fh, col, null, { ph: 14, pl: 120, seed: 8 });
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, w, 1.4); c.fillRect(x, y, 1.4, h - fh);
    c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x + w - 1.6, y, 1.6, h - fh);
    // gaffer tape marks, a coiled cable, a worn spot centre stage
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + w * 0.46, y + h * 0.4, 8, 1.6); c.fillRect(x + w * 0.46 + 3.2, y + h * 0.4 - 3.2, 1.6, 8);
    c.strokeStyle = '#20262d'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + w * 0.42, y + h * 0.35); c.bezierCurveTo(x + w * 0.3, y + h * 0.1, x + w * 0.2, y + h * 0.5, x + 10, y + h * 0.4); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.ellipse(x + w / 2, y + h * 0.45, w * 0.22, h * 0.2, 0, 0, 7); c.fill();
    c.fillStyle = col; for (let k = 0; k < 3; k++) { c.fillStyle = shade(col, -0.2 - k * 0.08); c.fillRect(x - 6 - k * 4, y + h - fh + k * 3, 6, 3); }   // a step
  },
  mic(c, f) {
    const x = f.x + f.w / 2;
    IM.shadow(c, x - 8, f.y + f.h - 3, 16, 5, 2.5, 3, 0.34, 1.5, 2);
    c.strokeStyle = '#7a8791'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 7, f.y + f.h + 1); c.lineTo(x, f.y + f.h - 4); c.lineTo(x + 7, f.y + f.h + 1); c.stroke();
    c.strokeStyle = '#2b2f36'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, f.y + f.h - 4); c.lineTo(x, f.y + 6); c.stroke();
    c.fillStyle = IM.grad(c, x - 3.6, 0, x + 3.6, 0, [[0, '#f0f4f6'], [1, '#6f7b84']]); c.beginPath(); c.arc(x, f.y + 3, 3.8, 0, 7); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.3)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 3.6, f.y + 3); c.lineTo(x + 3.6, f.y + 3); c.moveTo(x, f.y - 0.8); c.lineTo(x, f.y + 6.8); c.stroke();
  },
  lamp(c, f) {
    const x = f.x + f.w / 2;
    IM.shadow(c, x - 9, f.y + f.h - 3, 18, 5, 2.5, 4, 0.34, 2, 3);
    c.fillStyle = IM.grad(c, 0, f.y + f.h - 4, 0, f.y + f.h + 1, [[0, '#4a3f46'], [1, '#2a2328']]); c.beginPath(); c.ellipse(x, f.y + f.h - 1, 8, 3, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a3340'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, f.y + f.h - 2); c.lineTo(x, f.y + 14); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 1, f.y + 16, 0.9, f.h - 22);
    // a pleated shade that glows warm
    const col = f.c || '#f4d58d';
    c.fillStyle = IM.grad(c, x - 11, 0, x + 11, 0, [[0, shade(col, 0.2)], [0.5, col], [1, shade(col, -0.2)]]); c.beginPath(); c.moveTo(x - 11, f.y + 14); c.lineTo(x + 11, f.y + 14); c.lineTo(x + 6.6, f.y); c.lineTo(x - 6.6, f.y); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(' + IM.INK + ',.16)'; c.lineWidth = 0.7; c.beginPath(); for (let k = -4; k <= 4; k++) { c.moveTo(x + k * 1.2, f.y); c.lineTo(x + k * 2.4, f.y + 14); } c.stroke();
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x - 6, f.y, 12, 1.2);
    addLight(x, f.y + f.h + 6, 110, 70, 0, 0.95); addEmit(x, f.y + 8, 22, 0, 0.8);
  },
  gadget(c, f) {
    // a small machine sitting on a counter: coffee maker, turntable or espresso machine
    if (f.dh) f = Object.assign({}, f, { h: f.dh });
    const x = f.x, y = f.y, w = f.w, h = f.h;
    if (f.kind === 'turntable') {
      box(c, x, y, w, h, '#6b4a30', 'rgba(255,255,255,.2)', { fh: 7 });
      IM.grain(c, x, y, w, h - 7, 4, 1);
      const cx = x + w * 0.42, cy = y + (h - 7) * 0.5, r = Math.min(w, h - 7) * 0.4;
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 0.6; for (let k = 0.4; k < 0.95; k += 0.12) { c.beginPath(); c.arc(cx, cy, r * k, 0, 7); c.stroke(); }
      c.fillStyle = '#e76f51'; c.beginPath(); c.arc(cx, cy, r * 0.32, 0, 7); c.fill(); c.fillStyle = '#f6f1e7'; c.beginPath(); c.arc(cx, cy, r * 0.1, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, -1.2, -0.6); c.fill();
      c.strokeStyle = '#d9dde0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + w - 6, y + 5); c.lineTo(x + w - 8, cy + 2); c.lineTo(cx + r * 0.5, cy + r * 0.3); c.stroke(); c.fillStyle = '#c9cdd2'; c.beginPath(); c.arc(x + w - 6, y + 5, 2.4, 0, 7); c.fill();
      return;
    }
    const big = f.kind === 'espresso';
    box(c, x, y, w, h, big ? '#c9cdd2' : '#2b2f36', 'rgba(255,255,255,.35)', { fh: Math.min(12, h * 0.4), r: 3 });
    if (big) {
      IM.brushed(c, x, y, w, h, 1, 3);
      c.fillStyle = '#3a414a'; rr(c, x + 4, y + h * 0.38, w - 8, h * 0.26, 2); c.fill();
      [x + w * 0.25, x + w * 0.62].forEach(gx => { c.fillStyle = '#20262d'; c.fillRect(gx - 3, y + h * 0.4, 6, 5); c.fillStyle = '#7a4a2a'; c.fillRect(gx - 1, y + h * 0.4 + 5, 2, 3); c.fillStyle = '#e9e4d8'; rr(c, gx - 4, y + h * 0.5, 8, 6, 2); c.fill(); c.fillStyle = '#4a2b17'; c.fillRect(gx - 3, y + h * 0.5, 6, 1.6); });
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(x + 7, y + 6, 1.8, 0, 7); c.fill(); IM.knob(c, x + w - 8, y + 7, 2.4, '#e4eaed');
      c.strokeStyle = '#d9dde0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w - 5, y + h * 0.4); c.lineTo(x + w - 3, y + h * 0.7); c.stroke();
    } else {
      c.fillStyle = '#10141a'; rr(c, x + 4, y + h * 0.34, w - 8, h * 0.4, 3); c.fill();
      c.fillStyle = 'rgba(120,70,30,.85)'; rr(c, x + w / 2 - 5, y + h * 0.44, 10, h * 0.28, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + w / 2 - 3.6, y + h * 0.46, 1.6, h * 0.2);
      c.fillStyle = '#3bff6a'; c.fillRect(x + 5, y + 4, 4, 3);
    }
  },
  atm(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    box(c, x, y, w, h, '#3a414a', 'rgba(255,255,255,.2)', { fh: Math.max(10, h * 0.55), r: 3 });
    IM.brushed(c, x, y, w, h, 0.9, 3);
    PROP.monitor(c, x + 6, y + 8, w - 12, h * 0.3, '#1d5f8a');
    c.fillStyle = '#c9cdd2'; for (let i = 0; i < 12; i++) { c.fillStyle = '#d9dde0'; rr(c, x + 9 + (i % 3) * 8.4, y + h * 0.5 + Math.floor(i / 3) * 5.6, 6.4, 3.8, 1); c.fill(); }
    c.fillStyle = '#10141a'; c.fillRect(x + 8, y + h - 12, w - 16, 4); c.fillStyle = '#3bff6a'; c.fillRect(x + w - 11, y + h * 0.5 - 2, 2.4, 2.4);
    c.fillStyle = IM.grad(c, 0, y - 5, 0, y + 2, [[0, '#2f86b5'], [1, '#1d5f8a']]); c.fillRect(x, y - 4, w, 6.4); signText(c, 'ATM', x + w / 2, y - 0.8, 6, '#fff');
    addEmit(x + w / 2, y + 14, 20, 1, 0.6);
  },
  booktable(c, f) {
    FURN.table(c, Object.assign({}, f, { label: null }));
    const x = f.x, y = f.y, w = f.w, h = f.h, cols = ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085'], r = IM.rng(fsd(f), 6, 7);
    // stacks of face-up books and a few standing on little easels
    for (let i = 0, bx = x + 8; bx < x + w - 24; bx += 24, i++) {
      const n = 2 + (i % 3);
      for (let k = 0; k < n; k++) PROP.book(c, bx - (k % 2) * 1.4, y + 18 - k * 4, 19, 6, cols[(i + k) % cols.length]);
      if (i % 2 === 0) { c.fillStyle = cols[(i + 3) % cols.length]; c.fillRect(bx + 3, y + 5, 9, 11); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx + 4, y + 7, 7, 2); c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(bx + 3, y + 15, 9, 1); }
    }
    PROP.mug(c, x + w - 12, y + 22);
    if (f.label) { c.fillStyle = '#f6f1e7'; rr(c, x + w / 2 - 30, y + h - 15, 60, 10, 2); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.2)'; c.fillRect(x + w / 2 - 29, y + h - 6, 58, 1); signText(c, f.label, x + w / 2, y + h - 9.4, 7, '#33261a'); }
    void r;
  },
  pegboard(c, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h, r = IM.rng(fsd(f), 7, 8);
    box(c, x, y, w, h, '#c9a06a', null, { fh: 5, r: 2 });
    c.fillStyle = IM.grad(c, 0, y, 0, y + h, [[0, '#d9b07a'], [1, '#b98a55']]); c.fillRect(x + 1.5, y + 1.5, w - 3, h - 8);
    for (let yy = y + 4; yy < y + h - 7; yy += 6) for (let xx = x + 4; xx < x + w - 3; xx += 6) { c.fillStyle = 'rgba(40,24,10,.45)'; c.fillRect(xx, yy, 1.5, 1.5); c.fillStyle = 'rgba(255,240,214,.3)'; c.fillRect(xx, yy + 1.5, 1.5, 0.7); }
    const tools = ['#c0392b', '#2b2f36', '#e9c46a', '#2a6f97', '#5a6672'];
    for (let i = 0, tx = x + 10; tx < x + w - 14; tx += 18 + r() * 6, i++) {
      const col = tools[i % tools.length], k = i % 4;
      c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(tx + 1.2, y + 5, 3, h - 14);   // shadow on the board
      if (k === 0) { c.fillStyle = '#9aa7ad'; c.fillRect(tx, y + 8, 2.6, h - 18); c.fillStyle = '#2b2f36'; c.fillRect(tx - 3, y + 6, 9, 5); c.fillStyle = col; rr(c, tx - 0.4, y + h - 16, 3.4, 9, 1.2); c.fill(); }   // hammer
      else if (k === 1) { c.fillStyle = IM.grad(c, tx, 0, tx + 3, 0, [[0, '#dfe5e9'], [1, '#7a8791']]); c.fillRect(tx, y + 6, 3, h - 16); c.fillStyle = col; rr(c, tx - 1, y + h - 15, 5, 8, 2); c.fill(); }   // screwdriver
      else if (k === 2) { c.strokeStyle = '#9aa7ad'; c.lineWidth = 2.6; c.beginPath(); c.arc(tx + 3, y + 10, 4.4, 0.4, 5.9); c.stroke(); c.fillRect(tx + 1.6, y + 14, 2.8, h - 24); c.fillStyle = '#7a8791'; c.fillRect(tx + 1.6, y + 14, 2.8, h - 24); }   // spanner
      else { c.fillStyle = col; rr(c, tx - 2, y + 7, 9, h - 17, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(tx - 0.4, y + 9, 1.4, h - 21); c.fillStyle = '#10141a'; c.fillRect(tx, y + 9 + (h - 21) * 0.6, 5, 1.2); }   // a handled tool
      c.fillStyle = '#7a8791'; c.beginPath(); c.arc(tx + 1.5, y + 5, 1.1, 0, 7); c.fill();
    }
  }
});

/* ---------- things painted on the back wall ---------- */
function wallPoster(c, x, w, cols, text) {
  IM.shadow(c, x - 3, 10, w + 6, 64, 1.5, 4, 0.4, 1.5, 3);
  c.fillStyle = IM.grad(c, x - 3, 10, x + w + 3, 74, [[0, '#f1dc9a'], [0.5, '#d4a017'], [1, '#8a6a2e']]); c.fillRect(x - 3, 10, w + 6, 64);
  c.fillStyle = 'rgba(' + IM.INK + ',.3)'; c.fillRect(x, 13, w, 58);
  const g = c.createLinearGradient(0, 13, 0, 71); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
  c.fillStyle = g; c.fillRect(x + 0.5, 13.5, w - 1, 57);
  // the film: a sun or moon, rolling hills, a tiny figure
  c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(x + w * 0.65, 30, w * 0.18, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x + w * 0.65, 30, w * 0.09, 0, 7); c.fill();
  c.fillStyle = 'rgba(0,0,0,.38)'; c.beginPath(); c.moveTo(x, 60); c.quadraticCurveTo(x + w / 2, 44, x + w, 58); c.lineTo(x + w, 71); c.lineTo(x, 71); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(x + w * 0.3, 50, 2.6, 0, 7); c.fill(); c.fillRect(x + w * 0.3 - 1.8, 52, 3.6, 8);
  c.fillStyle = IM.grad(c, x, 13, x + w * 0.6, 40, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(x, 13, w, 58);
  c.font = '800 7px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
  let t = text.toUpperCase(); while (c.measureText(t).width > w - 6 && t.length > 4) t = t.slice(0, -2) + '…';
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillText(t, x + w / 2 + 0.5, 65.8); c.fillStyle = '#fff'; c.fillText(t, x + w / 2, 65);
  litRect(x, 13, w, 58);
}
function chalkboard(c, x, w, title, lines) {
  IM.shadow(c, x - 4, 8, w + 8, 66, 2, 5, 0.4, 1.5, 3);
  c.fillStyle = IM.grad(c, x - 4, 8, x + w + 4, 74, [[0, '#9a7248'], [0.5, '#7a5738'], [1, '#4a301c']]); c.fillRect(x - 4, 8, w + 8, 66);
  IM.grain(c, x - 4, 8, w + 8, 66, w, 0.9);
  c.fillStyle = IM.grad(c, x, 12, x + w, 70, [[0, '#2f3f38'], [1, '#1b2622']]); c.fillRect(x, 12, w, 58);
  // ghosted old chalk, a smudged eraser sweep, then the new writing
  c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.ellipse(x + w * 0.5, 40, w * 0.4, 16, -0.1, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 6, 62); c.quadraticCurveTo(x + w / 2, 58, x + w - 6, 64); c.stroke();
  c.font = '700 8px "Bricolage Grotesque",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3e6a1'; c.fillText(title, x + w / 2, 21);
  c.strokeStyle = 'rgba(243,230,161,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + w * 0.2, 27); c.lineTo(x + w * 0.8, 27); c.stroke();
  c.font = '500 6.5px "DM Sans",sans-serif'; c.fillStyle = 'rgba(255,255,255,.88)'; c.textAlign = 'left';
  lines.forEach((l, i) => c.fillText(l, x + 6, 36 + i * 8.6));
  c.fillStyle = IM.grad(c, 0, 70, 0, 74, [[0, '#9a7248'], [1, '#5a3d24']]); c.fillRect(x - 2, 70, w + 4, 3.4);
  c.fillStyle = '#f6f1e7'; c.fillRect(x + w - 16, 69, 7, 2); c.fillStyle = '#f3e6a1'; c.fillRect(x + w - 8, 69.4, 4, 1.6);
}
function wallMirror(c, x, w) {
  IM.shadow(c, x - 4, 6, w + 8, 70, 18, 5, 0.4, 1.5, 3);
  c.fillStyle = IM.grad(c, x - 4, 6, x + w + 4, 76, [[0, '#f1dc9a'], [0.5, '#d4a017'], [1, '#8a6a2e']]); rr(c, x - 4, 6, w + 8, 70, 18); c.fill();
  const g = c.createLinearGradient(x, 10, x + w, 72); g.addColorStop(0, '#eef6fa'); g.addColorStop(0.5, '#b9d4e0'); g.addColorStop(1, '#8fb0c2');
  c.fillStyle = g; rr(c, x, 10, w, 62, 15); c.fill();
  IM.clip(c, x, 10, w, 62, 15, () => {
    // the room reflected: a pale wall, a hint of the chair behind, a gloss sweep
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x, 10, w, 24); c.fillStyle = 'rgba(' + IM.INK + ',.12)'; c.fillRect(x, 54, w, 18);
    c.fillStyle = 'rgba(58,51,64,.28)'; rr(c, x + w * 0.3, 40, w * 0.4, 28, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x + 8, 64); c.lineTo(x + w * 0.4, 12); c.lineTo(x + w * 0.55, 12); c.lineTo(x + 18, 70); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x + w * 0.5, 72); c.lineTo(x + w * 0.76, 12); c.lineTo(x + w * 0.8, 12); c.lineTo(x + w * 0.56, 72); c.closePath(); c.fill();
  });
  c.strokeStyle = 'rgba(' + IM.INK + ',.35)'; c.lineWidth = 1; rr(c, x, 10, w, 62, 15); c.stroke();
  // vanity bulbs around the top
  for (let i = 0; i < 5; i++) { const bx = x + 8 + i * (w - 16) / 4, by = 8 - Math.sin(i / 4 * Math.PI) * 0.5; c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(bx, by, 2.6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(bx - 0.7, by - 0.7, 0.9, 0, 7); c.fill(); }
  addEmit(x + w / 2, 10, w * 0.6, 0, 0.4);
}
function vaultDoor(c, x) {
  IM.shadow(c, x - 40, 6, 80, 80, 40, 6, 0.4, 2, 4);
  c.fillStyle = IM.grad(c, x - 40, 0, x + 40, 90, [[0, '#9aa1a9'], [1, '#4a4f56']]); c.beginPath(); c.arc(x, 44, 40, 0, 7); c.fill();
  c.fillStyle = IM.grad(c, x - 36, 0, x + 36, 80, [[0, '#b7bec6'], [1, '#6b6f76']]); c.beginPath(); c.arc(x, 44, 35, 0, 7); c.fill();
  c.strokeStyle = 'rgba(' + IM.INK + ',.3)'; c.lineWidth = 1; c.beginPath(); c.arc(x, 44, 35, 0, 7); c.stroke();
  // bolts round the rim, spokes, a combination dial
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillStyle = '#d9dee2'; c.beginPath(); c.arc(x + Math.cos(a) * 38, 44 + Math.sin(a) * 38, 1.6, 0, 7); c.fill(); c.fillStyle = 'rgba(' + IM.INK + ',.4)'; c.beginPath(); c.arc(x + Math.cos(a) * 38 + 0.6, 44 + Math.sin(a) * 38 + 0.8, 1, 0, 7); c.fill(); }
  c.strokeStyle = '#6b6f76'; c.lineWidth = 3.4; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(x, 44); c.lineTo(x + Math.cos(a) * 20, 44 + Math.sin(a) * 20); c.stroke(); }
  c.strokeStyle = '#dfe5e9'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.moveTo(x, 43); c.lineTo(x + Math.cos(a) * 20, 43 + Math.sin(a) * 20); c.stroke(); }
  c.lineCap = 'butt';
  c.fillStyle = IM.grad(c, x - 8, 36, x + 8, 52, [[0, '#f0f4f6'], [1, '#8a979f']]); c.beginPath(); c.arc(x, 44, 8, 0, 7); c.fill(); c.fillStyle = '#2b2f36'; c.beginPath(); c.arc(x, 44, 2, 0, 7); c.fill();
  c.strokeStyle = '#c9a45c'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, 44, 12, 0, 7); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x - 8, 34, 14, Math.PI, Math.PI * 1.6); c.lineTo(x - 8, 34); c.fill();
  c.fillStyle = IM.grad(c, 0, 38, 0, 60, [[0, '#c9a45c'], [1, '#7a5a2e']]); c.fillRect(x + 36, 38, 6, 12); c.fillRect(x + 36, 56, 6, 8);   // hinges
}
function wheelWall(c, x, w) {
  // spare wheels hung from hooks on the wall, spokes catching the light
  for (let i = 0; i * 34 + 17 < w; i++) {
    const cx = x + 17 + i * 34, cy = 30 + (i % 2) * 18;
    IM.shadow(c, cx - 15, cy - 15, 30, 30, 15, 4, 0.34, 1.5, 3);
    c.strokeStyle = '#2b2f36'; c.lineWidth = 3.4; c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, 15.4, Math.PI * 1.1, Math.PI * 1.8); c.stroke();
    c.strokeStyle = '#c9cdd2'; c.lineWidth = 0.6; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 8; c.beginPath(); c.moveTo(cx - Math.cos(a) * 12.4, cy - Math.sin(a) * 12.4); c.lineTo(cx + Math.cos(a) * 12.4, cy + Math.sin(a) * 12.4); c.stroke(); }
    c.fillStyle = '#9aa7ad'; c.beginPath(); c.arc(cx, cy, 2.4, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(cx - 0.6, cy - 0.6, 0.9, 0, 7); c.fill();
    c.fillStyle = '#7a8791'; c.fillRect(cx - 1, cy - 20, 2, 5);
  }
}
