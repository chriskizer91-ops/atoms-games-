import { CLOTHING, GEAR, STATIONS, COSTS, ITEMS } from './config.js';
import { icon } from './hud.js';

// The crafting panel (C or Tab): clothing for three slots, gear, and a
// reference for what the hammer builds. Owns what you have made and wear.

const SLOT_NAMES = { head: 'Head', body: 'Body', legs: 'Legs' };
const BUFF_TEXT = {
  insulation: (v) => `Warmth lost ${Math.round(v * 100)}% slower`,
  heatShield: () => 'No extra thirst in the midday sun',
  calm: (v) => `Sharks wait ${Math.round(v * 100)}% longer between attacks`,
  biteGuard: (v) => `Shark bites on you ${Math.round(v * 100)}% softer`,
  swim: (v) => `Swim ${Math.round(v * 100)}% faster`,
};
const CAPS = { insulation: 0.8, biteGuard: 0.6, calm: 0.8, swim: 0.6, heatShield: 1 };

const $ = (id) => document.getElementById(id);

export function createCrafting({ inventory, stats, audio, events }) {
  const st = { owned: new Set(), worn: { head: null, body: null, legs: null }, gear: new Set() };
  let open = false;
  let selected = 'palmHat';
  let refresh = 0;

  const el = { root: $('craft'), list: $('craft-list'), detail: $('craft-detail'), outfit: $('craft-outfit') };

  function costRows(cost) {
    return Object.entries(cost).map(([k, n]) => {
      const have = inventory.get(k);
      const ok = have >= n;
      return `<li class="${ok ? 'ok' : 'short'}"><span class="ci">${icon(k)}</span><span>${ITEMS[k]?.name || k}</span><b>${Math.min(have, n)}/${n}</b></li>`;
    }).join('');
  }

  function entryState(id) {
    if (CLOTHING[id]) {
      if (Object.values(st.worn).includes(id)) return { label: 'Wearing', cls: 'wearing' };
      if (st.owned.has(id)) return { label: 'Made', cls: 'owned' };
    }
    if (GEAR[id]?.once && st.gear.has(id)) return { label: 'Made', cls: 'owned' };
    if (STATIONS[id]) return { label: 'Hammer', cls: 'info' };
    const cost = CLOTHING[id]?.cost || GEAR[id]?.cost;
    return inventory.has(cost) ? { label: 'Can make', cls: 'ready' } : { label: '', cls: '' };
  }

  function renderList() {
    const group = (title, ids) => `<h4>${title}</h4>` + ids.map((id) => {
      const def = CLOTHING[id] || GEAR[id] || STATIONS[id];
      const s = entryState(id);
      return `<button type="button" class="craft-item ${s.cls} ${id === selected ? 'sel' : ''}" data-id="${id}"><span>${def.name}</span><em>${s.label}</em></button>`;
    }).join('');
    const bySlot = (slot) => Object.keys(CLOTHING).filter((id) => CLOTHING[id].slot === slot);
    el.list.innerHTML =
      group('Head', bySlot('head')) + group('Body', bySlot('body')) + group('Legs', bySlot('legs')) +
      group('Gear', Object.keys(GEAR)) + group('Built with the hammer', Object.keys(STATIONS));
  }

  function renderDetail() {
    const c = CLOTHING[selected], g = GEAR[selected], s = STATIONS[selected];
    const def = c || g || s;
    let actions = '';
    let sub = '';
    if (c) {
      sub = `Clothing · ${SLOT_NAMES[c.slot]}`;
      const wearing = st.worn[c.slot] === selected;
      if (!st.owned.has(selected)) actions = `<button type="button" data-act="craft" ${inventory.has(c.cost) ? '' : 'disabled'}>Make it</button>`;
      else actions = wearing ? '<button type="button" class="ghost" data-act="off">Take it off</button>' : '<button type="button" data-act="wear">Wear it</button>';
    } else if (g) {
      sub = g.once ? 'Gear · made once' : 'Gear · use it straight away';
      if (g.once && st.gear.has(selected)) actions = '<p class="done">Already made. It\'s in use.</p>';
      else actions = `<button type="button" data-act="craft" ${inventory.has(g.cost) ? '' : 'disabled'}>Make it</button>`;
    } else {
      sub = 'Built on the raft';
      actions = '<p class="done">Take out the hammer and right-click until it shows this, then click a floor piece.</p>';
    }
    const buffs = c ? Object.entries(c.buffs).map(([k, v]) => `<li>${BUFF_TEXT[k](v)}</li>`).join('') : '';
    el.detail.innerHTML = `
      <p class="label">${sub}</p>
      <h3>${def.name}</h3>
      <p class="desc">${def.text}</p>
      ${buffs ? `<ul class="buffs">${buffs}</ul>` : ''}
      <ul class="cost">${costRows(c?.cost || g?.cost || COSTS[selected])}</ul>
      <div class="acts">${actions}</div>`;
  }

  function renderOutfit() {
    const b = api.buffs();
    const lines = Object.entries(b).filter(([, v]) => v > 0).map(([k, v]) => `<li>${BUFF_TEXT[k](v)}</li>`).join('');
    el.outfit.innerHTML = `<p class="label">Wearing</p>` +
      Object.keys(SLOT_NAMES).map((slot) => `<div class="slotrow"><span>${SLOT_NAMES[slot]}</span><b>${st.worn[slot] ? CLOTHING[st.worn[slot]].name : '—'}</b></div>`).join('') +
      `<p class="label" style="margin-top:14px">Effects</p><ul class="buffs">${lines || '<li class="none">Nothing yet. Make something to wear.</li>'}</ul>`;
  }

  function render() {
    renderList();
    renderDetail();
    renderOutfit();
  }

  function act(kind) {
    const c = CLOTHING[selected], g = GEAR[selected];
    if (kind === 'craft') {
      const cost = c?.cost || g?.cost;
      if (!inventory.has(cost)) { audio.error(); return; }
      inventory.spend(cost);
      audio.build();
      if (c) {
        st.owned.add(selected);
        if (!st.worn[c.slot]) st.worn[c.slot] = selected;
      } else if (selected === 'bandage') {
        stats.health = Math.min(100, stats.health + 30);
      } else {
        st.gear.add(selected);
      }
      events.onCraft?.(selected);
    } else if (kind === 'wear' && c) {
      st.worn[c.slot] = selected;
      audio.pickup();
      events.onWear?.(selected);
    } else if (kind === 'off' && c) {
      st.worn[c.slot] = null;
      audio.pickup();
      events.onWear?.(null);
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

  const api = {
    get isOpen() { return open; },
    open() {
      open = true;
      el.root.hidden = false;
      render();
    },
    close() {
      open = false;
      el.root.hidden = true;
    },
    // Keeps the panel current while it is open (materials can arrive meanwhile).
    tick(dt) {
      if (!open) return;
      refresh -= dt;
      if (refresh <= 0) { refresh = 0.5; renderList(); renderOutfit(); }
    },

    buffs() {
      const b = { insulation: 0, heatShield: 0, calm: 0, biteGuard: 0, swim: 0 };
      for (const id of Object.values(st.worn)) {
        if (!id) continue;
        for (const [k, v] of Object.entries(CLOTHING[id].buffs)) b[k] += v;
      }
      for (const k in b) b[k] = Math.min(b[k], CAPS[k]);
      return b;
    },
    hasGear(id) { return st.gear.has(id); },
    worn(slot) { return st.worn[slot]; },
    sleeveColor() { return st.worn.body ? CLOTHING[st.worn.body].color : null; },
    // For tests and debugging.
    make(id) { selected = id; act('craft'); },
    wear(id) { selected = id; act('wear'); },

    reset() {
      st.owned.clear();
      st.gear.clear();
      st.worn = { head: null, body: null, legs: null };
      selected = 'palmHat';
    },
    serialize() {
      return { owned: [...st.owned], worn: { ...st.worn }, gear: [...st.gear] };
    },
    restore(d) {
      if (!d) return;
      st.owned = new Set(d.owned || []);
      st.gear = new Set(d.gear || []);
      st.worn = { head: null, body: null, legs: null, ...(d.worn || {}) };
    },
  };
  return api;
}
