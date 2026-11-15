import * as THREE from 'three';
import { DAY, WEATHER } from './config.js';
import { SKY } from './sky.js';
import { setSwell } from './ocean.js';
import { clamp, damp, rand, smoothstep, weightedPick } from './util.js';
import { FRAME, dirToScene, frameYaw } from './frame.js';
import { windAt, wrap } from './sailing.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

// Clock and weather. Every frame this rewrites the shared SKY state, the sun
// light, the fog and the swell, and reports how hot, cold and wet it is.

const C = (hex) => new THREE.Color(hex);
const PAL = {
  zenithDay: C(0x2f73c4), zenithNight: C(0x070d1c), zenithStorm: C(0x56616b),
  horizonDay: C(0xbcd6e2), horizonNight: C(0x101b2c), horizonStorm: C(0x7d8a92),
  groundDay: C(0x0d3a4c), groundNight: C(0x03111a),
  sunNoon: C(0xffe2b8), sunLow: C(0xff8442), moon: C(0x8aa0d8),
  sunset: new THREE.Color(0.5, 0.24, 0.1),
};

const RAIN_DROPS = 1400;
const RAIN_BOX = { x: 26, y: 14, z: 26 };

export function createWeather({ scene, sun, hemi, ocean, fx, audio, sky, onEnvironment }) {
  const st = {
    hour: DAY.start,
    day: 1,
    kind: 'clear',
    timer: rand(...WEATHER.kinds.clear.dur),
    cover: 0, rain: 0, storm: 0, swell: 1, fog: WEATHER.kinds.clear.fog,
    flash: 0, flashT: 0, nextFlash: 8, thunderIn: -1,
    envTimer: 0,
  };

  // Rain: short falling streaks in a box that follows the camera.
  const pos = new Float32Array(RAIN_DROPS * 6);
  const drops = [];
  for (let i = 0; i < RAIN_DROPS; i++) {
    drops.push({ x: rand(-1, 1) * RAIN_BOX.x / 2, y: rand(0, RAIN_BOX.y), z: rand(-1, 1) * RAIN_BOX.z / 2, v: rand(11, 15) });
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xb4c4d0, transparent: true, opacity: 0, depthWrite: false });
  const rainMesh = new THREE.LineSegments(rainGeo, rainMat);
  rainMesh.frustumCulled = false;
  rainMesh.visible = false;
  // Everything the weather draws in the air: the rain and the lightning.
  const air = new THREE.Group();
  air.add(rainMesh);
  scene.add(air);

  // Forked lightning: a jagged main stroke from the cloud to the sea and a
  // branch off it, drawn as fat bright lines for the fraction of a second a
  // flash lasts.
  const BOLT_MAIN = 18, BOLT_BRANCH = 9;
  const boltMat = new LineMaterial({ color: 0xffffff, linewidth: 3.4, transparent: true, depthWrite: false, fog: false });
  boltMat.color.setRGB(7, 8, 12);
  const mkBolt = (n) => {
    const g = new LineGeometry();
    g.setPositions(new Float32Array(n * 3));
    const l = new Line2(g, boltMat);
    l.frustumCulled = false;
    l.visible = false;
    air.add(l);
    return l;
  };
  const bolts = [mkBolt(BOLT_MAIN), mkBolt(BOLT_BRANCH)];
  const boltPts = [new Float32Array(BOLT_MAIN * 3), new Float32Array(BOLT_BRANCH * 3)];
  function strike(camPos, camera) {
    // Somewhere ahead of where you're looking, a few hundred metres off.
    let yaw = rand(0, Math.PI * 2);
    if (camera) {
      camera.getWorldDirection(tmpV);
      yaw = Math.atan2(tmpV.x, tmpV.z) + rand(-1.0, 1.0);
    }
    const dist = rand(190, 430);
    const x0 = camPos.x + Math.sin(yaw) * dist, z0 = camPos.z + Math.cos(yaw) * dist;
    const top = rand(210, 280);
    const lean = { x: rand(-40, 40), z: rand(-40, 40) };
    const main = boltPts[0];
    let fork = 6;
    for (let i = 0; i < BOLT_MAIN; i++) {
      const u = i / (BOLT_MAIN - 1);
      const j = i === 0 || i === BOLT_MAIN - 1 ? 0 : 16 * (1 - u * 0.5);
      main[i * 3] = x0 + lean.x * u + rand(-j, j);
      main[i * 3 + 1] = top * (1 - u);
      main[i * 3 + 2] = z0 + lean.z * u + rand(-j, j);
    }
    fork = 4 + Math.floor(rand(0, 6));
    const br = boltPts[1];
    const out = { x: rand(-1, 1) * 70, z: rand(-1, 1) * 70 };
    for (let i = 0; i < BOLT_BRANCH; i++) {
      const u = i / (BOLT_BRANCH - 1);
      br[i * 3] = main[fork * 3] + out.x * u + rand(-7, 7) * u;
      br[i * 3 + 1] = main[fork * 3 + 1] * (1 - u * 0.55);
      br[i * 3 + 2] = main[fork * 3 + 2] + out.z * u + rand(-7, 7) * u;
    }
    // which way the stroke lies on the chart, for the sky
    const sx = x0 - camPos.x, sz = z0 - camPos.z;
    SKY.flashDir.set(sx * FRAME.c + sz * FRAME.s, top * 0.45, -sx * FRAME.s + sz * FRAME.c).normalize();
    bolts[0].geometry.setPositions(main);
    bolts[1].geometry.setPositions(br);
    return dist;
  }
  const tmpV = new THREE.Vector3();

  function nextKind() {
    const table = {};
    for (const k in WEATHER.kinds) {
      let w = WEATHER.kinds[k].weight;
      if (k === 'storm' && st.day < 2) w = 0;
      if (k === st.kind) w *= 0.4;
      if (st.kind === 'storm' && k === 'clear') w = 0; // storms ease off through rain or cloud
      table[k] = { weight: w };
    }
    return weightedPick(table);
  }

  function sunAngle(h) {
    // Daylight runs 6:00-20:00 over the top of the sky; the night half goes under.
    if (h >= 6 && h < 20) return Math.PI * (h - 6) / 14;
    const n = ((h - 20 + 24) % 24) / 10;
    return Math.PI * (1 + n);
  }

  const tmpC = new THREE.Color();
  // wind: where it blows from on the chart and how hard (m/s); windScene: the
  // direction it blows toward in the scene, for rain, spray and the sail.
  const wind = { from: 0, speed: 6, gust: 0 };
  const info = { day: 1, hour: 8, kind: 'clear', daylight: 1, night: 0, rain: 0, storm: 0, heat: 0, cold: 0, wet: 0, wind, windX: 0, windZ: 0 };
  const tmpD = { x: 0, z: 0 };
  let lastYaw = 0, lastSunY = -9, lastCover = -9;
  let wetMem = 0;         // how recently it rained, for the rainbow
  let meteorIn = 30, meteorT = -1;

  const api = {
    mesh: air,
    // Lightning is drawn in screen pixels: it needs to know the screen's size.
    setViewport(w, h) { boltMat.resolution.set(w, h); },
    envInterval: 2.5, // seconds between sky-lighting refreshes
    get state() { return st; },
    get wind() { return wind; },

    setTime(hour) { st.hour = hour; st.envTimer = 0; st.envAge = 1e9; },
    setWeather(kind, instant = false) {
      st.kind = kind;
      st.timer = rand(...WEATHER.kinds[kind].dur);
      if (instant) {
        const k = WEATHER.kinds[kind];
        Object.assign(st, { cover: k.cover, rain: k.rain, storm: k.storm, swell: k.swell, fog: k.fog });
      }
      st.envTimer = 0; st.envAge = 1e9;
    },

    reset() {
      Object.assign(st, { hour: DAY.start, day: 1, kind: 'clear', timer: 300, flash: 0, envTimer: 0 });
      api.setWeather('clear', true);
      st.timer = 300; // the first morning stays fair
    },

    serialize() {
      const { hour, day, kind, timer, cover, rain, storm, swell, fog } = st;
      return { hour, day, kind, timer, cover, rain, storm, swell, fog };
    },
    restore(d) {
      if (!d) return;
      Object.assign(st, d);
      st.envTimer = 0; st.envAge = 1e9;
    },

    // camera (optional): so lightning strikes where you're looking.
    update(dt, time, camPos, live, camera = null) {
      // ---- clock ----
      if (live) {
        const perHour = st.hour >= 6 && st.hour < 20 ? DAY.hourDay : DAY.hourNight;
        st.hour += dt / perHour;
        if (st.hour >= 24) { st.hour -= 24; st.day++; }
        st.timer -= dt;
        if (st.timer <= 0) api.setWeather(nextKind());
      }

      // ---- weather blend ----
      const k = WEATHER.kinds[st.kind];
      const rate = 0.08;
      st.cover = damp(st.cover, k.cover, rate, dt);
      st.rain = damp(st.rain, k.rain, rate, dt);
      st.storm = damp(st.storm, k.storm, rate, dt);
      st.swell = damp(st.swell, k.swell, rate * 0.6, dt);
      st.fog = damp(st.fog, k.fog, rate, dt);

      // ---- sun and moon ----
      const a = sunAngle(st.hour);
      SKY.trueSun.set(Math.cos(a), Math.sin(a) * 0.95, -0.45).normalize();
      SKY.moonDir.set(-Math.cos(a), -Math.sin(a) * 0.95, 0.4).normalize();
      const sy = SKY.trueSun.y;
      const daylight = smoothstep(-0.08, 0.15, sy);
      const night = 1 - smoothstep(-0.14, 0.04, sy);
      const sunset = (1 - smoothstep(0.02, 0.42, sy)) * smoothstep(-0.2, -0.02, sy);
      SKY.night = night;
      SKY.cover = st.cover;
      SKY.storm = st.storm;
      SKY.sunset = sunset * (1 - 0.8 * st.storm) * (1 - 0.45 * st.cover);
      // A rainbow for a minute or two after rain, once the cloud breaks and while the sun is not too high.
      wetMem = Math.max(wetMem - dt / 110, Math.min(1, st.rain * 1.6));
      SKY.rainbow = wetMem * (1 - smoothstep(0.4, 0.8, st.cover)) * daylight * (1 - smoothstep(0.6, 0.8, sy)) * (1 - st.storm);
      // Shooting stars on clear nights.
      if (meteorT >= 0) {
        meteorT += dt / 0.9;
        if (meteorT >= 1) meteorT = -1;
      } else if (live && night > 0.7 && st.cover < 0.5) {
        meteorIn -= dt;
        if (meteorIn <= 0) {
          meteorIn = rand(18, 60);
          meteorT = 0;
          const a0 = rand(0, Math.PI * 2), e0 = rand(0.35, 1.0);
          SKY.meteorA.set(Math.cos(a0) * Math.cos(e0), Math.sin(e0), Math.sin(a0) * Math.cos(e0));
          const a1 = a0 + rand(-0.5, 0.5), e1 = e0 - rand(0.12, 0.3);
          SKY.meteorB.set(Math.cos(a1) * Math.cos(e1), Math.sin(e1), Math.sin(a1) * Math.cos(e1));
        }
      }
      SKY.meteorT = meteorT;

      // The sky keeps chart directions (its dome turns with the chart); the
      // light itself is wanted in the raft's frame.
      const lightFrom = (v) => {
        dirToScene(v.x, v.z, tmpD);
        SKY.sunDir.set(tmpD.x, v.y, tmpD.z);
      };
      if (sy > 0.02) {
        lightFrom(SKY.trueSun);
        if (SKY.sunDir.y < 0.08) { SKY.sunDir.y = 0.08; SKY.sunDir.normalize(); }
        SKY.sunColor.copy(PAL.sunLow).lerp(PAL.sunNoon, smoothstep(0.05, 0.45, sy));
      } else {
        lightFrom(SKY.moonDir);
        if (SKY.sunDir.y < 0.1) { SKY.sunDir.y = 0.1; SKY.sunDir.normalize(); }
        SKY.sunColor.copy(PAL.moon).multiplyScalar(0.55);
      }

      // Where the bright disc really is in the scene (the light above is kept
      // off the horizon), and how strongly its shafts of light show.
      if (sy > -0.06) {
        dirToScene(SKY.trueSun.x, SKY.trueSun.z, tmpD);
        SKY.discDir.set(tmpD.x, SKY.trueSun.y, tmpD.z);
        SKY.rays = smoothstep(-0.06, 0.03, sy) * (0.3 + 0.7 * (1 - smoothstep(0.1, 0.55, sy))) * (1 - 0.75 * st.cover) * (1 - st.storm);
      } else {
        dirToScene(SKY.moonDir.x, SKY.moonDir.z, tmpD);
        SKY.discDir.set(tmpD.x, SKY.moonDir.y, tmpD.z);
        SKY.rays = 0.3 * night * (1 - st.cover) * smoothstep(0.0, 0.15, SKY.moonDir.y);
      }

      SKY.zenith.copy(PAL.zenithNight).lerp(PAL.zenithDay, daylight);
      SKY.zenith.lerp(tmpC.copy(PAL.zenithStorm).multiplyScalar(0.25 + 0.75 * daylight), st.storm * 0.85);
      SKY.horizon.copy(PAL.horizonNight).lerp(PAL.horizonDay, daylight);
      SKY.horizon.r += PAL.sunset.r * sunset; SKY.horizon.g += PAL.sunset.g * sunset; SKY.horizon.b += PAL.sunset.b * sunset;
      SKY.horizon.lerp(tmpC.copy(PAL.horizonStorm).multiplyScalar(0.22 + 0.78 * daylight), Math.max(st.storm, st.rain * 0.6) * 0.85);
      SKY.ground.copy(PAL.groundNight).lerp(PAL.groundDay, daylight);

      const dim = 1 - 0.65 * st.cover;
      sun.color.copy(SKY.sunColor);
      sun.intensity = sy > 0.02 ? 3.2 * smoothstep(0.0, 0.18, sy) * dim : 1.3 * night * (1 - 0.6 * st.cover);
      hemi.intensity = 0.35 * (0.45 + 0.55 * daylight) * (1 - 0.25 * st.storm);
      hemi.color.copy(SKY.horizon).lerp(PAL.horizonDay, 0.5);

      scene.fog.color.copy(SKY.horizon);
      scene.fog.density = st.fog + night * 0.002;
      ocean.uniforms.uFogDensity.value = scene.fog.density;
      ocean.uniforms.uGlow.value = night;
      ocean.uniforms.uDay.value = daylight * (1 - 0.45 * st.cover);
      // The long ocean swell grows with the weather; so does the wind.
      setSwell(st.swell, 0.62 + (st.swell - 1) * 2.1);
      windAt(time, clamp(0.12 * st.cover + 0.3 * st.rain + 0.58 * st.storm, 0, 1), wind);
      dirToScene(-Math.cos(wind.from), -Math.sin(wind.from), tmpD);
      info.windX = tmpD.x;
      info.windZ = tmpD.z;
      ocean.setWeather(wind.speed, st.rain);
      // Scattered cloud throws clear-edged shadows on the sea; overcast is one flat shade (already dimmed).
      ocean.setSky(SKY.sunset, 0.42 * daylight * (1 - smoothstep(0.35, 0.8, st.cover)));
      fx.setGlow(night);

      // ---- lightning ----
      if (live && st.storm > 0.6) {
        st.nextFlash -= dt;
        if (st.nextFlash <= 0) {
          st.nextFlash = rand(5, 14);
          st.flashT = 0.45;
          // Thunder follows by how far off it struck.
          st.thunderIn = 0.25 + strike(camPos, camera) / 240;
        }
      }
      if (st.flashT > 0) {
        st.flashT -= dt;
        const t = 0.45 - st.flashT;
        st.flash = (t < 0.08 ? 1 : t < 0.14 ? 0.2 : t < 0.22 ? 0.8 : Math.max(0, 1 - (t - 0.22) * 4.4));
      } else {
        st.flash = 0;
      }
      // The flash lights the sea and everything on it for an instant.
      for (const b of bolts) b.visible = st.flash > 0.12;
      boltMat.opacity = st.flash;
      ocean.uniforms.uFlash.value = st.flash;
      if (st.flash > 0) {
        hemi.intensity += st.flash * 1.5;
        hemi.color.lerp(tmpC.setRGB(0.75, 0.8, 1.0), st.flash);
      }
      if (st.thunderIn > 0) {
        st.thunderIn -= dt;
        if (st.thunderIn <= 0) audio.thunder?.();
      }
      SKY.flash = st.flash;

      // ---- rain ----
      rainMesh.visible = st.rain > 0.02;
      rainMat.opacity = clamp(st.rain * 0.55, 0, 0.55) * (1 - night * 0.4);
      if (rainMesh.visible) {
        // Rain slants with the wind.
        const lean = wind.speed * 0.035;
        const lx = info.windX * lean, lz = info.windZ * lean;
        for (let i = 0; i < RAIN_DROPS; i++) {
          const d = drops[i];
          d.y -= d.v * dt;
          d.x += lx * d.v * dt;
          d.z += lz * d.v * dt;
          if (d.y < -1) { d.y += RAIN_BOX.y; d.x = rand(-1, 1) * RAIN_BOX.x / 2; d.z = rand(-1, 1) * RAIN_BOX.z / 2; }
          const x = camPos.x + d.x, y = camPos.y - 4 + d.y, z = camPos.z + d.z;
          const j = i * 6;
          pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
          pos[j + 3] = x - lx * 0.45; pos[j + 4] = y + 0.45; pos[j + 5] = z - lz * 0.45;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      audio.setRain?.(st.rain);
      audio.setWind?.(clamp(st.storm + Math.max(0, wind.speed - 8) * 0.05 + wind.gust * 0.15, 0, 1));

      // ---- sky lighting for everything else, refreshed every few seconds ----
      // Capturing the sky costs a few milliseconds, so it waits until the
      // light has changed enough to see (or the clouds have drifted a while).
      st.envTimer -= dt;
      st.envAge = (st.envAge || 0) + dt;
      const changed = Math.abs(sy - lastSunY) > 0.012 || Math.abs(st.cover - lastCover) > 0.03 || st.flash > 0.5;
      if (st.envTimer <= 0 && (changed || st.envAge > api.envInterval * 6)) {
        st.envTimer = api.envInterval;
        st.envAge = 0;
        lastSunY = sy;
        lastCover = st.cover;
        onEnvironment(sky.capture(time));
      }
      // The sky dome and the captured light keep north where the chart has it.
      const yaw = frameYaw();
      if (yaw !== lastYaw || sky.mesh.rotation.y !== yaw) {
        lastYaw = yaw;
        sky.setYaw(yaw);
      }

      Object.assign(info, {
        day: st.day, hour: st.hour, kind: st.kind, daylight, night,
        rain: st.rain, storm: st.storm,
        heat: daylight * smoothstep(0.35, 0.8, sy) * (1 - st.cover),
        wet: st.rain,
      });
      return info;
    },
  };
  return api;
}

export const WEATHER_NAMES = { clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', storm: 'Storm' };
