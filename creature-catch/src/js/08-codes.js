// Dev codes: typed (or pasted) into the hidden code box. Open it by holding L + R and pressing MENU in a game,
// or on the title screen with Up Up Down Down Left Right Left Right B A. Several codes can go in at once, split by ";" or new lines.
// Codes typed before a game starts wait and apply as soon as it does.
var CC = window.CC || (window.CC = {});

CC.dev = { noWild: false, catchAll: false, oneHit: false, god: false, infItems: false, speed: 1, pending: [], queue: null };

function creatureId(word) {
  if (!word) return null;
  var w = word.toLowerCase();
  if (CC.CREATURES[w]) return w;
  return CC.CREATURE_ORDER.find(function (id) { return id.indexOf(w) === 0; }) || null;
}
function num(word, lo, hi, dflt) {
  var n = parseInt(word, 10);
  return isNaN(n) ? dflt : CC.clamp(n, lo, hi);
}
// sets a creature's level and gives it the moves a creature of that level would know
function setLevel(m, lv) {
  m.lv = lv; m.xp = CC.mon.xpFor(lv);
  m.moves = CC.mon.movesAt(m.id, lv).map(function (id) { return { id: id, pp: CC.MOVES[id].pp }; });
  CC.mon.heal(m);
}
var MAPS_BY_WORD = {
  village: 'village', home: 'village', meadow: 'meadow', grassland: 'grassland', grass: 'grassland', forest: 'forest', water: 'water', lake: 'water',
  lakeshore: 'water', cave: 'cave', desert: 'desert', snow: 'snow', frostpeak: 'snow', swamp: 'swamp', ruins: 'ruins', night: 'ruins', altar: 'ruins', spire: 'spire', tower: 'spire',
};
var ARRIVE = { village: [10, 6], meadow: [7, 12], grassland: [12, 14], forest: [11, 23], water: [11, 23], cave: [11, 23], desert: [11, 23], snow: [11, 23], swamp: [11, 23], ruins: [11, 23], spire: [8, 18] };
// the trail trials in order, and what passing each one sets
var TRIALS = [['grassland', 'trial1'], ['forest', 'trialForest'], ['water', 'trialWater'], ['cave', 'trialCave'], ['desert', 'trialDesert'], ['snow', 'trialSnow'], ['swamp', 'trialSwamp'], ['ruins', 'trialRuins']];
function setTrials(upTo, done) {
  var f = CC.state.flags;
  TRIALS.forEach(function (t, i) { if (i <= upTo) f[t[1]] = done; });
  if (upTo >= 0) { f.vaultKey = f.logCleared = !!f.trial1; }
  if (f.trialCave) f.fly = true;
  var b = CC.NPCS.grassland.find(function (n) { return n.id === 'bramble'; });
  if (f.trial1) { b.x = 15; b.y = 2; } else { b.x = 12; b.y = 1; }
  Object.keys(CC.MAPS).forEach(function (k) { if (CC.MAPS[k].picture) CC.buildMapPicture(k); });
}

// Each code: words it answers to, a line of help, and what it does. run(args) returns the message to show.
// needsGame: it changes the save, so it waits for a game to start.
CC.CODES = [
  { words: ['HELP', '?'], help: 'HELP: list every code', run: function () {
    return CC.CODES.map(function (c) { return c.help; }).join('\n');
  } },
  { words: ['HEAL'], needsGame: true, help: 'HEAL: heal your whole party', run: function () { CC.healParty(); return 'Party healed.'; } },
  { words: ['LEVEL', 'LV'], needsGame: true, help: 'LEVEL 20: set your party to that level (1 to 50)', run: function (a) {
    var lv = num(a[0], 1, 50, null); if (!lv) return 'Try LEVEL 20.';
    CC.state.party.forEach(function (m) { setLevel(m, lv); });
    return 'Party set to Lv ' + lv + '.';
  } },
  { words: ['GIVE'], needsGame: true, help: 'GIVE TUFTAIL 12: add a creature (level optional)', run: function (a) {
    var id = creatureId(a[0]); if (!id) return 'No creature called "' + (a[0] || '') + '".';
    var m = CC.mon.make(id, num(a[1], 1, 50, 5)); var where = CC.addCreature(m);
    return CC.CREATURES[id].name + ' Lv ' + m.lv + ' joined your ' + (where === 'party' ? 'party.' : 'Vault.');
  } },
  { words: ['TEAM'], needsGame: true, help: 'TEAM EMBROAK 12 TUFTAIL 10: replace your party (up to 4)', run: function (a) {
    var team = [];
    for (var i = 0; i < a.length && team.length < 4; i++) {
      var id = creatureId(a[i]); if (!id) continue;
      var lv = num(a[i + 1], 1, 50, null); if (lv) i++;
      team.push(CC.mon.make(id, lv || 10)); CC.markCaught(id);
    }
    if (!team.length) return 'Try TEAM EMBROAK 12 TUFTAIL 10.';
    CC.state.party = team;
    return 'Party: ' + team.map(function (m) { return CC.mon.name(m) + ' ' + m.lv; }).join(', ') + '.';
  } },
  { words: ['STARTER'], needsGame: true, help: 'STARTER EMBROAK: skip Elder Willow and start with that starter', run: function (a) {
    var id = creatureId(a[0]); if (['drizzlon', 'mossback', 'embroak'].indexOf(id) < 0) return 'Pick DRIZZLON, MOSSBACK or EMBROAK.';
    CC.state.flags.starter = id; CC.state.flags.juniper1 = 'skipped';
    if (!CC.state.party.length) CC.addCreature(CC.mon.make(id, 5));
    CC.state.bag.cube = Math.max(CC.state.bag.cube, 5); CC.state.bag.potion = Math.max(CC.state.bag.potion, 3);
    return 'Starter set to ' + CC.CREATURES[id].name + '. The village is open.';
  } },
  { words: ['TEACH'], needsGame: true, help: 'TEACH THORN KISS: your lead creature learns a move (replaces its last one if full)', run: function (a) {
    var want = a.join('').toLowerCase(), id = Object.keys(CC.MOVES).find(function (k) { return k === want || CC.MOVES[k].name.toLowerCase().replace(/ /g, '') === want; });
    var m = CC.state.party[0]; if (!m) return 'You have no creatures.';
    if (!id || id === 'struggle') return 'No move called "' + a.join(' ') + '".';
    if (CC.mon.knows(m, id)) return CC.mon.name(m) + ' already knows it.';
    var slot = { id: id, pp: CC.MOVES[id].pp };
    if (m.moves.length < 4) m.moves.push(slot); else m.moves[3] = slot;
    return CC.mon.name(m) + ' learned ' + CC.MOVES[id].name + '.';
  } },
  { words: ['EVOLVE'], needsGame: true, help: 'EVOLVE: your lead creature evolves now (if it can)', run: function () {
    var m = CC.state.party[0]; if (!m || !CC.CREATURES[m.id].evo) return 'Your lead creature has no evolution.';
    CC.dev.queue = function () { return CC.evolveScene(m); };
    return 'Here it goes...';
  } },
  // ---- the old-school cheats ----
  { words: ['MAX', 'LV50'], needsGame: true, help: 'MAX: your whole party goes to Lv 50', run: function () {
    CC.state.party.forEach(function (m) { setLevel(m, 50); }); return 'Your party is Lv 50!';
  } },
  { words: ['RICH', 'MONEY'], needsGame: true, help: 'RICH: 999,999 coins', run: function () { CC.state.coins = 999999; return 'Coins: 999,999.'; } },
  { words: ['STOCKUP', 'ITEMS'], needsGame: true, help: 'STOCKUP: 99 of every item and cube (Master Cubes too)', run: function () {
    Object.keys(CC.ITEMS).forEach(function (k) { if (!CC.ITEMS[k].key) CC.state.bag[k] = 99; }); return 'Your bag is stuffed: 99 of everything.';
  } },
  { words: ['INFINITE', 'INF'], help: 'INFINITE: cubes and potions never run out / normal', run: function () {
    CC.dev.infItems = !CC.dev.infItems; return 'Bottomless bag ' + (CC.dev.infItems ? 'ON.' : 'OFF.');
  } },
  { words: ['GODMODE', 'GOD'], help: 'GODMODE: your creatures take no damage / normal', run: function () {
    CC.dev.god = !CC.dev.god; return 'God mode ' + (CC.dev.god ? 'ON.' : 'OFF.');
  } },
  { words: ['FLY'], needsGame: true, help: 'FLY: get the Wooden Whistle (Fly) and open every place on the map', run: function () {
    CC.state.flags.fly = true; CC.state.flags.flyAll = true;
    return 'You can Fly anywhere! Press R (or MENU > Fly) on the map.';
  } },
  { words: ['ZOOKEEPER'], needsGame: true, help: 'ZOOKEEPER: one of every creature goes into your Vault (Lv 5)', run: function () {
    CC.CREATURE_ORDER.forEach(function (id) { CC.state.vault.push(CC.mon.make(id, 5)); CC.markCaught(id); });
    return 'The Vault now holds one of all ' + CC.CREATURE_ORDER.length + ' creatures.';
  } },
  { words: ['CUBES'], needsGame: true, help: 'CUBES 50: set your Basic Cubes', run: function (a) { CC.state.bag.cube = num(a[0], 0, 999, 99); return 'Cubes: ' + CC.state.bag.cube + '.'; } },
  { words: ['POTIONS'], needsGame: true, help: 'POTIONS 20: set your Potions', run: function (a) { CC.state.bag.potion = num(a[0], 0, 999, 99); return 'Potions: ' + CC.state.bag.potion + '.'; } },
  { words: ['COINS'], needsGame: true, help: 'COINS 5000: set your coins', run: function (a) { CC.state.coins = num(a[0], 0, 999999, 9999); return 'Coins: ' + CC.state.coins + '.'; } },
  { words: ['GOTO', 'WARP'], needsGame: true, help: 'GOTO FOREST (VILLAGE, MEADOW, GRASSLAND, WATER, CAVE, DESERT, SNOW, SWAMP, RUINS, SPIRE), optional X Y', run: function (a) {
    var map = MAPS_BY_WORD[(a[0] || '').toLowerCase()]; if (!map) return 'Try GOTO FOREST, or any region name.';
    var p = ARRIVE[map], x = num(a[1], 0, 99, p[0]), y = num(a[2], 0, 99, p[1]);
    CC.dev.queue = function () { CC.world.enter(map, x, y, 'down'); };
    return 'Off to ' + CC.MAPS[map].name + '.';
  } },
  { words: ['WILD'], needsGame: true, help: 'WILD DANDYLION 6: battle a wild creature right now', run: function (a) {
    var id = creatureId(a[0]); if (!id) return 'No creature called "' + (a[0] || '') + '".';
    if (CC.firstHealthy() < 0) return 'You need a creature that can fight.';
    var lv = num(a[1], 1, 50, 5);
    CC.dev.queue = function () { return CC.fight({ wild: CC.mon.make(id, lv) }); };
    return 'A wild ' + CC.CREATURES[id].name + ' is coming...';
  } },
  { words: ['TRIAL', 'TRIALS'], needsGame: true, help: 'TRIAL DONE (Bramble), TRIAL CAVE (every trial up to that region), TRIAL ALL, or TRIAL RESET', run: function (a) {
    var w = (a[0] || 'done').toLowerCase();
    if (w === 'reset') { setTrials(TRIALS.length - 1, false); return 'Every trial reset.'; }
    var upTo = w === 'done' ? 0 : w === 'all' ? TRIALS.length - 1 : TRIALS.findIndex(function (t) { return t[0] === MAPS_BY_WORD[w]; });
    if (upTo < 0) return 'Try TRIAL DONE, TRIAL FOREST or TRIAL ALL.';
    setTrials(upTo, true);
    return 'Trials passed up to the ' + CC.MAPS[TRIALS[upTo][0]].name + '. Gates open' + (CC.state.flags.fly ? ', Fly unlocked.' : '.');
  } },
  { words: ['FINALE', 'MOON'], needsGame: true, help: 'FINALE: pass every trial and rival battle, then stand before the Moon Altar', run: function () {
    setTrials(TRIALS.length - 1, true);
    [2, 3, 4, 5].forEach(function (n) { CC.state.flags['juniper' + n] = true; });
    CC.dev.queue = function () { CC.world.enter('ruins', 12, 6, 'up'); };
    return 'Off to the Moon Altar. Walk up the steps.';
  } },
  { words: ['ENDING', 'POSTGAME'], needsGame: true, help: 'ENDING: the moon is restored and the Moonlit Spire opens', run: function () {
    setTrials(TRIALS.length - 1, true);
    [2, 3, 4, 5].forEach(function (n) { CC.state.flags['juniper' + n] = true; });
    CC.state.flags.moonRestored = true; if (!CC.state.caught.lunarion) CC.state.flags.lunarionSpire = true;
    return 'The moon is whole again. GOTO SPIRE to climb the tower.';
  } },
  { words: ['DEX', 'LOG'], needsGame: true, help: 'DEX: mark every creature as seen', run: function () {
    CC.CREATURE_ORDER.forEach(function (id) { CC.state.seen[id] = 1; }); return 'All ' + CC.CREATURE_ORDER.length + ' creatures marked seen.';
  } },
  { words: ['NOWILD'], help: 'NOWILD: turn tall-grass encounters off / on', run: function () { CC.dev.noWild = !CC.dev.noWild; return 'Wild encounters ' + (CC.dev.noWild ? 'OFF.' : 'ON.'); } },
  { words: ['CATCHALL'], help: 'CATCHALL: every cube catches / normal catching', run: function () { CC.dev.catchAll = !CC.dev.catchAll; return 'Sure catches ' + (CC.dev.catchAll ? 'ON.' : 'OFF.'); } },
  { words: ['ONEHIT'], help: 'ONEHIT: your attacks knock out in one hit / normal', run: function () { CC.dev.oneHit = !CC.dev.oneHit; return 'One-hit knockouts ' + (CC.dev.oneHit ? 'ON.' : 'OFF.'); } },
  { words: ['FAST', 'SPEED'], help: 'FAST: the whole game runs 2x / normal (SPEED 3 for 3x)', run: function (a) {
    var n = num(a[0], 1, 4, null); CC.dev.speed = n || (CC.dev.speed > 1 ? 1 : 2); return 'Game speed x' + CC.dev.speed + '.';
  } },
  { words: ['ZOO', 'GALLERY'], help: 'ZOO: look at every creature sprite (art or stand-in)', run: function () {
    CC.dev.queue = function () { return CC.zoo(); }; return 'Opening the zoo...';
  } },
  { words: ['DEV', 'STATUS'], help: 'DEV: show which codes are on', run: function () {
    return 'Wild ' + (CC.dev.noWild ? 'off' : 'on') + ', sure catch ' + (CC.dev.catchAll ? 'on' : 'off') + ', one-hit ' + (CC.dev.oneHit ? 'on' : 'off') +
      ', god ' + (CC.dev.god ? 'on' : 'off') + ', bottomless bag ' + (CC.dev.infItems ? 'on' : 'off') + ', speed x' + CC.dev.speed + '.' +
      (CC.dev.pending.length ? '\nWaiting for a game: ' + CC.dev.pending.join('; ') : '');
  } },
];

// runs one line of codes and returns the messages
CC.runCodes = function (text) {
  var out = [];
  String(text).split(/[;\n]+/).forEach(function (line) {
    var words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    var w = words[0].toUpperCase(), code = CC.CODES.find(function (c) { return c.words.indexOf(w) >= 0; });
    if (!code) { out.push('"' + line.trim() + '": no such code. Type HELP.'); return; }
    if (code.needsGame && !CC.state) { CC.dev.pending.push(line.trim()); out.push(line.trim().toUpperCase() + ': will happen when your game starts.'); return; }
    try { out.push(code.run(words.slice(1))); } catch (e) { out.push(w + ' failed: ' + e.message); }
  });
  return out.join('\n');
};
// codes typed at the title, once a game is running
CC.applyPendingCodes = async function () {
  if (!CC.dev.pending.length) return;
  var lines = CC.dev.pending.splice(0);
  CC.runCodes(lines.join(';'));
  if (CC.dev.queue) { var q = CC.dev.queue; CC.dev.queue = null; await q(); }
};

// the code box: a real text field over the game. Resolves when it closes.
CC.openCodes = function () {
  return new Promise(function (resolve) {
    var box = document.getElementById('codes'), input = document.getElementById('codeInput'), out = document.getElementById('codeOut');
    var go = document.getElementById('codeGo'), close = document.getElementById('codeClose');
    var blocker = { name: 'codes', update: function () {}, draw: function () {} };
    CC.push(blocker);
    box.classList.add('open'); out.textContent = 'Type a code (HELP lists them all). Codes can be pasted, split by ";".';
    input.value = ''; setTimeout(function () { input.focus(); }, 30);
    function submit() {
      var t = input.value.trim(); if (!t) return;
      out.textContent = CC.runCodes(t); input.value = ''; CC.sfx('select');
      if (CC.dev.queue) finish(); // codes that do something on screen close the box
    }
    function finish() {
      box.classList.remove('open'); input.blur();
      go.onclick = close.onclick = input.onkeydown = null;
      for (var k in CC.input.held) CC.input.held[k] = false;
      CC.pop(blocker); resolve();
    }
    go.onclick = submit; close.onclick = finish;
    input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') finish(); };
  });
};
// after the box closes from the field menu, run whatever a code asked for (a battle, a warp...)
CC.runCodeQueue = async function () {
  if (!CC.dev.queue) return false;
  var q = CC.dev.queue; CC.dev.queue = null;
  await q();
  return true;
};

// ZOO: every creature, 6 to a page. Left / right for pages, B to leave.
CC.zoo = function () {
  return new Promise(function (resolve) {
    var page = 0, per = 6, pages = Math.ceil(CC.CREATURE_ORDER.length / per);
    var scr = {
      name: 'zoo', opaque: true,
      update: function () {
        if (CC.repeat('right')) { page = (page + 1) % pages; CC.sfx('blip'); }
        if (CC.repeat('left')) { page = (page + pages - 1) % pages; CC.sfx('blip'); }
        if (CC.input.pressed.b || CC.input.pressed.a) { CC.sfx('back'); CC.pop(scr); resolve(); }
      },
      draw: function () {
        CC.rect(0, 0, 240, 160, '#2a3a5a');
        CC.text('Zoo ' + (page + 1) + '/' + pages + '  left / right, B to leave.  Pink name = no art yet', 6, 3, '#ffffff', { size: 9, shadow: '#000' });
        CC.CREATURE_ORDER.slice(page * per, page * per + per).forEach(function (id, i) {
          var x = 40 + (i % 3) * 80, y = 64 + Math.floor(i / 3) * 70, c = CC.CREATURES[id], hasArt = !!CC.img('creatures/' + id);
          CC.g.fillStyle = 'rgba(255,255,255,0.08)'; CC.g.beginPath(); CC.g.ellipse(x, y - 2, 24, 5, 0, 0, Math.PI * 2); CC.g.fill();
          CC.drawSprite(CC.creatureSprite(id), x, y - 2, { scale: 0.8, sy: 1 + Math.sin(CC.time * 2.6 + i) * 0.03, id: id });
          CC.text(c.name, x, y + 1, hasArt ? '#ffffff' : '#f0b0a0', { size: 9, align: 'center', shadow: '#000' });
          CC.text(c.types.join(' / '), x, y + 10, '#b8c8e8', { size: 8, align: 'center', shadow: '#000' });
        });
      },
    };
    CC.push(scr);
  });
};
