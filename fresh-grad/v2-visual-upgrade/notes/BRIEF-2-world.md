# Pass 2 — World exteriors ("the street, the buildings, the ground, the park")

Read `BRIEF-common.md` and `DESIGN.md` first. Pass name for scratch/notes: `world`.

## You own
`src/js/03-gfx-helpers.js` (textures, windows, doors, signs, awnings, roof props), `04-buildings.js` (building shells and facades), `06-filler-street.js` (filler buildings, street furniture, park dressing), `09-ground.js` (ground chunks, pond/water, puddles), `10-props.js` (placed props), `26-shop-fronts.js` (storefront details, badges, marquee, icons), `30-seasons.js` (seasonal ground, trees, rooftop snow). Plus new files named after those (e.g. `src/js/04b-facade-detail.js`). No CSS or HTML.

## Do NOT touch
Lighting/sky/weather/people/cars (pass 3), interiors (pass 4), UI (pass 5). Hit-boxes: `BLD`, `DECO`, `BOXES`, `TREES`, `solidAt`, door positions stay exactly as they are. You may change how a building, tree or prop is *painted*, never where its collision is.

## Where the game currently is (see baseline shots `*-town-*`, `*-season-*`, `*-weather-*`)
Flat elevation-style facades with brick/siding/panel/stucco patterns, flat window rectangles with a mullion and sill, scalloped awnings, small roof props, 1px edge highlights, a soft ground shadow, ground chunks with tiling pavers/asphalt/grass textures, a pond with lily pads and ducks, trees as stacked circles, per-season tinting.

## Ambition list (pick by impact, do as many as you can do *well*)
**Facades with volume**
- Window **recess + parallax**: frame reveal with inner shadow on top and one side, deeper sill with drip edge, glass with sky gradient, curved reflection streak, and an *interior glimpse* (curtain/blind/shelf/lamp silhouette, varied per window via `hash01`) that shifts a couple of px against the frame with `CAM.x/CAM.y` so the wall feels thick. Night windows: warm interiors with a visible room (ceiling light, silhouette, TV flicker for the blue ones) — the lit-rect/glow plumbing (`litRect`, `addLight`, `addEmit`) must stay the way lighting expects it.
- Cornices, string courses, quoins, pilasters, lintels/keystones on brick buildings; window headers; downspouts and gutters; fire escapes on a few apartment-style buildings; AC units and cables; ivy that actually looks like leaves; wall-mounted lamps with proper brackets; conduit and meters at the base.
- Weathering by seed: streaks under sills, efflorescence, patched brick, faded paint, soot at the roofline, moss at the base, sun-bleached top. Subtle, varied, never noisy.
- Roofs/rooflines: parapet cap with thickness and shadow, roof props with real form (water tower, vents, antenna, satellite dish, skylight), and an **overhang shadow** cast down the facade under the roof band.
- Storefronts: window decals/lettering, shelf glimpses, hanging signs on brackets, A-frames with chalk text feel, neon with tube thickness and bloom hint, awnings with fabric folds, stitching and a cast shadow; door hardware, kick plates, mail slots, welcome mats; the round door badges + OPEN/CLOSED plaques crisper and richer; cinema marquee bulbs and posters detailed.
- The five key buildings and the six workplace exteriors (the work building changes per degree: `dr` colours/roof sign) deserve hero treatment: employer-specific details (server-room glow, workshop roll-up door, red cross & ambulance bay, glass lobby with a conference table, brick schoolhouse bell, kitchen vent steam), all still inside the same footprint.
- Contact AO where the facade meets pavement (dark gradient + dirt line), plus a subtle vertical light gradient up each facade (sun hits the top, bounce light from the street at the base).

**Ground**
- Sidewalk: per-slab tone variation, expansion joints, hairline cracks, gum/stain specks, tree-pit grates and tree guards, curb with chip and rounded lip, painted curb sections, drain grates, utility covers with embossed text feel, manhole variety, tactile paving at crossings, worn crosswalk stripes with road-grime, oil stains, tire-track polish, patched asphalt, faded lane arrows. Wet-weather response stays driven by existing `A.wet`.
- Park: grass with larger-scale tone drift and mowing stripes, clover/dandelions, worn dirt desire-lines, tidy path edging (stone/sand), flower beds with real flowers (layered petals), hedges, mulch, a fountain with stone carving detail and animated water ring/foam (live layer), picnic blankets with fabric folds and baskets, pond with depth gradient, bank stones and reeds, water with sky reflection and animated caustic ripples, lily pad highlights, ducks nicer.
- Trees and bushes: layered canopy clumps with highlight/shadow lobes and leaf texture, trunk with bark lines and roots, branching silhouettes for winter, blossoms in spring, fruit/leaf litter in autumn, snow caps with soft edges; subtle sway that is already supported by `FX.wind`.
- Props: benches (slats, armrests, iron legs), bins, hydrants, mailboxes, newspaper boxes, bike racks (with bikes), bus shelters (glass reflections, poster, frame details), planters, lamp *heads* (the lamp pole drawing; light pools are pass 3), park gate, bandstand, market stalls.
- Seasons (`30-seasons.js`): each season should be unmistakable and gorgeous — spring blossom drift/petals on paths, summer deep greens + dappled canopy shade patches, autumn leaf litter drifts + gold/rust canopies, winter snow with sparkle, ice on the pond, icicles, snow-laden benches/roofs.

## Technical notes
- Building shells are painted once into `SHELL` sprites (key includes `GC.res`); `SHELL.clear()` happens above 26 entries — don't blow memory. Ground is cached in `GC` chunks of 448 px at screen resolution (max 20). Put static detail there.
- Parallax for window interiors must be cheap (draw the interior glimpse live as a small clipped blit offset by camera, or cache an interior sprite per window style and blit it; don't redo per-window path work every frame for hundreds of windows — only for windows in view).
- Use the existing `shade`, `mix`, `patFill`, `makePat`, `rr`, `hash01`, `mulberry32` helpers; add new patterns with `makePat`.
- `FX.nf` is night factor; `FX.A` is the sky state; keep `litRect/addLight/addEmit` calls for anything that should glow at night.
