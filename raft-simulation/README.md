# Raft Simulation (working title)

A first-person ocean survival game for laptops. You're stranded on a small raft. You hook materials floating past, keep a shark from eating your floor, and stay fed and watered. Everything is made in code with Three.js, with no image or sound files: textures such as wood grain, bark, rope and shark skin are painted pixel by pixel at startup, and the sky, clouds and water are shaders.

**To play:** open `index.html` in Chrome, Edge or Firefox. You can double-click it. It's one self-contained file and works offline.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` or arrow keys | Move |
| Mouse / touchpad | Look and aim |
| Left click | Use the tool in your hand (hold to wind up the hook, hold again to reel in) |
| Right click | Let go of the hook line |
| `1`–`4` or scroll | Switch tool: hook, spear, hammer, coconut |
| `E` | Grab something within reach |
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

## Stage 1 (this build)

- **Ocean and raft:** rolling waves. The 3×3 raft rides the swell, and things drift past on the current.
- **Rope hook:** wind it up, throw it, and reel it in. It snags up to 4 floating things: driftwood, plastic, palm fronds, coconuts and barrels (barrels give a mix, including scrap metal). You can also grab anything within reach with `E`.
- **The shark:** it circles, then picks an edge piece of the raft and bites it. The piece visibly gets chewed apart, and if it's destroyed it breaks off and floats away as planks. If you're in the water, it hunts you instead.
- **Spear:** stab the shark three times while it's biting the raft (two times while it's chasing you) and it flees for a while.
- **Hammer:** fixes a bitten floor piece for 1 wood per swing. It also rebuilds a broken piece for 3 wood and 2 palm fiber. With the hammer out, broken spots show as outlines.
- **Survival:** health, hunger and thirst. Coconuts give you food and water. Health comes back slowly when you're fed and watered.
- **Swimming:** walk off the edge to swim. Press `Space` near the raft's edge to climb back on.
- A Stage 1 goal list, a title screen, pause, and a game-over screen with your run's stats.

## Stage plan

1. **Raft, hook, shark, spear, hammer** ← this build
2. **Building:** make the raft bigger with the hammer, plus nets that catch things floating by
3. **Crafting menu and clothing:** several outfits, each with its own buffs
4. **Saving, sound and polish**

Bigger shark types as you progress are planned on top of these. The shark code already reads its numbers from a tier table in `src/config.js`.

## Working on it

```
npm install                 # three.js and esbuild (pinned)
node tools/build.js         # src/ -> index.html (one file, three.js bundled in)
node tools/build.js --dev   # same, unminified
NODE_PATH=/opt/node-tools/node_modules node tools/smoke.js   # headless playthrough + screenshots in tools/out/
```

`tools/smoke.js` simulates input to play through the Stage 1 loop: hook, shark bite, spear, repair, rebuild, swim, shark chase, climb, coconut and the save round-trip. It fails on any console error. It steps the game itself and renders only before each screenshot, because a headless browser draws in software.

| File | What it does |
|---|---|
| `src/config.js` | Tuning numbers: speeds, costs, stat drain, shark tiers |
| `src/ocean.js` | Wave function (shared by the CPU and the water shader) and the water shader: depth fade, reflection, sun glints, foam |
| `src/sky.js` | Sky shader with clouds, and the sky lighting captured from it |
| `src/render.js` | Frame pipeline: under-water pass, main pass, hands pass, bloom, tone mapping; quality levels |
| `src/textures.js`, `src/materials.js` | Every texture, painted from noise at startup, and the shared materials built from them |
| `src/raft.js` | Floor pieces, damage stages, repair/rebuild, how the raft rides the waves, collision |
| `src/debris.js` | Floating materials: models, drift and loot |
| `src/shark.js` | Shark model (body bends as it swims) and behaviour: circle, approach, bite, chase, flee |
| `src/player.js` | First-person movement: walking, jumping, falling in, swimming, climbing |
| `src/tools.js` | Hook, spear, hammer and coconut: first-person view model, animations, actions |
| `src/hud.js`, `src/style.css`, `src/index.html` | On-screen display and screens |
| `src/audio.js` | Synthesised sound effects and ocean ambience |
| `src/fx.js` | Spray, mist, blood clouds and splinters |
| `src/main.js` | Game loop, survival stats, goals, events, saving/restoring state |
