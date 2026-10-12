// ============================ optional art for fishing ============================
// Optional files (keys from ../IMAGE_PROMPTS.md P06/P08): fish/<id> (768x384 alpha, facing right) and
// bg/fishing-day|dusk|night|ice (16:9 opaque). Nothing is preloaded at boot: a fish is asked for when it is hooked (the reel
// meter draws it) or caught, a backdrop when the fishing view draws in that light. With no file (or ?noart) the procedural
// drawing is exactly as before. Nothing in here reads or writes game state.
// This file sorts after the boot() call in 35-degree-flow-boot.js, so it only holds function declarations (hoisted), no
// top-level const/let that would still be uninitialised while boot() runs.

// game fish id -> brief key (the game's "sunfish" is the brief's pumpkinseed)
function agFishKey(id) { return 'fish/' + (id === 'sunfish' ? 'pumpkinseed' : id); }

/* fish art goes into the fishArt unit box (nose -19 .. tail +24): a 52 x 26 box (2:1, like the 768x384 file) centred 2.5 right of x */
function agFishImg(f) { return f && f.id ? ART.get(agFishKey(f.id)) : null; }
function agFishDraw(c, img, x, y, s) { c.drawImage(img, x - 23.5 * s, y - 13 * s, 52 * s, 26 * s); }
/* the catch card is drawn once; if the fish's art is still loading, redraw it when it lands (only if that card is still up) */
function agFishCard(c, f, x, y, s) {
  agFishCard.cur = f;
  const key = agFishKey(f.id);
  if (!ART.on || ART.get(key) || ART.missing(key)) return;
  ART.when(key, () => {
    const res = $('#fishResult');
    if (agFishCard.cur !== f || !res || res.hidden) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); fishArt(c, f, x, y, s);
  });
}
/* the fishing backdrop for the light the view already uses: ice in winter (WINTER()), night when A.nf > .5, dusk while the sun
   is low (A.warm > .5) or below the horizon (dawn too), otherwise day. Returns the loaded image or null. */
function agFishBg(A, ice, night) {
  return ART.get(ice ? 'bg/fishing-ice' : night ? 'bg/fishing-night' : (!A.sunUp || A.warm > 0.5) ? 'bg/fishing-dusk' : 'bg/fishing-day');
}
