// The Creature Log: every creature you've seen or caught, in an old field journal. The left page shows the one
// you're on (its picture, types and a field note); the right page is the list. A reads its full lore.
// Before you meet a creature, its shadow is in the book if it's a first form (the guardians stay a secret), or if
// you've met a creature it grows from: the shadow says where to look, or what it grows from.
// ui/creature-log-book is the journal art when it's there; otherwise the book is drawn in code.
var CC = window.CC || (window.CC = {});

(function () {
  var PER_PAGE = 13, ROW = 8.5, LIST_Y = 11; // the list sits on the journal's ruled lines
  var NOTE_Y = 103, NOTE_ROW = 8; // the field note's 4 lines sit on the left page's ruled lines, 'A: read more' under them

  // the journal: the picture art, or the same layout drawn in code (left page 12-117 with a picture frame at
  // 21-109 x 10-76, the ribbon at 118-130, the right page 130-228 ruled every 8.5 px)
  function drawBook() {
    var g = CC.g, art = CC.img('ui/creature-log-book');
    if (art) { g.drawImage(art, 0, 0, 240, 160); return; }
    CC.rect(0, 0, 240, 160, '#2a1a12');
    CC.rect(3, 2, 234, 156, '#6a3a22'); CC.rect(5, 4, 230, 152, '#7a4a2a');
    [[5, 4], [229, 4], [5, 150], [229, 150]].forEach(function (c) { CC.rect(c[0], c[1], 6, 6, '#c8a048'); }); // brass corners
    CC.rect(12, 4, 106, 144, '#f2e2c4'); CC.rect(130, 4, 98, 144, '#f2e2c4');
    CC.rect(117, 4, 13, 144, '#e0ccaa');
    g.fillStyle = 'rgba(160,130,90,0.28)';
    for (var y = 19.5; y < 140; y += ROW) g.fillRect(134, Math.round(y), 90, 1);
    for (var y2 = NOTE_Y + NOTE_ROW; y2 < 140; y2 += NOTE_ROW) g.fillRect(19, y2, 92, 1);
    g.strokeStyle = '#a8865a'; g.lineWidth = 1; g.strokeRect(21.5, 10.5, 88, 66); g.strokeRect(23.5, 12.5, 84, 62);
    CC.rect(120, 0, 8, 152, '#b8302a'); CC.rect(122, 0, 2, 152, '#d8484a'); // ribbon
  }

  // the field note on the left page (at most 4 lines). The journal art has a leaf sprig in the page's corner, under
  // the start of the lines (12-48 x 104-142): there the letters get a rim of paper, so the leaf never hides them.
  function noteLines(note) {
    var g = CC.g;
    CC.wrap(note, 88, 8).slice(0, 4).forEach(function (l, i) {
      var y = NOTE_Y + i * NOTE_ROW;
      g.save(); g.beginPath(); g.rect(12, 104, 36, 38); g.clip();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { CC.text(l, 21 + d[0], y + d[1], '#efdcb8', { size: 8, shadow: false }); });
      g.restore();
      CC.textNum(l, 21, y, '#5a3a22', { size: 8 }); // pixel digits, so 'at Lv 22' doesn't read 'at Lv 88'
    });
  }

  // what a shadow's page says: where a first form lives, or what an evolution grows from
  function shadowNote(id) {
    var C = CC.CREATURES, c = C[id], F = CC.state.flags;
    if (c.from) {
      var e = C[c.from].evo, how = typeof e.at === 'number' ? 'at Lv ' + e.at : 'when it touches a ' + ((CC.ITEMS[e.at] || {}).name || 'shard');
      if (CC.state.seen[c.from] || CC.state.caught[c.from]) return C[c.from].name + ' grows into this one ' + how + '.';
      var root = c.from; while (C[root].from) root = C[root].from;
      return 'It grows from the ' + C[root].name + ' family.';
    }
    var z = (CC.ZONES || []).filter(function (z) { return z.key === (CC.ZONE_OF || {})[id]; })[0];
    if (!z) return 'Its shadow is in the book. Where could it be?';
    if (z.key === 'village') return 'One of Elder Willow\'s partner creatures.';
    if (z.after && !F.moonRestored) return 'It lives far away. Keep going on your journey!';
    var the = { meadow: 1, grassland: 1, forest: 1, water: 1, cave: 1, desert: 1, ruins: 1, archive: 1, spire: 1, temple: 1, hollow: 1 }[z.key];
    return 'Look for it around ' + (the ? 'the ' : '') + z.name + '.';
  }

  CC.creatureLog = function () {
    return new Promise(function (resolve) {
      var ids = CC.CREATURE_ORDER, s = CC.state, sel = 0, busy = false, C = CC.CREATURES;
      var seen = function (id) { return s.seen[id] || s.caught[id]; };
      var shadow = function (id) {
        if (seen(id) || C[id].kind === 'legend') return false;
        for (var f = C[id].from; f; f = C[f].from) if (seen(f)) return true;
        return !C[id].from;
      };
      var seenCount = ids.filter(seen).length, caughtCount = ids.filter(function (id) { return s.caught[id]; }).length;
      var scr = {
        name: 'log', opaque: true,
        update: function () {
          if (busy) return;
          var n = ids.length;
          if (CC.repeat('down')) { sel = (sel + 1) % n; CC.sfx('blip'); }
          if (CC.repeat('up')) { sel = (sel + n - 1) % n; CC.sfx('blip'); }
          if (CC.repeat('right')) { sel = Math.min(n - 1, sel + PER_PAGE); CC.sfx('blip'); }
          if (CC.repeat('left')) { sel = Math.max(0, sel - PER_PAGE); CC.sfx('blip'); }
          if (CC.input.pressed.b || CC.input.pressed.start) { CC.sfx('back'); CC.pop(scr); resolve(); return; }
          if (CC.input.pressed.a) {
            var id = ids[sel], lore = CC.LORE && CC.LORE[id];
            if (!s.caught[id] || !lore) { CC.sfx('bump'); return; }
            busy = true; CC.sfx('select');
            CC.say(lore.lore).then(function () { busy = false; });
          }
        },
        draw: function () {
          var g = CC.g, id = ids[sel], c = C[id], known = seen(id), got = s.caught[id], ink = '#3a2418', faint = '#9a7a58';
          drawBook();
          // the left page: the creature in the picture frame, its name, types and field note
          if (known) {
            var sp = CC.creatureSprite(id, s.shinyCaught && s.shinyCaught[id]);
            g.fillStyle = 'rgba(120,90,50,0.15)'; g.beginPath(); g.ellipse(65, 70, 20, 3, 0, 0, Math.PI * 2); g.fill();
            CC.drawSprite(sp, 65, 72, { scale: 0.62, sy: 1 + Math.sin(CC.time * 2.4) * 0.025, id: id });
            CC.text(c.name, 65, 79, ink, { align: 'center' });
            var bw = c.types.reduce(function (w, t) { return w + CC.typeBadgeWidth(t) + 2; }, -2), bx = 65 - bw / 2;
            c.types.forEach(function (t) { bx += CC.typeBadge(t, bx, 92) + 2; });
            // seen but not caught: the starters can't be found wild (one of them is Juniper's)
            var note = got ? (CC.LORE && CC.LORE[id] ? CC.LORE[id].note : '') : /^starter/.test(c.kind) ? 'One of Elder Willow\'s partner creatures. You won\'t find it in the wild.' : 'Seen on your journey. Catch one to fill in this page.';
            noteLines(note);
            if (got) CC.text('A: read more', 110, NOTE_Y + 4 * NOTE_ROW + 1, faint, { size: 8, align: 'right' }); // under the note's 4th line
          } else if (shadow(id)) {
            g.fillStyle = 'rgba(120,90,50,0.15)'; g.beginPath(); g.ellipse(65, 70, 20, 3, 0, 0, Math.PI * 2); g.fill();
            CC.drawSprite(CC.tinted(CC.creatureSprite(id), '#3a2a1e', 'logshadow-' + id), 65, 72, { scale: 0.62, alpha: 0.85, sy: 1 + Math.sin(CC.time * 2.4) * 0.025 });
            CC.text('? ? ?', 65, 79, '#6a5038', { align: 'center' });
            noteLines(shadowNote(id));
          } else {
            CC.text('?', 65, 30, '#c8b08a', { size: 22, align: 'center' });
            CC.text('Not seen yet', 65, 82, faint, { align: 'center' });
          }
          CC.textNum('No. ' + String(sel + 1).padStart(3, '0'), 65, 14, faint, { size: 8, align: 'center' }); // after the picture, so a tall one doesn't hide it
          // the right page: the list, one creature to a ruled line
          var top = Math.floor(sel / PER_PAGE) * PER_PAGE;
          if (CC.img('ui/creature-log-book')) CC.rect(199, 117, 28, 29, '#efdcb8'); // plain paper over the art's paw-print doodle, for the counts
          CC.textNum('Seen ' + seenCount + '  Caught ' + caughtCount, 176, 124, faint, { size: 8, align: 'center' }); // the right page is 130 to 228
          for (var i = 0; i < PER_PAGE && top + i < ids.length; i++) {
            var lid = ids[top + i], y = Math.round(LIST_Y + i * ROW), on = top + i === sel;
            if (on) { g.fillStyle = 'rgba(232,184,56,0.35)'; g.fillRect(131, y - 1, 96, 9); }
            CC.num(String(top + i + 1).padStart(3, '0'), 140, y + 1, faint);
            // the name ends before the caught cube (or the page's edge): the few that are longer are drawn a little narrower
            var nm = seen(lid) ? C[lid].name : shadow(lid) ? '? ? ?' : '- - - - -', nw = CC.textWidth(nm, 8), room = (s.caught[lid] ? 216 : 226) - 162;
            g.save(); g.translate(162, y); if (nw > room) g.scale(room / nw, 1);
            CC.text(nm, 0, 0, seen(lid) ? ink : shadow(lid) ? '#8a6a48' : '#c0a880', { size: 8 });
            g.restore();
            if (s.caught[lid]) CC.drawCube(220, y + 6, 3.5);
            if (s.shinyCaught && s.shinyCaught[lid]) { g.save(); CC.drawParticle('sparkle', 223, y + 2, 3, '#e8b838'); g.restore(); } // a glint on the cube
            if (on) CC.cursor(133, y + 1);
          }
          CC.textNum('Page ' + (top / PER_PAGE + 1) + ' of ' + Math.ceil(ids.length / PER_PAGE), 162, 134, faint, { size: 8, align: 'center' });
          var pg = CC.img('items/lost-page'); // the Lost Pages of The Long Dusk found so far
          if (s.flags.anyPage && pg) { // on the patch of plain paper, below the Seen and Caught line
            g.drawImage(pg, 204, 134, 9, 9 * pg.height / pg.width); CC.num(String(CC.pageCount()), 215, 136, ink);
          }
        },
      };
      CC.push(scr);
    });
  };
})();
