# Creature Catch: Handoff Document

Everything decided and drafted so far, in one place so a new session can pick up without re-explaining. Where this document disagrees with `creature-catch-design-doc.md`, **this document wins** (the older doc still uses a stamina system that was replaced by PP).

---

## Paste this to start the next session

> I'm building a pixel-art, Game Boy Advance JRPG-style game called **Creature Catch**. You walk through tall grass and creatures spawn out of hiding. You fight them and throw purple-top, blue-bottom capture cubes to catch them. You pick one starter (water dragon, plant turtle, or fire frog), carry a party of 4, and explore 8 regions. I'm attaching my handoff document and prompt files. Read the handoff first. It has the full design and what's decided. Then help me with: [what you want to do next].

**Files to bring along:**
1. `creature-catch-handoff.md` (this file)
2. `creature-catch-image-prompts.md` (40 base creature prompts, capture cube, grass spawn effect)
3. `creature-catch-evolution-prompts.md` (24 evolved forms + 3 starter line-up sheets)
4. `creature-catch-world-prompts.md` (player characters, 15 NPCs, 9 tilesets, 9 battle backgrounds, props, buildings, UI, title screen)
5. `creature-catch-design-doc.md` (the first design draft, partly superseded by this file)

---

## 1. Project at a Glance

- **Genre:** monster-catching JRPG, Game Boy Advance pixel style.
- **Core loop:** walk through tall grass, creatures spawn, fight and weaken them, throw a cube to capture.
- **Capture cubes:** top half purple, bottom half blue.
- **Party:** up to **4** creatures carried at once. Extras go to the Cube Vault.
- **Starters:** choose one of Drizzlon (water dragon), Mossback (plant turtle), or Embroak (fire frog).
- **Roster:** 40 base creatures (3 starters + 37 wild), 24 evolved forms, 64 creature sprites total.
- **Regions:** Grassland, Forest, Water, Cave, Desert, Snow, Swamp, Night Ruins (plus the Home Village).
- **Art:** 64x64 creature sprites, 32x32 overworld characters, 16x16 tiles, 240x160 battle backgrounds, bold dark outline, limited 16-color palette, flat shading.

---

## 2. Decisions Locked In

| Topic | Decision |
|---|---|
| Move resource | **PP (Power Points)** per move, not stamina |
| Rival | The **starter you pick changes your rival's starter and team** |
| Cubes | **Upgraded cubes** exist (4 tiers, see section 7) |
| Types | 8 types, each hits 2 and is hit by 2 |
| Party | 4 creatures, storage in the Cube Vault |
| Evolution | Starters 3-stage, 18 creatures evolve once, 19 are Solo |
| Level cap | 50 |

Items marked **(proposed)** below are default suggestions the next session can change.

---

## 3. Types and Type Chart

**Types:** Fire, Water, Plant, Earth, Bolt, Frost, Shadow, Lumen.

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

**Resistance rule:** if A hits B for 2x, then B attacking A does 0.5x. The exception is Shadow and Lumen, which hit each other for 2x. All other matchups are 1x. Dual types multiply (4x and 1/4x are possible).

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

(Rows attack, columns defend.)

---

## 4. Moves and PP

Every creature knows up to **4 moves**.

### PP system (decided)

Each move has its own PP. Using a move spends 1 PP. A move with 0 PP can't be used.

| Move tier | Power | Max PP |
|---|---|---|
| Basic | 40 | 25 |
| Strong | 75 | 10 |
| Utility | none | 15 |
| Neutral (typeless) | 35 | 35 |

- **Struggle:** if every move is at 0 PP, the creature uses Struggle (Power 30, typeless, takes 25% recoil).
- **Refill:** the Healing Hut restores all HP, PP, and statuses for free. Items restore PP in the field (see Items).
- **Learning moves (proposed):** basic move at Lv 1, utility at about Lv 8, strong move at about Lv 15. Dual-type creatures can learn moves from both types. Each creature should also have a few unique moves to be designed later.

### Signature moves by type

| Type | Basic | Strong | Utility |
|---|---|---|---|
| Fire | Ember Tap | Flare Burst | Cinder Haze (Burn) |
| Water | Splash Jab | Torrent Crash | Soak (lowers Speed) |
| Plant | Leaf Flick | Thorn Barrage | Spore Nap (Sleep) |
| Earth | Pebble Toss | Quake Stomp | Dust Cloud (lowers Accuracy) |
| Bolt | Static Zap | Thunder Snap | Shock Pulse (Shock) |
| Frost | Frost Nip | Blizzard Rush | Chill Touch (Freeze chance) |
| Shadow | Shade Swipe | Night Pounce | Venom Mist (Poison) |
| Lumen | Glow Flash | Radiant Beam | Dazzle (lowers Accuracy) |

**Neutral moves (proposed):** Tackle (Power 35), Guard Up (raises Defense), Quick Step (raises Speed), Rally (raises Attack). Stat stages are +/-25% each, max +/-3 stages.

### Status effects

| Status | Effect |
|---|---|
| Burn | Lose 1/16 max HP each turn, Attack lowered |
| Freeze | Skip turn, 25% thaw chance each turn |
| Shock | 25% chance to skip turn, Speed lowered |
| Poison | Lose 1/8 max HP each turn |
| Sleep | Skip 1 to 3 turns |

Status icons are already in the world-prompts file (flame, snowflake, lightning, green swirl, sleep z, captured cube).

---

## 5. Battle and Capture Rules

**Battle (1v1, turn-based):** each turn choose Fight, Cube, Swap, or Run. Higher Speed acts first, ties are random. Stats are HP, Attack, Defense, Speed.

`Damage = (((2 x Level / 5 + 2) x Power x Attack / Defense) / 50 + 2) x Type multiplier x STAB x Random(0.9 to 1.0)`

STAB is 1.25 when the move's type matches one of the user's types. If all four party creatures faint, the player wakes at the Healing Hut.

**Stat budget guide (base total):** Stage 1 about 200, Stage 2 about 320, Stage 3 about 450, Solo about 300.

**Capture:**
`Catch % = (1 - CurrentHP / MaxHP) x 70 + Status bonus + Rarity bonus + Cube bonus`, clamped to 5% to 95% (Master Cube ignores the clamp).

| Modifier | Bonus |
|---|---|
| Sleep or Freeze | +15 |
| Burn, Poison, or Shock | +8 |
| Common | +25 |
| Uncommon | +10 |
| Rare | -5 |
| Very Rare | -15 |

Animation: the cube wobbles three times for success (6-frame capture strip exists in the world prompts). Moonlynx sits in the Rare spawn tier but uses the Very Rare catch modifier.

**Party and storage:** carry 4. Capturing a 5th sends it to the Cube Vault at Hazel's Healing Hut. Party swaps with the Vault only happen in villages.

**Items (proposed):** Potion (restore 30 HP), Super Potion (80 HP), Tonic (restore 10 PP to one move), Full Tonic (restore all PP to one creature), Cure Herb (clear a status), Revive (restore a fainted creature at half HP).

---

## 6. Evolution

- **Starters:** evolve at **Lv 14** and **Lv 30**.
- **18 creatures** evolve once at a set level or with a shard.
- **19 creatures** are **Solo** (no evolution, slightly higher base stats).
- **Shards:** Sun Shard (Dandylion), Moon Shard (Mothlight, Wispkin). Found in treasure chests: Sun Shard in the Desert, Moon Shard in the Night Ruins.
- When requirements are met, an **Evolve?** prompt appears. Pressing B cancels, and it asks again next level.
- Evolution changes the sprite, raises base stats about 60%, may add a new move, and may add a second type.

### Starter lines

| Line | Type | Lv 14 | Lv 30 |
|---|---|---|---|
| Drizzlon | Water | Rapidrake (Water) | Tsunadrake (Water / Bolt) |
| Mossback | Plant | Thornshell (Plant) | Elderoak (Plant / Earth) |
| Embroak | Fire | Cinderfrog (Fire) | Infernotoad (Fire / Earth) |

### Evolving creatures

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

### Solo creatures (19)

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

**Base type counts (40):** Fire 4, Water 6, Plant 7, Earth 7, Bolt 4, Frost 4, Shadow 4, Lumen 4.

---

## 7. Capture Cubes (upgraded, decided; details proposed)

All cubes keep the purple-top, blue-bottom identity. Upgrades add bands, studs, and glow.

| Cube | Look | Catch bonus | Where to get it (proposed) | Price (proposed) |
|---|---|---|---|---|
| Basic Cube | Purple top, blue bottom, white seam | +0 | Pip's shop in the Home Village | 50 coins |
| Great Cube | Same, plus a silver band and silver corner studs | +15 | Pip's shop after clearing the Water region | 150 coins |
| Ultra Cube | Same, plus a gold band, gold studs, soft gold glow | +30 | Wandering Merchant Tobias (appears from the Desert on) | 400 coins |
| Master Cube | Glowing white-gold cube with a rainbow shimmer seam, purple and blue still visible | Guaranteed catch | One only, a late-game quest reward | Not sold |

**Image prompts for the three new cubes:**

**Great Cube**
> Pixel art game item sprite of a small capture cube, top half bright purple, bottom half bright blue, a shiny silver band along the middle seam and small silver studs on the corners, thin glowing white seam, bold dark outline, Game Boy Advance JRPG style, 32x32 pixels, limited 16-color palette, flat shading, centered on a plain white background, no text, no shadow.

**Ultra Cube**
> Pixel art game item sprite of a small capture cube, top half bright purple, bottom half bright blue, a shiny gold band along the middle seam and gold studs on the corners, a soft golden glow around the cube, bold dark outline, Game Boy Advance JRPG style, 32x32 pixels, limited 16-color palette, flat shading, centered on a plain white background, no text, no shadow.

**Master Cube**
> Pixel art game item sprite of a small legendary capture cube, top half glowing purple with white-gold shine, bottom half glowing blue with white-gold shine, a shimmering rainbow seam in the middle, golden corner studs, small sparkles around it, bold dark outline, Game Boy Advance JRPG style, 32x32 pixels, limited 16-color palette, flat shading, centered on a plain white background, no text, no shadow.

---

## 8. Rival System (decided; teams proposed)

**Rival:** **Juniper**, a friendly, cocky rival with spiky red hair (sprite prompt in the world-prompts file).

**Rule:** Juniper always takes the starter that has the **type advantage over yours**.

| You pick | Juniper picks | Why |
|---|---|---|
| Drizzlon (Water) | Mossback (Plant) | Plant hits Water |
| Mossback (Plant) | Embroak (Fire) | Fire hits Plant |
| Embroak (Fire) | Drizzlon (Water) | Water hits Fire |

Juniper's team also covers your starter's weaknesses, so the rival feels different each playthrough.

| Your starter | Juniper's team (proposed) |
|---|---|
| **Drizzlon** (weak to Plant, Bolt) | Mossback line, Bumblop line, Owlcorn line, Glimmole line |
| **Mossback** (weak to Fire, Frost) | Embroak line, Frostoat line, Dandylion line, Magmite line |
| **Embroak** (weak to Water, Lumen) | Drizzlon line, Koiling line, Mothlight line, Crabbit line |

**Battle schedule (proposed):**

| Fight | Location | Juniper's level | Team size | Notes |
|---|---|---|---|---|
| 1 | Home Village | Lv 5 | 1 | Starter only |
| 2 | Forest gate | Lv 12 | 2 | Starter + 1 |
| 3 | Cave exit | Lv 22 | 3 | Starter is Stage 2 |
| 4 | Snow pass | Lv 32 | 4 | Starter is Stage 3 |
| 5 | Night Ruins finale | Lv 40 | 4 | Full evolved team |

Juniper's sprite and portrait don't need to change per branch, but each branch needs different **dialogue** (for example, a comment about your starter's weakness).

---

## 9. Regions and Spawns

**Encounter rules:** each step in tall grass (or the region's equivalent) has a **12% encounter chance**, with a 3-step cooldown after a fight. Roll rarity first: Common 60%, Uncommon 30%, Rare 10%. Then pick a random creature in that tier. Only base forms spawn in the wild.

| Region | Wild levels | Common | Uncommon | Rare |
|---|---|---|---|---|
| Grassland | 2 to 6 | Tuftail, Hopsprout, Clovermouse | Bumblop, Pebblepup | Dandylion |
| Forest | 5 to 10 | Barkbeetle, Mushling | Owlcorn, Mothlight | Budstag |
| Water | 8 to 13 | Bubblefin, Crabbit | Tidepuff, Sealamp | Koiling |
| Cave | 12 to 18 | Glimmole, Stalagbat | Rumblepede, Gemlin | Magmite |
| Desert | 16 to 22 | Cactoad, Sandwyrm | Dunefox | Scarabolt |
| Snow | 20 to 26 | Pengloo, Sleetle | Frostoat | Yetiny |
| Swamp | 24 to 30 | Lilypadle, Mudgator | Wispeel | Mireling |
| Night Ruins | 28 to 35 | Wispkin | Pebbleton, Bonecat | Moonlynx |

All 37 wild creatures appear in the wild. The 3 starters come only from Elder Willow.

**Region guides (NPCs):** Ranger Oakley (Forest), Fisher Gus (Water), Dusty the Miner (Cave), Safi the Nomad (Desert), Frida the Explorer (Snow), Granny Moss (Swamp), Night Watchman Corvin (Night Ruins).

**Home Village NPCs:** Elder Willow (starter), Pip (shop), Hazel (healer + Cube Vault), Innkeeper Rosa, Farmer Bramble, Village Kid Tinker, plus Wandering Merchant Tobias and the generic villager sheet.

---

## 10. Art Direction and Prompt Workflow

**Master sprite style line:**
> Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a plain white background, no text, no shadow.

**Sizes:** creatures 64x64, overworld characters and props 32x32, tiles 16x16, items and cubes 32x32, battle backgrounds 240x160.

**Workflow tips:**
- Generate in one image-generator chat so the style stays consistent.
- Ask for sprite sheets (a grid of 4 to 6 per image), then slice them in a pixel editor.
- For evolutions, attach the base sprite as a reference image and start the prompt with: "Using the attached sprite as reference for colors, markings, and character design, draw its evolved form:".
- Generators can't hit exact pixel sizes or tile perfectly. Plan to resize and clean up in a pixel editor (Aseprite, Piskel, LibreSprite).
- Keep text out of art. Add names, menus, and logos in the game engine.

---

## 11. Known Gaps and Suggested Next Steps

**Not designed yet:**
1. Per-creature **base stats** and **move lists** (only type-level moves exist).
2. **Map layout**: how the 8 regions connect, and what gates each one (bridges, bosses, items).
3. **Story**: why the player is catching creatures, and what the Night Ruins finale is about.
4. **Progression gating**: field abilities (cut bushes, swim, light caves) or item-based gates.
5. **Economy**: coin rewards, shop inventories, and prices.
6. **Day/night** effect on spawns (not decided).
7. **Dialogue** for NPCs and the three rival branches.
8. **Game engine and tooling**: not chosen yet.
9. **Audio**: music and sound effect ideas.
10. A few **Solo creatures** could get evolutions in a future update.

**Suggested next session order:**
1. Pick the engine and the first playable slice: the Home Village, the starter pick, one grass area, and a battle.
2. Write the map layout and region gating.
3. Create the per-creature stats and move lists (a spreadsheet works well).
4. Draft the story outline and rival dialogue.

---

## 12. Quick Reference: Creature Roster by Region

| Region | Creatures |
|---|---|
| Home Village | Starters: Drizzlon, Mossback, Embroak |
| Grassland | Tuftail, Bumblop, Dandylion, Clovermouse, Hopsprout, Pebblepup |
| Forest | Owlcorn, Barkbeetle, Mothlight, Budstag, Mushling |
| Water | Bubblefin, Crabbit, Tidepuff, Koiling, Sealamp |
| Cave | Glimmole, Stalagbat, Magmite, Gemlin, Rumblepede |
| Desert | Dunefox, Cactoad, Scarabolt, Sandwyrm |
| Snow | Frostoat, Pengloo, Yetiny, Sleetle |
| Swamp | Lilypadle, Wispeel, Mudgator, Mireling |
| Night Ruins | Wispkin, Pebbleton, Bonecat, Moonlynx |
