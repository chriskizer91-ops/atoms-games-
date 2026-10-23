// Fly: halfway through the story (after Dusty's Cave trial) you get the Wooden Whistle, which calls Timberowl to carry
// you between places you have already been. Open it with R on the map, MENU > Fly, or the whistle in your Bag.
// The FLY code also sets flags.flyAll, which opens every place. Places sit on the world-map picture at x, y (240 x 160).
var CC = window.CC || (window.CC = {});

// map: the field map you land on (null = not built yet); land: where you land on it; from: the place a side area
// branches off (its dotted route goes there; the main road's places are joined in order)
CC.FLY_SPOTS = [
  { name: 'Home Village', map: 'village', x: 28, y: 126, land: [10, 6] },
  { name: 'Meadow Path', map: 'meadow', x: 44, y: 110, land: [7, 12] },
  { name: 'Grassland', map: 'grassland', x: 44, y: 94, land: [18, 12] },
  { name: 'Willowbrook Orchard', map: 'orchard', x: 70, y: 110, land: [4, 10], from: 'Grassland' },
  { name: 'Forest', map: 'forest', x: 40, y: 72, land: [16, 15] },
  { name: 'Whispering Grove', map: 'grove', x: 22, y: 64, land: [18, 9], from: 'Forest' },
  { name: 'Lakeshore', map: 'water', x: 86, y: 74, land: [19, 15] },
  { name: 'Driftwood Cove', map: 'cove', x: 98, y: 106, land: [12, 5], from: 'Lakeshore' },
  { name: 'Lantern Isle', map: 'isle', x: 112, y: 120, land: [10, 15], from: 'Driftwood Cove' },
  { name: 'Crystal Cave', map: 'cave', x: 116, y: 62, land: [20, 15] },
  { name: 'Copperbell Town', map: 'copperbell', x: 146, y: 50, land: [11, 15] },
  { name: 'Glimmer Mine', map: 'mine', x: 172, y: 46, land: [12, 26], from: 'Copperbell Town' },
  { name: 'Sunscorch Desert', map: 'desert', x: 164, y: 78, land: [14, 15] },
  { name: 'Dawn Temple', map: 'temple', x: 182, y: 92, land: [11, 23], from: 'Sunscorch Desert' },
  { name: 'Frostpeak Pass', map: 'snow', x: 128, y: 24, land: [11, 15] },
  { name: 'Steamvent Springs', map: 'springs', x: 152, y: 28, land: [11, 7], from: 'Frostpeak Pass' },
  { name: 'Murkmire Swamp', map: 'swamp', x: 192, y: 60, land: [20, 15] },
  { name: 'Firefly Bayou', map: 'bayou', x: 206, y: 78, land: [3, 11], from: 'Murkmire Swamp' },
  { name: 'Night Ruins', map: 'ruins', x: 204, y: 18, land: [13, 20] },
  { name: 'Ancients\' Archive', map: 'archive', x: 214, y: 32, land: [11, 21], from: 'Night Ruins' },
  { name: 'Hollow Deep', map: 'hollow', x: 168, y: 56, land: [11, 4], from: 'Glimmer Mine' },
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
        // dotted routes: the main road in order, and each side area back to where it branches off
        g.fillStyle = 'rgba(255,248,220,0.8)';
        var dots = function (a, b) { var n = Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 5); for (var j = 1; j < n; j++) g.fillRect(Math.round(CC.lerp(a.x, b.x, j / n)), Math.round(CC.lerp(a.y, b.y, j / n)), 1, 1); };
        var road = CC.FLY_SPOTS.filter(function (p) { return !p.from; });
        for (var i = 0; i < road.length - 1; i++) dots(road[i], road[i + 1]);
        CC.FLY_SPOTS.forEach(function (p) { if (p.from) { var q = CC.FLY_SPOTS.find(function (o) { return o.name === p.from; }); if (q) { g.fillStyle = 'rgba(255,248,220,0.5)'; dots(q, p); g.fillStyle = 'rgba(255,248,220,0.8)'; } } });
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
