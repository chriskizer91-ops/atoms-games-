# The animation system

Built once and reused for every creature. It's the 3D version of how the 2D game animates battles:
every move uses a shared motion picked by the move's kind (`06-battle.js` `moveAnim`), and the effects
are picked by the move's type.

![Battle viewer](../round2/animation/battle_viewer.jpg)

## How a creature gets animated

1. **A setup file, `rig.json`, next to its `parts.json`.** The plan is the body type (`quad` or
   `round` so far). Example: `{"plan": "quad", "wings": true}`. Part roles are optional: the tool reads
   them from the part names (legs, head, tail, wing, arm, foot, body...).
2. **Run the tool:**
   `python -I pipeline/animate.py model.blend rig.json OUT.glb --albedo albedo.jpg --normal normal.png --emit emissive.jpg --preview PREVIEW_DIR --manifest manifest.json`
   1. It fits the body type's skeleton to where the parts actually are.
   2. It ties each part to its bones: legs blend at the knee, tails and wings along their length.
   3. It keys in every shared clip, scaled to the creature's size.
   4. It exports the game file and a manifest. The manifest holds the anchors for effects (mouth, chest,
      paws, tail tip, wing tips) and the clip lengths.
3. **The creature's moves come from the game data** (`game_data.json`, extracted by
   `extract_game_data.cjs` from the game's own data files). Each move is mapped to a clip with
   `motions.move_clip()`, following the 2D game's rules:

| Move | Clip | Effects (by the move's type) |
| --- | --- | --- |
| Status move on itself (Rally, Guard Up...) | `boost` (defence boosts: `boost_guard`) | Rising orange arrows, glow pulse, a swirl of its type |
| Status move on the foe (Growl, Soak, Dazzle...) | `status` | A stream of its type toward the foe, falling blue arrows there |
| Strong, or power 70+, physical (Normal or Earth) | `strong_physical`: rear up and slam | Charge, ground shockwave, screen flash, big burst |
| Strong, or power 70+, anything else | `strong_special`: charge, swell, burst | Charge, glow, a blast from the mouth, screen flash |
| Physical (Normal, Earth, signature moves that crit or hit several times) | `physical`: a lunge | A burst at the foe (rocks for Earth) |
| Anything else | `special`: a head-thrust stream | A stream from the mouth, a burst at the foe |

Every creature also gets `idle`, `walk`, `hit` (white flash three times and a shake), `faint` (it sinks
and dissolves into its type's colours) and `send_out` (it pops in with a squash). A creature can carry
extra clips named after a move id, like Coalossus's `coal_swipe`; those play instead of the shared clip.

**The effect for each type** comes from the game's own `TYPE_FX` and `TYPE_COLORS`:

| Type | Effect |
| --- | --- |
| Fire | Embers rising |
| Water | Droplets falling |
| Plant | Fluttering leaves |
| Earth | Thrown rocks and dust |
| Bolt | Jittery sparks |
| Frost | Drifting flakes |
| Shadow | Purple wisps |
| Lumen | Gold stars |
| Normal | White stars |

## Body types

The game tags every one of its 172 creatures with a body type (`look.body`):

| Body type | Creatures | Status |
| --- | --- | --- |
| `quad` (four-legged) | 47 | **Done**, with optional wings (Drizzlon, Lunarion, Coalossus) |
| `round` | 23 | **Done** (Mushling) |
| `bird` | 22 | To do |
| `bug` | 19 | To do |
| `serpent` | 19 | To do |
| `ghost` | 13 | To do |
| `biped` (two-legged) | 12 | To do |
| `frog` | 7 | To do |
| `fish` | 6 | To do |
| `turtle` | 4 | To do; can likely start from `quad` |

**Adding a body type** is a one-time job:
- a skeleton fit in `animate.py` (`fit_<plan>` and `weights_<plan>`)
- its clips in `motions.py`, with the same clip names

After that, every creature of that type needs only its `rig.json`.

## Files

| File | What |
| --- | --- |
| `motions.py` | The shared clips for each body type, and the move-to-clip rules |
| `animate.py` | Fits the skeleton, sets the weights, keys the clips, exports the game file and the manifest |
| `game_data.json`, `extract_game_data.cjs` | Every move (type, tier, power, effects) and every creature's move list and body type, from the game |
| `../round2/animation/creature-battle-bay.html` | The battle viewer page: picks a creature, plays its moves, walk, hit, faint, send out. The published copy loads its data files alongside it. |
