// ============================ optional art for fishing ============================
// Optional files (ART_SHORTLIST.md): bg/fishing-day|dusk|night|ice (16:9 opaque), asked for when the fishing view draws in that
// light. With no file (or ?noart) the procedural drawing is exactly as before. Nothing in here reads or writes game state.
// (Fish art slots, fish/<id>, were built in this pass and removed when fish were cut from the art plan; see notes/art-games.md.)
// This file sorts after the boot() call in 35-degree-flow-boot.js, so it only holds function declarations (hoisted), no
// top-level const/let that would still be uninitialised while boot() runs.

/* the fishing backdrop for the light the view already uses: ice in winter (WINTER()), night when A.nf > .5, dusk while the sun
   is low (A.warm > .5) or below the horizon (dawn too), otherwise day. Returns the loaded image or null. */
function agFishBg(A, ice, night) {
  return ART.get(ice ? 'bg/fishing-ice' : night ? 'bg/fishing-night' : (!A.sunUp || A.warm > 0.5) ? 'bg/fishing-dusk' : 'bg/fishing-day');
}
