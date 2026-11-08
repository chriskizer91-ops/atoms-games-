"""Build the round-2 picture request: one self-contained HTML file with prompts and reference sprites."""
import base64
import html
import sys

REF = sys.argv[1]
OUT = sys.argv[2]

LOOK = ("THE LOOK (the same for every creature in this game): a friendly creature-collecting game. Chunky, rounded, "
        "cute-but-mighty proportions, big warm expressive eyes and simple shapes that read clearly. Stylised hand-painted "
        "surfaces with clear blocks of colour and gentle texture, not photoreal. Colours true to the original sprite. No black "
        "outlines around the creature or any of its parts. Soft, even, shadowless studio light with only small highlights. "
        "Glowing parts glow, with no halo onto the background. Plain flat light-grey background, exactly #C8C8CA, with no floor, "
        "shadow, reflection, border or watermark.")

CREATURES = [
    {
        "id": "mossback", "name": "Mossback", "tier": "Starter", "type": "Plant", "no": "4",
        "lore": "A sleepy turtle whose shell grows a little bush, and it is very proud of its single pink flower.",
        "size_line": "0.5 m tall to the top of its bush, 0.8 m long, 0.6 m wide",
        "bar": "a size bar in metres showing it stands 0.5 m tall and is 0.8 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Mossback is a small, sleepy turtle, 0.5 m tall to the top of the bush on its shell, 0.8 m long and 0.6 m wide.
- Head: a round olive-green turtle head with sleepy half-closed brown eyes, a soft beak-like mouth with a content little smile, and small moss patches on its cheeks.
- Shell: a high, rounded brown shell with soft hexagon plates and moss patches. On top grows a little bush of big, chunky green leaves in clumps (each leaf at least 5 cm, no thin twigs). On top of the bush sits one single pink flower with five round petals.
- Legs: four short, stubby olive-green legs with moss patches and three cream toenails each.
- Tail: a short, stubby pointed tail.
- Build: low and round, with the shell about two thirds of its height.""",
        "pose": "Standing on all four legs with clear gaps of background between them, head out and facing straight ahead, eyes sleepy, mouth closed in a little smile. The same pose in every view.",
        "checks": ["One pink flower on top of the bush, in the same place in every view.", "The bush leaves are big chunky clumps, not fine twigs.", "Four legs with clear gaps between them."],
    },
    {
        "id": "embroak", "name": "Embroak", "tier": "Starter", "type": "Fire", "no": "7",
        "lore": "A cheeky fire frog that keeps a tiny ember on the tip of its tongue.",
        "size_line": "0.45 m tall, 0.55 m long, 0.45 m wide",
        "bar": "a size bar in metres showing it stands 0.45 m tall and is 0.55 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Embroak is a small, cheeky fire frog, 0.45 m tall, 0.55 m long and 0.45 m wide.
- Head: a wide frog head with big round amber eyes sitting high on top, a wide grinning mouth, open just enough to stick out a short, thick pink tongue (at least 5 cm wide). A small glowing ember sits on the tip of the tongue: a solid round glowing orange-yellow bead, with no loose flames or sparks.
- Body: bright orange-red skin with a pale yellow belly and throat, and flame-shaped yellow-orange markings on its back, sides and legs.
- Legs: front legs straight and slightly apart, holding it up; big rear legs folded beside the body in a frog's sitting pose. Wide webbed feet with round toe pads.
- Build: plump and round, the head about half its height.""",
        "pose": "Sitting like a frog, facing straight ahead: front legs straight, back legs folded at its sides, clear gaps of background between the front legs. Tongue out with the ember bead on its tip. The same pose in every view.",
        "checks": ["The tongue is short and thick, with a solid glowing bead, no loose flames.", "The flame markings are in the same places in every view.", "The eyes sit high on top of the head in every view."],
    },
    {
        "id": "clovermouse", "name": "Clovermouse", "tier": "Meadow Path", "type": "Normal", "no": "10",
        "lore": "It wears a four-leaf clover like a hat and is said to bring good luck to anyone who sees it first.",
        "size_line": "0.45 m tall to the top of its clover, 0.3 m wide",
        "bar": "a size bar in metres showing it stands 0.45 m tall",
        "canvas": "Square, 1024 x 1024", "top_canvas": "Square, 1024 x 1024",
        "creature": """Clovermouse is a small, shy grey mouse, 0.45 m tall to the top of the clover on its head and 0.3 m wide.
- Head: a round head with big round ears (pink inside), big shiny green eyes, rosy cheeks and a small pink nose. No whiskers.
- Hat: a big four-leaf clover worn flat on its head like a hat, with four thick heart-shaped green leaves.
- Body: a soft, round grey body with a cream belly, sitting up on its hind legs.
- Arms: two short arms with tiny pink paws held together in front of its chest.
- Feet: two big pink hind feet on the ground, a little apart.
- Tail: a thick pink tail (at least 5 cm thick), curving up behind it in one smooth S-curve, straight behind (not off to one side).
- Build: chubby and round, the head about 40% of its height.""",
        "pose": "Sitting up on its hind legs facing straight ahead, paws held together at its chest, feet a little apart with a clear gap between them, tail curving up straight behind. The same pose in every view.",
        "checks": ["The tail is thick and curves up straight behind, an upright line from the back.", "No whiskers.", "The clover hat has four leaves in every view."],
    },
    {
        "id": "puffmunk", "name": "Puffmunk", "tier": "Meadow Path", "type": "Normal", "no": "70",
        "lore": "A chipmunk that stuffs its cheeks so full of berries it can barely see over them.",
        "size_line": "0.45 m tall, 0.4 m wide (cheeks), 0.5 m long (with its tail)",
        "bar": "a size bar in metres showing it stands 0.45 m tall",
        "canvas": "Square, 1024 x 1024", "top_canvas": "Square, 1024 x 1024",
        "creature": """Puffmunk is a chubby, happy chipmunk, 0.45 m tall, 0.4 m wide across its stuffed cheeks and 0.5 m long including its tail.
- Head: a round head with enormous round cheeks stuffed full of berries (cream-coloured, puffing out on both sides), happy squeezed-shut eyes, small pointed ears and a little pink nose.
- Body: a round orange-brown body with a cream belly, and dark-brown and cream stripes down its back.
- Arms: two short arms holding one big round red berry in front of its mouth with both paws.
- Feet: two hind feet on the ground, a little apart.
- Tail: a big bushy striped tail (orange-brown with a dark stripe), curving up behind it, straight behind (not off to one side), drawn as one chunky solid shape.
- Build: very round, sitting up on its hind legs.""",
        "pose": "Sitting up on its hind legs facing straight ahead, holding the berry at its mouth with both paws, feet a little apart with a clear gap between them, tail curving up straight behind. The same pose in every view.",
        "checks": ["The cheeks bulge equally on both sides in the front view.", "The berry is held at its mouth in every view.", "The tail is one chunky solid shape, straight behind."],
    },
    {
        "id": "fleecling", "name": "Fleecling", "tier": "Meadow Path", "type": "Normal", "no": "72",
        "lore": "A lamb whose wool is a real little cloud. On hot days it rains a few drops on itself to cool off.",
        "size_line": "0.6 m tall, 0.75 m long, 0.5 m wide",
        "bar": "a size bar in metres showing it stands 0.6 m tall and is 0.75 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Fleecling is a small, sweet lamb, 0.6 m tall, 0.75 m long and 0.5 m wide.
- Wool: its whole body is a fluffy white cloud, drawn as big, round, puffy cloud lumps with a soft pale-blue shading underneath (each lump at least 8 cm).
- Head: a dark-brown face with happy closed eyes and a small smile, two floppy brown ears sticking out sideways, and a small cloud-puff tuft on top of its head.
- Legs: four short dark-brown legs with small hooves, with clear gaps between them.
- Tail: a small round cloud-puff tail.
- Build: a round cloud body on short legs, the head about a third of its height.""",
        "pose": "Standing on all four legs facing straight ahead, with clear gaps of background between the legs, eyes closed in a happy smile. No rain, no drops in the air. The same pose in every view.",
        "checks": ["The cloud lumps are big and round, not fine fluff.", "No rain drops or mist in the air.", "Four legs with clear gaps between them."],
    },
]


def sheet_prompt(c):
    return f"""We're starting a new creature for the same game. Make a character design sheet for an original creature called {c['name']}, for a creature-collecting game. The attached image is the original pixel-art sprite. Keep the same design, colours and personality, but redraw it as clean, high-definition painted concept art, not pixel art.

THE PAGE
Landscape, 1536 x 1024. On the left, a large three-quarter hero view. On the right, small front, side and back views in a row, all the same size and standing on the same ground line, with the side view facing left. Below them, three or four close-ups of its most important details. Next to the small views, {c['bar']}. The name "{c['name'].upper()}" at the top. No other text.

THE CREATURE
{c['creature']}

POSE
{c['pose']}

{LOOK}"""


def front_prompt(c):
    return f"""Now make the HD views of {c['name']} from this sheet, one picture per view. Start with the FRONT view.

Rules for every view:
- True orthographic, like a technical drawing: no perspective and no tilt. For this one, the camera looks dead at its front from mid-height.
- {c['canvas']}. The whole creature in frame with about a 5% margin, centred left to right, nothing cut off. In every view, at the same scale: its lowest point on the same pixel row, and its highest point on the same pixel row.
- Exactly the same creature as the sheet: same shapes, same markings, same colours on the same parts in every view. Its left and right halves mirror each other.
- The same pose in every view, with clear gaps of background between separate parts (legs, arms, wings).
- Nothing hair-thin: every part, spike, feather and tuft at least 5 cm across. Nothing see-through, smoky, blurred or flashing. No sparkles or particles in the air.
- No text.

{LOOK}"""


def side_prompt(c):
    return f"Same again for the SIDE view of {c['name']}: the camera dead at its side, the creature facing LEFT (its nose toward the left edge of the picture). Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def back_prompt(c):
    return f"Same again for the BACK view of {c['name']}: the camera dead behind it, looking at its back and tail. Same scale, same ground line and same top line as the front view, same paint and detail. All the same rules."


def top_prompt(c):
    return f"Same again for the TOP view of {c['name']}: the camera straight down from above, with its head at the TOP of the picture and its tail at the bottom. {c['top_canvas']}, with the whole creature in frame. Same paint and detail. All the same rules."


def img64(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode("ascii")


COMMON_CHECKS = ["The side view faces LEFT.", "The top view is straight down, with the head at the top.",
                 "No face or eyes in the back view.", "No perspective (near parts drawn bigger than far parts).",
                 "No black outlines, floor shadow, smoke or sparkles crept back in.",
                 "Background is plain light grey."]


def block(label, text, pid):
    return f"""<div class="prompt">
  <div class="phead"><span class="plabel">{html.escape(label)}</span><button class="copy" data-target="{pid}" type="button">Copy</button></div>
  <pre id="{pid}">{html.escape(text)}</pre>
</div>"""


sections = []
for c in CREATURES:
    i = c["id"]
    files = "".join(f"<li><code>{i}_{v}.png</code></li>" for v in ["sheet", "front", "side", "back", "top"])
    checks = "".join(f"<li>{html.escape(x)}</li>" for x in c["checks"] + COMMON_CHECKS)
    sections.append(f"""<section class="creature" id="{i}">
  <header class="chead">
    <div>
      <p class="eyebrow">{html.escape(c['tier'])} · No. {c['no']} · {html.escape(c['type'])}</p>
      <h2>{html.escape(c['name'])}</h2>
      <p class="lore">{html.escape(c['lore'])}</p>
      <p class="size">{html.escape(c['size_line'])}</p>
    </div>
    <figure class="ref">
      <img src="{img64(f'{REF}/{i}-sprite-reference.png')}" alt="{html.escape(c['name'])} sprite, enlarged" width="220" height="220">
      <figcaption>Reference sprite. Save it and attach it to prompt 1.</figcaption>
    </figure>
  </header>
  {block('1 · Character sheet (attach the sprite)', sheet_prompt(c), f'{i}-1')}
  {block('2 · HD front view', front_prompt(c), f'{i}-2')}
  {block('3 · HD side view (facing left)', side_prompt(c), f'{i}-3')}
  {block('4 · HD back view', back_prompt(c), f'{i}-4')}
  {block('5 · HD top view', top_prompt(c), f'{i}-5')}
  <div class="two">
    <div><h3>Bring back</h3><ul class="files">{files}</ul></div>
    <div><h3>Re-roll any view that breaks one of these</h3><ul>{checks}</ul></div>
  </div>
</section>""")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chapter 1 Picture Request</title>
<style>
  :root {{
    --bg: #f5f1ea; --card: #fffdf8; --ink: #241a14; --muted: #6d5f55; --line: #e2d8cc; --accent: #c2531c; --code: #f1ebe2;
    --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; --mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  }}
  @media (prefers-color-scheme: dark) {{ :root {{ --bg: #17120f; --card: #211a15; --ink: #f2e9e0; --muted: #b3a294; --line: #3a2e26; --accent: #ff8a3a; --code: #2a211b; color-scheme: dark; }} }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 var(--font); }}
  main {{ max-width: 860px; margin: 0 auto; padding: 24px max(16px, env(safe-area-inset-left)) 64px max(16px, env(safe-area-inset-right)); display: grid; gap: 28px; }}
  h1 {{ margin: 0; font-size: 28px; line-height: 1.15; text-wrap: balance; }}
  h2 {{ margin: 2px 0 6px; font-size: 26px; }}
  h3 {{ margin: 0 0 6px; font-size: 15px; }}
  .intro p, .intro li {{ max-width: 65ch; }}
  .intro ol {{ padding-left: 20px; margin: 8px 0 0; }}
  .eyebrow {{ margin: 0; font: 600 12px/1.3 var(--font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }}
  .lore {{ margin: 0 0 6px; color: var(--muted); max-width: 52ch; }}
  .size {{ margin: 0; font: 13px/1.4 var(--mono); }}
  nav {{ display: flex; gap: 8px; flex-wrap: wrap; }}
  nav a {{ color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; text-decoration: none; font-size: 14px; }}
  .creature {{ background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: grid; gap: 14px; }}
  .chead {{ display: flex; gap: 18px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }}
  .chead > div {{ min-width: 0; flex: 1 1 280px; }}
  .ref {{ margin: 0; flex: 0 0 auto; text-align: center; }}
  .ref img {{ width: 200px; height: 200px; border-radius: 10px; border: 1px solid var(--line); background: #fff; image-rendering: pixelated; max-width: 100%; }}
  .ref figcaption {{ font-size: 12px; color: var(--muted); max-width: 200px; margin-top: 4px; }}
  .prompt {{ border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }}
  .phead {{ display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 10px; background: var(--code); border-bottom: 1px solid var(--line); }}
  .plabel {{ font-weight: 600; font-size: 14px; }}
  .copy {{ font: 600 13px/1 var(--font); color: var(--card); background: var(--accent); border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; }}
  .copy:focus-visible {{ outline: 2px solid var(--ink); outline-offset: 2px; }}
  pre {{ margin: 0; padding: 12px; white-space: pre-wrap; word-wrap: break-word; font: 13px/1.5 var(--mono); max-height: 320px; overflow: auto; }}
  .two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }}
  .two > div {{ min-width: 0; }}
  .two ul {{ margin: 0; padding-left: 18px; font-size: 14px; }}
  code {{ font: 13px var(--mono); }}
  @media (max-width: 620px) {{ .two {{ grid-template-columns: 1fr; }} .ref img {{ width: 150px; height: 150px; }} }}
</style>
</head>
<body>
<main>
  <section class="intro">
    <p class="eyebrow">Creature Catch · paint-and-bake · chapter 1</p>
    <h1>Picture request: Mossback, Embroak, Clovermouse, Puffmunk, Fleecling</h1>
    <p>Five creatures from the first chapter: the other two starters (Drizzlon is done) and the first three creatures on Meadow Path. Each one needs five pictures: a character sheet, then four HD views made from it. The rules are the same as before.</p>
    <ol>
      <li>Use one ChatGPT chat (the Coalossus chat is ideal, so the style matches). Finish one creature before starting the next.</li>
      <li>For each creature: save its reference sprite, attach it to prompt 1, then send prompts 2 to 5 in order.</li>
      <li>Check each view against the list under it and re-roll any view that breaks a rule.</li>
      <li>Bring back all 25 pictures, named as listed (a zip per creature is fine).</li>
    </ol>
    <p><b>About the poses.</b> Clovermouse and Puffmunk sit up on their hind legs, as in their sprites. Mossback, Embroak and Fleecling stand or sit on all fours. Tails curl straight up behind, and thin parts (tongue, tail) are asked for thick, so the method can model them cleanly.</p>
    <nav aria-label="Creatures"><a href="#mossback">Mossback</a><a href="#embroak">Embroak</a><a href="#clovermouse">Clovermouse</a><a href="#puffmunk">Puffmunk</a><a href="#fleecling">Fleecling</a></nav>
  </section>
  {''.join(sections)}
</main>
<script>
document.addEventListener("click", async e => {{
  const b = e.target.closest(".copy"); if (!b) return;
  const pre = document.getElementById(b.dataset.target);
  try {{ await navigator.clipboard.writeText(pre.textContent); b.textContent = "Copied"; }}
  catch {{ const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }}
  setTimeout(() => b.textContent = "Copy", 1600);
}});
</script>
</body>
</html>
"""
open(OUT, "w").write(page)
print(OUT, len(page))
