#!/usr/bin/env node
/* Frame-cost check. Wraps the game's render() and the whole frame, then reports average and p95 ms for a few
   representative scenes. Compare a new build against the baseline: node tools/perf.js <game.html> [--frames=240]
   Numbers come from software-rasterised headless Chromium, so only the RATIO between two builds is meaningful.
   Budget for v2: no scene more than 1.6x the baseline's average render ms. */
const { chromium } = require('playwright');
const path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const file = path.resolve(pos[0]);
const FR = +flag('frames', 240);
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => { let a = 99; Math.random = function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  await page.goto('file://' + file); await page.waitForTimeout(1500);
  await page.evaluate(() => { startNewGame('cs'); G.speed = 1; });
  const scenes = [
    ['street-noon', () => { S.scene = 'town'; S.px = 1400; S.py = 700; S.day = 2; S.t = 12 * 60; }],
    ['street-night', () => { S.scene = 'town'; S.px = 1400; S.py = 700; S.day = 2; S.t = 22 * 60; }],
    ['park-winter', () => { S.scene = 'town'; S.px = FOUNTAIN.x; S.py = FOUNTAIN.y + 90; S.day = 23; S.t = 15 * 60; }],
    ['street-rain', () => { let d = 3; while (!(weatherAt(d, 720).rain > 0.6)) d++; S.scene = 'town'; S.px = 1400; S.py = 700; S.day = d; S.t = 12 * 60; }],
    ['interior-apartment', () => { S.scene = 'town'; S.day = 2; S.t = 20 * 60; enterInterior('apartment'); }],
    ['interior-diner', () => { S.scene = 'town'; S.day = 2; S.t = 12 * 60; enterInterior('diner'); }],
  ];
  for (const [name, setup] of scenes) {
    await page.evaluate(`(${setup.toString()})(); CAM.ready = false; G.acc = 0; S.hunger = S.thirst = S.energy = 90;`);
    await page.waitForTimeout(900);
    const r = await page.evaluate(n => new Promise(res => {
      const times = [], fr = [];
      const orig = window.render; let last = performance.now();
      window.render = function () { const t0 = performance.now(); const v = orig.apply(this, arguments); times.push(performance.now() - t0); return v; };
      function tick(now) { fr.push(now - last); last = now; if (times.length >= n) { window.render = orig; res({ times, fr }); } else requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    }), FR);
    const s = a => { const x = a.slice().sort((p, q) => p - q); return { avg: a.reduce((p, q) => p + q, 0) / a.length, p95: x[Math.floor(x.length * 0.95)] }; };
    const rs = s(r.times), fs = s(r.fr);
    console.log(`${name.padEnd(20)} render avg ${rs.avg.toFixed(2)}ms p95 ${rs.p95.toFixed(2)}ms   frame avg ${fs.avg.toFixed(1)}ms`);
  }
  if (errs.length) console.log('PAGE ERRORS:\n' + [...new Set(errs)].join('\n'));
  await browser.close();
})();
