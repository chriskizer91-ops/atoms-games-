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
  // Chapter 1: everything is re-skinned with the painted tiles (tiles.js) and lit smoothly (KIT.paint), no cel bands or
  // ink, to match our painted models. Each tile starts as the old canvas texture above and turns painted when it loads.
  const PT = (name, old) => TILES.tex(name, old);
  const pm = (map, o) => KIT.paint('#ffffff', Object.assign({ vc: true, see: SEE }, o || {}, { mat: { map } }));
  const MAT = {
    vc: KIT.paint('#ffffff', { vc: true, see: SEE }),
    plain: KIT.paint('#ffffff', { vc: true }),
    leaf: KIT.paint('#ffffff', { vc: true, sway: 14, see: SEE }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    // walls: each house kind its own (the earlier demo's colours: cream plaster, red barn boards, white hut boards, Willow's planks)
    plaster: pm(PT('plaster_cream', TX.plaster)), barn: pm(PT('boards_red', TX.barn)), hutWall: pm(PT('boards_white')),
    wood: pm(PT('planks_light', TX.wood)), woodDark: pm(PT('planks_dark', TX.wood)), polished: pm(PT('wood_polished', TX.wood)), cream: pm(PT('wood_cream')), bark: pm(PT('bark', TX.wood)),
    stone: pm(PT('cobblestone', TX.stone)), brick: pm(PT('brick_red', TX.stone)), hearth: pm(PT('stone_sandy', TX.stone)), iron: pm(PT('iron_rivets')), rock: pm(PT('rock', TX.stone)),
    // roofs: your house red, the shop purple, the inn orange, the barn's shingles, Willow's moss, the hut's mint stripes
    roofRed: pm(PT('roof_red', roofTex('#c84a3a', '#8a2a22', '#e06a52'))), roofOrange: pm(PT('roof_orange', roofTex('#e8743a', '#b04a22', '#f8945a'))),
    roofPurple: pm(PT('roof_purple', roofTex('#7a5ac8', '#4e3690', '#9a7ae0'))), roofBarn: pm(PT('shingles_barn', roofTex('#a8342a', '#7a2a22', '#c84a3a'))),
    roofMoss: pm(PT('roof_moss')), roofMint: pm(PT('stripes_mint')),
    hay: pm(PT('hay')), leaves: pm(PT('leaves'), { sway: 14 }), leavesFlowers: pm(PT('leaves_flowers'), { sway: 14 }), leavesBerries: pm(PT('leaves_berries'), { sway: 14 }),
    // rooms (no see-through indoors)
    floor: pm(PT('floorboards', TX.floor), { see: false }), checker: pm(PT('checker_mint', TX.checker), { see: false }), wallIn: pm(PT('plaster_cream', TX.wallIn), { see: false }),
    rugRed: pm(PT('rug_red'), { see: false }), rugBlue: pm(PT('rug_blue'), { see: false }), quilt: pm(PT('quilt'), { see: false }), doormat: pm(PT('doormat'), { see: false }),
  };
  for (const k in MAT) MAT[k].vertexColors = true;
  // a sticker (door, window, sign, furniture front...) as a flat panel w x h centred at p, facing +Z turned by ry (and tilted by rx)
  const sticker = (B, name, p, w, h, ry, rx) => B.add(TILES.PLANE, TILES.stickerMat(name), p, [rx || 0, ry || 0, 0, 'YXZ'], [w, h || w / TILES.aspect(name), 1], { ink: 0 });
  const stickerH = (name, w) => w / TILES.aspect(name);
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
    const make = (fn) => { const B = KIT.builder(), g = new THREE.Group(); fn(B); B.build(g, null); return g.children.map((m) => m.geometry); };
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
  // roof tiles: rows run along the ridge and stand upright on both slopes (u along x, v up the slope)
  const roofUV = (sx, sy) => (v) => [v.x / sx, v.y / sy];
  function gableHouse(B, o) {
    const { X0, Z0, W, D, wall, roof, roofCol, door, windows, WH } = o;
    const x0 = X0 + 2, x1 = X0 + W - 2, zb = Z0 + 6, zf = Z0 + D - 2, depth = zf - zb, zc = (zf + zb) / 2, rise = depth * .5, RH = WH + rise, ov = 5, ovs = 4, slope = rise / (depth / 2);
    B.box(MAT[wall], x0, 0, zb, x1, WH, zf, { uv: [36, 36] });
    for (const [x, s] of [[x0, -1], [x1, 1]]) { // the gable ends
      const g = new THREE.BufferGeometry(), P = s < 0 ? [x, WH, zb, x, WH, zf, x, RH, zc] : [x, WH, zf, x, WH, zb, x, RH, zc];
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); B.add(g, MAT[wall], null, null, null, { uv: [36, 36] });
    }
    const L = Math.hypot(depth / 2 + ov, rise + ov * slope), ang = Math.atan2(rise, depth / 2);
    for (const s of [1, -1]) {
      const cz = zc + s * (depth / 2 + ov) / 2, cy = RH - (rise + ov * slope) / 2;
      B.add(KIT.BOXG, MAT[roof], [(x0 + x1) / 2, cy, cz], [s * ang, 0, 0], [x1 - x0 + ovs * 2, 2.4, L], { uvf: roofUV(26, 18) });
    }
    B.box(MAT.vc, x0 - ovs, RH - 1, zc - 2, x1 + ovs, RH + 1.8, zc + 2, { tint: roofCol });
    B.box(MAT.stone, x0 - .4, 0, zf - .5, x1 + .4, 3.4, zf + .9, { uv: [20, 20] });
    for (const cx of windows) { // windows: the painted window, a cream sill, flower boxes
      const wx = X0 + cx * T + 8, ww = 14, wh = stickerH('window', ww), wy = 18;
      B.box(MAT.woodDark, wx - ww / 2 + 1, wy - wh / 2 + 1, zf - .1, wx + ww / 2 - 1, wy + wh / 2 - 1, zf + .15, { uv: [16, 16] });
      sticker(B, 'window', [wx, wy, zf + .35], ww, wh);
      B.box(MAT.cream, wx - ww / 2 - .6, wy - wh / 2 - 1.6, zf, wx + ww / 2 + .6, wy - wh / 2 - .3, zf + 2.2, { uv: [12, 12] });
      if (o.boxes) { const y0 = wy - wh / 2 - 1.6; B.box(MAT.woodDark, wx - ww / 2, y0 - 3.2, zf + .6, wx + ww / 2, y0, zf + 3.6, { uv: [12, 12] }); for (let k = 0; k < 6; k++) B.add(KIT.lumpy(1, k, .1), MAT.vc, [wx - ww / 2 + 1.6 + k * 2.2, y0 + .6 + (k % 2) * .6, zf + 2.2], null, .9, { tint: ['#e84838', '#f8d040', '#f07ab0', '#ffffff'][(k + Math.round(cx)) % 4] }); }
    }
    return { zf, RH, zc, x0, x1, slope, WH };
  }
  // a door on a hinge at its left edge, to swing open: the painted door on a plank backing
  function doorPanel(group, x, zf, kind, round) {
    const pivot = new THREE.Group(); pivot.position.set(x, 0, zf + .6); group.add(pivot);
    const B = KIT.builder(), w = DOORW, h = round ? 19 : 20.5, name = round ? 'door_round' : 'door';
    if (!round) B.box(MAT.woodDark, .3, 0, -.5, w - .3, h - .3, .3, { uv: [16, 16] });
    sticker(B, name, [w / 2, h / 2, .45], w, h);
    sticker(B, name, [w / 2, h / 2, -.65], w, h, PI);
    B.build(pivot, null);
    pivot.traverse((m) => { if (m.isMesh && m.material.userData.sticker) m.castShadow = false; });
    return { pivot, set open(k) { pivot.rotation.y = k * 1.6; } };
  }
  const DOORW = 13;
  const HOUSES = {
    home(B, o) {
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofRed', roofCol: '#8a2a22', WH: 30, windows: [0.3, 2.95], boxes: true }));
      const c0 = o.X0 + 10, c1 = c0 + 7, cz1 = h.zc - 3, yb = h.RH - (h.zc - cz1) * h.slope - 3; // a brick chimney
      B.box(MAT.brick, c0, yb, h.zc - 10, c1, h.RH + 8, cz1, { uv: [14, 14] }); B.box(MAT.vc, c0 - .8, h.RH + 8, h.zc - 10.8, c1 + .8, h.RH + 9.6, cz1 + .8, { tint: '#787078' });
      o.smoke = [(c0 + c1) / 2, h.RH + 10, h.zc - 6.5];
      return h;
    },
    shop(B, o) {
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofPurple', roofCol: '#4e3690', WH: 30, windows: [0.4] }));
      // a striped awning over the front
      const ax0 = o.X0 + 1, ax1 = o.X0 + o.W - 1, az = h.zf;
      for (let i = 0; i < 8; i++) { const sx0 = ax0 + (ax1 - ax0) * i / 8, sx1 = ax0 + (ax1 - ax0) * (i + 1) / 8; B.add(KIT.BOXG, MAT.vc, [(sx0 + sx1) / 2, 27, az + 4.5], [.55, 0, 0], [sx1 - sx0, .8, 11], { tint: i % 2 ? '#f4f0f8' : '#3a6ae8' }); }
      for (let i = 0; i < 8; i++) { const sx = ax0 + (ax1 - ax0) * (i + .5) / 8; B.add(new THREE.CylinderGeometry(2.2, 2.2, .8, 10, 1, false, 0, PI), MAT.vc, [sx, 23.4, az + 9.2], [0, 0, PI / 2], [1, 1, 1], { tint: i % 2 ? '#f4f0f8' : '#3a6ae8' }); }
      // crates of cubes by the door
      B.box(MAT.wood, o.X0 + 49, 0, h.zf + 2, o.X0 + 59, 7, h.zf + 10, { uv: [14, 14] });
      for (let k = 0; k < 4; k++) B.add(KIT.rbox(3.4, 3.4, 3.4, .7, 2), MAT.vc, [o.X0 + 51.5 + (k % 2) * 4.6, 8.7, h.zf + 4 + Math.floor(k / 2) * 4], [0, k * .4, 0], null, { tint: (v, n) => rgb(v.y > 8.7 ? '#9a6ad8' : '#4a7af0') });
      o.cubeSign = [o.X0 + o.W / 2, h.RH + 13, h.zc + 2];
      return h;
    },
    inn(B, o) { // Rosa's Inn: half-timbered cream walls, an orange tiled roof, a porch with its own little roof, the painted sign
      const h = gableHouse(B, Object.assign(o, { wall: 'plaster', roof: 'roofOrange', roofCol: '#a8441c', WH: 32, windows: [0.3, 2.95] }));
      const x0 = h.x0, x1 = h.x1, zf = h.zf;
      for (const x of [x0, (x0 + x1) / 2 - 9, (x0 + x1) / 2 + 9, x1]) B.box(MAT.woodDark, x - 1, 0, zf - .1, x + 1, h.WH, zf + .9, { uv: [10, 10] });
      for (const y of [h.WH - 1.5, 9]) B.box(MAT.woodDark, x0, y - .8, zf - .1, x1, y + .8, zf + .9, { uv: [10, 10] });
      // the porch: posts, a slanted roof, a deck
      const px0 = o.X0 + (o.door[0] - o.x) * T - 8, px1 = px0 + 30, pz = zf + 9;
      for (const x of [px0, px1]) B.box(MAT.wood, x - 1, 0, pz - 1, x + 1, 20, pz + 1, { uv: [8, 8] });
      B.add(KIT.BOXG, MAT.roofOrange, [(px0 + px1) / 2, 21.5, zf + 5], [.38, 0, 0], [px1 - px0 + 6, 1.6, 12], { uvf: roofUV(20, 12) });
      B.box(MAT.wood, px0 - 2, 0, zf, px1 + 2, 1.2, pz + 2, { uv: [14, 14] });
      // the sign, hanging from a bracket at the side
      const sx = x0 - 3; B.box(MAT.woodDark, sx - 8, 26, zf + 2, sx + 1, 27, zf + 3, { uv: [8, 8] });
      for (const dx of [-6.6, -1.4]) B.box(MAT.vc, sx + dx - .2, 23.5, zf + 2.4, sx + dx + .2, 26, zf + 2.6, { tint: '#3a3448' });
      sticker(B, 'sign_inn', [sx - 4, 19.5, zf + 2.5], 9.5);
      sticker(B, 'sign_inn', [sx - 4, 19.5, zf + 2.4], 9.5, null, PI);
      // a brick chimney
      const c0 = x1 - 14, cz1 = h.zc - 3, yb = h.RH - (h.zc - cz1) * h.slope - 3;
      B.box(MAT.brick, c0, yb, h.zc - 10, c0 + 7, h.RH + 8, cz1, { uv: [14, 14] });
      o.smoke = [c0 + 3.5, h.RH + 10, h.zc - 6.5];
      return h;
    },
    barn(B, o) { // Farmer Bramble's farmhouse: red boards, white trim, shingles, a cupola with a rooster on top, hay by the door
      const h = gableHouse(B, Object.assign(o, { wall: 'barn', roof: 'roofBarn', roofCol: '#7a2a22', WH: 30, windows: [2.95] }));
      const x0 = h.x0, x1 = h.x1, zf = h.zf;
      for (const x of [x0, x1]) B.box(MAT.cream, x - 1, 0, zf - .2, x + 1, h.WH, zf + 1, { uv: [8, 8] });
      B.box(MAT.cream, x0, h.WH - 1.4, zf - .2, x1, h.WH, zf + 1, { uv: [8, 8] });
      const cx = (x0 + x1) / 2, cz = h.zc;
      B.box(MAT.barn, cx - 4.5, h.RH - 1, cz - 4.5, cx + 4.5, h.RH + 7, cz + 4.5, { uv: [16, 16] });
      B.add(new THREE.ConeGeometry(7, 6, 4), MAT.roofBarn, [cx, h.RH + 10, cz], [0, PI / 4, 0], null, { uvs: [2, .5] });
      B.add(new THREE.CylinderGeometry(.4, .4, 6, 6), MAT.vc, [cx, h.RH + 15, cz], null, null, { tint: '#3a3448' });
      B.add(KIT.slab([[-3, 0], [2, 0], [3.5, 2.5], [1, 4], [-1, 3], [-3.5, 4.5], [-2.5, 1.5]], .6, .2), MAT.vc, [cx, h.RH + 17, cz], null, null, { tint: '#3a3448' });
      for (const [hx, hz] of [[x1 + 3, zf + 6], [x1 + 9, zf + 4], [x1 + 5, zf + 12]]) hayBale(B, hx, 0, hz, 7, 5, 5);
      return h;
    },
    hut(B, o) { // the Healing Hut: round, white boards with a wooden band, a striped mint-and-white roof, the heart sign over the door
      const cx = o.X0 + (o.door[0] - o.x) * T + 8, cz = o.Z0 + o.D / 2 + 2, r = Math.min(o.W, o.D) / 2 - 1, zf = cz + r;
      B.add(new THREE.CylinderGeometry(r, r + .5, 30, 28), MAT.hutWall, [cx, 15, cz], null, null, { uvs: [5, 1] });
      B.add(new THREE.CylinderGeometry(r + .8, r + .8, 3, 28), MAT.stone, [cx, 1.5, cz], null, null, { uvs: [9, .15] });
      B.add(new THREE.CylinderGeometry(r + .6, r + .6, 2, 28), MAT.woodDark, [cx, 29, cz], null, null, { uvs: [8, .1] });
      B.add(new THREE.ConeGeometry(r + 6, 26, 28, 3), MAT.roofMint, [cx, 43, cz], null, null, { uvs: [4, 1] });
      B.add(new THREE.SphereGeometry(2.6, 12, 8), MAT.vc, [cx, 57, cz], null, null, { tint: '#e85a8a' });
      for (const s of [-1, 1]) { const wx = cx + s * 13, wz = cz + Math.sqrt(r * r - 169); sticker(B, 'window_round', [wx, 17, wz + .4], 10.5, null, Math.atan2(wx - cx, wz - cz)); }
      sticker(B, 'sign_heart', [cx, 33.5, zf + 1.2], 11);
      return { zf: zf - .3, RH: 56 };
    },
    willow(B, o) { // Elder Willow's: stone footing, plank walls, a deep mossy roof, round windows and a round-topped door
      const x0 = o.X0 + 2, x1 = o.X0 + o.W - 2, zb = o.Z0 + 6, zf = o.Z0 + o.D - 2, zc = (zb + zf) / 2;
      B.box(MAT.stone, x0 - 1, 0, zb - 1, x1 + 1, 7, zf + 1, { uv: [20, 20] });
      B.box(MAT.wood, x0, 7, zb, x1, 28, zf, { uv: [30, 30] });
      // the roof: a long, rounded mound of moss and leaves
      const RH = 46, rise = RH - 26, rr = (zf - zb) / 2 + 7;
      B.add(new THREE.CylinderGeometry(rr, rr, x1 - x0 + 8, 20, 1, false, -PI / 2, PI), MAT.roofMoss, [(x0 + x1) / 2, 26, zc], [0, 0, PI / 2], [1, 1, rise / rr * 1.05], { uvs: [3, 4.5], tint: '#e4ecd4' });
      for (const sx of [x0 - 4, x1 + 4]) B.add(new THREE.CircleGeometry(rr, 20, -PI / 2, PI), MAT.roofMoss, [sx, 26, zc], [0, sx < x0 ? -PI / 2 : PI / 2, 0], [1, rise / rr * 1.05, 1], { uv: [16, 16], tint: '#d4e0c4' });
      seed = 42;
      for (let i = 0; i < 18; i++) { const u = rnd(), th = .25 + rnd() * (PI - .5); const x = x0 - 3 + u * (x1 - x0 + 6), zz = zc + Math.cos(th) * rr, y = 26 + Math.sin(th) * rise * 1.05; B.add(KIT.lumpy(3.5 + rnd() * 3, i, .25), MAT.leaves, [x, y, zz], [rnd(), rnd(), 0], [1, .6, 1], { uv: [10, 10] }); }
      for (let i = 0; i < 9; i++) { const x = x0 + 2 + i * (x1 - x0 - 4) / 8; B.add(KIT.lumpy(2.2, i, .2), MAT.leaves, [x, 25 - (i % 2) * 2, zf + 4], null, [1, 1.4, 1], { uv: [8, 8] }); }
      // round windows, a chimney of stones, flower pots
      for (const cx of [o.X0 + 14, o.X0 + o.W - 14]) sticker(B, 'window_round', [cx, 17, zf + .35], 12);
      B.add(new THREE.CylinderGeometry(4, 4.5, 16, 10), MAT.stone, [x1 - 10, RH + 2, zc - 4], null, null, { uvs: [1.5, 1] });
      for (const [px, c] of [[o.X0 + 6, '#e84838'], [o.X0 + o.W - 7, '#f8d040']]) { B.add(new THREE.CylinderGeometry(2.6, 2, 4, 10), MAT.vc, [px, 2, zf + 4], null, null, { tint: '#b86a3a' }); B.add(KIT.lumpy(3, px, .2), MAT.leavesFlowers, [px, 6, zf + 4], null, null, { uv: [6, 6] }); }
      o.smoke = [x1 - 10, RH + 11, zc - 4];
      return { zf, RH, round: true };
    },
  };
  // a hay bale: painted hay, its painted end showing on the front
  function hayBale(B, x, y, z, w, h, d) {
    B.box(MAT.hay, x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, { uv: [8, 8] });
    sticker(B, 'hay_bale_end', [x, y + h / 2, z + d / 2 + .08], w * .98, h * .98);
  }

  // ---------- props ----------
  const PROPS = {
    lamp(B, x, z) { B.add(new THREE.CylinderGeometry(1, 1.3, 22, 8), MAT.iron, [x, 11, z], null, null, { uvs: [.5, 2] }); B.add(new THREE.CylinderGeometry(3, 3.4, 2, 8), MAT.iron, [x, 1, z], null, null, { uvs: [1, .2] }); B.box(MAT.iron, x - .5, 21, z - .5, x + 6, 22, z + .5, { uv: [8, 8] });
      B.add(new THREE.CylinderGeometry(1.9, 1.4, 4.2, 6), MAT.glow, [x + 5.5, 18, z], null, null, { tint: '#ffe08a' }); sticker(B, 'lamp_glass', [x + 5.5, 18.3, z + 2.1], 5.2); B.add(new THREE.ConeGeometry(2.8, 2.4, 6), MAT.iron, [x + 5.5, 21.4, z], null, null, { uvs: [1, .3] }); },
    barrel(B, x, z) { B.add(KIT.lathe([[5, 13], [6, 9], [6.2, 6.5], [6, 4], [5, 0]], 14), MAT.wood, [x, 0, z], null, null, { uvs: [2, 1] }); for (const y of [2.5, 10.5]) B.add(new THREE.TorusGeometry(5.8, .55, 5, 16), MAT.iron, [x, y, z], [PI / 2, 0, 0], null, { uvs: [4, .2] }); sticker(B, 'barrel_top', [x, 13.05, z], 10.2, 10.2, 0, -PI / 2); },
    crates(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 2, 9, z + 5, { uv: [12, 12] }); B.box(MAT.wood, x + 1, 0, z - 2, x + 7, 6, z + 4, { uv: [12, 12] }); B.box(MAT.wood, x - 5, 9, z - 3, x + 1, 15, z + 3, { uv: [12, 12] }); },
    mailbox(B, x, z) { B.box(MAT.woodDark, x - .8, 0, z - .8, x + .8, 6, z + .8, { uv: [6, 6] }); B.box(MAT.barn, x - 4, 6, z - 2.6, x + 4, 13.5, z + 2.6, { uv: [10, 10] }); sticker(B, 'mailbox', [x, 10.6, z + 2.7], 9.6); },
    hay(B, x, z) { for (const [dx, dz, y] of [[-4, 0, 0], [4, 0, 0], [0, 1, 7]]) hayBale(B, x + dx, y, z + dz, 8.4, 7, 10); },
    bench(B, x, z) { B.box(MAT.wood, x - 9, 4.5, z - 2.5, x + 9, 6, z + 2.5, { uv: [12, 12] }); B.box(MAT.wood, x - 9, 6, z - 3, x + 9, 11, z - 2, { uv: [12, 12] }); for (const dx of [-7, 7]) B.box(MAT.iron, x + dx - .8, 0, z - 2, x + dx + .8, 4.5, z + 2, { uv: [6, 6] }); },
    pots(B, x, z) { B.add(KIT.lathe([[2, 9], [3.5, 8], [5, 5], [4.5, 2], [3, 0]], 14), MAT.vc, [x - 3, 0, z], null, null, { tint: '#d8a070' }); B.add(KIT.lathe([[1.5, 6.5], [2.6, 6], [4, 3.5], [3.4, 1.2], [2.2, 0]], 14), MAT.vc, [x + 4, 0, z + 2], null, null, { tint: '#c86a3a' }); },
    barrow(B, x, z) { B.add(KIT.BOXG, MAT.wood, [x, 6, z], [0, 0, .15], [12, 5, 9], { uv: [10, 10] }); B.add(new THREE.CylinderGeometry(3, 3, 1.5, 12), MAT.woodDark, [x + 7, 3, z], [PI / 2, 0, 0], null, { uvs: [1, 1] }); for (const s of [-1, 1]) B.box(MAT.woodDark, x - 9, 4, z + s * 3 - .5, x - 4, 5, z + s * 3 + .5, { uv: [6, 6] }); },
    bush(B, x, z, k, mat) { B.add(KIT.lumpy(7, x, .2), mat || MAT.leaves, [x, 5, z], null, [1, .8, 1], { uv: [13, 13] }); B.add(KIT.lumpy(5, x + 1, .2), mat || MAT.leaves, [x - 4, 4, z + 2], null, [1, .8, 1], { uv: [13, 13] }); },
    flowerbush(B, x, z, k) { PROPS.bush(B, x, z, k, MAT.leavesFlowers); },
    berrybush(B, x, z, k) { PROPS.bush(B, x, z, k, MAT.leavesBerries); },
    rock(B, x, z) { B.add(KIT.lumpy(7, x, .25), MAT.rock, [x, 3, z], [0, x, 0], [1, .6, .9], { uv: [12, 12] }); },
    boulder(B, x, z) { B.add(KIT.lumpy(7.5, x + z, .25), MAT.rock, [x, 4, z], [0, x, 0], [1, .7, .9], { uv: [12, 12] }); },
    lily(B, x, z) { B.add(new THREE.CylinderGeometry(5, 5, .6, 16, 1, false, .4, TAU - .8), MAT.vc, [x, -1.8, z], null, null, { tint: '#4fa040' }); B.add(KIT.lumpy(1.4, x, .2), MAT.vc, [x + 1, -.8, z], null, null, { tint: '#f8a0c8' }); },
    sign(B, x, z) { B.box(MAT.woodDark, x - .8, 0, z - .8, x + .8, 10, z + .8, { uv: [6, 6] }); B.box(MAT.wood, x - 6.5, 7, z - .8, x + 6.5, 14.5, z + .8, { uv: [12, 12] }); for (const y of [9.5, 12]) B.box(MAT.vc, x - 4.5, y, z + .8, x + 4.5, y + .7, z + 1, { tint: '#6a4628' }); },
    flowers(B, x, z, k) { seed = k; for (let i = 0; i < 4; i++) { const fx = x - 5 + rnd() * 10, fz = z - 5 + rnd() * 10, h = 2 + rnd() * 2; B.box(MAT.vc, fx - .25, 0, fz - .25, fx + .25, h, fz + .25, { tint: '#3e8a30' }); B.add(new THREE.SphereGeometry(1.3, 6, 4), MAT.vc, [fx, h + .6, fz], null, [1, .6, 1], { tint: ['#f8f0f8', '#f8d040', '#f07ab0'][i % 3] }); } },
  };

  // ---------- furniture for the rooms (h is how tall each stands, as in the game's art); fronts are painted stickers ----------
  const FURN = {
    bookshelf(B, x, z) { B.box(MAT.polished, x - 7, 0, z - 4, x + 7, 24, z + 3, { uv: [14, 14] }); for (const y of [.8, 12]) sticker(B, 'books', [x, y + 5.6, z + 3.1], 13, 11.2); },
    fireplace(B, x, z) { B.box(MAT.hearth, x - 9, 0, z - 4, x + 9, 20, z + 3, { uv: [14, 14] }); B.box(MAT.vc, x - 5, 0, z + 2.8, x + 5, 10, z + 3.2, { tint: '#2a1a14' }); B.box(MAT.polished, x - 10, 20, z - 4.5, x + 10, 22, z + 4, { uv: [14, 14] }); B.add(new THREE.ConeGeometry(2.5, 6, 6), MAT.glow, [x - 1.5, 4, z + 2], null, null, { tint: '#ffb040' }); B.add(new THREE.ConeGeometry(1.8, 5, 6), MAT.glow, [x + 2, 3.5, z + 2], null, null, { tint: '#ffe070' }); },
    clock(B, x, z) { B.box(MAT.polished, x - 4, 0, z - 3, x + 4, 22, z + 3, { uv: [12, 12] }); sticker(B, 'clock_face', [x, 17, z + 3.1], 7.6); B.box(MAT.vc, x - 2.5, 3, z + 3, x + 2.5, 11.5, z + 3.3, { tint: '#3a2418' }); B.add(new THREE.CylinderGeometry(1.3, 1.3, .3, 12), MAT.vc, [x, 5, z + 3.4], [PI / 2, 0, 0], null, { tint: '#e8c050' }); },
    plant(B, x, z) { B.add(KIT.lathe([[3.2, 6], [3.6, 5], [3, 1], [2.4, 0]], 12), MAT.vc, [x, 0, z], null, null, { tint: '#c86a3a' }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.add(KIT.slab([[0, 0], [1.6, 3], [0, 9], [-1.6, 3]], .4, .15), MAT.vc, [x + Math.cos(a), 5.5, z + Math.sin(a)], [-.5, -a + PI / 2, 0, 'YXZ'], null, { tint: i % 2 ? '#4fa040' : '#3a8a34' }); } },
    starterTable(B, x, z) { B.add(new THREE.CylinderGeometry(15, 15, 2, 28), MAT.vc, [x, 11, z], null, [1, 1, .55], { tint: '#4f8a3a' }); B.add(new THREE.CylinderGeometry(15.6, 15.6, 1.2, 28), MAT.polished, [x, 10, z], null, [1, 1, .56], { uvs: [6, .2] }); for (const s of [-1, 1]) B.box(MAT.polished, x + s * 10 - 1, 0, z - 1, x + s * 10 + 1, 10, z + 1, { uv: [6, 6] }); },
    healCounter(B, x, z) { B.add(KIT.rbox(30, 12, 9, 2, 2), MAT.hutWall, [x, 6, z], null, null, { uv: [16, 16] }); B.box(MAT.vc, x - 15, 0, z + 2, x + 15, 6, z + 4.8, { tint: '#8ad8b0' }); sticker(B, 'sign_heart', [x, 7.5, z + 4.6], 6); },
    healMachine(B, x, z) { B.box(MAT.hutWall, x - 7, 0, z - 4, x + 7, 14.5, z + 3.6, { uv: [14, 14] }); sticker(B, 'healing_machine', [x, 7.25, z + 3.7], 14); },
    vault(B, x, z) { B.box(MAT.polished, x - 7, 0, z - 4, x + 7, 15, z + 3.6, { uv: [14, 14] }); sticker(B, 'cube_vault', [x, 7.5, z + 3.7], 14.2); },
    herbShelf(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 3, x + 7, 22, z + 3, { uv: [14, 14] }); sticker(B, 'herb_shelf', [x, 14.5, z + 3.1], 13, 13); B.box(MAT.woodDark, x - 6.5, 1, z + 3, x + 6.5, 7, z + 3.2, { uv: [8, 8] }); },
    cot(B, x, z) { B.box(MAT.wood, x - 6, 0, z - 9, x + 6, 6, z + 9, { uv: [12, 12] }); B.add(KIT.rbox(11, 3, 17, 1.2, 2), MAT.vc, [x, 7, z], null, null, { tint: '#f8f4ea' }); B.add(KIT.rbox(8, 2.4, 5, 1, 2), MAT.vc, [x, 9.5, z - 5.5], null, null, { tint: '#ffffff' }); },
    shopCounter(B, x, z) { B.box(MAT.wood, x - 15, 0, z - 4, x + 15, 11, z + 4, { uv: [14, 14] }); B.box(MAT.polished, x - 15.5, 11, z - 4.5, x + 15.5, 12.5, z + 4.5, { uv: [14, 14] }); B.add(KIT.rbox(7, 5, 5, 1, 2), MAT.iron, [x + 9, 15, z - 1], null, null, { uv: [8, 8] }); B.box(MAT.vc, x - 9, 12.5, z - 2, x - 3, 13.3, z + 3, { tint: '#f4ecd8' }); },
    cubeShelf(B, x, z) { B.box(MAT.wood, x - 7, 0, z - 4, x + 7, 22, z + 3, { uv: [14, 14] }); for (const y of [2, 9, 16]) { B.box(MAT.woodDark, x - 6.5, y, z - 3, x + 6.5, y + .7, z + 3.2, { uv: [8, 8] }); for (let i = 0; i < 3; i++) B.add(KIT.rbox(3.4, 3.4, 3.4, .7, 2), MAT.vc, [x - 4 + i * 4, y + 2.5, z + 1], [0, i * .3, 0], null, { tint: (v) => rgb(v.y > y + 2.5 ? (y === 16 ? '#b07ae8' : '#9a6ad8') : '#4a7af0') }); } },
    bed(B, x, z) { B.box(MAT.polished, x - 7, 0, z - 5, x + 7, 7, z + 15, { uv: [14, 14] }); B.box(MAT.polished, x - 7, 0, z - 6, x + 7, 15, z - 4, { uv: [14, 14] }); B.add(KIT.rbox(13, 3, 18, 1.2, 2), MAT.quilt, [x, 8, z + 5], null, null, { uv: [12, 12] }); B.add(KIT.rbox(10, 3, 5, 1.2, 2), MAT.vc, [x, 9, z - 1.5], null, null, { tint: '#ffffff' }); },
    dresser(B, x, z) { B.box(MAT.polished, x - 7, 0, z - 4, x + 7, 16, z + 3, { uv: [14, 14] }); for (const y of [3, 8, 13]) { B.box(MAT.wood, x - 6, y - 1.8, z + 3, x + 6, y + 1.8, z + 3.4, { uv: [8, 8] }); B.box(MAT.vc, x - 1, y - .4, z + 3.4, x + 1, y + .4, z + 4, { tint: '#f0c040' }); } },
    stove(B, x, z) { B.box(MAT.iron, x - 7, 0, z - 4, x + 7, 13, z + 3, { uv: [12, 12] }); sticker(B, 'stove_front', [x, 6.6, z + 3.1], 14, 13.2); B.add(KIT.lathe([[3, 5], [3.4, 4], [3.2, 0]], 12), MAT.iron, [x - 2, 13, z], null, null, { uvs: [1, .5] }); B.add(new THREE.CylinderGeometry(1.6, 1.6, 12, 8), MAT.iron, [x + 4, 19, z - 2], null, null, { uvs: [.5, 1] }); },
    piano(B, x, z) { B.box(MAT.polished, x - 9, 0, z - 4, x + 9, 18, z + 2, { uv: [14, 14] }); sticker(B, 'piano_front', [x, 9, z + 2.1], 18, 18); },
    stairs(B, x, z) { for (let i = 0; i < 5; i++) B.box(MAT.wood, x - 7, 0, z - 4 + i * 0, x + 7, 4 + i * 4, z + 4 - i * 1.6, { uv: [12, 12] }); B.box(MAT.polished, x + 7, 0, z - 4, x + 8.5, 26, z - 2.5, { uv: [8, 8] }); },
    board(B, x, z) { B.box(MAT.woodDark, x - 8.5, 13.5, z - 4, x + 8.5, 28.5, z - 2.6, { uv: [12, 12] }); sticker(B, 'notice_board', [x, 21, z - 2.5], 17, 15); },
    table(B, x, z) { B.box(MAT.polished, x - 13, 9, z - 6, x + 13, 11, z + 6, { uv: [14, 14] }); for (const [dx, dz] of [[-11, -4], [11, -4], [-11, 4], [11, 4]]) B.box(MAT.polished, x + dx - 1, 0, z + dz - 1, x + dx + 1, 9, z + dz + 1, { uv: [6, 6] }); for (const s of [-1, 1]) { B.box(MAT.wood, x + s * 8 - 3.5, 5, z + 9, x + s * 8 + 3.5, 6.5, z + 14, { uv: [10, 10] }); for (const [dx, dz] of [[-2.5, 0], [2.5, 0]]) B.box(MAT.woodDark, x + s * 8 + dx - .6, 0, z + 11.5 + dz - .6, x + s * 8 + dx + .6, 5, z + 11.5 + dz + .6, { uv: [6, 6] }); } },
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
    B.add(new THREE.CylinderGeometry(r, r * 1.05, L, 16, 1), MAT.bark, [0, 0, 0], [0, 0, PI / 2], null, { uvs: [1.2, 3] });
    for (const s of [-1, 1]) {
      B.add(new THREE.CylinderGeometry(r - .5, r - .5, .8, 16), MAT.vc, [s * L / 2, 0, 0], [0, 0, PI / 2], null, { tint: '#e8c890' });
      for (const k of [.3, .6]) B.add(new THREE.TorusGeometry(r * k, .3, 4, 16), MAT.vc, [s * (L / 2 + .45), 0, 0], [0, PI / 2, 0], null, { tint: '#b08850', ink: 0 });
    }
    B.add(new THREE.CylinderGeometry(1.3, 2.1, 8, 8), MAT.bark, [10, 5.5, -1], [-.3, 0, -.55], null, { uvs: [.5, .5] });
    for (let i = 0; i < 6; i++) B.add(KIT.lumpy(2.4, i, .2), MAT.leaves, [-24 + i * 9, r - 1.2, (i % 2) * 2.5 - 1.2], null, [1, .55, 1], { uv: [7, 7] });
    B.build(g, null, { cast: true, receive: true });
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
        const dx = b.door[0] * T + 8 - DOORW / 2; // the door's left edge (it hinges there)
        if (!h.round) B.box(MAT.woodDark, dx - 1.3, 0, h.zf - .2, dx + DOORW + 1.3, 22, h.zf + .7, { uv: [12, 12] });
        B.box(MAT.stone, dx - 1.5, 0, h.zf, dx + DOORW + 1.5, 1.4, h.zf + 4.5, { uv: [14, 14] });
        info.doors[b.id] = Object.assign(doorPanel(group, dx, h.zf, b.kind, h.round), { tile: b.door, room: DOORS[b.id] });
        if (o.smoke) info.smoke.push(o.smoke);
        if (o.cubeSign) { const cube = makeCube(); cube.root.scale.setScalar(36); cube.root.position.set(...o.cubeSign); group.add(cube.root); info.spin.push(cube.root); }
      }
      for (const d of map.decor) { PROPS[d.k](B, d.x * T + 8, d.y * T + 9, d.x); if (d.solid !== false) solid[d.y * map.w + d.x] = 1; }
      const gate = []; map.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '=') gate.push([x, y]); }));
      if (gate.length) info.log = makeLog(group, gate);
    } else {
      // a room: floor, the back wall with its windows, side walls, a low front wall with the doorway, and the furniture
      const W = map.w * T, H = map.h * T, z0 = 2 * T, z1 = (map.h - 1) * T, x0 = T, x1 = W - T, WH = 46;
      // painted: floorboards (or the hut's mint checker), plaster walls over a dark wainscot, painted windows, a rug, a doormat
      const checker = map.rows[2][1] === 'c', fmat = checker ? MAT.checker : MAT.floor;
      B.box(fmat, x0, -2, z0, x1, 0, z1 + T, { uv: checker ? [64, 64] : [22, 22] });
      B.box(MAT.wallIn, x0, 0, z0 - 4, x1, WH, z0, { uv: [36, 36] });
      for (const s of [-1, 1]) { const xw = s < 0 ? x0 : x1; B.box(MAT.wallIn, xw - (s < 0 ? 4 : 0), 0, z0 - 4, xw + (s < 0 ? 0 : 4), WH, z1 + T, { uv: [36, 36] }); }
      B.box(MAT.woodDark, x0, 0, z0, x1, 13, z0 + .6, { uv: [20, 20] }); B.box(MAT.polished, x0, 13, z0, x1, 14.2, z0 + 1.2, { uv: [12, 12] });
      for (const s of [-1, 1]) { const xw = s < 0 ? x0 : x1 - .6; B.box(MAT.woodDark, xw, 0, z0, xw + .6, 13, z1 + T, { uv: [20, 20] }); }
      const mx0 = map.exits[0].x0 * T, mx1 = (map.exits[0].x1 + 1) * T;
      B.box(MAT.wallIn, x0 - 4, 0, z1 + T - 3, mx0, 8, z1 + T + 1, { uv: [36, 36] }); B.box(MAT.wallIn, mx1, 0, z1 + T - 3, x1 + 4, 8, z1 + T + 1, { uv: [36, 36] });
      B.box(MAT.doormat, mx0 + 2, 0, z1 + 2, mx1 - 2, .4, z1 + T - 2, { uv: [14, 14] });
      [...map.rows[1]].forEach((c, x) => { if (c !== 'w') return; const wx = x * T + 8; B.box(MAT.glow, wx - 6, 19, z0 - .2, wx + 6, 31, z0 + .3, { tint: '#bfe4f4' }); sticker(B, 'window', [wx, 25, z0 + .5], 15.5); });
      if (map.rug) { // the rug's border runs along its long sides: its own uv, the pattern repeating along it
        const [rx, ry, rw, rh] = map.rug, ax0 = rx * T + 2, ax1 = (rx + rw) * T - 2, az0 = ry * T + 2, az1 = (ry + rh) * T - 2, wide = ax1 - ax0 >= az1 - az0;
        const rugMat = map.id === 'shop-in' || map.id === 'inn-in' ? MAT.rugBlue : MAT.rugRed;
        B.box(rugMat, ax0, 0, az0, ax1, .5, az1, { uvf: (v) => (wide ? [(v.x - ax0) / (az1 - az0) * .9, (v.z - az0) / (az1 - az0)] : [(v.z - az0) / (ax1 - ax0) * .9, (v.x - ax0) / (ax1 - ax0)]) });
      }
      for (const d of map.decor) {
        const fx = d.x * T + 8 + (d.dx || 0), fz = d.y * T + (d.y === 2 ? 5 : 8);
        if (d.k) FURN[d.k](B, fx, fz);
        solid[d.y * map.w + d.x] = 1;
        if (d.k === 'fireplace') { const L = new THREE.PointLight('#ffa040', 1.2, 120, 1.6); L.position.set(fx, 8, fz + 8); L.userData.base = 1.2; group.add(L); info.lights.push(L); }
        if (d.k === 'starterTable') info.starterTable = { x: fx, z: fz, y: 12 };
      }
    }
    B.build(group, null, { cast: true, receive: true }); // no ink outlines: painted, as our models
    group.traverse((o) => { if (o.isMesh && (o.material === MAT.glow || o.material.userData.sticker)) o.castShadow = false; });
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
