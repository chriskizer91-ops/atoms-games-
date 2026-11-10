// node dev/app-shot.js out-prefix  — loads the built page at phone and desktop size, taps a move, screenshots
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2] || 'app';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, w, h, mob] of [['phone', 400, 800, true], ['desk', 900, 560, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: mob, isMobile: mob });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') console.log(name, 'console:', m.text().slice(0, 400)); });
    p.on('pageerror', (e) => console.log(name, 'PAGEERR', e.message));
    await p.goto('http://localhost:8766/dist/drizzlon-3d.html');
    await p.waitForFunction('window.stage && document.getElementById("loading").hidden', { timeout: 180000 });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${pre}-${name}-idle.png` });
    await p.click(process.argv[3] || '#move-torrentcrash');
    await p.waitForTimeout(+(process.argv[4] || 9000));
    await p.screenshot({ path: `${pre}-${name}-move.png` });
    const info = await p.evaluate(() => ({ busy: stage.anim.busy, mt: stage.anim.mt, t: stage.time, overflow: document.documentElement.scrollWidth > innerWidth, dock: document.querySelector('.dock').getBoundingClientRect().height }));
    console.log(name, JSON.stringify(info));
    await ctx.close();
  }
  await b.close();
})();
