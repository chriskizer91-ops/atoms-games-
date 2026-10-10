# Common brief for every v2 pass

You are one of several specialists upgrading the visuals of **Fresh Grad Seasons**, a single-file HTML canvas life-sim, into v2. You are working in your **own git worktree** (your current directory is a full copy of the repo). Passes run in parallel on *different files* and are merged afterwards, so file ownership below matters.

Read first: `fresh-grad/v2-visual-upgrade/DESIGN.md` (visual direction + non-negotiable rules), then your domain brief.

## What "done" means
The game plays **exactly** as before, but everything you own looks dramatically more detailed, polished and beautiful: the user asked for "every bit of this as detailed and beautiful as possible". Be ambitious. A reviewer should see before/after screenshots and immediately say "that is clearly a big step up", while a player who never saw v1 should find nothing odd. Do not add features, things to do, mechanics, or text with new meaning. Do not remove anything.

## Layout
- Source: `fresh-grad/v2-visual-upgrade/src/` — `head.html`, `css/NN-*.css`, `body.html`, `js/NN-*.js`, plus `mid.html`/`script-open.html`/`tail.html`. Files are concatenated in sorted file-name order into one classic `<script>` (one shared global scope, `'use strict'`). Top-level `const`/`let` are visible across files; a file may only *use at load time* things defined in earlier-sorted files (using them later inside functions is always fine).
- `js/00-assets.js` defines `ART` (optional illustrated PNGs from `assets/`; always provide a procedural fallback).
- The untouched original is `fresh-grad/v1-original/Fresh_Grad_Seasons.html` (reference only; never edit).

## Rules
1. **Only edit files you own** (your brief lists them). You may add new files named after a file you own, e.g. you own `js/16-jobgames.js` → you may add `js/16b-extra.js`. Never edit another pass's file; if you need something from another pass, work around it and write the wish into your notes file.
2. **Never change game logic.** Keep every existing function name and signature, the values functions return, global variables (`S`, `G`, `CAM`, `FX`, ...), DOM ids and the class names JS queries. You may change *what a function draws or how markup looks*. Where a function mixes logic with drawing, change only the drawing statements.
3. **Collision, hit-boxes and layout footprints are logic.** Building sizes, `BOXES`, `solidAt`, furniture `x/y/w/h` (they drive collision), spot positions, door positions, click targets and interaction radii must not move. Decorative extras must not block walking.
4. No `Math.random()` in cached/static art (use `hash01(a,b,c)` / `mulberry32(seed)` already in the game). Live effects may use it.
5. No `fetch`, no ES modules, no new external scripts. Fonts are already loaded (Bricolage Grotesque, DM Sans, DM Mono, Fraunces) — always keep fallbacks.
6. Respect `REDUCED` / `prefers-reduced-motion` for anything that animates continuously.
7. Cache aggressively: static detail is painted once into the existing sprite/chunk caches; per-frame work scales with the viewport, not the world. Target: `render()` average under ~3x baseline in `tools/perf.js` (baseline is 2-3 ms headless), no scene above ~9 ms.
8. Mobile (390x844) and desktop (1280x720) must both look right.

## Tools (run from the repo root of your worktree; `export NODE_PATH=/opt/node22/lib/node_modules:/opt/node-tools/node_modules` first)
- Build to a **private** path (never write `index.html` — that is the integrator's file):
  `node fresh-grad/tools/build.js --out $SCRATCH/mine.html`
  where `SCRATCH=/tmp/claude-0/-home-user-atoms-games-/3b3ffaff-3237-5a28-8802-fd17efae5243/scratchpad/<your-pass-name>` (mkdir it).
- Look at the game: `node fresh-grad/tools/tour.js $SCRATCH/mine.html $SCRATCH/shots --only=<groups> --tag=mine`
  groups: `title cut degree town weather interiors school panels jobs scenes dreams ui fishing mobile`. It prints page errors; there must be none from your code. Use `--vp=390x844` for phone-sized runs.
- **Baseline screenshots** of the original for every group already exist: `/tmp/claude-0/-home-user-atoms-games-/3b3ffaff-3237-5a28-8802-fd17efae5243/scratchpad/tour-v1/NNN-v1-<stop>.png` (144 files; `ls` it). Compare yours against them with the Read tool (it shows images). Judge honestly; iterate.
- Frame cost: `node fresh-grad/tools/perf.js $SCRATCH/mine.html` (compare with `node fresh-grad/tools/perf.js fresh-grad/v1-original/Fresh_Grad_Seasons.html`).
- Logic safety: `node fresh-grad/tools/parity.js fresh-grad/v1-original/Fresh_Grad_Seasons.html $SCRATCH/mine.html --all` must show `REMOVED (0)`; look at every `LOGIC?` entry (`--show=<name>` prints the diff) and make sure it is a presentation-only change.
- For quick one-off screenshots drive the game yourself with Playwright (see `tools/tour.js` for the helper patterns: `page.evaluate` can call the game's own functions such as `startNewGame('cs')`, `enterInterior('diner')`, `openPhone('today')`).

## Working loop (do at least three rounds)
1. Read the code you own and the baseline screenshots. Make a short plan ordered by visual impact.
2. Implement a batch → build → tour → look at the PNGs → fix what is ugly, wrong, blurry, clipped or off-palette → repeat.
3. Check mobile size and a night / rainy / winter variant where relevant.
4. Run parity + perf. Fix regressions.
5. Write `fresh-grad/v2-visual-upgrade/notes/<your-pass>.md`: what changed, what is intentionally untouched, hooks you wished another pass offered, known limitations.
6. `git add -A && git commit -m "<pass>: <summary>"` in your worktree. **Do not push. Do not touch other branches.**
7. Reply with a concise summary (max 15 lines): headline improvements, files touched, parity result (counts of LOGIC? entries and why they are fine), perf numbers vs baseline, anything unfinished or risky.
