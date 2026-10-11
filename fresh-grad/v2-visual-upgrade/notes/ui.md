# Pass 5: UI chrome (notes)

## What changed

**Design system** (`css/00-base.css`, new `00b-surfaces.css`, new generated `00c-icons.css`)
- All old tokens kept. Added ink/shade ramp, marigold ramp, radii 8/12/16/22/28 (`--r1..r5`), 4-pt space (`--s1..s8`), motion (`--ease`, `--spring`, 120/200/320 ms), elevation (`--shadow-1..3`), `--edge-hi/lo`, `--hairline`, `--glass-grad`, `--sheen`, grain data-URIs (`--noise`, `--noise-lite`, `--paper-grain`), `--font-serif` (Fraunces with Georgia fallback).
- One glass recipe (gradient + sheen + grain + inner top highlight + hairline + ambient shadow) used by hint, toasts, closed prompt, delivery pill, cards, HUD.
- Buttons: marigold with specular top edge, pressed state, gold focus ring, hover sheen sweep; ghost = glass. `.chip-btn` glass keys. `kbd` is a real keycap.
- Themed scrollbars, selection colour, `prefers-contrast`, `prefers-reduced-transparency`, `forced-colors` hooks.
- Icon family: `js/13b-ui-icons.js` (`UI_ICO`, `uiIcon(name, cls, strokeWidth)`) and `css/00c-icons.css` (`--i-name` mask URLs) are **generated from one table** (72 icons, 24px viewBox, 1.75px round strokes). Source of truth is the table in the generator; if you edit icons, edit both files together or regenerate.

**HUD** (`03-hud.css`, `body.html`, `updateHud`)
- Clock disc: day/dusk/night sky gradient, sun and moon ride an orbit driven by new `--tf` (S.t/1440, set in `updateHud`), skyline silhouette, progress ring in the sky colour, stars at night.
- Gauges: glass vials with liquid fill, gloss band, tick marks, sweeping shimmer (transform-based), low state = red liquid, pulsing glow, red value pill. Icon now sits on the label row so bars stay wide.
- Meals are three plates (check badge when eaten, pulsing gold ring for the current period). Money has a coin and glow, delta pops in a pill, rent line warn/bad styling. Tool chips have mask icons (`#bSound[data-s=muted]` is set from `updateHud`, because the button text is replaced by JS).
- Goal strip is a quest tracker with an arrow tag; status chips have dots. Interaction prompt has a 3D keycap and breathing glow; hint uses keycaps; touch pad is glass with SVG chevrons; on coarse pointers the prompt moves to the free bottom-right corner so it no longer sits under the pad.
- Fixed v1 quirk: `@keyframes pop` was defined twice (prompt lost its translateX). Renamed `prompt-in`, `badge-pop`.
- Fixed v1 quirk: a global `.v` rule in `07-jobs.css` leaked pill styling onto gauge values. `#hud .gauge label .v` now sets everything explicitly (and wins on specificity).

**Panels / cards / overlays** (`04-overlays.css`, `renderPanel`, `body.html`)
- Header band: gradient + bloom + grain + weave + big watermark glyph + glass medallion glyph. Glyph comes from `PLACE_ICON` (shops), or bus / chat / school / alert / lock (closed). Sub line is a pill (red when "Closed").
- Option rows: icon slot (keyword mapper `OPT_ICONS`, presentation only; locked rows get a lock and an explanatory amber note), price and time pills (a `tag` like `$11 · 40 min` is split into two pills; full text kept in `title`/`aria-label`), hover/press/focus states. Notes have an info or alert icon. Scroll fade on card bodies. Time-skip veil is sky-aware with a glowing track and big clock. Game-over card has hazard tape, dim red cast, icon stat tiles.

**Phone** (`10-phone-level-recap.css`, `body.html`, `29-progression-phone.js`)
- Titanium frame, side keys, glass screen with wallpaper, dynamic island with lens, wifi, battery, home bar, diagonal glare. `.ph-screen` wrapper added (tabs, ids and data attributes unchanged). Tabs have squircle active indicator and spring badges.
- Today: XP ring with gradient, weather canvas, perk chips with medallions, check-circle goals. Map: cached world map drawn large with a pin per passport place (pins are real `button[data-go]`, same action as the list), then the passport booklet (navy cover, paper page, rotated stamp art with ink bleed and worn specks, unstamped = pencil outline). Texts: avatar + bubble chat with timestamps. Career: tier ladder, promotion progress bar, tiles, glossy rank medallions. Trophies: three-column shelf, gold foil medals when unlocked, locked ones dimmed with a lock.

**Level up / promotion / recap / menu**
- Rotating sunbursts behind a serrated gold seal with shimmering numeral (violet for promotions); perk cards are collectible cards with a rotating conic foil edge (`@property --a`) and a redrawn medallion canvas (`perkIcon`). Recap has a Fraunces masthead, weather card with a bigger redrawn icon (`drawWeatherIcon`), stat tiles with delta chips. Menu: icon tiles, XP bar, keycap `P`, confirm box.

**Minimap** (`33-pathfinding-map.js`, minimap section only)
- World is painted once into `MINI` (now 760 px wide): lane marks, crosswalks, park with patches, paths, pond, fountain, shaded trees, buildings with roof bands, accents and shadows, key-building badges, shop icons, bus stops, season variants. Glass frame (gloss, vignette, corner marks, compass) is a second cached canvas. Per frame: night tint, camera box, pulsing target, coral player dot. Cheaper than v1 (labels and icons are no longer redrawn per frame). `MINI = null` on season change (done by ground code) still works.

## Intentionally untouched
`#title`, `#cut`, `#degree`, `#job`, `#scene`, `#dream`, `#fishing` markup; `01/02/05/07/08/11` CSS; `#vig`/`#warm` overlay CSS; all `go()` callbacks, `BUILDERS`, prices, goals, XP math, buses and pathfinding. `25-menu-passport.js` `renderLife` is overridden by `29` in v1 too (the menu shows tiles only; the passport lives in the phone Map tab). I restyled both (`drawStampArt` is shared).

## Parity
`REMOVED (0)`, 0 `LOGIC?` entries; 15 CHANGED are all DRAW/UI. Multi-line `/* */` comments in my JS are avoided on purpose (the parity tool counts their tail lines as code).

## Perf
Headless `perf.js`: street-noon 2.2 to 2.6 ms (v1 2.2 to 2.4), night 2.9 to 3.3 (v1 2.4 to 2.6), rain 3.3 to 3.5 (v1 2.5 to 2.6), interiors unchanged. Noise between runs is about 0.5 ms. All HUD animations are tiny (transform or opacity, or small box-shadow).

## Wishes for other passes
- Pass 6: `07-jobs.css` has a global `.v{...}` rule; it should be scoped. `08-scenes.css` carries HUD rules (`.gauge[data-k=mood]`, `#chips i.good`, a 760px gauge media query) that duplicate mine; they can be dropped there.
- Pass 3: `toast()` lives in `01-core-sim.js` and keeps max 3 toasts, so a trophy toast can be pushed out by two quick toasts. A separate trophy stack would be nicer (logic file, so left alone).
- `tools/tour.js` scenes group throws `PLAYER_LOOK is not defined` (evaluated in Node scope, not the page).

## Known limitations
- Mask icons (`--i-*`) need Chromium 120+/Safari 15.4+/Firefox 53+ (prefixed `-webkit-mask` is also set).
- `color-mix()` and `@property` are used; browsers without them fall back to flat colours and a static foil edge.
- Option icon mapping is heuristic text matching; unknown items get a neutral sparkle (chat bubble in conversations).
