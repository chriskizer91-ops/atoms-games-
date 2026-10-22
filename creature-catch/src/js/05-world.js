// The overworld: maps, code-drawn tiles, walking, tall-grass encounters, doors, people, the field menu.
var CC = window.CC || (window.CC = {});

// Tiles: . grass  , tall grass  : path  T tree  ~ water  * flowers  o rock  S sign  = fallen log (a gate)
CC.MAPS = {
  village: {
    name: 'Home Village', tileset: 'village', pines: 0.15,
    // h: how tall it stands (virtual px). Props are solid unless solid: false.
    decor: [
      { x: 9, y: 6, img: 'props/village-props-18', h: 22 }, { x: 12, y: 6, img: 'props/village-props-18', h: 22 },
      { x: 19, y: 4, img: 'props/village-props-13', h: 12 }, { x: 14, y: 3, img: 'props/village-props-14', h: 12 },
      { x: 6, y: 11, img: 'props/village-props-12', h: 13 }, { x: 7, y: 9, img: 'props/village-props-19', h: 11 },
      { x: 12, y: 13, img: 'props/village-props-16', h: 10 }, { x: 19, y: 11, img: 'props/village-props-15', h: 11 },
      { x: 8, y: 3, img: 'props/village-props-20', h: 12 }, { x: 1, y: 8, img: 'props/rocks-and-bushes-7', h: 13 },
      { x: 20, y: 9, img: 'props/rocks-and-bushes-6', h: 13 },
      { x: 9, y: 14, img: 'props/water-props-5', h: 9, dy: -3, solid: false }, { x: 13, y: 14, img: 'props/water-props-5', h: 8, dy: -4, solid: false },
    ],
    rows: [
      'TTTTTTTTTT::TTTTTTTTTT',
      'TT*.......::.......*TT',
      'T.........::.........T',
      'T.........::.........T',
      'T.........::.........T',
      'T...::::::::::::::...T',
      'T*........::........*T',
      'T.....S...::...o.....T',
      'T.........::.........T',
      'T.........::.........T',
      'T.........::.........T',
      'T.........::.........T',
      'T...::::::::::::::...T',
      'T*.....*......*.....*T',
      'TT.....~~~~~~~~.....TT',
      'TTTTTTTTTTTTTTTTTTTTTT',
    ],
    buildings: [
      { id: 'willow', x: 2, y: 2, w: 5, h: 3, door: [4, 4], roof: '#4f8a3a', wall: '#c8a070' },
      { id: 'shop', x: 15, y: 2, w: 4, h: 3, door: [17, 4], roof: '#7a5ac8', wall: '#e8d8c0', stripe: '#3a6ae8' },
      { id: 'home', x: 2, y: 9, w: 4, h: 3, door: [4, 11], roof: '#c84a3a', wall: '#e8d8c0' },
      { id: 'hut', x: 15, y: 9, w: 4, h: 3, door: [17, 11], roof: '#8ad8b0', wall: '#f8f4ea', heart: true },
    ],
    exits: [{ side: 'top', x0: 10, x1: 11, to: 'meadow', tx0: 7, ty: 17 }],
  },
  meadow: {
    name: 'Meadow Path', spawns: 'meadow', pines: 0.25, signArt: 'props/signpost-grassland',
    decor: [
      { x: 13, y: 4, img: 'props/rocks-and-bushes-5', h: 13 }, { x: 2, y: 9, img: 'props/rocks-and-bushes-7', h: 13 },
      { x: 13, y: 8, img: 'props/rocks-and-bushes-2', h: 11 },
    ],
    rows: [
      'TTTTTT::::TTTTTT',
      'TT,,,,::::,,,,TT',
      'T,,,,,::::,,,,,T',
      'T,,,..::::..,,,T',
      'T...o.::::.....T',
      'T.,,,,::::,,,..T',
      'T.,,,,,,,,,,,..T',
      'T.,,,,,,,,,,,..T',
      'T......::......T',
      'TT..*..::..*..TT',
      'T,,,,..::..,,,,T',
      'T,,,,..::..,,,,T',
      'T,,,,..::..,,,,T',
      'T......::...S..T',
      'T..TT..::..TT..T',
      'T,,,,,,::,,,,,,T',
      'T,,,,,,::,,,,,,T',
      'T......::......T',
      'TTTTTTT::TTTTTTT',
    ],
    buildings: [],
    exits: [
      { side: 'bottom', x0: 7, x1: 8, to: 'village', tx0: 10, ty: 1 },
      { side: 'top', x0: 6, x1: 9, to: 'grassland', tx0: 10, ty: 20 },
    ],
  },
  grassland: {
    name: 'Grassland', spawns: 'grassland', pines: 0.3, signArt: 'props/signpost-grassland',
    decor: [
      { x: 21, y: 10, img: 'props/village-props-19', h: 11 }, { x: 20, y: 12, img: 'props/village-props-18', h: 22 },
      { x: 7, y: 4, img: 'props/rocks-and-bushes-5', h: 13 }, { x: 17, y: 5, img: 'props/rocks-and-bushes-6', h: 13 },
      { x: 5, y: 10, img: 'props/rocks-and-bushes-7', h: 13 },
    ],
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'TT,,,,....::::....,,,,TT',
      'T,,,,,....::::....,,,,,T',
      'T,,,,,,...::::...,,,,,,T',
      'T.........::::.........T',
      'T..o......::::.....*...T',
      'T,,,,.....::::.....,,,,T',
      'T,,,,,,...::::...,,,,,,T',
      'T,,,,,,...::::...,,,,,,T',
      'T.........::::.........T',
      'T...*.....::::.........T',
      'T.........::::.........T',
      'T,,,,,....::::::::::...T',
      'T,,,,,,...::::.........T',
      'T,,,,,,...::::....S....T',
      'T.........::::.........T',
      'TT..*..o..::::..*...,,TT',
      'T,,,,,,,..::::..,,,,,,,T',
      'T,,,,,,,..::::..,,,,,,,T',
      'T,,,,,,,..::::..,,,,,,,T',
      'T.........::::.........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
    buildings: [
      { id: 'outpost', x: 16, y: 9, w: 4, h: 3, door: [18, 11], roof: '#8ad8b0', wall: '#c8a070', heart: true, small: true },
    ],
    exits: [
      { side: 'bottom', x0: 10, x1: 13, to: 'meadow', tx0: 6, ty: 1 },
      { side: 'top', x0: 10, x1: 13, to: 'forest' },
    ],
  },
};

// Rooms. Tiles: # dark (walls beyond) W plaster wall w wall with a window . wood floor c checker floor m doormat (walk out)
// Furniture is decor; counter: true lets you talk to whoever stands behind it; talk: runs when you face it and press A.
function room(name, rows, door, decor, extra) {
  var r = { name: name, indoors: true, tileset: 'interior', rows: rows, buildings: [], decor: decor || [] };
  var my = rows.length - 1, mx = rows[my].indexOf('m');
  r.exits = [{ side: 'bottom', x0: mx, x1: rows[my].lastIndexOf('m'), to: door[0], tx0: door[1], ty: door[2], fixedX: true }];
  r.inside = [mx, my - 1];
  for (var k in extra || {}) r[k] = extra[k];
  return r;
}
CC.MAPS['willow-in'] = room('Elder Willow\'s House', [
  '#PPPPPPPPPP#', '#WWwWWWWwWW#', '#..........#', '#..........#', '#..........#', '#..........#', '#..........#', '#####mm#####',
], ['village', 4, 5], [
  { x: 2, y: 2, img: 'furniture/furn-3', h: 24, talk: 'Old books on creatures. One is titled "The Long Dusk".' },
  { x: 8, y: 2, img: 'furniture/furn-6', h: 22, glow: true }, { x: 10, y: 2, img: 'furniture/furn-7', h: 22, talk: 'Tick, tock. The clock is a little fast.' },
  { x: 1, y: 6, img: 'furniture/furn-5', h: 15 },
  { x: 5, y: 4, img: 'props/starter-table', h: 20, dx: 8, counter: true }, { x: 6, y: 4, counter: true },
], { rug: [4, 3, 4, 3] });
CC.MAPS['hut-in'] = room('Healing Hut', [
  '#PPPPPPPPPP#', '#WWWwWWwWWW#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#####mm#####',
], ['village', 17, 12], [
  { x: 5, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 6, y: 3, counter: true },
  { x: 8, y: 2, img: 'furniture/heal-2', h: 18, talk: 'The healing machine hums softly.' },
  { x: 10, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' },
  { x: 2, y: 2, img: 'furniture/heal-5', h: 24, talk: 'Jars of dried herbs: moonleaf, sunpetal, bitterroot.' },
  { x: 3, y: 1, img: 'furniture/heal-6', h: 14, solid: false, dy: 4 },
  { x: 1, y: 5, img: 'furniture/heal-4', h: 18, talk: 'A soft cot. Creatures rest here after a long day.' },
  { x: 10, y: 6, img: 'furniture/furn-5', h: 15 },
]);
CC.MAPS['outpost-in'] = room('Grassland Outpost', [
  '#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####',
], ['grassland', 18, 12], [
  { x: 4, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 5, y: 3, counter: true },
  { x: 7, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' }, { x: 2, y: 2, img: 'furniture/heal-5', h: 24 },
  { x: 8, y: 5, img: 'furniture/furn-5', h: 15 },
]);
CC.MAPS['shop-in'] = room('Pip\'s Cube Shop', [
  '#PPPPPPPP#', '#WwWWWWwW#', '#........#', '#........#', '#........#', '#........#', '####mm####',
], ['village', 17, 5], [
  { x: 4, y: 3, img: 'furniture/furn-9', h: 17, dx: 8, counter: true }, { x: 5, y: 3, counter: true },
  { x: 1, y: 2, img: 'furniture/furn-10', h: 20, talk: 'Shelves of cubes, stacked in neat purple-and-blue rows.' },
  { x: 7, y: 2, img: 'furniture/furn-10', h: 20 }, { x: 8, y: 2, img: 'furniture/furn-10', h: 20 },
  { x: 8, y: 5, img: 'furniture/furn-5', h: 15 },
], { rug: [3, 4, 4, 1] });
CC.MAPS['home-in'] = room('Your House', [
  '#PPPPPPPP#', '#WWwWWwWW#', '#........#', '#........#', '#........#', '#........#', '####mm####',
], ['village', 4, 12], [
  { x: 1, y: 2, img: 'furniture/furn-1', h: 22, talk: 'bed' }, { x: 3, y: 2, img: 'furniture/furn-8', h: 18, talk: 'Your clothes, folded. Mostly.' },
  { x: 7, y: 2, img: 'furniture/furn-4', h: 22, talk: 'Something good was cooked here this morning.' },
  { x: 5, y: 4, img: 'furniture/furn-2', h: 16, dx: 8 }, { x: 6, y: 4 }, { x: 8, y: 5, img: 'furniture/furn-5', h: 15 },
], { rug: [4, 3, 4, 3] });
// which room each door opens
CC.DOORS = { willow: 'willow-in', hut: 'hut-in', shop: 'shop-in', home: 'home-in', outpost: 'outpost-in' };

var SOLID = { T: 1, '~': 1, o: 1, S: 1, '=': 1, '#': 1, W: 1, w: 1, P: 1, L: 1 };
// is this tile a wall? (region maps can make more letters solid in their legend)
CC.tileSolid = function (map, t) {
  if (SOLID[t]) return true;
  var e = map.legend && CC.LEGENDS[map.legend][t];
  return !!(e && e.solid);
};
var T = 16;

function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

CC.tileAt = function (map, x, y) {
  if (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[0].length) return null;
  var t = map.rows[y][x];
  if (t === '=' && CC.state.flags[map.gateFlag || 'logCleared']) return ':';
  return t;
};

// ---------- the map picture ----------
// Drawn once per map at 2x (32 px a tile) so the 32 px tileset art keeps its detail; the world draws it at half size.
var R = 2, TP = T * R;
// tile numbers in the 4 x 4 tileset atlases made by tools/import-art.py
var TILESET = {
  village: { atlas: 'home-village', grass: 0, flowers: [7, 8, 9, 15], dirtFrom: 4 },
  grass: { atlas: 'grassland-spawn-zone', grass: 0, flowers: [2, 3, 4, 5], dirtFrom: 8, tall: 1, rock: 11 },
};
var PATHLIKE = { ':': 1, '=': 1 };

function atlasTile(g, atlas, idx, px, py, sx, sy, sw, sh) {
  var a = CC.img('tiles/' + atlas);
  if (!a) return false;
  sx = sx || 0; sy = sy || 0; sw = sw || 32; sh = sh || 32;
  g.drawImage(a, (idx % 4) * 32 + sx, Math.floor(idx / 4) * 32 + sy, sw, sh, px + sx, py + sy, sw, sh);
  return true;
}
// a whole tile, mirrored by a hash of its spot so a field of the same tile doesn't read as a grid
function variedTile(g, atlas, idx, x, y) {
  var a = CC.img('tiles/' + atlas);
  if (!a) return false;
  var fx = hash(x * 3 + 1, y) < 0.5, fy = hash(x, y * 5 + 2) < 0.5;
  g.save(); g.translate(x * TP + (fx ? TP : 0), y * TP + (fy ? TP : 0)); g.scale(fx ? -1 : 1, fy ? -1 : 1);
  g.drawImage(a, (idx % 4) * 32, Math.floor(idx / 4) * 32, 32, 32, 0, 0, 32, 32);
  g.restore();
  return true;
}
// three dirt colors (dark, mid, light) taken from the middle of a tileset's crossroad tile
var dirtCache = {};
function dirtColors(atlas, idx) {
  var k = atlas + idx;
  if (dirtCache[k]) return dirtCache[k];
  var a = CC.img('tiles/' + atlas), cols = [];
  if (a) {
    var c = CC.makeCanvas(8, 8), x = c.getContext('2d');
    x.drawImage(a, (idx % 4) * 32 + 12, Math.floor(idx / 4) * 32 + 12, 8, 8, 0, 0, 8, 8);
    var d = x.getImageData(0, 0, 8, 8).data;
    for (var i = 0; i < d.length; i += 4) cols.push([d[i], d[i + 1], d[i + 2]]);
    cols.sort(function (p, q) { return (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]); });
  }
  var pick = function (f) { var c = cols[Math.floor(cols.length * f)] || [216, 184, 120]; return 'rgb(' + c.join(',') + ')'; };
  return (dirtCache[k] = { dark: pick(0.08), mid: pick(0.5), light: pick(0.92) });
}

function drawDirt(g, x, y, map, ts) {
  var px = x * TP, py = y * TP, dc = dirtColors(ts.atlas, ts.dirtFrom), a = CC.img('tiles/' + ts.atlas);
  var ox = (ts.dirtFrom % 4) * 32 + 8, oy = Math.floor(ts.dirtFrom / 4) * 32 + 8;
  // four 16 px patches of real dirt, each mirrored its own way
  for (var q = 0; q < 4; q++) {
    var qx = (q % 2) * 16, qy = Math.floor(q / 2) * 16, fx = hash(x * 2 + q, y) < 0.5, fy = hash(x, y * 2 + q) < 0.5;
    g.save(); g.translate(px + qx + (fx ? 16 : 0), py + qy + (fy ? 16 : 0)); g.scale(fx ? -1 : 1, fy ? -1 : 1);
    g.fillStyle = dc.mid; g.fillRect(0, 0, 16, 16);
    if (a) { g.globalAlpha = 0.5; g.drawImage(a, ox, oy, 16, 16, 0, 0, 16, 16); g.globalAlpha = 1; }
    g.restore();
  }
  for (var i = 0; i < 4; i++) { // a few pebbles
    if (hash(x * 9 + i, y * 4) > 0.55) continue;
    var sx = px + 3 + Math.floor(hash(x * 7 + i, y * 3) * 26), sy = py + 3 + Math.floor(hash(x * 3, y * 7 + i) * 26);
    g.fillStyle = dc.dark; g.fillRect(sx, sy + 1, 3, 1); g.fillStyle = dc.light; g.fillRect(sx, sy, 2, 1);
  }
  // grass grows in a ragged edge over any side that isn't path, with soft shade on the dirt below it
  var open = function (dx, dy) { var t = CC.tileAt(map, x + dx, y + dy); return t !== null && !PATHLIKE[t]; };
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (s) {
    if (!open(s[0], s[1])) return;
    for (var i = 0; i < TP; i += 2) {
      var wob = Math.sin((s[0] ? y * TP + i : x * TP + i) * 0.45) * 1.5;
      var depth = Math.round(5 + wob + hash(x * 31 + i + s[0] * 7, y * 17 + s[1] * 5) * 4);
      var r = s[1] === -1 ? [i, 0, 2, depth] : s[1] === 1 ? [i, TP - depth, 2, depth] : s[0] === -1 ? [0, i, depth, 2] : [TP - depth, i, depth, 2];
      var sh = s[1] === -1 ? [i, depth, 2, 2] : s[1] === 1 ? [i, TP - depth - 2, 2, 2] : s[0] === -1 ? [depth, i, 2, 2] : [TP - depth - 2, i, 2, 2];
      g.fillStyle = 'rgba(70,45,20,0.28)'; g.fillRect(px + sh[0], py + sh[1], sh[2], sh[3]);
      atlasTile(g, ts.atlas, ts.grass, px, py, r[0], r[1], r[2], r[3]);
      // a darker blade tip now and then so the edge reads as grass, not a cut line
      if (ts.tip !== 'none' && hash(i, x + y * 7 + s[0] * 3) < 0.3) {
        g.fillStyle = ts.tip || 'rgba(30,90,30,0.7)';
        if (s[1]) g.fillRect(px + i, s[1] < 0 ? py + depth : py + TP - depth - 1, 1, 1); else g.fillRect(s[0] < 0 ? px + depth : px + TP - depth - 1, py + i, 1, 1);
      }
    }
  });
  // inside corners: a round tuft where two paths meet around a grass corner
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    if (open(c[0], c[1]) && !open(c[0], 0) && !open(0, c[1])) {
      for (var yy = 0; yy < 7; yy++) for (var xx = 0; xx < 7; xx++) {
        if (xx * xx + yy * yy > 40) continue;
        var cx = c[0] < 0 ? xx : TP - 1 - xx, cy = c[1] < 0 ? yy : TP - 1 - yy;
        atlasTile(g, ts.atlas, ts.grass, px, py, cx, cy, 1, 1);
      }
    }
  });
}

function drawWater(g, x, y, map) {
  var px = x * TP, py = y * TP;
  if (!variedTile(g, 'water-shoreline', map.deepWater ? 0 : 1, x, y)) return false;
  var land = function (dx, dy) { var t = CC.tileAt(map, x + dx, y + dy); return t !== null && t !== '~'; };
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (s) {
    if (!land(s[0], s[1])) return;
    for (var i = 0; i < TP; i += 2) {
      var d = 4 + Math.floor(hash(x * 13 + i, y * 29 + s[0] + s[1] * 3) * 3);
      var r = s[1] === -1 ? [i, 0, 2, d] : s[1] === 1 ? [i, TP - d, 2, d] : s[0] === -1 ? [0, i, d, 2] : [TP - d, i, d, 2];
      atlasTile(g, 'water-shoreline', 3, px, py, r[0], r[1], r[2], r[3]);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      var f = s[1] === -1 ? [i, d, 2, 1] : s[1] === 1 ? [i, TP - d - 1, 2, 1] : s[0] === -1 ? [d, i, 1, 2] : [TP - d - 1, i, 1, 2];
      g.fillRect(px + f[0], py + f[1], f[2], f[3]);
    }
  });
  return true;
}

// an art piece standing on a tile: `h` virtual px tall, feet at the tile's bottom middle
function standOnTile(g, img, x, y, h, dx, dy) {
  if (!img) return false;
  var k = h * R / img.height, w = img.width * k;
  g.drawImage(img, x * TP + TP / 2 - w / 2 + (dx || 0) * R, (y + 1) * TP - h * R + (dy || 0) * R, w, h * R);
  return true;
}

// interior atlas (8 across): wood 0 1, checker 2 3, rug 4, plaster wall 12, wall with window 13, doormat 24
function drawInteriorTile(g, t, x, y, map) {
  var px = x * TP, py = y * TP;
  var a = CC.img('tiles/interior');
  if (!a) return false;
  var at = function (i) { g.drawImage(a, (i % 8) * 32, Math.floor(i / 8) * 32, 32, 32, px, py, 32, 32); };
  switch (t) {
    case '#':
      g.fillStyle = '#2a1a12'; g.fillRect(px, py, TP, TP);
      g.fillStyle = '#3a2618'; for (var i = 0; i < TP; i += 8) g.fillRect(px, py + i, TP, 1);
      if (CC.tileAt(map, x, y + 1) === '.' || CC.tileAt(map, x, y + 1) === 'c') { g.fillStyle = '#5a3a22'; g.fillRect(px, py + TP - 3, TP, 3); }
      if (CC.tileAt(map, x + 1, y) && '.cmPWw'.indexOf(CC.tileAt(map, x + 1, y)) >= 0) { g.fillStyle = '#4a3020'; g.fillRect(px + TP - 3, py, 3, TP); }
      if (CC.tileAt(map, x - 1, y) && '.cmPWw'.indexOf(CC.tileAt(map, x - 1, y)) >= 0) { g.fillStyle = '#4a3020'; g.fillRect(px, py, 3, TP); }
      return true;
    case 'P': // the upper wall: plain plaster from the wall tile, with a beam along the ceiling
      g.drawImage(a, 12 % 8 * 32 + 4, Math.floor(12 / 8) * 32 + 2, 24, 10, px, py, 32, 32);
      g.fillStyle = '#4a2e1c'; g.fillRect(px, py, 32, 4); g.fillStyle = '#6a4428'; g.fillRect(px, py + 4, 32, 1);
      g.fillStyle = 'rgba(60,30,10,0.12)'; g.fillRect(px, py + 5, 32, 6);
      return true;
    case 'W': at(12); return true;
    case 'w': at(13); return true;
    case 'm': at(24); return true;
    case '.': at(hash(x, y) < 0.5 ? 0 : 1); break;
    case 'c': at(2); break;
    default: return false;
  }
  // a soft shadow along the walls
  if ('#WwP'.indexOf(CC.tileAt(map, x, y - 1)) >= 0) { var grd = g.createLinearGradient(0, py, 0, py + 10); grd.addColorStop(0, 'rgba(30,15,5,0.45)'); grd.addColorStop(1, 'rgba(30,15,5,0)'); g.fillStyle = grd; g.fillRect(px, py, TP, 10); }
  if (CC.tileAt(map, x - 1, y) === '#') { g.fillStyle = 'rgba(30,15,5,0.25)'; g.fillRect(px, py, 5, TP); }
  if (CC.tileAt(map, x + 1, y) === '#') { g.fillStyle = 'rgba(30,15,5,0.25)'; g.fillRect(px + TP - 5, py, 5, TP); }
  return true;
}

function drawArtTile(g, t, x, y, map) {
  if (map.indoors) return drawInteriorTile(g, t, x, y, map);
  if (map.legend) return drawLegendTile(g, t, x, y, map);
  var ts = TILESET[map.tileset || 'grass'], px = x * TP, py = y * TP, r = hash(x, y);
  var grass = function () { return variedTile(g, ts.atlas, ts.grass, x, y); };
  switch (t) {
    case '.': return grass();
    case '*': return atlasTile(g, ts.atlas, ts.flowers[Math.floor(r * ts.flowers.length)], px, py);
    case ',': return variedTile(g, TILESET.grass.atlas, TILESET.grass.tall, x, y);
    case ':': drawDirt(g, x, y, map, ts); return true;
    case '=': drawDirt(g, x, y, map, ts);
      if (!CC.state.flags.logCleared && !CC.img('props/gate-log')) atlasTile(g, 'forest', 5, px, py);
      return true;
    case '~': return drawWater(g, x, y, map);
    case 'o': grass(); return atlasTile(g, TILESET.grass.atlas, TILESET.grass.rock, px, py);
    case 'T': return grass(); // trees come in their own pass so they overlap
    case 'S': grass(); return standOnTile(g, CC.img(map.signArt || 'props/village-props-11') || CC.img('props/village-props-1'), x, y, map.signArt ? 17 : 15);
  }
  return false;
}

// ---------- region maps: tiles come from the map's legend (CC.LEGENDS in 14-regions.js) ----------
// one tile from an atlas, picked by a hash from a list; ground tiles mirror both ways, standing things only sideways
// inset: trims a frame some tiles were drawn with; turn: lays the tile on its side
function legendPiece(g, atlas, cols, list, x, y, flip, inset, turn) {
  var a = CC.img('tiles/' + atlas);
  if (!a || !list || !list.length) return false;
  var idx = list[Math.floor(hash(x * 7 + 3, y * 13 + 1) * list.length)], n = inset || 0;
  var fx = flip && hash(x * 3 + 1, y) < 0.5, fy = flip === 2 && hash(x, y * 5 + 2) < 0.5;
  g.save(); g.translate(x * TP + TP / 2, y * TP + TP / 2); g.scale(fx ? -1 : 1, fy ? -1 : 1);
  if (turn) g.rotate(Math.PI / 2);
  g.drawImage(a, (idx % cols) * 32 + n, Math.floor(idx / cols) * 32 + n, 32 - 2 * n, 32 - 2 * n, -16, -16, 32, 32);
  g.restore();
  return true;
}
function legendGround(g, lg, x, y) {
  if (lg.fill) { g.fillStyle = lg.fill; g.fillRect(x * TP, y * TP, TP, TP); }
  return legendPiece(g, lg.groundAtlas || lg.atlas, lg.cols || 4, lg.ground, x, y, 2) || !!lg.fill;
}
// cave walls: dark rock with a lit rocky face wherever the floor is below, and a rim along the floor beside it
function drawCaveWall(g, x, y, map, lg) {
  var px = x * TP, py = y * TP, wall = function (dx, dy) { var t = CC.tileAt(map, x + dx, y + dy); return t === null || t === 'T'; };
  g.fillStyle = '#17141f'; g.fillRect(px, py, TP, TP);
  for (var i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#221d2c' : '#1d1926'; g.fillRect(px + Math.floor(hash(x * 5 + i, y) * 26), py + Math.floor(hash(x, y * 5 + i) * 26), 5, 3); }
  var a = CC.img('tiles/' + lg.atlas);
  if (!a) return;
  // the rocky rim from the cave atlas: tile 7 is void above a rim, tile 4 is void beside a rim
  if (!wall(0, 1)) g.drawImage(a, 96, 32, 32, 26, px, py + 6, 32, 26);
  if (!wall(0, -1)) { g.save(); g.translate(px, py + 26); g.scale(1, -1); g.drawImage(a, 96, 40, 32, 18, 0, 0, 32, 18); g.restore(); }
  if (!wall(1, 0)) g.drawImage(a, 0, 32, 16, 32, px + 16, py, 16, 32);
  if (!wall(-1, 0)) { g.save(); g.translate(px + 16, py); g.scale(-1, 1); g.drawImage(a, 0, 32, 16, 32, 0, 0, 16, 32); g.restore(); }
}
function drawLegendTile(g, t, x, y, map) {
  var lg = CC.LEGENDS[map.legend], e = lg[t], cols = lg.cols || 4;
  var isPath = function (dx, dy) { var n = CC.tileAt(map, x + dx, y + dy); return n === ':' || n === '='; };
  var piece = function (en, flip, turn) { return legendPiece(g, en.atlas || lg.atlas, en.atlas ? 4 : cols, en.i, x, y, en.noflip ? 0 : flip, en.inset, turn); };
  var path = function () {
    var pe = lg[':'];
    if (pe && pe.deck) { // a wide wooden deck: the planks from a boardwalk tile, with dark edges and posts where it ends
      var da = CC.img('tiles/' + lg.atlas), di = pe.deck, turn = (isPath(-1, 0) || isPath(1, 0)) && !isPath(0, -1) && !isPath(0, 1);
      if (!da) return legendGround(g, lg, x, y);
      g.save(); g.translate(x * TP + 16, y * TP + 16); if (turn) g.rotate(Math.PI / 2);
      g.drawImage(da, (di % 4) * 32 + 7, Math.floor(di / 4) * 32 + (hash(x, y) < 0.5 ? 0 : 0), 18, 32, -16, -16, 32, 32);
      g.restore();
      var px = x * TP, py = y * TP;
      g.fillStyle = 'rgba(30,20,10,0.55)';
      if (!isPath(-1, 0)) g.fillRect(px, py, 3, TP);
      if (!isPath(1, 0)) g.fillRect(px + TP - 3, py, 3, TP);
      if (!isPath(0, -1)) g.fillRect(px, py, TP, 2);
      if (!isPath(0, 1)) { g.fillStyle = 'rgba(30,20,10,0.4)'; g.fillRect(px, py + TP - 3, TP, 3); }
      g.fillStyle = '#4a3220';
      if (!isPath(-1, 0) && y % 2 === 0) g.fillRect(px, py + 2, 4, 5);
      if (!isPath(1, 0) && y % 2 === 0) g.fillRect(px + TP - 4, py + 2, 4, 5);
      return true;
    }
    if (pe && pe.i) {
      if (pe.under) legendGround(g, lg, x, y);
      return piece(pe, 1, pe.turns && (isPath(-1, 0) || isPath(1, 0)) && !isPath(0, -1) && !isPath(0, 1));
    }
    if (lg.pathTint) { legendGround(g, lg, x, y); g.fillStyle = lg.pathTint; g.fillRect(x * TP, y * TP, TP, TP); return true; }
    if (lg.dirtFrom == null) return legendGround(g, lg, x, y);
    drawDirt(g, x, y, map, { atlas: lg.groundAtlas || lg.atlas, grass: lg.ground[0], dirtFrom: lg.dirtFrom, tip: lg.tip });
    return true;
  };
  switch (t) {
    case ':': case '=': return path();
    case '~': if (e && e.water) return drawWater(g, x, y, map); break;
    case 'T': if (lg.wall) { drawCaveWall(g, x, y, map, lg); return true; } if (lg.trees) return legendGround(g, lg, x, y); break;
    case 'S': legendGround(g, lg, x, y); return standOnTile(g, CC.img(map.signArt) || CC.img('props/village-props-11'), x, y, 17);
    case 'L': case '.': return legendGround(g, lg, x, y);
  }
  if (!e) return legendGround(g, lg, x, y);
  if (e.prop) { legendGround(g, lg, x, y); return standOnTile(g, CC.img(e.prop), x, y, e.h || 14); }
  var single = e.tile && CC.img(e.tile);
  if (single) { // a tile that is its own picture (not in the atlas)
    var fl = hash(x * 3 + 1, y) < 0.5;
    g.save(); g.translate(x * TP + (fl ? TP : 0), y * TP); g.scale(fl ? -1 : 1, 1); g.drawImage(single, 0, 0, TP, TP); g.restore();
    return true;
  }
  if (e.under) legendGround(g, lg, x, y);
  return piece(e, t === ',' || t === 'r' || t === '~' ? 2 : 1) || legendGround(g, lg, x, y);
}

// ---------- the code-drawn tiles (used when the tileset art is missing) ----------
function drawTile(g, t, x, y, map) {
  var px = x * T, py = y * T, r = hash(x, y);
  var grass = function () {
    g.fillStyle = '#78c850'; g.fillRect(px, py, T, T);
    g.fillStyle = '#88d860';
    for (var i = 0; i < 3; i++) g.fillRect(px + Math.floor(hash(x + i, y) * 14), py + Math.floor(hash(x, y + i) * 14), 2, 1);
    g.fillStyle = '#5aa840';
    for (var j = 0; j < 2; j++) g.fillRect(px + Math.floor(hash(x * 3 + j, y) * 14), py + Math.floor(hash(x, y * 3 + j) * 13), 1, 2);
  };
  switch (t) {
    case '.': grass(); break;
    case '*': grass();
      [[3, 4], [10, 9], [6, 12]].forEach(function (p, i) {
        g.fillStyle = ['#f8f0f8', '#f8d040', '#f07ab0'][(i + Math.floor(r * 3)) % 3]; g.fillRect(px + p[0], py + p[1], 3, 3);
        g.fillStyle = '#f8a020'; g.fillRect(px + p[0] + 1, py + p[1] + 1, 1, 1);
      }); break;
    case ',': // tall grass: dark tufts with visible blades
      g.fillStyle = '#4a9a38'; g.fillRect(px, py, T, T);
      for (var k = 0; k < 4; k++) {
        var bx = px + (k % 2) * 8, by = py + Math.floor(k / 2) * 8;
        g.fillStyle = '#2f7a2a'; g.fillRect(bx + 1, by + 3, 6, 5);
        g.fillStyle = '#5ab848'; g.fillRect(bx + 1, by + 1, 1, 5); g.fillRect(bx + 3, by, 1, 6); g.fillRect(bx + 5, by + 1, 1, 5);
        g.fillStyle = '#90e070'; g.fillRect(bx + 3, by, 1, 2);
      } break;
    case ':':
      g.fillStyle = '#e0c890'; g.fillRect(px, py, T, T);
      g.fillStyle = '#d0b478';
      for (var q = 0; q < 4; q++) g.fillRect(px + Math.floor(hash(x + q * 7, y) * 14), py + Math.floor(hash(x, y + q * 5) * 14), 2, 2);
      break;
    case 'T':
      grass();
      g.fillStyle = '#7a5232'; g.fillRect(px + 6, py + 10, 4, 6);
      g.fillStyle = '#2a6e34'; g.beginPath(); g.arc(px + 8, py + 7, 7.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3f8a3a'; g.beginPath(); g.arc(px + 7, py + 6, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5aa848'; g.fillRect(px + 4, py + 3, 3, 2); g.fillRect(px + 9, py + 5, 2, 2);
      g.fillStyle = '#1e4a26'; g.fillRect(px + 2, py + 11, 12, 1);
      break;
    case '~':
      g.fillStyle = '#3a8ee8'; g.fillRect(px, py, T, T);
      g.fillStyle = '#5aa8f0'; g.fillRect(px + 2 + Math.floor(r * 6), py + 4, 5, 1); g.fillRect(px + 7, py + 11, 5, 1);
      if (CC.tileAt(map, x, y - 1) !== '~') { g.fillStyle = '#e0c890'; g.fillRect(px, py, T, 2); g.fillStyle = '#8fd0ff'; g.fillRect(px, py + 2, T, 1); }
      break;
    case 'o':
      grass();
      g.fillStyle = '#5a5060'; g.fillRect(px + 2, py + 5, 12, 10);
      g.fillStyle = '#9a90a0'; g.fillRect(px + 3, py + 5, 10, 8);
      g.fillStyle = '#c8c0d0'; g.fillRect(px + 4, py + 6, 5, 2);
      break;
    case 'S':
      grass();
      g.fillStyle = '#5a3a22'; g.fillRect(px + 7, py + 8, 2, 8);
      g.fillStyle = '#3a2a22'; g.fillRect(px + 2, py + 2, 12, 8);
      g.fillStyle = '#c89a5a'; g.fillRect(px + 3, py + 3, 10, 6);
      g.fillStyle = '#a87a40'; g.fillRect(px + 4, py + 5, 8, 1); g.fillRect(px + 4, py + 7, 6, 1);
      break;
    case '=':
      g.fillStyle = '#e0c890'; g.fillRect(px, py, T, T);
      if (!CC.state.flags.logCleared) {
        g.fillStyle = '#3a2a1a'; g.fillRect(px, py + 4, T, 10);
        g.fillStyle = '#7a5232'; g.fillRect(px, py + 5, T, 8);
        g.fillStyle = '#9a6a42'; g.fillRect(px, py + 6, T, 2);
        g.fillStyle = '#4f9a40'; g.fillRect(px + Math.floor(r * 10), py + 4, 5, 2);
      }
      break;
  }
}

function drawBuilding(g, b) {
  var px = b.x * T, py = b.y * T, w = b.w * T, h = b.h * T;
  // walls
  g.fillStyle = '#3a2a22'; g.fillRect(px, py + 14, w, h - 14);
  g.fillStyle = b.wall; g.fillRect(px + 1, py + 15, w - 2, h - 16);
  g.fillStyle = CC.shade(b.wall, -0.15); g.fillRect(px + 1, py + h - 4, w - 2, 3);
  // roof
  g.fillStyle = '#2a1a1a'; g.fillRect(px - 2, py - 2, w + 4, 20);
  g.fillStyle = b.roof; g.fillRect(px - 1, py - 1, w + 2, 18);
  g.fillStyle = CC.shade(b.roof, 0.25);
  for (var i = 0; i < w + 2; i += 4) g.fillRect(px - 1 + i, py - 1, 2, 18);
  g.fillStyle = CC.shade(b.roof, -0.25); g.fillRect(px - 1, py + 14, w + 2, 3);
  if (b.stripe) { g.fillStyle = b.stripe; for (var s = 0; s < w; s += 8) g.fillRect(px + s, py + 16, 4, 4); }
  // windows
  var dx = (b.door[0] - b.x) * T;
  for (var wx = 4; wx < w - 8; wx += 16) {
    if (Math.abs(wx - dx) < 14) continue;
    g.fillStyle = '#3a2a22'; g.fillRect(px + wx, py + 24, 10, 9);
    g.fillStyle = '#8fd0ff'; g.fillRect(px + wx + 1, py + 25, 8, 7);
    g.fillStyle = '#e4faff'; g.fillRect(px + wx + 1, py + 25, 3, 2);
  }
  // door
  var ddx = px + dx + 3, ddy = py + (b.door[1] - b.y) * T;
  g.fillStyle = '#3a2a22'; g.fillRect(ddx - 1, ddy - 1, 12, 17);
  g.fillStyle = '#8a5a32'; g.fillRect(ddx, ddy, 10, 16);
  g.fillStyle = '#a87a48'; g.fillRect(ddx + 1, ddy + 1, 3, 14);
  g.fillStyle = '#f8d040'; g.fillRect(ddx + 7, ddy + 8, 2, 2);
  if (b.heart) {
    g.fillStyle = '#f07ab0'; g.fillRect(ddx + 2, ddy - 10, 2, 2); g.fillRect(ddx + 6, ddy - 10, 2, 2); g.fillRect(ddx + 1, ddy - 9, 8, 3); g.fillRect(ddx + 3, ddy - 6, 4, 1); g.fillRect(ddx + 4, ddy - 5, 2, 1);
  }
  if (b.id === 'shop') { var keep = CC.g; CC.g = g; CC.drawCube(ddx + 5, ddy - 8, 8); CC.g = keep; }
}

// where each building's door sits across its picture (0 = left edge, 1 = right edge)
// smoke: where the chimney top is across and down the picture
var BUILDING_ART = {
  willow: { art: 'elder-s-house', door: 0.5, smoke: [0.73, 0.04] }, shop: { art: 'cube-shop', door: 0.5, smoke: [0.73, 0.03] },
  home: { art: 'player-house', door: 0.33, smoke: [0.78, 0.13] },
  hut: { art: 'healing-hut', door: 0.5 }, outpost: { art: 'outpost-hut', door: 0.55, fallback: 'healing-hut' }, inn: { art: 'inn', door: 0.36, smoke: [0.73, 0.03] },
};
// buildings on the region maps name their picture (art) and these say how wide it is drawn and where its door sits
var ART_INFO = {
  'bramble-farmhouse': { door: 0.42, smoke: null }, 'oakley-ranger-station': { door: 0.45 }, 'gus-dock-shack': { door: 0.5 },
  'dusty-mine-office': { door: 0.5 }, 'safi-nomad-tent': { door: 0.45 }, 'frida-log-cabin': { door: 0.42, smoke: [0.27, 0.02] },
  'granny-moss-hut': { door: 0.5 }, 'corvin-watchtower': { door: 0.5, width: 34 }, 'moonlit-spire': { door: 0.5, width: 44 },
  'outpost-hut': { door: 0.55, fallback: 'healing-hut' },
};
function drawBuildingArt(g, b) {
  var info = BUILDING_ART[b.id] || (b.art && Object.assign({ art: b.art, door: 0.5 }, ART_INFO[b.art] || {}));
  var img = info && (CC.img('buildings/' + info.art) || (info.fallback && CC.img('buildings/' + info.fallback)));
  if (!img) return false;
  var w = (info.width || b.w * T + (b.small ? 4 : 10)) * R, k = w / img.width, h = img.height * k;
  var doorX = (b.door[0] * T + T / 2) * R, left = doorX - info.door * w, bottom = (b.y + b.h) * TP + 3 * R;
  g.fillStyle = 'rgba(20,30,10,0.25)'; g.beginPath(); g.ellipse(left + w / 2, bottom - 3 * R, w * 0.46, 5 * R, 0, 0, Math.PI * 2); g.fill();
  g.drawImage(img, left, bottom - h, w, h);
  if (info.smoke) b.smokeAt = [(left + info.smoke[0] * w) / R, (bottom - h + info.smoke[1] * h) / R];
  return true;
}

CC.buildMapPicture = function (id) {
  var map = CC.MAPS[id], w = map.rows[0].length, h = map.rows.length;
  var cv = CC.makeCanvas(w * TP, h * TP), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  var x, y;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    var t = CC.tileAt(map, x, y);
    if (!drawArtTile(g, t, x, y, map)) { g.save(); g.scale(R, R); drawTile(g, t, x, y, map); g.restore(); }
  }
  // tall grass spills a few blades over the edge above it and shades the ground below it
  var lg = map.legend && CC.LEGENDS[map.legend];
  var tall = (!lg || lg.grassy) && CC.img('tiles/' + TILESET.grass.atlas), ti = TILESET.grass.tall;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    if (map.rows[y][x] !== ',' || !tall) continue;
    var above = CC.tileAt(map, x, y - 1), below = CC.tileAt(map, x, y + 1);
    if (above !== ',' && above !== null && above !== 'T') {
      for (var b = 0; b < 5; b++) {
        var bx = Math.floor(hash(x * 5 + b, y) * 28), bh = 3 + Math.floor(hash(x, y * 5 + b) * 4);
        g.drawImage(tall, (ti % 4) * 32 + bx, Math.floor(ti / 4) * 32 + 2, 3, 8, x * TP + bx, y * TP - bh, 3, 8);
      }
    }
    if (below !== ',' && below !== null && below !== 'T') {
      g.fillStyle = 'rgba(20,50,20,0.25)'; g.fillRect(x * TP, (y + 1) * TP, TP, 3);
    }
  }
  // decorations, then trees row by row (lower ones in front), then buildings
  if (map.rug) { // a rug: the rug tile's border and middle stretched over a few tiles
    var ra = CC.img('tiles/interior'), rg = map.rug;
    if (ra) {
      var rx = rg[0] * TP, ry = rg[1] * TP, rw = rg[2] * TP, rh = rg[3] * TP, sx0 = 4 * 32, e = 8;
      g.drawImage(ra, sx0 + e, e, 32 - 2 * e, 32 - 2 * e, rx + e, ry + e, rw - 2 * e, rh - 2 * e);
      g.drawImage(ra, sx0, 0, e, e, rx, ry, e, e); g.drawImage(ra, sx0 + 32 - e, 0, e, e, rx + rw - e, ry, e, e);
      g.drawImage(ra, sx0, 32 - e, e, e, rx, ry + rh - e, e, e); g.drawImage(ra, sx0 + 32 - e, 32 - e, e, e, rx + rw - e, ry + rh - e, e, e);
      g.drawImage(ra, sx0 + e, 0, 32 - 2 * e, e, rx + e, ry, rw - 2 * e, e); g.drawImage(ra, sx0 + e, 32 - e, 32 - 2 * e, e, rx + e, ry + rh - e, rw - 2 * e, e);
      g.drawImage(ra, sx0, e, e, 32 - 2 * e, rx, ry + e, e, rh - 2 * e); g.drawImage(ra, sx0 + 32 - e, e, e, 32 - 2 * e, rx + rw - e, ry + e, e, rh - 2 * e);
    }
  }
  (map.decor || []).forEach(function (d) {
    var img = d.chest ? (CC.state.flags['chest:' + d.chest] ? 'props/treasure-chest-and-pickups-2' : 'props/treasure-chest-and-pickups-1') : d.img;
    if (img) standOnTile(g, CC.img(img), d.x, d.y, d.h || (d.chest ? 12 : 14), d.dx, d.dy);
  });
  var oak = CC.img(lg && lg.trees ? lg.trees[1] || lg.trees[0] : 'props/trees-1'), pine = CC.img(lg && lg.trees ? lg.trees[0] : 'props/trees-2');
  var pines = lg && lg.trees ? lg.pines : map.pines || 0.2;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    if (map.rows[y][x] !== 'T' || (lg && !lg.trees)) continue;
    var tree = hash(x * 5, y * 11) < pines ? pine : oak;
    if (!standOnTile(g, tree, x, y, 22, Math.round((hash(x, y * 3) - 0.5) * 3), 3)) { g.save(); g.scale(R, R); drawTile(g, 'T', x, y, map); g.restore(); }
  }
  // the landmark (a big picture over its L block), then buildings
  var lm = map.landmarkAt, limg = lm && CC.img(map.landmark);
  if (limg) {
    var lw = (lm.w * T + 12) * R, lh = limg.height * lw / limg.width, lbx = (lm.x + lm.w / 2) * TP, lby = (lm.y + lm.h) * TP + 2 * R;
    g.fillStyle = 'rgba(10,20,10,0.22)'; g.beginPath(); g.ellipse(lbx, lby - 3 * R, lw * 0.45, 5 * R, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(limg, lbx - lw / 2, lby - lh, lw, lh);
  }
  map.buildings.forEach(function (b) { if (!drawBuildingArt(g, b)) { g.save(); g.scale(R, R); drawBuilding(g, b); g.restore(); } });
  // the gate across the trail (one picture over the whole gate) until its guide opens it
  var gate = CC.img(map.gateArt || 'props/gate-log'), gy = map.rows.findIndex(function (r) { return r.indexOf('=') >= 0; });
  if (gate && gy >= 0 && !CC.state.flags[map.gateFlag || 'logCleared']) {
    var gx = map.rows[gy].indexOf('='), gw = (map.rows[gy].lastIndexOf('=') - gx + 1) * TP + 12, gh = gate.height * gw / gate.width;
    g.drawImage(gate, gx * TP - 6, (gy + 1) * TP - gh + 6, gw, gh);
  }
  // spots that glow on the map (crystals, runes)
  map.glows = [];
  if (lg) for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var ge = lg[map.rows[y][x]]; if (ge && ge.glow) map.glows.push({ x: x, y: y, c: ge.glow }); }
  map.picture = cv;
};

// ---------- the world screen ----------
CC.world = {
  opaque: true,
  map: null, mapId: null, npcs: [],
  px: 0, py: 0, moving: null, stepAnim: 0, cooldown: 0, busy: false, hop: null, emote: null,

  enter: function (mapId, x, y, dir) {
    var s = CC.state;
    s.map = mapId; s.x = x; s.y = y; if (dir) s.dir = dir;
    this.mapId = mapId; this.map = CC.MAPS[mapId];
    if (!this.map.picture) CC.buildMapPicture(mapId);
    this.px = x * T; this.py = y * T; this.moving = null;
    this.npcs = (CC.NPCS[mapId] || []);
    if (!this.map.indoors) { s.visited = s.visited || {}; s.visited[mapId] = 1; }
    this.banner = this.map.indoors ? null : { text: this.map.name, t: 2.4, stone: { cave: 1, ruins: 1, spire: 1 }[mapId] };
    if (CC.music) CC.music.play(CC.mapTrack(mapId));
    this.fieldFx = null;
    CC.followReset(this);
  },
  refresh: function () { CC.buildMapPicture(this.mapId); },

  solidAt: function (x, y) {
    var t = CC.tileAt(this.map, x, y);
    if (t === null) return true;
    if (CC.tileSolid(this.map, t)) return true;
    if (this.buildingAt(x, y)) return true;
    if ((this.map.decor || []).some(function (d) { return d.x === x && d.y === y && d.solid !== false; })) return true;
    return !!this.npcAt(x, y);
  },
  buildingAt: function (x, y) {
    return this.map.buildings.find(function (b) { return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h; });
  },
  npcAt: function (x, y) {
    return this.npcs.find(function (n) { return (!n.when || n.when()) && n.x === x && n.y === y; });
  },
  exitAt: function (x, y) {
    var m = this.map, w = m.rows[0].length, h = m.rows.length;
    return m.exits.find(function (e) {
      if (e.side === 'top') return y < 0 && x >= e.x0 && x <= e.x1;
      if (e.side === 'bottom') return y >= h && x >= e.x0 && x <= e.x1;
      return false;
    });
  },

  run: function (fn) { // runs an async script with the player frozen
    var self = this; self.busy = true;
    return Promise.resolve().then(fn).catch(function (e) { console.error(e); }).then(function () { self.busy = false; });
  },

  update: function (dt) {
    var s = CC.state, inp = CC.input, self = this;
    s.playTime += dt;
    // people who walk: a step in progress, or (when nothing else is going on) the next step of their patrol
    this.npcs.forEach(function (n) {
      if (n.mv) { n.mv.k += dt * (n.mv.speed || 3.2); if (n.mv.k >= 1) { n.x = n.mv.tx; n.y = n.mv.ty; var done = n.mv.done; n.mv = null; if (done) done(); } return; }
      if (!n.patrol || self.busy || (n.when && !n.when())) return;
      n.wait = (n.wait || 1.5) - dt;
      if (n.wait > 0) return;
      n.wait = CC.rand(1.2, 2.6);
      n.leg = n.leg || 0;
      var goal = n.patrol[n.leg];
      if (goal[0] === n.x && goal[1] === n.y) { n.leg = (n.leg + 1) % n.patrol.length; goal = n.patrol[n.leg]; }
      var dx = Math.sign(goal[0] - n.x), dy = dx ? 0 : Math.sign(goal[1] - n.y);
      var nx = n.x + dx, ny = n.y + dy;
      n.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if ((dx || dy) && !(nx === s.x && ny === s.y) && !self.solidAt(nx, ny)) { n.mv = { fx: n.x, fy: n.y, tx: nx, ty: ny, k: 0 }; n.wait = 0.05 + (n.leg === 0 ? 0 : 0); }
    });
    if (this.busy) return;
    if (this.moving) {
      var mv = this.moving, speed = inp.held.b ? 8 : 4.4;
      mv.k += dt * speed;
      this.stepAnim += dt * speed;
      if (mv.k >= 1) {
        this.moving = null; s.x = mv.tx; s.y = mv.ty; this.px = s.x * T; this.py = s.y * T;
        this.afterStep(mv);
      } else { this.px = CC.lerp(mv.fx, mv.tx, mv.k) * T; this.py = CC.lerp(mv.fy, mv.ty, mv.k) * T; return; }
      if (this.busy) return;
    }
    // hold L + R and press MENU: the hidden dev code box
    if (inp.pressed.start && inp.held.l && inp.held.r) { CC.sfx('catch'); this.run(async function () { await CC.openCodes(); await CC.runCodeQueue(); }); return; }
    if (inp.pressed.start) { CC.sfx('select'); this.run(CC.fieldMenu); return; }
    // R: Fly (once you can), L: your party
    if (inp.pressed.r && !inp.held.l && CC.state.flags.fly && !this.map.indoors) { CC.sfx('select'); this.run(CC.flyScreen); return; }
    if (inp.pressed.l && !inp.held.r) { CC.sfx('select'); this.run(function () { return CC.partyScreen('field'); }); return; }
    if (inp.pressed.a) { this.interact(); return; }
    var dir = inp.held.up ? 'up' : inp.held.down ? 'down' : inp.held.left ? 'left' : inp.held.right ? 'right' : null;
    if (!dir) { this.stepAnim = 0; return; }
    s.dir = dir;
    var d = CC.DIRS[dir], nx = s.x + d[0], ny = s.y + d[1];
    var ex = this.exitAt(nx, ny);
    if (ex) { this.run(function () { return CC.useExit(ex, nx); }); return; }
    if (this.blockScript && this.blockScript(nx, ny)) return;
    var b = this.buildingAt(nx, ny);
    if (b && b.door[0] === nx && b.door[1] === ny && dir === 'up') { var self = this; this.run(function () { return CC.enterDoor(self.mapId, b.id); }); return; }
    if (this.solidAt(nx, ny)) { if (!this.bumped || CC.time - this.bumped > 0.3) { CC.sfx('bump'); this.bumped = CC.time; } return; }
    this.moving = { fx: s.x, fy: s.y, tx: nx, ty: ny, k: 0, dir: dir, run: !!inp.held.b };
    CC.followStep(s.x, s.y);
  },

  afterStep: function (mv) {
    var s = CC.state; s.steps++;
    if (mv) CC.fieldStep(this, { x: mv.fx, y: mv.fy, dir: mv.dir }, mv.run);
    if (this.cooldown > 0) this.cooldown--;
    var trig = (CC.TRIGGERS[this.mapId] && CC.TRIGGERS[this.mapId](s.x, s.y)) || (CC.trainerSight && CC.trainerSight(this.mapId, s.x, s.y));
    if (trig) { this.run(trig); return; }
    if (CC.tileAt(this.map, s.x, s.y) === ',') {
      var rc = CC.rustleColors(this.map);
      for (var i = 0; i < 4; i++) CC.fx.add({ x: this.screenX(s.x * T + 8), y: this.screenY(s.y * T + 12), vx: CC.rand(-20, 20), vy: CC.rand(-30, -10), life: 0.3, kind: 'grass', color: rc[i % 3], size: 3, grav: 120 });
      if (this.map.spawns && !CC.dev.noWild && CC.firstHealthy() >= 0 && this.cooldown <= 0 && Math.random() < 0.12) {
        var self = this; this.run(function () { return CC.wildEncounter(self.map.spawns); });
      }
    }
  },

  interact: function () {
    var s = CC.state, d = CC.DIRS[s.dir], fx = s.x + d[0], fy = s.y + d[1];
    var deco = (this.map.decor || []).find(function (o) { return o.x === fx && o.y === fy; });
    if (deco && deco.chest) { this.run(function () { return CC.openChest(deco); }); return; }
    if (CC.followerAt(fx, fy) && !this.npcAt(fx, fy)) { this.run(CC.talkToFollower); return; }
    // talking across a counter
    var n = this.npcAt(fx, fy) || (deco && deco.counter && this.npcAt(fx + d[0], fy + d[1]));
    if (!n && deco && deco.talk) { this.run(function () { return CC.useFurniture(deco); }); return; }
    if (n) {
      var back = { up: 'down', down: 'up', left: 'right', right: 'left' };
      n.dir = back[s.dir]; n.hop = CC.time; n.flip = s.dir === 'left';
      this.run(n.talk); return;
    }
    var t = CC.tileAt(this.map, fx, fy);
    if (t === 'S') { var sign = CC.SIGNS[this.mapId + ':' + fx + ',' + fy]; if (sign) this.run(function () { return CC.say(sign); }); return; }
    var b = this.buildingAt(fx, fy);
    if (b && b.door[0] === fx && b.door[1] === fy) { var self = this; this.run(function () { return CC.enterDoor(self.mapId, b.id); }); }
  },
  // where a person is drawn (between tiles while they walk)
  npcPos: function (n) {
    if (!n.mv) return [n.x * T, n.y * T];
    return [CC.lerp(n.mv.fx, n.mv.tx, n.mv.k) * T, CC.lerp(n.mv.fy, n.mv.ty, n.mv.k) * T];
  },

  camX: function () { var w = this.map.rows[0].length * T; return w <= CC.W ? (w - CC.W) / 2 : CC.clamp(this.px + 8 - CC.W / 2, 0, w - CC.W); },
  camY: function () { var h = this.map.rows.length * T; return h <= CC.H ? (h - CC.H) / 2 : CC.clamp(this.py + 8 - CC.H / 2, 0, h - CC.H); },
  screenX: function (x) { return x - Math.round(this.camX()); },
  screenY: function (y) { return y - Math.round(this.camY()); },

  draw: function () {
    var g = CC.g, cx = Math.round(this.camX()), cy = Math.round(this.camY()), s = CC.state, self = this, pic = this.map.picture;
    if (this.shakeT && CC.time < this.shakeT) { cx += Math.round(CC.rand(-2, 2)); cy += Math.round(CC.rand(-1, 1)); }
    var lgd = this.map.legend && CC.LEGENDS[this.map.legend];
    CC.rect(0, 0, CC.W, CC.H, this.map.indoors ? '#120b08' : lgd && lgd.backdrop || '#2a6e34');
    g.drawImage(pic, 0, 0, pic.width, pic.height, -cx, -cy, pic.width / R, pic.height / R);
    CC.drawFieldMarks(this, cx, cy);
    // water glints
    var rows = this.map.rows;
    for (var y = Math.max(0, Math.floor(cy / T)); y < Math.min(rows.length, Math.ceil((cy + CC.H) / T)); y++) {
      for (var x = Math.max(0, Math.floor(cx / T)); x < Math.min(rows[0].length, Math.ceil((cx + CC.W) / T)); x++) {
        if (rows[y][x] !== '~') continue;
        var ph = (CC.time * 0.7 + hash(x, y) * 3) % 3;
        if (ph < 1) { g.globalAlpha = Math.sin(ph * Math.PI) * 0.8; CC.rect(x * T - cx + 3 + Math.floor(hash(y, x) * 8), y * T - cy + 5 + Math.floor(hash(x + 1, y) * 6), 3, 1, '#ffffff'); g.globalAlpha = 1; }
      }
    }
    // people, sorted by y
    var who = this.npcs.filter(function (n) { return !n.when || n.when(); }).map(function (n) {
      var p = self.npcPos(n), fr = n.mv ? Math.floor(n.mv.k * 4) % 4 : 1;
      return { y: p[1], draw: function () {
        self.drawPerson(n, n.dir || 'down', p[0], p[1], fr);
        if (n.emote) { var em = CC.img('ui/emote-' + n.emote), ex = self.screenX(p[0] + 8), ey = self.screenY(p[1] - 22) - Math.abs(Math.sin(CC.time * 10)) * 2; if (em) g.drawImage(em, ex - 7, ey - 9, 14, 14 * em.height / em.width); }
      } };
    });
    var frame = this.moving ? Math.floor(this.stepAnim * 2.2) % 4 : 1;
    var landing = this.arrive ? (CC.time - this.arrive) / 1.1 : 2;
    if (CC.followerShown()) { var fp = CC.followerPos(this); who.push({ y: fp[1] - 0.5, draw: function () { CC.drawFollower(self, fp[0], fp[1]); } }); }
    if (landing >= 0.45) who.push({ y: this.py, draw: function () { self.drawPerson(null, s.dir, self.px, self.py, frame); } });
    who.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
    // the patch of grass shaking before something jumps out of it
    var gfx = this.grassFx, gimg = CC.img('fx/grass-spawn');
    if (gfx && gimg) {
      var gk = Math.min(1, (CC.time - gfx.t) / 0.25), gw = 22 * (0.6 + gk * 0.4), gh = gimg.height * gw / gimg.width;
      var shake = Math.sin(CC.time * 40) * 1.5;
      g.drawImage(gimg, this.screenX(gfx.x * T + 8) - gw / 2 + shake, this.screenY(gfx.y * T + 16) - gh, gw, gh);
    }
    // a creature hopping out of the grass
    if (this.hop) {
      var h = this.hop, k = CC.clamp(h.k, 0, 1), arc = Math.sin(k * Math.PI) * 18;
      var hx = this.screenX(h.x * T + 8), hy = this.screenY(h.y * T + 14);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(hx, hy, 6, 2, 0, 0, Math.PI * 2); g.fill();
      CC.drawSprite(CC.creatureSprite(h.id, h.shiny), hx, hy - arc, { scale: 0.34 + k * 0.08, sy: 1 + Math.sin(CC.time * 20) * 0.08 * (1 - k), id: h.id });
    }
    // after Fly: the big bird swoops down, drops you off, and flies away
    if (landing < 1) {
      var lx = this.screenX(this.px + 8), ly = this.screenY(this.py + 2), down = landing < 0.45 ? landing / 0.45 : 1 - (landing - 0.45) / 0.55;
      var oy = ly - 14 - (1 - down) * 90, ox = lx + (landing < 0.45 ? 0 : (landing - 0.45) * 160);
      g.fillStyle = 'rgba(0,0,0,' + (0.25 * down) + ')'; g.beginPath(); g.ellipse(lx, ly + 12, 10 * down, 3 * down, 0, 0, Math.PI * 2); g.fill();
      CC.drawSprite(CC.creatureSprite('timberowl'), ox, oy, { scale: 0.42, sy: 1 + Math.sin(CC.time * 18) * 0.12, id: 'timberowl' });
      if (landing > 0.44 && landing < 0.5) for (var q = 0; q < 6; q++) CC.fx.add({ x: lx + CC.rand(-8, 8), y: ly + 12, vx: CC.rand(-30, 30), vy: CC.rand(-15, -5), life: 0.4, kind: 'dust', size: 4 });
    } else this.arrive = null;
    this.drawAmbient(cx, cy);
    CC.drawDaylight(this, cx, cy);
    if (this.emote) {
      var ex = this.screenX(this.px + 8), ey = this.screenY(this.py - 22) - Math.abs(Math.sin(CC.time * 10)) * 2, em = CC.img('ui/emote-exclaim');
      if (em) g.drawImage(em, ex - 7, ey - 9, 14, 14 * em.height / em.width);
      else { CC.rect(ex - 5, ey - 6, 11, 12, '#3a2a22'); CC.rect(ex - 4, ey - 5, 9, 10, '#ffffff'); CC.rect(ex - 1, ey - 4, 3, 5, '#e84838'); CC.rect(ex - 1, ey + 2, 3, 2, '#e84838'); }
    }
    if (this.map.indoors) this.drawIndoorLight(cx, cy);
    if (this.banner) { this.banner.t -= CC.dt || 0; if (this.banner.t <= 0) this.banner = null; }
    if (this.banner) CC.drawPlaceSign(this.banner);
  },

  // Life on the map, all in code: chimney smoke, butterflies, lantern glow, and cloud shadows drifting over.
  drawAmbient: function (cx, cy) {
    var g = CC.g, map = this.map, dt = CC.dt || 0.016, t = CC.time;
    var amb = map.amb || (map.amb = { smoke: [], flies: [] });
    var wx = map.weather, calm = { cave: 1, snow: 1, night: 1, spire: 1, fog: 1 }[wx];
    if (!amb.flies.length && !map.indoors && !calm) {
      var W = map.rows[0].length * T, H = map.rows.length * T;
      for (var i = 0; i < 4; i++) amb.flies.push({ x: CC.rand(32, W - 32), y: CC.rand(32, H - 32), ph: CC.rand(0, 9), c: CC.pick(['#ffffff', '#f8e070', '#f8a8d0', '#a8d8ff']), vx: 0, vy: 0 });
    }
    // lanterns glow warm, more when the light is low
    (map.decor || []).forEach(function (d) {
      if (d.img !== 'props/village-props-18') return;
      var lx = d.x * T + 8 - cx - 3, ly = (d.y + 1) * T - d.h + 7 - cy, pulse = 0.12 + Math.sin(t * 3 + d.x) * 0.03;
      var grd = g.createRadialGradient(lx, ly, 0, lx, ly, 12);
      grd.addColorStop(0, 'rgba(255,220,140,' + (pulse * 2) + ')'); grd.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = grd; g.fillRect(lx - 12, ly - 12, 24, 24);
    });
    // chimney smoke puffs rise, drift and fade
    map.buildings.forEach(function (b) {
      if (!b.smokeAt) return;
      b.smokeT = (b.smokeT || 0) - dt;
      if (b.smokeT <= 0) { b.smokeT = CC.rand(0.35, 0.6); amb.smoke.push({ x: b.smokeAt[0], y: b.smokeAt[1], age: 0, life: CC.rand(2.2, 3), s: CC.rand(1.5, 2.5) }); }
    });
    amb.smoke = amb.smoke.filter(function (p) {
      p.age += dt; if (p.age > p.life) return false;
      var k = p.age / p.life, x = p.x + Math.sin(p.age * 1.5) * 2 + k * 6 - cx, y = p.y - k * 18 - cy, r = p.s + k * 3;
      g.globalAlpha = 0.5 * (1 - k); g.fillStyle = '#f4f0ec';
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      return true;
    });
    // butterflies wander and flap
    amb.flies.forEach(function (f) {
      f.vx += (Math.sin(t * 0.7 + f.ph) * 12 - f.vx) * dt; f.vy += (Math.cos(t * 0.9 + f.ph * 2) * 8 - f.vy) * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      var x = Math.round(f.x - cx), y = Math.round(f.y - cy + Math.sin(t * 5 + f.ph) * 2), flap = Math.sin(t * 22 + f.ph) > 0;
      if (x < -4 || y < -4 || x > CC.W + 4 || y > CC.H + 4) return;
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y + 6, 2, 1);
      g.fillStyle = f.c;
      if (flap) { g.fillRect(x - 2, y - 1, 2, 2); g.fillRect(x + 1, y - 1, 2, 2); } else { g.fillRect(x - 1, y - 2, 1, 2); g.fillRect(x + 1, y - 2, 1, 2); }
      g.fillStyle = '#3a2a22'; g.fillRect(x, y - 1, 1, 2);
    });
    // big soft cloud shadows sliding across
    if (!map.indoors && !{ cave: 1, spire: 1, night: 1 }[wx]) {
      for (var c = 0; c < 3; c++) {
        var span = map.rows[0].length * T + 200, sx = ((t * 6 + c * 157) % span) - 100 - cx, sy = (c * 97 + 40) % (map.rows.length * T) - cy;
        g.fillStyle = 'rgba(20,40,60,0.07)';
        g.beginPath(); g.ellipse(sx, sy, 46, 22, 0, 0, Math.PI * 2); g.ellipse(sx + 30, sy + 8, 30, 16, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (wx) this.drawWeather(wx, amb, cx, cy, dt);
  },

  // Each region's air, in code: falling leaves, cave dark, desert heat, snow, swamp fog, the night over the ruins.
  drawWeather: function (wx, amb, cx, cy, dt) {
    var g = CC.g, t = CC.time, W = CC.W, H = CC.H, self = this, map = this.map;
    var pxl = this.screenX(this.px + 8), pyl = this.screenY(this.py + 6);
    var glowAt = function (x, y, r, col, a) {
      var grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, col.replace(')', ',' + a + ')').replace('rgb', 'rgba')); grd.addColorStop(1, col.replace(')', ',0)').replace('rgb', 'rgba'));
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    var rgb = function (hex) { var n = parseInt(hex.slice(1), 16); return 'rgb(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ')'; };
    // drifting bits in screen space that wrap around and slide a little with the camera
    var bits = function (n, make) { if (!amb.bits) { amb.bits = []; for (var i = 0; i < n; i++) amb.bits.push(make(i)); } return amb.bits; };
    var wrapX = function (b) { return ((b.x - cx * (b.par || 0.6)) % (W + 20) + W + 20) % (W + 20) - 10; };
    var wrapY = function (b) { return ((b.y - cy * (b.par || 0.6)) % (H + 20) + H + 20) % (H + 20) - 10; };
    var lights = function () { (map.glows || []).forEach(function (q) {
      var x = self.screenX(q.x * T + 8), y = self.screenY(q.y * T + 8);
      if (x < -30 || y < -30 || x > W + 30 || y > H + 30) return;
      glowAt(x, y, 16 + Math.sin(t * 2 + q.x) * 3, rgb(q.c), 0.35);
    }); };
    if (wx === 'leaves') {
      bits(14, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 9), c: CC.pick(['#d8782a', '#e8a838', '#8ab840', '#b85a2a']) }; }).forEach(function (b) {
        b.y += dt * 14; b.x += dt * (6 + Math.sin(t + b.ph) * 10);
        var x = wrapX(b), y = wrapY(b), flip = Math.sin(t * 4 + b.ph) > 0;
        g.fillStyle = b.c; g.fillRect(Math.round(x), Math.round(y), flip ? 3 : 2, flip ? 1 : 2);
      });
    } else if (wx === 'breeze') {
      bits(10, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 9), par: 1 }; }).forEach(function (b) {
        var k = (t * 0.5 + b.ph) % 3; if (k > 1) return;
        g.globalAlpha = Math.sin(k * Math.PI) * 0.6; g.fillStyle = '#ffffff';
        var x = wrapX(b), y = wrapY(b); g.fillRect(Math.round(x), Math.round(y), 1, 1); g.fillRect(Math.round(x) - 1, Math.round(y) + 1, 3, 1); g.globalAlpha = 1;
      });
      // gulls' shadows gliding over
      for (var q = 0; q < 2; q++) { var gx = (t * 22 + q * 140) % (W + 80) - 40, gy = 30 + q * 70 + Math.sin(t * 0.5 + q) * 10; g.fillStyle = 'rgba(20,40,60,0.18)'; g.fillRect(gx - 3, gy, 3, 1); g.fillRect(gx + 1, gy, 3, 1); g.fillRect(gx, gy + 1, 1, 1); }
    } else if (wx === 'cave') {
      lights();
      bits(6, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 5), par: 1 }; }).forEach(function (b) { // water drips
        var k = (t * 0.6 + b.ph) % 2.5; if (k > 1) return;
        var x = wrapX(b), y = wrapY(b) + k * 18; g.fillStyle = 'rgba(160,210,255,' + (1 - k) * 0.8 + ')'; g.fillRect(Math.round(x), Math.round(y), 1, 2);
      });
      var dark = g.createRadialGradient(pxl, pyl, 24, pxl, pyl, 120);
      dark.addColorStop(0, 'rgba(8,6,16,0)'); dark.addColorStop(1, 'rgba(8,6,16,0.62)');
      g.fillStyle = dark; g.fillRect(0, 0, W, H);
    } else if (wx === 'heat') {
      g.fillStyle = 'rgba(255,170,70,0.07)'; g.fillRect(0, 0, W, H);
      bits(24, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 9), s: CC.rand(30, 60) }; }).forEach(function (b) {
        b.x += dt * b.s; b.y += Math.sin(t * 2 + b.ph) * dt * 4;
        g.fillStyle = 'rgba(230,190,120,0.7)'; g.fillRect(Math.round(wrapX(b)), Math.round(wrapY(b)), 2, 1);
      });
      for (var hy = 0; hy < 3; hy++) { // shimmer bands
        var by = (t * 10 + hy * 55) % (H + 20) - 10; g.fillStyle = 'rgba(255,240,200,0.05)'; g.fillRect(0, by, W, 3 + Math.sin(t * 3 + hy) * 1.5);
      }
    } else if (wx === 'snow') {
      g.fillStyle = 'rgba(200,220,255,0.07)'; g.fillRect(0, 0, W, H);
      bits(46, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 9), s: CC.rand(12, 26), z: Math.random() < 0.3 }; }).forEach(function (b) {
        b.y += dt * b.s; b.x += dt * (Math.sin(t * 1.3 + b.ph) * 8 - 4);
        g.fillStyle = b.z ? '#ffffff' : 'rgba(255,255,255,0.75)'; g.fillRect(Math.round(wrapX(b)), Math.round(wrapY(b)), b.z ? 2 : 1, b.z ? 2 : 1);
      });
    } else if (wx === 'fog') {
      for (var f = 0; f < 4; f++) {
        var fx = ((t * (5 + f * 2) + f * 90) % (W + 160)) - 80, fy = 20 + f * 38 + Math.sin(t * 0.4 + f) * 8;
        g.fillStyle = 'rgba(200,220,190,0.08)'; g.beginPath(); g.ellipse(fx, fy, 90, 12, 0, 0, Math.PI * 2); g.ellipse(fx + 40, fy + 6, 60, 9, 0, 0, Math.PI * 2); g.fill();
      }
      this.fireflies(amb, '#d8f070', cx, cy, dt);
      g.fillStyle = 'rgba(30,50,30,0.12)'; g.fillRect(0, 0, W, H);
    } else if (wx === 'night') {
      var nd = g.createRadialGradient(pxl, pyl, 30, pxl, pyl, 150);
      nd.addColorStop(0, 'rgba(14,14,50,0.12)'); nd.addColorStop(1, 'rgba(10,10,40,0.5)');
      g.fillStyle = nd; g.fillRect(0, 0, W, H);
      lights();
      this.fireflies(amb, '#9ad0ff', cx, cy, dt);
    } else if (wx === 'spire') {
      for (var m = 0; m < 3; m++) { // moonbeams through the windows
        var mx = 40 + m * 80 + Math.sin(t * 0.3 + m) * 6, grd = g.createLinearGradient(mx, 0, mx + 30, H);
        grd.addColorStop(0, 'rgba(200,230,255,0.16)'); grd.addColorStop(1, 'rgba(200,230,255,0)');
        g.fillStyle = grd; g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx + 14, 0); g.lineTo(mx + 44, H); g.lineTo(mx + 22, H); g.fill();
      }
      lights();
      bits(18, function () { return { x: CC.rand(0, W), y: CC.rand(0, H), ph: CC.rand(0, 9), par: 0.3 }; }).forEach(function (b) {
        b.y -= dt * 6; var tw = Math.sin(t * 3 + b.ph) > 0.3;
        g.fillStyle = tw ? '#ffffff' : '#a8d8ff'; g.fillRect(Math.round(wrapX(b)), Math.round(wrapY(b)), 1, tw ? 2 : 1);
      });
    }
  },
  fireflies: function (amb, col, cx, cy, dt) {
    var g = CC.g, t = CC.time, map = this.map;
    if (!amb.ff) { amb.ff = []; var W = map.rows[0].length * T, H = map.rows.length * T; for (var i = 0; i < 14; i++) amb.ff.push({ x: CC.rand(16, W - 16), y: CC.rand(16, H - 16), ph: CC.rand(0, 9) }); }
    amb.ff.forEach(function (f) {
      f.x += Math.sin(t * 0.6 + f.ph) * dt * 8; f.y += Math.cos(t * 0.5 + f.ph * 2) * dt * 6;
      var a = 0.5 + Math.sin(t * 2.5 + f.ph) * 0.5, x = Math.round(f.x - cx), y = Math.round(f.y - cy);
      if (x < -6 || y < -6 || x > CC.W + 6 || y > CC.H + 6) return;
      g.globalAlpha = a * 0.35; g.fillStyle = col; g.fillRect(x - 2, y - 2, 5, 5);
      g.globalAlpha = a; g.fillRect(x, y, 1, 1); g.globalAlpha = 1;
    });
  },

  // Rooms: a warm lamp-lit vignette, and fireplaces that flicker
  drawIndoorLight: function (cx, cy) {
    var g = CC.g;
    (this.map.decor || []).forEach(function (d) {
      if (!d.glow) return;
      var fx = d.x * T + 8 - cx, fy = (d.y + 1) * T - 8 - cy, r = 30 + Math.sin(CC.time * 9) * 2 + Math.sin(CC.time * 23) * 1.5;
      var grd = g.createRadialGradient(fx, fy, 0, fx, fy, r);
      grd.addColorStop(0, 'rgba(255,170,80,0.28)'); grd.addColorStop(1, 'rgba(255,140,60,0)');
      g.fillStyle = grd; g.fillRect(fx - r, fy - r, r * 2, r * 2);
      if (Math.random() < 0.2) CC.fx.add({ x: fx + CC.rand(-3, 3), y: fy - 4, vx: CC.rand(-4, 4), vy: -CC.rand(10, 20), life: 0.6, kind: 'star', color: '#ffb040', size: 1.5 });
    });
    var w = this.map.rows[0].length * T, h = this.map.rows.length * T, mx = w / 2 - cx, my = h / 2 - cy;
    var v = g.createRadialGradient(mx, my, 30, mx, my, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(255,220,160,0.06)'); v.addColorStop(1, 'rgba(40,20,10,0.35)');
    g.fillStyle = v; g.fillRect(0, 0, CC.W, CC.H);
  },

  // The player walks with the walk-sheet art; everyone else is their character art with a little life added
  // in code (breathing, a hop when you talk to them). Without art, the code-drawn people stand in.
  drawPerson: function (npc, dir, x, y, frame) {
    var g = CC.g, fx = this.screenX(x) + 8, fy = this.screenY(y) + 15;
    if (fx < -30 || fy < -10 || fx > CC.W + 30 || fy > CC.H + 40) return;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(fx, fy, 6, 2, 0, 0, Math.PI * 2); g.fill();
    if (npc && npc.creature) { // a creature standing on the map, glowing softly
      var gr = g.createRadialGradient(fx, fy - 10, 0, fx, fy - 10, 22);
      gr.addColorStop(0, 'rgba(220,235,255,' + (0.35 + Math.sin(CC.time * 2) * 0.1) + ')'); gr.addColorStop(1, 'rgba(220,235,255,0)');
      g.fillStyle = gr; g.fillRect(fx - 22, fy - 32, 44, 44);
      CC.drawSprite(CC.creatureSprite(npc.creature), fx, fy - 2 - Math.abs(Math.sin(CC.time * 1.5)) * 2, { scale: 0.42, sy: 1 + Math.sin(CC.time * 2.4) * 0.03, id: npc.creature });
      return;
    }
    // frame here is the walk phase: 0 to 3 while walking, 1 when standing
    var key = CC.walkKey(npc), sheet = key && CC.img('walk/' + key);
    var art = npc && npc.art && CC.img('people/' + npc.art);
    if (sheet) {
      CC.drawWalker(g, sheet, key, dir, frame, !!(npc ? npc.mv : this.moving), fx, fy);
    } else if (art) {
      var hgt = npc.h || 26, kk = hgt / art.height;
      var hop = npc.hop ? Math.max(0, 1 - (CC.time - npc.hop) / 0.35) : 0;
      var breathe = 1 + Math.sin(CC.time * 2.2 + npc.x * 1.7) * 0.018;
      // people without a walk sheet step with a little bounce and sway, facing the way they go
      var step = npc.mv ? Math.abs(Math.sin(npc.mv.k * Math.PI * 2)) * 1.5 : 0, sway = npc.mv ? Math.sin(npc.mv.k * Math.PI * 2) * 0.05 : 0;
      g.save(); g.translate(Math.round(fx), Math.round(fy - Math.sin(hop * Math.PI) * 4 - step));
      if (sway) g.rotate(sway);
      var shift = npc.mv ? npc.dir === 'left' : hop ? npc.flip : Math.sin(CC.time * 0.35 + npc.x * 2.3 + npc.y) > 0.55;
      if (shift) g.scale(-1, 1);
      g.drawImage(art, -art.width * kk / 2, -art.height * kk * breathe, art.width * kk, art.height * kk * breathe);
      g.restore();
    } else {
      var code = CC.person(npc ? npc.look : 'player', dir, [0, 1, 2, 1][frame] === 1 ? 0 : 1);
      g.drawImage(code, Math.round(fx - 12), Math.round(fy - 23));
    }
    // standing in tall grass hides the feet
    var tx = Math.round(x / T), ty = Math.round(y / T), pic = this.map.picture;
    if (CC.tileAt(this.map, tx, ty) === ',') {
      g.drawImage(pic, tx * TP, ty * TP + TP / 2, TP, TP / 2, this.screenX(tx * T), this.screenY(ty * T + 8), T, 8);
    }
  },
};
CC.DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

CC.useExit = async function (ex, nx) {
  var dest = CC.MAPS[ex.to];
  if (CC.MAPS[CC.world.mapId].indoors) CC.sfx('back');
  await CC.fade(0.25, true);
  var x = ex.fixedX ? ex.tx0 : ex.tx0 + (nx - ex.x0);
  CC.world.enter(ex.to, x, ex.ty, ex.side === 'top' ? 'up' : 'down');
  CC.world.cooldown = 2;
  await CC.fade(0.25, false);
  return dest;
};

// walking into a building: the room behind its door
CC.enterRoom = async function (roomId) {
  var r = CC.MAPS[roomId];
  CC.sfx('select');
  await CC.fade(0.25, true);
  CC.world.enter(roomId, r.inside[0], r.inside[1], 'up');
  await CC.fade(0.25, false);
};
// furniture you can look at (talk: a line to say, or 'vault' / 'bed')
CC.useFurniture = async function (d) {
  if (d.talk === 'vault') {
    if (!CC.state.party.length) { await CC.say('The Cube Vault. It stores the creatures you catch once your party of 4 is full.'); return; }
    await CC.say('You switched on the Cube Vault.'); CC.sfx('select'); await CC.vaultScreen(); return;
  }
  if (d.talk === 'bed') {
    if (await CC.yesNo('Your bed. Take a rest?')) {
      await CC.fade(0.4, true); CC.healParty(); CC.sfx('heal'); await CC.sleep(1); CC.unfade();
      CC.state.lastHeal = { map: 'home-in', x: 2, y: 3 };
      await CC.say('You feel rested. Your creatures are healed!');
    }
    return;
  }
  await CC.say(d.talk);
};

// A screen-wide fade. Fading to black leaves the black layer up (it blocks input) until a fade back
// or CC.unfade() takes it away.
CC.fade = function (sec, toBlack) {
  var scr = CC.fadeScreen;
  if (!scr) {
    scr = CC.fadeScreen = { name: 'fade', k: toBlack ? 0 : 1, update: function () {}, draw: function () { CC.g.globalAlpha = scr.k; CC.rect(0, 0, CC.W, CC.H, '#000'); CC.g.globalAlpha = 1; } };
    CC.push(scr);
  }
  var from = scr.k, to = toBlack ? 1 : 0;
  return CC.tween(sec, function (t) { scr.k = CC.lerp(from, to, t); }).then(function () { if (!toBlack) CC.unfade(); });
};
CC.unfade = function () { if (CC.fadeScreen) { CC.pop(CC.fadeScreen); CC.fadeScreen = null; } };

// ---------- wild encounters: the grass shakes, the creature hops out, then the battle ----------
CC.rollSpawn = function (key) {
  var sp = CC.SPAWNS[key];
  var r = Math.random() * 100, tier = r < 60 ? 'common' : r < 90 ? 'uncommon' : 'rare';
  if (!sp[tier].length) tier = 'common';
  return { id: CC.pick(sp[tier]), lv: CC.randi(sp.levels[0], sp.levels[1]) };
};
// the bits that fly up from a region's hiding spots
CC.rustleColors = function (map) {
  var lg = map.legend && CC.LEGENDS[map.legend];
  return (lg && lg.rustle) || ['#5ab848', '#90e070', '#2f7a2a'];
};
CC.wildEncounter = async function (key) {
  var w = CC.world, s = CC.state, roll = CC.rollSpawn(key);
  w.cooldown = 3;
  // where it jumps from: the tall grass in front of you if there is some, else your own patch
  var d = CC.DIRS[s.dir], hx = s.x + d[0], hy = s.y + d[1];
  if (CC.tileAt(w.map, hx, hy) !== ',') { hx = s.x; hy = s.y; }
  CC.sfx('rustle');
  w.grassFx = { x: hx, y: hy, t: CC.time };
  var rc = CC.rustleColors(w.map);
  for (var i = 0; i < 10; i++) CC.fx.add({ x: w.screenX(hx * T + 8), y: w.screenY(hy * T + 10), vx: CC.rand(-40, 40), vy: CC.rand(-60, -20), life: 0.5, kind: 'grass', color: CC.pick(rc), size: 4, grav: 160, spin: 8 });
  w.emote = true; CC.sfx('encounter');
  await CC.sleep(0.35);
  // about 1 in 160 wild creatures is shiny (the SHINY code makes the next one shiny)
  var shiny = CC.dev.shinyNext || Math.random() < 1 / 160;
  CC.dev.shinyNext = false;
  w.hop = { id: roll.id, x: hx, y: hy, k: 0, shiny: shiny };
  await CC.tween(0.45, function (k) { w.hop.k = k; });
  w.grassFx = null;
  await CC.sleep(0.25);
  w.emote = false;
  await CC.battleTransition();
  w.hop = null;
  var wild = CC.mon.make(roll.id, roll.lv);
  if (shiny) wild.shiny = true;
  await CC.startBattle({ wild: wild });
};

// bars sweep in from both sides, flashing, then the battle starts
CC.battleTransition = function () {
  var k = 0;
  var scr = {
    update: function () {},
    draw: function () {
      var flash = k < 0.3 && Math.floor(k * 20) % 2;
      if (flash) { CC.g.globalAlpha = 0.6; CC.rect(0, 0, CC.W, CC.H, '#ffffff'); CC.g.globalAlpha = 1; }
      var kk = CC.clamp((k - 0.3) / 0.7, 0, 1);
      for (var i = 0; i < 10; i++) {
        var w = CC.W * CC.ease(CC.clamp(kk * 1.6 - i * 0.06, 0, 1));
        CC.rect(i % 2 ? CC.W - w : 0, i * 16, w, 16, '#1e1626');
      }
    },
  };
  CC.push(scr);
  return CC.tween(0.9, function (t) { k = t; }).then(function () { CC.pop(scr); });
};

// ---------- the field menu ----------
// menu icons from ui/menu-icon-1 to 8 (the polish pack) when they're there
var MENU_ICON = { Party: 1, Bag: 2, Log: 3, Vault: 4, Fly: 5, Save: 6, Options: 7, Close: 8 };
CC.fieldMenu = async function () {
  var start = 0;
  while (true) {
    var items = ['Party', 'Bag', 'Log'];
    if (CC.state.flags.vaultKey) items.push('Vault');
    if (CC.state.flags.fly && !CC.MAPS[CC.state.map].indoors) items.push('Fly');
    items.push('Save', 'Options', 'Close');
    var hasIcons = !!CC.img('ui/menu-icon-1');
    var c = await CC.menu(items.map(function (it) { return hasIcons ? { label: it, icon: 'ui/menu-icon-' + MENU_ICON[it] } : it; }),
      { x: hasIcons ? 146 : 158, y: 6, w: hasIcons ? 90 : 76, startCloses: true, start: start });
    var pick = items[c];
    if (c < 0 || pick === 'Close') return;
    start = c;
    if (pick === 'Party') await CC.partyScreen('field');
    if (pick === 'Bag') await CC.bagScreen();
    if (pick === 'Log') await CC.creatureLog();
    if (pick === 'Vault') await CC.vaultScreen();
    if (pick === 'Options') await CC.optionsScreen();
    if (pick === 'Fly') { await CC.flyScreen(); return; }
    if (pick === 'Save') {
      var seen = Object.keys(CC.state.seen).length, caught = Object.keys(CC.state.caught).length;
      if (await CC.yesNo('Save to File ' + CC.slot + '? (Creature Log: ' + caught + ' caught, ' + seen + ' seen. Coins: ' + CC.state.coins + '.)')) {
        if (CC.saveGame()) { CC.sfx('select'); await CC.say('Your game is saved.'); } else await CC.say('This browser won\'t let the game save, sorry.');
      }
    }
  }
};
