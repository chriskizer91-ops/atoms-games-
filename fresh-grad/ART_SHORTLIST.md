# Fresh Grad — remaining image requests

**Make only the images on this page.** Everything else from the old ~500-image plan (`IMAGE_PROMPTS.md`) is either delivered or cut.
The opening cutscene, the title screen, the diploma and the cast sheets are done (45 of the 52 images received are in the game; the rest were near-duplicates or unusable).
What is left: **23 core images**, plus **21 optional** ones if you want more.

**Rules for every image**
- **One take per image: no second takes, no near-duplicates.**
- **No text anywhere** (no letters, numbers, signs, logos).
- File name: the key below (for example `bg/dream-fly.png`) saves a mapping step; descriptive names are fine too.
- Attach as references: the style anchors `reference-art/p00-a-street`, `p00-b-character-stage`, `p00-c-icons-faces` and, for people,
  the model sheets `ch-01-grad-sheet`, `ch-04-dean-sheet`, `ch-06-grad-everyday-sheet`.
- Backdrops: **1920×1080, opaque, no people unless stated**, and keep the **centre and lower third calm** (the game puts text, cards
  and animation there). Portraits: **1024×1024, transparent background** (or flat `#FF00FF`).

**Style block to start every backdrop prompt (`[SCENE]`)**
> Stylized 2D digital illustration for a cozy small-town life-sim game. Clean confident shapes with soft cel-shading and painterly
> gradient lighting, gentle atmospheric depth, warm golden-hour light against cool deep-navy shadows, rich yet slightly desaturated
> palette with marigold gold (#ffc247) and coral (#ff7a59) accents, deep navy (#0b131e to #1d2e6b) shadows, subtle film grain, crisp
> readable silhouettes, charming and quietly funny. Not a photograph, not a 3D render. No text, no letters, no logos.

**Style block for portraits (`[PORTRAIT]`)**
> Stylized 2D character bust portrait for a cozy life-sim game: head and shoulders, three-quarter turn toward the viewer's right, warm
> friendly expression, round dark eyes with a small white highlight, soft brows, faint cheek blush, soft cel-shading with a warm rim
> light from the upper left, clean shapes without heavy outlines, framing identical for every portrait (head top at 12 % from the top,
> shoulders cut by the bottom edge, face centred). Transparent background (or flat #FF00FF). No text.

**Negative (where the tool allows):** text, letters, words, numbers, logo, watermark, signature, photorealistic, 3D render, plastic look,
anime eyes, heavy black outline, extra fingers, malformed hands, cropped head, duplicated limbs, blurry, muddy colours, gore, horror.

---

## Core — 23 images

| # | Key | Where it shows | Prompt (after the `[SCENE]` block) |
|---|---|---|---|
| 1-4 | `bg/recap-spring`, `bg/recap-summer`, `bg/recap-autumn`, `bg/recap-winter` | The morning card, **every morning** | A morning window sill with a coffee cup and a folded newspaper (blank, no print), the season outside the window: spring blossom / bright summer green / falling autumn leaves / snow. |
| 5-16 | `bg/dream-<id>` (12, below) | One dream **every night's sleep** | Good dreams luminous, pink-and-amber; bad dreams unsettling but gentle (red vignette, long shadows), never gory. On phones only the centre column shows, so keep the subject central. |
| 17-21 | `bg/job-<id>` (5, below) | Shift intro, **every workday** | A cosy illustration of that workplace in the job's colours, no people. The game shows it as a wide strip, so keep the key details in the **middle horizontal band**. |
| 22 | `bg/levelup` | Level-up card | A violet-and-gold radial burst with ribbons and sparkles. |
| 23 | `bg/promotion` | Promotion card | A gold-and-purple laurel burst. |

**Dreams**
| Key | Prompt |
|---|---|
| `bg/dream-fly` | A luminous dusk sky, clouds like pillows, a tiny glowing town far below, a sense of weightless flight. |
| `bg/dream-feast` | A diner counter and booths heaped with pancakes, pie and a never-empty milkshake, warm glow, nobody drawn. |
| `bg/dream-grad` | An impossibly vast auditorium full of smiling faces, caps rising in golden light. |
| `bg/dream-perfect` | A flawless sunny day, a huge sun with soft rays over a tidy sparkling town. |
| `bg/dream-pond` | A still pond at golden hour, ducks in a row, a picnic blanket and basket on the bank. |
| `bg/dream-late` | A street stretching away, a giant clock face looming, buildings sliding backward, red-tinted. |
| `bg/dream-hall` | A corridor of locked doors in receding red-lit frames, the far end always further. |
| `bg/dream-rent` | Paper pouring under a door, the long shadow of feet in the gap, red tint. |
| `bg/dream-empty` | A long table of empty plates under flickering light, every other place closed and dark. |
| `bg/dream-alarm` | A room where an alarm-clock face looms from the walls, pulsing rings, hallucinatory. |
| `bg/dream-dry` | A cracked dry fountain and a shrinking pond, sand, harsh amber light. |
| `bg/dream-calm` | A warm quiet dark with soft floating particles and a faint horizon glow. |

**Workplaces**
| Key | Prompt |
|---|---|
| `bg/job-cs` | A bright open-plan software office with glowing server racks, beanbags and a whiteboard (blue-grey #5f7fa8, cyan #6fd1ff). |
| `bg/job-eng` | A machine shop with a CNC mill, lathe, blueprint board and amber work lights (#8a8f98, #ffb347). |
| `bg/job-nurse` | A hospital ward with beds, a nurses' station and soft teal light (#e8eef0, #c9444f). |
| `bg/job-biz` | A boardroom with a long table, a view over the city and a targets board (#9b7bb0, plum). |
| `bg/job-cook` | A busy restaurant kitchen at rush with ranges, pans, flames and a ticket rail (#c46a3b, copper). |

---

## Optional — 21 images, only if you want more

**Fishing (4)** — `bg/fishing-day`, `bg/fishing-dusk`, `bg/fishing-night`, `bg/fishing-ice` (`[SCENE]`)
> A pond seen from the bank, sky with clouds, a far bank of round trees, water with depth and sun glints, lily pads, reeds with cattails
> in the foreground; keep the water surface open (the game draws the bobber and line). Dusk: amber and plum light. Night: deep navy, moon
> on the water. Ice: a pale ice sheet, snow mounds, bare snowy trees, **no fishing hole** (the game draws its own where the line lands).

**Activity scenes (7)** — `[SCENE]`. **Empty sets: the game animates the people and props on top, so paint only the room.**
| Key | Prompt |
|---|---|
| `bg/scene-cinema` | A cinema auditorium from the back, rows of empty maroon seats, a big blank glowing screen. |
| `bg/scene-laundry` | A laundromat's tiled wall, window light and a folding shelf, **no machines**. |
| `bg/scene-read` | A warm reading corner with an armchair, a bookshelf and a window, **no book, lamp or mug**. |
| `bg/scene-salon` | A blush striped salon wall with shelves of bottles, **no mirror**. |
| `bg/scene-dentist` | A ceiling seen from the dentist's chair, soft ceiling tiles and a clouds poster, **no lamp**. |
| `bg/scene-music` | A small stage with a brick back wall, curtains and string lights, **no spotlight, no band**. |
| `bg/scene-hang` | A cosy cafe interior with shelves, a window and string lights, **no table or mugs**. |

**Faces for the ten regulars (10)** — `portraits/<slug>`, 1024×1024 transparent, `[PORTRAIT]`, identical framing for all ten.
| Key | Who | Shirt | Hair | Skin | Details |
|---|---|---|---|---|---|
| `portraits/dot` | Dot, diner owner | `#f4a261` uniform | short golden `#c9a24a` | `#f3d0b0` | apron, big warm "hon" smile |
| `portraits/sal` | Sal, pizza maker | `#f6f1e7` | short `#1c1410` | `#d99d77` | floury apron, proud |
| `portraits/bianca` | Bianca, stylist | `#c05d8a` | long teal `#2a9d8f` | `#efc3a0` | scissors in hand |
| `portraits/hank` | Hank, hardware owner | `#c0392b` | grey cap `#8a8a8a` | `#d99d77` | grey beard, tool-belt strap |
| `portraits/mrs-reyes` | Mrs. Reyes, landlord | `#6f7bd4` cardigan | curly blond `#d8c27a` | `#f0c7a4` | warm, reading glasses on a chain |
| `portraits/luna` | Luna, cafe owner | `#3d5a80` | long chestnut `#5a3825` | `#c68a62` | apron, moon pendant |
| `portraits/agnes` | Agnes, bookshop owner | `#9b7bb0` | silver top-knot `#c9c9cf` | `#f2c9a5` | reading glasses, mischievous |
| `portraits/dr-chen` | Dr. Chen, physician | `#5ab0c9` scrubs, white coat | plain `#222` | `#e6b995` | stethoscope |
| `portraits/ms-park` | Ms. Park, second-grade teacher | `#c05d8a` | cap, brown `#7a4a2a` | `#f2c9a5` | kind, holding a coffee |
| `portraits/greta` | Greta, bank teller | `#2a6f97` blazer | blond top-knot `#d8c27a` | `#f0c7a4` | friendly, a lollipop jar glimpsed |

---

## Do not make
- Anything for the opening cutscene, the title screen, the diploma, paper textures or character sheets: **done**.
- Icons, badges, logos, food, stamps, trophies, mini-game pieces, fish, kids, the other ~70 portraits, reference boards, textures, light
  sprites, posters, phone wallpaper, passport cover, `bg/job-edu` (a teacher never sees that screen): **cut**.

## Already received (do not resend)
| Zip | Images |
|---|---|
| `-01` | 8: main street (style anchor), Graduate meets Dean, icons and portraits board, Graduate model sheet, Dean model sheet, quad, lecture hall, coffee by the window |
| `-02` | 9: two all-nighters, backstage, study crew, coffee close-up, walk to the Dean, handshake, diploma handoff, tossed caps |
| `-03` | 10: caps/diplomas/confetti sheet, sunset walk, tearful close-up, front crowd, family, idle pose, podium, empty stage, back crowd, eight moods |
| `-04` | 11: Graduate poses (cap toss, cheering, handshake, nervous, two walks, waving, two idles), Dean idle, second podium, second expression grid |
| `-05` | 10: Graduate on main street (title), Dean handshake / applauding / gesturing, Dean announcing with the Graduate, three classmate lineups, everyday outfit sheet, turnaround sheet |
| `-06` | **Arrived cut off at 10.9 MB.** Recovered: Golden-hour graduation on Main Street (phone title), Ornate Blank Diploma with Wax Seal, Seamless cream cotton paper texture (a pattern of mugs and books, not paper; not used). Navy velvet paper was damaged. Anything after it was lost; it is only worth re-sending if it held something from this page. |

Every slot in the game is optional: a missing file keeps the game's own drawing, so stopping at any point is safe.
