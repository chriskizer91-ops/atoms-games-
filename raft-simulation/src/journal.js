import { FISH_KINDS } from './fishing.js';
import { NOTES } from './story.js';

// The logbook (J): what you've caught, what you've seen, what you've found,
// and the messages you've read, to read again. Everything in it is something
// that happened to you.

const $ = (id) => document.getElementById(id);

export const SIGHTS = {
  gulls: { name: 'Gulls', text: 'Where there are gulls there is land, or fish. They ride the wind over the raft for the scraps.' },
  dolphins: { name: 'Dolphins', text: 'They come up from astern when the raft is making way, ride alongside for the fun of it, and leave when they like.' },
  whale: { name: 'A whale breaching', text: 'Forty tonnes clear of the water. Nobody is sure why they do it: to shed barnacles, to be heard, or because they can.' },
  turtle: { name: 'A sea turtle', text: 'It came up for one breath, looked the raft over and went back down. They cross whole oceans to lay on the beach they hatched on.' },
  jellyfish: { name: 'Glowing jellyfish', text: 'By night the water is full of slow lanterns. They glow when the sea is stirred.' },
  flyingfish: { name: 'Flying fish', text: 'A burst of silver off a wave top and a long glide on stiff fins.' },
  rainbow: { name: 'A rainbow', text: 'After rain, with the sun behind you.' },
  meteor: { name: 'A shooting star', text: 'On a clear night, if you happen to be looking up.' },
  lightning: { name: 'Forked lightning', text: 'Count the seconds to the thunder: three to the kilometre.' },
  reef: { name: 'A reef shark', text: 'Curious and stubborn. It remembers every scar you give it.' },
  hammerhead: { name: 'A hammerhead', text: 'That wide head is full of sensors: it can feel the heartbeat of a fish buried in sand.' },
  lighthouse: { name: 'The lighthouse', text: 'Old, on a big island, the keeper long gone.' },
  smoke: { name: 'Smoke on the horizon', text: 'A thin grey line rising where no cloud should be. Someone is keeping a fire.' },
};

export function createJournal({ story, islands, getDay }) {
  const st = { fish: {}, seen: {}, treasure: 0, treasures: [], coins: 0, seaChart: false };
  const el = { root: $('journal'), body: $('journal-body') };
  let open = false;

  function render() {
    const fishRows = Object.keys(FISH_KINDS).map((k) => {
      const f = FISH_KINDS[k], c = st.fish[k];
      return c
        ? `<li class="got"><b>${f.name}</b><span>${c.n} caught · biggest ${c.best.toFixed(1)} kg</span><p>${f.fact}</p></li>`
        : '<li class="not"><b>???</b><span>not caught yet</span></li>';
    }).join('');
    const seenRows = Object.keys(SIGHTS).map((k) => (st.seen[k]
      ? `<li class="got"><b>${SIGHTS[k].name}</b><span>day ${st.seen[k]}</span><p>${SIGHTS[k].text}</p></li>`
      : '<li class="not"><b>???</b><span>not seen yet</span></li>')).join('');
    const chart = [...islands.state.chart.values()];
    const notes = NOTES.slice(0, story.read).map((n, i) => `<details><summary>${i + 1}. ${n.title}</summary>${n.body.map((p) => `<p>${p}</p>`).join('')}</details>`).join('')
      || '<p class="dim">No bottles found yet. Watch for something glinting in the water.</p>';
    const nFish = Object.keys(st.fish).length, nSeen = Object.keys(st.seen).length;
    el.body.innerHTML = `
      <section><h3>The voyage</h3><ul class="facts">
        <li><b>${getDay()}</b><span>days at sea</span></li>
        <li><b>${chart.filter((r) => r.seen).length}</b><span>islands charted</span></li>
        <li><b>${chart.filter((r) => r.visited).length}</b><span>islands landed on</span></li>
        <li><b>${st.treasure}</b><span>chests dug up</span></li>
        <li><b>${st.coins}</b><span>gold coins</span></li>
        <li><b>${story.read} / ${NOTES.length}</b><span>messages read</span></li>
      </ul>${st.treasures.length ? `<p class="dim">Found in chests: ${st.treasures.join(', ')}.</p>` : ''}</section>
      <section><h3>Fish <small>${nFish} of ${Object.keys(FISH_KINDS).length}</small></h3><ul class="book">${fishRows}</ul></section>
      <section><h3>Things seen <small>${nSeen} of ${Object.keys(SIGHTS).length}</small></h3><ul class="book">${seenRows}</ul></section>
      <section><h3>Messages in bottles</h3>${notes}</section>`;
  }

  return {
    state: st,
    get isOpen() { return open; },
    // A fish landed. Returns { first, best }: the first of its kind, or the biggest yet.
    catchFish(kind, kg) {
      const c = st.fish[kind] || (st.fish[kind] = { n: 0, best: 0 });
      const first = c.n === 0, best = kg > c.best;
      c.n++;
      if (best) c.best = kg;
      return { first, best };
    },
    // Something seen for the first time? (Returns true only the first time.)
    see(key) {
      if (st.seen[key] || !SIGHTS[key]) return false;
      st.seen[key] = getDay();
      return true;
    },
    foundTreasure(what, coins = 0) { st.treasure++; st.coins += coins; if (what) st.treasures.push(what); },
    open() { open = true; render(); el.root.hidden = false; el.body.scrollTop = 0; },
    close() { open = false; el.root.hidden = true; },
    reset() { st.fish = {}; st.seen = {}; st.treasure = 0; st.treasures = []; st.coins = 0; st.seaChart = false; },
    serialize() { return JSON.parse(JSON.stringify(st)); },
    restore(d) { if (d) Object.assign(st, { fish: d.fish || {}, seen: d.seen || {}, treasure: d.treasure || 0, treasures: d.treasures || [], coins: d.coins || 0, seaChart: !!d.seaChart }); },
  };
}
