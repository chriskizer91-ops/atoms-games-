/* ============================ optional art: faces, dream and scene backdrops, shift heroes, badges, logos ============================
   Every slot here asks ART for its file only when its screen opens (or when a shop front is drawn), and changes nothing until the
   file has loaded: with no files (or ?noart) every screen looks exactly as the procedural version. Keys follow IMAGE_PROMPTS.md
   (P05 portraits/ for ten faces, P06 bg/, P07 badges/ and logos/). Only function declarations at the top level: they are hoisted, so this file
   can sit at the end of the script and still be called from anywhere at run time. */

/* ---------- P05: who is talking, and which portrait key shows them ---------- */
/* town folk and shop staff (G.inside = 'npc:<id>') -> portrait slug; ids that already equal their slug are listed too */
function artFolkSlug(id) {
  const M = artFolkSlug.M || (artFolkSlug.M = {
    // street talkers
    maya: 'maya', rosa: 'rosa', bell: 'mr-bell', theo: 'theo', priya: 'priya', walt: 'walt', june: 'june',
    cole: 'officer-cole', ines: 'ines', lena: 'lena', sam: 'sam-musician', kofi: 'kofi',
    // apartment, grocery, diner, clinic
    reyes: 'mrs-reyes', dev: 'dev', tanaka: 'mr-tanaka', odell: 'ms-odell', dot: 'dot', gus: 'gus', imani: 'nurse-imani', chen: 'dr-chen',
    // coworkers
    noor: 'noor', felix: 'felix', dana: 'dana-whitlock', olga: 'olga', pavel: 'pavel', keller: 'mr-keller',
    amari: 'dr-amari', tomas: 'tomas', rosalind: 'head-nurse-rosalind', carter: 'carter', imogen: 'imogen', pike: 'ms-pike',
    dmitri: 'dmitri', beto: 'beto', marisol: 'chef-marisol',
    // shop staff and regulars (28-shop-rooms.js)
    okafor: 'mr-okafor', greta: 'greta', hale: 'mr-hale', agnes: 'agnes', milo: 'milo', luc: 'luc', hank: 'hank', zoe: 'zoe-cinema',
    ike: 'ike', bianca: 'bianca', kim: 'mrs-kim', rafa: 'rafa', luna: 'luna', sal: 'sal', ruby: 'ruby-dental', patel: 'dr-patel',
    nadia: 'nadia', otis: 'otis', tess: 'tess', gwen: 'gwen'
  });
  return M[id] || null;
}
/* the school staff talk through 'sch:talk-<id>' and reuse some town ids (okafor, kim), so they get their own table */
function artTeacherSlug(id) {
  return { park: 'ms-park', alvarez: 'mr-alvarez', okafor: 'mrs-okafor', dawson: 'principal-dawson', kim: 'mr-kim', reed: 'nurse-reed', lin: 'ms-lin' }[id] || null;
}
/* only the ten recurring faces get portrait files; everyone else keeps today's faceless panel */
function artHasFace(slug) { return ['dot', 'sal', 'bianca', 'hank', 'mrs-reyes', 'luna', 'agnes', 'dr-chen', 'ms-park', 'greta'].indexOf(slug) >= 0; }
/* the portrait key for the open talk panel, or null */
function artTalkKey() {
  const id = G.inside;
  if (!id || !S) return null;
  const slug = id.startsWith('npc:') ? artFolkSlug(id.slice(4)) : id.startsWith('sch:talk-') ? artTeacherSlug(id.slice(9)) : null;
  return slug && artHasFace(slug) ? 'portraits/' + slug : null;
}
/* first key in the list that has loaded; keys still loading re-sync the panel when they arrive */
function artFirstLoaded(keys) {
  for (const k of keys) {
    const u = ART.url(k);
    if (u) return { k, u };
    if (!ART.missing(k)) {
      const P = artFirstLoaded.wait || (artFirstLoaded.wait = new Set());
      if (!P.has(k)) { P.add(k); ART.when(k, () => { P.delete(k); artTalkSync(); }); }
    }
  }
  return null;
}
/* put the speaker's bust into the panel header; remove it for any other panel */
function artTalkSync() {
  const head = $('#pHead');
  if (!head) return;
  const key = ART.on ? artTalkKey() : null, got = key ? artFirstLoaded([key]) : null;
  let im = head.querySelector('.tk-face');
  if (!got) {
    if (im) im.remove();
    head.classList.remove('has-face');
    return;
  }
  if (!im) {
    im = document.createElement('img'); im.className = 'tk-face'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.decoding = 'async';
    head.insertBefore(im, head.querySelector('.htxt'));
  }
  if (im.dataset.k !== got.k) { im.src = got.u; im.dataset.k = got.k; }
  head.classList.add('has-face');
}

/* ---------- P06: dream backdrops ---------- */
/* the game's dream ids are the brief's ids; the quiet nap ('none') is bg/dream-calm */
function artDreamKey(d) { return d ? 'bg/dream-' + (d.id === 'none' ? 'calm' : d.id) : null; }
/* paint the dream's backdrop instead of the procedural motif; false when there is no file (the motif is drawn as before) */
function artDreamBg(c, d, w, h, mood) {
  const img = ART.get(artDreamKey(d));
  if (!img) return false;
  ART.cover(c, img, 0, 0, w, h, 0.5, 0.5);
  // dim it a touch so the white title and lines keep their contrast; bad dreams sink a little further
  c.fillStyle = mood === 'bad' ? 'rgba(10,2,8,.3)' : 'rgba(6,8,24,.2)'; c.fillRect(0, 0, w, h);
  return true;
}

/* ---------- P06: activity scene backdrops ---------- */
/* which backdrop a scene uses, or null. Reading in the park, the record player and hanging out anywhere but the cafe keep their own sets. */
function artSceneKey(o) {
  if (!o) return null;
  switch (o.scene) {
    case 'cinema': case 'laundry': case 'salon': case 'dentist': return 'bg/scene-' + o.scene;
    case 'read': return (o.place || 'home') === 'park' ? null : 'bg/scene-read';
    case 'music': return o.records ? null : 'bg/scene-music';
    case 'hang': return (o.place || 'cafe') === 'cafe' ? 'bg/scene-hang' : null;
  }
  return null;
}
/* appended to a scene's cached layer name, so the layer is repainted once when the backdrop arrives */
function artSceneTag(o) { const k = artSceneKey(o); return k && ART.get(k) ? '|art' : ''; }
/* paint the backdrop into a scene layer (cover-fit, a soft floor shade to seat the animated figures); false when there is none */
function artSceneBg(g, w, h, o) {
  const k = artSceneKey(o), img = k && ART.get(k);
  if (!img) return false;
  ART.cover(g, img, 0, 0, w, h, 0.5, 0.5);
  const sg = g.createLinearGradient(0, h * 0.55, 0, h); sg.addColorStop(0, 'rgba(4,6,14,0)'); sg.addColorStop(1, 'rgba(4,6,14,.38)');
  g.fillStyle = sg; g.fillRect(0, h * 0.55, w, h * 0.45);
  return true;
}

/* ---------- P06 + P07: the shift intro hero and the employer mark ---------- */
/* hero: the job's illustrated workplace laid over the inline SVG once it loads; mark: the employer's logo in the hero's corner */
function artJobHero(hero, jobId) {
  if (!hero || !jobId) return;
  ART.when('bg/job-' + jobId, img => {
    if (hero.querySelector('.jh-art')) return;
    const a = document.createElement('img'); a.className = 'jh-art'; a.alt = ''; a.setAttribute('aria-hidden', 'true'); a.src = img.src;
    hero.appendChild(a);
  });
  ART.when('logos/' + jobId, img => {
    if (hero.querySelector('.jh-logo')) return;
    const a = document.createElement('img'); a.className = 'jh-logo'; a.alt = ''; a.setAttribute('aria-hidden', 'true'); a.src = img.src;
    hero.appendChild(a);
  });
}

/* ---------- P07: shop door badges ---------- */
/* the badge sprite's cache key gains '|art' once the file has loaded, so the sprite is rebuilt exactly once */
function artBadgeTag(place) { return ART.get('badges/' + place) ? '|art' : ''; }
/* paint the badge art into the 40x44 badge sprite (wire and contact shadow kept from the procedural badge); false when there is none */
function artBadgePaint(g, place) {
  const img = ART.get('badges/' + place);
  if (!img) return false;
  g.fillStyle = 'rgba(8,12,28,.3)'; g.beginPath(); g.arc(21.2, 23.2, 15.4, 0, 7); g.fill();
  g.strokeStyle = '#2a3036'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(20, 1); g.lineTo(20, 5.4); g.stroke();
  g.drawImage(img, 3, 5, 34, 34);
  return true;
}
/* the talk panel is rebuilt by renderPanel on every action; follow it */
(function artWatchPanel() {
  try {
    const body = $('#pBody');
    if (body && window.MutationObserver && ART.on) new MutationObserver(artTalkSync).observe(body, { childList: true });
  } catch (e) { /* portraits are a nicety */ }
})();
