# Fresh Grad — Image Prompt Pack

Prompts for an image-generation agent. Everything here is written to match the game **exactly** (colours, names, props are taken from the game's own code), so the pictures slot straight into it.

**Three ways the pictures get used** (each prompt is tagged):

| Tag | Meaning |
|---|---|
| `USE` | Drawn directly by the game when the file exists (the opening cutscene, title art, diploma). The game **already looks for these exact file names** and falls back to its own procedural art when a file is missing, so you can deliver them in any order. |
| `RIG` | Character poses and paper-doll parts for **re-animating** characters (cutscene cast first). |
| `REF` | Reference boards. I (Claude) look at them to make buildings, rooms, people and effects in the game look *different from each other* and richer. Not shown in-game. |
| `LATER` | Full-screen backdrops (dreams, scenes, fishing…). Not hooked up yet; I wire them in when they arrive. |

**Priority order if you only do some:** P0 = `CS-*`, `PL-*`, `CH-01..CH-05`, `UI-01..UI-03` → P1 = `PD-*`, `RF-B*` (buildings), `RF-I*` (interiors), `CH-06..` cast sheets → P2 = everything else.

---

## 0. How to run this pack

1. **Always prepend a style block** (§1) to a prompt: `[SCENE]` for places, `[CHAR]` for characters. Append your tool's aspect-ratio / size setting from the `size` line. Add the **Negative** line if your tool supports negatives.
2. **Lock the cast first.** Generate `CH-01` (the Graduate) and `CH-04` (the Dean) before anything with people in it, then feed those images as **reference/character-lock images** into every later prompt that lists them in `ref:`. Consistency of the Graduate across stills is the single most important thing.
3. **No text in any image.** No lettering, logos, signage words, diploma wording, banner words. The game draws all text itself (fonts, translation, sharp at any size). Where a sign/banner/diploma appears, paint it **blank** (a clean navy panel with gold trim, a blank cream scroll, etc.). Blank white sign boards in the crowd are fine.
4. **Sizes.** Full-frame art: **16:9, 2560×1440 PNG** (minimum 1920×1080). Characters/props: **transparent PNG**. If your tool cannot output transparency, render on **flat pure magenta `#FF00FF`** with no shadows or gradients on the background and no magenta in the subject; I key it out (`convert in.png -fuzz 6% -transparent '#ff00ff' out.png`).
5. **File names and folders.** Save as `<file>` exactly as listed, under:
   - `fresh-grad/v2-visual-upgrade/assets/` for `USE` / `RIG` / `LATER` files (the game loads `assets/<key>.png` relative to `index.html`),
   - `fresh-grad/reference-art/` for `REF` files.
   Commit to the same branch, or drop them anywhere and tell me.
6. **Two takes each.** For `USE` stills, make 2–3 variants (`…-a.png`, `…-b.png`); I pick the best and rename.
7. **Camera rule for any facade or room reference:** flat, orthographic, straight-on, even soft lighting, no people, no cars — I need to read the shapes, not the mood. Mood shots are separate prompts.

**Negative (use everywhere):** `text, letters, words, numbers, logo, watermark, signature, caption, photorealistic, 3D render, plastic look, extra fingers, malformed hands, cropped head, duplicated limbs, blurry, low-detail, muddy colours`

---

## 1. Style blocks

### `[SCENE]` — paste at the start of every place/scene prompt
> Stylized 2D digital illustration for a cozy small-town life-sim game. Clean confident shapes with soft cel-shading and painterly gradient lighting, gentle atmospheric depth, warm golden-hour light against cool deep-navy shadows, rich yet slightly desaturated palette with marigold gold (#ffc247) and coral (#ff7a59) accents, deep navy (#0b131e to #1d2e6b) shadows, subtle film grain, crisp readable silhouettes, charming and quietly funny. Looks like the key art of a modern indie game, not a photograph and not a 3D render. No text, no letters, no logos.

### `[CHAR]` — paste at the start of every character prompt
> Stylized 2D character illustration for a cozy life-sim game, same world as the scene style: slightly chibi-leaning proportions (head about one quarter of body height), simple expressive faces (round dark eyes with a small white highlight, soft eyebrows, small mouth, faint cheek blush), soft cel-shading with one warm rim light from the upper left, clean shapes with subtly darker-tone edges instead of heavy outlines, rich fabric folds, even neutral lighting suited to animation reference, full body unless stated, no text.

### Palette (keep recurring colours exact)
| Role | Hex |
|---|---|
| Ink navy (UI / deep shadow) | `#0b131e` `#121d2b` `#1c2b3d` |
| Marigold gold (money, primary, tassels, trim) | `#ffc247` / graduation gold `#f0b429` |
| Coral (the Graduate's shirt, warm accent) | `#ff7a59` |
| Gown royal navy | `#1d2e6b` |
| Dean's gown / mortarboard | `#1b1b21` / `#0f1626` |
| Curtain wine | `#7a1f33` (shadow `#5c1526`) |
| Diploma cream / ribbon red | `#f6f0dc` / `#c9402f` |
| Sky day | `#54a0e8` → `#cee8f8` |
| Golden hour | `#ffd08c` amber, `#ff8a5c` orange |

---

## 2. Recurring cast (paste the relevant block when a character appears)

**THE GRADUATE** (the player; gender unspecified — draw a friendly, androgynous young adult; edit this one line if you want a specific look and reuse it everywhere): *warm light-medium skin (#e8b48f), short neat dark-brown hair (#2a1f18) with two small side tufts, dark round eyes, gentle smile, ordinary build.* **Graduation outfit:** royal-navy gown (#1d2e6b) loose and floor-skimming at the shin, **gold stole (#f0b429)** hanging down both lapels, black-navy flat mortarboard cap (#0f1626) with a **gold tassel**, dark trousers and plain dark shoes showing under the hem. **Everyday outfit:** **coral tee (#ff7a59)**, dark-blue jeans (#2c3e57), dark shoes (#20242c).

**THE DEAN:** *older, kind, lined face with laugh lines, silver hair (#cfcfd4) under the cap, warm light skin (#e6b995), slightly stooped dignified posture.* Black gown (#1b1b21), **gold stole (#d4a017)**, black mortarboard with a short gold tassel.

**CLASSMATES** (8 fellow graduates, same navy gown with a gold stole, mixed): skin tones `#e0ac86`, `#f2c9a5`, `#8f5d3d`, `#d99d77`; hair `#2b2118`, `#7a4a2a`, `#1a1a1a`, `#d8c27a`; varied builds and heights, some curly, some long, one with glasses.

**THE STAGE:** outdoor commencement stage on a university lawn: warm wooden plank floor (#8b6a4a, front fascia #6b4d35), **wine-red velvet curtains** (#7a1f33) with a **gold valance** (#f0b429), a **navy banner panel with gold trim, left completely blank**, strings of **bunting** in coral #ff6b6b / marigold #ffc247 / sky #47b8ff / green #5bd39b, a **wooden podium** (#6b4a30) with a **gold round medallion** and a microphone on a gooseneck, soft green hills and a tree line behind, blue sky with fluffy clouds, audience in dark navy silhouette in front holding blank coloured sign boards (green, blue, yellow, red).

---

## 3. Opening cutscene stills  — `USE`

The cutscene runs ~20 s. These are its shots, in order, with the story beat each one carries. The game will play them as slow Ken-Burns moves (push-ins, drifts) with its own lighting, confetti and captions on top, cross-fading to its animated scene in between. Compose with **breathing room at the bottom 18%** (captions sit there) and keep the **focal point near the centre third**.
All: `size: 16:9, 2560×1440`, `alpha: no`, style `[SCENE]`, characters per §2.

### CS-01 — Commencement morning (establishing) · file `cutscene/still-01-quad.png`
*Beat 0.7–3.4 s: "Commencement day. Four years of lectures, group projects and cheap coffee."*
> Wide establishing shot of a university quad on commencement morning. Hundreds of white folding chairs in neat rows filled with families, a temporary stage with wine-red curtains and a blank navy banner at the far end, strings of colourful bunting between old iron lamp-posts, a brick clock tower and big oak trees, low sun raking across dewy grass with long soft shadows, small figures in navy gowns forming a line at the left, balloons tied to chairs, soft cumulus clouds, a feeling of nervous excitement. Slightly high wide-angle, strong depth, no close figures.

### CS-02a…d — "Four years" memory inserts · files `cutscene/still-02a-lecture.png`, `-02b-group.png`, `-02c-coffee.png`, `-02d-allnighter.png`
*Same beat; shown as four quick cutaways (~0.6 s each). Slightly faded, warm-vignetted "memory" look.*
- **a (lecture):** *A vast tiered lecture hall seen from the back row, rows of half-asleep students, a tiny professor at a distant whiteboard, a big wall clock, dust in slanted window light.*
- **b (group project):** *A cluttered library table at dusk: laptops, pizza boxes, sticky notes, highlighters, four tired but laughing students (generic, no faces in detail), a half-built cardboard model.*
- **c (cheap coffee):** *Extreme close-up of a chipped paper coffee cup on a dorm desk at 2 a.m., laptop glow, a crumpled to-do list, rain on the window behind.*
- **d (all-nighter):** *A desk lamp pool in a dark room, a tower of textbooks, an alarm clock showing late, a sleepy head resting on folded arms.*

### CS-03 — Waiting in the wings · file `cutscene/still-03-wings.png`
*Beat 3.7–6.3 s: "And now, our final graduate of the day!"*
> View from backstage: the Graduate seen from behind in navy gown and cap, holding the tassel nervously, a line of classmates ahead, a bright slit of stage light and cheering crowd beyond the curtain edge, wine-red velvet in the foreground, dust motes in the light, a stage-manager's hand pointing the way. Tension and a hopeful glow. ref: CH-01.

### CS-04 — The walk · file `cutscene/still-04-walk.png`
*Beat 3.7–6.9 s: the Graduate crosses the stage.*
> Wide shot from the audience, slightly low angle. The Graduate walks across the wooden stage toward the Dean at the gold-medallion podium, two warm follow-spot beams crossing with floating dust, eight classmates in navy gowns lined at the left, the blank navy banner behind, bunting, wine-red curtains. Foreground: dark silhouettes of audience heads with phones raised and blank coloured signs. ref: CH-01, CH-04, CH-05.

### CS-05 — The handshake · file `cutscene/still-05-handshake.png`
*Beat 7.0–9.7 s: "Congratulations. Go do something wonderful."*
> Medium shot at stage level, shallow depth of field. The Graduate and the Dean shake hands, the Dean's other hand holding a rolled diploma with a red ribbon, gold stoles catching the light, a tassel mid-swing, both smiling genuinely, soft bokeh of the audience and a camera-flash sparkle behind. Warm rim light. ref: CH-01, CH-04.

### CS-06 — The diploma · file `cutscene/still-06-diploma.png`
*Beat 9.9–12.2 s: "A diploma. Heavy paper, a gold seal and no idea what happens next."*
> Extreme close-up of the diploma passing between hands: a rolled scroll of heavy cream paper (#f6f0dc) with a red ribbon (#c9402f) and a raised gold wax seal, visible paper fibres, a gold tassel dangling across the frame, beautifully blurred stage and crowd in warm bokeh. Reverent, a little overwhelming.

### CS-07 — Hats in the air · file `cutscene/still-07-hats.png`
*Beat 12.4–15.0 s: "Hats in the air!"*
> Joyful wide low-angle shot: dozens of black mortarboards mid-air against bright blue sky, gold tassels trailing, confetti and streamers in coral, marigold, sky-blue and green, the whole graduating class on the stage with arms up, the Graduate in the centre foreground holding the diploma overhead, sun flare through the confetti, audience on their feet in silhouette. Peak of the emotion. ref: CH-01, CH-05.

### CS-08 — The face · file `cutscene/still-08-face.png`
*Beat ≈ 15.0 s (the quiet after the cheer).*
> Medium close-up of the Graduate laughing with the cap gone and hair slightly messy, diploma pressed to their chest, confetti drifting past, eyes bright with happy tears and a flicker of "what happens now?". Golden light from the upper left, shallow depth of field, the stage out of focus. ref: CH-01.

### CS-09 — Now what? · file `cutscene/still-09-sunset.png`
*Beat 15.4–19.6 s: cards "Diploma in hand." → "Now, what does it say?"*
> Quiet final frame: the Graduate seen from behind in the empty quad at golden hour, gown over one arm, diploma in hand, walking toward a softly glowing small-town skyline (brick buildings, a bus stop, lamp-posts just switching on) at the end of a path, long shadow, a few stray confetti pieces on the grass, deep navy sky at the top fading to amber at the horizon. Hopeful, a little lonely. ref: CH-01.

### CS-10 — The people who came (optional cutaway) · file `cutscene/still-10-family.png`
> Audience rows seen from the stage: relatives cheering and crying, blank coloured sign boards, a balloon bouquet, a toddler on someone's shoulders, a grandparent with a camera, warm afternoon light, joyful chaos, generic faces.

---

## 4. Cutscene plates for the **animated** version  — `USE` / `RIG`
These let the cutscene be a *layered, camera-moving* scene where characters (from §5/§6) are animated on top. All `[SCENE]` style, **no people** unless stated.

### PL-01 — Empty stage background · `cutscene/plate-stage-empty.png`
`size: 16:9 2560×1440, alpha: no`
> Straight-on view of the empty commencement stage at standing eye height: wooden stage floor edge at 72% from the top, wine-red curtains with gold valance at left and right, a **completely blank navy banner panel with gold trim** high at centre (about 40% wide), bunting in coral/marigold/sky-blue/green swagged across the top, soft green hills and tree line, blue sky with clouds, no podium, no people, no foreground. Soft late-morning light from the upper left.

### PL-02 — Audience foreground · `cutscene/plate-crowd-front.png`
`size: 16:9 2560×1440, alpha: YES (transparent)`
> Foreground layer only: rear views of audience heads and shoulders in deep navy silhouettes filling the bottom 30% of the frame in two overlapping rows, some with arms raised, some holding phones, some holding blank rectangular sign boards (green #5bd39b, blue #47b8ff, marigold #ffc247, red #ff6b6b) on sticks, subtle rim-light on hair. Everything above the heads is transparent.

### PL-03 — Audience mid-layer (cheering) · `cutscene/plate-crowd-back.png`
`size: 16:9 2560×1440, alpha: YES`
> Distant audience rows in dusty blue-navy, smaller scale, standing and cheering, a few hats in the air, lawn chairs, balloons; transparent above the crowd; slightly desaturated for depth.

### PL-04 — Podium + microphone · `cutscene/plate-podium.png`
`size: 1024×1536, alpha: YES`
> A wooden speaker's podium (#6b4a30 with lighter top #8b6240) with a round **gold medallion** on the front, a gooseneck microphone, front-on, resting on the ground line at the bottom edge, soft shadow-free.

### PL-05 — Hats and confetti sprites · `cutscene/sprites-hats-confetti.png`
`size: 2048×2048, alpha: YES`
> A sprite sheet on a transparent background, spaced widely apart: 12 black mortarboard caps (#0f1626) at varied tilts and rotations seen from slightly below with gold tassels (some trailing), 6 rolled diplomas with red ribbons at varied angles, and 40 paper confetti pieces and 8 curling streamers in coral, marigold, sky-blue, green, violet and white.

---

## 5. Cast: model sheets and poses  — `RIG` / `REF`

### CH-01 — The Graduate, model sheet (gown) · `chars/ch-01-grad-sheet.png`
`size: 3:2 2560×1707, alpha: no (plain light-grey #e9ecef)`
> `[CHAR]` Turnaround model sheet of THE GRADUATE in graduation outfit: four full-body views side by side at identical scale and ground line — front, three-quarter front, side, back — relaxed standing pose, arms slightly away from body, no props. Beneath: a row of close-ups of the cap with tassel (front and side) and the gold stole detail. Even neutral lighting.

### CH-02 — The Graduate, expressions · `chars/ch-02-grad-faces.png`
`size: 16:9 2560×1440, alpha: no`
> `[CHAR]` A 4×2 grid of head-and-shoulder portraits of THE GRADUATE (gown and cap): neutral, big happy laugh, nervous, proud, surprised, teary-joyful, tired, sleeping. Same camera, same scale. ref: CH-01.

### CH-03 — The Graduate, animation poses (8 separate images) · `chars/grad/pose-<name>.png`
`size: 1024×1536 each, alpha: YES. IMPORTANT: identical framing for all 8 — camera at waist height, **feet touching the bottom edge, body centred, head top at 10% from the top**, same scale so poses can be swapped frame-to-frame.` ref: CH-01.
Prompt base: `[CHAR]` THE GRADUATE in graduation outfit, full body, transparent background, no ground shadow, **pose:**
| file | pose |
|---|---|
| `pose-idle.png` | standing relaxed, arms at sides, cap on, soft smile |
| `pose-walk-a.png` | mid-stride, left foot forward, right arm forward, confident |
| `pose-walk-b.png` | mid-stride, right foot forward, left arm forward (mirror timing of walk-a) |
| `pose-handshake.png` | right hand extended to shake, other hand gripping the tassel, leaning in slightly, smiling |
| `pose-diploma-up.png` | right arm straight up holding the rolled diploma overhead, head tilted up, mouth open in a cheer |
| `pose-cap-toss.png` | both arms thrown upward, cap just leaving the head (cap in the image, slightly above), joyful |
| `pose-wave.png` | right hand waving to the crowd, diploma in the left hand against the chest |
| `pose-nervous.png` | hands clasped at the front, shoulders up, glancing sideways, tassel swaying |

### CH-04 — The Dean, model sheet + poses · `chars/ch-04-dean-sheet.png`, `chars/dean/pose-<name>.png`
Sheet: like CH-01 for THE DEAN (front, 3/4, side, back). Poses (1024×1536 transparent, same framing rule as CH-03): `pose-idle` (hands folded, dignified), `pose-handshake` (hand extended, other hand holding a rolled diploma with red ribbon, warm smile), `pose-clap` (applauding), `pose-point-announce` (one arm extended toward the Graduate as if announcing).

### CH-05 — Classmates · `chars/ch-05-classmates-stand.png`, `-cheer.png`, `-toss.png`
`size: 16:9 2560×1440 each, alpha: YES`
> `[CHAR]` A lineup of 8 distinct graduating classmates in navy gowns with gold stoles and mortarboards, evenly spaced in a row on a shared ground line, at identical scale, **varied skin tones, hair, builds and heights** (see CLASSMATES in §2). **Three images**: (1) standing politely, hands at sides; (2) cheering with both arms raised, mouths open; (3) caps just thrown from their heads, arms up, caps in the air above each head.

### CH-06 — The Graduate, everyday · `chars/ch-06-grad-everyday-sheet.png`
`size: 3:2, alpha: no`
> `[CHAR]` Turnaround sheet (front, 3/4, side, back) of THE GRADUATE in the everyday outfit — coral tee, dark jeans, dark shoes — plus a small row showing **customisation options**: five hairstyles (short and neat, long and loose, top knot, curly crop, cycling cap) and seven shirt colours (coral, teal #2a9d8f, navy button-down #3d5a80, mustard sweater #e9c46a, white shirt, violet polo #7b6fd0, red flannel #c0392b). `REF`

### CH-07 — Town cast sheets (`REF`) · `chars/ch-07a…ch-07g-*.png`
Each: `size: 16:9 2560×1440, alpha: no (light grey)`, `[CHAR]`, a row of full-body characters at **identical scale on one ground line**, each clearly different in silhouette, age, build and clothing; neutral standing pose; no props except those listed. Cast text (clothing colours are the game's):
- **07a Street cast I:** *Maya* (jogger, teal-green tee #4f9d7a, dark slate pants, dark top-knot, light-brown skin); *Rosa* (dog-walker, pink-magenta tee #c05d8a, navy pants, brown hair in a cap, holding an invisible-leash pose); *Mr. Bell* (mail carrier, mustard shirt #e7b64a, grey-blue trousers, black curly hair, dark skin, canvas mailbag); *Theo* (sleepy college student, periwinkle hoodie #6f7bd4, blond curly hair, tired eyes); *Priya* (barista on break, terracotta tee #d0603f, dark top-knot, brown skin, takeaway cup); *Walt* (retired bench regular, sky-blue shirt #5ab0c9, flat cap, white stubble, relaxed).
- **07b Street cast II:** *June* (sketch artist, sage tee #9bb86a, long auburn hair, sketchbook); *Officer Cole* (traffic officer, coral shirt #e86f68, navy pants, thermos); *Ines* (florist, orange tee #f4a261, short blond hair, bouquet of lilies); *Lena* (tourist, violet tee #7b6fd0, long dark hair, folded map); *Sam* (street musician, teal tee #2a9d8f, acoustic guitar); *Kofi* (bike courier, lilac tee #e5c7e8, brown cap, courier bag).
- **07c Home & errands:** *Mrs. Reyes* (landlord, periwinkle cardigan, blond curls, warm); *Dev* (neighbour, night owl, violet tee, long dark hair, drumsticks in back pocket); *Mr. Tanaka* (grocery cashier, mustard apron); *Ms. Odell* (shopper, magenta tee, brown cap, basket); *Dot* (diner owner, orange uniform dress #f4a261, apron, short golden hair, big smile); *Gus* (diner regular, sage cardigan, long auburn hair, coffee mug); *Nurse Imani* (lilac scrubs #e5c7e8); *Dr. Chen* (sky-blue scrubs #5ab0c9, white coat).
- **07d Shopkeepers I:** *Mr. Okafor* (pharmacist, white coat, dark skin); *Greta* (bank teller, blue blazer #2a6f97, blond top-knot, lollipop jar); *Mr. Hale* (financial advisor, charcoal suit, grey hair); *Agnes* (bookshop owner, lavender cardigan #9b7bb0, silver top-knot, reading glasses); *Luc* (baker, cream apron, tall baker's cap, flour on cheek); *Hank* (hardware owner, red shirt #c0392b, grey cap, tool belt).
- **07e Shopkeepers II:** *Zoe* (cinema concessions, maroon uniform vest, long black hair); *Ike* (ticket booth, mustard tee); *Bianca* (stylist, long **teal** hair #2a9d8f, pink top #c05d8a, scissors holster); *Mrs. Kim* (laundromat attendant, teal tee, black top-knot); *Rafa* (bike mechanic, tomato tee #e76f51, brown cap, oily rag); *Luna* (cafe owner, navy shirt #3d5a80, long chestnut hair, apron).
- **07f Shopkeepers III + cafe/pizza/dentist:** *Otis* (screenwriter at his laptop, periwinkle, blond curls); *Sal* (pizza maker, white shirt, floury apron, short black hair); *Ruby* (dental receptionist, light-blue scrubs #8ecae6, auburn top-knot); *Dr. Patel* (dentist, white coat, teal mask pulled down); *Milo* (reader in the nook, green tee #4f9d7a, curly hair); *Tess* (customer, coral tee, top-knot).
- **07g Workplace casts (five rows of three, one image):** Software — *Noor* (senior dev), *Felix* (QA), *Dana Whitlock* (manager); Engineering — *Olga* (machinist, safety glasses), *Pavel* (junior engineer), *Mr. Keller* (founder); Nursing — *Dr. Amari*, *Tomas* (orderly), *Head Nurse Rosalind*; Business — *Carter*, *Imogen* (receptionist), *Ms. Pike* (partner); Culinary — *Dmitri* (sous chef), *Beto* (prep), *Chef Marisol* (white chef's coat, tall hat). Clothing per job: dev casual hoodies, machinist coveralls, scrubs, business casual, chef whites.
- **07h School staff + kids:** *Ms. Park*, *Mr. Alvarez* (PE, whistle), *Mrs. Okafor* (cafeteria), *Principal Dawson*, *Mr. Kim* (music), *Nurse Reed*, *Ms. Lin* (librarian) — and ten eight-year-old kids in pastel tees: *Mia* pink, *Noah* sky-blue, *Ava* yellow, *Leo* mint, *Zoe* lavender, *Eli* orange, *Ruby* aqua, *Max* red, *Ivy* blue, *Sam* rose.

---

## 6. Paper-doll parts (for skeletal re-animation)  — `RIG`

Goal: separate body parts I can rotate around joints to animate the cutscene characters smoothly (instead of swapping whole poses).

**Rig convention (follow it precisely):** parts are drawn **straight and un-posed (A-pose, arms hanging, legs straight)**, at **the same scale as each other**, on **transparent** (or magenta) background, **spaced well apart so nothing overlaps**. Each limb part is a vertical strip whose **joint end touches the top edge of its own bounding box**; extend each joint end by ~8 % past the joint (a rounded overlap) so there is no gap when it rotates. The head has a short neck stub at its bottom edge. Lay the parts out on one sheet in this **exact order, left→right, top→bottom**:

Row 1: `head` (front, with hair, cap **off**) · `hair-back` · `cap` (mortarboard with tassel) · `tassel` (separate, hanging straight) · `diploma` (rolled, red ribbon)
Row 2: `torso` (gown bodice + stole, shoulders to hips) · `skirt` (gown lower part to the shin, flares slightly)
Row 3: `upper-arm-L` · `forearm-hand-L` · `upper-arm-R` · `forearm-hand-R` (wide gown sleeves; hands open and relaxed)
Row 4: `shin-shoe-L` · `shin-shoe-R` (just the visible lower legs and shoes below the hem)

### PD-01 — The Graduate parts · `chars/grad/parts-sheet.png` (`size: 2048×2048, alpha: YES`)
> `[CHAR]` Paper-doll parts sheet of THE GRADUATE in graduation outfit, laid out exactly per the rig convention above, flat shading consistent with the model sheet. ref: CH-01.

### PD-02 — The Dean parts · `chars/dean/parts-sheet.png` — same layout for THE DEAN (no tassel part; cap with short tassel). ref: CH-04.
### PD-03 — Classmate base parts · `chars/classmate/parts-sheet.png` — same layout, **plain generic classmate with a white-grey (desaturated) gown and neutral skin/hair** so the game can tint gowns/skin/hair per classmate; add four alternative `head` + `hair-back` pairs in row 1.
### PD-04 — The Graduate parts, everyday outfit · `chars/grad/parts-everyday-sheet.png` — same layout in coral tee, jeans, shoes (no cap/tassel/skirt; add `thigh-L`, `thigh-R` and `shin-shoe-L/R` in row 4).

---

## 7. Title screen and ceremony art  — `USE`

### UI-01 — Title key art (wide) · `title/hero-wide.png`
`size: 16:9 2560×1440, alpha: no, style [SCENE]`
> Golden-hour view down a charming small-town main street (brick and painted-stucco shopfronts with awnings, glowing windows just turning on, a bus stop, lamp-posts, a park fountain in the distance, a skyline of towers at the horizon), the Graduate in the **everyday coral tee** with a rolled diploma under one arm and the graduation cap in the other hand, walking toward us on the right third, **leaving the left 45% of the frame calm and low-detail** for the title lettering. Warm amber sky fading to navy at the top, long shadows, a few birds. ref: CH-06.

### UI-02 — Title key art (portrait, phones) · `title/hero-tall.png`
`size: 9:16 1440×2560, alpha: no` — the same scene recomposed vertically, the Graduate in the lower third, the top 40% a calm sunset sky.

### UI-03 — Diploma parchment · `ui/diploma.png`
`size: 4:3 1600×1200, alpha: YES`
> A formal diploma lying flat, seen straight-on: heavy cream paper (#f6f0dc) with subtle fibres, an ornate engraved navy double border with corner flourishes, a **large blank central area** for text (no words), a **raised gold wax seal with a red ribbon** at the lower right, a faint crest watermark (a laurel and an open book, no letters) at the centre, soft paper shadow around the edge, slightly curled corner at top-left.

### UI-04 — Paper and card textures (`USE`) · `ui/paper-cream.png`, `ui/paper-kraft.png`, `ui/paper-navy-card.png`
`size: 1024×1024 seamless, alpha: no` — three seamless textures: warm cream cotton paper; kraft cardboard; deep navy velvet-paper with a faint gold fleck. No text.

### UI-05 — Phone wallpaper · `ui/phone-wallpaper.png` (`size: 9:19.5 1170×2532`)
> Soft abstract illustration of the town at dusk: layered rooftops in navy and plum, a few warm lit windows, a crescent moon, gradient sky from marigold to indigo. Calm enough to put icons on.

---

## 8. Reference boards  — `REF`

All to `fresh-grad/reference-art/`. These tell me how each building/room/person should *differ*.

### Buildings (front elevations) — `RF-B1…B8`
Common prompt: `[SCENE]` **flat orthographic front elevation, straight-on, even soft daylight, no people or cars, ground line 8% from the bottom, three buildings side-by-side with a one-metre gap, each with its roof band, sign band (blank — no words), windows, door, awning and a few street props (planter, bike rack, sandwich-board)**. `size: 16:9 2560×1440`.
- **RF-B1 Home + clinic + grocery:** *Maple Court Apartments* (terracotta brick #b9684f, roof #5b3a33, two rows of five windows with flower boxes, ivy on the west corner, green fabric canopy over a brown door with a "12" plate, two wall lanterns); *St. Anne Clinic* (white panels #eef3f5, steel-blue roof #4d86a8, lit white square with a red cross, red EMERGENCY bar over glass doors); *Corner Grocery* (sage siding #86b894, green roof, green-and-white scalloped awning, windows crammed with produce, four fruit crates out front).
- **RF-B2 Diner + pharmacy + bank:** *Dot's Diner* (coral-red siding #d95f59, chrome trim, rooftop neon plaque with pink outline, black-and-cream checker band, booths glimpsed through windows, kitchen vent with steam); *Main Street Pharmacy* (sand brick #e0cfa0, roof #5b4a3a, green round pill badge over the door); *First Bank* (sand brick, blue round "$" badge, a more formal door).
- **RF-B3 Books + bakery + hardware:** *Dog-Ear Books* (tan brick #d9b48a, coral-and-cream awning, round brown open-book badge); *Rise & Shine Bakery* (tan brick, yellow awning, round bread badge, a warm glow); *Hank's Hardware* (grey-tan brick #c9b79c, green roof #3f5b4a, red hammer badge, tools on the pavement).
- **RF-B4 Cinema + salon + laundromat:** *Starlight Cinema* (sage stucco #b4c7a8, **marquee with chasing bulbs**, two framed movie posters flanking the door — abstract art, no words); *Bianca's Salon* (sage brick, pink scissors badge, gold-framed window); *Suds Laundromat* (tan siding, teal washer badge, big windows showing washers).
- **RF-B5 Bikes + cafe + pizza + dentist (4 across):** *Spoke & Sprocket* (cream siding, tomato bike badge, bikes on the pavement); *Cafe Luna* (cream siding, **violet awning**, blue coffee-cup badge, crescent-moon motif, string lights); *Sal's Pizza Place* (blue-grey stucco #a7b6c4, purple roof, green slice badge, a brick-oven chimney); *Bright Smile Dental* (sage stucco, teal tooth badge, calm).
- **RF-B6 Workplaces I:** *Northgate Software* (blue-grey panels #5f7fa8, dark roof #2f3f5a, glass lobby, glowing server-room strip, bean bags visible inside); *Keller Dynamics* (concrete grey #8a8f98, orange accent #ffb347, a roll-up workshop door, sawtooth roof); *Mercy General Hospital* (white #e8eef0 with red roof band #c9444f, ambulance bay, red cross, glass atrium).
- **RF-B7 Workplaces II:** *Harlan & Pike* (lavender glass-and-stone #9b7bb0, dark plum roof, formal revolving door); *Lakeview Elementary* (mustard-brick #e3b04f, brick-red roof #9a3b2e, a small bell tower, kids' paintings in the windows); *The Copper Pan* (terracotta #c46a3b with a copper-clad awning, kitchen exhaust fans and steam, a chalkboard).
- **RF-B8 Park structures:** park gate (two stone pillars with glowing globes, green arch #2c4d3c), bandstand (low round stone dais, four cream posts, green pyramid roof #2f7d4f, gold ball finial), market stalls (striped canopies coral/teal/violet with cream, wood posts), bus shelter (glass, dark frame, blue roof bar, lit poster, blue route sign on a pole).

### Interiors (cut-away, top-down 3/4) — `RF-I1…I22`
Common prompt: `[SCENE]` **top-down three-quarter "dollhouse" cutaway of a single room, camera 60° above, back and left walls visible, floor fully visible, soft window light, every piece of furniture clearly readable and distinct, no people**. `size: 16:9 2560×1440`. One image per room; contents:
`I1 apartment` — left lobby (grey tile, brass mailboxes, landlord's desk, indigo rug, bench, plants, door tagged "12" with no digits drawn) and right Apt 12 (honey wood floor; kitchen row: white fridge, steel sink, black stove with orange burner; dining table with four chairs; TV above a brick-red rug and cranberry sofa; double bed with blue quilt, nightstand, bookshelf). · `I2 grocery` (sage tile with green diamonds; shelves of colourful packages, three drinks coolers, two registers, fresh-produce table, bakery table). · `I3 diner` (cream tile with red checker; chrome strip, red counter with eight stools, four red vinyl booths, chrome jukebox with rainbow arch, grill and fryer). · `I4 clinic` (pale blue lino, red cross on wall, reception counter, vending machines, waiting benches on a teal rug, two hospital beds in an exam area). · `I5 pharmacy` (mint lino, green counter, pill-bottle wall, blood-pressure machine, aisle shelves). · `I6 bank` (cream tile, round steel vault door, teller counter with brass bars and glass, red velvet rope posts, ATM, blue sofa). · `I7 bookshop` (honey wood, rainbow-spined bookshelves floor to ceiling, staff-picks table, reading nook with violet rug and two armchairs, register). · `I8 bakery` (cream tile with orange check, twin ovens, pastry display case, chalkboard, three small cafe tables). · `I9 hardware` (concrete floor, two pegboards of tools, shelves of paint and plumbing, a showroom platform with bed, armchair and lamp). · `I10 cinema lobby` (burgundy carpet, gold trim, popcorn machine, soda machine, ticket booth, claw machine, arcade cabinet, two theatre doors, rope posts). · `I11 salon` (blush tile with pink check, three round gold-framed mirrors with stations, two black shampoo sinks, pink sofa). · `I12 laundromat` (pale tile, six white washers with round windows, three beige dryers, folding table, yellow chairs, thrift clothes rack, snack machine). · `I13 bike shop` (grey concrete, wall of hanging wheels, rows of commuter bikes in five colours, repair counter). · `I14 cafe` (warm wood floor, string lights, blue counter with espresso machine, round tables, big brown rug, bookshelf, tiny open-mic stage with mic and speaker). · `I15 pizza place` (green-tinted cream tile, big brick oven with glowing mouth, display case, red-and-white gingham tables, green booths). · `I16 dentist` (waiting room with fish tank and benches; exam room with teal dental chair and lamp arm). · `I17 Northgate Software floor` (server racks with LEDs, whiteboard, six desks with monitors, two bean bags, plus break-room with H2O cooler and coffee machine). · `I18 Keller Dynamics floor` (CNC mill, 3D printer, lathe, workbench, drafting tables, parts shelf, blueprint board). · `I19 Mercy General ward` (six hospital beds with blue blankets, nurses' station, supply cabinet). · `I20 Harlan & Pike` (plum carpet, conference table with six chairs, cubicle desks, targets board). · `I21 The Copper Pan kitchen` (two ranges, grill, fridge, steel sink, prep tables, the pass counter, three red staff tables). · `I22 Lakeview Elementary` (long hallway with red stripe and blue/green/rust lockers, plus classroom with whiteboard and twelve wooden desks; gym with honey wood court and two hoops; cafeteria with checker floor).

### Props, vehicles, nature — `RF-P1…P6`
- **P1 Street furniture sheet** (transparent or light grey): fire hydrant #d0453c, green slatted bin, planter, blue mailbox, newspaper boxes, bike rack with a parked bike, sandwich-board A-frame, iron-and-wood benches, lamp-posts (dark pole, cream glass lantern), traffic lights (black heads, red/yellow/green), manhole cover.
- **P2 Vehicles:** top-down and side views of sedans, a wagon, a van and a yellow taxi (roof sign, black checker dashes), in red #d64545, blue #3d7ea6, mustard #e9c46a, white, teal #2a9d8f, violet, charcoal, orange.
- **P3 Trees through the seasons:** a grid of one broadleaf tree in spring (some pink blossom), summer, autumn (rust, gold, crimson, olive variants) and winter (bare, snow on branches), plus a pine in summer and in snow.
- **P4 Fountain and pond:** the park fountain (round stone basin, central pedestal, upper bowl, spray) summer and frozen; the pond with lily pads, lotus, reeds with brown cattails, three ducks (one white, two mallard-brown with green heads), and a winter version with a dark ice-fishing hole.
- **P5 Park life:** picnic blankets (white with coral/blue/yellow checks) with wicker baskets, flower beds, a band on the bandstand (guitarist, singer at a mic stand, drummer with a red drum), a Saturday market stall with produce.
- **P6 Fish plate:** the eleven catches painted richly side-on — bluegill, yellow perch, carp, catfish, rainbow trout (red stripe), pumpkinseed, northern pike, golden koi, ice cod, an old boot, a softly glowing lavender moonfin.

### Light and weather studies — `RF-L1…L9`
`[SCENE]`, `16:9`, the same main-street corner (brick buildings, awnings, lamp-posts, a bus stop, a crosswalk with a traffic light) in **nine conditions**: `L1 dawn`, `L2 noon`, `L3 golden hour`, `L4 sunset`, `L5 dusk`, `L6 night with lit windows and wet-less pavement`, `L7 rain with reflections`, `L8 snow`, `L9 morning fog`. Same camera, same buildings, only light and weather change. Show how lamps, windows, neon and headlights glow and how shadows tint.

### Seasons — `RF-S1…S4`
The park at the fountain plaza in **spring** (blossoms, petals, butterflies), **summer** (lush, dappled shade), **autumn** (leaf-covered, four tree palettes), **winter** (snow banks, frozen fountain, bare snowy trees, footprints). `16:9`.

---

## 9. Full-screen backdrops  — `LATER`
`[SCENE]`, `16:9 2560×1440`, **no people unless stated, no text**, composed so the centre and lower third stay calm (UI sits there).

### Dreams — `bg/dream-<id>.png` (the game's twelve dream ids)
**Good:** `dream-fly` (*Above the Rooftops*: a luminous dusk sky, clouds like pillows, a glowing tiny town below) · `dream-feast` (*The Feast at Dot's*: a diner counter and booths heaped with pancakes, pie and an endless milkshake, warm glow, nobody drawn) · `dream-grad` (*Graduation Encore*: an impossibly vast auditorium full of smiling faces, caps rising, golden light) · `dream-perfect` (*The Perfect Day*: a flawless sunny day, huge sun with rays over a tidy town) · `dream-pond` (*Picnic by the Pond*: a still pond at golden hour, ducks in a row, a picnic blanket and basket).
**Bad:** `dream-late` (*Late for Day One*: a street stretching away, a giant clock face looming, buildings sliding backward, red-tinted) · `dream-hall` (*The Endless Hallway*: a corridor of locked doors in receding red-lit frames) · `dream-rent` (*Notice on the Door*: paper pouring under a door, long shadow of feet in the gap, red tint) · `dream-empty` (*Empty Plates*: a long table of empty plates under flickering light, everything else closed) · `dream-alarm` (*The Alarm That Won't Stop*: a room with an unseen ringing, an alarm clock face in the walls, pulsing rings) · `dream-dry` (*Dry Mouth*: a cracked dry fountain and a shrinking pond, sand, harsh amber light).
**Calm:** `dream-calm` (*A Quiet Nap*: a warm quiet dark with soft floating particles).
Good dreams: luminous, pink-and-amber glows. Bad dreams: unsettling but gentle (red vignette, long shadows) — never gory.

### Scenes — `bg/scene-<kind>.png`
`scene-cinema` (a cinema auditorium from the back: rows of maroon seats, silhouettes, a huge glowing screen left blank) · `scene-laundry` (washers with round windows, steam and soap bubbles, light from a window) · `scene-read` (a warm reading nook, lamp pool, steaming mug, an open book) · `scene-salon` (a large gold oval mirror with a blush wall; the person is not drawn) · `scene-dentist` (a ceiling view with a surgical lamp, a clouds poster) · `scene-music` (a small stage, spotlight cone, silhouetted crowd) · `scene-hang` (a small round table with two mugs, cosy cafe light).

### Fishing — `bg/fishing-day.png`, `-dusk.png`, `-night.png`, `-ice.png`
A pond view from the bank: sky with clouds, a far bank of round trees, water with depth and sun glints, lily pads, reeds with cattails in the foreground; the ice version has a pale ice sheet, snow mounds and a dark fishing hole. Leave the water surface open for the game's bobber.

### Shift-game concept art — `bg/job-<id>.png` (also `REF`)
Full-screen look-and-feel concepts, **no text**: `job-cs` (a dark IDE with syntax-coloured abstract code lines, a glowing bug) · `job-eng` (a blueprint sheet with metallic pipes, flanges and a flowing amber liquid) · `job-nurse` (a green-phosphor patient monitor with an ECG and bedside tags) · `job-biz` (a video-call window with a client portrait and an offer dial) · `job-edu` (a classroom desk with four colourful kid avatars, chalkboard) · `job-cook` (a busy pass with four pans, tickets on a rail, flames).

### Celebrations — `bg/levelup.png`, `bg/promotion.png`, `bg/recap.png`
Level-up: a violet-and-gold radial burst with ribbons. Promotion: gold-purple with a laurel. Morning recap: a sunlit window sill with a coffee cup and a folded paper.

---

### Evicted and blackout — `bg/evicted.png`, `bg/blackout.png`
`evicted`: a worn apartment door with a new padlock and a few cardboard boxes and a lamp on the pavement at dusk, rain-slick street, gentle melancholy (no person). `blackout`: a quiet clinic waiting-room corner, a chair, a glass of water and a wrapped snack on a table, soft warm light, a nurse's clipboard out of focus.

### Movie posters — `posters/<slug>.png`
`size: 2:3 1024×1536, alpha: no, no text`. Abstract poster art for the nine films (the game prints titles itself): **paper-moon** (*Paper Moon Bakery*, comedy: peach/yellow/pink, a crescent moon over a tiny bakery) · **long-fuse** (*The Long Fuse*, action: orange/red/amber, a lit fuse across a skyline) · **seven-rooms** (*Seven Quiet Rooms*, drama: slate blues, seven lit windows) · **lantern** (*Night of the Lantern*, horror: near-black, one red lantern in fog) · **small-town** (*Small Town, Big Sky*, romance: rose/mauve, two silhouettes under a huge sky) · **robo-pup** (*Robo-Pup Returns*, animated: cyan/magenta, a friendly robot dog) · **orbit-nine** (*Orbit Station Nine*, sci-fi: indigo/blue, a ring station and stars) · **pie-detective** (*The Pie Detective*, mystery: ochre/olive, a magnifying glass over a pie) · **kickoff** (*Kickoff*, sports: green/gold, a ball mid-air).

---

## 10. Portraits, marks and icon sets  — `USE` / `LATER`

### CH-08 — Speaking portraits (every conversation currently has no face) · `portraits/<slug>.png`
`size: 1024×1024 each, alpha: YES. IMPORTANT: identical framing for all — bust, shoulders cut by the bottom edge, head top at 12 % from the top, face centred, three-quarter turn toward the viewer's right, warm friendly neutral expression, soft rim light from the upper left.` Use the matching character description from §5 CH-07 (same clothing colours, hair, skin). `[CHAR]`.
Slugs: `dot` `sal` `bianca` `hank` `mrs-reyes` `luna` `agnes` `mr-okafor` `greta` `luc` `ms-park` `mr-alvarez` `principal-dawson` `dr-chen` `nurse-imani` `dr-patel` `mr-bell` `maya` `rosa` `priya` `walt` `june` `sam` `kofi` `dana-whitlock` `mr-keller` `head-nurse-rosalind` `ms-pike` `chef-marisol` · plus **the Graduate**: `grad-short` `grad-long` `grad-topknot` `grad-curly` `grad-cap` (the five hairstyles, coral tee). Optional extras per portrait: `<slug>-happy.png`, `<slug>-worried.png`.

### UI-06 — Employer marks (6) · `logos/<id>.png`
`size: 1024×1024, alpha: YES, symbol only — NO lettering`. Simple confident flat marks in each employer's colours: `cs` Northgate Software (blue-grey #5f7fa8 + cyan #6fd1ff, a compass-needle / north star mark) · `eng` Keller Dynamics (grey + amber #ffb347, a gear with a bolt) · `nurse` Mercy General (white + red #c9444f, a heart-cross) · `biz` Harlan & Pike (plum #4a3560 + lavender #e0b0ff, an H-and-P monogram shape without letters: two interlocking pillars) · `edu` Lakeview Elementary (mustard #e3b04f + brick #9a3b2e, an eagle head in a shield) · `cook` The Copper Pan (copper #c46a3b + cream, a frying pan with a flame).

### IC-05 — Shop door badges (12) · `badges/<shop>.png`
`size: 512×512, alpha: YES`. Round cream-ringed (#f6f1e7) medallion with a coloured disc and a **white line glyph, no text**: pharmacy (pill, green #2f9d6a) · bank ("$" mark drawn as a symbol, blue #2a6f97) · books (open book, brown #8a5a3c) · bakery (bread loaf, #d08a3a) · hardware (hammer, red #c0392b) · salon (scissors, pink #c05d8a) · laundromat (washing machine, teal #2a9d8f) · bikes (bicycle, tomato #e76f51) · cafe (steaming cup, navy #3d5a80) · pizza (slice, green #2f7d4f) · dentist (tooth, teal #3aa6b9) · cinema (film frame, burgundy #7a1f33).

### IC-06 — Food and drink icons · `icons/food-<group>.png`
`2048×2048 each, alpha: YES, 5×4 grid, generous gaps, painterly flat style with a soft highlight, no text`. Groups: **diner** (breakfast plate, burger lunch special, meatloaf dinner, fries and pie, pie slice, coffee, milkshake, ice water, jukebox record) · **grocery** (breakfast pack, lunch pack, dinner pack, snack bar, water bottle, orange juice, soda, energy drink) · **bakery-cafe** (croissant, cinnamon roll, cake slice, loaf, pastry bag, latte, iced tea, hot chocolate, panini, blueberry muffin) · **pizza-cinema** (cheese slice, garlic knots, whole pie, fountain soda, popcorn bucket, candy, plush toys: otter, penguin, frog, red panda, whale, dinosaur) · **pharmacy-market** (vitamins, pain reliever, sleep aid, protein bar, electrolyte drink, cough drops, farm box, lemonade, cider, honey jar, bouquet).

### IC-01…04 — Perk, stamp, trophy, weather sets · `icons/<set>.png`
Each set on one sheet, a regular grid with generous gaps, **transparent background**, consistent rounded-medallion style (navy disc #1b1636, lavender ring, white or gold glyph), `2048×2048`.
- **IC-01 Perks (16):** sun, moon, plate, water drop, chat bubble (pink), basket, "Zz", crescent, open book, bicycle, star, briefcase, sun-smile, dollar coin, speech spark, blue fish.
- **IC-02 Passport stamps (18):** house (coral), briefcase (blue), basket (green), plate and fork (red), red cross, tree (green), pill, "$" (blue), open book (brown), loaf, hammer (red), film frame (burgundy), scissors (pink), washing machine (teal), bicycle (tomato), coffee cup (navy), pizza slice (green), tooth (teal). Rubber-stamp ink look with a dashed inner ring.
- **IC-03 Trophies (24):** gold-foil medals/cups/ribbons for first paycheck, flawless, on a roll, moving up, top of the field, getting the hang of it, pillar of the community, one week down, four seasons, model tenant, rainy day fund, regular, popular, bookworm, cinephile, fresh look, two wheels, home sweet home, angler, legend of the pond, rush hour, brave, go-getter, good company.
- **IC-04 Weather glyphs (7):** sun, partly cloudy, cloud, rain, thunder, snow, fog.
- **IC-07 Passport book:** `ui/passport-cover.png` (`1024×1536`, alpha YES) — a worn navy booklet cover with a gold emblem, no text.


---

## 11. Asset registry (what the game will look for)

Drop PNGs into `fresh-grad/v2-visual-upgrade/assets/` using these relative keys. Missing keys are fine.

| ID | Key (file under `assets/`) | Status |
|---|---|---|
| CS-01 | `cutscene/still-01-quad.png` | USE |
| CS-02a–d | `cutscene/still-02a-lecture.png`, `still-02b-group.png`, `still-02c-coffee.png`, `still-02d-allnighter.png` | USE |
| CS-03 | `cutscene/still-03-wings.png` | USE |
| CS-04 | `cutscene/still-04-walk.png` | USE |
| CS-05 | `cutscene/still-05-handshake.png` | USE |
| CS-06 | `cutscene/still-06-diploma.png` | USE |
| CS-07 | `cutscene/still-07-hats.png` | USE |
| CS-08 | `cutscene/still-08-face.png` | USE |
| CS-09 | `cutscene/still-09-sunset.png` | USE |
| CS-10 | `cutscene/still-10-family.png` | USE |
| PL-01 | `cutscene/plate-stage-empty.png` | USE |
| PL-02 | `cutscene/plate-crowd-front.png` | USE |
| PL-03 | `cutscene/plate-crowd-back.png` | USE |
| PL-04 | `cutscene/plate-podium.png` | USE |
| PL-05 | `cutscene/sprites-hats-confetti.png` | USE |
| CH-03 | `chars/grad/pose-idle.png`, `pose-walk-a.png`, `pose-walk-b.png`, `pose-handshake.png`, `pose-diploma-up.png`, `pose-cap-toss.png`, `pose-wave.png`, `pose-nervous.png` | RIG |
| CH-04 | `chars/dean/pose-idle.png`, `pose-handshake.png`, `pose-clap.png`, `pose-point-announce.png` | RIG |
| CH-05 | `chars/ch-05-classmates-stand.png`, `-cheer.png`, `-toss.png` | RIG |
| PD-01–04 | `chars/grad/parts-sheet.png`, `chars/dean/parts-sheet.png`, `chars/classmate/parts-sheet.png`, `chars/grad/parts-everyday-sheet.png` | RIG |
| UI-01 | `title/hero-wide.png` | USE |
| UI-02 | `title/hero-tall.png` | USE |
| UI-03 | `ui/diploma.png` | USE |
| UI-04 | `ui/paper-cream.png`, `ui/paper-kraft.png`, `ui/paper-navy-card.png` | USE |
| UI-05 | `ui/phone-wallpaper.png` | LATER |
| §9 | `bg/dream-*.png` (12), `bg/scene-*.png`, `bg/fishing-*.png`, `bg/job-*.png`, `bg/levelup.png`, `bg/promotion.png`, `bg/recap.png`, `bg/blackout.png`, `bg/evicted.png`, `posters/*.png` | LATER |
| CH-08 | `portraits/<slug>.png` (conversation faces) | USE (wired into talk panels in a later pass) |
| UI-06 / IC-05 | `logos/<id>.png`, `badges/<shop>.png` | LATER |
| §10 | `icons/perks.png`, `icons/stamps.png`, `icons/trophies.png`, `icons/weather.png`, `icons/food-*.png`, `ui/passport-cover.png` | LATER |
| CH-01/02/06/07, RF-* | `fresh-grad/reference-art/…` (any names) | REF |

**How the game uses `USE` files:** the opening cutscene cross-fades these stills in at the matching beat (slow push-in, parallax drift, film grain, letterbox) over its own animated scene; the title screen can lay `title/hero-*.png` behind the live town; the degree picker shows `ui/diploma.png` as the diploma. With the `RIG` poses and parts present, the animated cutscene swaps its hand-drawn graduates for these characters. Without any files the game looks exactly as it does today, only richer.

---

## 12. Quality checklist before you hand a file back
- [ ] **No text anywhere** (banners, signs, diplomas, book spines can be abstract stripes).
- [ ] The Graduate looks like the **same person** in every image (hair, skin, gown, gold stole, cap).
- [ ] Gown navy ≈ `#1d2e6b`, stole gold ≈ `#f0b429`, coral tee ≈ `#ff7a59`.
- [ ] Transparent images have **clean edges** (no halo, no ground shadow).
- [ ] Pose images share the **same framing and scale** (feet at the bottom edge).
- [ ] Hands have five fingers and are not mangled.
- [ ] Stills leave the bottom ~18% calm for captions.
