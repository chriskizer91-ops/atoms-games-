// One-off: cut the original single-file game into source modules, at its own section headers.
// Re-running this reproduces v2-visual-upgrade/src from v1-original (it overwrites). Do not run after editing src.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'v1-original/Fresh_Grad_Seasons.html'), 'utf8').split('\n');
const src = path.join(root, 'v2-visual-upgrade/src');
const take = (a, b) => lines.slice(a - 1, b).join('\n') + '\n';
const parts = [
  ['head.html', 1, 6],
  ['css/00-base.css', 7, 43], ['css/01-title.css', 44, 59], ['css/02-cutscene-degree.css', 60, 107],
  ['css/03-hud.css', 108, 191], ['css/04-overlays.css', 192, 233], ['css/05-dream.css', 234, 249],
  ['css/06-toasts.css', 250, 260], ['css/07-jobs.css', 261, 501], ['css/08-scenes.css', 502, 524],
  ['css/09-menu-passport.css', 525, 553], ['css/10-phone-level-recap.css', 554, 660],
  ['css/11-fishing.css', 661, 676], ['css/12-misc.css', 677, 694],
  ['mid.html', 695, 696], ['body.html', 697, 900], ['script-open.html', 901, 902],
  ['js/01-core-sim.js', 903, 1330], ['js/02-city-layout.js', 1331, 1497], ['js/03-gfx-helpers.js', 1498, 1739],
  ['js/04-buildings.js', 1740, 1993], ['js/05-people-draw.js', 1994, 2064], ['js/06-filler-street.js', 2065, 2222],
  ['js/07-npcs-traffic.js', 2223, 2429], ['js/08-camera-sky.js', 2430, 2622], ['js/09-ground.js', 2623, 2843],
  ['js/10-props.js', 2844, 2882], ['js/10b-lighting-fx.js', 2883, 3172], ['js/11-title-scene.js', 3173, 3205], ['js/12-player-input.js', 3206, 3400],
  ['js/13-hud-panels.js', 3401, 3726], ['js/14-school.js', 3727, 4108], ['js/15-activities-core.js', 4109, 4295],
  ['js/16-jobgames.js', 4296, 5051], ['js/17-school-draw.js', 5052, 5229], ['js/18-dreams.js', 5230, 5468],
  ['js/19-talk-people.js', 5469, 5749], ['js/20-interior-core.js', 5750, 5795], ['js/21-furniture.js', 5796, 6047],
  ['js/22-interior-render.js', 6048, 6438], ['js/23-town-life.js', 6439, 6642], ['js/23b-player-bike.js', 6643, 6680], ['js/24-scenes.js', 6681, 6922],
  ['js/25-menu-passport.js', 6923, 6975], ['js/26-shop-fronts.js', 6976, 7111], ['js/27-furniture-extra.js', 7112, 7375],
  ['js/28-shop-rooms.js', 7376, 8178], ['js/29-progression-phone.js', 8179, 8657], ['js/30-seasons.js', 8658, 8784], ['js/30b-weather-particles.js', 8785, 9028],
  ['js/31-activities-extra.js', 9029, 9538], ['js/32-workplaces.js', 9539, 9624], ['js/33-pathfinding-map.js', 9625, 9783],
  ['js/34-cutscene.js', 9784, 10022], ['js/35-degree-flow-boot.js', 10023, 10226],
  ['tail.html', 10227, lines.length]
];
// the last chunk: a trailing empty element after the final newline must not add an extra line
let tailTxt = lines.slice(10227 - 1).join('\n');
parts.forEach(([f, a, b]) => {
  const p = path.join(src, f); fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, f === 'tail.html' ? tailTxt : take(a, b));
});
console.log('wrote', parts.length, 'files');
