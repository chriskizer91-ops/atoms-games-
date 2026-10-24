# Creature Catch: Game Design Doc

## 1. Core Loop

1. Pick a starter from Elder Willow (Drizzlon, Mossback, or Embroak).
2. Walk through tall grass (or the region's equivalent) and creatures spawn out of hiding.
3. Fight them, weaken them, and throw a purple-and-blue capture cube.
4. Carry up to **4 creatures**. Extras go to the Cube Vault at Hazel's Healing Hut.
5. Level up, evolve, and push through 8 regions.

---

## 2. Types (8)

| Type | Vibe | Example creatures |
|---|---|---|
| Fire | Heat, embers, lava | Embroak, Magmite |
| Water | Seas, lakes, rain | Drizzlon, Bubblefin |
| Plant | Leaves, fungus, growth | Mossback, Tuftail |
| Earth | Rock, sand, crystal | Pebblepup, Rumblepede |
| Bolt | Static, sparks, buzz | Bumblop, Scarabolt |
| Frost | Ice, snow, chill | Pengloo, Frostoat |
| Shadow | Night, bones, spooks | Bonecat, Mireling |
| Lumen | Light, moon, glow | Moonlynx, Mothlight |

### Type chart

Each type hits exactly 2 types for **2x** damage and is hit for 2x by exactly 2 types.

| Attacker | Hits for 2x |
|---|---|
| Fire | Plant, Frost |
| Water | Fire, Earth |
| Plant | Water, Earth |
| Earth | Bolt, Lumen |
| Bolt | Water, Frost |
| Frost | Plant, Shadow |
| Shadow | Lumen, Bolt |
| Lumen | Shadow, Fire |

**Rule for resistance:** if type A hits type B for 2x, then B attacking A does **0.5x** (not very effective). The one exception is Shadow and Lumen, which hit each other for 2x. Everything else is 1x.

### Full grid (rows attack, columns defend)

| | Fire | Water | Plant | Earth | Bolt | Frost | Shadow | Lumen |
|---|---|---|---|---|---|---|---|---|
| **Fire** | 1 | ½ | 2 | 1 | 1 | 2 | 1 | ½ |
| **Water** | 2 | 1 | ½ | 2 | ½ | 1 | 1 | 1 |
| **Plant** | ½ | 2 | 1 | 2 | 1 | ½ | 1 | 1 |
| **Earth** | 1 | ½ | ½ | 1 | 2 | 1 | 1 | 2 |
| **Bolt** | 1 | 2 | 1 | ½ | 1 | 2 | ½ | 1 |
| **Frost** | ½ | 1 | 2 | 1 | ½ | 1 | 2 | 1 |
| **Shadow** | 1 | 1 | 1 | 1 | 2 | ½ | 1 | 2 |
| **Lumen** | 2 | 1 | 1 | ½ | 1 | 1 | 2 | 1 |

**Dual types:** evolved forms can gain a second type. Multiply both multipliers (so 4x and ¼x are possible).

---

## 3. Moves

Every creature knows up to **4 moves**. Each type has three signature moves.

| Type | Basic (Power 40) | Strong (Power 75) | Utility |
|---|---|---|---|
| Fire | Ember Tap | Flare Burst | Cinder Haze (Burn) |
| Water | Splash Jab | Torrent Crash | Soak (lowers Speed) |
| Plant | Leaf Flick | Thorn Barrage | Spore Nap (Sleep) |
| Earth | Pebble Toss | Quake Stomp | Dust Cloud (lowers Accuracy) |
| Bolt | Static Zap | Thunder Snap | Shock Pulse (Shock) |
| Frost | Frost Nip | Blizzard Rush | Chill Touch (Freeze chance) |
| Shadow | Shade Swipe | Night Pounce | Venom Mist (Poison) |
| Lumen | Glow Flash | Radiant Beam | Dazzle (lowers Accuracy) |

Moves use **Stamina (SP)**: basic costs 1, strong costs 3, utility costs 2. Max SP is 10 and it refills after each battle at the Healing Hut. Wild battles refill 2 SP at the start of each turn. (Pokémon-style PP is fine too if you prefer.)

### Status effects

| Status | Effect |
|---|---|
| Burn | Lose 1/16 max HP each turn, Attack lowered |
| Freeze | Skip turn, 25% chance to thaw each turn |
| Shock | 25% chance to skip turn, Speed lowered |
| Poison | Lose 1/8 max HP each turn |
| Sleep | Skip 1 to 3 turns |

Statuses clear when a creature is healed or captured.

---

## 4. Battle Rules

- 1v1 turn-based. Each turn you pick **Fight, Cube, Swap, or Run**.
- Higher **Speed** acts first. Ties are random.
- **Stats:** HP, Attack, Defense, Speed.
- **Damage formula:**
  `Damage = (((2 x Level / 5 + 2) x Power x Attack / Defense) / 50 + 2) x Type multiplier x STAB x Random(0.9 to 1.0)`
  - **STAB** is 1.25 when the move's type matches one of the user's types.
- If a creature faints, you swap in another. If all four faint, you wake up at the Healing Hut.
- **XP:** winning gives XP to the creature that fought. Captured creatures also give XP.
- **Level cap:** 50.

---

## 5. Capture Rules

Throw a purple-and-blue cube during your turn. Success chance:

`Catch % = (1 - CurrentHP / MaxHP) x 70 + Status bonus + Rarity bonus + Cube bonus`

Clamp the result between **5% and 95%**.

| Modifier | Bonus |
|---|---|
| Sleep or Freeze | +15 |
| Burn, Poison, or Shock | +8 |
| Common creature | +25 |
| Uncommon creature | +10 |
| Rare creature | -5 |
| Very Rare creature | -15 |
| Basic Cube | +0 |
| Great Cube (later, optional) | +15 |

**Animation:** the cube wobbles. Three wobbles (use the 6-frame capture sprite strip) means success. A break-out ends with the creature popping back out.

---

## 6. Party and Storage

- Carry up to **4 creatures** in your party.
- Capturing a 5th sends it to the **Cube Vault** (Hazel's Healing Hut). You can only swap party members while standing in a village, so choose your four carefully before heading out.
- First creature in the party leads battles.

---

## 7. Evolution Rules

- **Starters** (3-stage): evolve at **Lv 14** and again at **Lv 30**.
- **18 creatures** have a single evolution at a set level (see the roster).
- **3 creatures** evolve with a shard item instead of a level:
  - **Sun Shard:** Dandylion
  - **Moon Shard:** Mothlight, Wispkin
  - Shards are found in treasure chests (Sun Shard in the Desert, Moon Shard in the Night Ruins).
- **19 creatures** are **Solo** (no evolution). They get slightly higher base stats so they stay competitive.
- When a creature meets the requirement after a battle, show an **Evolve?** prompt. Pressing B cancels it, and it asks again after the next level.
- On evolving: the sprite changes, base stats jump by about 60%, and the creature may learn a new move or gain a second type.
- **Stat budget guide (base total):** Stage 1 about 200, Stage 2 about 320, Stage 3 about 450, Solo about 300.

---

## 8. Roster and Evolution Lines

### Starters

| Line | Type | Lv 14 | Lv 30 |
|---|---|---|---|
| Drizzlon | Water | Rapidrake (Water) | Tsunadrake (Water / Bolt) |
| Mossback | Plant | Thornshell (Plant) | Elderoak (Plant / Earth) |
| Embroak | Fire | Cinderfrog (Fire) | Infernotoad (Fire / Earth) |

### Evolving creatures (18)

| Creature | Type | Evolves into | When | New type |
|---|---|---|---|---|
| Tuftail | Plant | Verdantail | Lv 18 | Plant |
| Bumblop | Bolt | Bumblazer | Lv 20 | Bolt |
| Dandylion | Fire | Sunmane | Sun Shard | Fire / Lumen |
| Pebblepup | Earth | Boulderhound | Lv 18 | Earth |
| Owlcorn | Plant | Timberowl | Lv 22 | Plant |
| Mothlight | Lumen | Radimoth | Moon Shard | Lumen |
| Bubblefin | Water | Surgefin | Lv 16 | Water |
| Crabbit | Water | Rampacrab | Lv 20 | Water / Earth |
| Koiling | Water | Koidrake | Lv 24 | Water / Lumen |
| Glimmole | Bolt | Prismole | Lv 22 | Bolt / Earth |
| Magmite | Fire | Volcaneetle | Lv 26 | Fire |
| Sandwyrm | Earth | Duneserpent | Lv 24 | Earth |
| Scarabolt | Bolt | Thundarab | Lv 26 | Bolt / Fire |
| Frostoat | Frost | Glacistoat | Lv 24 | Frost |
| Pengloo | Frost | Pengarch | Lv 22 | Frost / Water |
| Mudgator | Earth | Mudgatron | Lv 28 | Earth |
| Wispkin | Lumen | Beaconwraith | Moon Shard | Lumen / Shadow |
| Bonecat | Shadow | Bonepanther | Lv 30 | Shadow |

### Solo creatures (19, no evolution)

| Type | Creatures |
|---|---|
| Plant | Clovermouse, Hopsprout, Budstag, Cactoad |
| Earth | Barkbeetle, Gemlin, Rumblepede, Pebbleton |
| Water | Tidepuff, Lilypadle |
| Fire | Dunefox |
| Bolt | Wispeel |
| Frost | Yetiny, Sleetle |
| Shadow | Mushling, Stalagbat, Mireling |
| Lumen | Sealamp, Moonlynx |

### Type totals (base 40)

Fire 4, Water 6, Plant 7, Earth 7, Bolt 4, Frost 4, Shadow 4, Lumen 4.

---

## 9. Spawn Tables

**Encounter rules:** each step in tall grass (or region equivalent) has a **12% chance** of an encounter, with a 3-step cooldown after a fight. Roll rarity first: **Common 60%, Uncommon 30%, Rare 10%**. Then pick a random creature in that tier. *(Replaced in v12 by a weight for each creature: see `creature-catch-decisions-2.md` section 17.)* Only base-form creatures spawn in the wild.

| Region | Levels | Common | Uncommon | Rare |
|---|---|---|---|---|
| Grassland | 2 to 6 | Tuftail, Hopsprout, Clovermouse | Bumblop, Pebblepup | Dandylion |
| Forest | 5 to 10 | Barkbeetle, Mushling | Owlcorn, Mothlight | Budstag |
| Water | 8 to 13 | Bubblefin, Crabbit | Tidepuff, Sealamp | Koiling |
| Cave | 12 to 18 | Glimmole, Stalagbat | Rumblepede, Gemlin | Magmite |
| Desert | 16 to 22 | Cactoad, Sandwyrm | Dunefox | Scarabolt |
| Snow | 20 to 26 | Pengloo, Sleetle | Frostoat | Yetiny |
| Swamp | 24 to 30 | Lilypadle, Mudgator | Wispeel | Mireling |
| Night Ruins | 28 to 35 | Wispkin | Pebbleton, Bonecat | Moonlynx (Very Rare) |

Every creature (all 40) is catchable in the wild except the starters, which you pick from Elder Willow.

---

## 10. Rival and NPC Ideas

- **Juniper** (rival) always picks the starter that beats yours and battles you at key points.
- **Hazel** heals your party and runs the Cube Vault.
- **Pip** sells cubes and potions.
- Each regional NPC (Ranger Oakley, Dusty, Safi, Frida, Granny Moss, Corvin) gives a quest or hint about the region's rare creature.

---

## 11. Open Questions

1. Do you want **SP (stamina)** or classic **PP** for moves?
2. Should the starter choice also decide which **rival** you face?
3. Do you want **Great Cubes** or other cube tiers later in the game?
4. Should the Solo creatures stay Solo, or should some get evolutions in a future update?
5. Do you want **day and night** to affect spawns?
