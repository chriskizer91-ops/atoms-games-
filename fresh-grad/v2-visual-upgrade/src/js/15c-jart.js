/* ============================ shift art: workplace illustrations and the rank medallion ============================
   Small inline-SVG pictures for the shift intro cards (no text baked in; purely decorative) and the medallion on the result card. */
const JART = (function () {
  const X = (a, b, c) => hash01(a, b, c);
  const VB = '<svg viewBox="0 0 520 124" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">';
  const defs = (id, roof, acc) => '<defs>' +
    '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(roof, 0.12) + '"/><stop offset="1" stop-color="' + shade(roof, -0.62) + '"/></linearGradient>' +
    '<radialGradient id="' + id + 'gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + acc + '" stop-opacity=".55"/><stop offset="1" stop-color="' + acc + '" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="' + id + 'fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
    '</defs>';
  const bokeh = (n, seed, acc, y0, y1) => { let s = ''; for (let i = 0; i < n; i++) s += '<circle cx="' + (X(i, seed, 1) * 520).toFixed(0) + '" cy="' + (y0 + X(i, seed, 2) * (y1 - y0)).toFixed(0) + '" r="' + (3 + X(i, seed, 3) * 9).toFixed(1) + '" fill="' + acc + '" opacity="' + (0.06 + X(i, seed, 4) * 0.12).toFixed(2) + '"/>'; return s; };
  const art = {
    cs(roof, acc) {
      const id = 'hcs';
      let s = VB + defs(id, roof, acc) + '<rect width="520" height="124" fill="url(#' + id + 'bg)"/>';
      // night window with a tiny city
      s += '<rect x="22" y="14" width="118" height="70" rx="5" fill="#0a1220" stroke="#ffffff22"/>';
      for (let i = 0; i < 16; i++) { const x = 28 + (i % 8) * 14, h = 16 + X(i, 1, 1) * 36; s += '<rect x="' + x + '" y="' + (82 - h) + '" width="10" height="' + h.toFixed(0) + '" fill="#142034"/>'; for (let k = 0; k < 5; k++) if (X(i, k, 9) > 0.55) s += '<rect x="' + (x + 2 + (k % 2) * 4) + '" y="' + (82 - h + 3 + Math.floor(k / 2) * 7) + '" width="2.4" height="2.8" fill="#ffd27a" opacity=".85"/>'; }
      s += '<path d="M81 14V84M22 49H140" stroke="#ffffff22"/>';
      s += '<ellipse cx="268" cy="62" rx="150" ry="62" fill="url(#' + id + 'gl)"/>';
      // main monitor
      s += '<rect x="194" y="14" width="150" height="86" rx="7" fill="#0e1522" stroke="#ffffff30"/><rect x="200" y="20" width="138" height="72" rx="3" fill="#0a111c"/>';
      s += '<rect x="200" y="20" width="138" height="9" fill="#141d2c"/><circle cx="208" cy="24.500" r="1.800" fill="#ff6b6b"/><circle cx="214" cy="24.500" r="1.800" fill="#ffb54a"/><circle cx="220" cy="24.500" r="1.800" fill="#5be3a0"/>';
      const cols = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#82aaff'];
      for (let i = 0; i < 7; i++) { const w = 22 + X(i, 2, 5) * 70, ind = (i % 3 === 1 || i % 3 === 2) ? 9 : 0; s += '<rect x="' + (222 + ind) + '" y="' + (36 + i * 8.2).toFixed(1) + '" width="' + w.toFixed(0) + '" height="3.4" rx="1.700" fill="' + cols[(i * 2) % 5] + '" opacity=".85"/><rect x="206" y="' + (36 + i * 8.2).toFixed(1) + '" width="8" height="3.400" rx="1.700" fill="#ffffff22"/>'; }
      s += '<rect x="213" y="60.500" width="118" height="8" fill="' + acc + '" opacity=".14"/><circle cx="318" cy="64.500" r="5" fill="#ff6b6b"/><path d="M316 62.500l4 4M320 62.500l-4 4" stroke="#fff" stroke-width="1" stroke-linecap="round"/>';
      s += '<rect x="258" y="100" width="22" height="6" fill="#1a2434"/><rect x="238" y="105" width="62" height="3.500" rx="1.700" fill="#2a3850"/>';
      // laptop to the left
      s += '<path d="M64 92 74 62h58l10 30z" fill="#101a2a" stroke="#ffffff28"/><path d="M78 66h50l6 20H72z" fill="#0b1422"/><path d="M84 71h26M84 77h38M84 82h18" stroke="' + acc + '" stroke-width="2.200" stroke-linecap="round" opacity=".8"/>';
      // desk, lamp, mug
      s += '<rect x="0" y="104" width="520" height="20" fill="#0a111b"/><rect x="0" y="104" width="520" height="2" fill="#ffffff22"/>';
      s += '<path d="M404 104V54l24-18" stroke="#2c394d" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M420 34l26 8-10 14z" fill="#35465f"/><path d="M426 44l50 54H400z" fill="#ffd9a0" opacity=".10"/>';
      s += '<rect x="468" y="82" width="22" height="22" rx="4" fill="#e9e4d8"/><path d="M490 88h5a6 6 0 0 1 0 12h-5" fill="none" stroke="#e9e4d8" stroke-width="3"/><rect x="470" y="85" width="18" height="4" fill="#6b4a30"/>';
      s += '<path d="M474 76q-4-8 0-14M482 76q-4-8 0-14" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>';
      s += bokeh(10, 3, acc, 8, 90) + '<rect width="520" height="124" fill="url(#' + id + 'fl)"/></svg>';
      return s;
    },
    eng(roof, acc) {
      const id = 'hen';
      let s = VB + '<defs><linearGradient id="' + id + 'bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16406b"/><stop offset="1" stop-color="#0a2140"/></linearGradient><linearGradient id="' + id + 'mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3edf7"/><stop offset=".5" stop-color="#8aa0b8"/><stop offset="1" stop-color="#4a5c72"/></linearGradient></defs>';
      s += '<rect width="520" height="124" fill="url(#' + id + 'bg)"/>';
      s += '<g stroke="#9fd2ff" stroke-opacity=".16" stroke-width="1">';
      for (let x = 0; x <= 520; x += 20) s += '<path d="M' + x + ' 0V124"/>';
      for (let y = 0; y <= 124; y += 20) s += '<path d="M0 ' + y + 'H520"/>';
      s += '</g><g stroke="#9fd2ff" stroke-opacity=".28">';
      for (let x = 0; x <= 520; x += 100) s += '<path d="M' + x + ' 0V124"/>';
      s += '</g>';
      // big gear outline
      let g = ''; const cx = 440, cy = 66, R = 52;
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g += '<rect x="' + (cx - 6) + '" y="' + (cy - R - 9) + '" width="12" height="14" rx="2" transform="rotate(' + (a * 57.3).toFixed(1) + ' ' + cx + ' ' + cy + ')"/>'; }
      s += '<g fill="none" stroke="#bfe3ff" stroke-opacity=".5" stroke-width="1.600">' + g + '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/><circle cx="' + cx + '" cy="' + cy + '" r="22"/><path d="M' + (cx - 70) + ' ' + cy + 'H' + (cx + 70) + 'M' + cx + ' ' + (cy - 70) + 'V' + (cy + 70) + '" stroke-dasharray="10 4 2 4"/></g>';
      // pipe run: pump to actuator
      const pth = 'M48 84H130Q150 84 150 64V50Q150 36 164 36H258Q272 36 272 52V70Q272 86 288 86H352';
      s += '<path d="' + pth + '" fill="none" stroke="#04101f" stroke-width="20" stroke-linejoin="round"/><path d="' + pth + '" fill="none" stroke="url(#' + id + 'mt)" stroke-width="14" stroke-linejoin="round"/>';
      s += '<path d="' + pth + '" fill="none" stroke="' + acc + '" stroke-width="7" stroke-linejoin="round" opacity=".92"/><path d="' + pth + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 12" stroke-linecap="round"/>';
      [[130, 84, 90], [150, 56, 0], [164, 36, 90], [258, 36, 90], [272, 56, 0], [288, 86, 90]].forEach(f => { s += '<rect x="' + (f[0] - 3) + '" y="' + (f[1] - 12) + '" width="6" height="24" rx="1.500" fill="#cfdcea" stroke="#0a1b30" transform="rotate(' + f[2] + ' ' + f[0] + ' ' + f[1] + ')"/>'; });
      // pump + actuator
      s += '<rect x="22" y="70" width="34" height="30" rx="6" fill="#26405f" stroke="#bfe3ff" stroke-opacity=".6"/><circle cx="39" cy="85" r="9" fill="#0a1b30" stroke="#bfe3ff"/><path d="M39 85 44 79" stroke="' + acc + '" stroke-width="2" stroke-linecap="round"/>';
      s += '<rect x="350" y="70" width="54" height="32" rx="6" fill="#26405f" stroke="#bfe3ff" stroke-opacity=".6"/><rect x="404" y="82" width="34" height="8" fill="#cfdcea"/><path d="M366 78v16M376 78v16" stroke="#bfe3ff" stroke-opacity=".5"/>';
      // dimension line
      s += '<g stroke="#ffffff" stroke-opacity=".6" stroke-width="1.200"><path d="M48 112H352M48 106V118M352 106V118M48 112l8-3.500v7zM352 112l-8-3.500v7z" fill="#fff" fill-opacity=".6"/></g>';
      s += '<g fill="#ffffff" fill-opacity=".5"><rect x="190" y="108" width="52" height="8" rx="2"/></g><rect x="190" y="108" width="52" height="8" fill="#0a2140"/><path d="M196 112h40" stroke="#bfe3ff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>';
      s += '</svg>';
      return s;
    },
    nurse(roof, acc) {
      const id = 'hnu';
      let s = VB + defs(id, roof, acc) + '<rect width="520" height="124" fill="url(#' + id + 'bg)"/>';
      s += '<ellipse cx="410" cy="56" rx="130" ry="60" fill="url(#' + id + 'gl)"/>';
      // wall cross
      s += '<circle cx="64" cy="48" r="30" fill="#fff" opacity=".10"/><path d="M58 32h12v10h10v12H70v10H58V54H48V42h10z" fill="#fff" opacity=".35"/>';
      // window blind
      s += '<rect x="112" y="14" width="76" height="62" rx="4" fill="#0e1a2a" stroke="#ffffff30"/>';
      for (let i = 0; i < 7; i++) s += '<rect x="114" y="' + (17 + i * 8.5) + '" width="72" height="4.500" fill="#d9e4ee" opacity="' + (0.5 - i * 0.04).toFixed(2) + '"/>';
      // bed + iv pole
      s += '<rect x="214" y="68" width="150" height="14" rx="5" fill="#e8eef2"/><rect x="214" y="64" width="46" height="12" rx="6" fill="#fff"/><path d="M220 82v22M358 82v22" stroke="#7f8ea0" stroke-width="4" stroke-linecap="round"/><rect x="214" y="80" width="150" height="6" fill="#c9444f" opacity=".7"/>';
      s += '<path d="M196 104V30M184 30h24" stroke="#c4d0dc" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="186" y="30" width="20" height="30" rx="7" fill="#bfe8ff" opacity=".55" stroke="#fff" stroke-opacity=".6"/><rect x="190" y="46" width="12" height="11" rx="4" fill="#7fd0ff" opacity=".9"/><path d="M196 60c0 14 10 20 22 22" stroke="#bfe8ff" stroke-width="1.600" fill="none" opacity=".8"/>';
      // monitor with ECG
      s += '<rect x="386" y="14" width="116" height="74" rx="8" fill="#101923" stroke="#ffffff30"/><rect x="392" y="20" width="104" height="62" rx="4" fill="#04100c"/>';
      s += '<path d="M396 56h20l4-4 4 4h6l4-20 4 34 4-14h6l4-8 4 8h36" fill="none" stroke="#59f0a0" stroke-width="2.200" stroke-linejoin="round" stroke-linecap="round"/><path d="M396 56h20l4-4 4 4h6l4-20 4 34 4-14h6l4-8 4 8h36" fill="none" stroke="#59f0a0" stroke-width="6" opacity=".18" stroke-linejoin="round" stroke-linecap="round"/>';
      s += '<rect x="400" y="30" width="5" height="9" rx="1" fill="#59f0a0"/><rect x="408" y="30" width="5" height="9" rx="1" fill="#59f0a0"/><rect x="470" y="28" width="18" height="6" rx="3" fill="#5ad2ff" opacity=".8"/><circle cx="484" cy="74" r="3" fill="#ff6b7a"/>';
      s += '<rect x="0" y="104" width="520" height="20" fill="#0a111b"/><rect x="0" y="104" width="520" height="2" fill="#ffffff22"/>';
      s += bokeh(8, 5, '#fff', 6, 90) + '<rect width="520" height="124" fill="url(#' + id + 'fl)"/></svg>';
      return s;
    },
    biz(roof, acc) {
      const id = 'hbz';
      let s = VB + '<defs><linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a8a"/><stop offset=".55" stop-color="#c0668a"/><stop offset="1" stop-color="#ffb36b"/></linearGradient><linearGradient id="' + id + 'ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + acc + '" stop-opacity="0"/><stop offset="1" stop-color="' + acc + '"/></linearGradient><radialGradient id="' + id + 'sn" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c0"/><stop offset="1" stop-color="#ffd89a" stop-opacity="0"/></radialGradient></defs>';
      s += '<rect width="520" height="124" fill="url(#' + id + 'bg)"/><circle cx="100" cy="86" r="52" fill="url(#' + id + 'sn)"/><circle cx="100" cy="88" r="20" fill="#fff4c9" opacity=".9"/>';
      // far and near skylines
      let far = '', near = '';
      for (let i = 0; i < 22; i++) { const h = 24 + X(i, 4, 1) * 44, x = i * 25 - 6; far += '<rect x="' + x + '" y="' + (124 - h).toFixed(0) + '" width="24" height="' + h.toFixed(0) + '" fill="#4a2f66" opacity=".62"/>'; }
      for (let i = 0; i < 11; i++) {
        const h = 40 + X(i, 5, 2) * 62, x = i * 50 - 8, w = 38 + X(i, 6, 3) * 8;
        near += '<rect x="' + x + '" y="' + (124 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#2a1a40"/>';
        for (let r = 0; r < Math.floor(h / 11) - 1; r++) for (let c = 0; c < 3; c++) if (X(i, r * 3 + c, 8) > 0.45) near += '<rect x="' + (x + 5 + c * 11) + '" y="' + (124 - h + 7 + r * 11).toFixed(0) + '" width="6" height="6" fill="#ffd89a" opacity="' + (0.5 + X(i, r, c) * 0.5).toFixed(2) + '"/>';
      }
      s += far + near;
      // rising chart
      s += '<path d="M236 98 276 82l32 10 40-34 40 12 46-40" fill="none" stroke="url(#' + id + 'ln)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M236 98 276 82l32 10 40-34 40 12 46-40" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round"/>';
      s += '<path d="M424 30l18-4-4 18z" fill="' + acc + '"/>';
      [[276, 82], [308, 92], [348, 58], [388, 70]].forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#2a1a40" stroke="' + acc + '" stroke-width="2.500"/>'; });
      // phone handset
      s += '<g transform="translate(66 22) rotate(-28)"><rect x="0" y="0" width="60" height="16" rx="8" fill="#14101f" stroke="#ffffff40"/><rect x="-6" y="-4" width="20" height="24" rx="8" fill="#241a38" stroke="#ffffff40"/><rect x="46" y="-4" width="20" height="24" rx="8" fill="#241a38" stroke="#ffffff40"/></g>';
      s += '<path d="M44 20q10-12 24-10M40 12q14-18 34-14" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>';
      s += '<rect width="520" height="124" fill="url(#' + id + 'fl)"/></svg>';
      return s;
    },
    edu(roof, acc) {
      const id = 'hed';
      let s = VB + '<defs><linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b4a3c"/><stop offset="1" stop-color="#3d1a14"/></linearGradient><linearGradient id="' + id + 'bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4a42"/><stop offset="1" stop-color="#1d3029"/></linearGradient><linearGradient id="' + id + 'bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient><linearGradient id="' + id + 'wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88a52"/><stop offset="1" stop-color="#8a5a32"/></linearGradient></defs>';
      s += '<rect width="520" height="124" fill="url(#' + id + 'bg)"/>';
      s += '<path d="M40 0 110 0 70 124H0z" fill="#ffe9a8" opacity=".09"/><path d="M420 0 520 0 520 124 380 124z" fill="#ffe9a8" opacity=".07"/>';
      // chalkboard
      s += '<rect x="96" y="8" width="328" height="80" rx="5" fill="url(#' + id + 'wd)"/><rect x="104" y="14" width="312" height="68" rx="3" fill="url(#' + id + 'bd)"/><rect x="104" y="14" width="312" height="68" rx="3" fill="url(#' + id + 'bm)"/>';
      s += '<rect x="112" y="76" width="64" height="4" rx="2" fill="#e8eef0" opacity=".85"/>';
      const pc = ['#ff8fa3', '#74c0fc', '#ffd43b', '#8ce99a'];
      for (let i = 0; i < 4; i++) { s += '<circle cx="' + (150 + i * 30) + '" cy="52" r="9" fill="' + pc[i] + '" opacity=".9"/><circle cx="' + (150 + i * 30) + '" cy="52" r="9" fill="none" stroke="#fff" stroke-opacity=".5"/>'; }
      s += '<path d="M146 36q60-14 120 0" fill="none" stroke="#f4f1e6" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 7"/>';
      s += '<path d="M302 30a10 10 0 1 0 20 0V50a6 6 0 1 1-6-6" fill="none" stroke="#f4f1e6" stroke-opacity=".85" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 4)"/>';
      s += '<path d="M352 28l4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1z" fill="#ffd43b" opacity=".9"/><path d="M386 62q0-12 10-12t10 12M391 44l5-6 5 6" fill="none" stroke="#f4f1e6" stroke-opacity=".8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      // desks and apple
      s += '<rect x="0" y="100" width="520" height="24" fill="#2a110d"/>';
      for (let i = 0; i < 4; i++) { const x = 44 + i * 124; s += '<rect x="' + x + '" y="88" width="96" height="9" rx="2" fill="url(#' + id + 'wd)"/><path d="M' + (x + 10) + ' 97v20M' + (x + 86) + ' 97v20" stroke="#6b432a" stroke-width="4"/><rect x="' + x + '" y="88" width="96" height="2" fill="#ffffff" opacity=".28"/>'; }
      s += '<circle cx="86" cy="80" r="7" fill="#e63946"/><path d="M86 73q1-5 5-6" stroke="#4a8a3a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="83.500" cy="77.500" rx="2" ry="1.400" fill="#fff" opacity=".5"/>';
      s += '<g transform="translate(210 74)"><rect x="0" y="0" width="5" height="14" fill="#f4c542"/><path d="M0 14h5l-2.500 5z" fill="#e8c9a0"/><rect x="0" y="0" width="5" height="3" fill="#ff8fa3"/></g>';
      s += bokeh(6, 8, '#fff6c8', 6, 80) + '<rect width="520" height="124" fill="url(#' + id + 'fl)"/></svg>';
      return s;
    },
    cook(roof, acc) {
      const id = 'hck';
      let s = VB + defs(id, roof, acc) + '<rect width="520" height="124" fill="url(#' + id + 'bg)"/>';
      s += '<ellipse cx="260" cy="70" rx="210" ry="70" fill="url(#' + id + 'gl)"/>';
      // tiles
      s += '<g stroke="#ffffff" stroke-opacity=".05">';
      for (let x = 0; x <= 520; x += 26) s += '<path d="M' + x + ' 0V70"/>';
      for (let y = 0; y <= 70; y += 18) s += '<path d="M0 ' + y + 'H520"/>';
      s += '</g>';
      // ticket rail
      s += '<rect x="30" y="14" width="460" height="5" rx="2.500" fill="#b7c2cc"/><rect x="30" y="14" width="460" height="1.500" fill="#fff" opacity=".6"/>';
      for (let i = 0; i < 5; i++) { const x = 66 + i * 82 + X(i, 1, 6) * 10, h = 32 + X(i, 2, 6) * 14; s += '<g transform="rotate(' + ((X(i, 3, 6) - 0.5) * 5).toFixed(1) + ' ' + x + ' 19)"><rect x="' + x + '" y="19" width="40" height="' + h.toFixed(0) + '" fill="#f6f1e4"/><path d="M' + x + ' ' + (19 + h).toFixed(0) + 'l5 4 5-4 5 4 5-4 5 4 5-4 5 4 5-4z" fill="#f6f1e4"/><rect x="' + (x + 5) + '" y="25" width="22" height="3" rx="1.500" fill="#c0392b" opacity=".8"/><rect x="' + (x + 5) + '" y="32" width="30" height="2.500" rx="1.200" fill="#2a2118" opacity=".5"/><rect x="' + (x + 5) + '" y="38" width="24" height="2.500" rx="1.200" fill="#2a2118" opacity=".5"/><rect x="' + (x + 5) + '" y="44" width="28" height="2.500" rx="1.200" fill="#2a2118" opacity=".35"/><rect x="' + (x + 15) + '" y="15" width="10" height="7" rx="2" fill="#8b98a4"/></g>'; }
      // range with burners and pans
      s += '<rect x="0" y="86" width="520" height="38" fill="#14181d"/><rect x="0" y="86" width="520" height="3" fill="#b7c2cc" opacity=".55"/><rect x="0" y="89" width="520" height="2" fill="#000" opacity=".4"/>';
      [[110, 0], [260, 1], [410, 2]].forEach((p, k) => {
        const x = p[0];
        s += '<ellipse cx="' + x + '" cy="94" rx="58" ry="8" fill="#000" opacity=".45"/>';
        s += '<path d="M' + (x - 40) + ' 88q' + 4 + ' -18 ' + 12 + ' -22t' + 28 + ' 0q' + 8 + ' 4 ' + 12 + ' 22z" fill="' + acc + '" opacity=".14"/>';
        for (let i = -4; i <= 4; i++) s += '<path d="M' + (x + i * 9) + ' 92q' + (i * 0.8).toFixed(1) + ' -12 ' + (i * 1.2).toFixed(1) + ' -' + (10 + X(i, k, 3) * 12).toFixed(0) + 'q' + (3 + i * 0.4).toFixed(1) + ' 6 ' + 5 + ' 12z" fill="' + (X(i, k, 2) > 0.5 ? '#ffb347' : '#ff7a3d') + '" opacity=".95"/>';
        s += '<ellipse cx="' + x + '" cy="70" rx="46" ry="10" fill="#1c2026" stroke="#5a6572" stroke-width="2"/><ellipse cx="' + x + '" cy="68" rx="40" ry="7.500" fill="#0d0f12"/><rect x="' + (x + 44) + '" y="66" width="52" height="6" rx="3" fill="#2f353d" stroke="#5a6572"/>';
        const fc = ['#f6e08a', '#d26a4a', '#8fbf5a'][k];
        s += k === 0 ? '<ellipse cx="' + x + '" cy="68" rx="22" ry="5" fill="#f6f3ec"/><circle cx="' + (x + 2) + '" cy="67" r="6" fill="#ffc83d"/>' : k === 1 ? '<ellipse cx="' + x + '" cy="67.500" rx="24" ry="5.500" fill="#7b4a2e"/><path d="M' + (x - 14) + ' 66l22 3M' + (x - 8) + ' 64l22 4" stroke="#1c1511" stroke-width="1.500"/>' : '<circle cx="' + (x - 10) + '" cy="67" r="6" fill="#d9503f"/><circle cx="' + (x + 6) + '" cy="66" r="6" fill="' + fc + '"/><circle cx="' + (x + 18) + '" cy="68" r="5" fill="#f4d35e"/>';
        s += '<path d="M' + (x - 8) + ' 58q-5-8 0-16M' + (x + 6) + ' 56q-5-8 0-18" fill="none" stroke="#fff" stroke-width="2.500" stroke-linecap="round" opacity=".26"/>';
      });
      s += bokeh(8, 11, acc, 6, 70) + '<rect width="520" height="124" fill="url(#' + id + 'fl)"/></svg>';
      return s;
    }
  };
  return art;
})();

/* ---------- the result medallion ---------- */
JA.medal = function (rk, p) {
  const wrap = el('div', 'jrank r' + rk); wrap.style.setProperty('--p', p.toFixed(3));
  const n = 36; let ticks = '';
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, major = i % 3 === 0, r1 = 53, r2 = major ? 57.500 : 55.500; ticks += '<path d="M' + (60 + Math.cos(a) * r1).toFixed(2) + ' ' + (60 + Math.sin(a) * r1).toFixed(2) + 'L' + (60 + Math.cos(a) * r2).toFixed(2) + ' ' + (60 + Math.sin(a) * r2).toFixed(2) + '" stroke-width="' + (major ? 1.6 : 1) + '"/>'; }
  wrap.innerHTML = '<svg class="mdl" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
    '<radialGradient id="mdD' + rk + '" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="#2b3d54"/><stop offset=".6" stop-color="#0f1a27"/><stop offset="1" stop-color="#070d15"/></radialGradient>' +
    '<linearGradient id="mdR' + rk + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="currentColor"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>' +
    '<g style="color:var(--rc)"><circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="1.5"/>' +
    '<g stroke="currentColor" stroke-opacity=".5" stroke-linecap="round">' + ticks + '</g>' +
    '<circle cx="60" cy="60" r="48" fill="url(#mdD' + rk + ')" stroke="url(#mdR' + rk + ')" stroke-width="3.500"/>' +
    '<circle cx="60" cy="60" r="43" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width="5"/>' +
    '<circle class="m-prog" cx="60" cy="60" r="43" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" pathLength="100" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 5px currentColor)"/>' +
    '</g></svg><div class="m-gloss"></div><b>' + rk + '</b>' +
    (rk === 'S' || rk === 'A' ? '<i class="m-spk"><svg viewBox="-10 -10 20 20"><path d="M0-10Q1.500-1.500 10 0Q1.500 1.500 0 10Q-1.500 1.500-10 0Q-1.500-1.500 0-10z"/></svg></i><i class="m-spk"><svg viewBox="-10 -10 20 20"><path d="M0-10Q1.500-1.500 10 0Q1.500 1.500 0 10Q-1.500 1.500-10 0Q-1.500-1.500 0-10z"/></svg></i><i class="m-spk"><svg viewBox="-10 -10 20 20"><path d="M0-10Q1.500-1.500 10 0Q1.500 1.500 0 10Q-1.500 1.500-10 0Q-1.500-1.500 0-10z"/></svg></i>' : '');
  return wrap;
};
