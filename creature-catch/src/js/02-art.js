// Art: creature sprites (real ones from art/creatures, or a code-drawn stand-in), people, the cube,
// tinted silhouettes, and the particle layer.
var CC = window.CC || (window.CC = {});

CC.makeCanvas = function (w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r) { return '#' + r.map(function (v) { return ('0' + CC.clamp(Math.round(v), 0, 255).toString(16)).slice(-2); }).join(''); }
CC.shade = function (hex, k) { // k < 0 darker, k > 0 lighter
  var c = hexRgb(hex);
  return rgbHex(c.map(function (v) { return k < 0 ? v * (1 + k) : v + (255 - v) * k; }));
};

// ---------- the stand-in creature painter ----------
// A 64x64 grid of colors; shapes are filled with a top-light/bottom-dark ramp, then outlined.
function Grid(n) { this.n = n; this.px = new Array(n * n).fill(null); }
Grid.prototype.set = function (x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.n && y < this.n) this.px[y * this.n + x] = c; };
Grid.prototype.get = function (x, y) { return x < 0 || y < 0 || x >= this.n || y >= this.n ? null : this.px[y * this.n + x]; };
Grid.prototype.fill = function (test, color) {
  for (var y = 0; y < this.n; y++) for (var x = 0; x < this.n; x++) if (test(x + 0.5, y + 0.5)) this.set(x, y, typeof color === 'function' ? color(x + 0.5, y + 0.5) : color);
};
function ell(cx, cy, rx, ry) { return function (x, y) { return ((x - cx) / rx) * ((x - cx) / rx) + ((y - cy) / ry) * ((y - cy) / ry) <= 1; }; }
function poly(pts) {
  return function (x, y) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}
function ramp(base, top, bottom) { // light at the top of a shape, dark at the bottom
  var lt = CC.shade(base, 0.28), dk = CC.shade(base, -0.28);
  return function (x, y) { var k = (y - top) / Math.max(1, bottom - top); return k < 0.3 ? lt : k > 0.72 ? dk : base; };
}
function outline(gr, color) {
  var out = gr.px.slice();
  for (var y = 0; y < gr.n; y++) for (var x = 0; x < gr.n; x++) {
    if (gr.get(x, y)) continue;
    if (gr.get(x + 1, y) || gr.get(x - 1, y) || gr.get(x, y + 1) || gr.get(x, y - 1)) out[y * gr.n + x] = color;
  }
  gr.px = out;
}
function eyes(gr, pts, r, fierce) {
  pts.forEach(function (p) {
    gr.fill(ell(p[0], p[1], r, r * 1.15), '#ffffff');
    gr.fill(ell(p[0] + r * 0.2, p[1] + r * 0.15, r * 0.62, r * 0.8), '#1e1626');
    gr.set(p[0] - r * 0.15, p[1] - r * 0.35, '#ffffff');
    if (fierce) for (var i = -r; i <= r; i++) gr.set(p[0] + i, p[1] - r - 1 + (i * (p[0] < 32 ? 0.4 : -0.4)), '#1e1626');
  });
}

var BODIES = {
  quad: function (gr, m, a) {
    gr.fill(ell(50, 34, 6, 12), ramp(a, 22, 46));                                 // tail
    [[22, 50], [29, 52], [38, 52], [45, 50]].forEach(function (l) { gr.fill(ell(l[0], l[1], 3.5, 6), CC.shade(m, -0.3)); });
    gr.fill(ell(34, 42, 17, 10), ramp(m, 32, 52));                                // body
    gr.fill(ell(34, 46, 10, 5), CC.shade(a, 0.4));                                // chest
    gr.fill(poly([[14, 22], [17, 8], [23, 18]]), ramp(m, 8, 22));                 // ears
    gr.fill(poly([[27, 18], [32, 7], [35, 20]]), ramp(m, 8, 22));
    gr.fill(ell(24, 28, 12, 11), ramp(m, 17, 39));                                // head
    gr.fill(ell(19, 33, 5, 3.5), CC.shade(m, 0.45));                              // muzzle
    gr.set(16, 32, '#2a1a20'); gr.set(17, 32, '#2a1a20');
    eyes(gr, [[20, 26], [29, 26]], 2.6);
  },
  round: function (gr, m, a) {
    gr.fill(ell(14, 30, 7, 10), ramp(a, 20, 40)); gr.fill(ell(50, 30, 7, 10), ramp(a, 20, 40)); // wings / ears
    gr.fill(ell(32, 37, 20, 19), ramp(m, 18, 56));
    gr.fill(ell(32, 44, 12, 9), CC.shade(m, 0.4));
    gr.fill(ell(23, 56, 6, 3), CC.shade(m, -0.35)); gr.fill(ell(41, 56, 6, 3), CC.shade(m, -0.35));
    gr.fill(ell(32, 19, 6, 3), a);
    eyes(gr, [[25, 32], [39, 32]], 3);
    for (var i = -2; i <= 2; i++) gr.set(32 + i, 40 + Math.abs(i) * 0.5, '#5a2a30');
  },
  bird: function (gr, m, a) {
    gr.fill(ell(14, 38, 6, 12), ramp(a, 26, 50)); gr.fill(ell(50, 38, 6, 12), ramp(a, 26, 50));
    gr.fill(ell(32, 38, 16, 18), ramp(m, 20, 56));
    gr.fill(ell(32, 45, 10, 10), CC.shade(m, 0.5));
    gr.fill(poly([[29, 31], [35, 31], [32, 37]]), '#f0a030');
    gr.fill(ell(26, 57, 4, 2), '#f0a030'); gr.fill(ell(38, 57, 4, 2), '#f0a030');
    eyes(gr, [[26, 27], [38, 27]], 3.2);
  },
  fish: function (gr, m, a) {
    gr.fill(poly([[46, 36], [60, 24], [58, 36], [60, 48]]), ramp(a, 24, 48));
    gr.fill(poly([[26, 24], [38, 16], [40, 26]]), ramp(a, 16, 26));
    gr.fill(ell(30, 37, 20, 14), ramp(m, 23, 51));
    gr.fill(ell(28, 42, 13, 7), CC.shade(m, 0.45));
    gr.fill(ell(34, 44, 5, 3), ramp(a, 41, 47));
    eyes(gr, [[19, 33]], 4);
    gr.set(11, 40, '#2a1a20'); gr.set(12, 41, '#2a1a20');
  },
  bug: function (gr, m, a) {
    for (var i = 0; i < 3; i++) { gr.fill(poly([[24 + i * 8, 44], [20 + i * 8, 56], [22 + i * 8, 56], [27 + i * 8, 44]]), CC.shade(m, -0.4)); }
    gr.fill(ell(36, 40, 18, 13), ramp(m, 27, 53));
    gr.fill(ell(38, 36, 15, 8), ramp(a, 28, 44));
    gr.fill(poly([[37, 28], [38, 46], [39, 28]]), CC.shade(m, -0.4));
    gr.fill(ell(17, 41, 9, 8), ramp(m, 33, 49));
    for (var j = 0; j < 7; j++) { gr.set(14 - j * 0.6, 32 - j, '#2a1a20'); gr.set(20 + j * 0.2, 32 - j, '#2a1a20'); }
    gr.fill(ell(10, 25, 2, 2), a); gr.fill(ell(21, 25, 2, 2), a);
    eyes(gr, [[14, 39], [21, 39]], 2.2);
  },
  serpent: function (gr, m, a) {
    var pts = [[52, 50], [46, 54], [38, 54], [32, 50], [30, 44], [34, 38], [38, 32], [36, 26]];
    pts.forEach(function (p, i) { gr.fill(ell(p[0], p[1], 6 + i * 0.3, 6 + i * 0.3), ramp(i % 2 ? m : CC.shade(m, -0.08), p[1] - 7, p[1] + 7)); });
    pts.forEach(function (p, i) { if (i % 2) gr.fill(ell(p[0], p[1] + 2, 3, 2), CC.shade(a, 0.2)); });
    gr.fill(ell(30, 20, 12, 9), ramp(m, 11, 29));
    gr.fill(poly([[26, 12], [30, 4], [33, 12]]), a);
    eyes(gr, [[25, 18], [34, 18]], 2.8, true);
    for (var i = -3; i <= 3; i++) gr.set(30 + i, 25, '#5a2a30');
  },
  biped: function (gr, m, a) {
    gr.fill(ell(24, 55, 5, 4), CC.shade(m, -0.3)); gr.fill(ell(40, 55, 5, 4), CC.shade(m, -0.3));
    gr.fill(ell(14, 38, 4, 9), ramp(m, 29, 47)); gr.fill(ell(50, 38, 4, 9), ramp(m, 29, 47));
    gr.fill(ell(32, 40, 15, 15), ramp(m, 25, 55));
    gr.fill(ell(32, 42, 7, 7), ramp(a, 35, 49));
    gr.fill(ell(32, 18, 12, 11), ramp(m, 7, 29));
    gr.fill(poly([[21, 12], [19, 2], [27, 9]]), ramp(m, 2, 12)); gr.fill(poly([[43, 12], [45, 2], [37, 9]]), ramp(m, 2, 12));
    eyes(gr, [[27, 18], [37, 18]], 2.6, true);
  },
  ghost: function (gr, m, a) {
    gr.fill(function (x, y) { return ell(32, 28, 16, 17)(x, y) || (y > 28 && y < 52 + Math.sin(x * 0.7) * 3 && Math.abs(x - 32) < 16 - (y - 28) * 0.12); }, ramp(m, 11, 54));
    gr.fill(ell(32, 36, 8, 8), CC.shade(a, 0.3));
    gr.fill(ell(32, 36, 4, 5), '#ffffff');
    gr.fill(ell(14, 34, 4, 6), ramp(m, 28, 40)); gr.fill(ell(50, 34, 4, 6), ramp(m, 28, 40));
    eyes(gr, [[26, 24], [38, 24]], 2.8);
  },
  turtle: function (gr, m, a) {
    [[20, 50], [44, 50]].forEach(function (l) { gr.fill(ell(l[0], l[1], 5, 5), CC.shade('#a8784a', -0.1)); });
    gr.fill(ell(14, 38, 8, 7), ramp('#a8904a', 31, 45));
    gr.fill(ell(34, 40, 19, 12), ramp(CC.shade(m, -0.15), 28, 52));
    gr.fill(ell(34, 30, 15, 10), ramp(m, 20, 40));
    [[28, 24], [38, 22], [33, 30]].forEach(function (p) { gr.fill(ell(p[0], p[1], 5, 4), ramp(CC.shade(m, 0.2), p[1] - 4, p[1] + 4)); });
    gr.fill(ell(40, 21, 2.5, 2.5), a);
    eyes(gr, [[11, 36], [17, 36]], 2.2);
  },
  frog: function (gr, m, a) {
    gr.fill(ell(14, 52, 8, 4), CC.shade(m, -0.25)); gr.fill(ell(50, 52, 8, 4), CC.shade(m, -0.25));
    gr.fill(ell(32, 42, 22, 14), ramp(m, 28, 56));
    gr.fill(ell(32, 48, 14, 7), CC.shade(a, 0.35));
    gr.fill(ell(22, 28, 7, 7), ramp(m, 21, 35)); gr.fill(ell(42, 28, 7, 7), ramp(m, 21, 35));
    eyes(gr, [[22, 28], [42, 28]], 3.5);
    for (var i = -9; i <= 9; i++) gr.set(32 + i, 40 + Math.abs(i) * 0.15, '#4a1a20');
    gr.fill(ell(32, 41, 3, 2), '#f05a6a');
  },
};

function paintStandIn(c) {
  var gr = new Grid(64), body = BODIES[c.look.body] || BODIES.round;
  body(gr, c.look.main, c.look.accent);
  // evolved forms get a little crest so they read as bigger
  if (c.kind === 'final' || c.kind === 'starter2' || c.kind === 'starter3') {
    var ac = c.look.accent;
    gr.fill(poly([[30, 6], [33, 0], [36, 6]]), ac);
  }
  outline(gr, '#1e1626');
  var cv = CC.makeCanvas(64, 64), x = cv.getContext('2d');
  gr.px.forEach(function (col, i) { if (col) { x.fillStyle = col; x.fillRect(i % 64, Math.floor(i / 64), 1, 1); } });
  return cv;
}

// ---------- real sprites ----------
// Generated art arrives on white or magenta. Remove the background by flood fill from the edges (so white
// inside the bold outline stays), then fit it into 64x64.
function keyAndFit(img, size) {
  var w = img.naturalWidth, h = img.naturalHeight;
  var cv = CC.makeCanvas(w, h), x = cv.getContext('2d');
  x.drawImage(img, 0, 0);
  var d = x.getImageData(0, 0, w, h), p = d.data;
  var bg = [p[0], p[1], p[2]];
  var isBg = function (i) { return p[i + 3] < 20 || (Math.abs(p[i] - bg[0]) + Math.abs(p[i + 1] - bg[1]) + Math.abs(p[i + 2] - bg[2]) < 60); };
  if (p[3] > 200) { // only key out when the picture has no transparency of its own
    var seen = new Uint8Array(w * h), stack = [];
    for (var i = 0; i < w; i++) { stack.push(i, (h - 1) * w + i); }
    for (var j = 0; j < h; j++) { stack.push(j * w, j * w + w - 1); }
    while (stack.length) {
      var q = stack.pop();
      if (seen[q]) continue; seen[q] = 1;
      if (!isBg(q * 4)) continue;
      p[q * 4 + 3] = 0;
      var qx = q % w, qy = (q - qx) / w;
      if (qx > 0) stack.push(q - 1); if (qx < w - 1) stack.push(q + 1);
      if (qy > 0) stack.push(q - w); if (qy < h - 1) stack.push(q + w);
    }
    x.putImageData(d, 0, 0);
  }
  // crop to what's left, then fit
  var minX = w, minY = h, maxX = 0, maxY = 0;
  for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) if (p[(yy * w + xx) * 4 + 3] > 20) {
    if (xx < minX) minX = xx; if (yy < minY) minY = yy; if (xx > maxX) maxX = xx; if (yy > maxY) maxY = yy;
  }
  if (maxX < minX) { minX = 0; minY = 0; maxX = w - 1; maxY = h - 1; }
  var cw = maxX - minX + 1, ch = maxY - minY + 1, s = Math.min(size / cw, size / ch);
  var out = CC.makeCanvas(size, size), o = out.getContext('2d');
  o.imageSmoothingEnabled = s < 1; // shrinking a big picture needs smoothing; tiny pixel art stays hard-edged
  var dw = Math.round(cw * s), dh = Math.round(ch * s);
  o.drawImage(cv, minX, minY, cw, ch, Math.round((size - dw) / 2), size - dh, dw, dh);
  return out;
}

var spriteCache = {};
CC.creatureSprite = function (id) {
  if (spriteCache[id]) return spriteCache[id];
  var c = CC.CREATURES[id];
  spriteCache[id] = paintStandIn(c);
  var src = CC.ART && CC.ART['creatures/' + id];
  if (src) {
    var img = new Image();
    img.onload = function () { spriteCache[id] = keyAndFit(img, 64); tintCache = {}; };
    img.src = src;
  }
  return spriteCache[id];
};

// a solid-color copy of a sprite (white flash on hits, shadows, the evolution silhouette)
var tintCache = {};
CC.tinted = function (sprite, color, key) {
  var k = key + color;
  if (tintCache[k] && tintCache[k].src === sprite) return tintCache[k].cv;
  var cv = CC.makeCanvas(sprite.width, sprite.height), x = cv.getContext('2d');
  x.drawImage(sprite, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, cv.width, cv.height);
  tintCache[k] = { src: sprite, cv: cv };
  return cv;
};

// Draws a sprite with code-driven life: squash (sx, sy), wave (horizontal strip wobble), flip, alpha, flash.
// x, y is the middle of the feet.
CC.drawSprite = function (sprite, x, y, o) {
  o = o || {};
  var g = CC.g, w = sprite.width, h = sprite.height;
  var sx = (o.sx || 1) * (o.scale || 1), sy = (o.sy || 1) * (o.scale || 1);
  g.save();
  g.globalAlpha = o.alpha == null ? 1 : o.alpha;
  g.translate(Math.round(x), Math.round(y));
  if (o.flip) g.scale(-1, 1);
  var img = o.flash ? CC.tinted(sprite, o.flash, o.id || 'x') : sprite;
  if (o.wave) {
    for (var row = 0; row < h; row += 2) {
      var off = Math.round(Math.sin(CC.time * (o.waveSpeed || 10) + row * 0.25) * o.wave);
      g.drawImage(img, 0, row, w, 2, -w / 2 * sx + off, (row - h) * sy, w * sx, 2 * sy + 0.5);
    }
  } else {
    g.drawImage(img, -w / 2 * sx, -h * sy, w * sx, h * sy);
  }
  if (o.overlay && !o.flash) { g.globalAlpha *= o.overlay[1]; g.drawImage(CC.tinted(sprite, o.overlay[0], o.id || 'x'), -w / 2 * sx, -h * sy, w * sx, h * sy); }
  g.restore();
};

// ---------- the capture cube (code-drawn, purple top, blue bottom) ----------
CC.drawCube = function (x, y, size, o) {
  o = o || {};
  var g = CC.g, s = size || 8, h = s / 2;
  g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot);
  g.fillStyle = '#1e1626'; g.fillRect(-h - 1, -h - 1, s + 2, s + 2);
  var open = o.open || 0;
  g.fillStyle = '#9a4ae0'; g.fillRect(-h, -h - open, s, h);
  g.fillStyle = '#c88af8'; g.fillRect(-h, -h - open, s, 1);
  g.fillStyle = '#3a6ae8'; g.fillRect(-h, 0, s, h);
  g.fillStyle = '#2a4ab0'; g.fillRect(-h, h - 1, s, 1);
  g.fillStyle = open ? '#ffffff' : '#e8f0ff'; g.fillRect(-h, -0.5, s, 1);
  if (s >= 8) { g.fillStyle = '#ffffff'; g.fillRect(-1, -1, 2, 2); }
  if (o.glow) { g.globalAlpha = o.glow; g.fillStyle = '#ffffff'; g.fillRect(-h - 2, -h - 2, s + 4, s + 4); }
  g.restore();
};

// ---------- people (code-drawn, 16 x 24, 4 directions x 2 steps) ----------
var LOOKS = {
  player: { hair: '#7a4a2a', skin: '#f8d0b0', top: '#4f9a4a', legs: '#3a3a5a', pack: '#a8784a' },
  willow: { hair: '#f0f0f0', skin: '#f0c8a8', top: '#4f8a4a', legs: '#4f8a4a', beard: true, robe: true },
  hazel: { hair: '#c86a3a', skin: '#f8d8c0', top: '#e8f8ee', legs: '#8ad8b0', ribbon: '#f07ab0', robe: true },
  pip: { hair: '#5a3a2a', skin: '#f0c8a0', top: '#7a5ac8', legs: '#3a5ab0', apron: true },
  juniper: { hair: '#e0402a', skin: '#f8d0b0', top: '#3a5ab0', legs: '#2a2a3a', scarf: '#f8d040', spiky: true },
  bramble: { hair: '#8a6a3a', skin: '#e0b088', top: '#c84a3a', legs: '#4a6aa0', hat: '#e8c870' },
  tinker: { hair: '#f0d070', skin: '#f8d8c0', top: '#f8d040', legs: '#5a7ac0' },
  rosa: { hair: '#6a3a22', skin: '#f0c8a0', top: '#c83a3a', legs: '#c83a3a', apron: true, robe: true },
  ranger: { hair: '#3a2a1a', skin: '#e0b088', top: '#2a5a3a', legs: '#4a3a2a', hat: '#5a4a2a' },
};
var peopleCache = {};
function personFrame(look, dir, step, flip) {
  var gr = new Grid(24), front = dir === 'down', back = dir === 'up', side = dir === 'left' || dir === 'right';
  var legOff = step ? 1 : 0, bob = step ? 1 : 0;
  // legs
  if (side) { gr.fill(function (x, y) { return y > 18 && y < 23 && Math.abs(x - 11 + (step ? 1.5 : 0)) < 1.6; }, look.legs); gr.fill(function (x, y) { return y > 18 && y < 23 && Math.abs(x - 13 - (step ? 1.5 : 0)) < 1.6; }, CC.shade(look.legs, -0.25)); }
  else { gr.fill(function (x, y) { return y > 18 && y < 23 - (step && x < 12 ? 1 : 0) && x > 8.5 && x < 11.5; }, look.legs); gr.fill(function (x, y) { return y > 18 && y < 23 - (step && x > 12 ? 1 : 0) && x > 12.5 && x < 15.5; }, CC.shade(look.legs, -0.2)); }
  // body
  var by = 11 + bob * 0;
  if (look.robe) gr.fill(poly([[8, by], [16, by], [17.5, 21], [6.5, 21]]), ramp(look.top, by, 21));
  else gr.fill(function (x, y) { return y >= by && y < 19 && x > 7.5 && x < 16.5; }, ramp(look.top, by, 19));
  if (look.apron && !back) gr.fill(function (x, y) { return y >= by + 2 && y < 20 && x > 9 && x < 15; }, '#f8f4ea');
  if (look.pack && back) gr.fill(function (x, y) { return y >= by && y < 17 && x > 8.5 && x < 15.5; }, look.pack);
  if (look.pack && side) gr.fill(function (x, y) { return y >= by && y < 17 && (dir === 'right' ? x > 6 && x < 9 : x > 15 && x < 18); }, look.pack);
  if (look.scarf) gr.fill(function (x, y) { return y >= by && y < by + 2 && x > 7.5 && x < 16.5; }, look.scarf);
  // arms
  if (!side) { gr.fill(function (x, y) { return y >= by + 1 && y < 18 && ((x > 6 && x < 8) || (x > 16 && x < 18)); }, CC.shade(look.top, -0.15)); }
  // head
  gr.fill(ell(12, 7, 5.2, 5), look.skin);
  // hair
  if (back) gr.fill(ell(12, 6.5, 5.5, 5.4), look.hair);
  else if (side) gr.fill(function (x, y) { return ell(12, 6, 5.5, 4.8)(x, y) && (y < 5 || (dir === 'left' ? x > 13 : x < 11)); }, look.hair);
  else gr.fill(function (x, y) { return ell(12, 6, 5.5, 4.8)(x, y) && y < 5; }, look.hair);
  if (look.spiky) [[7, 2], [11, 0], [15, 1], [18, 4]].forEach(function (p) { gr.fill(poly([[p[0] - 2, p[1] + 4], [p[0], p[1]], [p[0] + 2, p[1] + 4]]), look.hair); });
  if (look.beard && !back) gr.fill(function (x, y) { return ell(12, 10.5, 4, 3.5)(x, y) && y > 9; }, look.hair);
  if (look.ribbon) gr.fill(ell(dir === 'left' ? 15 : 8, 2, 2, 1.5), look.ribbon);
  if (look.hat) { gr.fill(ell(12, 3.5, 7.5, 1.6), look.hat); gr.fill(ell(12, 2, 4.5, 2.5), CC.shade(look.hat, -0.1)); }
  // eyes
  if (front) { gr.set(10, 7, '#1e1626'); gr.set(14, 7, '#1e1626'); }
  if (side) gr.set(dir === 'left' ? 9 : 15, 7, '#1e1626');
  outline(gr, '#1e1626');
  var cv = CC.makeCanvas(24, 24), x = cv.getContext('2d');
  gr.px.forEach(function (col, i) { if (col) { x.fillStyle = col; x.fillRect(flip ? 23 - i % 24 : i % 24, Math.floor(i / 24), 1, 1); } });
  return cv;
}
CC.person = function (lookId, dir, step) {
  var k = lookId + dir + (step ? 1 : 0);
  if (!peopleCache[k]) {
    // drawn facing right, flipped for left
    peopleCache[k] = personFrame(LOOKS[lookId] || LOOKS.tinker, dir === 'left' ? 'right' : dir, step, dir === 'left');
  }
  return peopleCache[k];
};

// ---------- particles ----------
// Each particle: x, y, vx, vy, life, max, kind, color, size, grav, spin. Drawn as small code shapes per type.
CC.fx = {
  list: [],
  add: function (p) { p.max = p.life; p.rot = p.rot || 0; this.list.push(p); return p; },
  clear: function () { this.list.length = 0; },
  draw: function () {
    var g = CC.g, dt = CC.dt || 0.016;
    this.list = this.list.filter(function (p) {
      p.life -= dt; if (p.life <= 0) return false;
      p.vy += (p.grav || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.spin || 0) * dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      var k = p.life / p.max;
      g.save(); g.globalAlpha = p.fade === false ? 1 : Math.min(1, k * 2);
      CC.drawParticle(p.kind, p.x, p.y, p.size * (p.grow ? 1 + (1 - k) * p.grow : 1), p.color, p.rot);
      g.restore();
      return true;
    });
  },
};
CC.drawParticle = function (kind, x, y, s, color, rot) {
  var g = CC.g;
  g.translate(Math.round(x), Math.round(y)); if (rot) g.rotate(rot);
  g.fillStyle = color || '#ffffff';
  s = Math.max(1, s || 2);
  switch (kind) {
    case 'flame':
      g.fillStyle = '#f0502a'; g.fillRect(-s / 2, -s, s, s * 1.5);
      g.fillStyle = '#ffb030'; g.fillRect(-s / 4, -s / 2, s / 2, s);
      g.fillStyle = '#fff4a0'; g.fillRect(-s / 8, 0, s / 4, s / 3); break;
    case 'drop':
      g.fillRect(-s / 2, -s / 2, s, s); g.fillRect(-s / 4, -s, s / 2, s / 2);
      g.fillStyle = '#ffffff'; g.fillRect(-s / 4, -s / 4, 1, 1); break;
    case 'leaf':
      g.fillStyle = '#4fb04a'; g.fillRect(-s / 2, -s / 4, s, s / 2); g.fillRect(-s / 4, -s / 2, s / 2, s);
      g.fillStyle = '#a8e88a'; g.fillRect(-s / 2, -s / 4, s / 2, 1); break;
    case 'rock':
      g.fillStyle = '#6a4a2c'; g.fillRect(-s / 2, -s / 2, s, s);
      g.fillStyle = '#a8784a'; g.fillRect(-s / 2, -s / 2, s - 1, s - 1);
      g.fillStyle = '#e0c08a'; g.fillRect(-s / 2, -s / 2, s / 2, 1); break;
    case 'bolt':
      g.fillStyle = color || '#fff07a';
      g.fillRect(-1, -s, 2, s / 2); g.fillRect(-s / 3, -s / 2, s / 2 + 1, 2); g.fillRect(0, -s / 2, 2, s); break;
    case 'flake':
      g.fillStyle = color || '#e4faff';
      g.fillRect(-s / 2, -0.5, s, 1); g.fillRect(-0.5, -s / 2, 1, s);
      g.fillRect(-s / 3, -s / 3, 1, 1); g.fillRect(s / 3 - 1, s / 3 - 1, 1, 1); g.fillRect(-s / 3, s / 3 - 1, 1, 1); g.fillRect(s / 3 - 1, -s / 3, 1, 1); break;
    case 'wisp':
      g.globalAlpha *= 0.85; g.fillStyle = color || '#6e46a0';
      g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a2260'; g.fillRect(-s / 4, -s / 4, s / 2, s / 2); break;
    case 'star':
      g.fillStyle = color || '#fff8d8';
      g.fillRect(-s / 2, -0.5, s, 1); g.fillRect(-0.5, -s / 2, 1, s); g.fillRect(-1, -1, 2, 2); break;
    case 'dust':
      g.globalAlpha *= 0.7; g.fillStyle = color || '#e8dcc8';
      g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill(); break;
    case 'glow':
      g.globalAlpha *= 0.5; g.fillStyle = color || '#ffffff';
      g.beginPath(); g.arc(0, 0, s, 0, Math.PI * 2); g.fill();
      g.globalAlpha *= 1.4; g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill(); break;
    case 'ring':
      g.strokeStyle = color || '#ffffff'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(0, 0, s, 0, Math.PI * 2); g.stroke(); break;
    case 'z':
      g.fillStyle = color || '#ffffff';
      g.fillRect(-2, -2, 5, 1); g.fillRect(-2, 2, 5, 1); g.fillRect(-1, 1, 1, 1); g.fillRect(0, 0, 1, 1); g.fillRect(1, -1, 1, 1); break;
    case 'bubble':
      g.strokeStyle = color || '#b46ae0'; g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.stroke(); break;
    case 'arrow':
      g.fillStyle = color || '#ff8a3a';
      g.fillRect(-1, -s / 2, 2, s); g.fillRect(-3, -s / 2 + 2, 6, 1); g.fillRect(-2, -s / 2 + 1, 4, 1); break;
    case 'blade':
      g.fillStyle = color || '#ffffff'; g.fillRect(-s, -0.5, s * 2, 1.5); break;
    case 'grass':
      g.fillStyle = color || '#4fb04a'; g.fillRect(-1, -s, 2, s); g.fillRect(1, -s + 1, 1, s - 2); break;
    default:
      g.fillRect(-s / 2, -s / 2, s, s);
  }
};
// which particle shape a type throws, and its colors
CC.TYPE_FX = {
  Normal: { kind: 'star', colors: ['#ffffff', '#fff4c0'] },
  Fire: { kind: 'flame', colors: ['#f0602c'] },
  Water: { kind: 'drop', colors: ['#3a8ee8', '#8fd0ff'] },
  Plant: { kind: 'leaf', colors: ['#4fb04a'] },
  Earth: { kind: 'rock', colors: ['#a8784a'] },
  Bolt: { kind: 'bolt', colors: ['#fff07a', '#ffffff'] },
  Frost: { kind: 'flake', colors: ['#e4faff', '#9adcf0'] },
  Shadow: { kind: 'wisp', colors: ['#6e46a0', '#3a2260', '#b48ad8'] },
  Lumen: { kind: 'star', colors: ['#fff8d8', '#f0dc8a'] },
};
CC.burst = function (type, x, y, n, speed, opts) {
  var f = CC.TYPE_FX[type] || CC.TYPE_FX.Normal; opts = opts || {};
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8);
    CC.fx.add({
      x: x + CC.rand(-3, 3), y: y + CC.rand(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.up || 0),
      life: CC.rand(0.35, 0.7) * (opts.life || 1), kind: opts.kind || f.kind, color: CC.pick(f.colors),
      size: CC.rand(3, 6) * (opts.size || 1), grav: opts.grav || 0, spin: CC.rand(-6, 6), drag: 2,
    });
  }
};
