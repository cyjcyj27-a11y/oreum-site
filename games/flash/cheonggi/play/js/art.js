// 청기백기 — 그림(운동회 운동장 · 아이 · 구령대 선생님). 빛은 왼쪽 위에서.
(function () {
  'use strict';

  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, k) {
    const A = hex(a), B = hex(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')';
  }
  const dk = (c, k) => mix(c, '#000000', k);
  const lt = (c, k) => mix(c, '#ffffff', k);
  const lerp = (a, b, k) => a + (b - a) * k;
  const D2R = Math.PI / 180;

  // 고정 난수(배경이 매번 똑같이 그려지게)
  let seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ---------------------------------------------------------------- 배치
  function layout(W, H, touch) {
    const portrait = H > W * 1.05;
    const L = { W, H, portrait };
    L.hy = portrait ? H * 0.40 : H * 0.47;                 // 지평선(운동장 끝)
    const bottomRoom = touch ? (portrait ? 226 : 40) : 46;
    L.fy = H - bottomRoom;                                  // 아이 발끝
    const topRoom = portrait ? 172 : 62 + Math.max(52, Math.min(124, H * 0.16)); // 상단바 + 말풍선 자리
    L.u = Math.max(0.6, Math.min((L.fy - topRoom) / 178, W / (portrait ? 150 : 175)));
    L.cx = W / 2;
    L.tx = portrait ? W * 0.5 : W * 0.80;                   // 선생님(구령대) — 세로 화면에선 아이 머리 위 가운데
    L.tu = L.u * (portrait ? 0.34 : 0.40);
    L.ty = L.hy + L.tu * 12;                                // 구령대 윗면
    return L;
  }

  // ---------------------------------------------------------------- 배경(한 번 그려 두기)
  function drawBackground(g, L) {
    const { W, H, hy } = L;
    seed = 11;
    // 하늘: 아침 하늘, 위는 짙은 파랑 아래는 옅은 하늘색
    let gr = g.createLinearGradient(0, 0, 0, hy);
    gr.addColorStop(0, '#5aa8e6'); gr.addColorStop(0.6, '#9fd0f2'); gr.addColorStop(1, '#dff0f6');
    g.fillStyle = gr; g.fillRect(0, 0, W, hy + 2);
    // 해 번짐
    gr = g.createRadialGradient(W * 0.12, hy * 0.18, 0, W * 0.12, hy * 0.18, W * 0.45);
    gr.addColorStop(0, 'rgba(255,248,215,.85)'); gr.addColorStop(0.25, 'rgba(255,244,210,.25)'); gr.addColorStop(1, 'rgba(255,244,210,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, hy);

    // 먼 산(흐리게)
    g.fillStyle = '#a9c9d6';
    g.beginPath(); g.moveTo(0, hy - H * 0.06);
    for (let x = 0; x <= W; x += W / 12) g.lineTo(x, hy - H * (0.07 + 0.05 * Math.sin(x / W * 5.2 + 1) + 0.02 * Math.sin(x / W * 13)));
    g.lineTo(W, hy); g.lineTo(0, hy); g.fill();

    const s = L.u;
    // 학교 건물(가운데 뒤, 채도 낮게)
    const bw = Math.min(W * 0.62, s * 260), bh = s * 52, bx = W * 0.5 - bw / 2 - W * 0.06, by = hy - bh - s * 4;
    gr = g.createLinearGradient(bx, 0, bx + bw, 0);
    gr.addColorStop(0, '#efe6d6'); gr.addColorStop(1, '#d9cfbd');
    g.fillStyle = gr; g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#c8b9a2'; g.fillRect(bx, by, bw, s * 3);           // 옥상 턱
    g.fillStyle = '#b9a88f'; g.fillRect(bx, by + bh - s * 2, bw, s * 2);
    // 층 띠 + 창문
    const floors = 3, cols = Math.max(8, Math.floor(bw / (s * 13)));
    for (let f = 0; f < floors; f++) {
      const fy = by + s * 6 + f * (bh - s * 8) / floors;
      g.fillStyle = 'rgba(160,140,115,.35)'; g.fillRect(bx, fy - s * 1.6, bw, s * 0.8);
      for (let c = 0; c < cols; c++) {
        const wx = bx + s * 4 + c * (bw - s * 8) / cols, ww = (bw - s * 8) / cols - s * 3, wh = (bh - s * 8) / floors - s * 5;
        if (c === Math.floor(cols / 2) && f === 0) continue;
        gr = g.createLinearGradient(0, fy, 0, fy + wh);
        gr.addColorStop(0, '#8fb3c9'); gr.addColorStop(1, '#c9e0ea');
        g.fillStyle = gr; g.fillRect(wx, fy, ww, wh);
        g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(wx + ww * 0.1, fy + wh * 0.1, ww * 0.18, wh * 0.8);
        g.fillStyle = '#a89679'; g.fillRect(wx + ww / 2 - s * 0.3, fy, s * 0.6, wh);
      }
    }
    // 시계
    const ckx = bx + bw / 2, cky = by + s * 10;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ckx, cky, s * 4.2, 0, 7); g.fill();
    g.strokeStyle = '#8b7a62'; g.lineWidth = s * 0.8; g.stroke();
    g.strokeStyle = '#444'; g.lineWidth = s * 0.5;
    g.beginPath(); g.moveTo(ckx, cky); g.lineTo(ckx, cky - s * 3); g.moveTo(ckx, cky); g.lineTo(ckx + s * 2.2, cky + s * 0.6); g.stroke();
    // 현관
    g.fillStyle = '#6f7f86'; g.fillRect(ckx - s * 6, by + bh - s * 13, s * 12, s * 11);

    // 나무(건물 양옆, 둥근 잎 뭉치 + 명암)
    function tree(x, y, r) {
      g.fillStyle = '#6b4c33'; g.fillRect(x - r * 0.1, y - r * 0.9, r * 0.2, r * 0.95);
      const blobs = [[0, -1.35, 0.72], [-0.5, -1.0, 0.6], [0.5, -1.05, 0.62], [-0.2, -1.8, 0.55], [0.3, -1.65, 0.5]];
      for (const [bxo, byo, br] of blobs) {
        const X = x + bxo * r, Y = y + byo * r, R = br * r;
        const t = g.createRadialGradient(X - R * 0.4, Y - R * 0.45, R * 0.1, X, Y, R);
        t.addColorStop(0, '#9ccf6c'); t.addColorStop(0.7, '#5f9a44'); t.addColorStop(1, '#447a33');
        g.fillStyle = t; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
      }
    }
    for (let i = 0; i < 7; i++) {
      const x = i < 3 ? bx - s * (8 + i * 17) : bx + bw + s * (8 + (i - 3) * 17);
      if (x < -s * 20 || x > W + s * 20) continue;
      tree(x, hy - s * 3, s * (13 + rnd() * 5));
    }

    // 담장(초록 철망)
    g.fillStyle = '#6e9a74'; g.fillRect(0, hy - s * 9, W, s * 0.8);
    g.strokeStyle = 'rgba(80,120,90,.55)'; g.lineWidth = Math.max(1, s * 0.25);
    for (let x = -s * 4; x < W; x += s * 2.4) {
      g.beginPath(); g.moveTo(x, hy - s * 9); g.lineTo(x + s * 4, hy - s * 0.5); g.stroke();
      g.beginPath(); g.moveTo(x + s * 4, hy - s * 9); g.lineTo(x, hy - s * 0.5); g.stroke();
    }
    g.fillStyle = '#5b7f60';
    for (let x = s * 2; x < W; x += s * 24) g.fillRect(x, hy - s * 10, s * 1.1, s * 10);

    // 땅: 운동장 흙(멀리 옅게, 가까이 짙게)
    gr = g.createLinearGradient(0, hy, 0, H);
    gr.addColorStop(0, '#e2cfa6'); gr.addColorStop(0.35, '#d7bd8c'); gr.addColorStop(1, '#c29f6c');
    g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
    // 흙 알갱이·얼룩
    for (let i = 0; i < 900; i++) {
      const y = hy + Math.pow(rnd(), 0.8) * (H - hy), x = rnd() * W, k = (y - hy) / (H - hy);
      g.fillStyle = rnd() < 0.5 ? 'rgba(120,85,45,' + (0.08 + k * 0.12) + ')' : 'rgba(255,245,220,' + (0.10 + k * 0.1) + ')';
      const r = (0.3 + rnd() * 0.9) * s * (0.25 + k * 0.6);
      g.fillRect(x, y, r * 2, r);
    }
    for (let i = 0; i < 14; i++) {
      const y = hy + (0.1 + rnd() * 0.9) * (H - hy), x = rnd() * W, k = (y - hy) / (H - hy);
      const t = g.createRadialGradient(x, y, 0, x, y, s * 20 * (0.3 + k));
      t.addColorStop(0, 'rgba(150,110,60,.13)'); t.addColorStop(1, 'rgba(150,110,60,0)');
      g.fillStyle = t; g.beginPath(); g.ellipse(x, y, s * 20 * (0.3 + k), s * 6 * (0.3 + k), 0, 0, 7); g.fill();
    }
    // 트랙 흰 선(원근으로 휘게)
    g.strokeStyle = 'rgba(255,255,250,.78)';
    for (let i = 0; i < 4; i++) {
      const k = 0.16 + i * 0.13, y = hy + (H - hy) * k;
      g.lineWidth = Math.max(1, s * (0.35 + k * 1.1));
      g.beginPath(); g.moveTo(-10, y + (H - hy) * 0.05);
      g.quadraticCurveTo(W * 0.5, y - (H - hy) * 0.06, W + 10, y + (H - hy) * 0.05); g.stroke();
    }

    // 천막(왼쪽: 청/백 줄무늬)
    function tent(x, y, w, c1) {
      const h = w * 0.55;
      g.fillStyle = 'rgba(60,40,20,.18)'; g.beginPath(); g.ellipse(x + w / 2, y + 1, w * 0.62, w * 0.07, 0, 0, 7); g.fill();
      g.fillStyle = '#9a9a9a'; g.fillRect(x, y - h, w * 0.025, h); g.fillRect(x + w * 0.975, y - h, w * 0.025, h);
      // 천막 아래 그늘 + 앉은 아이들 머리
      g.fillStyle = 'rgba(40,60,80,.28)'; g.fillRect(x, y - h * 0.62, w, h * 0.62);
      for (let i = 0; i < 6; i++) {
        const hx = x + w * (0.12 + i * 0.15), hh = y - h * 0.22;
        g.fillStyle = '#f0cdb0'; g.beginPath(); g.arc(hx, hh, w * 0.035, 0, 7); g.fill();
        g.fillStyle = '#2b211c'; g.beginPath(); g.arc(hx, hh - w * 0.012, w * 0.036, Math.PI, 0); g.fill();
        g.fillStyle = i % 2 ? '#2d63c8' : '#fff'; g.fillRect(hx - w * 0.036, hh - w * 0.022, w * 0.072, w * 0.012);
      }
      // 지붕
      const n = 8;
      for (let i = 0; i < n; i++) {
        const x0 = x - w * 0.04 + i * w * 1.08 / n, x1 = x0 + w * 1.08 / n;
        g.fillStyle = i % 2 ? '#f5f5f0' : c1;
        g.beginPath(); g.moveTo(x0, y - h * 0.62); g.lineTo(x1, y - h * 0.62);
        g.lineTo(lerp(x1, x + w / 2, 0.55), y - h); g.lineTo(lerp(x0, x + w / 2, 0.55), y - h); g.fill();
        g.fillStyle = i % 2 ? '#e2e2dc' : dk(c1, 0.15);
        g.beginPath(); g.moveTo(x0, y - h * 0.62); g.lineTo(x1, y - h * 0.62); g.lineTo(x1, y - h * 0.55);
        g.quadraticCurveTo((x0 + x1) / 2, y - h * 0.5, x0, y - h * 0.55); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.22)';
      g.beginPath(); g.moveTo(x - w * 0.04, y - h * 0.62); g.lineTo(x + w * 0.3, y - h * 0.62); g.lineTo(x + w * 0.4, y - h); g.lineTo(x + w * 0.27, y - h); g.fill();
    }
    tent(L.portrait ? -s * 30 : W * 0.03, hy + s * 5, s * 52, '#2d63c8');
    if (!L.portrait) tent(W * 0.03 + s * 58, hy + s * 5, s * 44, '#c8412d');

    // 구령대
    const tx = L.tx, ty = L.ty, tu = L.tu;
    const pw = tu * 58, ph = tu * 14;
    g.fillStyle = 'rgba(60,40,20,.22)'; g.beginPath(); g.ellipse(tx, ty + ph + tu, pw * 0.62, tu * 3.4, 0, 0, 7); g.fill();
    gr = g.createLinearGradient(0, ty, 0, ty + ph);
    gr.addColorStop(0, '#d8d3c8'); gr.addColorStop(1, '#b3ab9c');
    g.fillStyle = gr; g.fillRect(tx - pw / 2, ty, pw, ph);
    g.fillStyle = '#ece8df'; g.fillRect(tx - pw / 2 - tu, ty - tu * 1.4, pw + tu * 2, tu * 1.8);
    g.fillStyle = '#9e9586';
    for (let i = 0; i < 3; i++) g.fillRect(tx - tu * 9, ty + ph - tu * (i + 1) * 3.6, tu * 18, tu * 0.7); // 계단 선
    g.fillStyle = '#b8ad97'; g.fillRect(tx - pw / 2, ty + ph - tu * 1.4, pw, tu * 1.4);
  }

  // 만국기(줄에 매단 작은 깃발, 살랑)
  const FLAGC = ['#e2463a', '#f4c23a', '#2d63c8', '#3fae5a', '#ffffff', '#f07a2a', '#8b4fc7', '#e04b8b'];
  function drawBunting(g, L, t) {
    const { W, hy, u } = L;
    const lines = [[-0.05, 0.10, 1.05, 0.20], [-0.05, 0.28, 1.05, 0.08]];
    lines.forEach((ln, li) => {
      const x0 = ln[0] * W, y0 = ln[1] * hy, x1 = ln[2] * W, y1 = ln[3] * hy, sag = hy * 0.16;
      const P = k => [lerp(x0, x1, k), lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag];
      g.strokeStyle = 'rgba(70,60,50,.7)'; g.lineWidth = Math.max(1, u * 0.3);
      g.beginPath(); for (let k = 0; k <= 1.001; k += 0.05) { const p = P(k); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
      const n = Math.round(W / (u * 9));
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, p = P(k), q = P(k + 0.5 / n);
        const sw = Math.sin(t * 2.2 + i * 0.9 + li) * u * 0.8, fw = u * 4.2, fh = u * 5.2;
        const c = FLAGC[(i * 3 + li * 5) % FLAGC.length];
        g.fillStyle = c;
        g.beginPath(); g.moveTo(p[0] - fw / 2, p[1]); g.lineTo(p[0] + fw / 2, p[1] + (q[1] - p[1]) * 0.3);
        g.lineTo(p[0] + sw, p[1] + fh); g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,.14)';
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + fw / 2, p[1] + (q[1] - p[1]) * 0.3); g.lineTo(p[0] + sw, p[1] + fh); g.closePath(); g.fill();
      }
    });
  }

  // 구름
  function drawClouds(g, L, t) {
    const { W, hy, u } = L;
    for (let i = 0; i < 3; i++) {
      const x = ((i * 0.37 + t * 0.006 * (1 + i * 0.3)) % 1.3 - 0.15) * W, y = hy * (0.14 + i * 0.12), r = u * (10 + i * 3);
      for (const [dx, dy, rr] of [[0, 0, 1], [-1.1, 0.3, 0.7], [1.1, 0.25, 0.75], [0.5, -0.4, 0.75]]) {
        const X = x + dx * r, Y = y + dy * r, R = rr * r;
        const gg = g.createRadialGradient(X - R * 0.3, Y - R * 0.4, 0, X, Y, R);
        gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(0.75, 'rgba(240,247,252,.8)'); gg.addColorStop(1, 'rgba(230,242,250,0)');
        g.fillStyle = gg; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
      }
    }
  }

  // 지평선의 응원하는 아이들(작게, 흐리게)
  function drawCrowd(g, L, t, cheer) {
    const { W, hy, u } = L;
    seed = 99;
    const s = u * 0.55, y0 = hy + u * 2.2;
    const skip0 = L.tx - L.tu * 34, skip1 = L.tx + L.tu * 34;
    for (let x = s * 3; x < W; x += s * 6.2) {
      const jitter = rnd();
      if (x > skip0 && x < skip1) continue;
      if (!L.portrait && x < W * 0.03 + u * 104) continue;
      if (L.portrait && x < u * 26) continue;
      const blue = jitter < 0.5;
      const hop = Math.max(0, Math.sin(t * (5 + jitter * 3) + jitter * 20)) * s * (0.6 + cheer * 2.2);
      const y = y0 - hop;
      g.fillStyle = 'rgba(60,40,20,.15)'; g.beginPath(); g.ellipse(x, y0 + s * 0.3, s * 2.3, s * 0.6, 0, 0, 7); g.fill();
      g.fillStyle = blue ? '#e9eef7' : '#f3f1ea'; g.fillRect(x - s * 1.8, y - s * 5.5, s * 3.6, s * 5.3);
      g.fillStyle = '#29376a'; g.fillRect(x - s * 1.8, y - s * 1.2, s * 3.6, s * 1.4);
      g.fillStyle = '#efcaa9'; g.beginPath(); g.arc(x, y - s * 7.3, s * 1.9, 0, 7); g.fill();
      g.fillStyle = '#2a1f19'; g.beginPath(); g.arc(x, y - s * 7.8, s * 1.95, Math.PI * 1.02, -0.02); g.fill();
      g.fillStyle = blue ? '#2d63c8' : '#ffffff'; g.fillRect(x - s * 1.95, y - s * 8.1, s * 3.9, s * 0.7);
      // 작은 깃발
      const up = Math.sin(t * 3 + jitter * 9) > 0.2 - cheer;
      const fx = x + s * 2.2, fy = y - s * (up ? 10.5 : 5.5);
      g.strokeStyle = '#7a5a3a'; g.lineWidth = Math.max(1, s * 0.3);
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy + s * 4); g.stroke();
      g.fillStyle = blue ? '#2d63c8' : '#ffffff'; g.fillRect(fx, fy, s * 2.6, s * 1.8);
    }
    // 지평선 쪽을 하늘빛으로 살짝 덮어 멀게
    const gg = g.createLinearGradient(0, hy - u * 8, 0, hy + u * 4);
    gg.addColorStop(0, 'rgba(220,235,240,0)'); gg.addColorStop(1, 'rgba(225,235,235,.18)');
    g.fillStyle = gg; g.fillRect(0, hy - u * 8, W, u * 12);
  }

  // ---------------------------------------------------------------- 선생님(구령대 위)
  function drawTeacher(g, L, t, st) {
    const u = L.tu, x = L.tx, fy = L.ty - u * 0.4;
    const P = (px, py) => [x + px * u, fy - py * u];
    const laugh = st.teacher === 'laugh', talk = st.talk || 0;
    const bob = laugh ? Math.abs(Math.sin(t * 14)) * 1.2 : Math.sin(t * 2) * 0.3;
    g.save();
    // 그림자
    g.fillStyle = 'rgba(60,40,20,.22)'; g.beginPath(); g.ellipse(x, fy + u * 0.4, u * 11, u * 2, 0, 0, 7); g.fill();
    g.lineJoin = 'round'; g.lineCap = 'round';
    const ol = dk('#c0392b', 0.45), lw = u * 0.9;
    // 다리(빨간 트레이닝복 바지 + 흰 줄)
    for (const sx of [-1, 1]) {
      g.fillStyle = '#b8332a'; g.strokeStyle = ol; g.lineWidth = lw;
      g.beginPath(); g.moveTo(...P(sx * 1.2, 44)); g.lineTo(...P(sx * 7.8, 44)); g.lineTo(...P(sx * 7, 3)); g.lineTo(...P(sx * 1.8, 3)); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(...P(sx * 7.3, 42)); g.lineTo(...P(sx * 7.9, 42)); g.lineTo(...P(sx * 7.2, 4)); g.lineTo(...P(sx * 6.6, 4)); g.fill();
      g.fillStyle = '#f5f5f5'; g.strokeStyle = '#8a8a8a';
      g.beginPath(); g.ellipse(...P(sx * 4.6, 1.6), u * 4.6, u * 2.2, 0, 0, 7); g.fill(); g.stroke();
    }
    g.translate(0, -bob * u);
    // 몸통(빨간 트레이닝복 윗옷)
    let gr = g.createLinearGradient(x - u * 10, 0, x + u * 10, 0);
    gr.addColorStop(0, '#e2513f'); gr.addColorStop(1, '#a92d22');
    g.fillStyle = gr; g.strokeStyle = ol; g.lineWidth = lw;
    g.beginPath(); g.moveTo(...P(-9, 72)); g.quadraticCurveTo(...P(-11, 60), ...P(-9, 42)); g.lineTo(...P(9, 42));
    g.quadraticCurveTo(...P(11, 60), ...P(9, 72)); g.quadraticCurveTo(...P(0, 75), ...P(-9, 72)); g.fill(); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = u * 0.7; g.beginPath(); g.moveTo(...P(0, 73)); g.lineTo(...P(0, 43)); g.stroke();
    // 호루라기 줄
    g.strokeStyle = '#f2c230'; g.lineWidth = u * 0.5;
    g.beginPath(); g.moveTo(...P(-4, 73)); g.quadraticCurveTo(...P(0, 60), ...P(4, 73)); g.stroke();
    g.fillStyle = '#d8d8d8'; g.beginPath(); g.ellipse(...P(0.5, 61), u * 1.8, u * 1.2, 0, 0, 7); g.fill();
    // 팔: 왼팔(화면 오른쪽)은 마이크, 오른팔은 웃을 땐 아이 쪽을 가리킴
    function arm(sx, ang, ang2) {
      const sh = P(sx * 8.5, 70);
      const e = [sh[0] + Math.sin(ang * D2R) * sx * u * 13, sh[1] + Math.cos(ang * D2R) * u * 13];
      const h = [e[0] + Math.sin(ang2 * D2R) * sx * u * 12, e[1] + Math.cos(ang2 * D2R) * u * 12];
      g.strokeStyle = ol; g.lineWidth = u * 6.2; g.beginPath(); g.moveTo(...sh); g.lineTo(...e); g.lineTo(...h); g.stroke();
      g.strokeStyle = '#c63d30'; g.lineWidth = u * 4.6; g.beginPath(); g.moveTo(...sh); g.lineTo(...e); g.lineTo(...h); g.stroke();
      g.fillStyle = '#f2c9a8'; g.beginPath(); g.arc(h[0], h[1], u * 2.6, 0, 7); g.fill();
      return h;
    }
    const mh = arm(1, 25, 160 - talk * 8);
    // 마이크
    g.fillStyle = '#333'; g.save(); g.translate(mh[0], mh[1]); g.rotate(-0.5);
    g.fillRect(-u * 0.9, -u * 1, u * 1.8, u * 7); g.fillStyle = '#777'; g.beginPath(); g.arc(0, -u * 1.6, u * 2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-u * 0.6, -u * 2.2, u * 0.7, 0, 7); g.fill(); g.restore();
    if (laugh) arm(-1, 70, 100); else arm(-1, 18, 30);
    // 목·머리
    g.fillStyle = '#f2c9a8'; g.fillRect(...P(-2.4, 77), u * 4.8, u * 5);
    const hc = P(0, 86);
    // 뒷머리 + 포니테일(흔들)
    g.fillStyle = '#3a261c';
    const pt = Math.sin(t * 3) * 0.2 + (laugh ? Math.sin(t * 14) * 0.3 : 0);
    g.save(); g.translate(hc[0] + u * 7.5, hc[1] - u * 5); g.rotate(1.15 + pt);
    g.beginPath(); g.ellipse(u * 6, 0, u * 7.5, u * 2.5, 0, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#e2463a'; g.beginPath(); g.arc(hc[0] + u * 8.2, hc[1] - u * 5.5, u * 1.3, 0, 7); g.fill(); g.fillStyle = '#3a261c';
    gr = g.createRadialGradient(hc[0] - u * 3, hc[1] - u * 3, u, hc[0], hc[1], u * 10.5);
    gr.addColorStop(0, '#fbdcc0'); gr.addColorStop(1, '#e6b48f');
    g.fillStyle = gr; g.strokeStyle = '#a8704e'; g.lineWidth = lw * 0.8;
    g.beginPath(); g.ellipse(hc[0], hc[1], u * 9.5, u * 10.2, 0, 0, 7); g.fill(); g.stroke();
    // 앞머리
    g.fillStyle = '#3a261c';
    g.beginPath(); g.moveTo(hc[0] - u * 9.8, hc[1] + u * 1);
    g.quadraticCurveTo(hc[0] - u * 11, hc[1] - u * 12, hc[0], hc[1] - u * 11.2);
    g.quadraticCurveTo(hc[0] + u * 11, hc[1] - u * 12, hc[0] + u * 9.8, hc[1] + u * 1);
    g.quadraticCurveTo(hc[0] + u * 7, hc[1] - u * 5, hc[0] + u * 1, hc[1] - u * 5);
    g.quadraticCurveTo(hc[0] - u * 6, hc[1] - u * 6, hc[0] - u * 9.8, hc[1] + u * 1); g.fill();
    g.strokeStyle = 'rgba(255,220,190,.35)'; g.lineWidth = u * 0.8;
    g.beginPath(); g.arc(hc[0] - u * 1, hc[1] - u * 4, u * 7, -2.6, -1.7); g.stroke();
    // 얼굴
    g.fillStyle = '#2a1a12';
    if (laugh) {
      g.lineWidth = u * 0.9; g.strokeStyle = '#2a1a12';
      for (const sx of [-1, 1]) { g.beginPath(); g.arc(hc[0] + sx * u * 3.6, hc[1] + u * 0.8, u * 1.6, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      g.fillStyle = '#7a2a22'; g.beginPath(); g.ellipse(hc[0], hc[1] + u * 5, u * 3.2, u * 2.6, 0, 0, Math.PI); g.fill();
    } else {
      for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(hc[0] + sx * u * 3.6, hc[1] + u * 0.5, u * 1.1, u * 1.5, 0, 0, 7); g.fill(); }
      g.fillStyle = '#9b3a2e';
      g.beginPath(); g.ellipse(hc[0], hc[1] + u * 5, u * 1.8, u * (0.5 + talk * 1.9), 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(240,120,110,.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(hc[0] + sx * u * 6, hc[1] + u * 3.2, u * 1.8, u * 1.1, 0, 0, 7); g.fill(); }
    g.restore();
  }

  // ---------------------------------------------------------------- 아이(주인공)
  const SKIN = '#f6d0ad', SKIN_D = '#dca17b', SKIN_O = '#b0714a';
  const HAIR = '#2b1d16';

  // 깃발 천(물결)
  function flagCloth(g, a0, a1, dir, perp, len, t, ph, color, amp) {
    const N = 12;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N, d = k * len;
      const w = Math.sin(t * 9 - i * 0.75 + ph) * amp * k;
      pts.push([
        [a0[0] + dir[0] * d + perp[0] * w, a0[1] + dir[1] * d + perp[1] * w - k * len * 0.04],
        [a1[0] + dir[0] * d + perp[0] * w, a1[1] + dir[1] * d + perp[1] * w + k * len * 0.02],
        Math.cos(t * 9 - i * 0.75 + ph),
      ]);
    }
    for (let i = 0; i < N; i++) {
      const A = pts[i], B = pts[i + 1], sh = (A[2] + B[2]) / 2;
      g.fillStyle = sh > 0 ? lt(color, sh * 0.22) : dk(color, -sh * 0.2);
      g.beginPath(); g.moveTo(...A[0]); g.lineTo(...B[0]); g.lineTo(...B[1]); g.lineTo(...A[1]); g.closePath(); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = 1; g.stroke(); // 틈 메우기
    }
    g.strokeStyle = dk(color, 0.4); g.lineWidth = Math.max(1, amp * 0.18); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(...pts[0][0]);
    for (const p of pts) g.lineTo(...p[0]);
    for (let i = N; i >= 0; i--) g.lineTo(...pts[i][1]);
    g.closePath(); g.stroke();
  }

  function drawKid(g, L, t, st) {
    const u = L.u, cx = L.cx, fy = L.fy;
    const P = (x, y) => [cx + x * u, fy - y * u];
    const mood = st.mood || 'idle';
    const hop = st.hop || 0;
    const shake = mood === 'oops' ? Math.sin(t * 50) * 0.7 * Math.max(0, st.moodT || 0) : 0;
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    // 접지 그림자
    let gr = g.createRadialGradient(cx, fy, 0, cx, fy, u * 30);
    gr.addColorStop(0, 'rgba(70,45,20,.38)'); gr.addColorStop(1, 'rgba(70,45,20,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, fy + u * 0.5, u * 30 * (1 - hop * 0.01), u * 5.5, 0, 0, 7); g.fill();

    g.translate(shake * u, -hop * u);
    const OL = '#3b2a22', lw = u * 1.05;

    // 신발
    for (const sx of [-1, 1]) {
      gr = g.createLinearGradient(0, fy - u * 6, 0, fy);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfd4dc');
      g.fillStyle = gr; g.strokeStyle = '#55606e'; g.lineWidth = lw;
      g.beginPath(); g.moveTo(...P(sx * 2.5, 6)); g.quadraticCurveTo(...P(sx * 3, 0), ...P(sx * 5, 0));
      g.lineTo(...P(sx * 13, 0)); g.quadraticCurveTo(...P(sx * 14.5, 3), ...P(sx * 11, 6.5)); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#2d63c8'; g.lineWidth = u * 1.1; g.beginPath(); g.moveTo(...P(sx * 6, 4.8)); g.lineTo(...P(sx * 10.5, 2.2)); g.stroke();
      g.fillStyle = '#9aa3ad'; g.fillRect(...P(sx > 0 ? 3 : -13.5, 1), u * 10.5, u * 0.9);
    }
    // 다리(양말 + 살)
    for (const sx of [-1, 1]) {
      gr = g.createLinearGradient(...P(sx * 3, 0), ...P(sx * 11, 0));
      gr.addColorStop(sx < 0 ? 1 : 0, SKIN); gr.addColorStop(sx < 0 ? 0 : 1, SKIN_D);
      g.fillStyle = gr; g.strokeStyle = SKIN_O; g.lineWidth = lw;
      g.beginPath(); g.moveTo(...P(sx * 3.2, 38)); g.lineTo(...P(sx * 10.8, 38)); g.lineTo(...P(sx * 10, 6)); g.lineTo(...P(sx * 4, 6)); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f7f7f4'; g.strokeStyle = '#a9adb5';
      g.beginPath(); g.moveTo(...P(sx * 3.9, 13)); g.lineTo(...P(sx * 10.2, 13)); g.lineTo(...P(sx * 10.1, 6)); g.lineTo(...P(sx * 3.9, 6)); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(45,99,200,.8)'; g.fillRect(...P(sx > 0 ? 4 : -10.1, 12), u * 6.1, u * 1);
      // 무릎 음영
      g.fillStyle = 'rgba(190,120,90,.25)'; g.beginPath(); g.ellipse(...P(sx * 7, 24), u * 2.4, u * 1.4, 0, 0, 7); g.fill();
    }
    // 반바지(남색, 옆 흰 줄)
    gr = g.createLinearGradient(...P(-15, 0), ...P(15, 0));
    gr.addColorStop(0, '#34457f'); gr.addColorStop(0.55, '#243466'); gr.addColorStop(1, '#172248');
    g.fillStyle = gr; g.strokeStyle = '#101838'; g.lineWidth = lw;
    g.beginPath(); g.moveTo(...P(-13.2, 54)); g.lineTo(...P(13.2, 54)); g.lineTo(...P(14.5, 34)); g.lineTo(...P(1.4, 33.5));
    g.lineTo(...P(0, 40)); g.lineTo(...P(-1.4, 33.5)); g.lineTo(...P(-14.5, 34)); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#f2f2f2'; g.lineWidth = u * 1.1;
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(...P(sx * 13.3, 52)); g.lineTo(...P(sx * 14.3, 35)); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = u * 0.5; g.beginPath(); g.moveTo(...P(0, 51)); g.lineTo(...P(0, 40.5)); g.stroke();

    // 몸통(흰 체육복 티셔츠, 오른쪽 그림자)
    gr = g.createLinearGradient(...P(-16, 0), ...P(16, 0));
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#f2f3f0'); gr.addColorStop(1, '#c9cfd8');
    g.fillStyle = gr; g.strokeStyle = '#7d8795'; g.lineWidth = lw;
    g.beginPath(); g.moveTo(...P(-10, 81)); g.quadraticCurveTo(...P(-16, 80), ...P(-16.5, 74));
    g.quadraticCurveTo(...P(-14.5, 64), ...P(-14, 50)); g.lineTo(...P(14, 50)); g.quadraticCurveTo(...P(14.5, 64), ...P(16.5, 74));
    g.quadraticCurveTo(...P(16, 80), ...P(10, 81)); g.quadraticCurveTo(...P(0, 83), ...P(-10, 81)); g.fill(); g.stroke();
    // 옷 주름
    g.strokeStyle = 'rgba(120,130,150,.35)'; g.lineWidth = u * 0.6;
    g.beginPath(); g.moveTo(...P(-10, 52)); g.quadraticCurveTo(...P(-8, 58), ...P(-11, 64)); g.stroke();
    g.beginPath(); g.moveTo(...P(9, 52)); g.quadraticCurveTo(...P(7, 56), ...P(9.5, 61)); g.stroke();
    // 파란 목둘레·어깨선
    g.strokeStyle = '#2d63c8'; g.lineWidth = u * 1.6;
    g.beginPath(); g.moveTo(...P(-5.5, 81.5)); g.quadraticCurveTo(...P(0, 76.5), ...P(5.5, 81.5)); g.stroke();
    // 가슴 번호표(운동회)
    g.fillStyle = '#fff'; g.strokeStyle = '#9aa2ad'; g.lineWidth = u * 0.5;
    const nb = P(-6, 71); g.fillRect(nb[0], nb[1], u * 12, u * 10); g.strokeRect(nb[0], nb[1], u * 12, u * 10);
    g.fillStyle = '#d6332a'; g.font = '900 ' + (u * 8.2) + 'px Ria, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('7', nb[0] + u * 6, nb[1] + u * 5.4);
    g.fillStyle = '#b8bec8'; g.beginPath(); g.arc(nb[0] + u * 1.2, nb[1] + u * 1.2, u * 0.5, 0, 7); g.arc(nb[0] + u * 10.8, nb[1] + u * 1.2, u * 0.5, 0, 7); g.fill();

    // 목
    g.fillStyle = SKIN_D; g.beginPath(); g.moveTo(...P(-4, 85)); g.lineTo(...P(4, 85)); g.lineTo(...P(4.2, 79.5)); g.quadraticCurveTo(...P(0, 78), ...P(-4.2, 79.5)); g.fill();

    // ---- 머리
    const hc = P(0, 96), HR = u * 15.5, HRy = u * 14.8;
    // 뒷머리(귀 뒤로 보이는 부분)
    g.fillStyle = HAIR;
    g.beginPath(); g.ellipse(hc[0], hc[1] - u * 1.5, HR * 1.04, HRy * 1.02, 0, 0, 7); g.fill();
    // 귀
    for (const sx of [-1, 1]) {
      g.fillStyle = sx < 0 ? SKIN : SKIN_D; g.strokeStyle = SKIN_O; g.lineWidth = lw * 0.8;
      g.beginPath(); g.ellipse(hc[0] + sx * u * 15.3, hc[1] + u * 0.5, u * 3, u * 3.8, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(176,113,74,.6)'; g.beginPath(); g.arc(hc[0] + sx * u * 15.3, hc[1] + u * 0.5, u * 1.6, sx < 0 ? 1.3 : -1.8, sx < 0 ? 4.4 : 1.3); g.stroke();
    }
    // 얼굴
    gr = g.createRadialGradient(hc[0] - u * 5, hc[1] - u * 4, u * 2, hc[0] + u * 2, hc[1] + u * 2, u * 17);
    gr.addColorStop(0, '#fde3c8'); gr.addColorStop(0.6, SKIN); gr.addColorStop(1, SKIN_D);
    g.fillStyle = gr; g.strokeStyle = SKIN_O; g.lineWidth = lw;
    g.beginPath(); g.ellipse(hc[0], hc[1], HR * 0.97, HRy, 0, 0, 7); g.fill(); g.stroke();
    // 앞머리(삐죽한 결)
    const hy0 = hc[1] - HRy;
    g.fillStyle = HAIR;
    g.beginPath();
    g.moveTo(hc[0] - HR * 1.02, hc[1] + u * 2);
    g.quadraticCurveTo(hc[0] - HR * 1.12, hy0 - u * 2, hc[0] - u * 2, hy0 - u * 2.6);
    g.quadraticCurveTo(hc[0] + HR * 1.1, hy0 - u * 2.2, hc[0] + HR * 1.03, hc[1] + u * 2);
    // 앞머리 끝(오른쪽→왼쪽, 뾰족뾰족)
    const tips = [[13.5, -3], [11, -6.2], [8.5, -3.2], [5.5, -7], [2.5, -3.8], [-0.5, -7.6], [-3.5, -4], [-6.5, -7.2], [-9.5, -3.6], [-12, -6.4], [-14.2, -2.2]];
    let prev = [13.8, 1];
    for (let i = 0; i < tips.length; i++) {
      const tp = tips[i];
      g.quadraticCurveTo(hc[0] + (prev[0] + tp[0]) / 2 * u, hc[1] + (Math.min(prev[1], tp[1]) - 0.8) * u, hc[0] + tp[0] * u, hc[1] + tp[1] * u);
      prev = tp;
    }
    g.closePath(); g.fill();
    // 머리 하이라이트 띠 + 결
    g.strokeStyle = 'rgba(150,110,90,.55)'; g.lineWidth = u * 1.3;
    g.beginPath(); g.ellipse(hc[0] - u * 2, hc[1] - u * 8.5, u * 9, u * 5.5, -0.12, Math.PI * 1.08, Math.PI * 1.62); g.stroke();
    g.strokeStyle = 'rgba(95,70,58,.8)'; g.lineWidth = u * 0.45;
    for (const [a, b, c2] of [[-8, -12, -10], [-3, -14, -6], [3, -14, 1], [8, -12, 6], [11, -9, 10]]) {
      g.beginPath(); g.moveTo(hc[0] + a * u, hc[1] + b * u); g.quadraticCurveTo(hc[0] + c2 * u, hc[1] + (b + 4) * u, hc[0] + (a + (a > 0 ? 1.5 : -1.5)) * u, hc[1] + (b + 7.5) * u); g.stroke();
    }
    // 가마 삐침
    g.strokeStyle = HAIR; g.lineWidth = u * 1.1;
    g.beginPath(); g.moveTo(hc[0] + u * 1, hy0 - u * 1.8); g.quadraticCurveTo(hc[0] + u * 3, hy0 - u * 6, hc[0] + u * 6.5, hy0 - u * 5.2); g.stroke();
    // 청군 머리띠(이마) + 매듭 꼬리(펄럭)
    g.fillStyle = '#2d63c8'; g.strokeStyle = '#173b85'; g.lineWidth = lw * 0.8;
    g.beginPath(); g.moveTo(hc[0] - HR * 1.03, hc[1] - u * 3.2);
    g.quadraticCurveTo(hc[0], hc[1] - u * 7.8, hc[0] + HR * 1.03, hc[1] - u * 3.2);
    g.lineTo(hc[0] + HR * 1.03, hc[1] - u * 0.2); g.quadraticCurveTo(hc[0], hc[1] - u * 4.6, hc[0] - HR * 1.03, hc[1] - u * 0.2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.beginPath(); g.moveTo(hc[0] - HR * 0.8, hc[1] - u * 4.2); g.quadraticCurveTo(hc[0] - u * 3, hc[1] - u * 7, hc[0] + u * 2, hc[1] - u * 6.4);
    g.quadraticCurveTo(hc[0] - u * 3, hc[1] - u * 6, hc[0] - HR * 0.8, hc[1] - u * 3.4); g.fill();
    const kx = hc[0] + HR * 1.02, ky = hc[1] - u * 1.8;
    for (let i = 0; i < 2; i++) {
      const w = Math.sin(t * 7 + i * 1.3) * u * 1.8, len = u * (9 - i * 1.5);
      g.fillStyle = i ? '#2458b5' : '#2d63c8';
      g.beginPath(); g.moveTo(kx, ky - u * 1); g.quadraticCurveTo(kx + len * 0.5, ky + w + u * (i * 2), kx + len, ky + u * (2 + i * 3.5) + w);
      g.lineTo(kx + len - u * 0.8, ky + u * (4 + i * 3.5) + w); g.quadraticCurveTo(kx + len * 0.5, ky + w + u * (2.5 + i * 2), kx, ky + u * 1.2); g.fill();
    }
    g.fillStyle = '#1f4ea6'; g.beginPath(); g.ellipse(kx, ky, u * 1.8, u * 2.1, 0, 0, 7); g.fill();

    // 얼굴 표정
    const ey = hc[1] + u * 2.2, ex = u * 5.6;
    const blink = (t % 3.7) < 0.12 && mood !== 'oops';
    // 볼
    g.fillStyle = 'rgba(245,130,120,.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(hc[0] + sx * u * 9.3, hc[1] + u * 6.5, u * 2.7, u * 1.6, 0, 0, 7); g.fill(); }
    // 눈썹
    g.strokeStyle = '#3a2a22'; g.lineWidth = u * 1.0;
    for (const sx of [-1, 1]) {
      const by = mood === 'oops' ? -4.4 : mood === 'focus' ? -2.4 : -3.4;
      const tilt = mood === 'focus' ? 0.9 : mood === 'oops' ? -0.8 : 0;
      g.beginPath(); g.moveTo(hc[0] + sx * (ex - u * 2.2), ey + (by + tilt) * u); g.lineTo(hc[0] + sx * (ex + u * 2.2), ey + (by - tilt * 0.3) * u); g.stroke();
    }
    // 눈
    for (const sx of [-1, 1]) {
      const X = hc[0] + sx * ex;
      if (mood === 'happy') {
        g.strokeStyle = '#2a1c16'; g.lineWidth = u * 1.1;
        g.beginPath(); g.arc(X, ey + u * 1.2, u * 2.2, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      } else if (mood === 'oops') {
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(X, ey, u * 2.6, u * 3, 0, 0, 7); g.fill();
        g.strokeStyle = '#2a1c16'; g.lineWidth = u * 0.5; g.stroke();
        g.fillStyle = '#2a1c16'; g.beginPath(); g.arc(X, ey + u * 0.3, u * 1.1, 0, 7); g.fill();
      } else if (blink) {
        g.strokeStyle = '#2a1c16'; g.lineWidth = u * 0.9;
        g.beginPath(); g.moveTo(X - u * 2, ey + u * 0.6); g.quadraticCurveTo(X, ey + u * 1.6, X + u * 2, ey + u * 0.6); g.stroke();
      } else {
        g.fillStyle = '#2a1c16'; g.beginPath(); g.ellipse(X, ey, u * 2.05, u * 2.7, 0, 0, 7); g.fill();
        g.fillStyle = '#5a3a2a'; g.beginPath(); g.ellipse(X, ey + u * 0.9, u * 1.4, u * 1.4, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(X - u * 0.7, ey - u * 1.0, u * 0.85, 0, 7); g.fill();
        g.beginPath(); g.arc(X + u * 0.8, ey + u * 1.0, u * 0.35, 0, 7); g.fill();
      }
    }
    // 코
    g.fillStyle = 'rgba(190,120,85,.55)'; g.beginPath(); g.ellipse(hc[0] + u * 0.3, hc[1] + u * 5.4, u * 0.9, u * 0.6, 0, 0, 7); g.fill();
    // 입
    const my = hc[1] + u * 8.6;
    g.strokeStyle = '#6b2b22'; g.lineWidth = u * 0.9;
    if (mood === 'happy') {
      g.fillStyle = '#8c2f28'; g.beginPath(); g.moveTo(hc[0] - u * 3.6, my - u * 0.5); g.quadraticCurveTo(hc[0], my + u * 5.2, hc[0] + u * 3.6, my - u * 0.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#f07a78'; g.beginPath(); g.ellipse(hc[0], my + u * 2.4, u * 1.8, u * 1, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(hc[0] - u * 2.4, my - u * 0.3, u * 4.8, u * 0.9);
    } else if (mood === 'oops') {
      g.fillStyle = '#8c2f28'; g.beginPath(); g.ellipse(hc[0], my + u * 1, u * 1.8, u * 2.3, 0, 0, 7); g.fill(); g.stroke();
      // 땀
      g.fillStyle = 'rgba(140,200,245,.9)';
      const sy = hc[1] - u * 6 + ((st.moodT ? 1 - st.moodT : 0) * u * 6);
      g.beginPath(); g.moveTo(hc[0] - u * 13, sy - u * 3); g.quadraticCurveTo(hc[0] - u * 15, sy + u * 1, hc[0] - u * 13, sy + u * 1.4);
      g.quadraticCurveTo(hc[0] - u * 11, sy + u * 1, hc[0] - u * 13, sy - u * 3); g.fill();
    } else if (mood === 'focus') {
      g.beginPath(); g.moveTo(hc[0] - u * 1.8, my + u * 0.6); g.lineTo(hc[0] + u * 1.8, my + u * 0.3); g.stroke();
    } else {
      g.beginPath(); g.moveTo(hc[0] - u * 2.6, my); g.quadraticCurveTo(hc[0], my + u * 2.2, hc[0] + u * 2.6, my); g.stroke();
    }

    // ---- 팔과 깃발
    drawArm(g, P, u, t, -1, st.aB, '#2d63c8', 0, lw);
    drawArm(g, P, u, t, 1, st.aW, '#f6f6f1', 1.7, lw);
    g.restore();
  }

  // side -1 = 화면 왼쪽(아이의 오른손, 청기) / +1 = 화면 오른쪽(백기)
  function drawArm(g, P, u, t, side, a, color, ph, lw) {
    a = Math.max(-0.15, Math.min(1.15, a));
    const th = (26 + 134 * a) * D2R;                  // 위팔: 아래 0° → 위 180°
    const tf = (38 + 132 * a) * D2R;                  // 아래팔
    const tp = (52 + 122 * a) * D2R;                  // 깃대
    const sh = P(side * 14, 76.5);
    const dir = ang => [side * Math.sin(ang), Math.cos(ang)];
    const d1 = dir(th), d2 = dir(tf), dp = dir(tp);
    const e = [sh[0] + d1[0] * u * 17, sh[1] + d1[1] * u * 17];
    const h = [e[0] + d2[0] * u * 16, e[1] + d2[1] * u * 16];
    // 깃대
    const tip = [h[0] + dp[0] * u * 46, h[1] + dp[1] * u * 46];
    const butt = [h[0] - dp[0] * u * 6, h[1] - dp[1] * u * 6];
    // 깃발 천: 깃대 끝 쪽 22u 구간에 붙고, 몸 바깥쪽으로(내리면 아래로 늘어진다)
    const a0 = tip, a1 = [tip[0] - dp[0] * u * 22, tip[1] - dp[1] * u * 22];
    let nx = -dp[1], ny = dp[0];
    if (nx * side < 0) { nx = -nx; ny = -ny; }
    const k = Math.max(0, Math.min(1, a));
    let cd = [nx, ny + (1 - k) * 0.3];
    const cl = Math.hypot(cd[0], cd[1]); cd = [cd[0] / cl, cd[1] / cl];
    const cp = [-cd[1], cd[0]];
    g.save();
    flagCloth(g, a0, a1, cd, cp, u * 30, t, ph, color, u * 2.4);
    g.restore();
    g.strokeStyle = '#6a4526'; g.lineWidth = u * 2.2; g.beginPath(); g.moveTo(...butt); g.lineTo(...tip); g.stroke();
    g.strokeStyle = '#b98a57'; g.lineWidth = u * 1.1; g.beginPath(); g.moveTo(...butt); g.lineTo(...tip); g.stroke();
    g.fillStyle = '#e8c25a'; g.beginPath(); g.arc(tip[0], tip[1], u * 1.5, 0, 7); g.fill();
    // 팔(살) — 윤곽 → 살
    g.strokeStyle = SKIN_O; g.lineWidth = u * 7.4;
    g.beginPath(); g.moveTo(...sh); g.lineTo(...e); g.lineTo(...h); g.stroke();
    const gr = g.createLinearGradient(sh[0] - u * 4, sh[1], sh[0] + u * 4, sh[1]);
    gr.addColorStop(side < 0 ? 0 : 1, '#fbd9b8'); gr.addColorStop(side < 0 ? 1 : 0, SKIN_D);
    g.strokeStyle = gr; g.lineWidth = u * 5.4;
    g.beginPath(); g.moveTo(...sh); g.lineTo(...e); g.lineTo(...h); g.stroke();
    // 반소매
    const sl = [sh[0] + d1[0] * u * 7.5, sh[1] + d1[1] * u * 7.5];
    g.strokeStyle = '#7d8795'; g.lineWidth = u * 10.4; g.beginPath(); g.moveTo(sh[0] - d1[0] * u, sh[1] - d1[1] * u); g.lineTo(...sl); g.stroke();
    g.strokeStyle = side < 0 ? '#fbfbf9' : '#dde1e7'; g.lineWidth = u * 8.4; g.beginPath(); g.moveTo(sh[0] - d1[0] * u, sh[1] - d1[1] * u); g.lineTo(...sl); g.stroke();
    g.strokeStyle = '#2d63c8'; g.lineWidth = u * 1.3;
    const pp = [-d1[1], d1[0]];
    g.beginPath(); g.moveTo(sl[0] + pp[0] * u * 4.1, sl[1] + pp[1] * u * 4.1); g.lineTo(sl[0] - pp[0] * u * 4.1, sl[1] - pp[1] * u * 4.1); g.stroke();
    // 주먹(깃대를 쥔)
    g.fillStyle = SKIN; g.strokeStyle = SKIN_O; g.lineWidth = lw * 0.9;
    g.beginPath(); g.arc(h[0], h[1], u * 3.6, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(176,113,74,.7)'; g.lineWidth = u * 0.5;
    for (let i = -1; i <= 1; i++) {
      g.beginPath(); g.moveTo(h[0] + dp[0] * u * i * 1.3 - dp[1] * u * 1.5 * side, h[1] + dp[1] * u * i * 1.3 + dp[0] * u * 1.5 * side);
      g.lineTo(h[0] + dp[0] * u * i * 1.3 - dp[1] * u * 3.2 * side, h[1] + dp[1] * u * i * 1.3 + dp[0] * u * 3.2 * side); g.stroke();
    }
  }

  // 비네트
  function drawVignette(g, L) {
    const { W, H } = L;
    const gr = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,25,10,.28)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }

  // 종이 가루(통과·엔딩)
  function drawConfetti(g, L, parts) {
    for (const p of parts) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.fillStyle = p.c; g.fillRect(-p.s, -p.s * 0.4 * Math.abs(Math.cos(p.f)), p.s * 2, p.s * 0.8 * Math.abs(Math.cos(p.f)) + 1);
      g.restore();
    }
  }

  let bgCache = null, bgKey = '';
  function draw(g, W, H, t, st, dpr) {
    dpr = dpr || 1;
    if (W < 40 || H < 40) return layout(Math.max(W, 40), Math.max(H, 40), st.touch);   // 창이 숨겨져 크기가 0일 때
    const L = layout(W, H, st.touch);
    const key = W + 'x' + H + 'x' + dpr + (st.touch ? 't' : '');
    if (key !== bgKey) {
      bgCache = document.createElement('canvas'); bgCache.width = Math.round(W * dpr); bgCache.height = Math.round(H * dpr);
      const bg = bgCache.getContext('2d'); bg.scale(dpr, dpr);
      drawBackground(bg, L); bgKey = key;
    }
    g.drawImage(bgCache, 0, 0, W, H);
    drawClouds(g, L, t);
    drawBunting(g, L, t);
    drawCrowd(g, L, t, st.cheer || 0);
    drawTeacher(g, L, t, st);
    drawKid(g, L, t, st);
    if (st.confetti) drawConfetti(g, L, st.confetti);
    drawVignette(g, L);
    return L;
  }

  window.CGArt = { draw, layout, FLAGC };
})();
