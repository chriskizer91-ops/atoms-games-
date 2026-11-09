# Chapter 1 in 3D: the people

The plan for the playable Chapter 1 demo:
- **The game:** the earlier demo's game (branch `first-3d-demo`), with every model replaced by a painted
  paint-and-bake model.
- **Towns:** the diorama look, with the 2D game's own ground.
- **Battles:** the 2D game's own painted backgrounds.
- **Buildings, furniture and props:** modelled from the game's art and covered with painted texture
  sheets.

The full list is in `../CHAPTER1_MODEL_LIST.md`.

## The two heroes: the first people made with paint-and-bake

![The two heroes in the Meadow Path clearing](heroes_results.jpg)

*The boy and the girl standing, the girl waving, and the boy throwing a capture cube.*

| Hero | Triangles | Outline overlap front / side / back | Texture seen by a picture | Build time |
| --- | --- | --- | --- | --- |
| Boy (`player-a`) | 7,000 (44% on the head and hair) | 92.3 / 88.9 / 89.3% | 60% | about 60 min |
| Girl (`player-b`) | 6,952 (54% on the head, hair and ponytail) | 91.9 / 91.4 / 88.5% | 65% | about 40 min |

**How well people work:**
- **Faces:** very well. They're clean, with no ghost eyes, and from the front three-quarter view each
  reads like its sheet's hero view.
- **Clothes:** very well. The four pictures agreed closely, so the jacket, vest, straps, belt, pockets
  and boots print cleanly.
- **Hair:** the weak point. Spiky or loose hair is almost all outline, and smooth parts carry only part of
  it. Both heroes' hair is a rounder, puffier mass with the spikes and strands painted on, and over the
  temples it looks a little like a helmet. The girl's is the more noticeable.
- **Hands:** soft mittens with the fingers painted on, as planned, which keeps them simple to animate.

**Usage:** one helper built both heroes, using about 394,000 tokens in all, or about 197,000 per person.
That's in line with the creatures.

## The two-legged skeleton

Both heroes are animated with the new two-legged skeleton (`../pipeline/ANIMATION.md`, "People"):
- **Actions:** stand, walk, run, talk, wave, throw a cube, point, cheer and lose.
- **The ponytail:** the girl's has its own two bones, so it sways.

![The girl's clips](animation/player-b_poses.jpg)

## In the Battle Bay

The heroes are the first two picks in the Creature Battle Bay. People get action buttons instead of
moves. "Throw a cube" launches a capture cube made in code: a purple lid, a blue base, a glowing seam and
a white button. It lands on the battle pad and pops open with a flash. This is the first object made the
new way, from the game's own art with no reference picture.

## What the next people should know

From the builder's notes (`player-a/NOTES.md` and `player-b/NOTES.md`):
- **Trace by hand:** trace people with hand-drawn smooth outlines, not the picture's own outline. Folds in
  the clothes otherwise turn into rings.
- **Hair:** use one hair mass sliced upward, whose front edge steps back from the forehead to behind the
  ears. Add a separate fringe part. Give only the 4 to 6 biggest spikes, locks or curls their own flat
  parts.
- **Paint on the wrong part:** watch for one part's paint printing onto another. Here, the side picture's
  fingers printed onto the thigh, the cube printed on both hips, and skin printed onto the hair. The
  builder added options to switch these off.
- **The top pictures:** for people they show a different pose (arms stretched out), so use them only to
  paint the crown of the hair.
- **Ideas to try for better hair:**
  - more hair parts, with a bigger triangle share
  - asking the picture prompts for simpler, chunkier hair shapes (a few big locks, not many thin strands)

## Files

- `source/<id>/`: the five pictures per hero.
- `<id>/`, each holding:
  - the game model (`<id>.glb`)
  - the animated model (`<id>_animated.glb`)
  - the textures, `parts.json`, `views.json` and `rig.json`
  - the boards and `closeups.jpg`
  - `animation_manifest.json`
  - `NOTES.md`
  - `tools/`
- `animation/`: pose sheets.
- The picture requests:
  - `picture-request-main-characters.html`: the two heroes.
  - `picture-request-chapter1.html`: the 8 creatures, the 10 other people and the 8 texture sheets.
  - `make_picture_requests.py` makes both, from the reference images in `reference/`.
- `BRIEF_PEOPLE.md`: the builder's brief.
