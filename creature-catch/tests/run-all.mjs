// Runs every browser test against the built game and prints a line for each: PASS (it finished and saw no page errors)
// or FAIL. Logs and screenshots land in tests/out/. Read the logs too: most tests print what they checked.
//   node tests/run-all.mjs          every test (about 10 minutes)
//   node tests/run-all.mjs 06 10    only the tests whose names start with these
// Needs Playwright (installed globally here; NODE_PATH is set for you) and a built game (node tools/build.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = process.env.CC_TEST_OUT || path.join(HERE, 'out');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const env = { ...process.env, NODE_PATH: execSync('npm root -g').toString().trim(), CC_TEST_OUT: OUT };
// older builds whose saves must keep loading (09-old-save.cjs): the commit that built each one
const OLD = { v8: 'dba6a0d', v10: '3b01bf3' };

const runs = [];
for (const f of fs.readdirSync(HERE).filter((f) => /^\d\d-.*\.cjs$/.test(f)).sort()) {
  if (only.length && !only.some((o) => f.startsWith(o))) continue;
  if (f.startsWith('09-')) {
    for (const [v, commit] of Object.entries(OLD)) {
      const old = path.join(OUT, `old-${v}.html`);
      if (!fs.existsSync(old)) fs.writeFileSync(old, execSync(`git -C "${ROOT}" show ${commit}:creature-catch/creature-catch.html`, { maxBuffer: 64 << 20 }));
      runs.push({ name: `${f} (${v} save)`, file: f, args: [old], log: f.replace('.cjs', `-${v}.log`) });
    }
  } else runs.push({ name: f, file: f, args: [], log: f.replace('.cjs', '.log') });
}
let failed = 0;
for (const r of runs) {
  const t0 = Date.now();
  const res = spawnSync('node', [path.join(HERE, r.file), ...r.args], { cwd: ROOT, env, encoding: 'utf8', timeout: 15 * 60 * 1000 });
  const text = (res.stdout || '') + (res.stderr || '');
  fs.writeFileSync(path.join(OUT, r.log), text);
  const ok = res.status === 0 && /no errors/.test(text);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name}  ${((Date.now() - t0) / 1000).toFixed(0)}s  tests/out/${r.log}`);
}
console.log(failed ? `${failed} of ${runs.length} failed` : `all ${runs.length} passed`);
process.exit(failed ? 1 : 0);
