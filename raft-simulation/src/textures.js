import * as THREE from 'three';

// Every texture in the game is painted here at startup, pixel by pixel, from
// seeded noise. Nothing is loaded from disk.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tileable value noise on a px-by-py lattice; inputs are lattice units.
function lattice(r, px, py) {
  const g = new Float32Array(px * py);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
    const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = g[y0 * px + x0], b = g[y0 * px + x1], c = g[y1 * px + x0], d = g[y1 * px + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// Tileable fBm over u,v in [0,1).
function fbm(seed, px, py, octaves = 4) {
  const r = rng(seed);
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push({ n: lattice(r, px << o, py << o), s: 1 << o, a: 0.5 ** o });
  const norm = layers.reduce((s, l) => s + l.a, 0);
  return (u, v) => {
    let s = 0;
    for (const l of layers) s += l.n(u * px * l.s, v * py * l.s) * l.a;
    return s / norm;
  };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const all = [];
function canvasTex(w, h, paint, { srgb = true, repeat = true, flipY = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  paint(img.data, w, h);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.flipY = flipY;
  all.push(t);
  return t;
}

function put(d, i, r, g, b, a = 255) {
  d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
}

// ---------- wood ----------

const PLANK_TONES = [
  [[150, 112, 76], [104, 74, 48]],
  [[140, 108, 78], [92, 68, 46]],
  [[162, 128, 92], [112, 84, 56]],
  [[128, 104, 82], [88, 70, 54]],   // sun-bleached grey
];

// Returns { map, bump } for one weathered plank: grain along u, two nails at each end.
export function plankTexture(variant) {
  const W = 512, H = 96;
  const seed = 101 + variant * 17;
  const warp = fbm(seed, 3, 2, 3);
  const grainN = fbm(seed + 1, 2, 40, 3);
  const bleach = fbm(seed + 2, 4, 2, 4);
  const [light, dark] = PLANK_TONES[variant % PLANK_TONES.length];
  const r = rng(seed + 3);
  const knots = [];
  const nk = 1 + Math.floor(r() * 2);
  for (let k = 0; k < nk; k++) knots.push({ x: 0.15 + r() * 0.7, y: 0.25 + r() * 0.5, s: 0.012 + r() * 0.02 });
  const nails = [];
  for (const nx of [0.035, 0.965]) for (const ny of [0.3, 0.7]) nails.push({ x: nx + (r() - 0.5) * 0.01, y: ny + (r() - 0.5) * 0.06 });
  const heights = new Float32Array(W * H);

  const map = canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W, v = y / H;
        let gy = v + (warp(u, v) - 0.5) * 0.35;
        let knotDark = 0;
        for (const k of knots) {
          const dx = (u - k.x) * 4.5, dy = v - k.y;
          const dd = Math.sqrt(dx * dx + dy * dy);
          gy += Math.exp(-dd / (k.s * 3)) * 0.06 * Math.sign(dy || 1);
          knotDark = Math.max(knotDark, smooth(k.s * 1.2, k.s * 0.4, dd));
        }
        const ring = 0.5 + 0.5 * Math.sin(gy * Math.PI * 22 + grainN(u, gy) * 6);
        const lines = Math.pow(ring, 3);
        const fine = grainN(u * 3 % 1, gy) * 0.5;
        let t = clamp01(lines * 0.55 + fine * 0.6 + knotDark * 0.9);
        // ends and edges weather darker, the middle bleaches
        const edge = Math.max(smooth(0.1, 0, v), smooth(0.9, 1, v), smooth(0.03, 0, u) * 1.2, smooth(0.97, 1, u) * 1.2);
        const bl = smooth(0.45, 0.75, bleach(u, v)) * 0.35;
        let cr = mix(light[0], dark[0], t), cg = mix(light[1], dark[1], t), cb = mix(light[2], dark[2], t);
        cr = mix(cr, 170, bl); cg = mix(cg, 160, bl); cb = mix(cb, 145, bl);
        const e = 1 - edge * 0.35;
        cr *= e; cg *= e; cb *= e;
        let h = 0.6 - lines * 0.35 - knotDark * 0.3 - edge * 0.2;
        // nail heads with a rust streak
        for (const n of nails) {
          const dx = (u - n.x) * (W / H), dy = v - n.y;
          const dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < 0.05) {
            const rim = smooth(0.05, 0.035, dd);
            cr = mix(cr, 70, rim); cg = mix(cg, 66, rim); cb = mix(cb, 62, rim);
            if (dd < 0.03) { cr = 96 - dd * 900; cg = 92 - dd * 900; cb = 88 - dd * 900; }
            h = 0.9;
          }
          const streak = Math.max(0, 1 - Math.abs(dx) / 0.03) * smooth(0.3, 0.05, Math.abs(dy - 0.12)) * 0.25;
          cr = mix(cr, 120, streak); cg = mix(cg, 70, streak); cb = mix(cb, 40, streak);
        }
        heights[y * W + x] = h;
        put(d, (y * W + x) * 4, cr, cg, cb);
      }
    }
  });
  const bump = canvasTex(W, H, (d) => {
    for (let i = 0; i < W * H; i++) {
      const g = heights[i] * 255;
      put(d, i * 4, g, g, g);
    }
  }, { srgb: false });
  return { map, bump };
}

export function barkTexture() {
  const W = 256, H = 256;
  const ridges = fbm(41, 24, 3, 3);
  const patches = fbm(42, 4, 4, 4);
  const heights = new Float32Array(W * H);
  const map = canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const rr = ridges(u, v);
      const ridge = 1 - Math.abs(rr * 2 - 1);
      const moss = smooth(0.55, 0.75, patches(u, v));
      let cr = mix(60, 112, ridge), cg = mix(44, 86, ridge), cb = mix(30, 60, ridge);
      cr = mix(cr, 70, moss * 0.6); cg = mix(cg, 86, moss * 0.6); cb = mix(cb, 46, moss * 0.6);
      heights[y * W + x] = ridge;
      put(d, (y * W + x) * 4, cr, cg, cb);
    }
  });
  const bump = canvasTex(W, H, (d) => {
    for (let i = 0; i < W * H; i++) { const g = heights[i] * 255; put(d, i * 4, g, g, g); }
  }, { srgb: false });
  return { map, bump };
}

// Twisted hemp: diagonal strands that tile along a rope's length.
export function ropeTexture() {
  const W = 64, H = 64;
  const n = fbm(55, 8, 8, 2);
  return canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const s = ((u * 3 + v * 3) % 1 + 1) % 1;
      const strand = Math.sin(s * Math.PI);
      const k = 0.55 + strand * 0.45 + (n(u, v) - 0.5) * 0.3;
      put(d, (y * W + x) * 4, 205 * k, 176 * k, 120 * k);
    }
  });
}

// Plain-weave canvas, near white so a material colour can dye it.
export function clothTexture() {
  const W = 128, H = 128;
  const n = fbm(61, 8, 8, 3);
  return canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const wx = Math.sin(u * Math.PI * 64), wy = Math.sin(v * Math.PI * 64);
      const over = (Math.floor(u * 32) + Math.floor(v * 32)) % 2 ? wx : wy;
      const k = 0.82 + over * 0.08 + (n(u, v) - 0.5) * 0.22;
      put(d, (y * W + x) * 4, 255 * k, 250 * k, 238 * k);
    }
  });
}

export function coconutTexture() {
  const W = 128, H = 128;
  const fibres = fbm(71, 3, 30, 3);
  return canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const f = fibres(u, v);
      const k = 0.6 + f * 0.6;
      put(d, (y * W + x) * 4, 112 * k, 76 * k, 46 * k);
    }
  });
}

// Wooden barrel staves running along v.
export function barrelTexture() {
  const W = 256, H = 128;
  const grain = fbm(81, 40, 2, 3);
  return canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const stave = (u * 14) % 1;
      const gap = smooth(0.0, 0.06, stave) * smooth(1.0, 0.94, stave);
      const tone = 0.75 + 0.25 * Math.sin(Math.floor(u * 14) * 12.9898);
      const g = grain(u, v);
      const k = (0.55 + g * 0.45) * tone * (0.45 + gap * 0.55);
      put(d, (y * W + x) * 4, 150 * k, 98 * k, 58 * k);
    }
  });
}

// Shark skin laid out on the body's lathe UVs: u around the body (0.5 = top
// of the back); painted with the snout in the first row.
export function sharkTexture(back, belly) {
  const W = 256, H = 512;
  // Paint in sRGB bytes straight from the hex values (the texture is sRGB).
  const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  const B = rgb(back);
  const L = rgb(belly);
  const mottle = fbm(91, 6, 12, 4);
  const line = fbm(92, 2, 10, 3);
  return canvasTex(W, H, (d) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const up = -Math.cos(u * Math.PI * 2); // 1 on the back, -1 on the belly
      const boundary = -0.15 + (line(u, v) - 0.5) * 0.5;
      const t = smooth(boundary - 0.12, boundary + 0.12, up);
      const m = 0.88 + (mottle(u, v) - 0.5) * 0.25 * t;
      let r = mix(L[0], B[0] * m, t), g = mix(L[1], B[1] * m, t), b = mix(L[2], B[2] * m, t);
      // darker snout tip and tail stock
      const shade = 1 - smooth(0.08, 0.0, v) * 0.25 - smooth(0.8, 1, v) * 0.15;
      r *= shade; g *= shade; b *= shade;
      // five gill slits on each flank, just behind the eye
      const flank = Math.abs(Math.sin(u * Math.PI * 2));
      if (v > 0.2 && v < 0.29 && flank > 0.75 && up > -0.55 && up < 0.45) {
        const slit = (v - 0.2) / 0.018;
        const f = slit - Math.floor(slit);
        const k = smooth(0.32, 0.5, f) * smooth(0.68, 0.5, f);
        r = mix(r, r * 0.45, k); g = mix(g, g * 0.45, k); b = mix(b, b * 0.5, k);
      }
      put(d, (y * W + x) * 4, r, g, b);
    }
  }, { repeat: false }); // painted snout-first; flipY puts the snout at v = 1
}

// Soft round sprite for spray, foam and blood clouds.
export function softDotTexture() {
  return canvasTex(64, 64, (d, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5) / w * 2 - 1, dy = (y + 0.5) / h * 2 - 1;
      const a = clamp01(1 - Math.sqrt(dx * dx + dy * dy));
      put(d, (y * w + x) * 4, 255, 255, 255, a * a * (3 - 2 * a) * 255);
    }
  }, { srgb: false, repeat: false });
}

// Water detail normals (RGB) plus a foam-breakup noise (A), tileable.
export function waterDetailTexture() {
  const N = 256;
  const h1 = fbm(201, 8, 8, 4);
  const h2 = fbm(202, 16, 16, 3);
  const foam = fbm(203, 6, 6, 5);
  const hs = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    hs[y * N + x] = h1(u, v) * 0.7 + h2(u, v) * 0.3;
  }
  const data = new Uint8Array(N * N * 4);
  const s = 6;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const xl = (x + N - 1) % N, xr = (x + 1) % N, yd = (y + N - 1) % N, yu = (y + 1) % N;
    const dx = (hs[y * N + xr] - hs[y * N + xl]) * s;
    const dy = (hs[yu * N + x] - hs[yd * N + x]) * s;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * N + x) * 4;
    data[i] = (-dx / l * 0.5 + 0.5) * 255;
    data[i + 1] = (-dy / l * 0.5 + 0.5) * 255;
    data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    data[i + 3] = foam(x / N, y / N) * 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  all.push(t);
  return t;
}

export function setAnisotropy(n) {
  for (const t of all) {
    t.anisotropy = n;
    t.needsUpdate = true;
  }
}
