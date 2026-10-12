# assets/ — optional illustrated art

Drop **WebP** (preferred, small) or **PNG** files here using the keys in [`../../IMAGE_PROMPTS.md`](../../IMAGE_PROMPTS.md)
(for example `cutscene/still-05-handshake.webp`, `chars/grad/pose-idle.webp`, `title/hero-wide.webp`, `ui/diploma.webp`).
The easiest way: run `tools/package_art.py` on the generated art; it produces `freshgrad-art-*.zip` files (each under 19 MB)
whose paths start with `assets/`. Unzip them into `fresh-grad/v2-visual-upgrade/`.

The game loads `assets/<key>.webp`, then `assets/<key>.png`, through `ART.get(key)` (see `src/js/00-assets.js`). **Every file is
optional**: a missing file is skipped silently and the procedural drawing is used. Add `?noart` to the page URL to force the
all-procedural look.

Reference-only pictures (building elevations, room cut-aways, cast sheets, light studies) go in `../../reference-art/` instead.
