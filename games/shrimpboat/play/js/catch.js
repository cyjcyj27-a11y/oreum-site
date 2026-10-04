/* 새우잡이배 — 그물에 딸려 오는 것들의 모양. 한 번 만들어 같이 쓴다(도형 공유) */
(function () {
'use strict';
var T = THREE, PI = Math.PI, C = SB.creatures = {}, geo = {}, mats = {};
function body(b, pts, col, segs) {                 // 등 곡선을 따라 타원 마디를 이어 붙인 몸통. pts: [x, y, 반지름 옆, 세로, 앞뒤, 색]
  for (var i = 0; i < pts.length; i++) { var p = pts[i]; b.put(new T.SphereGeometry(1, segs || 10, 7), p[0], p[1], 0, { sx: p[4] || p[2] * 1.3, sy: p[3], sz: p[2], col: p[5] || col }); }
}
function shrimp(b) {                                // 길이 0.12m, 머리 +x, 등 굽음
  var c = [0.78, 0.62, 0.58], cd = [0.62, 0.42, 0.4];
  body(b, [[0.035, 0.012, 0.014, 0.013, 0.03, [0.72, 0.6, 0.56]], [0.012, 0.016, 0.013, 0.013, 0.016], [-0.006, 0.017, 0.012, 0.012, 0.014], [-0.022, 0.015, 0.011, 0.011, 0.013], [-0.036, 0.011, 0.0095, 0.0095, 0.012, cd], [-0.048, 0.006, 0.008, 0.008, 0.011, cd]], c);
  b.put(new T.ConeGeometry(0.014, 0.022, 6), -0.064, 0.002, 0, { rz: PI / 2, sx: 1, sz: 0.35, col: [0.85, 0.45, 0.4] });
  b.put(new T.ConeGeometry(0.004, 0.03, 4), 0.068, 0.018, 0, { rz: -PI / 2 + 0.25, col: [0.85, 0.5, 0.45] });
  [-1, 1].forEach(function (s) {
    b.put(new T.SphereGeometry(0.0042, 6, 5), 0.05, 0.02, s * 0.008, { col: [0.05, 0.05, 0.05] });
    b.tube([0.055, 0.012, s * 0.006], [0.15, 0.035, s * 0.03], 0.0009, { col: [0.75, 0.45, 0.4], seg: 3 });
    for (var k = 0; k < 4; k++) b.tube([0.02 - k * 0.012, 0.005, s * 0.008], [0.02 - k * 0.012 + 0.004, -0.008, s * 0.018], 0.0014, { col: [0.75, 0.5, 0.46], seg: 3 });
  });
}
function fish(b, col, len) {                        // 은빛 잡어
  len = len || 0.16; var s = len / 0.16;
  b.put(new T.SphereGeometry(1, 12, 8), 0, 0.016 * s, 0, { sx: 0.07 * s, sy: 0.022 * s, sz: 0.012 * s, col: col || [0.78, 0.82, 0.86] });
  b.put(new T.SphereGeometry(1, 8, 6), 0.01 * s, 0.026 * s, 0, { sx: 0.05 * s, sy: 0.01 * s, sz: 0.011 * s, col: [0.3, 0.38, 0.45] });
  b.put(new T.ConeGeometry(0.02 * s, 0.03 * s, 4), -0.08 * s, 0.016 * s, 0, { rz: PI / 2, sz: 0.25, col: [0.5, 0.55, 0.6] });
  [-1, 1].forEach(function (k) { b.put(new T.SphereGeometry(0.006 * s, 6, 5), 0.052 * s, 0.02 * s, k * 0.008 * s, { col: [0.05, 0.05, 0.05] }); });
}
function crab(b) {
  var c = [0.62, 0.36, 0.22];
  b.put(new T.SphereGeometry(1, 12, 6), 0, 0.016, 0, { sx: 0.045, sy: 0.016, sz: 0.06, col: c });
  [-1, 1].forEach(function (s) {
    for (var k = 0; k < 4; k++) { var x = -0.025 + k * 0.016; b.tube([x, 0.012, s * 0.045], [x - 0.01, 0.004, s * 0.09], 0.004, { col: c, seg: 4 }); }
    b.tube([0.03, 0.014, s * 0.04], [0.065, 0.01, s * 0.05], 0.007, { col: c, seg: 5 }); b.put(new T.SphereGeometry(1, 8, 6), 0.075, 0.01, s * 0.05, { sx: 0.016, sy: 0.009, sz: 0.01, col: [0.75, 0.42, 0.25] });
    b.put(new T.SphereGeometry(0.004, 5, 4), 0.042, 0.03, s * 0.012, { col: [0.05, 0.05, 0.05] });
  });
}
function star(b) {
  var sh = new T.Shape(), i; for (i = 0; i < 10; i++) { var a = i * PI / 5, r = i % 2 ? 0.02 : 0.065; if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  b.put(new T.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), 0, 0.006, 0, { rx: -PI / 2, col: [0.92, 0.48, 0.18] });
}
function squid(b) {
  var c = [0.92, 0.82, 0.8];
  b.put(new T.SphereGeometry(1, 10, 8), 0.03, 0.015, 0, { sx: 0.06, sy: 0.015, sz: 0.018, col: c });
  b.put(new T.ConeGeometry(0.02, 0.03, 4), 0.085, 0.015, 0, { rz: -PI / 2, sz: 0.3, col: c });
  for (var k = 0; k < 6; k++) b.tube([-0.025, 0.012, (k - 2.5) * 0.004], [-0.09 - (k % 2) * 0.02, 0.006, (k - 2.5) * 0.012], 0.0028, { col: [0.88, 0.75, 0.72], seg: 4 });
  [-1, 1].forEach(function (s) { b.put(new T.SphereGeometry(0.005, 6, 5), -0.018, 0.02, s * 0.014, { col: [0.1, 0.1, 0.12] }); });
}
function can(b) { b.put(new T.CylinderGeometry(0.033, 0.033, 0.12, 14), 0, 0.033, 0, { rz: PI / 2, col: [0.85, 0.15, 0.12] }); b.put(new T.CylinderGeometry(0.0335, 0.0335, 0.05, 14), 0.01, 0.033, 0, { rz: PI / 2, col: [0.95, 0.95, 0.95] }); }
function bottle(b) { b.put(new T.CylinderGeometry(0.03, 0.03, 0.15, 12), 0, 0.03, 0, { rz: PI / 2, col: [0.65, 0.82, 0.9] }); b.put(new T.CylinderGeometry(0.013, 0.03, 0.04, 12), 0.095, 0.03, 0, { rz: -PI / 2, col: [0.65, 0.82, 0.9] }); b.put(new T.CylinderGeometry(0.015, 0.015, 0.018, 10), 0.123, 0.03, 0, { rz: -PI / 2, col: [0.2, 0.5, 0.25] }); b.put(new T.CylinderGeometry(0.0305, 0.0305, 0.05, 12), -0.01, 0.03, 0, { rz: PI / 2, col: [0.9, 0.2, 0.15] }); }
function slipper(b) {                               // 삼선 슬리퍼
  b.box(0, 0.01, 0, 0.26, 0.02, 0.1, { col: [0.25, 0.25, 0.28] });
  b.box(0.04, 0.035, 0, 0.11, 0.03, 0.105, { col: [0.12, 0.32, 0.72] });
  for (var k = 0; k < 3; k++) b.box(0.015 + k * 0.025, 0.051, 0, 0.012, 0.002, 0.106, { col: [0.95, 0.95, 0.95] });
}
function jelly(b) {                                  // 보름달물해파리: 흰 선별대에서 보이게 연보라 갓 + 분홍 네잎 무늬 + 늘어진 다리(10/4 "하얀게 잘안보였다")
  b.put(new T.SphereGeometry(0.075, 18, 10, 0, PI * 2, 0, PI / 2), 0, 0.0, 0, { sy: 0.42, col: [0.45, 0.24, 0.82] });
  for (var k = 0; k < 4; k++) { var a = k * PI / 2 + PI / 4; b.put(new T.TorusGeometry(0.016, 0.006, 6, 12), Math.cos(a) * 0.026, 0.03, Math.sin(a) * 0.026, { rx: PI / 2 - 0.35, col: [1.0, 0.3, 0.62] }); }
  b.put(new T.TorusGeometry(0.074, 0.005, 5, 24), 0, 0.002, 0, { rx: PI / 2, col: [0.26, 0.12, 0.55] });
  for (k = 0; k < 7; k++) { var a2 = k / 7 * PI * 2, r2 = 0.05 + (k % 2) * 0.015; b.tube([Math.cos(a2) * r2, 0.002, Math.sin(a2) * r2], [Math.cos(a2) * (r2 + 0.045), 0.002, Math.sin(a2) * (r2 + 0.045)], 0.004, { col: [0.5, 0.3, 0.85] }); }
}
function monk(b) {                                  // 아귀: 납작하고 큰 머리, 큰 입. 길이 0.42
  var c = [0.42, 0.34, 0.26];
  b.put(new T.SphereGeometry(1, 16, 10), 0.06, 0.035, 0, { sx: 0.13, sy: 0.04, sz: 0.12, col: c });
  b.put(new T.SphereGeometry(1, 12, 8), -0.1, 0.03, 0, { sx: 0.12, sy: 0.03, sz: 0.05, col: c });
  b.put(new T.ConeGeometry(0.05, 0.08, 6), -0.24, 0.03, 0, { rz: PI / 2, sz: 0.25, col: [0.35, 0.28, 0.22] });
  b.put(new T.SphereGeometry(1, 12, 6), 0.16, 0.02, 0, { sx: 0.035, sy: 0.012, sz: 0.1, col: [0.6, 0.5, 0.42] });
  for (var k = 0; k < 9; k++) b.put(new T.ConeGeometry(0.004, 0.016, 4), 0.175, 0.03, -0.08 + k * 0.02, { rz: PI, col: [0.95, 0.93, 0.85] });
  [-1, 1].forEach(function (s) { b.put(new T.SphereGeometry(0.012, 8, 6), 0.09, 0.07, s * 0.045, { col: [0.85, 0.75, 0.3] }); b.put(new T.SphereGeometry(0.006, 6, 5), 0.097, 0.077, s * 0.045, { col: [0.02, 0.02, 0.02] }); b.put(new T.SphereGeometry(1, 8, 5), 0.0, 0.03, s * 0.13, { sx: 0.05, sy: 0.006, sz: 0.04, col: [0.38, 0.3, 0.24] }); });
  b.tube([0.12, 0.07, 0], [0.19, 0.13, 0], 0.003, { col: c }); b.put(new T.SphereGeometry(0.008, 6, 5), 0.19, 0.13, 0, { col: [0.9, 0.8, 0.5] });
}
function compass(b) { b.put(new T.CylinderGeometry(0.06, 0.065, 0.035, 18), 0, 0.018, 0, { col: [0.62, 0.48, 0.2] }); b.put(new T.CircleGeometry(0.05, 18), 0, 0.037, 0, { rx: -PI / 2, col: [0.92, 0.9, 0.82] }); b.box(0, 0.039, 0, 0.006, 0.002, 0.08, { col: [0.8, 0.1, 0.1] }); b.put(new T.TorusGeometry(0.012, 0.004, 5, 10), 0.068, 0.02, 0, { ry: PI / 2, col: [0.62, 0.48, 0.2] }); }
function key(b) { b.put(new T.TorusGeometry(0.018, 0.005, 6, 14), -0.035, 0.005, 0, { rx: PI / 2, col: [0.78, 0.66, 0.32] }); b.box(0.01, 0.005, 0, 0.07, 0.008, 0.008, { col: [0.78, 0.66, 0.32] }); b.box(0.04, 0.005, 0.01, 0.008, 0.008, 0.016, { col: [0.78, 0.66, 0.32] }); b.box(0.025, 0.005, 0.009, 0.008, 0.008, 0.012, { col: [0.78, 0.66, 0.32] }); }
var BUILD = { shrimp: shrimp, fish: function (b) { fish(b); }, crab: crab, star: star, squid: squid, can: can, bottle: bottle, slipper: slipper, jelly: jelly, monk: monk, compass: compass, key: key };
C.KINDS = ['fish', 'fish', 'crab', 'star', 'squid', 'can', 'bottle', 'slipper', 'jelly', 'fish'];
C.size = { shrimp: 0.07, fish: 0.09, crab: 0.08, star: 0.07, squid: 0.09, can: 0.07, bottle: 0.08, slipper: 0.13, jelly: 0.08, monk: 0.2, compass: 0.07, key: 0.05 };
C.make = function (kind) {
  if (!geo[kind]) { var b = new SB.Batch(); BUILD[kind](b); geo[kind] = b.mesh(SB.M.pla).geometry; }
  if (!mats.std) { mats.std = new T.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x777777 }); mats.jelly = new T.MeshPhongMaterial({ vertexColors: true, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.95 }); }
  var m = new T.Mesh(geo[kind], kind === 'jelly' ? mats.jelly : mats.std); m.castShadow = true; return m;
};
})();
