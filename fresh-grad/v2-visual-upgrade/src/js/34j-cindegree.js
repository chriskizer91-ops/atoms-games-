/* ============================ degree picker presentation helpers ============================
   Emblems for the six jobs (inline SVG, 2px round strokes, tinted by the degree's own colours), a deckled paper edge, the noise tile and the
   optional art plates (ui/diploma, ui/paper-cream). Pure presentation; showDegreeScreen / pickDegree in 35-degree-flow-boot.js call these. */
const DEG_EMB = {
  cs: '<path d="M15 12 7 20l8 8"/><path d="M25 12l8 8-8 8"/><path d="M22.5 9.5l-5 21"/>',
  eng: '<circle cx="20" cy="20" r="5.6" fill="currentColor" fill-opacity=".2"/><circle cx="20" cy="20" r="11"/><path d="M20 5.5v4M20 30.5v4M5.5 20h4M30.5 20h4M9.7 9.7l2.8 2.8M27.5 27.5l2.8 2.8M30.3 9.7l-2.8 2.8M12.5 27.5l-2.8 2.8"/>',
  nurse: '<path d="M17 8h6v9h9v6h-9v9h-6v-9H8v-6h9z" fill="currentColor" fill-opacity=".2"/>',
  biz: '<path d="M8 32V23M16 32V17M24 32V21M32 32V12" stroke-width="3.4"/><path d="M7 15l8-5.5 8 4 9-8.5"/><path d="M26 5.5h6v6"/>',
  edu: '<path d="M20 14c-3.4-3.6-11-1.6-11 5.8 0 7.4 5.4 13.2 8.6 13.2 1 0 1.6-.6 2.4-.6s1.4.6 2.4.6c3.2 0 8.6-5.8 8.6-13.2 0-7.4-7.6-9.4-11-5.8z" fill="currentColor" fill-opacity=".2"/><path d="M20 14c0-4.4 2.2-7 5.4-8"/>',
  cook: '<ellipse cx="16" cy="29" rx="11" ry="4.4" fill="currentColor" fill-opacity=".2"/><path d="M5 29v-3h22v3"/><path d="M27 27.4l9-3.4"/><path d="M15.4 22c-4.2-2.6-4.4-7-1.6-11 1 2.8 3.2 4 4.2 7 1.1-1.3 1.5-3 .9-4.8 3.1 2.2 3.8 6.4.7 8.8"/>'
};
function degLum(hex) { const c = cnRgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
/* the emblem tile; light walls (nursing, education) get their dark roof colour as the glyph colour for contrast */
function degEmblem(d) {
  const e = document.createElement('div');
  e.className = 'emb'; e.setAttribute('aria-hidden', 'true');
  e.style.setProperty('--c', d.wall); e.style.setProperty('--r', d.roof);
  e.style.setProperty('--ic', degLum(d.wall) > 0.62 ? d.roof : '#ffffff');
  e.innerHTML = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (DEG_EMB[d.id] || DEG_EMB.cs) + '</svg>';
  return e;
}
/* a seeded deckle: the paper outline wobbles by a fraction of a percent */
function degDeckle() {
  const rnd = mulberry32(14), pts = [], n = 26, j = () => (rnd() - 0.5) * 0.9;
  for (let i = 0; i <= n; i++) pts.push((i / n * 100).toFixed(2) + '% ' + (0.4 + j()).toFixed(2) + '%');
  for (let i = 1; i <= 16; i++) pts.push((99.6 + j()).toFixed(2) + '% ' + (i / 16 * 100).toFixed(2) + '%');
  for (let i = n; i >= 0; i--) pts.push((i / n * 100).toFixed(2) + '% ' + (99.6 + j()).toFixed(2) + '%');
  for (let i = 15; i >= 1; i--) pts.push((0.4 + j()).toFixed(2) + '% ' + (i / 16 * 100).toFixed(2) + '%');
  return 'polygon(' + pts.join(',') + ')';
}
let degReady = false;
function degSetup() {
  const scr = $('#degree');
  if (!scr) return;
  if (!degReady) {
    degReady = true;
    try {
      const cv = document.createElement('canvas'); cv.width = cv.height = 96;
      const g = cv.getContext('2d'), id = g.createImageData(96, 96), d = id.data, rnd = mulberry32(17);
      for (let p = 0; p < d.length; p += 4) { const v = rnd() * 2 - 1; d[p] = d[p + 1] = d[p + 2] = v > 0 ? 255 : 0; d[p + 3] = Math.abs(v) * 160; }
      g.putImageData(id, 0, 0); scr.style.setProperty('--dg-noise', 'url(' + cv.toDataURL('image/png') + ')');
    } catch (e) { /* noise is optional */ }
    const dp = $('#degree .dp-paper'); if (dp) dp.style.setProperty('--deckle', degDeckle());
  }
  degArt(0);
}
/* optional plates: the diploma picture and a cream paper texture for the offer letter */
function degArt(n) {
  if (!ART.on || n > 8) return;
  const dp = $('#degree .diploma'), off = $('#offer');
  const a = ART.get('ui/diploma'), p = ART.get('ui/paper-cream');
  if (a && dp) { dp.style.setProperty('--dp-art', 'url("' + a.src + '")'); dp.style.setProperty('--dp-ar', a.naturalWidth + ' / ' + a.naturalHeight); dp.classList.add('art'); }
  if (p && off) off.style.setProperty('--paper-img', 'url("' + p.src + '")');
  const bad = k => { const e = ART.cache.get(k); return !!(e && e.bad); };
  if (!(a || bad('ui/diploma')) || !(p || bad('ui/paper-cream'))) setTimeout(() => degArt(n + 1), 700);
}
