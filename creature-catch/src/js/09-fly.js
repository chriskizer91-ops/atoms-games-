// Fly: halfway through the story (after Dusty's Cave trial) you get the Wooden Whistle, which calls Timberowl to carry
// you between places you have already been. Open it with R on the map, MENU > Fly, or the whistle in your Bag.
// The FLY code also sets flags.flyAll, which opens every place. Places sit on the world-map picture at x, y (240 x 160).
var CC = window.CC || (window.CC = {});

// map: the field map you land on (null = not built yet); land: where you land on it
CC.FLY_SPOTS = [
  { name: 'Home Village', map: 'village', x: 30, y: 128, land: [10, 6] },
  { name: 'Meadow Path', map: 'meadow', x: 44, y: 112, land: [7, 12] },
  { name: 'Grassland', map: 'grassland', x: 56, y: 96, land: [18, 12] },
  { name: 'Forest', map: null, x: 44, y: 66 },
  { name: 'Water', map: null, x: 84, y: 68 },
  { name: 'Cave', map: null, x: 116, y: 60 },
  { name: 'Desert', map: null, x: 156, y: 62 },
  { name: 'Snow', map: null, x: 130, y: 22 },
  { name: 'Swamp', map: null, x: 186, y: 56 },
  { name: 'Night Ruins', map: null, x: 214, y: 20 },
];

CC.flyScreen = function () {
  return new Promise(function (resolve) {
    var s = CC.state, visited = s.visited || {};
    var here = CC.FLY_SPOTS.findIndex(function (p) { return p.map === s.map; });
    if (here < 0) here = 0;
    var sel = here, phase = 'pick', t = 0, from = CC.FLY_SPOTS[here], to = null, note = null;
    var canGo = function (p) { return s.flags.flyAll || (p.map && visited[p.map]); };
    var scr = {
      name: 'fly', opaque: true,
      update: function (dt) {
        t += dt;
        if (phase !== 'pick') return;
        var step = CC.repeat('right') || CC.repeat('down') ? 1 : CC.repeat('left') || CC.repeat('up') ? -1 : 0;
        if (step) { sel = (sel + step + CC.FLY_SPOTS.length) % CC.FLY_SPOTS.length; CC.sfx('blip'); note = null; }
        if (CC.input.pressed.b) { CC.sfx('back'); CC.pop(scr); resolve(); }
        if (CC.input.pressed.a) {
          var p = CC.FLY_SPOTS[sel];
          if (!canGo(p)) { CC.sfx('bump'); note = 'You can only fly to places you have been.'; return; }
          if (sel === here) { CC.sfx('bump'); return; }
          if (!p.map) { CC.sfx('bump'); note = p.name + ' isn\'t built yet. It comes in a later version.'; return; }
          CC.sfx('throw'); to = p; phase = 'fly'; t = 0;
        }
      },
      draw: function () {
        var g = CC.g, map = CC.img('bg/world-map');
        if (map) g.drawImage(map, 0, 0, 240, 160); else CC.rect(0, 0, 240, 160, '#3a6ab8');
        // dotted route between the places, in order
        g.fillStyle = 'rgba(255,248,220,0.8)';
        for (var i = 0; i < CC.FLY_SPOTS.length - 1; i++) {
          var a = CC.FLY_SPOTS[i], b = CC.FLY_SPOTS[i + 1], n = Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 5);
          for (var j = 1; j < n; j++) g.fillRect(Math.round(CC.lerp(a.x, b.x, j / n)), Math.round(CC.lerp(a.y, b.y, j / n)), 1, 1);
        }
        CC.FLY_SPOTS.forEach(function (p, i) {
          var ok = canGo(p), on = i === sel, r = on ? 4 + Math.sin(CC.time * 6) : 3;
          g.fillStyle = '#2a1a22'; g.beginPath(); g.arc(p.x, p.y, r + 1, 0, Math.PI * 2); g.fill();
          g.fillStyle = ok ? (i === here ? '#f8d040' : '#f05a7a') : '#8a8a96'; g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(p.x - 1, p.y - r + 1, 2, 1);
        });
        if (phase === 'pick') {
          var p = CC.FLY_SPOTS[sel], ok = canGo(p);
          var label = p.name + (sel === here ? ' (you are here)' : ok ? '' : ' (not visited yet)');
          var w = CC.textWidth(label) + 16;
          CC.box(Math.round(CC.clamp(p.x - w / 2, 2, 238 - w)), p.y > 40 ? p.y - 30 : p.y + 10, w, 18);
          CC.text(label, Math.round(CC.clamp(p.x - w / 2, 2, 238 - w)) + 8, (p.y > 40 ? p.y - 30 : p.y + 10) + 3, ok ? '#2a2230' : '#8a7a70');
          CC.box(0, 136, 240, 24);
          CC.text(note || 'Fly where? Arrows to pick, A to fly, B to stay.', 8, 141, note ? '#a83a3a' : '#2a2230', { size: 9 });
        } else {
          // Timberowl carries you along an arc to the new place
          var k = CC.clamp(t / 1.4, 0, 1), e = CC.ease(k);
          var x = CC.lerp(from.x, to.x, e), y = CC.lerp(from.y, to.y, e) - Math.sin(k * Math.PI) * 26;
          var owl = CC.creatureSprite('timberowl');
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(CC.lerp(from.x, to.x, e), CC.lerp(from.y, to.y, e) + 2, 6, 2, 0, 0, Math.PI * 2); g.fill();
          CC.drawSprite(owl, x, y + 8, { scale: 0.35, sy: 1 + Math.sin(CC.time * 18) * 0.12, flip: to.x > from.x, id: 'timberowl' });
          if (Math.random() < 0.5) CC.fx.add({ x: x + CC.rand(-6, 6), y: y, vx: (from.x - to.x) * 0.6, vy: CC.rand(-5, 5), life: 0.5, kind: 'blade', color: 'rgba(255,255,255,0.8)', size: 3 });
          if (k >= 1 && phase === 'fly') {
            phase = 'land';
            (async function () {
              await CC.fade(0.3, true);
              CC.pop(scr); CC.fx.clear();
              CC.world.enter(to.map, to.land[0], to.land[1], 'down');
              CC.world.arrive = CC.time;
              await CC.fade(0.3, false);
              await CC.sleep(0.8);
              resolve();
            })();
          }
        }
      },
    };
    CC.push(scr);
  });
};
