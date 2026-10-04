/* 새우잡이배 — 바탕: 난수, 질감(캔버스로 그림), 한 덩어리로 묶는 도형 모음, 재질 */
var SB = { D: 1.3 };            // D: 갑판 높이(배 안 좌표, 수면 0 기준)
(function () {
'use strict';
var T = THREE;
function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
SB.rng = rng;
SB.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
SB.lerp = function (a, b, t) { return a + (b - a) * t; };
SB.ease = function (t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
SB.smooth = function (a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

/* ---------- 질감 ---------- */
function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function fin(c, clampEdge, lin) { var t = new T.CanvasTexture(c); if (!clampEdge) t.wrapS = t.wrapT = T.RepeatWrapping; if (!lin) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function blots(g, r, w, h, n, rad, rgb, a) {
  for (var i = 0; i < n; i++) {
    var x = r() * w, y = r() * h, q = rad * (0.4 + r()), gr = g.createRadialGradient(x, y, 0, x, y, q);
    gr.addColorStop(0, 'rgba(' + rgb + ',' + a * (0.4 + r() * 0.6) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2);
  }
}
function specks(g, r, w, h, n, rgb, a, sz) { for (var i = 0; i < n; i++) { g.fillStyle = 'rgba(' + rgb + ',' + a * r() + ')'; g.fillRect(r() * w, r() * h, 1 + r() * (sz || 1.5), 1 + r() * (sz || 1.5)); } }
function streaks(g, r, w, h, n, rgb, a, y0, y1) {          // 위에서 흘러내린 녹물·때 줄
  for (var i = 0; i < n; i++) {
    var x = r() * w, ys = y0 + r() * (y1 - y0) * 0.3, len = (y1 - ys) * (0.3 + r() * 0.7), wd = 2 + r() * 7;
    var gr = g.createLinearGradient(0, ys, 0, ys + len); gr.addColorStop(0, 'rgba(' + rgb + ',' + a * (0.5 + r() * 0.5) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - wd / 2, ys); g.lineTo(x + wd / 2, ys); g.lineTo(x + wd * 0.2, ys + len); g.lineTo(x - wd * 0.2, ys + len); g.fill();
  }
}
SB.cvs = cvs; SB.fin = fin; SB.blots = blots; SB.specks = specks;

var TEX = {};
TEX.deck = function () {                       // 나무 갑판: 1m 한 장, 판자 12.5cm 8줄(배 길이 방향), 타르 줄눈, 젖은 얼룩, 비늘
  var S = 512, c = cvs(S), g = c.getContext('2d'), r = rng(7), i, k, q = S / 8;
  g.fillStyle = '#6b5a45'; g.fillRect(0, 0, S, S);
  for (k = 0; k < 8; k++) {
    var y0 = k * q, tone = 0.82 + r() * 0.3, R = 128 * tone, G = 110 * tone, B = 86 * tone;
    g.fillStyle = 'rgb(' + (R | 0) + ',' + (G | 0) + ',' + (B | 0) + ')'; g.fillRect(0, y0, S, q);
    for (i = 0; i < 30; i++) { g.strokeStyle = 'rgba(' + (r() < 0.5 ? '60,45,30' : '190,170,140') + ',' + (0.05 + r() * 0.12) + ')'; g.lineWidth = 0.6 + r() * 1.4; var yy = y0 + 4 + r() * (q - 8), w = (r() - 0.5) * 6; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(170, yy + w, 340, yy - w, S, yy + w * 0.5); g.stroke(); }
    var jx = r() * S; g.fillStyle = 'rgba(25,20,15,.8)'; g.fillRect(jx, y0, 3, q);
    g.fillStyle = 'rgba(30,25,18,.55)'; g.beginPath(); g.arc(jx - 14, y0 + q * 0.3, 2.5, 0, 6.3); g.arc(jx - 14, y0 + q * 0.7, 2.5, 0, 6.3); g.fill();
  }
  for (k = 0; k <= 8; k++) { g.fillStyle = '#17120d'; g.fillRect(0, k * q - 3, S, 6); g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(0, k * q + 3, S, 1.5); }
  blots(g, r, S, S, 18, 90, '40,32,22', 0.22); blots(g, r, S, S, 10, 70, '175,165,140', 0.12);
  specks(g, r, S, S, 260, '220,225,215', 0.35, 2.4);
  specks(g, r, S, S, 500, '30,25,18', 0.4, 1.6);
  return fin(c);
};
TEX.deckSpec = function () {                   // 갑판 반짝임 세기(젖은 데만 반짝)
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(9);
  g.fillStyle = '#4a4a4a'; g.fillRect(0, 0, S, S); blots(g, r, S, S, 16, 60, '255,255,255', 0.35); blots(g, r, S, S, 10, 50, '0,0,0', 0.3);
  return fin(c, false, true);
};
TEX.grime = function () {                      // 선체·벽 흰 칠 위의 때와 녹물: 곱하기용(흰 바탕), 가로 4m 세로 3m 한 장
  var W = 512, H = 384, c = cvs(W, H), g = c.getContext('2d'), r = rng(13), i;
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, W, H);
  blots(g, r, W, H, 24, 80, '150,140,120', 0.12);
  streaks(g, r, W, H, 16, '140,78,40', 0.3, 40, H);
  streaks(g, r, W, H, 10, '70,70,60', 0.14, 0, H);
  for (i = 0; i < 40; i++) { g.strokeStyle = 'rgba(80,70,60,' + (0.1 + r() * 0.25) + ')'; g.lineWidth = 0.6 + r(); var x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 8); g.stroke(); }
  specks(g, r, W, H, 400, '120,70,40', 0.35, 2.5);
  return fin(c);
};
TEX.paint = function () {                      // 조타실 흰 철판 칠: 판 이음, 리벳 줄, 녹 꽃
  var S = 512, c = cvs(S), g = c.getContext('2d'), r = rng(17), i, j;
  g.fillStyle = '#e9e7df'; g.fillRect(0, 0, S, S);
  for (i = 0; i <= 4; i++) { g.fillStyle = 'rgba(90,85,75,.35)'; g.fillRect(i * 128 - 1, 0, 2, S); for (j = 0; j < 16; j++) { g.fillStyle = 'rgba(120,110,95,.5)'; g.beginPath(); g.arc(i * 128 + 6, j * 32 + 16, 2.2, 0, 6.3); g.fill(); } }
  blots(g, r, S, S, 14, 70, '140,130,110', 0.14);
  for (i = 0; i < 12; i++) { var x = r() * S, y = r() * S, q = 1.5 + r() * 4; g.fillStyle = 'rgba(130,70,35,.45)'; g.beginPath(); g.arc(x, y, q, 0, 6.3); g.fill(); var gr = g.createLinearGradient(0, y, 0, y + 30 + r() * 80); gr.addColorStop(0, 'rgba(140,80,40,.35)'); gr.addColorStop(1, 'rgba(140,80,40,0)'); g.fillStyle = gr; g.fillRect(x - q * 0.6, y, q * 1.2, 110); }
  streaks(g, r, S, S, 14, '80,80,70', 0.18, 0, S);
  return fin(c);
};
TEX.rust = function () {                       // 녹슨 쇠: 말뚝·사슬·닻
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(19);
  g.fillStyle = '#5d4334'; g.fillRect(0, 0, S, S);
  blots(g, r, S, S, 40, 30, '150,80,35', 0.5); blots(g, r, S, S, 30, 26, '60,40,30', 0.5); blots(g, r, S, S, 16, 40, '90,110,110', 0.25);
  specks(g, r, S, S, 2200, '30,20,15', 0.5, 2); specks(g, r, S, S, 800, '200,120,60', 0.4, 2);
  return fin(c);
};
TEX.machine = function () {                    // 기계 칠(청록 칠이 벗겨져 녹이 드러남)
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(23);
  g.fillStyle = '#c9d2cc'; g.fillRect(0, 0, S, S);
  blots(g, r, S, S, 30, 22, '120,70,35', 0.6); blots(g, r, S, S, 10, 40, '40,50,50', 0.25);
  specks(g, r, S, S, 900, '25,30,30', 0.4, 2); specks(g, r, S, S, 300, '255,255,255', 0.25, 1.5);
  return fin(c);
};
TEX.tarp = function () {                       // 파란 방수포: 짠 결과 주름
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(29), i;
  g.fillStyle = '#2f6cc8'; g.fillRect(0, 0, S, S);
  for (i = 0; i < S; i += 3) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(i, 0, 1, S); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, i, S, 1); }
  for (i = 0; i < 14; i++) { var y = r() * S, gr = g.createLinearGradient(0, y - 10, 0, y + 10); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,30,.18)'); g.fillStyle = gr; g.fillRect(0, y - 10, S, 20); }
  blots(g, r, S, S, 8, 50, '20,30,50', 0.2);
  return fin(c);
};
TEX.net = function (rgb) {                     // 그물: 투명 바탕에 마름모 그물코(알파)
  var S = 128, c = cvs(S), g = c.getContext('2d'), i, j;
  g.clearRect(0, 0, S, S); g.strokeStyle = rgb || 'rgb(60,140,90)'; g.lineWidth = 3;
  for (i = -S; i <= S * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke(); }
  g.fillStyle = rgb || 'rgb(60,140,90)'; for (i = 0; i <= S; i += 16) for (j = 0; j <= S; j += 16) { g.beginPath(); g.arc(i + 8, j, 2.6, 0, 6.3); g.fill(); }
  return fin(c);
};
TEX.rope = function (a, b) {                   // 꼰 밧줄: 비스듬한 가닥
  var c = cvs(64, 256), g = c.getContext('2d'), i;
  g.fillStyle = a || '#d8c35a'; g.fillRect(0, 0, 64, 256);
  for (i = -64; i < 320; i += 16) { g.strokeStyle = b || 'rgba(90,70,20,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i); g.lineTo(64, i + 26); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, i + 5); g.lineTo(64, i + 31); g.stroke(); }
  return fin(c);
};
TEX.basket = function (rgb) {                  // 플라스틱 바구니: 구멍 뚫린 격자(알파)
  var S = 128, c = cvs(S), g = c.getContext('2d'), i, j;
  g.fillStyle = rgb; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'destination-out';
  for (j = 1; j < 7; j++) for (i = 0; i < 8; i++) g.fillRect(i * 16 + 4, j * 16 + 3, 8, 10);
  g.globalCompositeOperation = 'source-over'; return fin(c);
};
TEX.label = function (text, o) {               // 글자 판: 배 이름, 상자 글씨
  o = o || {}; var w = o.w || 256, h = o.h || 128, c = cvs(w, h), g = c.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
  if (o.draw) o.draw(g, w, h);
  g.fillStyle = o.fg || '#22201c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  var lines = String(text).split('\n'), fs = o.fs || h * 0.6;
  g.font = (o.weight || '') + ' ' + fs + 'px ' + (o.font || "'Saemaul','Ria','Malgun Gothic',sans-serif");
  if (o.fit) { var mw = 0; lines.forEach(function (ln) { mw = Math.max(mw, g.measureText(ln).width); }); if (mw > w * 0.92) { fs = Math.max(fs * 0.45, fs * w * 0.92 / mw); g.font = (o.weight || '') + ' ' + fs + 'px ' + (o.font || "'Saemaul','Ria','Malgun Gothic',sans-serif"); } }   // 영문판: 판보다 긴 글자는 글자만 줄인다(10/4 사장님 영문판 검수)
  lines.forEach(function (ln, i) { g.fillText(ln, w * (o.tx || 0.5), h * (o.ty || 0.5) + (i - (lines.length - 1) / 2) * fs * 1.1 + fs * 0.04); });
  return fin(c, 1);
};
TEX.flag = function (i) {                      // 오색 풍어기 한 장
  var cols = [['#d8262c', '#f2c12e', '#1f5fae', '#2f9a4a', '#f4f1e8'], ['#f2c12e', '#d8262c', '#2f9a4a', '#1f5fae', '#f4f1e8']][i % 2];
  return TEX.label('', { w: 128, h: 80, bg: '#fff', draw: function (g) { cols.forEach(function (c2, k) { g.fillStyle = c2; g.fillRect(0, k * 16, 128, 16); }); } });
};
TEX.glow = function () {                       // 동그란 빛(불빛 번짐용)
  var c = cvs(64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return fin(c, 1);
};
SB.TEX = TEX;

/* ---------- 도형 모음: 상자·면·임의 도형을 한 덩어리로 ---------- */
var WHT = [1, 1, 1];
function Batch() { this.P = []; this.N = []; this.U = []; this.C = []; this.I = []; this.n = 0; }
Batch.prototype.v = function (p, n, u, v, c) { this.P.push(p[0], p[1], p[2]); this.N.push(n[0], n[1], n[2]); this.U.push(u, v); this.C.push(c[0], c[1], c[2]); return this.n++; };
Batch.prototype.quad = function (a, b, c, d, n, uv, col) {     // 법선 쪽에서 볼 때 반시계: a 왼아래, b 오른아래, c 오른위, d 왼위
  uv = uv || [0, 0, 1, 1]; col = col || WHT;
  var i0 = this.v(a, n, uv[0], uv[1], col), i1 = this.v(b, n, uv[2], uv[1], col), i2 = this.v(c, n, uv[2], uv[3], col), i3 = this.v(d, n, uv[0], uv[3], col);
  this.I.push(i0, i1, i2, i0, i2, i3);
};
/* 상자. o: t(질감 한 장의 가로 m), tv(세로 m), y0(세로 무늬 기준 높이), ry, col, top(윗면 색), nob(바닥면 빼기) */
Batch.prototype.box = function (cx, cy, cz, sx, sy, sz, o) {
  o = o || {}; var t = o.t || 1, tv = o.tv || t, ry = o.ry || 0, col = o.col || WHT, c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2, y0 = o.y0 || 0, me = this;
  function P(lx, ly, lz) { return [cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c]; }
  function Nn(nx, nz) { return [nx * c + nz * s, 0, -nx * s + nz * c]; }
  function side(ax, az, bx, bz, nx, nz, u0, u1) {
    me.quad(P(ax, -hy, az), P(bx, -hy, bz), P(bx, hy, bz), P(ax, hy, az), Nn(nx, nz), [u0 / t, (cy - hy - y0) / tv, u1 / t, (cy + hy - y0) / tv], col);
  }
  side(-hx, hz, hx, hz, 0, 1, cx - hx, cx + hx);
  side(hx, -hz, -hx, -hz, 0, -1, cx + hx, cx - hx);
  side(hx, hz, hx, -hz, 1, 0, cz + hz, cz - hz);
  side(-hx, -hz, -hx, hz, -1, 0, cz - hz, cz + hz);
  var tc = o.top || col;
  this.quad(P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), [0, 1, 0], [(cx - hx) / t, (cz + hz) / t, (cx + hx) / t, (cz - hz) / t], tc);
  if (!o.nob) this.quad(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), [0, -1, 0], [(cx - hx) / t, (cz - hz) / t, (cx + hx) / t, (cz + hz) / t], col);
};
var _v = new T.Vector3(), _nm = new T.Matrix3();
Batch.prototype.geo = function (g, m, col) {                    // 임의 도형을 행렬로 옮겨 넣기
  col = col || WHT; var p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, base = this.n, i;
  _nm.getNormalMatrix(m);
  for (i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i).applyMatrix4(m); this.P.push(_v.x, _v.y, _v.z);
    _v.fromBufferAttribute(n, i).applyMatrix3(_nm).normalize(); this.N.push(_v.x, _v.y, _v.z);
    this.U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); this.C.push(col[0], col[1], col[2]);
  }
  this.n += p.count;
  if (g.index) for (i = 0; i < g.index.count; i++) this.I.push(base + g.index.getX(i)); else for (i = 0; i < p.count; i++) this.I.push(base + i);
  g.dispose();
};
var _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new T.Vector3(), _p = new T.Vector3();
Batch.prototype.put = function (g, x, y, z, o) {                // 도형을 자리·회전·배율로 넣기. o: rx ry rz sx sy sz col
  o = o || {}; _e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(o.sx || o.s || 1, o.sy || o.s || 1, o.sz || o.s || 1);
  this.geo(g, _m.compose(_p, _q, _s), o.col);
};
var _a = new T.Vector3(), _b = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _d = new T.Vector3();
Batch.prototype.tube = function (a, b, r, o) {                  // 두 점 사이 원통(밧줄·난간·파이프)
  o = o || {}; _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]); var len = _a.distanceTo(_b); if (len < 1e-4) return;
  var g = new T.CylinderGeometry(r, o.r2 == null ? r : o.r2, len, o.seg || 8, 1, !!o.open);
  if (o.uvLen) { var uv = g.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len / o.uvLen); }
  _q.setFromUnitVectors(_up, _d.copy(_b).sub(_a).normalize()); _p.copy(_a).add(_b).multiplyScalar(0.5); _s.set(1, 1, 1);
  this.geo(g, _m.compose(_p, _q, _s), o.col);
};
Batch.prototype.mesh = function (mat) {
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(this.N, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(this.U, 2)); g.setAttribute('color', new T.Float32BufferAttribute(this.C, 3)); g.setIndex(this.I);
  var m = new T.Mesh(g, mat); m.matrixAutoUpdate = false; return m;
};
SB.Batch = Batch;
SB.mk = function (fn, mat) { var b = new Batch(); fn(b); var m = b.mesh(mat || SB.M.pla); m.matrixAutoUpdate = true; return m; };

/* ---------- 재질(같이 쓴다) ---------- */
SB.makeMaterials = function () {
  var M = {}, L = function (tex, o) { o = o || {}; if (tex) o.map = tex; o.vertexColors = true; return new T.MeshLambertMaterial(o); };
  var Ph = function (tex, sh, sp, o) { o = o || {}; if (tex) o.map = tex; o.vertexColors = true; o.shininess = sh; o.specular = new T.Color(sp); return new T.MeshPhongMaterial(o); };
  M.deck = Ph(TEX.deck(), 26, 0x4a4a44, { specularMap: TEX.deckSpec() });
  M.hull = Ph(TEX.grime(), 40, 0x555555);
  M.paint = Ph(TEX.paint(), 30, 0x3a3a3a);
  M.rust = L(TEX.rust()); M.machine = Ph(TEX.machine(), 30, 0x333333);
  M.tarp = Ph(TEX.tarp(), 40, 0x444444, { side: T.DoubleSide, emissive: new T.Color(0x0c1c3a) });
  M.pla = Ph(null, 30, 0x2a2a2a); M.mat = L(null); M.steel = Ph(null, 80, 0x9a9a9a);
  M.glass = Ph(null, 140, 0xbfd2de, { color: 0x1d2a33, transparent: true, opacity: 0.55 });
  M.rope = L(TEX.rope()); M.ropeB = L(TEX.rope('#2f6fb5', 'rgba(10,30,70,.6)'));
  var nt = TEX.net(); nt.repeat.set(3, 3); M.net = new T.MeshLambertMaterial({ map: nt, transparent: true, alphaTest: 0.4, side: T.DoubleSide, vertexColors: true });
  M.glow = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  M.basketB = new T.MeshPhongMaterial({ map: TEX.basket('#2c6fd1'), alphaTest: 0.5, side: T.DoubleSide, shininess: 40 });
  M.basketY = new T.MeshPhongMaterial({ map: TEX.basket('#f0b81c'), alphaTest: 0.5, side: T.DoubleSide, shininess: 40 });
  return M;
};
})();
