/* 치킨집 3D — 장면: 주방, 도구, 손님, 조각 겉모습, 알갱이 효과. 좌표는 작업대 위가 y=0, x 좌우, z 앞(+가 플레이어 쪽) */
var K3 = (function () {
'use strict';
var T = THREE, A = ART, TAU = Math.PI * 2, R, scene, cam, MOBILE = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent), TB = 0.2, NS = 0.5, vw = 1, vh = 1, Hu = 1280, Wu = 720;
/* 배치 둘: 세로 화면(TALL)은 앞뒤로 쌓고, 가로 화면(WIDE)은 옆으로 펼친다 */
var LAY = {
  tall: { slots: [-2.35, 0, 2.35], custZ: -5.6, counterZ: -4.4, box: [-2.2, -2.35], fry: [0.62, -2.5], strip0: -3.05, stripZ: -0.74, board: [-1.3, 2.02], bowl: [2.35, 0.98], crate: [1.85, 3.25], cleaver: [3.18, 3.3], fit: [3.8, 4.25, 3.6], wallS: 1 },
  wide: { slots: [-3.9, 0, 3.9], custZ: -4.6, counterZ: -3.4, box: [5.4, -1.85], fry: [3.1, 1.5], strip0: -4.6, stripZ: -1.9, board: [-2.55, 1.4], bowl: [0.85, 1.85], crate: [-5.6, 2.4], cleaver: [-5.6, 0.5], fit: [6.85, 3.6, 5.0], wallS: 2 }
};
var L = { slots: [-2.35, 0, 2.35], custZ: -5.6, counterZ: -4.4, box: { x: -2.2, z: -2.35, w: 2.5, d: 1.6 }, fry: [{ x: 0.62, z: -2.5 }, { x: 2.5, z: -2.5 }], FW: 1.6, FD: 1.9, strip0: -3.05, stripZ: -0.74,
  board: { x: -1.3, z: 2.02, w: 4.3, d: 3.8 }, bowl: { x: 2.35, z: 0.98, r: 1.12 }, crate: { x: 1.85, z: 3.25, w: 1.5, d: 1.5 }, cleaver: { x: 3.18, z: 3.3 }, fit: [3.8, 4.25, 3.6], wide: false, nf: 2 };
function stripX(k) { return L.strip0 + k * 1.017; }
function place(wide) {
  var a = LAY[wide ? 'wide' : 'tall']; L.wide = !!wide; L.slots = a.slots; L.custZ = a.custZ; L.counterZ = a.counterZ; L.box.x = a.box[0]; L.box.z = a.box[1]; L.fry[0].x = a.fry[0] + (L.nf < 2 ? 0.94 : 0); L.fry[0].z = a.fry[1]; L.fry[1].x = a.fry[0] + 1.88; L.fry[1].z = a.fry[1];
  L.strip0 = a.strip0; L.stripZ = a.stripZ; L.board.x = a.board[0]; L.board.z = a.board[1]; L.bowl.x = a.bowl[0]; L.bowl.z = a.bowl[1]; L.crate.x = a.crate[0]; L.crate.z = a.crate[1]; L.cleaver.x = a.cleaver[0]; L.cleaver.z = a.cleaver[1]; L.fit = a.fit;
  if (!O.boardM) return;
  O.boardM.position.set(L.board.x, 0, L.board.z); O.fryG.position.set(a.fry[0], 0, a.fry[1]); O.bowlG.position.set(L.bowl.x, 0, L.bowl.z); O.crate.position.set(L.crate.x, 0, L.crate.z);
  O.strip.forEach(function (g, k) { g.position.set(stripX(k), 0, L.stripZ); }); O.counter.position.z = L.counterZ; O.hall.position.z = L.custZ; O.wall.scale.x = a.wallS; O.wallT.repeat.x = a.wallS;
  var sc = O.sun.shadow.camera; sc.left = wide ? -10.5 : -6.5; sc.right = wide ? 10.5 : 6.5; sc.updateProjectionMatrix();
}
function tex(w, h, fn, rep) { var c = A.mk(w, h), x = c.getContext('2d'); fn(x, w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function std(o) { return new T.MeshStandardMaterial(o); }
function add(par, g, m, x, y, z, cast, recv) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = cast !== false; o.receiveShadow = recv !== false; par.add(o); return o; }
function slab(w, d, h, r, bev) {
  var s = new T.Shape(), x = -w / 2, y = -d / 2; bev = bev || 0; r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  var g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, h - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); return g;
}
function topTex(t, w, d) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / w, 1 / d); t.offset.set(0.5, 0.5); return t; }
var M = {}, G = {}, O = {};
function mats() {
  M.steel = std({ color: 0xd3d9de, metalness: 0.9, roughness: 0.32 });
  M.steelD = std({ color: 0x8a939b, metalness: 0.9, roughness: 0.4 });
  M.dark = std({ color: 0x24282c, roughness: 0.6 });
  M.kraft = std({ color: 0xffffff, roughness: 0.85, map: tex(256, 256, function (x) { A.kraft(x, -4, -4, 264, 264, 1); }, [1, 1]) });
  M.white = std({ color: 0xf4f7fa, roughness: 0.7 });
  M.wood = std({ color: 0xffffff, roughness: 0.62, map: tex(512, 512, function (x, w, h) { x.fillStyle = A.lg(x, 0, 0, w, h, [0, '#f0c98c', 0.5, '#e6b872', 1, '#d8a45c']); x.fillRect(0, 0, w, h); var Rn = A.rng(31), i; for (i = 0; i < 40; i++) { var y = Rn() * h; x.strokeStyle = 'rgba(150,96,40,' + (0.06 + Rn() * 0.12) + ')'; x.lineWidth = 1 + Rn() * 4; x.beginPath(); x.moveTo(-10, y); x.bezierCurveTo(w * 0.3, y + (Rn() - 0.5) * 30, w * 0.7, y + (Rn() - 0.5) * 30, w + 10, y + (Rn() - 0.5) * 14); x.stroke(); } for (i = 0; i < 30; i++) { var x0 = Rn() * w, y0 = Rn() * h, an = Rn() * TAU, l = 20 + Rn() * 90; x.strokeStyle = 'rgba(120,72,30,.25)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(an) * l, y0 + Math.sin(an) * l); x.stroke(); } }) });
  M.woodD = std({ color: 0x8a5a2c, roughness: 0.7 });
  M.red = std({ color: 0xd8261c, roughness: 0.5 });
  M.skin = {};
}
/* ---------- 조각 겉모습 ---------- */
var _c = new T.Color();
function rgbOf(str) { _c.setStyle(str); return [_c.r, _c.g, _c.b]; }
var SKIN = rgbOf('#f6cdb4'), FLESH = rgbOf('#f0a093'), BATTER = rgbOf('#f6e8c2'), SAUCE = { yang: rgbOf('#d32c14'), soy: rgbOf('#8a4614') };
function pieceMesh(P) {
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(P.pos), 3)); g.setIndex(new T.BufferAttribute(P.idx, 1)); g.computeVertexNormals();
  P.bnor = new Float32Array(g.attributes.normal.array);
  g.setAttribute('color', new T.BufferAttribute(new Float32Array(P.pos.length), 3));
  var m = new T.Mesh(g, std({ vertexColors: true, roughness: 0.4 })); m.castShadow = true; m.receiveShadow = true;
  P.mesh = m; P.key = null; restyle(P); scene.add(m); return m;
}
function styleKey(P) { return Math.round(P.coat * 6) + '_' + Math.round(Math.min(2.6, P.done) * 12) + '_' + (P.sauce || '') + Math.round(P.sa * 4); }
function restyle(P) {
  var k = styleKey(P); if (P.key === k) return; P.key = k;
  var g = P.mesh.geometry, pos = g.attributes.position.array, col = g.attributes.color.array, b = P.pos, n = P.bnor, N = b.length / 3, coat = P.coat, fried = P.done > 0.1, sd = P.seed % 97;
  var amp = coat * 0.07 + (fried ? 0.03 + 0.07 * coat : 0), crust = fried ? rgbOf(A.fryCol(P.done, coat)) : null, sa = P.sauce ? Math.min(1, P.sa) : 0, SC = P.sauce ? SAUCE[P.sauce] : null, fr = fried ? Math.min(1, P.done / 0.3) : 0, i;
  for (i = 0; i < N; i++) {
    var x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], n1 = CK.noise(x * 4.5 + sd, y * 4.5, z * 4.5), n2 = CK.noise(x * 13 + sd, y * 13, z * 13), d = amp * (0.2 + 1.0 * n1 + (fried ? 0.5 * n2 : 0.2 * n2));
    pos[i * 3] = x + n[i * 3] * d; pos[i * 3 + 1] = y + n[i * 3 + 1] * d; pos[i * 3 + 2] = z + n[i * 3 + 2] * d;
    var c = P.flesh[i] ? FLESH : SKIN, sh = P.flesh[i] ? 0.9 + 0.2 * n2 : 0.95 + 0.08 * n2, r = c[0] * sh, gg = c[1] * sh, bb = c[2] * sh;
    if (coat > 0.02) { var m = Math.min(1, coat * 1.2) * (0.7 + 0.3 * n1); m = Math.min(1, m + coat * coat * 0.4); r += (BATTER[0] - r) * m; gg += (BATTER[1] - gg) * m; bb += (BATTER[2] - bb) * m; }
    if (fried) { var q = (0.62 + 0.6 * n1) * (0.86 + 0.28 * n2); r += (crust[0] * q - r) * fr; gg += (crust[1] * q - gg) * fr; bb += (crust[2] * q - bb) * fr; }
    if (sa > 0) { var s = sa * 0.94, q2 = 0.75 + 0.5 * n1; r += (SC[0] * q2 - r) * s; gg += (SC[1] * q2 - gg) * s; bb += (SC[2] * q2 - bb) * s; }
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = bb;
  }
  g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; if (amp > 0) g.computeVertexNormals(); g.computeBoundingSphere();
  P.mesh.material.roughness = sa > 0.5 ? 0.2 : fried ? 0.78 : coat > 0.5 ? 0.6 : 0.38;
}
function dropPiece(P) { if (P.mesh) { scene.remove(P.mesh); P.mesh.geometry.dispose(); P.mesh.material.dispose(); P.mesh = null; } }

/* ---------- 알갱이(물방울·기포·부스러기·색종이) ---------- */
var PT = { max: 420, n: 0, list: [], mesh: null, dummy: null };
function partsInit() {
  PT.mesh = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), std({ roughness: 0.35 }), PT.max); PT.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); PT.mesh.frustumCulled = false; PT.mesh.count = 0;
  PT.mesh.setColorAt(0, new T.Color(1, 1, 1)); PT.dummy = new T.Object3D(); scene.add(PT.mesh);
}
/* k: drop(떨어지는 방울) bub(기름 기포) puff(김·연기) conf(색종이) */
function part(k, x, y, z, o) {
  if (PT.list.length >= PT.max) return;
  var p = { k: k, x: x, y: y, z: z, vx: 0, vy: 0, vz: 0, s: 0.05, life: 0, max: 0.6, col: '#fff', g: 22, floor: -99 }; for (var a in o) p[a] = o[a]; p.c = rgbOf(p.col); PT.list.push(p);
}
function burst(k, x, y, z, n, o) { for (var i = 0; i < n; i++) { var a = Math.random() * TAU, v = (o.v || 2) * (0.4 + Math.random() * 0.8), q = {}; for (var kk in o) q[kk] = o[kk]; q.vx = Math.cos(a) * v; q.vz = Math.sin(a) * v; q.vy = (o.up || 2) * (0.5 + Math.random() * 0.8); q.s = (o.s || 0.05) * (0.6 + Math.random() * 0.8); q.max = (o.max || 0.6) * (0.7 + Math.random() * 0.6); if (o.cols) q.col = o.cols[i % o.cols.length]; part(k, x + (Math.random() - 0.5) * (o.sp || 0), y, z + (Math.random() - 0.5) * (o.sp || 0), q); } }
function partsStep(dt) {
  var i, p, d = PT.dummy, m = PT.mesh, n = 0;
  for (i = PT.list.length - 1; i >= 0; i--) {
    p = PT.list[i]; p.life += dt; if (p.life >= p.max) { PT.list.splice(i, 1); continue; }
    if (p.k !== 'bub') { p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < p.floor) { p.y = p.floor; p.vy *= -0.3; p.vx *= 0.5; p.vz *= 0.5; } }
  }
  for (i = 0; i < PT.list.length; i++) {
    p = PT.list[i]; var u = p.life / p.max, s = p.k === 'bub' ? p.s * (0.4 + u * 0.9) * (u > 0.85 ? (1 - u) / 0.15 : 1) : p.k === 'puff' ? p.s * (0.6 + u * 1.6) * (1 - u * 0.7) : p.s * (u > 0.7 ? (1 - u) / 0.3 : 1);
    d.position.set(p.x, p.y, p.z); if (p.k === 'conf') { d.scale.set(s, s * 0.25, s * 0.7); d.rotation.set(p.life * 9, p.life * 7, 0); } else { d.scale.set(s, p.k === 'bub' ? s * 0.6 : s, s); d.rotation.set(0, 0, 0); }
    d.updateMatrix(); m.setMatrixAt(n, d.matrix); _c.setRGB(p.c[0], p.c[1], p.c[2]); m.setColorAt(n, _c); n++;
  }
  m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

/* ---------- 주방 짓기 ---------- */
var OILY = 0.36, BATY = 0.52;
function matTop(base, w, d) { var m = base.clone(); m.map = base.map.clone(); m.map.needsUpdate = true; topTex(m.map, w, d); return m; }
/* 벽: 옛날 치킨집 전단지를 다닥다닥 붙인 벽(사장님 10/2 "찌라시 느낌"). 글은 ?lang=en 이면 영어 */
var EN = /[?&]lang=en\b/.test(location.search), WF = "'Ria','Malgun Gothic',sans-serif";
function wtxt(x, s, px, py, size, col, al, sc, maxw) {
  x.font = '900 ' + size + 'px ' + WF; while (maxw && size > 8 && x.measureText(s).width > maxw) { size -= 1; x.font = '900 ' + size + 'px ' + WF; }
  x.textAlign = al || 'left'; x.textBaseline = 'middle';
  if (sc) { x.lineJoin = 'round'; x.lineWidth = size * 0.2; x.strokeStyle = sc; x.strokeText(s, px, py); }
  x.fillStyle = col; x.fillText(s, px, py); return x.measureText(s).width;
}
function paper(x, px, py, w, h, rot, col, fn) {
  x.save(); x.translate(px + w / 2, py + h / 2); x.rotate(rot);
  x.fillStyle = 'rgba(70,35,10,.3)'; x.fillRect(-w / 2 + 5, -h / 2 + 7, w, h);
  x.fillStyle = col; x.fillRect(-w / 2, -h / 2, w, h);
  x.save(); x.beginPath(); x.rect(-w / 2, -h / 2, w, h); x.clip(); x.translate(-w / 2, -h / 2); fn(w, h);
  x.fillStyle = A.lg(x, 0, 0, w, h, [0, 'rgba(255,255,255,.16)', 0.5, 'rgba(255,255,255,0)', 1, 'rgba(80,40,0,.12)']); x.fillRect(0, 0, w, h); x.restore();
  [[-w / 2 + 20, -h / 2 - 3, -0.5], [w / 2 - 20, -h / 2 - 3, 0.5]].forEach(function (t) { x.save(); x.translate(t[0], t[1]); x.rotate(t[2]); x.fillStyle = 'rgba(255,248,214,.82)'; x.fillRect(-21, -8, 42, 16); x.fillStyle = 'rgba(160,130,70,.25)'; x.fillRect(-21, -8, 42, 2); x.restore(); });
  x.restore();
}
function starburst(x, cx, cy, r, n, col, edge) { x.beginPath(); for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * TAU, q = i % 2 ? r * 0.78 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fillStyle = col; x.fill(); if (edge) { x.strokeStyle = edge; x.lineWidth = 3; x.stroke(); } }
function dots(x, x0, x1, y, col) { x.fillStyle = col; for (var q = x0; q < x1; q += 9) { x.beginPath(); x.arc(q, y, 1.7, 0, TAU); x.fill(); } }
/* 가격 한 줄: 값을 먼저 재고 남는 폭에 이름을 맞춘 뒤 사이를 점으로 잇는다 */
function priceLine(x, name, price, y, pw, ns, ps, sc) { var m = 16, pwid = wtxt(x, price, pw - m, y, ps, '#d4140c', 'right', sc), nw = wtxt(x, name, m + 2, y, ns, '#1a1410', 'left', null, pw - m * 2 - pwid - 34); dots(x, m + 10 + nw, pw - m - pwid - 8, y + 2, '#1a1410'); }
function pile(x, cx, cy, s, kind) {
  A.ell(x, cx, cy + 30 * s, 100 * s, 30 * s); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#c9c2b4'; x.lineWidth = 3; x.stroke();
  A.ell(x, cx - 62 * s, cy - 8 * s, 30 * s, 22 * s); x.fillStyle = '#2f7a2a'; x.fill(); A.ell(x, cx - 50 * s, cy - 20 * s, 20 * s, 16 * s); x.fillStyle = '#48a23a'; x.fill();
  [[-34, 6, -0.9], [38, 4, 0.8], [-4, -4, 0.15], [-62, 20, -1.3], [64, 22, 1.25], [14, 22, 0.5], [-24, 24, -0.4]].forEach(function (p) { x.save(); x.translate(cx + p[0] * s, cy + p[1] * s); x.rotate(p[2]); A.icon(x, kind || 'plain', 40 * s); x.restore(); });
}
function wallDraw(x, w, h, day) {
  var Rn = A.rng(77), i, T = EN ? {
    crash: 'PRICE CRASH', fr: 'FRIED', yn: 'SPICY', sv: 'FREE: RADISH + COLA', big: 'CHICKEN', out: 'TAKE OUT OK', no1: 'No.1', nw: 'NEW', soy: 'SOY CHICKEN', pa: 'SCALLIONS', cp: '10 COUPONS = 1 FREE', fresh: 'FRESH EVERY DAY', oil: 'NEW OIL DAILY', crispy: 'SO CRISPY',
    band: ['PRICE CRASH', 'FRIED', 'SPICY', 'SOY', 'TAKE OUT']
  } : {
    crash: '가격파괴', fr: '후라이드', yn: '양념치킨', sv: '써비스: 치킨무 + 콜라', big: '치킨', out: '포장 배달 OK', no1: '원조', nw: '신메뉴', soy: '간장치킨', pa: '파채 추가', cp: '쿠폰 10장 = 한 마리', fresh: '당일 잡은 생닭', oil: '기름 매일 교체', crispy: '바삭바삭',
    band: ['가격파괴', '후라이드', '양념치킨', '간장치킨', '포장 배달']
  };
  /* 누런 벽 + 얼룩 + 뜯긴 전단지 자국 */
  x.fillStyle = A.lg(x, 0, 0, 0, h, [0, '#f6e6c2', 1, '#ecd2a0']); x.fillRect(0, 0, w, h);
  for (i = 0; i < 26; i++) { var sx = Rn() * w, sy = Rn() * h, sr = 30 + Rn() * 90; x.fillStyle = A.rg(x, sx, sy, 2, sr, [0, 'rgba(150,100,40,.10)', 1, 'rgba(150,100,40,0)']); x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); }
  for (i = 0; i < 9; i++) { x.save(); x.translate(Rn() * w, 20 + Rn() * 440); x.rotate((Rn() - 0.5) * 0.5); x.fillStyle = ['rgba(255,255,255,.5)', 'rgba(255,226,120,.45)', 'rgba(240,120,100,.3)'][i % 3]; x.fillRect(-30 - Rn() * 30, -18 - Rn() * 16, 60 + Rn() * 60, 34 + Rn() * 30); x.restore(); }
  /* 0. 윗줄(세로 화면에서만 보인다): 빨간 큰 현수막 + 쪽지 */
  paper(x, 16, 12, 560, 138, -0.012, '#d81e12', function (pw, ph) {
    x.strokeStyle = '#ffd92e'; x.lineWidth = 5; x.strokeRect(9, 9, pw - 18, ph - 18);
    wtxt(x, T.crash, 26, ph / 2 + 2, 84, '#ffe23a', 'left', '#5a0a04', 330);
    starburst(x, pw - 150, ph / 2, 52, 14, '#ffe23a', '#5a0a04'); x.save(); x.translate(pw - 150, ph / 2); x.rotate(-0.2); wtxt(x, T.no1, 0, 1, 30, '#d4140c', 'center', null, 78); x.restore();
    x.save(); x.translate(pw - 58, ph / 2 + 4); x.rotate(0.5); A.icon(x, 'plain', 50); x.restore();
  });
  paper(x, 600, 18, 404, 128, 0.02, '#fffdf4', function (pw, ph) {
    x.fillStyle = '#1f8a3a'; x.fillRect(0, 0, pw, 12); x.fillRect(0, ph - 12, pw, 12);
    wtxt(x, T.fresh, pw / 2, 46, 40, '#1f8a3a', 'center', null, pw - 40); wtxt(x, T.oil, pw / 2, 90, 34, '#1a1410', 'center', null, pw - 40);
  });
  /* 1. 노란 전단: 가격파괴 도장 + 치킨 접시 + 가격표 (가로 화면은 여기부터 보인다) */
  paper(x, 22, 166, 380, 232, -0.03, '#ffd92e', function (pw, ph) {
    x.fillStyle = A.rg(x, 286, 56, 10, 150, [0, '#fff6a8', 1, 'rgba(255,217,46,0)']); x.fillRect(0, 0, pw, ph);
    pile(x, 290, 44, 0.66, 'plain');
    x.save(); x.translate(100, 52); x.rotate(-0.13); x.strokeStyle = '#d4140c'; x.lineWidth = 6; x.strokeRect(-86, -34, 172, 68); x.lineWidth = 2.5; x.strokeRect(-78, -26, 156, 52); wtxt(x, T.crash, 0, 2, 44, '#d4140c', 'center', null, 146); x.restore();
    priceLine(x, T.fr, '₩8,000', 116, pw, 32, 36, '#fff');
    priceLine(x, T.yn, '₩9,000', 158, pw, 32, 36, '#fff');
    A.rr(x, 12, 184, pw - 24, 40, 20); x.fillStyle = '#1f8a3a'; x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); wtxt(x, T.sv, pw / 2, 205, 24, '#fff', 'center', null, pw - 56);
  });
  /* 2. 빨간 전단: 치킨 큰 글씨 + 포장 배달 */
  paper(x, 420, 172, 252, 226, 0.028, '#d81e12', function (pw, ph) {
    x.fillStyle = A.rg(x, pw / 2, 90, 10, 180, [0, '#ff5a3a', 1, 'rgba(216,30,18,0)']); x.fillRect(0, 0, pw, ph);
    x.strokeStyle = '#ffd92e'; x.lineWidth = 5; x.strokeRect(9, 9, pw - 18, ph - 18);
    wtxt(x, T.big, pw / 2 - (EN ? 0 : 34), 70, EN ? 50 : 88, '#ffe23a', 'center', '#5a0a04', EN ? pw - 40 : 160);
    x.save(); x.translate(pw - 58, EN ? 128 : 84); x.rotate(0.25); A.icon(x, 'yang', 50); x.restore();
    x.fillStyle = '#fff'; x.fillRect(20, 168, pw - 40, 40); wtxt(x, T.out, pw / 2, 189, 27, '#d4140c', 'center', null, pw - 56);
    wtxt(x, T.crispy, EN ? 96 : pw / 2 - 30, 136, 24, '#fff', 'center', null, 150);
  });
  /* 3. 흰 전단: 신메뉴 간장치킨 */
  paper(x, 690, 164, 312, 236, -0.02, '#fffdf4', function (pw, ph) {
    x.fillStyle = '#d81e12'; x.fillRect(0, 0, pw, 54); wtxt(x, T.soy, pw / 2 + 30, 28, 34, '#fff', 'center', null, pw - 110);
    starburst(x, 42, 36, 38, 12, '#ffe23a', '#d81e12'); x.save(); x.translate(42, 36); x.rotate(-0.25); wtxt(x, T.nw, 0, 1, 20, '#d4140c', 'center', null, 54); x.restore();
    x.fillStyle = A.rg(x, pw / 2, 104, 10, 130, [0, '#ffe9b0', 1, 'rgba(255,253,244,0)']); x.fillRect(0, 54, pw, 110);
    pile(x, pw / 2 + 10, 96, 0.6, 'soy');
    priceLine(x, T.soy, '₩9,000', 164, pw, 27, 30, null);
    priceLine(x, T.pa, '₩1,000', 200, pw, 27, 30, null);
    x.fillStyle = '#ffd92e'; x.fillRect(0, ph - 12, pw, 12);
  });
  /* 4. 아랫줄 작은 쪽지들 */
  [[20, T.cp, '#fffdf4', '#d4140c', 0.03], [262, T.fresh, '#ffd92e', '#1a1410', -0.04], [470, T.oil, '#1f8a3a', '#fff', 0.02], [668, T.cp, '#ff7a2a', '#fff', -0.03], [858, T.fresh, '#fffdf4', '#1f8a3a', 0.04]].forEach(function (q, k) {
    paper(x, q[0], 408 + (k % 2) * 6, k === 4 ? 150 : 210 - (k % 2) * 24, 64, q[4], q[2], function (pw, ph) { x.strokeStyle = q[3]; x.lineWidth = 3; x.setLineDash([7, 5]); x.strokeRect(6, 6, pw - 12, ph - 12); x.setLineDash([]); wtxt(x, q[1], pw / 2, ph / 2 + 1, 25, q[3], 'center', null, pw - 26); });
  });
  /* 5. 아래 빨간 띠: 노란 글씨가 죽 이어진다 */
  x.fillStyle = A.lg(x, 0, h - 150, 0, h, [0, '#e0281e', 1, '#a81810']); x.fillRect(0, h - 150, w, 150); x.fillStyle = '#ffd23a'; x.fillRect(0, h - 158, w, 10); x.fillRect(0, h - 62, w, 5);
  var bx = 14, k2 = 0; while (bx < w - 40) { var s = T.band[k2 % T.band.length]; x.font = '900 46px ' + WF; var tw = x.measureText(s).width; if (bx + tw > w - 8) break; wtxt(x, s, bx, h - 104, 46, '#ffe23a', 'left', '#5a0a04'); bx += tw + 22; starburst(x, bx, h - 104, 13, 5, '#fff'); bx += 36; k2++; }
}
function makeBox() {
  var w = L.box.w, d = L.box.d, g = new T.Group(), hh = 0.55, t = 0.06, B = { g: g };
  add(g, slab(w, d, 0.06, 0.08, 0), M.kraft, 0, 0, 0);
  add(g, new T.BoxGeometry(w, hh, t), M.kraft, 0, hh / 2, d / 2 - t / 2); add(g, new T.BoxGeometry(w, hh, t), M.kraft, 0, hh / 2, -d / 2 + t / 2);
  add(g, new T.BoxGeometry(t, hh, d), M.kraft, w / 2 - t / 2, hh / 2, 0); add(g, new T.BoxGeometry(t, hh, d), M.kraft, -w / 2 + t / 2, hh / 2, 0);
  add(g, new T.PlaneGeometry(w - 0.14, d - 0.14).rotateX(-Math.PI / 2), O.paperM, 0, 0.075, 0, false, true);
  B.lid = new T.Group(); B.lid.position.set(0, hh + 0.01, -d / 2); g.add(B.lid);
  var lid = add(B.lid, new T.BoxGeometry(w + 0.04, 0.05, d + 0.04), [M.kraft, M.kraft, O.lidM, M.kraft, M.kraft, M.kraft], 0, 0.025, d / 2);
  add(B.lid, new T.BoxGeometry(w + 0.04, 0.2, 0.05), M.kraft, 0, -0.08, d + 0.02);
  B.mu = new T.Group(); B.mu.position.set(w / 2 - 0.44, 0.46, -d / 2 + 0.44); g.add(B.mu);
  /* 치킨무: 네모 통(민트 테두리)에 흰 깍두기 — 양념 줄 통·말풍선 그림과 같은 모양 */
  add(B.mu, new T.BoxGeometry(0.6, 0.3, 0.6), std({ color: 0xd6ecf4, roughness: 0.2, transparent: true, opacity: 0.8 }), 0, 0.15, 0);
  var tm = std({ color: 0x58c0a8, roughness: 0.5 });
  add(B.mu, new T.BoxGeometry(0.68, 0.06, 0.08), tm, 0, 0.31, -0.3); add(B.mu, new T.BoxGeometry(0.68, 0.06, 0.08), tm, 0, 0.31, 0.3);
  add(B.mu, new T.BoxGeometry(0.08, 0.06, 0.68), tm, -0.3, 0.31, 0); add(B.mu, new T.BoxGeometry(0.08, 0.06, 0.68), tm, 0.3, 0.31, 0);
  for (var i = 0; i < 9; i++) add(B.mu, new T.BoxGeometry(0.15, 0.15, 0.15), M.white, -0.16 + (i % 3) * 0.16, 0.3 + (i % 2) * 0.05, -0.16 + Math.floor(i / 3) * 0.16).rotation.set(i * 0.4, i * 1.3, i * 0.2);
  /* 콜라: 흰 띠 두른 빨간 캔을 눕혀 담는다(세우면 위에서 은색 뚜껑만 보인다) */
  B.cola = new T.Group(); B.cola.position.set(w / 2 - 0.4, 0.46, d / 2 - 0.5); g.add(B.cola);
  var cg = new T.Group(); cg.position.set(0, 0.24, 0); cg.rotation.set(-1.3, 0, 0.12); B.cola.add(cg);
  add(cg, new T.CylinderGeometry(0.2, 0.2, 0.62, 16), std({ color: 0xe02a1e, roughness: 0.25, metalness: 0.5 }), 0, 0, 0);
  add(cg, new T.CylinderGeometry(0.206, 0.206, 0.18, 16, 1, true), std({ color: 0xffffff, roughness: 0.4 }), 0, 0.02, 0);
  add(cg, new T.CylinderGeometry(0.17, 0.2, 0.05, 16), M.steel, 0, 0.335, 0);
  B.mu.visible = B.cola.visible = false; B.bits = null;
  scene.add(g); return B;
}
/* 상자 위 고명: 파채·치즈가루 조각을 한 번에 그린다 */
function bits(B, kind, pts) {
  if (B.bits) { B.g.remove(B.bits); B.bits.geometry.dispose(); }
  var geo = kind === 'pa' ? new T.TorusGeometry(0.1, 0.022, 5, 8, 2.6) : new T.BoxGeometry(0.05, 0.035, 0.05), im = new T.InstancedMesh(geo, std({ roughness: 0.6 }), pts.length), d = PT.dummy, i;
  for (i = 0; i < pts.length; i++) { d.position.set(pts[i][0], pts[i][1], pts[i][2]); d.rotation.set(Math.random() * 3, Math.random() * 6, Math.random() * 3); var s = 0.7 + Math.random() * 0.7; d.scale.set(s, s, s); d.updateMatrix(); im.setMatrixAt(i, d.matrix); _c.setStyle(kind === 'pa' ? ['#58a82e', '#86cc4a', '#dff0b8'][i % 3] : ['#ffd23a', '#ffe680', '#f0a818'][i % 3]); im.setColorAt(i, _c); }
  im.count = 0; im.castShadow = true; B.bits = im; B.g.add(im); return im;
}
function drumMesh(flavor) {
  var g = new T.Group(), col = flavor === 'yang' ? 0xd0301a : flavor === 'soy' ? 0x8a4a18 : 0xe0a23c, pts = [[0, 0.56], [0.2, 0.52], [0.36, 0.32], [0.4, 0.06], [0.3, -0.2], [0.13, -0.36], [0.07, -0.42]].map(function (p) { return new T.Vector2(p[0], p[1]); });
  add(g, new T.LatheGeometry(pts, 14), std({ color: col, roughness: flavor === 'plain' ? 0.8 : 0.25 }), 0, 0, 0);
  var bm = std({ color: 0xfff4e0, roughness: 0.6 }); add(g, new T.CylinderGeometry(0.055, 0.055, 0.4, 8), bm, 0, -0.6, 0); add(g, new T.SphereGeometry(0.085, 8, 6), bm, -0.05, -0.82, 0); add(g, new T.SphereGeometry(0.085, 8, 6), bm, 0.05, -0.82, 0);
  return g;
}
/* ---------- 손님 ---------- */
var SKC = { a: ['#ffe0c6', '#f4c4a0'], b: ['#f6d0ac', '#e8b088'], c: ['#e2b084', '#cf9464'] }, faceCache = {};
function faceTex(d, mood, blink, chew) {
  var key = d.id + mood + (blink ? 'b' : '') + (mood === 'yum' ? chew : ''), t = faceCache[key];
  if (!t) { t = tex(256, 256, function (x) { x.translate(128, 122); x.scale(2.2, 2.2); PEOPLE.face(x, d, { mood: mood, blink: !!blink, chew: chew / 14, seed: 0, t: 0 }, PEOPLE.SK[d.sk]); }); faceCache[key] = t; }
  return t;
}
function torsoTex(d) {
  return tex(128, 128, function (x) {
    var k = d.kind, i; x.fillStyle = d.top; x.fillRect(0, 0, 128, 128);
    if (k === 'uniform') { x.strokeStyle = d.trim; x.lineWidth = 7; x.beginPath(); x.moveTo(46, 0); x.lineTo(64, 34); x.lineTo(82, 0); x.stroke(); }
    else if (k === 'ribbon') { x.fillStyle = d.trim; x.beginPath(); x.moveTo(64, 20); x.lineTo(46, 8); x.lineTo(46, 32); x.closePath(); x.fill(); x.beginPath(); x.moveTo(64, 20); x.lineTo(82, 8); x.lineTo(82, 32); x.closePath(); x.fill(); }
    else if (k === 'tie') { x.fillStyle = '#4a4e5a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(46, 0); x.lineTo(64, 70); x.lineTo(82, 0); x.fill(); x.fillStyle = d.trim; x.fillRect(60, 6, 8, 60); }
    else if (k === 'flower') { for (i = 0; i < 30; i++) { var fx = (i * 53) % 128, fy = (i * 31) % 128; x.fillStyle = d.trim; A.ell(x, fx, fy, 5, 5); x.fill(); x.fillStyle = '#fff'; A.ell(x, fx, fy, 2, 2); x.fill(); } }
    else if (k === 'vest') { x.fillStyle = '#ffe24a'; x.fillRect(0, 40, 128, 12); x.fillStyle = d.trim; x.fillRect(62, 0, 5, 128); }
    else if (k === 'stripe') { x.fillStyle = d.trim; for (i = 6; i < 128; i += 22) x.fillRect(0, i, 128, 9); }
    else if (k === 'zip') { x.fillStyle = d.trim; x.fillRect(62, 0, 4, 128); x.fillRect(0, 44, 128, 7); }
    else if (k === 'hood') { x.strokeStyle = d.trim; x.lineWidth = 3; x.beginPath(); x.moveTo(58, 4); x.lineTo(57, 40); x.moveTo(70, 4); x.lineTo(71, 36); x.stroke(); }
    else if (k === 'cardigan') { x.fillStyle = d.trim; x.beginPath(); x.moveTo(48, 0); x.lineTo(64, 44); x.lineTo(80, 0); x.fill(); x.fillStyle = '#5a3a1a'; A.ell(x, 68, 60, 3, 3); x.fill(); A.ell(x, 68, 80, 3, 3); x.fill(); }
    else if (k === 'neck' || k === 'chain') { x.strokeStyle = d.trim; x.lineWidth = k === 'chain' ? 6 : 3; x.beginPath(); x.arc(64, -6, 34, 0.5, Math.PI - 0.5); x.stroke(); x.fillStyle = d.trim; x.fillRect(58, 26, 12, 9); }
    x.fillStyle = A.lg(x, 0, 60, 0, 128, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,.25)']); x.fillRect(0, 0, 128, 128);
  });
}
function cap(r, th) { return new T.SphereGeometry(r, 20, 12, 0, TAU, 0, th); }
function person(d) {
  var g = new T.Group(), sk = SKC[d.sk], skinM = std({ color: sk[0], roughness: 0.65 }), hairM = std({ color: d.hc, roughness: 0.55 }), w = d.small ? 0.8 : 0.98, sc = d.small ? 0.86 : 1, h = d.hair, P = { g: g, d: d }, i, o;
  var pts = [[0, -2.4], [w * 0.92, -2.4], [w, -0.7], [w * 0.97, 0.2], [w * 0.72, 0.58], [0.34, 0.74], [0, 0.76]].map(function (p) { return new T.Vector2(p[0], p[1]); });
  o = add(g, new T.LatheGeometry(pts, 20).rotateY(Math.PI), std({ map: torsoTex(d), roughness: 0.8 }), 0, 0, 0);
  add(g, new T.CylinderGeometry(0.27, 0.3, 0.4, 12), skinM, 0, 0.9, 0);
  var hd = new T.Group(); hd.position.set(0, 1.85, 0.05); hd.rotation.x = -0.72; g.add(hd); P.head = hd;
  o = add(hd, new T.SphereGeometry(0.95, 24, 18), skinM, 0, 0, 0); o.scale.set(1, 0.95, 0.96);
  add(hd, new T.SphereGeometry(0.17, 8, 8), skinM, -0.93, -0.05, 0); add(hd, new T.SphereGeometry(0.17, 8, 8), skinM, 0.93, -0.05, 0);
  P.faceM = new T.MeshBasicMaterial({ map: faceTex(d, 'happy', 0, 0), transparent: true, depthWrite: false, toneMapped: false });
  o = add(hd, new T.SphereGeometry(0.975, 20, 14, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.9, 1.8), P.faceM, 0, 0, 0, false, false); o.scale.set(1, 0.95, 0.96); o.renderOrder = 2;
  function hair(geo, x, y, z, sx, sy, sz, rx, mat) { var m = add(hd, geo, mat || hairM, x, y, z); if (sx) m.scale.set(sx, sy, sz); if (rx) m.rotation.x = rx; return m; }
  if (h === 0 || h === 2) { hair(cap(1.0, 1.25), 0, 0, 0, 1, 1, 1, -0.55); hair(new T.SphereGeometry(0.4, 10, 8), h === 2 ? 0.3 : 0, 0.7, 0.55, h === 2 ? 1.5 : 1.7, 0.45, 0.8); }
  else if (h === 1 || h === 10) { hair(cap(1.04, 1.8), 0, 0, 0, 1, 1, 1, -0.95); hair(new T.SphereGeometry(0.42, 10, 8), 0, 0.72, 0.5, 1.9, 0.5, 0.9); if (h === 10) hair(new T.SphereGeometry(0.7, 12, 10), 0, -0.75, -0.8, 1.1, 1.25, 0.4); else hair(new T.BoxGeometry(0.3, 0.1, 0.06), 0.5, 0.62, 0.78, 1, 1, 1, 0, std({ color: 0xff5a7a, roughness: 0.5 })); }
  else if (h === 3) { for (i = 0; i < 22; i++) { var yy = 1 - (i + 0.5) / 22 * 1.25, rr2 = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.4; var px = Math.cos(a) * rr2, pz = Math.sin(a) * rr2; if (pz > 0.45 && yy < 0.55) continue; hair(new T.SphereGeometry(0.36, 8, 6), px * 0.92, yy * 0.9, pz * 0.9); } }
  else if (h === 4 || h === 9) { hair(new T.SphereGeometry(0.34, 8, 8), -0.86, -0.02, -0.2, 0.55, 1, 1.1); hair(new T.SphereGeometry(0.34, 8, 8), 0.86, -0.02, -0.2, 0.55, 1, 1.1); if (h === 9) hair(cap(0.99, 1.3), 0, 0, 0, 1, 1, 1, -1.9); }
  else if (h === 5) { hair(cap(1.1, 1.5), 0, 0.02, 0, 1, 1, 1, -0.4); o = hair(new T.TorusGeometry(1.11, 0.09, 6, 20, Math.PI), 0, 0.02, 0, 1, 1, 1, 0, M.white); o.rotation.set(0, Math.PI / 2, 0); hair(new T.SphereGeometry(0.5, 10, 8), 0, 0.72, 0.72, 1.5, 0.3, 0.6, 0, M.dark); }
  else if (h === 6 || h === 11) { hair(cap(1.04, 1.2), 0, 0.02, 0, 1, 1, 1, -0.3); o = hair(new T.CylinderGeometry(0.72, 0.72, 0.07, 18, 1, false, -Math.PI / 2, Math.PI), 0, 0.45, 0.72, 1, 1, h === 11 ? 1.0 : 1.2, 0, std({ color: A.mix(d.hc, '#000000', 0.25), roughness: 0.6 })); o.rotation.set(h === 11 ? 0.05 : 0.25, Math.PI / 2, 0); hair(new T.SphereGeometry(0.3, 8, 8), -0.86, -0.1, -0.2, 0.5, 0.9, 1, 0, std({ color: 0x2a2220, roughness: 0.6 })); hair(new T.SphereGeometry(0.3, 8, 8), 0.86, -0.1, -0.2, 0.5, 0.9, 1, 0, std({ color: 0x2a2220, roughness: 0.6 })); }
  else if (h === 7) { hair(cap(1.01, 1.3), 0, 0, 0, 1, 1, 1, -0.6); hair(new T.SphereGeometry(0.42, 10, 8), 0, 0.55, -1.1, 0.9, 1.5, 0.8, 0.6); o = hair(new T.TorusGeometry(0.97, 0.07, 6, 24), 0, 0.38, 0.02, 1, 1, 1, 0, M.white); o.rotation.x = Math.PI / 2 - 0.25; }
  else if (h === 8) { hair(cap(1.0, 1.25), 0, 0, 0, 1, 1, 1, -0.55); hair(new T.SphereGeometry(0.4, 10, 8), 0.1, 0.7, 0.55, 1.6, 0.45, 0.8); o = hair(new T.TorusGeometry(1.08, 0.07, 6, 20, Math.PI), 0, 0, 0, 1, 1, 1, 0, M.dark); for (i = -1; i <= 1; i += 2) { o = hair(new T.CylinderGeometry(0.3, 0.3, 0.2, 14), i * 1.02, -0.05, 0, 1, 1, 1, 0, M.dark); o.rotation.z = Math.PI / 2; o = hair(new T.CylinderGeometry(0.16, 0.16, 0.22, 10), i * 1.03, -0.05, 0, 1, 1, 1, 0, std({ color: 0x8af06a, roughness: 0.4 })); o.rotation.z = Math.PI / 2; } }
  /* 먹는 손 */
  P.hand = new T.Group(); P.hand.visible = false; g.add(P.hand); add(P.hand, new T.SphereGeometry(0.24, 10, 8), skinM, 0, 0, 0);
  g.scale.setScalar(sc * 0.92); scene.add(g); return P;
}
function personFace(P, mood, blink, chew) { var t = faceTex(P.d, mood, blink, chew); if (P.faceM.map !== t) { P.faceM.map = t; P.faceM.needsUpdate = true; } }
function personEat(P, flavor) { if (P.drum) { P.hand.remove(P.drum); P.drum = null; } if (flavor) { P.drum = drumMesh(flavor); P.drum.position.set(0, 0.62, 0); P.hand.add(P.drum); } P.hand.visible = !!flavor; }
function personDrop(P) { scene.remove(P.g); P.g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }

function build() {
  var i, o, g;
  /* 작업대 */
  /* 조리대: 원목 널빤지(사장님 10/2 "조리대를 원목나무색으로") */
  var tt = tex(1024, 1024, function (x, w, h) {
    var Rn = A.rng(8), n = 8, ph = h / n, r, q;
    for (r = 0; r < n; r++) {
      var off = Rn() * w, seg = [0.34 + Rn() * 0.3];
      for (q = 0; q < 2; q++) {
        var x0 = q ? seg[0] * w : 0, x1 = q ? w : seg[0] * w, base = A.mix('#b9783c', '#96582a', Rn());
        x.fillStyle = base; x.fillRect(x0, r * ph, x1 - x0, ph);
        x.fillStyle = A.lg(x, 0, r * ph, 0, r * ph + ph, [0, 'rgba(255,214,150,.22)', 0.5, 'rgba(255,214,150,0)', 1, 'rgba(60,26,6,.18)']); x.fillRect(x0, r * ph, x1 - x0, ph);
        x.save(); x.beginPath(); x.rect(x0, r * ph, x1 - x0, ph); x.clip();
        for (var g = 0; g < 16; g++) { var y = r * ph + Rn() * ph, wob = (Rn() - 0.5) * 14; x.strokeStyle = Rn() < 0.5 ? 'rgba(70,34,10,' + (0.10 + Rn() * 0.16) + ')' : 'rgba(255,208,140,' + (0.08 + Rn() * 0.12) + ')'; x.lineWidth = 1 + Rn() * 2.6; x.beginPath(); x.moveTo(x0 - 10, y); x.bezierCurveTo(x0 + (x1 - x0) * 0.3, y + wob, x0 + (x1 - x0) * 0.7, y - wob, x1 + 10, y + (Rn() - 0.5) * 8); x.stroke(); }
        if (Rn() < 0.55) { var kx = x0 + 40 + Rn() * Math.max(10, x1 - x0 - 80), ky = r * ph + ph * (0.3 + Rn() * 0.4), kr = 7 + Rn() * 9; for (var o2 = 3; o2 >= 0; o2--) { A.ell(x, kx, ky, kr * (1 + o2 * 0.9), kr * (0.55 + o2 * 0.42)); x.strokeStyle = 'rgba(60,28,8,' + (0.3 - o2 * 0.06) + ')'; x.lineWidth = 1.6; x.stroke(); } A.ell(x, kx, ky, kr, kr * 0.55); x.fillStyle = 'rgba(70,34,12,.6)'; x.fill(); }
        x.restore();
        x.fillStyle = 'rgba(50,22,6,.55)'; x.fillRect(x1 - 1.5, r * ph, 3, ph);
      }
      x.fillStyle = 'rgba(40,16,4,.6)'; x.fillRect(0, r * ph - 1.5, w, 3); x.fillStyle = 'rgba(255,220,170,.2)'; x.fillRect(0, r * ph + 2, w, 1.5);
    }
  }, [2, 2]);
  tt.repeat.set(5, 3);
  add(scene, new T.PlaneGeometry(40, 18).rotateX(-Math.PI / 2), std({ color: 0xffffff, map: tt, metalness: 0, roughness: 0.58 }), 0, 0, 2.5, false, true);
  /* 계산대, 홀 바닥, 벽 */
  O.counter = add(scene, slab(40, 0.95, 0.5, 0.05, 0.04), matTop(M.wood, 9.6, 0.95), 0, 0, 0);
  O.hall = new T.Group(); scene.add(O.hall);
  add(O.hall, new T.PlaneGeometry(44, 8).rotateX(-Math.PI / 2), std({ color: 0xc9a074, roughness: 0.8 }), 0, -3.4, -2.4, false, true);
  O.wallC = A.mk(2048, 1280); O.wallT = new T.CanvasTexture(O.wallC); O.wallT.colorSpace = T.SRGBColorSpace; O.wallT.wrapS = T.RepeatWrapping;
  O.wall = add(O.hall, new T.PlaneGeometry(17.6, 11), new T.MeshBasicMaterial({ map: O.wallT }), 0, 1.6, -3.8, false, false);
  /* 도마 */
  O.boardM = add(scene, slab(L.board.w, L.board.d, TB, 0.22, 0.05), matTop(M.wood, L.board.w, L.board.d), 0, 0, 0);
  // 튀김기: 스테인리스 통 안에 철망 바구니, 보글보글 끓는 기름(사장님 10/2 사진). 하나일 땐 통 전체를 넓게 쓰고, 상점에서 사면 둘로 나뉜다
  O.fryG = new T.Group(); scene.add(O.fryG);
  add(O.fryG, slab(4.0, 2.56, 0.34, 0.14, 0.05), M.steel, 0.94, 0, 0.12);
  O.oilT = tex(512, 512, function (x) {
    x.fillStyle = '#e2a21c'; x.fillRect(0, 0, 512, 512); var Rn = A.rng(5), q, px, py, r3;
    for (q = 0; q < 40; q++) { px = Rn() * 512; py = Rn() * 512; r3 = 30 + Rn() * 70; x.fillStyle = A.rg(x, px, py, 2, r3, [0, 'rgba(255,236,150,.5)', 1, 'rgba(255,236,150,0)']); x.fillRect(px - r3, py - r3, r3 * 2, r3 * 2); }
    for (q = 0; q < 26; q++) { px = Rn() * 512; py = Rn() * 512; r3 = 24 + Rn() * 50; x.fillStyle = A.rg(x, px, py, 2, r3, [0, 'rgba(176,104,8,.38)', 1, 'rgba(176,104,8,0)']); x.fillRect(px - r3, py - r3, r3 * 2, r3 * 2); }
    for (q = 0; q < 420; q++) { px = Rn() * 512; py = Rn() * 512; r3 = 2 + Rn() * Rn() * 11; A.ell(x, px, py, r3, r3); x.strokeStyle = 'rgba(255,252,226,' + (0.35 + Rn() * 0.5) + ')'; x.lineWidth = 1 + r3 * 0.16; x.stroke(); x.fillStyle = 'rgba(255,244,190,.16)'; x.fill(); A.ell(x, px - r3 * 0.3, py - r3 * 0.3, r3 * 0.22, r3 * 0.22); x.fillStyle = 'rgba(255,255,255,.75)'; x.fill(); }
  }, [1, 1]);
  O.meshT = tex(64, 64, function (x) { x.clearRect(0, 0, 64, 64); x.strokeStyle = '#eef2f5'; x.lineWidth = 9; x.strokeRect(0, 0, 64, 64); x.strokeStyle = 'rgba(90,100,110,.9)'; x.lineWidth = 2; x.strokeRect(5, 5, 54, 54); }, [1, 1]);
  function basket(par, cx, w) {
    var d = L.FD, hw = w / 2, hd = d / 2, y0 = OILY - 0.27, y1 = OILY + 0.3, hh = y1 - y0, m, CELL = 0.17;
    function wire(rw, rh) { var t = O.meshT.clone(); t.needsUpdate = true; t.repeat.set(Math.round(rw / CELL), Math.round(rh / CELL)); return new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, side: T.DoubleSide, metalness: 0.75, roughness: 0.3 }); }
    add(par, new T.BoxGeometry(w + 0.14, 0.02, d + 0.14), M.dark, cx, 0.345, 0, false, false);
    add(par, new T.PlaneGeometry(w, d).rotateX(-Math.PI / 2), wire(w, d), cx, y0, 0, false, false);
    m = add(par, new T.PlaneGeometry(w, d).rotateX(-Math.PI / 2), std({ color: 0xffffff, map: O.oilT, roughness: 0.06, transparent: true, opacity: 0.86, emissive: 0x7a5200, emissiveIntensity: 0.22 }), cx, OILY, 0, false, true);
    [[w, cx, -hd, 0], [w, cx, hd, 0], [d, cx - hw, 0, Math.PI / 2], [d, cx + hw, 0, Math.PI / 2]].forEach(function (q) { var p = add(par, new T.PlaneGeometry(q[0], hh), wire(q[0], hh), q[1], y0 + hh / 2, q[2], false, false); p.rotation.y = q[3]; });
    add(par, new T.BoxGeometry(w + 0.1, 0.07, 0.07), M.steel, cx, y1, hd); add(par, new T.BoxGeometry(w + 0.1, 0.07, 0.07), M.steel, cx, y1, -hd);
    add(par, new T.BoxGeometry(0.07, 0.07, d), M.steel, cx + hw, y1, 0); add(par, new T.BoxGeometry(0.07, 0.07, d), M.steel, cx - hw, y1, 0);
    // 손잡이(뒤쪽)
    add(par, new T.BoxGeometry(0.055, 0.055, 0.46), M.steel, cx - 0.2, y1 + 0.04, -hd - 0.22); add(par, new T.BoxGeometry(0.055, 0.055, 0.46), M.steel, cx + 0.2, y1 + 0.04, -hd - 0.22);
    add(par, slab(0.62, 0.16, 0.12, 0.06, 0.02), M.red, cx, y1 - 0.02, -hd - 0.48);
    return m;
  }
  O.fryOne = new T.Group(); O.fryTwo = new T.Group(); O.fryG.add(O.fryOne); O.fryG.add(O.fryTwo);
  basket(O.fryOne, 0.94, 3.48); basket(O.fryTwo, 0, 1.6); basket(O.fryTwo, 1.88, 1.6);
  /* 반죽 볼 */
  var bp = [[0, 0.02], [0.62, 0.03], [0.96, 0.32], [1.0, 0.8], [1.07, 0.84], [1.04, 0.8], [0.9, 0.34], [0.58, 0.1], [0, 0.08]].map(function (p) { return new T.Vector2(p[0] * L.bowl.r / 1.05, p[1]); });
  O.bowlG = new T.Group(); scene.add(O.bowlG);
  o = add(O.bowlG, new T.LatheGeometry(bp, 32), std({ color: 0xdfe5ea, metalness: 0.92, roughness: 0.25, side: T.DoubleSide }), 0, 0, 0);
  O.batterT = tex(256, 256, function (x) { x.fillStyle = A.rg(x, 128, 128, 10, 130, [0, '#fbf0cc', 0.7, '#f2e0ac', 1, '#dcc388'], 100, 96); x.fillRect(0, 0, 256, 256); x.translate(128, 128); x.lineCap = 'round'; for (var s = 0; s < 3; s++) { x.strokeStyle = s % 2 ? 'rgba(255,252,236,.7)' : 'rgba(196,164,96,.45)'; x.lineWidth = 9 - s * 2; x.beginPath(); for (var a = 0; a < 5.4; a += 0.2) { var q = 10 + a * 19, px = Math.cos(a + s * 2.1) * q, py = Math.sin(a + s * 2.1) * q; if (a === 0) x.moveTo(px, py); else x.lineTo(px, py); } x.stroke(); } });
  O.batterT.center.set(0.5, 0.5);
  O.batter = add(O.bowlG, new T.CircleGeometry(L.bowl.r * 0.92, 32).rotateX(-Math.PI / 2), std({ map: O.batterT, roughness: 0.3 }), 0, BATY, 0, false, true);
  /* 상자 재질 */
  O.paperM = std({ roughness: 0.8, map: tex(256, 160, function (x) { A.gingham(x, 0, 0, 256, 160, 16); }) });
  O.lidM = std({ roughness: 0.85, map: tex(512, 320, function (x) { A.kraft(x, -4, -4, 520, 328, 1); x.fillStyle = '#e0281e'; x.fillRect(0, 124, 512, 72); x.fillStyle = '#ffd23a'; x.fillRect(0, 112, 512, 7); x.fillRect(0, 201, 512, 7); x.translate(384, 160); A.sticker(x, 62); }) });
  /* 양념 줄 */
  O.strip = [];
  ['yang', 'soy', 'pa', 'cheese', 'mu', 'cola', 'trash'].forEach(function (id, k) {
    var g = new T.Group(); g.position.set(stripX(k), 0, L.stripZ); scene.add(g); O.strip.push(g);
    var em = new T.Group(), fu = new T.Group(); g.add(em); g.add(fu); g.userData = { em: em, fu: fu };
    add(em, slab(0.84, 0.8, 0.05, 0.1, 0), M.steelD, 0, 0, 0);
    if (id === 'yang' || id === 'soy') {
      add(fu, new T.CylinderGeometry(0.43, 0.4, 0.34, 24, 1, true), std({ color: 0xdfe5ea, metalness: 0.9, roughness: 0.28, side: T.DoubleSide }), 0, 0.17, 0);
      add(fu, new T.CircleGeometry(0.41, 24).rotateX(-Math.PI / 2), std({ color: id === 'yang' ? 0xc8220e : 0x6a3410, roughness: 0.12 }), 0, 0.27, 0, false, true);
      o = add(fu, new T.CylinderGeometry(0.025, 0.025, 0.8, 6), M.steel, 0.3, 0.52, -0.22); o.rotation.set(0.6, 0, -0.75);
      add(fu, new T.SphereGeometry(0.13, 10, 8, 0, TAU, Math.PI / 2, Math.PI / 2), M.steel, 0.06, 0.34, -0.04);
    } else if (id === 'trash') {
      add(fu, new T.CylinderGeometry(0.44, 0.4, 0.3, 20), std({ color: 0x5a646c, roughness: 0.6 }), 0, 0.15, 0); add(fu, new T.CircleGeometry(0.36, 20).rotateX(-Math.PI / 2), std({ color: 0x0c0e10, roughness: 0.9 }), 0, 0.305, 0, false, false);
    } else {
      add(fu, slab(0.86, 0.82, 0.26, 0.1, 0.03), M.steel, 0, 0, 0);
      if (id === 'pa') { add(fu, slab(0.72, 0.68, 0.04, 0.08, 0), std({ color: 0x3e7a22, roughness: 0.8 }), 0, 0.25, 0); for (var q = 0; q < 26; q++) { o = add(fu, new T.TorusGeometry(0.1, 0.024, 5, 8, 2.6), std({ color: ['#58a82e', '#86cc4a', '#dff0b8'][q % 3], roughness: 0.6 }), (Math.random() - 0.5) * 0.56, 0.3 + Math.random() * 0.05, (Math.random() - 0.5) * 0.5, false); o.rotation.set(Math.random() * 3, Math.random() * 6, Math.random() * 3); } }
      else if (id === 'cheese') { o = add(fu, new T.SphereGeometry(0.36, 16, 10), std({ color: 0xf6c030, roughness: 0.95 }), 0, 0.22, 0); o.scale.set(1, 0.35, 0.95); }
      else if (id === 'mu') {   /* 말풍선 그림과 같게: 민트 테두리 통에 흰 깍두기 */
        add(fu, slab(0.74, 0.7, 0.04, 0.08, 0), std({ color: 0xd6ecf4, roughness: 0.25 }), 0, 0.25, 0);
        var tm = std({ color: 0x58c0a8, roughness: 0.5 });
        add(fu, new T.BoxGeometry(0.86, 0.07, 0.09), tm, 0, 0.3, -0.37); add(fu, new T.BoxGeometry(0.86, 0.07, 0.09), tm, 0, 0.3, 0.37);
        add(fu, new T.BoxGeometry(0.09, 0.07, 0.82), tm, -0.39, 0.3, 0); add(fu, new T.BoxGeometry(0.09, 0.07, 0.82), tm, 0.39, 0.3, 0);
        for (q = 0; q < 11; q++) { o = add(fu, new T.BoxGeometry(0.19, 0.19, 0.19), M.white, -0.21 + (q % 3) * 0.21 + (q > 8 ? 0.1 : 0), q > 8 ? 0.5 : 0.36, q > 8 ? 0 : -0.2 + Math.floor(q / 3) * 0.2); o.rotation.set(q * 0.4, q * 1.3, q * 0.2); }
      }
      else if (id === 'cola') {   /* 말풍선 그림과 같게: 흰 띠 두른 빨간 캔이 얼음에 기대 서 있다 */
        add(fu, slab(0.72, 0.68, 0.04, 0.08, 0), std({ color: 0xbfe0ee, roughness: 0.3 }), 0, 0.25, 0);
        for (q = 0; q < 7; q++) { o = add(fu, new T.BoxGeometry(0.13, 0.11, 0.13), std({ color: 0xf2fbff, roughness: 0.1, transparent: true, opacity: 0.85 }), ((q * 37) % 10 / 10 - 0.5) * 0.56, 0.32, ((q * 53) % 10 / 10 - 0.5) * 0.5, false); o.rotation.set(q, q * 1.7, 0); }
        for (q = 0; q < 2; q++) {
          var cg = new T.Group(); cg.position.set(-0.19 + q * 0.38, 0.46, 0.0 + q * 0.05); cg.rotation.set(-1.05, 0, 0.12 - q * 0.3); fu.add(cg);
          add(cg, new T.CylinderGeometry(0.165, 0.165, 0.54, 16), std({ color: 0xe02a1e, roughness: 0.25, metalness: 0.5 }), 0, 0, 0);
          add(cg, new T.CylinderGeometry(0.17, 0.17, 0.15, 16, 1, true), std({ color: 0xffffff, roughness: 0.4 }), 0, 0.02, 0);
          add(cg, new T.CylinderGeometry(0.14, 0.165, 0.045, 16), M.steel, 0, 0.29, 0);
        }
      }
    }
  });
  /* 생닭 상자 */
  g = new T.Group(); g.position.set(L.crate.x, 0, L.crate.z); scene.add(g); O.crate = g;
  add(g, slab(L.crate.w, L.crate.d, 0.5, 0.12, 0.05), M.white, 0, 0, 0);
  add(g, slab(L.crate.w - 0.24, L.crate.d - 0.24, 0.02, 0.08, 0), std({ color: 0xb4d8ea, roughness: 0.25 }), 0, 0.5, 0, false, true);
  for (i = 0; i < 9; i++) { o = add(g, new T.BoxGeometry(0.16, 0.14, 0.16), std({ color: 0xf2fbff, roughness: 0.1, transparent: true, opacity: 0.85 }), ((i * 37) % 10 / 10 - 0.5) * 1.05, 0.56, ((i * 53) % 10 / 10 - 0.5) * 1.05, false); o.rotation.set(i, i * 1.7, 0); }
  var wp = CK.whole(); pieceMesh(wp); scene.remove(wp.mesh); wp.mesh.scale.setScalar(0.34); wp.mesh.position.set(0, 0.52 + wp.cy * 0.34, 0.02); wp.mesh.rotation.y = 0.3; g.add(wp.mesh);
  /* 건지개 */
  g = new T.Group(); scene.add(g); g.visible = false; O.skim = g;
  o = add(g, new T.TorusGeometry(0.78, 0.045, 8, 28), M.steel, 0, 0, 0); o.rotation.x = Math.PI / 2;
  O.skimT = tex(128, 128, function (x) { x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(70,78,86,.9)'; x.lineWidth = 2; for (var q = 4; q < 128; q += 10) { x.beginPath(); x.moveTo(q, 0); x.lineTo(q, 128); x.moveTo(0, q); x.lineTo(128, q); x.stroke(); } });
  add(g, new T.CircleGeometry(0.76, 24).rotateX(-Math.PI / 2), std({ map: O.skimT, transparent: true, metalness: 0.6, roughness: 0.4, side: T.DoubleSide }), 0, -0.02, 0, true, false);
  o = add(g, new T.CylinderGeometry(0.06, 0.07, 1.7, 8), M.woodD, 1.25, 0.25, 1.05); o.rotation.set(Math.PI / 2 - 0.25, 0, -0.87, 'YXZ'); o.rotation.set(0, 0, 0); o.lookAt(new T.Vector3(3, 1, 3)); o.rotateX(Math.PI / 2);
  /* 국자 */
  g = new T.Group(); scene.add(g); g.visible = false; O.ladle = g;
  O.ladleS = std({ color: 0xc8220e, roughness: 0.15 });
  add(g, new T.SphereGeometry(0.26, 14, 10, 0, TAU, Math.PI / 2, Math.PI / 2), std({ color: 0xdfe5ea, metalness: 0.9, roughness: 0.3, side: T.DoubleSide }), 0, 0, 0);
  add(g, new T.CircleGeometry(0.24, 14).rotateX(-Math.PI / 2), O.ladleS, 0, -0.03, 0, false, false);
  o = add(g, new T.CylinderGeometry(0.03, 0.03, 1.5, 6), M.steel, 0.5, 0.55, -0.3); o.rotation.set(0.45, 0, -0.75);
  O.stream = add(scene, new T.CylinderGeometry(0.05, 0.035, 1, 8), O.ladleS, 0, 0, 0, false, false); O.stream.visible = false;
  /* 칼 */
  g = new T.Group(); scene.add(g); g.visible = false; O.knife = g;
  var bs = new T.Shape(); bs.moveTo(-0.1, 0); bs.lineTo(1.25, 0); bs.quadraticCurveTo(1.35, 0.3, 1.25, 0.62); bs.lineTo(-0.1, 0.62); bs.lineTo(-0.1, 0);
  o = add(g, new T.ExtrudeGeometry(bs, { depth: 0.035, bevelEnabled: false }), std({ color: 0xe8edf0, metalness: 0.95, roughness: 0.18 }), 0, 0, -0.017);
  add(g, new T.BoxGeometry(0.75, 0.26, 0.14), M.woodD, -0.47, 0.42, 0);
}
function setDay(day, un, nf) {
  O.day = day; var x = O.wallC.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0); wallDraw(x, 1024, 640, day); O.wallT.needsUpdate = true;
  /* 전단지 글꼴이 늦게 오면 그때 다시 그린다 */
  if (!O.wf && document.fonts && document.fonts.load) { O.wf = 1; document.fonts.load("900 40px 'Ria'", '가').then(function () { setDay.again = 1; var y = O.wallC.getContext('2d'); y.setTransform(2, 0, 0, 2, 0, 0); wallDraw(y, 1024, 640, O.day); O.wallT.needsUpdate = true; }); }
  ['yang', 'soy', 'pa', 'cheese', 'mu', 'cola', 'trash'].forEach(function (id, k) { var u = O.strip[k].userData; u.fu.visible = !!un[id]; u.em.visible = !un[id]; });
  // 튀김기가 하나면 통 전체를 넓게 쓴다
  L.nf = nf; L.FW = nf < 2 ? 3.48 : 1.6; L.fry[0].x = LAY[L.wide ? 'wide' : 'tall'].fry[0] + (nf < 2 ? 0.94 : 0); O.fryOne.visible = nf < 2; O.fryTwo.visible = nf >= 2;
}
/* ---------- 화면 ---------- */
function init(canvas) {
  R = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.95; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  scene = new T.Scene(); scene.background = new T.Color(0xf3d9aa);
  cam = new T.PerspectiveCamera(40, 1, 1, 90); cam.position.set(0, 21, 14.5);
  scene.add(new T.HemisphereLight(0xfff2e0, 0x6a5a50, 0.55));
  var d = new T.DirectionalLight(0xfff0d6, 2.0); d.position.set(-4.5, 12, 5); d.target.position.set(0, 0, -1); d.castShadow = true; d.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  d.shadow.camera.left = -6.5; d.shadow.camera.right = 6.5; d.shadow.camera.top = 9; d.shadow.camera.bottom = -7; d.shadow.camera.near = 2; d.shadow.camera.far = 32; d.shadow.bias = -0.0006; d.shadow.normalBias = 0.03; d.shadow.radius = 3;
  scene.add(d); scene.add(d.target); O.sun = d;
  /* 비치는 환경: 밝은 방 */
  var es = new T.Scene(); es.background = new T.Color(0x4a4e54);
  [[0, 8, 0, 9, 0.4, 9, 0xffffff, 1.5], [-9, 2, 0, 0.4, 8, 12, 0xfff0d8, 0.7], [9, 2, 0, 0.4, 8, 12, 0xdfe8ff, 0.5], [0, 2, -9, 12, 8, 0.4, 0xffe6c0, 0.6], [0, -4, 0, 16, 0.4, 16, 0x5a5048, 1]].forEach(function (b) { var m = new T.Mesh(new T.BoxGeometry(b[3], b[4], b[5]), new T.MeshBasicMaterial({ color: new T.Color(b[6]).multiplyScalar(b[7]) })); m.position.set(b[0], b[1], b[2]); es.add(m); });
  var pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose();
  mats(); partsInit(); build(); place(false);
}
function resize(w, h, dpr, wu, hu) {
  vw = w; vh = h; Wu = wu || 720; Hu = hu || 720 * h / w; R.setPixelRatio(Math.min(dpr, MOBILE ? 1.5 : 2)); R.setSize(w, h, false); cam.aspect = w / h;
  /* 화면 비율에 맞춰 내려다보는 각도와 시야각을 고른다: 좌우는 작업대 너비에, 위아래는 손님 머리~작업대 앞까지. 남는 높이는 위쪽에 둔다 */
  var F = L.fit, pts = [[-F[0], 0, F[1]], [F[0], 0, F[1]], [-F[2], L.wide ? 3.0 : 3.3, L.custZ], [F[2], L.wide ? 3.0 : 3.3, L.custZ], [0, L.wide ? 3.1 : 3.5, L.custZ]], top = 1 - 2 * ((L.wide ? 200 : 236) / Hu), v = new T.Vector3(), best = null, el, fov;
  function tryFit(el, fov) {
    var a = el * Math.PI / 180; cam.position.set(0, 25.5 * Math.sin(a), 25.5 * Math.cos(a) - 0.6); cam.fov = fov; cam.lookAt(0, 0.3, -0.8); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    var yb = 9, yt = -9; for (var i = 0; i < pts.length; i++) { v.set(pts[i][0], pts[i][1], pts[i][2]).project(cam); if (Math.abs(v.x) > 0.985) return null; if (i < 2) yb = Math.min(yb, v.y); else yt = Math.max(yt, v.y); }
    var slack = (top + 0.95) - (yt - yb); return slack < 0 ? null : { el: el, fov: fov, yb: yb, slack: slack };
  }
  /* 세로 화면은 높이를 채우는 각도를, 가로 화면은 물건이 가장 크게 나오는 각도를 고른다 */
  for (el = L.wide ? 40 : 52; el <= 76; el += 2) { for (fov = 14; fov <= 75; fov += 0.5) { var r = tryFit(el, fov); if (r) { if (!best || (L.wide ? r.fov < best.fov - 0.01 : (best.slack > 0.06 && r.slack < best.slack - 0.01))) best = r; break; } } }
  if (!best) best = { el: 60, fov: 40, yb: -0.9, slack: 0 };
  tryFit(best.el, best.fov);
  cam.projectionMatrix.elements[9] = 0.95 + best.yb; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}
var _v = new T.Vector3(), _ray = new T.Raycaster(), _pl = new T.Plane(new T.Vector3(0, 1, 0), 0), _v2 = new T.Vector2();
function toScreen(x, y, z) { _v.set(x, y, z).project(cam); return [(_v.x * 0.5 + 0.5) * Wu, (1 - (_v.y * 0.5 + 0.5)) * Hu]; }
function pick(xu, yu, py) { _v2.set(xu / Wu * 2 - 1, -(yu / Hu * 2 - 1)); _ray.setFromCamera(_v2, cam); _pl.constant = -(py || 0); var p = _ray.ray.intersectPlane(_pl, _v); return p ? [p.x, p.z] : [0, 0]; }
function render() { R.render(scene, cam); }
return { init: init, place: place, resize: resize, render: render, toScreen: toScreen, pick: pick, setDay: setDay, L: L, stripX: stripX, TB: TB, NS: NS, OILY: OILY, BATY: BATY, O: O,
  pieceMesh: pieceMesh, restyle: restyle, dropPiece: dropPiece, part: part, burst: burst, partsStep: partsStep, makeBox: makeBox, bits: bits,
  person: person, personFace: personFace, personEat: personEat, personDrop: personDrop, scene: function () { return scene; }, cam: function () { return cam; }, Hu: function () { return Hu; }, info: function () { return R.info; } };
})();
