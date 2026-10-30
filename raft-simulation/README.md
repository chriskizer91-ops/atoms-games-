# Raft Simulation (working title)

A first-person ocean survival game for laptops. You're stranded on a small raft. You hook materials floating past, keep a shark from eating your floor, and stay fed and watered. Everything is made in code with Three.js, with no image or sound files: textures such as wood grain, bark, rope and shark skin are painted pixel by pixel at startup, and the sky, clouds and water are shaders.

**To play:** open `index.html` in Chrome, Edge or Firefox. You can double-click it. It's one self-contained file and works offline.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` or arrow keys | Move |
| Mouse / touchpad | Look and aim |
| Left click | Use the tool in your hand (hold to wind up the hook, hold again to reel in) |
| Right click | Hook: let go of the line. Hammer: switch between building floor and nets (`R` works too). Fish: throw it as bait |
| `1`–`5` or scroll | Switch tool: hook, spear, hammer, coconut, fish |
| `E` | Grab something within reach, or empty a net you're looking at |
| `Space` | Jump, or climb back aboard from the water |
| `Shift` | Run or swim faster |
| `Esc` | Pause |

## Graphics

- **Water:** you can see into it. Things under the surface (the shark, the logs, floating materials) fade with depth. The surface reflects the sky, sparkles where the sun hits it, and foams where something breaks through it, such as the shark's fin, the logs or a floating plank.
- **Sky:** soft clouds, a low afternoon sun, and haze at the horizon. The sky also lights everything else in the scene.
- **Raft:** bevelled, weathered planks with grain, knots and nails, laid on bark-covered logs lashed with rope. Bitten planks get ragged, chewed ends.
- **Shark:** a smooth body that bends as it swims, with countershaded skin, gill slits, curved fins and a jaw that opens to bite.
- **Your hands:** fingers wrapped around each tool and a rolled sleeve. The sleeve will change colour with clothing later.
- **Lighting:** sun shadows, bloom on bright highlights, and filmic tone mapping.

**Graphics quality:** choose Low, Medium (the default) or High on the title screen or in the pause menu. If the first few seconds of play run slowly, the game drops one level on its own and tells you. Your choice is remembered in this browser.

## Stage 2 (this build)

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
2. **Building, nets, fish and bait, a shark that remembers you** ← this build
3. **Crafting menu and clothing:** several outfits, each with its own buffs. Clothes made from what you beat (teeth, hide, fins), weather that makes clothing matter, bigger predators with their own tactics, and glowing water at night
4. **Saving, sound and polish**, plus a story told through messages in bottles

The shark code already reads its numbers from a tier table in `src/config.js`, ready for bigger species.

## Working on it

```
npm install                 # three.js and esbuild (pinned)
node tools/build.js         # src/ -> index.html (one file, three.js bundled in)
node tools/build.js --dev   # same, unminified
NODE_PATH=/opt/node-tools/node_modules node tools/smoke.js   # headless playthrough + screenshots in tools/out/
```

`tools/smoke.js` simulates input to play through both stages: hook, shark bite, spear and scar, repair, rebuild, swim, shark chase, climb, coconut, building a floor piece, putting up a net, a net catching material and a fish, emptying it, eating fish, bait luring the shark, a net torn off, and save/restore. It fails on any console error. It steps the game itself and renders only before each screenshot, because a headless browser draws in software.

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
| `src/shark.js` | Shark model (body bends as it swims), scars, and behaviour: circle, approach, bite, chase, flee, follow bait, distracted |
| `src/player.js` | First-person movement: walking, jumping, falling in, swimming, climbing |
| `src/tools.js` | Hook, spear, hammer and coconut: first-person view model, animations, actions |
| `src/hud.js`, `src/style.css`, `src/index.html` | On-screen display and screens |
| `src/audio.js` | Synthesised sound effects and ocean ambience |
| `src/fx.js` | Spray, mist, blood clouds and splinters |
| `src/main.js` | Game loop, survival stats, goals, events, saving/restoring state |
