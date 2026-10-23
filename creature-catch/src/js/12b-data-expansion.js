// The expansion's wild creatures (docs/creature-catch-expansion-guide.md, section 6): new creatures in the old places,
// and the spawns of every new place. time: { id: 'day' | 'night' } says when a creature comes out (dusk counts as night).
var CC = window.CC || (window.CC = {});

(function () {
  // the expansion's creatures in the old places (6.1), and every new place's spawns (6.2)
  var ADD = {
    meadow: { uncommon: ['puffmunk'], rare: ['fleecling'], time: { puffmunk: 'day', fleecling: 'day' } },
    grassland: { uncommon: ['dewt'], time: { dewt: 'day' } },
    forest: { uncommon: ['burrhog'] },
    water: { common: ['splotter', 'honkwave'], time: { splotter: 'day', honkwave: 'day' } },
    cave: { uncommon: ['rimeskink'], rare: ['shardling'], time: { shardling: 'night' } },
    desert: { uncommon: ['kilnadillo', 'mirajack'], time: { kilnadillo: 'day', mirajack: 'day' } },
    snow: { common: ['flurrpaca'], rare: ['aurorelly'], time: { aurorelly: 'night' } },
    swamp: { common: ['fireflink'], uncommon: ['snaptrap'], time: { fireflink: 'night' } },
    ruins: { uncommon: ['glyphling'], rare: ['mimicube'], time: { glyphling: 'night' } },
    spire: { uncommon: ['twinkit'], rare: ['comette'], time: { twinkit: 'night', comette: 'night' } },
  };
  Object.keys(ADD).forEach(function (k) {
    var sp = CC.SPAWNS[k] || (CC.SPAWNS[k] = { common: [], uncommon: [], rare: [] }), a = ADD[k]; // the Spire's list is filled in later (14-regions.js)
    ['common', 'uncommon', 'rare'].forEach(function (t) { (a[t] || []).forEach(function (id) { sp[t].push(id); }); });
    sp.time = Object.assign(sp.time || {}, a.time || {});
  });
  var PLACES = {
    orchard: { name: 'Willowbrook Orchard', levels: [5, 8], common: ['wormapple', 'puffmunk'], uncommon: ['scarecrowl', 'bumblop'], rare: ['dandylion'], time: { wormapple: 'day', scarecrowl: 'night' } },
    grove: { name: 'Whispering Grove', levels: [8, 12], common: ['sprigkin'], uncommon: ['owlcorn', 'mothlight'], rare: ['snoozeloth', 'budstag'], time: { mothlight: 'night' } },
    cove: { name: 'Driftwood Cove', levels: [10, 14], common: ['shellbit', 'splotter', 'crabbit'], uncommon: ['glimstar', 'tidepuff'], rare: [], time: { glimstar: 'night' } },
    isle: { name: 'Lantern Isle', levels: [14, 18], common: ['puffling', 'bubblefin'], uncommon: ['sealamp'], rare: ['krakling', 'koiling'], time: { krakling: 'night' } },
    copperbell: { name: 'Copperbell Town', levels: [15, 19], common: ['rustcoon'], uncommon: ['dingdove'], rare: [], time: { rustcoon: 'night', dingdove: 'day' } },
    mine: { name: 'Glimmer Mine', levels: [18, 24], common: ['glimmole', 'rumblepede'], uncommon: ['coalcub', 'pickaxolotl'], rare: ['shardling'], time: { shardling: 'night' } },
    springs: { name: 'Steamvent Springs', levels: [22, 28], common: ['steamacaque', 'flurrpaca'], uncommon: ['sleetle'], rare: ['mittencub', 'yetiny'] },
    bayou: { name: 'Firefly Bayou', levels: [27, 32], common: ['fireflink', 'mudtusk'], uncommon: ['lotusprite', 'snaptrap', 'wispeel'], rare: [], time: { fireflink: 'night', lotusprite: 'night' } },
    archive: { name: 'Ancients\' Archive', levels: [31, 36], common: ['glyphling'], uncommon: ['inkwing', 'pebbleton'], rare: ['mimicube', 'clocktoise'], time: { inkwing: 'night' } },
    temple: { name: 'Dawn Temple', levels: [40, 45], common: ['sphinxie'], uncommon: ['kilnadillo', 'mirajack'], rare: ['mummoth'] },
    hollow: { name: 'Hollow Deep', levels: [42, 48], common: ['echoling', 'stalagbat'], uncommon: ['shardling'], rare: ['umbramoth'] },
  };
  Object.keys(PLACES).forEach(function (k) { CC.SPAWNS[k] = PLACES[k]; });
  // catch rarity for every wild creature that doesn't have one yet
  Object.keys(CC.SPAWNS).forEach(function (k) {
    ['common', 'uncommon', 'rare'].forEach(function (t) { CC.SPAWNS[k][t].forEach(function (id) { if (!CC.RARITY[id]) CC.RARITY[id] = t; }); });
  });
  ['solarion', 'gloaming', 'groggysolarion', 'hidinggloaming'].forEach(function (id) { CC.RARITY[id] = 'veryrare'; });
  CC.PLACE_NAMES = Object.assign({ spire: 'Moonlit Spire' }, Object.keys(PLACES).reduce(function (o, k) { o[k] = PLACES[k].name; return o; }, {}));
})();
