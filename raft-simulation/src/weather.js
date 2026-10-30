import * as THREE from 'three';
import { DAY, WEATHER } from './config.js';
import { SKY } from './sky.js';
import { setSwell } from './ocean.js';
import { clamp, damp, rand, smoothstep, weightedPick } from './util.js';

// Clock and weather. Every frame this rewrites the shared SKY state, the sun
// light, the fog and the swell, and reports how hot, cold and wet it is.

const C = (hex) => new THREE.Color(hex);
const PAL = {
  zenithDay: C(0x2f73c4), zenithNight: C(0x070d1c), zenithStorm: C(0x56616b),
  horizonDay: C(0xbcd6e2), horizonNight: C(0x101b2c), horizonStorm: C(0x7d8a92),
  groundDay: C(0x0d3a4c), groundNight: C(0x03111a),
  sunNoon: C(0xffe2b8), sunLow: C(0xff9a55), moon: C(0x8aa0d8),
  sunset: new THREE.Color(0.55, 0.28, 0.1),
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
  scene.add(rainMesh);

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
  const info = { day: 1, hour: 8, kind: 'clear', daylight: 1, night: 0, rain: 0, storm: 0, heat: 0, cold: 0, wet: 0 };

  const api = {
    mesh: rainMesh,
    envInterval: 2.5, // seconds between sky-lighting refreshes
    get state() { return st; },

    setTime(hour) { st.hour = hour; st.envTimer = 0; },
    setWeather(kind, instant = false) {
      st.kind = kind;
      st.timer = rand(...WEATHER.kinds[kind].dur);
      if (instant) {
        const k = WEATHER.kinds[kind];
        Object.assign(st, { cover: k.cover, rain: k.rain, storm: k.storm, swell: k.swell, fog: k.fog });
      }
      st.envTimer = 0;
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
      st.envTimer = 0;
    },

    update(dt, time, camPos, live) {
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
      const sunset = (1 - smoothstep(0.0, 0.3, sy)) * smoothstep(-0.18, 0.0, sy);
      SKY.night = night;
      SKY.cover = st.cover;
      SKY.storm = st.storm;

      if (sy > 0.02) {
        SKY.sunDir.copy(SKY.trueSun);
        if (SKY.sunDir.y < 0.08) { SKY.sunDir.y = 0.08; SKY.sunDir.normalize(); }
        SKY.sunColor.copy(PAL.sunLow).lerp(PAL.sunNoon, smoothstep(0.05, 0.45, sy));
      } else {
        SKY.sunDir.copy(SKY.moonDir);
        if (SKY.sunDir.y < 0.1) { SKY.sunDir.y = 0.1; SKY.sunDir.normalize(); }
        SKY.sunColor.copy(PAL.moon).multiplyScalar(0.55);
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
      setSwell(st.swell);
      fx.setGlow(night);

      // ---- lightning ----
      if (live && st.storm > 0.6) {
        st.nextFlash -= dt;
        if (st.nextFlash <= 0) {
          st.nextFlash = rand(5, 14);
          st.flashT = 0.45;
          st.thunderIn = rand(0.4, 2.2);
        }
      }
      if (st.flashT > 0) {
        st.flashT -= dt;
        const t = 0.45 - st.flashT;
        st.flash = (t < 0.08 ? 1 : t < 0.14 ? 0.2 : t < 0.22 ? 0.8 : Math.max(0, 1 - (t - 0.22) * 4.4));
      } else {
        st.flash = 0;
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
        const wind = 2 + st.storm * 5;
        for (let i = 0; i < RAIN_DROPS; i++) {
          const d = drops[i];
          d.y -= d.v * dt;
          d.x += wind * 0.3 * dt;
          if (d.y < -1) { d.y += RAIN_BOX.y; d.x = rand(-1, 1) * RAIN_BOX.x / 2; d.z = rand(-1, 1) * RAIN_BOX.z / 2; }
          const x = camPos.x + d.x, y = camPos.y - 4 + d.y, z = camPos.z + d.z;
          const j = i * 6;
          pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
          pos[j + 3] = x + wind * 0.02; pos[j + 4] = y + 0.45; pos[j + 5] = z;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      audio.setRain?.(st.rain);

      // ---- sky lighting for everything else, refreshed every few seconds ----
      st.envTimer -= dt;
      if (st.envTimer <= 0) {
        st.envTimer = api.envInterval;
        onEnvironment(sky.capture(time));
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
