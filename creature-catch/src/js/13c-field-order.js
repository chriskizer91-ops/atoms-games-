// The field order: every creature numbered in the order you can meet it on the journey, place by place. The
// Creature Log and the Field Guide both count this way. A whole evolution line takes its numbers in the first place
// you can meet any of it, so a creature and its evolutions always sit side by side.
var CC = window.CC || (window.CC = {});

(function () {
  // the places in the order you reach them: the main road, with each side area right after the road it hangs off,
  // then the places after the story. spawns: the spawn lists that belong to a place (default: its own);
  // guardians: the legendary creatures met there
  var ZONES = [
    { key: 'village', name: 'Home Village', spawns: [] },
    { key: 'meadow' }, { key: 'grassland' }, { key: 'orchard' }, { key: 'forest' }, { key: 'grove' },
    { key: 'water' }, { key: 'cove', spawns: ['cove', 'tidepool'] }, { key: 'isle' },
    { key: 'cave' }, { key: 'copperbell' }, { key: 'mine' }, { key: 'desert' }, { key: 'snow' }, { key: 'springs' },
    { key: 'swamp' }, { key: 'bayou' }, { key: 'ruins', guardians: ['lunariond', 'lunarion'] }, { key: 'archive' },
    { key: 'spire', after: true }, { key: 'temple', after: true, guardians: ['groggysolarion', 'solarion'] },
    { key: 'hollow', after: true, guardians: ['hidinggloaming', 'gloaming'] },
  ];
  var C = CC.CREATURES, order = [], zoneOf = {};
  var root = function (id) { while (C[id].from) id = C[id].from; return id; };
  function addLine(id, zone) {
    if (!C[id]) return;
    for (id = root(id); id && C[id] && !zoneOf[id]; id = C[id].evo && C[id].evo.into) { zoneOf[id] = zone.key; order.push(id); zone.ids.push(id); }
  }
  ZONES.forEach(function (z) {
    z.ids = []; z.spawns = z.spawns || [z.key];
    if (!z.name) z.name = CC.SPAWNS[z.key].name;
    if (z.key === 'village') CC.CREATURE_ORDER.forEach(function (id) { if (C[id].kind === 'starter1') addLine(id, z); });
    z.spawns.forEach(function (k) {
      ['common', 'uncommon', 'rare'].forEach(function (t) { CC.SPAWNS[k][t].forEach(function (id) { addLine(id, z); }); });
    });
    (z.guardians || []).forEach(function (id) { addLine(id, z); });
    var keeper = (CC.KEEPER_CREATURES || {})[z.key]; // a family creature guarding this place (13b-family-creatures.js)
    if (keeper) addLine(keeper.id, z);
  });
  // the family's Moonborn turn up anywhere; anything else (like a creature you can only GIVE) goes last
  var extra = [{ key: 'anywhere', name: 'Moonborn', spawns: [], ids: [], list: CC.MOONBORN || [] }, { key: 'elsewhere', name: 'Elsewhere', spawns: [], ids: [], list: CC.CREATURE_ORDER }];
  extra.forEach(function (z) { z.list.forEach(function (id) { addLine(id, z); }); delete z.list; if (z.ids.length) ZONES.push(z); });
  CC.CREATURE_ORDER = order;
  CC.ZONES = ZONES;
  CC.ZONE_OF = zoneOf;
})();
