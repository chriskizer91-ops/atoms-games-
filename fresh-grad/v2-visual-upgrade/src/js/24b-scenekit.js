/* ============================ scene kit: small painters shared by the animated scenes ============================
   Everything here only draws. Static parts of a scene are painted once into AK.layer caches by the scene itself; these helpers are for the
   moving parts (motes, steam, light shafts, grain) and for the shared finishing pass that gives every scene its cinematic look. */
const SK = {
  lin(c, x0, y0, x1, y1, st) { const g = c.createLinearGradient(x0, y0, x1, y1); for (let i = 0; i < st.length; i++) g.addColorStop(st[i][0], st[i][1]); return g; },
  rad(c, x, y, r0, r1, st) { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (let i = 0; i < st.length; i++) g.addColorStop(st[i][0], st[i][1]); return g; },
  /* dust motes drifting through a box; they twinkle as they cross the light */
  motes(c, t, x0, y0, x1, y1, n, seed, col, amp) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const dx = (hash01(i, seed, 5) > 0.5 ? 1 : -1) * (0.004 + hash01(i, seed, 2) * 0.01);
      const px = x0 + ((hash01(i, seed, 1) + t * dx + 10) % 1) * (x1 - x0), py = y0 + ((hash01(i, seed, 3) + t * (0.005 + hash01(i, seed, 4) * 0.009) + 10) % 1) * (y1 - y0);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + i * 2.7));
      c.fillStyle = AK.rgba(col, (amp || 0.5) * tw * (0.3 + hash01(i, seed, 6) * 0.7));
      c.beginPath(); c.arc(px, py, 0.6 + hash01(i, seed, 7) * 1.5, 0, 7); c.fill();
    }
    c.restore();
  },
  /* three soft curls of steam rising from x,y */
  steam(c, x, y, t, s, col, n) {
    c.save(); c.lineCap = 'round'; c.lineWidth = 2.2 * s;
    for (let i = 0; i < (n || 3); i++) {
      const k = (t * 0.5 + i / (n || 3)) % 1, ox = (i - ((n || 3) - 1) / 2) * 7 * s;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.4; c.strokeStyle = col || '#ffffff';
      c.beginPath(); c.moveTo(x + ox, y - k * 26 * s); c.quadraticCurveTo(x + ox + Math.sin(t * 2 + i * 2) * 6 * s, y - 8 * s - k * 26 * s, x + ox, y - 16 * s - k * 26 * s); c.stroke();
    }
    c.restore();
  },
  /* a light shaft: a trapezoid fading from a bright end to nothing; uses additive blending */
  shaft(c, x0, y0, w0, x1, y1, w1, col, a) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, AK.rgba(col, a)); g.addColorStop(1, AK.rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(x0 - w0 / 2, y0); c.lineTo(x0 + w0 / 2, y0); c.lineTo(x1 + w1 / 2, y1); c.lineTo(x1 - w1 / 2, y1); c.closePath(); c.fill();
    c.restore();
  },
  /* a music note drawn from shapes so it never depends on a font */
  note(c, x, y, s, col, double) {
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.6 * s; c.lineCap = 'round';
    c.beginPath(); c.ellipse(x, y, 4 * s, 3 * s, -0.4, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x + 3.4 * s, y - 1 * s); c.lineTo(x + 3.4 * s, y - 14 * s); if (!double) c.quadraticCurveTo(x + 8 * s, y - 11 * s, x + 7 * s, y - 6 * s); c.stroke();
    if (double) {
      c.beginPath(); c.ellipse(x + 10 * s, y + 2 * s, 4 * s, 3 * s, -0.4, 0, 7); c.fill();
      c.beginPath(); c.moveTo(x + 13.4 * s, y + 1 * s); c.lineTo(x + 13.4 * s, y - 12 * s); c.lineTo(x + 3.4 * s, y - 14 * s); c.stroke();
    }
  },
  /* a heart, for hanging out */
  heart(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y + 4 * s); c.bezierCurveTo(x - 12 * s, y - 4 * s, x - 6 * s, y - 16 * s, x, y - 8 * s); c.bezierCurveTo(x + 6 * s, y - 16 * s, x + 12 * s, y - 4 * s, x, y + 4 * s); c.fill();
  },
  /* soft contact shadow under things */
  shadow(c, x, y, rx, ry, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, 'rgba(6,8,18,' + (a == null ? 0.45 : a) + ')'); g.addColorStop(1, 'rgba(6,8,18,0)');
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, 7); c.fill(); c.restore();
  },
  /* the shared finish for every scene: static vignette and letterbox from a cache, then moving grain and a slow breathing exposure */
  finish(c, w, h, t, o) {
    const dpr = SC.dpr, key = 'fin|' + (o.grade || 'warm');
    const L = AK.layer(key, w, h, dpr, (g, W, H) => {
      const bar = Math.round(H * 0.045);
      const warm = (o.grade || 'warm') === 'warm';
      g.globalCompositeOperation = 'soft-light';
      g.fillStyle = SK.lin(g, 0, 0, W, H, warm ? [[0, 'rgba(255,190,120,.30)'], [0.55, 'rgba(255,255,255,0)'], [1, 'rgba(90,110,200,.28)']] : [[0, 'rgba(120,150,255,.28)'], [1, 'rgba(255,140,120,.22)']]);
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
      AK.vignette(g, W, H, 0.55, [3, 4, 12], 0.34);
      const gt = g.createLinearGradient(0, 0, 0, bar * 1.7); gt.addColorStop(0, '#02030a'); gt.addColorStop(bar / (bar * 1.7), '#02030a'); gt.addColorStop(1, 'rgba(2,3,10,0)');
      g.fillStyle = gt; g.fillRect(0, 0, W, bar * 1.7);
      const gb = g.createLinearGradient(0, H, 0, H - bar * 1.7); gb.addColorStop(0, '#02030a'); gb.addColorStop(bar / (bar * 1.7), '#02030a'); gb.addColorStop(1, 'rgba(2,3,10,0)');
      g.fillStyle = gb; g.fillRect(0, H - bar * 1.7, W, bar * 1.7);
    });
    c.drawImage(L, 0, 0, w, h);
    if (!REDUCED) {
      c.save(); c.globalAlpha = 0.05; c.globalCompositeOperation = 'overlay';
      c.translate((Math.floor(t * 24) * 37) % 160, (Math.floor(t * 24) * 53) % 160); c.fillStyle = AK.grain(c); c.fillRect(-160, -160, w + 320, h + 320);
      c.restore();
    }
  }
};
