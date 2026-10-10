/* ============================ workplaces ============================ */
function workDef(jid) {
  const j = DEG(jid), cfg = WORK_CFG[jid];
  const shiftTitle = cfg.deskName;
  return {
    name: j.employer, w: 1100, h: 640, exit: { x: 220 }, wallCol: cfg.wall, trim: cfg.trim,
    floors: [[34, TW, 756, 514, cfg.floorType, cfg.floor, cfg.floor2], [790, TW, 24, 514, 'plain', '#bdb6a6'], [814, TW, 252, 316, 'tile', '#e6e0d2'], [814, 422, 252, 176, 'carpet', '#7a6a8a']],
    walls: [[790, TW, 24, 166], [790, 330, 24, 130], [790, 540, 24, 58], [814, 400, 252, 22]],
    deco(c) {
      winTop(c, 340, 90); winTop(c, 520, 90); winTop(c, 700, 60);
      sign(c, j.employer.toUpperCase(), 200, 36, Math.min(300, 40 + j.employer.length * 12), cfg.signCol);
      sign(c, 'BREAK ROOM', 940, 52, 110, '#3a5a7a'); sign(c, 'OFFICE', 940, 438, 80, '#6a4a8a');
      c.fillStyle = '#5a3b2a'; c.fillRect(786, 244, 32, 5); c.fillRect(786, 330, 32, 5); c.fillRect(786, 456, 32, 5); c.fillRect(786, 540, 32, 5);
    },
    furn: cfg.furn.concat([
      { t: 'machine', x: 834, y: 100, w: 40, h: 66, c: '#4cc9f0', screen: '#ffffff', label: 'H2O', fs: 8 }, { t: 'machine', x: 886, y: 100, w: 56, h: 54, c: '#3a2f2a', screen: '#ff9f43', label: 'COFFEE', fs: 8 }, { t: 'fridge', x: 954, y: 100, w: 48, h: 70 },
      { t: 'round', x: 880, y: 262, w: 120, h: 84, c: '#9c7a4f' }, { t: 'chair', x: 842, y: 250, w: 24, h: 24, c: '#c0392b' }, { t: 'chair', x: 1014, y: 250, w: 24, h: 24, c: '#c0392b' }, { t: 'plant', x: 1030, y: 350, w: 30, h: 32 },
      { t: 'bookshelf', x: 826, y: 432, w: 92, h: 42 }, { t: 'desk', x: 900, y: 490, w: 130, h: 52, c: '#6b4a30' }, { t: 'chair', x: 940, y: 556, w: 26, h: 24, c: '#4a5568' }, { t: 'plant', x: 1030, y: 440, w: 30, h: 32 },
      { t: 'mat', x: 170, y: 578, w: 100, h: 20 }
    ]),
    spots: [
      { id: 'work', x: cfg.spot[0], y: cfg.spot[1], r: 62, prompt: () => cfg.prompt, panel: PN('work', { secs: ["Today's shifts"], title: shiftTitle, sub: j.job + ' at ' + j.employer, band: j.roof }) },
      { id: 'h2o', x: 854, y: 188, r: 54, prompt: () => 'Drink from the water cooler', panel: PN('work', { secs: ['Break room'], only: t => /Water/.test(t), title: 'Water cooler', sub: 'Break room', band: j.roof, note: 'Cold, free, and always a little crowded.' }) },
      { id: 'coffee', x: 914, y: 178, r: 54, prompt: () => 'Pour a coffee', panel: PN('work', { secs: ['Break room'], only: t => /Coffee/.test(t), title: 'Coffee machine', sub: 'Break room', band: j.roof, note: j.freeCoffee ? 'The office kitchen keeps this going all day, free.' : 'A strong cup for a dollar fifty.' }) }
    ].concat(j.freeLunch || j.lunchCost ? [{ id: 'lunch', x: 940, y: 372, r: 60, prompt: () => j.freeLunch ? 'Eat staff lunch' : 'Eat lunch in the break room', panel: PN('work', { secs: ['Break room'], only: t => /lunch/i.test(t), title: 'Break room table', sub: j.employer, band: j.roof, note: 'Lunch is served 11 AM to 4 PM.' }) }] : []),
    folks: cfg.folks
  };
}
const WORK_CFG = {
  cs: {
    wall: '#cfd5e0', trim: '#9aa6bb', floorType: 'carpet', floor: '#8e9bb0', floor2: 'rgba(255,255,255,.07)', signCol: '#2f3f5a', deskName: 'Your desk', prompt: 'Sit at your desk', spot: [340, 324],
    furn: [
      { t: 'server', x: 60, y: 98, w: 44, h: 70 }, { t: 'server', x: 108, y: 98, w: 44, h: 70 }, { t: 'server', x: 156, y: 98, w: 44, h: 70 }, { t: 'board', x: 540, y: 22, w: 180, h: 44, label: 'SPRINT 12' },
      { t: 'desk', x: 90, y: 250, w: 100, h: 50 }, { t: 'desk', x: 290, y: 250, w: 100, h: 50, screen: '#9be7a8' }, { t: 'desk', x: 490, y: 250, w: 100, h: 50 },
      { t: 'desk', x: 90, y: 400, w: 100, h: 50 }, { t: 'desk', x: 290, y: 400, w: 100, h: 50 }, { t: 'desk', x: 490, y: 400, w: 100, h: 50 },
      { t: 'chair', x: 127, y: 222, w: 26, h: 24 }, { t: 'chair', x: 327, y: 222, w: 26, h: 24 }, { t: 'chair', x: 527, y: 222, w: 26, h: 24 },
      { t: 'bean', x: 620, y: 110, w: 70, h: 50, c: '#e76f51' }, { t: 'bean', x: 700, y: 150, w: 60, h: 46, c: '#2a9d8f' }, { t: 'plant', x: 640, y: 500, w: 30, h: 32 }, { t: 'plant', x: 60, y: 520, w: 30, h: 32 }
    ],
    folks: [folkAt('noor', 140, 244), folkAt('felix', 540, 392), folkAt('dana', 965, 482)]
  },
  eng: {
    wall: '#d4d7dc', trim: '#9a9fa8', floorType: 'lino', floor: '#b9bec4', floor2: 'rgba(0,0,0,.08)', signCol: '#444a55', deskName: 'Your bench', prompt: 'Work at your bench', spot: [345, 334],
    furn: [
      { t: 'machine', x: 60, y: 98, w: 130, h: 80, c: '#6b7a8f', label: 'CNC MILL', fs: 10, screen: '#ffb347' }, { t: 'machine', x: 210, y: 98, w: 70, h: 60, c: '#e9e4d8', label: '3D PRINT', fs: 8, screen: '#4cc9f0' },
      { t: 'shelf', x: 310, y: 98, w: 150, h: 56, label: 'PARTS', s: 2 }, { t: 'counter', x: 500, y: 104, w: 200, h: 48, c: '#7d8a94', top: '#b0b8bf', label: 'WORKBENCH' }, { t: 'board', x: 560, y: 22, w: 150, h: 44, c: '#cfe6ff', label: 'BLUEPRINT' },
      { t: 'table', x: 90, y: 260, w: 120, h: 60, c: '#cfd8dc', label: 'DRAFTING', fs: 9 }, { t: 'desk', x: 290, y: 260, w: 120, h: 60, c: '#8a8f98', screen: '#ffb347' }, { t: 'table', x: 490, y: 260, w: 120, h: 60, c: '#cfd8dc', label: 'DRAFTING', fs: 9 },
      { t: 'table', x: 90, y: 410, w: 120, h: 60, c: '#cfd8dc', label: 'BLUEPRINTS', fs: 9 }, { t: 'machine', x: 290, y: 410, w: 120, h: 70, c: '#8a8f98', label: 'LATHE', fs: 10, screen: '#9be7a8' }, { t: 'table', x: 490, y: 410, w: 120, h: 60, c: '#cfd8dc', label: 'DRAFTING', fs: 9 },
      { t: 'plant', x: 700, y: 520, w: 30, h: 32 }
    ],
    folks: [folkAt('olga', 150, 252), folkAt('pavel', 550, 402), folkAt('keller', 965, 482)]
  },
  nurse: {
    wall: '#e3eef2', trim: '#a9c3cf', floorType: 'lino', floor: '#e3edf0', floor2: 'rgba(100,170,190,.14)', signCol: '#c9444f', deskName: 'Nurses station', prompt: 'Start your rounds', spot: [310, 376],
    furn: [
      { t: 'hbed', x: 70, y: 98, w: 80, h: 120 }, { t: 'hbed', x: 210, y: 98, w: 80, h: 120 }, { t: 'hbed', x: 350, y: 98, w: 80, h: 120 }, { t: 'cabinet', x: 480, y: 98, w: 150, h: 56, c: '#cfd8dc', label: 'SUPPLIES', fs: 9 },
      { t: 'counter', x: 150, y: 310, w: 320, h: 50, c: '#4d86a8', top: '#e8f6ff' }, { t: 'desk', x: 200, y: 282, w: 90, h: 28, pc: true, c: '#d9e3e8' }, { t: 'desk', x: 330, y: 282, w: 90, h: 28, pc: true, c: '#d9e3e8', screen: '#9be7a8' },
      { t: 'hbed', x: 90, y: 440, w: 80, h: 112 }, { t: 'hbed', x: 250, y: 440, w: 80, h: 112 }, { t: 'hbed', x: 410, y: 440, w: 80, h: 112 }, { t: 'plant', x: 700, y: 520, w: 30, h: 32 }, { t: 'plant', x: 660, y: 110, w: 30, h: 32 }
    ],
    folks: [folkAt('amari', 560, 252), folkAt('tomas', 600, 410), folkAt('rosalind', 965, 482)]
  },
  biz: {
    wall: '#ddd5e6', trim: '#a99bb8', floorType: 'carpet', floor: '#9a8aa8', floor2: 'rgba(255,255,255,.06)', signCol: '#4a3560', deskName: 'Your cubicle', prompt: 'Sit at your cubicle', spot: [310, 316],
    furn: [
      { t: 'table', x: 460, y: 112, w: 220, h: 90, c: '#7d5434', label: 'CONFERENCE', fs: 11 }, { t: 'chair', x: 480, y: 84 + 2, w: 24, h: 24 }, { t: 'chair', x: 540, y: 86, w: 24, h: 24 }, { t: 'chair', x: 600, y: 86, w: 24, h: 24 }, { t: 'chair', x: 480, y: 206, w: 24, h: 24 }, { t: 'chair', x: 540, y: 206, w: 24, h: 24 }, { t: 'chair', x: 600, y: 206, w: 24, h: 24 },
      { t: 'board', x: 120, y: 22, w: 190, h: 44, c: '#f1e9fa', label: 'Q3 TARGETS' },
      { t: 'desk', x: 80, y: 250, w: 100, h: 50 }, { t: 'desk', x: 260, y: 250, w: 100, h: 50, screen: '#e0b0ff' }, { t: 'desk', x: 440, y: 290, w: 100, h: 50 },
      { t: 'desk', x: 80, y: 400, w: 100, h: 50 }, { t: 'desk', x: 260, y: 400, w: 100, h: 50 }, { t: 'desk', x: 440, y: 430, w: 100, h: 50 },
      { t: 'chair', x: 117, y: 222, w: 26, h: 24 }, { t: 'chair', x: 297, y: 222, w: 26, h: 24 }, { t: 'chair', x: 477, y: 262, w: 26, h: 24 },
      { t: 'sofa', x: 330, y: 520, w: 140, h: 50, c: '#6a5a8a' }, { t: 'plant', x: 60, y: 520, w: 30, h: 32 }, { t: 'plant', x: 700, y: 520, w: 30, h: 32 }, { t: 'plant', x: 700, y: 110, w: 30, h: 32 }
    ],
    folks: [folkAt('carter', 130, 244), folkAt('imogen', 560, 500), folkAt('pike', 965, 482)]
  },
  cook: {
    wall: '#e4d3bd', trim: '#b9a07c', floorType: 'tile', floor: '#cdbba3', floor2: 'rgba(0,0,0,.07)', signCol: '#5b2a1d', deskName: 'The line', prompt: 'Work the line', spot: [210, 180],
    furn: [
      { t: 'stove', x: 60, y: 98, w: 90, h: 56, label: 'RANGE' }, { t: 'stove', x: 160, y: 98, w: 90, h: 56, label: 'RANGE' }, { t: 'stove', x: 260, y: 98, w: 90, h: 56, label: 'GRILL' },
      { t: 'fridge', x: 420, y: 98, w: 60, h: 80 }, { t: 'sink', x: 500, y: 98, w: 100, h: 50 }, { t: 'shelf', x: 620, y: 98, w: 150, h: 56, label: 'DRY GOODS', s: 1 },
      { t: 'table', x: 80, y: 250, w: 140, h: 56, c: '#cfd8dc', label: 'PREP', fs: 10 }, { t: 'table', x: 300, y: 250, w: 140, h: 56, c: '#cfd8dc', label: 'PREP', fs: 10 }, { t: 'counter', x: 520, y: 250, w: 230, h: 48, c: '#7d8a94', top: '#cfd8dc', label: 'THE PASS' },
      { t: 'round', x: 100, y: 410, w: 90, h: 64, c: '#a83a3a' }, { t: 'round', x: 300, y: 410, w: 90, h: 64, c: '#a83a3a' }, { t: 'round', x: 500, y: 410, w: 90, h: 64, c: '#a83a3a' },
      { t: 'stool', x: 80, y: 480, w: 24, h: 24 }, { t: 'stool', x: 190, y: 480, w: 24, h: 24 }, { t: 'stool', x: 280, y: 480, w: 24, h: 24 }, { t: 'stool', x: 390, y: 480, w: 24, h: 24 }, { t: 'plant', x: 700, y: 520, w: 30, h: 32 }
    ],
    folks: [folkAt('dmitri', 360, 238), folkAt('beto', 650, 178), folkAt('marisol', 965, 482)]
  }
};
['cs', 'eng', 'nurse', 'biz', 'cook'].forEach(id => defInt('work_' + id, workDef(id)));
initIntFolk();
