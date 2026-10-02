/* 치킨집 — 그림(전부 코드). 생닭·조각·튀김 질감·조리 도구·아이콘 */
var ART = (function () {
'use strict';
var TAU = Math.PI * 2, CW = 340, CH = 300;
function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function lg(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; }
function rg(c, x, y, r0, r1, st, fx, fy) { var g = c.createRadialGradient(fx == null ? x : fx, fy == null ? y : fy, r0, x, y, r1); for (var i = 0; i < st.length; i += 2) g.addColorStop(st[i], st[i + 1]); return g; }
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); }
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function mix(a, b, t) { var A = hex(a), B = hex(b); t = Math.max(0, Math.min(1, t)); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
function ramp(stops, v) { for (var i = 0; i < stops.length - 2; i += 2) if (v <= stops[i + 2]) return mix(stops[i + 1], stops[i + 3], (v - stops[i]) / (stops[i + 2] - stops[i])); return stops[stops.length - 1]; }

/* ---------- 생닭(위에서 본 모습, 가슴이 위) 340x300 ---------- */
var OUT = '#b47a64';
function skinFill(c, x, y, r) { return rg(c, x, y, r * 0.08, r * 1.2, [0, '#fff3ea', 0.4, '#f9e0cf', 0.78, '#eec5ae', 1, '#dba58d'], x - r * 0.32, y - r * 0.38); }
function wingPath(c) { c.beginPath(); c.moveTo(-14, -60); c.bezierCurveTo(26, -70, 46, -30, 38, 8); c.bezierCurveTo(34, 40, 22, 62, 2, 78); c.bezierCurveTo(-10, 84, -20, 74, -16, 60); c.bezierCurveTo(-24, 30, -30, -20, -14, -60); c.closePath(); }
function legPath(c) { c.beginPath(); c.moveTo(-40, -44); c.bezierCurveTo(4, -70, 58, -38, 54, 10); c.bezierCurveTo(52, 40, 22, 56, -6, 66); c.bezierCurveTo(-14, 70, -26, 80, -36, 76); c.bezierCurveTo(-50, 74, -52, 60, -44, 52); c.bezierCurveTo(-66, 24, -70, -18, -40, -44); c.closePath(); }
function bodyPath(c) { c.beginPath(); c.moveTo(170, 20); c.bezierCurveTo(236, 20, 270, 72, 270, 132); c.bezierCurveTo(270, 200, 234, 248, 170, 252); c.bezierCurveTo(106, 248, 70, 200, 70, 132); c.bezierCurveTo(70, 72, 104, 20, 170, 20); c.closePath(); }
function rawChicken(c) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  /* 날개 */
  [-1, 1].forEach(function (s) {
    c.save(); c.translate(170 + s * 100, 116); c.scale(s, 1); c.rotate(0.2);
    wingPath(c); c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(); c.fillStyle = skinFill(c, 6, 0, 62); c.fill();
    c.strokeStyle = 'rgba(190,130,108,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -34); c.bezierCurveTo(18, -22, 22, 14, 8, 44); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 5; c.beginPath(); c.moveTo(4, -48); c.bezierCurveTo(22, -44, 30, -24, 28, -8); c.stroke();
    c.restore();
  });
  /* 몸통 */
  bodyPath(c); c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(); c.fillStyle = skinFill(c, 170, 132, 126); c.fill();
  c.save(); bodyPath(c); c.clip();
  c.fillStyle = rg(c, 170, 300, 20, 170, [0, 'rgba(200,130,105,.5)', 1, 'rgba(200,130,105,0)']); c.fillRect(60, 130, 220, 130);
  /* 가슴 두 쪽 */
  c.fillStyle = rg(c, 132, 104, 4, 62, [0, 'rgba(255,255,255,.75)', 1, 'rgba(255,255,255,0)']); c.fillRect(60, 30, 110, 150);
  c.fillStyle = rg(c, 204, 100, 4, 56, [0, 'rgba(255,255,255,.55)', 1, 'rgba(255,255,255,0)']); c.fillRect(170, 30, 110, 150);
  c.strokeStyle = 'rgba(196,136,112,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(170, 52); c.bezierCurveTo(166, 100, 172, 150, 170, 196); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(174, 56); c.bezierCurveTo(170, 100, 176, 150, 174, 192); c.stroke();
  /* 닭살 */
  var R = rng(77);
  for (var i = 0; i < 90; i++) { var x = 78 + R() * 184, y = 30 + R() * 214; c.fillStyle = 'rgba(205,150,128,.38)'; ell(c, x, y, 1.5, 1.2); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, x - 1, y - 1, 1, 0.8); c.fill(); }
  c.restore();
  /* 목 구멍 */
  ell(c, 170, 34, 22, 9); c.fillStyle = '#d99a86'; c.fill(); ell(c, 170, 36, 15, 5); c.fillStyle = '#b8645a'; c.fill();
  /* 다리(허벅지 + 북채) */
  [-1, 1].forEach(function (s) {
    c.save(); c.translate(170 + s * 60, 216); c.scale(s, 1);
    legPath(c); c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(); c.fillStyle = skinFill(c, 6, -2, 66); c.fill();
    c.save(); legPath(c); c.clip();
    c.fillStyle = rg(c, -30, 70, 4, 60, [0, 'rgba(206,140,112,.55)', 1, 'rgba(206,140,112,0)']); c.fillRect(-70, 10, 130, 80);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 7; c.beginPath(); c.moveTo(-18, -40); c.bezierCurveTo(14, -50, 38, -30, 40, -4); c.stroke();
    var R2 = rng(s + 5); for (var i = 0; i < 26; i++) { var x = -50 + R2() * 96, y = -46 + R2() * 100; c.fillStyle = 'rgba(205,150,128,.36)'; ell(c, x, y, 1.5, 1.2); c.fill(); }
    c.restore();
    /* 뼈 끝 */
    ell(c, -40, 66, 9, 8, 0.5); c.fillStyle = '#fbf4e6'; c.fill(); c.strokeStyle = '#c9a98c'; c.lineWidth = 2; c.stroke();
    ell(c, -42, 64, 3.5, 3); c.fillStyle = '#fff'; c.fill();
    c.restore();
  });
}

/* ---------- 조각 질감: 날것 → 튀김옷 → 튀김 → 양념 ---------- */
var FRY = [0, '#f3e4bc', 0.35, '#f2d490', 0.7, '#ecb658', 1.0, '#de9a34', 1.3, '#cf8526', 1.5, '#b0661c', 1.75, '#7c4214', 2.1, '#3e2210', 2.6, '#1e120c'];
var NAKED = [0, '#f5d9c6', 0.4, '#efcfa4', 0.8, '#dba868', 1.1, '#c98c48', 1.5, '#9a5c28', 1.9, '#5a3216', 2.6, '#22140c'];
var SAUCE = { yang: ['#d02a14', '#8e1408', '#ff8a5a'], soy: ['#a45c1e', '#643210', '#e2aa62'] };
function fryCol(done, coat) { var a = ramp(FRY, done), b = ramp(NAKED, done); if (coat >= 0.95) return a; var A = a.match(/\d+/g), B = b.match(/\d+/g), t = coat; return 'rgb(' + Math.round(+B[0] + (A[0] - B[0]) * t) + ',' + Math.round(+B[1] + (A[1] - B[1]) * t) + ',' + Math.round(+B[2] + (A[2] - B[2]) * t) + ')'; }
/* core: 날것 조각 캔버스(그림자 없음). st: {coat, done, sauce, sa, seed}. ss: 캔버스 배율 */
function nugTex(core, ss, st) {
  var w = core.width, h = core.height, cv = mk(w, h), c = cv.getContext('2d'), R = rng(st.seed), i, r, fried = st.done > 0.1, coat = st.coat, pts = st.pts || [], lump = coat > 0.05 || fried;
  /* 튀김옷: 살 위에 동글동글한 덩어리를 덧붙여 울퉁불퉁한 윤곽을 만든다 */
  if (lump) { var rad = (2 + 5.5 * coat + (fried ? 1.5 + 2 * coat : 0)) * ss; c.fillStyle = '#fff'; for (i = 0; i < pts.length; i++) { r = rad * (0.65 + 0.7 * R()); ell(c, pts[i][0] + (R() - 0.5) * 6 * ss, pts[i][1] + (R() - 0.5) * 6 * ss, r, r * (0.8 + 0.3 * R()), R() * 3); c.fill(); } }
  c.drawImage(core, 0, 0);
  if (lump) {
    c.globalCompositeOperation = 'source-atop';
    if (fried) { c.fillStyle = fryCol(st.done, coat); c.fillRect(0, 0, w, h); }
    else { c.globalAlpha = Math.min(1, 0.25 + coat * 0.75); c.fillStyle = '#f4e7c2'; c.fillRect(0, 0, w, h); c.globalAlpha = 1; }
    /* 빛과 그늘 */
    c.fillStyle = lg(c, w * 0.15, 0, w * 0.75, h, [0, 'rgba(255,246,214,.4)', 0.45, 'rgba(255,246,214,0)', 0.6, 'rgba(70,24,0,0)', 1, 'rgba(70,24,0,.3)']); c.fillRect(0, 0, w, h);
    /* 울퉁불퉁한 알갱이 */
    var n = Math.round((fried ? 16 + 40 * coat : 18 * coat) * Math.max(0.5, w * h / (120 * 120 * ss * ss))), dk = fried ? Math.min(0.5, 0.22 + st.done * 0.14) : 0.1, lt = fried ? Math.max(0.08, 0.55 - Math.max(0, st.done - 1) * 0.45) : 0.5;
    for (i = 0; i < n; i++) {
      var x = R() * w, y = R() * h; r = (2.2 + R() * 5.5) * ss;
      c.fillStyle = 'rgba(80,30,4,' + dk + ')'; ell(c, x + r * 0.3, y + r * 0.36, r, r * 0.85, R() * 3); c.fill();
      c.fillStyle = fried ? 'rgba(255,220,140,' + lt + ')' : 'rgba(255,252,240,.6)'; ell(c, x - r * 0.12, y - r * 0.16, r * 0.8, r * 0.66, R() * 3); c.fill();
    }
    if (fried && st.done > 1.55) { for (i = 0; i < 10; i++) { c.fillStyle = 'rgba(20,10,6,' + Math.min(0.6, (st.done - 1.5) * 0.7) + ')'; ell(c, R() * w, R() * h, (4 + R() * 9) * ss, (3 + R() * 7) * ss, R() * 3); c.fill(); } }
    if (st.sauce && st.sa > 0.02) {
      var S = SAUCE[st.sauce];
      c.globalAlpha = Math.min(1, st.sa) * 0.9; c.fillStyle = lg(c, 0, 0, w * 0.5, h, [0, S[0], 1, S[1]]); c.fillRect(0, 0, w, h);
      c.globalAlpha = Math.min(1, st.sa);
      for (i = 0; i < 9; i++) { var x2 = R() * w, y2 = R() * h; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = (1.5 + R() * 2) * ss; c.lineCap = 'round'; c.beginPath(); c.arc(x2, y2, (5 + R() * 9) * ss, 3.6 + R(), 4.6 + R()); c.stroke(); }
      for (i = 0; i < 5; i++) { c.fillStyle = S[2]; ell(c, R() * w, R() * h, (2 + R() * 3) * ss, (1.5 + R() * 2) * ss, R() * 3); c.globalAlpha = 0.35 * Math.min(1, st.sa); c.fill(); }
      c.globalAlpha = Math.min(1, st.sa);
      if (st.sauce === 'yang') for (i = 0; i < 16; i++) { c.fillStyle = '#fbeac0'; ell(c, R() * w, R() * h, 2.6 * ss, 1.5 * ss, R() * 3); c.fill(); }
      else for (i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#f4e2b0' : '#6aa83a'; ell(c, R() * w, R() * h, 2.4 * ss, 1.8 * ss, R() * 3); c.fill(); }
      c.globalAlpha = 1;
    }
    /* 가장자리 두께: 오른쪽 아래는 그늘, 왼쪽 위는 빛 */
    [[-4, -5, 'rgb(70,25,0)', fried ? 0.5 : 0.22], [3, 4, st.sauce && st.sa > 0.5 ? 'rgb(255,214,180)' : 'rgb(255,244,200)', st.sauce && st.sa > 0.5 ? 0.62 : fried ? 0.45 : 0.7]].forEach(function (q) {
      var e = mk(w, h), x = e.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = q[2]; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-out'; x.drawImage(cv, q[0] * ss, q[1] * ss); c.globalAlpha = q[3]; c.drawImage(e, 0, 0); c.globalAlpha = 1;
    });
    c.globalCompositeOperation = 'source-over';
  }
  var out = mk(w, h), o = out.getContext('2d');
  o.shadowColor = 'rgba(50,22,6,.42)'; o.shadowBlur = 5 * ss; o.shadowOffsetY = 3 * ss; o.drawImage(cv, 0, 0);
  return out;
}
/* ---------- 조리 도구 ---------- */
function steel(c, x, y, w, h, r, dark) {
  rr(c, x, y, w, h, r); c.fillStyle = lg(c, x, y, x + w * 0.3, y + h, dark ? [0, '#aab2b8', 0.5, '#868f96', 1, '#6c757c'] : [0, '#f4f7f9', 0.35, '#d5dbe0', 0.7, '#b9c1c8', 1, '#9da6ae']); c.fill();
}
function board(c, w, h) {
  c.save();
  c.fillStyle = 'rgba(30,20,10,.3)'; rr(c, 4, 8, w - 4, h - 6, 26); c.fill();
  rr(c, 0, 0, w - 4, h - 8, 24); c.fillStyle = '#8a5a2c'; c.fill();
  rr(c, 0, 0, w - 4, h - 16, 24); c.fillStyle = lg(c, 0, 0, w, h, [0, '#f0c98c', 0.5, '#e6b872', 1, '#d8a45c']); c.fill();
  c.clip();
  var R = rng(31), i;
  for (i = 0; i < 26; i++) { var y = R() * h, a = 0.05 + R() * 0.1; c.strokeStyle = 'rgba(150,96,40,' + a + ')'; c.lineWidth = 1 + R() * 3; c.beginPath(); c.moveTo(-10, y); c.bezierCurveTo(w * 0.3, y + (R() - 0.5) * 26, w * 0.7, y + (R() - 0.5) * 26, w + 10, y + (R() - 0.5) * 12); c.stroke(); }
  for (i = 0; i < 3; i++) { var kx = 60 + R() * (w - 120), ky = 40 + R() * (h - 100); c.strokeStyle = 'rgba(140,86,36,.2)'; c.lineWidth = 2; ell(c, kx, ky, 16 + R() * 10, 7 + R() * 4, R()); c.stroke(); ell(c, kx, ky, 7, 3, 0); c.stroke(); }
  /* 칼자국 */
  for (i = 0; i < 22; i++) { var x0 = 30 + R() * (w - 60), y0 = 30 + R() * (h - 70), an = R() * TAU, l = 20 + R() * 70; c.strokeStyle = 'rgba(120,72,30,.22)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(an) * l, y0 + Math.sin(an) * l); c.stroke(); c.strokeStyle = 'rgba(255,240,210,.25)'; c.beginPath(); c.moveTo(x0, y0 + 1.5); c.lineTo(x0 + Math.cos(an) * l, y0 + 1.5 + Math.sin(an) * l); c.stroke(); }
  c.fillStyle = lg(c, 0, 0, 0, 22, [0, 'rgba(255,255,255,.4)', 1, 'rgba(255,255,255,0)']); c.fillRect(0, 0, w, 22);
  c.restore();
  ell(c, 34, 30, 11, 11); c.fillStyle = '#7a5026'; c.fill(); ell(c, 34, 32, 9, 9); c.fillStyle = '#b9bfc4'; c.fill();
}
function bowlSwirl(c, r, ang) {
  var b = r - 15;
  c.save(); ell(c, 0, 2, b, b); c.clip(); c.rotate(ang || 0); c.lineCap = 'round';
  for (var i = 0; i < 3; i++) { c.strokeStyle = i % 2 ? 'rgba(255,252,236,.55)' : 'rgba(196,164,96,.35)'; c.lineWidth = 5 - i; c.beginPath(); for (var a = 0; a < 5.2; a += 0.3) { var q = 8 + a * (b - 14) / 5.2, x = Math.cos(a + i * 2.1) * q, y = Math.sin(a + i * 2.1) * q; if (a === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
  c.restore();
}
function bowl(c, r, ang, noSwirl) {
  c.fillStyle = 'rgba(20,24,28,.3)'; ell(c, 4, 10, r + 2, r); c.fill();
  ell(c, 0, 0, r, r); c.fillStyle = lg(c, -r, -r, r, r, [0, '#fbfdff', 0.3, '#cfd6dc', 0.6, '#9aa4ac', 1, '#dfe5ea']); c.fill(); c.strokeStyle = '#6f7880'; c.lineWidth = 2; c.stroke();
  ell(c, 0, 0, r - 9, r - 9); c.fillStyle = lg(c, -r, -r, r, r, [0, '#8a949c', 0.5, '#c4ccd2', 1, '#f2f5f7']); c.fill();
  /* 반죽 */
  var b = r - 15;
  ell(c, 0, 2, b, b); c.fillStyle = rg(c, 0, 0, b * 0.1, b * 1.05, [0, '#fbf0cc', 0.6, '#f2e0ac', 0.9, '#e2c98a', 1, '#cdb070'], -b * 0.3, -b * 0.35); c.fill();
  if (!noSwirl) bowlSwirl(c, r, ang);
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, r - 4, 3.5, 4.6); c.stroke();
}
function crate(c, w, h) {
  c.fillStyle = 'rgba(20,24,28,.3)'; rr(c, -w / 2 + 4, -h / 2 + 8, w, h, 14); c.fill();
  rr(c, -w / 2, -h / 2, w, h, 14); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, [0, '#ffffff', 1, '#d7e3ea']); c.fill(); c.strokeStyle = '#9fb2be'; c.lineWidth = 2; c.stroke();
  rr(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 8); c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, [0, '#a8cfe2', 1, '#d6ecf6']); c.fill();
  c.save(); rr(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 8); c.clip();
  var R = rng(9), i;
  for (i = 0; i < 26; i++) { var x = -w / 2 + R() * w, y = -h / 2 + R() * h, s = 10 + R() * 10; c.save(); c.translate(x, y); c.rotate(R() * 3); rr(c, -s / 2, -s / 2, s, s, 3); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill(); c.strokeStyle = 'rgba(120,170,200,.6)'; c.lineWidth = 1; c.stroke(); c.restore(); }
  var nc = w < 180 ? 1 : 2;
  for (i = 0; i < nc; i++) { c.save(); c.translate(nc === 1 ? 0 : -w * 0.21 + i * w * 0.42, 4); c.rotate(i ? 0.25 : -0.2); c.scale(nc === 1 ? 0.37 : 0.3, nc === 1 ? 0.37 : 0.3); c.translate(-170, -140); c.shadowColor = 'rgba(40,60,80,.4)'; c.shadowBlur = 14; c.shadowOffsetY = 8; rawChicken(c); c.restore(); }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.7)'; rr(c, -w / 2 + 6, -h / 2 + 4, w - 12, 5, 3); c.fill();
}
/* 튀김기 몸통. 기름은 따로 */
function fryer(c, w, h, wells) {
  c.fillStyle = 'rgba(20,24,28,.32)'; rr(c, 5, 9, w, h, 16); c.fill();
  steel(c, 0, 0, w, h, 16);
  c.strokeStyle = '#7d868e'; c.lineWidth = 2; rr(c, 0, 0, w, h, 16); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(18, 4); c.lineTo(w - 18, 4); c.stroke();
  wells.forEach(function (q) {
    rr(c, q.x - q.w / 2 - 8, q.y - q.h / 2 - 8, q.w + 16, q.h + 16, 14); c.fillStyle = lg(c, 0, q.y - q.h / 2, 0, q.y + q.h / 2, [0, '#737c84', 1, '#c9d0d6']); c.fill();
    rr(c, q.x - q.w / 2, q.y - q.h / 2, q.w, q.h, 8); c.fillStyle = q.on ? '#7a4a10' : '#3a4046'; c.fill();
    if (!q.on) { c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 5; for (var i = -q.h; i < q.w; i += 18) { c.beginPath(); c.moveTo(q.x - q.w / 2 + i, q.y + q.h / 2); c.lineTo(q.x - q.w / 2 + i + q.h, q.y - q.h / 2); c.stroke(); } c.restore(); }
  });
}
function oilShine(c, w, h, t) {
  c.lineCap = 'round'; c.lineWidth = 3;
  for (var i = 0; i < 7; i++) { var y = -h / 2 + 10 + ((i * 37 + t * (10 + i * 3)) % (h - 20)), x = -w / 2 + 30 + ((i * 53) % (w - 60)); c.strokeStyle = 'rgba(255,226,140,' + (0.2 + 0.1 * Math.sin(t * 2 + i)) + ')'; c.beginPath(); c.moveTo(x - 20, y); c.quadraticCurveTo(x, y + 6 * Math.sin(t * 3 + i), x + 20, y); c.stroke(); }
}
function oil(c, w, h, t, noShine) {
  c.save(); rr(c, -w / 2, -h / 2, w, h, 8); c.clip();
  c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, [0, '#c98412', 0.5, '#a9680a', 1, '#834a06']); c.fillRect(-w / 2, -h / 2, w, h);
  if (!noShine) oilShine(c, w, h, t);
  c.fillStyle = lg(c, 0, -h / 2, 0, -h / 2 + 22, [0, 'rgba(90,40,0,.45)', 1, 'rgba(90,40,0,0)']); c.fillRect(-w / 2, -h / 2, w, 22);
  c.restore();
}
function oilOver(c, w, h) { c.save(); rr(c, -w / 2, -h / 2, w, h, 8); c.clip(); c.fillStyle = 'rgba(190,110,10,.16)'; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
function wire(c, w, h, rim) {
  if (rim) { rr(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8); c.strokeStyle = '#59626a'; c.lineWidth = 5; c.stroke(); c.strokeStyle = '#e8edf0'; c.lineWidth = 2; c.stroke(); return; }
  c.save(); rr(c, -w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8); c.clip();
  c.strokeStyle = 'rgba(40,24,4,.38)'; c.lineWidth = 1.6; var i;
  for (i = -w / 2 + 12; i < w / 2; i += 15) { c.beginPath(); c.moveTo(i, -h / 2); c.lineTo(i, h / 2); c.stroke(); }
  for (i = -h / 2 + 12; i < h / 2; i += 15) { c.beginPath(); c.moveTo(-w / 2, i); c.lineTo(w / 2, i); c.stroke(); }
  c.strokeStyle = 'rgba(255,240,200,.18)'; c.lineWidth = 1;
  for (i = -w / 2 + 13; i < w / 2; i += 15) { c.beginPath(); c.moveTo(i, -h / 2); c.lineTo(i, h / 2); c.stroke(); }
  c.restore();
}
/* 익힘 막대: v 0~2.2 */
function doneBar(c, w, v, on) {
  var h = 16;
  rr(c, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 8); c.fillStyle = '#2a2e32'; c.fill();
  c.save(); rr(c, -w / 2, -h / 2, w, h, 6); c.clip();
  var z = [0, '#f3e4bc', 1 / 2.2, '#58c84a', 1.45 / 2.2, '#e8962a', 1.75 / 2.2, '#5a2c14', 1, '#1e120c'];
  for (var i = 0; i < z.length - 2; i += 2) { c.fillStyle = z[i + 1]; c.fillRect(-w / 2 + z[i] * w, -h / 2, (z[i + 2] - z[i]) * w + 1, h); }
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-w / 2, -h / 2, w, 5);
  c.restore();
  if (on) doneNeedle(c, w, v);
}
function doneNeedle(c, w, v) { var h = 16, x = -w / 2 + Math.max(0, Math.min(1, v / 2.2)) * w; c.fillStyle = '#fff'; c.strokeStyle = '#2a2e32'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, -h / 2 + 3); c.lineTo(x - 8, -h / 2 - 11); c.lineTo(x + 8, -h / 2 - 11); c.closePath(); c.fill(); c.stroke(); c.fillRect(x - 1.5, -h / 2, 3, h); }
/* 건지개(뜰채) */
function skimmer(c, r) {
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#3a2416'; c.lineWidth = 15; c.beginPath(); c.moveTo(r * 0.7, r * 0.7); c.lineTo(r * 1.9, r * 1.9); c.stroke();
  c.strokeStyle = '#8a5a34'; c.lineWidth = 10; c.beginPath(); c.moveTo(r * 0.75, r * 0.75); c.lineTo(r * 1.88, r * 1.88); c.stroke();
  ell(c, 0, 0, r, r); c.fillStyle = 'rgba(40,44,48,.16)'; c.fill();
  c.save(); ell(c, 0, 0, r, r); c.clip(); c.strokeStyle = 'rgba(70,78,86,.75)'; c.lineWidth = 1.6;
  for (var i = -r; i <= r; i += 11) { c.beginPath(); c.moveTo(i, -r); c.lineTo(i, r); c.stroke(); c.beginPath(); c.moveTo(-r, i); c.lineTo(r, i); c.stroke(); }
  c.restore();
  ell(c, 0, 0, r, r); c.strokeStyle = '#4c555c'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#eef2f5'; c.lineWidth = 2; c.stroke();
  c.restore();
}
/* 상자 */
function gingham(c, x, y, w, h, s) {
  c.fillStyle = '#fff8ee'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(224,48,36,.42)'; var i;
  for (i = x; i < x + w; i += s * 2) c.fillRect(i, y, s, h);
  for (i = y; i < y + h; i += s * 2) c.fillRect(x, i, w, s);
}
function kraft(c, x, y, w, h, r, dark) {
  rr(c, x, y, w, h, r); c.fillStyle = lg(c, x, y, x + w * 0.4, y + h, dark ? [0, '#b98850', 1, '#94683a'] : [0, '#dcb078', 0.5, '#cc9c60', 1, '#b8884e']); c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(110,70,30,.12)'; c.lineWidth = 2; for (var i = y + 5; i < y + h; i += 7) { c.beginPath(); c.moveTo(x, i); c.lineTo(x + w, i); c.stroke(); } c.restore();
}
function boxBase(c, w, h) {
  c.fillStyle = 'rgba(20,24,28,.32)'; rr(c, -w / 2 + 5, -h / 2 + 10, w, h, 12); c.fill();
  kraft(c, -w / 2, -h / 2, w, h, 12); c.strokeStyle = '#6e4a24'; c.lineWidth = 2.5; rr(c, -w / 2, -h / 2, w, h, 12); c.stroke();
  c.save(); rr(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 6); c.clip(); gingham(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 13);
  c.fillStyle = lg(c, 0, -h / 2 + 12, 0, -h / 2 + 40, [0, 'rgba(90,50,20,.4)', 1, 'rgba(90,50,20,0)']); c.fillRect(-w / 2, -h / 2 + 12, w, 30);
  c.fillStyle = lg(c, -w / 2 + 12, 0, -w / 2 + 34, 0, [0, 'rgba(90,50,20,.3)', 1, 'rgba(90,50,20,0)']); c.fillRect(-w / 2 + 12, -h / 2, 24, h);
  c.restore();
  rr(c, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 6); c.strokeStyle = 'rgba(110,70,30,.6)'; c.lineWidth = 2; c.stroke();
}
function sticker(c, r) {
  c.save(); c.rotate(-0.12);
  c.beginPath(); for (var i = 0; i < 20; i++) { var a = i / 20 * TAU, q = r * (i % 2 ? 0.92 : 1); c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath();
  c.fillStyle = '#e0281e'; c.fill(); c.strokeStyle = '#8c120c'; c.lineWidth = 2; c.stroke();
  ell(c, 0, 0, r * 0.78, r * 0.78); c.strokeStyle = '#ffd23a'; c.lineWidth = 2; c.stroke();
  c.translate(-r * 0.06, -r * 0.04); drum(c, r * 0.5, 'plain');
  c.restore();
}
/* k: 뚜껑이 닫힌 정도 0(뒤로 젖힘)~1(닫힘) */
function boxLid(c, w, h, k) {
  var lh = h * (0.6 + 0.4 * k), y0 = -h / 2 - (1 - k) * (h * 0.6 + 4);
  c.save(); c.translate(0, y0);
  if (k > 0.5) { c.fillStyle = 'rgba(20,24,28,.25)'; rr(c, -w / 2 + 3, 6, w, lh, 12); c.fill(); }
  kraft(c, -w / 2 - 2, 0, w + 4, lh, 12, k < 0.5); c.strokeStyle = '#6e4a24'; c.lineWidth = 2.5; rr(c, -w / 2 - 2, 0, w + 4, lh, 12); c.stroke();
  if (k >= 0.5) {
    var bh = 34 * (lh / h);
    c.fillStyle = '#e0281e'; c.fillRect(-w / 2, lh * 0.5 - bh / 2, w, bh);
    c.fillStyle = '#ffd23a'; c.fillRect(-w / 2, lh * 0.5 - bh / 2 - 5, w, 3); c.fillRect(-w / 2, lh * 0.5 + bh / 2 + 2, w, 3);
  } else {
    c.strokeStyle = 'rgba(80,46,18,.35)'; c.lineWidth = 2; c.setLineDash([7, 6]); rr(c, -w / 2 + 12, 10, w - 24, lh - 20, 6); c.stroke(); c.setLineDash([]);
  }
  c.fillStyle = 'rgba(80,46,18,.5)'; rr(c, -26, 8, 52, 9, 4); c.fill();
  c.restore();
}

/* ---------- 아이콘 ---------- */
function drum(c, r, kind) {
  var col = kind === 'yang' ? ['#f0502c', '#c4200e', '#8a1206'] : kind === 'soy' ? ['#a8642a', '#74380e', '#44200a'] : ['#f6c860', '#de9a34', '#a8641a'];
  c.save(); c.rotate(-0.6); c.lineJoin = 'round';
  // 뼈: 짧게 삐져나온 끝
  c.strokeStyle = '#8a6a48'; c.lineWidth = r * 0.24 + 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, r * 0.5); c.lineTo(0, r * 1.06); c.stroke();
  ell(c, -r * 0.12, r * 1.12, r * 0.16, r * 0.16); c.fillStyle = '#fff6e4'; c.fill(); c.strokeStyle = '#8a6a48'; c.lineWidth = 2; c.stroke();
  ell(c, r * 0.12, r * 1.12, r * 0.16, r * 0.16); c.fill(); c.stroke();
  c.strokeStyle = '#fff6e4'; c.lineWidth = r * 0.24; c.beginPath(); c.moveTo(0, r * 0.5); c.lineTo(0, r * 1.06); c.stroke();
  // 살: 위가 통통하고 뼈 쪽으로 좁아지는 닭다리, 튀김옷이 울퉁불퉁한 윤곽
  var P = [], k, r1 = r * 0.8, r2 = r * 0.34, y1 = -r * 0.38, y2 = r * 0.5, al = Math.asin((r1 - r2) / (y2 - y1)), n1 = 15, n2 = 5, th, bump;
  for (k = 0; k <= n1; k++) { th = Math.PI - al + (Math.PI + 2 * al) * k / n1; bump = 1 + (k % 2 ? 0.07 : -0.03) + 0.025 * Math.sin(k * 2.3); P.push([Math.cos(th) * r1 * bump, y1 + Math.sin(th) * r1 * bump]); }
  for (k = 1; k < n2; k++) { th = al + (Math.PI - 2 * al) * k / n2; bump = 1 + (k % 2 ? 0.08 : -0.02); P.push([Math.cos(th) * r2 * bump, y2 + Math.sin(th) * r2 * bump]); }
  var N = P.length;
  c.beginPath(); c.moveTo((P[N - 1][0] + P[0][0]) / 2, (P[N - 1][1] + P[0][1]) / 2);
  for (k = 0; k < N; k++) { var p0 = P[k], p1 = P[(k + 1) % N]; c.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); }
  c.closePath();
  c.fillStyle = rg(c, 0, -r * 0.3, r * 0.1, r * 1.15, [0, col[0], 0.6, col[1], 1, col[2]], -r * 0.3, -r * 0.6); c.fill(); c.strokeStyle = col[2]; c.lineWidth = 2.5; c.stroke();
  c.save(); c.clip(); var R = rng(4), i;
  for (i = 0; i < 15; i++) { var x = (R() - 0.5) * r * 1.5, y = -r * 1.1 + R() * r * 1.75, q = r * (0.08 + R() * 0.1); c.fillStyle = 'rgba(80,30,4,.25)'; ell(c, x + q * 0.3, y + q * 0.3, q, q * 0.8); c.fill(); c.fillStyle = kind === 'plain' ? 'rgba(255,230,160,.6)' : 'rgba(255,255,255,.3)'; ell(c, x, y, q * 0.8, q * 0.6); c.fill(); }
  if (kind === 'yang') for (i = 0; i < 9; i++) { c.fillStyle = '#fbeac0'; ell(c, (R() - 0.5) * r * 1.3, -r * 1.0 + R() * r * 1.3, r * 0.07, r * 0.04, R() * 3); c.fill(); }
  if (kind !== 'plain') { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = r * 0.1; c.lineCap = 'round'; c.beginPath(); c.arc(-r * 0.05, -r * 0.35, r * 0.55, 3.5, 4.5); c.stroke(); }
  c.restore(); c.restore();
}
function icon(c, id, r) {
  var i, R = rng(12);
  c.save(); c.lineJoin = 'round';
  if (id === 'plain' || id === 'yang' || id === 'soy') { c.translate(-r * 0.12, -r * 0.05); drum(c, r * 0.78, id); }
  else if (id === 'pa') {
    c.lineCap = 'round';
    for (i = 0; i < 16; i++) { var a = -2.6 + R() * 2.1, l = r * (0.6 + R() * 0.5), x = (R() - 0.5) * r * 0.7; c.strokeStyle = '#3e7a22'; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(x, r * 0.7); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5, r * 0.3, x + Math.cos(a) * l, r * 0.7 + Math.sin(a) * l * 1.3); c.stroke(); c.strokeStyle = i % 3 ? '#7cc644' : '#e4f4c0'; c.lineWidth = r * 0.09; c.stroke(); }
  } else if (id === 'cheese') {
    c.beginPath(); c.moveTo(-r * 0.9, r * 0.5); c.lineTo(r * 0.8, r * 0.62); c.lineTo(r * 0.9, -r * 0.1); c.lineTo(-r * 0.2, -r * 0.7); c.closePath(); c.fillStyle = lg(c, 0, -r, 0, r, [0, '#ffe470', 1, '#f2b020']); c.fill(); c.strokeStyle = '#a86a08'; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.moveTo(-r * 0.9, r * 0.5); c.lineTo(-r * 0.2, -r * 0.7); c.lineTo(r * 0.9, -r * 0.1); c.lineTo(-r * 0.05, r * 0.05); c.closePath(); c.fillStyle = '#fff0a0'; c.fill(); c.stroke();
    [[0.2, 0.3, 0.13], [-0.35, 0.36, 0.09], [0.55, 0.2, 0.08], [0.1, -0.3, 0.1]].forEach(function (h) { ell(c, h[0] * r, h[1] * r, h[2] * r, h[2] * r * 0.8); c.fillStyle = '#d89a10'; c.fill(); });
  } else if (id === 'mu') {
    rr(c, -r * 0.85, -r * 0.5, r * 1.7, r * 1.2, r * 0.22); c.fillStyle = 'rgba(214,236,244,.95)'; c.fill(); c.strokeStyle = '#7fa6b8'; c.lineWidth = 2.5; c.stroke();
    for (i = 0; i < 7; i++) { var mx = -r * 0.55 + (i % 4) * r * 0.36 + (i > 3 ? r * 0.18 : 0), my = i > 3 ? r * 0.28 : -r * 0.1; c.save(); c.translate(mx, my); c.rotate((R() - 0.5) * 0.7); rr(c, -r * 0.17, -r * 0.17, r * 0.34, r * 0.34, r * 0.05); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = '#b9c9d0'; c.lineWidth = 1.5; c.stroke(); c.restore(); }
    rr(c, -r * 0.92, -r * 0.66, r * 1.84, r * 0.24, r * 0.1); c.fillStyle = '#58c0a8'; c.fill(); c.strokeStyle = '#2c7a68'; c.lineWidth = 2; c.stroke();
  } else if (id === 'cola') {
    c.rotate(0.14);
    rr(c, -r * 0.48, -r * 0.92, r * 0.96, r * 1.84, r * 0.16); c.fillStyle = lg(c, -r * 0.5, 0, r * 0.5, 0, [0, '#f0463a', 0.3, '#ff7a6a', 0.55, '#d8261c', 1, '#8e120c']); c.fill(); c.strokeStyle = '#6a0c08'; c.lineWidth = 2.5; c.stroke();
    rr(c, -r * 0.42, -r * 0.98, r * 0.84, r * 0.2, r * 0.07); c.fillStyle = '#d5dbe0'; c.fill(); c.strokeStyle = '#6f7880'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = r * 0.13; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.3, r * 0.2); c.bezierCurveTo(-r * 0.1, -r * 0.25, r * 0.1, r * 0.4, r * 0.32, -r * 0.1); c.stroke();
  } else if (id === 'trash') {
    ell(c, 0, 0, r * 0.95, r * 0.95); c.fillStyle = lg(c, -r, -r, r, r, [0, '#8a949c', 1, '#4a5258']); c.fill(); c.strokeStyle = '#2a2e32'; c.lineWidth = 2.5; c.stroke();
    ell(c, 0, 0, r * 0.72, r * 0.72); c.fillStyle = rg(c, 0, 0, r * 0.1, r * 0.75, [0, '#0e1012', 1, '#2c3238']); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; for (i = 0; i < 7; i++) { var a2 = i / 7 * TAU; c.beginPath(); c.moveTo(Math.cos(a2) * r * 0.7, Math.sin(a2) * r * 0.7); c.lineTo(Math.cos(a2 + 0.5) * r * 0.2, Math.sin(a2 + 0.5) * r * 0.2); c.stroke(); }
  }
  c.restore();
}
/* 양념 솥·통(위에서 본 모습) */
function pot(c, id, r) {
  var i, R = rng(id.length * 7 + id.charCodeAt(0));
  if (id === 'yang' || id === 'soy') {
    var S = SAUCE[id];
    c.strokeStyle = '#3a4046'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r - 5, 0); c.lineTo(-r + 4, 0); c.moveTo(r - 4, 0); c.lineTo(r + 5, 0); c.stroke();
    ell(c, 0, 0, r, r); c.fillStyle = lg(c, -r, -r, r, r, [0, '#fbfdff', 0.4, '#b5bec5', 1, '#e6ebee']); c.fill(); c.strokeStyle = '#6f7880'; c.lineWidth = 2; c.stroke();
    ell(c, 0, 1, r - 8, r - 8); c.fillStyle = rg(c, 0, 0, r * 0.1, r, [0, S[0], 0.8, S[1]], -r * 0.3, -r * 0.3); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * 0.55, 3.6, 4.7); c.stroke();
    for (i = 0; i < 10; i++) { c.fillStyle = id === 'yang' ? '#fbeac0' : (i % 2 ? '#f4e2b0' : '#6aa83a'); ell(c, (R() - 0.5) * r * 1.2, (R() - 0.5) * r * 1.2, 2.6, 1.6, R() * 3); c.fill(); }
    /* 국자 */
    c.strokeStyle = '#4a5258'; c.lineWidth = 7; c.beginPath(); c.moveTo(r * 0.2, -r * 0.1); c.lineTo(r * 1.0, -r * 0.95); c.stroke(); c.strokeStyle = '#dfe5ea'; c.lineWidth = 3; c.stroke();
    ell(c, r * 0.12, 0, r * 0.3, r * 0.3); c.fillStyle = S[1]; c.fill(); c.strokeStyle = '#dfe5ea'; c.lineWidth = 3.5; c.stroke();
  } else {
    rr(c, -r, -r * 0.92, r * 2, r * 1.84, 10); c.fillStyle = lg(c, -r, -r, r, r, [0, '#fbfdff', 0.4, '#b5bec5', 1, '#e6ebee']); c.fill(); c.strokeStyle = '#6f7880'; c.lineWidth = 2; c.stroke();
    rr(c, -r + 7, -r * 0.92 + 7, r * 2 - 14, r * 1.84 - 14, 6); c.fillStyle = '#7d868e'; c.fill();
    c.save(); c.clip();
    if (id === 'pa') { c.fillStyle = '#4a6a34'; c.fillRect(-r, -r, r * 2, r * 2); c.lineCap = 'round'; for (i = 0; i < 46; i++) { var x = (R() - 0.5) * r * 1.9, y = (R() - 0.5) * r * 1.8, a = R() * TAU, l = 10 + R() * 16; c.strokeStyle = '#3e7a22'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.6, y + Math.sin(a + 0.6) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); c.strokeStyle = i % 3 ? '#86cc4a' : '#eaf6cc'; c.lineWidth = 2.6; c.stroke(); } }
    else if (id === 'cheese') { c.fillStyle = '#f6c030'; c.fillRect(-r, -r, r * 2, r * 2); for (i = 0; i < 60; i++) { c.fillStyle = i % 2 ? '#ffe680' : '#e09a10'; ell(c, (R() - 0.5) * r * 2, (R() - 0.5) * r * 2, 2 + R() * 3, 2 + R() * 2); c.fill(); } c.fillStyle = rg(c, -8, -8, 2, r, [0, 'rgba(255,250,200,.6)', 1, 'rgba(255,250,200,0)']); c.fillRect(-r, -r, r * 2, r * 2); }
    else if (id === 'mu') { c.fillStyle = '#cfe6ee'; c.fillRect(-r, -r, r * 2, r * 2); for (i = 0; i < 4; i++) { c.save(); c.translate(-r * 0.42 + (i % 2) * r * 0.84, -r * 0.4 + Math.floor(i / 2) * r * 0.8); c.scale(0.5, 0.5); icon(c, 'mu', r * 0.8); c.restore(); } }
    else if (id === 'cola') { c.fillStyle = '#bfe0ee'; c.fillRect(-r, -r, r * 2, r * 2); for (i = 0; i < 10; i++) { c.save(); c.translate((R() - 0.5) * r * 2, (R() - 0.5) * r * 2); c.rotate(R() * 3); rr(c, -6, -6, 12, 12, 3); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); c.restore(); } for (i = 0; i < 3; i++) { c.save(); c.translate(-r * 0.5 + i * r * 0.5, (i % 2 ? 1 : -1) * r * 0.1); c.rotate(-0.3 + i * 0.3); c.scale(0.52, 0.52); icon(c, 'cola', r * 0.85); c.restore(); } }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.6)'; rr(c, -r + 4, -r * 0.92 + 2, r * 2 - 8, 4, 2); c.fill();
  }
}
/* 식칼 */
function knife(c, r) {
  c.save(); c.rotate(-0.5); c.lineJoin = 'round';
  rr(c, -r * 0.16, r * 0.3, r * 0.32, r * 0.75, r * 0.1); c.fillStyle = lg(c, -r * 0.2, 0, r * 0.2, 0, [0, '#8a5a34', 1, '#4a2c16']); c.fill(); c.strokeStyle = '#2a160a'; c.lineWidth = 2; c.stroke();
  ell(c, 0, r * 0.5, r * 0.05, r * 0.05); c.fillStyle = '#d5dbe0'; c.fill(); ell(c, 0, r * 0.82, r * 0.05, r * 0.05); c.fill();
  c.beginPath(); c.moveTo(-r * 0.2, r * 0.32); c.lineTo(-r * 0.2, -r * 0.95); c.lineTo(r * 0.5, -r * 0.95); c.quadraticCurveTo(r * 0.62, -r * 0.2, r * 0.5, r * 0.32); c.closePath();
  c.fillStyle = lg(c, -r * 0.2, 0, r * 0.6, 0, [0, '#8e979e', 0.25, '#dfe5ea', 0.7, '#f8fafb', 1, '#ffffff']); c.fill(); c.strokeStyle = '#3a4046'; c.lineWidth = 2.5; c.stroke();
  c.strokeStyle = 'rgba(120,130,138,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(r * 0.36, -r * 0.9); c.quadraticCurveTo(r * 0.46, -r * 0.2, r * 0.36, r * 0.28); c.stroke();
  ell(c, 0, -r * 0.72, r * 0.07, r * 0.07); c.fillStyle = '#5a646c'; c.fill();
  c.restore();
}
function cleaver(c, r, frac, ready, t, noRing) {
  ell(c, 0, 3, r, r); c.fillStyle = 'rgba(20,10,4,.35)'; c.fill();
  ell(c, 0, 0, r, r); c.fillStyle = ready ? rg(c, 0, 0, 2, r, [0, '#fff2a8', 1, '#f2a81e']) : rg(c, 0, 0, 2, r, [0, '#6a737a', 1, '#3a4046']); c.fill();
  if (!ready && frac > 0) { c.save(); ell(c, 0, 0, r, r); c.clip(); c.fillStyle = '#f2a81e'; c.fillRect(-r, r - 2 * r * frac, 2 * r, 2 * r * frac); c.fillStyle = 'rgba(255,244,180,.7)'; c.fillRect(-r, r - 2 * r * frac, 2 * r, 3); c.restore(); }
  ell(c, 0, 0, r, r); c.strokeStyle = '#2a1a0c'; c.lineWidth = 4; c.stroke();
  if (ready && !noRing) { c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 8)) + ')'; c.lineWidth = 3; ell(c, 0, 0, r + 5 + 2 * Math.sin(t * 8), r + 5 + 2 * Math.sin(t * 8)); c.stroke(); }
  c.save(); c.translate(-r * 0.08, r * 0.04); knife(c, r * 0.72); c.restore();
}
function coin(c, r) {
  ell(c, 0, 3, r, r); c.fillStyle = '#a86a08'; c.fill();
  ell(c, 0, 0, r, r); c.fillStyle = lg(c, -r, -r, r, r, [0, '#fff2a0', 0.5, '#ffcf30', 1, '#e8a010']); c.fill(); c.strokeStyle = '#8a5600'; c.lineWidth = 2; c.stroke();
  ell(c, 0, 0, r * 0.7, r * 0.7); c.strokeStyle = 'rgba(138,86,0,.6)'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, r * 0.46, 3.5, 4.6); c.stroke();
}
function heart(c, r, on) {
  c.beginPath(); c.moveTo(0, r * 0.85); c.bezierCurveTo(-r * 1.5, -r * 0.2, -r * 0.7, -r * 1.2, 0, -r * 0.4); c.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.5, -r * 0.2, 0, r * 0.85); c.closePath();
  c.fillStyle = on ? lg(c, 0, -r, 0, r, [0, '#ff6a5a', 1, '#d8201a']) : 'rgba(74,36,18,.25)'; c.fill(); c.strokeStyle = on ? '#6a0c08' : 'rgba(74,36,18,.5)'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
  if (on) { c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(-r * 0.42, -r * 0.3, r * 0.3, 3.4, 4.6); c.stroke(); }
}
function star(c, x, y, r, fill, line) {
  c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.46 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath();
  c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = Math.max(2, r * 0.12); c.lineJoin = 'round'; c.stroke(); }
}
return { CW: CW, CH: CH, TAU: TAU, mk: mk, lg: lg, rg: rg, ell: ell, rr: rr, rng: rng, mix: mix, rawChicken: rawChicken, nugTex: nugTex, fryCol: fryCol, SAUCE: SAUCE,
  steel: steel, board: board, bowl: bowl, bowlSwirl: bowlSwirl, crate: crate, fryer: fryer, oil: oil, oilShine: oilShine, oilOver: oilOver, wire: wire, doneBar: doneBar, doneNeedle: doneNeedle, skimmer: skimmer, gingham: gingham, kraft: kraft,
  boxBase: boxBase, boxLid: boxLid, sticker: sticker, drum: drum, icon: icon, pot: pot, knife: knife, cleaver: cleaver, coin: coin, heart: heart, star: star };
})();
