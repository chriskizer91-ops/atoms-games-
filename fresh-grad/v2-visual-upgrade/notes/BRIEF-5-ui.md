# Pass 5 — UI chrome ("the glass, the gauges, the phone, the menus")

Read `BRIEF-common.md` and `DESIGN.md` first. Pass name for scratch/notes: `ui`.

## You own
CSS: `src/css/00-base.css` (tokens, buttons, chips, eyebrow), `03-hud.css`, `04-overlays.css` (panels/cards/options/stats/time-skip veil/game-over card), `06-toasts.css`, `09-menu-passport.css`, `10-phone-level-recap.css`, `12-misc.css` (delivery pill, wipe, confetti layer, trophy toasts, z-index fixes).
HTML: `src/body.html` **except** the `<section id="title">`, `<section id="cut">`, `<section id="degree">` blocks (pass 1) and the four blocks `#job`, `#scene`, `#dream`, `#fishing` (pass 6; you may only restyle them through *your* CSS if needed). `src/head.html` is the integrator's.
JS (presentation parts only): `13-hud-panels.js` (HUD update, panel rendering `renderPanel`, building menu *markup*), `25-menu-passport.js` (life summary and passport markup), `29-progression-phone.js` (phone tabs, level-up/promotion card, recap card, perk/trophy icons), `33-pathfinding-map.js` (**only** the minimap drawing code; pathfinding and buses untouched). Plus new files named after those (e.g. `src/css/00b-surfaces.css`).

## Do NOT touch
Game logic inside those JS files: HUD value computation, what a panel option does (`go()` callbacks), prices, effects, goal logic, level/xp math, bus routes. Keep every DOM id and every class that JS reads or toggles (`.low`, `.got`, `.on`, `data-*`, `[hidden]`...). You may restructure markup *around* them and add wrapper elements, but anything JS queries by selector must still resolve identically. Cutscene/title/degree CSS (`01-title.css`, `02-cutscene-degree.css`) is pass 1's; job/scene/dream/fishing CSS (`07`, `05`, `08`, `11`) is pass 6's.

## Where the game currently is (baseline: `*-ui-*`, `*-panel-*`, `*-phone-*`, `*-menu`, `*-levelup`, `*-recap`, `*-notice`, `*-gameover`, `*-mobile-*`; the HUD is visible on every in-game shot)
A dark navy glass HUD (clock dial, 4 gauges, meal pips, money, tool chips), a goal strip with status chips, a minimap in the corner, a marigold interaction prompt pill, on-screen hint, a touch d-pad, toast stack, building panels (`.card` with coloured header band, `.opt` rows, stock chips), a time-skip veil card, the phone (390px device with 5 tabs), level-up / promotion card with a burst, morning recap card, menu with life summary and a stamp-card passport, game-over card.

## Ambition list
- **Design system pass**: refine `:root` tokens (keep all existing names; add surface/elevation/radius/space/motion tokens). Build one coherent glass recipe (see DESIGN.md) and apply it to HUD, cards, toasts, prompt, hint, chips, phone — consistent edges, highlights, shadows, grain.
- **HUD**: gauges as glass vials/tubes with liquid fill gradients, tick marks, shine, animated wave at the surface (CSS), low-state pulse and glow that is clearly urgent but tasteful; clock dial that really looks like a day/night disc (sun/moon art with the existing `data-tod`), crisp mono numerals, money with a coin glyph and satisfying delta pop, rent line with warning colouring, meal pips as small plates/cutlery icons, tool chips with real icons; goal strip with a progress-y feel; status chips refined. Everything must remain legible at 390px.
- **Interaction prompt & hint**: a beautiful key-cap (`E`) with depth, subtle breathing glow; mobile d-pad with proper glass buttons and press feedback; "hint" panel with keycaps.
- **Panels/cards**: header bands with richer texture (subtle pattern + gradient + noise + building/place glyph watermark in the band using inline SVG), refined typography, option rows as tactile list cells with icon slot, price/tag pills, disabled states that explain themselves, hover/press/focus states, scroll shadows, smooth entrances. Time-skip veil and the game-over card get presence (sky-aware gradient, large clock).
- **Phone**: a gorgeous device — bezel with metallic edge and reflections, dynamic-island style notch, status icons, wallpaper gradient, app-like tabs with glyphs and active indicator, "Today" with ring/progress visuals, "Map" tab with a nicely rendered map and location pins, "Texts" as chat bubbles with avatars and timestamps, "Career" with a clear tier ladder, "Trophies" as an illustrated shelf with locked/unlocked states and gold foil highlights. Unread badges with spring.
- **Level-up / promotion**: celebratory — layered burst rays, rotating sunburst, confetti already exists (pass 3 owns confetti draw), shimmering numeral, perk cards as collectible cards with foil edge and icon medallion.
- **Morning recap**: a morning-paper/weather-card feel; forecast icon larger, stats as tiles with deltas.
- **Menu & passport**: life summary tiles; passport as a real stamped booklet — cover, paper texture, stamp ink with rotation and ink bleed (CSS), hover reveals, progress.
- **Minimap**: higher fidelity map drawing (buildings with accent colours, roads with lane marks, park with pond/fountain, player/door markers with pulse, subtle frame and compass).
- **Toasts**: category-coloured accents with icons, subtle slide/spring, trophy toast with gold shimmer.
- Polish: custom scrollbars, selection colours, tap highlight, consistent focus rings (gold), `prefers-reduced-motion` fallbacks for every animation you add, `prefers-contrast` friendliness.

## Technical notes
- You can add inline SVG icons in JS-generated markup (keep the family: 24px viewBox, 1.75–2px round strokes, `currentColor`).
- `backdrop-filter` is fine but use it sparingly on large full-screen surfaces (perf on mobile).
- `#top-h`/`--top-h` are computed from HUD+goal heights in `boot()`; if HUD height changes, that still works (ResizeObserver) — make sure overlays that use `inset: var(--top-h)` still sit correctly.
