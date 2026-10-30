// Bundles src/ into one self-contained index.html (three.js included), so the
// game opens by double-clicking with no server and no internet.
//
//   node tools/build.js                      -> index.html
//   node tools/build.js --artifact out.html  -> also a body-only copy for claude.ai artifacts
//   node tools/build.js --dev                -> unminified, easier to debug

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const args = process.argv.slice(2);
const dev = args.includes('--dev');
const artIdx = args.indexOf('--artifact');

const result = esbuild.buildSync({
  entryPoints: [path.join(src, 'main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: !dev,
  write: false,
  legalComments: 'eof',
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
const template = fs.readFileSync(path.join(src, 'index.html'), 'utf8');

// Function replacements so `$` sequences in the bundle are left alone.
const html = template.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const out = path.join(root, 'index.html');
fs.writeFileSync(out, html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB`);

if (artIdx >= 0) {
  // claude.ai artifacts supply their own <html>/<head>/<body> wrapper.
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/, '')
    .replace(/<meta name="viewport"[^>]*>\s*/, '');
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
  const artPath = path.resolve(args[artIdx + 1]);
  fs.writeFileSync(artPath, `${head.trim()}\n${body.trim()}\n`);
  console.log(`artifact    ${artPath}`);
}
