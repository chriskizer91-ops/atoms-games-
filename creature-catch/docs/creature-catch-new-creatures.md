# Creature Catch: Adding Your Own Creatures

Anyone in the family can draw a creature and put it in the game. There are two ways:

- **The easy way:** send Claude the drawing (a photo is fine), its name, and the details in step 4. Claude turns it into game art, adds it, and builds a new version.
- **Doing it yourself:** follow the five steps below.

The game works out everything else on its own: stats, the moves it learns, where it shows up in the wild, its number in the Creature Log, its page in the Field Guide, and a shiny version.

---

## 1. Draw it

Tips that make drawings turn into great sprites:

- **Big, simple shapes** and a **clear face** (eyes matter most).
- **2 to 4 main colors.** Coloring it in helps a lot.
- **One thing that shows its type:** a flame tail (Fire), a leaf (Plant), a lightning mark (Bolt), a moon (Lumen), and so on.
- **Evolutions:** draw the same creature older, bigger and stronger, keeping its colors and its one special feature.

The 9 types are **Normal, Fire, Water, Plant, Earth, Bolt, Frost, Shadow, Lumen**. A creature can have one type or two.

---

## 2. Turn the drawing into game art

Use any image generator that takes attached pictures. Attach **two** pictures:

1. a photo of the drawing, and
2. one creature from the game, for the style (any file in `art/creatures/`, for example `tuftail.png` or `drizzlon.png`).

Then use this prompt, with the creature's name and a few words about it:

> Using the first attached image (a child's drawing) as the design, keep its shape, colors, special features and personality, and redraw it as a pixel art game sprite of a creature called **[NAME]**, **[a few words, for example: a small electric puppy with a lightning-shaped tail]**. Match the art style of the second attached image exactly: Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, cute and expressive, centered on a solid flat magenta #FF00FF background, no text, no shadow.

For an **evolved form** with no drawing of its own, attach the first form's new sprite instead and use:

> Using the attached sprite as reference for colors, markings and character design, draw its evolved form called **[NAME]**: bigger, older and more powerful, keeping the same colors and its signature feature, **[what changes, for example: a longer mane and crackling lightning around its paws]**. Game Boy Advance JRPG style, 64x64 pixels, front-facing 3/4 view, bold dark outline, limited 16-color palette, flat shading, centered on a solid flat magenta #FF00FF background, no text, no shadow.

**Moonborn and Keepers** (step 4) get a mark so players can spot them. Add one sentence before "Match the art style":

- a **Moonborn**: *"Add a small glowing pale-gold crescent-moon mark on its forehead (or chest, tail or wing), like a birthmark."*
- a **Keeper**: *"Make it bigger, older and more majestic, with a powerful stance and a glowing teal ancient rune mark somewhere on its body, filling the whole frame."*

A Keeper's picture is still 64x64. The game draws it bigger in battle, like every boss. (The expansion's image prompts file, section K, has the full Moonborn and Keeper prompts.)

**Save the picture with the creature's name** as the file name, for example `sparkpup.png` (or `sparkpup-drawn-by-sam.png`; anything that contains the name works).

---

## 3. Put the picture in the game's art

Put the pictures in a folder and run:

```
python3 tools/import-art.py <that folder>
```

The import tool finds each creature by its name, removes the magenta background, and shrinks it to true pixel size. (It reads the names from step 4, so do step 4 first.)

---

## 4. Add its block

Open `src/js/13b-family-creatures.js`. The top of the file shows every option. Add one block per creature inside `CC.FAMILY_CREATURES = [ ... ]`, for example:

```js
CC.FAMILY_CREATURES = [
  { name: 'Sparkpup', types: ['Bolt'], lives: 'forest', rarity: 'common', evolvesInto: 'Sparkhound', evolvesAt: 18,
    lore: 'A puppy whose fur crackles when it is happy.', drawnBy: 'Sam' },
  { name: 'Sparkhound', types: ['Bolt', 'Earth'], move: { name: 'Zap Bark', type: 'Bolt', power: 75 },
    lore: 'It races across the forest so fast its paws leave sparks.', drawnBy: 'Sam' },
];
```

What each line means:

| Line | What to write |
|---|---|
| `name` | Its name. Two creatures can't share a name. |
| `types` | One or two types, like `['Fire']` or `['Water', 'Frost']`. |
| `lives` | Where it shows up in the wild (only for a first form or a creature with no evolution): `meadow`, `grassland`, `forest`, `water`, `cave`, `desert`, `snow`, `swamp`, `ruins`, `spire`, one of the new places (`orchard`, `grove`, `cove`, `isle`, `copperbell`, `mine`, `springs`, `bayou`, `archive`, `temple`, `hollow`), `anywhere` for a **Moonborn**, or `nowhere`. |
| `keeper` | (Instead of `lives`) makes it the **Keeper** of a side area: `orchard`, `grove`, `cove`, `isle`, `mine`, `springs`, `bayou` or `archive`. See "Moonborn and Keepers" below. |
| `rarity` | `common`, `uncommon` or `rare`. Rare ones are harder to find and to catch. |
| `evolvesInto` | (Optional) the name of its next form. Give that one its own block. A line can be as long as you like. |
| `evolvesAt` | The level it evolves at, or `'sunshard'` / `'moonshard'` to evolve with a shard. |
| `style` | (Optional) its stat shape: `bal` (even), `tank`, `wall`, `bulk`, `atk` (hits hard), `fast`, `glass` (fast but frail). It's picked from its type if you leave it out. |
| `move` | (Optional) its own special move: a name, a type and a power from 40 to 100. Its evolved forms keep it. Without one, it learns a strong move of its type. |
| `lore` | A sentence or two for the Creature Log. |
| `drawnBy` | Who drew it. It shows in the Creature Log and the Field Guide. |

**Picking levels:** wild creatures in each place are these levels, so a first form that lives there should evolve a bit above them:

| Place | Wild levels |
|---|---|
| Meadow Path | 2 to 4 |
| Grassland | 4 to 7 |
| Forest | 5 to 10 |
| Lakeshore (`water`) | 8 to 13 |
| Crystal Cave | 12 to 18 |
| Sunscorch Desert | 16 to 22 |
| Frostpeak Pass (`snow`) | 20 to 26 |
| Murkmire Swamp | 24 to 30 |
| Night Ruins (`ruins`) | 28 to 35 |
| Willowbrook Orchard (`orchard`) | 5 to 8 |
| Whispering Grove (`grove`) | 8 to 12 |
| Driftwood Cove (`cove`) | 10 to 14 |
| Lantern Isle (`isle`) | 14 to 18 |
| Copperbell Town (`copperbell`) | 15 to 19 |
| Glimmer Mine (`mine`) | 18 to 24 |
| Steamvent Springs (`springs`) | 22 to 28 |
| Firefly Bayou (`bayou`) | 27 to 32 |
| Ancients' Archive (`archive`) | 31 to 36 |
| Moonlit Spire (after the story) | 38 to 48 |
| Dawn Temple (`temple`, after the story) | 40 to 45 |
| Hollow Deep (`hollow`, after the story) | 42 to 48 |
| Anywhere (a Moonborn) | the level of wherever it turns up |

Stats follow the place too: a creature from later places is stronger, the same way the game's own creatures are.

### Moonborn and Keepers

The game's lore has two special homes made just for the family's creatures (the expansion guide, section 7):

- **Moonborn** (`lives: 'anywhere'`): creatures the world dreamed up under the full moon. Every wild battle anywhere has a 3% chance to be a Moonborn instead, at that place's levels. After the Balance ending it's 6%. Its Creature Log page says it's Moonborn, and Tinker in Home Village has something to say once you catch one. A Moonborn's stats are mid-game, like a creature from the Crystal Cave.
- **Keepers** (`keeper: 'orchard'` and so on): one-of-a-kind guardians of a side area. A Keeper waits at its area's landmark: talk to the landmark and it rises up for a battle. Win, and it calms down; then you get a second battle where you can catch it (like Lunarion). If you lose the second one, it waits for you there. One Keeper per area, and each is stronger than any normal creature (a stat total of 430, or 460 for an evolved Keeper). Leave out `rarity` for a Keeper.

| Keeper of | It waits at | Its level |
|---|---|---|
| `orchard` | the Oldest Apple Tree | 14 |
| `grove` | Grandmother Oak | 18 |
| `cove` | the Sandbar Shipwreck | 20 |
| `isle` | the Lighthouse | 24 |
| `mine` | the Great Geode | 28 |
| `springs` | the Great Geyser | 32 |
| `bayou` | the Lantern Tree | 36 |
| `archive` | the Forbidden Shelf | 40 |

A Keeper can evolve too: give it `evolvesInto` and add a block for the evolved form, the same as any other creature.

---

## 5. Build and try it

```
node tools/build.mjs
```

Then in the game, open the code box (hold L + R and press MENU) and try:

- `ZOO` to see every creature, including yours (a pink name means its picture is missing)
- `GIVE SPARKPUP 15` to get one
- `WILD SPARKPUP 10` to battle one
- for a Keeper, `GOTO ORCHARD` (or its place) and talk to the landmark

If something's wrong in a block (a typo in a type, an evolution with no block, a name that's taken), the game still runs and skips that part. The browser's console (F12) says what to fix.

---

## Limits for now

- Evolutions go in a straight line (A to B to C). One creature splitting into two different evolutions isn't supported yet.
- Two types at most, from the nine above.
- One Keeper per side area. More Keeper spots (Copperbell's bell tower, Frostpeak's summit, Murkmire's deepest pool) can be added when the family has more Keepers than spots.
