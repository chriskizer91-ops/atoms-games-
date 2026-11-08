// Load the game's data files in a sandbox and write moves + every creature's learnset as JSON.
const fs = require('fs'), vm = require('vm');
const dir = process.argv[2], out = process.argv[3];
const ctx = { console, Math, JSON, Object, Array, String, Number };
ctx.window = ctx; ctx.CC = {}; ctx.window.CC = ctx.CC;
ctx.document = { createElement: () => ({ getContext: () => ({}) }) };
vm.createContext(ctx);
for (const f of ['10-data-types', '11-data-moves', '12-data-creatures', '12b-data-expansion', '12c-data-final', '23-kids-creatures']) {
  try { vm.runInContext(fs.readFileSync(`${dir}/${f}.js`, 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('skip part of', f, '-', e.message.slice(0, 80)); }
}
const CC = ctx.CC;
const moves = {};
for (const [id, m] of Object.entries(CC.MOVES || {})) moves[id] = { name: m.name, type: m.type, tier: m.tier, power: m.power || 0, fx: m.fx || {} };
const sp = CC.SPECIES || CC.CREATURES || {};
const creatures = {};
for (const [id, s] of Object.entries(sp)) {
  const learn = (s.learn || []).map(l => Array.isArray(l) ? { lv: l[0], move: l[1] } : { lv: l.lv ?? l.level, move: l.move ?? l.id });
  creatures[id] = { name: s.name, types: s.types, learn, sig: s.sig, body: s.look && s.look.body };
}
fs.writeFileSync(out, JSON.stringify({ moves, creatures, typeColors: CC.TYPE_COLORS }, null, 1));
console.log('moves', Object.keys(moves).length, 'creatures', Object.keys(creatures).length, 'keys', Object.keys(CC).slice(0, 30).join(','));
