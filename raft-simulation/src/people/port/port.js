// Remakes src/people/kit/rig.js and src/people/folk/*.js from the Moon Faire sources (branch claude/moon-faire-starter-world).
// Only needed again if Moon Faire's people or kit change; the game itself never runs any of this.
//
//   NODE_PATH=/opt/node-tools/node_modules node src/people/port/port.js <moon-faire>/game [work dir]
//
// Reads, under <moon-faire>/game: models/jester/{jester_kit,jester_tex,lod,meshopt_simplifier}.js, people/kit/person-kit.js,
// people/npc/{npcs,npc_tex}.js. Needs Playwright with Chromium (the bake and the check run in a headless browser).
//   1. wrap.js     the kit as ES modules for three r186, otherwise as it is: the reference build, kept in the work dir
//   2. rig.js      the moving skeleton cut out of the kit                                -> kit/rig.js
//   3. bake.js     each person built once with the reference and packed                  -> folk/<id>.js
//   4. compare.js  the shipped rig against the reference, bone for bone
// Then look at the result:  NODE_PATH=/opt/node-tools/node_modules node tools/person-look.js <out dir>
const path = require('path'), fs = require('fs'), os = require('os');

const IDS = ['farm-lad', 'pie-seller'];            // also named in bake-page.js, compare-page.js and castaway.js
const MF = process.argv[2] && path.resolve(process.argv[2]);
if (!MF || !fs.existsSync(path.join(MF, 'models/jester/jester_kit.js'))) { console.error('usage: node port.js <moon-faire>/game [work dir]'); process.exit(1); }
const people = path.resolve(__dirname, '..'), raft = path.resolve(people, '..', '..');
const work = path.resolve(process.argv[3] || path.join(os.tmpdir(), 'castaway-port'));
fs.mkdirSync(work, { recursive: true });
const esbuild = require(path.join(raft, 'node_modules', 'esbuild'));
const { chromium } = require('playwright');
const env = { work, people, ids: IDS, esbuild, chromium, nodePaths: [path.join(raft, 'node_modules')] };

(async () => {
  console.log('1. the reference build -> ' + path.join(work, 'ref'));
  require('./wrap.js')(MF, path.join(work, 'ref'), IDS);
  console.log('2. kit/rig.js');
  require('./rig.js')(MF, people);
  console.log('3. baking');
  await require('./bake.js')(env);
  console.log('4. checking the rig against the kit');
  await require('./compare.js')(env);
})().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
