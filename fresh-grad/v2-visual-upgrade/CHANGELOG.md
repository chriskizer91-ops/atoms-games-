# v2 — visual upgrade (what changed)

**Same game.** No new features, nothing removed, same save file. Only drawing and presentation code changed.
`tools/parity.js` against v1: **0 removed** top-level definitions; the handful of logic-looking entries it flags are colour tables and
extra visual fields only (listed in each pass's notes). `tools/playthrough.js` (real clicks and key presses: new game, walk, shop,
phone, menu, sleep, work a shift, save/continue) gives **identical results on v1 and v2**. `tools/tour.js` visits every screen
(144 shots) with **no page errors**. Frame cost is within ~1.2x of v1 (several scenes are cheaper).

## The opening (pass 1)
- Graduation cutscene rebuilt as a shot film: virtual camera (crane-down open, walk track, handshake close-up with rack focus, whip to the crowd, hat-toss crane-back in slow motion), layered pre-baked set (curtains, banner, valance, planks, podium, sky, clock tower, oaks, three-tier audience), IK-armed figures with faces, hair, gown/stole/mortarboard, tassel pendulums, the Dean and eight individual classmates, a rolled diploma with fibres, ribbon and wax seal, tumbling caps, depth-layered confetti, spot beams with dust, sun flare, grade/grain/vignette/letterbox, glass captions, Fraunces title cards, a layered score and foley. Same beats, captions, timing and Skip.
- Title: chrome "Fresh" / foil "Grad", animated mortarboard, glass buttons, graded live town with parallax.
- Degree picker: emblem cards for the six jobs, deckled parchment diploma with a typed calligraphic field and a re-stamping gold seal, job-offer letter.
- **Optional illustrated art**: drop the PNGs listed in `../IMAGE_PROMPTS.md` §11 into `assets/` (stills, plates, poses, title art, diploma) and they are used; nothing breaks without them. `?noart` forces procedural.

## World exteriors (pass 2)
Recessed parallax windows with rooms behind them, rebuilt shells (sun and bounce light, weathering, cornices, overhang shadows), hero buildings, shop fronts that show what they sell, detailed pavement/asphalt/park/pond, textured trees and props, richer seasons (autumn leaf piles, spring petals, summer dapple, winter snow banks, icicles, cracked ice).

## Atmosphere and people (pass 3)
Per-time-of-day colour grade, soft shadows, bloom, golden-hour light shafts and lens flare, headlight cones, wet-road reflections and puddle rings, layered rain/snow/fog, volumetric clouds, moon phases, a three-layer hazy skyline, film grain and edge softening. Every person redrawn (faces, garments, hairstyles, a 16-step walk cycle, dusk rim light), plus cars, traffic lights, bike, umbrella, name tags, bubbles, particles, markers, wipe and confetti.

## Interiors (pass 4)
All 21 rooms and the school repainted: real floor materials, shaded walls with mouldings, windows that show the live sky, ~55 furniture types with form and material, live lights and motion (monitors, LEDs, washers, oven flames, fish tank, claw machine), per-room identity. Static room painted once into a cached layer (cheaper than v1).

## UI chrome (pass 5)
One glass design system; day/night clock disc, glass-vial gauges, coin counter, keycap prompt; textured panel headers with option rows that explain locks; titanium phone with chat bubbles, tier ladder, trophy shelf and a stamped passport booklet; level-up/promotion medallion with foil perk cards; morning-paper recap; a cached high-fidelity minimap.

## Shift games, scenes, dreams, fishing (pass 6)
A new shift shell (hero intro art, medal and till-receipt result) and all six games reskinned (code editor, blueprint pipes, monitor with sweeping ECG, video-call offer dial, classroom echo, stove with ticket rail) — scoring verified identical. 17 scene variants, 14 dream backdrops with camera drift, a fishing view with real sky and reflections, rarity-coloured catch cards.

## Known limitations
- The game is 2D canvas. Depth comes from light, shadow, parallax and materials; a true 3D engine would be a rewrite and was deliberately not attempted.
- The cutscene costs ~2x v1's frame time in software-rendered headless runs (cached layers; render scale is capped and adapts). On a GPU canvas it is much lighter.
- Pose/plate/lineup placement constants in the cutscene art hooks were tuned against placeholder images; expect small nudges once real art arrives.
- Paper-doll part sheets are not wired (see `../IMAGE_PROMPTS.md` §11); poses are.
- First paint of a building/chunk/room costs 8–80 ms once (hidden by fades).
