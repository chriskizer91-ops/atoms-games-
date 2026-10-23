# Creature Catch: Dev Codes

Codes for testing. They work in any build from v3 on. From v4 on they're hidden behind a button combo.

## Opening the code box

The codes are hidden. There are two ways in:

- **In a game:** hold **L + R** and press **MENU** (keys Q + E + Enter, or the shoulder buttons on the touch pad).
- **On the title screen:** press **Up Up Down Down Left Right Left Right B A**.

Type a code and press Enter. Codes don't care about upper or lower case. Paste several at once by putting `;` between them, for example:

```
starter embroak; max; rich; stockup; fly
```

Codes typed on the title screen wait until you start or continue a game, then they all apply. That means you can jump straight past the intro.

## The codes

| Code | What it does |
|---|---|
| `HELP` | Lists every code |
| `HEAL` | Heals your whole party |
| `LEVEL 20` | Sets your party to that level (1 to 50), with the moves a creature of that level knows |
| `GIVE TUFTAIL 12` | Adds a creature (level optional, default 5). It goes to the Vault if your party is full |
| `TEAM EMBROAK 12 TUFTAIL 10` | Replaces your party (up to 4, default level 10) |
| `STARTER EMBROAK` | Skips Elder Willow and Juniper's first battle and starts you with that starter |
| `TEACH THORN KISS` | Your lead creature learns any move (replaces its last move if it already knows 4) |
| `EVOLVE` | Your lead creature evolves now, if it has an evolution |
| `MAX` (or `LV50`) | Your whole party goes to Lv 50 |
| `RICH` (or `MONEY`) | 999,999 coins |
| `STOCKUP` (or `ITEMS`) | 99 of every item: every cube (Dusk and Master Cubes too), every potion and tonic, Copper Rolls, Warm Soup, Cure Herbs, Revives, and both shards |
| `INFINITE` | Cubes and potions never run out, or back to normal |
| `GODMODE` | Your creatures take no damage, or back to normal |
| `FLY` | Gives you the Wooden Whistle (Fly) and opens every place on the map. Press **R** outside, MENU then Fly, or use the whistle in your Bag. Normally you only get Fly halfway through the story, and only to places you've been |
| `ZOOKEEPER` | One of every creature goes into your Vault at Lv 5 |
| `CUBES 50` / `POTIONS 20` / `COINS 5000` | Sets items or coins |
| `GOTO FOREST` | Warps to any place: VILLAGE, MEADOW, GRASSLAND, FOREST, WATER, CAVE, DESERT, SNOW, SWAMP, RUINS or SPIRE, or a v9 place: ORCHARD, GROVE, COVE, ISLE, COPPERBELL, MINE, SPRINGS, BAYOU, ARCHIVE, TEMPLE or HOLLOW (optionally add X Y) |
| `WILD DANDYLION 6` | Starts a wild battle with that creature at that level |
| `TRIAL DONE` | Passes Farmer Bramble's trial (log gate, Vault Key) |
| `TRIAL CAVE` | Passes every guide's trial up to that region and opens their gates (`TRIAL CAVE` and later also gives you Fly) |
| `TRIAL ALL` / `TRIAL RESET` | Passes every trial, or undoes them all |
| `FINALE` (or `MOON`) | Passes every trial and rival battle and puts you at the foot of the Moon Altar. Walk up the steps |
| `ENDING` (or `POSTGAME`) | The moon is restored and the Moonlit Spire opens (`GOTO SPIRE`) |
| `PAGES 8` | You have Lost Pages 1 to 8. `PAGES ALL` gives all 12, `PAGES RESET` takes them away. Read them at Elder Willow's |
| `KEYS` | The Boat Ticket (Driftwood Cove to Lantern Isle) and the Archive Key (the stairway under the Night Ruins) |
| `TEMPLE` | The moon restored, 8 Lost Pages, and the Dawn Temple open. Puts you at the temple door |
| `EMBER` | Solarion is awake and you have the Sun Ember. Puts you at the Ancient Door in Glimmer Mine |
| `BALANCE` | Everything up to the three guardians. Puts you at the top of the Moonlit Spire for the Balance |
| `DEX` | Marks every creature as seen |
| `SHINY` | The next wild creature is shiny |
| `NIGHT` / `DAY` / `DUSK` | Forces the time of day. `CLOCK` goes back to your real clock |
| `NOWILD` | Turns tall-grass encounters off, or back on |
| `CATCHALL` | Every cube catches, or back to normal |
| `ONEHIT` | Your attacks knock out in one hit, or back to normal |
| `FAST` | Runs the whole game 2x, or back to 1x. `SPEED 3` picks a speed from 1 to 4 |
| `ZOO` | A gallery of every creature sprite. Pink names have no art yet |
| `DEV` | Shows which toggles are on and which codes are waiting |

Creature names can be shortened to their start (`WILD DANDY 6`). Your own creatures from `src/js/13b-family-creatures.js` work in every code too.

The toggles (`NOWILD`, `CATCHALL`, `ONEHIT`, `FAST`, `INFINITE`, `GODMODE`) last until you reload the page. They aren't saved. Everything else changes your save the next time you save.

## Ideas for later (not built yet)

- `ART`: list which pictures are still missing.
- `BATTLEBG <place>`: preview a battle background.
- `ANIM <move>`: replay one move's animation in a loop.
- `RIVAL <n>`: replay one of Juniper's battles.
