// Concatenates v2-visual-upgrade/src into the single-file game: v2-visual-upgrade/index.html
// Order: head.html, css/*.css, mid.html, body.html, script-open.html, js/*.js, tail.html (css and js sorted by file name).
// Usage: node tools/build.js [--out path] [--src dir]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const src = path.resolve(arg('--src') || path.join(root, 'v2-visual-upgrade/src'));
const out = path.resolve(arg('--out') || path.join(root, 'v2-visual-upgrade/index.html'));
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const list = d => fs.readdirSync(path.join(src, d)).filter(f => /\.(css|js)$/.test(f)).sort();
let html = read('head.html');
list('css').forEach(f => { html += read('css/' + f); });
html += read('mid.html') + read('body.html') + read('script-open.html');
list('js').forEach(f => { html += read('js/' + f); });
html += read('tail.html');
fs.writeFileSync(out, html);
console.log('built', path.relative(process.cwd(), out), (html.length / 1024).toFixed(0) + ' KB');
