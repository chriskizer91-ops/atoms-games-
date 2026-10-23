// The expansion, batch 3 (docs/creature-catch-expansion-guide.md, sections 3.1 to 3.4): Willowbrook Orchard off the
// Grassland, Whispering Grove off the Forest, Driftwood Cove off the Lakeshore, and Lantern Isle by boat from the cove.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  var piece = CC.piece, onWall = CC.onWall;
  // a doorway out of a side area: a side or top/bottom edge of one map, and where it lands on the other
  function link(a, ea, b, eb) { CC.MAPS[a].exits.push(Object.assign({ to: b }, ea)); CC.MAPS[b].exits.push(Object.assign({ to: a }, eb)); }
  function setRow(map, y, row) { if (row.length !== map.rows[y].length) throw new Error(map.name + ' row ' + y); map.rows[y] = row; }
  function room(mapId, bid, id, name, decor, extra) {
    var b = CC.MAPS[mapId].buildings.find(function (x) { return x.id === bid; });
    CC.MAPS[id] = CC.room(name, extra && extra.rows || CC.ROOM10, [mapId, b.door[0], b.door[1] + 1], decor, extra);
    CC.DOORS[bid] = id;
    return CC.MAPS[id];
  }
  function people(mapId, list) {
    CC.NPCS[mapId] = (CC.NPCS[mapId] || []).concat(list.map(function (p) {
      if (p.name && p.art) CC.PORTRAITS[p.name] = p.art;
      return Object.assign({ h: 25, dir: 'down' }, p, { talk: p.talk || CC.chat(p.name, p.lines, mapId + p.name) });
    }));
  }
  // a wild battle that starts from something in the world (a fairy ring, a tide pool)
  async function wildFrom(spawn, text) {
    var roll = CC.rollSpawn(spawn);
    await say(text); CC.sfx('encounter');
    await CC.battleTransition();
    await CC.startBattle({ wild: CC.mon.make(roll.id, roll.lv) });
  }
  // the area's landmark: its Keeper if a kid has made one (section 7.3), or its legend line
  function landmark(area, line) { return function () { return CC.keeperAt ? CC.keeperAt(area, line) : say(line); }; }

  // ---------- the tiles ----------
  Object.assign(CC.LEGENDS, {
    // orchard: 0/15 grass, 1/14 tall grass, 2/3/7/13 apple trees, 4 fallen apples, 5 path (paths are drawn as dirt from it), 6 clover, 8/10 fence, 12 hay
    orchard: { atlas: 'orchard', ground: [0, 0, 15, 6], dirtFrom: 5, backdrop: '#2a5a24', trees: ['props/trees-1', 'props/trees-3'], pines: 0.15, treeGround: [0],
      ',': { i: [1, 14] }, r: { i: [4] }, '*': { i: [12] }, f: { i: [8, 10], solid: true, noflip: true }, a: { i: [2, 3, 7], solid: true, noflip: true } },
    // grove: 0/14 moss, 1/10 ferns, 2/11 roots, 3 mushrooms, 4/15 sunlight, 5/9 flowers, 6 trail, 7/13 stream, 8 log, 12 mossy rock
    grove: { rustle: ['#4a9a3a', '#7ac85a', '#2a6a2a'], atlas: 'grove', ground: [0, 14, 0, 9], dirtFrom: 6, backdrop: '#183a1c', trees: ['props/trees-2', 'props/trees-1'], pines: 0.35, treeGround: [0],
      ',': { i: [1, 10] }, r: { i: [4, 15] }, '*': { i: [5, 3] }, x: { i: [2, 11, 12], solid: true, noflip: true }, '~': { water: true } },
    // cove: 0/7/14 sand, 4/11 beach grass, 5/10 tide pools, 6 driftwood
    cove: { rustle: ['#d8c080', '#8ab850', '#f0e0b0'], atlas: 'cove', ground: [0, 14, 0, 7], dirtFrom: null, backdrop: '#e0c890',
      ',': { i: [4, 11] }, ':': { i: [14] }, r: { i: [7, 0] }, x: { i: [5, 10], solid: true }, o: { i: [6], solid: true, noflip: true },
      '~': { water: true }, d: { atlas: 'water-shoreline', i: [10], noflip: true } },
    // isle: 4/5 grass, 6 tall sea grass, 7/9 rocky grass, 8/11 puffin burrows, 10 stone path, 14 cliff rock
    isle: { rustle: ['#8ab850', '#c8e0a0', '#5a8a3a'], atlas: 'isle', ground: [4, 5, 4, 7], dirtFrom: 10, backdrop: '#1a3a6a',
      ',': { i: [6] }, x: { i: [8, 11], solid: true }, o: { i: [14, 9], solid: true }, '~': { water: true }, d: { atlas: 'water-shoreline', i: [10], noflip: true } },
  });
  Object.assign(CC.ART_INFO, {
    'marigold-farmhouse': { door: 0.38, smoke: [0.82, 0.05] }, 'orchard-barn': { door: 0.5 }, 'fennick-treehouse': { door: 0.52 }, 'coral-beach-hut': { door: 0.42 },
    lighthouse: { door: 0.5, width: 40 }, 'wren-cottage': { door: 0.38, smoke: [0.8, 0.04] }, 'small-healing-hut': { door: 0.5 },
  });

  // ================= Willowbrook Orchard =================
  var ORCH = CC.addRegion('orchard', {
    name: 'Willowbrook Orchard', spawns: 'orchard', legend: 'orchard', signArt: 'props/signpost-orchard', landmark: 'props/landmark-oldest-apple-tree', weather: 'leaves',
    buildingIds: [['orchard-farm', 'marigold-farmhouse'], ['orchard-barn', 'orchard-barn']],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......................T',
      'T..BBBB..BBBB*..LLLLL..T',
      'T..BBBB..BBBB*a.LLLLL..T',
      'T..BDBB..BDBB...LLLLL..T',
      'T..:::::::::::.rr:::rr.T',
      'Tffffff::fff::::::::::.T',
      'T.S.........:::........T',
      ':::::::::::::::a.a.a.a.T',
      ':::::::::::::::,,,,,,,.T',
      'T.............:........T',
      'T.,,,,,,,,rrr.:a.a.a.a.T',
      'T.,,,,,,,,rrr.:,,,,,,,.T',
      'T.,,rrr,,,rrr.:........T',
      'T.,,,,,,,,....:a.a.a.a.T',
      'T.,,,,,,,,....:,,,,,,,.T',
      'T***..........:,,,,,,,.T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 14, y: 3, talk: hollowTree }, // the hollow apple tree near the barn
      { x: 6, y: 13, img: 'props/orchard-props-5', h: 20, talk: 'A scarecrow in a straw hat. A Scarecrowl\'s feather is stuck in the brim.' },
      { x: 13, y: 4, img: 'props/orchard-props-1', h: 12 }, { x: 2, y: 5, img: 'props/orchard-props-4', h: 14, talk: 'A beehive, humming happily.' }, { x: 1, y: 5, img: 'props/orchard-props-4', h: 14 },
      { x: 8, y: 1, img: 'props/orchard-props-3', h: 13 }, { x: 22, y: 7, img: 'props/orchard-props-2', h: 18 }, { x: 22, y: 12, img: 'props/orchard-props-6', h: 12 },
      { x: 1, y: 7, img: 'props/orchard-props-7', h: 12 }, { x: 11, y: 7, img: 'props/orchard-props-9', h: 20, talk: 'An apple stand. A sign: "Take one, leave a smile. - Marigold"' },
      { x: 22, y: 5, img: 'props/orchard-props-8', h: 12, talk: 'A basket of golden apples. They fell near the Oldest Apple Tree.' },
      { x: 11, y: 16, chest: 'orchard-1', item: 'superpotion', n: 2 },
    ],
  });
  ORCH.decor.forEach(function (d) { if (d.chest) d.chest = 'orchard-' + d.x + '-' + d.y; });
  ORCH.landmarkTalk = landmark('orchard', 'The Oldest Apple Tree. Its branches creak, and a golden apple drops into the grass. Something huge seems to be napping in the shade beneath it.');
  CC.SIGNS['orchard:2,7'] = 'Willowbrook Orchard. Marigold\'s farmhouse and barn: north. The Oldest Apple Tree: northeast. Please don\'t eat the scarecrow\'s hat.';
  var G = CC.MAPS.grassland;
  setRow(G, 12, 'T,,,,,....::::::::::::::');
  setRow(G, 13, 'T,,,,,,...::::........::');
  link('grassland', { side: 'right', y0: 12, y1: 13, tx: 1, ty0: 8 }, 'orchard', { side: 'left', y0: 8, y1: 9, tx: 22, ty0: 12 });
  CC.SIGNS['grassland:18,14'] = 'Grassland Outpost: free healing and Cube Vault. Willowbrook Orchard: east. Farmer Bramble keeps the north trail to the Forest.';
  async function hollowTree() {
    if (CC.hasPage(2)) { await say('A hollow in the old apple tree. Just a few leaves and a worm, who waves.'); return; }
    await say('There\'s a hollow in this apple tree. Something papery is tucked inside...');
    await CC.givePage(2);
  }
  room('orchard', 'orchard-farm', 'orchard-farm-in', 'Marigold\'s Farmhouse', [
    piece(1, 2, 'farmhouse-1', 20, { glow: true, talk: 'A stove with three pies cooling on top. Apple, apple, and a mystery.' }),
    piece(4, 3, 'farmhouse-2', 15, { dx: 8, talk: 'An apple pie with a note: "For the Wormapple. Sorry. - M."' }), { x: 5, y: 3 },
    piece(3, 3, 'farmhouse-3', 14), piece(6, 3, 'farmhouse-3', 14), piece(6, 2, 'farmhouse-5', 22), piece(8, 2, 'farmhouse-8', 22), piece(8, 5, 'farmhouse-6', 16),
  ], { rug: [3, 4, 4, 2] });
  room('orchard', 'orchard-barn', 'orchard-barn-in', 'The Barn', [
    piece(4, 2, 'barn-1', 20, { dx: 8, talk: function () { return CC.daily('cider', 'potion', 'You turn the cider press. Out comes a bottle of fizzy apple juice... it works just like a Potion!', 'The press is resting. Come back tomorrow for another.'); } }), { x: 5, y: 2 },
    piece(1, 2, 'barn-2', 18), piece(1, 4, 'barn-2', 16), piece(7, 2, 'barn-3', 16), { x: 8, y: 2 }, piece(8, 4, 'barn-4', 20), onWall(3, 'barn-5', 13), piece(7, 5, 'barn-6', 12),
    { x: 2, y: 5, img: 'creatures/wormapple', h: 13, talk: 'A Wormapple is fast asleep in a pile of hay, snoring softly inside its apple.' },
  ], { rows: ['#PPPPPPPP#', '#WWWWWWWW#', '#........#', '#........#', '#........#', '#........#', '####mm####'] });
  people('orchard-farm-in', [
    { x: 2, y: 4, art: 'marigold', name: 'Marigold', dir: 'right', talk: marigold },
    { x: 7, y: 4, art: 'russet', name: 'Russet', lines: {
      early: ['Did you know Scarecrowl only comes out at dusk? I did. I know everything.', 'Tinker says he\'s going to catch a Dandylion. He can\'t even catch a cold.',
        'There\'s a hollow in one of the apple trees near the barn. I found a paper in it but Mom said leave it there.'],
      night: ['Shh! Scarecrowl are out. They\'re not scary. Mostly.'], lead: { Plant: 'A Plant type! Wormapples like Plant types. They\'re probably related. I\'m guessing. I\'m never guessing.' } } },
  ]);
  var marigoldChat = CC.chat('Marigold', {
    early: ['Welcome to Willowbrook! Watch your step, my apples bruise easily, unlike my brother\'s ego.', 'Something huge naps under the Oldest Apple Tree. Every apple that falls near it turns gold.'],
    after: ['The moon\'s back, and the apples taste sweeter for it. Don\'t ask me how. They just do.', 'Something huge naps under the Oldest Apple Tree. Every apple that falls near it turns gold.'],
  }, 'marigold');
  async function marigold() {
    if (!F().wormErrand) {
      F().wormErrand = 1;
      await CC.talk('Marigold', ['Welcome to Willowbrook! Watch your step, my apples bruise easily, unlike my brother\'s ego.', 'Something\'s been in my apples. Little holes everywhere! Catch me a Wormapple and I\'ll give it a stern talking-to.']);
      return;
    }
    if (F().wormErrand === 1 && CC.state.caught.wormapple) {
      F().wormErrand = 2;
      await say('You caught one! Let me see that little... oh. Oh, it\'s chasing a beetle off the apple. It\'s been guarding my apples this whole time.', 'Marigold');
      await say('Pest control? That little worm\'s been guarding my apples this whole time. I owe it an apology. And a pie. Here, for your trouble.', 'Marigold');
      CC.state.bag.superpotion = (CC.state.bag.superpotion || 0) + 3; CC.sfx('buy');
      await CC.showPrize('items/super-potion', 'Marigold gave you 3 Super Potions!');
      return;
    }
    if (F().wormErrand === 1) { await say('Still no Wormapple? They live in the orchard in the daytime. Look in the tall grass between the trees!', 'Marigold'); return; }
    return marigoldChat();
  }
  CC.addTrainers('orchard', [
    { id: 'orchard-1', art: 'trainer-15', name: 'Orchard Kid Cory', x: 9, y: 10, dir: 'down', sight: 3, team: [['wormapple', 6], ['puffmunk', 7]],
      intro: 'You\'re in my orchard! Well, Marigold\'s. But I pick here!', win: 'Aw, apples...', after: 'Wormapples only come out when the sun\'s up.' },
    { id: 'orchard-2', art: 'trainer-16', name: 'Beekeeper Hana', x: 20, y: 10, dir: 'left', sight: 4, team: [['bumblop', 7], ['bumblop', 7], ['wormapple', 8]],
      intro: 'Bzzz! My Bumblops want to dance with you!', win: 'They\'re dizzy now. Thanks a lot.', after: 'Bumblop honey is the best on toast.' },
  ]);

  // ================= Whispering Grove =================
  var GROVE = CC.addRegion('grove', {
    name: 'Whispering Grove', spawns: 'grove', legend: 'grove', signArt: 'props/signpost-grove', landmark: 'props/landmark-grandmother-oak', weather: 'leaves',
    buildingIds: [['grove-fennick', 'fennick-treehouse']],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......................T',
      'T...LLLLLL......BBBB...T',
      'T...LLLLLL.::...BBBB...T',
      'T...LLLLLL.::...BDBBx..T',
      'T...LLLLLL.:::::::.....T',
      'T....rrrr..:::..,,,,,,.T',
      'T.....:::::::...,,,,,,.T',
      'T.x........::........S.T',
      'T..rrrr....:::::::::::::',
      'T..........:::::::::::::',
      'T~~~~~~~~~~::~~~~~~~~~~T',
      'T.,,,,,,,..::..........T',
      'T.,,,,,,,..::T.,,,,,,,.T',
      'TT,,,,,,,x.::..,,,,,,,.T',
      'T.,,,,,,,..::..,,,,,,,TT',
      'T.,,,,,,,..::.x,,,,,,,.T',
      'T.,,,,,,,.rrrr.,,,,,,,.T',
      'T.........rrrr.........T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 11, y: 11, img: 'props/grove-props-7', h: 12, dx: 8, solid: false, dy: 1 },
      { x: 4, y: 9, img: 'props/grove-props-3', h: 10, talk: fairyRing },
      { x: 20, y: 8, img: 'props/grove-props-4', h: 15, talk: 'An old stone with a carving: a girl sitting very still beside a small creature, under a huge tree. The Ancients made it.' },
      { x: 10, y: 2, img: 'props/grove-props-5', h: 12, solid: false }, { x: 2, y: 3, img: 'props/grove-props-2', h: 16 }, { x: 14, y: 8, img: 'props/grove-props-1', h: 13, dx: 8 }, { x: 15, y: 8 },
      { x: 22, y: 4, img: 'props/grove-props-8', h: 18 }, { x: 13, y: 17, img: 'props/grove-props-6', h: 14 }, { x: 1, y: 18, img: 'props/grove-props-5', h: 12, solid: false },
      { x: 22, y: 12, chest: 'grove-1', item: 'tonic', n: 2 },
    ],
  });
  GROVE.decor.forEach(function (d) { if (d.chest) d.chest = 'grove-' + d.x + '-' + d.y; });
  CC.SIGNS['grove:21,8'] = 'Whispering Grove. The Grandmother Oak: northwest. Speak slowly. She does.';
  var FO = CC.MAPS.forest;
  setRow(FO, 9, '::::::::::::::..,,,,,..T');
  setRow(FO, 10, '::::::::....S...,,,,,,.T');
  link('forest', { side: 'left', y0: 9, y1: 10, tx: 22, ty0: 9 }, 'grove', { side: 'right', y0: 9, y1: 10, tx: 1, ty0: 9 });
  CC.SIGNS['forest:12,10'] = 'Forest. Ranger Oakley\'s station: northwest. Whispering Grove: west. Outpost: east. Lake country: north, over the rope bridge.';
  async function fairyRing() {
    var today = new Date().toDateString();
    if (F()['day:ring'] === today) { await say('A ring of red mushrooms. It\'s quiet now. Try again tomorrow.'); return; }
    F()['day:ring'] = today;
    var roll = { id: CC.pick(['snoozeloth', 'budstag', 'snoozeloth']), lv: CC.randi(11, 13) };
    await say('You step into the fairy ring. The mushrooms glow... and something rustles out of the ferns!'); CC.sfx('encounter');
    await CC.battleTransition();
    await CC.startBattle({ wild: CC.mon.make(roll.id, roll.lv) });
  }
  // the Grandmother Oak gives page 3 once Fennick has introduced you
  GROVE.landmarkTalk = async function () {
    if (!F().fennickIntro) { await say('An enormous oak with a kind face in its bark. Its eyes are closed. It seems to be listening.'); return; }
    if (!CC.hasPage(3)) {
      await say('...A... child... of... the... Ancients\'... friends...', 'Grandmother Oak');
      await say('...Take... this... ...', 'Grandmother Oak');
      await CC.givePage(3); return;
    }
    if (CC.keeperAt && CC.keeperAt.has && CC.keeperAt.has('grove')) return CC.keeperAt('grove');
    await say(F().moonRestored ? '...The... moon... is... bright... ...good...' : '...The... nights... are... long... ...be... kind...', 'Grandmother Oak');
  };
  CC.PORTRAITS['Grandmother Oak'] = 'fennick';
  room('grove', 'grove-fennick', 'grove-fennick-in', 'Fennick\'s Tree House', [
    onWall(2, 'ranger-station-1', 15, 'A hand-drawn map of the grove. Every tree has a name. The Grandmother Oak\'s is underlined three times.'),
    piece(1, 2, 'watchtower-7', 14), piece(4, 3, 'nomad-tent-3', 12, { dx: 8, talk: 'A pot of acorn tea. It\'s been brewing since spring.' }), { x: 5, y: 3 },
    piece(8, 2, 'witch-hut-3', 16), piece(8, 5, 'witch-hut-7', 16), piece(1, 5, 'ranger-station-6', 16), piece(7, 2, 'grove-props-5', 12, { img: 'props/grove-props-5', solid: false }),
  ], { rug: [3, 4, 4, 2] });
  people('grove', [
    { x: 9, y: 6, art: 'fennick', name: 'Old Fennick', h: 27, talk: fennick },
  ]);
  var fennickChat = CC.chat('Old Fennick', {
    early: ['Ah, a visitor! What year is it? No, don\'t tell me. I like it as a surprise.', 'The Grandmother Oak speaks slowly. Very slowly. Last week she said "hello." She started it in spring.',
      'The Oak says a friend lives in her roots, older than she is.'],
    after: ['The Oak\'s leaves are greener this year. She says thank you. Well, she\'s partway through saying it.', 'The Oak says a friend lives in her roots, older than she is.'],
  }, 'fennick');
  async function fennick() {
    if (!F().fennickIntro) {
      F().fennickIntro = true;
      await CC.talk('Old Fennick', ['Ah, a visitor! What year is it? No, don\'t tell me. I like it as a surprise.',
        'You\'ve come to meet the Grandmother Oak? Go and talk to her. Stand close. She has something she\'s been holding onto for a long time.']);
      return;
    }
    return fennickChat();
  }
  CC.addTrainers('grove', [
    { id: 'grove-1', art: 'trainer-17', name: 'Bug Catcher Wes', x: 16, y: 12, dir: 'down', sight: 4, team: [['mothlight', 10], ['sprigkin', 11]],
      intro: 'Shh! You\'ll scare the Sprigkin! ...Okay, battle!', win: 'My net is empty.', after: 'Mothlight only comes out at night. I stay up late. Don\'t tell my mom.' },
  ]);

  // ================= Driftwood Cove =================
  var COVE = CC.addRegion('cove', {
    name: 'Driftwood Cove', spawns: 'cove', legend: 'cove', signArt: 'props/signpost-cove', landmark: 'props/landmark-shipwreck', weather: 'breeze',
    buildingIds: [['cove-coral', 'coral-beach-hut']],
    rows: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'T..........::..........T',
      'T.BBBB.....::..,,,,,,,.T',
      'T.BBBB....S::..,,,,,,,.T',
      'T.BDBB.....::..,,,,,,,.T',
      'T..............,,,,,,,.T',
      'T........rrrrr.........T',
      'T.,,,,,..rrrrr.........T',
      'T.,,,,,..........,,,,,.T',
      'T.,,,,,..........,,,,,.T',
      'T................,,,,,.T',
      'Tx........o............T',
      'T......................T',
      'T~~~~~~~..~~~~dd~~~~~~~T',
      'T~~~......~~~~dd~~~~~~~T',
      'T~~LLLLL.~~~~~dd~~~~~~~T',
      'T~~LLLLL.~~~~~dd~~~~~~~T',
      'T~~......~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 11, y: 11, img: 'props/cove-props-3', h: 10, talk: bottle },
      { x: 6, y: 10, img: 'props/cove-props-1', h: 14, talk: sandcastle(1) }, { x: 15, y: 7, img: 'props/cove-props-1', h: 14, talk: sandcastle(2) }, { x: 21, y: 6, img: 'props/cove-props-1', h: 14, talk: sandcastle(3) },
      { x: 1, y: 11, talk: tidePool }, { x: 19, y: 12, img: 'props/cove-props-8', h: 12, talk: tidePool }, { x: 21, y: 12, img: 'props/cove-props-8', h: 12, talk: tidePool },
      { x: 13, y: 6, img: 'props/cove-props-2', h: 22, solid: false }, { x: 12, y: 7, img: 'props/cove-props-6', h: 9, solid: false }, { x: 7, y: 2, img: 'props/cove-props-4', h: 10, solid: false },
      { x: 16, y: 12, img: 'props/cove-props-9', h: 14 }, { x: 13, y: 12, img: 'props/cove-props-9', h: 14 }, { x: 8, y: 6, img: 'props/cove-props-7', h: 10 },
      { x: 22, y: 1, chest: 'cove-1', item: 'great', n: 3 },
    ],
  });
  COVE.decor.forEach(function (d) { if (d.chest) d.chest = 'cove-' + d.x + '-' + d.y; });
  COVE.landmarkTalk = landmark('cove', 'The old shipwreck, stuck fast on the sandbar. Barnacles, seaweed, and footprints in the sand leading out of the hole in its side. Big ones.');
  CC.SIGNS['cove:10,3'] = 'Driftwood Cove. Coral\'s hut: west. Gus\'s dock and the boat to Lantern Isle: south. The wreck: out on the sandbar.';
  var W = CC.MAPS.water;
  setRow(W, 24, 'T~~~~~~.......:....::..T');
  setRow(W, 25, 'TTTTTTTTTT::::TTTTT::TTT');
  link('water', { side: 'bottom', x0: 19, x1: 20, tx0: 11, ty: 1 }, 'cove', { side: 'top', x0: 11, x1: 12, tx0: 19, ty: 24 });
  CC.SIGNS['water:12,10'] = 'Lakeshore. Fisher Gus\'s dock: northwest. Outpost: east. Driftwood Cove: south. Cave mountain: north, past the rockslide.';
  async function bottle() {
    if (CC.hasPage(4)) { await say('An empty glass bottle, half buried by the driftwood log.'); return; }
    await say('A glass bottle, half buried in the sand by the big driftwood log. There\'s a rolled-up paper inside!');
    await CC.givePage(4);
  }
  function sandcastle(n) {
    var finds = { 1: ['superpotion', 1, 'There was a Super Potion buried in the sandcastle!'], 2: ['great', 2, 'Two Great Cubes were hidden in the tower!'], 3: null };
    return async function () {
      if (F()['castle' + n]) { await say('A sandcastle. You already dug through it. You build the tower back up, a little crooked.'); return; }
      F()['castle' + n] = true;
      var f = finds[n];
      if (!f) { await say('You search the sandcastle. Just sand. And a very small crab who would like you to leave.'); return; }
      CC.state.bag[f[0]] = (CC.state.bag[f[0]] || 0) + f[1]; CC.sfx('buy');
      await CC.showPrize(CC.ITEMS[f[0]].icon, f[2]);
    };
  }
  // the tide pools: dip in and something might bite (their creatures are CC.SPAWNS.tidepool, 12b-data-expansion.js)
  async function tidePool() {
    if (!CC.state.party.length) { await say('A tide pool, full of tiny crabs.'); return; }
    if (!(await CC.yesNo('A tide pool. Dip your hand in and see what bites?'))) return;
    if (Math.random() < 0.35) { await say('Just seaweed. And a very cold hand.'); return; }
    return wildFrom('tidepool', 'Something grabbed your finger!');
  }
  room('cove', 'cove-coral', 'cove-coral-in', 'Coral\'s Beach Hut', [
    piece(1, 2, 'dock-shack-6', 18, { talk: 'Coral\'s shell collection. Each shell has a tiny label: "Tuesday." "Also Tuesday." "Gus\'s (do not return)."' }),
    piece(4, 2, 'dock-shack-5', 13, { dx: 8 }), { x: 5, y: 2 }, piece(8, 2, 'dock-shack-8', 18, { glow: true }),
    piece(1, 5, 'cove-props-4', 10, { img: 'props/cove-props-4' }), piece(8, 5, 'nomad-tent-2', 10), piece(3, 4, 'cove-props-6', 9, { img: 'props/cove-props-6', solid: false, dx: 8 }),
  ]);
  people('cove', [
    { x: 7, y: 5, art: 'coral', name: 'Coral', lines: {
      early: ['Every bottle that washes up has a story. Most of them say "help, I\'m a bottle."', 'There\'s a bottle by the big driftwood log. I left it for someone who needs it more than me.',
        'At low tide, something big walks out of the old wreck and looks at the moon.'],
      night: ['The Glimstar are out. Sailors used to steer by them. I steer by them to the snack hut.'] } },
    { x: 15, y: 16, art: 'gus', name: 'Fisher Gus', dir: 'up', talk: boatOut },
  ]);
  CC.addTrainers('cove', [
    { id: 'cove-1', art: 'trainer-18', name: 'Swimmer Maya', x: 18, y: 4, dir: 'down', sight: 3, team: [['splotter', 12], ['shellbit', 13]],
      intro: 'The water\'s perfect! Unlike your chances!', win: 'Glub. I need a towel.', after: 'Glimstar glow on the sand at night. Prettiest thing I\'ve ever seen.' },
    { id: 'cove-2', art: 'trainer-19', name: 'Sandcastle Kid Theo', x: 4, y: 7, dir: 'right', sight: 4, team: [['crabbit', 12], ['shellbit', 12], ['tidepuff', 13]],
      intro: 'Don\'t step on my castles! Battle me instead!', win: 'My castle! ...Oh, it\'s fine.', after: 'Some of the sandcastles have treasure in them. Not mine. Mine has a crab.' },
  ]);

  // ---------- the boat to Lantern Isle ----------
  async function boatOut() {
    if (!F().boatTicket) {
      await say(F().trialWater ? 'Lost your ticket? Here, have another. Gus always keeps a spare.' : 'Ahoy! I run the boat out to Lantern Isle. Beat my trial back at the lake and the ticket\'s yours.', 'Fisher Gus');
      if (F().trialWater) await CC.giveBoatTicket();
      return;
    }
    if (!(await CC.yesNo('All aboard for Lantern Isle?', 'Fisher Gus'))) { await say('She\'ll be here when you\'re ready.', 'Fisher Gus'); return; }
    if (!F().seenIsle) {
      F().seenIsle = true;
      await CC.showStill('still-8', ['Gus rows out past the sandbar. The sea sparkles, and puffins race the boat.', 'Ahead, a little rocky island rises from the waves, with a red-and-white lighthouse on top.'], { keepBlack: true });
      CC.world.enter('isle', 10, 17, 'up'); CC.unfade(); await CC.fade(0.01, true); await CC.fade(0.5, false);
    } else {
      CC.sfx('select'); await CC.fade(0.4, true); CC.world.enter('isle', 10, 17, 'up'); await CC.fade(0.4, false);
    }
    await say('Here we are. Just give me a shout when you want to head back.', 'Fisher Gus');
  }
  async function boatBack() {
    if (!(await CC.yesNo('Heading back to the cove?', 'Fisher Gus'))) return;
    CC.sfx('select'); await CC.fade(0.4, true); CC.world.enter('cove', 14, 15, 'up'); await CC.fade(0.4, false);
  }

  // ================= Lantern Isle =================
  var ISLE = CC.addRegion('isle', {
    name: 'Lantern Isle', spawns: 'isle', legend: 'isle', signArt: 'props/signpost-isle', weather: 'breeze', deepWater: true,
    buildingIds: [['isle-lighthouse', 'lighthouse'], ['isle-hut', 'small-healing-hut'], ['isle-wren', 'wren-cottage']],
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~....BB.....~~~~~~',
      '~~~o.....BB.......o~~~',
      '~~~BBBB..BB...BBBB.~~~',
      '~~~BBBB..DB...BBBB..~~',
      '~~.BDBB.......BDBB..~~',
      '~~..:::::::::::::...~~',
      '~~........::........~~',
      '~~o...x...::...x...o~~',
      '~~..,,,,,.::.,,,,,..~~',
      '~~..,,,,,.::.,,,,,..~~',
      '~~..,,,,,.::.,,,,,..~~',
      '~~~.,,,,,.::.,,,,,..~~',
      '~~~.,,,,,.::.,,,,,.~~~',
      '~~~o....x.::S.....o~~~',
      '~~~~~~....::.o..~~~~~~',
      '~~~~~~~~~~dd~~~~~~~~~~',
      '~~~~~~~~~~dd~~~~~~~~~~',
      '~~~~~~~~~~dd~~~~~~~~~~',
    ],
    decor: [
      { x: 2, y: 7, img: 'props/isle-props-6', h: 10, talk: 'A puffin burrow. A tiny Puffling peeks out, squeaks, and ducks back in.' },
      { x: 19, y: 7, img: 'props/isle-props-3', h: 18 }, { x: 18, y: 12, img: 'props/isle-props-4', h: 11 }, { x: 13, y: 16, img: 'props/isle-props-7', h: 14 },
      { x: 9, y: 16, img: 'props/isle-props-2', h: 9, solid: false }, { x: 12, y: 17, img: 'props/isle-props-1', h: 13, solid: false },
      { x: 7, y: 16, img: 'props/isle-props-8', h: 14, dx: 4 }, { x: 15, y: 2, img: 'props/isle-props-9', h: 12 }, { x: 15, y: 15, img: 'props/isle-props-5', h: 14 },
      { x: 4, y: 2, img: 'props/isle-props-5', h: 14 }, { x: 5, y: 2, chest: 'isle-cave', item: 'ultra', n: 2 },
    ],
  });
  ISLE.decor.forEach(function (d) { if (d.chest) d.chest = 'isle-' + d.x + '-' + d.y; });
  CC.MAP_TRACK.isle = 'seaside'; CC.MAP_TRACK.cove = 'seaside';
  CC.SIGNS['isle:12,15'] = 'Lantern Isle. The lighthouse: north. Keeper Wren\'s cottage: east. Healing Hut: west. Please don\'t feed the Sealamp (it\'s on a diet).';
  people('isle', [{ x: 11, y: 18, art: 'gus', name: 'Fisher Gus', dir: 'left', talk: boatBack }]);
  CC.addTrainers('isle', [
    { id: 'isle-1', art: 'trainer-20', name: 'Sailor Pete', x: 15, y: 8, dir: 'left', sight: 4, team: [['puffling', 16], ['bubblefin', 16], ['sealamp', 17]],
      intro: 'Avast! A landlubber on my island!', win: 'Sunk!', after: 'Krakling hides in the lighthouse\'s shadow at night. Friendly little thing.' },
    { id: 'isle-2', art: 'trainer-21', name: 'Bird Watcher Robin', x: 5, y: 9, dir: 'down', sight: 3, team: [['puffling', 16], ['puffling', 17]],
      intro: 'I\'ve spotted 47 Pufflings today. You\'re number 48. Wait, you\'re not a Puffling!', win: 'I lost count...', after: 'Pufflings dive into freezing water without a second thought. So brave.' },
  ]);
  // the small Healing Hut
  room('isle', 'isle-hut', 'isle-hut-in', 'Lantern Isle Healing Hut', [
    { x: 4, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 5, y: 3, counter: true },
    { x: 7, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' }, { x: 2, y: 2, img: 'furniture/heal-5', h: 24 }, { x: 1, y: 5, img: 'furniture/heal-4', h: 18 },
  ], { rows: ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'] });
  people('isle-hut-in', [{ x: 4, y: 2, art: 'holly', name: 'Nurse Laurel', talk: function () {
    return CC.healingHut('Nurse Laurel', { map: 'isle-hut-in', x: 4, y: 4 }, 'Welcome to Lantern Isle! I\'m Laurel. Holly in Copperbell is my twin. I\'m the one with the sea air.');
  } }]);
  // Wren's cottage
  room('isle', 'isle-wren', 'isle-wren-in', 'Wren\'s Cottage', [
    piece(4, 3, 'lighthouse-8', 13, { dx: 8, talk: 'A pot of tea, still warm, and two cups. Wren always makes two.' }), { x: 5, y: 3 },
    onWall(2, 'dock-shack-7', 14, 'An old ship\'s wheel, and pinned beside it, a sea chart with fifty years of notes.'),
    piece(1, 5, 'witch-hut-4', 11, { talk: 'Wren\'s cat. It is the captain of this cottage, and it knows it.' }),
    piece(8, 2, 'town-hall-8', 18), piece(1, 2, 'lighthouse-3', 20), piece(8, 5, 'lighthouse-4', 14),
  ], { rug: [3, 4, 4, 2] });
  // the lighthouse: storage, Wren's logbooks, and the lamp at the top
  room('isle', 'isle-lighthouse', 'isle-light-1', 'The Lighthouse', [
    piece(7, 2, 'lighthouse-2', 22, { talk: function () { return CC.climb('isle-light-2', 6, 3); } }),
    piece(1, 2, 'lighthouse-6', 11), piece(2, 2, 'isle-props-9', 12, { img: 'props/isle-props-9' }), piece(1, 5, 'isle-props-9', 12, { img: 'props/isle-props-9' }),
    piece(8, 5, 'isle-props-2', 9, { img: 'props/isle-props-2' }), piece(3, 2, 'isle-props-1', 13, { img: 'props/isle-props-1' }),
  ], { rows: ['#PPPPPPPP#', '#WWWWWWWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'] });
  var UP = ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '##########'];
  CC.upstairs('isle-light-2', 'The Lighthouse (middle floor)', UP, [
    piece(7, 2, 'lighthouse-2', 22, { talk: async function () { var c = await CC.ask('The spiral stairs.', ['Up', 'Down', 'Stay']); if (c === 0) return CC.climb('isle-light-3', 4, 4); if (c === 1) return CC.climb('isle-light-1', 6, 3); } }),
    piece(1, 2, 'lighthouse-3', 20, { talk: 'Wren\'s logbooks. Fifty years of weather, ships, and Puffcaptain sightings. One night is just a big coffee stain.' }),
    piece(3, 3, 'lighthouse-4', 14), piece(4, 3, 'lighthouse-5', 12, { talk: 'A ship in a bottle. The ship is a tiny copy of Gus\'s boat. It is much tidier.' }),
  ]);
  CC.upstairs('isle-light-3', 'The Lamp Room', UP, [
    piece(4, 2, 'lighthouse-1', 24, { dx: 8, glow: true, talk: 'The great lamp. It turns slowly, throwing light far out over the sea.' }), { x: 5, y: 2 },
    { x: 3, y: 3, img: 'creatures/sealamp', h: 15, talk: 'The Sealamp curls around the lamp\'s base. Its glow keeps the light burning. It burps a little fish smell.' },
    piece(7, 2, 'lighthouse-2', 22, { talk: function () { return CC.climb('isle-light-2', 6, 3); } }),
  ]);
  CC.MAPS['isle-light-2'].inside = [6, 3]; CC.MAPS['isle-light-3'].inside = [4, 4];
  ['isle-light-2', 'isle-light-3'].forEach(function (k) { CC.MAP_TRACK[k] = 'seaside'; });
  people('isle-light-3', [{ x: 6, y: 4, art: 'wren', name: 'Keeper Wren', h: 25, talk: wren }]);
  var wrenChat = CC.chat('Keeper Wren', {
    early: ['Fifty years I\'ve kept this light. Never missed a night. Well, one night. We don\'t talk about it.', 'The Sealamp up here keeps the lamp lit. I just keep the Sealamp fed. Fish, mostly. It\'s very particular.',
      'In storms, a shape circles the lighthouse, keeping the ships off the rocks.'],
    after: ['Puffcaptain saluted me again this morning. I saluted back. We\'re very professional.', 'In storms, a shape circles the lighthouse, keeping the ships off the rocks.'],
  }, 'wren');
  async function wren() {
    if (!CC.hasPage(5)) {
      await say('You climbed all the way up? Good knees. Here, I found this in the old logbook, older than me, if you can believe it. Looks like it belongs to someone\'s story.', 'Keeper Wren');
      await CC.givePage(5); return;
    }
    return wrenChat();
  }
  // the Keeper legend spot for the isle is the lighthouse's foot
  ISLE.decor.push({ x: 8, y: 5, img: 'props/isle-props-5', h: 12, talk: landmark('isle', 'The base of the lighthouse is crusted with salt. Scratched into the stone: a wave, a lightning bolt, and a big swirling shape.') });
})();
