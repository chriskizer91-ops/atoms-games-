// Headless look at the player's body (src/people/castaway.js) on its own:
// bundles a small test page, poses the person and saves a screenshot of each
// pose. Fails on any console error or warning. Does not touch index.html.
//
//   NODE_PATH=/opt/node-tools/node_modules node tools/person-look.js [outDir] [--id pie-seller] [--only name,name]

const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const id = flag('--id') || 'farm-lad';
const only = (flag('--only') || '').split(',').filter(Boolean);
const outDir = path.resolve(args[0] || path.join(os.tmpdir(), 'person-look'));
fs.mkdirSync(outDir, { recursive: true });

const W = 900, H = 900;
const t0 = Date.now();
const js = esbuild.buildSync({
  entryPoints: [path.join(root, 'src', 'people', 'look-entry.js')],
  bundle: true, format: 'iife', target: 'es2020', minify: true, write: false, legalComments: 'none', logLevel: 'warning',
}).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page0 = path.join(outDir, 'person-look.html');
fs.writeFileSync(page0, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#222}canvas{display:block}</style><canvas id="c" width="${W}" height="${H}"></canvas><script>${js}</script>`);
// What the person adds to the game's bundle: this page without the person, against the page with.
const bare = esbuild.buildSync({
  stdin: { contents: "import * as THREE from 'three'; import { createSky } from './src/sky.js'; window.x = [THREE, createSky];", resolveDir: root },
  bundle: true, format: 'iife', target: 'es2020', minify: true, write: false, legalComments: 'none', logLevel: 'warning',
}).outputFiles[0].text.length;
const only3 = esbuild.buildSync({
  stdin: { contents: "import * as THREE from 'three'; import { createSky } from './src/sky.js'; import { createCastaway } from './src/people/castaway.js'; window.x = [THREE, createSky, createCastaway];", resolveDir: root },
  bundle: true, format: 'iife', target: 'es2020', minify: true, write: false, legalComments: 'none', logLevel: 'warning',
}).outputFiles[0].text.length;
console.log(`bundled in ${Date.now() - t0} ms; the person adds ${((only3 - bare) / 1024).toFixed(0)} KB to a minified bundle`);

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('file://' + page0 + '?id=' + encodeURIComponent(id));
  await page.waitForFunction(() => window.__look, null, { timeout: 120000 });
  const failed = await page.evaluate(() => window.__look.failed);
  if (failed) { console.log('FAILED to build: ' + failed + '\n' + errors.join('\n')); await browser.close(); process.exit(1); }
  console.log('built', JSON.stringify(await page.evaluate(() => window.__look.info)));
  const names = (await page.evaluate(() => window.__look.names)).filter((n) => !only.length || only.includes(n));
  for (const n of names) {
    const calls = await page.evaluate((n) => window.__look.shot(n), n);
    await page.screenshot({ path: path.join(outDir, `${n}.png`), timeout: 120000 });
    console.log('shot', n, `(${calls} draw calls in the frame)`);
  }
  if (!only.length) {
    console.log('bench', JSON.stringify(await page.evaluate(() => window.__look.bench())));
    if (await page.evaluate(() => window.__look.unknown) !== false) errors.push('error: play() of an unknown move did not return false');
  }
  await browser.close();
  if (errors.length) { console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n')); process.exit(1); }
  console.log('no console errors or warnings; screenshots in ' + outDir);
})();
