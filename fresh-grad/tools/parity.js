#!/usr/bin/env node
/* Logic-parity check. Splits the game's <script> into top-level blocks (functions, consts, lets, `X.y = ...` assignments)
   and compares a new build against the baseline.

   node tools/parity.js <baseline.html> <new.html> [--show=NAME] [--all]

   - REMOVED: a top-level name that exists in the baseline but not in the new build. Must be empty (nothing is removed).
   - CHANGED: block text differs (full-line comments and blank lines are ignored). Each is labelled
       DRAW/UI   if the block touches canvas drawing or DOM presentation (expected to change), or
       LOGIC?    if it does not, i.e. it looks like game logic. Review every LOGIC? entry by hand.
   - ADDED: new top-level names. */
const fs = require('fs');
const [a, b] = process.argv.slice(2).filter(x => !x.startsWith('--'));
const flag = n => { const x = process.argv.find(v => v.startsWith('--' + n)); return x ? (x.split('=')[1] || true) : null; };

function script(file) {
  const t = fs.readFileSync(file, 'utf8');
  const i = t.indexOf('<script>'), j = t.lastIndexOf('</script>');
  return t.slice(i + 8, j);
}
function blocks(src) {
  const lines = src.split('\n'), map = new Map(), order = [];
  let cur = null, anon = 0, inCmt = false;
  const start = /^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)|^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*)\s*(?:=|\+=)|^(\(function|\(\(\)|\(async)/;
  for (const ln of lines) {
    const m = !inCmt && start.exec(ln);
    if (m) {
      let name = m[1] || m[2] || ('iife#' + (++anon));
      if (map.has(name)) { let k = 2; while (map.has(name + '#' + k)) k++; name += '#' + k; }
      cur = { name, text: [] }; map.set(name, cur); order.push(name);
    }
    if (cur) cur.text.push(ln);
    // crude multi-line comment tracking so a comment's text is never read as code
    const tr = ln.trim();
    if (tr.startsWith('/*') && !tr.includes('*/')) inCmt = true;
    else if (inCmt && tr.includes('*/')) inCmt = false;
  }
  const norm = t => t.filter(l => { const s = l.trim(); return s && !s.startsWith('//') && !(s.startsWith('/*') && s.endsWith('*/')); }).join('\n').replace(/[ \t]+$/gm, '');
  for (const k of order) map.get(k).norm = norm(map.get(k).text);
  return { map, order };
}
const DRAW = /\bc\.(fill|stroke|beginPath|arc|ellipse|moveTo|lineTo|drawImage|save|restore|translate|rotate|scale|createLinearGradient|createRadialGradient|fillRect|strokeRect|fillText|setTransform|clip|clearRect|quadraticCurveTo|bezierCurveTo|rect)\b|\bctx\.|\bg\.(fill|stroke|beginPath|arc)|\.style\b|createElement|innerHTML|textContent|classList|\.hidden\b|\.dataset\b|setProperty|appendChild|getContext|toast\(/;

const A = blocks(script(a)), B = blocks(script(b));
const removed = A.order.filter(k => !B.map.has(k));
const added = B.order.filter(k => !A.map.has(k));
const changed = A.order.filter(k => B.map.has(k) && A.map.get(k).norm !== B.map.get(k).norm);
const show = flag('show');
if (show && typeof show === 'string') {
  const x = A.map.get(show), y = B.map.get(show);
  require('fs').writeFileSync('/tmp/_p_a.txt', x ? x.norm : ''); require('fs').writeFileSync('/tmp/_p_b.txt', y ? y.norm : '');
  console.log(require('child_process').spawnSync('diff', ['-u', '/tmp/_p_a.txt', '/tmp/_p_b.txt'], { encoding: 'utf8' }).stdout);
  process.exit(0);
}
const lab = k => (DRAW.test(B.map.get(k).norm) || DRAW.test(A.map.get(k).norm)) ? 'DRAW/UI' : 'LOGIC?';
console.log(`baseline blocks: ${A.order.length}, new blocks: ${B.order.length}`);
console.log(`\nREMOVED (${removed.length}) ${removed.length ? '  <-- must be empty' : ''}`);
removed.forEach(k => console.log('  - ' + k));
const logic = changed.filter(k => lab(k) === 'LOGIC?');
console.log(`\nCHANGED: ${changed.length} total, ${logic.length} flagged LOGIC?`);
logic.forEach(k => {
  const x = A.map.get(k).norm.split('\n'), y = B.map.get(k).norm.split('\n');
  console.log(`  ! LOGIC?  ${k}  (${x.length} -> ${y.length} lines)`);
});
if (flag('all')) changed.filter(k => lab(k) === 'DRAW/UI').forEach(k => console.log('  ~ DRAW/UI ' + k));
console.log(`\nADDED: ${added.length}${flag('all') ? '' : '  (use --all to list)'}`);
if (flag('all')) added.forEach(k => console.log('  + ' + k));
process.exit(removed.length ? 3 : 0);
