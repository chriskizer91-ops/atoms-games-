# Builds the painting brief for the refitted castaways: the pictures to attach, the prompts, one self-contained page and a zip.
#
#   python3 tools/skin_brief.py <dir of blank.js output> <moon-faire>/game <dir of game screenshots> [out dir]
#
# Reads src/people/refit/outfits.json (who wears what, in which colours), the guides and colour keys that
# src/people/port/blank.js drew, and Moon Faire's finished sheets and faces for the same two people (the style to match).
# Writes art/castaway-refit/: pack/ (every picture, prompts.md), Castaway-Refit-Pack.zip and castaway-refit.html.
import base64, html, io, json, os, sys, zipfile
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); RAFT = os.path.join(HERE, '..')
BLANK, MF, SHOTS = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = sys.argv[4] if len(sys.argv) > 4 else os.path.join(RAFT, 'art', 'castaway-refit')
PACK = os.path.join(OUT, 'pack'); os.makedirs(PACK, exist_ok=True)
for old in os.listdir(PACK): os.remove(os.path.join(PACK, old))
D = json.load(open(os.path.join(RAFT, 'src', 'people', 'refit', 'outfits.json')))
SKINS = os.path.join(MF, 'people', 'skins')
OLD = {'castaway-man': ('farmhand', 'A'), 'castaway-woman': ('lampseller', 'B')}
TONE = {'castaway-man-A': ('#d99789', 'fair, sun-pinked'), 'castaway-man-B': ('#c68a68', 'tanned golden brown'), 'castaway-woman-A': ('#78412d', 'deep warm brown'), 'castaway-woman-B': ('#693624', 'deep brown, darker from the sun')}

def font(size):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def pair(front, back):
    im = Image.new('RGB', (1536, 1024)); im.paste(Image.open(front).convert('RGB'), (0, 0)); im.paste(Image.open(back).convert('RGB'), (768, 0)); return im

def clean_sheet(model, letter):
    # Moon Faire keeps each finished sheet with the figure's edge colours smeared out over the background (so the model
    # never picks up grey at an edge). As a style reference it wants its plain grey background back: cut the figure out
    # with the old guide's outline, laid where the fit says the painting sits.
    sheet = Image.open(os.path.join(SKINS, model, letter + '-body.webp')).convert('RGB')
    guide = Image.open(os.path.join(SKINS, model, 'guide.png')).convert('RGB')
    fit = json.load(open(os.path.join(SKINS, model, letter + '.json')))['fit']
    out = Image.new('RGB', sheet.size, '#6e6e6e'); hw, h = sheet.width // 2, sheet.height
    for k, x0 in (('front', 0), ('back', hw)):
        g = guide.crop((x0 * guide.width // sheet.width, 0, (x0 + hw) * guide.width // sheet.width, guide.height)).resize((hw, h))
        m = ImageChops.difference(g, Image.new('RGB', g.size, '#6e6e6e')).convert('L').point(lambda v: 255 if v > 3 else 0)
        sx, sy, ox, oy = fit[k]
        m = m.transform((hw, h), Image.AFFINE, (1 / sx, 0, -ox * hw / sx, 0, 1 / sy, h - h / sy + oy * h / sy), Image.BILINEAR)
        m = m.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MinFilter(11)).filter(ImageFilter.GaussianBlur(1.2))   # close small holes, keep a thin margin
        out.paste(sheet.crop((x0, 0, x0 + hw, h)), (x0, 0), m)
    return out

files = {}   # name in the pack -> path
def keep(name, im, **kw):
    p = os.path.join(PACK, name); im.save(p, **kw); files[name] = p; return name

# ---- pictures ----
for P in D['people']:
    pid = P['id']
    keep(pid + '-guide.png', pair(os.path.join(BLANK, pid + '-front.png'), os.path.join(BLANK, pid + '-back.png')))
    for o in P['outfits']:
        keep(o['code'] + '-colours.png', pair(os.path.join(BLANK, o['code'] + '-key-front.png'), os.path.join(BLANK, o['code'] + '-key-back.png')))
    m, letter = OLD[pid]
    keep(P['style'], clean_sheet(m, letter), quality=92)
    keep(P['face'], Image.open(os.path.join(SKINS, m, letter + '-face.webp')).convert('RGB'), quality=92)
    looks = [Image.open(os.path.join(BLANK, '%s-look-%d.jpg' % (pid, i))) for i in (0, 1, 3, 4)]
    sheet = Image.new('RGB', (sum(l.width for l in looks) // 2, looks[0].height // 2))
    x = 0
    for l in looks: l = l.resize((l.width // 2, l.height // 2), Image.LANCZOS); sheet.paste(l, (x, 0)); x += l.width
    P['looks'] = sheet

# the game's colour card: twenty swatches with their names and numbers
card = Image.new('RGB', (1500, 900), '#20262b'); dr = ImageDraw.Draw(card); f1, f2 = font(26), font(22)
dr.text((40, 26), 'RAFT SIMULATION: COLOUR CARD', font=font(34), fill='#f1e8d4')
for i, (name, hx) in enumerate(D['palette']):
    cx, cy = 40 + (i % 5) * 288, 100 + (i // 5) * 196
    dr.rounded_rectangle([cx, cy, cx + 262, cy + 120], 10, fill=hx)
    dr.text((cx, cy + 128), name, font=f1, fill='#f1e8d4'); dr.text((cx, cy + 158), hx, font=f2, fill='#b6ae9c')
keep('palette.png', card)

def shot(name):
    im = Image.open(os.path.join(SHOTS, name)).convert('RGB'); return im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
WORLD = [(shot('e1-sunset-rays.png'), 'Sunset under sail'), (shot('m6-island.png'), 'An island, midday')]

# ---- prompts ----
BODY = '''Attach four pictures, in this order:
1. {guide}
2. {key}
3. {style}
4. palette.png

Paint over picture 1 and give me one finished picture, 1536 x 1024 pixels (landscape, 3 wide by 2 tall).

Picture 1 is a grey guide of one person shown twice: from the front on the left half, from behind on the right half, standing with the arms a little out from the sides. It is a costume sheet for a 3D game character: the finished painting is wrapped back onto the 3D model by position, so every shape must stay exactly where it is.

Picture 2 is the same guide with every part filled in the base colour it should end up. Use it to see which grey shape is which part and what colour it is. Do not copy its flat look: paint real, worn cloth, leather, rope and skin over it.

Picture 3 is a finished sheet of this same person in the clothes they wore before. Match its hand-painted style, its level of detail, its flat even light and its plain grey background. Take the style from it, not the clothes.

Picture 4 is the game's colour card. Where I give no colour, choose from it, so the character belongs in the game's world: a small raft on a warm, bright tropical sea.

WHO: {who}

THE SHAPES IN THE GUIDE (keep every one, add none): {shapes}.

WHAT TO PAINT, part by part:
{paint}

WEAR AND WEATHER, over everything: sun-fading on the upper surfaces (hat top, shoulders, the fronts of the thighs), white wavy salt lines where sea water has dried, darker damp at the lowest hems, frayed raw edges, visible weave, stitching, darns and patches. Clean enough to read, never filthy. Every detail at least as wide as a finger so it still shows when the picture is small.

RULES
- Keep both figures exactly where they are and exactly the size they are in picture 1. Trace the guide's outlines: the same hat or headscarf, hair, sleeves, hands, belt, clothes, legs and feet, and the same gaps between the arms and the body. Do not move, resize, crop, turn or re-pose the figures.
- Add nothing outside the grey shapes: nothing held in the hands, nothing hanging, blowing or sticking out past the outline. No new hat brims, capes, bags or weapons.
- The two figures are the same person in the same clothes. Every colour, pattern, patch and stain on the front carries round to the back in the matching place. The right figure is seen from behind: the back of the head, no face. Remember that the person's left is on the right of the front view and on the left of the back view.
- Light both figures flat and evenly from straight ahead, like a costume sheet. No cast shadows, no ground, no glow, no rim light, no dark side, no highlights from a lamp or the sun. The game adds its own light. Fading and stains are part of the cloth; shadows are not.
- Skin: {tone} ({tonehex}) on the forearms, hands and neck.
- Paint the face on the left figure simply. A separate close-up replaces it.
- Fill the whole background with one flat mid-grey, the same as picture 1. No text, no labels, no numbers, no border, no colour swatches.

Save the result as {code}-body.png'''

FACE = '''Attach one picture: {face}

Repaint the face in this picture as the same person, later. It is a face painting that gets wrapped onto a 3D head, so its layout must not change. Give me one finished picture, 1024 x 1024 pixels (square).

WHO: {who}

WHAT CHANGES: {change}

RULES
- Keep the picture square. Keep the eyes, brows, nose, mouth and chin exactly where they are and the same size. Front view, looking straight ahead, mouth closed. It must still be recognisably the same person.
- Keep the plain surround: only the face in the middle, fading softly into one flat skin colour all round, in the skin colour {tonehex}. No hair, no ears, no neck, no hat, no background.
- Paint it in the same hand-painted style as the picture, with soft brushwork.
- Flat even light from straight ahead: no shadow down one side, no highlights from a lamp or the sun.
- No text, no border.

Save the result as {code}-face.png'''
FACE_CHANGE = {
    'castaway-man-B': 'Skin tanned to golden brown (#c68a68), the freckles darker and joined into patches across the nose and cheeks, the nose and cheekbones a little sun-reddened and peeling, lips dry and paler, brows bleached lighter than the skin, the first fine squint lines at the outer corners of the eyes. Leaner in the cheeks. The same calm good humour.',
    'castaway-woman-B': 'Skin a shade darker and warmer from the sun (#693624), deeper squint lines at the outer corners of the eyes, the two creases beside the mouth firmer, lips dry, a faint paler band across the forehead where the headscarf sits, a scatter of small dark sun spots on the cheekbones. The same steady, unhurried look.',
}
EXTRAS = [
    ('sail.png', 'The raft\'s sail', 'The sail is in view most of the time once you have built one. It is a plain colour with one blue square now.',
     '''Make one picture, 1024 x 1536 pixels (portrait, 2 wide by 3 tall), with no attachments needed (attach palette.png if you like, for the colours).

A painted texture of patched sailcloth, seen perfectly flat and straight on, filling the whole picture from edge to edge with no border, no background and no edges of the cloth showing. It will be wrapped onto a sail in a 3D game.

The cloth: heavy cream canvas (#d6ccb4) made of four tall panels sewn side by side with double rows of dark stitches running top to bottom, a visible coarse weave, sun-bleached paler toward the top, greyer and salt-stained toward the bottom with wavy white tide-lines. Three patches, all inside the middle two-thirds of the width: one big square of blue sailcloth (#3f74a8) above the middle, one smaller patch of yellow plastic sheet (#e7b93c) lower left, one of faded red cotton (#b5523a) lower right, each sewn on with big uneven stitches. Two short neat darns. A row of three reef points (short ties of hemp cord) across the middle.

Hand-painted, soft brushwork, rich but slightly muted colours. Flat even light from straight ahead: no folds, no billow, no shadows, no highlights. No text.

Save the result as sail.png'''),
    ('chart.png', 'The chart\'s paper', 'The map (M) is drawn on a flat tan rectangle now. Real paper under it would lift the whole screen.',
     '''Make one picture, 1536 x 1024 pixels (landscape, 3 wide by 2 tall). No attachments needed.

A blank sheet of old sea-chart paper seen perfectly flat and straight on, filling the whole picture from edge to edge with no border, no table and no background behind it. It is the paper a game draws its map on, so it must be blank: no coastlines, no compass rose, no writing, no grid, no pins.

Warm parchment (#e9dcb8), a little darker and browner toward the four edges and corners, with two soft fold lines crossing in the middle (one top to bottom, one side to side), faint water rings and tide-stains in pale grey-brown, a few small foxing spots, the fibres of the paper just visible. Even and quiet in the middle so that dark ink drawn over it later stays easy to read.

Hand-painted, soft brushwork. Flat even light from straight ahead, no shadows, no curl, no highlights. No text.

Save the result as chart.png'''),
    ('note.png', 'The paper of a message in a bottle', 'The eight notes you find in bottles are shown on a plain panel now.',
     '''Make one picture, 1024 x 1536 pixels (portrait, 2 wide by 3 tall). No attachments needed.

A blank page torn from a ship's logbook, seen perfectly flat and straight on, filling the whole picture from edge to edge with no border, no table and no background behind it. A game writes a letter over it, so it must be blank: no writing, no drawing, no stamp.

Cream paper (#efe6cc) with faint pale-blue ruled lines a finger apart running across it and one faint red margin line down the left, the lines washed out and broken where sea water has got at them. Water damage: the lower third rippled-looking and stained in soft brown tide-rings, the edges darker, one corner browned. Three crease lines where it was rolled to fit a bottle neck. Quiet enough in the middle that dark handwriting over it stays easy to read.

Hand-painted, soft brushwork. Flat even light from straight ahead, no shadows, no curl, no highlights. No text.

Save the result as note.png'''),
    ('flag.png', 'A flag for the masthead', 'There is no flag yet. With this I would add a pennant at the top of the mast that streams with the wind. The design is yours: change the emblem to anything you like.',
     '''Make one picture, 1536 x 1024 pixels (landscape, 3 wide by 2 tall). Attach palette.png for the colours if you like.

The design of a hand-sewn flag, seen perfectly flat and straight on, filling the whole picture from edge to edge with no border, no pole, no background and no edges of the cloth showing. It will be wrapped onto a flag in a 3D game.

The flag: a field of deep sea blue (#0c5273) sailcloth. In the middle, cut from cream canvas (#d6ccb4) and sewn on with big visible stitches, a simple bold emblem: a raft of five logs seen from the side under a single square sail, with a round sun of yellow plastic (#e7b93c) behind the sail. Along the bottom, a wavy strip of turquoise cloth (#178f8a) for the sea. Bold shapes that still read when the flag is tiny. The cloth is patched in one corner with faded red (#b5523a), sun-bleached along the top edge, with a visible weave.

Hand-painted, soft brushwork, rich but slightly muted colours. Flat even light from straight ahead: no folds, no ripple, no shadows. No text, no letters.

Save the result as flag.png'''),
]

cards = []   # (section, title, note, attach [names], prompt, save)
md = ['# Raft Simulation: castaway refit, painting prompts\n\n', 'Each prompt lists the pictures to attach (they are in this folder) and the name to save the result under.\n']
for P in D['people']:
    md.append('\n## %s (was %s)\n' % (P['label'], P['was']))
    for o in P['outfits']:
        tonehex, tone = TONE[o['code']]
        prompt = BODY.format(guide=P['id'] + '-guide.png', key=o['code'] + '-colours.png', style=P['style'], who=o['who'], shapes=P['shapes'], paint='\n'.join('- ' + p for p in o['paint']), tone=tone, tonehex=tonehex, code=o['code'])
        o['prompt'] = prompt; o['attach'] = [P['id'] + '-guide.png', o['code'] + '-colours.png', P['style'], 'palette.png']
        md.append('\n### %s: %s\n\nAttach: %s\n\n```\n%s\n```\n' % (o['code'], o['name'], ', '.join(o['attach']), prompt))
        if o['code'] in FACE_CHANGE:
            o['face_prompt'] = FACE.format(face=P['face'], who=o['who'], change=FACE_CHANGE[o['code']], tonehex=tonehex, code=o['code'])
            md.append('\n### %s: the face that goes with it\n\nAttach: %s\n\n```\n%s\n```\n' % (o['code'], P['face'], o['face_prompt']))
md.append('\n## Extras (optional)\n')
for name, title, why, prompt in EXTRAS: md.append('\n### %s (%s)\n\n%s\n\n```\n%s\n```\n' % (title, name, why, prompt))
open(os.path.join(PACK, 'prompts.md'), 'w', encoding='utf-8').write(''.join(md))

z = zipfile.ZipFile(os.path.join(OUT, 'Castaway-Refit-Pack.zip'), 'w', zipfile.ZIP_DEFLATED)
for n in sorted(os.listdir(PACK)): z.write(os.path.join(PACK, n), n)
z.close()

# ---- the page ----
E = html.escape
def uri(path):
    ext = os.path.splitext(path)[1].lower(); mime = 'image/png' if ext == '.png' else 'image/jpeg'
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())
def jpg(im, w, q=84):
    im = im.convert('RGB'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
def thumb(name, n):
    return '<a class="att" data-file="%s" download="%s"><img alt="%s" data-file="%s"><span><b>%d</b> %s</span></a>' % (name, name, E(name), name, n, E(name))
uid = [0]
def prompt_block(label, save, attach, text):
    uid[0] += 1; i = uid[0]
    atts = ''.join(thumb(a, k + 1) for k, a in enumerate(attach))
    return ('<div class="job"><div class="jobhead"><h4>%s</h4><span class="save">save the result as <b>%s</b></span></div>'
            '%s<div class="bar"><label for="p%d">Prompt</label><button type="button" data-copy="p%d">Copy prompt</button></div>'
            '<textarea id="p%d" readonly rows="9">%s</textarea></div>') % (E(label), E(save), ('<p class="hint">Attach these, in this order:</p><div class="atts">%s</div>' % atts) if attach else '', i, i, i, E(text))
rows = []
for P in D['people']:
    rows.append('<section class="who" id="%s"><h2>%s <small>was %s</small></h2>' % (P['id'], E(P['label']), E(P['was'])))
    rows.append('<div class="blank"><figure><img alt="The blank model from four sides" src="%s"><figcaption>The refitted blank model: front, three-quarter, back, walking (colours here are only placeholders).</figcaption></figure>'
                '<figure><img alt="The painting guide" src="%s"><figcaption>The painting guide, <b>%s-guide.png</b>: front on the left, back on the right.</figcaption></figure></div>' % (jpg(P['looks'], 1040), jpg(Image.open(files[P['id'] + '-guide.png']), 900), P['id']))
    for o in P['outfits']:
        rows.append('<article class="outfit"><h3><span class="code">%s</span> %s</h3><p>%s</p>' % (o['code'][-1], E(o['name']), E(o['who'])))
        rows.append('<div class="swatches">%s</div>' % ''.join('<span><i style="background:%s"></i>%s</span>' % (c, E(k)) for k, c in o['colors'].items() if c != 'skin' and k not in ('torso', 'sleeve')))
        rows.append(prompt_block('Body sheet', o['code'] + '-body.png', o['attach'], o['prompt']))
        if 'face_prompt' in o: rows.append(prompt_block('Face (recommended with this outfit: the tan has to match)', o['code'] + '-face.png', [P['face']], o['face_prompt']))
        else: rows.append('<p class="hint">No new face needed: this outfit keeps the face they have now.</p>')
        rows.append('</article>')
    rows.append('</section>')
rows.append('<section class="who" id="extras"><h2>Extras <small>optional</small></h2><p>Four more pictures I can put straight into the game if you make them. None is needed for the outfits.</p>')
for name, title, why, prompt in EXTRAS:
    rows.append('<article class="outfit"><h3>%s</h3><p>%s</p>%s</article>' % (E(title), E(why), prompt_block('Picture', name, ['palette.png'] if 'palette.png' in prompt else [], prompt)))
rows.append('</section>')
world = ''.join('<figure><img alt="%s" src="%s"><figcaption>%s</figcaption></figure>' % (E(c), jpg(im, 900), E(c)) for im, c in WORLD)
pal = ''.join('<span><i style="background:%s"></i>%s<em>%s</em></span>' % (hx, E(n), hx) for n, hx in D['palette'])
want = ''.join('<li><code>%s-body.png</code>%s</li>' % (o['code'], ' and <code>%s-face.png</code>' % o['code'] if 'face_prompt' in o else '') for P in D['people'] for o in P['outfits'])
page = open(os.path.join(HERE, 'skin_brief.tpl.html'), encoding='utf-8').read()
page = page.replace('/*FILES*/', json.dumps({n: uri(p) for n, p in files.items()})).replace('/*WORLD*/', world).replace('/*PALETTE*/', pal).replace('/*PALCARD*/', thumb('palette.png', 4)).replace('/*ROWS*/', '\n'.join(rows)).replace('/*WANT*/', want)
open(os.path.join(OUT, 'castaway-refit.html'), 'w', encoding='utf-8').write(page)
print('pictures', len(files), 'page', len(page) // 1024, 'KB', 'zip', os.path.getsize(os.path.join(OUT, 'Castaway-Refit-Pack.zip')) // 1024, 'KB')
