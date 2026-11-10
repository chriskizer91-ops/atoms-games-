// drive.js: plays the built game in a headless browser from a list of steps and takes screenshots (for checking a build).
// usage: node game/tools/drive.js steps.json      (serve game/dist first: cd game/dist && python3 -m http.server 8765)
// steps.json: { "url": "http://127.0.0.1:8765/?at=village", "phone": true, "wide": false, "dpr": 1, "out": "dir",
//   "steps": [ { "inject": "autopilot.js" (a script, relative to steps.json) }, { "wait": 2 }, { "key": "ArrowUp", "ms": 400 }, { "press": "KeyZ" }, { "until": "js expression", "max": 30 },
//              { "eval": "js" }, { "shot": "name" } ] }
// One browser at a time, please: the machine is shared.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const out = cfg.out || '.'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const phone = cfg.phone !== false && !cfg.wide;
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: cfg.dpr || 1, isMobile: true, hasTouch: true }
    : { viewport: { width: cfg.w || 1200, height: cfg.h || 800 }, deviceScaleFactor: cfg.dpr || 1 });
  const page = await ctx.newPage();
  const log = [];
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning' || /^\[cc\]/.test(t)) { log.push(m.type() + ': ' + t); console.log(m.type() + ': ' + t); } });
  page.on('pageerror', (e) => { log.push('pageerror: ' + e.message); console.log('pageerror: ' + e.message); });
  page.setDefaultTimeout(120000);
  await page.goto(cfg.url, { waitUntil: 'load' });
  const t0 = Date.now();
  for (const s of cfg.steps || []) {
    if (s.inject) await page.addScriptTag({ content: fs.readFileSync(path.resolve(path.dirname(process.argv[2]), s.inject), 'utf8') });
    if (s.wait) await page.waitForTimeout(s.wait * 1000);
    if (s.key) { await page.keyboard.down(s.key); await page.waitForTimeout(s.ms || 200); await page.keyboard.up(s.key); await page.waitForTimeout(s.after === undefined ? 60 : s.after); }
    if (s.press) { const n = s.n || 1; for (let i = 0; i < n; i++) { await page.keyboard.down(s.press); await page.waitForTimeout(70); await page.keyboard.up(s.press); await page.waitForTimeout(s.gap || 250); } }
    if (s.until) { const end = Date.now() + (s.max || 30) * 1000; let ok = false; while (Date.now() < end) { try { ok = await page.evaluate(s.until); } catch (e) { ok = false; } if (ok) break; if (s.tap) { await page.keyboard.down(s.tap); await page.waitForTimeout(60); await page.keyboard.up(s.tap); } await page.waitForTimeout(s.every || 300); } console.log('until', JSON.stringify(s.until).slice(0, 80), ok ? 'ok' : 'TIMED OUT', ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
    if (s.eval) { try { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 600)); } catch (e) { console.log('eval error:', e.message); } }
    if (s.shot) { await page.screenshot({ path: path.join(out, s.shot + '.png'), timeout: 120000 }); console.log('shot', s.shot, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  }
  await browser.close();
  if (cfg.log) fs.writeFileSync(path.resolve(out, cfg.log), log.join('\n'));
})();
