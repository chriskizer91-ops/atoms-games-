# Raft Simulation (working title)

A first-person ocean survival game for laptops. You're stranded on a small raft. You hook materials floating past, keep a shark from eating your floor, and stay fed and watered. Everything is made in code with Three.js, with no image or sound files: textures such as wood grain, bark, rope and shark skin are painted pixel by pixel at startup, and the sky, clouds and water are shaders.

**To play:** open `index.html` in Chrome, Edge or Firefox. You can double-click it. It's one self-contained file and works offline.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` or arrow keys | Move |
| Mouse / touchpad | Look and aim |
| Left click | Use the tool in your hand (hold to wind up the hook, hold again to reel in) |
| Right click | Hook: let go of the line. Hammer: open the build menu. Raw fish: throw it as bait |
| `Q` (hammer out) | Open the build menu and pick what to build (`R` steps to the next thing) |
| `1`–`6` or scroll | Switch tool: hook, spear, hammer, coconut, raw fish, cooked fish |
| `E` | Grab something within reach; empty a net; use the grill, rain catcher, crafting table or anchor; gather on islands |
| `C` or `Tab` | Crafting and wardrobe |
| `Space` | Jump, or climb back aboard from the water |
| `Shift` | Run or swim faster |
| `Esc` | Pause |

## Graphics

- **Water:** you can see into it. Things under the surface (the shark, the logs, floating materials) fade with depth. The surface reflects the sky, sparkles where the sun hits it, and foams where something breaks through it, such as the shark's fin, the logs or a floating plank.
- **Sky:** soft clouds, a low afternoon sun, and haze at the horizon. The sky also lights everything else in the scene.
- **Raft:** bevelled, weathered planks with grain, knots and nails, laid on bark-covered logs lashed with rope. Bitten planks get ragged, chewed ends.
- **Shark:** a smooth body that bends as it swims, with countershaded skin, gill slits, curved fins and a jaw that opens to bite.
- **Your hands:** fingers wrapped around each tool and a rolled sleeve that takes the colour of your top.
- **Lighting:** sun shadows, bloom on bright highlights, and filmic tone mapping.

**Graphics quality:** choose Low, Medium (the default) or High on the title screen or in the pause menu. If the first few seconds of play run slowly, the game drops one level on its own and tells you. Your choice is remembered in this browser.

**Difficulty:** choose Easy, Normal or Hard on the title screen or in the pause menu (remembered in this browser, and saved with a game).

| | Easy | Normal | Hard |
|---|---|---|---|
| Hunger and thirst drain | 60% | 100% | 135% |
| Shark damage (to you and the raft) | 60% | 100% | 140% |
| Time between shark attacks | 1.5× | 1× | 0.7× |
| Spear hits to drive a shark off | 1 fewer | as listed | 1 more |

## Stage 3.5 (this build): your changes after playing Stage 3

- **Clothing is for looks only.** No more buffs. The crafting panel's wardrobe shows a figure wearing your outfit, and your first-person sleeve takes the colour of your top. There are 9 pieces: 4 for the head, 3 for the body, 2 for the legs.
- **No cold any more.** The warmth bar is gone, and so is the extra thirst in the midday sun. Nights and storms only change how things look and the weather. The grill is for cooking (and it lights up the raft at night).
- **Choosing what to build is fixed.** With the hammer out, `Q` or right-click opens the build menu. Click something, then *Build this*, and the hammer is set to it. The bar above your hotbar shows the current pick. `R` still steps through them.
- **Crafting table** (6 wood, 3 palm fiber, built with the hammer). Press `E` at it to craft the bigger recipes. Every upgrade, the rain catcher and the anchor need one on the raft.
- **Recipes unlock as you find materials.** A recipe shows as *???* until you have held every material it uses, then a message names what just unlocked. Stone, found on islands, unlocks the stone oven, for example.
- **Upgrades:**

  | Upgrade | How | Cost | Does |
  |---|---|---|---|
  | Bone spear | Crafting table | 3 shark teeth, 2 wood, 2 palm fiber | Hits count 1.5× |
  | Scrap-metal spear | Crafting table | 4 scrap, 2 wood, 2 palm fiber | Hits count 2.5× |
  | Metal hook | Crafting table | 3 scrap, 3 palm fiber | Reels in 60% faster, grabs from further away, carries 6 |
  | Reinforced floor | Hammer on a floor piece at full health | 2 scrap, 1 wood | Twice the health; metal brackets show on it |
  | Wide net | Hammer on a net | 3 plastic, 2 palm fiber | Holds 8 instead of 5 |
  | Stone oven | Hammer on a grill | 6 stone, 1 scrap | Cooks in 5 s; wood burns 160 s instead of 90 |
  | Big rain catcher | Hammer on a rain catcher | 4 plastic, 2 wood | Holds 6 drinks and fills 60% faster |

- **Islands.** About 2½ minutes into a game, and every 4–6 minutes after that, an island drifts in on the current and stops beside the raft. Each one is different: a sandy beach, a grassy hill, and things to gather with `E`:
  - palms: shake them for coconuts (they grow back)
  - bushes: palm fiber (grows back)
  - rocks: stone
  - driftwood: wood
  - sometimes a washed-up crate: scrap, plastic, maybe a coconut

  Swim over and wade ashore. The shark won't follow you into the shallows. The clock shows how long the island stays (4 minutes). It never drifts off while you're ashore: it waits until you're back aboard.
- **Anchor** (4 scrap, 4 palm fiber, 2 wood; needs the table). Press `E` to drop it and the island stays as long as you like. Raise it and the island drifts on.
- **New goals:** "settling in" (crafting table, clothes, cooking, a night) and "land ho" (an island, stone, an upgrade, rain water).

## Stage 3

(Clothing buffs, warmth and heat thirst from this stage were taken out in Stage 3.5; see above.)

- **Crafting (`C` or `Tab`):** clothing, gear and what the hammer builds, each with its cost against what you have. The game keeps running while the panel is open.
- **Gear:** a palm-fiber bandage (3 palm fiber) heals 30 health.
- **Materials from the shark:** when the shark bites a floor piece, a tooth sometimes snaps off and stays stuck in the plank (pick it up with `E`). A spear hit sometimes tears loose a strip of sharkskin that floats up.
- **Day and night:** the clock at the top shows day, time and weather. Days run 6:00 to 20:00 and nights pass twice as fast. At night the sky has stars and a moon, and the water glows wherever something disturbs it. The shark leaves a glowing wake when it swims near the surface.
- **Weather:** clear, cloudy, rain and storms (storms start on day 2). Rain and storms bring darker skies, fog and a bigger swell. Storms add lightning and thunder.
- **Grill:** built with the hammer (5 wood, 1 scrap). Press `E` to add wood (90 seconds of fire per piece), then `E` with a raw fish to cook it (10 seconds), then `E` to take it. A cooked fish gives 32 food and 6 water. The fire lights up the raft at night.
- **Rain catcher:** built with the hammer (5 plastic, 3 wood, 2 palm fiber; needs a crafting table). It holds 3 drinks. It fills slowly in fair weather (about 70 s per drink) and fast in rain (about 14 s) or a storm (9 s). Press `E` to drink: 28 water.
- **A bigger predator:** once the reef shark is carrying 6 scars, driving it off one more time makes it leave for good, and its jaw floats up for you to grab. About a minute later a **hammerhead** arrives. It's bigger, has a wide flat head and a tall fin, and takes 5 hits to drive off. It often charges the raft head first: the hit heavily damages a floor piece and the pieces either side, and if you're standing near that edge you stumble into the water. A spear hit while it's charging makes it veer off.
## Stage 2

- **Growing the raft:** with the hammer out, outlines show on open water next to the raft. Click one to build a floor piece for 4 wood and 2 palm fiber. The raft can grow up to 7 pieces out from where it started in each direction.
- **Catch nets:** right-click with the hammer to switch to nets, then click an outline on an outer edge. A net costs 2 wood, 3 plastic and 2 palm fiber. It's a pole frame with a rope basket that sticks out over the water. Anything that drifts into it stays there (up to 5 things), and now and then a fish swims in. Look at the net and press `E` to empty it. Nets on the upstream side, where things drift in from, catch the most.
- **Nets can be lost:** a net goes down with its floor piece if the shark breaks that piece. If the shark attacks an edge with a net on it, it tears the net off first. If you build a floor piece where a net was pointing, the net comes down and you get its materials back.
- **Fish:** slot 5. Click to eat it raw (food, not much water). Right-click to throw it as bait.
- **Bait:** the shark smells bait in the water from about 40 m away. It leaves whatever it was doing (biting the raft or chasing you) to eat it, then noses around that spot for 25–35 seconds. Bait sinks after 45 seconds if nothing eats it.
- **The shark remembers:** every time you drive it off, it swims away with a new scar painted on its skin, up to 6. Each scar makes it bite harder, swim and bite faster, and come back sooner.
- **New goals:** once the first four are done, a second set walks you through building, nets and bait.

## Stage 1

- **Ocean and raft:** rolling waves. The 3×3 raft rides the swell, and things drift past on the current.
- **Rope hook:** wind it up, throw it, and reel it in. It snags up to 4 floating things: driftwood, plastic, palm fronds, coconuts and barrels (barrels give a mix, including scrap metal). You can also grab anything within reach with `E`.
- **The shark:** it circles, then picks an edge piece of the raft and bites it. The piece visibly gets chewed apart, and if it's destroyed it breaks off and floats away as planks. If you're in the water, it hunts you instead.
- **Spear:** stab the shark three times while it's biting the raft (two times while it's chasing you) and it flees for a while.
- **Hammer:** fixes a bitten floor piece for 1 wood per swing. It also rebuilds a broken piece for 3 wood and 2 palm fiber. With the hammer out, broken spots show as outlines.
- **Survival:** health, hunger and thirst. Coconuts give you food and water. Health comes back slowly when you're fed and watered.
- **Swimming:** walk off the edge to swim. Press `Space` near the raft's edge to climb back on.
- A Stage 1 goal list, a title screen, pause, and a game-over screen with your run's stats.

## Stage plan

1. **Raft, hook, shark, spear, hammer** (done)
2. **Building, nets, fish and bait, a shark that remembers you** (done)
3. **Crafting, clothing, weather and day/night, grill and rain catcher, the hammerhead** (done)
3.5. **Your changes: clothing for looks, no cold, a build menu, crafting table, recipe unlocks, upgrades, islands, anchor, difficulty** ← this build
4. **Saving, sound and polish**, plus a story told through messages in bottles

Predators are a tier table in `src/config.js`. A third species only needs a new entry there, plus its look and tactic in `src/shark.js`.

## Working on it

```
npm install                 # three.js and esbuild (pinned)
node tools/build.js         # src/ -> index.html (one file, three.js bundled in)
node tools/build.js --dev   # same, unminified
NODE_PATH=/opt/node-tools/node_modules node tools/smoke.js   # headless playthrough + screenshots in tools/out/
```

`tools/smoke.js` simulates input to play through everything (40 checks): hook, shark bite, spear and scar, repair, rebuild, swim, shark chase, climb, coconut, building a floor piece, putting up a net, a net catching material and a fish, emptying it, eating fish, bait luring the shark, a net torn off, opening the build menu with Q and picking from it, night with no cold meter, recipes locked until their materials are found, clothing made and worn for looks, the crafting table, spear and hook upgrades, the grill and its stone-oven upgrade, a reinforced floor, the rain catcher, an island drifting in, wading ashore and gathering stone, the island waiting for you, the anchor, difficulty, the reef shark leaving for good, the hammerhead ramming you off the raft, and save/restore. It fails on any console error. It steps the game itself and renders only before each screenshot, because a headless browser draws in software.

| File | What it does |
|---|---|
| `src/config.js` | Tuning numbers: speeds, costs, stat drain, shark tiers |
| `src/ocean.js` | Wave function (shared by the CPU and the water shader) and the water shader: depth fade, reflection, sun glints, foam |
| `src/sky.js` | Sky shader with clouds, and the sky lighting captured from it |
| `src/render.js` | Frame pipeline: under-water pass, main pass, hands pass, bloom, tone mapping; quality levels |
| `src/textures.js`, `src/materials.js` | Every texture, painted from noise at startup, and the shared materials built from them |
| `src/raft.js` | Floor pieces, damage stages, repair/rebuild, how the raft rides the waves, collision |
| `src/debris.js` | Floating materials: models, drift and loot |
| `src/nets.js` | Catch nets: model, placement outlines, catching, fish, emptying, loss |
| `src/bait.js` | Thrown fish bait: flight, floating, scent trail |
| `src/weather.js` | Clock, day/night, weather states, sun and moon, fog, swell, rain, lightning |
| `src/crafting.js` | Crafting panel (Craft and Build tabs), wardrobe preview, recipe unlocks, gear and weapon levels |
| `src/stations.js` | Crafting table, grill / stone oven, rain catcher / big catcher, anchor |
| `src/islands.js` | Island generation (terrain, palms, bushes, rocks, driftwood, crates), drifting in, visits, gathering |
| `src/shark.js` | Shark and hammerhead models (bodies bend as they swim), scars, and behaviour: circle, approach, bite, ram, chase, flee, follow bait, distracted, leave for good |
| `src/player.js` | First-person movement: walking, jumping, falling in, swimming, climbing |
| `src/tools.js` | Hook, spear, hammer and coconut: first-person view model, animations, actions |
| `src/hud.js`, `src/style.css`, `src/index.html` | On-screen display and screens |
| `src/audio.js` | Synthesised sound effects and ocean ambience |
| `src/fx.js` | Spray, mist, blood clouds and splinters |
| `src/main.js` | Game loop, survival stats, goals, events, saving/restoring state |
