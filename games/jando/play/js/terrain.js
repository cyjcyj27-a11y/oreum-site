// 석주 — 반지름 함수 하나로 모양·충돌을 정한다 (스카이라이더 terrain.js 에서 가져와 잔도용으로 고침)
// 잔도는 이 기둥 둘레를 나선으로 감아 올라간다. 판자 한 칸 SEG m, 한 칸마다 RISE m 오른다
(function () {
  const N = NOISE.makeNoise(20261006);
  const BASE = -260;                       // 협곡 바닥 (구름바다 아래로 숨는다)
  const SEG = 1.5, RISE = 0.42, RREF = 7.3, NSEG = 160, Y0 = 0.35, TH0 = 0;
  const DTH = SEG / RREF;                  // 판자 한 칸이 도는 각
  const SUMMIT = Y0 + NSEG * RISE;         // 마지막 판자 높이 = 정상 마당
  const RADIAL_SEG = 112;

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  // 시작 바위턱 — 기둥 한쪽에만 튀어나온 선반. 윗면 y = 0 (자재 더미와 첫날 출발점)
  const SHELF = { c: -0.625, half: 0.81, yt: 0, yb: -1.7, w: 3.1 };   // 끝(각 0.2 언저리)은 첫 칸 끝에서 끊긴다 — 그 너머로 걸어 나가면 안전줄에 매달린다
  function shelfW(th) { const d = Math.abs(wrap(th - SHELF.c)); return SHELF.w * smooth(SHELF.half + 0.03, SHELF.half - 0.05, d); }
  function shelfV(y) { return smooth(SHELF.yb - 1.4, SHELF.yb, y) * (1 - smooth(SHELF.yt, SHELF.yt + 0.12, y)); }

  function baseRadius(y) {
    let r = 6.3 + 0.9 * Math.sin(y * 0.045 + 1.0) + 0.7 * N.noise3(0.37, y * 0.07, 5.1);
    if (y < -40) r += (-40 - y) * 0.06;                                 // 밑동은 벌어진다
    r += smooth(SUMMIT - 7, SUMMIT - 0.4, y) * 1.7;                     // 정상은 넓은 마당
    return r;
  }
  // 표면 요철 (각도·높이로만 정해지는 값) — 그림과 충돌이 같은 값을 쓴다
  function bump(th, y) {
    const px = Math.cos(th) * 7.5, pz = Math.sin(th) * 7.5;
    let d = 0.30 * N.fbm3(px * 0.33, y * 0.33, pz * 0.33, 3, 2.1, 0.5);
    d += 0.07 * N.noise3(px * 1.7, y * 1.7, pz * 1.7);
    d += 0.06 * Math.sin(y * 2.4 + 1.5 * N.noise3(px * 0.15, y * 0.05, pz * 0.15));   // 사암 지층 줄
    // 세로 골 (장가계 석주처럼 위아래로 길게 팬 홈) — 각도마다 깊이가 다르다
    const fl = Math.abs(Math.sin(th * 9 + 1.6 * N.noise3(px * 0.05, y * 0.025, pz * 0.05)));
    d -= 0.28 * Math.pow(1 - fl, 3) * (0.6 + 0.4 * N.noise3(px * 0.2, y * 0.04, pz * 0.2));
    return d;
  }
  function surfaceRadius(th, y) { return baseRadius(y) + bump(th, y) + shelfW(th) * shelfV(y); }
  function surfacePoint(th, y, off, out) {
    const r = surfaceRadius(th, y) + (off || 0);
    out = out || new THREE.Vector3(); return out.set(Math.cos(th) * r, y, Math.sin(th) * r);
  }
  function surfaceNormal(th, y, out) {
    const e = 0.05, f0 = surfaceRadius(th, y);
    const dRdy = (surfaceRadius(th, y + e) - f0) / e, dRdth = (surfaceRadius(th + e, y) - f0) / e;
    const c = Math.cos(th), s = Math.sin(th), r = Math.max(0.5, f0);
    out = out || new THREE.Vector3();
    return out.set(c + (dRdth / r) * s, -dRdy, s - (dRdth / r) * c).normalize();
  }

  // ── 충돌: 점을 바위 밖으로 밀어낸다. 접촉 없으면 null ─────
  const _n = new THREE.Vector3();
  function shelfTop(th, d) {   // 선반 윗면 위에 있나 (d = 축에서 거리)
    const w = shelfW(th); if (w < 0.05) return false;
    const inner = baseRadius(0.1) + bump(th, 0.1) - 0.5, outer = baseRadius(SHELF.yt) + bump(th, SHELF.yt) + w;
    return d < outer + 0.02 && d > inner;
  }
  function collidePoint(p, pad) {
    if (p.y < BASE + pad) { const push = BASE + pad - p.y; p.y = BASE + pad; return { push, nx: 0, ny: 1, nz: 0 }; }   // 협곡 바닥
    const d = Math.hypot(p.x, p.z), th = Math.atan2(p.z, p.x);
    // 정상 뚜껑
    if (p.y > SUMMIT - 0.3) {
      const rTop = baseRadius(SUMMIT) + bump(th, SUMMIT) + 0.05;
      if (d < rTop) {
        if (p.y < SUMMIT + pad + 0.05) { const push = Math.max(0, SUMMIT + pad - p.y); p.y += push; return { push, nx: 0, ny: 1, nz: 0 }; }
        return null;
      }
      if (p.y > SUMMIT + 0.5) return null;
    }
    if (p.y < BASE + pad) { const push = BASE + pad - p.y; p.y = BASE + pad; return { push, nx: 0, ny: 1, nz: 0 }; }
    // 선반 윗면: 평평한 판 콜라이더
    if (p.y > SHELF.yt - 0.35 && p.y < SHELF.yt + pad + 0.05 && shelfTop(th, d)) {
      const push = Math.max(0, SHELF.yt + pad - p.y); p.y += push; return { push, nx: 0, ny: 1, nz: 0 };
    }
    const R = surfaceRadius(th, p.y), f = d - R;
    if (f >= pad + 0.05) return null;
    surfaceNormal(th, p.y, _n);
    const cosang = Math.max(0.06, (_n.x * Math.cos(th) + _n.z * Math.sin(th)));
    const dist = f * cosang;
    if (dist >= pad + 0.05) return null;
    const push = Math.max(0, pad - dist);
    p.x += _n.x * push; p.y += _n.y * push; p.z += _n.z * push;
    return { push, nx: _n.x, ny: _n.y, nz: _n.z };
  }
  // 걷는 바닥(선반·정상)의 높이. 없으면 -Infinity
  function groundAt(x, z, yFeet) {
    const d = Math.hypot(x, z), th = Math.atan2(z, x);
    let g = -Infinity;
    if (yFeet < BASE + 0.6) g = BASE;   // 협곡 바닥
    if (shelfTop(th, d) && yFeet > SHELF.yt - 0.6) g = Math.max(g, SHELF.yt);
    if (d < baseRadius(SUMMIT) + bump(th, SUMMIT) && yFeet > SUMMIT - 0.6) g = Math.max(g, SUMMIT);
    return g;
  }

  // ── 색 ────────────────────────────────────────────
  const cA = new THREE.Color(0xc2b29a), cB = new THREE.Color(0x8a7966), cC = new THREE.Color(0x46403a);
  const cG = new THREE.Color(0x4f7234), cG2 = new THREE.Color(0x8fa04c), cTop = new THREE.Color(0x6b7a3e);
  const tmpC = new THREE.Color();
  function vertexColor(th, y, ny, b, out, r) {
    const px = Math.cos(th) * 7.5, pz = Math.sin(th) * 7.5;
    const strata = 0.5 + 0.5 * Math.sin(y * 0.9 + 2.0 * N.noise3(px * 0.1, y * 0.03, pz * 0.1));
    out.copy(cA).lerp(cB, strata * 0.8);
    out.lerp(cC, smooth(-0.06, -0.3, b) * 0.75);                      // 패인 틈은 어둡게
    const wx = Math.cos(th) * (r || 7.5), wz = Math.sin(th) * (r || 7.5);
    const moss = smooth(0.35, 0.8, ny) * smooth(-0.25, 0.45, N.noise3(wx * 0.9, y * 0.9, wz * 0.9));
    tmpC.copy(cG).lerp(cG2, 0.5 + 0.5 * N.noise3(px * 2, y * 2, pz * 2));
    out.lerp(tmpC, moss);
    out.lerp(cC, smooth(-30, -120, y) * 0.35);                        // 아래로 갈수록 그늘
    return out;
  }

  // ── 본 기둥 지오메트리 ────────────────────────────
  function buildPillar() {
    const ys = [];
    for (let y = BASE - 2; y < -92; y += 6) ys.push(y);   // 구름 아래 협곡 바닥까지 (줄이 끊겨 떨어질 때만 보인다)
    for (let y = -92; y < -30; y += 3) ys.push(y);
    for (let y = -30; y < -3; y += 0.6) ys.push(y);
    for (let y = -3; y <= SUMMIT + 1e-6; y += 0.3) ys.push(y);
    if (ys[ys.length - 1] < SUMMIT) ys.push(SUMMIT);
    for (let k = 1; k <= 6; k++) ys.push(SHELF.yt + k * 0.025, SHELF.yt - k * 0.05);
    ys.sort((a, b) => a - b);
    const rows = ys.length, cols = RADIAL_SEG + 1;
    const R = new Float32Array(rows * cols), Bm = new Float32Array(rows * cols);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const th = (i / RADIAL_SEG) * Math.PI * 2, b = bump(th, ys[j]);
      Bm[j * cols + i] = b; R[j * cols + i] = surfaceRadius(th, ys[j]);
    }
    const pos = [], col = [], nrm = [], uv = [];
    const c = new THREE.Color(), n = new THREE.Vector3();
    for (let j = 0; j < rows; j++) {
      const y = ys[j], jm = Math.max(0, j - 1), jp = Math.min(rows - 1, j + 1), dy = Math.max(1e-3, ys[jp] - ys[jm]);
      for (let i = 0; i < cols; i++) {
        const th = (i / RADIAL_SEG) * Math.PI * 2, r = R[j * cols + i];
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r); uv.push(i / RADIAL_SEG * 11, (y + Math.max(0, r - baseRadius(y) - 0.6)) / 4.4);   // 윗면(선반·정상)은 바깥으로 갈수록 v 가 늘어 무늬가 안 늘어진다
        const im = (i - 1 + RADIAL_SEG) % RADIAL_SEG, ip = (i + 1) % RADIAL_SEG;
        const dRdy = (R[jp * cols + i] - R[jm * cols + i]) / dy;
        const dRdth = (R[j * cols + ip] - R[j * cols + im]) / (2 * Math.PI * 2 / RADIAL_SEG);
        const cs = Math.cos(th), sn = Math.sin(th);
        n.set(cs + (dRdth / Math.max(0.5, r)) * sn, -dRdy, sn - (dRdth / Math.max(0.5, r)) * cs).normalize();
        nrm.push(n.x, n.y, n.z);
        vertexColor(th, y, n.y, Bm[j * cols + i], c, r);
        if (Math.abs(y - SHELF.yt) < 0.03 && shelfW(th) > 0.3) c.lerp(cTop, 0.35);
        col.push(c.r, c.g, c.b);
      }
    }
    const idx = [];
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < RADIAL_SEG; i++) { const a = j * cols + i, b = a + 1, c2 = a + cols, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const capC = pos.length / 3; pos.push(0, SUMMIT, 0); nrm.push(0, 1, 0); col.push(cTop.r, cTop.g, cTop.b); uv.push(0, 0);
    const last = (rows - 1) * cols;
    for (let i = 0; i < RADIAL_SEG; i++) idx.push(last + i + 1, last + i, capC);
    for (let i = 0; i < cols; i++) { const q = (last + i) * 3; col[q] = cTop.r * 0.9; col[q + 1] = cTop.g * 0.9; col[q + 2] = cTop.b * 0.9; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeBoundingSphere();
    return g;
  }

  // ── 먼 석주들 (같은 말로, 거칠게) ─────────────────
  function buildDistantPillar(seed, height, radius, bottom, flat) {
    const rr = NOISE.makeRng(seed), off = seed * 0.37;
    const rows = Math.max(6, Math.floor((height - bottom) / 2.6)), SEG2 = 36, cols = SEG2 + 1;
    const pos = [], col = [], idx = [], uv = [], c = new THREE.Color();
    const terr = []; { let y = bottom + 20 + rr() * 30; while (y < height - 10) { terr.push({ yt: y, w: 0.6 + rr() * 2 }); y += 25 + rr() * 30; } }
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, y = bottom + t * (height - bottom);
      let R = radius * (1 + 0.25 * Math.sin(y * 0.03 + off) + 0.18 * N.noise3(off, y * 0.05, 3.3));
      if (y < bottom + 40) R += (bottom + 40 - y) * 0.12;
      for (let q = 0; q < terr.length; q++) R += terr[q].w * smooth(terr[q].yt - 3, terr[q].yt - 1.5, y) * (1 - smooth(terr[q].yt, terr[q].yt + 0.6, y));
      if (!flat && t > 0.94) R *= 1 - (t - 0.94) / 0.06 * 0.85;
      if (flat && t > 0.97) R *= 1 - (t - 0.97) / 0.03 * 0.12;
      for (let i = 0; i < cols; i++) {
        const th = (i / SEG2) * Math.PI * 2, px = Math.cos(th) * 7.5 + off, pz = Math.sin(th) * 7.5;
        const r = R + 0.2 * radius * N.fbm3(px * 0.22, y * 0.12, pz * 0.22, 3, 2, 0.5) + 0.05 * radius * N.noise3(px * 0.9, y * 0.5, pz * 0.9);
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r); uv.push(i / SEG2 * Math.max(3, Math.round(radius * 1.2)), y / 4.4);
        c.copy(cA).lerp(cB, (0.5 + 0.5 * Math.sin(y * 0.8 + off)) * 0.8);
        c.lerp(cG, smooth(0.2, 0.9, N.noise3(px * 0.6, y * 0.6, pz * 0.6)) * 0.55);
        c.lerp(cC, smooth(-30, -150, y) * 0.45);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < SEG2; i++) { const a = j * cols + i, b = a + 1, c2 = a + cols, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    const capI = pos.length / 3; pos.push(0, height, 0); col.push(cG.r, cG.g, cG.b); uv.push(0, 0);
    const lr = rows * cols; for (let i = 0; i < SEG2; i++) idx.push(lr + i + 1, lr + i, capI);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  // 광선 → 표면 교점 (행진 + 이분). 못 맞히면 null
  const _rp = new THREE.Vector3();
  function raycast(origin, dir, maxT, out) {
    let t0 = 0, hit = -1;
    const inside = (t) => { _rp.copy(dir).multiplyScalar(t).add(origin); const d = Math.hypot(_rp.x, _rp.z); if (_rp.y > SUMMIT) return false; return d < surfaceRadius(Math.atan2(_rp.z, _rp.x), _rp.y); };
    for (let t = 0.15; t < maxT; t += 0.2) { if (inside(t)) { hit = t; break; } t0 = t; }
    if (hit < 0) return null;
    let a = t0, b = hit;
    for (let i = 0; i < 7; i++) { const m = (a + b) * 0.5; if (inside(m)) b = m; else a = m; }
    out = out || new THREE.Vector3(); return out.copy(dir).multiplyScalar(a).add(origin);
  }
  window.TERRAIN = { BASE, SEG, RISE, RREF, NSEG, Y0, TH0, DTH, SUMMIT, SHELF, smooth, wrap, shelfW, baseRadius, bump, surfaceRadius, surfacePoint, surfaceNormal, collidePoint, groundAt, buildPillar, buildDistantPillar, raycast };
})();
