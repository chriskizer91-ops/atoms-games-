# Fresh Grad

A small life-sim about your first real job: pick a degree, rent a place, eat three meals a day, try to get some sleep.

| Folder | What it is |
|---|---|
| `v1-original/Fresh_Grad_Seasons.html` | The game exactly as provided. Never edited; the baseline everything is compared against. |
| `v2-visual-upgrade/index.html` | **Iteration 2 — visual upgrade.** Same game, same features, same save file; every pixel upgraded (cutscene, town, interiors, UI, mini-games). Open it by double-clicking; it is one self-contained file. |
| `v2-visual-upgrade/src/` | The same game as modules (`css/`, `js/`, `body.html`), cut at the original's own section headers. `node tools/build.js` concatenates them into `index.html`. |
| `v2-visual-upgrade/DESIGN.md` | The visual direction and the rules the upgrade followed. |
| `v2-visual-upgrade/notes/` | Per-pass briefs and change notes. |
| `v2-visual-upgrade/assets/` | Drop zone for optional illustrated art (see below). |
| `IMAGE_PROMPTS.md` | Prompts for an image-generation agent: cutscene stills, character sheets and paper-doll parts, title/diploma art, reference boards, backdrops, icons. |
| `reference-art/` | Reference boards produced from those prompts (looked at while polishing, not loaded by the game). |
| `v2-visual-upgrade/CHANGELOG.md` | What changed in v2, per area, and known limitations. |
| `tools/` | `build.js`, `tour.js` (drives every screen headlessly and captures screenshots + errors), `playthrough.js` (real clicks/keys through the core loop; run on v1 and v2 for identical results), `parity.js` (proves the game logic is unchanged vs v1), `perf.js` (frame cost). |

## Rules the upgrade follows
No new features, no new things to do, nothing removed, save format unchanged. Only drawing and presentation code changes; `tools/parity.js` compares every top-level function against v1 and must report nothing removed and every logic-looking change explained.

## Optional illustrated art
Any PNG listed in `IMAGE_PROMPTS.md` §11, dropped into `v2-visual-upgrade/assets/` with that exact relative name, is picked up automatically (cutscene stills, character poses, title art, diploma…). Missing files are skipped and the game's own procedural art is used. Add `?noart` to the URL to force the procedural look.

## Working on it
```
export NODE_PATH=/opt/node22/lib/node_modules:/opt/node-tools/node_modules   # playwright
node tools/build.js                                  # src/ -> v2-visual-upgrade/index.html
node tools/tour.js v2-visual-upgrade/index.html out/ # screenshots of every screen + error report
node tools/parity.js v1-original/Fresh_Grad_Seasons.html v2-visual-upgrade/index.html --all
node tools/playthrough.js v2-visual-upgrade/index.html   # and on v1-original: results must match
node tools/perf.js v2-visual-upgrade/index.html
```
