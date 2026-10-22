// Shared UI screens: dialog, choices, menus, party, summary, bag, shop, vault, learning moves, evolution.
var CC = window.CC || (window.CC = {});

// ---------- dialog ----------
// CC.say('text') shows the text in the bottom box, typewriter style, and resolves when the player has read it.
CC.say = function (text, opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    var lines = CC.wrap(text, 222, 10), page = 0, shown = 0;
    var scr = {
      name: 'say',
      update: function (dt) {
        var pageText = lines.slice(page * 2, page * 2 + 2).join('\n');
        if (shown < pageText.length) {
          shown += dt * (CC.input.held.a || CC.input.held.b ? 160 : 55);
          if (CC.input.pressed.a || CC.input.pressed.b) shown = pageText.length;
          return;
        }
        if (opts.auto != null) { opts.auto -= dt; if (opts.auto > 0) return; }
        else if (!(CC.input.pressed.a || CC.input.pressed.b)) return;
        if (opts.auto == null) CC.sfx('blip');
        if ((page + 1) * 2 < lines.length) { page++; shown = 0; return; }
        CC.pop(scr); resolve();
      },
      draw: function () {
        CC.box(0, 112, 240, 48);
        var pageText = lines.slice(page * 2, page * 2 + 2).join('\n').slice(0, Math.floor(shown));
        pageText.split('\n').forEach(function (l, i) { CC.text(l, 9, 119 + i * 15, '#2a2230'); });
        if (opts.who) speakerTag(opts.who);
        var done = Math.floor(shown) >= lines.slice(page * 2, page * 2 + 2).join('\n').length;
        if (done && opts.auto == null && Math.floor(CC.time * 3) % 2) { CC.rect(226, 149, 6, 2, '#6a3a2a'); CC.rect(228, 151, 2, 2, '#6a3a2a'); }
      },
    };
    CC.push(scr);
  });
};
// A speaker's face beside the dialog box, cut from the top of their character art
CC.portrait = function (who, x, y, size) {
  var id = CC.PORTRAITS && CC.PORTRAITS[who], face = id && CC.img('portraits/' + id);
  if (face) { // a painted portrait
    CC.box(x, y, size, size, { fill: '#e8f0f8' });
    CC.g.drawImage(face, x + 3, y + 3, size - 6, size - 6);
    return true;
  }
  var art = id && CC.img('people/' + id);
  if (!art) return false;
  var side = Math.min(art.width, Math.round(art.height * 0.42)), sx = Math.round((art.width - side) / 2);
  CC.box(x, y, size, size, { fill: '#e8f0f8' });
  CC.g.drawImage(art, sx, 0, side, side, x + 3, y + 3, size - 6, size - 6);
  return true;
};
function speakerTag(who) {
  var w = CC.textWidth(who, 9) + 10, hasFace = CC.portrait(who, 4, 63, 40);
  CC.box(hasFace ? 46 : 4, 101, w, 14, { fill: '#f0e2c8' }); CC.text(who, (hasFace ? 46 : 4) + 5, 103, '#6a3a2a', { size: 9 });
}

// several lines in a row, each its own box
CC.talk = async function (who, lines) {
  for (var i = 0; i < lines.length; i++) await CC.say(lines[i], { who: who });
};

// ---------- menus ----------
// CC.menu(items, opts) resolves to the chosen index, or -1 on B (unless opts.noCancel).
// items: strings or { label, right, disabled }
CC.menu = function (items, opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    var sel = opts.start || 0, rowH = opts.rowH || 14;
    var labels = items.map(function (it) { return typeof it === 'string' ? { label: it } : it; });
    var w = opts.w || Math.max.apply(null, labels.map(function (l) { return CC.textWidth(l.label, 10) + (l.right ? CC.textWidth(l.right, 10) + 12 : 0) + (l.icon ? 14 : 0); })) + 26;
    var h = labels.length * rowH + 10 + (opts.title ? 14 : 0);
    var x = opts.x != null ? opts.x : CC.W - w - 2, y = opts.y != null ? opts.y : 110 - h;
    var scr = {
      name: 'menu',
      update: function () {
        if (CC.repeat('down')) { sel = (sel + 1) % labels.length; CC.sfx('blip'); if (opts.onMove) opts.onMove(sel); }
        if (CC.repeat('up')) { sel = (sel + labels.length - 1) % labels.length; CC.sfx('blip'); if (opts.onMove) opts.onMove(sel); }
        if (CC.input.pressed.a) {
          if (labels[sel].disabled) { CC.sfx('bump'); return; }
          CC.sfx('select'); CC.pop(scr); resolve(sel);
        } else if ((CC.input.pressed.b || (opts.startCloses && CC.input.pressed.start)) && !opts.noCancel) { CC.sfx('back'); CC.pop(scr); resolve(-1); }
      },
      draw: function () {
        if (opts.under) opts.under(sel);
        CC.box(x, y, w, h);
        var ty = y + 6;
        if (opts.title) { CC.text(opts.title, x + 8, ty, '#6a3a2a', { size: 9 }); ty += 14; }
        labels.forEach(function (l, i) {
          var icon = l.icon && CC.img(l.icon), tx = x + 16;
          if (icon) { var k = 11 / Math.max(icon.width, icon.height); CC.g.drawImage(icon, tx, ty + i * rowH + 1, icon.width * k, icon.height * k); }
          if (labels.some(function (o) { return o.icon; })) tx += 14;
          CC.text(l.label, tx, ty + i * rowH, l.disabled ? '#a89c90' : '#2a2230');
          if (l.right) CC.text(l.right, x + w - 8, ty + i * rowH, '#6a5a50', { align: 'right' });
        });
        CC.cursor(x + 7, ty + sel * rowH + 2);
      },
    };
    CC.push(scr);
  });
};
CC.yesNo = async function (question, who) {
  var p = CC.say(question, { who: who });
  await p;
  return (await CC.menu(['Yes', 'No'], { y: 74 })) === 0;
};
// ask while the question stays on screen
CC.ask = function (question, options, who) {
  var lines = CC.wrap(question, 222, 10);
  var under = function () {
    CC.box(0, 112, 240, 48);
    lines.slice(0, 2).forEach(function (l, i) { CC.text(l, 9, 119 + i * 15, '#2a2230'); });
    if (who) speakerTag(who);
  };
  return CC.menu(options, { under: under, y: 108 - (options.length * 14 + 10) });
};

// ---------- small creature card pieces ----------
CC.typeBadge = function (type, x, y) {
  var c = CC.TYPE_COLORS[type] || CC.TYPE_COLORS.Normal, icon = CC.img('ui/type-' + type), iw = icon ? 9 : 0, w = CC.textWidth(type.toUpperCase(), 8) + 6 + iw;
  CC.rect(x, y, w, 10, c[2]); CC.rect(x + 1, y + 1, w - 2, 8, c[1]);
  if (icon) CC.g.drawImage(icon, x + 1, y + 1, 8, 8);
  CC.text(type.toUpperCase(), x + 3 + iw, y + 1, '#ffffff', { size: 8, shadow: c[2] });
  return w;
};
var STATUS_TAG = { burn: ['BRN', '#e0582a'], freeze: ['FRZ', '#5ab0e0'], shock: ['SHK', '#d8b010'], poison: ['PSN', '#9a4ac8'], sleep: ['SLP', '#8a8aa0'] };
CC.statusTag = function (st, x, y) {
  if (!st) return;
  var t = STATUS_TAG[st]; CC.rect(x, y, 20, 9, t[1]); CC.text(t[0], x + 2, y, '#ffffff', { size: 8, shadow: false });
  var icon = CC.img('ui/status-' + st);
  if (icon) CC.g.drawImage(icon, x - 10, y - 1, icon.width * 10 / icon.height, 10);
};

// ---------- party ----------
// mode 'field' (look, reorder, use items from there), 'battle' (pick who to send out), 'pick' (pick one, any)
CC.partyScreen = function (mode, opts) {
  opts = opts || {};
  return new Promise(function (resolve) {
    var sel = 0;
    var scr = {
      name: 'party', opaque: true,
      update: function () {
        var party = CC.state.party;
        if (CC.repeat('down')) { sel = (sel + 1) % party.length; CC.sfx('blip'); }
        if (CC.repeat('up')) { sel = (sel + party.length - 1) % party.length; CC.sfx('blip'); }
        if (CC.input.pressed.b && !opts.mustPick) { CC.sfx('back'); CC.pop(scr); resolve(-1); }
        if (CC.input.pressed.a) { CC.sfx('select'); scr.busy = true; scr.choose(sel).then(function (done) { scr.busy = false; if (done) { CC.pop(scr); resolve(sel); } }); }
      },
      choose: async function (i) {
        var m = CC.state.party[i];
        if (mode === 'pick') return true;
        if (mode === 'battle') {
          var c = await CC.menu(['Send out', 'Summary']);
          if (c === 1) { await CC.summary(m); return false; }
          if (c !== 0) return false;
          if (m.hp <= 0) { await CC.say(CC.mon.name(m) + ' has no strength left!'); return false; }
          if (i === opts.active) { await CC.say(CC.mon.name(m) + ' is already out!'); return false; }
          return true;
        }
        var items = ['Summary', 'Move to front'];
        var c2 = await CC.menu(items);
        if (c2 === 0) await CC.summary(m);
        if (c2 === 1 && i > 0) { CC.state.party.splice(i, 1); CC.state.party.unshift(m); sel = 0; }
        return false;
      },
      draw: function () {
        CC.rect(0, 0, 240, 160, '#5a7ab0');
        for (var yy = 0; yy < 160; yy += 8) CC.rect(0, yy, 240, 4, '#5272a8');
        CC.text(opts.title || 'Party', 8, 4, '#ffffff', { shadow: '#2a3a60' });
        CC.state.party.forEach(function (m, i) {
          var y = 18 + i * 30, on = i === sel, sp = CC.mon.sp(m), st = CC.mon.stats(m);
          CC.box(6, y, 228, 28, { fill: on ? '#fff8d0' : '#fbf3e0', edge: on ? '#e8a838' : '#c8a878' });
          CC.drawSprite(CC.creatureSprite(m.id), 24, y + 27, { scale: 0.4, sy: 1 + (on ? Math.sin(CC.time * 8) * 0.06 : 0) });
          CC.text(sp.name, 42, y + 4); CC.text('Lv ' + m.lv, 42, y + 15, '#6a5a50', { size: 9 });
          var bx = 72; sp.types.forEach(function (t) { bx += CC.typeBadge(t, bx, y + 15) + 2; });
          CC.text('HP', 140, y + 4, '#6a5a50', { size: 9 });
          CC.bar(156, y + 8, 70, m.hp / st.hp);
          CC.num(m.hp + '/' + st.hp, 226, y + 16, '#2a2230', 'right');
          CC.statusTag(m.hp <= 0 ? null : m.status, 140, y + 16);
          if (m.hp <= 0) CC.text('FAINTED', 140, y + 15, '#c83a3a', { size: 8 });
        });
        if (opts.hint) CC.text(opts.hint, 8, 142, '#ffffff', { size: 9, shadow: '#2a3a60' });
      },
    };
    CC.push(scr);
  });
};

CC.summary = function (m) {
  return new Promise(function (resolve) {
    var scr = {
      opaque: true,
      update: function () { if (CC.input.pressed.a || CC.input.pressed.b) { CC.sfx('back'); CC.pop(scr); resolve(); } },
      draw: function () {
        var sp = CC.mon.sp(m), st = CC.mon.stats(m), col = CC.TYPE_COLORS[sp.types[0]];
        CC.rect(0, 0, 240, 160, col[2]); CC.rect(0, 0, 96, 160, col[1]);
        CC.drawSprite(CC.creatureSprite(m.id), 48, 84, { sy: 1 + Math.sin(CC.time * 3) * 0.03 });
        CC.text(sp.name, 8, 92, '#ffffff', { shadow: '#00000060' });
        CC.text('Lv ' + m.lv, 8, 104, '#ffffff', { size: 9, shadow: '#00000060' });
        var bx = 8; sp.types.forEach(function (t) { bx += CC.typeBadge(t, bx, 116) + 2; });
        var next = CC.mon.xpFor(m.lv + 1) - m.xp;
        CC.text(m.lv >= 50 ? 'Max level' : 'Next Lv: ' + next + ' XP', 8, 130, '#ffffff', { size: 9, shadow: '#00000060' });
        CC.bar(8, 142, 80, m.lv >= 50 ? 1 : (m.xp - CC.mon.xpFor(m.lv)) / (CC.mon.xpFor(m.lv + 1) - CC.mon.xpFor(m.lv)), '#48a8e8');
        CC.box(100, 6, 134, 56);
        [['HP', m.hp + '/' + st.hp], ['Attack', st.atk], ['Defense', st.def], ['Speed', st.spd]].forEach(function (r, i) {
          CC.text(r[0], 108, 11 + i * 12, '#6a5a50', { size: 9 }); CC.num(String(r[1]), 226, 13 + i * 12, '#2a2230', 'right');
        });
        CC.box(100, 66, 134, 88);
        m.moves.forEach(function (mv, i) {
          var d = CC.MOVES[mv.id], y = 72 + i * 20;
          CC.text(d.name, 108, y, '#2a2230', { size: 9 });
          CC.text('PP ' + mv.pp + '/' + d.pp, 226, y, '#6a5a50', { size: 9, align: 'right' });
          CC.text((d.power ? 'Power ' + d.power : 'Effect') + '  ' + (d.type || ''), 108, y + 9, '#8a7a70', { size: 9 });
        });
      },
    };
    CC.push(scr);
  });
};

// ---------- bag ----------
// cube: its catch bonus (master always catches). icon: a picture key.
CC.ITEMS = {
  cube: { name: 'Basic Cube', price: 50, cube: 0, icon: 'ui/cube', info: 'Throw it at a weakened wild creature to catch it.' },
  great: { name: 'Great Cube', price: 150, cube: 15, icon: 'ui/cube-great', info: 'A sturdier cube with a silver band. Better odds than a Basic Cube.' },
  ultra: { name: 'Ultra Cube', price: 400, cube: 30, icon: 'ui/cube-ultra', info: 'A gold-banded cube. Much better odds.' },
  master: { name: 'Master Cube', price: 0, cube: 999, icon: 'ui/cube-master', info: 'The legendary cube. It never fails.' },
  potion: { name: 'Potion', price: 60, heal: 30, icon: 'items/potion', info: 'Restores 30 HP to one creature.' },
  superpotion: { name: 'Super Potion', price: 180, heal: 80, icon: 'items/super-potion', info: 'Restores 80 HP to one creature.' },
  tonic: { name: 'Tonic', price: 320, heal: 150, icon: 'items/tonic', info: 'Restores 150 HP to one creature.' },
  fulltonic: { name: 'Full Tonic', price: 700, heal: 999, cure: true, icon: 'items/full-tonic', info: 'Restores all HP and cures any status.' },
  cureherb: { name: 'Cure Herb', price: 100, cure: true, icon: 'items/cure-herb', info: 'Cures sleep, poison, burn, freeze or shock.' },
  revive: { name: 'Revive', price: 900, revive: true, icon: 'items/revive', info: 'Wakes a fainted creature with half its HP.' },
  sunshard: { name: 'Sun Shard', price: 0, shard: true, icon: 'items/sun-shard', info: 'A warm golden shard. Some creatures evolve when they touch it.' },
  moonshard: { name: 'Moon Shard', price: 0, shard: true, icon: 'items/moon-shard', info: 'A cool silver shard. Some creatures evolve when they touch it.' },
  // key items: shown while their flag is set, never sold or used up
  whistle: { name: 'Wooden Whistle', key: 'fly', icon: 'items/whistle', info: 'Blow it to call Timberowl and fly to a place you have been.' },
  vaultkey: { name: 'Vault Key', key: 'vaultKey', icon: 'items/vault-key', info: 'Opens the Cube Vault from the menu, anywhere.' },
};
CC.CUBE_KINDS = ['cube', 'great', 'ultra', 'master'];
CC.bagScreen = async function () {
  while (true) {
    var keys = Object.keys(CC.ITEMS).filter(function (k) { var it = CC.ITEMS[k]; return it.key ? CC.state.flags[it.key] : CC.state.bag[k] > 0; });
    if (!keys.length) { await CC.say('Your bag is empty.'); return; }
    var c = await CC.menu(keys.map(function (k) { var it = CC.ITEMS[k]; return { label: it.name, right: it.key ? '' : 'x' + CC.state.bag[k], icon: it.icon }; }), { title: 'Bag', w: 150 });
    if (c < 0) return;
    var k = keys[c], it = CC.ITEMS[k];
    if (k === 'whistle') {
      if (CC.MAPS[CC.state.map].indoors) { await CC.say('Timberowl can\'t fit in here. Try it outside!'); continue; }
      CC.sfx('select'); await CC.say('You blew the Wooden Whistle. Timberowl swoops down!'); await CC.flyScreen(); return;
    }
    if (it.heal || it.cure || it.revive || it.shard) {
      var i = await CC.partyScreen('pick', { title: 'Use a ' + it.name + ' on...' });
      if (i < 0) continue;
      var m = CC.state.party[i], max = CC.mon.maxHp(m), used = CC.useItemOn(k, m);
      if (typeof used === 'string') { await CC.say(used); continue; }
      if (!CC.dev.infItems) CC.state.bag[k]--;
      if (it.shard) { await CC.evolveScene(m); continue; }
      CC.sfx('heal'); await CC.say(used.text);
    } else await CC.say(it.info);
  }
};

// what an item does to a creature: a string says why it can't be used, else { text }
CC.useItemOn = function (k, m) {
  var it = CC.ITEMS[k], max = CC.mon.maxHp(m), name = CC.mon.name(m);
  if (it.shard) {
    var e = CC.CREATURES[m.id].evo;
    if (!e || e.at !== k) return 'Nothing happened. ' + name + ' doesn\'t react to the ' + it.name + '.';
    return { text: '' };
  }
  if (it.revive) {
    if (m.hp > 0) return name + ' hasn\'t fainted.';
    m.hp = Math.ceil(max / 2); m.status = null; return { text: name + ' woke up!' };
  }
  if (m.hp <= 0) return 'A ' + it.name + ' can\'t wake a fainted creature.';
  if (it.heal && m.hp >= max && !(it.cure && m.status)) return name + ' is already at full HP.';
  if (!it.heal && !m.status) return name + ' is feeling fine.';
  var before = m.hp, parts = [];
  if (it.heal) { m.hp = Math.min(max, m.hp + it.heal); if (m.hp > before) parts.push('got back ' + (m.hp - before) + ' HP'); }
  if (it.cure && m.status) { m.status = null; m.sleep = 0; parts.push('is cured'); }
  return { text: name + ' ' + parts.join(' and ') + '.' };
};

// a shop: stock is a list of item keys; who is the shopkeeper
CC.shopScreen = async function (stock, who) {
  who = who || 'Pip';
  stock = stock || ['cube', 'potion'].concat(CC.state.flags.trial1 ? ['great', 'superpotion', 'cureherb'] : []).concat(CC.state.flags.trialCave ? ['tonic'] : []);
  while (true) {
    var c = await CC.menu(stock.map(function (k) { return { label: CC.ITEMS[k].name, right: CC.ITEMS[k].price + 'c', icon: CC.ITEMS[k].icon }; }),
      { title: 'Coins: ' + CC.state.coins, w: 140, x: 96, y: 8 });
    if (c < 0) return;
    var it = CC.ITEMS[stock[c]];
    var qty = await CC.menu(['1', '5', '10'].map(function (n) { return { label: 'x' + n, right: (it.price * n) + 'c', disabled: it.price * n > CC.state.coins }; }), { title: it.name, x: 140, y: 40, w: 96 });
    if (qty < 0) continue;
    var n = [1, 5, 10][qty];
    CC.state.coins -= it.price * n; CC.state.bag[stock[c]] = (CC.state.bag[stock[c]] || 0) + n;
    CC.sfx('buy'); await CC.say('Here you go! ' + n + ' x ' + it.name + '.', { who: who });
  }
};

// ---------- the Cube Vault ----------
CC.vaultScreen = async function () {
  while (true) {
    var c = await CC.menu(['Take out', 'Put away', 'Done'], { title: 'Cube Vault (' + CC.state.vault.length + ')', w: 130, x: 104, y: 20 });
    if (c < 0 || c === 2) return;
    if (c === 0) {
      if (!CC.state.vault.length) { await CC.say('The Vault is empty.'); continue; }
      var items = CC.state.vault.map(function (m) { return { label: CC.mon.name(m), right: 'Lv ' + m.lv }; });
      var v = await CC.menu(items, { title: 'Take out which?', w: 150, x: 84, y: 8 });
      if (v < 0) continue;
      var m = CC.state.vault[v];
      if (CC.state.party.length < 4) {
        CC.state.vault.splice(v, 1); CC.state.party.push(m);
        await CC.say(CC.mon.name(m) + ' joined your party.');
      } else {
        var p = await CC.partyScreen('pick', { title: 'Swap ' + CC.mon.name(m) + ' with...', hint: 'Your party is full: pick one to put away.' });
        if (p < 0) continue;
        var out = CC.state.party[p];
        CC.state.party[p] = m; CC.state.vault[v] = out;
        await CC.say(CC.mon.name(m) + ' joined, and ' + CC.mon.name(out) + ' went into the Vault.');
      }
    } else {
      if (CC.state.party.length <= 1) { await CC.say('You need at least one creature with you.'); continue; }
      var q = await CC.partyScreen('pick', { title: 'Put away which?' });
      if (q < 0) continue;
      var mm = CC.state.party.splice(q, 1)[0];
      if (CC.firstHealthy() < 0) { CC.state.party.splice(q, 0, mm); await CC.say('Keep at least one creature that can fight!'); continue; }
      CC.state.vault.push(mm);
      await CC.say(CC.mon.name(mm) + ' went into the Vault.');
    }
  }
};

// ---------- learning a new move ----------
CC.learnMove = async function (m, mv) {
  var name = CC.mon.name(m), mn = CC.MOVES[mv].name;
  if (CC.mon.knows(m, mv)) return;
  if (m.moves.length < 4) {
    m.moves.push({ id: mv, pp: CC.MOVES[mv].pp }); CC.sfx('levelup');
    await CC.say(name + ' learned ' + mn + '!'); return;
  }
  while (true) {
    await CC.say(name + ' wants to learn ' + mn + ', but already knows 4 moves.');
    var items = m.moves.map(function (x) { return CC.MOVES[x.id].name; }).concat(['Don\'t learn ' + mn]);
    var c = await CC.ask('Forget which move for ' + mn + '?', items);
    if (c >= 0 && c < 4) {
      var old = CC.MOVES[m.moves[c].id].name;
      m.moves[c] = { id: mv, pp: CC.MOVES[mv].pp }; CC.sfx('levelup');
      await CC.say('1, 2, and... poof! ' + name + ' forgot ' + old + ' and learned ' + mn + '!'); return;
    }
    if (await CC.yesNo('Give up on learning ' + mn + '?')) { await CC.say(name + ' did not learn ' + mn + '.'); return; }
  }
};

// ---------- evolution ----------
// Shows the two shapes flickering faster and faster. B stops it. Resolves to true if it evolved.
CC.evolveScene = function (m) {
  return new Promise(function (resolve) {
    var fromId = m.id, toId = CC.CREATURES[m.id].evo.into, t = 0, phase = 'intro', cancelled = false, showNew = false;
    var scr = {
      opaque: true,
      update: function (dt) {
        t += dt;
        if (phase === 'flicker' && CC.input.pressed.b) { cancelled = true; phase = 'done'; }
        if (phase === 'flicker') {
          var rate = 1.6 + t * t * 0.9; showNew = Math.sin(t * rate * Math.PI) > 0;
          if (Math.random() < 0.3) CC.fx.add({ x: CC.rand(60, 180), y: 150, vx: 0, vy: -CC.rand(30, 70), life: 1.5, kind: 'star', color: '#ffffff', size: 3 });
          if (t > 6) { phase = 'flash'; t = 0; CC.sfx('evolve'); }
        } else if (phase === 'flash' && t > 1.2) phase = 'done';
      },
      draw: function () {
        CC.rect(0, 0, 240, 160, '#1e1a30');
        for (var i = 0; i < 12; i++) { var a = CC.time * 0.4 + i * Math.PI / 6; CC.g.fillStyle = 'rgba(120,110,200,0.12)'; CC.g.beginPath(); CC.g.moveTo(120, 76); CC.g.arc(120, 76, 200, a, a + 0.18); CC.g.fill(); }
        var id = phase === 'flash' || (phase === 'done' && !cancelled) ? toId : phase === 'flicker' && showNew ? toId : fromId;
        var sil = phase === 'flicker' ? '#ffffff' : null;
        CC.drawSprite(CC.creatureSprite(id), 120, 100, { scale: 1.25, flash: sil, id: id, sy: 1 + Math.sin(CC.time * 4) * 0.03 });
        if (phase === 'flash') { CC.g.globalAlpha = Math.max(0, 1 - t); CC.rect(0, 0, 240, 160, '#ffffff'); CC.g.globalAlpha = 1; }
      },
    };
    CC.push(scr);
    (async function () {
      CC.sfx('statup');
      await CC.say('What? ' + CC.CREATURES[fromId].name + ' is evolving!', { auto: 1.2 });
      phase = 'flicker'; t = 0;
      await CC.until(function () { return phase === 'done'; });
      if (cancelled) {
        await CC.say('Huh? ' + CC.CREATURES[fromId].name + ' stopped evolving.');
        CC.pop(scr); resolve(false); return;
      }
      var newMoves = CC.mon.evolve(m);
      await CC.say('Congratulations! ' + CC.CREATURES[fromId].name + ' evolved into ' + CC.CREATURES[toId].name + '!');
      CC.markCaught(toId);
      for (var i = 0; i < newMoves.length; i++) await CC.learnMove(m, newMoves[i]);
      CC.pop(scr); resolve(true);
    })();
  });
};
