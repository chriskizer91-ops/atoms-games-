# assets/ — optional illustrated art

Drop PNGs here using the keys in [`../../IMAGE_PROMPTS.md`](../../IMAGE_PROMPTS.md) §11 (for example `cutscene/still-05-handshake.png`,
`chars/grad/pose-idle.png`, `title/hero-wide.png`, `ui/diploma.png`).

The game loads `assets/<key>.png` relative to `index.html` through `ART.get(key)` (see `src/js/00-assets.js`). **Every file is optional**:
a missing file is skipped silently and the procedural drawing is used. Add `?noart` to the page URL to force the all-procedural look.

Reference-only pictures (building elevations, room cut-aways, cast sheets, light studies) go in `../../reference-art/` instead.
