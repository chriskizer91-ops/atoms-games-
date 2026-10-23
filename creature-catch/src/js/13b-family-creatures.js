// YOUR OWN CREATURES
// Add a creature by copying the example block below into the list, filling it in, and taking out the // marks.
// Everything else is worked out for you: stats, the moves it learns, where it lives in the wild, its number in the
// Creature Log, and its page in the Field Guide. The how-to (with the prompts that turn a drawing into game art) is
// docs/creature-catch-new-creatures.md.
//
//   {
//     name: 'Sparkpup',              its name. Its picture is art/creatures/sparkpup.png (the name in lower case)
//     types: ['Bolt'],               one or two of: Normal Fire Water Plant Earth Bolt Frost Shadow Lumen
//     lives: 'forest',               where it's found: meadow grassland forest water cave desert snow swamp ruins spire,
//                                    or a new place: orchard grove cove isle copperbell mine springs bayou archive temple hollow,
//                                    or 'anywhere' for a Moonborn (it can turn up in any tall grass, now and then)
//                                    (leave it out for an evolved form, or use 'nowhere' for one you can only get by GIVE)
//     keeper: 'orchard',             optional, instead of lives: it's the Keeper of that place, one of a kind, waiting at
//                                    the place's landmark: orchard grove cove isle mine springs bayou archive
//     rarity: 'common',              common, uncommon or rare
//     evolvesInto: 'Sparkhound',     optional: the name of what it grows into (add that one as its own block)
//     evolvesAt: 20,                 the level it evolves at, or 'sunshard' or 'moonshard'
//     style: 'fast',                 optional: bal (even), tank, wall, bulk, atk (hits hard), fast, glass (fast and frail)
//     move: { name: 'Zap Bark', type: 'Bolt', power: 70 },   optional: its own special move (power 40 to 100)
//     lore: 'A puppy whose fur crackles when it is happy.',  a sentence or two for the Creature Log
//     drawnBy: 'Sam',                who drew it (it shows in the Creature Log and the Field Guide)
//   },
var CC = window.CC || (window.CC = {});

CC.FAMILY_CREATURES = [
  // your creatures go here
];

// ---------- how the blocks above become real creatures (no need to change anything below) ----------
(function () {
  var list = CC.FAMILY_CREATURES || [];
  if (!list.length) return;
  var PLACE = { meadow: 1, grassland: 2, forest: 3, water: 4, cave: 5, desert: 6, snow: 7, swamp: 8, ruins: 9, spire: 9,
    orchard: 2, grove: 3, cove: 4, isle: 5, copperbell: 5, mine: 6, springs: 7, bayou: 8, archive: 9, temple: 10, hollow: 10, anywhere: 5 };
  // the Keepers' places: the landmark they wait at, and their level (the place's top wild level plus 6)
  var KEEPER_LEVEL = { orchard: 14, grove: 18, cove: 20, isle: 24, mine: 28, springs: 32, bayou: 36, archive: 40 };
  CC.KEEPER_CREATURES = {}; CC.MOONBORN = [];
  var STYLE_FOR = { Normal: 'bal', Fire: 'atk', Water: 'bal', Plant: 'tank', Earth: 'bulk', Bolt: 'fast', Frost: 'wall', Shadow: 'glass', Lumen: 'fast' };
  var BODIES = ['quad', 'round', 'bird', 'fish', 'bug', 'serpent', 'biped', 'ghost', 'turtle', 'frog'];
  var idOf = function (name) { return String(name).toLowerCase().replace(/[^a-z0-9]/g, ''); };
  var warn = function (msg) { if (typeof console !== 'undefined') console.warn('Family creature: ' + msg); };
  var hash = function (s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; };

  // first, every name, so evolutions can point forward or backward in the list
  var byId = {};
  list.forEach(function (c) {
    var id = idOf(c.name);
    if (!id) { warn('a block has no name'); return; }
    if (CC.CREATURES[id] || byId[id]) { warn('"' + c.name + '" is already taken; give it another name'); return; }
    byId[id] = c; c.id = id;
  });
  var into = {}, from = {};
  Object.keys(byId).forEach(function (id) {
    var c = byId[id];
    if (!c.evolvesInto) return;
    var to = idOf(c.evolvesInto);
    if (!byId[to] && !CC.CREATURES[to]) { warn(c.name + ' evolves into "' + c.evolvesInto + '", but there is no block for it'); return; }
    into[id] = to; from[to] = id;
  });
  // the first form of a line decides where the line lives
  var root = function (id) { while (from[id]) id = from[id]; return id; };
  var stage = function (id) { var n = 0; while (from[id]) { id = from[id]; n++; } return n; };
  var depth = function (id) { var n = 1; while (into[id]) { id = into[id]; n++; } return n; };

  Object.keys(byId).forEach(function (id) {
    var c = byId[id], first = byId[root(id)], r = PLACE[first.keeper || first.lives] || 5, st = stage(id), len = st + depth(id);
    var types = (c.types || ['Normal']).filter(function (t) { if (!CC.TYPE_COLORS[t]) { warn(c.name + ' has an unknown type "' + t + '"'); return false; } return true; }).slice(0, 2);
    if (!types.length) types = ['Normal'];
    var kind = len === 1 ? 'solo' : st === 0 ? 'base' : !into[id] ? 'final' : 'mid';
    // stats: the same budgets as the rest of the game (a 3-stage line grows like the vampire line)
    var base = 170 + 10 * r, total = kind === 'solo' ? 195 + 16 * r : kind === 'base' ? base
      : len >= 3 ? Math.round(base * (kind === 'mid' ? 1.42 : 1.875)) : Math.round(base * 1.6);
    if (first.keeper) total = st === 0 ? 430 : 460; // a Keeper: between a final evolution (about 400) and a legendary (500)
    var style = CC.PROFILES[c.style] ? c.style : STYLE_FOR[types[0]];
    var w = CC.PROFILES[style], stats = w.map(function (x) { return Math.round(total / 4 * x); });
    // its special move: its own, or a strong move of its type
    var sig = CC.TYPE_MOVES[types[0]][1];
    if (c.move && c.move.name) {
      sig = 'fam' + id;
      var mt = CC.TYPE_COLORS[c.move.type] ? c.move.type : types[0];
      CC.MOVES[sig] = { name: c.move.name, type: mt, tier: 'sig', power: Math.max(40, Math.min(100, +c.move.power || 70)), acc: 95, pp: 15 };
    } else { // an evolved form keeps the special move of the form before it
      for (var up = from[id]; up; up = from[up]) if (byId[up] && byId[up].move && byId[up].move.name) { sig = 'fam' + up; break; }
    }
    var colors = CC.TYPE_COLORS[types[0]], accent = CC.TYPE_COLORS[types[1] || types[0]];
    var evo = into[id] ? { into: into[id], at: c.evolvesAt === 'sunshard' || c.evolvesAt === 'moonshard' ? c.evolvesAt : Math.max(2, +c.evolvesAt || 20) } : null;
    CC.CREATURES[id] = {
      id: id, name: c.name, types: types, region: r, kind: kind, profile: style, sig: sig, evo: evo, family: true, drawnBy: c.drawnBy,
      moonborn: first.lives === 'anywhere' || undefined, keeper: first.keeper || undefined, home: first.keeper || (first.lives !== 'anywhere' && first.lives !== 'nowhere' ? first.lives : undefined),
      look: { body: BODIES[hash(id) % BODIES.length], main: colors[1], accent: accent[0] },
      base: { hp: stats[0], atk: stats[1], def: stats[2], spd: stats[3] }, total: total,
      learn: learnset(types, style, sig, kind), xpYield: Math.round(total / 4),
    };
    CC.CREATURE_ORDER.push(id);
  });
  Object.keys(into).forEach(function (id) { if (CC.CREATURES[into[id]]) CC.CREATURES[into[id]].from = id; });

  // the wild: first forms (and creatures with no evolution) join their place's spawn list
  Object.keys(byId).forEach(function (id) {
    var c = byId[id];
    if (c.keeper && !from[id]) {
      if (!KEEPER_LEVEL[c.keeper]) { warn(c.name + ' is the Keeper of "' + c.keeper + '", which has no Keeper spot'); return; }
      CC.KEEPER_CREATURES[c.keeper] = { id: id, level: KEEPER_LEVEL[c.keeper] }; CC.RARITY[id] = 'veryrare'; return;
    }
    if (from[id] || !c.lives || c.lives === 'nowhere') return;
    if (c.lives === 'anywhere') { CC.MOONBORN.push(id); CC.RARITY[id] = c.rarity === 'rare' ? 'rare' : 'uncommon'; return; }
    var tier = { common: 1, uncommon: 1, rare: 1 }[c.rarity] ? c.rarity : 'common';
    var sp = CC.SPAWNS[c.lives];
    if (!sp) { warn(c.name + ' lives in "' + c.lives + '", which isn\'t a place'); return; }
    sp[tier].push(id); CC.RARITY[id] = tier;
  });
  // lore for the Creature Log and the Field Guide
  Object.keys(byId).forEach(function (id) {
    var c = byId[id], first = byId[root(id)], place = function (k) { return (CC.SPAWNS[k] || { name: k }).name; };
    var where = from[id] ? 'Evolves from ' + byId[from[id]].name + '.' : first.keeper ? 'The Keeper of ' + place(first.keeper) + '. It waits at the landmark there.'
      : first.lives === 'anywhere' ? 'Moonborn: dreamed up under the full moon, it can turn up in any tall grass.' : first.lives && first.lives !== 'nowhere' ? 'Lives in the ' + place(first.lives) + '.' : '';
    CC.LORE[id] = { lore: c.lore || c.name + ' is a brand-new creature. Nobody knows much about it yet!', note: (c.drawnBy ? 'Drawn by ' + c.drawnBy + '. ' : '') + where };
  });
})();
