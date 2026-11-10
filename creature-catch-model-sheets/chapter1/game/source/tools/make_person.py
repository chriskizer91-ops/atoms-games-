import re, sys
src = open('/home/claude/cc3d/src/person.src.js').read()
def rep(old, new, n=1):
    global src
    c = src.count(old)
    if c != n:
        print('ANCHOR COUNT', c, 'for:', old[:90]); sys.exit(1)
    src = src.replace(old, new)

# --- header and name
src = src.replace('/* ==== MODULE: wren-3d/src/wren-model.js ==== */\n', '')
rep("function makeWren(opts) {", """// person.js: everyone in Creature Catch 3D, on the body of Wren from What the Map Forgot in 3D (wren-model.js), the same
// cel shading, ink outlines, skinned buckets, leg IK and spring chains, dressed from each character's Creature Catch sprite.
// Additions for Creature Catch: hair styles spiky / pony / elder / ranger, a jacket or robe length, open jackets showing a
// shirt, sleeve colours, a backpack, a belt, a beard, glasses, a staff, eye colours, and the throw, cheer, point and nod moves.
// The lamplighter's pole is gone.
function makePerson(opts) {""")
rep("const root = new THREE.Group(); root.name = 'Wren';", "const root = new THREE.Group(); root.name = 'Person';")

# --- look defaults
rep("const LOOK = Object.assign({ style: 'bob', scarf: true, freckles: true, apron: null, buttons: true, hat: null }, opts.look || {});",
    "const LOOK = Object.assign({ style: 'bob', scarf: true, freckles: true, apron: null, buttons: true, hat: null, coatLen: 'long', shirt: null, sleeves: null, pack: null, belt: null, beard: null, glasses: null, staff: null, iris: null, spike: 1, cuff: null, sole: null }, opts.look || {});")

# --- coat texture: open jacket shows the shirt down the front
rep("  g.fillStyle = P_.nv3; g.fillRect(S * .455, 0, S * .016, S * .9);\n  g.fillStyle = P_.ink2; g.fillRect(S * .471, 0, 2, S * .9);",
    """  if (LOOK.shirt) { // an open jacket: the shirt shows down the front, with the jacket's lighter edges either side
   const sh = pc(LOOK.shirt); g.fillStyle = sh; g.fillRect(S * .435, 0, S * .13, S);
   g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 8; y < S; y += 22) g.fillRect(S * .435, y, S * .13, 2);
   g.fillStyle = P_.nv3; g.fillRect(S * .425, 0, S * .012, S); g.fillRect(S * .563, 0, S * .012, S);
   g.fillStyle = P_.ink2; g.fillRect(S * .435, 0, 1, S); g.fillRect(S * .563, 0, 1, S);
  } else {
   g.fillStyle = P_.nv3; g.fillRect(S * .455, 0, S * .016, S * .9);
   g.fillStyle = P_.ink2; g.fillRect(S * .471, 0, 2, S * .9);
  }""")

# --- eyes: an iris colour
rep("  gr.addColorStop(0, '#0c0b14'); gr.addColorStop(.5, P_.ink); gr.addColorStop(1, '#45416a');",
    "  if (LOOK.iris) { const ir = LOOK.iris.map(pc); gr.addColorStop(0, '#0c0b14'); gr.addColorStop(.35, ir[0]); gr.addColorStop(1, ir[1]); }\n  else { gr.addColorStop(0, '#0c0b14'); gr.addColorStop(.5, P_.ink); gr.addColorStop(1, '#45416a'); }")

# --- ponytail bones (always made; only the pony style hangs hair on them)
rep(" const tuftB = [bone('tuft', head, -.02, HR[1] + HC[1] - HB[1] + .02, -.03)]; tuftB.push(bone('tuftt', tuftB[0], -.01, .035, .02));",
    """ const tuftB = [bone('tuft', head, -.02, HR[1] + HC[1] - HB[1] + .02, -.03)]; tuftB.push(bone('tuftt', tuftB[0], -.01, .035, .02));
 const ponyB = [bone('pony0', head, 0, HC[1] - HB[1] + .14, HC[2] - .19)]; ponyB.push(bone('pony1', ponyB[0], 0, -.09, -.05)); ponyB.push(bone('pony2', ponyB[1], 0, -.09, -.01));""")

# --- hair styles
rep(" if (LOOK.style !== 'helm' && LOOK.style !== 'cap') for (let k = 0; k < 12; k++)",
    " const SPIKY = LOOK.style === 'spiky', ELDER = LOOK.style === 'elder', PONY = LOOK.style === 'pony', RANGER = LOOK.style === 'ranger';\n if (SPIKY) { // spikes all over: up and out from the crown, out and down round the sides and back, jagged over the forehead\n  const sp = LOOK.spike;\n  for (let k = 0; k < 11; k++) { const az = -PI + (k + .5) / 11 * TAU + (rnd() - .5) * .25, back = Math.cos(az) < 0; lock(az * .35, 1.5, az, back ? .55 : .9, { w: .085, r0: .004, r1: (.07 + rnd() * .05) * sp, bulge: .03, taper: 1.35, flat: .55, seg: 10 }); }\n  for (let k = 0; k < 9; k++) { const az = lerp(1.15, TAU - 1.15, k / 8), a = az > PI ? az - TAU : az; lock(a, 1.0, a + (rnd() - .5) * .3, -.25 + rnd() * .2, { w: .085, r0: .006, r1: (.05 + rnd() * .03) * sp, bulge: .02, taper: 1.3, flat: .5, flick: radial(a, .03 * sp, .012), seg: 10, chain: bobB[Math.min(6, Math.round(k * 6 / 8))], amt: .35 }); }\n  for (let k = 0; k < 6; k++) { const t = k / 5, az = lerp(-.75, .75, t); lock(az * .5, 1.35, az * 1.1, .28 + .08 * Math.cos(PI * (t - .5)) + (rnd() - .5) * .06, { w: .07, r0: .006, r1: .03, bulge: .028, taper: 1.4, flat: .4, flick: [az * .02, -.004, .022], seg: 10 }); }\n }\n if (ELDER) { // a bald crown with a white fringe round the sides and back, falling to the collar\n  for (let k = 0; k < 11; k++) { const az = lerp(1.3, TAU - 1.3, k / 10), a = az > PI ? az - TAU : az; lock(a, .45, a + (rnd() - .5) * .1, -.75, { w: .07, r0: .006, r1: .028, bulge: .018, flat: .5, taper: .8, flick: radial(a, .01, 0), chain: bobB[Math.min(6, Math.round(k * 6 / 10))], seg: 10, amt: .6 }); }\n }\n if (PONY) { // a ponytail tied high at the back, on its own springy bones\n  const b0 = bw(ponyB[0]), b1 = bw(ponyB[1]), b2 = bw(ponyB[2]), tip = [b2[0], b2[1] - .08, b2[2] + .01];\n  const pts = [[b0[0], b0[1] + .02, b0[2] + .03], b0, b1, b2, tip];\n  tinted(HAIRC[0], () => add(tube(pts, Q(18, 9), Q(10, 6), (t) => .05 * (1 - .75 * t) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 2))) + .004, .7), M.hair, wChain(['pony0', 'pony1', 'pony2'], [b0, b1, b2, tip], 'head', .9)));\n  for (const d of [-.05, .05]) tinted([.95, .92, .9], () => add(tube([[b0[0] + d, b0[1] + .03, b0[2] + .02], [b0[0] + d * 1.5, b0[1] - .02, b0[2] - .05], [b1[0] + d, b1[1], b1[2]], [b2[0] + d * .5, b2[1] - .04, b2[2]]], Q(12, 7), Q(6, 4), (t) => .022 * (1 - .8 * t) + .003, .6), M.hair, wChain(['pony0', 'pony1', 'pony2'], [b0, b1, b2, tip], 'head', .9)));\n  if (M.tie) add(new THREE.TorusGeometry(.026, .011, Q(6), Q(14)), M.tie, BI.head, [b0[0], b0[1] + .01, b0[2] + .005], [.9, 0, 0]);\n }\n if (LOOK.style !== 'helm' && LOOK.style !== 'cap' && !SPIKY && !ELDER && !RANGER) for (let k = 0; k < 12; k++)")
rep(" if (LOOK.style !== 'long') BOB.forEach((az, i) => {", " if (LOOK.style !== 'long' && !SPIKY && !ELDER) BOB.forEach((az, i) => {")
rep(" for (let k = 0; k < 7; k++) {\n  const t = k / 6, az = lerp(-.66, .66, t) + (rnd() - .5) * .04;",
    " if (!SPIKY && !ELDER) for (let k = 0; k < 7; k++) {\n  const t = k / 6, az = lerp(-.66, .66, t) + (rnd() - .5) * .04;")
rep(" if (LOOK.style === 'bob' || LOOK.style === 'short') {\n  const b = bw(tuftB[0])",
    """ if (RANGER && M.hat) { // the ranger's wide-brimmed hat with a feather in the band
  add(lathe([[.0, .3], [.1, .3], [.16, .27], [.18, .2], [.19, .14]].map(([r, y]) => [r, HC[1] + y - .03]), Q(28), { sz: .95 }), M.hat, BI.head);
  add(lathe([[.19, .12], [.3, .1], [.33, .085], [.3, .08], [.19, .1]].map(([r, y]) => [r, HC[1] + y - .03]), Q(30), { sz: .9 }), M.hat, BI.head);
  tinted([.55, .45, .4], () => add(new THREE.TorusGeometry(.188, .014, Q(5), Q(28)), M.hat, BI.head, [HC[0], HC[1] + .12, HC[2]], [PI / 2, 0, 0], [1, .95, 1]));
  if (M.feather) add(tube([[.15, HC[1] + .11, -.06], [.2, HC[1] + .2, -.12], [.22, HC[1] + .32, -.2], [.2, HC[1] + .4, -.26]], Q(10, 6), Q(6, 4), (t) => .022 * Math.sin(PI * (.1 + .85 * t)) + .002, .3), M.feather, BI.head);
 }
 if (LOOK.style === 'bob' || LOOK.style === 'short' || (SPIKY && LOOK.tuft)) {
  const b = bw(tuftB[0])""")

# extra materials
rep("  mouth: new THREE.MeshBasicMaterial({ map: T.mouth,", """  tie: LOOK.tie ? toon(pc(LOOK.tie)) : null, feather: LOOK.feather ? toon(pc(LOOK.feather)) : null,
  pack: LOOK.pack ? toon(pc(LOOK.pack[0])) : null, belt: LOOK.belt ? toon(pc(LOOK.belt)) : null, beard: LOOK.beard ? toon(pc(LOOK.beard)) : null,
  glass: LOOK.glasses ? toon(pc(LOOK.glasses)) : null, staff: LOOK.staff ? toon(pc(LOOK.staff)) : null,
  mouth: new THREE.MeshBasicMaterial({ map: T.mouth,""")

# --- coat length
rep(" const coatProf = [[.05, .725], [.078, .708], [.1, .682], [.111, .652], [.113, .605], [.107, .555], [.103, .505], [.108, .462], [.123, .41], [.14, .35], [.153, .292], [.16, .25]];",
    """ const coatProf = LOOK.coatLen === 'jacket' ? [[.05, .725], [.078, .708], [.1, .682], [.111, .652], [.113, .605], [.107, .555], [.103, .505], [.108, .462], [.116, .425], [.12, .4]]
  : LOOK.coatLen === 'robe' ? [[.05, .725], [.078, .708], [.1, .682], [.111, .652], [.113, .605], [.107, .555], [.103, .505], [.108, .462], [.123, .41], [.14, .35], [.153, .292], [.162, .22], [.168, .14], [.172, .06]]
  : [[.05, .725], [.078, .708], [.1, .682], [.111, .652], [.113, .605], [.107, .555], [.103, .505], [.108, .462], [.123, .41], [.14, .35], [.153, .292], [.16, .25]];""")

# --- sleeves in their own colour
rep("  add(uvAt(tube(pts, Q(16, 8), Q(12, 8), (t) => lerp(.044, .041, sm(0, .5, t)) + .007 * sm(.8, 1, t), 1), COATP[0], COATP[1]), M.coat, wArm);\n  add(uvAt(new THREE.SphereGeometry(.047, Q(14), Q(10)), COATP[0], COATP[1]), M.coat, (x, y) => [[BI.chest, .35], [BI['shoulder' + sd], .65]], [S[0], S[1] + .006, S[2]], null, [1, .9, .95]);\n  tinted(NAVY3, () =>",
    "  const SLV = LOOK.sleeves ? ratio(P_.nv, pc(LOOK.sleeves)) : null;\n  tinted(SLV, () => add(uvAt(tube(pts, Q(16, 8), Q(12, 8), (t) => lerp(.044, .041, sm(0, .5, t)) + .007 * sm(.8, 1, t), 1), COATP[0], COATP[1]), M.coat, wArm));\n  add(uvAt(new THREE.SphereGeometry(.047, Q(14), Q(10)), COATP[0], COATP[1]), M.coat, (x, y) => [[BI.chest, .35], [BI['shoulder' + sd], .65]], [S[0], S[1] + .006, S[2]], null, [1, .9, .95]);\n  tinted(LOOK.cuff ? ratio(P_.nv, pc(LOOK.cuff)) : SLV || NAVY3, () =>")

# --- boots: a light sole for sneakers
rep("   tinted(ratio(P_.bt, P_.bt2), () => add(new THREE.SphereGeometry(1, Q(16), Q(8)), M.boot, wFoot, [x, .009, .036], null, [.049, .012, .088]));",
    "   tinted(LOOK.sole ? ratio(P_.bt, pc(LOOK.sole)) : ratio(P_.bt, P_.bt2), () => add(new THREE.SphereGeometry(1, Q(16), Q(8)), M.boot, wFoot, [x, .009, .036], null, [.049, .012, .088]));")

# --- extras after the scarf: belt, backpack, beard, glasses
rep(" // ---------- the lamplighter's pole: her weapon, her reach and her light (Chris's answer 4) ----------",
    """ // ---------- Creature Catch extras: a belt, a backpack, a beard, glasses ----------
 if (M.belt) {
  add(new THREE.TorusGeometry(.108, .013, Q(6), Q(28)), M.belt, wTorso, [0, .468, 0], [PI / 2, 0, 0], [1, .84, 1.4]);
  inked(.4, () => add(new THREE.BoxGeometry(.034, .028, .012), M.brass, wTorso, [0, .468, .095]));
 }
 if (M.pack) { // a leather backpack with a flap, a pocket and two straps over the shoulders
  const pk = LOOK.pack.map(pc), dk = ratio(pk[0], pk[1] || pk[0]);
  const rb = (w, h, d, r) => { const g = new THREE.BoxGeometry(w, h, d, 6, 6, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i); const q = new THREE.Vector3(Math.sign(_v.x) * Math.max(0, Math.abs(_v.x) - (w / 2 - r)), Math.sign(_v.y) * Math.max(0, Math.abs(_v.y) - (h / 2 - r)), Math.sign(_v.z) * Math.max(0, Math.abs(_v.z) - (d / 2 - r))); const c = _v.clone().sub(q); if (q.lengthSq() > 0) { q.normalize().multiplyScalar(r); p.setXYZ(i, c.x + q.x, c.y + q.y, c.z + q.z); } } g.computeVertexNormals(); return g; };
  const wP = () => [[BI.chest, .8], [BI.spine, .2]];
  add(rb(.2, .22, .1, .035), M.pack, wP, [0, .6, -.155]);
  tinted(dk, () => { add(rb(.21, .09, .11, .03), M.pack, wP, [0, .69, -.152], [-.12, 0, 0]); add(rb(.13, .08, .04, .015), M.pack, wP, [0, .56, -.21]); });
  inked(.4, () => add(new THREE.BoxGeometry(.03, .026, .01), M.brass, wP, [0, .655, -.212]));
  tinted(dk, () => { for (const sd of [-1, 1]) add(tube([[sd * .07, .69, -.12], [sd * .085, .735, -.04], [sd * .09, .72, .06], [sd * .085, .62, .1], [sd * .075, .53, .095]], Q(14, 8), Q(6, 4), () => .012, .35), M.pack, wTorso); });
 }
 if (M.beard) { // a long white beard from the chin, and a moustache
  const ch = faceAt(0, -.78, -.01).p, bpts = [[ch.x - HW[0] * 0, ch.y + .02, ch.z - .01], [ch.x, ch.y - .05, ch.z + .025], [ch.x, ch.y - .14, ch.z + .035], [ch.x, ch.y - .22, ch.z + .02]];
  add(tube(bpts, Q(14, 8), Q(14, 8), (t) => .085 * Math.pow(1 - t, .7) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 1.6))) + .006, .55, () => {}), M.beard, (x, y) => { const k = sm(ch.y - .06, ch.y - .18, y) * .6; return [[BI.head, 1 - k], [BI.chest, k]]; });
  for (const sd of [-1, 1]) { const a = faceAt(sd * .05, -.4, .004).p, b = faceAt(sd * .32, -.52, .006).p; add(tube([[a.x, a.y, a.z], [b.x, b.y + .004, b.z + .01], [b.x + sd * .03, b.y - .04, b.z - .005]], Q(8, 5), Q(6, 4), (t) => .02 * (1 - .7 * t) + .003, .6), M.beard, BI.head); }
  for (const sd of [-1, 1]) { const a = faceAt(sd * .92, -.2, .01).p; add(tube([[a.x, a.y + .05, a.z - .02], [a.x + sd * .02, a.y - .05, a.z], [a.x + sd * .01, a.y - .14, a.z + .02]], Q(8, 5), Q(6, 4), (t) => .03 * (1 - .5 * t) + .004, .6), M.beard, BI.head); }
 }
 if (M.glass) inked(.35, () => { // round spectacles
  for (const sd of [-1, 1]) { const { p } = faceAt(sd * .4, -.1, .03); add(new THREE.TorusGeometry(.04, .0045, Q(5), Q(16)), M.glass, BI.head, [p.x, p.y, p.z + .01]); }
  const a = faceAt(-.12, -.06, .035).p, b = faceAt(.12, -.06, .035).p; add(tube([[a.x, a.y, a.z + .008], [0, a.y + .008, a.z + .02], [b.x, b.y, b.z + .008]], 4, 4, () => .004, 1), M.glass, BI.head);
 });
 // (the lamplighter's pole from What the Map Forgot is left out)
 const POLE = { g: new THREE.Group(), axis: new THREE.Group(), inner: null, tip: new THREE.Group(), len: .62, want: .62, base: .28 };
 if (false) // ---------- the lamplighter's pole ----------""")
rep(" const POLE = { g: new THREE.Group(), axis: new THREE.Group(), inner: null, tip: new THREE.Group(), len: .62, want: .62, base: .28 };\n {\n  const G = new THREE.Vector3",
    " {\n  const G = new THREE.Vector3")

# --- staff: a walking stick in the left hand
rep(" const POLE_TIP = new THREE.Vector3(0, .052, 0); // the flame, in the tip's own space",
    """ const POLE_TIP = new THREE.Vector3(0, .052, 0);
 if (M.staff) { // a gnarled walking stick held upright in the left hand, curling over at the top
  const sg = new THREE.Group(); sg.position.set(0, -.05, .02); wrists[1].add(sg);
  const pts = [[0, -.5, 0], [.006, -.3, .004], [-.004, -.1, 0], [0, .1, 0], [.006, .2, .01], [.03, .27, .02], [.06, .26, .02], [.06, .22, .015]];
  const geo = tube(pts, Q(26, 12), Q(8, 5), (t) => .016 * (1 - .3 * t) + .004 * Math.sin(t * 40), 1);
  const st = new THREE.Mesh(geo, M.staff); st.castShadow = true; sg.add(st);
  const ig = geo.clone(); ig.setAttribute('inkw', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(1), 1));
  const im = new THREE.Mesh(ig, propInk); sg.add(im);
  STAFF = sg;
 }""")
rep(" let aimT = null;", " let STAFF = null; let aimT = null;")
# a plain (unskinned) ink for props held in a hand
rep(" inkMat.customProgramCacheKey = () => 'wren-ink';",
    """ inkMat.customProgramCacheKey = () => 'wren-ink';
 const propInk = new THREE.MeshBasicMaterial({ color: P_.ink, side: THREE.BackSide });
 propInk.onBeforeCompile = (sh) => { sh.uniforms.uInk = INK; sh.vertexShader = 'uniform float uInk;\\nattribute float inkw;\\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\\ntransformed += normal * uInk * inkw;'); };
 propInk.customProgramCacheKey = () => 'wren-prop-ink';""")

# --- remove the pole's flame and its per-frame code
rep(""" const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
 flame.scale.set(.05, .07, 1); fx.add(flame);
 const flameL = new THREE.PointLight(P_.fl2, 0, 1.6, 2); fx.add(flameL);""", "")
i0 = src.index(" // the pole: out while a pose asks for it (tp)")
i1 = src.index("  } else { flame.material.opacity = 0; flameL.intensity = 0; }\n") + len("  } else { flame.material.opacity = 0; flameL.intensity = 0; }\n")
src = src[:i0] + src[i1:]
rep("  if (name === 'flame') { POLE.tip.updateWorldMatrix(true, false); return out.copy(POLE_TIP).applyMatrix4(POLE.tip.matrixWorld); }\n", "")
rep(" aim(p) { aimT = p ? (aimT || new THREE.Vector3()).copy(p) : null; }, get pole() { return { len: POLE.len, angle: POLE.angle || 0, out: POLE.g.visible }; },", " aim() {},")
rep("const faceMats = [M.eye, M.lid, M.mouth], fadeMats = [...new Set(skinned.map((m) => m.material).concat(faceMats, [M.brass, inkMat]))]",
    "const faceMats = [M.eye, M.lid, M.mouth], fadeMats = [...new Set(skinned.map((m) => m.material).concat(faceMats, [M.brass, inkMat], M.staff ? [M.staff, propInk] : []))]")

# --- a standing pose of one's own (hands on hips, holding a staff, squinting) and new moves
rep(" const CH = Object.keys(READY).filter((k) => k !== 'mo');", " Object.assign(READY, opts.ready || {});\n const CH = Object.keys(READY).filter((k) => k !== 'mo');")
rep(" act('wave', 1.9,", """ // Creature Catch: throwing a cube overarm (hit: the moment it leaves the hand), a cheer, pointing, a nod, a start
 act('throw', 1.05, [
  K(0), K(.3, { rSX: -2.7, rSZ: .45, rSY: .3, rE: -1.7, rWX: .4, cY: .45, pY: .25, sY: .1, hY: -.3, lSX: -.9, lSZ: .3, lE: -.6, fR: .9, rFz: -.04, lFz: .05, br: .4 }),
  K(.46, { rSX: -1.1, rSZ: .2, rSY: 0, rE: -.25, rWX: -.3, cY: -.4, pY: -.2, sY: -.1, hY: .1, pX: .14, cX: .08, lSX: .4, lSZ: .2, lE: -.4, fR: .05, lFz: .1, rFz: -.07, rFp: .5, mo: 2 }),
  K(.66, { rSX: -.35, rSZ: .15, rE: -.3, cY: -.25, pY: -.12, pX: .1, hY: 0 }), K(1, READY),
 ], { hits: [.44] });
 act('cheer', 1.2, [K(0), K(.25, { rSX: -2.9, lSX: -2.9, rSZ: .45, lSZ: .45, rE: -.25, lE: -.25, fR: .9, fL: .9, mo: 2, br: .6, hX: -.15, y: .04 }), K(.45, { y: .12, rFy: .08, lFy: .08 }), K(.6, { y: .02, rFy: 0, lFy: 0 }), K(.8), K(1, READY)]);
 act('point', 1.4, [K(0), K(.25, { rSX: -1.45, rSZ: .12, rE: -.08, rWX: -.1, fR: 0, hY: -.05, br: .3 }), K(.8), K(1, READY)]);
 act('nod', .8, [K(0), K(.25, { hX: .3, nX: .1 }), K(.5, { hX: -.05 }), K(.72, { hX: .22 }), K(1, READY)]);
 act('surprise', .9, [K(0), K(.2, { y: .05, pX: -.15, cX: -.1, hX: -.1, rSX: -.8, lSX: -.8, rSZ: .5, lSZ: .5, rE: -1.2, lE: -1.2, fR: 0, fL: 0, mo: 1, br: 1, rFz: -.05, lFz: -.08 }), K(.6, { y: 0 }), K(1, READY)]);
 act('wave', 1.9,""")
src = src.replace("Interface (the Envoi Model Build Spec, plus three extras for the demo):", "Interface (as makeWren's):")
open('/home/claude/cc3d/src/person.js', 'w').write(src)
print('ok', len(src))
src = open('/home/claude/cc3d/src/person.js').read()
rep("  STAFF = sg;\n", "  STAFF = sg;\n")
rep(" if (M.staff) { // a gnarled walking stick", " let STAFF = null;\n if (M.staff) { // a gnarled walking stick")
rep(" let STAFF = null; let aimT = null;", " let aimT = null;")
rep(", (t) => .085 * Math.pow(1 - t, .7) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 1.6))) + .006, .55, () => {}), M.beard", ", (t) => .085 * Math.pow(1 - t, .7) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 1.6))) + .006, .55), M.beard")
rep("  applyPose(FIN);\n", "  applyPose(FIN);\n  if (STAFF) { root.getWorldQuaternion(_sq1); wrists[1].getWorldQuaternion(_sq2); STAFF.quaternion.copy(_sq2).invert().multiply(_sq1); }\n")
rep(" const _p1 = new THREE.Vector3();\n function animate(", " const _p1 = new THREE.Vector3(), _sq1 = new THREE.Quaternion(), _sq2 = new THREE.Quaternion();\n function animate(")
open('/home/claude/cc3d/src/person.js', 'w').write(src)
print('ok2')
