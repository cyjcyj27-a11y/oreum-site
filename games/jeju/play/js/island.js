// 섬 — 실제 제주 해안선(경위도)·부속 섬·한라산·오름·마을 평탄화를 높이 함수 하나로. 땅·바다 메시
(function () {
  const N = NOISE.makeNoise(20260903);
  const rng = NOISE.makeRng(4411);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const bump = t => Math.max(0, 1 - t * t);

  // 경위도 → 세계 좌표 (1:18). 북쪽이 -z
  const LON0 = 126.55, LAT0 = 33.37, KX = 92900 / 18, KZ = 111000 / 18;
  function geo(lon, lat) { return { x: (lon - LON0) * KX, z: -(lat - LAT0) * KZ }; }
  const BOUNDS = { x0: -2400, x1: 2400, z0: -1750, z1: 1900 };

  // ── 해안선 (시계 방향, 경위도) ──
  const OUTLINE = [[126.163, 33.300], [126.175, 33.335], [126.205, 33.372], [126.240, 33.400], [126.265, 33.420], [126.300, 33.455], [126.330, 33.475], [126.400, 33.492], [126.450, 33.500], [126.490, 33.515],
    [126.520, 33.520], [126.560, 33.523], [126.600, 33.530], [126.650, 33.542], [126.680, 33.548], [126.720, 33.555], [126.760, 33.560], [126.800, 33.560], [126.850, 33.537], [126.900, 33.515],
    [126.930, 33.490], [126.940, 33.470], [126.948, 33.455], [126.925, 33.440], [126.936, 33.424], [126.900, 33.395], [126.860, 33.350], [126.840, 33.320], [126.780, 33.300], [126.720, 33.275],
    [126.660, 33.262], [126.620, 33.248], [126.570, 33.240], [126.520, 33.232], [126.470, 33.238], [126.420, 33.238], [126.370, 33.233], [126.330, 33.225], [126.310, 33.222], [126.290, 33.198],
    [126.260, 33.205], [126.220, 33.230], [126.180, 33.262]];
  let coast = OUTLINE.map(p => { const g = geo(p[0], p[1]); return [g.x, g.z]; });
  function chaikin(pts) { const out = []; const n = pts.length; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } return out; }
  coast = chaikin(chaikin(coast));
  // 잔 굴곡
  coast = coast.map((p, i) => { const a = coast[(i + coast.length - 1) % coast.length], b = coast[(i + 1) % coast.length]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; const nx = -dz / L, nz = dx / L; const d = 28 * N.noise3(p[0] * 0.006, 1.5, p[1] * 0.006) + 12 * N.noise3(p[0] * 0.02, 4.5, p[1] * 0.02); return [p[0] + nx * d, p[1] + nz * d]; });
  coast = chaikin(coast);

  const ISLETS = SPOTS.ISLETS.map(s => Object.assign({}, s, geo(s.lon, s.lat)));
  const TOWNS = SPOTS.TOWNS.map(t => Object.assign({}, t, geo(t.lon, t.lat)));
  for (const s of SPOTS.list) Object.assign(s, geo(s.lon, s.lat));

  window.__IT=[['top',performance.now()]];const __i=n=>window.__IT.push([n,performance.now()]);
  // ── 해안 거리 래스터 (8m). 양수 = 땅 ──
  const CELL = 8, GW = Math.ceil((BOUNDS.x1 - BOUNDS.x0) / CELL) + 1, GH = Math.ceil((BOUNDS.z1 - BOUNDS.z0) / CELL) + 1;
  const dist = new Float32Array(GW * GH);
  (function buildDist() {
    const n = coast.length;
    // 부호: 행마다 교차점
    const inside = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) {
      const z = BOUNDS.z0 + j * CELL; const xs = [];
      for (let i = 0; i < n; i++) { const a = coast[i], b = coast[(i + 1) % n]; if ((a[1] <= z) !== (b[1] <= z)) xs.push(a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) { const i0 = Math.max(0, Math.ceil((xs[k] - BOUNDS.x0) / CELL)), i1 = Math.min(GW - 1, Math.floor((xs[k + 1] - BOUNDS.x0) / CELL)); for (let i = i0; i <= i1; i++) inside[j * GW + i] = 1; }
    }
    // 거리: 선분까지.
    // 해안 마디 344개 × 칸 27만개 = 9천만 번이라 섬 하나 까는 데만 2.3초가 걸렸다(2026-09-12).
    // 칸을 4×4(32m)씩 묶어, 그 묶음 한가운데에서 잰 거리로 '여기서 가장 가까울 수 있는 마디'만 골라 둔다.
    // 묶음 반지름 R 만큼 어긋날 수 있으니 가장 가까운 거리 + 2R 안쪽 마디는 전부 남긴다 —
    // 버린 마디는 어느 칸에서도 더 가까울 수 없어서 나오는 값은 예전과 한 치도 다르지 않다.
    const SX = new Float64Array(n), SZ = new Float64Array(n), DX = new Float64Array(n), DZ = new Float64Array(n), IL = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      const a = coast[k], b = coast[(k + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1];
      SX[k] = a[0]; SZ[k] = a[1]; DX[k] = dx; DZ[k] = dz; IL[k] = 1 / (dx * dx + dz * dz);
    }
    const seg2 = (x, z, k) => { let t = ((x - SX[k]) * DX[k] + (z - SZ[k]) * DZ[k]) * IL[k]; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = x - SX[k] - DX[k] * t, ez = z - SZ[k] - DZ[k] * t; return ex * ex + ez * ez; };
    const BLK = 4, DC = new Float64Array(n), CAND = new Int32Array(n);
    for (let bj = 0; bj < GH; bj += BLK) for (let bi = 0; bi < GW; bi += BLK) {
      const iN = Math.min(GW, bi + BLK), jN = Math.min(GH, bj + BLK);
      const rx = (iN - bi - 1) * CELL / 2, rz = (jN - bj - 1) * CELL / 2, R = Math.hypot(rx, rz);
      const cx = BOUNDS.x0 + bi * CELL + rx, cz = BOUNDS.z0 + bj * CELL + rz;
      let mind = 1e9;
      for (let k = 0; k < n; k++) { const d = Math.sqrt(seg2(cx, cz, k)); DC[k] = d; if (d < mind) mind = d; }
      const lim = mind + 2 * R; let m = 0;
      for (let k = 0; k < n; k++) if (DC[k] <= lim) CAND[m++] = k;
      for (let j = bj; j < jN; j++) for (let i = bi; i < iN; i++) {
        const x = BOUNDS.x0 + i * CELL, z = BOUNDS.z0 + j * CELL; let best = 1e9;
        for (let q = 0; q < m; q++) { const d2 = seg2(x, z, CAND[q]); if (d2 < best) best = d2; }
        let d = Math.sqrt(best) * (inside[j * GW + i] ? 1 : -1);
        // 부속 섬 (타원)
        for (const s of ISLETS) { const t = Math.hypot((x - s.x) / s.rx, (z - s.z) / s.rz); const di = (1 - t) * Math.min(s.rx, s.rz); if (di > d) d = di; }
        dist[j * GW + i] = d;
      }
    }
  })(); __i('dist');
  function coastDist(x, z) {
    const fx = (x - BOUNDS.x0) / CELL, fz = (z - BOUNDS.z0) / CELL;
    const i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= GW - 1 || j >= GH - 1) return -500;
    const u = fx - i, v = fz - j, k = j * GW + i;
    return (dist[k] * (1 - u) + dist[k + 1] * u) * (1 - v) + (dist[k + GW] * (1 - u) + dist[k + GW + 1] * u) * v;
  }
  function inIslet(x, z) { for (const s of ISLETS) if (Math.hypot((x - s.x) / s.rx, (z - s.z) / s.rz) < 1) return s; return null; }

  // ── 오름 ──
  const OREUMS = [];
  for (const s of SPOTS.list) if (s.r && s.h) OREUMS.push({ x: s.x, z: s.z, r: s.r, h: s.h, crater: !!s.crater, tuff: !!s.tuff, dome: !!s.dome, id: s.id });
  for (const o of SPOTS.EXTRA_OREUMS) { const g = geo(o[0], o[1]); OREUMS.push({ x: g.x, z: g.z, r: o[2], h: o[3], crater: o[4] }); }
  const HC = geo(126.532, 33.362);   // 백록담
  const RIVER = { a: geo(126.623, 33.253), b: geo(126.626, 33.262) };   // 쇠소깍
  function oreumH(x, z) {
    let h = 0;
    for (const o of OREUMS) {
      const t = Math.hypot(x - o.x, z - o.z) / o.r; if (t >= 1) continue;
      let c;
      if (o.tuff) c = Math.pow(1 - t, 0.55); else if (o.dome) c = Math.sqrt(1 - t * t); else c = Math.pow(1 - t * t, 1.15);
      if (o.crater) c -= (o.tuff ? 0.45 : 0.25) * bump(t / 0.3) * bump(t / 0.3);
      h += o.h * c;
    }
    return h;
  }
  function rawH(x, z, d) {
    const isl = inIslet(x, z);
    if (isl) { const t = Math.hypot((x - isl.x) / isl.rx, (z - isl.z) / isl.rz); return 1.0 + isl.h * (isl.id === 'udo' || isl.id === 'gapado' ? Math.pow(1 - t * t, 0.5) * 0.5 + 0.5 * (1 - t) : Math.pow(1 - t * t, 0.8)) + 3 * N.noise3(x * 0.02, 2, z * 0.02) * (1 - t); }
    const t = Math.hypot((x - HC.x) / 1750, (z - HC.z) / 950);
    let halla = t < 1 ? 400 * Math.pow(1 - t, 1.7) : 0;
    halla += (1 - smooth(0.6, 1.0, t)) * (25 * N.fbm3(x * 0.0025, 1.2, z * 0.0025, 3, 2.1, 0.5) + 6 * N.noise3(x * 0.008, 3.3, z * 0.008));
    if (t < 0.04) halla -= 45 * Math.pow(1 - t / 0.04, 1.4);   // 백록담
    let h = 1.2 + Math.min(d, 220) * 0.012 + halla + 10 * N.fbm3(x * 0.0018, 7, z * 0.0018, 3, 2, 0.5) * smooth(80, 400, d);
    // 남쪽 해안 절벽 (서귀포 일대)
    const cliff = smooth(-1000, -700, x) * (1 - smooth(900, 1100, x)) * smooth(550, 640, z);
    if (cliff > 0 && d < 40) h += 11 * smooth(1, 12, d) * cliff;
    return h;
  }
  const townH = TOWNS.map(t => rawH(t.x, t.z, coastDist(t.x, t.z)));
  // 땅 메시를 만든 뒤에는 모든 높이를 메시에서 읽는다 (삼각형 보간) — 차·소품·도로가 땅에 정확히 붙는다
  let mesh = null;   // { h: Float32Array, nx, nz, x0, z0, cell }
  function meshH(x, z) {
    const m = mesh; const fx = (x - m.x0) / m.cx, fz = (z - m.z0) / m.cz;
    let ix = Math.floor(fx), iz = Math.floor(fz);
    if (ix < 0 || iz < 0 || ix >= m.nx - 1 || iz >= m.nz - 1) return analyticH(x, z);
    const u = fx - ix, v = fz - iz, W = m.nx;
    const ha = m.h[iz * W + ix], hb = m.h[(iz + 1) * W + ix], hc = m.h[(iz + 1) * W + ix + 1], hd = m.h[iz * W + ix + 1];
    if (u + v <= 1) return ha + (hd - ha) * u + (hb - ha) * v;
    return hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
  }
  function H(x, z) { return mesh ? meshH(x, z) : analyticH(x, z); }
  function analyticH(x, z) {
    const d = coastDist(x, z);
    if (d < 0) return Math.max(-60, -1.5 + d * 0.05);
    // 쇠소깍 물길
    { const ax = RIVER.a.x, az = RIVER.a.z, bx = RIVER.b.x, bz = RIVER.b.z; const dx = bx - ax, dz = bz - az; let t = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz); if (t > -0.1 && t < 1.1) { t = Math.max(0, Math.min(1, t)); const e = Math.hypot(x - ax - dx * t, z - az - dz * t); if (e < 14) return -2.5 + smooth(6, 14, e) * 4.5; } }
    let h = rawH(x, z, d);
    // 마을 평탄화
    let mm = 0;
    for (let i = 0; i < TOWNS.length; i++) {
      const t = TOWNS[i]; const hw = t.cols * t.cell / 2 + 40, hd = t.rows * t.cell / 2 + 40;
      const m = smooth(hw + 90, hw, Math.abs(x - t.x)) * smooth(hd + 90, hd, Math.abs(z - t.z));
      if (m > 0) { h = h * (1 - m) + (townH[i] + (h - townH[i]) * 0.15) * m; if (m > mm) mm = m; }
    }
    // 오름은 마을 밖에서만 온전히 솟는다 (마을 안에 걸친 오름은 눌린다)
    if (!inIslet(x, z)) h += oreumH(x, z) * (1 - mm * 0.9);
    return h;
  }

  // ── 땅 색 ──
  const cCol = new THREE.Color();
  function hash2(i, j) { let s = (i * 73856093) ^ (j * 19349663); s = (s ^ (s >>> 13)) * 1274126177; return ((s ^ (s >>> 16)) >>> 0) / 4294967296; }
  const beaches = SPOTS.list.filter(s => s.beach);
  const teaG = geo(126.289, 33.305);
  // 땅 색·재질 무게: out = 사진에 곱할 밝기·색조(1 근처), w = [숲, 모래, 바위, 콘크리트] 무게 (나머지가 풀)
  function groundColor(x, z, h, out, w) {
    const d = coastDist(x, z);
    const n = N.noise3(x * 0.02, 0.5, z * 0.02), n2 = N.fbm3(x * 0.0045, 3.1, z * 0.0045, 3, 2.2, 0.5), n3 = N.noise3(x * 0.09, 9.2, z * 0.09);
    w[0] = w[1] = w[2] = w[3] = 0;
    if (d < -14) { w[2] = 1; out.setRGB(0.25, 0.32, 0.36); return out; }   // 바다 밑
    let beach = null; for (const b of beaches) if (Math.hypot(x - b.x, z - b.z) < 170) { beach = b; break; }
    if (d < 6 || (beach && d < 30)) {
      if (beach && beach.beach !== 'black') { w[1] = 1; const s = 1.0 + 0.06 * n; out.setRGB(s, s, s * 0.98); return out; }
      w[2] = 1; const s = 0.42 + 0.08 * n + 0.04 * n3; out.setRGB(s, s, s * 1.04); return out;   // 현무암: 회색 바위 사진을 어둡게
    }
    for (const t of TOWNS) { const hw = t.cols * t.cell / 2 + 20, hd = t.rows * t.cell / 2 + 20; if (Math.abs(x - t.x) < hw && Math.abs(z - t.z) < hd) { w[3] = 1; const s = 0.85 + 0.08 * n; out.setRGB(s, s, s); return out; } }
    const t = Math.hypot((x - HC.x) / 1750, (z - HC.z) / 950);
    const i = Math.floor(x / 70), j = Math.floor(z / 70), r = hash2(i, j);
    // 밭 조각: 풀 사진에 색조만 달리 곱한다. 갈아엎은 밭은 숲 바닥(흙) 사진
    let tint;
    if (r < 0.42) tint = [1.0, 1.0, 0.95]; else if (r < 0.7) tint = [0.78, 0.84, 0.72]; else if (r < 0.82) { tint = [1.05, 0.95, 0.82]; w[0] = 0.85; } else if (r < 0.9) tint = [1.25, 1.12, 0.72]; else tint = [0.92, 1.0, 0.85];
    if (Math.hypot(x - teaG.x, z - teaG.z) < 260) tint = [0.75, 0.95, 0.8];
    let steep = 0; for (const o of OREUMS) { const tt = Math.hypot(x - o.x, z - o.z) / o.r; if (tt < 1) steep = Math.max(steep, 1 - tt); }
    const forest = smooth(0.62, 0.5, t) * (1 - smooth(0.3, 0.2, t)), alpine = smooth(0.3, 0.12, t), top = smooth(0.1, 0.04, t);
    const k = Math.max(steep, smooth(0.75, 0.6, t) * 0.6);
    out.setRGB(tint[0] * (1 - k) + 0.85 * k, tint[1] * (1 - k) + 0.92 * k, tint[2] * (1 - k) + 0.75 * k);
    w[0] = Math.max(w[0], forest * 0.9);                       // 숲 바닥
    w[2] = Math.max(w[2], alpine * 0.8 + top);                 // 고지대는 바위
    out.multiplyScalar(1 + 0.08 * n + 0.10 * n2 + 0.06 * n3);
    if (n3 > 0.55 && forest < 0.5) { w[0] = Math.max(w[0], (n3 - 0.55) * 1.5); }   // 마른 흙 드문드문
    // 잔디 사진이 누런 편(151,131,89)이라 풀 자리만 초록으로 당긴다. 숲·바위 무게만큼은 덜 당긴다
    { const gw = Math.max(0, 1 - w[0] - w[2]); out.r *= 1 - 0.30 * gw; out.b *= 1 - 0.40 * gw; }
    if (d < 20) { const c = 1 - smooth(6, 20, d); w[2] = Math.max(w[2], c * 0.8); out.multiplyScalar(1 - 0.35 * c); }
    let sum = w[0] + w[1] + w[2] + w[3]; if (sum > 1) { w[0] /= sum; w[1] /= sum; w[2] /= sum; w[3] /= sum; }
    return out;
  }

  function buildGround() {
    const W = BOUNDS.x1 - BOUNDS.x0, D = BOUNDS.z1 - BOUNDS.z0, SX = 300, SZ = 230;
    const g = new THREE.PlaneGeometry(W, D, SX, SZ); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    const hs = new Float32Array(pos.count), wts = new Float32Array(pos.count * 4), w4 = new Float32Array(4);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i) + (BOUNDS.z0 + BOUNDS.z1) / 2;
      const h = analyticH(x, z); pos.setY(i, h); pos.setZ(i, z); hs[i] = h;
      groundColor(x, z, h, c, w4); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      wts[i * 4] = w4[0]; wts[i * 4 + 1] = w4[1]; wts[i * 4 + 2] = w4[2]; wts[i * 4 + 3] = w4[3];
    }
    g.setAttribute('aW', new THREE.BufferAttribute(wts, 4));
    // 정점 순서: x 는 왼쪽부터, z 는 북쪽(-)부터 — PlaneGeometry 를 -90도 눕힌 뒤 순서 그대로
    mesh = { h: hs, nx: SX + 1, nz: SZ + 1, x0: -W / 2, z0: BOUNDS.z0, cx: W / SX, cz: D / SZ };
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const P = TEX.P, RPT = 7;   // 사진 한 장 = 7m
    if (!(P.leafy_grass && P.leafy_grass.map)) {   // 사진이 없으면 예전 코드 질감
      const gm = TEX.grass.clone(), gn = TEX.grassN.clone(); gm.repeat.set(W / 9, D / 9); gn.repeat.set(W / 9, D / 9); gm.needsUpdate = gn.needsUpdate = true;
      const m0 = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, color: new THREE.Color(0.22, 0.27, 0.12), roughness: 0.9, map: gm, normalMap: gn, normalScale: new THREE.Vector2(0.55, 0.55) })); m0.receiveShadow = true; return m0;
    }
    // 풀 사진을 기본으로 깔고, 정점 무게(aW)로 숲·모래·바위·콘크리트 사진을 섞는다 (스플랫)
    const G = P.leafy_grass, F = P.forrest_ground_01, Sd = P.coast_sand_01, Rk = P.aerial_rocks_02, Cc = P.concrete_pavement;
    const gm = TEX.rep(G.map, W / RPT, D / RPT), gn = TEX.rep(G.normal, W / RPT, D / RPT), gr = TEX.rep(G.rough, W / RPT, D / RPT);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: gm, normalMap: gn, roughnessMap: gr, normalScale: new THREE.Vector2(0.9, 0.9) });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { tF: { value: F.map }, tFn: { value: F.normal }, tS: { value: Sd.map }, tSn: { value: Sd.normal }, tR: { value: Rk.map }, tRn: { value: Rk.normal }, tC: { value: Cc.map }, tCn: { value: Cc.normal }, tCr: { value: Cc.rough } });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aW; varying vec4 vW;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvW = aW;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vW; uniform sampler2D tF, tFn, tS, tSn, tR, tRn, tC, tCn, tCr;\nvec4 splat(sampler2D g, sampler2D f, sampler2D s, sampler2D r, sampler2D c, vec2 uv, vec4 w){ float w0 = max(0.0, 1.0 - w.x - w.y - w.z - w.w); return texture2D(g, uv) * w0 + texture2D(f, uv) * w.x + texture2D(s, uv * 1.5) * w.y + texture2D(r, uv * 0.7) * w.z + texture2D(c, uv * 0.6) * w.w; }')
        .replace('#include <map_fragment>', 'diffuseColor *= splat(map, tF, tS, tR, tC, vMapUv, vW);')
        .replace('#include <normal_fragment_maps>', '{ vec3 mapN = splat(normalMap, tFn, tSn, tRn, tCn, vMapUv, vW).xyz * 2.0 - 1.0; mapN.xy *= normalScale; normal = normalize( tbn * mapN ); }')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * mix(texture2D(roughnessMap, vMapUv).g, texture2D(tCr, vMapUv * 0.6).g, vW.w); roughnessFactor = mix(roughnessFactor, 0.75, vW.y);');
    };
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
  }

  let seaMat = null;
  function buildSea() {
    const W = 11000, D = 9000, SX = 220, SZ = 180;
    const g = new THREE.PlaneGeometry(W, D, SX, SZ); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), foam = new Float32Array(pos.count);
    // 선형 색: 깊은 바다 → 얕은 청록 → 모래 위 연한 물
    const deep = new THREE.Color(0.006, 0.028, 0.065), shallow = new THREE.Color(0.025, 0.14, 0.16), sand = new THREE.Color(0.07, 0.21, 0.21), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const out = -coastDist(x, z);
      c.copy(sand).lerp(shallow, smooth(0, 10, out)).lerp(deep, Math.pow(smooth(0, 70, out), 0.75)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      foam[i] = 1 - smooth(3, 16, out);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('foam', new THREE.BufferAttribute(foam, 1));
    seaMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uN: { value: TEX.waterN }, sunDir: { value: new THREE.Vector3(0.5, 0.5, 0.5) }, sunCol: { value: new THREE.Color(1, 0.9, 0.7) }, night: { value: 0 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0.0005 }, skyTop: { value: new THREE.Color() }, skyHor: { value: new THREE.Color() } },
      vertexShader: `attribute float foam; varying vec3 vC; varying float vF; varying vec3 vW; varying float vFog; uniform float uT;
        void main(){ vC = color; vF = foam; vec3 p = position; p.y += 0.22*sin(p.x*0.045 + uT*1.1) + 0.18*sin(p.z*0.07 - uT*0.9) + 0.12*sin((p.x+p.z)*0.11 + uT*1.7);
          vec4 wp = modelMatrix * vec4(p,1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; gl_Position = projectionMatrix * mv; vFog = -mv.z; }`,
      fragmentShader: `varying vec3 vC; varying float vF; varying vec3 vW; varying float vFog; uniform float uT; uniform sampler2D uN; uniform vec3 sunDir, sunCol, fogColor, skyTop, skyHor; uniform float night, fogDensity;
        void main(){
          vec3 n1 = texture2D(uN, vW.xz * 0.014 + vec2(uT * 0.010, uT * 0.008)).xyz * 2.0 - 1.0;
          vec3 n2 = texture2D(uN, vW.xz * 0.045 - vec2(uT * 0.018, -uT * 0.014)).xyz * 2.0 - 1.0;
          vec3 n3 = texture2D(uN, vW.xz * 0.16 + vec2(-uT * 0.03, uT * 0.025)).xyz * 2.0 - 1.0;
          float dist = length(cameraPosition - vW); float nk = 1.0 / (1.0 + dist * 0.008); float nk3 = 1.0 / (1.0 + dist * 0.05);
          vec3 n = normalize(vec3((n1.x * 1.0 + n2.x * 0.7) * nk + n3.x * 0.5 * nk3, 2.6, (n1.y * 1.0 + n2.y * 0.7) * nk + n3.y * 0.5 * nk3));
          vec3 v = normalize(cameraPosition - vW);
          float nv = max(0.0, dot(n, v));
          float F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
          vec3 r = reflect(-v, n);
          vec3 skyc = mix(skyHor, skyTop, pow(max(0.0, r.y), 0.55));
          float sunUp = smoothstep(-0.05, 0.15, sunDir.y);
          float rs = max(0.0, dot(r, sunDir));
          vec3 glare = sunCol * (pow(rs, 900.0) * 14.0 + pow(rs, 60.0) * 0.5 + pow(rs, 6.0) * 0.06) * sunUp * (1.0 - 0.85 * night);
          float lit = 0.25 + 0.75 * max(0.0, sunDir.y);
          vec3 body = vC * lit * (1.0 - 0.9 * night);
          // 파도 마루가 해를 향하면 속이 비쳐 청록빛
          body += vec3(0.02, 0.10, 0.09) * max(0.0, dot(n, sunDir)) * pow(1.0 - nv, 2.0) * sunUp * (1.0 - night);
          vec3 c = mix(body, skyc, F) + glare;
          float foamA = vF * (0.45 + 0.55 * sin(vW.x * 0.3 + uT * 1.5 + sin(vW.z * 0.2))) * (0.6 + 0.4 * n3.x);
          c = mix(c, vec3(0.75, 0.78, 0.78) * lit * (1.0 - 0.8 * night), clamp(foamA, 0.0, 1.0) * 0.8);
          float f = 1.0 - exp(-fogDensity * fogDensity * vFog * vFog); c = mix(c, fogColor, f);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      vertexColors: true,
    });
    const m = new THREE.Mesh(g, seaMat); m.renderOrder = 1; return m;
  }

  function init(scene) { scene.add(buildGround()); scene.add(buildSea()); }
  function update(dt, t, sky) {
    if (!seaMat) return;
    seaMat.uniforms.uT.value = t; seaMat.uniforms.sunDir.value.copy(sky.sunDir); seaMat.uniforms.sunCol.value.copy(sky.sunColor);
    seaMat.uniforms.night.value = sky.night; seaMat.uniforms.fogColor.value.copy(sky.fogColor); seaMat.uniforms.fogDensity.value = sky.fogDensity;
    seaMat.uniforms.skyTop.value.copy(sky.skyTop); seaMat.uniforms.skyHor.value.copy(sky.skyHor);
  }

  __i('end');
  window.ISLAND = { H, geo, coastDist, inIslet, coast, OREUMS, ISLETS, TOWNS, BOUNDS, HC, RIVER, init, update, smooth, hash2, rng, N, beaches };
})();
