/* ============================ city layout ============================ */
const WORLD = { w: 3000, h: 2000 };
const TOP_Y = 340;                  // northern edge of the walkable city
const BAND1 = 620, BAND2 = 1090;    // door lines of the two building rows
const ROAD1 = { y: 670, h: 80 }, ROAD2 = { y: 1140, h: 80 };
const ROADS_H = [ROAD1, ROAD2];
const STREETS_X = [780, 1560, 2300]; // centres of the cross streets
const STREET_W = 90;
const PARK_Y = 1270;
const FOUNTAIN = { x: 1500, y: 1580, r: 48 };
const POND = { x: 2330, y: 1700, rx: 210, ry: 100 };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* the five buildings you can walk into */
const BLD = {
  apartment: { id: 'apartment', name: 'Maple Court Apartments', x: 70,   y: BAND1 - 250, w: 270, h: 250, kind: 'apt', wall: '#b9684f', roof: '#5b3a33', row: 1 },
  work:      { id: 'work',      name: 'Workplace',               x: 900,  y: BAND1 - 230, w: 280, h: 230, kind: 'work', wall: '#5f7fa8', roof: '#2f3f5a', row: 1 },
  clinic:    { id: 'clinic',    name: 'St. Anne Clinic',         x: 2420, y: BAND1 - 210, w: 270, h: 210, kind: 'clinic', wall: '#eef3f5', roof: '#4d86a8', row: 1 },
  grocery:   { id: 'grocery',   name: 'Corner Grocery',          x: 920,  y: BAND2 - 200, w: 240, h: 200, kind: 'shop', wall: '#86b894', roof: '#2f6b4c', row: 2 },
  diner:     { id: 'diner',     name: "Dot's Diner",             x: 1700, y: BAND2 - 170, w: 240, h: 170, kind: 'diner', wall: '#d95f59', roof: '#8f2d2d', row: 2 }
};
const ENTERABLE = ['apartment', 'work', 'grocery', 'diner', 'clinic', 'park'];
const DOORS = {};
Object.values(BLD).forEach(b => { DOORS[b.id] = { x: b.x + b.w / 2, y: b.y + b.h + 14 }; });
DOORS.park = { x: FOUNTAIN.x, y: FOUNTAIN.y + 64 };

/* filler buildings for the rest of the two rows */
const DECO = [];
(function makeDeco() {
  const rnd = mulberry32(2024);
  const shopNames = ['Pharmacy', 'First Bank', 'Bookshop', 'Bakery', 'Hardware', 'Cinema', 'Salon', 'Laundromat', 'Bike Shop', 'Cafe Luna', 'Pizza Place', 'Dentist', 'Law Office', 'Post Office', 'Florist', 'Fitness', 'Hotel Arden', 'Record Store', 'Toy Shop', 'Tailor', 'Noodle Bar', 'Pet Store', 'Optician', 'Gallery'];
  const towerNames = ['Orbit Tower', 'Meridian Plaza', 'Summit Tower', 'Union Center', 'Halcyon Tower', 'Vista Offices'];
  const walls = ['#c9b79c', '#a7b6c4', '#d4a59a', '#b4c7a8', '#c8bfd8', '#e0cfa0', '#9fb0b8', '#d9b48a'];
  const roofs = ['#5b4a3a', '#3f4f63', '#6a3f3f', '#3f5b4a', '#4a3f63', '#6a5a3a', '#3a4a52', '#5a3a2a'];
  const accents = ['#e76f51', '#2a9d8f', '#e9c46a', '#4361ee', '#c77dff', '#ef476f'];
  let si = 0, ti = 0;
  const gaps = STREETS_X.map(cx => [cx - 65, cx + 65]);
  const segs = [];
  let a = 30;
  gaps.forEach(g => { segs.push([a, g[0]]); a = g[1]; });
  segs.push([a, WORLD.w - 30]);
  [1, 2].forEach(row => {
    const bottom = row === 1 ? BAND1 : BAND2, maxH = row === 1 ? 280 : 290;
    const keys = Object.values(BLD).filter(b => b.row === row).map(b => [b.x - 8, b.x + b.w + 8]);
    segs.forEach(seg => {
      // free spans in this segment once key buildings are removed
      let spans = [seg.slice()];
      keys.forEach(k => {
        const next = [];
        spans.forEach(s => {
          if (k[1] <= s[0] || k[0] >= s[1]) next.push(s);
          else { if (k[0] > s[0]) next.push([s[0], k[0]]); if (k[1] < s[1]) next.push([k[1], s[1]]); }
        });
        spans = next;
      });
      spans.forEach(s => {
        let x = s[0] + 2;
        while (s[1] - x >= 150) {
          let w = 190 + rnd() * 110;
          if (s[1] - (x + w) < 150) w = s[1] - x - 2;
          if (w < 150) break;
          const h = 190 + rnd() * (maxH - 190);
          const tower = h > 245 && w < 240;
          const wi = Math.floor(rnd() * walls.length);
          DECO.push({
            id: 'deco' + DECO.length, kind: 'deco', style: tower ? 'tower' : rnd() < 0.55 ? 'shop' : 'flat',
            name: tower ? towerNames[ti++ % towerNames.length] : shopNames[si++ % shopNames.length],
            x, y: bottom - h, w, h, wall: walls[wi], roof: roofs[(wi + 3) % roofs.length], accent: accents[Math.floor(rnd() * accents.length)],
            seed: Math.floor(rnd() * 1e6), row
          });
          x += w + 6 + rnd() * 4;
        }
      });
    });
  });
})();
const ALL_BLD = Object.values(BLD).concat(DECO);

/* a block's collision box: the whole back lot of the north row is solid, so nobody walks behind it */
function bldBox(b) { return b.row === 1 ? { x: b.x, y: TOP_Y - 20, w: b.w, h: b.y + b.h - (TOP_Y - 20) } : { x: b.x, y: b.y, w: b.w, h: b.h }; }
const BOXES = ALL_BLD.map(bldBox);

const TREES = [];
(function makeTrees() {
  const rnd = mulberry32(42);
  // street trees where two buildings meet
  ALL_BLD.forEach(b => {
    const right = b.x + b.w;
    const next = ALL_BLD.find(o => o.row === b.row && o.x > right - 2 && o.x - right < 16);
    if (next && rnd() < 0.7) TREES.push({ x: right + 3, y: (b.row === 1 ? BAND1 : BAND2) + 34, r: 18 + rnd() * 5, tone: rnd() });
  });
  // park trees
  let tries = 0, parkCount = 0;
  while (parkCount < 110 && tries++ < 2500) {
    const x = 70 + rnd() * 2860, y = PARK_Y + 70 + rnd() * 600, r = 20 + rnd() * 10;
    if (Math.hypot((x - FOUNTAIN.x) / 1.4, y - FOUNTAIN.y) < 190) continue;
    if (((x - POND.x) / (POND.rx + 50)) ** 2 + ((y - POND.y) / (POND.ry + 50)) ** 2 < 1) continue;
    if (Math.abs(x - FOUNTAIN.x) < 60 && y < FOUNTAIN.y) continue;
    if (Math.abs(y - FOUNTAIN.y) < 40) continue;
    if (TREES.some(t => Math.hypot(t.x - x, t.y - y) < 80)) continue;
    TREES.push({ x, y, r, tone: rnd() }); parkCount++;
  }
})();
const BENCHES = [{ x: 1390, y: 1560 }, { x: 1610, y: 1560 }, { x: 1500, y: 1700 }, { x: 800, y: 1470 }, { x: 800, y: 1620 }, { x: 2050, y: 1440 }, { x: 420, y: 1560 }, { x: 2700, y: 1500 }];
const LAMPS = [];
(function makeLamps() {
  const inGap = x => STREETS_X.some(cx => Math.abs(x - cx) < 85);
  for (let x = 120; x < WORLD.w - 60; x += 240) {
    if (inGap(x)) continue;
    LAMPS.push({ x, y: ROAD1.y - 4 }); LAMPS.push({ x: x + 110, y: ROAD1.y + ROAD1.h + 30 });
    LAMPS.push({ x, y: ROAD2.y - 4 }); LAMPS.push({ x: x + 110, y: ROAD2.y + ROAD2.h + 30 });
  }
  for (let x = 220; x < WORLD.w - 200; x += 260) if (!(Math.abs(x - FOUNTAIN.x) < 100)) LAMPS.push({ x, y: FOUNTAIN.y - 18 });
})();

/* bus stops: fast travel across the city */
const BUS_STOPS = [
  { id: 0, name: 'Maple Court', x: 520, y: 648 },
  { id: 1, name: 'Downtown', x: 1330, y: 648 },
  { id: 2, name: 'Market Street', x: 1400, y: 1116 },
  { id: 3, name: 'Clinic Row', x: 2200, y: 648 },
  { id: 4, name: 'Central Park', x: 1260, y: 1300 }
];

/* collision: the player is a small box at his feet */
function solidAt(x, y) {
  if (x < 14 || x > WORLD.w - 14 || y < TOP_Y || y > WORLD.h - 12) return true;
  for (let i = 0; i < BOXES.length; i++) {
    const b = BOXES[i];
    if (x + 8 > b.x && x - 8 < b.x + b.w && y + 3 > b.y && y - 3 < b.y + b.h) return true;
  }
  for (const t of TREES) if (Math.abs(x - t.x) < 11 && y > t.y - 8 && y < t.y + 6) return true;
  if (Math.hypot(x - FOUNTAIN.x, (y - FOUNTAIN.y) * 1.25) < FOUNTAIN.r + 6) return true;
  if (((x - POND.x) / POND.rx) ** 2 + ((y - POND.y) / POND.ry) ** 2 < 1) return true;
  return false;
}

/* where people stroll: sidewalks and the park */
const WALK_ZONES = [
  [40, BAND1 + 6, WORLD.w - 80, 40],
  [40, ROAD1.y + ROAD1.h + 6, WORLD.w - 80, 38],
  [40, BAND2 + 6, WORLD.w - 80, 40],
  [40, ROAD2.y + ROAD2.h + 6, WORLD.w - 80, 38],
  [60, PARK_Y + 20, WORLD.w - 120, 700],
  [60, PARK_Y + 20, WORLD.w - 120, 700]
];

/* flowers are scattered once */
const FLOWERS = [];
(function () {
  const rnd = mulberry32(5);
  const fc = ['#ffd166', '#ef476f', '#f8f9fa', '#c77dff'];
  for (let i = 0; i < 360; i++) {
    const x = 40 + rnd() * 2920, y = PARK_Y + 20 + rnd() * 690;
    if (Math.hypot((x - FOUNTAIN.x) / 1.4, y - FOUNTAIN.y) < 180) continue;
    if (((x - POND.x) / (POND.rx + 10)) ** 2 + ((y - POND.y) / (POND.ry + 10)) ** 2 < 1) continue;
    FLOWERS.push({ x, y, c: fc[i % 4] });
  }
})();
