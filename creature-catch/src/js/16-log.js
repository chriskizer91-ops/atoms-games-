// The Creature Log: every creature you've seen or caught, in an old field journal. The left page shows the one
// you're on (its picture, types and a field note); the right page is the list. A reads its full lore.
// ui/creature-log-book is the journal art when it's there; otherwise the book is drawn in code.
var CC = window.CC || (window.CC = {});

(function () {
  var PER_PAGE = 13, ROW = 8.5, LIST_Y = 11; // the list sits on the journal's ruled lines

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
    for (var y2 = 87; y2 < 132; y2 += ROW) g.fillRect(19, Math.round(y2), 92, 1);
    g.strokeStyle = '#a8865a'; g.lineWidth = 1; g.strokeRect(21.5, 10.5, 88, 66); g.strokeRect(23.5, 12.5, 84, 62);
    CC.rect(120, 0, 8, 152, '#b8302a'); CC.rect(122, 0, 2, 152, '#d8484a'); // ribbon
  }

  CC.creatureLog = function () {
    return new Promise(function (resolve) {
      var ids = CC.CREATURE_ORDER, s = CC.state, sel = 0, busy = false;
      var seen = function (id) { return s.seen[id] || s.caught[id]; };
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
          var g = CC.g, id = ids[sel], c = CC.CREATURES[id], known = seen(id), got = s.caught[id], ink = '#3a2418', faint = '#9a7a58';
          drawBook();
          // the left page: the creature in the picture frame, its name, types and field note
          CC.text('No. ' + String(sel + 1).padStart(3, '0'), 65, 14, faint, { size: 8, align: 'center' });
          if (known) {
            var sp = CC.creatureSprite(id, s.shinyCaught && s.shinyCaught[id]);
            g.fillStyle = 'rgba(120,90,50,0.15)'; g.beginPath(); g.ellipse(65, 70, 20, 3, 0, 0, Math.PI * 2); g.fill();
            CC.drawSprite(got ? sp : CC.tinted(sp, '#5a4630', 'logsil'), 65, 72, { scale: 0.62, sy: 1 + Math.sin(CC.time * 2.4) * 0.025, id: id });
            CC.text(c.name, 65, 79, ink, { align: 'center' });
            var bw = c.types.reduce(function (w, t) { return w + CC.textWidth(t.toUpperCase(), 8) + 17; }, 0), bx = 65 - bw / 2;
            c.types.forEach(function (t) { bx += CC.typeBadge(t, bx, 92) + 2; });
            var note = got ? (CC.LORE && CC.LORE[id] ? CC.LORE[id].note : '') : 'Seen in the wild. Catch one to fill in this page.';
            CC.wrap(note, 88, 8).slice(0, 4).forEach(function (l, i) { CC.text(l, 21, 104 + i * ROW, '#5a3a22', { size: 8 }); });
            if (got) CC.text('A: read more', 110, 132, faint, { size: 8, align: 'right' });
          } else {
            CC.text('?', 65, 30, '#c8b08a', { size: 22, align: 'center' });
            CC.text('Not seen yet', 65, 82, faint, { align: 'center' });
          }
          // the right page: the list, one creature to a ruled line
          var top = Math.floor(sel / PER_PAGE) * PER_PAGE;
          CC.text('Seen ' + Object.keys(s.seen).length + '   Caught ' + Object.keys(s.caught).length, 166, 124, faint, { size: 8, align: 'center' });
          for (var i = 0; i < PER_PAGE && top + i < ids.length; i++) {
            var lid = ids[top + i], y = Math.round(LIST_Y + i * ROW), on = top + i === sel;
            if (on) { g.fillStyle = 'rgba(232,184,56,0.35)'; g.fillRect(131, y - 1, 96, 9); }
            CC.text(String(top + i + 1).padStart(3, '0'), 141, y, faint, { size: 8 });
            CC.text(seen(lid) ? CC.CREATURES[lid].name : '- - - - -', 160, y, seen(lid) ? ink : '#c0a880', { size: 8 });
            if (s.caught[lid]) CC.drawCube(220, y + 6, 3.5);
            if (s.shinyCaught && s.shinyCaught[lid]) { g.save(); CC.drawParticle('sparkle', 212, y + 4, 3, '#e8b838'); g.restore(); }
            if (on) CC.cursor(133, y + 1);
          }
          CC.text('Page ' + (top / PER_PAGE + 1) + ' of ' + Math.ceil(ids.length / PER_PAGE), 166, 133, faint, { size: 8, align: 'center' });
        },
      };
      CC.push(scr);
    });
  };
})();
