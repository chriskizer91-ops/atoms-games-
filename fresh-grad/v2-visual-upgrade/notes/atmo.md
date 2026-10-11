# Pass 3 notes: atmosphere, light and living things (`atmo`)

Everything here is drawing/presentation. No game logic, collision, hit-box or footprint changed.

## Files
Edited: `js/05-people-draw.js`, `07-npcs-traffic.js` (only `drawCar`, `trafficLightItems` and new helpers; `updateNpcs`, `updateCars`, `lightState`, `carKind`, routes untouched), `08-camera-sky.js`, `10b-lighting-fx.js`, `19-talk-people.js` (only `drawNpcTag`), `23b-player-bike.js`, `30b-weather-particles.js` (audio/`MUSIC`/`SFX` byte-identical).
New: `js/08b-sky-extra.js` (clouds, skyline, sun/moon/stars/rare sights), `js/10b2-atmo-post.js` (bloom, light shafts, flare, wet look, cloud shadows, dapple, grain/tilt DOM), `css/03b-atmosphere.css`.

## What changed
**Light and colour.** Time-of-day grade: refined ambient tints in `SKY_KEYS` (peach dawn, orange/magenta dusk, deeper indigo night), shadows tinted per time (`FX.shc`: teal-navy at noon, warm violet near the horizon), a warm/cool split across the light map from the sun side, thunderstorm darkening plus lightning that lights the street. Bloom: lit windows, signs, lamps, headlights and traffic lights go into a 1/4-res layer that is blurred through 1/8 and 1/16 and added once (also indoors, through `lightPass`). Golden-hour light shafts (world anchored, seeded, slow shimmer), narrow beams through tree canopies, drifting dust motes, lens-flare ghosts when the sun is on screen. Soft shadows: penumbra strokes that grow with shadow length, deeper contact cores, figure-shaped people shadows, drifting cloud shadows from soft sprites, dappled leaf light under trees. Headlight cones are soft-edged (`BEAM2`).
**Wet look.** Rain days darken the road with a sky sheen, puddles get spreading rings, splashes pop on road and pavement, lamps/traffic lights/headlights leave vertical smears (`FX.refl`, filled by `drawCar` and `trafficLightItems`). Rain is three depths with gusts.
**Sky.** Layered gradient with horizon banding, sun with disc/bloom/rays, moon with real phase from the day number, twinkling coloured stars with a few cross-sparkles, milky haze, shooting stars, cached volumetric cloud sprites (lit tops, shaded bellies, sun-edge rim, retinted one sprite per frame as the light changes), storm slate + bolt, rare rainbow after rain, plane with contrail, blimp. Three skyline layers with towers, setbacks, spires, water tanks, cranes, depth haze, window patterns that switch on in two waves at dusk, blinking mast lights. Tree line and wall are lit by the sky.
**Weather.** Snow in three depths with gusts and a ground haze, fog banks drifting at three depths plus lamp scattering, storm flashes with a double strike.
**People.** `drawPerson` rewritten around the same footprint (feet at y, ~41 px tall, 15 px shoulders). Head about 1/4 of the body, six garment types (the clothes shop colours map to tee/button-down/sweater/polo/flannel), four hairstyles plus cap (`style` 0 short, 1 long, 2 top knot, 3 cycling cap, 4 curls) with volume/highlight, face with eyes/brows/nose/mouth/blush, collars, cuffs, belt, hands, two-tone shoes with soles, 16-step walk cycle with arm swing, bob, lean and cloth sway, breathing, blinking, sun-direction contact shadow, dusk rim light, gold player ring restyled. Back view for seated kids and crowds. Figures are cached as small sprites per look/facing/step (kids and riders at other scales draw directly); the salon and mic close-ups draw directly at their large scale. A rider pose (`o.ride`, pedal phase) is used only by the player on the bike.
**Cars.** Side and top views with gradient body, glass with sky reflection and glint, doors, mirrors, bumpers, wheel arches with turning hubcaps, taxi roof sign and chequered band, delivery van. Static body is cached per kind/colour/time-of-day. Traffic lights have housings, hoods, lenses and glow.
**Other.** Bike (spokes, fenders, chain, cranks, saddle, bars, lamp) now mirrors correctly when facing left; umbrella with ribs, scalloped panels, beads and drips; glass name plate and speech bubble; leaves with real shapes and tumble, petals, butterflies, birds, steam puffs, fireflies; coin/heart/spark with additive glow; boot and tyre prints in snow; door/spot/click markers; feathered iris wipe with a warm rim (timing and phases unchanged); confetti with streamers and flips.
**CSS layers.** `#vig` restyled, `#warm` uses the sun colour (`--wc`) with soft-light, film grain and a 1 px tilt-shift on the top and bottom edges (town only; both hidden when the quality tuner steps down or in reduced motion for the grain animation).

## Performance
`tools/perf.js` (render avg ms, mine vs v1): street-noon 2.5 vs 2.1, street-night 3.1 vs 2.5, park-winter 2.5 vs 1.9, street-rain 2.9 vs 3.5, interior-apartment 1.4 vs 1.4, interior-diner 0.75 vs 0.75. People and car bodies are sprite-cached; bloom/shafts run on 1/8 resolution canvases allocated once. `atmoTier()` turns off bloom, shafts, flare, dust and reflections when `QUAL.cap < 0.8`; `REDUCED` freezes drift, grain animation, blink, sway and cloud movement.

## Parity
`REMOVED (0)`. LOGIC? entries, all presentation only: `NIGHT_KEY`/`SKY_KEYS` (ambient colour values), `skyAt` (one added visual field `hour`), `beginFrame` (resets `FX.refl`, sets shadow and sun colours), `POST` (more memo fields for the CSS variables), `STORM` (two extra visual fields: re-strike timer and bolt shape).

## Intentionally untouched
Audio (`MUSIC`, `SFX`), `updateNpcs`/`updateCars`/`lightState`, facades/ground/trees (pass 2), interiors (pass 4), UI (pass 5), `drawPizzaBox` and `SC.draw` (pass 6). The old `SKYLINE` arrays are still generated (names must stay) but unused; `skyline` now lives in `SKY3`.

## Wishes for other passes / tools
- `tools/tour.js` `scenes` group evaluates `PLAYER_LOOK` in Node (ReferenceError at the salon stop) so it aborts the run before `dreams`, `ui`, `fishing` and `mobile`. Run groups separately or fix the stop to evaluate inside the page.
- Pass 2 could draw trees with their own dapple/translucency; mine only adds light spots in the shadow ellipse.
- Pass 6: `drawPizzaBox` is positioned for the old standing pose (`S.py - 9` when riding); the new seated rider's bars are about 4 px lower.
- Pass 4: `drawBike` is shared with the bike shop; its geometry now mirrors for `face = -1` and the saddle sits 0.4 px lower. Footprint (wheels at x +/- 10, 12.8 px tyres) is unchanged.

## Known limits
Weather streaks, snow and fog are screen-space (they do not parallax with the camera). The moon can be hidden by the toast stack when the camera sits at the very top of the world. Sprite-cached people are drawn bilinear at `ceil(scale)` resolution, so on a 1x display they are a hair softer than vector drawing.
