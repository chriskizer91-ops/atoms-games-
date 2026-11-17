import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { FISH_KINDS, FISHING, fishHere, fishSize, fishKg, newFishing, cast, reelIn, stepFishing } from './fishing.js';
import { waveHeight } from './ocean.js';
import { clamp, damp, lerp } from './util.js';

// The fishing rod in the world: the float on the water, the line from the
// rod's tip to it, and the fish coming in. The rules are in fishing.js.

const LINE_PTS = 14;

// The rod as held: grip along +Y through the origin, tip up the same way.
export function makeRod(mats) {
  const g = new THREE.Group();
  const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.016, 2.0, 7).translate(0, 0.86, 0), mats.cane);
  g.add(cane);
  for (const y of [0.25, 0.62, 0.98, 1.34]) {
    const node = new THREE.Mesh(new THREE.TorusGeometry(0.013 - y * 0.004, 0.003, 5, 10).rotateX(Math.PI / 2), mats.cane);
    node.position.y = y;
    g.add(node);
  }
  for (let k = 0; k < 5; k++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.0175, 0.0045, 5, 12).rotateX(Math.PI / 2), mats.rope);
    wrap.position.y = -0.06 + k * 0.03;
    g.add(wrap);
  }
  g.userData.tip = new THREE.Vector3(0, 1.86, 0);
  return g;
}

export function createRod(scene, { fx, audio }) {
  const s = newFishing();
  const float = new THREE.Group();
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8402c, roughness: 0.4 }));
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4 }));
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 5).translate(0, 0.09, 0), top.material);
  float.add(top, bottom, stick);
  float.scale.setScalar(2.2);
  float.visible = false;
  scene.add(float);

  const lineGeo = new LineGeometry();
  lineGeo.setPositions(new Float32Array(LINE_PTS * 3));
  const lineMat = new LineMaterial({ color: 0xe8e2d0, linewidth: 1.4, transparent: true, opacity: 0.85 });
  const line = new Line2(lineGeo, lineMat);
  line.frustumCulled = false;
  line.visible = false;
  scene.add(line);
  const pts = new Float32Array(LINE_PTS * 3);

  // The fish as it comes out of the water.
  const fish = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8).scale(0.07, 0.11, 0.3), new THREE.MeshStandardMaterial({ color: 0x9fb6c4, roughness: 0.3, metalness: 0.2 }));
  fish.visible = false;
  scene.add(fish);

  const st = { fly: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), pos: new THREE.Vector3(), dip: 0, landed: false, place: null, show: 0, showFrom: new THREE.Vector3() };
  const tmp = new THREE.Vector3();
  const out = { event: null, kind: null, kg: 0, phase: 'idle', tension: 0, progress: 0, running: false };

  function stop() {
    reelIn(s);
    float.visible = false;
    line.visible = false;
  }

  return {
    state: s,
    get out() { return s.phase !== 'idle' || st.fly > 0; },
    resize(w, h) { lineMat.resolution.set(w, h); },
    stop,

    // Throw the float out along `dir` from `from`. ok(x, z): is that open water? place: { land, night, eager }.
    cast(from, dir, ok, place) {
      const d = Math.hypot(dir.x, dir.z) || 1;
      let reach = FISHING.castDistance;
      // Shorten the cast until it lands in the water.
      for (; reach > 2.5; reach -= 1) {
        if (ok(from.x + (dir.x / d) * reach, from.z + (dir.z / d) * reach)) break;
      }
      if (reach <= 2.5) return false;
      st.from.copy(from);
      st.to.set(from.x + (dir.x / d) * reach, 0, from.z + (dir.z / d) * reach);
      st.fly = 0.0001;
      st.landed = false;
      st.place = place;
      float.visible = true;
      line.visible = true;
      audio.whoosh?.();
      return true;
    },

    // tip: the rod's tip in the world. strike: clicked this frame. reel: holding. Returns what happened and what to show.
    update(t, dt, tip, strike, reel, cancel) {
      out.event = null;
      if (cancel && (s.phase !== 'idle' || st.fly > 0)) { stop(); st.fly = 0; out.event = 'reeled'; }
      if (st.fly > 0 && !st.landed) {
        // The float in the air.
        st.fly += dt / 0.7;
        const k = Math.min(1, st.fly);
        st.pos.lerpVectors(st.from, st.to, k);
        st.pos.y = lerp(st.from.y, waveHeight(st.to.x, st.to.z, t), k) + Math.sin(k * Math.PI) * 2.2;
        if (k >= 1) {
          st.landed = true;
          st.fly = 0;
          fx.splash(tmp.set(st.to.x, waveHeight(st.to.x, st.to.z, t) + 0.05, st.to.z), 0.35);
          audio.splash?.(0, false);
          cast(s, fishHere(st.place, Math.random()), fishSize(Math.random()), st.place.eager, Math.random);
        }
      } else if (s.phase !== 'idle') {
        const ev = stepFishing(s, dt, strike, reel, Math.random);
        out.event = ev;
        const sea = waveHeight(st.to.x, st.to.z, t);
        if (ev === 'bite') { fx.splash(tmp.set(st.to.x, sea + 0.05, st.to.z), 0.5); audio.splash?.(0, false); }
        if (ev === 'run') fx.splash(tmp.set(st.pos.x, sea + 0.05, st.pos.z), 0.45);
        // The float: bobbing while it waits, pulled under on a bite, dragged about by a hooked fish.
        st.dip = damp(st.dip, s.phase === 'bite' ? 0.16 : s.phase === 'reeling' ? 0.1 : 0, 12, dt);
        if (s.phase === 'reeling') {
          // It comes in toward you as you win line, and darts sideways when it runs.
          const k = clamp(s.progress, 0, 1);
          tmp.set(lerp(st.to.x, tip.x, k * 0.85), 0, lerp(st.to.z, tip.z, k * 0.85));
          const side = Math.sin(t * (s.running ? 5.5 : 1.6)) * (s.running ? 1.3 : 0.4) * (1 - k);
          const dx = st.to.z - tip.z, dz = -(st.to.x - tip.x), l = Math.hypot(dx, dz) || 1;
          st.pos.x = damp(st.pos.x, tmp.x + (dx / l) * side, 6, dt);
          st.pos.z = damp(st.pos.z, tmp.z + (dz / l) * side, 6, dt);
        } else {
          st.pos.x = st.to.x;
          st.pos.z = st.to.z;
        }
        st.pos.y = waveHeight(st.pos.x, st.pos.z, t) + 0.03 - st.dip + Math.sin(t * 2.3) * 0.012;
        if (ev === 'caught') {
          out.kind = s.kind;
          out.kg = fishKg(s.kind, s.size);
          // The fish swings up out of the water to your hand.
          st.show = 0.0001;
          st.showFrom.copy(st.pos);
          fish.material.color.setHex(FISH_KINDS[s.kind].color);
          fish.scale.setScalar(clamp(0.7 + 0.55 * Math.cbrt(out.kg), 0.8, 2.4));
          fx.splash(tmp.copy(st.pos).setY(st.pos.y + 0.1), 0.9);
          float.visible = false;
          line.visible = false;
        }
        if (ev === 'snapped') { float.visible = false; line.visible = false; }
      }
      if (st.show > 0) {
        st.show += dt / 0.6;
        const k = Math.min(1, st.show);
        fish.visible = k < 1;
        fish.position.lerpVectors(st.showFrom, tip, k);
        fish.position.y += Math.sin(k * Math.PI) * 1.2;
        fish.rotation.set(Math.sin(t * 30) * 0.5, t * 6, 0);
        if (k >= 1) st.show = 0;
      }
      float.position.copy(st.pos);
      float.rotation.z = Math.sin(t * 1.7) * 0.15 + (s.phase === 'reeling' && s.running ? 0.5 : 0);
      if (line.visible) {
        // The line sags between tip and float; taut when the fish runs.
        const sag = s.phase === 'reeling' ? (s.running ? 0.05 : 0.25) : st.landed ? 0.7 : 0.2;
        for (let i = 0; i < LINE_PTS; i++) {
          const u = i / (LINE_PTS - 1);
          pts[i * 3] = lerp(tip.x, st.pos.x, u);
          pts[i * 3 + 1] = lerp(tip.y, st.pos.y + 0.12, u) - Math.sin(u * Math.PI) * sag;
          pts[i * 3 + 2] = lerp(tip.z, st.pos.z, u);
        }
        lineGeo.setPositions(pts);
      }
      out.phase = st.fly > 0 ? 'cast' : s.phase;
      out.tension = s.tension;
      out.progress = s.progress;
      out.running = s.running;
      return out;
    },
  };
}
