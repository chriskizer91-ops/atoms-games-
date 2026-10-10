# Pass 6 — Shift games, scenes, dreams, fishing ("the full-screen moments")

Read `BRIEF-common.md` and `DESIGN.md` first. Pass name for scratch/notes: `activities`.

## You own
CSS: `src/css/05-dream.css`, `07-jobs.css` (shift activity shell + the six minigames), `08-scenes.css`, `11-fishing.css`.
HTML: only the four static blocks in `src/body.html`: `#job`, `#scene`, `#dream`, `#fishing`.
JS: `15-activities-core.js` (activity shell: intro/result cards, glyph icons `JGLYPH`, popups), `16-jobgames.js` (Bug Hunt, Pipe Fitter, Triage Rounds, Close the Deal, Echo Clap, The Line), `18-dreams.js` (dream screens + backdrop painters), `24-scenes.js` (animated scenes: movies, laundry, reading, haircuts, dentist, open mic, concerts, hanging out), `31-activities-extra.js` (fishing view, fish drawing, delivery pill visuals; **not** the delivery/friends/fishing logic). Plus new files named after those (e.g. `src/js/16b-lineart.js`, `src/css/07b-games.css`).

## Do NOT touch
Scoring, timing, difficulty, performance maths (`JA.rank`, `JA.mult`, `JA.diff`, `JA.focus`, spawn tables, patient/pitch/food data, fish tables and rarity, payouts), input handling semantics (keys, taps, hold-to-reel), when things start/end. The six games must play identically — same hit areas, same timers, same keyboard shortcuts. Don't touch HUD/phone/panels (pass 5), people sprite code (pass 3 owns `drawPerson`; scenes call it — keep using it, and you may layer extra scene-specific drawing around it), or interiors.

## Where the game currently is (baseline: `*-job-*` for 5 degrees (teacher's Echo Clap runs inside school lessons), `*-scene-*`, `*-dream-*`, `*-fishing-*`)
A job modal ("jcard") with a job-tinted header, performance meter, an intro card ("Today's shift", rules list, Clock in / Autopilot buttons) and a result card with a rank ring, then six distinct minigames each with their own look; scene canvases in a 16:9 card with a caption line; dreams as full-screen canvas backdrops with drifting motes and a title/line overlay; a 16:9 fishing canvas.

## Ambition list
**Shift activity shell** — make clocking in feel like entering a different place: header with job glyph, employer colourway, subtle pattern; richer intro card (illustration of the workplace, rules as tidy numbered steps, best-rank badge); a result card with a satisfying animated rank medallion, pay breakdown receipt look (perforated edge, ink-like numerals), S-rank shimmer; popups with better typography. Performance bar with a glow head.

**Per game**
1. *Bug Hunt* — a convincing code editor: title bar with traffic lights and tabs, minimap strip, line numbers, gutter markers, current-line highlight, indent guides, syntax colours, blinking caret, status bar; bugs as glossy beetle badges with draining rings, squash/splat + particle burst on fix, critical bugs electric. Prod-health meter as a tidy bar with glow/alert.
2. *Pipe Fitter* — an engineering blueprint/CAD feel: grid paper, dimension ticks, title block, metallic pipes with highlights, flange joints, rivets, flowing fluid with animated bubbles and glow when sealed, PUMP and ACTUATOR as detailed machines, steam puff on mistakes.
3. *Triage Rounds* — a hospital monitor with scanlines, phosphor glow, smooth ECG trace with sweep gap, SpO2 plethysmograph, beeping indicator lights, patient chart card with a paper-clip and handwriting-font feel for notes, big buttons that look like physical triage tags (green/amber/red) with fly-off animation.
4. *Close the Deal* — a video/phone call UI: client portrait as a richer SVG avatar (hair, brows, expressions, collar, background blur), talking pulse rings, speech bubbles with tails, heart meter, a polished offer dial with tick marks and the budget band as a glowing arc/track, confetti on a win and a gentle shake on a loss.
5. *Echo Clap* — a classroom feel: four desk-pads as colourful cartoon kid avatars that clap with bounce, clap rings, note colours, a chalkboard-style progress, soft stars on success.
6. *The Line* — a pass-kitchen at rush: pans with sheen, food that visibly cooks (colour/texture change raw→done→burnt), sizzle ring, steam, ticket rail with order tickets, flame glows on the burners, smoke puffs when burnt, a "bell" flash on Order up.

**Scenes** (`24-scenes.js`): movie theatre (screen light flickering on the audience, popcorn, seat rows with depth), laundromat (spinning drums with clothes, soap bubbles, steam, light through windows), reading (page turns, lamp pool, dust motes, bookmark), salon (mirror, cape, scissors animation, falling hair clippings, before/after reveal with a sparkle), dentist (lamp glare, tools, bib), open mic and concert (stage lights, haze beams, crowd silhouettes with raised phone lights, mic/guitar detail, notes floating), hanging out (location-themed). Letterbox, vignette, light grading, caption with proper typography.

**Dreams** (`18-dreams.js`): every motif painter becomes properly dreamlike — layered parallax, glow, soft particles, painterly gradients, distinct palettes for good/bad/calm, gentle camera drift, title typography with presence (Fraunces italic is available for dream titles), choice card styling. Nightmares unsettling but tasteful (vignette tendrils, glitch/cracks), good dreams luminous.

**Fishing** (`31-activities-extra.js` drawing + `11-fishing.css`): beautiful water with depth gradient, sun glints, animated ripples, lily pads, reeds, parallax shore/trees, a believable rod/line/bobber with splash rings, fish silhouettes under water that approach; the reel meter as a sleek vertical gauge with a shiny catch zone; catch result card showing the fish painted richly (`drawFishPic`: scales, fins, gradient belly, eye highlights), ice-fishing version in winter (ice hole, snow, breath puffs).

## Technical notes
- Each game builds its own DOM in `#jStage` and reports performance via the `JA` API; keep all of that. The `.pt/.pan/.bug/...` class names are queried by the game code — keep them and restyle freely.
- Canvas scenes (`SC.draw`, `drawDream`, `drawFishing`) run every frame while open; keep cost modest, cache gradients/sprites.
- Mobile: all games must remain fully playable at 390x844 with touch targets ≥ 44 px.
