// Life on the field, part two: walking that reads as walking, the creature that follows you, footprints, dust and
// ripples, day and night, and the sign that slides in with each new place's name.
var CC = window.CC || (window.CC = {});

(function () {
  // ---------- walking ----------
  // The walk sheets have 3 frames a row. Front and back already step (stride, feet together, other stride), but the
  // side rows are three strides, so they glide. Until the 4-frame side strips (walk/side-<who>, facing left) arrive,
  // the "feet together" frame is made here: the legs of a stride are pulled in under the hips, row by row.
  var passCache = {};
  function passingFrame(sheet, key, row) {
    var k = key + row;
    if (passCache[k]) return passCache[k];
    var cw = Math.floor(sheet.width / 3), ch = Math.floor(sheet.height / 4);
    var src = CC.makeCanvas(cw, ch), sx = src.getContext('2d');
    sx.drawImage(sheet, cw, row * ch, cw, ch, 0, 0, cw, ch);
    var d = sx.getImageData(0, 0, cw, ch).data, rows = [];
    var top = ch, bottom = -1;
    for (var y = 0; y < ch; y++) {
      var l = -1, r = -1;
      for (var x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 40) { if (l < 0) l = x; r = x; }
      rows.push([l, r]);
      if (l >= 0) { top = Math.min(top, y); bottom = y; }
    }
    var out = CC.makeCanvas(cw, ch), o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    if (bottom < 0) return (passCache[k] = src);
    var legTop = bottom - Math.round((bottom - top) * 0.3);
    // the middle of the body just above the legs
    var sum = 0, n = 0;
    for (var yy = Math.max(top, legTop - 5); yy < legTop; yy++) if (rows[yy][0] >= 0) { sum += (rows[yy][0] + rows[yy][1]) / 2; n++; }
    var mid = n ? sum / n : cw / 2;
    o.drawImage(src, 0, 0, cw, legTop, 0, -1, cw, legTop); // the body, a pixel higher
    for (var ly = legTop; ly <= bottom; ly++) {
      var span = rows[ly];
      if (span[0] < 0) continue;
      var w = span[1] - span[0] + 1, nw = Math.max(3, Math.round(w * 0.55));
      o.drawImage(src, span[0], ly, w, 1, Math.round(mid - nw / 2), ly - 1, nw, 1);
      if (ly === bottom) o.drawImage(src, span[0], ly, w, 1, Math.round(mid - nw / 2), ly, nw, 1); // the soles stay on the ground
    }
    return (passCache[k] = out);
  }
  // draws a walking person from their sheet; phase 0..3 steps through a walk, 1 when standing still
  CC.drawWalker = function (g, sheet, key, dir, phase, moving, fx, fy) {
    var cw = sheet.width / 3, ch = sheet.height / 4, row = { down: 0, left: 1, right: 2, up: 3 }[dir], k = 27 / ch;
    var side = dir === 'left' || dir === 'right', strip = side && CC.img('walk/side-' + key);
    if (strip) { // the real 4-frame side walk, facing left (mirrored for right)
      var sw = strip.width / 4, sk = 27 / strip.height, f = moving ? phase : 1;
      g.save(); g.translate(Math.round(fx), Math.round(fy)); if (dir === 'right') g.scale(-1, 1);
      g.drawImage(strip, f * sw, 0, sw, strip.height, -sw * sk / 2, -strip.height * sk, sw * sk, strip.height * sk);
      g.restore();
      return;
    }
    if (side && (!moving || phase % 2 === 1)) {
      var pf = passingFrame(sheet, key, row);
      g.drawImage(pf, 0, 0, pf.width, pf.height, Math.round(fx - cw * k / 2), Math.round(fy - ch * k), cw * k, ch * k);
      return;
    }
    var frame = side ? (phase === 0 ? 0 : 2) : [0, 1, 2, 1][phase];
    var bounce = moving && frame !== 1 ? -0.5 : 0;
    g.drawImage(sheet, frame * cw, row * ch, cw, ch, Math.round(fx - cw * k / 2), Math.round(fy - ch * k + bounce), cw * k, ch * k);
  };
  // which walk sheet a person uses: the player's look, an NPC's sheet, or any person whose art has one
  CC.walkKey = function (npc) {
    if (!npc) return CC.state.look || 'player-a';
    if (npc.sheet) return npc.sheet;
    return npc.art && CC.img('walk/' + npc.art) ? npc.art : null;
  };

  // ---------- the creature that follows you ----------
  // It trails one step behind: whenever you step, it steps into the tile you just left.
  var fol = { x: 0, y: 0, fx: 0, fy: 0, k: 1, dir: 'down', on: false, heart: 0 };
  CC.follower = fol;
  function lead() {
    var i = CC.firstHealthy();
    return i >= 0 ? CC.state.party[i] : null;
  }
  CC.followReset = function (w) {
    var s = CC.state, back = CC.DIRS[{ up: 'down', down: 'up', left: 'right', right: 'left' }[s.dir] || 'up'];
    var bx = s.x + back[0], by = s.y + back[1];
    var free = w.map && !w.solidAt(bx, by) && !w.exitAt(bx, by);
    fol.x = fol.fx = free ? bx : s.x; fol.y = fol.fy = free ? by : s.y; fol.k = 1; fol.dir = s.dir; fol.on = free;
  };
  CC.followStep = function (fromX, fromY) {
    fol.fx = fol.x; fol.fy = fol.y; fol.x = fromX; fol.y = fromY; fol.k = 0;
    var dx = fol.x - fol.fx, dy = fol.y - fol.fy;
    if (dx || dy) fol.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    fol.on = true;
  };
  CC.followerShown = function () { return CC.opts.follower && fol.on && !!lead() && !(CC.world.arrive); };
  CC.followerAt = function (x, y) { return CC.followerShown() && fol.x === x && fol.y === y; };
  // where it is drawn (between tiles while it walks)
  CC.followerPos = function (w) {
    var k = w.moving ? w.moving.k : 1;
    if (fol.k < 1) fol.k = k;
    return [CC.lerp(fol.fx, fol.x, fol.k) * 16, CC.lerp(fol.fy, fol.y, fol.k) * 16];
  };
  CC.drawFollower = function (w, px, py) {
    var m = lead(), g = CC.g;
    if (!m) return;
    var fx = w.screenX(px) + 8, fy = w.screenY(py) + 14;
    if (fx < -30 || fy < -10 || fx > CC.W + 30 || fy > CC.H + 40) return;
    var walking = fol.k < 1 && w.moving, hop = walking ? Math.abs(Math.sin(fol.k * Math.PI)) * 3 : Math.abs(Math.sin(CC.time * 2.2)) * 0.8;
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(fx, fy + 1, 6 - hop * 0.4, 2, 0, 0, Math.PI * 2); g.fill();
    var sp = CC.creatureSprite(m.id, m.shiny), body = CC.mon.sp(m).look.body;
    var fly = body === 'ghost' || body === 'bird' ? 3 + Math.sin(CC.time * 3) * 1.5 : 0;
    CC.drawSprite(sp, fx, fy - hop - fly, { scale: 0.3, flip: fol.dir === 'right', sy: 1 + (walking ? 0 : Math.sin(CC.time * 3) * 0.03), id: m.id + 'fol' });
    if (m.shiny && Math.random() < 0.03) {
      var spk = CC.img('fx/field-6');
      CC.fx.add({ x: fx + CC.rand(-8, 8), y: fy - CC.rand(6, 20), vx: 0, vy: -8, life: 0.6, img: spk, kind: spk ? null : 'sparkle', color: '#f8e050', size: 3 });
    }
    if (fol.heart && CC.time - fol.heart < 1.2) {
      var em = CC.img('ui/emote-heart'), ey = fy - 30 - (CC.time - fol.heart) * 6;
      if (em) g.drawImage(em, fx - 6, ey, 12, 12 * em.height / em.width);
    }
    var tx = Math.round(px / 16), ty = Math.round(py / 16);
    if (CC.tileAt(w.map, tx, ty) === ',') g.drawImage(w.map.picture, tx * 32, ty * 32 + 16, 32, 16, w.screenX(tx * 16), w.screenY(ty * 16 + 8), 16, 8);
  };
  var FOLLOW_LINES = [' looks up at you happily.', ' is sniffing the air.', ' hops around your feet.', ' seems to be enjoying the walk.', ' gives a happy little cry!', ' is keeping a lookout.'];
  CC.talkToFollower = async function () {
    var m = lead();
    fol.heart = CC.time; CC.sfx('select');
    var where = CC.world.map.legend, extra = { snow: ' is shivering a little.', desert: ' is panting in the heat.', cave: ' stays close to you in the dark.', ruins: ' keeps glancing up at the moon.' }[where];
    await CC.say(CC.mon.name(m) + (extra && Math.random() < 0.5 ? extra : CC.pick(FOLLOW_LINES)));
  };

  // ---------- footprints, dust and ripples ----------
  var PRINTS = { snow: 'rgba(90,115,160,0.6)', desert: 'rgba(130,88,40,0.5)' };
  var DUST = { snow: ['#ffffff', '#e4eefa'], desert: ['#e8d0a0', '#d8b880'], cave: ['#8a8098', '#6a6278'], swamp: ['#6a5a3a', '#8a7a4a'] };
  CC.fieldStep = function (w, from, running) {
    var lg = w.map.legend, f = w.fieldFx || (w.fieldFx = { prints: [], ripples: [] });
    if (PRINTS[lg]) {
      f.prints.push({ x: from.x, y: from.y, dir: from.dir, t: CC.time, c: PRINTS[lg], alt: f.prints.length % 2 });
      if (f.prints.length > 50) f.prints.shift();
    }
    if (running && !w.map.indoors) {
      var cols = DUST[lg] || ['#e0d4b8', '#c8b898'], puff = !lg || lg === 'desert' || lg === 'forest' || lg === 'water' ? CC.img('fx/field-5') : null;
      if (puff) CC.fx.add({ x: w.screenX(from.x * 16 + 8), y: w.screenY(from.y * 16 + 12), vx: 0, vy: -6, life: 0.4, img: puff, size: 4, grow: 0.6 });
      for (var i = 0; i < (puff ? 2 : 4); i++) CC.fx.add({ x: w.screenX(from.x * 16 + 8) + CC.rand(-4, 4), y: w.screenY(from.y * 16 + 14), vx: CC.rand(-12, 12), vy: -CC.rand(4, 14), life: 0.45, kind: 'dust', color: CC.pick(cols), size: CC.rand(2, 4) });
    }
    // stepping onto a dock or the boardwalk sends ripples out into the water beside it
    var t = CC.tileAt(w.map, CC.state.x, CC.state.y);
    if (t === 'd' || (t === ':' && lg === 'swamp')) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        if (CC.tileAt(w.map, CC.state.x + d[0], CC.state.y + d[1]) !== '~') return;
        f.ripples.push({ x: (CC.state.x + d[0]) * 16 + 8 - d[0] * 5, y: (CC.state.y + d[1]) * 16 + 9, t: CC.time });
        var splash = CC.img('fx/field-3');
        if (splash && Math.random() < 0.35) CC.fx.add({ x: w.screenX((CC.state.x + d[0]) * 16 + 8 - d[0] * 5), y: w.screenY((CC.state.y + d[1]) * 16 + 6), vx: 0, vy: -4, life: 0.35, img: splash, size: 4 });
      });
    }
  };
  // footprints go under everyone, so this is drawn right after the map picture
  CC.drawFieldMarks = function (w, cx, cy) {
    var f = w.fieldFx, g = CC.g;
    if (!f) return;
    var art = { snow: CC.img('fx/field-1'), desert: CC.img('fx/field-2') }[w.map.legend];
    f.prints = f.prints.filter(function (p) { return CC.time - p.t < 8; });
    f.prints.forEach(function (p) {
      var a = 1 - (CC.time - p.t) / 8, x = p.x * 16 + 8 - cx, y = p.y * 16 + 11 - cy, side = p.dir === 'left' || p.dir === 'right';
      g.globalAlpha = a;
      if (art) { // the prints point the way you walked
        g.save(); g.translate(x, y); g.rotate({ up: 0, down: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[p.dir] || 0);
        g.drawImage(art, -5, -4, 10, 10 * art.height / art.width); g.restore(); g.globalAlpha = 1; return;
      }
      g.fillStyle = p.c;
      if (side) { g.fillRect(x - 5, y - 2 + (p.alt ? 2 : 0), 4, 2); g.fillRect(x + 1, y + (p.alt ? -2 : 0), 4, 2); }
      else { g.fillRect(x - 3, y - 4 + (p.alt ? 4 : 0), 2, 4); g.fillRect(x + 1, y + (p.alt ? -4 : 0), 2, 4); }
      g.globalAlpha = 1;
    });
    f.ripples = f.ripples.filter(function (r) { return CC.time - r.t < 0.9; });
    var ring = CC.img('fx/field-4');
    f.ripples.forEach(function (r) {
      var k = (CC.time - r.t) / 0.9;
      if (ring) { g.globalAlpha = 1 - k; var rw = 6 + k * 12, rh = rw * ring.height / ring.width; g.drawImage(ring, r.x - cx - rw / 2, r.y - cy - rh / 2, rw, rh); g.globalAlpha = 1; return; }
      g.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - k)) + ')'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(r.x - cx, r.y - cy, 2 + k * 7, 1 + k * 3, 0, 0, Math.PI * 2); g.stroke();
    });
  };

  // ---------- day and night (by the clock, unless Options says always day) ----------
  // 0 = full day, 1 = full night; dusk and dawn fade between with a warm tint
  CC.daylight = function () {
    var forced = CC.dev.time;
    if (forced === 'day' || (!forced && CC.opts.daynight !== 'clock')) return { night: 0, warm: 0 };
    if (forced === 'night') return { night: 1, warm: 0 };
    if (forced === 'dusk') return { night: 0.45, warm: 1 };
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    if (h >= 7 && h < 17) return { night: 0, warm: 0 };
    if (h >= 17 && h < 19.5) { var k = (h - 17) / 2.5; return { night: k * 0.9, warm: Math.sin(k * Math.PI) }; }
    if (h >= 5 && h < 7) { var k2 = (7 - h) / 2; return { night: k2 * 0.9, warm: Math.sin(k2 * Math.PI) * 0.7 }; }
    return { night: 1, warm: 0 };
  };
  var OWN_LIGHT = { cave: 1, ruins: 1, spire: 1 }; // places with their own lighting
  CC.drawDaylight = function (w, cx, cy) {
    if (w.map.indoors || OWN_LIGHT[w.map.legend]) return;
    var dl = CC.daylight(), g = CC.g, W = CC.W, H = CC.H;
    if (!dl.night && !dl.warm) return;
    var bright = CC.state.flags && CC.state.flags.moonRestored, n = dl.night * (bright ? 0.75 : 1);
    g.save();
    g.globalCompositeOperation = 'multiply';
    if (dl.warm) { g.globalAlpha = dl.warm * 0.5; g.fillStyle = '#ff9a5a'; g.fillRect(0, 0, W, H); }
    if (n) { g.globalAlpha = n * 0.92; g.fillStyle = '#3c466e'; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'lighter';
    if (n) { g.globalAlpha = n; g.fillStyle = 'rgb(8,10,34)'; g.fillRect(0, 0, W, H); } // a blue night wash
    if (dl.warm) { g.globalAlpha = dl.warm * 0.12; g.fillStyle = '#7a3010'; g.fillRect(0, 0, W, H); }
    if (n > 0.2) {
      var glow = function (x, y, r, col, a) {
        var grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, col + a + ')'); grd.addColorStop(1, col + '0)');
        g.globalAlpha = 1; g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
      };
      var flick = 0.9 + Math.sin(CC.time * 9) * 0.05 + Math.sin(CC.time * 23) * 0.04;
      (w.map.decor || []).forEach(function (d) { // lanterns
        if (d.img !== 'props/village-props-18') return;
        glow(d.x * 16 + 8 - cx - 3, (d.y + 1) * 16 - d.h + 7 - cy, 34, 'rgba(255,200,120,', 0.38 * n * flick);
      });
      w.map.buildings.forEach(function (b) { // lit doorways and windows
        glow(b.door[0] * 16 + 8 - cx, b.door[1] * 16 + 8 - cy, 26, 'rgba(255,190,110,', 0.32 * n * flick);
        if (b.smokeAt) glow(b.smokeAt[0] - cx, b.smokeAt[1] + 18 - cy, 14, 'rgba(255,170,90,', 0.15 * n);
      });
      glow(w.screenX(w.px + 8), w.screenY(w.py + 8), 46, 'rgba(160,170,220,', 0.16 * n); // a little light around you
    }
    g.restore();
    if (n > 0.5 && !w.map.weather) w.fireflies(w.map.amb, '#e8f080', cx, cy, CC.dt || 0.016);
  };

  // ---------- the sign with the place's name ----------
  CC.drawPlaceSign = function (b) {
    var g = CC.g, art = CC.img(b.stone ? 'ui/region-sign-2' : 'ui/region-sign-1'), life = 2.4, age = life - b.t;
    var drop = age < 0.35 ? CC.ease(age / 0.35) : b.t < 0.35 ? CC.ease(b.t / 0.35) : 1;
    var w = Math.max(96, CC.textWidth(b.text) + 30), h = 24, x = Math.round(120 - w / 2), y = Math.round(-h - 4 + drop * (h + 10));
    var swing = Math.sin(age * 6) * Math.max(0, 1 - age) * 0.04;
    g.save(); g.translate(120, y - 6); g.rotate(swing); g.translate(-120, -(y - 6));
    if (art) CC.drawStretched(art, x, y, w, h, 14);
    else if (b.stone) {
      CC.rect(x, y, w, h, '#2a2834'); CC.rect(x + 1, y + 1, w - 2, h - 2, '#6a6878'); CC.rect(x + 2, y + 2, w - 4, 2, '#8a889a');
      CC.rect(x + 2, y + h - 4, w - 4, 2, '#4a4858');
      for (var i = 0; i < 3; i++) { CC.rect(x + 5, y + 6 + i * 5, 2, 2, '#6ab0ff'); CC.rect(x + w - 7, y + 6 + i * 5, 2, 2, '#6ab0ff'); }
      CC.rect(x + 2, y + h - 3, 5, 2, '#5a8a4a'); CC.rect(x + w - 8, y + 1, 6, 2, '#5a8a4a');
    } else {
      CC.rect(x + 8, y - 12, 1, 13, '#8a6a3a'); CC.rect(x + w - 9, y - 12, 1, 13, '#8a6a3a'); // ropes
      CC.rect(x, y, w, h, '#3a2412'); CC.rect(x + 1, y + 1, w - 2, h - 2, '#a8743a');
      CC.rect(x + 1, y + 8, w - 2, 1, '#8a5a2a'); CC.rect(x + 1, y + 16, w - 2, 1, '#8a5a2a'); CC.rect(x + 2, y + 2, w - 4, 1, '#c8945a');
      CC.rect(x + 4, y - 2, 6, 3, '#4f9a40'); CC.rect(x + 7, y - 3, 3, 2, '#6ab848'); CC.rect(x + w - 12, y - 2, 7, 3, '#4f9a40');
    }
    CC.text(b.text, 120, y + 6, b.stone ? '#e8ecff' : '#fff4dc', { align: 'center', shadow: b.stone ? '#2a2834' : '#5a3418' });
    g.restore();
  };

  // ---------- the cave's hiding spots: glowing mushrooms instead of the blue moss that looked like water ----------
  CC.FALLBACK['tiles/cave-mushroom-patch'] = function () {
    var a = CC.IMG['tiles/cave'];
    if (!a) return null;
    var c = CC.makeCanvas(32, 32), x = c.getContext('2d');
    x.drawImage(a, 0, 0, 32, 32, 0, 0, 32, 32); // plain floor
    var moss = CC.makeCanvas(32, 32); moss.getContext('2d').drawImage(a, 32, 0, 32, 32, 0, 0, 32, 32);
    x.globalAlpha = 0.85; x.drawImage(CC.hueShift(moss, -75, 0.75, -0.06), 0, 0); x.globalAlpha = 1;
    [[7, 10], [20, 6], [14, 20], [25, 22], [5, 25]].forEach(function (p, i) { // small pale mushrooms
      x.fillStyle = '#d8d0c0'; x.fillRect(p[0] + 1, p[1] + 2, 1, 3);
      x.fillStyle = i % 2 ? '#c8fff0' : '#e8fff8'; x.fillRect(p[0] - 1, p[1], 5, 2); x.fillRect(p[0], p[1] - 1, 3, 1);
      x.fillStyle = '#7ae8d0'; x.fillRect(p[0] - 1, p[1] + 1, 5, 1);
    });
    return c;
  };
})();
