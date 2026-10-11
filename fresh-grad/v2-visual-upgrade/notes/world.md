# Pass 2: world exteriors (notes)

Scope: streets, building facades, ground, park, props, trees, seasons. Drawing only; no layout, collision, door or logic changes.

## What changed

**Sprite kit (`03b-sprite-kit.js`, `03c-wall-extras.js`)**
- `wspr(key, w, h, paint)` caches small painted sprites at the current ground resolution (`GC.res`), with a pixel budget and oldest-first eviction. Text sprites are keyed by a font generation counter so they rebuild once the web fonts arrive.
- **Windows are no longer flat rectangles.** Each is: sky glass, a room glimpse sprite (curtains, blinds, shelves, pendant lamp, a person, plants, TV room, plus café/office/lobby rooms for wide panes) that slides 1 to 3 px against the frame with `CAM` (parallax, off under `REDUCED`), a diagonal glint, and a frame sprite with recess shadow on the top and left, lintel and keystone, sill with drip edge and rain streaks. After dark, lit windows cross-fade from the day room to a warm night room (the TV rooms flicker). `litRect` plumbing is unchanged.
- Doors (panelled timber or aluminium glass leaves, kick plate, brass hardware, step, mat, lintel), scalloped striped awnings with fabric creases, binding and hem stitches, lettering with extrusion and sheen (`nameSign`), wall lanterns, flower boxes with real petals (season-aware) and eight kinds of roof furniture are all cached sprites.
- Textures upgraded and extended: brick (per-brick tone, sand mortar with dark lip, clinker), siding, riveted panel, stucco, paver, asphalt, grass, gravel, plus new `stone`, `shingle`, `seam`, `tile`, `concrete`, `leaf`.

**Buildings (`04`, `04b`, `04c`, `04c2`, `06`, `06b`)**
- Shells are painted once and now include: vertical light gradient (sun at the top, bounce at the foot), tone drift, soot under the roofline, rain streaks, efflorescence, repaired brick patches, moss, quoins, string courses, stone plinth with contact shadow and dirt line, meter and vent, downpipe, roof band material (tile, shingle or standing seam), inset sign board, coping, dentilled cornice and the overhang shadow cast down the facade, and roof furniture. The shell sprite is 64 px taller so roof props and signs live in it. LRU eviction replaces `SHELL.clear()`.
- Hero details: Maple Court (ivy that follows the season, fire stair, barrel canopy, number plate), the grocery (produce window, crates, chalkboard), Dot's Diner (neon cabinet, chrome band, checker band, booth interior), St. Anne Clinic (cross cabinet, ramp rail, hours plate), and all six workplaces: Northgate (server-room window with blinking LEDs, dish and mast), Keller (roll-up workshop door, gears), Mercy General (ambulance bay with a flashing light bar, crosses), Harlan & Pike (columns, conference room, flags), Lakeview (bell cupola, apples), The Copper Pan (exhaust hood with live steam, string lights, pan sign).
- Filler buildings get material by seed, quoins, ledges, fire stairs and ivy on some, and each shop window shows what that shop sells (`W_SHOPS`).
- `placeFacade` (`26`): glossy round badges, neon-style OPEN/CLOSED plaques, cinema marquee with letterboard and bulbs, genre-specific posters.

**Ground (`09`, `09b`, `09c`)**: per-slab tone, joints, expansion joints, hairline cracks, stains and gum on the pavement; patched, cracked, oil-stained asphalt with polished wheel tracks; worn centre dashes and zebra paint; faded lane arrows; tactile paving at every crossing; drain grates; three manhole types; red kerb beside hydrants; park grass with tone drift, mowing stripes, clover and dandelions, desire lines; stone-edged gravel paths; radial cut-stone plaza; mulch flower beds with layered petals; picnic blankets with basket and plates; tree grates and mulch with roots; pond with depth gradient, shore stones, mirrored reeds. Live pond: caustic ripples, glitter, lily pads with flowers, cattails, ducks with wakes.

**Trees and props (`04d`, `04e`, `06c`, `06d`)**: trunk, two-layer canopy (sways by different amounts), pines, winter skeletons with snow, per-season palettes; benches, ornate lamp posts (glass stays live so the night tint is unchanged), bus shelter, fountain (stone basin + live ripples/foam/spray, frozen variant), hydrants, bins, planters (four kinds), mailboxes, A-frames, bike racks with bikes, news boxes, bushes, rocks, park gate.

**Seasons (`30`, `30c`)**: autumn leaf piles, petal drifts under blossom, summer dappled shade, winter snow banks, drifts, boot tracks, packed paths, snow roofs with icicles (cached), cracked pond ice with glitter.

## Intentionally untouched
`BLD`, `DECO`, `BOXES`, `TREES`, `solidAt`, door positions, `PROPS` placement. Lighting maps, sky, weather, people, cars (pass 3), interiors (pass 4), UI (pass 5), bandstand and market stalls (activities). `placeIcon` keeps its look because the minimap and passport share it.

## Wishes for other passes
- Pass 3: `FX.glassA/glassB/glint` are read by every window; warming them at golden hour would give windows a sunset sheen. The shadow pass could use the new tree canopy radius.
- Everyone: a shared prefix is used for my new globals (`w*` / `W_*`) to avoid collisions; please avoid those prefixes.

## Known limits
- Shells for six workplaces repaint when the degree changes (key includes the wall colour).
- Roof props and the exposed roof edge are elevation-style; they float against the back-lot ground by design.
- Large canopies cost about 1 ms each the first time they scroll into view (cached afterwards).
