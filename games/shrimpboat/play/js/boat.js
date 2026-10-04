/* 새우잡이배 — 배. FRP 연안 어선 18m. 배 안 좌표: x 배 길이(고물 -9 ~ 이물 +9.6), z 폭(우현 +), y 수면 0, 갑판 D=1.3
   치수는 실측 비율: 뱃전 높이 0.9, 조타실 천장 2.2, 문 0.75x1.85, 선별대 높이 0.85 */
(function () {
'use strict';
var T = THREE, D = SB.D, TOP = D + 0.9, PI = Math.PI, XS = -9.0, XB = 9.6;
var B = SB.boat = { solids: [], inter: [], group: null, lamps: {}, anim: [] };
function halfW(x) { return x <= 3 ? 2.3 + 0.35 * SB.smooth(-9, -4, x) : 2.65 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 3) / 6.6, 2))); }
function keel(x) { return -0.95 + 0.15 * SB.smooth(-4, -9, x) + Math.max(0, x - 4) * 0.11; }
function prof(x, y) { var k = keel(x); return y >= 0.4 ? 1 + 0.035 * (y - 0.4) : 0.14 + 0.86 * Math.pow(Math.max(0, (y - k) / (0.4 - k)), 0.55); }
function sideZ(x, y) { return halfW(x) * prof(x, y); }
B.halfW = halfW; B.sideZ = sideZ;
B.innerZ = function (x) { return Math.max(0, sideZ(x, D + 0.5) - 0.09); };     // 뱃전 안쪽

/* ---------- 선체: 띠마다 따로 색(붉은 바닥칠, 검은 띠, 흰 칠, 하늘색 줄) ---------- */
var RED = [0.56, 0.17, 0.13], BLK = [0.12, 0.12, 0.13], WH = [0.94, 0.94, 0.92], BLU = [0.2, 0.47, 0.72], INN = [0.62, 0.78, 0.8], CAP = [0.36, 0.22, 0.15];
function hull(b) {
  var xs = [], x, i, j;
  for (x = XS; x < 6; x += 0.5) xs.push(x); for (; x < XB - 0.05; x += 0.25) xs.push(x); xs.push(XB);
  var bands = [[null, -0.1, RED], [-0.1, 0.13, RED], [0.13, 0.33, BLK], [0.33, 0.86, WH], [0.86, 1.06, BLU], [1.06, 1.3, WH], [1.3, TOP, WH]];
  var e = 0.02;
  function P(x, y, s) { return [x, y, s * sideZ(x, y)]; }
  function N(x, y, s) {                       // 면의 법선(바깥): 두 방향 미분의 외적
    var a = P(x + e, y, s), c = P(x - e, y, s), d = P(x, y + e, s), f = P(x, y - e, s);
    var tx = [a[0] - c[0], a[1] - c[1], a[2] - c[2]], ty = [d[0] - f[0], d[1] - f[1], d[2] - f[2]];
    var n = [tx[1] * ty[2] - tx[2] * ty[1], tx[2] * ty[0] - tx[0] * ty[2], tx[0] * ty[1] - tx[1] * ty[0]];
    if (s < 0) n = [-n[0], -n[1], -n[2]];
    var l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l];
  }
  [1, -1].forEach(function (s) {
    bands.forEach(function (bd) {
      var rows = 3, base = b.n;
      for (i = 0; i < xs.length; i++) {
        var y0 = bd[0] == null ? keel(xs[i]) : bd[0];
        for (j = 0; j <= rows; j++) { var y = y0 + (bd[1] - y0) * j / rows, p = P(xs[i], y, s); b.v(p, N(xs[i], y, s), xs[i] / 4, y / 3, bd[2]); }
      }
      for (i = 0; i < xs.length - 1; i++) for (j = 0; j < rows; j++) {
        var a = base + i * (rows + 1) + j, c = a + rows + 1;
        if (s > 0) b.I.push(a, c, c + 1, a, c + 1, a + 1); else b.I.push(a, a + 1, c + 1, a, c + 1, c);
      }
    });
  });
  /* 뱃전 안쪽 벽(갑판에서 위 끝까지)과 위 덮개 */
  [1, -1].forEach(function (s) {
    var base = b.n;
    for (i = 0; i < xs.length; i++) {
      var zi = s * Math.max(0, sideZ(xs[i], D + 0.5) - 0.09);
      b.v([xs[i], D, zi], [0, 0, -s], xs[i] / 4, D / 3, INN); b.v([xs[i], TOP, zi], [0, 0, -s], xs[i] / 4, TOP / 3, WH);
    }
    for (i = 0; i < xs.length - 1; i++) { var a = base + i * 2, c = a + 2; if (s > 0) b.I.push(a, a + 1, c + 1, a, c + 1, c); else b.I.push(a, c, c + 1, a, c + 1, a + 1); }
    base = b.n;
    for (i = 0; i < xs.length; i++) { var zo = s * sideZ(xs[i], TOP), zi2 = s * Math.max(0, sideZ(xs[i], D + 0.5) - 0.09); b.v([xs[i], TOP, zo], [0, 1, 0], xs[i], 0, CAP); b.v([xs[i], TOP, zi2], [0, 1, 0], xs[i], 0.1, CAP); }
    for (i = 0; i < xs.length - 1; i++) { var a2 = base + i * 2, c2 = a2 + 2; if (s > 0) b.I.push(a2, c2, c2 + 1, a2, c2 + 1, a2 + 1); else b.I.push(a2, a2 + 1, c2 + 1, a2, c2 + 1, c2); }
  });
  /* 고물 판(트랜섬) */
  var ys = [], k = keel(XS); for (j = 0; j <= 10; j++) ys.push(k + (TOP - k) * j / 10);
  var base2 = b.n;
  ys.forEach(function (y) { var w = sideZ(XS, y), col = y < 0.13 ? RED : y < 0.33 ? BLK : (y > 0.86 && y < 1.06) ? BLU : WH; b.v([XS, y, -w], [-1, 0, 0], -w / 4, y / 3, col); b.v([XS, y, w], [-1, 0, 0], w / 4, y / 3, col); });
  for (j = 0; j < ys.length - 1; j++) { var q = base2 + j * 2; b.I.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  var wi = sideZ(XS + 0.08, D + 0.5) - 0.09;
  b.quad([XS + 0.08, D, wi], [XS + 0.08, D, -wi], [XS + 0.08, TOP, -wi], [XS + 0.08, TOP, wi], [1, 0, 0], [0, D / 3, 1, TOP / 3], INN);
  b.box(XS + 0.04, TOP + 0.01, 0, 0.1, 0.02, wi * 2 + 0.1, { col: CAP });
  return xs;
}

/* ---------- 부딪힘 상자(배 안 좌표)와 건드릴 것 ---------- */
function solid(x0, x1, z0, z1, y0, y1, o) { var s = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0: y0 == null ? D : y0, y1: y1 == null ? D + 2.2 : y1, nc: o && o.nc, id: o && o.id, wall: o && o.wall }; B.solids.push(s); return s; }
B.solid = solid;
B.addInter = function (o) { B.inter.push(o); return o; };          // o: id, box [x0,y0,z0,x1,y1,z1], name(), use(), ok()

/* 구멍(문·창) 뚫린 벽. ax 'x' 면 x 방향으로 뻗은 벽(z 고정), 'z' 면 z 방향(x 고정). holes: [a0, a1, 아래, 위] (바닥 기준 높이) */
function holeWall(b, ax, fixed, a0, a1, H, th, holes, o) {
  o = o || {}; var cuts = [a0, a1], i, k;
  holes.forEach(function (h) { cuts.push(h[0], h[1]); }); cuts = cuts.filter(function (c, i2, arr) { return c >= a0 && c <= a1 && arr.indexOf(c) === i2; }).sort(function (p, q) { return p - q; });
  for (i = 0; i < cuts.length - 1; i++) {
    var c0 = cuts[i], c1 = cuts[i + 1]; if (c1 - c0 < 0.005) continue;
    var cov = holes.filter(function (h) { return h[0] <= c0 + 1e-4 && h[1] >= c1 - 1e-4; }), free = [[0, H]], door = false;
    cov.forEach(function (h) { if (h[2] < 0.01) door = true; var nf = []; free.forEach(function (f) { if (h[3] <= f[0] || h[2] >= f[1]) nf.push(f); else { if (h[2] > f[0]) nf.push([f[0], h[2]]); if (h[3] < f[1]) nf.push([h[3], f[1]]); } }); free = nf; });
    for (k = 0; k < free.length; k++) {
      var f = free[k], cy = D + (f[0] + f[1]) / 2, sy = f[1] - f[0], ca = (c0 + c1) / 2, sa = c1 - c0;
      if (ax === 'x') b.box(ca, cy, fixed, sa, sy, th, { t: 2, y0: D, col: o.col }); else b.box(fixed, cy, ca, th, sy, sa, { t: 2, y0: D, col: o.col });
    }
    if (!o.nc) { var wy0 = door ? D + 1.85 : D; if (ax === 'x') solid(c0, c1, fixed - th / 2, fixed + th / 2, wy0, D + H, { wall: 1, nc: door }); else solid(fixed - th / 2, fixed + th / 2, c0, c1, wy0, D + H, { wall: 1, nc: door }); }
  }
}
/* 창: 유리와 테 */
function windowPane(bg, bf, ax, fixed, a0, a1, y0, y1, th) {
  var cy = D + (y0 + y1) / 2, sy = y1 - y0, ca = (a0 + a1) / 2, sa = a1 - a0, F = [0.16, 0.24, 0.36], w = 0.045;
  if (ax === 'x') { bg.box(ca, cy, fixed, sa, sy, 0.01, {}); bf.box(ca, D + y0 + w / 2, fixed, sa, w, th + 0.03, { col: F }); bf.box(ca, D + y1 - w / 2, fixed, sa, w, th + 0.03, { col: F }); bf.box(a0 + w / 2, cy, fixed, w, sy, th + 0.03, { col: F }); bf.box(a1 - w / 2, cy, fixed, w, sy, th + 0.03, { col: F }); }
  else { bg.box(fixed, cy, ca, 0.01, sy, sa, {}); bf.box(fixed, D + y0 + w / 2, ca, th + 0.03, w, sa, { col: F }); bf.box(fixed, D + y1 - w / 2, ca, th + 0.03, w, sa, { col: F }); bf.box(fixed, cy, a0 + w / 2, th + 0.03, sy, w, { col: F }); bf.box(fixed, cy, a1 - w / 2, th + 0.03, sy, w, { col: F }); }
}

/* ---------- 갑판 ---------- */
function deck(b, xs) {
  var i, base = b.n, DK = [1, 1, 1];
  for (i = 0; i < xs.length; i++) { var w = Math.max(0, sideZ(xs[i], D + 0.5) - 0.09); b.v([xs[i], D, -w], [0, 1, 0], xs[i], -w, DK); b.v([xs[i], D, w], [0, 1, 0], xs[i], w, DK); }
  for (i = 0; i < xs.length - 1; i++) { var a = base + i * 2, c = a + 2; b.I.push(a, a + 1, c + 1, a, c + 1, c); }
}

/* ---------- 조타실: x -7.4~-3.2, z ±1.5. 앞벽에 문(우현 쪽)과 창 둘 ---------- */
var WX0 = -7.4, WX1 = -3.2, WZ = 1.5, WH2 = 2.2, WT = 0.07;
B.wh = { x0: WX0, x1: WX1, z: WZ, door: [0.55, 1.3] };
function wheelhouse(P, G, F, I) {
  var CR = [0.95, 0.93, 0.86];
  holeWall(P, 'z', WX1, -WZ, WZ, WH2, WT, [[0.55, 1.3, 0, 1.85], [-1.3, -0.5, 1.0, 1.8], [-0.4, 0.4, 1.0, 1.8]], { col: CR });
  holeWall(P, 'z', WX0, -WZ, WZ, WH2, WT, [[-0.5, 0.5, 1.1, 1.7]], { col: CR });
  holeWall(P, 'x', WZ, WX0, WX1, WH2, WT, [[-6.6, -5.6, 1.05, 1.75], [-5.0, -3.9, 1.05, 1.75]], { col: CR });
  holeWall(P, 'x', -WZ, WX0, WX1, WH2, WT, [[-6.6, -5.6, 1.05, 1.75], [-5.0, -3.9, 1.05, 1.75]], { col: CR });
  windowPane(G, F, 'z', WX1, -1.3, -0.5, 1.0, 1.8, WT); windowPane(G, F, 'z', WX1, -0.4, 0.4, 1.0, 1.8, WT); windowPane(G, F, 'z', WX0, -0.5, 0.5, 1.1, 1.7, WT);
  [WZ, -WZ].forEach(function (z) { windowPane(G, F, 'x', z, -6.6, -5.6, 1.05, 1.75, WT); windowPane(G, F, 'x', z, -5.0, -3.9, 1.05, 1.75, WT); });
  P.box((WX0 + WX1) / 2 - 0.05, D + WH2 + 0.05, 0, WX1 - WX0 + 0.4, 0.1, WZ * 2 + 0.3, { t: 2, col: CR });          // 지붕
  P.box((WX0 + WX1) / 2 - 0.05, D + WH2 + 0.13, 0, WX1 - WX0 + 0.3, 0.06, WZ * 2 + 0.2, { t: 2, col: [0.3, 0.52, 0.66] });
  F.box(WX1 + 0.04, D + 0.92, 0.925, 0.06, 0.06, 0.75, { col: [0.16, 0.24, 0.36] });            // 문턱
  F.box(WX1 + 0.04, D + 1.88, 0.925, 0.08, 0.06, 0.85, { col: [0.16, 0.24, 0.36] });
  /* 문짝: 활짝 열려 앞벽 바깥에 붙어 있다 */
  I.door = SB.mk(function (b) { b.box(0, 0.925, 0.375, 0.05, 1.83, 0.74, { col: [0.86, 0.85, 0.8] }); b.box(0.03, 1.35, 0.375, 0.02, 0.5, 0.5, { col: [0.2, 0.3, 0.4] }); b.box(0.04, 0.95, 0.62, 0.04, 0.04, 0.12, { col: [0.7, 0.7, 0.7] }); }, SB.M.paint);
  I.door.position.set(WX1 + 0.04, D, 1.3); I.door.rotation.y = PI / 2 - 0.05; solid(WX1, WX1 + 0.78, 1.26, 1.36, D, D + 1.85);
  /* 바닥 깔개 */
  P.box((WX0 + WX1) / 2, D + 0.006, 0, WX1 - WX0 - 0.15, 0.012, WZ * 2 - 0.15, { col: [0.32, 0.42, 0.36], t: 1 });
}

/* ---------- 조타실 안: 조타대, 키, 의자, 선장 침상(꽃무늬 이불), 구명조끼 사물함, 벽에 건 노, 달력, 소주병 ---------- */
function quiltTex() {
  var S = 256, c = SB.cvs(S), g = c.getContext('2d'), r = SB.rng(41), i, k;
  g.fillStyle = '#c2304a'; g.fillRect(0, 0, S, S);
  for (i = 0; i < 26; i++) {
    var x = r() * S, y = r() * S, q = 10 + r() * 14, col = ['#f4d23c', '#f6f0e0', '#3a9a5a', '#f08a2c'][i % 4];
    for (k = 0; k < 5; k++) { var a = k * 1.2566 + r() * 0.3; g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(a) * q * 0.6, y + Math.sin(a) * q * 0.6, q * 0.45, q * 0.28, a, 0, 6.3); g.fill(); }
    g.fillStyle = '#8a1a2a'; g.beginPath(); g.arc(x, y, q * 0.22, 0, 6.3); g.fill();
    g.fillStyle = '#2f7a44'; g.beginPath(); g.ellipse(x + q, y + q * 0.6, q * 0.4, q * 0.15, 0.6, 0, 6.3); g.fill();
  }
  for (i = 0; i < S; i += 32) { g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
  return SB.fin(c);
}
function interior(P, I) {
  var GRY = [0.42, 0.48, 0.52], DK = [0.18, 0.2, 0.22], WOOD = [0.5, 0.32, 0.18];
  /* 조타대 */
  P.box(-3.47, D + 0.47, -0.5, 0.42, 0.94, 1.84, { col: GRY }); solid(-3.7, -3.24, -1.42, 0.42, D, D + 0.95);
  P.box(-3.42, D + 0.97, -0.5, 0.34, 0.06, 1.84, { col: DK });
  P.box(-3.3, D + 1.12, -0.5, 0.12, 0.26, 1.84, { col: GRY });
  P.box(-3.36, D + 1.25, 0.1, 0.18, 0.12, 0.34, { col: [0.12, 0.12, 0.12] });                // 라디오 카세트
  P.put(new T.CylinderGeometry(0.03, 0.03, 0.02, 10), -3.27, D + 1.26, 0.0, { rz: PI / 2, col: [0.6, 0.6, 0.6] });
  P.put(new T.CylinderGeometry(0.035, 0.03, 0.62, 10), -3.62, D + 0.95, -0.45, { rz: PI / 2 - 0.35, col: DK });   // 키 기둥
  /* 키: 나무 바퀴 */
  var wheel = SB.mk(function (b) {
    b.put(new T.TorusGeometry(0.26, 0.022, 8, 28), 0, 0, 0, { ry: PI / 2, col: WOOD });
    for (var k = 0; k < 8; k++) { var a = k * PI / 4, c = Math.cos(a), s = Math.sin(a); b.tube([0, 0, 0], [0, s * 0.36, c * 0.36], 0.014, { col: WOOD }); b.put(new T.SphereGeometry(0.022, 6, 5), 0, s * 0.37, c * 0.37, { col: WOOD }); }
    b.put(new T.CylinderGeometry(0.05, 0.05, 0.06, 12), 0, 0, 0, { rz: PI / 2, col: [0.3, 0.3, 0.3] });
  }, SB.M.mat);
  wheel.position.set(-3.9, D + 1.07, -0.45); I.wheel = wheel;
  /* 의자 */
  P.put(new T.CylinderGeometry(0.03, 0.03, 0.55, 8), -4.35, D + 0.28, -0.45, { col: [0.6, 0.6, 0.6] });
  P.put(new T.CylinderGeometry(0.2, 0.2, 0.07, 14), -4.35, D + 0.58, -0.45, { col: [0.35, 0.12, 0.1] });
  solid(-4.55, -4.15, -0.65, -0.25, D, D + 0.6);
  /* 침상 */
  P.box(-6.38, D + 0.22, -1.05, 1.88, 0.44, 0.78, { col: WOOD }); solid(-7.33, -5.43, -1.45, -0.65, D, D + 0.55);
  P.box(-7.05, D + 0.5, -1.05, 0.38, 0.1, 0.5, { col: [0.92, 0.9, 0.82] });                  // 베개
  I.quilt = new T.Mesh(new T.BoxGeometry(1.4, 0.09, 0.8), new T.MeshLambertMaterial({ map: quiltTex() }));
  I.quilt.position.set(-6.15, D + 0.49, -1.04);
  /* 구명조끼 사물함 */
  P.box(-7.08, D + 0.85, 1.07, 0.48, 1.7, 0.74, { col: [0.55, 0.58, 0.58] }); solid(-7.33, -6.83, 0.69, 1.45, D, D + 1.7);
  P.box(-6.83, D + 0.85, 1.07, 0.02, 1.62, 0.02, { col: DK });
  /* 영문판은 사물함 글씨·배 이름도 영어(10/4 사장님 영문판 검수) */
  I.lockerLabel = W.plane(SB.TEX.label(SB.EN ? 'LIFE VEST' : '구명동의', { w: 256, h: 96, bg: '#f2f0e6', fg: '#c62a20', fs: 52, fit: SB.EN }), 0.36, 0.13, -6.82, D + 1.4, 1.07, PI / 2);
  /* 노: 벽 고리에 걸림 */
  I.oarHook = [[-6.3, D + 1.5, 1.42], [-4.7, D + 1.5, 1.42]];
  I.oarHook.forEach(function (h) { P.box(h[0], h[1] - 0.04, h[2] - 0.04, 0.03, 0.03, 0.08, { col: [0.6, 0.6, 0.6] }); });
  /* 달력과 소주병 */
  I.cal = { x: -7.33, y: D + 1.35, z: -0.95 };
  [[-5.3, -1.25], [-5.18, -1.33], [-5.4, -1.36]].forEach(function (q, k) {
    P.put(new T.CylinderGeometry(0.032, 0.032, 0.17, 10), q[0], D + 0.085, q[1], { col: [0.16, 0.5, 0.28] });
    P.put(new T.CylinderGeometry(0.012, 0.03, 0.06, 10), q[0], D + 0.2, q[1], { col: [0.16, 0.5, 0.28] });
  });
  /* 형광등 */
  P.box(-5.3, D + WH2 - 0.03, 0, 1.2, 0.05, 0.12, { col: [0.8, 0.8, 0.78] });
  I.tube = SB.mk(function (b) { b.box(0, 0, 0, 1.1, 0.03, 0.05, { col: [1, 1, 0.95] }); }, SB.M.glow); I.tube.position.set(-5.3, D + WH2 - 0.065, 0);
}
var W = { plane: function (tex, w, h, x, y, z, ry, o) {
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshLambertMaterial({ map: tex, transparent: !!(o && o.tr), side: o && o.ds ? T.DoubleSide : T.FrontSide }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; if (o && o.rx) { m.rotation.order = 'YXZ'; m.rotation.x = o.rx; } return m;
} };
B.plane = W.plane;

/* ---------- 조타실 바깥: 지붕 장비, 구명환, 사다리, 배 이름판 ---------- */
function roofGear(P, S, I, grp) {
  var RT = D + WH2 + 0.16, DK = [0.16, 0.17, 0.18];
  S.put(new T.CylinderGeometry(0.08, 0.1, 0.5, 10), -5.2, RT + 0.25, 0, { col: [0.85, 0.85, 0.82] });
  I.radar = SB.mk(function (b) { b.box(0, 0, 0, 0.12, 0.1, 1.3, { col: [0.92, 0.92, 0.9] }); b.box(0, -0.07, 0, 0.16, 0.05, 0.16, { col: DK }); }, SB.M.pla);
  I.radar.position.set(-5.2, RT + 0.56, 0); grp.add(I.radar);
  [[-6.6, 0.9, 2.6], [-6.8, -0.9, 2.2], [-4.0, 1.2, 1.4]].forEach(function (a) { S.tube([a[0], RT, a[1]], [a[0], RT + a[2], a[1]], 0.012, { col: [0.9, 0.9, 0.9] }); });
  S.put(new T.CylinderGeometry(0.06, 0.06, 0.16, 10), -3.5, RT + 0.08, 0, { col: DK });          // 탐조등 받침
  I.search = new T.Group(); I.search.position.set(-3.5, RT + 0.24, 0); grp.add(I.search);
  I.search.add(SB.mk(function (b) { b.put(new T.CylinderGeometry(0.15, 0.12, 0.3, 16), 0.0, 0, 0, { rz: PI / 2, col: [0.2, 0.22, 0.24] }); b.put(new T.TorusGeometry(0.15, 0.02, 6, 16), 0.15, 0, 0, { ry: PI / 2, col: [0.6, 0.6, 0.6] }); }, SB.M.steel));
  I.searchGlass = new T.Mesh(new T.CircleGeometry(0.14, 16), new T.MeshBasicMaterial({ color: 0x6a6a60 })); I.searchGlass.position.set(0.155, 0, 0); I.searchGlass.rotation.y = PI / 2; I.search.add(I.searchGlass);
  S.put(new T.CylinderGeometry(0.1, 0.12, 0.9, 12), -7.0, RT + 0.45, -0.8, { col: [0.12, 0.12, 0.12] });     // 연통
  P.box(-7.0, RT + 0.88, -0.8, 0.26, 0.04, 0.26, { col: [0.75, 0.2, 0.15] });
  /* 이름판 */
  grp.add(W.plane(SB.TEX.label(SB.EN ? 'HAESEONG NO.7' : '제7해성호', { w: 512, h: 96, bg: '#f4f1e6', fg: '#1d3f7a', fs: 66, fit: SB.EN }), 1.7, 0.3, WX1 + 0.205, D + WH2 + 0.05, 0, PI / 2));
  /* 구명환: 옆벽 바깥 */
  var ringM = new T.MeshPhongMaterial({ color: 0xffffff, vertexColors: true, shininess: 50 });
  [WZ + 0.06, -WZ - 0.06].forEach(function (z) {
    grp.add(SB.mk(function (b) { for (var k = 0; k < 8; k++) b.put(new T.TorusGeometry(0.3, 0.07, 8, 6, PI / 4 + 0.01), 0, 0, 0, { rz: k * PI / 4, col: k % 2 ? [0.95, 0.95, 0.93] : [0.98, 0.42, 0.08] }); }, ringM)).position.set(-5.4, D + 1.4, z);
  });
  /* 고물 쪽 사다리 */
  [0.55, 1.0].forEach(function (z) { S.tube([WX0 - 0.1, D, z], [WX0 - 0.1, D + WH2 + 0.5, z], 0.018, { col: [0.75, 0.75, 0.72] }); });
  for (var k = 1; k < 8; k++) S.tube([WX0 - 0.1, D + k * 0.3, 0.55], [WX0 - 0.1, D + k * 0.3, 1.0], 0.014, { col: [0.75, 0.75, 0.72] });
}

/* ---------- 바깥 주방: 좌현 조타실 앞. 버너, 양은냄비, 물통, 라면 상자 ---------- */
function galley(P, S, I) {
  var x0 = -3.0, x1 = -1.8, zc = -2.3, top = D + 0.85, WOOD = [0.55, 0.4, 0.26];
  P.box((x0 + x1) / 2, top - 0.02, zc, x1 - x0, 0.04, 0.52, { col: WOOD });
  [[x0 + 0.04, zc - 0.22], [x0 + 0.04, zc + 0.22], [x1 - 0.04, zc - 0.22], [x1 - 0.04, zc + 0.22]].forEach(function (q) { S.box(q[0], D + 0.41, q[1], 0.04, 0.82, 0.04, { col: [0.55, 0.55, 0.55] }); });
  P.box((x0 + x1) / 2, D + 0.15, zc, x1 - x0 - 0.04, 0.02, 0.48, { col: WOOD });
  solid(x0, x1, zc - 0.27, zc + 0.27, D, top);
  /* 버너(부르스타) */
  P.box(-2.62, top + 0.05, zc, 0.34, 0.1, 0.28, { col: [0.12, 0.12, 0.13] }); S.box(-2.62, top + 0.101, zc, 0.3, 0.004, 0.24, { col: [0.7, 0.7, 0.68] });
  S.put(new T.TorusGeometry(0.075, 0.01, 6, 14), -2.62, top + 0.11, zc, { rx: PI / 2, col: [0.15, 0.15, 0.15] });
  P.put(new T.CylinderGeometry(0.018, 0.018, 0.03, 8), -2.48, top + 0.06, zc + 0.15, { rx: PI / 2, col: [0.8, 0.1, 0.1] });
  I.burner = { x: -2.62, y: top + 0.11, z: zc };
  /* 물통(파란 말통) */
  I.jug = SB.mk(function (b) { b.box(0, 0.19, 0, 0.26, 0.38, 0.2, { col: [0.2, 0.42, 0.78] }); b.put(new T.CylinderGeometry(0.035, 0.035, 0.05, 10), 0.07, 0.4, 0, { col: [0.95, 0.85, 0.2] }); b.box(-0.04, 0.4, 0, 0.12, 0.03, 0.04, { col: [0.2, 0.42, 0.78] }); }, SB.M.pla);
  I.jug.position.set(-2.05, top, zc);
  /* 라면 상자, 예비 물통(밤에 가져갈 것), 빨간 플라스틱 의자 */
  P.box(-2.75, D + 0.31, zc + 0.02, 0.4, 0.3, 0.3, { col: [0.74, 0.58, 0.38] }); P.box(-2.75, D + 0.31, zc + 0.172, 0.22, 0.12, 0.004, { col: [0.85, 0.15, 0.12] });
  I.spareJug = SB.mk(function (b) { b.box(0, 0.19, 0, 0.26, 0.38, 0.2, { col: [0.88, 0.88, 0.84] }); b.put(new T.CylinderGeometry(0.035, 0.035, 0.05, 10), 0.07, 0.4, 0, { col: [0.2, 0.5, 0.85] }); }, SB.M.pla);
  I.spareJug.position.set(-2.15, D + 0.17, zc + 0.02);
  P.put(new T.CylinderGeometry(0.17, 0.15, 0.03, 16), -1.45, D + 0.43, -1.95, { col: [0.82, 0.12, 0.1] });
  [[-1.57, -2.07], [-1.33, -2.07], [-1.57, -1.83], [-1.33, -1.83]].forEach(function (q) { P.put(new T.CylinderGeometry(0.02, 0.026, 0.42, 6), q[0], D + 0.21, q[1], { col: [0.82, 0.12, 0.1] }); });
}

/* ---------- 어창 뚜껑, 선별대, 바구니 ---------- */
function holdTable(P, S, I, grp) {
  var HC = [0.5, 0.52, 0.5];
  S.box(-0.7, D + 0.06, -0.55, 1.1, 0.12, 0.06, { col: HC }); S.box(-0.7, D + 0.06, 0.55, 1.1, 0.12, 0.06, { col: HC });
  S.box(-1.27, D + 0.06, 0, 0.06, 0.12, 1.16, { col: HC }); S.box(-0.13, D + 0.06, 0, 0.06, 0.12, 1.16, { col: HC });
  P.box(-0.7, D - 0.6, 0, 1.0, 0.02, 1.0, { col: [0.86, 0.92, 0.95] });                         // 어창 속 얼음
  P.box(-0.7, D - 0.3, -0.49, 1.0, 0.6, 0.02, { col: [0.2, 0.22, 0.24] }); P.box(-0.7, D - 0.3, 0.49, 1.0, 0.6, 0.02, { col: [0.2, 0.22, 0.24] });
  P.box(-1.19, D - 0.3, 0, 0.02, 0.6, 1.0, { col: [0.2, 0.22, 0.24] }); P.box(-0.21, D - 0.3, 0, 0.02, 0.6, 1.0, { col: [0.2, 0.22, 0.24] });
  I.holdIce = SB.mk(function (b) { b.box(0, 0, 0, 0.96, 0.02, 0.96, { col: [0.95, 0.55, 0.5] }); }, SB.M.mat); I.holdIce.position.set(-0.7, D - 0.59, 0); I.holdIce.visible = false; grp.add(I.holdIce);
  I.lid = new T.Group(); I.lid.position.set(-1.25, D + 0.13, 0); grp.add(I.lid);
  I.lid.add(SB.mk(function (b) { b.box(0.55, 0.015, 0, 1.1, 0.03, 1.14, { col: [0.55, 0.57, 0.55] }); b.box(0.85, 0.05, 0, 0.04, 0.04, 0.3, { col: [0.3, 0.3, 0.3] }); for (var k = 0; k < 6; k++) b.box(0.1 + k * 0.18, 0.032, 0, 0.012, 0.004, 1.1, { col: [0.45, 0.47, 0.45] }); }, SB.M.steel));
  solid(-1.3, -0.1, -0.58, 0.58, D, D + 0.15, { nc: 1, id: 'hold' });
  /* 선별대: 스테인리스 판에 테 */
  var TX0 = 0.4, TX1 = 2.4, TZ0 = -0.1, TZ1 = 1.1, TT = D + 0.85, ST = [0.78, 0.8, 0.8];
  S.box((TX0 + TX1) / 2, TT - 0.015, (TZ0 + TZ1) / 2, TX1 - TX0, 0.03, TZ1 - TZ0, { col: ST });
  S.box((TX0 + TX1) / 2, TT + 0.03, TZ0, TX1 - TX0, 0.06, 0.02, { col: ST }); S.box((TX0 + TX1) / 2, TT + 0.03, TZ1, TX1 - TX0, 0.06, 0.02, { col: ST });
  S.box(TX0, TT + 0.03, (TZ0 + TZ1) / 2, 0.02, 0.06, TZ1 - TZ0, { col: ST });
  [[TX0 + 0.05, TZ0 + 0.05], [TX1 - 0.05, TZ0 + 0.05], [TX0 + 0.05, TZ1 - 0.05], [TX1 - 0.05, TZ1 - 0.05]].forEach(function (q) { S.box(q[0], D + 0.41, q[1], 0.05, 0.82, 0.05, { col: [0.6, 0.6, 0.6] }); });
  solid(TX0, TX1, TZ0, TZ1, D, TT);
  B.table = { x0: TX0, x1: TX1, z0: TZ0, z1: TZ1, y: TT };
  /* 바구니 받침(뒤집은 스티로폼 상자) */
  P.box(2.85, D + 0.27, 0.5, 0.6, 0.54, 0.44, { col: [0.95, 0.95, 0.93] }); solid(2.52, 3.18, 0.25, 0.75, D, D + 0.85);
  B.basketAt = { x: 2.85, y: D + 0.54, z: 0.5 };
}

/* ---------- 마스트, 붐, 양망기(그물 감는 기계) ---------- */
var MX = 3.6;
function mastWinch(P, S, R, I, grp) {
  var WP = [0.92, 0.92, 0.88], MC = [0.25, 0.55, 0.6];
  S.put(new T.CylinderGeometry(0.075, 0.1, 6.4, 12), MX, D + 3.2, 0, { col: WP });
  S.box(MX, D + 4.7, 0, 0.08, 0.08, 1.9, { col: WP });                                             // 가로대
  [[-0.85], [0.85]].forEach(function (q) { S.tube([MX, D + 4.7, q[0]], [MX, D + 4.3, 0], 0.02, { col: WP }); });
  /* 작업등 두 개(가로대 끝, 갑판 쪽으로) */
  I.lampMesh = SB.mk(function (b) {
    [-0.8, 0.8].forEach(function (z) { b.box(MX - 0.05, D + 4.62, z, 0.3, 0.12, 0.22, { col: [0.2, 0.2, 0.2] }); });
  }, SB.M.pla); grp.add(I.lampMesh);
  I.lampGlow = SB.mk(function (b) { [-0.8, 0.8].forEach(function (z) { b.box(MX - 0.05, D + 4.555, z, 0.26, 0.012, 0.18, {}); }); }, new T.MeshBasicMaterial({ color: 0x555555 })); grp.add(I.lampGlow);
  I.topLight = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0x777777 })); I.topLight.position.set(MX, D + 6.45, 0); grp.add(I.topLight);
  /* 풍어기: 마스트 꼭대기에서 이물 끝까지 줄에 깃발 다섯 */
  var a = [MX, D + 6.3, 0], b2 = [9.3, TOP + 0.4, 0]; R.tube(a, b2, 0.008, { col: [0.9, 0.9, 0.85] });
  I.flags = [];
  for (var k = 0; k < 6; k++) {
    var t = (k + 0.7) / 6.6, p = [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t - Math.sin(t * PI) * 0.35, 0];
    var f = new T.Mesh(new T.PlaneGeometry(0.5, 0.32, 4, 1), new T.MeshLambertMaterial({ map: SB.TEX.flag(k), side: T.DoubleSide }));
    f.geometry.translate(0, -0.16, 0); f.position.set(p[0], p[1], p[2]); f.rotation.y = 0; grp.add(f); I.flags.push(f);
  }
  S.tube([MX, D + 6.3, 0], [-3.4, D + WH2 + 0.2, 0], 0.008, { col: [0.9, 0.9, 0.85] });
  /* 붐: 마스트 밑동에서 우현 바깥으로 */
  I.boomPivot = new T.Vector3(MX - 0.1, D + 1.1, 0.25);
  I.boom = new T.Group(); I.boom.position.copy(I.boomPivot); grp.add(I.boom); I.boom.rotation.set(0.75, 0, 0.35);
  I.boomLen = 3.9;
  I.boom.add(SB.mk(function (b) { b.put(new T.CylinderGeometry(0.06, 0.075, 3.9, 10), 0, 1.95, 0, { col: [0.86, 0.86, 0.82] }); b.put(new T.CylinderGeometry(0.11, 0.11, 0.06, 14), 0, 3.85, 0, { rx: PI / 2, col: [0.25, 0.25, 0.25] }); b.box(0, 3.85, 0, 0.05, 0.22, 0.03, { col: [0.6, 0.6, 0.6] }); }, SB.M.steel));
  /* 양망기: 받침, 유압 모터, 드럼, 손잡이 */
  var wx = 4.35, wz = 1.85;
  P.box(wx, D + 0.25, wz, 0.7, 0.5, 0.55, { col: MC, t: 1 }); solid(wx - 0.38, wx + 0.38, wz - 0.3, wz + 0.3, D, D + 1.0);
  P.put(new T.CylinderGeometry(0.16, 0.16, 0.26, 14), wx + 0.4, D + 0.68, wz, { rz: PI / 2, col: MC });
  P.box(wx - 0.36, D + 0.68, wz, 0.06, 0.5, 0.5, { col: MC }); P.box(wx + 0.27, D + 0.68, wz, 0.06, 0.5, 0.5, { col: MC });
  I.drum = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.17, 0.17, 0.56, 18), 0, 0, 0, { rz: PI / 2, col: [0.8, 0.82, 0.8] }); for (var k2 = 0; k2 < 6; k2++) b.box(0, Math.sin(k2 * 1.047) * 0.17, Math.cos(k2 * 1.047) * 0.17, 0.56, 0.025, 0.025, { col: [0.3, 0.3, 0.3] }); }, SB.M.machine);
  I.drum.position.set(wx - 0.04, D + 0.68, wz); grp.add(I.drum);
  I.drumRope = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.19, 0.19, 0.5, 18, 1, true), 0, 0, 0, { rz: PI / 2 }); }, SB.M.rope); I.drumRope.position.copy(I.drum.position); grp.add(I.drumRope);
  P.put(new T.CylinderGeometry(0.035, 0.04, 0.95, 8), wx - 0.25, D + 0.47, wz - 0.48, { col: [0.3, 0.3, 0.3] });
  I.lever = new T.Group(); I.lever.position.set(wx - 0.25, D + 0.95, wz - 0.48); grp.add(I.lever);
  I.lever.add(SB.mk(function (b) { b.tube([0, 0, 0], [0, 0.3, 0], 0.014, { col: [0.6, 0.6, 0.6] }); b.put(new T.SphereGeometry(0.04, 10, 8), 0, 0.32, 0, { col: [0.85, 0.1, 0.08] }); }, SB.M.pla));
  /* 장력계(바늘 판) */
  I.gauge = { x: wx - 0.37, y: D + 1.08, z: wz - 0.1 };
  B.winchAt = { x: wx, z: wz, drum: I.drum.position.clone() };
}

/* ---------- 이물: 선실 입구, 뗏목 자리(방수포), 양묘기, 그물 더미, 밧줄 사리 ---------- */
function bow(P, S, R, I, grp) {
  var WOOD = [0.42, 0.28, 0.16];
  P.box(5.6, D + 0.62, -1.3, 0.9, 1.24, 0.9, { col: [0.93, 0.92, 0.88], t: 1 }); solid(5.15, 6.05, -1.75, -0.85, D, D + 1.25, { wall: 1 });
  P.box(5.6, D + 1.26, -1.3, 0.98, 0.05, 0.98, { col: [0.3, 0.52, 0.66] });
  P.box(5.145, D + 0.55, -1.3, 0.02, 1.05, 0.62, { col: WOOD });                                    // 미닫이 문
  P.box(5.13, D + 0.6, -1.08, 0.02, 0.14, 0.04, { col: [0.75, 0.75, 0.7] });
  /* 장화 한 켤레 */
  [[4.95, -1.55], [4.95, -1.42]].forEach(function (q) { P.box(q[0], D + 0.17, q[1], 0.12, 0.34, 0.1, { col: [0.1, 0.1, 0.1] }); P.box(q[0] + 0.06, D + 0.04, q[1], 0.22, 0.08, 0.1, { col: [0.1, 0.1, 0.1] }); });
  /* 양묘기와 닻 사슬, 이물 말뚝 */
  P.box(8.55, D + 0.25, 0, 0.5, 0.5, 0.6, { col: [0.25, 0.55, 0.6] }); solid(8.25, 8.85, -0.35, 0.35, D, D + 0.6);
  R.put(new T.CylinderGeometry(0.15, 0.15, 0.7, 12), 8.55, D + 0.55, 0, { rx: PI / 2 });
  for (var k = 0; k < 9; k++) R.put(new T.TorusGeometry(0.045, 0.014, 5, 8), 8.85 + k * 0.08, D + 0.5 - k * 0.02, 0, { ry: k % 2 ? PI / 2 : 0 });
  [[7.6, 1.25], [7.6, -1.25], [-8.4, 1.6], [-8.4, -1.6], [0.0, 2.25], [0.0, -2.25]].forEach(function (q) { R.put(new T.CylinderGeometry(0.07, 0.08, 0.32, 10), q[0], D + 0.16, q[1]); R.put(new T.CylinderGeometry(0.1, 0.1, 0.03, 10), q[0], D + 0.33, q[1]); solid(q[0] - 0.1, q[0] + 0.1, q[1] - 0.1, q[1] + 0.1, D, D + 0.35); });
  /* 그물 더미(초록)와 밧줄 사리(노랑) */
  I.netPile = SB.mk(function (b) { var r = SB.rng(77); for (var j = 0; j < 7; j++) b.put(new T.SphereGeometry(0.45, 10, 6, 0, PI * 2, 0, PI / 2), (r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.6, { sx: 1 + r() * 0.5, sy: 0.4 + r() * 0.3, sz: 0.8 + r() * 0.3, col: [0.25, 0.55, 0.32] }); }, SB.M.net);
  I.netPile.position.set(6.1, D, 1.45); grp.add(I.netPile); solid(5.4, 6.8, 0.95, 1.95, D, D + 0.5);
  [[7.0, -1.5], [-1.8, 2.25], [4.9, 1.0]].forEach(function (q, j) { var M2 = j === 1 ? SB.M.ropeB : SB.M.rope; grp.add(SB.mk(function (b) { for (var r2 = 0; r2 < 4; r2++) b.put(new T.TorusGeometry(0.22 - r2 * 0.02, 0.025, 6, 20), 0, 0.025 + r2 * 0.04, 0, { rx: PI / 2 }); }, M2)).position.set(q[0], D, q[1]); });
  /* 뗏목 자리(방수포를 덮어 둔 곳) */
  B.raftAt = { x: 7.25, z: 0.05 };
}

/* ---------- 바깥 소품: 타이어 방현재, 고무 띠, 배수구, 양동이, 생선 상자, 나무판 더미 ---------- */
function outside(P, S, R, I, grp, xs) {
  /* 선체 바깥 고무 띠 */
  [1, -1].forEach(function (s) { for (var i = 0; i < xs.length - 1; i++) { var a = xs[i], c = xs[i + 1]; R.tube([a, D - 0.02, s * (sideZ(a, D) + 0.03)], [c, D - 0.02, s * (sideZ(c, D) + 0.03)], 0.05, { col: [0.14, 0.14, 0.15], seg: 6 }); } });
  /* 타이어: 밧줄로 뱃전에 매달림 */
  var tyreM = new T.MeshLambertMaterial({ color: 0x1b1b1b });
  [-6.5, -3.0, 0.8, 4.4].forEach(function (x) { [1, -1].forEach(function (s) {
    var z = s * (sideZ(x, 0.9) + 0.14), t = new T.Mesh(new T.TorusGeometry(0.28, 0.11, 8, 16), tyreM); t.position.set(x, 0.95, z); t.rotation.set(0, 0, 0); t.rotation.y = 0; grp.add(t);
    R.tube([x, TOP, s * (sideZ(x, TOP) + 0.02)], [x, 1.2, z], 0.012, { col: [0.8, 0.75, 0.4] });
  }); });
  /* 배수구(뱃전 아래 구멍) */
  [-5, -2, 1, 4].forEach(function (x) { [1, -1].forEach(function (s) { P.box(x, D + 0.05, s * (B.innerZ(x) + 0.004), 0.22, 0.08, 0.01, { col: [0.08, 0.08, 0.08] }); }); });
  /* 빨간 양동이와 밧줄 */
  I.bucket = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.15, 0.12, 0.28, 16, 1, true), 0, 0.14, 0, { col: [0.85, 0.15, 0.12] }); b.put(new T.CircleGeometry(0.12, 14), 0, 0.005, 0, { rx: -PI / 2, col: [0.6, 0.1, 0.08] }); b.put(new T.TorusGeometry(0.15, 0.008, 4, 16, PI), 0, 0.28, 0, { col: [0.7, 0.7, 0.7] }); b.put(new T.CylinderGeometry(0.149, 0.149, 0.01, 16), 0, 0.2, 0, { col: [0.24, 0.42, 0.48] }); }, SB.M.pla);
  I.bucket.position.set(0.9, D, -2.3); grp.add(I.bucket);
  grp.add(SB.mk(function (b) { for (var r2 = 0; r2 < 3; r2++) b.put(new T.TorusGeometry(0.16, 0.02, 5, 18), 0, 0.02 + r2 * 0.035, 0, { rx: PI / 2 }); }, SB.M.ropeB)).position.set(1.35, D, -2.25);
  /* 파란 생선 상자 더미 */
  var crateM = new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
  grp.add(SB.mk(function (b) { for (var k = 0; k < 4; k++) { var y = 0.14 + k * 0.27; b.box(0, y, 0, 0.62, 0.26, 0.42, { col: [0.16, 0.36, 0.7], ry: k % 2 ? 0.05 : -0.04 }); b.box(0, y + 0.06, 0.212, 0.2, 0.06, 0.004, { col: [0.06, 0.12, 0.28] }); } }, crateM)).position.set(-6.0, D, 2.05);
  solid(-6.33, -5.67, 1.82, 2.3, D, D + 1.1);
  /* 나무판(팔레트) 더미: 조타실 앞 우현. 위 두 장을 밤에 가져갈 수 있다 */
  var pal = function (b) { var WD = [0.62, 0.48, 0.32]; for (var k = 0; k < 5; k++) b.box(0, 0.105, -0.36 + k * 0.18, 1.0, 0.025, 0.13, { col: [WD[0] * (0.9 + k % 2 * 0.1), WD[1], WD[2]], t: 1 }); [-0.42, 0, 0.42].forEach(function (x) { b.box(x, 0.05, 0, 0.09, 0.08, 0.8, { col: [0.5, 0.38, 0.25] }); }); for (var j = 0; j < 3; j++) b.box(0, 0.0125, -0.33 + j * 0.33, 1.0, 0.025, 0.1, { col: [0.58, 0.45, 0.3] }); };
  B.palGeo = pal;
  I.pallets = [];
  for (var k = 0; k < 3; k++) { var pm = SB.mk(pal, SB.M.mat); pm.position.set(-2.6, D + k * 0.125, 2.12); pm.rotation.y = (k - 1) * 0.04; grp.add(pm); I.pallets.push(pm); }
  solid(-3.12, -2.08, 1.7, 2.54, D, D + 0.4);
}

/* ---------- 뗏목 재료가 놓이는 모습(이물 방수포 자리) ---------- */
function raftParts(grp, I) {
  var rx = B.raftAt.x, rz = B.raftAt.z, P = {}, styM = new T.MeshLambertMaterial({ color: 0xf2f2ee });
  P.pallet0 = SB.mk(B.palGeo, SB.M.mat); P.pallet0.position.set(rx, D + 0.02, rz - 0.4);
  P.pallet1 = SB.mk(B.palGeo, SB.M.mat); P.pallet1.position.set(rx, D + 0.02, rz + 0.4);
  [[rx - 0.32, rz - 0.98], [rx + 0.32, rz - 0.98], [rx - 0.32, rz + 0.98], [rx + 0.32, rz + 0.98]].forEach(function (q, k) {
    P['buoy' + k] = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.2, 0.2, 0.58, 14), 0, 0, 0, { rz: PI / 2, col: [0.95, 0.95, 0.93] }); b.put(new T.CylinderGeometry(0.205, 0.205, 0.04, 14), 0, 0, 0, { rz: PI / 2, col: [0.85, 0.3, 0.12] }); }, styM);
    P['buoy' + k].position.set(q[0], D + 0.2, q[1]);
  });
  [0, 1].forEach(function (k) { P['rope' + k] = SB.mk(function (b) { b.put(new T.TorusGeometry(0.5, 0.022, 6, 24), 0, 0, 0, { rx: PI / 2, sx: 1.1, sy: 2.1 }); }, SB.M.ropeB); P['rope' + k].position.set(rx + (k ? 0.3 : -0.3), D + 0.17, rz); P['rope' + k].rotation.z = PI / 2; P['rope' + k].scale.set(0.35, 1, 1); });
  P.oar = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.025, 0.028, 1.8, 8), 0, 0, 0, { rz: PI / 2, col: [0.62, 0.45, 0.28] }); b.box(1.05, 0, 0, 0.5, 0.02, 0.16, { col: [0.62, 0.45, 0.28] }); }, SB.M.mat);
  P.oar.position.set(rx - 0.2, D + 0.17, rz + 0.1); P.oar.rotation.y = 0.35;
  P.vest = SB.mk(function (b) { b.box(0, 0.05, 0, 0.42, 0.1, 0.5, { col: [0.98, 0.45, 0.08] }); b.box(0, 0.105, 0, 0.3, 0.012, 0.06, { col: [0.85, 0.85, 0.82] }); }, SB.M.mat); P.vest.position.set(rx + 0.15, D + 0.15, rz - 0.42);
  P.jug = SB.mk(function (b) { b.box(0, 0.19, 0, 0.26, 0.38, 0.2, { col: [0.88, 0.88, 0.84] }); b.put(new T.CylinderGeometry(0.035, 0.035, 0.05, 10), 0.07, 0.4, 0, { col: [0.2, 0.5, 0.85] }); }, SB.M.pla); P.jug.position.set(rx - 0.3, D + 0.15, rz - 0.45);
  P.compass = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.06, 0.065, 0.035, 16), 0, 0.018, 0, { col: [0.75, 0.6, 0.25] }); b.put(new T.CircleGeometry(0.05, 16), 0, 0.037, 0, { rx: -PI / 2, col: [0.95, 0.93, 0.85] }); }, SB.M.steel); P.compass.position.set(rx + 0.32, D + 0.15, rz + 0.45);
  Object.keys(P).forEach(function (k) { P[k].visible = false; grp.add(P[k]); });
  /* 방수포: 재료가 늘수록 불룩해진다 */
  var tg = new T.PlaneGeometry(1.9, 1.5, 12, 10); tg.rotateX(-PI / 2); I.tarpBase = tg.attributes.position.array.slice();
  I.tarp = new T.Mesh(tg, SB.M.tarp); I.tarp.position.set(rx + 0.1, D, rz + 0.35); grp.add(I.tarp);
  B.raftP = P; B.setTarp(0);
  solid(rx - 0.75, rx + 0.85, rz - 1.25, rz + 1.25, D, D + 0.5);
}
B.setTarp = function (n) {                          // n: 놓은 재료 수(0~12)
  var g = B.I.tarp.geometry, p = g.attributes.position.array, base = B.I.tarpBase, h = 0.16 + Math.min(1, n / 12) * 0.36, i, r = SB.rng(5);
  for (i = 0; i < p.length; i += 3) {
    var x = base[i] / 0.95, z = base[i + 2] / 0.75, bump = Math.max(0, 1 - Math.pow(Math.max(Math.abs(x), Math.abs(z * 1.1)), 3));
    p[i + 1] = 0.012 + h * bump * (0.75 + 0.25 * Math.sin(x * 7 + z * 3)) + (r() - 0.5) * 0.05 * bump;
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals();
};

/* ---------- 짓기 ---------- */
B.build = function (scene) {
  var grp = B.group = new T.Group(), M = SB.M, I = B.I = {};
  grp.rotation.order = 'YZX'; B.heading = 0.55; grp.rotation.y = B.heading; scene.add(grp);
  var H = new SB.Batch(), DK = new SB.Batch(), P = new SB.Batch(), PA = new SB.Batch(), G = new SB.Batch(), F = new SB.Batch(), S = new SB.Batch(), R = new SB.Batch(), RO = new SB.Batch(), MA = new SB.Batch();
  var xs = hull(H); deck(DK, xs);
  wheelhouse(PA, G, F, I); interior(P, I); roofGear(P, S, I, grp); galley(P, S, I); holdTable(P, S, I, grp); mastWinch(P, S, RO, I, grp); bow(P, S, R, I, grp); outside(P, S, R, I, grp, xs);
  [[H, M.hull], [DK, M.deck], [P, M.pla], [PA, M.paint], [G, M.glass], [F, M.pla], [S, M.steel], [R, M.rust], [RO, M.rope]].forEach(function (q) { var m = q[0].mesh(q[1]); m.castShadow = q[1] !== M.glass; m.receiveShadow = true; grp.add(m); if (q[1] === M.glass) m.renderOrder = 6; });
  [I.door, I.wheel, I.quilt, I.lockerLabel, I.tube, I.jug, I.spareJug].forEach(function (m) { grp.add(m); });
  grp.traverse(function (o) { if (o.isMesh && o.material !== M.glass) { o.castShadow = true; o.receiveShadow = true; } });
  raftParts(grp, I);
  /* 빛: 작업등, 조타실 등, 손전등·탐조등(개수 고정, 세기로만 켜고 끈다) */
  B.lampL = new T.PointLight(0xffb36a, 0, 22, 1.4); B.lampL.position.set(MX - 0.05, D + 4.3, 0); grp.add(B.lampL);
  B.cabL = new T.PointLight(0xfff0d8, 0, 6, 1.6); B.cabL.position.set(-5.3, D + 1.9, 0); grp.add(B.cabL);
  B.searchL = new T.SpotLight(0xfff6e0, 0, 160, 0.09, 0.4, 0.6); B.searchL.position.set(0.2, 0, 0); I.search.add(B.searchL); B.searchL.target.position.set(10, -0.6, 0); I.search.add(B.searchL.target);
  B.motion = { heave: 0, pitch: 0, roll: 0, t: 0 };
};

/* ---------- 파도 따라 흔들리기 ---------- */
B.update = function (dt, sea) {
  var m = B.motion, h = B.heading, c = Math.cos(h), s = Math.sin(h);
  function wh(lx, lz) { return sea.height(lx * c + lz * s, -lx * s + lz * c); }
  m.t += dt;
  var hb = wh(7, 0), hs = wh(-7, 0), hp = wh(0, -2.4), hst = wh(0, 2.4), k = Math.min(1, dt * 1.6);
  var heave = (hb + hs + hp + hst) / 4 * 0.75, pitch = Math.atan2(hb - hs, 14) * 0.8, roll = -Math.atan2(hst - hp, 4.8) * 0.7 + (0.032 * Math.sin(m.t * 0.92) + 0.012 * Math.sin(m.t * 1.73)) * sea.sea;
  m.heave += (heave - m.heave) * k; m.pitch += (pitch - m.pitch) * k; m.roll += (roll - m.roll) * k;
  B.group.position.y = m.heave; B.group.rotation.z = m.pitch; B.group.rotation.x = m.roll;
  for (var i = 0; i < B.I.flags.length; i++) { var f = B.I.flags[i]; f.rotation.y = Math.sin(m.t * 3 + i) * 0.25 + 0.2; f.rotation.x = Math.sin(m.t * 5.3 + i * 2) * 0.15 * (1 + sea.storm); }
  B.I.radar.rotation.y += dt * 2.2;
};

/* ---------- 걷기 부딪힘: 뱃전 안쪽 + 상자들(배 안 좌표, 원 반지름 r) ---------- */
var XMAX = 8.9;
(function () { for (var x = 9.5; x > 5; x -= 0.02) if (B.innerZ(x) > 0.55) { XMAX = x; break; } })();
B.collide = function (p, r) {
  var i, it;
  for (it = 0; it < 3; it++) {
    if (p.x < XS + 0.12 + r) p.x = XS + 0.12 + r; if (p.x > XMAX - r) p.x = XMAX - r;
    var w = B.innerZ(p.x) - r; if (p.z > w) p.z = w; if (p.z < -w) p.z = -w;
    for (i = 0; i < B.solids.length; i++) {
      var s = B.solids[i]; if (s.nc || s.off || s.y1 < D + 0.25) continue;
      var cx = SB.clamp(p.x, s.x0, s.x1), cz = SB.clamp(p.z, s.z0, s.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 < 1e-8) {                                     // 상자 안에 들어감: 가장 가까운 면으로
        var l = p.x - s.x0, rr = s.x1 - p.x, f = p.z - s.z0, bk = s.z1 - p.z, mn = Math.min(l, rr, f, bk);
        if (mn === l) p.x = s.x0 - r; else if (mn === rr) p.x = s.x1 + r; else if (mn === f) p.z = s.z0 - r; else p.z = s.z1 + r;
      } else { var d = Math.sqrt(d2), push = (r - d) / d; p.x += dx * push; p.z += dz * push; }
    }
  }
};
/* 조타실 안인가 */
B.inCabin = function (x, z) { return x > WX0 && x < WX1 && Math.abs(z) < WZ; };

/* ---------- 눈이 가리키는 것: 배 안 좌표의 광선으로 건드릴 것 상자를 찾는다. 벽 상자가 먼저 막으면 못 고른다 ---------- */
function slab(o, d, b, tmax) {
  var t0 = 0, t1 = tmax, k, lo = [b[0], b[1], b[2]], hi = [b[3], b[4], b[5]], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
  for (k = 0; k < 3; k++) {
    if (Math.abs(dd[k]) < 1e-8) { if (oo[k] < lo[k] || oo[k] > hi[k]) return -1; continue; }
    var a = (lo[k] - oo[k]) / dd[k], c = (hi[k] - oo[k]) / dd[k]; if (a > c) { var q = a; a = c; c = q; }
    if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) return -1;
  }
  return t0;
}
B.slab = slab;
var _inv = new T.Matrix4(), _o = new T.Vector3(), _dd = new T.Vector3();
B.toLocalRay = function (ray, out) {                 // 세계 광선을 배 안 좌표로
  _inv.copy(B.group.matrixWorld).invert(); out.origin.copy(ray.origin).applyMatrix4(_inv); out.direction.copy(ray.direction).transformDirection(_inv); return out;
};
B.pick = function (lray, maxD, filter) {
  var best = null, bt = maxD, i, t;
  for (i = 0; i < B.inter.length; i++) {
    var it = B.inter[i]; if (it.off || (it.ok && !it.ok()) || (filter && !filter(it))) continue;
    t = slab(lray.origin, lray.direction, it.box, bt); if (t >= 0 && t < bt) { bt = t; best = it; }
  }
  if (!best) return null;
  for (i = 0; i < B.solids.length; i++) { var s = B.solids[i]; if (!s.wall) continue; t = slab(lray.origin, lray.direction, [s.x0, s.y0, s.z0, s.x1, s.y1, s.z1], bt); if (t >= 0 && t < bt - 0.02) return null; }
  return best;
};
})();
