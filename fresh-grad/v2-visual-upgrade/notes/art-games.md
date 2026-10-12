# art-games: optional art slots for fishing

Scope after the coordinator's cut: **fishing backdrops (P06) and fish (P08)** are wired. The mini-game pieces
(`mini/client-*`, `mini/patient-*`, `mini/pan`, `mini/food-*`, `mini/kid-*`) were **dropped**: they had been implemented and
tried with placeholders, then reverted because no art is coming for them. `js/16-jobgames.js` and the game CSS are untouched.

## Keys wired (15)

| Key | Where it shows | Framing |
|---|---|---|
| `fish/<id>` (11) | Catch card (`#fishPic`, 480×240 canvas) and the small fish in the reel meter | Drawn into the procedural fish's unit box: 52×26 units (2:1, the file's 768×384 aspect), centred 2.5 units right of the old fish centre. That is 354×177 px on the card canvas and about 26×13 px in the meter. Facing right as the brief says; no flipping. |
| `bg/fishing-day` | Fishing view in daylight | `ART.cover` over the whole canvas, focal point at the centre. On phones (4:5 canvas) the 16:9 file is cropped at the sides. |
| `bg/fishing-dusk` | Low sun (`A.warm > 0.5`) or sun below the horizon but not yet night: about 6:00–7:15 and 17:15–19:00 | as above |
| `bg/fishing-night` | `A.nf > 0.5` (the view's existing `night` flag) | as above |
| `bg/fishing-ice` | Winter (`WINTER()`, the view's existing `ice` flag), any hour | as above |

Fish id → key: the game's ids match the brief's except **`sunfish` → `fish/pumpkinseed`** (the game already names it
"Pumpkinseed"). `bluegill perch carp catfish trout pike koi icecod boot moonfin` map 1:1. In the reel meter the game hides a
boot as a bluegill; the art follows that, so a hooked boot shows `fish/bluegill` there.

### With a backdrop loaded
The file replaces the sky, stars, sun or moon, clouds, far hills and trees, the water gradient, tree reflections, the sun
glitter path, wave strokes, lily pads, autumn leaves, ice frost and snow banks, the ambient multiply tint, the foreground
reeds, the sun shafts and the moon glow. These stay drawn on top: the fish shadows under the water, the drifting rings that
come and go, cast and bite splashes and ripples, the ice hole at the bobber, the bobber's contact rings, the rod, line and
bobber, the cast-power meter and reel meters, the angler's breath on ice, rain and snow, and the vignette.

### Loading
Nothing is preloaded. A backdrop is requested the first time the fishing view draws in that light; it is one `ART.get`
(a Map lookup) per frame. A fish is requested when it is hooked (the reel meter draws it) or caught. If the catch card is
drawn before the file has arrived, `ART.when` redraws the card once the file lands, but only if that same catch is still on
screen.

## Verification
- **Missing art and `?noart`:** a frozen comparison script drew all 11 catch cards and 6 fishing-view states (day, dusk,
  dawn cast, night reel, ice, ice reel) at a fixed time. Its canvas hashes are **identical** to the pre-change build, both
  with no `assets/` and with placeholders present plus `?noart`. Tours of `jobs,fishing,mobile` at 1280×720 and 390×844 show
  no page errors.
- **With placeholders:** placeholder images at the brief's sizes showed the correct backdrop for each light, the fish on the
  catch card and in the reel meter, and the late-arrival redraw of the catch card, at 1280×720 and 390×844.
- **parity:** `REMOVED (0)`. The changed and LOGIC? lists are identical to the pre-change build (15 LOGIC?, none from this
  pass). `drawFishPic`, `fishArt` and `fishView` changed in drawing only. 5 helpers were added (`agFish*`).
- **playthrough:** same result as `index.html` (33/34; the one FAIL is the existing dream-wake timing check, failing on
  both). **perf:** no regression (perf's scenes do not include fishing; with a backdrop the fishing view does less work).

## Known limitations
- **Ice hole:** the brief asks for a hole in `bg/fishing-ice`, but the game draws its own hole under the bobber, wherever the
  cast lands. With art, both holes show. Wish for the prompt owner: paint the ice sheet **without** a hole.
- **Dawn uses the dusk file:** there is no dawn backdrop, so about 6:00–7:15 shows `bg/fishing-dusk`.
- **Seasons:** outside winter, one backdrop serves spring, summer and autumn. The procedural view's seasonal tree colours,
  blossoms and autumn leaves are not shown while a backdrop is loaded.
- **Sun and moon position:** the live sun and moon position is not shown over a backdrop, since the file has its own sky.
- **Fish box assumption:** the fish box assumes the subject fills most of its 768×384 frame. If delivered fish are drawn
  small with wide margins, they will look small on the catch card; enlarge the 52×26 box in `agFishDraw` if so.
- **File placement:** `js/36c-art-games.js` sorts after the `boot()` call. It therefore holds only function declarations,
  and its header uses `//` comments so parity does not attach it to the `boot` block.

## Files
`js/36c-art-games.js` (new), `js/31c-fish-art.js` (`fishArt` uses the art when loaded), `js/31d-fish-view.js` (backdrop
branch), `js/31-activities-extra.js` (`drawFishPic` asks for the late redraw).

## Integrator's note
Fish (`fish/<id>`) were cut from the art plan (`ART_SHORTLIST.md`), so the fish slots (`agFishKey`, `agFishImg`, `agFishDraw`, `agFishCard` and their calls in `fishArt` / `drawFishPic`) were removed at merge; they would only have asked for missing files. The code is in commit 2bf2902 if fish come back. The four fishing backdrops stay wired.
