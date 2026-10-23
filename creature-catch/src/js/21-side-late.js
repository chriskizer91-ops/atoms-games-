// The expansion, batch 4 (docs/creature-catch-expansion-guide.md, sections 3.7 to 3.9): Steamvent Springs off
// Frostpeak Pass, Firefly Bayou off Murkmire Swamp, and the Ancients' Archive under the Night Ruins.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  var piece = CC.piece, onWall = CC.onWall;
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
  function chests(map, key) { map.decor.forEach(function (d) { if (d.chest) d.chest = key + '-' + d.x + '-' + d.y; }); }
  function landmark(area, line) { return function () { return CC.keeperAt ? CC.keeperAt(area, line) : say(line); }; }
  // rest and be healed (an inn's bath, a healing machine)
  CC.restHere = async function (spot, text) {
    await CC.fade(0.4, true); CC.healParty(); CC.sfx('heal'); await CC.sleep(0.9); CC.unfade();
    CC.state.lastHeal = spot;
    await say(text || 'Your creatures are healed and full of energy!');
    CC.saveGame();
  };
  var CHECK10 = ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'];

  // ---------- the tiles ----------
  Object.assign(CC.LEGENDS, {
    // springs: 0/12 snow, 1/5/10 hot pools, 2/4/11 bamboo fences, 3/9/15 frosty tall grass, 6 stepping stones, 7/13 boardwalk
    springs: { rustle: ['#ffffff', '#c8e8f8', '#8ab8d0'], atlas: 'springs', ground: [12, 0, 12], dirtFrom: null, backdrop: '#e8f0f8', trees: ['props/trees-4'], pines: 1, treeGround: [12],
      ',': { i: [3, 9, 15] }, ':': { i: [7, 13], turns: true, noflip: true }, r: { i: [6] }, '~': { water: true }, f: { i: [4, 11], solid: true, noflip: true } },
    // bayou: 0/14 mud, 1/6/8/11 dark water, 2/7 roots, 3/12 hanging moss, 4/10 reeds, 5 dock planks, 9/15 cypress knees, 13 log
    bayou: { rustle: ['#6a8a3a', '#a8c860', '#3a5a2a'], atlas: 'bayou', ground: [0, 14, 0], dirtFrom: null, backdrop: '#0e2420',
      ',': { i: [4, 10] }, ':': { i: [0, 14] }, '~': { i: [6, 1, 8, 11, 6, 9], solid: true }, d: { i: [5], turns: true, noflip: true }, x: { i: [2, 7], solid: true, noflip: true } },
    // archive: 0/14 stone floor, 1/10 glowing rune floor, 2/8/13 bookshelf walls, 3/9 carpet, 4/11 papers, 5/12 rune moss, 6 broken stones, 7 stairs
    archive: { rustle: ['#4ae0a0', '#a8f8d0', '#2a8a6a'], atlas: 'archive', ground: [0, 14, 0, 4, 6], dirtFrom: null, backdrop: '#0e1420',
      T: { i: [2, 8, 13], solid: true, noflip: true }, ',': { i: [5, 12], glow: null }, ':': { i: [3], turns: true, noflip: true }, r: { i: [1], glow: '#4ae0c8' },
      o: { i: [0], solid: true }, s: { i: [7], noflip: true } },
  });
  CC.OWN_LIGHT.archive = 1;
  Object.assign(CC.ART_INFO, { 'hot-spring-inn': { door: 0.42, width: 92 }, 'bo-boathouse': { door: 0.45 }, 'archive-stairs': { door: 0.45 } });

  // ================= Steamvent Springs =================
  var SPR = CC.addRegion('springs', {
    name: 'Steamvent Springs', spawns: 'springs', legend: 'springs', signArt: 'props/signpost-springs', landmark: 'props/landmark-great-geyser', weather: 'steam', geyser: true, waterTint: '#5ae8d0',
    buildingIds: [['springs-inn', 'hot-spring-inn']],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'T....................T',
      'T...BBBBB.........,,,T',
      'T...BBBBB......LLL,,,T',
      'T...BBBBB......LLL,,,T',
      'T...BBDBB......LLL...T',
      'T...:::::::::::::::..T',
      'T..........::..,,,,,,T',
      'Tffffff.ff.::........T',
      'T.~~~~~r...::..~~~~~.T',
      'T.~~~~~r...::..~~~~~.T',
      'T.~~~~~r...::..~~~~~.T',
      'T.~~~~~r...::.r......T',
      'T..........::.ff..fffT',
      'T,,,,,.~~~.::........T',
      'T,,,,,.~~~.::::::::S::',
      'T,,,,,.....:::::::::::',
      'TTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 1, y: 5, img: 'props/springs-props-1', h: 18 }, { x: 10, y: 5, img: 'props/springs-props-1', h: 18 }, { x: 13, y: 12, img: 'props/springs-props-2', h: 14, talk: 'A little steam vent. It puffs warm air on your face, like a sleepy dragon.' },
      { x: 8, y: 12, img: 'props/springs-props-3', h: 15 }, { x: 1, y: 12, img: 'props/springs-props-4', h: 11 }, { x: 9, y: 9, img: 'props/springs-props-5', h: 9 },
      { x: 3, y: 1, img: 'props/springs-props-7', h: 14, solid: false, dy: 4 }, { x: 9, y: 1, img: 'props/springs-props-7', h: 14, solid: false, dy: 4 },
      { x: 13, y: 9, img: 'props/springs-props-8', h: 10 }, { x: 20, y: 9, img: 'props/springs-props-6', h: 14 }, { x: 20, y: 14, chest: 'springs', item: 'fulltonic', n: 1 },
    ],
  });
  chests(SPR, 'springs');
  SPR.landmarkTalk = landmark('springs', 'The Great Geyser rumbles. With a WHOOSH it shoots steam into the sky, and for a moment there\'s a rainbow, and a shape in the steam that looks like it\'s waving.');
  CC.SIGNS['springs:19,15'] = 'Steamvent Springs. The hot spring inn: north. The Great Geyser: northeast. Please don\'t splash the Steamacaque.';
  var SN = CC.MAPS.snow;
  setRow(SN, 15, ':::::::::::::::::.,,,,.T');
  setRow(SN, 16, ':::::::..........x.....T');
  var rock = SN.decor.find(function (d) { return d.x === 2 && d.y === 16; });
  if (rock) rock.y = 17;
  link('snow', { side: 'left', y0: 15, y1: 16, tx: 20, ty0: 15 }, 'springs', { side: 'right', y0: 15, y1: 16, tx: 1, ty0: 15 });
  CC.SIGNS['snow:11,11'] = 'Frostpeak Pass. Frida\'s cabin: northwest. Frozen falls: northeast. Steamvent Springs: west, down the side trail. Swamp: north, past the ice wall.';
  room('springs', 'springs-inn', 'springs-inn-in', 'Hot Spring Inn', [
    piece(4, 3, 'bathhouse-2', 14, { dx: 8, talk: 'Bowls of soup, steaming. Auntie Yuzu always has one ready.' }), { x: 5, y: 3 },
    piece(8, 2, 'bathhouse-4', 18), onWall(3, 'bathhouse-5', 13),
    piece(8, 5, 'bathhouse-6', 12, { talk: 'A sleeping mat with a thick quilt. It looks unbelievably cozy.' }),
    piece(1, 5, 'springs-props-1', 15, { img: 'props/springs-props-1' }),
    piece(6, 2, 'bathhouse-3', 20, { talk: async function () { await say('Through the paper screen: the bathhouse.'); return CC.climb('springs-bath', 4, 4); } }),
  ], { rug: [3, 4, 4, 2] });
  // the bathhouse room: soak, and your creatures are healed
  CC.upstairs('springs-bath', 'The Bathhouse', ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '##########'], [
    piece(3, 2, 'bathhouse-1', 18, { dx: 8, talk: function () { return CC.restHere({ map: 'springs-inn-in', x: 4, y: 4 }, 'You soak in the hot spring. Your creatures splash around happily. Everyone is healed!'); } }), { x: 4, y: 2 },
    piece(1, 2, 'bathhouse-3', 20), piece(7, 2, 'bathhouse-4', 18), piece(1, 5, 'springs-props-4', 11, { img: 'props/springs-props-4' }),
    piece(7, 5, 'workshop-6', 12, { img: 'furniture/bathhouse-3', h: 18, talk: function () { return CC.climb('springs-inn-in', 6, 3); } }),
    { x: 5, y: 4, img: 'creatures/steamacaque', h: 14, talk: 'A Steamacaque is soaking with a little towel on its head. It nods at you, very politely.' },
  ]);
  CC.MAP_TRACK['springs-bath'] = 'outpost';
  people('springs-inn-in', [{ x: 2, y: 3, art: 'yuzu', name: 'Auntie Yuzu', talk: yuzu }]);
  var yuzuChat = CC.chat('Auntie Yuzu', {
    early: ['Come in, come in, you look frozen! Soup first, questions after.', 'The Steamacaque soak here all day. They pay in grooming. It\'s a fair deal.',
      'When the big geyser goes up, the steam makes a shape. Some days it waves.', 'The bathhouse is through the screen. A soak heals everyone, creatures too.'],
  }, 'yuzu');
  async function yuzu() {
    if (!F().yuzuMet) {
      F().yuzuMet = true;
      await say('Come in, come in, you look frozen! Soup first, questions after.', 'Auntie Yuzu');
      CC.state.bag.warmsoup = (CC.state.bag.warmsoup || 0) + 1; CC.sfx('buy');
      await CC.showPrize('items/warm-soup', 'Auntie Yuzu gave you a Warm Soup!');
      return;
    }
    if (!CC.hasPage(8)) {
      await say('Oh, before I forget. This old paper? I\'ve been using it as a coaster. Is it important? It\'s a lovely coaster.', 'Auntie Yuzu');
      await CC.givePage(8); return;
    }
    var today = new Date().toDateString();
    if (F()['day:soup'] !== today) {
      F()['day:soup'] = today; CC.state.bag.warmsoup = (CC.state.bag.warmsoup || 0) + 1; CC.sfx('buy');
      await CC.showPrize('items/warm-soup', 'Auntie Yuzu gave you today\'s Warm Soup!');
      return;
    }
    return yuzuChat();
  }
  CC.addTrainers('springs', [
    { id: 'springs-1', art: 'trainer-24', name: 'Hiker Bruno', x: 16, y: 6, dir: 'down', sight: 3, team: [['flurrpaca', 24], ['sleetle', 24], ['steamacaque', 25]],
      intro: 'I hiked three days for this soak. Let\'s battle first!', win: 'Ahh. Now I really need that soak.', after: 'Mittencub\'s hugs can thaw anything. If you can find one.' },
    { id: 'springs-2', art: 'trainer-25', name: 'Snowboarder Kit', x: 3, y: 14, dir: 'right', sight: 3, team: [['steamacaque', 25], ['flurrpaca', 26]],
      intro: 'Shredded the whole pass! Now I\'m shredding you!', win: 'Totally wiped out.', after: 'Yetiny is super rare around here. It throws snowballs at people it likes.' },
  ]);

  // ================= Firefly Bayou =================
  var BAY = CC.addRegion('bayou', {
    name: 'Firefly Bayou', spawns: 'bayou', legend: 'bayou', signArt: 'props/signpost-bayou', landmark: 'props/landmark-lantern-tree', weather: 'bayou',
    buildingIds: [['bayou-bo', 'bo-boathouse'], ['bayou-hut', 'small-healing-hut']],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~............T',
      'T~~~~~~~~~~~~...LLLLL.x..T',
      'T.BBBB...~~~~.x.LLLLL....T',
      'T.BBBB...~~~~...LLLLL....T',
      'TxBDBB...~~~~........,,,,T',
      'T.....,,.~~~~,,,.....,,,,T',
      'T..::.,,.~~~~,,,.....,,,,T',
      'T..::.,,.~~~~d,,.........T',
      ':::::....~~~~d~~~~~~~~~~~T',
      ':::::::::dd~~~~~~~~~~~~~~T',
      'T..::....~~~~~~~~~~~~~~~~T',
      'T..::....~~~~........,,,,T',
      'T..::BBB.~~~d........,,,,T',
      'T..::BBB.~~~d..,,,,,.,,,,T',
      'T..::BDB.~~~~..,,,,,.....T',
      'T..::...x~~~~..,,,,,.....T',
      'T,,,,,,,.~~~~..,,,,,.....T',
      'T,,,,,,,.~~~~...........xT',
      'T~~~~~~~~~~~~.x..........T',
      'T~~~~~~~~~~~~............T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 21, y: 19, img: 'props/bayou-props-5', h: 14, talk: stump },
      { x: 7, y: 3, img: 'props/bayou-props-3', h: 18, solid: false }, { x: 14, y: 12, img: 'props/bayou-props-3', h: 18, solid: false }, { x: 22, y: 7, img: 'props/bayou-props-3', h: 18, solid: false },
      { x: 11, y: 4, img: 'props/bayou-props-8', h: 9 }, { x: 10, y: 15, img: 'props/bayou-props-8', h: 9 }, { x: 16, y: 10, img: 'props/bayou-props-8', h: 9 }, { x: 6, y: 20, img: 'props/bayou-props-8', h: 9 },
      { x: 3, y: 1, img: 'props/bayou-props-1', h: 12 }, { x: 20, y: 11, img: 'props/bayou-props-1', h: 12 }, { x: 5, y: 9, img: 'props/bayou-props-7', h: 13, solid: false },
      { x: 8, y: 11, img: 'props/bayou-props-4', h: 10, talk: 'A glass jar with holes in the lid. It\'s empty: whoever caught the fireflies let them go.' },
      { x: 11, y: 9, img: 'props/bayou-props-2', h: 12, dy: 4 }, { x: 24, y: 1, chest: 'bayou', item: 'ultra', n: 3 }, { x: 13, y: 20, chest: 'bayou', item: 'revive', n: 2 },
    ],
  });
  chests(BAY, 'bayou');
  BAY.landmarkTalk = landmark('bayou', 'The Lantern Tree. Moss hangs down like curtains, and fireflies drift in and out of it like they\'re visiting.');
  CC.MAP_TRACK.bayou = 'swamp';
  var SW = CC.MAPS.swamp;
  setRow(SW, 15, 'T~~~..,,,,,,..::::::::::');
  setRow(SW, 16, 'T~~...,,,,,,..:.......::');
  link('swamp', { side: 'right', y0: 15, y1: 16, tx: 1, ty0: 9 }, 'bayou', { side: 'left', y0: 9, y1: 10, tx: 22, ty0: 15 });
  CC.SIGNS['swamp:6,12'] = 'Murkmire Swamp. Granny Moss: northwest, over the water. Outpost: east. Firefly Bayou: east, along the boardwalk. Night Ruins: north.';
  async function stump() {
    if (CC.hasPage(9)) { await say('An old mossy stump. A few fireflies still like to sit on it.'); return; }
    if (!CC.isNight()) { await say('An old mossy stump. Nothing special about it... in the daytime, anyway.'); return; }
    await say('Fireflies swirl down out of the dark and gather on the old stump until it glows like a lantern. Something papery is tucked in a crack!');
    await CC.givePage(9);
  }
  // Bo's boat between the three islands
  var DOCKS = [['the west island', 9, 10, 'right'], ['the Lantern Tree', 13, 8, 'down'], ['the south island', 12, 13, 'down']];
  function boDock(i) {
    return async function () {
      var dest = DOCKS.filter(function (d, j) { return j !== i; });
      if (!F().boMet) { F().boMet = true; await CC.talk('Boatman Bo', ['Climb aboard. Mind the lotus. They don\'t like boots.', 'Folks think the bayou\'s spooky. It\'s just shy. Like everything else round here.']); }
      var c = await CC.ask('Where to?', dest.map(function (d) { return d[0].replace(/^the /, 'To the '); }).concat(['Stay here']));
      if (c < 0 || c >= dest.length) { await say(CC.pick(['Come back after dark. The fireflies know where things are hidden. They like to show off.', 'When every firefly gathers on the Lantern Tree at once, the Bayou Lantern wakes.', 'No hurry. The bayou isn\'t going anywhere.']), 'Boatman Bo'); return; }
      var d = dest[c]; CC.sfx('select');
      await CC.fade(0.5, true); CC.world.enter('bayou', d[1], d[2], d[3]); CC.world.banner = null; await CC.fade(0.5, false);
    };
  }
  people('bayou', [
    { x: 10, y: 10, art: 'bo', name: 'Boatman Bo', dir: 'left', h: 26, talk: boDock(0) },
    { x: 13, y: 9, art: 'bo', name: 'Boatman Bo', dir: 'up', h: 26, talk: boDock(1) },
    { x: 12, y: 14, art: 'bo', name: 'Boatman Bo', dir: 'up', h: 26, talk: boDock(2) },
  ]);
  room('bayou', 'bayou-bo', 'bayou-bo-in', 'Bo\'s Boathouse', [
    onWall(4, 'bathhouse-5', 13, 'Paper lanterns strung on a net. Bo lights them one by one every evening.'),
    piece(1, 2, 'dock-shack-1', 18), piece(8, 2, 'dock-shack-3', 12), piece(4, 3, 'nomad-tent-3', 12, { dx: 8, talk: 'A kettle of chicory coffee. Bo says it keeps him slow and steady.' }), { x: 5, y: 3 },
    piece(1, 5, 'bayou-props-4', 10, { img: 'props/bayou-props-4' }), piece(8, 5, 'dock-shack-5', 13),
  ]);
  room('bayou', 'bayou-hut', 'bayou-hut-in', 'Bayou Healing Hut', [
    { x: 4, y: 3, img: 'furniture/heal-1', h: 22, dx: 8, counter: true }, { x: 5, y: 3, counter: true },
    { x: 7, y: 2, img: 'furniture/heal-3', h: 26, talk: 'vault' }, { x: 2, y: 2, img: 'furniture/heal-5', h: 24 }, { x: 1, y: 5, img: 'furniture/heal-4', h: 18 },
  ], { rows: CHECK10 });
  people('bayou-hut-in', [{ x: 4, y: 2, art: 'villager-9', name: 'Nurse Lily', talk: function () {
    return CC.healingHut('Nurse Lily', { map: 'bayou-hut-in', x: 4, y: 4 }, 'Welcome to the bayou hut! I\'m Lily. The fireflies keep me company on the night shift.');
  } }]);
  people('bayou-bo-in', [{ x: 2, y: 4, art: 'villager-11', name: 'Old Crawdad', dir: 'right', lines: { early: ['Bo\'s my nephew. Slowest boatman in the world, and the best.', 'Lotusprite sleeps in the lotus flowers all day. At night they light up the whole channel.'],
    night: ['Hear that? The whole bayou\'s humming. Fireflies are out.'] } }]);
  CC.addTrainers('bayou', [
    { id: 'bayou-1', art: 'trainer-26', name: 'Bayou Fisher Gumbo', x: 16, y: 12, dir: 'down', sight: 3, team: [['mudtusk', 29], ['wispeel', 29], ['snaptrap', 30]],
      intro: 'You scared off my catfish! Now you gotta battle me.', win: 'Well, I\'ll be.', after: 'Mudtusk blows bubbles in the mud when it\'s happy. Cutest thing.' },
    { id: 'bayou-2', art: 'trainer-27', name: 'Firefly Catcher Jojo', x: 20, y: 5, dir: 'left', sight: 3, team: [['fireflink', 30], ['fireflink', 30], ['lotusprite', 31]],
      intro: 'I catch fireflies and let them go! Want to see my best ones?', win: 'They flew away... that\'s okay, they always do.', after: 'Something glows on the south island when it\'s dark. Something special.' },
  ]);

  // ================= the Ancients' Archive =================
  var R = CC.MAPS.ruins;
  [21, 22, 23].forEach(function (y) { R.rows[y] = R.rows[y].slice(0, 18) + '....' + R.rows[y].slice(22); });
  R.buildings.push({ id: 'archive-door', x: 18, y: 21, w: 4, h: 3, door: [19, 23], art: 'archive-stairs', small: true });
  var ARC = CC.addRegion('archive', {
    name: 'Ancients\' Archive', spawns: 'archive', legend: 'archive', landmark: 'props/landmark-forbidden-shelf', weather: 'cave', buildingIds: [], inside: [11, 22],
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTT........TTTTTTTT',
      'TTTTTTTT.o.LL.o.TTTTTTTT',
      'TTTTTTTT...LL...TTTTTTTT',
      'TT....................TT',
      'TT.,,,,..T.::.T.......TT',
      'TT.,,,,....::.........TT',
      'TT.,,,,....::....,,,,.TT',
      'TT.......T.::.T..,,,,.TT',
      'TT.......To::oT.......TT',
      'TTTTTTTTTT.rr.TTTTTTTTTT',
      'TTTTTTTTTT.::.TTTTTTTTTT',
      'TT.......T.::.T.......TT',
      'TT.,,,,,...::...,,,,,.TT',
      'TT.,,,,,..o::o..,,,,,.TT',
      'TT.,,,,,.T.rr.T.,,,,,.TT',
      'TT.......T.::.T.......TT',
      'TTTTTTTT...::...TTTTTTTT',
      'TTTTTTTT...::...TTTTTTTT',
      'TTTTTTTT.r.::.r.TTTTTTTT',
      'TTTTTTTT...::...TTTTTTTT',
      'TTTTTTTT...::...TTTTTTTT',
      'TTTTTTTT........TTTTTTTT',
      'TTTTTTTTTTTssTTTTTTTTTTT',
    ],
    decor: [
      { x: 2, y: 4, img: 'props/archive-props-9', h: 20, talk: glyphWall }, { x: 3, y: 4 },
      { x: 20, y: 4, img: 'props/archive-props-8', h: 18, talk: 'A great clockwork orrery: a golden sun and a silver moon on brass arms, and a tiny violet bead between them that never stops moving.' },
      { x: 9, y: 2, img: 'props/archive-props-5', h: 22 }, { x: 14, y: 2, img: 'props/archive-props-5', h: 22 }, { x: 10, y: 9, img: 'props/archive-props-5', h: 22 }, { x: 13, y: 9, img: 'props/archive-props-5', h: 22 },
      { x: 10, y: 14, img: 'props/archive-props-5', h: 22 }, { x: 13, y: 14, img: 'props/archive-props-5', h: 22 },
      { x: 7, y: 6, img: 'props/archive-props-4', h: 15, talk: 'A reading desk with a book left open. It\'s about the Long Dusk. Someone has underlined "kindness" in three colors.' },
      { x: 17, y: 12, img: 'props/archive-props-4', h: 15 }, { x: 3, y: 16, img: 'props/archive-props-2', h: 13 }, { x: 20, y: 16, img: 'props/archive-props-3', h: 12 },
      { x: 8, y: 4, img: 'props/archive-props-6', h: 10, solid: false, dy: -6 }, { x: 15, y: 13, img: 'props/archive-props-6', h: 10, solid: false, dy: -6 }, { x: 4, y: 12, img: 'props/archive-props-6', h: 10, solid: false, dy: -6 },
      { x: 21, y: 8, img: 'props/archive-props-7', h: 22 },
      { x: 9, y: 21, img: 'furniture/heal-2', h: 18, talk: function () { return CC.restHere({ map: 'archive', x: 11, y: 21 }, 'An old Ancients\' healing stone. It glows warm, and your creatures are healed!'); } },
      { x: 18, y: 6, cube: 'arc-real', talk: cubePickup('arc-real', false) }, { x: 3, y: 14, cube: 'arc-mimic-1', talk: cubePickup('arc-mimic-1', true) },
      { x: 20, y: 13, cube: 'arc-mimic-2', talk: cubePickup('arc-mimic-2', true) }, { x: 21, y: 9, chest: 'archive', item: 'moonshard', n: 1 },
    ],
  });
  chests(ARC, 'archive');
  ARC.decor.forEach(function (d) { if (d.cube) { d.img = 'ui/cube'; d.h = 8; d.solid = true; } });
  ARC.landmarkTalk = landmark('archive', 'The Forbidden Shelf. Glowing teal chains hold it shut. Behind them, the books glow softly, and you could swear one of them is snoring.');
  CC.MAP_TRACK.archive = 'ruins';
  ARC.exits.push({ side: 'bottom', x0: 11, x1: 12, to: 'ruins', tx0: 19, ty: 24, fixedX: true });
  CC.DOORS['archive-door'] = 'archive';
  var enterDoor = CC.enterDoor;
  CC.enterDoor = async function (mapId, id) {
    if (id === 'archive-door' && !F().archiveKey) { await say('Stone stairs lead down under the ruins, but an iron gate blocks them. It has a big old keyhole.'); return; }
    return enterDoor(mapId, id);
  };
  // the cubes lying around: some are real, and some are Mimicubes
  function cubePickup(id, mimic) {
    return async function (d) {
      if (F()['cube:' + id]) return;
      F()['cube:' + id] = true; d.img = null; d.solid = false; CC.world.refresh();
      if (!mimic) { CC.state.bag.cube = (CC.state.bag.cube || 0) + 1; CC.sfx('buy'); await CC.showPrize('ui/cube', 'You found an old Basic Cube!'); return; }
      await say('You bend down to pick up the cube... The cube blinked at you!'); CC.sfx('encounter');
      await CC.battleTransition();
      var sp = CC.SPAWNS[CC.world.mapId === 'ruins' ? 'ruins' : 'archive'];
      await CC.startBattle({ wild: CC.mon.make('mimicube', CC.randi(sp.levels[0], sp.levels[1])) });
    };
  }
  R.decor.push({ x: 16, y: 13, cube: 'ruins-mimic', img: 'ui/cube', h: 8, talk: cubePickup('ruins-mimic', true) }, { x: 2, y: 21, cube: 'ruins-real', img: 'ui/cube', h: 8, talk: cubePickup('ruins-real', false) });
  // picked-up cubes stay gone
  [ARC, R].forEach(function (m) {
    var before = m.onEnter;
    m.onEnter = function () {
      var changed = false;
      m.decor.forEach(function (d) { if (d.cube && F()['cube:' + d.cube] && d.img) { d.img = null; d.solid = false; changed = true; } });
      if (changed) CC.buildMapPicture(m === R ? 'ruins' : 'archive');
      if (before) before();
    };
  });
  // the blank wall: three Glyphlings make it speak
  async function glyphWall() {
    if (CC.hasPage(10)) { await say('The blank wall. One word glows on it now, in the Ancients\' runes: "Kindness."'); return; }
    var s = CC.state, n = s.party.concat(s.vault || []).filter(function (m) { return m.id === 'glyphling'; }).length;
    if (!F().ilsaWall) { await say('A smooth, blank stone tablet. There are faint grooves in it, like letters that wandered off.'); return; }
    if (n < 3) { await say('The blank wall. ' + (n ? 'Your Glyphling' + (n > 1 ? 's glow' : ' glows') + ' a little near it, but nothing happens. Archivist Ilsa said it takes three.' : 'Archivist Ilsa said three Glyphlings might make it speak.')); return; }
    await say('Your three Glyphlings float up to the blank wall. They glow brighter and brighter... and the wall lights up with one word: "Kindness."');
    CC.sfx('moon');
    await say('It says "Kindness." The whole wall, just that. And look, this was tucked behind the stone!', 'Archivist Ilsa');
    await CC.givePage(10);
  }
  people('archive', [{ x: 13, y: 20, art: 'ilsa', name: 'Archivist Ilsa', dir: 'left', talk: ilsa }]);
  var ilsaChat = CC.chat('Archivist Ilsa', {
    mid: ['The Glyphlings are words! Living words! If we get three of them near the blank wall, I think they\'ll spell something.', 'The Forbidden Shelf isn\'t locked to keep us out. It\'s locked to keep something cozy in.',
      'Some of the cubes lying around are Mimicubes. They\'re harmless. Mostly. They\'re very pleased with themselves.', 'Inkwing only comes out at night. It steals letters. Mine, specifically.'],
    final: ['I\'m writing a book about you. It\'s mostly footnotes.', 'The Forbidden Shelf isn\'t locked to keep us out. It\'s locked to keep something cozy in.'],
  }, 'ilsa');
  async function ilsa() {
    if (!F().ilsaWall) {
      F().ilsaWall = true;
      await CC.talk('Archivist Ilsa', ['You\'re Uncle Corvin\'s friend! He never has friends. This is wonderful.',
        'The Glyphlings are words! Living words! If we get three of them near the blank wall in the west room, I think they\'ll spell something.']);
      return;
    }
    return ilsaChat();
  }
  CC.addTrainers('archive', [
    { id: 'archive-1', art: 'trainer-28', name: 'Scholar Quill', x: 18, y: 15, dir: 'left', sight: 3, team: [['glyphling', 33], ['inkwing', 33], ['pebbleton', 34]],
      intro: 'Shhh! This is a library! ...Okay, a quiet battle.', win: 'Fine, fine. Back to my reading.', after: 'Clocktoise has kept perfect time for a thousand years. I\'m always late.' },
    { id: 'archive-2', art: 'trainer-13', name: 'Scholar Edith', x: 4, y: 8, dir: 'right', sight: 4, team: [['glyphling', 34], ['clocktoise', 34], ['mimicube', 35]],
      intro: 'Oh! It\'s you again. I\'ve been translating. These runes really DO say "battle the traveler."', win: 'Mistranslated again.', after: 'The runes on the Forbidden Shelf say "do not disturb." Very politely.' },
  ]);
})();
