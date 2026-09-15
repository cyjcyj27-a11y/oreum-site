/* 야옹 편대 — 그림. 전부 코드로 그려 캔버스에 미리 구워 둔다(파일 없음).
   빛은 왼쪽 위에서. 큰 면은 밝은 면·그림자 면 두 단계 이상, 바깥 윤곽만 굵게. */
(function () {
  'use strict';
  var SPR = 2;                                   // 그림은 2배로 굽는다(폰 고해상도에서도 또렷하게)

  function mk(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * SPR); c.height = Math.ceil(h * SPR);
    var g = c.getContext('2d'); g.scale(SPR, SPR);
    g.lineJoin = 'round'; g.lineCap = 'round';
    draw(g, w, h);
    c.lw = w; c.lh = h;
    return c;
  }
  // 맞았을 때 번쩍이는 흰 실루엣
  function flashOf(src) {
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    var g = c.getContext('2d'); g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    c.lw = src.lw; c.lh = src.lh; return c;
  }
  function rgrad(g, x, y, r, stops) {
    var gr = g.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.15);
    for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }
  function lgrad(g, x0, y0, x1, y1, stops) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }
  function ell(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }

  // ── 고양이 12마리 털색 ──
  var COATS = [
    { id: 'cheese',  ko: '치즈',     en: 'Ginger',    base: '#f39a45', dark: '#b8611f', light: '#ffd49a', pat: 'tabby', eye: '#7cc242' },
    { id: 'mackerel',ko: '고등어',   en: 'Mackerel',  base: '#98a0a8', dark: '#565c64', light: '#d8dcdf', pat: 'tabby', eye: '#e8c040' },
    { id: 'tuxedo',  ko: '턱시도',   en: 'Tuxedo',    base: '#3a3a44', dark: '#1c1c22', light: '#6c6c78', pat: 'tux',   eye: '#9ad04a' },
    { id: 'calico',  ko: '삼색이',   en: 'Calico',    base: '#f5efe6', dark: '#b9aa98', light: '#ffffff', pat: 'calico', eye: '#e0a83a' },
    { id: 'siamese', ko: '샴',       en: 'Siamese',   base: '#efe0c6', dark: '#a8906c', light: '#fff6e6', pat: 'point', eye: '#4aa8f0' },
    { id: 'white',   ko: '흰냥이',   en: 'Snowy',     base: '#f6f3ee', dark: '#bdb4a8', light: '#ffffff', pat: 'solid', eye: '#58b8e8', odd: true },
    { id: 'black',   ko: '까망이',   en: 'Midnight',  base: '#2c2a32', dark: '#151419', light: '#56525e', pat: 'solid', eye: '#f2c230' },
    { id: 'blue',    ko: '러시안블루', en: 'Russian Blue', base: '#8ea2b8', dark: '#56687c', light: '#c4d2e0', pat: 'solid', eye: '#6ad07a' },
    { id: 'scottish',ko: '스코티시', en: 'Scottish',  base: '#d8c6ae', dark: '#98826a', light: '#f2e6d4', pat: 'tabby', eye: '#e0902a', fold: true },
    { id: 'bengal',  ko: '벵갈',     en: 'Bengal',    base: '#e2b262', dark: '#8a5a24', light: '#f8dca0', pat: 'spots', eye: '#7cc242' },
    { id: 'persian', ko: '페르시안', en: 'Persian',   base: '#eee0c8', dark: '#b0987a', light: '#fffaf0', pat: 'fluffy', eye: '#d0782a' },
    { id: 'bicolor', ko: '노랑둥이', en: 'Butter',    base: '#f6b75a', dark: '#c07a2c', light: '#ffe2a8', pat: 'bicolor', eye: '#64b84a' }
  ];

  // ── 고양이 얼굴 ──
  function catHead(g, x, y, r, c, o) {
    o = o || {};
    var lw = Math.max(1, r * 0.075);
    // 귀
    [-1, 1].forEach(function (s) {
      g.save();
      if (c.fold) {
        g.beginPath(); g.moveTo(x + s * r * 0.9, y - r * 0.35); g.quadraticCurveTo(x + s * r * 0.85, y - r * 0.95, x + s * r * 0.35, y - r * 0.78); g.closePath();
      } else {
        g.beginPath(); g.moveTo(x + s * r * 0.98, y - r * 0.1); g.quadraticCurveTo(x + s * r * 0.95, y - r * 0.9, x + s * r * 0.8, y - r * 1.16); g.quadraticCurveTo(x + s * r * 0.5, y - r * 0.98, x + s * r * 0.15, y - r * 0.74); g.closePath();
      }
      var earCol = c.pat === 'point' ? c.dark : (c.pat === 'calico' ? (s < 0 ? '#3a3238' : '#e8913e') : c.base);
      g.fillStyle = lgrad(g, x, y - r * 1.1, x, y - r * 0.2, [[0, earCol], [1, c.pat === 'calico' ? earCol : c.dark]]);
      g.strokeStyle = c.dark; g.lineWidth = lw; g.fill(); g.stroke();
      if (!c.fold) {
        g.beginPath(); g.moveTo(x + s * r * 0.84, y - r * 0.28); g.quadraticCurveTo(x + s * r * 0.8, y - r * 0.8, x + s * r * 0.74, y - r * 0.96); g.quadraticCurveTo(x + s * r * 0.52, y - r * 0.82, x + s * r * 0.34, y - r * 0.66); g.closePath();
        g.fillStyle = lgrad(g, x, y - r, x, y - r * 0.3, [[0, '#f7b3bd'], [1, '#d9808e']]); g.fill();
      }
      g.restore();
    });
    // 머리(털 많은 페르시안은 가장자리를 들쭉날쭉하게)
    g.save();
    g.beginPath();
    if (c.pat === 'fluffy') {
      for (var i = 0; i <= 28; i++) { var a = i / 28 * Math.PI * 2, rr = (i % 2 ? 1.02 : 1.14); g.lineTo(x + Math.cos(a) * r * 1.1 * rr, y + Math.sin(a) * r * 0.98 * rr); }
      g.closePath();
    } else g.ellipse(x, y, r * 1.1, r * 0.96, 0, 0, Math.PI * 2);
    g.fillStyle = rgrad(g, x, y, r * 1.1, [[0, c.light], [0.45, c.base], [1, c.dark]]);
    g.fill();
    g.clip();
    // 무늬
    if (c.pat === 'tabby') {
      g.strokeStyle = 'rgba(0,0,0,0)';
      g.fillStyle = c.dark; g.globalAlpha = 0.55;
      [-0.28, 0, 0.28].forEach(function (dx, k) {
        g.beginPath(); g.moveTo(x + dx * r - r * 0.07, y - r * 0.98); g.quadraticCurveTo(x + dx * r * 0.8, y - r * (0.55 + (k === 1 ? 0.12 : 0)), x + dx * r + r * 0.07, y - r * 0.98); g.fill();
      });
      [-1, 1].forEach(function (s) {
        for (var k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x + s * r * 1.12, y + r * (0.02 + k * 0.22)); g.quadraticCurveTo(x + s * r * 0.8, y + r * (0.06 + k * 0.22), x + s * r * 0.66, y + r * (0.14 + k * 0.2)); g.quadraticCurveTo(x + s * r * 0.85, y + r * (0.16 + k * 0.22), x + s * r * 1.12, y + r * (0.16 + k * 0.22)); g.fill(); }
      });
      g.globalAlpha = 1;
    } else if (c.pat === 'spots') {
      g.fillStyle = c.dark; g.globalAlpha = 0.6;
      [[-0.5, -0.5], [0.45, -0.55], [-0.75, 0.05], [0.75, 0.0], [0, -0.75], [-0.2, -0.45], [0.22, -0.4]].forEach(function (p) { ell(g, x + p[0] * r, y + p[1] * r, r * 0.11, r * 0.08); g.fill(); });
      g.globalAlpha = 1;
    } else if (c.pat === 'calico') {
      g.fillStyle = '#e8913e'; ell(g, x + r * 0.7, y - r * 0.55, r * 0.6, r * 0.5); g.fill();
      g.fillStyle = '#3a3238'; ell(g, x - r * 0.75, y - r * 0.6, r * 0.55, r * 0.48); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; ell(g, x - r * 0.6, y - r * 0.75, r * 0.2, r * 0.1); g.fill();
    } else if (c.pat === 'point') {
      g.fillStyle = rgrad(g, x + r * 0.2, y + r * 0.45, r * 0.75, [[0, 'rgba(90,60,40,.95)'], [0.6, 'rgba(120,85,55,.6)'], [1, 'rgba(120,85,55,0)']]);
      ell(g, x, y + r * 0.25, r * 0.78, r * 0.72); g.fill();
    }
    if (c.pat === 'tux' || c.pat === 'bicolor') {
      g.fillStyle = c.pat === 'tux' ? '#f4f1ea' : '#fff8ec';
      g.beginPath(); g.moveTo(x, y - r * 0.5); g.quadraticCurveTo(x - r * 0.18, y - r * 0.05, x - r * 0.62, y + r * 0.35); g.quadraticCurveTo(x - r * 0.5, y + r * 1.0, x, y + r * 1.0); g.quadraticCurveTo(x + r * 0.5, y + r * 1.0, x + r * 0.62, y + r * 0.35); g.quadraticCurveTo(x + r * 0.18, y - r * 0.05, x, y - r * 0.5); g.fill();
    }
    // 아래 그림자(턱 밑)
    g.fillStyle = 'rgba(40,20,30,.18)'; ell(g, x + r * 0.1, y + r * 0.95, r * 1.1, r * 0.35); g.fill();
    g.restore();
    // 윤곽
    g.beginPath();
    if (c.pat === 'fluffy') { for (var j = 0; j <= 28; j++) { var b = j / 28 * Math.PI * 2, q = (j % 2 ? 1.02 : 1.14); g.lineTo(x + Math.cos(b) * r * 1.1 * q, y + Math.sin(b) * r * 0.98 * q); } g.closePath(); }
    else g.ellipse(x, y, r * 1.1, r * 0.96, 0, 0, Math.PI * 2);
    g.strokeStyle = c.dark; g.lineWidth = lw; g.stroke();
    // 주둥이 볼록
    g.fillStyle = c.pat === 'point' ? 'rgba(150,120,95,.55)' : 'rgba(255,255,255,.55)';
    ell(g, x - r * 0.2, y + r * 0.36, r * 0.24, r * 0.18); g.fill();
    ell(g, x + r * 0.2, y + r * 0.36, r * 0.24, r * 0.18); g.fill();
    // 눈
    [-1, 1].forEach(function (s) {
      var ex = x + s * r * 0.42, ey = y - r * 0.04;
      if (o.happy) {
        g.strokeStyle = '#2a1a1a'; g.lineWidth = r * 0.09;
        g.beginPath(); g.arc(ex, ey + r * 0.06, r * 0.16, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        return;
      }
      var ic = (c.odd && s > 0) ? '#e8c040' : c.eye;
      g.fillStyle = '#1e1418'; ell(g, ex, ey, r * 0.22, r * 0.25); g.fill();
      g.fillStyle = rgrad(g, ex, ey, r * 0.2, [[0, '#ffffff'], [0.25, ic], [1, '#2a2a20']]); ell(g, ex, ey, r * 0.18, r * 0.21); g.fill();
      g.fillStyle = '#120c0e'; ell(g, ex + s * r * 0.01, ey + r * 0.02, r * 0.08, r * 0.16); g.fill();
      g.fillStyle = '#fff'; ell(g, ex - r * 0.06, ey - r * 0.09, r * 0.065, r * 0.065); g.fill();
      ell(g, ex + r * 0.07, ey + r * 0.08, r * 0.03, r * 0.03); g.fill();
    });
    // 코·입
    g.fillStyle = '#e8788a'; g.beginPath(); g.moveTo(x - r * 0.1, y + r * 0.2); g.lineTo(x + r * 0.1, y + r * 0.2); g.lineTo(x, y + r * 0.31); g.closePath(); g.fill();
    g.strokeStyle = '#4a2a2a'; g.lineWidth = Math.max(0.8, r * 0.05);
    g.beginPath(); g.moveTo(x, y + r * 0.31); g.quadraticCurveTo(x - r * 0.06, y + r * 0.46, x - r * 0.17, y + r * 0.4); g.moveTo(x, y + r * 0.31); g.quadraticCurveTo(x + r * 0.06, y + r * 0.46, x + r * 0.17, y + r * 0.4); g.stroke();
    // 볼 빨강
    g.fillStyle = 'rgba(255,120,140,.25)'; ell(g, x - r * 0.68, y + r * 0.3, r * 0.17, r * 0.1); g.fill(); ell(g, x + r * 0.68, y + r * 0.3, r * 0.17, r * 0.1); g.fill();
    // 수염
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(0.6, r * 0.03);
    [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + s * r * 0.45, y + r * (0.32 + k * 0.08)); g.lineTo(x + s * r * 1.25, y + r * (0.18 + k * 0.16)); g.stroke(); } });
    if (o.goggles) {                                 // 이마에 올린 비행 고글
      g.fillStyle = '#6a3e22'; g.fillRect(x - r * 1.08, y - r * 0.62, r * 2.16, r * 0.2);
      [-1, 1].forEach(function (s) {
        g.fillStyle = '#c9a060'; ell(g, x + s * r * 0.38, y - r * 0.55, r * 0.3, r * 0.24); g.fill();
        g.fillStyle = rgrad(g, x + s * r * 0.38, y - r * 0.55, r * 0.22, [[0, '#d8fbff'], [0.5, '#6ac8e8'], [1, '#2a6a8a']]); ell(g, x + s * r * 0.38, y - r * 0.55, r * 0.2, r * 0.15); g.fill();
        g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, x + s * r * 0.38 - r * 0.07, y - r * 0.6, r * 0.06, r * 0.04); g.fill();
      });
    }
  }

  // ── 쥐 얼굴(적 조종사) ──
  function mouseHead(g, x, y, r, o) {
    o = o || {};
    var lw = Math.max(1, r * 0.08);
    [-1, 1].forEach(function (s) {
      var ex = x + s * r * 0.9, ey = y - r * 0.72;
      g.fillStyle = rgrad(g, ex, ey, r * 0.6, [[0, '#d6d6de'], [0.5, '#9a9aa6'], [1, '#5e5e6a']]); ell(g, ex, ey, r * 0.6, r * 0.58); g.fill();
      g.strokeStyle = '#4a4a56'; g.lineWidth = lw; g.stroke();
      g.fillStyle = lgrad(g, ex, ey - r * 0.4, ex, ey + r * 0.4, [[0, '#f7b7c3'], [1, '#c77788']]); ell(g, ex + s * r * 0.04, ey + r * 0.04, r * 0.36, r * 0.34); g.fill();
    });
    g.fillStyle = rgrad(g, x, y, r, [[0, '#e0e0e8'], [0.5, '#a2a2ae'], [1, '#62626e']]);
    ell(g, x, y, r, r * 0.9); g.fill(); g.strokeStyle = '#4a4a56'; g.lineWidth = lw; g.stroke();
    // 주둥이
    g.fillStyle = rgrad(g, x, y + r * 0.42, r * 0.45, [[0, '#f2f2f6'], [1, '#b8b8c2']]); ell(g, x, y + r * 0.42, r * 0.46, r * 0.34); g.fill();
    // 화난 눈썹과 눈
    [-1, 1].forEach(function (s) {
      var ex = x + s * r * 0.36, ey = y - r * 0.06;
      g.fillStyle = '#140e12'; ell(g, ex, ey, r * 0.16, r * 0.19); g.fill();
      g.fillStyle = o.red ? '#ff5a4a' : '#6a4a6a'; ell(g, ex, ey + r * 0.03, r * 0.07, r * 0.09); g.fill();
      g.fillStyle = '#fff'; ell(g, ex - r * 0.05, ey - r * 0.07, r * 0.05, r * 0.05); g.fill();
      g.strokeStyle = '#3a3040'; g.lineWidth = r * 0.1;
      g.beginPath(); g.moveTo(x + s * r * 0.58, y - r * 0.36); g.lineTo(x + s * r * 0.16, y - r * 0.22); g.stroke();
    });
    g.fillStyle = '#ff8aa0'; ell(g, x, y + r * 0.28, r * 0.12, r * 0.09); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; ell(g, x - r * 0.03, y + r * 0.25, r * 0.04, r * 0.03); g.fill();
    // 앞니
    g.fillStyle = '#fffbe8'; g.strokeStyle = '#8a8070'; g.lineWidth = Math.max(0.6, r * 0.03);
    g.fillRect(x - r * 0.1, y + r * 0.5, r * 0.09, r * 0.16); g.strokeRect(x - r * 0.1, y + r * 0.5, r * 0.09, r * 0.16);
    g.fillRect(x + r * 0.01, y + r * 0.5, r * 0.09, r * 0.16); g.strokeRect(x + r * 0.01, y + r * 0.5, r * 0.09, r * 0.16);
    g.strokeStyle = 'rgba(60,60,70,.7)'; g.lineWidth = Math.max(0.5, r * 0.025);
    [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + s * r * 0.3, y + r * (0.36 + k * 0.07)); g.lineTo(x + s * r * 1.05, y + r * (0.2 + k * 0.14)); g.stroke(); } });
    if (o.helmet) {
      g.fillStyle = lgrad(g, x, y - r, x, y - r * 0.2, [[0, '#8fb6f0'], [0.5, '#3e6ab8'], [1, '#233e78']]);
      g.beginPath(); g.moveTo(x - r * 0.95, y - r * 0.25); g.quadraticCurveTo(x - r * 0.9, y - r * 1.05, x, y - r * 1.05); g.quadraticCurveTo(x + r * 0.9, y - r * 1.05, x + r * 0.95, y - r * 0.25); g.closePath(); g.fill();
      g.strokeStyle = '#1a2a50'; g.lineWidth = lw; g.stroke();
      g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(x, y - r * 0.95); g.lineTo(x + r * 0.13, y - r * 0.55); g.lineTo(x - r * 0.13, y - r * 0.55); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; ell(g, x - r * 0.45, y - r * 0.75, r * 0.2, r * 0.08); g.fill();
    }
    if (o.crown) {
      var cy = y - r * 0.9;
      g.fillStyle = lgrad(g, x, cy - r * 0.6, x, cy + r * 0.1, [[0, '#fff2a0'], [0.5, '#f2b62a'], [1, '#a86a10']]);
      g.beginPath(); g.moveTo(x - r * 0.6, cy + r * 0.12); g.lineTo(x - r * 0.68, cy - r * 0.45); g.lineTo(x - r * 0.32, cy - r * 0.15); g.lineTo(x, cy - r * 0.62); g.lineTo(x + r * 0.32, cy - r * 0.15); g.lineTo(x + r * 0.68, cy - r * 0.45); g.lineTo(x + r * 0.6, cy + r * 0.12); g.closePath(); g.fill();
      g.strokeStyle = '#7a4a08'; g.lineWidth = lw * 0.8; g.stroke();
      ['#ff4a6a', '#4ad0ff', '#ff4a6a'].forEach(function (col, k) { g.fillStyle = col; ell(g, x + (k - 1) * r * 0.36, cy - r * 0.02, r * 0.07, r * 0.07); g.fill(); });
    }
    if (o.patch) {
      g.fillStyle = '#18121a'; ell(g, x + r * 0.36, y - r * 0.06, r * 0.22, r * 0.22); g.fill();
      g.strokeStyle = '#18121a'; g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(x - r * 0.9, y - r * 0.5); g.lineTo(x + r * 0.95, y + r * 0.2); g.stroke();
    }
  }

  // ── 쥐 비행접시 ──
  var HULL = {
    grunt:  { top: '#dfe8f0', mid: '#8ea2b6', low: '#3c4a5c', rim: '#5a6e84', light: '#7df0ff' },
    bomber: { top: '#fff0b0', mid: '#e6b43a', low: '#8a5a12', rim: '#b8801e', light: '#ff7a3a' },
    armor:  { top: '#c6dcff', mid: '#4a7ccc', low: '#1c3066', rim: '#2e4e96', light: '#ffe04a' },
    cage:   { top: '#ecd0ff', mid: '#9a62cc', low: '#40205e', rim: '#6e3ea0', light: '#ff5ad0' }
  };
  function saucer(g, cx, cy, rx, ry, col, pilot, extra) {
    // 아랫배
    g.fillStyle = lgrad(g, cx, cy, cx, cy + ry * 1.6, [[0, col.mid], [1, col.low]]);
    ell(g, cx, cy + ry * 0.35, rx * 0.62, ry * 1.1); g.fill();
    g.strokeStyle = col.low; g.lineWidth = 1.4; g.stroke();
    g.fillStyle = rgrad(g, cx, cy + ry * 1.2, ry * 0.6, [[0, '#ffffff'], [0.3, col.light], [1, 'rgba(0,0,0,0)']]);
    ell(g, cx, cy + ry * 1.25, rx * 0.22, ry * 0.4); g.fill();
    // 몸통 원반
    g.fillStyle = lgrad(g, cx, cy - ry, cx, cy + ry, [[0, col.top], [0.45, col.mid], [1, col.low]]);
    ell(g, cx, cy, rx, ry); g.fill();
    g.strokeStyle = col.low; g.lineWidth = 1.8; g.stroke();
    // 테두리 띠와 불빛
    g.strokeStyle = col.rim; g.lineWidth = 2.2; g.beginPath(); g.ellipse(cx, cy + ry * 0.15, rx * 0.86, ry * 0.62, 0, 0.05 * Math.PI, 0.95 * Math.PI); g.stroke();
    for (var i = 0; i < 5; i++) {
      var a = Math.PI * (0.18 + i * 0.16), lx = cx + Math.cos(a) * rx * 0.86, ly = cy + ry * 0.15 + Math.sin(a) * ry * 0.62;
      g.fillStyle = rgrad(g, lx, ly, 3.2, [[0, '#ffffff'], [0.4, col.light], [1, 'rgba(0,0,0,0)']]); ell(g, lx, ly, 3.4, 3.4); g.fill();
    }
    // 윗면 반사
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - rx * 0.35, cy - ry * 0.35, rx * 0.35, ry * 0.22, -0.1, 0, Math.PI * 2); g.fill();
    if (extra) extra(g);
    // 유리 돔 + 조종사
    var dr = rx * 0.52, dy = cy - ry * 0.25;
    g.save();
    g.beginPath(); g.ellipse(cx, dy, dr, dr * 1.02, 0, Math.PI, 0); g.lineTo(cx + dr, dy); g.ellipse(cx, dy, dr, ry * 0.35, 0, 0, Math.PI); g.closePath();
    g.clip();
    g.fillStyle = lgrad(g, cx, dy - dr, cx, dy, [[0, '#2a3a5a'], [1, '#141c30']]); g.fillRect(cx - dr, dy - dr * 1.1, dr * 2, dr * 1.5);
    pilot(g, cx, dy - dr * 0.12, dr * 0.62);
    g.fillStyle = lgrad(g, cx - dr, dy - dr, cx + dr, dy, [[0, 'rgba(180,240,255,.35)'], [0.5, 'rgba(120,200,255,.12)'], [1, 'rgba(60,120,200,.3)']]);
    g.fillRect(cx - dr, dy - dr * 1.1, dr * 2, dr * 1.5);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, dy, dr * 0.8, dr * 0.84, 0, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
    g.strokeStyle = 'rgba(30,40,70,.8)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, dy, dr, dr * 1.02, 0, Math.PI, 0); g.stroke();
    // 돔 받침 고리
    g.fillStyle = lgrad(g, cx, dy - 2, cx, dy + 5, [[0, col.top], [1, col.rim]]); ell(g, cx, dy + 1, dr * 1.04, ry * 0.3); g.fill();
    g.strokeStyle = col.low; g.lineWidth = 1.2; g.stroke();
  }

  function makeEnemy(type) {
    var col = HULL[type];
    if (type === 'grunt') return mk(64, 56, function (g) { saucer(g, 32, 34, 29, 11, col, function (g, x, y, r) { mouseHead(g, x, y, r); }); });
    if (type === 'bomber') return mk(68, 60, function (g) {
      saucer(g, 34, 36, 31, 12, col, function (g, x, y, r) { mouseHead(g, x, y, r); }, function (g) {
        // 옆구리 치즈 무늬
        [[14, 38], [52, 37], [34, 44]].forEach(function (p) { g.fillStyle = 'rgba(140,90,20,.55)'; ell(g, p[0], p[1], 3, 2.2); g.fill(); });
      });
    });
    if (type === 'armor') return mk(76, 64, function (g) {
      // 양옆 장갑 날개
      [-1, 1].forEach(function (s) {
        g.fillStyle = lgrad(g, 38, 20, 38, 58, [[0, '#9ab8e8'], [1, '#1e3468']]);
        g.beginPath(); g.moveTo(38 + s * 22, 30); g.lineTo(38 + s * 37, 22); g.lineTo(38 + s * 35, 50); g.lineTo(38 + s * 22, 46); g.closePath(); g.fill();
        g.strokeStyle = '#142450'; g.lineWidth = 1.6; g.stroke();
        g.fillStyle = '#ffe04a'; ell(g, 38 + s * 32, 28, 2.2, 2.2); g.fill();
      });
      saucer(g, 38, 38, 30, 12, col, function (g, x, y, r) { mouseHead(g, x, y + r * 0.1, r, { helmet: true }); });
      // 볼트
      g.fillStyle = '#c8d8f0'; [18, 28, 48, 58].forEach(function (bx) { ell(g, bx, 40, 1.5, 1.5); g.fill(); });
    });
    if (type === 'cage') return mk(92, 70, function (g) {
      saucer(g, 46, 38, 42, 15, col, function (g, x, y, r) { mouseHead(g, x, y, r, { patch: true }); }, function (g) {
        g.strokeStyle = 'rgba(255,210,255,.5)'; g.lineWidth = 1; for (var i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(46 + i * 10, 30); g.lineTo(46 + i * 11, 46); g.stroke(); }
      });
      // 갈고리
      g.strokeStyle = '#3a2a4a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(46, 52); g.lineTo(46, 66); g.stroke();
      g.beginPath(); g.arc(46, 66, 3, 0, Math.PI); g.stroke();
    });
  }

  function makeBoss(emperor) {
    var W = emperor ? 360 : 300, H = emperor ? 230 : 190;
    return mk(W, H, function (g) {
      var cx = W / 2, cy = H * 0.52, rx = W * 0.47, ry = H * 0.2;
      var top = emperor ? '#fff0b8' : '#b88aa8', mid = emperor ? '#d8a030' : '#5a2a52', low = emperor ? '#5a3808' : '#1e0c22', rim = emperor ? '#8a5a10' : '#3a1636', light = emperor ? '#ff3a5a' : '#ff5a8a';
      // 대포 두 개
      [-1, 1].forEach(function (s) {
        var px = cx + s * rx * 0.72;
        g.fillStyle = lgrad(g, px - 16, 0, px + 16, 0, [[0, low], [0.45, '#c8c8d8'], [1, low]]);
        g.fillRect(px - 12, cy + ry * 0.4, 24, ry * 1.5);
        g.strokeStyle = '#1a1a24'; g.lineWidth = 2; g.strokeRect(px - 12, cy + ry * 0.4, 24, ry * 1.5);
        g.fillStyle = '#1a1420'; ell(g, px, cy + ry * 1.9, 11, 5); g.fill();
        g.fillStyle = rgrad(g, px, cy + ry * 1.9, 8, [[0, '#fff'], [0.3, light], [1, 'rgba(0,0,0,0)']]); ell(g, px, cy + ry * 1.95, 8, 5); g.fill();
      });
      // 아랫배
      g.fillStyle = lgrad(g, cx, cy, cx, cy + ry * 2.2, [[0, mid], [1, low]]);
      ell(g, cx, cy + ry * 0.55, rx * 0.66, ry * 1.4); g.fill(); g.strokeStyle = low; g.lineWidth = 2.5; g.stroke();
      for (var k = 0; k < 7; k++) { var lx = cx + (k - 3) * rx * 0.16; g.fillStyle = rgrad(g, lx, cy + ry * 1.3, 6, [[0, '#fff'], [0.4, light], [1, 'rgba(0,0,0,0)']]); ell(g, lx, cy + ry * 1.3 + Math.abs(k - 3) * -4, 5, 5); g.fill(); }
      // 원반
      g.fillStyle = lgrad(g, cx, cy - ry, cx, cy + ry, [[0, top], [0.45, mid], [1, low]]);
      ell(g, cx, cy, rx, ry); g.fill(); g.strokeStyle = low; g.lineWidth = 3; g.stroke();
      // 장갑판 줄
      g.strokeStyle = rim; g.lineWidth = 2;
      for (var i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(cx + i * rx * 0.17, cy - ry * 0.75 * Math.cos(i / 6)); g.lineTo(cx + i * rx * 0.19, cy + ry * 0.9 * Math.cos(i / 6)); g.stroke(); }
      g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy + ry * 0.1, rx * 0.9, ry * 0.66, 0, 0.03 * Math.PI, 0.97 * Math.PI); g.stroke();
      for (var j = 0; j < 11; j++) { var a = Math.PI * (0.08 + j * 0.084), bx = cx + Math.cos(a) * rx * 0.9, by = cy + ry * 0.1 + Math.sin(a) * ry * 0.66; g.fillStyle = rgrad(g, bx, by, 5, [[0, '#fff'], [0.35, light], [1, 'rgba(0,0,0,0)']]); ell(g, bx, by, 5, 5); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(cx - rx * 0.4, cy - ry * 0.4, rx * 0.35, ry * 0.2, -0.08, 0, Math.PI * 2); g.fill();
      // 돔 + 쥐 대장
      var dr = rx * 0.34, dy = cy - ry * 0.3;
      g.save(); g.beginPath(); g.ellipse(cx, dy, dr, dr * 1.05, 0, Math.PI, 0); g.closePath(); g.clip();
      g.fillStyle = lgrad(g, cx, dy - dr, cx, dy, [[0, '#2a2040'], [1, '#100a1c']]); g.fillRect(cx - dr, dy - dr * 1.2, dr * 2, dr * 1.3);
      mouseHead(g, cx, dy - dr * 0.28, dr * 0.5, { crown: true, red: true });
      g.fillStyle = lgrad(g, cx - dr, dy - dr, cx + dr, dy, [[0, 'rgba(200,240,255,.3)'], [1, 'rgba(60,100,200,.25)']]); g.fillRect(cx - dr, dy - dr * 1.2, dr * 2, dr * 1.3);
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, dy, dr * 0.82, dr * 0.86, 0, Math.PI * 1.12, Math.PI * 1.42); g.stroke();
      g.strokeStyle = low; g.lineWidth = 2.5; g.beginPath(); g.ellipse(cx, dy, dr, dr * 1.05, 0, Math.PI, 0); g.stroke();
      g.fillStyle = lgrad(g, cx, dy - 4, cx, dy + 8, [[0, top], [1, rim]]); ell(g, cx, dy + 2, dr * 1.06, ry * 0.3); g.fill(); g.strokeStyle = low; g.lineWidth = 2; g.stroke();
      if (emperor) {                                     // 황제는 뿔 안테나와 날개
        [-1, 1].forEach(function (s) {
          g.fillStyle = lgrad(g, cx, cy - ry * 2, cx, cy, [[0, '#fff0a0'], [1, '#8a5a10']]);
          g.beginPath(); g.moveTo(cx + s * rx * 0.95, cy - ry * 0.1); g.lineTo(cx + s * rx * 1.06, cy - ry * 1.6); g.lineTo(cx + s * rx * 0.78, cy - ry * 0.5); g.closePath(); g.fill();
          g.strokeStyle = '#5a3808'; g.lineWidth = 2; g.stroke();
        });
      }
    });
  }

  // ── 내 전투기 ──
  function fighter(g, w, h, body, trim, coat, pilotOpt) {
    var cx = w / 2;
    // 엔진 두 개
    [-1, 1].forEach(function (s) {
      var ex = cx + s * w * 0.16;
      g.fillStyle = lgrad(g, ex - 6, 0, ex + 6, 0, [[0, '#3a3a48'], [0.4, '#c8ccd8'], [1, '#2a2a36']]);
      g.beginPath(); g.moveTo(ex - 6, h * 0.62); g.lineTo(ex + 6, h * 0.62); g.lineTo(ex + 5, h * 0.95); g.lineTo(ex - 5, h * 0.95); g.closePath(); g.fill();
      g.strokeStyle = '#1e1e28'; g.lineWidth = 1.4; g.stroke();
      g.fillStyle = '#18141c'; ell(g, ex, h * 0.95, 5, 2.2); g.fill();
    });
    // 날개
    [-1, 1].forEach(function (s) {
      g.beginPath();
      g.moveTo(cx + s * w * 0.08, h * 0.4); g.lineTo(cx + s * w * 0.48, h * 0.66); g.lineTo(cx + s * w * 0.47, h * 0.77); g.lineTo(cx + s * w * 0.1, h * 0.76); g.closePath();
      g.fillStyle = lgrad(g, cx, h * 0.4, cx + s * w * 0.5, h * 0.8, [[0, trim[0]], [0.6, trim[1]], [1, trim[2]]]); g.fill();
      g.strokeStyle = body[3]; g.lineWidth = 1.8; g.stroke();
      // 날개 줄무늬
      g.save(); g.clip();
      g.fillStyle = body[1]; g.beginPath(); g.moveTo(cx + s * w * 0.26, h * 0.5); g.lineTo(cx + s * w * 0.36, h * 0.56); g.lineTo(cx + s * w * 0.36, h * 0.8); g.lineTo(cx + s * w * 0.26, h * 0.8); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx + (s < 0 ? -w * 0.5 : w * 0.08), h * 0.71, w * 0.42, h * 0.06);
      g.restore();
      g.fillStyle = rgrad(g, cx + s * w * 0.46, h * 0.7, 3, [[0, '#fff'], [0.4, s < 0 ? '#ff4a4a' : '#4aff7a'], [1, 'rgba(0,0,0,0)']]); ell(g, cx + s * w * 0.46, h * 0.7, 3.5, 3.5); g.fill();
    });
    // 꼬리 날개
    [-1, 1].forEach(function (s) {
      g.beginPath(); g.moveTo(cx + s * w * 0.05, h * 0.74); g.lineTo(cx + s * w * 0.22, h * 0.9); g.lineTo(cx + s * w * 0.05, h * 0.88); g.closePath();
      g.fillStyle = body[1]; g.fill(); g.strokeStyle = body[3]; g.lineWidth = 1.4; g.stroke();
    });
    // 동체(원통 명암)
    g.beginPath();
    g.moveTo(cx, h * 0.02);
    g.bezierCurveTo(cx + w * 0.15, h * 0.12, cx + w * 0.15, h * 0.4, cx + w * 0.13, h * 0.86);
    g.quadraticCurveTo(cx, h * 0.92, cx - w * 0.13, h * 0.86);
    g.bezierCurveTo(cx - w * 0.15, h * 0.4, cx - w * 0.15, h * 0.12, cx, h * 0.02);
    g.closePath();
    g.fillStyle = lgrad(g, cx - w * 0.15, 0, cx + w * 0.15, 0, [[0, body[2]], [0.35, body[0]], [0.55, body[1]], [1, body[2]]]); g.fill();
    g.strokeStyle = body[3]; g.lineWidth = 2; g.stroke();
    // 코끝
    g.save(); g.clip();
    g.fillStyle = lgrad(g, cx - 8, 0, cx + 8, 0, [[0, '#8a1e1e'], [0.4, '#ff6a5a'], [1, '#7a1a1a']]); g.fillRect(cx - w * 0.2, 0, w * 0.4, h * 0.13);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - w * 0.2, h * 0.64); g.lineTo(cx + w * 0.2, h * 0.64); g.stroke();
    g.restore();
    // 조종석 유리
    var gy = h * 0.4, gr = w * 0.13;
    g.fillStyle = '#1a2230'; ell(g, cx, gy, gr * 1.05, gr * 1.35); g.fill();
    g.save(); ell(g, cx, gy, gr, gr * 1.3); g.clip();
    g.fillStyle = lgrad(g, cx, gy - gr * 1.3, cx, gy + gr * 1.3, [[0, '#3a5a80'], [1, '#12203a']]); g.fillRect(cx - gr, gy - gr * 1.4, gr * 2, gr * 2.8);
    catHead(g, cx, gy + gr * 0.2, gr * 0.72, coat, pilotOpt);
    g.fillStyle = lgrad(g, cx - gr, gy - gr, cx + gr, gy + gr, [[0, 'rgba(200,245,255,.4)'], [0.5, 'rgba(120,200,255,.08)'], [1, 'rgba(40,80,160,.3)']]); g.fillRect(cx - gr, gy - gr * 1.4, gr * 2, gr * 2.8);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(cx, gy, gr * 0.75, gr * 1.05, 0, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    g.strokeStyle = body[3]; g.lineWidth = 1.6; ell(g, cx, gy, gr, gr * 1.3); g.stroke();
  }
  var PLAYER_BODY = ['#ffd8a0', '#f58a2e', '#9a4a14', '#5a2a0c'], PLAYER_TRIM = ['#fff6e8', '#f2e2cc', '#b8a48a'];
  var WING_BODY = ['#c8f4e8', '#48b8a0', '#1e6a5a', '#123e36'], WING_TRIM = ['#ffffff', '#e2f0ec', '#98b8b0'];

  // ── 새장(낙하산에 매달려 떨어진다) ──
  function makeCage(coat) {
    return mk(56, 92, function (g, w) {
      var cx = w / 2;
      // 낙하산
      g.beginPath(); g.moveTo(cx - 26, 26); g.bezierCurveTo(cx - 26, -4, cx + 26, -4, cx + 26, 26);
      for (var i = 4; i >= 0; i--) { var x0 = cx - 26 + i * 13; g.quadraticCurveTo(x0 + 6.5 - 13, 20, x0 - 13 + 13, 26); }
      g.closePath();
      g.save(); g.clip();
      for (var k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#fff2ea' : '#ff5a5a'; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx - 40 + k * 20, 30); g.lineTo(cx - 20 + k * 20, 30); g.closePath(); g.fill(); }
      g.fillStyle = lgrad(g, cx - 26, 0, cx + 26, 26, [[0, 'rgba(255,255,255,.35)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(60,0,20,.35)']]); g.fillRect(0, 0, w, 30);
      g.restore();
      g.strokeStyle = '#8a2a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 26, 26); g.bezierCurveTo(cx - 26, -4, cx + 26, -4, cx + 26, 26); g.stroke();
      g.strokeStyle = 'rgba(80,60,50,.8)'; g.lineWidth = 0.8;
      [-26, -10, 10, 26].forEach(function (dx) { g.beginPath(); g.moveTo(cx + dx, 26); g.lineTo(cx + dx * 0.25, 44); g.stroke(); });
      // 새장
      var top = 44, bot = 88;
      g.fillStyle = 'rgba(20,20,40,.35)'; g.beginPath(); g.moveTo(cx - 18, bot); g.lineTo(cx - 18, top + 14); g.quadraticCurveTo(cx, top - 6, cx + 18, top + 14); g.lineTo(cx + 18, bot); g.fill();
      catHead(g, cx, bot - 17, 11, coat);
      g.strokeStyle = lgrad(g, cx - 18, 0, cx + 18, 0, [[0, '#8a6a1a'], [0.4, '#ffe08a'], [1, '#7a5a12']]);
      g.lineWidth = 2;
      for (var b = -3; b <= 3; b++) { g.beginPath(); g.moveTo(cx + b * 6, bot); g.lineTo(cx + b * 6, top + 14 - (3 - Math.abs(b)) * 4); g.stroke(); }
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx - 18, top + 14); g.quadraticCurveTo(cx, top - 6, cx + 18, top + 14); g.stroke();
      g.fillStyle = lgrad(g, cx, bot - 4, cx, bot + 3, [[0, '#ffe08a'], [1, '#7a5a12']]); g.fillRect(cx - 21, bot - 4, 42, 6);
      g.fillStyle = '#ffe08a'; ell(g, cx, top + 2, 3, 3); g.fill();
    });
  }

  // ── 작은 물건들 ──
  function coin(g, x, y, r, big) {
    g.fillStyle = '#8a5a08'; ell(g, x + r * 0.12, y + r * 0.12, r, r); g.fill();
    g.fillStyle = rgrad(g, x, y, r, [[0, '#fff6c0'], [0.45, big ? '#ffc830' : '#f6b822'], [1, '#b87808']]); ell(g, x, y, r, r); g.fill();
    g.strokeStyle = '#8a5a08'; g.lineWidth = r * 0.14; g.stroke();
    g.strokeStyle = 'rgba(150,95,10,.8)'; g.lineWidth = r * 0.1; ell(g, x, y, r * 0.7, r * 0.7); g.stroke();
    // 발바닥 도장
    g.fillStyle = 'rgba(160,100,10,.8)'; ell(g, x, y + r * 0.15, r * 0.26, r * 0.2); g.fill();
    [-0.3, -0.1, 0.1, 0.3].forEach(function (d, i) { ell(g, x + d * r * 1.1, y - r * (0.18 + (i === 1 || i === 2 ? 0.1 : 0)), r * 0.09, r * 0.11); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.8)'; ell(g, x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.1); g.fill();
  }
  function fish(g, x, y, s, gold) {
    var a = gold ? ['#fff4b0', '#f2b21e', '#8a5a08'] : ['#d8f4ff', '#4aa6e0', '#1a4a7a'];
    g.fillStyle = lgrad(g, x, y - s * 0.5, x, y + s * 0.5, [[0, a[0]], [0.5, a[1]], [1, a[2]]]);
    g.beginPath(); g.moveTo(x + s, y); g.quadraticCurveTo(x + s * 0.3, y - s * 0.6, x - s * 0.6, y); g.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s, y); g.fill();
    g.beginPath(); g.moveTo(x - s * 0.5, y); g.lineTo(x - s * 1.05, y - s * 0.45); g.lineTo(x - s * 0.9, y); g.lineTo(x - s * 1.05, y + s * 0.45); g.closePath(); g.fill();
    g.strokeStyle = a[2]; g.lineWidth = s * 0.08; g.beginPath(); g.moveTo(x + s, y); g.quadraticCurveTo(x + s * 0.3, y - s * 0.6, x - s * 0.6, y); g.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s, y); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = s * 0.06; for (var i = 0; i < 3; i++) { g.beginPath(); g.arc(x + s * (0.05 - i * 0.2), y, s * 0.28, -0.9, 0.9); g.stroke(); }
    g.fillStyle = '#fff'; ell(g, x + s * 0.62, y - s * 0.08, s * 0.13, s * 0.13); g.fill();
    g.fillStyle = '#111'; ell(g, x + s * 0.65, y - s * 0.08, s * 0.07, s * 0.07); g.fill();
  }
  function cheese(g, x, y, s) {
    g.fillStyle = '#b88010'; g.beginPath(); g.moveTo(x - s, y + s * 0.3); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s, y + s * 0.75); g.lineTo(x - s, y + s * 0.75); g.closePath(); g.fill();
    g.fillStyle = lgrad(g, x, y - s, x, y + s * 0.3, [[0, '#fff2a0'], [1, '#f2c030']]);
    g.beginPath(); g.moveTo(x - s, y + s * 0.3); g.lineTo(x + s * 0.2, y - s * 0.8); g.lineTo(x + s, y + s * 0.3); g.closePath(); g.fill();
    g.strokeStyle = '#8a5a08'; g.lineWidth = s * 0.12; g.beginPath(); g.moveTo(x - s, y + s * 0.3); g.lineTo(x + s * 0.2, y - s * 0.8); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s, y + s * 0.75); g.lineTo(x - s, y + s * 0.75); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(170,110,10,.75)'; ell(g, x - s * 0.3, y + s * 0.52, s * 0.14, s * 0.1); g.fill(); ell(g, x + s * 0.5, y + s * 0.5, s * 0.1, s * 0.08); g.fill(); ell(g, x + s * 0.1, y - s * 0.05, s * 0.14, s * 0.1); g.fill();
  }
  function bubble(g, x, y, r) {
    g.fillStyle = rgrad(g, x, y, r, [[0, 'rgba(255,255,255,.1)'], [0.7, 'rgba(120,220,255,.25)'], [1, 'rgba(160,240,255,.85)']]); ell(g, x, y, r, r); g.fill();
    g.strokeStyle = 'rgba(220,250,255,.9)'; g.lineWidth = r * 0.08; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)'; ell(g, x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.12); g.fill();
    // 발바닥
    g.fillStyle = '#ff8ab0'; ell(g, x, y + r * 0.15, r * 0.3, r * 0.24); g.fill();
    [-0.36, -0.12, 0.12, 0.36].forEach(function (d, i) { ell(g, x + d * r, y - r * (0.2 + (i === 1 || i === 2 ? 0.12 : 0)), r * 0.1, r * 0.13); g.fill(); });
  }

  // ── 구름·배경 ──
  function hash(i, j, s) { var v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); }
  function vnoise(x, y, px, py, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var m = function (a, p) { return ((a % p) + p) % p; };
    var a = hash(m(xi, px), m(yi, py), s), b = hash(m(xi + 1, px), m(yi, py), s), c = hash(m(xi, px), m(yi + 1, py), s), d = hash(m(xi + 1, px), m(yi + 1, py), s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, px, py, s) { var t = 0, amp = 0.5; for (var o = 0; o < 5; o++) { t += amp * vnoise(x, y, px, py, s + o); x *= 2; y *= 2; px *= 2; py *= 2; amp *= 0.5; } return t; }
  function hexA(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }

  // 위아래·양옆으로 이어지는 구름 층(투명 바탕). 빛 받는 윗면은 밝게, 아랫면은 그림자색
  function fbm4(x, y, px, py, s) { var t = 0, amp = 0.5, norm = 0; for (var o = 0; o < 4; o++) { t += amp * vnoise(x, y, px, py, s + o * 17); norm += amp; x *= 2; y *= 2; px *= 2; py *= 2; amp *= 0.5; } return t / norm; }
  // 뭉게구름 띠: 동그라미 덩어리를 그림자 → 몸통 → 빛 받는 윗면 순서로 칠한다. 위아래·양옆 이음매가 없게 9번 겹쳐 찍는다
  function cloudTile(pal, cover, alpha, seed) {
    var TW = 540, TH = 1080;
    var big = document.createElement('canvas'); big.width = TW; big.height = TH;
    var g = big.getContext('2d');
    var rnd = (function () { var s = seed * 9301 + 49297; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
    var clusters = [], n = Math.round(9 * (1 - cover) + 1.5);
    for (var i = 0; i < n; i++) {
      var cx = rnd() * TW, cy = rnd() * TH, wdt = 90 + rnd() * 170, blobs = [];
      var m = 7 + Math.floor(rnd() * 8);
      for (var j = 0; j < m; j++) {
        var t = j / (m - 1) - 0.5;
        var r = (16 + rnd() * 26) * (1 - Math.abs(t) * 0.9);
        blobs.push([cx + t * wdt + (rnd() - 0.5) * 20, cy - r * 0.5 + (rnd() - 0.5) * 10 + Math.abs(t) * 20, r]);
      }
      clusters.push(blobs);
    }
    var pass = function (fn) {
      for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
        g.save(); g.translate(ox * TW, oy * TH); clusters.forEach(fn); g.restore();
      }
    };
    g.globalAlpha = alpha;
    pass(function (bl) { g.fillStyle = pal[2]; bl.forEach(function (b) { ell(g, b[0], b[1] + b[2] * 0.25, b[2] * 1.05, b[2] * 0.85); g.fill(); }); });
    pass(function (bl) { bl.forEach(function (b) { g.fillStyle = rgrad(g, b[0], b[1], b[2], [[0, pal[0]], [0.5, pal[1]], [1, pal[2]]]); ell(g, b[0], b[1], b[2], b[2] * 0.88); g.fill(); }); });
    pass(function (bl) { g.fillStyle = pal[0]; bl.forEach(function (b) { g.globalAlpha = alpha * 0.55; ell(g, b[0] - b[2] * 0.25, b[1] - b[2] * 0.35, b[2] * 0.45, b[2] * 0.3); g.fill(); }); });
    g.globalAlpha = 1;
    return big;
  }
  // 가까이 스쳐 가는 뭉게구름 한 덩이
  function puff(pal, w, h, seed) {
    return mk(w, h, function (g) {
      var r = function (i) { return hash(i, 3, seed); };
      var blobs = [];
      for (var i = 0; i < 9; i++) {
        var t = i / 8 - 0.5, rr = h * (0.16 + 0.14 * r(i + 40)) * (1 - Math.abs(t) * 0.8);
        blobs.push([w / 2 + t * (w - rr * 2 - 16), h * 0.58 - rr * 0.4 + (r(i + 20) - 0.5) * h * 0.1, rr]);
      }
      blobs.forEach(function (b) { g.fillStyle = pal[2]; ell(g, b[0] + 2, b[1] + h * 0.08, b[2], b[2] * 0.9); g.fill(); });
      blobs.forEach(function (b) { g.fillStyle = rgrad(g, b[0], b[1], b[2], [[0, pal[0]], [0.55, pal[1]], [1, pal[2]]]); ell(g, b[0], b[1], b[2], b[2] * 0.9); g.fill(); });
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = lgrad(g, 0, h * 0.4, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(40,20,60,.35)']]); g.fillRect(0, 0, w, h);
    });
  }

  var WORLDS = [
    { sky: [[0, '#241f5c'], [0.45, '#8a3f86'], [0.78, '#e8768a'], [1, '#ffc28a']], cloud: ['#ffd6b8', '#e6849e', '#6a3a78'], cover: 0.5, alpha: 0.85, stars: 0.25, sun: { x: 0.72, y: 0.84, r: 70, c: '#fff0c0', glow: 'rgba(255,170,110,' }, puff: ['#ffe0c8', '#f0a0b0', '#8a4a88'] },
    { sky: [[0, '#040720'], [0.55, '#14225a'], [1, '#3a3f88']], cloud: ['#aabce8', '#46548e', '#141a44'], cover: 0.56, alpha: 0.7, stars: 1, moon: { x: 0.25, y: 0.22, r: 46 }, puff: ['#c8d4f4', '#6a78b0', '#1e2458'] },
    { sky: [[0, '#020a14'], [0.6, '#08283a'], [1, '#12505a']], cloud: ['#9ff2e0', '#2a8a8a', '#062a3a'], cover: 0.6, alpha: 0.4, stars: 1, aurora: true, puff: ['#bff8ec', '#3a9a9a', '#0a3440'] },
    { sky: [[0, '#01030a'], [0.7, '#060c22'], [1, '#101a3a']], cloud: ['#c8c0e8', '#50486e', '#10102a'], cover: 0.66, alpha: 0.28, stars: 1.3, planet: { x: 0.8, y: 0.7, r: 190, a: '#e8e2d8', b: '#8a8478', c: '#2a2830' }, puff: null },
    { sky: [[0, '#0a0218'], [0.5, '#2a0a3a'], [1, '#4a1450']], cloud: ['#ffb0f0', '#b43a9a', '#2a0a3a'], cover: 0.48, alpha: 0.55, stars: 1.2, ring: { x: 0.22, y: 0.3, r: 60 }, puff: null }
  ];
  var tiles = {}, puffs = {};
  function worldTile(i) { if (!tiles[i]) { var w = WORLDS[i]; tiles[i] = [cloudTile(w.cloud, w.cover, w.alpha, i * 10 + 1), cloudTile(w.cloud, w.cover + 0.06, w.alpha * 0.8, i * 10 + 5)]; } return tiles[i]; }
  function worldPuffs(i) {
    if (puffs[i] !== undefined) return puffs[i];
    var w = WORLDS[i]; if (!w.puff) return (puffs[i] = null);
    return (puffs[i] = [puff(w.puff, 220, 110, i + 1), puff(w.puff, 160, 90, i + 7), puff(w.puff, 260, 120, i + 13)]);
  }
  var STARS = []; for (var si = 0; si < 160; si++) STARS.push([hash(si, 1, 9), hash(si, 2, 9), 0.4 + hash(si, 3, 9) * 1.4, hash(si, 4, 9) * 6.28]);

  function planetSprite(p) {
    return mk(p.r * 2 + 20, p.r * 2 + 20, function (g) {
      var x = p.r + 10, y = p.r + 10, r = p.r;
      g.fillStyle = rgrad(g, x, y, r, [[0, p.a], [0.55, p.b], [1, p.c]]); ell(g, x, y, r, r); g.fill();
      g.save(); ell(g, x, y, r, r); g.clip();
      for (var i = 0; i < 26; i++) { var cx = x + (hash(i, 7, 3) - 0.5) * r * 1.8, cy = y + (hash(i, 8, 3) - 0.5) * r * 1.8, cr = r * (0.03 + hash(i, 9, 3) * 0.12); g.fillStyle = 'rgba(0,0,0,.18)'; ell(g, cx + cr * 0.15, cy + cr * 0.15, cr, cr); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; ell(g, cx - cr * 0.1, cy - cr * 0.1, cr * 0.8, cr * 0.8); g.fill(); }
      g.fillStyle = rgrad(g, x + r * 0.6, y + r * 0.6, r * 1.2, [[0, 'rgba(0,0,10,.75)'], [0.6, 'rgba(0,0,10,.3)'], [1, 'rgba(0,0,10,0)']]); g.fillRect(0, 0, r * 3, r * 3);
      g.restore();
      g.strokeStyle = 'rgba(180,200,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 1, Math.PI * 0.9, Math.PI * 1.6); g.stroke();
    });
  }
  var planetC = null, ringC = null, moonC = null;

  // 배경 그리기: x0..x1 은 논리 좌표 폭(화면이 넓으면 게임판 밖까지), H 는 논리 높이
  function drawBg(g, wi, t, x0, x1, H, scroll) {
    var w = WORLDS[wi % WORLDS.length];
    var gr = g.createLinearGradient(0, 0, 0, H); w.sky.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, H);
    var tw = x1 - x0;
    if (w.stars) {
      for (var i = 0; i < STARS.length; i++) {
        var s = STARS[i], sx = x0 + s[0] * tw, sy = ((s[1] * H + scroll * 0.05 * s[2]) % H);
        var a = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + s[3]))) * Math.min(1, w.stars) * (w.sun ? Math.max(0, 1 - sy / (H * 0.5)) : 1);
        if (a <= 0.02) continue;
        g.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; g.fillRect(sx, sy, s[2] * (w.stars > 1 ? 1.3 : 1), s[2] * (w.stars > 1 ? 1.3 : 1));
      }
    }
    var sunX = 0, sunY = 0;
    if (w.sun) {
      sunX = x0 + tw * w.sun.x; sunY = H * w.sun.y;
      var sd = g.createRadialGradient(sunX, sunY, w.sun.r * 0.2, sunX, sunY, w.sun.r);
      sd.addColorStop(0, '#fffdf0'); sd.addColorStop(0.6, '#ffe6a8'); sd.addColorStop(1, '#ffb070');
      g.fillStyle = sd; ell(g, sunX, sunY, w.sun.r, w.sun.r); g.fill();
    }
    if (w.moon) {
      var mx = x0 + tw * w.moon.x, my = H * w.moon.y, mr = w.moon.r;
      var mg = g.createRadialGradient(mx, my, mr, mx, my, mr * 4); mg.addColorStop(0, 'rgba(180,200,255,.25)'); mg.addColorStop(1, 'rgba(180,200,255,0)');
      g.fillStyle = mg; ell(g, mx, my, mr * 4, mr * 4); g.fill();
      if (!moonC) moonC = planetSprite({ r: mr, a: '#fbf6e8', b: '#d8d0c0', c: '#9a9488' });
      g.drawImage(moonC, mx - moonC.lw / 2, my - moonC.lh / 2, moonC.lw, moonC.lh);
    }
    if (w.planet) {
      if (!planetC) planetC = planetSprite(w.planet);
      g.drawImage(planetC, x0 + tw * w.planet.x - planetC.lw / 2, H * w.planet.y - planetC.lh / 2 + (scroll * 0.01) % 40, planetC.lw, planetC.lh);
    }
    if (w.ring) {
      if (!ringC) ringC = mk(260, 140, function (g2) {
        g2.strokeStyle = 'rgba(255,200,240,.55)'; g2.lineWidth = 10; g2.beginPath(); g2.ellipse(130, 70, 120, 26, -0.25, Math.PI, Math.PI * 2); g2.stroke();
        g2.fillStyle = rgrad(g2, 130, 70, 60, [[0, '#ffe0f4'], [0.5, '#c060b0'], [1, '#3a1040']]); ell(g2, 130, 70, 60, 60); g2.fill();
        g2.strokeStyle = 'rgba(255,220,250,.8)'; g2.lineWidth = 10; g2.beginPath(); g2.ellipse(130, 70, 120, 26, -0.25, 0, Math.PI); g2.stroke();
      });
      g.drawImage(ringC, x0 + tw * w.ring.x - 130, H * w.ring.y - 70, 260, 140);
    }
    if (w.aurora) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 3; b++) {
        g.beginPath();
        for (var x = x0; x <= x1 + 20; x += 20) { var yy = H * (0.18 + b * 0.1) + Math.sin(x * 0.006 + t * 0.4 + b) * 50 + Math.sin(x * 0.017 - t * 0.7) * 16; if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); }
        for (var x2 = x1 + 20; x2 >= x0; x2 -= 20) { var y2 = H * (0.18 + b * 0.1) + Math.sin(x2 * 0.006 + t * 0.4 + b) * 50 + Math.sin(x2 * 0.017 - t * 0.7) * 16 + 140; g.lineTo(x2, y2); }
        g.closePath();
        var ag = g.createLinearGradient(0, H * (0.12 + b * 0.1), 0, H * (0.12 + b * 0.1) + 200);
        ag.addColorStop(0, 'rgba(120,255,190,0)'); ag.addColorStop(0.3, b === 1 ? 'rgba(170,120,255,.16)' : 'rgba(110,255,180,.18)'); ag.addColorStop(0.55, 'rgba(80,220,200,.05)'); ag.addColorStop(1, 'rgba(60,200,255,0)');
        g.fillStyle = ag; g.fill();
      }
      g.restore();
    }
    // 구름 층 두 겹(느린 것·빠른 것)
    var tl = worldTile(wi % WORLDS.length);
    [[tl[0], 0.22, 0.4, 0.55], [tl[1], 0.6, 0.85, 1]].forEach(function (L, k) {
      var TWd = 540 * L[3], THd = 1080 * L[3];
      var off = (scroll * L[1]) % THd;
      var startX = Math.floor((x0 + k * 170) / TWd) * TWd - k * 170;
      g.globalAlpha = L[2];
      for (var yy2 = off - THd; yy2 < H; yy2 += THd) for (var xx = startX; xx < x1; xx += TWd) g.drawImage(L[0], xx, yy2, TWd, THd);
      g.globalAlpha = 1;
    });
    // 해 빛은 구름 위에 한 겹 더(구름 가장자리가 물든다)
    if (w.sun) {
      g.save(); g.globalCompositeOperation = 'lighter';
      var sg = g.createRadialGradient(sunX, sunY, w.sun.r * 0.5, sunX, sunY, 420);
      sg.addColorStop(0, w.sun.glow + '.55)'); sg.addColorStop(0.25, w.sun.glow + '.22)'); sg.addColorStop(1, w.sun.glow + '0)');
      g.fillStyle = sg; g.fillRect(sunX - 420, sunY - 420, 840, 840);
      g.restore();
    }
  }

  var A = {
    SPR: SPR, COATS: COATS, WORLDS: WORLDS,
    catHead: catHead, mouseHead: mouseHead, coinDraw: coin, fishDraw: fish, cheeseDraw: cheese, bubbleDraw: bubble,
    drawBg: drawBg, worldPuffs: worldPuffs, mk: mk, flashOf: flashOf,
    init: function () {
      A.player = mk(84, 96, function (g, w, h) { fighter(g, w, h, PLAYER_BODY, PLAYER_TRIM, COATS[0], { goggles: true }); });
      A.wing = COATS.map(function (c) { return mk(56, 64, function (g, w, h) { fighter(g, w, h, WING_BODY, WING_TRIM, c); }); });
      A.enemy = {}; A.enemyFlash = {};
      ['grunt', 'bomber', 'armor', 'cage'].forEach(function (t) { A.enemy[t] = makeEnemy(t); A.enemyFlash[t] = flashOf(A.enemy[t]); });
      A.enemy.boss = makeBoss(false); A.enemyFlash.boss = flashOf(A.enemy.boss);
      A.enemy.emperor = makeBoss(true); A.enemyFlash.emperor = flashOf(A.enemy.emperor);
      A.cage = COATS.map(makeCage);
      A.coin = mk(24, 24, function (g) { coin(g, 11, 11, 9); });
      A.coinBig = mk(34, 34, function (g) { coin(g, 16, 16, 14, true); });
      A.fish = mk(84, 60, function (g) {
        var gr = g.createRadialGradient(42, 30, 8, 42, 30, 40); gr.addColorStop(0, 'rgba(160,240,255,.55)'); gr.addColorStop(0.6, 'rgba(90,200,255,.22)'); gr.addColorStop(1, 'rgba(90,200,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 84, 60);
        g.save(); g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 6; fish(g, 46, 30, 26); g.restore();
        fish(g, 46, 30, 26);
      });
      A.goldfish = mk(52, 34, function (g) { fish(g, 28, 17, 19, true); });
      // 치즈 폭탄: 빨간 경고 빛 + 빨간 테두리 + 심지(불꽃은 게임에서 깜빡이게 그린다). 가운데 (22,25), 심지 끝 (+7,-20)
      A.cheese = mk(44, 50, function (g) {
        var gr = g.createRadialGradient(22, 30, 4, 22, 30, 22); gr.addColorStop(0, 'rgba(255,60,40,.45)'); gr.addColorStop(1, 'rgba(255,40,40,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 44, 50);
        var x = 22, y = 31, s = 13;
        g.strokeStyle = '#ff2e2e'; g.lineWidth = 6; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(x - s, y + s * 0.3); g.lineTo(x + s * 0.2, y - s * 0.8); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s, y + s * 0.75); g.lineTo(x - s, y + s * 0.75); g.closePath(); g.stroke();
        cheese(g, x, y, s);
        // 심지
        g.strokeStyle = '#2a1a10'; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(x + s * 0.2, y - s * 0.8); g.quadraticCurveTo(x + 1, y - 17, x + 7, y - 26); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x + s * 0.2 - 0.6, y - s * 0.8); g.quadraticCurveTo(x, y - 17, x + 6.2, y - 25.6); g.stroke();
      });
      A.bubble = mk(40, 40, function (g) { bubble(g, 20, 20, 17); });
      A.chest = mk(40, 36, function (g) {
        g.fillStyle = lgrad(g, 0, 10, 0, 34, [[0, '#c87a3a'], [1, '#6a3a14']]); g.fillRect(4, 14, 32, 20);
        g.fillStyle = lgrad(g, 0, 2, 0, 16, [[0, '#e8a060'], [1, '#8a4a1a']]); g.beginPath(); g.moveTo(4, 16); g.quadraticCurveTo(20, 0, 36, 16); g.closePath(); g.fill();
        g.strokeStyle = '#3a1e08'; g.lineWidth = 1.6; g.strokeRect(4, 14, 32, 20); g.beginPath(); g.moveTo(4, 16); g.quadraticCurveTo(20, 0, 36, 16); g.stroke();
        g.fillStyle = '#ffd24a'; g.fillRect(17, 12, 6, 10); g.fillRect(4, 20, 32, 3);
      });
      worldTile(0);
    }
  };
  window.MSArt = A;
})();
