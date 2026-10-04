/* 고시원 총무 — 바탕: 난수, 질감(캔버스로 그림), 한 덩어리로 묶는 도형 모음, 재질 */
var GS = { FH: 3, WH: 2.4, NF: 4, EN: /[?&]lang=en/.test(location.search) };   // EN: 영문판(주소 ?lang=en 일 때만)
(function () {
'use strict';
var T = THREE;
function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
GS.rng = rng;
GS.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
GS.lerp = function (a, b, t) { return a + (b - a) * t; };
GS.ease = function (t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

/* ---------- 질감 ---------- */
function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function fin(c, clampEdge) { var t = new T.CanvasTexture(c); if (!clampEdge) t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function blots(g, r, w, h, n, rad, rgb, a) {
  for (var i = 0; i < n; i++) {
    var x = r() * w, y = r() * h, q = rad * (0.4 + r()), gr = g.createRadialGradient(x, y, 0, x, y, q);
    gr.addColorStop(0, 'rgba(' + rgb + ',' + a * (0.4 + r() * 0.6) + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(x - q, y - q, q * 2, q * 2);
  }
}
function specks(g, r, w, h, n, rgb, a, sz) { for (var i = 0; i < n; i++) { g.fillStyle = 'rgba(' + rgb + ',' + a * r() + ')'; g.fillRect(r() * w, r() * h, 1 + r() * (sz || 1.5), 1 + r() * (sz || 1.5)); } }

var TEX = {};
TEX.wallpaper = function () {                      // 복도 벽지: 세로 2.4m 한 장. 아래 걸레받이, 손때
  var c = cvs(512), g = c.getContext('2d'), r = rng(11), i;
  g.fillStyle = '#d3cfb6'; g.fillRect(0, 0, 512, 512);
  for (i = 0; i < 512; i += 8) { g.fillStyle = 'rgba(255,255,240,' + (i % 16 ? 0.035 : 0.0) + ')'; g.fillRect(i, 0, 4, 512); }
  for (i = 0; i < 46; i++) { g.strokeStyle = 'rgba(120,110,80,' + 0.05 * r() + ')'; g.lineWidth = 1; var x = r() * 512, y = r() * 512; g.beginPath(); g.arc(x, y, 5 + r() * 9, 0, 6.3); g.stroke(); }
  blots(g, r, 512, 512, 26, 90, '150,130,70', 0.10);
  var gr = g.createLinearGradient(0, 300, 0, 500); gr.addColorStop(0, 'rgba(90,80,50,0)'); gr.addColorStop(1, 'rgba(90,80,50,.26)'); g.fillStyle = gr; g.fillRect(0, 300, 512, 212);
  for (i = 0; i < 22; i++) { g.strokeStyle = 'rgba(60,60,55,' + (0.06 + r() * 0.1) + ')'; g.lineWidth = 1 + r() * 2; var sx = r() * 512, sy = 300 + r() * 120; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 14 + r() * 50, sy + (r() - 0.5) * 6); g.stroke(); }
  gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, 'rgba(60,55,40,.25)'); gr.addColorStop(1, 'rgba(60,55,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 40);
  g.fillStyle = '#4e3d2b'; g.fillRect(0, 493, 512, 19); g.fillStyle = 'rgba(255,230,190,.25)'; g.fillRect(0, 493, 512, 2);
  return fin(c);
};
TEX.tile = function () {                           // 화장실·주방 벽 타일: 20cm 12줄, 파란 띠 한 줄, 아래는 누렇게
  var S = 600, c = cvs(S), g = c.getContext('2d'), r = rng(23), i, j, q = 50;
  g.fillStyle = '#84806f'; g.fillRect(0, 0, S, S);
  for (j = 0; j < 12; j++) for (i = 0; i < 12; i++) {
    var band = j === 6, v = 0.93 + r() * 0.07, low = j > 8 ? (j - 8) * 0.035 : 0;
    var R = band ? 96 : 226 - low * 60, G = band ? 146 : 228 - low * 90, B = band ? 156 : 212 - low * 230;
    g.fillStyle = 'rgb(' + (R * v | 0) + ',' + (G * v | 0) + ',' + (B * v | 0) + ')'; g.fillRect(i * q + 2, j * q + 2, q - 3, q - 3);
    g.fillStyle = 'rgba(255,255,255,.34)'; g.fillRect(i * q + 2, j * q + 2, q - 3, 2); g.fillRect(i * q + 2, j * q + 2, 2, q - 3);
    g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(i * q + 2, j * q + q - 3, q - 3, 2);
    if (r() < 0.1) { g.fillStyle = 'rgba(120,100,40,.10)'; g.fillRect(i * q + 2, j * q + 2, q - 3, q - 3); }
  }
  blots(g, r, S, S, 16, 70, '110,95,40', 0.10);
  for (i = 0; i < 260; i++) { var gx = (r() * 12 | 0) * q, gy = 420 + r() * 180; g.fillStyle = 'rgba(30,35,25,' + r() * 0.5 + ')'; g.fillRect(gx + r() * 3, gy, 2, 3 + r() * 10); g.fillRect(r() * S, (8 + (r() * 4 | 0)) * q + r() * 3, 3 + r() * 14, 2); }
  return fin(c);
};
TEX.tfloor = function () {                         // 화장실 바닥: 청회색 잔 타일 12.5cm, 1m 한 장
  var S = 400, c = cvs(S), g = c.getContext('2d'), r = rng(31), i, j, q = 50;
  g.fillStyle = '#3f4649'; g.fillRect(0, 0, S, S);
  for (j = 0; j < 8; j++) for (i = 0; i < 8; i++) {
    var v = 0.82 + r() * 0.2; g.fillStyle = 'rgb(' + (112 * v | 0) + ',' + (130 * v | 0) + ',' + (136 * v | 0) + ')'; g.fillRect(i * q + 2, j * q + 2, q - 4, q - 4);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(i * q + 2, j * q + 2, q - 4, 2);
  }
  specks(g, r, S, S, 900, '30,40,40', 0.3, 2); blots(g, r, S, S, 10, 60, '60,60,40', 0.14);
  return fin(c);
};
TEX.jang = function () {                           // 노란 장판: 나무 무늬 인쇄, 2m 한 장
  var S = 512, c = cvs(S), g = c.getContext('2d'), r = rng(41), i, k;
  g.fillStyle = '#c2a060'; g.fillRect(0, 0, S, S);
  for (k = 0; k < 8; k++) {
    var x0 = k * 64, tone = 0.9 + r() * 0.2; g.fillStyle = 'rgba(' + (r() < 0.5 ? '150,110,50' : '225,190,120') + ',' + 0.16 * r() + ')'; g.fillRect(x0, 0, 64, S);
    for (i = 0; i < 26; i++) { g.strokeStyle = 'rgba(110,75,30,' + (0.05 + r() * 0.12) * tone + ')'; g.lineWidth = 0.6 + r() * 1.2; var x = x0 + r() * 64, w = (r() - 0.5) * 8; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + w, 170, x - w, 340, x + w * 0.4, S); g.stroke(); }
    g.fillStyle = 'rgba(80,55,25,.5)'; g.fillRect(x0, 0, 1.5, S); var jy = r() * S; g.fillRect(x0, jy, 64, 1.5);
  }
  blots(g, r, S, S, 14, 80, '90,70,30', 0.12); blots(g, r, S, S, 8, 60, '255,240,200', 0.10);
  return fin(c);
};
TEX.ceil = function () {
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(51), i, j;
  g.fillStyle = '#cfd0c2'; g.fillRect(0, 0, S, S);
  for (j = 0; j < 2; j++) for (i = 0; i < 2; i++) { g.strokeStyle = 'rgba(70,70,60,.5)'; g.lineWidth = 2; g.strokeRect(i * 128 + 1, j * 128 + 1, 126, 126); }
  specks(g, r, S, S, 500, '60,60,50', 0.5, 1.2); blots(g, r, S, S, 5, 70, '130,110,50', 0.14);
  return fin(c);
};
TEX.conc = function () {
  var S = 256, c = cvs(S), g = c.getContext('2d'), r = rng(61);
  g.fillStyle = '#8a8a82'; g.fillRect(0, 0, S, S); specks(g, r, S, S, 2600, '40,40,40', 0.35, 2); specks(g, r, S, S, 1200, '220,220,210', 0.3, 2); blots(g, r, S, S, 12, 60, '50,50,45', 0.14);
  return fin(c);
};
TEX.swall = function () {                          // 계단실 벽: 아래 1.2m 풀색 칠, 위는 미색. 세로 3m 한 장
  var S = 512, c = cvs(S), g = c.getContext('2d'), r = rng(71);
  g.fillStyle = '#d2cfb9'; g.fillRect(0, 0, S, S); g.fillStyle = '#6c9480'; g.fillRect(0, 307, S, 205); g.fillStyle = '#4f6f60'; g.fillRect(0, 305, S, 4);
  blots(g, r, S, S, 30, 80, '70,70,50', 0.10); specks(g, r, S, S, 1400, '40,50,40', 0.2, 2);
  for (var i = 0; i < 14; i++) { g.strokeStyle = 'rgba(40,50,45,' + 0.2 * r() + ')'; g.lineWidth = 1 + r() * 2; var x = r() * S, y = 330 + r() * 150; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 60, y + (r() - 0.5) * 12); g.stroke(); }
  return fin(c);
};
TEX.door = function () {                           // 방문: 갈색 무늬목, 은색 손잡이, 아래 환기 살
  var c = cvs(256, 512), g = c.getContext('2d'), r = rng(81), i;
  g.fillStyle = '#7a5738'; g.fillRect(0, 0, 256, 512);
  for (i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (r() < 0.5 ? '50,30,15' : '170,130,90') + ',' + (0.05 + r() * 0.13) + ')'; g.lineWidth = 0.7 + r() * 1.6; var x = r() * 256, w = (r() - 0.5) * 10; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + w, 170, x - w, 340, x, 512); g.stroke(); }
  g.strokeStyle = '#3c2a1a'; g.lineWidth = 10; g.strokeRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(0,0,0,.25)'; for (i = 0; i < 6; i++) g.fillRect(70, 420 + i * 11, 116, 5);
  g.fillStyle = '#2c2c2c'; g.beginPath(); g.arc(218, 262, 15, 0, 6.3); g.fill();
  var gr = g.createLinearGradient(0, 250, 0, 276); gr.addColorStop(0, '#f2f2ee'); gr.addColorStop(1, '#8b8d90'); g.fillStyle = gr; g.beginPath(); g.arc(218, 262, 12, 0, 6.3); g.fill(); g.fillRect(168, 257, 52, 10);
  blots(g, r, 256, 512, 8, 60, '30,20,10', 0.16);
  return fin(c);
};
TEX.steel = function () {
  var S = 128, c = cvs(S), g = c.getContext('2d'), r = rng(91);
  g.fillStyle = '#b6b9ba'; g.fillRect(0, 0, S, S); for (var i = 0; i < 300; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255' : '70,75,80') + ',' + 0.16 * r() + ')'; g.fillRect(0, r() * S, S, 1); }
  return fin(c);
};
TEX.window = function () {                          // 복도 끝 불투명 창
  var c = cvs(256), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d8e2e6'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#8f9396'; g.fillRect(0, 0, 256, 10); g.fillRect(0, 246, 256, 10); g.fillRect(0, 0, 10, 256); g.fillRect(246, 0, 10, 256); g.fillRect(123, 0, 10, 256);
  return fin(c, 1);
};
/* 글자 판: 표지·문패·포장 글씨 */
TEX.label = function (text, o) {
  o = o || {}; var w = o.w || 256, h = o.h || 128, c = cvs(w, h), g = c.getContext('2d');
  g.fillStyle = o.bg || '#f4f1e4'; g.fillRect(0, 0, w, h);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = o.bw || 8; g.strokeRect(0, 0, w, h); }
  if (o.draw) o.draw(g, w, h);
  g.fillStyle = o.fg || '#22201c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  var lines = String(text).split('\n'), fs = o.fs || h * 0.6;
  g.font = (o.weight || '') + ' ' + fs + 'px ' + (o.font || "'Eulji','Ria','Malgun Gothic',sans-serif");
  if (GS.EN) { var mw = 0; lines.forEach(function (ln) { mw = Math.max(mw, g.measureText(ln).width); }); if (mw > w - 20) { fs = Math.floor(fs * (w - 20) / mw); g.font = (o.weight || '') + ' ' + fs + 'px ' + (o.font || "'Eulji','Ria','Malgun Gothic',sans-serif"); } }   // 영문판: 판보다 긴 영어는 글자만 줄인다
  lines.forEach(function (ln, i) { g.fillText(ln, w * (o.tx || 0.5), h * (o.ty || 0.5) + (i - (lines.length - 1) / 2) * fs * 1.1 + fs * 0.04); });
  return fin(c, 1);
};
TEX.person = function (woman) {                    // 화장실 표지: 사람 그림
  return TEX.label('', { w: 128, h: 160, bg: woman ? '#c8323c' : '#2c5fa8', draw: function (g) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 36, 15, 0, 6.3); g.fill();
    if (woman) { g.beginPath(); g.moveTo(64, 54); g.lineTo(96, 112); g.lineTo(32, 112); g.closePath(); g.fill(); g.fillRect(50, 110, 10, 34); g.fillRect(68, 110, 10, 34); }
    else { g.fillRect(44, 56, 40, 50); g.fillRect(46, 102, 15, 44); g.fillRect(67, 102, 15, 44); g.fillRect(32, 58, 9, 40); g.fillRect(87, 58, 9, 40); }
  } });
};
GS.TEX = TEX;

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
Batch.prototype.mesh = function (mat) {
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(this.N, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(this.U, 2)); g.setAttribute('color', new T.Float32BufferAttribute(this.C, 3)); g.setIndex(this.I);
  var m = new T.Mesh(g, mat); m.matrixAutoUpdate = false; return m;
};
GS.Batch = Batch;

/* ---------- 재질(같이 쓴다) ---------- */
GS.makeMaterials = function () {
  var M = {}, L = function (tex, o) { o = o || {}; if (tex) o.map = tex; o.vertexColors = true; return new T.MeshLambertMaterial(o); };
  var Ph = function (tex, sh, sp, o) { o = o || {}; if (tex) o.map = tex; o.vertexColors = true; o.shininess = sh; o.specular = new T.Color(sp); return new T.MeshPhongMaterial(o); };
  M.wall = L(TEX.wallpaper()); M.tile = Ph(TEX.tile(), 55, 0x444444); M.tfloor = Ph(TEX.tfloor(), 40, 0x333333); M.jang = Ph(TEX.jang(), 30, 0x2a2618);
  M.ceil = L(TEX.ceil()); M.conc = L(TEX.conc()); M.swall = L(TEX.swall()); M.door = L(TEX.door()); M.steel = Ph(TEX.steel(), 70, 0x8a8a8a);
  M.cer = Ph(null, 90, 0x777777); M.pla = Ph(null, 22, 0x1c1c1c); M.mat = L(null);
  M.glow = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  M.rubber = new T.MeshPhongMaterial({ color: 0xd4141c, shininess: 80, specular: 0x8a4a4a });
  return M;
};
})();