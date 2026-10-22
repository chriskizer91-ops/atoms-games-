// Battles: 1 v 1, turn based. Fight / Cube / Swap / Run. The rules are in docs/creature-catch-handoff.md
// section 5 and docs/creature-catch-decisions-2.md. Every animation is code moving the one still sprite.
var CC = window.CC || (window.CC = {});

(function () {
  var FOE = { x: 176, y: 72 }, ALLY = { x: 62, y: 114 };

  function stageMult(n) { return n >= 0 ? 1 + 0.25 * n : 1 / (1 + 0.25 * -n); }
  function freshStages() { return { atk: 0, def: 0, spd: 0, acc: 0 }; }
  function side(mon, isFoe) {
    return { mon: mon, foe: isFoe, st: freshStages(), home: isFoe ? FOE : ALLY, ox: 0, oy: 0, sx: 1, sy: 1, scale: 0, alpha: 1, flash: null, wave: 0, hpShown: mon ? mon.hp : 0, overlay: null };
  }
  function nm(s) { return (s.foe ? (B.wild ? 'The wild ' : B.trainer.name + '\'s ') : '') + CC.mon.name(s.mon); }
  function nmShort(s) { return CC.mon.name(s.mon); }

  var B = null; // the battle now running
  CC.currentBattle = function () { return B; };

  CC.startBattle = function (opts) {
    return new Promise(function (resolve) {
      B = {
        wild: !!opts.wild, trainer: opts.trainer || null, resolve: resolve,
        foeTeam: opts.wild ? [opts.wild] : opts.trainer.team, foeIndex: 0,
        allyIndex: CC.firstHealthy(), runs: 0, fought: {}, leveled: {}, shake: 0, flashScreen: 0, intro: 0, trainerShown: !!opts.trainer,
        bg: opts.bg || (CC.world.map && CC.world.map.spawns) || 'grassland',
      };
      B.foe = side(B.foeTeam[0], true);
      B.ally = side(null, false);
      B.foe.scale = 0;
      CC.markSeen(B.foe.mon.id);
      CC.fx.clear();
      CC.push(screen);
      battle().catch(function (e) { console.error(e); }).then(function (result) {
        CC.pop(screen); CC.fx.clear();
        var r = B.resolve; B = null; r(result);
      });
    });
  };

  // ---------- drawing ----------
  function drawBackground() {
    var g = CC.g, bg = B.bg;
    var sky = bg === 'meadow' ? ['#a8e0f8', '#e0f4ff'] : ['#90d0f8', '#d8f0ff'];
    var grd = g.createLinearGradient(0, 0, 0, 90); grd.addColorStop(0, sky[0]); grd.addColorStop(1, sky[1]);
    g.fillStyle = grd; g.fillRect(0, 0, 240, 112);
    // clouds
    g.fillStyle = '#ffffff';
    [[30, 18], [150, 10], [210, 26]].forEach(function (c, i) { var x = (c[0] + CC.time * (3 + i)) % 280 - 30; g.fillRect(x, c[1], 22, 5); g.fillRect(x + 5, c[1] - 3, 12, 4); });
    // hills
    g.fillStyle = '#9ad878'; g.beginPath(); g.moveTo(0, 70);
    for (var x = 0; x <= 240; x += 8) g.lineTo(x, 62 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.08) * 2);
    g.lineTo(240, 112); g.lineTo(0, 112); g.fill();
    g.fillStyle = '#78c850'; g.fillRect(0, 80, 240, 32);
    g.fillStyle = '#6ab848'; for (var i = 0; i < 24; i++) g.fillRect((i * 37) % 240, 84 + (i * 13) % 26, 3, 1);
    // platforms
    plat(FOE.x, FOE.y - 2, 40, 9, '#8ad868', '#5aa840');
    plat(ALLY.x, ALLY.y - 3, 48, 10, '#8ad868', '#5aa840');
  }
  function plat(x, y, rx, ry, top, edge) {
    var g = CC.g;
    g.fillStyle = edge; g.beginPath(); g.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = top; g.beginPath(); g.ellipse(x, y, rx - 2, ry - 2, 0, 0, Math.PI * 2); g.fill();
  }

  function drawMon(s) {
    if (!s.mon || s.scale <= 0) return;
    var m = s.mon, sprite = CC.creatureSprite(m.id), sp = CC.mon.sp(m);
    var t = CC.time + (s.foe ? 1.3 : 0);
    var frozen = m.status === 'freeze', asleep = m.status === 'sleep';
    var breathe = frozen ? 0 : Math.sin(t * (asleep ? 1.4 : 2.6)) * (asleep ? 0.04 : 0.028);
    var jitter = m.status === 'shock' && Math.random() < 0.08 ? CC.rand(-1, 1) : 0;
    var low = m.hp > 0 && m.hp / CC.mon.maxHp(m) < 0.25 && !frozen ? Math.sin(t * 9) * 0.02 : 0;
    var ghosty = sp.look.body === 'ghost' ? 0.8 : 0;
    var x = s.home.x + s.ox + jitter, y = s.home.y + s.oy;
    // shadow
    CC.g.fillStyle = 'rgba(0,0,0,0.18)'; CC.g.beginPath(); CC.g.ellipse(s.home.x, s.home.y - 1, 22 * s.scale, 4 * s.scale, 0, 0, Math.PI * 2); CC.g.fill();
    var bob = sp.look.body === 'ghost' || sp.look.body === 'bird' && m.status !== 'sleep' ? Math.sin(t * 2.2) * 2 : 0;
    CC.drawSprite(sprite, x, y + bob - (ghosty ? 2 : 0), {
      flip: !s.foe, sx: s.sx * s.scale * (1 - breathe * 0.5) * (1 + low), sy: s.sy * s.scale * (1 + breathe), alpha: s.alpha,
      flash: s.flash, id: m.id + (s.foe ? 'f' : 'a'), wave: s.wave || ghosty, waveSpeed: ghosty && !s.wave ? 3 : 14,
      overlay: frozen ? ['#9adcf0', 0.45] : s.overlay,
    });
    // status particles
    if (m.hp > 0 && Math.random() < 0.06) {
      var cx = s.home.x + CC.rand(-14, 14), cy = s.home.y - CC.rand(10, 40);
      if (m.status === 'burn') CC.fx.add({ x: cx, y: cy + 10, vx: 0, vy: -20, life: 0.7, kind: 'flame', size: 3 });
      if (m.status === 'poison') CC.fx.add({ x: cx, y: cy, vx: 0, vy: -14, life: 0.8, kind: 'bubble', color: '#b46ae0', size: 4 });
      if (m.status === 'sleep' && Math.random() < 0.4) CC.fx.add({ x: s.home.x + 10, y: s.home.y - 48, vx: 8, vy: -12, life: 1.2, kind: 'z', color: '#ffffff', size: 4 });
      if (m.status === 'shock') CC.fx.add({ x: cx, y: cy, vx: CC.rand(-20, 20), vy: CC.rand(-20, 20), life: 0.2, kind: 'bolt', size: 5 });
      if (m.status === 'freeze') CC.fx.add({ x: cx, y: cy, vx: 0, vy: 0, life: 0.5, kind: 'star', color: '#e4faff', size: 3 });
    }
  }

  function drawPlate(s, x, y, ally) {
    if (!s.mon || (s.scale <= 0 && !(s.foe && B.cube))) return;
    var m = s.mon, max = CC.mon.maxHp(m), w = ally ? 110 : 104, h = ally ? 38 : 26;
    CC.box(x, y, w, h, { fill: '#fbf3e0' });
    CC.text(CC.mon.name(m), x + 6, y + 3, '#2a2230');
    CC.text('Lv' + m.lv, x + w - 6, y + 4, '#6a5a50', { size: 9, align: 'right' });
    CC.statusTag(m.status, x + w - 46, y + 4);
    CC.text('HP', x + 6, y + 15, '#c86a2a', { size: 8 });
    CC.bar(x + 20, y + 18, w - 28, s.hpShown / max);
    if (ally) {
      CC.text(Math.ceil(s.hpShown) + ' / ' + max, x + w - 8, y + 21, '#2a2230', { size: 10, align: 'right' });
      var lo = CC.mon.xpFor(m.lv), hi = CC.mon.xpFor(m.lv + 1);
      CC.rect(x + 6, y + h - 5, w - 12, 2, '#5a5060');
      CC.rect(x + 6, y + h - 5, Math.round((w - 12) * CC.clamp((s.xpShown != null ? s.xpShown : m.xp) - lo, 0, hi - lo) / (hi - lo || 1)), 2, '#48a8e8');
    } else if (CC.state.caught[m.id] && B.wild) {
      CC.drawCube(x + w - 54, y + 8, 5);
    }
  }

  var screen = {
    opaque: true,
    update: function () {},
    draw: function () {
      var g = CC.g;
      g.save();
      if (B.shake > 0) { g.translate(Math.round(CC.rand(-B.shake, B.shake)), Math.round(CC.rand(-B.shake, B.shake) * 0.5)); B.shake = Math.max(0, B.shake - CC.dt * 14); }
      drawBackground();
      if (B.trainerShown && B.trainer) {
        var p = CC.person(B.trainer.look, 'down', 0);
        g.drawImage(p, FOE.x - 30 + B.trainerX, FOE.y - 60, 60, 60);
      }
      drawMon(B.foe);
      drawMon(B.ally);
      if (B.cube) CC.drawCube(B.cube.x, B.cube.y, 8, { rot: B.cube.rot, open: B.cube.open, glow: B.cube.glow });
      g.restore();
      drawPlate(B.foe, 6, 8, false);
      drawPlate(B.ally, 124, 72, true);
      if (B.flashScreen > 0) { g.globalAlpha = Math.min(1, B.flashScreen); CC.rect(0, 0, 240, 160, B.flashColor || '#ffffff'); g.globalAlpha = 1; B.flashScreen -= CC.dt * 4; }
      if (B.intro < 1) { // the bars from the transition opening up
        for (var i = 0; i < 10; i++) { var w = CC.W * (1 - CC.ease(CC.clamp(B.intro * 1.6 - i * 0.06, 0, 1))); CC.rect(i % 2 ? CC.W - w : 0, i * 16, w, 16, '#1e1626'); }
      }
      if (!CC.top().isDialog && CC.top() === screen) CC.box(0, 112, 240, 48);
    },
  };

  // ---------- animation pieces ----------
  function hpTo(s, sec) {
    var from = s.hpShown, to = s.mon.hp;
    return CC.tween(sec || Math.min(0.9, 0.25 + Math.abs(from - to) * 0.02), function (k) { s.hpShown = CC.lerp(from, to, k); });
  }
  async function sendOut(s, throwFrom) {
    var cubeFrom = throwFrom || (s.foe ? { x: 250, y: 20 } : { x: -10, y: 120 });
    var to = { x: s.home.x, y: s.home.y - 24 };
    B.cube = { x: cubeFrom.x, y: cubeFrom.y, rot: 0, open: 0 };
    CC.sfx('throw');
    await CC.tween(0.4, function (k) { B.cube.x = CC.lerp(cubeFrom.x, to.x, k); B.cube.y = CC.lerp(cubeFrom.y, to.y, k) - Math.sin(k * Math.PI) * 30; B.cube.rot = k * 8; });
    B.cube.open = 3; B.cube.glow = 0.8;
    CC.burst('Normal', to.x, to.y, 12, 60, { kind: 'star' });
    s.hpShown = s.mon.hp; s.flash = '#ffffff';
    await CC.tween(0.3, function (k) { s.scale = CC.easeOut(k); });
    B.cube = null; s.flash = null;
    await CC.tween(0.2, function (k) { s.sy = 1 + Math.sin(k * Math.PI) * 0.15; s.sx = 1 - Math.sin(k * Math.PI) * 0.08; });
    s.sx = s.sy = 1;
  }
  async function withdraw(s) {
    s.flash = '#ffffff';
    await CC.tween(0.25, function (k) { s.scale = 1 - k; });
    s.flash = null;
  }
  async function hitFx(target, mult, crit, type) {
    var x = target.home.x, y = target.home.y - 28;
    CC.sfx(mult > 1 ? 'superhit' : mult < 1 ? 'weakhit' : 'hit');
    CC.burst(type || 'Normal', x, y, mult > 1 ? 16 : 8, mult > 1 ? 90 : 60);
    CC.fx.add({ x: x, y: y, vx: 0, vy: 0, life: 0.2, kind: 'star', color: '#ffffff', size: 14, grow: 1 });
    if (mult > 1 || crit) B.shake = 4;
    for (var i = 0; i < 3; i++) {
      target.flash = '#ffffff'; target.ox = target.foe ? 3 : -3;
      await CC.sleep(0.05);
      target.flash = null; target.ox = target.foe ? -3 : 3;
      await CC.sleep(0.05);
    }
    target.ox = 0;
  }
  // the move's look: projectiles for basic, a charged burst for strong, swirls for utility
  async function moveAnim(user, target, move) {
    var type = move.type || 'Normal', dir = user.foe ? -1 : 1, f = CC.TYPE_FX[type] || CC.TYPE_FX.Normal;
    var ux = user.home.x, uy = user.home.y - 28, tx = target.home.x, ty = target.home.y - 28;
    var fx = move.fx || {};
    if (!move.power) {
      var self = fx.self || fx.heal;
      var who = self ? user : target, wx = who.home.x, wy = who.home.y - 26;
      CC.sfx(fx.heal ? 'heal' : 'status');
      await CC.tween(0.5, function (k) {
        user.sy = 1 + Math.sin(k * Math.PI * 2) * 0.06;
        if (Math.random() < 0.7) {
          var a = k * 12 + Math.random() * 6;
          CC.fx.add({ x: wx + Math.cos(a) * 22 * (1 - k), y: wy + Math.sin(a) * 14 * (1 - k), vx: 0, vy: -10, life: 0.4, kind: fx.heal ? 'star' : f.kind, color: fx.heal ? '#c8ffd0' : CC.pick(f.colors), size: 4 });
        }
      });
      user.sy = 1;
      return;
    }
    if (move.tier === 'strong' || (move.power >= 70)) {
      // charge: particles pull in, the sprite swells
      CC.sfx('statup');
      await CC.tween(0.45, function (k) {
        user.sx = user.sy = 1 + k * 0.1;
        var a = Math.random() * Math.PI * 2;
        CC.fx.add({ x: ux + Math.cos(a) * 30, y: uy + Math.sin(a) * 24, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 50, life: 0.45, kind: f.kind, color: CC.pick(f.colors), size: 4 });
      });
      await CC.tween(0.14, function (k) { user.ox = dir * 30 * k; user.oy = -dir * 14 * k; user.sx = user.sy = 1.1 - k * 0.1; });
      B.flashScreen = 0.5; B.flashColor = CC.TYPE_COLORS[type] ? CC.TYPE_COLORS[type][0] : '#ffffff';
      CC.burst(type, tx, ty, 30, 110, { size: 1.4 });
      CC.fx.add({ x: tx, y: ty, vx: 0, vy: 0, life: 0.35, kind: 'ring', color: '#ffffff', size: 6, grow: 4 });
      await CC.tween(0.2, function (k) { user.ox = dir * 30 * (1 - k); user.oy = -dir * 14 * (1 - k); });
      user.ox = user.oy = 0; user.sx = user.sy = 1;
      return;
    }
    // basic: a quick lunge and a stream of the type's particles
    var physical = type === 'Normal' || type === 'Earth' || move.tier === 'sig' && (fx.crit || fx.hits);
    if (physical) {
      await CC.tween(0.12, function (k) { user.ox = dir * 18 * k; user.oy = -dir * 6 * k; });
      if (type !== 'Normal') CC.burst(type, tx, ty, 6, 50);
      await CC.tween(0.12, function (k) { user.ox = dir * 18 * (1 - k); user.oy = -dir * 6 * (1 - k); });
    } else {
      CC.sfx('shoot');
      await CC.tween(0.08, function (k) { user.sx = 1 + k * 0.06; user.sy = 1 - k * 0.05; });
      user.sx = user.sy = 1;
      for (var i = 0; i < 6; i++) {
        var t0 = 0.28;
        CC.fx.add({ x: ux, y: uy + CC.rand(-4, 4), vx: (tx - ux) / t0, vy: (ty - uy) / t0 + CC.rand(-15, 15), life: t0, kind: f.kind, color: CC.pick(f.colors), size: 5, fade: false, spin: 10 });
        await CC.sleep(0.04);
      }
      await CC.sleep(0.22);
    }
  }
  async function statFx(s, up) {
    CC.sfx(up ? 'statup' : 'statdown');
    s.overlay = [up ? '#ff9a4a' : '#5a8ae0', 0.35];
    for (var i = 0; i < 8; i++) CC.fx.add({ x: s.home.x + CC.rand(-18, 18), y: s.home.y - (up ? 4 : 52), vx: 0, vy: up ? -50 : 50, life: 0.6, kind: 'arrow', color: up ? '#ff8a3a' : '#5a8ae0', size: 6, rot: up ? 0 : Math.PI });
    await CC.sleep(0.6);
    s.overlay = null;
  }
  async function faintAnim(s) {
    CC.sfx('faint');
    await CC.tween(0.5, function (k) { s.oy = k * 40; s.alpha = 1 - k; s.sy = 1 - k * 0.3; });
    s.scale = 0; s.oy = 0; s.alpha = 1; s.sy = 1;
  }

  // ---------- rules ----------
  function stats(s) {
    var b = CC.mon.stats(s.mon);
    return {
      atk: b.atk * stageMult(s.st.atk) * (s.mon.status === 'burn' ? 0.75 : 1),
      def: b.def * stageMult(s.st.def),
      spd: b.spd * stageMult(s.st.spd) * (s.mon.status === 'shock' ? 0.75 : 1),
    };
  }
  function damage(user, target, move, crit) {
    var a = stats(user), d = stats(target), L = user.mon.lv;
    var mult = move.type ? CC.typeMult(move.type, CC.mon.sp(target.mon).types) : 1;
    var stab = move.type && CC.mon.sp(user.mon).types.indexOf(move.type) >= 0 ? 1.25 : 1;
    var dmg = (((2 * L / 5 + 2) * move.power * a.atk / d.def) / 50 + 2) * mult * stab * CC.rand(0.9, 1) * (crit ? 1.5 : 1);
    return { dmg: mult === 0 ? 0 : Math.max(1, Math.floor(dmg)), mult: mult };
  }

  var STATUS_TEXT = { burn: 'was burned!', freeze: 'was frozen solid!', shock: 'is shocked! It may be unable to move!', poison: 'was poisoned!', sleep: 'fell asleep!' };
  var STAT_NAME = { atk: 'Attack', def: 'Defense', spd: 'Speed', acc: 'accuracy' };

  async function applyStatus(target, st, quiet) {
    if (target.mon.status || target.mon.hp <= 0) { if (!quiet) await CC.say('But it failed!'); return; }
    target.mon.status = st;
    if (st === 'sleep') target.mon.sleep = CC.randi(1, 3);
    CC.sfx('status');
    await CC.say(nm(target) + ' ' + STATUS_TEXT[st]);
  }
  async function applyStat(s, stat, n) {
    var cur = s.st[stat], next = CC.clamp(cur + n, -3, 3);
    if (next === cur) { await CC.say(nm(s) + '\'s ' + STAT_NAME[stat] + ' won\'t go any ' + (n > 0 ? 'higher!' : 'lower!')); return; }
    s.st[stat] = next;
    await statFx(s, n > 0);
    await CC.say(nm(s) + '\'s ' + STAT_NAME[stat] + (n > 1 ? ' rose sharply!' : n > 0 ? ' rose!' : n < -1 ? ' fell sharply!' : ' fell!'));
  }

  // returns true when it could act
  async function canAct(s) {
    var m = s.mon;
    if (m.status === 'sleep') {
      m.sleep--;
      if (m.sleep < 0) { m.status = null; await CC.say(nm(s) + ' woke up!'); return true; }
      await CC.say(nm(s) + ' is fast asleep.'); return false;
    }
    if (m.status === 'freeze') {
      if (Math.random() < 0.25) { m.status = null; await CC.say(nm(s) + ' thawed out!'); return true; }
      await CC.say(nm(s) + ' is frozen solid!'); return false;
    }
    if (m.status === 'shock' && Math.random() < 0.25) {
      CC.burst('Bolt', s.home.x, s.home.y - 28, 10, 50); CC.sfx('status');
      await CC.say(nm(s) + ' is shocked and can\'t move!'); return false;
    }
    return true;
  }

  async function useMove(user, target, mvId) {
    var move = CC.MOVES[mvId], fx = move.fx || {};
    if (mvId !== 'struggle') {
      var slot = user.mon.moves.find(function (x) { return x.id === mvId; });
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }
    await CC.say(nm(user) + ' used ' + move.name + '!', { auto: 0.35 });
    // accuracy
    if (move.acc && !(fx.self || fx.heal)) {
      var acc = move.acc * stageMult(user.st.acc);
      if (Math.random() * 100 >= acc) { await CC.say(nm(user) + '\'s attack missed!'); return; }
    }
    await moveAnim(user, target, move);
    if (move.power) {
      var hits = fx.hits ? CC.randi(fx.hits[0], fx.hits[1]) : 1, total = 0, last = null, n = 0;
      for (var h = 0; h < hits && target.mon.hp > 0; h++) {
        var crit = Math.random() < (fx.crit ? 0.25 : 0.0625);
        var r = damage(user, target, move, crit);
        target.mon.hp = Math.max(0, target.mon.hp - r.dmg); total += r.dmg; last = r; n++;
        await Promise.all([hitFx(target, r.mult, crit, move.type), hpTo(target)]);
        if (crit) await CC.say('A critical hit!');
        if (h < hits - 1 && target.mon.hp > 0) await CC.sleep(0.1);
      }
      if (last && last.mult > 1) await CC.say('It\'s super effective!');
      else if (last && last.mult < 1) await CC.say('It\'s not very effective...');
      if (hits > 1) await CC.say('It hit ' + n + ' times!');
      if (fx.drain && user.mon.hp > 0) {
        var heal = Math.max(1, Math.floor(total * fx.drain)), max = CC.mon.maxHp(user.mon);
        if (user.mon.hp < max) {
          for (var i = 0; i < 8; i++) CC.fx.add({ x: target.home.x, y: target.home.y - 28, vx: (user.home.x - target.home.x) / 0.5, vy: (user.home.y - target.home.y) / 0.5 + CC.rand(-20, 20), life: 0.5, kind: 'glow', color: '#c8ffd0', size: 2, fade: false });
          await CC.sleep(0.5);
          user.mon.hp = Math.min(max, user.mon.hp + heal); await hpTo(user);
          await CC.say(nm(target) + ' had its energy drained!');
        }
      }
      if (fx.recoil && user.mon.hp > 0) {
        user.mon.hp = Math.max(0, user.mon.hp - Math.max(1, Math.floor(total * fx.recoil)));
        await Promise.all([hitFx(user, 1, false, 'Normal'), hpTo(user)]);
        await CC.say(nm(user) + ' is hit with recoil!');
      }
      if (target.mon.hp > 0 && (!fx.chance || Math.random() * 100 < fx.chance)) {
        if (fx.status && !target.mon.status) await applyStatus(target, fx.status, true);
        if (fx.stat) await applyStat(fx.self ? user : target, fx.stat, fx.stages);
      } else if (fx.stat && fx.self && user.mon.hp > 0 && (!fx.chance || Math.random() * 100 < fx.chance)) await applyStat(user, fx.stat, fx.stages);
      return;
    }
    // moves without power
    if (fx.heal) {
      var mx = CC.mon.maxHp(user.mon);
      if (user.mon.hp >= mx) { await CC.say('But ' + nm(user) + ' is already at full HP!'); return; }
      user.mon.hp = Math.min(mx, user.mon.hp + Math.floor(mx * fx.heal)); await hpTo(user);
      await CC.say(nm(user) + ' got its HP back!'); return;
    }
    if (fx.status) { await applyStatus(target, fx.status); return; }
    if (fx.stat) { await applyStat(fx.self ? user : target, fx.stat, fx.stages); }
  }

  async function residual(s) {
    var m = s.mon;
    if (m.hp <= 0 || (m.status !== 'burn' && m.status !== 'poison')) return;
    var max = CC.mon.maxHp(m), d = Math.max(1, Math.floor(max / (m.status === 'burn' ? 16 : 8)));
    CC.burst(m.status === 'burn' ? 'Fire' : 'Shadow', s.home.x, s.home.y - 24, 8, 30, m.status === 'poison' ? { kind: 'bubble' } : {});
    m.hp = Math.max(0, m.hp - d);
    s.flash = m.status === 'burn' ? '#ff8a4a' : '#b46ae0'; await hpTo(s, 0.4); s.flash = null;
    await CC.say(nm(s) + ' is hurt by its ' + (m.status === 'burn' ? 'burn!' : 'poison!'));
  }

  // ---------- choosing ----------
  function usableMoves(m) { return m.moves.filter(function (x) { return x.pp > 0; }); }
  function foeChoice() {
    var f = B.foe, m = f.mon, opts = usableMoves(m);
    if (!opts.length) return 'struggle';
    if (B.wild) return CC.pick(opts).id;
    var best = null, bestScore = -1;
    opts.forEach(function (x) {
      var mv = CC.MOVES[x.id], sc;
      if (mv.power) sc = mv.power * CC.typeMult(mv.type, CC.mon.sp(B.ally.mon).types) * (CC.mon.sp(m).types.indexOf(mv.type) >= 0 ? 1.25 : 1);
      else sc = (mv.fx.status && !B.ally.mon.status) ? 45 : mv.fx.heal ? (m.hp < CC.mon.maxHp(m) / 2 ? 70 : 0) : 30;
      sc *= CC.rand(0.7, 1.3);
      if (sc > bestScore) { bestScore = sc; best = x.id; }
    });
    return best;
  }

  function actionMenu() {
    return new Promise(function (resolve) {
      var sel = 0, labels = ['Fight', 'Cube', 'Swap', 'Run'];
      var scr = {
        name: 'action',
        update: function () {
          if (CC.input.pressed.left || CC.input.pressed.right) { sel ^= 1; CC.sfx('blip'); }
          if (CC.input.pressed.up || CC.input.pressed.down) { sel ^= 2; CC.sfx('blip'); }
          if (CC.input.pressed.a) { CC.sfx('select'); CC.pop(scr); resolve(sel); }
        },
        draw: function () {
          CC.box(0, 112, 240, 48);
          CC.wrap('What will ' + nmShort(B.ally) + ' do?', 110, 10).forEach(function (l, i) { CC.text(l, 9, 119 + i * 15); });
          CC.box(124, 112, 116, 48, { fill: '#ffffff' });
          labels.forEach(function (l, i) {
            var x = 142 + (i % 2) * 50, y = 120 + Math.floor(i / 2) * 18;
            var off = (i === 1 || i === 3) && !B.wild;
            CC.text(l, x, y, off ? '#b0a498' : '#2a2230');
            if (i === sel) CC.cursor(x - 9, y + 2);
          });
        },
      };
      CC.push(scr);
    });
  }
  function fightMenu() {
    return new Promise(function (resolve) {
      var m = B.ally.mon, sel = 0, n = m.moves.length;
      var scr = {
        name: 'fight',
        update: function () {
          if (CC.input.pressed.left || CC.input.pressed.right) { if ((sel ^ 1) < n) { sel ^= 1; CC.sfx('blip'); } }
          if (CC.input.pressed.up || CC.input.pressed.down) { if ((sel ^ 2) < n) { sel ^= 2; CC.sfx('blip'); } }
          if (CC.input.pressed.b) { CC.sfx('back'); CC.pop(scr); resolve(null); }
          if (CC.input.pressed.a) {
            if (m.moves[sel].pp <= 0) { CC.sfx('bump'); return; }
            CC.sfx('select'); CC.pop(scr); resolve(m.moves[sel].id);
          }
        },
        draw: function () {
          CC.box(0, 112, 164, 48, { fill: '#ffffff' });
          m.moves.forEach(function (x, i) {
            var px = 14 + (i % 2) * 76, py = 120 + Math.floor(i / 2) * 18;
            CC.text(CC.MOVES[x.id].name, px, py, x.pp > 0 ? '#2a2230' : '#b0a498', { size: 9 });
            if (i === sel) CC.cursor(px - 9, py + 2);
          });
          var mv = CC.MOVES[m.moves[sel].id], slot = m.moves[sel];
          CC.box(162, 112, 78, 48);
          CC.text('PP ' + slot.pp + '/' + mv.pp, 170, 118, slot.pp ? '#2a2230' : '#c83a3a', { size: 9 });
          if (mv.type) CC.typeBadge(mv.type, 170, 131);
          var e = mv.power ? CC.typeMult(mv.type, CC.mon.sp(B.foe.mon).types) : 1;
          CC.text(mv.power ? 'Power ' + mv.power + (e > 1 ? ' ++' : e < 1 ? ' -' : '') : 'Effect', 170, 143, '#6a5a50', { size: 9 });
        },
      };
      CC.push(scr);
    });
  }
  async function chooseAction() {
    while (true) {
      var m = B.ally.mon;
      var a = await actionMenu();
      if (a === 0) {
        if (!usableMoves(m).length) { await CC.say(nmShort(B.ally) + ' has no moves left!'); return { kind: 'move', move: 'struggle' }; }
        var mv = await fightMenu();
        if (mv) return { kind: 'move', move: mv };
      } else if (a === 1) {
        if (!B.wild) { await CC.say('You can\'t catch another trainer\'s creature!'); continue; }
        if (!CC.state.bag.cube) { await CC.say('You don\'t have any cubes!'); continue; }
        return { kind: 'cube' };
      } else if (a === 2) {
        var i = await CC.partyScreen('battle', { active: B.allyIndex, title: 'Swap in which?' });
        if (i >= 0) return { kind: 'swap', index: i };
      } else if (a === 3) {
        if (!B.wild) { await CC.say('No running from a trainer battle!'); continue; }
        return { kind: 'run' };
      }
    }
  }

  // ---------- catching ----------
  var RARITY_BONUS = { common: 25, uncommon: 10, rare: -5, veryrare: -15 };
  function catchChance(m) {
    var max = CC.mon.maxHp(m), st = m.status;
    var c = (1 - m.hp / max) * 70 + (st === 'sleep' || st === 'freeze' ? 15 : st ? 8 : 0) + (RARITY_BONUS[CC.RARITY[m.id]] || 0);
    return CC.clamp(c, 5, 95);
  }
  async function throwCube() {
    CC.state.bag.cube--;
    await CC.say('You threw a Basic Cube!', { auto: 0.2 });
    var f = B.foe, to = { x: f.home.x, y: f.home.y - 30 };
    B.cube = { x: 30, y: 120, rot: 0, open: 0 };
    CC.sfx('throw');
    await CC.tween(0.55, function (k) { B.cube.x = CC.lerp(30, to.x, k); B.cube.y = CC.lerp(120, to.y, k) - Math.sin(k * Math.PI) * 50; B.cube.rot = k * 12; });
    B.cube.rot = 0; B.cube.open = 4; B.cube.glow = 0.7;
    CC.fx.add({ x: to.x, y: to.y, vx: 0, vy: 0, life: 0.4, kind: 'glow', color: '#ffffff', size: 10, grow: 2 });
    f.flash = '#ffffff';
    await CC.tween(0.35, function (k) { f.scale = 1 - k; f.oy = -k * 26; });
    B.cube.open = 0; B.cube.glow = 0;
    await CC.tween(0.3, function (k) { B.cube.y = CC.lerp(to.y, f.home.y - 5, k * k); });
    CC.sfx('bump');
    var caught = Math.random() * 100 < catchChance(f.mon);
    var wobbles = caught ? 3 : CC.randi(0, 2);
    for (var i = 0; i < wobbles; i++) {
      await CC.sleep(0.45);
      CC.sfx('wobble');
      await CC.tween(0.4, function (k) { B.cube.rot = Math.sin(k * Math.PI * 2) * 0.45 * (i % 2 ? -1 : 1); B.cube.x = to.x + Math.sin(k * Math.PI * 2) * 2; });
    }
    await CC.sleep(0.4);
    if (caught) {
      CC.sfx('catch');
      for (var j = 0; j < 10; j++) CC.fx.add({ x: B.cube.x, y: B.cube.y, vx: CC.rand(-40, 40), vy: CC.rand(-70, -20), life: 0.8, kind: 'star', color: CC.pick(['#ffffff', '#f8e050', '#c88af8']), size: 4, grav: 120 });
      B.cube.glow = 0.4; await CC.sleep(0.3); B.cube.glow = 0;
      await CC.say('Gotcha! ' + CC.mon.name(f.mon) + ' was caught!');
      var where = CC.addCreature(f.mon);
      if (where === 'vault') await CC.say('Your party is full, so ' + CC.mon.name(f.mon) + ' was sent to the Cube Vault.');
      B.cube = null; f.oy = 0;
      return true;
    }
    CC.sfx('breakout');
    B.cube.open = 4; B.cube.glow = 0.9;
    CC.burst('Normal', to.x, to.y + 20, 12, 70, { kind: 'star' });
    await CC.tween(0.3, function (k) { f.scale = k; f.oy = -26 * (1 - k); });
    f.flash = null; f.oy = 0; B.cube = null;
    await CC.say(['Oh no! It broke free!', 'Argh! Almost had it!', 'Aww! It appeared to be caught!', 'Shoot! It was so close, too!'][wobbles]);
    return false;
  }

  // ---------- winning and growing ----------
  async function gainXp(foeMon) {
    var s = B.ally, m = s.mon;
    if (!m || m.hp <= 0 || m.lv >= 50) return;
    var gain = Math.max(1, Math.floor(CC.mon.sp(foeMon).xpYield * foeMon.lv / 5 * (B.wild ? 1 : 1.5)));
    await CC.say(nmShort(s) + ' gained ' + gain + ' XP!');
    var target = m.xp + gain;
    while (m.lv < 50) {
      var next = CC.mon.xpFor(m.lv + 1), from = m.xp, to = Math.min(target, next);
      s.xpShown = from;
      await CC.tween(0.5, function (k) { s.xpShown = CC.lerp(from, to, k); });
      m.xp = to;
      if (m.xp < next) break;
      var before = CC.mon.stats(m);
      m.lv++;
      var after = CC.mon.stats(m);
      m.hp += after.hp - before.hp; s.hpShown = m.hp;
      B.leveled[CC.state.party.indexOf(m)] = true;
      CC.sfx('levelup');
      for (var i = 0; i < 10; i++) CC.fx.add({ x: s.home.x + CC.rand(-20, 20), y: s.home.y, vx: 0, vy: -CC.rand(30, 60), life: 0.8, kind: 'star', color: '#f8e050', size: 3 });
      await CC.say(nmShort(s) + ' grew to Lv ' + m.lv + '!');
      var learn = CC.mon.newMovesAt(m.id, m.lv);
      for (var j = 0; j < learn.length; j++) await CC.learnMove(m, learn[j]);
    }
    if (m.lv >= 50) m.xp = CC.mon.xpFor(50);
    s.xpShown = null;
  }

  async function allyFainted() {
    await faintAnim(B.ally);
    await CC.say(nmShort(B.ally) + ' fainted!');
    if (CC.firstHealthy() < 0) return false;
    var i = await CC.partyScreen('battle', { active: B.allyIndex, title: 'Send out which?', mustPick: true });
    B.allyIndex = i; B.ally = side(CC.state.party[i], false);
    await CC.say('Go, ' + nmShort(B.ally) + '!', { auto: 0.3 });
    await sendOut(B.ally);
    return true;
  }

  // ---------- the battle ----------
  async function battle() {
    await CC.tween(0.5, function (k) { B.intro = k; });
    B.intro = 1;
    if (B.wild) {
      B.foe.scale = 1;
      await CC.tween(0.25, function (k) { B.foe.sy = 1 + Math.sin(k * Math.PI) * 0.2; B.foe.oy = -Math.sin(k * Math.PI) * 10; });
      CC.burst('Plant', FOE.x, FOE.y - 4, 10, 50, { kind: 'grass', grav: 150 });
      await CC.say('A wild ' + CC.mon.name(B.foe.mon) + ' jumped out!');
    } else {
      B.trainerX = 0;
      await CC.say(B.trainer.name + ' wants to battle!');
      if (B.trainer.intro) await CC.say(B.trainer.intro, { who: B.trainer.name });
      await CC.tween(0.3, function (k) { B.trainerX = k * 80; });
      B.trainerShown = false;
      await CC.say(B.trainer.name + ' sent out ' + CC.mon.name(B.foe.mon) + '!', { auto: 0.4 });
      await sendOut(B.foe);
    }
    B.ally = side(CC.state.party[B.allyIndex], false);
    await CC.say('Go, ' + nmShort(B.ally) + '!', { auto: 0.3 });
    await sendOut(B.ally);
    B.fought[B.allyIndex] = true;

    while (true) {
      var act = await chooseAction();
      var foeMove = foeChoice();
      if (act.kind === 'run') {
        B.runs++;
        var a = stats(B.ally).spd, b = stats(B.foe).spd;
        if (a >= b || Math.random() * 100 < 50 + 10 * B.runs) { CC.sfx('back'); await CC.say('Got away safely!'); return 'run'; }
        await CC.say('Couldn\'t get away!');
      } else if (act.kind === 'cube') {
        if (await throwCube()) { await afterWin(); return 'caught'; }
      } else if (act.kind === 'swap') {
        await CC.say('Come back, ' + nmShort(B.ally) + '!', { auto: 0.3 });
        await withdraw(B.ally);
        B.allyIndex = act.index; B.ally = side(CC.state.party[act.index], false); B.fought[act.index] = true;
        await CC.say('Go, ' + nmShort(B.ally) + '!', { auto: 0.3 });
        await sendOut(B.ally);
      }
      // the turn order
      var order = [];
      if (act.kind === 'move') {
        var pa = (CC.MOVES[act.move].fx || {}).priority || 0, pb = (CC.MOVES[foeMove].fx || {}).priority || 0;
        var sa = stats(B.ally).spd, sb = stats(B.foe).spd;
        var allyFirst = pa !== pb ? pa > pb : sa !== sb ? sa > sb : Math.random() < 0.5;
        order = allyFirst ? [['ally', act.move], ['foe', foeMove]] : [['foe', foeMove], ['ally', act.move]];
      } else order = [['foe', foeMove]];

      var ended = false;
      for (var i = 0; i < order.length && !ended; i++) {
        var user = order[i][0] === 'ally' ? B.ally : B.foe, target = user === B.ally ? B.foe : B.ally;
        if (user.mon.hp <= 0 || target.mon.hp <= 0) continue;
        if (await canAct(user)) await useMove(user, target, order[i][1]);
        var r = await checkFaints();
        if (r) { if (r !== 'next') return r; ended = true; }
      }
      if (ended) continue;
      for (var j = 0; j < 2; j++) {
        var who = j === 0 ? B.ally : B.foe;
        await residual(who);
        var r2 = await checkFaints();
        if (r2) { if (r2 !== 'next') return r2; break; }
      }
    }
  }

  // returns 'win' / 'lose' when the battle is over, 'next' when a new creature came out, or null
  async function checkFaints() {
    var out = null;
    if (B.foe.mon.hp <= 0) {
      await faintAnim(B.foe);
      await CC.say(nm(B.foe) + ' fainted!');
      await gainXp(B.foe.mon);
      if (!B.wild && B.foeIndex < B.foeTeam.length - 1) {
        B.foeIndex++;
        B.foe = side(B.foeTeam[B.foeIndex], true); CC.markSeen(B.foe.mon.id);
        await CC.say(B.trainer.name + ' sent out ' + CC.mon.name(B.foe.mon) + '!', { auto: 0.4 });
        await sendOut(B.foe);
        out = 'next';
      } else {
        await afterWin();
        return 'win';
      }
    }
    if (B.ally.mon.hp <= 0) {
      if (!(await allyFainted())) {
        if (B.trainer && B.trainer.loseText) await CC.say(B.trainer.loseText, { who: B.trainer.name });
        await CC.say('You have no creatures left that can fight...');
        return 'lose';
      }
      out = 'next';
    }
    return out;
  }

  async function afterWin() {
    var coins = B.wild ? B.foe.mon.lv * 4 : B.trainer.coins || 0;
    if (!B.wild) {
      B.trainerShown = true; B.trainerX = 80;
      await CC.tween(0.3, function (k) { B.trainerX = 80 * (1 - k); });
      if (B.trainer.winText) await CC.say(B.trainer.winText, { who: B.trainer.name });
    }
    if (coins) { CC.state.coins += coins; await CC.say('You got ' + coins + ' coins' + (B.wild ? '.' : ' for winning!')); }
    // evolution after the battle, for anyone who grew
    for (var k in B.leveled) {
      var m = CC.state.party[k];
      if (!m || m.hp <= 0 || !CC.mon.canEvolve(m)) continue;
      if (await CC.yesNo(CC.mon.name(m) + ' is ready to evolve! Let it?')) await CC.evolveScene(m);
      else await CC.say(CC.mon.name(m) + ' will ask again after its next level.');
    }
  }
})();
