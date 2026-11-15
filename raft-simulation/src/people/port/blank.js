// Draws the painting guides and check pictures for the refitted castaways (src/people/refit/*.js).
//
//   NODE_PATH=/opt/node-tools/node_modules node src/people/port/blank.js <work dir with ref/> <out dir>
//
// The work dir is the one port.js made (it holds ref/, the reference build of Moon Faire's kit).
// Writes <out>/<id>-front.png and -back.png (the guide's two halves, 768 x 1024 each), <out>/<code>-key-front.png and
// -key-back.png (the same in each outfit's base colours) and <out>/<id>-look-<n>.jpg (check pictures).
const path = require('path'), fs = require('fs');
const work = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]);
const people = path.resolve(__dirname, '..'), raft = path.resolve(people, '..', '..');
const esbuild = require(path.join(raft, 'node_modules', 'esbuild'));
const { chromium } = require('playwright');
fs.mkdirSync(out, { recursive: true });
const OUTFITS = JSON.parse(fs.readFileSync(path.join(people, 'refit', 'outfits.json'), 'utf8'));
(async () => {
  const src = fs.readFileSync(path.join(__dirname, 'blank-page.js'), 'utf8').replace(/__REFIT__/g, path.join(people, 'refit').replace(/\\/g, '/'));
  fs.writeFileSync(path.join(work, 'blank-page.js'), src);
  const js = esbuild.buildSync({ entryPoints: [path.join(work, 'blank-page.js')], bundle: true, format: 'iife', target: 'es2020', write: false, logLevel: 'warning', nodePaths: [path.join(raft, 'node_modules')] }).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = path.join(work, 'blank.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><script>${js}</script>`);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + html); await page.waitForFunction(() => window.__blank);
  for (const id of ['castaway-man', 'castaway-woman']) {
    const outfits = OUTFITS.people.find((q) => q.id === id).outfits.map((o) => ({ code: o.code, colors: o.colors }));
    const D = await page.evaluate(([id, outfits]) => window.__blank(id, { outfits }), [id, outfits]);
    const save = (name, url) => fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
    save(`${id}-front.png`, D.guide[0]); save(`${id}-back.png`, D.guide[1]);
    D.look.forEach((u, i) => save(`${id}-look-${i}.jpg`, u));
    for (const code in D.keys) { save(`${code}-key-front.png`, D.keys[code][0]); save(`${code}-key-back.png`, D.keys[code][1]); }
    fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify({ id, skin: D.skin, height: D.height, parts: D.parts }));
    console.log(id, 'height', D.height.toFixed(2), 'errors', JSON.stringify(D.errors), D.parts.map((p) => `${p.part}:${p.tris}`).join(' '));
  }
  if (errs.length) console.log('PAGE:', [...new Set(errs)].slice(0, 40).join('\n'));
  await browser.close();
})().catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
