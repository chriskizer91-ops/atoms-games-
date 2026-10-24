// Shared paths for the browser tests: the built game, the Field Guide, and where screenshots and logs go
// (tests/out, which git ignores).
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.CC_TEST_OUT || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

module.exports = {
  ROOT, OUT,
  GAME: 'file://' + path.join(ROOT, 'creature-catch.html'),
  GUIDE: 'file://' + path.join(ROOT, 'companion', 'creature-catch-field-guide.html'),
  shotPath: (name) => path.join(OUT, name),
};
