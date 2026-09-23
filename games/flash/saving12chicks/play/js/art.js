/* 집으로 가는 수탉 — 그림. 수탉만 스프라이트(img/rooster.png), 나머지는 전부 캔버스 코드.
 * 세계 좌표: 높이 540, 바닥 FY=470. 빛은 왼쪽 위에서 오고 그림자는 오른쪽 아래.
 * window.ART = { FY, ZONES, sky, far, mid, ground, prop, enemy, chick, item, rooster, vignette, hash }
 */
(function () {
  'use strict';
  var PI = Math.PI, FY = 470;
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, PI * 2); c.closePath(); }
  function lg(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
  function rg(c, x, y, r0, x1, y1, r1, stops) { var g = c.createRadialGradient(x, y, r0, x1, y1, r1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
  function shadow(c, x, y, rx, ry, a) { c.fillStyle = 'rgba(20,14,8,' + (a || 0.28) + ')'; ell(c, x, y, rx, ry); c.fill(); }
  // 구 모양 명암(밝은 면 왼쪽 위)
  function ball(c, x, y, rx, ry, hi, mid, dk, rot) {
    c.fillStyle = rg(c, x - rx * 0.35, y - ry * 0.4, rx * 0.1, x, y, Math.max(rx, ry) * 1.1, [0, hi, 0.55, mid, 1, dk]);
    ell(c, x, y, rx, ry, rot); c.fill();
  }

  // ── 구역 팔레트: 하늘 위/중/아래, 해 위치, 먼 산, 땅 밝음/어두움, 안개색 ──
  var ZONES = [
    { name: '마당', en: 'FARMYARD', top: '#6fb1e6', midc: '#bfe0f5', bot: '#ffe6b8', sun: [0.18, 0.28], sunC: '#fff2c2', far: '#8fb59a', far2: '#6d9a7c', g1: '#7fb04a', g2: '#5c8b33', dirt: '#b98a5a', dirt2: '#8f6540', fog: 'rgba(255,240,210,', night: 0 },
    { name: '들판', en: 'FIELDS', top: '#3f8fe0', midc: '#8ec8f2', bot: '#dff1ff', sun: [0.5, 0.12], sunC: '#fffbe0', far: '#7fae74', far2: '#5f8f5c', g1: '#86bb4d', g2: '#5f9236', dirt: '#b58c5d', dirt2: '#8a6440', fog: 'rgba(230,245,255,', night: 0 },
    { name: '시골길', en: 'COUNTRY ROAD', top: '#4b95d6', midc: '#a9d3ee', bot: '#ffe9c4', sun: [0.7, 0.2], sunC: '#fff5cc', far: '#8aab86', far2: '#678b66', g1: '#8fb857', g2: '#66933a', dirt: '#6b6b70', dirt2: '#4c4c52', fog: 'rgba(255,235,200,', night: 0 },
    { name: '개울', en: 'STREAM', top: '#5c6fb8', midc: '#e79c6a', bot: '#ffd08a', sun: [0.82, 0.42], sunC: '#ffd27a', far: '#7c6e8f', far2: '#5c5273', g1: '#6f9a45', g2: '#4b7030', dirt: '#8f7052', dirt2: '#66503a', fog: 'rgba(255,190,130,', night: 0 },
    { name: '마을', en: 'VILLAGE', top: '#2f2a63', midc: '#8b5a8f', bot: '#f0906a', sun: [0.88, 0.52], sunC: '#ffb060', far: '#4d3f66', far2: '#35294b', g1: '#587a3e', g2: '#3d572b', dirt: '#6d5a4b', dirt2: '#4a3d33', fog: 'rgba(120,70,110,', night: 0.35 },
    { name: '밤길', en: 'NIGHT', top: '#0a0f2e', midc: '#1c2a5e', bot: '#2e3f78', sun: [0.75, 0.16], sunC: '#f4f1d8', far: '#1c2846', far2: '#131b33', g1: '#2f5030', g2: '#1f3720', dirt: '#3b3a4a', dirt2: '#26252f', fog: 'rgba(20,30,70,', night: 0.8 },
    { name: '새벽', en: 'DAWN', top: '#5b6fb5', midc: '#f2a985', bot: '#ffe3a8', sun: [0.5, 0.36], sunC: '#fff0c0', far: '#8a7f9c', far2: '#6a617f', g1: '#7fb04a', g2: '#5c8b33', dirt: '#b98a5a', dirt2: '#8f6540', fog: 'rgba(255,220,190,', night: 0.05 }
  ];

  // ── 하늘 ──
  function sky(c, z, t, VW, cam) {
    var Z = ZONES[z];
    c.fillStyle = lg(c, 0, 0, 0, FY, [0, Z.top, 0.55, Z.midc, 1, Z.bot]); c.fillRect(0, 0, VW, FY + 10);
    var sx = Z.sun[0] * VW - cam * 0.02, sy = Z.sun[1] * FY;
    if (Z.night > 0.5) {   // 별·달
      for (var i = 0; i < 70; i++) { var px = (hash(i * 3) * 1400 - cam * 0.03) % 1400, py = hash(i * 3 + 1) * 300; if (px < 0) px += 1400; c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); c.fillStyle = '#fff'; c.fillRect(px, py, 2, 2); }
      c.globalAlpha = 1;
      c.fillStyle = rg(c, sx, sy, 20, sx, sy, 120, [0, 'rgba(255,250,220,.5)', 1, 'rgba(255,250,220,0)']); c.fillRect(sx - 130, sy - 130, 260, 260);
      ball(c, sx, sy, 26, 26, '#fffbe8', '#e8e2c0', '#b8b090');
      c.fillStyle = 'rgba(160,150,120,.25)'; ell(c, sx - 8, sy + 4, 6, 5); c.fill(); ell(c, sx + 9, sy - 7, 4, 4); c.fill(); ell(c, sx + 6, sy + 10, 3, 3); c.fill();
    } else {
      c.fillStyle = rg(c, sx, sy, 10, sx, sy, 220, [0, 'rgba(255,255,230,.9)', 0.2, 'rgba(255,240,200,.35)', 1, 'rgba(255,240,200,0)']); c.fillRect(sx - 230, sy - 230, 460, 460);
      c.fillStyle = Z.sunC; ell(c, sx, sy, 30, 30); c.fill();
    }
    // 구름
    for (var k = 0; k < 6; k++) {
      var cx = ((hash(k * 7 + z) * 1600 - cam * (0.06 + k * 0.01) - t * (4 + k)) % 1700), cy = 40 + hash(k * 7 + 3) * 150, s = 0.7 + hash(k * 7 + 5) * 0.8;
      if (cx < -300) cx += 1700;
      cloud(c, cx, cy, s, Z);
    }
  }
  function cloud(c, x, y, s, Z) {
    c.save(); c.translate(x, y); c.scale(s, s);
    var a = Z.night > 0.5 ? 0.07 : 0.85;
    c.fillStyle = 'rgba(255,255,255,' + a + ')';
    [[0, 0, 42, 24], [40, -8, 50, 30], [90, 0, 40, 22], [45, 10, 70, 18]].forEach(function (b) { ell(c, b[0], b[1], b[2], b[3]); c.fill(); });
    c.fillStyle = Z.night > 0.5 ? 'rgba(180,190,230,.04)' : 'rgba(200,215,235,.55)';
    [[0, 10, 40, 14], [45, 16, 70, 12], [92, 10, 38, 12]].forEach(function (b) { ell(c, b[0], b[1], b[2], b[3]); c.fill(); });
    c.restore();
  }

  // ── 먼 배경(시차 0.2): 산·언덕 ──
  function far(c, z, cam, VW) {
    var Z = ZONES[z], off = -cam * 0.2;
    c.fillStyle = Z.far2;
    c.beginPath(); c.moveTo(0, FY);
    for (var x = 0; x <= VW + 40; x += 40) { var wx = x - off; c.lineTo(x, FY - 130 - 70 * Math.sin(wx * 0.004) - 40 * Math.sin(wx * 0.011 + 2)); }
    c.lineTo(VW + 40, FY); c.closePath(); c.fill();
    c.fillStyle = Z.far;
    c.beginPath(); c.moveTo(0, FY);
    for (x = 0; x <= VW + 40; x += 40) { wx = (x - off * 1.6); c.lineTo(x, FY - 90 - 45 * Math.sin(wx * 0.006 + 1) - 25 * Math.sin(wx * 0.017)); }
    c.lineTo(VW + 40, FY); c.closePath(); c.fill();
    c.fillStyle = lg(c, 0, FY - 200, 0, FY, [0, Z.fog + '0)', 1, Z.fog + '0.45)']); c.fillRect(0, FY - 200, VW, 200);
  }

  // ── 중간 배경(시차 0.5): 구역마다 다른 것들 ──
  function mid(c, z, cam, VW, seed) {
    var Z = ZONES[z], off = cam * 0.5, x0 = Math.floor(off / 260) * 260 - 260;
    for (var wx = x0; wx < off + VW + 300; wx += 260) {
      var h = hash(wx * 0.37 + seed), sx = wx - off + h * 120;
      c.save(); c.translate(sx, FY);
      if (z === 0) { if (h < 0.35) barn(c, Z); else if (h < 0.7) tree(c, 0.8 + h * 0.4, Z, h); else silo(c, Z); }
      else if (z === 1) { if (h < 0.4) sunflowers(c, Z, h); else if (h < 0.55) scarecrow(c, Z); else tree(c, 0.7 + h * 0.5, Z, h); }
      else if (z === 2) { if (h < 0.5) pole(c, Z); else tree(c, 0.8 + h * 0.4, Z, h); }
      else if (z === 3) { tree(c, 1 + h * 0.6, Z, h); if (h > 0.6) tree(c, 0.7, Z, h * 3, 80); }
      else if (z === 4) { if (h < 0.6) house(c, Z, h); else lamp(c, Z); }
      else if (z === 5) { if (h < 0.7) tree(c, 0.9 + h * 0.5, Z, h, 0, true); else pole(c, Z); }
      else { if (h < 0.5) tree(c, 0.9, Z, h); else barn(c, Z); }
      c.restore();
    }
    c.fillStyle = lg(c, 0, FY - 320, 0, FY, [0, Z.fog + '0)', 1, Z.fog + '0.22)']); c.fillRect(0, FY - 320, VW, 320);
  }
  function tree(c, s, Z, h, dx, dark) {
    c.save(); c.translate(dx || 0, 0); c.scale(s, s);
    var d = Z.night;
    var lf1 = dark || d > 0.5 ? '#1e3a22' : '#4f8a3a', lf2 = dark || d > 0.5 ? '#12261a' : '#356427', lf3 = dark || d > 0.5 ? '#2a4b2c' : '#6fa74a';
    c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, 8, -2, 40, 8); c.fill();
    c.fillStyle = lg(c, -8, 0, 10, 0, [0, '#6a4a2e', 1, '#3d2a18']); c.fillRect(-8, -70, 16, 72);
    c.fillStyle = lf2; ell(c, 0, -110, 52, 48); c.fill();
    c.fillStyle = lf1; ell(c, -10, -122, 40, 36); c.fill(); ell(c, 22, -100, 30, 26); c.fill();
    c.fillStyle = lf3; ell(c, -22, -132, 20, 14); c.fill();
    if (h > 0.5 && !dark) { c.fillStyle = '#d94a3a'; [[-20, -100], [15, -120], [30, -90]].forEach(function (p) { ell(c, p[0], p[1], 4, 4); c.fill(); }); }
    c.restore();
  }
  function barn(c, Z) {
    var d = Z.night > 0.5;
    c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, 60, -2, 90, 9); c.fill();
    c.fillStyle = lg(c, 0, 0, 120, 0, [0, d ? '#5a2620' : '#b8432f', 1, d ? '#3a1812' : '#8a2f22']); c.fillRect(0, -90, 120, 90);
    c.fillStyle = d ? '#2a1c16' : '#6b3b2a'; c.beginPath(); c.moveTo(-10, -90); c.lineTo(60, -140); c.lineTo(130, -90); c.closePath(); c.fill();
    c.fillStyle = d ? '#4a4a55' : '#e8e0cc'; c.fillRect(48, -50, 24, 50);
    c.strokeStyle = d ? '#6a3a30' : '#f0d9c2'; c.lineWidth = 3; c.beginPath(); c.moveTo(10, -80); c.lineTo(40, -40); c.moveTo(40, -80); c.lineTo(10, -40); c.stroke();
    if (d) { c.fillStyle = '#ffd27a'; c.fillRect(85, -70, 18, 16); }
  }
  function silo(c, Z) {
    var d = Z.night > 0.5;
    c.fillStyle = lg(c, 0, 0, 44, 0, [0, d ? '#7a7a88' : '#d8d8e0', 0.5, d ? '#55555f' : '#a9a9b5', 1, d ? '#3a3a44' : '#78788a']); c.fillRect(0, -150, 44, 150);
    c.fillStyle = d ? '#5a3a3a' : '#b8432f'; ell(c, 22, -150, 24, 14); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, 26, -2, 40, 7); c.fill();
  }
  function sunflowers(c, Z, h) {
    for (var i = 0; i < 5; i++) {
      var x = i * 28, hh = 60 + hash(h * 10 + i) * 30;
      c.strokeStyle = '#4f7d2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -hh); c.stroke();
      c.fillStyle = '#f2c230'; for (var k = 0; k < 10; k++) { var a = k / 10 * PI * 2; ell(c, x + Math.cos(a) * 13, -hh + Math.sin(a) * 13, 7, 4, a); c.fill(); }
      ball(c, x, -hh, 9, 9, '#8a5a2a', '#5a3818', '#3a220c');
    }
  }
  function scarecrow(c, Z) {
    c.fillStyle = '#6a4a2e'; c.fillRect(-4, -120, 8, 120); c.fillRect(-40, -90, 80, 6);
    c.fillStyle = lg(c, -20, 0, 20, 0, [0, '#5b7fb5', 1, '#34507a']); rr(c, -20, -95, 40, 50, 6); c.fill();
    ball(c, 0, -112, 16, 18, '#f2d7a8', '#d8b482', '#a9865a');
    c.fillStyle = '#c8a25a'; c.beginPath(); c.moveTo(-28, -120); c.lineTo(0, -150); c.lineTo(28, -120); c.closePath(); c.fill();
  }
  function pole(c, Z) {
    var d = Z.night > 0.5;
    c.fillStyle = lg(c, -5, 0, 5, 0, [0, d ? '#4a4038' : '#8a7a68', 1, d ? '#2a2420' : '#5a4e40']); c.fillRect(-5, -190, 10, 190);
    c.fillRect(-30, -175, 60, 5);
    c.strokeStyle = d ? 'rgba(200,200,220,.3)' : 'rgba(40,40,50,.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-30, -172); c.quadraticCurveTo(100, -150, 230, -172); c.stroke();
  }
  function house(c, Z, h) {
    var d = Z.night > 0.4, w = 100 + h * 60;
    c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, w / 2, -2, w * 0.7, 8); c.fill();
    var wall = ['#e8d9b8', '#d7c2a0', '#c9d6e0', '#e0c8c0'][Math.floor(h * 4)];
    c.fillStyle = lg(c, 0, 0, w, 0, [0, wall, 1, '#8a7a68']); c.fillRect(0, -100, w, 100);
    c.fillStyle = '#5a3a2e'; c.beginPath(); c.moveTo(-8, -100); c.lineTo(w / 2, -140); c.lineTo(w + 8, -100); c.closePath(); c.fill();
    for (var i = 0; i < 2; i++) { c.fillStyle = d ? '#ffd27a' : '#6a8aa8'; c.fillRect(14 + i * (w - 50), -78, 22, 22); if (d) { c.fillStyle = 'rgba(255,210,120,.25)'; ell(c, 25 + i * (w - 50), -67, 30, 24); c.fill(); } }
    c.fillStyle = '#6b3b2a'; c.fillRect(w / 2 - 10, -40, 20, 40);
  }
  function lamp(c, Z) {
    var d = Z.night > 0.4;
    c.fillStyle = '#3a3a44'; c.fillRect(-3, -150, 6, 150); c.fillRect(-12, -150, 24, 8);
    c.fillStyle = d ? '#ffe9a8' : '#c0c0c8'; rr(c, -8, -150, 16, 14, 3); c.fill();
    if (d) { c.fillStyle = rg(c, 0, -140, 5, 0, -100, 110, [0, 'rgba(255,225,150,.35)', 1, 'rgba(255,225,150,0)']); c.beginPath(); c.moveTo(0, -140); c.lineTo(-60, 0); c.lineTo(60, 0); c.closePath(); c.fill(); }
  }

  // ── 땅(시차 1): 흙길 + 풀 + 웅덩이 ──
  function ground(c, z, cam, VW, len, gaps) {
    var Z = ZONES[z];
    c.fillStyle = lg(c, 0, FY - 22, 0, 540, [0, Z.g1, 0.06, Z.g2, 0.1, Z.dirt, 1, Z.dirt2]);
    c.fillRect(cam - 10, FY - 22, VW + 20, 92);
    // 풀 결
    c.strokeStyle = Z.g1; c.lineWidth = 2;
    var x0 = Math.floor(cam / 18) * 18;
    for (var wx = x0; wx < cam + VW + 20; wx += 18) {
      var h = hash(wx * 0.5) * 10 + 6;
      c.beginPath(); c.moveTo(wx, FY - 18); c.quadraticCurveTo(wx + 3, FY - 18 - h, wx + 6 + hash(wx) * 4, FY - 18 - h); c.stroke();
    }
    // 흙 얼룩
    for (wx = Math.floor(cam / 60) * 60; wx < cam + VW + 60; wx += 60) {
      var ox = wx + hash(wx) * 40, oy = FY + 10 + hash(wx + 1) * 50;
      c.fillStyle = 'rgba(0,0,0,' + (0.05 + hash(wx + 2) * 0.06) + ')'; ell(c, ox, oy, 14 + hash(wx + 3) * 20, 4); c.fill();
    }
    if (z === 2) { // 찻길 차선
      c.fillStyle = 'rgba(255,255,255,.55)'; for (wx = Math.floor(cam / 90) * 90; wx < cam + VW + 90; wx += 90) c.fillRect(wx, FY + 34, 40, 5);
    }
    // 웅덩이·개울 (구멍)
    (gaps || []).forEach(function (g) {
      if (g.x + g.w < cam - 50 || g.x > cam + VW + 50) return;
      var sx = g.x;
      c.fillStyle = Z.dirt2; c.fillRect(sx, FY - 24, g.w, 40);
      c.fillStyle = lg(c, 0, FY - 10, 0, FY + 40, [0, z === 3 ? '#4f8fd1' : '#6a9ad0', 1, z === 3 ? '#1f4f8a' : '#2a4a80']);
      c.fillRect(sx + 4, FY - 6, g.w - 8, 80);
      c.fillStyle = 'rgba(255,255,255,.35)';
      var t = Date.now() / 600;
      for (var i = 0; i < g.w / 30; i++) c.fillRect(sx + 10 + ((i * 30 + t * 20) % (g.w - 20)), FY - 2 + Math.sin(t + i) * 2, 12, 2);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(sx, FY - 24, g.w, 8);
    });
  }

  // ── 소품 ──
  function prop(c, p, t, Z) {
    c.save(); c.translate(p.x, FY);
    var k = p.k;
    if (k === 'fence') {
      shadow(c, p.w / 2 + 6, 2, p.w / 2 + 6, 5, 0.22);
      c.fillStyle = lg(c, 0, -p.h, 0, 0, [0, '#c9a06a', 1, '#8a6238']);
      for (var i = 0; i <= p.w; i += 34) { c.fillRect(i, -p.h, 10, p.h); c.beginPath(); c.moveTo(i, -p.h); c.lineTo(i + 5, -p.h - 8); c.lineTo(i + 10, -p.h); c.fill(); }
      c.fillStyle = '#a8804e'; c.fillRect(0, -p.h + 10, p.w + 10, 7); c.fillRect(0, -p.h * 0.45, p.w + 10, 7);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, -p.h + 17, p.w + 10, 3); c.fillRect(0, -p.h * 0.45 + 7, p.w + 10, 3);
    } else if (k === 'hay') {
      shadow(c, p.w / 2 + 8, 2, p.w / 2 + 6, 7, 0.28);
      c.fillStyle = lg(c, 0, -p.h, p.w, 0, [0, '#f0c95a', 0.6, '#d6a83a', 1, '#9a7222']); rr(c, 0, -p.h, p.w, p.h, 14); c.fill();
      c.strokeStyle = 'rgba(120,80,20,.35)'; c.lineWidth = 1.5;
      for (i = 6; i < p.w; i += 9) { c.beginPath(); c.moveTo(i, -p.h + 4); c.lineTo(i + 3, -4); c.stroke(); }
      c.strokeStyle = '#8a5a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -p.h * 0.55); c.lineTo(p.w, -p.h * 0.55); c.stroke();
      if (p.sq > 0) { c.restore(); return; }
    } else if (k === 'crate') {
      shadow(c, p.w / 2 + 6, 2, p.w / 2 + 4, 6, 0.28);
      c.fillStyle = lg(c, 0, -p.h, p.w, 0, [0, '#c69a62', 1, '#7d5a34']); c.fillRect(0, -p.h, p.w, p.h);
      c.strokeStyle = 'rgba(60,35,10,.45)'; c.lineWidth = 3; c.strokeRect(3, -p.h + 3, p.w - 6, p.h - 6);
      c.beginPath(); c.moveTo(3, -p.h + 3); c.lineTo(p.w - 3, -3); c.moveTo(p.w - 3, -p.h + 3); c.lineTo(3, -3); c.stroke();
    } else if (k === 'log') {
      shadow(c, 0, 2, p.r + 6, 6, 0.3);
      c.save(); c.translate(0, -p.r); c.rotate(p.rot || 0);
      c.fillStyle = rg(c, -p.r * 0.3, -p.r * 0.3, 2, 0, 0, p.r, [0, '#c99a6a', 0.7, '#8a5f38', 1, '#5a3a1e']); ell(c, 0, 0, p.r, p.r); c.fill();
      c.strokeStyle = 'rgba(60,35,15,.5)'; c.lineWidth = 2; ell(c, 0, 0, p.r * 0.6, p.r * 0.6); c.stroke(); ell(c, 0, 0, p.r * 0.3, p.r * 0.3); c.stroke();
      c.restore();
    } else if (k === 'rock') {
      shadow(c, 4, 2, p.w / 2 + 4, 6, 0.3);
      c.fillStyle = rg(c, -p.w * 0.2, -p.h * 0.8, 3, 0, -p.h * 0.4, p.w * 0.8, [0, '#b9b9c2', 0.6, '#7d7d88', 1, '#4a4a55']);
      c.beginPath(); c.moveTo(-p.w / 2, 0); c.lineTo(-p.w * 0.4, -p.h * 0.7); c.lineTo(-p.w * 0.1, -p.h); c.lineTo(p.w * 0.35, -p.h * 0.85); c.lineTo(p.w / 2, -p.h * 0.3); c.lineTo(p.w * 0.4, 0); c.closePath(); c.fill();
    } else if (k === 'bush') {
      shadow(c, 4, 2, 30, 6, 0.22);
      var d = Z.night > 0.5, live = p.hid && !p.open;
      if (live && p.hid === 'grain') {   // 낟알 덤불: 둘레에 옥수수알 흩뿌림
        [[-44, -3], [-36, 4], [40, -2], [48, 5], [-26, 7], [30, 8], [-52, 6]].forEach(function (q, i) {
          var rot = hash(p.x + i) * 3;
          c.fillStyle = '#c99a1a'; ell(c, q[0] + 1, q[1] + 1, 5, 3.5, rot); c.fill();
          c.fillStyle = '#ffd54a'; ell(c, q[0], q[1], 5, 3.5, rot); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, q[0] - 1.5, q[1] - 1, 1.5, 1, rot); c.fill();
        });
      }
      c.save();
      if (live) { var on = Math.sin(t * 1.1 + p.x) > 0.55; c.rotate(on ? Math.sin(t * 22) * 0.05 : 0); }   // 부스럭
      c.fillStyle = d ? '#1e3a22' : '#3f7a2e'; ell(c, 0, -22, 34, 24); c.fill();
      c.fillStyle = d ? '#2a4b2c' : '#5a9c3e'; ell(c, -10, -30, 22, 16); c.fill(); ell(c, 14, -24, 18, 14); c.fill();
      c.fillStyle = d ? '#365c36' : '#7ab857'; ell(c, -18, -36, 9, 6); c.fill(); ell(c, 8, -34, 7, 5); c.fill();
      c.restore();
    } else if (k === 'basket') {   // 짚더미: 열리기 전엔 병아리 머리가 늘 빼꼼
      var liveChick = p.hid === 'chick' && !p.open;
      shadow(c, 2, 2, 30, 7, 0.28);
      c.fillStyle = rg(c, -18, -16, 3, -14, -12, 26, [0, '#f3d372', 0.6, '#dba93e', 1, '#93701f']); ell(c, -14, -11, 20, 14); c.fill();
      c.fillStyle = rg(c, 4, -22, 3, 10, -18, 28, [0, '#f6d97e', 0.6, '#dfae44', 1, '#93701f']); ell(c, 10, -17, 22, 16); c.fill();
      c.fillStyle = rg(c, -2, -13, 3, 0, -10, 24, [0, '#f0cf6c', 0.6, '#d5a63c', 1, '#8a6a1c']); ell(c, 0, -8, 26, 11); c.fill();
      c.strokeStyle = '#b8862e'; c.lineWidth = 2; c.lineCap = 'round';
      [[-24, -22, -30, -33], [-8, -29, -11, -42], [8, -31, 12, -44], [20, -25, 26, -35], [-16, -9, -22, -15], [16, -11, 23, -17]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.stroke(); });
      if (liveChick) {
        var bob = Math.sin(t * 2.4) * 2, look = Math.sin(t * 1.3) * 3;
        c.save(); c.translate(look, bob);
        ball(c, 0, -30, 11, 10, '#fff6b0', '#ffd23a', '#c98a10');
        c.fillStyle = '#f08a2a'; c.beginPath(); c.moveTo(9, -31); c.lineTo(17, -28); c.lineTo(9, -25); c.fill();
        c.fillStyle = '#1a1a1a'; ell(c, 4, -33, 1.8, 2.2); c.fill();
        c.fillStyle = 'rgba(255,120,120,.3)'; ell(c, 5, -27, 2.5, 1.6); c.fill();
        c.restore();
      }
    } else if (k === 'pumpkin') {
      shadow(c, 2, 2, 22, 5, 0.25);
      ball(c, 0, -18, 22, 18, '#ffb347', '#e07b1f', '#8a4210');
      c.strokeStyle = 'rgba(120,50,10,.35)'; c.lineWidth = 2; for (i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 9, -18, 7, 17, 0, 0, PI * 2); c.stroke(); }
      c.fillStyle = '#4f7d2a'; c.fillRect(-3, -40, 6, 8);
    } else if (k === 'stump') {
      shadow(c, 4, 2, 22, 5, 0.25);
      c.fillStyle = lg(c, -18, 0, 18, 0, [0, '#8a5f38', 1, '#4a2f18']); c.fillRect(-18, -24, 36, 24);
      c.fillStyle = '#c99a6a'; ell(c, 0, -24, 18, 6); c.fill(); c.strokeStyle = '#8a5f38'; c.lineWidth = 1.5; ell(c, 0, -24, 10, 3); c.stroke();
    } else if (k === 'sign') {   // 스테이지 끝 이정표
      shadow(c, 6, 2, 22, 5, 0.25);
      c.fillStyle = lg(c, -5, 0, 5, 0, [0, '#a8804e', 1, '#6a4a2e']); c.fillRect(-5, -110, 10, 110);
      c.fillStyle = lg(c, -50, 0, 50, 0, [0, '#e8d9b8', 1, '#c9b48e']); c.beginPath(); c.moveTo(-50, -130); c.lineTo(38, -130); c.lineTo(56, -108); c.lineTo(38, -86); c.lineTo(-50, -86); c.closePath(); c.fill();
      c.strokeStyle = '#8a6232'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#3a2a16'; c.font = 'bold 26px Ria, sans-serif'; c.textAlign = 'center'; c.fillText('🏠 ▶', -2, -98);
      c.textAlign = 'left';
    } else if (k === 'home') {   // 마지막 집
      shadow(c, 130, 3, 170, 10, 0.3);
      c.fillStyle = lg(c, 0, 0, 260, 0, [0, '#f4e6c8', 1, '#c9b28e']); c.fillRect(0, -150, 260, 150);
      c.fillStyle = '#b8432f'; c.beginPath(); c.moveTo(-20, -150); c.lineTo(130, -230); c.lineTo(280, -150); c.closePath(); c.fill();
      c.fillStyle = '#8a2f22'; c.beginPath(); c.moveTo(-20, -150); c.lineTo(130, -230); c.lineTo(130, -150); c.closePath(); c.fill();
      c.fillStyle = '#6b3b2a'; c.fillRect(105, -80, 50, 80);
      c.fillStyle = '#ffd27a'; c.fillRect(30, -110, 40, 34); c.fillRect(190, -110, 40, 34);
      c.fillStyle = 'rgba(255,210,120,.3)'; ell(c, 50, -93, 50, 40); c.fill(); ell(c, 210, -93, 50, 40); c.fill();
      // 마당 울타리
      c.fillStyle = '#c9a06a'; for (i = -120; i < -20; i += 30) c.fillRect(i, -40, 8, 40); c.fillRect(-120, -32, 100, 6);
      if (p.locked) { c.fillStyle = '#9a9aa8'; rr(c, 100, -62, 60, 44, 6); c.fill(); c.fillStyle = '#3a3a44'; c.font = 'bold 22px Ria, sans-serif'; c.textAlign = 'center'; c.fillText('🔒', 130, -32); c.textAlign = 'left'; }
    }
    c.restore();
  }

  // ── 동물 ──
  function enemy(c, e, t) {
    c.save(); c.translate(e.x, FY - (e.h || 0)); c.scale(e.face || 1, 1);
    var ph = e.walkP || 0, k = e.k;
    if (k === 'dog') {
      shadow(c, 0, (e.h || 0) + 2, 42, 7, 0.28);
      var sleep = e.state === 'sleep', wake = e.state === 'wake';
      var leg = sleep ? 0 : Math.sin(ph * 12) * 12;
      c.strokeStyle = '#7a4e28'; c.lineWidth = 11; c.lineCap = 'round'; // 다리
      [[-22, -leg], [-10, leg], [14, leg], [26, -leg]].forEach(function (l) { c.save(); c.translate(l[0], -30); c.rotate(l[1] * 0.03); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 24); c.stroke(); c.restore(); });
      c.fillStyle = '#5a3618'; [[-22, -leg], [-10, leg], [14, leg], [26, -leg]].forEach(function (l) { ell(c, l[0] + l[1] * 0.7, -4, 7, 4); c.fill(); });
      ball(c, 0, -40, 40, 22, '#c98a4a', '#9a6232', '#5a3618');   // 몸
      c.fillStyle = '#e8c090'; ell(c, -4, -30, 26, 10); c.fill();   // 배
      c.save(); c.translate(-38, -52); c.rotate(sleep ? 0.4 : -0.5 + Math.sin(t * 10) * 0.25); c.fillStyle = '#9a6232'; c.fillRect(-4, -20, 8, 24); c.restore(); // 꼬리
      var hy = sleep ? -40 : wake ? -52 + Math.sin(t * 30) * 2 : -66;
      ball(c, 36, hy, 22, 19, '#d8975a', '#a86a38', '#5a3618');   // 머리
      ball(c, 52, hy + 6, 14, 10, '#c98a4a', '#9a6232', '#5a3618'); // 주둥이
      c.fillStyle = '#2a1a10'; ell(c, 64, hy + 4, 5, 4); c.fill();  // 코
      ball(c, 22, hy - 12, 9, 15, '#a06a38', '#7a4a22', '#4a2a10', 0.4); ball(c, 44, hy - 14, 8, 14, '#a06a38', '#7a4a22', '#4a2a10', -0.2);   // 귀
      if (sleep) { c.strokeStyle = '#2a1a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(38, hy - 3); c.lineTo(48, hy - 3); c.stroke(); c.fillStyle = '#fff'; c.font = '16px sans-serif'; c.fillText('z', 50 + Math.sin(t * 2) * 3, hy - 30 - (t * 20 % 20)); }
      else { c.fillStyle = '#fff'; ell(c, 42, hy - 4, 6, 6); c.fill(); c.fillStyle = '#1a1a1a'; ell(c, 44, hy - 4, 3, 3); c.fill();
        if (e.state === 'chase') { c.fillStyle = '#d9432c'; ell(c, 58, hy + 14, 6, 9); c.fill(); c.strokeStyle = '#2a1a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(34, hy - 14); c.lineTo(48, hy - 9); c.stroke(); } }
    } else if (k === 'cat') {
      shadow(c, 0, (e.h || 0) + 2, 30, 6, 0.28);
      var lg2 = Math.sin(ph * 12) * 10;
      c.fillStyle = '#3a3a44'; [[-16, -lg2], [-6, lg2], [10, lg2], [18, -lg2]].forEach(function (l) { c.save(); c.translate(l[0], -20); c.rotate(l[1] * 0.03); c.fillRect(-4, 0, 8, 22); c.restore(); });
      ball(c, 0, -32, 30, 16, '#6a6a78', '#44444f', '#22222a');
      c.save(); c.translate(-28, -40); c.rotate(-0.9 + Math.sin(t * 4) * 0.3); c.strokeStyle = '#44444f'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -20, 4, -32); c.stroke(); c.restore();
      ball(c, 26, -50, 16, 14, '#7a7a88', '#4a4a55', '#22222a');
      c.fillStyle = '#4a4a55'; c.beginPath(); c.moveTo(16, -60); c.lineTo(20, -74); c.lineTo(27, -62); c.fill(); c.beginPath(); c.moveTo(30, -62); c.lineTo(36, -74); c.lineTo(38, -60); c.fill();
      c.fillStyle = '#d9e04a'; ell(c, 30, -52, 4, 5); c.fill(); c.fillStyle = '#111'; ell(c, 31, -52, 1.5, 4); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; [-4, 0, 4].forEach(function (d) { c.beginPath(); c.moveTo(36, -46 + d); c.lineTo(50, -48 + d * 1.5); c.stroke(); });
    } else if (k === 'crow') {
      var fl = Math.sin(t * 18) * 0.9;
      var low = Math.max(0, 1 - (e.h || 0) / 170);
      shadow(c, 0, (e.h || 0) + 2, 14 + low * 18, 3 + low * 5, 0.12 + low * 0.3);
      c.fillStyle = '#1c1c26'; ell(c, 0, 0, 22, 11, 0.1); c.fill();
      c.fillStyle = '#2a2a38'; c.save(); c.translate(-2, -4); c.rotate(-fl * 0.6); c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -18 - fl * 8); c.lineTo(-22, 4); c.closePath(); c.fill(); c.restore();
      c.save(); c.translate(-2, -4); c.rotate(fl * 0.6); c.beginPath(); c.moveTo(0, 0); c.lineTo(-24, 18 + fl * 6); c.lineTo(-18, -2); c.closePath(); c.fill(); c.restore();
      ball(c, 18, -8, 11, 10, '#3a3a4a', '#1c1c26', '#0a0a10');
      c.fillStyle = '#e0b040'; c.beginPath(); c.moveTo(26, -8); c.lineTo(40, -5); c.lineTo(26, -2); c.fill();
      c.fillStyle = '#fff'; ell(c, 21, -11, 3, 3); c.fill(); c.fillStyle = '#000'; ell(c, 22, -11, 1.5, 1.5); c.fill();
    } else if (k === 'snake') {
      shadow(c, 0, 2, 34, 4, 0.25);
      c.strokeStyle = '#4f8a3a'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath();
      for (var i = -30; i <= 20; i += 5) c.lineTo(i, -8 + Math.sin(i * 0.15 + t * 10) * 6); c.stroke();
      c.strokeStyle = '#8fc060'; c.lineWidth = 4; c.beginPath(); for (i = -30; i <= 20; i += 5) c.lineTo(i, -11 + Math.sin(i * 0.15 + t * 10) * 6); c.stroke();
      ball(c, 26, -12, 12, 9, '#7fb050', '#4f8a3a', '#2a5020');
      c.fillStyle = '#d9432c'; c.fillRect(36, -12, 10 + Math.sin(t * 20) * 4, 2);
      c.fillStyle = '#ffe066'; ell(c, 28, -15, 3, 3); c.fill(); c.fillStyle = '#000'; ell(c, 29, -15, 1, 2.5); c.fill();
    } else if (k === 'fox') {
      shadow(c, 0, 2, 44, 7, 0.28);
      var lf = Math.sin(ph * 14) * 14;
      c.fillStyle = '#2a1a10'; [[-24, -lf], [-12, lf], [14, lf], [26, -lf]].forEach(function (l) { c.save(); c.translate(l[0], -24); c.rotate(l[1] * 0.03); c.fillRect(-4, 0, 8, 26); c.restore(); });
      ball(c, 0, -38, 40, 20, '#f08a3c', '#c8621c', '#7a3a0c');
      c.fillStyle = '#fbe3c8'; ell(c, -2, -28, 24, 9); c.fill();
      c.save(); c.translate(-38, -42); c.rotate(0.3 + Math.sin(t * 8) * 0.2); c.fillStyle = '#e07a30'; ell(c, -16, 0, 22, 10); c.fill(); c.fillStyle = '#fff'; ell(c, -34, 0, 8, 7); c.fill(); c.restore();
      ball(c, 36, -60, 20, 16, '#f49a4c', '#c8621c', '#7a3a0c');
      c.fillStyle = '#fbe3c8'; c.beginPath(); c.moveTo(44, -56); c.lineTo(66, -50); c.lineTo(44, -46); c.fill();
      c.fillStyle = '#1a1a1a'; ell(c, 65, -50, 3, 3); c.fill();
      c.fillStyle = '#e07a30'; c.beginPath(); c.moveTo(22, -70); c.lineTo(24, -90); c.lineTo(34, -72); c.fill(); c.beginPath(); c.moveTo(38, -72); c.lineTo(46, -90); c.lineTo(50, -70); c.fill();
      c.fillStyle = '#ffe066'; ell(c, 44, -63, 4, 4); c.fill(); c.fillStyle = '#000'; ell(c, 45, -63, 2, 2); c.fill();
    } else if (k === 'car') {
      c.scale(1, 1);
      shadow(c, 0, 4, 70, 8, 0.35);
      var col = e.col || '#d9432c';
      c.fillStyle = lg(c, 0, -60, 0, 0, [0, col, 1, '#5a1a10']); rr(c, -68, -34, 136, 30, 8); c.fill();
      c.fillStyle = lg(c, 0, -62, 0, -34, [0, col, 1, col]); rr(c, -40, -60, 80, 30, 10); c.fill();
      c.fillStyle = lg(c, -30, -58, 30, -40, [0, '#cfe6f5', 1, '#6a9ab8']); rr(c, -34, -56, 32, 20, 4); c.fill(); rr(c, 2, -56, 30, 20, 4); c.fill();
      c.fillStyle = '#222'; ell(c, -40, -4, 14, 14); c.fill(); ell(c, 40, -4, 14, 14); c.fill();
      c.fillStyle = '#9a9aa8'; ell(c, -40, -4, 6, 6); c.fill(); ell(c, 40, -4, 6, 6); c.fill();
      c.fillStyle = '#ffe9a8'; c.fillRect(60, -26, 8, 8); c.fillStyle = '#ff3a2a'; c.fillRect(-68, -26, 6, 8);
      if (e.night) { c.fillStyle = 'rgba(255,240,180,.25)'; c.beginPath(); c.moveTo(66, -22); c.lineTo(200, -50); c.lineTo(200, 10); c.closePath(); c.fill(); }
    }
    c.restore();
  }

  // ── 병아리 ──
  function chick(c, x, y, face, t, ph, hop) {
    c.save(); c.translate(x, y); c.scale(face, 1);
    shadow(c, 0, hop + 2, 12, 3, 0.25);
    c.translate(0, -hop);
    var lg2 = Math.sin(ph * 16) * 6;
    c.strokeStyle = '#f08a2a'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-4, -6); c.lineTo(-5 + lg2 * 0.3, 0); c.moveTo(4, -6); c.lineTo(5 - lg2 * 0.3, 0); c.stroke();
    ball(c, 0, -16, 13, 12, '#fff3a0', '#ffd23a', '#d89a10');
    c.fillStyle = '#f5c020'; ell(c, -8, -16, 6, 4, 0.6 + Math.sin(t * 20) * 0.2); c.fill();
    ball(c, 4, -30, 10, 10, '#fff6b0', '#ffd23a', '#d89a10');
    c.fillStyle = '#f08a2a'; c.beginPath(); c.moveTo(12, -31); c.lineTo(20, -28); c.lineTo(12, -26); c.fill();
    c.fillStyle = '#1a1a1a'; ell(c, 8, -33, 2, 2.5); c.fill();
    c.fillStyle = 'rgba(255,120,120,.35)'; ell(c, 9, -27, 3, 2); c.fill();
    c.restore();
  }

  // ── 암탉(엔딩) ──
  function hen(c, x, y, face, t, et) {
    c.save(); c.translate(x, y); c.scale(face, 1);
    shadow(c, 4, 2, 30, 6, 0.3);
    var bob = Math.sin(t * 6) * 2, flap = et > 1 ? Math.abs(Math.sin(t * 12)) : 0;
    c.strokeStyle = '#e8a030'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-8, -10); c.lineTo(-10, 0); c.moveTo(8, -10); c.lineTo(10, 0); c.stroke();
    c.fillStyle = '#e8a030'; [[-10, 0], [10, 0]].forEach(function (f) { c.beginPath(); c.moveTo(f[0] - 8, f[1]); c.lineTo(f[0] + 6, f[1]); c.lineTo(f[0], f[1] - 3); c.fill(); });
    c.fillStyle = '#c9b08a'; c.beginPath(); c.moveTo(-26, -40 + bob); c.lineTo(-48, -62 + bob); c.lineTo(-40, -34 + bob); c.closePath(); c.fill();   // 꽁지
    ball(c, 0, -34 + bob, 32, 24, '#fff6e4', '#e6d2b2', '#a88a68');   // 몸
    c.save(); c.translate(-4, -38 + bob); c.rotate(-flap * 0.7); c.fillStyle = '#efe0c6'; ell(c, -4, 4, 18, 11, 0.3); c.fill(); c.restore(); // 날개
    ball(c, 26, -62 + bob, 15, 14, '#fff8ea', '#ead8ba', '#a88a68');   // 머리
    c.fillStyle = '#d9432c'; ell(c, 26, -76 + bob, 6, 5); c.fill(); ell(c, 21, -74 + bob, 4, 4); c.fill();   // 볏
    c.fillStyle = '#d9432c'; ell(c, 32, -50 + bob, 4, 5); c.fill();   // 턱볏
    c.fillStyle = '#f0a020'; c.beginPath(); c.moveTo(38, -63 + bob); c.lineTo(50, -60 + bob); c.lineTo(38, -57 + bob); c.fill();
    c.fillStyle = '#1a1a1a'; ell(c, 31, -65 + bob, 2.5, 3); c.fill();
    c.fillStyle = 'rgba(255,120,120,.4)'; ell(c, 34, -58 + bob, 4, 2.5); c.fill();
    c.restore();
  }

  // ── 줍는 것 ──
  function item(c, it, t) {
    c.save(); c.translate(it.x, it.y);
    if (it.k === 'grain') {
      var b = Math.sin(t * 5 + it.x) * 2;
      shadow(c, 0, FY - it.y + 1, 7, 2.4, 0.2);
      c.translate(0, b);
      var K = [[-3.4, 1.6, 2.6, 2, -0.5], [3.3, 1.9, 2.5, 1.9, 0.4], [-0.2, -2.2, 2.8, 2.1, 0]];
      for (var gi = 0; gi < K.length; gi++) { var kk = K[gi]; ball(c, kk[0], kk[1], kk[2], kk[3], '#ffe9a0', '#d9a531', '#7a5316', kk[4]); }
      c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, K[2][0] - 0.8, K[2][1] - 0.9, 0.9, 1.2); c.fill();
    } else if (it.k === 'worm' || it.k === 'gworm') {
      var gold = it.k === 'gworm', L = gold ? 18 : 13, amp = gold ? 4 : 3.5, wv = function (x) { return Math.sin(x * 0.22 + t * 7) * amp; };
      if (gold) {
        var g = 0.5 + Math.sin(t * 4) * 0.5;
        c.fillStyle = rg(c, 0, 0, 5, 0, 0, 40, [0, 'rgba(255,230,120,' + (0.35 * g) + ')', 1, 'rgba(255,230,120,0)']); ell(c, 0, 0, 40, 40); c.fill();
        shadow(c, 0, FY - it.y + 1, 16, 3, 0.2); c.translate(0, Math.sin(t * 3) * 3);
      }
      var path = function (dy) { c.beginPath(); for (var x = -L; x <= L; x += 1) c.lineTo(x, dy + wv(x)); };
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = gold ? '#a8720a' : '#b8505f'; c.lineWidth = gold ? 9 : 7; path(0); c.stroke();          // 바깥 어두운 테
      c.strokeStyle = gold ? '#ffd54a' : '#e8808f'; c.lineWidth = gold ? 6.5 : 5; path(0); c.stroke();      // 몸
      c.strokeStyle = gold ? '#fff3b0' : '#f7b3bd'; c.lineWidth = 1.6; path(-1.6); c.stroke();               // 윗면 하이라이트
      c.strokeStyle = gold ? 'rgba(160,100,0,.45)' : 'rgba(150,50,70,.4)'; c.lineWidth = 1;                  // 마디
      for (var sx = -L + 4; sx < L - 2; sx += 4) { c.beginPath(); c.moveTo(sx, wv(sx) - (gold ? 3 : 2.3)); c.lineTo(sx, wv(sx) + (gold ? 3 : 2.3)); c.stroke(); }
      c.fillStyle = '#111'; ell(c, L - 1, wv(L - 1) - 1, 1.4, 1.4); c.fill();
      if (gold) for (var i = 0; i < 3; i++) { var ang = t * 2 + i * 2.1; c.fillStyle = '#fff'; ell(c, Math.cos(ang) * 24, Math.sin(ang) * 24, 2, 2); c.fill(); }
    } else if (it.k === 'feather') {
      c.rotate(it.rot || 0); c.fillStyle = it.col || '#f0e8d8'; ell(c, 0, 0, 3, 8); c.fill();
    } else if (it.k === 'seed') {
      c.fillStyle = '#f2c230'; ell(c, 0, 0, 3, 4, it.rot || 0); c.fill();
    } else if (it.k === 'drop') {
      c.fillStyle = 'rgba(120,180,240,.8)'; ell(c, 0, 0, 3, 4); c.fill();
    } else if (it.k === 'dust') {
      c.fillStyle = 'rgba(180,150,110,' + (it.a || 0.4) + ')'; ell(c, 0, 0, it.r || 5, (it.r || 5) * 0.7); c.fill();
    } else if (it.k === 'spark') {
      c.fillStyle = it.col || '#ffe066'; ell(c, 0, 0, 3, 3); c.fill();
    } else if (it.k === 'heart') {
      c.fillStyle = '#ff5a6a'; c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText('❤', 0, 6);
    }
    c.restore();
  }

  // ── 수탉(스프라이트) ──
  var img = new Image(); img.src = 'img/rooster.png';
  function rooster(c, anim, frame, x, y, face, scale, tilt) {
    var S = window.SHEET, W = S.cell[0], H = S.cell[1], A = S.anims[anim] || S.anims.idle;
    var f = Math.max(0, Math.min(A.frames - 1, Math.floor(frame)));
    var sc = scale || 0.6;
    c.save(); c.translate(x, y);
    shadow(c, 4, FY - y + 2, 34 * (sc / 0.6), 6, 0.3);
    c.scale(face, 1); if (tilt) c.rotate(tilt);
    if (img.complete && img.naturalWidth) c.drawImage(img, f * W, A.row * H, W, H, -W * sc / 2, -H * sc, W * sc, H * sc);
    c.restore();
  }

  function vignette(c, VW, VH, k) {
    c.fillStyle = rg(c, VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VH * 0.95, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,' + (k || 0.35) + ')']);
    c.fillRect(0, 0, VW, VH);
  }

  window.ART = { FY: FY, ZONES: ZONES, sky: sky, far: far, mid: mid, ground: ground, prop: prop, enemy: enemy, chick: chick, hen: hen, item: item, rooster: rooster, vignette: vignette, hash: hash, img: img, rr: rr, ell: ell, ball: ball };
})();
