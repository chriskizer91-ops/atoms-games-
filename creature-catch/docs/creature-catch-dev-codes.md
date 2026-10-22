# Creature Catch: Dev Codes

Codes for testing. They work in any build from v3 on.

## Opening the code box

- **In a game:** MENU, then **Codes**.
- **On the title screen:** press **Up Up Down Down Left Right Left Right B A** (keys or the on-screen pad).

Type a code and press Enter. Codes don't care about upper or lower case. Paste several at once by putting `;` between them, for example:

```
starter embroak; level 15; cubes 30; nowild
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
| `CUBES 50` / `POTIONS 20` / `COINS 5000` | Sets items or coins |
| `GOTO GRASSLAND` | Warps to VILLAGE, MEADOW or GRASSLAND (optionally add X Y) |
| `WILD DANDYLION 6` | Starts a wild battle with that creature at that level |
| `TRIAL DONE` / `TRIAL RESET` | Passes or undoes Farmer Bramble's trial (log gate, Vault Key) |
| `DEX` | Marks every creature as seen |
| `NOWILD` | Turns tall-grass encounters off, or back on |
| `CATCHALL` | Every cube catches, or back to normal |
| `ONEHIT` | Your attacks knock out in one hit, or back to normal |
| `FAST` | Runs the whole game 2x, or back to 1x. `SPEED 3` picks a speed from 1 to 4 |
| `ZOO` | A gallery of every creature sprite. Pink names have no art yet |
| `DEV` | Shows which toggles are on and which codes are waiting |

Creature names can be shortened to their start (`WILD DANDY 6`).

The toggles (`NOWILD`, `CATCHALL`, `ONEHIT`, `FAST`) last until you reload the page. They aren't saved. Everything else changes your save the next time you save.

## Ideas for later (not built yet)

- `SHINY`: show the shiny palette.
- `ART`: list which pictures are still missing.
- `BATTLEBG <place>`: preview a battle background.
- `ANIM <move>`: replay one move's animation in a loop.
- `NIGHT` / `DAY`: once day and night exist.
- `REGION <name>`: jump to later regions once they're built.
