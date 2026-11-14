// Quick look: loads index.html headless, runs a list of named steps and saves
// a screenshot of each.  NODE_PATH=/opt/node-tools/node_modules node tools/look.js <outDir> [script.js]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', 'out'));
fs.mkdirSync(outDir, { recursive: true });
const steps = process.argv[3] ? require(path.resolve(process.argv[3])) : [
  { name: 'title' },
  { name: 'raft', play: true, run: (G) => { G.player.state.yaw = 0.5; G.player.state.pitch = -0.15; G.step(2); } },
];
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => {
    const G = window.__game;
    G.hold = true;
    const step = G.step.bind(G);
    G.step = (sec, fn) => step(sec, (i) => { const s = G.game.stats; s.hunger = s.thirst = s.health = 100; fn?.(i); }, false);
    G.weather.envInterval = 20;
    G.draw();
  });
  let playing = false;
  for (const s of steps) {
    if (s.play && !playing) {
      playing = true;
      await page.evaluate(() => { document.getElementById('play').click(); });
      await page.waitForTimeout(200);
      await page.evaluate(() => { const b = document.getElementById('play'); if (window.__game.game.mode !== 'play') b.click(); });
      await page.waitForTimeout(200);
    }
    if (s.run) await page.evaluate(`(${s.run.toString()})(window.__game)`);
    await page.evaluate(() => window.__game.draw());
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, `${s.name}.png`), timeout: 120000 });
    console.log('shot', s.name);
  }
  console.log(JSON.stringify(await page.evaluate(() => ({ a: window.__log, b: window.__log2, c: window.__log3, d: window.__log4 })), (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
  if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
  await browser.close();
})();
