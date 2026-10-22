// The Creature Log: every creature you've seen or caught, in an old field journal. The left page shows the one
// you're on (its picture, types and a field note); the right page is the list. A reads its full lore.
// ui/creature-log-book is the journal art when it's there; otherwise the book is drawn in code.
var CC = window.CC || (window.CC = {});

(function () {
  var PER_PAGE = 10;

  function drawBook() {
    var g = CC.g, art = CC.img('ui/creature-log-book');
    if (art) { g.drawImage(art, 0, 0, 240, 160); return; }
    CC.rect(0, 0, 240, 160, '#2a1a12');
    CC.rect(3, 3, 234, 154, '#6a3a22'); CC.rect(5, 5, 230, 150, '#7a4a2a');
    [[5, 5], [229, 5], [5, 149], [229, 149]].forEach(function (c) { CC.rect(c[0], c[1], 6, 6, '#c8a048'); }); // brass corners
    // two pages and the fold between them
    CC.rect(9, 9, 108, 142, '#f6ecd4'); CC.rect(123, 9, 108, 142, '#f6ecd4');
    CC.rect(117, 9, 6, 142, '#e0d0b0'); CC.rect(119, 9, 2, 142, '#c8b48c');
    g.fillStyle = 'rgba(160,130,90,0.18)';
    for (var y = 22; y < 148; y += 11) { g.fillRect(126, y, 102, 1); }
    g.fillStyle = 'rgba(90,60,30,0.12)'; g.fillRect(109, 9, 8, 142); g.fillRect(123, 9, 6, 142);
    CC.rect(100, 2, 5, 16, '#b8302a'); CC.rect(100, 18, 2, 3, '#b8302a'); CC.rect(103, 18, 2, 3, '#b8302a'); // ribbon
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
          var g = CC.g, id = ids[sel], c = CC.CREATURES[id], known = seen(id), got = s.caught[id];
          drawBook();
          // the left page: the creature
          CC.text('No. ' + String(sel + 1).padStart(3, '0'), 63, 13, '#8a6a4a', { size: 9, align: 'center' });
          CC.rect(20, 25, 86, 64, '#e8dcbc'); CC.rect(21, 26, 84, 62, '#fbf4e2');
          g.strokeStyle = '#b89a6a'; g.lineWidth = 1; g.strokeRect(20.5, 25.5, 85, 63);
          if (known) {
            var sp = CC.creatureSprite(id, s.shinyCaught && s.shinyCaught[id]);
            g.fillStyle = 'rgba(120,90,50,0.15)'; g.beginPath(); g.ellipse(63, 84, 20, 3, 0, 0, Math.PI * 2); g.fill();
            CC.drawSprite(got ? sp : CC.tinted(sp, '#4a3a2a', 'logsil'), 63, 85, { scale: 0.78, sy: 1 + Math.sin(CC.time * 2.4) * 0.025, id: id });
            CC.text(c.name, 63, 92, '#3a2418', { align: 'center' });
            var bw = c.types.reduce(function (w, t) { return w + CC.textWidth(t.toUpperCase(), 8) + 17; }, 0), bx = 63 - bw / 2;
            c.types.forEach(function (t) { bx += CC.typeBadge(t, bx, 105) + 2; });
            var note = got ? (CC.LORE && CC.LORE[id] ? CC.LORE[id].note : '') : 'Seen in the wild. Catch one to fill in this page.';
            CC.wrap(note, 92, 8).slice(0, 3).forEach(function (l, i) { CC.text(l, 17, 118 + i * 9, '#6a4a30', { size: 8 }); });
            if (got) CC.text('A: read more', 108, 140, '#a08060', { size: 8, align: 'right' });
          } else {
            CC.text('?', 63, 44, '#c8b48c', { size: 22, align: 'center' });
            CC.text('Not seen yet', 63, 96, '#a08060', { align: 'center' });
          }
          // the right page: the list
          var top = Math.floor(sel / PER_PAGE) * PER_PAGE;
          CC.text('Seen ' + Object.keys(s.seen).length + '   Caught ' + Object.keys(s.caught).length, 176, 12, '#8a6a4a', { size: 8, align: 'center' });
          for (var i = 0; i < PER_PAGE && top + i < ids.length; i++) {
            var lid = ids[top + i], y = 24 + i * 12, on = top + i === sel;
            if (on) { g.fillStyle = 'rgba(232,184,56,0.35)'; g.fillRect(125, y - 2, 104, 12); }
            CC.text(String(top + i + 1).padStart(3, '0'), 136, y, '#a08060', { size: 8 });
            CC.text(seen(lid) ? CC.CREATURES[lid].name : '- - - - -', 156, y, seen(lid) ? '#3a2418' : '#c0ac88', { size: 9 });
            if (s.caught[lid]) CC.drawCube(222, y + 6, 4);
            if (s.shinyCaught && s.shinyCaught[lid]) { g.save(); CC.drawParticle('sparkle', 214, y + 4, 3, '#e8b838'); g.restore(); }
            if (on) CC.cursor(127, y + 2);
          }
          CC.text('Page ' + (top / PER_PAGE + 1) + ' of ' + Math.ceil(ids.length / PER_PAGE), 176, 141, '#a08060', { size: 8, align: 'center' });
        },
      };
      CC.push(scr);
    });
  };
})();
