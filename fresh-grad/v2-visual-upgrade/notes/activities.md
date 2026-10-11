# Pass 6: activities (shift games, scenes, dreams, fishing)

Everything in this pass is presentation. Scoring, timers, spawn tables, difficulty, payouts, fish tables, key handling and the moment things start and end are untouched. Where a function mixes logic and drawing, only drawing statements were added or replaced (parity notes at the bottom).

## What changed

**Shift shell** (`15-activities-core.js`, `15b-actkit.js`, `15c-jart.js`, `07-jobs.css`, `#job` in `body.html`)
- Header with an employer-colourway gradient and a per-job pattern (code brackets, grid, crosses, chart arrows, dots, checker), glossy job badge, glow-head progress bar.
- Intro card: a small illustrated workplace per job (inline SVG, no baked text), numbered briefing with a dashed connector, best-rank medallion when there is a record. `JGLYPH` icons refined (same family, duotone fills).
- Result card: SVG rank medallion (ticks, animated progress arc, gloss sweep, sparkles on S/A), shimmering heading on S, stat tiles, a cream till receipt with perforated edges, ink numerals, barcode and a rank stamp; chalk-style pill for the class activity bonus. Stars and confetti burst for A and S.
- `AK` (canvas helpers: glow sprites, grain, cached offscreen layers, sparkle) and `JFX` (a tiny particle layer over the card: splat, confetti, stars, steam, smoke, rings) are shared by every pass-6 file.

**Six games** (`16-jobgames.js`, `07b/07c/07d` CSS)
- Bug Hunt: a code editor (traffic lights, tabs, branch, line numbers, gutter dots on bug lines, indent guides, punctuation colouring, minimap, blinking caret, status bar with a live bug count). Bugs are glossy beetle badges with draining rings and a pulse when nearly out of time; critical ones are electric bolts. Squash and splat burst on fix, red ring and a shake on an incident. Prod health is a ticked glass tube with a low-state alarm.
- Pipe Fitter: blueprint sheet with rulers, grid and title block; tiles are steel plates with corner bolts, tubes shaded in layers with flanges, amber fluid with flowing bubbles and glow, a detailed pump (spinning impeller, gauge needle) and actuator (piston extends, LED), steam puffs when a turn breaks the flow, sparks and a ring on a seal.
- Triage Rounds: bedside monitor with bezel, scanlines and phosphor; sweeping ECG with the gap ahead of the beam, SpO2 plethysmograph, thermometer bar, a heart-rate LED that blinks at the patient's rate; a paper chart clipped on top (Fraunces italic for the handwriting feel); buttons are punched triage tags with perforation and hazard stripe. The flying-off card now carries a copy of its traces.
- Close the Deal: video-call tile with blurred office, deterministic hair, glasses, jacket and tie per client and a proper face per mood; speech bubble with a tail; glowing hearts; offer dial (ticks, budget band as a glowing arc, gold value arc, needle) in addition to the slider; confetti on a deal, a shake on a rejection or hang-up, a soft pulse ring while a call is live.
- Echo Clap: four cartoon kids at wooden desks (hands meet, mouth opens, clap ring, rising note), a chalkboard header and a chalk-star progress strip, stars on a perfect echo.
- The Line: pass-kitchen with an order-ticket rail (tickets track the pans), stovetop pans with gas-flame rings, a metal rim and sheen, hand-painted food that browns, grills and chars with cook progress, sizzle bubbles, steam, smoke puffs when burnt, a bell flash on "Order up".

**Scenes** (`24-scenes.js`, `24b-scenekit.js`, `24c-scene-salon-dentist.js`, `24d-scene-music.js`, `31b-scene-hang.js`, `08-scenes.css`)
- Static set dressing is cached once per size (`AK.layer`), only moving parts are drawn per frame; `SC.draw` finishes every scene with a colour grade, vignette, letterbox and film grain (`SK.finish`).
- Cinema (curtains, flickering projected landscapes with a runner, beam and dust, rows of audience with rim light, popcorn), laundromat (tiled walls, three detailed machines, tumbling clothes, suds, window light shafts, steam), reading (place-aware: home, chair, cafe, books, park; lamp, page curl, ribbon, mug), salon (gold vanity mirror, cape, scissors and stylist arm, falling clippings, a flash and sparkle reveal), dentist (lamp glare and flare, masked dentist, gloved hand with mirror), open mic / concert (haze, moving spotlights, singer with guitar, band with drum kit, crowd with phones and raised hands), record player, and a themed set for each hang-out place (cafe, pizza, diner, books, park, bakery, cinema lobby) with speech bubbles that pop.
- Captions are subtitles in Fraunces italic with a soft pool behind them.

**Dreams** (`18-dreams.js`, `18b-dream-art.js`, `05-dream.css`)
- One painter per motif with a cached backdrop: dusk sky above a glowing town with three cloud banks, a lamplit feast (or an empty, failing table), a graduation hall with caps, spotlights and crowd, a golden-hour valley, a twilight pond with ducks and fireflies (or cracked earth, a shrinking puddle and a mirage), a gear-ringed clock, a perspective hallway whose doors slide past, papers piling at a door, a quiet aurora and moon.
- Camera push-in and sway, soft rising or falling motes, bloom for good dreams; bad dreams add tapering tendrils, cracks, pairs of eyes, a red vignette and the occasional RGB glitch. Title in Fraunces italic with mood-coloured glow, hairline kicker, glass choice card, glowing timeline.

**Fishing** (`31-activities-extra.js`, `31c-fish-art.js`, `31d-fish-view.js`, `11-fishing.css`)
- The pond uses the real sky (sun and moon follow the time of day, tinted by the ambient colour), cached hazy hills and two rows of seasonal trees, wobbling tree reflections, a glitter path, drifting pads (one with a blossom), reeds, fish shadows under the surface that come to the bobber on a nibble or bite, splash rings and droplets on cast, bite, hook and catch, a jointed rod that bends under load, and a float with a highlight. The cast meter previews the landing spot. The reel meter is a glass tube with ticks, a glowing catch zone and a liquid progress tube.
- Ice fishing: ice with cracks, a dark hole with a frosted rim, snow banks, bare snowy trees and firs, and the angler's breath.
- `drawFishPic` / `fishArt`: ten species with their own markings (bars, stripes, scales, spots, koi patches, glowing moonfin) and an old boot; the catch card has a rarity-coloured halo and rotating rays.
- Park world pieces that live in the same file (`drawStall`, `drawBandstand`, `drawGigMarker`, `drawPizzaBox`) got detail passes; footprints, `BOXES` and light calls are unchanged.

## Intentionally untouched
`JA.rank/mult/diff/focus`, every `tick/key/perf/result` calculation, spawn tables, patient/client/food data, `FISH`, `RARITY`, `rollFish`, `stepFishing` maths, `makeDream`, dream text, `startGig`/`finishGig`, hang-out logic, key bindings, hit areas and all DOM ids and queried classes (`.bug`, `.cl`, `.cs-code`, `.pt`, `.pg`, `.pn`, `.nu-*`, `.bz-*`, `.ec-*`, `.pan`, `.food`, `.pr`, `.nm`, ...). The world is still not rendered behind a job or scene (`frame()` skips it), as in v1.

## Hooks I wished other passes offered
- A handwriting face in `head.html` (for example Caveat or Kalam) for the triage chart; I used Fraunces italic with a script fallback stack.
- Toasts (pass 5) sit on top of the job header while a shift is open; consider hiding them or docking them under the header while `#job` is visible.
- `drawPerson` (pass 3) is used at 4x to 8x scale in the salon, concert and hang-out scenes; any detail it gains shows up there for free, so keep its `s`, `face`, `moving` and colour options stable.
- `GLOW`, `hexRgb`, `mulberry32`, `hash01`, `shade`, `mix`, `mix3`, `rr`, `skyAt`, `season()`, `WINTER()` and `FX.time` are relied on at call time only; please keep their signatures.

## Known limits
- Canvas dreams run at up to 1.5x device pixel ratio to keep full-screen frames cheap. Fishing and scenes use up to 2x.
- Scenes are composed for 16:9; on a phone the same canvas is simply smaller (everything is positioned in fractions of height and width).
- Layer caches (`AK.layer`) are cleared wholesale after 24 entries; a layer repaint can cost a few ms once when it happens (dusk and dawn change the fishing tint every few game minutes).
- `?noart` and `assets/` are not used by this pass; everything is procedural.
