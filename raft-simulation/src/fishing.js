// Fishing with a rod, from the raft or from a beach (the rules come from the
// sailing game, Sandcastle Cays).
//
// Cast, and the float settles on the water. After a while a fish bites: the
// float dips and you have a moment to strike. Then reel it in: hold to reel,
// but when the fish runs the line tightens, so ease off or the line snaps.
// What bites depends on where you are and when: reef fish by an island, the
// big ones out on the open sea, others only at night.
//
// Every fish here is real and lives in warm seas; the facts are true. No
// drawing in this file.

export const FISH_KINDS = {
  grunt: {
    name: 'Blue-striped grunt', kg: 0.4, meat: 1, strength: 0.3, color: 0xd9c35a,
    fact: 'Grunts are named for the noise they make: they grind their teeth together, and the swim bladder makes the sound louder.',
  },
  snapper: {
    name: 'Yellowtail snapper', kg: 0.8, meat: 1, strength: 0.45, color: 0xc9a2a8,
    fact: 'Unlike most snappers, yellowtails swim in loose schools well above the reef, and they do most of their feeding at night.',
  },
  jack: {
    name: 'Bar jack', kg: 1.5, meat: 2, strength: 0.62, color: 0x9fb6c4,
    fact: 'Bar jacks often follow stingrays as they dig in the sand, snapping up the little animals the rays stir out.',
  },
  bonefish: {
    name: 'Bonefish', kg: 2.5, meat: 2, strength: 0.8, color: 0xc8d2d6,
    fact: 'Bonefish feed on sand flats so shallow their tails break the surface. They are among the fastest fish for their size.',
  },
  barracuda: {
    name: 'Great barracuda', kg: 5, meat: 3, strength: 0.9, color: 0x8f9fa8,
    fact: 'A barracuda can hang perfectly still for minutes, then strike in a burst of over 40 km an hour. It hunts by sight and is drawn to anything that glints.',
  },
  squirrelfish: {
    name: 'Squirrelfish', kg: 0.3, meat: 1, strength: 0.25, color: 0xd9543c,
    fact: 'Squirrelfish hide in the reef by day and come out to feed at night. Their big eyes gather what little light there is.',
  },
  flyingfish: {
    name: 'Flying fish', kg: 0.3, meat: 1, strength: 0.3, color: 0x6f8fc0,
    fact: 'Flying fish do not fly: they burst out of a wave and glide on stiff fins, sometimes for 200 metres, to escape the fish hunting them from below.',
  },
  mahi: {
    name: 'Mahi-mahi', kg: 6, meat: 3, strength: 0.95, color: 0x6fc070,
    fact: 'Mahi-mahi are one of the fastest-growing fish in the sea, and the vivid blue and gold on a freshly caught one fades within minutes.',
  },
  tuna: {
    name: 'Yellowfin tuna', kg: 14, meat: 5, strength: 1.15, color: 0x3d5a7a,
    fact: 'A yellowfin never stops swimming: it has to keep water flowing over its gills. Its blood runs warmer than the sea, which lets its muscles work harder.',
  },
};

export const FISHING = {
  // Seconds before a bite: at least this, plus up to waitSpread more. Dawn, dusk and rain shorten both.
  waitMin: 6,
  waitSpread: 16,
  // Seconds you have to strike once the float dips.
  strikeWindow: 1.5,
  // Reeling: progress per second while holding, slowed by the fish's strength.
  reelRate: 0.26,
  // Line tension: builds while you reel against a running fish, eases when you let go.
  tensionRun: 0.95,
  tensionPull: 0.2,
  tensionEase: 0.9,
  // How far the float lands from you (metres).
  castDistance: 9,
};

// What's likely to bite. place: { land 0..1 (1 = beside an island), night 0..1 }.
export function fishHere(place, r) {
  let table;
  if (place.land > 0.5) {
    table = place.night > 0.5
      ? [['squirrelfish', 0.4], ['snapper', 0.35], ['barracuda', 0.15], ['jack', 0.1]]
      : [['grunt', 0.36], ['snapper', 0.22], ['jack', 0.2], ['bonefish', 0.14], ['barracuda', 0.08]];
  } else {
    table = place.night > 0.5
      ? [['flyingfish', 0.4], ['jack', 0.25], ['tuna', 0.2], ['mahi', 0.15]]
      : [['mahi', 0.34], ['flyingfish', 0.26], ['jack', 0.2], ['tuna', 0.2]];
  }
  let acc = 0;
  for (const [k, w] of table) {
    acc += w;
    if (r < acc) return k;
  }
  return table[table.length - 1][0];
}

// How big this one is, as a multiple of a typical fish (0.7 .. 1.5, most near 1).
export const fishSize = (r) => 0.7 + 0.8 * r * r;
export const fishKg = (kind, size) => Math.round(FISH_KINDS[kind].kg * size * 10) / 10;

export function newFishing() {
  return { phase: 'idle', t: 0, wait: 0, kind: 'grunt', progress: 0, tension: 0, running: false, runT: 0, size: 1 };
}

// Cast out: the float is on the water and you wait for a bite. eager: 0..1, how keen the fish are right now.
export function cast(s, kind, size, eager, rand) {
  s.phase = 'waiting';
  s.t = 0;
  s.kind = kind;
  s.size = size;
  s.wait = (FISHING.waitMin + FISHING.waitSpread * rand()) * (1 - 0.5 * eager);
  s.progress = 0;
  s.tension = 0;
  s.running = false;
  s.runT = 0;
}

export function reelIn(s) {
  s.phase = 'idle';
  s.t = 0;
}

// How hard the fish on the line fights: its kind, and a bigger one a bit harder.
export const strengthOf = (s) => Math.min(1.25, FISH_KINDS[s.kind].strength * (0.85 + 0.15 * s.size));

// Advance by dt seconds. strike: true on the frame you click; reel: true while you hold.
// Returns what just happened: 'bite' | 'missed' | 'hooked' | 'run' | 'caught' | 'snapped' | null.
export function stepFishing(s, dt, strike, reel, rand) {
  s.t += dt;
  if (s.phase === 'waiting') {
    if (s.t >= s.wait) { s.phase = 'bite'; s.t = 0; return 'bite'; }
    return null;
  }
  if (s.phase === 'bite') {
    if (strike) {
      s.phase = 'reeling';
      s.t = 0;
      s.progress = 0.05;
      s.tension = 0.1;
      s.running = true;
      s.runT = 0.5 + rand() * (0.6 + strengthOf(s));
      return 'hooked';
    }
    if (s.t > FISHING.strikeWindow) {
      // Too slow: it took the bait and went. Another nibble before long.
      s.phase = 'waiting';
      s.t = 0;
      s.wait = 3 + rand() * 8;
      return 'missed';
    }
    return null;
  }
  if (s.phase === 'reeling') {
    const k = strengthOf(s);
    // The fish runs for a moment, then rests, then runs again.
    s.runT -= dt;
    let ev = null;
    if (s.runT <= 0) {
      s.running = !s.running;
      s.runT = s.running ? 0.5 + rand() * (0.6 + k) : 0.9 + rand() * 1.6 * (1.25 - k);
      if (s.running) ev = 'run';
    }
    if (reel) {
      s.progress += FISHING.reelRate * (1 - 0.55 * Math.min(1, k) * (s.running ? 1 : 0.3)) * dt;
      // Small fish barely strain the line; a big one running can snap it.
      s.tension += (s.running ? 0.15 + FISHING.tensionRun * k * k : FISHING.tensionPull * k) * dt;
    } else {
      s.tension = Math.max(0, s.tension - FISHING.tensionEase * dt);
      // Not reeling, a running fish takes line back.
      if (s.running) s.progress = Math.max(0, s.progress - 0.07 * k * dt);
    }
    if (s.tension >= 1) { s.phase = 'idle'; s.t = 0; return 'snapped'; }
    if (s.progress >= 1) { s.phase = 'idle'; s.t = 0; return 'caught'; }
    return ev;
  }
  return null;
}
