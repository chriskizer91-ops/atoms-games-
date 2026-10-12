# Art drops

## Drop 1 (freshgrad-art-recovered-01 / -02)

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

### Code changes for drop 1 (34-cutscene.js, 34b-cinematic.js, 11-title-scene.js)
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

### What was still procedural after drop 1
- 13.75-15.3 s close-up (still-08-face) — covered by the held hat-toss still for now.
- The two black cards ("Diploma in hand." / "Now, what does it say?") — still-09-sunset would sit behind them.
- The degree picker's diploma (`ui/diploma`, `ui/paper-cream`).
- P02 plates and P03 poses/lineups only show where no still covers the beat; with the P01 stills in place that is nowhere, so they are now
  optional (they still matter for anyone who deletes the stills).

## Drop 2 (freshgrad-art-recovered-03 / -04)
21 PNGs, real alpha on the cut-outs. 18 used; 3 were near-identical second takes of something else in the drop and were not kept
(a second podium, a second eight-expression grid, a second idle pose). Pose cut-outs were shifted down so the feet touch the bottom edge
(the framing rule in P03); nothing was rescaled. 3.4 MB of WebP.

| Delivered file | Key | Prompt |
|---|---|---|
| Confetti, tears, and new beginnings | `assets/cutscene/still-08-face` | CS-08 |
| Graduation Walk Into Golden Hour | `assets/cutscene/still-09-sunset` | CS-09 (behind the two end cards) |
| Family cheers, tears, and balloons | `assets/cutscene/still-10-family` | CS-10 (now wired: a reaction cutaway at 8.6-9.6 s, during the Dean's line) |
| Empty Commencement Stage with Bunting | `assets/cutscene/plate-stage-empty` | PL-01 |
| Cheering audience with colorful blank signs | `assets/cutscene/plate-crowd-front` | PL-02 |
| Distant cheering crowd with balloons | `assets/cutscene/plate-crowd-back` | PL-03 |
| Wooden podium with golden medallion | `assets/cutscene/plate-podium` | PL-04 |
| Graduation caps, diplomas, and confetti | `assets/cutscene/sprites-hats-confetti` | PL-05 |
| Relaxed Graduate in Navy and Gold | `assets/chars/grad/pose-idle` | CH-03 |
| Confident graduate striding forward / Mid-stride graduate character | `assets/chars/grad/pose-walk-a` / `pose-walk-b` | CH-03 |
| Fresh Graduate Handshake Pose | `assets/chars/grad/pose-handshake` | CH-03 |
| Cheering Graduate with Diploma | `assets/chars/grad/pose-diploma-up` | CH-03 |
| Joyful Graduate Tossing Mortarboard | `assets/chars/grad/pose-cap-toss` | CH-03 |
| Graduate waving with diploma | `assets/chars/grad/pose-wave` | CH-03 |
| Nervous Graduate With Swaying Tassel | `assets/chars/grad/pose-nervous` | CH-03 |
| Kind Dean in Graduation Robes | `assets/chars/dean/pose-idle` | CH-04 |
| Eight moods, one graduate | `reference-art/ch-02-grad-faces` | CH-02 |

### The opening is now fully illustrated
Every beat from 0 s to the end cards is an illustrated still (coverage check: no dip outside the white flash). Consequences:
- **Plates and poses do not show** while the stills exist; they are the backup layer if a still is removed. They are no longer
  preloaded: `cinSetArtOn()` fetches them only once some still is known to be missing, so a full set costs no extra download.
  The remaining P02/P03 items (Dean handshake/clap/announce poses, CH-05 classmate lineups) are not worth generating.
- **Painted confetti.** The drifting confetti over the hat-toss and close-up stills now uses the 38 confetti pieces and 8 streamers
  cut from `sprites-hats-confetti` (rectangles measured once offline, `CIN_CONF_SPR` / `CIN_STREAMER_SPR`); flat paper if the sheet is missing.
- **End cards over the sunset still.** The card text moves up into the sky (`#cut.cards-art`), with a little extra shade at the top,
  so it no longer sits on the Graduate's head; the procedural drifting diploma is left out because the still already has one in hand.
- The handshake still now runs 6.5-8.7 s and dissolves into the family cutaway (8.6-9.6 s), then the diploma close-up.

## Drop 3 (freshgrad-art-recovered-05 / -06)
Zip 05: 10 PNGs. Zip 06 arrived truncated (10.9 MB, no central directory, zero-filled tail); its entries are stored uncompressed, so the
three complete ones were recovered from their local headers with CRC checks. 10 used:

| Delivered file | Key | Prompt |
|---|---|---|
| Golden-hour graduate on main street | `assets/title/hero-wide` | UI-01 (replaces the P00-A stand-in) |
| Golden-hour graduation on Main Street (zip 06) | `assets/title/hero-tall` | UI-02 (phones) |
| Ornate Blank Diploma with Wax Seal (zip 06) | `assets/ui/diploma` | UI-03 |
| Warm dean with diploma, hand extended | `assets/chars/dean/pose-handshake` | CH-04 |
| Kind Dean Applauding Graduation | `assets/chars/dean/pose-clap` | CH-04 |
| Dignified Dean Gesturing Offscreen | `assets/chars/dean/pose-point-announce` | CH-04 |
| Eight classmates in navy graduation attire | `assets/chars/ch-05-classmates-stand` | CH-05 |
| Eight Graduates Cheering Together | `assets/chars/ch-05-classmates-cheer` | CH-05 |
| Classmates Celebrating With Flying Caps | `assets/chars/ch-05-classmates-toss` | CH-05 |
| Everyday Outfit Model Sheet | `reference-art/ch-06-grad-everyday-sheet` | CH-06 |

Not used: *Kind dean announcing a graduate* (two figures in one frame, so not a pose; the single-figure take was used), *Fresh Grad
Turnaround Sheet* (repeats CH-01 and CH-06), *Seamless cream cotton paper texture* (a busy pattern of mugs and books, not paper), *Navy
velvet paper with gold flecks* (damaged in the cut-off zip; only drawn when the sunset still is missing anyway).

Code: the diploma plate now keeps its own proportions (`--dp-ar`, set from the file) and the typed text sits in the blank field above
the wax seal, with smaller type on phones. The Dean poses and classmate lineups, like the other poses, only load if a cutscene still is missing.
