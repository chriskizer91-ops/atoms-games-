// Bundles the app, three.js and the model into one HTML file that runs anywhere, offline.
//   node tools/build.mjs      ->  dist/drizzlon-3d.html        (complete page: open it or host it)
//                                 dist/drizzlon-3d.page.html   (same, without the <html> wrapper, for embedding hosts)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({ entryPoints: [join(root, 'src/main.js')], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none' });
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const glb = readFileSync(join(root, 'model/drizzlon.glb')).toString('base64');
const head = readFileSync(join(root, 'shell/head.html'), 'utf8'), body = readFileSync(join(root, 'shell/body.html'), 'utf8');
const tail = `<script type="application/octet-stream" id="glb">${glb}</script>\n<script>${js}</script>\n`;
mkdirSync(join(root, 'dist'), { recursive: true });
const full = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}</head>\n<body>\n${body}${tail}</body>\n</html>\n`;
writeFileSync(join(root, 'dist/drizzlon-3d.html'), full);
writeFileSync(join(root, 'dist/drizzlon-3d.page.html'), head + body + tail);
console.log('dist/drizzlon-3d.html', (full.length / 1e6).toFixed(2), 'MB  (js', (js.length / 1e3).toFixed(0), 'kB, model', (glb.length / 1e6).toFixed(2), 'MB as text)');
