// 달떡 합치기: 같은 떡끼리 닿으면 합쳐져 다음 떡이 된다. 물리와 그림은 전부 이 파일(캔버스 2D).
(function () {
  'use strict';
  var EN = /[?&]lang=en\b/.test(location.search);
  if (EN) document.documentElement.lang = 'en';
  var T = EN ? {
    t1: 'Moon Mochi', t2: 'Merge', today: 'TODAY', share: 'SHARE', copied: 'COPIED',
    moon: function (n) { return 'x ' + n; },
    msg: function (s, m) { return 'Moon Mochi Merge ' + s + ' pts' + (m ? ' / full moon x' + m : ''); }
  } : {
    t1: '달떡', t2: '합치기', today: '오늘', share: '자랑하기', copied: '복사됨',
    moon: function (n) { return n + '개'; },
    msg: function (s, m) { return '달떡 합치기 ' + s + '점' + (m ? ' 보름달 ' + m + '개' : ''); }
  };
  function $(id) { return document.getElementById(id); }
  function ls(k, d) { try { var v = localStorage.getItem('daltteok.' + k); return v == null ? d : v; } catch (e) { return d; } }
  function ss(k, v) { try { localStorage.setItem('daltteok.' + k, String(v)); } catch (e) {} }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var PI2 = Math.PI * 2;

  // ---------- 떡 11단계: 콩 경단 꿀떡 쑥떡 송편 인절미 무지개떡 딸기찹쌀떡 호박떡 백설기 보름달 ----------
  var R = [14, 20, 27, 34, 42, 50, 59, 68, 78, 89, 102];
  var COL = [
    { l: '#6a5486', b: '#3d2c52', d: '#1e1430', o: '#150d22' },
    { l: '#ffffff', b: '#faf5ea', d: '#d8ccb6', o: '#a8997e' },
    { l: '#ffe0e8', b: '#ffb4c8', d: '#e37f9d', o: '#b85274' },
    { l: '#cfe8a4', b: '#9cc56c', d: '#6b9443', o: '#4a6f2a' },
    { l: '#fff8d6', b: '#ffe89a', d: '#dfba58', o: '#a8842c' },
    { l: '#f8e6c2', b: '#e8c88e', d: '#b99358', o: '#876636' },
    { l: '#ffffff', b: '#fff2f5', d: '#e2b4c2', o: '#b0708a' },
    { l: '#fff6f8', b: '#ffe2ea', d: '#e8aebd', o: '#b8748a' },
    { l: '#ffd596', b: '#ffa648', d: '#d6761a', o: '#9a4e08' },
    { l: '#ffffff', b: '#fbfcff', d: '#c9d2e4', o: '#8e9ab8' },
    { l: '#fffad0', b: '#ffe36a', d: '#e2a620', o: '#a87408' }
  ];
  var W = 400, BL = 20, BR = 380, PAD = 8;
  var cv = $('cv'), ctx = cv.getContext('2d');
  var s = 1, dpr = 1, SS = 1, ox = 0, vw = 0, vh = 0, LH = 700, floorY = 600, lineY = 190, dropY = 150, XL = 0, XR = W;
  var bgc = document.createElement('canvas'), SPR = [], stars = [];

  var G = {
    state: 'title', bodies: [], born: [], parts: [], rings: [], floats: [],
    score: 0, best: +ls('best', 0), seen: +ls('seen', 0), today: 0, moons: 0,
    chain: 0, chainT: 0, gauge: 0, GMAX: 14, cur: 0, next: 1, aimX: 200, cool: 0,
    warn: false, noOver: 0, shake: 0, kung: -1, kungHit: false, t: 0, praise: null, flash: 0, overT: 0
  };
  function dstr() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  if (ls('day', '') === dstr()) G.today = +ls('dayS', 0);

  // ---------- 떡 그림 ----------
  function deco(c, lv, r, rnd) {
    var i, a, d;
    if (lv === 4) {
      for (i = 0; i < 26; i++) { a = rnd() * PI2; d = Math.sqrt(rnd()) * r * 0.92; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.8 + rnd() * 1.4, 0, PI2); c.fillStyle = 'rgba(64,104,36,' + (0.25 + rnd() * 0.3) + ')'; c.fill(); }
    } else if (lv === 5) {
      c.lineCap = 'round'; c.strokeStyle = 'rgba(176,132,44,.55)'; c.lineWidth = r * 0.055;
      c.beginPath(); c.arc(0, r * 0.75, r * 1.22, Math.PI * 1.22, Math.PI * 1.78); c.stroke();
      for (i = -3; i <= 3; i++) { a = Math.PI * 1.5 + i * 0.13; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.22, r * 0.75 + Math.sin(a) * r * 1.22); c.lineTo(Math.cos(a) * r * 1.34, r * 0.75 + Math.sin(a) * r * 1.34); c.stroke(); }
    } else if (lv === 6) {
      for (i = 0; i < 90; i++) { a = rnd() * PI2; d = Math.sqrt(rnd()) * r * 0.95; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.6 + rnd() * 1.3, 0, PI2); c.fillStyle = rnd() < 0.5 ? 'rgba(150,104,48,.32)' : 'rgba(255,244,214,.6)'; c.fill(); }
    } else if (lv === 7) {
      var band = ['#ff9db8', '#fffdf6', '#a9d87e', '#ffe27a'];
      for (i = 0; i < 4; i++) { c.fillStyle = band[i]; c.globalAlpha = 0.92; c.fillRect(-r, -r + i * r * 0.5, 2 * r, r * 0.5 + 1); }
      c.globalAlpha = 1;
      var hg = c.createRadialGradient(-r * 0.35, -r * 0.42, r * 0.05, -r * 0.2, -r * 0.2, r * 1.1);
      hg.addColorStop(0, 'rgba(255,255,255,.55)'); hg.addColorStop(0.5, 'rgba(255,255,255,.08)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hg; c.fillRect(-r, -r, 2 * r, 2 * r);
    } else if (lv === 8) {
      c.save(); c.translate(0, -r * 0.56);
      var q = r * 0.3;
      c.beginPath(); c.moveTo(-q, -q * 0.5); c.quadraticCurveTo(-q * 1.1, q * 0.5, 0, q * 1.15); c.quadraticCurveTo(q * 1.1, q * 0.5, q, -q * 0.5); c.quadraticCurveTo(0, -q * 1.0, -q, -q * 0.5); c.closePath();
      var sg2 = c.createLinearGradient(-q, -q, q, q); sg2.addColorStop(0, '#ff7a7a'); sg2.addColorStop(1, '#d6283c');
      c.fillStyle = sg2; c.fill(); c.lineWidth = Math.max(1.2, r * 0.03); c.strokeStyle = '#8e1426'; c.stroke();
      c.fillStyle = '#ffe9a0';
      for (i = 0; i < 6; i++) { c.beginPath(); c.ellipse(((i % 3) - 1) * q * 0.45, (i < 3 ? 0 : q * 0.42) + q * 0.05, q * 0.07, q * 0.11, 0, 0, PI2); c.fill(); }
      c.fillStyle = '#5faa3c'; c.strokeStyle = '#356a1c'; c.lineWidth = Math.max(1, r * 0.02);
      for (i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * q * 0.5, -q * 0.62, q * 0.36, q * 0.17, i * 0.5, 0, PI2); c.fill(); c.stroke(); }
      c.restore();
    } else if (lv === 9) {
      c.strokeStyle = 'rgba(170,86,10,.4)'; c.lineWidth = r * 0.04;
      c.beginPath(); c.ellipse(0, 0, r * 0.42, r * 1.0, 0, 0, PI2); c.stroke();
      c.beginPath(); c.ellipse(0, 0, r * 0.8, r * 1.02, 0, 0, PI2); c.stroke();
      c.fillStyle = '#5c8a34'; c.strokeStyle = '#3a5c1c'; c.lineWidth = Math.max(1.2, r * 0.03);
      c.beginPath(); c.moveTo(-r * 0.09, -r * 0.98); c.lineTo(-r * 0.06, -r * 0.76); c.lineTo(r * 0.1, -r * 0.76); c.lineTo(r * 0.14, -r * 0.98); c.closePath(); c.fill(); c.stroke();
    } else if (lv === 10) {
      c.save(); c.translate(0, -r * 0.56);
      for (i = 0; i < 5; i++) { a = i * PI2 / 5 - Math.PI / 2; c.beginPath(); c.ellipse(Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.13, r * 0.11, r * 0.065, a, 0, PI2); c.fillStyle = '#b0402c'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#6e1e12'; c.stroke(); }
      c.beginPath(); c.arc(0, 0, r * 0.05, 0, PI2); c.fillStyle = '#ffd86a'; c.fill();
      c.fillStyle = '#6aa046';
      c.beginPath(); c.ellipse(-r * 0.36, r * 0.02, r * 0.1, r * 0.04, -0.5, 0, PI2); c.fill();
      c.beginPath(); c.ellipse(r * 0.36, r * 0.02, r * 0.1, r * 0.04, 0.5, 0, PI2); c.fill();
      c.restore();
    } else if (lv === 11) {
      c.fillStyle = 'rgba(214,150,24,.3)';
      c.beginPath(); c.arc(r * 0.5, -r * 0.42, r * 0.16, 0, PI2); c.fill();
      c.beginPath(); c.arc(-r * 0.6, r * 0.3, r * 0.11, 0, PI2); c.fill();
      c.beginPath(); c.arc(r * 0.34, r * 0.56, r * 0.2, 0, PI2); c.fill();
      c.beginPath(); c.arc(-r * 0.3, -r * 0.62, r * 0.08, 0, PI2); c.fill();
    }
  }
  function drawFace(c, lv, r, face) {
    var fr = 8 + r * 0.42, ey = r * (lv === 8 || lv === 10 ? 0.16 : 0.06), ex = fr * 0.42, er = fr * 0.115, ink = '#2a1a2e', i, sx;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(255,96,128,' + (lv === 1 ? 0.5 : 0.42) + ')';
    c.beginPath(); c.ellipse(-fr * 0.74, ey + fr * 0.22, fr * 0.17, fr * 0.1, 0, 0, PI2); c.fill();
    c.beginPath(); c.ellipse(fr * 0.74, ey + fr * 0.22, fr * 0.17, fr * 0.1, 0, 0, PI2); c.fill();
    for (i = -1; i <= 1; i += 2) {
      sx = i * ex;
      if (face === 1) {
        c.strokeStyle = lv === 1 ? '#fff' : ink; c.lineWidth = fr * 0.075;
        c.beginPath(); c.moveTo(sx - i * er * 1.1, ey - er * 0.9); c.lineTo(sx + i * er * 0.7, ey); c.lineTo(sx - i * er * 1.1, ey + er * 0.9); c.stroke();
      } else if (lv === 11) {
        c.strokeStyle = '#7a4a08'; c.lineWidth = fr * 0.075;
        c.beginPath(); c.arc(sx, ey + er * 0.6, er * 1.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      } else {
        if (lv === 1) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx, ey, er * 1.55, 0, PI2); c.fill(); }
        c.fillStyle = ink; c.beginPath(); c.ellipse(sx, ey, er, er * 1.12, 0, 0, PI2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(sx - er * 0.3, ey - er * 0.38, er * 0.38, 0, PI2); c.fill();
      }
    }
    var my = ey + fr * 0.2, mw = fr * 0.11;
    c.strokeStyle = lv === 1 ? '#fff' : (lv === 11 ? '#7a4a08' : ink); c.lineWidth = fr * 0.06;
    if (face === 1) { c.fillStyle = '#7a2a3a'; c.beginPath(); c.ellipse(0, my + mw * 0.6, mw * 0.8, mw * 1.0, 0, 0, PI2); c.fill(); c.stroke(); }
    else { c.beginPath(); c.arc(-mw, my, mw, 0.1, Math.PI - 0.1); c.stroke(); c.beginPath(); c.arc(mw, my, mw, 0.1, Math.PI - 0.1); c.stroke(); }
  }
  function drawMochi(c, lv, face) {
    var r = R[lv - 1], k = COL[lv - 1], rnd = rng(lv * 977);
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, PI2);
    var g = c.createRadialGradient(-r * 0.35, -r * 0.42, r * 0.08, 0, 0, r * 1.08);
    g.addColorStop(0, k.l); g.addColorStop(0.55, k.b); g.addColorStop(1, k.d);
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    deco(c, lv, r, rnd);
    var g2 = c.createRadialGradient(-r * 0.15, -r * 0.25, r * 0.7, -r * 0.15, -r * 0.25, r * 1.35);
    g2.addColorStop(0, 'rgba(40,20,60,0)'); g2.addColorStop(1, 'rgba(40,20,60,.3)');
    c.fillStyle = g2; c.fillRect(-r, -r, 2 * r, 2 * r);
    c.save(); c.translate(-r * 0.42, -r * 0.52); c.rotate(-0.62);
    c.beginPath(); c.ellipse(0, 0, r * 0.25, r * 0.12, 0, 0, PI2); c.fillStyle = 'rgba(255,255,255,' + (lv === 1 ? 0.38 : 0.78) + ')'; c.fill(); c.restore();
    c.beginPath(); c.arc(-r * 0.66, -r * 0.2, r * 0.05, 0, PI2); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    c.restore();
    c.lineWidth = Math.max(1.6, r * 0.05); c.strokeStyle = k.o;
    c.beginPath(); c.arc(0, 0, r - c.lineWidth * 0.5, 0, PI2); c.stroke();
    drawFace(c, lv, r, face);
    c.restore();
  }
  function buildSprites() {
    SPR = [null];
    for (var lv = 1; lv <= 11; lv++) {
      SPR[lv] = [];
      for (var f = 0; f < 2; f++) {
        var hw = R[lv - 1] + PAD, c = document.createElement('canvas');
        c.width = c.height = Math.ceil(hw * 2 * SS);
        var x = c.getContext('2d'); x.setTransform(SS, 0, 0, SS, hw * SS, hw * SS);
        drawMochi(x, lv, f); c.hw = hw; SPR[lv][f] = c;
      }
    }
  }

  // ---------- 배경: 밤하늘, 산 세 겹, 마루, 나무 됫박 ----------
  function ridge(b, baseY, amp, col, seed) {
    b.beginPath(); b.moveTo(XL - 5, floorY + 30);
    for (var x = XL - 5; x <= XR + 8; x += 6) b.lineTo(x, baseY - amp * (0.5 + 0.5 * Math.sin(x * 0.011 + seed) + 0.28 * Math.sin(x * 0.029 + seed * 2.3) + 0.1 * Math.sin(x * 0.07 + seed)));
    b.lineTo(XR + 8, floorY + 30); b.closePath(); b.fillStyle = col; b.fill();
  }
  function wood(b, x, y, w, h, vert) {
    var g = vert ? b.createLinearGradient(x, 0, x + w, 0) : b.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#e9b673'); g.addColorStop(0.45, '#cf9450'); g.addColorStop(1, '#9c6530');
    b.fillStyle = g; b.fillRect(x, y, w, h);
    var rnd = rng(Math.round(x * 7 + y * 13 + w));
    b.strokeStyle = 'rgba(110,64,22,.35)'; b.lineWidth = 0.8;
    for (var i = 0; i < (vert ? 4 : 5); i++) {
      b.beginPath();
      if (vert) { var gx = x + 2 + rnd() * (w - 4); b.moveTo(gx, y); b.bezierCurveTo(gx + 2, y + h * 0.3, gx - 2, y + h * 0.6, gx + 1, y + h); }
      else { var gy = y + 2 + rnd() * (h - 4); b.moveTo(x, gy); b.bezierCurveTo(x + w * 0.3, gy + 1.5, x + w * 0.6, gy - 1.5, x + w, gy); }
      b.stroke();
    }
    b.lineWidth = 2; b.strokeStyle = '#4a2a10'; b.strokeRect(x, y, w, h);
  }
  function buildBg() {
    bgc.width = cv.width; bgc.height = cv.height;
    var b = bgc.getContext('2d'), i, rnd = rng(20261001);
    b.setTransform(SS, 0, 0, SS, ox * dpr, 0);
    var sky = b.createLinearGradient(0, 0, 0, floorY + 20);
    sky.addColorStop(0, '#0f1440'); sky.addColorStop(0.42, '#2b2468'); sky.addColorStop(0.76, '#5d3b84'); sky.addColorStop(1, '#93548a');
    b.fillStyle = sky; b.fillRect(XL - 2, 0, XR - XL + 4, LH + 2);
    stars = [];
    for (i = 0; i < 90; i++) {
      var sx = XL + rnd() * (XR - XL), sy = rnd() * (floorY - 190), sr = 0.5 + rnd() * 1.2, sa = 0.3 + rnd() * 0.6;
      b.beginPath(); b.arc(sx, sy, sr, 0, PI2); b.fillStyle = 'rgba(255,250,225,' + sa + ')'; b.fill();
      if (i < 14) stars.push({ x: sx, y: sy, p: rnd() * 6 });
    }
    // 하늘의 달(멀리, 흐리게)
    var mx = XL + (XR - XL) * 0.2, my = 128;
    var mg = b.createRadialGradient(mx, my, 20, mx, my, 170);
    mg.addColorStop(0, 'rgba(255,240,180,.32)'); mg.addColorStop(1, 'rgba(255,240,180,0)');
    b.fillStyle = mg; b.fillRect(mx - 180, my - 180, 360, 360);
    var md = b.createRadialGradient(mx - 12, my - 14, 4, mx, my, 44);
    md.addColorStop(0, '#fffbe0'); md.addColorStop(1, '#f2dc98');
    b.beginPath(); b.arc(mx, my, 42, 0, PI2); b.fillStyle = md; b.fill();
    b.fillStyle = 'rgba(200,170,90,.28)';
    b.beginPath(); b.arc(mx + 14, my - 10, 8, 0, PI2); b.fill(); b.beginPath(); b.arc(mx - 16, my + 12, 6, 0, PI2); b.fill(); b.beginPath(); b.arc(mx + 8, my + 20, 10, 0, PI2); b.fill();
    // 산 세 겹(뒤는 옅게)
    ridge(b, floorY - 96, 110, 'rgba(92,70,146,.75)', 1.3);
    ridge(b, floorY - 52, 86, '#3d2f72', 4.1);
    ridge(b, floorY - 14, 56, '#261e50', 7.7);
    // 마루
    var fy = floorY + 14, fg = b.createLinearGradient(0, fy, 0, LH);
    fg.addColorStop(0, '#8a5a32'); fg.addColorStop(1, '#3e2512');
    b.fillStyle = fg; b.fillRect(XL - 2, fy, XR - XL + 4, LH - fy + 2);
    b.strokeStyle = 'rgba(30,14,4,.45)'; b.lineWidth = 1.2;
    var rows = [0, 12, 30, 56, 92];
    for (i = 1; i < rows.length; i++) {
      b.beginPath(); b.moveTo(XL, fy + rows[i]); b.lineTo(XR, fy + rows[i]); b.stroke();
      for (var px = XL + ((i * 61) % 97); px < XR; px += 130) { b.beginPath(); b.moveTo(px, fy + rows[i - 1]); b.lineTo(px, fy + rows[i]); b.stroke(); }
    }
    b.fillStyle = 'rgba(255,220,170,.3)'; b.fillRect(XL - 2, fy, XR - XL + 4, 1.6);
    // 됫박 그림자, 뒤판, 나무 벽
    b.save(); b.translate(W / 2, floorY + 20); b.scale(1, 0.09);
    var sh = b.createRadialGradient(0, 0, 30, 0, 0, 230);
    sh.addColorStop(0, 'rgba(10,4,20,.6)'); sh.addColorStop(1, 'rgba(10,4,20,0)');
    b.fillStyle = sh; b.fillRect(-240, -240, 480, 480); b.restore();
    var top = lineY - 12;
    var bp = b.createLinearGradient(0, top, 0, floorY);
    bp.addColorStop(0, 'rgba(26,22,70,.42)'); bp.addColorStop(1, 'rgba(10,8,38,.66)');
    b.fillStyle = bp; b.fillRect(BL, top, BR - BL, floorY - top);
    b.fillStyle = 'rgba(0,0,0,.22)'; b.fillRect(BL, top, 5, floorY - top); b.fillRect(BL, floorY - 5, BR - BL, 5);
    wood(b, BL - 14, top, 14, floorY - top + 14, true);
    wood(b, BR, top, 14, floorY - top + 14, true);
    wood(b, BL - 14, floorY, BR - BL + 28, 14, false);
    // 가장자리 어둡게
    b.setTransform(1, 0, 0, 1, 0, 0);
    var vg = b.createRadialGradient(bgc.width / 2, bgc.height * 0.48, bgc.height * 0.42, bgc.width / 2, bgc.height * 0.48, bgc.height * 0.85);
    vg.addColorStop(0, 'rgba(6,4,26,0)'); vg.addColorStop(1, 'rgba(6,4,26,.5)');
    b.fillStyle = vg; b.fillRect(0, 0, bgc.width, bgc.height);
  }

  function resize() {
    vw = window.innerWidth || 375; vh = window.innerHeight || 660;
    var O = window.DT_OPT || {};   // 쇼츠 촬영 때만 쓰는 배치 값
    var colW = Math.min(vw, vh * (O.colK || 0.6));
    s = colW / W; ox = (vw - colW) / 2; LH = vh / s;
    dpr = O.dpr || Math.min(window.devicePixelRatio || 1, 2); SS = s * dpr;
    var nf = LH - (O.bottom || 92), d = nf - floorY;
    G.bodies.forEach(function (b) { b.y += d; });
    floorY = nf; lineY = Math.max(O.top || 190, floorY - 500); dropY = lineY - 40;
    XL = -ox / s; XR = W + ox / s;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    var st = document.documentElement.style;
    st.setProperty('--col', colW + 'px'); st.setProperty('--ox', ox + 'px'); st.setProperty('--padl', Math.max(8, 104 - ox) + 'px');
    buildSprites(); buildBg(); drawNext(); drawDex();
  }

  // ---------- 판 ----------
  function body(lv, x, y) {
    return { lv: lv, x: x, y: y, px: x, vx: 0, vy: 0, r: R[lv - 1], rt: R[lv - 1], ang: 0, av: 0, sq: 0, age: 0, above: 0, gr: false, dead: false, pop: 0 };
  }
  function randLv() { var v = Math.random() * 100; return v < 30 ? 1 : v < 56 ? 2 : v < 76 ? 3 : v < 90 ? 4 : 5; }
  function seen(lv) { if (lv > G.seen) { G.seen = lv; ss('seen', lv); drawDex(); } }
  function burst(x, y, col, n, sp) {
    for (var i = 0; i < n; i++) { var a = Math.random() * PI2, v = sp * (0.4 + Math.random() * 0.8); G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + Math.random() * 0.3, r: 1.5 + Math.random() * 3, col: col }); }
  }
  function addScore(p, x, y) {
    G.score += p; $('score').textContent = G.score; $('score').className = G.score > 99999 ? 'sm' : ''; if (G.score > 99999) document.body.classList.add('big');
    G.floats.push({ x: x, y: y, txt: '+' + p, life: 0.8 });
  }
  function praise(txt, k) { G.praise = { txt: txt, t: 0 }; DTA.sfx('praise', k); }
  function hit(a, v) { var p = Math.min(1, v / 900); if (p * 0.22 > a.sq) a.sq = p * 0.22; DTA.sfx('thud', p); }
  function merge(a, b) {
    a.dead = b.dead = true;
    var x = (a.x * b.r + b.x * a.r) / (a.r + b.r), y = (a.y * b.r + b.y * a.r) / (a.r + b.r), lv = a.lv + 1;
    if (G.state === 'play') {
      G.chain = G.chainT > 0 ? G.chain + 1 : 1; G.chainT = 1.0;
      if (G.chain === 3) praise('NICE', 0); else if (G.chain === 5) praise('GREAT', 1); else if (G.chain === 7) praise('PERFECT', 2);
      if (G.gauge < G.GMAX) { G.gauge++; gaugeUI(); if (G.gauge === G.GMAX) DTA.sfx('full'); }
    }
    if (a.lv === 11) {
      burst(x, y, '#fff3a0', 40, 380); G.rings.push({ x: x, y: y, r0: 40, r1: 320, life: 0.7, max: 0.7, col: '255,240,160' });
      G.flash = 0.6; G.shake = 14; DTA.sfx('moon');
      if (G.state === 'play') addScore(300 * Math.min(G.chain, 5), x, y);
      return;
    }
    var n = body(lv, x, y);
    n.r = Math.max(a.r, b.r); n.vx = (a.vx + b.vx) * 0.5; n.vy = (a.vy + b.vy) * 0.5 - 70; n.ang = a.ang; n.pop = 0.28; n.sq = -0.16;
    G.born.push(n);
    burst(x, y, COL[lv - 1].l, 8 + lv, 120 + lv * 14);
    G.rings.push({ x: x, y: y, r0: n.r, r1: R[lv - 1] * 1.7, life: 0.35, max: 0.35, col: '255,255,255' });
    DTA.sfx('merge', lv);
    if (G.state === 'play') {
      addScore(lv * (lv + 1) / 2 * Math.min(G.chain, 5), x, y - R[lv - 1]);
      seen(lv);
      if (lv === 11) { G.moons++; G.flash = 0.5; G.shake = 10; burst(x, y, '#fff3a0', 30, 300); DTA.sfx('moon'); }
    }
  }

  function sub(h) {
    var bs = G.bodies, n = bs.length, i, j, a, b, it;
    for (i = 0; i < n; i++) {
      a = bs[i]; a.age += h; a.vy += 1900 * h; a.vx *= 0.9995;
      a.x += a.vx * h; a.y += a.vy * h; a.ang += a.av * h; a.gr = false;
      if (a.r < a.rt) a.r = Math.min(a.rt, a.r + h * a.rt * 6);
    }
    for (it = 0; it < 6; it++) {
      for (i = 0; i < n; i++) {
        a = bs[i]; if (a.dead) continue;
        for (j = i + 1; j < n; j++) {
          b = bs[j]; if (b.dead) continue;
          var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (a.lv === b.lv && a.age > 0.06 && b.age > 0.06) { merge(a, b); break; }
          var d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, ma = a.r * a.r, mb = b.r * b.r, sm = ma + mb;
          var c = Math.max(0, rr - d - 0.1) * 0.8;
          a.x -= nx * c * mb / sm; a.y -= ny * c * mb / sm; b.x += nx * c * ma / sm; b.y += ny * c * ma / sm;
          var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            if (vn < -150) { hit(a, -vn); hit(b, -vn); }
            var jn = -(vn < -160 ? 1.1 : 1) * vn * ma * mb / sm;
            a.vx -= jn * nx / ma; a.vy -= jn * ny / ma; b.vx += jn * nx / mb; b.vy += jn * ny / mb;
            var tx = -ny, ty = nx, vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty, jt = -vt * 0.05 * ma * mb / sm;
            a.vx -= jt * tx / ma; a.vy -= jt * ty / ma; b.vx += jt * tx / mb; b.vy += jt * ty / mb;
          }
          if (ny > 0.3) a.gr = true; else if (ny < -0.3) b.gr = true;
        }
      }
      for (i = 0; i < n; i++) {
        a = bs[i]; if (a.dead) continue;
        if (a.x - a.r < BL) { a.x = BL + a.r; if (a.vx < 0) a.vx = -a.vx * 0.2; }
        if (a.x + a.r > BR) { a.x = BR - a.r; if (a.vx > 0) a.vx = -a.vx * 0.2; }
        if (a.y + a.r > floorY) { a.y = floorY - a.r; if (a.vy > 0) { if (a.vy > 150) hit(a, a.vy); a.vy = a.vy > 160 ? -a.vy * 0.12 : 0; } a.vx *= 0.985; a.gr = true; }
      }
    }
    var dirty = G.born.length > 0;
    for (i = 0; i < n; i++) { a = bs[i]; if (a.dead) dirty = true; }
    if (dirty) { G.bodies = bs.filter(function (q) { return !q.dead; }).concat(G.born); G.born = []; }
  }

  var acc = 0, keys = {};
  function frame(dt) {
    G.t += dt; acc += dt;
    while (acc >= 1 / 120) { sub(1 / 120); acc -= 1 / 120; }
    var i, b, k = Math.exp(-dt * 10);
    for (i = 0; i < G.bodies.length; i++) {
      b = G.bodies[i]; b.sq *= k; if (b.pop > 0) b.pop -= dt;
      // 굴림은 실제로 움직인 거리로만(쌓여서 멈춘 떡이 제자리에서 돌지 않게)
      var mv = (b.x - b.px) / dt; b.px = b.x;
      if (b.gr) b.av += ((Math.abs(mv) > 3 ? mv / b.r : 0) - b.av) * 0.35; else b.av *= 0.98;
    }
    if (G.chainT > 0) G.chainT -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);
    if (G.flash > 0) G.flash -= dt * 1.6;
    if (G.noOver > 0) G.noOver -= dt;
    if (G.praise) { G.praise.t += dt; if (G.praise.t > 1.1) G.praise = null; }
    for (i = G.parts.length - 1; i >= 0; i--) { b = G.parts[i]; b.life -= dt; b.vy += 500 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.life <= 0) G.parts.splice(i, 1); }
    for (i = G.rings.length - 1; i >= 0; i--) { G.rings[i].life -= dt; if (G.rings[i].life <= 0) G.rings.splice(i, 1); }
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].life -= dt; G.floats[i].y -= 38 * dt; if (G.floats[i].life <= 0) G.floats.splice(i, 1); }
    if (G.kung >= 0) {
      G.kung += dt;
      if (!G.kungHit && G.kung >= 0.16) kungHit();
      if (G.kung > 0.6) G.kung = -1;
    }
    if (G.state === 'title') G.aimX = 200 + Math.sin(G.t * 0.8) * 96;
    if (G.state === 'play') {
      if (keys.l) setAim(G.aimX - 300 * dt);
      if (keys.r) setAim(G.aimX + 300 * dt);
      if (G.cool > 0) { G.cool -= dt; if (G.cool <= 0) { G.cur = G.next; G.next = randLv(); setAim(G.aimX); drawNext(); } }
      var warn = false;
      for (i = 0; i < G.bodies.length; i++) {
        b = G.bodies[i];
        if (b.age > 1.2 && b.y - b.r < lineY && b.vx * b.vx + b.vy * b.vy < 6400 && G.noOver <= 0) b.above += dt; else b.above = 0;
        if (b.above > 0.5) warn = true;
        if (b.above > 2.2) { over(); break; }
      }
      G.warn = warn;
    }
    if (G.state === 'over' && G.overT > 0) { G.overT -= dt; if (G.overT <= 0) showOver(); }
  }

  function setAim(x) { var r = G.cur ? R[G.cur - 1] : 14; G.aimX = Math.max(BL + r + 0.5, Math.min(BR - r - 0.5, x)); }
  function drop() {
    if (G.state !== 'play' || !G.cur || G.cool > 0) return;
    setAim(G.aimX);
    var b = body(G.cur, G.aimX + (Math.random() - 0.5) * 0.4, dropY); b.vy = 60;
    G.bodies.push(b); seen(G.cur); G.cur = 0; G.cool = 0.48; DTA.sfx('drop');
  }
  function gaugeUI() {
    $('gfill').style.width = (G.gauge / G.GMAX * 100) + '%';
    var full = G.gauge >= G.GMAX && G.state === 'play';
    $('kung').disabled = !full; $('kung').classList.toggle('ready', full);
  }
  function kung() {
    if (G.state !== 'play' || G.gauge < G.GMAX || G.kung >= 0) return;
    G.kung = 0; G.kungHit = false; G.gauge = 0; gaugeUI();
  }
  function kungHit() {
    G.kungHit = true; G.shake = 16; G.flash = 0.25; G.noOver = 1.6; DTA.sfx('kung');
    G.rings.push({ x: BR, y: lineY, r0: 20, r1: 260, life: 0.45, max: 0.45, col: '255,236,170' });
    G.bodies.forEach(function (b) {
      if (b.lv <= 2) { b.dead = true; burst(b.x, b.y, COL[b.lv - 1].l, 7, 160); addScore(b.lv, b.x, b.y); }
      else { b.vy = -(380 + Math.random() * 260); b.vx += (Math.random() - 0.5) * 300; b.sq = 0.2; b.pop = 0.4; }
    });
  }

  function start() {
    DTA.init(); DTA.sfx('tap');
    G.bodies = []; G.born = []; G.parts = []; G.rings = []; G.floats = [];
    G.score = 0; G.moons = 0; G.chain = 0; G.chainT = 0; G.gauge = 0; G.cool = 0; G.kung = -1; G.praise = null; G.warn = false; G.noOver = 0;
    G.cur = randLv(); G.next = randLv(); G.aimX = 200; setAim(200);
    if (ls('day', '') !== dstr()) G.today = 0;
    G.state = 'play'; document.body.classList.add('playing');
    $('title').hidden = true; $('over').hidden = true;
    $('score').textContent = '0'; $('score').className = ''; document.body.classList.remove('big'); $('best').textContent = G.best; gaugeUI(); drawNext();
  }
  function over() {
    G.state = 'over'; G.overT = 1.0; G.cur = 0; G.shake = 8; DTA.sfx('over'); gaugeUI();
    G.bodies.forEach(function (b) { b.pop = 99; });
    G.newBest = G.score > G.best; G.newDay = G.score > G.today;
    if (G.newBest) { G.best = G.score; ss('best', G.best); }
    if (G.newDay) { G.today = G.score; ss('day', dstr()); ss('dayS', G.today); }
  }
  function showOver() {
    $('oscore').textContent = G.score; $('obest').textContent = G.best; $('otoday').textContent = G.today;
    $('obestW').className = G.newBest ? 'new' : ''; $('otodayW').className = G.newDay ? 'new' : '';
    $('omoon').hidden = !G.moons; $('omoonN').textContent = T.moon(G.moons);
    $('share').textContent = T.share; $('tbestN').textContent = G.best; $('best').textContent = G.best;
    $('over').hidden = false;
  }
  function share() {
    DTA.sfx('tap');
    var url = location.protocol === 'file:' ? '' : (window.DT_SHARE_URL || location.origin + location.pathname + (EN ? '?lang=en' : ''));
    var text = T.msg(G.score, G.moons), full = text + (url ? '\n' + url : '');
    if (navigator.share) { navigator.share(url ? { text: text, url: url } : { text: text }).catch(function () {}); return; }
    function done() { $('share').textContent = T.copied; setTimeout(function () { $('share').textContent = T.share; }, 1500); }
    function legacy() { var ta = document.createElement('textarea'); ta.value = full; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(done, legacy); else legacy();
  }

  // ---------- 그리기 ----------
  function drawBody(c, b) {
    var sp = SPR[b.lv][(b.pop > 0 || b.sq > 0.07) ? 1 : 0], sc = b.r / R[b.lv - 1], hw = sp.hw * sc, q = b.sq;
    c.save(); c.translate(b.x, b.y + b.r * q * 0.8); c.scale(1 + q, 1 - q); c.rotate(b.ang);
    c.drawImage(sp, -hw, -hw, hw * 2, hw * 2); c.restore();
  }
  function drawRabbit(c, x, y, mood) {
    c.save(); c.translate(x, y + Math.sin(G.t * 2.4) * 1.5);
    c.fillStyle = 'rgba(255,255,255,.9)';
    [[-22, 14, 13], [-6, 18, 15], [12, 17, 14], [26, 13, 10]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, PI2); c.fill(); });
    for (var i = -1; i <= 1; i += 2) {
      c.save(); c.translate(i * 9, -20); c.rotate(i * 0.2 + Math.sin(G.t * 3 + i) * 0.04);
      c.beginPath(); c.ellipse(0, -6, 6, 16, 0, 0, PI2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#a99cc0'; c.stroke();
      c.beginPath(); c.ellipse(0, -5, 2.8, 10.5, 0, 0, PI2); c.fillStyle = '#ffb4c8'; c.fill(); c.restore();
    }
    var g = c.createRadialGradient(-7, -7, 2, 0, 0, 24); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e2dbee');
    c.beginPath(); c.ellipse(0, 0, 21, 17, 0, 0, PI2); c.fillStyle = g; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#a99cc0'; c.stroke();
    c.fillStyle = 'rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(-13, 5, 4.2, 2.6, 0, 0, PI2); c.fill(); c.beginPath(); c.ellipse(13, 5, 4.2, 2.6, 0, 0, PI2); c.fill();
    c.strokeStyle = c.fillStyle = '#2a1a2e'; c.lineWidth = 1.7; c.lineCap = 'round';
    if (mood === 2) { [-8, 8].forEach(function (e) { c.beginPath(); c.moveTo(e - 2.5, -3.5); c.lineTo(e + 2.5, 1.5); c.moveTo(e + 2.5, -3.5); c.lineTo(e - 2.5, 1.5); c.stroke(); }); }
    else if (mood === 1) { [-8, 8].forEach(function (e) { c.beginPath(); c.arc(e, 0, 2.8, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }); }
    else { c.beginPath(); c.arc(-8, -1, 2.5, 0, PI2); c.fill(); c.beginPath(); c.arc(8, -1, 2.5, 0, PI2); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-8.8, -1.9, 0.9, 0, PI2); c.fill(); c.beginPath(); c.arc(7.2, -1.9, 0.9, 0, PI2); c.fill(); }
    c.fillStyle = '#ff8fa8'; c.beginPath(); c.ellipse(0, 3.5, 1.9, 1.3, 0, 0, PI2); c.fill();
    c.strokeStyle = '#2a1a2e'; c.lineWidth = 1.2; c.beginPath(); c.arc(-1.7, 5.6, 1.7, 0.2, Math.PI - 0.2); c.stroke(); c.beginPath(); c.arc(1.7, 5.6, 1.7, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
  }
  function drawPaws(c, x, y, w) {
    for (var i = -1; i <= 1; i += 2) { c.beginPath(); c.ellipse(x + i * w, y, 6, 5, 0, 0, PI2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#a99cc0'; c.stroke(); }
  }
  function drawMallet(c) {
    var t = G.kung, a = t < 0.16 ? 0.95 * (1 - Math.pow(t / 0.16, 2.2)) : Math.min(0.45, (t - 0.16) * 1.6);
    c.save(); c.translate(BR + 74, lineY - 36); c.rotate(a);
    var hg = c.createLinearGradient(0, -7, 0, 7); hg.addColorStop(0, '#d8a060'); hg.addColorStop(1, '#8e5a26');
    c.fillStyle = hg; c.strokeStyle = '#4a2a10'; c.lineWidth = 2.4;
    c.beginPath(); c.rect(-150, -7, 170, 14); c.fill(); c.stroke();
    var mg = c.createLinearGradient(-190, 0, -118, 0); mg.addColorStop(0, '#f0c484'); mg.addColorStop(0.5, '#d49a56'); mg.addColorStop(1, '#a06a30');
    c.fillStyle = mg; c.beginPath();
    if (c.roundRect) c.roundRect(-190, -48, 72, 96, 12); else c.rect(-190, -48, 72, 96);
    c.fill(); c.stroke();
    c.strokeStyle = 'rgba(110,64,22,.4)'; c.lineWidth = 1.2;
    [-30, -10, 14, 32].forEach(function (y) { c.beginPath(); c.moveTo(-184, y); c.quadraticCurveTo(-154, y + 4, -124, y - 1); c.stroke(); });
    c.restore();
  }
  function render() {
    var c = ctx, i, b, shx = 0, shy = 0;
    if (G.shake > 0) { shx = (Math.random() - 0.5) * G.shake * SS; shy = (Math.random() - 0.5) * G.shake * SS; }
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (G.shake > 0) { c.fillStyle = '#0f1440'; c.fillRect(0, 0, cv.width, cv.height); }
    c.drawImage(bgc, shx, shy);
    c.setTransform(SS, 0, 0, SS, ox * dpr + shx, shy);
    for (i = 0; i < stars.length; i++) { var st = stars[i], al = 0.5 + 0.5 * Math.sin(G.t * 2 + st.p); c.beginPath(); c.arc(st.x, st.y, 1.6, 0, PI2); c.fillStyle = 'rgba(255,255,240,' + (al * 0.8) + ')'; c.fill(); }
    c.fillStyle = 'rgba(6,4,30,.3)';
    for (i = 0; i < G.bodies.length; i++) { b = G.bodies[i]; c.beginPath(); c.arc(b.x + 1.5, b.y + 3.5, b.r + 0.5, 0, PI2); c.fill(); }
    for (i = 0; i < G.bodies.length; i++) {
      b = G.bodies[i];
      if (b.lv === 11) { var mg = c.createRadialGradient(b.x, b.y, b.r * 0.8, b.x, b.y, b.r * 1.5); mg.addColorStop(0, 'rgba(255,236,140,.5)'); mg.addColorStop(1, 'rgba(255,236,140,0)'); c.fillStyle = mg; c.fillRect(b.x - b.r * 1.5, b.y - b.r * 1.5, b.r * 3, b.r * 3); }
    }
    for (i = 0; i < G.bodies.length; i++) drawBody(c, G.bodies[i]);
    c.setLineDash([9, 7]); c.lineWidth = 2.2;
    c.strokeStyle = G.warn ? 'rgba(255,80,70,' + (0.55 + 0.45 * Math.sin(G.t * 14)) + ')' : 'rgba(255,244,200,.5)';
    c.beginPath(); c.moveTo(BL, lineY); c.lineTo(BR, lineY); c.stroke(); c.setLineDash([]);
    var lvh = G.cur, rr = lvh ? R[lvh - 1] : 0, ry = dropY - rr - 13;
    if (G.state === 'play' && lvh) {
      c.setLineDash([3, 9]); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,.35)';
      c.beginPath(); c.moveTo(G.aimX, dropY + rr + 4); c.lineTo(G.aimX, floorY - 4); c.stroke(); c.setLineDash([]);
    }
    if (G.state !== 'title') drawRabbit(c, G.aimX, lvh ? ry : dropY - 30, G.state === 'over' ? 2 : (lvh ? 0 : 1));
    if (G.state === 'title') { /* 타이틀은 제목이 이 자리를 쓴다 */ }
    else if (lvh) {
      var sp = SPR[lvh][0];
      c.drawImage(sp, G.aimX - sp.hw, dropY - sp.hw, sp.hw * 2, sp.hw * 2);
      drawPaws(c, G.aimX, dropY - rr + 3, Math.min(rr * 0.62, 14));
    } else drawPaws(c, G.aimX, dropY - 14, 15);
    for (i = 0; i < G.rings.length; i++) { var q = G.rings[i], f = 1 - q.life / q.max; c.beginPath(); c.arc(q.x, q.y, q.r0 + (q.r1 - q.r0) * f, 0, PI2); c.lineWidth = 5 * (1 - f) + 0.5; c.strokeStyle = 'rgba(' + q.col + ',' + (1 - f) * 0.8 + ')'; c.stroke(); }
    for (i = 0; i < G.parts.length; i++) { b = G.parts[i]; c.globalAlpha = Math.max(0, Math.min(1, b.life / 0.4)); c.beginPath(); c.arc(b.x, b.y, b.r, 0, PI2); c.fillStyle = b.col; c.fill(); }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.font = '20px Tokki, Ria, sans-serif';
    for (i = 0; i < G.floats.length; i++) { b = G.floats[i]; c.globalAlpha = Math.min(1, b.life / 0.3); c.lineWidth = 5; c.strokeStyle = '#14285a'; c.strokeText(b.txt, b.x, b.y); c.fillStyle = '#fff3b0'; c.fillText(b.txt, b.x, b.y); }
    c.globalAlpha = 1;
    if (G.kung >= 0) drawMallet(c);
    if (G.praise) {
      var pt = G.praise.t, sc = pt < 0.15 ? 0.5 + pt / 0.15 * 0.7 : (pt < 0.25 ? 1.2 - (pt - 0.15) * 2 : 1);
      c.save(); c.translate(W / 2, lineY + 130); c.scale(sc, sc); c.globalAlpha = pt > 0.85 ? Math.max(0, (1.1 - pt) / 0.25) : 1;
      c.font = '58px Tokki, Ria, sans-serif'; c.lineWidth = 11; c.strokeStyle = '#14285a'; c.strokeText(G.praise.txt, 0, 0); c.fillStyle = '#ffe36a'; c.fillText(G.praise.txt, 0, 0);
      c.restore(); c.globalAlpha = 1;
    }
    if (G.flash > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,250,220,' + Math.min(0.6, G.flash) + ')'; c.fillRect(0, 0, cv.width, cv.height); }
  }
  function drawNext() {
    var n = $('next'), x = n.getContext('2d');
    x.clearRect(0, 0, 56, 56);
    if (!SPR[G.next]) return;
    var sp = SPR[G.next][0], k = 26 / sp.hw * (0.6 + G.next * 0.08);
    x.drawImage(sp, 28 - sp.hw * k, 28 - sp.hw * k, sp.hw * 2 * k, sp.hw * 2 * k);
  }
  function drawDex() {
    var d = $('dex'); if (!SPR[1]) return;
    var cw = Math.max(200, Math.round(Math.min(vw, vh * 0.6) * 0.9 - 22)), ch = 40, pr = Math.min(window.devicePixelRatio || 1, 2);
    d.width = cw * pr; d.height = ch * pr; d.style.height = ch + 'px';
    var x = d.getContext('2d'); x.setTransform(pr, 0, 0, pr, 0, 0);
    var cell = cw / 11;
    for (var lv = 1; lv <= 11; lv++) {
      var rad = Math.min(cell * 0.46, 9 + lv * 0.75), cx = cell * (lv - 0.5), cy = ch / 2;
      if (lv <= G.seen) { var sp = SPR[lv][0], k = rad / R[lv - 1]; x.drawImage(sp, cx - sp.hw * k, cy - sp.hw * k, sp.hw * 2 * k, sp.hw * 2 * k); }
      else {
        x.beginPath(); x.arc(cx, cy, rad, 0, PI2); x.fillStyle = '#c3cddd'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#8e9ab8'; x.stroke();
        x.fillStyle = '#6e7c9e'; x.font = Math.round(rad * 1.2) + 'px Ria, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', cx, cy + 1);
      }
    }
  }

  // ---------- 입력 ----------
  var aiming = false;
  function lx(e) { return (e.clientX - ox) / s; }
  cv.addEventListener('pointerdown', function (e) { if (G.state !== 'play') return; DTA.init(); aiming = true; setAim(lx(e)); e.preventDefault(); });
  cv.addEventListener('pointermove', function (e) { if (G.state === 'play' && (aiming || e.pointerType === 'mouse')) setAim(lx(e)); });
  window.addEventListener('pointerup', function (e) { if (aiming) { aiming = false; if (e.target === cv) setAim(lx(e)); drop(); } });
  window.addEventListener('pointercancel', function () { aiming = false; });
  function tog(id) {
    DTA.init();
    if (id === 'tBgm') DTA.setBgm(!DTA.bgm()); else DTA.setSnd(!DTA.snd());
    $('tBgm').classList.toggle('off', !DTA.bgm()); $('tSnd').classList.toggle('off', !DTA.snd());
    DTA.sfx('tap');
  }
  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = true;
    else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
      if (e.repeat) return; e.preventDefault();
      if (G.state === 'title') start(); else if (G.state === 'over') { if (!$('over').hidden) start(); } else drop();
    } else if (e.code === 'KeyF' || e.code === 'ShiftLeft') kung();
    else if (e.code === 'KeyM') tog('tBgm'); else if (e.code === 'KeyK') tog('tSnd');
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = false;
  });
  $('tBgm').addEventListener('click', function () { tog('tBgm'); });
  $('tSnd').addEventListener('click', function () { tog('tSnd'); });
  $('tBgm').classList.toggle('off', !DTA.bgm()); $('tSnd').classList.toggle('off', !DTA.snd());
  $('start').addEventListener('click', start);
  $('retry').addEventListener('click', start);
  $('share').addEventListener('click', share);
  $('kung').addEventListener('click', function () { kung(); });

  // ---------- 시작 ----------
  $('ttl').innerHTML = T.t1 + '<span>' + T.t2 + '</span>';
  $('otodayL').textContent = T.today; $('share').textContent = T.share;
  $('tbestN').textContent = G.best; $('best').textContent = G.best;
  document.title = EN ? 'Moon Mochi Merge' : '달떡 합치기';
  resize();
  window.addEventListener('resize', resize);
  // 타이틀 뒤에 쌓여 있는 떡
  [[4, 56], [2, 112], [5, 176], [3, 247], [6, 326], [1, 100], [2, 232], [1, 290]].forEach(function (p, i) {
    var b = body(p[0], p[1], floorY - 60 - (i < 5 ? 0 : 120 + i * 30)); b.age = 1; G.bodies.push(b);
  });
  for (var w = 0; w < 500; w++) sub(1 / 120);
  if (document.fonts && document.fonts.load) document.fonts.load('20px Tokki').then(function () { render(); });

  var last = 0;
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    frame(dt); render(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // 시험용 손잡이(미리보기 창은 rAF 가 안 돈다)
  window.__dt = {
    G: G, R: R,
    tick: function (n) { for (var i = 0; i < (n || 1); i++) frame(1 / 60); render(); },
    drop: function (x, lv) { if (lv) G.cur = lv; G.cool = 0; G.aimX = x; drop(); },
    start: start, kung: kung, over: over, showOver: showOver,
    geo: function () { return { s: s, ox: ox, LH: LH, floorY: floorY, lineY: lineY, dropY: dropY }; },
    shot: function (name) { render(); return fetch('/save?name=' + name, { method: 'POST', body: cv.toDataURL('image/png') }).then(function (r) { return r.text(); }); }
  };
})();
