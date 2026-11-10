# Brief: the nine other people (Chapter 1, batch 2)

You're building game-ready 3D models of Creature Catch's townspeople with the paint-and-bake method,
small-model-only route. The two heroes were the first people made this way. Do these the same way, using
what that build learned.

## Read first, in this order

1. `creature-catch-model-sheets/chapter1/BRIEF_PEOPLE.md`: the full people brief, with its environment,
   rules, steps, "Watch out" list and deliverables. **Everything in it applies**, except the inputs and
   names below.
2. `creature-catch-model-sheets/chapter1/README.md`, `chapter1/player-a/NOTES.md` and
   `chapter1/player-b/NOTES.md`: what worked on people. In short:
   - Trace with hand-drawn smooth outlines.
   - Hair is one upward-sliced mass with a separate fringe, and only the 4 to 6 biggest locks get their own
     parts.
   - Watch for paint printing onto the wrong part. The heroes needed fixes for fingers on the thigh, the
     cube on both hips, and skin on the hair.
3. The heroes' improved tool copies, in `chapter1/player-a/tools/` and `chapter1/player-b/tools/`. They
   add `ring_ease`, a gentler `grain`, `paint_color_skip`, `inpaint_skin.py`, `closeups.py`,
   `mkparts.py` and `redo_views.sh`. Start from these. Don't edit them in place: copy them into your own
   `tools/` folder.

## The rules, again

- **No git commands at all.**
- **Don't edit shared files.** That means `pipeline/`, `round2/`, `round3/`, the heroes' folders, other
  people's folders and the source pictures.
- **Run only one Blender job at a time.** Two other builders share this 4-core machine.

## Effort

- **Aim for the heroes' quality: a clean face and clean clothes.** Don't chase the last percent of
  outline overlap.
- **Budget about 30 to 40 minutes, and at most about five small-route runs, per person.**
- **Stop when it reads well from the front three-quarter view,** and list what's left in `NOTES.md`.

## Inputs

The pictures are in `creature-catch-model-sheets/chapter1/source/<id>/`, the same five pictures as for the
heroes: `<id>_sheet.png`, `_front.png`, `_side.png` (facing left), `_back.png` and `_top.png` (face and
toes toward the top). The lead has checked all of them. The prompts are in
`chapter1/picture-request-chapter1.html`.

| id | Person | H for make_views (lowest to highest point) | What's special |
| --- | --- | --- | --- |
| `rosa` | Rosa, the innkeeper | 1.6 m (to the top of the bun) | Bun, red dress to mid-calf, white apron with a bow at the back |
| `hazel` | Hazel, the healer | 1.62 m (to the top of the head and bow) | Long wavy hair down her back with a pink bow, mint dress and apron, satchel on a strap, socks and shoes |
| `fern` | Fern, the Outpost healer | 1.6 m (to the top of the curls) | Curly red hair with a leaf clip, green pinafore dress over a white blouse, boots |
| `willow` | Elder Willow | 1.6 m (to the top of his head) | Bald with white side hair, long white beard, green leaf-pattern robe to the ankles, belt |
| `oakley` | Ranger Oakley | 1.85 m (to the top of the hat and feather) | Wide-brimmed hat with a feather, long green cloak, tunic, compass on the belt, tall boots |
| `bramble` | Farmer Bramble | 1.75 m (to the top of the hat) | Wide straw hat, moustache, red bandana, blue overalls, big boots, broad build |
| `pip` | Pip, the shopkeeper | 1.35 m (to the top of the curls) | Short and round, curly lavender hair, round glasses, striped apron to the thigh |
| `tinker` | Tinker, a village kid | 1.2 m (to the top of the tuft) | Spiky blond hair with a tuft tied on top, yellow t-shirt, shorts, socks, shoes |
| `farmkid` | The farm kid | 1.25 m (to the top of the hair) | Messy light-brown hair, blue tunic with a laced collar, brown trousers, boots |

## New part names for clothes the heroes didn't have

All the names in `BRIEF_PEOPLE.md` still apply, plus these. The first match wins, in this order:

| Word in the name | Moves with | Use it for |
| --- | --- | --- |
| `ponytail` | a swaying two-bone chain from the head | Tinker's tuft on top; Hazel's long back hair (`ponytail_long`) |
| `skirt`, `dress`, `robe` | the hips, and it swings with the legs | the part of a dress, apron or robe **below the waist**: `skirt`, `skirt_apron`, `skirt_robe` |
| `cloak`, `cape` | hangs from the shoulders | Oakley's cloak |
| `satchel`, `bag` | the hips | Hazel's satchel |
| `hat`, `beard`, `moustache`, `glasses`, `bun` | the head | hats, Willow's beard, Bramble's moustache, Pip's glasses, Rosa's bun |
| `collar` | the upper chest | Bramble's bandana (`collar_bandana`) |
| `belt` | the hips | Oakley's compass (`belt_compass`) |

- **Split the top and bottom of dresses and robes.** The part above the waist is `torso`, and must not
  contain the word "robe", "dress" or "skirt". The part below the waist is the `skirt…` part.
- **Willow's robe** is `torso` plus `skirt_robe`.
- **Legs under skirts:** under long skirts and robes, the legs can be short hidden stubs plus the
  shoes/boots. They still need to be `leg_L`/`leg_R` pairs so the walk works.

## Deliverables

As in `BRIEF_PEOPLE.md`, in `creature-catch-model-sheets/chapter1/<id>/`: the `.glb`, the three textures,
`parts.json`, `views.json`, repaired pictures, `tools/`, both boards, the blockout board, `closeups.jpg`
and `NOTES.md`.

Your work folder is `/tmp/claude-0/-home-user-atoms-games-/95c47fc1-cd5e-5362-b776-c463cbad3789/scratchpad/chapter1/<id>/`.
Leave each final `model.blend` there and list its path in your reply.

When you finish, reply with a short summary per person: the numbers, the paths, and your honest view of
how it compares with the heroes.
