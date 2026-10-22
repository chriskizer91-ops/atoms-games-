// The overworld: maps, code-drawn tiles, walking, tall-grass encounters, doors, people, the field menu.
var CC = window.CC || (window.CC = {});

// Tiles: . grass  , tall grass  : path  T tree  ~ water  * flowers  o rock  S sign  = fallen log (a gate)
CC.MAPS = {
  village: {
    name: 'Home Village',
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
    name: 'Meadow Path', spawns: 'meadow',
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
    name: 'Grassland', spawns: 'grassland',
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

// ---------- drawing tiles into a map picture ----------
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

CC.buildMapPicture = function (id) {
  var map = CC.MAPS[id], w = map.rows[0].length, h = map.rows.length;
  var cv = CC.makeCanvas(w * T, h * T), g = cv.getContext('2d');
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) drawTile(g, CC.tileAt(map, x, y), x, y, map);
  map.buildings.forEach(function (b) { drawBuilding(g, b); });
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
      n.dir = back[s.dir];
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
    var g = CC.g, cx = Math.round(this.camX()), cy = Math.round(this.camY()), s = CC.state, self = this;
    CC.rect(0, 0, CC.W, CC.H, '#2a6e34');
    g.drawImage(this.map.picture, -cx, -cy);
    // water shimmer
    var rows = this.map.rows;
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (var y = Math.max(0, Math.floor(cy / T)); y < Math.min(rows.length, Math.ceil((cy + CC.H) / T)); y++) {
      for (var x = Math.max(0, Math.floor(cx / T)); x < Math.min(rows[0].length, Math.ceil((cx + CC.W) / T)); x++) {
        if (rows[y][x] === '~') { var ph = Math.floor((CC.time * 2 + hash(x, y) * 4) % 4); g.fillRect(x * T - cx + 3 + ph * 2, y * T - cy + 7, 3, 1); }
      }
    }
    // people, sorted by y
    var who = this.npcs.filter(function (n) { return !n.when || n.when(); }).map(function (n) {
      return { y: n.y * T, draw: function () { self.drawPerson(n.look, n.dir || 'down', n.x * T, n.y * T, n.walk ? Math.floor(CC.time * 4) % 2 : 0, n); } };
    });
    var step = this.moving ? Math.floor(this.stepAnim * 2) % 2 : 0;
    who.push({ y: this.py, draw: function () { self.drawPerson('player', s.dir, self.px, self.py, step, null); } });
    who.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
    // a creature hopping out of the grass
    if (this.hop) {
      var h = this.hop, k = CC.clamp(h.k, 0, 1), arc = Math.sin(k * Math.PI) * 18;
      var hx = this.screenX(h.x * T + 8), hy = this.screenY(h.y * T + 14);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(hx, hy, 6, 2, 0, 0, Math.PI * 2); g.fill();
      CC.drawSprite(CC.creatureSprite(h.id), hx, hy - arc, { scale: 0.32 + k * 0.08, sy: 1 + Math.sin(CC.time * 20) * 0.08 * (1 - k), id: h.id });
    }
    if (this.emote) {
      var ex = this.screenX(this.px + 8), ey = this.screenY(this.py - 14);
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

  drawPerson: function (look, dir, x, y, step, npc) {
    var sx = this.screenX(x) - 4, sy = this.screenY(y) - 10;
    if (sx < -24 || sy < -24 || sx > CC.W || sy > CC.H) return;
    var g = CC.g;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(sx + 12, sy + 23, 6, 2, 0, 0, Math.PI * 2); g.fill();
    var bob = npc && !npc.walk ? Math.round(Math.sin(CC.time * 2 + (npc.x || 0)) * 0.5) : 0;
    g.drawImage(CC.person(look, dir, step), sx, sy + bob);
    // standing in tall grass hides the feet
    var tx = Math.round(x / T), ty = Math.round(y / T);
    if (CC.tileAt(this.map, tx, ty) === ',') {
      g.drawImage(this.map.picture, tx * T, ty * T + 8, T, 8, this.screenX(tx * T), this.screenY(ty * T + 8), T, 8);
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

// a screen-wide fade
CC.fade = function (sec, toBlack) {
  var k = toBlack ? 0 : 1;
  var scr = { draw: function () { CC.g.globalAlpha = k; CC.rect(0, 0, CC.W, CC.H, '#000'); CC.g.globalAlpha = 1; }, update: function () {} };
  CC.push(scr);
  return CC.tween(sec, function (t) { k = toBlack ? t : 1 - t; }).then(function () { if (!toBlack) CC.pop(scr); else CC.fadeScreen = scr; });
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
