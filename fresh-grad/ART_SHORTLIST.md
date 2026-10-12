# Fresh Grad — art short list (replaces the ~500-image plan)

**Make only the images on this page. Skip everything else in `IMAGE_PROMPTS.md`.** The opening cutscene is finished (38 delivered
images are in the game). What is left below are the pictures a player actually sees often: 25 core images, plus 21 optional ones.

Style, cast and delivery rules are unchanged: see `IMAGE_PROMPTS.md` §1 (sizes), §3 (style blocks `[SCENE]`, `[PORTRAIT]`, palette)
and §4 (cast). Attach the delivered style anchors (`reference-art/p00-*`) and model sheets (`reference-art/ch-01-grad-sheet`,
`ch-04-dean-sheet`) as references. **One take per image: no second takes, no duplicates.** File names: the key below (for example
`bg/dream-fly.png`) saves a mapping step, but descriptive names are fine too.

All backdrops are `1920×1080 · opaque · [SCENE]`, no people unless stated, **no text**, and keep the **centre and lower third calm**
(the game puts text and animation there).

## Core — 25 images

| # | Key | Where it shows | Prompt |
|---|---|---|---|
| 1 | `ui/diploma` (1600×1200, transparent) | Degree picker, every new game | A formal diploma lying flat, seen straight-on: heavy cream paper (#f6f0dc) with subtle fibres, an ornate engraved navy double border with corner flourishes, a large blank central area (no words), a raised gold wax seal with a red ribbon at the lower right, a faint laurel-and-open-book crest watermark (no letters) at the centre, soft paper shadow, one slightly curled corner at top-left. |
| 2-5 | `bg/recap-spring`, `bg/recap-summer`, `bg/recap-autumn`, `bg/recap-winter` | The morning card, **every morning** | A morning window sill with a coffee cup and a folded paper, the season outside the window: blossom / bright green / falling leaves / snow. |
| 6-17 | `bg/dream-<id>` (12) | One dream **every night's sleep** | See the 12 rows below. Good dreams luminous, pink-and-amber; bad dreams unsettling but gentle (red vignette, long shadows), never gory. |
| 18-23 | `bg/job-cs`, `bg/job-eng`, `bg/job-nurse`, `bg/job-biz`, `bg/job-edu`, `bg/job-cook` | Shift intro, **every workday** | See the 6 rows below. A cosy illustration of that workplace in the job's colours, no people. |
| 24 | `bg/levelup` | Level-up card | A violet-and-gold radial burst with ribbons and sparkles. |
| 25 | `bg/promotion` | Promotion card | A gold-and-purple laurel burst. |

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
| `bg/job-edu` | A sunny classroom with small desks, a chalkboard and kids' paintings (#e3b04f, #9a3b2e). |
| `bg/job-cook` | A busy restaurant kitchen at rush with ranges, pans, flames and a ticket rail (#c46a3b, copper). |

## Optional — 21 images, only if you want more
| Keys | Where it shows | Prompt |
|---|---|---|
| `bg/fishing-day`, `bg/fishing-dusk`, `bg/fishing-night`, `bg/fishing-ice` (4) | Fishing | A pond seen from the bank, sky with clouds, a far bank of round trees, water with depth and sun glints, lily pads, reeds with cattails in the foreground; keep the water surface open. Ice: a pale ice sheet, snow mounds, a dark fishing hole with a white rim, bare snowy trees. |
| `bg/scene-cinema`, `-laundry`, `-read`, `-salon`, `-dentist`, `-music`, `-hang` (7) | Activities | Cinema auditorium from the back with maroon seats and a huge blank glowing screen · washers with round windows, steam and soap bubbles · a reading nook with a lamp pool, steaming mug and open book · a gold oval mirror on a blush striped wall · a ceiling view with a round surgical lamp and a clouds poster · a small stage with a spotlight cone and silhouetted crowd · a small round cafe table with two mugs, cosy light. |
| `portraits/dot`, `sal`, `bianca`, `hank`, `mrs-reyes`, `luna`, `agnes`, `dr-chen`, `ms-park`, `greta` (10, 1024×1024 transparent, `[PORTRAIT]`) | Conversations with the ten regulars | Use each person's row in `IMAGE_PROMPTS.md` §5 P05 (shirt, hair, skin, trait). Identical framing for all ten. |

## Do not make (the rest of the ~500)
- **More cutscene art**: Dean handshake / clap / announce poses, classmate lineups (CH-05), paper-doll sheets (P12). The finished stills
  cover the whole opening, so these would never be seen.
- **Reference boards (P11, ~62)**: the game never loads them.
- **Icons, badges, logos, food, stamps, trophies (P07, ~140)** and **mini-game pieces (P08, ~60)**: small, numerous, and the game's own
  drawings already cover them.
- **Textures, light sprites, posters (P09, P10)**, title variants (UI-01/UI-02: the street anchor already serves as the title), paper
  textures, phone wallpaper, passport cover, the other ~70 portraits, kids, fish.

Every slot above is optional in the code: a missing file just keeps the game's own drawing, so stopping at any point is safe.
