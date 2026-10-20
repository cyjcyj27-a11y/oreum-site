// 화면 그리기(조선): 320×180 작은 캔버스에 칸·인물·함정을 점으로 찍고, 큰 화면엔 그대로 키운다(흐림 없음)
(function () {
  const R = (window.RND = {});
  const VW = (R.VW = 320), VH = (R.VH = 180), OY = (R.OY = 12);
  const TW = WORLD.TW, RH = WORLD.RH;
  const lo = (R.lo = document.createElement('canvas')); lo.width = VW; lo.height = VH;
  const g = (R.g = lo.getContext('2d'));
  const bgc = document.createElement('canvas'); bgc.width = VW; bgc.height = VH; const bg = bgc.getContext('2d');
  let bgKey = '';
  const hash = (a, b, s) => { let h = (a * 374761393 + b * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  R.hash = hash;
  const F = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  R.F = F;

  // 판마다 색과 소재. wall: 뒷벽(plaster 흙벽+나무 기둥 / rock 바위 / sky 밤하늘)
  //  blk: 돌벽 소재(stone 돌담 / rock 바위), floor: 바닥(maru 마루 / stone 돌 / giwa 기와)
  const TH = (R.THEMES = {
    jail:   { wall: 'plaster', plaster: '#6a5a48', plasterL: '#7c6a56', plasterD: '#4a3e32', wood: '#3a2a1e', woodL: '#5a4230', win: 0, deco: 'rope', light: 'torch',
              blk: '#6e6a66', blkL: '#8c8884', blkD: '#4a4744', blkM: '#2e2c2a', floor: 'maru', top: '#9a7a52', topL: '#c8a474', front: '#6a4e30', frontD: '#3e2c1a', dark: 0.5 },
    palace: { wall: 'plaster', plaster: '#d8c8a4', plasterL: '#ece0c0', plasterD: '#a8987a', wood: '#7a3a26', woodL: '#a85438', win: 1, deco: 'dancheong', light: 'lantern',
              blk: '#8e8a84', blkL: '#b4b0a8', blkD: '#64605a', blkM: '#3e3c38', floor: 'maru', top: '#c89a5e', topL: '#ecc488', front: '#8a5e34', frontD: '#5a3a1e', dark: 0.12 },
    roof:   { wall: 'sky', sky: '#141638', blk: '#9a948a', blkL: '#c0baae', blkD: '#6a655e', blkM: '#3e3a36', floor: 'giwa', top: '#5a6070', topL: '#8a90a0', front: '#3a3e4a', frontD: '#22242c', dark: 0 },
    cave:   { wall: 'rock', back: '#22262a', brick: '#2a3034', mort: '#14181a', hi: '#3a4246', light: 'wisp', deco: 'rock',
              blk: '#5a6066', blkL: '#7a8288', blkD: '#3c4246', blkM: '#24282c', floor: 'stone', top: '#7a8086', topL: '#a0a8ae', front: '#4a5056', frontD: '#2c3034', dark: 0.6 },
    ruins:  { wall: 'plaster', plaster: '#5a6650', plasterL: '#6c7a60', plasterD: '#3e4836', wood: '#3a3426', woodL: '#56503a', win: 1, deco: 'vine', light: 'torch', broken: 1,
              blk: '#7c8070', blkL: '#9ca090', blkD: '#565a4c', blkM: '#363a30', floor: 'stone', top: '#a0a488', topL: '#c8ccae', front: '#62664e', frontD: '#3e4230', dark: 0.25 },
    temple: { wall: 'plaster', plaster: '#7a2a22', plasterL: '#963a2e', plasterD: '#561a16', wood: '#2a5a4a', woodL: '#3e8068', win: 1, deco: 'dancheong', light: 'lantern',
              blk: '#8a8478', blkL: '#ada69a', blkD: '#605a50', blkM: '#3a3630', floor: 'maru', top: '#d8a860', topL: '#f8d08a', front: '#946234', frontD: '#5e3a1a', dark: 0.25 },
  });
  R.theme = TH.palace;
  R.rx = 0; R.ry = 0;
  R.sx = (x) => x - R.rx * WORLD.RC * TW;
  R.sy = (y) => y - R.ry * WORLD.RR * RH + OY;

  // ---------- 뒷벽 ----------
  function drawBack() {
    const T = R.theme, b = bg, rx = R.rx, ry = R.ry;
    const f = (c, x, y, w, h) => { b.fillStyle = c; b.fillRect(x | 0, y | 0, w | 0, h | 0); };
    if (T.wall === 'sky') {
      // 밤하늘 띠 + 별 + 달 + 먼 산 + 기와지붕 실루엣(처마 끝이 들림)
      const bands = ['#0a0b24', '#10123a', '#181a4a', '#22225a', '#2e2a66', '#3c2e6a'];
      for (let y = 0; y < VH; y++) { const k = y / VH * (bands.length - 1), i = Math.floor(k), fr = k - i; for (let x = 0; x < VW; x++) { const d = ((x & 1) + (y & 1) * 2) / 4; b.fillStyle = bands[Math.min(bands.length - 1, i + (fr > d + 0.1 ? 1 : 0))]; b.fillRect(x, y, 1, 1); } }
      for (let i = 0; i < 60; i++) f(hash(i, 3) > 0.8 ? '#fff6d0' : '#8a8cc8', hash(i, rx, 7) * VW, hash(i, ry, 9) * 110, 1, 1);
      const mx = R.moonX != null ? R.moonX : Math.round(40 + hash(rx, ry, 5) * 240);
      for (let yy = -8; yy <= 8; yy++) for (let xx = -8; xx <= 8; xx++) { const d = xx * xx + yy * yy; if (d > 64) continue; const s = (xx + 3) * (xx + 3) + (yy - 2) * (yy - 2); f(d > 49 ? '#e8d8a0' : s < 6 ? '#e8d8a0' : '#fff6d0', mx + xx, 24 + yy, 1, 1); }
      for (let k = 0; k < 3; k++) { b.globalAlpha = 0.08; b.fillStyle = '#fff6d0'; b.beginPath(); b.arc(mx, 24, 12 + k * 6, 0, 7); b.fill(); } b.globalAlpha = 1;
      // 먼 산 능선
      for (let x = 0; x < VW; x++) { const h = 40 + Math.sin((x + rx * 320) * 0.013) * 14 + Math.sin((x + rx * 320) * 0.041) * 6; f('#1c1c44', x, VH - h - 40, 1, h + 40); }
      // 기와집 실루엣: 몸채 + 양끝이 들린 지붕
      for (let i = 0; i < 6; i++) {
        const cx = (i * 61 + hash(i, rx, 3) * 30) % (VW + 40) - 20, w = 34 + hash(i, rx) * 24, top = VH - 40 - hash(rx, i) * 46;
        f('#2c2456', cx, top + 8, w, VH - top);
        for (let k = 0; k <= w + 12; k++) { const u = k / (w + 12), lift = Math.pow(Math.abs(u - 0.5) * 2, 3) * 6; f('#3a2e6e', cx - 6 + k, top - lift, 1, 9 + lift * 0.3); }
        f('#3a2e6e', cx + w / 2 - 8, top - 6, 16, 6);
        for (let k = 0; k < 3; k++) if (hash(i, k, rx) > 0.4) f('#f0c060', cx + 6 + k * 9, top + 16, 3, 4);
      }
      return;
    }
    if (T.wall === 'rock') {
      f(T.back, 0, 0, VW, VH);
      for (let y = -4, j = 0; y < VH; y += 9 + (j % 3), j++) {
        for (let x = -10 + (j % 2) * 7; x < VW; ) {
          const h = hash(x + rx * 400, y + ry * 400, 3), w = 9 + Math.floor(h * 10), hh = 7 + Math.floor(hash(y, x, 5) * 4);
          f(h > 0.85 ? T.hi : h < 0.12 ? T.mort : T.brick, x + 1, y + 1, w - 1, hh - 1); f(T.back, x + 1, y + 1, 1, 1);
          f(T.hi, x + 2, y + 1, w - 4, 1); f(T.mort, x + 2, y + hh - 1, w - 3, 1); f(T.mort, x + w - 1, y + 2, 1, hh - 3);
          x += w + 1;
        }
      }
    } else {
      // 흙벽: 얼룩 조금 + 칸마다 나무 기둥·인방(위아래 가로대)
      f(T.plaster, 0, 0, VW, VH);
      for (let i = 0; i < 260; i++) { const x = hash(i, rx, 21) * VW, y = hash(i, ry, 23) * VH; f(hash(i, 5) > 0.5 ? T.plasterL : T.plasterD, x, y, 1 + (i % 3), 1); }
      if (T.broken) for (let i = 0; i < 14; i++) { const x = hash(i, rx, 31) * VW, y = hash(i, ry, 33) * VH; f(T.plasterD, x, y, 6 + (i % 4) * 3, 3 + (i % 3)); f(T.wood, x + 1, y + 1, 4, 1); }
    }
    // 칸마다 장식
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
      const wc = rx * 10 + c, wr = ry * 3 + r, ch = WORLD.at(wc, wr);
      if (ch === '#') continue;
      const x = c * TW, y = r * RH + OY, h = hash(wc, wr, 11);
      if (T.wall === 'plaster') {
        // 기둥은 칸 경계마다 하나 걸러, 위 인방은 늘
        if (wc % 2 === 0) { f(T.wood, x, y - 6, 4, 56); f(T.woodL, x + 1, y - 6, 1, 56); }
        f(T.wood, x, y + 2, TW, 3); f(T.woodL, x, y + 2, TW, 1);
        if (T.deco === 'dancheong') { for (let k = 0; k < 8; k++) f(k % 2 ? '#2f8a5a' : '#c83a2a', x + k * 4, y + 5, 4, 2); }
      }
      if (T.win && h < 0.2 && c > 0 && c < 9) {
        // 창호: 창호지 + 나무 살(격자) + 밤빛이 비침
        f(T.wood, x + 7, y + 10, 20, 26); f('#e8dcb4', x + 9, y + 12, 16, 22);
        for (let k = 0; k < 4; k++) f(T.woodL, x + 9 + k * 5, y + 12, 1, 22);
        for (let k = 0; k < 5; k++) f(T.woodL, x + 9, y + 12 + k * 5, 16, 1);
        f('rgba(255,230,160,.35)', x + 10, y + 13, 14, 20);
      } else if (h < 0.3 && T.wall === 'rock') {
        if (WORLD.floor(wc, wr)) for (let k = 0; k < 14; k++) { const w = Math.max(1, Math.round(5 - k * 0.32)); f(k % 4 === 0 ? T.hi : T.blkD, x + 16 - w / 2, y + 49 - k * 2, w, 2); }
      } else if (h < 0.36 && T.deco === 'rope') {
        // 옥사: 벽에 비스듬히 기대 세운 칼(긴 나무판, 목 들어가는 구멍) + 걸어 둔 짚 뭉치
        for (let k = 0; k < 34; k++) { const xx = x + 6 + k * 0.45; f('#1a0e12', xx - 1, y + 12 + k, 7, 1); f(k < 2 || k > 31 ? '#3a2614' : '#7a5634', xx, y + 12 + k, 5, 1); f('#9a7448', xx, y + 12 + k, 1, 1); }
        f('#1a0e12', x + 9, y + 17, 3, 3);
        for (let k = 0; k < 9; k++) f(k % 2 ? '#c8a860' : '#a08040', x + 20 + (k % 3), y + 10 + k * 2, 5 - (k % 2), 2);
      } else if (h < 0.36 && T.deco === 'vine') {
        for (let k = 0; k < 30; k++) { const vx = x + 8 + Math.sin(k * 0.5 + c) * 4 + (k % 3); f(k % 4 ? '#3e6a32' : '#5a8a3e', vx, y + k + 6, 2, 1); }
      } else if (h < 0.4 && T.deco === 'dancheong' && WORLD.floor(wc, wr)) {
        // 족자: 흰 종이에 먹 난초 몇 획
        // 족자: 흰 종이에 굽은 매화 가지와 붉은 꽃
        f('#3a2a1a', x + 11, y + 9, 10, 1); f('#f4ecd8', x + 12, y + 10, 8, 24); f('#6a4a2a', x + 11, y + 34, 10, 2);
        for (let k = 0; k < 9; k++) f('#3a2a1a', x + 13 + Math.round(Math.sin(k * 0.6) * 1.5 + k * 0.5), y + 30 - k * 2, 1, 2);
        f('#3a2a1a', x + 16, y + 20, 2, 1); f('#3a2a1a', x + 14, y + 25, 1, 1);
        for (const [dx, dy] of [[18, 19], [15, 15], [19, 23], [14, 27], [17, 13]]) { f('#e85a6a', x + dx - 1, y + dy, 3, 1); f('#e85a6a', x + dx, y + dy - 1, 1, 3); f('#ffd070', x + dx, y + dy, 1, 1); }
      }
      if (T.wall === 'rock' && WORLD.at(wc, wr - 1) !== ' ' && h > 0.5) { for (let k = 0; k < 4; k++) { const sx = x + 4 + k * 7 + hash(k, wc) * 4, sl = 3 + hash(wc, k) * 9; for (let j = 0; j < sl; j++) f(j < sl - 2 ? T.blkD : T.blk, sx + j / sl * 1.5, y - 6 + j, Math.max(1, 3 - j / sl * 3), 1); } }
    }
    if (T.dark && T.wall !== 'rock') for (let y = 0; y < VH; y++) for (let x = (y & 1); x < VW; x += 2) { const k = Math.abs(y - 90) / 90; if (k * T.dark > (((x >> 1) + y * 3) % 7) / 7 + 0.15) f('rgba(0,0,0,.3)', x, y, 1, 1); }
  }
  R.invalidate = () => (bgKey = '');
  // ---------- 칸 ----------
  function block(x, y, wc, wr) {   // 돌벽: 한 칸 = 위로 6 점 올려서(윗면이 위층 바닥과 맞게). 큰 돌을 쌓은 석축
    const T = R.theme; y -= 6;
    F(T.blkM, x, y, TW, RH);
    const rows = [0, 15, 29, 42, RH];
    for (let j = 0; j < 4; j++) {
      const y0 = rows[j], hh = rows[j + 1] - y0;
      let xx = -Math.floor(hash(wc, wr * 4 + j, 3) * 14);
      while (xx < TW) {
        const h = hash(wc * 50 + xx, wr * 50 + j, 9), w = 14 + Math.floor(h * 12);
        const x0 = Math.max(0, xx + 1), x1 = Math.min(TW, xx + w - 1);
        if (x1 > x0) {
          const col = h > 0.75 ? T.blkL : h < 0.2 ? T.blkD : T.blk;
          F(col, x + x0, y + y0 + 1, x1 - x0, hh - 2);
          F(T.blkL, x + x0, y + y0 + 1, x1 - x0, 1); if (xx + 1 >= 0) F(T.blkL, x + x0, y + y0 + 1, 1, hh - 2);
          F(T.blkD, x + x0, y + y0 + hh - 2, x1 - x0, 1); if (xx + w - 1 <= TW) F(T.blkD, x + x1 - 1, y + y0 + 2, 1, hh - 3);
          if (h > 0.4 && h < 0.5) F(T.blkD, x + x0 + 4, y + y0 + 5, 3, 1);
          if (h > 0.85) F(T.blkL, x + x0 + 3, y + y0 + 4, 2, 2);
        }
        xx += w;
      }
    }
    F(T.blkL, x, y, TW, 1);
  }
  function slab(x, y, c, r, kind, shake) {      // 바닥: 마루(나무 널) / 돌 / 기와
    const T = R.theme, sl = WORLD.floor(c - 1, r) && WORLD.at(c - 1, r) !== '#', sr = WORLD.floor(c + 1, r) && WORLD.at(c + 1, r) !== '#';
    y += shake ? ((Math.floor(shake * 40) % 2) ? 1 : 0) : 0;
    const x0 = sl ? x : x + 1, w = TW - (sl ? 0 : 1) - (sr ? 0 : 1);
    if (T.floor === 'giwa') {
      // 기와: 위는 암키와 줄, 앞은 수막새 동그라미가 줄지어
      F(T.topL, x0, y - 2, w, 1); F(T.top, x0, y - 1, w, 2); F(T.front, x0, y + 1, w, 5);
      for (let k = 1; k < w; k += 5) { F(T.topL, x0 + k, y + 2, 3, 3); F(T.frontD, x0 + k + 1, y + 3, 1, 1); }
    } else {
      F(T.topL, x0, y - 2, w, 1); F(T.top, x0, y - 1, w, 2); F(T.front, x0, y + 1, w, 3); F(T.frontD, x0, y + 4, w, 2);
      if (T.floor === 'maru') for (let k = 7; k < w; k += 8) F(T.frontD, x0 + k, y - 1, 1, 2);   // 널 이음
      else for (let k = 5; k < w; k += 11) F(T.frontD, x0 + k, y + 1, 1, 3);
    }
    if (kind === 'loose') {   // 썩은 마루: 검게 삭은 자국과 갈라진 틈
      F('#2a1a0e', x + 8, y - 1, 3, 2); F('#2a1a0e', x + 9, y + 1, 1, 3); F('#2a1a0e', x + 20, y - 2, 2, 3); F('#4a8a3a', x + 14, y - 2, 2, 1); F('#2a1a0e', x + 22, y + 1, 1, 2);
    } else { if (!sl) F('#1a0e12', x, y - 2, 1, 7); if (!sr) F('#1a0e12', x + TW - 1, y - 2, 1, 7); }
  }
  // 불 기둥(바닥 쇠창살 구멍에서 불이 솟는다)
  function fire(x, y, k, t) {
    F('#1a1416', x + 7, y - 2, 18, 2); for (let i = 0; i < 4; i++) F('#4a4448', x + 8 + i * 5, y - 2, 2, 2);
    if (k <= 0) { if (Math.floor(t * 8) % 3 === 0) F('#ff6a2a', x + 13 + (Math.floor(t * 13) % 6), y - 3, 1, 1); return; }
    const h = Math.round(4 + k * 40);
    for (let j = 0; j < h; j++) {
      const u = j / h, wv = Math.sin(t * 20 + j * 0.5) * 2 * u, w = Math.max(1, Math.round(10 * (1 - u * 0.75)));
      const col = u < 0.25 ? '#fff0a0' : u < 0.55 ? '#ffb02a' : u < 0.85 ? '#f05a1e' : '#a82a14';
      F(col, x + 16 - w / 2 + wv, y - 3 - j, w, 1);
      if (u > 0.3 && u < 0.6) F('#fff0a0', x + 16 - w / 4 + wv, y - 3 - j, Math.max(1, w / 2), 1);
    }
  }
  // 죽창 구덩이: 비스듬히 자른 대나무 끝
  function bamboo(x, y) {
    for (let i = 0; i < 6; i++) {
      const sx = x + 3 + i * 5, h = 9 + ((i * 7) % 4);
      F('#5a7a2a', sx, y - h, 3, h); F('#8ab040', sx, y - h, 1, h); F('#3a5018', sx + 2, y - h, 1, h);
      F('#e8e0a0', sx, y - h - 2, 1, 2); F('#c8c070', sx + 1, y - h - 1, 1, 1); F('#3a5018', sx, y - h + 4, 3, 1);
    }
  }
  // 돌절구: 천장에서 내려와 쾅. k 1 = 바닥까지
  function crusher(x, y, k, wc) {
    const T = R.theme, top = y - 52, bot = y - 2, len = 15, py = Math.round(top + 4 + (bot - len - top - 4) * k);
    F('#5a3e24', x + 14, top, 4, py - top); F('#7a5634', x + 14, top, 1, py - top);
    F('#1a0e12', x + 6, py - 1, 20, len + 2); F('#8a8680', x + 7, py, 18, len); F('#b0aca4', x + 7, py, 18, 2); F('#5a5650', x + 7, py + len - 3, 18, 3);
    F('#6a6660', x + 10, py + 5, 2, 4); F('#6a6660', x + 19, py + 7, 2, 3);
    if (k > 0.92) { F('#d8cfbe', x + 3, y - 4, 3, 2); F('#d8cfbe', x + 26, y - 5, 3, 2); F('#d8cfbe', x + 1, y - 7, 2, 1); F('#d8cfbe', x + 29, y - 8, 2, 1); }
  }
  // 옥문: 굵은 나무 살 + 쇠띠, 위로 말려 올라감
  function gate(x, y, open) {
    const h = Math.round(48 * (1 - open)), top = y - 50;
    F('#2a1a0e', x + 6, top - 3, 20, 4); F('#5a3e24', x + 6, top - 3, 20, 1);
    for (let i = 0; i < 4; i++) { F('#1a0e12', x + 7 + i * 5, top + 1, 4, h); F('#7a5634', x + 8 + i * 5, top + 1, 2, h); F('#9a7448', x + 8 + i * 5, top + 1, 1, h); }
    for (let j = 8; j < h; j += 14) { F('#1a0e12', x + 6, top + j, 20, 3); F('#5a5a64', x + 6, top + j + 1, 20, 1); }
  }
  function plate(x, y, down) { F('#1a0e12', x + 6, y - 3, 20, 2); F(down ? '#6a6660' : '#a8a49c', x + 7, y - 3 + (down ? 1 : 0), 18, 2); }
  // 나가는 문: 붉은 기둥 솟을대문, 위에 작은 기와지붕, 열리면 안쪽이 밝다
  function exitDoor(x, y, open, t) {
    const top = y - 46;
    F('#1a0e12', x - 4, top - 10, 40, 4); for (let k = 0; k < 40; k += 4) F('#3a3e4a', x - 4 + k, top - 12, 3, 3);
    F('#5a6070', x - 6, top - 9, 3, 2); F('#5a6070', x + 35, top - 9, 3, 2);
    F('#1a0e12', x + 1, top - 6, 30, 52); F('#8a2a1e', x + 2, top - 6, 4, 52); F('#8a2a1e', x + 26, top - 6, 4, 52); F('#8a2a1e', x + 2, top - 6, 28, 4);
    F('#2f8a5a', x + 6, top - 3, 20, 1);
    F('#f8e0a0', x + 6, top - 2, 20, 48); F('#ffe8b8', x + 10, top + 4, 12, 38); F('#e8c880', x + 6, top + 38, 20, 8);
    const dw = Math.round(10 * (1 - open));
    if (dw > 0) for (const sx of [x + 6, x + 26 - dw]) { F('#6a4a2a', sx, top - 2, dw, 48); for (let j = 4; j < 46; j += 10) F('#3a2614', sx, top - 2 + j, dw, 1); F('#d8a838', sx + (sx === x + 6 ? dw - 2 : 1), top + 20, 1, 3); }
  }
  // 불빛: 횃불 / 청사초롱 / 도깨비불
  function light(kind, x, y, t, s) {
    const f = Math.floor(t * 12 + s * 7) % 4;
    if (kind === 'lantern') {
      F('#3a2614', x + 2, y - 2, 1, 4); F('#1a0e12', x - 1, y + 2, 7, 13);
      F('#c83a2a', x, y + 3, 5, 6); F('#2f5ab4', x, y + 9, 5, 4); F('#ffd070', x + 1, y + 4, 3, 4); F('#e8b84a', x, y + 2, 5, 1); F('#e8b84a', x, y + 13, 5, 1);
      F('#c83a2a', x + 2, y + 15, 1, 2 + (f % 2));
    } else if (kind === 'wisp') {
      const yy = y + Math.round(Math.sin(t * 2 + s * 9) * 3);
      F('#2a6ad8', x, yy + 1, 5, 5); F('#6ac8ff', x + 1, yy - 1 + (f % 2), 3, 5); F('#e0f8ff', x + 2, yy + 1, 1, 2);
    } else {
      F('#3a2a1a', x + 1, y + 6, 3, 8); F('#a07a3a', x, y + 5, 5, 2);
      F('#d8501e', x, y - 1 + (f === 1 ? 1 : 0), 5, 6); F('#ff9a2a', x + 1, y - 3 + (f % 2), 3, 7); F('#ffe878', x + 2, y + (f === 2 ? 0 : 1), 1, 3);
    }
  }
  // 물건: 약과(체력 1) · 산삼(최대 체력 +1) · 엽전 꾸러미 · 환도
  function potion(x, y, kind, t) {
    if (kind === '*') {
      const cx = x + 16, by = y - 3, b = Math.round(Math.sin(t * 3));
      F('#1a0e12', cx - 4, by - 9 + b, 9, 9); F('#e8d0a0', cx - 3, by - 8 + b, 7, 5); F('#c8a878', cx - 1, by - 3 + b, 3, 3); F('#e8d0a0', cx - 3, by - 2 + b, 1, 2); F('#e8d0a0', cx + 3, by - 2 + b, 1, 2);
      F('#3a8a3a', cx - 1, by - 13 + b, 3, 4); F('#5ab04a', cx - 4, by - 14 + b, 3, 2); F('#5ab04a', cx + 2, by - 14 + b, 3, 2); F('#e83a2a', cx, by - 16 + b, 2, 2);
      const s = Math.floor(t * 6) % 6; if (s < 2) F('#fff', cx - 6 + s * 12, by - 12, 1, 1);
      return;
    }
    const cx = x + 16, by = y - 3;
    F('#1a0e12', cx - 4, by - 5, 9, 5); F('#e8d8c0', cx - 5, by - 1, 11, 1);
    F('#c8742a', cx - 3, by - 4, 7, 3); F('#e8964a', cx - 2, by - 4, 5, 1); F('#8a4a1a', cx - 1, by - 3, 3, 1); F('#f0c060', cx, by - 4, 1, 1);
  }
  function gem(x, y, t) {   // 엽전 꾸러미: 끈에 꿴 동전 셋
    const cx = x + 16, cy = y - 7 + Math.round(Math.sin(t * 3) * 1.5);
    F('#c83a2a', cx - 1, cy - 7, 2, 14);
    for (let i = -1; i <= 1; i++) { const yy = cy + i * 4; F('#1a0e12', cx - 3, yy - 2, 7, 5); F('#e8b84a', cx - 2, yy - 1, 5, 3); F('#fff0a0', cx - 2, yy - 1, 2, 1); F('#5a3a10', cx, yy, 1, 1); }
    const s = Math.floor(t * 5) % 8; if (s < 2) { F('#fff', cx + 4, cy - 5, 1, 3); F('#fff', cx + 3, cy - 4, 3, 1); }
  }
  function swordItem(x, y) { F('#1a0e12', x + 5, y - 4, 22, 3); F('#34281e', x + 10, y - 3, 16, 1); F('#5a4a3a', x + 12, y - 3, 10, 1); F('#d8a838', x + 9, y - 5, 2, 4); F('#34343c', x + 6, y - 4, 3, 2); }
  // 화살 쏘는 구멍(벽에 붙은 나무 상자, 입은 바라보는 쪽)
  function shooter(x, y, d) {
    const bx = d > 0 ? x + 1 : x + TW - 9, hy = y - 34;
    F('#1a0e12', bx - 1, hy - 5, 10, 11); F('#7a5634', bx, hy - 4, 8, 9); F('#9a7448', bx, hy - 4, 8, 1); F('#c83a2a', bx + 1, hy - 2, 6, 1);
    F('#1a0e12', d > 0 ? bx + 6 : bx, hy, 2, 2);
  }
  R.potion = potion; R.gem = gem;

  R.drawRoom = function (t, drawActors) {
    const T = R.theme, key = R.rx + ',' + R.ry + ',' + (R.themeName || '') + ',' + R.moonX;
    if (key !== bgKey) { drawBack(); bgKey = key; }
    g.drawImage(bgc, 0, 0);
    const S = WORLD.state, c0 = R.rx * 10, r0 = R.ry * 3;
    if (T.light) for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
      const wc = c0 + c, wr = r0 + r; if (WORLD.at(wc, wr) === '#') continue;
      const h = hash(wc, wr, 11); if (h > 0.42 && h < 0.56 && WORLD.floor(wc, wr)) light(T.light, c * TW + 14, r * RH + OY + 16, t, h);
    }
    for (let r = -1; r <= 3; r++) for (let c = 0; c < 10; c++) {
      const wc = c0 + c, wr = r0 + r, ch = WORLD.at(wc, wr), x = c * TW, y = r * RH + OY + WORLD.SURF;
      if (ch === '#') { block(x, r * RH + OY, wc, wr); continue; }
      if (ch === 'E' && S.exit) exitDoor(x, y, S.exit.open, t);
      if (ch === '>' || ch === '<') shooter(x, y, ch === '>' ? 1 : -1);
      if (!WORLD.floor(wc, wr)) continue;
      const L = S.loose[wc + ',' + wr];
      slab(x, y, wc, wr, ch === '~' ? 'loose' : '', L && L.shake);
      if (ch === '^') fire(x, y, WORLD.spikeK(wc, wr, S.t), S.t + wc);
      else if (ch === 'v') bamboo(x, y);
      if ((ch >= 'a' && ch <= 'd') || ch === 'z') plate(x, y, S.pressed && S.pressed[wc + ',' + wr]);
      if (S.rubble[wc + ',' + wr]) { F(T.front, x + 6, y - 3, 6, 2); F(T.top, x + 14, y - 2, 4, 1); F(T.frontD, x + 20, y - 3, 5, 2); }
    }
    for (const it of S.items) {
      if (it.got) continue;
      const x = (it.c - c0) * TW, y = (it.r - r0) * RH + OY + WORLD.SURF;
      if (x < -TW || x > VW || y < 0 || y > VH + 60) continue;
      if (it.k === '+' || it.k === '*') potion(x, y, it.k, t + it.c);
      else if (it.k === '$') gem(x, y, t + it.c);
      else if (it.k === 'Y') swordItem(x, y);
    }
    for (const f of S.falling) { const x = R.sx(f.x), y = R.sy(f.y); F(T.top, x + 1, y - 2, TW - 2, 3); F(T.front, x + 1, y + 1, TW - 2, 3); }
    drawActors();
    // 화살
    for (const a of S.arrows || []) { const x = Math.round(R.sx(a.x)), y = Math.round(R.sy(a.y)); F('#7a5634', x - 6 * a.d, y, 1, 1); F('#e8e0c8', a.d > 0 ? x - 9 : x + 1, y, 9, 1); F('#c8ccd8', a.d > 0 ? x : x - 2, y, 2, 1); F('#c83a2a', a.d > 0 ? x - 10 : x + 9, y - 1, 2, 1); F('#c83a2a', a.d > 0 ? x - 10 : x + 9, y + 1, 2, 1); }
    // 앞에 오는 것: 옥문·돌절구·불
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
      const wc = c0 + c, wr = r0 + r, ch = WORLD.at(wc, wr), x = c * TW, y = r * RH + OY + WORLD.SURF;
      if (ch >= 'A' && ch <= 'D') gate(x, y, WORLD.gateAt(wc, wr).open);
      else if (ch === '%') crusher(x, y, WORLD.chopK(wc, wr, S.t), wc);
    }
  };
})();