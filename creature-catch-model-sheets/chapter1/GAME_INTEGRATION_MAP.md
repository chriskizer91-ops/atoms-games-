# Integration map: the earlier 3D demo's code, for swapping in our models

Written by a read-only research pass over `origin/first-3d-demo:first-3d-demo/source/`. References are
`file:line` inside `src/` unless shown otherwise.

## 1. three.js version and loading
- **Version and form:** `vendor/three.min.js` is r128 (UMD, a classic script; `THREE` is a global). It's
  inlined by `shell.html:48` / `build.py:25`. There are no modules.
- **No loaders:** there is no GLTFLoader and no SkeletonUtils. The core build has SkinnedMesh,
  AnimationMixer, AnimationClip, PropertyBinding and ImageBitmapLoader.
- **Adding GLTFLoader:** the npm package `three@0.128.0` has the classic-script copies:
  - `examples/js/loaders/GLTFLoader.js` (sets `THREE.GLTFLoader`; supports `KHR_mesh_quantization`)
  - `examples/js/utils/SkeletonUtils.js`
  - Put them in `vendor/`, append them after `three.min.js` at `build.py:25`, and add `<script>` tags to
    the test pages.
  - Don't use r170 `jsm` copies: they're ES modules written for a newer API.
- **How the r128 loader behaves:**
  - It sets `material.skinning = true` on skinned meshes, and r128 needs that flag.
  - `map` and `emissiveMap` are treated as sRGB, with `flipY = false`.
  - It uses ImageBitmapLoader except on Firefox, which is a known source of iOS Safari problems.
  - `parse(arrayBuffer, '', onLoad)` works offline.

## 2. Creatures
**How a model is built:** `makeCreature(id, opts)` (`creatures.js:12-139`).
- Structure: `root` → `rig` → part groups made by `C.part`, which records each part's rest pose (`:24`).
- `D.build(C, KIT)` (`:50`) merges pieces with the KIT builder (`kit.js:144-185`), the toon material
  `KIT.toon` (`kit.js:22`) and the back-face ink `inkMat` (`kit.js:37`).
- 35 definitions: 5 in `creatures.js`, 30 in `lines/*.js`. Each has `build`, `idle` and `act`.

**Definition data the game reads:** `height`, `width`, `size`, `eyeY`, `hopper`, `mouth` (an offset in
head-part space) and `mouthPart`. They're used at `battle.js:71-73,86`, `moves.js:33,99,108`,
`world.js:65`, `story.js:108` and `main.js:140`. **A GLB creature still needs a `CREATURE_DEFS` entry.**

**Per-frame motion:** `update(t, dt, walk)` (`:84`):
- resets every part to rest (`:86`);
- adds whole-body offsets on `rig` (breathing, walk bob);
- runs `D.idle`, then the current action's `def.f(u, off)` and `D.act(C, name, u)`;
- fires the hit callback at `def.hit`;
- blinks (scales `C.eyes`), flickers glow, and flashes or fades every material.

**API the game expects** (`:119-136`): `id`, `root`, `rig`, `parts`, `height`, `size`, `eyeY`, `width`,
`hopper`, `mouth(out)` (a world position), `update`, `reset`, `play(name, onHit)`, `flash(k, col)`,
`busy`, `act`, `fade(a)` and `setSleep(on)`.
- `play` returns a Promise that resolves at the end of the action; `onHit` fires at `def.hit`.
- "Hold" actions keep their final pose until the next action.
- An unknown action resolves at once.

**Body actions** (duration in seconds / hit fraction; "hold" keeps the pose):

| Defined in | Actions |
| --- | --- |
| `creatures.js:55-75` | attack .55/.32, cast .8/.45, hit, hop, happy, shake, roar .9/.35, faint (hold), appear, vanish (hold), sleep (hold), crouch (hold), spit .6/.34, flick .75/.36, puff, curl, spin, chomp .55/.3, tuck (hold) |
| `movesets/grassA.js` | grassswipe .6/.42, statichop |
| `movesets/grassB.js` | rockfetchdip (hold), rockfetchfling .5/.5, dewdropstretch (hold), radiantbeamcharge (hold), radiantbeamfire (hold), radiantbeamend |
| `movesets/grassC.js` | maneflare, coreroll, scareflap 1.05/.62, shadowsink (hold), shadowrise |
| `movesets/meadow.js` | cheekstash, woolpuff, fantastichop .55/.2 |
| `movesets/starters.js` | dustkick .8/.55, quakestomp 1.0/.5 |

**Who plays them:**
- The `act()` helper in `moves.js:35` waits for the hit moment.
- `battle.js`: hit `:161`, shake `:177/198`, attack on a miss `:207`, appear `:277/327`, faint `:282`,
  vanish `:301/472`, happy `:351/554`, hop `:451`.
- `story.js`: `:94-127`, `:229-235`, `:296-299`, `:451`.
- The follower in town calls `update(t, dt, walk)` (`world.js:252`).

**Other things move code touches on a creature:**
- `root.position`: dashes and leaps move it (`moves.js:133-154`).
- `root.visible`, `.scale`, `.rotation` (`battle.js:78-82,636-638`).
- `root.clone(true)` for afterimages (`moves.js:118-123`).
- `mouth()`, `flash`, `setSleep`.
- Named parts: `parts.ember`, `parts.clover`, `parts.head`, and `parts.crowL`/`parts.crowR` with their
  children `<name>wl`/`<name>wr`. All are guarded, so a missing part only weakens the effect.

## 3. People
**How a person is built:**
- `person.js` is generated from `person.src.js` by `tools/make_person.py`.
- `makePerson({look, ready, detail})` merges pieces into SkinnedMeshes and adds a skinned ink copy
  (`:300-338`).
- Motion comes from two-bone leg IK, spring chains for hair, scarf and skirt, and keyed actions
  (`:879-970`).

**Interface** (`:1211-1225`):
- `root`, `fx`, `animate(phase, walk, t, dt)`, `play(name, force)` (returns a bool), `reset`, `busy`.
- `anchor(name, out)` with the names `chest`, `head`, `hit` and `hand`; `hand` is the right wrist.
- `PHASE_PER_M` = 11 radians of walk phase per metre of body.

**How world, story and battle code drive a person:**
- **Creation:** `WORLD.person(key, h)` (`world.js:59-63`) scales by `MS * height` with `MS = 24/1.13`, so
  a person is 24 px tall.
- **Each frame** (`animActor`, `world.js:246-254`):
  - it sets `root.position` and `root.rotation.y = yaw`; facing down is 0, so the model faces +Z;
  - phase += distance walked / `MS` × `PHASE_PER_M`;
  - it calls `animate` with `walk` from 0 to 1;
  - running is worked out from how fast the phase changes.
- **Actions used:**
  - look and nod: idle NPCs at random (`world.js:267`), `main.js:110`, `story.js:34,257`;
  - wave, cheer, point, surprise, throw: `story.js:245-259,429`, `main.js:74-81`, `battle.js:596-597`.
- **Anchors used:**
  - `head` for the dialog face close-up (`world.js:300-307`, `battle.js:517-522`) and the emote bubble
    (`world.js:278`);
  - `chest` for the see-through hole in scenery (`world.js:291`).
- **Throwing the cube in battle** (`battle.js:294,426,460`):
  - the code calls `play('throw', true)`, waits .42–.44 s, then reads `anchor('hand')` as the cube's
    start point;
  - that matches the release at .44 of the 1.05 s throw. **Our throw releases at 0.5 s.**
- **Battle extras:** people are animated with `animate(0, 0, t, dt)` (`battle.js:509`). The painted look
  rescales them assuming a 24-unit height (`:585`).

## 4. Places
**How buildings, furniture and props are built** (`places.js`):
- Textures `TX` (32–64 px canvases) are at `:164-173`.
- Materials `MAT` (`:175-191`) are `KIT.toon` with vertex colours plus `see` (dithered see-through near
  the player).
- Outlines use `INKPX` (`:194`).
- Each place is merged per material in a single `B.build` (`:615,662`) and cached per map (`:609`).

**`gableHouse`** (`:360-385`) builds:
- a wall box with world-space box UVs `uv:[32,34]` (`kit.js:160`);
- the gable triangles, two roof slabs and a ridge;
- a stone footing;
- windows: a frame, glass in `MAT.glow`, bars, a sill and flower boxes.

**Other builders:**
- `HOUSES` (`:396-479`); door panels are separate hinged groups (`:386-395,633`).
- `PROPS` (`:482-499`) and `FURN` (`:502-522`) are mostly `MAT.vc` primitives tinted per vertex. Wooden
  and stone parts use `MAT.wood`/`MAT.stone` with `uv:[16,16]`.
- `PLACES.MAT` is also used by the battle stage (`battle.js:28-36`) and the title scene
  (`main.js:20-24`).

**Diorama town look:**
- Code: `setLook` (`:576-583`), called from `WORLD.applyLook` (`world.js:213-220`). The Looks menu is
  `story.js:362-366`; the choice is saved at `core.js:109-111`.
- It works only outdoors, and only where a painting exists (`dio-village`, `dio-meadow`,
  `dio-grassland`).
- `buildDiorama` (`:553-574`):
  - lays the painted map on a plane at y .15;
  - hides the 3D forest;
  - adds leaning tree cut-outs (`tree-oak`, `tree-pine`).
- Houses, props, tall grass and characters stay 3D.

**Painted battles** (`setLook`, `battle.js:108-114`):
- The painting becomes `scene.background`, and the 3D stage and sky are hidden.
- A ShadowMaterial plane keeps the shadows.
- Pad positions come from projecting screen points onto the ground (`groundAt`, `:103-107`).
- The camera is fixed (`PAINTCAM`).
- Creatures are sized to 40 px (foe) and 44 px (ally) of the 160-px screen (`:74-77`).

**Re-skinning:**
1. Replace the `TX` canvases and `roofTex` (`:164-173`) with the painted tiles, keeping the `MAT` keys.
2. For painted facades per building: give each house kind its own materials, and add a UV origin to the
   builder, because its `uv` mapping is absolute world position divided by scale.
3. Parts tinted through `MAT.vc` (frames, doors, awnings, the hut's cone, props, furniture) have no useful
   UVs. Each needs a `uv` option or its own UVs, plus a textured material.
4. Keep `see` (or `SEEFN`, `kit.js:20`), so buildings still dither away around the player.

## 5. Units and scale
- **Tiles:** 16 px per tile. A tile's centre is (x·16+8, y·16+9).
- **People:** 24 px tall, i.e. 1.5 tiles.
- **Creatures in town:** height = 24 × √size × def height (`world.js:65`).
- **Battle sizes:** the foe is 54 × size / max(h, .9·w) and the ally 40 × √size / … (`battle.js:71-73`).
  The cube is 0.3 m × 26.
- **Town camera:**
  - field of view 35°; distance = hv / 2 / tan(fov/2), with hv = 132;
  - elevation .64 rad;
  - indoors: elevation .82, hv 128;
  - diorama: elevation .9, hv 172, fov 27.
- **Battle camera:** field of view 38°, from (−36,64,196) toward (14,10,−38).
- **Renderer:** antialiased, PCFSoft shadows, linear output encoding, pixel ratio capped at 2.

## 6. Build
**What `tools/build.py` does:** puts `core.js`, `cc-sfx` and `cc-music` first, then the `order` list
(`lines/*.js`, `movesets/*.js`). It fills `/*FONT*/`, `/*THREE*/` and `/*CODE*/` in `shell.html` and
writes `dist/creature-catch-3d.html`, about 2.25 MB.

**Where the paintings come from:** `paintings.js` holds 7 base64 PNGs, from the 2D game's `art/bg`:
`meadow`, `village`, `dio-village`, `dio-meadow`, `dio-grassland`, `tree-oak` and `tree-pine`.

**Carrying our models:** use files next to the HTML (`assets/models/*.json` and `assets/textures/*`),
loaded with fetch. That needs http(s). Preload them in `boot()` (`main.js:148-156`), before
`TITLE.build()`, then clone them synchronously.

## 7. Smallest swap path
**(a) Creatures**
1. Add the r128 GLTFLoader and SkeletonUtils.
2. Preload each model once:
   - use a material that shows the textures (no ink), with `skinning = true`;
   - set texture encodings to match the renderer;
   - scale the model to `CREATURE_DEFS[id].height`, using the loader's bounding box (r128 doesn't undo
     quantization in `getX`).
3. In `makeCreature`, when a model exists:
   - add `SkeletonUtils.clone(src)` under `rig`, with materials cloned per instance;
   - skip `build`, `idle` and `act`;
   - run an AnimationMixer in `update()`.
4. Map game actions to clips:

| Game actions | Clip |
| --- | --- |
| attack, chomp | physical |
| spit, cast, flick | special |
| roar, puff, maneflare | boost or status |
| curl, tuck | boost_guard |
| quakestomp, scareflap | strong_physical |
| radiantbeam* | strong_special |
| hit | hit |
| faint | faint (play once and hold) |
| appear | send_out |
| idle / walk | idle / walk |

   Set each clip's `timeScale` to clip length / `def.dur`. Keep the whole-body offsets on `rig`.
5. Expose bones as `api.parts`, but don't register them in `C.parts`: the rest-pose reset would fight the
   mixer. Implement `mouth()` with the manifest's mouth anchor.

**(b) People:** `makePersonGLB(key)` with the same interface.
- `root` scaled to 24 px.
- `animate`: blend idle, walk and run by phase rate.
- `play`: map wave, cheer, point, throw and talk; return false for actions without clips (nod, look,
  surprise).
- `anchor`: `head` → `head_top` or the head bone, `chest` → the chest bone, `hand`/`hit` → `hand_R`.
- Fix the throw wait for our 0.5 s release.

**(c) Buildings and props:** swap the `TX` textures first, then add per-building materials and UVs where
you want painted facades.

**Risks:**
- **r128 skinning:** any custom material on a skinned mesh needs `skinning = true`, otherwise it renders
  in the bind pose.
- **Ink outlines on quantized meshes:** these break; skip ink on GLB models.
- **Afterimages** (`moves.js:118-123`): clone with SkeletonUtils, using a skinning material.
- **Flash** changes `emissive`. With an `emissiveMap`, only the glowing areas would flash, so use a flash
  uniform instead.
- **Blinking and sleep** do nothing without eye parts.
- **Culling:** set `frustumCulled = false` on skinned meshes.
- **Shadow passes:** avoid casting shadows from helper meshes.
- **Phones:** keep textures at 512–1024 px and decode at boot. Standard materials without an environment
  map look dark, so tune the lights or use a simpler lit material.
