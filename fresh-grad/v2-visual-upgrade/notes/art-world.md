# art-world: optional art slots for conversations, dreams, scenes, shift intro, shop doors

The user cut the image list partway through this pass, so this file says what is wired for the art that is coming, and what was dropped.
Every slot asks `ART` for its key only when its screen opens (or, for badges, when a shop front is drawn). Until the file loads, and always
under `?noart`, nothing changes: no element is created and no cached layer is re-keyed. Shared code is in `js/36b-art-world.js` (only function
declarations at the top level, so they are hoisted and can be called from earlier files) and `css/13b-art-world.css`.

## Wired (art is coming)

| Key | Where it shows | Framing / behaviour |
|---|---|---|
| `bg/dream-<id>` (12) | Dream overlay (`drawDream`, 18-dreams.js) | Replaces the procedural motif, inside the existing slow push-in and sway. Cover-fit, centred. On top it keeps the drifting motes, bad-dream tendrils, eyes, cracks, glitch, glows, vignette and grain. Adds a light dim (good/calm 20 %, bad 30 %) so the white title and lines stay readable. The CSS `.dream-veil` also stays. |
| `bg/job-<id>` (6: cs eng nurse biz edu cook) | Shift intro hero `.jhero` (`JA.intro`, 15-activities-core.js) | An `<img class="jh-art">` cover-fit over the inline JART SVG, `object-position: 50% 55%`, in the hero's fixed box (124 px tall at most, 74 to 84 px on phones, hidden below 620 px height as before). The existing `::after` scrim stays on top. Added once the file loads, so layout never moves. `edu` only shows if the school ever opens a non-beat intro: today the school's lessons skip the intro. |
| `bg/scene-<kind>` (7) | Activity scenes (24-scenes, 24c, 24d, 31b) | Replaces the scene's cached static room layer. The layer name gets `|art` once the file has loaded, so it is repainted exactly once. Cover-fit, centred, with a soft floor shade over the lower 45 % to seat the figures. All animation stays on top: the movie, beam and audience (cinema); machines, steam and suds (laundry); book, lamp and mug (read); mirror, reflection, stylist and scissors (salon, plus a gold mirror frame drawn over the art); lamp, beam and dentist (dentist); beams, singer, band and crowd (music); table, mugs, friends and bubbles (hang). The cinema also gets a dark surround behind the screen rect. |
| `portraits/<slug>` for **dot, sal, bianca, hank, mrs-reyes, luna, agnes, dr-chen, ms-park, greta** | Conversation panel header (`#pHead`) for `npc:<id>` and `sch:talk-<id>` | A MutationObserver on `#pBody` (renderPanel rebuilds it on every open and action) inserts `<img class="tk-face">` into the header, bottom-anchored on the right beside the close button, `height: header + 4px` (82 px desktop, 72 px phone). The head top at 12 % of the image clears the header top. Mirrored so the speaker faces into the card, with a left-edge fade so a long title can run over it. The faint watermark glyph hides while a face shows. Everyone else keeps the faceless panel. |

Name to slug lookup (`artFolkSlug` and `artTeacherSlug`) covers the whole P05 table: street folk (`bell`→`mr-bell`, `cole`→`officer-cole`, `sam`→`sam-musician`, …),
building folk (`reyes`→`mrs-reyes`, `chen`→`dr-chen`, `imani`→`nurse-imani`, …), coworkers (`dana`→`dana-whitlock`, `rosalind`→`head-nurse-rosalind`, …),
shop staff (`okafor`→`mr-okafor`, `kim`→`mrs-kim`, `zoe`→`zoe-cinema`, `ruby`→`ruby-dental`, …) and teachers through `sch:talk-` (`park`→`ms-park`, `okafor`→`mrs-okafor`, `kim`→`mr-kim`, …).
School staff have their own table because `okafor` and `kim` mean different people in town. Only the ten slugs above are let through (`artHasFace`). To turn on more faces, add slugs there.

Dream mapping: the game's dream ids match the brief's (`fly feast grad perfect pond late hall rent empty alarm dry`). The 40 % "quiet nap" (`id: 'none'`, motif `calm`) uses `bg/dream-calm`.
Scene mapping: `cinema laundry salon dentist` map directly. `read` covers home, chair, cafe and books, but reading in the **park** keeps its own outdoor set. `music` covers the cafe open mic and the bandstand concert, but **not** the record player (`o.records`), which keeps its room. `hang` covers only hanging out at the **cafe**; pizza, diner, books, park, bakery and cinema keep their own sets, because a cafe table image would contradict them.

## Dropped by the scope change (implemented and tested, then removed at merge by the integrator)
These images were cut from the art plan (`ART_SHORTLIST.md`); the badge slot would have asked for 11 missing files as soon as the town drew its shop fronts. The code is in commit b7a456c if they come back.
- `badges/<shop>`: the street badge sprite over 11 shop doors (`26-shop-fronts.js`). The sprite key gets `|art` and the 34 px image replaces the disc, keeping the hanging wire and the shadow. Tested with placeholders. The cinema has a marquee instead of a badge, so `badges/cinema` is not used.
- `logos/<id>`: the employer mark in the top-left corner of the shift-intro hero. Tested with placeholders.
With no files, both look exactly as before.

## Dropped and removed
- The employer logo on the workplace back wall (via `ROOM_SIG`). It was untested, so it was reverted.
- `kid-*` portraits (lesson panel), the `grad-<hair>` player avatar on "Your reply", and the `-happy`/`-worried` mood extras.

## Verification
- Placeholder art at the brief's sizes, in a scratch `assets/` (not committed). Tours of town, jobs, scenes, dreams and mobile at 1280x720 and 390x844, plus a Playwright run through conversations (dot, maya, rosalind, ms-park, mrs-reyes, after a reply): art appears, nothing clipped, no page errors.
- Without files: the tour pixel differences against the baseline build are the same size as two baseline runs against each other (animation timing). Talk-panel headers are identical.
- `parity.js`: REMOVED (0). The same 15 `LOGIC?` entries as the unmodified build, none from this pass. `playthrough.js`: same results as `index.html` (33/34; the same timing-sensitive wake check fails on both). `perf.js`: same as baseline.

## Limitations
- On tall phone screens the 16:9 dream art is cover-cropped to its centre column, so keep subjects central (the brief already says so).
- Scene art sits under the procedural props, so an image that paints its own book, mug, machines or seats will show them twice. The brief's "calm centre and lower third" helps here.
- The portrait is mirrored. Asymmetric details (a pencil behind an ear) flip.
- Hook wishes for other passes: phone texts (`29-progression-phone.js`) could reuse `artFolkSlug` and `artHasFace` for message avatars.
