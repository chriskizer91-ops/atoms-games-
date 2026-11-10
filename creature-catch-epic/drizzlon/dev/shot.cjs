// node dev/shot.js "<query>" out.png [w h]
const { chromium } = require('playwright');
(async () => {
  const [query = '', out = 'shot.png', w = '1800', h = '1200', page = 'dev/preview.html'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 600)); });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:8766/${page}?w=${w}&h=${h}&${query}`);
  await p.waitForFunction('window.DONE', { timeout: 120000 });
  await p.screenshot({ path: out });
  await b.close();
})();
