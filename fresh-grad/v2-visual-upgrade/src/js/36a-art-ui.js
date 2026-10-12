/* ============================ optional art backdrops for overlays and cards ============================ */
// Presentation only. A card asks ART for its backdrop key when it opens and the plate is put in once the file has loaded
// (ART.when). Nothing changes while a file is missing, so without art (or with ?noart) every card is the procedural one.
// Keys (../../ART_SHORTLIST.md): bg/recap-<season>, bg/levelup, bg/promotion; also bg/evicted and bg/blackout if ever made.
// The icon, food, stamp, trophy, wallpaper and phone-portrait slots built in this pass were removed when those images were
// cut from the art plan (see notes/art-ui.md).

// a full-screen backdrop behind an overlay's card (::before layer, see css/13a-art-ui.css). key null clears it.
// The latest key wins, so a slow load for an earlier card never paints over a later one.
const ART_BD = new WeakMap();
function artBackdrop(ov, key) {
  if (!ov) return;
  ART_BD.set(ov, key || '');
  if (ov.classList.contains('art-bd')) { ov.classList.remove('art-bd'); ov.style.removeProperty('--art-bd'); }
  if (!key) return;
  ART.when(key, img => {
    if (ART_BD.get(ov) !== key) return;
    ov.style.setProperty('--art-bd', 'url("' + img.src + '")'); ov.classList.add('art-bd');
  });
}
// P06: the backdrop behind a panel (only the blackout notice has one)
function artPanelBackdrop(id, spec) { return id === 'notice' && spec && spec.title === 'You blacked out' ? 'bg/blackout' : null; }
