/* 타코 만들기 — 배경 12곳, 차양, 선반, 조리대, 지도, 트럭 */
var BG;
(function () {
'use strict';
var A = ART, TAU = Math.PI * 2, lg = A.lg, rg = A.rg, ell = A.ell, rrp = A.rr, mix = A.mix, lit = A.lit;
var HZ = 300;

function sky(c, W, a, b) { c.fillStyle = lg(c, 0, 60, 0, HZ + 10, [0, a, 1, b]); c.fillRect(0, 0, W, HZ + 60); }
function sun(c, x, y, q, col, glow) { c.fillStyle = rg(c, x, y, q * 0.6, q * 3.2, [0, glow || 'rgba(255,250,200,.55)', 1, 'rgba(255,250,200,0)']); c.fillRect(x - q * 4, y - q * 4, q * 8, q * 8); ell(c, x, y, q, q, 0); c.fillStyle = col; c.fill(); }
function cloud(c, x, y, s, col, sh) {
  c.fillStyle = sh || 'rgba(170,200,225,.9)'; ell(c, x, y + 6 * s, 62 * s, 16 * s, 0); c.fill();
  c.fillStyle = col || '#fff'; [[-34, 0, 26], [0, -12, 34], [36, -2, 24], [10, 4, 30], [-14, 6, 26]].forEach(function (p) { ell(c, x + p[0] * s, y + p[1] * s, p[2] * s, p[2] * s * 0.72, 0); c.fill(); });
}
function ground(c, W, y, a, b, seed, speck) {
  c.fillStyle = lg(c, 0, y, 0, 480, [0, a, 1, b]); c.fillRect(0, y, W, 480 - y);
  if (speck) { var R = A.rng(seed || 1); c.fillStyle = speck; for (var i = 0; i < 70; i++) { var py = y + 6 + R() * (470 - y), k = (py - y) / (480 - y); ell(c, R() * W, py, 2 + k * 7, 1 + k * 2.2, 0); c.fill(); } }
}
function ridge(c, W, base, amp, seed, col, col2, freq) {
  var R = A.rng(seed), p1 = R() * 9, p2 = R() * 9, f = freq || 1; c.beginPath(); c.moveTo(0, 480);
  for (var x = 0; x <= W; x += 12) c.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(x * 0.011 * f + p1) + 0.15 * Math.sin(x * 0.031 * f + p2)));
  c.lineTo(W, 480); c.closePath(); c.fillStyle = lg(c, 0, base - amp, 0, base + 20, [0, col, 1, col2 || col]); c.fill();
}
function mesa(c, x, base, w, h, col) {
  c.beginPath(); c.moveTo(x - w * 0.62, base); c.lineTo(x - w * 0.46, base - h * 0.42); c.lineTo(x - w * 0.4, base - h * 0.46); c.lineTo(x - w * 0.34, base - h); c.lineTo(x + w * 0.3, base - h); c.lineTo(x + w * 0.36, base - h * 0.5); c.lineTo(x + w * 0.5, base - h * 0.4); c.lineTo(x + w * 0.62, base); c.closePath();
  c.fillStyle = lg(c, x - w * 0.6, 0, x + w * 0.6, 0, [0, lit(col, 0.16), 0.55, col, 1, lit(col, -0.22)]); c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(120,40,20,.22)'; c.lineWidth = 3; for (var i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x - w, base - h * i / 6); c.lineTo(x + w, base - h * i / 6 + 4); c.stroke(); }
  c.fillStyle = 'rgba(255,240,200,.25)'; c.fillRect(x - w * 0.34, base - h, w * 0.64, 5); c.restore();
}
function cactus(c, x, y, h, col) {
  var w = h * 0.2; col = col || '#3f9a4a';
  c.fillStyle = 'rgba(80,40,10,.25)'; ell(c, x + w * 0.5, y, w * 1.6, w * 0.3, 0); c.fill();
  function body(lw, st) { c.strokeStyle = st; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
    c.beginPath(); c.moveTo(x, y - h * 0.4); c.lineTo(x - h * 0.24, y - h * 0.4); c.lineTo(x - h * 0.24, y - h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x, y - h * 0.28); c.lineTo(x + h * 0.24, y - h * 0.28); c.lineTo(x + h * 0.24, y - h * 0.58); c.stroke(); }
  body(w + 5, lit(col, -0.45)); body(w, col);
  c.strokeStyle = lit(col, 0.3); c.lineWidth = w * 0.18; c.beginPath(); c.moveTo(x - w * 0.22, y - 4); c.lineTo(x - w * 0.22, y - h); c.stroke();
  c.strokeStyle = lit(col, -0.2); c.lineWidth = w * 0.12; c.beginPath(); c.moveTo(x + w * 0.2, y - 4); c.lineTo(x + w * 0.2, y - h); c.stroke();
  c.fillStyle = '#ff6a9a'; ell(c, x, y - h - w * 0.45, w * 0.3, w * 0.24, 0); c.fill();
}
function palm(c, x, y, h, lean) {
  var tx = x + (lean || 0) * h, ty = y - h, i;
  c.fillStyle = 'rgba(60,40,10,.22)'; ell(c, x + 6, y, h * 0.16, h * 0.035, 0); c.fill();
  c.lineCap = 'round'; c.strokeStyle = '#5a3a1c'; c.lineWidth = h * 0.085; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (lean || 0) * h * 0.2, y - h * 0.55, tx, ty); c.stroke();
  c.strokeStyle = '#a8763e'; c.lineWidth = h * 0.06; c.stroke();
  c.strokeStyle = 'rgba(70,40,15,.4)'; c.lineWidth = 2; for (i = 1; i < 8; i++) { var k = i / 8, px = x + (tx - x) * k * k, py = y - h * k; c.beginPath(); c.moveTo(px - h * 0.03, py); c.lineTo(px + h * 0.03, py - 2); c.stroke(); }
  for (i = 0; i < 7; i++) {
    var a = -Math.PI * 0.5 + (i - 3) * 0.5, L = h * (0.42 + (i % 2) * 0.06), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + Math.abs(i - 3) * h * 0.06;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + ex) / 2, Math.min(ty, ey) - h * 0.16, ex, ey); c.quadraticCurveTo((tx + ex) / 2, (ty + ey) / 2 - h * 0.02, tx, ty); c.closePath();
    c.fillStyle = i % 2 ? '#3fa24a' : '#2d8a3e'; c.fill(); c.strokeStyle = '#1d6a2c'; c.lineWidth = 1.5; c.stroke();
  }
  c.fillStyle = '#7a4a1c'; ell(c, tx - 5, ty + 5, 7, 7, 0); c.fill(); ell(c, tx + 7, ty + 6, 7, 7, 0); c.fill();
}
function house(c, x, y, w, h, col, o) {
  o = o || {};
  c.fillStyle = 'rgba(40,20,10,.2)'; c.fillRect(x + 6, y - 4, w, 8);
  c.fillStyle = lg(c, x, 0, x + w, 0, [0, lit(col, 0.14), 0.6, col, 1, lit(col, -0.2)]); c.fillRect(x, y - h, w, h);
  c.fillStyle = lit(col, -0.3); c.fillRect(x - 3, y - h - 7, w + 6, 9); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x - 3, y - h - 7, w + 6, 3);
  c.fillStyle = lit(col, -0.38); c.fillRect(x, y - 12, w, 12);
  var win = o.night ? '#ffe27a' : '#3a5a78', n = Math.max(1, Math.floor(w / 46)), rows = Math.max(1, Math.floor((h - 46) / 52)), i, j;
  for (j = 0; j < rows; j++) for (i = 0; i < n; i++) {
    var wx = x + (i + 0.5) * w / n - 11, wy = y - h + 16 + j * 52;
    if (j === rows - 1 && i === (n >> 1) && !o.nodoor) continue;
    c.fillStyle = '#fff6e0'; c.fillRect(wx - 3, wy - 3, 28, 36); c.fillStyle = win; c.fillRect(wx, wy, 22, 30);
    if (o.night) { c.fillStyle = 'rgba(255,226,122,.25)'; c.fillRect(wx - 8, wy - 8, 38, 46); } else { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(wx + 2, wy + 2, 6, 26); }
    c.fillStyle = lit(col, -0.35); c.fillRect(wx - 5, wy + 31, 32, 4);
  }
  if (!o.nodoor) { var dx = x + ((n >> 1) + 0.5) * w / n - 13; c.fillStyle = '#5a3018'; c.beginPath(); c.moveTo(dx, y); c.lineTo(dx, y - 34); c.arc(dx + 13, y - 34, 13, Math.PI, 0); c.lineTo(dx + 26, y); c.closePath(); c.fill(); c.fillStyle = '#ffd034'; ell(c, dx + 20, y - 22, 2, 2, 0); c.fill(); }
}
function papel(c, x0, y0, x1, y1, n, sag, t) {
  var cols = ['#e8387a', '#ffd034', '#2aa6c0', '#ff8a1e', '#6cc04a', '#8a4fd0'], i;
  function pt(k) { return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag]; }
  c.strokeStyle = 'rgba(60,30,20,.7)'; c.lineWidth = 1.5; c.beginPath(); for (i = 0; i <= 20; i++) { var p = pt(i / 20); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.stroke();
  var fw = (x1 - x0) / n * 0.8;
  for (i = 0; i < n; i++) { var q = pt((i + 0.5) / n), sw = Math.sin((t || 0) * 2 + i) * 2; c.fillStyle = cols[i % 6];
    c.beginPath(); c.moveTo(q[0] - fw / 2, q[1]); c.lineTo(q[0] + fw / 2, q[1]); c.lineTo(q[0] + fw / 2 + sw, q[1] + fw * 0.8); c.lineTo(q[0] + fw / 4 + sw, q[1] + fw * 0.62); c.lineTo(q[0] + sw, q[1] + fw * 0.8); c.lineTo(q[0] - fw / 4 + sw, q[1] + fw * 0.62); c.lineTo(q[0] - fw / 2 + sw, q[1] + fw * 0.8); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, q[0] + sw * 0.5, q[1] + fw * 0.32, fw * 0.14, fw * 0.14, 0); c.fill(); }
}
function stars(c, W, seed, n) { var R = A.rng(seed); for (var i = 0; i < n; i++) { c.fillStyle = 'rgba(255,255,230,' + (0.4 + R() * 0.6) + ')'; var s = 0.8 + R() * 1.8; ell(c, R() * W, 60 + R() * 220, s, s, 0); c.fill(); } }
function sea(c, W, y0, y1, a, b) {
  c.fillStyle = lg(c, 0, y0, 0, y1, [0, a, 1, b]); c.fillRect(0, y0, W, y1 - y0);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.lineCap = 'round'; var R = A.rng(5);
  for (var i = 0; i < 26; i++) { var x = R() * W, y = y0 + 6 + R() * (y1 - y0 - 10), l = 10 + (y - y0) * 0.4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 3, x + l, y); c.stroke(); }
}
function bush(c, x, y, s, col) { c.fillStyle = lit(col, -0.3); ell(c, x, y, s * 1.5, s * 0.4, 0); c.fill(); [[-s * 0.7, 0, 0.7], [0, -s * 0.35, 1], [s * 0.75, 0, 0.75]].forEach(function (p) { ell(c, x + p[0], y - s * 0.35 + p[1], s * p[2], s * p[2] * 0.85, 0); c.fillStyle = rg(c, x + p[0] - s * 0.3, y - s * 0.8 + p[1], 2, s * 1.4, [0, lit(col, 0.25), 1, col]); c.fill(); }); }
function stall(c, x, y, w, col) {
  c.fillStyle = '#7a4a22'; c.fillRect(x, y - 96, 6, 96); c.fillRect(x + w - 6, y - 96, 6, 96); c.fillStyle = '#a8703a'; c.fillRect(x - 4, y - 44, w + 8, 44); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - 4, y - 44, w + 8, 6);
  for (var i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fff6e0' : col; c.beginPath(); c.moveTo(x - 10 + i * (w + 20) / 6, y - 118); c.lineTo(x - 10 + (i + 1) * (w + 20) / 6, y - 118); c.lineTo(x - 16 + (i + 1) * (w + 32) / 6, y - 88); c.arc(x - 16 + (i + 0.5) * (w + 32) / 6, y - 88, (w + 32) / 12, 0, Math.PI); c.closePath(); c.fill(); }
  var fr = ['#e8382c', '#ffd034', '#6cc04a', '#ff8a1e']; for (i = 0; i < 7; i++) { c.fillStyle = fr[i % 4]; ell(c, x + 12 + i * (w - 24) / 6, y - 50, 9, 8, 0); c.fill(); }
}

/* ---------- 12곳 ---------- */
var SCENES = [
  function (c, W) { /* 0 선인장 사막 */
    sky(c, W, '#62c0ee', '#fdeec4'); sun(c, 590, 150, 40, '#fffbe0'); cloud(c, 150, 160, 0.9); cloud(c, 400, 210, 0.6);
    mesa(c, 120, HZ, 250, 120, '#e8a070'); mesa(c, 520, HZ, 300, 165, '#dc855c'); mesa(c, 330, HZ, 120, 60, '#eab088');
    ground(c, W, HZ, '#f6d896', '#e2aa62', 3, 'rgba(170,110,50,.35)');
    cactus(c, 330, 336, 64); cactus(c, 86, 386, 150); cactus(c, 652, 408, 196); bush(c, 470, 372, 16, '#8aa84a'); bush(c, 220, 420, 20, '#7a9a40');
  },
  function (c, W) { /* 1 오아시스 마을 */
    sky(c, W, '#58b8ee', '#e8f6e0'); sun(c, 120, 150, 36, '#fffbe0'); cloud(c, 420, 150, 1); cloud(c, 640, 215, 0.6);
    ridge(c, W, HZ, 70, 4, '#e6c08a', '#eecf9c');
    house(c, 420, 318, 120, 86, '#f0b47a'); house(c, 560, 326, 130, 112, '#f6d8a6'); house(c, 300, 312, 96, 62, '#e89a6a');
    ground(c, W, HZ + 10, '#f2d490', '#dfa860', 8, 'rgba(170,110,50,.3)');
    ell(c, 190, 396, 190, 40, 0); c.fillStyle = '#d9c078'; c.fill(); ell(c, 190, 394, 170, 32, 0); c.fillStyle = lg(c, 0, 362, 0, 426, [0, '#7fe0e8', 1, '#2a9ac0']); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(110, 390); c.quadraticCurveTo(150, 384, 190, 390); c.moveTo(210, 404); c.quadraticCurveTo(250, 398, 290, 404); c.stroke();
    palm(c, 60, 400, 190, 0.12); palm(c, 348, 392, 150, -0.1); bush(c, 20, 420, 22, '#5aa84a'); bush(c, 660, 420, 20, '#7a9a40');
  },
  function (c, W) { /* 2 야자수 해변 */
    sky(c, W, '#3fb4f0', '#d8f4f6'); sun(c, 360, 130, 44, '#fffbe0'); cloud(c, 110, 170, 0.9); cloud(c, 600, 150, 1.1);
    sea(c, W, 262, 348, '#2a9ad8', '#6fe0e0');
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(470, 262); c.lineTo(486, 226); c.lineTo(500, 262); c.closePath(); c.fill(); c.fillStyle = '#e0281e'; c.fillRect(462, 260, 46, 6);
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.moveTo(0, 352); for (var x = 0; x <= W; x += 40) c.quadraticCurveTo(x + 20, 338, x + 40, 350); c.lineTo(W, 360); c.lineTo(0, 360); c.closePath(); c.fill();
    ground(c, W, 350, '#fbe7b0', '#eec07a', 12, 'rgba(190,140,70,.3)');
    c.save(); c.translate(560, 420); c.strokeStyle = '#8a5a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -120); c.stroke();
    for (var i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fff6e0' : '#ff5f6a'; c.beginPath(); c.moveTo(0, -128); c.arc(0, -84, 96, Math.PI * (1.08 + i * 0.14), Math.PI * (1.08 + (i + 1) * 0.14)); c.closePath(); c.fill(); } c.restore();
    palm(c, 70, 410, 230, 0.16); palm(c, 690, 396, 170, -0.14);
    c.fillStyle = '#ff8a5a'; ell(c, 250, 420, 14, 9, 0); c.fill(); c.fillStyle = '#ffd034'; A.star(c, 400, 440, 12, '#ffb81f', '#c97a0a');
  },
  function (c, W) { /* 3 항구 */
    sky(c, W, '#4aa8e8', '#f0f6e8'); sun(c, 600, 120, 34, '#fffbe0'); cloud(c, 200, 140, 1.1); cloud(c, 470, 200, 0.7);
    ridge(c, W, 268, 46, 9, '#8ab4c8', '#a4c6d4'); sea(c, W, 262, 360, '#2a86c8', '#58c4d8');
    c.fillStyle = '#fff6e0'; c.fillRect(96, 150, 34, 112); c.fillStyle = '#e0281e'; c.fillRect(96, 178, 34, 22); c.fillRect(96, 222, 34, 22); c.fillStyle = '#3a4a58'; c.fillRect(90, 136, 46, 16); c.fillStyle = '#ffe27a'; c.fillRect(100, 140, 26, 10); c.fillStyle = '#e0281e'; c.beginPath(); c.moveTo(88, 136); c.lineTo(113, 112); c.lineTo(138, 136); c.closePath(); c.fill();
    function boat(x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - 50 * s, y - 14 * s); c.lineTo(x + 56 * s, y - 14 * s); c.lineTo(x + 40 * s, y + 8 * s); c.lineTo(x - 38 * s, y + 8 * s); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - 38 * s, y + 2 * s, 78 * s, 6 * s); c.strokeStyle = '#5a3a1c'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x, y - 84 * s); c.stroke(); c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(x + 4 * s, y - 82 * s); c.lineTo(x + 44 * s, y - 22 * s); c.lineTo(x + 4 * s, y - 22 * s); c.closePath(); c.fill(); c.fillStyle = '#ffe6c0'; c.beginPath(); c.moveTo(x - 4 * s, y - 70 * s); c.lineTo(x - 32 * s, y - 22 * s); c.lineTo(x - 4 * s, y - 22 * s); c.closePath(); c.fill(); }
    boat(300, 300, 0.8, '#e0513a'); boat(520, 326, 1.15, '#2aa6a0');
    c.fillStyle = lg(c, 0, 360, 0, 480, [0, '#c99a62', 1, '#9a6a3a']); c.fillRect(0, 360, W, 120); c.strokeStyle = 'rgba(70,40,15,.45)'; c.lineWidth = 2; for (var i = 0; i < 10; i++) { c.beginPath(); c.moveTo(i * 80 - 10, 360); c.lineTo(i * 90 - 50, 480); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, 360, W, 4);
    [40, 250, 470, 690].forEach(function (x) { c.fillStyle = '#6a4424'; c.fillRect(x - 9, 322, 18, 52); c.fillStyle = '#8a5a30'; ell(c, x, 322, 9, 4, 0); c.fill(); });
    c.strokeStyle = '#e8d8b0'; c.lineWidth = 3; c.beginPath(); c.moveTo(40, 334); c.quadraticCurveTo(145, 360, 250, 334); c.quadraticCurveTo(360, 360, 470, 334); c.quadraticCurveTo(580, 360, 690, 334); c.stroke();
  },
  function (c, W) { /* 4 옥수수 밭 */
    sky(c, W, '#5ab6ee', '#eaf8d8'); sun(c, 130, 130, 40, '#fffbe0'); cloud(c, 380, 150, 1.1); cloud(c, 620, 210, 0.7);
    ridge(c, W, HZ, 80, 14, '#8cc46a', '#a6d47e'); ridge(c, W, HZ + 4, 40, 15, '#6aae52', '#84c066', 1.6);
    c.fillStyle = '#c0432e'; c.fillRect(520, 232, 96, 70); c.beginPath(); c.moveTo(510, 234); c.lineTo(568, 196); c.lineTo(626, 234); c.closePath(); c.fill(); c.fillStyle = '#fff6e0'; c.fillRect(556, 258, 26, 44); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(590, 232, 26, 70);
    ground(c, W, HZ, '#c8d86a', '#8aa83a');
    var R = A.rng(21);
    for (var row = 0; row < 4; row++) { var y = 336 + row * 34, s = 0.6 + row * 0.22; for (var x = -10 + (row % 2) * 20; x < W + 20; x += 44 * s) {
      c.strokeStyle = '#3f8a2a'; c.lineWidth = 5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 62 * s); c.stroke();
      c.strokeStyle = '#5aae3a'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x, y - 20 * s); c.quadraticCurveTo(x - 20 * s, y - 44 * s, x - 26 * s, y - 24 * s); c.moveTo(x, y - 34 * s); c.quadraticCurveTo(x + 20 * s, y - 58 * s, x + 26 * s, y - 36 * s); c.stroke();
      c.fillStyle = '#ffd034'; ell(c, x + 5 * s, y - 40 * s, 5 * s, 11 * s, 0.2); c.fill(); c.fillStyle = '#e8c860'; ell(c, x, y - 66 * s, 3 * s, 8 * s, 0); c.fill(); } }
  },
  function (c, W) { /* 5 붉은 협곡 */
    sky(c, W, '#58aee8', '#ffe2b8'); sun(c, 360, 170, 38, '#fff6d0'); cloud(c, 560, 150, 0.8);
    mesa(c, 360, HZ + 10, 220, 90, '#f0b890');
    c.fillStyle = lg(c, 0, 100, 0, 420, [0, '#d8663c', 1, '#a8402a']); c.beginPath(); c.moveTo(0, 90); c.lineTo(70, 110); c.lineTo(120, 190); c.lineTo(190, 230); c.lineTo(240, 330); c.lineTo(250, 480); c.lineTo(0, 480); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(W, 100); c.lineTo(640, 130); c.lineTo(600, 210); c.lineTo(520, 250); c.lineTo(480, 340); c.lineTo(470, 480); c.lineTo(W, 480); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,220,170,.35)'; c.lineWidth = 4; for (var i = 0; i < 8; i++) { var y = 140 + i * 40; c.beginPath(); c.moveTo(0, y); c.lineTo(60 + i * 26, y + 8); c.moveTo(W, y + 6); c.lineTo(W - 70 - i * 22, y + 12); c.stroke(); }
    c.strokeStyle = 'rgba(90,20,10,.25)'; for (i = 0; i < 8; i++) { y = 158 + i * 40; c.beginPath(); c.moveTo(0, y); c.lineTo(50 + i * 26, y + 8); c.moveTo(W, y + 6); c.lineTo(W - 60 - i * 22, y + 12); c.stroke(); }
    ground(c, W, 330, '#eec08a', '#d08e58', 31, 'rgba(150,70,40,.3)');
    c.fillStyle = lg(c, 0, 330, 0, 480, [0, '#6fd0e0', 1, '#2a9ac0']); c.beginPath(); c.moveTo(340, 330); c.quadraticCurveTo(300, 400, 380, 480); c.lineTo(520, 480); c.quadraticCurveTo(400, 400, 384, 330); c.closePath(); c.fill();
    cactus(c, 150, 430, 110); cactus(c, 610, 420, 130, '#4aa252');
  },
  function (c, W, t) { /* 6 분수 광장 */
    sky(c, W, '#6abcf0', '#ffeccc'); sun(c, 610, 130, 36, '#fff6d0'); cloud(c, 160, 150, 1);
    c.fillStyle = '#f6e2b8'; c.fillRect(300, 150, 120, 170); c.fillStyle = '#e8c890'; c.fillRect(390, 150, 30, 170); c.fillStyle = '#c0432e'; c.beginPath(); c.moveTo(292, 152); c.lineTo(360, 96); c.lineTo(428, 152); c.closePath(); c.fill();
    c.fillStyle = '#5a3a1c'; c.beginPath(); c.moveTo(344, 230); c.lineTo(344, 198); c.arc(360, 198, 16, Math.PI, 0); c.lineTo(376, 230); c.closePath(); c.fill(); c.fillStyle = '#ffd034'; ell(c, 360, 206, 8, 9, 0); c.fill(); c.fillStyle = '#c0432e'; c.fillRect(356, 76, 8, 24); c.fillRect(350, 82, 20, 6);
    house(c, 20, 322, 130, 150, '#ff9a6a'); house(c, 150, 322, 120, 120, '#6ac8c0'); house(c, 440, 322, 130, 132, '#ffd86a'); house(c, 570, 322, 140, 160, '#e87aa0');
    c.fillStyle = lg(c, 0, 320, 0, 480, [0, '#e6c9a0', 1, '#c9a070']); c.fillRect(0, 320, W, 160); c.strokeStyle = 'rgba(120,80,40,.3)'; c.lineWidth = 1.5; for (var i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 334 + i * i * 5); c.lineTo(W, 334 + i * i * 5); c.stroke(); } for (i = -6; i < 18; i++) { c.beginPath(); c.moveTo(360 + (i - 6) * 30, 320); c.lineTo(360 + (i - 6) * 120, 480); c.stroke(); }
    ell(c, 360, 404, 104, 26, 0); c.fillStyle = '#b8a890'; c.fill(); ell(c, 360, 398, 96, 22, 0); c.fillStyle = '#6fd0e8'; c.fill(); c.fillStyle = '#c8b89c'; c.fillRect(350, 350, 20, 48); ell(c, 360, 350, 34, 9, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; for (i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(360, 346); c.quadraticCurveTo(360 + i * 40, 316, 360 + i * 62, 392); c.stroke(); }
    papel(c, 0, 120, 300, 150, 9, 30, t); papel(c, 420, 150, W, 110, 9, 30, t);
  },
  function (c, W, t) { /* 7 시장 골목 */
    sky(c, W, '#78c0ec', '#ffe6c0'); cloud(c, 500, 140, 0.9);
    house(c, 0, 330, 170, 190, '#f08a5a', { nodoor: 1 }); house(c, 170, 330, 130, 150, '#f6d070', { nodoor: 1 }); house(c, 300, 330, 130, 178, '#7ac0d8', { nodoor: 1 }); house(c, 430, 330, 140, 140, '#e88ab0', { nodoor: 1 }); house(c, 570, 330, 150, 196, '#9ad07a', { nodoor: 1 });
    c.fillStyle = lg(c, 0, 328, 0, 480, [0, '#d8b890', 1, '#b89060']); c.fillRect(0, 328, W, 152);
    stall(c, 30, 400, 170, '#e0281e'); stall(c, 270, 392, 170, '#2aa6a0'); stall(c, 520, 404, 180, '#ff8a1e');
    papel(c, 0, 130, W, 150, 16, 36, t);
  },
  function (c, W) { /* 8 화산 기슭 */
    sky(c, W, '#ff9a5a', '#ffe08a'); sun(c, 130, 230, 46, '#fff0b0', 'rgba(255,200,120,.6)');
    c.fillStyle = 'rgba(120,90,110,.5)'; [[420, 96, 44], [470, 70, 56], [530, 60, 44], [580, 76, 34]].forEach(function (p) { ell(c, p[0], p[1], p[2], p[2] * 0.6, 0); c.fill(); });
    c.fillStyle = lg(c, 0, 110, 0, 310, [0, '#6a4a5a', 1, '#a86a5a']); c.beginPath(); c.moveTo(150, 310); c.lineTo(350, 128); c.lineTo(378, 138); c.lineTo(402, 124); c.lineTo(430, 136); c.lineTo(660, 310); c.closePath(); c.fill();
    c.fillStyle = '#ff5a2a'; c.beginPath(); c.moveTo(352, 130); c.lineTo(378, 140); c.lineTo(402, 126); c.lineTo(428, 137); c.lineTo(408, 176); c.lineTo(392, 150); c.lineTo(374, 196); c.lineTo(364, 152); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(150, 310); c.lineTo(350, 128); c.lineTo(330, 310); c.closePath(); c.fill();
    ridge(c, W, HZ + 6, 44, 41, '#8a5a4a', '#a8705a', 1.5);
    ground(c, W, HZ, '#d8a066', '#a86a40', 44, 'rgba(90,40,20,.3)');
    function agave(x, y, s) { for (var i = 0; i < 7; i++) { var a = -Math.PI * 0.5 + (i - 3) * 0.36; c.fillStyle = i % 2 ? '#5aa08a' : '#48887a'; c.beginPath(); c.moveTo(x - 6 * s, y); c.quadraticCurveTo(x + Math.cos(a) * 30 * s, y + Math.sin(a) * 30 * s, x + Math.cos(a) * 62 * s, y + Math.sin(a) * 62 * s); c.quadraticCurveTo(x + Math.cos(a) * 26 * s + 8 * s, y + Math.sin(a) * 26 * s, x + 6 * s, y); c.closePath(); c.fill(); } }
    agave(90, 400, 1.3); agave(260, 360, 0.8); agave(470, 372, 0.9); agave(640, 410, 1.4);
  },
  function (c, W) { /* 9 정글 유적 */
    sky(c, W, '#7ad0c8', '#e8f6c0'); sun(c, 560, 130, 34, '#fffbe0'); cloud(c, 180, 140, 0.9, '#f6fff0', 'rgba(150,200,180,.8)');
    ridge(c, W, HZ, 110, 51, '#4a9a6a', '#62b07a'); 
    for (var i = 0; i < 5; i++) { var w = 300 - i * 52, y = 310 - i * 34; c.fillStyle = lg(c, 360 - w / 2, 0, 360 + w / 2, 0, [0, '#d8d0b0', 0.6, '#bcb494', 1, '#8a8468']); c.fillRect(360 - w / 2, y - 34, w, 34); c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(360 - w / 2, y - 6, w, 6); }
    c.fillStyle = '#9a9478'; c.fillRect(338, 120, 44, 54); c.fillStyle = '#3a3428'; c.fillRect(350, 140, 20, 34); c.fillStyle = '#a8a284'; c.fillRect(346, 172, 28, 138); c.strokeStyle = 'rgba(60,50,30,.4)'; c.lineWidth = 2; for (i = 0; i < 12; i++) { c.beginPath(); c.moveTo(346, 182 + i * 11); c.lineTo(374, 182 + i * 11); c.stroke(); }
    c.strokeStyle = '#3f8a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(250, 250); c.quadraticCurveTo(262, 290, 244, 310); c.moveTo(470, 216); c.quadraticCurveTo(486, 260, 462, 300); c.stroke();
    ground(c, W, HZ + 6, '#8ac85a', '#4a8a34');
    bush(c, 70, 350, 54, '#2f8a3e'); bush(c, 650, 356, 60, '#2a7a3a'); bush(c, 190, 420, 34, '#4aa84a'); bush(c, 540, 424, 36, '#3f9a44');
    palm(c, 110, 420, 250, 0.1); palm(c, 620, 426, 270, -0.12);
    c.fillStyle = '#ff5f9a'; [[180, 400], [560, 404], [300, 440]].forEach(function (p) { for (var k = 0; k < 5; k++) { ell(c, p[0] + Math.cos(k * 1.26) * 7, p[1] + Math.sin(k * 1.26) * 7, 6, 4, k * 1.26); c.fill(); } });
  },
  function (c, W, t) { /* 10 밤의 도시 */
    sky(c, W, '#1a1a4a', '#5a3a7a'); stars(c, W, 61, 60); sun(c, 590, 140, 34, '#fff6d0', 'rgba(255,250,210,.3)'); c.fillStyle = '#1e1e4e'; ell(c, 604, 132, 28, 28, 0); c.fill();
    var R = A.rng(62), x = -10, i, j;
    while (x < W) { var w = 60 + R() * 60, h = 90 + R() * 130, col = mix('#2a2a5a', '#4a3a7a', R()); c.fillStyle = col; c.fillRect(x, 320 - h, w, h); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x, 320 - h, 6, h);
      for (i = 0; i < Math.floor(w / 20); i++) for (j = 0; j < Math.floor(h / 24) - 1; j++) { if (R() < 0.6) { c.fillStyle = R() < 0.8 ? '#ffe27a' : '#8ae0ff'; c.fillRect(x + 7 + i * 20, 320 - h + 10 + j * 24, 10, 13); } } x += w + 4; }
    c.fillStyle = lg(c, 0, 318, 0, 480, [0, '#4a3a6a', 1, '#2a2248']); c.fillRect(0, 318, W, 162); c.fillStyle = 'rgba(255,226,122,.5)'; for (i = 0; i < 8; i++) c.fillRect(20 + i * 96, 392, 50, 6);
    [110, 610].forEach(function (lx) { c.fillStyle = '#1a1a34'; c.fillRect(lx - 4, 250, 8, 170); c.fillRect(lx - 4, 250, 40, 6); c.fillStyle = rg(c, lx + 34, 268, 2, 70, [0, 'rgba(255,236,150,.8)', 1, 'rgba(255,236,150,0)']); c.fillRect(lx - 40, 200, 150, 150); c.fillStyle = '#fff6c0'; ell(c, lx + 34, 262, 9, 7, 0); c.fill(); });
    var cols = ['#ff5f6a', '#ffd034', '#6ce0a0', '#6ac0ff']; c.strokeStyle = 'rgba(20,20,40,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 130); c.quadraticCurveTo(360, 220, W, 130); c.stroke();
    for (i = 0; i < 15; i++) { var k = (i + 0.5) / 15, bx = k * W, by = 130 + Math.sin(k * Math.PI) * 45 + 8, on = Math.sin((t || 0) * 3 + i * 1.7) > -0.3; c.fillStyle = on ? 'rgba(255,255,220,.25)' : 'rgba(0,0,0,0)'; ell(c, bx, by, 16, 16, 0); c.fill(); c.fillStyle = on ? cols[i % 4] : '#555070'; ell(c, bx, by, 6, 8, 0); c.fill(); }
  },
  function (c, W, t) { /* 11 타코 축제 */
    sky(c, W, '#141440', '#6a2a6a'); stars(c, W, 71, 50);
    var fw = [[130, 150, 62, '#ff5f9a'], [560, 130, 74, '#ffd034'], [350, 200, 50, '#6ce0ff'], [660, 240, 40, '#8aff8a']], i, j;
    fw.forEach(function (f, n) { var ph = ((t || 0) * 0.5 + n * 0.37) % 1, q = f[2] * (0.35 + ph * 0.75); c.globalAlpha = 1 - ph * 0.8; c.strokeStyle = f[3]; c.lineWidth = 3; c.lineCap = 'round'; for (j = 0; j < 14; j++) { var a = j / 14 * TAU; c.beginPath(); c.moveTo(f[0] + Math.cos(a) * q * 0.45, f[1] + Math.sin(a) * q * 0.45); c.lineTo(f[0] + Math.cos(a) * q, f[1] + Math.sin(a) * q + ph * 8); c.stroke(); } c.fillStyle = '#fff'; ell(c, f[0], f[1], 4, 4, 0); c.fill(); c.globalAlpha = 1; });
    c.save(); c.translate(360, 250); c.strokeStyle = '#ffd034'; c.lineWidth = 4; ell(c, 0, 0, 88, 88, 0); c.stroke(); c.lineWidth = 2; for (i = 0; i < 10; i++) { var a = i / 10 * TAU + (t || 0) * 0.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 88, Math.sin(a) * 88); c.stroke(); c.fillStyle = A.PCOL[i % 6]; rrp(c, Math.cos(a) * 88 - 10, Math.sin(a) * 88 - 2, 20, 16, 5); c.fill(); } c.restore();
    c.fillStyle = '#3a2a5a'; c.beginPath(); c.moveTo(330, 330); c.lineTo(360, 250); c.lineTo(390, 330); c.closePath(); c.fill();
    house(c, 0, 330, 150, 130, '#5a3a7a', { night: 1, nodoor: 1 }); house(c, 560, 330, 160, 150, '#4a3a8a', { night: 1, nodoor: 1 });
    c.fillStyle = lg(c, 0, 326, 0, 480, [0, '#5a3a6a', 1, '#34224a']); c.fillRect(0, 326, W, 154);
    stall(c, 150, 396, 150, '#e0281e'); stall(c, 430, 396, 150, '#2aa6a0');
    papel(c, 0, 118, W, 126, 16, 40, t); papel(c, 0, 160, 360, 250, 8, 20, t); papel(c, 360, 250, W, 160, 8, 20, t);
    c.fillStyle = rg(c, 360, 420, 20, 420, [0, 'rgba(255,200,120,.25)', 1, 'rgba(255,200,120,0)']); c.fillRect(0, 100, W, 380);
  }
];
function scene(c, i, W, H, t) { c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip(); SCENES[i](c, W, t || 0); c.restore(); }
var ANIM = { 6: 1, 7: 1, 10: 1, 11: 1 };

/* 차양(줄무늬) */
function awning(c, W) {
  var n = 9, w = W / n, i;
  c.fillStyle = 'rgba(30,10,10,.25)'; c.fillRect(0, 70, W, 44);
  for (i = 0; i < n; i++) {
    var col = i % 2 ? '#fff3d8' : '#e0281e';
    c.fillStyle = lg(c, 0, 0, 0, 104, [0, lit(col, -0.28), 0.5, col, 1, lit(col, -0.12)]);
    c.beginPath(); c.moveTo(i * w, 0); c.lineTo((i + 1) * w, 0); c.lineTo((i + 1) * w, 74); c.ellipse((i + 0.5) * w, 74, w / 2, 28, 0, 0, Math.PI); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,20,10,.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse((i + 0.5) * w, 74, w / 2 - 1, 27, 0, 0, Math.PI); c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 50, W, 6);
}
/* 선반(손님 쪽 턱) */
function ledge(c, W, y) {
  c.fillStyle = 'rgba(30,15,5,.3)'; c.fillRect(0, y - 8, W, 10);
  c.fillStyle = lg(c, 0, y, 0, y + 16, [0, '#fff0cc', 1, '#e0b070']); c.fillRect(0, y, W, 16);
  var cols = ['#2aa6c0', '#ffd034', '#fff6e0', '#e8387a'], s = 40;
  for (var i = 0; i < W / s; i++) { var x = i * s, col = cols[i % 4]; c.fillStyle = col; c.fillRect(x, y + 16, s, 26);
    c.fillStyle = lit(col, -0.25); c.beginPath(); c.moveTo(x + s / 2, y + 19); c.lineTo(x + s - 6, y + 29); c.lineTo(x + s / 2, y + 39); c.lineTo(x + 6, y + 29); c.closePath(); c.fill(); c.fillStyle = lit(col, 0.5); ell(c, x + s / 2, y + 29, 4, 4, 0); c.fill();
    c.strokeStyle = 'rgba(70,40,20,.5)'; c.lineWidth = 1.5; c.strokeRect(x, y + 16, s, 26); }
  c.fillStyle = 'rgba(30,15,5,.28)'; c.fillRect(0, y + 42, W, 8);
}
/* 조리대 */
function counter(c, W, y0, H) {
  c.fillStyle = lg(c, 0, y0, 0, H, [0, '#eec88c', 1, '#d49c58']); c.fillRect(0, y0, W, H - y0);
  var R = A.rng(91); c.lineCap = 'round';
  for (var y = y0; y < H; y += 92) { c.strokeStyle = 'rgba(120,70,25,.35)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, y + 3); c.lineTo(W, y + 3); c.stroke();
    for (var k = 0; k < 9; k++) { var gx = R() * W, gy = y + 12 + R() * 70, l = 40 + R() * 120; c.strokeStyle = 'rgba(140,84,30,.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + l / 2, gy + (R() - 0.5) * 8, gx + l, gy); c.stroke(); }
    var sx = R() * W; c.strokeStyle = 'rgba(120,70,25,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx, y + 92); c.stroke(); }
  c.fillStyle = lg(c, 0, y0, 0, y0 + 26, [0, 'rgba(40,20,5,.35)', 1, 'rgba(40,20,5,0)']); c.fillRect(0, y0, W, 26);
}

/* ---------- 타코 트럭(옆모습). 바퀴 바닥 가운데가 원점, 길이 s ---------- */
function truck(c, s, t, spin) {
  var u = s / 200, bobY = Math.sin((t || 0) * 9) * 1.2 * u;
  c.save(); c.scale(u, u);
  c.fillStyle = 'rgba(60,30,10,.25)'; ell(c, 0, 2, 104, 9, 0); c.fill();
  c.translate(0, bobY);
  rrp(c, -100, -112, 150, 96, 12); c.fillStyle = lg(c, 0, -112, 0, -16, [0, '#fff6e0', 0.52, '#fff0cc', 0.53, '#2aa6a0', 1, '#1a7a78']); c.fill(); c.strokeStyle = '#4a2412'; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
  c.beginPath(); c.moveTo(50, -92); c.lineTo(78, -92); c.quadraticCurveTo(98, -88, 102, -56); c.lineTo(102, -16); c.lineTo(50, -16); c.closePath(); c.fillStyle = lg(c, 0, -92, 0, -16, [0, '#3fc0b8', 1, '#1a7a78']); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(60, -82); c.lineTo(76, -82); c.quadraticCurveTo(90, -78, 93, -56); c.lineTo(60, -56); c.closePath(); c.fillStyle = '#bfeaf6'; c.fill(); c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(64, -78, 5, 18);
  rrp(c, -84, -92, 92, 40, 5); c.fillStyle = '#3a2418'; c.fill(); c.stroke();
  for (var i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#fff3d8' : '#e0281e'; c.beginPath(); c.moveTo(-90 + i * 21, -98); c.lineTo(-69 + i * 21, -98); c.lineTo(-67 + i * 21, -82); c.arc(-77.5 + i * 21, -82, 10.5, 0, Math.PI); c.closePath(); c.fill(); }
  c.strokeStyle = '#4a2412'; c.lineWidth = 2.5; c.strokeRect(-90, -100, 105, 4);
  c.fillStyle = '#ffd034'; c.fillRect(102, -40, 6, 10); c.fillStyle = '#c0c8d0'; c.fillRect(-106, -26, 214, 10); c.strokeRect(-106, -26, 214, 10);
  c.save(); c.translate(-26, -128); A.tacoFull(c, 34); c.restore();
  c.translate(0, -bobY);
  [-58, 62].forEach(function (x) { ell(c, x, -16, 20, 20, 0); c.fillStyle = '#2a2420'; c.fill(); c.strokeStyle = '#120e0c'; c.lineWidth = 3; c.stroke(); ell(c, x, -16, 9, 9, 0); c.fillStyle = '#d8dee4'; c.fill(); c.strokeStyle = '#5a646e'; c.lineWidth = 2; c.stroke();
    c.save(); c.translate(x, -16); c.rotate(spin == null ? (t || 0) * 8 : spin); c.strokeStyle = '#5a646e'; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.moveTo(0, -8); c.lineTo(0, 8); c.stroke(); c.restore(); });
  c.restore();
}

/* ---------- 지도 ---------- */
function node(i, W) { var row = Math.floor(i / 3), k = i % 3, col = row % 2 ? 2 - k : k; return [120 + col * 240, 612 - row * 106]; }
function mapPos(p, W) { var i = Math.max(0, Math.min(10.999, p)), a = node(Math.floor(i), W), b = node(Math.floor(i) + 1, W), k = i - Math.floor(i); if (p >= 11) return node(11, W); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
function map(c, W, H, cur, tp, t, font) {
  var i, R = A.rng(77);
  c.fillStyle = lg(c, 0, 0, 0, H, [0, '#f6e4b4', 1, '#e6c88a']); c.fillRect(0, 0, W, H);
  for (i = 0; i < 26; i++) { c.fillStyle = 'rgba(160,110,50,' + (0.04 + R() * 0.06) + ')'; ell(c, R() * W, R() * H, 30 + R() * 90, 20 + R() * 60, R() * 3); c.fill(); }
  c.fillStyle = rg(c, W / 2, H / 2, H * 0.3, H * 0.75, [0, 'rgba(120,70,20,0)', 1, 'rgba(120,70,20,.35)']); c.fillRect(0, 0, W, H);
  /* 낙서: 선인장·산·파도 */
  c.strokeStyle = 'rgba(120,70,30,.5)'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
  [[236, 590], [40, 470], [680, 230]].forEach(function (p) { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 34); c.moveTo(p[0], p[1] - 14); c.lineTo(p[0] - 10, p[1] - 14); c.lineTo(p[0] - 10, p[1] - 26); c.moveTo(p[0], p[1] - 10); c.lineTo(p[0] + 10, p[1] - 10); c.lineTo(p[0] + 10, p[1] - 22); c.stroke(); });
  [[470, 500], [520, 496], [240, 356], [480, 240]].forEach(function (p) { c.beginPath(); c.moveTo(p[0] - 26, p[1]); c.lineTo(p[0], p[1] - 30); c.lineTo(p[0] + 12, p[1] - 14); c.lineTo(p[0] + 22, p[1] - 24); c.lineTo(p[0] + 40, p[1]); c.stroke(); });
  [[600, 600], [640, 480], [50, 330], [250, 130]].forEach(function (p) { for (var k = 0; k < 2; k++) { c.beginPath(); c.moveTo(p[0] - 24, p[1] + k * 10); c.quadraticCurveTo(p[0] - 12, p[1] - 8 + k * 10, p[0], p[1] + k * 10); c.quadraticCurveTo(p[0] + 12, p[1] + 8 + k * 10, p[0] + 24, p[1] + k * 10); c.stroke(); } });
  /* 길 */
  c.setLineDash([4, 16]); c.strokeStyle = '#8a4a1e'; c.lineWidth = 7; c.beginPath(); for (i = 0; i < 12; i++) { var p = node(i, W); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.stroke(); c.setLineDash([]);
  for (i = 0; i < 12; i++) {
    var q = node(i, W), done = i < cur, now = i === cur, rad = now ? 34 + Math.sin(t * 5) * 3 : 28;
    c.fillStyle = 'rgba(80,40,10,.3)'; ell(c, q[0] + 3, q[1] + 5, rad, rad, 0); c.fill();
    ell(c, q[0], q[1], rad, rad, 0); c.fillStyle = done ? lg(c, 0, q[1] - rad, 0, q[1] + rad, [0, '#8ad85a', 1, '#3f9a3a']) : now ? lg(c, 0, q[1] - rad, 0, q[1] + rad, [0, '#ff7a5a', 1, '#d9281e']) : lg(c, 0, q[1] - rad, 0, q[1] + rad, [0, '#fff6e0', 1, '#e0c898']); c.fill();
    c.strokeStyle = '#4a2412'; c.lineWidth = 4; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, q[0] - rad * 0.3, q[1] - rad * 0.42, rad * 0.36, rad * 0.18, -0.5); c.fill();
    if (done) { c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(q[0] - 12, q[1]); c.lineTo(q[0] - 3, q[1] + 10); c.lineTo(q[0] + 13, q[1] - 10); c.stroke(); }
    else { c.fillStyle = now ? '#fff' : '#8a5a2a'; c.font = '30px ' + (font || 'sans-serif'); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), q[0], q[1] + 2); }
  }
  var fl = node(11, W); c.strokeStyle = '#4a2412'; c.lineWidth = 4; c.beginPath(); c.moveTo(fl[0] + 26, fl[1] - 20); c.lineTo(fl[0] + 26, fl[1] - 78); c.stroke(); c.fillStyle = '#e8387a'; c.beginPath(); c.moveTo(fl[0] + 28, fl[1] - 78); c.lineTo(fl[0] + 68, fl[1] - 66); c.lineTo(fl[0] + 28, fl[1] - 52); c.closePath(); c.fill(); c.stroke();
  var tpz = mapPos(tp, W), prev = mapPos(Math.max(0, tp - 0.05), W), dir = tpz[0] < prev[0] - 0.01 ? -1 : 1;
  c.save(); c.translate(tpz[0], tpz[1] - 30); c.scale(dir, 1); truck(c, 104, tp % 1 ? t : 0); c.restore();
}

/* ---------- 상점 아이콘 (가운데 원점, 반지름 q) ---------- */
function shopIcon(c, id, q) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (id === 'fire') {
    c.beginPath(); c.moveTo(0, -q); c.bezierCurveTo(q * 0.2, -q * 0.4, q * 0.9, -q * 0.2, q * 0.66, q * 0.4); c.bezierCurveTo(q * 0.5, q * 0.9, -q * 0.5, q * 0.9, -q * 0.66, q * 0.4); c.bezierCurveTo(-q * 0.86, -q * 0.1, -q * 0.3, -q * 0.3, 0, -q); c.closePath();
    c.fillStyle = lg(c, 0, -q, 0, q, [0, '#ffb02a', 1, '#e8381e']); c.fill(); c.strokeStyle = '#7a1a0a'; c.lineWidth = q * 0.1; c.stroke();
    c.beginPath(); c.moveTo(0, -q * 0.2); c.bezierCurveTo(q * 0.44, q * 0.2, q * 0.3, q * 0.7, 0, q * 0.7); c.bezierCurveTo(-q * 0.3, q * 0.7, -q * 0.44, q * 0.2, 0, -q * 0.2); c.fillStyle = '#ffe66a'; c.fill();
  } else if (id === 'burner') { A.comal(c, q * 0.72, 1, 0, 0.3); }
  else if (id === 'parasol') {
    c.strokeStyle = '#7a4a22'; c.lineWidth = q * 0.12; c.beginPath(); c.moveTo(0, -q * 0.5); c.lineTo(0, q * 0.95); c.stroke();
    for (var i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fff6e0' : '#ff5f6a'; c.beginPath(); c.moveTo(0, -q * 0.9); c.arc(0, -q * 0.05, q * 0.98, Math.PI * (1.03 + i * 0.157), Math.PI * (1.03 + (i + 1) * 0.157)); c.closePath(); c.fill(); }
    c.strokeStyle = '#7a1a2a'; c.lineWidth = q * 0.08; c.beginPath(); c.arc(0, -q * 0.05, q * 0.98, Math.PI * 1.03, Math.PI * 1.97); c.closePath(); c.stroke();
  } else if (id === 'tip') {
    rrp(c, -q * 0.6, -q * 0.5, q * 1.2, q * 1.4, q * 0.24); c.fillStyle = 'rgba(190,235,250,.75)'; c.fill(); c.strokeStyle = '#3a6a82'; c.lineWidth = q * 0.09; c.stroke();
    [[-0.22, 0.56], [0.24, 0.6], [0, 0.3], [-0.26, 0.08], [0.26, 0.1]].forEach(function (p) { c.save(); c.translate(p[0] * q, p[1] * q); A.coin(c, q * 0.26); c.restore(); });
    rrp(c, -q * 0.7, -q * 0.74, q * 1.4, q * 0.3, q * 0.1); c.fillStyle = '#e0281e'; c.fill(); c.strokeStyle = '#7a1a0a'; c.stroke(); c.fillStyle = '#3a1a0a'; c.fillRect(-q * 0.3, -q * 0.64, q * 0.6, q * 0.08);
    c.fillStyle = 'rgba(255,255,255,.6)'; rrp(c, -q * 0.48, -q * 0.36, q * 0.14, q * 1.0, q * 0.06); c.fill();
  } else if (id === 'pinata') { c.save(); c.translate(-q * 0.05, q * 0.22); A.pinata(c, q * 1.25, 1); c.restore(); }
  else if (id === 'heart') { A.heart(c, q * 0.82, 1); }
}

BG = { papel: papel, scene: scene, ANIM: ANIM, awning: awning, ledge: ledge, counter: counter, truck: truck, map: map, node: node, mapPos: mapPos, shopIcon: shopIcon, N: 12 };
})();
