/* a glass bus shelter with a route sign; `on` is after dark, when the poster box glows */
function wPaintBus(g, on) {
  const se = season();
  g.fillStyle = 'rgba(8,12,24,.26)'; g.beginPath(); g.ellipse(2, 4, 44, 5.4, 0, 0, 7); g.fill();
  // back glass: sky reflection, frosted lower band, mullions
  const gg = g.createLinearGradient(0, -48, 0, -8);
  if (on) { gg.addColorStop(0, 'rgba(120,150,200,.55)'); gg.addColorStop(1, 'rgba(70,96,140,.5)'); } else { gg.addColorStop(0, 'rgba(190,226,244,.58)'); gg.addColorStop(1, 'rgba(150,200,226,.46)'); }
  g.fillStyle = gg; g.fillRect(-29, -48, 58, 40);
  g.fillStyle = on ? 'rgba(210,230,255,.16)' : 'rgba(255,255,255,.2)'; g.fillRect(-29, -18, 58, 10);
  g.fillStyle = 'rgba(255,255,255,.16)'; for (let x = -27; x < 27; x += 5) g.fillRect(x, -17, 1.2, 8);
  g.fillStyle = 'rgba(30,40,50,.5)'; g.fillRect(-29, -18.6, 58, 1); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-29, -19.6, 58, 0.8);
  g.fillStyle = 'rgba(255,255,255,.34)'; g.beginPath(); g.moveTo(-24, -8); g.lineTo(-8, -48); g.lineTo(2, -48); g.lineTo(-14, -8); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(8, -8); g.lineTo(18, -44); g.lineTo(22, -44); g.lineTo(12, -8); g.fill();
  g.fillStyle = 'rgba(40,52,64,.7)'; g.fillRect(-9.6, -48, 1.8, 40);
  // timetable
  g.fillStyle = '#f4f1e6'; g.fillRect(-26, -42, 13, 18); g.fillStyle = '#2a6f97'; g.fillRect(-26, -42, 13, 3.4); g.fillStyle = 'rgba(40,50,60,.7)'; for (let k = 0; k < 6; k++) g.fillRect(-24.6, -37.4 + k * 2.4, 6 + (k % 3) * 2, 0.9);
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 0.7; g.strokeRect(-26, -42, 13, 18);
  // lit poster box
  const pg = g.createLinearGradient(0, -44, 0, -14); pg.addColorStop(0, on ? '#fff6dc' : '#f6f1e7'); pg.addColorStop(1, on ? '#ffe9b0' : '#e8e2d2');
  g.fillStyle = '#2b3138'; g.fillRect(8, -46, 21, 34); g.fillStyle = pg; g.fillRect(9.4, -44.6, 18.2, 31.2);
  g.fillStyle = '#e76f51'; g.fillRect(11, -42.4, 14.6, 12); g.fillStyle = '#f4a261'; g.beginPath(); g.arc(18, -36, 3.6, 0, 7); g.fill(); g.fillStyle = '#2a6f97'; g.fillRect(11, -27.4, 14.6, 3); g.fillRect(11, -22.6, 10, 3); g.fillRect(11, -18.4, 12, 2);
  if (on) { g.fillStyle = 'rgba(255,240,190,.28)'; g.fillRect(9.4, -44.6, 18.2, 31.2); }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(9.4, -44.6, 18.2, 1);
  // posts
  const pst = g.createLinearGradient(-4, 0, 4, 0); pst.addColorStop(0, '#6a7680'); pst.addColorStop(0.45, '#3d4852'); pst.addColorStop(1, '#262e36');
  g.fillStyle = pst; g.fillRect(-34, -56, 4.4, 58); g.fillRect(29.6, -56, 4.4, 58);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-34, -56, 1, 58); g.fillRect(29.6, -56, 1, 58);
  g.fillStyle = '#1f262d'; g.fillRect(-35, 0, 6.4, 2.4); g.fillRect(28.6, 0, 6.4, 2.4);
  // roof slab with thickness, gutter and a shadow onto the glass
  const rg = g.createLinearGradient(0, -66, 0, -52); rg.addColorStop(0, '#3a85b8'); rg.addColorStop(1, '#1f5a86');
  wFadeV(g, -32, -53, 64, 12, 0.3, 0, '10,10,26');
  g.fillStyle = 'rgba(0,0,0,.26)'; rr(g, -38, -57.4, 76, 5, 2.4); g.fill();
  g.fillStyle = rg; rr(g, -38.4, -62, 76.8, 9.4, 3); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-36, -61.6, 72, 1.6); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-36, -54.4, 72, 1.2);
  g.fillStyle = '#9aa3aa'; g.fillRect(-38, -53.4, 76, 1.4);
  g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = -30; x < 30; x += 12) g.fillRect(x, -60, 6, 1);
  if (se === 'winter') { g.fillStyle = '#f6fafd'; g.beginPath(); g.moveTo(-38, -61); g.quadraticCurveTo(-30, -66.4, -18, -64); g.quadraticCurveTo(0, -68, 18, -64); g.quadraticCurveTo(30, -66.4, 38, -61); g.lineTo(38, -58); g.lineTo(-38, -58); g.fill(); g.fillStyle = 'rgba(225,242,255,.9)'; for (let x = -34; x < 34; x += 9) { g.beginPath(); g.moveTo(x, -53.4); g.lineTo(x + 2, -53.4); g.lineTo(x + 1, -49.4 - (x % 3)); g.fill(); } }
  // bench
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-24, -12.4, 30, 2);
  const bgd = g.createLinearGradient(0, -17, 0, -13); bgd.addColorStop(0, '#a8744c'); bgd.addColorStop(1, '#7a4f2e'); g.fillStyle = bgd; g.fillRect(-24, -17, 30, 4.2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-24, -17, 30, 0.9);
  g.fillStyle = 'rgba(40,20,8,.2)'; for (let k = 0; k < 4; k++) g.fillRect(-22 + k * 7, -15.6, 4, 0.6);
  g.fillStyle = '#2b3138'; g.fillRect(-22, -13, 3, 13); g.fillRect(1, -13, 3, 13); g.fillRect(-23, -1, 5, 1.4); g.fillRect(0, -1, 5, 1.4);
  if (se === 'winter') { g.fillStyle = '#f6fafd'; g.fillRect(-24, -18.4, 30, 1.8); }
  // route sign on a pole
  g.fillStyle = '#4a545c'; g.fillRect(-1, -72, 2.2, 14); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-1, -72, 0.8, 14);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(1, -80.6, 12.4, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -82, 12, 0, 7); g.fill();
  const sg = g.createLinearGradient(0, -92, 0, -72); sg.addColorStop(0, '#3a85b8'); sg.addColorStop(1, '#1f5a86'); g.fillStyle = sg; g.beginPath(); g.arc(0, -82, 10, 0, 7); g.fill();
  g.fillStyle = '#fff'; rr(g, -6, -88, 12, 10, 2); g.fill();
  g.fillStyle = '#2a6f97'; g.fillRect(-4.5, -86, 9, 3.5); g.fillRect(-4, -80, 2, 1.6); g.fillRect(2, -80, 2, 1.6);
  g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(0, -82, 11, 3.5, 4.9); g.lineTo(0, -82); g.fill();
}
