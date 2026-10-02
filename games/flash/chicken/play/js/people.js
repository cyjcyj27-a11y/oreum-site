/* 치킨집 — 손님 12명(가슴 위 모습, 계산대 선이 y=0) */
var PEOPLE = (function () {
'use strict';
var A = ART, TAU = Math.PI * 2, ell = A.ell, rr = A.rr, lg = A.lg, rg = A.rg;
var SK = { a: ['#ffe2c8', '#f4c4a0', '#c98a68'], b: ['#f8d2ae', '#e8b088', '#b87a54'], c: ['#e6b488', '#cf9464', '#9a6238'] };
/* hair: 0 짧은 머리 1 단발 2 가르마 3 파마 4 민머리 5 헬멧 6 야구모자 7 묶은 머리 8 헤드폰 9 흰머리+수염 10 긴 머리+선글라스 11 스냅백 */
var LIST = [
  { id: 'boy', hair: 0, hc: '#2a2220', sk: 'a', top: '#f4f6fa', trim: '#2c3e6a', kind: 'uniform' },
  { id: 'girl', hair: 1, hc: '#3a2618', sk: 'a', top: '#fff0f2', trim: '#d8405a', kind: 'ribbon' },
  { id: 'office', hair: 2, hc: '#1e1c22', sk: 'b', top: '#e8eef6', trim: '#3a58a8', kind: 'tie', glasses: 1 },
  { id: 'granny', hair: 3, hc: '#b8b0c4', sk: 'b', top: '#9a5ab0', trim: '#f0d060', kind: 'flower' },
  { id: 'uncle', hair: 4, hc: '#3a3230', sk: 'c', top: '#f2f2ee', trim: '#c8c8c0', kind: 'tank', stache: 1 },
  { id: 'rider', hair: 5, hc: '#28b8b0', sk: 'b', top: '#28b8b0', trim: '#1a7a76', kind: 'vest' },
  { id: 'kid', hair: 6, hc: '#ffd23a', sk: 'a', top: '#58b8f0', trim: '#fff', kind: 'stripe', small: 1 },
  { id: 'runner', hair: 7, hc: '#5a341c', sk: 'c', top: '#ff7a9a', trim: '#fff', kind: 'zip' },
  { id: 'gamer', hair: 8, hc: '#4a3a8a', sk: 'a', top: '#3a3f4a', trim: '#8af06a', kind: 'hood' },
  { id: 'grandpa', hair: 9, hc: '#eeeeea', sk: 'c', top: '#6a8a5a', trim: '#e8dcc0', kind: 'cardigan' },
  { id: 'lady', hair: 10, hc: '#6a2c1a', sk: 'a', top: '#1e1e24', trim: '#ffd23a', kind: 'neck', shades: 1 },
  { id: 'rapper', hair: 11, hc: '#e0281e', sk: 'c', top: '#f4f4f0', trim: '#ffd23a', kind: 'chain' }
];
function body(c, d, sk) {
  var w = d.small ? 62 : 76;
  /* 목 */
  rr(c, -15, -100, 30, 34, 8); c.fillStyle = sk[1]; c.fill();
  c.fillStyle = 'rgba(120,60,30,.25)'; rr(c, -15, -100, 30, 12, 4); c.fill();
  /* 어깨 */
  c.beginPath(); c.moveTo(-w, 14); c.bezierCurveTo(-w - 4, -40, -w + 14, -78, -22, -82); c.lineTo(22, -82); c.bezierCurveTo(w - 14, -78, w + 4, -40, w, 14); c.closePath();
  c.fillStyle = lg(c, -w, -80, w, 10, [0, A.mix(d.top, '#ffffff', 0.25), 0.55, d.top, 1, A.mix(d.top, '#000000', 0.25)]); c.fill(); c.strokeStyle = A.mix(d.top, '#000000', 0.45); c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
  c.save(); c.clip();
  var k = d.kind;
  if (k === 'uniform') { c.fillStyle = d.trim; c.beginPath(); c.moveTo(-24, -84); c.lineTo(0, -46); c.lineTo(24, -84); c.lineTo(34, -84); c.lineTo(0, -30); c.lineTo(-34, -84); c.closePath(); c.fill(); c.fillStyle = '#d8a020'; ell(c, 30, -34, 6, 7); c.fill(); }
  else if (k === 'ribbon') { c.fillStyle = d.trim; c.beginPath(); c.moveTo(0, -62); c.lineTo(-22, -76); c.lineTo(-22, -48); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, -62); c.lineTo(22, -76); c.lineTo(22, -48); c.closePath(); c.fill(); ell(c, 0, -62, 6, 6); c.fill(); }
  else if (k === 'tie') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-26, -84); c.lineTo(0, -52); c.lineTo(26, -84); c.closePath(); c.fill(); c.fillStyle = d.trim; c.beginPath(); c.moveTo(-7, -62); c.lineTo(7, -62); c.lineTo(10, 14); c.lineTo(-10, 14); c.closePath(); c.fill(); c.fillStyle = '#4a4e5a'; c.fillRect(-w - 6, -90, w - 22, 110); c.fillRect(28, -90, w, 110); }
  else if (k === 'flower') { for (var i = 0; i < 7; i++) { var x = -60 + (i * 53) % 120, y = -66 + (i * 31) % 70; c.fillStyle = d.trim; for (var j = 0; j < 5; j++) { ell(c, x + Math.cos(j * 1.256) * 6, y + Math.sin(j * 1.256) * 6, 4.5, 4.5); c.fill(); } c.fillStyle = '#fff'; ell(c, x, y, 3, 3); c.fill(); } }
  else if (k === 'tank') { c.fillStyle = sk[1]; ell(c, -w + 4, -40, 26, 44); c.fill(); ell(c, w - 4, -40, 26, 44); c.fill(); c.fillStyle = sk[1]; ell(c, 0, -92, 26, 22); c.fill(); }
  else if (k === 'vest') { c.fillStyle = '#ffe24a'; c.fillRect(-w, -30, 2 * w, 12); c.fillStyle = '#e8f0f0'; c.fillRect(-w, -26, 2 * w, 4); c.fillStyle = d.trim; c.fillRect(-4, -84, 8, 100); }
  else if (k === 'stripe') { c.fillStyle = d.trim; for (var s = -70; s < 14; s += 22) c.fillRect(-w, s, 2 * w, 9); }
  else if (k === 'zip') { c.strokeStyle = d.trim; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -84); c.lineTo(0, 14); c.stroke(); c.fillStyle = d.trim; c.fillRect(-w, -18, 2 * w, 7); }
  else if (k === 'hood') { c.strokeStyle = A.mix(d.top, '#000000', 0.4); c.lineWidth = 5; c.beginPath(); c.arc(0, -92, 34, 0.3, Math.PI - 0.3); c.stroke(); c.strokeStyle = d.trim; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -60); c.lineTo(-12, -24); c.moveTo(10, -60); c.lineTo(12, -28); c.stroke(); }
  else if (k === 'cardigan') { c.fillStyle = d.trim; c.beginPath(); c.moveTo(-20, -84); c.lineTo(0, -40); c.lineTo(20, -84); c.closePath(); c.fill(); c.strokeStyle = A.mix(d.top, '#000000', 0.4); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 14); c.stroke(); c.fillStyle = '#5a3a1a'; ell(c, 8, -20, 4, 4); c.fill(); ell(c, 8, 0, 4, 4); c.fill(); }
  else if (k === 'neck') { c.fillStyle = sk[1]; c.beginPath(); c.moveTo(-26, -84); c.quadraticCurveTo(0, -44, 26, -84); c.closePath(); c.fill(); c.strokeStyle = d.trim; c.lineWidth = 3; c.beginPath(); c.arc(0, -90, 27, 0.5, Math.PI - 0.5); c.stroke(); ell(c, 0, -62, 5, 5); c.fillStyle = d.trim; c.fill(); }
  else if (k === 'chain') { c.strokeStyle = d.trim; c.lineWidth = 6; c.beginPath(); c.arc(0, -84, 34, 0.35, Math.PI - 0.35); c.stroke(); c.strokeStyle = '#a87a08'; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]); c.fillStyle = d.trim; rr(c, -10, -52, 20, 16, 3); c.fill(); c.strokeStyle = '#a87a08'; c.lineWidth = 2; c.stroke(); }
  c.fillStyle = lg(c, 0, -20, 0, 14, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,.22)']); c.fillRect(-w - 10, -20, 2 * w + 20, 40);
  c.restore();
}
function hairBack(c, d) {
  var h = d.hair, hc = d.hc, dk = A.mix(hc, '#000000', 0.35);
  c.fillStyle = hc; c.strokeStyle = dk; c.lineWidth = 3; c.lineJoin = 'round';
  if (h === 1) { rr(c, -66, -62, 132, 104, 44); c.fill(); c.stroke(); }
  else if (h === 10) { c.beginPath(); c.moveTo(-62, -20); c.bezierCurveTo(-70, 20, -74, 60, -62, 84); c.quadraticCurveTo(-50, 74, -40, 86); c.quadraticCurveTo(-30, 74, -22, 82); c.lineTo(22, 82); c.quadraticCurveTo(30, 74, 40, 86); c.quadraticCurveTo(50, 74, 62, 84); c.bezierCurveTo(74, 60, 70, 20, 62, -20); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = A.mix(hc, '#ffffff', 0.25); c.lineWidth = 2.5; [-52, -44, 44, 52].forEach(function (x) { c.beginPath(); c.moveTo(x, 10); c.quadraticCurveTo(x * 1.1, 44, x * 0.98, 74); c.stroke(); }); }
  else if (h === 7) { c.save(); c.translate(52, -58); c.rotate(0.5); c.beginPath(); c.moveTo(-6, 0); c.bezierCurveTo(30, -18, 54, 14, 34, 62); c.bezierCurveTo(24, 40, 10, 22, -6, 16); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  else if (h === 3) { for (var i = 0; i < 9; i++) { var a = Math.PI + i / 8 * Math.PI; ell(c, Math.cos(a) * 58, Math.sin(a) * 52 - 4, 21, 21); c.fill(); c.stroke(); } }
}
function hairFront(c, d) {
  var h = d.hair, hc = d.hc, dk = A.mix(hc, '#000000', 0.35), lt = A.mix(hc, '#ffffff', 0.35), i;
  c.fillStyle = lg(c, -50, -70, 40, 0, [0, lt, 0.5, hc, 1, dk]); c.strokeStyle = dk; c.lineWidth = 3; c.lineJoin = 'round'; c.lineCap = 'round';
  function shine() { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 46, 3.7, 4.5); c.stroke(); }
  if (h === 0) { c.beginPath(); c.moveTo(-60, -6); c.bezierCurveTo(-70, -70, 70, -70, 60, -6); c.bezierCurveTo(52, -22, 44, -30, 30, -32); c.lineTo(22, -20); c.lineTo(10, -34); c.lineTo(-2, -22); c.lineTo(-16, -34); c.lineTo(-30, -24); c.bezierCurveTo(-46, -26, -54, -18, -60, -6); c.closePath(); c.fill(); c.stroke(); shine(); }
  else if (h === 1) { c.beginPath(); c.moveTo(-62, 10); c.bezierCurveTo(-74, -74, 74, -74, 62, 10); c.bezierCurveTo(56, -8, 50, -18, 44, -22); c.bezierCurveTo(20, -14, -20, -14, -44, -22); c.bezierCurveTo(-50, -18, -56, -8, -62, 10); c.closePath(); c.fill(); c.stroke(); shine(); c.fillStyle = '#ff5a7a'; rr(c, 26, -50, 22, 9, 4); c.fill(); }
  else if (h === 2) { c.beginPath(); c.moveTo(-60, -4); c.bezierCurveTo(-72, -72, 72, -72, 60, -4); c.bezierCurveTo(54, -24, 40, -40, 10, -42); c.bezierCurveTo(-20, -24, -46, -22, -60, -4); c.closePath(); c.fill(); c.stroke(); shine(); c.strokeStyle = dk; c.lineWidth = 2; c.beginPath(); c.moveTo(12, -42); c.quadraticCurveTo(18, -56, 14, -62); c.stroke(); }
  else if (h === 3) { for (i = 0; i < 7; i++) { var a = Math.PI + 0.25 + i / 6 * (Math.PI - 0.5); c.fillStyle = i % 2 ? hc : lt; ell(c, Math.cos(a) * 44, Math.sin(a) * 42 - 6, 19, 19); c.fill(); c.strokeStyle = dk; c.lineWidth = 2.5; c.stroke(); } for (i = 0; i < 4; i++) { c.fillStyle = hc; ell(c, -30 + i * 20, -48, 16, 14); c.fill(); c.stroke(); } }
  else if (h === 4) { c.fillStyle = hc; ell(c, -57, -6, 9, 20, 0.15); c.fill(); ell(c, 57, -6, 9, 20, -0.15); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 44, 3.9, 4.5); c.stroke(); }
  else if (h === 5) { c.beginPath(); c.moveTo(-66, -4); c.bezierCurveTo(-78, -86, 78, -86, 66, -4); c.lineTo(60, -18); c.bezierCurveTo(30, -30, -30, -30, -60, -18); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-12, -66, 24, 40); c.fillStyle = 'rgba(40,60,70,.85)'; c.beginPath(); c.moveTo(-58, -30); c.bezierCurveTo(-30, -44, 30, -44, 58, -30); c.lineTo(60, -18); c.bezierCurveTo(30, -30, -30, -30, -60, -18); c.closePath(); c.fill(); shine(); c.strokeStyle = '#2a2e32'; c.lineWidth = 4; c.beginPath(); c.moveTo(-58, 0); c.quadraticCurveTo(-50, 48, -10, 56); c.stroke(); }
  else if (h === 6) { c.fillStyle = '#3a2618'; ell(c, -52, 0, 10, 16); c.fill(); ell(c, 52, 0, 10, 16); c.fill(); c.fillStyle = lg(c, -50, -70, 40, 0, [0, lt, 0.5, hc, 1, dk]); c.beginPath(); c.moveTo(-60, -14); c.bezierCurveTo(-66, -78, 66, -78, 60, -14); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-60, -16); c.bezierCurveTo(-40, -26, 60, -30, 86, -4); c.bezierCurveTo(50, -10, -20, -6, -60, -10); c.closePath(); c.fillStyle = dk; c.fill(); c.stroke(); ell(c, 0, -66, 6, 4); c.fillStyle = dk; c.fill(); }
  else if (h === 7) { c.beginPath(); c.moveTo(-60, -2); c.bezierCurveTo(-72, -72, 72, -72, 60, -2); c.bezierCurveTo(50, -30, 20, -38, 0, -38); c.bezierCurveTo(-20, -38, -50, -30, -60, -2); c.closePath(); c.fill(); c.stroke(); shine(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-59, -22); c.bezierCurveTo(-30, -44, 30, -44, 59, -22); c.lineTo(60, -12); c.bezierCurveTo(30, -34, -30, -34, -60, -12); c.closePath(); c.fill(); c.strokeStyle = '#c8c8d0'; c.lineWidth = 2; c.stroke(); }
  else if (h === 8) { c.beginPath(); c.moveTo(-60, -2); c.bezierCurveTo(-72, -74, 72, -74, 60, -2); c.bezierCurveTo(54, -20, 40, -26, 34, -14); c.bezierCurveTo(20, -34, -10, -36, -22, -18); c.bezierCurveTo(-34, -34, -54, -22, -60, -2); c.closePath(); c.fill(); c.stroke(); shine(); c.strokeStyle = '#22262a'; c.lineWidth = 8; c.beginPath(); c.arc(0, -4, 62, Math.PI + 0.15, -0.15); c.stroke(); c.fillStyle = '#22262a'; rr(c, -74, -18, 22, 40, 9); c.fill(); rr(c, 52, -18, 22, 40, 9); c.fill(); c.fillStyle = '#8af06a'; rr(c, -72, -8, 6, 20, 3); c.fill(); rr(c, 66, -8, 6, 20, 3); c.fill(); }
  else if (h === 9) { ell(c, -56, -8, 12, 22, 0.15); c.fill(); c.stroke(); ell(c, 56, -8, 12, 22, -0.15); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 44, 3.9, 4.5); c.stroke(); }
  else if (h === 10) { c.beginPath(); c.moveTo(-62, 16); c.bezierCurveTo(-76, -76, 76, -76, 62, 16); c.bezierCurveTo(58, -12, 44, -34, 8, -44); c.bezierCurveTo(-26, -38, -54, -14, -62, 16); c.closePath(); c.fill(); c.stroke(); shine(); }
  else if (h === 11) { c.fillStyle = '#2a2220'; ell(c, -54, 0, 9, 16); c.fill(); ell(c, 54, 0, 9, 16); c.fill(); c.fillStyle = lg(c, -50, -70, 40, 0, [0, lt, 0.5, hc, 1, dk]); c.beginPath(); c.moveTo(-62, -12); c.bezierCurveTo(-68, -80, 68, -80, 62, -12); c.closePath(); c.fill(); c.stroke(); rr(c, -78, -22, 150, 14, 6); c.fillStyle = dk; c.fill(); c.stroke(); c.fillStyle = '#ffd23a'; rr(c, -14, -56, 28, 22, 4); c.fill(); }
}
function face(c, d, o, sk) {
  var mood = o.mood || 'happy', t = o.t || 0, blink = o.blink != null ? o.blink : ((t + (o.seed || 0) * 3) % 3.6) < 0.12, ex = 22, ey = 4, chew = o.chew || 0;
  /* 볼 */
  c.fillStyle = mood === 'angry' ? 'rgba(240,60,40,.4)' : 'rgba(255,120,110,.38)'; ell(c, -36, 24, 12, 8); c.fill(); ell(c, 36, 24, 12, 8); c.fill();
  c.strokeStyle = '#2a1a16'; c.fillStyle = '#2a1a16'; c.lineCap = 'round'; c.lineJoin = 'round';
  if (d.shades) { c.fillStyle = '#16161c'; rr(c, -44, -8, 38, 26, 10); c.fill(); rr(c, 6, -8, 38, 26, 10); c.fill(); c.fillRect(-8, -2, 16, 5); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-36, -2); c.lineTo(-26, -2); c.moveTo(14, -2); c.lineTo(24, -2); c.stroke(); }
  else if (mood === 'yum') { c.lineWidth = 5; c.beginPath(); c.arc(-ex, ey + 4, 9, Math.PI + 0.25, -0.25); c.stroke(); c.beginPath(); c.arc(ex, ey + 4, 9, Math.PI + 0.25, -0.25); c.stroke(); }
  else if (mood === 'yuck') { c.lineWidth = 5; c.beginPath(); c.moveTo(-ex - 8, ey - 6); c.lineTo(-ex + 7, ey + 2); c.lineTo(-ex - 8, ey + 9); c.moveTo(ex + 8, ey - 6); c.lineTo(ex - 7, ey + 2); c.lineTo(ex + 8, ey + 9); c.stroke(); }
  else if (blink) { c.lineWidth = 4; c.beginPath(); c.moveTo(-ex - 8, ey + 2); c.lineTo(-ex + 8, ey + 2); c.moveTo(ex - 8, ey + 2); c.lineTo(ex + 8, ey + 2); c.stroke(); }
  else { ell(c, -ex, ey, 7.5, 9.5); c.fill(); ell(c, ex, ey, 7.5, 9.5); c.fill(); c.fillStyle = '#fff'; ell(c, -ex + 2.5, ey - 3.5, 3, 3.4); c.fill(); ell(c, ex + 2.5, ey - 3.5, 3, 3.4); c.fill(); }
  /* 눈썹 */
  c.strokeStyle = d.hair === 9 || d.hair === 3 ? '#8a8690' : '#3a2620'; c.lineWidth = 4;
  if (!d.shades) {
    var b = mood === 'angry' ? 7 : mood === 'meh' ? 3 : mood === 'yuck' ? -4 : 0;
    c.beginPath(); c.moveTo(-ex - 10, ey - 17 - b); c.lineTo(-ex + 9, ey - 18 + b); c.moveTo(ex + 10, ey - 17 - b); c.lineTo(ex - 9, ey - 18 + b); c.stroke();
  }
  if (d.glasses) { c.strokeStyle = '#22262a'; c.lineWidth = 3.5; ell(c, -ex, ey, 16, 15); c.stroke(); ell(c, ex, ey, 16, 15); c.stroke(); c.beginPath(); c.moveTo(-6, ey); c.lineTo(6, ey); c.stroke(); }
  /* 입 */
  c.strokeStyle = '#6a2a1e'; c.lineWidth = 4;
  if (mood === 'yum') { var op = 6 + 7 * Math.abs(Math.sin(chew * 9)); ell(c, 0, 32, 13, op); c.fillStyle = '#7a1e1a'; c.fill(); c.stroke(); c.fillStyle = '#ff8a8a'; ell(c, 0, 32 + op * 0.5, 7, op * 0.4); c.fill(); }
  else if (mood === 'happy') { c.beginPath(); c.arc(0, 26, 13, 0.25, Math.PI - 0.25); c.stroke(); }
  else if (mood === 'meh') { c.beginPath(); c.moveTo(-10, 34); c.lineTo(10, 32); c.stroke(); }
  else if (mood === 'angry') { c.beginPath(); c.arc(0, 42, 12, Math.PI + 0.35, -0.35); c.stroke(); }
  else { c.beginPath(); c.arc(0, 44, 13, Math.PI + 0.2, -0.2); c.stroke(); c.fillStyle = '#8ac860'; ell(c, 8, 38, 6, 8); c.fill(); }
  if (d.stache) { c.fillStyle = '#3a3230'; c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-10, 14, -24, 18, -28, 28); c.bezierCurveTo(-16, 24, -8, 26, 0, 24); c.bezierCurveTo(8, 26, 16, 24, 28, 28); c.bezierCurveTo(24, 18, 10, 14, 0, 20); c.fill(); }
  if (d.hair === 9) { c.fillStyle = '#eeeeea'; c.strokeStyle = '#b8b8b0'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-46, 22); c.bezierCurveTo(-44, 62, -16, 78, 0, 78); c.bezierCurveTo(16, 78, 44, 62, 46, 22); c.bezierCurveTo(30, 44, 16, 20, 0, 24); c.bezierCurveTo(-16, 20, -30, 44, -46, 22); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#6a2a1e'; c.lineWidth = 3.5; c.beginPath(); if (mood === 'happy' || mood === 'yum') c.arc(0, 36, 9, 0.3, Math.PI - 0.3); else { c.moveTo(-8, 44); c.lineTo(8, 44); } c.stroke(); }
}
/* o: {mood, t, seed, eat: 'plain'|'yang'|'soy'|null, chew} */
function person(c, d, o) {
  var sk = SK[d.sk], t = o.t || 0, sc = d.small ? 0.86 : 1, bob = o.still ? 0 : Math.sin(t * 2.2 + (o.seed || 0)) * 2.5, mood = o.mood || 'happy';
  c.save(); c.scale(sc, sc);
  if (mood === 'angry' && !o.still) c.translate(Math.sin(t * 30) * 1.5, 0);
  body(c, d, sk);
  c.save(); c.translate(0, -152 + bob); if (mood === 'yum') c.rotate(Math.sin((o.chew || 0) * 9) * 0.04);
  hairBack(c, d);
  /* 귀 */
  c.fillStyle = sk[1]; c.strokeStyle = sk[2]; c.lineWidth = 2.5; ell(c, -58, 6, 9, 12); c.fill(); c.stroke(); ell(c, 58, 6, 9, 12); c.fill(); c.stroke();
  ell(c, 0, 0, 60, 57); c.fillStyle = rg(c, 0, 0, 6, 70, [0, sk[0], 0.7, sk[1], 1, A.mix(sk[1], sk[2], 0.5)], -18, -22); c.fill(); c.strokeStyle = sk[2]; c.lineWidth = 3; c.stroke();
  face(c, d, o, sk);
  hairFront(c, d);
  c.restore();
  if (o.eat) {
    var lift = Math.abs(Math.sin((o.chew || 0) * 4.5));
    c.save(); c.translate(48 - lift * 22, -70 - lift * 34 + bob); c.rotate(-0.5 + lift * 0.3);
    c.save(); c.translate(0, -26); A.drum(c, 30, o.eat); c.restore();
    ell(c, 6, 14, 15, 14); c.fillStyle = sk[1]; c.fill(); c.strokeStyle = sk[2]; c.lineWidth = 2.5; c.stroke();
    c.restore();
  }
  c.restore();
}
return { LIST: LIST, person: person, face: face, SK: SK };
})();
