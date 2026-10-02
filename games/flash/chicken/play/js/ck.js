/* 치킨집 3D — 닭 덩어리. 닭은 부피 격자(거리 값)로 갖고 있고, 칼질하면 격자를 평면으로 갈라 조각마다 다시 겉면을 뜬다.
   좌표: x 좌우, y 위, z 앞(다리 쪽이 +z). 단위는 게임 단위(도마가 4.4) */
var CK = (function () {
'use strict';
var H = 0.078, X0 = -1.8, Y0 = -0.14, Z0 = -1.7, NX = 48, NY = 23, NZ = 46, BASE = null, TOTAL = 1, pid = 1;
function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
function ellip(x, y, z, cx, cy, cz, rx, ry, rz) { var dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz; return (Math.sqrt(dx * dx + dy * dy + dz * dz) - 1) * Math.min(rx, ry, rz); }
function caps(x, y, z, ax, ay, az, bx, by, bz, ra, rb) {
  var pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  var t = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  var dx = pax - bax * t, dy = pay - bay * t, dz = paz - baz * t; return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t);
}
function chicken(x, y, z) {
  var ax = Math.abs(x), d;
  d = ellip(x, y, z, 0, 0.56, -0.3, 1.02, 0.6, 1.2);                               /* 몸통 */
  d = smin(d, ellip(ax, y, z, 0.37, 0.84, -0.42, 0.5, 0.4, 0.86), 0.16);           /* 가슴 두 쪽 */
  d = smin(d, ellip(ax, y, z, 0.66, 0.5, 0.72, 0.5, 0.46, 0.6), 0.2);              /* 허벅지 */
  d = smin(d, caps(ax, y, z, 0.74, 0.5, 0.86, 0.3, 0.4, 1.42, 0.36, 0.15), 0.14);  /* 북채 */
  d = smin(d, ellip(ax, y, z, 0.27, 0.4, 1.5, 0.15, 0.14, 0.15), 0.06);            /* 뼈 끝 */
  d = smin(d, caps(ax, y, z, 0.95, 0.46, -0.9, 1.4, 0.34, -0.25, 0.27, 0.22), 0.14); /* 날개 */
  d = smin(d, caps(ax, y, z, 1.4, 0.34, -0.25, 1.2, 0.3, 0.3, 0.2, 0.13), 0.1);
  d = smin(d, ellip(x, y, z, 0, 0.5, -1.42, 0.3, 0.26, 0.2), 0.12);                /* 목 */
  return Math.max(d, 0.02 - y);
}
function init() {
  var f = new Float32Array(NX * NY * NZ), n = 0, i, j, k, q = 0;
  for (k = 0; k < NZ; k++) for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) { var v = chicken(X0 + i * H, Y0 + j * H, Z0 + k * H); f[q++] = v; if (v < 0) n++; }
  BASE = f; TOTAL = n;
}
function hash(x, y, z) { var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
function noise(x, y, z) {
  var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  function L(a, b, t) { return a + (b - a) * t; }
  return L(L(L(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), L(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
    L(L(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), L(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
/* 조각: 격자 조각(f, cut)을 받아 겉면·넓이·바닥 그림자(발자국) 따위를 셈한다 */
function finish(P) {
  var nx = P.nx, ny = P.ny, nz = P.nz, f = P.f, n = 0, sx = 0, sy = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, i, j, k, q = 0;
  P.foot = new Uint8Array(nx * nz);
  for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++, q++) if (f[q] < 0) { n++; var x = X0 + (P.ox + i) * H, y = Y0 + (P.oy + j) * H, z = Z0 + (P.oz + k) * H; sx += x; sy += y; sz += z; sxx += x * x; szz += z * z; sxz += x * z; P.foot[i + nx * k] = 1; }
  P.n = n; P.size = n / TOTAL; P.cx = sx / n; P.cy = sy / n; P.cz = sz / n;
  var vxx = sxx / n - P.cx * P.cx, vzz = szz / n - P.cz * P.cz, vxz = sxz / n - P.cx * P.cz;
  P.axis = 0.5 * Math.atan2(2 * vxz, vxx - vzz); P.r = Math.pow(n * H * H * H * 0.75 / Math.PI, 1 / 3); P.rx = Math.sqrt(Math.max(vxx, vzz)) * 1.9;
  P.id = pid++; P.seed = 1 + Math.floor(Math.random() * 9999); P.coat = 0; P.done = 0; P.sauce = null; P.sa = 0;
  mesh(P);
  return P;
}
function whole() { var P = { nx: NX, ny: NY, nz: NZ, ox: 0, oy: 0, oz: 0, f: new Float32Array(BASE), cut: new Uint8Array(NX * NY * NZ) }; P.whole = true; return finish(P); }
/* 발자국: 닭 좌표 (x,z) 위에 이 조각의 살이 있나 */
function at(P, x, z) { var i = Math.round((x - X0) / H) - P.ox, k = Math.round((z - Z0) / H) - P.oz; return i >= 0 && k >= 0 && i < P.nx && k < P.nz && P.foot[i + P.nx * k] === 1; }
/* (ax,az)를 지나 (dx,dz) 방향의 곧은 칼로 가른다. 떨어진 덩어리마다 조각 하나 */
function split(P, ax, az, dx, dz) {
  var nx = P.nx, ny = P.ny, nz = P.nz, N = nx * ny * nz, out = [], s, i, j, k, q;
  for (s = 0; s < 2; s++) {
    var sg = s ? -1 : 1, f = new Float32Array(N), cut = new Uint8Array(P.cut), lab = new Int32Array(N), nl = 0, cnt = [0];
    for (q = 0, k = 0; k < nz; k++) { var z = Z0 + (P.oz + k) * H; for (j = 0; j < ny; j++) for (i = 0; i < nx; i++, q++) { var x = X0 + (P.ox + i) * H, d = sg * ((x - ax) * dz - (z - az) * dx), o = P.f[q]; if (d > o) { f[q] = d; if (o < 0 && d >= 0) cut[q] = 1; } else f[q] = o; } }
    /* 이어진 덩어리 나누기 */
    var st = new Int32Array(N);
    for (q = 0; q < N; q++) {
      if (f[q] >= 0 || lab[q]) continue;
      nl++; cnt.push(0); var sp = 0; st[sp++] = q; lab[q] = nl;
      while (sp) { var c = st[--sp]; cnt[nl]++; var ci = c % nx, cj = Math.floor(c / nx) % ny, ck = Math.floor(c / (nx * ny)), m;
        if (ci > 0) { m = c - 1; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } } if (ci < nx - 1) { m = c + 1; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } }
        if (cj > 0) { m = c - nx; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } } if (cj < ny - 1) { m = c + nx; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } }
        if (ck > 0) { m = c - nx * ny; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } } if (ck < nz - 1) { m = c + nx * ny; if (f[m] < 0 && !lab[m]) { lab[m] = nl; st[sp++] = m; } } }
    }
    for (var L = 1; L <= nl; L++) {
      if (cnt[L] < 0.01 * TOTAL) continue;                 /* 부스러기는 버린다 */
      var i0 = nx, i1 = -1, j0 = ny, j1 = -1, k0 = nz, k1 = -1;
      for (q = 0, k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++, q++) if (lab[q] === L) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; if (k < k0) k0 = k; if (k > k1) k1 = k; }
      i0--; j0--; k0--; i1++; j1++; k1++;
      var mx = i1 - i0 + 1, my = j1 - j0 + 1, mz = k1 - k0 + 1, F = new Float32Array(mx * my * mz), C = new Uint8Array(mx * my * mz), w = 0;
      for (k = k0; k <= k1; k++) for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++, w++) {
        if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) { F[w] = 0.05; continue; }
        q = i + nx * (j + ny * k); if (f[q] < 0 && lab[q] !== L) { F[w] = 0.04; C[w] = 1; } else { F[w] = f[q]; C[w] = cut[q]; }
      }
      out.push(finish({ nx: mx, ny: my, nz: mz, ox: P.ox + i0, oy: P.oy + j0, oz: P.oz + k0, f: F, cut: C, side: sg }));
    }
  }
  return out;
}
/* 겉면 뜨기(surface nets). 꼭짓점 좌표는 조각 무게중심 기준 */
var CORN = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
var EDGE = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
function mesh(P) {
  var nx = P.nx, ny = P.ny, nz = P.nz, f = P.f, cut = P.cut, cx = nx - 1, cy = ny - 1, vid = new Int32Array(cx * cy * (nz - 1)).fill(-1), pos = [], fl = [], idx = [], i, j, k, e, v = [0, 0, 0, 0, 0, 0, 0, 0];
  var bx = X0 + P.ox * H - P.cx, by = Y0 + P.oy * H - P.cy, bz = Z0 + P.oz * H - P.cz;
  for (k = 0; k < nz - 1; k++) for (j = 0; j < cy; j++) for (i = 0; i < cx; i++) {
    var q = i + nx * (j + ny * k), neg = 0, c;
    for (c = 0; c < 8; c++) { v[c] = f[q + CORN[c][0] + nx * (CORN[c][1] + ny * CORN[c][2])]; if (v[c] < 0) neg++; }
    if (neg === 0 || neg === 8) continue;
    var sx = 0, sy = 0, sz = 0, n = 0, oc = 0, cc = 0;
    for (e = 0; e < 12; e++) { var a = EDGE[e][0], b = EDGE[e][1], va = v[a], vb = v[b]; if ((va < 0) === (vb < 0)) continue; var t = va / (va - vb); sx += CORN[a][0] + (CORN[b][0] - CORN[a][0]) * t; sy += CORN[a][1] + (CORN[b][1] - CORN[a][1]) * t; sz += CORN[a][2] + (CORN[b][2] - CORN[a][2]) * t; n++; }
    for (c = 0; c < 8; c++) if (v[c] >= 0) { oc++; if (cut[q + CORN[c][0] + nx * (CORN[c][1] + ny * CORN[c][2])]) cc++; }
    vid[i + cx * (j + cy * k)] = pos.length / 3; pos.push(bx + (i + sx / n) * H, by + (j + sy / n) * H, bz + (k + sz / n) * H); fl.push(cc * 2 >= oc ? 1 : 0);
  }
  function quad(a, b, c, d, flip) { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); }
  function V(i, j, k) { return vid[i + cx * (j + cy * k)]; }
  for (k = 1; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) { var p = i + nx * (j + ny * k), s0 = f[p] < 0, s1 = f[p + 1] < 0; if (s0 !== s1) quad(V(i, j - 1, k - 1), V(i, j, k - 1), V(i, j, k), V(i, j - 1, k), !s0); }
  for (k = 1; k < nz - 1; k++) for (j = 0; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) { p = i + nx * (j + ny * k); s0 = f[p] < 0; s1 = f[p + nx] < 0; if (s0 !== s1) quad(V(i - 1, j, k - 1), V(i - 1, j, k), V(i, j, k), V(i, j, k - 1), !s0); }
  for (k = 0; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) { p = i + nx * (j + ny * k); s0 = f[p] < 0; s1 = f[p + nx * ny] < 0; if (s0 !== s1) quad(V(i - 1, j - 1, k), V(i, j - 1, k), V(i, j, k), V(i - 1, j, k), !s0); }
  P.pos = new Float32Array(pos); P.flesh = new Uint8Array(fl); P.idx = pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
}
/* 살을 끝까지 지나간 칼질만 자른다. 좌표는 닭 좌표(도마 위 조각의 밀린 만큼은 부르는 쪽에서 뺀다) */
function tryCut(P, ax, az, bx, bz) {
  var len = Math.hypot(bx - ax, bz - az); if (len < 0.18) return null;
  var dx = (bx - ax) / len, dz = (bz - az) / len, minS = 1e9, maxS = -1e9, cnt = 0;
  for (var s = -5.2; s <= len + 5.2; s += 0.03) if (at(P, ax + dx * s, az + dz * s)) { cnt++; if (s < minS) minS = s; if (s > maxS) maxS = s; }
  if (cnt < 5 || minS < -0.04 || maxS > len + 0.04) return null;
  var r = split(P, ax, az, dx, dz); if (r.length < 2) return null;
  var sm = 1; r.forEach(function (q) { sm = Math.min(sm, q.size); }); if (sm < 0.012 && r.length === 2) return null;
  return { parts: r, nx: -dz, nz: dx, line: [ax + dx * minS, az + dz * minS, ax + dx * maxS, az + dz * maxS] };
}
function halve(P, wob) {
  var a = P.axis + Math.PI / 2 + (wob ? (Math.random() - 0.5) * wob : 0), off = wob ? (Math.random() - 0.5) * wob * 0.4 : 0, dx = Math.cos(a), dz = Math.sin(a);
  var px = P.cx + Math.cos(P.axis) * off, pz = P.cz + Math.sin(P.axis) * off, r = split(P, px, pz, dx, dz);
  if (r.length < 2) return null;
  return { parts: r, nx: -dz, nz: dx, line: [px - dx * P.rx, pz - dz * P.rx, px + dx * P.rx, pz + dz * P.rx] };
}
return { init: init, whole: whole, at: at, split: split, tryCut: tryCut, halve: halve, noise: noise, H: H, total: function () { return TOTAL; } };
})();
