// Business cards for Creature Catch: the game's and the Field Guide's web addresses, each with its QR code, and the
// three starters' shadows (first forms on the left, second forms between the two codes, final forms on the right).
// Writes creature-catch/cards/:
//   cards.html                  every design at its real size (3.5 x 2 in), front and back
//   print/<design>-front.png    300 dpi with 1/8 in bleed (3.75 x 2.25 in) for a print shop, and print/back.png
//   <design>.pdf                US Letter, 10 cards a sheet (2 across, 5 down, 1/2 in top and 3/4 in side margins, the
//                               usual business card sheet): fronts on page 1, backs on page 2 for two-sided printing
//   preview/                    smaller pictures of each design, and index.html to compare them
//   qr/game.svg, qr/guide.svg   each code on its own (and a 1200 px .png of each), for anything else
// Every QR code is read back from the 300 dpi picture (full size and shrunk, like a phone photo) before it's kept.
//   NODE_PATH=<node_modules with qrcode@1.5.4 and jsqr@1.4.0>:$(npm root -g) node tools/make-cards.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SRC } from './load-data.mjs';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode'), { chromium } = require('playwright');
const ROOT = path.join(SRC, '..'), OUT = path.join(ROOT, 'cards');
const SITE = 'https://chriskizer91-ops.github.io/atoms-games-/creature-catch/';
const URLS = { game: SITE, guide: SITE + 'field-guide.html' };
// how each address is printed: no https://, broken after a slash
const URL_LINES = { game: ['chriskizer91-ops.github.io/', 'atoms-games-/creature-catch/'], guide: ['chriskizer91-ops.github.io/', 'atoms-games-/creature-catch/', 'field-guide.html'] };
const CREDIT = 'A game by Atom';
const MONO = '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf'; // the addresses: 1, l and I all differ
for (const k in URLS) if ('https://' + URL_LINES[k].join('') !== URLS[k]) throw new Error('URL_LINES.' + k + ' does not spell ' + URLS[k]);

// ---------- the designs ----------
const LINES = { water: ['drizzlon', 'rapidrake', 'tsunadrake'], plant: ['mossback', 'thornshell', 'elderoak'], fire: ['embroak', 'cinderfrog', 'infernotoad'] };
const TYPE = { water: ['#8fd0ff', '#3a8ee8'], plant: ['#a8e88a', '#4fb04a'], fire: ['#ffb36b', '#f0602c'] }; // the game's light and mid type colors
const NAMES = { drizzlon: 'Drizzlon', rapidrake: 'Rapidrake', tsunadrake: 'Tsunadrake', mossback: 'Mossback', thornshell: 'Thornshell', elderoak: 'Elderoak', embroak: 'Embroak', cinderfrog: 'Cinderfrog', infernotoad: 'Infernotoad' };
const stage = (n) => ['water', 'plant', 'fire'].map((f) => [LINES[f][n], f]); // one stage of all three, a family to a row
const family = (f) => LINES[f].map((id) => [[id, f]]);
// cols: the left, middle and right columns, each a list of [creature, family] from top to bottom
const DESIGNS = [
  { id: 'all-nine-journal', name: 'All nine, journal', style: 'journal', cols: [stage(0), stage(1), stage(2)],
    about: 'All three starters. First forms on the left, second forms between the codes, final forms on the right; each row is one family. Ink shadows on Creature Log paper.' },
  { id: 'all-nine-night', name: 'All nine, night sky', style: 'night', cols: [stage(0), stage(1), stage(2)],
    about: 'The same nine on a night sky, each shadow in its type color: Water blue, Plant green, Fire orange.' },
  { id: 'water-family', name: 'Water family', style: 'night', cols: family('water'), about: 'Drizzlon, Rapidrake and Tsunadrake, one big shadow each.' },
  { id: 'plant-family', name: 'Plant family', style: 'night', cols: family('plant'), about: 'Mossback, Thornshell and Elderoak, one big shadow each.' },
  { id: 'fire-family', name: 'Fire family', style: 'night', cols: family('fire'), about: 'Embroak, Cinderfrog and Infernotoad, one big shadow each.' },
  { id: 'one-of-each', name: 'One of each', style: 'journal', cols: [[['drizzlon', 'water']], [['thornshell', 'plant']], [['infernotoad', 'fire']]],
    about: 'A first form, a second form and a final form, each from a different family: Drizzlon, Thornshell and Infernotoad.' },
];
const STYLE = {
  journal: { bg: '#efdcb9', ink: '#3a2418', soft: '#5a3a22', shadow: '#3a2a1e' },
  night: { bg: '#1b1626', ink: '#fbf3e0', soft: '#d8cfee', shadow: null },
};

// ---------- the card's grid, in inches: 1/8 in bleed, then 1/8 in of safe space inside the trim ----------
const B = 0.125, TW = 3.5, TH = 2, IN = B + 0.125, W = TW - 0.25, H = TH - 0.25; // the content box is W x H at (IN, IN)
const Q = 0.86, GAP = 0.05, S = (W - 2 * Q - 4 * GAP) / 3; // QR tile, gaps, shadow column
const X = { c1: 0, q1: S + GAP, c2: S + Q + 2 * GAP, q2: 2 * S + Q + 3 * GAP, c3: 2 * S + 2 * Q + 4 * GAP };
const TITLE_H = 0.2, URL_H = 0.3, MAIN_Y = TITLE_H + 0.06, MAIN_H = H - TITLE_H - URL_H - 0.12;
const QR_Y = MAIN_Y + (MAIN_H - Q) / 2;

const b64 = (file) => fs.readFileSync(file).toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inch = (v) => +v.toFixed(4) + 'in';

function qrSvg(url) {
  const m = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules, n = m.size, quiet = 4;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m.get(y, x)) d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
  return '<svg class="qr" viewBox="0 0 ' + (n + 2 * quiet) + ' ' + (n + 2 * quiet) + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fffaf0"/><path d="' + d + '" fill="#1d120c"/></svg>';
}

// a creature's shadow: its sprite's pixels as one path (shape: { d, box }), in one color, or with a 1-pixel rim
function shadowSvg(shape, fill, rim) {
  const [x, y, w, h] = shape.box, pad = rim ? 1 : 0;
  const rims = rim ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].map((o) => '<path d="' + shape.d + '" transform="translate(' + o[0] + ' ' + o[1] + ')" fill="' + rim + '"/>').join('') : '';
  return '<svg class="shadow" viewBox="' + [x - pad, y - pad, w + 2 * pad, h + 2 * pad].join(' ') + '" preserveAspectRatio="xMidYMax meet">' + rims + '<path d="' + shape.d + '" fill="' + fill + '"/></svg>';
}

// the faint stars on the night sky, the same every time, kept off the codes and the words
function stars() {
  let s = 7, out = '';
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * (TW + 2 * B), y = rnd() * (TH + 2 * B), r = 0.004 + rnd() * 0.008;
    const cx = x - IN, cy = y - IN, onQr = [X.q1, X.q2].some((qx) => cx > qx - 0.06 && cx < qx + Q + 0.06 && cy > QR_Y - 0.06 && cy < QR_Y + Q + 0.06);
    if (onQr || cy > H - URL_H - 0.04 && cy < H + 0.02 || cy < TITLE_H + 0.03 && cy > -0.02) continue;
    out += '<circle cx="' + x.toFixed(3) + '" cy="' + y.toFixed(3) + '" r="' + r.toFixed(4) + '" fill="#fbf3e0" opacity="' + (0.25 + rnd() * 0.45).toFixed(2) + '"/>';
  }
  return '<svg class="sky" viewBox="0 0 ' + (TW + 2 * B) + ' ' + (TH + 2 * B) + '">' + out + '</svg>';
}

function front(d, shapes) {
  const st = STYLE[d.style];
  const col = (list, x) => {
    const one = list.length === 1, slot = one ? MAIN_H : (MAIN_H - 0.06) / 3;
    const items = list.map(([id, fam], i) => {
      const svg = st.shadow ? shadowSvg(shapes[id], st.shadow) : shadowSvg(shapes[id], TYPE[fam][1], TYPE[fam][0]);
      const top = one ? 0.1 : i * (slot + 0.03), hgt = one ? MAIN_H - 0.38 : slot;
      return '<div class="slot" style="left:' + inch(x) + ';top:' + inch(MAIN_Y + top) + ';width:' + inch(S) + ';height:' + inch(hgt) + '" title="' + NAMES[id] + '">' + svg + '</div>' +
        (one ? '<div class="who" style="left:' + inch(x) + ';top:' + inch(MAIN_Y + MAIN_H - 0.24) + ';width:' + inch(S) + '">? ? ?</div>' : '');
    });
    return items.join('');
  };
  const block = (k, title, qx, half) =>
    '<div class="title" style="left:' + inch(qx + Q / 2 - 0.8) + ';top:0;width:1.6in">' + title + '</div>' +
    '<div class="qrbox" style="left:' + inch(qx) + ';top:' + inch(QR_Y) + ';width:' + inch(Q) + ';height:' + inch(Q) + '">' + qrSvg(URLS[k]) + '</div>' +
    '<div class="url" style="left:' + inch(half * W / 2) + ';top:' + inch(H - URL_H) + ';width:' + inch(W / 2) + '">' + URL_LINES[k].map(esc).join('<br>') + '</div>';
  return '<div class="face front ' + d.style + '" id="' + d.id + '-front" style="background:' + st.bg + ';color:' + st.ink + '">' +
    (d.style === 'night' ? stars() : '') +
    '<div class="content" style="--soft:' + st.soft + '">' +
    block('game', 'Creature Catch', X.q1, 0) + block('guide', 'Field Guide', X.q2, 1) +
    col(d.cols[0], X.c1) + col(d.cols[1], X.c2) + col(d.cols[2], X.c3) +
    '</div></div>';
}

function back(titleArt) {
  return '<div class="face back" id="back"><img class="art" src="' + titleArt + '" alt="">' +
    '<div class="veil"></div><div class="logo">Creature Catch</div>' +
    '<div class="credit"><b>' + esc(CREDIT) + '</b><span>Scan the other side to play!</span></div></div>';
}

function css(fonts) {
  return `
@font-face { font-family: 'Pixelify'; src: url(data:font/ttf;base64,${fonts.pixel}) format('truetype'); }
@font-face { font-family: 'CardMono'; src: url(data:font/ttf;base64,${fonts.mono}) format('truetype'); font-weight: 700; }
.face { position: relative; width: ${inch(TW + 2 * B)}; height: ${inch(TH + 2 * B)}; overflow: hidden; flex: none; }
.face .sky { position: absolute; inset: 0; width: 100%; height: 100%; }
.face .content { position: absolute; left: ${inch(IN)}; top: ${inch(IN)}; width: ${inch(W)}; height: ${inch(H)}; }
.face .content > div { position: absolute; }
.face .title { text-align: center; font: 600 10.5pt/1 'Pixelify', monospace; letter-spacing: 0.03em; text-transform: uppercase; height: ${inch(TITLE_H)}; display: flex; align-items: flex-end; justify-content: center; }
.face .qrbox { border-radius: 0.04in; overflow: hidden; }
.face .qr, .face .shadow { display: block; width: 100%; height: 100%; }
.face .url { text-align: center; font: 700 6.2pt/1.16 'CardMono', monospace; color: var(--soft); white-space: nowrap; }
.face .who { text-align: center; font: 600 8pt/1 'Pixelify', monospace; color: var(--soft); letter-spacing: 0.08em; }
.face.back { background: #1b1626; }
.face.back .art { position: absolute; left: 0; top: 50%; width: 100%; transform: translateY(-50%); }
.face.back .veil { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(27,22,38,0.82) 0%, rgba(27,22,38,0.25) 34%, rgba(27,22,38,0) 52%, rgba(27,22,38,0) 72%, rgba(27,22,38,0.55) 100%); }
.face.back .logo { position: absolute; left: 0; right: 0; top: ${inch(IN + 0.04)}; text-align: center; font: 700 22pt/1 'Pixelify', monospace; color: #fbf3e0; letter-spacing: 0.02em;
  text-shadow: 0 0.022in 0 #3a2418, 0.022in 0 0 #3a2418, -0.022in 0 0 #3a2418, 0 -0.022in 0 #3a2418, 0.016in 0.016in 0 #3a2418, -0.016in 0.016in 0 #3a2418, 0.016in -0.016in 0 #3a2418, -0.016in -0.016in 0 #3a2418, 0 0.05in 0 rgba(0,0,0,0.35); }
.face.back .credit { position: absolute; left: 50%; bottom: ${inch(IN + 0.02)}; transform: translateX(-50%); background: #fbf3e0; color: #3a2418; border: 0.025in solid #3a2418; border-radius: 0.07in;
  padding: 0.035in 0.14in 0.045in; text-align: center; white-space: nowrap; font-family: 'Pixelify', monospace; }
.face.back .credit b { display: block; font-size: 10pt; font-weight: 700; }
.face.back .credit span { display: block; font-size: 7pt; color: #6a4a32; margin-top: 0.01in; }
`;
}

// every design at its real size, front then back, with the bleed shown faintly (the dashed line is where it's cut)
function cardsPage(designs, fonts, faces) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Creature Catch cards</title><style>${css(fonts)}
body { margin: 0; padding: 0.3in; background: #e8e2d6; font: 11pt/1.4 'Pixelify', sans-serif; color: #2a2230; display: grid; gap: 0.35in; }
.row { display: flex; gap: 0.3in; align-items: center; flex-wrap: wrap; }
.row h2 { width: 100%; margin: 0; font-size: 13pt; }
.wrap { position: relative; }
.wrap::after { content: ''; position: absolute; left: ${inch(B)}; top: ${inch(B)}; width: ${inch(TW)}; height: ${inch(TH)}; outline: 1px dashed rgba(0,0,0,0.45); pointer-events: none; }
</style></head><body>
${designs.map((d) => `<div class="row"><h2>${esc(d.name)}</h2><div class="wrap">${faces[d.id]}</div><div class="wrap">${faces.back}</div></div>`).join('\n')}
</body></html>`;
}

// a sheet of 10 at trim size, 2 across and 5 down from 3/4 in and 1/2 in, with cut marks in the margins
function sheetPage(face) {
  const cells = [], marks = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) cells.push(`<div class="cell" style="left:${inch(0.75 + c * TW)};top:${inch(0.5 + r * TH)}">${face}</div>`);
  for (const x of [0.75, 0.75 + TW, 0.75 + 2 * TW]) marks.push(`<i style="left:${inch(x)};top:0.12in;width:0;height:0.28in"></i><i style="left:${inch(x)};top:10.6in;width:0;height:0.28in"></i>`);
  for (let r = 0; r <= 5; r++) { const y = 0.5 + r * TH; marks.push(`<i style="left:0.2in;top:${inch(y)};width:0.45in;height:0"></i><i style="left:7.85in;top:${inch(y)};width:0.45in;height:0"></i>`); }
  return `<div class="sheet">${cells.join('')}${marks.join('')}</div>`;
}
function sheetsDoc(fonts, frontFace, backFace) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css(fonts)}
@page { size: 8.5in 11in; margin: 0; }
body { margin: 0; }
.sheet { position: relative; width: 8.5in; height: 11in; overflow: hidden; break-after: page; }
.cell { position: absolute; width: ${inch(TW)}; height: ${inch(TH)}; overflow: hidden; }
.cell > .face { position: absolute; left: ${inch(-B)}; top: ${inch(-B)}; }
.sheet i { position: absolute; border-left: 0.5pt solid #888; border-top: 0.5pt solid #888; }
</style></head><body>${sheetPage(frontFace)}${sheetPage(backFace)}</body></html>`;
}

// ---------- the page to compare them ----------
function galleryPage(designs) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Creature Catch Cards</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<style>
:root {
  /* a print proof: the cards sit on a desk-colored page, each design a row of front and back at the same scale */
  --page: #ece5d8; --panel: #fbf7ef; --ink: #2a2230; --muted: #6a5e57; --line: #d6ccbb; --accent: #6e46a0;
  --display: 'Pixelify Sans', ui-monospace, monospace; --body: 'Atkinson Hyperlegible', system-ui, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --page: #17131f; --panel: #221c2d; --ink: #f0eaf6; --muted: #b3a8c2; --line: #3a3248; --accent: #c4a6ec; color-scheme: dark; } }
:root[data-theme="dark"] { --page: #17131f; --panel: #221c2d; --ink: #f0eaf6; --muted: #b3a8c2; --line: #3a3248; --accent: #c4a6ec; color-scheme: dark; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--page); color: var(--ink); font: 16px/1.5 var(--body); }
main { max-width: 1120px; margin: 0 auto; padding: 32px 16px 56px; display: grid; gap: 28px; }
h1, h2 { font-family: var(--display); font-weight: 700; margin: 0; text-wrap: balance; }
h1 { font-size: clamp(28px, 5vw, 40px); letter-spacing: 0.01em; }
h2 { font-size: 22px; }
p { margin: 0; max-width: 68ch; }
.lead { color: var(--muted); }
.design { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: grid; gap: 12px; }
.design header { display: flex; gap: 10px 16px; align-items: baseline; flex-wrap: wrap; }
.tag { font-family: var(--body); font-size: 13px; font-variant-numeric: tabular-nums; color: var(--accent); border: 1px solid var(--line); border-radius: 999px; padding: 1px 10px; }
.faces { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
figure { margin: 0; display: grid; gap: 6px; }
figure img { width: 100%; height: auto; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.18), 0 6px 18px rgba(0,0,0,0.14); }
figcaption { font-size: 14px; color: var(--muted); }
.files { font-size: 14px; color: var(--muted); }
code { font-family: ui-monospace, monospace; font-size: 0.92em; }
.notes { display: grid; gap: 10px; }
.notes ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; max-width: 75ch; }
a { color: var(--accent); }
</style>
</head>
<body>
<main>
  <header style="display:grid;gap:8px">
    <h1>Creature Catch cards</h1>
    <p class="lead">Business cards for Atom's game: the game and the Field Guide, each with its web address and a QR code, and the three starters' shadows. Every card is 3.5 by 2 inches, the standard size. All six fronts share one back.</p>
  </header>
${designs.map((d, i) => `  <section class="design" id="${d.id}">
    <header><h2>${esc(d.name)}</h2><span class="tag">${i + 1} of ${designs.length}</span></header>
    <p>${esc(d.about)}</p>
    <div class="faces">
      <figure><img src="${d.id}-front.png" alt="${esc(d.name)} card, front" width="672" height="384" loading="lazy"><figcaption>Front</figcaption></figure>
      <figure><img src="back.png" alt="Card back: the title art, 'A game by Atom' and 'Scan the other side to play!'" width="672" height="384" loading="lazy"><figcaption>Back</figcaption></figure>
    </div>
    <p class="files">Print files: <code>${d.id}.pdf</code> (10 a sheet) or <code>print/${d.id}-front.png</code> with <code>print/back.png</code> (print shop).</p>
  </section>`).join('\n')}
  <section class="notes">
    <h2>What the codes open</h2>
    <ul>
      <li>Left code, Creature Catch: <a href="${URLS.game}">${esc(URLS.game)}</a></li>
      <li>Right code, Field Guide: <a href="${URLS.guide}">${esc(URLS.guide)}</a></li>
    </ul>
    <h2>Printing</h2>
    <ul>
      <li>At home: the PDF matches the usual 10-to-a-sheet business card paper (2 across, 5 down, like Avery 5371 or 8371). Print at 100% ("Actual size"), two-sided, flipping on the long edge. Page 1 is the fronts, page 2 the backs.</li>
      <li>At a print shop: upload the front and back pictures. They're 300 dpi with 1/8 inch extra on every side to be trimmed off.</li>
      <li>Every QR code was read back from the 300 dpi picture, at full size and shrunk down like a phone photo, before these files were kept.</li>
    </ul>
  </section>
</main>
</body>
</html>
`;
}

// ---------- making it all ----------
const fonts = { pixel: b64(path.join(SRC, 'fonts', 'PixelifySans.ttf')), mono: b64(MONO) };
fs.mkdirSync(path.join(OUT, 'print'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'preview'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();

// the starters' shapes (each sprite's solid pixels) and the title art blown up 8 times, sharp, for the back
const shapes = await page.evaluate(async (srcs) => {
  const out = {};
  for (const [id, src] of Object.entries(srcs)) {
    const im = new Image(); im.src = src; await im.decode();
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    const a = g.getImageData(0, 0, cv.width, cv.height).data;
    let d = '', x0 = cv.width, x1 = 0, y0 = cv.height, y1 = 0;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width;) {
      if (a[(y * cv.width + x) * 4 + 3] < 128) { x++; continue; }
      let e = x; while (e < cv.width && a[(y * cv.width + e) * 4 + 3] >= 128) e++;
      d += 'M' + x + ' ' + y + 'h' + (e - x) + 'v1h' + (x - e) + 'z';
      x0 = Math.min(x0, x); x1 = Math.max(x1, e); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); x = e;
    }
    out[id] = { d, box: [x0, y0, x1 - x0, y1 - y0] };
  }
  return out;
}, Object.fromEntries(Object.keys(NAMES).map((id) => [id, 'data:image/png;base64,' + b64(path.join(ROOT, 'art', 'creatures', id + '.png'))])));
const titleArt = await page.evaluate(async (src) => {
  const im = new Image(); im.src = src; await im.decode();
  const cv = document.createElement('canvas'); cv.width = im.width * 8; cv.height = im.height * 8;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}, 'data:image/png;base64,' + b64(path.join(ROOT, 'art', 'bg', 'title.png')));

const faces = { back: back(titleArt) };
for (const d of DESIGNS) faces[d.id] = front(d, shapes);
const html = cardsPage(DESIGNS, fonts, faces);
fs.writeFileSync(path.join(OUT, 'cards.html'), html);

// pictures: 300 dpi with the bleed for printing (exactly 1125 x 675), 192 dpi at trim size for the preview. Each face
// is drawn alone at the top left of its own page, so nothing from cards.html (like its dashed cut line) gets in.
const solo = (face) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css(fonts)} body { margin: 0; }</style></head><body>${face}</body></html>`;
const print = await browser.newPage({ deviceScaleFactor: 300 / 96 }), small = await browser.newPage({ deviceScaleFactor: 2 });
const shots = {};
for (const id of [...DESIGNS.map((d) => d.id + '-front'), 'back']) {
  const face = faces[id === 'back' ? 'back' : id.replace(/-front$/, '')];
  for (const p of [print, small]) { await p.setContent(solo(face)); await p.evaluate(() => document.fonts.ready); }
  shots[id] = await print.screenshot({ path: path.join(OUT, 'print', id + '.png'), clip: { x: 0, y: 0, width: (TW + 2 * B) * 96, height: (TH + 2 * B) * 96 } });
  await small.screenshot({ path: path.join(OUT, 'preview', id + '.png'), clip: { x: B * 96, y: B * 96, width: TW * 96, height: TH * 96 } });
}

// read every code back: from the 300 dpi front, each half on its own, full size, at half size and at a third
const jsqr = fs.readFileSync(require.resolve('jsqr/dist/jsQR.js'), 'utf8');
const check = await browser.newPage();
await check.addScriptTag({ content: jsqr });
let bad = 0;
for (const d of DESIGNS) {
  const res = await check.evaluate(async ({ src, boxes }) => {
    const im = new Image(); im.src = src; await im.decode();
    const out = {};
    for (const [k, [x, y, w, h]] of Object.entries(boxes)) for (const s of [1, 0.5, 0.33]) {
      const cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
      const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, x, y, w, h, 0, 0, cv.width, cv.height);
      const r = jsQR(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
      out[k + '@' + s] = r ? r.data : null;
    }
    return out;
  }, { src: 'data:image/png;base64,' + shots[d.id + '-front'].toString('base64'), boxes: {
    game: [0, 0, Math.round((IN + W / 2) * 300), Math.round((TH + 2 * B) * 300)],
    guide: [Math.round((IN + W / 2) * 300), 0, Math.round((TW + 2 * B - IN - W / 2) * 300), Math.round((TH + 2 * B) * 300)] } });
  const wrong = Object.entries(res).filter(([k, v]) => v !== URLS[k.split('@')[0]]);
  bad += wrong.length;
  console.log((wrong.length ? 'QR FAIL ' : 'QR ok   ') + d.id + (wrong.length ? ': ' + wrong.map(([k, v]) => k + ' read ' + v).join(', ') : ' (both codes, at full size, 1/2 and 1/3)'));
}
if (bad) { await browser.close(); throw new Error(bad + ' QR codes did not read back; nothing was written as PDF'); }

// the sheets of 10
const sheet = await browser.newPage();
for (const d of DESIGNS) {
  await sheet.setContent(sheetsDoc(fonts, faces[d.id], faces.back)); await sheet.evaluate(() => document.fonts.ready);
  await sheet.pdf({ path: path.join(OUT, d.id + '.pdf'), width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true });
}
fs.writeFileSync(path.join(OUT, 'preview', 'index.html'), galleryPage(DESIGNS));

// each code on its own, for anything else (a flyer, a poster): qr/<game|guide>.svg, and a 1200 px .png
fs.mkdirSync(path.join(OUT, 'qr'), { recursive: true });
const qrPage = await browser.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 2 });
for (const k in URLS) {
  const svg = qrSvg(URLS[k]).replace('<svg class="qr"', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"');
  fs.writeFileSync(path.join(OUT, 'qr', k + '.svg'), svg + '\n');
  await qrPage.setContent('<body style="margin:0">' + svg + '</body>');
  await qrPage.screenshot({ path: path.join(OUT, 'qr', k + '.png'), clip: { x: 0, y: 0, width: 600, height: 600 } });
}
await browser.close();
console.log('wrote cards/: cards.html, ' + DESIGNS.length + ' designs (print/*.png at 300 dpi, *.pdf sheets of 10), preview/, qr/');
