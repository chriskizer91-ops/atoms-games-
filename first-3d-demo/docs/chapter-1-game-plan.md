# Creature Catch 3D: Chapter 1 Game Plan

Nov 2, 2026 · @Chris

## The short version

Build Chapter 1 first: the 35 creatures the v12 game already plays, from Home Village through Meadow Path to the Grassland. Five of them are done, which leaves 30 new models in 14 lines. The whole game has 175 creatures in 88 lines, so Chapter 1 is about a fifth of it.

- **Split it into five instruction docs**, one per batch, each run in its own chat in this Project.
- **Run them one at a time.** Batch 1 is a pilot. Check your usage before and after it, then decide whether to run the other four.
- **Moves are cheaper than they look.** Every creature shares the same 31 basic moves, and each line has one signature move. So a batch is mostly models.

## Chapter 1: 14 lines, 35 creatures, 30 to build

Chapter 1 is everything the v12 game plays today: Home Village, Meadow Path and the Grassland. Some final forms evolve after level 30 and won't show up in Chapter 1. Each line is still built whole so its stages look like one family.

| Line | Where | Already in 3D | New models | Signature move |
| --- | --- | --- | --- | --- |
| Drizzlon > Rapidrake > Tsunadrake | Starter | Drizzlon | 2 | Drizzle Dart (done) |
| Mossback > Thornshell > Elderoak | Starter | Mossback | 2 | Moss Mend (done) |
| Embroak > Cinderfrog > Infernotoad | Starter | Embroak | 2 | Ember Lash (done) |
| Clovermouse > Clove Tastical | Meadow Path | Clovermouse | 1 | Lucky Nibble (done), Lucky Leaf |
| Hopsprout > Hoppin Pop | Meadow Path | Hopsprout | 1 | Spring Kick (done), Fantastic Hop |
| Puffmunk > Stashmunk | Meadow Path | none | 2 | Cheek Stash |
| Fleecling > Cloudram > Tempestram | Meadow Path | none | 3 | Wool Puff |
| Tuftail > Verdantail > Sylvantail | Grassland | none | 3 | Grass Swipe |
| Bumblop > Bumblazer > Queenbuzz | Grassland | none | 3 | Static Hop |
| Dandylion > Sunmane | Grassland | none | 2 | Blaze Mane |
| Pebblepup > Boulderhound > Cragmastiff | Grassland | none | 3 | Rock Fetch |
| Dewt > Monsoonewt > Typhoonewt | Grassland | none | 3 | Dewdrop Dash |
| Wormapple | Grassland | none | 1 | Core Burrow |
| Scarecrowl > Scarecrown | Grassland | none | 2 | Scare Flap |

Total: 35 creatures, 5 done, 30 new.

## Moves: built once, used by every creature

The game has 119 moves. 31 are shared moves that many creatures learn, and 88 are signature moves, one per line. A shared move is animated once and works on any creature. The creature only needs a few body actions it can play on cue, like lunge, rear back, spit, stomp, spin and crouch. Chapter 1 creatures use 42 moves: 20 are already animated and 22 are left (9 shared, 13 signature).

The tiers stay the same for the whole game, so later creatures don't get harder. They each just bring one new signature move.

| Tier | Moves in the game | What it looks like | Length |
| --- | --- | --- | --- |
| Basic | 10 | A body action and a small hit in the type's colour (Tackle, Splash Jab) | About 1 s |
| Status or stat | 12 | Rings, an aura, a cloud or a shield (Growl, Guard Up, Spore Nap) | About 1.2 s |
| Signature | 88 | A short custom piece built around the creature's body (Ember Lash's tongue whip) | About 1.5 s |
| Strong | 9 | A big effect with screen shake and flash (Torrent Crash, Flare Burst) | About 2 s |
| Legendary (later chapters) | 6 creatures' moves | Camera moves and a full-screen moment | About 3 s |

A line's later stages reuse its signature move, bigger and brighter, unless the game gives that stage its own move. Clove Tastical and Hoppin Pop have their own.

## Five batches, each one chat

Each batch owns whole lines, so the same chat models every stage of its creatures. Each batch also takes a few shared moves, so all 22 remaining moves get done once.

| Batch | Creature lines | New models | Moves to animate |
| --- | --- | --- | --- |
| 1 (pilot): starter evolutions | Rapidrake, Tsunadrake, Thornshell, Elderoak, Cinderfrog, Infernotoad | 6 | Earth set: Pebble Toss, Dust Cloud, Quake Stomp |
| 2: Meadow Path | Clove Tastical, Hoppin Pop, Puffmunk > Stashmunk, Fleecling > Cloudram > Tempestram | 7 | Cheek Stash, Wool Puff, Lucky Leaf, Fantastic Hop |
| 3: Grassland A | Tuftail line, Bumblop line | 6 | Grass Swipe, Static Hop, Bolt set: Static Zap, Shock Pulse, Thunder Snap |
| 4: Grassland B | Pebblepup line, Dewt line | 6 | Rock Fetch, Dewdrop Dash, Lumen set: Glow Flash, Radiant Beam |
| 5: Grassland C | Dandylion line, Scarecrowl line, Wormapple | 5 | Blaze Mane, Scare Flap, Core Burrow, Shadow set: Shade Swipe, Venom Mist, Night Pounce |

The starter evolutions go first because the rival uses them, and because they grow out of models that already exist, which makes them the best test of the method. Each batch also adds its creatures to the Move Demo so you can try them.

## How a batch runs

A new chat starts with no memory of this one. So everything it needs will live in this Project: a shared 3D kit (the model code, the move code and a test page) and one instruction doc per batch.

1. **Make the sheets.** Take that batch's prompts from the [Turnaround Sheet Prompts](https://claude.ai/artifact/U4k2vWU4LmEU47WnR45Vaf) doc (section 6) to your ChatGPT art chat. This costs no Claude usage.
2. **Start a new chat in this Atoms Project.** Tell it to follow that batch's instruction doc, and attach the batch's sheets.
3. **It builds and shows its work.** It models each creature, renders it next to its sheet, animates its moves and sends you pictures.
4. **You review in that chat.** Ask for fixes there, so each batch's back-and-forth stays in one place.
5. **It saves one file back to the Project.** That file holds the batch's creatures and moves, and nothing else changes.
6. **I merge and publish.** When you're happy with a batch, I add it to the Creature Catch 3D demo here and republish the same private link. Nothing goes to the atoms-games repo.

Separate chats use the same usage as helper agents inside one chat would. What they add is visibility: you see each batch's cost, can pause between batches, and keep its images and fixes in one place.

## Watching usage

The pilot batch is the real measurement. I can't see your usage meter, so I won't guess a percentage.

- **Before Batch 1:** note your weekly usage.
- **After Batch 1 is reviewed and merged:** note it again. That gap times five is roughly Chapter 1.
- **Then pick one:** run Batches 2 to 5, stop at the starters and Meadow Path (Batches 1 and 2), or trim to fewer lines.
- **To keep a batch cheap:** batch your fix requests into one message, and accept "close enough" on final forms Chapter 1 never shows.
- **Merging is small.** Adding a finished batch to the demo is a short job compared with building it.

## Decisions before anything is committed

Nothing below has been started. Once you agree, I'll save the 3D kit and the five instruction docs to this Project.

- [x] Chapter 1 is the goal: 14 lines, 30 new models
- [x] Build whole lines, including final forms Chapter 1 never reaches
- [ ] Five chats, run one at a time, with Batch 1 as the pilot
- [x] Pick the town and battle looks from the toggles in the next demo before the batches start, so new creatures get tested in the look you keep
