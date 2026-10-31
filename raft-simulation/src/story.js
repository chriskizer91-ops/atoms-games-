// Messages in bottles. Someone drifted out here before you and wrote
// down what they learned. The notes are read in order, whichever bottle you
// find; the last one marks a lighthouse on your map. Light its lamp and a
// ship comes. After that you can keep sailing as long as you like.

export const NOTES = [
  {
    title: 'The first bottle',
    body: [
      'If anyone finds this: my name is Wren Calloway. I was the radio officer on the cargo ship Marigold until the storm took her.',
      'I have a few planks, a hook on a rope and too much time. Everything that floats past is worth hooking. Plastic is worth more than you think.',
      'I am writing this so I keep counting the days. Day four.',
    ],
  },
  {
    title: 'Land',
    body: [
      'Found an island today. Small, but it had palms, and wild potatoes growing under a bush. I ate two raw. Do not recommend.',
      'I kept the little eyes off the potatoes. If I can find soil, I can grow more. Clay off the beach, wood for a box.',
    ],
  },
  {
    title: 'The grey one',
    body: [
      'The shark remembers. Every time I drive it off it comes back with a new scar and more temper.',
      'Keep a spear near the edge. Keep wood for repairs. A raw fish thrown wide buys you time.',
    ],
  },
  {
    title: 'Red rocks',
    body: [
      'Some of the rocks on the bigger islands are rusty red. That is ore. A kiln of stone and clay, fed with wood, melts it into metal.',
      'Sand melts too. I have glass now. I sat and looked through it for an hour.',
    ],
  },
  {
    title: 'Wind',
    body: [
      'The current only ever goes one way: north. The wind does not care about the current.',
      'Bamboo for a mast, rope, and every sheet of plastic I had. Now I choose where I go. Chart every island you pass; you will want to go back.',
    ],
  },
  {
    title: 'Higher',
    body: [
      'Built a tower on the raft out of driftwood and bamboo. It sways like a drunk, but from the top I can see twice as far.',
      'Islands I would have drifted right past.',
    ],
  },
  {
    title: 'A light',
    body: [
      'Three nights now I have seen it. Low on the horizon, north and a little east. It turns. Stars do not turn.',
      'I am going to find it. If this is the last bottle you read from me, I hope it means I did.',
    ],
  },
  {
    title: 'The lighthouse',
    body: [
      'It is a lighthouse. Old, on a big island, the keeper long gone. The lamp still works if you feed it, and every ship lane in this sea can see it.',
      'I lit it and a ship came in two days. I am going home.',
      'I have marked it on your map. Go and light it. Someone will come for you too. — W.',
    ],
    reveal: true,
  },
];

export function createStory() {
  const st = { read: 0, nextBottle: 150, lit: false, ended: false };

  return {
    get state() { return st; },
    get read() { return st.read; },
    get done() { return st.read >= NOTES.length; },
    get lit() { return st.lit; },

    reset() {
      Object.assign(st, { read: 0, nextBottle: 150, lit: false, ended: false });
    },

    // The next note to read, and move on.
    readNext() {
      if (st.read >= NOTES.length) return null;
      const note = NOTES[st.read];
      st.read++;
      return { ...note, n: st.read, of: NOTES.length };
    },

    // A bottle floats by every so often until all the notes are found.
    tick(dt) {
      if (st.read >= NOTES.length) return false;
      st.nextBottle -= dt;
      if (st.nextBottle <= 0) {
        st.nextBottle = 240 + Math.random() * 120;
        return true;
      }
      return false;
    },

    light() {
      if (st.lit) return false;
      st.lit = true;
      return true;
    },

    serialize() { return { ...st }; },
    restore(d) { if (d) Object.assign(st, d); },
  };
}
