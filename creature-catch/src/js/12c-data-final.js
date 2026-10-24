// The final creatures (docs/creature-catch-lore-bible.md): a new form for 38 families picked in the Evolution Lab,
// Crescub (Moonlynx's baby form), and Clove Tastical and Hoppin Pop, the family's new evolutions for the Meadow Path.
// (The family's ice cream pup is in 13b-family-creatures.js.)
// Rows: [id, name, types, grows from, at (a level, or 'moonshard'), signature (left out: its family's)]
// Nobody's creature gets weaker: a creature that gains a form keeps the stats it has. A new second form gets the usual
// evolved budget (1.6 times a first form's), and a new third form a third more than the form before it, at most 450 like
// the other three-form families.
var CC = window.CC || (window.CC = {});

(function () {
  var ROWS = [
    // Meadow Path
    ['clovetastical', 'Clove Tastical', ['Plant', 'Normal'], 'clovermouse', 18, 'luckyleaf'],
    ['hoppinpop', 'Hoppin Pop', ['Plant'], 'hopsprout', 20, 'fantastichop'],
    ['tempestram', 'Tempestram', ['Normal', 'Bolt'], 'cloudram', 36],
    // Grassland
    ['queenbuzz', 'Queenbuzz', ['Bolt', 'Plant'], 'bumblazer', 36],
    ['sylvantail', 'Sylvantail', ['Plant', 'Lumen'], 'verdantail', 34],
    ['typhoonewt', 'Typhoonewt', ['Water', 'Bolt'], 'monsoonewt', 36],
    ['cragmastiff', 'Cragmastiff', ['Earth', 'Normal'], 'boulderhound', 34],
    // Willowbrook Orchard
    ['scarecrown', 'Scarecrown', ['Shadow', 'Plant'], 'scarecrowl', 22],
    // Forest and Whispering Grove
    ['bloomstag', 'Bloomstag', ['Plant', 'Lumen'], 'budstag', 24],
    ['mushroyal', 'Mushroyal', ['Shadow', 'Plant'], 'mushling', 20],
    ['burrboar', 'Burrboar', ['Plant', 'Earth'], 'burrhog', 22],
    ['timberbeetle', 'Timberbeetle', ['Earth', 'Plant'], 'barkbeetle', 22],
    ['oakenowl', 'Oakenowl', ['Plant', 'Normal'], 'timberowl', 40],
    ['elderkin', 'Elderkin', ['Plant', 'Lumen'], 'grovekin', 40],
    // Lakeshore, Driftwood Cove and Lantern Isle
    ['pufferoar', 'Pufferoar', ['Water'], 'tidepuff', 24],
    ['beaconseal', 'Beaconseal', ['Lumen', 'Water'], 'sealamp', 26],
    ['leviafin', 'Leviafin', ['Water'], 'surgefin', 34],
    ['paladcrab', 'Paladcrab', ['Water', 'Earth'], 'rampacrab', 36],
    ['gooseidon', 'Gooseidon', ['Normal', 'Water'], 'honkwave', 24],
    ['shellcastle', 'Shellcastle', ['Water', 'Earth'], 'conchord', 38],
    ['constellastar', 'Constellastar', ['Water', 'Lumen'], 'glimstar', 'moonshard'],
    ['puffadmiral', 'Puffadmiral', ['Water', 'Frost'], 'puffcaptain', 40],
    // Crystal Cave, Copperbell Town and Glimmer Mine
    ['gemonitor', 'Gemonitor', ['Earth', 'Lumen'], 'gemlin', 28],
    ['stalagwing', 'Stalagwing', ['Shadow', 'Earth'], 'stalagbat', 28],
    ['rimedrake', 'Rimedrake', ['Frost'], 'rimeskink', 28],
    ['tunnelpede', 'Tunnelpede', ['Earth'], 'rumblepede', 30],
    ['scrapcoon', 'Scrapcoon', ['Normal', 'Earth'], 'rustcoon', 28],
    ['bellcondor', 'Bellcondor', ['Normal', 'Bolt'], 'dingdove', 28],
    ['drillotl', 'Drillotl', ['Water', 'Earth'], 'pickaxolotl', 32],
    // Sunscorch Desert
    ['sunfennec', 'Sunfennec', ['Fire', 'Lumen'], 'dunefox', 30],
    ['saguaroad', 'Saguaroad', ['Plant', 'Earth'], 'cactoad', 30],
    ['furnadillo', 'Furnadillo', ['Fire', 'Earth'], 'kilnadillo', 30],
    // Frostpeak Pass
    ['yetitan', 'Yetitan', ['Frost', 'Earth'], 'yetiny', 32],
    ['iglooshell', 'Iglooshell', ['Frost', 'Earth'], 'sleetle', 32],
    // Murkmire Swamp and Firefly Bayou
    ['lilyswan', 'Lilyswan', ['Water', 'Plant'], 'lilypadle', 34],
    ['lanternfly', 'Lanternfly', ['Fire', 'Bolt'], 'fireflink', 36],
    ['stormeel', 'Stormeel', ['Bolt', 'Water'], 'wispeel', 36],
    ['mirelich', 'Mirelich', ['Shadow', 'Plant'], 'mireling', 36],
    ['bogtusk', 'Bogtusk', ['Earth', 'Normal'], 'mudtusk', 38],
    // Night Ruins
    ['runescroll', 'Runescroll', ['Lumen'], 'glyphling', 40],
  ];
  var C = CC.CREATURES;
  function add(id, name, types, f, total, sig) {
    var w = CC.PROFILES[f.profile], stats = w.map(function (x) { return Math.round(total / 4 * x); });
    C[id] = {
      id: id, name: name, types: types, region: f.region, kind: 'final', profile: f.profile, sig: sig, evo: null, look: f.look,
      base: { hp: stats[0], atk: stats[1], def: stats[2], spd: stats[3] }, total: total,
      learn: learnset(types, f.profile, sig, 'final'), xpYield: Math.round(total / 4),
    };
    CC.CREATURE_ORDER.push(id);
  }
  ROWS.forEach(function (row) {
    var f = C[row[3]], third = !!f.from;
    add(row[0], row[1], row[2], f, third ? Math.min(450, Math.round(f.total * 4 / 3)) : Math.round((170 + 10 * f.region) * 1.6), row[5] || f.sig);
    f.evo = { into: row[0], at: row[4] }; f.kind = third ? 'mid' : 'base';
    C[row[0]].from = row[3];
  });

  // Crescub, a lynx kitten that grows into Moonlynx at Lv 30. It takes Moonlynx's place in the Night Ruins, where
  // Moonlynx now shows up by level (a wild creature past its evolution level is met evolved).
  var lynx = C.moonlynx;
  add('crescub', 'Crescub', ['Lumen'], lynx, 240, lynx.sig);
  C.crescub.kind = 'base'; C.crescub.evo = { into: 'moonlynx', at: 30 };
  lynx.from = 'crescub'; lynx.kind = 'final';
  CC.SPAWNS.ruins.rare = CC.SPAWNS.ruins.rare.map(function (id) { return id === 'moonlynx' ? 'crescub' : id; });
  CC.RARITY.crescub = 'rare';
})();
