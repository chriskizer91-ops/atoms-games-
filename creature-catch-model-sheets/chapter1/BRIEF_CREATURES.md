# Brief: Chapter 1's wild creatures

You're building game-ready 3D models of Creature Catch creatures with the paint-and-bake method,
small-model-only route. It's the same job as round 3, which built Mossback, Embroak, Clovermouse, Puffmunk
and Fleecling.

## Read first

1. `creature-catch-model-sheets/round3/BRIEF.md`: the full creature brief, with its environment, rules,
   steps, glow and relief advice, lessons and deliverables. **Everything in it applies**, except the
   inputs, output folder and names below.
2. `creature-catch-model-sheets/round3/README.md`, plus `NOTES.md` in each `round3/<creature>/` folder:
   what round 3 learned, and the builders' tool options. Start from round 3's improved tool copies in
   `round3/<creature>/tools/`, copied into your own `tools/` folder.

## The rules, again

- **No git commands at all.**
- **Don't edit shared files.** That means `pipeline/`, `round2/`, `round3/`, other folders in `chapter1/`
  and the source pictures.
- **Run only one Blender job at a time.** Other builders share this 4-core machine.

## Effort

- **Aim for round 3's quality.**
- **Budget about 30 to 40 minutes, and at most about five small-route runs, per creature.**
- **Stop when it reads well from the front three-quarter view,** and list what's left in `NOTES.md`.

## Inputs

The pictures are in `creature-catch-model-sheets/chapter1/source/<id>/`: `<id>_sheet.png`, `_front.png`,
`_side.png` (facing left), `_back.png` and `_top.png` (head at the top). The lead has checked them. The
prompts are in `chapter1/picture-request-chapter1.html`.

| id | Creature | H for make_views | Notes | Skeleton plan |
| --- | --- | --- | --- | --- |
| `dewt` | Dewt | 0.25 m (0.75 m long with its tail) | Glossy light-blue newt, bubble bumps along its head, back and tail, four splayed legs, long tail curling up at the tip | four-legged |
| `dandylion` | Dandylion | 0.65 m (to the top of the mane) | Golden lion cub, a big round mane of white seed puffs, tail ending in a yellow flower tuft | four-legged |
| `wormapple` | Wormapple | 0.45 m (to the top of the leaf) | A shiny red apple with a stem and leaf, and a green worm poking out of a hole in the front | round |
| `scarecrowl` | Scarecrowl | 0.75 m (to the hat tip; wings 1.0 m tip to tip) | Crow in a tattered straw hat, wings held straight out flat like a scarecrow, orange scarf, two orange bird legs | bird (new) |

Build them in that order.

**Second batch** (a second builder):

| id | Creature | H for make_views | Notes | Skeleton plan |
| --- | --- | --- | --- | --- |
| `tuftail` | Tuftail | 0.55 m (to the ear tips; 0.9 m long with its tail) | Orange fox, a big tail of chunky grass clumps curving up behind | four-legged |
| `pebblepup` | Pebblepup | 0.45 m (0.65 m long) | Grey-brown puppy, stone patches, floppy ears, tongue out, pebble on its nose, curled tail | four-legged |
| `bumblop` | Bumblop | 0.5 m (to the antenna tips) | Round striped bee-bunny ball, long floppy ears at its sides, antennae with yellow balls, two solid wings, tiny feet. Its views are square. | round, with wings |
| `hopsprout` | Hopsprout | 0.45 m (to the antenna tips; 0.65 m long) | Lime grasshopper, a two-leaf sprout on its head, thick antennae, wings folded along its back, six chunky legs (big back legs folded, knees up) | bug (new) |

Build them in that order.

**Glow:**
- **Scarecrowl's orange eyes** may glow softly.
- **Everything else:** nothing glows. Dandylion's yellow fur and Scarecrowl's orange scarf must stay dark
  on the glow map.

## Name the parts for the skeleton

**Four-legged (Dewt, Dandylion):** as in round 3.
- `head` for the head, `front_leg` and `rear_leg` mirrored pairs, `body` for the body, `tail` pieces.
- **Dandylion's mane:** name it `head_puffs`. Not "mane": that word ties a part to the chest.
- **Dandylion's tail tuft:** `tail_tuft`.

**Round (Wormapple):**
- **The apple:** `body`.
- **The worm:** `head`. It's what moves and looks around, and the face is on it.
- **The stem and leaf:** `body_stem` and `body_leaf`, so they stay with the apple.

**Four-legged (Tuftail, Pebblepup):**
- **Ears:** `ear` pairs, which ride on the head.
- **Pebblepup's tongue:** `head_tongue`. **Its pebble:** `head_pebble`.
- **The tails:** `tail` pieces. Split Pebblepup's curl into two or three pieces.

**Round with wings (Bumblop):**
- **The ball:** `body`. Its face is on the body, as on Mushling.
- **Ears and antennae:** `ear` pairs and `head_antenna` pairs. They ride on the "head" bone, which bobs
  on top of the ball.
- **Wings:** a `wing` pair, which the lead will make flutter.
- **Feet:** a `foot` pair.

**Bug (Hopsprout)**, a new skeleton the lead is adding:
- **Head:** `head`, `head_sprout`, and a `head_antenna` pair.
- **Body:** `body` (one piece, or `body_front` and `body_back`).
- **Folded wings:** `body_wing`. They stay with the body.
- **Legs, as mirrored pairs:** `front_leg`, `mid_leg` and `rear_leg`. The big back legs are `rear_leg`.

**Bird (Scarecrowl)**, a new skeleton the lead is adding:
- **The trunk and head:** `body`, `body_scarf`, `head`, `head_hat`, `head_beak`.
- **Limbs, as mirrored pairs:** `wing` (the whole flat wing), `leg` (from the body down to the ankle),
  `foot` (the three-toed foot).
- **Tail feathers:** `tail`, if they're their own part.

## Deliverables

As in round 3, in `creature-catch-model-sheets/chapter1/<id>/`: the `.glb`, the three textures,
`parts.json`, `views.json`, repaired pictures, `tools/`, both boards, the blockout board, `closeups.jpg`
and `NOTES.md`.

Your work folder is `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/<id>/`.
Leave each final `model.blend` there and list its path in your reply.

When you finish, reply with a short summary per creature: the numbers, the paths, and your honest view of
how it compares with round 3.
