#!/usr/bin/env node
/* Real-input playthrough: drives the game the way a player does (clicks and key presses, real-time loop) and
   checks that the core loop still works. Run it on v1 and v2: both must print the same PASS/FAIL lines.

   node tools/playthrough.js <game.html> [--vp=1280x720] */
const { chromium } = require('playwright');
const path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const file = path.resolve(pos[0]);
const [VW, VH] = flag('vp', '1280x720').split('x').map(Number);
const errors = [];
const results = [];
const check = (name, ok, extra) => { results.push([name, !!ok]); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { let a = 4242; Math.random = function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  const ev = (fn, a) => page.evaluate(fn, a);
  const vis = sel => page.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && e.offsetParent !== null || (!!e && !e.hidden && getComputedStyle(e).display !== 'none'); }, sel);
  const wait = ms => page.waitForTimeout(ms);

  await page.goto('file://' + file); await wait(1500);
  check('title shows New game', await vis('#btnStart'));

  // opening: cutscene -> skip -> degree picker -> accept
  await page.click('#btnStart'); await wait(900);
  check('cutscene starts', await ev(() => G.mode === 'cut'));
  await page.click('#cutSkip'); await wait(500);
  check('degree picker shows after skip', await vis('#degree') && await ev(() => G.mode === 'degree'));
  check('accept disabled before picking', await ev(() => document.getElementById('btnAccept').disabled));
  await page.click('.deg[data-id="cs"]'); await wait(900);
  check('picking a degree fills the diploma field', await ev(() => document.getElementById('dField').textContent.length > 5));
  check('picking a degree fills the offer', await ev(() => document.getElementById('offer').textContent.includes('Northgate')));
  check('accept enabled after picking', await ev(() => !document.getElementById('btnAccept').disabled));
  await page.click('#btnAccept'); await wait(1200);
  check('game starts after accepting', await vis('#game') && await ev(() => G.mode === 'play' && S.degree === 'cs'));

  // clock runs in real time
  const t0 = await ev(() => S.t); await wait(2500);
  check('game clock advances', await ev(t => S.t > t, t0));
  await ev(() => { document.getElementById('toasts').innerHTML = ''; });

  // walk with the keyboard
  const x0 = await ev(() => S.px);
  await page.keyboard.down('ArrowRight'); await wait(700); await page.keyboard.up('ArrowRight');
  const x1 = await ev(() => S.px);
  check('arrow keys walk the player', Math.abs(x1 - x0) > 5, `dx=${(x1 - x0).toFixed(1)}`);

  // grocery: stand at the door, E opens the panel, buy something
  await ev(() => { S.px = DOORS.grocery.x; S.py = DOORS.grocery.y; CAM.ready = false; });
  await wait(500);
  check('door prompt appears near the grocery', await vis('#prompt'));
  await page.keyboard.press('e'); await wait(1600);
  check('E at the door walks you into the shop interior', await ev(() => S.scene === 'int' && S.intId === 'grocery'));
  await ev(() => openPanel('grocery')); await wait(400);
  check('grocery panel opens', await vis('#panel') && await ev(() => G.inside === 'grocery'));
  const before = await ev(() => ({ m: S.money, p: JSON.stringify(S.pantry), h: S.hunger, th: S.thirst }));
  const clicked = await ev(() => { const b = Array.from(document.querySelectorAll('#pBody .opt:not(:disabled)'))[0]; if (!b) return null; b.click(); return b.textContent.slice(0, 40); });
  await wait(400);
  const after = await ev(() => ({ m: S.money, p: JSON.stringify(S.pantry), h: S.hunger, th: S.thirst }));
  check('buying/eating at the grocery changes the state', clicked && (after.m !== before.m || after.p !== before.p || after.h !== before.h || after.th !== before.th), String(clicked).replace(/\s+/g, ' '));
  await page.click('#pClose'); await wait(300);
  check('panel closes', !(await vis('#panel')));
  await ev(() => leaveInterior()); await wait(600);
  check('leaving returns to the street', await ev(() => S.scene === 'town'));

  // diner: a hot meal (time-gated options) opens too
  await ev(() => { S.t = 12 * 60; S.px = DOORS.diner.x; S.py = DOORS.diner.y; CAM.ready = false; });
  await wait(500); await ev(() => openPanel('diner')); await wait(500);
  check('diner panel opens with options', await vis('#panel') && await ev(() => document.querySelectorAll('#pBody .opt').length >= 3));
  await page.click('#pClose'); await wait(300);

  // phone and menu
  await page.keyboard.press('p'); await wait(500);
  check('P opens the phone', await vis('#phone'));
  for (const t of ['map', 'msgs', 'career', 'trophies', 'today']) { await ev(t => document.querySelector('#phone [data-tab="' + t + '"]').click(), t); await wait(150); }
  check('phone tabs render content', await ev(() => document.getElementById('phBody').textContent.length > 20));
  await page.keyboard.press('Escape'); await wait(300);
  check('Escape closes the phone', !(await vis('#phone')));
  await page.click('#bMenu'); await wait(300);
  check('Menu opens', await vis('#menu'));
  await page.click('#mResume'); await wait(300);
  check('Resume closes the menu', !(await vis('#menu')));
  await page.click('#bSpeed'); check('speed chip cycles', await ev(() => G.speed === 2)); await page.click('#bSpeed'); await page.click('#bSpeed');

  // apartment: sleep -> dream -> wake early
  await ev(() => { S.t = 22 * 60; S.energy = 20; S.px = DOORS.apartment.x; S.py = DOORS.apartment.y; CAM.ready = false; });
  await wait(500); await ev(() => openPanel('apartment')); await wait(500);
  check('apartment panel opens', await vis('#panel') && await ev(() => G.inside === 'apartment'));
  const slept = await ev(() => { const b = Array.from(document.querySelectorAll('#pBody .opt:not(:disabled)')).find(x => /go to bed/i.test(x.textContent)); if (!b) return null; b.click(); return b.textContent.slice(0, 30); });
  await wait(1500);
  check('sleeping shows the dream screen', slept && await vis('#dream'), String(slept).replace(/\s+/g, ' '));
  const tSleep = await ev(() => S.t);
  await wait(1500);
  await page.click('#dreamWake');
  let woke = false; for (let i = 0; i < 20 && !woke; i++) { await wait(300); woke = !(await vis('#dream')) && await ev(() => !G.skip); }
  const tWake = await ev(() => S.t);
  check('waking up ends the dream and time has passed', !(await vis('#dream')) && tWake !== tSleep, `t ${tSleep} -> ${tWake}`);
  await ev(() => { document.getElementById('recap').hidden = true; G.menu = false; });

  // work: Monday 8:00 shift on autopilot
  await ev(() => { document.getElementById('recap').hidden = true; G.menu = false; S.day = 9; S.t = 8 * 60; S.shiftsDone.am = false; S.energy = 80; S.hunger = 80; S.thirst = 80; S.px = DOORS.work.x; S.py = DOORS.work.y; CAM.ready = false; });
  await wait(600); await ev(() => openPanel('work')); await wait(600);
  check('work panel opens', await vis('#panel') && await ev(() => G.inside === 'work'));
  const started = await ev(() => { const b = Array.from(document.querySelectorAll('#pBody .opt:not(:disabled)')).find(x => /Morning shift/i.test(x.textContent)); if (!b) return null; b.click(); return true; });
  await wait(900);
  check('starting the shift opens the activity', started && await vis('#job'));
  check('activity intro has Clock in and Autopilot', await ev(() => document.querySelectorAll('#jStage .btn').length >= 2));
  const m0 = await ev(() => ({ m: S.money, s: S.shifts }));
  await ev(() => { const b = document.querySelector('#jStage .btn.ghost'); if (b) b.click(); });
  let done = false;
  for (let i = 0; i < 90 && !done; i++) {
    await wait(1000);
    done = await ev(() => !G.skip || !!document.querySelector('#jStage .jres'));
  }
  check('autopilot finishes the shift', done);
  await wait(500);
  await ev(() => { const b = document.querySelector('#jStage .btn'); if (b) b.click(); });
  await wait(1500);
  const m1 = await ev(() => ({ m: S.money, s: S.shifts }));
  check('clocking out pays the shift', m1.m > m0.m && m1.s === m0.s + 1, `money ${m0.m} -> ${m1.m}, shifts ${m0.s} -> ${m1.s}`);
  check('activity closes afterwards', !(await vis('#job')));

  // save and continue round-trip
  await ev(() => saveGame());
  await ev(() => toTitle()); await wait(500);
  check('Continue appears after a save', await vis('#btnContinue'));
  await page.click('#btnContinue'); await wait(1200);
  check('Continue restores the game', await ev(() => G.mode === 'play' && S.degree === 'cs' && S.shifts >= 1));

  const uniq = [...new Set(errors)];
  console.log(uniq.length ? 'ERRORS:\n' + uniq.join('\n') : 'no page errors');
  const bad = results.filter(r => !r[1]).length;
  console.log(`\n${results.length - bad}/${results.length} checks passed`);
  await browser.close();
  process.exit(bad || uniq.length ? 2 : 0);
})();
