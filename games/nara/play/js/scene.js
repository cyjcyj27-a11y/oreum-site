// 지도: 낮은 해상도 캔버스에 도트로 그리고 CSS 로 키운다(image-rendering:pixelated)
(function () {
  const NAMES = window.HN_SPR ? Object.keys(HN_SPR) : ['hut', 'chiefhut', 'dolmen', 'granary', 'altar', 'tower', 'bronze', 'kiln', 'fire', 'smithy', 'chief', 'elder', 'warrior', 'shaman', 'man', 'woman', 'kid', 'enemy', 'tiger'];
  const PEOPLE = {}; (window.HN_PEOPLE || ['chief', 'elder', 'warrior', 'shaman', 'man', 'woman', 'kid', 'enemy', 'tiger']).forEach(k => PEOPLE[k] = 1);
  const IMG = {};
  let loaded = 0;
  NAMES.forEach(n => { const im = new Image(); im.onload = () => loaded++; im.src = (window.HN_SPR && HN_SPR[n]) || ('art/px/' + n + '.png'); IMG[n] = im; });

  // 씨앗 있는 난수(지도가 매번 같게)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  const RES = 2; // 캔버스는 세계의 두 배: 땅은 굵은 도트, 사람·건물은 촘촘하게
  let cv, cx, cw = 360, ch = 200, bg = null, bgKey = '';
  const st = { stage: 'bronze', nat: '', objs: [], ppl: [], fx: [], ruins: [], fence: false, focus: '', shake: 0, t: 0 };

  // 강: 세계 좌표 꺾은선(가운데가 0,0)
  const RIVER = [[30, -160], [60, -80], [130, -30], [170, 40], [150, 120], [170, 200]];
  const VILLAGE = { paleo: [-70, -10, 60, 30], neo: [-55, 0, 85, 42], bronze: [-45, 4, 115, 56], joseon: [-40, 4, 135, 64], nations: [-40, 4, 135, 64] };
  // 자리: 가장 좁은 화면(세계 폭 250)에서도 보이게 x 는 -118 ~ 100 안에
  function V() { return VILLAGE[st.stage] || [-40, 4, 135, 64]; }
  // 시대 건물 자리(SLOTS 에 없는 이름은 여기서 앞에서부터 차례로): 뒤 줄 → 가운데 → 앞
  const POOL = [[-58, -42], [36, 10], [-78, 12], [56, -32], [-28, 44], [92, -20], [10, 50], [-96, -32], [-2, 14], [-104, 44], [18, -40], [72, 18], [-66, 50], [-20, -46], [48, 46], [-114, 4], [-40, 6], [86, 56], [-50, 84], [30, 82], [-90, 80], [-10, 84], [66, 84]];
  const SLOTS = {
    hut: [[-100, -32], [-68, -42], [-114, 2], [-96, 34], [-38, -46], [-110, 62], [-66, 60], [-6, -48], [-80, 10]],
    chiefhut: [[-48, -12]], palace: [[-8, -22]],
    dolmen: [[-6, 22], [64, 64]], granary: [[26, -8], [40, 32], [98, 30]],
    altar: [[-32, 42], [12, 62], [88, 66]], tower: [[-118, -46], [100, -24], [-118, 82]],
    bronze: [[-86, 80]], kiln: [[-30, 70]], fire: [[-64, 12], [22, 38], [-46, 28]],
    smithy: [[64, -42], [-22, 84]], makjip: [[-92, -8], [-64, 6]], paddy: [[72, 6]],
    flag: [[-26, -32], [6, -40], [-70, -50]], stele: [[-20, 8], [44, 52]], gate: [[-40, 80]], hanflag: [[-2, 2]], cave: [[-24, -20]]
  };
  const BASE = {
    paleo: ['cave'], neo: ['hut', 'hut', 'fire'],
    bronze: ['hut', 'hut', 'hut', 'hut', 'chiefhut', 'fire'],
    joseon: ['hut', 'hut', 'hut', 'hut', 'hut', 'chiefhut', 'dolmen', 'fence', 'tower', 'granary', 'altar', 'fire', 'paddy'],
    nations: ['hut', 'hut', 'hut', 'hut', 'hut', 'hut', 'chiefhut', 'dolmen', 'fence', 'tower', 'granary', 'altar', 'fire', 'paddy', 'smithy']
  };
  Object.assign(BASE, {
    goguryeo: ['sg_house', 'sg_house', 'sg_fortress', 'sg_tombstone'], baekje: ['sg_house', 'sg_house', 'sg_temple', 'sg_spagoda'],
    silla: ['sg_house', 'sg_house', 'sg_mound', 'sg_temple'], nambuk: ['sg_house', 'sg_house', 'nb_lantern', 'nb_pond', 'nb_seokga'],
    goryeo1: ['gr_house', 'gr_house', 'gr_market', 'gr_temple'], goryeo2: ['gr_house', 'gr_house', 'gr_wall', 'gr_kiln'],
    joseon1: ['js_choga', 'js_choga', 'js_yangban', 'js_market'], joseon2: ['js_choga', 'js_yangban', 'js_market', 'js_seowon'],
    gaehang: ['js_choga', 'js_yangban', 'md_pole', 'md_post'], ilje: ['cl_shop', 'cl_street', 'md_pole', 'cl_school'],
    hyeondae: ['kr_shop', 'kr_school', 'kr_apt', 'kr_subway']
  });
  const BASE_PPL = {
    goguryeo: ['sg_farmer', 'sg_noble', 'sg_general', 'sg_artisan', 'sg_queen'], baekje: ['sg_farmer', 'sg_noble', 'sg_monk', 'sg_artisan', 'sg_queen'],
    silla: ['sg_farmer', 'sg_noble', 'sg_hwarang', 'sg_monk', 'sg_queen'], nambuk: ['sg_farmer', 'sg_noble', 'sg_monk', 'sg_artisan', 'sg_hwarang'],
    goryeo1: ['gr_farmer', 'gr_woman', 'gr_merchant', 'gr_monk', 'gr_civil'], goryeo2: ['gr_farmer', 'gr_woman', 'gr_merchant', 'gr_military', 'gr_monk'],
    joseon1: ['js_farmer', 'js_woman', 'js_seonbi', 'js_merchant', 'js_slave'], joseon2: ['js_farmer', 'js_woman', 'js_seonbi', 'js_merchant', 'js_official'],
    gaehang: ['md_merchant', 'md_student', 'md_seonbi', 'md_soldier', 'js_farmer'], ilje: ['cl_farmer', 'cl_worker', 'cl_student', 'cl_woman', 'cl_reporter'],
    hyeondae: ['kr_citizen', 'kr_office', 'kr_family', 'kr_worker', 'kr_reporter'],
    paleo: ['elder', 'man', 'kid', 'woman'], neo: ['elder', 'man', 'woman', 'kid'],
    bronze: ['elder', 'man', 'woman', 'kid', 'man'],
    joseon: ['chief', 'elder', 'warrior', 'shaman', 'man', 'woman', 'kid', 'woman'],
    nations: ['chief', 'elder', 'warrior', 'shaman', 'man', 'woman', 'kid', 'man', 'woman']
  };
  const NAT_COL = { buyeo: '#e8c040', goguryeo: '#d23a2a', okjeo: '#3aa59a', dongye: '#3a6ad8', samhan: '#4aa040', '': '#c8402e' };

  function distSeg(px, py, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy;
    let t = ((px - a[0]) * vx + (py - a[1]) * vy) / l; t = Math.max(0, Math.min(1, t));
    const dx = px - (a[0] + vx * t), dy = py - (a[1] + vy * t); return Math.sqrt(dx * dx + dy * dy);
  }
  function riverD(x, y) { let d = 1e9; for (let i = 0; i < RIVER.length - 1; i++) d = Math.min(d, distSeg(x, y, RIVER[i], RIVER[i + 1])); return d; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  const C = {
    g0: hex('#557f2e'), g1: hex('#6a9a3a'), g2: hex('#7cac44'), g3: hex('#8cbc50'),
    d0: hex('#9c7244'), d1: hex('#b48a55'), d2: hex('#c9a06a'),
    w0: hex('#2c5f9e'), w1: hex('#3a78c8'), w2: hex('#5a9ae0'), sand: hex('#d8c27a'), sand2: hex('#c4ab62'),
    s0: hex('#8c8270'), s1: hex('#9a9080'), s2: hex('#6e6658'), a0: hex('#55585e'), a1: hex('#5f6268'), a2: hex('#d8d4c0'), a3: hex('#a8a49a'),
    m0: hex('#3c6040'), m1: hex('#4e7a4a'), m2: hex('#6f9a62'), far: hex('#8fb0a8'), sky: hex('#bfd8d0')
  };
  // 4x4 바이어 디더
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function vnoise(x, y, seed) {
    const g = 18, xi = Math.floor(x / g), yi = Math.floor(y / g), fx = x / g - xi, fy = y / g - yi;
    const h = (a, b) => { let n = (a * 374761393 + b * 668265263 + seed * 2654435761) >>> 0; n = (n ^ (n >>> 13)) * 1274126177 >>> 0; return (n & 0xffff) / 65535; };
    const s = t => t * t * (3 - 2 * t);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy);
  }
  let camX = -10, camY = 0, waterPx = [];
  function buildBg() {
    bg = document.createElement('canvas'); bg.width = cw; bg.height = ch;
    const g = bg.getContext('2d'), id = g.createImageData(cw, ch), D = id.data;
    const [vx, vy, rx, ry] = V();
    const GS = { gaehang: 'street', ilje: 'street', hyeondae: 'asphalt' }[st.stage] || 'dirt';
    const top = -ch / 2 + camY;
    waterPx = [];
    for (let sy = 0; sy < ch; sy++) for (let sx = 0; sx < cw; sx++) {
      const x = sx - cw / 2 + camX, y = sy - ch / 2 + camY, th = BAY[(sy & 3) * 4 + (sx & 3)] / 16;
      let c;
      const far = top + 12 + 7 * Math.sin(x * 0.031) + 4 * Math.sin(x * 0.073 + 1);
      const near = top + 26 + 9 * Math.sin(x * 0.021 + 2) + 5 * Math.sin(x * 0.058 + .5);
      const rd = riverD(x, y);
      if (y < far) c = (y < far - 10 + th * 6) ? C.sky : C.far;
      else if (y < near) { const k = (y - far) / Math.max(1, near - far); c = k + th * 0.5 < 0.55 ? C.m1 : (k + th * 0.4 < 0.85 ? C.m0 : C.m1); if (vnoise(x * 3, y * 3, 9) > 0.62) c = C.m2; }
      else if (rd < 11) { c = rd < 5 ? C.w0 : C.w1; if (((x + y * 2) & 15) === 0 && rd > 3) c = C.w2; if (sx % 3 === 0 && sy % 2 === 0) waterPx.push(sx, sy); }
      else if (rd < 14) c = rd - 11 + th * 2 < 2 ? C.sand : C.sand2;
      else {
        const e = ((x - vx) / rx) ** 2 + ((y - vy) / ry) ** 2;
        const n = vnoise(x, y, 3);
        if (e < 1 && e + th * 0.35 < 0.92) {
          if (GS === 'street') c = (((Math.floor(x / 4) + Math.floor(y / 3)) & 1) ? C.s0 : C.s1), c = ((x & 3) === 0 || (y % 3) === 0) ? C.s2 : c;
          else if (GS === 'asphalt') { c = n + th * 0.3 < 0.5 ? C.a0 : C.a1; if (Math.abs(y - vy) < 1 && (x & 7) < 4) c = C.a2; if (Math.abs(x - vx) < 1 && (y & 7) < 4) c = C.a2; if (e > 0.82) c = C.a3; }
          else c = n + th * 0.3 < 0.55 ? C.d1 : (n > 0.7 ? C.d2 : C.d0);
        }
        else { const v = n + (th - 0.5) * 0.28; c = v < 0.33 ? C.g0 : v < 0.55 ? C.g1 : v < 0.76 ? C.g2 : C.g3; }
      }
      const i = (sy * cw + sx) * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    // 나무: 마을·강·산을 피해 가장자리에 많이
    const r = rng(77);
    const trees = [];
    for (let k = 0; k < 900; k++) {
      const x = (r() - 0.5) * (cw + 40) + camX, y = (r() - 0.5) * (ch + 20) + camY;
      const near = top + 26 + 9 * Math.sin(x * 0.021 + 2) + 5 * Math.sin(x * 0.058 + .5);
      if (y < near + 4) continue;
      if (riverD(x, y) < 18) continue;
      const e = ((x - vx) / (rx + 34)) ** 2 + ((y - vy) / (ry + 24)) ** 2;
      if (e < 1) continue;
      if (e < 2.2 && r() < 0.75) continue;
      if (vnoise(x, y, 11) < 0.55 && r() < 0.9) continue;
      if (r() < (GS === 'asphalt' ? 0.75 : 0.35)) continue;
      trees.push([x, y]);
    }
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => pine(g, Math.round(x - camX + cw / 2), Math.round(y - camY + ch / 2), r() < 0.5));
    // 산 위 작은 나무 실루엣
    for (let k = 0; k < 70; k++) {
      const x = (r() - 0.5) * cw + camX, near = top + 26 + 9 * Math.sin(x * 0.021 + 2) + 5 * Math.sin(x * 0.058 + .5);
      const sx = Math.round(x - camX + cw / 2), sy = Math.round(near - camY + ch / 2 - r() * 8);
      g.fillStyle = '#2f5034'; g.fillRect(sx, sy - 3, 1, 3); g.fillRect(sx - 1, sy - 1, 3, 1);
    }
  }
  function pine(g, x, y, big) {
    const h = big ? 15 : 11;
    g.fillStyle = 'rgba(30,50,20,.35)'; g.fillRect(x - 3, y - 1, 7, 2);
    g.fillStyle = '#5a3a20'; g.fillRect(x, y - 3, 1, 3);
    for (let i = 0; i < h - 3; i++) {
      const w = Math.floor((i / (h - 3)) * (big ? 4 : 3)) + (i % 3 === 2 ? 1 : 0);
      const yy = y - h + i;
      g.fillStyle = '#244a2a'; g.fillRect(x - w, yy, w * 2 + 1, 1);
      g.fillStyle = '#3c7a3a'; g.fillRect(x - w, yy, w, 1);
      if (i % 3 === 1) { g.fillStyle = '#5a9a48'; g.fillRect(x - w, yy, 1, 1); }
    }
  }
  // 코드로 그리는 작은 그림들
  const MADE = {};
  function mk(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; }
  function px(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); }
  MADE.cave = mk(72, 46, g => {
    const r = rng(5), top = [];
    for (let x = 0; x < 72; x++) { const k = x / 71; top.push(Math.round(46 - (Math.sin(k * Math.PI) ** 0.8) * 40 - Math.sin(x * 0.5) * 2 - (r() < 0.2 ? 1 : 0))); }
    for (let x = 0; x < 72; x++) for (let y = top[x]; y < 46; y++) {
      const edge = y === top[x] || (x > 0 && y < top[x - 1]) || (x < 71 && y < top[x + 1]);
      const lightSide = x < 30 + (y - 20) * 0.3;
      const crack = ((x * 7 + y * 3) % 23 === 0) || ((x * 5 - y * 2) % 31 === 0);
      let c = lightSide ? '#9a958a' : '#7a756c';
      if ((x + y * 3) % 11 === 0) c = lightSide ? '#b0aa9c' : '#8a857a';
      if (crack) c = '#4e4a44';
      if (y > 38) c = '#6a655c';
      if (edge) c = '#3a3632';
      px(g, c, x, y);
    }
    for (let x = 6; x < 66; x++) if (r() < 0.6) px(g, r() < 0.5 ? '#5a8a3a' : '#4a7a30', x, top[x] - (r() < 0.3 ? 1 : 0), 1, 2);
    // 굴 입구
    for (let y = 22; y < 46; y++) { const w = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 46) / 24) ** 2)) * 15); px(g, '#3a3632', 38 - w - 1, y, w * 2 + 2, 1); px(g, y < 28 ? '#2a2020' : '#160f0e', 38 - w, y, w * 2, 1); }
    for (let i = 0; i < 6; i++) px(g, '#5e5a52', 28 + i * 4, 23 + (i % 2), 2, 2 + (i % 3));
    px(g, '#8a6a3c', 30, 43, 16, 2);
  });
  MADE.makjip = mk(26, 18, g => {
    // 기둥 셋을 기대 세우고 가죽을 덮은 막집
    for (let i = 0; i < 18; i++) { const w = Math.round(i * 12 / 18); px(g, '#2a1a10', 13 - w - 1, i, w * 2 + 2, 1); px(g, i % 4 === 0 ? '#c49a62' : '#a87c48', 13 - w, i, w * 2, 1); }
    px(g, '#1a1010', 11, 9, 4, 9); px(g, '#6b4a2a', 12, 0, 1, 3); px(g, '#6b4a2a', 14, 0, 1, 2);
  });
  MADE.stake = mk(3, 9, g => { px(g, '#3a2414', 0, 0, 3, 9); px(g, '#8a5a32', 1, 1, 1, 8); px(g, '#6b4426', 0, 1, 1, 8); px(g, '#c49a62', 1, 0, 1, 1); });
  MADE.paddy = mk(56, 28, g => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
      const x = i * 19, y = j * 14;
      px(g, '#8a6a3c', x, y, 18, 13); px(g, '#6c7a48', x + 1, y + 1, 16, 11);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { px(g, '#d8c050', x + 2 + k * 3, y + 2 + r * 3, 1, 2); px(g, '#9ab040', x + 3 + k * 3, y + 3 + r * 3, 1, 1); }
    }
  });
  function flagImg(col) {
    return mk(10, 22, g => { px(g, '#3a2414', 0, 0, 2, 22); px(g, '#d8c27a', 0, 0, 2, 1); px(g, col, 2, 1, 8, 6); px(g, 'rgba(0,0,0,.25)', 2, 5, 8, 2); px(g, '#fff6', 3, 2, 3, 1); });
  }
  MADE.stele = mk(10, 20, g => {
    px(g, '#2a2420', 1, 0, 8, 20); px(g, '#2a2420', 0, 2, 10, 18);
    px(g, '#a8a296', 2, 1, 4, 18); px(g, '#8a847a', 6, 1, 2, 18); px(g, '#bcb6aa', 1, 3, 1, 15);
    for (let y = 4; y < 16; y += 3) { px(g, '#5a544c', 3, y, 3, 1); }
    px(g, '#6a6458', 0, 18, 10, 2);
  });
  MADE.gate = mk(36, 32, g => {
    // 왕검성 나무 성문: 기둥 둘, 들보, 초가 지붕
    px(g, '#2a1a10', 3, 10, 6, 22); px(g, '#2a1a10', 27, 10, 6, 22);
    px(g, '#8a5a32', 4, 11, 4, 21); px(g, '#8a5a32', 28, 11, 4, 21); px(g, '#a8743e', 4, 11, 1, 21); px(g, '#a8743e', 28, 11, 1, 21);
    px(g, '#2a1a10', 0, 8, 36, 5); px(g, '#7a4e2a', 1, 9, 34, 3);
    for (let i = 0; i < 9; i++) { const w = 18 - i * 2; px(g, '#3a2a14', 18 - w - 1, i, w * 2 + 2, 1); px(g, i % 3 ? '#c49a50' : '#d8b468', 18 - w, i, w * 2, 1); }
    px(g, '#3a2414', 9, 14, 18, 18); px(g, '#6b4426', 10, 15, 16, 17); px(g, '#4a2e18', 17, 15, 2, 17);
  });
  MADE.hanflag = mk(14, 30, g => {
    px(g, '#1a1410', 0, 0, 2, 30); px(g, '#d8c27a', 0, 0, 2, 1);
    px(g, '#1a1a1a', 2, 1, 12, 10); px(g, '#b8322a', 2, 1, 12, 2); px(g, '#b8322a', 2, 9, 12, 2); px(g, '#d8c27a', 6, 4, 4, 4); px(g, '#1a1a1a', 7, 5, 2, 2);
  });
  const burnt = {};
  function burntOf(k) {
    if (burnt[k]) return burnt[k];
    const im = IMG[k] || MADE[k]; if (!im || !im.width) return im;
    return burnt[k] = mk(im.width, im.height, g => { g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,18,12,.62)'; g.fillRect(0, 0, im.width, im.height); });
  }

  function slotFor(k, used) {
    if (!SLOTS[k]) { const n = used.__pool = (used.__pool || 0) + 1; const p = POOL[(n - 1) % POOL.length]; return n > POOL.length ? [p[0] + 9, p[1] + 6] : p; }
    const L = SLOTS[k]; const n = used[k] = (used[k] || 0) + 1;
    const p = L[(n - 1) % L.length]; return n > L.length ? [p[0] + (n - L.length) * 14, p[1] + 8] : p;
  }
  function addObj(k, used, born) {
    if (k === 'fence') { st.fence = true; return; }
    if (PEOPLE[k]) { addPerson(k, born); return; }
    const [x, y] = slotFor(k, used);
    st.objs.push({ k, x, y, born: born || 0 });
  }
  function addPerson(k, born) {
    if (st.ppl.some(q => q.k === k)) return; // 같은 인물은 한 명만
    const [vx, vy, rx, ry] = V();
    const r = Math.random;
    const p = { k, x: vx + (r() - 0.5) * rx, y: vy + (r() - 0.5) * ry, tx: 0, ty: 0, wait: r() * 3, flip: r() < 0.5, born: born || 0 };
    if (k === 'enemy' || k === 'tiger') { p.x = vx + rx * 0.9; p.y = vy + ry * 0.5; }
    st.ppl.push(p);
  }
  function setStage(stage, added, ruins, nat) {
    st.stage = stage; st.nat = nat || ''; st.ruinT = {}; st.objs = []; st.ppl = []; st.fx = []; st.fence = false; st.ruins = (ruins || []).slice();
    const used = {};
    (BASE[stage] || []).forEach(k => addObj(k, used, 0));
    (BASE_PPL[stage] || []).forEach(k => addPerson(k, 0));
    (added || []).forEach(k => addObj(k, used, 0));
    st.used = used;
    bgKey = '';
  }
  function add(list) {
    const now = st.t;
    (list || []).forEach((k, i) => {
      const before = st.objs.length;
      addObj(k, st.used, now + i * 0.25);
      const o = st.objs[st.objs.length - 1];
      if (o && st.objs.length > before) for (let j = 0; j < 10; j++) st.fx.push({ x: o.x + (Math.random() - 0.5) * 20, y: o.y - Math.random() * 4, vx: (Math.random() - 0.5) * 30, vy: -Math.random() * 18, life: 0.6, c: '#d8c090', t0: now + i * 0.25 });
    });
  }
  function ruin() {
    // 건물 하나를 태운다(사람 말고)
    const cand = st.objs.map((o, i) => i).filter(i => !st.ruins.includes(i) && st.objs[i].k !== 'paddy');
    if (!cand.length) return -1;
    const i = cand[Math.floor(Math.random() * cand.length)];
    st.ruins.push(i); st.ruinT = st.ruinT || {}; st.ruinT[i] = st.t; st.shake = 0.4; return i;
  }
  // 태극기(작은 도트): 흰 바탕, 가운데 빨강·파랑 태극, 네 귀 괘
  function taeguk(x, y, h) {
    const [sx, sy] = S(x, y), fx = sx + 1, fy = sy - h + 4, W = 26, H = 18, g = cx;
    g.fillStyle = '#2a2a2a'; g.fillRect(fx - 1, fy - 1, W + 2, H + 2);
    g.fillStyle = '#ffffff'; g.fillRect(fx, fy, W, H);
    const cx0 = fx + 13, cy0 = fy + 9;
    for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) {
      if (xx * xx + yy * yy > 18) continue;
      const up = yy < 0 || (yy === 0 && xx < 0) ? (Math.hypot(xx - 2, yy) > 2 || yy < -1) : (Math.hypot(xx + 2, yy) < 2 && yy < 1);
      g.fillStyle = up ? '#cd2e3a' : '#0047a0'; g.fillRect(cx0 + xx, cy0 + yy, 1, 1);
    }
    g.fillStyle = '#111';
    const bars = (bx, by, pat) => pat.forEach((br, i) => { if (br) g.fillRect(bx, by + i * 2, 5, 1); else { g.fillRect(bx, by + i * 2, 2, 1); g.fillRect(bx + 3, by + i * 2, 2, 1); } });
    bars(fx + 2, fy + 2, [1, 1, 1]); bars(fx + W - 7, fy + 2, [0, 1, 0]); bars(fx + 2, fy + H - 7, [1, 0, 1]); bars(fx + W - 7, fy + H - 7, [0, 0, 0]);
  }
  function S(x, y) { return [Math.round((x - camX + cw / 2) * RES), Math.round((y - camY + ch / 2) * RES)]; }
  function drawSprite(im, x, y, scale, flip, hi) {
    if (!im || !im.width) return;
    const k = hi ? 1 : RES, w = Math.round(im.width * scale * k), h = Math.round(im.height * scale * k);
    if (w < 1 || h < 1) return;
    const [sx, sy] = S(x, y);
    if (flip) { cx.save(); cx.translate(sx, 0); cx.scale(-1, 1); cx.drawImage(im, -Math.floor(w / 2), sy - h, w, h); cx.restore(); }
    else cx.drawImage(im, sx - Math.floor(w / 2), sy - h, w, h);
  }
  function shadow(x, y, w) { const [sx, sy] = S(x, y); w = Math.round(w * RES); cx.fillStyle = 'rgba(20,30,10,.28)'; cx.fillRect(sx - Math.floor(w / 2), sy - 2, w, 4); cx.fillRect(sx - Math.floor(w / 2) + 4, sy + 2, w - 8, 2); }
  const back = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  let last = 0, flagCache = {};
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; st.t += dt;
    if (!cx) return;
    const key = st.stage + cw + 'x' + ch;
    if (key !== bgKey) { buildBg(); bgKey = key; }
    let ox = 0, oy = 0;
    if (st.shake > 0) { st.shake -= dt; ox = Math.round((Math.random() - 0.5) * 4); oy = Math.round((Math.random() - 0.5) * 3); }
    cx.setTransform(1, 0, 0, 1, ox, oy);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(bg, 0, 0, cw * RES, ch * RES);
    // 물결 반짝임
    cx.fillStyle = '#8cc0f0';
    const ph = Math.floor(st.t * 4);
    for (let i = 0; i < waterPx.length; i += 2) if (((i / 2 + ph) * 7919) % 97 < 3) cx.fillRect(waterPx[i] * RES, waterPx[i + 1] * RES, 2 * RES, RES);
    // 그릴 것 모으기
    const list = [];
    st.objs.forEach((o, i) => list.push({ y: o.y, o, i }));
    if (st.fence) {
      const [vx, vy, rx, ry] = V();
      for (let a = 0; a < Math.PI * 2; a += 0.07) {
        if (Math.abs(a - Math.PI / 2) < 0.16) continue; // 앞쪽 문
        list.push({ y: vy + Math.sin(a) * (ry + 10), stake: [vx + Math.cos(a) * (rx + 12), vy + Math.sin(a) * (ry + 10)] });
      }
    }
    st.ppl.forEach(p => list.push({ y: p.y, p }));
    list.sort((a, b) => a.y - b.y);
    const [vx, vy, rx, ry] = V();
    for (const it of list) {
      if (it.stake) { drawSprite(MADE.stake, it.stake[0], it.stake[1], 1); continue; }
      if (it.o) {
        const o = it.o; let sc = 1;
        if (o.born) { const k = (st.t - o.born) / 0.35; if (k < 0) continue; if (k < 1) sc = Math.max(0.05, back(k)); }
        const ruined = st.ruins.includes(it.i);
        let im = IMG[o.k] || MADE[o.k];
        if (o.k === 'palace') { im = IMG.chiefhut; sc *= 1.35; }
        if (o.k === 'flag') { const col = NAT_COL[st.nat] || NAT_COL['']; im = flagCache[col] || (flagCache[col] = flagImg(col)); }
        if (ruined) im = burntOf(o.k === 'palace' ? 'chiefhut' : o.k);
        const hi = !!IMG[o.k] || o.k === 'palace';
        if (im && im.width && o.k !== 'flag' && o.k !== 'paddy') shadow(o.x, o.y, im.width * sc * 0.8 / (hi ? RES : 1));
        drawSprite(im, o.x, o.y, sc, false, hi);
        if (o.k === 'cl_flag' && im && im.width) taeguk(o.x, o.y, Math.round(im.height * sc));
        if (ruined && st.ruinT && st.ruinT[it.i] !== undefined && st.t - st.ruinT[it.i] < 6) {
          const fl = 0.55 + 0.1 * Math.sin(st.t * 20);
          drawSprite(IMG.fire, o.x - 4, o.y - 2, fl, false, true); drawSprite(IMG.fire, o.x + 6, o.y - 6, fl * 0.8, true, true);
        }
        if (o.k === 'fire' || o.k === 'smithy' || o.k === 'kiln' || o.k === 'bronze' || ruined) {
          if (Math.random() < dt * (ruined ? 6 : 3)) st.fx.push({ x: o.x + (Math.random() - 0.5) * 6, y: o.y - (im ? im.height * 0.8 / (hi ? RES : 1) : 10), vx: (Math.random() - 0.5) * 4, vy: -8 - Math.random() * 6, life: 1.6, c: ruined ? '#3a3030' : '#bdb6aa', t0: st.t, smoke: 1 });
        }
        continue;
      }
      const p = it.p;
      // 걷기
      if (p.wait > 0) p.wait -= dt;
      else {
        if (!p.tx && !p.ty) { p.tx = vx + (Math.random() - 0.5) * rx * 1.4; p.ty = vy + (Math.random() - 0.5) * ry * 1.2; }
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), sp = p.k === 'tiger' ? 14 : 9;
        if (d < 1) { p.tx = p.ty = 0; p.wait = 1 + Math.random() * 4; }
        else { p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; p.flip = dx < 0; }
      }
      const moving = p.wait <= 0;
      const bob = moving && Math.floor(st.t * 8) % 2 ? 1 : 0;
      const im = IMG[p.k];
      if (im && im.width) shadow(p.x, p.y, Math.max(6, im.width * 0.7 / RES));
      drawSprite(im, p.x, p.y - bob, 1, p.flip, true);
      if (st.focus && p.k === st.focus && p === st.ppl.find(q => q.k === st.focus)) {
        const [sx, sy] = S(p.x, p.y - (im ? im.height / RES : 20) - 6 - (Math.floor(st.t * 3) % 2)), u = RES;
        cx.fillStyle = '#2a1a10'; cx.fillRect(sx - 3 * u, sy - 8 * u, 7 * u, 9 * u); cx.fillStyle = '#f4e4b8'; cx.fillRect(sx - 2 * u, sy - 7 * u, 5 * u, 7 * u);
        cx.fillStyle = '#c8302a'; cx.fillRect(sx, sy - 6 * u, u, 3 * u); cx.fillRect(sx, sy - 2 * u, u, u);
      }
    }
    // 입자
    st.fx = st.fx.filter(f => st.t - f.t0 < f.life);
    for (const f of st.fx) {
      const a = st.t - f.t0; if (a < 0) continue;
      const [sx, sy] = S(f.x + f.vx * a, f.y + f.vy * a + (f.smoke ? 0 : 20 * a * a));
      cx.fillStyle = f.c; const s = (f.smoke ? (a < f.life * 0.5 ? 2 : 3) : 1) * RES;
      cx.globalAlpha = 1 - a / f.life; cx.fillRect(sx, sy, s, s); cx.globalAlpha = 1;
    }
    cx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function resize() {
    if (!cv) return;
    const r = cv.parentElement.getBoundingClientRect(), asp = Math.max(0.5, r.width / Math.max(1, r.height));
    let h = 168, w = Math.round(h * asp);
    if (w < 250) { w = 250; h = Math.round(w / asp); }
    if (w !== cw || h !== ch) { cw = w; ch = h; cv.width = w * RES; cv.height = h * RES; bgKey = ''; }
    camX = st.stage === 'paleo' ? -40 : -10; camY = 0;
  }
  window.Scene = {
    init(canvas) { cv = canvas; cx = cv.getContext('2d'); resize(); addEventListener('resize', () => setTimeout(resize, 60)); requestAnimationFrame(frame); },
    setStage(s, added, ruins, nat) { setStage(s, added, ruins, nat); resize(); },
    add, ruin, resize,
    focus(k) { st.focus = k; if (k && !st.ppl.some(p => p.k === k)) addPerson(k, st.t); },
    shake(s) { st.shake = s || 0.3; },
    ruins: () => st.ruins.slice(), people: () => st.ppl.map(p => p.k),
    objs: () => st.objs.map(o => ({ k: o.k, x: o.x, y: o.y })),
    view: () => ({ camX, camY, cw, ch }),
    debugAll() { setStage('nations', [], [], ''); st.objs = []; const used = {}; Object.keys(SLOTS).forEach(k => SLOTS[k].forEach(() => addObj(k, used, 0))); st.fence = true; resize(); },
    ready: () => loaded >= NAMES.length,
    canvas: () => cv
  };
})();
