/* 고시원 총무 — 건물. 2층~5층(k=0~3), 층마다 복도 하나와 남녀 화장실, 2층에 주방·창고·삼각형 쪽방, 서쪽에 계단실
   좌표: x 복도 길이 방향(0~15.5), z 복도 가로(±0.75), y0 = 3k. 치수는 실측 비율(천장 2.4, 문 0.9x2.05, 변기 높이 0.4) */
(function () {
'use strict';
var T = THREE, FH = GS.FH, WH = GS.WH, CW = 0.75, XE = 15.5, PI = Math.PI;
var W = GS.world = { cols: [], stair: [], lamps: [], floors: [], toilets: [], doors: {}, group: null, hits: null };
var M;
function seg(list, x1, z1, x2, z2) { list.push({ x1: x1, z1: z1, x2: x2, z2: z2 }); }
function boxCol(list, cx, cz, sx, sz) { var a = cx - sx / 2, b = cx + sx / 2, c = cz - sz / 2, d = cz + sz / 2; var n = list.length; seg(list, a, c, b, c); seg(list, b, c, b, d); seg(list, b, d, a, d); seg(list, a, d, a, c); for (; n < list.length; n++) list[n].p = 1; }
W.boxCol = boxCol; W.seg = seg;

/* 벽: x 방향(z 고정) / z 방향(x 고정). o: gaps [[a,b]..] 문 자리, th 두께, h 높이, nc 충돌 없음, frame 문틀 넣을 모음 */
function wallX(b, c, xa, xb, z, y0, o) {
  o = o || {}; var th = o.th || 0.1, h = o.h || WH, x = xa, uv = { t: o.t || 2.4, tv: o.tv || 2.4, y0: y0, col: o.col };
  function piece(p, q) { if (q - p < 0.01) return; b.box((p + q) / 2, y0 + h / 2, z, q - p, h, th, uv); if (!o.nc) seg(c, p, z, q, z); }
  (o.gaps || []).forEach(function (g) {
    piece(x, g[0]); if (h > 2.05) b.box((g[0] + g[1]) / 2, y0 + (2.05 + h) / 2, z, g[1] - g[0], h - 2.05, th, uv); x = g[1];
    if (o.frame) { var F = [0.24, 0.17, 0.11]; o.frame.box(g[0] + 0.02, y0 + 1.03, z, 0.05, 2.06, th + 0.04, { col: F }); o.frame.box(g[1] - 0.02, y0 + 1.03, z, 0.05, 2.06, th + 0.04, { col: F }); o.frame.box((g[0] + g[1]) / 2, y0 + 2.07, z, g[1] - g[0], 0.05, th + 0.04, { col: F }); }
  });
  piece(x, xb);
}
function wallZ(b, c, x, za, zb, y0, o) {
  o = o || {}; var th = o.th || 0.1, h = o.h || WH; if (zb < za) { var t = za; za = zb; zb = t; }
  b.box(x, y0 + h / 2, (za + zb) / 2, th, h, zb - za, { t: o.t || 2.4, tv: o.tv || 2.4, y0: y0, col: o.col }); if (!o.nc) seg(c, x, za, x, zb);
}
function plane(tex, w, h, x, y, z, ry, o) {          // 글자 판·표지
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshLambertMaterial({ map: tex, transparent: !!(o && o.tr) }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; if (o && o.rx) { m.rotation.order = 'YXZ'; m.rotation.x = o.rx; } m.updateMatrix(); m.matrixAutoUpdate = false; return m;
}
W.plane = plane;
function at(x, z, ry, dx, dz) { var c = Math.cos(ry), s = Math.sin(ry); return [x + dx * c + dz * s, z - dx * s + dz * c]; }

/* ---------- 위생도기 ---------- */
var CER = [0.93, 0.93, 0.9], CHR = [0.9, 0.92, 0.95];
function toilet(B, x, y, z, ry) {                     // (x,z) 는 벽에 닿는 자리, ry 는 보는 방향
  var p = at(x, z, ry, 0, 0.1), q = at(x, z, ry, 0, 0.44), pts = [], i;
  B.cer.box(p[0], y + 0.6, p[1], 0.42, 0.36, 0.19, { ry: ry, col: CER }); B.cer.box(p[0], y + 0.79, p[1], 0.45, 0.03, 0.21, { ry: ry, col: CER });
  var prof = [[0.001, 0], [0.12, 0], [0.135, 0.05], [0.12, 0.18], [0.17, 0.34], [0.2, 0.4], [0.17, 0.4], [0.13, 0.3], [0.001, 0.26]];
  for (i = 0; i < prof.length; i++) pts.push(new T.Vector2(prof[i][0], prof[i][1]));
  B.cer.put(new T.LatheGeometry(pts, 18), q[0], y, q[1], { ry: ry, sx: 0.92, sz: 1.22, col: CER });
  B.cer.put(new T.TorusGeometry(0.165, 0.03, 8, 22), q[0], y + 0.415, q[1], { ry: ry, rx: PI / 2, sx: 0.95, sy: 1.25, sz: 0.5, col: [0.86, 0.86, 0.82] });
  var l = at(x, z, ry, 0, 0.225); B.cer.box(l[0], y + 0.63, l[1], 0.38, 0.44, 0.03, { ry: ry, col: [0.88, 0.88, 0.84] });
  var f = at(x, z, ry, 0.12, 0.1); B.steel.put(new T.CylinderGeometry(0.022, 0.022, 0.02, 10), f[0], y + 0.815, f[1], { col: CHR });
  return { x: q[0], z: q[1], y: y, ry: ry };
}
function urinal(B, x, y, z, ry) {
  var p = at(x, z, ry, 0, 0.12);
  B.cer.put(new T.SphereGeometry(0.2, 14, 10), p[0], y + 0.66, p[1], { ry: ry, sx: 0.88, sy: 1.6, sz: 0.72, col: CER });
  var q = at(x, z, ry, 0, 0.2); B.pla.put(new T.SphereGeometry(0.13, 12, 8), q[0], y + 0.74, q[1], { ry: ry, sx: 0.9, sy: 1.5, sz: 0.5, col: [0.5, 0.52, 0.5] });
  var t = at(x, z, ry, 0, 0.05); B.steel.put(new T.CylinderGeometry(0.018, 0.018, 0.3, 8), t[0], y + 1.12, t[1], { col: CHR });
  B.steel.put(new T.CylinderGeometry(0.035, 0.035, 0.05, 10), t[0], y + 1.27, t[1], { col: CHR });
}
function sinkUnit(B, x, y, z, ry) {                    // 벽에서 0.5 나오는 세면대 + 거울
  var p = at(x, z, ry, 0, 0.27), fz = at(x, z, ry, 0, 0.07), nz = at(x, z, ry, 0, 0.15), mr = at(x, z, ry, 0, 0.012);
  B.cer.box(p[0], y + 0.78, p[1], 0.62, 0.14, 0.5, { ry: ry, col: CER });
  B.cer.put(new T.CylinderGeometry(0.07, 0.09, 0.71, 12), p[0], y + 0.355, p[1], { col: CER });
  B.cer.put(new T.TorusGeometry(0.19, 0.022, 8, 22), p[0], y + 0.852, p[1], { ry: ry, rx: PI / 2, sx: 1.2, sy: 0.9, sz: 0.5, col: CER });
  B.pla.put(new T.CircleGeometry(0.18, 20), p[0], y + 0.853, p[1], { ry: ry, rx: -PI / 2, sx: 1.2, sy: 0.9, col: [0.78, 0.8, 0.79] });
  B.pla.put(new T.CircleGeometry(0.025, 10), p[0], y + 0.855, p[1], { rx: -PI / 2, col: [0.2, 0.2, 0.2] });
  B.steel.put(new T.CylinderGeometry(0.016, 0.02, 0.16, 8), fz[0], y + 0.93, fz[1], { col: CHR });
  B.steel.put(new T.CylinderGeometry(0.013, 0.013, 0.12, 8), nz[0], y + 1.0, nz[1], { ry: ry, rx: PI / 2, col: CHR });
  B.pla.box(mr[0], y + 1.5, mr[1], 0.62, 0.72, 0.024, { ry: ry, col: [0.3, 0.3, 0.3] });
  return { x: p[0], z: p[1], y: y + 0.86, mx: at(x, z, ry, 0, 0.03)[0], mz: at(x, z, ry, 0, 0.03)[1], my: y + 1.5, ry: ry };
}
function lamp(B, k, x, y, z, alongX, len) {
  len = len || 1.2; var sx = alongX ? len : 0.1, sz = alongX ? 0.1 : len;
  B.pla.box(x, y + 0.025, z, sx + 0.08, 0.05, sz + 0.05, { col: [0.8, 0.8, 0.76] }); B.glow.box(x, y - 0.012, z, sx, 0.035, sz * 0.5, { col: [1, 1, 0.94] });
  W.lamps.push({ x: x, y: y - 0.25, z: z, k: k });
}

/* ---------- 화장실 한 칸. s=+1 남자(북쪽), s=-1 여자(남쪽). 안쪽 좌표 lx 0~3.5, lz 0~3 ---------- */
function toiletRoom(B, C, k, s) {
  var y0 = k * FH, X0 = 12, woman = s < 0;
  function w(lx, lz) { return [X0 + lx, s * (CW + lz)]; }
  function yaw(a) { return s > 0 ? a : PI - a; }
  var R = { k: k, g: woman ? 'w' : 'm', s: s, y0: y0, w: w, yaw: yaw, id: 't' + k + (woman ? 'w' : 'm'), toilets: [], spots: [] };
  var zN = s * (CW + 3), zc = s * (CW + 1.5);
  B.tfloor.box(X0 + 1.75, y0 - 0.1, zc, 3.5, 0.2, 3, { t: 1 });
  wallZ(B.tile, C, X0, s * CW, zN, y0); wallX(B.tile, C, X0, XE, zN, y0); wallZ(B.tile, C, XE, s * CW, zN, y0);
  wallX(B.tile, [], X0, XE, s * (CW + 0.066), y0, { th: 0.03, gaps: [[12.4, 13.3]], nc: 1 });       // 복도 벽 안쪽에 타일 한 겹
  lamp(B, k, X0 + 1.75, y0 + WH - 0.02, zc, true);
  /* 세면대와 거울: 서쪽 벽 */
  var sp = w(0.05, 2.0); R.sink = sinkUnit(B, sp[0], y0, sp[1], PI / 2); boxCol(C, X0 + 0.3, sp[1], 0.5, 0.62);
  /* 칸막이 변기 1: 동남쪽 구석, 남쪽 벽에 붙어 북쪽을 봄 */
  var P1 = [0.62, 0.66, 0.6], t1 = w(2.98, 0.05);
  /* 옆판(서쪽) + 앞판(북쪽, 서쪽 0.2m만 막고 나머지 0.85m 는 문 자리) + 바깥으로 열린 문짝 */
  B.pla.box(X0 + 2.45, y0 + 1.0, s * (CW + 0.71), 0.04, 1.8, 1.42, { col: P1 }); seg(C, X0 + 2.45, s * CW, X0 + 2.45, s * (CW + 1.42));
  B.pla.box(X0 + 2.55, y0 + 1.0, s * (CW + 1.42), 0.24, 1.8, 0.04, { col: P1 }); seg(C, X0 + 2.43, s * (CW + 1.42), X0 + 2.66, s * (CW + 1.42));
  B.pla.box(XE - 0.07, y0 + 1.0, s * (CW + 1.8), 0.035, 1.7, 0.74, { col: [0.56, 0.6, 0.55] });                       // 문짝: 동쪽 벽에 붙게 활짝
  B.steel.box(XE - 0.1, y0 + 1.0, s * (CW + 2.12), 0.03, 0.1, 0.02, { col: CHR });
  R.toilets.push(toilet(B, t1[0], y0, t1[1], yaw(0))); boxCol(C, t1[0], s * (CW + 0.33), 0.44, 0.66);
  R.tp = [{ x: X0 + 2.49, y: y0 + 0.78, z: s * (CW + 0.95), ax: 'x' }];
  B.steel.box(X0 + 2.5, y0 + 0.78, s * (CW + 0.95), 0.06, 0.02, 0.16, { col: CHR });
  if (!woman) {                                         // 남자: 북쪽 벽에 소변기 둘
    [1.45, 2.25].forEach(function (lx) { var u = w(lx, 2.95); urinal(B, u[0], y0, u[1], yaw(PI)); boxCol(C, u[0], s * (CW + 2.82), 0.36, 0.3); });
    B.pla.box(X0 + 1.85, y0 + 0.95, s * (CW + 2.8), 0.03, 0.9, 0.4, { col: P1 });
    R.urinals = [w(1.45, 2.5), w(2.25, 2.5)];
  } else {                                              // 여자: 북쪽 벽에 칸 하나 더
    var t2 = w(1.9, 2.95);
    B.pla.box(X0 + 1.35, y0 + 1.0, s * (CW + 2.55), 0.04, 1.8, 0.9, { col: P1 }); seg(C, X0 + 1.35, s * (CW + 2.1), X0 + 1.35, s * (CW + 3));
    B.pla.box(X0 + 2.43, y0 + 1.0, s * (CW + 2.55), 0.04, 1.8, 0.9, { col: P1 }); seg(C, X0 + 2.43, s * (CW + 2.1), X0 + 2.43, s * (CW + 3));
    R.toilets.push(toilet(B, t2[0], y0, t2[1], yaw(PI))); boxCol(C, t2[0], s * (CW + 2.67), 0.44, 0.66);
    R.tp.push({ x: X0 + 1.39, y: y0 + 0.78, z: s * (CW + 2.35), ax: 'x' }); B.steel.box(X0 + 1.4, y0 + 0.78, s * (CW + 2.35), 0.06, 0.02, 0.16, { col: CHR });
  }
  /* 휴지통, 빨간 대야와 바가지, 하수구 */
  var bn = w(0.3, 2.68), bk = w(1.95, 0.46), dr = w(1.55, 1.75);
  B.pla.put(new T.CylinderGeometry(0.15, 0.12, 0.34, 14, 1, true), bn[0], y0 + 0.17, bn[1], { col: [0.25, 0.42, 0.62] });
  B.pla.put(new T.CircleGeometry(0.12, 14), bn[0], y0 + 0.01, bn[1], { rx: -PI / 2, col: [0.2, 0.34, 0.5] });
  B.pla.put(new T.CylinderGeometry(0.24, 0.18, 0.2, 18, 1, true), bk[0], y0 + 0.1, bk[1], { col: [0.82, 0.12, 0.1] });
  B.pla.put(new T.TorusGeometry(0.24, 0.014, 6, 20), bk[0], y0 + 0.2, bk[1], { rx: PI / 2, col: [0.9, 0.16, 0.13] });
  B.pla.put(new T.CircleGeometry(0.225, 18), bk[0], y0 + 0.15, bk[1], { rx: -PI / 2, col: [0.42, 0.56, 0.6] });
  B.pla.put(new T.CircleGeometry(0.18, 18), bk[0], y0 + 0.012, bk[1], { rx: -PI / 2, col: [0.6, 0.08, 0.07] });
  B.pla.put(new T.CircleGeometry(0.075, 14), dr[0], y0 + 0.004, dr[1], { rx: -PI / 2, col: [0.16, 0.17, 0.17] });
  B.steel.put(new T.RingGeometry(0.06, 0.085, 14), dr[0], y0 + 0.006, dr[1], { rx: -PI / 2, col: [0.7, 0.72, 0.72] });
  R.bin = { x: bn[0], z: bn[1] }; R.bucket = { x: bk[0], z: bk[1] }; R.drain = { x: dr[0], z: dr[1] };
  /* 때가 끼는 자리 후보(바닥 f, 벽 wl). 바닥은 [lx, lz, 크기], 벽은 자리와 방향 */
  R.floorSpots = [[0.95, 0.95, 0.5], [1.75, 1.15, 0.55], [1.0, 2.3, 0.5], [2.05, 2.05, 0.48], [3.0, 1.15, 0.42], [0.75, 1.6, 0.4], [3.0, 2.55, 0.5], [1.5, 2.45, 0.45], [2.3, 2.45, 0.45]].map(function (a) { var q = w(a[0], a[1]); return { x: q[0], z: q[1], sz: a[2] }; });
  R.wallSpots = [{ x: X0 + 0.7, y: y0 + 0.45, z: zN - s * 0.062, ry: s > 0 ? PI : 0, sz: 0.55 }, { x: XE - 0.062, y: y0 + 0.55, z: s * (CW + 2.4), ry: -PI / 2, sz: 0.55 }, { x: X0 + 0.062, y: y0 + 0.5, z: s * (CW + 1.1), ry: PI / 2, sz: 0.5 }];
  R.center = w(1.6, 1.5); R.door = w(0.85, 0.3);
  return R;
}
/* ---------- 2층 주방: x 0.4~5.4, z 0.75~3.75. 북쪽 벽에 조리대(가스레인지, 도마, 개수대 둘, 쌀통, 밥솥), 동쪽에 냉장고, 서쪽에 라면 선반 ---------- */
function kitchen(B, C) {
  var K = W.kitchen = { y0: 0 }, CAB = [0.84, 0.82, 0.72], zc = 3.45;
  B.tfloor.box(2.9, -0.1, 2.25, 5, 0.2, 3, { t: 1 });
  wallZ(B.tile, C, 0.4, CW, 3.75, 0); wallX(B.tile, C, 0.4, 5.4, 3.75, 0); wallZ(B.tile, C, 5.4, CW, 3.75, 0);
  wallX(B.tile, [], 0.4, 5.4, CW + 0.066, 0, { th: 0.03, gaps: [[1.6, 2.7]], nc: 1 });
  lamp(B, 0, 2.9, WH - 0.02, 2.3, true);
  /* 조리대 몸통과 상판. 개수대(2.75~3.45)는 파 놓는다 */
  B.pla.box(1.675, 0.405, zc, 2.15, 0.81, 0.58, { col: CAB }); B.pla.box(3.975, 0.405, zc, 1.05, 0.81, 0.58, { col: CAB }); B.pla.box(3.1, 0.3, zc, 0.7, 0.6, 0.58, { col: CAB });
  for (var i = 0; i < 7; i++) B.pla.box(0.88 + i * 0.56, 0.42, 3.155, 0.012, 0.7, 0.012, { col: [0.5, 0.48, 0.4] });
  B.steel.box(1.675, 0.83, zc, 2.15, 0.04, 0.6, {}); B.steel.box(3.975, 0.83, zc, 1.05, 0.04, 0.6, {});
  B.steel.box(3.1, 0.83, 3.18, 0.7, 0.04, 0.06, {}); B.steel.box(3.1, 0.83, 3.69, 0.7, 0.04, 0.12, {}); B.steel.box(3.1, 0.76, 3.41, 0.03, 0.17, 0.42, {});
  B.steel.box(3.1, 0.61, 3.41, 0.7, 0.02, 0.42, { col: [0.75, 0.75, 0.75] }); B.steel.box(2.765, 0.72, 3.41, 0.02, 0.22, 0.42, { col: [0.8, 0.8, 0.8] }); B.steel.box(3.435, 0.72, 3.41, 0.02, 0.22, 0.42, { col: [0.8, 0.8, 0.8] });
  B.steel.box(3.1, 0.72, 3.205, 0.7, 0.22, 0.02, { col: [0.7, 0.7, 0.7] }); B.steel.box(3.1, 0.72, 3.625, 0.7, 0.22, 0.02, { col: [0.86, 0.86, 0.86] });
  B.steel.put(new T.CylinderGeometry(0.018, 0.022, 0.3, 10), 3.28, 1.0, 3.69, { col: CHR }); B.steel.put(new T.CylinderGeometry(0.015, 0.015, 0.2, 10), 3.28, 1.14, 3.6, { rx: PI / 2, col: CHR });
  B.steel.put(new T.CylinderGeometry(0.017, 0.017, 0.05, 10), 3.28, 1.115, 3.5, { col: CHR }); B.steel.box(3.35, 0.9, 3.69, 0.09, 0.02, 0.025, { col: CHR });
  boxCol(C, 2.55, zc, 3.9, 0.6);
  /* 가스레인지 */
  B.pla.box(0.98, 0.9, 3.42, 0.6, 0.1, 0.42, { col: [0.2, 0.2, 0.21] }); B.steel.box(0.98, 0.955, 3.42, 0.58, 0.012, 0.4, { col: [0.6, 0.6, 0.6] });
  [0.83, 1.13].forEach(function (x) { B.pla.put(new T.TorusGeometry(0.08, 0.014, 6, 16), x, 0.975, 3.44, { rx: PI / 2, col: [0.1, 0.1, 0.1] }); B.pla.put(new T.CylinderGeometry(0.035, 0.035, 0.02, 10), x, 0.97, 3.44, { col: [0.25, 0.22, 0.18] }); B.pla.put(new T.CylinderGeometry(0.02, 0.02, 0.03, 8), x, 0.9, 3.2, { rx: PI / 2, col: [0.75, 0.75, 0.72] }); });
  var pp = [[0.001, 0], [0.1, 0], [0.115, 0.09], [0.12, 0.092], [0.105, 0.01], [0.001, 0.012]].map(function (a) { return new T.Vector2(a[0], a[1]); });
  B.pla.put(new T.LatheGeometry(pp, 16), 1.13, 0.99, 3.44, { col: [0.86, 0.7, 0.3] }); B.pla.box(1.26, 1.07, 3.44, 0.06, 0.012, 0.03, { col: [0.86, 0.7, 0.3] }); B.pla.box(1.0, 1.07, 3.44, 0.06, 0.012, 0.03, { col: [0.86, 0.7, 0.3] });
  K.stove = { x: 0.98, y: 0.965, z: 3.42 };
  /* 도마 */
  B.pla.box(2.02, 0.862, 3.4, 0.44, 0.024, 0.3, { col: [0.86, 0.8, 0.62] }); K.board = { x: 2.02, y: 0.875, z: 3.4 };
  /* 냉장고 몸통(문은 따로 움직인다) */
  B.pla.box(5.06, 0.875, 2.2, 0.62, 1.75, 0.7, { col: [0.86, 0.87, 0.85] }); boxCol(C, 5.06, 2.2, 0.66, 0.74); K.fridge = { x: 5.06, z: 2.2 };
  /* 라면 선반 */
  [0.5, 0.95, 1.4].forEach(function (y) { B.steel.box(0.6, y, 2.5, 0.34, 0.025, 1.0, { col: [0.8, 0.8, 0.8] }); });
  [[0.45, 2.02], [0.45, 2.98], [0.75, 2.02], [0.75, 2.98]].forEach(function (q) { B.steel.box(q[0], 0.85, q[1], 0.03, 1.7, 0.03, { col: [0.7, 0.7, 0.7] }); });
  boxCol(C, 0.6, 2.5, 0.36, 1.0); K.shelf = { x: 0.6, z: 2.5, ys: [0.52, 0.97, 1.42] };
  /* 음식물 쓰레기통 */
  B.pla.put(new T.CylinderGeometry(0.17, 0.14, 0.42, 14), 0.78, 0.21, 1.2, { col: [0.86, 0.5, 0.14] }); B.pla.put(new T.CylinderGeometry(0.18, 0.18, 0.03, 14), 0.78, 0.435, 1.2, { col: [0.7, 0.38, 0.1] });
  boxCol(C, 0.78, 1.2, 0.3, 0.3); K.waste = { x: 0.78, z: 1.2 };
  K.floorSpots = [[1.6, 2.6, 0.55], [2.9, 2.3, 0.5], [4.1, 2.75, 0.5], [3.4, 1.4, 0.5], [1.7, 1.5, 0.45]];
  K.center = [2.9, 2.2];
}
/* ---------- 창고: x 0.4~2.4, z -3.25~-0.75 ---------- */
function storage(B, C) {
  var S = W.store = {};
  B.conc.box(1.4, -0.1, -2.0, 2, 0.2, 2.5, { t: 1.5 });
  wallZ(B.wall, C, 0.4, -3.25, -CW, 0); wallZ(B.wall, C, 2.4, -3.25, -CW, 0); wallX(B.wall, C, 0.4, 2.4, -3.25, 0);
  lamp(B, 0, 1.4, WH - 0.02, -2.0, false, 0.6);
  [0.45, 1.0, 1.55].forEach(function (y) { B.steel.box(1.4, y, -3.0, 1.8, 0.025, 0.4, { col: [0.8, 0.8, 0.8] }); });
  [0.55, 2.25].forEach(function (x) { B.steel.box(x, 0.9, -2.83, 0.03, 1.8, 0.03, { col: [0.7, 0.7, 0.7] }); B.steel.box(x, 0.9, -3.17, 0.03, 1.8, 0.03, { col: [0.7, 0.7, 0.7] }); });
  boxCol(C, 1.4, -3.0, 1.8, 0.42);
  var r = GS.rng(5), BX = [0.72, 0.56, 0.36];
  [[0.8, 0.46], [1.25, 0.46], [1.75, 1.01], [0.85, 1.01]].forEach(function (q) { B.pla.box(q[0], q[1] + 0.13, -3.0, 0.4, 0.24, 0.3, { col: [BX[0] * (0.9 + r() * 0.15), BX[1], BX[2]] }); });
  for (var i = 0; i < 5; i++) B.pla.put(new T.CylinderGeometry(0.045, 0.05, 0.24, 10), 1.75 + i * 0.1 - 0.2, 0.585, -2.95, { col: [0.2, 0.45, 0.75] });
  B.pla.put(new T.CylinderGeometry(0.012, 0.012, 1.3, 6), 2.25, 0.65, -1.1, { rz: 0.12, col: [0.5, 0.4, 0.25] }); B.pla.box(2.18, 0.05, -1.1, 0.26, 0.1, 0.1, { col: [0.3, 0.5, 0.75] });
  S.box = { x: 1.3, y: 0, z: -2.45 }; S.center = [1.4, -1.9];
}
/* ---------- 빈 방(퇴실한 호실): 한 칸을 만들어 두고 퇴실 날마다 그 호실 문 뒤로 옮긴다(10/4 사장님 "매번호수는 달라져야지").
   방 안 좌표 u(복도 방향, 문 가운데 0, -1.1~1.1), v(문에서 안쪽으로 0~2.85). 침대 오른쪽 벽, 책상 왼쪽 안. W.vroom.place(num) / W.vroom.clear() ---------- */
var VR = { u0: -1.1, u1: 1.1, d: 2.85, bed: { u: 0.6, v: 1.85, w: 0.9, l: 1.9, top: 0.43 }, desk: { u: -0.8, v: 2.58, w: 0.55, l: 0.5, top: 0.74 } };
function vroomBuild(scene) {
  var B = newB(), u0 = VR.u0, u1 = VR.u1, d = VR.d, cz = d / 2, w = u1 - u0;
  /* 남쪽 방(s=-1) 기준으로 만든다: z = -(CW + v). 북쪽 방은 z 를 뒤집어 놓는다 */
  B.jang.box(0, -0.1, -(CW + cz), w, 0.2, d, { t: 2 });   // 천장은 층 천장(폭 7.5)이 이미 덮는다
  B.wall.box(u0 - 0.05, WH / 2, -(CW + cz), 0.1, WH, d, { t: 2.4, tv: 2.4, y0: 0 }); B.wall.box(u1 + 0.05, WH / 2, -(CW + cz), 0.1, WH, d, { t: 2.4, tv: 2.4, y0: 0 });
  B.wall.box(0, WH / 2, -(CW + d + 0.05), w + 0.2, WH, 0.1, { t: 2.4, tv: 2.4, y0: 0 });
  var b = VR.bed, k = VR.desk;
  B.pla.box(b.u, 0.17, -(CW + b.v), b.w, 0.34, b.l, { col: [0.45, 0.33, 0.22] }); B.mat.box(b.u, 0.38, -(CW + b.v), b.w - 0.06, 0.1, b.l - 0.06, { col: [0.86, 0.85, 0.8] });
  B.pla.box(k.u, 0.37, -(CW + k.v), k.w, 0.74, k.l, { col: [0.62, 0.5, 0.34] });
  B.pla.box(0, WH + 0.005, -(CW + 1.4), 0.18, 0.05, 0.9, { col: [0.8, 0.8, 0.76] }); B.glow.box(0, WH - 0.03, -(CW + 1.4), 0.1, 0.035, 0.45, { col: [1, 1, 0.94] });
  var g = new T.Group(); flush(B, g);
  var leaf = new T.Mesh(new T.BoxGeometry(0.84, 2.0, 0.04), M.doorLeaf || (M.doorLeaf = new T.MeshLambertMaterial({ color: 0x6e4a2c })));
  leaf.rotation.y = -1.45; leaf.position.set(-0.38, 1.0, -(CW + 0.42)); g.add(leaf);
  g.visible = false; scene.add(g);
  var lampObj = { x: 0, y: -100, z: 0, k: 0 }; W.lamps.push(lampObj);
  var added = [], cur = null;
  W.vroom = {
    VR: VR, num: function () { return cur && cur.num; },
    /* 방 안 (u,v) → 세상 좌표 */
    at: function (u, v) { return cur ? { x: cur.x + u, y: cur.y0, z: cur.s * (CW + v) } : null; },
    ry: function () { return cur && cur.s > 0 ? PI : 0; },              // 방 안 물건이 문 쪽을 보는 방향
    place: function (num) {
      this.clear(); var D = W.doors[num]; if (!D) return false; cur = { num: num, x: D.x, s: D.s, y0: D.k * FH, k: D.k };
      g.position.set(D.x, D.k * FH, 0); g.scale.set(1, 1, D.s > 0 ? -1 : 1); g.visible = true;
      lampObj.x = D.x; lampObj.y = D.k * FH + WH - 0.4; lampObj.z = D.s * (CW + 1.4); lampObj.k = D.k;
      D.mesh.visible = false; var C = W.cols[D.k], j = C.indexOf(D.seg); if (j >= 0) C.splice(j, 1);
      var z = function (v) { return D.s * (CW + v); }, x = D.x, n0 = C.length;
      seg(C, x + VR.u0, z(0), x + VR.u0, z(VR.d)); seg(C, x + VR.u1, z(0), x + VR.u1, z(VR.d)); seg(C, x + VR.u0, z(VR.d), x + VR.u1, z(VR.d));
      boxCol(C, x + b.u, z(b.v), b.w, b.l); boxCol(C, x + k.u, z(k.v), k.w, k.l);
      for (var i = n0; i < C.length; i++) added.push([C, C[i]]);
      return true;
    },
    clear: function () {
      added.forEach(function (q) { var j = q[0].indexOf(q[1]); if (j >= 0) q[0].splice(j, 1); }); added = [];
      if (cur) { var D = W.doors[cur.num]; D.mesh.visible = true; if (W.cols[D.k].indexOf(D.seg) < 0) W.cols[D.k].push(D.seg); }
      cur = null; g.visible = false; lampObj.y = -100;
    },
    group: g
  };
}
/* ---------- 삼각형 쪽방: 꼭짓점 (2.6,-0.75) (6.4,-0.75) (2.6,-3.6) ---------- */
function triangle(B, C) {
  var R = W.tri = {}, ry = -Math.atan2(2.85, 3.8), BL = [0.36, 0.42, 0.56];
  B.jang.box(4.5, -0.1, -2.175, 3.8, 0.2, 2.85, { t: 2 });
  wallZ(B.wall, C, 2.6, -3.6, -CW, 0);
  B.wall.box(4.5, WH / 2, -2.175, 4.9, WH, 0.1, { ry: ry, t: 2.4, tv: 2.4, y0: 0 }); seg(C, 6.4, -CW, 2.6, -3.6);
  /* 요와 이불(빗변을 따라), 베개 */
  var n = [-0.6, 0.8], mx = 4.5 + n[0] * 0.52, mz = -2.175 + n[1] * 0.52;
  B.mat.box(mx, 0.035, mz, 1.85, 0.07, 0.8, { ry: ry, col: [0.82, 0.8, 0.72] });
  B.mat.box(mx - 0.25 * 0.8, 0.09, mz - 0.25 * 0.6, 1.25, 0.06, 0.78, { ry: ry + 0.05, col: BL }); B.mat.box(mx - 0.5 * 0.8, 0.125, mz - 0.5 * 0.6, 0.5, 0.03, 0.7, { ry: ry - 0.12, col: [0.3, 0.36, 0.5] });
  B.mat.box(mx + 0.72 * 0.8, 0.1, mz + 0.72 * 0.6, 0.3, 0.09, 0.46, { ry: ry, col: [0.9, 0.88, 0.8] });
  R.bed = { x: mx + 0.6 * 0.8, z: mz + 0.6 * 0.6, ry: ry };
  /* 책상(서쪽 벽), 방석 자리 */
  var DK = [0.62, 0.48, 0.3];
  B.pla.box(2.94, 0.69, -1.6, 0.56, 0.04, 0.96, { col: DK }); [[2.7, -1.14], [2.7, -2.06], [3.18, -1.14], [3.18, -2.06]].forEach(function (q) { B.pla.box(q[0], 0.335, q[1], 0.04, 0.67, 0.04, { col: [0.3, 0.3, 0.3] }); });
  boxCol(C, 2.94, -1.6, 0.56, 0.96);
  B.pla.box(2.72, 1.35, -1.6, 0.2, 0.025, 0.9, { col: DK });                               // 책상 위 선반
  var bc = [[0.7, 0.2, 0.2], [0.2, 0.35, 0.6], [0.85, 0.75, 0.3], [0.25, 0.5, 0.3], [0.6, 0.6, 0.62], [0.5, 0.25, 0.5]], r = GS.rng(9), z = -2.0;
  for (var i = 0; i < 9; i++) { var th = 0.03 + r() * 0.035, h = 0.2 + r() * 0.07; B.pla.box(2.72, 1.3625 + h / 2, z + th / 2, 0.15, h, th, { col: bc[i % 6] }); z += th + 0.003; }
  R.desk = { x: 2.94, y: 0.71, z: -1.6 }; R.seat = { x: 3.52, z: -1.6 };
  /* 옷걸이 봉과 옷, 전구 */
  B.steel.put(new T.CylinderGeometry(0.012, 0.012, 0.9, 6), 2.66, 1.75, -2.9, { rx: PI / 2, col: CHR });
  B.mat.box(2.72, 1.42, -2.75, 0.06, 0.6, 0.36, { col: [0.25, 0.27, 0.3] }); B.mat.box(2.72, 1.45, -3.1, 0.06, 0.5, 0.3, { col: [0.55, 0.5, 0.4] });
  B.pla.put(new T.CylinderGeometry(0.004, 0.004, 0.2, 4), 3.7, WH - 0.1, -1.55, { col: [0.1, 0.1, 0.1] }); B.glow.put(new T.SphereGeometry(0.035, 10, 8), 3.7, WH - 0.22, -1.55, { col: [1, 0.95, 0.8] });
  W.lamps.push({ x: 3.7, y: WH - 0.4, z: -1.55, k: 0 });
  R.hook = { x: 4.45, y: 1.32, z: -CW - 0.11 }; B.steel.box(4.45, 1.45, -CW - 0.115, 0.22, 0.02, 0.02, { col: CHR });
  R.stand = { x: 3.9, z: -1.35 }; R.center = [3.6, -1.6];
}
/* ---------- 한 층 ---------- */
function newB() { var B = {}; ['wall', 'tile', 'tfloor', 'jang', 'ceil', 'conc', 'swall', 'door', 'steel', 'cer', 'pla', 'mat', 'glow'].forEach(function (k) { B[k] = new GS.Batch(); }); return B; }
function flush(B, grp) { Object.keys(B).forEach(function (k) { if (B[k].n) grp.add(B[k].mesh(M[k])); }); }
function decoDoor(B, grp, k, x, s, num) {              // 복도에 늘어선 방문. 문짝은 따로(퇴실한 방은 문을 연다), 문틀은 벽(wallX frame)이 그린다
  var y0 = k * FH, z = s * (CW - 0.052), w = 0.42, n = [0, 0, -s], D = new GS.Batch();
  if (s > 0) D.quad([x + w, y0, z], [x - w, y0, z], [x - w, y0 + 2.02, z], [x + w, y0 + 2.02, z], n);
  else D.quad([x - w, y0, z], [x + w, y0, z], [x + w, y0 + 2.02, z], [x - w, y0 + 2.02, z], n);
  var dm = D.mesh(M.door); grp.add(dm); var sg = { x1: x - w, z1: s * CW, x2: x + w, z2: s * CW }; W.cols[k].push(sg);
  W.doors[num] = { k: k, x: x, s: s, mesh: dm, seg: sg };
  grp.add(plane(GS.TEX.label(num, { w: 128, h: 64, bg: '#e9e6d8', border: '#3a3a3a', bw: 5, fs: 44, font: "'Ria',sans-serif" }), 0.17, 0.085, x, y0 + 1.62, s * (CW - 0.056), s > 0 ? PI : 0));
}
function floor(k) {
  var y0 = k * FH, grp = new T.Group(), B = newB(), C = [], fl = (k + 2);
  W.cols[k] = C; W.floors[k] = grp;
  B.jang.box(XE / 2, y0 - 0.1, 0, XE, 0.2, CW * 2, { t: 2 }); B.conc.box(-0.5, y0 - 0.1, 0, 1, 0.2, 2.5, { t: 1.5 });
  B.ceil.box(XE / 2, y0 + WH + 0.05, 0, XE, 0.1, 7.5, { t: 1.2 });
  var xsN = k === 0 ? [6.6, 8.6, 10.6] : [1.6, 3.6, 5.6, 7.6, 9.6, 11.2], xsS = k === 0 ? [7.4, 9.3, 11.1] : xsN;
  var gN = k === 0 ? [[1.6, 2.7]] : [], gS = k === 0 ? [[0.95, 1.85], [3.2, 4.05]] : [];
  xsN.forEach(function (x) { gN.push([x - 0.42, x + 0.42]); }); xsS.forEach(function (x) { gS.push([x - 0.42, x + 0.42]); });   // 방문마다 구멍(퇴실한 방은 문을 연다)
  gN.push([12.4, 13.3]); gS.push([12.4, 13.3]);
  wallX(B.wall, C, 0, XE, CW, y0, { gaps: gN, frame: B.pla }); wallX(B.wall, C, 0, XE, -CW, y0, { gaps: gS, frame: B.pla });
  wallZ(B.wall, C, XE, -CW, CW, y0);
  /* 복도 끝 창, 형광등 */
  var win = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: W.winTex })); W.winMats.push(win.material);
  win.position.set(XE - 0.055, y0 + 1.5, 0); win.rotation.y = -PI / 2; win.updateMatrix(); win.matrixAutoUpdate = false; grp.add(win);
  [2, 6, 10, 14].forEach(function (x) { lamp(B, k, x, y0 + WH - 0.02, 0, true); });
  /* 방문들 */
  var n = 1;
  xsN.forEach(function (x) { decoDoor(B, grp, k, x, 1, fl + '0' + n++); });
  xsS.forEach(function (x) { decoDoor(B, grp, k, x, -1, fl + (n < 10 ? '0' : '') + n++); });
  /* 화장실 둘과 표지, 열린 문짝 */
  W.toilets[k] = { m: toiletRoom(B, C, k, 1), w: toiletRoom(B, C, k, -1) };
  [1, -1].forEach(function (s) {
    grp.add(plane(GS.TEX.person(s < 0), 0.2, 0.25, 13.55, y0 + 1.6, s * (CW - 0.056), s > 0 ? PI : 0));
    B.pla.box(13.74, y0 + 1.0, s * (CW + 0.105), 0.86, 2.0, 0.035, { col: [0.74, 0.76, 0.7] }); B.steel.box(14.08, y0 + 1.0, s * (CW + 0.135), 0.03, 0.12, 0.03, { col: [0.9, 0.92, 0.95] });
  });
  if (k === 0) {
    kitchen(B, C); storage(B, C); triangle(B, C);
    grp.add(plane(GS.TEX.label('주방', { w: 256, h: 112, bg: '#f1ede0', border: '#2f6b4a', fs: 76, fg: '#2f6b4a' }), 0.5, 0.22, 2.15, 2.2, CW - 0.056, PI));
    grp.add(plane(GS.TEX.label('창고', { w: 256, h: 112, bg: '#e9e6d8', border: '#3a3a3a', fs: 76 }), 0.3, 0.13, 1.35, 1.75, -CW + 0.056 + 0.0, 0));
    grp.add(plane(GS.TEX.label('총무', { w: 256, h: 112, bg: '#e9e6d8', border: '#b0222a', fs: 76, fg: '#b0222a' }), 0.3, 0.13, 4.35, 1.62, -CW + 0.056, 0));
    /* 창고·쪽방 열린 문짝(안쪽으로) */
    B.door.box(0.95, 1.0, -CW - 0.48, 0.04, 2.0, 0.84, { t: 0.84, tv: 2 }); seg(C, 0.95, -CW - 0.08, 0.95, -CW - 0.9);
    B.door.box(4.48, 1.0, -CW - 0.085, 0.84, 2.0, 0.04, { t: 0.84, tv: 2 });
    seg(C, -1, -1.25, -1, 0);                                                    // 건물 출입문(닫힘)
    grp.add(plane(GS.TEX.label('정 숙', { w: 256, h: 160, bg: '#f4f1e4', border: '#22201c', fs: 100 }), 0.4, 0.25, 5.9, 1.6, CW - 0.056, PI));
  }
  if (k === GS.NF - 1) seg(C, -1, 0, -1, 1.25);                                  // 옥상 문(닫힘)
  grp.add(plane(GS.TEX.label(fl + 'F', { w: 256, h: 160, bg: '#d2cfb9', fs: 130, fg: '#3d5a4c' }), 0.6, 0.38, -0.5, y0 + 1.75, 1.19, PI));
  var ft = GS.TEX.label(fl + 'F', { w: 256, h: 160, bg: '#2f6b4a', fs: 120, fg: '#fff', border: '#fff', bw: 10 });
  [[0.45, 1], [0.45, -1], [11.85, 1], [11.85, -1], [6.1, -1]].forEach(function (q) { grp.add(plane(ft, 0.34, 0.21, q[0], y0 + 1.95, q[1] * (CW - 0.056), q[1] > 0 ? PI : 0)); });
  flush(B, grp); W.group.add(grp);
}
/* ---------- 계단실: x -4.2~0, z ±1.25. A(z>0)는 올라가며 -x, 중간 참, B(z<0)는 +x 로 윗층에 닿는다 ---------- */
var SX0 = -1, SX1 = -3.2, RUN = 2.2, NS = 9;
function stairwell() {
  var B = newB(), C = W.stair, H = GS.NF * FH + 0.2, y, k, i, o = { t: 2.4, tv: 3, y0: 0 };
  B.swall.box(-2.1, H / 2 - 0.8, 1.25, 4.3, H + 1.6, 0.1, o); seg(C, -4.2, 1.25, 0, 1.25);
  B.swall.box(-2.1, H / 2 - 0.8, -1.25, 4.3, H + 1.6, 0.1, o); seg(C, -4.2, -1.25, 0, -1.25);
  B.swall.box(-4.2, H / 2 - 0.8, 0, 0.1, H + 1.6, 2.6, o); seg(C, -4.2, -1.25, -4.2, 1.25);
  B.swall.box(-2.1, H / 2 - 0.8, 0, 2.2, H + 1.6, 0.1, o); seg(C, SX1, 0, SX0, 0); seg(C, SX1, -0.05, SX1, 0.05); seg(C, SX0, -0.05, SX0, 0.05);
  [1, -1].forEach(function (s) { B.swall.box(0, H / 2 - 0.8, s * 1.0, 0.1, H + 1.6, 0.5, o); seg(C, 0, s * CW, 0, s * 1.25); });
  for (k = 0; k < GS.NF; k++) B.swall.box(0, k * FH + 2.25, 0, 0.1, 0.4, 1.5, o);             // 복도 입구 위
  B.ceil.box(-2.1, H + 0.3, 0, 4.3, 0.1, 2.6, { t: 1.2 }); B.conc.box(-2.6, -0.1, 0, 3.2, 0.2, 2.5, { t: 1.5 });
  for (k = 0; k < GS.NF - 1; k++) {
    y = k * FH;
    B.conc.box(-3.7, y + 1.4, 0, 1.0, 0.2, 2.5, { t: 1.5 });                                   // 중간 참
    for (i = 0; i < NS; i++) {
      var rise = 1.5 / NS, run = RUN / NS, sh = [0.95 - (i % 2) * 0.06, 0.95 - (i % 2) * 0.06, 0.95 - (i % 2) * 0.06];
      B.conc.box(SX0 - (i + 0.5) * run, y + (i + 1) * rise - 0.15, 0.65, run, 0.3, 1.1, { t: 1.5, col: sh });
      B.pla.box(SX0 - i * run - 0.025, y + (i + 1) * rise + 0.002, 0.65, 0.05, 0.006, 1.1, { col: [0.85, 0.7, 0.15] });
      B.conc.box(SX1 + (i + 0.5) * run, y + 1.5 + (i + 1) * rise - 0.15, -0.65, run, 0.3, 1.1, { t: 1.5, col: sh });
      B.pla.box(SX1 + i * run + 0.025, y + 1.5 + (i + 1) * rise + 0.002, -0.65, 0.05, 0.006, 1.1, { col: [0.85, 0.7, 0.15] });
    }
    lamp(B, k, -3.7, y + 1.5 + 2.78, 0, false, 0.6);
  }
  for (k = 0; k < GS.NF; k++) lamp(B, k, -0.5, k * FH + 2.78, 0, false, 0.6);
  /* 출입문(2층 계단 내려가는 쪽)과 옥상 문 */
  B.steel.box(SX0 - 0.03, 1.05, -0.63, 0.05, 2.1, 1.14, { col: [0.55, 0.6, 0.62] }); B.pla.box(SX0 + 0.002, 1.45, -0.63, 0.01, 0.5, 0.6, { col: [0.75, 0.85, 0.9] });
  B.steel.box(SX0 - 0.03, (GS.NF - 1) * FH + 1.05, 0.63, 0.05, 2.1, 1.14, { col: [0.5, 0.52, 0.5] });
  var g = new T.Group(); flush(B, g);
  g.add(plane(GS.TEX.label('출입문', { w: 256, h: 96, bg: '#2f6b4a', fg: '#fff', fs: 64 }), 0.42, 0.16, SX0 + 0.012, 1.95, -0.63, PI / 2));
  g.add(plane(GS.TEX.label('옥상\n출입금지', { w: 256, h: 160, bg: '#f4f1e4', fg: '#b0222a', fs: 62, border: '#b0222a' }), 0.4, 0.25, SX0 + 0.012, (GS.NF - 1) * FH + 1.5, 0.63, PI / 2));
  W.group.add(g); W.stairGroup = g;
}
/* 발밑 높이: 계단에서는 지금 높이와 가장 가까운 단을 고른다 */
W.groundY = function (x, z, y) {
  var best, k, h;
  if (x >= SX0) return Math.round(GS.clamp(y / FH, 0, GS.NF - 1)) * FH;
  best = 1e9; var out = y;
  for (k = -1; k < GS.NF; k++) {
    if (x < SX1) h = k * FH + 1.5;
    else if (z > 0) h = k * FH + 1.5 * (SX0 - x) / RUN;
    else h = k * FH + 1.5 + 1.5 * (x - SX1) / RUN;
    if (h < -0.01 || h > (GS.NF - 1) * FH + 0.01) continue;
    if (Math.abs(h - y) < best) { best = Math.abs(h - y); out = h; }
  }
  return out;
};
/* 원(반지름 r)을 벽 선분들에서 밀어낸다 */
W.collide = function (p, r, y) {
  var k = Math.round(y / FH), lists = [W.stair], it, li, i, s;
  if (k >= 0 && k < GS.NF && Math.abs(y - k * FH) < 0.3) lists.push(W.cols[k]);
  for (it = 0; it < 3; it++) for (li = 0; li < lists.length; li++) {
    var L = lists[li];
    for (i = 0; i < L.length; i++) {
      s = L[i]; var dx = s.x2 - s.x1, dz = s.z2 - s.z1, len = dx * dx + dz * dz, t = len ? ((p.x - s.x1) * dx + (p.z - s.z1) * dz) / len : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t; var cx = s.x1 + dx * t, cz = s.z1 + dz * t, ex = p.x - cx, ez = p.z - cz, d = Math.sqrt(ex * ex + ez * ez);
      if (d < r && d > 1e-6) { p.x = cx + ex / d * r; p.z = cz + ez / d * r; }
    }
  }
};
/* ---------- 빛: 점광 셋을 가까운 등으로 옮겨 붙인다(빛 개수 고정) ---------- */
W.updateLights = function (px, py, pz, dt) {
  var L = W.lamps, i, j, best = [], d;
  for (i = 0; i < L.length; i++) { d = (L[i].x - px) * (L[i].x - px) + (L[i].z - pz) * (L[i].z - pz) + (L[i].y - py - 0.6) * (L[i].y - py - 0.6) * 6; L[i].d = d; }
  var order = L.slice().sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
  for (i = 0; i < 3; i++) { var pl = W.lights[i]; pl.keep = order.indexOf(pl.lamp) >= 0; }
  order.forEach(function (lp) { for (j = 0; j < 3; j++) if (W.lights[j].lamp === lp || W.lights[j].next === lp) return; for (j = 0; j < 3; j++) if (!W.lights[j].keep && !W.lights[j].next) { W.lights[j].next = lp; W.lights[j].keep = true; return; } });
  for (i = 0; i < 3; i++) {
    var p = W.lights[i];
    if (p.next) { p.lv -= dt * 7; if (p.lv <= 0 || !p.lamp) { p.lv = 0; p.lamp = p.next; p.next = null; p.light.position.set(p.lamp.x, p.lamp.y, p.lamp.z); } }
    else if (p.lv < 1) p.lv = Math.min(1, p.lv + dt * 7);
    p.light.intensity = W.lightPow * p.lv * (p.lamp && p.lamp.dim ? p.lamp.dim : 1);
  }
};
W.setFloorVis = function (y) { var k = y / FH; for (var i = 0; i < GS.NF; i++) W.floors[i].visible = Math.abs(i - k) < 1.25; };
W.build = function (scene) {
  M = GS.M = GS.makeMaterials(); M.pla.side = T.DoubleSide; M.cer.side = T.DoubleSide;
  W.group = new T.Group(); scene.add(W.group); W.hits = new T.Group(); scene.add(W.hits);
  W.winTex = GS.TEX.window(); W.winMats = [];
  for (var k = 0; k < GS.NF; k++) floor(k);
  stairwell(); vroomBuild(scene);
  scene.add(new T.HemisphereLight(0xdfe8e0, 0x6a6450, 0.46)); scene.add(new T.AmbientLight(0xffffff, 0.11));
  W.lights = []; W.lightPow = 2.1;
  for (var i = 0; i < 3; i++) { var pl = new T.PointLight(0xf2ffe9, 0, 9, 1.6); scene.add(pl); W.lights.push({ light: pl, lamp: null, next: null, lv: 0 }); }
};
})();