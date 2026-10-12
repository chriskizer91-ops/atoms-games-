/* ============================ optional illustrated art ============================
   Drop WebP (preferred, small) or PNG files into assets/ using the keys in ../IMAGE_PROMPTS.md (assets/<key>.webp, then
   assets/<key>.png is tried if there is no WebP). Anything missing is
   skipped silently and the procedural drawing is used, so the game never depends on them. Add ?noart to the
   page URL to force the all-procedural look. Images are only ever drawn, never read back, so a file:// page works. */
const ART = {
  on: !/[?&]noart\b/.test(location.search),
  base: 'assets/',
  exts: ['.webp', '.png'],
  cache: new Map(),
  /* the loaded image, or null. The first ask starts the load, so call it every frame without worrying. */
  get(key) {
    if (!this.on) return null;
    let e = this.cache.get(key);
    if (!e) {
      e = { img: new Image(), ok: false, bad: false, n: 0 };
      const next = () => { if (e.n < this.exts.length) e.img.src = this.base + key + this.exts[e.n++]; else e.bad = true; };
      e.img.onload = () => { e.ok = true; };
      e.img.onerror = next;
      next();
      this.cache.set(key, e);
    }
    return e.ok ? e.img : null;
  },
  has(key) { return !!this.get(key); },
  preload(keys) { keys.forEach(k => this.get(k)); },
  /* draw an image to cover a w x h box (like CSS object-fit: cover), with a focal point 0..1 and a zoom >= 1 */
  cover(c, img, x, y, w, h, fx, fy, zoom) {
    const z = zoom || 1, s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
    const sw = w / s, sh = h / s;
    const sx = clamp((fx == null ? 0.5 : fx) * img.naturalWidth - sw / 2, 0, img.naturalWidth - sw);
    const sy = clamp((fy == null ? 0.5 : fy) * img.naturalHeight - sh / 2, 0, img.naturalHeight - sh);
    c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
};
