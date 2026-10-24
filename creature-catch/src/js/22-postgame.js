// The expansion, batch 5 (docs/creature-catch-expansion-guide.md, section 4): the post-game arc. Grandmother Amani
// opens the Dawn Temple under the oasis, Solarion wakes and gives you the Sun Ember, the Ember opens the old door in
// Glimmer Mine, Gloaming is found at the bottom of the Hollow Deep, the Dusk Bell rings again, and the three guardians
// meet at the top of the Moonlit Spire.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  function flash(sec) {
    var k = 0, scr = { name: 'flash', update: function () {}, draw: function () { CC.g.globalAlpha = Math.sin(k * Math.PI); CC.rect(0, 0, CC.W, CC.H, '#ffffff'); CC.g.globalAlpha = 1; } };
    CC.push(scr);
    return CC.tween(sec || 1.2, function (t) { k = t; }).then(function () { CC.pop(scr); });
  }
  function landmark(area, line) { return function () { return CC.keeperAt ? CC.keeperAt(area, line) : say(line); }; }
  function people(mapId, list) {
    CC.NPCS[mapId] = (CC.NPCS[mapId] || []).concat(list.map(function (p) {
      if (p.name && p.art) CC.PORTRAITS[p.name] = p.art;
      return Object.assign({ h: 25, dir: 'down' }, p, { talk: p.talk || CC.chat(p.name, p.lines, mapId + p.name) });
    }));
  }

  // ---------- the tiles ----------
  Object.assign(CC.LEGENDS, {
    // dawn temple: 0/15 sandstone, 1/8 sun floor, 2/12 carved walls, 3/13 light shafts, 4 raised block, 5 sand, 6 dry grass, 7/9/14 water channels
    temple: { rustle: ['#e8c060', '#c89830', '#fff0a0'], atlas: 'dawn-temple', ground: [0, 0, 15, 0, 5], dirtFrom: null, backdrop: '#3a2410',
      T: { i: [2, 12], solid: true, noflip: true }, ',': { i: [6] }, '*': { i: [1] }, l: { i: [3, 13], glow: '#ffd070' }, o: { i: [4], solid: true, noflip: true },
      '~': { i: [7, 9, 14], solid: true, noflip: true } },
    // hollow deep: 0/6 floor, 2/9 violet crystals, 3/13 black pools, 4/14 violet moss, 5/10 carved stone, 7/11/15 stalagmites
    hollow: { rustle: ['#9a6ad8', '#c8a8f8', '#5a3a8a'], atlas: 'hollow-deep', ground: [0, 0, 6, 0], dirtFrom: null, backdrop: '#0a0612', wall: true, wallAtlas: 'cave', wallTint: 'rgba(40,20,70,0.45)',
      ',': { i: [4, 14] }, ':': { i: [10, 5], noflip: true }, x: { i: [2, 9], solid: true, glow: '#a070f0' }, '~': { i: [3, 13], solid: true, glow: '#8a6ad8' }, o: { i: [7, 11, 15], solid: true } },
  });
  CC.OWN_LIGHT.temple = 1; CC.OWN_LIGHT.hollow = 1;
  CC.MAP_TRACK.temple = 'temple'; CC.MAP_TRACK.hollow = 'hollow';

  // ================= the oasis: Grandmother Amani opens the way =================
  var D = CC.MAPS.desert;
  people('desert', [
    { x: 16, y: 9, art: 'amani', name: 'Grandmother Amani', h: 26, when: function () { return F().moonRestored && !F().templeOpen; }, talk: amani },
    { x: 19, y: 9, art: 'safi', name: 'Safi', h: 26, dir: 'left', when: function () { return F().moonRestored && !F().templeOpen; }, talk: function () {
      return say(CC.pageCount() >= 8 ? 'Grandmother has been waiting for you. Go on, talk to her.' : 'Grandmother says you need to know the whole story first. ' + nextHint(), 'Safi');
    } },
  ]);
  function nextHint() {
    for (var n = 1; n <= 10; n++) if (!CC.hasPage(n)) return 'Have you looked here? ' + CC.PAGE_HINTS[n];
    return '';
  }
  async function amani() {
    if (CC.pageCount() < 8) {
      await CC.talk('Grandmother Amani', ['So you are the one who calmed the moon. Safi said you were taller.',
        'My family has kept a secret door under this oasis for a thousand years. But you must know the whole story before I open it. Bring at least eight pages of the old book.']);
      await say('You have ' + CC.pageCount() + ' of the Lost Pages. ' + nextHint());
      return;
    }
    await CC.talk('Grandmother Amani', ['So you are the one who calmed the moon. Safi said you were taller.', 'Eight pages. You know the story now: the sun asleep, the little one alone.',
      'My family has kept this door for a thousand years. We were starting to wonder if anyone would come.']);
    await CC.showStill('still-9', ['Grandmother Amani raises her sun-topped staff. The oasis water trembles, then parts.', 'Golden stairs lead down beneath the pool, glowing like morning.']);
    F().templeOpen = true;
    D.landmark = 'buildings/dawn-temple-entrance'; CC.world.refresh();
    await say('Go gently. It has been sleeping a very long time. Even a sun wakes up grumpy.', 'Grandmother Amani');
    CC.saveGame();
  }
  D.onEnter = function () { if (F().templeOpen && D.landmark !== 'buildings/dawn-temple-entrance') { D.landmark = 'buildings/dawn-temple-entrance'; CC.buildMapPicture('desert'); } };
  D.landmarkTalk = async function () {
    if (!F().templeOpen) { await say('The oasis. Its water is warm, even at night, as if something under it is dreaming.'); return; }
    CC.sfx('select'); await CC.fade(0.3, true); CC.world.enter('temple', 11, 24, 'up'); await CC.fade(0.3, false);
  };

  // ================= the Dawn Temple =================
  var TEMPLE = CC.addRegion('temple', {
    name: 'Dawn Temple', spawns: 'temple', legend: 'temple', landmark: 'props/landmark-sun-altar', weather: 'sunbeams', buildingIds: [], signArt: 'props/signpost-dawn-temple',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTT...LLLL...TTTTTTT',
      'TTTTTTT...LLLL...TTTTTTT',
      'TTTTTTT..........TTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTT..............TTTTT',
      'TTT...,,,.l..l.,,,...TTT',
      'TTT...,,,......,,,...TTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTo....*....*....oTTTT',
      'TT~~.,,,,......,,,,.~~TT',
      'TT~~.,,,,.l..l.,,,,.~~TT',
      'TT~~.,,,,......,,,,.~~TT',
      'TTTTo....*....*....oTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
      'TTTTTTTo........oTTTTTTT',
      'TTTTTTT.,,....,,.TTTTTTT',
      'TTTTTTT.,,l..l,,.TTTTTTT',
      'TTTTTTT.,,....,,.TTTTTTT',
      'TTTTTTT..........TTTTTTT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
    ],
    decor: [
      { x: 7, y: 20, img: 'props/dawn-temple-props-2', h: 20, glow: true }, { x: 16, y: 20, img: 'props/dawn-temple-props-2', h: 20 },
      { x: 4, y: 11, img: 'props/dawn-temple-props-1', h: 24 }, { x: 19, y: 11, img: 'props/dawn-temple-props-1', h: 24 }, { x: 4, y: 15, img: 'props/dawn-temple-props-1', h: 24 }, { x: 19, y: 15, img: 'props/dawn-temple-props-1', h: 24 },
      { x: 7, y: 3, img: 'props/dawn-temple-props-2', h: 20 }, { x: 16, y: 3, img: 'props/dawn-temple-props-2', h: 20 },
      { x: 3, y: 6, img: 'props/dawn-temple-props-3', h: 20, talk: 'A sandstone cat statue. Its eyes are two little suns. It has a riddle carved on it: "What wakes without waking?" The answer is scratched off.' },
      { x: 20, y: 6, img: 'props/dawn-temple-props-3', h: 20 }, { x: 8, y: 12, img: 'props/dawn-temple-props-6', h: 14 }, { x: 18, y: 14, img: 'props/dawn-temple-props-6', h: 14 },
      { x: 9, y: 21, img: 'props/dawn-temple-props-7', h: 10, solid: false }, { x: 17, y: 7, chest: 'temple-1', item: 'fulltonic', n: 2 }, { x: 6, y: 14, chest: 'temple-2', item: 'sunshard', n: 1 },
    ],
  });
  TEMPLE.decor.forEach(function (d) { if (d.chest) d.chest = 'temple-' + d.x + '-' + d.y; });
  TEMPLE.exits.push({ side: 'bottom', x0: 11, x1: 12, to: 'desert', tx0: 17, ty: 9, fixedX: true });
  // the light puzzle: in each hall a mirror must point at the sun switch; then the stone door slides open
  var FACE = ['up', 'right', 'down', 'left'], ARROW = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  var MIRRORS = [
    { id: 1, x: 8, y: 24, sw: [15, 24], door: [[11, 18], [12, 18]] },
    { id: 2, x: 5, y: 11, sw: [5, 15], door: [[11, 9], [12, 9]] },
    { id: 3, x: 18, y: 5, sw: [5, 5], door: [[11, 4], [12, 4]] },
  ];
  function want(m) { var dx = Math.sign(m.sw[0] - m.x), dy = Math.sign(m.sw[1] - m.y); return FACE.find(function (f) { return ARROW[f][0] === dx && ARROW[f][1] === dy; }); }
  function solved(m) { return F()['mirror' + m.id] === want(m); }
  MIRRORS.forEach(function (m) {
    TEMPLE.decor.push({ x: m.x, y: m.y, img: 'props/dawn-temple-props-4', h: 18, talk: function () { return turnMirror(m); } });
    TEMPLE.decor.push({ x: m.sw[0], y: m.sw[1], img: 'props/dawn-temple-props-8', h: 8, solid: false });
    m.door.forEach(function (p) { TEMPLE.decor.push({ x: p[0], y: p[1], img: 'props/dawn-temple-props-5', h: 16, gate: m.id, talk: 'A heavy sandstone block with a sun carved on it. It won\'t budge. Maybe light opens it?' }); });
  });
  function syncGates() {
    var changed = false;
    TEMPLE.decor.forEach(function (d) {
      if (!d.gate) return;
      var open = solved(MIRRORS[d.gate - 1]);
      if (open && d.img) { d.img = null; d.solid = false; d.talk = null; changed = true; }
    });
    return changed;
  }
  TEMPLE.onEnter = function () { if (syncGates()) CC.buildMapPicture('temple'); };
  async function turnMirror(m) {
    if (solved(m)) { await say('The mirror glows with caught sunlight, pointing at the sun switch.'); return; }
    var now = F()['mirror' + m.id] || 'up';
    if (!(await CC.yesNo('A bronze mirror on a stand, facing ' + now + '. Turn it?'))) return;
    var next = FACE[(FACE.indexOf(now) + 1) % 4];
    F()['mirror' + m.id] = next; CC.sfx('select');
    if (next !== want(m)) { await say('You turn the mirror to face ' + next + '. A spot of sunlight lands on the wall. Nothing happens.'); return; }
    CC.sfx('moon'); syncGates(); CC.world.refresh(); CC.world.shakeT = CC.time + 0.5;
    await say('You turn the mirror to face ' + next + '. A beam of sunlight shoots across the hall and lands on the sun switch!');
    await say('With a deep rumble, a stone door slides open.');
  }
  // the beams of the solved mirrors
  TEMPLE.drawOver = function (g, cx, cy) {
    MIRRORS.forEach(function (m) {
      if (!solved(m)) return;
      var x0 = m.x * 16 + 8 - cx, y0 = m.y * 16 + 4 - cy, x1 = m.sw[0] * 16 + 8 - cx, y1 = m.sw[1] * 16 + 10 - cy, k = 0.55 + Math.sin(CC.time * 4 + m.id) * 0.15;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(255,220,120,' + k * 0.5 + ')'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = 'rgba(255,250,220,' + k + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.restore();
    });
  };
  people('temple', [
    { x: 14, y: 23, art: 'amani', name: 'Grandmother Amani', h: 26, dir: 'left', lines: {
      after: ['Go gently. It has been sleeping a very long time. Even a sun wakes up grumpy.', 'The mirrors catch the light from above. Point each one at the sun on the floor.', 'My grandmother told me about this place when I was smaller than Safi.'],
      final: ['All three, together in the sky. My grandmother would have cried. I am only crying a little.'] } },
    { x: 12, y: 3, creature: 'solarion', h: 30, when: function () { return F().solarionWaits && !CC.state.caught.solarion; }, talk: solarionAgain },
  ]);
  CC.addTrainers('temple', [
    { id: 'temple-1', art: 'trainer-29', name: 'Explorer Indira', x: 17, y: 13, dir: 'left', sight: 4, team: [['sphinxie', 42], ['kilnadillo', 42], ['mirajack', 43]],
      intro: 'A real temple! And a real trainer! Today is the best day!', win: 'Even losing here is an adventure.', after: 'Mummoth isn\'t spooky. It\'s just tangled.' },
    { id: 'temple-2', art: 'trainer-30', name: 'Explorer Rafe', x: 6, y: 6, dir: 'right', sight: 4, team: [['mummoth', 43], ['sphinxie', 43], ['sphinxar', 44]],
      intro: 'My torch says battle! My torch is very wise.', win: 'My torch was wrong.', after: 'Sphinxie asks riddles, then forgets the answers. I like that about it.' },
  ]);
  // the Sun Altar: page 11, and Solarion wakes
  TEMPLE.landmarkTalk = async function () {
    if (F().solarionCalm) {
      if (CC.keeperAt && CC.keeperAt.has && CC.keeperAt.has('temple')) return CC.keeperAt('temple');
      await say('The Sun Altar. It\'s warm, like a stone that\'s been in the sun all day.'); return;
    }
    if (!CC.hasPage(11)) {
      await say('On the Sun Altar, under a golden lion curled up asleep, lies a single page. You take it gently.');
      await CC.givePage(11);
    }
    await wakeSolarion();
  };
  async function wakeSolarion() {
    CC.sfx('boss');
    await CC.showStill('still-10', ['As you read the last line aloud, the golden lion stirs.', 'Light bursts from its mane. Solarion, the guardian of the sun, opens its eyes for the first time in a thousand years.']);
    await say('...Who... is it morning? Why is everyone so LOUD?', 'Solarion');
    var r = await CC.fight({
      wild: CC.mon.make('groggysolarion', 48), bg: 'sun-altar', boss: true, noVs: false,
      introText: 'Groggy Solarion shakes its tangled mane and squints at you!', noCatch: 'It\'s too groggy to catch. Help it wake up first!', noRun: 'Solarion is blocking the way out!',
    });
    if (r !== 'win') return;
    CC.sfx('moon'); await flash(1.2);
    F().solarionCalm = true;
    await say('Solarion blinks. Its mane settles into a crown of sun-rays, warm and bright.');
    await CC.talk('Solarion', ['I am Solarion. Thank you for waking me, small one. The world turns because three of us keep it.', 'Find the little one who hides below. Tell it it was never forgotten.']);
    F().sunEmber = true; CC.sfx('buy');
    await CC.showPrize('items/sun-ember', 'You got the Sun Ember! It glows warm in your hands.');
    await catchSolarion(48);
  }
  async function catchSolarion(lv) {
    var r = await CC.fight({ wild: CC.mon.make('solarion', lv), bg: 'sun-altar', boss: true, canLose: true, noVs: true, introText: 'Solarion watches you calmly. It seems to be waiting.' });
    if (r === 'caught') { F().solarionWaits = false; await say('Solarion is calm in its cube. It feels like holding a little sunrise.'); }
    else { F().solarionWaits = true; CC.healParty(); await say('Solarion settles back onto the Sun Altar. It will wait for you there.'); }
    CC.saveGame();
  }
  async function solarionAgain() {
    await say('Solarion rests on the Sun Altar. It lifts its head as you come close.');
    await catchSolarion(48);
  }
  CC.PORTRAITS.Solarion = 'amani';

  // ================= the old door in Glimmer Mine =================
  var MINE = CC.MAPS.mine;
  CC.ancientDoor = async function () {
    if (F().doorOpen) {
      CC.sfx('select'); await CC.fade(0.3, true); CC.world.enter('hollow', 11, 1, 'down'); await CC.fade(0.3, false); return;
    }
    await say('A huge round stone door, carved with a wolf made of smoke curled around a moon and a sun.');
    if (!F().sunEmber) { await say('Words run around the edge: "One day, someone will come and bring you into the light." Cold comes off it. Not ice cold. Lonely cold.'); return; }
    await say('The Sun Ember grows warm in your hands, then warmer, then bright as a little sun...');
    await CC.showStill('still-11', ['You hold the Sun Ember up to the carving. The cold seal melts away in a rush of golden light.', 'Behind you, Grit and Dusty lift their lanterns. Neither of them says a word.']);
    F().doorOpen = true; CC.sfx('gate');
    await CC.talk('Grit', ['You opened it. ...Bring it home, kid. Whatever\'s down there.']);
    await say('Grit and I\'ll wait right here. Go on. We\'ve got the beans.', 'Dusty');
    CC.saveGame();
  };
  people('mine', [
    { x: 10, y: 4, art: 'grit', name: 'Grit', h: 26, when: function () { return F().doorOpen; }, lines: { after: ['Go on down. Take it slow. Bring it home.'], final: ['You did it. That cold\'s gone. Feels like a warm afternoon down here now.'] } },
    { x: 15, y: 4, art: 'dusty', name: 'Dusty', h: 26, dir: 'down', when: function () { return F().doorOpen; }, lines: { after: ['Forty years Grit\'s been worried about that door. Look at him now. Still worried.'], final: ['Grit smiled. I saw it. Don\'t tell anyone.'] } },
  ]);

  // ================= the Hollow Deep =================
  var HOLLOW = CC.addRegion('hollow', {
    name: 'Hollow Deep', spawns: 'hollow', legend: 'hollow', landmark: 'props/landmark-dusk-pool', weather: 'hollow', buildingIds: [], signArt: 'props/signpost-hollow-deep',
    rows: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'TTTTTTTTx......xTTTTTTTT',
      'TTTTTTTT.,,.....TTTTTTTT',
      'TTTTTTTT.,,....oTTTTTTTT',
      'TTTTTTTTo,,.....TTTTTTTT',
      'TTTTTTTT.....::.TTTTTTTT',
      'TTTTTTTTTTTTT::TT....xTT',
      'TTTTTTTTTTTTT::TT..,,,TT',
      'TTTTTTTTTTTTT::::..,,,TT',
      'TTTTTTTTTTTTTTTTT..,,,TT',
      'TTTx......xTTTTTT..,,,TT',
      'TTT.,,,,...TTTTTT.....TT',
      'TTT.,,,,~~.TTTTTTo::.oTT',
      'TTT.,,,,~~.TTTTTTT::TTTT',
      'TTT.,,,,...TTTTTTT::TTTT',
      'TTT........:::::::::TTTT',
      'TTT........:::::::::TTTT',
      'TTTo.::....TTTTTTTTTTTTT',
      'TTTTT::TTTTTTTTTTTTTTTTT',
      'TTTT.............~~xTTTT',
      'TTTT......LLLL...~~.TTTT',
      'TTTT.~~...LLLL.,,,,.TTTT',
      'TTTT.~~o.......,,,,.TTTT',
      'TTTTx..........,,,,.TTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    decor: [
      { x: 13, y: 5, img: 'props/hollow-deep-props-6', h: 18, talk: 'An old carved stone: a sun on one side, a moon on the other, and in the middle a little smudge, as if someone tried to carve a third thing and couldn\'t decide what it looked like.' },
      { x: 9, y: 17, img: 'props/hollow-deep-props-7', h: 10, solid: false }, { x: 19, y: 13, img: 'props/hollow-deep-props-7', h: 10, solid: false }, { x: 16, y: 25, img: 'props/hollow-deep-props-7', h: 10, solid: false },
      { x: 10, y: 4, img: 'props/hollow-deep-props-2', h: 14, solid: false }, { x: 6, y: 16, img: 'props/hollow-deep-props-2', h: 14, solid: false }, { x: 14, y: 21, img: 'props/hollow-deep-props-2', h: 14, solid: false },
      { x: 4, y: 18, img: 'props/hollow-deep-props-8', h: 11, talk: 'A broken lantern, very old. Someone left it here a long time ago, still pointed at the pool.' },
      { x: 20, y: 9, chest: 'hollow-1', item: 'ultra', n: 3 }, { x: 4, y: 13, chest: 'hollow-2', item: 'revive', n: 2 },
    ],
  });
  HOLLOW.decor.forEach(function (d) { if (d.chest) d.chest = 'hollow-' + d.x + '-' + d.y; });
  HOLLOW.exits.push({ side: 'top', x0: 11, x1: 12, to: 'mine', tx0: 12, ty: 3, fixedX: true });
  HOLLOW.landmarkTalk = async function () {
    if (!F().gloamingCalm) return findGloaming();
    if (CC.keeperAt && CC.keeperAt.has && CC.keeperAt.has('hollow')) return CC.keeperAt('hollow');
    await say('The Dusk Pool. Its water glows violet and orange, like a sunset held very still.');
  };
  people('hollow', [{ x: 14, y: 22, creature: 'gloaming', h: 26, when: function () { return F().gloamingWaits && !CC.state.caught.gloaming; }, talk: gloamingAgain }]);
  // walking down to the pool finds Gloaming (again, after a loss: findGloaming only shows the picture the first time)
  CC.TRIGGERS.hollow = function (x, y) { return y >= 21 && !F().gloamingCalm ? findGloaming : null; };
  var GENTLE = ['Gloaming flinches away.', 'Gloaming peeks out from behind its smoky tail.', 'Gloaming trembles, but it doesn\'t run.', 'Gloaming looks at you for the first time.'];
  async function findGloaming() {
    if (!F().gloamingSeen) {
      F().gloamingSeen = true;
      await CC.showStill('still-12', ['At the very bottom of the world, beside a still, glowing pool, something small is curled up in the dark.', 'A little wolf made of violet smoke. When the Sun Ember\'s light reaches it, it tries to hide.']);
    }
    await say('...Go away... I ruined everything... I always do...', 'Gloaming');
    var r = await CC.fight({
      wild: CC.mon.make('hidinggloaming', 50), bg: 'dusk-pool', boss: true, music: 'lullaby', noVs: true, turnLines: GENTLE,
      introText: 'Gloaming curls up small and tries to hide behind its tail.', noCatch: 'Gloaming is too frightened. Be gentle first!', noRun: 'You can\'t leave it alone down here. Not again.',
    });
    if (r !== 'win') return;
    CC.sfx('moon'); await flash(1.4);
    // it waits by the pool from now until it's caught: Page 12 saves the game before the catch battle
    F().gloamingCalm = true; F().gloamingWaits = true;
    await say('Gloaming uncurls. Its edges glow soft orange and pink, like the last light of the day.');
    await CC.talk('Gloaming', ['...You came all this way... for me?', '...Solarion said that? That I was never forgotten?', '...I kept this. It was always meant for whoever came.']);
    await CC.givePage(12);
    var r2 = await CC.fight({ wild: CC.mon.make('gloaming', 50), bg: 'dusk-pool', boss: true, canLose: true, noVs: true, music: 'lullaby', introText: 'Gloaming looks up at you, a little less afraid.' });
    if (r2 === 'caught') { F().gloamingWaits = false; await say('Gloaming is curled up in its cube, warm and safe. It isn\'t alone anymore.'); }
    else { CC.healParty(); await say('Gloaming settles by the Dusk Pool, watching you. It will wait here for you.'); }
    await say('Somewhere far above, very faintly, a bell rings once.');
    CC.saveGame();
  }
  async function gloamingAgain() {
    await say('Gloaming wags its smoky tail when it sees you.');
    var r = await CC.fight({ wild: CC.mon.make('gloaming', 50), bg: 'dusk-pool', boss: true, canLose: true, noVs: true, music: 'lullaby', introText: 'Gloaming bounds over to you!' });
    if (r === 'caught') F().gloamingWaits = false;
    else { CC.healParty(); await say('Gloaming settles by the Dusk Pool, watching you. It will wait here for you.'); }
    CC.saveGame();
  }
  CC.PORTRAITS.Gloaming = 'amani';

  // ================= the Dusk Bell rings again =================
  var TOWN = CC.MAPS.copperbell, townArrive = TOWN.onArrive;
  TOWN.onArrive = async function (ex) {
    if (townArrive) await townArrive(ex);
    if (F().gloamingCalm && !F().bellRings) await bellRings();
  };
  async function bellRings() {
    F().bellRings = true;
    if (CC.music) CC.music.play('credits');
    await CC.showStill('still-13', ['As the sun goes down over Copperbell, the Dusk Bell begins to swing on its own.', 'Its crack is gone. Golden rings of sound roll out over the rooftops, and the whole town comes out to listen.',
      'Far below, at the bottom of the world, something small hears it, and knows someone is thinking of it.']);
    if (CC.music) CC.music.play('town');
    await say('It rang! On its own! At dusk! I wept into my hat. It\'s a good hat for weeping.', 'Mayor Barnaby');
    await say('Old Toll says the guardians might finally be together. The top of the Moonlit Spire would be the place to see it.');
    CC.saveGame();
  }
  CC.bellRings = bellRings;
  // flying in counts as arriving too
  var fly = CC.flyScreen;
  CC.flyScreen = async function () {
    await fly();
    if (CC.state.map === 'copperbell' && F().gloamingCalm && !F().bellRings) await bellRings();
  };
  var top = CC.MAPS['cb-tower-top'];
  top.onEnter = function () {
    var bell = top.decor.find(function (d) { return d.bell || (d.img && d.img.indexOf('landmark-dusk-bell') >= 0); });
    if (!bell) return;
    bell.bell = true;
    var want2 = F().bellRings ? 'props/landmark-dusk-bell-mended' : 'props/landmark-dusk-bell';
    if (bell.img !== want2) { bell.img = want2; CC.buildMapPicture('cb-tower-top'); }
  };

  // ================= the Balance: three guardians together at the top of the Spire =================
  var prevSpire = CC.TRIGGERS.spire;
  CC.TRIGGERS.spire = function (x, y) {
    var t = prevSpire && prevSpire(x, y);
    if (t) return t;
    return y <= 4 && F().bellRings && !F().balance ? balance : null;
  };
  async function balance() {
    if (CC.music) CC.music.play('spire');
    await CC.showStill('still-14', ['At the top of the Moonlit Spire, the sky turns orange and violet. It\'s dusk.',
      'From one side rises Solarion, golden and warm. From the other, Lunarion, silver and full of stars.',
      'And between them, small and soft as smoke, Gloaming, glowing with a little light from each.',
      'For the first time in a thousand years, all three guardians are together in the sky.'], { keepBlack: true });
    F().balance = true; F().keeperTitle = true; F().duskRecipe = true;
    await credits2();
    CC.unfade();
    CC.healParty();
    CC.world.enter('willow-in', 5, 5, 'up');
    await CC.fade(0.01, true); await CC.fade(0.6, false);
    await CC.talk('Elder Willow', ['You saw them! All three! The whole village saw the sky light up at dusk.',
      'Sit down a moment. I have something to write.']);
    await say('Elder Willow takes out The Long Dusk and writes on the last page, slowly: "And the world was kept, by the sun, the moon, and the dusk, and by a friend."');
    await CC.showPrize('items/long-dusk-book', 'You are now the Keeper of the Long Dusk!');
    await say('Cubesmith Ada asked for the Dusk Cube recipe from the book. I sent it to her. Go and see her in Copperbell.', 'Elder Willow');
    await say('And they say that now the moon is full and the guardians are together, the world is dreaming more than ever. New creatures, born of dreams, will turn up more often now.', 'Elder Willow');
    CC.state.lastHeal = { map: 'hut-in', x: 5, y: 4 };
    CC.saveGame();
  }
  CC.balance = balance;
  // the second roll of the credits, with everyone who drew a creature
  function credits2() {
    if (CC.music) CC.music.play('credits');
    var drawn = [];
    (CC.FAMILY_CREATURES || []).forEach(function (c) { if (c.drawnBy && drawn.indexOf(c.drawnBy) < 0) drawn.push(c.drawnBy); });
    return new Promise(function (resolve) {
      var t = 0, lines = [
        ['Creature Catch', 22], ['', 0], ['The Long Dusk', 14], ['', 0], ['', 0],
        ['Three guardians keep the world:', 10], ['the sun for growing,', 10], ['the moon for dreaming,', 10], ['and the dusk for resting.', 10], ['', 0],
        ['New friends', 9], ['Marigold, Russet, Old Fennick, Coral, Keeper Wren,', 9], ['Mayor Barnaby, Professor Hollis, Cubesmith Ada,', 9], ['Ms. Poppy, Baker Bun, Pim, Nurse Holly, Old Toll,', 9],
        ['Grit, Auntie Yuzu, Boatman Bo, Archivist Ilsa,', 9], ['and Grandmother Amani', 9], ['', 0],
      ].concat(drawn.length ? [['Creatures drawn by', 9]].concat(drawn.map(function (n) { return [n, 12]; })).concat([['', 0]]) : [])
        .concat([['Code, story and battles', 9], ['Claude', 12], ['', 0], ['Thank you for playing!', 14], ['', 0], ['The world is always beginning.', 10]]);
      var stars = []; for (var i = 0; i < 70; i++) stars.push([Math.random() * 240, Math.random() * 160, Math.random() * 6]);
      var end = 20 + lines.length * 0.95;
      var scr = { name: 'credits', opaque: true,
        update: function (dt) { t += dt * (CC.input.held.a ? 4 : 1); if (t > end && (CC.input.pressed.a || t > end + 8)) { CC.pop(scr); resolve(); } },
        draw: function () {
          var g = CC.g, grd = g.createLinearGradient(0, 0, 0, 160); grd.addColorStop(0, '#2a1a4a'); grd.addColorStop(0.6, '#a04a5a'); grd.addColorStop(1, '#f0a050');
          g.fillStyle = grd; g.fillRect(0, 0, 240, 160);
          stars.forEach(function (s) { if (s[1] > 80) return; g.globalAlpha = 0.4 + Math.sin(CC.time * 2 + s[2]) * 0.4; CC.rect(s[0], s[1], 1, 1, '#ffffff'); }); g.globalAlpha = 1;
          var bob = function (k) { return Math.sin(CC.time * 1.5 + k) * 4; };
          CC.drawSprite(CC.creatureSprite('solarion'), 40, 70 + bob(0), { scale: 0.42, id: 'solarion' });
          CC.drawSprite(CC.creatureSprite('gloaming'), 120, 64 + bob(1), { scale: 0.34, id: 'gloaming' });
          CC.drawSprite(CC.creatureSprite('lunarion'), 200, 70 + bob(2), { scale: 0.42, id: 'lunarion' });
          g.globalAlpha = 0.55; CC.rect(0, 84, 240, 76, '#1a1026'); g.globalAlpha = 1;
          var y = 170 - t * 13;
          lines.forEach(function (l) { if (l[1] && y > 80 && y < 170) CC.text(l[0], 120, y, '#ffffff', { size: l[1], align: 'center', shadow: '#000000' }); y += l[1] ? l[1] + 7 : 9; });
          if (t > end) CC.text('A: continue', 232, 150, '#e8d8f0', { size: 9, align: 'right' });
        } };
      CC.push(scr);
    });
  }
  CC.credits2 = credits2;
  // Juniper hears about the other guardians
  var jun = CC.NPCS.spire && CC.NPCS.spire.find(function (n) { return n.art === 'juniper-older' && n.x === 8; });
  if (jun) {
    var junTalk = jun.talk;
    jun.talk = async function () {
      if ((F().solarionCalm || F().gloamingCalm) && !F().junGuardians) {
        F().junGuardians = true;
        await say('Solarion? Gloaming? There are THREE guardians? Okay. After you meet them all, we\'re having a rematch. I want to see this.', 'Juniper');
      }
      return junTalk();
    };
  }
  // every page found, after the Balance: Willow reads the whole book with you
  CC.balanceRewards = async function () {
    await say('Every page. The whole book, back together for the first time in my life. Thank you.', 'Elder Willow');
    CC.state.bag.ultra = (CC.state.bag.ultra || 0) + 5; CC.sfx('buy');
    await CC.showPrize('ui/cube-ultra', 'Elder Willow gave you 5 Ultra Cubes! You can read The Long Dusk any time from your Bag.');
  };
  // Elder Willow points the way once the moon is back
  CC.afterWillow = async function () {
    if (!F().moonRestored || F().templeOpen) return;
    if (CC.pageCount() >= 8) await say('That sun on page 8... Safi\'s grandmother lives by the desert oasis. I have a feeling she\'s been waiting for you.', 'Elder Willow');
    else await say('The rest of the book is still out there. Find eight pages, and I think the story will show you where to go next.', 'Elder Willow');
  };
})();
