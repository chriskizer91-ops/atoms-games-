// Types and the type chart. See docs/creature-catch-decisions-2.md, sections 3 and 4.
var CC = window.CC || (window.CC = {});

CC.TYPES = ['Normal', 'Fire', 'Water', 'Plant', 'Earth', 'Bolt', 'Frost', 'Shadow', 'Lumen'];

CC.TYPE_COLORS = {
  Normal: ['#d8d0c0', '#a89c88', '#6e6454'],
  Fire: ['#ffb36b', '#f0602c', '#a8301c'],
  Water: ['#8fd0ff', '#3a8ee8', '#1f4fa0'],
  Plant: ['#a8e88a', '#4fb04a', '#2a6e34'],
  Earth: ['#e0c08a', '#a8784a', '#6a4a2c'],
  Bolt: ['#fff07a', '#f0c828', '#a07c10'],
  Frost: ['#e4faff', '#9adcf0', '#5a9cc0'],
  Shadow: ['#b48ad8', '#6e46a0', '#3a2260'],
  Lumen: ['#fff8d8', '#f0dc8a', '#b8a050'],
};

// Each elemental type hits exactly two others for 2x.
CC.TYPE_HITS = {
  Fire: ['Plant', 'Frost'],
  Water: ['Fire', 'Earth'],
  Plant: ['Water', 'Earth'],
  Earth: ['Bolt', 'Lumen'],
  Bolt: ['Water', 'Frost'],
  Frost: ['Plant', 'Shadow'],
  Shadow: ['Lumen', 'Bolt'],
  Lumen: ['Shadow', 'Fire'],
};

// One attacking type against one defending type.
CC.typeVs = function (atk, def) {
  if (atk === 'Normal' || def === 'Normal' || !atk) return 1;
  if (CC.TYPE_HITS[atk].includes(def)) return 2;
  // Shadow and Lumen hit each other for 2x; otherwise the reverse of a 2x is 0.5x
  if (CC.TYPE_HITS[def].includes(atk)) return 0.5;
  // darkness can't swallow darkness, light can't blind light
  if (atk === def && (atk === 'Shadow' || atk === 'Lumen')) return 0.5;
  return 1;
};

CC.typeMult = function (atk, defTypes) {
  return defTypes.reduce(function (m, t) { return m * CC.typeVs(atk, t); }, 1);
};
