// Walk every map: a static and a live check of every map, every exit, door and person, at four story stages.
//
// Static (in the page, on the real CC.MAPS / CC.NPCS / CC.DOORS / CC.FLY_SPOTS after every patch file ran), for four
// story stages (early: just a starter; mid: TRIAL CAVE; late: every trial, the ending, keys, the post-game flags;
// waiting: late, with Solarion, Gloaming and Lunarion waiting to be caught):
//   - rows all the same width, tile letters known
//   - every exit: target map exists, its range is on the map, the landing tile is in bounds and walkable (not a wall,
//     building, solid prop or visible person), the edge tile you walk off is walkable and reachable, and stepping back
//     from the landing tile the way you came takes you back to the map you came from (round trip)
//   - every door: a room behind it, the tile below it is walkable/reachable, the room's mat leads back below the door
//   - stairs (climb() calls in furniture), Fly spots, scripted warps, heal spots, GOTO spots: landing walkable
//   - from every landing you can reach some way out (exit, door, stairs, a person or thing that warps you)
//   - people: not on walls/props/buildings/other people, someone can stand next to them to talk (or across a counter),
//     patrol points walkable; people blocking tiles that would be reachable without them
//   - chests, talkable props, signs and landmarks: something can stand next to them; signs have text; props sharing
//     a tile (the first one wins, so a later talk/chest never runs)
//   - walkable edge tiles with no exit (they just bump)
// Live (late stage, every gate open, wild battles and trainers off): for every exit, stand on the edge tile and hold
// the direction until the map changes, check where you land and that the follower is on a free tile, then hold the
// opposite direction and check you come back. For every door: walk up into it, check the landing, walk down out of
// the mat and check you're back below the door.
//
// Every high or medium issue fails the test, except the few in KNOWN below (by design). Low ones are listed only.
//   node tests/16-walk-every-map.cjs (from the creature-catch folder, after node tools/build.mjs; tests/README.md)
//   WALK_ALL=1 walks every exit tile instead of one per exit; WALK_LIVE=0 skips the live pass.
// The full report goes to tests/out/16-walk-report.json.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { ROOT, GAME, OUT } = require('./lib.cjs');
const LIVE = process.env.WALK_LIVE !== '0';

// issues that are there by design: they're printed, but they don't fail the test
const KNOWN = [
  // the main road's gates stay shut until their guide's trial
  (i) => i.kind === 'exit-unusable' && /^exit top to \w+: every edge tile in its range is blocked \((tile '=', )*tile '='\)$/.test(i.msg),
  // the Dawn Temple's halls open one mirror at a time (the post-game): before that its people and chests are out of reach
  (i) => i.map === 'temple' && i.stages.every((s) => s === 'early' || s === 'mid') && /^(person|prop|landmark)-unreachable$/.test(i.kind),
  // only a dev code (GOTO FOREST before Bramble's trial) can come down from the Forest while Bramble still stands on the trail
  (i) => i.stages.join() === 'early' && /^(landing-blocked|exit-lands-blocked)$/.test(i.kind) && /bramble/.test(i.msg),
];

// ---- facts only the source has: heal spots, GOTO landings, scripted warps ----
const SRC = fs.readdirSync(path.join(ROOT, 'src/js')).filter((f) => f.endsWith('.js')).sort()
  .map((f) => ({ f, text: fs.readFileSync(path.join(ROOT, 'src/js', f), 'utf8') }));
const spots = [];
SRC.forEach(({ f, text }) => {
  text.split('\n').forEach((line, i) => {
    let m; const re1 = /\{\s*map:\s*'([\w-]+)',\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/g;
    while ((m = re1.exec(line))) spots.push({ kind: 'heal/respawn spot', map: m[1], x: +m[2], y: +m[3], src: f + ':' + (i + 1) });
    const re2 = /world\.enter\('([\w-]+)',\s*(\d+),\s*(\d+)/g;
    while ((m = re2.exec(line))) spots.push({ kind: 'scripted warp', map: m[1], x: +m[2], y: +m[3], src: f + ':' + (i + 1) });
  });
});
// Bo's boat docks (an array the warp reads from)
const late = SRC.find((s) => s.f === '21-side-late.js');
const docks = /var DOCKS = (\[.*\]);/.exec(late.text);
if (docks) eval(docks[1]).forEach((d) => spots.push({ kind: 'scripted warp (Bo dock)', map: 'bayou', x: d[1], y: d[2], src: '21-side-late.js DOCKS' }));
const codes = SRC.find((s) => s.f === '08-codes.js').text;
const arr = /var ARRIVE = (\{[\s\S]*?\});/.exec(codes);
if (arr) {
  const A = eval('(' + arr[1] + ')');
  Object.keys(A).forEach((k) => spots.push({ kind: 'GOTO landing', map: k, x: A[k][0], y: A[k][1], src: '08-codes.js ARRIVE' }));
}

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(GAME); await p.waitForTimeout(1800);
  await p.evaluate(() => {
    const C = __cc; C.stack.length = 0; C.state = C.newState();
    C.world.enter('village', 10, 6, 'down'); C.push(C.world);
    C.runCodes('STARTER EMBROAK; NOWILD');
  });
  await p.waitForTimeout(300);

  const STAGES = {
    early: 'STARTER EMBROAK',
    mid: 'TRIAL CAVE',
    late: 'TRIAL ALL; ENDING; PAGES ALL; KEYS; FLY',
    waiting: '', // late, plus the guardians waiting to be caught and Juniper in Willow's house
  };
  const report = { static: {}, live: null, errors: errs };
  for (const stage of Object.keys(STAGES)) {
    await p.evaluate((code) => { __cc.runCodes(code); if (__cc.dev.queue) { __cc.dev.queue = null; } }, STAGES[stage]);
    await p.waitForTimeout(200);
    if (stage === 'late') await p.evaluate(() => {
      const F = __cc.state.flags;
      ['templeOpen', 'solarionCalm', 'sunEmber', 'doorOpen', 'gloamingCalm', 'bellRings', 'balance', 'archiveKey', 'boatTicket', 'moonRestored',
        'seenCopperbell', 'seenIsle', 'logCleared', 'gloamingSeen', 'ilsaWall'].forEach((k) => { F[k] = true; });
      // the Dawn Temple's three mirrors solved (each points at its sun switch)
      F.mirror1 = 'right'; F.mirror2 = 'down'; F.mirror3 = 'left';
    });
    if (stage === 'waiting') await p.evaluate(() => {
      const F = __cc.state.flags; F.solarionWaits = F.gloamingWaits = F.lunarionSpire = F.juniperIn = true;
      ['solarion', 'gloaming', 'lunarion'].forEach((k) => { delete __cc.state.caught[k]; });
    });
    report.static[stage] = await p.evaluate(analyze, spots);
  }

  // juniperIn is only set during the starter scene (she stands on Willow's doormat)
  await p.evaluate(() => { __cc.state.flags.juniperIn = false; });
  if (LIVE) report.live = await p.evaluate(liveWalk, process.env.WALK_ALL === '1');
  report.errors = errs;
  fs.writeFileSync(path.join(OUT, '16-walk-report.json'), JSON.stringify(report, null, 1));

  // ---- a readable summary: each issue once, with the stages it shows up in ----
  const groups = new Map();
  for (const stage of Object.keys(report.static)) {
    const r = report.static[stage];
    console.log(`== ${stage}: ${r.maps} maps, ${r.exits} exit tiles, ${r.doors} doors, ${r.issues.length} issues`);
    r.issues.forEach((i) => {
      const k = i.sev + i.kind + i.map + i.x + ',' + i.y + i.msg;
      if (!groups.has(k)) groups.set(k, Object.assign({ stages: [] }, i));
      groups.get(k).stages.push(stage);
    });
  }
  const order = { high: 0, medium: 1, low: 2 };
  const fails = [];
  const mark = (i) => { const known = KNOWN.some((k) => k(i)); const bad = i.sev !== 'low' && !known; if (bad) fails.push(i); return bad ? 'FAIL ' : known ? 'known' : 'info '; };
  [...groups.values()].sort((a, b) => order[a.sev] - order[b.sev]).forEach((i) => console.log(`  ${mark(i)} [${i.sev}] ${i.kind} ${i.map} (${i.x},${i.y}) {${i.stages.join(',')}}: ${i.msg}`));
  if (report.live) {
    console.log(`\n== live: ${report.live.exitsTried} exits walked, ${report.live.doorsTried} doors walked, ${report.live.issues.length} issues`);
    report.live.issues.forEach((i) => { i.stages = ['live']; console.log(`  ${mark(i)} [${i.sev}] ${i.kind} ${i.map} (${i.x},${i.y}): ${i.msg}`); });
  }
  console.log('\n' + (fails.length ? fails.length + ' issues failed the test' : 'every map checks out (no high or medium issues beyond the known ones)'));
  if (fails.length) errs.push('FAILED CHECKS: ' + fails.map((i) => i.kind + ' ' + i.map + ' ' + i.x + ',' + i.y).join('; '));
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

// =====================================================================================================
// in the page: the static analysis for the current flags
function analyze(spots) {
  const C = __cc, W = C.world, issues = [];
  const add = (sev, kind, map, x, y, msg) => issues.push({ sev, kind, map, x, y, msg });
  const ids = Object.keys(C.MAPS);
  const DIR = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const KNOWN = '.,:T~oS=*xrdL#WwPcm';
  // the real collision test, for any map, with or without people
  function use(id, npcs) { W.map = C.MAPS[id]; W.mapId = id; W.npcs = npcs === undefined ? (C.NPCS[id] || []) : npcs; }
  const isPatrol = (n) => !!n.patrol;
  const visible = (n) => !n.when || n.when();
  function solid(id, x, y, npcs) { use(id, npcs); return W.solidAt(x, y); }
  function size(id) { const m = C.MAPS[id]; return [m.rows[0].length, m.rows.length]; }
  function inB(id, x, y) { const [w, h] = size(id); return x >= 0 && y >= 0 && x < w && y < h; }
  function whatIs(id, x, y) {
    const m = C.MAPS[id]; use(id);
    if (!inB(id, x, y)) return 'off the map';
    const t = C.tileAt(m, x, y), out = [];
    if (C.tileSolid(m, t)) out.push("tile '" + t + "'");
    const b = W.buildingAt(x, y); if (b) out.push('building ' + b.id);
    (m.decor || []).forEach((d) => { if (d.x === x && d.y === y && d.solid !== false) out.push('prop ' + (d.img || (d.chest ? 'chest ' + d.chest : d.cube ? 'cube' : 'blank'))); });
    const n = W.npcAt(x, y); if (n) out.push('person ' + (n.name || n.art || n.look || n.id));
    return out.join(' + ') || 'free';
  }
  // ---- 0. every map enters without an error (onEnter can change decor) ----
  const cur = { map: C.state.map, x: C.state.x, y: C.state.y };
  ids.forEach((id) => { try { const m = C.MAPS[id]; W.enter(id, (m.inside || [1, 1])[0], (m.inside || [1, 1])[1]); } catch (e) { add('high', 'enter-error', id, 0, 0, String(e)); } });
  W.enter(cur.map, cur.x, cur.y);

  // ---- 1. shape and letters ----
  ids.forEach((id) => {
    const m = C.MAPS[id], w = m.rows[0].length;
    m.rows.forEach((r, y) => { if (r.length !== w) add('high', 'ragged-row', id, 0, y, 'row ' + y + ' is ' + r.length + ' wide, row 0 is ' + w); });
    const lg = m.legend && C.LEGENDS[m.legend];
    m.rows.forEach((r, y) => [...r].forEach((t, x) => { if (KNOWN.indexOf(t) < 0 && !(lg && lg[t])) add('medium', 'unknown-tile', id, x, y, "letter '" + t + "' has no meaning (walkable, drawn as nothing)"); }));
  });

  // ---- 2. entries (every way into each map) and ways out ----
  const entries = {}; ids.forEach((id) => { entries[id] = []; });
  const wayOut = {}; ids.forEach((id) => { wayOut[id] = []; });
  function entry(map, x, y, src) {
    if (!C.MAPS[map]) { add('high', 'missing-map', map, x, y, src + ' goes to a map that does not exist'); return; }
    entries[map].push({ x, y, src });
  }
  let exitTiles = 0, doorCount = 0;
  const exitList = [];
  ids.forEach((id) => {
    const m = C.MAPS[id], [w, h] = size(id);
    (m.exits || []).forEach((e, ei) => {
      if (!C.MAPS[e.to]) { add('high', 'missing-map', id, 0, 0, 'exit ' + ei + ' goes to "' + e.to + '"'); return; }
      const side = e.side, sw = side === 'left' || side === 'right';
      const a = sw ? e.y0 : e.x0, b = sw ? e.y1 : e.x1;
      if (a === undefined || b === undefined) { add('high', 'bad-exit', id, 0, 0, 'exit ' + ei + ' has no range'); return; }
      for (let k = a; k <= b; k++) {
        const ex = side === 'left' ? 0 : side === 'right' ? w - 1 : k, ey = side === 'top' ? 0 : side === 'bottom' ? h - 1 : k;
        const nx = ex + DIR[side][0], ny = ey + DIR[side][1];
        if (!inB(id, ex, ey)) { add('medium', 'exit-range-off-map', id, ex, ey, 'exit ' + ei + ' (' + side + ' to ' + e.to + ') covers a tile off the map'); continue; }
        const x = sw ? e.tx : e.fixedX ? e.tx0 : e.tx0 + (nx - e.x0);
        const y = sw ? (e.fixedY ? e.ty0 : e.ty0 + (ny - e.y0)) : e.ty;
        exitTiles++;
        const rec = { from: id, ei, side, edge: [ex, ey], to: e.to, land: [x, y] };
        exitList.push(rec);
        entry(e.to, x, y, id + ' exit ' + side + ' ' + ex + ',' + ey);
        wayOut[id].push({ x: ex, y: ey, why: 'exit ' + side + ' to ' + e.to });
      }
    });
    (m.buildings || []).forEach((b) => {
      if (!b.door) return;
      doorCount++;
      const target = b.id === 'spire-door' ? 'spire' : C.DOORS[b.id];
      if (!target) { add('medium', 'door-goes-nowhere', id, b.door[0], b.door[1], 'building ' + b.id + ' has a door but no room in CC.DOORS (walking in does nothing)'); return; }
      if (!C.MAPS[target]) { add('high', 'missing-map', id, b.door[0], b.door[1], 'door ' + b.id + ' -> ' + target); return; }
      const land = b.id === 'spire-door' ? [8, 18] : C.MAPS[target].inside;
      if (!land) { add('high', 'room-no-inside', target, 0, 0, 'room behind ' + b.id + ' has no inside tile'); return; }
      entry(target, land[0], land[1], 'door ' + id + ':' + b.id);
      wayOut[id].push({ x: b.door[0], y: b.door[1] + 1, why: 'door ' + b.id, door: b, target });
    });
    (m.decor || []).forEach((d) => {
      const src = typeof d.talk === 'function' ? d.talk.toString() : '';
      let mm; const re = /climb\('([\w-]+)',\s*(\d+),\s*(\d+)\)/g;
      while ((mm = re.exec(src))) {
        entry(mm[1], +mm[2], +mm[3], 'stairs in ' + id + ' at ' + d.x + ',' + d.y);
        wayOut[id].push({ x: d.x, y: d.y, why: 'stairs to ' + mm[1], touch: true });
      }
      if (/world\.enter\(|ancientDoor/.test(src)) wayOut[id].push({ x: d.x, y: d.y, why: 'a warp in a prop' + (/ancientDoor/.test(src) ? ' to hollow' : ''), touch: true });
    });
    (C.NPCS[id] || []).forEach((n) => {
      const src = typeof n.talk === 'function' ? n.talk.toString() : '';
      if (/world\.enter\(|boatBack|boDock|sailToIsle|toIsle/.test(src)) wayOut[id].push({ x: n.x, y: n.y, why: 'a person who takes you away', touch: true, npc: n });
    });
    const lmw = m.landmarkTalk && /world\.enter\('([\w-]+)'/.exec(m.landmarkTalk.toString());
    if (lmw) {
      m.rows.forEach((r, y) => [...r].forEach((t, x) => { if (t === 'L') wayOut[id].push({ x, y, why: 'landmark warp to ' + lmw[1], touch: true }); }));
    }
    if (m.inside) entry(id, m.inside[0], m.inside[1], id + '.inside');
  });
  C.FLY_SPOTS.forEach((f) => { if (f.map) entry(f.map, f.land[0], f.land[1], 'Fly: ' + f.name); });
  spots.forEach((s) => entry(s.map, s.x, s.y, s.kind + ' (' + s.src + ')'));
  // the boat / Bo / talk-warps we can't see by name: Gus on the cove side talks through a named function
  // (sailToIsle etc. are guesses; the function-name regex above catches boatBack and boDock)

  // ---- 3. landing tiles ----
  ids.forEach((id) => entries[id].forEach((e) => {
    if (!inB(id, e.x, e.y)) { add('high', 'landing-off-map', id, e.x, e.y, e.src); return; }
    if (solid(id, e.x, e.y)) add('high', 'landing-blocked', id, e.x, e.y, e.src + ' lands on ' + whatIs(id, e.x, e.y));
  }));

  // ---- 4. flood fill per map ----
  function flood(id, starts, npcs) {
    const seen = new Set(), q = [];
    starts.forEach((s) => { if (inB(id, s.x, s.y) && !solid(id, s.x, s.y, npcs)) { const k = s.x + ',' + s.y; if (!seen.has(k)) { seen.add(k); q.push([s.x, s.y]); } } });
    while (q.length) {
      const [x, y] = q.shift();
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + d[0], ny = y + d[1], k = nx + ',' + ny;
        if (seen.has(k) || !inB(id, nx, ny) || solid(id, nx, ny, npcs)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  }
  const near = (set, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some((d) => set.has((x + d[0]) + ',' + (y + d[1])));
  const reach = {};
  ids.forEach((id) => {
    const m = C.MAPS[id], [w, h] = size(id);
    const people = (C.NPCS[id] || []).filter((n) => !isPatrol(n));
    const all = flood(id, entries[id], people);
    reach[id] = all;
    use(id);
    // ways out reachable from each entry
    entries[id].forEach((e) => {
      if (solid(id, e.x, e.y)) return;
      const r = flood(id, [e], people);
      const ok = wayOut[id].some((o) => (o.touch || o.door ? near(r, o.x, o.y) || r.has(o.x + ',' + o.y) : r.has(o.x + ',' + o.y)));
      if (!ok && !/GOTO|heal\/respawn/.test(e.src)) add('high', 'trapped', id, e.x, e.y, 'from ' + e.src + ' there is no way out (no exit, door, stairs or warp reachable)');
      else if (!ok) add('medium', 'trapped', id, e.x, e.y, 'from ' + e.src + ' there is no way out');
    });
    // exits: the edge tile you walk off must be reachable
    const byExit = {};
    exitList.filter((x) => x.from === id).forEach((x) => { const k = x.ei; (byExit[k] = byExit[k] || []).push(x); });
    Object.keys(byExit).forEach((k) => {
      const list = byExit[k], walk = list.filter((x) => !solid(id, x.edge[0], x.edge[1], people));
      const e0 = list[0];
      if (!walk.length) { add('medium', 'exit-unusable', id, e0.edge[0], e0.edge[1], 'exit ' + e0.side + ' to ' + e0.to + ': every edge tile in its range is blocked (' + list.map((x) => whatIs(id, x.edge[0], x.edge[1])).join(', ') + ')'); return; }
      if (!walk.some((x) => all.has(x.edge[0] + ',' + x.edge[1]))) add('medium', 'exit-unreachable', id, e0.edge[0], e0.edge[1], 'exit ' + e0.side + ' to ' + e0.to + ' cannot be reached from any way in');
      list.forEach((x) => {
        if (solid(id, x.edge[0], x.edge[1], people)) return;
        // walking off this edge lands on x.land in x.to; is that tile free?
        if (!inB(x.to, x.land[0], x.land[1])) add('high', 'exit-lands-off-map', id, x.edge[0], x.edge[1], 'walking ' + x.side + ' lands at ' + x.to + ' ' + x.land + ' (off the map)');
        else if (solid(x.to, x.land[0], x.land[1])) add('high', 'exit-lands-blocked', id, x.edge[0], x.edge[1], 'walking ' + x.side + ' lands at ' + x.to + ' ' + x.land + ' on ' + whatIs(x.to, x.land[0], x.land[1]));
        else {
          // round trip: from the landing, keep walking the opposite way until you leave the map or bump
          const back = DIR[OPP[x.side]];
          let bx = x.land[0], by = x.land[1], steps = 0, res = null;
          use(x.to);
          while (steps < 60) {
            const nx = bx + back[0], ny = by + back[1];
            const ex = W.exitAt(nx, ny);
            if (ex) { res = ex; break; }
            if (W.solidAt(nx, ny)) break;
            bx = nx; by = ny; steps++;
          }
          if (!res) {
            // not a straight line back: is there any exit back to where you came from?
            const backExits = exitList.filter((y) => y.from === x.to && y.to === id);
            const backDoors = (wayOut[x.to] || []).filter((o) => o.target === id || (o.why && o.why.indexOf(id) >= 0));
            const bumpT = C.tileAt(C.MAPS[x.to], bx + back[0], by + back[1]);
            if (!backExits.length && !backDoors.length && !/warp|takes you/.test((wayOut[x.to] || []).map((o) => o.why).join())) add('medium', 'one-way', id, x.edge[0], x.edge[1], x.side + ' exit to ' + x.to + ': ' + x.to + ' has no exit or door back to ' + id);
            else if (backDoors.length || bumpT === '=') {}
            else add('low', 'no-straight-step-back', id, x.edge[0], x.edge[1], 'walking ' + x.side + ' into ' + x.to + ' ' + x.land + ', then straight back ' + OPP[x.side] + ', bumps at ' + bx + ',' + by + ' (' + whatIs(x.to, bx + back[0], by + back[1]) + ')');
          } else if (res.to !== id) add('medium', 'step-back-wrong-map', id, x.edge[0], x.edge[1], 'walking ' + x.side + ' into ' + x.to + ' then straight back leads to ' + res.to);
          else {
            // where does the return trip land, compared with where you started?
            const nx = bx + back[0], ny = by + back[1], sw = res.side === 'left' || res.side === 'right';
            const rx = sw ? res.tx : res.fixedX ? res.tx0 : res.tx0 + (nx - res.x0);
            const ry = sw ? (res.fixedY ? res.ty0 : res.ty0 + (ny - res.y0)) : res.ty;
            const dist = Math.abs(rx - x.edge[0]) + Math.abs(ry - x.edge[1]);
            if (dist > 2) add('low', 'round-trip-drift', id, x.edge[0], x.edge[1], 'out ' + x.side + ' to ' + x.to + ' ' + x.land + ' and straight back lands at ' + rx + ',' + ry + ' (' + dist + ' tiles from where you left)');
          }
        }
      });
    });
    // walkable edge tiles without an exit
    use(id);
    const edgeNo = [];
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) continue;
      if (!all.has(x + ',' + y)) continue;
      const outs = [];
      if (y === 0) outs.push([x, -1]); if (y === h - 1) outs.push([x, h]); if (x === 0) outs.push([-1, y]); if (x === w - 1) outs.push([w, y]);
      outs.forEach((o) => { if (!W.exitAt(o[0], o[1])) edgeNo.push(x + ',' + y + "('" + m.rows[y][x] + "')"); });
    }
    if (edgeNo.length && !m.indoors) add('low', 'edge-no-exit', id, 0, 0, 'reachable edge tiles where stepping off just bumps: ' + edgeNo.join(' '));
    if (edgeNo.length && m.indoors) add('low', 'edge-no-exit', id, 0, 0, 'room: reachable edge tiles where stepping off just bumps: ' + edgeNo.join(' '));
    // doors: the tile below must be reachable; the room mat must lead back below the door
    wayOut[id].filter((o) => o.door).forEach((o) => {
      const b = o.door;
      if (!all.has(o.x + ',' + o.y)) add('medium', 'door-unreachable', id, b.door[0], b.door[1], 'door ' + b.id + ': the tile below it (' + o.x + ',' + o.y + ') is ' + (solid(id, o.x, o.y) ? whatIs(id, o.x, o.y) : 'not reachable'));
      if (o.target === 'spire') return;
      const r = C.MAPS[o.target], back = (r.exits || []).filter((e) => e.side === 'bottom');
      if (!back.length) { add('high', 'room-no-way-out', o.target, 0, 0, 'room behind ' + b.id + ' has no bottom exit'); return; }
      back.forEach((e) => {
        if (e.to !== id) add('high', 'room-wrong-map', o.target, e.x0, r.rows.length - 1, 'room behind ' + id + ':' + b.id + ' leads out to ' + e.to);
        else if (e.tx0 !== b.door[0] || e.ty !== b.door[1] + 1) add('medium', 'room-exit-not-at-door', o.target, e.x0, r.rows.length - 1, 'leaving the room puts you at ' + e.tx0 + ',' + e.ty + ' but the door ' + b.id + ' is at ' + b.door + ' (below it is ' + b.door[0] + ',' + (b.door[1] + 1) + ')');
      });
    });
    // people
    const ppl = (C.NPCS[id] || []);
    ppl.forEach((n, i) => {
      if (!visible(n)) return;
      const nm = n.name || n.art || n.look || n.id || ('#' + i);
      if (!inB(id, n.x, n.y)) { add('high', 'person-off-map', id, n.x, n.y, nm); return; }
      // solid under them, ignoring themselves
      const others = ppl.filter((o) => o !== n);
      if (solid(id, n.x, n.y, others.filter((o) => o.x === n.x && o.y === n.y)) && whatIs(id, n.x, n.y).replace(/ ?\+? ?person [^+]*/g, '')) {
        const wi = whatIs(id, n.x, n.y).split(' + ').filter((s) => s.indexOf('person') !== 0).join(' + ');
        if (wi) add('medium', 'person-on-solid', id, n.x, n.y, nm + ' stands on ' + wi);
      }
      const dup = others.filter((o) => visible(o) && o.x === n.x && o.y === n.y);
      if (dup.length && i < ppl.indexOf(dup[0])) add('medium', 'people-overlap', id, n.x, n.y, nm + ' and ' + dup.map((o) => o.name || o.art).join(', ') + ' share a tile');
      if (isPatrol(n)) n.patrol.forEach((pt) => { if (solid(id, pt[0], pt[1], [])) add('medium', 'patrol-point-blocked', id, pt[0], pt[1], nm + ' patrols to ' + whatIs(id, pt[0], pt[1])); });
      // can you talk to them?
      let talk = near(all, n.x, n.y);
      if (!talk) {
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const cx = n.x + d[0], cy = n.y + d[1];
          const deco = (C.MAPS[id].decor || []).find((o) => o.x === cx && o.y === cy);
          if (deco && deco.counter && all.has((cx + d[0]) + ',' + (cy + d[1]))) talk = true;
        }
      }
      if (!talk && !isPatrol(n) && n.id !== 'rival') add('medium', 'person-unreachable', id, n.x, n.y, nm + ': no tile next to them can be reached, so you can never talk to them');
    });
    // people blocking the way: tiles reachable without person P but not with
    const base = all.size;
    ppl.filter((n) => visible(n) && !isPatrol(n)).forEach((n) => {
      const without = flood(id, entries[id], people.filter((o) => o !== n));
      const gained = [...without].filter((k) => !all.has(k) && k !== n.x + ',' + n.y);
      if (gained.length) {
        const hits = [];
        wayOut[id].forEach((o) => { if (without.has(o.x + ',' + o.y) && !all.has(o.x + ',' + o.y)) hits.push(o.why); });
        add(hits.length ? 'medium' : 'low', 'person-blocks', id, n.x, n.y, (n.name || n.art || n.id) + ' cuts off ' + gained.length + ' tiles' + (hits.length ? ' including ' + hits.join(', ') : '') + ': ' + gained.slice(0, 8).join(' '));
      }
    });
    // props: talk/chest reachable; shadowed by an earlier prop on the same tile
    const dec = m.decor || [];
    dec.forEach((d, i) => {
      const first = dec.find((o) => o.x === d.x && o.y === d.y);
      if ((d.talk || d.chest) && first !== d) add('medium', 'prop-shadowed', id, d.x, d.y, (d.img || d.chest) + ' has ' + (d.chest ? 'a chest' : 'talk') + ' but an earlier prop on the same tile wins, so it never runs');
      if (!inB(id, d.x, d.y)) add('medium', 'prop-off-map', id, d.x, d.y, String(d.img));
      if ((d.talk || d.chest || d.cube) && !near(all, d.x, d.y) && !(d.solid === false && all.has(d.x + ',' + d.y))) {
        // a counter piece is talked across, a wall piece from below
        if (!(d.solid === false && near(all, d.x, d.y))) add('medium', 'prop-unreachable', id, d.x, d.y, (d.chest ? 'chest ' + d.chest : d.cube ? 'cube ' + d.cube : d.img) + ': nothing next to it can be reached');
      }
      if (inB(id, d.x, d.y) && (d.img || d.chest || d.talk) && C.tileSolid(m, C.tileAt(m, d.x, d.y)) && !(m.indoors && d.y <= 1 && d.solid === false))
        add(d.chest ? 'medium' : 'low', 'prop-on-solid-tile', id, d.x, d.y, (d.chest ? 'chest ' + d.chest : d.img || 'talk spot') + " sits on tile '" + C.tileAt(m, d.x, d.y) + "'" + (d.talk || d.chest ? ' (it has ' + (d.chest ? 'a chest' : 'talk') + ')' : ''));
      if (d.solid !== false && d.img && inB(id, d.x, d.y)) {
        const t = C.tileAt(m, d.x, d.y);
        if (W.buildingAt(d.x, d.y)) add('low', 'prop-in-building', id, d.x, d.y, d.img + ' sits inside building ' + W.buildingAt(d.x, d.y).id);
      }
    });
    // signs
    m.rows.forEach((r, y) => [...r].forEach((t, x) => {
      if (C.tileAt(m, x, y) !== 'S') return;
      if (!C.SIGNS[id + ':' + x + ',' + y]) add('low', 'sign-no-text', id, x, y, 'a sign tile with no CC.SIGNS entry (pressing A does nothing)');
      if (!near(all, x, y)) add('low', 'sign-unreachable', id, x, y, 'nothing next to the sign can be reached');
      if (t === 'L' && !m.landmarkTalk) {}
    }));
    const lms = []; m.rows.forEach((r, y) => [...r].forEach((t, x) => { if (t === 'L') lms.push([x, y]); }));
    if (lms.length && m.landmarkTalk && !lms.some((c) => near(all, c[0], c[1]))) add('medium', 'landmark-unreachable', id, lms[0][0], lms[0][1], 'no tile next to the landmark can be reached');
  });
  // extra: every map's spawn table exists; buildings have doors; exits on one side don't overlap;
  // trainers can see along their sight line; Juniper's rival spots are free
  ids.forEach((id) => {
    const m = C.MAPS[id];
    if (m.spawns && !C.SPAWNS[m.spawns]) add('high', 'missing-spawns', id, 0, 0, 'spawns "' + m.spawns + '" is not in CC.SPAWNS (tall grass would crash)');
    const grass = m.rows.some((r) => r.indexOf(',') >= 0);
    if (grass && !m.spawns && !m.indoors) add('low', 'grass-no-spawns', id, 0, 0, 'has tall grass but no spawns (walking in it never finds anything)');
    (m.buildings || []).forEach((b) => { if (!b.door) add('high', 'building-no-door', id, b.x, b.y, 'building ' + b.id + ' has no door (bumping into it reads b.door[0] of undefined)'); });
    const ex = m.exits || [];
    ex.forEach((a, i) => ex.forEach((b, j) => {
      if (j <= i || a.side !== b.side) return;
      const sw = a.side === 'left' || a.side === 'right';
      const a0 = sw ? a.y0 : a.x0, a1 = sw ? a.y1 : a.x1, b0 = sw ? b.y0 : b.x0, b1 = sw ? b.y1 : b.x1;
      if (a0 <= b1 && b0 <= a1) add('medium', 'exits-overlap', id, a0, 0, a.side + ' exits to ' + a.to + ' and ' + b.to + ' overlap (the first one wins)');
    }));
    (C.NPCS[id] || []).forEach((n) => {
      if (!n.sight || !visible(n)) return;
      const d = C.DIRS[n.dir];
      if (!d) { add('medium', 'trainer-no-dir', id, n.x, n.y, (n.name || n.id) + ' has sight but no facing'); return; }
      use(id);
      let seenTiles = 0, tx = n.x, ty = n.y;
      for (let k = 1; k <= n.sight; k++) { tx += d[0]; ty += d[1]; if (W.solidAt(tx, ty)) break; if (reach[id].has(tx + ',' + ty)) seenTiles++; }
      if (!seenTiles) add('low', 'trainer-blind', id, n.x, n.y, (n.name || n.id) + ' faces ' + n.dir + ' but no reachable tile is in sight (' + n.sight + '), so they never spot you');
    });
  });
  // trainers who spot you walk next to you and then stay there for good (n.x, n.y change): from every tile in their
  // sight line, where would they end up, and would they then wall you (or anything) off?
  ids.forEach((id) => {
    const ppl = (C.NPCS[id] || []).filter((n) => !isPatrol(n) && visible(n));
    ppl.filter((n) => n.sight).forEach((n) => {
      const d = C.DIRS[n.dir]; if (!d) return;
      let tx = n.x, ty = n.y;
      const nm = n.name || n.id;
      const reported = new Set();
      for (let k = 1; k <= n.sight; k++) {
        tx += d[0]; ty += d[1];
        use(id); if (W.solidAt(tx, ty)) break;
        if (!reach[id].has(tx + ',' + ty)) continue;
        // besidePlayer(n) with the player at tx,ty
        let best = null;
        ['up', 'down', 'left', 'right'].forEach((dd) => {
          const x = tx + C.DIRS[dd][0], y = ty + C.DIRS[dd][1];
          use(id); if (W.solidAt(x, y) && !(x === n.x && y === n.y)) return;
          const dist = Math.abs(x - n.x) + Math.abs(y - n.y);
          if (!best || dist < best.d) best = { x, y, d: dist };
        });
        if (!best) continue;
        const moved = Object.assign({}, n, { x: best.x, y: best.y, sight: 0 });
        const others = ppl.filter((o) => o !== n);
        const before = reach[id];
        const after = flood(id, entries[id].concat([{ x: tx, y: ty }]), others.concat([moved]));
        const fromPlayer = flood(id, [{ x: tx, y: ty }], others.concat([moved]));
        const outs = wayOut[id].filter((o) => (o.touch || o.door ? near(fromPlayer, o.x, o.y) || fromPlayer.has(o.x + ',' + o.y) : fromPlayer.has(o.x + ',' + o.y)));
        if (!outs.length) add('high', 'trainer-traps-you', id, tx, ty, nm + ' (at ' + n.x + ',' + n.y + ') spots you here, walks to ' + best.x + ',' + best.y + ' and stays: no way out is reachable from where you stand');
        const lost = wayOut[id].filter((o) => !o.touch && before.has(o.x + ',' + o.y) && !after.has(o.x + ',' + o.y)).map((o) => o.why);
        const lostPeople = others.filter((o) => near(before, o.x, o.y) && !near(after, o.x, o.y)).map((o) => o.name || o.art);
        const key = best.x + ',' + best.y;
        if ((lost.length || lostPeople.length) && !reported.has(key)) {
          reported.add(key);
          add('medium', 'trainer-blocks-after-battle', id, best.x, best.y, nm + ' (at ' + n.x + ',' + n.y + ', facing ' + n.dir + ') spots you at ' + tx + ',' + ty + ', walks to ' + best.x + ',' + best.y + ' and stays there, cutting off ' + lost.concat(lostPeople).join(', '));
        }
      }
    });
  });
  [['forest', 14, 16], ['cave', 13, 1], ['snow', 12, 4], ['ruins', 12, 4]].forEach((r) => {
    if (solid(r[0], r[1], r[2], (C.NPCS[r[0]] || []).filter((n) => n.id !== 'rival'))) add('medium', 'rival-spot-blocked', r[0], r[1], r[2], 'Juniper appears on ' + whatIs(r[0], r[1], r[2]));
  });
  // sign entries that point at no sign
  Object.keys(C.SIGNS).forEach((k) => {
    const mm = /^([\w-]+):(\d+),(\d+)$/.exec(k);
    if (!mm) return;
    const m = C.MAPS[mm[1]];
    if (!m) { add('low', 'sign-orphan', mm[1], 0, 0, 'CC.SIGNS["' + k + '"] for a missing map'); return; }
    if (C.tileAt(m, +mm[2], +mm[3]) !== 'S') add('low', 'sign-orphan', mm[1], +mm[2], +mm[3], 'CC.SIGNS["' + k + '"] but the tile is \'' + C.tileAt(m, +mm[2], +mm[3]) + '\' (text never shows)');
  });
  // Fly spots: land tile, and connected to a real way in
  C.FLY_SPOTS.forEach((f) => {
    if (!f.map) return;
    if (!C.MAPS[f.map]) { add('high', 'fly-missing-map', f.map, 0, 0, f.name); return; }
    const others = entries[f.map].filter((e) => e.src.indexOf('Fly:') !== 0 && !/GOTO|heal/.test(e.src));
    const r = flood(f.map, others, (C.NPCS[f.map] || []).filter((n) => !isPatrol(n)));
    if (!solid(f.map, f.land[0], f.land[1]) && !r.has(f.land[0] + ',' + f.land[1])) add('medium', 'fly-island', f.map, f.land[0], f.land[1], 'Fly to ' + f.name + ' lands somewhere you cannot walk to from the map\'s other ways in');
  });
  W.enter(cur.map, cur.x, cur.y);
  return { maps: ids.length, exits: exitTiles, doors: doorCount, issues };
}

// =====================================================================================================
// in the page: walk through every exit and door for real (late stage, gates open)
async function liveWalk(everyTile) {
  const C = __cc, W = C.world, issues = [];
  const add = (sev, kind, map, x, y, msg) => issues.push({ sev, kind, map, x, y, msg });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  C.dev.noWild = true; C.dev.speed = 4;
  // trainers won't stop you
  Object.keys(C.NPCS).forEach((k) => C.NPCS[k].forEach((n) => { if (n.seenFlag) C.state.flags[n.seenFlag] = true; }));
  const T = {}; Object.keys(C.TRIGGERS).forEach((k) => { T[k] = C.TRIGGERS[k]; C.TRIGGERS[k] = () => null; });
  const KEY = { top: 'up', bottom: 'down', left: 'left', right: 'right' };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const idle = () => !W.busy && C.stack.length === 1 && C.stack[0] === W;
  async function settle(ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < (ms || 3000)) {
      if (idle() && !W.moving) return true;
      if (C.stack.length > 1 && C.stack[C.stack.length - 1].name !== 'fade') { C.input.pressed.a = true; }
      await sleep(30);
    }
    return false;
  }
  async function hold(dir, until, ms) {
    const t0 = Date.now();
    C.input.held[dir] = true;
    while (Date.now() - t0 < (ms || 2500)) { if (until()) break; await sleep(10); }
    C.input.held[dir] = false;
    await settle();
    return until();
  }
  function folCheck(where) {
    const f = C.follower;
    if (f && f.on && W.solidAt(f.x, f.y)) add('medium', 'follower-on-solid', C.state.map, f.x, f.y, 'after ' + where + ' the follower stands on a solid tile');
  }
  let exitsTried = 0, doorsTried = 0;
  const DIR = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  for (const id of Object.keys(C.MAPS)) {
    const m = C.MAPS[id], w = m.rows[0].length, h = m.rows.length;
    for (const e of (m.exits || [])) {
      const sw = e.side === 'left' || e.side === 'right';
      const lo = sw ? e.y0 : e.x0, hi = sw ? e.y1 : e.x1;
      const starts = [];
      W.enter(id, 1, 1);
      for (let k = lo; k <= hi; k++) {
        const ex = e.side === 'left' ? 0 : e.side === 'right' ? w - 1 : k, ey = e.side === 'top' ? 0 : e.side === 'bottom' ? h - 1 : k;
        if (!W.solidAt(ex, ey) && (everyTile || !starts.length)) starts.push([ex, ey]);
      }
      for (const start of starts) {
      exitsTried++;
      W.enter(id, start[0], start[1], KEY[e.side]);
      await settle();
      const nx = start[0] + DIR[e.side][0], ny = start[1] + DIR[e.side][1];
      const want = [sw ? e.tx : e.fixedX ? e.tx0 : e.tx0 + (nx - e.x0), sw ? (e.fixedY ? e.ty0 : e.ty0 + (ny - e.y0)) : e.ty];
      const went = await hold(KEY[e.side], () => C.state.map !== id && W.mapId !== id);
      if (!went) { add('high', 'live-exit-failed', id, start[0], start[1], 'holding ' + KEY[e.side] + ' on the edge did not leave the map (to ' + e.to + ')'); continue; }
      if (C.state.x !== want[0] || C.state.y !== want[1]) add('low', 'live-landed-elsewhere', C.state.map, C.state.x, C.state.y, 'from ' + id + ' ' + start + ' expected ' + want);
      const s = C.state;
      if (s.map !== e.to) add('high', 'live-wrong-map', id, start[0], start[1], 'went to ' + s.map + ' instead of ' + e.to);
      // it may have walked on a tile after landing; compare the landing with where we are on the same line
      const landed = [s.x, s.y];
      if (W.solidAt(landed[0], landed[1])) add('high', 'live-landed-solid', s.map, landed[0], landed[1], 'from ' + id + ' ' + e.side);
      folCheck(id + ' -> ' + s.map);
      // step back
      const there = s.map;
      const back = await hold(OPP[KEY[e.side]], () => C.state.map !== there && W.mapId !== there, 3000);
      if (!back) add('low', 'live-no-step-back', there, s.x, s.y, 'came from ' + id + ' (' + e.side + '); holding ' + OPP[KEY[e.side]] + ' from the landing ' + landed + ' never left ' + there);
      else if (C.state.map !== id) add('medium', 'live-step-back-elsewhere', there, landed[0], landed[1], 'came from ' + id + ', stepping back went to ' + C.state.map);
      else folCheck(there + ' -> back to ' + id);
      }
    }
    // doors
    for (const b of (m.buildings || [])) {
      if (!b.door) continue;
      const target = b.id === 'spire-door' ? 'spire' : C.DOORS[b.id];
      if (!target) continue;
      W.enter(id, b.door[0], b.door[1] + 1, 'up');
      if (W.solidAt(b.door[0], b.door[1] + 1)) continue;
      doorsTried++;
      await settle();
      const went = await hold('up', () => W.mapId !== id, 2500);
      if (!went) { add('high', 'live-door-failed', id, b.door[0], b.door[1], 'walking up into ' + b.id + ' did not go in'); continue; }
      if (W.mapId !== target) add('high', 'live-door-wrong', id, b.door[0], b.door[1], b.id + ' went to ' + W.mapId + ' not ' + target);
      if (W.solidAt(C.state.x, C.state.y)) add('high', 'live-landed-solid', W.mapId, C.state.x, C.state.y, 'through door ' + b.id);
      folCheck('door ' + b.id);
      if (target === 'spire' || !C.MAPS[target].exits.length) continue;
      const inside = W.mapId;
      // walk out: down until the map changes (the mat may be off to the side: walk to it first)
      const mat = C.MAPS[inside].exits.find((e) => e.side === 'bottom');
      if (mat && C.state.x !== mat.x0 && C.state.x !== mat.x1) { W.enter(inside, mat.x0, C.MAPS[inside].rows.length - 2, 'down'); }
      const out = await hold('down', () => W.mapId !== inside, 3000);
      if (!out) { add('medium', 'live-room-no-exit', inside, C.state.x, C.state.y, 'walking down from ' + C.state.x + ',' + C.state.y + ' never left the room'); continue; }
      if (W.mapId !== id || C.state.x !== b.door[0] || C.state.y !== b.door[1] + 1) add('medium', 'live-room-exit-elsewhere', inside, C.state.x, C.state.y, 'leaving the room behind ' + id + ':' + b.id + ' put you at ' + W.mapId + ' ' + C.state.x + ',' + C.state.y + ' (door at ' + b.door + ')');
    }
  }
  Object.keys(T).forEach((k) => { C.TRIGGERS[k] = T[k]; });
  return { exitsTried, doorsTried, issues };
}
