// Builds the one-file game: creature-catch.html, from src/ (shell, scripts, font) and art/.
//   node tools/build.mjs
// Art: everything under art/ (made by tools/import-art.py) is packed in. A creature without a picture in
// art/creatures/ keeps its code-drawn stand-in.
import fs from 'node:fs';
import path from 'node:path';
import { SRC } from './load-data.mjs';

const ROOT = path.join(SRC, '..');
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

// every picture under art/, keyed by folder/name (art/creatures/drizzlon.png -> 'creatures/drizzlon')
const art = {};
let artBytes = 0;
const artDir = path.join(ROOT, 'art');
for (const folder of fs.existsSync(artDir) ? fs.readdirSync(artDir).sort() : []) {
  const dir = path.join(artDir, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    const ext = path.extname(f).toLowerCase();
    if (!MIME[ext]) continue;
    const bytes = fs.readFileSync(path.join(dir, f));
    artBytes += bytes.length;
    art[`${folder}/${path.basename(f, ext).toLowerCase()}`] = `data:${MIME[ext]};base64,${bytes.toString('base64')}`;
  }
}

const js = fs.readdirSync(path.join(SRC, 'js')).filter((f) => f.endsWith('.js')).sort();
const scripts = js.map((f) => `<script>/* ${f} */\n${fs.readFileSync(path.join(SRC, 'js', f), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n');
const font = fs.readFileSync(path.join(SRC, 'fonts', 'PixelifySans.ttf')).toString('base64');

const html = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8')
  .replace('{{FONT}}', () => font)
  .replace('{{ART}}', () => JSON.stringify(art))
  .replace('{{SCRIPTS}}', () => scripts);
const out = path.join(ROOT, 'creature-catch.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(process.cwd(), out)}: ${(html.length / 1024).toFixed(0)} KB (${Object.keys(art).length} art files, ${(artBytes / 1024).toFixed(0)} KB of art)`);
