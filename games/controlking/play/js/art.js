// 개구리 점프 — 그림. 전부 캔버스 코드로 그린다. 빛은 왼쪽 위에서 온다
(function () {
  'use strict';
  const L = window.LV;
  const TAU = Math.PI * 2;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // 높이별 하늘 색 (위 / 아래)
  const SKY = [
    [4700, '#6db9ef', '#d6efff'], [7000, '#62b0ec', '#dff3ff'], [9400, '#5fa4e0', '#ffe7b0'],
    [10700, '#4e5fae', '#ffb877'], [11600, '#2a2f6e', '#c9707e'], [12500, '#0f1638', '#3a2d66'],
    [13600, '#162a66', '#e8918a'], [14700, '#4a82d0', '#ffe0a6'],
    [15300, '#4a5a80', '#9aa4bc'], [16200, '#3f86e0', '#cfeaff'], [18200, '#2e8ae6', '#dff4ff'], [19800, '#2a5fc0', '#ffd6b0'],
    [21000, '#35307a', '#d77a9a'], [22200, '#0d1236', '#2a2a66'], [26000, '#04050e', '#12173a']
  ];
  function skyAt(y) {
    if (y <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
    }
    const e = SKY[SKY.length - 1]; return [e[1], e[2]];
  }
  const WELL_TOP = L.zoneTop[4];

  // 화면 좌표 도우미
  function view(s, ox, oy, camY, cw, ch) {
    return { s, ox, oy, camY, cw, ch, X: x => ox + x * s, Y: y => oy - (y - camY) * s,
      wy: sy => camY + (oy - sy) / s };
  }

  // ── 하늘 + 멀리 보이는 풍경 ──
  function sky(c, V, t) {
    const yMid = V.wy(V.ch * 0.5);
    const [top, bot] = skyAt(yMid);
    const g = c.createLinearGradient(0, 0, 0, V.ch);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fillRect(0, 0, V.cw, V.ch);
    // 별 (밤~새벽)
    const night = Math.max(clamp(1 - Math.abs(yMid - 12400) / 1500, 0, 1), clamp((yMid - 20800) / 1400, 0, 1));
    if (night > 0) {
      const r = rng(77);
      c.fillStyle = '#fff';
      for (let i = 0; i < (yMid > 20000 ? 160 : 90); i++) {
        const x = r() * V.cw, y = r() * V.ch, tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
        c.globalAlpha = night * (0.3 + 0.6 * tw) * r();
        c.fillRect(x, y, 1.6, 1.6);
      }
      c.globalAlpha = 1;
    }
  }

  // ── 우물 안: 뒷벽 돌과 기둥 벽 ──
  // 돌 벽돌 무늬: 16줄짜리 한 장을 미리 구워 두고 세로로 이어 붙인다(매 프레임 벽돌 수백 개를 그리지 않게)
  const TILES = {}; let tileN = 0;
  const BH = 34, BR = 16, PER = BH * BR;
  function brickTile(wpx, s, d, seed) {
    wpx = Math.ceil(wpx / 32) * 32 + 32;       // 흔들림으로 폭이 조금씩 바뀌어도 같은 장을 쓴다
    const key = seed + '|' + s.toFixed(3) + '|' + Math.round(wpx) + '|' + d;
    if (TILES[key]) return TILES[key];
    if (++tileN > 16) { for (const k in TILES) delete TILES[k]; tileN = 1; }
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(wpx * d)); cv.height = Math.ceil(PER * s * d);
    const c = cv.getContext('2d'); c.scale(d, d);
    for (let row = 0; row < BR; row++) {
      const r = rng(seed + row * 131);
      const hpx = BH * s, y = (BR - row) * hpx;
      let x = -(row % 2 ? 20 : 45) * s;
      while (x < wpx) {
        const bw = (44 + r() * 38) * s;
        const light = clamp(0.8 + r() * 0.35, 0, 1.15);
        const g = c.createLinearGradient(0, y - hpx, 0, y);
        g.addColorStop(0, 'rgb(' + Math.round(96 * light) + ',' + Math.round(104 * light) + ',' + Math.round(110 * light) + ')');
        g.addColorStop(1, 'rgb(' + Math.round(58 * light) + ',' + Math.round(62 * light) + ',' + Math.round(70 * light) + ')');
        c.fillStyle = '#0c1014'; c.fillRect(x, y - hpx, bw, hpx);
        c.fillStyle = g; rr(c, x + 1.5 * s, y - hpx + 1.5 * s, bw - 3 * s, hpx - 3 * s, 7 * s); c.fill();
        c.fillStyle = 'rgba(255,255,255,' + (0.08 * light) + ')'; c.fillRect(x + 5 * s, y - hpx + 3 * s, bw - 10 * s, 2.5 * s);
        if (r() < 0.35) { c.fillStyle = 'rgba(70,120,50,' + (0.5 * light) + ')'; c.beginPath(); c.ellipse(x + bw * r(), y - hpx + 3 * s, 10 * s, 4 * s, 0, 0, TAU); c.fill(); }
        if (r() < 0.25) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.2 * s; c.beginPath(); const cx = x + bw * 0.5; c.moveTo(cx, y - hpx + 4 * s); c.lineTo(cx + 6 * s, y - hpx * 0.5); c.lineTo(cx + 2 * s, y - 4 * s); c.stroke(); }
        x += bw;
      }
    }
    TILES[key] = cv;
    return cv;
  }
  function bricks(c, V, x0, x1, yLo, yHi, pf, dark, seed) {
    const s = V.s, sy0 = Math.max(0, V.Y(yHi)), sy1 = Math.min(V.ch, V.Y(yLo));
    if (sy1 <= sy0 || x1 <= x0) return;
    const d = c.getTransform().a || 1;
    const tile = brickTile(x1 - x0, s, d, seed);
    const off = V.camY * (1 - pf);
    c.save(); c.beginPath(); c.rect(x0, sy0, x1 - x0, sy1 - sy0); c.clip();
    const wTop = V.wy(sy0) - off, wBot = V.wy(sy1) - off;
    const hpx = PER * s;
    for (let n = Math.floor(wBot / PER) - 1; n <= Math.ceil(wTop / PER); n++) {
      const top = V.Y((n + 1) * PER + off);
      c.drawImage(tile, x0 - 16, top, tile.width / d, hpx);
    }
    c.fillStyle = 'rgba(0,0,0,' + clamp(1 - dark, 0, 1) + ')'; c.fillRect(x0, sy0, x1 - x0, sy1 - sy0);
    c.restore();
  }

  function well(c, V, t) {
    const topS = V.Y(WELL_TOP);
    if (topS >= V.ch) return;              // 우물 위만 보이는 중
    const bot = V.ch, top = Math.max(0, topS);
    // 뒷벽: 위에서 빛이 들어와 아래로 갈수록 어둡다
    const yMid = V.wy(V.ch * 0.5);
    const depth = clamp(yMid / WELL_TOP, 0, 1);
    c.fillStyle = '#10151c'; c.fillRect(0, top, V.cw, bot - top);
    bricks(c, V, V.X(0), V.X(L.W), -200, WELL_TOP, 0.88, 0.38 + 0.4 * depth, 11);
    // 빛기둥
    const g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, 'rgba(255,245,200,' + (0.10 + 0.25 * depth) + ')'); g.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = g; c.beginPath();
    c.moveTo(V.X(90), top); c.lineTo(V.X(L.W - 90), top); c.lineTo(V.X(L.W - 40), bot); c.lineTo(V.X(40), bot); c.fill();
    // 기둥 벽(양옆)
    const wl = V.X(0), wr = V.X(L.W);
    bricks(c, V, 0, wl, -200, WELL_TOP + 40, 1, 0.55 + 0.35 * depth, 29);
    bricks(c, V, wr, V.cw, -200, WELL_TOP + 40, 1, 0.55 + 0.35 * depth, 53);
    // 벽 안쪽 모서리 그늘
    let e = c.createLinearGradient(wl, 0, wl + 26 * V.s, 0);
    e.addColorStop(0, 'rgba(0,0,0,.55)'); e.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = e; c.fillRect(wl, top, 26 * V.s, bot - top);
    e = c.createLinearGradient(wr, 0, wr - 26 * V.s, 0);
    e.addColorStop(0, 'rgba(0,0,0,.55)'); e.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = e; c.fillRect(wr - 26 * V.s, top, 26 * V.s, bot - top);
    // 기둥 벽 테두리(돌 모서리 빛)
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(wl - 3 * V.s, top, 3 * V.s, bot - top);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(wr, top, 3 * V.s, bot - top);
    // 바닥 물
    const wy = V.Y(-6);
    if (wy < V.ch) {
      const wg = c.createLinearGradient(0, wy, 0, V.ch);
      wg.addColorStop(0, '#2c4a52'); wg.addColorStop(1, '#0c1a1e');
      c.fillStyle = wg; c.fillRect(0, wy, V.cw, V.ch - wy);
      c.strokeStyle = 'rgba(200,240,255,.25)'; c.lineWidth = 1.5 * V.s;
      for (let i = 0; i < 6; i++) { const x = V.X(40 + i * 80 + Math.sin(t * 0.8 + i) * 12); c.beginPath(); c.moveTo(x, wy + (8 + i % 3 * 7) * V.s); c.lineTo(x + 30 * V.s, wy + (8 + i % 3 * 7) * V.s); c.stroke(); }
    }
    // 우물 위 가장자리(입구): 바깥 빛이 벽을 적신다
    if (topS > 0) {
      const lg = c.createLinearGradient(0, topS, 0, topS + 220 * V.s);
      lg.addColorStop(0, 'rgba(255,240,190,.35)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = lg; c.fillRect(0, topS, V.cw, 220 * V.s);
    }
  }

  // ── 바깥 풍경 (깊이 pf: 0 이면 붙박이, 1 이면 발판과 같이 움직임) ──
  function PY(V, y, A, pf) { return V.oy - ((y - A) - (V.camY - A) * pf) * V.s; }
  function ridge(c, V, A, pf, y, amp, col, seed, rough) {
    const r = rng(seed), base = PY(V, A + y, A, pf);
    if (base - amp * V.s * 1.3 > V.ch) return;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, V.ch + 5);
    const n = 14, pts = [];
    for (let i = 0; i <= n; i++) pts.push(r());
    for (let x = 0; x <= V.cw + 8; x += 8) {
      const u = x / V.cw * n, i = Math.floor(u), f = u - i;
      const h = lerp(pts[i] || 0, pts[i + 1] || 0, f * f * (3 - 2 * f));
      const wx = x / V.s, j = rough ? Math.sin(wx * 0.021 + seed) * 0.07 + Math.sin(wx * 0.057 + seed * 2) * 0.03 : 0;
      c.lineTo(x, base - (h * 0.8 + 0.2 + j) * amp * V.s);
    }
    c.lineTo(V.cw + 8, V.ch + 5); c.closePath(); c.fill();
  }
  function hut(c, x, y, w, s, col, roof) {  // 초가집 실루엣
    c.fillStyle = col; c.fillRect(x - w * 0.42, y - w * 0.42, w * 0.84, w * 0.42);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - w * 0.62, y - w * 0.36); c.quadraticCurveTo(x, y - w * 0.95, x + w * 0.62, y - w * 0.36); c.closePath(); c.fill();
  }
  function cloudBlob(c, x, y, r, col, shade) {
    c.fillStyle = shade; c.beginPath();
    c.arc(x - r * 1.1, y + r * 0.15, r * 0.7, 0, TAU); c.arc(x, y + r * 0.1, r, 0, TAU); c.arc(x + r * 1.1, y + r * 0.2, r * 0.65, 0, TAU); c.fill();
    c.fillStyle = col; c.beginPath();
    c.arc(x - r * 1.1, y, r * 0.66, 0, TAU); c.arc(x, y - r * 0.08, r * 0.95, 0, TAU); c.arc(x + r * 1.1, y + r * 0.05, r * 0.6, 0, TAU); c.fill();
  }

  function scenery(c, V, t) {
    const s = V.s, lo = V.wy(V.ch), hi = V.wy(0);
    if (hi < WELL_TOP - 300) return;
    const A0 = WELL_TOP;
    // 먼 산 세 겹 — 올라갈수록 발밑으로 가라앉는다
    ridge(c, V, A0, 0.18, 150, 260, 'rgba(120,150,190,.55)', 5, true);
    ridge(c, V, A0, 0.26, 40, 200, 'rgba(92,128,150,.75)', 9, true);
    ridge(c, V, A0, 0.38, -60, 150, '#5f8a6a', 13, true);
    // 마을 초가집
    const vy = PY(V, A0 - 30, A0, 0.5);
    if (vy - 80 * s < V.ch) {
      c.fillStyle = '#6e9460'; c.fillRect(0, vy, V.cw, V.ch - vy + 2);
      const r = rng(21);
      for (let i = 0; i < 14; i++) { const x = r() * V.cw, w = (50 + r() * 30) * s; hut(c, x, vy + (r() * 20) * s, w, s, '#d9c9a8', mix('#b89a5a', '#8c7240', r())); }
    }
    // 장독대 뒤 돌담 (구간 5)
    const z5 = L.zoneTop[4];
    const dy = PY(V, z5 + 70, z5, 0.8);
    if (dy > -40 && dy - 60 * s < V.ch) {
      const r = rng(31);
      for (let x = -10; x < V.cw; x += 30 * s) { const h = (22 + r() * 10) * s; c.fillStyle = mix('#8d8577', '#b0a795', r()); rr(c, x, dy - h, 30 * s - 2, h, 8 * s); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, dy, V.cw, 6 * s);
    }
    // 구간 풍경은 카메라가 그 근처일 때만 (먼 풍경이 딴 구간에 끼어들지 않게)
    const mid = V.wy(V.ch * 0.5), zt = L.zoneTop;
    const vis = (a, b, fd) => mid < a ? clamp(1 - (a - mid) / fd, 0, 1) : mid > b ? clamp(1 - (mid - b) / fd, 0, 1) : 1;
    const layer = (k, fn) => { if (k <= 0) return; c.globalAlpha = k; fn(c, V, t); c.globalAlpha = 1; };
    layer(vis(zt[6] - 200, zt[7] + 100, 500), persimmonCanopy);
    layer(vis(zt[7] - 150, zt[8], 500), bambooBack);
    layer(vis(zt[8], zt[9] + 200, 500), hills);
    layer(vis(zt[9] - 100, zt[10], 500), waterfallBack);
    layer(vis(zt[10] - 100, zt[12] - 200, 500), cloudSea);
    layer(vis(zt[11] - 100, zt[12] + 200, 500), peaks);
    layer(vis(zt[12] - 100, zt[13] + 100, 500), stormBack);
    layer(vis(zt[13] - 100, zt[14] + 100, 500), rainbowBack);
    layer(vis(zt[14] - 100, zt[15] + 100, 500), kiteBack);
    layer(vis(zt[15] - 100, zt[17] + 100, 500), isleBack);
    layer(vis(zt[18] - 100, zt[19] + 100, 500), auroraBack);
    layer(vis(zt[20] - 300, L.TOP, 500), milkyWay);
    layer(vis(zt[23] - 400, L.TOP, 500), bigMoon);
  }

  function persimmonCanopy(c, V, t) {           // 구간 7 감나무: 줄기·굵은 가지·잎 무더기
    const z = L.zoneTop[6], s = V.s, A = c.globalAlpha, pf = 0.9;
    const top = PY(V, z + 1350, z, pf), bot = PY(V, z - 200, z, pf);
    if (bot < 0 || top > V.ch) return;
    const r = rng(41);
    // 뒤쪽 먼 잎(흐리게)
    // 잎 하나마다 자기 난수를 쓴다(화면 밖 잎을 건너뛰어도 나머지 자리가 밀리지 않게)
    for (let i = 0; i < 22; i++) {
      const q = rng(4100 + i * 31);
      const wy = z - 100 + q() * 1400, x = q() * V.cw, y = PY(V, wy, z, 0.7), rad = (60 + q() * 60) * s;
      if (y + rad < 0 || y - rad > V.ch) continue;
      c.globalAlpha = A * 0.35; c.fillStyle = mix('#6f9a5a', '#4e7a44', q());
      leafClump(c, x, y, rad, s, rng(i * 7 + 3), '#7fa866', '#46703c');
    }
    c.globalAlpha = A;
    // 줄기(왼쪽)와 굵은 가지
    const tx = V.X(-40);
    const tg = c.createLinearGradient(tx - 70 * s, 0, tx + 70 * s, 0);
    tg.addColorStop(0, '#2e2018'); tg.addColorStop(0.45, '#6a4a34'); tg.addColorStop(1, '#2e2018');
    c.fillStyle = tg; c.fillRect(tx - 70 * s, Math.max(0, top), 140 * s, V.ch - Math.max(0, top));
    c.strokeStyle = 'rgba(20,12,6,.35)'; c.lineWidth = 2 * s;
    for (let i = 0; i < 18; i++) { const x = tx - 60 * s + r() * 120 * s, y0 = PY(V, z - 100 + r() * 1400, z, pf); c.beginPath(); c.moveTo(x, y0); c.lineTo(x + (r() - 0.5) * 10 * s, y0 + 60 * s); c.stroke(); }
    for (let i = 0; i < 5; i++) {
      const q = rng(4200 + i * 17);
      const y = PY(V, z + 120 + i * 260, z, pf), len = V.cw * (0.5 + q() * 0.4), bend = q();
      if (y < -40 || y > V.ch + 40) continue;
      c.strokeStyle = '#4a3424'; c.lineCap = 'round'; c.lineWidth = (18 - i) * s;
      c.beginPath(); c.moveTo(tx, y + 40 * s); c.quadraticCurveTo(tx + len * 0.5, y - 30 * s, tx + len, y - 60 * s * bend); c.stroke();
      c.lineCap = 'butt';
    }
    // 앞쪽 잎 무더기와 감
    for (let i = 0; i < 26; i++) {
      const q = rng(4300 + i * 29);
      const wy = z - 100 + q() * 1400, x = q() * V.cw, y = PY(V, wy, z, pf), rad = (34 + q() * 36) * s, hasP = q() < 0.7, pdx = q() - 0.5;
      if (y + rad < 0 || y - rad > V.ch) continue;
      c.globalAlpha = A * 0.8;
      leafClump(c, x, y, rad, s, rng(i * 13 + 5), '#8cbc58', '#3d6a2a');
      c.globalAlpha = A;
      if (hasP) persimmon(c, x + rad * pdx, y + rad * 0.3, 7 * s);
    }
  }
  function leafClump(c, x, y, rad, s, r, light, dark) {
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * rad, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.8;
      const k = clamp(0.5 - (ly - y) / rad * 0.5 + (r() - 0.5) * 0.3, 0, 1);
      c.fillStyle = mix(dark, light, k);
      c.beginPath(); c.ellipse(lx, ly, rad * 0.32, rad * 0.16, a, 0, TAU); c.fill();
    }
  }
  function persimmon(c, x, y, r) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffc070'); g.addColorStop(1, '#d9541e');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.9, 0, 0, TAU); c.fill();
    c.fillStyle = '#4a6a2a'; c.beginPath(); c.ellipse(x, y - r * 0.8, r * 0.7, r * 0.28, 0, 0, TAU); c.fill();
  }

  function bambooBack(c, V, t) {                // 구간 8 대숲
    const z = L.zoneTop[7], s = V.s;
    const layers = [[0.6, 'rgba(90,140,80,.45)', 18, 51], [0.8, 'rgba(70,120,60,.7)', 11, 57]];
    for (const [pf, col, n, seed] of layers) {
      const top = PY(V, z + 1350, z, pf), bot = PY(V, z - 200, z, pf);
      if (bot < 0 || top > V.ch) continue;
      const r = rng(seed);
      for (let i = 0; i < n; i++) {
        const x = r() * V.cw + Math.sin(t * 0.8 + i) * 3 * s, w = (8 + r() * 10) * s * pf;
        // 줄기 위쪽은 하늘에서 칼로 자른 듯 끝나지 않게 서서히 흐려진다
        const fg = c.createLinearGradient(0, top, 0, top + 420 * s);
        fg.addColorStop(0, col.replace(/[\d.]+\)$/, '0)')); fg.addColorStop(1, col);
        c.fillStyle = fg; c.fillRect(x, Math.max(top, 0), w, Math.min(bot, V.ch) - Math.max(top, 0));
        c.fillStyle = 'rgba(30,60,30,.35)';
        for (let y = top + r() * 60 * s; y < bot; y += (70 + r() * 30) * s) if (y > 0 && y < V.ch) c.fillRect(x - 1, y, w + 2, 2.5 * s);
      }
    }
  }

  function hills(c, V, t) {                     // 구간 9 바람 언덕
    const z = L.zoneTop[8];
    if (PY(V, z - 200, z, 0.55) < 0 || PY(V, z + 1400, z, 0.55) > V.ch + 400) return;
    ridge(c, V, z, 0.45, 200, 220, 'rgba(140,170,110,.7)', 61, false);
    ridge(c, V, z, 0.6, 60, 160, '#7ea35a', 67, false);
    // 풀결
    const base = PY(V, z + 60, z, 0.6), s = V.s;
    if (base < V.ch + 50) {
      c.strokeStyle = 'rgba(210,230,160,.5)'; c.lineWidth = 1.5 * s;
      const r = rng(69), sway = Math.sin(t * 1.7) * 6 * s;
      for (let i = 0; i < 60; i++) { const x = r() * V.cw, y = base + r() * 120 * s - 60 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway * 0.5, y - 8 * s, x + sway, y - 14 * s); c.stroke(); }
    }
  }

  function waterfallBack(c, V, t) {             // 구간 10 폭포 절벽
    const z = L.zoneTop[9], s = V.s;
    const top = PY(V, z + 1400, z, 0.85), bot = PY(V, z - 200, z, 0.85);
    if (bot < 0 || top > V.ch) return;
    const cg = c.createLinearGradient(0, 0, V.cw, 0);
    cg.addColorStop(0, '#4a3a36'); cg.addColorStop(0.5, '#6a524a'); cg.addColorStop(1, '#3c302c');
    c.fillStyle = cg; c.fillRect(0, Math.max(0, top), V.cw, Math.min(V.ch, bot) - Math.max(0, top));
    // 바위 결
    const r = rng(71);
    c.fillStyle = 'rgba(0,0,0,.18)';
    for (let i = 0; i < 40; i++) { const x = r() * V.cw, y = PY(V, z - 100 + r() * 1400, z, 0.85); c.beginPath(); c.ellipse(x, y, (30 + r() * 60) * s, (8 + r() * 10) * s, 0, 0, TAU); c.fill(); }
    // 물줄기
    const fx = V.X(L.W * 0.5), fw = 150 * s;
    const wg = c.createLinearGradient(fx - fw / 2, 0, fx + fw / 2, 0);
    wg.addColorStop(0, 'rgba(200,230,255,.25)'); wg.addColorStop(0.5, 'rgba(235,248,255,.6)'); wg.addColorStop(1, 'rgba(200,230,255,.25)');
    c.fillStyle = wg; c.fillRect(fx - fw / 2, Math.max(0, top), fw, Math.min(V.ch, bot) - Math.max(0, top));
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2 * s;
    for (let i = 0; i < 16; i++) {
      const x = fx - fw / 2 + (i + 0.5) * fw / 16, ph = ((t * 1.6 + i * 0.37) % 1);
      const y0 = Math.max(0, top) + ph * 200 * s;
      for (let y = y0 - 200 * s; y < Math.min(V.ch, bot); y += 200 * s) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 70 * s); c.stroke(); }
    }
  }

  function cloudSea(c, V, t) {                  // 구간 11 구름바다와 달
    const z = L.zoneTop[10], s = V.s;
    const moonY = PY(V, z + 900, z, 0.2);
    if (moonY > -80 && moonY < V.ch + 80) {
      const mx = V.cw * 0.78;
      const g = c.createRadialGradient(mx, moonY, 10 * s, mx, moonY, 120 * s);
      g.addColorStop(0, 'rgba(255,250,220,.5)'); g.addColorStop(1, 'rgba(255,250,220,0)');
      c.fillStyle = g; c.beginPath(); c.arc(mx, moonY, 120 * s, 0, TAU); c.fill();
      c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(mx, moonY, 34 * s, 0, TAU); c.fill();
      c.fillStyle = 'rgba(200,190,160,.35)'; c.beginPath(); c.arc(mx - 10 * s, moonY - 6 * s, 7 * s, 0, TAU); c.arc(mx + 9 * s, moonY + 10 * s, 5 * s, 0, TAU); c.fill();
    }
    for (let layer = 0; layer < 3; layer++) {
      const pf = 0.3 + layer * 0.18, y = PY(V, z - 120 + layer * 90, z, pf);
      if (y - 80 * s > V.ch || y < -200) continue;
      const r = rng(81 + layer), col = mix('#9aa3d0', '#e9e4f5', layer / 2), sh = mix('#6d6fa6', '#b7b0d6', layer / 2);
      c.fillStyle = sh; c.fillRect(0, y + 10 * s, V.cw, V.ch - y);
      for (let i = 0; i < 9; i++) cloudBlob(c, ((i / 8) * V.cw + Math.sin(t * 0.1 + i) * 10 * s + r() * 40 * s), y + r() * 20 * s, (40 + r() * 30) * s, col, sh);
    }
  }

  function peaks(c, V, t) {                     // 구간 12 눈 덮인 봉우리와 해
    const z = L.zoneTop[11], s = V.s;
    const sunY = PY(V, z + 1700, z, 0.35) - SUN.lift * 260 * s;
    if (sunY < V.ch + 200 && sunY > -300) {
      const sx = V.cw * 0.3, k = 0.6 + SUN.lift * 0.4;
      const g = c.createRadialGradient(sx, sunY, 20 * s, sx, sunY, 330 * s);
      g.addColorStop(0, 'rgba(255,214,120,' + (0.85 * k) + ')'); g.addColorStop(0.4, 'rgba(255,170,100,' + (0.35 * k) + ')'); g.addColorStop(1, 'rgba(255,150,110,0)');
      c.fillStyle = g; c.beginPath(); c.arc(sx, sunY, 330 * s, 0, TAU); c.fill();
      // 햇살
      c.save(); c.translate(sx, sunY); c.rotate(t * 0.05);
      c.fillStyle = 'rgba(255,230,160,' + (0.12 * k) + ')';
      for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, -50 * s); c.lineTo(-14 * s, -420 * s); c.lineTo(14 * s, -420 * s); c.fill(); }
      c.restore();
      const cg = c.createRadialGradient(sx - 10 * s, sunY - 10 * s, 4 * s, sx, sunY, 46 * s);
      cg.addColorStop(0, '#fffbe6'); cg.addColorStop(0.6, '#ffe07a'); cg.addColorStop(1, '#ffb347');
      c.fillStyle = cg; c.beginPath(); c.arc(sx, sunY, 46 * s, 0, TAU); c.fill();
    }
    const y = PY(V, z + 300, z, 0.45);
    if (y - 400 * s < V.ch && y > -100) {
      const r = rng(91);
      for (let i = 0; i < 6; i++) {
        const px = (i / 5) * V.cw + (r() - 0.5) * 60 * s, ph = (150 + r() * 200) * s, pw = (120 + r() * 80) * s;
        c.fillStyle = mix('#5a6a9a', '#7a86b4', r());
        c.beginPath(); c.moveTo(px - pw, y); c.lineTo(px, y - ph); c.lineTo(px + pw, y); c.fill();
        c.fillStyle = 'rgba(245,248,255,.9)';
        c.beginPath(); c.moveTo(px - pw * 0.28, y - ph * 0.72); c.lineTo(px, y - ph); c.lineTo(px + pw * 0.3, y - ph * 0.7); c.lineTo(px + pw * 0.1, y - ph * 0.76); c.lineTo(px - pw * 0.05, y - ph * 0.68); c.fill();
      }
      c.fillStyle = 'rgba(210,200,230,.6)'; c.fillRect(0, y, V.cw, V.ch - y);
    }
  }

  const SUN = { lift: 0 };

  // 바깥 구간에서 기둥 밖(가로 화면의 양옆)을 살짝 어둡게
  function sideShade(c, V) {
    const wl = V.X(0), wr = V.X(L.W);
    if (wl <= 1 && wr >= V.cw - 1) return;
    const top = Math.max(0, V.Y(WELL_TOP + 40));
    if (top >= V.ch) return;
    c.fillStyle = 'rgba(10,20,40,.38)';
    c.fillRect(0, 0, wl, top); c.fillRect(wr, 0, V.cw - wr, top);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(wl - 2, 0, 2, top); c.fillRect(wr, 0, 2, top);
  }

  // ── 발판 ──
  function grad(c, y0, y1, a, b) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function stoneSlab(c, x, y, w, h, s, seed, top, bot, edge) {
    const r = rng(seed);
    // 그림자
    c.fillStyle = 'rgba(0,0,0,.32)'; rr(c, x + 4 * s, y + 6 * s, w, h, 9 * s); c.fill();
    // 돌 여러 개를 이어 붙인 판
    const n = Math.max(1, Math.round(w / (52 * s)));
    let px = x;
    for (let i = 0; i < n; i++) {
      const bw = i === n - 1 ? x + w - px : (w / n) * (0.85 + r() * 0.3);
      const inset = 0.8 * s, rad = Math.min(11 * s, h * 0.48, bw * 0.4);
      const tone = 0.88 + r() * 0.24;
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, shade(top, tone * 1.08)); g.addColorStop(0.55, shade(top, tone * 0.9)); g.addColorStop(1, shade(bot, tone));
      c.fillStyle = g;
      c.beginPath();
      const yb = y + h + (r() - 0.3) * 3 * s;
      c.moveTo(px + inset + rad, y);
      c.lineTo(px + bw - inset - rad, y);
      c.quadraticCurveTo(px + bw - inset, y, px + bw - inset, y + rad);
      c.lineTo(px + bw - inset - r() * 2 * s, yb - rad * 0.7);
      c.quadraticCurveTo(px + bw - inset - 2 * s, yb, px + bw - rad, yb);
      c.lineTo(px + inset + rad, yb);
      c.quadraticCurveTo(px + inset + 1 * s, yb, px + inset + r() * 2 * s, yb - rad * 0.7);
      c.lineTo(px + inset, y + rad);
      c.quadraticCurveTo(px + inset, y, px + inset + rad, y);
      c.closePath(); c.fill();
      c.strokeStyle = edge; c.lineWidth = 1.5 * s; c.stroke();
      // 윗면 빛, 왼쪽 모서리 빛, 오른쪽 아래 그늘
      c.fillStyle = 'rgba(255,255,255,.22)'; rr(c, px + rad * 0.7, y + 1.6 * s, bw - rad * 1.6, 2.6 * s, 1.3 * s); c.fill();
      c.fillStyle = 'rgba(0,0,0,.16)'; rr(c, px + bw * 0.55, yb - 5 * s, bw * 0.4, 3 * s, 1.5 * s); c.fill();
      // 곰보 자국
      for (let k = 0; k < bw / (14 * s); k++) { c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.arc(px + 5 * s + r() * (bw - 10 * s), y + h * (0.35 + r() * 0.5), (0.8 + r() * 1.8) * s, 0, TAU); c.fill(); }
      if (r() < 0.5) { c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1 * s; const cx2 = px + bw * (0.3 + r() * 0.4); c.beginPath(); c.moveTo(cx2, y + 2 * s); c.lineTo(cx2 + 3 * s, y + h * 0.45); c.lineTo(cx2 - 1 * s, y + h * 0.8); c.stroke(); }
      px += bw;
    }
  }
  function shade(col, k) { const a = hex(col); return 'rgb(' + Math.min(255, Math.round(a[0] * k)) + ',' + Math.min(255, Math.round(a[1] * k)) + ',' + Math.min(255, Math.round(a[2] * k)) + ')'; }
  function mossCap(c, x, y, w, s, seed, t, wet) {
    const r = rng(seed);
    c.fillStyle = grad(c, y - 6 * s, y + 8 * s, '#8fcf5a', '#3f7d2a');
    c.beginPath(); c.moveTo(x - 2 * s, y + 4 * s);
    for (let i = 0; i <= 12; i++) { const px = x - 2 * s + (w + 4 * s) * i / 12; c.lineTo(px, y - (3 + r() * 4) * s); }
    for (let i = 12; i >= 0; i--) { const px = x - 2 * s + (w + 4 * s) * i / 12; c.lineTo(px, y + (5 + r() * 9) * s); }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(220,255,180,.45)';
    for (let i = 0; i < w / (18 * s); i++) { c.beginPath(); c.arc(x + r() * w, y - 1 * s, 2 * s, 0, TAU); c.fill(); }
    if (wet) { c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + w * 0.2, y - 2 * s, w * 0.25, 1.5 * s); }
  }
  function woodBeam(c, x, y, w, h, s, seed, a, b) {
    const r = rng(seed);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + 3 * s, y + 4 * s, w, h);
    c.fillStyle = grad(c, y, y + h, a || '#b07a48', b || '#6a4426'); rr(c, x, y, w, h, 4 * s); c.fill();
    c.strokeStyle = 'rgba(60,30,10,.35)'; c.lineWidth = 1 * s;
    for (let i = 0; i < 3; i++) { const yy = y + h * (0.3 + i * 0.22); c.beginPath(); c.moveTo(x + 4 * s, yy); c.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 4 * s, x + w * 0.7, yy + (r() - 0.5) * 4 * s, x + w - 4 * s, yy); c.stroke(); }
    c.fillStyle = 'rgba(255,230,190,.25)'; c.fillRect(x + 3 * s, y + 1.5 * s, w - 6 * s, 2 * s);
    c.strokeStyle = '#4a2c16'; c.lineWidth = 1.5 * s; rr(c, x, y, w, h, 4 * s); c.stroke();
    c.fillStyle = '#3a3a40'; c.beginPath(); c.arc(x + 7 * s, y + h * 0.5, 1.8 * s, 0, TAU); c.arc(x + w - 7 * s, y + h * 0.5, 1.8 * s, 0, TAU); c.fill();
  }

  function plat(c, V, p, t, fx) {
    const s = V.s;
    let x = V.X(p.x), y = V.Y(p.y);
    const w = p.w * s, h = p.h * s;
    if (y - 80 * s > V.ch || y + h + 120 * s < 0) return;
    if (p.gone > 0) { if (p.gone > 2.7) { c.globalAlpha = (p.gone - 2.7) / 0.3; } else return; }
    if (p.cr > 0) x += Math.sin(t * 70) * 2 * s * (p.cr / 0.55 + 0.3);
    if (p.magic === 1) { if (!fx.magicOn) return; c.globalAlpha *= clamp(fx.magicT, 0, 1); }
    if (p.magic === 2) { if (!fx.magic2On) return; c.globalAlpha *= clamp(fx.magic2T, 0, 1); }
    let blinkA = 1;
    if (p.blink) {                                   // 꺼진 동안은 흐린 테두리만, 꺼지기 직전엔 떨린다
      const b = p.blink, ph = (((fx.t || t) + b[2]) % b[0]) / b[0], left = (b[1] - ph) * b[0];
      if (ph >= b[1]) blinkA = 0.18;
      else if (left < 0.45) blinkA = 0.45 + 0.55 * (Math.sin(t * 40) > 0 ? 1 : 0);
    }
    const T = p.t, seed = p.id * 97 + 3;
    switch (T === 'hatch' ? 'hatch' : p.floor ? 'floor' : T) {
      case 'hatch': hatch(c, V, p, x, y, w, h, s, t); break;
      case 'floor': floorArt(c, V, p, x, y, w, h, s, t, fx); break;
      case 'stone': stoneSlab(c, x, y, w, h, s, seed, '#8e98a2', '#4d545e', '#2e343c'); break;
      case 'moss': stoneSlab(c, x, y, w, h, s, seed, '#7d8a86', '#454f4c', '#2a3230'); mossCap(c, x, y, w, s, seed, t, true); drips(c, x, y + h, w, s, t, seed); break;
      case 'wood': woodBeam(c, x, y, w, h, s, seed); break;
      case 'bucket': bucket(c, V, p, x, y, w, h, s, t); break;
      case 'plank': woodBeam(c, x, y, w, h, s, seed, '#8a6a4a', '#4a3424'); cracks(c, x, y, w, h, s, seed, 'rgba(30,15,5,.7)'); break;
      case 'jar': if (p.pill == null) p.pill = pillarLen(p); jar(c, x, y, w, h, s, seed, p.pill * s); break;
      case 'shelf': stoneSlab(c, x, y, w, h, s, seed, '#cfc6b4', '#8f8676', '#5e574c'); break;
      case 'line': clothesline(c, x, y, w, s, t, p, seed); break;
      case 'thatch': thatch(c, x, y, w, h, s, seed); break;
      case 'chimney': chimney(c, x, y, w, h, s, t, seed); break;
      case 'branch': branch(c, x, y, w, h, s, seed, p.x <= 0); break;
      case 'twig': twig(c, x, y, w, h, s, t, p); break;
      case 'bamboo': bambooPole(c, x, y, w, h, s, seed); break;
      case 'leaf': leafPad(c, x, y, w, h, s, t, seed); break;
      case 'rock': rock(c, x, y, w, h, s, seed, '#9a8c7c', '#5a4e44', true); break;
      case 'wet': rock(c, x, y, w, h, s, seed, '#6c747a', '#343a40', false); c.fillStyle = 'rgba(200,235,255,.5)'; c.fillRect(x + w * 0.15, y + 2 * s, w * 0.5, 1.8 * s); drips(c, x, y + h, w, s, t, seed); break;
      case 'crack': rock(c, x, y, w, h, s, seed, '#a08a74', '#5e4a3a', false); cracks(c, x, y, w, h, s, seed, 'rgba(40,20,10,.8)'); break;
      case 'cloud': cloudPlat(c, x, y, w, h, s, t, seed, '#ffffff', '#c9d2ee', 1); break;
      case 'mist': cloudPlat(c, x, y, w, h, s, t, seed, '#eef2ff', '#aeb8dc', 0.55); break;
      case 'puff': cloudPlat(c, x, y + (fx.bounce[p.id] || 0) * 6 * s, w, h, s, t, seed, '#ffe6f0', '#e0a9c6', 1); break;
      case 'ice': ice(c, x, y, w, h, s, seed); break;
      case 'snow': rock(c, x, y, w, h, s, seed, '#7d8494', '#454a58', false); snowCap(c, x, y, w, s, seed); break;
      case 'magic': magicStone(c, x, y, w, h, s, t); break;
      case 'peak': peakRock(c, x, y, w, h, s, t, seed); break;
      case 'storm': cloudPlat(c, x, y, w, h, s, t, seed, '#9aa0b8', '#555a72', 1); break;
      case 'rainbow': rainbowSlab(c, x, y, w, h, s, t); break;
      case 'kite': kite(c, x, y, w, h, s, t, p.id); break;
      case 'isle': isle(c, x, y, w, h, s, seed); break;
      case 'drift': driftCloud(c, x, y, w, h, s, t, seed, p.push); break;
      case 'star': starRow(c, x, y, w, h, s, t, blinkA); break;
      case 'aurora': aurora(c, x, y, w, h, s, t); break;
      case 'magpie': magpieBridge(c, x, y, w, h, s, t); break;
      case 'nebula': nebula(c, x, y, w, h, s, t, seed, blinkA); break;
      case 'moonrock': rock(c, x, y, w, h, s, seed, '#c9c6bc', '#6e6c66', false); break;
      case 'magic2': c.globalAlpha *= 1; starRow(c, x, y, w, h, s, t, 1); break;
      case 'moon': moonSurface(c, x, y, w, h, s, t, fx, p); break;
      default: stoneSlab(c, x, y, w, h, s, seed, '#999', '#555', '#333');
    }
    c.globalAlpha = 1;
  }

  // 받침 기둥 길이: 아래쪽 가장 가까운 발판 윗면까지
  function pillarLen(p) {
    const cx = p.x0 + p.w / 2;
    let best = L.zoneTop[p.z];
    for (const q of L.plats) if (q !== p && q.y0 < p.y0 - 20 && cx + 12 > q.x0 && cx - 12 < q.x0 + q.w && q.y0 > best) best = q.y0;
    return p.y0 - best;
  }
  function drips(c, x, y, w, s, t, seed) {
    const r = rng(seed + 5);
    for (let i = 0; i < 3; i++) {
      const dx = x + w * (0.15 + r() * 0.7), ph = (t * 0.6 + r()) % 1;
      c.fillStyle = 'rgba(190,230,255,' + (0.7 * (1 - ph)) + ')';
      c.beginPath(); c.ellipse(dx, y + ph * 40 * s, 1.6 * s, 2.6 * s, 0, 0, TAU); c.fill();
    }
  }
  function cracks(c, x, y, w, h, s, seed, col) {
    const r = rng(seed + 9); c.strokeStyle = col; c.lineWidth = 1.4 * s;
    for (let i = 0; i < 3; i++) {
      let cx = x + w * (0.2 + r() * 0.6), cy = y + 2 * s;
      c.beginPath(); c.moveTo(cx, cy);
      for (let k = 0; k < 4; k++) { cx += (r() - 0.5) * 12 * s; cy += h / 4; c.lineTo(cx, cy); }
      c.stroke();
    }
  }

  // 구간 바닥(쉼터) — 구간마다 모양이 다르다. 왼쪽 끝에 깃발
  function floorArt(c, V, p, x, y, w, h, s, t, fx) {
    const k = p.z, seed = 500 + k + (p.side === 'R' ? 50 : 0);
    // 구멍 양옆 조각: 바깥쪽은 화면 끝까지, 구멍 쪽은 조각 끝에서 끊는다
    let x0 = 0, x1 = V.cw;
    if (k > 0) { x0 = p.side === 'L' ? -20 : V.X(p.x); x1 = p.side === 'R' ? V.cw + 20 : V.X(p.x + p.w); }
    const ww = x1 - x0;
    if (k === 0) {                                // 우물 바닥: 자갈 둔덕 아래 고인 물
      const wy0 = y + 18 * s;
      const wg = grad(c, wy0, V.ch, '#1f3a40', '#07100f');
      c.fillStyle = wg; c.fillRect(x0, wy0, ww, Math.max(0, V.ch - wy0 + 10));
      // 물에 비친 빛기둥과 잔물결
      const lg = c.createLinearGradient(0, wy0, 0, wy0 + 260 * s);
      lg.addColorStop(0, 'rgba(255,240,190,.22)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = lg; c.beginPath(); c.moveTo(V.X(60), wy0); c.lineTo(V.X(L.W - 60), wy0); c.lineTo(V.X(L.W - 120), wy0 + 260 * s); c.lineTo(V.X(120), wy0 + 260 * s); c.fill();
      c.strokeStyle = 'rgba(210,240,255,.28)'; c.lineWidth = 1.4 * s;
      const rr1 = rng(3);
      for (let i = 0; i < 18; i++) {
        const px = V.X(rr1() * L.W), py = wy0 + (14 + rr1() * 240) * s, len = (16 + rr1() * 34) * s, ph = Math.sin(t * 1.2 + i) * 6 * s;
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i); c.beginPath(); c.moveTo(px + ph, py); c.lineTo(px + ph + len, py); c.stroke();
      }
      c.globalAlpha = 1;
      // 자갈 둔덕
      const r = rng(7);
      c.fillStyle = grad(c, y, wy0 + 6 * s, '#6e6656', '#3a352c'); c.fillRect(x0, y + 4 * s, ww, 18 * s);
      for (let i = 0; i < 70; i++) {
        const px = r() * V.cw, rad = (3 + r() * 7) * s, py = y + rad * 0.7 + r() * 12 * s;
        const g = c.createRadialGradient(px - rad * 0.4, py - rad * 0.4, rad * 0.1, px, py, rad * 1.3);
        const k2 = r(); g.addColorStop(0, mix('#c9c2b0', '#a8a08c', k2)); g.addColorStop(1, mix('#6a6456', '#4e4a40', k2));
        c.fillStyle = g; c.beginPath(); c.ellipse(px, py, rad * 1.35, rad, 0, 0, TAU); c.fill();
      }
      mossCap(c, x0, y, ww, s, 71, t, true);
      return;
    }
    if (k <= 3 || k === 9) stoneSlab(c, x0, y, ww, h, s, seed, k === 9 ? '#8a7e72' : '#7c868f', k === 9 ? '#4a4038' : '#3f464e', '#262b30');
    else if (k === 4) { stoneSlab(c, x0, y, ww, h, s, seed, '#9ba0a6', '#5a5f66', '#30343a'); mossCap(c, x0, y, ww, s, seed, t, false); }
    else if (k === 5) { stoneSlab(c, x0, y, ww, h, s, seed, '#a89e8c', '#6a6254', '#403a30'); }
    else if (k === 6) woodBeam(c, x0, y, ww, h, s, seed, '#9a6a44', '#5a3a22');
    else if (k === 7) bambooPole(c, x0, y, ww, h, s, seed);
    else if (k === 8) { rock(c, x0, y, ww, h, s, seed, '#8c9a6a', '#4e5a3a', true); }
    else if (k === 10) cloudPlat(c, x0, y, ww, h, s, t, seed, '#f4f0ff', '#b8b0dc', 1);
    else if (k === 11) { rock(c, x0, y, ww, h, s, seed, '#7d8494', '#454a58', false); snowCap(c, x0, y, ww, s, seed); }
    else if (k === 12) cloudPlat(c, x0, y, ww, h, s, t, seed, '#a4aac0', '#5a5f78', 1);
    else if (k === 13) rainbowSlab(c, x0, y, ww, h, s, t);
    else if (k === 14 || k === 16) cloudPlat(c, x0, y, ww, h, s, t, seed, '#ffffff', '#b9cfe6', 1);
    else if (k === 15) isle(c, x0, y, ww, h, s, seed);
    else if (k === 17) starRow(c, x0, y, ww, h, s, t, 1);
    else if (k === 18) aurora(c, x0, y, ww, h, s, t);
    else if (k === 19) ice(c, x0, y, ww, h, s, seed);
    else if (k === 20) magpieBridge(c, x0, y, ww, h, s, t);
    else if (k === 21 || k === 22) nebula(c, x0, y, ww, h, s, t, seed, 1);
    else if (k === 23) rock(c, x0, y, ww, h, s, seed, '#c9c6bc', '#6e6c66', false);
    // 깃발은 구간마다 하나: 왼쪽 조각이 넉넉하면 왼쪽 끝, 아니면 오른쪽 조각 끝
    const hx = L.UP[k - 1][0], flagX = hx >= 50 ? 24 : L.W - 30;
    if (!((p.side === 'L' && hx >= 50) || (p.side === 'R' && hx < 50))) return;
    // 깃발 (쉼터 표시). 닿으면 올라가 펄럭인다
    const fx0 = V.X(flagX), up = fx.flags[k] ? 1 : 0.35;
    c.strokeStyle = '#5a3a1e'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(fx0, y); c.lineTo(fx0, y - 62 * s); c.stroke();
    c.fillStyle = '#d9b36a'; c.beginPath(); c.arc(fx0, y - 63 * s, 3 * s, 0, TAU); c.fill();
    const fy = y - 60 * s + (1 - up) * 34 * s, wave = Math.sin(t * 6) * 3 * s * up;
    c.fillStyle = fx.flags[k] ? '#ff7a3c' : '#9aa0a8';
    c.beginPath(); c.moveTo(fx0 + 1.5 * s, fy); c.quadraticCurveTo(fx0 + 16 * s, fy - 3 * s + wave, fx0 + 32 * s, fy + 2 * s + wave);
    c.quadraticCurveTo(fx0 + 16 * s, fy + 10 * s - wave, fx0 + 1.5 * s, fy + 16 * s); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2 * s; c.stroke();
    // 깃발에 개구리 발자국
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(fx0 + 13 * s, fy + 8 * s + wave * 0.5, 3 * s, 0, TAU); c.fill();
  }

  function bucket(c, V, p, x, y, w, h, s, t) {
    // 밧줄: 위로 끝없이
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 2.5 * s;
    c.beginPath(); c.moveTo(x + w * 0.5, y - 14 * s); c.lineTo(x + w * 0.5, -10); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1 * s;
    for (let yy = y - 14 * s; yy > 0; yy -= 8 * s) { c.beginPath(); c.moveTo(x + w * 0.5 - 1.2 * s, yy); c.lineTo(x + w * 0.5 + 1.2 * s, yy - 4 * s); c.stroke(); }
    // 손잡이
    c.strokeStyle = '#555a60'; c.lineWidth = 2.2 * s; c.beginPath(); c.moveTo(x + 4 * s, y + 2 * s); c.quadraticCurveTo(x + w * 0.5, y - 26 * s, x + w - 4 * s, y + 2 * s); c.stroke();
    // 통
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(x + 5 * s, y + 4 * s); c.lineTo(x + w + 3 * s, y + 4 * s); c.lineTo(x + w - 3 * s, y + h + 6 * s); c.lineTo(x + 11 * s, y + h + 6 * s); c.fill();
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#6a4424'); g.addColorStop(0.35, '#b27c4a'); g.addColorStop(1, '#5a381c');
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - 7 * s, y + h); c.lineTo(x + 7 * s, y + h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,20,5,.4)'; c.lineWidth = 1 * s;
    for (let i = 1; i < 5; i++) { const u = i / 5; c.beginPath(); c.moveTo(x + w * u, y); c.lineTo(x + 7 * s + (w - 14 * s) * u, y + h); c.stroke(); }
    c.fillStyle = '#4a4e56';
    c.fillRect(x + 1 * s, y + h * 0.18, w - 2 * s, 3 * s); c.fillRect(x + 5 * s, y + h * 0.72, w - 10 * s, 3 * s);
    c.fillStyle = '#2a2016'; c.beginPath(); c.ellipse(x + w * 0.5, y, w * 0.5, 4 * s, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(120,180,200,.6)'; c.beginPath(); c.ellipse(x + w * 0.5, y + 0.5 * s, w * 0.42, 2.6 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = '#3a2410'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - 7 * s, y + h); c.lineTo(x + 7 * s, y + h); c.closePath(); c.stroke();
  }

  function jar(c, x, y, w, h, s, seed, pill) {        // 옹기 항아리: 뚜껑이 발판, 돌기둥 위에 놓였다
    const cx = x + w * 0.5, bw = w * 0.62, bh = 70 * s;
    const pw = w * 0.9;
    c.fillStyle = grad(c, y + bh, y + bh + 30 * s, '#b8ae9c', '#7a7264'); c.fillRect(cx - pw / 2, y + bh - 2 * s, pw, 14 * s);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(cx - pw / 2, y + bh - 2 * s, pw, 2 * s);
    const cg = c.createLinearGradient(cx - pw * 0.3, 0, cx + pw * 0.3, 0);
    cg.addColorStop(0, '#8a8272'); cg.addColorStop(0.4, '#b0a896'); cg.addColorStop(1, '#6a6254');
    c.fillStyle = cg; c.fillRect(cx - pw * 0.3, y + bh + 12 * s, pw * 0.6, Math.max(0, pill - bh - 12 * s));
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.2 * s;
    for (let k = 1; k * 50 * s < pill - bh - 12 * s; k++) { const yy = y + bh + 12 * s + k * 50 * s; c.beginPath(); c.moveTo(cx - pw * 0.3, yy); c.lineTo(cx + pw * 0.3, yy); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(cx + 4 * s, y + bh + 4 * s, bw * 0.8, 6 * s, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(cx - bw * 0.35, y + bh * 0.3, 4 * s, cx, y + bh * 0.45, bw);
    g.addColorStop(0, '#9a5a34'); g.addColorStop(0.55, '#5e2e18'); g.addColorStop(1, '#2e1408');
    c.fillStyle = g; c.beginPath();
    c.moveTo(cx - bw * 0.42, y + 6 * s); c.bezierCurveTo(cx - bw * 1.05, y + bh * 0.3, cx - bw * 0.8, y + bh, cx - bw * 0.45, y + bh);
    c.lineTo(cx + bw * 0.45, y + bh); c.bezierCurveTo(cx + bw * 0.8, y + bh, cx + bw * 1.05, y + bh * 0.3, cx + bw * 0.42, y + 6 * s); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,220,180,.35)'; c.beginPath(); c.ellipse(cx - bw * 0.45, y + bh * 0.35, 4 * s, 13 * s, -0.2, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(220,170,110,.35)'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(cx - bw * 0.62, y + bh * 0.4); c.quadraticCurveTo(cx - bw * 0.2, y + bh * 0.47, cx + bw * 0.5, y + bh * 0.36); c.stroke();
    // 뚜껑
    c.fillStyle = grad(c, y - 2 * s, y + h * 0.4, '#8a5a3a', '#3e2212');
    c.beginPath(); c.ellipse(cx, y + 5 * s, w * 0.5, 7 * s, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,230,200,.25)'; c.beginPath(); c.ellipse(cx - w * 0.1, y + 3 * s, w * 0.3, 2.5 * s, 0, 0, TAU); c.fill();
    c.fillStyle = '#4a2a16'; c.beginPath(); c.ellipse(cx, y + 1 * s, 7 * s, 3.5 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = '#24100a'; c.lineWidth = 1.4 * s; c.beginPath(); c.ellipse(cx, y + 5 * s, w * 0.5, 7 * s, 0, 0, TAU); c.stroke();
  }

  function clothesline(c, x, y, w, s, t, p, seed) {
    const sag = (8 + (p.bend || 0) * 26) * s;
    c.fillStyle = '#6a4a2a';
    c.fillRect(x - 5 * s, y - 6 * s, 6 * s, 120 * s); c.fillRect(x + w - 1 * s, y - 6 * s, 6 * s, 120 * s);
    c.strokeStyle = '#e8e0cc'; c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w * 0.5, y + sag * 2, x + w, y); c.stroke();
    // 널린 옷 두 장
    const cols = ['#e8f0ff', '#f4c7c7'];
    for (let i = 0; i < 2; i++) {
      const u = 0.28 + i * 0.42, cx = x + w * u, cy = y + sag * 2 * (1 - Math.pow(2 * u - 1, 2)) * 0.5 + 1 * s;
      const sw = Math.sin(t * 2 + i) * 3 * s;
      c.fillStyle = cols[i]; c.beginPath(); c.moveTo(cx - 13 * s, cy); c.lineTo(cx + 13 * s, cy); c.lineTo(cx + 11 * s + sw, cy + 30 * s); c.lineTo(cx - 11 * s + sw, cy + 30 * s); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1 * s; c.stroke();
      c.fillStyle = '#c9a060'; c.fillRect(cx - 9 * s, cy - 3 * s, 3 * s, 6 * s); c.fillRect(cx + 6 * s, cy - 3 * s, 3 * s, 6 * s);
    }
  }

  function thatch(c, x, y, w, h, s, seed) {     // 초가지붕 조각
    const r = rng(seed);
    c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, x + 3 * s, y + 5 * s, w, h, 12 * s); c.fill();
    c.fillStyle = grad(c, y, y + h, '#e0bf6e', '#8e6a2e');
    c.beginPath(); c.moveTo(x, y + h); c.quadraticCurveTo(x - 4 * s, y + 2 * s, x + 14 * s, y); c.lineTo(x + w - 14 * s, y); c.quadraticCurveTo(x + w + 4 * s, y + 2 * s, x + w, y + h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,80,20,.45)'; c.lineWidth = 1 * s;
    for (let i = 0; i < w / (4 * s); i++) { const px = x + r() * w; c.beginPath(); c.moveTo(px, y + 2 * s); c.lineTo(px + (r() - 0.5) * 4 * s, y + h); c.stroke(); }
    c.strokeStyle = 'rgba(90,60,20,.6)'; c.lineWidth = 1.5 * s;
    for (let i = 1; i < w / (28 * s); i++) { const px = x + i * 28 * s; c.beginPath(); c.moveTo(px, y); c.lineTo(px - 6 * s, y + h); c.stroke(); }
    c.beginPath(); c.moveTo(x + 4 * s, y + h * 0.5); c.lineTo(x + w - 4 * s, y + h * 0.5); c.stroke();
    c.fillStyle = 'rgba(255,245,200,.4)'; c.fillRect(x + 12 * s, y + 1 * s, w - 24 * s, 2 * s);
    // 처마 끝 짚 술
    c.strokeStyle = '#8e6a2e'; c.lineWidth = 1.2 * s;
    for (let px = x + 3 * s; px < x + w - 3 * s; px += 3 * s) { c.beginPath(); c.moveTo(px, y + h); c.lineTo(px + (r() - 0.5) * 2 * s, y + h + (3 + r() * 4) * s); c.stroke(); }
  }

  function chimney(c, x, y, w, h, s, t, seed) {
    stoneSlab(c, x, y, w, h + 60 * s, s, seed, '#b0a08a', '#6a5a48', '#40362a');
    c.fillStyle = '#2a2420'; c.fillRect(x + w * 0.3, y - 2 * s, w * 0.4, 4 * s);
    for (let i = 0; i < 4; i++) {
      const ph = (t * 0.35 + i / 4) % 1, px = x + w * 0.5 + Math.sin(ph * 5 + i) * 10 * s, py = y - ph * 120 * s;
      c.fillStyle = 'rgba(230,230,235,' + (0.45 * (1 - ph)) + ')'; c.beginPath(); c.arc(px, py, (8 + ph * 18) * s, 0, TAU); c.fill();
    }
  }

  function bark(c, x, y, w, h, s, seed) {
    const r = rng(seed);
    c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, x + 3 * s, y + 5 * s, w, h, h * 0.5); c.fill();
    c.fillStyle = grad(c, y, y + h, '#8a6446', '#3e2a1c'); rr(c, x, y, w, h, h * 0.5); c.fill();
    c.strokeStyle = 'rgba(30,18,10,.45)'; c.lineWidth = 1 * s;
    for (let i = 0; i < w / (10 * s); i++) { const px = x + r() * w; c.beginPath(); c.moveTo(px, y + h * 0.25); c.lineTo(px + 8 * s, y + h * 0.35); c.stroke(); }
    c.fillStyle = 'rgba(255,230,200,.18)'; c.fillRect(x + h * 0.4, y + 2 * s, w - h * 0.8, 2 * s);
  }
  function leafSpray(c, x, y, s, r, n, a, b) {
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.4, len = (10 + r() * 8) * s;
      const lx = x + Math.cos(ang) * len * 0.6, ly = y + Math.sin(ang) * len * 0.6;
      c.fillStyle = mix(a, b, r()); c.beginPath(); c.ellipse(lx, ly, len * 0.55, len * 0.22, ang, 0, TAU); c.fill();
    }
  }
  function branch(c, x, y, w, h, s, seed, fromLeft) {
    const r = rng(seed);
    bark(c, x, y, w, h, s, seed);
    for (let i = 0; i < w / (40 * s); i++) leafSpray(c, x + r() * w, y, s, r, 5, '#5f9a3a', '#3a6a22');
    // 감 두세 개
    for (let i = 0; i < 2 + (seed % 2); i++) {
      const px = x + w * (0.15 + r() * 0.7), py = y + h + (6 + r() * 6) * s;
      c.strokeStyle = '#3e2a1c'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(px, y + h - 2 * s); c.lineTo(px, py - 6 * s); c.stroke();
      const g = c.createRadialGradient(px - 2.5 * s, py - 2.5 * s, 1 * s, px, py, 8 * s);
      g.addColorStop(0, '#ffb45a'); g.addColorStop(1, '#d9541e');
      c.fillStyle = g; c.beginPath(); c.ellipse(px, py, 7.5 * s, 6.8 * s, 0, 0, TAU); c.fill();
      c.fillStyle = '#4a6a2a'; c.beginPath(); c.ellipse(px, py - 6 * s, 5 * s, 2 * s, 0, 0, TAU); c.fill();
    }
  }
  function twig(c, x, y, w, h, s, t, p) {
    const bend = (p.bend || 0) * 18 * s;
    c.strokeStyle = '#5a3e28'; c.lineWidth = h * 0.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y + h * 0.5); c.quadraticCurveTo(x + w * 0.5, y + h * 0.5 + bend, x + w, y + h * 0.3 + bend * 0.6); c.stroke();
    c.strokeStyle = 'rgba(255,230,200,.25)'; c.lineWidth = 1.5 * s;
    c.beginPath(); c.moveTo(x + 4 * s, y + 2 * s); c.quadraticCurveTo(x + w * 0.5, y + 2 * s + bend, x + w - 4 * s, y + bend * 0.6); c.stroke();
    c.lineCap = 'butt';
    const r = rng(p.id);
    leafSpray(c, x + w, y + bend * 0.6, s, r, 6, '#7ab34a', '#4a7a2a');
    leafSpray(c, x + w * 0.4, y + bend * 0.8, s, r, 3, '#7ab34a', '#4a7a2a');
  }
  function bambooPole(c, x, y, w, h, s, seed) {
    c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, x + 3 * s, y + 5 * s, w, h, h * 0.5); c.fill();
    c.fillStyle = grad(c, y, y + h, '#a8d06a', '#4e7a2a'); rr(c, x, y, w, h, h * 0.5); c.fill();
    c.fillStyle = 'rgba(255,255,220,.35)'; c.fillRect(x + 4 * s, y + h * 0.22, w - 8 * s, 2 * s);
    for (let px = x + 30 * s; px < x + w - 8 * s; px += 42 * s) { c.fillStyle = '#3e6a22'; c.fillRect(px, y, 3 * s, h); c.fillStyle = 'rgba(255,255,220,.4)'; c.fillRect(px + 3 * s, y + 2 * s, 1.5 * s, h - 4 * s); }
    c.strokeStyle = '#2e4e18'; c.lineWidth = 1.2 * s; rr(c, x, y, w, h, h * 0.5); c.stroke();
  }
  function leafPad(c, x, y, w, h, s, t, seed) {   // 흔들리는 댓잎 무더기
    const r = rng(seed);
    c.strokeStyle = '#4e7a2a'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + w * 0.5, y + h); c.lineTo(x + w * 0.5 + Math.sin(t) * 6 * s, y + h + 80 * s); c.stroke();
    for (let i = 0; i < 9; i++) {
      const lx = x + w * (i + 0.5) / 9, ang = (i - 4) * 0.12;
      c.fillStyle = mix('#8cc05a', '#3e6e22', r());
      c.beginPath(); c.ellipse(lx, y + h * 0.5 + Math.abs(i - 4) * 1.2 * s, 14 * s, 5 * s, ang, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(255,255,220,.35)'; c.fillRect(x + w * 0.2, y + 1 * s, w * 0.5, 1.5 * s);
  }
  function rock(c, x, y, w, h, s, seed, a, b, grass) {
    const r = rng(seed);
    c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, x + 3 * s, y + 5 * s, w, h + 6 * s, 10 * s); c.fill();
    c.fillStyle = grad(c, y, y + h + 8 * s, a, b);
    c.beginPath(); c.moveTo(x, y + 4 * s);
    for (let i = 0; i <= 6; i++) c.lineTo(x + w * i / 6, y + (r() * 3) * s);
    c.lineTo(x + w, y + h * 0.6); c.lineTo(x + w - 8 * s, y + h + 6 * s);
    for (let i = 5; i >= 1; i--) c.lineTo(x + w * i / 6, y + h + (2 + r() * 8) * s);
    c.lineTo(x + 6 * s, y + h + 2 * s); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.3 * s; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x + 5 * s, y + 3 * s, w - 10 * s, 2.5 * s);
    c.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x + r() * w, y + h * (0.4 + r() * 0.5), (5 + r() * 8) * s, 2.5 * s, 0, 0, TAU); c.fill(); }
    if (grass) { c.strokeStyle = '#7aa24a'; c.lineWidth = 1.6 * s; for (let i = 0; i < w / (7 * s); i++) { const px = x + r() * w; c.beginPath(); c.moveTo(px, y + 2 * s); c.lineTo(px + (r() - 0.5) * 5 * s, y - (4 + r() * 6) * s); c.stroke(); } }
  }

  function cloudPlat(c, x, y, w, h, s, t, seed, col, sh, alpha) {
    const r = rng(seed), n = Math.max(3, Math.round(w / (26 * s)));
    c.globalAlpha *= alpha;
    const bob = Math.sin(t * 1.3 + seed) * 1.5 * s;
    c.fillStyle = sh; c.beginPath();
    for (let i = 0; i < n; i++) { const px = x + w * (i + 0.5) / n, rad = (h * 0.7 + r() * 8 * s); c.arc(px, y + h * 0.55 + bob + 3 * s, rad, 0, TAU); }
    c.fill();
    const r2 = rng(seed);
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < n; i++) { const px = x + w * (i + 0.5) / n, rad = (h * 0.7 + r2() * 8 * s); c.arc(px, y + h * 0.45 + bob, rad * 0.92, 0, TAU); }
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(x + w * 0.35, y + h * 0.2 + bob, w * 0.18, 3 * s, 0, 0, TAU); c.fill();
    c.globalAlpha /= alpha;
  }
  function ice(c, x, y, w, h, s, seed) {
    const r = rng(seed);
    c.fillStyle = 'rgba(0,0,0,.22)'; rr(c, x + 3 * s, y + 5 * s, w, h, 6 * s); c.fill();
    c.fillStyle = grad(c, y, y + h, '#e6f6ff', '#7ab4dc'); rr(c, x, y, w, h, 6 * s); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x + 5 * s, y + 2 * s, w * 0.6, 2.5 * s);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.2 * s;
    for (let i = 0; i < 3; i++) { const px = x + r() * w; c.beginPath(); c.moveTo(px, y + 4 * s); c.lineTo(px + 8 * s, y + h - 4 * s); c.stroke(); }
    // 고드름
    c.fillStyle = 'rgba(200,235,255,.9)';
    for (let px = x + 6 * s; px < x + w - 6 * s; px += (9 + r() * 10) * s) { const l = (6 + r() * 12) * s; c.beginPath(); c.moveTo(px - 3 * s, y + h - 1); c.lineTo(px + 3 * s, y + h - 1); c.lineTo(px, y + h + l); c.fill(); }
    c.strokeStyle = '#4a86b0'; c.lineWidth = 1.3 * s; rr(c, x, y, w, h, 6 * s); c.stroke();
  }
  function snowCap(c, x, y, w, s, seed) {
    const r = rng(seed + 3);
    c.fillStyle = '#f4f8ff'; c.beginPath(); c.moveTo(x - 3 * s, y + 5 * s);
    for (let i = 0; i <= 10; i++) c.lineTo(x - 3 * s + (w + 6 * s) * i / 10, y - (2 + r() * 4) * s);
    for (let i = 10; i >= 0; i--) c.lineTo(x - 3 * s + (w + 6 * s) * i / 10, y + (5 + r() * 7) * s);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(150,180,220,.4)'; c.fillRect(x, y + 6 * s, w, 2 * s);
  }
  function magicStone(c, x, y, w, h, s, t) {
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 2 * s, x + w / 2, y + h / 2, w);
    g.addColorStop(0, 'rgba(255,230,140,.55)'); g.addColorStop(1, 'rgba(255,230,140,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x + w / 2, y + h / 2, w, 0, TAU); c.fill();
    stoneSlab(c, x, y, w, h, s, 999, '#fff1c0', '#c9a24a', '#8a6a20');
    c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.3 * Math.sin(t * 4)) + ')'; c.fillRect(x + 6 * s, y + 3 * s, w - 12 * s, 2 * s);
  }
  function peakRock(c, x, y, w, h, s, t, seed) {
    rock(c, x, y, w, h + 50 * s, s, seed, '#8a90a0', '#3e4452', false);
    // 아래로 뾰족하게 좁아지는 바위 뿌리(아래 발판을 가리지 않을 만큼만)
    c.fillStyle = grad(c, y + h, y + h + 110 * s, '#4a5060', 'rgba(62,68,82,0)');
    c.beginPath(); c.moveTo(x + 8 * s, y + h + 40 * s); c.lineTo(x + w - 6 * s, y + h + 40 * s); c.lineTo(x + w * 0.62, y + h + 110 * s); c.closePath(); c.fill();
    snowCap(c, x, y, w, s, seed);
    // 꼭대기 돌탑
    const cx = x + w * 0.6;
    const st = [[22, 9], [17, 8], [12, 7], [7, 6]];
    let yy = y;
    for (const [rw, rh] of st) { c.fillStyle = grad(c, yy - rh * 2 * s, yy, '#b8b4aa', '#6e6a62'); c.beginPath(); c.ellipse(cx, yy - rh * s, rw * s, rh * s, 0, 0, TAU); c.fill(); yy -= rh * 1.7 * s; }
  }

  // 석등 열둘 (산꼭대기 쉼터 위)
  function lanterns(c, V, t, lit) {
    const z = L.zoneTop[11], s = V.s, y = V.Y(z + 1000);
    if (y < -60 || y - 60 * s > V.ch) return;
    for (let i = 0; i < 12; i++) {
      const x = V.X(14 + i * 15), on = i < lit;
      c.fillStyle = '#8e8a80'; c.fillRect(x - 2.5 * s, y - 16 * s, 5 * s, 16 * s);
      c.fillStyle = '#a8a498'; c.fillRect(x - 5 * s, y - 26 * s, 10 * s, 10 * s);
      c.fillStyle = '#6e6a62'; c.beginPath(); c.moveTo(x - 6.5 * s, y - 26 * s); c.lineTo(x, y - 32 * s); c.lineTo(x + 6.5 * s, y - 26 * s); c.fill();
      c.fillStyle = on ? '#ffd65a' : '#3a3834'; c.fillRect(x - 3 * s, y - 24 * s, 6 * s, 6 * s);
      if (on) { const g = c.createRadialGradient(x, y - 21 * s, 1, x, y - 21 * s, 18 * s); g.addColorStop(0, 'rgba(255,220,120,' + (0.55 + 0.15 * Math.sin(t * 5 + i)) + ')'); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 21 * s, 18 * s, 0, TAU); c.fill(); }
    }
  }

  // ── 개구리 ── 오른쪽을 보는 옆모습, 발밑 가운데가 (0,0). 단위는 세계 좌표
  const OUT = '#1d4a1f';
  function frogBody(c, sq) {
    c.beginPath();
    c.moveTo(-15, -2);
    c.bezierCurveTo(-19, -12, -10, -22, 2, -21);
    c.bezierCurveTo(12, -21, 19, -15, 19, -10);
    c.bezierCurveTo(19, -5, 14, -1, 6, 0);
    c.bezierCurveTo(0, 1, -12, 1, -15, -2);
    c.closePath();
  }
  function greenFill(c, x, y, r) {
    const g = c.createRadialGradient(x, y, 1, x + 4, y + 6, r);
    g.addColorStop(0, '#9be86a'); g.addColorStop(0.45, '#56b83e'); g.addColorStop(1, '#2a6e28');
    return g;
  }
  function leg(c, pts, w) {                    // 굵기가 줄어드는 다리
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = OUT; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    c.strokeStyle = '#4aa436'; c.lineWidth = w; c.stroke();
    c.strokeStyle = 'rgba(190,255,150,.45)'; c.lineWidth = w * 0.3; c.stroke();
  }
  function toes(c, x, y, dir, sp) {
    c.fillStyle = '#4aa436'; c.strokeStyle = OUT; c.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { const a = dir + i * sp; c.beginPath(); c.arc(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6, 1.6, 0, TAU); c.fill(); c.stroke(); }
    c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill();
  }
  function eye(c, x, y, r, look, blink, dizzy, t) {
    c.fillStyle = greenFill(c, x - 2, y - 3, r * 1.6); c.strokeStyle = OUT; c.lineWidth = 1.5;
    c.beginPath(); c.arc(x, y, r * 1.28, Math.PI * 0.95, Math.PI * 2.05); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fffdf2'; c.beginPath(); c.arc(x + 0.6, y - 0.6, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.8; c.stroke();
    if (dizzy) {
      c.strokeStyle = '#222'; c.lineWidth = 1.1; c.beginPath();
      for (let a = 0; a < 9; a += 0.3) { const rr2 = a * 0.42, px = x + 0.6 + Math.cos(a + t * 8) * rr2, py = y - 0.6 + Math.sin(a + t * 8) * rr2; a === 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
      c.stroke(); return;
    }
    if (blink > 0) { c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - r + 0.6, y - 0.4); c.quadraticCurveTo(x + 0.6, y + r * 0.6 * blink, x + r + 0.6, y - 0.4); c.stroke(); return; }
    c.fillStyle = '#111'; c.beginPath(); c.arc(x + 1.2 + look[0], y - 0.4 + look[1], r * 0.62, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 0.3 + look[0], y - 2 + look[1], r * 0.26, 0, TAU); c.fill();
    c.beginPath(); c.arc(x + 2.2 + look[0], y + 0.8 + look[1], r * 0.12, 0, TAU); c.fill();
  }

  // 제미나이 개구리 그림(img/frog.png). 안 떴으면 코드 개구리로 그린다
  const SPR = window.FROG_SPR, SPRIMG = new Image();
  if (SPR) SPRIMG.src = SPR.src;
  function sprFrame(F) {
    const m = F.mode;
    if (F.tongue) return 'tongue';
    if (m === 'splat') return 'splat';
    if (m === 'rise') return 'rise';
    if (m === 'fall') return 'fall';
    if (m === 'charge' || (m === 'land' && F.land > 0.3)) return 'crouch';
    if (m === 'walk') return Math.sin(F.walkPh) > 0 ? 'walk' : 'idle';
    return F.blink ? 'blink' : 'idle';
  }
  // 로봇개(하드 모드) 그림: img/robodog.webp, 줄마다 동작
  const DSPR = window.DOG_SPR, DIMG = new Image();
  if (DSPR) DIMG.src = DSPR.src;
  function dogFrame(F, t) {
    const A = DSPR.anim, m = F.mode, pick = (row, i) => A[row][Math.max(0, Math.min(A[row].length - 1, i))];
    if (m === 'splat') {                               // 부서짐 → 고장 → 수리 → 원상복구
      const e = F.stunT || 0;
      if (e < 0.45) return pick('crash', 4 + Math.floor(e / 0.45 * 4));
      if (e < 0.95) return pick('broken', Math.floor((e - 0.45) / 0.5 * 9));
      if (e < 1.9) return pick('repair', Math.floor((e - 0.95) / 0.95 * 9));
      return pick('fixed', Math.floor((e - 1.9) / 0.5 * 9));
    }
    if (m === 'rise') return pick('jump', F.vy > 700 ? 2 : 3);
    if (m === 'fall') return pick('jump', F.vy > -500 ? 5 : 6);
    if (m === 'land') return pick('jump', 7);
    if (m === 'walk') return pick('walk', 1 + Math.floor(F.walkPh * 0.9) % 9);
    if (F.tongue) return pick('fixed', 4);
    return pick('walk', 0);
  }
  function dogSpr(c, sx, sy, s, F, t) {
    const q = DSPR.rects[dogFrame(F, t)], k = 50 / 100 * s;
    const w = q[2] * k, h = q[3] * k;
    c.save(); c.translate(sx, sy);
    if (F.ground) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, 22 * s, 3.5 * s, 0, 0, TAU); c.fill(); }
    if (F.slide) { c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-F.face * (12 + i * 7) * s, -2 * s, (2.5 - i * 0.6) * s, 0, TAU); c.fill(); } }   // 미끄러질 때 발 뒤 불꽃
    c.scale(F.face, 1);
    const air = F.mode === 'rise' || F.mode === 'fall';
    const bob = F.mode === 'idle' ? Math.sin(t * 3) * 0.6 * s : 0;
    c.drawImage(DIMG, q[0], q[1], q[2], q[3], -w / 2, -h + (air ? h * 0.2 : 2 * s) + bob, w, h);
    c.restore();
  }
  function frog(c, sx, sy, s, F, t) {
    if (F.robo && DSPR && DIMG.complete && DIMG.naturalWidth) return dogSpr(c, sx, sy, s, F, t);
    if (SPR && SPRIMG.complete && SPRIMG.naturalWidth) return frogSpr(c, sx, sy, s, F, t);
    return frogCode(c, sx, sy, s, F, t);
  }
  function frogSpr(c, sx, sy, s, F, t) {
    const name = sprFrame(F), fr = SPR.frames[name];
    const k = 48 / 199 * s;                    // 앉은 개구리 폭이 세계 48 정도
    let w = fr[2] * k, h = fr[3] * k, sq = 1;
    if (F.mode === 'land') sq = 1 - 0.12 * F.land;
    if (F.mode === 'idle') sq = 1 + Math.sin(t * 3) * 0.015;
    c.save();
    c.translate(sx, sy);
    if (F.ground) { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, w * 0.42, 3.5 * s, 0, 0, TAU); c.fill(); }
    c.scale(F.face, 1);
    const air = F.mode === 'rise' || F.mode === 'fall';
    const hop = F.mode === 'walk' ? Math.abs(Math.sin(F.walkPh)) * 3 * s : 0;
    c.drawImage(SPRIMG, fr[0], fr[1], fr[2], fr[3], -w / 2, -h * sq - hop + (air ? h * 0.25 : 2 * s), w, h * sq);
    c.restore();
    if (F.mode === 'splat') for (let i = 0; i < 3; i++) { const a = t * 4 + i * TAU / 3; star(c, sx + Math.cos(a) * 18 * s, sy - 26 * s + Math.sin(a) * 5 * s, 4 * s, '#ffe066'); }
  }
  function frogCode(c, sx, sy, s, F, t) {
    s *= 1.2;                                   // 그림은 부딪힘 상자보다 조금 크게
    c.save();
    c.translate(sx, sy);
    // 접지 그림자
    if (F.ground) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 0, 18 * s * (1 + F.sq * 0.2), 3.5 * s, 0, 0, TAU); c.fill(); }
    c.scale(s * F.face, s);
    let sx2 = 1, sy2 = 1, rot = 0;
    const m = F.mode;
    if (m === 'charge') { sx2 = 1 + 0.2 * F.sq; sy2 = 1 - 0.3 * F.sq; if (F.sq >= 0.99) c.translate(Math.sin(t * 90) * 0.7, 0); }
    else if (m === 'rise') { sx2 = 0.9; sy2 = 1.14; rot = -0.35; }
    else if (m === 'fall') { rot = 0.18; }
    else if (m === 'splat') { sx2 = 1.32; sy2 = 0.56; }
    else if (m === 'land') { sx2 = 1 + 0.25 * F.land; sy2 = 1 - 0.3 * F.land; }
    else if (m === 'walk') { const hop = Math.abs(Math.sin(F.walkPh)); c.translate(0, -hop * 4); rot = -0.08 * hop; }
    // 뒤쪽(먼 쪽) 눈과 다리 먼저
    c.rotate(rot); c.scale(sx2, sy2);
    const air = m === 'rise' || m === 'fall';
    if (m === 'rise') {
      leg(c, [[-10, -7], [-24, -5], [-37, -4]], 4.2); toes(c, -38, -4, Math.PI, 0.55);
    } else if (m === 'fall') {
      leg(c, [[-10, -5], [-20, 1], [-24, 9]], 4.2); toes(c, -24, 10, Math.PI * 0.6, 0.55);
    } else if (m === 'splat') {
      leg(c, [[-10, -2], [-22, 0], [-28, 1]], 4); toes(c, -29, 1, Math.PI, 0.6);
    }
    eye(c, 0.5, -21.5, 3.8, [0, 0], F.blink, m === 'splat', t);     // 먼 눈
    // 몸
    const breath = m === 'idle' ? Math.sin(t * 3) * 0.6 : 0;
    c.fillStyle = greenFill(c, -3, -17, 26); frogBody(c); c.fill();
    c.save(); frogBody(c); c.clip();
    // 배
    const bg = c.createLinearGradient(0, -12, 0, 1);
    bg.addColorStop(0, '#f6f0bd'); bg.addColorStop(1, '#d5c77e');
    c.fillStyle = bg; c.beginPath(); c.ellipse(7, -2.5, 13, 7 + breath, 0.05, 0, TAU); c.fill();
    // 등 무늬
    c.fillStyle = 'rgba(30,90,30,.45)';
    c.beginPath(); c.ellipse(-8, -14, 3.2, 2.2, 0.3, 0, TAU); c.ellipse(-1, -17.5, 2.6, 1.8, 0, 0, TAU); c.ellipse(-12, -7.5, 2.3, 1.7, 0.6, 0, TAU); c.fill();
    // 등줄기 빛
    c.strokeStyle = 'rgba(220,255,170,.5)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-14, -8); c.quadraticCurveTo(-11, -18, 1, -19.5); c.stroke();
    // 아래쪽 그늘
    c.fillStyle = 'rgba(20,60,20,.25)'; c.beginPath(); c.ellipse(-4, 1, 16, 4, 0, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = OUT; c.lineWidth = 1.7; frogBody(c); c.stroke();
    // 볼, 콧구멍, 입
    c.fillStyle = 'rgba(255,130,130,.35)'; c.beginPath(); c.ellipse(12.5, -9, 3, 1.8, 0, 0, TAU); c.fill();
    c.fillStyle = OUT; c.beginPath(); c.arc(17, -14.6, 0.8, 0, TAU); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 1.3;
    if (F.mouth > 0) { c.fillStyle = '#b8434f'; c.beginPath(); c.moveTo(19, -10); c.quadraticCurveTo(14, -8.5 + F.mouth * 4, 9, -9); c.quadraticCurveTo(14, -9.5, 19, -10); c.fill(); c.stroke(); }
    else { c.beginPath(); c.moveTo(18.8, -10); c.quadraticCurveTo(14, -7.6, 8.5, -9.4); c.stroke(); }
    // 뒷다리 허벅지(앞쪽)
    if (!air && m !== 'splat') {
      const fold = m === 'charge' ? F.sq : 0;
      c.fillStyle = greenFill(c, -12, -9, 14); c.strokeStyle = OUT; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(-8.5, -5.5 + fold * 1.5, 8.5 + fold, 6.2, -0.35, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(30,90,30,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(-9, -10, -3, -7); c.stroke();
      // 발
      c.fillStyle = '#4aa436'; c.strokeStyle = OUT; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(-14, -0.5); c.quadraticCurveTo(-6, -2.5, 3, -0.6); c.lineTo(3, 0.3); c.lineTo(-14, 0.3); c.closePath(); c.fill(); c.stroke();
      toes(c, 4, -0.8, 0, 0.6);
    } else if (air) {
      c.fillStyle = greenFill(c, -12, -9, 14); c.strokeStyle = OUT; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(-8, -6, 7.5, 5.5, -0.5, 0, TAU); c.fill(); c.stroke();
      if (m === 'rise') { leg(c, [[-8, -4], [-22, -1], [-36, 1]], 4.4); toes(c, -37, 1, Math.PI, 0.55); }
      else { leg(c, [[-7, -3], [-16, 4], [-19, 12]], 4.4); toes(c, -19, 13, Math.PI * 0.55, 0.55); }
    } else {
      leg(c, [[-8, -2], [-18, 2], [-24, 3]], 4.4); toes(c, -25, 3, Math.PI, 0.6);
    }
    // 앞다리
    if (m === 'rise') { leg(c, [[10, -5], [17, -6], [22, -9]], 3); toes(c, 23, -9.5, -0.3, 0.55); }
    else if (m === 'fall') { leg(c, [[10, -4], [16, 0], [19, 5]], 3); toes(c, 20, 6, 0.9, 0.55); }
    else if (m === 'splat') { leg(c, [[10, -2], [18, 0], [24, 1]], 3); toes(c, 25, 1, 0, 0.6); }
    else { leg(c, [[10, -5], [12, -2], [13, -0.8]], 3); toes(c, 14.5, -0.8, 0, 0.6); }
    // 가까운 눈
    const look = F.look || [0, 0];
    eye(c, 7.5, -21.5, 4.6, look, F.blink, m === 'splat', t);
    // 힘 모을 때 이마의 땀
    if (m === 'charge' && F.sq > 0.7) { c.fillStyle = 'rgba(200,240,255,.9)'; c.beginPath(); c.ellipse(-4, -24 - (t * 20 % 4), 1.4, 2.2, 0, 0, TAU); c.fill(); }
    c.restore();
    // 어지러운 별
    if (m === 'splat') {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * TAU / 3, px = sx + Math.cos(a) * 16 * s, py = sy - 22 * s + Math.sin(a) * 5 * s;
        star(c, px, py, 4 * s, '#ffe066');
      }
    }
  }
  function star(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    c.closePath(); c.fill();
  }
  function tongue(c, x0, y0, x1, y1, s) {
    c.lineCap = 'round';
    c.strokeStyle = '#8e2a3a'; c.lineWidth = 4.2 * s; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = '#f06a82'; c.lineWidth = 2.8 * s; c.stroke();
    c.fillStyle = '#f06a82'; c.beginPath(); c.arc(x1, y1, 3.6 * s, 0, TAU); c.fill();
    c.lineCap = 'butt';
  }

  // ── 파리 ──
  function fly(c, x, y, s, t, seed, gold) {
    const bx = x + Math.sin(t * 2.3 + seed) * 5 * s, by = y + Math.cos(t * 3.1 + seed * 1.7) * 4 * s;
    if (gold) {
      const g = c.createRadialGradient(bx, by, 1, bx, by, 26 * s);
      g.addColorStop(0, 'rgba(255,230,120,.7)'); g.addColorStop(1, 'rgba(255,210,80,0)');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 26 * s, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; star(c, bx + Math.cos(a) * 14 * s, by + Math.sin(a * 1.3) * 10 * s, (2 + Math.sin(t * 6 + i)) * s, '#fff6c0'); }
    }
    const k = gold ? 1.6 : 1, flap = Math.sin(t * 60 + seed) * 0.5 + 0.5;
    c.fillStyle = 'rgba(230,245,255,.75)'; c.strokeStyle = 'rgba(120,140,160,.6)'; c.lineWidth = 0.6 * s;
    c.beginPath(); c.ellipse(bx - 1.5 * s * k, by - (3 + flap * 2) * s * k, 3.2 * s * k, 1.8 * s * k, -0.6 - flap * 0.4, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(bx + 1.5 * s * k, by - (3 + flap * 2) * s * k, 3.2 * s * k, 1.8 * s * k, 0.6 + flap * 0.4, 0, TAU); c.fill(); c.stroke();
    if (gold) { const g2 = c.createRadialGradient(bx - 1 * s, by - 1 * s, 0.5, bx, by, 4 * s * k); g2.addColorStop(0, '#fff3a0'); g2.addColorStop(1, '#c98a10'); c.fillStyle = g2; }
    else c.fillStyle = '#22262c';
    c.beginPath(); c.ellipse(bx, by, 3 * s * k, 2.2 * s * k, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(bx + 2.8 * s * k, by - 0.4 * s * k, 1.6 * s * k, 0, TAU); c.fill();
    c.fillStyle = gold ? '#7a1a1a' : '#a33'; c.beginPath(); c.arc(bx + 3.4 * s * k, by - 0.8 * s * k, 0.8 * s * k, 0, TAU); c.fill();
    return [bx, by];
  }

  // ── 까마귀 ── mode: 'sit' | 'laugh' | 'fly'
  function crow(c, x, y, s, face, mode, t) {
    s *= 1.6;
    // 어두운 우물 벽에서도 보이게 뒤에 옅은 빛
    const gl = c.createRadialGradient(x, y - 14 * s, 2, x, y - 14 * s, 26 * s);
    gl.addColorStop(0, 'rgba(255,245,220,.35)'); gl.addColorStop(1, 'rgba(255,245,220,0)');
    c.fillStyle = gl; c.beginPath(); c.arc(x, y - 14 * s, 26 * s, 0, TAU); c.fill();
    c.save(); c.translate(x, y); c.scale(s * face, s);
    if (mode !== 'fly') { c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 0, 12, 2.5, 0, 0, TAU); c.fill(); }
    const bob = mode === 'laugh' ? Math.abs(Math.sin(t * 14)) * 3 : 0;
    // 발
    if (mode !== 'fly') { c.strokeStyle = '#3a3a3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-2, -6); c.lineTo(-3, 0); c.moveTo(3, -6); c.lineTo(3, 0); c.stroke(); }
    // 꼬리
    c.fillStyle = '#16181e'; c.beginPath(); c.moveTo(-8, -10); c.lineTo(-20, -6 + bob * 0.3); c.lineTo(-19, -3); c.lineTo(-7, -7); c.fill();
    // 몸
    const g = c.createRadialGradient(-2, -15, 1, 0, -10, 13);
    g.addColorStop(0, '#3a4258'); g.addColorStop(0.6, '#1a1d26'); g.addColorStop(1, '#0c0d12');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, -11, 11, 7.5, -0.15, 0, TAU); c.fill();
    // 날개
    if (mode === 'fly') {
      const f = Math.sin(t * 18);
      c.fillStyle = '#20232e'; c.beginPath(); c.moveTo(-4, -14); c.quadraticCurveTo(-2, -30 * f - 6, 8, -26 * f - 8); c.quadraticCurveTo(4, -16, 4, -12); c.fill();
    } else { c.fillStyle = '#20232e'; c.beginPath(); c.ellipse(-3, -11, 8, 4.5, -0.25, 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,140,200,.35)'; c.lineWidth = 0.8; c.stroke(); }
    // 머리
    c.save(); c.translate(8, -19 - bob);
    c.fillStyle = '#1a1d26'; c.beginPath(); c.arc(0, 0, 6.2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(140,160,220,.3)'; c.beginPath(); c.arc(-1.5, -2.5, 2.4, 0, TAU); c.fill();
    const open = mode === 'laugh' ? 0.35 + 0.35 * Math.abs(Math.sin(t * 14)) : 0.04;
    c.fillStyle = '#5a5a60';
    c.beginPath(); c.moveTo(4, -1.5); c.lineTo(14, -0.5 - open * 4); c.lineTo(4.5, 1); c.fill();
    c.fillStyle = '#3e3e44';
    c.beginPath(); c.moveTo(4.5, 1); c.lineTo(12, 1.5 + open * 6); c.lineTo(4, 2.5); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(2, -1.8, 1.8, 0, TAU); c.fill();
    c.fillStyle = '#000'; c.beginPath(); c.arc(2.5, -1.8, 1, 0, TAU); c.fill();
    c.restore();
    c.restore();
  }

  // 힘 게이지: 개구리 머리 위 호
  function gauge(c, x, y, s, v) {
    const r = 17 * s;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(20,30,60,.55)'; c.lineWidth = 6 * s; c.beginPath(); c.arc(x, y, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.strokeStyle = v >= 0.99 ? '#ff5a3a' : mix('#ffe066', '#ff8a2a', v); c.lineWidth = 3.6 * s;
    c.beginPath(); c.arc(x, y, r, Math.PI * 1.15, Math.PI * (1.15 + 0.7 * v)); c.stroke();
    c.lineCap = 'butt';
  }


  // ════════ 하늘 12구간(13~24) 발판 ════════
  function rainbowSlab(c, x, y, w, h, s, t) {
    const cols = ['#ff5a5a', '#ff9f43', '#ffe066', '#6ad56a', '#4db4ff', '#8a6cff'];
    c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, x + 3 * s, y + 5 * s, w, h, h * 0.5); c.fill();
    c.save(); rr(c, x, y, w, h, h * 0.5); c.clip();
    for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.fillRect(x, y + i * h / 6, w, h / 6 + 1); }
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    const sh = ((t * 0.35) % 1.6 - 0.3) * w;            // 미끄러운 빛이 흐른다
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(x + sh, y); c.lineTo(x + sh + 16 * s, y); c.lineTo(x + sh + 4 * s, y + h); c.lineTo(x + sh - 12 * s, y + h); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(80,60,120,.55)'; c.lineWidth = 1.4 * s; rr(c, x, y, w, h, h * 0.5); c.stroke();
  }
  function kite(c, x, y, w, h, s, t, seed) {         // 방패연: 네모에 가운데 구멍, 머리띠, 꼬리
    const kh = h + 44 * s, cols = [['#e8413c', '#1f4fb0'], ['#ffcc33', '#2a8a4a'], ['#3a7be0', '#e8413c']][seed % 3];
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1 * s;
    c.beginPath(); c.moveTo(x + w * 0.5, y + kh * 0.6); c.quadraticCurveTo(x + w * 0.5 + 40 * s, y + kh + 160 * s, x + w * 0.3, y + kh + 420 * s); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 4 * s, y + 5 * s, w, kh);
    c.fillStyle = '#fbf6ea'; c.fillRect(x, y, w, kh);
    c.fillStyle = cols[0]; c.fillRect(x, y, w, 12 * s);
    c.fillStyle = cols[1]; c.beginPath(); c.moveTo(x, y + kh); c.lineTo(x + w * 0.5, y + kh * 0.62); c.lineTo(x + w, y + kh); c.fill();
    c.strokeStyle = 'rgba(90,60,30,.7)'; c.lineWidth = 1.4 * s;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + kh); c.moveTo(x + w, y); c.lineTo(x, y + kh); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + kh); c.stroke();
    c.fillStyle = '#9fd0ff'; c.beginPath(); c.arc(x + w / 2, y + kh * 0.48, Math.min(w, kh) * 0.16, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 1.6 * s; c.strokeRect(x, y, w, kh);
    for (let k = 0; k < 2; k++) {
      c.strokeStyle = cols[k]; c.lineWidth = 3 * s; c.beginPath();
      const bx = x + (k ? w - 4 * s : 4 * s), by = y + kh;
      c.moveTo(bx, by);
      for (let i = 1; i <= 8; i++) c.lineTo(bx + Math.sin(t * 4 + i * 0.7 + k) * 6 * s, by + i * 9 * s);
      c.stroke();
    }
  }
  function isle(c, x, y, w, h, s, seed) {             // 떠 있는 섬
    const r = rng(seed);
    c.fillStyle = grad(c, y, y + h + 60 * s, '#8a7a66', '#3e342c');
    c.beginPath(); c.moveTo(x, y + 6 * s);
    c.lineTo(x + w, y + 6 * s); c.lineTo(x + w - 10 * s, y + h * 0.8);
    c.lineTo(x + w * 0.62, y + h + 50 * s); c.lineTo(x + w * 0.45, y + h + 30 * s); c.lineTo(x + w * 0.3, y + h + 56 * s); c.lineTo(x + 10 * s, y + h * 0.7); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.2 * s; c.stroke();
    c.strokeStyle = '#5a4a2e'; c.lineWidth = 1.4 * s;
    for (let i = 0; i < 4; i++) { const rx = x + w * (0.2 + r() * 0.6); c.beginPath(); c.moveTo(rx, y + h); c.quadraticCurveTo(rx + (r() - 0.5) * 20 * s, y + h + 30 * s, rx + (r() - 0.5) * 10 * s, y + h + (40 + r() * 30) * s); c.stroke(); }
    c.fillStyle = grad(c, y - 4 * s, y + 12 * s, '#9be06a', '#4e9a3a');
    c.beginPath(); c.moveTo(x - 3 * s, y + 10 * s);
    for (let i = 0; i <= 10; i++) c.lineTo(x - 3 * s + (w + 6 * s) * i / 10, y - (1 + r() * 4) * s);
    c.lineTo(x + w + 3 * s, y + 12 * s); c.closePath(); c.fill();
    c.fillStyle = '#ff8fb0'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + w * (0.2 + r() * 0.6), y - 1 * s, 2.2 * s, 0, TAU); c.fill(); }
  }
  function driftCloud(c, x, y, w, h, s, t, seed, push) {
    cloudPlat(c, x, y, w, h, s, t, seed, '#f4fbff', '#a9cbe6', 1);
    const dir = push > 0 ? 1 : -1;
    c.strokeStyle = 'rgba(120,170,220,.7)'; c.lineWidth = 2 * s; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.9 + i / 3) % 1), px = x + (dir > 0 ? ph : 1 - ph) * w, py = y + h * (0.3 + i * 0.2);
      const A = c.globalAlpha; c.globalAlpha = A * Math.max(0, 1 - Math.abs(ph - 0.5) * 1.6);
      c.beginPath(); c.moveTo(px - dir * 16 * s, py); c.lineTo(px, py); c.lineTo(px - dir * 5 * s, py - 4 * s); c.stroke();
      c.globalAlpha = A;
    }
    c.lineCap = 'butt';
  }
  function starRow(c, x, y, w, h, s, t, alpha) {
    const n = Math.max(2, Math.round(w / (22 * s))), A = c.globalAlpha;
    c.globalAlpha = A * alpha;
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w * 0.7);
    g.addColorStop(0, 'rgba(255,240,150,.45)'); g.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = g; c.fillRect(x - w * 0.2, y - h * 1.5, w * 1.4, h * 4);
    c.fillStyle = 'rgba(255,230,120,.5)'; rr(c, x, y + h * 0.35, w, h * 0.45, h * 0.2); c.fill();
    for (let i = 0; i < n; i++) star(c, x + (i + 0.5) * w / n, y + h * 0.45, h * 0.62, i % 2 ? '#fff4b0' : '#ffd84a');
    c.globalAlpha = A;
  }
  function aurora(c, x, y, w, h, s, t) {
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(90,255,180,.85)'); g.addColorStop(0.5, 'rgba(120,200,255,.9)'); g.addColorStop(1, 'rgba(200,120,255,.85)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y);
    for (let i = 0; i <= 12; i++) c.lineTo(x + w * i / 12, y + Math.sin(t * 2 + i * 0.8) * 1.5 * s);
    for (let i = 12; i >= 0; i--) c.lineTo(x + w * i / 12, y + h + Math.sin(t * 2 + i * 0.8 + 1) * 3 * s);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + w * 0.1, y + 1.5 * s, w * 0.5, 1.8 * s);
    const lg = c.createLinearGradient(0, y + h, 0, y + h + 60 * s); lg.addColorStop(0, 'rgba(120,255,200,.3)'); lg.addColorStop(1, 'rgba(120,255,200,0)');
    c.fillStyle = lg; c.fillRect(x, y + h, w, 60 * s);
  }
  function magpieBridge(c, x, y, w, h, s, t) {        // 오작교: 까치들이 날개를 펴고 이어 선 다리
    const n = Math.max(2, Math.round(w / (26 * s)));
    // 밤하늘에 묻히지 않게: 은빛 다리 띠와 은은한 빛
    const gl = c.createLinearGradient(0, y - 10 * s, 0, y + h + 14 * s);
    gl.addColorStop(0, 'rgba(190,210,255,0)'); gl.addColorStop(0.5, 'rgba(190,210,255,.45)'); gl.addColorStop(1, 'rgba(190,210,255,0)');
    c.fillStyle = gl; rr(c, x - 6 * s, y - 10 * s, w + 12 * s, h + 24 * s, 12 * s); c.fill();
    c.fillStyle = 'rgba(220,230,255,.55)'; rr(c, x, y + h * 0.55, w, 4 * s, 2 * s); c.fill();
    for (let i = 0; i < n; i++) {
      const bx = x + (i + 0.5) * w / n, by = y + h * 0.45 + Math.sin(t * 5 + i) * 1.2 * s, k = w / n / (26 * s);
      c.strokeStyle = 'rgba(180,205,255,.9)'; c.lineWidth = 2.2 * s;
      c.beginPath(); c.moveTo(bx - 15 * k * s, by - 2 * s); c.quadraticCurveTo(bx, by - 11 * s, bx + 15 * k * s, by - 2 * s); c.stroke();
      c.fillStyle = '#1b2233';
      c.beginPath(); c.moveTo(bx - 15 * k * s, by - 2 * s); c.quadraticCurveTo(bx, by - 11 * s, bx + 15 * k * s, by - 2 * s); c.quadraticCurveTo(bx, by + 2 * s, bx - 15 * k * s, by - 2 * s); c.fill();
      c.fillStyle = '#3a5aa8'; c.beginPath(); c.ellipse(bx + 6 * s, by - 4 * s, 5 * s, 1.6 * s, -0.2, 0, TAU); c.fill();
      c.fillStyle = '#f4f4f0'; c.beginPath(); c.ellipse(bx, by + 2 * s, 6 * s, 4 * s, 0, 0, TAU); c.fill();
      c.fillStyle = '#10141f'; c.beginPath(); c.arc(bx + (i % 2 ? 7 : -7) * s, by - 1 * s, 3.4 * s, 0, TAU); c.fill();
    }
  }
  function nebula(c, x, y, w, h, s, t, seed, alpha) {  // 별빛 돌
    const r = rng(seed), A = c.globalAlpha;
    c.globalAlpha = A * alpha;
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w * 0.8);
    g.addColorStop(0, 'rgba(170,140,255,.4)'); g.addColorStop(1, 'rgba(170,140,255,0)');
    c.fillStyle = g; c.fillRect(x - w * 0.3, y - h * 2, w * 1.6, h * 5);
    c.fillStyle = grad(c, y, y + h, '#b7a6ff', '#4a3a9a'); rr(c, x, y, w, h, h * 0.45); c.fill();
    c.strokeStyle = 'rgba(230,220,255,.8)'; c.lineWidth = 1.2 * s; rr(c, x, y, w, h, h * 0.45); c.stroke();
    for (let i = 0; i < w / (10 * s); i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i * 1.7)); c.fillStyle = 'rgba(255,255,255,' + a + ')'; c.fillRect(x + r() * w, y + r() * h, 1.8 * s, 1.8 * s); }
    c.globalAlpha = A;
  }
  function moonSurface(c, x, y, w, h, s, t, fx, p) {   // 달 꼭대기: 윗면만 평평하고 아래는 둥근 달 조각 + 방아 찧는 옥토끼
    const cx = x + w / 2, D = 150 * s;
    const gl = c.createRadialGradient(cx, y + D * 0.35, 10 * s, cx, y + D * 0.35, w * 0.95);
    gl.addColorStop(0, 'rgba(255,240,190,.32)'); gl.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = gl; c.beginPath(); c.arc(cx, y + D * 0.35, w * 0.95, 0, TAU); c.fill();
    const body = () => {
      c.beginPath(); c.moveTo(x - 5 * s, y + 5 * s);
      c.quadraticCurveTo(cx, y - 8 * s, x + w + 5 * s, y + 5 * s);
      c.bezierCurveTo(x + w + 8 * s, y + D * 0.55, x + w * 0.74, y + D, cx, y + D);
      c.bezierCurveTo(x + w * 0.26, y + D, x - 8 * s, y + D * 0.55, x - 5 * s, y + 5 * s);
      c.closePath();
    };
    // 아래로 떨어지는 그림자(뒤 큰 달 위에)
    c.save(); c.translate(6 * s, 10 * s); body(); c.fillStyle = 'rgba(40,30,60,.28)'; c.fill(); c.restore();
    body();
    const g = c.createRadialGradient(x + w * 0.32, y + 6 * s, 6 * s, cx, y + D * 0.35, w * 0.78);
    g.addColorStop(0, '#f3ecd4'); g.addColorStop(0.5, '#d2c6a4'); g.addColorStop(1, '#8a7f68');
    c.save(); c.fillStyle = g; c.fill(); c.clip();
    // 분화구: 안쪽 그늘 + 아래 오른쪽 테두리 빛
    [[0.18, 0.32, 16], [0.52, 0.2, 10], [0.78, 0.42, 20], [0.36, 0.62, 13], [0.62, 0.74, 9], [0.12, 0.7, 7], [0.88, 0.2, 6]].forEach(q => {
      const qx = x + w * q[0], qy = y + D * q[1], r = q[2] * s;
      c.fillStyle = 'rgba(110,98,72,.38)'; c.beginPath(); c.ellipse(qx, qy, r, r * 0.55, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(80,70,52,.28)'; c.beginPath(); c.ellipse(qx - r * 0.12, qy - r * 0.08, r * 0.8, r * 0.4, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,250,228,.55)'; c.lineWidth = 1.4 * s; c.beginPath(); c.ellipse(qx, qy, r, r * 0.55, 0, 0.15 * Math.PI, 0.95 * Math.PI); c.stroke();
    });
    const sh = c.createLinearGradient(0, y + D * 0.35, 0, y + D);
    sh.addColorStop(0, 'rgba(40,32,70,0)'); sh.addColorStop(1, 'rgba(40,32,70,.5)');
    c.fillStyle = sh; c.fillRect(x - 10 * s, y, w + 20 * s, D + 4 * s);
    c.restore();
    body(); c.strokeStyle = 'rgba(90,80,60,.55)'; c.lineWidth = 1.4 * s; c.stroke();
    c.strokeStyle = 'rgba(255,252,236,.95)'; c.lineWidth = 2.2 * s;
    c.beginPath(); c.moveTo(x - 3 * s, y + 4 * s); c.quadraticCurveTo(cx, y - 7 * s, x + w + 3 * s, y + 4 * s); c.stroke();
    for (let i = 0; i < 6; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.7 + i * 2.3)); star(c, x + w * (0.1 + i * 0.16), y - (6 + (i % 3) * 7) * s, 1.6 * s * a, 'rgba(255,248,210,' + a + ')'); }
  }
  // 옥토끼(img/rabbit.webp, 제미나이 그림). 평소엔 방아를 찧고, 개구리가 내려서면 돌아보고 깡충깡충 뛰며 하트를 띄운다
  const RSPR = window.RABBIT_SPR, RIMG = new Image();
  if (RSPR) RIMG.src = RSPR.src;
  function moonRabbit(c, rx, ry, s, t, fx, wx) {
    const e = fx && fx.endT != null ? fx.endT : -1;
    const face = e >= 0 && fx.endX != null ? (fx.endX < wx ? -1 : 1) : 1;   // 평소엔 오른쪽 절구를 보고, 끝나면 개구리 쪽
    let fr = Math.sin(t * 4.2) > 0 ? 'up' : 'down', hop = 0;
    if (e >= 0) {
      if (e < 0.3) fr = 'happy';
      else if (e < 2.6) { const k = (e - 0.3) * 6.5; hop = Math.abs(Math.sin(k)) * 16 * s; fr = hop > 4 * s ? (Math.floor(k / Math.PI) % 2 ? 'jump2' : 'jump') : 'happy'; }
      else fr = Math.floor(e * 2.4) % 2 ? 'wave' : 'wave2';
    }
    const my = ry, ok = RSPR && RIMG.complete && RIMG.naturalWidth;
    c.fillStyle = 'rgba(60,50,40,.25)'; c.beginPath(); c.ellipse(rx, my, 13 * s * (1 - hop / (60 * s)), 3 * s, 0, 0, TAU); c.fill();
    if (ok) {
      const F = RSPR.frames[fr] || RSPR.frames.happy, k = 58 * s / RSPR.h;
      c.save(); c.translate(rx, my - hop); c.scale(face * (RSPR.face || 1), 1);
      c.drawImage(RIMG, F[0], F[1], F[2], F[3], -F[4] * k, -F[3] * k, F[2] * k, F[3] * k);
      c.restore();
      const m = RSPR.frames.mortar, mk = 24 * s / m[3];                    // 절구는 방망이 머리가 들어가게 토끼보다 앞에
      c.fillStyle = 'rgba(60,50,40,.25)'; c.beginPath(); c.ellipse(rx + 29 * s, my, 11 * s, 2.5 * s, 0, 0, TAU); c.fill();
      c.drawImage(RIMG, m[0], m[1], m[2], m[3], rx + 29 * s - m[2] * mk / 2, my - m[3] * mk + 1 * s, m[2] * mk, m[3] * mk);
    } else {
      const bob = fr === 'up' ? 6 * s : 0, y0 = my - hop;
      c.fillStyle = '#8a6a44'; c.fillRect(rx + 13 * s, my - 18 * s, 22 * s, 18 * s);
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(rx + 24 * s, y0 - 20 * s - bob); c.lineTo(rx + 6 * s, y0 - 46 * s - bob); c.stroke();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(rx, y0 - 14 * s, 11 * s, 14 * s, 0, 0, TAU); c.fill();
      c.beginPath(); c.arc(rx + 2 * s, y0 - 32 * s, 8 * s, 0, TAU); c.fill();
    }
    if (e > 0.3) for (let i = 0; i < 4; i++) {          // 하트가 하나씩 떠오른다
      const k = (e - 0.3 - i * 0.55); if (k < 0 || k > 1.6) continue;
      const a = Math.min(1, k * 4) * Math.max(0, 1 - k / 1.6), hx = rx + (i % 2 ? 10 : -8) * s + Math.sin(k * 5 + i) * 5 * s, hy = my - 64 * s - hop - k * 40 * s, r = (5 + k * 2) * s;
      c.globalAlpha = a; c.fillStyle = '#ff6f91';
      c.beginPath(); c.moveTo(hx, hy + r * 0.9); c.bezierCurveTo(hx - r * 1.6, hy - r * 0.2, hx - r * 0.7, hy - r * 1.4, hx, hy - r * 0.5);
      c.bezierCurveTo(hx + r * 0.7, hy - r * 1.4, hx + r * 1.6, hy - r * 0.2, hx, hy + r * 0.9); c.fill();
      c.globalAlpha = 1;
    }
  }
  function hatch(c, V, p, x, y, w, h, s, t) {        // 뚜껑문: 가운데서 갈라져 위로 열리는 두 짝
    const sky = p.z >= 11, a = (p.open || 0) * 1.25, half = w / 2;
    for (let side = 0; side < 2; side++) {
      c.save();
      c.translate(side ? x + w : x, y);
      c.rotate(side ? a : -a);
      const dx = side ? -half : 0;
      if (sky) cloudPlat(c, dx, 0, half, h, s, t, p.id * 7 + side, '#ffffff', '#c6cfe8', 1);
      else {
        woodBeam(c, dx, 0, half, h * 0.8, s, p.id * 7 + side, '#b98a52', '#6e4a26');
        c.fillStyle = '#4a4e56'; c.fillRect(dx + (side ? half - 12 * s : 4 * s), 2 * s, 8 * s, h * 0.8 - 4 * s);
        c.fillStyle = '#c9a060'; c.beginPath(); c.arc(dx + (side ? 8 * s : half - 8 * s), h * 0.4, 2.4 * s, 0, TAU); c.fill();
      }
      c.restore();
    }
  }
  function bird(c, x, y, s, t, face) {               // 날아가는 까치
    const f = Math.sin(t * 22);
    c.save(); c.translate(x, y); c.scale(face * s, s);
    c.fillStyle = '#1b2233';
    c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(0, -10 * f - 2, 8, 0); c.quadraticCurveTo(0, 2, -8, 0); c.fill();
    c.fillStyle = '#f4f4f0'; c.beginPath(); c.ellipse(0, 1.5, 4, 2.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#10141f'; c.beginPath(); c.arc(5, -1, 2.3, 0, TAU); c.fill();
    c.restore();
  }
  function bolt(c, V, k, bx) {                        // 번개
    c.fillStyle = 'rgba(230,235,255,' + (0.35 * k) + ')'; c.fillRect(0, 0, V.cw, V.ch);
    if (k < 0.5) return;
    const r = rng(Math.floor(bx * 13));
    c.strokeStyle = 'rgba(255,255,230,' + k + ')'; c.lineWidth = 3 * V.s; c.shadowColor = '#fff'; c.shadowBlur = 12;
    let x = V.X(bx), y = 0; c.beginPath(); c.moveTo(x, y);
    while (y < V.ch * 0.6) { x += (r() - 0.5) * 60 * V.s; y += (20 + r() * 40) * V.s; c.lineTo(x, y); }
    c.stroke(); c.shadowBlur = 0;
  }
  function stars12(c, V, t, lit) {                    // 달 앞 쉼터 위 별 열둘
    const z = L.zoneTop[23], s = V.s;
    const P12 = [[20, 1010], [40, 1045], [62, 1020], [85, 1060], [105, 1030], [120, 1075], [140, 1040], [158, 1085], [175, 1050], [190, 1015], [205, 1065], [212, 1100]];
    const y0 = V.Y(z + 1000);
    if (y0 < -200 || y0 - 150 * s > V.ch) return;
    c.strokeStyle = 'rgba(200,210,255,.25)'; c.lineWidth = 1.2 * s; c.beginPath();
    P12.forEach((q, i) => { const px = V.X(q[0]), py = V.Y(z + q[1]); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke();
    P12.forEach((q, i) => {
      const px = V.X(q[0]), py = V.Y(z + q[1]), on = i < lit;
      if (on) { const g = c.createRadialGradient(px, py, 1, px, py, 16 * s); g.addColorStop(0, 'rgba(255,230,140,' + (0.6 + 0.2 * Math.sin(t * 4 + i)) + ')'); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, 16 * s, 0, TAU); c.fill(); }
      star(c, px, py, (on ? 6 : 4) * s, on ? '#ffe27a' : 'rgba(200,205,230,.45)');
    });
  }


  // ════════ 하늘 12구간 뒷배경 ════════
  function stormBack(c, V, t) {                      // 13 폭풍 구름: 먹구름 층과 빗줄기
    const z = L.zoneTop[12], s = V.s;
    c.fillStyle = 'rgba(40,44,70,.35)'; c.fillRect(0, 0, V.cw, V.ch);
    for (let layer = 0; layer < 3; layer++) {
      const r = rng(301 + layer), pf = 0.5 + layer * 0.15;
      for (let i = 0; i < 7; i++) {
        const wy = z + r() * 1300, x = r() * V.cw + Math.sin(t * 0.2 + i) * 20 * s, y = PY(V, wy, z, pf), rad = (50 + r() * 40) * s;
        if (y < -100 || y > V.ch + 100) continue;
        cloudBlob(c, x, y, rad, mix('#5a6080', '#8a90aa', layer / 2), mix('#343a58', '#5a6080', layer / 2));
      }
    }
    c.strokeStyle = 'rgba(190,200,230,.35)'; c.lineWidth = 1.2 * s;
    const r = rng(333);
    for (let i = 0; i < 60; i++) { const x = r() * V.cw, y = ((r() * V.ch + t * 900 * s) % V.ch); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6 * s, y + 22 * s); c.stroke(); }
  }
  function rainbowBack(c, V, t) {                    // 14 무지개: 하늘에 걸린 큰 무지개
    const z = L.zoneTop[13], s = V.s, cx = V.cw * 0.5, cy = PY(V, z + 200, z, 0.35), R = Math.max(V.cw, 700 * s) * 0.75;
    const cols = ['rgba(255,90,90,.35)', 'rgba(255,160,70,.35)', 'rgba(255,224,102,.35)', 'rgba(106,213,106,.35)', 'rgba(77,180,255,.35)', 'rgba(138,108,255,.35)'];
    c.lineWidth = 22 * s;
    cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, R - i * 22 * s, Math.PI, 0); c.stroke(); });
  }
  function kiteBack(c, V, t) {                       // 15 연날리기: 멀리 떠 있는 연들
    const z = L.zoneTop[14], s = V.s, r = rng(351);
    for (let i = 0; i < 9; i++) {
      const wy = z + r() * 1300, x = r() * V.cw + Math.sin(t * 0.7 + i) * 12 * s, y = PY(V, wy, z, 0.55), k = (0.35 + r() * 0.3) * s;
      if (y < -60 || y > V.ch + 60) continue;
      c.save(); c.translate(x, y); c.rotate(Math.sin(t + i) * 0.15);
      c.fillStyle = ['rgba(232,65,60,.55)', 'rgba(255,204,51,.55)', 'rgba(58,123,224,.55)'][i % 3]; c.fillRect(-22 * k, -28 * k, 44 * k, 56 * k);
      c.fillStyle = 'rgba(200,230,255,.6)'; c.beginPath(); c.arc(0, 0, 8 * k, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 28 * k); c.lineTo(20 * k, 200 * k); c.stroke();
      c.restore();
    }
  }
  function isleBack(c, V, t) {                       // 16~18 하늘 섬: 멀리 뜬 섬들
    const z = L.zoneTop[15], s = V.s, r = rng(361);
    for (let i = 0; i < 8; i++) {
      const wy = z + r() * 3400, x = r() * V.cw, y = PY(V, wy, z, 0.45) + Math.sin(t * 0.5 + i) * 6 * s, w = (60 + r() * 90) * s;
      if (y < -120 || y > V.ch + 60) continue;
      c.fillStyle = 'rgba(110,120,150,.45)'; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w * 0.1, y + w * 0.6); c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,170,110,.5)'; c.fillRect(x - w / 2, y - 4 * s, w, 5 * s);
    }
  }
  function auroraBack(c, V, t) {                     // 19 오로라: 흔들리는 빛 커튼
    const s = V.s;
    for (let k = 0; k < 3; k++) {
      const y0 = V.ch * (0.1 + k * 0.12), hgt = V.ch * 0.45;
      const g = c.createLinearGradient(0, y0, 0, y0 + hgt);
      g.addColorStop(0, 'rgba(120,255,190,0)'); g.addColorStop(0.3, ['rgba(120,255,190,.25)', 'rgba(140,200,255,.22)', 'rgba(200,140,255,.2)'][k]); g.addColorStop(1, 'rgba(120,255,190,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, y0);
      for (let x = 0; x <= V.cw; x += 20) c.lineTo(x, y0 + Math.sin(x * 0.01 + t * 0.6 + k) * 40 * s);
      for (let x = V.cw; x >= 0; x -= 20) c.lineTo(x, y0 + hgt + Math.sin(x * 0.012 + t * 0.5 + k * 2) * 50 * s);
      c.fill();
    }
  }
  function milkyWay(c, V, t) {                       // 21~24 은하수: 비스듬한 별빛 띠 + 별똥별
    const s = V.s;
    c.save(); c.translate(V.cw / 2, V.ch / 2); c.rotate(-0.5);
    const g = c.createLinearGradient(0, -120 * s, 0, 120 * s);
    g.addColorStop(0, 'rgba(160,140,255,0)'); g.addColorStop(0.5, 'rgba(210,200,255,.28)'); g.addColorStop(1, 'rgba(160,140,255,0)');
    c.fillStyle = g; c.fillRect(-V.cw, -120 * s, V.cw * 2, 240 * s);
    const r = rng(401); c.fillStyle = '#fff';
    for (let i = 0; i < 220; i++) { const x = (r() - 0.5) * V.cw * 2, y = (r() + r() + r() - 1.5) * 90 * s; c.globalAlpha = (0.3 + 0.7 * r()) * (0.6 + 0.4 * Math.sin(t * 2 + i)); c.fillRect(x, y, 1.4 * s, 1.4 * s); }
    c.globalAlpha = 1; c.restore();
    const ph = (t * 0.25) % 1;                        // 별똥별
    if (ph < 0.25) { const k = ph / 0.25, sx = V.cw * (0.9 - k * 0.7), sy = V.ch * (0.1 + k * 0.3);
      c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 60 * s, sy - 26 * s); c.stroke(); }
  }
  let lastFx = null;                                 // 옥토끼가 개구리 착지를 알도록 발판 그릴 때 받은 FX 를 기억
  function bigMoon(c, V, t) {                        // 24 달: 발판 달 뒤로 큰 달이 떠 있다
    const z = L.zoneTop[23], s = V.s, cx = V.X(L.W * 0.62), cy = V.Y(z + 1560) + 150 * s, R = 330 * s;
    if (cy - R > V.ch || cy + R < 0) return;
    const g = c.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.5);
    g.addColorStop(0, 'rgba(255,245,200,.35)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.5, 0, TAU); c.fill();
    const mg = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    mg.addColorStop(0, '#fffbe8'); mg.addColorStop(1, '#e6d9a8');
    c.fillStyle = mg; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    c.fillStyle = 'rgba(180,165,110,.3)';
    [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.12], [-0.05, 0.35, 0.1], [0.35, -0.35, 0.08]].forEach(q => { c.beginPath(); c.arc(cx + q[0] * R, cy + q[1] * R, q[2] * R, 0, TAU); c.fill(); });
    // 꼭대기에서 방아 찧는 옥토끼(개구리가 마지막에 여기로 날아온다). 달 위치는 game.js MOON 과 같다
    moonRabbit(c, cx + 12 * s, cy - R + 4 * s, s, t, lastFx, L.W * 0.62 + 12);
  }


  // ── 배터리(로봇개가 먹는 것) ── 파리 자리에 둥둥 뜬다
  function battery(c, x, y, s, t, seed, gold) {
    const bx = x + Math.sin(t * 1.8 + seed) * 3 * s, by = y + Math.cos(t * 2.4 + seed * 1.3) * 4 * s, k = gold ? 2.3 : 1.5;
    const w = 9 * s * k, h = 15 * s * k, tilt = Math.sin(t * 1.5 + seed) * 0.18;
    if (gold) {
      const g = c.createRadialGradient(bx, by, 1, bx, by, 30 * s);
      g.addColorStop(0, 'rgba(255,230,120,.7)'); g.addColorStop(1, 'rgba(255,210,80,0)');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 30 * s, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; star(c, bx + Math.cos(a) * 16 * s, by + Math.sin(a * 1.3) * 12 * s, (2 + Math.sin(t * 6 + i)) * s, '#fff6c0'); }
    } else {
      const g = c.createRadialGradient(bx, by, 1, bx, by, 22 * s);
      g.addColorStop(0, 'rgba(140,255,170,.55)'); g.addColorStop(1, 'rgba(140,255,170,0)');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 22 * s, 0, TAU); c.fill();
    }
    c.save(); c.translate(bx, by); c.rotate(tilt);
    // 몸통
    const bg = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    if (gold) { bg.addColorStop(0, '#b8860b'); bg.addColorStop(0.4, '#ffe27a'); bg.addColorStop(1, '#a8740a'); }
    else { bg.addColorStop(0, '#6a7384'); bg.addColorStop(0.4, '#c9d2e0'); bg.addColorStop(1, '#4a5260'); }
    c.fillStyle = bg; rr(c, -w / 2, -h / 2, w, h, 2.2 * s * k); c.fill();
    c.fillStyle = gold ? '#8a5a10' : '#20242c'; rr(c, -w * 0.22, -h / 2 - 2.6 * s * k, w * 0.44, 3 * s * k, 1 * s); c.fill();   // 꼭지
    // 충전 칸: 아래부터 차오르며 깜빡
    const lv = 3, on = gold ? 3 : 1 + Math.floor((t * 2 + seed) % 3);
    for (let i = 0; i < lv; i++) {
      c.fillStyle = i < on ? (gold ? '#fff3b0' : '#6dff8a') : 'rgba(0,0,0,.35)';
      rr(c, -w / 2 + 1.8 * s * k, h / 2 - (i + 1) * (h - 3.6 * s * k) / lv - 0.6 * s * k, w - 3.6 * s * k, (h - 3.6 * s * k) / lv - 1.2 * s * k, 0.8 * s); c.fill();
    }
    // 번개 표시
    c.fillStyle = gold ? '#7a4a00' : '#ffffff'; c.globalAlpha = 0.85;
    c.beginPath(); c.moveTo(1 * s * k, -4.5 * s * k); c.lineTo(-2.2 * s * k, 0.5 * s * k); c.lineTo(0, 0.5 * s * k); c.lineTo(-1 * s * k, 4.5 * s * k); c.lineTo(2.2 * s * k, -0.6 * s * k); c.lineTo(0, -0.6 * s * k); c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1 * s; rr(c, -w / 2, -h / 2, w, h, 2.2 * s * k); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-w / 2 + 1.2 * s, -h / 2 + 1.5 * s, 1.4 * s * k, h - 3 * s);
    c.restore();
    return [bx, by];
  }

  window.ART = { setFX: v => { lastFx = v; }, battery, SUN, bird, bolt, stars12, view, sky, well, scenery, sideShade, plat, lanterns, frog, tongue, fly, crow, gauge, star, mix, rng, skyAt, WELL_TOP };
})();
