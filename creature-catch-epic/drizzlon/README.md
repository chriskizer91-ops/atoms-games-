# Drizzlon in 3D

Drizzlon, the Water starter from Creature Catch, rebuilt as a sculpted, rigged 3D creature that performs all nine of
its moves, plus a walk and a run.

**Play it:** open `dist/drizzlon-3d.html` in a browser. It is one file with everything inside (model, code, effects), so
it works offline on a phone or a computer. Tap a move to play it. Drag to look around, pinch or scroll to zoom.
Slow-mo plays at about a quarter speed. Dragging switches the camera from Auto (it follows the action) to Free.

## What is different from the earlier 3D models

- **One sculpted surface.** The body is modeled as blended clay and turned into a single smooth mesh (about 156,000
  triangles), instead of pictures projected onto a blocky shape. Scales, belly plates, horn rings, brow ridges, teeth
  and claws are part of the sculpt or its material, so they stay sharp up close and from every side.
- **More realistic.** Deep-set reptile eyes with slit pupils under a brow ridge, a longer muzzle, teeth and fangs,
  pebbled scales that catch the light, translucent wing and frill membranes, a real water droplet on the tail.
- **A real skeleton.** 53 bones: spine, neck, head, jaw, brows and cheeks, an 8-bone tail, 3 bones per leg, 5 per wing,
  4 per frill, 2 in the crest.
  - Legs use inverse kinematics. Paws stay planted while the body moves over them and step when they need to.
  - The tail, frills, crest, wing fingers and droplet are springy. They lag behind and overshoot.
  - The head and eyes track what it is looking at. It blinks and breathes.
  - The face changes: brows drop into a scowl, cheeks push up into a squint, pupils narrow, eyes wince shut on impact.

## The moves

| Move | Type | What it does on screen |
| --- | --- | --- |
| Tackle | Normal | Sinks back on its haunches, pounces low and long, hits shoulder-first, hops back. |
| Growl | Normal | Deep breath, then a rattling open-mouthed growl. Sound rings roll out and the target shivers. |
| Rally | Normal | Rears up with wings spread and roars at the sky while two ribbons of water wind up around it. |
| Splash Jab | Water | Hops in, drops into a bow, and stabs its tail over its head like a scorpion to fire a burst from the droplet. |
| Soak | Water | Lobs the droplet into the air. It becomes a rain cloud over the target. Drizzlon does a pleased little dance. |
| Drizzle Dart | Water (signature) | Springs into a hover on fast wing beats and spits three darts, kicking back with each one. |
| Body Slam | Normal | Deep crouch, a high leap with wings out, and a belly-first drop onto the target. |
| Torrent Crash | Water | Draws water up into a swollen droplet, rears, slams down, and throws a torrent over its head onto the target. |
| Guard Up | Normal | Hunkers behind its wings while a shell of water rises around it, then lets it fall as rain. |
| Walk, Run | gait | A lap of the clearing at a four-beat walk and at a bounding gallop. |

The droplet shrinks when a move uses it up and grows back afterwards.

## Folders

| Folder | What is in it |
| --- | --- |
| `dist/` | The built page, `drizzlon-3d.html`. |
| `model/` | `drizzlon.glb`: the mesh, skeleton and skin weights in the standard glTF format. |
| `tools/` | `sculpt.py` builds the model from scratch. `build.mjs` makes the single-file page. |
| `src/` | The app: materials, rig, moves, effects, stage, training dummy. |
| `shell/` | The page's HTML and styles. |
| `dev/` | Preview pages and scripts that render frame-by-frame strips of a move for checking. |

## Rebuilding

```
pip install numpy scipy scikit-image pyfqmr
npm install
npm run sculpt     # about 2 minutes, writes model/drizzlon.glb
npm run build      # writes dist/drizzlon-3d.html
```

`npm run dev` serves the folder at http://localhost:8766 for the pages in `dev/`.

## Limits

- The moves live in code (`src/moves.js`) and run through the rig in `src/rig.js`. They are not stored inside the `.glb`
  as animation clips, so another engine would get the model and skeleton but not the animations.
- It has not been put into the Chapter 1 game yet. That game uses an older three.js and its own model format.
- The colours, scales and eyes come from this page's own shaders. In another viewer the `.glb` shows the shape with
  plain materials.
- Checked in a desktop browser at phone and desktop sizes. Frame rate on a real phone has not been measured. The page
  lowers its resolution by itself if frames get slow.
