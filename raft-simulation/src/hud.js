import * as THREE from 'three';

// Stroke icons on a 24-unit grid; colour comes from CSS currentColor.
const ICONS = {
  hook: '<circle cx="12" cy="4" r="2"/><path d="M12 6v10M12 16c-4 0-6-2-6-5M12 16c4 0 6-2 6-5M12 16v4"/><path d="M6 11l-1.5 1.5M18 11l1.5 1.5"/>',
  spear: '<path d="M4 20L16 8"/><path d="M15 5l5-1-1 5-3 1-2-2z" fill="currentColor"/><path d="M12.5 9.5l2 2"/>',
  hammer: '<path d="M5 20l8-8"/><path d="M10.5 6.5l4-4 7 7-4 4z" fill="currentColor" fill-opacity=".25"/><path d="M12 8l4 4"/>',
  coconut: '<circle cx="12" cy="13" r="7"/><circle cx="10" cy="11" r=".9" fill="currentColor"/><circle cx="14" cy="11" r=".9" fill="currentColor"/><circle cx="12" cy="14.5" r=".9" fill="currentColor"/><path d="M12 6c0-2 1-3 3-3"/>',
  health: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor" fill-opacity=".3"/>',
  hunger: '<path d="M2.5 12c3.2-4.3 8.4-5.3 12.5-2.6L20 6v12l-5-3.4C10.9 17.3 5.7 16.3 2.5 12z" fill="currentColor" fill-opacity=".3"/><circle cx="7.5" cy="11" r=".8" fill="currentColor"/>',
  thirst: '<path d="M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5z" fill="currentColor" fill-opacity=".3"/><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.6"/>',
  wood: '<path d="M3 8.5l15-3 1 3.5-15 3z" fill="currentColor" fill-opacity=".25"/><path d="M5 15l15-3 1 3.5-15 3z" fill="currentColor" fill-opacity=".25"/>',
  plastic: '<path d="M10 3h4v3l2 2.5V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8.5L10 6z" fill="currentColor" fill-opacity=".25"/><path d="M8 12h8"/>',
  fiber: '<path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14z" fill="currentColor" fill-opacity=".25"/><path d="M5 19l9-9"/>',
  scrap: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" fill="currentColor" fill-opacity=".25"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M12 3l7 12h-14z" fill="currentColor" stroke="none"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

const $ = (id) => document.getElementById(id);

export function createHud() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });

  const el = {
    hud: $('hud'),
    prompt: $('prompt'),
    promptKey: $('prompt-key'),
    promptText: $('prompt-text'),
    promptCost: $('prompt-cost'),
    charge: $('charge'),
    chargeFill: $('charge-fill'),
    alert: $('alert'),
    alertText: $('alert-text'),
    alertArrow: $('alert-arrow'),
    toasts: $('toasts'),
    vignette: $('vignette'),
    waterline: $('waterline'),
    goals: $('goal-list'),
    hint: $('tool-hint'),
    slots: [...document.querySelectorAll('#hotbar .slot')],
    coco: $('coco-count'),
    mats: {},
    vitals: {},
  };
  document.querySelectorAll('#materials .mat').forEach((m) => (el.mats[m.dataset.k] = m.querySelector('.n')));
  for (const k of ['health', 'hunger', 'thirst']) {
    const v = $(`v-${k}`);
    el.vitals[k] = { root: v, fill: v.querySelector('i'), num: v.querySelector('b') };
  }

  let alertState = null;
  let lastPromptKey = '';
  let hurtLevel = 0;
  const tmp = new THREE.Vector3();
  const lastInv = {};

  return {
    show(on) {
      el.hud.hidden = !on;
    },

    setVitals(s) {
      for (const k of ['health', 'hunger', 'thirst']) {
        const v = Math.max(0, Math.min(100, s[k]));
        const r = el.vitals[k];
        r.fill.style.transform = `scaleX(${v / 100})`;
        r.num.textContent = Math.ceil(v);
        r.root.classList.toggle('low', v < 25);
      }
    },

    setInventory(items) {
      for (const k in el.mats) {
        if (lastInv[k] !== items[k]) {
          el.mats[k].textContent = items[k];
          if (lastInv[k] !== undefined) {
            const row = el.mats[k].parentElement;
            row.classList.remove('bump');
            void row.offsetWidth;
            row.classList.add('bump');
          }
          lastInv[k] = items[k];
        }
      }
      el.coco.textContent = items.coconut;
      el.slots[3].classList.toggle('empty', items.coconut <= 0);
    },

    setSlot(i, hint) {
      el.slots.forEach((s, k) => s.classList.toggle('active', k === i));
      if (el.hint.textContent !== hint) el.hint.textContent = hint;
    },

    setPrompt(p) {
      const keyStr = p ? `${p.key}|${p.text}|${p.cost}|${p.ok}|${p.dim}` : '';
      if (keyStr === lastPromptKey) return;
      lastPromptKey = keyStr;
      if (!p) {
        el.prompt.hidden = true;
        return;
      }
      el.prompt.hidden = false;
      el.promptKey.hidden = !p.key;
      el.promptKey.textContent = p.key || '';
      el.promptText.textContent = p.text;
      el.promptCost.hidden = !p.cost;
      el.promptCost.textContent = p.cost ? (p.ok ? p.cost : `Need ${p.cost}`) : '';
      el.prompt.classList.toggle('missing', p.cost != null && !p.ok);
      el.prompt.classList.toggle('dim', !!p.dim);
    },

    setCharge(c) {
      el.charge.classList.toggle('on', c > 0);
      el.chargeFill.style.transform = `scaleX(${c})`;
    },

    setSwimming(on) {
      el.waterline.classList.toggle('on', on);
    },

    setGoals(goals, progress) {
      el.goals.innerHTML = goals
        .map((g) => {
          const n = Math.min(progress[g.id] || 0, g.target);
          const done = n >= g.target;
          const count = g.target > 1 ? `<span class="count">${n}/${g.target}</span>` : '';
          return `<li class="${done ? 'done' : ''}"><span class="box">${done ? icon('check') : ''}</span><span>${g.text}</span>${count}</li>`;
        })
        .join('');
    },

    // kind: 'danger' | 'good' | 'info'. follow() returns a world point for the arrow, or null.
    alert(text, { kind = 'danger', follow = null, duration = 4, until = null } = {}) {
      alertState = { text, kind, follow, t: duration, until };
      el.alert.hidden = false;
      el.alert.className = `alert-${kind}`;
      el.alertText.textContent = text;
    },

    toast(text, kind = 'gain') {
      const t = document.createElement('div');
      t.className = `toast toast-${kind}`;
      t.innerHTML = text;
      el.toasts.prepend(t);
      while (el.toasts.children.length > 5) el.toasts.lastChild.remove();
      setTimeout(() => t.classList.add('out'), 1800);
      setTimeout(() => t.remove(), 2400);
    },

    hurt(amount) {
      hurtLevel = Math.min(1, hurtLevel + amount / 30);
    },

    update(dt, camera) {
      hurtLevel = Math.max(0, hurtLevel - dt * 0.9);
      el.vignette.style.opacity = hurtLevel.toFixed(3);

      if (alertState) {
        alertState.t -= dt;
        const over = alertState.until ? alertState.until() && alertState.t < 0 : alertState.t < 0;
        if (over) {
          alertState = null;
          el.alert.hidden = true;
        } else {
          const p = alertState.follow?.();
          if (p) {
            tmp.copy(p);
            camera.worldToLocal(tmp);
            const ang = Math.atan2(tmp.x, -tmp.z);
            el.alertArrow.style.visibility = 'visible';
            el.alertArrow.style.transform = `rotate(${ang}rad)`;
          } else {
            el.alertArrow.style.visibility = 'hidden';
          }
        }
      }
    },

    clearAlert() {
      alertState = null;
      el.alert.hidden = true;
    },
  };
}
