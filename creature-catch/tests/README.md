# Creature Catch: Browser Tests

Each test opens the built game (`creature-catch.html`) or the Field Guide in headless Chromium, drives it through the
debug handle `window.__cc` and the keyboard, and prints what it checked. Every test also collects page errors and
console errors, and ends with `no errors` when there were none.

## Running them

From the `creature-catch` folder, after building:

```
node tools/build.mjs
node tools/build-companion.mjs
node tests/run-all.mjs          # every test, about 12 minutes
node tests/run-all.mjs 06 10    # just the tests whose names start with 06 and 10
```

`run-all.mjs` prints `PASS` or `FAIL` for each test. **PASS** means the test finished and saw no page errors. That
doesn't mean every check passed, so read the logs too: each test prints its checks (story flags, who spawned where,
what a person said). Logs and screenshots go to `tests/out/` (git ignores it).

A single test runs on its own too: `NODE_PATH=$(npm root -g) node tests/10-final-creatures.cjs`.

**Playwright** is installed globally in these cloud sessions and Chromium is preinstalled, which is why `NODE_PATH` points at the global modules. Don't run `playwright install`.

## The tests

| Test | What it covers |
|---|---|
| `01-core-flows.cjs` | The core loop: the starter, a catch, the first trial, evolving, the Cube Vault, losing a wild battle in the tall grass (you wake up healed where you last rested), saving and Continue. |
| `02-full-game.cjs` | A route trainer spotting you, Juniper in the Crystal Cave, Dusty's trial and the Wooden Whistle, Fly, Tobias, Continue. |
| `03-battle-bag.cjs` | The Bag in battle: the cube and item pockets, a Potion in battle, throwing a cube. |
| `04-polish.cjs` | Side-walk frames, the field menu, the Creature Log, the four VS intros, place signs, footprints, guides walking, the Bag. |
| `05-save-files.cjs` | A family creature (? Pop) in battle, ZOO, the Creature Log, and the three save files (Continue, the picker, New Game). |
| `06-postgame.cjs` | The post-game arc start to finish: Amani, the Dawn Temple mirrors, Solarion, the Ancient Door, Gloaming, the Dusk Bell, the Balance. |
| `07-lost-pages.cjs` | Lost Pages 1 to 10 through their own scripts, and the expansion's people. |
| `08-copperbell.cjs` | Copperbell: the museum plaques and Page 6, the school quiz, more townsfolk. |
| `09-old-save.cjs` | An older version's save loads in this one. `run-all.mjs` pulls the v8 and v10 builds out of git and runs it for each. |
| `10-final-creatures.cjs` | The v11 creatures: evolving and the moves they pick up, the Moon Shard on Glimstar, a Runescroll at the Archive wall, a battle, the Log. |
| `11-final-spawns.cjs` | Who turns up wild where the v11 creatures live: both ice cream forms in Frostpeak Pass, Crescub and Moonlynx, the Spire. |
| `12-field-guide.cjs` | The Field Guide: place tabs and numbering, "Also found here" links, the spoiler covers, remembering the tab, phone width. |
| `13-field-guide-spoilers.cjs` | The Field Guide: the hidden Night Ruins guardians, link jumps between tabs, dark mode, the phone's tab row. |
| `14-vault-log.cjs` | The Cube Vault screen (scrolling, sorting, taking out, remembering where you were, refusing a swap that leaves nobody able to fight), long menus, the Creature Log (shadows, note lines, long names), Yes/No questions staying on screen, Evolve in the party menu, shards kept when an evolution is stopped, the party before the starter, type icons, status tags, play time, a broken screen not freezing the game. |
| `15-every-evolution.cjs` | Every creature with an evolution (87) evolves for real: the level ones through the question after a won battle, the shard ones from the Bag. Checks the new form, HP, moves, the moves it is offered and the Log. About 3 minutes. |
| `16-walk-every-map.cjs` | Every map at four story stages: every exit, door, stairs, Fly spot and warp lands on a free tile with a way out; people, chests, signs and landmarks can be reached; patrols are free. Then it walks through every exit and door for real. Fails on any high or medium issue except the few it lists as by design (gates shut before their trial, the Dawn Temple's halls before the mirrors). |
| `17-story-fixes.cjs` | The v12 story fixes: losing any wild battle sends you back to rest (and no battle starts with a fainted party), the blackout line names the place, Gloaming waits by the pool (old saves mended), Always day only changes the look, the Moon Altar's daily Moon Shard, trainers' creatures in their form for their level, damaged save files, Continue on a moved spot, the Fly map on the Spire, people who walk, Copperbell's bell lines, the Inn, dev codes with spaces. |
| `19-battle-rules.cjs` | The XP rule (more from stronger foes, less from much weaker ones, half a share for the rest of the team, which still learns moves and is asked to evolve), a creature that fainted at its evolution level is asked after a later win, a double faint, no battle when nobody can fight, accuracy, the trainer AI, catch odds (a form met evolved, the Dusk Cube at dusk), the HP plates for all 175 names, the pixel digits. |
| `20-phone.cjs` | Phones and tablets, upright and sideways (iPhone SE, iPhone 13 with and without the notch, Pixel 5, Galaxy S8, a 280 px phone, iPad Mini): the canvas size, the touch pad under or beside it, nothing overlapping, no page scroll, sliding a thumb across the d-pad. |

## Writing a new one

Copy the top of any test: it loads `./lib.cjs` for `GAME`, `GUIDE`, `OUT` and `shotPath()`. The usual pattern:

```js
await p.goto(GAME); await p.waitForTimeout(1800);   // the title screen
await p.evaluate(() => {                            // skip the intro and set up a state
  const C = __cc; C.stack.length = 0; C.state = C.newState();
  C.world.enter('village', 10, 6, 'down'); C.push(C.world);
  C.runCodes('STARTER EMBROAK; MAX; GOD');          // any dev code (docs/creature-catch-dev-codes.md)
});
```

Then press keys (`KeyZ` is A, `KeyX` is B, `Enter` is MENU, arrows walk), or call the game directly through
`__cc` (`C.world.enter`, `C.fight`, `C.runCodes`, `C.rollSpawn`, `C.state`). A `mash()` helper that presses A until
the world is idle (`!__cc.world.busy && __cc.stack.length === 1`) gets through any conversation. Finish with
`console.log(errs.join('\n') || 'no errors')` so `run-all.mjs` can tell.
