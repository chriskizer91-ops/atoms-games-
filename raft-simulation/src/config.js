// Tuning numbers in one place. Distances are metres, times are seconds.

export const TILE = 1.6;            // one raft floor piece is TILE x TILE
export const DECK_Y = 0.42;         // deck top above the raft's floating line
export const EYE = 1.62;            // eye height when standing
export const SWIM_EYE = 0.32;       // eye height above the water when swimming

export const CURRENT = { x: 0.12, z: 1 };   // direction floating things drift (normalised in debris.js)
export const CURRENT_SPEED = 0.9;

export const PLAYER = {
  walk: 3.6,
  sprint: 5.4,
  swim: 2.3,
  swimSprint: 3.2,
  jump: 5.0,
  gravity: 17,
  radius: 0.3,
  reach: 3.2,          // E pick-up distance
};

export const STATS = {
  thirstPerSec: 100 / 420,   // empty after 7 minutes
  hungerPerSec: 100 / 600,   // empty after 10 minutes
  starveDamage: 1.2,         // health per second for each empty stat
  regen: 0.6,                // health per second when fed and watered
  regenDelay: 5,             // seconds after taking damage before regen
};

export const HOOK = {
  minSpeed: 5,
  maxSpeed: 16,
  chargeTime: 1.0,
  reelSpeed: 4.6,
  maxRope: 24,
  grabRadius: 1.25,
  maxCarry: 4,
};

export const SPEAR = { reach: 3.5, cooldown: 0.55 };
export const HAMMER = { reach: 4.2, cooldown: 0.5, repairPerHit: 25 };

export const COSTS = {
  repair: { wood: 1 },
  rebuild: { wood: 3, fiber: 2 },
};

export const RAFT_LIMIT = 7;          // floor pieces can go up to 7 cells out from the start

export const NET = {
  reach: 1.05,        // how far the basket sticks out from the floor edge
  capacity: 5,
  fishEvery: [28, 50], // seconds between fish swimming into a net
};

export const FISH = { hunger: 14, thirst: 2 };

export const BAIT = {
  throwSpeed: 11,
  life: 45,           // seconds before it sinks
  lure: 40,           // the shark smells it this far away
  distract: [25, 35], // seconds the shark hangs around after eating it
};

// Every time you drive the shark off it carries a new scar and comes back
// angrier, up to this many.
export const GRUDGE = { maxScars: 6, perScar: { bite: 0.12, speed: 0.04, gap: 0.08 } };

// Stage 1 has one predator. Later tiers reuse the same AI with bigger numbers.
export const SHARK_TIERS = [
  {
    name: 'Reef shark',
    length: 3.0,
    swim: 2.6, chase: 4.3, flee: 6.5,
    biteRaft: 12, biteInterval: 1.4,
    bitePlayer: 20,
    hitsToRepelRaft: 3, hitsToRepelChase: 2,
    firstAttack: 60, attackGap: [45, 80],
    color: 0x56707f, belly: 0xdfe4e3,
    // Driven off once more after its last scar, it gives up for good.
    leavesAtMaxScars: true,
  },
  {
    name: 'Hammerhead',
    kind: 'hammerhead',
    length: 4.2,
    swim: 2.9, chase: 4.8, flee: 7,
    biteRaft: 16, biteInterval: 1.3,
    bitePlayer: 26,
    hitsToRepelRaft: 5, hitsToRepelChase: 3,
    firstAttack: 45, attackGap: [40, 70],
    // Charges the raft edge head first: big damage, rocks the raft, can throw you in.
    ram: { chance: 0.6, damage: 26, splash: 8, speed: 8.5, knockRange: 2.4 },
    color: 0x6e6c60, belly: 0xe2ddd2,
  },
];
export const NEXT_PREDATOR_DELAY = 75; // seconds of calm before the next one shows up

export const ITEMS = {
  wood:    { name: 'Wood' },
  plastic: { name: 'Plastic' },
  fiber:   { name: 'Palm fiber' },
  scrap:   { name: 'Scrap metal' },
  coconut: { name: 'Coconut' },
  fish: { name: 'Raw fish' },
  cooked: { name: 'Cooked fish' },
  tooth: { name: 'Shark tooth' },
  hide: { name: 'Sharkskin' },
  jaw: { name: "Old shark's jaw" },
  stone: { name: 'Stone' },
};

export const COOKED = { hunger: 32, thirst: 6 };

// ---------- recipes ----------
// Every recipe stays hidden until you have held each material it uses at
// least once ("unlocks as you find materials"). bench: needs a crafting
// table on the raft.

// Clothing is for looks only. colors drive the wardrobe preview and your sleeve.
export const CLOTHING = {
  palmHat: { slot: 'head', name: 'Palm sun hat', cost: { fiber: 5 }, color: 0xd9b45f, text: 'Wide brim of woven fronds.' },
  bandana: { slot: 'head', name: 'Bandana', cost: { plastic: 2, fiber: 1 }, color: 0xc9483b, text: 'A strip of red tarp tied round your head.' },
  toothBand: { slot: 'head', name: 'Shark-tooth headband', cost: { tooth: 3, fiber: 2 }, color: 0xeee6d2, text: 'Teeth the shark left in your floor, strung on a cord.' },
  jawCrown: { slot: 'head', name: 'Jawbone crown', cost: { jaw: 1, fiber: 2 }, bench: true, color: 0xf1ead8, text: "The old shark's jaw, worn like a crown." },
  palmVest: { slot: 'body', name: 'Woven palm vest', cost: { fiber: 6 }, color: 0x6f8f3e, text: 'Fronds woven tight into a sleeveless vest.' },
  tarpPoncho: { slot: 'body', name: 'Tarp poncho', cost: { plastic: 6, fiber: 2 }, color: 0x3f74a8, text: 'Plastic sheeting with a hole for your head.' },
  hideVest: { slot: 'body', name: 'Sharkskin vest', cost: { hide: 3, fiber: 2 }, bench: true, color: 0x4d6370, text: 'Grey-blue and rough as sandpaper.' },
  swimShorts: { slot: 'legs', name: 'Woven swim shorts', cost: { fiber: 4, plastic: 2 }, color: 0x2f9a93, text: 'Light shorts woven from fiber and plastic strips.' },
  hideLeggings: { slot: 'legs', name: 'Sharkskin leggings', cost: { hide: 2, fiber: 2 }, bench: true, color: 0x51646e, text: 'Long and tough, stitched from sharkskin.' },
};

// Made in the crafting panel. spear/hook entries replace the tool in your hand.
export const GEAR = {
  bandage: { name: 'Palm-fiber bandage', cost: { fiber: 3 }, text: 'Wrap a wound: heals 30 health straight away.' },
  boneSpear: {
    name: 'Bone spear', cost: { tooth: 3, wood: 2, fiber: 2 }, bench: true, once: true, upgrade: 'spear', level: 2,
    text: 'A row of shark teeth bound to the tip. Hits count 1.5 times toward driving a shark off.',
  },
  metalSpear: {
    name: 'Scrap-metal spear', cost: { scrap: 4, wood: 2, fiber: 2 }, bench: true, once: true, upgrade: 'spear', level: 3,
    text: 'A hammered metal blade. Hits count 2.5 times toward driving a shark off.',
  },
  metalHook: {
    name: 'Metal hook', cost: { scrap: 3, fiber: 3 }, bench: true, once: true, upgrade: 'hook', level: 2,
    text: 'Heavier prongs and a longer line: reels in faster, grabs from further away, carries 6 things.',
  },
};

// Built on the raft with the hammer.
export const STATIONS = {
  floor: { name: 'Floor piece', cost: { wood: 4, fiber: 2 }, text: 'Make the raft bigger. Click an outline next to the raft.' },
  net: { name: 'Catch net', cost: { wood: 2, plastic: 3, fiber: 2 }, text: 'Hangs off an outer edge and catches anything that drifts into it.' },
  table: { name: 'Crafting table', cost: { wood: 6, fiber: 3 }, text: 'Unlocks the bigger recipes and every upgrade. Press E at it to craft.' },
  grill: { name: 'Firepit grill', cost: { wood: 5, scrap: 1 }, text: 'Burn wood to cook raw fish. Lights the raft at night.' },
  catcher: { name: 'Rain catcher', cost: { plastic: 5, wood: 3, fiber: 2 }, bench: true, text: 'Collects fresh water to drink, fastest in rain.' },
  anchor: { name: 'Anchor', cost: { scrap: 4, fiber: 4, wood: 2 }, bench: true, text: 'Drop it when an island is close and the raft stays there as long as you like.' },
};

// Upgrades applied with the hammer to something already built. All need a crafting table.
export const UPGRADES = {
  reinforce: { name: 'Reinforced floor', on: 'floor', bench: true, cost: { scrap: 2, wood: 1 }, text: 'Metal brackets: the floor piece takes twice the punishment.' },
  wideNet: { name: 'Wide net', on: 'net', bench: true, cost: { plastic: 3, fiber: 2 }, text: 'A deeper basket that holds 8 things instead of 5.' },
  oven: { name: 'Stone oven', on: 'grill', bench: true, cost: { stone: 6, scrap: 1 }, text: 'Cooks in 5 seconds and a piece of wood burns almost twice as long.' },
  bigCatcher: { name: 'Big rain catcher', on: 'catcher', bench: true, cost: { plastic: 4, wood: 2 }, text: 'A wider funnel and barrel: holds 6 drinks and fills faster.' },
};

export const SPEAR_POWER = { 1: 1, 2: 1.5, 3: 2.5 };
export const HOOK_LEVELS = { 1: { reel: 1, grab: 1, carry: 4 }, 2: { reel: 1.6, grab: 1.4, carry: 6 } };

export const GRILL = { burn: 90, cook: 10, ovenBurn: 160, ovenCook: 5 };
export const CATCHER = { cups: 3, bigCups: 6, bigRate: 1.6, drink: 28, fillEvery: { clear: 70, cloudy: 50, rain: 14, storm: 9 } };
export const FLOOR_HP = { basic: 100, reinforced: 200 };

// ---------- islands ----------
export const ISLAND = {
  firstIn: 150,          // seconds into a new game before the first one shows up
  every: [260, 380],     // seconds between islands
  visit: 240,            // seconds it stays before drifting on (without an anchor)
  approachSpeed: 3,      // m/s while it is still far away
  radius: [15, 22],
};

// ---------- difficulty ----------
export const DIFFICULTY = {
  easy: { label: 'Easy', drain: 0.6, sharkDamage: 0.6, attackGap: 1.5, hits: -1 },
  normal: { label: 'Normal', drain: 1, sharkDamage: 1, attackGap: 1, hits: 0 },
  hard: { label: 'Hard', drain: 1.35, sharkDamage: 1.4, attackGap: 0.7, hits: 1 },
};

export const COCONUT = { hunger: 12, thirst: 18 };

// Seconds per in-game hour. Nights pass twice as fast as days.
export const DAY = { start: 8, hourDay: 40, hourNight: 20 };

export const WEATHER = {
  kinds: {
    clear: { weight: 45, dur: [150, 260], cover: 0, rain: 0, storm: 0, swell: 1, fog: 0.0085 },
    cloudy: { weight: 30, dur: [90, 160], cover: 0.55, rain: 0, storm: 0.1, swell: 1.12, fog: 0.0105 },
    rain: { weight: 18, dur: [80, 140], cover: 0.85, rain: 0.6, storm: 0.45, swell: 1.3, fog: 0.016 },
    storm: { weight: 7, dur: [70, 120], cover: 1, rain: 1, storm: 1, swell: 1.7, fog: 0.022 },
  },
};


