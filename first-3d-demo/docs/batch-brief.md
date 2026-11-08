# Creature Catch 3D: brief for a creature batch

Creature Catch is a Game Boy Advance style creature-catching JRPG. This project remakes its first chapter in 3D: cel-shaded, ink-outlined toon models in three.js r128 (global `THREE`). Five creatures are finished (drizzlon, mossback, embroak, clovermouse, hopsprout) along with 20 animated moves. Your batch adds more creatures and moves. Other agents are building other batches in the same folder at the same time.

The person paying for this watches their usage, so work efficiently. Aim for a faithful, readable model in about two compare passes per creature, and stop when it clearly reads as its sheet. Don't polish endlessly.

## Hard rules

- Write only these: `src/lines/<batch>.js`, `src/movesets/<batch>.js`, anything under `test/<batch>/`, and `/tmp/<batch>/`. Never edit any other file in `/home/claude/cc3d`, because other agents depend on them. If you think a shared file needs a change, describe it in your final report instead.
- Build only like this: `python3 /home/claude/cc3d/tools/build.py --lines <batch> --out /tmp/<batch>/game.html`. Never use the default output.
- No git, no GitHub, nothing published anywhere.

## Read first

- `src/creatures.js` holds the creature runtime: `makeCreature`, the `C` helpers (`part`, `paint`, `build`, `ell`, `eyePair`, `glow`), the `ACT` body actions and the idle/act hooks, plus the five finished creatures. Those five are the quality bar, so reuse their techniques.
- `src/kit.js` has the builders and shapes: `builder().add(geo, mat, pos, rot, scale, { tint, ink, uv })`, `lathe`, `tube`, `slab`, `lumpy`, `rbox`, `onBall`, `qDir`, `toon`, `inkMat`, `rgb`.
- `src/moves.js` has the move helpers and the finished moves (`M.tackle`, `M.splashjab`, `M.emberlash`, `M.thornbarrage` and the rest).

## A creature (in `src/lines/<batch>.js`)

```js
CREATURE_DEFS.rapidrake = {
  height: .78, eyeY: .55, width: .6,   // model units: feet on y = 0, facing +z (Drizzlon is .64 tall)
  size: 1.15,                          // shown size next to its base form: base 1, middle stage about 1.15, final about 1.3
  mouth: [0, -.07, .16],               // in the 'head' part's space: where breath and spit come from (or mouthPart: '<part>')
  hopper: false,                       // true if it hops when it walks
  build(C, K) { /* K is KIT */ },
  idle(C, t, dt, walk, st) { },        // every part is put back to rest each frame before this runs
  act(C, name, u, t) { },              // extra part motion during a body action, u from 0 to 1
  actions: { },                        // optional: actions only this creature has, { name: { dur, hit, hold, f(u, o, C, st) } }
};
```

- Make every moving piece with `C.part` so it resets each frame. Call the head part `head`, because `mouth()` uses it.
- Ink outlines come from `C.build` automatically. Set `ink: 0` to `1` per piece, where 0 means no outline.
- Use `C.M()` materials with vertex tints (`tint: '#hex'` or `(v, n) => K.rgb(...)`), or `C.paint` for painted skins, as the finished five do.
- Keep each creature under about 40k triangles.
- Body actions the moves use: attack, cast, hit, hop, happy, shake, roar, faint, appear, vanish, sleep, crouch, spit, flick, puff, curl, spin, chomp, tuck. Check that your creatures look right in them, and add `act()` motion for wings, tails, heads and ears where it helps (Drizzlon's `act` is the example).
- Base the shapes, colours and proportions on the sheet, and fall back on the original sprite where the sheet's views disagree.
- For an evolution, start from the earlier form's code and grow it, so the family reads as one creature growing up.

## A move (in `src/movesets/<batch>.js`)

```js
MOVES3D.define('pebbletoss', (h) => async (u, t) => {
  // u and t are the user and target sides: { model, home, scale, isFoe, mon }
  await h.act(u, 'spit');
  // ... effect ...
  return back; // optional: a function that finishes the move alongside the hit (a dash home)
});
```

- `h` holds S (the scene), fx, env, V, every, add, drop, own, INK, toon, `center(side, up)`, flat, sideOf, toCam, `H(side)`, `act(side, name)`, glow, flash, ring, streamMat, stream, solid, leafMesh, throwIt, cloud, shield, aura, ghost, streak, dust, dash, leap, impact, and M (the finished moves, which you can call). Read `moves.js` for each helper's arguments.
- The move's promise resolves the moment it lands, which is when damage shows. The battle draws the hit flash, HP, stat arrows, sleep and status, so the move doesn't.
- A new body action that any creature can use goes in your moveset file as `CREATURE_ACTIONS.<name> = { dur, hit, hold, f(u, o, C, st) }`. Here `o` is the whole-body offset: x, y, z, rx, ry, rz, sx, sy, sz. Only add one when no existing action fits, and give it a name specific to your move.
- Rough lengths: a basic move about 1 s, a status move about 1.2 s, a signature move about 1.5 s, a strong move about 2 s. Colour moves with their type (`DATA.TYPE_COLORS[type]`, three shades). For basic moves a lunge is enough. Signature and strong moves should show off the creature's body.

## Testing

All of it runs headless through `node /home/claude/tools/run.js "<url>" <steps.json> <width> <height>`. Steps are JSON objects like `{"wait":ms}`, `{"key":"z"}`, `{"eval":"js"}`, `{"until":"js expression","timeout":ms}` and `{"shot":"/path.png"}`. Software rendering is slow, so be generous with waits. Fix anything printed as `CONSOLE error` or `PAGEERR`.

1. **Turnaround against the sheet.** Render `file:///home/claude/cc3d/test/turn.html?who=<id>&lines=<batch>` at 1800x420 with steps `[{"wait":2500},{"shot":"/home/claude/cc3d/test/<batch>/turn_<id>.png"}]`. Then run `python3 /home/claude/cc3d/tools/compare1.py /home/claude/cc3d/test/<batch>/compare_<id>.jpg <id>=/home/claude/sheets/ch1/all/turnaround-<id>.png,/home/claude/cc3d/test/<batch>/turn_<id>.png` and look at the result with Read. The views are front, front 3/4 facing left, side facing left, back 3/4, then back.
2. **Poses.** Use `file:///home/claude/cc3d/test/creatures.html?who=a,b&lines=<batch>&act=<action>&at=<seconds>&yaw=<rad>&zoom=<k>` at 1400x700.
3. **Moves in battle.** Build, then open `file:///tmp/<batch>/game.html?at=moves&who=<id>&vs=<foe id>&lowres`, which is the Move Demo, at 960x640.
   - `BATTLE._demo` is `{ i, sel, busy, msg }`. In `sel`, 0 means "play all" and 1 onward are the creature's moves in learnset order.
   - Wait until `BATTLE._demo && !BATTLE._demo.busy`, set `BATTLE._demo.sel`, then press `z`.
   - To grab frames mid-move, freeze the game clock: eval `G._t0 = G.t` once the move starts, then `G.stopAt = G._t0 + 0.4`, wait about 1 s and shoot. Set `G.stopAt = null` to carry on.
   - Shared moves another batch makes will fall back to Tackle in your build. That's expected.

## Your sources

- Sheets: `/home/claude/sheets/ch1/all/turnaround-<id>.png`. Each is 1536x1024, a 3 by 2 grid: front, front 3/4, side on the top row; back 3/4, back, top-down on the bottom row.
- The original 2D sprites: `/home/claude/assets/creatures/<id>.png`.
- Game data and lore: `DATA.CREATURES` and `DATA.LORE` in `src/data.js`.

## Done means

- Every creature in your batch has been compared against its sheet, with the montage saved.
- Idle, walk and the body actions look right.
- Each of your moves plays in the Move Demo without errors, with a few frames saved to `test/<batch>/`.
- A short final report: what you built, where the montages are, and anything still off or any shared-file change you'd want.
