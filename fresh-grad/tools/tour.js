#!/usr/bin/env node
/* Regression tour: boots the game headless and walks every screen using the game's own functions.
   Captures a screenshot per stop and reports any page error / console error with the stop it happened in.

   node tools/tour.js <game.html> <outdir> [--only=title,cut,town,...] [--vp=1280x720] [--tag=v2]
   Groups: title cut degree town weather interiors school panels jobs scenes dreams ui fishing mobile

   The game is a classic <script>, so its top-level let/const (S, G, CAM, INT, DEGREES, ...) are reachable
   from page.evaluate. Math.random is seeded so two builds see the same town. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const flag = (n, d) => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const pos = args.filter(a => !a.startsWith('--'));
const file = path.resolve(pos[0]);
const out = path.resolve(pos[1]);
const only = flag('only', '').split(',').filter(Boolean);
const [VW, VH] = flag('vp', '1280x720').split('x').map(Number);
const tag = flag('tag', '');
fs.mkdirSync(out, { recursive: true });

const want = g => !only.length || only.includes(g);
const errors = [];
let stop = 'boot';
let n = 0;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-gpu-vsync'] });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    let a = 1234567;
    Math.random = function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${stop}] PAGEERROR ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_(NAME_NOT_RESOLVED|INTERNET|CONNECTION|FAILED)|Failed to load resource/.test(m.text())) errors.push(`[${stop}] CONSOLE ${m.text()}`); });
  const ev = (fn, arg) => page.evaluate(fn, arg).catch(e => { errors.push(`[${stop}] EVAL ${String(e.message).split('\n')[0]}`); return null; });
  const wait = ms => page.waitForTimeout(ms);
  const shot = async (name, ms = 350) => {
    stop = name; await wait(ms);
    // stray XP level-ups, queued promotions and welcome toasts only clutter the frame (the 'ui' stops want them)
    if (!/levelup|promo|recap|notice|gameover|phone|menu|toast/.test(name)) await ev(() => {
      const t = document.getElementById('toasts'); if (t) t.innerHTML = '';
      if (typeof S !== 'undefined' && S) { S.perkPicks = 0; if (S.queue) S.queue.length = 0; }
      const l = document.getElementById('lvl'); if (l && !l.hidden && typeof closeLevelUp === 'function') closeLevelUp();
      const r = document.getElementById('recap'); if (r && !r.hidden && typeof closeRecap === 'function') closeRecap();
    });
    n++; await page.screenshot({ path: `${out}/${String(n).padStart(3, '0')}-${(tag ? tag + '-' : '')}${name}.png` });
  };
  const clearUI = () => ev(() => {
    ['panel', 'skip', 'menu', 'over', 'dream', 'scene', 'phone', 'lvl', 'recap', 'fishing', 'job'].forEach(i => { const e = document.getElementById(i); if (e) e.hidden = true; });
    G.skip = null; G.inside = null; G.menu = false; G.phone = false; G.collapse = null; G.talk = null;
    if (typeof FS !== 'undefined') FS.on = false;
    if (typeof DR !== 'undefined') DR.d = null;
    if (typeof SC !== 'undefined') SC.o = null;
  });
  // start a fresh game for a degree without playing the cutscene
  const newGame = deg => ev(d => { startNewGame(d); G.speed = 1; }, deg);
  // put the player in the open town at a place, at a time on a day
  const townAt = async (x, y, day, hour) => {
    await clearUI();
    await ev(([x, y, day, hour]) => {
      if (S.scene !== 'town') { S.scene = 'town'; S.intId = null; }
      S.px = x; S.py = y; S.day = day; S.t = Math.round(hour * 60); CAM.ready = false; G.target = null; G.pathQ = [];
      S.hunger = S.thirst = S.energy = 80; S.mood = 75; G.acc = 0;
    }, [x, y, day, hour]);
  };
  const D = () => ev(() => ({ door: DOORS, f: FOUNTAIN, pond: POND, bus: BUS_STOPS, deg: DEGREES.map(d => d.id), int: Object.keys(INT) }));

  try {
    await page.goto('file://' + file);
    await wait(1800);

    if (want('title')) { await shot('title-a', 200); await wait(2500); await shot('title-b', 100); }

    if (want('cut')) {
      await ev(() => document.getElementById('btnStart').click());
      for (const t of [0.6, 1.8, 3.3, 5, 6.8, 8.3, 10.2, 11.7, 12.6, 13.6, 15, 16.4, 18.2]) {
        await ev(t => { if (typeof CUT !== 'undefined') CUT.t = t - 0.03; }, t);
        await shot('cut-' + String(t).replace('.', '_'), 160);
      }
      await ev(() => finishCut());
    }

    if (want('degree')) {
      await ev(() => { if (document.getElementById('degree').hidden) { startCutscene(); finishCut(); } });
      await shot('degree-empty', 600);
      await ev(() => pickDegree('nurse')); await shot('degree-nurse', 700);
      await ev(() => pickDegree('cs')); await shot('degree-cs', 700);
      await ev(() => { document.getElementById('degree').hidden = true; });
    }

    const info = await D();
    const P = info ? info.door : {};

    if (want('town')) {
      await newGame('cs');
      await wait(500);
      await shot('town-start-evening', 500);
      const spots = [['apartment', P.apartment.x, P.apartment.y + 30], ['downtown', 1400, 700], ['fountain', info.f.x, info.f.y + 90], ['pond', info.pond.x - 150, info.pond.y - 150], ['market', 1400, 1160], ['clinic', P.clinic.x, P.clinic.y + 20]];
      const times = [[7, 'dawn'], [12, 'noon'], [17.8, 'golden'], [19.3, 'dusk'], [22, 'night']];
      for (const [nm, x, y] of spots) for (const [h, tn] of times) {
        if (nm !== 'downtown' && !['noon', 'night'].includes(tn)) continue;
        await townAt(x, y, 2, h); await shot(`town-${nm}-${tn}`, 600);
      }
      for (const [dd, sn] of [[2, 'spring'], [9, 'summer'], [16, 'autumn'], [23, 'winter']]) {
        await townAt(info.f.x, info.f.y + 90, dd, 15); await shot('season-' + sn + '-park', 700);
        await townAt(1400, 700, dd, 15); await shot('season-' + sn + '-street', 700);
      }
    }

    if (want('weather')) {
      await newGame('cs');
      const days = await ev(() => {
        const f = {}; const want = { rain: d => weatherAt(d, 12 * 60).rain > 0.6, snow: d => weatherAt(d, 12 * 60).snow > 0.6, storm: d => weatherAt(d, 12 * 60).storm > 0.6, fog: d => weatherAt(d, 7 * 60).fog > 0.5, cloud: d => weatherAt(d, 12 * 60).cloud > 0.4 && weatherAt(d, 12 * 60).rain < 0.1 };
        for (let d = 3; d < 400; d++) for (const k in want) if (!f[k] && want[k](d)) f[k] = d;
        return f;
      });
      for (const k in days) {
        const h = k === 'fog' ? 7 : 12;
        await townAt(1400, 700, days[k], h); await shot('weather-' + k + '-street', 1100);
        await townAt(info.f.x, info.f.y + 90, days[k], h); await shot('weather-' + k + '-park', 900);
      }
    }

    if (want('interiors')) {
      await newGame('cs');
      for (const id of info.int) {
        await clearUI();
        await ev(id => { S.day = 2; S.t = 13 * 60; S.scene = 'town'; S.intId = null; enterInterior(id); G.speed = 1; S.hunger = S.thirst = S.energy = 80; }, id);
        await shot('int-' + id + '-day', 500);
      }
      for (const id of ['apartment', 'diner', 'cinema', 'pizza', 'cafe']) {
        if (!info.int.includes(id)) continue;
        await clearUI();
        await ev(id => { S.day = 2; S.t = 21 * 60; S.scene = 'town'; S.intId = null; enterInterior(id); S.hunger = S.thirst = S.energy = 80; }, id);
        await shot('int-' + id + '-night', 500);
      }
    }

    if (want('school')) {
      await newGame('edu'); await clearUI();
      await ev(() => { S.day = 2; S.t = 10 * 60; enterSchool(); });
      await shot('school-hall', 600);
      await ev(() => { S.px = 400; S.py = 330; CAM.ready = false; });
      await shot('school-room', 600);
    }

    if (want('panels')) {
      await newGame('cs');
      for (const id of ['apartment', 'work', 'grocery', 'diner', 'park']) {
        stop = 'panel-' + id; await clearUI(); await ev(() => { S.day = 2; S.t = 12 * 60; S.scene = 'town'; S.intId = null; });
        await ev(id => openPanel(id), id); await shot('panel-' + id, 400);
      }
      await clearUI();
    }

    if (want('jobs')) {
      for (const d of (info ? info.deg : [])) {
        if (d === 'edu') continue;
        await newGame(d); await clearUI();
        await ev(() => { S.day = 2; S.t = 8 * 60; });
        await ev(() => startSkip({ mins: 240, secs: 40, act: 'work', kind: 'work', shift: 'am', title: 'Morning shift', sub: job().job + ' at ' + job().employer, activity: job().id }));
        await shot('job-' + d + '-intro', 600);
        await ev(() => { const b = document.querySelector('#jStage .btn'); if (b) b.click(); });
        await shot('job-' + d + '-play-a', 1400);
        await shot('job-' + d + '-play-b', 1600);
        await ev(() => { if (G.skip && G.skip.job && JA.finish) { G.skip.job.progress = 1; } });
        await shot('job-' + d + '-end', 2500);
        await clearUI();
      }
    }

    if (want('scenes')) {
      await newGame('cs'); await clearUI();
      const scenes = [
        { scene: 'cinema', kind: 'film', title: 'Night Train', sub: 'Action · Theater 1', film: 'Night Train', pal: ['#274', '#9bd'], popcorn: true, lines: ['The lights go down.', 'Previews end.'] },
        { scene: 'salon', kind: 'salon', title: 'Fresh trim', sub: "Bianca's Salon", lines: ['Snip snip.'] },
        { scene: 'laundry', kind: 'laundry', title: 'Wash and dry', sub: 'Suds Laundromat', lines: ['Quarters in. Soap in.'] },
        { scene: 'music', kind: 'mic', title: 'Open mic night', sub: 'Cafe Luna', lines: ['A shy poet.'] },
        { scene: 'dentist', kind: 'dental', title: 'Checkup', sub: 'Dr. Patel', lines: ['Open wide.'] },
        { scene: 'read', kind: 'read', title: 'A book', sub: 'Chapter 1', place: 'apartment', lines: ['Page one.'] },
      ];
      for (const o of scenes) {
        await clearUI();
        await ev(o => { try { if (o.scene === 'salon') { o.before = Object.assign({}, PLAYER_LOOK); o.after = Object.assign({}, PLAYER_LOOK, { hair: '#5a3a8a' }); } if (o.scene === 'music') o.singer = NPC_LOOK[5]; startSkip(Object.assign({ mins: 60, secs: 20, act: 'idle' }, o)); } catch (e) { console.error('scene ' + o.scene + ': ' + e.message); } }, o);
        await shot('scene-' + o.scene + '-a', 900);
        await ev(() => { if (G.skip && G.skip.scene && typeof SC !== 'undefined') SC.update(0.6); });
        await shot('scene-' + o.scene + '-b', 900);
      }
      await clearUI();
    }

    if (want('dreams')) {
      await newGame('cs'); await clearUI();
      const motifs = await ev(() => GOOD_DREAMS.concat(BAD_DREAMS).map(d => d.id));
      for (const id of (motifs || []).filter((_, i) => i % 2 === 0).slice(0, 8)) {
        await clearUI();
        await ev(id => {
          const base = GOOD_DREAMS.concat(BAD_DREAMS).find(d => d.id === id);
          const d = { id, title: base.title, motif: base.motif, good: GOOD_DREAMS.includes(base), hunger: 0, scale: 1, beats: base.beats.slice(), choice: null, defaultEnergy: 0 };
          S.t = 23 * 60; startSkip({ mins: 480, secs: 30, act: 'sleep', kind: 'sleep', title: 'Sleeping', sub: '', dream: d });
        }, id);
        await shot('dream-' + id, 1800);
      }
      await clearUI();
    }

    if (want('ui')) {
      await newGame('cs'); await clearUI();
      await ev(() => { S.day = 3; S.t = 9 * 60; });
      for (const tab of ['today', 'map', 'msgs', 'career', 'trophies']) {
        await ev(t => { G.menu = false; closePhone(); openPhone(t); }, tab); await shot('phone-' + tab, 500);
      }
      await ev(() => closePhone());
      await ev(() => { G.menu = false; openMenu(); }); await shot('menu', 500); await ev(() => closeMenu());
      await ev(() => { S.perkPicks = 1; S.lvl = Math.max(S.lvl || 1, 2); G.menu = false; showLevelUp(); }); await shot('levelup', 900); await ev(() => closeLevelUp());
      await ev(() => { G.menu = false; showPromo(1); }); await shot('promo', 900); await ev(() => closeLevelUp());
      await ev(() => { rollLog(); S.recapDay = 0; G.menu = false; showRecap(); }); await shot('recap', 600); await ev(() => closeRecap());
      await ev(() => { G.menu = false; openNotice('Rent is due', 'You owe $450 by Friday.'); }); await shot('notice', 400); await clearUI();
      await ev(() => { S.over = true; G.overShown = false; showOver(); }); await shot('gameover', 500);
      await ev(() => { S.over = null; }); await clearUI();
    }

    if (want('fishing')) {
      await newGame('cs'); await clearUI();
      await ev(() => { S.day = 9; S.t = 10 * 60; startFishing(); }); await shot('fishing-cast', 700);
      await ev(() => { FS.phase = 'wait'; }); await shot('fishing-wait', 900);
      await ev(() => { endFishing(); S.day = 24; startFishing(); }); await shot('fishing-ice', 700);
      await ev(() => endFishing()); await clearUI();
    }

    if (want('mobile')) {
      await page.setViewportSize({ width: 390, height: 844 });
      await newGame('cs'); await clearUI();
      await townAt(1400, 700, 2, 17.8); await shot('mobile-town', 900);
      await ev(() => { openPanel('apartment'); }); await shot('mobile-panel', 500); await clearUI();
      await ev(() => { openPhone('today'); }); await shot('mobile-phone', 500); await ev(() => closePhone());
      await ev(() => { enterInterior('grocery'); }); await shot('mobile-interior', 600);
      await ev(() => { leaveInterior(); startSkip({ mins: 240, secs: 40, act: 'work', kind: 'work', shift: 'am', title: 'Morning shift', sub: '', activity: job().id }); }); await shot('mobile-job', 700);
      await clearUI();
      await ev(() => { startCutscene(); }); await ev(() => { CUT.t = 8; }); await shot('mobile-cut', 400); await ev(() => finishCut());
      await shot('mobile-degree', 600);
      await page.setViewportSize({ width: VW, height: VH });
    }
  } catch (e) { errors.push(`[${stop}] TOUR ${e.stack || e.message}`); }

  const uniq = [...new Set(errors)];
  console.log(`tour done: ${n} screenshots -> ${out}`);
  console.log(uniq.length ? 'ERRORS (' + uniq.length + '):\n' + uniq.join('\n') : 'no errors');
  fs.writeFileSync(path.join(out, 'errors.txt'), uniq.join('\n'));
  await browser.close();
  process.exit(uniq.length ? 2 : 0);
})();
