// The VS splash before trainer, guide, rival and boss battles: the two halves of the background slide in, you and
// your opponent slide in from the sides, VS slams down, and their name plate slides in. bg/vs-<kind> and
// ui/name-plate are used when they exist; otherwise everything is drawn in code.
var CC = window.CC || (window.CC = {});

(function () {
  var VS_COLORS = { trainer: ['#1a3a8a', '#6ab0f0'], guide: ['#1e5a2a', '#e8b838'], rival: ['#b8281e', '#f8a020'], boss: ['#2a1250', '#101030'] };
  // the split runs from the bottom left (0, 154) to the top right (240, 0), as in the vs-* art: you stand in the
  // dark upper-left half, your opponent in the light lower-right half
  function upper(g) { g.beginPath(); g.moveTo(0, 0); g.lineTo(240, 0); g.lineTo(0, 154); g.closePath(); }
  function lower(g) { g.beginPath(); g.moveTo(240, 0); g.lineTo(240, 160); g.lineTo(0, 160); g.lineTo(0, 154); g.closePath(); }
  function outlined(text, x, y, color, size, edge) {
    [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [2, -2], [-2, 2]].forEach(function (o) { CC.text(text, x + o[0], y + o[1], edge || '#1e1626', { size: size, align: 'center' }); });
    CC.text(text, x, y, color, { size: size, align: 'center' });
  }

  CC.vsIntro = function (opts) {
    var kind = opts.vs || (opts.boss ? 'boss' : 'trainer'), cols = VS_COLORS[kind] || VS_COLORS.trainer, t0 = CC.time, hit = false;
    var tr = opts.trainer, foeArt = tr && tr.art && (CC.img('people/' + tr.art + '-battle') || CC.img('people/' + tr.art));
    var you = CC.img('people/' + (CC.state.look || 'player-a'));
    var name = tr ? tr.name : opts.wild ? CC.mon.name(opts.wild) : '';
    var lines = [];
    for (var i = 0; i < 14; i++) lines.push([Math.random() * 160, Math.random() * 300, 40 + Math.random() * 80, 160 + Math.random() * 220]);
    if (CC.music) CC.music.play(CC.battleTrack(opts));
    return new Promise(function (resolve) {
      var scr = {
        name: 'vs', opaque: true,
        update: function () {
          var t = CC.time - t0;
          if (t > 0.5 && !hit) { hit = true; CC.sfx('superhit'); }
          if (t > 2.3 || (t > 0.8 && CC.input.pressed.a)) { CC.pop(scr); resolve(); }
        },
        draw: function () {
          var g = CC.g, t = CC.time - t0, k = CC.ease(CC.clamp(t / 0.35, 0, 1)), k2 = CC.ease(CC.clamp((t - 0.15) / 0.35, 0, 1));
          var shake = t > 0.5 && t < 0.75 ? Math.round(CC.rand(-3, 3)) : 0, bg = CC.img('bg/vs-' + kind);
          CC.rect(0, 0, 240, 160, '#000');
          g.save(); g.translate(shake, 0);
          // the two halves slide in from opposite sides
          g.save(); g.translate((1 - k) * 240, 0); upper(g);
          if (bg) { g.clip(); g.drawImage(bg, 0, 0, 240, 160); } else { g.fillStyle = cols[0]; g.fill(); }
          g.restore();
          g.save(); g.translate(-(1 - k) * 240, 0); lower(g);
          if (bg) { g.clip(); g.drawImage(bg, 0, 0, 240, 160); } else { g.fillStyle = cols[1]; g.fill(); }
          g.restore();
          if (!bg) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.globalAlpha = k; g.beginPath(); g.moveTo(0, 154); g.lineTo(240, 0); g.stroke(); g.globalAlpha = 1; }
          // speed lines
          lines.forEach(function (l, i) {
            var x = ((l[1] - t * l[3]) % 320 + 320) % 320 - 60;
            g.globalAlpha = 0.35; CC.rect(x, l[0], l[2], 1, i % 3 ? '#ffffff' : cols[1]); g.globalAlpha = 1;
          });
          // your opponent: their battle art, or the boss creature, dark until a flash reveals it
          var shadow = function (x, y, r) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, y, r, r / 4, 0, 0, Math.PI * 2); g.fill(); };
          if (foeArt) {
            var fh = 76, fk = fh / foeArt.height, fx = 184 + (1 - k2) * 150;
            shadow(fx, 147, 20);
            g.drawImage(foeArt, fx - foeArt.width * fk / 2, 148 - fh, foeArt.width * fk, fh);
          } else if (opts.wild) {
            var sp = CC.creatureSprite(opts.wild.id), lit = t > 0.95, bx = 182 + (1 - k2) * 150;
            shadow(bx, 146, 26);
            CC.drawSprite(lit ? sp : CC.tinted(sp, '#0a0618', 'vs'), bx, 148, { scale: 1.15, sy: 1 + Math.sin(CC.time * 2) * 0.02 });
          }
          if (you) { var yh = 76, yk = yh / you.height, yx = 52 - (1 - k2) * 150; shadow(yx, 103, 18); g.drawImage(you, yx - you.width * yk / 2, 104 - yh, you.width * yk, yh); }
          // VS slams down
          if (t > 0.45) {
            var vk = CC.clamp((t - 0.45) / 0.15, 0, 1), size = Math.round(36 - vk * 14);
            outlined('VS', 122, 72 - size / 2, kind === 'boss' ? '#d8b8ff' : '#fff4a0', size);
          }
          // the name plate, top right over the opponent's side (it slides in from the right), so it never reads as your name
          if (t > 0.6 && name) {
            var pk = CC.ease(CC.clamp((t - 0.6) / 0.25, 0, 1)), plate = CC.img('ui/name-plate');
            var pw = Math.max(96, CC.textWidth(name, 10) + 40), px = 228 - pw + (1 - pk) * 150, py = 8;
            if (plate) CC.drawStretched(plate, px, py, pw, 20, 16);
            else {
              CC.rect(px, py, pw, 18, '#e8b838'); CC.rect(px + 1, py + 1, pw - 2, 16, '#1a1a3a'); CC.rect(px + 2, py + 2, pw - 4, 1, '#3a3a6a');
              CC.rect(px - 3, py + 6, 4, 6, '#e8b838'); CC.rect(px + pw - 1, py + 6, 4, 6, '#e8b838');
            }
            CC.text(name, px + pw / 2, py + 5, '#ffffff', { size: 10, align: 'center' });
          }
          g.restore();
          if (opts.wild && t > 0.9 && t < 1.1) { g.globalAlpha = 1 - (t - 0.9) / 0.2; CC.rect(0, 0, 240, 160, '#ffffff'); g.globalAlpha = 1; }
          if (t > 2.1) { g.globalAlpha = CC.clamp((t - 2.1) / 0.2, 0, 1); CC.rect(0, 0, 240, 160, '#ffffff'); g.globalAlpha = 1; }
        },
      };
      CC.push(scr);
    });
  };
})();
