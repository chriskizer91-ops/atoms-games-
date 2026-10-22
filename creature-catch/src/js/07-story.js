// The first playable slice: Home Village, Meadow Path, Grassland. People, signs, doors and story beats.
var CC = window.CC || (window.CC = {});

var STARTERS = ['drizzlon', 'mossback', 'embroak'];
var STARTER_BLURB = { drizzlon: 'the little water dragon', mossback: 'the sleepy plant turtle', embroak: 'the cheeky fire frog' };
// Juniper always takes the starter that beats yours
var RIVAL_PICK = { drizzlon: 'mossback', mossback: 'embroak', embroak: 'drizzlon' };

function F() { return CC.state.flags; }

// a battle that sends you back to the last Healing Hut if you lose (unless losing is part of the story)
CC.fight = async function (opts) {
  var result = await CC.startBattle(opts);
  if (result === 'lose' && !opts.canLose) {
    await CC.fade(0.4, true);
    CC.healParty();
    var h = CC.state.lastHeal;
    CC.world.enter(h.map, h.x, h.y, 'down');
    CC.unfade();
    await CC.say('You hurried back to the Healing Hut. Your creatures are rested and ready.');
  }
  return result;
};

CC.NPCS = {
  village: [
    {
      x: 12, y: 1, look: 'tinker', art: 'tinker', h: 22, dir: 'down', talk: async function () {
        if (!F().starter) await CC.say('Elder Willow is looking for you! His house is the big one with the mossy roof.', { who: 'Tinker' });
        else await CC.talk('Tinker', ['Creatures hide in tall grass. Walk through it and one might jump out!', 'Knock it down a bit, then throw a cube. Sleeping or frozen ones are easiest to catch!']);
      },
    },
    { x: 7, y: 4, look: 'willow', art: 'willow', h: 27, dir: 'down', talk: function () { return willowHouse(); } },
    { x: 14, y: 4, look: 'pip', art: 'pip', h: 24, dir: 'down', talk: function () { return CC.enterDoor('village', 'shop'); } },
    { x: 14, y: 11, look: 'hazel', art: 'hazel', h: 25, dir: 'down', talk: function () { return CC.enterDoor('village', 'hut'); } },
    {
      x: 9, y: 2, look: 'juniper', art: 'juniper', h: 26, dir: 'down', when: function () { return F().starter && !F().trial1; }, talk: async function () {
        await CC.talk('Juniper', F().juniper1 === 'won'
          ? ['Don\'t get cocky. That was a warm-up!', 'I\'m off to beat Farmer Bramble\'s trial before you. See ya!']
          : ['Still thinking about our battle? Ha!', 'Type advantage matters, but so does training. Catch more creatures!']);
      },
    },
    {
      x: 9, y: 13, look: 'rosa', art: 'rosa', h: 25, dir: 'down', talk: async function () {
        await CC.talk('Rosa', ['Lovely day for the Meadow Path.', 'The creatures out there are plain Normal types. They don\'t care whether you picked water, fire or plant, so it\'s fair training for everyone.']);
      },
    },
  ],
  // (village people continue below)
  meadow: [
    {
      x: 3, y: 8, look: 'ranger', art: 'oakley', h: 27, dir: 'right', talk: async function () {
        await CC.talk('Ranger Oakley', ['I\'m Ranger Oakley. I keep the Forest, but I like to scout the meadow.', 'Every region has an outpost with a Healing Hut. The Grassland one is just north of here.', 'You can swap creatures with the Cube Vault at any Healing Hut.']);
      },
    },
  ],
  grassland: [
    {
      x: 12, y: 1, look: 'bramble', art: 'bramble', h: 26, dir: 'down', id: 'bramble', talk: async function () {
        if (F().trial1) { await CC.say('The Forest trail is all yours. Mind the owls!', { who: 'Farmer Bramble' }); return; }
        await CC.talk('Farmer Bramble', ['Howdy! I\'m Farmer Bramble, guide of the Grassland.', 'That fallen log is the only way into the Forest, and I only clear it for trainers who can handle the creatures out there.']);
        if (!(await CC.yesNo('Ready for my trail trial?', 'Farmer Bramble'))) { await CC.say('Come back when you\'re ready. The outpost will patch you up.', { who: 'Farmer Bramble' }); return; }
        var r = await CC.fight({
          trainer: {
            name: 'Farmer Bramble', look: 'bramble', art: 'bramble', coins: 240,
            intro: 'My critters have been working the fields all morning. Show me what you\'ve got!',
            winText: 'Well I\'ll be! You\'ve earned it.', loseText: 'Ha! Not quite yet. Rest up and try again.',
            team: [CC.mon.make('hopsprout', 7), CC.mon.make('pebblepup', 7), CC.mon.make('tuftail', 8)],
          },
        });
        if (r !== 'win') return;
        F().trial1 = true;
        CC.sfx('catch');
        await CC.say('You got the Leaf Trail Charm!');
        await CC.talk('Farmer Bramble', ['One more thing. Hazel asked me to hand you this if you passed.']);
        F().vaultKey = true; CC.sfx('buy');
        await CC.say('You got the Vault Key! Now you can open the Cube Vault from the menu, anywhere.');
        await CC.say('Now, let\'s shift this log. Hup!', { who: 'Farmer Bramble' });
        F().logCleared = true;
        CC.world.refresh();
        B_moveAside();
        CC.sfx('bump');
        await CC.say('Farmer Bramble rolled the log out of the way. The trail into the Forest is open!');
      },
    },
    {
      x: 6, y: 11, look: 'tinker', art: 'villager-2', h: 21, dir: 'right', talk: async function () {
        await CC.talk('Farm Kid', ['Dandylion lives here, but it\'s super rare. I\'ve only seen its fluffy mane once!', 'Tuftail loves the tall grass by the trees.']);
      },
    },
  ],
};
function B_moveAside() {
  var b = CC.NPCS.grassland.find(function (n) { return n.id === 'bramble'; });
  b.x = 15; b.y = 2; b.dir = 'left';
}

// who speaks -> whose picture shows beside the dialog box
CC.PORTRAITS = {
  'Elder Willow': 'willow', 'Juniper': 'juniper', 'Pip': 'pip', 'Hazel': 'hazel', 'Farmer Bramble': 'bramble',
  'Tinker': 'tinker', 'Rosa': 'rosa', 'Ranger Oakley': 'oakley', 'Farm Kid': 'villager-2', 'Fern': 'villager-7',
};

CC.SIGNS = {
  'village:6,7': 'Home Village. Elder Willow: top left. Pip\'s Cube Shop: top right. Healing Hut: bottom right. Meadow Path: north.',
  'meadow:12,13': 'Meadow Path. The gentle creatures here are Normal types: fair training for every starter.',
  'grassland:18,14': 'Grassland Outpost: free healing and Cube Vault. Farmer Bramble keeps the north trail to the Forest.',
};

CC.TRIGGERS = {};

// Tinker won't let you leave without a creature
CC.world.blockScript = function (nx, ny) {
  if (CC.world.mapId === 'village' && ny <= 0 && !F().starter) {
    CC.world.run(async function () {
      await CC.say('Wait! It\'s not safe out there without a creature! Go see Elder Willow first.', { who: 'Tinker' });
    });
    return true;
  }
  return false;
};

// ---------- doors ----------
CC.enterDoor = async function (mapId, id) {
  if (id === 'willow') return willowHouse();
  if (id === 'shop') {
    await CC.say('Welcome to Pip\'s Cube Shop! Cubes, potions, all fresh.', { who: 'Pip' });
    await CC.shopScreen();
    await CC.say('Come again!', { who: 'Pip' });
    return;
  }
  if (id === 'home') {
    if (await CC.yesNo('Your home, sweet home. Take a rest?')) { await restAndHeal(); CC.state.lastHeal = { map: 'village', x: 4, y: 12 }; }
    return;
  }
  if (id === 'hut') return healingHut('Hazel', { map: 'village', x: 17, y: 12 });
  if (id === 'outpost') return healingHut('Fern', { map: 'grassland', x: 18, y: 12 });
};

async function restAndHeal() {
  await CC.fade(0.3, true);
  CC.healParty(); CC.sfx('heal');
  await CC.sleep(0.9);
  CC.unfade();
  await CC.say('Your creatures are healed and full of energy!');
}

async function healingHut(who, spot) {
  CC.state.lastHeal = spot;
  await CC.say(who === 'Hazel' ? 'Welcome to the Healing Hut! I\'m Hazel.' : 'Welcome to the Grassland Outpost! I\'m Fern, Hazel\'s cousin.', { who: who });
  while (true) {
    var c = await CC.ask('How can I help?', ['Heal my creatures', 'Cube Vault', 'Bye']);
    if (c === 0) {
      if (!CC.state.party.length) { await CC.say('You don\'t have any creatures yet!', { who: who }); continue; }
      await CC.say('Let me take care of them.', { who: who });
      await restAndHeal();
      CC.saveGame();
    } else if (c === 1) {
      if (!CC.state.party.length) { await CC.say('The Vault holds the creatures you catch once your party of 4 is full.', { who: who }); continue; }
      await CC.vaultScreen();
    } else { await CC.say('Take care out there!', { who: who }); return; }
  }
}

// ---------- the starter ----------
async function willowHouse() {
  if (F().starter) {
    var caught = Object.keys(CC.state.caught).length;
    await CC.talk('Elder Willow', [
      'How is your Creature Log coming along? ' + caught + ' caught so far!',
      F().trial1 ? 'Bramble tells me you passed the trail trial. The Forest awaits!' : 'Farmer Bramble guards the trail at the top of the Grassland. Beat his trial and he\'ll open the way to the Forest.',
    ]);
    return;
  }
  await CC.talk('Elder Willow', [
    'Ah, there you are! Today is the day you get your very first creature.',
    'Three cubes, three friends. Their types go round in a circle: Water beats Fire, Fire beats Plant, and Plant beats Water.',
    'Take your time. Pick the one that feels right.',
  ]);
  var pick = await starterSelect();
  F().starter = pick;
  var m = CC.mon.make(pick, 5);
  CC.addCreature(m);
  CC.sfx('catch');
  await CC.say('You received ' + CC.CREATURES[pick].name + '!');
  await CC.say('A fine choice. Look after each other.', { who: 'Elder Willow' });
  // Juniper bursts in
  var rival = RIVAL_PICK[pick];
  await CC.talk('Juniper', [
    'Gramps! I\'m here for my creature! Oh. You beat me to it?',
    'Fine! Then I\'ll take ' + CC.CREATURES[rival].name + '. ' + CC.CREATURES[rival].types[0] + ' beats ' + CC.CREATURES[pick].types[0] + ', you know!',
    'Let\'s see whose creature is tougher. Battle me!',
  ]);
  var result = await CC.fight({
    canLose: true, bg: 'village',
    trainer: {
      name: 'Juniper', look: 'juniper', art: 'juniper', coins: 100,
      winText: 'What?! I had the type advantage! Next time, I\'m winning.',
      loseText: 'Ha! Told you. Type advantage, baby!',
      team: [CC.mon.make(rival, 5)],
    },
  });
  F().juniper1 = result === 'win' ? 'won' : 'lost';
  CC.healParty();
  await CC.say(result === 'win' ? 'Ha ha! What a match. Let me patch up your creatures.' : 'Don\'t be glum. Losing teaches you things. Let me patch you both up.', { who: 'Elder Willow' });
  CC.sfx('heal');
  await CC.say('I\'ll be ahead of you the whole way! See you out there!', { who: 'Juniper' });
  CC.state.bag.cube += 5; CC.state.bag.potion += 3;
  CC.sfx('buy');
  await CC.say('Elder Willow gave you 5 Basic Cubes and 3 Potions!');
  await CC.talk('Elder Willow', [
    'Cubes catch wild creatures. Weaken one first, and catching gets much easier.',
    'Head north through the Meadow Path to the Grassland. Farmer Bramble keeps the trail to the Forest. Show him what you can do!',
  ]);
}

function starterSelect() {
  return new Promise(function (resolve) {
    var sel = 0, busy = false;
    var scr = {
      opaque: true,
      update: function () {
        if (busy) return;
        if (CC.input.pressed.left) { sel = (sel + 2) % 3; CC.sfx('blip'); }
        if (CC.input.pressed.right) { sel = (sel + 1) % 3; CC.sfx('blip'); }
        if (CC.input.pressed.a) {
          CC.sfx('select'); busy = true;
          var id = STARTERS[sel];
          CC.yesNo('Choose ' + CC.CREATURES[id].name + ', ' + STARTER_BLURB[id] + '? (' + CC.CREATURES[id].types[0] + ' type)').then(function (yes) {
            busy = false;
            if (yes) { CC.pop(scr); resolve(id); }
          });
        }
      },
      draw: function () {
        var g = CC.g;
        CC.rect(0, 0, 240, 160, '#5a3a2a');
        for (var y = 0; y < 160; y += 12) CC.rect(0, y, 240, 1, '#4a2e22');
        // the table
        g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(120, 92, 112, 34, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#4f8a3a'; g.beginPath(); g.ellipse(120, 88, 108, 30, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5fa848'; g.beginPath(); g.ellipse(120, 85, 100, 24, 0, 0, Math.PI * 2); g.fill();
        CC.text('Choose your first creature', 120, 6, '#fbf3e0', { align: 'center', shadow: '#2a1a12' });
        STARTERS.forEach(function (id, i) {
          var x = 50 + i * 70, on = i === sel, c = CC.CREATURES[id];
          if (on) { g.fillStyle = 'rgba(255,240,180,0.25)'; g.beginPath(); g.ellipse(x, 88, 30, 10, 0, 0, Math.PI * 2); g.fill(); }
          CC.drawSprite(CC.creatureSprite(id), x, 90 + (on ? Math.abs(Math.sin(CC.time * 6)) * -4 : 0), { scale: on ? 0.9 : 0.7, sy: 1 + Math.sin(CC.time * 2.6 + i) * 0.03, id: id });
          CC.text(c.name, x, 96, on ? '#fff4c0' : '#d8c8b0', { align: 'center', shadow: '#1a2a12' });
          CC.typeBadge(c.types[0], x - 16, 110);
        });
        CC.box(0, 126, 240, 34);
        var id = STARTERS[sel];
        CC.text(CC.CREATURES[id].name + ', ' + STARTER_BLURB[id] + '.', 9, 132);
        CC.text('Left / right to look, A to choose.', 9, 145, '#6a5a50', { size: 9 });
      },
    };
    CC.push(scr);
  });
}

// ---------- the end of the slice ----------
CC.forestGate = async function () {
  await CC.say('The Forest trail stretches north under tall dark trees...');
  await CC.say('That\'s the end of this first slice! The Forest, Ranger Oakley, and Juniper\'s next battle come next.');
  CC.state.y = 1; CC.world.py = 16;
};

// ---------- title ----------
CC.titleScreen = function () {
  return new Promise(function (resolve) {
    var hasSave = CC.hasSave(), sel = hasSave ? 0 : 0, items = hasSave ? ['Continue', 'New Game'] : ['New Game'];
    var critters = ['drizzlon', 'mossback', 'embroak', 'tuftail', 'bumblop', 'clovermouse'];
    var scr = {
      opaque: true,
      update: function () {
        if (CC.input.pressed.down || CC.input.pressed.up) { sel = (sel + 1) % items.length; CC.sfx('blip'); }
        if (CC.input.pressed.a || CC.input.pressed.start) { CC.sfx('select'); CC.pop(scr); resolve(items[sel]); }
      },
      draw: function () {
        var g = CC.g, art = CC.img('bg/title');
        if (art) {
          g.drawImage(art, 0, 0, 240, 160);
          CC.text('Creature Catch', 120, 10, '#ffffff', { size: 22, align: 'center', shadow: '#5a2a6e' });
          g.globalAlpha = 0.85; CC.box(120 - 40, 104, 80, items.length * 14 + 8); g.globalAlpha = 1;
          items.forEach(function (it, i) {
            CC.text(it, 120, 108 + i * 14, '#2a2230', { align: 'center' });
            if (i === sel) CC.cursor(120 - CC.textWidth(it) / 2 - 10, 110 + i * 14);
          });
          return;
        }
        var grd = g.createLinearGradient(0, 0, 0, 160); grd.addColorStop(0, '#f8b070'); grd.addColorStop(0.55, '#f8e0a0'); grd.addColorStop(1, '#a8d880');
        g.fillStyle = grd; g.fillRect(0, 0, 240, 160);
        g.fillStyle = '#8ab8a0'; g.beginPath(); g.moveTo(0, 96); for (var x = 0; x <= 240; x += 10) g.lineTo(x, 86 + Math.sin(x * 0.04) * 8); g.lineTo(240, 160); g.lineTo(0, 160); g.fill();
        // creatures peeking from the grass
        critters.forEach(function (id, i) {
          var x = 20 + i * 40, peek = Math.max(0, Math.sin(CC.time * 1.3 + i * 1.7)) * 14;
          CC.drawSprite(CC.creatureSprite(id), x, 150 - peek, { scale: 0.45, id: id });
        });
        g.fillStyle = '#4a9a38'; g.fillRect(0, 140, 240, 20);
        for (var b = 0; b < 60; b++) { var bx = b * 4 + Math.sin(CC.time * 2 + b) * 1; g.fillStyle = b % 2 ? '#5ab848' : '#2f7a2a'; g.fillRect(bx, 130 + (b * 7) % 8, 2, 14); }
        // the floating cube
        var cy = 46 + Math.sin(CC.time * 2) * 3;
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(120, cy, 18 + Math.sin(CC.time * 3) * 2, 0, Math.PI * 2); g.fill();
        CC.drawCube(120, cy, 18, { rot: Math.sin(CC.time) * 0.15 });
        CC.text('Creature Catch', 120, 8, '#ffffff', { size: 22, align: 'center', shadow: '#7a3a6e' });
        items.forEach(function (it, i) {
          CC.text(it, 120, 76 + i * 14, i === sel ? '#ffffff' : '#fbe8c8', { align: 'center', shadow: '#5a3a2a' });
          if (i === sel) CC.cursor(120 - CC.textWidth(it) / 2 - 10, 78 + i * 14);
        });
        if (Math.floor(CC.time * 2) % 2) CC.text('Press A', 120, 106, '#fff8e0', { size: 9, align: 'center', shadow: '#5a3a2a' });
      },
    };
    CC.push(scr);
  });
};

// pick which explorer you are (Player A or Player B art)
function chooseExplorer() {
  return new Promise(function (resolve) {
    var sel = 0, looks = ['player-a', 'player-b'];
    var scr = {
      name: 'explorer', opaque: true,
      update: function () {
        if (CC.input.pressed.left || CC.input.pressed.right) { sel ^= 1; CC.sfx('blip'); }
        if (CC.input.pressed.a) { CC.sfx('select'); CC.pop(scr); resolve(looks[sel]); }
      },
      draw: function () {
        var bg = CC.img('bg/title');
        if (bg) { CC.g.drawImage(bg, 0, 0, 240, 160); CC.g.globalAlpha = 0.55; CC.rect(0, 0, 240, 160, '#1b1626'); CC.g.globalAlpha = 1; }
        else CC.rect(0, 0, 240, 160, '#2a2440');
        CC.text('Which explorer are you?', 120, 8, '#ffffff', { align: 'center', shadow: '#000000' });
        looks.forEach(function (l, i) {
          var x = 70 + i * 100, on = i === sel, art = CC.img('people/' + l);
          if (on) { CC.g.fillStyle = 'rgba(255,240,180,0.25)'; CC.g.beginPath(); CC.g.ellipse(x, 126, 30, 7, 0, 0, Math.PI * 2); CC.g.fill(); }
          if (art) {
            var h = on ? 96 : 84, k = h / art.height, bob = on ? Math.abs(Math.sin(CC.time * 4)) * -3 : 0;
            CC.g.globalAlpha = on ? 1 : 0.6;
            CC.g.drawImage(art, x - art.width * k / 2, 126 - h + bob, art.width * k, h);
            CC.g.globalAlpha = 1;
          } else CC.g.drawImage(CC.person('player', 'down', 0), x - 24, 78, 48, 48);
        });
        CC.text('Left / right to choose, A to start.', 120, 142, '#fff4c0', { size: 9, align: 'center', shadow: '#000000' });
      },
    };
    CC.push(scr);
  });
}

CC.newGame = async function () {
  CC.state = CC.newState();
  CC.state.look = await chooseExplorer();
  CC.world.enter('village', 4, 12, 'down');
  CC.push(CC.world);
  await CC.world.run(async function () {
    await CC.say('Welcome to Home Village! Creatures live in the wild all around here, hiding in the tall grass.');
    await CC.say('Arrows (or the pad) to walk, A (Z key) to talk, B (X key) to go back or run, and MENU (Enter) for your party and saves.');
    await CC.say('Elder Willow lives in the big house with the mossy roof. Go and say hello!');
  });
};
CC.continueGame = function () {
  CC.loadGame();
  var s = CC.state;
  if (s.flags.trial1) B_moveAside();
  CC.world.enter(s.map, s.x, s.y, s.dir);
  CC.push(CC.world);
};
