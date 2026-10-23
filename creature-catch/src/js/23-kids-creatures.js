// The kids' creatures in the expansion's lore (docs/creature-catch-expansion-guide.md, section 7): Keepers wait at
// their place's landmark for a calm-and-catch battle; Moonborn turn up anywhere (17-expansion.js rolls them in).
// The creatures themselves are written in 13b-family-creatures.js.
var CC = window.CC || (window.CC = {});

(function () {
  function F() { return CC.state.flags; }
  var say = function (text, who) { return CC.say(text, who ? { who: who } : undefined); };
  function flash() {
    var k = 0, scr = { name: 'flash', update: function () {}, draw: function () { CC.g.globalAlpha = Math.sin(k * Math.PI); CC.rect(0, 0, CC.W, CC.H, '#ffffff'); CC.g.globalAlpha = 1; } };
    CC.push(scr);
    return CC.tween(1, function (t) { k = t; }).then(function () { CC.pop(scr); });
  }
  var BG = { orchard: 'orchard', grove: 'grove', cove: 'cove', isle: 'isle', mine: 'mine', springs: 'springs', bayou: 'bayou', archive: 'archive' };
  // a place's landmark: its legend line, then its Keeper if a kid has made one
  CC.keeperAt = async function (area, line) {
    var k = CC.KEEPER_CREATURES && CC.KEEPER_CREATURES[area];
    if (line) await say(line);
    if (!k) return;
    var key = 'keeper:' + area, c = CC.CREATURES[k.id], place = (CC.SPAWNS[area] || { name: area }).name;
    if (CC.state.caught[k.id]) { await say('The Keeper\'s spot is quiet now. ' + c.name + ' travels with you.'); return; }
    if (F()[key] !== 'calm') {
      await say('The ground trembles. Something old and enormous has been waiting here a very long time...');
      var r = await CC.fight({
        wild: CC.mon.make(k.id, k.level), bg: BG[area], boss: true, vs: 'boss',
        introText: c.name + ', the Keeper of ' + place + ', rises up!', noCatch: 'The Keeper is too wild to catch. Calm it first!', noRun: 'The Keeper blocks the way!',
      });
      if (r !== 'win') return;
      F()[key] = 'calm'; CC.sfx('moon'); await flash();
      await say(c.name + ' lowers its great head. It seems calm now, and curious about you.');
    }
    var r2 = await CC.fight({ wild: CC.mon.make(k.id, k.level), bg: BG[area], boss: true, canLose: true, noVs: true, introText: c.name + ' watches you calmly. It seems to be waiting.' });
    if (r2 === 'caught') await say(c.name + ', the Keeper of ' + place + ', joined you!');
    else { CC.healParty(); await say(c.name + ' goes back to watching over its landmark. It will wait for you here.'); }
    CC.saveGame();
  };
  CC.keeperAt.has = function (area) { var k = CC.KEEPER_CREATURES && CC.KEEPER_CREATURES[area]; return !!k && !CC.state.caught[k.id]; };

  // Tinker, once you've caught a Moonborn creature
  var tinker = CC.NPCS.village.find(function (n) { return n.look === 'tinker'; }), talk = tinker.talk;
  tinker.talk = async function () {
    var moon = (CC.MOONBORN || []).find(function (id) { return CC.state.caught[id]; });
    if (moon && !F().tinkerMoon) {
      F().tinkerMoon = true;
      await say('Whoa! Is that a ' + CC.CREATURES[moon].name + '? I drew one just like that in my sketchbook! ...Wait. Did I draw it first?', 'Tinker');
      return;
    }
    return talk();
  };
})();
