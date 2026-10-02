/* 치킨집 — 상점 그림 */
(function () {
'use strict';
var A = ART, ell = A.ell, rr = A.rr, lg = A.lg, rg = A.rg;
function shopIcon(c, id, r) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (id === 'fire') { c.beginPath(); c.moveTo(0, -r); c.bezierCurveTo(r * 0.2, -r * 0.4, r * 0.9, -r * 0.2, r * 0.7, r * 0.45); c.bezierCurveTo(r * 0.55, r * 0.95, -r * 0.55, r * 0.95, -r * 0.7, r * 0.45); c.bezierCurveTo(-r * 0.9, -r * 0.1, -r * 0.3, -r * 0.2, -r * 0.35, -r * 0.6); c.bezierCurveTo(-r * 0.1, -r * 0.5, -r * 0.1, -r * 0.8, 0, -r); c.closePath(); c.fillStyle = lg(c, 0, -r, 0, r, [0, '#ffd23a', 0.6, '#ff7a1e', 1, '#e0281e']); c.fill(); c.strokeStyle = '#8c120c'; c.lineWidth = 3; c.stroke(); c.beginPath(); c.moveTo(0, -r * 0.1); c.bezierCurveTo(r * 0.4, r * 0.2, r * 0.35, r * 0.7, 0, r * 0.75); c.bezierCurveTo(-r * 0.35, r * 0.7, -r * 0.35, r * 0.25, 0, -r * 0.1); c.fillStyle = '#fff2a8'; c.fill(); }
  else if (id === 'fryer') { A.steel(c, -r, -r * 0.8, r * 2, r * 1.6, 8); c.strokeStyle = '#59626a'; c.lineWidth = 3; rr(c, -r, -r * 0.8, r * 2, r * 1.6, 8); c.stroke(); [-1, 1].forEach(function (s) { rr(c, s * r * 0.5 - r * 0.38, -r * 0.6, r * 0.76, r * 1.0, 5); c.fillStyle = '#e09a1e'; c.fill(); c.strokeStyle = '#59626a'; c.lineWidth = 2.5; c.stroke(); }); c.fillStyle = '#2a2e32'; rr(c, -r * 0.8, r * 0.5, r * 1.6, r * 0.16, 3); c.fill(); }
  else if (id === 'chair') { c.fillStyle = lg(c, 0, -r, 0, r, [0, '#f0c98c', 1, '#c8904a']); c.strokeStyle = '#5a3616'; c.lineWidth = 3; rr(c, -r * 0.62, -r * 0.95, r * 1.24, r * 0.9, 8); c.fill(); c.stroke(); rr(c, -r * 0.8, -r * 0.05, r * 1.6, r * 0.34, 7); c.fillStyle = '#e0281e'; c.fill(); c.stroke(); c.fillStyle = '#8a5a2c'; rr(c, -r * 0.7, r * 0.29, r * 0.2, r * 0.66, 3); c.fill(); c.stroke(); rr(c, r * 0.5, r * 0.29, r * 0.2, r * 0.66, 3); c.fill(); c.stroke(); }
  else if (id === 'tip') { rr(c, -r * 0.62, -r * 0.5, r * 1.24, r * 1.4, 12); c.fillStyle = 'rgba(200,232,244,.9)'; c.fill(); c.strokeStyle = '#5a8aa0'; c.lineWidth = 3; c.stroke(); rr(c, -r * 0.7, -r * 0.72, r * 1.4, r * 0.28, 6); c.fillStyle = '#c8281e'; c.fill(); c.strokeStyle = '#6a0c08'; c.stroke(); for (var i = 0; i < 4; i++) { c.save(); c.translate(-r * 0.24 + (i % 2) * r * 0.46, r * 0.56 - Math.floor(i / 2) * r * 0.38); A.coin(c, r * 0.24); c.restore(); } }
  else if (id === 'knife') { c.translate(-r * 0.1, 0); A.knife(c, r * 1.05); }
  else if (id === 'heart') { A.heart(c, r * 0.8, true); }
  c.restore();
}
ART.shopIcon = shopIcon;
})();
