// Water and impact effects.
import * as THREE from 'three';
import { makeWaterMaterial } from './materials.js';

const V3 = THREE.Vector3;
const _v = new V3(), _v2 = new V3(), _v3 = new V3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new V3(), _c = new THREE.Color();
const UP = new V3(0, 1, 0);
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));

function softTexture(kind = 'soft') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === 'soft') { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.85, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------ soft sprite particles (mist, spray, dust, glow)
class Puffs {
  constructor(scene, max, additive) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    this.items = [];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uTex: { value: softTexture('soft') }, uScale: { value: 600 } },
      vertexShader: `attribute vec4 aCol; attribute float aSize; varying vec4 vCol; uniform float uScale;
        void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uScale / max(0.1, -mv.z); }`,
      fragmentShader: `uniform sampler2D uTex; varying vec4 vCol;
        void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vCol.rgb, vCol.a * a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = additive ? 6 : 5;
    scene.add(this.points);
  }
  add(o) { if (this.items.length < this.max) this.items.push(o); }
  update(dt) {
    const it = this.items; let n = 0;
    for (let i = 0; i < it.length; i++) {
      const p = it[i]; p.t += dt;
      if (p.t >= p.life) continue;
      p.vy -= (p.g || 0) * dt;
      const dr = Math.exp(-(p.drag || 0) * dt);
      p.vx *= dr; p.vy *= dr; p.vz *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.floor && p.y < 0.01) { p.y = 0.01; p.vy = 0; }
      const k = p.t / p.life;
      const a = p.a * (k < p.fin ? k / p.fin : 1 - (k - p.fin) / (1 - p.fin));
      this.pos[n * 3] = p.x; this.pos[n * 3 + 1] = p.y; this.pos[n * 3 + 2] = p.z;
      this.col[n * 4] = p.r; this.col[n * 4 + 1] = p.gc; this.col[n * 4 + 2] = p.b; this.col[n * 4 + 3] = Math.max(0, a);
      this.size[n] = p.s0 + (p.s1 - p.s0) * (1 - (1 - k) * (1 - k));
      it[n++] = p;
    }
    it.length = n;
    const g = this.points.geometry;
    g.setDrawRange(0, n);
    g.attributes.position.needsUpdate = g.attributes.aCol.needsUpdate = g.attributes.aSize.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ the effects kit
export class FX {
  constructor(scene, shared, stage) {
    this.scene = scene; this.shared = shared; this.stage = stage;
    this.tasks = []; this.streams = []; this.rings = []; this.objects = [];
    this.puffs = new Puffs(scene, 900, false);
    this.glows = new Puffs(scene, 400, true);
    // water droplets
    this.dropMax = 700; this.drops = [];
    this.dropMat = makeWaterMaterial(shared, { glow: 0.3, opacity: 0.95 });
    this.dropMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), this.dropMat, this.dropMax);
    this.dropMesh.count = 0; this.dropMesh.frustumCulled = false; this.dropMesh.castShadow = false; this.dropMesh.renderOrder = 3;
    this.dropMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.dropMesh);
    // rings
    this.ringGeo = new THREE.PlaneGeometry(2, 2);
    this.ringPool = [];
    this.streamMat = (foam = 0.6) => makeWaterMaterial(shared, { glow: 0.28, wobble: 0.0, flow: 3.0, foam, side: THREE.DoubleSide });
    this.dartGeo = dartGeometry();
    this.puddles = [];
  }

  // ---- time helpers
  /** Run fn(k 0..1, dt) for dur seconds. */
  run(dur, fn, done) { this.tasks.push({ t: 0, dur, fn, done }); }
  after(delay, fn) { this.tasks.push({ t: 0, dur: delay, fn: null, done: fn }); }

  // ---- particles
  droplets(pos, n, o = {}) {
    const dir = o.dir, speed = o.speed ?? 1.5, spread = o.spread ?? 1, up = o.up ?? 0.6;
    for (let i = 0; i < n && this.drops.length < this.dropMax; i++) {
      _v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      if (dir) _v.multiplyScalar(spread).add(dir).normalize();
      const sp = speed * rand(0.35, 1);
      this.drops.push({ x: pos.x + rand(-1, 1) * (o.jitter ?? 0.02), y: pos.y + rand(-1, 1) * (o.jitter ?? 0.02), z: pos.z + rand(-1, 1) * (o.jitter ?? 0.02),
        vx: _v.x * sp, vy: _v.y * sp + up * speed * rand(0.4, 1), vz: _v.z * sp,
        s: (o.size ?? 0.012) * rand(0.5, 1.3), life: (o.life ?? 1.2) * rand(0.6, 1), t: 0, g: o.g ?? 6.5, splash: o.splash ?? true, stretch: o.stretch ?? 1 });
    }
  }
  rain(center, radius, n, o = {}) {
    for (let i = 0; i < n && this.drops.length < this.dropMax; i++) {
      const a = rand(Math.PI * 2), r = Math.sqrt(Math.random()) * radius;
      this.drops.push({ x: center.x + Math.cos(a) * r, y: center.y + rand(-0.03, 0.03), z: center.z + Math.sin(a) * r * 0.75, vx: o.wind ?? 0.15, vy: -(o.speed ?? 3.6) * rand(0.8, 1.1), vz: 0,
        s: 0.0075 * rand(0.7, 1.2), life: 1.2, t: 0, g: 3, splash: true, stretch: 2.6, rain: true });
    }
  }
  mist(pos, n, o = {}) {
    const col = o.color ?? [0.82, 0.93, 1.0];
    for (let i = 0; i < n; i++) {
      _v.set(rand(-1, 1), rand(-0.3, 1), rand(-1, 1)).normalize().multiplyScalar((o.speed ?? 0.5) * rand(0.3, 1));
      if (o.dir) _v.addScaledVector(o.dir, (o.speed ?? 0.5) * (o.push ?? 1));
      this.puffs.add({ x: pos.x + rand(-1, 1) * (o.jitter ?? 0.05), y: pos.y + rand(-1, 1) * (o.jitter ?? 0.05), z: pos.z + rand(-1, 1) * (o.jitter ?? 0.05),
        vx: _v.x, vy: _v.y + (o.rise ?? 0.1), vz: _v.z, g: o.g ?? 0, drag: o.drag ?? 2.2, t: 0, life: (o.life ?? 0.8) * rand(0.7, 1.2),
        s0: (o.size ?? 0.12) * 0.4, s1: (o.size ?? 0.12) * rand(0.9, 1.6), a: (o.alpha ?? 0.35) * rand(0.6, 1), fin: 0.15, r: col[0], gc: col[1], b: col[2], floor: o.floor });
    }
  }
  dust(pos, n, o = {}) { this.mist(pos, n, { color: [0.55, 0.45, 0.32], alpha: 0.4, size: 0.2, speed: 0.9, rise: 0.25, life: 1.1, drag: 2.6, ...o }); }
  glow(pos, o = {}) {
    const col = o.color ?? [0.5, 0.85, 1.0];
    this.glows.add({ x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: 0, vz: 0, t: 0, life: o.life ?? 0.25, s0: (o.size ?? 0.5), s1: (o.size ?? 0.5) * (o.grow ?? 1.8), a: o.alpha ?? 0.9, fin: 0.1, r: col[0], gc: col[1], b: col[2] });
  }
  sparkles(pos, n, o = {}) {
    const col = o.color ?? [0.75, 0.95, 1.0];
    for (let i = 0; i < n; i++) {
      _v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar((o.speed ?? 1) * rand(0.3, 1));
      this.glows.add({ x: pos.x + rand(-1, 1) * (o.jitter ?? 0.05), y: pos.y + rand(-1, 1) * (o.jitter ?? 0.05), z: pos.z + rand(-1, 1) * (o.jitter ?? 0.05), vx: _v.x, vy: _v.y + (o.rise ?? 0), vz: _v.z, g: o.g ?? 0, drag: o.drag ?? 2,
        t: 0, life: (o.life ?? 0.6) * rand(0.5, 1), s0: (o.size ?? 0.05), s1: 0.005, a: o.alpha ?? 1, fin: 0.05, r: col[0], gc: col[1], b: col[2] });
    }
  }

  // ---- rings: ripples on the ground, shockwaves, sound waves
  ring(pos, o = {}) {
    let m = this.ringPool.pop();
    if (!m) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
        uniforms: { uCol: { value: new THREE.Color() }, uA: { value: 1 }, uW: { value: 0.1 }, uWob: { value: 0 }, uT: { value: 0 } },
        vertexShader: 'varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `varying vec2 vU; uniform vec3 uCol; uniform float uA, uW, uWob, uT;
          void main(){ float ang = atan(vU.y, vU.x); float r = length(vU) + sin(ang * 7. + uT * 20.) * uWob;
            float d = abs(r - (1. - uW)) / uW; float a = (1. - smoothstep(0.55, 1., d)) * uA;
            a *= 0.75 + 0.25 * sin(ang * 3. + uT * 9.);
            if (a < 0.003) discard; gl_FragColor = vec4(uCol, a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      m = new THREE.Mesh(this.ringGeo, mat); m.frustumCulled = false; m.renderOrder = 4;
    }
    const u = m.material.uniforms;
    u.uCol.value.setRGB(...(o.color ?? [0.85, 0.95, 1.0]));
    m.material.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending;
    m.position.copy(pos);
    if (o.normal) m.quaternion.setFromUnitVectors(new V3(0, 0, 1), o.normal); else { m.rotation.set(-Math.PI / 2, 0, 0); m.position.y = Math.max(pos.y, 0.012 + this.rings.length * 0.0007); }
    this.scene.add(m);
    this.rings.push({ m, t: 0, dur: o.dur ?? 0.6, r0: o.r0 ?? 0.05, r1: o.r1 ?? 0.8, a: o.alpha ?? 0.8, w0: o.w0 ?? 0.35, w1: o.w1 ?? 0.06, vel: o.vel ? o.vel.clone() : null, wob: o.wob ?? 0, squash: o.squash ?? 1 });
    return m;
  }
  /** Splash on the ground: crown of droplets, ripples, a puff of mist. */
  splash(pos, power = 1, o = {}) {
    _v.set(pos.x, Math.max(pos.y, 0.02), pos.z);
    this.droplets(_v, Math.round(14 * power), { speed: 1.6 * Math.sqrt(power), up: 1.1, size: 0.011 + 0.004 * power, spread: 1, jitter: 0.04 * power, splash: false });
    this.mist(_v, Math.round(6 * power), { size: 0.16 * power ** 0.5, speed: 0.7 * power ** 0.5, alpha: 0.3 });
    if (pos.y < 0.12 || o.ground) { _v.y = 0; this.ring(_v, { r0: 0.03, r1: 0.25 + 0.3 * power, dur: 0.5 + 0.2 * power, alpha: 0.55 }); this.ring(_v, { r0: 0.02, r1: 0.14 + 0.2 * power, dur: 0.75, alpha: 0.35 }); }
  }
  /** A hit: white flash, shock ring facing the camera side, sparks. */
  impact(pos, power = 1, dir) {
    this.glow(pos, { size: 0.5 * power, life: 0.14, grow: 2.2, color: [1, 1, 1] });
    this.glow(pos, { size: 0.9 * power, life: 0.3, grow: 1.5, color: [0.6, 0.85, 1.0], alpha: 0.5 });
    this.sparkles(pos, Math.round(14 * power), { speed: 2.6 * power, size: 0.045, life: 0.35, color: [1, 1, 0.9] });
    const n = dir ? dir.clone().normalize() : new V3(0, 0, 1);
    this.ring(pos, { normal: n, r0: 0.05, r1: 0.5 * power, dur: 0.28, alpha: 0.9, w0: 0.5, w1: 0.05, color: [1, 1, 1], add: true });
  }

  // ---- streams of water along a path
  /** path(u, out) gives the centre line for u in 0..1; radius(u) its thickness. Set s.head / s.tail (0..1) to move it. */
  stream(path, radius, o = {}) {
    const segs = o.segs ?? 56, sides = o.sides ?? 10;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((segs + 1) * sides * 3 + 6), nor = new Float32Array((segs + 1) * sides * 3 + 6), uv = new Float32Array((segs + 1) * sides * 2 + 4);
    const idx = [];
    for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      idx.push(a, c, b, b, c, d);
    }
    const capA = (segs + 1) * sides, capB = capA + 1;
    for (let j = 0; j < sides; j++) { idx.push(capA, j, (j + 1) % sides); idx.push(capB, segs * sides + (j + 1) % sides, segs * sides + j); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, o.material ?? this.streamMat(o.foam));
    mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.castShadow = o.shadow ?? true;
    this.scene.add(mesh);
    const s = { mesh, path, radius, segs, sides, head: 0, tail: 0, alive: true, spray: o.spray ?? 0, twist: o.twist ?? 0, time: 0 };
    this.streams.push(s);
    return s;
  }
  updateStream(s, dt) {
    s.time += dt;
    const { segs, sides } = s, pos = s.mesh.geometry.attributes.position.array, nor = s.mesh.geometry.attributes.normal.array;
    const a = Math.min(s.tail, s.head), b = Math.max(s.head, a + 1e-4);
    s.mesh.visible = s.head - s.tail > 0.004;
    if (!s.mesh.visible) return;
    const P = _sp, T = _st, Nn = _sn, Bn = _sb;
    let prevT = null;
    for (let i = 0; i <= segs; i++) {
      const k = i / segs, u = a + (b - a) * k;
      s.path(u, P); s.path(Math.min(1, u + 0.004), _v); s.path(Math.max(0, u - 0.004), _v2);
      T.copy(_v).sub(_v2).normalize();
      if (!prevT) { Nn.set(0, 1, 0); if (Math.abs(T.y) > 0.9) Nn.set(1, 0, 0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); } else { Nn.addScaledVector(T, -Nn.dot(T)).normalize(); }
      Bn.crossVectors(T, Nn);
      prevT = T;
      // rounded ends
      const endK = Math.min(1, Math.min(k / 0.06, (1 - k) / 0.10));
      const r = s.radius(u, k) * Math.sqrt(Math.max(0, endK * (2 - endK)));
      for (let j = 0; j < sides; j++) {
        const an = (j / sides) * Math.PI * 2 + s.twist * u * 6.28 + s.time * 0;
        const wob = 1 + 0.10 * Math.sin(u * 60 - s.time * 14 + j * 2.1) + 0.06 * Math.sin(u * 23 + s.time * 9 + j);
        const cx = Math.cos(an), sy = Math.sin(an), o = (i * sides + j) * 3;
        const nx = Nn.x * cx + Bn.x * sy, ny = Nn.y * cx + Bn.y * sy, nz = Nn.z * cx + Bn.z * sy;
        pos[o] = P.x + nx * r * wob; pos[o + 1] = P.y + ny * r * wob; pos[o + 2] = P.z + nz * r * wob;
        nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz;
      }
      if (i === 0) { const o = (segs + 1) * sides * 3; pos[o] = P.x - T.x * r * 0.5; pos[o + 1] = P.y - T.y * r * 0.5; pos[o + 2] = P.z - T.z * r * 0.5; nor[o] = -T.x; nor[o + 1] = -T.y; nor[o + 2] = -T.z; }
      if (i === segs) { const o = ((segs + 1) * sides + 1) * 3; pos[o] = P.x + T.x * r * 0.9; pos[o + 1] = P.y + T.y * r * 0.9; pos[o + 2] = P.z + T.z * r * 0.9; nor[o] = T.x; nor[o + 1] = T.y; nor[o + 2] = T.z;
        s.headPos = s.headPos || new V3(); s.headPos.copy(P); s.headDir = s.headDir || new V3(); s.headDir.copy(T); }
    }
    s.mesh.geometry.attributes.position.needsUpdate = true; s.mesh.geometry.attributes.normal.needsUpdate = true;
    // spray flying off the moving water
    if (s.spray > 0 && s.headPos) {
      const n = s.spray * dt * 60;
      for (let i = 0; i < n; i++) if (Math.random() < n - i) {
        const u = a + (b - a) * Math.random(); s.path(u, _v);
        const rr = s.radius(u, 0.5);
        _v.x += rand(-1, 1) * rr; _v.y += rand(-1, 1) * rr; _v.z += rand(-1, 1) * rr;
        if (Math.random() < 0.6) this.droplets(_v, 1, { speed: 0.6, up: 0.3, size: 0.009, life: 0.7 }); else this.mist(_v, 1, { size: rr * 2.2, speed: 0.25, alpha: 0.22, life: 0.5 });
      }
    }
  }
  killStream(s) { s.alive = false; this.scene.remove(s.mesh); s.mesh.geometry.dispose(); }

  // ---- a water dart
  dart(from, to, dur, o = {}) {
    const mesh = new THREE.Mesh(this.dartGeo, this.dropMat2 || (this.dropMat2 = makeWaterMaterial(this.shared, { glow: 0.45, wobble: 0.0 })));
    const sc = o.size ?? 1; mesh.scale.setScalar(sc); mesh.frustumCulled = false; mesh.castShadow = true;
    this.scene.add(mesh);
    const a = from.clone(), b = to.clone(), arc = o.arc ?? 0.03;
    const prev = a.clone();
    this.run(dur, (k, dt) => {
      mesh.position.lerpVectors(a, b, k); mesh.position.y += Math.sin(Math.PI * k) * arc;
      _v.copy(mesh.position).sub(prev);
      if (_v.lengthSq() > 1e-9) { mesh.quaternion.setFromUnitVectors(UP, _v.normalize()); }
      mesh.rotateY(k * 25);
      prev.copy(mesh.position);
      this.mist(mesh.position, 1, { size: 0.05 * sc, speed: 0.05, alpha: 0.28, life: 0.3, jitter: 0.004 });
      if (Math.random() < 0.6) this.droplets(mesh.position, 1, { speed: 0.3, up: 0.1, size: 0.005 * sc, life: 0.4, splash: false });
    }, () => { this.scene.remove(mesh); if (o.onHit) o.onHit(b); });
    return mesh;
  }

  // ---- generic temporary object helper
  addObject(obj, dur, tick, done) {
    this.scene.add(obj);
    this.run(dur, (k, dt) => tick && tick(k, dt, obj), () => { this.scene.remove(obj); if (done) done(); });
    return obj;
  }

  update(dt, camera) {
    // timed tasks
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const t = this.tasks[i]; t.t += dt;
      const k = Math.min(1, t.t / Math.max(1e-6, t.dur));
      if (t.fn) t.fn(k, dt);
      if (t.t >= t.dur) { this.tasks.splice(i, 1); if (t.done) t.done(); }
    }
    // droplets
    const D = this.drops; let n = 0;
    for (let i = 0; i < D.length; i++) {
      const p = D[i]; p.t += dt;
      if (p.t > p.life) continue;
      p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.008) {
        if (p.splash && Math.random() < (p.rain ? 0.35 : 0.5)) { _v.set(p.x, 0, p.z); this.ring(_v, { r0: 0.01, r1: p.rain ? 0.06 : 0.09, dur: 0.4, alpha: 0.4 }); if (p.rain && Math.random() < 0.5) this.mist(_v, 1, { size: 0.05, alpha: 0.2, speed: 0.2, life: 0.3 }); }
        continue;
      }
      const sp = Math.hypot(p.vx, p.vy, p.vz);
      _v.set(p.vx, p.vy, p.vz).multiplyScalar(1 / Math.max(sp, 1e-5));
      _q.setFromUnitVectors(UP, _v);
      const fade = Math.min(1, (p.life - p.t) / 0.15);
      const st = 1 + Math.min(3.5, sp * 0.28 * p.stretch);
      _s.set(p.s * fade / Math.sqrt(st) * 1.15, p.s * fade * st, p.s * fade / Math.sqrt(st) * 1.15);
      _v2.set(p.x, p.y, p.z);
      this.dropMesh.setMatrixAt(n, _m.compose(_v2, _q, _s));
      D[n++] = p;
    }
    D.length = n; this.dropMesh.count = n; this.dropMesh.instanceMatrix.needsUpdate = true;
    this.puffs.update(dt); this.glows.update(dt);
    // rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.t += dt; const k = Math.min(1, r.t / r.dur), e = 1 - (1 - k) * (1 - k);
      const rad = r.r0 + (r.r1 - r.r0) * e;
      r.m.scale.set(rad, rad * r.squash, rad);
      if (r.vel) r.m.position.addScaledVector(r.vel, dt);
      const u = r.m.material.uniforms; u.uA.value = r.a * (1 - k) * Math.min(1, k * 12); u.uW.value = r.w0 + (r.w1 - r.w0) * e; u.uWob.value = r.wob; u.uT.value = r.t;
      if (r.t >= r.dur) { this.scene.remove(r.m); this.ringPool.push(r.m); this.rings.splice(i, 1); }
    }
    for (let i = this.streams.length - 1; i >= 0; i--) { const s = this.streams[i]; if (!s.alive) { this.streams.splice(i, 1); continue; } this.updateStream(s, dt); }
  }
  clear() {
    for (const s of this.streams) this.killStream(s);
    this.tasks.length = 0;
  }
}

const _sp = new V3(), _st = new V3(), _sn = new V3(), _sb = new V3();

function dartGeometry() {
  // a slim teardrop pointing along +Y
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; const r = 0.016 * Math.sin(Math.PI * Math.pow(t, 0.55)) * (1 - t * 0.25); pts.push(new THREE.Vector2(Math.max(r, 0.0001), (t - 0.5) * 0.15)); }
  const g = new THREE.LatheGeometry(pts, 10); g.computeVertexNormals(); return g;
}

/** A soft billboard sprite (clouds, big glows). */
export function makeSprite(color, opacity = 1, additive = false) {
  if (!makeSprite.tex) makeSprite.tex = softTexture('soft');
  const m = new THREE.SpriteMaterial({ map: makeSprite.tex, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: true });
  return new THREE.Sprite(m);
}
