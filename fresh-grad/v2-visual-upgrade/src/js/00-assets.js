/* ============================ optional illustrated art ============================
   Drop WebP (preferred, small) or PNG files into assets/ using the keys in ../IMAGE_PROMPTS.md (assets/<key>.webp, then
   assets/<key>.png is tried if there is no WebP). Anything missing is
   skipped silently and the procedural drawing is used, so the game never depends on them. Add ?noart to the
   page URL to force the all-procedural look. Images are only ever drawn, never read back, so a file:// page works.
   A standalone build (tools/standalone.py) carries its art inline as data: URLs in window.FG_ART; then nothing is fetched and
   a key the file does not carry is simply missing. */
const ART = {
  on: !/[?&]noart\b/.test(location.search),
  base: 'assets/',
  exts: ['.webp', '.png'],
  embed: typeof window !== 'undefined' && window.FG_ART ? window.FG_ART : null,
  cache: new Map(),
  /* the loaded image, or null. The first ask starts the load, so call it every frame without worrying. */
  get(key) {
    if (!this.on) return null;
    let e = this.cache.get(key);
    if (!e) {
      e = { img: new Image(), ok: false, bad: false, n: 0 };
      const next = () => {
        if (this.embed) { if (e.n++ === 0 && this.embed[key]) e.img.src = this.embed[key]; else e.bad = true; return; }
        if (e.n < this.exts.length) e.img.src = this.base + key + this.exts[e.n++]; else e.bad = true;
      };
      e.img.onload = () => { e.ok = true; };
      e.img.onerror = next;
      next();
      this.cache.set(key, e);
    }
    return e.ok ? e.img : null;
  },
  has(key) { return !!this.get(key); },
  preload(keys) { keys.forEach(k => this.get(k)); },
  /* true once every extension has failed for this key (the procedural drawing is final) */
  missing(key) { const e = this.cache.get(key); return !!(e && e.bad); },
  /* for DOM art: the URL that loaded for this key, or null while loading / missing / ?noart */
  url(key) { const img = this.get(key); return img ? img.src : null; },
  /* call fn(img) once the key has loaded (right away if it already has); never called when the file is missing */
  when(key, fn) {
    const img = this.get(key);
    if (img) { fn(img); return; }
    const e = this.cache.get(key);
    if (e && !e.bad) e.img.addEventListener('load', () => fn(e.img), { once: true });
  },
  /* draw an image to cover a w x h box (like CSS object-fit: cover), with a focal point 0..1 and a zoom >= 1 */
  cover(c, img, x, y, w, h, fx, fy, zoom) {
    const z = zoom || 1, s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
    const sw = w / s, sh = h / s;
    const sx = clamp((fx == null ? 0.5 : fx) * img.naturalWidth - sw / 2, 0, img.naturalWidth - sw);
    const sy = clamp((fy == null ? 0.5 : fy) * img.naturalHeight - sh / 2, 0, img.naturalHeight - sh);
    c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
};
