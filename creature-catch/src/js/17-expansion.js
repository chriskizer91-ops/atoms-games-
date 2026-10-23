// The expansion's groundwork (docs/creature-catch-expansion-guide.md): story stages, people whose lines change as
// the story moves on, the clock, the Lost Pages of Elder Willow's book "The Long Dusk", the new items, and wild
// creatures that come out by day or by night.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }

  // ---------- story stages: early (before the Cave trial), mid (until the moon is back), after, final (the Balance) ----------
  var STAGES = ['early', 'mid', 'after', 'final'];
  CC.stage = function () {
    var f = F();
    return f.balance ? 'final' : f.moonRestored ? 'after' : f.trialCave ? 'mid' : 'early';
  };
  // dusk counts as night: night creatures come out as the light goes
  CC.isNight = function () { return CC.daylight().night >= 0.4; };

  // ---------- people who say one line each time you talk, the next line next time ----------
  // talk: { early: [...], mid: [...], after: [...], final: [...], night: [...], lead: { Pebblepup: '...', Fire: '...' } }
  // A stage with no lines uses the nearest stage before it (or after it, if there is none before).
  // Lines can be functions that return a line (or nothing, to skip it).
  var turn = {};
  CC.linesFor = function (talk) {
    var st = STAGES.indexOf(CC.stage()), lines = null;
    for (var i = st; i >= 0 && !lines; i--) if (talk[STAGES[i]] && talk[STAGES[i]].length) lines = talk[STAGES[i]];
    for (var j = st + 1; j < STAGES.length && !lines; j++) if (talk[STAGES[j]] && talk[STAGES[j]].length) lines = talk[STAGES[j]];
    lines = (lines || []).slice();
    if (talk.night && CC.isNight()) lines = lines.concat(talk.night);
    var lead = CC.leadCreature();
    if (talk.lead && lead) {
      var c = CC.CREATURES[lead.id], hit = talk.lead[c.name] || c.types.map(function (t) { return talk.lead[t]; }).filter(Boolean)[0];
      if (hit) lines.push(typeof hit === 'function' ? hit : hit.replace('{name}', CC.mon.name(lead)));
    }
    return lines.map(function (l) { return typeof l === 'function' ? l() : l; }).filter(Boolean);
  };
  CC.leadCreature = function () { var p = CC.state.party; return p && p.find(function (m) { return m.hp > 0; }) || (p && p[0]); };
  // the talk function for a person: each talk shows the next line in order, looping
  CC.chat = function (who, talk, id) {
    id = id || who;
    return async function () {
      var lines = CC.linesFor(talk);
      if (!lines.length) return;
      var n = (turn[id] || 0) % lines.length; turn[id] = n + 1;
      await CC.say(lines[n], { who: who });
    };
  };

  // ---------- the Lost Pages ----------
  CC.PAGES = [
    null,
    { title: 'Strangers', text: 'In the oldest days, people and creatures were strangers. The creatures hid in the tall grass, and the people were afraid of the dark between the trees. Neither knew the other was only shy.' },
    { title: 'Gifts', text: 'The first people to cross the line between field and grass were called the Ancients. They left small gifts at the edge of the meadows: apples, seeds, smooth shining stones. In the morning the gifts were gone, and a little path had been trampled through the grass.' },
    { title: 'The First Friend', text: 'Under the oldest oak, a girl of the Ancients sat very still for a whole day. At sunset a small creature crept out and sat beside her. Neither of them moved until the stars came out. That was the first friendship, and the oak remembers it still.' },
    { title: 'The First Cube', text: 'The Ancients wished to carry their friends on long journeys. On the shore of the great lake they shaped the first cube: purple for the night sky, blue for the water, and a seam of light where the two meet, like the horizon at dusk. A creature rests inside it as if it were home.' },
    { title: 'Two Guardians', text: 'Two guardians watched over the world. Solarion, the golden lion, carried the sun across the sky. Lunarion, the silver wolf, kept the moon alight through the night. They never met, for one always rose as the other set.' },
    { title: 'The Little One', text: 'Between the day and the night there is one quiet hour, and it belongs to a third guardian, soft as smoke. The Ancients named it Gloaming. It tucks the world in for the night. It has no light of its own, so it borrows a little from each of the others.' },
    { title: 'Messages', text: 'Gloaming carried messages between the sun and the moon: a good morning from one, a good night from the other. It loved them both. But it was always the one in between, and it was always a little alone. The Ancients rang a bell each evening so it would know someone was thinking of it.' },
    { title: 'The Sleeping Sun', text: 'Once the sun guardian grew tired and lay down to sleep beneath the desert sands. Its warm dreams made a spring bloom in the dunes. The Ancients built a temple around it and made a promise: when the world needs you, we will wake you.', sun: true },
    { title: 'The Long Dusk', text: 'With the sun asleep, Gloaming had only the moon to visit. It held on tighter and tighter, until it slipped inside Lunarion\'s tired heart. The moon grew dim, night after night. The Ancients called those dark years the Long Dusk.' },
    { title: 'Kindness', text: 'The Ancients did not end the Long Dusk with cubes or with anger. They battled gently, the way you play with a scared friend, until Gloaming let go. Afterward it fled deep under the earth, ashamed. The Ancients sealed a door to let it rest and carved a promise on the stone: one day, someone will come and bring you into the light.' },
    { title: 'To Whoever Wakes Me', text: 'I am Solarion. The world turns because three of us keep it: the moon for dreaming, the sun for growing, and the dusk for resting. Find the little one who hides below. Tell it that it was never forgotten.' },
    { title: 'Beginnings', text: 'Every full moon, the world imagines something new. A child draws a shape by lantern light, and somewhere in the tall grass a creature that never existed before opens its eyes. That is why the cube\'s seam glows. The world is always beginning.' },
  ];
  // where each page waits, for the hints in Willow's book
  CC.PAGE_HINTS = [null,
    'Tinker in Home Village found something at the bottom of the well.',
    'Look around the apple trees in Willowbrook Orchard.',
    'The Grandmother Oak in Whispering Grove is holding onto something.',
    'Something washed up on the beach at Driftwood Cove.',
    'Keeper Wren, at the top of the Lantern Isle lighthouse.',
    'Professor Hollis at the Copperbell museum. Read every plaque.',
    'A miner lost a lunchbox in Glimmer Mine\'s west tunnel.',
    'Auntie Yuzu at the Steamvent Springs inn.',
    'In Firefly Bayou, after dark. The fireflies know where.',
    'Archivist Ilsa, under the Night Ruins.',
    'Somewhere in the Dawn Temple.',
    'The very bottom of the world.',
  ];
  CC.pageCount = function () { var p = CC.state.pages || {}; return Object.keys(p).filter(function (k) { return p[k]; }).length; };
  CC.hasPage = function (n) { return !!(CC.state.pages && CC.state.pages[n]); };
  CC.givePage = async function (n) {
    var s = CC.state; s.pages = s.pages || {};
    if (s.pages[n]) return;
    s.pages[n] = true; F().anyPage = true;
    if (CC.pageCount() >= 12) F().longDusk = true;
    CC.sfx('chest');
    await CC.showPrize('items/lost-page', 'You found Lost Page ' + n + ' of The Long Dusk: "' + CC.PAGES[n].title + '"!');
    await CC.readPage(n);
    await CC.say(CC.pageCount() >= 12 ? 'That\'s every page! Elder Willow will want to see the whole book.'
      : 'Pages found: ' + CC.pageCount() + ' of 12. Elder Willow keeps the book back home.');
    CC.saveGame();
  };

  // a storybook page: the title, the text in a hand-lettered column, and the page number
  CC.readPage = function (n, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var pg = CC.PAGES[n], lines = CC.wrap(pg.text, 176, 9), t0 = CC.time;
      var scr = {
        name: 'page', opaque: true,
        update: function () {
          if (CC.time - t0 < 0.3) return;
          if (CC.input.pressed.a || CC.input.pressed.b || CC.input.pressed.start) { CC.sfx(CC.input.pressed.b ? 'back' : 'select'); CC.pop(scr); resolve(CC.input.pressed.b ? 'back' : 'next'); }
        },
        draw: function () {
          var g = CC.g;
          CC.rect(0, 0, 240, 160, '#2a1a12');
          for (var y = 0; y < 160; y += 10) CC.rect(0, y, 240, 1, '#33211a');
          // the page: old paper with a darker rim and a torn edge
          CC.rect(18, 6, 204, 148, '#8a6a42');
          CC.rect(20, 8, 200, 144, '#efe0bc');
          g.fillStyle = 'rgba(160,120,70,0.18)'; g.fillRect(20, 8, 200, 6); g.fillRect(20, 146, 200, 6); g.fillRect(20, 8, 5, 144); g.fillRect(215, 8, 5, 144);
          for (var i = 0; i < 20; i++) { CC.rect(20 + i * 10 + (i % 3), 150 + (i % 2), 6, 2, '#2a1a12'); }
          var icon = CC.img('items/lost-page');
          if (icon) g.drawImage(icon, 26, 12, icon.width, icon.height);
          CC.text('The Long Dusk', 120, 12, '#8a5a32', { size: 9, align: 'center' });
          CC.text(n + '. ' + pg.title, 120, 24, '#4a2a18', { size: 12, align: 'center' });
          CC.rect(60, 40, 120, 1, '#c8a878');
          lines.slice(0, 11).forEach(function (l, i) { CC.text(l, 32, 46 + i * 9.4, '#3a2418', { size: 9 }); });
          if (pg.sun) { // the golden sun Willow notices
            var sx = 196, sy = 132; g.fillStyle = '#e8a828';
            for (var r = 0; r < 8; r++) { var a = r * Math.PI / 4; g.fillRect(Math.round(sx + Math.cos(a) * 7) - 1, Math.round(sy + Math.sin(a) * 7) - 1, 2, 2); }
            g.beginPath(); g.arc(sx, sy, 4, 0, Math.PI * 2); g.fill();
          }
          CC.text('Page ' + n + ' of 12', 120, 141, '#8a6a4a', { size: 8, align: 'center' });
          if (Math.floor(CC.time * 2) % 2) CC.text(opts.more ? 'A: next page' : 'A: close', 212, 141, '#8a6a4a', { size: 8, align: 'right' });
        },
      };
      CC.push(scr);
    });
  };
  // the book: every page you have, to read again (B goes back)
  CC.longDuskBook = async function (title) {
    var start = 0;
    while (true) {
      var items = [];
      for (var n = 1; n <= 12; n++) items.push({ label: CC.hasPage(n) ? n + '. ' + CC.PAGES[n].title : n + '. ? ? ?', right: '' });
      var c = await CC.menu(items, { title: (title || 'The Long Dusk') + ' (' + CC.pageCount() + '/12)', w: 168, start: start });
      if (c < 0) return;
      start = c;
      if (CC.hasPage(c + 1)) await CC.readPage(c + 1);
      else await CC.say('This page is still missing. ' + (F().pageHints ? 'Elder Willow thinks: ' + CC.PAGE_HINTS[c + 1] : 'Someone out there must have it.'));
    }
  };
  CC.readWholeBook = async function () {
    for (var n = 1; n <= 12; n++) if ((await CC.readPage(n, { more: n < 12 })) === 'back') return;
  };

  // ---------- the new items ----------
  var add = {
    dusk: { name: 'Dusk Cube', price: 300, cube: 5, duskCube: 30, icon: 'ui/cube-dusk', info: 'Cubesmith Ada\'s Dusk Cube. Its seam glows like the sunset: much better odds at dusk and at night.' },
    copperroll: { name: 'Copper Roll', price: 80, heal: 40, icon: 'items/copper-roll', info: 'A warm roll from Baker Bun. Restores 40 HP. It isn\'t made of copper.' },
    warmsoup: { name: 'Warm Soup', price: 0, heal: 50, cure: 'freeze', icon: 'items/warm-soup', info: 'Auntie Yuzu\'s soup. Restores 50 HP and thaws a frozen creature.' },
    lostpages: { name: 'Lost Pages', key: 'anyPage', icon: 'items/lost-page', info: 'Pages of Elder Willow\'s book, The Long Dusk.',
      count: function () { return CC.pageCount() + '/12'; }, use: function () { return CC.longDuskBook('Lost Pages').then(function () { return false; }); } },
    longdusk: { name: 'The Long Dusk', key: 'longDusk', icon: 'items/long-dusk-book', info: 'Elder Willow\'s book, every page back in place.',
      use: function () { return CC.readWholeBook().then(function () { return false; }); } },
    boatticket: { name: 'Boat Ticket', key: 'boatTicket', icon: 'items/boat-ticket', info: 'Fisher Gus\'s ticket for the boat from Driftwood Cove to Lantern Isle.' },
    archivekey: { name: 'Archive Key', key: 'archiveKey', icon: 'items/archive-key', info: 'Corvin\'s key to the stairway under the Night Ruins.' },
    sunember: { name: 'Sun Ember', key: 'sunEmber', icon: 'items/sun-ember', info: 'A warm spark of Solarion\'s light. It glows around you in the dark.' },
  };
  // the bag lists items in this order: cubes, healing, shards, then key items
  var order = ['cube', 'great', 'ultra', 'dusk', 'master', 'potion', 'copperroll', 'superpotion', 'warmsoup', 'megapotion', 'tonic', 'fulltonic', 'cureherb', 'revive',
    'sunshard', 'moonshard', 'whistle', 'vaultkey', 'boatticket', 'archivekey', 'sunember', 'lostpages', 'longdusk'];
  var all = Object.assign({}, CC.ITEMS, add), sorted = {};
  order.forEach(function (k) { if (all[k]) sorted[k] = all[k]; });
  Object.keys(all).forEach(function (k) { if (!sorted[k]) sorted[k] = all[k]; });
  CC.ITEMS = sorted;
  CC.CUBE_KINDS.splice(CC.CUBE_KINDS.indexOf('master'), 0, 'dusk');

  // ---------- wild creatures: by day or night, and grown up when they're past their evolution level ----------
  var MOON_CHANCE = function () { return F().balance ? 0.06 : 0.03; };
  CC.rollSpawn = function (key) {
    var sp = CC.SPAWNS[key], night = CC.isNight(), time = sp.time || {};
    var ok = function (id) { var t = time[id]; return !t || (t === 'night') === night; };
    var tiers = { common: sp.common.filter(ok), uncommon: sp.uncommon.filter(ok), rare: sp.rare.filter(ok) };
    var r = Math.random() * 100, tier = r < 60 ? 'common' : r < 90 ? 'uncommon' : 'rare';
    if (!tiers[tier].length) tier = ['common', 'uncommon', 'rare'].find(function (t) { return tiers[t].length; });
    var id = CC.pick(tier ? tiers[tier] : sp.common), lv = CC.randi(sp.levels[0], sp.levels[1]);
    // a Moonborn creature (the kids' creatures with lives: 'anywhere') can turn up anywhere
    if (CC.MOONBORN && CC.MOONBORN.length && Math.random() < MOON_CHANCE()) id = CC.pick(CC.MOONBORN);
    var c = CC.CREATURES[id];
    while (c.evo && typeof c.evo.at === 'number' && lv >= c.evo.at) { id = c.evo.into; c = CC.CREATURES[id]; }
    return { id: id, lv: lv };
  };

})();
