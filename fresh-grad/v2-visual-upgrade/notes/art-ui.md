# art-ui: optional illustrated-art slots in overlays, cards, the phone and panels

All slots are lazy. A screen asks `ART` for its keys when it is built. When a file arrives, `ART.when` upgrades the slot in place. Nothing is drawn, added or restyled while a file is missing, and `?noart` behaves the same way. Shared code: `js/36a-art-ui.js` and `css/13a-art-ui.css`.

## Scope after the coordinator's cut
**KEEP (the user is generating these files): finished and verified**

| Key | Where | Framing |
|---|---|---|
| `bg/recap-spring`, `-summer`, `-autumn`, `-winter` | Morning recap overlay (`#recap`), behind the card. `showRecap` picks the plate from `season()`. | Cover-fit to the full screen, centred. A navy radial scrim keeps the card the focus, and the card itself stays opaque. On a phone (390x844) the middle of the 16:9 plate shows. |
| `bg/levelup` | Level-up overlay (`#lvl`, `data-kind=level`) | Same, with a violet-tinted scrim |
| `bg/promotion` | Promotion overlay (same `#lvl`, `data-kind=promo`) | Same. The latest key wins, so a slow level-up plate never paints over a promotion that opens later. |

**Also wired as P06 cards (not in the KEEP or DROP list), harmless when the file is missing:** `bg/evicted` (game-over `#over`, dim red scrim) and `bg/blackout` (the "You blacked out" notice panel only; every other panel clears it).

**DROP list: implemented and tested before the cut, left in because missing art gives the identical look (verified below).** The coordinator said they will not get art for now.
- `icons/perks/<id>` (16): level-up perk cards and phone perk chips. Drawn over the 96px medallion canvas at 1.25x zoom. All 16 game ids match the brief exactly.
- `icons/stamps/<id>` (18): passport list in the phone Map tab. Same per-place tilt as the drawn stamp. A stamp not yet collected is a faint grey ghost. All 18 `PASSPORT` ids match.
- `icons/trophies/<id>` (24): phone trophy shelf (76px image on the 58px slot; locked ones are greyed with the lock kept) and the trophy toast badge. All 24 `ACH` ids match.
- `icons/weather/<id>`: recap forecast card and the phone Today card. The game only produces `sun cloud rain storm snow fog`; `partly` is never used.
- `food/<slug>`: option-row icon tile (46px image in the 40px tile). Locked rows dim the image and add a small lock badge. Mapping is in `ART_FOOD`. Place-specific keys come first (`cinema|Fountain soda` maps to `cinema-soda`, `pizza|Fountain soda` to `pizza-soda`), then the title alone, then two patterns (`* rug` maps to `hw-rug`, `* commuter bike` to `bike-commuter`).
  - Shared slugs: `Day-old loaf` and `Fresh loaf` both use `bakery-loaf`. `Water bottle refill` (bikes) uses `grocery-water`. Both whole-pie rows use `pizza-whole-pie`. `Coffee` uses `diner-coffee`, both at the diner and at the office.
  - Unmapped rows stay procedural: `Chips` (laundromat), free water rows, books, movie tickets, clothes, haircuts, shampoo, laundry services, bank rows.
  - Slugs the game has no row for: the `plush-*` set (claw prizes only appear in a toast, which lives in `01-core-sim.js`).
- `ui/phone-wallpaper`: `.ph-screen` background (cover-fit) under a navy scrim that gets darker toward the tab bar.
- `ui/passport-cover`: `.pp-cover` band. The middle of the booklet sits behind a left-to-right navy scrim so the gold title stays readable.
- `portraits/<slug>`: avatar disc in phone texts (a 150% bust crop showing the face). `ART_PORTRAIT` maps all 55 `TOWN_FOLK` names and the five bosses that have a brief slug. Unmapped: `Principal Ortiz` (the brief has `principal-dawson`; this is a mismatch in the brief) and `Maple Town Bulletin`. Unmapped senders keep the coloured initial.

## Verification
- **Missing art is identical.** `scratchpad/art-ui/scripts/same.js` freezes the game loop and compares the overlay DOM (outerHTML, class, style) and every canvas's pixels (`toDataURL`) between the baseline build and this build. It covers 35 screens (panels, 15 interior shop spots, the blackout and other notices, all 5 phone tabs, level-up, promo, recap, trophy toast, eviction) at 1280x720 and 390x844. With no `assets/`: IDENTICAL. With placeholders present but `?noart`: IDENTICAL. (Tour PNG diffs are noisy even baseline against baseline because the live town animates, so they cannot prove this.)
- **With placeholders** (Pillow, at the brief's sizes, kept in scratch, never committed): all four recap seasons, level-up, promo, blackout and evicted look right at both viewports. Tours (ui, panels, mobile) show no page errors.
- **Parity:** `REMOVED (0)`. The 15 `LOGIC?` entries are the same 15 the baseline already shows; none are new. My edits classify as DRAW/UI: `renderPanel showRecap showLevelUp showPromo renderPhone phToday phMap phMsgs phTrophies trophyToast showOver drawStampArt`. Each gets one added call, and no state, ids or return values change.
- **Playthrough:** the same result as `index.html` (33/34). The one failure (wake-up time after a dream) also fails on the untouched build, and its numbers depend on timing.

## Known limitations and wishes
- The backdrop is a `::before` on the overlay, so it covers the dimmed town behind the card. The scrim strength was tuned on placeholders; it may want ±0.1 alpha once real plates arrive.
- `js/36a-art-ui.js` loads after `35-degree-flow-boot.js` runs `boot()`. Its `const` tables are only read from screen builders, never during boot. If boot ever starts rendering a panel or the phone synchronously, the tables need to move earlier.
- Canvas icon slots use `ctx.filter` for the stamp ghost. Browsers without it show the same ghost without the sepia.
