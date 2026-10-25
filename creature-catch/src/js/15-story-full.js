// The full journey: the seven guides and their trials, route trainers, Juniper's rival battles, chests, the outpost
// keepers and Tobias, and "The Fading Moon": the story stills, the Moon Altar, Lunarion, the ending, and the
// Moonlit Spire after it.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  function team(list) { return CC.trainerTeam(list); } // each creature in its form at that level

  // ---------- story stills: a full-screen picture with lines under it ----------
  CC.showStill = async function (id, lines, opts) {
    opts = opts || {};
    var t0 = CC.time, scr = {
      name: 'still', opaque: true, update: function () {},
      draw: function () {
        var img = CC.img('bg/' + id), g = CC.g;
        CC.rect(0, 0, CC.W, CC.H, '#000');
        if (img) { // a slow push in
          var k = 1 + Math.min(1, (CC.time - t0) / 14) * 0.06, w = 240 * k, h = 160 * k;
          g.drawImage(img, (240 - w) / 2, (160 - h) / 2 - (k - 1) * 40, w, h);
        }
      },
    };
    await CC.fade(0.4, true);
    CC.stack.splice(CC.stack.indexOf(CC.fadeScreen), 0, scr);
    await CC.fade(0.6, false);
    for (var i = 0; i < lines.length; i++) await CC.say(lines[i], { who: opts.who });
    await CC.fade(0.4, true);
    CC.pop(scr);
    if (!opts.keepBlack) await CC.fade(0.4, false);
  };

  // ---------- people walking to a spot (shortest way around walls) ----------
  CC.walkTo = async function (n, tx, ty) {
    var w = CC.world, key = function (x, y) { return x + ',' + y; }, prev = {}, q = [[n.x, n.y]], found = false;
    prev[key(n.x, n.y)] = null;
    while (q.length && !found) {
      var c = q.shift();
      for (var d in CC.DIRS) {
        var nx = c[0] + CC.DIRS[d][0], ny = c[1] + CC.DIRS[d][1], k = key(nx, ny);
        if (k in prev) continue;
        var blocked = (w.solidAt(nx, ny) && !(nx === tx && ny === ty && !CC.tileSolid(w.map, CC.tileAt(w.map, nx, ny)))) || (nx === CC.state.x && ny === CC.state.y);
        if (blocked) continue;
        prev[k] = [c[0], c[1], d]; q.push([nx, ny]);
        if (nx === tx && ny === ty) { found = true; break; }
      }
    }
    if (!found) return false;
    var steps = [], at = key(tx, ty);
    while (prev[at]) { steps.unshift(prev[at][2]); at = key(prev[at][0], prev[at][1]); }
    await CC.npcWalk(n, steps);
    return true;
  };
  function faceEach(n) {
    var s = CC.state, dx = s.x - n.x, dy = s.y - n.y;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    s.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[n.dir];
  }
  // the free tile next to the player that is closest to n
  function besidePlayer(n) {
    var s = CC.state, best = null;
    ['up', 'down', 'left', 'right'].forEach(function (d) {
      var x = s.x + CC.DIRS[d][0], y = s.y + CC.DIRS[d][1];
      if (CC.world.solidAt(x, y) && !(x === n.x && y === n.y)) return;
      var dist = Math.abs(x - n.x) + Math.abs(y - n.y);
      if (!best || dist < best.d) best = { x: x, y: y, d: dist };
    });
    return best;
  }

  // ---------- the guides ----------
  // Each stands by their region's exit. Win their trial and they open the way on.
  var GUIDES = {
    forest: {
      name: 'Ranger Oakley', art: 'oakley', flag: 'trialForest', charm: 'Forest Trail Charm', coins: 600,
      team: [['barkbeetle', 11], ['owlcorn', 11], ['budstag', 12]],
      hello: ['You made it through the Forest! Good.', 'The rope bridge north is mine to lower. Show me you can handle the lake country.'],
      intro: 'The Forest raised these three. Let\'s see your training!', winText: 'Ha! The trees are cheering for you.', loseText: 'Not yet. The outpost will patch you up.',
      lore: ['Owls hunt by moonlight, but lately mine are too scared to fly. The nights are too dark.', 'The oldest trees remember a silver wolf with wings that kept watch over the night sky. They say it lives in the moon itself.'],
      opened: 'Ranger Oakley lowered the rope bridge. The way to the lake is open!',
    },
    water: {
      name: 'Fisher Gus', art: 'gus', flag: 'trialWater', charm: 'Lake Trail Charm', coins: 750,
      team: [['crabbit', 15], ['tidepuff', 15], ['sealamp', 16], ['bubblefin', 17]],
      hello: ['Ahoy! Name\'s Gus. I ferry folks to the mountain, once the rockslide\'s cleared.', 'I clear it for trainers who can hold their own on the water.'],
      intro: 'Reel \'em in, crew!', winText: 'Hooked, line and sinker. Well fished!', loseText: 'The lake wins today. Come back stronger.',
      lore: ['The tides have gone all wrong. The moon pulls on the lake, and now it barely ripples.', 'Old fishers\' tale: on full-moon nights, a silver wolf drinks from this lake. Haven\'t seen a full moon in months.'],
      opened: 'Gus and his creatures shoved the boulders aside. The way to the cave mountain is clear!',
    },
    cave: {
      name: 'Dusty', art: 'dusty', flag: 'trialCave', charm: 'Cave Trail Charm', coins: 1000,
      team: [['glimmole', 20], ['stalagbat', 20], ['gemlin', 21], ['rumblepede', 22]],
      hello: ['Dusty\'s the name, mining\'s the game. The tunnel out to the Desert is through here.', 'But the sand\'s been blowing in something fierce. Only a real trainer gets through.'],
      intro: 'Dig in, team!', winText: 'Well, I\'ll be. You\'re a gem!', loseText: 'Caved in! Rest up and come back down.',
      lore: ['Down here the crystals glow when the moon is full. They\'ve been going dark, one by one.', 'We found old carvings in the deep tunnels: a wolf, a crescent moon, and an altar far to the north, in the ruins.'],
      opened: 'Dusty propped open the tunnel. Warm desert wind blows through. The way to the Desert is open!',
    },
    desert: {
      name: 'Safi', art: 'safi', flag: 'trialDesert', charm: 'Desert Trail Charm', coins: 1200,
      team: [['cactoad', 24], ['dunefox', 24], ['scarabolt', 25], ['duneserpent', 26]],
      hello: ['Peace, traveler. I am Safi. My people cross these dunes by the stars.', 'The sandstorm guards the mountain path. I can calm it, for one who proves themselves.'],
      intro: 'The desert tests everyone. Now it tests you!', winText: 'The stars were right about you.', loseText: 'The sand swallows the unready. Rest, and return.',
      lore: ['One star is missing from the sky. We call it the Moon\'s Eye. My grandmother said it rests in the crest of the moon\'s guardian.', 'If the guardian is hurting, so is its star. That is why the nights grow dark.'],
      opened: 'Safi raised her staff and the sandstorm settled. The mountain path is open!',
    },
    snow: {
      name: 'Frida', art: 'frida', flag: 'trialSnow', charm: 'Snow Trail Charm', coins: 1400,
      team: [['sleetle', 27], ['yetiny', 28], ['pengarch', 28], ['glacistoat', 29]],
      hello: ['Brr! Frida, explorer. I\'ve mapped every peak in the north.', 'The ice wall at the pass only melts for trainers who can take the cold.'],
      intro: 'Let\'s see if you can keep your cool!', winText: 'You thawed my whole team!', loseText: 'Too chilly for you yet. Warm up at the outpost.',
      lore: ['From the summit you can see the old ruins. At night a shadow sits over them, darker than the sky around it.', 'Something up there is hurting. I could feel it in the wind.'],
      opened: 'Frida cracked the ice wall with her axe. The pass to the swamp is open!',
    },
    swamp: {
      name: 'Granny Moss', art: 'moss', flag: 'trialSwamp', charm: 'Swamp Trail Charm', coins: 1600,
      team: [['lilypadle', 31], ['mireling', 32], ['wispeel', 33], ['mudgatron', 34]],
      hello: ['Oh, a visitor! Sit, sit. I\'m Granny Moss.', 'The boardwalk to the ruins broke in a storm. I\'ll mend it for you, but first, a little battle. I\'m old, not done!'],
      intro: 'Don\'t go easy on Granny now!', winText: 'Oh my! Just like the heroes in my stories.', loseText: 'Heh heh. Granny still has it. Try again, dearie.',
      lore: ['I\'ve seen this once before, when I was a tiny girl. The moon\'s guardian grew tired, and the shadow crept into it.', 'Someone has to calm it, not beat it. Battle it with a kind heart, and the light comes back. Oh, and look for the Moon Shard in my swamp.'],
      opened: 'Granny Moss\'s creatures rebuilt the boardwalk in no time. The way to the Night Ruins is open!',
    },
    ruins: {
      name: 'Corvin', art: 'corvin', flag: 'trialRuins', charm: 'Night Trail Charm', coins: 2000,
      team: [['bonepanther', 33], ['pebbleton', 34], ['beaconwraith', 35], ['duskfang', 36]],
      hello: ['Halt. I am Corvin, the night watchman of these ruins.', 'Beyond this rune gate is the Moon Altar. Only the strongest may pass. Prove it.'],
      intro: 'The night is long. Let\'s begin.', winText: 'Hm. You\'re the one we\'ve been waiting for.', loseText: 'Not tonight. Rest and return.',
      lore: ['I watch the altar every night. Lunarion is there, but it\'s not itself. Dimmed, angry, confused. It lets no one near.', 'Take this. The ancients made it for this night. And go gently.'],
      opened: 'The runes on the gate flared blue and faded. The way to the Moon Altar is open!',
    },
  };
  CC.GUIDES = GUIDES;
  var CHARM_ART = { forest: 'ui/charm-forest', water: 'ui/charm-water', cave: 'ui/charm-cave', desert: 'ui/charm-desert', snow: 'ui/charm-snow', swamp: 'ui/charm-swamp', ruins: 'ui/charm-ruins' };

  // a little card that shows an item or charm you just got
  CC.showPrize = async function (icon, text) {
    var t0 = CC.time, scr = { name: 'prize', update: function () {}, draw: function () {
      var img = CC.img(icon), k = Math.min(1, (CC.time - t0) / 0.3), s = 34 * CC.ease(k);
      if (!img) return;
      CC.g.globalAlpha = 0.5 * k; CC.rect(0, 0, CC.W, 112, '#1a1426'); CC.g.globalAlpha = 1;
      var r = 28 + Math.sin(CC.time * 4) * 3, grd = CC.g.createRadialGradient(120, 56, 0, 120, 56, r);
      grd.addColorStop(0, 'rgba(255,240,170,0.7)'); grd.addColorStop(1, 'rgba(255,240,170,0)'); CC.g.fillStyle = grd; CC.g.fillRect(120 - r, 56 - r, r * 2, r * 2);
      var q = s / Math.max(img.width, img.height);
      CC.g.drawImage(img, 120 - img.width * q / 2, 56 - img.height * q / 2 + Math.sin(CC.time * 3) * 2, img.width * q, img.height * q);
    } };
    CC.push(scr);
    await CC.say(text);
    CC.pop(scr);
  };

  async function guideTalk(region) {
    var gd = GUIDES[region];
    if (F()[gd.flag]) { await CC.talk(gd.name, gd.lore.slice(0, 1).concat(['The way on is open. Good luck out there!'])); return; }
    await CC.talk(gd.name, gd.hello);
    if (!(await CC.yesNo('Ready for my trail trial?', gd.name))) { await CC.say('Come back when you\'re ready.', { who: gd.name }); return; }
    var r = await CC.fight({ vs: 'guide', trainer: { name: gd.name, art: gd.art, look: gd.art, coins: gd.coins, intro: gd.intro, winText: gd.winText, loseText: gd.loseText, team: team(gd.team) } });
    if (r !== 'win') return;
    F()[gd.flag] = true;
    CC.sfx('charm');
    await CC.showPrize(CHARM_ART[region], 'You got the ' + gd.charm + '!');
    await CC.talk(gd.name, gd.lore);
    if (region === 'cave') {
      await CC.say('Oh, and Ranger Oakley sent this along. Said Timberowl has taken a shine to you.', { who: gd.name });
      F().fly = true; CC.sfx('buy');
      await CC.showPrize('items/whistle', 'You got the Wooden Whistle! Blow it (R, or MENU > Fly) to fly to any place you have been.');
    }
    if (region === 'ruins') {
      CC.state.bag.master = (CC.state.bag.master || 0) + 1; CC.sfx('buy');
      await CC.showPrize('ui/cube-master', 'You got the Master Cube! It never fails.');
    }
    CC.world.refresh(); CC.sfx('gate');
    CC.world.shakeT = CC.time + 0.6;
    await CC.say(gd.opened);
    CC.saveGame();
  }

  // ---------- route trainers: they spot you and walk over ----------
  // flag: 'tr:<id>' once beaten
  var TRAINERS = {
    forest: [
      { id: 'forest-1', art: 'trainer-1', name: 'Scout Milo', x: 15, y: 8, dir: 'left', sight: 4, team: [['mushling', 9], ['owlcorn', 10]],
        intro: 'I\'ve got three badges and a snack. Battle me!', win: 'Aw, my snack is all I have left.', after: 'Scouts are always prepared. I wasn\'t.' },
      { id: 'forest-2', art: 'trainer-2', name: 'Bug Catcher Ivy', x: 9, y: 11, dir: 'left', sight: 3, team: [['barkbeetle', 10], ['mothlight', 10]],
        intro: 'My net never misses! Wait, you\'re not a bug.', win: 'Squashed!', after: 'Mothlight evolves with a Moon Shard. Neat, huh?' },
    ],
    water: [
      { id: 'water-1', art: 'trainer-3', name: 'Swimmer Kai', x: 16, y: 21, dir: 'left', sight: 3, team: [['bubblefin', 12], ['crabbit', 13]],
        intro: 'Water\'s great! Let\'s splash!', win: 'Glub glub...', after: 'Swim between battles. It\'s good training.' },
      { id: 'water-2', art: 'trainer-4', name: 'Sailor Finn', x: 16, y: 9, dir: 'left', sight: 3, team: [['tidepuff', 13], ['sealamp', 13], ['crabbit', 13]],
        intro: 'Ahoy! Prepare to be boarded!', win: 'Abandon ship!', after: 'The lighthouse hasn\'t been needed this much in years. Dark nights.' },
    ],
    cave: [
      { id: 'cave-1', art: 'trainer-5', name: 'Miner Pearl', x: 14, y: 20, dir: 'left', sight: 3, team: [['glimmole', 16], ['gemlin', 17]],
        intro: 'My headlamp found you! Battle!', win: 'Lights out for me...', after: 'The crystals used to glow brighter. Weird, right?' },
      { id: 'cave-2', art: 'trainer-6', name: 'Spelunker Rex', x: 17, y: 10, dir: 'left', sight: 3, team: [['stalagbat', 17], ['rumblepede', 17], ['magmite', 18]],
        intro: 'I rope down into the deepest holes. You\'re not scary!', win: 'I\'m at the end of my rope!', after: 'Magmite gets really hot when it evolves.' },
    ],
    desert: [
      { id: 'desert-1', art: 'trainer-7', name: 'Treasure Hunter Jo', x: 12, y: 17, dir: 'left', sight: 3, team: [['sandwyrm', 20], ['dunefox', 20]],
        intro: 'X marks the spot, and the spot is you!', win: 'No treasure today...', after: 'Folks say there\'s a Sun Shard buried in a chest in the dunes.' },
      { id: 'desert-2', art: 'trainer-8', name: 'Caravan Guard Omar', x: 19, y: 12, dir: 'left', sight: 3, team: [['cactoad', 21], ['scarabolt', 21], ['sandwyrm', 22]],
        intro: 'None pass the caravan without a battle!', win: 'The caravan yields.', after: 'Tobias the merchant trades here now. Gold cubes!' },
    ],
    snow: [
      { id: 'snow-1', art: 'trainer-9', name: 'Skier Lena', x: 8, y: 18, dir: 'left', sight: 3, team: [['pengloo', 24], ['sleetle', 24]],
        intro: 'Coming through! Whoa, battle!', win: 'Wipeout!', after: 'Pengarch slides faster than I ski.' },
      { id: 'snow-2', art: 'trainer-10', name: 'Mountaineer Hal', x: 14, y: 12, dir: 'right', sight: 3, team: [['frostoat', 25], ['yetiny', 25], ['pengloo', 26]],
        intro: 'Every peak, every battle. Let\'s climb!', win: 'I\'ll need a rest after that.', after: 'From the top, the ruins look so dark at night.' },
    ],
    swamp: [
      { id: 'swamp-1', art: 'trainer-11', name: 'Herbalist Sage', x: 12, y: 18, dir: 'right', sight: 3, team: [['lilypadle', 28], ['mudgator', 28]],
        intro: 'These swamp flowers make great medicine. And great battlers!', win: 'Wilted...', after: 'Granny Moss taught me everything I know.' },
      { id: 'swamp-2', art: 'trainer-12', name: 'Ghost Hunter Vale', x: 8, y: 9, dir: 'right', sight: 3, team: [['mireling', 29], ['wispeel', 29], ['mudgator', 30]],
        intro: 'My lantern sees ghosts. And you!', win: 'Spooked out...', after: 'The ghosts in the ruins are restless. Something\'s wrong up there.' },
    ],
    ruins: [
      { id: 'ruins-1', art: 'trainer-13', name: 'Scholar Edith', x: 7, y: 22, dir: 'left', sight: 3, team: [['pebbleton', 33], ['wispkin', 33], ['bonecat', 34]],
        intro: 'These runes say: "battle the traveler." I think. Let\'s go!', win: 'I mistranslated that.', after: 'The runes speak of a guardian who keeps the moon alight.' },
      { id: 'ruins-2', art: 'trainer-14', name: 'Moon Priestess Selene', x: 15, y: 13, dir: 'left', sight: 3, team: [['moonlynx', 34], ['wispkin', 34], ['fangling', 35]],
        intro: 'The moon watches us. Let it see you battle.', win: 'The moon has chosen well.', after: 'Lunarion is in pain. Please, be gentle with it.' },
    ],
  };
  CC.TRAINERS = TRAINERS;
  function trainerFight(n) {
    return CC.fight({ trainer: { name: n.name, art: n.art, look: n.art, coins: n.team[n.team.length - 1][1] * 30, intro: n.intro, winText: n.win, team: team(n.team) } });
  }
  async function trainerTalk(n) {
    if (F()['tr:' + n.id]) { await CC.say(n.after, { who: n.name }); return; }
    if ((await trainerFight(n)) === 'win') F()['tr:' + n.id] = true;
  }
  // called after every step: does a trainer who hasn't battled you see you?
  CC.trainerSight = function (mapId, x, y) {
    if (CC.firstHealthy() < 0) return null; // nobody can battle: trainers let you walk by
    var list = CC.NPCS[mapId] || [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (!n.sight || (n.when && !n.when()) || F()[n.seenFlag]) continue;
      var d = CC.DIRS[n.dir], tx = n.x, ty = n.y, saw = false;
      for (var k = 1; k <= n.sight; k++) {
        tx += d[0]; ty += d[1];
        if (tx === x && ty === y) { saw = true; break; }
        if (CC.world.solidAt(tx, ty)) break;
      }
      if (saw) return (function (n) { return async function () {
        CC.sfx('encounter'); n.emote = 'exclaim';
        await CC.sleep(0.7); n.emote = null;
        var spot = besidePlayer(n);
        if (spot && (spot.x !== n.x || spot.y !== n.y)) await CC.walkTo(n, spot.x, spot.y);
        faceEach(n);
        await n.onSpot();
      }; })(n);
    }
    return null;
  };

  // ---------- Juniper, your rival ----------
  // her team covers your starter's weaknesses; it grows with each meeting, about level with the guide you just beat
  // (a little under in the Forest and the Night Ruins, where she's hardest on your starter; v12) (team() grows each creature into its form at its level: at the Spire, meeting 6, her Bumblazer,
  // Timberowl and Rampacrab come as Queenbuzz, Oakenowl and Paladcrab)
  var RIVAL_TEAMS = {
    drizzlon: { 2: [['bumblop', 7], ['mossback', 8]], 3: [['bumblop', 17], ['owlcorn', 18], ['thornshell', 20]], 4: [['bumblazer', 24], ['prismole', 24], ['timberowl', 25], ['thornshell', 26]], 5: [['bumblazer', 32], ['prismole', 32], ['timberowl', 33], ['elderoak', 34]], 6: [['bumblazer', 47], ['prismole', 47], ['timberowl', 48], ['elderoak', 50]] },
    mossback: { 2: [['frostoat', 7], ['embroak', 8]], 3: [['frostoat', 17], ['magmite', 18], ['cinderfrog', 20]], 4: [['glacistoat', 24], ['sunmane', 24], ['volcaneetle', 26], ['cinderfrog', 26]], 5: [['glacistoat', 32], ['volcaneetle', 32], ['sunmane', 33], ['infernotoad', 34]], 6: [['glacistoat', 47], ['volcaneetle', 47], ['sunmane', 48], ['infernotoad', 50]] },
    embroak: { 2: [['crabbit', 7], ['drizzlon', 8]], 3: [['crabbit', 17], ['koiling', 18], ['rapidrake', 20]], 4: [['rampacrab', 24], ['radimoth', 24], ['koidrake', 25], ['rapidrake', 26]], 5: [['rampacrab', 32], ['radimoth', 32], ['koidrake', 33], ['tsunadrake', 34]], 6: [['rampacrab', 47], ['radimoth', 47], ['koidrake', 48], ['tsunadrake', 50]] },
  };
  var WEAK = { drizzlon: 'Plant and Bolt', mossback: 'Fire and Frost', embroak: 'Water and Lumen' };
  function rivalLines(no) {
    var st = F().starter || 'embroak', yours = CC.CREATURES[st].name, weak = WEAK[st];
    return {
      2: { hi: ['There you are! I got through the log before you, obviously.', 'I\'ve been training. ' + yours + ' is weak to ' + weak + ', and I came prepared!'], win: 'Okay, okay. You\'re not bad.', lose: 'Told you! I\'m always a step ahead!', bye: ['Hey, have you noticed the moon? It\'s been really dim lately.', 'Gramps is worried about it. Whatever. See you at the lake!'] },
      3: { hi: ['Took you long enough! I already beat Dusty.', 'My starter evolved. Did yours? Let\'s find out!'], win: 'How do you keep doing that?!', lose: 'Ha! Evolution is power, baby!', bye: ['The miners say the crystals are going dark, just like the moon.', 'Something weird is going on. I\'m going to find out what. Race you!'] },
      4: { hi: ['Look at us. Way up on the mountain, a long way from Gramps\'s house.', 'I\'ve been chasing you this whole time. Not anymore. Let\'s settle it!'], win: '...Fine. You win this one. For real this time.', lose: 'Yes! Finally ahead!', bye: ['You know what? I\'m glad it\'s you I\'m racing.', 'The shadow over the ruins... it\'s getting worse. Let\'s both be ready.'] },
      5: { hi: ['You came. I knew you would.', 'Up there, at the altar. That\'s Lunarion. It\'s hurting, and it won\'t let me near.', 'Before you go up, one last battle. I need to know you\'re ready.'], win: 'You\'re ready. Go. I\'ll be right behind you.', lose: 'Not yet. Rest up. I\'ll wait.', bye: ['Go on. Calm it down. Gramps was right about you.'] },
      6: { hi: ['The top of the Spire. Of course you\'d find me here.', 'No moon to save this time. Just you, me, and everything we\'ve learned. Full power!'], win: 'Best rival ever. I mean it.', lose: 'Ha! Rematch anytime, champ.', bye: ['Thanks for the adventure. Same time next year?'] },
    }[no];
  }
  // where she appears from on each map, and which step sets her off
  var RIVAL_SPOTS = {
    forest: { no: 2, from: [14, 16], step: function (x, y) { return y <= 23; } },
    cave: { no: 3, from: [13, 1], step: function (x, y) { return y <= 5; } },
    snow: { no: 4, from: [12, 4], step: function (x, y) { return y <= 9; }, still: true },
    ruins: { no: 5, from: [12, 4], step: function (x, y) { return y <= 7; } },
  };
  function rivalNpc(mapId) {
    return (CC.NPCS[mapId] || []).find(function (n) { return n.id === 'rival'; });
  }
  async function rivalScene(mapId) {
    var spot = RIVAL_SPOTS[mapId], no = spot.no, L = rivalLines(no), n = rivalNpc(mapId);
    if (spot.still) await CC.showStill('still-3', ['High on the mountain, a familiar voice calls your name.']);
    n.x = spot.from[0]; n.y = spot.from[1]; n.show = true; n.dir = 'down';
    CC.sfx('encounter');
    await CC.say('Hey! Wait up!', { who: 'Juniper' });
    var b = besidePlayer(n);
    if (b) await CC.walkTo(n, b.x, b.y);
    faceEach(n);
    await CC.talk('Juniper', L.hi);
    var older = no >= 4;
    var r = await CC.fight({ vs: 'rival', trainer: { name: 'Juniper', art: older ? 'juniper-older' : 'juniper', look: 'juniper', coins: 300 * no, winText: L.win, loseText: L.lose, team: team(RIVAL_TEAMS[F().starter || 'embroak'][no]) } });
    if (r !== 'win') { n.show = false; return; }
    F()['juniper' + no] = true;
    await CC.talk('Juniper', L.bye);
    if (no < 5) { await CC.walkTo(n, spot.from[0], spot.from[1]); n.show = false; }
    CC.saveGame();
  }

  // ---------- chests ----------
  CC.openChest = async function (d) {
    var key = 'chest:' + d.chest;
    if (F()[key]) { await CC.say('The chest is empty.'); return; }
    F()[key] = true; CC.sfx('chest'); CC.world.refresh();
    CC.state.bag[d.item] = (CC.state.bag[d.item] || 0) + (d.n || 1);
    var it = CC.ITEMS[d.item];
    await CC.showPrize(it.icon, 'You found ' + (d.n > 1 ? d.n + ' x ' + it.name : 'a ' + it.name) + '!');
    if (it.shard) await CC.say('Some creatures evolve when they touch a ' + it.name + '. Use it from your Bag.');
  };
  var CHESTS = {
    forest: [{ x: 22, y: 5, item: 'great', n: 3 }, { x: 3, y: 17, item: 'superpotion', n: 2 }],
    water: [{ x: 8, y: 21, item: 'superpotion', n: 3 }, { x: 17, y: 5, item: 'great', n: 5 }],
    cave: [{ x: 2, y: 9, item: 'tonic', n: 2 }, { x: 20, y: 5, item: 'revive', n: 1 }],
    desert: [{ x: 1, y: 1, item: 'sunshard', n: 1 }, { x: 2, y: 17, item: 'ultra', n: 2 }],
    snow: [{ x: 21, y: 18, item: 'fulltonic', n: 1 }, { x: 22, y: 9, item: 'revive', n: 2 }],
    swamp: [{ x: 3, y: 10, item: 'moonshard', n: 1 }, { x: 20, y: 20, item: 'ultra', n: 3 }],
    ruins: [{ x: 2, y: 19, item: 'moonshard', n: 1 }, { x: 1, y: 1, item: 'fulltonic', n: 2 }],
    spire: [{ x: 4, y: 1, item: 'fulltonic', n: 3 }, { x: 16, y: 9, item: 'revive', n: 3 }],
  };
  // a few region props to dress each map (walk-through unless solid)
  var PROPS = {
    forest: [{ x: 1, y: 4, img: 'props/rocks-and-bushes-12', h: 14 }, { x: 20, y: 9, img: 'props/rocks-and-bushes-11', h: 13 }, { x: 8, y: 22, img: 'props/rocks-and-bushes-13', h: 13 }],
    water: [{ x: 7, y: 6, img: 'props/water-props-3', h: 11, solid: false, dy: 2 }, { x: 22, y: 14, img: 'props/rocks-and-bushes-6', h: 12 }, { x: 22, y: 24, img: 'props/rocks-and-bushes-7', h: 12 }],
    cave: [{ x: 15, y: 3, img: 'props/cave-and-ruins-props-1', h: 18 }, { x: 4, y: 21, img: 'props/cave-and-ruins-props-3', h: 14 }, { x: 15, y: 16, img: 'props/cave-and-ruins-props-2', h: 18 }],
    desert: [{ x: 19, y: 2, img: 'props/trees-5', h: 24 }, { x: 4, y: 9, img: 'props/rocks-and-bushes-3', h: 12 }, { x: 21, y: 22, img: 'props/rocks-and-bushes-13', h: 12, dx: 0 }],
    snow: [{ x: 21, y: 6, img: 'props/rocks-and-bushes-4', h: 12 }, { x: 2, y: 16, img: 'props/rocks-and-bushes-10', h: 13 }],
    swamp: [{ x: 21, y: 8, img: 'props/cave-and-ruins-props-7', h: 15 }, { x: 16, y: 22, img: 'props/rocks-and-bushes-8', h: 12 }],
    ruins: [{ x: 7, y: 2, img: 'props/cave-and-ruins-props-6', h: 20 }, { x: 21, y: 13, img: 'props/cave-and-ruins-props-5', h: 18 }, { x: 2, y: 12, img: 'props/cave-and-ruins-props-4', h: 18 }, { x: 21, y: 24, img: 'props/cave-and-ruins-props-7', h: 14 }],
    spire: [],
  };
  Object.keys(CHESTS).forEach(function (k) {
    var m = CC.MAPS[k];
    m.decor = (m.decor || []).concat(PROPS[k] || []).concat(CHESTS[k].map(function (c) { return Object.assign({ chest: k + '-' + c.x + '-' + c.y }, c); }));
  });

  // ---------- the outposts: a keeper who heals, and Tobias from the Desert on ----------
  var TOBIAS_FROM = { desert: 1, snow: 1, swamp: 1, ruins: 1 };
  Object.keys(CC.KEEPERS).forEach(function (k) {
    var keeper = CC.KEEPERS[k], room = 'outpost-in-' + k;
    CC.PORTRAITS[keeper[0]] = keeper[1];
    CC.NPCS[room] = [{ x: 4, y: 2, art: keeper[1], h: 25, dir: 'down', talk: function () {
      return CC.healingHut(keeper[0], { map: room, x: 4, y: 4 }, 'Welcome to the ' + CC.MAPS[k].name + ' Outpost! I\'m ' + keeper[0] + '.');
    } }];
    if (TOBIAS_FROM[k]) CC.NPCS[room].push({ x: 7, y: 4, art: 'tobias', h: 26, dir: 'left', talk: async function () {
      await CC.say('Tobias, traveling merchant! Finest gold-banded cubes this side of the dunes.', { who: 'Tobias' });
      await CC.shopScreen(['ultra', 'great', 'superpotion', 'megapotion', 'tonic', 'fulltonic', 'revive', 'cureherb'], 'Tobias');
      await CC.say('Pleasure doing business!', { who: 'Tobias' });
    } });
  });

  // ---------- the people on each region map ----------
  Object.keys(GUIDES).forEach(function (k) {
    var gd = GUIDES[k], at = k === 'ruins' ? [14, 9] : [14, 1];
    CC.NPCS[k] = CC.NPCS[k] || [];
    CC.NPCS[k].push({ x: at[0], y: at[1], art: gd.art, h: 26, dir: 'down', id: 'guide', talk: function () { return guideTalk(k); } });
  });
  Object.keys(TRAINERS).forEach(function (k) {
    TRAINERS[k].forEach(function (t) {
      var n = Object.assign({ h: 26, seenFlag: 'tr:' + t.id }, t);
      n.talk = function () { return trainerTalk(n); };
      n.onSpot = function () { return trainerTalk(n); };
      CC.NPCS[k].push(n);
    });
  });
  Object.keys(RIVAL_SPOTS).forEach(function (k) {
    var no = RIVAL_SPOTS[k].no;
    // while she's still standing there after a battle, she says her goodbye again
    CC.NPCS[k].push({ id: 'rival', x: 0, y: 0, art: 'juniper', sheet: 'juniper', h: 26, dir: 'down', show: false,
      when: function () { return this.show; }, talk: function () { var bye = rivalLines(no).bye; return CC.talk('Juniper', bye.slice(-1)); } });
    var prev = CC.TRIGGERS[k];
    CC.TRIGGERS[k] = function (x, y) {
      var t = prev && prev(x, y);
      if (t) return t;
      if (!F()['juniper' + no] && CC.firstHealthy() >= 0 && RIVAL_SPOTS[k].step(x, y) && (no !== 5 || F().trialRuins)) return function () { return rivalScene(k); };
      return null;
    };
  });
  // the older Juniper from the snow pass on
  ['snow', 'ruins'].forEach(function (k) { var n = rivalNpc(k); n.art = 'juniper-older'; n.sheet = null; });
  // villagers here and there
  CC.NPCS.forest.push({ x: 7, y: 3, art: 'villager-1', h: 22, dir: 'down', talk: function () { return CC.talk('Hiker', ['The Ranger Station is up the ladder. Oakley lives up there with a whole family of owls.']); } });
  CC.NPCS.water.push({ x: 7, y: 9, art: 'villager-6', h: 22, dir: 'right', talk: function () { return CC.talk('Fisher', ['The lighthouse keeper left years ago. Now it lights up on its own, on dark nights. Spooky, huh?']); } });
  CC.NPCS.desert.push({ x: 8, y: 3, art: 'villager-7', h: 22, dir: 'down', talk: function () { return CC.talk('Traveler', ['The oasis is the only water for miles. Every creature in the desert drinks there at dawn.']); } });
  CC.NPCS.snow.push({ x: 20, y: 5, art: 'villager-3', h: 22, dir: 'down', talk: function () { return CC.talk('Climber', ['The falls froze solid the night the moon began to dim. They say they\'ll flow again when it\'s bright.']); } });
  CC.NPCS.swamp.push({ x: 8, y: 6, art: 'villager-2', h: 21, dir: 'down', talk: function () { return CC.talk('Swamp Kid', ['Granny Moss makes the best stew. Don\'t ask what\'s in it.']); } });

  CC.SIGNS['forest:12,10'] = 'Forest. Ranger Oakley\'s station: northwest. Outpost: east. Lake country: north, over the rope bridge.';
  CC.SIGNS['water:12,10'] = 'Lakeshore. Fisher Gus\'s dock: northwest. Outpost: east. Cave mountain: north, past the rockslide.';
  CC.SIGNS['cave:19,11'] = 'Crystal Cave. Mine office: northwest. Outpost: just below. Desert tunnel: north.';
  CC.SIGNS['desert:14,11'] = 'Sunscorch Desert. Safi\'s tent: northwest. Oasis: northeast. Outpost: below. Mountain path: north, through the sandstorm.';
  CC.SIGNS['snow:11,11'] = 'Frostpeak Pass. Frida\'s cabin: northwest. Frozen falls: northeast. Swamp: north, past the ice wall.';
  CC.SIGNS['swamp:6,12'] = 'Murkmire Swamp. Granny Moss: northwest, over the water. Outpost: east. Night Ruins: north, along the boardwalk.';
  CC.SIGNS['ruins:12,16'] = 'Night Ruins. Watchtower: northwest. Outpost: just below. The Moon Altar: north, beyond the rune gate.';
  Object.assign(CC.PORTRAITS, {
    'Fisher Gus': 'gus', 'Dusty': 'dusty', 'Safi': 'safi', 'Frida': 'frida', 'Granny Moss': 'moss', 'Corvin': 'corvin', 'Tobias': 'tobias',
    'Hiker': 'villager-1', 'Fisher': 'villager-6', 'Traveler': 'villager-7', 'Climber': 'villager-3', 'Swamp Kid': 'villager-2',
  });
  Object.keys(TRAINERS).forEach(function (k) { TRAINERS[k].forEach(function (t) { CC.PORTRAITS[t.name] = t.art; }); });

  // ---------- guide journals (in their homes) ----------
  var JOURNALS = {
    bramble: ['Farmer Bramble\'s almanac. "The crops grow slow at night now. Granny always said the moon helps them grow."'],
    oakley: ['Ranger\'s log. "Owls grounded again. Third week. The moon is barely a sliver, even when it should be full."'],
    gus: ['Gus\'s tide book. "Low tide, low tide, low tide. The lake has forgotten how to breathe."'],
    dusty: ['Mine report. "Found a carving in shaft 9: a winged wolf, a crescent, an altar. Sent a sketch to Elder Willow."'],
    safi: ['Star chart. One star is circled in red ink: "The Moon\'s Eye. Missing since the dimming."'],
    frida: ['Expedition notes. "Shadow over the ruins again tonight. It moved. It breathed."'],
    moss: ['A recipe book. Between the pages, a pressed flower and a note: "Battle it gently. Then the light comes home."'],
    corvin: ['Watch log. "Night 112. The guardian howled at the empty sky. I think it is calling for help."'],
  };
  var useFurniture = CC.useFurniture;
  CC.useFurniture = async function (d) {
    if (typeof d.talk === 'string' && d.talk.indexOf('journal:') === 0) {
      var lines = JOURNALS[d.talk.slice(8)] || [];
      for (var i = 0; i < lines.length; i++) await CC.say(lines[i]);
      return;
    }
    return useFurniture(d);
  };

  // ---------- doors: the Spire is sealed until the moon is back ----------
  var enterDoor = CC.enterDoor;
  CC.enterDoor = async function (mapId, id) {
    if (id === 'spire-door') {
      if (!F().moonRestored) { await CC.say('The tower door is sealed with cold moonlight. It won\'t budge.'); return; }
      CC.sfx('select'); await CC.fade(0.3, true);
      CC.world.enter('spire', 8, 18, 'up'); await CC.fade(0.3, false); return;
    }
    return enterDoor(mapId, id);
  };

  // ---------- the finale: the Moon Altar ----------
  var prevRuins = CC.TRIGGERS.ruins;
  CC.TRIGGERS.ruins = function (x, y) {
    var t = prevRuins && prevRuins(x, y);
    if (t) return t;
    if (y <= 4 && x >= 11 && x <= 14 && F().juniper5 && !F().moonRestored) return finale;
    return null;
  };
  async function finale() {
    var w = CC.world, jun = rivalNpc('ruins');
    await CC.showStill('still-4', ['The stairway climbs to the old Moon Altar. Above it, the moon is almost gone.', 'Blue runes glow along the steps as you climb.']);
    CC.state.dir = 'up';
    await CC.say('...');
    CC.sfx('boss');
    if (CC.music) CC.music.play('boss');
    await CC.showStill('still-5', ['A huge shadow rises over the altar: a winged wolf, its crescent crest cracked and flickering.', 'Lunarion, guardian of the moon. Its eyes are wild with fear.'], {});
    if (jun) { jun.show = true; jun.x = 12; jun.y = 6; jun.dir = 'up'; }
    await CC.say('It\'s scared! Calm it down. You can do this!', { who: 'Juniper' });
    var r = await CC.fight({
      wild: CC.mon.make('lunariond', 40), bg: 'moon-altar', boss: true,
      introText: 'The Dimmed Lunarion lets out a broken, echoing howl!',
      noCatch: 'The shadow around it is too thick to catch it. Calm it first!', noRun: 'There\'s no running. Lunarion needs you!',
    });
    if (r !== 'win') return; // you were sent back to heal; the altar will wait
    CC.sfx('moon');
    await flashWhite();
    F().moonRestored = true;
    await CC.say('The shadow pours out of Lunarion like smoke and drifts away into the night.');
    await CC.say('Its crest mends with a bright chime. Silver light spills across the ruins!');
    var r2 = await CC.fight({
      wild: CC.mon.make('lunarion', 40), bg: 'moon-altar', boss: true, canLose: true, noVs: true,
      introText: 'Lunarion, shining silver again, looks at you calmly. It seems to be waiting.',
    });
    if (r2 === 'caught') await CC.say('Lunarion is calm in its cube. You can feel moonlight humming inside it.');
    else {
      F().lunarionSpire = true;
      await CC.say('Lunarion rose into the sky, circled the moon once, and flew toward a tall tower glowing in the north.');
      CC.healParty();
    }
    await CC.talk('Juniper', ['You did it! Look up!']);
    if (CC.music) CC.music.play('credits');
    await CC.showStill('still-6', ['The moon shines full and bright again.', 'Back home, the villagers light lanterns, and creatures of every kind come out of the tall grass to see.'], { keepBlack: true });
    await credits();
    CC.unfade();
    CC.healParty();
    w.enter('village', 4, 5, 'down');
    if (jun) jun.show = false;
    await CC.fade(0.01, true); await CC.fade(0.6, false);
    await CC.talk('Elder Willow', ['You\'re home! The whole village saw the moon come back. We knew it was you.', 'I\'ve been reading the old book again. It speaks of a tower, the Moonlit Spire, beside the altar. It opens only when the moon is whole.', 'Strong creatures live there. And I hear Juniper has already gone to the top. Go when you\'re ready.']);
    CC.state.lastHeal = { map: 'hut-in', x: 5, y: 4 };
    CC.saveGame();
  }
  CC.finale = finale;
  // the altar itself (A on it): once the moon is whole, its light leaves a little Moon Shard there once a day, so a
  // shard used up never locks a Moon Shard evolution away. The finale starts from the steps, not from here.
  CC.MAPS.ruins.landmarkTalk = async function () {
    if (!F().moonRestored) { await CC.say('The old Moon Altar. Its runes are cold, and above it the moon is only a thin, pale sliver.'); return; }
    await CC.daily('moonaltar', 'moonshard', 'Moonlight pools on the altar and leaves a little Moon Shard behind. You got a Moon Shard!',
      'The Moon Altar glows softly in the moonlight. Maybe the moon will leave another gift tomorrow.');
  };
  function flashWhite() {
    var k = 0, scr = { name: 'flash', update: function () {}, draw: function () { CC.g.globalAlpha = Math.sin(k * Math.PI); CC.rect(0, 0, CC.W, CC.H, '#ffffff'); CC.g.globalAlpha = 1; } };
    CC.push(scr);
    return CC.tween(1.2, function (t) { k = t; }).then(function () { CC.pop(scr); });
  }
  // the credits roll over the night sky with Lunarion flying across
  function credits() {
    if (CC.music) CC.music.play('credits');
    return new Promise(function (resolve) {
      var t = 0, lines = [
        ['Creature Catch', 22], ['', 0], ['The Fading Moon', 14], ['', 0], ['', 0],
        ['A Game Boy Advance style adventure', 10], ['made with Claude Code', 10], ['', 0],
        ['Design and art direction', 9], ['the Creature Catch team', 12], ['', 0], ['Code, story and battles', 9], ['Claude', 12], ['', 0],
        ['Guides', 9], ['Farmer Bramble, Ranger Oakley, Fisher Gus,', 10], ['Dusty, Safi, Frida, Granny Moss, Corvin', 10], ['', 0],
        ['Your rival', 9], ['Juniper', 12], ['', 0], ['Font: Pixelify Sans (SIL Open Font License)', 9], ['', 0], ['', 0],
        ['Thank you for playing!', 14], ['', 0], ['The Moonlit Spire awaits...', 10],
      ];
      var stars = []; for (var i = 0; i < 70; i++) stars.push([Math.random() * 240, Math.random() * 160, Math.random() * 6]);
      var scr = { name: 'credits', opaque: true,
        update: function (dt) { t += dt * (CC.input.held.a ? 4 : 1); if (t > 26 && (CC.input.pressed.a || t > 34)) { CC.pop(scr); resolve(); } },
        draw: function () {
          var g = CC.g, grd = g.createLinearGradient(0, 0, 0, 160); grd.addColorStop(0, '#0a0a26'); grd.addColorStop(1, '#2a2050');
          g.fillStyle = grd; g.fillRect(0, 0, 240, 160);
          stars.forEach(function (s) { g.globalAlpha = 0.5 + Math.sin(CC.time * 2 + s[2]) * 0.5; CC.rect(s[0], s[1], 1, 1, '#ffffff'); }); g.globalAlpha = 1;
          var mr = 18, mg = g.createRadialGradient(196, 34, 0, 196, 34, mr * 2.2);
          mg.addColorStop(0, 'rgba(255,250,220,0.5)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = mg; g.fillRect(150, 0, 90, 80);
          g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(196, 34, mr, 0, Math.PI * 2); g.fill();
          var lx = 280 - ((t * 22) % 360), ly = 60 + Math.sin(t * 0.8) * 12;
          CC.drawSprite(CC.creatureSprite('lunarion'), lx, ly, { scale: 0.5, sy: 1 + Math.sin(CC.time * 6) * 0.05, id: 'lunarion' });
          var y = 170 - t * 14;
          lines.forEach(function (l) { if (l[1] && y > -20 && y < 170) CC.text(l[0], 120, y, '#ffffff', { size: l[1], align: 'center', shadow: '#000000' }); y += l[1] ? l[1] + 8 : 10; });
          if (t > 26) CC.text('A: continue', 232, 150, '#c8c0e0', { size: 9, align: 'right' });
        } };
      CC.push(scr);
    });
  }

  // ---------- the Moonlit Spire: guide rematches, Juniper's last battle, and Lunarion if it got away ----------
  var REMATCH = {
    oakley: ['Ranger Oakley', [['budstag', 44], ['radimoth', 44], ['barkbeetle', 45], ['timberowl', 46]], 3, 4],
    gus: ['Fisher Gus', [['tidepuff', 44], ['rampacrab', 44], ['koidrake', 45], ['surgefin', 46]], 14, 4],
    dusty: ['Dusty', [['gemlin', 44], ['stalagbat', 44], ['prismole', 45], ['volcaneetle', 46]], 5, 17], // the friendliest rematch stands by the entrance
    safi: ['Safi', [['cactoad', 44], ['dunefox', 44], ['thundarab', 45], ['duneserpent', 46]], 15, 8],
    frida: ['Frida', [['sleetle', 44], ['yetiny', 45], ['pengarch', 45], ['glacistoat', 46]], 3, 13],
    moss: ['Granny Moss', [['lilypadle', 44], ['mireling', 45], ['wispeel', 45], ['mudgatron', 46]], 14, 13],
    corvin: ['Corvin', [['pebbleton', 45], ['beaconwraith', 46], ['bonepanther', 46], ['rosferatu', 47]], 2, 8],
  };
  CC.NPCS.spire = Object.keys(REMATCH).map(function (id) {
    var r = REMATCH[id];
    return { x: r[2], y: r[3], art: id, h: 26, dir: 'down', talk: async function () {
      if (!(await CC.yesNo('The view from up here is something, eh? Fancy a rematch? My team has grown too.', r[0]))) return;
      var res = await CC.fight({ vs: 'guide', trainer: { name: r[0], art: id, look: id, coins: 1500, winText: 'Still the best. Come back anytime!', team: team(r[1]) } });
      if (res === 'win') F()['rematch:' + id] = (F()['rematch:' + id] || 0) + 1;
    } };
  });
  CC.NPCS.spire.push({ x: 8, y: 1, art: 'juniper-older', h: 27, dir: 'down', talk: async function () {
    var L = rivalLines(6);
    await CC.talk('Juniper', F().juniper6 ? ['Back for more? Let\'s go!'] : L.hi);
    var r = await CC.fight({ vs: 'rival', trainer: { name: 'Juniper', art: 'juniper-older', look: 'juniper', coins: 5000, winText: L.win, loseText: L.lose, team: team(RIVAL_TEAMS[F().starter || 'embroak'][6]) } });
    if (r === 'win') { if (!F().juniper6) { F().juniper6 = true; await CC.talk('Juniper', L.bye); } }
  } });
  CC.NPCS.spire.push({ x: 11, y: 1, creature: 'lunarion', h: 30, dir: 'down', when: function () { return F().lunarionSpire && !CC.state.caught.lunarion; }, talk: async function () {
    await CC.say('Lunarion watches the moon from the top of the Spire. It turns to you.');
    var r = await CC.fight({ wild: CC.mon.make('lunarion', 45), bg: 'moonlit-spire', boss: true, introText: 'Lunarion spreads its starry wings!' });
    if (r === 'caught') F().lunarionSpire = false;
  } });
  CC.PORTRAITS['Ranger Oakley'] = 'oakley';
})();
