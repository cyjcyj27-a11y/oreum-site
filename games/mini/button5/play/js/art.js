// 5억년 버튼 — 그림(캔버스 2D). 빛은 왼쪽 위에서 온다
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function rr(c, x, y, w, h, r) {
    if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  // ── 돌 그림 미리 굽기(같은 돌을 수백 개 그리니 스프라이트로) ─────────────
  const SPR = {};
  function mk(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
  function stoneSprite(k, flat) {
    const key = (flat ? 'f' : 's') + k;
    if (SPR[key]) return SPR[key];
    const W = 120, H = flat ? 56 : 90, cv = mk(W, H), c = cv.getContext('2d');
    const n = 12, pts = [], squash = flat ? 0.78 + hash(k * 9) * 0.22 : 1;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + (hash(k * 13 + i) - 0.5) * 0.35;
      const rx = (W / 2 - 5) * (0.8 + hash(k * 7 + i) * 0.2), ry = (H / 2 - 5) * (0.78 + hash(k * 5 + i * 3) * 0.22) * squash;
      pts.push([W / 2 + Math.cos(a) * rx, H / 2 + Math.sin(a) * ry * (Math.sin(a) > 0 ? 0.9 : 1.05) + (flat ? 2 : 0)]);
    }
    const path = () => {
      c.beginPath();
      for (let i = 0; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (!i) c.moveTo(mx, my); else c.quadraticCurveTo(p[0], p[1], mx, my); }
      c.closePath();
    };
    path();
    const tone = 146 + Math.floor(hash(k * 3) * 44), warm = Math.floor(hash(k * 17) * 10);
    const g = c.createRadialGradient(W * 0.36, H * 0.28, W * 0.04, W * 0.52, H * 0.55, W * 0.62);
    g.addColorStop(0, `rgb(${tone + 58},${tone + 54 + warm / 2},${tone + 46})`);
    g.addColorStop(0.45, `rgb(${tone + 8},${tone + 4},${tone - 4 - warm})`);
    g.addColorStop(1, `rgb(${tone - 70},${tone - 73},${tone - 78})`);
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // 결: 옅은 얼룩과 알갱이
    for (let i = 0; i < 7; i++) {
      const bx = hash(k * 41 + i) * W, by = hash(k * 43 + i) * H, br = 8 + hash(k * 47 + i) * 16;
      const bg = c.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0, hash(k + i) > 0.5 ? 'rgba(255,250,240,.12)' : 'rgba(40,35,30,.12)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = bg; c.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    for (let i = 0; i < 70; i++) { c.fillStyle = hash(k * 31 + i) > 0.55 ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.13)'; const r = 0.6 + hash(i * 11 + k) * 1.3; c.fillRect(hash(i * 3 + k) * W, hash(i * 7 + k) * H, r, r); }
    // 아래 그늘
    const ag = c.createLinearGradient(0, H * 0.55, 0, H); ag.addColorStop(0, 'rgba(30,25,20,0)'); ag.addColorStop(1, 'rgba(30,25,20,.42)');
    c.fillStyle = ag; c.fillRect(0, 0, W, H);
    // 금(돌마다 다르게, 없는 돌도 있다)
    if (hash(k * 29) > 0.45) {
      c.strokeStyle = 'rgba(55,48,40,.55)'; c.lineWidth = 1.1;
      let x = W * (0.25 + hash(k * 19) * 0.5), y = H * 0.18; c.beginPath(); c.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += (hash(k * 23 + j) - 0.5) * W * 0.18; y += H * 0.16; c.lineTo(x, y); }
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.2)'; c.translate(1, 0); c.stroke();
    }
    c.restore();
    // 윗가장자리 빛, 테두리
    path(); c.strokeStyle = `rgba(${tone - 95},${tone - 98},${tone - 102},.85)`; c.lineWidth = 1.8; c.stroke();
    c.save(); path(); c.clip();
    c.strokeStyle = 'rgba(255,252,244,.35)'; c.lineWidth = 3; c.translate(1.5, 2.5); path(); c.stroke();
    c.restore();
    SPR[key] = cv; return cv;
  }
  function statueSprite(k) {
    const key = 'st' + k; if (SPR[key]) return SPR[key];
    const W = 120, H = 260, cv = mk(W, H), c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#c9c4ba'); g.addColorStop(0.45, '#a8a298'); g.addColorStop(1, '#6f6a62');
    c.fillStyle = g; c.strokeStyle = '#5d5850'; c.lineWidth = 2.5; c.lineJoin = 'round';
    const v = k % 4;
    // 받침
    rr(c, 14, H - 26, W - 28, 24, 4); c.fill(); c.stroke();
    c.beginPath();
    const cx = W / 2, top = 18;
    if (v === 0) { // 선 사람, 팔 내림
      c.moveTo(cx - 20, top + 58); c.quadraticCurveTo(cx - 36, top + 62, cx - 36, top + 80); c.lineTo(cx - 38, top + 150);
      c.lineTo(cx - 28, top + 152); c.lineTo(cx - 24, top + 110); c.lineTo(cx - 22, H - 26); c.lineTo(cx - 3, H - 26); c.lineTo(cx, top + 150);
      c.lineTo(cx + 3, H - 26); c.lineTo(cx + 22, H - 26); c.lineTo(cx + 24, top + 110); c.lineTo(cx + 28, top + 152); c.lineTo(cx + 38, top + 150);
      c.lineTo(cx + 36, top + 80); c.quadraticCurveTo(cx + 36, top + 62, cx + 20, top + 58); c.closePath();
    } else if (v === 1) { // 두 팔 든 사람
      c.moveTo(cx - 20, top + 60); c.lineTo(cx - 44, top + 10); c.lineTo(cx - 34, top + 4); c.lineTo(cx - 16, top + 50);
      c.lineTo(cx + 16, top + 50); c.lineTo(cx + 34, top + 4); c.lineTo(cx + 44, top + 10); c.lineTo(cx + 20, top + 60);
      c.lineTo(cx + 24, top + 112); c.lineTo(cx + 22, H - 26); c.lineTo(cx + 3, H - 26); c.lineTo(cx, top + 150); c.lineTo(cx - 3, H - 26);
      c.lineTo(cx - 22, H - 26); c.lineTo(cx - 24, top + 112); c.closePath();
    } else if (v === 2) { // 앉은 사람(무릎 안음)
      c.moveTo(cx - 22, top + 110); c.quadraticCurveTo(cx - 40, top + 118, cx - 40, top + 150); c.lineTo(cx - 44, H - 26); c.lineTo(cx + 44, H - 26);
      c.lineTo(cx + 40, top + 150); c.quadraticCurveTo(cx + 40, top + 118, cx + 22, top + 110); c.closePath();
    } else { // 서로 기댄 두 사람
      c.moveTo(cx - 40, top + 70); c.quadraticCurveTo(cx - 52, top + 76, cx - 50, top + 96); c.lineTo(cx - 44, H - 26); c.lineTo(cx + 44, H - 26);
      c.lineTo(cx + 50, top + 96); c.quadraticCurveTo(cx + 52, top + 76, cx + 40, top + 70); c.lineTo(cx, top + 82); c.closePath();
    }
    c.fill(); c.stroke();
    // 머리
    const heads = v === 2 ? [[cx, top + 92]] : v === 3 ? [[cx - 24, top + 50], [cx + 22, top + 46]] : [[cx, top + 38]];
    heads.forEach(([hx, hy]) => { c.beginPath(); c.ellipse(hx, hy, 15, 18, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(hx - 5, hy - 6, 6, 7, 0, 0, TAU); c.fill(); c.fillStyle = g; });
    // 끌 자국
    c.strokeStyle = 'rgba(70,64,56,.35)'; c.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const y = top + 60 + hash(k * 9 + i) * 150, x = cx - 20 + hash(k * 4 + i) * 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 3); c.stroke(); }
    SPR[key] = cv; return cv;
  }
  const GLYPHS = ['◇', '△', '○', '□', '▽', '◁', '▷', '┼', '╳', '◈', '⊙', '⊿'];
  function slabSprite(i, lit) {
    const key = 'sl' + i + (lit ? 'L' : ''); if (SPR[key]) return SPR[key];
    const W = 90, H = 150, cv = mk(W, H), c = cv.getContext('2d');
    c.beginPath(); c.moveTo(10, H - 6); c.lineTo(12, 30); c.quadraticCurveTo(W / 2, -8, W - 12, 30); c.lineTo(W - 10, H - 6); c.closePath();
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, lit ? '#7c7468' : '#6c6862'); g.addColorStop(0.5, lit ? '#5e574d' : '#55524d'); g.addColorStop(1, '#34322f');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#2a2826'; c.lineWidth = 2.5; c.stroke();
    c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = lit ? '#ffe2a0' : 'rgba(210,205,196,.65)';
    for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) c.fillText(GLYPHS[Math.floor(hash(i * 50 + r * 3 + q) * 12)], 26 + q * 19, 44 + r * 19);
    SPR[key] = cv; return cv;
  }

  // ── 공허 장면 ─────────────────────────────────────────────
  const V = { hy: 0, f: 0, cx: 0, cam: 1.6, fz: 3.7 };
  function proj(x, z) { return [V.cx + V.f * x / z, V.hy + V.f * V.cam / z, V.f / z]; }

  function voidBg(c, w, h, S) {
    V.cx = w / 2; V.hy = h * 0.42; V.f = Math.min(h * 1.0, w * 1.25);
    const sea = S.memFx && S.memFx.sea ? S.memFx.sea : 0;
    const dim = S.dim || 0;
    let g = c.createLinearGradient(0, 0, 0, V.hy);
    g.addColorStop(0, '#e4e1da'); g.addColorStop(0.75, '#f3f1ec'); g.addColorStop(1, '#fbfaf7');
    c.fillStyle = g; c.fillRect(0, 0, w, V.hy + 1);
    if (sea > 0) { c.globalAlpha = sea * 0.5; g = c.createLinearGradient(0, V.hy * 0.4, 0, V.hy); g.addColorStop(0, 'rgba(160,210,235,0)'); g.addColorStop(1, '#9fd1ea'); c.fillStyle = g; c.fillRect(0, 0, w, V.hy); c.globalAlpha = 1; }
    g = c.createLinearGradient(0, V.hy, 0, h);
    g.addColorStop(0, '#f1eee8'); g.addColorStop(0.35, '#e4dfd6'); g.addColorStop(1, '#cfc8bc');
    c.fillStyle = g; c.fillRect(0, V.hy, w, h - V.hy);
    // 지평선 빛띠
    g = c.createLinearGradient(0, V.hy - h * 0.05, 0, V.hy + h * 0.05);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, V.hy - h * 0.05, w, h * 0.1);
    // 바닥 격자(아주 옅게) — 걸으면 흘러온다
    const off = S.walkOff || 0;
    c.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const z = 1 + ((i * 1.6 - off) % 41.6 + 41.6) % 41.6;
      const [, y] = proj(0, z);
      if (y > h) continue;
      c.strokeStyle = `rgba(120,110,95,${0.05 * clamp(1.4 - z / 30, 0, 1)})`;
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    for (let i = -14; i <= 14; i++) {
      const [x1, y1] = proj(i * 1.6, 1.1), [x2, y2] = proj(i * 1.6, 60);
      c.strokeStyle = 'rgba(120,110,95,.025)'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    // 바닥 알갱이와 얼룩 — 민짜 바닥을 돌바닥처럼
    if (!GR.cv || GR.w !== w || GR.h !== h) {
      GR.w = w; GR.h = h; GR.cv = mk(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h - V.hy))); const gc = GR.cv.getContext('2d'), gh = h - V.hy;
      for (let i = 0; i < 40; i++) { const y = Math.pow(hash(i * 3), 1.6) * gh, x = hash(i * 5) * w, r = (12 + hash(i * 7) * 60) * (0.3 + y / gh);
        const bg = gc.createRadialGradient(x, y, 0, x, y, r); bg.addColorStop(0, hash(i) > 0.5 ? 'rgba(120,105,85,.035)' : 'rgba(255,255,250,.06)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
        gc.fillStyle = bg; gc.save(); gc.translate(x, y); gc.scale(1, 0.35); gc.translate(-x, -y); gc.fillRect(x - r, y - r, r * 2, r * 2); gc.restore(); }
      for (let i = 0; i < w * gh / 90; i++) { const y = Math.pow(Math.random(), 0.8) * gh, z = y / gh, x = Math.random() * w;
        gc.fillStyle = Math.random() > 0.5 ? `rgba(90,78,62,${0.05 + z * 0.12})` : `rgba(255,255,250,${0.05 + z * 0.1})`; const r = 0.5 + z * 1.4; gc.fillRect(x, y, r, r * 0.7); }
    }
    if (GR.cv.width > 0 && GR.cv.height > 0) c.drawImage(GR.cv, 0, V.hy);
    if (dim > 0) { c.fillStyle = `rgba(90,88,84,${dim * 0.5})`; c.fillRect(0, 0, w, h); }
  }
  const GR = { cv: null, w: 0, h: 0 };

  // 바닥에 긁은 자국(바를 정 모양 다섯 줄)
  function tallies(c, S, alpha) {
    const n = Math.floor(S.ever.line), groups = Math.floor(n / 5), rest = n % 5;
    const G = Math.min(groups, 1600);
    c.lineCap = 'round';
    const lw = Math.max(0.8, V.f * 0.0022);
    c.beginPath();
    for (let k = 0; k <= G; k++) {
      const cnt = k < G ? 5 : (groups >= 1600 ? 0 : rest);
      if (!cnt) continue;
      const a = k * 2.39996, r = 0.62 + 0.075 * Math.sqrt(k * 1.4);
      const x0 = Math.cos(a) * r, z0 = V.fz + Math.sin(a) * r * 0.9;
      if (z0 < 1.3) continue;
      const rot = hash(k) * 0.6 - 0.3, L = 0.085 + hash(k * 3) * 0.035;
      for (let j = 0; j < Math.min(cnt, 4); j++) {
        const dx = (j - 1.5) * 0.028 + (hash(k * 11 + j) - 0.5) * 0.008;
        const ax = x0 + dx + Math.sin(rot) * -L / 2, az = z0 - L / 2, bx = x0 + dx + Math.sin(rot) * L / 2, bz = z0 + L / 2;
        const p = proj(ax, az), q = proj(bx, bz); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
      }
      if (cnt === 5) { const p = proj(x0 - 0.07, z0 + 0.04), q = proj(x0 + 0.07, z0 - 0.04); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }
    }
    c.save(); c.translate(0.8, 1); c.strokeStyle = `rgba(255,253,246,${0.55 * alpha})`; c.lineWidth = lw; c.stroke(); c.restore();
    c.strokeStyle = `rgba(62,54,45,${0.62 * alpha})`; c.lineWidth = lw; c.stroke();
  }
  // 바닥 그림(선 60개마다 하나) — 떠오른 것들을 긁어 그린다
  const PICS = ['sun', 'house', 'person', 'dog', 'fish', 'tree', 'eye', 'bird', 'moon', 'flower', 'hand', 'spiral'];
  function picPath(type, t) { // 단위 원 안의 점들 [[x,z],...] 여러 획
    const P = [];
    const circ = (cx, cz, r, n) => { const s = []; for (let i = 0; i <= n; i++) s.push([cx + Math.cos(i / n * TAU) * r, cz + Math.sin(i / n * TAU) * r]); return s; };
    switch (type) {
      case 'sun': P.push(circ(0, 0, 0.35, 16)); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.push([[Math.cos(a) * 0.5, Math.sin(a) * 0.5], [Math.cos(a) * 0.8, Math.sin(a) * 0.8]]); } break;
      case 'house': P.push([[-0.6, 0.5], [-0.6, -0.2], [0, -0.7], [0.6, -0.2], [0.6, 0.5], [-0.6, 0.5]], [[-0.15, 0.5], [-0.15, 0.1], [0.15, 0.1], [0.15, 0.5]]); break;
      case 'person': P.push(circ(0, -0.55, 0.2, 12), [[0, -0.35], [0, 0.25]], [[-0.4, -0.15], [0.4, -0.15]], [[-0.3, 0.8], [0, 0.25], [0.3, 0.8]]); break;
      case 'dog': P.push([[-0.6, 0], [0.3, 0], [0.5, -0.3], [0.7, -0.25], [0.6, 0.05], [0.3, 0.05]], [[-0.5, 0], [-0.55, 0.45]], [[-0.25, 0], [-0.25, 0.45]], [[0.1, 0], [0.1, 0.45]], [[0.3, 0.05], [0.3, 0.45]], [[-0.6, 0], [-0.8, -0.3]]); break;
      case 'fish': P.push([[-0.6, 0], [-0.2, -0.3], [0.3, -0.25], [0.6, 0], [0.3, 0.25], [-0.2, 0.3], [-0.6, 0]], [[0.6, 0], [0.85, -0.3], [0.85, 0.3], [0.6, 0]]); break;
      case 'tree': P.push([[0, 0.8], [0, -0.1]], circ(0, -0.4, 0.4, 14), [[0, 0.2], [0.3, -0.05]]); break;
      case 'eye': P.push([[-0.7, 0], [-0.3, -0.35], [0.3, -0.35], [0.7, 0], [0.3, 0.35], [-0.3, 0.35], [-0.7, 0]], circ(0, 0, 0.18, 10)); break;
      case 'bird': P.push([[-0.7, -0.1], [-0.35, -0.35], [0, 0]], [[0, 0], [0.35, -0.35], [0.7, -0.1]]); break;
      case 'moon': { const s = []; for (let i = 0; i <= 12; i++) { const a = -1.2 + i / 12 * 3.6; s.push([Math.cos(a) * 0.55, Math.sin(a) * 0.55]); } for (let i = 12; i >= 0; i--) { const a = -1 + i / 12 * 3.2; s.push([Math.cos(a) * 0.4 + 0.2, Math.sin(a) * 0.45]); } P.push(s); } break;
      case 'flower': for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; P.push(circ(Math.cos(a) * 0.3, Math.sin(a) * 0.3 - 0.2, 0.18, 10)); } P.push([[0, -0.05], [0, 0.8]]); break;
      case 'pair': P.push(circ(-0.35, -0.55, 0.17, 12), [[-0.35, -0.38], [-0.35, 0.2]], [[-0.62, -0.1], [-0.35, -0.2], [0, -0.05]], [[-0.55, 0.75], [-0.35, 0.2], [-0.15, 0.75]],
        circ(0.35, -0.55, 0.17, 12), [[0.35, -0.38], [0.35, 0.2]], [[0.62, -0.1], [0.35, -0.2], [0, -0.05]], [[0.15, 0.75], [0.35, 0.2], [0.55, 0.75]]); break;
      case 'door': P.push([[-0.4, 0.8], [-0.4, -0.55], [-0.2, -0.8], [0.2, -0.8], [0.4, -0.55], [0.4, 0.8]], [[-0.65, 0.8], [0.65, 0.8]], circ(0.22, 0.1, 0.05, 8), [[-0.1, -0.95], [-0.2, -1.15]], [[0.1, -0.95], [0.2, -1.15]], [[0, -0.95], [0, -1.2]]); break;
      case 'hand': P.push([[-0.35, 0.7], [-0.4, 0], [-0.55, -0.35]], [[-0.4, 0], [-0.25, -0.7]], [[-0.15, 0], [-0.05, -0.8]], [[0.05, 0], [0.15, -0.7]], [[0.2, 0.05], [0.4, -0.5]], [[0.3, 0.7], [0.3, 0.1]]); break;
      default: { const s = []; for (let i = 0; i < 60; i++) { const a = i * 0.35, r = 0.02 + i * 0.012; s.push([Math.cos(a) * r, Math.sin(a) * r]); } P.push(s); }
    }
    return P;
  }
  function floorPics(c, S, alpha) {
    const n = Math.min(140, Math.floor(S.ever.line / 60));
    c.lineWidth = Math.max(1, V.f * 0.0026); c.lineJoin = 'round'; c.lineCap = 'round';
    for (let j = 0; j < n; j++) {
      const a = j * 1.7 + 0.5, r = 2.3 + 0.32 * Math.pow(j, 0.62);
      const x0 = Math.cos(a) * r, z0 = V.fz + Math.sin(a) * r;
      if (z0 < 1.6) continue;
      const sc = 0.42 + hash(j + 5) * 0.2, rot = hash(j) * 1.2 - 0.6;
      const strokes = picPath(PICS[j % PICS.length]);
      c.strokeStyle = `rgba(80,68,56,${0.5 * alpha * clamp(1.3 - z0 / 26, 0.15, 1)})`;
      c.beginPath();
      strokes.forEach(s => s.forEach((p, i) => {
        const px = p[0] * Math.cos(rot) - p[1] * Math.sin(rot), pz = p[0] * Math.sin(rot) + p[1] * Math.cos(rot);
        const q = proj(x0 + px * sc, z0 + pz * sc);
        if (!i) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]);
      }));
      c.stroke();
    }
  }
  // 먼저 온 사람의 자국(엇갈린 X) — 흔적을 찾을수록 멀리서 보인다
  function otherMarks(c, S, alpha) {
    const n = Math.min(900, S.found * 70);
    if (!n) return;
    c.strokeStyle = `rgba(95,70,60,${0.38 * alpha})`; c.lineWidth = Math.max(0.7, V.f * 0.0016);
    c.beginPath();
    for (let k = 0; k < n; k++) {
      const x = 4 + hash(k * 3) * 14 - (k % 2 ? 22 : 0), z = 9 + hash(k * 7) * 28;
      const p = proj(x - 0.08, z), q = proj(x + 0.08, z + 0.05), p2 = proj(x - 0.08, z + 0.05), q2 = proj(x + 0.08, z);
      c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.moveTo(p2[0], p2[1]); c.lineTo(q2[0], q2[1]);
    }
    c.stroke();
  }

  function towerSpots(i) { // 탑 자리: 인물 뒤로 넓게 흩어진다
    const side = i % 2 ? -1 : 1, row = Math.floor(i / 2);
    return [side * (1.25 + row * 0.62 + hash(i) * 0.4), V.fz + 1.4 + (row % 5) * 0.9 + row * 0.35 + hash(i * 3) * 0.6];
  }
  function statueSpot(i) { const side = i % 2 ? 1 : -1; return [side * (1.6 + hash(i * 5) * 3.5 + i * 0.2), V.fz + 3.2 + hash(i * 11) * 8 + i * 0.35]; }
  function slabSpot(i) { const r = Math.floor(i / 4), q = i % 4; return [-0.55 - q * 0.62 - r * 0.3, V.fz + 2.1 + q * 0.45 + r * 1.5]; }

  // ── 사람(뒷모습) ─────────────────────────────────────────
  const SKIN = '#e5b995', SKIN_D = '#b27d5c', SKIN_S = '#c99573', HAIR = '#2b211c', HAIR_L = '#5a463b';
  function limb(c, ax, ay, bx, by, w, col, dark) {
    c.lineCap = 'round';
    c.strokeStyle = dark; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
  }
  // 굵기가 줄어드는 팔다리 한 토막(둥근 끝). 빛은 왼쪽 위
  function taper(c, ax, ay, bx, by, wa, wb, col, dark, lite) {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, an = Math.atan2(dy, dx);
    c.beginPath();
    c.moveTo(ax + nx * wa / 2, ay + ny * wa / 2); c.lineTo(bx + nx * wb / 2, by + ny * wb / 2);
    c.arc(bx, by, wb / 2, an + Math.PI / 2, an - Math.PI / 2, true);
    c.lineTo(ax - nx * wa / 2, ay - ny * wa / 2);
    c.arc(ax, ay, wa / 2, an - Math.PI / 2, an + Math.PI / 2, true);
    c.closePath();
    const g = c.createLinearGradient(ax - nx * wa, ay - ny * wa, ax + nx * wa, ay + ny * wa);
    const litSide = nx < 0 ? 0 : 1;   // 왼쪽(화면)으로 향한 면이 밝다
    g.addColorStop(litSide, lite || col); g.addColorStop(0.5, col); g.addColorStop(1 - litSide, dark);
    c.fillStyle = g; c.fill();
    c.strokeStyle = dark; c.lineWidth = 1.3; c.stroke();
  }
  // 팔: 어깨→팔꿈치→손. 반팔 소매가 위팔 절반을 덮는다
  function arm(c, s, sx, sy, e, h, shirt, shirtD, side, part) {
    side = side || (sx < 0 ? -1 : 1); part = part || 'all';
    const ex = e[0] * s, ey = e[1] * s, hx = h[0] * s, hy = h[1] * s;   // 팔꿈치·손은 몸 가운데 기준
    if (part !== 'lower') {
      taper(c, sx, sy, ex, ey, 0.082 * s, 0.066 * s, SKIN, SKIN_D, '#f3cfae');
      const mx = sx + (ex - sx) * 0.48, my = sy + (ey - sy) * 0.48;   // 소매
      taper(c, sx, sy, mx, my, 0.092 * s, 0.09 * s, shirt, shirtD, '#8b9bb6');
      if (part === 'upper') return [hx, hy];
    }
    taper(c, ex, ey, hx, hy, 0.064 * s, 0.05 * s, SKIN, SKIN_D, '#f3cfae');
    // 손(주먹 쥔 듯 둥근 덩어리 + 엄지 자국)
    c.fillStyle = SKIN; c.strokeStyle = SKIN_D; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(hx, hy + 0.008 * s, 0.036 * s, 0.03 * s, Math.atan2(hy - ey, hx - ex), 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(150,90,60,.5)'; c.beginPath(); c.moveTo(hx - side * 0.012 * s, hy - 0.004 * s); c.lineTo(hx + side * 0.01 * s, hy + 0.012 * s); c.stroke();
    return [hx, hy];
  }
  function headBack(c, s, hx, hy, turn) {
    const rx = 0.11 * s, ry = 0.13 * s, tx = turn * 0.012 * s;
    // 귀: 머리카락 아래로 반쯤 보인다
    [-1, 1].forEach(d => {
      const ex = hx + d * (rx * 0.98 - turn * d * 0.01 * s), ey = hy + 0.012 * s;
      c.fillStyle = SKIN_S; c.strokeStyle = SKIN_D; c.lineWidth = 1.1;
      c.beginPath(); c.ellipse(ex, ey, 0.022 * s, 0.036 * s, d * 0.25, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(140,80,55,.55)'; c.beginPath(); c.arc(ex + d * 0.003 * s, ey, 0.011 * s, -1.3, 1.3); c.stroke();
    });
    // 뒷머리: 둥근 머리 위를 덮고, 목덜미에서 둥글게 모이는 짧은 머리
    c.beginPath();
    c.moveTo(hx - rx * 1.04, hy + ry * 0.12);
    c.bezierCurveTo(hx - rx * 1.16, hy - ry * 1.02, hx + rx * 1.16, hy - ry * 1.02, hx + rx * 1.04, hy + ry * 0.12);
    c.bezierCurveTo(hx + rx * 0.98, hy + ry * 0.5, hx + rx * 0.62, hy + ry * 0.66, hx + rx * 0.3, hy + ry * 0.76);
    c.quadraticCurveTo(hx + tx, hy + ry * 0.9, hx - rx * 0.3, hy + ry * 0.76);
    c.bezierCurveTo(hx - rx * 0.62, hy + ry * 0.66, hx - rx * 0.98, hy + ry * 0.5, hx - rx * 1.04, hy + ry * 0.12);
    c.closePath();
    let g = c.createRadialGradient(hx - rx * 0.4, hy - ry * 0.55, rx * 0.1, hx, hy, rx * 1.35);
    g.addColorStop(0, HAIR_L); g.addColorStop(0.45, HAIR); g.addColorStop(1, '#130e0b');
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // 결: 가마에서 아래로 흘러내린다
    const wx = hx + rx * 0.14 + tx, wy = hy - ry * 0.52;
    for (let i = 0; i < 12; i++) {
      const u = (i + hash(i * 3) * 0.6) / 12, a = -0.1 + u * (Math.PI + 0.2), len = 0.75 + hash(i * 7) * 0.3;
      const ex = hx + Math.cos(a) * rx * 1.1 * len, ey = hy + (Math.sin(a) * ry * 0.95 + ry * 0.05) * len;
      c.strokeStyle = hash(i * 5) > 0.6 ? 'rgba(130,104,86,.28)' : 'rgba(8,5,4,.28)';
      c.lineWidth = Math.max(0.8, s * 0.005);
      c.beginPath(); c.moveTo(wx, wy);
      c.bezierCurveTo(wx + (ex - wx) * 0.35, wy + ry * 0.05, ex - (ex - hx) * 0.15, ey - ry * 0.4, ex, ey);
      c.stroke();
    }
    for (let i = 0; i < 5; i++) {   // 위로 넘어간 짧은 결
      const a = -Math.PI + 0.5 + i * 0.45;
      c.strokeStyle = 'rgba(12,8,6,.22)'; c.lineWidth = Math.max(0.8, s * 0.005);
      c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + Math.cos(a) * rx * 0.4, wy + Math.sin(a) * ry * 0.3, hx + Math.cos(a) * rx * 0.85, hy + Math.sin(a) * ry * 0.8); c.stroke();
    }
    c.fillStyle = 'rgba(8,5,4,.6)'; c.beginPath(); c.arc(wx, wy, s * 0.007, 0, TAU); c.fill();
    // 윤기
    c.strokeStyle = 'rgba(255,236,214,.2)'; c.lineWidth = Math.max(1.5, s * 0.02); c.lineCap = 'round';
    c.beginPath(); c.arc(hx, hy - ry * 0.05, rx * 0.8, -2.55, -1.85); c.stroke();
    // 아래쪽 그늘
    g = c.createLinearGradient(0, hy + ry * 0.2, 0, hy + ry * 0.9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = g; c.fillRect(hx - rx * 1.3, hy, rx * 2.6, ry);
    c.restore();
    // 목덜미 잔머리
    c.strokeStyle = 'rgba(30,22,18,.28)'; c.lineWidth = Math.max(0.6, s * 0.0025);
    for (let i = 0; i < 7; i++) {
      const u = (i + 0.5) / 7, x = hx - rx * 0.5 + u * rx * 1.0, y0 = hy + ry * (0.7 + 0.16 * Math.sin(u * Math.PI));
      c.beginPath(); c.moveTo(x, y0 - 0.01 * s); c.lineTo(x + (u - 0.5) * 0.006 * s, y0 + 0.004 * s); c.stroke();
    }
    c.strokeStyle = '#120d0b'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(hx - rx * 1.04, hy + ry * 0.12);
    c.bezierCurveTo(hx - rx * 1.16, hy - ry * 1.02, hx + rx * 1.16, hy - ry * 1.02, hx + rx * 1.04, hy + ry * 0.12); c.stroke();
  }
  // 앉은 사람(책상다리, 뒷모습). pose: idle/scratch/count/dig/stack/talk/carve, p: 0~1 동작 진행
  function sitter(c, x, y, s, pose, p, t, opt) {
    opt = opt || {};
    const shirt = opt.shirt || '#5d6d88', shirtD = '#2c3547';
    const breath = Math.sin(t * 1.6) * 0.005;
    const k = Math.sin(p * Math.PI); // 0→1→0
    let lean = 0, tilt = Math.sin(t * 0.4) * 0.02, turn = 0;
    let R = { e: [0.19, -0.2], h: [0.25, -0.1], f: 1 }, L = { e: [-0.19, -0.2], h: [-0.25, -0.1], f: 1 };
    let prop = null;
    if (pose === 'scratch') { R = { e: [0.23, -0.21], h: [0.37 + 0.05 * Math.sin(p * TAU * 2), -0.03] }; lean = 0.12 * k; tilt = 0.06; }
    else if (pose === 'count') { R = { e: [0.32, -0.5 - 0.04 * k], h: [0.27, -0.72 - 0.06 * k] }; tilt = -0.04 * k; prop = 'finger'; }
    else if (pose === 'dig') { lean = 0.3 * (0.5 + 0.5 * k); R = { e: [0.19, -0.2], h: [0.13, -0.05 - 0.05 * k], f: 1 }; L = { e: [-0.19, -0.2], h: [-0.13, -0.05 - 0.05 * k], f: 1 }; }
    else if (pose === 'stack') { R = { e: [0.36, -0.54 - 0.08 * k], h: [0.44, -0.72 - 0.14 * k] }; prop = 'stone'; tilt = 0.06 * k; }
    else if (pose === 'talk') { turn = Math.sin(p * TAU) * 0.6; tilt = Math.sin(t * 3) * 0.04; }
    else if (pose === 'carve') { R = { e: [0.36, -0.45 + 0.1 * k], h: [0.5, -0.6 + 0.36 * k] }; lean = 0.08; tilt = 0.08; prop = 'hammer'; }
    else if (pose === 'draw') { R = { e: [0.2, -0.18], h: [0.16 + 0.06 * Math.sin(t * 9), -0.02], f: 1 }; L = { e: [-0.19, -0.2], h: [-0.25, -0.09], f: 1 }; lean = 0.22; tilt = 0.1; }
    c.save(); c.translate(x, y);
    // 그림자(바닥에 붙은 진한 가운데 + 넓게 퍼진 옅은 그늘)
    let g = c.createRadialGradient(0, -0.01 * s, 0, 0, -0.01 * s, 0.56 * s);
    g.addColorStop(0, 'rgba(55,45,35,.42)'); g.addColorStop(0.55, 'rgba(55,45,35,.16)'); g.addColorStop(1, 'rgba(55,45,35,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, -0.005 * s, 0.56 * s, 0.1 * s, 0, 0, TAU); c.fill();
    // 책상다리: 엉덩이에서 양 무릎까지 한 덩어리
    c.beginPath();
    c.moveTo(-0.405 * s, -0.035 * s);
    c.bezierCurveTo(-0.42 * s, -0.1 * s, -0.33 * s, -0.15 * s, -0.2 * s, -0.16 * s);
    c.lineTo(0.2 * s, -0.16 * s);
    c.bezierCurveTo(0.33 * s, -0.15 * s, 0.42 * s, -0.1 * s, 0.405 * s, -0.035 * s);
    c.bezierCurveTo(0.39 * s, 0.005 * s, 0.3 * s, 0.012 * s, 0.2 * s, 0.004 * s);
    c.quadraticCurveTo(0, 0.02 * s, -0.2 * s, 0.004 * s);
    c.bezierCurveTo(-0.3 * s, 0.012 * s, -0.39 * s, 0.005 * s, -0.405 * s, -0.035 * s);
    c.closePath();
    g = c.createLinearGradient(-0.4 * s, -0.16 * s, 0.4 * s, 0.02 * s);
    g.addColorStop(0, '#5a6378'); g.addColorStop(0.45, '#3f4759'); g.addColorStop(1, '#232834');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#1a1e27'; c.lineWidth = 1.6; c.stroke();
    c.save(); c.clip();
    // 무릎 둥근 빛, 허벅지 주름
    [-1, 1].forEach(d => {
      const kg = c.createRadialGradient(d * 0.33 * s, -0.09 * s, 0, d * 0.33 * s, -0.09 * s, 0.1 * s);
      kg.addColorStop(0, d < 0 ? 'rgba(170,185,210,.28)' : 'rgba(150,165,190,.12)'); kg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = kg; c.fillRect(-0.5 * s, -0.2 * s, s, 0.25 * s);
      c.strokeStyle = 'rgba(15,18,26,.45)'; c.lineWidth = Math.max(1, s * 0.006);
      c.beginPath(); c.moveTo(d * 0.14 * s, -0.12 * s); c.quadraticCurveTo(d * 0.22 * s, -0.09 * s, d * 0.28 * s, -0.11 * s); c.stroke();
      c.beginPath(); c.moveTo(d * 0.18 * s, -0.05 * s); c.quadraticCurveTo(d * 0.25 * s, -0.035 * s, d * 0.31 * s, -0.05 * s); c.stroke();
    });
    c.restore();
    const H = 1 - lean * 0.35, sy = -0.11 * s, top = sy - 0.4 * s * H + breath * s;
    const shx = 0.158 * s, shy = top + 0.055 * s;
    // 앞(무릎)으로 뻗은 아래팔·손은 몸통 뒤에 가린다
    if (L.f) arm(c, s, -shx, shy, L.e, L.h, shirt, shirtD, -1, 'lower');
    if (R.f) arm(c, s, shx, shy, R.e, R.h, shirt, shirtD, 1, 'lower');
    // 몸통(반팔 티): 허리는 가늘고 어깨는 둥글다
    c.beginPath();
    c.moveTo(-0.165 * s, sy + 0.02 * s);
    c.bezierCurveTo(-0.145 * s, sy - 0.12 * s * H, -0.17 * s, top + 0.16 * s, -0.178 * s, top + 0.08 * s);
    c.bezierCurveTo(-0.18 * s, top + 0.025 * s, -0.14 * s, top - 0.012 * s, -0.06 * s, top - 0.018 * s);
    c.quadraticCurveTo(0, top + 0.005 * s, 0.06 * s, top - 0.018 * s);
    c.bezierCurveTo(0.14 * s, top - 0.012 * s, 0.18 * s, top + 0.025 * s, 0.178 * s, top + 0.08 * s);
    c.bezierCurveTo(0.17 * s, top + 0.16 * s, 0.145 * s, sy - 0.12 * s * H, 0.165 * s, sy + 0.02 * s);
    c.quadraticCurveTo(0, sy + 0.035 * s, -0.165 * s, sy + 0.02 * s);
    c.closePath();
    g = c.createLinearGradient(-0.21 * s, top, 0.21 * s, sy);
    g.addColorStop(0, '#8e9dba'); g.addColorStop(0.4, shirt); g.addColorStop(1, '#343d51');
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // 등골 오목, 날개뼈, 허리 주름, 목둘레
    let sg = c.createLinearGradient(-0.05 * s, 0, 0.05 * s, 0);
    sg.addColorStop(0, 'rgba(20,26,40,0)'); sg.addColorStop(0.5, 'rgba(20,26,40,.22)'); sg.addColorStop(1, 'rgba(20,26,40,0)');
    c.fillStyle = sg; c.fillRect(-0.05 * s, top, 0.1 * s, sy - top);
    [-1, 1].forEach(d => {
      const bg = c.createRadialGradient(d * 0.09 * s, top + 0.1 * s, 0, d * 0.09 * s, top + 0.1 * s, 0.09 * s);
      bg.addColorStop(0, d < 0 ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = bg; c.fillRect(-0.3 * s, top, 0.6 * s, 0.25 * s);
      c.strokeStyle = 'rgba(20,26,40,.22)'; c.lineWidth = Math.max(1, s * 0.005);
      c.beginPath(); c.moveTo(d * 0.14 * s, top + 0.07 * s); c.quadraticCurveTo(d * 0.07 * s, top + 0.14 * s, d * 0.11 * s, top + 0.21 * s); c.stroke();
    });
    c.strokeStyle = 'rgba(20,26,40,.16)'; c.lineWidth = Math.max(1, s * 0.005);
    for (let i = 0; i < 2; i++) { const yy = sy - 0.035 * s - i * 0.05 * s, x0 = (i ? 0.02 : -0.12) * s; c.beginPath(); c.moveTo(x0, yy); c.quadraticCurveTo(x0 + 0.05 * s, yy + 0.01 * s, x0 + 0.1 * s, yy - 0.004 * s); c.stroke(); }
    c.restore();
    c.strokeStyle = shirtD; c.lineWidth = 1.7; c.stroke();
    // 목과 목둘레 깃
    g = c.createLinearGradient(-0.04 * s, 0, 0.04 * s, 0); g.addColorStop(0, SKIN); g.addColorStop(1, SKIN_D);
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.044 * s, top); c.lineTo(-0.038 * s, top - 0.1 * s); c.lineTo(0.038 * s, top - 0.1 * s); c.lineTo(0.044 * s, top); c.closePath(); c.fill();
    c.fillStyle = 'rgba(90,50,30,.35)'; c.fillRect(-0.04 * s, top - 0.08 * s, 0.08 * s, 0.025 * s);
    c.strokeStyle = '#46526a'; c.lineWidth = Math.max(2, s * 0.014); c.beginPath(); c.moveTo(-0.07 * s, top - 0.018 * s); c.quadraticCurveTo(0, top + 0.012 * s, 0.07 * s, top - 0.018 * s); c.stroke();
    // 팔
    arm(c, s, -shx, shy, L.e, L.h, shirt, shirtD, -1, L.f ? 'upper' : 'all');
    const hh = arm(c, s, shx, shy, R.e, R.h, shirt, shirtD, 1, R.f ? 'upper' : 'all');
    if (prop === 'stone') c.drawImage(stoneSprite(3), hh[0] - 0.08 * s, hh[1] - 0.1 * s, 0.16 * s, 0.12 * s);
    if (prop === 'finger') { c.strokeStyle = SKIN_D; c.lineWidth = 0.02 * s + 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(hh[0], hh[1]); c.lineTo(hh[0] + 0.004 * s, hh[1] - 0.06 * s); c.stroke(); c.strokeStyle = SKIN; c.lineWidth = 0.02 * s; c.stroke(); }
    if (prop === 'hammer') drawHammer(c, s, hh[0], hh[1]);
    // 머리
    c.save(); c.translate(0, top - 0.165 * s); c.rotate(tilt);
    headBack(c, s, turn * 0.015 * s, 0, turn);
    c.restore();
    c.restore();
    return { head: [x, y + (top - 0.165 * s)], hand: [x + hh[0], y + hh[1]] };
  }
  function drawChisel(c, s, x, y) { c.strokeStyle = '#555'; c.lineWidth = 0.02 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.02 * s, y + 0.12 * s); c.stroke(); }
  function drawHammer(c, s, x, y) {
    c.strokeStyle = '#6b4a2e'; c.lineWidth = 0.024 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.06 * s, y - 0.13 * s); c.stroke();
    c.save(); c.translate(x + 0.065 * s, y - 0.14 * s); c.rotate(0.45); c.fillStyle = '#6e7074'; c.strokeStyle = '#2e3033'; c.lineWidth = 1.2; c.fillRect(-0.06 * s, -0.025 * s, 0.12 * s, 0.05 * s); c.strokeRect(-0.06 * s, -0.025 * s, 0.12 * s, 0.05 * s); c.restore();
  }
  // 선 사람(뒷모습, 걷기). ph = 걸음 위상
  function walker(c, x, y, s, ph, opt) {
    opt = opt || {};
    const shirt = opt.shirt || '#5b6b86', shirtD = '#2f3848';
    const sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 0.02 * s;
    c.save(); c.translate(x, y - bob);
    let g = c.createRadialGradient(0, bob, 0, 0, bob, 0.4 * s); g.addColorStop(0, 'rgba(60,50,40,.3)'); g.addColorStop(1, 'rgba(60,50,40,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, bob, 0.4 * s, 0.07 * s, 0, 0, TAU); c.fill();
    const hip = -0.88 * s;
    // 다리: 뒤에서 보면 한쪽 발이 들려 짧아 보인다
    [-1, 1].forEach(d => {
      const lift = Math.max(0, d * sw) * 0.2 * s, knee = hip * 0.5 - lift * 0.3;
      limb(c, d * 0.075 * s, hip, d * 0.08 * s, knee, 0.125 * s, '#3b4355', '#1c2029');
      limb(c, d * 0.08 * s, knee, d * 0.085 * s, -0.04 * s - lift, 0.11 * s, lift > 0.02 * s ? '#333a4a' : '#3b4355', '#1c2029');
      c.fillStyle = '#2b2b2e'; rr(c, d * 0.085 * s - 0.055 * s, -0.07 * s - lift, 0.11 * s, 0.07 * s, 0.03 * s); c.fill();
    });
    const top = -1.42 * s;
    // 팔 흔들기
    [-1, 1].forEach(d => { const a = -d * sw * 0.08; arm(c, s, d * 0.2 * s, top + 0.05 * s, [d * 0.24, -1.16 + a], [d * 0.25 + a * 0.4, -0.92], shirt, shirtD); });
    c.beginPath();
    c.moveTo(-0.17 * s, hip + 0.03 * s); c.bezierCurveTo(-0.2 * s, hip - 0.2 * s, -0.22 * s, top + 0.1 * s, -0.2 * s, top + 0.03 * s);
    c.quadraticCurveTo(-0.17 * s, top - 0.02 * s, -0.06 * s, top - 0.03 * s); c.lineTo(0.06 * s, top - 0.03 * s);
    c.quadraticCurveTo(0.17 * s, top - 0.02 * s, 0.2 * s, top + 0.03 * s); c.bezierCurveTo(0.22 * s, top + 0.1 * s, 0.2 * s, hip - 0.2 * s, 0.17 * s, hip + 0.03 * s);
    c.closePath();
    g = c.createLinearGradient(-0.22 * s, 0, 0.22 * s, 0); g.addColorStop(0, '#8595b0'); g.addColorStop(0.35, shirt); g.addColorStop(1, '#3a4459');
    c.fillStyle = g; c.fill(); c.strokeStyle = shirtD; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = SKIN_D; c.fillRect(-0.042 * s, top - 0.07 * s, 0.084 * s, 0.06 * s);
    c.save(); c.translate(0, top - 0.17 * s); headBack(c, s, 0, 0, 0); c.restore();
    c.restore();
  }
  // 먼저 온 사람(앞모습). 긴 잿빛 머리, 옅은 겉옷
  function stranger(c, x, y, s, ph, walking) {
    const sw = walking ? Math.sin(ph) : 0, bob = walking ? Math.abs(Math.cos(ph)) * 0.02 * s : 0;
    c.save(); c.translate(x, y - bob);
    let g = c.createRadialGradient(0, bob, 0, 0, bob, 0.4 * s); g.addColorStop(0, 'rgba(60,50,40,.3)'); g.addColorStop(1, 'rgba(60,50,40,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, bob, 0.4 * s, 0.07 * s, 0, 0, TAU); c.fill();
    const hip = -0.86 * s, top = -1.4 * s;
    [-1, 1].forEach(d => { const lift = Math.max(0, d * sw) * 0.08 * s; limb(c, d * 0.07 * s, hip, d * 0.08 * s, -0.04 * s - lift, 0.11 * s, '#7d776d', '#4e4a44');
      c.fillStyle = '#3a3632'; rr(c, d * 0.08 * s - 0.05 * s, -0.07 * s - lift, 0.1 * s, 0.07 * s, 0.03 * s); c.fill(); });
    // 긴 겉옷
    c.beginPath(); c.moveTo(-0.2 * s, top + 0.03 * s); c.quadraticCurveTo(-0.24 * s, -0.8 * s, -0.26 * s, -0.36 * s); c.lineTo(0.26 * s, -0.36 * s);
    c.quadraticCurveTo(0.24 * s, -0.8 * s, 0.2 * s, top + 0.03 * s); c.quadraticCurveTo(0, top - 0.05 * s, -0.2 * s, top + 0.03 * s); c.closePath();
    g = c.createLinearGradient(-0.26 * s, 0, 0.26 * s, 0); g.addColorStop(0, '#e9e5dd'); g.addColorStop(0.5, '#cdc7bc'); g.addColorStop(1, '#9d968a');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#6f695f'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(90,84,76,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, top + 0.02 * s); c.lineTo(0, -0.38 * s); c.stroke();
    [-1, 1].forEach(d => { const a = d * sw * 0.06; limb(c, d * 0.2 * s, top + 0.05 * s, d * 0.25 * s, -1.02 * s + a * s, 0.085 * s, '#d8d2c7', '#6f695f');
      limb(c, d * 0.25 * s, -1.02 * s + a * s, d * 0.24 * s, -0.8 * s, 0.06 * s, SKIN, SKIN_D); });
    // 머리(앞모습)
    const hy = top - 0.17 * s;
    c.fillStyle = '#8a857e'; c.beginPath(); c.ellipse(0, hy + 0.06 * s, 0.14 * s, 0.24 * s, 0, 0, TAU); c.fill();
    g = c.createLinearGradient(-0.1 * s, hy, 0.1 * s, hy); g.addColorStop(0, '#f0caa9'); g.addColorStop(1, '#c9967a');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, hy + 0.01 * s, 0.092 * s, 0.118 * s, 0, 0, TAU); c.fill(); c.strokeStyle = SKIN_D; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#2b2622'; [-1, 1].forEach(d => { c.beginPath(); c.ellipse(d * 0.035 * s, hy + 0.0 * s, 0.011 * s, 0.014 * s, 0, 0, TAU); c.fill(); });
    c.strokeStyle = 'rgba(120,70,60,.7)'; c.lineWidth = Math.max(1, 0.008 * s); c.beginPath(); c.moveTo(-0.02 * s, hy + 0.06 * s); c.quadraticCurveTo(0, hy + 0.07 * s, 0.02 * s, hy + 0.06 * s); c.stroke();
    // 앞머리
    c.fillStyle = '#9c968d'; c.beginPath(); c.moveTo(-0.11 * s, hy + 0.02 * s); c.bezierCurveTo(-0.12 * s, hy - 0.16 * s, 0.12 * s, hy - 0.16 * s, 0.11 * s, hy + 0.02 * s);
    c.quadraticCurveTo(0.06 * s, hy - 0.07 * s, 0, hy - 0.05 * s); c.quadraticCurveTo(-0.06 * s, hy - 0.07 * s, -0.11 * s, hy + 0.02 * s); c.fill();
    c.strokeStyle = 'rgba(230,226,218,.5)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-0.05 * s + i * 0.025 * s, hy - 0.11 * s); c.quadraticCurveTo(-0.08 * s + i * 0.04 * s, hy - 0.02 * s, -0.12 * s + i * 0.06 * s, hy + 0.2 * s); c.stroke(); }
    c.restore();
  }

  // 떠올린 기억: 빛으로 된 윤곽이 잠깐 나타난다
  function memoryFx(c, w, h, id, pr, t) {
    const a = Math.sin(clamp(pr, 0, 1) * Math.PI);
    if (a <= 0) return;
    c.save();
    c.shadowColor = 'rgba(255,170,60,.95)'; c.shadowBlur = 16;
    c.strokeStyle = `rgba(222,138,34,${0.95 * a})`; c.lineWidth = Math.max(2, V.f * 0.006); c.lineJoin = 'round'; c.lineCap = 'round';
    const draw = (pts, cx, cy, sc) => { c.beginPath(); pts.forEach((p, i) => { const x = cx + p[0] * sc, y = cy + p[1] * sc; if (!i) c.moveTo(x, y); else c.lineTo(x, y); }); c.stroke(); };
    if (id === 'dog') { // 인물 둘레를 뛰어다니는 강아지
      const ang = pr * TAU * 1.5, z = V.fz + 0.6 + Math.sin(ang) * 1.1, x = Math.cos(ang) * 1.05;
      const [sx, sy, sc] = proj(x, z); const S = sc * 0.55, run = Math.sin(t * 16) * 0.12, dir = Math.sin(ang) > 0 ? 1 : -1;
      c.save(); c.translate(sx, sy); c.scale(dir, 1);
      draw([[-0.5, -0.45], [0.25, -0.45], [0.42, -0.75], [0.55, -0.72], [0.62, -0.62], [0.5, -0.45], [0.42, -0.35], [0.3, -0.3], [-0.45, -0.3], [-0.5, -0.45], [-0.75, -0.7]], 0, 0, S);
      draw([[-0.4, -0.3], [-0.45 - run, 0]], 0, 0, S); draw([[-0.25, -0.3], [-0.2 + run, 0]], 0, 0, S);
      draw([[0.2, -0.3], [0.15 + run, 0]], 0, 0, S); draw([[0.32, -0.3], [0.38 - run, 0]], 0, 0, S);
      draw([[0.44, -0.74], [0.47, -0.88], [0.52, -0.74]], 0, 0, S);
      c.restore();
    } else if (id === 'chicken') {
      const [sx, sy, sc] = proj(0.6, V.fz - 0.3); const S = sc * 0.5, cy = sy - sc * 1.25;
      draw([[-0.3, 0.1], [-0.2, -0.2], [0.05, -0.32], [0.3, -0.2], [0.35, 0.05], [0.15, 0.22], [0.05, 0.25], [-0.05, 0.45], [-0.12, 0.55], [-0.2, 0.5], [-0.18, 0.4], [-0.25, 0.3], [-0.3, 0.1]], sx, cy, S);
      for (let i = 0; i < 3; i++) { const ph = t * 2 + i; c.beginPath(); c.moveTo(sx + (i - 1) * S * 0.2, cy - S * 0.4); c.bezierCurveTo(sx + (i - 1) * S * 0.2 + Math.sin(ph) * S * 0.12, cy - S * 0.6, sx + (i - 1) * S * 0.2 - Math.sin(ph) * S * 0.12, cy - S * 0.8, sx + (i - 1) * S * 0.2, cy - S * (1 + pr * 0.3)); c.stroke(); }
    } else if (id === 'car') {
      const x = -9 + pr * 18, [sx, sy, sc] = proj(x, 11); const S = sc * 2.2;
      draw([[-0.9, 0], [-0.9, -0.28], [-0.55, -0.32], [-0.3, -0.58], [0.3, -0.58], [0.55, -0.32], [0.9, -0.28], [0.95, 0], [-0.9, 0]], sx, sy, S);
      [[-0.55, 0], [0.55, 0]].forEach(([wx]) => { c.beginPath(); c.arc(sx + wx * S, sy, S * 0.16, 0, TAU); c.stroke(); });
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(sx - S * (1.1 + i * 0.25), sy - S * (0.1 + i * 0.12)); c.lineTo(sx - S * (1.5 + i * 0.35), sy - S * (0.1 + i * 0.12)); c.stroke(); }
    } else if (id === 'trip') { // 지평선에 물결
      c.strokeStyle = `rgba(60,140,190,${0.8 * a})`; c.shadowColor = 'rgba(120,200,240,.9)';
      for (let r = 0; r < 4; r++) { c.beginPath(); for (let i = 0; i <= 60; i++) { const xx = i / 60 * w, yy = V.hy - 8 - r * h * 0.022 + Math.sin(i * 0.5 + t * 2 + r) * (2 + r); if (!i) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); }
      c.beginPath(); c.arc(w * 0.72, V.hy - h * 0.06, h * 0.04, Math.PI, 0); c.stroke();
    } else if (id === 'watch') {
      const cx = w / 2, cy = V.hy - h * 0.12, R = h * 0.1;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; c.beginPath(); c.moveTo(cx + Math.cos(an) * R * 0.82, cy + Math.sin(an) * R * 0.82); c.lineTo(cx + Math.cos(an) * R * 0.95, cy + Math.sin(an) * R * 0.95); c.stroke(); }
      const sa = -Math.PI / 2 + Math.floor(t * 4) / 60 * TAU * 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(sa) * R * 0.85, cy + Math.sin(sa) * R * 0.85); c.stroke();
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * 0.45, cy - R * 0.1); c.stroke();
    } else if (id === 'sports') {
      for (let i = 0; i < 14; i++) { const z = 30 - ((pr * 60 + i * 2.1) % 29), xx = (hash(i) - 0.5) * 7; const p = proj(xx, z), q = proj(xx, z + 1.6); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
      const z = lerp(30, 3, pr), [sx, sy, sc] = proj(1.8, z), S = sc * 1.1;
      draw([[-1, 0], [-1, -0.2], [-0.4, -0.3], [-0.1, -0.5], [0.4, -0.5], [0.8, -0.25], [1, -0.2], [1, 0], [-1, 0]], sx, sy, S);
    }
    c.restore();
  }


  // ── 손가락으로 그린 그림 ───────────────────────────────────
  // 그림 n 번째(벽화 m = n/12) 자리: 인물 둘레 반원, 벽화가 늘수록 바깥 줄
  function muralSpot(m, i) { const a = Math.PI * (0.04 + 0.92 * i / 11), r = 1.6 + m * 1.15; return [Math.cos(a) * r * 1.25, V.fz + 0.2 + Math.sin(a) * r * 0.85, 0.6 + m * 0.12]; }
  function replySpot(m) { return [(m - 1) * 1.9 - 0.5, V.fz + 4.2 + m * 0.6, 2.1]; }
  const REPLY = ['hand', 'pair', 'door'];
  function carve(c, strokes, map, lw, lit, upto) {
    const path = () => { let cnt = 0; c.beginPath(); for (const st of strokes) { for (let k = 0; k < st.length; k++) { if (upto != null && cnt++ > upto) return; const q = map(st[k]); if (!k) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); } } };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(lw * 0.45, lw * 0.6); path(); c.strokeStyle = 'rgba(255,253,246,.6)'; c.lineWidth = lw; c.stroke(); c.restore();
    path(); c.strokeStyle = 'rgba(66,56,46,.85)'; c.lineWidth = lw; c.stroke();
    if (lit > 0) {
      path(); c.strokeStyle = `rgba(255,190,90,${0.28 * lit})`; c.lineWidth = lw * 4; c.stroke();
      path(); c.strokeStyle = `rgba(255,226,160,${0.95 * lit})`; c.lineWidth = lw * 0.9; c.stroke();
    }
  }
  function playerPics(c, S, t) {
    const Dw = S.drw; if (!Dw || !Dw.pics) return;
    const ev = S.muralFx;
    Dw.pics.forEach((strokes, n) => {
      const m = Math.floor(n / 12), i = n % 12, [x0, z0, sc] = muralSpot(m, i);
      if (z0 < 1.4) return;
      let lit = Dw.murals > m ? 0.75 + 0.25 * Math.sin(t * 1.5 + i) : 0;
      if (ev && ev.m === m) lit = clamp((ev.t - i * 0.25) / 0.3, 0, 1);
      const lw = Math.max(1, V.f / z0 * 0.012);
      carve(c, strokes, p => proj(x0 + p[0] * sc, z0 - p[1] * sc * 0.9), lw, lit);
    });
    // 이어진 빛줄기(별자리)와 저 멀리서 온 대답
    for (let m = 0; m < 3; m++) {
      const playing = ev && ev.m === m, done = Dw.murals > m;
      if (!playing && !done) continue;
      const k1 = playing ? clamp((ev.t - 3) / 1, 0, 1) : 1;
      if (k1 > 0) {
        c.strokeStyle = `rgba(255,205,120,${playing ? 0.8 : 0.35})`; c.lineWidth = Math.max(1, V.f * 0.002); c.beginPath();
        for (let i = 0; i <= 11 * k1; i++) { const [x, z] = muralSpot(m, i), q = proj(x, z); if (!i) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); }
        c.stroke();
      }
      const k2 = playing ? clamp((ev.t - 4) / 2.6, 0, 1) : 1;
      if (k2 > 0) {
        const [rx, rz, rs] = replySpot(m), strokes = picPath(REPLY[m]);
        const total = strokes.reduce((a, st) => a + st.length, 0);
        const [bx, by, bs] = proj(rx, rz), S2 = bs * rs;
        const gl = c.createRadialGradient(bx, by - S2 * 0.5, 0, bx, by - S2 * 0.5, S2 * 0.9);
        gl.addColorStop(0, `rgba(255,214,140,${0.35 * (playing ? k2 : 0.6)})`); gl.addColorStop(1, 'rgba(255,214,140,0)');
        c.fillStyle = gl; c.fillRect(bx - S2, by - S2 * 1.4, S2 * 2, S2 * 1.6);
        c.fillStyle = 'rgba(255,200,120,.25)'; c.beginPath(); c.ellipse(bx, by, S2 * 0.4, S2 * 0.06, 0, 0, TAU); c.fill();
        carve(c, strokes, q => [bx + q[0] * S2 * 0.5, by - S2 * (1.05 - q[1]) * 0.5], Math.max(1.5, S2 * 0.03), playing ? 1 : 0.75 + 0.25 * Math.sin(t * 1.2 + m), k2 < 1 ? Math.floor(total * k2) : null);
      }
    }
  }
  // 바닥 가까이 보기(그리기 화면)
  const DG = { cv: null, w: 0, h: 0 };
  function drawCloseup(c, w, h, D, t) {
    if (!DG.cv || DG.w !== w || DG.h !== h) {
      DG.w = w; DG.h = h; DG.cv = mk(Math.ceil(w), Math.ceil(h)); const g2 = DG.cv.getContext('2d');
      const g = g2.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#e2dcd1'); g.addColorStop(1, '#d3cbbd');
      g2.fillStyle = g; g2.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const x = hash(i * 3) * w, y = hash(i * 5) * h, r = 30 + hash(i * 7) * 120;
        const bg = g2.createRadialGradient(x, y, 0, x, y, r); bg.addColorStop(0, hash(i) > 0.5 ? 'rgba(120,105,85,.06)' : 'rgba(255,255,250,.08)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = bg; g2.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let i = 0; i < w * h / 40; i++) { g2.fillStyle = Math.random() > 0.5 ? 'rgba(90,78,62,.12)' : 'rgba(255,255,250,.14)'; const r = 0.6 + Math.random() * 1.4; g2.fillRect(Math.random() * w, Math.random() * h, r, r); }
      // 예전에 긁은 자국이 흐릿하게
      g2.lineCap = 'round';
      for (let k = 0; k < 40; k++) { const x = hash(k * 13) * w, y = hash(k * 17) * h, L = 18 + hash(k) * 10, rot = hash(k * 3) * 0.5 - 0.25;
        for (let j = 0; j < 5; j++) { g2.strokeStyle = 'rgba(90,78,64,.18)'; g2.lineWidth = 1.5; g2.beginPath();
          if (j < 4) { g2.moveTo(x + j * 6, y); g2.lineTo(x + j * 6 + Math.sin(rot) * L, y + L); } else { g2.moveTo(x - 4, y + L * 0.7); g2.lineTo(x + 24, y + L * 0.3); } g2.stroke(); } }
      const vg = g2.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.max(w, h) * 0.75);
      vg.addColorStop(0, 'rgba(80,70,60,0)'); vg.addColorStop(1, 'rgba(80,70,60,.3)'); g2.fillStyle = vg; g2.fillRect(0, 0, w, h);
    }
    c.drawImage(DG.cv, 0, 0, w, h);
    const map = p => [D.cx + p[0] * D.U, D.cy + p[1] * D.U];
    // 따라 그릴 점선
    if (!D.done) { // 아직 안 지나간 자리만 점선으로 — 남은 곳이 한눈에 보인다
      const T = D.targets, cov = D.cov, pulse = 0.85 + 0.15 * Math.sin(t * 5);
      c.lineCap = 'round';
      const seg = (col, lw) => { c.beginPath();
        for (let i = 0; i + 1 < T.length; i++) { if (cov[i] || T[i + 1][2] !== T[i][2] || i % 2) continue;
          const a = map(T[i]), b = map(T[i + 1]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.strokeStyle = col; c.lineWidth = lw; c.stroke(); };
      seg('rgba(70,58,44,.55)', D.U * 0.06);
      seg(`rgba(255,255,255,${pulse})`, D.U * 0.028);
    }
    // 내가 판 홈
    carve(c, D.strokes, map, Math.max(4, D.U * 0.05), D.done ? clamp(D.doneT * 2, 0, 1) : 0);
    // 벽화 진행(동그라미 12개)과 이 그림 진행
    const n = D.n % 12, r = Math.max(6, Math.min(11, w * 0.014)), gap = r * 2.9, x0 = w / 2 - gap * 5.5;
    for (let i = 0; i < 12; i++) {
      c.beginPath(); c.arc(x0 + i * gap, D.dotsY, r, 0, TAU);
      c.fillStyle = i < n ? '#ffcf6a' : i === n ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)'; c.fill();
      c.strokeStyle = '#1b2a5a'; c.lineWidth = 2.5; c.stroke();
    }
    const bw = gap * 11, by = D.dotsY + r + 8;
    c.fillStyle = 'rgba(27,42,90,.25)'; c.fillRect(w / 2 - bw / 2, by, bw, 6);
    c.fillStyle = '#ffcf6a'; c.fillRect(w / 2 - bw / 2, by, bw * clamp(D.prog / 0.7, 0, 1), 6);
    // 5억 년 중 얼마나 왔나(얇은 줄) — 다 차면 다음 5억 년으로 넘어간다
    c.fillStyle = 'rgba(60,54,46,.16)'; c.fillRect(0, h - 5, w, 5); c.fillStyle = 'rgba(59,53,48,.75)'; c.fillRect(0, h - 5, w * clamp(D.trip, 0, 1), 5);
  }

  const FC = { cv: null, key: '', t: -9 };
  // 한 장면 전체
  function drawVoid(c, w, h, S, t) {
    voidBg(c, w, h, S);
    const wb = S.walkBlend || 0, alpha = 1 - 0.65 * wb;
    // 바닥 자국은 수천 줄이라 따로 구워 두고, 바뀔 때만(0.4초에 한 번까지) 다시 굽는다
    const key = [w, h, Math.floor(S.ever.line / 5), S.ever.line % 5 | 0, S.found, Math.round(alpha * 20)].join(',');
    if (!FC.cv || FC.cv.width !== c.canvas.width || FC.cv.height !== c.canvas.height) { FC.cv = mk(c.canvas.width, c.canvas.height); FC.key = ''; }
    if (FC.key !== key && (t - FC.t > 0.4 || !FC.key || t < FC.t)) {
      const fc = FC.cv.getContext('2d'), k = c.canvas.width / w;
      fc.setTransform(1, 0, 0, 1, 0, 0); fc.clearRect(0, 0, FC.cv.width, FC.cv.height); fc.setTransform(k, 0, 0, k, 0, 0);
      otherMarks(fc, S, alpha); tallies(fc, S, alpha);
      FC.key = key; FC.t = t;
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(FC.cv, 0, 0); c.restore();
    c.globalAlpha = alpha; playerPics(c, S, t); c.globalAlpha = 1;
    if (S.floorFx) S.floorFx(c);
    // 세운 것들: 멀리 → 가까이
    const items = [];
    const floors = Math.floor(S.ever.tower);
    const nt = Math.min(90, Math.ceil(floors / 10));
    for (let i = 0; i < nt; i++) { const [x, z] = towerSpots(i); items.push({ z, k: 't', i, x, n: Math.min(10, floors - i * 10) }); }
    const ns = Math.min(40, Math.floor(S.ever.statue));
    for (let i = 0; i < ns; i++) { const [x, z] = statueSpot(i); items.push({ z, k: 's', i, x }); }
    if (S.acts && S.acts.carve && S.ever.statue % 1 > 0.01) items.push({ z: V.fz + 0.35, k: 'wip', x: 0.95, fr: S.ever.statue % 1 });
    for (let i = 0; i < S.found; i++) { const [x, z] = slabSpot(i); items.push({ z, k: 'm', i, x, lit: S.decoded > i }); }
    const pile = Math.min(24, Math.floor(S.res.stone));
    if (pile > 0) items.push({ z: V.fz - 0.2, k: 'pile', x: -0.8, n: pile });
    items.push({ z: V.fz, k: 'me' });
    if (S.stranger) items.push({ z: S.stranger.z, k: 'other', x: S.stranger.x });
    items.sort((a, b) => b.z - a.z);
    let me = null;
    for (const it of items) {
      const [sx, sy, sc] = proj(it.x || 0, it.z);
      const fade = it.k === 'me' || it.k === 'other' ? 1 : alpha * clamp(1.35 - it.z / 36, 0.25, 1);
      c.globalAlpha = fade;
      if (it.k === 't') {
        const bw = sc * 0.58, bh = sc * 0.2;
        const sg = c.createRadialGradient(sx, sy, 0, sx, sy, bw * 0.75);
        sg.addColorStop(0, 'rgba(55,45,35,.32)'); sg.addColorStop(1, 'rgba(55,45,35,0)');
        c.fillStyle = sg; c.beginPath(); c.ellipse(sx, sy, bw * 0.75, bh * 0.4, 0, 0, TAU); c.fill();
        let yy = sy, xo = 0;
        for (let j = 0; j < it.n; j++) {
          const r1 = hash(it.i * 17 + j), r2 = hash(it.i * 31 + j * 7), r3 = hash(it.i * 7 + j * 13);
          const wj = bw * Math.max(0.42, 1.12 - j * 0.075) * (0.85 + r1 * 0.25), hj = bh * (0.62 + r2 * 0.42) * Math.max(0.7, 1.05 - j * 0.03);
          xo += (r3 - 0.5) * wj * 0.14; xo *= 0.8;
          const rot = (hash(it.i * 53 + j) - 0.5) * 0.14;
          c.save(); c.translate(sx + xo, yy - hj * 0.5); c.rotate(rot);
          if (j) { c.fillStyle = 'rgba(40,32,26,.35)'; c.beginPath(); c.ellipse(0, hj * 0.36, wj * 0.36, hj * 0.14, 0, 0, TAU); c.fill(); }
          c.drawImage(stoneSprite((it.i * 7 + j) % 24, true), -wj / 2, -hj / 2, wj, hj);
          c.restore();
          yy -= hj * 0.66;
        }
      } else if (it.k === 's') {
        const sw = sc * 0.62, sh = sc * 1.36;
        c.fillStyle = 'rgba(60,50,40,.2)'; c.beginPath(); c.ellipse(sx, sy, sw * 0.5, sw * 0.1, 0, 0, TAU); c.fill();
        c.drawImage(statueSprite(it.i), sx - sw / 2, sy - sh, sw, sh);
      } else if (it.k === 'wip') { // 깎는 중인 돌덩이
        const bw = sc * 0.36, bh = sc * 0.55 * (0.6 + 0.4 * it.fr);
        c.drawImage(stoneSprite(9), sx - bw / 2, sy - bh, bw, bh);
        if (it.fr > 0.4) { c.fillStyle = 'rgba(200,195,186,.9)'; c.beginPath(); c.ellipse(sx, sy - bh - bw * 0.12, bw * 0.16, bw * 0.19, 0, 0, TAU); c.fill(); c.strokeStyle = '#6a655d'; c.lineWidth = 1.2; c.stroke(); }
      } else if (it.k === 'm') {
        const sw = sc * 0.46, sh = sc * 0.78;
        if (it.lit) { const gg = c.createRadialGradient(sx, sy - sh * 0.5, 0, sx, sy - sh * 0.5, sh); gg.addColorStop(0, 'rgba(255,210,140,.45)'); gg.addColorStop(1, 'rgba(255,210,140,0)'); c.fillStyle = gg; c.fillRect(sx - sh, sy - sh * 1.5, sh * 2, sh * 2); }
        c.fillStyle = 'rgba(60,50,40,.22)'; c.beginPath(); c.ellipse(sx, sy, sw * 0.6, sw * 0.12, 0, 0, TAU); c.fill();
        c.drawImage(slabSprite(it.i, it.lit), sx - sw / 2, sy - sh, sw, sh);
      } else if (it.k === 'pile') {
        const bw = sc * 0.18, bh = sc * 0.13;
        for (let j = 0; j < it.n; j++) { const row = j < 10 ? 0 : j < 17 ? 1 : j < 21 ? 2 : 3, col = j < 10 ? j : j < 17 ? j - 10 : j < 21 ? j - 17 : j - 21, cnt = [10, 7, 4, 3][row];
          c.drawImage(stoneSprite(j % 14), sx + (col - (cnt - 1) / 2) * bw * 0.42 - bw / 2, sy - bh - row * bh * 0.5 + (col % 2) * 2, bw, bh); }
      } else if (it.k === 'me') {
        c.globalAlpha = 1;
        if (S.ending && S.ending.stand) walker(c, sx, sy, sc, 0);
        else if (wb > 0.5) walker(c, sx, sy, sc, S.walkPh || 0);
        else me = sitter(c, sx, sy, sc, S.pose, S.poseP, t);
      } else if (it.k === 'other') {
        stranger(c, sx, sy, sc, S.stranger.ph, S.stranger.walking);
      }
    }
    c.globalAlpha = 1;
    if (S.memFx) for (const id in S.memFx.list) memoryFx(c, w, h, id, S.memFx.list[id], t);
    // 가장자리 어둡게
    const vg = c.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(90,80,70,0)'); vg.addColorStop(1, 'rgba(90,80,70,.28)');
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
    return me;
  }

  // ── 방 ─────────────────────────────────────────────────
  const ROOMS = [
    { wall: ['#b7ae9b', '#9d937f'], floor: ['#8d8778', '#6d6759'], trim: '#5d564a', win: 'basement' },
    { wall: ['#f1eee7', '#dcd7cc'], floor: ['#c9a67e', '#a88560'], trim: '#bdb4a4', win: 'brick' },
    { wall: ['#d9dde2', '#b9bfc7'], floor: ['#a7abb1', '#878b92'], trim: '#8b9199', win: 'city' },
    { wall: ['#efe3cf', '#dcc9aa'], floor: ['#b07a4a', '#8a5a33'], trim: '#a78f6c', win: 'apt' },
    { wall: ['#3b3a40', '#27262b'], floor: ['#d8d4cc', '#aaa59b'], trim: '#1d1c20', win: 'night' },
    { wall: ['#e7e9ec', '#c9ccd2'], floor: ['#6f5238', '#553d28'], trim: '#9aa0a8', win: 'sky' },
    { wall: ['#c9a36b', '#a8844f'], floor: ['#ecdcb4', '#d9c49a'], trim: '#7e5f35', win: 'sea' }
  ];
  function windowView(c, kind, x, y, w, h, t) {
    c.save(); rr(c, x, y, w, h, 3); c.clip();
    let g;
    if (kind === 'basement') { // 반지하: 창 위로 길, 사람 발이 지나간다
      g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#cfd8dc'); g.addColorStop(1, '#9aa5aa'); c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = '#6d6a63'; c.fillRect(x, y + h * 0.62, w, h * 0.38);
      c.fillStyle = '#5a5750'; for (let i = 0; i < 8; i++) c.fillRect(x + i * w / 8, y + h * 0.62, 1.5, h * 0.38);
      // 창밖 길을 지나가는 사람 다리 둘(청바지+운동화 오른쪽으로, 정장 바지+구두 왼쪽으로)
      const gy = y + h * 0.64, L = h * 0.52;
      [[1, 3.3, 0, 'jeans'], [-1, 2.7, 0.55, 'suit']].forEach(([dir, spd, off, kind]) => {   // spd: 1초에 다리 길이 몇 배를 가나(보통 걸음)
        const span = w + L * 3, u = ((t * spd * L / span + off) % 1 + 1) % 1;
        const hx = dir > 0 ? x - L * 1.5 + u * span : x + w + L * 1.5 - u * span;
        const ph = (u * span) / (L * 0.55);   // 걸음 위상: 간 거리에 맞춰
        passerLegs(c, hx, gy, L, ph, dir, kind);
      });
    } else if (kind === 'brick') {
      c.fillStyle = '#9b5a44'; c.fillRect(x, y, w, h);
      for (let r = 0; r * 10 < h + 10; r++) for (let q = -1; q * 26 < w + 26; q++) { c.fillStyle = hash(r * 31 + q) > 0.5 ? '#a8644c' : '#8e4f3b'; c.fillRect(x + q * 26 + (r % 2) * 13, y + r * 10, 24, 8); }
      g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    } else if (kind === 'city' || kind === 'apt') {
      g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#8fc3ea'); g.addColorStop(1, '#d6ecf7'); c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x + w * 0.3 + Math.sin(t * 0.05) * 10, y + h * 0.2, w * 0.12, h * 0.05, 0, 0, TAU); c.fill();
      for (let i = 0; i < 14; i++) {
        const bw = w * (0.08 + hash(i) * 0.08), bx = x + i * w / 12 - 10, bh = h * (kind === 'apt' ? 0.45 + hash(i + 3) * 0.25 : 0.3 + hash(i + 9) * 0.45);
        c.fillStyle = kind === 'apt' ? (i % 2 ? '#e6e1d6' : '#d4cec1') : (i % 3 ? '#9aa4b0' : '#7f8b99');
        c.fillRect(bx, y + h - bh, bw, bh);
        c.fillStyle = kind === 'apt' ? 'rgba(90,110,130,.55)' : 'rgba(210,230,245,.6)';
        for (let r = 0; r < bh / 9 - 1; r++) for (let q = 0; q < 3; q++) c.fillRect(bx + 3 + q * (bw - 6) / 3, y + h - bh + 5 + r * 9, (bw - 12) / 3, 4);
      }
    } else if (kind === 'night') {
      g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#3b2a5a'); c.fillStyle = g; c.fillRect(x, y, w, h);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; c.fillRect(x + hash(i * 3) * w, y + hash(i * 5) * h * 0.4, 1.5, 1.5); }
      for (let i = 0; i < 22; i++) {
        const bw = w * (0.04 + hash(i + 1) * 0.06), bx = x + hash(i * 7) * w, bh = h * (0.2 + hash(i * 11) * 0.5);
        c.fillStyle = '#141a2e'; c.fillRect(bx, y + h - bh, bw, bh);
        for (let r = 0; r < bh / 7; r++) for (let q = 0; q < 3; q++) if (hash(i * 97 + r * 5 + q) > 0.55) { c.fillStyle = hash(r + q + i) > 0.3 ? '#ffd98a' : '#9fd8ff'; c.fillRect(bx + 2 + q * (bw - 4) / 3, y + h - bh + 3 + r * 7, 2, 3); }
      }
    } else if (kind === 'sky') {
      g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#5aa2e6'); g.addColorStop(1, '#cfe7fa'); c.fillStyle = g; c.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,255,255,.85)'; const cx = x + ((hash(i) * w + t * (4 + i)) % (w + 120)) - 60, cy = y + h * (0.35 + hash(i + 2) * 0.45);
        c.beginPath(); c.ellipse(cx, cy, w * 0.1, h * 0.04, 0, 0, TAU); c.ellipse(cx + w * 0.06, cy - h * 0.02, w * 0.07, h * 0.035, 0, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(120,140,160,.5)'; for (let i = 0; i < 30; i++) { const bw = w * 0.03, bh = h * (0.03 + hash(i) * 0.05); c.fillRect(x + i * w / 30, y + h - bh, bw, bh); }
    } else if (kind === 'sea') {
      g = c.createLinearGradient(0, y, 0, y + h * 0.55); g.addColorStop(0, '#ff9a6a'); g.addColorStop(1, '#ffd49a'); c.fillStyle = g; c.fillRect(x, y, w, h * 0.55);
      c.fillStyle = '#ffe9b8'; c.beginPath(); c.arc(x + w * 0.62, y + h * 0.52, h * 0.1, Math.PI, 0); c.fill();
      g = c.createLinearGradient(0, y + h * 0.55, 0, y + h); g.addColorStop(0, '#3f8fb0'); g.addColorStop(1, '#1f5f80'); c.fillStyle = g; c.fillRect(x, y + h * 0.55, w, h * 0.45);
      c.strokeStyle = 'rgba(255,230,190,.6)'; c.lineWidth = 1.5; for (let r = 0; r < 5; r++) { c.beginPath(); for (let i = 0; i <= 30; i++) { const xx = x + i / 30 * w, yy = y + h * (0.6 + r * 0.08) + Math.sin(i + t * 1.5 + r) * 1.5; if (!i) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); }
      // 야자수
      c.strokeStyle = '#4a3522'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + w * 0.15, y + h); c.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.12, y + h * 0.2); c.stroke();
      c.fillStyle = '#2f5b2a'; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + Math.sin(t + i) * 0.04; c.beginPath(); c.moveTo(x + w * 0.12, y + h * 0.2); c.quadraticCurveTo(x + w * 0.12 + Math.cos(a) * w * 0.12, y + h * 0.2 + Math.sin(a) * h * 0.12 - 8, x + w * 0.12 + Math.cos(a) * w * 0.2, y + h * 0.2 + Math.sin(a) * h * 0.1 + 18); c.quadraticCurveTo(x + w * 0.12 + Math.cos(a) * w * 0.1, y + h * 0.2 + Math.sin(a) * h * 0.06, x + w * 0.12, y + h * 0.2); c.fill(); }
    }
    c.restore();
    // 유리 반사
    c.save(); rr(c, x, y, w, h, 3); c.clip();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x + w * 0.1, y); c.lineTo(x + w * 0.3, y); c.lineTo(x + w * 0.1, y + h); c.lineTo(x - w * 0.1, y + h); c.fill();
    c.restore();
  }

  function bedArt(c, bx0, by1, ww, h, tier) { // 뒷벽 왼쪽 구석, 바닥에 붙인 침대(반지하는 요만)
    const x0 = bx0 + ww * 0.02, x1 = bx0 + ww * 0.42, dz = h * (tier ? 0.1 : 0.08), lift = tier ? h * 0.035 : h * 0.012;
    const A = [x0, by1], B = [x1, by1], C = [x1 + ww * 0.02, by1 + dz], Dd = [x0 - ww * 0.1, by1 + dz];
    c.fillStyle = 'rgba(30,20,10,.25)'; c.beginPath(); c.moveTo(A[0], A[1] + 2); c.lineTo(B[0], B[1] + 2); c.lineTo(C[0], C[1] + 4); c.lineTo(Dd[0], Dd[1] + 4); c.fill();
    if (tier) { c.fillStyle = '#6a4a2e'; c.fillRect(A[0] - ww * 0.01, A[1] - lift - h * 0.08, B[0] - A[0] + ww * 0.02, h * 0.075); }
    if (tier) { c.fillStyle = '#7a5a3c'; c.fillRect(Dd[0], Dd[1] - lift, C[0] - Dd[0], lift); }
    c.fillStyle = tier ? '#f2eee6' : '#d8d2c2'; c.strokeStyle = '#8c8578'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(A[0], A[1] - lift - h * 0.012); c.lineTo(B[0], B[1] - lift - h * 0.012); c.lineTo(C[0], C[1] - lift); c.lineTo(Dd[0], Dd[1] - lift); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = tier ? '#7c8fb0' : '#9a8f7a'; c.beginPath(); c.moveTo(lerp(A[0], B[0], 0.35), A[1] - lift - h * 0.012); c.lineTo(B[0], B[1] - lift - h * 0.012); c.lineTo(C[0], C[1] - lift); c.lineTo(lerp(Dd[0], C[0], 0.3), C[1] - lift); c.closePath(); c.fill();
    c.fillStyle = '#fff'; rr(c, A[0] + ww * 0.01, A[1] - lift - h * 0.03, ww * 0.1, h * 0.028, 6); c.fill(); c.strokeStyle = '#bbb'; c.stroke();
  }
  function sofaArt(c, bx1, by1, ww, h, dark) {
    const x1 = bx1 - ww * 0.02, x0 = bx1 - ww * 0.42, y = by1 + h * 0.015, seat = h * 0.05, back = h * 0.08;
    c.fillStyle = 'rgba(30,20,10,.3)'; c.beginPath(); c.ellipse((x0 + x1) / 2, y + seat + 3, (x1 - x0) * 0.55, h * 0.015, 0, 0, TAU); c.fill();
    const g = c.createLinearGradient(0, y - back, 0, y + seat); g.addColorStop(0, dark ? '#3c3c44' : '#9a7f63'); g.addColorStop(1, dark ? '#1c1c22' : '#6b5440');
    c.fillStyle = g; c.strokeStyle = dark ? '#0e0e12' : '#3e3024'; c.lineWidth = 2;
    rr(c, x0, y - back, x1 - x0, back, 10); c.fill(); c.stroke();
    rr(c, x0 - ww * 0.02, y - seat * 0.2, x1 - x0 + ww * 0.04, seat * 1.2, 8); c.fill(); c.stroke();
    [x0 - ww * 0.03, x1 - ww * 0.01].forEach(ax => { rr(c, ax, y - back * 0.55, ww * 0.04, back * 0.55 + seat, 8); c.fill(); c.stroke(); });
    c.fillStyle = dark ? '#c9a45a' : '#e8d9b8'; rr(c, x0 + ww * 0.05, y - back * 0.75, ww * 0.08, back * 0.55, 6); c.fill();
  }

  // 옆에서 본 걷는 다리 한 쌍. hx: 엉덩이 x, gy: 땅, L: 넓적다리(=정강이) 길이, ph: 걸음 위상, dir: 가는 쪽
  function passerLegs(c, hx, gy, L, ph, dir, kind) {
    const pants = kind === 'jeans' ? ['#4f6a92', '#34496b', '#23324d'] : ['#3a3a42', '#26262c', '#16161a'];
    const shoe = kind === 'jeans' ? ['#f2f2ee', '#b9bab6'] : ['#2a1c14', '#120b07'];
    const bob = Math.abs(Math.cos(ph)) * L * 0.035;
    const hy = gy - L * 1.93 + bob;
    // 그림자
    c.fillStyle = 'rgba(40,36,30,.28)'; c.beginPath(); c.ellipse(hx, gy + 1, L * 0.55, L * 0.05, 0, 0, TAU); c.fill();
    const leg = (p, far) => {
      const sw = Math.sin(p);                                  // 앞뒤로 흔들림
      const a1 = sw * 0.42 * dir;                              // 넓적다리 각(아래가 0)
      const bend = Math.max(0, Math.cos(p)) * 0.75;            // 앞으로 넘어올 때 무릎이 굽는다
      const a2 = a1 - bend * dir;
      const kx = hx + Math.sin(a1) * L, ky = hy + Math.cos(a1) * L;
      let ax = kx + Math.sin(a2) * L, ay = ky + Math.cos(a2) * L;
      if (ay > gy - L * 0.06) ay = gy - L * 0.06;              // 땅 밑으로 안 들어가게
      const col = far ? pants.map(cc => shade(cc, -0.25)) : pants;
      const wT = L * 0.38, wS = L * 0.27;
      // 다리 한 덩어리(엉덩이→무릎→발목, 굵기가 줄어드는 바지 모양)
      const nx1 = Math.cos(a1), ny1 = -Math.sin(a1), nx2 = Math.cos(a2), ny2 = -Math.sin(a2);
      const kw = (wT + wS) / 2;
      c.beginPath();
      c.moveTo(hx - nx1 * wT / 2, hy - ny1 * wT / 2);
      c.quadraticCurveTo(kx - nx1 * kw / 2 * 1.05, ky - ny1 * kw / 2 * 1.05, ax - nx2 * wS / 2, ay - ny2 * wS / 2);
      c.lineTo(ax + nx2 * wS / 2, ay + ny2 * wS / 2);
      c.quadraticCurveTo(kx + nx1 * kw / 2 * 1.05, ky + ny1 * kw / 2 * 1.05, hx + nx1 * wT / 2, hy + ny1 * wT / 2);
      c.closePath();
      const lg = c.createLinearGradient(hx - wT, 0, hx + wT, 0);
      lg.addColorStop(dir > 0 ? 1 : 0, col[0]); lg.addColorStop(0.5, col[1]); lg.addColorStop(dir > 0 ? 0 : 1, col[2]);
      c.fillStyle = lg; c.fill(); c.strokeStyle = col[2]; c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke();
      // 빛 받는 앞쪽 가장자리, 무릎 주름
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = Math.max(1, wS * 0.25);
      c.beginPath(); c.moveTo(kx + dir * wS * 0.3, ky); c.lineTo(ax + dir * wS * 0.3, ay - L * 0.1); c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(kx - dir * wT * 0.3, ky - L * 0.05); c.lineTo(kx + dir * wT * 0.2, ky + L * 0.04); c.stroke();
      if (kind === 'jeans') { c.strokeStyle = 'rgba(210,180,120,.4)'; c.beginPath(); c.moveTo(ax - wS * 0.45, ay - L * 0.06); c.lineTo(ax + wS * 0.45, ay - L * 0.06); c.stroke(); }
      // 신발: 발 디딜 땐 평평, 뗄 땐 발끝이 내려간다
      const tilt = (ay < gy - L * 0.07 ? Math.min(0.5, (gy - L * 0.06 - ay) / L * 3) : 0) * -dir + (sw * dir < -0.3 ? 0.25 * dir : 0);
      c.save(); c.translate(ax, ay + L * 0.02); c.rotate(tilt);
      const fl = L * 0.42, fh = L * 0.13;
      c.fillStyle = shoe[0]; c.strokeStyle = shoe[1]; c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-dir * fl * 0.3, -fh * 0.9); c.lineTo(dir * fl * 0.35, -fh * 0.7);
      c.quadraticCurveTo(dir * fl * 0.72, -fh * 0.55, dir * fl * 0.72, 0);
      c.lineTo(-dir * fl * 0.32, 0); c.quadraticCurveTo(-dir * fl * 0.38, -fh * 0.5, -dir * fl * 0.3, -fh * 0.9);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = kind === 'jeans' ? '#d8d8d2' : '#3d2a1e'; c.fillRect(Math.min(-dir * fl * 0.32, dir * fl * 0.72), -fh * 0.18, fl * 1.04, fh * 0.18);
      if (kind !== 'jeans') { c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(dir * fl * 0.35, -fh * 0.6, fl * 0.12, fh * 0.12, 0, 0, TAU); c.fill(); }
      c.restore();
    };
    leg(ph + Math.PI, true);   // 먼 다리 먼저
    leg(ph, false);
  }
  function dogArt(c, x, y, s, t, happy) { // 누워 있는 시바
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(50,40,30,.25)'; c.beginPath(); c.ellipse(0, 0, s * 0.55, s * 0.1, 0, 0, TAU); c.fill();
    const wag = Math.sin(t * (happy ? 18 : 5)) * (happy ? 0.5 : 0.25);
    // 꼬리
    c.save(); c.translate(-s * 0.42, -s * 0.2); c.rotate(-0.6 + wag);
    c.fillStyle = '#d98a3d'; c.strokeStyle = '#8a4f1e'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.09, s * 0.15, 0.3, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f6e7cf'; c.beginPath(); c.ellipse(s * 0.01, -s * 0.14, s * 0.05, s * 0.08, 0.3, 0, TAU); c.fill(); c.restore();
    // 몸
    let g = c.createLinearGradient(0, -s * 0.4, 0, 0); g.addColorStop(0, '#e79b4c'); g.addColorStop(1, '#b86b2b');
    c.fillStyle = g; c.strokeStyle = '#7d4519'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(-s * 0.05, -s * 0.16, s * 0.42, s * 0.17, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f6e7cf'; c.beginPath(); c.ellipse(0, -s * 0.05, s * 0.3, s * 0.06, 0, 0, TAU); c.fill();
    // 앞발
    c.fillStyle = '#f3e1c4'; c.strokeStyle = '#8a5a30'; [0.22, 0.34].forEach(px => { c.beginPath(); c.ellipse(s * px, -s * 0.03, s * 0.07, s * 0.035, 0, 0, TAU); c.fill(); c.stroke(); });
    // 머리
    c.save(); c.translate(s * 0.32, -s * 0.3); c.rotate(Math.sin(t * 0.7) * 0.05);
    [-1, 1].forEach(d => { c.fillStyle = '#d98a3d'; c.strokeStyle = '#7d4519'; c.beginPath(); c.moveTo(d * s * 0.06, -s * 0.1); c.lineTo(d * s * 0.13, -s * 0.24); c.lineTo(d * s * 0.16, -s * 0.07); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f2c9a0'; c.beginPath(); c.moveTo(d * s * 0.085, -s * 0.11); c.lineTo(d * s * 0.125, -s * 0.2); c.lineTo(d * s * 0.14, -s * 0.09); c.fill(); });
    g = c.createRadialGradient(-s * 0.04, -s * 0.06, 0, 0, 0, s * 0.17); g.addColorStop(0, '#f0a758'); g.addColorStop(1, '#c1732f');
    c.fillStyle = g; c.strokeStyle = '#7d4519'; c.beginPath(); c.ellipse(0, 0, s * 0.17, s * 0.14, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f7ead6'; c.beginPath(); c.ellipse(0, s * 0.06, s * 0.12, s * 0.07, 0, 0, TAU); c.fill();
    const blink = (t % 4) < 0.12;
    c.fillStyle = '#1e140e'; [-1, 1].forEach(d => { if (blink) c.fillRect(d * s * 0.065 - s * 0.02, -s * 0.02, s * 0.04, 2); else { c.beginPath(); c.ellipse(d * s * 0.065, -s * 0.02, s * 0.022, s * 0.026, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(d * s * 0.065 - 1, -s * 0.035, 2, 2); c.fillStyle = '#1e140e'; } });
    c.beginPath(); c.ellipse(0, s * 0.035, s * 0.03, s * 0.02, 0, 0, TAU); c.fill();
    if (happy) { c.fillStyle = '#e0607a'; c.beginPath(); c.ellipse(0, s * 0.09, s * 0.025, s * 0.035, 0, 0, TAU); c.fill(); }
    c.restore(); c.restore();
  }

  // 버튼 상자(방·타이틀 공용). 돌려주는 값: 누르는 자리 사각형
  function buttonBox(c, cx, by, s, pressed, label, glow) {
    const w = s, h = s * 0.42;
    c.save();
    // 그림자
    c.fillStyle = 'rgba(30,20,10,.35)'; c.beginPath(); c.ellipse(cx, by, w * 0.62, h * 0.14, 0, 0, TAU); c.fill();
    // 금속 받침
    let g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, '#9aa0a8'); g.addColorStop(0.3, '#d9dde2'); g.addColorStop(0.7, '#8a9098'); g.addColorStop(1, '#5d626a');
    c.fillStyle = g; c.strokeStyle = '#2d3036'; c.lineWidth = 2;
    rr(c, cx - w / 2, by - h, w, h, h * 0.18); c.fill(); c.stroke();
    // 윗면
    g = c.createLinearGradient(0, by - h - h * 0.18, 0, by - h + h * 0.18); g.addColorStop(0, '#eef0f3'); g.addColorStop(1, '#a8aeb6');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, by - h, w / 2, h * 0.2, 0, 0, TAU); c.fill(); c.stroke();
    // 황동 명판
    if (label) {
      const pw = w * 0.74, ph = h * 0.36;
      g = c.createLinearGradient(0, by - h * 0.62, 0, by - h * 0.62 + ph); g.addColorStop(0, '#f3d98a'); g.addColorStop(1, '#b08a2e');
      c.fillStyle = g; rr(c, cx - pw / 2, by - h * 0.66, pw, ph, 3); c.fill(); c.strokeStyle = '#6b5116'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#3d2d08'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = ph * 0.72; c.font = `900 ${fs}px TitleF, Ria, sans-serif`;
      while (c.measureText(label).width > pw * 0.9 && fs > 6) { fs -= 1; c.font = `900 ${fs}px TitleF, Ria, sans-serif`; }
      c.fillText(label, cx, by - h * 0.66 + ph / 2 + 1);
    }
    // 빨간 둥근 단추
    const dy = pressed ? h * 0.06 : 0, bw = w * 0.34, bh = w * 0.17 - dy;
    const top = by - h - dy;
    c.fillStyle = '#3a0c0c'; c.beginPath(); c.ellipse(cx, by - h, bw * 1.12, h * 0.1, 0, 0, TAU); c.fill();
    if (glow) { c.save(); c.globalAlpha = 0.35 + 0.25 * Math.sin(glow * 3); c.fillStyle = '#ff5a4a'; c.shadowColor = '#ff3b2e'; c.shadowBlur = 30; c.beginPath(); c.ellipse(cx, top - bh * 0.4, bw, bh * 0.9, 0, 0, TAU); c.fill(); c.restore(); }
    g = c.createRadialGradient(cx - bw * 0.35, top - bh * 0.8, bw * 0.05, cx, top - bh * 0.3, bw * 1.1);
    g.addColorStop(0, '#ff9a8c'); g.addColorStop(0.35, '#e8261b'); g.addColorStop(0.8, '#a50f0a'); g.addColorStop(1, '#5e0605');
    c.fillStyle = g; c.strokeStyle = '#3d0404'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - bw, top); c.bezierCurveTo(cx - bw, top - bh * 1.35, cx + bw, top - bh * 1.35, cx + bw, top);
    c.ellipse(cx, top, bw, h * 0.09, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(cx - bw * 0.35, top - bh * 0.72, bw * 0.28, bh * 0.16, -0.35, 0, TAU); c.fill();
    c.restore();
    return { x: cx - w * 0.6, y: top - bh * 1.3, w: w * 1.2, h: by - (top - bh * 1.3) };
  }

  function drawRoom(c, w, h, S, t) {
    const R = ROOMS[S.house] || ROOMS[0];
    const bx0 = w * 0.13, bx1 = w * 0.87, by0 = Math.min(h * 0.3, Math.max(h * 0.1, (S.top || 48) + 8)), by1 = h * 0.62;   // 아주 낮은 화면에서도 벽이 뒤집히지 않게   // 뒷벽 위는 상단바 자리
    // 천장·옆벽·바닥
    c.fillStyle = shade(R.wall[1], -0.25); c.fillRect(0, 0, w, h);
    let g = c.createLinearGradient(0, 0, 0, by0); g.addColorStop(0, shade(R.wall[1], -0.35)); g.addColorStop(1, shade(R.wall[1], -0.15));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(bx1, by0); c.lineTo(bx0, by0); c.fill();
    [[0, bx0], [w, bx1]].forEach(([ex, bx]) => { g = c.createLinearGradient(ex, 0, bx, 0); g.addColorStop(0, shade(R.wall[1], -0.3)); g.addColorStop(1, shade(R.wall[1], -0.08));
      c.fillStyle = g; c.beginPath(); c.moveTo(ex, 0); c.lineTo(bx, by0); c.lineTo(bx, by1); c.lineTo(ex, h); c.fill(); });
    g = c.createLinearGradient(0, by1, 0, h); g.addColorStop(0, R.floor[0]); g.addColorStop(1, R.floor[1]);
    c.fillStyle = g; c.beginPath(); c.moveTo(bx0, by1); c.lineTo(bx1, by1); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    // 바닥 결(판자·타일)
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1;
    for (let i = 1; i < 12; i++) { const u = i / 12; c.beginPath(); c.moveTo(lerp(bx0, bx1, u), by1); c.lineTo(lerp(0, w, u), h); c.stroke(); }
    if (S.house === 4) { c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(w * 0.3, by1); c.lineTo(w * 0.5, by1); c.lineTo(w * 0.62, h); c.lineTo(w * 0.2, h); c.fill(); }
    for (let i = 1; i < 6; i++) { const y = by1 + (h - by1) * Math.pow(i / 6, 1.6); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.strokeStyle = 'rgba(0,0,0,.06)'; c.stroke(); }
    // 뒷벽
    g = c.createLinearGradient(bx0, by0, bx1, by1); g.addColorStop(0, R.wall[0]); g.addColorStop(1, R.wall[1]);
    c.fillStyle = g; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    if (S.house === 0) { // 곰팡이 얼룩
      for (let i = 0; i < 7; i++) { const gg = c.createRadialGradient(bx0 + hash(i) * (bx1 - bx0), by0 + hash(i + 4) * (by1 - by0) * 0.3, 0, bx0 + hash(i) * (bx1 - bx0), by0 + hash(i + 4) * (by1 - by0) * 0.3, 30 + hash(i) * 40); gg.addColorStop(0, 'rgba(70,80,50,.25)'); gg.addColorStop(1, 'rgba(70,80,50,0)'); c.fillStyle = gg; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0); }
    }
    if (S.house === 6) { c.strokeStyle = 'rgba(90,60,25,.35)'; c.lineWidth = 3; for (let i = 0; i < 24; i++) { const x = bx0 + i * (bx1 - bx0) / 24; c.beginPath(); c.moveTo(x, by0); c.lineTo(x, by1); c.stroke(); } }
    // 걸레받이
    c.fillStyle = R.trim; c.fillRect(bx0, by1 - (by1 - by0) * 0.035, bx1 - bx0, (by1 - by0) * 0.035);
    // 창
    const ww = bx1 - bx0, wh = by1 - by0;
    let win;
    if (R.win === 'basement') win = [bx0 + ww * 0.3, by0 + wh * 0.04, ww * 0.4, wh * 0.26];
    else if (R.win === 'brick') win = [bx0 + ww * 0.34, by0 + wh * 0.14, ww * 0.32, wh * 0.46];
    else if (R.win === 'city') win = [bx0 + ww * 0.2, by0 + wh * 0.1, ww * 0.6, wh * 0.56];
    else if (R.win === 'apt') win = [bx0 + ww * 0.1, by0 + wh * 0.08, ww * 0.8, wh * 0.74];
    else win = [bx0 + ww * 0.04, by0 + wh * 0.04, ww * 0.92, wh * 0.88];
    windowView(c, R.win, win[0], win[1], win[2], win[3], t);
    c.strokeStyle = R.win === 'night' ? '#0e0e12' : shade(R.trim, -0.2); c.lineWidth = Math.max(4, w * 0.008);
    rr(c, win[0], win[1], win[2], win[3], 3); c.stroke();
    c.lineWidth = Math.max(2, w * 0.004); c.beginPath(); c.moveTo(win[0] + win[2] / 2, win[1]); c.lineTo(win[0] + win[2] / 2, win[1] + win[3]);
    if (R.win !== 'night' && R.win !== 'sky' && R.win !== 'sea') { c.moveTo(win[0], win[1] + win[3] / 2); c.lineTo(win[0] + win[2], win[1] + win[3] / 2); }
    c.stroke();
    // 창빛이 바닥에 떨어진다
    if (R.win !== 'night') { c.fillStyle = 'rgba(255,245,220,.12)'; c.beginPath(); c.moveTo(win[0], by1); c.lineTo(win[0] + win[2], by1); c.lineTo(win[0] + win[2] * 1.3, h); c.lineTo(win[0] - win[2] * 0.3, h); c.fill(); }
    // 가구: 침대(원룸~아파트), 소파(아파트~)
    if (S.house <= 2) bedArt(c, bx0, by1, ww, h, S.house);
    if (S.house >= 3 && S.house !== 6) sofaArt(c, bx1, by1, ww, h, S.house === 4);
    if (S.house === 0) { // 선풍기·빨래 건조대
      const fx = bx1 - ww * 0.12, fy = by1 + h * 0.04, fr = ww * 0.07;
      c.strokeStyle = '#6d6a63'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, fy - fr); c.lineTo(fx, fy + h * 0.05); c.stroke();
      c.fillStyle = '#d9d6cf'; c.beginPath(); c.ellipse(fx, fy + h * 0.055, fr * 0.7, fr * 0.2, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = 'rgba(180,200,210,.55)'; c.beginPath(); c.arc(fx, fy - fr, fr, 0, TAU); c.fill(); c.strokeStyle = '#8d8a83'; c.lineWidth = 1.5; c.stroke();
      for (let i = 0; i < 3; i++) { const a = t * 9 + i * TAU / 3; c.fillStyle = 'rgba(120,150,170,.6)'; c.beginPath(); c.ellipse(fx + Math.cos(a) * fr * 0.45, fy - fr + Math.sin(a) * fr * 0.45, fr * 0.42, fr * 0.2, a, 0, TAU); c.fill(); }
      c.strokeStyle = '#8a8f96'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx0 + ww * 0.62, by1 - wh * 0.35); c.lineTo(bx0 + ww * 0.92, by1 - wh * 0.35); c.stroke();
      [['#d9b8a0', 0.66], ['#9fb3c8', 0.76], ['#e8e2d0', 0.85]].forEach(([col, u]) => { c.fillStyle = col; c.fillRect(bx0 + ww * u, by1 - wh * 0.35, ww * 0.07, wh * 0.16); });
    }
    // 전등
    if (S.house === 0) { c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h * 0.14); c.stroke(); const gl = c.createRadialGradient(w / 2, h * 0.16, 0, w / 2, h * 0.16, h * 0.5); gl.addColorStop(0, 'rgba(255,230,160,.35)'); gl.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h); c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(w / 2, h * 0.16, 7, 0, TAU); c.fill(); }
    if (S.house === 4) { [0.3, 0.5, 0.7].forEach(u => { c.strokeStyle = '#111'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * u, 0); c.lineTo(w * u, h * 0.12); c.stroke(); c.fillStyle = '#ffdca0'; c.beginPath(); c.arc(w * u, h * 0.13, 5, 0, TAU); c.fill(); const gl = c.createRadialGradient(w * u, h * 0.13, 0, w * u, h * 0.13, h * 0.3); gl.addColorStop(0, 'rgba(255,210,140,.3)'); gl.addColorStop(1, 'rgba(255,210,140,0)'); c.fillStyle = gl; c.fillRect(0, 0, w, h * 0.6); }); }
    // 산 물건
    const O = S.owned || {};
    if (O.sports) { const px = bx0 + ww * 0.03, py = by0 + wh * 0.12, pw = ww * 0.14, ph = wh * 0.22; if (R.win === 'apt' || R.win === 'night' || R.win === 'sky' || R.win === 'sea') { /* 창이 넓으면 옆벽에 */ }
      const qx = R.win === 'basement' || R.win === 'brick' || R.win === 'city' ? px : w * 0.015, qy = R.win === 'basement' || R.win === 'brick' || R.win === 'city' ? py : h * 0.2;
      c.fillStyle = '#111'; c.fillRect(qx - 3, qy - 3, pw + 6, ph + 6); g = c.createLinearGradient(0, qy, 0, qy + ph); g.addColorStop(0, '#2a2a3a'); g.addColorStop(1, '#6a6a7a'); c.fillStyle = g; c.fillRect(qx, qy, pw, ph);
      c.fillStyle = '#e02a1f'; c.beginPath(); c.moveTo(qx + pw * 0.08, qy + ph * 0.72); c.lineTo(qx + pw * 0.2, qy + ph * 0.55); c.lineTo(qx + pw * 0.55, qy + ph * 0.48); c.lineTo(qx + pw * 0.92, qy + ph * 0.6); c.lineTo(qx + pw * 0.92, qy + ph * 0.74); c.fill();
      c.fillStyle = '#111'; [0.27, 0.75].forEach(u => { c.beginPath(); c.arc(qx + pw * u, qy + ph * 0.74, ph * 0.08, 0, TAU); c.fill(); }); }
    if (O.trip) { const sx = bx0 - w * 0.02, sy = h * 0.9; c.fillStyle = '#2f6fb0'; c.strokeStyle = '#173a5e'; c.lineWidth = 2; rr(c, sx, sy - h * 0.16, w * 0.1, h * 0.16, 8); c.fill(); c.stroke();
      [['#f2c14e', 0.2, 0.3], ['#e0607a', 0.55, 0.55], ['#5dbb76', 0.25, 0.7]].forEach(([col, u, v]) => { c.fillStyle = col; c.beginPath(); c.arc(sx + w * 0.1 * u, sy - h * 0.16 * (1 - v), w * 0.014, 0, TAU); c.fill(); });
      c.strokeStyle = '#173a5e'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx + w * 0.03, sy - h * 0.16); c.lineTo(sx + w * 0.03, sy - h * 0.2); c.lineTo(sx + w * 0.07, sy - h * 0.2); c.lineTo(sx + w * 0.07, sy - h * 0.16); c.stroke(); }
    // 탁자
    const tw = Math.min(w * 0.5, h * 0.62), tcx = w / 2, ttop = h * 0.72, tfront = h * 0.8;
    c.fillStyle = 'rgba(30,20,10,.3)'; c.beginPath(); c.ellipse(tcx, h * 0.97, tw * 0.55, h * 0.03, 0, 0, TAU); c.fill();
    c.fillStyle = '#5a3b22'; [-1, 1].forEach(d => { c.fillRect(tcx + d * tw * 0.42 - tw * 0.02, tfront, tw * 0.04, h * 0.17); });
    g = c.createLinearGradient(0, ttop, 0, tfront); g.addColorStop(0, '#a7774a'); g.addColorStop(1, '#8a5f38');
    c.fillStyle = g; c.strokeStyle = '#4a2f18'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(tcx - tw * 0.44, ttop); c.lineTo(tcx + tw * 0.44, ttop); c.lineTo(tcx + tw * 0.5, tfront); c.lineTo(tcx - tw * 0.5, tfront); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#6e4a2a'; c.fillRect(tcx - tw * 0.5, tfront, tw, h * 0.025); c.strokeRect(tcx - tw * 0.5, tfront, tw, h * 0.025);
    c.strokeStyle = 'rgba(70,40,20,.3)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { const yy = ttop + (tfront - ttop) * (i + 0.5) / 5; c.beginPath(); c.moveTo(tcx - tw * 0.45, yy); c.bezierCurveTo(tcx - tw * 0.1, yy + 2, tcx + tw * 0.1, yy - 2, tcx + tw * 0.46, yy); c.stroke(); }
    // 탁자 위 물건
    if (O.chicken) { const x = tcx - tw * 0.47, y = ttop + (tfront - ttop) * 0.55, bw2 = tw * 0.16, bh2 = tw * 0.09;
      c.fillStyle = '#fff'; c.strokeStyle = '#8a2a1c'; c.lineWidth = 1.5; c.fillRect(x, y - bh2, bw2, bh2); c.strokeRect(x, y - bh2, bw2, bh2);
      c.fillStyle = '#d8322a'; c.fillRect(x, y - bh2, bw2, bh2 * 0.35); c.fillStyle = '#c47a2c'; c.beginPath(); c.ellipse(x + bw2 * 0.55, y - bh2 * 1.05, bw2 * 0.28, bh2 * 0.3, -0.3, 0, TAU); c.fill(); c.strokeStyle = '#7a4412'; c.stroke(); }
    if (O.watch) { const x = tcx + tw * 0.36, y = ttop + (tfront - ttop) * 0.5; c.strokeStyle = '#b8912e'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, tw * 0.05, tw * 0.02, 0, 0, TAU); c.stroke(); c.fillStyle = '#f3dc8e'; c.beginPath(); c.arc(x + tw * 0.05, y - tw * 0.005, tw * 0.022, 0, TAU); c.fill(); c.strokeStyle = '#7d6012'; c.lineWidth = 1.5; c.stroke(); }
    if (O.car) { const x = tcx + tw * 0.42, y = ttop + (tfront - ttop) * 0.8; c.fillStyle = '#333'; rr(c, x - tw * 0.025, y - tw * 0.04, tw * 0.05, tw * 0.035, 4); c.fill(); c.fillStyle = '#b9bcc2'; c.fillRect(x - tw * 0.005, y - tw * 0.07, tw * 0.01, tw * 0.03); }
    // 버튼
    const box = buttonBox(c, tcx, ttop + (tfront - ttop) * 0.66, Math.min(tw * 0.6, h * 0.34), S.pressed, S.label, t);
    // 강아지
    let dogR = null;
    if (O.dog) { const ds = Math.min(w, h) * 0.22, dx = tcx + tw * 0.62, dy = h * 0.95; dogArt(c, dx, dy, ds, t, S.dogHappy > 0); dogR = { x: dx - ds * 0.5, y: dy - ds * 0.55, w: ds, h: ds * 0.6 }; }
    // 빛깔 묶기 + 가장자리
    const vg = c.createRadialGradient(w / 2, h * 0.6, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(20,12,6,${S.house === 4 ? 0.5 : 0.35})`);
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
    return { box, dog: dogR };
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  // 타이틀: 공허 한가운데 받침 위 버튼
  function drawTitle(c, w, h, t, label) {
    voidBg(c, w, h, { walkOff: t * 0.3 });
    const land = w > h * 1.1;   // 가로 화면은 받침을 왼쪽에, 제목·START 는 오른쪽에
    const [sx, sy, sc] = proj(land ? -Math.min(1.25, w / V.f * 1.25) : 0, 3.1);
    // 받침 기둥
    const pw = sc * 0.5, ph = sc * 0.55;
    let g = c.createLinearGradient(sx - pw / 2, 0, sx + pw / 2, 0); g.addColorStop(0, '#f4f2ee'); g.addColorStop(0.5, '#d9d5cd'); g.addColorStop(1, '#a9a399');
    c.fillStyle = 'rgba(60,50,40,.25)'; c.beginPath(); c.ellipse(sx, sy, pw * 0.8, pw * 0.13, 0, 0, TAU); c.fill();
    c.fillStyle = g; c.strokeStyle = '#8a8378'; c.lineWidth = 1.5; c.fillRect(sx - pw / 2, sy - ph, pw, ph); c.strokeRect(sx - pw / 2, sy - ph, pw, ph);
    c.fillStyle = '#eceae5'; c.beginPath(); c.ellipse(sx, sy - ph, pw / 2, pw * 0.09, 0, 0, TAU); c.fill(); c.stroke();
    const box = buttonBox(c, sx, sy - ph - pw * 0.02, pw * 0.86, false, label, t);
    const vg = c.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(90,80,70,0)'); vg.addColorStop(1, 'rgba(90,80,70,.28)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    return box;
  }

  // 엔딩 뒤 우주
  function drawCosmos(c, w, h, t, stars) {
    c.fillStyle = '#03040a'; c.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.46;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const r = s.r * Math.min(1, t * s.v), a = s.a + t * s.spin;
      const x = cx + Math.cos(a) * r * w * 0.6, y = cy + Math.sin(a) * r * h * 0.5 * s.flat;
      c.fillStyle = s.col; c.globalAlpha = clamp(t * 0.8, 0, 1) * s.b; c.fillRect(x, y, s.sz, s.sz);
    }
    const core = c.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * (0.08 + 0.1 / (1 + t)));
    core.addColorStop(0, 'rgba(255,240,210,.9)'); core.addColorStop(1, 'rgba(255,170,90,0)');
    c.globalAlpha = 1; c.fillStyle = core; c.fillRect(0, 0, w, h);
    c.restore();
  }

  window.B5ART = { drawVoid, drawRoom, drawTitle, drawCosmos, drawCloseup, picPath, PICS, proj, V, buttonBox, sitter, walker, stranger, hash };
})();
