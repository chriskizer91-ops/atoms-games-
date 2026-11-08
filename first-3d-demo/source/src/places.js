// places.js: Home Village, the Meadow Path and the four rooms, in 3D, built from Creature Catch's own maps (CC.MAPS: the
// same rows, buildings, decorations, doors and exits). The look follows What the Map Forgot in 3D's Farwick: a painted
// ground with pixel-ragged edges between grass and path, chunky cel-shaded houses with tiled roofs, leafy trees made of
// lumps, ink outlines on everything, and the ground falling away into pools.
// Units are the game's pixels: one tile is 16; x across the map, z down it, y up.
const PLACES = (() => {
  'use strict';
  const T = 16, { rgb, PI, TAU } = KIT;
  // ---------- the maps, as Creature Catch has them ----------
  const MAPS = {
    village: {
      name: 'Home Village', outdoor: true, pines: .15, music: 'village',
      decor: [
        { x: 9, y: 6, k: 'lamp' }, { x: 12, y: 6, k: 'lamp' }, { x: 19, y: 4, k: 'barrel' }, { x: 14, y: 3, k: 'crates' },
        { x: 6, y: 11, k: 'mailbox' }, { x: 7, y: 9, k: 'hay' }, { x: 12, y: 13, k: 'bench' }, { x: 19, y: 11, k: 'pots' },
        { x: 8, y: 3, k: 'barrow' }, { x: 1, y: 8, k: 'flowerbush' }, { x: 20, y: 9, k: 'berrybush' },
        { x: 9, y: 14, k: 'lily', solid: false }, { x: 13, y: 14, k: 'lily', solid: false },
        { x: 27, y: 9, k: 'lamp' }, { x: 21, y: 10, k: 'barrel' }, { x: 27, y: 3, k: 'bush' }, { x: 26, y: 10, k: 'bench' },
      ],
      rows: [
        'TTTTTTTTTT::TTTTTTTTTTTTTTTTTT',
        'TT*.......::.......*TTT...*.TT',
        'T.........::.........TT......T',
        'T.........::.................T',
        'T.........::.................T',
        'T...::::::::::::::...........T',
        'T*........::........*........T',
        'T.....S...::...o.............T',
        'T.........::.................T',
        'T.........::.................T',
        'T.........::...........:.....T',
        'T.........::...........:.....T',
        'T...::::::::::::::::::::.....T',
        'T*.....*......*.....*...*...*T',
        'TT.....~~~~~~~~.....TT.......T',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      buildings: [
        { id: 'willow', x: 2, y: 2, w: 5, h: 3, door: [4, 4], kind: 'willow' },
        { id: 'shop', x: 15, y: 2, w: 4, h: 3, door: [17, 4], kind: 'shop' },
        { id: 'home', x: 2, y: 9, w: 4, h: 3, door: [4, 11], kind: 'home' },
        { id: 'hut', x: 15, y: 9, w: 4, h: 3, door: [17, 11], kind: 'hut' },
        { id: 'inn', x: 22, y: 7, w: 4, h: 3, door: [23, 9], kind: 'inn' },
      ],
      exits: [{ side: 'top', x0: 10, x1: 11, to: 'meadow', tx0: 7, ty: 17 }],
      signs: { '6,7': 'Home Village. Elder Willow: top left. Pip\'s Cube Shop: top middle. Healing Hut: bottom middle. The Inn: east. Meadow Path: north.' },
    },
    meadow: {
      name: 'Meadow Path', outdoor: true, pines: .25, spawns: 'meadow', music: 'route',
      decor: [{ x: 13, y: 4, k: 'bush' }, { x: 2, y: 9, k: 'flowerbush' }, { x: 13, y: 8, k: 'rock' }],
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
      exits: [{ side: 'bottom', x0: 7, x1: 8, to: 'village', tx0: 10, ty: 1 }, { side: 'top', x0: 6, x1: 9, to: 'grassland', tx0: 10, ty: 20 }],
      signs: { '12,13': 'Meadow Path. The gentle creatures here are Normal types: fair training for every starter.' },
    },
    grassland: {
      name: 'Grassland', outdoor: true, pines: .3, spawns: 'grassland', music: 'route',
      decor: [{ x: 21, y: 10, k: 'barrel' }, { x: 22, y: 10, k: 'crates' }, { x: 7, y: 4, k: 'bush' }, { x: 17, y: 5, k: 'flowerbush' }, { x: 5, y: 10, k: 'berrybush' }, { x: 6, y: 4, k: 'hay' }, { x: 1, y: 3, k: 'barrow' }],
      rows: [
        'TTTTTTTTTT====TTTTTTTTTT',
        'TT........::::....,,,,TT',
        'T.........::::....,,,,,T',
        'T.........::::...,,,,,,T',
        'T.........::::.........T',
        'T...::::::::::.....*...T',
        'T,,,,.....::::.....,,,,T',
        'T,,,,,,...::::...,,,,,,T',
        'T,,,,,,...::::...,,,,,,T',
        'T.........::::.........T',
        'T...*.....::::.........T',
        'T.........::::.........T',
        'T,,,,,....::::::::::::::',
        'T,,,,,,...::::........::',
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
        { id: 'outpost', x: 16, y: 9, w: 4, h: 3, door: [18, 11], kind: 'hut' },
        { id: 'barn', x: 2, y: 2, w: 4, h: 3, door: [4, 4], kind: 'barn' },
      ],
      exits: [{ side: 'bottom', x0: 10, x1: 13, to: 'meadow', tx0: 6, ty: 1 }, { side: 'top', x0: 10, x1: 13, to: 'forest' }, { side: 'right', y0: 12, y1: 13, to: 'orchard' }],
      signs: { '18,14': 'Grassland. Grassland Outpost: just north. The Forest: north, past the fallen log. Willowbrook Orchard: east.' },
    },
  };
  // rooms: # beyond the walls, P the wall's top, W plaster wall, w wall with a window, . wood floor, c checker floor, m doormat
  const room = (name, rows, door, decor, extra) => {
    const r = Object.assign({ name, indoors: true, rows, decor: decor || [], buildings: [], music: 'village' }, extra || {});
    const my = rows.length - 1, mx = rows[my].indexOf('m');
    r.exits = [{ side: 'bottom', x0: mx, x1: rows[my].lastIndexOf('m'), to: door[0], tx0: door[1], ty: door[2], fixedX: true }];
    r.inside = [mx, my - 1];
    return r;
  };
  MAPS['willow-in'] = room('Elder Willow\'s House', ['#PPPPPPPPPP#', '#WWwWWWWwWW#', '#..........#', '#..........#', '#..........#', '#..........#', '#..........#', '#####mm#####'], ['village', 4, 5], [
    { x: 2, y: 2, k: 'bookshelf', talk: 'Old books on creatures. One is titled "The Long Dusk".' },
    { x: 8, y: 2, k: 'fireplace' }, { x: 10, y: 2, k: 'clock', talk: 'Tick, tock. The clock is a little fast.' },
    { x: 1, y: 6, k: 'plant' }, { x: 5, y: 4, k: 'starterTable', dx: 8, counter: true }, { x: 6, y: 4, counter: true },
  ], { rug: [4, 3, 4, 3] });
  MAPS['hut-in'] = room('Healing Hut', ['#PPPPPPPPPP#', '#WWWwWWwWWW#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#####mm#####'], ['village', 17, 12], [
    { x: 5, y: 3, k: 'healCounter', dx: 8, counter: true }, { x: 6, y: 3, counter: true },
    { x: 8, y: 2, k: 'healMachine', talk: 'The healing machine hums softly.' },
    { x: 10, y: 2, k: 'vault', talk: 'The Cube Vault. It stores the creatures you catch once your party of 4 is full.' },
    { x: 2, y: 2, k: 'herbShelf', talk: 'Jars of dried herbs: moonleaf, sunpetal, bitterroot.' },
    { x: 1, y: 5, k: 'cot', talk: 'A soft cot. Creatures rest here after a long day.' }, { x: 10, y: 6, k: 'plant' },
  ]);
  MAPS['shop-in'] = room('Pip\'s Cube Shop', ['#PPPPPPPP#', '#WwWWWWwW#', '#........#', '#........#', '#........#', '#........#', '####mm####'], ['village', 17, 5], [
    { x: 4, y: 3, k: 'shopCounter', dx: 8, counter: true }, { x: 5, y: 3, counter: true },
    { x: 1, y: 2, k: 'cubeShelf', talk: 'Shelves of cubes, stacked in neat purple-and-blue rows.' }, { x: 7, y: 2, k: 'cubeShelf' }, { x: 8, y: 2, k: 'cubeShelf' },
    { x: 8, y: 5, k: 'plant' },
  ], { rug: [3, 4, 4, 1] });
  MAPS['home-in'] = room('Your House', ['#PPPPPPPP#', '#WWwWWwWW#', '#........#', '#........#', '#........#', '#........#', '####mm####'], ['village', 4, 12], [
    { x: 1, y: 2, k: 'bed', talk: 'bed' }, { x: 3, y: 2, k: 'dresser', talk: 'Your clothes, folded. Mostly.' },
    { x: 7, y: 2, k: 'stove', talk: 'Something good was cooked here this morning.' },
    { x: 5, y: 4, k: 'table', dx: 8 }, { x: 6, y: 4 }, { x: 8, y: 5, k: 'plant' },
  ], { rug: [4, 3, 4, 3] });
  MAPS['outpost-in'] = room('Grassland Outpost', ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'], ['grassland', 18, 12], [
    { x: 4, y: 3, k: 'healCounter', dx: 8, counter: true }, { x: 5, y: 3, counter: true },
    { x: 7, y: 2, k: 'vault', talk: 'The Cube Vault. Every Healing Hut has one, all linked together.' },
    { x: 2, y: 2, k: 'herbShelf', talk: 'Bundles of grassland herbs drying on the shelf.' }, { x: 8, y: 5, k: 'plant' },
  ]);
  MAPS['inn-in'] = room('Rosa\'s Inn', ['#PPPPPPPPPP#', '#WWwWWWWwWW#', '#..........#', '#..........#', '#..........#', '#..........#', '#..........#', '#####mm#####'], ['village', 23, 10], [
    { x: 5, y: 3, k: 'shopCounter', dx: 8, counter: true }, { x: 6, y: 3, counter: true },
    { x: 1, y: 2, k: 'fireplace', talk: 'The hearth crackles. Something tasty is roasting.' },
    { x: 3, y: 2, k: 'piano', talk: 'You plink out a little tune on the piano. Rosa hums along.' },
    { x: 10, y: 2, k: 'stairs', talk: 'Stairs up to the guest rooms. Rosa keeps them spotless.' },
    { x: 8, y: 2, k: 'board', talk: 'The notice board: "Boat to Lantern Isle: ask Fisher Gus." "Copperbell Bakery: Copper Rolls, fresh daily!" "Lost: one Puffmunk\'s stash. Finder keeps it."' },
    { x: 2, y: 5, k: 'table', dx: 8 }, { x: 3, y: 5 }, { x: 9, y: 5, k: 'bed', talk: 'A guest bed, fresh and turned down. Rosa has put a little mint on the pillow.' }, { x: 1, y: 6, k: 'plant' },
  ], { rug: [4, 4, 4, 2] });
  const DOORS = { willow: 'willow-in', hut: 'hut-in', shop: 'shop-in', home: 'home-in', outpost: 'outpost-in', inn: 'inn-in' };
  for (const id in MAPS) { const m = MAPS[id]; m.id = id; m.w = m.rows[0].length; m.h = m.rows.length; }
  const SOLID = { T: 1, '~': 1, o: 1, S: 1, '=': 1, '#': 1, W: 1, w: 1, P: 1 };

  // ---------- materials, shared by every place ----------
  const C = (h) => new THREE.Color(h);
  const tex = (w, h, draw) => KIT.canvasTex(w, h, draw, { repeat: true });
  const fill = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TX = {
    plaster: tex(64, 64, (g) => { fill(g, '#efe2c6', 0, 0, 64, 64); for (let i = 0; i < 300; i++) fill(g, '#e2d2b0', (rnd() * 64) | 0, (rnd() * 64) | 0, 1, 1); for (const x of [0, 32]) fill(g, '#7a5232', x, 0, 4, 64); fill(g, '#7a5232', 0, 0, 64, 4); fill(g, '#7a5232', 0, 30, 64, 3); }),
    barn: tex(64, 64, (g) => { fill(g, '#c8382c', 0, 0, 64, 64); for (let x = 0; x < 64; x += 8) { fill(g, '#a42a22', x, 0, 1, 64); fill(g, '#dc5040', x + 1, 0, 1, 64); } }),
    wood: tex(64, 64, (g) => { fill(g, '#a8784a', 0, 0, 64, 64); for (let y = 0; y < 64; y += 5) { fill(g, '#7a5232', 0, y, 64, 1); fill(g, '#c08a58', 0, y + 1, 64, 1); for (let k = 0; k < 3; k++) fill(g, '#8a6038', (rnd() * 60) | 0, y + 2, 1, 2); } }),
    stone: tex(32, 32, (g) => { fill(g, '#a8a0a0', 0, 0, 32, 32); for (let y = 0; y < 32; y += 6) { const off = (y / 6) % 2 ? 5 : 0; fill(g, '#787078', 0, y + 5, 32, 1); for (let x = off; x < 42; x += 10) { fill(g, '#787078', x % 32, y, 1, 6); fill(g, '#c8c0c0', (x + 1) % 32, y, 8, 1); } } }),
    floor: tex(64, 64, (g) => { fill(g, '#b88654', 0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { fill(g, '#8a5e36', 0, y + 7, 64, 1); fill(g, '#cc9a66', 0, y, 64, 1); const o = (y / 8) % 2 ? 20 : 44; fill(g, '#8a5e36', o, y, 1, 8); fill(g, '#8a5e36', (o + 32) % 64, y, 1, 8); } }),
    checker: tex(32, 32, (g) => { fill(g, '#f2ece0', 0, 0, 32, 32); fill(g, '#a8a8b4', 0, 0, 16, 16); fill(g, '#a8a8b4', 16, 16, 16, 16); fill(g, 'rgba(0,0,0,.08)', 0, 15, 32, 1); fill(g, 'rgba(0,0,0,.08)', 15, 0, 1, 32); }),
    wallIn: tex(32, 64, (g) => { fill(g, '#f2e6cc', 0, 0, 32, 64); for (let i = 0; i < 120; i++) fill(g, '#e6d6b6', (rnd() * 32) | 0, (rnd() * 64) | 0, 1, 1); fill(g, '#8a5e36', 0, 0, 3, 64); fill(g, '#8a5e36', 0, 44, 32, 4); fill(g, '#9a6a40', 0, 48, 32, 16); for (let x = 0; x < 32; x += 8) fill(g, '#7a5232', x, 48, 1, 16); }),
  };
  const roofTex = (a, b, c) => tex(32, 32, (g) => { fill(g, a, 0, 0, 32, 32); for (let y = 0; y < 32; y += 6) { fill(g, b, 0, y + 5, 32, 1); fill(g, c, 0, y, 32, 1); const off = (y / 6) % 2 ? 4 : 0; for (let x = off; x < 32; x += 8) fill(g, b, x, y, 1, 5); } });
  const SEE = true;
  const MAT = {
    vc: KIT.toon('#ffffff', { vc: true, see: SEE }),
    plain: KIT.toon('#ffffff', { vc: true }),
    leaf: KIT.toon('#ffffff', { vc: true, sway: 14, see: SEE }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    plaster: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: TX.plaster } }),
    wood: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: TX.wood } }),
    stone: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: TX.stone } }),
    roofRed: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: roofTex('#c84a3a', '#8a2a22', '#e06a52') } }),
    barn: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: TX.barn } }),
    roofOrange: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: roofTex('#e8743a', '#b04a22', '#f8945a') } }),
    roofPurple: KIT.toon('#ffffff', { vc: true, see: SEE, mat: { map: roofTex('#7a5ac8', '#4e3690', '#9a7ae0') } }),
    floor: KIT.toon('#ffffff', { vc: true, mat: { map: TX.floor } }),
    checker: KIT.toon('#ffffff', { vc: true, mat: { map: TX.checker } }),
    wallIn: KIT.toon('#ffffff', { vc: true, mat: { map: TX.wallIn } }),
  };
  for (const k in MAT) MAT[k].vertexColors = true;
  const INK = KIT.inkMat({ see: SEE }), INKL = KIT.inkMat({ see: SEE, sway: 14 }), INKP = KIT.inkMat();
  // in the game's pixel units the ink is thicker: .45 px, as Farwick's
  const PXINK = 56; // ink scale for things built in pixels (KIT.INK is .008 m for models a metre high)
  const INKPX = KIT.inkMat({ see: SEE, k: PXINK }), INKPXL = KIT.inkMat({ see: SEE, sway: 14, k: PXINK }), INKPXN = KIT.inkMat({ k: PXINK });

  // ---------- the painted ground: grass, path, flowers, tall grass, pond floor, forest floor ----------
  const NOISE = [
    'float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float wNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y); }',
  ].join('\n');
  const v3 = (h) => { const c = C(h); return 'vec3(' + c.r.toFixed(3) + ',' + c.g.toFixed(3) + ',' + c.b.toFixed(3) + ')'; };
  const GROUND = [
    'float kindAt(vec2 w) { vec2 uv = (w + uOff) / uSize; return floor(texture2D(uKinds, vec2(uv.x, 1.0 - uv.y)).r * 255.0 + 0.5); }',
    'vec3 groundCol(vec2 w0) {',
    '  vec2 w = floor(w0);',
    '  vec2 jw = w + (vec2(wHash(floor(w / 3.0)), wHash(floor(w / 3.0) + 17.0)) - 0.5) * 3.5;',
    '  float k = kindAt(jw), n1 = wNoise(w * 0.07), n2 = wNoise(w * 0.23), n3 = wHash(floor(w * 0.5));',
    '  vec3 grass = mix(' + v3('#6cbc48') + ', ' + v3('#86d25c') + ', smoothstep(0.35, 0.8, n1));',
    '  grass = mix(grass, ' + v3('#5aa840') + ', smoothstep(0.55, 0.85, n2) * 0.6);',
    '  if (n3 > 0.94) grass = mix(grass, ' + v3('#9ae070') + ', 0.7); else if (n3 < 0.05) grass = mix(grass, ' + v3('#4a9638') + ', 0.7);',
    '  if (k < 0.5) return grass;',
    '  if (k < 1.5) { vec3 c = mix(' + v3('#e0c890') + ', ' + v3('#d2b67c') + ', smoothstep(0.3, 0.8, n1)); c = mix(c, ' + v3('#c8aa70') + ', smoothstep(0.6, 0.85, n2) * 0.6); if (n3 > 0.95) c = ' + v3('#b8a080') + '; return c; }',
    '  if (k < 2.5) { vec2 g = floor(w / 5.0); float h = wHash(g); vec2 f = fract(w / 5.0) - 0.5; if (h > 0.5 && length(f) < 0.25) return h > 0.83 ? ' + v3('#f8f0f8') + ' : h > 0.66 ? ' + v3('#f8d040') + ' : ' + v3('#f07ab0') + '; return grass; }',
    '  if (k < 3.5) return mix(' + v3('#3e8a30') + ', ' + v3('#4fa03a') + ', n1);',
    '  if (k < 4.5) return mix(' + v3('#c8b47e') + ', ' + v3('#a89a6a') + ', n2);',
    '  return mix(' + v3('#2f6a2c') + ', ' + v3('#41803a') + ', n1);',
    '}',
  ].join('\n');
  const KIND = { '.': 0, ':': 1, '*': 2, ',': 3, '~': 4, T: 5, o: 0, S: 0, '=': 1 };
  const MARGIN = 12;
  function ground(map, group) {
    const W = map.w + MARGIN * 2, H = map.h + MARGIN * 2, data = new Uint8Array(W * H * 4);
    const exitCols = (side) => (map.exits || []).filter((e) => e.side === side);
    const kindAtTile = (tx, ty) => {
      if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) return KIND[map.rows[ty][tx]] || 0;
      for (const e of exitCols('top')) if (ty < 0 && tx >= e.x0 && tx <= e.x1) return 1;
      for (const e of exitCols('bottom')) if (ty >= map.h && tx >= e.x0 && tx <= e.x1) return 1;
      for (const e of exitCols('right')) if (tx >= map.w && ty >= e.y0 && ty <= e.y1) return 1;
      for (const e of exitCols('left')) if (tx < 0 && ty >= e.y0 && ty <= e.y1) return 1;
      if (ty < 0 && exitCols('top').some((e) => tx >= e.x0 - 1 && tx <= e.x1 + 1)) return 0;
      if (ty >= map.h && exitCols('bottom').some((e) => tx >= e.x0 - 1 && tx <= e.x1 + 1)) return 0;
      return 5;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[(y * W + x) * 4] = kindAtTile(x - MARGIN, y - MARGIN);
    const kinds = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); kinds.magFilter = kinds.minFilter = THREE.NearestFilter; kinds.flipY = false; kinds.needsUpdate = true;
    // the mesh: a grid every 4 px; pools drop away, and the forest floor rolls a little beyond the map's edge
    const S = 4, NX = W * T / S, NZ = H * T / S, P = [], I = [];
    const water = (x, z) => { const tx = Math.floor(x / T), ty = Math.floor(z / T); return tx >= 0 && ty >= 0 && tx < map.w && ty < map.h && map.rows[ty][tx] === '~'; };
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const x = i * S - MARGIN * T, z = j * S - MARGIN * T;
      let y = 0, wn = 0; for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) if (water(x + dx, z + dz)) wn++;
      y -= 6 * wn / 4;
      const out = Math.max(-x, x - map.w * T, -z, z - map.h * T);
      if (out > 24) y += Math.min(1, (out - 24) / 60) * (4 + 4 * Math.sin(x * .05) * Math.sin(z * .07));
      P.push(x, y, z);
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; I.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
    const mat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: KIT.ramp });
    const U = { uKinds: { value: kinds }, uSize: { value: new THREE.Vector2(W * T, H * T) }, uOff: { value: new THREE.Vector2(MARGIN * T, MARGIN * T) } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform sampler2D uKinds;\nuniform vec2 uSize;\nuniform vec2 uOff;\nvarying vec3 vW;\n' + NOISE + '\n' + GROUND + '\n' +
        sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( groundCol(vW.xz) * (1.0 + min(0.0, vW.y) * 0.05), opacity );');
    };
    mat.customProgramCacheKey = () => 'cc-ground';
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; group.add(m);
    // the pool's water
    let wt = null;
    const wTiles = []; map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '~') wTiles.push([x, y]); }));
    if (wTiles.length) {
      const x0 = Math.min(...wTiles.map((t) => t[0])), x1 = Math.max(...wTiles.map((t) => t[0])) + 1, y0 = Math.min(...wTiles.map((t) => t[1])), y1 = Math.max(...wTiles.map((t) => t[1])) + 1;
      wt = { uT: { value: 0 } };
      const wm = new THREE.ShaderMaterial({ transparent: true, uniforms: wt, vertexShader: 'varying vec2 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: NOISE + '\nuniform float uT; varying vec2 vW; void main() { vec2 w = floor(vW); float n = wNoise(w * 0.12 + vec2(uT * 0.6, uT * 0.3)), m = wNoise(w * 0.3 - vec2(uT * 0.4, 0.0));\n vec3 c = mix(' + v3('#3a8ee8') + ', ' + v3('#5aa8f0') + ', smoothstep(0.5, 0.8, n)); if (m > 0.78) c = ' + v3('#a8dcff') + '; gl_FragColor = vec4(c, 0.86); }' });
      const wmesh = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) * T, (y1 - y0) * T), wm); wmesh.rotation.x = -PI / 2; wmesh.position.set((x0 + x1) / 2 * T, -2.2, (y0 + y1) / 2 * T); group.add(wmesh);
    }
    return { mesh: m, water: wt };
  }

  // ---------- trees: Farwick's (a trunk and five leafy lumps) and pines; instanced ----------
  const leafCol = (v, n) => { const t = Math.max(0, n.y) * .7 + .3 * Math.max(0, -n.x); return rgb(t > .62 ? '#5aa848' : t > .3 ? '#3f8a3a' : n.y < -.3 ? '#1e4a26' : '#2a6e34'); };
  const TREES = (() => {
    const make = (fn) => { const B = KIT.builder(), g = new THREE.Group(); fn(B); B.build(g, INKPXL); return g.children.map((m) => m.geometry); };
    seed = 99;
    const round = make((B) => {
      B.add(new THREE.CylinderGeometry(2.4, 3, 18, 8), MAT.leaf, [0, 9, 0], null, null, { tint: (v, n) => rgb(n.x > .3 ? '#5a3a22' : '#7a5232'), ink: 1 });
      [[0, 34, 0, 11], [-8, 28, 2, 8], [8, 29, -1, 8], [-5, 40, -3, 7], [6, 41, 2, 7]].forEach(([x, y, z, r], i) => B.add(KIT.lumpy(r, i * 1.3), MAT.leaf, [x, y, z], [i, i * .5, 0], null, { tint: leafCol }));
    });
    const pine = make((B) => {
      B.add(new THREE.CylinderGeometry(2, 2.6, 12, 8), MAT.leaf, [0, 6, 0], null, null, { tint: '#6a4a2e' });
      [[0, 16, 14, 16], [0, 26, 11, 14], [0, 35, 8, 12]].forEach(([x, y, r, h], i) => B.add(new THREE.ConeGeometry(r, h, 9), MAT.leaf, [x, y, 0], [0, i, 0], null, { tint: (v, n) => rgb(n.y > .5 ? '#3a7a40' : n.x > .2 ? '#2a5e34' : '#1e4a2a') }));
    });
    return { round, pine };
  })();
  function forest(map, group0) {
    const group = new THREE.Group(); group.name = 'forest'; group0.add(group);
    const pos = { round: [], pine: [] };
    seed = 1234 + map.w * 7;
    const isExitCol = (tx, side) => (map.exits || []).some((e) => e.side === side && tx >= e.x0 - 1 && tx <= e.x1 + 1);
    const isExitRow = (tx, ty) => (map.exits || []).some((e) => (e.side === 'right' && tx >= map.w || e.side === 'left' && tx < 0) && ty >= e.y0 - 1 && ty <= e.y1 + 1);
    const put = (x, z, s) => (rnd() < (map.pines || .2) ? pos.pine : pos.round).push([x, z, s, rnd()]);
    map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'T') put(x * T + 8 + (rnd() - .5) * 5, y * T + 10 + (rnd() - .5) * 4, .78 + rnd() * .2); }));
    for (let ty = -9; ty < map.h + 7; ty++) for (let tx = -8; tx < map.w + 8; tx++) {
      if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) continue;
      if ((ty < 0 && isExitCol(tx, 'top')) || (ty >= map.h && isExitCol(tx, 'bottom')) || isExitRow(tx, ty)) continue;
      if (rnd() < .3) continue;
      put(tx * T + 8 + (rnd() - .5) * 10, ty * T + 8 + (rnd() - .5) * 10, .8 + rnd() * .35);
    }
    const dummy = new THREE.Object3D(), col = new THREE.Color();
    for (const k of ['round', 'pine']) {
      const L = pos[k]; if (!L.length) continue;
      TREES[k].forEach((geo, gi) => {
        const im = new THREE.InstancedMesh(geo, gi === 0 ? MAT.leaf : INKPXL, L.length);
        L.forEach(([x, z, s, v], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, v * TAU, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); if (gi === 0) { col.setRGB(.88 + v * .2, .92 + v * .14, .84 + (1 - v) * .2); im.setColorAt(i, col); } });
        im.castShadow = gi === 0; im.frustumCulled = false; group.add(im);
      });
    }
    return group;
  }

  // ---------- tall grass: tufts of blades that sway, part round you, and shake when something is hiding ----------
  const TUFT = (() => {
    const P = [], Cc = [], I = [];
    for (let b = 0; b < 7; b++) {
      const a = b / 7 * TAU + .3, r = 1.5 + (b % 3), x0 = Math.cos(a) * r, z0 = Math.sin(a) * r, h = 9 + (b * 5) % 5, w = 1.5, lean = .35, base = P.length / 3;
      const dx = Math.cos(a) * lean, dz = Math.sin(a) * lean, px = -Math.sin(a) * w, pz = Math.cos(a) * w;
      [[x0 - px, 0, z0 - pz, 0], [x0 + px, 0, z0 + pz, 0], [x0 + dx * h * .5 - px * .6, h * .5, z0 + dz * h * .5 - pz * .6, .5], [x0 + dx * h * .5 + px * .6, h * .5, z0 + dz * h * .5 + pz * .6, .5], [x0 + dx * h, h, z0 + dz * h, 1]].forEach(([x, y, z, t]) => {
        P.push(x, y, z); const c = new THREE.Color('#2f7a2a').lerp(new THREE.Color(b % 2 ? '#90e070' : '#6cc850'), t); Cc.push(c.r, c.g, c.b);
      });
      I.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
    return g;
  })();
  const GRASSU = { uT: { value: 0 }, uP: { value: new THREE.Vector2(-999, -999) }, uQ: { value: new THREE.Vector2(-999, -999) }, uR: { value: new THREE.Vector3(-999, -999, -99) } };
  const grassMat = (() => {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: KIT.ramp, vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, GRASSU);
      sh.vertexShader = 'uniform float uT;\nuniform vec2 uP;\nuniform vec2 uQ;\nuniform vec3 uR;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
        '#include <begin_vertex>',
        'vec4 b0 = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);',
        'float hk = transformed.y / 12.0; hk *= hk;',
        'vec2 wind = vec2(sin(uT * 1.7 + b0.x * 0.08 + b0.z * 0.05), cos(uT * 1.3 + b0.z * 0.07)) * 1.2;',
        'vec2 d = b0.xz - uP; float dl = length(d); vec2 push = dl > 0.01 ? d / dl * smoothstep(13.0, 3.0, dl) * 6.0 : vec2(0.0);',
        'vec2 d2 = b0.xz - uQ; float dl2 = length(d2); push += dl2 > 0.01 ? d2 / dl2 * smoothstep(9.0, 2.0, dl2) * 4.0 : vec2(0.0);',
        'float rk = smoothstep(16.0, 4.0, length(b0.xz - uR.xy)) * step(0.0, uR.z) * max(0.0, 1.0 - uR.z * 0.9);',
        'vec2 rustle = vec2(sin(uT * 40.0 + b0.x), cos(uT * 37.0 + b0.z)) * 3.0 * rk;',
        'transformed.xz += (wind + push + rustle) * hk;',
        'transformed.y -= length(push) * 0.35 * hk;'].join('\n'));
    };
    m.customProgramCacheKey = () => 'cc-grass';
    return m;
  })();
  function tallGrass(map, group) {
    const spots = [];
    seed = 555 + map.h;
    map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ',') for (let k = 0; k < 5; k++) spots.push([x * T + 2 + rnd() * 12, y * T + 2 + rnd() * 12, .8 + rnd() * .4]); }));
    if (!spots.length) return;
    const im = new THREE.InstancedMesh(TUFT, grassMat, spots.length), d = new THREE.Object3D();
    spots.forEach(([x, z, s], i) => { d.position.set(x, 0, z); d.scale.setScalar(s); d.rotation.set(0, 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
    im.receiveShadow = true; im.frustumCulled = false; group.add(im);
  }

  // ---------- houses ----------
  const shadeY = (a, b, c) => (v, n) => rgb(n.y > .5 ? a : n.y < -.5 ? c : b);
  function gableHouse(B, o) {
    const { X0, Z0, W, D, wall, roof, roofCol, door, windows, WH } = o;
    const x0 = X0 + 2, x1 = X0 + W - 2, zb = Z0 + 6, zf = Z0 + D - 2, depth = zf - zb, zc = (zf + zb) / 2, rise = depth * .5, RH = WH + rise, ov = 5, ovs = 4, slope = rise / (depth / 2);
    B.box(MAT[wall], x0, 0, zb, x1, WH, zf, { uv: wall === 'stone' ? [32, 32] : [32, 34] });
    for (const [x, s] of [[x0, -1], [x1, 1]]) { // the gable ends
      const g = new THREE.BufferGeometry(), P = s < 0 ? [x, WH, zb, x, WH, zf, x, RH, zc] : [x, WH, zf, x, WH, zb, x, RH, zc];
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); B.add(g, MAT[wall], null, null, null, { uv: [32, 34] });
    }
    const L = Math.hypot(depth / 2 + ov, rise + ov * slope), ang = Math.atan2(rise, depth / 2);
    for (const s of [1, -1]) {
      const cz = zc + s * (depth / 2 + ov) / 2, cy = RH - (rise + ov * slope) / 2;
      B.add(KIT.BOXG, MAT[roof], [(x0 + x1) / 2, cy, cz], [s * ang, 0, 0], [x1 - x0 + ovs * 2, 2.4, L], { uv: [32, 32] });
    }
    B.box(MAT.vc, x0 - ovs, RH - 1, zc - 2, x1 + ovs, RH + 1.8, zc + 2, { tint: roofCol });
    B.box(MAT.stone, x0 - .4, 0, zf - .5, x1 + .4, 3, zf + .7, { uv: [32, 32] });
    for (const cx of windows) { // windows: a frame, glass, bars, a sill
      const wx0 = X0 + cx * T + 2.5, wx1 = wx0 + 11, wy0 = 12, wy1 = 23;
      B.box(MAT.vc, wx0 - 1.2, wy0 - 1.2, zf, wx1 + 1.2, wy1 + 1.2, zf + .7, { tint: '#6a4628' });
      B.box(MAT.glow, wx0, wy0, zf + .1, wx1, wy1, zf + .9, { tint: (v) => rgb(v.y > wy0 + 6 ? '#bfe4f4' : '#8cc6e4'), ink: 0 });
      B.box(MAT.vc, (wx0 + wx1) / 2 - .6, wy0, zf + .9, (wx0 + wx1) / 2 + .6, wy1, zf + 1.3, { tint: '#6a4628', ink: .3 });
      B.box(MAT.vc, wx0, (wy0 + wy1) / 2 - .5, zf + .9, wx1, (wy0 + wy1) / 2 + .5, zf + 1.3, { tint: '#6a4628', ink: .3 });
      B.box(MAT.vc, wx0 - 1.6, wy0 - 2.2, zf, wx1 + 1.6, wy0 - 1, zf + 2.4, { tint: '#f4ecd8' });
      if (o.boxes) { B.box(MAT.vc, wx0 - 1, wy0 - 5.5, zf + .6, wx1 + 1, wy0 - 2.2, zf + 3.8, { tint: '#7a5232' }); for (let k = 0; k < 6; k++) B.add(KIT.lumpy(1, k, .1), MAT.vc, [wx0 + 1 + k * 1.8, wy0 - 1.4 + (k % 2) * .6, zf + 2.2], null, .9, { tint: ['#e84838', '#f8d040', '#f07ab0', '#ffffff'][(k + cx) % 4], ink: .4 }); }
    }
    return { zf, RH, zc, x0, x1, slope, WH };
  }
  function doorPanel(group, x, zf, col, round) { // a door on a hinge at its left edge, to swing open
    const pivot = new THREE.Group(); pivot.position.set(x, 0, zf + .6); group.add(pivot);
    const B = KIT.builder();
    if (round) B.add(new THREE.CylinderGeometry(5, 5, 1, 20, 1, false, 0, PI), MAT.vc, [5, 16, 0], [PI / 2, 0, PI / 2], null, { tint: col });
    B.box(MAT.vc, 0, 0, -.5, 10, round ? 16 : 21, .5, { tint: col });
    for (const k of [2.5, 5, 7.5]) B.box(MAT.vc, k - .3, .5, .5, k + .3, round ? 19 : 20.5, .8, { tint: '#4a3020', ink: 0 });
    B.box(MAT.vc, 7.4, 9, .5, 8.6, 11, 1.4, { tint: '#f0c040', ink: .3 });
    B.build(pivot, INKPX);
    return { pivot, set open(k) { pivot.rotation.y = k * 1.6; } };
  }
  const HOUSES = {
    home(B, o) {
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofRed', roofCol: '#8a2a22', WH: 30, windows: [0.3, 2.95], boxes: true }));
      const c0 = o.X0 + 10, c1 = c0 + 7, cz1 = h.zc - 3, yb = h.RH - (h.zc - cz1) * h.slope - 3; // a chimney
      B.box(MAT.stone, c0, yb, h.zc - 10, c1, h.RH + 8, cz1, { uv: [16, 16] }); B.box(MAT.vc, c0 - .8, h.RH + 8, h.zc - 10.8, c1 + .8, h.RH + 9.6, cz1 + .8, { tint: '#787078' });
      o.smoke = [(c0 + c1) / 2, h.RH + 10, h.zc - 6.5];
      return h;
    },
    shop(B, o) {
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofPurple', roofCol: '#4e3690', WH: 30, windows: [0.4] }));
      // a striped awning over the front
      const ax0 = o.X0 + 1, ax1 = o.X0 + o.W - 1, az = h.zf;
      for (let i = 0; i < 8; i++) { const sx0 = ax0 + (ax1 - ax0) * i / 8, sx1 = ax0 + (ax1 - ax0) * (i + 1) / 8; B.add(KIT.BOXG, MAT.vc, [(sx0 + sx1) / 2, 27, az + 4.5], [.55, 0, 0], [sx1 - sx0, .8, 11], { tint: i % 2 ? '#f4f0f8' : '#3a6ae8', ink: .6 }); }
      for (let i = 0; i < 8; i++) { const sx = ax0 + (ax1 - ax0) * (i + .5) / 8; B.add(new THREE.CylinderGeometry(2.2, 2.2, .8, 10, 1, false, 0, PI), MAT.vc, [sx, 23.4, az + 9.2], [0, 0, PI / 2], [1, 1, 1], { tint: i % 2 ? '#f4f0f8' : '#3a6ae8', ink: .4 }); }
      // crates of cubes by the door
      B.box(MAT.wood, o.X0 + 49, 0, h.zf + 2, o.X0 + 59, 7, h.zf + 10, { uv: [16, 16] });
      for (let k = 0; k < 4; k++) B.add(KIT.rbox(3.4, 3.4, 3.4, .7, 2), MAT.vc, [o.X0 + 51.5 + (k % 2) * 4.6, 8.7, h.zf + 4 + Math.floor(k / 2) * 4], [0, k * .4, 0], null, { tint: (v, n) => rgb(v.y > 8.7 ? '#9a6ad8' : '#4a7af0') });
      o.cubeSign = [o.X0 + o.W / 2, h.RH + 13, h.zc + 2];
      return h;
    },
    inn(B, o) { // Rosa's Inn: half-timbered cream walls, an orange tiled roof, a porch with its own little roof, a hanging sign
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofOrange', roofCol: '#a8441c', WH: 32, windows: [0.3, 2.95] }));
      const x0 = h.x0, x1 = h.x1, zf = h.zf, beam = '#5a3a22';
      for (const x of [x0, (x0 + x1) / 2 - 9, (x0 + x1) / 2 + 9, x1]) B.box(MAT.vc, x - 1, 0, zf - .1, x + 1, h.WH, zf + .9, { tint: beam });
      for (const y of [h.WH - 1.5, 15]) B.box(MAT.vc, x0, y - .8, zf - .1, x1, y + .8, zf + .9, { tint: beam });
      // the porch: posts, a slanted roof, a bench
      const px0 = o.X0 + (o.door[0] - o.x) * T - 8, px1 = px0 + 30, pz = zf + 9;
      for (const x of [px0, px1]) B.box(MAT.wood, x - 1, 0, pz - 1, x + 1, 20, pz + 1, { uv: [8, 8] });
      B.add(KIT.BOXG, MAT.roofOrange, [(px0 + px1) / 2, 21.5, zf + 5], [.38, 0, 0], [px1 - px0 + 6, 1.6, 12], { uv: [16, 16] });
      B.box(MAT.wood, px0 - 2, 0, zf, px1 + 2, 1.2, pz + 2, { uv: [16, 16] });
      // the sign, hanging from a bracket at the side
      const sx = x0 - 3; B.box(MAT.vc, sx - 6, 25, zf + 2, sx + 1, 26, zf + 3, { tint: beam }); B.box(MAT.vc, sx - 6.4, 16, zf + 2.1, sx - .6, 23, zf + 2.9, { tint: '#c89858' });
      B.add(KIT.lumpy(1.6, 2, .1), MAT.vc, [sx - 3.5, 19.5, zf + 3.2], null, [1, .8, .3], { tint: '#f0e0c0', ink: .4 });
      // a chimney
      const c0 = x1 - 14, cz1 = h.zc - 3, yb = h.RH - (h.zc - cz1) * h.slope - 3;
      B.box(MAT.stone, c0, yb, h.zc - 10, c0 + 7, h.RH + 8, cz1, { uv: [16, 16] });
      o.smoke = [c0 + 3.5, h.RH + 10, h.zc - 6.5];
      return h;
    },
    barn(B, o) { // Farmer Bramble's farmhouse: a red barn, white trim, an X on the doors, a cupola with a rooster on top, hay by the door
      const h = gableHouse(B, Object.assign(o, { wall: 'barn', roof: 'roofRed', roofCol: '#7a2a22', WH: 30, windows: [2.95] }));
      const x0 = h.x0, x1 = h.x1, zf = h.zf;
      for (const x of [x0, x1]) B.box(MAT.vc, x - 1, 0, zf - .2, x + 1, h.WH, zf + 1, { tint: '#f4efe4' });
      B.box(MAT.vc, x0, h.WH - 1.4, zf - .2, x1, h.WH, zf + 1, { tint: '#f4efe4' });
      const cx = (x0 + x1) / 2, cz = h.zc;
      B.box(MAT.barn, cx - 4.5, h.RH - 1, cz - 4.5, cx + 4.5, h.RH + 7, cz + 4.5, { uv: [16, 16] });
      B.add(new THREE.ConeGeometry(7, 6, 4), MAT.vc, [cx, h.RH + 10, cz], [0, PI / 4, 0], null, { tint: '#8a2a22' });
      B.add(new THREE.CylinderGeometry(.4, .4, 6, 6), MAT.vc, [cx, h.RH + 15, cz], null, null, { tint: '#3a3448' });
      B.add(KIT.slab([[-3, 0], [2, 0], [3.5, 2.5], [1, 4], [-1, 3], [-3.5, 4.5], [-2.5, 1.5]], .6, .2), MAT.vc, [cx, h.RH + 17, cz], null, null, { tint: '#3a3448' });
      for (const [hx, hz] of [[x1 + 3, zf + 6], [x1 + 9, zf + 4], [x1 + 5, zf + 12]]) { B.box(MAT.vc, hx - 3.5, 0, hz - 2.5, hx + 3.5, 5, hz + 2.5, { tint: (v, n) => rgb(n.y > .5 ? '#f0d060' : '#d8a838') }); B.box(MAT.vc, hx - 3.6, 2, hz - 2.6, hx + 3.6, 2.8, hz + 2.6, { tint: '#a87a2a', ink: 0 }); }
      return h;
    },
    hut(B, o) { // the Healing Hut: round, white walls with a wooden band, a striped mint-and-white roof, a heart over the door
      const cx = o.X0 + (o.door[0] - o.x) * T + 8, cz = o.Z0 + o.D / 2 + 2, r = Math.min(o.W, o.D) / 2 - 1, zf = cz + r;
      B.add(new THREE.CylinderGeometry(r, r + .5, 30, 28), MAT.plaster, [cx, 15, cz], null, null, { uv: [32, 34] });
      B.add(new THREE.CylinderGeometry(r + .8, r + .8, 3, 28), MAT.vc, [cx, 1.5, cz], null, null, { tint: '#a8a0a0' });
      B.add(new THREE.CylinderGeometry(r + .6, r + .6, 2, 28), MAT.vc, [cx, 29, cz], null, null, { tint: '#7a5232' });
      B.add(new THREE.ConeGeometry(r + 6, 26, 28, 3), MAT.vc, [cx, 43, cz], null, null, { tint: (v) => { const a = Math.atan2(v.x - cx, v.z - cz); return rgb(Math.floor((a + PI) / TAU * 14) % 2 ? '#8ad8b0' : '#f8f4ea'); } });
      B.add(new THREE.SphereGeometry(2.6, 12, 8), MAT.vc, [cx, 57, cz], null, null, { tint: '#e85a8a' });
      for (const s of [-1, 1]) { const wx = cx + s * 13; B.add(new THREE.CylinderGeometry(4.5, 4.5, 1, 16), MAT.glow, [wx, 17, cz + Math.sqrt(r * r - 169) + .2], [PI / 2, 0, 0], null, { tint: '#bfe4f4', ink: 0 }); B.add(new THREE.TorusGeometry(4.6, .8, 6, 16), MAT.vc, [wx, 17, cz + Math.sqrt(r * r - 169) + .5], null, null, { tint: '#7a5232', ink: .4 }); }
      const heart = KIT.slab([[0, -5], [4.5, -.5], [5, 2.5], [3, 4.5], [0, 2.8], [-3, 4.5], [-5, 2.5], [-4.5, -.5]], 1.6, .5);
      B.add(heart, MAT.vc, [o.X0 + (o.door[0] - o.x) * T + 8, 33, zf + 1], null, null, { tint: '#f05a8a' });
      return { zf: zf - .3, RH: 56 };
    },
    willow(B, o) { // Elder Willow's: stone footing, plank walls, a deep mossy roof, round windows and a round-topped door
      const x0 = o.X0 + 2, x1 = o.X0 + o.W - 2, zb = o.Z0 + 6, zf = o.Z0 + o.D - 2, zc = (zb + zf) / 2;
      B.box(MAT.stone, x0 - 1, 0, zb - 1, x1 + 1, 7, zf + 1, { uv: [32, 32] });
      B.box(MAT.wood, x0, 7, zb, x1, 28, zf, { uv: [32, 32] });
      // the roof: a long, rounded mound of moss and leaves
      const RH = 46, rise = RH - 26, rr = (zf - zb) / 2 + 7;
      B.add(new THREE.CylinderGeometry(rr, rr, x1 - x0 + 8, 20, 1, false, -PI / 2, PI), MAT.vc, [(x0 + x1) / 2, 26, zc], [0, 0, PI / 2], [1, 1, rise / rr * 1.05], { tint: (v, n) => rgb(n.y > .7 ? '#5a9a3a' : n.y > .3 ? '#4a8a32' : '#3a6e2a') });
      for (const sx of [x0 - 4, x1 + 4]) B.add(new THREE.CircleGeometry(rr, 20, -PI / 2, PI), MAT.vc, [sx, 26, zc], [0, sx < x0 ? -PI / 2 : PI / 2, 0], [1, rise / rr * 1.05, 1], { tint: '#3e7a32', ink: 0 });
      seed = 42;
      for (let i = 0; i < 26; i++) { const u = rnd(), th = .25 + rnd() * (PI - .5); const x = x0 - 3 + u * (x1 - x0 + 6), zz = zc + Math.cos(th) * rr, y = 26 + Math.sin(th) * rise * 1.05; B.add(KIT.lumpy(4 + rnd() * 3.5, i, .25), MAT.leaf, [x, y, zz], [rnd(), rnd(), 0], [1, .6, 1], { tint: leafCol }); }
      for (let i = 0; i < 9; i++) { const x = x0 + 2 + i * (x1 - x0 - 4) / 8; B.add(KIT.lumpy(2.2, i, .2), MAT.vc, [x, 25 - (i % 2) * 2, zf + 4], null, [1, 1.4, 1], { tint: i % 3 ? '#4a8a2e' : '#6ab040', ink: .5 }); }
      for (const [fx, col] of [[x0 + 6, '#f8d040'], [x1 - 6, '#f07ab0'], [x0 + 14, '#ffffff']]) { B.add(KIT.lumpy(1.6, fx, .1), MAT.vc, [fx, 26, zf + 5], null, null, { tint: col, ink: .4 }); }
      // round windows, a chimney of stones, flower pots
      for (const cx of [o.X0 + 14, o.X0 + o.W - 14]) { B.add(new THREE.CylinderGeometry(5, 5, 1, 18), MAT.glow, [cx, 17, zf + .3], [PI / 2, 0, 0], null, { tint: '#ffe8a8', ink: 0 }); B.add(new THREE.TorusGeometry(5.2, 1, 6, 18), MAT.vc, [cx, 17, zf + .6], null, null, { tint: '#5a3a22', ink: .5 }); }
      B.add(new THREE.CylinderGeometry(4, 4.5, 16, 10), MAT.stone, [x1 - 10, RH + 2, zc - 4], null, null, { uv: [16, 16] });
      for (const [px, c] of [[o.X0 + 6, '#e84838'], [o.X0 + o.W - 7, '#f8d040']]) { B.add(new THREE.CylinderGeometry(2.6, 2, 4, 10), MAT.vc, [px, 2, zf + 4], null, null, { tint: '#b86a3a' }); B.add(KIT.lumpy(3, px, .2), MAT.vc, [px, 6, zf + 4], null, null, { tint: '#4a8a2e' }); B.add(KIT.lumpy(1.3, px + 1, .1), MAT.vc, [px, 8.5, zf + 5], null, null, { tint: c, ink: .4 }); }
      o.smoke = [x1 - 10, RH + 11, zc - 4];
      return { zf, RH, round: true };
    },
  };

  // ---------- props ----------
  const PROPS = {
    lamp(B, x, z) { B.add(new THREE.CylinderGeometry(1, 1.3, 22, 8), MAT.vc, [x, 11, z], null, null, { tint: '#3a3448' }); B.add(new THREE.CylinderGeometry(3, 3.4, 2, 8), MAT.vc, [x, 1, z], null, null, { tint: '#3a3448' }); B.box(MAT.vc, x - .5, 21, z - .5, x + 6, 22, z + .5, { tint: '#3a3448' }); B.add(new THREE.CylinderGeometry(2.2, 1.6, 4.5, 6), MAT.glow, [x + 5.5, 18, z], null, null, { tint: '#ffe08a', ink: .6 }); B.add(new THREE.ConeGeometry(2.8, 2.4, 6), MAT.vc, [x + 5.5, 21.4, z], null, null, { tint: '#3a3448' }); },
    barrel(B, x, z) { B.add(KIT.lathe([[5, 13], [6, 9], [6.2, 6.5], [6, 4], [5, 0]], 14), MAT.wood, [x, 0, z], null, null, { uv: [16, 16] }); for (const y of [2.5, 10.5]) B.add(new THREE.TorusGeometry(5.7, .5, 5, 16), MAT.vc, [x, y, z], [PI / 2, 0, 0], null, { tint: '#4a4048', ink: .3 }); B.add(new THREE.CylinderGeometry(5, 5, .6, 14), MAT.vc, [x, 13, z], null, null, { tint: '#8a6038' }); },
    crates(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 2, 9, z + 5, { uv: [16, 16] }); B.box(MAT.wood, x + 1, 0, z - 2, x + 7, 6, z + 4, { uv: [16, 16] }); B.box(MAT.wood, x - 5, 9, z - 3, x + 1, 15, z + 3, { uv: [16, 16] }); },
    mailbox(B, x, z) { B.box(MAT.vc, x - .8, 0, z - .8, x + .8, 9, z + .8, { tint: '#7a5232' }); B.add(KIT.rbox(6, 5, 8, 1.6, 2), MAT.vc, [x, 11, z], null, null, { tint: '#d83a3a' }); B.box(MAT.vc, x + 3, 11, z - 1, x + 3.6, 15, z, { tint: '#f8d040', ink: .3 }); },
    hay(B, x, z) { for (const [dx, dz, y] of [[-4, 0, 0], [4, 0, 0], [0, 1, 7]]) B.add(KIT.rbox(9, 7, 11, 2, 2), MAT.vc, [x + dx, y + 3.5, z + dz], null, null, { tint: (v, n) => rgb(n.y > .5 ? '#f8d878' : '#d8a840') }); },
    bench(B, x, z) { B.box(MAT.wood, x - 9, 4.5, z - 2.5, x + 9, 6, z + 2.5, { uv: [16, 16] }); B.box(MAT.wood, x - 9, 6, z - 3, x + 9, 11, z - 2, { uv: [16, 16] }); for (const dx of [-7, 7]) B.box(MAT.vc, x + dx - .8, 0, z - 2, x + dx + .8, 4.5, z + 2, { tint: '#5a3a22' }); },
    pots(B, x, z) { B.add(KIT.lathe([[2, 9], [3.5, 8], [5, 5], [4.5, 2], [3, 0]], 14), MAT.vc, [x - 3, 0, z], null, null, { tint: '#d8a070' }); B.add(KIT.lathe([[1.5, 6.5], [2.6, 6], [4, 3.5], [3.4, 1.2], [2.2, 0]], 14), MAT.vc, [x + 4, 0, z + 2], null, null, { tint: '#c86a3a' }); },
    barrow(B, x, z) { B.add(KIT.BOXG, MAT.wood, [x, 6, z], [0, 0, .15], [12, 5, 9], { uv: [16, 16] }); B.add(new THREE.CylinderGeometry(3, 3, 1.5, 12), MAT.vc, [x + 7, 3, z], [PI / 2, 0, 0], null, { tint: '#5a3a22' }); for (const s of [-1, 1]) B.box(MAT.vc, x - 9, 4, z + s * 3 - .5, x - 4, 5, z + s * 3 + .5, { tint: '#7a5232' }); },
    bush(B, x, z) { B.add(KIT.lumpy(7, x, .2), MAT.leaf, [x, 5, z], null, [1, .8, 1], { tint: leafCol }); B.add(KIT.lumpy(5, x + 1, .2), MAT.leaf, [x - 4, 4, z + 2], null, [1, .8, 1], { tint: leafCol }); },
    flowerbush(B, x, z) { PROPS.bush(B, x, z); seed = x * 3 + z; for (let i = 0; i < 9; i++) { const a = rnd() * TAU, e = rnd() * 1.2; B.add(new THREE.SphereGeometry(1, 6, 4), MAT.vc, [x + Math.cos(a) * 6.5 * Math.cos(e), 5 + Math.sin(e) * 5, z + Math.sin(a) * 6.5 * Math.cos(e)], null, null, { tint: '#fff8f0', ink: .3 }); } },
    berrybush(B, x, z) { PROPS.bush(B, x, z); seed = x * 5 + z; for (let i = 0; i < 9; i++) { const a = rnd() * TAU, e = rnd() * 1.2; B.add(new THREE.SphereGeometry(1.1, 6, 4), MAT.vc, [x + Math.cos(a) * 6.5 * Math.cos(e), 5 + Math.sin(e) * 5, z + Math.sin(a) * 6.5 * Math.cos(e)], null, null, { tint: '#e83848', ink: .3 }); } },
    rock(B, x, z) { B.add(KIT.lumpy(7, x, .25), MAT.vc, [x, 3, z], [0, x, 0], [1, .6, .9], { tint: shadeY('#a8a0b0', '#7a7088', '#4a4252') }); },
    boulder(B, x, z) { B.add(KIT.lumpy(7.5, x + z, .25), MAT.vc, [x, 4, z], [0, x, 0], [1, .7, .9], { tint: shadeY('#a8a0b0', '#7a7088', '#4a4252') }); },
    lily(B, x, z) { B.add(new THREE.CylinderGeometry(5, 5, .6, 16, 1, false, .4, TAU - .8), MAT.vc, [x, -1.8, z], null, null, { tint: '#4fa040', ink: .4 }); B.add(KIT.lumpy(1.4, x, .2), MAT.vc, [x + 1, -.8, z], null, null, { tint: '#f8a0c8', ink: .3 }); },
    sign(B, x, z) { B.box(MAT.vc, x - .8, 0, z - .8, x + .8, 10, z + .8, { tint: '#5a3a22' }); B.box(MAT.wood, x - 6.5, 7, z - .8, x + 6.5, 14.5, z + .8, { uv: [16, 16] }); for (const y of [9.5, 12]) B.box(MAT.vc, x - 4.5, y, z + .8, x + 4.5, y + .7, z + 1, { tint: '#6a4628', ink: 0 }); },
    flowers(B, x, z, k) { seed = k; for (let i = 0; i < 4; i++) { const fx = x - 5 + rnd() * 10, fz = z - 5 + rnd() * 10, h = 2 + rnd() * 2; B.box(MAT.vc, fx - .25, 0, fz - .25, fx + .25, h, fz + .25, { tint: '#3e8a30', ink: 0 }); B.add(new THREE.SphereGeometry(1.3, 6, 4), MAT.vc, [fx, h + .6, fz], null, [1, .6, 1], { tint: ['#f8f0f8', '#f8d040', '#f07ab0'][i % 3], ink: .3 }); } },
  };

  // ---------- furniture for the rooms (h is how tall each stands, as in the game's art) ----------
  const FURN = {
    bookshelf(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 7, 24, z + 3, { uv: [16, 16] }); for (const y of [2, 9, 16]) { B.box(MAT.vc, x - 6, y, z - 3, x + 6, y + .8, z + 3.2, { tint: '#5a3a22', ink: 0 }); for (let i = 0; i < 6; i++) B.box(MAT.vc, x - 5.6 + i * 1.9, y + .8, z - 2, x - 4.2 + i * 1.9, y + 5.5 + (i % 3) * .4, z + 2.4, { tint: ['#3a6ae8', '#c84a3a', '#4fa040', '#f8d040', '#7a5ac8', '#e8e0d0'][(i + y) % 6], ink: .3 }); } },
    fireplace(B, x, z) { B.box(MAT.stone, x - 9, 0, z - 4, x + 9, 20, z + 3, { uv: [16, 16] }); B.box(MAT.vc, x - 5, 0, z + 2.8, x + 5, 10, z + 3.2, { tint: '#2a1a14', ink: 0 }); B.box(MAT.wood, x - 10, 20, z - 4.5, x + 10, 22, z + 4, { uv: [16, 16] }); B.add(new THREE.ConeGeometry(2.5, 6, 6), MAT.glow, [x - 1.5, 4, z + 2], null, null, { tint: '#ffb040', ink: 0 }); B.add(new THREE.ConeGeometry(1.8, 5, 6), MAT.glow, [x + 2, 3.5, z + 2], null, null, { tint: '#ffe070', ink: 0 }); },
    clock(B, x, z) { B.box(MAT.wood, x - 4, 0, z - 3, x + 4, 22, z + 3, { uv: [16, 16] }); B.add(new THREE.CylinderGeometry(3, 3, .6, 16), MAT.vc, [x, 18, z + 3.2], [PI / 2, 0, 0], null, { tint: '#f8f0e0', ink: .4 }); B.box(MAT.vc, x - .3, 17.7, z + 3.5, x + .3, 20, z + 3.8, { tint: '#2a2230', ink: 0 }); B.box(MAT.vc, x - 2.5, 3, z + 3, x + 2.5, 13, z + 3.3, { tint: '#3a2418', ink: 0 }); },
    plant(B, x, z) { B.add(KIT.lathe([[3.2, 6], [3.6, 5], [3, 1], [2.4, 0]], 12), MAT.vc, [x, 0, z], null, null, { tint: '#c86a3a' }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.add(KIT.slab([[0, 0], [1.6, 3], [0, 9], [-1.6, 3]], .4, .15), MAT.vc, [x + Math.cos(a), 5.5, z + Math.sin(a)], [-.5, -a + PI / 2, 0, 'YXZ'], null, { tint: i % 2 ? '#4fa040' : '#3a8a34', ink: .4 }); } },
    starterTable(B, x, z) { B.add(new THREE.CylinderGeometry(15, 15, 2, 28), MAT.vc, [x, 11, z], null, [1, 1, .55], { tint: '#4f8a3a' }); B.add(new THREE.CylinderGeometry(15.6, 15.6, 1.2, 28), MAT.vc, [x, 10, z], null, [1, 1, .56], { tint: '#6a4628' }); for (const s of [-1, 1]) B.box(MAT.vc, x + s * 10 - 1, 0, z - 1, x + s * 10 + 1, 10, z + 1, { tint: '#5a3a22' }); },
    healCounter(B, x, z) { B.add(KIT.rbox(30, 12, 9, 2, 2), MAT.vc, [x, 6, z], null, null, { tint: shadeY('#f8f4ea', '#e8e0d0', '#c8c0b0') }); B.box(MAT.vc, x - 15, 0, z + 2, x + 15, 6, z + 4.8, { tint: '#8ad8b0' }); B.add(KIT.slab([[0, -3], [3, 0], [3, 2], [1.5, 3], [0, 2], [-1.5, 3], [-3, 2], [-3, 0]], 1, .3), MAT.vc, [x, 7, z + 4.8], null, null, { tint: '#f05a8a' }); },
    healMachine(B, x, z) { B.add(KIT.rbox(14, 14, 8, 2, 2), MAT.vc, [x, 7, z], null, null, { tint: shadeY('#ffffff', '#e8e4f0', '#b8b0c8') }); for (let i = 0; i < 4; i++) B.add(new THREE.SphereGeometry(2, 10, 6, 0, TAU, 0, PI / 2), MAT.glow, [x - 4.5 + i * 3, 14, z - 1 + (i % 2) * 2], null, null, { tint: '#f8a8e0', ink: .4 }); },
    vault(B, x, z) { B.add(KIT.rbox(12, 24, 8, 2, 2), MAT.vc, [x, 12, z], null, null, { tint: shadeY('#ffffff', '#e8eef4', '#b8c0c8') }); B.box(MAT.glow, x - 4, 13, z + 3.9, x + 4, 20, z + 4.3, { tint: '#8ad0f8', ink: 0 }); for (let i = 0; i < 4; i++) B.add(KIT.rbox(2.2, 2.2, 2.2, .5, 1), MAT.vc, [x - 3 + (i % 2) * 6, 6 + Math.floor(i / 2) * 3, z + 4.4], null, null, { tint: '#b07ae8', ink: .3 }); },
    herbShelf(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 3, x + 7, 22, z + 3, { uv: [16, 16] }); for (const y of [6, 13, 20]) { B.box(MAT.vc, x - 6.5, y, z - 2.5, x + 6.5, y + .7, z + 3.2, { tint: '#5a3a22', ink: 0 }); for (let i = 0; i < 4; i++) B.add(new THREE.CylinderGeometry(1.2, 1.2, 3.6, 8), MAT.vc, [x - 4.5 + i * 3, y + 2.5, z + 1], null, null, { tint: ['#a8e080', '#f8c0d0', '#f8e080', '#c8a8f0'][(i + y) % 4], ink: .3 }); } },
    cot(B, x, z) { B.box(MAT.vc, x - 6, 0, z - 9, x + 6, 6, z + 9, { tint: '#8a6038' }); B.add(KIT.rbox(11, 3, 17, 1.2, 2), MAT.vc, [x, 7, z], null, null, { tint: '#f8f4ea' }); B.add(KIT.rbox(8, 2.4, 5, 1, 2), MAT.vc, [x, 9.5, z - 5.5], null, null, { tint: '#ffffff' }); },
    shopCounter(B, x, z) { B.box(MAT.wood, x - 15, 0, z - 4, x + 15, 11, z + 4, { uv: [16, 16] }); B.box(MAT.vc, x - 15.5, 11, z - 4.5, x + 15.5, 12.5, z + 4.5, { tint: '#c08a58' }); B.add(KIT.rbox(7, 5, 5, 1, 2), MAT.vc, [x + 9, 15, z - 1], null, null, { tint: '#3a3040' }); B.box(MAT.vc, x - 9, 12.5, z - 2, x - 3, 13.3, z + 3, { tint: '#f4ecd8' }); },
    cubeShelf(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 7, 22, z + 3, { uv: [16, 16] }); for (const y of [2, 9, 16]) { B.box(MAT.vc, x - 6.5, y, z - 3, x + 6.5, y + .7, z + 3.2, { tint: '#5a3a22', ink: 0 }); for (let i = 0; i < 3; i++) B.add(KIT.rbox(3.4, 3.4, 3.4, .7, 2), MAT.vc, [x - 4 + i * 4, y + 2.5, z + 1], [0, i * .3, 0], null, { tint: (v) => rgb(v.y > y + 2.5 ? (y === 16 ? '#b07ae8' : '#9a6ad8') : '#4a7af0'), ink: .4 }); } },
    bed(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 5, x + 7, 7, z + 15, { uv: [16, 16] }); B.box(MAT.wood, x - 7, 0, z - 6, x + 7, 15, z - 4, { uv: [16, 16] }); B.add(KIT.rbox(13, 3, 18, 1.2, 2), MAT.vc, [x, 8, z + 5], null, null, { tint: '#3a6ae8' }); B.add(KIT.rbox(10, 3, 5, 1.2, 2), MAT.vc, [x, 9, z - 1.5], null, null, { tint: '#ffffff' }); },
    dresser(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 7, 16, z + 3, { uv: [16, 16] }); for (const y of [3, 8, 13]) { B.box(MAT.vc, x - 6, y - 1.8, z + 3, x + 6, y + 1.8, z + 3.4, { tint: '#9a6a40', ink: .3 }); B.box(MAT.vc, x - 1, y - .4, z + 3.4, x + 1, y + .4, z + 4, { tint: '#f0c040', ink: 0 }); } },
    stove(B, x, z) { B.box(MAT.stone, x - 7, 0, z - 4, x + 7, 13, z + 3, { uv: [16, 16] }); B.box(MAT.vc, x - 3.5, 2, z + 2.9, x + 3.5, 8, z + 3.3, { tint: '#2a1a14', ink: 0 }); B.add(KIT.lathe([[3, 5], [3.4, 4], [3.2, 0]], 12), MAT.vc, [x - 2, 13, z], null, null, { tint: '#4a4048' }); B.add(new THREE.CylinderGeometry(1.6, 1.6, 12, 8), MAT.stone, [x + 4, 19, z - 2], null, null, { uv: [16, 16] }); },
    piano(B, x, z) { B.box(MAT.wood, x - 9, 0, z - 4, x + 9, 18, z + 2, { uv: [16, 16] }); B.box(MAT.vc, x - 9, 9, z + 2, x + 9, 11, z + 6, { tint: '#3a2418' }); for (let i = 0; i < 14; i++) B.box(MAT.vc, x - 8.5 + i * 1.22, 11, z + 3, x - 7.5 + i * 1.22, 11.6, z + 6.2, { tint: i % 3 === 2 ? '#2a2020' : '#f8f4ea', ink: 0 }); B.box(MAT.vc, x - 6, 13, z + 2.1, x + 6, 16, z + 2.5, { tint: '#e8d8b0', ink: .3 }); },
    stairs(B, x, z) { for (let i = 0; i < 5; i++) B.box(MAT.wood, x - 7, 0, z - 4 + i * 0, x + 7, 4 + i * 4, z + 4 - i * 1.6, { uv: [16, 16] }); B.box(MAT.vc, x + 7, 0, z - 4, x + 8.5, 26, z - 2.5, { tint: '#5a3a22' }); },
    board(B, x, z) { B.box(MAT.wood, x - 9, 14, z - 4, x + 9, 28, z - 2.6, { uv: [16, 16] }); for (const [dx, dy, c] of [[-5, 24, '#f8f0dc'], [1, 23, '#e8f0ff'], [5, 18, '#fff0c8'], [-3, 18, '#f8e0e0']]) B.box(MAT.vc, x + dx - 2.6, dy - 3, z - 2.6, x + dx + 2.6, dy + 1, z - 2.2, { tint: c, ink: .3 }); },
    table(B, x, z) { B.box(MAT.wood, x - 13, 9, z - 6, x + 13, 11, z + 6, { uv: [16, 16] }); for (const [dx, dz] of [[-11, -4], [11, -4], [-11, 4], [11, 4]]) B.box(MAT.vc, x + dx - 1, 0, z + dz - 1, x + dx + 1, 9, z + dz + 1, { tint: '#5a3a22' }); for (const s of [-1, 1]) { B.box(MAT.wood, x + s * 8 - 3.5, 5, z + 9, x + s * 8 + 3.5, 6.5, z + 14, { uv: [16, 16] }); for (const [dx, dz] of [[-2.5, 0], [2.5, 0]]) B.box(MAT.vc, x + s * 8 + dx - .6, 0, z + 11.5 + dz - .6, x + s * 8 + dx + .6, 5, z + 11.5 + dz + .6, { tint: '#5a3a22', ink: .5 }); } },
  };

  // ---------- the diorama look: the 2D game's own painted map for the ground, its tree pictures as standing cut-outs ----------
  const picTex = {};
  function picture(key, mip) {
    if (picTex[key]) return picTex[key];
    const img = new Image(), t = new THREE.Texture(img);
    img.onload = () => { t.needsUpdate = true; }; img.src = PAINTINGS[key];
    t.magFilter = THREE.NearestFilter; t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = !!mip;
    return (picTex[key] = t);
  }
  // a cut-out: lit like the rest, its see-through hole cut round you like the houses
  function cardMat(tex) {
    const m = new THREE.MeshLambertMaterial({ map: tex, alphaTest: .5, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, KIT.SEE); sh.fragmentShader = 'uniform vec3 uSee;\nuniform float uSeeZ;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + KIT.SEEFN); };
    m.customProgramCacheKey = () => 'cc-card';
    return m;
  }
  const LEAN = .42; // the cut-outs lean back a little toward the camera, so they read at nearly full height
  function cards(list, tex, w, h) {
    const P = [], U = [], N = [], I = [], cl = Math.cos(LEAN), sl = Math.sin(LEAN);
    list.forEach(([x, z, s, flip]) => {
      const hw = w * s / 2, hh = h * s, b = P.length / 3;
      P.push(x - hw, 0, z, x + hw, 0, z, x + hw, hh * cl, z - hh * sl, x - hw, hh * cl, z - hh * sl);
      const u0 = flip ? 1 : 0, u1 = 1 - u0; U.push(u0, 0, u1, 0, u1, 1, u0, 1);
      for (let k = 0; k < 4; k++) N.push(0, sl, cl);
      I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
    const m = new THREE.Mesh(g, cardMat(tex)); m.frustumCulled = false; return m;
  }
  function buildDiorama(info) {
    const map = info.map, g = new THREE.Group(); g.name = 'diorama';
    const pic = PAINTINGS['dio-' + map.id];
    if (pic) {
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(map.w * T, map.h * T), new THREE.MeshLambertMaterial({ map: picture('dio-' + map.id, true), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      pg.rotation.x = -PI / 2; pg.position.set(map.w * T / 2, .15, map.h * T / 2); pg.receiveShadow = true; g.add(pg);
    }
    seed = 4321 + map.w;
    const oak = [], pine = [], put = (tx, ty, j) => (rnd() < (map.pines || .2) ? pine : oak).push([tx * T + 8 + (rnd() - .5) * j, ty * T + 13 + (rnd() - .5) * j * .5, .9 + rnd() * .22, rnd() < .5]);
    const isExitCol = (tx, side) => (map.exits || []).some((e) => e.side === side && tx >= e.x0 - 1 && tx <= e.x1 + 1);
    const isExitRow = (tx, ty) => (map.exits || []).some((e) => (e.side === 'right' && tx >= map.w || e.side === 'left' && tx < 0) && ty >= e.y0 - 1 && ty <= e.y1 + 1);
    map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'T') put(x, y, 4); }));
    for (let ty = -4; ty < map.h + 2; ty++) for (let tx = -3; tx < map.w + 3; tx++) {
      if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) continue;
      if ((ty < 0 && isExitCol(tx, 'top')) || (ty >= map.h && isExitCol(tx, 'bottom')) || isExitRow(tx, ty)) continue;
      put(tx, ty, 8);
    }
    if (oak.length) g.add(cards(oak, picture('tree-oak'), 37, 37));
    if (pine.length) g.add(cards(pine, picture('tree-pine'), 28, 38));
    info.group.add(g);
    return g;
  }
  // which look a place wears: '3d' (the modeled forest) or 'diorama'
  function setLook(info, look) {
    if (!info || !info.map.outdoor) return;
    const dio = look === 'diorama' && !!PAINTINGS['dio-' + info.map.id];
    if (dio && !info.dio) info.dio = buildDiorama(info);
    if (info.dio) info.dio.visible = dio;
    if (info.forest) info.forest.visible = !dio;
    info.diorama = dio;
  }

  // ---------- the fallen log over the trail into the Forest; Farmer Bramble rolls it away ----------
  function makeLog(group, tiles) {
    const xs = tiles.map((t) => t[0]), y = tiles[0][1], x0 = Math.min(...xs) * T - 5, x1 = (Math.max(...xs) + 1) * T + 5, r = 6.5, L = x1 - x0;
    const g = new THREE.Group(); g.position.set((x0 + x1) / 2, r, y * T + 9); group.add(g);
    const B = KIT.builder();
    B.add(new THREE.CylinderGeometry(r, r * 1.05, L, 16, 1), MAT.wood, [0, 0, 0], [0, 0, PI / 2], null, { uv: [32, 24] });
    for (const s of [-1, 1]) {
      B.add(new THREE.CylinderGeometry(r - .5, r - .5, .8, 16), MAT.vc, [s * L / 2, 0, 0], [0, 0, PI / 2], null, { tint: '#e8c890' });
      for (const k of [.3, .6]) B.add(new THREE.TorusGeometry(r * k, .3, 4, 16), MAT.vc, [s * (L / 2 + .45), 0, 0], [0, PI / 2, 0], null, { tint: '#b08850', ink: 0 });
    }
    B.add(new THREE.CylinderGeometry(1.3, 2.1, 8, 8), MAT.wood, [10, 5.5, -1], [-.3, 0, -.55], null, { uv: [8, 8] });
    for (let i = 0; i < 6; i++) B.add(KIT.lumpy(2.4, i, .2), MAT.leaf, [-24 + i * 9, r - 1.2, (i % 2) * 2.5 - 1.2], null, [1, .55, 1], { tint: i % 2 ? '#4f9a40' : '#62b04c' });
    B.build(g, INKPX, { cast: true, receive: true });
    return { g, tiles, gone: false };
  }
  function clearLog(info, anim) {
    const L = info.log; if (!L || L.gone) return Promise.resolve(); L.gone = true;
    for (const [x, y] of L.tiles) info.solid[y * info.map.w + x] = 0;
    if (!anim) { L.g.visible = false; return Promise.resolve(); }
    const p0 = L.g.position.clone();
    return G.tween(1.5, (k) => { const e = G.ease(k); L.g.position.z = p0.z - e * 48; L.g.rotation.x = -e * 48 / 6.5; L.g.position.y = p0.y + Math.sin(k * PI) * 3; }).then(() => { L.g.visible = false; });
  }

  // ---------- building a place ----------
  const cache = {};
  function build(id) {
    if (cache[id]) return cache[id];
    const map = MAPS[id], group = new THREE.Group(); group.name = id; map.id = id;
    const solid = new Uint8Array(map.w * map.h);
    map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (SOLID[c]) solid[y * map.w + x] = 1; }));
    const B = KIT.builder(), info = { map, group, solid, doors: {}, furn: {}, smoke: [], lights: [], spin: [] };
    if (map.outdoor) {
      info.ground = ground(map, group);
      info.forest = forest(map, group);
      tallGrass(map, group);
      seed = 31;
      map.rows.forEach((r, y) => [...r].forEach((c, x) => {
        const cx = x * T + 8, cz = y * T + 8;
        if (c === '*') PROPS.flowers(B, cx, cz, x * 13 + y);
        if (c === 'o') PROPS.boulder(B, cx, cz);
        if (c === 'S') PROPS.sign(B, cx, cz + 2);
      }));
      for (const b of map.buildings) {
        const o = { X0: b.x * T, Z0: b.y * T, W: b.w * T, D: b.h * T, door: b.door, x: b.x };
        const h = HOUSES[b.kind](B, o);
        for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) solid[(b.y + j) * map.w + b.x + i] = 1;
        solid[b.door[1] * map.w + b.door[0]] = 0;
        const dx = b.door[0] * T + 3;
        B.box(MAT.vc, dx - 1.4, 0, h.zf - .2, dx + 11.4, (h.round ? 20 : 22) + 1.4, h.zf + .7, { tint: '#5a3a22' });
        B.box(MAT.stone, dx - 2, 0, h.zf, dx + 12, 1.4, h.zf + 4.5, { uv: [16, 16] });
        info.doors[b.id] = Object.assign(doorPanel(group, dx, h.zf, b.kind === 'hut' ? '#c8e8d8' : b.kind === 'willow' ? '#7a5232' : '#8a5a34', h.round), { tile: b.door, room: DOORS[b.id] });
        if (o.smoke) info.smoke.push(o.smoke);
        if (o.cubeSign) { const cube = makeCube(); cube.root.scale.setScalar(36); cube.root.position.set(...o.cubeSign); group.add(cube.root); info.spin.push(cube.root); }
      }
      for (const d of map.decor) { PROPS[d.k](B, d.x * T + 8, d.y * T + 9, d.x); if (d.solid !== false) solid[d.y * map.w + d.x] = 1; }
      const gate = []; map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '=') gate.push([x, y]); }));
      if (gate.length) info.log = makeLog(group, gate);
    } else {
      // a room: floor, the back wall with its windows, side walls, a low front wall with the doorway, and the furniture
      const W = map.w * T, H = map.h * T, z0 = 2 * T, z1 = (map.h - 1) * T, x0 = T, x1 = W - T, WH = 46;
      const fmat = map.rows[2][1] === 'c' ? MAT.checker : MAT.floor;
      B.box(fmat, x0, -2, z0, x1, 0, z1 + T, { uv: [32, 32], ink: 0 });
      B.box(MAT.wallIn, x0, 0, z0 - 4, x1, WH, z0, { uv: [32, 64], ink: .5 });
      for (const s of [-1, 1]) { const xw = s < 0 ? x0 : x1; B.box(MAT.wallIn, xw - (s < 0 ? 4 : 0), 0, z0 - 4, xw + (s < 0 ? 0 : 4), WH, z1 + T, { uv: [32, 64], ink: .5 }); }
      const mx0 = map.exits[0].x0 * T, mx1 = (map.exits[0].x1 + 1) * T;
      B.box(MAT.wallIn, x0 - 4, 0, z1 + T - 3, mx0, 8, z1 + T + 1, { uv: [32, 64], ink: .5 }); B.box(MAT.wallIn, mx1, 0, z1 + T - 3, x1 + 4, 8, z1 + T + 1, { uv: [32, 64], ink: .5 });
      B.box(MAT.vc, mx0 + 2, 0, z1 + 2, mx1 - 2, .4, z1 + T - 2, { tint: '#b84a3a', ink: .3 });
      [...map.rows[1]].forEach((c, x) => { if (c !== 'w') return; const wx = x * T + 8; B.box(MAT.glow, wx - 6, 18, z0 - .2, wx + 6, 32, z0 + .4, { tint: (v) => rgb(v.y > 25 ? '#d8f0ff' : '#a8d8f4'), ink: 0 }); B.box(MAT.vc, wx - 7, 17, z0, wx + 7, 18, z0 + 1.5, { tint: '#8a5e36', ink: .3 }); B.box(MAT.vc, wx - 7, 32, z0, wx + 7, 33, z0 + 1, { tint: '#8a5e36', ink: .3 }); B.box(MAT.vc, wx - .5, 18, z0, wx + .5, 32, z0 + .9, { tint: '#8a5e36', ink: 0 }); B.box(MAT.vc, wx - 8.5, 15, z0, wx - 6, 34, z0 + 1.2, { tint: '#e86a5a', ink: .3 }); B.box(MAT.vc, wx + 6, 15, z0, wx + 8.5, 34, z0 + 1.2, { tint: '#e86a5a', ink: .3 }); });
      if (map.rug) { const [rx, ry, rw, rh] = map.rug; B.box(MAT.vc, rx * T + 2, 0, ry * T + 2, (rx + rw) * T - 2, .4, (ry + rh) * T - 2, { tint: '#e8c060', ink: .3 }); B.box(MAT.vc, rx * T + 4, 0, ry * T + 4, (rx + rw) * T - 4, .6, (ry + rh) * T - 4, { tint: '#c84a3a', ink: 0 }); B.box(MAT.vc, rx * T + 7, 0, ry * T + 7, (rx + rw) * T - 7, .7, (ry + rh) * T - 7, { tint: '#b03a32', ink: 0 }); }
      for (const d of map.decor) {
        const fx = d.x * T + 8 + (d.dx || 0), fz = d.y * T + (d.y === 2 ? 5 : 8);
        if (d.k) FURN[d.k](B, fx, fz);
        solid[d.y * map.w + d.x] = 1;
        if (d.k === 'fireplace') { const L = new THREE.PointLight('#ffa040', 1.2, 120, 1.6); L.position.set(fx, 8, fz + 8); L.userData.base = 1.2; group.add(L); info.lights.push(L); }
        if (d.k === 'starterTable') info.starterTable = { x: fx, z: fz, y: 12 };
      }
    }
    B.build(group, INKPX, { cast: true, receive: true });
    group.traverse((o) => { if (o.isMesh && o.material === MAT.glow) o.castShadow = false; });
    info.solid = solid;
    info.tileAt = (x, y) => (x >= 0 && y >= 0 && x < map.w && y < map.h ? map.rows[y][x] : 'T');
    info.solidAt = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || !!solid[y * map.w + x];
    cache[id] = info;
    return info;
  }
  function update(info, t, dt) {
    KIT.WIND.uT.value = t; GRASSU.uT.value = t;
    if (info.ground && info.ground.water) info.ground.water.uT.value = t;
    for (const s of info.spin) { s.rotation.y = t * 1.2; s.position.y = s.userData.y0 === undefined ? (s.userData.y0 = s.position.y) : s.userData.y0 + Math.sin(t * 2) * 1.5; }
    for (const L of info.lights) L.intensity = L.userData.base * (.85 + .15 * Math.sin(t * 13) * Math.sin(t * 5.3));
  }
  return { MAPS, DOORS, T, build, update, setLook, clearLog, GRASSU, PXINK, MAT, TUFT, grassMat };
})();
