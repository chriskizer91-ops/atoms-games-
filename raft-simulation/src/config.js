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
    color: 0x5f7787, belly: 0xe7ecee,
  },
];

export const ITEMS = {
  wood:    { name: 'Wood' },
  plastic: { name: 'Plastic' },
  fiber:   { name: 'Palm fiber' },
  scrap:   { name: 'Scrap metal' },
  coconut: { name: 'Coconut' },
};

export const COCONUT = { hunger: 12, thirst: 18 };
