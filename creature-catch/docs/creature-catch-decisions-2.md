# Creature Catch: Decisions, Round 2

These are the decisions from the second design conversation. Where this file disagrees with `creature-catch-handoff.md` or `creature-catch-design-doc.md`, **this file wins**.

---

## 1. Build

- The game is **one standalone HTML file** (`creature-catch/creature-catch.html`) that works offline. The source lives in `creature-catch/src/`, and `node creature-catch/tools/build.mjs` builds the page.
- Each creature is **one still sprite**. Code does all the movement: idle breathing, lunges, hit shakes, glows, particles, attack animations, transitions, and evolution. `creature-catch-extra-prompts.md` lists the few images that are still worth generating (effect particles, strong-move bursts, icons, portraits, places).
- **Until the art arrives, the game draws a placeholder** for every creature: a type-colored body with eyes. When a sprite lands in `creature-catch/art/creatures/<id>.png`, the next build uses it.

## 2. Outposts, the Vault, and Swapping

- **Every region has an outpost** with a small Healing Hut. It heals you for free and gives you Cube Vault access.
- **You can swap party members at any Healing Hut**, in the village or at any outpost.
- **Vault Key (portable):** Hazel gives it to you after your first guide trial. It opens the Vault from the menu anywhere outside battle.
- When you catch a creature with a full party, it goes to the Vault automatically.
- This replaces "swaps only in villages."

## 3. A Neutral Starter Area

The first route out of the village should favor none of the three starters. Shadow is the only one of the 8 types that is neutral (1x both ways) against Fire, Water, and Plant, and Shadow critters don't suit a sunny meadow. So the game adds a 9th type:

- **Normal:** takes 1x from every type and deals 1x to every type. It sits outside the "hits 2, hit by 2" wheel. Its moves are Tackle (Power 35), Body Slam (Power 70), and Growl (lowers Attack), plus the stat-buff moves.
- **Clovermouse** and **Hopsprout** are retyped to **Normal**. Their art doesn't change.
- **Meadow Path** (the first route, Lv 2 to 4) has only Normal creatures: Clovermouse (common) and Hopsprout (common).
- The **Grassland** proper (Lv 4 to 7) comes after it and is balanced, so each starter finds something it beats and something that beats it:

| Grassland | Creatures |
|---|---|
| Common | Tuftail (Plant), Pebblepup (Earth) |
| Uncommon | Bumblop (Bolt) |
| Rare | Dandylion (Fire) |

*Since v9 the Meadow Path also has Puffmunk (uncommon) and Fleecling (rare, by day), both Normal, and the Grassland has Dewt (uncommon, by day).*

Type counts (base forms, 41 with Fangling): Normal 2, Fire 4, Water 6, Plant 5, Earth 7, Bolt 4, Frost 4, Shadow 5, Lumen 4.

## 4. Shadow and Lumen (rule fix)

Shadow and Lumen deal 2x to each other, so before this fix each resisted only one type while every other type resisted two. **New rule: Shadow resists Shadow, and Lumen resists Lumen (0.5x).** The idea is that darkness can't swallow darkness, and light can't blind light. Now every elemental type resists exactly two. Nothing about the art changes.

| Defender | Resists (0.5x) |
|---|---|
| Shadow | Bolt, Shadow |
| Lumen | Fire, Lumen |

## 5. Shards

- **Moon Shard:** moved to a chest in the **Swamp** (it used to be in the Night Ruins). Mothlight and Wispkin can now evolve before the finale.
- **Sun Shard:** stays in the Desert.
- **Since v9** there's a third Moon Shard in the Ancients' Archive and a second Sun Shard in the Dawn Temple. **Since v12** the Moon Altar in the Night Ruins gives one Moon Shard a day once the moon is back, because four creatures (Mothlight, Wispkin, Mimicube, Glimstar) need one. A shard is used up only when the evolution finishes, and never on a fainted creature.

## 6. New Creature: Fangling and Rosferatu

| Creature | Type | Evolves into | When | New type |
|---|---|---|---|---|
| Fangling | Shadow | Rosferatu | Lv 32 | Shadow / Plant |

- It spawns as an **Uncommon** in the Night Ruins, alongside Pebbleton and Bonecat.
- Its signature move is **Thorn Kiss** (Shadow, Power 60): it heals the user for half the damage dealt.
- The roster is now 41 base creatures and 25 evolutions, so 66 sprites (67 if you also add Duskfang, the optional middle stage).

## 7. Map and Gating: a Straight Line of 8 Regions

Home Village → Meadow Path → Grassland → Forest → Water → Cave → Desert → Snow → Swamp → Night Ruins.

Two things stop you from skipping ahead:

1. **Wild levels.** Each region's wild creatures are stronger than the last.
2. **Guide trials.** Each region's guide stands at its exit. Beat their trial battle to earn their **trail charm**, and they open the way forward.

| Region | Guide | Trial team level (best creature, v12) | Gate they open |
|---|---|---|---|
| Grassland | Farmer Bramble | 8 | Fallen mossy log into the Forest |
| Forest | Ranger Oakley | 12 | Rope bridge to the lake |
| Water | Fisher Gus | 17 (four creatures) | Ferry to the cave mountain (boulders cleared) |
| Cave | Dusty the Miner | 22 | Tunnel out into the Desert |
| Desert | Safi the Nomad | 26 | Path through the sandstorm |
| Snow | Frida the Explorer | 29 | Ice wall at the mountain pass |
| Swamp | Granny Moss | 34 | Rebuilt boardwalk to the Ruins |
| Night Ruins | Night Watchman Corvin | 36 | The rune gate to the finale |

Juniper's rival fights are at Lv 5, 10, 20, 26 and 36, and her last battle at the Spire is Lv 47 to 50 (v12; they were 5, 12, 22, 32, 40 and 50). Before v12 the guides' teams were 8, 12, 15, 20, 24, 28, 32 and 37. Section 17 says why.

## 8. Story and Finale: Three Suggestions (not decided)

1. **The Fading Moon.** The moon is dimming, and creatures are hiding in tall grass because they're frightened. The Night Ruins hold the old Moon Altar. The finale is a corrupted moon guardian you calm by battling it (and maybe catching it). Moonlynx, the Moon Shard, Lumen, and Shadow all tie in.
2. **The First Cube.** The capture cubes were invented in the Night Ruins by a lost people. Juniper wants the Master Cube to prove they're the best. The finale is a friendly showdown with Juniper inside the ruins, where you find the cube-maker's last creature.
3. **The Creature Log.** Elder Willow is too old to finish the Creature Log he started as a kid. Each guide adds a page. The finale is the creature from the last blank page, sleeping in the ruins.

Option 1 has the most atmosphere and uses the art you already have.

## 9. After the Night Ruins (open)

Wild creatures top out at Lv 35, Juniper's final team is Lv 40, and the level cap is 50. Some ideas to fill that gap later:

- A post-game peak (for example, "Moonlit Spire") with wild creatures at Lv 38 to 48.
- Rematches with the guides at Lv 45.
- A last Juniper battle at Lv 50.

## 10. Stats and Movesets

They're generated in `creature-catch/src/js/12-data-creatures.js` and `11-data-moves.js`. The readable version is `creature-catch-roster.md`, which `node creature-catch/tools/roster-doc.mjs` writes.

- **Starters open with Tackle and Growl and learn their type move at Lv 6.** That way Juniper's type advantage doesn't decide the first rival fight (Lv 5). In testing, the type-advantaged starter otherwise won in 2 hits against 5.
- **Every creature has a signature move**, one per evolution line or Solo creature (41 in all).


---

## 11. Added in v4

- **Fly** is a late-game travel option across the visited places, shown on the world map. How you earn it in the story is still open. It could be Timberowl's gift after the Snow region, or a reward from a guide near the end. For now the `FLY` code unlocks it.
- **Interiors:** every village building and outpost has a room. The Healing Hut's Cube Vault is a machine you use in person.
- **Cube tiers:** Great Cubes and Super Potions go on sale after the first trial. Ultra Cubes come from Wandering Merchant Tobias later (not built yet). There's one Master Cube in the story (not built yet).
- **Duskfang** has art (the optional middle stage). The Fangling line is still 2-stage until you decide.


---

## 12. Added in v5

- **The vampire line is 3 stages:** Fangling (Shadow) → **Duskfang** (Shadow, Lv 33) → **Rosferatu** (Shadow / Plant, Lv 42). The levels sit above the Night Ruins' wild range (Lv 28 to 35), so a caught Fangling still has growing to do. Base totals are 240 / 340 / 450.
- **Fly is earned halfway:** after Dusty's Cave trial (region 4 of 8), Ranger Oakley's Timberowl takes a liking to you, and you get the **Wooden Whistle**. Fly only goes to places you have already visited. The `FLY` code opens every place, and places that aren't built yet say so.
- **Creature lore** is in `src/js/13-data-lore.js` (a lore line and a field note for each creature). The Field Guide shows it, and an in-game Creature Log can use it later.

## 13. Added in v6 (the full game)

- **Story:** "The Fading Moon" (option 1 in section 8). Willow tells the legend after you get your starter, each guide adds a piece after their trial (and in the journal in their home), and the finale is at the Moon Altar.
- **Finale:** the Dimmed Lunarion (Shadow / Lumen, Lv 40) can't be caught and you can't run. Win, and it turns back into Lunarion (Lumen, Lv 40), which you can try to catch. If it gets away, it waits at the top of the Moonlit Spire (Lv 45). Losing the first battle sends you to heal; the altar waits.
- **Gates:** log (Bramble), rope bridge (Oakley), rockslide (Gus), tunnel (Dusty), sandstorm (Safi), ice wall (Frida), boardwalk (Granny Moss, into the Night Ruins), and Corvin's rune gate in the middle of the ruins (to the altar).
- **Rewards:** Dusty gives the Wooden Whistle (Fly), Corvin the Master Cube. The Sun Shard is in a Desert chest; Moon Shards are in the Swamp and the Night Ruins.
- **Tobias** sells Ultra Cubes, tonics and Revives at the outposts from the Desert on.
- **Post-game:** the Moonlit Spire (wilds Lv 38 to 48, seven guide rematches at Lv 44 to 47, Juniper at Lv 50; 47 to 50 since v12).

## 14. Added in v9 (the expansion)

The expansion follows `creature-catch-expansion-guide.md`. Where the guide left a choice open, or where the game does something a little different, this is what was built:

- **Copperbell Town is on the main road**, between the Crystal Cave and the Sunscorch Desert. The other new places are side areas off the road (and Lantern Isle is reached by boat). Fly has a spot for every place, and a side area's route on the Fly map joins the road it hangs off.
- **Renames** so no two people share a name: the Lakeshore outpost keeper Coral is now **Marina** (Coral is the girl at Driftwood Cove), the Frostpeak keeper Holly is now **Noelle**, and trainers Sailor Bo, Herbalist Wren and Scholar Ada are now **Sailor Finn**, **Herbalist Sage** and **Scholar Edith** (Boatman Bo, Keeper Wren and Cubesmith Ada are the new characters).
- **The Inn is in Home Village** (Rosa's Inn). Resting costs 30 coins and moves the game clock to the next morning or the next night, so you can find day and night creatures without waiting for the real clock.
- **Day and night:** "night" includes dusk. A creature listed for one time of day only appears then.
- **A wild creature at or above its evolution level appears evolved.** Without this, the later side areas would be full of first forms well past the level they should have grown.
- **The Glyphling wall** counts Glyphlings in your party and the Vault together (three are needed).
- **The Dawn Temple opens** when the moon is restored and you have at least 8 Lost Pages. Elder Willow points you to Safi's grandmother, Amani, at the oasis.
- **Solarion and Gloaming** work like Lunarion: a calming battle first (they can't be caught and you can't run), then a second battle where you can catch them. If they get away, they wait where you found them.
- **The Balance** gives the title "Keeper of the Long Dusk" (Elder Willow uses it), the Dusk Cube recipe (Cubesmith Ada sells Dusk Cubes from then on), and doubles the Moonborn chance. Bringing all 12 pages home after the Balance gives 5 Ultra Cubes.
- **Keepers** use a normal 64x64 sprite; the battle draws them bigger, like every boss. A side area without a Keeper yet shows the landmark's legend line and nothing else.
- **Moonborn** creatures get mid-game stats (the same as a Crystal Cave creature) and appear at the level of the place they turn up in.

## 15. Added in v10

- **Creature numbers follow the journey** (`src/js/13c-field-order.js`): the places in the order you reach them (the main road, each side area right after the road it hangs off, then the places after the story), and each creature numbered in the first place you can meet any of its line, with its evolutions right after it. The starters are 1 to 9. The family's Moonborn come after the Hollow Deep, and a Keeper is numbered with its side area. The Creature Log and the Field Guide share these numbers.
- **The Field Guide is spoiler-safe:** one tab per place, opening on Home Village. The places after the story and the "Every creature" page ask first, and the Night Ruins' guardians are hidden until you tap them.

## 16. Added in v11 (the final creatures)

- **The creature list is final at 175:** the 131 from v10, the 39 new forms his Evolution Lab votes picked, and the family's 5 designs (? Pop, Pup Pop, Doggy Woggy, Clove Tastical, Hoppin Pop). His six Maybes weren't made, so they're out. No more creatures at this stage.
- **Names keep his spelling,** including **Sprink Magick**. ? Pop is read "Mystery Pop"; its id (for its picture and the codes) is `mysterypop`.
- **? Pop evolves at Lv 22,** so both of the ice cream pup's first forms show up in Frostpeak Pass (Lv 20 to 26).
- **A.S.K. drew ? Pop.** The other new creatures are his ideas. Only ? Pop carries a "Drawn by" credit.
- **Nobody's creature gets weaker:** a creature that gained a form keeps its stats. A new second form gets the usual evolved budget; a new third form gets a third more than the form before it, at most 450.
- **Crescub** (Moonlynx's baby form, Lv 30) takes Moonlynx's place in the Night Ruins. **Runescroll** counts as three Glyphlings at the Archive wall.
- **`creature-catch-lore-bible.md`** holds the world, the story and every creature. It wins for lore.

## 17. Added in v12 (the bug run)

- **Leveling: XP scales with the level gap.** A creature gets more XP from a stronger foe and less from a much weaker one: its share times 1 + 0.08 for each level the foe is above it (at most 1.5 times, at least half). The creatures that fought still split the XP; the x1.5 for trainers, XP for a catch, Lv cubed and the Lv 50 cap are unchanged.
- **The rest of the team learns too.** Every awake party member under Lv 50 that didn't fight gets half a fighter's share (scaled by its own level), after one line, "The rest of your team gained XP too!". It still levels up, learns moves and is asked to evolve.
- **Why:** a simulated kid (every trainer, a few or a lot of wild battles, three starters) arrived at the guides 2 to 13 levels above their best creature, with the rest of the team about 20 levels behind, while Juniper's fights were won 0 to 27% of the time. With these rules and the team levels in section 7, the kid arrives at about each guide's level and Juniper is a fair fight. The numbers are in the bug-run notes.
- **Trainers' creatures come in the form they'd have at their level,** the same rule as wild ones (level evolutions only). This fixes the Spire rematches, Juniper's teams and the route trainers past their evolution level.
- **Evolving:** a creature that reaches its evolution level is asked after that battle, or after your next win if it fainted or you lost. If you say No or stop it with B, you can evolve it any time from the party menu (Evolve), as long as it hasn't fainted. That also covers Lv 50 and creatures from older saves whose line gained a form.
- **Wild creatures are picked by weight,** not by a 60/30/10 tier roll: each creature on a place's list weighs 10 (common), 5 (uncommon) or 2 (rare), so tiers no longer dilute each other. A place can set one creature's weight (the Spire's rares weigh 3) or its levels (`weight` and `lv` in `CC.SPAWNS`). `CC.spawnTable(place, night)` is the one table the game, the Field Guide and the roster all read. Every place has at least three creatures by day and at night, and rares are about 4 to 8%.
- **New-creature bonus:** a creature you've never met (in any form it can turn up as there) counts double, so a kid meets everything in a place quickly. After that, rares are rare again.
- **Catch rarity:** a creature met already evolved catches like the list entry it came from (Pup Pop catches like ? Pop). Moonlynx and the guardians stay very rare.
- **Losing:** if every creature faints in any plain battle (tall grass, tide pool, fairy ring, Mimicube, route trainers), you wake up healed where you last rested, and the line says where. No battle starts when nobody can fight. A double knockout with nobody left is a loss. Story battles that may be lost still end their own way.
- **"Always day"** in Options only changes how the world looks. Night creatures, Lost Page 9, the Dusk Cube and resting "Until night" at the Inn follow the game clock.
- **The Cube Vault:** Take out opens its own screen (a scrolling list, the creature you're on shown big, sorting with MENU). A swap must leave at least one creature that can fight, the same as Put away. Every long menu scrolls.
- **The Creature Log shows shadows:** every first form you haven't met (the guardians stay secret), with where to look, and every evolution of a creature you have met, with what it grows from and when. A creature you've seen shows its real picture.
- **Phones:** upright, the buttons sit under the game; sideways, they split beside it, so the game is about twice as big. Small phones shrink the buttons so they never overlap.
- **Play time** counts whenever a game is on, in real time.
