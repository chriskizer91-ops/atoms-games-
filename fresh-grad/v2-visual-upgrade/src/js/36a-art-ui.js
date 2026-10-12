/* ============================ optional art slots for overlays, cards, phone, panels and icons ============================ */
// Presentation only. Every helper here asks ART for a key when its screen is built and upgrades the slot in place once the
// file has loaded (ART.when). Nothing is drawn or changed while a file is missing, so without art (or with ?noart) every
// screen is exactly the procedural one. Keys follow ../IMAGE_PROMPTS.md (P04 ui/, P05 portraits/, P06 bg/, P07 icons/ and food/).

// draw an icon over a canvas slot once it loads: clears the procedural drawing and paints the art centred, contain-fit.
// o.z zooms (the brief's icons fill ~70% of their frame), o.rot rotates (passport stamps), o.ghost draws a faint pencil
// version (stamps not yet collected).
function artCanvas(cv, key, o) {
  if (!cv || !key) return;
  o = o || {};
  ART.when(key, img => {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, iw = img.naturalWidth || W, ih = img.naturalHeight || H;
    const s = Math.min(W / iw, H / ih) * (o.z || 1), w = iw * s, h = ih * s;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    c.translate(W / 2, H / 2); if (o.rot) c.rotate(o.rot);
    if (o.ghost) { c.globalAlpha = 0.3; c.filter = 'grayscale(1) sepia(.55) contrast(.9)'; }
    c.drawImage(img, -w / 2, -h / 2, w, h);
    c.restore();
  });
}
// put the art into a fixed-size DOM slot (an <img> sized by CSS); the slot gets .has-art so CSS can hide the procedural glyph.
function artSlot(box, key, cls) {
  if (!box || !key) return;
  ART.when(key, img => {
    if (box.querySelector(':scope > img.art-ic')) return;
    const im = document.createElement('img');
    im.className = 'art-ic' + (cls ? ' ' + cls : ''); im.alt = ''; im.decoding = 'async'; im.draggable = false; im.src = img.src;
    box.appendChild(im); box.classList.add('has-art');
  });
}
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
// a background image on a fixed element through a CSS variable + class (phone wallpaper, passport cover)
function artSkin(elm, key, cls, prop) {
  if (!elm || !key) return;
  ART.when(key, img => { elm.style.setProperty(prop, 'url("' + img.src + '")'); elm.classList.add(cls); });
}

/* P05: who is texting you -> portrait slug. Unlisted senders keep the coloured initial. */
const ART_PORTRAIT = {
  'Maya': 'maya', 'Rosa': 'rosa', 'Mr. Bell': 'mr-bell', 'Theo': 'theo', 'Priya': 'priya', 'Walt': 'walt', 'June': 'june',
  'Officer Cole': 'officer-cole', 'Ines': 'ines', 'Lena': 'lena', 'Sam': 'sam-musician', 'Kofi': 'kofi', 'Mrs. Reyes': 'mrs-reyes',
  'Dev': 'dev', 'Mr. Tanaka': 'mr-tanaka', 'Ms. Odell': 'ms-odell', 'Dot': 'dot', 'Gus': 'gus', 'Nurse Imani': 'nurse-imani',
  'Dr. Chen': 'dr-chen', 'Noor': 'noor', 'Felix': 'felix', 'Dana Whitlock': 'dana-whitlock', 'Olga': 'olga', 'Pavel': 'pavel',
  'Mr. Keller': 'mr-keller', 'Dr. Amari': 'dr-amari', 'Tomas': 'tomas', 'Head Nurse Rosalind': 'head-nurse-rosalind',
  'Carter': 'carter', 'Imogen': 'imogen', 'Ms. Pike': 'ms-pike', 'Dmitri': 'dmitri', 'Beto': 'beto', 'Chef Marisol': 'chef-marisol',
  'Mr. Okafor': 'mr-okafor', 'Greta': 'greta', 'Mr. Hale': 'mr-hale', 'Agnes': 'agnes', 'Milo': 'milo', 'Luc': 'luc', 'Tess': 'tess',
  'Hank': 'hank', 'Zoe': 'zoe-cinema', 'Ike': 'ike', 'Bianca': 'bianca', 'Gwen': 'gwen', 'Mrs. Kim': 'mrs-kim', 'Nadia': 'nadia',
  'Rafa': 'rafa', 'Luna': 'luna', 'Otis': 'otis', 'Sal': 'sal', 'Ruby': 'ruby-dental', 'Dr. Patel': 'dr-patel'
};
const artPortraitKey = name => ART_PORTRAIT[name] ? 'portraits/' + ART_PORTRAIT[name] : null;

/* P07 food/: option row title -> slug. Place-specific titles first (key 'place|title'), then the title alone, then patterns. */
const ART_FOOD = {
  'cinema|Fountain soda': 'cinema-soda', 'pizza|Fountain soda': 'pizza-soda',
  'Breakfast plate': 'diner-breakfast-plate', 'Lunch special': 'diner-lunch-special', 'Dinner plate': 'diner-dinner-plate',
  'Fries and pie': 'diner-fries-pie', "Slice of Dot's pie": 'diner-pie-slice', 'Coffee': 'diner-coffee', 'Milkshake': 'diner-milkshake',
  'Ice water': 'diner-ice-water', 'Play your favorite song': 'diner-jukebox-song',
  'Breakfast pack': 'grocery-breakfast-pack', 'Lunch pack': 'grocery-lunch-pack', 'Dinner pack': 'grocery-dinner-pack',
  'Snack bar': 'grocery-snack-bar', 'Bottled water': 'grocery-water', 'Water bottle refill': 'grocery-water', 'Orange juice': 'grocery-orange-juice',
  'Soda': 'grocery-soda', 'Energy drink': 'grocery-energy-drink',
  'Croissant and coffee': 'bakery-croissant-coffee', 'Cinnamon roll': 'bakery-cinnamon-roll', 'Slice of cake': 'bakery-cake-slice',
  'Croissant': 'bakery-croissant', 'Fresh loaf': 'bakery-loaf', 'Day-old loaf': 'bakery-loaf', 'Day-old pastry bag': 'bakery-day-old-bag',
  'Latte': 'cafe-latte', 'Iced tea': 'cafe-iced-tea', 'Hot chocolate': 'cafe-hot-chocolate', 'Grilled panini': 'cafe-panini', 'Blueberry muffin': 'cafe-muffin',
  'Cheese slice': 'pizza-cheese-slice', 'Garlic knots': 'pizza-garlic-knots', 'Whole pie, eat in': 'pizza-whole-pie', 'Whole pie to go': 'pizza-whole-pie',
  'Popcorn for the movie': 'cinema-popcorn', 'Candy': 'cinema-candy',
  'Daily vitamins': 'pharm-vitamins', 'Pain reliever': 'pharm-pain-reliever', 'Sleep aid': 'pharm-sleep-aid', 'Protein bar': 'pharm-protein-bar',
  'Electrolyte drink': 'pharm-electrolyte', 'Cough drops': 'pharm-cough-drops',
  'Farm box': 'market-farm-box', 'Fresh lemonade': 'market-lemonade', 'Hot apple cider': 'market-cider', 'Jar of local honey': 'market-honey', 'Bouquet of flowers': 'market-bouquet',
  'Coffee maker': 'hw-coffee-maker', 'Memory-foam mattress': 'hw-mattress', 'Blackout curtains': 'hw-curtains', 'Reading chair and lamp': 'hw-reading-chair-lamp',
  'Record player': 'hw-record-player', 'A few houseplants': 'hw-houseplant', 'Fishing rod': 'hw-fishing-rod', 'Sturdy umbrella': 'hw-umbrella',
  'Rent a bike for today': 'bike-commuter', 'Cycling cap': 'bike-cap'
};
const ART_FOOD_RX = [[/ rug$/, 'hw-rug'], [/ commuter bike$/, 'bike-commuter']];
// the place an option row belongs to: the building panel id, or the interior for an in-room spot
function artPanelPlace(id) { return id && id.startsWith('ispot:') ? (S && S.intId) || '' : id || ''; }
function artFoodKey(id, it) {
  const t = it && it.t; if (!t) return null;
  const pl = artPanelPlace(id);
  if (pl === 'notice' || pl.startsWith('npc:') || pl.startsWith('bus:') || pl.startsWith('sch:')) return null;
  let slug = ART_FOOD[pl + '|' + t] || ART_FOOD[t];
  if (!slug) for (const r of ART_FOOD_RX) if (r[0].test(t)) { slug = r[1]; break; }
  return slug ? 'food/' + slug : null;
}
// P06: the backdrop behind a panel (only the blackout notice has one)
function artPanelBackdrop(id, spec) { return id === 'notice' && spec && spec.title === 'You blacked out' ? 'bg/blackout' : null; }
// a passport stamp (P07 icons/stamps/<id>) over drawStampArt's canvas, at the same per-place tilt; uncollected = faint ghost
function artStamp(c, id, got) { artCanvas(c.canvas, 'icons/stamps/' + id, { z: 1.25, rot: (hash01(id.length * 7, id.charCodeAt(0), 11) - 0.5) * 0.6, ghost: !got }); }
