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
  floor: { wood: 4, fiber: 2 },
  net: { wood: 2, plastic: 3, fiber: 2 },
  grill: { wood: 5, scrap: 2 },
  catcher: { plastic: 5, wood: 3, fiber: 2 },
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
};

export const COOKED = { hunger: 32, thirst: 6 };

// Clothing: one piece per slot. Buffs add up across slots.
//   insulation  cuts warmth lost to water, rain, storms and night
//   heatShield  no extra thirst in the midday sun
//   calm        the shark waits this much longer between attacks
//   biteGuard   shark bites on you hurt this much less
//   swim        swim this much faster
export const CLOTHING = {
  palmHat: {
    slot: 'head', name: 'Palm sun hat', cost: { fiber: 5 },
    buffs: { heatShield: 1 },
    text: 'Wide brim of woven fronds. The midday sun no longer dries you out faster.',
  },
  toothBand: {
    slot: 'head', name: 'Shark-tooth headband', cost: { tooth: 3, fiber: 2 },
    buffs: { calm: 0.25 },
    text: 'Teeth the shark left in your floor. It seems to think twice: 25% longer between attacks.',
  },
  jawCrown: {
    slot: 'head', name: 'Jawbone crown', cost: { jaw: 1, fiber: 2 },
    buffs: { calm: 0.4, biteGuard: 0.15 },
    text: 'The old shark\'s jaw, worn as a crown. Predators keep away longer (40%) and bite you 15% softer.',
  },
  tarpPoncho: {
    slot: 'body', name: 'Tarp poncho', cost: { plastic: 6, fiber: 2 }, color: 0x3f74a8,
    buffs: { insulation: 0.45 },
    text: 'Plastic sheeting with a hole for your head. You lose warmth 45% slower in rain, wind and at night.',
  },
  hideVest: {
    slot: 'body', name: 'Sharkskin vest', cost: { hide: 3, fiber: 2 }, color: 0x4d6370,
    buffs: { biteGuard: 0.35, insulation: 0.2 },
    text: 'Tough as the animal it came from. Shark bites on you hurt 35% less, and it keeps some warmth in.',
  },
  swimShorts: {
    slot: 'legs', name: 'Woven swim shorts', cost: { fiber: 4, plastic: 2 },
    buffs: { swim: 0.3 },
    text: 'Light and tight. Swim 30% faster.',
  },
  hideLeggings: {
    slot: 'legs', name: 'Sharkskin leggings', cost: { hide: 2, fiber: 2 },
    buffs: { swim: 0.15, biteGuard: 0.15, insulation: 0.2 },
    text: 'Swim 15% faster, shark bites hurt 15% less, and they hold in a little warmth.',
  },
};

// Other things made in the crafting menu.
export const GEAR = {
  metalSpear: {
    name: 'Scrap-metal spear', cost: { scrap: 3, wood: 2, fiber: 1 }, once: true,
    text: 'A sharpened metal tip. Every hit counts double toward driving a shark off.',
  },
  bandage: {
    name: 'Palm-fiber bandage', cost: { fiber: 3 },
    text: 'Wrap a wound: heals 30 health straight away.',
  },
};

// Things built on the raft with the hammer.
export const STATIONS = {
  grill: {
    name: 'Firepit grill', cost: { wood: 5, scrap: 2 },
    text: 'Burns 1 wood for 90 seconds. Cooks raw fish in 10 seconds and keeps you warm nearby.',
  },
  catcher: {
    name: 'Rain catcher', cost: { plastic: 5, wood: 3, fiber: 2 },
    text: 'Collects fresh water, slowly in fair weather and fast in rain. Holds 3 drinks.',
  },
};
export const GRILL = { burn: 90, cook: 10 };
export const CATCHER = { cups: 3, drink: 28, fillEvery: { clear: 70, cloudy: 50, rain: 14, storm: 9 } };

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

// Warmth, per second. Losses are cut by clothing insulation.
export const WARMTH = {
  water: 1.6, rain: 0.35, storm: 0.45, night: 0.3,  // losses
  sun: 0.6, fire: 3, fireRange: 3.2,                // gains
  freezeDamage: 1.0,
};
export const HEAT_THIRST = 0.5; // extra thirst drain in full midday sun, before a hat
