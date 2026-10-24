# Creature Catch: Browser Tests

Each test opens the built game (`creature-catch.html`) or the Field Guide in headless Chromium, drives it through the
debug handle `window.__cc` and the keyboard, and prints what it checked. Every test also collects page errors and
console errors, and ends with `no errors` when there were none.

## Running them

From the `creature-catch` folder, after building:

```
node tools/build.mjs
node tools/build-companion.mjs
node tests/run-all.mjs          # every test, about 10 minutes
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
| `01-core-flows.cjs` | The core loop: the starter, a catch, the first trial, evolving, the Cube Vault, a blackout, saving and Continue. |
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
| `12-field-guide.cjs` | The Field Guide: place tabs and numbering, "Also found here" links, the spoiler covers, remembering the tab, phone width and the nav bar, what the cards say (tier and % in a place, signature moves, stat totals) and the item tags. |
| `13-field-guide-spoilers.cjs` | The Field Guide: the hidden Night Ruins guardians, link jumps between tabs, dark mode, the phone's tab row. |
| `18-spawns.cjs` | Wild spawns everywhere, day and night: commons above uncommons above rares, at least 3 creatures, rares 3 to 9%, the live roll matching `CC.spawnTable`, the new-creature bonus, catch rarity for every wild form, the Creature Log order, and every field note fitting the Log page. |

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
