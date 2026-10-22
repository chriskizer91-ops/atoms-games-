// Every creature: rows below, stats and learnsets built from the rules underneath them.
// The readable table is docs/creature-catch-roster.md (node tools/roster-doc.mjs).
var CC = window.CC || (window.CC = {});

// Regions in order. r = index used for the stat budget.
CC.REGIONS = ['Home Village', 'Meadow Path', 'Grassland', 'Forest', 'Water', 'Cave', 'Desert', 'Snow', 'Swamp', 'Night Ruins'];

// Stat shapes, weights for HP / Attack / Defense / Speed (each row sums to 4)
CC.PROFILES = {
  bal: [1, 1, 1, 1],
  tank: [1.15, 0.85, 1.35, 0.65],
  wall: [1.4, 0.7, 1.2, 0.7],
  bulk: [1.3, 1.05, 1.0, 0.65],
  atk: [0.95, 1.3, 0.85, 0.9],
  fast: [0.85, 1.05, 0.8, 1.3],
  glass: [0.8, 1.2, 0.75, 1.25],
};

// id, name, types, region, kind, profile, signature, evolution, look
//   kind: 'starter1|2|3' (3-stage line), 'base' / 'final' (2-stage line), 'solo'
//   evolution: [into, level or 'sunshard' / 'moonshard']
//   look (placeholder art until the sprite arrives): [body, main color, accent color]
//     bodies: quad, round, bird, fish, bug, serpent, biped, ghost, turtle, frog
var ROWS = [
  ['drizzlon', 'Drizzlon', ['Water'], 0, 'starter1', 'bal', 'drizzledart', ['rapidrake', 14], ['quad', '#4f8ee0', '#5fd0c8']],
  ['rapidrake', 'Rapidrake', ['Water'], 0, 'starter2', 'fast', 'drizzledart', ['tsunadrake', 30], ['quad', '#3a74d0', '#e8f4ff']],
  ['tsunadrake', 'Tsunadrake', ['Water', 'Bolt'], 0, 'starter3', 'fast', 'drizzledart', null, ['quad', '#2a4fa8', '#f8d838']],
  ['mossback', 'Mossback', ['Plant'], 0, 'starter1', 'tank', 'mossmend', ['thornshell', 14], ['turtle', '#5aa848', '#f08ab8']],
  ['thornshell', 'Thornshell', ['Plant'], 0, 'starter2', 'tank', 'mossmend', ['elderoak', 30], ['turtle', '#3f8a3a', '#f08ab8']],
  ['elderoak', 'Elderoak', ['Plant', 'Earth'], 0, 'starter3', 'tank', 'mossmend', null, ['turtle', '#8a8478', '#4fb04a']],
  ['embroak', 'Embroak', ['Fire'], 0, 'starter1', 'atk', 'emberlash', ['cinderfrog', 14], ['frog', '#f0602c', '#f8d040']],
  ['cinderfrog', 'Cinderfrog', ['Fire'], 0, 'starter2', 'atk', 'emberlash', ['infernotoad', 30], ['frog', '#e04a22', '#ffb020']],
  ['infernotoad', 'Infernotoad', ['Fire', 'Earth'], 0, 'starter3', 'bulk', 'emberlash', null, ['frog', '#3a3434', '#ff7a1a']],

  ['clovermouse', 'Clovermouse', ['Normal'], 1, 'solo', 'fast', 'luckynibble', null, ['quad', '#a8a4a0', '#4fb04a']],
  ['hopsprout', 'Hopsprout', ['Normal'], 1, 'solo', 'glass', 'springkick', null, ['bug', '#a8e050', '#4f9a30']],

  ['tuftail', 'Tuftail', ['Plant'], 2, 'base', 'fast', 'grassswipe', ['verdantail', 18], ['quad', '#f08a3a', '#5fb84a']],
  ['verdantail', 'Verdantail', ['Plant'], 2, 'final', 'fast', 'grassswipe', null, ['quad', '#f07a2a', '#4fa83a']],
  ['bumblop', 'Bumblop', ['Bolt'], 2, 'base', 'bal', 'statichop', ['bumblazer', 20], ['round', '#f8d838', '#3a3020']],
  ['bumblazer', 'Bumblazer', ['Bolt'], 2, 'final', 'glass', 'statichop', null, ['round', '#f8c820', '#2a2418']],
  ['dandylion', 'Dandylion', ['Fire'], 2, 'base', 'atk', 'blazemane', ['sunmane', 'sunshard'], ['quad', '#f0c040', '#ffffff']],
  ['sunmane', 'Sunmane', ['Fire', 'Lumen'], 2, 'final', 'atk', 'blazemane', null, ['quad', '#f0a020', '#ffe070']],
  ['pebblepup', 'Pebblepup', ['Earth'], 2, 'base', 'bulk', 'rockfetch', ['boulderhound', 18], ['quad', '#9a8a78', '#6a6058']],
  ['boulderhound', 'Boulderhound', ['Earth'], 2, 'final', 'bulk', 'rockfetch', null, ['quad', '#8a7a68', '#5a5048']],

  ['owlcorn', 'Owlcorn', ['Plant'], 3, 'base', 'bal', 'acorndrop', ['timberowl', 22], ['bird', '#9a6a42', '#c89040']],
  ['timberowl', 'Timberowl', ['Plant'], 3, 'final', 'atk', 'acorndrop', null, ['bird', '#7a5232', '#5fa83a']],
  ['barkbeetle', 'Barkbeetle', ['Earth'], 3, 'solo', 'tank', 'hornshove', null, ['bug', '#7a5a3a', '#5fa83a']],
  ['mothlight', 'Mothlight', ['Lumen'], 3, 'base', 'fast', 'mothdust', ['radimoth', 'moonshard'], ['bug', '#f8eaa0', '#fff8d8']],
  ['radimoth', 'Radimoth', ['Lumen'], 3, 'final', 'fast', 'mothdust', null, ['bug', '#fff4c8', '#f0c040']],
  ['budstag', 'Budstag', ['Plant'], 3, 'solo', 'fast', 'bloomcharge', null, ['quad', '#a8784a', '#f08ab8']],
  ['mushling', 'Mushling', ['Shadow'], 3, 'solo', 'wall', 'mushroomhug', null, ['round', '#e04040', '#f8f0e0']],

  ['bubblefin', 'Bubblefin', ['Water'], 4, 'base', 'fast', 'bubbleburst', ['surgefin', 16], ['fish', '#8fd0ff', '#ffffff']],
  ['surgefin', 'Surgefin', ['Water'], 4, 'final', 'glass', 'bubbleburst', null, ['fish', '#2a5ab0', '#8fd0ff']],
  ['crabbit', 'Crabbit', ['Water'], 4, 'base', 'tank', 'hoppinch', ['rampacrab', 20], ['bug', '#e85a3a', '#f8b0c0']],
  ['rampacrab', 'Rampacrab', ['Water', 'Earth'], 4, 'final', 'tank', 'hoppinch', null, ['bug', '#c84a2a', '#9a8a78']],
  ['tidepuff', 'Tidepuff', ['Water'], 4, 'solo', 'wall', 'spinepuff', null, ['fish', '#a8d8f0', '#f8f0d0']],
  ['koiling', 'Koiling', ['Water'], 4, 'base', 'bal', 'currentclimb', ['koidrake', 24], ['fish', '#f8f4f0', '#f08a3a']],
  ['koidrake', 'Koidrake', ['Water', 'Lumen'], 4, 'final', 'bal', 'currentclimb', null, ['serpent', '#f8f4f0', '#f0c040']],
  ['sealamp', 'Sealamp', ['Lumen'], 4, 'solo', 'bulk', 'lurelight', null, ['round', '#8aa0b8', '#f8e050']],

  ['glimmole', 'Glimmole', ['Bolt'], 5, 'base', 'atk', 'sparkclaw', ['prismole', 22], ['quad', '#8a7aa0', '#5ae0f0']],
  ['prismole', 'Prismole', ['Bolt', 'Earth'], 5, 'final', 'atk', 'sparkclaw', null, ['quad', '#7a6a90', '#f8e050']],
  ['stalagbat', 'Stalagbat', ['Shadow'], 5, 'solo', 'glass', 'cavedive', null, ['bird', '#7a7a80', '#f8e050']],
  ['magmite', 'Magmite', ['Fire'], 5, 'base', 'tank', 'magmashell', ['volcaneetle', 26], ['bug', '#3a3434', '#ff7a1a']],
  ['volcaneetle', 'Volcaneetle', ['Fire'], 5, 'final', 'bulk', 'magmashell', null, ['bug', '#2a2424', '#ff6a10']],
  ['gemlin', 'Gemlin', ['Earth'], 5, 'solo', 'fast', 'gemglint', null, ['serpent', '#5fb84a', '#e84a4a']],
  ['rumblepede', 'Rumblepede', ['Earth'], 5, 'solo', 'tank', 'coilroll', null, ['serpent', '#8a8e98', '#f08a3a']],

  ['dunefox', 'Dunefox', ['Fire'], 6, 'solo', 'fast', 'miragedash', null, ['quad', '#e0c08a', '#f8f0d8']],
  ['cactoad', 'Cactoad', ['Plant'], 6, 'solo', 'wall', 'needlespray', null, ['frog', '#5aa848', '#f08ab8']],
  ['scarabolt', 'Scarabolt', ['Bolt'], 6, 'base', 'bal', 'scarabcharge', ['thundarab', 26], ['bug', '#3a5ab0', '#f0c040']],
  ['thundarab', 'Thundarab', ['Bolt', 'Fire'], 6, 'final', 'atk', 'scarabcharge', null, ['bug', '#2a4aa0', '#f8e050']],
  ['sandwyrm', 'Sandwyrm', ['Earth'], 6, 'base', 'bulk', 'sandtomb', ['duneserpent', 24], ['serpent', '#d8b880', '#a8784a']],
  ['duneserpent', 'Duneserpent', ['Earth'], 6, 'final', 'bulk', 'sandtomb', null, ['serpent', '#c8a870', '#8a6038']],

  ['frostoat', 'Frostoat', ['Frost'], 7, 'base', 'fast', 'icicletail', ['glacistoat', 24], ['serpent', '#f8f8f8', '#9adcf0']],
  ['glacistoat', 'Glacistoat', ['Frost'], 7, 'final', 'glass', 'icicletail', null, ['serpent', '#f0f8ff', '#5ab0e0']],
  ['pengloo', 'Pengloo', ['Frost'], 7, 'base', 'bulk', 'bellyslide', ['pengarch', 22], ['bird', '#2a3040', '#e83a3a']],
  ['pengarch', 'Pengarch', ['Frost', 'Water'], 7, 'final', 'bulk', 'bellyslide', null, ['bird', '#222838', '#f0c040']],
  ['yetiny', 'Yetiny', ['Frost'], 7, 'solo', 'bulk', 'snowballthrow', null, ['biped', '#e8f4ff', '#8ac0e0']],
  ['sleetle', 'Sleetle', ['Frost'], 7, 'solo', 'wall', 'shellfreeze', null, ['round', '#a8d8f0', '#e8f8ff']],

  ['lilypadle', 'Lilypadle', ['Water'], 8, 'solo', 'wall', 'lilyrest', null, ['bird', '#f8e050', '#4fb04a']],
  ['wispeel', 'Wispeel', ['Bolt'], 8, 'solo', 'glass', 'swampspark', null, ['serpent', '#2a5a3a', '#b46ae0']],
  ['mudgator', 'Mudgator', ['Earth'], 8, 'base', 'bulk', 'mudchomp', ['mudgatron', 28], ['serpent', '#6a7a3a', '#7a5a3a']],
  ['mudgatron', 'Mudgatron', ['Earth'], 8, 'final', 'bulk', 'mudchomp', null, ['serpent', '#5a6a2a', '#6a4a2a']],
  ['mireling', 'Mireling', ['Shadow'], 8, 'solo', 'bal', 'boggrasp', null, ['ghost', '#a8d0a0', '#f8e050']],

  ['wispkin', 'Wispkin', ['Lumen'], 9, 'base', 'bal', 'lanternglow', ['beaconwraith', 'moonshard'], ['ghost', '#2a3a6a', '#7ab8ff']],
  ['beaconwraith', 'Beaconwraith', ['Lumen', 'Shadow'], 9, 'final', 'bal', 'lanternglow', null, ['ghost', '#1e2850', '#d8ecff']],
  ['pebbleton', 'Pebbleton', ['Earth'], 9, 'solo', 'tank', 'runeslam', null, ['biped', '#8a8a90', '#4ae0c8']],
  ['bonecat', 'Bonecat', ['Shadow'], 9, 'base', 'fast', 'bonerattle', ['bonepanther', 30], ['quad', '#f0e8d0', '#b46ae0']],
  ['bonepanther', 'Bonepanther', ['Shadow'], 9, 'final', 'glass', 'bonerattle', null, ['quad', '#e8e0c8', '#8a3ad0']],
  ['fangling', 'Fangling', ['Shadow'], 9, 'base', 'fast', 'thornkiss', ['rosferatu', 32], ['bird', '#7a5a8a', '#c82a3a']],
  ['rosferatu', 'Rosferatu', ['Shadow', 'Plant'], 9, 'final', 'atk', 'thornkiss', null, ['biped', '#6a4a7a', '#c82a3a']],
  ['moonlynx', 'Moonlynx', ['Lumen'], 9, 'solo', 'fast', 'crescentclaw', null, ['quad', '#c8ccd8', '#f8e8a0']],
];

// Stat budget (base total). docs/creature-catch-decisions-2.md section 10.
function budget(kind, r, id) {
  if (kind === 'starter1') return 210;
  if (kind === 'starter2') return 330;
  if (kind === 'starter3') return 450;
  var base = id === 'fangling' || id === 'rosferatu' ? 250 : 170 + 10 * r;
  if (kind === 'base') return base;
  if (kind === 'final') return Math.round(base * 1.6);
  return 195 + 16 * r + (id === 'moonlynx' ? 20 : 0); // Solo
}

var BUFF = { bal: 'rally', atk: 'rally', fast: 'quickstep', glass: 'quickstep', tank: 'guardup', wall: 'guardup', bulk: 'guardup' };
var BUFF2 = { bal: 'guardup', atk: 'quickstep', fast: 'rally', glass: 'rally', tank: 'rally', wall: 'rally', bulk: 'rally' };

// Level-up moves: [level, move id]
function learnset(types, profile, sig, kind) {
  var t1 = types[0], t2 = types[1], m1 = CC.TYPE_MOVES[t1], out;
  if (t1 === 'Normal') {
    out = [[1, 'tackle'], [1, 'growl'], [4, BUFF[profile]], [9, sig], [14, BUFF2[profile]], [20, 'bodyslam'], [28, 'guardup']];
  } else {
    // starters open with Tackle and Growl, so the first rival fight (Lv 5) isn't decided by type
    var starter = kind.indexOf('starter') === 0;
    out = [[1, 'tackle'], starter ? [1, 'growl'] : [1, m1[0]], [4, BUFF[profile]], starter ? [6, m1[0]] : null, [8, m1[2]],
      [12, t2 ? CC.TYPE_MOVES[t2][0] : starter ? 'bodyslam' : 'growl'], [starter ? 11 : 16, sig], [20, m1[1]],
      [26, t2 ? CC.TYPE_MOVES[t2][1] : 'bodyslam'], [34, BUFF2[profile]]].filter(Boolean);
  }
  var seen = {};
  return out.filter(function (e) { if (seen[e[1]]) return false; seen[e[1]] = 1; return true; })
    .sort(function (a, b) { return a[0] - b[0]; });
}

CC.CREATURES = {};
CC.CREATURE_ORDER = [];
ROWS.forEach(function (row) {
  var id = row[0], kind = row[4], total = budget(kind, row[3], id), w = CC.PROFILES[row[5]];
  var stats = w.map(function (x) { return Math.round(total / 4 * x); });
  CC.CREATURES[id] = {
    id: id, name: row[1], types: row[2], region: row[3], kind: kind, profile: row[5], sig: row[6],
    evo: row[7] ? { into: row[7][0], at: row[7][1] } : null,
    look: { body: row[8][0], main: row[8][1], accent: row[8][2] },
    base: { hp: stats[0], atk: stats[1], def: stats[2], spd: stats[3] }, total: total,
    learn: learnset(row[2], row[5], row[6], kind),
    xpYield: Math.round(total / 4),
  };
  CC.CREATURE_ORDER.push(id);
});
// evolved forms point back at what they came from
CC.CREATURE_ORDER.forEach(function (id) {
  var c = CC.CREATURES[id];
  if (c.evo) CC.CREATURES[c.evo.into].from = id;
});

// Wild spawns. Rarity roll: Common 60, Uncommon 30, Rare 10 (a missing tier rolls again).
CC.SPAWNS = {
  meadow: { name: 'Meadow Path', levels: [2, 4], common: ['clovermouse', 'hopsprout'], uncommon: [], rare: [] },
  grassland: { name: 'Grassland', levels: [4, 7], common: ['tuftail', 'pebblepup'], uncommon: ['bumblop'], rare: ['dandylion'] },
  forest: { name: 'Forest', levels: [5, 10], common: ['barkbeetle', 'mushling'], uncommon: ['owlcorn', 'mothlight'], rare: ['budstag'] },
  water: { name: 'Water', levels: [8, 13], common: ['bubblefin', 'crabbit'], uncommon: ['tidepuff', 'sealamp'], rare: ['koiling'] },
  cave: { name: 'Cave', levels: [12, 18], common: ['glimmole', 'stalagbat'], uncommon: ['rumblepede', 'gemlin'], rare: ['magmite'] },
  desert: { name: 'Desert', levels: [16, 22], common: ['cactoad', 'sandwyrm'], uncommon: ['dunefox'], rare: ['scarabolt'] },
  snow: { name: 'Snow', levels: [20, 26], common: ['pengloo', 'sleetle'], uncommon: ['frostoat'], rare: ['yetiny'] },
  swamp: { name: 'Swamp', levels: [24, 30], common: ['lilypadle', 'mudgator'], uncommon: ['wispeel'], rare: ['mireling'] },
  ruins: { name: 'Night Ruins', levels: [28, 35], common: ['wispkin'], uncommon: ['pebbleton', 'bonecat', 'fangling'], rare: ['moonlynx'] },
};

// Catch rarity of each wild creature (Moonlynx spawns as Rare but catches as Very Rare)
CC.RARITY = {};
Object.keys(CC.SPAWNS).forEach(function (k) {
  ['common', 'uncommon', 'rare'].forEach(function (tier) {
    CC.SPAWNS[k][tier].forEach(function (id) { CC.RARITY[id] = tier; });
  });
});
CC.RARITY.moonlynx = 'veryrare';
