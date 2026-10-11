/* ============================ the actors ============================
   Who stands where and does what at time ct. Everything here is a pure function of ct (no state between frames), so the
   timeline can be scrubbed or skipped. The beats follow CUT_CAPS: walk 2.6-6.3, handshake 6.2-8.9 (diploma passes 6.9-7.5),
   diploma overhead 9.6-10.3, crowd erupts 9.8, hat toss 11.6, flash 14.4. */
const CIN_STAGE_Y = { grad: 538, dean: 534, cls: 514 };
const CIN_DEAN_X = 826, CIN_GRAD_END = 712;
const CIN_M = [769, 462];                   // where the hands meet
const CIN_CLASS = [
  { skin: '#e0ac86', hair: '#2b2118', style: 'short', h: 1.0 },
  { skin: '#f2c9a5', hair: '#7a4a2a', style: 'long', h: 0.94 },
  { skin: '#8f5d3d', hair: '#1a1a1a', style: 'afro', h: 1.03, tears: true },
  { skin: '#d99d77', hair: '#d8c27a', style: 'short', h: 0.97, glasses: true },
  { skin: '#e0ac86', hair: '#4a2e1c', style: 'curly', h: 1.05 },
  { skin: '#f2c9a5', hair: '#8a3b22', style: 'pony', h: 0.95, kiss: true },
  { skin: '#8f5d3d', hair: '#1a1a1a', style: 'short', h: 1.07 },
  { skin: '#d99d77', hair: '#2b2118', style: 'long', h: 0.92 }
];
const cinClassX = i => 268 + i * 47;

function cinBuildCast() { /* nothing heavy: figures are vector and cheap; hook kept for the art plates */ }

const cinLerp3 = (a, b, t) => a + (b - a) * t;
/* local wrist target from a world point */
const cinLoc = (wx, wy, x, y, s) => ({ x: (wx - x) / s, y: (wy - y) / s });

/* ---------- the Graduate ---------- */
function cinGradState(ct) {
  const gx = ct < 6.3 ? cinGradX(ct) : CIN_GRAD_END, gy = CIN_STAGE_Y.grad;
  const walkA = cnS5((ct - 2.6) / 0.5) * (1 - cnS5((ct - 6.0) / 0.45));
  const ph = (gx - 214) / 36 * Math.PI;
  const shake = cnS5((ct - 6.0) / 0.55) * (1 - cnS5((ct - 8.75) / 0.5));       // inner arm out to the Dean
  const raise = cnS5((ct - 9.6) / 0.7) * (1 - cnS5((ct - 13.4) / 1.0));          // diploma overhead
  const toss = cnS5((ct - 11.25) / 0.38);                                       // outer arm throws the cap
  const nervous = 1 - cnS5((ct - 2.4) / 0.5);
  const chest = cnS5((ct - 8.7) / 0.5) * (1 - cnS5((ct - 9.5) / 0.5)) + cnS5((ct - 13.4) / 1.0);   // diploma held to the chest
  const o = { gown: '#1d2e6b', stole: '#f0b429', skin: '#e8b48f', hair: '#2a1f18', hairStyle: 'short', collar: '#ff7a59', seed: 1, t: ct, dir: 1,
    walk: ph, walkAmt: walkA, cap: ct < 11.6, capCol: '#0f1626' };
  // pendulum tassel: idle, stride bounce and damped kicks on the beats
  o.tassel = Math.sin(ct * 2.3) * 0.06 + walkA * 0.34 * Math.sin(ph * 2 + 0.6) + cinSwing(ct, [[2.6, 0.2], [6.3, 0.7], [6.9, 0.35], [8.7, 0.3], [9.6, 0.8], [11.4, 0.5]]);
  o.boardTilt = walkA * 0.03 * Math.sin(ph) + raise * -0.05;
  o.messy = ct > 11.7 ? clamp((ct - 11.7) * 2, 0, 1) : 0;
  o.tears = ct > 13.2;
  // the face
  const joy = cnS5((ct - 6.3) / 0.6), cheer = cnS5((ct - 9.6) / 0.5);
  const lookTo = ct < 2.6 ? Math.sin(ct * 0.9) * 0.9 : ct < 5.4 ? 0.8 : ct < 6.2 ? lerp(0.8, 0.3, (ct - 5.4) / 0.8) : ct < 8.4 ? 0.85 : ct < 9.4 ? lerp(0.85, 0, (ct - 8.4)) : Math.sin(ct * 0.7) * 0.25;
  o.look = lookTo; o.tilt = Math.sin(ct * 1.2) * 0.012 + joy * 0.03 + (ct > 9.6 && ct < 11.4 ? -0.08 * raise : 0);
  o.headDy = 0;
  o.emote = { smile: lerp(lerp(0.08, 0.5, cnS5((ct - 2.6) / 2.4)), 1, joy), open: ct > 9.5 ? 0.55 + 0.4 * Math.abs(Math.sin(ct * 5.5)) * cheer : (ct > 7.2 ? 0.35 : 0), brow: ct < 2.6 ? 0.6 : ct > 9.5 ? 1.0 : 0.15 + joy * 0.5, worry: nervous * 0.8, blush: 0.28 + joy * 0.25, eyes: (ct > 9.7 && ct < 15) ? 'happy' : (ct > 7.4 && ct < 8.4 && Math.sin(ct * 6) > 0.6) ? 'happy' : 'open' };
  o.bob = cheer * (ct > 10.2 ? -Math.abs(Math.sin(ct * 6.2)) * 2.2 : 0) * (1 - cnS5((ct - 14.2) / 0.6));
  // arms. Local targets are in figure px, feet at the origin. The inner arm is armR (screen right, toward the Dean).
  const relaxL = { x: -27, y: -50, k: 'relax' }, relaxR = { x: 27, y: -50, k: 'relax' };
  const clasp = cinLoc(CIN_M[0] - 9, CIN_M[1] + Math.sin(ct * 13) * 1.6 * cnS5((ct - 7.4) / 0.3) * (1 - cnS5((ct - 8.5) / 0.3)), gx, gy, 1);
  let armR = relaxR, armL = relaxL;
  if (nervous > 0.01) { // hands clasped at the front, fidgeting
    const f = Math.sin(ct * 3.1) * 1.4;
    armL = { x: lerp(relaxL.x, -3 + f, nervous), y: lerp(relaxL.y, -61, nervous), k: 'relax', free: false };
    armR = { x: lerp(relaxR.x, 5 + f, nervous), y: lerp(relaxR.y, -62, nervous), k: 'relax', free: false };
  }
  if (shake > 0.001) armR = { x: lerp(armR.x, clasp.x, shake), y: lerp(armR.y, clasp.y, shake), k: 'none', free: false };
  // outer arm: a hand to the chest in delight at the handshake, then a wave to the crowd
  if (ct > 6.3 && ct < 9.6) { const q = cnS5((ct - 6.6) / 0.5) * (1 - cnS5((ct - 8.9) / 0.5)); armL = { x: lerp(armL.x, -9, q), y: lerp(armL.y, -84, q), k: 'open', free: false }; }
  // diploma to the chest
  if (chest > 0.01 && raise < 0.99) { armR = { x: lerp(armR.x, 12, chest), y: lerp(armR.y, -76, chest), k: 'hold', free: false }; armL = { x: lerp(armL.x, -10, chest * 0.8), y: lerp(armL.y, -70, chest * 0.8), k: 'relax', free: false }; }
  if (raise > 0.001) { const w = Math.sin(ct * 4.1) * 2.4; armR = { x: lerp(armR.x, 30 + w, raise), y: lerp(armR.y, -156, raise), k: 'hold', free: false }; armL = { x: lerp(armL.x, -34 - w, Math.max(raise * cnS5((ct - 9.9) / 0.4), toss)), y: lerp(armL.y, -150 - w * 0.5, Math.max(raise * cnS5((ct - 9.9) / 0.4), toss)), k: 'open', free: false }; }
  if (toss > 0 && ct < 12.4) { armL = { x: lerp(-30, -26, toss), y: lerp(-148, -168, toss), k: 'open', free: false }; }
  o.armL = armL; o.armR = armR;
  return { x: gx, y: gy, s: 1, o, raise, chest, shake };
}

/* ---------- the Dean ---------- */
function cinDeanState(ct) {
  const x = CIN_DEAN_X, y = CIN_STAGE_Y.dean, s = 1.02;
  const gx = ct < 6.3 ? cinGradX(ct) : CIN_GRAD_END;
  const shake = cnS5((ct - 6.0) / 0.55) * (1 - cnS5((ct - 8.75) / 0.5));
  const offer = cnS5((ct - 5.5) / 0.7) * (1 - cnS5((ct - 6.9) / 0.5));
  const clapQ = cnS5((ct - 8.8) / 0.4);
  const o = { gown: '#1b1b21', stole: '#d4a017', skin: '#e6b995', hair: '#cfcfd4', hairStyle: 'bald', capCol: '#1b1b21', collar: '#f4f0e6', tie: '#7a1f33', laughLines: true, crowFeet: true, heavyBrow: true, browCol: '#c9c9d0',
    seed: 4, t: ct, cap: true, shoes: '#0a0a0e', shoeSole: '#3a3a44', trousers: '#101014', flare: 0.94 };
  o.tassel = Math.sin(ct * 1.7 + 1) * 0.05 + cinSwing(ct, [[6.3, 0.35], [7.0, 0.3], [9.0, 0.4]]);
  o.look = ct < 3.3 ? -0.1 : clamp(lerp(-0.1, -0.95, cnS5((ct - 3.3) / 1.6)), -1, 0.2) * (ct < 9.6 ? 1 : 1 - cnS5((ct - 9.6) / 0.6) * 0.8);
  o.tilt = -0.012 + Math.sin(ct * 0.8) * 0.01 + shake * -0.03 + clapQ * Math.sin(ct * 3) * 0.02;
  o.headDy = 1.4;
  const laugh = (ct > 7.0 && ct < 9.7) ? 0.5 + 0.35 * Math.abs(Math.sin(ct * 4.6)) : 0;
  o.emote = { smile: lerp(0.55, 1, cnS5((ct - 5.8) / 0.6)), open: laugh * (ct > 7.4 ? 1 : 0.2) + (ct > 9.8 ? 0.35 : 0), brow: 0.4 + shake * 0.4, blush: 0.2, eyes: (ct > 6.6 && ct < 9.8) ? 'happy' : 'open' };
  o.bob = clapQ * -Math.abs(Math.sin(ct * 6)) * 0.8 + (laugh ? Math.sin(ct * 9.2) * 0.9 : 0);
  // arms: the inner arm (armL, screen left) holds the diploma and then offers and shakes; the outer arm welcomes and later claps
  let armL = { x: -15, y: -66, k: 'hold', free: false }, armR = { x: 17, y: -62, k: 'relax', free: false };
  const tgt = cinLoc(CIN_M[0] + 20, CIN_M[1] + 2, x, y, s);
  armL = { x: lerp(armL.x, tgt.x, offer), y: lerp(armL.y, tgt.y, offer), k: 'hold', free: false };
  if (ct > 5.2 && ct < 8.9) { const w = cnS5((ct - 5.2) / 0.5) * (1 - cnS5((ct - 8.6) / 0.3)); armR = { x: lerp(armR.x, 33, w), y: lerp(armR.y, -88, w), k: 'open', free: false }; }
  if (shake > 0.001) {
    const hs = cnS5((ct - 6.7) / 0.4);
    const clasp = cinLoc(CIN_M[0] + 9, CIN_M[1] + Math.sin(ct * 13) * 1.6 * cnS5((ct - 7.4) / 0.3) * (1 - cnS5((ct - 8.5) / 0.3)), x, y, s);
    armL = { x: lerp(armL.x, clasp.x, hs), y: lerp(armL.y, clasp.y, hs), k: hs > 0.9 ? 'none' : 'hold', free: false };
    if (hs < 0.05) armL.k = 'hold';
  }
  if (clapQ > 0.01) { const cp = 0.5 + 0.5 * Math.sin(ct * 14), sep = 3 + cp * 9; armL = { x: lerp(armL.x, -sep, clapQ), y: lerp(armL.y, -84, clapQ), k: 'clap', free: false }; armR = { x: lerp(armR.x, sep, clapQ), y: lerp(armR.y, -84, clapQ), k: 'clap', free: false }; }
  o.armL = armL; o.armR = armR;
  return { x, y, s, o, offer, shake };
}

/* ---------- a classmate ---------- */
function cinClassState(i, ct) {
  const spec = CIN_CLASS[i], x = cinClassX(i), y = CIN_STAGE_Y.cls, s = 0.8 * spec.h;
  const gx = ct < 6.3 ? cinGradX(ct) : CIN_GRAD_END;
  const cheer = cnS5((ct - 9.8) / 0.9), raise = cnS5((ct - 10.6 - i * 0.03) / 0.5);
  const ph = i * 1.7;
  const o = { gown: '#1d2e6b', stole: '#f0b429', skin: spec.skin, hair: spec.hair, hairStyle: spec.style, glasses: spec.glasses, tears: spec.tears && ct > 6.8, seed: i + 7, t: ct, cap: ct < 11.62, capCol: '#0f1626', collar: i % 2 ? '#f4f0e6' : '#9ad0e8', lod: 1, shadowK: 0.7, messy: ct > 11.9 ? 0.8 : 0 };
  o.tassel = Math.sin(ct * 2.6 + ph) * 0.07 + cinSwing(ct, [[2.7 + i * 0.07, 0.15], [9.9, 0.45], [11.3 + i * 0.01, 0.5]]) * 0.8;
  // heads turn to follow the Graduate across the stage, then to the handshake
  const follow = cnS5((ct - 2.7) / 0.7) * (1 - cnS5((ct - 6.0) / 0.5)), toward = cnS5((ct - 6.2) / 0.5) * (1 - cnS5((ct - 9.5) / 0.5));
  o.look = clamp((gx - x) / 130, -1, 1) * follow + clamp((770 - x) / 220, -1, 1) * toward + Math.sin(ct * 0.6 + ph) * 0.2 * (1 - follow - toward > 0 ? 1 : 0.4);
  o.tilt = Math.sin(ct * 0.9 + ph) * 0.012 + (cheer ? Math.sin(ct * 3.2 + ph) * 0.05 * cheer : 0);
  const joy = cnS5((ct - 6.3) / 0.8);
  o.emote = { smile: lerp(0.3, 0.8, joy), open: ct > 9.8 ? 0.5 + 0.45 * Math.abs(Math.sin(ct * 5.2 + ph)) * cheer : 0, brow: 0.2 + joy * 0.4, eyes: ct > 9.8 && ct < 15 && i % 2 ? 'happy' : 'open', blush: 0.3 };
  o.bob = -cheer * Math.abs(Math.sin(ct * 6.3 + ph)) * 4 + Math.sin(ct * 1.6 + ph) * 0.2;
  // arms: diploma held at the front; polite clapping once the Graduate arrives; then arms up
  const hold = { x: 8, y: -66, k: 'hold', free: false }, other = { x: -9, y: -62, k: 'relax', free: false };
  let armL = other, armR = hold;
  if (ct > 6.5 && ct < 9.6 && i % 2 === 0) { const cp = 0.5 + 0.5 * Math.sin(ct * 12 + ph), q = cnS5((ct - 6.5) / 0.4) * (1 - cnS5((ct - 9.2) / 0.3)); armL = { x: lerp(other.x, -4 - cp * 7, q), y: lerp(other.y, -82, q), k: 'clap', free: false }; armR = { x: lerp(hold.x, 4 + cp * 7, q), y: lerp(hold.y, -82, q), k: 'clap', free: false }; }
  if (spec.tears && ct > 7.0 && ct < 9.6) { const q = cnS5((ct - 7.0) / 0.4) * (1 - cnS5((ct - 9.1) / 0.4)); armR = { x: lerp(armR.x, 9, q), y: lerp(armR.y, -128, q), k: 'fist', free: false }; }
  if (spec.kiss && ct > 8.9 && ct < 9.9) { const t2 = (ct - 8.9) / 1.0, toMouth = Math.min(1, t2 * 3.2), out = cnS5((t2 - 0.35) / 0.4); armR = { x: lerp(lerp(armR.x, 9, toMouth), 40, out), y: lerp(lerp(armR.y, -124, toMouth), -138, out), k: 'open', free: false }; o.emote.open = 0.2; o.emote.smile = 1; o.look = 0.5 * (1 - out); }
  if (raise > 0.001) {
    const w = Math.sin(ct * 5.5 + ph) * 3, up = lerp(1, 0, cnS5((ct - 14.0) / 1.0));
    armL = { x: lerp(armL.x, -30 - w, raise * up), y: lerp(armL.y, -152 + w * 0.5, raise * up), k: 'open', free: false };
    armR = { x: lerp(armR.x, 30 + w, raise * up), y: lerp(armR.y, -154 - w * 0.5, raise * up), k: 'wave', free: false };
  }
  o.armL = armL; o.armR = armR;
  return { x, y, s, o, spec };
}

/* ====================================================================================
   draw the cast in depth order, then the props that tie hands together
   ==================================================================================== */
function cinCastDraw(c, V, ct) {
  const cls = [];
  for (let i = 0; i < 8; i++) cls.push(cinClassState(i, ct));
  const dean = cinDeanState(ct), grad = cinGradState(ct);
  { const e2 = V.k * V.z, l2 = e2 < 0.7 ? 1 : 0; dean.o.lod = l2; grad.o.lod = l2; }
  const A = typeof cinArtActors === 'function' ? cinArtActors(c, V, ct, cls, dean, grad) : null;
  const rets = {};
  // classmates, back to front; each holds a rolled diploma in the right hand
  const vw = CN.cur, eff = V.k * (1 + (V.z - 1)), clsLod = eff * 0.8 < 0.7 ? 2 : eff * 0.8 < 1.3 ? 1 : 0;
  for (let i = 0; i < 8; i++) {
    const st = cls[i]; st.o.lod = clsLod; st.o.cacheHead = eff < 1.5;
    if (A && A.skipClass) break;
    if (vw && (st.x + 70 * st.s < vw.x0 || st.x - 70 * st.s > vw.x1 || st.y - 200 * st.s > vw.y1 || st.y + 20 < vw.y0)) continue;
    const r = cinFigure(c, st.x, st.y, st.s, st.o);
    rets['c' + i] = r;
    if (!(st.o.armR.k === 'clap' || (st.o.armR.k !== 'hold' && st.o.armR.k !== 'wave'))) { const w = r.hands.R.world; cinDiploma(c, w[0] + 2 * st.s, w[1] - 7 * st.s, -0.35 + (st.o.armR.k === 'wave' ? -0.3 : 0), 0.62 * st.s / 0.8, clsLod >= 2 ? -1 : 0); }
    else if (st.o.armR.k === 'wave') { const w = r.hands.R.world; cinDiploma(c, w[0] + 2, w[1] - 12 * st.s, -0.3, 0.55, clsLod >= 2 ? -1 : 0); }
  }
  // Dean, then the Graduate (nearer the camera)
  const rd = (A && A.dean) ? A.dean : cinFigure(c, dean.x, dean.y, dean.s, dean.o);
  const rg = (A && A.grad) ? A.grad : cinFigure(c, grad.x, grad.y, grad.s, grad.o);
  // the diploma travels: Dean's hand -> between the hands -> the Graduate's hand -> overhead
  const wD = rd.hands.L.world, wG = rg.hands.R.world;
  // with illustrated poses the diploma is already in the picture for most beats; the procedural scroll only fills the gaps
  if (!A || !A.grad || A.story) cinDiplomaStory(c, ct, rd, rg, dean, grad);
  return { rd, rg, cls: rets };
}

/* the diploma and the clasped hands */
function cinDiplomaStory(c, ct, rd, rg, dean, grad) {
  const M = CIN_M;
  const wD = rd.hands.L.world, wG = rg.hands.R.world, shake = grad.shake, hs = cnS5((ct - 6.7) / 0.4);
  const pass = cnS5((ct - 6.9) / 0.6);
  const detail = cnS5((ct - 6.3) / 0.4) * (1 - cnS5((ct - 8.6) / 0.5));       // close-up level of detail
  if (ct < 6.2) {                      // in the Dean's hand, held upright against his body
    cinDiploma(c, wD[0] + 1, wD[1] - 4, -1.0 + Math.sin(ct * 1.3) * 0.02, 1, 0);
    return;
  }
  if (ct < 8.7) {
    const clasp = shake > 0.02;
    const bob = Math.sin(ct * 13) * 1.6 * cnS5((ct - 7.4) / 0.3) * (1 - cnS5((ct - 8.5) / 0.3));
    // scroll position: gripped between both hands, then carried by the Graduate
    const sx = lerp(lerp(wD[0] - 2, M[0] + 2, cnS5((ct - 6.2) / 0.5)), M[0] + 1, pass), sy = lerp(lerp(wD[1] - 2, M[1] - 4, cnS5((ct - 6.2) / 0.5)), M[1] - 9 + bob, pass);
    const ang = lerp(lerp(-1.0, -0.12, cnS5((ct - 6.2) / 0.5)), -0.82, pass);
    cinDiploma(c, sx, sy, ang, 1, detail);
    if (hs > 0.02) cinClasp(c, M[0], M[1] + bob, 1, ct, pass);
    return;
  }
  // after the release: in the Graduate's hand, to the chest, then overhead
  const r = grad.raise, hand = wG;
  const ang = lerp(lerp(-0.82, -1.25, cnS5((ct - 8.7) / 0.5)), -0.5, r) + Math.sin(ct * 4.1) * 0.05 * r;
  const dx = hand[0] + lerp(2, 5, r), dy = hand[1] + lerp(-6, -18, r);
  cinDiploma(c, dx, dy, ang, 1, 0);
  // a glint off the gold seal as the diploma goes up
  const gl = Math.max(0, 1 - Math.abs(ct - 9.95) / 0.38) * (REDUCED ? 0.5 : 1);
  if (gl > 0.02) {
    const sx = dx + 1.8 * Math.cos(ang) + 2.3 * Math.sin(ang), sy = dy + 1.8 * Math.sin(ang) - 2.3 * Math.cos(ang);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = gl; c.drawImage(CN.S.glowW, sx - 16, sy - 16, 32, 32);
    c.strokeStyle = 'rgba(255,250,224,.9)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(sx - 15 * gl, sy); c.lineTo(sx + 15 * gl, sy); c.moveTo(sx, sy - 15 * gl); c.lineTo(sx, sy + 15 * gl); c.stroke();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
}

/* the handshake, drawn small: two hands in profile with cuffs, thumbs on top */
function cinClasp(c, x, y, s, ct, pass) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const skinG = '#e8b48f', skinD = '#e6b995';
  // Graduate's hand (from the left): palm, fingers wrapped around the scroll, thumb over the top
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = cnShade(skinG, -0.12); cnRR(c, -13, -5, 20, 11, 4.4); c.fill();
  c.fillStyle = skinG; cnRR(c, -12, -5.6, 17, 9.4, 4); c.fill();
  { // four fingers across the scroll, which runs up and to the right at about -0.82 rad
    const ax = Math.cos(-0.82), ay = Math.sin(-0.82), nx = -ay, ny = ax, gx = -3.5, gy = -3.2;
    for (let k = 0; k < 4; k++) {
      const bx = gx + ax * (k * 2.9 - 4.4), by = gy + ay * (k * 2.9 - 4.4);
      c.strokeStyle = cnShade(skinG, -0.3); c.lineWidth = 3.4; c.beginPath(); c.moveTo(bx - nx * 6.4, by - ny * 6.4); c.lineTo(bx + nx * 4.2, by + ny * 4.2); c.stroke();
      c.strokeStyle = skinG; c.lineWidth = 2.6; c.beginPath(); c.moveTo(bx - nx * 6.4, by - ny * 6.4); c.lineTo(bx + nx * 4.2, by + ny * 4.2); c.stroke();
    }
  }
  c.strokeStyle = skinG; c.lineWidth = 3.3; c.beginPath(); c.moveTo(-6, -5.4); c.lineTo(2, -8.6); c.lineTo(8.6, -7.2); c.stroke();           // thumb on top
  c.strokeStyle = cnShade(skinG, -0.3); c.lineWidth = 0.8; c.beginPath(); c.moveTo(2, -8.6); c.lineTo(8.6, -7.2); c.stroke();
  // Dean's hand (from the right), over the Graduate's: back of the hand with knuckles, fingers wrapping under
  c.fillStyle = cnShade(skinD, -0.18); cnRR(c, -6, -3.8, 21, 10.4, 4.4); c.fill();
  c.fillStyle = skinD; cnRR(c, -5.4, -4.6, 19, 9.2, 4.2); c.fill();
  c.fillStyle = cnShade(skinD, -0.16); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-3.6 + i * 0.4, -2.4 + i * 2.5, 1.0, 0, CN_TAU); c.fill(); }
  c.strokeStyle = skinD; c.lineWidth = 2.6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-3.6, -2.2 + i * 2.4); c.quadraticCurveTo(-8.4, -1 + i * 2.4, -9, 1 + i * 2.2 + 1.4); c.stroke(); }
  c.strokeStyle = cnShade(skinD, -0.3); c.lineWidth = 0.7; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-3.6, -2.2 + i * 2.4); c.quadraticCurveTo(-8.4, -1 + i * 2.4, -9, 1 + i * 2.2 + 1.4); c.stroke(); }
  c.strokeStyle = skinD; c.lineWidth = 3.2; c.beginPath(); c.moveTo(11, -3.6); c.lineTo(3.6, -8.6); c.lineTo(-4, -9); c.stroke();                // Dean's thumb crossing over
  c.strokeStyle = cnShade(skinD, -0.28); c.lineWidth = 0.8; c.beginPath(); c.moveTo(3.6, -8.6); c.lineTo(-4, -9); c.stroke();
  c.fillStyle = 'rgba(255,240,224,.5)'; c.beginPath(); c.ellipse(2, -3.4, 4, 1, -0.08, 0, CN_TAU); c.fill();
  // the Dean's white shirt cuff with a gold link, peeking out of his black sleeve
  c.fillStyle = '#f4f0e6'; cnRR(c, 11, -5.6, 5, 11.6, 1.6); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(11, -5.6, 1.2, 11.6);
  c.fillStyle = '#f0b429'; c.beginPath(); c.arc(13.4, 0.6, 1.3, 0, CN_TAU); c.fill();
  c.restore();
}
