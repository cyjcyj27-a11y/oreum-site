// 운빨용사 도트 그림: 작은 버퍼에 도형(공·막대·다각형)을 놓으면 빛(왼쪽 위)으로 네 단계 명암 + 디더링 + 외곽선을 찍어 준다.
// 그림체 규칙(design.md): 한 도트가 또렷, 안티에일리어싱 없음, 재료마다 네 색 띠, 바깥 외곽선 #140e1c, 빛은 왼쪽 위.
(function () {
  const SP = (window.SP = {});
  const OUT = '#1e1a26';
  const M = (SP.M = {
    // 채도를 낮춘 흙빛 팔레트. 그늘은 보라·남색 쪽으로, 밝은 쪽은 따뜻하게 돌린다
    skin: ['#f2d0a8', '#d49c74', '#a26a50', '#5e3a36'],
    hair: ['#c8935c', '#94603a', '#643c2c', '#3a2424'],
    steel: ['#e6e6e0', '#a8acb4', '#6e7286', '#3c3d52'],
    gold: ['#f4e09a', '#d4a84a', '#9a6e32', '#5a3e24'],
    red: ['#e08a70', '#b4483c', '#7c2c34', '#461c2a'],
    blue: ['#9cc0d0', '#5a84a8', '#3a5478', '#232e4a'],
    green: ['#bcc88a', '#7e9a54', '#4e6a40', '#2c3c30'],
    slime: ['#c8e0a0', '#86b46a', '#4e7e52', '#2a4a40'],
    purple: ['#c4a4c8', '#8a6a9c', '#5a426e', '#33263f'],
    bone: ['#f0e8d8', '#d0c4a8', '#9a8c76', '#5c5248'],
    wood: ['#d4a874', '#9a6c44', '#66442e', '#3a2a22'],
    dark: ['#7c7486', '#524a5e', '#342e40', '#1e1a26'],
    ghost: ['#eef0ec', '#c4d4d8', '#8ea4b4', '#566a80'],
    cloth: ['#e6dcc4', '#b8a888', '#7e7060', '#4a4240'],
    brown: ['#c8946a', '#8e603e', '#5e3e2c', '#36261e'],
    pink: ['#ecbcc4', '#c88496', '#8e526a', '#52304a'],
    orange: ['#ecc088', '#cc8650', '#94543a', '#583228'],
    fire: ['#fff4c0', '#f4c860', '#dc7a3a', '#9a3e2c'],
    stone: ['#c8c0b8', '#948c88', '#626064', '#3a3842'],
    cyan: ['#c4e4dc', '#7ab8b4', '#4a7e88', '#2a4a5a'],
    leaf: ['#b4d48a', '#6ea45a', '#3e7048', '#244232'],
    navy: ['#8a94c0', '#535e94', '#343c66', '#1e223e'],
    crimson: ['#d47a86', '#9e3a50', '#6a2438', '#3a1626'],
  });
  const hexCache = {};
  function rgb(h) { if (hexCache[h]) return hexCache[h]; const n = parseInt(h.slice(1), 16); return (hexCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]); }
  const BAYER = [0, 2, 3, 1];
  const L = [-0.55, -0.72, 0.42]; { const l = Math.hypot(L[0], L[1], L[2]); L[0] /= l; L[1] /= l; L[2] /= l; }

  // 그림판
  function Pad(w, h) {
    this.w = w; this.h = h; this.c = new Array(w * h).fill(null); this.raw = new Uint8Array(w * h);
  }
  Pad.prototype.put = function (x, y, col, raw) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.c[y * this.w + x] = col; this.raw[y * this.w + x] = raw ? 1 : 0; };
  // 공 모양 명암: dx,dy 는 -1..1
  function band(mat, nx, ny, x, y, flat) {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let d = nx * L[0] + ny * L[1] + (flat ? 1.2 : nz) * L[2];
    d += (BAYER[(x & 1) + (y & 1) * 2] - 1.5) * 0.06;
    const r = M[mat] || mat;
    return d > 0.74 ? r[0] : d > 0.3 ? r[1] : d > -0.12 ? r[2] : r[3];
  }
  Pad.prototype.E = function (cx, cy, rx, ry, mat, o) {
    o = o || {};
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (o.maxY !== undefined && y > o.maxY) continue;
      if (o.minY !== undefined && y < o.minY) continue;
      this.put(x, y, o.col || band(mat, dx * 0.92, dy * 0.92, x, y, o.flat), o.raw);
    }
    return this;
  };
  Pad.prototype.R = function (x0, y0, w, h, mat, o) {
    o = o || {};
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const dx = ((x + 0.5 - x0) / w) * 2 - 1, dy = ((y + 0.5 - y0) / h) * 2 - 1;
      this.put(x, y, o.col || band(mat, dx * 0.75, dy * 0.6, x, y, o.flat), o.raw);
    }
    return this;
  };
  function inPoly(px, py, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > py) !== (b[1] > py) && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  Pad.prototype.P = function (pts, mat, o) {
    o = o || {};
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.max(1, (x1 - x0) / 2), ry = Math.max(1, (y1 - y0) / 2);
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      if (!inPoly(x + 0.5, y + 0.5, pts)) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      this.put(x, y, o.col || band(mat, dx * 0.8, dy * 0.8, x, y, o.flat), o.raw);
    }
    return this;
  };
  // 둥근 막대(원기둥 명암)
  Pad.prototype.L = function (x0, y0, x1, y1, r, mat, o) {
    o = o || {};
    const vx = x1 - x0, vy = y1 - y0, ll = Math.hypot(vx, vy) || 1, nx = -vy / ll, ny = vx / ll;
    const r1 = o.r1 !== undefined ? o.r1 : r;
    for (let y = Math.floor(Math.min(y0, y1) - Math.max(r, r1) - 1); y <= Math.ceil(Math.max(y0, y1) + Math.max(r, r1) + 1); y++)
      for (let x = Math.floor(Math.min(x0, x1) - Math.max(r, r1) - 1); x <= Math.ceil(Math.max(x0, x1) + Math.max(r, r1) + 1); x++) {
        const px = x + 0.5 - x0, py = y + 0.5 - y0;
        let t = (px * vx + py * vy) / (ll * ll); t = Math.max(0, Math.min(1, t));
        const qx = px - vx * t, qy = py - vy * t, rr = r + (r1 - r) * t;
        const d = Math.hypot(qx, qy);
        if (d > rr) continue;
        const s = (qx * nx + qy * ny) / rr; // -1..1 가로지름
        this.put(x, y, o.col || band(mat, nx * s * 0.9, ny * s * 0.9, x, y), o.raw);
      }
    return this;
  };
  Pad.prototype.D = function (x, y, col) { this.put(x, y, col, 1); return this; };
  Pad.prototype.DR = function (x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, col, 1); return this; };
  // 좌우 뒤집어 한 번 더(대칭 그림)
  Pad.prototype.sym = function (fn) {
    const self = this, W = this.w;
    fn(this);
    const m = {
      E: (cx, cy, rx, ry, mat, o) => self.E(W - cx, cy, rx, ry, mat, o),
      R: (x, y, w, h, mat, o) => self.R(W - x - w, y, w, h, mat, o),
      P: (pts, mat, o) => self.P(pts.map((p) => [W - p[0], p[1]]), mat, o),
      L: (x0, y0, x1, y1, r, mat, o) => self.L(W - x0, y0, W - x1, y1, r, mat, o),
      D: (x, y, c) => self.D(W - 1 - x, y, c),
      DR: (x, y, w, h, c) => self.DR(W - x - w, y, w, h, c),
    };
    fn(m);
    return this;
  };
  // 외곽선 + 캔버스로
  Pad.prototype.done = function (noOutline) {
    const W = this.w, H = this.h, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), im = g.createImageData(W, H), d = im.data;
    const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? this.c[y * W + x] : null);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c, col = this.c[y * W + x];
      if (col === null) {
        if (noOutline) continue;
        const nb = at(x, y + 1) || at(x - 1, y) || at(x + 1, y) || at(x, y - 1);
        if (!nb) continue;
        const q = rgb(nb); c = [q[0] * 0.22 + 22 * 0.78, q[1] * 0.22 + 18 * 0.78, q[2] * 0.22 + 30 * 0.78];
      } else c = mute(rgb(col));
      const k = (y * W + x) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  };
  // 쨍한 원색(눈·불빛)도 한 번 눌러 준다
  function mute(c) {
    const l = (Math.max(c[0], c[1], c[2]) + Math.min(c[0], c[1], c[2])) / 2;
    return [Math.round(l + (c[0] - l) * 0.82), Math.round(l + (c[1] - l) * 0.82), Math.round(l + (c[2] - l) * 0.82)];
  }
  SP.mute = mute;
  SP.Pad = Pad;

  // 하얗게(맞을 때 번쩍)·그림자 판
  SP.tint = function (cv, col) {
    const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; t.dpu = cv.dpu; t.lw = cv.lw; t.lh = cv.lh;
    const g = t.getContext('2d'); g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, t.width, t.height);
    return t;
  };

  const EY = (p, x, y, c) => { p.DR(x, y, 2, 3, OUT); p.D(x, y, c || '#ffffff'); };

  // ───────── 인물·괴물 ─────────
  const DEF = {};
  DEF.hero = () => {
    const p = new Pad(48, 48);
    // 망토
    p.P([[14, 20], [24, 18], [24, 40], [9, 45], [11, 30]], 'crimson');
    // 다리(정강이 갑옷)·장화
    p.L(21, 34, 19, 43, 2.4, 'steel'); p.L(27, 34, 29, 43, 2.4, 'steel');
    p.E(18, 44, 3.9, 2.3, 'brown'); p.E(30, 44, 3.9, 2.3, 'brown');
    // 사슬 갑옷 + 파란 겉옷
    p.E(24, 27, 7.5, 7, 'steel');
    p.P([[17, 23], [31, 23], [32, 38], [24, 36], [16, 38]], 'blue');
    p.DR(23, 26, 2, 2, '#6ea45a'); p.DR(26, 26, 2, 2, '#6ea45a'); p.DR(23, 29, 2, 2, '#6ea45a'); p.DR(26, 29, 2, 2, '#6ea45a'); p.D(25, 31, '#3e7048');
    p.DR(16, 33, 17, 2, '#3a2a22'); p.DR(23, 33, 3, 2, '#d4a84a');
    // 뒤 팔의 둥근 방패
    p.E(14, 29, 7.5, 8.5, 'steel'); p.E(14, 29, 6, 7, 'wood');
    p.DR(13, 22, 2, 14, '#9a6e32'); p.DR(8, 28, 12, 2, '#9a6e32'); p.E(14, 29, 2, 2, 'gold');
    // 앞 어깨·팔·칼
    p.E(28, 23, 4.6, 3.3, 'steel');
    p.L(29, 25, 33, 30, 2.2, 'steel'); p.E(34, 30, 2.3, 2.3, 'brown');
    p.L(35, 28, 45, 8, 1.6, 'steel', { r1: 1 });
    p.L(32, 26, 38, 31, 1.1, 'gold'); p.E(33, 32.5, 1.4, 1.4, 'gold');
    // 머리·투구
    p.P([[17, 14], [21, 14], [20, 20], [17, 19]], 'hair');
    p.E(25, 16, 6.8, 6.6, 'skin');
    p.E(25, 13, 7.4, 6.2, 'steel', { maxY: 11 });
    p.R(18, 11, 15, 2, 'steel');
    p.L(31, 13, 31, 18, 0.7, 'steel');
    p.P([[23, 8], [20, 3], [15, 3], [18, 7], [21, 9]], 'red');
    // 얼굴
    p.DR(27, 15, 3, 1, '#3a2424'); p.DR(28, 16, 2, 3, '#1e1a26'); p.D(28, 16, '#ffffff');
    p.D(26, 18, '#e0907a'); p.DR(29, 20, 2, 1, '#7a4a3e');
    return p.done();
  };
  DEF.slime = () => {
    const p = new Pad(48, 48);
    p.E(24, 35, 17, 12, 'slime', { maxY: 45 });
    p.E(24, 24, 5, 6, 'slime');
    p.E(16, 33, 4, 5, '#ffffff', { col: '#ffffff', raw: 1 }); p.E(31, 33, 4, 5, '#ffffff', { col: '#ffffff', raw: 1 });
    p.E(17, 34, 2.2, 3.2, OUT, { col: OUT, raw: 1 }); p.E(32, 34, 2.2, 3.2, OUT, { col: OUT, raw: 1 });
    p.D(16, 32, '#ffffff'); p.D(31, 32, '#ffffff');
    p.DR(21, 40, 7, 1, '#1c6a4a'); p.DR(22, 41, 5, 1, '#1c6a4a');
    p.DR(12, 27, 3, 2, '#ffffff'); p.D(22, 21, '#ffffff');
    return p.done();
  };
  DEF.bat = () => {
    const p = new Pad(48, 48);
    p.sym((q) => {
      q.P([[22, 22], [4, 12], [2, 22], [6, 21], [7, 28], [11, 25], [14, 32], [18, 26]], 'purple');
      q.P([[18, 14], [16, 6], [22, 12]], 'purple');
    });
    p.E(24, 22, 8, 9, 'purple');
    EY(p, 19, 19, '#ff5a5a'); EY(p, 27, 19, '#ff5a5a');
    p.DR(19, 19, 2, 3, '#ff3a3a'); p.DR(27, 19, 2, 3, '#ff3a3a'); p.D(19, 19, '#ffffff'); p.D(27, 19, '#ffffff');
    p.DR(22, 25, 4, 1, OUT); p.D(22, 26, '#ffffff'); p.D(25, 26, '#ffffff');
    return p.done();
  };
  DEF.goblin = () => {
    const p = new Pad(48, 48);
    p.L(20, 36, 19, 44, 2.4, 'green'); p.L(27, 36, 29, 44, 2.4, 'green');
    p.E(18, 45, 3.5, 1.8, 'brown'); p.E(30, 45, 3.5, 1.8, 'brown');
    p.E(24, 31, 8, 8, 'green');
    p.P([[15, 34], [33, 34], [31, 40], [17, 40]], 'brown');
    p.L(31, 28, 36, 33, 2.2, 'green'); p.E(37, 33, 2.3, 2.3, 'green');
    p.L(38, 33, 44, 26, 1.4, 'steel', { r1: 0.6 });
    p.P([[13, 15], [3, 9], [12, 21]], 'green'); p.P([[34, 15], [44, 9], [35, 21]], 'green');
    p.E(24, 17, 10, 8.5, 'green');
    EY(p, 19, 14, '#ffe84a'); EY(p, 28, 14, '#ffe84a');
    p.P([[23, 17], [27, 20], [23, 21]], 'green');
    p.DR(19, 22, 10, 1, OUT); p.D(20, 23, '#ffffff'); p.D(27, 23, '#ffffff');
    return p.done();
  };
  DEF.mushroom = () => {
    const p = new Pad(48, 48);
    p.L(19, 38, 18, 45, 2.2, 'cloth'); p.L(29, 38, 30, 45, 2.2, 'cloth');
    p.E(24, 33, 8, 9, 'cloth');
    p.E(24, 21, 18, 11, 'red', { maxY: 27 });
    p.DR(6, 27, 36, 1, '#5c1630');
    [[14, 16, 3], [26, 14, 2.5], [34, 20, 2.2], [20, 23, 1.6], [9, 22, 1.5]].forEach((s) => p.E(s[0], s[1], s[2], s[2] * 0.8, 'bone'));
    EY(p, 19, 30); EY(p, 27, 30);
    p.DR(18, 29, 4, 1, OUT); p.DR(26, 29, 4, 1, OUT);
    p.DR(22, 35, 4, 1, OUT);
    return p.done();
  };
  DEF.mimic = () => {
    const p = new Pad(56, 48);
    p.R(8, 28, 40, 17, 'wood');
    p.P([[8, 26], [48, 26], [44, 8], [12, 8]], 'wood');
    p.P([[11, 25], [45, 25], [42, 13], [14, 13]], '#3a0e18', { col: '#3a0e18', raw: 1 });
    p.E(28, 25, 9, 4, 'pink', { maxY: 30 });
    for (let x = 12; x < 45; x += 4) { p.P([[x, 25], [x + 3, 25], [x + 1.5, 21]], 'bone'); p.P([[x, 28], [x + 3, 28], [x + 1.5, 32]], 'bone'); }
    p.R(8, 27, 40, 2, 'gold'); p.R(26, 30, 5, 7, 'gold');
    p.R(8, 36, 40, 2, 'gold');
    EY(p, 20, 17, '#ffe84a'); EY(p, 34, 17, '#ffe84a');
    p.DR(19, 16, 4, 1, '#ff3a3a'); p.DR(33, 16, 4, 1, '#ff3a3a');
    return p.done();
  };
  DEF.goblinking = () => {
    const p = new Pad(72, 72);
    p.P([[18, 30], [54, 30], [60, 66], [12, 66]], 'red');
    p.L(28, 56, 26, 68, 4, 'green'); p.L(44, 56, 46, 68, 4, 'green');
    p.E(25, 69, 5, 2.5, 'brown'); p.E(47, 69, 5, 2.5, 'brown');
    p.E(36, 47, 17, 15, 'green');
    p.E(36, 52, 10, 8, 'green');
    p.R(20, 55, 32, 3, 'gold');
    p.L(21, 42, 13, 50, 3.4, 'green'); p.E(12, 51, 3.4, 3.4, 'green');
    p.L(51, 42, 58, 48, 3.4, 'green');
    p.R(55, 40, 12, 12, 'bone'); p.DR(58, 43, 2, 2, OUT); p.DR(63, 48, 2, 2, OUT); p.DR(61, 45, 2, 2, OUT);
    p.P([[22, 24], [6, 14], [21, 32]], 'green'); p.P([[50, 24], [66, 14], [51, 32]], 'green');
    p.E(36, 27, 14, 12, 'green');
    p.P([[24, 17], [24, 6], [29, 12], [36, 4], [43, 12], [48, 6], [48, 17]], 'gold');
    p.E(36, 12, 2, 2, 'red');
    EY(p, 29, 23, '#ffe84a'); EY(p, 41, 23, '#ffe84a');
    p.DR(27, 21, 5, 1, OUT); p.DR(40, 21, 5, 1, OUT);
    p.P([[35, 27], [40, 31], [35, 32]], 'green');
    p.DR(28, 34, 16, 2, OUT); p.D(30, 36, '#ffffff'); p.D(31, 36, '#ffffff'); p.D(41, 36, '#ffffff'); p.D(40, 36, '#ffffff'); p.D(35, 34, '#ffcc3a');
    return p.done();
  };
  DEF.skeleton = () => {
    const p = new Pad(48, 48);
    p.L(20, 33, 19, 44, 1.4, 'bone'); p.L(27, 33, 29, 44, 1.4, 'bone');
    p.E(18, 45, 3, 1.5, 'bone'); p.E(30, 45, 3, 1.5, 'bone');
    p.E(24, 33, 5, 2.5, 'bone');
    p.L(24, 21, 24, 32, 1.3, 'bone');
    for (let y = 22; y < 31; y += 3) p.L(18, y + 1, 30, y + 1, 1.0, 'bone');
    p.L(18, 22, 13, 32, 1.3, 'bone'); p.L(30, 22, 35, 28, 1.3, 'bone');
    p.L(36, 28, 44, 12, 1.5, 'steel', { r1: 1 }); p.L(33, 26, 39, 30, 1, 'brown');
    p.E(24, 13, 8, 8, 'bone'); p.R(19, 17, 10, 4, 'bone');
    p.E(20.5, 13, 2.5, 2.8, OUT, { col: OUT, raw: 1 }); p.E(28.5, 13, 2.5, 2.8, OUT, { col: OUT, raw: 1 });
    p.D(20, 13, '#ff5a5a'); p.D(28, 13, '#ff5a5a');
    p.D(24, 16, OUT); p.DR(20, 19, 9, 1, OUT); p.D(22, 20, OUT); p.D(26, 20, OUT);
    return p.done();
  };
  DEF.ghost = () => {
    const p = new Pad(48, 48);
    p.E(24, 20, 13, 13, 'ghost');
    p.P([[11, 20], [37, 20], [38, 38], [33, 34], [29, 40], [24, 35], [19, 41], [15, 35], [10, 39]], 'ghost');
    p.L(12, 24, 5, 28, 2.4, 'ghost'); p.L(36, 24, 42, 20, 2.4, 'ghost');
    p.E(19, 19, 3, 4, OUT, { col: OUT, raw: 1 }); p.E(29, 19, 3, 4, OUT, { col: OUT, raw: 1 });
    p.E(24, 28, 3, 3.5, OUT, { col: OUT, raw: 1 });
    p.D(18, 18, '#9ac8e8'); p.D(28, 18, '#9ac8e8');
    return p.done();
  };
  DEF.spider = () => {
    const p = new Pad(56, 48);
    p.sym((q) => {
      q.L(22, 30, 12, 22, 1.4, 'dark'); q.L(12, 22, 4, 40, 1.2, 'dark');
      q.L(22, 32, 10, 30, 1.4, 'dark'); q.L(10, 30, 6, 44, 1.2, 'dark');
      q.L(23, 34, 14, 36, 1.4, 'dark'); q.L(14, 36, 12, 45, 1.2, 'dark');
      q.L(24, 35, 19, 39, 1.4, 'dark'); q.L(19, 39, 19, 45, 1.2, 'dark');
    });
    p.E(28, 25, 13, 11, 'dark');
    p.E(28, 34, 8, 6, 'dark');
    p.DR(26, 16, 4, 6, '#c82850'); p.DR(25, 18, 6, 2, '#c82850');
    [[23, 33], [26, 31], [30, 31], [33, 33]].forEach((e) => { p.DR(e[0], e[1], 2, 2, '#ff3a3a'); p.D(e[0], e[1], '#ffd0d0'); });
    p.D(25, 38, '#ffffff'); p.D(31, 38, '#ffffff'); p.D(25, 39, '#ffffff'); p.D(31, 39, '#ffffff');
    return p.done();
  };
  DEF.darkknight = () => {
    const p = new Pad(56, 56);
    p.P([[16, 22], [30, 20], [30, 46], [10, 52], [14, 36]], 'crimson');
    p.L(24, 40, 22, 52, 3.2, 'dark'); p.L(32, 40, 34, 52, 3.2, 'dark');
    p.E(21, 53, 4.4, 2.4, 'dark'); p.E(35, 53, 4.4, 2.4, 'dark');
    p.E(28, 33, 10, 11, 'dark');
    p.E(28, 30, 6, 5, 'steel');
    p.E(19, 24, 5, 4, 'dark'); p.E(37, 24, 5, 4, 'dark');
    p.L(37, 27, 41, 35, 3, 'dark'); p.E(42, 36, 3, 3, 'dark');
    p.L(43, 36, 52, 6, 2.4, 'steel', { r1: 1.4 }); p.L(38, 33, 48, 38, 1.5, 'gold');
    p.E(28, 15, 8, 8.5, 'dark');
    p.R(21, 13, 14, 3, OUT, { col: OUT, raw: 1 });
    p.DR(23, 14, 3, 1, '#c86aff'); p.DR(30, 14, 3, 1, '#c86aff');
    p.P([[27, 7], [31, 0], [42, 4], [33, 9]], 'purple');
    return p.done();
  };
  DEF.lich = () => {
    const p = new Pad(72, 72);
    p.P([[22, 30], [50, 30], [60, 66], [52, 62], [46, 68], [36, 63], [26, 68], [20, 62], [12, 66]], 'purple');
    p.P([[30, 32], [42, 32], [44, 60], [28, 60]], 'navy');
    p.L(23, 36, 12, 44, 3.6, 'purple'); p.E(10, 45, 2.6, 2.6, 'bone');
    p.L(10, 66, 12, 14, 1.6, 'wood');
    p.E(12, 12, 5, 5, 'leaf'); p.D(10, 10, '#ffffff'); p.D(11, 10, '#ffffff');
    p.L(49, 36, 58, 44, 3.6, 'purple'); p.E(59, 45, 2.6, 2.6, 'bone');
    p.E(36, 20, 10, 10, 'bone'); p.R(30, 25, 12, 5, 'bone');
    p.P([[24, 14], [27, 3], [31, 10], [36, 1], [41, 10], [45, 3], [48, 14]], 'gold');
    p.E(36, 8, 1.8, 1.8, 'leaf');
    p.E(31.5, 20, 3, 3.2, OUT, { col: OUT, raw: 1 }); p.E(40.5, 20, 3, 3.2, OUT, { col: OUT, raw: 1 });
    p.DR(31, 20, 2, 2, '#6aff8a'); p.DR(40, 20, 2, 2, '#6aff8a');
    p.D(36, 24, OUT); p.DR(31, 28, 11, 1, OUT); p.D(33, 29, OUT); p.D(36, 29, OUT); p.D(39, 29, OUT);
    return p.done();
  };
  DEF.imp = () => {
    const p = new Pad(48, 48);
    p.sym((q) => q.P([[20, 24], [6, 14], [8, 24], [4, 28], [12, 28], [18, 32]], 'crimson'));
    p.L(20, 34, 19, 44, 2, 'red'); p.L(27, 34, 29, 44, 2, 'red');
    p.E(24, 30, 7, 7, 'red');
    p.L(29, 33, 40, 42, 1, 'red'); p.P([[39, 44], [43, 40], [44, 45]], 'red');
    p.L(31, 28, 36, 26, 1.8, 'red');
    p.L(37, 40, 39, 8, 1, 'steel'); p.L(35, 10, 35, 5, 0.8, 'steel'); p.L(39, 10, 39, 4, 0.8, 'steel'); p.L(43, 10, 43, 5, 0.8, 'steel'); p.L(35, 10, 43, 10, 0.8, 'steel');
    p.E(24, 18, 8, 7.5, 'red');
    p.P([[17, 14], [14, 4], [21, 12]], 'bone'); p.P([[31, 14], [34, 4], [27, 12]], 'bone');
    EY(p, 20, 16, '#ffe84a'); EY(p, 27, 16, '#ffe84a');
    p.DR(20, 21, 8, 1, OUT); p.D(21, 22, '#ffffff'); p.D(26, 22, '#ffffff'); p.D(24, 20, OUT);
    return p.done();
  };
  DEF.golem = () => {
    const p = new Pad(56, 56);
    p.R(17, 40, 9, 14, 'stone'); p.R(31, 40, 9, 14, 'stone');
    p.R(12, 20, 32, 22, 'stone');
    p.R(4, 22, 9, 22, 'stone'); p.R(43, 22, 9, 22, 'stone');
    p.R(3, 42, 11, 8, 'stone'); p.R(42, 42, 11, 8, 'stone');
    p.R(18, 6, 20, 15, 'stone');
    p.DR(22, 12, 4, 3, '#6ae8e8'); p.DR(31, 12, 4, 3, '#6ae8e8'); p.D(22, 12, '#ffffff'); p.D(31, 12, '#ffffff');
    p.DR(24, 17, 8, 1, OUT);
    p.E(28, 31, 4, 4, 'cyan');
    [[16, 26, 6], [36, 36, 5], [22, 38, 4], [8, 30, 3]].forEach((c) => p.DR(c[0], c[1], c[2], 1, '#3e3a3a'));
    p.E(14, 12, 3, 2, 'leaf'); p.E(42, 21, 3, 2, 'leaf');
    return p.done();
  };
  DEF.gargoyle = () => {
    const p = new Pad(56, 48);
    p.sym((q) => q.P([[22, 22], [4, 6], [6, 18], [2, 22], [9, 24], [7, 30], [18, 30]], 'stone'));
    p.L(23, 34, 20, 44, 2.6, 'stone'); p.L(33, 34, 36, 44, 2.6, 'stone');
    p.E(19, 45, 4, 2, 'stone'); p.E(37, 45, 4, 2, 'stone');
    p.E(28, 30, 9, 9, 'stone');
    p.E(28, 17, 8, 7, 'stone');
    p.P([[21, 13], [18, 3], [24, 10]], 'stone'); p.P([[35, 13], [38, 3], [32, 10]], 'stone');
    EY(p, 23, 15, '#ffa03a'); EY(p, 31, 15, '#ffa03a');
    p.DR(23, 21, 10, 1, OUT); p.D(24, 22, '#ffffff'); p.D(31, 22, '#ffffff');
    return p.done();
  };
  DEF.dragon = () => {
    const p = new Pad(72, 64);
    p.P([[30, 26], [8, 4], [12, 18], [2, 20], [12, 28], [6, 36], [26, 38]], 'crimson');
    p.L(40, 48, 62, 56, 3.4, 'red', { r1: 1.4 }); p.P([[60, 52], [70, 50], [64, 60]], 'red');
    p.L(30, 48, 28, 60, 4, 'red'); p.L(44, 48, 46, 60, 4, 'red');
    p.E(27, 61, 5, 2.4, 'red'); p.E(47, 61, 5, 2.4, 'red');
    p.E(37, 42, 14, 12, 'red');
    p.E(40, 45, 8, 8, 'orange');
    p.L(32, 32, 26, 18, 5, 'red', { r1: 4 });
    p.E(24, 14, 10, 8, 'red');
    p.P([[10, 16], [17, 10], [17, 20]], 'red');
    p.P([[22, 8], [26, 0], [28, 8]], 'bone'); p.P([[28, 9], [34, 3], [33, 11]], 'bone');
    EY(p, 21, 11, '#ffe84a');
    p.DR(10, 17, 7, 1, OUT); p.D(12, 18, '#ffffff'); p.D(15, 18, '#ffffff');
    p.D(11, 14, OUT);
    return p.done();
  };
  DEF.demonlord = () => {
    const p = new Pad(80, 80);
    p.P([[22, 28], [58, 28], [74, 76], [6, 76]], 'crimson');
    p.P([[26, 30], [54, 30], [60, 72], [20, 72]], 'dark');
    p.E(40, 44, 14, 14, 'dark');
    p.E(40, 42, 8, 7, 'gold');
    p.E(40, 42, 4, 4, 'red');
    p.E(23, 33, 7, 5, 'gold'); p.E(57, 33, 7, 5, 'gold');
    p.L(22, 36, 12, 52, 4, 'dark'); p.E(11, 54, 4, 4, 'purple');
    p.L(58, 36, 66, 50, 4, 'dark'); p.E(67, 52, 4, 4, 'purple');
    p.R(62, 56, 11, 11, 'bone'); p.DR(64, 58, 2, 2, '#c82850'); p.DR(69, 63, 2, 2, '#c82850'); p.DR(64, 63, 2, 2, '#c82850'); p.DR(69, 58, 2, 2, '#c82850');
    p.E(40, 20, 11, 11, 'purple');
    p.P([[30, 14], [16, 2], [22, 0], [34, 10]], 'bone'); p.P([[50, 14], [64, 2], [58, 0], [46, 10]], 'bone');
    p.R(30, 17, 20, 4, OUT, { col: OUT, raw: 1 });
    p.DR(33, 18, 5, 2, '#ffcc3a'); p.DR(43, 18, 5, 2, '#ffcc3a'); p.D(34, 18, '#ffffff'); p.D(44, 18, '#ffffff');
    p.DR(34, 25, 12, 1, OUT); p.P([[35, 26], [37, 26], [36, 29]], 'bone'); p.P([[43, 26], [45, 26], [44, 29]], 'bone');
    return p.done();
  };

  // ───────── 작은 그림(16칸): 유물·지도·카드 ─────────
  DEF.i_rabbit = () => { const p = new Pad(16, 16); p.E(8, 11, 4, 4, 'bone'); p.L(6, 7, 5, 1, 1.4, 'bone'); p.L(10, 7, 11, 1, 1.4, 'bone'); p.L(8, 14, 8, 16, 0.7, 'gold'); return p.done(); };
  DEF.i_horse = () => { const p = new Pad(16, 16); p.L(4, 14, 4, 6, 2, 'steel'); p.L(12, 14, 12, 6, 2, 'steel'); p.E(8, 6, 6, 5, 'steel', { maxY: 6 }); p.E(8, 7, 2.5, 2.5, '#140e1c', { col: '#140e1c', raw: 1 }); p.D(4, 12, '#454a6a'); p.D(12, 12, '#454a6a'); return p.done(); };
  DEF.i_tooth = () => { const p = new Pad(16, 16); p.P([[3, 4], [13, 4], [12, 10], [10, 14], [8, 10], [6, 14], [4, 10]], 'gold'); p.D(5, 5, '#ffffff'); return p.done(); };
  DEF.i_tarot = () => { const p = new Pad(16, 16); p.R(3, 1, 10, 14, 'navy'); p.DR(4, 2, 8, 12, '#222c6a'); p.E(8, 8, 3, 3, 'gold'); p.D(8, 3, '#fff3a0'); p.D(8, 13, '#fff3a0'); return p.done(); };
  DEF.i_cat = () => { const p = new Pad(16, 16); p.E(8, 11, 5, 4, 'bone'); p.E(8, 7, 5, 4, 'bone'); p.P([[3, 6], [4, 1], [7, 4]], 'bone'); p.P([[13, 6], [12, 1], [9, 4]], 'bone'); p.L(13, 9, 15, 3, 1, 'bone'); p.D(6, 7, '#140e1c'); p.D(10, 7, '#140e1c'); p.E(8, 12, 2, 2, 'gold'); return p.done(); };
  DEF.i_bug = () => { const p = new Pad(16, 16); p.E(8, 9, 6, 5.5, 'red'); p.E(8, 4, 3, 2.5, 'dark'); p.DR(8, 5, 1, 9, '#140e1c'); [[5, 8], [11, 8], [6, 12], [10, 12]].forEach((d) => p.DR(d[0], d[1], 2, 2, '#140e1c')); return p.done(); };
  DEF.i_silver = () => { const p = new Pad(16, 16); p.E(8, 8, 6.5, 6.5, 'steel'); p.E(8, 8, 4, 4, 'steel'); p.DR(7, 5, 2, 6, '#454a6a'); return p.done(); };
  DEF.i_bag = () => { const p = new Pad(16, 16); p.E(8, 10, 6, 5.5, 'brown'); p.R(6, 3, 4, 3, 'brown'); p.DR(5, 6, 6, 1, '#ffcc3a'); p.R(6, 9, 5, 5, 'bone'); p.D(7, 10, '#140e1c'); p.D(9, 12, '#140e1c'); return p.done(); };
  DEF.i_ring = () => { const p = new Pad(16, 16); p.E(8, 11, 5, 4, 'gold'); p.E(8, 11, 2.6, 2, '#000', { col: null }); for (let y = 9; y < 14; y++) for (let x = 5; x < 12; x++) { const dx = (x + 0.5 - 8) / 2.6, dy = (y + 0.5 - 11) / 2; if (dx * dx + dy * dy < 1) p.c[y * 16 + x] = null; } p.E(8, 5, 3.5, 3.5, 'bone'); p.D(7, 5, '#140e1c'); p.D(9, 5, '#140e1c'); return p.done(); };
  DEF.i_star = () => { const p = new Pad(16, 16); const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 3 : 7.5; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]); } p.P(pts, 'gold'); return p.done(); };
  DEF.i_dice = () => { const p = new Pad(16, 16); p.R(2, 2, 12, 12, 'bone'); p.DR(4, 4, 2, 2, '#c82850'); p.DR(10, 10, 2, 2, '#c82850'); p.DR(7, 7, 2, 2, '#c82850'); return p.done(); };
  DEF.i_feather = () => { const p = new Pad(16, 16); p.P([[3, 14], [6, 6], [12, 1], [13, 4], [9, 11]], 'fire'); p.L(3, 14, 11, 3, 0.5, 'orange'); return p.done(); };
  DEF.i_clover = () => { const p = new Pad(16, 16); p.E(5, 5, 3.4, 3.4, 'leaf'); p.E(11, 5, 3.4, 3.4, 'leaf'); p.E(5, 10, 3.4, 3.4, 'leaf'); p.E(11, 10, 3.4, 3.4, 'leaf'); p.L(8, 8, 11, 15, 0.8, 'leaf'); return p.done(); };
  DEF.i_eye = () => { const p = new Pad(16, 16); p.E(8, 8, 7, 4.5, 'bone'); p.E(8, 8, 3, 3, 'blue'); p.DR(7, 7, 2, 2, '#140e1c'); p.D(7, 7, '#ffffff'); return p.done(); };
  // 지도 칸
  DEF.n_fight = () => { const p = new Pad(16, 16); p.L(3, 13, 13, 3, 1.1, 'steel'); p.L(13, 13, 3, 3, 1.1, 'steel'); p.L(3, 10, 6, 13, 0.9, 'brown'); p.L(13, 10, 10, 13, 0.9, 'brown'); return p.done(); };
  DEF.n_elite = () => { const p = new Pad(16, 16); p.E(8, 7, 6, 6, 'bone'); p.R(5, 10, 6, 4, 'bone'); p.E(5.5, 7, 1.8, 2, '#140e1c', { col: '#140e1c', raw: 1 }); p.E(10.5, 7, 1.8, 2, '#140e1c', { col: '#140e1c', raw: 1 }); p.D(6, 7, '#ff3a3a'); p.D(10, 7, '#ff3a3a'); p.DR(6, 12, 1, 2, '#140e1c'); p.DR(9, 12, 1, 2, '#140e1c'); return p.done(); };
  DEF.n_chest = () => { const p = new Pad(16, 16); p.R(1, 7, 14, 8, 'wood'); p.P([[1, 7], [15, 7], [14, 2], [2, 2]], 'wood'); p.R(1, 6, 14, 2, 'gold'); p.R(7, 8, 2, 3, 'gold'); return p.done(); };
  DEF.n_gacha = () => { const p = new Pad(16, 16); p.E(8, 6, 6, 5.5, 'cyan'); p.E(6, 6, 1.6, 1.6, 'red'); p.E(10, 5, 1.6, 1.6, 'gold'); p.E(8, 8, 1.6, 1.6, 'pink'); p.R(3, 10, 10, 5, 'red'); p.R(7, 11, 2, 2, 'gold'); return p.done(); };
  DEF.n_rest = () => { const p = new Pad(16, 16); p.L(2, 14, 14, 11, 1.2, 'wood'); p.L(14, 14, 2, 11, 1.2, 'wood'); p.P([[4, 12], [8, 1], [12, 12]], 'fire'); p.P([[6, 12], [8, 6], [10, 12]], 'gold'); return p.done(); };
  DEF.n_event = () => { const p = new Pad(16, 16); p.E(8, 8, 7, 7, 'purple'); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; p.L(8, 8, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 0.4, i % 2 ? 'gold' : 'red'); } p.E(8, 8, 1.6, 1.6, 'bone'); return p.done(); };
  DEF.n_boss = () => { const p = new Pad(16, 16); p.P([[1, 13], [1, 4], [5, 8], [8, 2], [11, 8], [15, 4], [15, 13]], 'gold'); p.D(8, 10, '#e8443a'); p.D(4, 10, '#4a90e8'); p.D(12, 10, '#4a90e8'); return p.done(); };
  // 카드 그림(작게)
  DEF.c_sword = () => { const p = new Pad(16, 16); p.L(3, 13, 13, 2, 1.3, 'steel', { r1: 0.7 }); p.L(2, 10, 6, 14, 0.9, 'gold'); p.L(1, 15, 3, 13, 1, 'brown'); return p.done(); };
  DEF.c_big = () => { const p = new Pad(16, 16); p.L(4, 12, 14, 1, 2.1, 'steel', { r1: 1 }); p.L(2, 9, 7, 14, 1.1, 'gold'); p.L(1, 15, 3, 13, 1.2, 'brown'); return p.done(); };
  DEF.c_shield = () => { const p = new Pad(16, 16); p.P([[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], 'blue'); p.P([[5, 4], [11, 4], [11, 8], [8, 12], [5, 8]], 'steel'); return p.done(); };
  DEF.c_coin = () => { const p = new Pad(16, 16); p.E(8, 8, 6.5, 6.5, 'gold'); p.E(8, 8, 4, 4, 'gold'); p.DR(7, 5, 2, 6, '#7a4a12'); return p.done(); };
  DEF.c_potion = () => { const p = new Pad(16, 16); p.E(8, 10, 5, 5, 'pink'); p.R(6, 2, 4, 4, 'cloth'); p.R(6, 1, 4, 2, 'wood'); p.D(6, 8, '#ffffff'); return p.done(); };
  DEF.c_poison = () => { const p = new Pad(16, 16); p.P([[8, 1], [12, 8], [4, 8]], 'leaf'); p.E(8, 10, 4.5, 4.5, 'leaf'); p.DR(7, 9, 2, 2, '#140e1c'); return p.done(); };
  DEF.c_fire = () => { const p = new Pad(16, 16); p.P([[3, 14], [2, 8], [6, 9], [7, 1], [10, 7], [13, 5], [13, 14]], 'fire'); p.P([[6, 14], [6, 10], [8, 11], [9, 7], [11, 14]], 'gold'); return p.done(); };
  DEF.c_skull = DEF.n_elite; DEF.c_dice = DEF.i_dice; DEF.c_clover = DEF.i_clover; DEF.c_eye = DEF.i_eye; DEF.c_star = DEF.i_star; DEF.c_feather = DEF.i_feather; DEF.c_crown = DEF.n_boss;
  DEF.c_heart = () => { const p = new Pad(16, 16); p.E(5, 6, 3.6, 3.6, 'red'); p.E(11, 6, 3.6, 3.6, 'red'); p.P([[1.6, 7], [14.4, 7], [8, 14.5]], 'red'); p.D(4, 4, '#ffffff'); return p.done(); };
  DEF.c_wind = () => { const p = new Pad(16, 16); for (let i = 0; i < 3; i++) p.L(2, 4 + i * 4, 13 - i * 2, 4 + i * 4 - 1, 0.8, 'cyan'); p.E(13, 3, 2, 2, 'cyan'); return p.done(); };
  DEF.c_devil = () => { const p = new Pad(16, 16); p.E(8, 9, 6, 6, 'red'); p.P([[3, 6], [2, 0], [6, 4]], 'bone'); p.P([[13, 6], [14, 0], [10, 4]], 'bone'); p.DR(5, 8, 2, 2, '#ffe84a'); p.DR(9, 8, 2, 2, '#ffe84a'); p.DR(5, 12, 6, 1, '#140e1c'); return p.done(); };
  DEF.c_bolt = () => { const p = new Pad(16, 16); p.P([[9, 0], [3, 9], [7, 9], [5, 16], [13, 6], [9, 6], [11, 0]], 'gold'); return p.done(); };
  DEF.c_spin = () => { const p = new Pad(16, 16); p.E(8, 8, 7, 7, 'steel'); p.E(8, 8, 4.4, 4.4, '#000', { col: null }); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x + 0.5 - 8, dy = y + 0.5 - 8; if (dx * dx + dy * dy < 19) p.c[y * 16 + x] = null; } p.P([[13, 1], [16, 6], [11, 6]], 'steel'); return p.done(); };
  // 아이콘(HUD)
  DEF.u_heart = DEF.c_heart; DEF.u_shield = DEF.c_shield; DEF.u_coin = DEF.c_coin; DEF.u_clover = DEF.i_clover;
  DEF.u_gem = () => { const p = new Pad(16, 16); p.P([[8, 1], [15, 7], [8, 15], [1, 7]], 'orange'); p.P([[8, 3], [11, 7], [8, 11], [5, 7]], 'fire'); return p.done(); };
  DEF.u_poison = DEF.c_poison;
  DEF.u_weak = () => { const p = new Pad(16, 16); p.L(3, 13, 13, 3, 1.2, 'steel', { r1: 0.7 }); p.L(2, 3, 14, 14, 1.3, 'purple'); return p.done(); };
  DEF.u_vuln = () => { const p = new Pad(16, 16); p.P([[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], 'red'); p.L(5, 3, 10, 13, 0.7, 'dark'); return p.done(); };
  DEF.u_str = () => { const p = new Pad(16, 16); p.L(3, 12, 8, 5, 2.4, 'skin'); p.E(9, 5, 3.6, 3.6, 'skin'); p.L(8, 12, 13, 12, 2.4, 'skin'); return p.done(); };
  DEF.u_thorn = () => { const p = new Pad(16, 16); p.E(8, 8, 4, 4, 'green'); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; p.L(8, 8, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, 0.7, 'green', { r1: 0.2 }); } return p.done(); };


  DEF.gachabig = () => {
    const p = new Pad(44, 60);
    p.R(4, 34, 36, 22, 'red'); p.R(2, 54, 40, 5, 'dark');
    p.R(6, 30, 32, 5, 'gold');
    p.E(22, 18, 17, 16, 'cyan', { maxY: 31 });
    [[14, 22, 'red'], [22, 25, 'gold'], [30, 21, 'pink'], [18, 14, 'leaf'], [27, 12, 'purple'], [11, 15, 'gold'], [33, 27, 'blue'], [15, 28, 'pink'], [26, 29, 'red']].forEach((c) => p.E(c[0], c[1], 3.4, 3.4, c[2]));
    p.DR(10, 7, 4, 2, '#ffffff'); p.DR(9, 9, 2, 3, '#ffffff');
    p.E(14, 42, 5, 5, 'gold'); p.DR(13, 38, 2, 8, '#7a4a12');
    p.R(26, 39, 10, 9, 'dark'); p.DR(28, 44, 6, 3, '#140e1c');
    p.R(30, 48, 3, 2, 'steel');
    return p.done();
  };
  DEF.chestbig = () => {
    const p = new Pad(48, 38);
    p.R(3, 17, 42, 19, 'wood');
    p.P([[3, 18], [45, 18], [42, 4], [6, 4]], 'wood');
    p.R(3, 15, 42, 4, 'gold'); p.R(9, 4, 4, 32, 'gold'); p.R(35, 4, 4, 32, 'gold');
    p.R(20, 17, 8, 10, 'gold'); p.DR(23, 20, 2, 4, '#3a2a10');
    [[6, 25], [41, 25], [6, 8], [41, 8]].forEach((q) => p.D(q[0], q[1], '#fff3a0'));
    return p.done();
  };
  DEF.firebig = () => {
    const p = new Pad(48, 44);
    [[6, 40], [13, 42], [22, 43], [31, 42], [39, 41], [44, 38], [3, 37]].forEach((q) => p.E(q[0], q[1], 4, 3, 'stone'));
    p.L(6, 38, 42, 30, 3, 'wood'); p.L(42, 38, 6, 30, 3, 'wood');
    p.P([[10, 33], [14, 18], [18, 24], [22, 6], [27, 20], [31, 12], [36, 33]], 'fire');
    p.P([[15, 33], [19, 22], [23, 27], [26, 17], [31, 33]], 'gold');
    p.P([[19, 33], [23, 25], [27, 33]], '#fffbe0', { col: '#fffbe0' });
    return p.done();
  };

  const cache = {};
  // 제미나이로 뽑은 인물 그림(assets/chars.png + js/atlas.js)이 있으면 그것을 쓴다
  let atlasImg = null;
  if (window.ATLAS) {
    const im = new Image();
    im.onload = () => { atlasImg = im; for (const k in cache) delete cache[k]; };
    im.src = 'assets/chars.webp?v=4';
  }
  function fromAtlas(n) {
    const r = window.ATLAS[n], c = document.createElement('canvas');
    c.width = r[2]; c.height = r[3];
    c.getContext('2d').drawImage(atlasImg, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    // 원본에 가까운 크기로 보관하고 그릴 때 줄인다: dpu = 논리 도트 하나에 든 실제 픽셀 수
    c.dpu = r[4] || 1; c.lw = r[2] / c.dpu; c.lh = r[3] / c.dpu;
    return c;
  }
  const ALIAS = { i_dice: 'c_dice', u_heart: 'c_heart', u_coin: 'c_coin', u_shield: 'c_shield', u_clover: 'c_clover', u_poison: 'c_poison', i_feather: 'c_feather', i_eye: 'c_eye' };
  SP.get = (n) => {
    if (cache[n]) return cache[n];
    const an = window.ATLAS && (window.ATLAS[n] ? n : window.ATLAS[ALIAS[n]] ? ALIAS[n] : null);
    return (cache[n] = atlasImg && an ? fromAtlas(an) : DEF[n] ? DEF[n]() : DEF.c_dice());
  };
  SP.has = (n) => !!DEF[n];
  SP.white = (n) => cache['w_' + n] || (cache['w_' + n] = SP.tint(SP.get(n), '#ffffff'));
  SP.black = (n) => cache['b_' + n] || (cache['b_' + n] = SP.tint(SP.get(n), '#0a0610'));

  // ───────── 배경(320x180, 막마다) ─────────
  function bg(act) {
    const W = 320, H = 240, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    let seed = 7 + act * 13; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const sky = [['#2a3a7a', '#4a6ab8', '#8ab0e0', '#c8e0f0'], ['#120e26', '#221a40', '#3a2a5a', '#5a3a6a'], ['#1a0610', '#3a0e1e', '#6a1a24', '#a8342a']][act];
    // 하늘 띠 + 디더 경계
    const bands = [0, 40, 70, 95, 120];
    for (let i = 0; i < 4; i++) { g.fillStyle = sky[i]; g.fillRect(0, bands[i], W, bands[i + 1] - bands[i] + 1); }
    for (let i = 1; i < 4; i++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) if ((x + k) % 2 === 0) { g.fillStyle = sky[k < 2 ? i - 1 : i]; g.fillRect(x, bands[i] - 2 + k, 1, 1); }
    if (act === 0) {
      g.fillStyle = '#fff6d0'; g.fillRect(250, 22, 16, 16); g.fillRect(248, 24, 20, 12); g.fillRect(252, 20, 12, 20);
      // 구름
      for (let i = 0; i < 6; i++) { const cx = rnd() * W, cy = 20 + rnd() * 50; g.fillStyle = '#e8f0ff'; g.fillRect(cx, cy, 30, 5); g.fillRect(cx + 6, cy - 4, 16, 4); g.fillStyle = '#b8c8e8'; g.fillRect(cx, cy + 5, 30, 2); }
      hills(g, W, 100, '#3a6a7a', 18, rnd); hills(g, W, 112, '#2f5a5a', 14, rnd);
      trees(g, W, 128, ['#1f5034', '#2f7040', '#4a9a4a'], rnd, 18);
      ground(g, W, H, 140, ['#5a8a3a', '#467030', '#344f28', '#24361c'], rnd);
    } else if (act === 1) {
      g.fillStyle = '#e8e0ff'; g.fillRect(60, 20, 18, 18); g.fillRect(58, 22, 22, 14); g.fillStyle = sky[0]; g.fillRect(66, 18, 16, 18);
      for (let i = 0; i < 60; i++) { g.fillStyle = rnd() < 0.5 ? '#ffffff' : '#a8a0d0'; g.fillRect(rnd() * W, rnd() * 80, 1, 1); }
      hills(g, W, 104, '#2a2244', 16, rnd);
      // 묘비
      for (let i = 0; i < 9; i++) { const x = 10 + i * 36 + rnd() * 14, y = 124 + rnd() * 8; g.fillStyle = '#4a4660'; g.fillRect(x, y - 14, 10, 16); g.fillRect(x + 1, y - 16, 8, 2); g.fillStyle = '#6a6684'; g.fillRect(x, y - 14, 2, 15); g.fillStyle = '#2a2638'; g.fillRect(x + 4, y - 10, 2, 6); g.fillRect(x + 2, y - 8, 6, 2); }
      // 죽은 나무
      for (let i = 0; i < 3; i++) { const x = 40 + i * 110 + rnd() * 30; g.fillStyle = '#1a1626'; g.fillRect(x, 70, 4, 60); g.fillRect(x - 10, 84, 12, 2); g.fillRect(x + 3, 78, 14, 2); g.fillRect(x - 10, 80, 2, 6); g.fillRect(x + 15, 72, 2, 7); }
      ground(g, W, H, 138, ['#4a4466', '#3a3454', '#2a2640', '#1c1a2c'], rnd);
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(200,220,255,0.10)'; g.fillRect(rnd() * W, 118 + rnd() * 30, 20 + rnd() * 30, 2); }
    } else {
      // 마왕성 안: 기둥과 횃불
      g.fillStyle = '#2a0e16'; g.fillRect(0, 0, W, 140);
      for (let y = 0; y < 140; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) { g.fillStyle = '#34121e'; g.fillRect(x, y, 15, 7); g.fillStyle = '#40182a'; g.fillRect(x, y, 15, 1); }
      for (let i = 0; i < 5; i++) {
        const x = 10 + i * 72; g.fillStyle = '#4a1a2a'; g.fillRect(x, 0, 22, 140); g.fillStyle = '#6a2a3a'; g.fillRect(x, 0, 4, 140); g.fillStyle = '#2a0a14'; g.fillRect(x + 18, 0, 4, 140);
        g.fillStyle = '#ffd040'; g.fillRect(x + 36, 50, 6, 8); g.fillStyle = '#ff7a20'; g.fillRect(x + 37, 46, 4, 6); g.fillStyle = '#7e4a2a'; g.fillRect(x + 37, 58, 4, 10);
        const rg = g.createRadialGradient(x + 39, 52, 2, x + 39, 52, 30); rg.addColorStop(0, 'rgba(255,140,40,0.35)'); rg.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = rg; g.fillRect(x + 9, 22, 60, 60);
      }
      g.fillStyle = '#c82850'; g.fillRect(140, 0, 40, 110); g.fillStyle = '#801838'; g.fillRect(140, 104, 40, 6); g.fillStyle = '#ffcc3a'; g.fillRect(152, 30, 16, 16); g.fillStyle = '#801838'; g.fillRect(156, 34, 8, 8);
      ground(g, W, H, 138, ['#5a3040', '#46222f', '#341824', '#220e18'], rnd);
    }
    // 위아래 어둡게
    for (let y = 0; y < 14; y++) { g.fillStyle = `rgba(0,0,0,${(0.35 * (14 - y)) / 14})`; g.fillRect(0, y, W, 1); }
    return cv;
  }
  function hills(g, W, y0, col, amp, rnd) {
    g.fillStyle = col; const a = rnd() * 6, b = rnd() * 6;
    for (let x = 0; x < W; x++) { const h = Math.round(Math.sin(x * 0.02 + a) * amp * 0.6 + Math.sin(x * 0.051 + b) * amp * 0.4); g.fillRect(x, y0 - h, 1, 200); }
  }
  function trees(g, W, y0, cols, rnd, n) {
    for (let i = 0; i < n; i++) {
      const x = (i / n) * W + rnd() * 12, s = 10 + rnd() * 10;
      g.fillStyle = '#3a2a1a'; g.fillRect(x - 1, y0 - s * 0.4, 3, s * 0.6);
      for (let k = 0; k < 3; k++) { g.fillStyle = cols[k]; const w = s * (1 - k * 0.25), yy = y0 - s * 0.4 - k * s * 0.35; g.fillRect(x - w / 2, yy - s * 0.5, w, s * 0.5); g.fillRect(x - w / 2 + 2, yy - s * 0.5 - 2, w - 4, 2); }
    }
  }
  function ground(g, W, H, y0, cols, rnd) {
    g.fillStyle = cols[0]; g.fillRect(0, y0, W, 3);
    g.fillStyle = cols[1]; g.fillRect(0, y0 + 3, W, 12);
    g.fillStyle = cols[2]; g.fillRect(0, y0 + 15, W, 14);
    g.fillStyle = cols[3]; g.fillRect(0, y0 + 29, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = cols[(rnd() * 3) | 0]; g.fillRect(rnd() * W, y0 + 3 + rnd() * 40, 2 + rnd() * 4, 1); }
    for (let x = 0; x < W; x += 2) if (rnd() < 0.5) { g.fillStyle = cols[0]; g.fillRect(x, y0 - 1, 1, 1); }
  }
  const bgc = {};
  SP.bg = (act) => bgc[act] || (bgc[act] = bg(act));
})();
