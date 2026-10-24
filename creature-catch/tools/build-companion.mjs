// Builds the companion field guide: companion/creature-catch-field-guide.html, one offline page with every
// creature's lore, stats, moves and evolutions, place by place in the order you reach them (one tab per place, so
// nothing is spoiled), plus the map, the type chart, and cubes and items.
//   node tools/build-companion.mjs
// It reads the same data and art as the game (src/js/1x-data-*.js and the lore, 04-ui.js and 17-expansion.js for items, art/), so it stays in sync.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { SRC } from './load-data.mjs';

const ROOT = path.join(SRC, '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['10-data-types.js', '11-data-moves.js', '12-data-creatures.js', '12b-data-expansion.js', '12c-data-final.js', '13-data-lore.js', '13a-lore-expansion.js', '13b-family-creatures.js', '13c-field-order.js', '13d-lore-final.js', '04-ui.js', '17-expansion.js']) {
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
  if (fx.drain) s.push('heals you for ' + (fx.drain === 0.5 ? 'half the damage' : fx.drain === 0.25 ? 'a quarter of the damage' : Math.round(fx.drain * 100) + '% of the damage'));
  if (fx.recoil) s.push('you take some recoil');
  if (fx.heal) s.push('heals half your HP');
  if (fx.crit) s.push('high critical-hit rate');
  if (fx.priority) s.push('always goes first');
  if (fx.hits) s.push(`hits ${fx.hits[0]}${fx.hits[1] !== fx.hits[0] ? ' to ' + fx.hits[1] : ''} times`);
  if (fx.coins) s.push('your creature swipes extra coins if you win'); // only your own creature's swipes count
  return s.join(', ');
};
const how = (at) => typeof at === 'number' ? `Lv ${at}` : at === 'sunshard' ? 'Sun Shard' : 'Moon Shard';
const STAGE = { starter1: 'Starter', starter2: 'Starter, stage 2', starter3: 'Starter, stage 3', base: 'First form', mid: 'Middle form', final: 'Evolved', solo: 'Solo (no evolution)', legend: 'Legendary' };
const RARITY = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', veryrare: 'Very rare' };

// The field order (src/js/13c-field-order.js): the places in the order you reach them, and every creature numbered
// in the place where you can first meet its line. Each place gets a tab; the creatures from earlier tabs that also
// live there are listed under "Also found here".
const C = CC.CREATURES;
// the guardians: where you meet them, and whether you can catch them
const LEGEND_AT = { lunariond: 'The Moon Altar, Night Ruins', lunarion: 'The Moon Altar, Night Ruins', groggysolarion: 'The Sun Altar, Dawn Temple', solarion: 'The Sun Altar, Dawn Temple', hidinggloaming: 'The Dusk Pool, Hollow Deep', gloaming: 'The Dusk Pool, Hollow Deep' };
const CALMING = { lunariond: 1, groggysolarion: 1, hidinggloaming: 1 };
const root = (id) => { let c = C[id]; while (c.from) c = C[c.from]; return c.id; };
const zoneName = Object.fromEntries(CC.ZONES.map((z) => [z.key, z.name]));

// where each form turns up in the wild: one { zone, tier, time, pct } per place, from the tables the game rolls from
// (CC.spawnTable, with each place's own levels; a creature past its evolution level is met evolved). pct: how often
// it turns up there by day and at night, in percent, once you've met everything there (the game's new-creature
// bonus left out). A place with two lists (the Cove's grass and tide pools) takes the first list that has the form.
const appear = {};
for (const z of CC.ZONES) for (const k of z.spawns) for (const night of [false, true]) {
  const list = CC.spawnTable(k, night), sum = list.reduce((n, e) => n + e.w, 0);
  for (const e of list) for (let lv = e.levels[0]; lv <= e.levels[1]; lv++) {
    const f = CC.wildForm(e.id, lv), a = appear[f] || (appear[f] = []);
    let x = a.find((x) => x.zone === z.key);
    if (!x) a.push(x = { zone: z.key, list: k, tier: RARITY[e.tier], time: (CC.SPAWNS[k].time || {})[e.id] || '', pct: [0, 0] });
    if (x.list === k) x.pct[night ? 1 : 0] += 100 * e.w / sum / (e.levels[1] - e.levels[0] + 1);
  }
}
for (const a of Object.values(appear)) for (const x of a) { delete x.list; x.pct = x.pct.map((v) => v ? Math.max(1, Math.round(v)) : 0); }

const creatures = CC.CREATURE_ORDER.map((id, i) => {
  const c = C[id], sig = CC.MOVES[c.sig], first = C[root(id)];
  const chain = []; let cur = first;
  while (cur) { chain.push({ id: cur.id, name: cur.name, how: cur.from ? how(C[cur.from].evo.at) : '' }); cur = cur.evo && C[cur.evo.into]; }
  const lore = CC.LORE[id] || { lore: '', note: '' };
  // how you get the ones that don't live in the grass
  const found = c.kind === 'starter1' ? 'A gift from Elder Willow: pick one of three'
    : c.kind === 'legend' ? LEGEND_AT[id] + '. ' + (CALMING[id] ? 'A calming battle: it can\'t be caught.' : 'One of a kind: calm it, then catch it.')
    : first.keeper && !c.from ? 'The Keeper of ' + zoneName[first.keeper] + '. One of a kind: calm it, then catch it.'
    : first.moonborn && !c.from ? 'Moonborn: it can turn up in any tall grass, now and then.' : '';
  return {
    id, num: i + 1, zone: CC.ZONE_OF[id], name: c.name, types: c.types, stage: STAGE[c.kind] || c.kind,
    kind: c.kind.startsWith('starter') ? 'starter' : c.kind === 'legend' ? 'legend' : c.kind === 'solo' ? 'solo' : c.from ? 'evolved' : 'first',
    found, from: c.from ? { name: C[c.from].name, how: how(C[c.from].evo.at) } : null, appear: appear[id] || [],
    // the total under the stat bars is the sum of the four (the data's total is the budget they're rounded from)
    base: c.base, total: c.base.hp + c.base.atk + c.base.def + c.base.spd, lore: lore.lore, note: lore.note,
    sig: { name: sig.name, type: sig.type, power: sig.power || null, acc: sig.acc || null, pp: sig.pp, fx: fxText(sig.fx) },
    chain: chain.length > 1 ? chain : null, img: uri('creatures/' + id),
  };
});

const types = CC.TYPES;
const chart = types.map((a) => types.map((d) => CC.typeVs(a, d)));
const typeIcons = Object.fromEntries(types.map((t) => [t, uri('ui/type-' + t)]));
const typeColors = CC.TYPE_COLORS;
const GUIDES = { grassland: 'Farmer Bramble', forest: 'Ranger Oakley', water: 'Fisher Gus', cave: 'Dusty the Miner', desert: 'Safi the Nomad', snow: 'Frida the Explorer', swamp: 'Granny Moss', ruins: 'Night Watchman Corvin' };
// the side areas and the places after the story have no trial: the person to meet there instead
const PEOPLE = { village: 'Elder Willow', orchard: 'Marigold', grove: 'Old Fennick', cove: 'Coral', isle: 'Keeper Wren', copperbell: 'Mayor Barnaby', mine: 'Grit', springs: 'Auntie Yuzu', bayou: 'Boatman Bo',
  archive: 'Archivist Ilsa', temple: 'Grandmother Amani' };
const PART = { village: 'Where it starts', orchard: 'Side area', grove: 'Side area', cove: 'Side area', isle: 'Side area', mine: 'Side area', springs: 'Side area', bayou: 'Side area', archive: 'Side area',
  spire: 'After the story', temple: 'After the story', hollow: 'After the story', anywhere: 'Anywhere', elsewhere: 'Gifts' };
// how to get there
const WHERE = {
  village: 'Where it all starts. Elder Willow gives you your first creature here: pick one of the three.',
  meadow: 'The first path out of Home Village. A gentle place to catch your first creature.',
  grassland: 'Past the Meadow Path. Farmer Bramble\'s trial opens the log gate at the far end.',
  orchard: 'East of the Grassland.', forest: 'North of the Grassland, past the log gate.', grove: 'West of the Forest.',
  water: 'North of the Forest.', cove: 'South of the Lakeshore. Dip a hand in the tide pools, too.', isle: 'Out at sea. Fisher Gus\'s boat sails there from Driftwood Cove.',
  cave: 'North of the Lakeshore.', copperbell: 'On the road between the Crystal Cave and the Sunscorch Desert. Look in the park\'s grass.', mine: 'Its door is in Copperbell Town.',
  desert: 'North of Copperbell Town.', snow: 'North of the Sunscorch Desert.', springs: 'West of Frostpeak Pass.',
  swamp: 'North of Frostpeak Pass.', bayou: 'East of Murkmire Swamp. Its fireflies come out at night.',
  ruins: 'North of Murkmire Swamp. The Moon Altar is at the very top.', archive: 'Down the locked stairway in the Night Ruins. Night Watchman Corvin has the key.',
  spire: 'Beside the Moon Altar. It opens once the moon is restored.', temple: 'Under the desert oasis. Grandmother Amani opens it once you have 8 Lost Pages.',
  hollow: 'Behind the Ancient Door in Glimmer Mine, at the very bottom of the world.',
  anywhere: 'Moonborn were dreamed up under the full moon. They turn up now and then in any tall grass, anywhere.',
  elsewhere: 'Creatures you can only get as a gift.',
};
const BG = { village: 'village-training', meadow: 'grassland', ruins: 'night-ruins', spire: 'moonlit-spire', temple: 'dawn-temple', hollow: 'hollow-deep', anywhere: 'moon-altar', elsewhere: 'grassland' };
const numOf = Object.fromEntries(creatures.map((c) => [c.id, c.num]));
const zones = CC.ZONES.map((z, i) => {
  const lv = z.spawns.map((k) => CC.SPAWNS[k].levels);
  return {
    key: z.key, num: i + 1, name: z.name, after: !!z.after, part: PART[z.key] || 'On the road', where: WHERE[z.key] || '', guide: GUIDES[z.key] || '', person: PEOPLE[z.key] || '',
    levels: lv.length ? [Math.min(...lv.map((l) => l[0])), Math.max(...lv.map((l) => l[1]))] : null, ids: z.ids,
    // creatures from earlier tabs (or later ones, for evolved forms) that also live here
    also: Object.keys(appear).filter((f) => CC.ZONE_OF[f] !== z.key && appear[f].some((a) => a.zone === z.key)).sort((a, b) => numOf[a] - numOf[b])
      .map((f) => ({ id: f, time: appear[f].find((a) => a.zone === z.key).time })),
    bg: uri('bg/' + (BG[z.key] || z.key)),
  };
});
// the tag under an item's name: what it does, then its price
const itemTag = (it) => {
  const t = it.key ? ['Key item'] : it.cube >= 999 ? ['Always catches'] : it.duskCube ? [`+${it.cube} by day, +${it.duskCube} at night`]
    : it.cube != null ? [it.cube ? `+${it.cube} catch bonus` : 'The basic cube'] : it.heal >= 999 ? ['Full heal']
    : [it.heal ? `Heals ${it.heal} HP` : '', it.pp ? 'Restores PP' : '', it.cure ? (it.cure === true ? 'Cures status' : 'Cures ' + it.cure) : '', it.revive ? 'Revives' : '', it.shard ? 'Evolves some creatures' : ''];
  if (it.price) t.push(it.price + ' coins');
  return t.filter(Boolean).join(' · ');
};
const items = Object.entries(CC.ITEMS).map(([k, it]) => ({ key: k, name: it.name, info: it.info, tag: itemTag(it), icon: uri(it.icon) }));
const data = { version, creatures, types, chart, typeIcons, typeColors, zones, items };

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
section { padding: 30px 0 10px; scroll-margin-top: 30px; } /* the nav's links land with the heading below the sticky bar */
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
.tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 16px; }
.tabs button { font: 14px 'Pixelify', sans-serif; border: 0; cursor: pointer; background: var(--chip); color: var(--ink); padding: 4px 12px 4px 4px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }
.tabs button i { font: 600 11px system-ui, sans-serif; font-style: normal; background: var(--paper); color: var(--soft); border-radius: 999px; min-width: 24px; height: 24px; padding: 0 4px; display: grid; place-items: center; }
.tabs button:hover { background: var(--line); }
.tabs button.on { background: var(--accent); color: #fff; }
.tabs button.on i { background: rgba(255,255,255,0.22); color: #fff; }
.tabs .group { width: 100%; font: 13px 'Pixelify', sans-serif; color: var(--soft); margin-top: 6px; }
.zonehead { background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; margin-bottom: 16px; display: grid; grid-template-columns: minmax(0, 320px) 1fr; }
.zonehead .pic { min-height: 160px; background-size: cover; background-position: center 70%; image-rendering: pixelated; position: relative; }
.zonehead .pic em { position: absolute; right: 10px; top: 8px; font: 12px 'Pixelify', sans-serif; font-style: normal; background: rgba(0,0,0,0.55); color: #fff; padding: 2px 8px; border-radius: 999px; }
.zonehead .in { padding: 14px 16px; min-width: 0; }
.zonehead h3 { margin: 0; font-size: 28px; line-height: 1.1; color: var(--accent); }
.zonehead p { margin: 6px 0 0; }
.zonehead .facts { font-size: 14px; color: var(--soft); }
.zonehead .also { margin-top: 12px; }
.zonehead .also b { font: 13px 'Pixelify', sans-serif; color: var(--soft); font-weight: normal; display: block; margin-bottom: 4px; }
.cover { text-align: center; padding: 36px 20px; background: var(--paper); border-radius: 14px; box-shadow: var(--shadow); }
.cover h3 { margin: 0 0 6px; font-size: 26px; color: var(--accent); }
.cover p { margin: 0 auto 14px; max-width: 520px; color: var(--soft); }
.cover button { font: 16px 'Pixelify', sans-serif; border: 0; background: var(--accent); color: #fff; padding: 10px 18px; border-radius: 999px; cursor: pointer; }
.zsep { grid-column: 1 / -1; font: 22px 'Pixelify', sans-serif; color: var(--accent); margin: 10px 0 -4px; padding-bottom: 4px; border-bottom: 2px dashed var(--line); }
.when { display: inline-block; font: 11px 'Pixelify', sans-serif; padding: 0 6px; border-radius: 6px; vertical-align: 1px; }
.when.night { background: #2a2a5a; color: #f0e6a0; }
.when.day { background: #f0c040; color: #4a2a00; }
.card.flash { outline: 3px solid var(--accent); }
.card.secret .cover { box-shadow: none; padding: 26px 16px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.card.secret .cover h3 { font-size: 30px; }
@media (max-width: 640px) {
  .zonehead { grid-template-columns: 1fr; } .zonehead .pic { min-height: 120px; }
  .tabs { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 6px; margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; }
  .tabs button { flex: none; white-space: nowrap; }
  .tabs .group { width: auto; flex: none; white-space: nowrap; align-self: center; margin: 0 0 0 8px; }
  nav.bar .wrap { flex-wrap: wrap; } nav.bar .spacer { display: none; } /* two rows, so Light / dark stays on the screen */
  section { scroll-margin-top: 72px; } /* and the taller bar doesn't cover a heading it jumps to */
}
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
  <p>Every creature from Home Village to the Hollow Deep, place by place in the order you'll meet them: where to find them, how they grow, and the stories the old folks tell about them.</p>
</div></header>
<nav class="bar"><div class="wrap">
  <a href="#creatures">Creatures</a><a href="#map">Map</a><a href="#types">Types</a><a href="#items">Cubes &amp; items</a>
  <span class="spacer"></span><button id="theme" type="button" aria-label="Switch light or dark">Light / dark</button>
</div></nav>

<section id="creatures"><div class="wrap">
  <h2>Creatures</h2>
  <p class="lead">This guide follows your journey. Each tab is one place, in the order you reach it, and the creatures are numbered the same way as the Creature Log in the game. Open a place's tab once you get there, so nothing is spoiled. Creatures hide in tall grass: weaken one, throw a cube, and it's yours. The % on a card says how often it turns up in its place's grass once you've met everything there (one you've never met turns up twice as often).</p>
  <div class="tabs" id="tabs" role="tablist" aria-label="Places"></div>
  <div id="zone"></div>
  <div id="filters">
    <div class="filters">
      <input id="q" type="search" placeholder="Search this page by name, type, or anything in the lore">
      <select id="stage" aria-label="Stage">
        <option value="">Every stage</option><option value="starter">Starters</option><option value="first">First forms</option>
        <option value="evolved">Evolved forms</option><option value="solo">Solo (no evolution)</option><option value="legend">Legendary</option>
      </select>
    </div>
    <div class="filters"><div class="chips" id="typechips"></div><span class="count" id="count"></span></div>
  </div>
  <div class="grid" id="grid"></div>
</div></section>

<section id="types"><div class="wrap">
  <h2>Types</h2>
  <p class="lead">Eight elemental types go round in a wheel. Each one hits two others for double damage and is hit hard by two others. Normal sits outside the wheel and is even with everything. Read across from the attacking type, then down to the defender.</p>
  <div class="table-scroll"><table class="chart" id="chart"></table></div>
  <div class="legend"><span><b style="color:var(--good)">2</b> = double damage</span><span><b style="color:var(--bad)">½</b> = half damage</span><span>blank = normal damage</span><span>A creature with two types multiplies both, so 4x and ¼x can happen.</span></div>
</div></section>

<section id="map"><div class="wrap">
  <h2>Map</h2>
  <p class="lead">The land is one long road from Home Village to the Night Ruins, with Copperbell Town halfway along. Each place's wild creatures are a little stronger than the last, and a guide at each exit opens the way forward once you beat their trial. Every region has an outpost with a Healing Hut and the Cube Vault. Side paths lead off the road to orchards, coves, springs and old ruins, and some creatures only come out by day or at night.</p>
  <div class="mapbox"><img class="px" src="${map}" alt="Map of the land, from Home Village to the Night Ruins, with the side areas and the places past the story"></div>
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
  var zoneById = {}; D.zones.forEach(function (z) { zoneById[z.key] = z; });
  var when = function (t) { return t ? ' <span class="when ' + t + '">' + (t === 'night' ? 'night only' : 'day only') + '</span>' : ''; };
  // how often it turns up there: one number, or one by day and one at night
  var often = function (a) { var d = a.pct[0], n = a.pct[1]; return ' &middot; ' + (!d || !n || d === n ? (d || n) + '%' : d + '% by day, ' + n + '% at night'); };
  // where to find it, said from the page it's shown on
  function meta(c, zk) {
    var lines = [esc(c.stage)], here = c.appear.filter(function (a) { return a.zone === zk; })[0];
    if (c.found) lines.push(esc(c.found));
    else if (here) lines.push(esc(here.tier) + ' here' + when(here.time) + often(here));
    else if (c.from) lines.push('Evolves from ' + esc(c.from.name) + ' (' + esc(c.from.how) + ')');
    var others = c.appear.filter(function (a) { return a.zone !== zk; }).map(function (a) { return esc(zoneById[a.zone].name); });
    if (others.length) lines.push('Also in: ' + others.join(', '));
    return lines.join('<br>');
  }
  function card(c, zk) {
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
      '<div class="meta">' + meta(c, zk) + '</div></div></div>' +
      '<div class="body"><p class="lore">' + esc(c.lore) + '</p>' + (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') +
      '<div class="stats">' + stats + '<span></span><span class="meta">Base total</span><b>' + c.total + '</b></div>' +
      '<div class="sig"><span class="meta">Signature move</span><br><span class="pix">' + esc(sig.name) + '</span> ' + (sig.type ? badge(sig.type) : '') + '<br>' + esc(sigLine) + '</div></div>' +
      chain + '</article>';
  }
  // the place tabs: the one you're on (remembered), and which spoiler pages you've chosen to open
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  var cur = store.get('cc-guide-zone'), opened = {};
  try { opened = JSON.parse(store.get('cc-guide-open') || '{}') || {}; } catch (e) {}
  if (!zoneById[cur] && cur !== 'all') cur = D.zones[0].key;
  var GROUP = { 'After the story': 1, Anywhere: 1, Gifts: 1 }, last = '';
  $('tabs').innerHTML = D.zones.map(function (z) {
    var head = GROUP[z.part] && z.part !== last ? '<span class="group">' + esc(z.part) + '</span>' : '';
    last = z.part;
    return head + '<button type="button" role="tab" data-z="' + z.key + '"><i>' + z.num + '</i>' + esc(z.name) + '</button>';
  }).join('') + '<span class="group">The whole guide</span><button type="button" role="tab" data-z="all"><i>&#9733;</i>Every creature</button>';
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-z]'); if (!b) return;
    cur = b.dataset.z; store.set('cc-guide-zone', cur); draw();
  });
  $('zone').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return;
    opened[b.dataset.open] = 1; store.set('cc-guide-open', JSON.stringify(opened)); draw();
  });
  function zoneHead(z) {
    var facts = [z.levels ? 'Wild creatures Lv ' + z.levels[0] + ' to ' + z.levels[1] : '', z.guide ? 'Guide: ' + esc(z.guide) : z.person ? 'Meet: ' + esc(z.person) : ''].filter(Boolean).join(' &middot; ');
    return '<div class="zonehead"><div class="pic" style="background-image:url(' + z.bg + ')"><em>' + esc(z.part) + '</em></div><div class="in">' +
      '<div class="num">Place ' + z.num + ' of ' + D.zones.length + '</div><h3>' + esc(z.name) + '</h3><p>' + esc(z.where) + '</p>' + (facts ? '<p class="facts">' + facts + '</p>' : '') +
      (z.also.length ? '<div class="also"><b>Also found here</b><div class="minis">' + z.also.map(function (a) {
        return '<a href="#c-' + a.id + '">' + mini(a.id) + esc(byId[a.id].name) + (a.time ? '&nbsp;<small>(' + (a.time === 'night' ? 'night' : 'day') + ')</small>' : '') + '</a>';
      }).join('') + '</div></div>' : '') + '</div></div>';
  }
  function cover(key) {
    var z = zoneById[key];
    return '<div class="cover"><h3 class="pix">Spoilers ahead!</h3><p>' + (z
      ? esc(z.name) + ' only opens after the story ends. Its page shows creatures and secrets from the end of the game.'
      : 'This shows every creature in the game on one page, including the ones from the end of the story.') +
      '</p><button type="button" data-open="' + key + '">' + (z ? 'Open ' + esc(z.name) : 'Show every creature') + '</button></div>';
  }
  // a legendary creature met at the end of the story, kept face down until you ask
  function secret(c) {
    return '<article class="card secret" id="c-' + c.id + '"><div class="cover"><div class="num">No. ' + String(c.num).padStart(3, '0') + '</div><h3 class="pix">? ? ?</h3>' +
      '<p>A legendary creature. Its page gives away the end of the story.</p><div><button type="button" data-open="c-' + c.id + '">Show it</button></div></div></article>';
  }
  $('grid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return;
    opened[b.dataset.open] = 1; store.set('cc-guide-open', JSON.stringify(opened)); draw();
  });
  // filters (they search the page you're on)
  var picked = {};
  $('typechips').innerHTML = D.types.map(function (t) { return '<button class="chip" data-t="' + t + '" style="background:' + col(t, 1) + '">' + (D.typeIcons[t] ? '<img class="px" src="' + D.typeIcons[t] + '" alt="">' : '') + t + '</button>'; }).join('');
  $('typechips').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; picked[b.dataset.t] = !picked[b.dataset.t]; b.classList.toggle('on', picked[b.dataset.t]); draw(); });
  function keep(c) {
    var q = $('q').value.trim().toLowerCase(), st = $('stage').value, types = Object.keys(picked).filter(function (k) { return picked[k]; });
    if (q && (c.name + ' ' + c.lore + ' ' + c.note + ' ' + c.types.join(' ')).toLowerCase().indexOf(q) < 0) return false;
    if (st && c.kind !== st) return false;
    if (types.length && !types.some(function (t) { return c.types.indexOf(t) >= 0; })) return false;
    return true;
  }
  function draw() {
    [].forEach.call($('tabs').querySelectorAll('button'), function (b) {
      var on = b.dataset.z === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on);
      if (on && $('tabs').scrollWidth > $('tabs').clientWidth) $('tabs').scrollLeft = b.offsetLeft - $('tabs').offsetLeft - 24; // a phone's one-row tabs
    });
    var z = zoneById[cur];
    if ((!z || z.after) && !opened[cur]) { $('zone').innerHTML = cover(cur); $('filters').hidden = true; $('grid').innerHTML = ''; return; }
    $('filters').hidden = false;
    $('zone').innerHTML = z ? zoneHead(z) : '';
    var html = '', shown = 0, total = 0;
    (z ? [z] : D.zones).forEach(function (zz) {
      var list = zz.ids.map(function (id) { return byId[id]; }).filter(keep);
      total += zz.ids.length; shown += list.length;
      if (list.length && !z) html += '<div class="zsep">' + zz.num + '. ' + esc(zz.name) + '</div>';
      html += list.map(function (c) { return c.kind === 'legend' && z && !z.after && !opened['c-' + c.id] ? secret(c) : card(c, zz.key); }).join('');
    });
    $('grid').innerHTML = html || '<div class="empty">' + (total ? 'No creatures match. Try fewer filters.' : 'Nothing new here: look under "Also found here".') + '</div>';
    $('count').textContent = shown < total ? shown + ' of ' + total + ' creatures' : z ? total + ' creature' + (total === 1 ? '' : 's') + ' first found here' : total + ' creatures';
  }
  ['q', 'stage'].forEach(function (id) { $(id).addEventListener('input', draw); });
  // a link to a creature opens its place's page (clearing the filters) and scrolls to it
  function show(id) {
    var c = byId[id]; if (!c) return;
    if (cur !== 'all' || !opened.all) { cur = c.zone; opened[cur] = 1; store.set('cc-guide-zone', cur); }
    opened['c-' + id] = 1;
    $('q').value = ''; $('stage').value = ''; picked = {}; [].forEach.call($('typechips').children, function (b) { b.classList.remove('on'); });
    draw();
    var el = document.getElementById('c-' + id); if (!el) return;
    el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1600);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#c-"]'); if (!a) return;
    e.preventDefault(); show(a.getAttribute('href').slice(3));
  });
  window.addEventListener('hashchange', function () { if (/^#c-/.test(location.hash)) show(location.hash.slice(3)); });
  draw();
  if (/^#c-/.test(location.hash)) show(location.hash.slice(3));
  else if (location.hash) { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
  // type chart
  var head = '<tr><th class="row">Attacker &darr; / Defender &rarr;</th>' + D.types.map(function (t) { return '<th>' + (D.typeIcons[t] ? '<img class="px" src="' + D.typeIcons[t] + '" alt="">' : '') + t.slice(0, 4) + '</th>'; }).join('') + '</tr>';
  $('chart').innerHTML = head + D.types.map(function (a, i) {
    return '<tr><th class="row">' + (D.typeIcons[a] ? '<img class="px" src="' + D.typeIcons[a] + '" alt="">' : '') + a + '</th>' + D.chart[i].map(function (v) {
      return v === 2 ? '<td class="x2">2</td>' : v === 0.5 ? '<td class="x05">½</td>' : '<td class="x1"></td>';
    }).join('') + '</tr>';
  }).join('');
  // items
  $('itemlist').innerHTML = D.items.map(function (it) {
    return '<div class="item">' + (it.icon ? '<img class="px" src="' + it.icon + '" alt="">' : '') + '<div><h3 class="pix">' + esc(it.name) + '</h3><span class="tag">' + esc(it.tag) + '</span><p>' + esc(it.info) + '</p></div></div>';
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
