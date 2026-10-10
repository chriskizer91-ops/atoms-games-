/* ============================ walkable interiors: framework ============================ */
const INT = {};
const TW = 84; // height of the back wall face

/* the building that owns an interior, for opening hours */
function intBuilding(id) { return id && id.startsWith('work') ? 'work' : id; }
function intName(id) { return id.startsWith('work') ? job().employer : INT[id].name; }

function defInt(id, d) {
  d.id = id;
  d.b = d.b || { x1: 34, y1: 100, x2: d.w - 34, y2: d.h - 42 };
  d.wallCol = d.wallCol || '#cfc8b6'; d.trim = d.trim || '#a69f8f';
  d.floors = d.floors || []; d.walls = d.walls || []; d.furn = d.furn || []; d.spots = d.spots || [];
  d.exit = d.exit || { x: d.w / 2 };
  d.spawn = { x: d.exit.x, y: d.h - 62 };
  d.rects = d.walls.slice();
  d.furn.forEach(f => { if (!FURN_FLAT[f.t] && !f.ghost && !f.when) d.rects.push([f.x, f.y, f.w, f.h]); });
  d.spots = d.spots.map(s => Object.assign({ r: 46 }, s));
  d.spots.push({ id: 'exit', x: d.exit.x, y: d.h - 52, r: 56, label: 'Leave', prompt: () => 'Leave ' + (d.id.startsWith('work') ? job().employer : d.name) });
  d.folkObjs = [];
  INT[id] = d;
  return d;
}
function solidInt(d, x, y) {
  const b = d.b;
  if (x < b.x1 || x > b.x2 || y < b.y1 || y > b.y2) return true;
  const R = d.rects;
  for (let i = 0; i < R.length; i++) { const r = R[i]; if (x + 8 > r[0] && x - 8 < r[0] + r[2] && y + 3 > r[1] && y - 3 < r[1] + r[3]) return true; }
  if (d.dyn) for (const f of d.dyn) if (f.when() && x + 8 > f.x && x - 8 < f.x + f.w && y + 3 > f.y && y - 3 < f.y + f.h) return true;
  return false;
}

/* what scene are we in, and how big is it */
function sceneKey() { return S.scene === 'town' ? 'town' : S.scene === 'school' ? 'school' : 'int:' + S.intId; }
function sceneDims(key) {
  if (key === 'town') return { w: WORLD.w, h: WORLD.h };
  if (key === 'school') return { w: SCH_W, h: SCH_H };
  const d = INT[key.slice(4)]; return { w: d.w, h: d.h };
}
function solidKey(key, x, y) {
  if (key === 'town') return solidAt(x, y);
  if (key === 'school') return solidSchool(x, y);
  return solidInt(INT[key.slice(4)], x, y);
}
const solidNow = (x, y) => solidKey(sceneKey(), x, y);

