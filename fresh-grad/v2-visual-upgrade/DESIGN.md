# Fresh Grad v2 — visual direction

The v1 game is already charming: a warm little 2D town, a navy-glass UI, marigold for money and primary actions, coral for the player. v2 keeps that identity and pushes **fidelity, depth and polish** everywhere. Nothing about *what you can do* changes.

## Non-negotiables

1. **No gameplay changes.** No new features, no new things to do, no new rules, no rebalancing, nothing removed. Same save format (`freshgrad.save.v1`), same keys, same buttons, same text meaning.
2. **Logic functions stay byte-identical.** Only drawing and presentation code changes. `node tools/parity.js` must report `REMOVED (0)` and every `LOGIC?` entry must be explainable (usually: a function that mixes a tiny bit of logic into DOM building).
3. **Everything that exists keeps working** — all 6 jobs and their shift games, all shops/interiors, school, fishing, deliveries, dreams, scenes, phone, level-ups, recap, seasons, weather, mobile touch pad.
4. **Opens by double-click.** Plain classic `<script>`, no modules, no `fetch` of local files (breaks on `file://`), no build step needed to *play* (`index.html` is the built single file). External dependencies: Google Fonts only, always with a good fallback stack. Optional art in `assets/` is loaded with `new Image()` and must degrade gracefully when missing.
5. **Performance.** Baseline `render()` is ~2–3 ms. Budget for v2: stay under ~3× baseline in `tools/perf.js` for every scene and never add per-frame work that scales with the world instead of the viewport. Static detail goes into the existing cached sprites / ground chunks (painted once). The adaptive resolution (`QUAL`) must still work. Respect `prefers-reduced-motion` (`REDUCED`).
6. **Accessibility/legibility stay.** Contrast on text, focus rings, 44px touch targets on mobile, no text baked into images.

## Look: "golden-hour small city, with real depth"

The game is a 2D elevation/top-down hybrid. We get a 3D feel from **light, shadow, parallax and material**, not from re-architecting.

### Light model (use this vocabulary everywhere)
Every surface = base colour → ambient tint of the time of day → directional key light (the sun, from the upper-left, see `FX.sh`) → bounce/rim → ambient occlusion → emissive (windows, lamps, signs). Concretely:
- **Never pure black or pure white.** Shadows are deep navy-violet (`#0b1220`–`#1a1f3a`), cooler by day, warmer near lamps. Highlights are warm cream.
- **Contact shadows + ambient occlusion** wherever two things meet: building base on pavement, props on ground, awnings over facades, window reveals, door recesses, under roof overhangs, between stacked furniture and floor.
- **Recess and parallax.** Windows/doors are *set into* the wall: inner shadow on the top and one side, a sill, and interior content that shifts a few px against the frame with camera movement. Skyline layers already parallax; add depth haze (far = lighter, bluer, lower contrast).
- **Bevels and edges.** A 1px light edge on top/left faces and a 1px dark edge on bottom/right faces turns flat rectangles into volumes.
- **Material read.** Brick, stucco, metal panel, wood, glass, fabric, stone, water, foliage must each *look like* themselves at a glance: different specular, grain, wear. Add subtle weathering (streaks under sills, moss at the base, sun-bleach at the top, chipped paint).
- **Glass and water reflect.** Sky gradient + a soft diagonal glint on glass; wet roads mirror lamps and neon as vertical smears; the pond reflects the sky and trees.
- **Atmosphere.** Light shafts at golden hour, bloom on lamps/neon/windows, faint haze with distance, god-rays through trees in the park, warm rim on the player at dusk.
- **Depth of field cheat.** A very subtle edge softening/vignette and a touch of grain/dither keeps flat gradients from banding and makes it feel photographed.

### Detail density rule
No flat fill larger than ~120×120 px without a texture, gradient, grain or detail on it. Every prop gets a highlight edge and a shadow. Repetition is hidden with per-instance variation seeded from the existing hash/seed helpers (never `Math.random()` in static art — use `hash01`/`mulberry32` so cached art is stable).

### Palette
Keep the established tokens (`:root` in `css/00-base.css`) — you may *refine and extend* values, never remove a token. Core: navy ink `#0b131e → #1c2b3d`, marigold `#ffc247`, coral `#ff7a59`, water `#47b8ff`, rest `#a393ff`, food `#ff9a3d`, mood `#ff7eb6`, good `#5be3a0`, bad `#ff6b6b`. Per-degree colours (`DEGREES[].wall/roof/accent`) keep identifying jobs everywhere.

### Characters
Current townspeople are small, simple figures. Upgrade to: proper proportions (head ≈ 1/4.5 body), hair with volume and a highlight, a face with at least eyes/brows/mouth reading at close range, clothing with folds/seams/collar/cuffs, hands, two-tone shoes, a **contact shadow that follows sun direction**, a 4-frame (or smooth procedural) walk cycle with arm swing and body bob, idle breathing, lean into the direction of travel. The player's **coral shirt** stays the player's identity. Keep sprite footprints (width/height/feet position) compatible with collision, name tags, speech bubbles and click targets.

## UI language ("after-dark navy glass")

- **Surface recipe**: translucent navy gradient + `backdrop-filter: blur()` + 1px inner top highlight (`inset 0 1px 0 rgba(255,255,255,.10)`) + 1px outer hairline + soft ambient shadow + a very low-opacity noise/dither texture (inline SVG data-URI is fine). Layers: base, sheen, content.
- **Radii**: 8 / 12 / 16 / 22 / 28. **Spacing**: 4-pt grid. **Type**: Bricolage Grotesque (display), DM Sans (body), DM Mono (numbers/labels); add a serif only where it earns it (diploma, cutscene titles) with a safe fallback.
- **Primary button**: marigold gradient with specular top edge, pressed state, focus ring, subtle sheen sweep on hover. Ghost button: glass.
- **Motion**: 120 ms micro, 200 ms state, 320 ms entrance; easing `cubic-bezier(.2,.8,.2,1)`; springy only for rewards. Always provide the `prefers-reduced-motion` fallback.
- **Icons**: crisp inline SVG, 1.75–2 px round strokes; the game already ships many — refine rather than replace, keep them in the same family.
- **Numbers** are tabular and mono; gauges look like glass tubes with a liquid fill, tick marks and a low-state pulse.
- Mobile first-class: everything must work at 390×844 and at 1280×720.

## The opening (cutscene, title, degree picker)

This is the first impression and gets the most love. See `notes/` for the cutscene plan. Cinematic rules: letterbox bars, deliberate camera moves (push-ins, parallax drifts), layered depth (foreground silhouettes, mid action, background), real light (stage spots, volumetric beams, lens flare, dust motes), film grain, colour grade shift from cool anticipation to warm triumph, sound hits synced to beats, typography with presence. Keep the **same story beats, same captions, same timing skeleton (`CUT.t`, `CUT_END`, `CUT_CAPS`)**, same Skip button, same hand-off to the degree picker.

Optional illustrated plates from `assets/` may be layered in when present (see `../IMAGE_PROMPTS.md`) but the procedural scene must stand on its own.

## How to work on this (for each pass)

- Edit only the source files you own (listed in your brief). Add new top-level helpers in *your own* files; do not rely on helpers another pass might add.
- Build to a private path, never to `index.html`: `node tools/build.js --out <scratch>/mine.html`
- Look at it: `node tools/tour.js <scratch>/mine.html <outdir> --only=<groups>` then open the PNGs. Compare with baseline shots from the same group (`v1-original/Fresh_Grad_Seasons.html`). Iterate until it is clearly, visibly better — at least three look-and-refine rounds.
- `node tools/perf.js <scratch>/mine.html` for frame cost. `node tools/parity.js v1-original/Fresh_Grad_Seasons.html <scratch>/mine.html` for logic safety.
- Write a short `notes/<your-pass>.md`: what changed, anything intentionally untouched, and any hook you wished another pass offered.
