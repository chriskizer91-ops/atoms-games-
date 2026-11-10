// fx.js: particles for the world and battles: soft glows, stars, leaves, bubbles, embers, sparkles, spores, rings and Zs,
// drawn as points from one atlas. FX.make(scene) -> { emit(o), burst(type, pos, n, o), update(dt), clear() }
const FX = (() => {
  // the atlas: eight 32 px shapes in a row
  const SH = { glow: 0, star: 1, leaf: 2, bubble: 3, ember: 4, sparkle: 5, z: 6, dust: 7 };
  const atlas = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d');
    const cell = (i, fn) => { g.save(); g.translate(i * 32 + 16, 16); fn(); g.restore(); };
    cell(0, () => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-16, -16, 32, 32); });
    cell(1, () => { g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 5.5 : 14; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); });
    cell(2, () => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 13, 6, .6, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-9, -6); g.lineTo(9, 6); g.stroke(); });
    cell(3, () => { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -4, 3, 0, Math.PI * 2); g.fill(); });
    cell(4, () => { const gr = g.createRadialGradient(0, 3, 0, 0, 3, 13); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -15); g.quadraticCurveTo(13, 6, 0, 15); g.quadraticCurveTo(-13, 6, 0, -15); g.fill(); });
    cell(5, () => { g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, r = k % 2 ? 3 : 15; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); });
    cell(6, () => { g.fillStyle = '#fff'; g.font = 'bold 26px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Z', 0, 1); });
    cell(7, () => { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill(); });
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
  })();
  const VS = 'attribute float size; attribute float shape; attribute float alpha; attribute float rot; varying vec3 vC; varying float vS; varying float vA; varying float vR; uniform float uScale;\n' +
    'void main() { vC = color; vS = shape; vA = alpha; vR = rot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uScale / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }';
  const FS = 'uniform sampler2D uMap; varying vec3 vC; varying float vS; varying float vA; varying float vR;\n' +
    'void main() { vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + 0.5; if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) discard;\n' +
    ' vec4 t = texture2D(uMap, vec2((vS + p.x) / 8.0, 1.0 - p.y)); if (t.a * vA < 0.02) discard; gl_FragColor = vec4(vC * t.rgb, t.a * vA); }';
  function make(scene, n) {
    n = n || 600;
    const mk = (additive) => {
      const geo = new THREE.BufferGeometry(), A = (k) => new THREE.BufferAttribute(new Float32Array(n * k), k);
      const pos = A(3), col = A(3), size = A(1), shape = A(1), alpha = A(1), rot = A(1);
      geo.setAttribute('position', pos); geo.setAttribute('color', col); geo.setAttribute('size', size); geo.setAttribute('shape', shape); geo.setAttribute('alpha', alpha); geo.setAttribute('rot', rot);
      const mat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: atlas }, uScale: { value: 400 } }, vertexShader: VS, fragmentShader: FS, vertexColors: true, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = additive ? 20 : 19; scene.add(pts);
      return { pts, geo, mat, pos, col, size, shape, alpha, rot, list: [], next: 0 };
    };
    const sets = [mk(false), mk(true)];
    for (const s of sets) for (let i = 0; i < n; i++) s.list.push({ life: 0 });
    const _c = new THREE.Color();
    function emit(o) {
      const s = sets[o.add ? 1 : 0], p = s.list[s.next]; s.next = (s.next + 1) % n;
      Object.assign(p, { x: o.x, y: o.y, z: o.z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, g: o.g || 0, drag: o.drag || 0, life: o.life || 1, max: o.life || 1, size: o.size || 4, grow: o.grow || 0, shape: SH[o.shape || 'glow'] || 0, rot: o.rot || Math.random() * 6, spin: o.spin || 0, fade: o.fade !== false, a: o.a === undefined ? 1 : o.a });
      _c.set(o.color || '#ffffff'); p.r = _c.r; p.gg = _c.g; p.b = _c.b;
      return p;
    }
    // a burst of one kind at a point: n particles flying out
    function burst(kind, at, cnt, o) {
      o = o || {}; const sp = o.speed || 30, cols = o.colors || ['#ffffff'];
      for (let i = 0; i < cnt; i++) {
        const a = Math.random() * Math.PI * 2, e = (o.up === undefined ? .4 : o.up) + Math.random() * .6, v = sp * (.5 + Math.random() * .5);
        emit({ x: at.x + (Math.random() - .5) * (o.spread || 0), y: at.y + (Math.random() - .5) * (o.spread || 0) * .5, z: at.z + (Math.random() - .5) * (o.spread || 0), vx: Math.cos(a) * v * (1 - e * .5), vy: e * v, vz: Math.sin(a) * v * (1 - e * .5), g: o.g === undefined ? 40 : o.g, drag: o.drag || 1, life: (o.life || .7) * (.7 + Math.random() * .6), size: (o.size || 5) * (.7 + Math.random() * .6), grow: o.grow || 0, shape: kind, color: G.pick(cols), add: !!o.add, spin: (Math.random() - .5) * (o.spin || 4) });
      }
    }
    function update(dt, scale) {
      for (const s of sets) {
        s.mat.uniforms.uScale.value = scale || 400;
        for (let i = 0; i < n; i++) {
          const p = s.list[i];
          if (p.life > 0) {
            p.life -= dt; p.vy -= p.g * dt; const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vz *= d;
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.spin * dt; p.size += p.grow * dt;
            const k = p.life / p.max;
            s.pos.setXYZ(i, p.x, p.y, p.z); s.col.setXYZ(i, p.r, p.gg, p.b); s.size.setX(i, Math.max(0, p.size)); s.shape.setX(i, p.shape); s.alpha.setX(i, p.a * (p.fade ? Math.min(1, k * 2.5) : 1)); s.rot.setX(i, p.rot);
          } else s.alpha.setX(i, 0);
        }
        for (const k of ['position', 'color', 'size', 'shape', 'alpha', 'rot']) s.geo.attributes[k].needsUpdate = true;
      }
    }
    function clear() { for (const s of sets) for (const p of s.list) p.life = 0; }
    return { emit, burst, update, clear };
  }
  return { make };
})();
