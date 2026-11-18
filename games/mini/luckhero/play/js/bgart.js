// 운빨용사 배경(320x240, 땅 줄 140): 흙빛 팔레트로 촘촘히 그린 숲·동굴 묘지·마왕성. 한 점씩 찍는다.
(function () {
  const W = 320, H = 240, GL = 140;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const BY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function Canvas() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), im = g.createImageData(W, H), d = im.data;
    const P = {
      cv, g,
      px(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const k = (y * W + x) * 4, q = typeof c === 'string' ? hex(c) : c; d[k] = q[0]; d[k + 1] = q[1]; d[k + 2] = q[2]; d[k + 3] = 255; },
      get(x, y) { const k = (y * W + x) * 4; return [d[k], d[k + 1], d[k + 2]]; },
      rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.px(x + i, y + j, c); },
      // 위→아래 색 띠를 디더로 섞는다
      grad(y0, y1, cols) {
        for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
          const t = ((y - y0) / (y1 - y0)) * (cols.length - 1), i = Math.floor(t), f = t - i;
          P.px(x, y, f * 16 > BY[y & 3][x & 3] ? cols[Math.min(cols.length - 1, i + 1)] : cols[i]);
        }
      },
      // 공 모양 덩어리: 빛은 왼쪽 위, tones = [밝은, 중간, 어두운, 가장 어두운]
      blob(cx, cy, rx, ry, tones, o) {
        o = o || {};
        for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, r = dx * dx + dy * dy;
          if (r > 1) continue;
          if (o.rough && r > 0.7 && hash(x, y) < 0.35) continue;
          if (o.maxY !== undefined && y > o.maxY) continue;
          let l = -dx * 0.55 - dy * 0.75 + Math.sqrt(Math.max(0, 1 - r)) * 0.4 + (BY[y & 3][x & 3] / 16 - 0.5) * 0.28;
          P.px(x, y, l > 0.55 ? tones[0] : l > 0.12 ? tones[1] : l > -0.3 ? tones[2] : tones[3]);
        }
      },
      // 빛(더하기): 부드러운 원
      glow(cx, cy, r, c, a) {
        const q = hex(c);
        for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const t = 1 - Math.hypot(x - cx, y - cy) / r; if (t <= 0) continue;
          const k = (y * W + x) * 4, s = t * t * a;
          if (s * 16 < BY[y & 3][x & 3] * 0.35) continue;
          d[k] = Math.min(255, d[k] + q[0] * s); d[k + 1] = Math.min(255, d[k + 1] + q[1] * s); d[k + 2] = Math.min(255, d[k + 2] + q[2] * s);
        }
      },
      // 비스듬한 빛줄기
      ray(x0, w, slope, c, a, y0, y1) {
        const q = hex(c);
        for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
          const u = x - (x0 + (y - y0) * slope); if (u < 0 || u > w) continue;
          const t = Math.sin((u / w) * Math.PI) * a * (1 - (y - y0) / (y1 - y0) * 0.6);
          const k = (y * W + x) * 4;
          d[k] = Math.min(255, d[k] + q[0] * t); d[k + 1] = Math.min(255, d[k + 1] + q[1] * t); d[k + 2] = Math.min(255, d[k + 2] + q[2] * t);
        }
      },
      done() { g.putImageData(im, 0, 0); return cv; },
    };
    return P;
  }
  function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const LEAF = ['#a8c078', '#6e9050', '#4a6a40', '#2c4232'], LEAF2 = ['#8aa868', '#5a7e48', '#3e5a3a', '#26382e'];
  function tree(P, x, top, trunkW, size, tones) {
    for (let y = top + size * 0.6; y < GL + 4; y++) for (let i = 0; i < trunkW; i++) {
      const c = i < 2 ? '#8e603e' : i > trunkW - 3 ? '#3a2a22' : (hash(x + i, y >> 1) < 0.15 ? '#3a2a22' : '#5e3e2c');
      P.px(x + i - trunkW / 2, y, c);
    }
    P.blob(x - trunkW / 2 - 4, GL + 2, 6, 3, ['#8e603e', '#5e3e2c', '#3a2a22', '#26201c']);
    P.blob(x + trunkW / 2 + 3, GL + 2, 5, 3, ['#8e603e', '#5e3e2c', '#3a2a22', '#26201c']);
    const n = Math.round(size / 5);
    for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r = rnd() * size * 0.55; P.blob(x + Math.cos(a) * r * 1.3, top + size * 0.35 + Math.sin(a) * r * 0.7, size * (0.3 + rnd() * 0.18), size * (0.26 + rnd() * 0.14), tones, { rough: 1 }); }
  }
  function cloud(P, x, y, s) {
    const T = ['#f4f2e8', '#e2e2d6', '#c4ccc8', '#aab8bc'];
    for (let i = 0; i < 6; i++) P.blob(x + (i - 2.5) * s * 0.55 + rnd() * 4, y - Math.sin((i / 5) * Math.PI) * s * 0.4, s * 0.5, s * 0.38, T, { maxY: y + 3 });
  }
  function grass(P, y0, cols) {
    P.grad(y0, H, cols);
    for (let i = 0; i < 700; i++) { const x = rnd() * W | 0, y = y0 + (rnd() * (H - y0)) | 0, c = rnd() < 0.5 ? cols[0] : cols[2]; P.px(x, y, c); }
    for (let x = 0; x < W; x += 1) { const h = hash(x, 7) < 0.4 ? 2 : hash(x, 9) < 0.3 ? 3 : 1; for (let k = 0; k < h; k++) P.px(x, y0 - k, k ? '#a8c078' : '#8aa868'); }
  }

  function forest() {
    seed = 11; const P = Canvas();
    P.grad(0, GL, ['#8eaab8', '#a4bcc0', '#bccbbc', '#d4d6b8', '#e8dfb4']);
    P.glow(170, 112, 70, '#fff0c0', 0.5);
    P.blob(170, 104, 13, 13, ['#fff8dc', '#fff0c4', '#f4e2b0', '#ead6a4']);
    cloud(P, 40, 40, 22); cloud(P, 120, 28, 16); cloud(P, 250, 46, 26); cloud(P, 300, 22, 14);
    // 먼 산 두 겹
    for (let x = 0; x < W; x++) { const h = 22 + Math.sin(x * 0.021 + 1) * 10 + Math.sin(x * 0.07) * 4; for (let y = GL - 32 - h; y < GL; y++) P.px(x, y, y < GL - 32 - h + 2 ? '#a4b4b4' : '#8ea0a4'); }
    for (let x = 0; x < W; x++) { const h = 12 + Math.sin(x * 0.033 + 4) * 7 + Math.sin(x * 0.11) * 3; for (let y = GL - 16 - h; y < GL; y++) P.px(x, y, y < GL - 16 - h + 2 ? '#8ea08c' : '#76887a'); }
    // 가운데 숲 줄
    for (let i = 0; i < 26; i++) P.blob(i * 13 + rnd() * 6, GL - 8 - rnd() * 6, 9 + rnd() * 5, 8 + rnd() * 4, ['#7e9a68', '#5e7a54', '#465e46', '#34463a'], { rough: 1 });
    P.ray(120, 26, 0.5, '#fff4d0', 0.16, 0, GL);
    P.ray(196, 16, 0.5, '#fff4d0', 0.12, 0, GL);
    // 앞 큰 나무(양옆 틀)
    tree(P, 14, 0, 12, 60, LEAF); tree(P, 304, 4, 12, 58, LEAF);
    tree(P, 62, 30, 6, 34, LEAF2); tree(P, 262, 34, 6, 30, LEAF2);
    grass(P, GL, ['#8aa862', '#6e8e50', '#587844', '#46623a', '#3a5232', '#2e4228']);
    // 흙길
    for (let y = GL + 6; y < H; y++) { const w = 60 + (y - GL) * 1.6, cx = 160 + Math.sin(y * 0.05) * 8; for (let x = cx - w / 2; x < cx + w / 2; x++) { const e = Math.abs(x - cx) / (w / 2); if (e > 0.9 && hash(x | 0, y) < 0.5) continue; P.px(x, y, e > 0.75 ? '#8e7a58' : hash(x | 0, y) < 0.08 ? '#7a6648' : '#a8916a'); } }
    for (let i = 0; i < 40; i++) { const x = rnd() * W, y = GL + 4 + rnd() * 90; P.px(x, y, ['#e8d8a8', '#d4848a', '#c8b4d8'][i % 3]); P.px(x, y - 1, '#6e8e50'); }
    for (let i = 0; i < 14; i++) P.blob(rnd() * W, GL + 8 + rnd() * 80, 3 + rnd() * 3, 2 + rnd() * 2, ['#c8c0b8', '#948c88', '#626064', '#3a3842']);
    return P.done();
  }

  function crypt() {
    seed = 23; const P = Canvas();
    const ROCK = ['#8a8a6a', '#6a6c50', '#4e523e', '#34382a'];
    P.grad(0, GL, ['#262a1e', '#30362a', '#3a4030', '#444a36']);
    // 바위 벽: 덩어리를 겹겹이
    for (let i = 0; i < 70; i++) P.blob(rnd() * W, rnd() * (GL - 10), 10 + rnd() * 22, 8 + rnd() * 16, ROCK);
    for (let i = 0; i < 26; i++) P.blob(rnd() * W, GL - 14 - rnd() * 30, 14 + rnd() * 20, 10 + rnd() * 12, ['#9a9874', '#7a7a5a', '#5c5e44', '#404432']);
    // 종유석
    for (let i = 0; i < 18; i++) { const x = rnd() * W, len = 10 + rnd() * 26, w = 3 + rnd() * 4; for (let y = 0; y < len; y++) { const ww = w * (1 - y / len); for (let k = -ww; k < ww; k++) P.px(x + k, y, k < -ww * 0.3 ? '#8a8a6a' : k > ww * 0.4 ? '#34382a' : '#6a6c50'); } }
    // 뒤쪽 무덤 문(보랏빛)
    const dx = 160, dy = GL - 4;
    for (let y = dy - 52; y < dy; y++) for (let x = dx - 24; x < dx + 24; x++) { const ins = (x - dx) ** 2 / 400 + Math.max(0, (dy - 30 - y)) ** 2 / 500 < 1 && y > dy - 48; const fr = (x - dx) ** 2 / 576 + Math.max(0, (dy - 30 - y)) ** 2 / 650 < 1; if (fr && !ins) P.px(x, y, x < dx ? '#9a9874' : '#5c5e44'); else if (ins) P.px(x, y, '#181c12'); }
    P.glow(dx, dy - 22, 46, '#a8c860', 0.45);
    // 묘비
    for (let i = 0; i < 7; i++) {
      const x = 18 + i * 48 + rnd() * 10, y = GL + 2; if (Math.abs(x - dx) < 34) continue;
      for (let yy = y - 18; yy < y; yy++) for (let xx = x - 6; xx < x + 6; xx++) { const top = yy < y - 13 && (xx - x) ** 2 + (yy - (y - 13)) ** 2 > 36; if (top) continue; P.px(xx, yy, xx < x - 3 ? '#aaa888' : xx > x + 3 ? '#56583e' : '#8a8a6a'); }
      P.rect(x - 1, y - 14, 2, 8, '#3e4230'); P.rect(x - 3, y - 12, 6, 2, '#3e4230');
    }
    // 땅
    P.grad(GL, H, ['#5e5e46', '#4e503a', '#424430', '#363a28', '#2c3020']);
    for (let i = 0; i < 40; i++) P.blob(rnd() * W, GL + 4 + rnd() * 90, 2 + rnd() * 6, 1.5 + rnd() * 3, ROCK);
    for (let i = 0; i < 500; i++) P.px(rnd() * W, GL + rnd() * 100, rnd() < 0.5 ? '#6e6e52' : '#2e3222');
    // 위에서 내려오는 빛 + 촛불
    P.ray(130, 60, 0.18, '#f0dcb0', 0.2, 0, H);
    for (const [x, y] of [[54, GL - 2], [266, GL - 4], [100, GL + 30], [228, GL + 26]]) { P.rect(x, y - 6, 3, 6, '#e6dcc4'); P.px(x + 1, y - 7, '#f4c860'); P.px(x + 1, y - 8, '#fff4c0'); P.glow(x + 1, y - 7, 22, '#f0a050', 0.55); }
    return P.done();
  }

  function castle() {
    seed = 37; const P = Canvas();
    // 벽돌 벽
    P.rect(0, 0, W, GL, '#3a3424');
    for (let y = 0; y < GL; y += 10) for (let x = ((y / 10) % 2) * 9 - 9; x < W; x += 18) {
      const v = hash(x, y) * 0.3;
      for (let j = 0; j < 9; j++) for (let i = 0; i < 17; i++) { const c = j === 0 || i === 0 ? '#6a5c3c' : j === 8 || i === 16 ? '#2a2418' : v > 0.2 ? '#54482e' : '#4a4028'; P.px(x + i, y + j, c); }
    }
    // 기둥
    for (const x of [24, 108, 212, 296]) {
      for (let y = 0; y < GL; y++) for (let i = -10; i < 10; i++) { const c = i < -7 ? '#9a8a5c' : i < -3 ? '#7a6c46' : i > 6 ? '#2e2a1c' : '#5e5236'; P.px(x + i, y, c); }
      P.rect(x - 13, GL - 8, 26, 8, '#7a6c46'); P.rect(x - 13, GL - 8, 26, 2, '#9a8a5c'); P.rect(x - 13, 10, 26, 6, '#7a6c46');
    }
    // 깃발
    for (const x of [66, 254]) { for (let y = 8; y < 82; y++) for (let i = -12; i < 12; i++) { if (y > 74 && Math.abs(i) < (y - 74) * 1.6) continue; P.px(x + i, y, i < -9 ? '#b4483c' : i > 8 ? '#5a2030' : '#7c2c34'); } P.blob(x, 36, 6, 6, ['#f4e09a', '#d4a84a', '#9a6e32', '#5a3e24']); P.rect(x - 14, 6, 28, 3, '#9a6e32'); }
    // 횃불
    for (const x of [108, 212]) { P.rect(x - 2, 56, 4, 10, '#66442e'); P.blob(x, 52, 4, 6, ['#fff4c0', '#f4c860', '#dc7a3a', '#9a3e2c']); P.glow(x, 52, 46, '#f09040', 0.6); }
    // 가운데 왕좌 쪽 붉은 빛
    P.glow(160, 70, 70, '#c8a040', 0.25);
    // 바닥: 돌판 + 붉은 융단
    P.grad(GL, H, ['#5a5038', '#4a422e', '#3e3826', '#322c1e']);
    for (let y = GL; y < H; y += 12) for (let x = 0; x < W; x++) P.px(x, y, '#2a2418');
    for (let y = GL; y < H; y++) { const w = 70 + (y - GL) * 1.4; for (let x = 160 - w / 2; x < 160 + w / 2; x++) { const e = Math.abs(x - 160) / (w / 2); P.px(x, y, e > 0.88 ? '#d4a84a' : hash(x | 0, y) < 0.05 ? '#6a2438' : '#7c2c34'); } }
    return P.done();
  }

  const cache = {};
  SP.bg = (act) => cache[act] || (cache[act] = [forest, crypt, castle][act]());
})();
