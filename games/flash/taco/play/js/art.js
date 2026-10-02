/* 타코 만들기 — 그림(전부 코드). 빛은 왼쪽 위에서 온다. */
var ART;
(function () {
'use strict';
var TAU = Math.PI * 2;

function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function h2r(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function hx(v) { v = Math.round(v).toString(16); return v.length < 2 ? '0' + v : v; }
function mix(a, b, t) { var A = h2r(a), B = h2r(b); return '#' + hx(A[0] + (B[0] - A[0]) * t) + hx(A[1] + (B[1] - A[1]) * t) + hx(A[2] + (B[2] - A[2]) * t); }
function lit(c, a) { return a >= 0 ? mix(c, '#ffffff', a) : mix(c, '#000000', -a); }
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function rrp(c, x, y, w, h, r) { c.beginPath(); rr(c, x, y, w, h, r); }
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
function mk(w, h) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
function lg(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
function rg(c, x, y, r0, r1, stops) { var g = c.createRadialGradient(x, y, r0, x, y, r1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }

/* ================= 재료 ================= */
var ING = {
  beef: { kind: 'bin', c: '#7a3d1e', n: 8, s: 15 },
  chicken: { kind: 'bin', c: '#f0c98a', n: 6, s: 15 },
  shrimp: { kind: 'bin', c: '#ff8f6b', n: 5, s: 17 },
  lettuce: { kind: 'bin', c: '#8fd14f', n: 9, s: 16 },
  cheese: { kind: 'bin', c: '#ffc233', n: 14, s: 14 },
  tomato: { kind: 'bin', c: '#e8382c', n: 8, s: 13 },
  onion: { kind: 'bin', c: '#c94f9a', n: 9, s: 14 },
  cilantro: { kind: 'bin', c: '#2f8f3a', n: 8, s: 12 },
  avocado: { kind: 'bin', c: '#a9cf52', n: 7, s: 14 },
  corn: { kind: 'bin', c: '#ffd83a', n: 12, s: 11 },
  jalapeno: { kind: 'bin', c: '#4c9a2a', n: 6, s: 14 },
  lime: { kind: 'bin', c: '#9bd53a', n: 2, s: 15 },
  roja: { kind: 'sauce', c: '#d9281e' },
  verde: { kind: 'sauce', c: '#6fae2c' },
  crema: { kind: 'sauce', c: '#fff4e0' }
};
var BINS = ['beef', 'lettuce', 'cheese', 'tomato', 'onion', 'chicken', 'avocado', 'cilantro', 'corn', 'shrimp', 'jalapeno', 'lime'];
var SAUCES = ['roja', 'verde', 'crema'];

/* 조각 하나. 원점에 그린다. s = 크기, v = 0~1 모양 변주 */
function piece(c, id, s, v) {
  var i, a;
  switch (id) {
    case 'beef':
      c.beginPath();
      for (i = 0; i < 7; i++) { a = i / 7 * TAU; var q = s * (0.72 + 0.34 * Math.abs(Math.sin(i * 2.7 + v * 9))); if (i) c.lineTo(Math.cos(a) * q, Math.sin(a) * q * 0.8); else c.moveTo(q, 0); }
      c.closePath();
      c.fillStyle = lg(c, -s, -s, s, s, [0, mix('#a2582c', '#8a4420', v), 1, '#55260f']); c.fill();
      c.strokeStyle = '#3e1a09'; c.lineWidth = s * 0.12; c.stroke();
      c.strokeStyle = 'rgba(40,14,4,.55)'; c.lineWidth = s * 0.14; c.beginPath(); c.moveTo(-s * 0.4, s * 0.1); c.lineTo(s * 0.35, -s * 0.05 + v * s * 0.2); c.stroke();
      c.fillStyle = 'rgba(255,214,170,.5)'; ell(c, -s * 0.3, -s * 0.32, s * 0.26, s * 0.12, -0.5); c.fill();
      break;
    case 'chicken':
      rrp(c, -s * 1.15, -s * 0.48, s * 2.3, s * 0.96, s * 0.4);
      c.fillStyle = lg(c, 0, -s * 0.5, 0, s * 0.5, [0, '#fbe3b3', 0.6, '#eebf78', 1, '#c98a40']); c.fill();
      c.strokeStyle = '#a8682a'; c.lineWidth = s * 0.1; c.stroke();
      c.strokeStyle = '#8a4c1a'; c.lineWidth = s * 0.16; c.lineCap = 'round';
      for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.6 - s * 0.12, -s * 0.26); c.lineTo(i * s * 0.6 + s * 0.12, s * 0.26); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, -s * 0.5, -s * 0.28, s * 0.4, s * 0.08, 0); c.fill();
      break;
    case 'shrimp':
      c.lineCap = 'round';
      c.strokeStyle = '#c9482a'; c.lineWidth = s * 0.82; c.beginPath(); c.arc(0, 0, s * 0.72, 0.5, Math.PI * 1.55); c.stroke();
      c.strokeStyle = '#ff9a70'; c.lineWidth = s * 0.62; c.beginPath(); c.arc(0, 0, s * 0.72, 0.5, Math.PI * 1.55); c.stroke();
      c.strokeStyle = '#ffd0b8'; c.lineWidth = s * 0.14;
      for (i = 0; i < 5; i++) { a = 0.7 + i * 0.8; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.45); c.lineTo(Math.cos(a) * s * 0.98, Math.sin(a) * s * 0.98); c.stroke(); }
      c.fillStyle = '#ff5e3a'; c.beginPath(); a = 0.5; c.moveTo(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72); c.lineTo(s * 1.25, s * 0.95); c.lineTo(s * 0.55, s * 1.2); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, -s * 0.5, -s * 0.5, s * 0.22, s * 0.1, -0.8); c.fill();
      break;
    case 'lettuce':
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-s * 1.2, 0); c.bezierCurveTo(-s * 0.6, -s * (0.7 + v * 0.4), -s * 0.1, s * 0.7, s * 0.4, -s * 0.1); c.bezierCurveTo(s * 0.7, -s * 0.55, s * 1.0, s * 0.3, s * 1.25, -s * 0.1);
      c.strokeStyle = '#3f8f24'; c.lineWidth = s * 0.62; c.stroke();
      c.strokeStyle = mix('#8fdc52', '#b9ec7a', v); c.lineWidth = s * 0.44; c.stroke();
      c.strokeStyle = 'rgba(240,255,200,.7)'; c.lineWidth = s * 0.1; c.stroke();
      break;
    case 'cheese':
      c.lineCap = 'round';
      c.strokeStyle = '#d98a00'; c.lineWidth = s * 0.42; c.beginPath(); c.moveTo(-s * 1.1, 0); c.quadraticCurveTo(0, s * (v - 0.5) * 0.9, s * 1.1, 0); c.stroke();
      c.strokeStyle = mix('#ffb81f', '#ffe066', v); c.lineWidth = s * 0.28; c.stroke();
      c.strokeStyle = 'rgba(255,250,210,.8)'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(-s * 0.8, -s * 0.07); c.lineTo(-s * 0.1, -s * 0.07 + s * (v - 0.5) * 0.3); c.stroke();
      break;
    case 'tomato':
      rrp(c, -s * 0.62, -s * 0.62, s * 1.24, s * 1.24, s * 0.26);
      c.fillStyle = lg(c, -s, -s, s, s, [0, '#ff6a4e', 0.5, '#e8382c', 1, '#a81a14']); c.fill();
      c.strokeStyle = '#8a140f'; c.lineWidth = s * 0.1; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -s * 0.25, -s * 0.3, s * 0.24, s * 0.1, -0.6); c.fill();
      c.fillStyle = '#ffd98a'; ell(c, s * 0.18, s * 0.2, s * 0.09, s * 0.14, v * 3); c.fill();
      break;
    case 'onion':
      c.lineCap = 'round';
      c.strokeStyle = '#8f2a72'; c.lineWidth = s * 0.5; c.beginPath(); c.arc(0, s * 0.5, s * 0.9, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.strokeStyle = '#f7e1f1'; c.lineWidth = s * 0.3; c.beginPath(); c.arc(0, s * 0.56, s * 0.9, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      c.strokeStyle = '#d07ab8'; c.lineWidth = s * 0.1; c.beginPath(); c.arc(0, s * 0.42, s * 0.9, Math.PI * 1.17, Math.PI * 1.83); c.stroke();
      break;
    case 'cilantro':
      c.strokeStyle = '#2c7a2a'; c.lineWidth = s * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, s * 0.9); c.lineTo(0, 0); c.stroke();
      for (i = 0; i < 3; i++) {
        a = -Math.PI / 2 + (i - 1) * 0.95; var px = Math.cos(a) * s * 0.5, py = Math.sin(a) * s * 0.5;
        c.fillStyle = i === 1 ? '#3fae3c' : '#2f9434'; ell(c, px, py, s * 0.44, s * 0.36, a); c.fill();
        c.strokeStyle = '#1d6a22'; c.lineWidth = s * 0.08; c.stroke();
      }
      c.fillStyle = 'rgba(200,255,170,.55)'; ell(c, -s * 0.12, -s * 0.6, s * 0.14, s * 0.08, -0.5); c.fill();
      break;
    case 'avocado':
      rrp(c, -s * 0.62, -s * 0.58, s * 1.24, s * 1.16, s * 0.3);
      c.fillStyle = rg(c, -s * 0.1, -s * 0.1, s * 0.1, s * 0.95, [0, '#f1f2a0', 0.6, '#c2dc62', 1, '#6f9a2a']); c.fill();
      c.strokeStyle = '#4d7a1c'; c.lineWidth = s * 0.11; c.stroke();
      c.fillStyle = 'rgba(255,255,230,.6)'; ell(c, -s * 0.22, -s * 0.26, s * 0.2, s * 0.09, -0.6); c.fill();
      break;
    case 'corn':
      rrp(c, -s * 0.5, -s * 0.6, s, s * 1.2, s * 0.42);
      c.fillStyle = lg(c, -s * 0.5, -s * 0.6, s * 0.5, s * 0.6, [0, '#fff08a', 0.5, '#ffd22e', 1, '#e09a10']); c.fill();
      c.strokeStyle = '#b87400'; c.lineWidth = s * 0.11; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, -s * 0.14, -s * 0.24, s * 0.14, s * 0.1, -0.5); c.fill();
      break;
    case 'jalapeno':
      ell(c, 0, 0, s * 0.82, s * 0.74, 0); c.fillStyle = '#4f9a2c'; c.fill(); c.strokeStyle = '#2a6414'; c.lineWidth = s * 0.12; c.stroke();
      ell(c, 0, 0, s * 0.54, s * 0.46, 0); c.fillStyle = '#d4eaa2'; c.fill();
      c.fillStyle = '#fff6cf'; for (i = 0; i < 3; i++) { a = i / 3 * TAU + v * 3; ell(c, Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.22, s * 0.11, s * 0.08, a); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, -s * 0.38, -s * 0.44, s * 0.2, s * 0.08, -0.6); c.fill();
      break;
    case 'lime':
      c.beginPath(); c.arc(0, -s * 0.3, s * 1.45, 0.08, Math.PI - 0.08); c.closePath();
      c.fillStyle = lg(c, 0, -s * 0.3, 0, s * 1.2, [0, '#f2fbbc', 1, '#c9ea6a']); c.fill();
      c.strokeStyle = '#eefad0'; c.lineWidth = s * 0.1; for (i = 1; i < 5; i++) { a = i / 5 * Math.PI; c.beginPath(); c.moveTo(0, -s * 0.3); c.lineTo(Math.cos(a) * s * 1.3, -s * 0.3 + Math.sin(a) * s * 1.3); c.stroke(); }
      c.strokeStyle = '#4c9a1e'; c.lineWidth = s * 0.3; c.lineCap = 'round'; c.beginPath(); c.arc(0, -s * 0.3, s * 1.45, 0.08, Math.PI - 0.08); c.stroke();
      c.strokeStyle = '#8fd13c'; c.lineWidth = s * 0.12; c.beginPath(); c.arc(0, -s * 0.3, s * 1.5, 0.3, Math.PI - 0.3); c.stroke();
      break;
  }
}

/* 소스 병. 바닥 가운데가 원점 */
function bottle(c, id, h) {
  var w = h * 0.4, col = ING[id].c, dark = id === 'crema' ? '#cdb994' : lit(col, -0.4);
  c.fillStyle = 'rgba(40,20,5,.25)'; ell(c, w * 0.12, 0, w * 0.62, h * 0.05, 0); c.fill();
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-w * 0.1, -h * 0.84); c.lineTo(-w * 0.05, -h); c.lineTo(w * 0.05, -h); c.lineTo(w * 0.1, -h * 0.84); c.closePath();
  c.fillStyle = id === 'crema' ? '#4aa3c8' : '#fff3d8'; c.fill(); c.strokeStyle = '#4a2412'; c.lineWidth = h * 0.02; c.stroke();
  c.beginPath(); c.moveTo(-w * 0.34, -h * 0.7); c.lineTo(-w * 0.12, -h * 0.86); c.lineTo(w * 0.12, -h * 0.86); c.lineTo(w * 0.34, -h * 0.7); c.closePath();
  c.fillStyle = id === 'crema' ? '#5fbbe0' : '#ffe9bf'; c.fill(); c.stroke();
  rrp(c, -w / 2, -h * 0.72, w, h * 0.72, w * 0.22);
  c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, [0, lit(col, 0.28), 0.35, col, 1, dark]); c.fill();
  c.strokeStyle = '#4a2412'; c.lineWidth = h * 0.025; c.stroke();
  rrp(c, -w * 0.4, -h * 0.5, w * 0.8, h * 0.3, w * 0.1); c.fillStyle = '#fff6df'; c.fill(); c.strokeStyle = 'rgba(74,36,18,.5)'; c.lineWidth = h * 0.012; c.stroke();
  c.save(); c.translate(0, -h * 0.35);
  if (id === 'roja') { c.rotate(-0.5); c.fillStyle = '#d9281e'; c.beginPath(); c.moveTo(-w * 0.26, 0); c.quadraticCurveTo(0, -w * 0.2, w * 0.28, -w * 0.02); c.quadraticCurveTo(0, w * 0.16, -w * 0.26, 0); c.fill(); c.strokeStyle = '#2f8f3a'; c.lineWidth = h * 0.025; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w * 0.26, 0); c.lineTo(-w * 0.36, -w * 0.08); c.stroke(); }
  else if (id === 'verde') { c.fillStyle = '#5fae32'; ell(c, 0, 0, w * 0.2, w * 0.2, 0); c.fill(); c.fillStyle = '#d4eaa2'; ell(c, 0, 0, w * 0.11, w * 0.11, 0); c.fill(); }
  else { c.fillStyle = '#5fbbe0'; c.beginPath(); c.moveTo(0, -w * 0.22); c.bezierCurveTo(w * 0.26, w * 0.02, w * 0.14, w * 0.22, 0, w * 0.22); c.bezierCurveTo(-w * 0.14, w * 0.22, -w * 0.26, w * 0.02, 0, -w * 0.22); c.fill(); }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.5)'; rrp(c, -w * 0.38, -h * 0.68, w * 0.13, h * 0.6, w * 0.06); c.fill();
}

/* 주문 풍선에 쓰는 재료 아이콘 (가운데 원점, 반지름 q 안) */
function icon(c, id, q) {
  var I = ING[id];
  if (I.kind === 'sauce') { c.save(); c.translate(0, q * 0.92); bottle(c, id, q * 1.9); c.restore(); return; }
  var R = rng(id.length * 77 + id.charCodeAt(0) * 13 + id.charCodeAt(1)), n = id === 'lime' ? 1 : id === 'cheese' ? 9 : id === 'shrimp' ? 3 : 6, s = q * (id === 'lime' ? 0.62 : id === 'shrimp' ? 0.46 : id === 'cheese' ? 0.5 : id === 'corn' ? 0.36 : 0.42);
  c.fillStyle = 'rgba(60,30,10,.2)'; ell(c, q * 0.06, q * 0.5, q * 0.8, q * 0.26, 0); c.fill();
  for (var i = 0; i < n; i++) {
    var a = i / n * TAU + R() * 0.8, d = n === 1 ? 0 : (i === 0 ? 0 : q * (0.34 + R() * 0.2));
    c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * 0.8 + (n === 1 ? -q * 0.25 : 0)); c.rotate(id === 'lime' ? 0.25 : R() * TAU); piece(c, id, s, R()); c.restore();
  }
}

/* 재료 통 한 칸 (w x h). empty = 빈 통 */
function bin(c, id, w, h, empty) {
  c.fillStyle = 'rgba(50,25,8,.28)'; rrp(c, 5, 8, w - 6, h - 6, 16); c.fill();
  rrp(c, 2, 2, w - 6, h - 8, 16); c.fillStyle = lg(c, 0, 0, 0, h, [0, '#fbfdff', 0.5, '#c9d2da', 1, '#8b96a1']); c.fill(); c.strokeStyle = '#4c5661'; c.lineWidth = 2.5; c.stroke();
  rrp(c, 11, 10, w - 24, h - 25, 10); c.fillStyle = lg(c, 0, 10, 0, h, [0, '#39424b', 0.3, '#6c7781', 1, '#8c97a1']); c.fill(); c.strokeStyle = 'rgba(40,48,56,.7)'; c.lineWidth = 2; c.stroke();
  if (!empty) {
    var I = ING[id], R = rng(id.charCodeAt(0) * 31 + id.charCodeAt(2) * 7 + 5), n = id === 'lime' ? 7 : id === 'cheese' ? 60 : id === 'shrimp' ? 16 : 40, s = I.s * (id === 'lime' ? 1.05 : 1.12);
    c.save(); rrp(c, 12, 4, w - 26, h - 20, 10); c.clip();
    c.fillStyle = lit(I.c, -0.45); rrp(c, 14, 30, w - 30, h - 46, 10); c.fill();
    var P = [];
    for (var i = 0; i < n; i++) { var u = R(), v = R(); P.push([24 + u * (w - 52), 26 + v * (h - 52) - Math.sin(u * Math.PI) * 10, R() * TAU, R()]); }
    P.sort(function (a, b) { return a[1] - b[1]; });
    for (i = 0; i < n; i++) { c.save(); c.translate(P[i][0], P[i][1]); c.rotate(id === 'lime' ? (P[i][3] - 0.5) * 1.6 : P[i][2]); piece(c, id, s, P[i][3]); c.restore(); }
    c.restore();
  }
  if (empty) {
    rrp(c, 9, 8, w - 20, h - 22, 12); c.fillStyle = lg(c, 0, 8, 0, h - 14, [0, '#f4f7fa', 0.45, '#cfd7de', 1, '#98a3ad']); c.fill(); c.strokeStyle = '#5a646e'; c.lineWidth = 2; c.stroke();
    rrp(c, 17, 16, w - 36, h - 38, 8); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = 'rgba(40,50,60,.3)'; rrp(c, w / 2 - 30, h / 2 - 8, 60, 16, 8); c.fill();
    rrp(c, w / 2 - 30, h / 2 - 13, 60, 16, 8); c.fillStyle = lg(c, 0, h / 2 - 13, 0, h / 2 + 3, [0, '#6a7682', 1, '#3a444e']); c.fill(); c.strokeStyle = '#2a323a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; rrp(c, w / 2 - 24, h / 2 - 11, 48, 4, 2); c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(18, 5.5); c.lineTo(w - 22, 5.5); c.stroke();
}

/* ================= 또띠아·타코 ================= */
/* done: 0 날것 ~ 0.5 ~ 1 노릇 ~ 1.3 탐 */
function tortillaCol(done) {
  if (done < 0.5) return mix('#f6e9c6', '#f2d998', done * 2);
  if (done < 1.0) return mix('#f2d998', '#e9bf6c', (done - 0.5) * 2);
  if (done < 1.3) return mix('#e9bf6c', '#a8682c', (done - 1) / 0.3);
  return mix('#a8682c', '#3a2414', Math.min(1, (done - 1.3) / 0.25));
}
function tortilla(c, q, done, seed, squash) {
  var R = rng(seed || 7), i, a, col = tortillaCol(done), sy = squash || 0.86;
  c.save(); c.scale(1, sy);
  c.fillStyle = 'rgba(60,30,8,.25)'; ell(c, q * 0.05, q * 0.09, q, q, 0); c.fill();
  c.beginPath();
  for (i = 0; i <= 72; i++) { a = i / 72 * TAU; var rad = q * (1 + 0.007 * Math.sin(a * 5 + (seed || 1)) + 0.005 * Math.sin(a * 9 + 1)); if (i) c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.moveTo(rad, 0); }
  c.closePath();
  c.fillStyle = rg(c, -q * 0.25, -q * 0.3, q * 0.1, q * 1.15, [0, lit(col, 0.14), 0.75, col, 1, lit(col, -0.1)]); c.fill();
  c.strokeStyle = lit(col, -0.38); c.lineWidth = Math.max(1.5, q * 0.03); c.stroke();
  c.save(); c.clip();
  var spots = done < 0.35 ? 0 : Math.round(5 + Math.min(1.4, done) * 16), sc = done > 1.3 ? '#1c0f08' : done > 1 ? '#6a3a14' : '#b9853c';
  c.fillStyle = sc; c.globalAlpha = Math.max(0, Math.min(0.75, 0.2 + (done - 0.35) * 0.7));
  for (i = 0; i < spots; i++) { a = R() * TAU; var d = Math.sqrt(R()) * q * 0.86; ell(c, Math.cos(a) * d, Math.sin(a) * d, q * (0.04 + R() * 0.07), q * (0.03 + R() * 0.05), R() * 3); c.fill(); }
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = q * 0.03; c.beginPath(); c.arc(0, 0, q * 0.9, Math.PI * 1.05, Math.PI * 1.5); c.stroke();
  c.restore(); c.restore();
}
/* 한 국자 재료가 또띠아 위에 놓일 자리들(반지름 1 기준) */
function scoopSpots(id, k, seed) {
  var I = ING[id], R = rng(seed * 131 + k * 17 + id.charCodeAt(0)), out = [], n = I.n;
  for (var i = 0; i < n; i++) { var a = R() * TAU, d = Math.sqrt(R()) * 0.66; out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.86, rot: id === 'lime' ? (R() - 0.5) * 1.2 : R() * TAU, v: R() }); }
  return out;
}
function sauceLine(c, id, q, k, prog, sy) {
  var col = ING[id].c, n = 9, i, pts = [];
  for (i = 0; i <= n; i++) { var t = i / n; pts.push([(-0.62 + t * 1.24) * q, ((i % 2 ? 1 : -1) * 0.25 * (1 - Math.abs(t - 0.5) * 0.9) + (k % 2 ? 0.12 : -0.12)) * q * sy]); }
  var m = Math.max(1, Math.floor(prog * n));
  function path() { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var j = 1; j <= m; j++) c.lineTo(pts[j][0], pts[j][1]); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.strokeStyle = id === 'crema' ? '#c9b48c' : lit(col, -0.35); c.lineWidth = q * 0.078; c.stroke();
  path(); c.strokeStyle = col; c.lineWidth = q * 0.052; c.stroke();
  path(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = q * 0.014; c.stroke();
}

/* 접은 타코(옆모습). items: {id:count}, 가운데 원점, 반지름 q */
var FILL_ORDER = ['lettuce', 'beef', 'chicken', 'shrimp', 'tomato', 'onion', 'avocado', 'corn', 'jalapeno', 'cheese', 'cilantro', 'lime'];
function shell(c, q, dy) { c.beginPath(); c.moveTo(-q, dy); c.bezierCurveTo(-q * 0.98, dy + q * 0.62, -q * 0.52, dy + q * 0.9, 0, dy + q * 0.9); c.bezierCurveTo(q * 0.52, dy + q * 0.9, q * 0.98, dy + q * 0.62, q, dy); c.quadraticCurveTo(0, dy + q * 0.05, -q, dy); c.closePath(); }
function taco(c, q, done, items, seed) {
  var col = tortillaCol(done), R = rng(seed || 3), i, first = null;
  c.save(); c.rotate(-0.16); c.translate(0, -q * 0.3); c.lineJoin = 'round';
  c.fillStyle = 'rgba(50,25,8,.25)'; ell(c, q * 0.04, q * 0.9, q * 0.8, q * 0.11, 0); c.fill();
  shell(c, q, -q * 0.13); c.fillStyle = lit(col, -0.22); c.fill(); c.strokeStyle = lit(col, -0.42); c.lineWidth = q * 0.04; c.stroke();
  var list = [];
  FILL_ORDER.forEach(function (id) { if (items && items[id]) { if (!first) first = id; for (var k = 0; k < Math.min(3, items[id]) * 5; k++) list.push(id); } });
  if (first) {
    var mc = lit(ING[first].c, -0.18);
    for (i = 0; i < 11; i++) { var bx = (-0.82 + i * 0.164) * q; ell(c, bx, -q * 0.1 - Math.sin(i / 10 * Math.PI) * q * 0.12, q * 0.19, q * 0.19, 0); c.fillStyle = mc; c.fill(); c.strokeStyle = lit(ING[first].c, -0.5); c.lineWidth = q * 0.025; c.stroke(); }
    c.fillStyle = mc; c.fillRect(-q * 0.85, -q * 0.12, q * 1.7, q * 0.3);
  }
  for (i = 0; i < list.length; i++) {
    var id = list[i], x = (R() * 1.64 - 0.82) * q, lift = (0.04 + R() * 0.26) * q * (1 - Math.pow(Math.abs(x) / q, 2) * 0.7);
    c.save(); c.translate(x, -q * 0.12 - lift); c.rotate(id === 'lime' ? 0 : R() * TAU); piece(c, id, q * (id === 'lettuce' ? 0.2 : id === 'lime' ? 0.17 : id === 'corn' ? 0.12 : 0.15), R()); c.restore();
  }
  SAUCES.forEach(function (id) {
    if (!items || !items[id]) return;
    c.strokeStyle = ING[id].c; c.lineWidth = q * 0.065; c.lineCap = 'round'; c.beginPath();
    for (var k = 0; k <= 8; k++) { var x = (-0.76 + k * 0.19) * q, y = -q * (0.2 + (k % 2 ? 0.14 : 0.0)) - Math.sin(k / 8 * Math.PI) * q * 0.1; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
  });
  shell(c, q, 0);
  c.fillStyle = rg(c, -q * 0.3, q * 0.2, q * 0.1, q * 1.2, [0, lit(col, 0.2), 0.7, col, 1, lit(col, -0.18)]); c.fill();
  c.strokeStyle = lit(col, -0.42); c.lineWidth = q * 0.045; c.stroke();
  c.save(); c.clip();
  c.fillStyle = done > 1.3 ? '#1c0f08' : done > 1 ? '#6a3a14' : '#b9853c'; c.globalAlpha = 0.5;
  for (i = 0; i < 12; i++) { var a = R() * Math.PI, d = Math.sqrt(R()) * q * 0.8; ell(c, Math.cos(a) * d, q * 0.12 + Math.sin(a) * d * 0.8, q * (0.04 + R() * 0.05), q * 0.035, R() * 3); c.fill(); }
  c.globalAlpha = 1; c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = q * 0.04; c.lineCap = 'round'; c.beginPath(); c.arc(0, q * 0.1, q * 0.72, Math.PI * 0.66, Math.PI * 0.92); c.stroke();
  c.restore(); c.restore();
}
/* ================= 손님 ================= */
var SPECIES = {
  cat: { fur: '#f2a04a', fur2: '#fff1d6', ear: 'point', earIn: '#ffb7b0', nose: '#e8707a', shirt: '#2aa6a0', whisk: 1, stripe: '#c9731f' },
  dog: { fur: '#e2b47a', fur2: '#fff2dc', ear: 'bigpoint', earIn: '#f3c6b0', nose: '#3a2418', shirt: '#e2513a' },
  rabbit: { fur: '#fbf7f0', fur2: '#ffffff', ear: 'long', earIn: '#ffc2cc', nose: '#f08a9a', shirt: '#f2b01e', teeth: 1 },
  bear: { fur: '#9a6236', fur2: '#e9c79a', ear: 'round', earIn: '#6e4222', nose: '#2a1810', shirt: '#3f7fd0' },
  fox: { fur: '#f07a28', fur2: '#fff6e8', ear: 'bigpoint', earIn: '#3a2418', nose: '#2a1810', shirt: '#7a4fc0', cheek: 1, tips: 1 },
  pig: { fur: '#ffb3bd', fur2: '#ff9aa8', ear: 'flop', earIn: '#f58a9a', nose: '#e86a80', shirt: '#4aa84a', snout: 1 },
  frog: { fur: '#6cc04a', fur2: '#d9f0a0', ear: 'none', nose: '#3a7a22', shirt: '#e2513a', frog: 1 },
  parrot: { fur: '#e23a36', fur2: '#fff6e8', ear: 'none', nose: '#f2a81e', shirt: '#2aa6a0', beak: 1 },
  donkey: { fur: '#9a938c', fur2: '#f1e8d8', ear: 'long', earIn: '#d9b9a8', nose: '#4a3a34', shirt: '#d9477a', muzzle: 1 },
  llama: { fur: '#f6e7c8', fur2: '#fffaf0', ear: 'banana', earIn: '#e9b9a8', nose: '#7a5a4a', shirt: '#e88a1e', fluff: 1 },
  raccoon: { fur: '#9aa0a8', fur2: '#ffffff', ear: 'round', earIn: '#3a3f48', nose: '#22201e', shirt: '#f2b01e', mask: 1 },
  mouse: { fur: '#b9b3c4', fur2: '#f6f0f6', ear: 'biground', earIn: '#ffc2cc', nose: '#f08a9a', shirt: '#3f7fd0', teeth: 1, whisk: 1 }
};
var SPLIST = ['cat', 'dog', 'rabbit', 'bear', 'pig', 'fox', 'frog', 'mouse', 'parrot', 'raccoon', 'donkey', 'llama'];

function sombrero(c) {
  var by = -62;
  ell(c, 0, by + 6, 122, 30, 0); c.fillStyle = '#b98a2e'; c.fill();
  ell(c, 0, by, 122, 28, 0); c.fillStyle = lg(c, -120, 0, 120, 0, [0, '#fff0b0', 0.4, '#f0cf6a', 1, '#c99a3a']); c.fill(); c.strokeStyle = '#7a5216'; c.lineWidth = 3; c.stroke();
  c.beginPath(); c.moveTo(-52, by - 2); c.bezierCurveTo(-48, by - 60, -30, by - 86, 0, by - 88); c.bezierCurveTo(30, by - 86, 48, by - 60, 52, by - 2); c.bezierCurveTo(20, by + 10, -20, by + 10, -52, by - 2); c.closePath();
  c.fillStyle = lg(c, -52, 0, 52, 0, [0, '#fff3be', 0.45, '#f2d476', 1, '#c79a3c']); c.fill(); c.stroke();
  c.save(); c.clip(); c.fillStyle = '#d9281e'; c.fillRect(-60, by - 26, 120, 13); c.fillStyle = '#2f9a4a'; c.fillRect(-60, by - 13, 120, 7); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-40, by - 80, 14, 70); c.restore();
  var cols = ['#d9281e', '#2aa6a0', '#f2b01e', '#d9477a'];
  for (var i = 0; i < 9; i++) { var a = Math.PI * (0.12 + i * 0.095); c.fillStyle = cols[i % 4]; ell(c, Math.cos(a) * 112, by + 4 + Math.sin(a) * 25, 6, 6, 0); c.fill(); }
}
function flower(c, x, y) {
  for (var i = 0; i < 5; i++) { var a = i / 5 * TAU - 0.3; ell(c, x + Math.cos(a) * 15, y + Math.sin(a) * 15, 14, 10, a); c.fillStyle = i % 2 ? '#ff5f9a' : '#e8387a'; c.fill(); c.strokeStyle = '#a81a52'; c.lineWidth = 1.5; c.stroke(); }
  ell(c, x, y, 8, 8, 0); c.fillStyle = '#ffd83a'; c.fill(); c.strokeStyle = '#c98a00'; c.stroke();
}

/* 손님 한 명. (0,0) = 선반 윗선 가운데. o: {mood, t, acc, seed}  mood: happy meh angry eat yum yuck */
function customer(c, id, o) {
  var S = SPECIES[id], t = o.t || 0, mood = o.mood || 'happy', F = S.fur, F2 = S.fur2, D = lit(F, -0.42), i;
  var bob = Math.sin(t * 2.2 + (o.seed || 0)) * 2.5, hy = -150 + bob + (mood === 'eat' ? Math.abs(Math.sin(t * 13)) * 5 : 0);
  var eyeC = '#2a1a12', eat = mood === 'eat';
  c.lineJoin = 'round';
  /* 몸 */
  c.beginPath(); c.moveTo(-112, 6); c.bezierCurveTo(-116, -70, -66, -96, 0, -96); c.bezierCurveTo(66, -96, 116, -70, 112, 6); c.closePath();
  c.fillStyle = lg(c, -110, 0, 110, 0, [0, lit(S.shirt, 0.22), 0.5, S.shirt, 1, lit(S.shirt, -0.3)]); c.fill(); c.strokeStyle = lit(S.shirt, -0.5); c.lineWidth = 3.5; c.stroke();
  c.save(); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 7; c.beginPath(); c.moveTo(-70, -100); c.lineTo(0, -34); c.lineTo(70, -100); c.stroke();
  c.strokeStyle = lit(S.shirt, -0.3); c.lineWidth = 5; c.beginPath(); c.moveTo(-86, -100); c.lineTo(0, -18); c.lineTo(86, -100); c.stroke();
  c.strokeStyle = '#ffd83a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-100, -100); c.lineTo(0, -4); c.lineTo(100, -100); c.stroke();
  c.fillStyle = 'rgba(30,15,10,.22)'; ell(c, 0, hy + 74, 70, 16, 0); c.fill();
  c.restore();
  c.save(); c.translate(0, hy);
  function ear(sx) {
    c.save(); c.scale(sx, 1);
    switch (S.ear) {
      case 'point':
        c.beginPath(); c.moveTo(-76, -30); c.quadraticCurveTo(-78, -84, -62, -98); c.quadraticCurveTo(-34, -78, -22, -62); c.closePath(); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke();
        c.beginPath(); c.moveTo(-66, -44); c.quadraticCurveTo(-66, -76, -60, -84); c.quadraticCurveTo(-44, -70, -38, -60); c.closePath(); c.fillStyle = S.earIn; c.fill(); break;
      case 'bigpoint':
        c.beginPath(); c.moveTo(-82, -18); c.quadraticCurveTo(-112, -90, -96, -120); c.quadraticCurveTo(-48, -92, -24, -60); c.closePath(); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke();
        c.beginPath(); c.moveTo(-76, -40); c.quadraticCurveTo(-96, -88, -90, -104); c.quadraticCurveTo(-58, -82, -42, -60); c.closePath(); c.fillStyle = S.earIn; c.fill();
        if (S.tips) { c.beginPath(); c.moveTo(-103, -92); c.quadraticCurveTo(-104, -112, -96, -120); c.quadraticCurveTo(-82, -112, -74, -104); c.closePath(); c.fillStyle = '#3a2418'; c.fill(); }
        break;
      case 'round':
        ell(c, -62, -60, 30, 30, 0); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); ell(c, -62, -58, 16, 16, 0); c.fillStyle = S.earIn; c.fill(); break;
      case 'biground':
        ell(c, -74, -62, 46, 46, 0); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); ell(c, -74, -60, 30, 30, 0); c.fillStyle = S.earIn; c.fill(); break;
      case 'long':
        c.save(); c.translate(-36, -62); c.rotate(S.muzzle ? -0.42 : -0.14 + Math.sin(t * 1.7) * 0.03);
        ell(c, 0, -52, S.muzzle ? 22 : 20, 62, 0); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); ell(c, 0, -50, 10, 44, 0); c.fillStyle = S.earIn; c.fill(); c.restore(); break;
      case 'flop':
        c.beginPath(); c.moveTo(-60, -58); c.quadraticCurveTo(-104, -66, -108, -22); c.quadraticCurveTo(-82, -22, -64, -38); c.closePath(); c.fillStyle = S.earIn; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); break;
      case 'banana':
        c.save(); c.translate(-44, -66); c.rotate(-0.3); ell(c, 0, -26, 13, 32, 0); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); ell(c, 0, -24, 6, 22, 0); c.fillStyle = S.earIn; c.fill(); c.restore(); break;
    }
    c.restore();
  }
  ear(1); ear(-1);
  if (S.frog) for (i = -1; i <= 1; i += 2) { ell(c, i * 46, -62, 32, 32, 0); c.fillStyle = F; c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke(); }
  if (S.beak) for (i = -1; i <= 1; i++) { c.save(); c.translate(i * 20, -70); c.rotate(i * 0.35); ell(c, 0, -22, 13, 32, 0); c.fillStyle = i ? '#f2b01e' : '#ff6a4e'; c.fill(); c.strokeStyle = D; c.lineWidth = 3; c.stroke(); c.restore(); }
  /* 머리 */
  var hx2 = S.frog ? 92 : 86, hy2 = S.frog ? 70 : 78;
  if (S.fluff) { c.fillStyle = F; c.strokeStyle = D; c.lineWidth = 3.5; for (i = 0; i < 12; i++) { var fa = Math.PI + i / 11 * Math.PI; ell(c, Math.cos(fa) * 74, Math.sin(fa) * 62 - 6, 24, 24, 0); c.fill(); c.stroke(); } }
  ell(c, 0, 0, hx2, hy2, 0); c.fillStyle = rg(c, -30, -34, 10, 120, [0, lit(F, 0.2), 0.6, F, 1, lit(F, -0.2)]); c.fill(); c.strokeStyle = D; c.lineWidth = 3.5; c.stroke();
  c.save(); ell(c, 0, 0, hx2 - 2, hy2 - 2, 0); c.clip();
  if (S.fluff) { c.fillStyle = F2; for (i = 0; i < 6; i++) { ell(c, -50 + i * 20, -66 + Math.abs(i - 2.5) * 4, 16, 16, 0); c.fill(); } }
  if (S.stripe) { c.strokeStyle = S.stripe; c.lineWidth = 7; c.lineCap = 'round'; for (i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 17, -80); c.lineTo(i * 15, -52 + Math.abs(i) * 6); c.stroke(); } }
  if (S.cheek) { c.fillStyle = F2; ell(c, -70, 34, 46, 44, 0.4); c.fill(); ell(c, 70, 34, 46, 44, -0.4); c.fill(); }
  if (S.mask) { c.fillStyle = '#3a3f48'; ell(c, -36, -8, 34, 24, 0.35); c.fill(); ell(c, 36, -8, 34, 24, -0.35); c.fill(); c.fillStyle = F2; ell(c, 0, -54, 12, 30, 0); c.fill(); }
  if (S.beak) { c.fillStyle = F2; ell(c, -36, -6, 30, 30, 0); c.fill(); ell(c, 36, -6, 30, 30, 0); c.fill(); c.fillStyle = '#2f8fd0'; ell(c, 0, 96, 110, 50, 0); c.fill(); }
  if (S.frog) { c.fillStyle = F2; ell(c, 0, 70, 96, 48, 0); c.fill(); }
  if (mood === 'angry') { c.fillStyle = 'rgba(230,40,20,.2)'; c.fillRect(-100, -100, 200, 200); }
  if (mood === 'yuck') { c.fillStyle = 'rgba(90,150,60,.28)'; c.fillRect(-100, -100, 200, 200); }
  c.restore();
  /* 주둥이 */
  var my = 30;
  if (S.muzzle) { ell(c, 0, 40, 50, 42, 0); c.fillStyle = rg(c, -14, 26, 6, 60, [0, '#ffffff', 1, F2]); c.fill(); c.strokeStyle = lit(F2, -0.3); c.lineWidth = 2.5; c.stroke(); }
  else if (!S.frog && !S.beak && !S.snout) { ell(c, 0, 30, 42, 31, 0); c.fillStyle = rg(c, -12, 20, 4, 48, [0, '#ffffff', 1, F2]); c.fill(); }
  if (eat) { c.fillStyle = lit(F, 0.1); c.strokeStyle = D; c.lineWidth = 3; var cb = Math.sin(t * 13) > 0 ? 1 : -1; ell(c, cb * 68, 30, 24, 22, 0); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(255,90,110,' + (mood === 'yum' || eat ? 0.5 : 0.28) + ')'; ell(c, -56, 22, 15, 10, 0); c.fill(); ell(c, 56, 22, 15, 10, 0); c.fill();
  /* 눈 */
  var ex = S.frog ? 46 : 32, ey = S.frog ? -62 : -12, blink = (t * 0.55 + (o.seed || 0) * 0.37) % 1 > 0.955;
  for (i = -1; i <= 1; i += 2) {
    var X = i * ex;
    if (S.frog) { ell(c, X, ey, 20, 21, 0); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = D; c.lineWidth = 2; c.stroke(); }
    c.strokeStyle = eyeC; c.fillStyle = eyeC; c.lineCap = 'round'; c.lineWidth = 5;
    if (mood === 'yum' || eat) { c.beginPath(); c.arc(X, ey + 5, 11, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); }
    else if (mood === 'yuck') { c.beginPath(); c.moveTo(X - i * 10, ey - 8); c.lineTo(X + i * 6, ey); c.lineTo(X - i * 10, ey + 8); c.stroke(); }
    else if (blink) { c.beginPath(); c.moveTo(X - 10, ey + 2); c.lineTo(X + 10, ey + 2); c.stroke(); }
    else { ell(c, X, ey, 10, 13.5, 0); c.fill(); c.fillStyle = '#fff'; ell(c, X - 3, ey - 5, 4, 4.6, 0); c.fill(); ell(c, X + 3.5, ey + 4.5, 2, 2, 0); c.fill(); }
    if (mood === 'angry') { c.strokeStyle = eyeC; c.lineWidth = 5.5; c.beginPath(); c.moveTo(X - i * 18, ey - 17); c.lineTo(X + i * 12, ey - 28); c.stroke(); }
    else if (mood === 'meh') { c.strokeStyle = eyeC; c.lineWidth = 4.5; c.beginPath(); c.moveTo(X - 13, ey - 23); c.lineTo(X + 13, ey - 23); c.stroke(); }
  }
  /* 코 */
  if (S.snout) {
    ell(c, 0, 28, 31, 22, 0); c.fillStyle = lg(c, 0, 6, 0, 50, [0, '#ffa2b0', 1, S.nose]); c.fill(); c.strokeStyle = lit(S.nose, -0.35); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#a83a52'; ell(c, -11, 28, 5, 8, 0); c.fill(); ell(c, 11, 28, 5, 8, 0); c.fill(); my = 58;
  } else if (S.beak) {
    c.beginPath(); c.moveTo(-24, 8); c.quadraticCurveTo(0, -4, 24, 8); c.quadraticCurveTo(22, 46, 0, 62); c.quadraticCurveTo(-22, 46, -24, 8); c.closePath();
    c.fillStyle = lg(c, -24, 0, 24, 0, [0, '#ffd45a', 0.5, S.nose, 1, '#c97a0a']); c.fill(); c.strokeStyle = '#8a5200'; c.lineWidth = 3; c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(-18, 30); c.quadraticCurveTo(0, 38 + (eat ? Math.sin(t * 13) * 6 : 0), 18, 30); c.stroke();
  } else if (S.frog) {
    c.fillStyle = S.nose; ell(c, -8, -6, 3, 4, 0); c.fill(); ell(c, 8, -6, 3, 4, 0); c.fill(); my = 22;
  } else if (S.muzzle) {
    c.fillStyle = S.nose; ell(c, -14, 34, 6, 8, 0.3); c.fill(); ell(c, 14, 34, 6, 8, -0.3); c.fill(); my = 54;
  } else {
    c.beginPath(); c.moveTo(-11, 14); c.quadraticCurveTo(0, 9, 11, 14); c.quadraticCurveTo(8, 27, 0, 28); c.quadraticCurveTo(-8, 27, -11, 14); c.closePath(); c.fillStyle = S.nose; c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, -3, 16, 4, 2.2, 0); c.fill(); my = 40;
  }
  /* 입 */
  if (!S.beak) {
    c.strokeStyle = eyeC; c.lineWidth = 4; c.lineCap = 'round'; var mw = S.frog ? 52 : 17;
    if (eat) { var op = 5 + Math.abs(Math.sin(t * 13)) * 9; ell(c, 0, my + 4, mw * 0.7, op, 0); c.fillStyle = '#7a2a2a'; c.fill(); c.stroke(); }
    else if (mood === 'yum') { c.beginPath(); c.moveTo(-mw - 4, my - 3); c.quadraticCurveTo(0, my + 30, mw + 4, my - 3); c.closePath(); c.fillStyle = '#8a2a2a'; c.fill(); c.stroke(); c.fillStyle = '#ff7a8a'; ell(c, 0, my + 9, mw * 0.5, 4, 0); c.fill(); }
    else if (mood === 'angry') { c.beginPath(); c.moveTo(-mw, my + 10); c.quadraticCurveTo(0, my - 6, mw, my + 10); c.stroke(); }
    else if (mood === 'yuck') { c.beginPath(); c.moveTo(-mw - 2, my + 4); c.quadraticCurveTo(-mw / 2, my - 6, 0, my + 4); c.quadraticCurveTo(mw / 2, my + 14, mw + 2, my + 4); c.stroke(); c.fillStyle = '#ff7a8a'; rrp(c, 2, my + 5, 13, 17, 6); c.fill(); c.stroke(); }
    else if (mood === 'meh') { c.beginPath(); c.moveTo(-mw * 0.8, my + 4); c.lineTo(mw * 0.8, my + 4); c.stroke(); }
    else {
      if (S.frog) { c.beginPath(); c.moveTo(-mw, my - 2); c.quadraticCurveTo(0, my + 20, mw, my - 2); c.stroke(); }
      else { c.beginPath(); c.moveTo(0, my - 12); c.lineTo(0, my - 2); c.moveTo(-mw, my - 5); c.quadraticCurveTo(-mw / 2, my + 8, 0, my - 2); c.quadraticCurveTo(mw / 2, my + 8, mw, my - 5); c.stroke(); }
      if (S.teeth) { c.fillStyle = '#fff'; c.strokeStyle = '#8a7a6a'; c.lineWidth = 2; rrp(c, -8, my - 1, 16, 13, 3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, my); c.lineTo(0, my + 12); c.stroke(); }
    }
  }
  if (S.whisk) { c.strokeStyle = 'rgba(60,40,30,.7)'; c.lineWidth = 2; for (i = -1; i <= 1; i += 2) for (var k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(i * 40, 30 + k * 5); c.lineTo(i * 96, 24 + k * 15); c.stroke(); } }
  if (S.muzzle) { c.fillStyle = '#5a524c'; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-18 + i * 12, -74); c.lineTo(-10 + i * 12, -98 + (i % 2) * 8); c.lineTo(-2 + i * 12, -72); c.closePath(); c.fill(); } }
  if (o.acc === 1 && S.ear !== 'long') sombrero(c);
  else if (o.acc === 2) flower(c, S.ear === 'long' ? 66 : 60, S.frog ? -30 : -56);
  if (mood === 'angry') {
    c.save(); c.translate(84, -78); c.rotate(Math.sin(t * 9) * 0.12); c.strokeStyle = '#e0281e'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, -5); c.quadraticCurveTo(-5, -5, -5, -14); c.moveTo(14, -5); c.quadraticCurveTo(5, -5, 5, -14); c.moveTo(-14, 5); c.quadraticCurveTo(-5, 5, -5, 14); c.moveTo(14, 5); c.quadraticCurveTo(5, 5, 5, 14); c.stroke(); c.restore();
  }
  c.restore();
}

/* ================= 작은 그림 ================= */
function star(c, x, y, q, fill, stroke) {
  c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? q * 0.46 : q; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath();
  c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = q * 0.16; c.lineJoin = 'round'; c.stroke(); }
}
function coin(c, q) {
  ell(c, 0, q * 0.1, q, q, 0); c.fillStyle = '#9a6200'; c.fill();
  ell(c, 0, 0, q, q, 0); c.fillStyle = rg(c, -q * 0.3, -q * 0.35, q * 0.1, q * 1.2, [0, '#fff6b0', 0.5, '#ffd034', 1, '#e09a10']); c.fill(); c.strokeStyle = '#8a5600'; c.lineWidth = q * 0.12; c.stroke();
  ell(c, 0, 0, q * 0.68, q * 0.68, 0); c.strokeStyle = 'rgba(138,86,0,.55)'; c.lineWidth = q * 0.08; c.stroke();
  star(c, 0, 0, q * 0.42, '#b87400');
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = q * 0.1; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, q * 0.84, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
}
function heart(c, q, on) {
  c.beginPath(); c.moveTo(0, q * 0.9); c.bezierCurveTo(-q * 1.5, -q * 0.1, -q * 0.7, -q * 1.15, 0, -q * 0.35); c.bezierCurveTo(q * 0.7, -q * 1.15, q * 1.5, -q * 0.1, 0, q * 0.9); c.closePath();
  c.fillStyle = on ? lg(c, 0, -q, 0, q, [0, '#ff7a86', 1, '#e0283a']) : 'rgba(60,30,20,.35)'; c.fill(); c.strokeStyle = on ? '#8a0f1e' : 'rgba(40,20,10,.5)'; c.lineWidth = q * 0.16; c.lineJoin = 'round'; c.stroke();
  if (on) { c.fillStyle = 'rgba(255,255,255,.7)'; ell(c, -q * 0.42, -q * 0.4, q * 0.22, q * 0.13, -0.6); c.fill(); }
}

/* 피냐타(당나귀). 가운데 원점, 크기 s(몸 길이쯤). fill 0~1 = 아래부터 색이 찬다 */
var PCOL = ['#e8387a', '#ffd034', '#2aa6c0', '#ff8a1e', '#6cc04a', '#8a4fd0'];
function pinataShapes(c, s, fn) {
  function poly(a) { c.beginPath(); for (var i = 0; i < a.length; i += 2) { if (i) c.lineTo(a[i] * s, a[i + 1] * s); else c.moveTo(a[i] * s, a[i + 1] * s); } c.closePath(); fn(); }
  function box(x, y, w, h, q) { rrp(c, x * s, y * s, w * s, h * s, q * s); fn(); }
  poly([-0.48, -0.12, -0.66, -0.02, -0.62, 0.14, -0.46, 0.02]);
  box(-0.44, 0.14, 0.15, 0.38, 0.05); box(-0.24, 0.14, 0.15, 0.38, 0.05); box(0.0, 0.14, 0.15, 0.38, 0.05); box(0.17, 0.14, 0.15, 0.38, 0.05);
  box(-0.5, -0.2, 0.84, 0.42, 0.14);
  poly([0.12, -0.12, 0.28, -0.5, 0.52, -0.42, 0.36, 0.04]);
  poly([0.26, -0.54, 0.2, -0.86, 0.38, -0.58]); poly([0.38, -0.58, 0.42, -0.88, 0.52, -0.56]);
  box(0.24, -0.62, 0.42, 0.26, 0.1);
}
var pinCv = null;
function pinata(c, s, fill) {
  if (fill == null) fill = 1;
  var N = 256, k = 0;
  if (!pinCv) pinCv = mk(N * 2, N * 2);
  var p = pinCv.getContext('2d'), u = N * 0.74;
  p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'source-over'; p.clearRect(0, 0, N * 2, N * 2); p.translate(N, N);
  p.fillStyle = '#6a5a70'; pinataShapes(p, u, function () { p.fill(); });
  p.globalCompositeOperation = 'source-atop';
  var top = u * 0.58 - fill * u * 1.5, band = u * 0.085;
  for (var y = -u * 0.9; y < u * 0.55; y += band, k++) {
    var colored = y + band * 0.5 > top;
    p.fillStyle = colored ? PCOL[k % 6] : (k % 2 ? '#7d6d84' : '#5b4c62');
    p.beginPath(); p.moveTo(-u, y);
    for (var x = -u, j = 0; x <= u; x += band * 0.5, j++) p.lineTo(x, y + band + (j % 2 ? band * 0.3 : 0));
    p.lineTo(u, y); p.closePath(); p.fill();
    p.fillStyle = 'rgba(0,0,0,.14)'; p.fillRect(-u, y + band * 0.8, u * 2, band * 0.2);
  }
  p.fillStyle = lg(p, -u * 0.6, -u, u * 0.6, u, [0, 'rgba(255,255,255,.3)', 0.5, 'rgba(255,255,255,0)', 1, 'rgba(40,10,40,.28)']); p.fillRect(-u, -u, u * 2, u * 2);
  c.save(); c.lineJoin = 'round'; c.strokeStyle = '#4a2412'; c.lineWidth = s * 0.07;
  pinataShapes(c, s, function () { c.stroke(); });
  c.drawImage(pinCv, -N * s / u, -N * s / u, N * 2 * s / u, N * 2 * s / u);
  ell(c, s * 0.53, -s * 0.5, s * 0.045, s * 0.05, 0); c.fillStyle = '#2a1a12'; c.fill(); c.fillStyle = '#fff'; ell(c, s * 0.52, -s * 0.515, s * 0.016, s * 0.016, 0); c.fill();
  c.restore();
}

/* 쓰레기통 */
function trash(c, s) {
  c.fillStyle = 'rgba(50,25,8,.25)'; ell(c, s * 0.06, s * 0.52, s * 0.5, s * 0.1, 0); c.fill();
  c.beginPath(); c.moveTo(-s * 0.4, -s * 0.3); c.lineTo(s * 0.4, -s * 0.3); c.lineTo(s * 0.32, s * 0.5); c.lineTo(-s * 0.32, s * 0.5); c.closePath();
  c.fillStyle = lg(c, -s * 0.4, 0, s * 0.4, 0, [0, '#8fa0ac', 0.4, '#6c7c88', 1, '#3f4b55']); c.fill(); c.strokeStyle = '#2a333b'; c.lineWidth = s * 0.05; c.lineJoin = 'round'; c.stroke();
  c.strokeStyle = 'rgba(30,40,48,.6)'; c.lineWidth = s * 0.045; c.lineCap = 'round'; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.2, -s * 0.16); c.lineTo(i * s * 0.17, s * 0.38); c.stroke(); }
  rrp(c, -s * 0.48, -s * 0.44, s * 0.96, s * 0.16, s * 0.06); c.fillStyle = lg(c, 0, -s * 0.44, 0, -s * 0.28, [0, '#b9c6d0', 1, '#6c7c88']); c.fill(); c.strokeStyle = '#2a333b'; c.lineWidth = s * 0.05; c.stroke();
  rrp(c, -s * 0.13, -s * 0.56, s * 0.26, s * 0.14, s * 0.05); c.stroke();
}

/* 접시(체크 종이 깐 빨간 바구니). 가운데 원점 */
function tray(c, q) {
  var sy = 0.86;
  c.fillStyle = 'rgba(50,25,8,.3)'; ell(c, q * 0.05, q * 0.14, q * 1.3, q * 1.3 * sy, 0); c.fill();
  ell(c, 0, q * 0.06, q * 1.28, q * 1.28 * sy, 0); c.fillStyle = '#8a1410'; c.fill();
  ell(c, 0, 0, q * 1.28, q * 1.28 * sy, 0); c.fillStyle = rg(c, -q * 0.4, -q * 0.4, q * 0.2, q * 1.5, [0, '#ff6a4e', 0.6, '#e0281e', 1, '#b01a14']); c.fill(); c.strokeStyle = '#6a0c0a'; c.lineWidth = 3; c.stroke();
  c.save(); ell(c, 0, 0, q * 1.13, q * 1.13 * sy, 0); c.clip();
  c.fillStyle = '#fffaf0'; c.fillRect(-q * 1.3, -q * 1.3, q * 2.6, q * 2.6);
  c.save(); c.rotate(0.35); c.fillStyle = 'rgba(224,40,30,.2)'; var g = q * 0.2;
  for (var i = -8; i < 8; i++) { c.fillRect(i * g * 2, -q * 1.6, g, q * 3.2); c.fillRect(-q * 1.6, i * g * 2, q * 3.2, g); }
  c.restore();
  c.fillStyle = rg(c, 0, 0, q * 0.7, q * 1.2, [0, 'rgba(0,0,0,0)', 1, 'rgba(90,40,10,.22)']); c.fillRect(-q * 1.3, -q * 1.3, q * 2.6, q * 2.6);
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.ellipse(0, 0, q * 1.21, q * 1.21 * sy, 0, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
}

/* 화구(무쇠 판). 가운데 원점. hot = 불 켜짐, locked = 잠김 */
function comal(c, q, hot, locked, t) {
  var sy = 0.86, i;
  c.fillStyle = 'rgba(40,20,8,.3)'; ell(c, q * 0.05, q * 0.16, q * 1.26, q * 1.26 * sy, 0); c.fill();
  if (hot && !locked) {
    for (i = 0; i < 14; i++) { var a = i / 14 * TAU, fl = 1 + Math.sin(t * 11 + i * 2.1) * 0.16; c.fillStyle = i % 2 ? 'rgba(255,170,40,.9)' : 'rgba(80,170,255,.85)'; ell(c, Math.cos(a) * q * 1.16, Math.sin(a) * q * 1.16 * sy + q * 0.07, q * 0.1 * fl, q * 0.14 * fl, 0); c.fill(); }
  }
  ell(c, 0, q * 0.08, q * 1.18, q * 1.18 * sy, 0); c.fillStyle = '#17120f'; c.fill();
  ell(c, 0, 0, q * 1.18, q * 1.18 * sy, 0); c.fillStyle = rg(c, -q * 0.4, -q * 0.4, q * 0.1, q * 1.5, [0, locked ? '#77706a' : '#5a514b', 0.6, locked ? '#57514c' : '#2f2925', 1, '#1a1512']); c.fill(); c.strokeStyle = '#0d0a08'; c.lineWidth = 3; c.stroke();
  ell(c, 0, 0, q * 0.98, q * 0.98 * sy, 0); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.ellipse(0, 0, q * 1.08, q * 1.08 * sy, 0, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
  if (locked) {
    c.save(); c.translate(0, q * 0.05); var u = q * 0.3;
    c.strokeStyle = '#d9dee2'; c.lineWidth = u * 0.32; c.beginPath(); c.arc(0, -u * 0.5, u * 0.52, Math.PI, 0); c.stroke();
    rrp(c, -u * 0.85, -u * 0.5, u * 1.7, u * 1.35, u * 0.22); c.fillStyle = lg(c, 0, -u * 0.5, 0, u, [0, '#ffd85a', 1, '#d99a10']); c.fill(); c.strokeStyle = '#6a4200'; c.lineWidth = u * 0.14; c.stroke();
    c.fillStyle = '#6a4200'; ell(c, 0, u * 0.05, u * 0.17, u * 0.17, 0); c.fill(); c.fillRect(-u * 0.07, u * 0.05, u * 0.14, u * 0.4);
    c.restore();
  }
}
/* 또띠아 더미 */
function stack(c, q) {
  for (var i = 0; i < 7; i++) { c.save(); c.translate(Math.sin(i * 2.3) * 3, q * 0.34 - i * q * 0.1); tortilla(c, q, 0.12, 11 + i, 0.62); c.restore(); }
}

/* ================= 제미나이 스프라이트 (img/*.webp, tools/split.py 가 만든다) ================= */
var PEOPLE = ['kgirl', 'mexman', 'granny', 'bman', 'indwoman', 'teen', 'bgirl', 'hijab', 'grandpa', 'latina', 'hawaii', 'baby'];
var MOODF = { happy: 0, meh: 1, angry: 2, eat: 3, yum: 4, yuck: 5 };
var SPR = { img: {}, ok: false, load: function (cb) {
  var names = [], left;
  PEOPLE.forEach(function (n) { names.push('ppl_' + n); }); BINS.forEach(function (n) { names.push('pile_' + n, 'bin_' + n); });
  names.push('tort0', 'tort1', 'tort2', 'tort3', 'stack', 'shell', 'taco', 'bot_roja', 'bot_verde', 'bot_crema');
  left = names.length;
  names.forEach(function (n) { var im = new Image(); im.onload = im.onerror = function () { if (--left === 0) { SPR.ok = true; if (cb) cb(); } }; im.src = 'img/' + n + '.webp?v=1'; SPR.img[n] = im; });
} };
function fit(c, n, cx, cy, mw, mh) { var im = SPR.img[n]; if (!im || !im.naturalWidth) return; var s = Math.min(mw / im.naturalWidth, mh / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s; c.drawImage(im, cx - w / 2, cy - h / 2, w, h); }
function person(c, id, o) {
  var im = SPR.img['ppl_' + id]; if (!im || !im.naturalWidth) return;
  var t = o.t || 0, mood = o.mood || 'happy', f = MOODF[mood] || 0, bob = Math.sin(t * 2.2 + (o.seed || 0)) * 2.5, sx = 1, sy = 1;
  if (mood === 'eat') { var k = Math.sin(t * 13); sy = 1 + k * 0.035; sx = 1 - k * 0.025; }
  c.save(); c.translate(0, 16); c.scale(sx, sy); c.drawImage(im, f * 300 + 1, 0, 298, 290, -124, -240 + bob, 248, 240); c.restore();
  if (mood === 'angry') {
    c.save(); c.translate(78, -182); c.rotate(Math.sin(t * 9) * 0.12); c.strokeStyle = '#e0281e'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, -5); c.quadraticCurveTo(-5, -5, -5, -14); c.moveTo(14, -5); c.quadraticCurveTo(5, -5, 5, -14); c.moveTo(-14, 5); c.quadraticCurveTo(-5, 5, -5, 14); c.moveTo(14, 5); c.quadraticCurveTo(5, 5, 5, 14); c.stroke(); c.restore();
  }
}
function piece2(c, id, s, v) { fit(c, 'pile_' + id, 0, 0, s * 4.4, s * 4.0); }
function spots2(id, k, seed) { var R = rng(seed * 131 + k * 17 + id.charCodeAt(0)), out = []; for (var i = 0; i < 2; i++) { var a = R() * TAU, d = (0.18 + R() * 0.32); out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.86, rot: (R() - 0.5) * 1.4, v: R() }); } return out; }
function icon2(c, id, q) { if (ING[id].kind === 'sauce') fit(c, 'bot_' + id, 0, 0, q * 1.6, q * 2.1); else fit(c, 'pile_' + id, 0, 0, q * 2.1, q * 1.9); }
function bottle2(c, id, h) { var im = SPR.img['bot_' + id]; if (!im || !im.naturalWidth) return; var w = h * im.naturalWidth / im.naturalHeight; c.fillStyle = 'rgba(40,20,5,.25)'; ell(c, w * 0.1, -2, w * 0.6, h * 0.045, 0); c.fill(); c.drawImage(im, -w / 2, -h, w, h); }
function bin2(c, id, w, h, empty) {
  fit(c, 'bin_' + id, w / 2, h / 2, w - 2, h);
  if (empty) {
    var lx = w * 0.05, ly = h * 0.02, lw = w * 0.9, lh = h * 0.8;
    rrp(c, lx, ly, lw, lh, 12); c.fillStyle = lg(c, 0, ly, 0, ly + lh, [0, '#f4f7fa', 0.45, '#cfd7de', 1, '#98a3ad']); c.fill(); c.strokeStyle = '#5a646e'; c.lineWidth = 2.5; c.stroke();
    rrp(c, lx + 8, ly + 8, lw - 16, lh - 16, 8); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.stroke();
    var hx0 = w / 2 - 30, hy0 = ly + lh / 2 - 8; c.fillStyle = 'rgba(40,50,60,.3)'; rrp(c, hx0, hy0 + 5, 60, 16, 8); c.fill();
    rrp(c, hx0, hy0, 60, 16, 8); c.fillStyle = lg(c, 0, hy0, 0, hy0 + 16, [0, '#6a7682', 1, '#3a444e']); c.fill(); c.strokeStyle = '#2a323a'; c.lineWidth = 2; c.stroke();
  }
}
function tort2(c, q, done, seed, squash) {
  var n = done < 0.5 ? 0 : done < 1.0 ? 1 : done < 1.3 ? 2 : 3, d = q * 2.1;
  c.save(); c.scale(1, squash || 0.9); c.fillStyle = 'rgba(60,30,8,.25)'; ell(c, q * 0.05, q * 0.09, q, q, 0); c.fill(); c.rotate((seed || 0) * 1.7);
  var im = SPR.img['tort' + n]; if (im && im.naturalWidth) c.drawImage(im, -d / 2, -d / 2, d, d);
  if (n === 0 && done > 0.3) { c.globalAlpha = (done - 0.3) / 0.2; c.drawImage(SPR.img.tort1, -d / 2, -d / 2, d, d); c.globalAlpha = 1; }
  c.restore();
}
function stack2(c, q) { fit(c, 'stack', 0, q * 0.12, q * 2.4, q * 1.7); }
function taco2(c, q, done, items, seed) {
  var R = rng(seed || 3), ids = [];
  FILL_ORDER.forEach(function (id) { if (items && items[id]) for (var k = 0; k < Math.min(2, items[id]); k++) ids.push(id); });
  c.save(); c.fillStyle = 'rgba(50,25,8,.25)'; ell(c, q * 0.04, q * 0.72, q * 0.85, q * 0.11, 0); c.fill();
  ids.forEach(function (id, i) { var u = ids.length < 2 ? 0.5 : i / (ids.length - 1); c.save(); c.translate((u - 0.5) * q * 1.15 + (R() - 0.5) * q * 0.15, -q * 0.42 - Math.sin(u * Math.PI) * q * 0.16 - R() * q * 0.06); c.rotate((R() - 0.5) * 0.8); fit(c, 'pile_' + id, 0, 0, q * 0.95, q * 0.8); c.restore(); });
  SAUCES.forEach(function (id) {
    if (!items || !items[id]) return;
    c.strokeStyle = ING[id].c; c.lineWidth = q * 0.07; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    for (var k = 0; k <= 8; k++) { var x = (-0.6 + k * 0.15) * q, y = -q * (0.5 + (k % 2 ? 0.13 : 0.0)) - Math.sin(k / 8 * Math.PI) * q * 0.12; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
  });
  fit(c, 'shell', 0, 0, q * 2.2, q * 1.7);
  c.restore();
}
function tacoFull(c, q) { fit(c, 'taco', 0, -q * 0.25, q * 2.5, q * 2.1); }
function pick(a, b) { return function () { return (SPR.ok ? a : b).apply(null, arguments); }; }

ART = {
  ING: ING, BINS: BINS, SAUCES: SAUCES, SPLIST: PEOPLE, PCOL: PCOL, SPR: SPR,
  rng: rng, mix: mix, lit: lit, rr: rrp, ell: ell, mk: mk, lg: lg, rg: rg,
  piece: pick(piece2, piece), bottle: pick(bottle2, bottle), icon: pick(icon2, icon), bin: pick(bin2, bin), tortilla: pick(tort2, tortilla), tortillaCol: tortillaCol,
  scoopSpots: pick(spots2, scoopSpots), sauceLine: sauceLine, taco: pick(taco2, taco), tacoFull: tacoFull,
  customer: person, coin: coin, star: star, heart: heart, pinata: pinata, trash: trash, tray: tray, comal: comal, stack: pick(stack2, stack)
};
})();
