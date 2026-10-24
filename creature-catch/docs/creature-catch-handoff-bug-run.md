# Creature Catch: Handoff for the Bug Run (v11)

Everything a fresh session needs to hunt bugs in Creature Catch: where the game is, how it's built, how the code fits
together, how to test it, what's already known to be wrong, and how to deliver fixes. Read it top to bottom once before
touching anything.

---

## 0. Paste this to start the session

> We're doing a bug run on Creature Catch, a Game Boy Advance style creature-catching game that lives in the
> `creature-catch/` folder of this repo.
>
> 1. **The game is only on the branch `claude/youthful-wright-s9n5wh`.** The repo's default branch is a different
>    project, so a fresh checkout won't have the game. Run `git fetch origin claude/youthful-wright-s9n5wh` and work from
>    that branch (if this session gives you a different branch name, create it from that one).
> 2. Read `creature-catch/docs/creature-catch-handoff-bug-run.md` before anything else.
> 3. Only write inside `creature-catch/`.
> 4. My list of things to look for: *(paste your list here)*
> 5. ultracode: also sweep the whole game for errors and bugs.

---

## 1. Ground rules (from the person you're working for)

- **Only write inside `creature-catch/`.** Nothing at the repo root or in other folders.
- **Never rename or respell the family's creatures.** ? Pop, Pup Pop, Doggy Woggy, Clove Tastical, Hoppin Pop and the
  move Sprink Magick are spelled the way the kids wrote them, on purpose. ? Pop is read "Mystery Pop"; its id is
  `mysterypop`. A.S.K. drew ? Pop; the rest are the son's ideas. Fix the code around a name, never the name.
- **No new creatures.** The list is final at 175.
- **Tone:** gentle and kid-friendly. Nobody is evil; the answer is always kindness. Game text is short and plain.
- **Versions:** every delivery is "Creature Catch vN". v11 is the current one, so the bug-fix release is **v12**.
  Bump `VERSION`, add a `CHANGELOG.md` entry (newest at the top, written for a parent reading it), and deliver three
  files: `creature-catch-v12.html` (copy of `creature-catch.html`), `creature-catch-v12-source.zip`
  (`git archive --format=zip --prefix=creature-catch/ -o <zip> HEAD:creature-catch`, run from the repo root after
  committing) and `creature-catch-field-guide-v12.html` (copy of `companion/creature-catch-field-guide.html`).
  Send them to the user as files.
- **Git:** commit and push to the working branch. Don't open a pull request unless asked. Tags can't be pushed (403).
- **Keep the docs true.** If a fix changes behavior, update `CHANGELOG.md`, and `docs/creature-catch-decisions-2.md`
  when it changes a rule. Regenerate what's generated (section 2).

---

## 2. Layout and build

```
creature-catch/
  creature-catch.html          the built game: ONE offline file, all code and art inside (~11 MB). Never edit by hand.
  VERSION                      the version number (11); shown on the title screen
  CHANGELOG.md  README.md
  src/shell.html               the page around the game; src/fonts/ (Pixelify Sans)
  src/js/*.js                  the game, concatenated in file-name order into one script (see section 3)
  art/**                       game-ready pictures (949), embedded as base64 by the build; art/MANIFEST.json lists them
  companion/creature-catch-field-guide.html   the Field Guide (built)
  tools/build.mjs              builds creature-catch.html from src/ and art/
  tools/build-companion.mjs    builds the Field Guide from the game's data and art
  tools/roster-doc.mjs         writes docs/creature-catch-roster.md (stats, learnsets, moves, spawns)
  tools/load-data.mjs          loads the data files in Node (for data checks and the doc tools)
  tools/import-art.py          turns generated art into game art (keying, shrinking, cutting sheets)
  tests/                       browser tests and the runner (tests/README.md)
  incoming/family-designs/     the original pictures of the family's designs (not built)
  docs/                        design docs, prompts, the lore bible, this file
```

**Build commands** (run from `creature-catch/`):

```
node tools/build.mjs              # the game   -> creature-catch.html
node tools/build-companion.mjs    # Field Guide -> companion/creature-catch-field-guide.html
node tools/roster-doc.mjs         # docs/creature-catch-roster.md
node tests/run-all.mjs            # the browser tests (about 10 minutes)
```

Rebuild the game after any change in `src/` or `art/`, the Field Guide after any data or art change, and the roster
doc after any creature or move change. **The data-only loaders list their files explicitly:** a new data file must be
added to `tools/load-data.mjs` and `tools/build-companion.mjs` (the game build picks up every `src/js/*.js` on its own).

**Docs worth knowing:** `docs/creature-catch-lore-bible.md` (the world, the story, every place and creature, made from
the game's data; wins for lore), `docs/creature-catch-decisions-2.md` (rules; wins over older docs),
`docs/creature-catch-dev-codes.md` (every code), `docs/creature-catch-roster.md` (generated numbers),
`docs/creature-catch-expansion-guide.md` (the v9 expansion's design), `docs/creature-catch-new-creatures.md` (the
family creature system).

---

## 3. How the code fits together

Everything hangs off one global, `CC` (`window.CC`). In the browser it's also `window.__cc`, which is what the tests use.
The files load in name order, and later files often patch earlier ones (wrapping a person's `talk`, adding to a map).

| Files | What's in them |
|---|---|
| `00-core.js` | The canvas (240 x 160, scaled), the main loop, input (keyboard and the touch pad), the **screen stack**, waiting helpers, drawing helpers, sound effects, options, **saves**. |
| `01-music.js` | The chiptune soundtrack (Web Audio, starts after the first key press). `CC.MAP_TRACK` picks a track per map. |
| `02-art.js` | Pictures: `CC.img('creatures/tuftail')`; code-drawn stand-ins when a picture is missing; particles. |
| `03-mon.js` | One creature you own: `CC.mon.make(id, lv)`, stats, XP, moves, `canEvolve` / `evolve`. The save state shape (`CC.newState`). |
| `04-ui.js` | Dialog (`CC.say`, `CC.talk`), menus (`CC.menu`, `CC.yesNo`), party, summary, Bag, shop, Vault, learning moves, the evolution scene. `CC.ITEMS`. |
| `05-world.js`, `05b-field.js` | The overworld: maps from ASCII rows plus legends, tiles drawn in code, walking, tall grass, doors, people, signs, exits, weather, day and night, the following creature, the field menu, `CC.rollSpawn`. |
| `06-battle.js`, `06b-vs.js` | The battle engine (`CC.startBattle`) and the VS splash. |
| `07-story.js` | `CC.fight(opts)`, the way every scene starts a battle: it resolves to `'win'`, `'lose'`, `'caught'` or `'run'`. The opening (Home Village, the starter, Juniper's first battle, Bramble's trial), the Healing Hut, `CC.NPCS`, `CC.SIGNS`. |
| `08-codes.js` | Dev codes (`CC.runCodes('GIVE TUFTAIL 12; MAX')`). |
| `09-fly.js` | The Fly map: `CC.FLY_SPOTS` (21). |
| `10` to `13d` | **Data.** Types, moves, creatures (`12`), the expansion's spawns (`12b`), **the v11 creatures (`12c`)**, lore (`13`, `13a`, `13d`), the family creatures (`13b`), the numbering (`13c`). |
| `14-regions.js` | The main-road regions (Forest to Night Ruins, and the Spire), outposts, homes. |
| `15-story-full.js` | The seven guides, route trainers, Juniper's rival battles (`RIVAL_TEAMS`), chests, the finale, the credits, the Spire's rematches (`REMATCH`). |
| `16-log.js` | The Creature Log. |
| `17-expansion.js` | Story stages (`CC.stage()`), stage-aware lines (`CC.chat`), the Lost Pages (`CC.PAGES`, `CC.givePage`), the expansion's items, the wild roll (`CC.rollSpawn` override). |
| `18` to `22` | The expansion: interiors and the Inn (`18`), Copperbell and Glimmer Mine (`19`), the early side areas (`20`), the late side areas (`21`), the post-game arc (`22`). |
| `23-kids-creatures.js` | Keeper battles at landmarks, Tinker's Moonborn line (both unused: see section 5). |
| `99-main.js` | Start-up; sets `window.__cc`. |

**Things to know when reading the code:**

- **The screen stack:** `CC.push(screen)`, `CC.pop(screen)`, `CC.top()`, `CC.stack`. A screen is `{ name, update, draw, opaque }`. The world is `CC.world`; scripted scenes run inside `CC.world.run(async () => ...)`, which sets `CC.world.busy`. Idle means `!CC.world.busy && CC.stack.length === 1`.
- **Maps:** `CC.MAPS[id]` with ASCII `rows`, a `legend`, `exits` (side, range, target map and tile, optional `check` and `onArrive`), `decor`, and hooks `onEnter`, `landmarkTalk`, `drawOver`. Rooms come from `CC.room(name, rows, [mapId, x, y], decor, extra)`; upstairs floors from `CC.upstairs`. People are in `CC.NPCS[mapId]`, door targets in `CC.DOORS`, sign text in `CC.SIGNS['map:x,y']`. Move the player with `CC.world.enter(map, x, y, dir)`.
- **Creatures:** `CC.CREATURES[id]` = `{ name, types, region, kind, profile, sig, evo: { into, at }, from, look, base, total, learn, xpYield }`. `kind` is `starter1..3`, `base`, `mid`, `final`, `solo` or `legend`. `CC.CREATURE_ORDER` is the Creature Log order (made by `13c`). `CC.SPAWNS[place]` = `{ name, levels, common, uncommon, rare, time }`; `CC.RARITY[id]` drives catch odds; `CC.ZONES` lists the places in journey order.
- **A wild creature at or past its evolution level is met already evolved** (`CC.rollSpawn`). This doesn't apply to trainers' teams, which are hand-written (see section 5).
- **Stat budgets:** `budget()` in `12-data-creatures.js`. The v11 forms in `12c-data-final.js` keep their old forms' stats unchanged.
- **The family creatures system** (`13b`): plain blocks become creatures (stats from where they live). `id:` overrides the id for a name with symbols (? Pop).
- **State:** `CC.state` = `{ map, x, y, dir, party, vault, bag, coins, flags, seen, caught, pages, lastHeal, steps, playTime, clockShift }`. The story runs on `flags`. The main ones: `starter`, `trial1`, `trialForest`, `trialWater`, `trialCave`, `trialDesert`, `trialSnow`, `trialSwamp`, `trialRuins`, `juniper1` to `juniper6`, `vaultKey`, `fly`, `moonRestored`, `boatTicket`, `archiveKey`, `templeOpen`, `solarionCalm`, `sunEmber`, `doorOpen`, `gloamingCalm`, `bellRings`, `balance`, `duskRecipe`, `keeperTitle`, `anyPage`, `longDusk`, `ilsaWall`. `CC.stage()` is `early`, `mid`, `after` or `final`.
- **Saves:** `localStorage` keys `creature-catch-save-1` to `-3` (the slot is `CC.slot`) and `creature-catch-options`. `CC.saveGame()`, `CC.loadGame()`. Old saves must keep loading: new state fields need defaults where they're read.
- **Day and night:** `CC.isNight()`, `CC.gameHour()` (the real clock plus `state.clockShift`, which the Inn changes). Creatures with `time: 'night'` only spawn from dusk on.

---

## 4. Tools for hunting bugs

**Dev codes** (full list in `docs/creature-catch-dev-codes.md`). In a game: hold L + R and press MENU (keys Q + E +
Enter). On the title screen: Up Up Down Down Left Right Left Right B A. In a test: `__cc.runCodes('...')`, several at
once with `;`. The useful ones:

| Code | Use |
|---|---|
| `GOTO <place> [x y]` | Warp to any place: VILLAGE MEADOW GRASSLAND FOREST WATER CAVE DESERT SNOW SWAMP RUINS SPIRE ORCHARD GROVE COVE ISLE COPPERBELL MINE SPRINGS BAYOU ARCHIVE TEMPLE HOLLOW |
| `STARTER X`, `TEAM A 40 B 40`, `GIVE X 20`, `MAX`, `LEVEL 30` | Set up a party (? Pop is `MYSTERYPOP`) |
| `WILD X 20` | A wild battle with anything |
| `TRIAL <region>` / `TRIAL ALL`, `FINALE`, `ENDING` | Jump through the main story |
| `PAGES 8`, `KEYS`, `TEMPLE`, `EMBER`, `BALANCE` | Jump through the post-game |
| `GOD`, `ONEHIT`, `CATCHALL`, `NOWILD`, `INFINITE`, `FAST` / `SPEED 4` | Toggles for fast testing (not saved) |
| `NIGHT`, `DAY`, `DUSK`, `CLOCK` | Force the time of day |
| `DEX`, `ZOO`, `SHINY`, `STOCKUP`, `RICH`, `FLY`, `ZOOKEEPER` | Log, sprite gallery, items, money, Fly everywhere, one of everything |

**Browser tests:** `node tests/run-all.mjs` (details in `tests/README.md`). All 13 pass on v11 (14 runs: the old-save
test runs for a v8 and a v10 save). Add a test for every bug you fix when you can.

**Data checks in Node**, no browser needed:

```
node -e "import('./tools/load-data.mjs').then(({loadData}) => { const CC = loadData(); /* check CC.CREATURES, CC.SPAWNS, CC.MOVES, CC.LORE ... */ })"
```

**Playwright** is installed globally and Chromium is preinstalled: run test scripts with `NODE_PATH=$(npm root -g)`, and
don't run `playwright install`. Screenshots are the best way to check text overflow and art.

---

## 5. Known issues (found while writing this, not fixed)

1. **Spire rematch teams are behind the v11 evolutions (v11 regression).** In `15-story-full.js`, `REMATCH` (Lv 44 to 47) still uses forms that now evolve much lower:
   Oakley: Budstag 44 (now Bloomstag at 24), Barkbeetle 45 (Timberbeetle, 22), Timberowl 46 (Oakenowl, 40).
   Gus: Tidepuff 44 (Pufferoar, 24), Rampacrab 44 (Paladcrab, 36), Surgefin 46 (Leviafin, 34).
   Dusty: Gemlin 44 (Gemonitor, 28), Stalagbat 44 (Stalagwing, 28).
   Safi: Cactoad 44 (Saguaroad, 30), Dunefox 44 (Sunfennec, 30).
   Frida: Sleetle 44 (Iglooshell, 32), Yetiny 45 (Yetitan, 32).
   Granny Moss: Lilypadle 44 (Lilyswan, 34), Mireling 45 (Mirelich, 36), Wispeel 45 (Stormeel, 36).
   **Fix:** swap in the evolved forms (it shows off the new creatures). A small helper that evolves a trainer's creature to its form at that level would fix every team at once.
2. **Juniper's teams** (`RIVAL_TEAMS`): Bumblazer 38 and 48 (Queenbuzz at 36), Timberowl 49 (Oakenowl at 40), Rampacrab 38 and 48 (Paladcrab at 36). Also an older one: Bumblop 20 (Bumblazer at 20).
3. **Route trainers past their evolution level**, mostly from before v11: Skier Lena's Pengloo 24 (evolves at 22), Mountaineer Hal's Frostoat 25 (24) and Pengloo 26 (22), Herbalist Sage's Mudgator 28 (28), Ghost Hunter Vale's Mudgator 30 (28), Scholar Edith's Bonecat 33 (30), Moon Priestess Selene's Fangling 34 (33), Sailor Pete's Bubblefin 16 (16), and **Explorer Indira's Kilnadillo 42 in the Dawn Temple (Furnadillo at 30, new in v11)**. Decide one rule (evolve them, or lower the levels) and apply it everywhere.
4. **Old region names in field notes.** Some notes in `13-data-lore.js` still say "the Snow region", "the Water region", "the Cave", "the Desert", "the Swamp" instead of Frostpeak Pass, the Lakeshore, the Crystal Cave, the Sunscorch Desert and Murkmire Swamp. Cosmetic, but they show in the Log and the Field Guide.
5. **Unused systems.** Moonborn (`lives: 'anywhere'`) and Keepers (`keeper:`) in `13b` and `23` are live code that no creature uses now. Each side-area landmark should just speak its legend line. Check that path, and that nothing errors with `CC.MOONBORN` empty and `CC.KEEPER_CREATURES` missing.
6. **Long names** are untested on every screen: Clove Tastical (14 letters), Hiding Gloaming and Dimmed Lunarion (15), Constellastar (13), Ancients' Archive. Check the battle HP boxes, the party list, the summary, the evolution scene, the VS name plate, the Log list, the Fly map labels and place signs.
7. **"? Pop":** a name that starts with a symbol. Codes use the id (`GIVE MYSTERYPOP`). Check anything that turns names into ids or keys, and any text that splits or capitalizes names.
8. **Once seen, not reproduced:** a scripted run showed "Seen 178" in the Creature Log when only 175 creatures exist. A fresh `DEX` shows 175. Worth a look at what else can land in `state.seen`.
9. **Never covered by the automated tests:** the touch pad on a real phone, audio and music switching, every interior object's text, every person's lines at every story stage and at night, Fly to every spot, every trainer's sight line, the Inn clock and night-only creatures at real night, Lost Page 9 at real night, shiny odds, the full second credits roll, load time of an 11 MB file on a slow phone.

---

## 6. A plan for the sweep (ultracode)

The user's list comes first. For the open-ended sweep, these areas split well across parallel agents. Give each one
its files and this doc. **Every finding must come with a way to reproduce it** (a test, a code sequence, or a data
check); drop findings that don't reproduce.

| Area | What to look for | Where |
|---|---|---|
| Runtime errors | Undefined references, missing `await`, a scene that can leave `world.busy` stuck, screens not popped, errors in rarely-hit branches | `00`, `04`, `05`, `06`, `17` to `23` |
| Data integrity | Every evolution target exists, every move id exists, learnsets valid, every spawn id exists, lore for every creature, art for every creature, item icons, trainers' team ids and levels (section 5), Fly spots on walkable tiles | `10` to `13d`, `15`, `19` to `22`, `09` |
| Maps and walking | Every exit leads to a real map and a walkable tile; doors go both ways; people, chests and props not on walls or blocking the only path; no way to walk off a map or into a wall; the following creature not stuck | `05`, `14`, `18` to `22` |
| Story and softlocks | Every flag can be reached in order; losing a forced battle never strands you; you can't reach an area before its flag and get stuck; post-game steps in any order; page rewards given once | `07`, `15`, `17`, `18`, `22` |
| Battle engine | Status effects, stat stages, PP and Struggle, priority, multi-hit, drain and recoil, catch odds per cube (Dusk Cube at night), items in battle, the XP split, evolving after battle, shards from the Bag, switching, blacking out | `03`, `04`, `06` |
| Text and UI | Overflow and wrapping, long names, typos, stage-aware lines that never show, inconsistent names against the lore bible, tone | everywhere; screenshots |
| Saves | Three slots, Continue, delete, old saves (v8 and v10 builds via `tests/09`), new fields read without defaults, the options file | `00`, `08`, `03` |
| Field Guide and docs | The guide matches the game (numbers, places, times of day), spoiler gates, links; docs match the code | `tools/build-companion.mjs`, `docs/` |

**For each confirmed bug:** fix it in `src/` (or the data), add or extend a test in `tests/`, rebuild
(`node tools/build.mjs`, plus the Field Guide or roster doc if data changed), run `node tests/run-all.mjs`, and commit
with a message saying what was wrong and what changed. When the run is done: bump `VERSION` to 12, add the
`CHANGELOG.md` entry (a short list a parent can read), rebuild everything, run the tests once more, push, and send the
three v12 files.

A useful new test for this run: **walk every map** (enter each one, try each exit and door, check you land on a
walkable tile and nothing errors). Nothing does this yet.

---

## 7. History in one screen

- **v1 to v4:** the core game: battles, catching, 9 types, the village, the first routes, interiors, Fly, cube tiers, dev codes.
- **v5 to v6:** the full main story (*The Fading Moon*): eight regions, eight guide trials, Juniper, the Moon Altar and Lunarion, the Moonlit Spire, the Field Guide.
- **v7:** polish: music, options, the Bag in battle, shiny creatures, the Creature Log, VS intros.
- **v8:** three save files; the family creature system.
- **v9:** the expansion: Copperbell Town, eight side areas, 62 new creatures, the Lost Pages, the post-game arc (Solarion, Gloaming, the Balance), the Inn.
- **v10:** creatures numbered in journey order; the Field Guide with a tab per place and spoiler covers.
- **v11:** the final creatures: 39 new forms from the son's Evolution Lab picks and the family's 5 designs (175 in all).

The full list is `CHANGELOG.md`.
