// The expansion, batch 1 (docs/creature-catch-expansion-guide.md, sections 5, 8.1 and 9.4): the Inn in Home Village,
// the guides' homes furnished with their own sets, Elder Willow's book and its rewards, Tinker's page, and new lines
// for the people already in the game.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  // a decor piece; wall: hangs on the wall row (walk-through, nudged down onto the wall)
  // (h is how tall it stands in game pixels; the new furniture sets are drawn a quarter bigger than they're listed)
  function piece(x, y, img, h, more) { return Object.assign({ x: x, y: y, img: 'furniture/' + img, h: Math.round(h * 1.25) }, more || {}); }
  function onWall(x, img, h, talk) { return { x: x, y: 1, img: 'furniture/' + img, h: Math.round(h * 1.2), solid: false, dy: 3, talk: talk }; }
  CC.piece = piece; CC.onWall = onWall;
  var ROOM10 = ['#PPPPPPPP#', '#WWwWWwWW#', '#........#', '#........#', '#........#', '#........#', '####mm####'];
  var ROOM12 = ['#PPPPPPPPPP#', '#WWwWWWWwWW#', '#..........#', '#..........#', '#..........#', '#..........#', '#..........#', '#####mm#####'];
  CC.ROOM10 = ROOM10; CC.ROOM12 = ROOM12;
  // a gift you can pick up once (flag gift:<id>)
  function gift(id, item, n, text) {
    return async function () {
      if (F()['gift:' + id]) return;
      F()['gift:' + id] = true; CC.state.bag[item] = (CC.state.bag[item] || 0) + n; CC.sfx('buy');
      await CC.showPrize(CC.ITEMS[item].icon, text);
    };
  }
  CC.giftOnce = gift;
  // something you can take once a day (by the real date): flag day:<id>
  CC.daily = async function (id, item, text, already) {
    var today = new Date().toDateString();
    if (F()['day:' + id] === today) { await say(already); return false; }
    F()['day:' + id] = today; CC.state.bag[item] = (CC.state.bag[item] || 0) + 1; CC.sfx('buy');
    await CC.showPrize(CC.ITEMS[item].icon, text);
    return true;
  };

  // ---------- the Inn: a new building in Home Village, where Rosa lets you rest until morning or night ----------
  var V = CC.MAPS.village;
  V.rows = [
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
  ];
  V.buildings.push({ id: 'inn', x: 22, y: 7, w: 4, h: 3, door: [23, 9] });
  V.decor.push({ x: 27, y: 9, img: 'props/village-props-18', h: 22 }, { x: 21, y: 10, img: 'props/village-props-12', h: 13 }, { x: 27, y: 3, img: 'props/rocks-and-bushes-6', h: 13 });
  CC.SIGNS['village:6,7'] = 'Home Village. Elder Willow: top left. Pip\'s Cube Shop: top middle. Healing Hut: bottom middle. The Inn: east. Meadow Path: north.';
  CC.MAPS['inn-in'] = CC.room('Rosa\'s Inn', ROOM12, ['village', 23, 10], [
    piece(5, 3, 'inn-1', 16, { dx: 8, counter: true }), { x: 6, y: 3, counter: true },
    piece(1, 2, 'inn-4', 22, { glow: true, talk: 'The hearth crackles. Something tasty is roasting.' }),
    piece(3, 2, 'inn-8', 18, { talk: function () { CC.sfx('select'); return say('You plink out a little tune on the piano. Rosa hums along.'); } }),
    piece(10, 2, 'inn-6', 22, { talk: 'Stairs up to the guest rooms. Rosa keeps them spotless.' }),
    onWall(8, 'inn-5', 14, 'The notice board: "Boat to Lantern Isle: ask Fisher Gus." "Copperbell Bakery: Copper Rolls, fresh daily!" "Lost: one Puffmunk\'s stash. Finder keeps it."'),
    piece(2, 5, 'inn-2', 14), piece(9, 5, 'inn-3', 20, { talk: 'A guest bed, fresh and turned down. Rosa has put a little mint on the pillow.' }), piece(10, 6, 'inn-7', 15), piece(1, 6, 'furn-5', 15),
  ], { rug: [4, 4, 4, 2] });
  CC.DOORS.inn = 'inn-in';
  CC.NPCS.village = CC.NPCS.village.filter(function (n) { return n.look !== 'rosa'; });
  CC.NPCS['inn-in'] = [{ x: 5, y: 2, look: 'rosa', art: 'rosa', h: 25, dir: 'down', talk: innkeeper }];
  var REST_COST = 30;
  // It's night by the game clock, whatever Options shows ("Always day" only changes the look). This replaces the
  // CC.isNight in 17-expansion.js, which went by the drawn light: night creatures, the firefly stump, the Dusk Cube
  // and resting "Until night" here work with Always day too.
  CC.isNight = function () { return CC.clockLight().night >= 0.4; };
  async function innkeeper() {
    var line = CC.linesFor({ early: ['Welcome to the Inn! Need a rest? I\'ll wake you at sunrise, or at nightfall, whichever you like.', 'Some creatures only come out after dark. A night\'s rest here is the easy way to meet them.'] });
    var n = innkeeper.n || 0; innkeeper.n = n + 1; // the welcome first
    await say(line[n % line.length], 'Rosa');
    var c = await CC.ask('Rest at the Inn? (' + REST_COST + ' coins, and your creatures are healed)', ['Until morning', 'Until night', 'No thanks']);
    if (c === 2 || c < 0) { await say('Come back any time, dear.', 'Rosa'); return; }
    if (CC.state.coins < REST_COST) { await say('Oh, you\'re a little short. Next time, then!', 'Rosa'); return; }
    CC.state.coins -= REST_COST;
    await CC.fade(0.5, true);
    CC.healParty(); CC.sfx('heal');
    var want = c === 0 ? 7.5 : 21, now = CC.gameHour();
    CC.state.clockShift = (((CC.state.clockShift || 0) + ((want - now + 24) % 24)) % 24 + 24) % 24;
    CC.state.lastHeal = { map: 'inn-in', x: 5, y: 5 };
    await CC.sleep(1.2); CC.unfade();
    await say(c === 0 ? 'You slept until morning. The sun is up, and your creatures are full of energy!'
      : 'You rested until nightfall. Your creatures are full of energy! The night creatures will be out.');
    if (c === 1 && CC.opts.daynight !== 'clock') await say('(Day and night is set to "Always day" in Options, so it still looks like day.)');
    CC.saveGame();
  }

  // ---------- the guides' homes, each with its own furniture ----------
  function home(id, name, mapId, decor, extra) {
    var b = CC.MAPS[mapId].buildings.find(function (x) { return x.id === 'home-' + id; });
    CC.MAPS['home-in-' + id] = CC.room(name, extra && extra.rows || ROOM10, [mapId, b.door[0], b.door[1] + 1], decor, extra);
    CC.DOORS['home-' + id] = 'home-in-' + id;
  }
  var journal = function (id, x, y) { return { x: x, y: y, img: 'items/map', h: 9, talk: 'journal:' + id }; };
  home('bramble', 'Farmer Bramble\'s Farmhouse', 'grassland', [
    piece(1, 2, 'farmhouse-1', 20, { glow: true, talk: 'A wood stove, still warm. A pot of soup simmers on top.' }),
    piece(2, 3, 'farmhouse-4', 11, { talk: 'Bramble\'s Pebblepup is curled up asleep by the stove. Its pebble nose twitches as it dreams.' }),
    piece(4, 3, 'farmhouse-2', 15, { dx: 8, talk: async function () {
      if (!F()['gift:bramble']) { await say('A note by the pie: "Help yourself to a Potion from the cupboard. Not the pie. - Bramble"'); await gift('bramble', 'potion', 1, 'You got a Potion!')(); return; }
      await say('An apple pie. It looks better than it smells. Don\'t tell Bramble.');
    } }), { x: 5, y: 3 },
    piece(6, 2, 'farmhouse-5', 22, { talk: 'Jars of jam: apple, apple, and apple. One label says "From Marigold. Better than yours."' }),
    piece(8, 2, 'farmhouse-8', 22, { talk: 'A cupboard of plates. One has a crack glued with honey.' }),
    piece(7, 5, 'farmhouse-6', 16), piece(4, 2, 'farmhouse-3', 14), journal('bramble', 1, 5),
  ], { rug: [3, 4, 4, 2] });
  home('oakley', 'Ranger Station', 'forest', [
    onWall(2, 'ranger-station-1', 15, 'A big map of the Forest. A path off the west edge is marked "Whispering Grove. Fennick. Bring patience."'),
    onWall(6, 'ranger-station-2', 15, sightings('forest')),
    piece(4, 3, 'ranger-station-3', 16, { dx: 8, talk: 'Binoculars, a lantern, and a list of owls with names like "Captain Hoot".' }), { x: 5, y: 3 },
    piece(8, 2, 'ranger-station-4', 18), piece(1, 2, 'ranger-station-5', 15), piece(8, 5, 'ranger-station-6', 16), journal('oakley', 1, 4),
  ]);
  home('gus', 'Fisher Gus\'s Shack', 'water', [
    piece(1, 2, 'dock-shack-1', 18), piece(3, 2, 'dock-shack-6', 18, { talk: 'Bottles and shells. One bottle has a tiny ship inside. Another has a tiny Gus inside. No, it\'s a reflection.' }),
    onWall(5, 'dock-shack-4', 14, 'Photos of big fish. One label reads: "The one that got away (it was a Koiling)."'),
    onWall(7, 'dock-shack-7', 14, 'A ship\'s wheel. Gus says he\'ll get a ship for it one day.'),
    piece(8, 2, 'dock-shack-8', 18, { glow: true }), piece(8, 4, 'dock-shack-5', 13), piece(1, 5, 'dock-shack-3', 12),
    piece(4, 4, 'dock-shack-2', 10, { talk: async function () {
      if (F().trialWater && !F().boatTicket) { await say('A note on the tackle box: "Passed my trial? Then the ticket\'s yours. Boat leaves from the cove south of the lake. - Gus"'); await giveBoatTicket(); return; }
      await say('A tackle box packed with lures. Every hook is labeled.');
    } }), journal('gus', 6, 5),
  ]);
  home('dusty', 'Mine Office', 'cave', [
    piece(4, 2, 'mine-office-1', 16, { dx: 8, talk: 'Blueprints of Glimmer Mine, east of Copperbell. Deep down, a circle is marked: "the old door. DON\'T."' }), { x: 5, y: 2 },
    onWall(2, 'mine-office-4', 13, 'A photo of two young miners covered in soot, grinning: Dusty and his old partner Grit.'),
    onWall(7, 'mine-office-2', 15), piece(1, 2, 'mine-office-3', 20, { glow: true, talk: 'A pot of beans bubbles on the stove. Dusty\'s lunch. And dinner.' }),
    piece(8, 2, 'mine-office-5', 13), piece(8, 5, 'mine-office-7', 15), piece(1, 5, 'mine-office-6', 15), journal('dusty', 6, 4),
  ], { rows: ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'] });
  home('safi', 'Safi\'s Tent', 'desert', [
    piece(3, 4, 'nomad-tent-1', 12, { solid: false, dx: 8, dy: 3 }),
    piece(4, 3, 'nomad-tent-3', 12, { dx: 8, talk: 'A brass teapot of mint tea, still warm.' }), { x: 5, y: 3 },
    piece(2, 3, 'nomad-tent-2', 10), piece(1, 2, 'nomad-tent-4', 20, { talk: 'A star chart. One star is circled in red: "The Moon\'s Eye."' }),
    piece(8, 2, 'nomad-tent-5', 16, { glow: true }), piece(6, 2, 'nomad-tent-6', 11),
    piece(8, 5, 'nomad-tent-7', 13, { talk: 'A letter from Grandmother Amani: "The oasis keeps its secrets under the water. When the moon is whole again, bring your friend to me."' }),
    journal('safi', 1, 5),
  ]);
  home('frida', 'Frida\'s Cabin', 'snow', [
    piece(1, 2, 'log-cabin-1', 22, { glow: true, talk: 'A roaring fire. You warm your hands.' }),
    piece(4, 4, 'log-cabin-2', 12, { solid: false, dx: 8, dy: 3 }),
    piece(3, 2, 'log-cabin-3', 16), piece(8, 2, 'log-cabin-4', 22, { talk: 'A bunk bed piled with quilts. The top bunk has a map pinned under the pillow.' }),
    piece(5, 2, 'log-cabin-5', 15, { dx: 8, talk: 'A map of the pass. A side trail is circled twice: "Steamvent Springs. Auntie Yuzu. SOUP."' }), { x: 6, y: 2 },
    piece(1, 5, 'log-cabin-6', 10), piece(8, 5, 'log-cabin-7', 9, { talk: 'A mug of cocoa. Frida left it to cool and forgot it. It\'s frozen solid.' }), journal('frida', 6, 5),
  ]);
  home('moss', 'Granny Moss\'s Hut', 'swamp', [
    piece(4, 3, 'witch-hut-1', 16, { dx: 8, glow: true, talk: function () {
      return CC.daily('moss-herb', 'cureherb', 'Granny\'s cauldron bubbles. She ladles out a Cure Herb for you!', 'The cauldron burps. Granny says come back tomorrow for another herb.');
    } }), { x: 5, y: 3 },
    piece(1, 2, 'witch-hut-2', 20), onWall(4, 'witch-hut-3', 13), piece(8, 2, 'witch-hut-5', 18, { talk: 'journal:moss' }),
    piece(1, 5, 'witch-hut-4', 11, { talk: 'The cat opens one eye, decides you\'re fine, and closes it again.' }),
    piece(7, 5, 'witch-hut-7', 16), piece(6, 5, 'witch-hut-6', 11),
  ], { rug: [3, 4, 4, 2] });
  home('corvin', 'Watchtower', 'ruins', [
    piece(4, 2, 'watchtower-1', 20, { talk: telescope }),
    piece(7, 2, 'watchtower-2', 16, { dx: 8, talk: 'journal:corvin' }), { x: 8, y: 2 },
    onWall(2, 'watchtower-3', 14, 'A chart of the moon\'s phases, with notes in tiny writing beside each one.'),
    piece(1, 2, 'watchtower-5', 22, { talk: 'A spiral staircase up to the lookout.' }), piece(8, 5, 'watchtower-6', 16), piece(1, 5, 'watchtower-7', 12),
    piece(5, 5, 'watchtower-4', 15, { talk: async function () {
      if (F().trialRuins && !F().archiveKey) { await say('An old iron key hangs on the lantern rack, tagged "ARCHIVE. For the one who passes."'); await giveArchiveKey(); return; }
      await say('A rack of lanterns, all trimmed and ready for the night watch.');
    } }),
  ], { rows: ['#PPPPPPPP#', '#WWwWWwWW#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '#cccccccc#', '####mm####'] });

  // the ranger's board: one rare creature and when it comes out
  function sightings() {
    return async function () {
      await say('SIGHTINGS BOARD. "Budstag: rare, in the Forest\'s tall grass. Mothlight: Forest, after dark. Burrhog: rolling through the Forest, any time."');
      await say('A newer note: "Whispering Grove (west): Snoozeloth, very rare. Hasn\'t moved in years. Might be a log."');
    };
  }
  // the moon through Corvin's telescope: its real phase tonight, and how bright it is in the story
  function telescope() {
    var days = ((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853, k = days / 29.530588853;
    var names = ['a new moon, nearly invisible', 'a thin waxing crescent', 'a half moon, the first quarter', 'a waxing gibbous moon, almost full',
      'a full moon', 'a waning gibbous moon', 'a half moon, the last quarter', 'a thin waning crescent'];
    var phase = names[Math.round(k * 8) % 8];
    return say('Through the telescope: ' + phase + '. ' + (F().moonRestored ? 'It shines bright and clear.' : 'Even so, it looks dim and tired, like a lamp running low.'));
  }

  // ---------- key items from the guides ----------
  async function giveBoatTicket() {
    F().boatTicket = true; CC.sfx('buy');
    await CC.showPrize('items/boat-ticket', 'You got the Boat Ticket! Show it to Gus at the Driftwood Cove dock to sail to Lantern Isle.');
    CC.saveGame();
  }
  async function giveArchiveKey() {
    F().archiveKey = true; CC.sfx('buy');
    await CC.showPrize('items/archive-key', 'You got the Archive Key! It opens the stairway down from the Night Ruins.');
    CC.saveGame();
  }
  CC.giveBoatTicket = giveBoatTicket; CC.giveArchiveKey = giveArchiveKey;

  // ---------- the guides, after their trials: their old lore, plus a hint toward the new places ----------
  var GUIDE_LINES = {
    forest: { early: ['West of the forest there\'s a grove of trees older than anything. An old fellow named Fennick lives there. Talks to the trees. Some of them answer.'] },
    water: { early: ['I run a boat from the cove south of here out to Lantern Isle. Your ticket\'s good any time.', 'Driftwood Cove\'s got a shipwreck on the sandbar. Coral says something walks out of it at low tide. Coral says a lot of things.'] },
    cave: { early: ['If you pass through Copperbell, look up my old partner Grit at the mine. Grumpiest man alive. Best friend I ever had.'] },
    desert: { early: ['My grandmother lives by the oasis. She says the sun has secrets too.'], after: ['Grandmother wants to meet you. Come to the oasis.', 'She is the one who taught me about the Moon\'s Eye.'] },
    snow: { early: ['Cold? There are hot springs off the side trail. Tell Auntie Yuzu I sent you. She\'ll feed you until you can\'t move.'] },
    swamp: { early: ['There\'s a bayou past my swamp where the fireflies glow brighter than anywhere. Bo can take you round. Go at night.'] },
    ruins: { early: ['My niece Ilsa studies under the ruins. Try to keep her from talking your ear off. You won\'t manage it.'] },
  };
  Object.keys(GUIDE_LINES).forEach(function (k) {
    var n = (CC.NPCS[k] || []).find(function (x) { return x.id === 'guide'; }), gd = CC.GUIDES[k];
    if (!n) return;
    var before = n.talk, extra = GUIDE_LINES[k];
    var chat = CC.chat(gd.name, { early: gd.lore.concat(extra.early), after: (extra.after || []).concat(gd.lore.slice(0, 1), extra.early) }, 'guide-' + k);
    n.talk = async function () {
      if (!F()[gd.flag]) return before();
      if (k === 'water' && !F().boatTicket) { await say('Passed my trial? Then here, a Boat Ticket. I run a boat from the cove south of here out to Lantern Isle.', gd.name); return giveBoatTicket(); }
      if (k === 'ruins' && !F().archiveKey) { await say('My niece Ilsa studies under the ruins. Here\'s the Archive Key. Try to keep her from talking your ear off. You won\'t manage it.', gd.name); return giveArchiveKey(); }
      return chat();
    };
  });
  // Farmer Bramble, once his trial is done
  var bramble = CC.NPCS.grassland.find(function (n) { return n.id === 'bramble'; }), brambleTalk = bramble.talk;
  var brambleChat = CC.chat('Farmer Bramble', { early: ['The Forest trail is all yours. Mind the owls!', 'My sister Marigold runs the orchard east of here. Don\'t tell her I said her pies are better than mine.', 'If you see a little newt sparkling in the grass of a morning, that\'s a Dewt. Shy thing.'] });
  bramble.talk = function () { return F().trial1 ? brambleChat() : brambleTalk(); };

  // ---------- Elder Willow's book, and the rewards for bringing pages home ----------
  var willow = CC.NPCS['willow-in'][0], willowTalk = willow.talk;
  willow.talk = async function () {
    await willowTalk();
    if (!F().starter) return;
    if (!F().willowBook) {
      F().willowBook = true; F().pageHints = true;
      await CC.talk('Elder Willow', ['One more thing. My book, The Long Dusk, is missing pages. Scattered over the years, I\'m afraid.', 'If you find any, bring them home. The book on my shelf will show you which ones are still out there.']);
    }
    await pageRewards();
    if (CC.stage() === 'after' && !F().balance) await say('The shadow that left Lunarion. I keep thinking about it. Out there, alone.', 'Elder Willow');
    if (CC.afterWillow) await CC.afterWillow();
  };
  async function pageRewards() {
    var n = CC.pageCount();
    if (n >= 4 && !F().pages4) {
      F().pages4 = true; CC.state.bag.great = (CC.state.bag.great || 0) + 5; CC.sfx('buy');
      await say('Four pages already! The book feels heavier in a good way. Take these.', 'Elder Willow');
      await CC.showPrize('ui/cube-great', 'Elder Willow gave you 5 Great Cubes!');
    }
    if (n >= 8 && !F().pages8) {
      F().pages8 = true; CC.state.bag.ultra = (CC.state.bag.ultra || 0) + 3; CC.sfx('buy');
      await say('Eight pages. You\'ve read more of this book than I have, lately. Here.', 'Elder Willow');
      await CC.showPrize('ui/cube-ultra', 'Elder Willow gave you 3 Ultra Cubes!');
      if (CC.hasPage(8)) await say('Look at page 8. That golden sun at the bottom. I\'ve never noticed it before. Safi might know what it means; her family has lived by the desert oasis forever.', 'Elder Willow');
    }
    if (n >= 12 && CC.stage() === 'final' && !F().pages12) {
      F().pages12 = true;
      if (CC.balanceRewards) await CC.balanceRewards();
    }
    CC.saveGame();
  }
  CC.pageRewards = pageRewards;
  // the book on Willow's shelf
  var shelf = CC.MAPS['willow-in'].decor.find(function (d) { return d.img === 'furniture/furn-3'; });
  shelf.talk = async function () {
    if (!CC.pageCount()) { await say('Old books on creatures. One is titled "The Long Dusk". Some of its pages are missing.'); return; }
    await say('The Long Dusk. ' + CC.pageCount() + ' of its 12 pages are back in place.');
    await CC.longDuskBook();
  };

  // ---------- Tinker: page 1, for showing him three creatures ----------
  var tinker = CC.NPCS.village.find(function (n) { return n.look === 'tinker'; }), tinkerTalk = tinker.talk;
  tinker.talk = async function () {
    if (!F().starter || CC.hasPage(1)) return tinkerTalk();
    var n = Object.keys(CC.state.caught).length;
    if (n < 3) { await say('I found a paper at the bottom of the well! Show me three different creatures you\'ve caught and I\'ll trade you for it. (You\'ve caught ' + n + '.)', 'Tinker'); return; }
    await say('One, two, three! Whoa, cool creatures. A deal\'s a deal. Here\'s the paper from the well!', 'Tinker');
    await CC.givePage(1);
  };

  // ---------- Pip and Hazel mention their family in Copperbell ----------
  var pip = CC.NPCS['shop-in'][0], pipTalk = pip.talk;
  pip.talk = async function () {
    if (CC.stage() !== 'early' && !F().pipLine) { F().pipLine = true; await say('My little brother runs a shop in Copperbell. He\'ll tell you he taught me everything. He\'s lying.', 'Pip'); }
    return pipTalk();
  };
  var hazel = CC.NPCS['hut-in'][0], hazelTalk = hazel.talk;
  hazel.talk = async function () {
    if (CC.stage() !== 'early' && !F().hazelLine) { F().hazelLine = true; await say('My cousin Holly runs the Healing Hut in Copperbell. Tell her I said hi!', 'Hazel'); }
    return hazelTalk();
  };

  // ---------- the outpost keepers: a line about their region before they help you ----------
  var KEEPER_LINES = {
    forest: ['Budstag only shows up now and then. Keep walking the tall grass.', 'Burrhogs roll through here sometimes. Mind the burrs!', 'Old Fennick lives in the grove off the west side of the forest.'],
    water: ['Splotter and Honkwave come out in the daytime. At night the lake goes quiet.', 'Koiling is rare. Folks say it climbs the waterfall when no one\'s looking.', 'Driftwood Cove is south of the lake, past the reeds.'],
    cave: ['Shardling only glows at night. If you see a light in the dark, that\'s one.', 'Rimeskink licks the frost off crystals. Cute, but cold.', 'The tunnel north comes out in Copperbell now. Mind the bell tower!'],
    desert: ['Kilnadillo and Mirajack come out under the hot sun. At night the dunes go quiet.', 'Scarabolt is rare. It buzzes around the cactus.', 'Safi\'s grandmother lives by the oasis.'],
    snow: ['Aurorelly drifts over the pass at night. Look up!', 'Yetiny\'s rare. It throws snowballs at people it likes.', 'There are hot springs off the side trail. Warmest place in the north.'],
    swamp: ['Fireflinks blink over the water at night.', 'Mireling is shy and rare. It hides in the reeds.', 'A boardwalk branches off to Firefly Bayou. Go after dark.'],
    ruins: ['Glyphlings float out of the walls after dark.', 'Some of the cubes lying around here... blink. Be careful.', 'Corvin keeps the key to the old stairway down.'],
  };
  Object.keys(KEEPER_LINES).forEach(function (k) {
    var room = 'outpost-in-' + k, n = CC.NPCS[room] && CC.NPCS[room][0], keeper = CC.KEEPERS[k], i = 0;
    if (!n) return;
    n.talk = function () {
      var lines = KEEPER_LINES[k], hello = 'Welcome to the ' + CC.MAPS[k].name + ' Outpost! I\'m ' + keeper[0] + '. ' + lines[i++ % lines.length];
      return CC.healingHut(keeper[0], { map: room, x: 4, y: 4 }, hello);
    };
  });
})();
