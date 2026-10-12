/* ============================ optional illustrated plates and poses ============================
   Progressive enhancement, all behind ART checks (see IMAGE_PROMPTS.md sections 4-6). Nothing here runs unless the files exist:
     plates   cutscene/plate-stage-empty (+ plate-crowd-back, plate-crowd-front, plate-podium) replace the procedural backdrop and set
     poses    chars/grad/pose-*.png and chars/dean/pose-*.png replace the procedural Graduate / Dean (swap + squash/stretch + bob),
              with the procedural diploma and clasp still drawn on top; chars/ch-05-classmates-{stand,cheer,toss}.png replace the line of classmates
   Each piece degrades on its own: a missing file just leaves the procedural drawing for that element. The pose / plate framing follows the
   prompts: poses are 1024x1536 with the feet on the bottom edge, centred, head top at 10% from the top; plates are 16:9. */
const CIN_PLATE = {
  // world rectangle the 16:9 stage plate is stretched over: its floor edge (72% down) lands on the stage lip (y 552), a little wider than the frame
  x: -100, y: -47, w: 1480,
  // where the (blank) banner sits on the plate, as fractions of the plate, used to set the real lettering on it
  banner: { cx: 0.5, cy: 0.215, w: 0.4 }
};
const CIN_POSE_H = 166;            // world height of a pose image's figure (feet to cap) at scale 1: 90% of the image height maps to this

/* plates, poses and lineups only show where no still covers the beat, so they are not even fetched until a still is known to be missing */
function cinSetArtOn() {
  if (!ART.on) return false;
  if (!CN.setArt) { const shots = CN.stillShots || (CN.stillShots = CUT_SHOTS.filter(s => !s.card)); CN.setArt = shots.some(s => ART.missing(s.k)); }
  return CN.setArt;
}
function cinArtPlates() {
  if (!cinSetArtOn()) return {};
  const st = ART.get('cutscene/plate-stage-empty');
  if (!st) return {};
  return { stage: st, back: ART.get('cutscene/plate-crowd-back'), front: ART.get('cutscene/plate-crowd-front'), podium: ART.get('cutscene/plate-podium') };
}
function cinPlateRect() { const P = CIN_PLATE; return { x: P.x, y: P.y, w: P.w, h: P.w * 9 / 16 }; }

/* stage plate + podium + real lettering on the blank banner */
function cinStagePlate(c, V, ct, PL) {
  const r = cinPlateRect();
  c.drawImage(PL.stage, r.x, r.y, r.w, r.h);
  if (PL.podium) { const ph = 192, pw = ph * PL.podium.naturalWidth / PL.podium.naturalHeight; c.drawImage(PL.podium, 950 - pw / 2, 534 - ph, pw, ph); }
  const b = CIN_PLATE.banner, bx = r.x + r.w * b.cx, by = r.y + r.h * b.cy, bw = r.w * b.w, k = bw / 520;
  c.save(); c.translate(bx, by); c.scale(k, k);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  try { c.letterSpacing = '5px'; } catch (e) { /* ignore */ }
  c.font = '700 21px ' + CN_SERIF; c.fillStyle = 'rgba(2,6,24,.65)'; c.fillText('FRESH GRAD STATE', 2.5, -22 + 2); c.fillStyle = '#f3d27a'; c.fillText('FRESH GRAD STATE', 2.5, -22);
  try { c.letterSpacing = '1px'; } catch (e) { /* ignore */ }
  c.font = '800 56px ' + CN_DISPLAY; c.fillStyle = 'rgba(2,6,24,.7)'; c.fillText('CLASS OF 2026', 1, 28 + 4); c.fillStyle = '#fff6df'; c.fillText('CLASS OF 2026', 1, 28);
  try { c.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  c.restore();
  cinMicGlint(c, ct);
}
/* audience plates: a distant cheering layer and a heavy foreground layer, bobbing a little and a lot when the crowd erupts */
function cinCrowdPlates(c, V, ct, PL) {
  const r = cinPlateRect(), cheer = cnS5((ct - 9.8) / 1.2);
  if (PL.back) { cinSet(c, V, 1.08); const b = Math.sin(ct * 3.1) * (0.8 + cheer * 5); c.drawImage(PL.back, r.x, r.y + b, r.w, r.h); }
  if (PL.front) { cinSet(c, V, 1.5); const b = Math.abs(Math.sin(ct * 4.3)) * cheer * 9 + Math.sin(ct * 1.3) * 1.2; c.drawImage(PL.front, r.x - 40, r.y + 60 + b, r.w + 80, r.h);  }
  if (!PL.back && !PL.front) cinCrowdDraw(c, V, ct);
  else { cinSet(c, V, 1.03); cnBlit(c, CN.L.floorFront); }
}

/* ---------- poses ---------- */
const CIN_POSES = {
  grad: ['idle', 'walk-a', 'walk-b', 'handshake', 'diploma-up', 'cap-toss', 'wave', 'nervous'],
  dean: ['idle', 'handshake', 'clap', 'point-announce']
};
function cinPose(who, name) { return cinSetArtOn() ? ART.get('chars/' + who + '/pose-' + name) : null; }
/* which pose each beat uses; null when that pose file is missing (the procedural figure then draws instead) */
function cinGradPoseName(ct, g) {
  if (ct < 2.6) return 'nervous';
  if (ct < 6.2) { const w = (g.o.walk || 0) / Math.PI; return g.o.walkAmt < 0.15 ? 'idle' : (Math.floor(w) % 2 ? 'walk-b' : 'walk-a'); }
  if (ct < 8.9) return 'handshake';
  if (ct < 9.6) return 'idle';
  if (ct < 11.45) return 'diploma-up';
  if (ct < 13.6) return 'cap-toss';
  return 'wave';
}
function cinDeanPoseName(ct) {
  if (ct >= 3.7 && ct < 5.5) return 'point-announce';
  if (ct >= 6.1 && ct < 8.9) return 'handshake';
  if (ct >= 8.9) return 'clap';
  return 'idle';
}
function cinPoseDraw(c, img, x, y, s, bob, squash, flip) {
  const h = CIN_POSE_H / 0.9 * s, w = h * img.naturalWidth / img.naturalHeight;
  c.save(); c.translate(x, y + bob);
  c.scale(flip ? -1 : 1, 1);
  c.scale(1 + squash * -0.5, 1 + squash);
  c.drawImage(img, -w / 2, -h, w, h);
  c.restore();
}
function cinWristWorld(o, side, x, y, s) {
  const t = side < 0 ? o.armL : o.armR, ik = cinIK(side * 20, -106, t.x, t.y, side);
  return [x + ik.w[0] * s, y + ik.w[1] * s];
}
/* returns {dean, grad, skipClass} when art replaces some of the cast. dean/grad carry wrist positions so the diploma and clasp still line up */
function cinArtActors(c, V, ct, cls, dean, grad) {
  if (!cinSetArtOn()) return null;
  let out = null;
  const gp = cinPose('grad', cinGradPoseName(ct, grad)), dp = cinPose('dean', cinDeanPoseName(ct));
  const cs = ct < 9.8 ? 'stand' : ct < 11.6 ? 'cheer' : ct < 12.8 ? 'toss' : 'cheer';
  const ci = ART.get('chars/ch-05-classmates-' + cs);
  const ret = (o, x, y, s) => ({ hands: { L: { world: cinWristWorld(o, -1, x, y, s) }, R: { world: cinWristWorld(o, 1, x, y, s) } }, head: [x, y - 137 * s], capTop: [x, y - 160 * s] });
  if (ci) {                       // the lineup of eight classmates as one plate-like layer on the left of the stage
    const w = 560, h = w * 9 / 16, bob = ct > 9.8 ? -Math.abs(Math.sin(ct * 6.3)) * 4 : 0;
    c.drawImage(ci, 262 - 20, 520 - h * 0.99 + bob, w, h);
    out = out || {}; out.skipClass = true;
  }
  if (dp) {
    const x = dean.x, y = dean.y, s = dean.s, bob = dean.o.bob * 0.6, sq = Math.sin(ct * 1.9) * 0.004 + (ct > 8.9 ? Math.sin(ct * 14) * 0.006 : 0);
    cinShadow(c, x, y, s, 0.9); cinPoseDraw(c, dp, x, y, s, bob, sq, false);
    out = out || {}; out.dean = ret(dean.o, x, y, s);
  }
  if (gp) {
    const x = grad.x, y = grad.y, s = grad.s, wa = grad.o.walkAmt, bob = -Math.abs(Math.sin(grad.o.walk || 0)) * 3.2 * wa + (grad.o.bob || 0) * 0.6, sq = Math.sin((grad.o.walk || 0) * 2) * 0.012 * wa + Math.sin(ct * 1.9) * 0.004 + (ct > 9.6 && ct < 11.5 ? Math.abs(Math.sin(ct * 6.2)) * 0.012 : 0);
    cinShadow(c, x, y, s, 1); cinPoseDraw(c, gp, x, y, s, bob, sq, false);
    out = out || {}; out.grad = ret(grad.o, x, y, s);
    const gn = cinGradPoseName(ct, grad); out.story = ct >= 8.7 && (gn === 'idle' || gn === 'cap-toss');
  }
  return out;
}
