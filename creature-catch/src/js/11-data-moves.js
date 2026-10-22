// Every move. PP by tier (handoff section 4): basic 25, strong 10, utility 15, Normal basic 35.
// fx keys the battle code understands:
//   status: 'burn'|'freeze'|'shock'|'poison'|'sleep', chance (percent, default 100)
//   stat: 'atk'|'def'|'spd'|'acc', stages (+ or -), self (true = user), chance
//   drain (share of damage healed), recoil (share of damage taken), heal (share of max HP)
//   crit (high critical rate), priority (goes first), hits [min, max]
var CC = window.CC || (window.CC = {});

CC.MOVES = {
  // Normal
  tackle: { name: 'Tackle', type: 'Normal', tier: 'basic', power: 35, acc: 100, pp: 35 },
  bodyslam: { name: 'Body Slam', type: 'Normal', tier: 'strong', power: 70, acc: 95, pp: 10 },
  growl: { name: 'Growl', type: 'Normal', tier: 'util', acc: 100, pp: 15, fx: { stat: 'atk', stages: -1 } },
  guardup: { name: 'Guard Up', type: 'Normal', tier: 'util', pp: 15, fx: { stat: 'def', stages: 1, self: true } },
  quickstep: { name: 'Quick Step', type: 'Normal', tier: 'util', pp: 15, fx: { stat: 'spd', stages: 1, self: true } },
  rally: { name: 'Rally', type: 'Normal', tier: 'util', pp: 15, fx: { stat: 'atk', stages: 1, self: true } },
  struggle: { name: 'Struggle', type: null, tier: 'basic', power: 30, acc: 100, pp: 0, fx: { recoil: 0.25 } },

  // Fire
  embertap: { name: 'Ember Tap', type: 'Fire', tier: 'basic', power: 40, acc: 100, pp: 25 },
  flareburst: { name: 'Flare Burst', type: 'Fire', tier: 'strong', power: 75, acc: 95, pp: 10, fx: { status: 'burn', chance: 10 } },
  cinderhaze: { name: 'Cinder Haze', type: 'Fire', tier: 'util', acc: 85, pp: 15, fx: { status: 'burn' } },
  // Water
  splashjab: { name: 'Splash Jab', type: 'Water', tier: 'basic', power: 40, acc: 100, pp: 25 },
  torrentcrash: { name: 'Torrent Crash', type: 'Water', tier: 'strong', power: 75, acc: 95, pp: 10 },
  soak: { name: 'Soak', type: 'Water', tier: 'util', acc: 100, pp: 15, fx: { stat: 'spd', stages: -1 } },
  // Plant
  leafflick: { name: 'Leaf Flick', type: 'Plant', tier: 'basic', power: 40, acc: 100, pp: 25 },
  thornbarrage: { name: 'Thorn Barrage', type: 'Plant', tier: 'strong', power: 75, acc: 95, pp: 10 },
  sporenap: { name: 'Spore Nap', type: 'Plant', tier: 'util', acc: 75, pp: 15, fx: { status: 'sleep' } },
  // Earth
  pebbletoss: { name: 'Pebble Toss', type: 'Earth', tier: 'basic', power: 40, acc: 100, pp: 25 },
  quakestomp: { name: 'Quake Stomp', type: 'Earth', tier: 'strong', power: 75, acc: 95, pp: 10 },
  dustcloud: { name: 'Dust Cloud', type: 'Earth', tier: 'util', acc: 100, pp: 15, fx: { stat: 'acc', stages: -1 } },
  // Bolt
  staticzap: { name: 'Static Zap', type: 'Bolt', tier: 'basic', power: 40, acc: 100, pp: 25 },
  thundersnap: { name: 'Thunder Snap', type: 'Bolt', tier: 'strong', power: 75, acc: 95, pp: 10, fx: { status: 'shock', chance: 10 } },
  shockpulse: { name: 'Shock Pulse', type: 'Bolt', tier: 'util', acc: 90, pp: 15, fx: { status: 'shock' } },
  // Frost
  frostnip: { name: 'Frost Nip', type: 'Frost', tier: 'basic', power: 40, acc: 100, pp: 25 },
  blizzardrush: { name: 'Blizzard Rush', type: 'Frost', tier: 'strong', power: 75, acc: 95, pp: 10, fx: { status: 'freeze', chance: 10 } },
  chilltouch: { name: 'Chill Touch', type: 'Frost', tier: 'util', acc: 60, pp: 15, fx: { status: 'freeze' } },
  // Shadow
  shadeswipe: { name: 'Shade Swipe', type: 'Shadow', tier: 'basic', power: 40, acc: 100, pp: 25 },
  nightpounce: { name: 'Night Pounce', type: 'Shadow', tier: 'strong', power: 75, acc: 95, pp: 10, fx: { crit: true } },
  venommist: { name: 'Venom Mist', type: 'Shadow', tier: 'util', acc: 90, pp: 15, fx: { status: 'poison' } },
  // Lumen
  glowflash: { name: 'Glow Flash', type: 'Lumen', tier: 'basic', power: 40, acc: 100, pp: 25 },
  radiantbeam: { name: 'Radiant Beam', type: 'Lumen', tier: 'strong', power: 75, acc: 95, pp: 10 },
  dazzle: { name: 'Dazzle', type: 'Lumen', tier: 'util', acc: 100, pp: 15, fx: { stat: 'acc', stages: -1 } },

  // Signature moves, one per line or Solo creature
  drizzledart: { name: 'Drizzle Dart', type: 'Water', tier: 'sig', power: 50, acc: 100, pp: 15, fx: { priority: 1 } },
  mossmend: { name: 'Mossmend', type: 'Plant', tier: 'sig', pp: 10, fx: { heal: 0.5 } },
  emberlash: { name: 'Ember Lash', type: 'Fire', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { status: 'burn', chance: 30 } },
  grassswipe: { name: 'Grass Swipe', type: 'Plant', tier: 'sig', power: 55, acc: 100, pp: 15, fx: { crit: true } },
  statichop: { name: 'Static Hop', type: 'Bolt', tier: 'sig', power: 50, acc: 100, pp: 15, fx: { status: 'shock', chance: 30 } },
  blazemane: { name: 'Blaze Mane', type: 'Fire', tier: 'sig', power: 65, acc: 100, pp: 15, fx: { status: 'burn', chance: 10 } },
  rockfetch: { name: 'Rock Fetch', type: 'Earth', tier: 'sig', power: 30, acc: 100, pp: 15, fx: { hits: [2, 2] } },
  acorndrop: { name: 'Acorn Drop', type: 'Plant', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { stat: 'def', stages: -1, chance: 30 } },
  mothdust: { name: 'Moth Dust', type: 'Lumen', tier: 'sig', acc: 75, pp: 10, fx: { status: 'sleep' } },
  bubbleburst: { name: 'Bubble Burst', type: 'Water', tier: 'sig', power: 25, acc: 100, pp: 15, fx: { hits: [2, 3] } },
  hoppinch: { name: 'Hop Pinch', type: 'Water', tier: 'sig', power: 55, acc: 100, pp: 15, fx: { crit: true } },
  currentclimb: { name: 'Current Climb', type: 'Water', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { stat: 'spd', stages: 1, self: true } },
  sparkclaw: { name: 'Spark Claw', type: 'Bolt', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { crit: true } },
  magmashell: { name: 'Magma Shell', type: 'Fire', tier: 'sig', pp: 10, fx: { stat: 'def', stages: 2, self: true } },
  sandtomb: { name: 'Sand Tomb', type: 'Earth', tier: 'sig', power: 60, acc: 95, pp: 15, fx: { stat: 'spd', stages: -1 } },
  scarabcharge: { name: 'Scarab Charge', type: 'Bolt', tier: 'sig', power: 85, acc: 100, pp: 10, fx: { recoil: 0.25 } },
  icicletail: { name: 'Icicle Tail', type: 'Frost', tier: 'sig', power: 50, acc: 100, pp: 15, fx: { priority: 1 } },
  bellyslide: { name: 'Belly Slide', type: 'Frost', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { status: 'freeze', chance: 10 } },
  mudchomp: { name: 'Mud Chomp', type: 'Earth', tier: 'sig', power: 70, acc: 95, pp: 10, fx: { stat: 'acc', stages: -1, chance: 30 } },
  lanternglow: { name: 'Lantern Glow', type: 'Lumen', tier: 'sig', power: 55, acc: 100, pp: 15, fx: { drain: 0.5 } },
  bonerattle: { name: 'Bone Rattle', type: 'Shadow', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { stat: 'def', stages: -1, chance: 30 } },
  thornkiss: { name: 'Thorn Kiss', type: 'Shadow', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { drain: 0.5 } },
  luckynibble: { name: 'Lucky Nibble', type: 'Normal', tier: 'sig', power: 45, acc: 100, pp: 20, fx: { crit: true } },
  springkick: { name: 'Spring Kick', type: 'Normal', tier: 'sig', power: 65, acc: 90, pp: 15 },
  bloomcharge: { name: 'Bloom Charge', type: 'Plant', tier: 'sig', power: 85, acc: 100, pp: 10, fx: { recoil: 0.25 } },
  needlespray: { name: 'Needle Spray', type: 'Plant', tier: 'sig', power: 20, acc: 100, pp: 15, fx: { hits: [2, 5] } },
  hornshove: { name: 'Horn Shove', type: 'Earth', tier: 'sig', power: 65, acc: 100, pp: 15, fx: { stat: 'def', stages: -1, chance: 30 } },
  gemglint: { name: 'Gem Glint', type: 'Earth', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { stat: 'acc', stages: -1, chance: 30 } },
  coilroll: { name: 'Coil Roll', type: 'Earth', tier: 'sig', power: 30, acc: 100, pp: 15, fx: { hits: [2, 3] } },
  runeslam: { name: 'Rune Slam', type: 'Earth', tier: 'sig', power: 85, acc: 85, pp: 10 },
  spinepuff: { name: 'Spine Puff', type: 'Water', tier: 'sig', pp: 10, fx: { stat: 'def', stages: 2, self: true } },
  lilyrest: { name: 'Lily Rest', type: 'Water', tier: 'sig', pp: 10, fx: { heal: 0.5 } },
  miragedash: { name: 'Mirage Dash', type: 'Fire', tier: 'sig', power: 55, acc: 100, pp: 15, fx: { priority: 1 } },
  swampspark: { name: 'Swamp Spark', type: 'Bolt', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { status: 'poison', chance: 30 } },
  snowballthrow: { name: 'Snowball Throw', type: 'Frost', tier: 'sig', power: 65, acc: 100, pp: 15, fx: { stat: 'spd', stages: -1, chance: 30 } },
  shellfreeze: { name: 'Shell Freeze', type: 'Frost', tier: 'sig', pp: 10, fx: { stat: 'def', stages: 2, self: true } },
  mushroomhug: { name: 'Mushroom Hug', type: 'Shadow', tier: 'sig', power: 50, acc: 100, pp: 15, fx: { drain: 0.5 } },
  cavedive: { name: 'Cave Dive', type: 'Shadow', tier: 'sig', power: 70, acc: 90, pp: 15 },
  boggrasp: { name: 'Bog Grasp', type: 'Shadow', tier: 'sig', power: 55, acc: 100, pp: 15, fx: { stat: 'spd', stages: -1 } },
  lurelight: { name: 'Lure Light', type: 'Lumen', tier: 'sig', power: 60, acc: 100, pp: 15, fx: { stat: 'acc', stages: -1, chance: 30 } },
  eclipsefang: { name: 'Eclipse Fang', type: 'Shadow', tier: 'sig', power: 90, acc: 95, pp: 10, fx: { stat: 'acc', stages: -1, chance: 30 } },
  moonsong: { name: 'Moonsong', type: 'Lumen', tier: 'sig', power: 90, acc: 100, pp: 10, fx: { drain: 0.5 } },
  crescentclaw: { name: 'Crescent Claw', type: 'Lumen', tier: 'sig', power: 75, acc: 100, pp: 10, fx: { crit: true } },
};

// The basic / strong / utility move of each type
CC.TYPE_MOVES = {
  Normal: ['tackle', 'bodyslam', 'growl'],
  Fire: ['embertap', 'flareburst', 'cinderhaze'],
  Water: ['splashjab', 'torrentcrash', 'soak'],
  Plant: ['leafflick', 'thornbarrage', 'sporenap'],
  Earth: ['pebbletoss', 'quakestomp', 'dustcloud'],
  Bolt: ['staticzap', 'thundersnap', 'shockpulse'],
  Frost: ['frostnip', 'blizzardrush', 'chilltouch'],
  Shadow: ['shadeswipe', 'nightpounce', 'venommist'],
  Lumen: ['glowflash', 'radiantbeam', 'dazzle'],
};
