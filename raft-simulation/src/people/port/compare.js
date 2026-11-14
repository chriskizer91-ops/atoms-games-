// Step 4 of the port. Checks the shipped rig (kit/rig.js + body.js + folk/*.js) against the reference kit: every bone's
// world matrix over 900 frames of idle, walk, run and a one-shot move must be the same to the last bit.
const path = require('path'), fs = require('fs');

module.exports = async function compare({ work, people, ids, esbuild, chromium, nodePaths }) {
  const src = fs.readFileSync(path.join(__dirname, 'compare-page.js'), 'utf8').split('RAFT_PEOPLE/').join(people.replace(/\\/g, '/') + '/');
  const js = esbuild.buildSync({ stdin: { contents: src, resolveDir: work }, bundle: true, format: 'iife', target: 'es2020', write: false, logLevel: 'warning', nodePaths }).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = path.join(work, 'compare.html'); fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><script>${js}</script>`);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + html); await page.waitForFunction(() => window.__compare);
  let bad = errs.length > 0;
  for (const id of ids) { const r = await page.evaluate((id) => window.__compare(id), id); console.log(' ', JSON.stringify(r)); if (!(r.worstBoneMatrixDifference < 1e-9) || !r.scaleOk || !(r.facePointError < 1e-4)) bad = true; }
  await browser.close();
  if (bad) throw new Error('the shipped rig does not move as the kit does' + (errs.length ? ':\n' + errs.join('\n') : ''));
  console.log('  the rig moves exactly as the kit does');
};
