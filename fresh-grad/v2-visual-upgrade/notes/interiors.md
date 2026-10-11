# Pass 4: interiors

Every walkable room (21 interiors plus the Lakeview Elementary school) is repainted. No gameplay, collision, spot, door,
folk, price or text meaning changed. A throwaway script that loads v1 and v2 and compares `d.rects`, `d.spots`,
`d.furn` (type and x/y/w/h/ghost/when), `d.folks`, `d.b`, `d.exit`, `d.w/h` for all 22 rooms reports 0 differences.

## Architecture

* **One cached static layer per room.** v1 cached only the floor and redrew walls, deco and every piece of furniture
  every frame. v2 paints the whole static room (floor, shell, deco, wall art, furniture) once into `LAYER`
  (`22-interior-render.js`, `layerCache`). The cache name is `roomSig(d)` (room id, game day, which `when` pieces are
  on, furniture colours, plus an optional per-room `ROOM_SIG[id]`), so buying a rug, curtains or a mattress, or a new
  day (cinema posters, pizza board) repaints it.
* **Windows and door glass are holes.** `winTop()` and the exit door punch `destination-out` holes in the cached
  layer and register them in `FX.wins`; every frame `drawWindowViews` fills those holes with the live sky (zenith to
  horizon gradient, sun glow, moon, stars, parallaxing rooftops with lit windows after dark, clouds, rain, snow, fog)
  and then draws the layer over the top. So a room follows the time of day and the weather without a repaint.
* **Live passes stay cheap.** `FURN_LIVE` (`27b-furniture-live.js`) repaints a small rectangle per animated piece
  (lit screens with scrolling text, server LEDs, tumbling washers, oven flames, jukebox neon, popcorn, fish and
  bubbles, claw machine, turntable, stove burners). `liveClocks` draws wall-clock hands from the game clock. A room
  style can add a `live(c, d)` hook (flour in the bakery, bubbles in the laundromat, steam in the cafe, heart traces
  on the ward monitors). Everything falls back to a still frame under `REDUCED`.
* **Lights captured once, replayed every frame.** `captureStatic` runs the static painters with `FX.nf = 1` and keeps
  every `addLight` / `addEmit` / `litRect` they register; `replayLights` pushes them back each frame while it is dark.
  Static painters therefore never branch on the hour. `roomLights` (the room's lighting hook) now uses each room's
  `lamps` list (pools in the light map) and a per-room night ambience colour instead of an even grid.
* **Sun pools** (`sunPools`, 22b): per window, two panes broken by the mullion, screen-blended, warm at golden hour,
  cool moonlight at night, with dust motes in the beam. Door spill the same way.

## Files

* `21b-materials.js`: `IM` helpers (soft shadows, bevels, glass glints, grain, mottle) and seeded textures
  (weave, brushed metal, leather, carpet, lino, concrete, plaster, nap, cork, wall tile); floor painters: plank wood
  with knots and gaps, basket-weave parquet, glazed tile with scuffs, marble, carpet (tiles, motif, wear path),
  waxed lino, concrete.
* `21-furniture.js`, `27-furniture-extra.js`: all ~55 furniture types rewritten as lit 3/4 pieces (top face, front
  face, thickness, contact shadow, material, props). Every existing type name still works; unknown types still fall
  back to `table`. `21c-props.js` (mugs, papers, keyboards, products, spines, counter props), `21d-table-tops.js`
  (produce stand, bakery table, folding table, drafting table, conference table, prep table).
* `22-interior-render.js`, `22b-room-shell.js`: floor dispatcher, cache, room painter, back wall (crown, chair rail,
  panelling or tile or marble or velvet, baseboard, sockets), side and front walls, exit door with EXIT sign glow,
  partition walls, windows with reveal, sill and curtains/blinds/valance/awning.
* `22c-wall-decor.js`, `22d-room-styles.js`: framed pictures, clocks, shelves, neon, string lights, bunting,
  sconces, posters, extractor hood, pipes; plus one `ROOM_STYLE` entry per room (wall material, window dressing,
  floor refinements, night ambience, lamp pools, extra painter).
* `17-school-draw.js`: hallway lino and stripe, lockers (louvres, latches, stickers, dents), door frames, whiteboards,
  alphabet cards and taped children's drawings, library/lounge/office windows with a live view, cafeteria benches
  and trays, gym court (keys, arcs, centre circle, hoops with glass backboards and nets), live clocks.
* `28-shop-rooms.js` and `32-workplaces.js`: only `deco()` bodies and presentation numbers changed (window positions
  moved off the signs, cinema theatre doors, string lights). `WORK_CFG` gained `signX` and `wins` (where the employer
  sign and windows go; the biz sign used to be hidden behind its whiteboard).

## Performance

Headless, 1280x720, `tools/perf.js`: interior-apartment 1.2 ms (v1 2.0), interior-diner 0.9 ms (v1 0.9). Steady
frame cost across all 22 rooms is 0.2 to 0.9 ms (the school is the highest). Building a room's cache costs about 40 to
80 ms of raster time (behind the fade-in); an occasional 400 to 700 ms spike shows up in headless runs every few
rebuilds and moves around with the order of visits, so it is allocator/GC noise of the software renderer, not content.

## Parity

`node tools/parity.js` against v1: REMOVED (0). Three `LOGIC?` entries, all presentation: `LAYER` (extra cache fields
`rec`, `live`, `clocks`), `roomLights` (the room lighting hook: per-room lamp pools and night ambience colour instead of
an even grid; it returns an ambient colour and queues lights, nothing else) and `WORK_CFG` (added `signX` and `wins`,
where the employer sign and windows are painted).

## Intentionally untouched

Spots, markers (`drawSpotMarkers`), people, speech bubbles and name tags (pass 3), the town exteriors, UI, the
`sortedSchoolItems` text (kept byte for byte). `lightPass`, `finishFrame` and the weather particles are other
passes' and are used as they are.

## Wishes for other passes

* `lightPass` scales every light by `nf`; a day-time light option would let lamps and screens glow a little in the
  day without the interior code drawing its own additive pass.
* A shared `hash`-seeded noise/grain helper in `03-gfx-helpers.js` would have saved the interior pattern code.

## Known limits

* Tall wall furniture is drawn inside its footprint (front elevation plus a top cap), never above it, so people
  (always drawn over furniture) cannot appear to walk behind it.
* Hanging lamps are not drawn (they read badly in this view); light sources are wall sconces, neon, lamps, string
  lights and screens, plus invisible lamp pools.
