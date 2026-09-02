// 석주 — 반지름 함수 하나로 모양·충돌·홀드 배치를 전부 결정한다
(function () {
  const N = NOISE.makeNoise(20260902);
  const rng = NOISE.makeRng(9127);

  const SUMMIT = 250;   // 정상(집) 높이 m
  const BASE = -90;     // 협곡 바닥
  const RADIAL_SEG = 84;

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ── 테라스(선반) 목록 ─────────────────────────────
  // 시작 선반 + 25~45m 마다 하나. 위쪽 가장자리는 날카롭게(설 수 있게), 아래쪽은 완만하게(오버행)
  const terraces = [{ yb: -3.0, yt: 0.0, w: 3.6, soft: 2.5 }];
  {
    let y = 28 + rng() * 10;
    while (y < SUMMIT - 12) {
      terraces.push({ yb: y - (0.8 + rng() * 1.2), yt: y, w: 0.7 + rng() * 1.5, soft: 1.2 + rng() * 2.0 });
      y += 24 + rng() * 22;
    }
  }
  // 불룩한 배(오버행 구간) — 위로 갈수록 자주
  const bulges = [];
  {
    let y = 60;
    while (y < SUMMIT - 20) {
      if (rng() < 0.35 + y / SUMMIT * 0.5) bulges.push({ y: y, h: 3 + rng() * 4, w: 0.9 + rng() * 1.1 });
      y += 18 + rng() * 20;
    }
  }

  function baseRadius(y) {
    let r = 6.0 + 1.3 * Math.sin(y * 0.045 + 1.0) + 1.0 * N.noise3(0.37, y * 0.09, 5.1);
    for (let i = 0; i < terraces.length; i++) {
      const t = terraces[i];
      r += t.w * smooth(t.yb - t.soft, t.yb, y) * (1 - smooth(t.yt, t.yt + 0.2, y));
    }
    for (let i = 0; i < bulges.length; i++) {
      const b = bulges[i];
      const d = (y - b.y) / b.h;
      r += b.w * Math.max(0, 1 - d * d) * (1 - Math.abs(d));
    }
    // 밑동은 바닥까지 벌어진다
    if (y < -3) r += (-3 - y) * 0.16;
    // 정상 근처는 매끈하게 좁힌다
    if (y > SUMMIT - 8) r += smooth(SUMMIT - 8, SUMMIT - 1, y) * 3.2;   // 정상은 넓은 마당
    return r;
  }

  // 표면 요철 (각도·높이로만 정해지는 값) — 지오메트리와 충돌이 같은 값을 쓴다
  function bump(th, y) {
    const px = Math.cos(th) * 7.5, pz = Math.sin(th) * 7.5;
    let d = 0.42 * N.fbm3(px * 0.33, y * 0.33, pz * 0.33, 3, 2.1, 0.5);
    d += 0.09 * N.noise3(px * 1.7, y * 1.7, pz * 1.7);
    // 사암 지층 줄무늬
    d += 0.07 * Math.sin(y * 2.4 + 1.5 * N.noise3(px * 0.15, y * 0.05, pz * 0.15));
    return d;
  }
  function surfaceRadius(th, y) { return baseRadius(y) + bump(th, y); }

  // 표면 위 점 (off 만큼 바깥)
  function surfacePoint(th, y, off, out) {
    const r = surfaceRadius(th, y) + (off || 0);
    out = out || new THREE.Vector3();
    out.set(Math.cos(th) * r, y, Math.sin(th) * r);
    return out;
  }
  // 표면 법선 (수치 미분)
  function surfaceNormal(th, y, out) {
    const e = 0.06;
    const f0 = surfaceRadius(th, y);
    const dRdy = (surfaceRadius(th, y + e) - f0) / e;
    const dRdth = (surfaceRadius(th + e, y) - f0) / e;
    const c = Math.cos(th), s = Math.sin(th);
    const r = Math.max(0.5, f0);
    out = out || new THREE.Vector3();
    out.set(c + (dRdth / r) * s, -dRdy, s - (dRdth / r) * c).normalize();
    return out;
  }

  // ── 충돌: 점을 바위 밖으로 밀어낸다. 접촉 없으면 null ─────
  const _n = new THREE.Vector3();
  function collidePoint(p, pad) {
    // 정상 뚜껑
    if (p.y > SUMMIT - 0.25) {
      const dTop = Math.hypot(p.x, p.z);
      const rTop = baseRadius(SUMMIT) + 0.2;
      if (dTop < rTop) {
        if (p.y < SUMMIT + pad + 0.05) { const push = Math.max(0, SUMMIT + pad - p.y); p.y += push; return { push, nx: 0, ny: 1, nz: 0 }; }
        return null;   // 뚜껑 위 공중 — 옆면 판정은 하지 않는다
      }
      if (p.y > SUMMIT + 1) return null;
    }
    if (p.y < BASE + pad) { const push = BASE + pad - p.y; p.y = BASE + pad; return { push, nx: 0, ny: 1, nz: 0 }; }
    const d = Math.hypot(p.x, p.z);
    const th = Math.atan2(p.z, p.x);
    // 선반 윗면: 평평한 고리 콜라이더 (반지름 함수만으로는 수평면을 제대로 못 잡는다)
    for (let i = 0; i < terraces.length; i++) {
      const t = terraces[i];
      if (p.y < t.yt - 0.3 || p.y > t.yt + 0.2 + pad + 0.05) continue;
      const b = bump(th, t.yt + 0.1);
      const inner = baseRadius(t.yt + 0.25) + b, outer = inner + t.w;
      if (d > outer + 0.02 || d < inner - 0.6) continue;
      const frac = Math.min(1, Math.max(0, (d - inner) / t.w));
      const ySurf = t.yt + 0.2 * (1 - frac);
      if (p.y < ySurf + pad + 0.05) {
        const push = Math.max(0, ySurf + pad - p.y);
        p.y += push;
        return { push, nx: 0, ny: 1, nz: 0 };
      }
    }
    const R = surfaceRadius(th, p.y);
    const f = d - R;
    if (f >= pad + 0.05) return null;
    surfaceNormal(th, p.y, _n);
    // 경사면 보정: 실제 거리 ≈ f * (radial·n)
    const cosang = Math.max(0.06, (_n.x * Math.cos(th) + _n.z * Math.sin(th)));
    const dist = f * cosang;
    if (dist >= pad + 0.05) return null;
    const push = Math.max(0, pad - dist);
    p.x += _n.x * push; p.y += _n.y * push; p.z += _n.z * push;
    return { push, nx: _n.x, ny: _n.y, nz: _n.z };
  }

  // ── 색 ────────────────────────────────────────────
  const cA = new THREE.Color(0xb59a80); // 사암 밝은
  const cB = new THREE.Color(0x7d6553); // 사암 어두운
  const cC = new THREE.Color(0x4b403a); // 틈
  const cG = new THREE.Color(0x587a3a); // 이끼·관목
  const cG2 = new THREE.Color(0x8fa04c);
  const tmpC = new THREE.Color();
  function vertexColor(th, y, ny, b, out, r) {
    const px = Math.cos(th) * 7.5, pz = Math.sin(th) * 7.5;
    const strata = 0.5 + 0.5 * Math.sin(y * 0.9 + 2.0 * N.noise3(px * 0.1, y * 0.03, pz * 0.1));
    out.copy(cA).lerp(cB, strata * 0.8);
    const crev = smooth(-0.08, -0.38, b);
    out.lerp(cC, crev * 0.75);
    const wx = Math.cos(th) * (r || 7.5), wz = Math.sin(th) * (r || 7.5);
    const mossN = N.noise3(wx * 0.9, y * 0.9, wz * 0.9);
    const moss = smooth(0.35, 0.8, ny) * smooth(-0.25, 0.45, mossN);
    tmpC.copy(cG).lerp(cG2, 0.5 + 0.5 * N.noise3(px * 2, y * 2, pz * 2));
    out.lerp(tmpC, moss);
    const hi = 1 + 0.10 * smooth(120, 250, y);
    out.multiplyScalar(hi);
    return out;
  }

  // ── 본 기둥 지오메트리 ────────────────────────────
  function buildPillar() {
    const ys = [];
    for (let y = BASE; y < -8; y += 1.5) ys.push(y);
    for (let y = -8; y <= SUMMIT + 1e-6; y += 0.34) ys.push(y);
    if (ys[ys.length - 1] < SUMMIT) ys.push(SUMMIT);
    for (const t of terraces) for (let k = 1; k <= 7; k++) ys.push(t.yt + k * 0.03);
    ys.sort((a, b) => a - b);
    const rows = ys.length, cols = RADIAL_SEG + 1;
    // 1) 반지름·요철 격자
    const R = new Float32Array(rows * cols), Bm = new Float32Array(rows * cols);
    for (let j = 0; j < rows; j++) { const base = baseRadius(ys[j]); for (let i = 0; i < cols; i++) { const th = (i / RADIAL_SEG) * Math.PI * 2; const b = bump(th, ys[j]); Bm[j * cols + i] = b; R[j * cols + i] = base + b; } }
    // 2) 정점·법선(격자 차분)·색
    const pos = [], col = [], nrm = [];
    const c = new THREE.Color(), n = new THREE.Vector3();
    for (let j = 0; j < rows; j++) {
      const y = ys[j];
      const jm = Math.max(0, j - 1), jp = Math.min(rows - 1, j + 1);
      const dy = Math.max(1e-3, ys[jp] - ys[jm]);
      for (let i = 0; i < cols; i++) {
        const th = (i / RADIAL_SEG) * Math.PI * 2;
        const r = R[j * cols + i];
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
        const im = (i - 1 + RADIAL_SEG) % RADIAL_SEG, ip = (i + 1) % RADIAL_SEG;
        const dRdy = (R[jp * cols + i] - R[jm * cols + i]) / dy;
        const dRdth = (R[j * cols + ip] - R[j * cols + im]) / (2 * Math.PI * 2 / RADIAL_SEG);
        const cs = Math.cos(th), sn = Math.sin(th);
        n.set(cs + (dRdth / Math.max(0.5, r)) * sn, -dRdy, sn - (dRdth / Math.max(0.5, r)) * cs).normalize();
        nrm.push(n.x, n.y, n.z);
        vertexColor(th, y, n.y, Bm[j * cols + i], c, r);
        col.push(c.r, c.g, c.b);
      }
    }
    const idx = [];
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < RADIAL_SEG; i++) {
      const a = j * cols + i, b = a + 1, c2 = a + cols, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
    }
    const capC = pos.length / 3;
    pos.push(0, SUMMIT, 0); nrm.push(0, 1, 0);
    const topCol = new THREE.Color(0x5a6b36); col.push(topCol.r, topCol.g, topCol.b);
    const lastRow = (rows - 1) * cols;
    for (let i = 0; i < RADIAL_SEG; i++) idx.push(lastRow + i + 1, lastRow + i, capC);
    for (let i = 0; i < cols; i++) { const q = (lastRow + i) * 3; col[q] = topCol.r * 0.9; col[q + 1] = topCol.g * 0.9; col[q + 2] = topCol.b * 0.9; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }

  // ── 먼 기둥들 (같은 언어로, 거칠게) ─────────────────
  function buildDistantPillar(seed, height, radius, bottom, flat) {
    const rr = NOISE.makeRng(seed);
    const off = seed * 0.37;
    const rows = Math.max(6, Math.floor((height - bottom) / 2.2));
    const SEG = 30, cols = SEG + 1;
    const pos = [], col = [], idx = [];
    const c = new THREE.Color();
    const terr = []; { let y = bottom + 20 + rr() * 30; while (y < height - 10) { terr.push({ yt: y, w: 0.6 + rr() * 2 }); y += 25 + rr() * 30; } }
    for (let j = 0; j <= rows; j++) {
      const t = j / rows;
      const y = bottom + t * (height - bottom);
      let R = radius * (1 + 0.25 * Math.sin(y * 0.03 + off) + 0.18 * N.noise3(off, y * 0.05, 3.3));
      if (y < bottom + 25) R += (bottom + 25 - y) * 0.12;
      for (let q = 0; q < terr.length; q++) R += terr[q].w * smooth(terr[q].yt - 3, terr[q].yt - 1.5, y) * (1 - smooth(terr[q].yt, terr[q].yt + 0.6, y));
      if (!flat && t > 0.94) R *= 1 - (t - 0.94) / 0.06 * 0.85;
      if (flat && t > 0.97) R *= 1 - (t - 0.97) / 0.03 * 0.12;
      for (let i = 0; i < cols; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const px = Math.cos(th) * 7.5 + off, pz = Math.sin(th) * 7.5;
        const b = 0.36 * radius * N.fbm3(px * 0.3, y * 0.3, pz * 0.3, 2, 2, 0.5);
        const r = R + b;
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
        const strata = 0.5 + 0.5 * Math.sin(y * 0.8 + off);
        c.copy(cA).lerp(cB, strata * 0.8);
        const moss = smooth(0.2, 0.9, N.noise3(px * 0.6, y * 0.6, pz * 0.6)) * 0.55;
        c.lerp(cG, moss);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < SEG; i++) {
      const a = j * cols + i, b = a + 1, c2 = a + cols, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
    }
    const capI = pos.length / 3; pos.push(0, height, 0); col.push(cG.r, cG.g, cG.b);
    const lr = rows * cols; for (let i = 0; i < SEG; i++) idx.push(lr + i + 1, lr + i, capI);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // 광선 → 표면 교점 (행진 + 이분). 못 맞히면 null
  const _rp = new THREE.Vector3();
  function raycast(origin, dir, maxT, out) {
    let t0 = 0, hit = -1;
    const inside = (t) => { _rp.copy(dir).multiplyScalar(t).add(origin); const d = Math.hypot(_rp.x, _rp.z); if (_rp.y > SUMMIT) return d < baseRadius(SUMMIT) && _rp.y < SUMMIT + 0.05; return d < surfaceRadius(Math.atan2(_rp.z, _rp.x), _rp.y); };
    for (let t = 0.3; t < maxT; t += 0.25) { if (inside(t)) { hit = t; break; } t0 = t; }
    if (hit < 0) return null;
    let a = t0, b = hit;
    for (let i = 0; i < 7; i++) { const m = (a + b) * 0.5; if (inside(m)) b = m; else a = m; }
    out = out || new THREE.Vector3();
    out.copy(dir).multiplyScalar(a).add(origin);
    return out;
  }
  window.TERRAIN = { raycast, SUMMIT, BASE, terraces, bulges, baseRadius, surfaceRadius, surfacePoint, surfaceNormal, collidePoint, buildPillar, buildDistantPillar, smooth };
})();
