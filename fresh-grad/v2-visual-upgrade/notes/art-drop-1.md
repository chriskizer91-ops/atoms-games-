# Art drop 1 (freshgrad-art-recovered-01 / -02)

17 PNGs arrived with descriptive names instead of keys. Each was matched to its prompt in `../../IMAGE_PROMPTS.md`, renamed to its key and
converted with `tools/package_art.py` (35 MB of 1672x941 / 1536x1024 PNG -> 3.5 MB of WebP). All are below the brief's 1920x1080; none
were upscaled.

| Delivered file | Key | Prompt | Used by |
|---|---|---|---|
| Commencement Morning in the Quad | `assets/cutscene/still-01-quad` | CS-01 | cutscene 0-1.4 s |
| Back-row lecture hall in golden light | `assets/cutscene/still-02a-lecture` | CS-02a | memory cutaway |
| Dusk study crew and cardboard prototype | `assets/cutscene/still-02b-group` | CS-02b | memory cutaway |
| Midnight coffee on a rainy desk | `assets/cutscene/still-02c-coffee` | CS-02c | memory cutaway (the cup close-up the prompt asks for) |
| Midnight Coffee by the Rainy Window | `assets/cutscene/still-02c-coffee-b` | CS-02c, runner-up | not loaded (the Graduate at a desk twice in a row read as one beat) |
| All-nighter under a desk lamp | `assets/cutscene/still-02d-allnighter` | CS-02d | memory cutaway (alarm clock, textbook tower, the Graduate) |
| Sleepy All-Nighter at the Desk | `assets/cutscene/still-02d-allnighter-b` | CS-02d, runner-up | not loaded |
| Graduate backstage before the spotlight | `assets/cutscene/still-03-wings` | CS-03 | "And now, our final graduate" |
| Graduate's walk toward the dean | `assets/cutscene/still-04-walk` | CS-04 (phones, blank signs, spot beams) | the walk |
| A heartfelt graduation handshake | `assets/cutscene/still-05-handshake` | CS-05 | "Congratulations…" |
| Golden Diploma Handoff | `assets/cutscene/still-06-diploma` | CS-06 | "A diploma. Heavy paper…" |
| Tossed Caps, Bright Beginnings | `assets/cutscene/still-07-hats` | CS-07 | "Hats in the air!" (holds to the white-out while still-08 is missing) |
| Golden Hour on Main Street | `reference-art/p00-a-street` and `assets/title/hero-wide` | P00-A | style anchor; **stands in as the title backdrop** until UI-01 exists |
| Graduate Meets Dean on Commencement Stage | `reference-art/p00-b-character-stage` | P00-B | style anchor (near-twin of still-04 without phones/beams) |
| Cozy life-sim icons and town portraits | `reference-art/p00-c-icons-faces` | P00-C | style anchor for icons and portraits |
| Fresh Graduate Character Turnaround Sheet | `reference-art/ch-01-grad-sheet` | CH-01 | Graduate model sheet (attach to later prompts) |
| Kind Dean Turnaround Model Sheet | `reference-art/ch-04-dean-sheet` | CH-04 sheet | Dean model sheet (attach to later prompts) |

To swap a runner-up in, rename it over the main key (for example `still-02c-coffee-b.webp` -> `still-02c-coffee.webp`).

## Code changes for this drop (34-cutscene.js, 34b-cinematic.js, 11-title-scene.js)
- **Dissolves, not dips.** `cinStillPlan(ct)` decides which stills show. Stills that touch or sit within 0.25 s of each other dissolve: the
  outgoing still stays opaque until the incoming one is fully in. Before, both faded at once and the procedural stage flashed through
  for a fraction of a second at each cut (most visibly 3.3 s and 6.3-6.7 s). A frame-by-frame coverage check (0.01 s steps) now finds
  no dip except 15.13-15.3 s, which is under the white flash.
- **Holding over a missing still.** A still stays up to 1.6 s past its window when the next still's file is known to be missing, so the
  hat-toss still runs to the white-out instead of dropping back to the procedural stage for still-08's 1.5 s. The cap stops one lone
  still from swallowing the whole film when only a few files exist.
- **Skip what is hidden.** While an opaque still fills the frame the procedural set is not drawn at all: script time per cutscene frame
  falls from 17-31 ms to under 1 ms (headless, software raster). `?noart` and frames without a still are unchanged.
- **Live layers over the stills.** `fx: 'dust'` (lecture, wings, walk, handshake, diploma) drifts warm motes up through the light;
  `fx: 'conf'` (hats, face) tumbles big confetti in front. Both are screen space, pure functions of `ct` (so scrubbing and Skip are safe),
  and use fewer particles under reduced motion.
- **Phone framing.** On a 390x844 screen a 16:9 still shows about a quarter of its width, so each shot's focus (`fx0`/`fx1`) now sits on
  its subject: the stage in the quad, the dozing Graduate in the lecture hall, the cup, the sleeping head, a pan from the Graduate's back
  to the stage light in the wings, Graduate to Dean on the walk.
- **Title.** A tall screen without `title/hero-tall` crops `title/hero-wide` around the street.

## What is still procedural in the opening
- 13.75-15.3 s close-up (still-08-face) — covered by the held hat-toss still for now.
- The two black cards ("Diploma in hand." / "Now, what does it say?") — still-09-sunset would sit behind them.
- The degree picker's diploma (`ui/diploma`, `ui/paper-cream`).
- P02 plates and P03 poses/lineups only show where no still covers the beat; with the P01 stills in place that is nowhere, so they are now
  optional (they still matter for anyone who deletes the stills).
