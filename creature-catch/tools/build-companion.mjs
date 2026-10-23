// Builds the companion field guide: companion/creature-catch-field-guide.html, one offline page with every
// creature's lore, stats, moves and evolutions, the type chart, the regions, and cubes and items.
//   node tools/build-companion.mjs
// It reads the same data and art as the game (src/js/1x-data-*.js and the lore, 04-ui.js and 17-expansion.js for items, art/), so it stays in sync.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { SRC } from './load-data.mjs';

const ROOT = path.join(SRC, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['10-data-types.js', '11-data-moves.js', '12-data-creatures.js', '12b-data-expansion.js', '13-data-lore.js', '13a-lore-expansion.js', '13b-family-creatures.js', '04-ui.js', '17-expansion.js']) {
  vm.runInContext(fs.readFileSync(path.join(SRC, 'js', f), 'utf8'), ctx, { filename: f });
}
const CC = ctx.window.CC;
const version = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const uri = (rel) => {
  const p = path.join(ROOT, 'art', rel + '.png');
  return fs.existsSync(p) ? 'data:image/png;base64,' + fs.readFileSync(p).toString('base64') : null;
};

const fxText = (fx) => {
  if (!fx) return '';
  const s = [];
  if (fx.status) s.push(`${fx.chance ? fx.chance + '% chance to ' : ''}${{ burn: 'burn', freeze: 'freeze', shock: 'shock', poison: 'poison', sleep: 'put to sleep' }[fx.status]}${fx.chance ? '' : ' the target'}`);
  if (fx.stat) s.push(`${fx.chance ? fx.chance + '% chance: ' : ''}${fx.self ? 'raises your' : 'lowers the target\'s'} ${{ atk: 'Attack', def: 'Defense', spd: 'Speed', acc: 'accuracy' }[fx.stat]}${Math.abs(fx.stages) > 1 ? ' sharply' : ''}`);
  if (fx.drain) s.push('heals you for half the damage');
  if (fx.recoil) s.push('you take some recoil');
  if (fx.heal) s.push('heals half your HP');
  if (fx.crit) s.push('high critical-hit rate');
  if (fx.priority) s.push('always goes first');
  if (fx.hits) s.push(`hits ${fx.hits[0]}${fx.hits[1] !== fx.hits[0] ? ' to ' + fx.hits[1] : ''} times`);
  return s.join(', ');
};
const how = (at) => typeof at === 'number' ? `Lv ${at}` : at === 'sunshard' ? 'Sun Shard' : 'Moon Shard';
const STAGE = { starter1: 'Starter', starter2: 'Starter, stage 2', starter3: 'Starter, stage 3', base: 'First form', mid: 'Middle form', final: 'Evolved', solo: 'Solo (no evolution)', legend: 'Legendary' };
const RARITY = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', veryrare: 'Very rare' };

// where each base form lives (evolved forms take their line's home)
// (the first place listed wins; the cove's tide-pool fishing isn't a place of its own)
const home = {};
for (const [k, sp] of Object.entries(CC.SPAWNS)) if (k !== 'tidepool') for (const t of ['common', 'uncommon', 'rare']) for (const id of sp[t]) if (!home[id]) home[id] = sp.name;
const placeName = (k) => k && CC.SPAWNS[k] ? CC.SPAWNS[k].name : null;
// the guardians: where you meet them, and whether you can catch them
const LEGEND_AT = { lunariond: 'The Moon Altar, Night Ruins', lunarion: 'The Moon Altar, Night Ruins', groggysolarion: 'The Sun Altar, Dawn Temple', solarion: 'The Sun Altar, Dawn Temple', hidinggloaming: 'The Dusk Pool, Hollow Deep', gloaming: 'The Dusk Pool, Hollow Deep' };
const CALMING = { lunariond: 1, groggysolarion: 1, hidinggloaming: 1 };
const root = (id) => { let c = CC.CREATURES[id]; while (c.from) c = CC.CREATURES[c.from]; return c.id; };

const creatures = CC.CREATURE_ORDER.map((id, i) => {
  const c = CC.CREATURES[id], sig = CC.MOVES[c.sig], r = root(id);
  const chain = []; let cur = CC.CREATURES[r];
  while (cur) { chain.push({ id: cur.id, name: cur.name, how: cur.from ? how(CC.CREATURES[cur.from].evo.at) : '' }); cur = cur.evo && CC.CREATURES[cur.evo.into]; }
  const lore = CC.LORE[id] || { lore: '', note: '' };
  return {
    id, num: i + 1, name: c.name, types: c.types, stage: STAGE[c.kind] || c.kind,
    where: c.kind.startsWith('starter') ? 'Elder Willow (starter)' : c.kind === 'legend' ? LEGEND_AT[id] : CC.CREATURES[r].keeper ? placeName(CC.CREATURES[r].keeper) + ' (its Keeper)'
      : CC.CREATURES[r].moonborn ? 'Anywhere (Moonborn)' : home[id] || home[r] || placeName(CC.CREATURES[r].home) || CC.REGIONS[c.region],
    rarity: c.kind === 'legend' ? (CALMING[id] ? 'A calming battle: it can\'t be caught' : 'One of a kind: calm it, then catch it') : c.from ? 'Evolves from ' + CC.CREATURES[c.from].name
      : CC.CREATURES[r].keeper ? 'One of a kind: calm it, then catch it' : RARITY[CC.RARITY[id]] || (c.kind.startsWith('starter') ? 'Gift' : ''),
    kind: c.kind.startsWith('starter') ? 'starter' : c.kind === 'legend' ? 'legend' : c.kind === 'solo' ? 'solo' : c.from ? 'evolved' : 'first',
    base: c.base, total: c.total, lore: lore.lore, note: lore.note,
    sig: { name: sig.name, type: sig.type, power: sig.power || null, acc: sig.acc || null, pp: sig.pp, fx: fxText(sig.fx) },
    chain: chain.length > 1 ? chain : null, img: uri('creatures/' + id),
  };
});

const types = CC.TYPES;
const chart = types.map((a) => types.map((d) => CC.typeVs(a, d)));
const typeIcons = Object.fromEntries(types.map((t) => [t, uri('ui/type-' + t)]));
const typeColors = CC.TYPE_COLORS;
const GUIDES = { meadow: '', grassland: 'Farmer Bramble', forest: 'Ranger Oakley', water: 'Fisher Gus', cave: 'Dusty the Miner', desert: 'Safi the Nomad', snow: 'Frida the Explorer', swamp: 'Granny Moss', ruins: 'Night Watchman Corvin' };
// the side areas and the post-game places have no trial: the person to meet there instead
const PEOPLE = { orchard: 'Marigold', grove: 'Old Fennick', cove: 'Coral', isle: 'Keeper Wren', copperbell: 'Mayor Barnaby', mine: 'Grit', springs: 'Auntie Yuzu', bayou: 'Boatman Bo',
  archive: 'Archivist Ilsa', temple: 'Grandmother Amani', hollow: '', spire: '' };
// where each place sits in the story (the main road needs no label)
const PART = { orchard: 'Side area', grove: 'Side area', cove: 'Side area', isle: 'Side area', mine: 'Side area', springs: 'Side area', bayou: 'Side area', archive: 'Side area',
  spire: 'After the story', temple: 'After the story', hollow: 'After the story' };
const BG = { meadow: 'grassland', ruins: 'night-ruins', spire: 'moonlit-spire', temple: 'dawn-temple', hollow: 'hollow-deep' };
const regions = Object.entries(CC.SPAWNS).filter(([k]) => k !== 'tidepool').map(([k, s]) => ({
  key: k, name: s.name, levels: s.levels, guide: GUIDES[k], person: PEOPLE[k], part: PART[k] || 'On the road',
  tiers: ['common', 'uncommon', 'rare'].map((t) => ({ tier: RARITY[t], ids: s[t] })).filter((t) => t.ids.length), time: s.time || {},
  bg: uri('bg/' + (BG[k] || k)),
}));
const items = Object.entries(CC.ITEMS).map(([k, it]) => ({ key: k, name: it.name, info: it.info, price: it.price || null, cube: it.cube, duskCube: it.duskCube || null, heal: it.heal, keyItem: !!it.key, icon: uri(it.icon) }));
const data = { version, creatures, types, chart, typeIcons, typeColors, regions, items };

const font = fs.readFileSync(path.join(SRC, 'fonts', 'PixelifySans.ttf')).toString('base64');
const title = uri('bg/title'), map = uri('bg/world-map');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Creature Catch Field Guide</title>
<style>
@font-face { font-family: 'Pixelify'; src: url(data:font/ttf;base64,${font}) format('truetype'); }
:root {
  --bg: #f4ead6; --paper: #fffaf0; --ink: #2a2230; --soft: #6a5a50; --line: #d8c4a0; --accent: #7a3a6e; --accent2: #3a6ae8;
  --chip: #efe2c8; --shadow: 0 2px 0 #c8b088, 0 6px 18px rgba(80,50,20,0.10); --good: #3a9a4a; --bad: #c8503a;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #17131f; --paper: #221c2e; --ink: #efe6f6; --soft: #b0a2c0; --line: #3c3150; --accent: #d488c4; --accent2: #8fb0ff;
  --chip: #2e2640; --shadow: 0 2px 0 #0d0a14, 0 6px 18px rgba(0,0,0,0.35); --good: #6ad07a; --bad: #f08a70;
} }
:root[data-theme="dark"] {
  --bg: #17131f; --paper: #221c2e; --ink: #efe6f6; --soft: #b0a2c0; --line: #3c3150; --accent: #d488c4; --accent2: #8fb0ff;
  --chip: #2e2640; --shadow: 0 2px 0 #0d0a14, 0 6px 18px rgba(0,0,0,0.35); --good: #6ad07a; --bad: #f08a70;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
h1, h2, h3, .pix { font-family: 'Pixelify', system-ui, sans-serif; font-weight: normal; letter-spacing: 0.3px; }
img.px { image-rendering: pixelated; image-rendering: crisp-edges; }
a { color: var(--accent2); }
.wrap { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
header.hero { position: relative; min-height: 300px; display: flex; align-items: flex-end; color: #fff; background: #2a2440 url(${title}) center/cover; image-rendering: pixelated; }
header.hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,10,30,0.05), rgba(20,10,30,0.75)); }
header.hero .wrap { position: relative; z-index: 1; padding-bottom: 28px; width: 100%; }
header.hero h1 { font-size: clamp(34px, 7vw, 60px); margin: 0; text-shadow: 0 3px 0 #5a2a6e; }
header.hero p { margin: 4px 0 0; max-width: 640px; font-size: 17px; text-shadow: 0 1px 2px #000; }
nav.bar { position: sticky; top: 0; z-index: 5; background: var(--paper); border-bottom: 2px solid var(--line); }
nav.bar .wrap { display: flex; gap: 6px; align-items: center; padding-top: 8px; padding-bottom: 8px; overflow-x: auto; }
nav.bar a { font-family: 'Pixelify', sans-serif; text-decoration: none; color: var(--ink); padding: 6px 12px; border-radius: 999px; background: var(--chip); white-space: nowrap; }
nav.bar a:hover { background: var(--line); }
nav.bar .spacer { flex: 1; }
nav.bar button { font: inherit; font-family: 'Pixelify', sans-serif; border: 0; background: var(--chip); color: var(--ink); border-radius: 999px; padding: 6px 12px; cursor: pointer; }
section { padding: 30px 0 10px; }
section h2 { font-size: 30px; margin: 0 0 6px; color: var(--accent); }
section > .wrap > p.lead { margin: 0 0 18px; color: var(--soft); max-width: 760px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; }
.filters input, .filters select { font: inherit; padding: 8px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--paper); color: var(--ink); }
.filters input { flex: 1 1 220px; min-width: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 5px; border: 0; cursor: pointer; font: 13px 'Pixelify', sans-serif; color: #fff; padding: 4px 10px 4px 6px; border-radius: 999px; opacity: 0.72; text-shadow: 0 1px 0 rgba(0,0,0,0.35); }
.chip.on { opacity: 1; box-shadow: 0 0 0 2px var(--ink) inset; }
.chip img { width: 16px; height: 16px; }
.count { color: var(--soft); font-size: 14px; margin-left: auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.card { background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column; scroll-margin-top: 70px; }
.card:target { outline: 3px solid var(--accent); }
.card .top { display: flex; gap: 12px; padding: 14px 14px 10px; align-items: center; }
.sprite { flex: none; width: 104px; height: 104px; border-radius: 12px; display: grid; place-items: center; position: relative; }
.sprite img { width: 92px; height: 92px; object-fit: contain; filter: drop-shadow(0 3px 0 rgba(0,0,0,0.15)); }
.sprite .soon { font: 12px 'Pixelify', sans-serif; color: rgba(255,255,255,0.95); text-align: center; padding: 6px; }
.sprite .soon img { width: 34px; height: 34px; display: block; margin: 0 auto 4px; filter: none; }
.num { font: 600 12px system-ui, sans-serif; color: var(--soft); letter-spacing: 0.5px; }
.card h3 { margin: 0; font-size: 24px; line-height: 1.1; }
.badges { display: flex; gap: 4px; margin: 6px 0 4px; flex-wrap: wrap; }
.badge { display: inline-flex; align-items: center; gap: 4px; font: 12px 'Pixelify', sans-serif; color: #fff; padding: 2px 8px 2px 4px; border-radius: 6px; }
.badge img { width: 14px; height: 14px; }
.meta { font-size: 13px; color: var(--soft); }
.card .body { padding: 0 14px 12px; flex: 1; }
.lore { margin: 0 0 8px; }
.note { font-size: 13px; color: var(--soft); margin: 0 0 10px; padding-left: 10px; border-left: 3px solid var(--line); }
.stats { display: grid; grid-template-columns: 34px 1fr 30px; gap: 3px 8px; align-items: center; font-size: 12px; margin-bottom: 10px; }
.stats .bar { height: 7px; border-radius: 4px; background: var(--chip); overflow: hidden; }
.stats .bar i { display: block; height: 100%; border-radius: 4px; }
.stats b { font: 600 12px system-ui, sans-serif; font-variant-numeric: tabular-nums; text-align: right; }
.sig { font-size: 13px; background: var(--chip); border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }
.sig .pix { font-size: 15px; }
.chain { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 10px 14px; border-top: 2px dashed var(--line); background: color-mix(in srgb, var(--chip) 50%, transparent); }
.chain a { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: var(--ink); font: 12px 'Pixelify', sans-serif; padding: 2px 4px; border-radius: 8px; }
.chain a.here { background: var(--paper); box-shadow: 0 0 0 2px var(--accent) inset; }
.chain a img { width: 40px; height: 40px; object-fit: contain; }
.chain .arrow { font: 11px 'Pixelify', sans-serif; color: var(--soft); text-align: center; min-width: 44px; }
.chain .ph { width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; color: #fff; font-size: 16px; }
.table-scroll { overflow-x: auto; background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); padding: 12px; }
table.chart { border-collapse: collapse; font: 13px 'Pixelify', sans-serif; }
table.chart td { font: 700 14px system-ui, sans-serif; }
table.chart th, table.chart td { width: 44px; height: 40px; text-align: center; border: 1px solid var(--line); }
table.chart th img { width: 18px; height: 18px; display: block; margin: 0 auto 2px; }
table.chart th.row { width: auto; padding: 0 8px; text-align: left; white-space: nowrap; }
table.chart th.row img { display: inline-block; vertical-align: middle; margin: 0 4px 0 0; }
td.x2 { background: color-mix(in srgb, var(--good) 30%, transparent); color: var(--good); font-weight: bold; }
td.x05 { background: color-mix(in srgb, var(--bad) 22%, transparent); color: var(--bad); }
td.x1 { color: var(--soft); opacity: 0.6; }
.legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: var(--soft); margin-top: 10px; }
.regions { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.region { background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; }
.region .pic { height: 110px; background-size: cover; background-position: center 70%; image-rendering: pixelated; position: relative; }
.region .pic span { position: absolute; left: 12px; bottom: 8px; color: #fff; font: 22px 'Pixelify', sans-serif; text-shadow: 0 2px 0 #000; }
.region .pic em { position: absolute; right: 10px; top: 8px; font: 12px 'Pixelify', sans-serif; font-style: normal; background: rgba(0,0,0,0.55); color: #fff; padding: 2px 8px; border-radius: 999px; }
.region .in { padding: 10px 14px 14px; font-size: 14px; }
.region .tier { margin-top: 8px; }
.region .tier b { font: 13px 'Pixelify', sans-serif; color: var(--soft); display: block; }
.minis { display: flex; flex-wrap: wrap; gap: 6px; }
.minis a { display: flex; align-items: center; gap: 4px; text-decoration: none; color: var(--ink); background: var(--chip); border-radius: 999px; padding: 2px 10px 2px 2px; font-size: 13px; }
.minis img { width: 28px; height: 28px; object-fit: contain; }
.minis .ph { width: 28px; height: 28px; border-radius: 50%; }
.mapbox { background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); padding: 12px; margin-bottom: 18px; }
.mapbox img { width: 100%; max-width: 720px; display: block; margin: 0 auto; border-radius: 8px; }
.items { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.item { background: var(--paper); border-radius: 12px; box-shadow: var(--shadow); padding: 12px; display: flex; gap: 12px; align-items: flex-start; }
.item img { width: 44px; height: 44px; object-fit: contain; flex: none; }
.item h3 { margin: 0; font-size: 18px; }
.item p { margin: 2px 0 0; font-size: 14px; color: var(--soft); }
.item .tag { font: 12px 'Pixelify', sans-serif; color: var(--accent); }
footer { padding: 30px 0 50px; color: var(--soft); font-size: 13px; text-align: center; }
.empty { padding: 30px; text-align: center; color: var(--soft); }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } .sprite { width: 88px; height: 88px; } .sprite img { width: 78px; height: 78px; } }
</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <h1>Creature Catch Field Guide</h1>
  <p>Every creature from Home Village to the Hollow Deep: where to find them, how they grow, and the stories the old folks tell about them.</p>
</div></header>
<nav class="bar"><div class="wrap">
  <a href="#creatures">Creatures</a><a href="#types">Types</a><a href="#regions">Regions</a><a href="#items">Cubes &amp; items</a>
  <span class="spacer"></span><button id="theme" type="button" aria-label="Switch light or dark">Light / dark</button>
</div></nav>

<section id="creatures"><div class="wrap">
  <h2>Creatures</h2>
  <p class="lead">Creatures hide in tall grass and jump out when you walk through it. Weaken one, throw a cube, and it's yours. Most grow into stronger forms as they level up, and a few need a shard to change.</p>
  <div class="filters">
    <input id="q" type="search" placeholder="Search by name, place, or anything in the lore">
    <select id="region" aria-label="Region"></select>
    <select id="stage" aria-label="Stage">
      <option value="">Every stage</option><option value="starter">Starters</option><option value="first">First forms</option>
      <option value="evolved">Evolved forms</option><option value="solo">Solo (no evolution)</option><option value="legend">Legendary</option>
    </select>
  </div>
  <div class="filters"><div class="chips" id="typechips"></div><span class="count" id="count"></span></div>
  <div class="grid" id="grid"></div>
</div></section>

<section id="types"><div class="wrap">
  <h2>Types</h2>
  <p class="lead">Eight elemental types go round in a wheel. Each one hits two others for double damage and is hit hard by two others. Normal sits outside the wheel and is even with everything. Read across from the attacking type, then down to the defender.</p>
  <div class="table-scroll"><table class="chart" id="chart"></table></div>
  <div class="legend"><span><b style="color:var(--good)">2</b> = double damage</span><span><b style="color:var(--bad)">½</b> = half damage</span><span>blank = normal damage</span><span>A creature with two types multiplies both, so 4x and ¼x can happen.</span></div>
</div></section>

<section id="regions"><div class="wrap">
  <h2>Regions</h2>
  <p class="lead">The land is one long road from Home Village to the Night Ruins, with Copperbell Town halfway along. Each region's wild creatures are a little stronger than the last, and a guide at each exit opens the way forward once you beat their trial. Every region has an outpost with a Healing Hut and the Cube Vault. Side paths lead off the road to orchards, coves, springs and old ruins, and some creatures only come out by day or at night. After the story, the Moonlit Spire, the Dawn Temple and the Hollow Deep wait.</p>
  <div class="mapbox"><img class="px" src="${map}" alt="Map of the land, from Home Village to the Night Ruins, with the side areas and the places past the story"></div>
  <div class="regions" id="regionlist"></div>
</div></section>

<section id="items"><div class="wrap">
  <h2>Cubes &amp; items</h2>
  <p class="lead">Every capture cube is purple on top and blue on the bottom. Better cubes add bands and studs, and better odds. A creature that is worn down, asleep, or frozen is much easier to catch.</p>
  <div class="items" id="itemlist"></div>
</div></section>

<footer>Creature Catch Field Guide, made from the game's own data (v${version}). Pictures marked "art coming" are still being painted.</footer>

<script>
var D = ${JSON.stringify(data)};
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var col = function (t, i) { return (D.typeColors[t] || D.typeColors.Normal)[i]; };
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var byId = {}; D.creatures.forEach(function (c) { byId[c.id] = c; });
  var badge = function (t) { return '<span class="badge" style="background:' + col(t, 1) + '">' + (D.typeIcons[t] ? '<img class="px" src="' + D.typeIcons[t] + '" alt="">' : '') + t + '</span>'; };
  var mini = function (id, size) {
    var c = byId[id];
    return c.img ? '<img class="px" src="' + c.img + '" alt="">' : '<span class="ph" style="background:' + col(c.types[0], 1) + '">?</span>';
  };
  var STATS = [['HP', 'hp', '#48c050'], ['Atk', 'atk', '#e8784a'], ['Def', 'def', '#e8c040'], ['Spd', 'spd', '#5aa8f0']];
  function card(c) {
    var sprite = c.img ? '<img class="px" src="' + c.img + '" alt="' + esc(c.name) + '">'
      : '<div class="soon">' + (D.typeIcons[c.types[0]] ? '<img class="px" src="' + D.typeIcons[c.types[0]] + '" alt="">' : '') + 'art coming</div>';
    var stats = STATS.map(function (s) { var v = c.base[s[1]]; return '<span>' + s[0] + '</span><span class="bar"><i style="width:' + Math.min(100, v / 1.5) + '%;background:' + s[2] + '"></i></span><b>' + v + '</b>'; }).join('');
    var sig = c.sig, sigLine = (sig.power ? 'Power ' + sig.power + ', ' : '') + (sig.acc ? sig.acc + '% accuracy, ' : '') + sig.pp + ' PP' + (sig.fx ? '. ' + sig.fx.charAt(0).toUpperCase() + sig.fx.slice(1) + '.' : '.');
    var chain = c.chain ? '<div class="chain">' + c.chain.map(function (s, i) {
      return (i ? '<span class="arrow">&rarr;<br>' + esc(s.how) + '</span>' : '') + '<a href="#c-' + s.id + '" class="' + (s.id === c.id ? 'here' : '') + '">' + mini(s.id) + esc(s.name) + '</a>';
    }).join('') + '</div>' : '';
    return '<article class="card" id="c-' + c.id + '">' +
      '<div class="top"><div class="sprite" style="background:linear-gradient(160deg,' + col(c.types[0], 0) + ',' + col(c.types[c.types.length - 1], 1) + ')">' + sprite + '</div>' +
      '<div><div class="num">No. ' + String(c.num).padStart(3, '0') + '</div><h3>' + esc(c.name) + '</h3><div class="badges">' + c.types.map(badge).join('') + '</div>' +
      '<div class="meta">' + esc(c.stage) + '<br>' + esc(c.where) + (c.rarity ? ' &middot; ' + esc(c.rarity) : '') + '</div></div></div>' +
      '<div class="body"><p class="lore">' + esc(c.lore) + '</p>' + (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') +
      '<div class="stats">' + stats + '<span></span><span class="meta">Base total</span><b>' + c.total + '</b></div>' +
      '<div class="sig"><span class="meta">Signature move</span><br><span class="pix">' + esc(sig.name) + '</span> ' + (sig.type ? badge(sig.type) : '') + '<br>' + esc(sigLine) + '</div></div>' +
      chain + '</article>';
  }
  // filters
  var regionsSeen = [];
  D.creatures.forEach(function (c) { var r = c.where.indexOf('Elder') === 0 ? 'Home Village' : c.where; if (regionsSeen.indexOf(r) < 0) regionsSeen.push(r); });
  $('region').innerHTML = '<option value="">Every region</option>' + regionsSeen.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('');
  var picked = {};
  $('typechips').innerHTML = D.types.map(function (t) { return '<button class="chip" data-t="' + t + '" style="background:' + col(t, 1) + '">' + (D.typeIcons[t] ? '<img class="px" src="' + D.typeIcons[t] + '" alt="">' : '') + t + '</button>'; }).join('');
  $('typechips').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; picked[b.dataset.t] = !picked[b.dataset.t]; b.classList.toggle('on', picked[b.dataset.t]); draw(); });
  function draw() {
    var q = $('q').value.trim().toLowerCase(), reg = $('region').value, st = $('stage').value, types = Object.keys(picked).filter(function (k) { return picked[k]; });
    var list = D.creatures.filter(function (c) {
      if (q && (c.name + ' ' + c.where + ' ' + c.lore + ' ' + c.note + ' ' + c.types.join(' ')).toLowerCase().indexOf(q) < 0) return false;
      if (reg && (c.where.indexOf('Elder') === 0 ? 'Home Village' : c.where) !== reg) return false;
      if (st && c.kind !== st) return false;
      if (types.length && !types.some(function (t) { return c.types.indexOf(t) >= 0; })) return false;
      return true;
    });
    $('grid').innerHTML = list.length ? list.map(card).join('') : '<div class="empty">No creatures match. Try fewer filters.</div>';
    $('count').textContent = list.length + ' of ' + D.creatures.length + ' creatures';
  }
  ['q', 'region', 'stage'].forEach(function (id) { $(id).addEventListener('input', draw); });
  draw();
  if (location.hash) { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
  // type chart
  var head = '<tr><th class="row">Attacker &darr; / Defender &rarr;</th>' + D.types.map(function (t) { return '<th>' + (D.typeIcons[t] ? '<img class="px" src="' + D.typeIcons[t] + '" alt="">' : '') + t.slice(0, 4) + '</th>'; }).join('') + '</tr>';
  $('chart').innerHTML = head + D.types.map(function (a, i) {
    return '<tr><th class="row">' + (D.typeIcons[a] ? '<img class="px" src="' + D.typeIcons[a] + '" alt="">' : '') + a + '</th>' + D.chart[i].map(function (v) {
      return v === 2 ? '<td class="x2">2</td>' : v === 0.5 ? '<td class="x05">½</td>' : '<td class="x1"></td>';
    }).join('') + '</tr>';
  }).join('');
  // regions
  $('regionlist').innerHTML = D.regions.map(function (r) {
    return '<div class="region"><div class="pic" style="background-image:url(' + r.bg + ')"><span>' + esc(r.name) + '</span><em>' + esc(r.part) + '</em></div><div class="in">' +
      'Wild creatures Lv ' + r.levels[0] + ' to ' + r.levels[1] + (r.guide ? ' &middot; Guide: ' + esc(r.guide) : r.person ? ' &middot; Meet: ' + esc(r.person) : r.person === '' ? '' : ' &middot; No guide: a gentle first route') +
      r.tiers.map(function (t) { return '<div class="tier"><b>' + t.tier + '</b><div class="minis">' + t.ids.map(function (id) { return '<a href="#c-' + id + '">' + mini(id) + esc(byId[id].name) + (r.time[id] ? '&nbsp;<small>(' + (r.time[id] === 'night' ? 'night' : 'day') + ')</small>' : '') + '</a>'; }).join('') + '</div></div>'; }).join('') +
      '</div></div>';
  }).join('');
  // items
  $('itemlist').innerHTML = D.items.map(function (it) {
    var tag = it.keyItem ? 'Key item' : it.cube >= 999 ? 'Always catches' : it.duskCube ? '+' + it.cube + ' by day, +' + it.duskCube + ' at night' : it.cube != null ? (it.cube ? '+' + it.cube + ' catch bonus' : 'The basic cube') : it.heal ? 'Heals ' + it.heal + ' HP' : '';
    return '<div class="item">' + (it.icon ? '<img class="px" src="' + it.icon + '" alt="">' : '') + '<div><h3 class="pix">' + esc(it.name) + '</h3><span class="tag">' + tag + (it.price ? ' &middot; ' + it.price + ' coins' : '') + '</span><p>' + esc(it.info) + '</p></div></div>';
  }).join('');
  // light / dark
  var root = document.documentElement;
  try { var saved = localStorage.getItem('cc-guide-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  $('theme').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('cc-guide-theme', root.dataset.theme); } catch (e) {}
  });
})();
</script>
</body>
</html>
`;
const outDir = path.join(ROOT, 'companion');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'creature-catch-field-guide.html');
fs.writeFileSync(out, html);
console.log(`Field guide v${version}: wrote ${path.relative(process.cwd(), out)}: ${(html.length / 1024).toFixed(0)} KB, ${creatures.length} creatures (${creatures.filter((c) => c.img).length} with art)`);
