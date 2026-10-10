/* ---------- menu: life summary and the passport ---------- */
function renderLife() {
  const box = $('#mLife'); if (!box || !S) return;
  box.innerHTML = '';
  const rows = [
    ['Mood', Math.round(S.mood) + ' · ' + moodWord(S.mood)],
    ['Savings', fmt(S.bank.bal) + (S.bank.auto ? ' · autopay on' : '')],
    ['Hourly rate', fmt(Math.round(curRate() * 100) / 100) + (S.skill ? ' (+' + S.skill * 3 + '% from books)' : '')],
    ['Clean clothes', S.clean >= 5 ? 'None left' : (5 - S.clean) + ' day' + (5 - S.clean === 1 ? '' : 's') + ' left']
  ];
  const own = [];
  if (S.own.bike) own.push('a bike'); if (S.own.umbrella) own.push('an umbrella'); if (S.own.coffee) own.push('a coffee maker'); if (S.own.mattress) own.push('a memory-foam mattress');
  if (S.own.curtains) own.push('blackout curtains'); if (S.own.plants) own.push('houseplants'); if (S.own.records) own.push('a record player'); if (S.own.chair) own.push('a reading chair');
  const st = el('div', 'life');
  rows.forEach(r => { const d = el('div'); d.appendChild(el('small', '', r[0])); d.appendChild(el('b', '', r[1])); st.appendChild(d); });
  box.appendChild(st);
  if (own.length) box.appendChild(el('p', 'own', 'You own ' + own.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.'));
  const n = PASSPORT.filter(p => S.stamps[p]).length;
  const hd = el('div', 'pp-head'); hd.appendChild(el('b', '', 'Town passport')); hd.appendChild(el('small', '', n + ' of ' + PASSPORT.length + ' stamps · tap a place to walk there'));
  box.appendChild(hd);
  const grid = el('div', 'pp');
  PASSPORT.forEach(id => {
    const b = el('button', 'stamp' + (S.stamps[id] ? ' got' : '')); b.type = 'button'; b.dataset.go = id;
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; b.appendChild(cv);
    drawStampArt(cv.getContext('2d'), id, !!S.stamps[id]);
    b.appendChild(el('span', '', placeTitle(id)));
    const open = id === 'park' || id === 'apartment' || isOpen(id);
    b.appendChild(el('small', open ? 'on' : '', open ? 'Open now' : 'Closed'));
    grid.appendChild(b);
  });
  box.appendChild(grid);
}
function goToPlace(id) {
  if (!S || G.skip) return;
  closeMenu();
  if (S.scene === 'int') { G.inside = null; $('#panel').hidden = true; leaveInterior(); }
  else if (S.scene === 'school') { G.inside = null; $('#panel').hidden = true; leaveSchool(); }
  else if (G.inside) closePanel(true);
  const d = DOORS[id];
  if (!d) return;
  walkTo(d.x, d.y, id);
  toast('Heading to ' + placeTitle(id) + (id !== 'park' && id !== 'apartment' && !isOpen(id) ? '. It is closed right now.' : '.'), '');
}
function lifeGoal() {
  if (toothOn()) return 'Your tooth aches. See Bright Smile Dental, or grab a pain reliever at the pharmacy for now.';
  if (S.mood < 30) return 'You are feeling low. Catch a movie, read a book, get a haircut or chat with someone in town.';
  if (S.clean >= 5) return 'You are out of clean clothes. Do a load at Suds Laundromat.';
  return '';
}
