// The opening: Home Village, Meadow Path and Grassland. People, signs, doors and the first story beats (the rest is in 15-story-full.js).
var CC = window.CC || (window.CC = {});

var STARTERS = ['drizzlon', 'mossback', 'embroak'];
var STARTER_BLURB = { drizzlon: 'the little water dragon', mossback: 'the sleepy plant turtle', embroak: 'the cheeky fire frog' };
// Juniper always takes the starter that beats yours
var RIVAL_PICK = { drizzlon: 'mossback', mossback: 'embroak', embroak: 'drizzlon' };

function F() { return CC.state.flags; }

// Every battle goes through here. Losing sends you back to where you last rested, healed (unless losing is part of
// the story: canLose). With nobody able to fight, no battle starts: you go back to rest and it counts as a loss.
CC.fight = async function (opts) {
  if (CC.firstHealthy() < 0) {
    await CC.say('Your creatures are too tired to battle.');
    await CC.blackout();
    return 'lose';
  }
  if ((opts.trainer || opts.boss) && !opts.noVs && CC.vsIntro) await CC.vsIntro(opts);
  var result = await CC.startBattle(opts);
  // a win can still leave everyone fainted (a recoil move): a plain wild or route-trainer battle sends you back
  // then too; guides, Juniper and the guardians' scenes carry on, and the next battle's check above catches it
  var plain = !opts.boss && !opts.vs;
  if (!opts.canLose && (result === 'lose' || (plain && CC.firstHealthy() < 0))) await CC.blackout();
  return result;
};
// where a blackout takes you, said the way you'd say it ('the Healing Hut', 'Rosa\'s Inn', 'your house');
// null for anywhere else
var REST_PLACE = { 'home-in': 'your house', 'inn-in': 'Rosa\'s Inn', village: 'Home Village', archive: 'the Archive\'s healing stone' };
function restPlace(mapId) {
  var m = CC.MAPS[mapId];
  if (REST_PLACE[mapId]) return REST_PLACE[mapId];
  return m && m.indoors && /Healing Hut|Outpost|Inn|Bathhouse/.test(m.name) ? 'the ' + m.name : null;
}
// back to where you last rested, healed
CC.blackout = async function () {
  await CC.fade(0.4, true);
  CC.healParty();
  var h = CC.state.lastHeal, place = restPlace(h.map);
  CC.world.enter(h.map, h.x, h.y, 'down');
  CC.unfade();
  await CC.say((place ? 'You hurried back to ' + place + '.' : 'You hurried back to rest.') + ' Your creatures are rested and ready.');
};

CC.NPCS = {
  village: [
    {
      x: 12, y: 1, look: 'tinker', art: 'tinker', h: 22, dir: 'down', talk: async function () {
        if (!F().starter) await CC.say('Elder Willow is looking for you! His house is the big one with the mossy roof.', { who: 'Tinker' });
        else await CC.talk('Tinker', ['Creatures hide in tall grass. Walk through it and one might jump out!', 'Knock it down a bit, then throw a cube. Sleeping or frozen ones are easiest to catch!']);
      },
    },
    {
      x: 9, y: 2, look: 'juniper', art: 'juniper', sheet: 'juniper', patrol: [[9, 2], [12, 2], [12, 3], [9, 3]], h: 26, dir: 'down', when: function () { return F().starter && !F().trial1; }, talk: async function () {
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
  // inside the buildings: the people behind the counters
  'willow-in': [
    { x: 5, y: 3, look: 'willow', art: 'willow', h: 27, dir: 'down', talk: function () { return willowHouse(); } },
    { x: 5, y: 7, id: 'juniperIn', look: 'juniper', art: 'juniper', sheet: 'juniper', h: 26, dir: 'up', when: function () { return F().juniperIn; }, talk: function () {} },
  ],
  'hut-in': [{ x: 5, y: 2, look: 'hazel', art: 'hazel', h: 25, dir: 'down', talk: function () { return healingHut('Hazel', { map: 'hut-in', x: 5, y: 4 }); } }],
  'outpost-in': [{ x: 4, y: 2, look: 'hazel', art: 'fern', h: 25, dir: 'down', talk: function () { return healingHut('Fern', { map: 'outpost-in', x: 4, y: 4 }); } }],
  'shop-in': [{ x: 4, y: 2, look: 'pip', art: 'pip', h: 24, dir: 'down', talk: async function () {
    await CC.say('Welcome to Pip\'s Cube Shop! Cubes, potions, all fresh.', { who: 'Pip' });
    await CC.shopScreen();
    await CC.say('Come again!', { who: 'Pip' });
  } }],
  meadow: [
    {
      x: 3, y: 8, look: 'ranger', art: 'oakley', h: 27, dir: 'right', when: function () { return !F().trial1; }, talk: async function () {
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
          vs: 'guide',
          trainer: {
            name: 'Farmer Bramble', look: 'bramble', art: 'bramble', coins: 240,
            intro: 'My critters have been working the fields all morning. Show me what you\'ve got!',
            winText: 'Well I\'ll be! You\'ve earned it.', loseText: 'Ha! Not quite yet. Rest up and try again.',
            team: CC.trainerTeam([['hopsprout', 7], ['pebblepup', 7], ['tuftail', 8]]),
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
// a trainer's team from [id, level] pairs: each creature comes in the form it has at its level, the same rule as
// wild creatures (CC.wildForm: level evolutions only, never shards)
CC.trainerTeam = function (list) { return list.map(function (p) { return CC.mon.make(CC.wildForm(p[0], p[1]), p[1]); }); };

// who speaks -> whose picture shows beside the dialog box
CC.PORTRAITS = {
  'Elder Willow': 'willow', 'Juniper': 'juniper', 'Pip': 'pip', 'Hazel': 'hazel', 'Farmer Bramble': 'bramble',
  'Tinker': 'tinker', 'Rosa': 'rosa', 'Ranger Oakley': 'oakley', 'Farm Kid': 'villager-2', 'Fern': 'fern',
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
CC.enterDoor = function (mapId, id) {
  if (CC.DOORS[id]) return CC.enterRoom(CC.DOORS[id]);
};
// a person walks a list of steps ('up', 'left', ...) with their walk sheet
CC.npcWalk = async function (n, steps) {
  for (var i = 0; i < steps.length; i++) {
    var d = CC.DIRS[steps[i]]; n.dir = steps[i];
    await new Promise(function (res) { n.mv = { fx: n.x, fy: n.y, tx: n.x + d[0], ty: n.y + d[1], k: 0, speed: 3.6, done: res }; });
  }
};

async function restAndHeal() {
  await CC.fade(0.3, true);
  CC.healParty(); CC.sfx('heal');
  await CC.sleep(0.9);
  CC.unfade();
  await CC.say('Your creatures are healed and full of energy!');
}

async function healingHut(who, spot, greeting) {
  CC.state.lastHeal = spot;
  await CC.say(greeting || (who === 'Hazel' ? 'Welcome to the Healing Hut! I\'m Hazel.' : 'Welcome to the Grassland Outpost! I\'m Fern, Hazel\'s cousin.'), { who: who });
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

CC.healingHut = healingHut;

// ---------- the starter ----------
async function willowHouse() {
  if (F().starter) {
    var caught = Object.keys(CC.state.caught).length, charms = ['trial1', 'trialForest', 'trialWater', 'trialCave', 'trialDesert', 'trialSnow', 'trialSwamp', 'trialRuins'].filter(function (k) { return F()[k]; }).length;
    var next = F().moonRestored ? 'The moon is whole again, thanks to you. The Moonlit Spire stands open beside the altar.'
      : charms >= 8 ? 'Corvin opened the rune gate? Then the Moon Altar is all that\'s left. Be gentle with the guardian.'
      : charms >= 1 ? 'You have ' + charms + ' of the 8 trail charms. Keep heading north. Each guide knows a piece of the moon\'s story.'
      : 'Farmer Bramble guards the trail at the top of the Grassland. Beat his trial and he\'ll open the way to the Forest.';
    await CC.talk('Elder Willow', ['How is your Creature Log coming along? ' + caught + ' caught so far!', next]);
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
  // Juniper bursts in through the door and marches up beside you
  var rival = RIVAL_PICK[pick], jun = CC.NPCS['willow-in'].find(function (n) { return n.id === 'juniperIn'; });
  jun.x = 5; jun.y = 7; jun.dir = 'up'; F().juniperIn = true;
  CC.sfx('bump');
  await CC.say('BANG! The door flies open.');
  await CC.npcWalk(jun, ['up', 'right', 'up']);
  jun.dir = 'left';
  await CC.talk('Juniper', [
    'Gramps! I\'m here for my creature! Oh. You beat me to it?',
    'Fine! Then I\'ll take ' + CC.CREATURES[rival].name + '. ' + CC.CREATURES[rival].types[0] + ' beats ' + CC.CREATURES[pick].types[0] + ', you know!',
    'Let\'s see whose creature is tougher. Battle me!',
  ]);
  var result = await CC.fight({
    canLose: true, bg: 'village', vs: 'rival',
    trainer: {
      name: 'Juniper', look: 'juniper', art: 'juniper', coins: 100,
      winText: 'What?! I had the type advantage! Next time, I\'m winning.',
      loseText: 'Ha! Told you. Type advantage, baby!',
      team: CC.trainerTeam([[rival, 5]]),
    },
  });
  F().juniper1 = result === 'win' ? 'won' : 'lost';
  CC.healParty();
  await CC.say(result === 'win' ? 'Ha ha! What a match. Let me patch up your creatures.' : 'Don\'t be glum. Losing teaches you things. Let me patch you both up.', { who: 'Elder Willow' });
  CC.sfx('heal');
  await CC.say('I\'ll be ahead of you the whole way! See you out there!', { who: 'Juniper' });
  await CC.npcWalk(jun, ['down', 'left', 'down']);
  F().juniperIn = false;
  CC.state.bag.cube += 5; CC.state.bag.potion += 3;
  CC.sfx('buy');
  await CC.say('Elder Willow gave you 5 Basic Cubes and 3 Potions!');
  await CC.say('Now, sit a moment. There is something you should know before you go.', { who: 'Elder Willow' });
  await CC.showStill('still-2', [
    'Long ago, the old book says, a guardian kept the moon alight: Lunarion, a silver wolf with wings full of stars.',
    'Each night it flew up from the Moon Altar, far north in the Night Ruins, and the moon shone bright.',
    'Now the moon fades a little more every night, and the creatures hide in the grass, afraid.',
    'I\'m too old for the journey. But a trainer with a good heart might reach the altar and find out why.',
  ], { who: 'Elder Willow' });
  await CC.talk('Elder Willow', [
    'Cubes catch wild creatures. Weaken one first, and catching gets much easier.',
    'Head north through the Meadow Path to the Grassland. Each region has a guide who keeps the trail. Win their trials, and they\'ll open the way to the Moon Altar.',
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

// ---------- title ----------
CC.titleScreen = function () {
  return new Promise(function (resolve) {
    var hasSave = CC.hasSave(), sel = hasSave ? 0 : 0, items = (hasSave ? ['Continue', 'New Game'] : ['New Game']).concat(['Options']);
    if (CC.music) CC.music.play('title');
    var critters = ['drizzlon', 'mossback', 'embroak', 'tuftail', 'bumblop', 'clovermouse'];
    // the secret: Up Up Down Down Left Right Left Right B A opens the dev code box
    var SECRET = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'], typed = [];
    var scr = {
      name: 'title', opaque: true,
      update: function () {
        var lead = SECRET.slice(0, -1).join();
        if (CC.input.pressed.a && typed.slice(-SECRET.length + 1).join() === lead) { typed = []; CC.sfx('catch'); CC.openCodes(); return; }
        ['up', 'down', 'left', 'right', 'a', 'b'].forEach(function (k) { if (CC.input.pressed[k]) typed.push(k); });
        typed = typed.slice(-SECRET.length);
        if (CC.input.pressed.down || CC.input.pressed.up) { sel = (sel + (CC.input.pressed.down ? 1 : items.length - 1)) % items.length; CC.sfx('blip'); }
        if (scr.busy) return;
        if ((CC.input.pressed.a || CC.input.pressed.start) && items[sel] === 'Options') { CC.sfx('select'); scr.busy = true; CC.optionsScreen().then(function () { scr.busy = false; }); return; }
        if (CC.input.pressed.a || CC.input.pressed.start) { CC.sfx('select'); CC.pop(scr); resolve(items[sel]); }
      },
      draw: function () {
        var g = CC.g, art = CC.img('bg/title');
        if (art) {
          g.drawImage(art, 0, 0, 240, 160);
          CC.text('Creature Catch', 120, 10, '#ffffff', { size: 22, align: 'center', shadow: '#5a2a6e' });
          CC.text(CC.VERSION || '', 234, 150, '#ffffff', { size: 9, align: 'right', shadow: '#000000' });
          if (CC.dev.pending.length) CC.text('Codes waiting: ' + CC.dev.pending.length, 6, 150, '#fff4a0', { size: 9, shadow: '#000000' });
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

// ---------- the save files: pick one to continue, or one to start a new game in ----------
var CHARM_REGIONS = ['grassland', 'forest', 'water', 'cave', 'desert', 'snow', 'swamp', 'ruins'];
function playTime(sec) { var m = Math.floor(sec / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
// what a save file holds: 'empty', 'ok', or 'damaged' (something is there but it can't be read)
CC.slotStatus = function (n) {
  var raw;
  try { raw = localStorage.getItem(CC.slotKey(n)); } catch (e) { return 'empty'; }
  if (!raw) return 'empty';
  try { var s = JSON.parse(raw); return s && typeof s === 'object' ? 'ok' : 'damaged'; } catch (e) { return 'damaged'; }
};
// a damaged file is copied to a backup key before a new game is saved over it, just in case
CC.backupSlot = function (n) {
  try { var raw = localStorage.getItem(CC.slotKey(n)); if (raw) localStorage.setItem(CC.slotKey(n) + '-damaged', raw); } catch (e) { /* no storage */ }
};
CC.filePicker = function (mode) {
  return new Promise(function (resolve) {
    var infos = [], status = [], busy = false;
    var refresh = function () { infos = []; status = []; for (var i = 1; i <= CC.SLOTS; i++) { infos.push(CC.saveInfo(i)); status.push(CC.slotStatus(i)); } };
    refresh();
    var sel = 0, last = (CC.opts.lastSlot || 1) - 1;
    if (mode === 'continue') sel = infos[last] ? last : Math.max(0, infos.findIndex(Boolean));
    else sel = Math.max(0, status.indexOf('empty'));
    var done = function (n) { CC.pop(scr); resolve(n); };
    var scr = {
      name: 'files', opaque: true,
      update: function () {
        if (busy) return;
        if (CC.repeat('down')) { sel = (sel + 1) % CC.SLOTS; CC.sfx('blip'); }
        if (CC.repeat('up')) { sel = (sel + CC.SLOTS - 1) % CC.SLOTS; CC.sfx('blip'); }
        if (CC.input.pressed.b) { CC.sfx('back'); done(0); return; }
        if (!CC.input.pressed.a) return;
        var n = sel + 1, info = infos[sel];
        if (mode === 'continue') {
          if (!info || status[sel] === 'damaged') { CC.sfx('bump'); return; }
          CC.sfx('select'); busy = true;
          CC.menu(['Play', 'Delete', 'Back'], { x: 168, y: 18 + sel * 44 }).then(async function (c) {
            busy = false;
            // the file may have gone (another tab, cleared site data) since the list was read
            if (c === 0 && !CC.hasSave(n)) { CC.sfx('bump'); refresh(); if (!CC.hasSave()) done(0); return; }
            if (c === 0) done(n);
            else if (c === 1 && await CC.yesNo('Delete File ' + n + '? This can\'t be undone.')) {
              CC.deleteSave(n); CC.sfx('back'); refresh();
              if (!CC.hasSave()) done(0);
            }
          });
          return;
        }
        CC.sfx('select');
        if (status[sel] === 'damaged') {
          busy = true;
          CC.yesNo('File ' + n + ' is damaged and can\'t be loaded. Start a new game in it? (A copy of it is kept.)').then(function (yes) { busy = false; if (yes) { CC.backupSlot(n); done(n); } });
          return;
        }
        if (!info) { done(n); return; }
        busy = true;
        CC.yesNo('File ' + n + ' already has a game in it. Start over and erase it?').then(function (yes) { busy = false; if (yes) done(n); });
      },
      draw: function () {
        var g = CC.g, bg = CC.img('bg/title');
        if (bg) { g.drawImage(bg, 0, 0, 240, 160); g.globalAlpha = 0.6; CC.rect(0, 0, 240, 160, '#1b1626'); g.globalAlpha = 1; }
        else CC.rect(0, 0, 240, 160, '#2a2440');
        CC.text(mode === 'continue' ? 'Continue which file?' : 'Start a new game in which file?', 120, 3, '#ffffff', { align: 'center', shadow: '#000000' });
        infos.forEach(function (info, i) {
          var y = 18 + i * 44, on = i === sel;
          CC.box(8, y, 224, 40, { fill: on ? '#fff8d0' : '#fbf3e0', edge: on ? '#e8a838' : '#c8a878' });
          CC.textNum('File ' + (i + 1), 16, y + 4, '#6a3a2a', { size: 9 });
          if (on) CC.cursor(10, y + 18);
          if (status[i] === 'damaged') { CC.text('Damaged file', 120, y + 15, '#a85a4a', { align: 'center' }); return; }
          if (!info) { CC.text(mode === 'new' ? 'Empty: start here' : 'Empty', 120, y + 15, '#a89c90', { align: 'center' }); return; }
          var face = CC.img('portraits/' + info.look);
          if (face) { CC.rect(16, y + 14, 22, 22, '#3a2a22'); g.drawImage(face, 17, y + 15, 20, 20); }
          if (info.lead) CC.drawSprite(CC.creatureSprite(info.lead), 54, y + 38, { scale: 0.42, sy: 1 + (on ? Math.sin(CC.time * 6) * 0.04 : 0) });
          CC.text(info.place, 72, y + 4, '#2a2230', { size: 9 });
          CC.textNum('Caught ' + info.caught + '   Time ' + playTime(info.time) + (info.lead ? '   Lv ' + info.leadLv : ''), 72, y + 15, '#6a5a50', { size: 8 });
          CHARM_REGIONS.forEach(function (r, j) {
            var icon = CC.img('ui/charm-' + r), cx = 72 + j * 12, cy = y + 26;
            if (j < info.charms && icon) g.drawImage(icon, cx, cy, 10, 10);
            else { CC.rect(cx + 2, cy + 2, 6, 6, '#d8ccb8'); }
          });
          if (info.moon) { g.fillStyle = '#f8e8a0'; g.beginPath(); g.arc(222, y + 30, 5, 0, Math.PI * 2); g.fill(); }
        });
        CC.text('A to choose, B to go back.', 120, 150, '#e8e0ff', { size: 9, align: 'center', shadow: '#000000' });
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
    await CC.applyPendingCodes();
    if (CC.state.flags.starter) return; // a STARTER code skipped the intro
    await CC.showStill('still-1', [
      'For many nights now, the moon over Home Village has been growing dimmer.',
      'The villagers look up and worry. Out in the tall grass, the creatures hide and tremble.',
    ]);
    await CC.say('Welcome to Home Village! Creatures live in the wild all around here, hiding in the tall grass.');
    await CC.say('Arrows (or the pad) to walk, A (Z key) to talk, B (X key) to go back or run, and MENU (Enter) for your party and saves.');
    await CC.say('Elder Willow lives in the big house with the mossy roof. Go and say hello!');
  });
};
// false when the file can't be loaded (the title shows again)
CC.continueGame = function () {
  if (!CC.loadGame() || CC.slotStatus(CC.slot) !== 'ok') return false;
  var s = CC.state;
  s.flags = s.flags || {}; s.caught = s.caught || {};
  if (s.flags.trial1) B_moveAside();
  // a save from before v12 could be made during Gloaming's catch battle, after Page 12 saved the game: it waits by the pool
  if (s.flags.gloamingCalm && !s.flags.gloamingWaits && !s.caught.gloaming) s.flags.gloamingWaits = true;
  var h = s.lastHeal || { map: 'village', x: 11, y: 6 };
  if (!CC.MAPS[s.map]) { s.map = h.map; s.x = h.x; s.y = h.y; }
  CC.world.enter(s.map, s.x, s.y, s.dir);
  // a spot that has since been built on (a newer version's map): the nearest free tile, else where you last rested
  if (CC.world.solidAt(s.x, s.y)) {
    var free = nearestFree(s.x, s.y);
    if (free) CC.world.enter(s.map, free[0], free[1], s.dir); else CC.world.enter(h.map, h.x, h.y, 'down');
  }
  CC.push(CC.world);
  CC.world.run(CC.applyPendingCodes);
  return true;
};
// the closest tile you can stand on, searching outward from x, y on the current map
function nearestFree(x, y) {
  var w = CC.world, rows = w.map.rows, seen = {}, q = [[x, y]];
  seen[x + ',' + y] = true;
  while (q.length) {
    var c = q.shift();
    if (!w.solidAt(c[0], c[1])) return c;
    for (var d in CC.DIRS) {
      var nx = c[0] + CC.DIRS[d][0], ny = c[1] + CC.DIRS[d][1];
      if (nx < 0 || ny < 0 || ny >= rows.length || nx >= rows[0].length || seen[nx + ',' + ny]) continue;
      seen[nx + ',' + ny] = true; q.push([nx, ny]);
    }
  }
  return null;
}
