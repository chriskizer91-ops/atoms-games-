// Puts the built game and the Field Guide on the gh-pages branch, for GitHub Pages:
//   gh-pages: creature-catch/index.html (the game) and creature-catch/field-guide.html
// It only replaces the creature-catch/ folder of that branch (anything else there is kept), and it doesn't touch
// your checkout: it writes the files straight into a new commit. Build first, then push the branch yourself:
//   node tools/build.mjs && node tools/build-companion.mjs
//   node tools/publish-pages.mjs
//   git push origin gh-pages
// Once, on GitHub: Settings > Pages > Deploy from a branch > gh-pages, / (root). The game is then at
// https://<owner>.github.io/<repo>/creature-catch/ and the Field Guide at .../creature-catch/field-guide.html
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { SRC } from './load-data.mjs';

const ROOT = path.join(SRC, '..');
const BRANCH = 'gh-pages', DIR = 'creature-catch';
const FILES = { 'index.html': 'creature-catch.html', 'field-guide.html': 'companion/creature-catch-field-guide.html' };
const version = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const index = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-pages-')), 'index');
const git = (args, opts = {}) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, GIT_INDEX_FILE: index }, ...opts }).trim();
const has = (ref) => { try { git(['rev-parse', '--verify', '--quiet', ref]); return true; } catch { return false; } };

if (!fs.readFileSync(path.join(ROOT, FILES['index.html']), 'utf8').includes("VERSION: 'v" + version + "'")) {
  throw new Error(`creature-catch.html isn't built from VERSION ${version}: run node tools/build.mjs first`);
}
// start from the branch as it is (here, or on origin), so whatever else it holds stays
const parent = has(BRANCH) ? BRANCH : has('origin/' + BRANCH) ? 'origin/' + BRANCH : null;
if (parent) git(['read-tree', parent]); else git(['read-tree', '--empty']);
try { git(['rm', '--cached', '-r', '-q', '--ignore-unmatch', DIR]); } catch { /* nothing there yet */ }
for (const [as, src] of Object.entries(FILES)) {
  const blob = git(['hash-object', '-w', path.join(ROOT, src)]);
  git(['update-index', '--add', '--cacheinfo', `100644,${blob},${DIR}/${as}`]);
}
const tree = git(['write-tree']);
if (parent && git(['rev-parse', parent + '^{tree}']) === tree) { console.log(`${BRANCH} already has Creature Catch v${version}; nothing to do.`); process.exit(0); }
const commit = git(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', `Creature Catch v${version} on GitHub Pages`]);
git(['update-ref', 'refs/heads/' + BRANCH, commit]);
console.log(`${BRANCH}: Creature Catch v${version} (${commit.slice(0, 7)}). Next: git push origin ${BRANCH}`);
