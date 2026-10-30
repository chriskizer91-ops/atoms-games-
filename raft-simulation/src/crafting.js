import { CLOTHING, GEAR, STATIONS, UPGRADES, ITEMS } from './config.js';
import { icon } from './hud.js';

// The crafting panel. Two tabs:
//   Craft - clothing (looks only) and gear, with a wardrobe preview
//   Build - what the hammer can build (pick one here) and the upgrades
// Recipes unlock the first time you hold every material they use. Recipes
// marked bench need a crafting table on the raft.

const SLOT_NAMES = { head: 'Head', body: 'Body', legs: 'Legs' };
const $ = (id) => document.getElementById(id);

function defOf(id) {
  return CLOTHING[id] || GEAR[id] || STATIONS[id] || UPGRADES[id];
}

// A little figure wearing the current outfit.
function dollSVG(worn) {
  const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
  const body = worn.body ? CLOTHING[worn.body] : null;
  const legs = worn.legs ? CLOTHING[worn.legs] : null;
  const head = worn.head;
  const skin = '#b5794f';
  const shirt = body ? hex(body.color) : '#a89878';
  const pants = legs ? hex(legs.color) : '#8c7a5b';
  const longLegs = worn.legs === 'hideLeggings' || !legs;
  let hat = '';
  if (head === 'palmHat') hat = `<ellipse cx="60" cy="30" rx="30" ry="6" fill="#d9b45f"/><path d="M45 30q15-22 30 0z" fill="#c9a24c"/>`;
  if (head === 'bandana') hat = `<path d="M44 28h32v7H44z" fill="#c9483b"/><path d="M76 31l9 5-8 3z" fill="#a83a30"/>`;
  if (head === 'toothBand') hat = `<path d="M44 29h32v4H44z" fill="#6b5a44"/>` + [48, 54, 60, 66, 72].map((x) => `<path d="M${x - 2} 33h4l-2 5z" fill="#eee6d2"/>`).join('');
  if (head === 'jawCrown') hat = `<path d="M43 30l4-12 5 9 4-12 4 12 4-12 4 12 5-9 4 12z" fill="#f1ead8" stroke="#bfb39a" stroke-width="1"/>`;
  let top = `<path d="M40 62h40l4 44H36z" fill="${shirt}"/>`;
  if (worn.body === 'tarpPoncho') top = `<path d="M60 58l34 40H26z" fill="${shirt}"/><path d="M36 98h48v10H36z" fill="${shirt}"/>`;
  if (worn.body === 'palmVest' || worn.body === 'hideVest') top = `<path d="M40 62h40l4 44H36z" fill="${skin}"/><path d="M40 62h14l-4 44H36zM66 62h14l4 44H70z" fill="${shirt}"/>`;
  const legsPath = longLegs
    ? `<path d="M40 106h18l-2 52H42zM62 106h18l-2 52H64z" fill="${pants}"/>`
    : `<path d="M40 106h18l-1 24H41zM62 106h18l-1 24H63z" fill="${pants}"/><path d="M42 130h14l-1 28H43zM64 130h14l-1 28H65z" fill="${skin}"/>`;
  return `<svg viewBox="0 0 120 170" class="doll" aria-hidden="true">
    <ellipse cx="60" cy="164" rx="28" ry="4" fill="rgba(0,0,0,.25)"/>
    ${legsPath}
    <path d="M30 64l-8 40h8l8-34zM90 64l8 40h-8l-8-34z" fill="${worn.body === 'palmVest' || worn.body === 'hideVest' ? skin : shirt}"/>
    ${top}
    <rect x="54" y="48" width="12" height="12" fill="${skin}"/>
    <circle cx="60" cy="38" r="15" fill="${skin}"/>
    <path d="M45 34q15-16 30 0" fill="#3b2a1d"/>
    ${hat}
  </svg>`;
}

export function createCrafting({ inventory, stats, audio, events, hasTable }) {
  const st = {
    owned: new Set(),
    worn: { head: null, body: null, legs: null },
    gear: new Set(),
    found: new Set(),       // every material you have ever held
  };
  let open = false;
  let tab = 'craft';
  let atBench = false;
  let selected = 'palmHat';
  let refresh = 0;

  const el = {
    root: $('craft'), list: $('craft-list'), detail: $('craft-detail'), side: $('craft-outfit'),
    tabs: [...document.querySelectorAll('.craft-tabs button')], where: $('craft-where'),
  };

  const unlocked = (id) => Object.keys(defOf(id).cost).every((k) => st.found.has(k));
  const benchOk = (id) => !defOf(id).bench || hasTable();

  function costRows(cost) {
    return Object.entries(cost).map(([k, n]) => {
      const have = inventory.get(k);
      const ok = have >= n;
      return `<li class="${ok ? 'ok' : 'short'}"><span class="ci">${icon(k)}</span><span>${ITEMS[k]?.name || k}</span><b>${Math.min(have, n)}/${n}</b></li>`;
    }).join('');
  }

  function missingText(id) {
    const need = Object.keys(defOf(id).cost).filter((k) => !st.found.has(k)).map((k) => ITEMS[k].name.toLowerCase());
    return need.length ? `Find ${need.join(' and ')} to unlock` : '';
  }

  function stateOf(id) {
    if (!unlocked(id)) return { label: 'Locked', cls: 'locked' };
    if (CLOTHING[id]) {
      if (Object.values(st.worn).includes(id)) return { label: 'Wearing', cls: 'wearing' };
      if (st.owned.has(id)) return { label: 'Made', cls: 'owned' };
    }
    if (GEAR[id]?.once && st.gear.has(id)) return { label: 'Made', cls: 'owned' };
    if (!benchOk(id)) return { label: 'Needs table', cls: 'locked' };
    if (UPGRADES[id]) return inventory.has(defOf(id).cost) ? { label: 'Can upgrade', cls: 'ready' } : { label: '', cls: '' };
    if (STATIONS[id]) return inventory.has(defOf(id).cost) ? { label: 'Can build', cls: 'ready' } : { label: '', cls: '' };
    return inventory.has(defOf(id).cost) ? { label: 'Can make', cls: 'ready' } : { label: '', cls: '' };
  }

  function group(title, ids) {
    return `<h4>${title}</h4>` + ids.map((id) => {
      const s = stateOf(id);
      const name = unlocked(id) ? defOf(id).name : '???';
      return `<button type="button" class="craft-item ${s.cls} ${id === selected ? 'sel' : ''}" data-id="${id}"><span>${name}</span><em>${s.label}</em></button>`;
    }).join('');
  }

  function renderList() {
    if (tab === 'craft') {
      const bySlot = (slot) => Object.keys(CLOTHING).filter((id) => CLOTHING[id].slot === slot);
      el.list.innerHTML = group('Head', bySlot('head')) + group('Body', bySlot('body')) + group('Legs', bySlot('legs')) + group('Gear', Object.keys(GEAR));
    } else {
      el.list.innerHTML = group('Build with the hammer', Object.keys(STATIONS)) + group('Upgrades', Object.keys(UPGRADES));
    }
  }

  function renderDetail() {
    const id = selected;
    const def = defOf(id);
    if (!unlocked(id)) {
      el.detail.innerHTML = `<p class="label">Locked</p><h3>???</h3><p class="desc">${missingText(id)}.</p>`;
      return;
    }
    let sub = '', actions = '';
    const c = CLOTHING[id], g = GEAR[id], b = STATIONS[id], u = UPGRADES[id];
    const benchNote = def.bench && !hasTable() ? '<p class="done">Needs a crafting table on the raft. Build one with the hammer first.</p>' : '';
    const benchHere = def.bench && hasTable() && !atBench && (c || g) ? '<p class="done">Use the crafting table (E) to make this.</p>' : '';
    if (c) {
      sub = `Clothing · ${SLOT_NAMES[c.slot]} · just for looks`;
      const wearing = st.worn[c.slot] === id;
      if (st.owned.has(id)) actions = wearing ? '<button type="button" class="ghost" data-act="off">Take it off</button>' : '<button type="button" data-act="wear">Wear it</button>';
      else actions = benchNote || benchHere || `<button type="button" data-act="craft" ${inventory.has(c.cost) ? '' : 'disabled'}>Make it</button>`;
    } else if (g) {
      sub = g.once ? 'Gear · replaces the tool you carry' : 'Gear · use it straight away';
      if (g.once && st.gear.has(id)) actions = '<p class="done">Made. It\'s in your hands now.</p>';
      else actions = benchNote || benchHere || `<button type="button" data-act="craft" ${inventory.has(g.cost) ? '' : 'disabled'}>Make it</button>`;
    } else if (b) {
      sub = 'Built with the hammer';
      actions = benchNote || '<button type="button" data-act="pick">Build this</button><p class="done">Takes out the hammer set to build this. Click where you want it.</p>';
    } else if (u) {
      sub = `Upgrade · ${STATIONS[u.on].name.toLowerCase()}`;
      actions = benchNote || '<p class="done">Take out the hammer, aim at one you have built and click.</p>';
    }
    el.detail.innerHTML = `
      <p class="label">${sub}</p>
      <h3>${def.name}</h3>
      <p class="desc">${def.text}</p>
      <ul class="cost">${costRows(def.cost)}</ul>
      <div class="acts">${actions}</div>`;
  }

  function renderSide() {
    const slots = Object.keys(SLOT_NAMES).map((slot) => `<div class="slotrow"><span>${SLOT_NAMES[slot]}</span><b>${st.worn[slot] ? CLOTHING[st.worn[slot]].name : '—'}</b></div>`).join('');
    el.side.innerHTML = `<p class="label">Wardrobe</p>${dollSVG(st.worn)}${slots}`;
  }

  function render() {
    el.tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
    el.where.textContent = atBench ? 'At the crafting table' : hasTable() ? 'Away from the table: bigger recipes need you at it (E)' : 'No crafting table yet';
    renderList();
    renderDetail();
    renderSide();
  }

  function act(kind) {
    const id = selected;
    const c = CLOTHING[id], g = GEAR[id];
    if (kind === 'craft') {
      const def = c || g;
      if (!def || !inventory.has(def.cost) || (def.bench && !atBench)) { audio.error(); return; }
      inventory.spend(def.cost);
      audio.build();
      if (c) {
        st.owned.add(id);
        st.worn[c.slot] = id;
      } else if (id === 'bandage') {
        stats.health = Math.min(100, stats.health + 30);
      } else {
        st.gear.add(id);
      }
      events.onCraft?.(id);
    } else if (kind === 'wear' && c) {
      st.worn[c.slot] = id;
      audio.pickup();
      events.onWear?.(id);
    } else if (kind === 'off' && c) {
      st.worn[c.slot] = null;
      audio.pickup();
      events.onWear?.(null);
    } else if (kind === 'pick') {
      events.onPickBuild?.(id);
      return;
    }
    render();
  }

  el.list.addEventListener('click', (e) => {
    const b = e.target.closest('.craft-item');
    if (!b) return;
    selected = b.dataset.id;
    render();
  });
  el.detail.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (b && !b.disabled) act(b.dataset.act);
  });
  el.tabs.forEach((t) => t.addEventListener('click', () => {
    tab = t.dataset.tab;
    selected = tab === 'craft' ? 'palmHat' : 'floor';
    render();
  }));

  // New materials unlock recipes; say which.
  function discover() {
    const before = new Set(Object.keys({ ...CLOTHING, ...GEAR, ...STATIONS, ...UPGRADES }).filter(unlocked));
    let any = false;
    for (const k in inventory.items) {
      if (inventory.items[k] > 0 && !st.found.has(k)) { st.found.add(k); any = true; }
    }
    if (!any) return;
    const fresh = Object.keys({ ...CLOTHING, ...GEAR, ...STATIONS, ...UPGRADES }).filter((id) => unlocked(id) && !before.has(id));
    if (fresh.length) events.onUnlock?.(fresh.map((id) => defOf(id).name));
  }

  const api = {
    get isOpen() { return open; },
    open(which = 'craft', bench = false) {
      discover();
      open = true;
      tab = which;
      atBench = bench;
      if (which === 'build' && !STATIONS[selected] && !UPGRADES[selected]) selected = 'floor';
      if (which === 'craft' && !CLOTHING[selected] && !GEAR[selected]) selected = 'palmHat';
      el.root.hidden = false;
      render();
    },
    close() {
      open = false;
      el.root.hidden = true;
    },
    tick(dt) {
      refresh -= dt;
      if (refresh > 0) return;
      refresh = 0.5;
      discover();
      if (open) { renderList(); renderSide(); }
    },

    isUnlocked: (id) => unlocked(id) && benchOk(id),
    lockReason(id) {
      if (!unlocked(id)) return missingText(id);
      if (!benchOk(id)) return 'Needs a crafting table';
      return '';
    },
    spearLevel() { return st.gear.has('metalSpear') ? 3 : st.gear.has('boneSpear') ? 2 : 1; },
    hookLevel() { return st.gear.has('metalHook') ? 2 : 1; },
    hasGear(id) { return st.gear.has(id); },
    worn(slot) { return st.worn[slot]; },
    sleeveColor() { return st.worn.body ? CLOTHING[st.worn.body].color : null; },
    // For tests: make or wear without the panel (bench recipes count as at the table).
    make(id) { selected = id; const b = atBench; atBench = true; act('craft'); atBench = b; },
    wear(id) { selected = id; act('wear'); },

    reset() {
      st.owned.clear();
      st.gear.clear();
      st.found.clear();
      st.worn = { head: null, body: null, legs: null };
      selected = 'palmHat';
    },
    serialize() {
      return { owned: [...st.owned], worn: { ...st.worn }, gear: [...st.gear], found: [...st.found] };
    },
    restore(d) {
      if (!d) return;
      st.owned = new Set(d.owned || []);
      st.gear = new Set(d.gear || []);
      st.found = new Set(d.found || []);
      st.worn = { head: null, body: null, legs: null, ...(d.worn || {}) };
    },
  };
  return api;
}
