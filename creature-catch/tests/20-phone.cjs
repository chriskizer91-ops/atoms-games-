// The game on phones and tablets: the touch pad under the canvas when upright (scaled down on phones narrower than
// 360 px), one half on each side of it when sideways, the notch and home bar insets, and sliding a thumb across the
// d-pad. For each device: the canvas and every pad button are on the screen and inside the safe area, nothing
// overlaps, the page doesn't scroll, and the canvas is as big as the layout allows.
//   node tests/20-phone.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
const { GAME, OUT } = require('./lib.cjs');
const { chromium, devices } = require('playwright');
const BTNS = ['bUp', 'bDown', 'bLeft', 'bRight', 'bA', 'bB', 'bStart', 'bL', 'bR'];
// name, Playwright device (or a viewport), the smallest canvas scale we accept, safe-area insets [top, right, bottom, left]
const CASES = [
  ['iPhone SE', devices['iPhone SE'], 1.3],
  ['iPhone SE landscape', devices['iPhone SE landscape'], 1.25],
  ['iPhone 13', devices['iPhone 13'], 1.6],
  ['iPhone 13 landscape', devices['iPhone 13 landscape'], 2],
  ['iPhone 13 notch', devices['iPhone 13'], 1.6, [47, 0, 34, 0]],
  ['iPhone 13 landscape notch', devices['iPhone 13 landscape'], 1.5, [0, 47, 21, 47]],
  ['Pixel 5', devices['Pixel 5'], 1.6],
  ['Pixel 5 landscape', devices['Pixel 5 landscape'], 1.8],
  ['Galaxy S8 landscape', devices['Galaxy S8 landscape'], 1.95],
  ['280 px phone', { ...devices['Galaxy S9+'], viewport: { width: 280, height: 653 } }, 1.15],
  ['iPad Mini', devices['iPad Mini'], 3],
  ['iPad Mini landscape', devices['iPad Mini landscape'], 2],
];
(async () => {
  const b = await chromium.launch();
  const errs = [], fails = [];
  const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };
  const overlap = (a, c) => a.x < c.x + c.w - 0.5 && c.x < a.x + a.w - 0.5 && a.y < c.y + c.h - 0.5 && c.y < a.y + a.h - 0.5;
  for (const [name, dev, minScale, insets] of CASES) {
    const ctx = await b.newContext({ ...dev }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': CONSOLE ' + m.text()); });
    if (insets) { // a notched phone: the env(safe-area-inset-*) values
      const cdp = await ctx.newCDPSession(p);
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: insets[0], right: insets[1], bottom: insets[2], left: insets[3] } });
    }
    await p.goto(GAME); await p.waitForTimeout(1200);
    await p.evaluate(() => { document.body.classList.add('touch'); __cc.resize(); }); // (a phone's first touch does this)
    await p.waitForTimeout(100);
    const L = await p.evaluate((BTNS) => {
      const r = (el) => { const q = el.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; };
      const cs = getComputedStyle(document.body), px = (k) => parseFloat(cs['padding' + k]) || 0;
      const out = { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
        safe: { x: px('Left'), y: px('Top'), w: innerWidth - px('Left') - px('Right'), h: innerHeight - px('Top') - px('Bottom') },
        side: document.body.classList.contains('side'), canvas: r(document.getElementById('screen')), btn: {}, hit: {} };
      BTNS.forEach((id) => {
        const el = document.getElementById(id), q = r(el); out.btn[id] = q;
        const at = document.elementFromPoint(q.x + q.w / 2, q.y + q.h / 2); out.hit[id] = at && at.id;
      });
      return out;
    }, BTNS);
    const scale = L.canvas.w / 240, inside = (q, s) => q.x >= s.x - 0.5 && q.y >= s.y - 0.5 && q.x + q.w <= s.x + s.w + 0.5 && q.y + q.h <= s.y + s.h + 0.5;
    console.log(`${name}: ${L.vw}x${L.vh}, ${L.side ? 'pad beside' : 'pad under'} the canvas, canvas ${L.canvas.w}x${L.canvas.h} at ${L.canvas.x.toFixed(0)},${L.canvas.y.toFixed(0)} (${scale.toFixed(2)}x), d-pad ${L.btn.bUp.w.toFixed(0)} px, A ${L.btn.bA.w.toFixed(0)} px`);
    check(L.sw <= L.vw && L.sh <= L.vh, `${name}: the page doesn't scroll (${L.sw}x${L.sh})`);
    check(inside(L.canvas, L.safe), `${name}: the canvas is on the screen, inside the safe area`);
    check(scale >= minScale, `${name}: the canvas is big enough (${scale.toFixed(2)}x, at least ${minScale}x)`);
    const bad = BTNS.filter((id) => !inside(L.btn[id], L.safe));
    check(!bad.length, `${name}: every button is on the screen, inside the safe area ${bad.join(' ')}`);
    const onCanvas = BTNS.filter((id) => overlap(L.btn[id], L.canvas));
    check(!onCanvas.length, `${name}: no button covers the canvas ${onCanvas.join(' ')}`);
    const pairs = []; BTNS.forEach((a, i) => BTNS.slice(i + 1).forEach((c) => { if (overlap(L.btn[a], L.btn[c])) pairs.push(a + '/' + c); }));
    check(!pairs.length, `${name}: no two buttons overlap ${pairs.join(' ')}`);
    const covered = BTNS.filter((id) => L.hit[id] !== id);
    check(!covered.length, `${name}: a tap on each button's middle reaches it ${covered.map((id) => id + '->' + L.hit[id]).join(' ')}`);
    if (L.vw > L.vh && L.vw < 900) { // a phone held sideways: the d-pad on the left, A and B on the right
      check(L.side && L.btn.bRight.x + L.btn.bRight.w <= L.canvas.x && L.btn.bB.x >= L.canvas.x + L.canvas.w, `${name}: the pad's halves sit beside the canvas`);
    }
    await p.screenshot({ path: `${OUT}/20-${name.replace(/ /g, '-')}.png` });

    if (name === 'iPhone 13') { // slide a thumb across the d-pad, and off A
      const cdp = await ctx.newCDPSession(p);
      const mid = (id) => ({ x: L.btn[id].x + L.btn[id].w / 2, y: L.btn[id].y + L.btn[id].h / 2 });
      const held = () => p.evaluate(() => { const h = __cc.input.held; return ['up', 'down', 'left', 'right', 'a', 'b'].filter((k) => h[k]).join(',') || '-'; });
      const touch = async (type, pt) => { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pt ? [{ x: pt.x, y: pt.y, id: 1 }] : [] }); await p.waitForTimeout(60); };
      const slide = async (from, to) => { const a = mid(from), c = mid(to); for (let i = 1; i <= 6; i++) await touch('touchMove', { x: a.x + (c.x - a.x) * i / 6, y: a.y + (c.y - a.y) * i / 6 }); };
      await touch('touchStart', mid('bRight')); const h1 = await held();
      await slide('bRight', 'bDown'); const h2 = await held();
      await slide('bDown', 'bLeft'); const h3 = await held();
      await touch('touchEnd'); const h4 = await held();
      console.log('d-pad slide: start ' + h1 + ', onto Down ' + h2 + ', onto Left ' + h3 + ', lifted ' + h4);
      check(h1 === 'right' && h2 === 'down' && h3 === 'left' && h4 === '-', 'sliding a thumb across the d-pad switches direction');
      await touch('touchStart', mid('bA')); const a1 = await held();
      await slide('bA', 'bB'); const a2 = await held();
      await touch('touchEnd'); const a3 = await held();
      console.log('A slide: start ' + a1 + ', onto B ' + a2 + ', lifted ' + a3);
      check(a1 === 'a' && a2 === 'a' && a3 === '-', 'A keeps the thumb: sliding onto B doesn\'t press B');
    }
    await ctx.close();
  }
  console.log(fails.length ? fails.length + ' checks failed' : 'all checks passed');
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.join('; '));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
