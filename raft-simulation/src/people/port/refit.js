// Bakes the refitted castaways in their painted outfits into src/people/folk/<code>.js.
//
//   NODE_PATH=/opt/node-tools/node_modules node src/people/port/refit.js <work dir with ref/> <dir from tools/skin_fit.py>
//
// The work dir is the one port.js made. Each outfit in src/people/refit/outfits.json that has a fitted sheet is baked.
// src/people/refit/skins.json holds the finishing touches per outfit (Moon Faire's SKIN file: flat-coloured parts, parts
// nudged, how softly front and back meet).
const path = require('path'), fs = require('fs');
const work = path.resolve(process.argv[2]), fitDir = path.resolve(process.argv[3]);
const people = path.resolve(__dirname, '..'), raft = path.resolve(people, '..', '..');
const esbuild = require(path.join(raft, 'node_modules', 'esbuild'));
const { chromium } = require('playwright');
const OUTFITS = JSON.parse(fs.readFileSync(path.join(people, 'refit', 'outfits.json'), 'utf8'));
const SKINS = JSON.parse(fs.readFileSync(path.join(people, 'refit', 'skins.json'), 'utf8'));
const uri = (f, mime) => `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
const register = {};
for (const P of OUTFITS.people) for (const o of P.outfits) {
  const j = path.join(fitDir, o.code + '.json');
  if (!fs.existsSync(j)) continue;
  const F = JSON.parse(fs.readFileSync(j, 'utf8')), face = path.join(fitDir, o.code + '-face.webp');
  register[o.code] = { shape: P.id, name: `${P.label.replace('The c', 'C')}: ${o.name.toLowerCase()}`, who: o.who, body: uri(path.join(fitDir, o.code + '-body.webp'), 'image/webp'),
    face: fs.existsSync(face) ? uri(face, 'image/webp') : null, fit: F.fit, faceFit: F.faceFit, skin: F.skin, SKIN: Object.assign({}, SKINS[P.id], SKINS[o.code], { flat: Object.assign({}, (SKINS[P.id] || {}).flat, (SKINS[o.code] || {}).flat) }) };
}
const only = process.argv[4] ? process.argv[4].split(',') : null;
const ids = Object.keys(register).filter((c) => !only || only.includes(c));
require('./bake.js')({ work, people, ids, esbuild, chromium, nodePaths: [path.join(raft, 'node_modules')], register })
  .catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
