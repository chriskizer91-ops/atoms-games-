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
        "id": "mushling", "name": "Mushling", "tier": "Simplest", "type": "Shadow", "no": "38",
        "lore": "A mushroom creature that peeks out from under its spotted cap and darts back if you look at it.",
        "size_line": "0.6 m tall with a cap 0.55 m wide",
        "bar": "a size bar in metres showing it stands 0.6 m tall",
        "canvas": "Square, 1024 x 1024", "top_canvas": "Square, 1024 x 1024",
        "creature": """Mushling is a small, shy mushroom creature, 0.6 m tall, with a cap 0.55 m wide.
- Cap: a big domed toadstool cap, glossy bright red with large round cream-white spots, the rim curving down a little all around. It is wider than the body and overhangs it like an umbrella. Under the rim, chunky pale tan gills (drawn as thick ribs, not thin lines).
- Body: a soft, round, cream-coloured body like a short, stubby mushroom stalk, a little wider at the bottom, peeking out from under the cap.
- Face: on the upper body just under the cap rim: two big round dark-brown eyes with white highlights, and rosy pink cheeks.
- Arms: two short, chubby arms, with both little hands raised in front of its mouth, shyly.
- Feet: two small round feet, a little apart, with a clear gap between them.
- Build: very chubby and simple; the cap is about half of its total height.""",
        "pose": "Standing upright facing straight ahead, both hands held up in front of its mouth, feet a little apart with a clear gap of background between them. The same pose in every view.",
        "checks": ["The cap's spots are in the same places in every view.",
                   "The gills under the cap are chunky ribs, not fine lines.",
                   "The hands stay in front of the mouth in every view."],
    },
    {
        "id": "drizzlon", "name": "Drizzlon", "tier": "Middle", "type": "Water", "no": "1",
        "lore": "A baby water dragon that hatches from eggs left in spring rain puddles. The droplet on its tail never dries out.",
        "size_line": "0.75 m tall to its horn tips, 1.0 m long from nose to tail",
        "bar": "a size bar in metres showing it stands 0.75 m tall and is 1.0 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Drizzlon is a small, friendly baby water dragon, 0.75 m tall to the tips of its horns and 1.0 m long from its nose to the end of its tail.
- Head: big and round for a baby, with large round shiny blue eyes, a short rounded snout, small nostrils and a happy open smile with a small pink tongue. Two short pale-blue horns pointing back, and a thick teal fin frill on each side of the head, like ears.
- Body: smooth deep-blue skin and a pale teal belly with soft, wide, segmented plates from the chin to the tail. A row of small rounded teal spines down the back (each at least 5 cm).
- Wings: two small fin-shaped wings with thick, solid teal fin membranes (not see-through), blue edges and blue ribs. They are held out to the left and right, flat, facing forward and a little raised (not folded or swept back), so from the side they look like thin edges.
- Legs: four short, sturdy legs with small white claws.
- Tail: a long tail that curls up behind the body in one flat curve, straight behind it (not off to one side), ending in a solid, glossy blue water droplet (not see-through).
- Build: chubby baby proportions, with the head about a third of its total height.""",
        "pose": "Standing square on all four legs with clear gaps of background between them, head facing straight ahead, mouth open in a smile, wings held out flat to the sides facing forward, tail curled up straight behind. The same pose in every view.",
        "checks": ["The wings are held out flat to the sides in the front view, and look thin in the side and top views (not swept back).",
                   "The tail curls up straight behind it: an upright curl in the side view, a thin upright line in the back view.",
                   "The wing fins and the tail droplet are solid, not see-through.",
                   "Two horns, two fin ears, four legs and the same spines in every view."],
    },
    {
        "id": "lunarion", "name": "Lunarion", "tier": "Hardest", "type": "Lumen · Legendary", "no": "159",
        "lore": "The guardian of the moon: a silver wolf whose wings hold the night sky. Its crest is the light the moon shines with.",
        "size_line": "2.6 m tall to its raised wingtips, 2.6 m long, wings 3.4 m tip to tip",
        "bar": "a size bar in metres showing it is 2.6 m tall to its wingtips and 2.6 m long",
        "canvas": "Landscape, 1536 x 1024", "top_canvas": "Landscape, 1536 x 1024",
        "creature": """Lunarion is the legendary guardian of the moon: a big, noble silver wolf with wings. It is 1.2 m tall at the shoulder, 1.7 m to the top of its head and 2.6 m tall to its raised wingtips. It is 2.6 m long from its nose to the tip of its tail, and its spread wings measure 3.4 m from tip to tip.
- Head: a proud wolf head with pointed upright ears, calm glowing pale-gold eyes, and a glowing golden crescent moon on its forehead (its crest). Silver-white fur.
- Fur: thick silver-white fur drawn as big, chunky, spiky locks (each at least 5 cm wide, no thin strands), fluffier around the neck like a mane, with flowing gold markings like swirls of moonlight on its shoulders, flanks and legs.
- Wings: two large feathered wings rising from the shoulders, raised up and spread wide to the left and right in a V. They are held flat in one plane facing forward, like a banner, so from the side and from above they look like thick edges. The feathers are big and chunky (each at least 8 cm wide). The front of each wing is silver-white at the edges, and its inner part shows a deep navy night sky with small gold stars, as if the wings hold the night. The backs of the wings are silver-white feathers with a few gold stars.
- Legs: four strong legs with big paws and short silver claws.
- Tail: a big fluffy wolf tail, held out straight behind and a little raised, with a gold tip.
- Build: powerful and graceful, majestic but kind.""",
        "pose": "Standing square on all four legs with clear gaps of background between them, head facing straight ahead, mouth closed, wings raised and spread flat to the sides facing forward, tail straight out behind. No sparkles, glowing particles, light rays or mist in the air: the stars and the moon are painted on its body and wings. The same pose in every view.",
        "checks": ["The wings are flat and facing forward: the whole wing shows in the front and back views, and only a thick edge in the side and top views.",
                   "No sparkles, glitter or light rays floating around it.",
                   "The crescent moon is on the forehead, and the gold markings and the stars on the wings are in the same places in every view.",
                   "Fur and feathers are big chunky locks, not fine hair."],
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
    <div><h3>Re-roll a view if</h3><ul>{checks}</ul></div>
  </div>
</section>""")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Round 2 Picture Request</title>
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
    <p class="eyebrow">Creature Catch · paint-and-bake · round 2</p>
    <h1>Picture request: Mushling, Drizzlon, Lunarion</h1>
    <p>Three creatures from simplest to hardest, for the small-model-only test. Each one needs five pictures: a character sheet, then four HD views made from it. The rules are the same as for Coalossus.</p>
    <ol>
      <li>Use one ChatGPT chat (the Coalossus chat is ideal, so the style matches). Finish one creature before starting the next.</li>
      <li>For each creature: save its reference sprite, attach it to prompt 1, then send prompts 2 to 5 in order.</li>
      <li>Check each view against the list under it and re-roll any view that breaks a rule.</li>
      <li>Bring back all 15 pictures, named as listed (a zip is fine).</li>
    </ol>
    <p><b>About the wings and tail.</b> Drizzlon's and Lunarion's wings are asked for flat, held out to the sides and facing forward, like a banner. The front picture then shows the whole wing and the side picture shows a thin edge, which the method turns into a clean, thin wing. Swept-back wings would come out as thick wedges. Drizzlon's tail curls straight up behind it for the same reason.</p>
    <nav aria-label="Creatures"><a href="#mushling">Mushling</a><a href="#drizzlon">Drizzlon</a><a href="#lunarion">Lunarion</a></nav>
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
