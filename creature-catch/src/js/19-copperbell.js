// The expansion, batch 2 (docs/creature-catch-expansion-guide.md, sections 3.5 and 3.6): Copperbell Town on the main
// road between the Crystal Cave and the desert, every building in it, and Glimmer Mine under the hill to the east.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  var piece = CC.piece, onWall = CC.onWall;
  function team(list) { return list.map(function (p) { return CC.mon.make(p[0], p[1]); }); }

  // ---------- the tiles ----------
  // p: the brick market square. copperbell atlas: 0/14 cobbles, 1 brick, 2 fountain, 3/13 flower beds, 4 park grass, 5 tall grass, 6 flowers, 7 steps,
  // 8 lamp, 9 brick cross, 10 wall, 11 flower rubble, 12 brick curve, 15 wall with grass
  CC.LEGENDS.copperbell = {
    rustle: ['#5ab848', '#90e070', '#2f7a2a'],
    atlas: 'copperbell', ground: [0, 14, 0, 14, 0], dirtFrom: null, backdrop: '#5a5048', trees: ['props/trees-3', 'props/trees-1'], pines: 0.2, treeGround: [4],
    ':': { i: [14] }, p: { i: [1, 1, 1, 9] }, ',': { i: [5] }, r: { i: [4, 4, 6] }, '*': { i: [6] }, x: { i: [3, 13], solid: true, noflip: true }, o: { i: [10, 15], solid: true },
  };
  // mine atlas: 0 rock floor, 1/13 planks, 2 track, 3/7 beams, 4/10 ore, 5/12 flooded water, 8 rubble, 9/15 glittering gravel, 11 dark rock, 14 ore rubble
  CC.LEGENDS.mine = {
    rustle: ['#f8b050', '#c87830', '#ffe0a0'],
    atlas: 'mine', ground: [0, 0, 0, 8], dirtFrom: null, backdrop: '#140e0a', wall: true, wallAtlas: 'cave', wallTint: 'rgba(60,30,10,0.35)', ',': { i: [9, 15], glow: null }, ':': { i: [1, 13], turns: true, noflip: true }, d: { i: [2], turns: true, noflip: true },
    '~': { i: [5, 12], solid: true, glow: '#3a8ee8' }, x: { i: [3, 7], solid: true, noflip: true }, o: { i: [4, 10], solid: true, glow: '#f8a040' }, '*': { i: [14] },
  };
  CC.OWN_LIGHT.mine = 1;

  // ---------- Copperbell Town ----------
  var TOWN = CC.addRegion('copperbell', {
    name: 'Copperbell Town', spawns: 'copperbell', legend: 'copperbell', signArt: 'props/signpost-copperbell',
    buildingIds: [['cb-hall', 'copperbell-town-hall'], ['cb-museum', 'museum'], ['cb-school', 'school'], ['cb-hut', 'healing-hut'], ['cb-shop', 'cube-shop'],
      ['cb-tower', 'bell-tower'], ['cb-bakery', 'bakery'], ['cb-workshop', 'cubesmith-workshop'], ['cb-grit', 'grit-shack'],
      ['cb-house1', 'copperbell-house-1'], ['cb-house2', 'copperbell-house-2'], ['cb-mine', 'mine-entrance']],
    rows: [
      'TTTTTTTTTT::::TTTTTTTTTTTTTTTT',
      'T.BBBBB...::::..BBBBB..BBBB..T',
      'T.BBBBB...::::..BBBBB..BBBB..T',
      'T.BBDBB...::::..BBDBB..BDBB..T',
      'T.........::::...............T',
      'T.........::::...............T',
      'TBBBB.BBBB::::..BB.BBBB.BBBB.T',
      'TBBBB.BBBB::::..BB.BBBB.BBBB.T',
      'TBBDB.BDBB::::..DB.BDBB.BDBB.T',
      'T.........::::...............T',
      'T....xppppppppppppppx........T',
      'T....pppppppppppppppp...BBBB.T',
      'T....pppppppppppppppp...BBBB.T',
      'T....pppppppppppppppp...BDBB.T',
      'T....xppppppppppppppx........T',
      'T.........::::...............T',
      'T.BBB.BBBB::::TrrrrrrrT......T',
      'T.BBB.BBBB::::r,,,,,,,r.BBBB.T',
      'T.BDB.BDBB::::r,,,,,,,r.BBBB.T',
      'T.........::::r,,*r,,,r.BDBB.T',
      'Trrrrrrrr.::::r,,r*,,,r......T',
      'Tr,,,r*rr.::::S,,,,,,,rrrrrrrT',
      'TT,,,rrrT.::::rrrrrrrrTrrrrrTT',
      'TTTTTTTTTT::::TTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 8, y: 12, img: 'props/copperbell-props-3', h: 22, dx: 8, talk: 'A fountain with a little copper Dingdove on top. Coins glint at the bottom.' }, { x: 9, y: 12 },
      { x: 16, y: 12, img: 'props/copperbell-props-4', h: 22 }, { x: 18, y: 12, img: 'props/copperbell-props-4', h: 22 },
      { x: 5, y: 9, img: 'props/copperbell-props-1', h: 24 }, { x: 14, y: 9, img: 'props/copperbell-props-1', h: 24 }, { x: 9, y: 15, img: 'props/copperbell-props-1', h: 24 },
      { x: 20, y: 15, img: 'props/copperbell-props-1', h: 24 }, { x: 22, y: 4, img: 'props/copperbell-props-1', h: 24 }, { x: 1, y: 4, img: 'props/copperbell-props-1', h: 24 },
      { x: 7, y: 13, img: 'props/copperbell-props-2', h: 12, solid: true }, { x: 14, y: 4, img: 'props/copperbell-props-6', h: 16, talk: noticeBoard },
      { x: 5, y: 18, img: 'props/copperbell-props-7', h: 15, talk: 'A copper mailbox. A letter sticks out, addressed to "Rustcoon, the park." It\'s been opened.' },
      { x: 28, y: 9, img: 'props/copperbell-props-8', h: 16 }, { x: 23, y: 8, img: 'props/copperbell-props-9', h: 22, solid: false, dy: -2 },
      { x: 18, y: 9, img: 'props/copperbell-props-5', h: 13 }, { x: 15, y: 15, img: 'props/copperbell-props-5', h: 13 }, { x: 28, y: 15, img: 'props/copperbell-props-5', h: 13 },
      { x: 28, y: 18, img: 'props/mine-props-2', h: 14 }, { x: 23, y: 19, img: 'props/mine-props-4', h: 18, solid: true },
    ],
  });
  CC.MAP_TRACK.copperbell = 'town'; CC.MAP_TRACK['cb-tower-top'] = 'town';
  CC.SIGNS['copperbell:14,21'] = 'Copperbell Town. Market square: north. Healing Hut and Cube Shop: west of the square. Glimmer Mine: east. The desert road: through the north gate.';
  Object.assign(CC.ART_INFO, {
    'copperbell-town-hall': { door: 0.5 }, museum: { door: 0.5 }, school: { door: 0.45 }, 'healing-hut': { door: 0.5 }, 'cube-shop': { door: 0.5 },
    'bell-tower': { door: 0.3, width: 38 }, bakery: { door: 0.62, smoke: [0.7, 0.04] }, 'cubesmith-workshop': { door: 0.55, smoke: [0.66, 0.02] },
    'grit-shack': { door: 0.42, smoke: [0.88, 0.06] }, 'copperbell-house-1': { door: 0.33, smoke: [0.68, 0.04] }, 'copperbell-house-2': { door: 0.42, smoke: [0.73, 0.04] },
    'mine-entrance': { door: 0.5 },
  });
  async function noticeBoard() {
    await say('TOWN NOTICES: "Dusk Bell repairs: still no idea what\'s wrong. - Mayor B." "Lost: one kite. Last seen on the museum roof. - Lark"');
    await say('"School quiz day, every day! All welcome. Bring your brain. - Ms. Poppy"');
  }

  // ---------- the main road now runs Cave -> Copperbell -> Desert ----------
  function relink(a, side, b) { a.exits = a.exits.filter(function (e) { return e.side !== side; }); a.exits.push(b); }
  relink(CC.MAPS.cave, 'top', { side: 'top', x0: 10, x1: 13, to: 'copperbell', tx0: 10, ty: TOWN.rows.length - 2 });
  relink(CC.MAPS.desert, 'bottom', { side: 'bottom', x0: 10, x1: 13, to: 'copperbell', tx0: 10, ty: 1 });
  TOWN.exits.push({ side: 'bottom', x0: 10, x1: 13, to: 'cave', tx0: 10, ty: 1 }, { side: 'top', x0: 10, x1: 13, to: 'desert', tx0: 10, ty: CC.MAPS.desert.rows.length - 2 });
  var cave = CC.GUIDES.cave;
  cave.hello = ['Dusty\'s the name, mining\'s the game. The tunnel north comes out in Copperbell Town, on the desert road.', 'But the sand\'s been blowing in something fierce. Only a real trainer gets through.'];
  cave.opened = 'Dusty propped open the tunnel. Warm wind blows through, smelling of bread and copper. The way to Copperbell is open!';
  CC.SIGNS['cave:19,11'] = 'Crystal Cave. Mine office: northwest. Outpost: just below. Copperbell Town and the desert road: north.';

  // ---------- the rooms ----------
  function door(id) { return TOWN.buildings.find(function (b) { return b.id === id; }); }
  function townRoom(id, name, decor, extra) {
    var b = door(id), rows = extra && extra.rows || CC.ROOM12;
    CC.MAPS[id + '-in'] = CC.room(name, rows, ['copperbell', b.door[0], b.door[1] + 1], decor, extra);
    CC.DOORS[id] = id + '-in';
    return CC.MAPS[id + '-in'];
  }
  var CHECK = ['#PPPPPPPPPP#', '#WWwWWWWwWW#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#cccccccccc#', '#####mm#####'];
  // Healing Hut: Nurse Holly
  townRoom('cb-hut', 'Copperbell Healing Hut', [
    { x: 5, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 6, y: 3, counter: true },
    { x: 8, y: 2, img: 'furniture/heal-2', h: 18, talk: 'The healing machine hums. A copper plate on it reads "Made in Copperbell."' },
    { x: 10, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' }, { x: 2, y: 2, img: 'furniture/heal-5', h: 24 },
    { x: 1, y: 5, img: 'furniture/heal-4', h: 18, talk: 'A soft cot for tired creatures.' }, { x: 10, y: 6, img: 'furniture/furn-5', h: 15 },
  ], { rows: CHECK });
  var hollyLines = ['Hazel\'s my cousin! She told me you might come through. Let\'s get your creatures rested.', 'You can reach the Cube Vault from here too. It\'s all one Vault, every hut, everywhere. Don\'t ask me how.', 'Welcome to the Copperbell Healing Hut! I\'m Holly.'];
  CC.NPCS['cb-hut-in'] = [{ x: 5, y: 2, art: 'holly', h: 25, dir: 'down', talk: function () {
    var n = (this.n = (this.n || 0) + 1);
    return CC.healingHut('Nurse Holly', { map: 'cb-hut-in', x: 5, y: 4 }, hollyLines[(n - 1) % hollyLines.length]);
  } }];
  // Cube Shop: Pim
  townRoom('cb-shop', 'Pim\'s Cube Shop', [
    { x: 5, y: 3, img: 'furniture/furn-9', h: 17, dx: 8, counter: true }, { x: 6, y: 3, counter: true },
    { x: 1, y: 2, img: 'furniture/furn-10', h: 20, talk: 'Great Cubes, Ultra Cubes, all stacked by color.' }, { x: 9, y: 2, img: 'furniture/furn-10', h: 20 }, { x: 10, y: 2, img: 'furniture/furn-10', h: 20 },
    { x: 10, y: 6, img: 'furniture/furn-5', h: 15 },
  ], { rug: [4, 4, 4, 2] });
  var pimChat = CC.chat('Pim', { early: ['Pip runs the shop back home? I taught him everything. Don\'t tell him I said that.', 'Great Cubes, Ultra Cubes, all in stock. The Master Cube? Ha! Nobody sells those.'],
    final: ['Ada\'s making Dusk Cubes now. I\'m not jealous. I\'m a little jealous.', 'Great Cubes, Ultra Cubes, all in stock.'] }, 'pim');
  CC.NPCS['cb-shop-in'] = [{ x: 5, y: 2, art: 'pim', h: 24, dir: 'down', talk: async function () {
    await pimChat();
    await CC.shopScreen(['cube', 'great', 'ultra', 'potion', 'superpotion', 'megapotion', 'tonic', 'cureherb', 'revive'], 'Pim');
    await say('Come again! Say hi to Pip for me. Actually, don\'t.', 'Pim');
  } }];
  // Town Hall: Mayor Barnaby
  townRoom('cb-hall', 'Copperbell Town Hall', [
    piece(5, 2, 'town-hall-1', 16, { dx: 8, talk: 'The mayor\'s desk. A copper paperweight holds down a pile of letters about the bell.' }), { x: 6, y: 2 },
    onWall(2, 'town-hall-2', 18, 'A painting of the town\'s founders, holding a little copper bell and grinning.'),
    piece(9, 2, 'town-hall-4', 15, { talk: 'A model of the Dusk Bell. On the real one, the crack runs right down the side.' }),
    piece(1, 2, 'town-hall-6', 20), piece(10, 2, 'town-hall-5', 18, { talk: 'A coat rack. The mayor\'s spare top hat hangs on it. And a spare spare.' }),
    onWall(8, 'town-hall-3', 16, 'A red banner with a copper bell stitched on it.'),
  ], { rows: CHECK, rug: [4, 4, 4, 3] });
  CC.NPCS['cb-hall-in'] = [{ x: 7, y: 3, art: 'barnaby', h: 26, dir: 'down', talk: CC.chat('Mayor Barnaby', {
    mid: ['Welcome to Copperbell! Copper roofs, copper pots, copper everything! Except the bell. The bell is... resting.', 'Our Dusk Bell has rung every evening for three hundred years. When the moon dimmed, it cracked. I don\'t sleep well.', 'Old Toll still climbs the tower every dusk, just in case. Bless him.'],
    after: ['The moon\'s back, but the bell\'s still quiet. Professor Hollis thinks it\'s waiting for someone.', 'Three hundred years of ringing, and now nothing. It\'s like the town lost its voice.'],
    final: ['It rang! On its own! At dusk! I wept into my hat. It\'s a good hat for weeping.', 'The whole town came out to listen. Even the Rustcoon sat still.'],
    lead: { Normal: 'A {name}! Lovely. Copperbell is very friendly to Normal types. We\'re a very normal town. Mostly.' },
  }, 'barnaby') }];
  // the Museum of the Ancients: Professor Hollis, three plaques, and exhibits that grow with the story
  var PLAQUES = [
    'THE ANCIENTS. The first people to befriend creatures. They built the Moon Altar, the Night Ruins and the Archive below them, and a temple no one has ever found. They left gifts, not traps.',
    'THE FIRST CUBE. Made on the shore of the great lake: purple for the night sky, blue for the water, and a glowing seam for the horizon at dusk. Every cube since is a copy of it.',
    'THE DUSK BELL. Copperbell\'s founders found an ancient carving deep in the mine: "Ring a bell at dusk, every evening, to say goodnight." Goodnight to whom? The carving doesn\'t say.',
  ];
  function plaque(i) { return async function () { F()['plaque' + i] = true; await say(PLAQUES[i]); }; }
  townRoom('cb-museum', 'Museum of the Ancients', [
    onWall(2, 'museum-4', 13, plaque(0)), onWall(5, 'museum-5', 13, plaque(1)), onWall(8, 'museum-6', 13, plaque(2)),
    onWall(10, 'museum-8', 15, 'An ancient map of the land. There\'s a little sun drawn on the desert, right where the oasis is.'),
    piece(2, 3, 'museum-1', 16, { talk: 'An ancient capture cube under glass. Its seam still glows, very faintly.' }),
    piece(4, 3, 'museum-2', 16, { talk: 'Rune stones from the Night Ruins. Two are blank, as if the runes wandered off. Professor Hollis insists they did.' }),
    piece(8, 3, 'museum-9', 18, { dx: 8, talk: 'The skeleton of an ancient creature. It looks a lot like a very big Pebblepup.' }), { x: 9, y: 3 },
    piece(1, 6, 'museum-3', 20, { talk: 'A stone creature on a plinth. Its label just says "?".' }),
    piece(10, 5, 'museum-7', 14, { talk: exhibit }), piece(10, 6, 'museum-10', 15),
  ], { rows: CHECK });
  async function exhibit() {
    var f = F();
    if (f.gloamingCalm) { await say('NEW EXHIBIT: "The Little One." A drawing of a small wolf made of smoke, curled up next to a bell. Someone has added a heart.'); return; }
    if (f.solarionCalm) { await say('NEW EXHIBIT: "The Sleeping Sun." A golden feather, warm to the touch, from the Dawn Temple.'); return; }
    if (f.moonRestored) { await say('NEW EXHIBIT: "The Night the Moon Came Back." There\'s a drawing of you. Sort of. It\'s a stick figure.'); return; }
    await say('A velvet rope around an empty space. A card reads: "New exhibit coming soon. Probably."');
  }
  var hollisChat = CC.chat('Professor Hollis', {
    early: ['Welcome to the Museum of the Ancients! Please don\'t touch the exhibits. Or do, gently. No, don\'t.', 'Read all three plaques. Every word! Then come back and tell me what you think. I have something for you.'],
    after: ['A new exhibit! "The Night the Moon Came Back." You\'re in it. Sort of. It\'s a stick figure.', 'The Ancients built a temple no one has found. I\'d give my best bow tie to see it.'],
    final: ['Three guardians! Sun, moon and dusk! I\'ve had to redo every plaque. Happily!'],
  }, 'hollis');
  CC.NPCS['cb-museum-in'] = [{ x: 6, y: 5, art: 'hollis', h: 26, dir: 'down', talk: async function () {
    if (!CC.hasPage(6) && F().plaque0 && F().plaque1 && F().plaque2) {
      await say('You read them all! Nobody reads them all. Here, I found this in a crate from the Night Ruins. It\'s yours. You\'ll know what to do with it.', 'Professor Hollis');
      await CC.givePage(6); return;
    }
    if (!CC.hasPage(6)) { var left = [0, 1, 2].filter(function (i) { return !F()['plaque' + i]; }).length; await say('Read all three plaques. Every word! ' + left + ' to go. Then come back and tell me what you think. I have something for you.', 'Professor Hollis'); return; }
    return hollisChat();
  } }];
  // the Cubesmith Workshop: Ada makes Dusk Cubes after the Balance
  townRoom('cb-workshop', 'Cubesmith Workshop', [
    piece(1, 2, 'workshop-1', 22, { glow: true, talk: 'The forge glows. A half-made cube sits in the coals, its seam just starting to shine.' }),
    piece(3, 3, 'workshop-2', 14, { talk: 'An anvil, polished from years of tapping cube seams flat.' }),
    piece(5, 3, 'workshop-3', 15, { dx: 8, counter: true, talk: 'Half-finished cubes. Purple tops, blue bottoms, and no seams yet.' }), { x: 6, y: 3, counter: true },
    piece(8, 2, 'workshop-4', 20), piece(10, 2, 'workshop-5', 16, { glow: true, talk: 'A copper vat of glowing seam-glaze. It smells like a thunderstorm.' }),
    onWall(4, 'workshop-6', 13), piece(10, 6, 'workshop-7', 13),
  ], { rows: CHECK });
  var adaChat = CC.chat('Cubesmith Ada', {
    mid: ['Every cube I make is hand-sealed. The seam\'s the tricky part. It\'s got to glow just like a sunset.', 'The Ancients made the first one at the lake. Purple for the sky, blue for the water. I just copy them, a few thousand times.', 'Pim sells my cubes. He tells everyone he makes them. I let him.'],
    final: ['Elder Willow sent me the recipe from that old book. A Dusk Cube! Works best when the light\'s going.'],
  }, 'ada');
  CC.NPCS['cb-workshop-in'] = [{ x: 5, y: 2, art: 'ada', h: 25, dir: 'down', talk: async function () {
    await adaChat();
    if (F().duskRecipe) {
      await CC.shopScreen(['dusk', 'great', 'ultra'], 'Cubesmith Ada');
      await say('Use it when the sun\'s going down. You\'ll see.', 'Cubesmith Ada');
    }
  } }];
  // the School: Ms. Poppy and three quizzing kids
  townRoom('cb-school', 'Copperbell School', [
    onWall(5, 'school-1', 15, 'The chalkboard: "Water beats Fire. Fire beats Plant. Plant beats Water." Underneath, in a kid\'s writing: "and Rustcoon beats lunch."'),
    onWall(9, 'school-3', 15, 'A type chart poster. Shadow and Lumen have arrows pointing at each other.'),
    piece(5, 3, 'school-2', 15, { dx: 8, talk: 'Ms. Poppy\'s desk, with a shiny red apple on it.' }), { x: 6, y: 3 },
    piece(2, 5, 'school-5', 13), piece(4, 5, 'school-6', 13), piece(7, 5, 'school-5', 13), piece(9, 5, 'school-6', 13),
    piece(1, 2, 'school-4', 20), piece(10, 2, 'school-7', 15, { talk: 'A globe. Someone drew a little bell on Copperbell.' }), piece(10, 6, 'school-8', 13),
  ]);
  var QUIZ = [
    ['Tam', 'villager-15', 'Which type beats Fire?', ['Water', 'Plant', 'Frost'], 0, 'Water! Too easy. Next!'],
    ['Nell', 'villager-2', 'Plant beats Water and one more. Which one?', ['Bolt', 'Earth', 'Fire'], 1, 'Earth! Roots crack rocks. Everybody knows that.'],
    ['Ollie', 'trainer-17', 'When Shadow and Lumen hit each other, it\'s...?', ['Double damage', 'Half damage', 'No damage'], 0, 'Double! They really, really don\'t get along.'],
  ];
  CC.NPCS['cb-school-in'] = [{ x: 3, y: 2, art: 'poppy', h: 25, dir: 'down', talk: async function () {
    var right = QUIZ.filter(function (q, i) { return F()['quiz' + i]; }).length;
    if (right === 3 && !F()['gift:poppy']) {
      await say('All three questions right! The children are speechless. That never happens.', 'Ms. Poppy');
      await CC.giftOnce('poppy', 'ultra', 2, 'Ms. Poppy gave you 2 Ultra Cubes, with a gold star on each!')();
      return;
    }
    await CC.chat('Ms. Poppy', { early: ['Class! We have a visitor. Everyone say "hello, creature catcher."', 'Today\'s lesson: Water beats Fire, Fire beats Plant, Plant beats Water. Tomorrow: why Shadow and Lumen can\'t stop arguing.', 'The children want to quiz you. Be warned, they\'re merciless.'] }, 'poppy')();
  } }].concat(QUIZ.map(function (q, i) {
    return { x: [2, 4, 7][i], y: 4, art: q[1], h: 21, dir: 'down', talk: async function () {
      if (F()['quiz' + i]) { await say(i === 2 ? 'You got them all? Ask Ms. Poppy for a gold star!' : 'You already got mine. Ask the others!', q[0]); return; }
      var c = await CC.ask(q[2], q[3]);
      if (c === q[4]) { F()['quiz' + i] = true; CC.sfx('select'); await say(q[5], q[0]); }
      else { CC.sfx('bump'); await say('Nope! Think about it and ask me again.', q[0]); }
    } };
  }));
  // the Bakery: Baker Bun and his Copper Rolls
  townRoom('cb-bakery', 'Copperbell Bakery', [
    piece(1, 2, 'bakery-1', 22, { glow: true, talk: 'The bread oven glows. Something golden is rising in there.' }),
    piece(5, 3, 'bakery-2', 15, { dx: 8, counter: true, talk: 'A glass counter full of pastries. A sign: "Copper Rolls: not made of copper."' }), { x: 6, y: 3, counter: true },
    piece(9, 2, 'bakery-3', 20), piece(10, 2, 'bakery-4', 13), piece(3, 2, 'bakery-5', 15), piece(7, 2, 'bakery-6', 10, { solid: false, dy: -6 }),
    piece(2, 5, 'bakery-7', 16), piece(9, 5, 'bakery-7', 16),
  ], { rug: [4, 4, 4, 2] });
  CC.NPCS['cb-bakery-in'] = [{ x: 5, y: 2, art: 'bun', h: 26, dir: 'down', talk: async function () {
    await CC.chat('Baker Bun', { early: ['Copper Rolls, fresh out of the oven! They\'re not made of copper. People keep asking.', 'A Copper Roll a day keeps the Healing Hut away. Well, it helps.'],
      night: ['Rustcoon got into the flour again. There are tiny white paw prints all over town.'] }, 'bun')();
    await CC.shopScreen(['copperroll', 'potion', 'superpotion'], 'Baker Bun');
    await say('Mind the crumbs!', 'Baker Bun');
  } }];
  // the Bell Tower: Old Toll at the bottom, the cracked Dusk Bell at the top
  townRoom('cb-tower', 'Bell Tower', [
    piece(8, 2, 'lighthouse-2', 22, { talk: function () { return climb('cb-tower-top', 4, 4); } }),
    piece(5, 2, 'lighthouse-7', 24, { solid: false, talk: 'The bell rope. Toll says not to pull it. It wouldn\'t ring anyway.' }),
    piece(1, 2, 'town-hall-4', 15), piece(1, 5, 'lighthouse-8', 13), piece(2, 5, 'lighthouse-4', 14),
  ], { rows: CC.ROOM10 });
  // upstairs rooms have no door: the stairs take you back down
  function upstairs(id, name, rows, decor, downTo) {
    CC.MAPS[id] = { name: name, indoors: true, tileset: 'interior', rows: rows, buildings: [], exits: [], decor: decor, inside: [4, 4], downTo: downTo };
  }
  async function climb(to, x, y) {
    CC.sfx('select'); await CC.fade(0.25, true);
    CC.world.enter(to, x, y, 'down'); await CC.fade(0.25, false);
  }
  CC.climb = climb; CC.upstairs = upstairs;
  upstairs('cb-tower-top', 'The Dusk Bell', ['#PPPPPPPP#', '#WwWWWWwW#', '#........#', '#........#', '#........#', '#........#', '##########'], [
    { x: 4, y: 3, img: 'props/landmark-dusk-bell', h: 34, dx: 8, talk: duskBell }, { x: 5, y: 3 },
    piece(8, 2, 'lighthouse-2', 22, { talk: function () { return climb('cb-tower-in', 7, 3); } }),
  ]);
  async function duskBell() {
    if (F().bellRings) { await say('The Dusk Bell gleams. The crack has healed without a trace, and it hums softly, as if it\'s still ringing somewhere far away.'); return; }
    await say('The Dusk Bell. A crack runs right down its side. You tap it gently. It doesn\'t make a sound.');
    if (CC.stage() === 'after') await say('For a moment you think you hear something from very deep below the town. A tiny, lonely hum.');
  }
  CC.NPCS['cb-tower-in'] = [{ x: 4, y: 4, art: 'toll', h: 26, dir: 'down', talk: CC.chat('Old Toll', {
    mid: ['Eh? The bell? I\'ve rung it every dusk since I was ten. Then one night, crack. Silence.', 'The old carving in the mine says the bell tells someone goodnight. I always wondered who.', 'Climb up and see it if you like. Mind the stairs. They\'re older than me. Nearly.'],
    after: ['The moon\'s back, but the bell\'s still cracked. Whoever it says goodnight to must still be missing.', 'I still climb up at dusk, just in case.'],
    final: ['It rang by itself. Someone heard it, at last.', 'Every dusk now. Like it never stopped.'],
  }, 'toll') }];
  // the two houses
  townRoom('cb-house1', 'A Copperbell House', [
    piece(4, 3, 'town-hall-7', 16, { dx: 8, talk: 'A family dinner table, set for four. Plus a little bowl for a creature.' }), { x: 5, y: 3 },
    piece(1, 2, 'town-hall-8', 18), piece(8, 2, 'town-hall-6', 20), piece(8, 5, 'farmhouse-6', 16),
  ], { rows: CC.ROOM10, rug: [3, 4, 4, 2] });
  CC.NPCS['cb-house1-in'] = [{ x: 2, y: 4, art: 'villager-13', h: 23, dir: 'right', talk: async function () {
    if (!F()['gift:house1']) { await say('A visitor! Here, have one of Bun\'s rolls. I bought too many. I always buy too many.', 'Mrs. Penny'); return CC.giftOnce('house1', 'copperroll', 2, 'You got 2 Copper Rolls!')(); }
    return CC.chat('Mrs. Penny', { early: ['My husband worked the mine before Grit shut it. He says the deep door hummed at night.', 'The Dingdoves roost on our roof. Our alarm clock is a bird.'] }, 'penny')();
  } }];
  townRoom('cb-house2', 'A Copperbell House', [
    piece(4, 3, 'town-hall-7', 16, { dx: 8 }), { x: 5, y: 3 }, piece(8, 2, 'town-hall-8', 18, { talk: 'A bed with a patchwork quilt. A Dingdove feather is tucked in the pillow.' }),
    piece(1, 2, 'farmhouse-5', 20), piece(1, 5, 'farmhouse-4', 11),
  ], { rows: CC.ROOM10 });
  CC.NPCS['cb-house2-in'] = [{ x: 6, y: 5, art: 'villager-11', h: 23, dir: 'left', talk: async function () {
    if (!F()['gift:house2']) { await say('Eh? A young creature catcher! Here. I\'ve had this cube since I was your age. Never caught a thing with it.', 'Grandpa Hob'); return CC.giftOnce('house2', 'great', 3, 'You got 3 Great Cubes!')(); }
    return CC.chat('Grandpa Hob', { early: ['Back in my day the mine was full of workers. Then Grit shut it. Said the old door was "lonely cold."', 'Professor Hollis reads everything twice. Ask him about the plaques.', 'The Dusk Bell\'s rung every evening since before my grandpa\'s grandpa.'],
      final: ['Did you hear it? The bell! I thought I\'d never hear it again.'] }, 'hob')();
  } }];
  // Grit's shack, by the mine
  townRoom('cb-grit', 'Grit\'s Shack', [
    piece(4, 2, 'mine-office-1', 16, { dx: 8, talk: 'Grit\'s old mine maps. A side tunnel on the west is labeled "lunch (lost)."' }), { x: 5, y: 2 },
    onWall(2, 'mine-office-4', 13, 'The same photo Dusty has: two young miners, covered in soot, grinning.'),
    piece(1, 2, 'mine-office-3', 20, { glow: true, talk: 'A pot of beans. Of course.' }), piece(8, 2, 'mine-office-2', 18), piece(8, 5, 'mine-office-7', 15), piece(1, 5, 'mine-office-5', 13),
  ], { rows: CC.ROOM10 });
  CC.NPCS['cb-grit-in'] = [{ x: 6, y: 4, art: 'grit', h: 26, dir: 'down', talk: CC.chat('Grit', {
    mid: ['Dusty sent you? Hah. That old rock-head still owes me a lunch.', 'We closed the mine \'cause of the old door at the bottom. Cold comes off it. Not ice cold. Lonely cold.',
      'Lost my lunchbox down the west tunnel years back. Had a sandwich in it. And a paper I found by the door. Keep the paper. Leave the sandwich.',
      'We stopped digging near the Geode. Something in there hums back when you knock.'],
    after: [function () { return F().sunEmber ? 'You\'ve got that warm light with you. That door at the bottom... maybe it\'s time someone opened it.' : 'The moon\'s back. But that old door\'s still cold. Whatever\'s behind it is still sad.'; },
      'Lost my lunchbox down the west tunnel years back. Keep the paper. Leave the sandwich.'],
    final: ['You opened it. You brought it home. ...Thanks, kid.'],
  }, 'grit') }];

  // ---------- the town's people ----------
  var townsfolk = [
    { x: 7, y: 11, art: 'villager-9', name: 'Flower Seller Daisy', patrol: [[6, 11], [8, 11]], talk: { early: ['Flowers! Fresh from the park. The Dingdoves keep trying to eat them.', 'Rustcoon come out at night and steal anything shiny. Even my hairpins.'],
      after: ['The flowers grow taller since the moon came back. I don\'t know why. I just sell them.'], night: ['Shh, the Rustcoon are out. Hold onto your coins!'] } },
    { x: 15, y: 9, art: 'villager-10', name: 'Lamplighter Wick', talk: { early: ['I light every lamp in town at dusk. Then I listen for the bell. It hasn\'t rung in months.', 'Old Toll still climbs the tower every evening, just in case.'],
      final: ['The bell rang! I nearly dropped my pole.'], night: ['Lovely, isn\'t it? Every lamp lit. Except the one in the bell tower. That one\'s Toll\'s.'] } },
    { x: 19, y: 18, art: 'villager-12', name: 'Kite Flyer Lark', talk: { early: ['Dingdoves roost in the bell tower. They coo like tiny bells! You\'ll only see them in the daytime.', 'My kite got stuck on the museum roof. Again.'],
      night: ['Rustcoons! They come out of the park bushes at night. One took my kite string.'] } },
    { x: 17, y: 13, art: 'villager-13', name: 'Market Seller Mo', shop: true, talk: { early: ['Potions, tonics, herbs! The best stall in the square. The only stall in the square.'] } },
    { x: 12, y: 21, art: 'villager-14', name: 'Guard Rusk', talk: { early: ['Welcome to Copperbell! The desert road\'s through the north gate. Bring water.', 'The mine\'s east of the square. Closed, mostly. Grit says so, and nobody argues with Grit.', 'Professor Hollis gives a prize to anyone who reads every plaque in the museum. Nobody ever does.'] } },
    { x: 4, y: 13, art: 'villager-16', name: 'Ms. Marlow', patrol: [[3, 13], [3, 11], [4, 11], [4, 13]], talk: { early: ['This is Biscuit. He\'s a dog. Not a creature. He\'s very offended when people try to catch him.', 'Biscuit barks at the bell tower every dusk. I think he misses the bell too.'] } },
  ];
  CC.NPCS.copperbell = townsfolk.map(function (t) {
    var chat = CC.chat(t.name, t.talk, t.name);
    CC.PORTRAITS[t.name] = t.art;
    return { x: t.x, y: t.y, art: t.art, h: 22, dir: 'down', patrol: t.patrol, talk: t.shop ? async function () {
      await chat(); await CC.shopScreen(['potion', 'superpotion', 'tonic', 'cureherb'], t.name);
    } : chat };
  });
  Object.assign(CC.PORTRAITS, { 'Nurse Holly': 'holly', Pim: 'pim', 'Mayor Barnaby': 'barnaby', 'Professor Hollis': 'hollis', 'Cubesmith Ada': 'ada', 'Ms. Poppy': 'poppy',
    'Baker Bun': 'bun', 'Old Toll': 'toll', Grit: 'grit', Tam: 'villager-15', Nell: 'villager-2', Ollie: 'trainer-17', 'Mrs. Penny': 'villager-13', 'Grandpa Hob': 'villager-11' });

  // ---------- trainers: two in the park, two in the mine ----------
  CC.addTrainers = function (mapId, list) {
    CC.NPCS[mapId] = CC.NPCS[mapId] || [];
    list.forEach(function (t) {
      var n = Object.assign({ h: 26, seenFlag: 'tr:' + t.id }, t);
      var fight = function () {
        return CC.fight({ trainer: { name: n.name, art: n.art, look: n.art, coins: n.team[n.team.length - 1][1] * 30, intro: n.intro, winText: n.win, team: team(n.team) } });
      };
      n.talk = n.onSpot = async function () {
        if (F()['tr:' + n.id]) { await say(n.after, n.name); return; }
        if ((await fight()) === 'win') F()['tr:' + n.id] = true;
      };
      CC.PORTRAITS[n.name] = n.art;
      CC.NPCS[mapId].push(n);
    });
  };
  CC.addTrainers('copperbell', [
    { id: 'cb-1', art: 'villager-15', name: 'Schoolboy Tad', x: 21, y: 17, dir: 'left', sight: 3, h: 22, team: [['rustcoon', 16], ['dingdove', 17]],
      intro: 'School\'s out! Battle me before my homework does!', win: 'I should have done my homework.', after: 'Ms. Poppy says Rustcoon\'s Coin Swipe finds you extra coins. I\'m saving up.' },
    { id: 'cb-2', art: 'villager-14', name: 'Guard Brass', x: 26, y: 15, dir: 'left', sight: 3, h: 22, team: [['pebblepup', 17], ['dingdove', 17], ['glimmole', 18]],
      intro: 'Halt! The mine is off limits. Unless you can beat me.', win: 'Fine. Go on, then. Mind the dark.', after: 'Grit\'s shack is right there. He knows the mine better than anyone.' },
  ]);

  // ---------- Glimmer Mine ----------
  var MINE = CC.addRegion('mine', {
    name: 'Glimmer Mine', spawns: 'mine', legend: 'mine', weather: 'cave', landmark: 'props/landmark-great-geode', buildingIds: [], inside: [12, 28],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTT........TTTTTTTTT',
      'TTTTTTTTT........TTTTTTTTT',
      'TTTTTTTTT..o..o..T....*TTT',
      'TTTTTTTTT........T.,,,.TTT',
      'TTx.LLLL,,..::.....,,,.TTT',
      'TT..LLLL,,..::.TTT.,,,.TTT',
      'TT..LLLL....::.TTT.....TTT',
      'TT......:::.::.TTT.....TTT',
      'TT,,,.......::.TTTTTTTTTTT',
      'TT,,,.......::.........xTT',
      'TTTTTTTTTTo.::...~~~~~~.TT',
      'TT....*TTTT.::...~~~~~~.TT',
      'TT.....TTTT.::...~~~~~~.TT',
      'TT.,,,.TTTT.::.::::.,,,.TT',
      'TT.,,,......::......,,,.TT',
      'TT.,,,.::::.::.....~~~~~TT',
      'TT.....::::.::..,,,~~~~~TT',
      'TT..........::..,,,~~~~~TT',
      'TT.....TTTT.::..,,,.....TT',
      'TTTTTTTTTTT.::.o......x.TT',
      'TTTTTTTTTTT.::.TTTTTTTTTTT',
      'TTTTTTTTo.*.dd...oTTTTTTTT',
      'TTTTTTTT.,,.dd.,,.TTTTTTTT',
      'TTTTTTTT.x,.dd.,,.TTTTTTTT',
      'TTTTTTTT.,,.dd.,,.TTTTTTTT',
      'TTTTTTTT.,,.dd..x.TTTTTTTT',
      'TTTTTTTTo...dd.*.oTTTTTTTT',
      'TTTTTTTTTTTTddTTTTTTTTTTTT',
    ],
    decor: [
      { x: 2, y: 13, img: 'props/mine-props-8', h: 11, talk: lunchbox },
      { x: 12, y: 2, img: 'props/landmark-ancient-door', h: 46, dx: 8, dy: -2, talk: function () { return CC.ancientDoor(); } },
      { x: 11, y: 2 }, { x: 13, y: 2 }, { x: 14, y: 2 },
      { x: 9, y: 28, img: 'props/mine-props-1', h: 13 }, { x: 16, y: 23, img: 'props/mine-props-2', h: 13 }, { x: 15, y: 27, img: 'props/mine-props-5', h: 11 },
      { x: 11, y: 21, img: 'props/mine-props-3', h: 20, solid: false, dx: -6 }, { x: 14, y: 14, img: 'props/mine-props-3', h: 20, solid: false, dx: 6 },
      { x: 9, y: 4, img: 'props/mine-props-4', h: 20 }, { x: 16, y: 4, img: 'props/mine-props-4', h: 20 }, { x: 5, y: 19, img: 'props/mine-props-7', h: 13 },
      { x: 22, y: 9, img: 'props/mine-props-6', h: 14 }, { x: 3, y: 9, img: 'props/mine-props-9', h: 12, solid: false }, { x: 21, y: 21, img: 'props/mine-props-9', h: 12, solid: false },
      { x: 21, y: 8, chest: 'mine-1', item: 'megapotion', n: 2 }, { x: 2, y: 20, chest: 'mine-2', item: 'ultra', n: 2 }, { x: 22, y: 16, chest: 'mine-3', item: 'revive', n: 1 },
    ],
  });
  MINE.decor.forEach(function (d) { if (d.chest) d.chest = 'mine-' + d.x + '-' + d.y; });
  CC.MAP_TRACK.mine = 'cave';
  var mineDoor = door('cb-mine');
  MINE.exits.push({ side: 'bottom', x0: 12, x1: 13, to: 'copperbell', tx0: mineDoor.door[0], ty: mineDoor.door[1] + 1, fixedX: true });
  CC.DOORS['cb-mine'] = 'mine';
  async function lunchbox() {
    if (CC.hasPage(7)) { await say('Grit\'s old lunchbox. The sandwich is still in there. You leave it.'); return; }
    await say('A miner\'s old metal lunchbox, dented and dusty. Inside: a very, very old sandwich (yuck), and a folded paper.');
    await CC.givePage(7);
  }
  // the Great Geode: where the mine's Keeper would wait (section 7.3)
  MINE.landmarkTalk = function () { return CC.keeperAt ? CC.keeperAt('mine') : say('The Great Geode. Its crystals hum, very softly, when you knock.'); };
  // the sealed door at the bottom of the mine (it opens in the post-game: 22-postgame.js)
  CC.ancientDoor = CC.ancientDoor || async function () {
    await say('A huge round stone door, carved with a wolf made of smoke curled around a moon and a sun.');
    await say('Words run around the edge: "One day, someone will come and bring you into the light." Cold comes off it. Not ice cold. Lonely cold.');
  };
  CC.addTrainers('mine', [
    { id: 'mine-1', art: 'trainer-22', name: 'Young Miner Clem', x: 12, y: 18, dir: 'down', sight: 3, team: [['glimmole', 20], ['coalcub', 21]],
      intro: 'Grit says the mine\'s closed. I say it\'s a training ground!', win: 'Caved in...', after: 'Coalcubs like the warm spots by the old furnaces.' },
    { id: 'mine-2', art: 'trainer-23', name: 'Old Miner Hettie', x: 6, y: 18, dir: 'right', sight: 3, team: [['rumblepede', 22], ['pickaxolotl', 22], ['prismole', 23]],
      intro: 'Forty years down here, and I still love a good battle!', win: 'You\'ve got a miner\'s grit!', after: 'Shardling glows in the dark tunnels at night. Lovely little thing.' },
  ]);
  CC.SIGNS['mine:11,24'] = 'Glimmer Mine. CLOSED. (Somebody has written underneath: "mostly.")';
  MINE.rows[24] = MINE.rows[24].slice(0, 11) + 'S' + MINE.rows[24].slice(12);
})();
