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
    name: 'Meadow Path', spawns: 'meadow', pines: 0.25,
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
    name: 'Grassland', spawns: 'grassland', pines: 0.3,
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

var SOLID = { T: 1, '~': 1, o: 1, S: 1, '=': 1 };
var T = 16;

function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

CC.tileAt = function (map, x, y) {
  if (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[0].length) return null;
  var t = map.rows[y][x];
  if (t === '=' && CC.state.flags.logCleared) return ':';
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
      if (hash(i, x + y * 7 + s[0] * 3) < 0.3) {
        g.fillStyle = 'rgba(30,90,30,0.7)';
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

function drawArtTile(g, t, x, y, map) {
  var ts = TILESET[map.tileset || 'grass'], px = x * TP, py = y * TP, r = hash(x, y);
  var grass = function () { return variedTile(g, ts.atlas, ts.grass, x, y); };
  switch (t) {
    case '.': return grass();
    case '*': return atlasTile(g, ts.atlas, ts.flowers[Math.floor(r * ts.flowers.length)], px, py);
    case ',': return variedTile(g, TILESET.grass.atlas, TILESET.grass.tall, x, y);
    case ':': drawDirt(g, x, y, map, ts); return true;
    case '=': drawDirt(g, x, y, map, ts);
      if (!CC.state.flags.logCleared) atlasTile(g, 'forest', 5, px, py);
      return true;
    case '~': return drawWater(g, x, y, map);
    case 'o': grass(); return atlasTile(g, TILESET.grass.atlas, TILESET.grass.rock, px, py);
    case 'T': return grass(); // trees come in their own pass so they overlap
    case 'S': grass(); return standOnTile(g, CC.img('props/village-props-11') || CC.img('props/village-props-1'), x, y, 15);
  }
  return false;
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
  hut: { art: 'healing-hut', door: 0.5 }, outpost: { art: 'healing-hut', door: 0.5 }, inn: { art: 'inn', door: 0.36, smoke: [0.73, 0.03] },
};
function drawBuildingArt(g, b) {
  var info = BUILDING_ART[b.id], img = info && CC.img('buildings/' + info.art);
  if (!img) return false;
  var w = (b.w * T + (b.small ? 4 : 10)) * R, k = w / img.width, h = img.height * k;
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
  var tall = CC.img('tiles/' + TILESET.grass.atlas), ti = TILESET.grass.tall;
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
  (map.decor || []).forEach(function (d) { standOnTile(g, CC.img(d.img), d.x, d.y, d.h, d.dx, d.dy); });
  var oak = CC.img('props/trees-1'), pine = CC.img('props/trees-2');
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    if (map.rows[y][x] !== 'T') continue;
    var tree = hash(x * 5, y * 11) < (map.pines || 0.2) ? pine : oak;
    if (!standOnTile(g, tree, x, y, 22, Math.round((hash(x, y * 3) - 0.5) * 3), 3)) { g.save(); g.scale(R, R); drawTile(g, 'T', x, y, map); g.restore(); }
  }
  map.buildings.forEach(function (b) { if (!drawBuildingArt(g, b)) { g.save(); g.scale(R, R); drawBuilding(g, b); g.restore(); } });
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
    this.banner = { text: this.map.name, t: 2.2 };
  },
  refresh: function () { CC.buildMapPicture(this.mapId); },

  solidAt: function (x, y) {
    var t = CC.tileAt(this.map, x, y);
    if (t === null) return true;
    if (SOLID[t]) return true;
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
    var s = CC.state, inp = CC.input;
    s.playTime += dt;
    if (this.busy) return;
    if (this.moving) {
      var mv = this.moving, speed = inp.held.b ? 8 : 4.4;
      mv.k += dt * speed;
      this.stepAnim += dt * speed;
      if (mv.k >= 1) {
        this.moving = null; s.x = mv.tx; s.y = mv.ty; this.px = s.x * T; this.py = s.y * T;
        this.afterStep();
      } else { this.px = CC.lerp(mv.fx, mv.tx, mv.k) * T; this.py = CC.lerp(mv.fy, mv.ty, mv.k) * T; return; }
      if (this.busy) return;
    }
    if (inp.pressed.start) { CC.sfx('select'); this.run(CC.fieldMenu); return; }
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
    this.moving = { fx: s.x, fy: s.y, tx: nx, ty: ny, k: 0 };
  },

  afterStep: function () {
    var s = CC.state; s.steps++;
    if (this.cooldown > 0) this.cooldown--;
    var trig = CC.TRIGGERS[this.mapId] && CC.TRIGGERS[this.mapId](s.x, s.y);
    if (trig) { this.run(trig); return; }
    if (CC.tileAt(this.map, s.x, s.y) === ',') {
      for (var i = 0; i < 4; i++) CC.fx.add({ x: this.screenX(s.x * T + 8), y: this.screenY(s.y * T + 12), vx: CC.rand(-20, 20), vy: CC.rand(-30, -10), life: 0.3, kind: 'grass', color: '#5ab848', size: 3, grav: 120 });
      if (this.map.spawns && CC.firstHealthy() >= 0 && this.cooldown <= 0 && Math.random() < 0.12) {
        var self = this; this.run(function () { return CC.wildEncounter(self.map.spawns); });
      }
    }
  },

  interact: function () {
    var s = CC.state, d = CC.DIRS[s.dir], fx = s.x + d[0], fy = s.y + d[1];
    var n = this.npcAt(fx, fy);
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

  camX: function () { var w = this.map.rows[0].length * T; return w <= CC.W ? (w - CC.W) / 2 : CC.clamp(this.px + 8 - CC.W / 2, 0, w - CC.W); },
  camY: function () { var h = this.map.rows.length * T; return h <= CC.H ? (h - CC.H) / 2 : CC.clamp(this.py + 8 - CC.H / 2, 0, h - CC.H); },
  screenX: function (x) { return x - Math.round(this.camX()); },
  screenY: function (y) { return y - Math.round(this.camY()); },

  draw: function () {
    var g = CC.g, cx = Math.round(this.camX()), cy = Math.round(this.camY()), s = CC.state, self = this, pic = this.map.picture;
    CC.rect(0, 0, CC.W, CC.H, '#2a6e34');
    g.drawImage(pic, 0, 0, pic.width, pic.height, -cx, -cy, pic.width / R, pic.height / R);
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
      return { y: n.y * T, draw: function () { self.drawPerson(n, n.dir || 'down', n.x * T, n.y * T, 1); } };
    });
    var frame = this.moving ? [0, 1, 2, 1][Math.floor(this.stepAnim * 2.2) % 4] : 1;
    who.push({ y: this.py, draw: function () { self.drawPerson(null, s.dir, self.px, self.py, frame); } });
    who.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
    // a creature hopping out of the grass
    if (this.hop) {
      var h = this.hop, k = CC.clamp(h.k, 0, 1), arc = Math.sin(k * Math.PI) * 18;
      var hx = this.screenX(h.x * T + 8), hy = this.screenY(h.y * T + 14);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(hx, hy, 6, 2, 0, 0, Math.PI * 2); g.fill();
      CC.drawSprite(CC.creatureSprite(h.id), hx, hy - arc, { scale: 0.34 + k * 0.08, sy: 1 + Math.sin(CC.time * 20) * 0.08 * (1 - k), id: h.id });
    }
    this.drawAmbient(cx, cy);
    if (this.emote) {
      var ex = this.screenX(this.px + 8), ey = this.screenY(this.py - 22) - Math.abs(Math.sin(CC.time * 10)) * 2;
      CC.rect(ex - 5, ey - 6, 11, 12, '#3a2a22'); CC.rect(ex - 4, ey - 5, 9, 10, '#ffffff');
      CC.rect(ex - 1, ey - 4, 3, 5, '#e84838'); CC.rect(ex - 1, ey + 2, 3, 2, '#e84838');
    }
    if (this.banner) { this.banner.t -= CC.dt || 0; if (this.banner.t <= 0) this.banner = null; }
    if (this.banner) {
      var a = Math.min(1, this.banner.t * 2, (2.2 - this.banner.t) * 4);
      g.globalAlpha = a; var bw = CC.textWidth(this.banner.text) + 20;
      CC.box(6, 6, bw, 20); CC.text(this.banner.text, 16, 10); g.globalAlpha = 1;
    }
  },

  // Life on the map, all in code: chimney smoke, butterflies, lantern glow, and cloud shadows drifting over.
  drawAmbient: function (cx, cy) {
    var g = CC.g, map = this.map, dt = CC.dt || 0.016, t = CC.time;
    var amb = map.amb || (map.amb = { smoke: [], flies: [] });
    if (!amb.flies.length && !map.indoors) {
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
    if (!map.indoors) {
      for (var c = 0; c < 3; c++) {
        var span = map.rows[0].length * T + 200, sx = ((t * 6 + c * 157) % span) - 100 - cx, sy = (c * 97 + 40) % (map.rows.length * T) - cy;
        g.fillStyle = 'rgba(20,40,60,0.07)';
        g.beginPath(); g.ellipse(sx, sy, 46, 22, 0, 0, Math.PI * 2); g.ellipse(sx + 30, sy + 8, 30, 16, 0, 0, Math.PI * 2); g.fill();
      }
    }
  },

  // The player walks with the walk-sheet art; everyone else is their character art with a little life added
  // in code (breathing, a hop when you talk to them). Without art, the code-drawn people stand in.
  drawPerson: function (npc, dir, x, y, frame) {
    var g = CC.g, fx = this.screenX(x) + 8, fy = this.screenY(y) + 15;
    if (fx < -30 || fy < -10 || fx > CC.W + 30 || fy > CC.H + 40) return;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(fx, fy, 6, 2, 0, 0, Math.PI * 2); g.fill();
    var sheet = !npc && CC.img('walk/' + (CC.state.look || 'player-a'));
    var art = npc && npc.art && CC.img('people/' + npc.art);
    if (sheet) {
      var cw = sheet.width / 3, ch = sheet.height / 4, row = { down: 0, left: 1, right: 2, up: 3 }[dir], k = 27 / ch;
      var bounce = this.moving && frame !== 1 ? -0.5 : 0;
      g.drawImage(sheet, frame * cw, row * ch, cw, ch, Math.round(fx - cw * k / 2), Math.round(fy - ch * k + bounce), cw * k, ch * k);
    } else if (art) {
      var hgt = npc.h || 26, kk = hgt / art.height;
      var hop = npc.hop ? Math.max(0, 1 - (CC.time - npc.hop) / 0.35) : 0;
      var breathe = 1 + Math.sin(CC.time * 2.2 + npc.x * 1.7) * 0.018;
      g.save(); g.translate(Math.round(fx), Math.round(fy - Math.sin(hop * Math.PI) * 4));
      var shift = hop ? npc.flip : Math.sin(CC.time * 0.35 + npc.x * 2.3 + npc.y) > 0.55;
      if (shift) g.scale(-1, 1);
      g.drawImage(art, -art.width * kk / 2, -art.height * kk * breathe, art.width * kk, art.height * kk * breathe);
      g.restore();
    } else {
      var code = CC.person(npc ? npc.look : 'player', dir, frame === 1 ? 0 : 1);
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
  if (ex.to === 'forest') { await CC.forestGate(); return; }
  var dest = CC.MAPS[ex.to];
  await CC.fade(0.25, true);
  var x = ex.tx0 + (nx - ex.x0);
  CC.world.enter(ex.to, x, ex.ty, ex.side === 'top' ? 'up' : 'down');
  CC.world.cooldown = 2;
  await CC.fade(0.25, false);
  return dest;
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
CC.wildEncounter = async function (key) {
  var w = CC.world, s = CC.state, roll = CC.rollSpawn(key);
  w.cooldown = 3;
  // where it jumps from: the tall grass in front of you if there is some, else your own patch
  var d = CC.DIRS[s.dir], hx = s.x + d[0], hy = s.y + d[1];
  if (CC.tileAt(w.map, hx, hy) !== ',') { hx = s.x; hy = s.y; }
  CC.sfx('rustle');
  for (var i = 0; i < 10; i++) CC.fx.add({ x: w.screenX(hx * T + 8), y: w.screenY(hy * T + 10), vx: CC.rand(-40, 40), vy: CC.rand(-60, -20), life: 0.5, kind: 'grass', color: CC.pick(['#5ab848', '#90e070', '#2f7a2a']), size: 4, grav: 160, spin: 8 });
  w.emote = true; CC.sfx('encounter');
  await CC.sleep(0.35);
  w.hop = { id: roll.id, x: hx, y: hy, k: 0 };
  await CC.tween(0.45, function (k) { w.hop.k = k; });
  await CC.sleep(0.25);
  w.emote = false;
  await CC.battleTransition();
  w.hop = null;
  await CC.startBattle({ wild: CC.mon.make(roll.id, roll.lv) });
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
CC.fieldMenu = async function () {
  while (true) {
    var items = ['Party', 'Bag'];
    if (CC.state.flags.vaultKey) items.push('Vault');
    items.push('Save', 'Close');
    var c = await CC.menu(items, { x: 158, y: 6, w: 76, startCloses: true });
    var pick = items[c];
    if (c < 0 || pick === 'Close') return;
    if (pick === 'Party') await CC.partyScreen('field');
    if (pick === 'Bag') await CC.bagScreen();
    if (pick === 'Vault') await CC.vaultScreen();
    if (pick === 'Save') {
      var seen = Object.keys(CC.state.seen).length, caught = Object.keys(CC.state.caught).length;
      if (await CC.yesNo('Save your game? (Creature Log: ' + caught + ' caught, ' + seen + ' seen. Coins: ' + CC.state.coins + '.)')) {
        if (CC.saveGame()) { CC.sfx('select'); await CC.say('Your game is saved.'); } else await CC.say('This browser won\'t let the game save, sorry.');
      }
    }
  }
};
