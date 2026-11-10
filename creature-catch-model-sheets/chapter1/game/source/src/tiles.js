// tiles.js: the painted texture tiles for buildings, furniture and props (chapter1/textures/tiles, made game-sized by
// game/tools/pack_tiles.py into assets/tiles/). Materials repeat; stickers (doors, windows, signs, furniture fronts, the
// healing machine...) have see-through backgrounds and go on flat panels.
//   TILES.tex(name, fallback)  the tile's texture, made at once; it shows `fallback` (a canvas texture) until the
//                              painted picture arrives, and keeps it if the picture can't be loaded
//   TILES.load(onProgress)     resolves when every tile asked for so far has loaded (or failed)
//   TILES.aspect(name)         a sticker's width / height
//   TILES.sticker(name, w, h)  a flat panel w x h (centred, facing +Z) with the sticker on it, for KIT.builder
const TILES = (() => {
  'use strict';
  const BASE = 'assets/tiles/';
  const DECALS = new Set(['books', 'herb_shelf', 'clock_face', 'notice_board', 'piano_front', 'stove_front', 'door', 'door_round', 'window', 'window_round', 'sign_heart', 'sign_inn', 'healing_machine', 'cube_vault', 'mailbox', 'lamp_glass', 'hay_bale_end', 'barrel_top']);
  const made = {}, waits = [];
  let info = {};
  const blank = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = '#c8b8a0'; g.fillRect(0, 0, 2, 2); return c; })();
  const clear = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; return c; })();
  function tex(name, fallback) {
    if (made[name]) return made[name];
    const decal = DECALS.has(name);
    const t = new THREE.Texture(fallback && fallback.image ? fallback.image : decal ? clear : blank);
    t.wrapS = t.wrapT = decal ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.anisotropy = 4; t.encoding = THREE.LinearEncoding; t.needsUpdate = true;
    if (fallback && fallback.magFilter) { t.magFilter = fallback.magFilter; }
    const img = new Image();
    waits.push(new Promise((ok) => {
      img.onload = () => { t.image = img; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; ok(); };
      img.onerror = () => { console.warn('[cc] tile ' + name + ' not found: keeping the old look'); ok(); };
    }));
    img.src = BASE + name + (decal ? '.webp' : '.jpg');
    return (made[name] = t);
  }
  async function load(onProgress) {
    try { const r = await fetch(BASE + 'index.json'); if (r.ok) info = await r.json(); } catch (e) { /* no list: stickers stay square */ }
    let n = 0; const all = waits.slice();
    await Promise.all(all.map((p) => p.then(() => { n++; if (onProgress) onProgress(n / all.length); })));
  }
  const aspect = (name) => (info[name] && info[name].aspect) || 1;
  // sticker materials: lit like the buildings, cut out where the picture is see-through, see-through near the player too
  const stickerMats = {};
  function stickerMat(name, o) {
    const key = name + (o && o.glow ? '-glow' : '');
    if (stickerMats[key]) return stickerMats[key];
    const m = o && o.glow ? new THREE.MeshBasicMaterial({ map: tex(name), alphaTest: .45, transparent: false })
      : KIT.paint('#ffffff', { see: true, mat: { map: tex(name), alphaTest: .45 } });
    m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -2; m.userData.sticker = true;
    return (stickerMats[key] = m);
  }
  const PLANE = new THREE.PlaneGeometry(1, 1);
  return { tex, load, aspect, stickerMat, PLANE, DECALS, get info() { return info; } };
})();
