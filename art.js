/* Aminas — procedural original art (SVG strings). No external image assets. */
(function (root) {
  'use strict';
  const A = (root.A = root.A || {});
  const D = A.Data;
  const Art = (A.Art = {});
  let uidc = 0;

  /* ---------- colour helpers ---------- */
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function shade(h, amt) {
    const c = hex2rgb(h).map((v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  Art.shade = shade;

  /* ---------- icons (24x24, stroke) ---------- */
  const ICONS = {
    gold: '<circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity=".25"/><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1 1-1.6 2.5-1.6s2.5.6 2.5 1.6-1 1.5-2.5 1.9-2.5.9-2.5 2 1 1.7 2.5 1.7 2.5-.7 2.5-1.7"/>',
    food: '<path d="M12 8c-3-2.5-7 0-7 5 0 4 3 7 7 7s7-3 7-7c0-5-4-7.500-7-5z" fill="currentColor" fill-opacity=".25"/><path d="M12 8c-3-2.5-7 0-7 5 0 4 3 7 7 7s7-3 7-7c0-5-4-7.500-7-5z"/><path d="M12 8c0-2 1-3.500 3-4.500"/><path d="M12 8c-1-1.500-3-2-4-1.500"/>',
    gem: '<path d="M6 4h12l4 6-10 11L2 10z" fill="currentColor" fill-opacity=".25"/><path d="M6 4h12l4 6-10 11L2 10zM2 10h20M9 4l-2 6 5 11 5-11-2-6"/>',
    paw: '<ellipse cx="12" cy="16" rx="5" ry="4" fill="currentColor" fill-opacity=".25"/><ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="5.500" cy="11" r="2"/><circle cx="9.500" cy="6.500" r="2"/><circle cx="14.500" cy="6.500" r="2"/><circle cx="18.500" cy="11" r="2"/>',
    scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4z" fill="currentColor" fill-opacity=".2"/><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4zM6 4a2 2 0 0 0-2 2v1h2M10 9h6M10 13h6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z" fill="currentColor" fill-opacity=".3"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/>',
    gate: '<path d="M4 21V10a8 8 0 0 1 16 0v11" fill="currentColor" fill-opacity=".2"/><path d="M4 21V10a8 8 0 0 1 16 0v11M8 21v-8a4 4 0 0 1 8 0v8M2 21h20"/>',
    egg: '<path d="M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11z" fill="currentColor" fill-opacity=".25"/><path d="M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11zM8 13l2 2 2-2 2 2 2-2"/>',
    chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="currentColor" fill-opacity=".2"/><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 10h8M8 13h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2l1.500 3a7 7 0 0 1 2.500 1l3.200-1 1.500 2.600-2.300 2.300a7 7 0 0 1 0 2.200l2.300 2.300-1.500 2.600-3.200-1a7 7 0 0 1-2.500 1L12 22l-1.500-3a7 7 0 0 1-2.500-1l-3.200 1-1.500-2.600 2.300-2.300a7 7 0 0 1 0-2.200L3.300 8.600 4.800 6l3.200 1a7 7 0 0 1 2.500-1z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" fill-opacity=".25"/><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    star: '<path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.500 6.600 19.500l1.200-6L3.300 9.300l6.100-.7z" fill="currentColor" fill-opacity=".3"/><path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.500 6.600 19.500l1.200-6L3.300 9.300l6.100-.7z"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.500 4.500 0 0 1 8-2.500A4.500 4.500 0 0 1 20 9c0 6-8 11-8 11z" fill="currentColor" fill-opacity=".3"/><path d="M12 20s-8-5-8-11a4.500 4.500 0 0 1 8-2.500A4.500 4.500 0 0 1 20 9c0 6-8 11-8 11z"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    swords: '<path d="M4 4l9 9M20 4l-9 9M3 21l3-3M21 21l-3-3M13 13l4 4M11 13l-4 4"/>',
    spark: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z" fill="currentColor" fill-opacity=".3"/><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z"/>',
    swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" fill="currentColor" fill-opacity=".2"/><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13v2z"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z" fill="currentColor" fill-opacity=".2"/><path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',
  };
  Art.icon = (n, cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  /* ---------- Amina creatures ---------- */
  function star(cx, cy, r, fill) {
    const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); }
    return '<polygon points="' + p.join(' ') + '" fill="' + fill + '"/>';
  }

  Art.creature = function (id, opt) {
    opt = opt || {};
    const s = D.SPECIES[id]; if (!s) return '';
    const a = s.art, u = 'g' + ++uidc;
    const c1 = a.c1, c2 = a.c2, c3 = a.c3, ln = shade(c1, -0.5), dk = shade(c1, -0.3);
    let back = '', body = '', head, feet = true, shadowW = 26;

    // --- body shape ---
    switch (a.body) {
      case 'tall': head = { cx: 50, cy: 56, rx: 24, ry: 31 }; body = '<ellipse cx="50" cy="58" rx="24" ry="31" fill="' + c1 + '"/><ellipse cx="50" cy="72" rx="16" ry="18" fill="' + c2 + '" opacity=".75"/>'; break;
      case 'long':
        head = { cx: 50, cy: 46, rx: 23, ry: 21 };
        body = '<ellipse cx="50" cy="73" rx="31" ry="16" fill="' + c1 + '"/><ellipse cx="50" cy="78" rx="21" ry="9" fill="' + c2 + '" opacity=".75"/><ellipse cx="50" cy="46" rx="23" ry="21" fill="' + c1 + '"/>'; break;
      case 'drop':
        head = { cx: 50, cy: 62, rx: 25, ry: 24 }; feet = false;
        body = '<path d="M50 14C50 14 21 50 21 66a29 27 0 0 0 58 0C79 50 50 14 50 14z" fill="' + c1 + '"/><ellipse cx="50" cy="74" rx="17" ry="13" fill="' + c2 + '" opacity=".7"/>'; break;
      case 'fish':
        head = { cx: 44, cy: 56, rx: 26, ry: 21 }; feet = false;
        back = '<path d="M68 56l24-16v32z" fill="' + dk + '"/>';
        body = '<ellipse cx="48" cy="58" rx="31" ry="23" fill="' + c1 + '"/><path d="M26 66a28 14 0 0 0 44 4 28 18 0 0 1-44-4z" fill="' + c2 + '" opacity=".7"/><path d="M48 36l6-12 6 14z" fill="' + dk + '"/>'; break;
      case 'bird':
        head = { cx: 50, cy: 58, rx: 26, ry: 24 };
        body = '<ellipse cx="50" cy="60" rx="27" ry="25" fill="' + c1 + '"/><ellipse cx="50" cy="70" rx="17" ry="13" fill="' + c2 + '" opacity=".8"/><path d="M45 62l5 7 5-7z" fill="' + c3 + '"/>'; break;
      case 'moth':
        head = { cx: 50, cy: 54, rx: 17, ry: 20 };
        body = '<ellipse cx="50" cy="62" rx="16" ry="22" fill="' + c1 + '"/><ellipse cx="50" cy="66" rx="10" ry="14" fill="' + c2 + '" opacity=".9"/>'; break;
      case 'rock':
        head = { cx: 50, cy: 58, rx: 27, ry: 22 };
        body = '<path d="M20 72Q16 44 42 33Q66 26 78 44Q88 62 78 78Q50 90 20 72Z" fill="' + c1 + '"/><path d="M30 40l10 4-6 8zM66 36l8 10-10 2z" fill="' + c2 + '" opacity=".55"/>'; break;
      case 'snail':
        head = { cx: 34, cy: 62, rx: 17, ry: 16 };
        back = '<circle cx="64" cy="54" r="25" fill="' + c3 + '"/><path d="M64 54m-17 0a17 17 0 1 1 17 17M64 54m-9 0a9 9 0 1 1 9 9" fill="none" stroke="' + shade(c3, -0.35) + '" stroke-width="3" stroke-linecap="round"/>';
        body = '<path d="M14 80Q14 68 30 66L66 70Q86 72 88 82Q60 90 14 80Z" fill="' + c1 + '"/><ellipse cx="34" cy="62" rx="17" ry="16" fill="' + c1 + '"/>'; feet = false; break;
      case 'cap':
        head = { cx: 50, cy: 70, rx: 15, ry: 17 };
        body = '<ellipse cx="50" cy="72" rx="16" ry="19" fill="' + c2 + '"/><path d="M14 52a36 30 0 0 1 72 0c0 6-10 8-36 8s-36-2-36-8z" fill="' + c3 + '"/><circle cx="32" cy="42" r="5" fill="#fff" opacity=".8"/><circle cx="52" cy="34" r="6" fill="#fff" opacity=".8"/><circle cx="70" cy="46" r="4.500" fill="#fff" opacity=".8"/>'; break;
      case 'jelly':
        head = { cx: 50, cy: 48, rx: 27, ry: 25 }; feet = false;
        back = '<path d="M30 62q-4 14 2 24M42 66q-2 14 2 26M58 66q2 14-2 26M70 62q4 14-2 24" fill="none" stroke="' + shade(c1, -0.1) + '" stroke-width="5" stroke-linecap="round" opacity=".8"/>';
        body = '<path d="M22 56a28 30 0 0 1 56 0c0 6-8 8-12 6s-8 4-16 4-10-6-16-4-12 0-12-6z" fill="' + c1 + '"/><ellipse cx="50" cy="40" rx="16" ry="10" fill="' + c2 + '" opacity=".6"/>'; break;
      default: // round
        head = { cx: 50, cy: 60, rx: 30, ry: 27 };
        body = '<ellipse cx="50" cy="62" rx="30" ry="27" fill="' + c1 + '"/><ellipse cx="50" cy="73" rx="19" ry="13" fill="' + c2 + '" opacity=".75"/>';
    }

    // --- wings ---
    if (a.wings) {
      const wc = a.body === 'moth' ? c1 : c3, big = a.body === 'moth';
      back = '<g class="a-wing">' + (big
        ? '<path d="M44 56C22 30 6 40 10 62c3 14 22 16 34 4z" fill="' + wc + '" opacity=".92"/><path d="M56 56C78 30 94 40 90 62c-3 14-22 16-34 4z" fill="' + wc + '" opacity=".92"/><circle cx="22" cy="54" r="5" fill="' + c3 + '" opacity=".7"/><circle cx="78" cy="54" r="5" fill="' + c3 + '" opacity=".7"/>'
        : '<path d="M28 58C10 44 6 62 14 74c6 8 18 2 22-6z" fill="' + wc + '"/><path d="M72 58C90 44 94 62 86 74c-6 8-18 2-22-6z" fill="' + wc + '"/>') + '</g>' + back;
    }

    // --- tail ---
    let tail = '';
    const tx = a.body === 'long' ? 80 : a.body === 'snail' ? 90 : 76, ty = a.body === 'long' ? 70 : 70;
    switch (a.tail) {
      case 'leaf': tail = '<path d="M' + tx + ' ' + ty + 'q22-4 20-24q-20 2-20 24z" fill="' + c3 + '"/><path d="M' + tx + ' ' + ty + 'q10-8 18-20" stroke="' + shade(c3, -0.3) + '" stroke-width="1.500" fill="none"/>'; break;
      case 'flame': tail = '<path d="M' + tx + ' ' + ty + 'q4-16 14-20-1 8 6 10-4 12-12 18-6 2-8-8z" fill="' + c3 + '"/><path d="M' + (tx + 6) + ' ' + (ty - 2) + 'q2-8 8-12-1 8 4 10-2 8-8 10z" fill="#fff6b0"/>'; break;
      case 'fin': tail = '<path d="M' + tx + ' ' + ty + 'l20-12v24z" fill="' + dk + '"/>'; break;
      case 'fluff': tail = '<circle cx="' + (tx + 8) + '" cy="' + (ty - 2) + '" r="9" fill="' + c2 + '"/>'; break;
      case 'wisp': tail = '<path d="M' + tx + ' ' + ty + 'c14 0 18-12 14-24 8 8 4 26-8 32-4 2-8 0-6-8z" fill="' + c2 + '" opacity=".85"/>'; break;
      case 'ribbon': tail = '<path d="M' + (tx - 4) + ' ' + (ty + 2) + 'q20 0 22 18-12-6-24-4zM' + (tx - 8) + ' ' + ty + 'q24-10 26-26-14 8-30 12z" fill="' + c3 + '"/>'; break;
      case 'cloud': tail = '<circle cx="' + (tx + 6) + '" cy="' + (ty + 4) + '" r="8" fill="#fff" opacity=".85"/><circle cx="' + (tx + 14) + '" cy="' + (ty) + '" r="6" fill="#fff" opacity=".8"/>'; break;
      case 'curl': tail = '<path d="M' + tx + ' ' + ty + 'q20-4 16-22" stroke="' + c3 + '" stroke-width="5" fill="none" stroke-linecap="round"/>'; break;
    }

    // --- feet ---
    let feetSvg = '';
    if (feet) {
      const fy = a.body === 'long' ? 87 : a.body === 'tall' ? 88 : a.body === 'rock' ? 85 : 86;
      feetSvg = '<ellipse cx="38" cy="' + fy + '" rx="8" ry="5" fill="' + dk + '"/><ellipse cx="62" cy="' + fy + '" rx="8" ry="5" fill="' + dk + '"/>';
    }

    // --- ears / crown ---
    let ears = ''; const top = head.cy - head.ry, L = head.cx - head.rx * 0.62, Rr = head.cx + head.rx * 0.62;
    switch (a.ears) {
      case 'leaf': ears = '<path d="M' + L + ' ' + (top + 5) + 'q-24 0-22-24 20 6 22 24z" fill="' + shade(c1, -0.12) + '"/><path d="M' + Rr + ' ' + (top + 5) + 'q24 0 22-24-20 6-22 24z" fill="' + shade(c1, -0.12) + '"/><path d="M' + L + ' ' + (top + 3) + 'q-10-4-14-14M' + Rr + ' ' + (top + 3) + 'q10-4 14-14" stroke="' + c3 + '" stroke-width="2" fill="none" stroke-linecap="round"/>'; break;
      case 'pointy': ears = '<path d="M' + (L - 8) + ' ' + (top + 12) + 'L' + (L - 2) + ' ' + (top - 14) + 'L' + (L + 12) + ' ' + (top + 4) + 'z" fill="' + dk + '"/><path d="M' + (Rr + 8) + ' ' + (top + 12) + 'L' + (Rr + 2) + ' ' + (top - 14) + 'L' + (Rr - 12) + ' ' + (top + 4) + 'z" fill="' + dk + '"/><path d="M' + (L - 3) + ' ' + (top + 4) + 'l2-10 6 6zM' + (Rr + 3) + ' ' + (top + 4) + 'l-2-10-6 6z" fill="' + c3 + '" opacity=".6"/>'; break;
      case 'round': ears = '<circle cx="' + (L - 4) + '" cy="' + (top + 6) + '" r="8" fill="' + dk + '"/><circle cx="' + (Rr + 4) + '" cy="' + (top + 6) + '" r="8" fill="' + dk + '"/><circle cx="' + (L - 4) + '" cy="' + (top + 6) + '" r="4" fill="' + c3 + '" opacity=".6"/><circle cx="' + (Rr + 4) + '" cy="' + (top + 6) + '" r="4" fill="' + c3 + '" opacity=".6"/>'; break;
      case 'long': ears = '<ellipse cx="' + (L - 2) + '" cy="' + (top - 6) + '" rx="6" ry="17" fill="' + c1 + '" transform="rotate(-14 ' + L + ' ' + top + ')"/><ellipse cx="' + (Rr + 2) + '" cy="' + (top - 6) + '" rx="6" ry="17" fill="' + c1 + '" transform="rotate(14 ' + Rr + ' ' + top + ')"/><ellipse cx="' + (L - 2) + '" cy="' + (top - 4) + '" rx="3" ry="11" fill="' + c3 + '" opacity=".7" transform="rotate(-14 ' + L + ' ' + top + ')"/><ellipse cx="' + (Rr + 2) + '" cy="' + (top - 4) + '" rx="3" ry="11" fill="' + c3 + '" opacity=".7" transform="rotate(14 ' + Rr + ' ' + top + ')"/>'; break;
      case 'horn': ears = '<path d="M' + (L + 2) + ' ' + (top + 6) + 'q-12-6-8-24 10 8 14 20z" fill="' + c3 + '"/><path d="M' + (Rr - 2) + ' ' + (top + 6) + 'q12-6 8-24-10 8-14 20z" fill="' + c3 + '"/>'; break;
      case 'crown': { let p = ''; for (let i = 0; i < 5; i++) { const ang = -90 + (i - 2) * 30; const cx = head.cx + Math.cos(ang * Math.PI / 180) * (head.rx - 2), cy = head.cy + Math.sin(ang * Math.PI / 180) * (head.ry - 2); p += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + (cy - 7).toFixed(1) + '" rx="6" ry="11" fill="' + c3 + '" transform="rotate(' + ((i - 2) * 30) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>'; } ears = p; break; }
      case 'antler': ears = '<g stroke="' + c3 + '" stroke-width="3" fill="none" stroke-linecap="round"><path d="M' + (L + 2) + ' ' + (top + 4) + 'q-8-14-4-26M' + (L - 3) + ' ' + (top - 8) + 'q-6-2-9-8M' + (L - 1) + ' ' + (top - 16) + 'q4-4 4-10"/><path d="M' + (Rr - 2) + ' ' + (top + 4) + 'q8-14 4-26M' + (Rr + 3) + ' ' + (top - 8) + 'q6-2 9-8M' + (Rr + 1) + ' ' + (top - 16) + 'q-4-4-4-10"/></g><circle cx="' + (L - 12) + '" cy="' + (top - 16) + '" r="3" fill="#ff9ec7"/><circle cx="' + (Rr + 12) + '" cy="' + (top - 16) + '" r="3" fill="#ff9ec7"/>'; break;
      case 'antenna': ears = '<g stroke="' + dk + '" stroke-width="2.500" fill="none" stroke-linecap="round"><path d="M' + (head.cx - 6) + ' ' + (top + 2) + 'q-8-12-14-14M' + (head.cx + 6) + ' ' + (top + 2) + 'q8-12 14-14"/></g><circle cx="' + (head.cx - 21) + '" cy="' + (top - 13) + '" r="3.500" fill="' + c3 + '"/><circle cx="' + (head.cx + 21) + '" cy="' + (top - 13) + '" r="3.500" fill="' + c3 + '"/>'; break;
      case 'fin': ears = '<path d="M' + (L - 4) + ' ' + (top + 14) + 'q-18-8-16-24 14 4 20 20z" fill="' + dk + '"/><path d="M' + (Rr + 4) + ' ' + (top + 14) + 'q18-8 16-24-14 4-20 20z" fill="' + dk + '"/>'; break;
      case 'crest': ears = '<path d="M' + (head.cx - 6) + ' ' + (top + 3) + 'q-4-14 4-20 2 10 6 12 2-8 8-10-2 14-6 20z" fill="' + c3 + '"/>'; break;
      case 'halo': ears = '<ellipse cx="' + head.cx + '" cy="' + (top - 6) + '" rx="16" ry="5" fill="none" stroke="' + c3 + '" stroke-width="3.500"/><ellipse cx="' + head.cx + '" cy="' + (top - 6) + '" rx="16" ry="5" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>'; break;
      case 'crystal': ears = '<path d="M' + (L + 1) + ' ' + (top + 8) + 'l-9-6 3-20 12 14z" fill="' + c3 + '"/><path d="M' + (Rr - 1) + ' ' + (top + 8) + 'l9-6-3-20-12 14z" fill="' + c3 + '"/><path d="M' + (L - 4) + ' ' + (top - 12) + 'l3 6" stroke="#fff" stroke-width="1.500" opacity=".8"/>'; break;
    }

    // --- spikes / moss ---
    let deco = '';
    if (a.spikes) deco += '<path d="M34 ' + (head.cy + 6) + 'l-6-8 10 2zM46 ' + (head.cy - 18) + 'l-3-9 8 4zM58 ' + (head.cy - 18) + 'l3-9-8 4z" fill="' + shade(c1, -0.35) + '"/>';
    if (a.moss) deco += '<ellipse cx="40" cy="' + (top + 8) + '" rx="9" ry="4" fill="#78c85a"/><ellipse cx="62" cy="' + (top + 6) + '" rx="7" ry="3.500" fill="#5fb446"/>';

    // --- markings ---
    let marks = '';
    if (a.mark === 'spots') marks = '<circle cx="' + (head.cx - 14) + '" cy="' + (head.cy - 10) + '" r="3.500" fill="' + c3 + '" opacity=".65"/><circle cx="' + (head.cx + 16) + '" cy="' + (head.cy - 6) + '" r="3" fill="' + c3 + '" opacity=".65"/><circle cx="' + (head.cx + 4) + '" cy="' + (head.cy - 16) + '" r="2.500" fill="' + c3 + '" opacity=".65"/>';
    else if (a.mark === 'stripes') marks = '<path d="M' + (head.cx - 14) + ' ' + (top + 4) + 'q4 6 0 12M' + (head.cx + 14) + ' ' + (top + 4) + 'q-4 6 0 12M' + head.cx + ' ' + (top + 2) + 'v8" stroke="' + c3 + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>';
    else if (a.mark === 'star') marks = star(head.cx, top + 9, 5.5, c3);
    else if (a.mark === 'rune') marks = '<path d="M' + head.cx + ' ' + (top + 4) + 'l4 6-4 6-4-6zM' + (head.cx - 7) + ' ' + (top + 10) + 'h14" stroke="' + c3 + '" stroke-width="2" fill="none" stroke-linecap="round"/>';

    // --- split (Echolyn) ---
    let split = '';
    if (a.split) split = '<clipPath id="' + u + 'c"><rect x="50" y="0" width="50" height="100"/></clipPath><ellipse cx="50" cy="58" rx="24" ry="31" fill="' + c2 + '" opacity=".6" clip-path="url(#' + u + 'c)"/>';

    // --- face ---
    const fx = head.cx, fy = head.cy + 2, ex = Math.min(11, head.rx * 0.42), ey = fy - 2;
    let eyes = '';
    const eyeAt = (x, flip) => {
      switch (a.eyes) {
        case 'sleepy': return '<ellipse cx="' + x + '" cy="' + ey + '" rx="5.500" ry="5" fill="#fff"/><circle cx="' + x + '" cy="' + (ey + 1) + '" r="3.500" fill="#2a2038"/><path d="M' + (x - 6.500) + ' ' + (ey - 0.5) + 'h13v-6h-13z" fill="' + c1 + '"/><path d="M' + (x - 6) + ' ' + (ey - 0.5) + 'h12" stroke="' + ln + '" stroke-width="1.600" stroke-linecap="round"/>';
        case 'sharp': return '<ellipse cx="' + x + '" cy="' + ey + '" rx="5" ry="6" fill="' + shade(c3, 0.35) + '"/><ellipse cx="' + x + '" cy="' + ey + '" rx="1.800" ry="5" fill="#2a2038"/><circle cx="' + (x - 1.500) + '" cy="' + (ey - 2.500) + '" r="1.300" fill="#fff"/><path d="M' + (x - 6) + ' ' + (ey - 6 + (flip ? 3 : 0)) + 'l12 ' + (flip ? -3 : 3) + '" stroke="' + ln + '" stroke-width="1.500" stroke-linecap="round"/>';
        case 'star': return star(x, ey, 6.500, c3) + '<circle cx="' + x + '" cy="' + ey + '" r="2" fill="#2a2038"/>';
        case 'lantern': return '<circle cx="' + x + '" cy="' + ey + '" r="6.500" fill="' + c3 + '" opacity=".35"/><circle cx="' + x + '" cy="' + ey + '" r="4" fill="' + c3 + '"/><circle cx="' + x + '" cy="' + ey + '" r="1.800" fill="#fff"/>';
        default: return '<ellipse cx="' + x + '" cy="' + ey + '" rx="6" ry="6.500" fill="#fff"/><circle cx="' + x + '" cy="' + (ey + 0.5) + '" r="4.600" fill="#2a2038"/><circle cx="' + (x - 1.800) + '" cy="' + (ey - 2) + '" r="1.800" fill="#fff"/><circle cx="' + (x + 1.600) + '" cy="' + (ey + 2) + '" r="0.900" fill="#fff"/>';
      }
    };
    eyes = '<g class="a-blink">' + eyeAt(fx - ex, false) + eyeAt(fx + ex, true) + '</g>';
    const cheeks = '<ellipse cx="' + (fx - ex - 6) + '" cy="' + (fy + 6) + '" rx="3.600" ry="2.400" fill="#ff8fb0" opacity=".5"/><ellipse cx="' + (fx + ex + 6) + '" cy="' + (fy + 6) + '" rx="3.600" ry="2.400" fill="#ff8fb0" opacity=".5"/>';
    const mouth = opt.mood === 'sad' ? '<path d="M' + (fx - 3.500) + ' ' + (fy + 9) + 'q3.500-3 7 0" stroke="' + ln + '" stroke-width="1.600" fill="none" stroke-linecap="round"/>'
      : '<path d="M' + (fx - 3.500) + ' ' + (fy + 6.500) + 'q3.500 4 7 0" stroke="' + ln + '" stroke-width="1.600" fill="none" stroke-linecap="round"/>';
    const snout = a.snout ? '<ellipse cx="' + fx + '" cy="' + (fy + 3.500) + '" rx="3.500" ry="2.500" fill="#ffb0d8"/>' : '';
    const glow = a.glow ? '<defs><radialGradient id="' + u + 'g"><stop offset="0" stop-color="' + a.glow + '" stop-opacity=".75"/><stop offset="1" stop-color="' + a.glow + '" stop-opacity="0"/></radialGradient></defs><circle class="a-glow" cx="50" cy="56" r="48" fill="url(#' + u + 'g)"/>' : '';

    const scale = a.big ? ' transform="translate(50 92) scale(1.08) translate(-50 -92)"' : '';
    return '<svg class="amina-svg" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + s.name + '">' + glow +
      '<ellipse cx="50" cy="91" rx="' + shadowW + '" ry="4.500" fill="#000" opacity=".22"/>' +
      '<g class="a-bob"' + scale + '>' + back + tail + body + split + feetSvg + deco + marks + ears + cheeks + snout + eyes + mouth + '</g></svg>';
  };

  /* ---------- The Entity portrait ---------- */
  Art.entity = function (mood) {
    mood = mood || 'n';
    const eyeCol = '#ffe9a8';
    let eyes;
    const E = (x) => {
      switch (mood) {
        case 's': return '<ellipse cx="' + x + '" cy="51" rx="4.600" ry="5.200" fill="' + eyeCol + '"/><circle cx="' + x + '" cy="51" r="1.600" fill="#1a1020"/>';
        case 'a': return '<ellipse cx="' + x + '" cy="51" rx="4.200" ry="3.400" fill="' + eyeCol + '"/><circle cx="' + (x + 2) + '" cy="51.500" r="1.600" fill="#1a1020"/><path d="M' + (x - 5) + ' 47.500h10" stroke="#0f1626" stroke-width="3.400"/>';
        case 'c': return '<path d="M' + (x - 4.500) + ' 51q4.500 3.500 9 0" stroke="' + eyeCol + '" stroke-width="1.800" fill="none" stroke-linecap="round"/>';
        case 'w': return '<ellipse cx="' + x + '" cy="51" rx="4.200" ry="3.600" fill="' + eyeCol + '"/><circle cx="' + x + '" cy="51.500" r="1.500" fill="#1a1020"/><path d="M' + (x - 5) + ' 48.500h10" stroke="#0f1626" stroke-width="2.600"/>';
        case 't': return '<ellipse cx="' + x + '" cy="52" rx="4.200" ry="3" fill="' + eyeCol + '"/><circle cx="' + x + '" cy="52.500" r="1.500" fill="#1a1020"/><path d="M' + (x - 5) + ' 49.500h10" stroke="#0f1626" stroke-width="3.800"/>';
        default: return '<ellipse cx="' + x + '" cy="51.500" rx="4.200" ry="3.600" fill="' + eyeCol + '"/><circle cx="' + x + '" cy="52" r="1.500" fill="#1a1020"/><path d="M' + (x - 5) + ' 48.500h10" stroke="#0f1626" stroke-width="2.800"/>';
      }
    };
    const brow = mood === 's' ? '<path d="M37 43q6-4 11 0M52 43q6-4 11 0" stroke="#dfe6f2" stroke-width="2.200" fill="none" stroke-linecap="round"/>'
      : mood === 'w' ? '<path d="M37 45q6-1 11 1M52 41q6-3 11 0" stroke="#dfe6f2" stroke-width="2.200" fill="none" stroke-linecap="round"/>'
      : '<path d="M37 45q6 1 11 3M52 48q6-2 11-3" stroke="#dfe6f2" stroke-width="2.200" fill="none" stroke-linecap="round"/>';
    return '<svg class="ent-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Entity">' +
      '<defs><radialGradient id="entg"><stop offset="0" stop-color="#a8dcff" stop-opacity=".55"/><stop offset="1" stop-color="#a8dcff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="50" cy="52" r="50" fill="url(#entg)"/>' +
      '<g class="ent-float">' +
      '<path d="M14 100Q14 58 32 40Q50 16 68 40Q86 58 86 100Z" fill="#2a3b5c"/><path d="M14 100Q14 58 32 40Q50 16 68 40Q86 58 86 100" fill="none" stroke="#5f82b4" stroke-width="2"/>' +
      '<ellipse cx="50" cy="52" rx="20" ry="22" fill="#0d1424"/>' + eyes_(E) + brow +
      '<path d="M32 57Q34 82 50 92Q66 82 68 57Q58 70 50 66Q42 70 32 57Z" fill="#eef1f8"/><path d="M40 62q5 6 10 2 5 4 10-2" stroke="#c4cddd" stroke-width="1.800" fill="none" stroke-linecap="round"/>' +
      '<g class="ent-clip" transform="rotate(10 78 76)"><rect x="68" y="62" width="20" height="26" rx="2.500" fill="#eadbb2"/><rect x="73" y="59" width="10" height="5" rx="1.500" fill="#8b6f3d"/><path d="M71 70h14M71 75h14M71 80h9" stroke="#8b6f3d" stroke-width="1.400" stroke-linecap="round"/></g>' +
      '</g></svg>';
    function eyes_(f) { return f(43) + f(57); }
  };

  /* ---------- Island scene ---------- */
  function ruin(id, restored, locked) {
    const st = D.STRUCTURES[id], o = locked ? ' opacity=".5"' : '';
    let g = '';
    switch (id) {
      case 'hollow':
        g = restored
          ? '<path d="M-52 38V-6a52 48 0 0 1 104 0V38z" fill="#9ea6b8"/><path d="M-40 38V-4a40 38 0 0 1 80 0V38z" fill="#ffe9b0"/><ellipse cx="0" cy="36" rx="46" ry="9" fill="#7fcf6a"/><path d="M-52 38V-6a52 48 0 0 1 104 0V38" fill="none" stroke="#6e7690" stroke-width="3"/><rect x="-56" y="30" width="112" height="10" rx="4" fill="#8890a6"/><circle cx="-30" cy="34" r="4" fill="#ff9ec7"/><circle cx="34" cy="35" r="4" fill="#ffd86b"/><circle cx="-10" cy="36" r="3" fill="#ff9ec7"/>'
          : '<path d="M-52 38V4l12-14 14-6 6 16 20-2 16-14 20 10 4 40z" fill="#8a91a4"/><path d="M-30 38V12a30 30 0 0 1 60 0V38z" fill="#4a5064"/><rect x="-60" y="32" width="26" height="12" rx="3" fill="#7a8196" transform="rotate(-8 -47 38)"/><rect x="30" y="34" width="22" height="10" rx="3" fill="#7a8196" transform="rotate(10 40 38)"/><circle cx="58" cy="42" r="6" fill="#9aa2b6"/><circle cx="-6" cy="44" r="5" fill="#9aa2b6"/>';
        break;
      case 'tidegate':
        g = restored
          ? '<path d="M-44 36V-6a44 44 0 0 1 88 0V36h-16V-4a28 28 0 0 0-56 0V36z" fill="#9aa4b8"/><path d="M-28 36V-4a28 28 0 0 1 56 0V36z" fill="#58b8e8" opacity=".75"/><path d="M-26 20q6-4 12 0t12 0 12 0 12 0" stroke="#d8f4ff" stroke-width="2" fill="none"/><rect x="-52" y="32" width="104" height="9" rx="4" fill="#8b94aa"/>'
          : '<path d="M-44 36V6l10-14 10-2v46zM44 36V0l-14-8-8 6v38z" fill="#838b9f"/><path d="M-22 36h44v-8q-22-10-44 0z" fill="#58b8e8" opacity=".6"/><rect x="-10" y="26" width="20" height="14" rx="3" fill="#707890" transform="rotate(-10)"/>';
        break;
      case 'moonshrine':
        g = restored
          ? '<rect x="-30" y="-6" width="9" height="46" rx="3" fill="#b8b4d4"/><rect x="21" y="-6" width="9" height="46" rx="3" fill="#b8b4d4"/><path d="M-36 -6h72l-10-18h-52z" fill="#8f8ac0"/><circle cx="0" cy="-34" r="9" fill="#ffe9a0"/><circle cx="4" cy="-37" r="8" fill="#1a1a3a" opacity=".0"/><path d="M-4 -42a10 10 0 1 0 12 12 8 8 0 1 1-12-12z" fill="#fff6c8"/><ellipse cx="0" cy="42" rx="34" ry="7" fill="#7a6ac0" opacity=".45"/><circle cx="0" cy="16" r="9" fill="#d8caff" opacity=".7"/>'
          : '<rect x="-30" y="2" width="9" height="38" rx="3" fill="#8e8aa8" transform="rotate(-6 -26 40)"/><rect x="21" y="8" width="9" height="32" rx="3" fill="#8e8aa8"/><path d="M-30 22q-6 12 4 20M26 14q8 10 0 24" stroke="#3f8a4a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-12 40l6-10 8 4 6-8 8 14z" fill="#777e94"/>';
        break;
      case 'hatchery':
        g = restored
          ? '<path d="M-42 40a42 46 0 0 1 84 0z" fill="#f2e6cc"/><path d="M-42 40a42 46 0 0 1 84 0" fill="none" stroke="#b9a37a" stroke-width="3"/><path d="M-30 30l8-10 8 10 8-10 8 10 8-10 8 10" stroke="#d6bf90" stroke-width="3" fill="none"/><path d="M-10 40V24a10 12 0 0 1 20 0v16z" fill="#ffd86b"/><rect x="-48" y="38" width="96" height="8" rx="4" fill="#a8956d"/>'
          : '<path d="M-42 40a42 46 0 0 1 28-40l4 12 10-14 18 6 6 14 12-4a42 42 0 0 1 2 26z" fill="#d7ccb2"/><path d="M-6 -2l6 16-8 8 10 8" stroke="#8a7a5a" stroke-width="2.500" fill="none"/><rect x="-48" y="38" width="96" height="8" rx="4" fill="#9b8c6e"/><ellipse cx="26" cy="38" rx="9" ry="4" fill="#cfc4aa"/>';
        break;
      case 'reliquarygate':
        g = restored
          ? '<path d="M-44 40V0a44 44 0 0 1 88 0V40z" fill="#6c7a60"/><path d="M-30 40V2a30 30 0 0 1 60 0V40z" fill="#ffe9a8"/><path d="M-30 40V2a30 30 0 0 1 60 0V40" fill="none" stroke="#3f4a38" stroke-width="3"/><path d="M-44 6q8 10 2 30M44 10q-8 10-2 28" stroke="#3f9a4a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="-36" cy="22" r="3.500" fill="#ff9ec7"/><circle cx="38" cy="28" r="3.500" fill="#ff9ec7"/>'
          : '<path d="M-44 40V0a44 44 0 0 1 88 0V40z" fill="#5c6852"/><path d="M-30 40V2a30 30 0 0 1 60 0V40z" fill="#2e3a2c"/><path d="M-34 -8l68 44M34 -8L-34 36M-20 -20l40 60M20 -20l-40 60M0 -30v70" stroke="#3a8a44" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="-20" cy="10" r="4" fill="#58b85a"/><circle cx="18" cy="22" r="4" fill="#58b85a"/>';
        break;
    }
    return '<g' + o + '><ellipse cx="0" cy="44" rx="58" ry="9" fill="#000" opacity=".16"/>' + g + '</g>';
  }
  Art.ruin = ruin;

  Art.scene = function (st, opt) {
    opt = opt || {};
    const R = A.Rules, flags = st.flags, restoredCount = Object.keys(st.struct).length;
    const act = R.active(st), actEl = act ? D.SPECIES[act.sp].el : 'light';
    const glowCol = D.ELEMENTS[actEl].color;
    let s = '<svg id="scene-svg" class="scene" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">';
    s += '<defs>' +
      '<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (flags.r2 ? '#3a3a86' : '#4e6fc4') + '"/><stop offset=".55" stop-color="' + (flags.r2 ? '#c88ac0' : '#a9c8f0') + '"/><stop offset="1" stop-color="#ffe4c4"/></linearGradient>' +
      '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46b4d8"/><stop offset="1" stop-color="#16507e"/></linearGradient>' +
      '<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9adc72"/><stop offset="1" stop-color="#5ab058"/></linearGradient>' +
      '<linearGradient id="sd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e8bd"/><stop offset="1" stop-color="#e0c88e"/></linearGradient>' +
      '<radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#101030" stop-opacity=".45"/></radialGradient>' +
      '<radialGradient id="gl"><stop offset="0" stop-color="#fff2a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff2a8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rg"><stop offset="0" stop-color="#ff9ee0" stop-opacity=".85"/><stop offset="1" stop-color="#ff9ee0" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    s += '<rect width="1000" height="500" fill="url(#sk)"/>';
    // sun / moon glow
    s += '<circle cx="840" cy="110" r="70" fill="url(#gl)" opacity=".7"/><circle cx="840" cy="110" r="26" fill="#fff4c8"/>';
    // aurora after the first Resonance event
    if (flags.r1) s += '<g class="aurora"><path d="M0 70q250-60 500-10t500-30v70q-250 40-500-10T0 130z" fill="#7affc8" opacity=".14"/><path d="M0 100q250-40 500 0t500-20v50q-250 30-500-10T0 150z" fill="#ff9ee0" opacity=".12"/></g>';
    // clouds
    s += '<g class="clouds"><g class="cloud c1"><ellipse cx="200" cy="80" rx="50" ry="14" fill="#fff" opacity=".7"/><ellipse cx="230" cy="70" rx="30" ry="12" fill="#fff" opacity=".7"/></g><g class="cloud c2"><ellipse cx="700" cy="55" rx="60" ry="15" fill="#fff" opacity=".6"/><ellipse cx="670" cy="47" rx="30" ry="11" fill="#fff" opacity=".6"/></g></g>';
    // drift isle (after Spire awakens)
    if (flags.r2) s += '<g class="drift" transform="translate(120 100)"><path d="M-46 0q46 26 92 0l-14 24q-32 22-64 0z" fill="#8c6a48"/><ellipse cx="0" cy="-2" rx="46" ry="12" fill="#8fdc78"/><rect x="-3" y="-30" width="6" height="26" fill="#7a5a3a"/><circle cx="0" cy="-36" r="16" fill="#6fcf6a"/><circle cx="-8" cy="-30" r="3" fill="#ff9ec7"/><circle cx="12" cy="-40" r="3" fill="#ffd86b"/></g>';
    // far hills + spire
    s += '<path d="M0 205q120-50 260-30t260-28q150-18 280 26 130 30 200 20v50H0z" fill="#8bb4a8" opacity=".55"/>';
    const spireOn = !!flags.r2;
    s += '<g class="spire' + (spireOn ? ' awake' : '') + '" transform="translate(520 175)">' +
      (spireOn ? '<circle cx="0" cy="-70" r="80" fill="url(#gl)"/><path d="M-6 -70L-70 -190M6 -70L70 -190M0 -70V-200" stroke="#fff6c0" stroke-width="3" opacity=".5"/>' : '') +
      '<path d="M-20 10L-12 -90l4-20 8 8 4-14 6 20 8 24 6 72z" fill="' + (spireOn ? '#d8d2f0' : '#8a90a4') + '"/>' +
      '<path d="M-6 -60v60M6 -70v70" stroke="' + (spireOn ? '#fff6c0' : '#707690') + '" stroke-width="2" opacity=".8"/></g>';
    // sea
    s += '<rect y="205" width="1000" height="295" fill="url(#sea)"/>';
    s += '<g class="waves"><path class="w1" d="M-100 250q50-10 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0" stroke="#fff" stroke-width="2" fill="none" opacity=".25"/><path class="w2" d="M-100 470q50-10 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0" stroke="#fff" stroke-width="2" fill="none" opacity=".2"/></g>';
    // island
    s += '<path d="M105 330Q85 250 170 208Q260 150 420 150Q620 135 760 172Q885 212 895 300Q900 392 780 434Q620 470 430 464Q230 464 138 414Q100 384 105 330Z" fill="url(#sd)"/>';
    s += '<path d="M150 330Q136 266 200 226Q280 182 420 180Q610 167 740 202Q840 234 850 300Q856 372 762 406Q620 436 430 434Q250 434 176 394Q146 368 150 330Z" fill="url(#gr)"/>';
    s += '<path d="M176 394Q250 434 430 434Q620 436 762 406" fill="none" stroke="#3f8a48" stroke-width="3" opacity=".5"/>';
    // back hill for the gate
    s += '<ellipse cx="300" cy="206" rx="120" ry="40" fill="#6fbf62"/><ellipse cx="740" cy="214" rx="110" ry="34" fill="#6fbf62"/>';
    // trees (static)
    [[170, 280, 0.9], [225, 235, 1], [830, 270, 1], [800, 230, 0.8], [420, 205, 0.8], [650, 205, 0.9], [210, 395, 0.8], [790, 385, 0.9]].forEach((t) => {
      s += '<g transform="translate(' + t[0] + ' ' + t[1] + ') scale(' + t[2] + ')"><rect x="-3" y="-4" width="6" height="22" fill="#7a5638"/><circle cx="0" cy="-16" r="18" fill="#4fa854"/><circle cx="-10" cy="-8" r="12" fill="#5fba5e"/><circle cx="10" cy="-10" r="12" fill="#5fba5e"/></g>';
    });
    // flowers grow with restoration
    const flowers = [[330, 330], [360, 360], [390, 340], [520, 360], [560, 330], [600, 380], [250, 300], [700, 300], [690, 380], [330, 400], [480, 400], [750, 340], [230, 350], [620, 260], [400, 250], [500, 250]];
    const nF = Math.min(flowers.length, 3 + restoredCount * 3);
    for (let i = 0; i < nF; i++) { const f = flowers[i], col = ['#ff9ec7', '#ffd86b', '#ffffff', '#b4a0ff'][i % 4]; s += '<g transform="translate(' + f[0] + ' ' + f[1] + ')"><path d="M0 0v7" stroke="#3f8a48" stroke-width="2"/><circle r="3.500" fill="' + col + '"/><circle r="1.400" fill="#ffe27a"/></g>'; }
    // Ember Ridge glow after r1
    if (flags.r1) s += '<g class="ember"><ellipse cx="880" cy="300" rx="22" ry="40" fill="#ff8a4a" opacity=".25"/><circle cx="868" cy="280" r="4" fill="#ffc080"/><circle cx="884" cy="320" r="3" fill="#ffc080"/></g>';
    // arrival mark (hint that the player is unusual)
    const ma = Math.min(0.9, 0.35 + st.rank * 0.08);
    s += '<g class="arrival" data-hit="mark" transform="translate(575 415)"><ellipse rx="52" ry="14" fill="url(#gl)" opacity="' + ma + '"/><ellipse class="mark-ring" rx="40" ry="10" fill="none" stroke="#fff2a8" stroke-width="2.500" stroke-dasharray="6 5" opacity="' + (ma + 0.1) + '"/><ellipse rx="22" ry="5.500" fill="none" stroke="#fff2a8" stroke-width="1.500" opacity="' + ma + '"/><circle r="56" fill="transparent"/></g>';
    // future plots
    D.FUTURE_PLOTS.forEach((p, i) => { s += '<g class="plot" data-hit="plot" transform="translate(' + p[0] + ' ' + p[1] + ')"><ellipse rx="32" ry="9" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="5 6" opacity=".4"/><path d="M-5 0h10M0-4v8" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><circle r="40" fill="transparent"/></g>'; });
    // structures (draw back to front by y)
    const ids = Object.keys(D.STRUCTURES).sort((a, b) => D.STRUCTURES[a].y - D.STRUCTURES[b].y);
    ids.forEach((id) => {
      const d = D.STRUCTURES[id], state = R.structState(st, id), restored = state === 'restored', locked = state === 'hidden';
      const scale = id === 'hollow' ? 1.0 : 0.82;
      s += '<g class="struct ' + state + '" data-struct="' + id + '" transform="translate(' + d.x + ' ' + d.y + ')">';
      if (state === 'available') s += '<ellipse class="pulse" cx="0" cy="40" rx="68" ry="20" fill="none" stroke="#fff2a8" stroke-width="3"/>';
      s += '<g transform="scale(' + scale + ')">' + ruin(id, restored, locked) + '</g>';
      if (state === 'available') s += '<g class="tag" transform="translate(0 -62)"><rect x="-30" y="-13" width="60" height="26" rx="13" fill="#2b2147" stroke="#ffd86b" stroke-width="2"/><circle cx="-16" cy="0" r="7" fill="#ffd86b"/><text x="6" y="5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="inherit">' + d.cost + '</text></g>';
      if (locked) s += '<g transform="translate(0 -30)"><circle r="12" fill="#2b2147" opacity=".85"/><path d="M-4 -1v-2a4 4 0 0 1 8 0v2" stroke="#fff" fill="none" stroke-width="1.800"/><rect x="-5" y="-1" width="10" height="8" rx="2" fill="#fff"/></g>';
      s += '<circle cx="0" cy="10" r="64" fill="transparent"/></g>';
    });
    // singing stones (Resonance disturbance), visible once the Tide Gate is restored
    const sx = 820, sy = 340;
    if (st.struct.tidegate) {
      const on = !flags.r1;
      s += '<g class="stones' + (on ? ' hum' : ' calm') + '" data-hit="' + (on ? 'disturbance' : 'stones') + '" transform="translate(' + sx + ' ' + sy + ')">' + (on ? '<circle r="60" fill="url(#rg)"/>' : '<circle r="40" fill="url(#rg)" opacity=".25"/>');
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += '<path transform="translate(' + (Math.cos(a) * 32).toFixed(1) + ' ' + (Math.sin(a) * 12).toFixed(1) + ')" d="M-6 6L-4-14 2-16 6 6z" fill="' + (on ? '#d8c4f0' : '#a8a4b8') + '"/>'; }
      s += '<circle r="56" fill="transparent"/></g>';
      if (on) s += '<g class="tag" transform="translate(' + sx + ' ' + (sy - 52) + ')"><circle r="13" fill="#2b2147" stroke="#ff9ee0" stroke-width="2"/><text y="6" text-anchor="middle" font-size="18" font-weight="700" fill="#ffd0f0" font-family="inherit">!</text></g>';
    }
    // silent stone (after the Spire awakens)
    if (flags.r2) {
      const fresh = !flags.stone;
      s += '<g class="silent' + (fresh ? ' fresh' : '') + '" data-hit="stone" transform="translate(545 250)"><ellipse cx="0" cy="34" rx="30" ry="8" fill="#000" opacity=".16"/><circle cx="0" cy="-6" r="56" fill="url(#gl)" opacity=".4"/><path d="M-16 34Q-20-22 0-40 20-22 16 34z" fill="#e9e6f4"/><path d="M0-34V28" stroke="#fff" stroke-width="2" opacity=".75"/><ellipse class="mark-ring" cx="0" cy="34" rx="30" ry="8" fill="none" stroke="#fff6c0" stroke-width="2" stroke-dasharray="4 5"/><circle cx="0" cy="0" r="56" fill="transparent"/></g>';
      if (fresh) s += '<g class="tag" transform="translate(545 195)"><circle r="13" fill="#2b2147" stroke="#fff6c0" stroke-width="2"/><text y="6" text-anchor="middle" font-size="18" font-weight="700" fill="#fff6c0" font-family="inherit">?</text></g>';
    }
    // residents
    const resident = (id, who, sc, dx, dy) => {
      if (!who) return '';
      const d = D.STRUCTURES[id];
      return '<g class="resident" data-struct="' + id + '" transform="translate(' + (d.x + dx) + ' ' + (d.y + dy) + ') scale(' + sc + ')"><g transform="translate(-50 -88)">' + Art.creature(who.sp) + '</g></g>';
    };
    ['tidegate', 'moonshrine'].forEach((id) => { if (st.struct[id]) s += resident(id, R.residentOf(st, id), 0.62, 0, 40); });
    // focal companion in front of the hollow
    if (act && st.struct.hollow) {
      s += '<g class="companion" data-hit="companion" transform="translate(450 362)"><g transform="translate(-72 -122) scale(1.45)">' + Art.creature(act.sp) + '</g><circle cx="0" cy="-50" r="64" fill="transparent"/></g>';
    } else if (act) {
      s += '<g class="companion lonely" data-hit="companion" transform="translate(450 380)"><g transform="translate(-52 -100) scale(1.05)">' + Art.creature(act.sp) + '</g><circle cx="0" cy="-40" r="56" fill="transparent"/></g>';
    }
    // fireflies keyed to companion element
    for (let i = 0; i < 9; i++) { s += '<circle class="ff f' + (i % 3) + '" cx="' + (200 + i * 80) + '" cy="' + (250 + (i * 37) % 150) + '" r="2.500" fill="' + glowCol + '" style="animation-delay:' + (i * 0.7) + 's"/>'; }
    s += '<rect width="1000" height="500" fill="url(#vg)" pointer-events="none"/></svg>';
    return s;
  };

  /* ---------- Backdrops ---------- */
  Art.battleBg = function (kind) {
    const pal = kind === 'boss' ? ['#241a3a', '#4a3a6a', '#2c4a38'] : ['#1f3a34', '#3f7a5a', '#2c5a3a'];
    return '<svg class="bg-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + pal[0] + '"/><stop offset=".7" stop-color="' + pal[1] + '"/></linearGradient></defs>' +
      '<rect width="1000" height="500" fill="url(#bb)"/>' +
      '<g opacity=".5" fill="' + pal[2] + '"><path d="M0 300q100-80 200-20t200-40 200 30 200-40 200 30v240H0z"/></g>' +
      '<g fill="#0f1c1a" opacity=".55"><rect x="80" y="120" width="40" height="300"/><rect x="880" y="100" width="46" height="320"/><path d="M60 120q60-60 120 0zM860 100q60-60 120 0z"/></g>' +
      '<g stroke="#5fe08a" stroke-width="3" fill="none" opacity=".35"><path d="M100 120q-30 60 10 120M900 100q30 70-10 140"/></g>' +
      '<ellipse cx="260" cy="400" rx="150" ry="28" fill="#183626"/><ellipse cx="740" cy="300" rx="130" ry="24" fill="#183626"/>' +
      '<g class="motes">' + [0, 1, 2, 3, 4, 5].map((i) => '<circle class="ff f' + (i % 3) + '" cx="' + (150 + i * 140) + '" cy="' + (100 + (i * 53) % 250) + '" r="2.500" fill="#d8ffb0" style="animation-delay:' + i * 0.6 + 's"/>').join('') + '</g></svg>';
  };
  Art.titleBg = function () {
    return '<svg class="bg-svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171845"/><stop offset=".6" stop-color="#6a4a9a"/><stop offset="1" stop-color="#f0a8a0"/></linearGradient><radialGradient id="tg"><stop offset="0" stop-color="#fff4c8" stop-opacity=".8"/><stop offset="1" stop-color="#fff4c8" stop-opacity="0"/></radialGradient><clipPath id="tl"><rect x="0" y="0" width="860" height="500"/></clipPath></defs>' +
      '<rect width="1000" height="500" fill="url(#tb)"/>' +
      [...Array(40)].map((_, i) => '<circle cx="' + ((i * 137) % 1000) + '" cy="' + ((i * 71) % 250) + '" r="' + (1 + (i % 3) * 0.6) + '" fill="#fff" opacity="' + (0.4 + (i % 4) * 0.15) + '" class="tw" style="animation-delay:' + (i % 7) * 0.4 + 's"/>').join('') +
      '<circle cx="780" cy="130" r="120" fill="url(#tg)"/><circle cx="780" cy="130" r="54" fill="#ffe9a0"/><path d="M780 76a54 54 0 0 0 0 108z" fill="#4a3590"/>' +
      '<rect y="330" width="1000" height="170" fill="#243c8a"/><rect y="330" width="1000" height="170" fill="#8a64c8" opacity=".25"/>' +
      '<path d="M120 360Q200 290 320 296Q430 270 560 292Q700 284 800 340Q760 380 640 386Q480 400 320 392Q180 392 120 360Z" fill="#20233e"/>' +
      '<path d="M420 296l12-60 8 24 10-40 8 36 14-12 6 52z" fill="#1c1e36"/>' +
      '<g class="drift"><ellipse cx="300" cy="190" rx="40" ry="8" fill="#1c1e36"/></g></svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
