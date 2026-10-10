# Pass 3 — Atmosphere, lighting and living things ("sky, light, weather, people, cars")

Read `BRIEF-common.md` and `DESIGN.md` first. Pass name for scratch/notes: `atmo`.

## You own
`src/js/05-people-draw.js` (`drawPerson` and friends: player, pedestrians, kids, coworkers, shop people), `07-npcs-traffic.js` (**drawing code only**: `updateNpcs`, `updateCars`, traffic-light timing, routes stay untouched), `08-camera-sky.js` (sky, sun/moon, stars, clouds, skyline; `skyAt`, `weatherAt`, `beginFrame` can gain *visual-only* fields but their existing outputs must stay the same), `10b-lighting-fx.js` (shadow pass, light map, overlays, particles, rain/haze), `19-talk-people.js` (**only** the name-tag/speech-bubble drawing functions), `23b-player-bike.js` (bike + umbrella), `30b-weather-particles.js` (snow/storm/fog, particles, interaction markers, screen wipe, confetti, `MUSIC` visuals NOT audio). Plus new files named after those. You may add `src/css/03b-atmosphere.css` and create overlay elements from JS (e.g. inside `#stage`) for CSS-based post effects; do not edit `body.html`.

## Do NOT touch
Facades/ground/props/trees (pass 2), interiors (pass 4), UI (pass 5), minigames/scenes (pass 6), the cutscene (pass 1). Do not alter collision/hit sizes; keep sprite footprints (feet position, ~40 px figures) compatible with name tags, bubbles, click targets and interaction rings.

## Where the game currently is (baseline: `*-town-*` at several times of day, `*-weather-*`, `*-season-*`)
A sky gradient keyed by hour (`SKY_KEYS`), flat disc sun/moon, blob clouds, two skyline layers, a multiply light-map for night with radial glow sprites, projected sun shadows in one path, particles for leaves/birds/steam, rain streaks, snow, fog, a CSS vignette and golden-hour wash. People are chibi (round head, dot eyes, rounded torso), cars are flat top-down shapes with headlights.

## Ambition list
**Light & colour (biggest visual lever in the game)**
- A proper **colour-grade per time of day** (warm shadows at dawn/dusk, cool teal shadows at noon, magenta/orange twilight, deep indigo night) applied in the light pass, plus subtle **bloom** on emissive things (windows, lamps, neon, headlights, traffic lights) — a cheap blurred additive copy of the emit layer at 1/4 resolution is enough.
- **Light shafts / god rays** at golden hour through gaps between buildings and in the park; dust motes drifting in them; lens-flare ghost on the sun when on screen.
- **Soft shadows**: shadow blur grows with shadow length, contact core darker than penumbra; cloud shadows drifting across the street in sunny weather; tree dappled-shade patches in the park.
- **Wet look**: on rainy days, a reflection pass (vertical smears of lamps/headlights/neon/signs on asphalt and pavement), specular glint on wet surfaces, puddle ripples with proper rings, rain splashes at ground, drips from awnings/lamp heads, window streaks.
- **Edge atmosphere**: very subtle tilt-shift-like soft edges (CSS mask overlay is fine) and film grain/dither to kill banding; keep the existing `#vig`/`#warm` working (you can restyle their gradients through your own CSS if beneficial).
- **Depth haze** on the far skyline and a richer skyline: more varied silhouettes (towers with setbacks, spires, water tanks, cranes), per-layer atmospheric colour, window grids that light up in clusters at dusk, aircraft blinkers and a slow plane/blimp occasionally, shooting star at night (pure visual).
- **Sky**: soft layered volumetric-looking clouds (several lobes, lit tops/shaded bellies, sun-edge rim), sun disc with bloom and rays, crescent moon with phase look and halo, twinkling stars with a few brighter, milky haze, sunset gradient banding, rainbow after rain (visual only, rare), storm clouds heavy and dark with lightning flicker that lights the scene.
- **Weather**: snow with depth layers (near big soft flakes, far fine), wind gusts, snow settling feel; fog with layered drifting banks and light scattering around lamps; thunderstorms with convincing flashes.

**Characters (see DESIGN.md "Characters")**
- Rework `drawPerson` for much higher fidelity while keeping its signature and footprint: better proportions, hair styles that read (short/neat, long/loose, top knot, curly crop, cycling cap) with volume and highlight, a face (eyes with highlight, brows, small mouth, cheek blush, nose hint), clothing folds/collar/cuffs/buttons/hem, hands, shoes with sole line, smooth walk cycle with arm swing, bob, lean and cloth sway, breathing idle, sit/stand variants used by interiors (check every call site, including scale 0.62–0.82 kids and back-turned seated kids), head turns, a sun-direction contact shadow, rim light at dusk, warm window-light tint near buildings at night. The **player keeps the coral tee** and gold identification ring (restyle the ring beautifully). Look tables (`PLAYER_LOOK`, `NPC_LOOK`, `LOOK(...)`, hair style ids 0–4, colours) must keep working: customisation purchases (haircuts, shirts, pants, cycling cap) must visibly apply.
- Cars (`07-npcs-traffic.js` draw functions): top-down cars with roofs, windshields with reflections, wheel arches, body highlights, taillights/brake lights, headlight cones, taxi roof sign, delivery van, driving shadow, wet-road reflection; traffic lights with housings and glow.
- Bike + umbrella + pizza carry (`23b-player-bike.js`): a nicer bike (spokes motion blur, chain, fenders), umbrella with ribs, scalloped edge, water droplets and drips.
- Name tags and speech bubbles: crisp, with soft shadow and a little tail; keep them above the lighting pass so they stay legible at night.
- Particles: leaves with real shapes and tumble, petals, butterflies, birds, steam, coin/heart/sparkle effects with additive glow, footprints in snow, ripples in puddles.
- Interaction markers, screen wipe (`wipeTo`/`stepWipe`: keep timing and phases exactly), confetti: more beautiful, same behaviour.

## Technical notes
- Everything per-frame must scale with the viewport. Bloom/god-ray/reflection passes should render at reduced resolution into offscreen canvases that you reuse (allocate once, resize on change). Gate heavy passes on `FX.nf`, weather, time, and on `QUAL.cap` (the auto-quality tuner) and `REDUCED`.
- The light map is multiplied over the scene; name tags/bubbles are drawn after it. Keep that ordering.
- The title screen (`11-title-scene.js`, pass 1) reuses the town renderer — your improvements automatically carry over; keep `render`/`beginFrame` entry points and parameters compatible with `titleFrame`.
- Sprite drawing for the player/NPCs is used on the town, interiors, school and scenes (`SC.draw` in pass 6 calls `drawPerson`) — keep the call signature and coordinate convention identical (`drawPerson(c, x, y, look, ...)` — verify at every call site with Grep before changing).
