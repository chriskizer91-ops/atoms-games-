/* ============================ graduation cutscene ============================
   Controller + timeline. The picture is shot by a virtual camera over a layered, pre-baked set:
     34b-cinematic.js   camera path, render loop, DOM grade / vignette / grain / bars / flash, optional illustrated stills
     34c-cinbackdrop.js sky, sun, clouds, hills, campus with a clock tower, oaks, lamp-posts (baked once, parallax layers)
     34d-cinstage.js    the stage set: curtains, valance, banner, plank floor, podium, flowers, bunting
     34e-cincrowd.js    audience tiers, balloons, foreground heads
     34f-cincast.js     figure rig for the Graduate, Dean and classmates (IK arms, faces, hair, mortarboard, tassel pendulum)
     34f2-cinactors.js  who is where and doing what at time ct, diploma and handshake choreography
     34g-cinfx.js       diploma, mortarboards, confetti, spot beams, dust, flashes, lens flare, the two black cards
     34h-cinaudio.js    score, crowd and foley built on SFX.ctx
     34i-cinart.js      optional plates / poses from assets/ (silent no-ops when the files are missing)
     34j-cindegree.js   degree picker helpers (emblems, deckle, optional diploma art)
   drawCutScene(ct) is a pure function of ct (seeded RNG only), so jumping CUT.t or skipping at any time is safe. */
const CUT = { t: 0, cv: null, c: null, hats: [], conf: [], seeded: false, ended: false };
const CUT_END = 19.6;
const CUT_CAPS = [
  [0.7, 3.4, 'Narrator', 'Commencement day. Four years of lectures, group projects and cheap coffee.'],
  [3.7, 6.3, 'Announcer', 'And now, our final graduate of the day!'],
  [7.0, 9.7, 'Dean', 'Congratulations. Go do something wonderful.'],
  [9.9, 12.2, 'Narrator', 'A diploma. Heavy paper, a gold seal and no idea what happens next.'],
  [12.4, 15.0, 'Everyone', 'Hats in the air!']
];
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

/* Optional illustrated stills (IMAGE_PROMPTS.md P01). Each cross-fades in over the procedural scene during its window with a
   slow Ken-Burns move: z0 -> z1 zoom, (fx0, fy0) -> (fx1, fy1) focus as fractions of the picture (the focus is what a tall phone
   screen keeps, so it sits on the subject). mem = faded "memory" grade; fx = live layer drawn over the still ('dust' warm motes,
   'conf' confetti). A still dissolves straight into the next one, and holds over a short missing successor (see cinStillPlan);
   any other gap, or a missing file, leaves the procedural shot playing unchanged. */
const CUT_SHOTS = [
  { k: 'cutscene/still-01-quad', a: 0.0, b: 1.4, z0: 1.0, z1: 1.09, fx0: 0.56, fy0: 0.55, fx1: 0.6, fy1: 0.5 },
  { k: 'cutscene/still-02a-lecture', a: 1.25, b: 1.9, z0: 1.0, z1: 1.07, fx0: 0.2, fy0: 0.5, fx1: 0.26, fy1: 0.5, mem: 1, fx: 'dust' },
  { k: 'cutscene/still-02b-group', a: 1.8, b: 2.45, z0: 1.07, z1: 1.0, fx0: 0.55, fy0: 0.5, fx1: 0.45, fy1: 0.5, mem: 1 },
  { k: 'cutscene/still-02c-coffee', a: 2.35, b: 3.0, z0: 1.0, z1: 1.08, fx0: 0.36, fy0: 0.45, fx1: 0.36, fy1: 0.55, mem: 1 },
  { k: 'cutscene/still-02d-allnighter', a: 2.9, b: 3.55, z0: 1.06, z1: 1.0, fx0: 0.56, fy0: 0.55, fx1: 0.5, fy1: 0.5, mem: 1 },
  { k: 'cutscene/still-03-wings', a: 3.5, b: 5.0, z0: 1.0, z1: 1.1, fx0: 0.3, fy0: 0.5, fx1: 0.6, fy1: 0.48, fx: 'dust' },
  { k: 'cutscene/still-04-walk', a: 4.85, b: 6.45, z0: 1.0, z1: 1.1, fx0: 0.44, fy0: 0.52, fx1: 0.64, fy1: 0.5, fx: 'dust' },
  { k: 'cutscene/still-05-handshake', a: 6.5, b: 9.5, z0: 1.0, z1: 1.12, fx0: 0.5, fy0: 0.5, fx1: 0.5, fy1: 0.46, fx: 'dust' },
  { k: 'cutscene/still-06-diploma', a: 9.5, b: 12.0, z0: 1.12, z1: 1.0, fx0: 0.52, fy0: 0.5, fx1: 0.5, fy1: 0.5, fx: 'dust' },
  { k: 'cutscene/still-07-hats', a: 11.9, b: 13.85, z0: 1.0, z1: 1.1, fx0: 0.5, fy0: 0.6, fx1: 0.5, fy1: 0.45, fx: 'conf' },
  { k: 'cutscene/still-08-face', a: 13.75, b: 15.3, z0: 1.0, z1: 1.08, fx0: 0.5, fy0: 0.45, fx1: 0.5, fy1: 0.45, fx: 'conf' },
  { k: 'cutscene/still-09-sunset', a: 15.3, b: 19.7, z0: 1.0, z1: 1.12, fx0: 0.5, fy0: 0.55, fx1: 0.5, fy1: 0.5, card: 1 }
];

/* the compat names the rest of the game (and older tests) know */
function drawGrad(c, x, y, s, o) { return cinFigure(c, x, y, s, o); }
function drawDiploma(c, x, y, ang) { cinDiploma(c, x, y, ang, 1, 0); }

/* seeds the particle arrays once per run; everything is deterministic so CUT.t can be scrubbed */
function cutSeed() {
  CUT.hats = cinMakeHats();
  CUT.conf = cinMakeConfetti();
  CUT.seeded = true;
}

function drawCutScene(ct) {
  const cv = CUT.cv, c = CUT.c;
  if (!cv || !c) return;
  cinRender(c, cv, ct);
}

let cutRaf = 0, cutLast = 0, cutCardStage = 0;
function startCutscene() {
  SFX.init();
  G.mode = 'cut';
  $('#title').hidden = true; $('#cut').hidden = false; $('#degree').hidden = true; $('#game').hidden = true;
  CUT.cv = $('#cutCanvas'); CUT.c = CUT.cv.getContext('2d');
  CUT.t = 0; CUT.ended = false; cutCardStage = 0;
  $('#cutCard').hidden = true; $('#cutCard p').className = ''; $('#cutCard').className = '';
  $('#cutCap').style.opacity = 0;
  $('#cut').classList.remove('cards');
  cinBuild();
  cutSeed();
  cinAudioStart();
  cutLast = performance.now();
}
function cutUpdate(dt) {
  if (CUT.ended) return;
  const prev = CUT.t;
  CUT.t += dt;
  const ct = CUT.t;
  drawCutScene(ct);
  cinAudioTick(prev, ct);
  if (ct > 10.2 && ct < 16) SFX.applause(true); else if (ct >= 16) SFX.applause(false);
  // captions with a typewriter effect
  let cap = null;
  for (const cc of CUT_CAPS) if (ct >= cc[0] && ct < cc[1]) cap = cc;
  const box = $('#cutCap');
  if (cap) {
    box.style.opacity = 1;
    const n = Math.floor((ct - cap[0]) * 38);
    box.querySelector('b').textContent = cap[2];
    box.querySelector('span').textContent = cap[3].slice(0, n);
    box.classList.toggle('typing', n < cap[3].length);
    box.dataset.who = cap[2].toLowerCase();
  } else { box.style.opacity = 0; box.classList.remove('typing'); }
  // black title card
  const card = $('#cutCard'), p = card.querySelector('p');
  if (ct > 15.4 && cutCardStage === 0) { cutCardStage = 1; card.hidden = false; $('#cut').classList.add('cards'); p.textContent = 'Diploma in hand.'; requestAnimationFrame(() => p.classList.add('on')); }
  if (ct > 17.4 && cutCardStage === 1) { cutCardStage = 2; p.classList.remove('on'); setTimeout(() => { p.textContent = 'Now, what does it say?'; p.classList.add('on'); }, 500); }
  if (ct > CUT_END) finishCut();
}
function finishCut() {
  if (CUT.ended) return;
  CUT.ended = true;
  SFX.applause(false);
  cinAudioStop();
  $('#cut').hidden = true;
  $('#cut').classList.remove('cards');
  $('#cutCard').hidden = true;
  showDegreeScreen();
}
