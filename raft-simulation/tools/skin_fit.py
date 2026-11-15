# Gets the castaways' painted sheets ready to lay onto their models (after Moon Faire's people/kit/prep_skin.py).
#
#   python3 -I tools/skin_fit.py <folder of paintings> <folder of guides from blank.js> <out folder>
#
# For each <code>-body.png (and <code>-face.png where there is one) it writes:
#   <code>-body.webp  the sheet with the figure's edge colours spread over the grey background, so a point of the model that
#                     falls a little outside the painted figure still gets cloth, not grey; the small painted face is painted out
#   <code>-face.webp  the face at 1024 x 1024
#   <code>.json       how the painted figures sit against the guide (front, back: scale x, scale y, offset x, offset y, in parts
#                     of a half picture), how the face sits, and the skin colour taken from the face picture's surround
import glob, json, os, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage
SRC, GUIDES, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(OUT, exist_ok=True)
def figure_mask(rgb):
    h, w = rgb.shape[:2]; img = cv2.GaussianBlur(rgb, (0, 0), 1.5).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]; u = xx / w; v = yy / h
    edge = (v < 0.02) | (v > 0.975) | (u < 0.07) | (u > 0.93) | ((u > 0.475) & (u < 0.525))
    A = np.stack([np.ones_like(u), u, v, u * u, v * v, u * v], -1); bgm = np.zeros_like(img)
    for c in range(3):
        k, *_ = np.linalg.lstsq(A[edge], img[..., c][edge], rcond=None); bgm[..., c] = A @ k
    d = np.abs(img - bgm).max(2); fig = d > 13
    fig = ndimage.binary_closing(ndimage.binary_opening(fig, iterations=1), iterations=3); lab, n = ndimage.label(fig)
    if n: sizes = ndimage.sum(fig, lab, range(1, n + 1)); fig = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2500])
    return ndimage.binary_fill_holes(fig)
def box(m):
    ys, xs = np.where(m); return xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
def fit(guide_m, paint_m):
    gh, gw = guide_m.shape; ph, pw = paint_m.shape; a = box(guide_m); b = box(paint_m)
    gx0, gx1, gy0, gy1 = a[0] / gw, a[1] / gw, 1 - a[3] / gh, 1 - a[2] / gh; px0, px1, py0, py1 = b[0] / pw, b[1] / pw, 1 - b[3] / ph, 1 - b[2] / ph
    sx, sy = (px1 - px0) / (gx1 - gx0), (py1 - py0) / (gy1 - gy0); return [round(float(v), 5) for v in (sx, sy, px0 - gx0 * sx, py0 - gy0 * sy)]
for f in sorted(glob.glob(os.path.join(SRC, '*-body.png'))):
    code = os.path.basename(f)[:-len('-body.png')]; pid = code[:-2]
    rgb = np.array(Image.open(f).convert('RGB')); h, w = rgb.shape[:2]; m = figure_mask(rgb)
    gm = []
    for side in ('front', 'back'):
        g = np.array(Image.open(os.path.join(GUIDES, '%s-%s.png' % (pid, side))).convert('RGB')).astype(int); gm.append(np.abs(g - 0x6e).sum(2) > 6)
    fits = {'front': fit(gm[0], m[:, :w // 2]), 'back': fit(gm[1], m[:, w // 2:])}
    # how well the painted outline covers the guide's, once fitted (1 = exactly)
    cover = {}
    for k, x0, g in (('front', 0, gm[0]), ('back', w // 2, gm[1])):
        sx, sy, ox, oy = fits[k]; hw = w // 2; gy, gx = np.where(g)
        px = np.clip(((gx + 0.5) / g.shape[1] * sx + ox) * hw, 0, hw - 1).astype(int); py = np.clip((1 - ((1 - (gy + 0.5) / g.shape[0]) * sy + oy)) * h, 0, h - 1).astype(int)
        cover[k] = round(float(m[py, x0 + px].mean()), 3)
    sx, sy, ox, oy = fits['front']; hw = w // 2
    cx, cy = (0.5 * sx + ox) * hw, (1 - ((1.53 + 0.1) / 2.0 * sy + oy)) * h; rx, ry = 0.075 / 1.5 * sx * hw, 0.085 / 2.0 * sy * h
    hole = np.zeros((h, w), np.uint8); cv2.ellipse(hole, (int(round(cx)), int(round(cy))), (int(round(rx)), int(round(ry))), 0, 0, 360, 255, -1)
    rgb = cv2.inpaint(rgb, hole, 7, cv2.INPAINT_TELEA); out = rgb.copy()
    for x0, x1 in ((0, w // 2), (w // 2, w)):
        mm = m[:, x0:x1]; inner = ndimage.binary_erosion(mm, iterations=3); idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
        out[:, x0:x1] = rgb[:, x0:x1][idx[0], idx[1]]
    Image.fromarray(out).save(os.path.join(OUT, code + '-body.webp'), quality=84, method=6)
    info = {'fit': fits, 'cover': cover, 'figure_share': round(float(m.mean()), 4)}
    ff = f.replace('-body.png', '-face.png')
    if os.path.exists(ff):
        face = Image.open(ff).convert('RGB').resize((1024, 1024), Image.LANCZOS); face.save(os.path.join(OUT, code + '-face.webp'), quality=90, method=6)
        fa = np.array(face); edge = np.concatenate([fa[:40].reshape(-1, 3), fa[-40:].reshape(-1, 3), fa[:, :40].reshape(-1, 3), fa[:, -40:].reshape(-1, 3)]); info['skin'] = '#%02x%02x%02x' % tuple(int(v) for v in np.median(edge, 0))
        fit3 = [1, 0, 0]
        try:
            casc = cv2.data.haarcascades + 'haarcascade_eye.xml'
            gray = cv2.cvtColor(fa, cv2.COLOR_RGB2GRAY); eyes = cv2.CascadeClassifier(casc).detectMultiScale(gray, 1.1, 6, minSize=(70, 70), maxSize=(260, 260))
            cs = sorted([(x + w2 / 2, y + h2 / 2) for (x, y, w2, h2) in eyes if 180 < y + h2 / 2 < 460], key=lambda c: c[0])
            L = [c for c in cs if c[0] < 512]; R = [c for c in cs if c[0] >= 512]
            if len(L) == 1 and len(R) == 1 and abs(L[0][1] - R[0][1]) < 30:
                k = 312.0 / (R[0][0] - L[0][0]); mx, my = (L[0][0] + R[0][0]) / 2, (L[0][1] + R[0][1]) / 2
                info['eyes'] = [[round(v) for v in L[0]], [round(v) for v in R[0]]]
                if 0.85 < k < 1.18: fit3 = [round(k, 4), round(-k * (mx - 512), 1), round(309 - 512 - k * (my - 512), 1)]
        except Exception as e: info['eyes_error'] = str(e)
        info['faceFit'] = fit3
    json.dump(info, open(os.path.join(OUT, code + '.json'), 'w'))
    print(code, fits, 'cover', cover, info.get('faceFit'), info.get('skin'), info.get('eyes'))
