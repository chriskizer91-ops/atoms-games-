// One creature you own or fight: stats at a level, XP, moves, healing, evolving.
var CC = window.CC || (window.CC = {});

CC.mon = {
  make: function (id, lv) {
    var m = { id: id, lv: lv, xp: CC.mon.xpFor(lv), moves: [], status: null, sleep: 0 };
    CC.mon.movesAt(id, lv).forEach(function (mv) { m.moves.push({ id: mv, pp: CC.MOVES[mv].pp }); });
    m.hp = CC.mon.stats(m).hp;
    return m;
  },
  sp: function (m) { return CC.CREATURES[m.id]; },
  name: function (m) { return CC.CREATURES[m.id].name; },
  // HP = floor(2 x base x Lv / 100) + Lv + 10, others floor(2 x base x Lv / 100) + 5
  stats: function (m) {
    var b = CC.CREATURES[m.id].base, L = m.lv;
    var f = function (v) { return Math.floor(2 * v * L / 100) + 5; };
    return { hp: Math.floor(2 * b.hp * L / 100) + L + 10, atk: f(b.atk), def: f(b.def), spd: f(b.spd) };
  },
  maxHp: function (m) { return CC.mon.stats(m).hp; },
  xpFor: function (lv) { return lv <= 1 ? 0 : lv * lv * lv; },
  // the moves a creature at this level knows: its two newest attacks, then its newest other moves,
  // so a wild or gifted creature never ends up with only one way to do damage
  movesAt: function (id, lv) {
    var learned = CC.CREATURES[id].learn.filter(function (e) { return e[0] <= lv; }).map(function (e) { return e[1]; });
    if (learned.length <= 4) return learned;
    var hits = learned.filter(function (m) { return CC.MOVES[m].power; }).reverse();
    var others = learned.filter(function (m) { return !CC.MOVES[m].power; }).reverse();
    var keep = hits.slice(0, 2), rest = others.concat(hits.slice(2));
    rest.sort(function (a, b) { return learned.indexOf(b) - learned.indexOf(a); });
    while (keep.length < 4 && rest.length) keep.push(rest.shift());
    return learned.filter(function (m) { return keep.indexOf(m) >= 0; });
  },
  newMovesAt: function (id, lv) {
    return CC.CREATURES[id].learn.filter(function (e) { return e[0] === lv; }).map(function (e) { return e[1]; });
  },
  knows: function (m, mv) { return m.moves.some(function (x) { return x.id === mv; }); },
  heal: function (m) {
    m.hp = CC.mon.maxHp(m); m.status = null; m.sleep = 0;
    m.moves.forEach(function (x) { x.pp = CC.MOVES[x.id].pp; });
  },
  // can it evolve now? (shards are used from the bag instead)
  canEvolve: function (m) {
    var e = CC.CREATURES[m.id].evo;
    return !!(e && typeof e.at === 'number' && m.lv >= e.at);
  },
  // changes species in place, keeps the HP lost, returns the moves the new form picks up
  evolve: function (m) {
    var before = CC.mon.stats(m), into = CC.CREATURES[m.id].evo.into, oldLearn = CC.CREATURES[m.id].learn;
    m.id = into;
    var after = CC.mon.stats(m);
    m.hp = Math.max(1, m.hp + after.hp - before.hp);
    var had = {}; oldLearn.forEach(function (e) { had[e[1]] = 1; });
    return CC.CREATURES[into].learn.filter(function (e) { return e[0] <= m.lv && !had[e[1]] && !CC.mon.knows(m, e[1]); }).map(function (e) { return e[1]; });
  },
};

// The game state that gets saved
CC.newState = function () {
  return {
    map: 'village', x: 9, y: 10, dir: 'down',
    party: [], vault: [], bag: { cube: 0, potion: 0 }, coins: 300,
    flags: {}, seen: {}, caught: {}, lastHeal: { map: 'village', x: 11, y: 6 }, steps: 0, playTime: 0,
  };
};
CC.markSeen = function (id) { CC.state.seen[id] = 1; };
CC.markCaught = function (id) { CC.state.seen[id] = 1; CC.state.caught[id] = 1; };
CC.healParty = function () { CC.state.party.forEach(CC.mon.heal); };
CC.firstHealthy = function () {
  var p = CC.state.party;
  for (var i = 0; i < p.length; i++) if (p[i].hp > 0) return i;
  return -1;
};
// a caught creature joins the party, or the Vault when the party is full
CC.addCreature = function (m) {
  m.status = null; m.sleep = 0;
  CC.markCaught(m.id);
  if (CC.state.party.length < 4) { CC.state.party.push(m); return 'party'; }
  CC.state.vault.push(m); return 'vault';
};
