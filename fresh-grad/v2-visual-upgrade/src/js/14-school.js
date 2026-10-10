/* ============================ school (the teacher's workplace) ============================ */
const SCH_W = 2200, SCH_H = 1160;
const LESSONS = [
  { n: 'Lesson 1', s: 8 * 60, e: 9 * 60 + 30, max: 3 },
  { n: 'Lesson 2', s: 9 * 60 + 45, e: 11 * 60 + 15, max: 3 },
  { n: 'Lesson 3', s: 13 * 60, e: 14 * 60 + 30, max: 3 },
  { n: 'Lesson 4', s: 14 * 60 + 45, e: 15 * 60 + 45, max: 2 }
];
const LUNCH = { s: 11 * 60 + 30, e: 12 * 60 + 15, eatEnd: 12 * 60 + 10 };
const DISMISS_AT = 15 * 60 + 45;
function newSch() {
  return { kids: 'away', lessons: [false, false, false, false], lunchSeated: false, lunchDone: false, lunchMissed: false, hallPaid: false, planPaid: false, dismissed: false, talked: {}, tip: 0, done: 0, mood: 60, lib: false };
}

/* geometry: five rooms along the north, a long hallway, then four rooms along the south */
const SCH = {
  hallTop: 440, hallBot: 640, topY: 60, botY: 1110,
  northGaps: [[260, 360], [754, 854], [1154, 1254], [1534, 1634], [1924, 2024]],
  southGaps: [[190, 290], [534, 634], [968, 1128], [1708, 1848]],
  northSeps: [[580, 608], [1000, 1028], [1380, 1408], [1760, 1788]],
  southSeps: [[440, 468], [700, 728], [1368, 1396]],
  northRooms: { class: [40, 580], class4: [608, 1000], library: [1028, 1380], lounge: [1408, 1760], office: [1788, 2160] },
  southRooms: { lobby: [40, 440], nurse: [468, 700], cafe: [728, 1368], gym: [1396, 2160] }
};
function wallSegs(gaps, y, x0, x1, th) {
  const out = []; let a = x0;
  gaps.forEach(g => { out.push([a, y, g[0] - a, th]); a = g[1]; });
  out.push([a, y, x1 - a, th]);
  return out;
}
const SCH_RECTS = [];
wallSegs(SCH.northGaps, 420, 40, 2160, 20).forEach(r => SCH_RECTS.push(r));
wallSegs(SCH.southGaps, 640, 40, 2160, 20).forEach(r => SCH_RECTS.push(r));
SCH.northSeps.forEach(s => SCH_RECTS.push([s[0], 30, s[1] - s[0], 410]));
SCH.southSeps.forEach(s => SCH_RECTS.push([s[0], 640, s[1] - s[0], 480]));
/* lockers line the hallway walls between the doorways, never in front of a door */
const LOCKERS_N = [[48, 246], [374, 540], [620, 740], [868, 1140], [1268, 1520], [1648, 1910], [2038, 2152]];
const LOCKERS_S = [[48, 176], [304, 520], [648, 954], [1142, 1694], [1862, 2152]];
LOCKERS_N.forEach(l => SCH_RECTS.push([l[0], 440, l[1] - l[0], 46]));
LOCKERS_S.forEach(l => SCH_RECTS.push([l[0], 594, l[1] - l[0], 46]));
SCH_RECTS.push([550, 440, 60, 46]); // water fountain on the hall wall
/* furniture */
const DESK3_COLS = [100, 185, 435, 520], DESK3_ROWS = [230, 290, 350];
DESK3_ROWS.forEach(cy => DESK3_COLS.forEach(cx => SCH_RECTS.push([cx - 23, cy - 12, 46, 24])));
const DESK4_COLS = [650, 735, 880, 965], DESK4_ROWS = [260, 330];
DESK4_ROWS.forEach(cy => DESK4_COLS.forEach(cx => SCH_RECTS.push([cx - 23, cy - 12, 46, 24])));
[
  [292, 150, 36, 24],                 // lectern
  [56, 100, 96, 28],                  // teacher desk, room 3
  [650, 100, 96, 28],                 // teacher desk, room 4
  [1048, 98, 100, 44], [1156, 98, 100, 44], [1264, 98, 100, 44], // library shelves
  [1040, 190, 36, 150], [1332, 190, 36, 150],
  [1120, 260, 92, 64], [1240, 260, 92, 64], // reading tables
  [1040, 372, 100, 34],               // librarian desk
  [1428, 98, 120, 40], [1700, 98, 36, 34], [1560, 98, 100, 34], // lounge sofa, coffee, counter
  [1520, 240, 130, 48],               // lounge table
  [1428, 300, 50, 60],                // copier
  [1900, 150, 150, 50], [1808, 100, 100, 40], [2060, 100, 90, 44], // principal's office
  [490, 720, 70, 100], [580, 720, 70, 100], [570, 950, 110, 40], // nurse
  [740, 690, 240, 36], [1160, 672, 180, 44], // serving counter, kitchen
  [840, 800, 114, 30], [1000, 800, 114, 30], [840, 930, 114, 30], [1000, 930, 114, 30], // student tables
  [1210, 790, 110, 30],               // staff table
  [60, 720, 150, 40], [330, 672, 100, 44], [60, 980, 120, 28], // lobby desk, trophy case, bench
  [1410, 720, 14, 120], [2130, 720, 14, 120], // gym backboards
  [1410, 960, 120, 28],               // gym bench
  [48, 380, 30, 32], [540, 380, 30, 32], [1730, 360, 30, 32], [2110, 360, 30, 32], [660, 1060, 30, 32], [1330, 1060, 30, 32], [380, 1060, 30, 32] // plants
].forEach(r => SCH_RECTS.push(r));
function solidSchool(x, y) {
  if (x < 48 || x > 2152 || y < 112 || y > 1096) return true;
  for (let i = 0; i < SCH_RECTS.length; i++) { const r = SCH_RECTS[i]; if (x + 8 > r[0] && x - 8 < r[0] + r[2] && y + 3 > r[1] && y - 3 < r[1] + r[3]) return true; }
  return false;
}

const CLASS_SEATS = [], CAFE_SEATS = [];
for (let i = 0; i < 10; i++) { const cx = DESK3_COLS[i % 4], cy = DESK3_ROWS[Math.floor(i / 4)]; CLASS_SEATS.push({ x: cx, y: cy + 30 }); }
[[897, 815, [[-30, -30], [30, -30], [0, 42]]], [1057, 815, [[-30, -30], [30, -30], [0, 42]]], [897, 945, [[-30, -30], [30, 42]]], [1057, 945, [[-30, -30], [30, 42]]]]
  .forEach(t => t[2].forEach(o => CAFE_SEATS.push({ x: t[0] + o[0], y: t[1] + o[1] })));
const SCH_EXIT = { x: 240, y: 1090 }, SCH_CLASS_DOOR = { x: 310, y: 430 };

const KID_NAMES = ['Mia', 'Noah', 'Ava', 'Leo', 'Zoe', 'Eli', 'Ruby', 'Max', 'Ivy', 'Sam'];
const KIDS = KID_NAMES.map((name, i) => Object.assign({ name, x: 310, y: 430, moving: false, phase: i, face: 1 }, NPC_LOOK[i % NPC_LOOK.length], { shirt: ['#ff8fa3', '#74c0fc', '#ffd43b', '#8ce99a', '#b197fc', '#ffa94d', '#63e6be', '#ff6b6b', '#4dabf7', '#f783ac'][i] }));
/* Ms. Park's own second graders, just for atmosphere */
const PARK_KIDS = [];
DESK4_ROWS.forEach((cy, r) => DESK4_COLS.forEach((cx, c) => PARK_KIDS.push(Object.assign({ x: cx, y: cy + 30, face: 1, phase: r * 4 + c, moving: false }, NPC_LOOK[(r * 4 + c + 3) % NPC_LOOK.length], { shirt: ['#f08080', '#7fc8f8', '#ffe066', '#95e0a8', '#c8b6ff', '#ffb870', '#7be8d0', '#ff8e8e'][r * 4 + c] }))));
const TEACHERS = [
  { id: 'park', name: 'Ms. Park', role: 'Second grade teacher', x: 804, y: 205, look: NPC_LOOK[1],
    greet: ['Morning! Third graders, brave soul. How is it going so far?', 'Do not let the glitter project scare you. It scares all of us.', 'Shh, my class is reading. Come say hi anytime though.'],
    replies: [['"The kids are a lot, but I like them."', 'That is the right attitude. The ones who wear you out are the ones who remember you.'], ['"Honestly, I need coffee."', 'Say no more. The pot is fresh in the lounge. Here, take mine.'], ['"Any advice for rowdy afternoons?"', 'Movement breaks. Five minutes of stretching saves thirty of whispering.']],
    perk: { text: 'Ms. Park shares her coffee. Energy +10.', go() { S.energy = clamp(S.energy + 10, 0, 100); } } },
  { id: 'alvarez', name: 'Mr. Alvarez', role: 'PE teacher', x: 1560, y: 790, look: NPC_LOOK[4],
    greet: ['Hey, new teacher! Are you drinking water? Teachers always forget.', 'My fourth graders ran the mile in under ten minutes. I am unbearable about it.', 'Want to trade recess duty on Thursday?'],
    replies: [['"Thanks for the reminder."', 'Anytime. Water is half the job.'], ['"Any tips for keeping them engaged?"', 'Get them moving first. A two minute game before the lesson and they sit still for twenty. Try it.'], ['"Recess duty? I will pass."', 'Ha! Worth a shot.']],
    perk: { text: 'Mr. Alvarez shows you a warm-up game. Your next lesson starts with +8 engagement.', go() { S.sch.tip = 8; } } },
  { id: 'okafor', name: 'Mrs. Okafor', role: 'Cafeteria manager', x: 860, y: 686, look: NPC_LOOK[2],
    greet: ['There is my favorite teacher. Eating enough?', 'Tater tots today. The kids will lose their minds.', 'I know every child\'s allergies by heart. Ask me anything.'],
    replies: [['"Starving, honestly."', 'Here, take a cookie. Do not tell the principal.'], ['"The tots smell great."', 'Extra crispy. Just for you.'], ['"How do you keep them calm in line?"', 'Eye contact and a ladle. Works every time.']],
    perk: { text: 'Mrs. Okafor slips you a cookie. Hunger +8.', go() { S.hunger = clamp(S.hunger + 8, 0, 100); } } },
  { id: 'dawson', sy: 224, name: 'Principal Dawson', role: 'Principal', x: 1975, y: 140, look: NPC_LOOK[3],
    greet: ['Good to see you. Parents have been saying nice things.', 'Keep an eye on the clock. Lunch is a tight schedule.', 'How are the lessons going?'],
    replies: [['"Thank you. I am enjoying it."', 'Glad to hear it. Keep it up.'], ['"Any feedback for me?"', 'Be consistent and be kind. Kids notice both.'], ['"I could use a supply budget."', 'Fill out the form. I will do what I can.']],
    perk: { text: 'Principal Dawson thanks you for a good day so far. +$10.', needs: () => S.sch.done >= 2, go() { S.money += 10; S.stats.earned += 10; } } },
  { id: 'kim', name: 'Mr. Kim', role: 'Music teacher', x: 1470, y: 190, look: NPC_LOOK[8],
    greet: ['Do you hear that? That is the third graders learning scales. Sort of.', 'The recorder unit starts Monday. Bring earplugs.', 'A little music in the day makes everything easier.'],
    replies: [['"Sounds lively."', 'It is organized chaos. The best kind.'], ['"Do you play anything?"', 'Everything with strings, mostly. And I hum when I am nervous.'], ['"How do you get kids to focus?"', 'Rhythm. If they are clapping, they are not talking.']],
    perk: { text: 'Mr. Kim hums you a calming tune. Energy +6.', go() { S.energy = clamp(S.energy + 6, 0, 100); } } },
  { id: 'reed', name: 'Nurse Reed', role: 'School nurse', x: 625, y: 944, look: NPC_LOOK[11],
    greet: ['Band-aids, ice packs, and a lot of listening. That is my day.', 'Most visits are "my tummy hurts" right before a test.', 'Stay hydrated. Teachers are my second most frequent patients.'],
    replies: [['"Busy week?"', 'Always. But I love the kids.'], ['"Do you have any advice for staying healthy?"', 'Sleep, water, lunch. You hear that every day, and it is true every day.'], ['"I am a little tired."', 'There is a cot behind you if you need a ten-minute rest.']],
    perk: { text: 'Nurse Reed hands you a cold electrolyte drink. Thirst +10.', go() { S.thirst = clamp(S.thirst + 10, 0, 100); } } },
  { id: 'lin', name: 'Ms. Lin', role: 'Librarian', x: 1090, y: 366, look: NPC_LOOK[9],
    greet: ['Shh. Just kidding. Come in.', 'I have a book for every student, and a few for the teachers.', 'The picture books on the second shelf are the real masterpieces.'],
    replies: [['"Any book ideas for a lesson?"', 'Try a story with a surprise at the end. They sit still for a good twist.'], ['"I love the quiet in here."', 'Me too. It is the best-kept secret in the building.'], ['"How do you pick books?"', 'By how it feels to hold them. Seriously.']],
    perk: { text: 'Ms. Lin recommends a story that will land well. Your next lesson starts with +6 engagement.', go() { S.sch.tip = Math.min(14, S.sch.tip + 6); } } }
];
const SCH_SPOTS = [
  { id: 'lectern', x: 310, y: 188, r: 48, prompt: () => 'Teach at the lectern' },
  { id: 'classDoor', x: SCH_CLASS_DOOR.x, y: 400, r: 46, prompt: () => 'Classroom door' },
  { id: 'cafeDoor', x: 1048, y: 706, r: 52, prompt: () => 'Cafeteria entrance' },
  { id: 'staffTable', x: 1265, y: 838, r: 50, prompt: () => 'Eat at the staff table' },
  { id: 'loungeTable', x: 1585, y: 304, r: 52, prompt: () => 'Eat at the lounge table' },
  { id: 'coffee', x: 1718, y: 142, r: 44, prompt: () => 'Use the coffee machine' },
  { id: 'fountain', x: 580, y: 508, r: 44, prompt: () => 'Drink from the fountain' },
  { id: 'library', x: 1204, y: 210, r: 70, prompt: () => 'Browse the library' },
  { id: 'hoops', x: 1778, y: 800, r: 80, prompt: () => 'Shoot some hoops' },
  { id: 'cot', x: 560, y: 842, r: 56, prompt: () => 'Rest on a cot' },
  { id: 'board', x: 1862, y: 168, r: 54, prompt: () => 'Read the staff board' },
  { id: 'exit', x: SCH_EXIT.x, y: SCH_EXIT.y, r: 56, prompt: () => 'Leave the school' }
].concat(TEACHERS.map(t => ({ id: 'talk-' + t.id, x: t.x, y: t.sy || t.y + 28, r: 56, prompt: () => 'Talk to ' + t.name })));
function schoolNear() {
  let best = null, bd = 1e9;
  for (const s of SCH_SPOTS) { const d = Math.hypot(S.px - s.x, S.py - s.y); if (d < s.r && d < bd) { bd = d; best = s; } }
  return best;
}

/* ============================ entering and leaving ============================ */
function trailReset() { G.trail = []; }
function enterSchool() {
  stampPlace('work');
  S.townX = S.px; S.townY = S.py;
  S.scene = 'school'; S.px = SCH_EXIT.x; S.py = 1076; S.face = 1;
  G.target = null; G.autoEnter = null; G.near = null; G.pathQ = []; CAM.ready = false; trailReset();
  $('#prompt').hidden = true;
  placeKids();
  toast('You step into ' + job().employer + '.', '');
}
function leaveSchool() {
  const sc = S.sch;
  if (sc.kids === 'follow') { sc.kids = 'class'; toast('You send the class back to their seats before leaving.', 'warn'); }
  S.scene = 'town'; S.px = DOORS.work.x; S.py = DOORS.work.y + 12;
  G.target = null; G.autoEnter = null; G.near = null; G.pathQ = []; CAM.ready = false; G.lesson = null;
  $('#prompt').hidden = true;
}
function placeKids() {
  const sc = S.sch;
  KIDS.forEach((k, i) => {
    const p = sc.kids === 'cafe' ? CAFE_SEATS[i] : sc.kids === 'follow' ? { x: S.px - 20, y: S.py + 10 + i * 6 } : CLASS_SEATS[i];
    k.x = p.x; k.y = p.y; k.path = null; k.pk = '';
  });
}
function trailUpdate() {
  const T = G.trail || (G.trail = []);
  const l = T[T.length - 1];
  if (!l || Math.hypot(l.x - S.px, l.y - S.py) > 5) { T.push({ x: S.px, y: S.py }); if (T.length > 420) T.shift(); }
}
/* kids walk through the doors along a real route */
function kidWalk(k, tx, ty, sp, dt) {
  const key = Math.round(tx) + ',' + Math.round(ty);
  if (k.pk !== key || !k.path) { k.pk = key; k.path = findPath(k.x, k.y, tx, ty, 'school') || [{ x: tx, y: ty }]; }
  let wp = k.path[0];
  if (!wp) { k.moving = false; return; }
  let dx = wp.x - k.x, dy = wp.y - k.y, d = Math.hypot(dx, dy);
  if (d < 2.5) { k.path.shift(); wp = k.path[0]; if (!wp) { k.moving = false; return; } dx = wp.x - k.x; dy = wp.y - k.y; d = Math.hypot(dx, dy); }
  const st = Math.min(d, sp * dt);
  k.x += dx / d * st; k.y += dy / d * st; k.moving = true; k.phase += dt * 10; if (Math.abs(dx) > 1) k.face = dx > 0 ? 1 : -1;
}
function updateKids(dt) {
  const sc = S.sch;
  if (!sc || sc.kids === 'away') return;
  const T = G.trail || [];
  KIDS.forEach((k, i) => {
    if (sc.kids === 'follow') {
      const idx = T.length - 1 - (i + 1) * 5, p = idx >= 0 ? T[idx] : { x: S.px, y: S.py + 10 };
      const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy);
      if (d > 2) { const st = Math.min(d, 165 * dt); k.x += dx / d * st; k.y += dy / d * st; k.moving = true; k.phase += dt * 10; if (Math.abs(dx) > 1) k.face = dx > 0 ? 1 : -1; } else k.moving = false;
      k.pk = ''; k.path = null;
    } else if (sc.kids === 'class') kidWalk(k, CLASS_SEATS[i].x, CLASS_SEATS[i].y, 120, dt);
    else if (sc.kids === 'cafe') kidWalk(k, CAFE_SEATS[i].x, CAFE_SEATS[i].y, 120, dt);
    else if (sc.kids === 'leave') kidWalk(k, SCH_EXIT.x + (i % 5 - 2) * 8, SCH_EXIT.y - 14 - Math.floor(i / 5) * 10, 135, dt);
  });
  if (sc.kids === 'leave' && KIDS.every(k => Math.hypot(k.x - SCH_EXIT.x, k.y - SCH_EXIT.y) < 50)) sc.kids = 'away';
}

/* ============================ schedule events (run every game minute) ============================ */
function paySchool(hours, label) {
  const amt = Math.round(curRate() * hours * payMult() * 100) / 100;
  S.money = Math.round((S.money + amt) * 100) / 100; S.stats.earned += amt;
  toast(label + ': +' + fmt(amt), 'good'); SFX.chime('pay');
}
function schoolMinute() {
  const sc = S.sch;
  if (!sc || !isWorkday(S.day)) return;
  const t = S.t, inS = S.scene === 'school';
  if (t === 7 * 60 + 55 && sc.kids === 'away' && !sc.dismissed) {
    sc.kids = 'class';
    if (inS) KIDS.forEach(k => { k.x = SCH_CLASS_DOOR.x + (Math.random() - 0.5) * 40; k.y = SCH_CLASS_DOOR.y; k.path = null; k.pk = ''; });
    else toast('The students are arriving at ' + job().employer + '.', '');
  }
  if (t === 9 * 60 + 45 && inS && !sc.hallPaid) { sc.hallPaid = true; paySchool(0.25, 'Hallway duty'); }
  if (t === LUNCH.e && sc.kids === 'class' && !sc.lunchSeated && !sc.lunchMissed) { sc.lunchMissed = true; toast('Lunch is over and your class never ate. The principal will hear about this.', 'bad'); }
  if (t === 13 * 60 && inS && !sc.planPaid) { sc.planPaid = true; paySchool(0.75, 'Planning period'); }
  if (t === 13 * 60 && sc.kids === 'cafe') toast('Your class is still in the cafeteria. Bring them back for Lesson 3.', 'warn');
  if (t === DISMISS_AT && sc.kids === 'class' && !sc.dismissed) toast('The final bell rang. Dismiss your class at the lectern.', '');
}
function currentLesson() {
  const sc = S.sch;
  for (let i = 0; i < LESSONS.length; i++) { const L = LESSONS[i]; if (!sc.lessons[i] && S.t >= L.s - 10 && S.t <= L.e - 30) return i; }
  return -1;
}
function schoolGoal() {
  const sc = S.sch, t = S.t;
  if (!sc) return '';
  if (sc.dismissed) return 'The school day is done. Head home and rest.';
  if (S.scene !== 'school') return t < 7 * 60 + 30 ? 'Head to ' + job().employer + '. The first bell is at 8 AM.' : t < DISMISS_AT ? 'Your class is waiting at ' + job().employer + '.' : 'Head to the school to dismiss your class.';
  if (G.lesson) return 'Teaching ' + G.lesson.subj + '. Choose how to handle each moment.';
  if (sc.kids === 'follow') return sc.lunchSeated ? 'Lead the class back to your classroom door.' : 'Lead the class to the cafeteria entrance.';
  if (sc.kids === 'class' && t >= LUNCH.s - 5 && t < LUNCH.e && !sc.lunchSeated && !sc.lunchMissed) return 'Lunch time. Line the class up at the classroom door.';
  if (sc.kids === 'cafe') return t < LUNCH.eatEnd ? 'The kids are eating. Have lunch at the staff table here in the cafeteria, or at the lounge table, then bring them back.' : 'Lunch is wrapping up. Bring the class back to the classroom.';
  if (period(t) === 'l' && !S.meals.l && sc.kids === 'class' && (sc.lunchDone || sc.lunchMissed)) return 'Lunch break. Eat at the lounge table in the teachers lounge, or at the staff table in the cafeteria.';
  const li = currentLesson();
  if (li >= 0 && sc.kids === 'class') return 'Time for ' + LESSONS[li].n + '. Teach at the lectern.';
  if (t >= DISMISS_AT) return 'Final bell. Dismiss your class at the lectern.';
  return 'Free minutes. Chat with the other teachers, grab coffee, or get ready for the next lesson.';
}

/* ============================ lessons ============================ */
const SUBJECTS = [['Math', 'Number lines, fractions and a lot of pencils.'], ['Reading', 'Quiet reading, then a story circle.'], ['Science', 'Magnets, plants and one very small volcano.'], ['Art', 'Paint, paper and a plan to clean up.']];
const SCENARIOS = [
  { q: n => n + ' asks a question that is only slightly related to the lesson.', o: [['Answer briefly and tie it back to the lesson', 9, 'You turned the tangent into a teaching moment.'], ['Ask them to save it for the end', 1, 'They nodded, a little deflated.'], ['Spend five minutes on it', -4, 'Fun, but the class lost the thread.']] },
  { q: n => n + ' and a friend are whispering in the back row.', o: [['Give a quiet reminder', 5, 'The whispering stopped.'], ['Move one of them to the front', 8, 'Problem solved, plus a better view.'], ['Ignore it', -9, 'The whispering spread across three desks.']] },
  { q: () => 'The class looks sleepy and the room is quiet in the wrong way.', o: [['Stand-up stretch break', 10, 'Everyone woke up and giggled.'], ['Push through the material', -7, 'Eyes glazed over.'], ['Play a quick game', 11, 'The class lit up. That cost you some energy.']] },
  { q: n => n + ' finishes early and starts doodling.', o: [['Hand over a challenge problem', 9, 'They dove right in.'], ['Let them read quietly', 3, 'Fine for now.'], ['Ask them to help a classmate', 10, 'Two kids learned something.']] },
  { q: () => 'Hands go up all over the room at once.', o: [['Call on the quietest student', 10, 'The room cheered them on.'], ['Take answers from the front', 3, 'The usual voices spoke up.'], ['Have them talk it over in pairs', 9, 'The noise was productive.']] },
  { q: n => n + ' looks upset and is not working.', o: [['Check in privately', 9, 'A few kind words made all the difference.'], ['Keep the lesson moving', -7, 'They stayed upset all period.'], ['Send them to the nurse', 1, 'Safe, but the class got curious.']] },
  { q: () => 'A pencil rolls across the room and half the class turns to watch it.', o: [['Turn it into a quick joke and move on', 8, 'Laughter, then focus.'], ['Raise your voice', -6, 'It got quiet, and a little scared.'], ['Wait with a smile', 6, 'They settled in on their own.']] },
  { q: () => 'You are halfway through the plan and the clock is ticking.', o: [['Cut an example to save time', 3, 'Tight, but you made it.'], ['Slow down and check understanding', 9, 'Faces showed they were following.'], ['Speed up', -6, 'Several kids got lost.']] }
];
function pickScenario() {
  const L = G.lesson;
  let i; let tries = 0;
  do { i = Math.floor(Math.random() * SCENARIOS.length); } while (L.used.includes(i) && tries++ < 20);
  L.used.push(i);
  L.cur = { i, kid: KID_NAMES[Math.floor(Math.random() * KID_NAMES.length)] };
}
function startLesson(li, subj) {
  const L = LESSONS[li];
  if (S.t < L.s) advance(L.s - S.t, 'school');
  const beats = Math.max(1, Math.min(L.max, Math.floor((L.e - S.t) / 30)));
  const base = 55 + (S.energy >= 60 ? 8 : S.energy < 35 ? -12 : 0) + S.sch.tip;
  G.lesson = { li, subj, beats, done: 0, engage: clamp(base, 0, 100), used: [], cur: null };
  S.sch.tip = 0;
  pickScenario();
}
function resolveBeat(delta, note) {
  const L = G.lesson;
  L.engage = clamp(L.engage + delta, 0, 100);
  S.sch.mood = L.engage;
  startSkip({ mins: 30, secs: 12, act: 'school', kind: 'beat', activity: 'edu', title: LESSONS[L.li].n + ': ' + L.subj, sub: 'Class activity \u00b7 moment ' + (L.done + 1) + ' of ' + L.beats,
    onEnd() {
      const bn = JA.games.edu.bonus(JA.lastPerf);
      L.engage = clamp(L.engage + bn, 0, 100);
      S.sch.mood = L.engage;
      L.done++;
      toast(note + (bn ? ' Class activity ' + (bn > 0 ? '+' : '\u2212') + Math.abs(bn) + '.' : ''), delta + bn >= 5 ? 'good' : delta + bn < 0 ? 'warn' : '');
      if (G.collapse || S.over) return;
      if (L.done >= L.beats) finishLesson(); else pickScenario();
    } });
}
function finishLesson() {
  const L = G.lesson, lesson = LESSONS[L.li];
  const pay = Math.round(curRate() * 0.5 * L.done * (0.85 + 0.3 * L.engage / 100) * payMult() * 100) / 100;
  S.sch.lessons[L.li] = true; S.sch.done++;
  S.money = Math.round((S.money + pay) * 100) / 100; S.stats.earned += pay;
  toast(lesson.n + ' done. Engagement ' + Math.round(L.engage) + '%. +' + fmt(pay), 'good');
  SFX.chime('pay');
  G.lesson = null;
  lifeEv('lesson', { perf: clamp(L.engage / 100, 0, 1) });
}

/* ============================ school menus ============================ */
function pctBar(v) { return Math.round(v) + '%'; }
function schoolSpec(key) {
  const sc = S.sch, j = job(), t = S.t;
  const BAND = '#9a3b2e';
  if (key === 'lectern') {
    if (G.lesson) {
      const L = G.lesson, sc0 = SCENARIOS[L.cur.i];
      return {
        band: BAND, title: LESSONS[L.li].n + ': ' + L.subj, sub: 'Moment ' + (L.done + 1) + ' of ' + L.beats + '  ·  Class engagement ' + pctBar(L.engage),
        note: sc0.q(L.cur.kid),
        sections: [{ h: 'What do you do?', items: sc0.o.map(o => ({ t: o[0], d: o[2] ? '' : '', tag: '30 min \u00b7 activity', go() { resolveBeat(o[1], o[2]); } })) }]
      };
    }
    const items = [], li = currentLesson();
    let note = '';
    if (sc.dismissed) note = 'The kids have gone home. Nice work today.';
    else if (li >= 0 && sc.kids === 'class') {
      note = LESSONS[li].n + ' is under way. Pick a subject. Your energy and a good mood in the room make the lesson land better.';
      SUBJECTS.forEach(s => items.push({ t: 'Teach ' + s[0], d: s[1], tag: clockStr(LESSONS[li].s).replace(':00', '') + ' to ' + clockStr(LESSONS[li].e).replace(':00', ''), go() { startLesson(li, s[0]); } }));
    } else if (li >= 0) note = 'Your class is not at their desks. Bring them back to the classroom first.';
    else if (t >= DISMISS_AT && sc.kids === 'class') {
      note = 'The final bell has rung.';
      items.push({ t: 'Dismiss the class', d: 'Send the kids home for the day.', tag: '+' + fmt(Math.round(curRate() * 0.25)), go() {
        sc.dismissed = true; sc.kids = 'leave'; paySchool(0.25, 'Dismissal');
        if (sc.done >= 3) S.shifts++;
        toast('School day done. ' + sc.done + ' of 4 lessons taught.', 'good');
      } });
    } else {
      const nxt = LESSONS.findIndex((L, i) => !sc.lessons[i] && L.s > t);
      note = nxt >= 0 ? 'Next up: ' + LESSONS[nxt].n + ' at ' + clockStr(LESSONS[nxt].s) + '.' : (t >= DISMISS_AT ? 'Your class is not here to dismiss.' : 'No more lessons today.');
    }
    return { band: BAND, title: 'Your classroom', sub: 'Lakeview Elementary, Room 3', note, stock: ['Lessons taught ' + sc.done + '/4', fmt(S.money)], sections: items.length ? [{ h: 'The lectern', items }] : [] };
  }
  if (key === 'classDoor' || key === 'cafeDoor') {
    const inCafe = key === 'cafeDoor', items = [];
    let note = inCafe ? 'The cafeteria entrance.' : 'Your classroom door.';
    if (!inCafe && sc.kids === 'class' && !sc.lunchSeated && !sc.lunchMissed && t >= LUNCH.s - 5 && t < LUNCH.e) {
      items.push({ t: 'Line up the class for lunch', d: 'The kids will follow you. Lead them to the cafeteria entrance.', go() { sc.kids = 'follow'; G.trail = []; } });
    } else if (!inCafe && sc.kids === 'follow') {
      if (sc.lunchSeated) items.push({ t: 'Seat the class at their desks', d: 'Lunch duty is paid when they are back.', tag: '+' + fmt(Math.round(curRate() * 0.75)), go() { sc.kids = 'class'; sc.lunchDone = true; paySchool(0.75, 'Lunch duty'); } });
      else items.push({ t: 'Send the class back to their seats', d: 'Cancel the lunch line.', go() { sc.kids = 'class'; } });
    } else if (inCafe && sc.kids === 'follow' && !sc.lunchSeated) {
      items.push({ t: 'Seat the class at the lunch tables', d: 'They eat until 12:10 PM.', go() { sc.kids = 'cafe'; sc.lunchSeated = true; } });
    } else if (inCafe && sc.kids === 'cafe') {
      if (t >= LUNCH.eatEnd) items.push({ t: 'Line the class up to go back', d: 'Lead them back to the classroom door.', go() { sc.kids = 'follow'; G.trail = []; } });
      else note = 'The kids are still eating. They finish at ' + clockStr(LUNCH.eatEnd) + '.';
    } else note += ' Nothing to do here right now.';
    return { band: BAND, title: inCafe ? 'Cafeteria entrance' : 'Classroom door', sub: 'Lunch duty', note, sections: items.length ? [{ h: 'Class', items }] : [] };
  }
  if (key === 'staffTable' || key === 'loungeTable') {
    const lounge = key === 'loungeTable';
    const cost = j.lunchCost || 0;
    const m = mealItem('l', 'Teacher lunch', cost, { hunger: 56, thirst: 6, mins: 30, d: 'Sandwich, apple and a cold drink. Hunger +56.' });
    return { band: BAND, title: lounge ? 'Lounge table' : 'Staff table', sub: lounge ? 'Teachers lounge' : 'Cafeteria', note: lounge ? 'Teachers eat here, away from the noise. Lunch is served 11 AM to 4 PM.' : 'The staff table sits at the back of the cafeteria, where you can keep one eye on the kids. Lunch is served 11 AM to 4 PM.', sections: [{ h: 'Lunch', items: [m] }] };
  }
  if (key === 'coffee') {
    return { band: '#6a4a3a', title: 'Coffee machine', sub: 'Teachers lounge', note: 'The pot is always on.', sections: [{ h: 'Pour a cup', items: [{ t: 'Coffee', d: 'Free. Energy +12.', tag: '5 min', go() { applyIntake({ energy: 12, thirst: 4, mins: 5 }); SFX.chime('drink'); toast('Coffee. Energy +12.', 'good'); } }] }] };
  }
  if (key === 'fountain') {
    return { band: '#2f6f8f', title: 'Water fountain', sub: 'Hallway', note: 'Cold and a little bit metallic.', sections: [{ h: 'Drink', items: [{ t: 'Drink water', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30), go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Cold water. Thirst +30.', 'good'); } }] }] };
  }
  if (key === 'library') {
    return { band: '#5a4a7a', title: 'School library', sub: 'Ms. Lin keeps it quiet', note: 'Rows of picture books, chapter books and one very old globe.', sections: [{ h: 'Browse', items: [
      { t: 'Find a lesson idea', d: 'Your next lesson starts with +6 engagement. Once a day.', tag: '20 min', off: sc.lib ? 'You already picked a book today.' : '', go() { sc.lib = true; sc.tip = Math.min(14, sc.tip + 6); applyIntake({ mins: 20 }); toast('A story that will land well. Next lesson +6 engagement.', 'good'); } },
      { t: 'Read quietly', d: 'A calm half hour among the shelves. Energy +4.', tag: '30 min', off: S.energy >= 96 ? 'You are not tired.' : '', go() { applyIntake({ energy: 4, mins: 30 }); toast('A quiet half hour. Energy +4.', 'good'); } }] }] };
  }
  if (key === 'hoops') {
    return { band: '#9a6a2e', title: 'The gym', sub: 'Mr. Alvarez keeps the court', note: 'The floor squeaks and the hoops are a little low. A good place to blow off steam.', sections: [{ h: 'Play', items: [
      { t: 'Shoot some hoops', d: 'Fresh air for your head. Energy +3, but you work up a thirst.', tag: '30 min', off: S.thirst < 20 ? 'You are too thirsty for this.' : S.hunger < 20 ? 'You are too hungry for this.' : '', go() { applyIntake({ energy: 3, hunger: -6, thirst: -8, mins: 30 }); toast('A few good shots. Energy +3.', 'good'); } }] }] };
  }
  if (key === 'cot') {
    return { band: '#4d86a8', title: 'Nurse\'s office', sub: 'Quiet cots', note: 'Nurse Reed keeps two cots made up for sick kids and tired teachers.', sections: [{ h: 'Rest', items: [
      { t: 'Lie down for a while', d: 'Energy +9.', tag: '45 min', off: S.energy >= 92 ? 'You are not tired.' : '', go() { applyIntake({ energy: 9, mins: 45 }); toast('A restful forty-five minutes. Energy +9.', 'good'); } }] }] };
  }
  if (key === 'board') {
    const rows = LESSONS.map((L, i) => (sc.lessons[i] ? 'Done  ' : '') + L.n + '  ' + clockStr(L.s).replace(':00', '') + ' to ' + clockStr(L.e).replace(':00', ''));
    return { band: '#3a5a7a', title: 'Staff board', sub: 'Today at Lakeview', note: rows.join('.  ') + '.  Lunch duty ' + clockStr(LUNCH.s).replace(':00', '') + '.  Dismissal ' + clockStr(DISMISS_AT) + '.', stock: ['Lessons taught ' + sc.done + '/4', fmt(S.money)], sections: [] };
  }
  if (key.startsWith('talk-')) {
    const T = TEACHERS.find(x => 'talk-' + x.id === key), friend = S.friends[T.id] || 0;
    if (!G.talk || G.talk.id !== T.id) G.talk = { id: T.id, stage: 0, reply: '' };
    if (G.talk.stage === 0) {
      return { band: '#3a5a7a', title: T.name, sub: T.role, note: '"' + T.greet[friend % T.greet.length] + '"',
        sections: [{ h: 'Your reply', items: T.replies.map(r => ({ t: r[0], d: '', go() {
          G.talk.stage = 1; G.talk.reply = r[1]; S.friends[T.id] = friend + 1;
          if (!sc.talked[T.id] && (!T.perk.needs || T.perk.needs())) { sc.talked[T.id] = true; T.perk.go(); G.talk.perk = T.perk.text; SFX.chime('pay'); } else G.talk.perk = '';
        } })) }] };
    }
    return { band: '#3a5a7a', title: T.name, sub: T.role, note: '"' + G.talk.reply + '"' + (G.talk.perk ? '  ' + G.talk.perk : ''), sections: [] };
  }
  return { band: BAND, title: 'School', sub: '', note: '', sections: [] };
}
function actNow() { return S.scene === 'school' && S.t >= 8 * 60 && S.t < 15 * 60 + 45 ? 'school' : 'idle'; }
