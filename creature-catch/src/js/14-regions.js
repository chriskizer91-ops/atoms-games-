// The rest of the world: Forest, Water, Cave, Desert, Snow, Swamp, Night Ruins and the Moonlit Spire.
// Each region is ASCII plus a legend. Letters every region shares:
//   . ground   , tall grass (or the region's hiding spot: moss, drifts, reeds)   : path   T tree or wall
//   o rock     x second obstacle   * walkable decoration   r walkable ground variant   ~ water   d dock / boardwalk
//   S sign     = gate (opened by the region's guide)   B building, D its door   L landmark (solid)
// Buildings are found from their B/D blocks (top to bottom, left to right) and named by map.buildingIds.
var CC = window.CC || (window.CC = {});

(function () {

// tiles in each region's 4 x 4 atlas (art/tiles/<atlas>.png). Each entry: i (tile numbers, picked by a hash),
// atlas (another atlas), prop (a picture standing on the ground), solid, fill (a flat color), glow.
CC.LEGENDS = {
  forest: {
    atlas: 'forest', ground: [0, 0, 8], dirtFrom: 7, grassy: true, backdrop: '#1e4a26', trees: ['props/trees-2', 'props/trees-1'], pines: 0.55,
    ',': { i: [1, 10] }, o: { i: [13] , solid: true }, x: { i: [5, 14], solid: true }, '*': { i: [6, 9, 15] }, r: { i: [0, 11] },
  },
  water: {
    atlas: 'water-shoreline', groundAtlas: 'grassland-spawn-zone', ground: [0], dirtFrom: 8, grassy: true, backdrop: '#2a6e34', trees: ['props/trees-5', 'props/trees-1'], pines: 0.5,
    ',': { atlas: 'grassland-spawn-zone', i: [1] }, o: { prop: 'props/rocks-and-bushes-1', h: 12, solid: true }, x: { prop: 'props/rocks-and-bushes-12', h: 14, solid: true },
    '*': { atlas: 'grassland-spawn-zone', i: [2, 3, 4, 5] }, d: { i: [10], noflip: true }, r: { i: [3] }, '~': { water: true },
  },
  cave: {
    rustle: ['#5ac8f0', '#3a8ee8', '#8ae0ff'],
    atlas: 'cave', ground: [0], dirtFrom: null, wall: true, backdrop: '#17141f', pathTint: 'rgba(150,140,170,0.16)',
    ',': { i: [1] }, o: { i: [9, 10], solid: true }, x: { i: [8], solid: true, glow: '#5ac8f0' }, '*': { i: [10] }, '~': { i: [11], solid: true, glow: '#3a8ee8' },
  },
  desert: {
    rustle: ['#d8b070', '#b89050', '#e8d090'],
    atlas: 'desert', ground: [0], dirtFrom: 7, tip: 'none', backdrop: '#d8b070',
    ',': { i: [4, 5, 6] }, T: { i: [11, 12], solid: true }, o: { i: [8, 9], solid: true }, x: { i: [13] }, '*': { i: [10] }, r: { i: [7] },
  },
  snow: {
    rustle: ['#ffffff', '#d8e8f8', '#b8d0e8'],
    atlas: 'snow', ground: [0], dirtFrom: null, backdrop: '#e8f0f8', trees: ['props/trees-4'], pines: 1,
    ',': { i: [13] }, o: { i: [14, 4], solid: true }, x: { i: [5], solid: true }, '*': { i: [1] }, ':': { i: [12] }, '~': { i: [2], solid: true },
  },
  swamp: {
    rustle: ['#6a8a3a', '#4a6a2a', '#8aa84a'],
    atlas: 'swamp', ground: [0, 12], dirtFrom: null, backdrop: '#2a3a22', trees: ['props/trees-6', 'props/trees-2'], pines: 0.7,
    ',': { i: [2, 3, 10], inset: 3 }, o: { i: [7, 15], solid: true }, x: { i: [11], solid: true }, '*': { i: [6] }, r: { i: [8] },
    ':': { deck: 5 }, d: { i: [5], noflip: true }, '~': { i: [1, 13, 1, 4, 9], solid: true },
  },
  ruins: {
    rustle: ['#6ab0ff', '#3a5aa8', '#9ad0ff'],
    atlas: 'night-ruins', ground: [13, 2, 13], dirtFrom: null, backdrop: '#1a1a3a',
    ',': { i: [4, 11] }, T: { i: [3, 7, 12, 15], solid: true }, o: { i: [5], solid: true }, x: { i: [10], solid: true },
    '*': { i: [1, 9], glow: '#6ab0ff' }, ':': { i: [8, 0] }, '~': { i: [6, 14], solid: true }, r: { i: [0] },
  },
  spire: {
    rustle: ['#a8d8ff', '#ffffff', '#6a9ad8'],
    atlas: 'moonlit-spire', cols: 9, ground: [0, 2, 3], dirtFrom: null, backdrop: '#20203a',
    ',': { i: [18, 19, 21] }, '*': { i: [1], glow: '#a8d8ff' }, ':': { i: [5] }, T: { i: [10, 10, 9, 11], solid: true, noflip: true },
    o: { i: [24], solid: true }, r: { i: [33, 34, 35] },
  },
};

// region maps (24 wide). Gate art goes over the '=' tiles; it opens when flags[gateFlag] is set.
var R_MAPS = {
  forest: {
    name: 'Forest', spawns: 'forest', legend: 'forest', gateArt: 'props/gate-bridge', gateFlag: 'trialForest', weather: 'leaves', signArt: 'props/signpost-forest',
    buildingIds: ['home-oakley', 'outpost-forest'], landmark: 'props/landmark-elder-tree',
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'TT.BBBB.T.::::..,,,,,.TT',
      'T..BBBB.T.::::..,,,,,,.T',
      'T..BBDB...::::..,,TT,,.T',
      'T....:::::::::...,,,,..T',
      'T.TT..*...::::....LLL*.T',
      'T.TT,,,,,.::::....LLL..T',
      'T,,,,,,,,.::::..TT..o..T',
      'T,,,,,,...::::.........T',
      'T.....::::::::..,,,,,..T',
      'T*....::....S...,,,,,,.T',
      'T..o..::...T.....,,,,..T',
      'TT....::...T..BBBB.....T',
      'T,,,..::......BBBB..x..T',
      'T,,,,.::::::..BBDB.....T',
      'T,,,,.....::::::::.....T',
      'T.....TT......::..,,,,.T',
      'T..*..TT......::..,,,,.T',
      'T.,,,,,,,.....::..,,,,.T',
      'T.,,,,,,,..o..::.......T',
      'T.........::::::..TT...T',
      'TT..*.....::......TT..TT',
      'T,,,,,....::....,,,,,..T',
      'T,,,,,,...::...,,,,,,,.T',
      'T.........::...........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  water: {
    name: 'Lakeshore', spawns: 'water', legend: 'water', gateArt: 'props/gate-boulders', gateFlag: 'trialWater', weather: 'breeze', signArt: 'props/signpost-water',
    buildingIds: ['home-gus', 'outpost-water'], landmark: 'props/landmark-lighthouse',
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'T..BBBB...::::.....,,,.T',
      'T..BBBB...::::....,,,,.T',
      'T..BBDB...::::....,,,,.T',
      'T~~~~d~~~~::::.........T',
      'T~~~~d~~~.::::..***....T',
      'T~~~~d~~..::::.........T',
      'T~~~..d...::::..,,,,...T',
      'T~~....:::::::..,,,,,..T',
      'T~~.,,,,......:..,,,,..T',
      'T~..,,,,....S.:........T',
      'T~..,,,,......::::::...T',
      'T~~.........o.:..BBBB..T',
      'T~~~..........:..BBBB..T',
      'T~~~~LL.......:..BBDB..T',
      'T~~~~LL..::::::::::::..T',
      'T~~~~~~.......:........T',
      'T~~~~~~..,,,,.:...,,,,.T',
      'T~~~~~..,,,,,.:..,,,,,.T',
      'T~~~~...,,,,,.:..,,,,..T',
      'T~~~......o...:.....x..T',
      'T~~~~...*.....:........T',
      'T~~~~~..,,,,..:..,,,,,.T',
      'T~~~~~~.,,,,,.:..,,,,,.T',
      'T~~~~~~.......:........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  cave: {
    name: 'Crystal Cave', spawns: 'cave', legend: 'cave', gateArt: 'props/gate-sandstorm', gateFlag: 'trialCave', weather: 'cave', signArt: 'props/signpost-cave',
    buildingIds: ['home-dusty', 'outpost-cave'],
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'TTTBBBB...::::...,,,,TTT',
      'TT.BBBB...::::..,,,,,,TT',
      'TT.BBDB...::::..,,,x,,TT',
      'TT...:::::::::...,,,,.TT',
      'TTT...x...::::.......TTT',
      'TTTT.....TTTTT.....,,TTT',
      'TT,,,,...TTTTT.....,,,TT',
      'TT,,,,,..::::::::...,,TT',
      'TT.,,,...:..TT..:...o.TT',
      'TTT.....::..TT..:.....TT',
      'TTTT..o.:...TT..:..S..TT',
      'TT~~....:.......:.BBBB.T',
      'TT~~..x.:.......:.BBBB.T',
      'TT.....::.......:.BBDB.T',
      'TT..,,,:..,,,,..::::::.T',
      'TTT.,,,:..,,,,..:......T',
      'TTT..::::::::::::...x.TT',
      'TT..........:.......TTTT',
      'TT.,,,,,....:..,,,,,TTTT',
      'TT.,,,,,..x.:..,,,,,,TTT',
      'TT.....o....:.....,,,TTT',
      'TTT,,,,.....:...o.....TT',
      'TTT,,,,,....:.......,,TT',
      'TTTT........::::......TT',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  desert: {
    name: 'Sunscorch Desert', spawns: 'desert', legend: 'desert', gateArt: 'props/gate-ice', gateFlag: 'trialDesert', weather: 'heat', signArt: 'props/signpost-desert',
    buildingIds: ['home-safi', 'outpost-desert'], landmark: 'props/landmark-oasis',
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'T*.BBBB...::::...,,,,..T',
      'T..BBBB...::::..,,,,,,.T',
      'T..BBDB...::::..,,,,,,.T',
      'T....:::::::::...o.....T',
      'T.o.......::::......*..T',
      'T..,,,,...::::..LLLL...T',
      'T.,,,,,,..::::..LLLL...T',
      'T.,,,,,...::::..LLLL.T.T',
      'T.....x...::::.........T',
      'T..T......::::::::.....T',
      'T,,,,.........S..:..o..T',
      'T,,,,,,.....BBBB.:.....T',
      'T,,,,,......BBBB.:..,,,T',
      'T.....rr....BBDB.:..,,,T',
      'T..o..rr..:::::::::.,,,T',
      'T.........:............T',
      'T.*..,,,,.:...T..,,,,,.T',
      'T...,,,,,.:......,,,,,.T',
      'T...,,,,..:..o...,,,,..T',
      'T.........:........x...T',
      'TT..T.....::::.........T',
      'T.,,,,,......:...,,,,..T',
      'T.,,,,,,.....:..,,,,,,.T',
      'T............:.........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  snow: {
    name: 'Frostpeak Pass', spawns: 'snow', legend: 'snow', gateArt: 'props/gate-boardwalk', gateFlag: 'trialSnow', weather: 'snow', signArt: 'props/signpost-snow',
    buildingIds: ['home-frida', 'outpost-snow'], landmark: 'props/landmark-frozen-falls',
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'TT.BBBB...::::...LLL..TT',
      'T..BBBB...::::...LLL...T',
      'T..BBDB...::::...LLL...T',
      'T....:::::::::...~~~...T',
      'T.,,,,....::::.........T',
      'T,,,,,,...::::..,,,,,..T',
      'T,,,,,....::::.,,,,,,,.T',
      'TT..o.....::::..,,,,,..T',
      'T.........::::.......o.T',
      'T..***....::::::::.....T',
      'T..***.....S....:..T...T',
      'T,,,,....BBBB...:......T',
      'T,,,,,...BBBB...:..,,,.T',
      'T,,,,,...BBDB...:.,,,,.T',
      'T.....:::::::::::.,,,,.T',
      'T.....:..........x.....T',
      'TT..o.:...,,,,,........T',
      'T.....:..,,,,,,,..T..*.T',
      'T,,,,.:..,,,,,,..,,,,..T',
      'T,,,,,:.........,,,,,,.T',
      'T,,,,.::::......,,,,,..T',
      'T........:..o..........T',
      'TT..,,,,.:....,,,,,...TT',
      'T...,,,,.:::::,,,,,....T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  swamp: {
    name: 'Murkmire Swamp', spawns: 'swamp', legend: 'swamp', gateArt: 'props/gate-runes', gateFlag: 'trialSwamp', weather: 'fog', signArt: 'props/signpost-swamp',
    buildingIds: ['home-moss', 'outpost-swamp'],
    rows: [
      'TTTTTTTTTT====TTTTTTTTTT',
      'T~~BBBB~~.::::..,,,,,..T',
      'T~~BBBB~~.::::.,,,,,,,.T',
      'T~~BBDB~~.::::..,,,,,..T',
      'T~~~~d~~~.::::.....o...T',
      'T~~~~d::::::::.........T',
      'T~,,,.....::::..~~~~...T',
      'T,,,,,,...::::.~~xx~~..T',
      'T.,,,,....::::.~~~~~~..T',
      'T....o....::::..~~~~...T',
      'T..*......::::.........T',
      'T~~.......:::::::::....T',
      'T~~~..S..........:BBBB.T',
      'T~~~~............:BBBB.T',
      'T~x~~..,,,,......:BBDB.T',
      'T~~~..,,,,,,..::::::::.T',
      'T~~...,,,,,,..:........T',
      'T.....,,,,....:..,,,,,.T',
      'T..o..........:.,,,,,,.T',
      'T,,,,....~~~~.:..,,,,..T',
      'T,,,,,..~~xx~~d.....*..T',
      'T,,,,...~~~~~.:..o.....T',
      'T........~~~..:..,,,,,.T',
      'T..,,,,.......:.,,,,,,.T',
      'T..,,,,.......:........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  ruins: {
    name: 'Night Ruins', spawns: 'ruins', legend: 'ruins', gateArt: 'props/gate-runes', gateFlag: 'trialRuins', weather: 'night', signArt: 'props/signpost-ruins',
    buildingIds: ['spire-door', 'home-corvin', 'outpost-ruins'], landmark: 'props/landmark-moon-altar',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T*...T.....LLLL..BBBB..T',
      'T....T.....LLLL..BBBB..T',
      'T..*.T.....LLLL..BBBB..T',
      'T....T.....::::..BBBB..T',
      'T..........::::..BBDB..T',
      'T.r..*.....::::....:...T',
      'T...r......::::::::::..T',
      'TTTTTTTTTT====TTTTTTTTTT',
      'T,,,BBBB..::::..,,,,,..T',
      'T,,,BBBB..::::.,,,,,,,.T',
      'T...BBDB..::::..,,,,,..T',
      'T.....::::::::.....T...T',
      'T..o......::::...*.....T',
      'T.,,,,,...::::.........T',
      'T,,,,,,...::::::::..x..T',
      'T,,,,,......S....:.....T',
      'T..T.......BBBB..:.,,,.T',
      'T..........BBBB..:,,,,.T',
      'T.*...r....BBDB..:,,,,.T',
      'T....::::::::::::::....T',
      'T,,,,:...........,,,,..T',
      'T,,,,:..o...T....,,,,,.T',
      'T,,,.:...........,,,,..T',
      'T....:::::::...........T',
      'TTTTTTTTTT::::TTTTTTTTTT',
    ],
  },
  spire: {
    name: 'Moonlit Spire', spawns: 'spire', legend: 'spire', weather: 'spire',
    rows: [
      'TTTTTTTTTTTTTTTTTT',
      'TT..*....r....*.TT',
      'T.,,,,..::..,,,,.T',
      'T.,,,,..::..,,,,.T',
      'T.......::.......T',
      'T..o....::....o..T',
      'T,,,,...::...,,,,T',
      'T,,,,..::::..,,,,T',
      'T......::::......T',
      'T*.....::::.....*T',
      'TTTTT..::::..TTTTT',
      'T,,,,..::::..,,,,T',
      'T,,,,...::...,,,,T',
      'T.......::.......T',
      'T..o....::....o..T',
      'T.,,,,..::..,,,,.T',
      'T.,,,,..::..,,,,.T',
      'T...*...::...*...T',
      'T.......::.......T',
      'TTTTTTTT::TTTTTTTT',
    ],
  },
};

// turn B/D/L blocks into buildings and the landmark, and hook up the exits between regions
var ORDER = ['grassland', 'forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'ruins'];
var BUILDING_KIND = {
  'home-oakley': 'oakley-ranger-station', 'home-gus': 'gus-dock-shack', 'home-dusty': 'dusty-mine-office', 'home-safi': 'safi-nomad-tent',
  'home-frida': 'frida-log-cabin', 'home-moss': 'granny-moss-hut', 'home-corvin': 'corvin-watchtower', 'spire-door': 'moonlit-spire', 'home-bramble': 'bramble-farmhouse',
};
function blocks(rows, letters) {
  var seen = {}, out = [];
  for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
    if (letters.indexOf(rows[y][x]) < 0 || seen[x + ',' + y]) continue;
    var stack = [[x, y]], cells = [];
    while (stack.length) {
      var c = stack.pop(), k = c[0] + ',' + c[1];
      if (seen[k] || !rows[c[1]] || letters.indexOf(rows[c[1]][c[0]]) < 0) continue;
      seen[k] = 1; cells.push(c);
      stack.push([c[0] + 1, c[1]], [c[0] - 1, c[1]], [c[0], c[1] + 1], [c[0], c[1] - 1]);
    }
    var xs = cells.map(function (c) { return c[0]; }), ys = cells.map(function (c) { return c[1]; });
    var door = cells.find(function (c) { return rows[c[1]][c[0]] === 'D'; });
    out.push({ x: Math.min.apply(null, xs), y: Math.min.apply(null, ys), w: Math.max.apply(null, xs) - Math.min.apply(null, xs) + 1, h: Math.max.apply(null, ys) - Math.min.apply(null, ys) + 1, door: door });
  }
  return out;
}
Object.keys(R_MAPS).forEach(function (key) {
  var m = R_MAPS[key];
  m.buildings = blocks(m.rows, 'BD').map(function (b, i) {
    var id = m.buildingIds[i];
    return { id: id, x: b.x, y: b.y, w: b.w, h: b.h, door: b.door, art: id.indexOf('outpost') === 0 ? 'outpost-hut' : BUILDING_KIND[id], small: true };
  });
  var lm = blocks(m.rows, 'L')[0];
  if (lm && m.landmark) m.landmarkAt = lm;
  // B, D and L draw as ground underneath the pictures
  m.rows = m.rows.map(function (r) { return r.replace(/[BDL]/g, function (c) { return c === 'L' ? 'L' : '.'; }); });
  m.exits = [];
  CC.MAPS[key] = m;
});
// the road: each region's top exit leads to the next region's bottom, and back
for (var i = 0; i < ORDER.length - 1; i++) {
  var a = CC.MAPS[ORDER[i]], b = CC.MAPS[ORDER[i + 1]];
  a.exits = a.exits.filter(function (e) { return e.side !== 'top'; });
  a.exits.push({ side: 'top', x0: 10, x1: 13, to: ORDER[i + 1], tx0: 10, ty: b.rows.length - 2 });
  b.exits.push({ side: 'bottom', x0: 10, x1: 13, to: ORDER[i], tx0: 10, ty: 1 });
}
// the Spire's exit goes back down to the Night Ruins, outside its door
CC.MAPS.spire.exits.push({ side: 'bottom', x0: 8, x1: 9, to: 'ruins', tx0: 19, ty: 6, fixedX: true });
CC.MAPS.grassland.gateFlag = 'logCleared';
CC.MAPS.grassland.gateArt = 'props/gate-log';
// Bramble's farmhouse in the Grassland (the space was opened up for it)
CC.MAPS.grassland.rows[1] = 'TT........::::....,,,,TT';
CC.MAPS.grassland.rows[2] = 'T.........::::....,,,,,T';
CC.MAPS.grassland.rows[3] = 'T.........::::...,,,,,,T';
CC.MAPS.grassland.rows[5] = 'T...::::::::::.....*...T';
CC.MAPS.grassland.buildings.push({ id: 'home-bramble', x: 2, y: 2, w: 4, h: 3, door: [4, 4], art: 'bramble-farmhouse', small: true });

// ---------- rooms: every outpost, and each guide's home ----------
var KEEPERS = {
  forest: ['Basil', 'villager-5'], water: ['Coral', 'villager-6'], cave: ['Flint', 'villager-4'], desert: ['Saffron', 'villager-7'],
  snow: ['Holly', 'villager-3'], swamp: ['Reed', 'villager-2'], ruins: ['Luna', 'villager-8'],
};
CC.KEEPERS = KEEPERS;
function outpostRoom(key) {
  var m = CC.MAPS[key], b = m.buildings.find(function (x) { return x.id === 'outpost-' + key; });
  var r = room(m.name + ' Outpost', ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'],
    [key, b.door[0], b.door[1] + 1], [
      { x: 4, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 5, y: 3, counter: true },
      { x: 7, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' }, { x: 2, y: 2, img: 'furniture/heal-5', h: 24 },
      { x: 8, y: 5, img: 'furniture/furn-5', h: 15 }, { x: 1, y: 5, img: 'furniture/heal-4', h: 18, talk: 'A soft cot for tired creatures.' },
    ]);
  CC.MAPS['outpost-in-' + key] = r;
  CC.DOORS['outpost-' + key] = 'outpost-in-' + key;
}
// a guide's home: rustic or stone furniture, and their journal with a piece of the story
var HOMES = {
  bramble: ['grassland', 'Farmer Bramble\'s Farmhouse', 'rustic', ['rustic-1', 'rustic-3', 'rustic-6', 'rustic-5']],
  oakley: ['forest', 'Ranger Station', 'rustic', ['rustic-1', 'rustic-2', 'rustic-8', 'rustic-4']],
  gus: ['water', 'Fisher Gus\'s Shack', 'rustic', ['rustic-1', 'rustic-4', 'rustic-6', 'rustic-2']],
  dusty: ['cave', 'Mine Office', 'stone', ['stone-1', 'stone-2', 'stone-3', 'stone-8']],
  safi: ['desert', 'Safi\'s Tent', 'rustic', ['rustic-1', 'rustic-8', 'rustic-6', 'rustic-7']],
  frida: ['snow', 'Frida\'s Cabin', 'rustic', ['rustic-1', 'rustic-3', 'rustic-7', 'rustic-8']],
  moss: ['swamp', 'Granny Moss\'s Hut', 'rustic', ['rustic-5', 'rustic-8', 'rustic-3', 'rustic-2']],
  corvin: ['ruins', 'Watchtower', 'stone', ['stone-6', 'stone-5', 'stone-8', 'stone-7']],
};
CC.HOMES = HOMES;
function homeRoom(id) {
  var h = HOMES[id], m = CC.MAPS[h[0]], b = m.buildings.find(function (x) { return x.id === 'home-' + id; });
  var floor = h[2] === 'stone' ? 'c' : '.';
  var rows = ['#PPPPPPPP#', '#WWwWWwWW#'].concat([0, 1, 2, 3].map(function () { return '#' + floor.repeat(8) + '#'; })).concat(['####mm####']);
  var f = h[3];
  CC.MAPS['home-in-' + id] = room(h[1], rows, [h[0], b.door[0], b.door[1] + 1], [
    { x: 1, y: 2, img: 'furniture/' + f[0], h: 22 }, { x: 4, y: 2, img: 'furniture/' + f[1], h: 22 },
    { x: 7, y: 2, img: 'furniture/' + f[2], h: 20 }, { x: 8, y: 5, img: 'furniture/' + f[3], h: 16 },
    { x: 5, y: 4, img: 'items/map', h: 9, talk: 'journal:' + id },
  ], { rug: [3, 3, 4, 2] });
  CC.DOORS['home-' + id] = 'home-in-' + id;
}
['forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'ruins'].forEach(outpostRoom);
Object.keys(HOMES).forEach(homeRoom);

// ---------- spawns past the Night Ruins ----------
CC.SPAWNS.spire = { name: 'Moonlit Spire', levels: [38, 48], common: ['boulderhound', 'timberowl', 'surgefin', 'glacistoat'], uncommon: ['prismole', 'duneserpent', 'pengarch', 'beaconwraith'], rare: ['koidrake', 'bonepanther', 'rosferatu'] };
['common', 'uncommon', 'rare'].forEach(function (t) { CC.SPAWNS.spire[t].forEach(function (id) { if (!CC.RARITY[id]) CC.RARITY[id] = t; }); });
CC.RARITY.lunarion = 'veryrare';
})();
