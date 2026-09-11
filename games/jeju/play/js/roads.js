// 도로망 — 일주도로(해안 안쪽 고리), 중산간도로, 산을 넘는 큰길들, 도시·마을 격자. 그래프(노드·간선)와 도로 메시
(function () {
  const I = ISLAND, H = I.H, smooth = I.smooth;
  const R = { polylines: [], nodes: [], edges: [], towns: [], lightNodes: [] };

  function resample(pts, step, closed) {
    const out = []; let acc = 0;
    const n = closed ? pts.length : pts.length - 1;
    out.push([pts[0][0], pts[0][1]]);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let t = (step - acc) / L;
      while (t <= 1) { out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); t += step / L; }
      acc = (acc + L) % step;
    }
    if (!closed) { const last = pts[pts.length - 1], o = out[out.length - 1]; if (Math.hypot(last[0] - o[0], last[1] - o[1]) > step * 0.3) out.push([last[0], last[1]]); else { o[0] = last[0]; o[1] = last[1]; } }
    return out;
  }
  function smoothPts(pts, closed, iter) {
    for (let k = 0; k < (iter || 1); k++) {
      const n = pts.length, out = [];
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) { out.push(pts[i]); continue; }
        const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
        out.push([(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4]);
      }
      pts = out;
    }
    return pts;
  }
  function catmull(wps, step) {
    const out = [];
    for (let i = 0; i < wps.length - 1; i++) {
      const p0 = wps[Math.max(0, i - 1)], p1 = wps[i], p2 = wps[i + 1], p3 = wps[Math.min(wps.length - 1, i + 2)];
      const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.round(L / step));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    out.push(wps[wps.length - 1]);
    return out;
  }
  const g = (lon, lat) => { const p = I.geo(lon, lat); return [p.x, p.z]; };

  // 점이 바다·물가(해안 거리 minD 안)면 뭍 쪽으로 민다 — 해안선을 따라 만든 길이 만(灣)·곶에서 바다로 빠지는 걸 막는다
  // 딸린 섬(가파도·비양도·차귀도…)은 길에겐 바다다 — 다리가 없다. 가장 가까운 뭍 해안점.
  function coastPt(x, z) { let b = null, bd = 1e18; for (const c of I.coast) { const d = (c[0] - x) * (c[0] - x) + (c[1] - z) * (c[1] - z); if (d < bd) { bd = d; b = c; } } return b; }
  function inland(p, minD) {
    for (let pass = 0; pass < 3; pass++) {
      for (let k = 0; k < 40 && I.coastDist(p[0], p[1]) < minD; k++) {
        const e = 6, gx = I.coastDist(p[0] + e, p[1]) - I.coastDist(p[0] - e, p[1]), gz = I.coastDist(p[0], p[1] + e) - I.coastDist(p[0], p[1] - e), L = Math.hypot(gx, gz) || 1;
        p[0] += gx / L * 6; p[1] += gz / L * 6;
      }
      // 바다에 빠진 점은 '가장 가까운 땅'으로 밀리는데, 곁에 섬이 있으면 섬으로 올라타 버린다.
      // 그러면 일주도로가 바다를 건너 가파도로 들어간다 (사장님 2026-09-11 "급매를 바다를 가로질러가야되냐")
      if (I.coastDist(p[0], p[1]) >= 0 && !I.inIslet(p[0], p[1])) break;
      const c = coastPt(p[0], p[1]); if (!c) break;
      p[0] = c[0]; p[1] = c[1];
    }
    return p;
  }
  // 길을 구불구불하게 — 진행 방향과 직각으로 느린 물결을 준다.
  // 자로 쟰 듯한 길은 제주 같지 않다 (사장님 2026-09-11 "도로는 구불구불해야 제맛이지")
  // 고리(closed)는 이음매가 틀어지지 않게 파장을 둘레 길이에 딱 떨어지게 맞춘다.
  function wiggle(pts, amp, wave, closed, seed) {
    const n = pts.length; if (n < 4) return pts;
    const cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    let total = cum[n - 1];
    if (closed) { total += Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]); wave = total / Math.max(1, Math.round(total / wave)); }
    const out = [];
    for (let i = 0; i < n; i++) {
      const a2 = pts[(i + n - 1) % n], b2 = pts[(i + 1) % n];
      const dx = b2[0] - a2[0], dz = b2[1] - a2[1], L = Math.hypot(dx, dz) || 1;
      const nx = dz / L, nz = -dx / L;
      const sdist = cum[i];
      let k = Math.sin(sdist / wave * 6.2832 + seed) * 0.72 + Math.sin(sdist / (wave * 0.41) * 6.2832 + seed * 2.7) * 0.28;
      let w = amp * k;
      if (!closed) { const t = i / (n - 1); w *= Math.sin(Math.PI * t); }   // 양 끝은 안 흔든다(다른 길과 이어지는 자리)
      out.push([pts[i][0] + nx * w, pts[i][1] + nz * w]);
    }
    return out;
  }
  // 해안선과 같은 거리를 유지하게 당긴다 — 만·곶까지 해안을 따라가는 일주도로를 만든다.
  // 예전엔 6번 문질러 만 안쪽이 통째 잘려 바다에서 멀어졌다 (사장님 2026-09-11 "해안선 따라 도로를 제대로 다 깔아라")
  function hugCoast(pts, want, iter) {
    for (let k = 0; k < (iter || 4); k++) {
      for (const q of pts) {
        const d = I.coastDist(q[0], q[1]); const err = d - want;
        if (Math.abs(err) < 3) continue;
        const e = 6, gx = I.coastDist(q[0] + e, q[1]) - I.coastDist(q[0] - e, q[1]), gz = I.coastDist(q[0], q[1] + e) - I.coastDist(q[0], q[1] - e);
        const L = Math.hypot(gx, gz) || 1;
        const step = Math.max(-14, Math.min(14, -err * 0.6));
        q[0] += gx / L * step; q[1] += gz / L * step;
      }
    }
    return pts;
  }
  // 기울기 고르기 — 오르내리는 점을 양옆으로 조금씩 옮겨 등고선을 타게 한다.
  // 목표는 이웃 두 점의 중간 높이라, 꾸준히 오르는 길(산을 넘는 큰길)은 그대로 두고 툰박툰박한 데만 펴다.
  // 절벽을 곱바로 기어오르던 길을 막는다 (사장님 2026-09-11 "도로 자체가 말이 안 되게 깔려있네")
  function easeGrade(pts, closed, iter, opt) {
    const o = opt || {}, drift = o.drift || 70, c0 = o.coastMin, c1 = o.coastMax;
    const orig = pts.map(q => [q[0], q[1]]);
    const n = pts.length;
    for (let k = 0; k < (iter || 10); k++) {
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) continue;
        const q = pts[i], a2 = pts[(i + n - 1) % n], b2 = pts[(i + 1) % n];
        const tgt = (H(a2[0], a2[1]) + H(b2[0], b2[1])) / 2, cur = H(q[0], q[1]);
        if (Math.abs(cur - tgt) < 1.2) continue;
        const dx = b2[0] - a2[0], dz = b2[1] - a2[1], L = Math.hypot(dx, dz) || 1;
        const nx = dz / L, nz = -dx / L, step = 10;
        let best = null, bd = Math.abs(cur - tgt);
        for (const sg of [1, -1]) {
          const x = q[0] + nx * step * sg, z = q[1] + nz * step * sg;
          if (Math.hypot(x - orig[i][0], z - orig[i][1]) > drift) continue;
          if (c0 != null || c1 != null) { const cd = I.coastDist(x, z); if (c0 != null && cd < c0) continue; if (c1 != null && cd > c1) continue; }
          const d2 = Math.abs(H(x, z) - tgt); if (d2 < bd) { bd = d2; best = [x, z]; }
        }
        if (best) { q[0] = best[0]; q[1] = best[1]; }
      }
    }
    return pts;
  }
  function build() {
    // ── 마을 격자 ──
    for (const t of I.TOWNS) {
      const w = t.cols * t.cell, d = t.rows * t.cell;
      const town = { id: t.id, big: !!t.big, x0: t.x - w / 2, z0: t.z - d / 2, cols: t.cols, rows: t.rows, cell: t.cell, road: t.big ? 12 : 10, mainRow: Math.floor(t.rows / 2), mainCol: t.big ? Math.floor(t.cols / 2) : -1, cx: t.x, cz: t.z, name: t.name };
      R.towns.push(town);
    }
    // ── 일주도로: 해안선 70m 안쪽 ──
    const coast = I.coast, n = coast.length;
    let ring = coast.map((p, i) => { const a = coast[(i + n - 1) % n], b = coast[(i + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [p[0] + dz / L * 70, p[1] - dx / L * 70]; });
    ring = smoothPts(ring, true, 2); ring = resample(ring, 30, true);          // 살짝만 문질러 만·곶을 살린다
    hugCoast(ring, 55, 5);                                                     // 해안에서 55m 줄로 나란히 붙인다
    ring = smoothPts(ring, true, 2); ring = resample(ring, 40, true);
    hugCoast(ring, 55, 3);
    easeGrade(ring, true, 26, { drift: 130, coastMin: 30, coastMax: 260 });     // 절벽은 피해 등고선을 탄다
    ring = wiggle(ring, 10, 320, true, 1.7); ring = smoothPts(ring, true, 1); ring = resample(ring, 40, true); ring.forEach(p => inland(p, 32));
    easeGrade(ring, true, 14, { drift: 70, coastMin: 34, coastMax: 280 }); ring = smoothPts(ring, true, 1);
    ring = resample(ring, 25, true); ring.forEach(p => inland(p, 36));   // 마지막에 다시 초초히 — 점 사이가 멀면 그 사이 직선이 해안을 물어 간선이 지워진다   // 마지막은 물가 밀어내기 — 문지르다 바다로 다시 들어가지 않게
    // 마을을 지날 땐 마을 가운데 줄로 (격자 노드에 맞춘다)
    for (const t of R.towns) {
      const zRow = t.z0 + t.mainRow * t.cell;
      const hw = t.cols * t.cell / 2 + 60;
      const idx = []; for (let i = 0; i < ring.length; i++) if (Math.abs(ring[i][0] - t.cx) < hw && Math.abs(ring[i][1] - t.cz) < t.rows * t.cell / 2 + 140) idx.push(i);
      if (idx.length < 2) continue;
      // 고리라 목록이 끊길 수 있다 — 이어진 덩어리 중 가장 긴 것만 바꿔 끼운다.
      // 예전엕 idx 첫째~끝을 통째로 잘라서, 마을이 이음매에 걸치면 일주도로 전체가 날아갔다 (2026-09-11)
      const runs = []; let cur = [idx[0]];
      for (let k = 1; k < idx.length; k++) { if (idx[k] === idx[k - 1] + 1) cur.push(idx[k]); else { runs.push(cur); cur = [idx[k]]; } }
      runs.push(cur);
      let run = runs[0]; for (const rr of runs) if (rr.length > run.length) run = rr;
      if (run.length < 2 || run.length > ring.length * 0.4) continue;   // 고리 반토막을 삼키려 들면 손대지 않는다
      const first = run[0], last = run[run.length - 1];
      // 마을 가운데 줄이 바다로 나가는 칸은 뺀다(한림·모슬포가 물 위로 길이 난다)
      const cols = [];
      for (let c = 0; c <= t.cols; c++) { const cxp = t.x0 + c * t.cell; if (I.coastDist(cxp, zRow) < 8 || H(cxp, zRow) < 1) continue; cols.push([cxp, zRow]); }
      if (cols.length < 2) continue;
      const dir = ring[last][0] > ring[first][0] ? 1 : -1; if (dir < 0) cols.reverse();
      ring.splice(first, last - first + 1, ...cols);
      t.onRing = true;
    }
    R.polylines.push({ pts: ring, type: 'ring', lanes: 1, w: 14, vmax: 20, closed: true });
    // ── 중산간도로: 해안선을 한라산 쪽으로 62% ──
    let mid = coast.map(p => [I.HC.x + (p[0] - I.HC.x) * 0.62, I.HC.z + (p[1] - I.HC.z) * 0.62]);
    mid = smoothPts(mid, true, 10); mid = resample(mid, 40, true); mid.forEach(p => inland(p, 30));
    mid = wiggle(mid, 22, 340, true, 4.1); mid = smoothPts(mid, true, 1); mid = resample(mid, 40, true); mid.forEach(p => inland(p, 30));
    easeGrade(mid, true, 26, { drift: 180 }); mid = smoothPts(mid, true, 1); mid = resample(mid, 25, true); mid.forEach(p => inland(p, 30));
    R.polylines.push({ pts: mid, type: 'mid', lanes: 1, w: 11, vmax: 16, closed: true });
    // ── 산을 넘는 큰길 ──
    const jeju = R.towns[0], sgp = R.towns[1];
    const jS = [jeju.x0 + jeju.mainCol * jeju.cell, jeju.z0 + jeju.rows * jeju.cell];   // 제주시 남쪽 끝
    const jW = [jeju.x0, jeju.z0 + jeju.mainRow * jeju.cell], jE = [jeju.x0 + jeju.cols * jeju.cell, jeju.z0 + jeju.mainRow * jeju.cell];
    const sN = [sgp.x0 + sgp.mainCol * sgp.cell, sgp.z0];
    const radials = [
      { name: '1100도로', wps: [jS, g(126.505, 33.44), g(126.49, 33.39), g(126.462, 33.358), g(126.44, 33.30), g(126.43, 33.27)], vmax: 20 },
      { name: '5.16도로', wps: [jS, g(126.56, 33.44), g(126.619, 33.385), g(126.59, 33.32), sN], vmax: 22 },
      { name: '평화로', wps: [jW, g(126.45, 33.46), g(126.40, 33.42), g(126.358, 33.372), g(126.30, 33.31), g(126.26, 33.24)], vmax: 24 },
      { name: '번영로', wps: [jE, g(126.62, 33.47), g(126.70, 33.43), g(126.76, 33.38), g(126.82, 33.345)], vmax: 22 },
      { name: '서부산업', wps: [g(126.265, 33.41), g(126.29, 33.36), g(126.29, 33.305), g(126.33, 33.26)], vmax: 18 },
      { name: '비자림로', wps: [g(126.755, 33.55), g(126.78, 33.50), g(126.81, 33.47), g(126.80, 33.40), g(126.82, 33.35)], vmax: 18 },
      { name: '남조로', wps: [g(126.64, 33.53), g(126.66, 33.46), g(126.68, 33.40), g(126.71, 33.33), g(126.715, 33.29)], vmax: 18 },
    ];
    radials.forEach((r, ri) => { let pts = resample(catmull(r.wps, 20), 40, false); pts = wiggle(pts, 20, 380, false, 0.9 + ri * 1.3); pts = smoothPts(pts, false, 1); pts = resample(pts, 40, false); pts.forEach(p => inland(p, 24)); easeGrade(pts, false, 26, { drift: 150 }); pts = smoothPts(pts, false, 1); pts = resample(pts, 25, false); pts.forEach(p => inland(p, 24)); R.polylines.push({ pts, type: 'radial', lanes: 1, w: 12, vmax: r.vmax, closed: false, name: r.name }); });
    // 해안·명소 진입로: 명소가 도로에서 멀면 가장 가까운 도로점에서 짧은 길
    // (그래프를 만든 뒤 처리)

    // ── 그래프 ──
    const nodeHash = new Map(); const CELL = 12;
    const key = (x, z) => Math.floor(x / CELL) * 100003 + Math.floor(z / CELL);
    function nodeAt(x, z, snap) {
      const i0 = Math.floor(x / CELL), j0 = Math.floor(z / CELL);
      let best = null, bd = snap;
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const arr = nodeHash.get(i * 100003 + j); if (!arr) continue; for (const nd of arr) { const d = Math.hypot(nd.x - x, nd.z - z); if (d < bd) { bd = d; best = nd; } } }
      if (best) return best;
      const nd = { x, z, out: [], id: R.nodes.length, light: false, town: null, cross: null }; R.nodes.push(nd);
      const k = key(x, z); let arr = nodeHash.get(k); if (!arr) { arr = []; nodeHash.set(k, arr); } arr.push(nd);
      return nd;
    }
    function addEdge(a, b, pl) {
      if (a === b) return;
      for (const e of a.out) if (e.b === b) return;
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
      const e = { a, b, dir: { x: dx / len, z: dz / len }, right: { x: -dz / len, z: dx / len }, len, lanes: pl.lanes, w: pl.w, vmax: pl.vmax, type: pl.type, ns: Math.abs(dx) < Math.abs(dz) };
      a.out.push(e); R.edges.push(e);
    }
    // 격자 먼저 (노드 정확)
    for (const t of R.towns) {
      t.nodes = [];
      for (let c = 0; c <= t.cols; c++) for (let r = 0; r <= t.rows; r++) { const nd = nodeAt(t.x0 + c * t.cell, t.z0 + r * t.cell, 6); nd.town = t; nd.gc = c; nd.gr = r; t.nodes.push(nd); }
      const at = (c, r) => t.nodes[c * (t.rows + 1) + r];
      for (let c = 0; c <= t.cols; c++) for (let r = 0; r <= t.rows; r++) {
        const nd = at(c, r);
        if (c < t.cols) { const m = at(c + 1, r); const main = r === t.mainRow && t.big; const pl = { lanes: main ? 2 : 1, w: main ? 22 : t.road, vmax: main ? 14 : 11, type: t.big ? 'city' : 'town' }; addEdge(nd, m, pl); addEdge(m, nd, pl); }
        if (r < t.rows) { const m = at(c, r + 1); const main = c === t.mainCol && t.big; const pl = { lanes: main ? 2 : 1, w: main ? 22 : t.road, vmax: main ? 14 : 11, type: t.big ? 'city' : 'town' }; addEdge(nd, m, pl); addEdge(m, nd, pl); }
      }
    }
    // 폴리라인 → 노드 (마을 안에선 격자 노드에 붙는다)
    for (const pl of R.polylines) {
      const nds = pl.pts.map(p => nodeAt(p[0], p[1], 14));
      pl.nodes = nds;
      const n = nds.length, m = pl.closed ? n : n - 1;
      for (let i = 0; i < m; i++) { const a = nds[i], b = nds[(i + 1) % n]; addEdge(a, b, pl); addEdge(b, a, pl); }
    }
    // 교차: 큰길이 중산간·일주도로를 가로지르는 곳에 노드를 넣는다
    const closedPls = R.polylines.filter(p => p.closed);
    for (const pl of R.polylines) {
      if (pl.closed) continue;
      for (let i = 0; i < pl.nodes.length - 1; i++) {
        const a = pl.nodes[i], b = pl.nodes[i + 1];
        for (const cp of closedPls) {
          const nn = cp.nodes.length;
          for (let j = 0; j < nn; j++) {
            const c = cp.nodes[j], d = cp.nodes[(j + 1) % nn];
            if (a === c || a === d || b === c || b === d) continue;
            const den = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x); if (Math.abs(den) < 1e-6) continue;
            const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / den, u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / den;
            if (t <= 0.02 || t >= 0.98 || u <= 0.02 || u >= 0.98) continue;
            const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
            const X = nodeAt(x, z, 4); X.cross = true;
            // 간선 쪼개기
            splitEdge(a, b, X, pl); splitEdge(c, d, X, cp);
          }
        }
      }
    }
    function splitEdge(a, b, X, pl) {
      for (const [p, q] of [[a, b], [b, a]]) {
        const idx = p.out.findIndex(e => e.b === q); if (idx < 0) continue;
        const e = p.out[idx]; p.out.splice(idx, 1); R.edges.splice(R.edges.indexOf(e), 1);
        addEdge(p, X, e); addEdge(X, q, e);
      }
    }
    // 큰길 끝이 고리·격자에 안 닿았으면 가장 가까운 노드로 잇는다
    for (const pl of R.polylines) {
      if (pl.closed) continue;
      for (const end of [pl.nodes[0], pl.nodes[pl.nodes.length - 1]]) {
        if (end.out.length >= 2) continue;
        let best = null, bd = 120;
        for (const nd of R.nodes) { if (nd === end || nd.out.some(e => e.b === end)) continue; const d = Math.hypot(nd.x - end.x, nd.z - end.z); if (d < bd) { bd = d; best = nd; } }
        if (best) { addEdge(end, best, pl); addEdge(best, end, pl); }
      }
    }
    // 명소 진입로: 도로에서 60m 넘게 떨어진 육지 명소는 짧은 길로 잇는다
    R.access = [];
    for (const s of SPOTS.list) {
      if (s.islet || s.summit || s.kind === 'oreum') continue;
      if (I.coastDist(s.x, s.z) < 8) continue;
      let best = null, bd = 1e9;
      for (const nd of R.nodes) { const d = Math.hypot(nd.x - s.x, nd.z - s.z); if (d < bd) { bd = d; best = nd; } }
      if (!best || bd < 45 || bd > 900) continue;
      const pts = resample([[best.x, best.z], [s.x, s.z]], 40, false);
      const pl = { pts, type: 'access', lanes: 1, w: 8, vmax: 9, closed: false };
      const nds = pts.map((p, i) => i === 0 ? best : nodeAt(p[0], p[1], 6)); pl.nodes = nds;
      for (let i = 0; i < nds.length - 1; i++) { addEdge(nds[i], nds[i + 1], pl); addEdge(nds[i + 1], nds[i], pl); }
      R.polylines.push(pl); R.access.push(pl);
      s.roadEnd = nds[nds.length - 1];
    }
    // 물에 걸치는 간선 지우기: 간선을 따라 다섯 점 중 하나라도 해안 거리 6m 안이면 바다로 빠지는 길이다(마을 격자 끝·진입로 포함)
    const wetLine = (ax, az, bx, bz) => { for (let k = 0; k <= 4; k++) { const t = k / 4; if (I.coastDist(ax + (bx - ax) * t, az + (bz - az) * t) < 6) return true; } return false; };
    const wet = e => wetLine(e.a.x, e.a.z, e.b.x, e.b.z);
    const cut = [];
    R.edges = R.edges.filter(e => { if (wet(e)) { cut.push(e); return false; } return true; });
    let keep = new Set(R.edges); for (const nd of R.nodes) nd.out = nd.out.filter(e => keep.has(e));
    // 만(灣)을 가로지르는 칸은 지우지 말고 뭍으로 돌린다. 해안선을 밀어낼 때 만의 양쪽 점이 서로 반대편으로
    // 밀려서 그 사이 직선이 바다를 문다 — 지우면 길이 끊기고, 두면 네비가 바다를 건넌다
    // (사장님 2026-09-11 "급매를 바다를 가로질러가야되냐")
    (function detour() {
      const via = (ax, az, bx, bz, depth) => {
        if (!wetLine(ax, az, bx, bz)) return [];
        if (depth <= 0) return null;
        const m = inland([(ax + bx) / 2, (az + bz) / 2], 30);
        if (I.coastDist(m[0], m[1]) < 8) return null;
        const straight = Math.hypot(bx - ax, bz - az);
        if (Math.hypot(m[0] - ax, m[1] - az) + Math.hypot(bx - m[0], bz - m[1]) > straight * 2.6 + 160) return null;   // 너무 멀리 돌면 길이 아니라 흉터다
        const l = via(ax, az, m[0], m[1], depth - 1); if (!l) return null;
        const r = via(m[0], m[1], bx, bz, depth - 1); if (!r) return null;
        return l.concat([m], r);
      };
      const seen = new Set(); let fixed = 0;
      for (const ed of cut) {
        if (ed.type === 'city' || ed.type === 'town') continue;   // 마을 격자가 바다로 뻗은 칸은 그냥 없는 길이다
        const k = ed.a.id < ed.b.id ? ed.a.id + '_' + ed.b.id : ed.b.id + '_' + ed.a.id; if (seen.has(k)) continue; seen.add(k);
        if (I.coastDist(ed.a.x, ed.a.z) < 6 || I.coastDist(ed.b.x, ed.b.z) < 6) continue;   // 끝이 이미 물이면 살릴 수 없다
        const pts = via(ed.a.x, ed.a.z, ed.b.x, ed.b.z, 6);
        if (!pts || !pts.length) continue;
        const pl = { lanes: ed.lanes, w: ed.w, vmax: ed.vmax, type: ed.type };
        let prev = ed.a;
        for (const p of pts) { const nd = nodeAt(p[0], p[1], 6); addEdge(prev, nd, pl); addEdge(nd, prev, pl); prev = nd; }
        addEdge(prev, ed.b, pl); addEdge(ed.b, prev, pl);
        fixed++;
      }
      if (fixed) console.log('바다 건너던 길', fixed, '군데 뭍으로 돌림');
    })();
    // 물 간선을 지우다 도로망이 쌍갈래지면 길찾기가 끊긴다 — 지운 것 중 짧은 것부터 되살려 이어 붙인다 (사장님 2026-09-11)
    (function stitch() {
      const par = new Map();
      const find = n => { let r = n; while (par.get(r) !== r) r = par.get(r); while (par.get(n) !== r) { const nx = par.get(n); par.set(n, r); n = nx; } return r; };
      for (const nd of R.nodes) par.set(nd, nd);
      for (const ed of R.edges) { const x = find(ed.a), y = find(ed.b); if (x !== y) par.set(x, y); }
      const size = new Map();
      for (const nd of R.nodes) { if (!nd.out.length) continue; const r = find(nd); size.set(r, (size.get(r) || 0) + 1); }
      cut.sort((p1, p2) => p1.len - p2.len);
      let added = 0;
      for (const ed of cut) {
        if (!ed.a.out.length && !ed.b.out.length) continue;         // 양쪽 다 외따기면 쓸모없다
        const x = find(ed.a), y = find(ed.b); if (x === y) continue;
        // 바다에 홀로 떨어진 격자 귀퉁이까지 이어 주려다 물 위로 길을 놓는다 — 동네가 통째로 끊길 때만 잇는다
        // (사장님 2026-09-11 "급매를 바다를 가로질러가야되냐")
        if (Math.min(size.get(x) || 0, size.get(y) || 0) < 4) continue;
        par.set(x, y); size.set(y, (size.get(x) || 0) + (size.get(y) || 0));
        R.edges.push(ed); ed.a.out.push(ed); added++;
        const back = cut.find(o => o.a === ed.b && o.b === ed.a);
        if (back) { R.edges.push(back); back.a.out.push(back); }
      }
      if (added) console.log('도로망 이음', added, '군데');
    })();
    keep = new Set(R.edges);
    for (const s of SPOTS.list) if (s.roadEnd && !s.roadEnd.out.length) s.roadEnd = null;
    // 노드 성질: 차수, 신호등(큰 도시 격자 교차로), 진입 여유
    for (const nd of R.nodes) {
      nd.deg = nd.out.length;
      nd.light = !!(nd.town && nd.town.big && nd.deg >= 3 && I.coastDist(nd.x, nd.z) > 8);
      if (nd.light) R.lightNodes.push(nd);
    }
    for (const e of R.edges) {
      const ins = nd => {
        if (nd.deg <= 2 && !nd.cross) return 0;
        // 건너는 길 폭
        let cw = 0; for (const o of nd.out) if (o.b !== e.a && o.b !== e.b && Math.abs(o.dir.x * e.dir.x + o.dir.z * e.dir.z) < 0.7) cw = Math.max(cw, o.w);
        if (!cw) return 0;
        return cw / 2 + (nd.light ? 3.5 : 1.5);
      };
      e.inA = ins(e.a); e.inB = ins(e.b); e.L = Math.max(4, e.len - e.inA - e.inB);
    }
    // 간선 공간해시 (길 위 판정)
    R.ehash = new Map(); R.ECELL = 48;
    for (const e of R.edges) {
      const x0 = Math.min(e.a.x, e.b.x) - 12, x1 = Math.max(e.a.x, e.b.x) + 12, z0 = Math.min(e.a.z, e.b.z) - 12, z1 = Math.max(e.a.z, e.b.z) + 12;
      for (let i = Math.floor(x0 / R.ECELL); i <= Math.floor(x1 / R.ECELL); i++) for (let j = Math.floor(z0 / R.ECELL); j <= Math.floor(z1 / R.ECELL); j++) { const k = i * 100003 + j; let a = R.ehash.get(k); if (!a) { a = []; R.ehash.set(k, a); } a.push(e); }
    }
  }
  function edgeDist(e, x, z) {
    const dx = e.b.x - e.a.x, dz = e.b.z - e.a.z; let t = ((x - e.a.x) * dx + (z - e.a.z) * dz) / (dx * dx + dz * dz); t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(x - e.a.x - dx * t, z - e.a.z - dz * t);
  }
  function nearest(x, z) {
    const i0 = Math.floor(x / R.ECELL), j0 = Math.floor(z / R.ECELL); let best = null, bd = 1e9;
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) { const a = R.ehash.get(i * 100003 + j); if (!a) continue; for (const e of a) { const d = edgeDist(e, x, z) - e.w / 2; if (d < bd) { bd = d; best = e; } } }
    return { e: best, d: bd };
  }
  function onRoad(x, z) { const n = nearest(x, z); return n.e && n.d < 1.5; }
  // 그려진 띠(아스팔트·갓길·인도)의 실제 높이 — seg()/quadPts() 와 똑같이 12m 조각 네 귀퉁이 땅높이+yOff 를 두 삼각형으로 보간한다
  // (땅+0.2 같은 어림값은 비탈에서 그려진 인도와 어긋나 발이 뜨거나 묻힌다)
  function stripY(a, b, w, yOff, x, z, off) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
    const ax = a.x + nx * off, az = a.z + nz * off;
    const px = x - ax, pz = z - az, t = (px * ux + pz * uz) / L, sd = px * nx + pz * nz, hw = w / 2;
    if (t < 0 || t > 1 || Math.abs(sd) > hw) return null;
    const n = Math.max(1, Math.round(L / 12)), i = Math.min(n - 1, Math.floor(t * n)), t0 = i / n, t1 = (i + 1) / n;
    const c = (tt, sg) => H(ax + dx * tt + nx * hw * sg, az + dz * tt + nz * hw * sg) + yOff;
    const u = (t - t0) / (t1 - t0), v = (hw - sd) / w;   // 귀퉁이 P0(t0,+) P1(t0,-) P2(t1,+) P3(t1,-), 삼각형 (P0,P2,P1) (P1,P2,P3)
    const y0 = c(t0, 1), y1 = c(t0, -1), y2 = c(t1, 1), y3 = c(t1, -1);
    if (u + v <= 1) return y0 + (y2 - y0) * u + (y1 - y0) * v;
    return y3 + (y1 - y3) * (1 - u) + (y2 - y3) * (1 - v);
  }
  // 이 자리에서 가장 높이 그려진 길 표면(절대 높이). 길이 없으면 null. 발 높이 = max(땅, 이 값)
  function surfaceAbs(x, z) {
    const n = nearest(x, z); if (!n.e || n.d > 5) return null; const e = n.e; let best = null;
    const take = y => { if (y != null && (best == null || y > best)) best = y; };
    take(stripY(e.a, e.b, e.w, 0.06, x, z, 0));
    if (e.type !== 'access' && e.type !== 'city' && e.type !== 'town') take(stripY(e.a, e.b, e.w + 3.2, 0.035, x, z, 0));
    if (e.type === 'city' || e.type === 'town') { const o = e.w / 2 + 1.5; take(stripY(e.a, e.b, 3, 0.2, x, z, o)); take(stripY(e.a, e.b, 3, 0.2, x, z, -o)); }
    return best;
  }
  function surfaceY(x, z) { const y = surfaceAbs(x, z); return y == null ? 0 : Math.max(0, y - H(x, z)); }

  // ── 도로 메시 — 재질별로 네 덩어리: 아스팔트(사진), 인도(보도블록 사진), 흙 갓길(숲 바닥 사진), 차선·중앙분리대(민색) ──
  const mkQ = uvScale => ({ p: [], n: [], c: [], u: [], uv: uvScale });
  const QA = mkQ(1 / 4), QW = mkQ(1 / 2.2), QD = mkQ(1 / 4), QM = mkQ(1 / 5);
  let Q = QA;
  function quadPts(P, yOff, col) {
    const y = P.map(p => H(p[0], p[1]) + yOff);
    Q.p.push(P[0][0], y[0], P[0][1], P[2][0], y[2], P[2][1], P[1][0], y[1], P[1][1], P[1][0], y[1], P[1][1], P[2][0], y[2], P[2][1], P[3][0], y[3], P[3][1]);
    for (const k of [0, 2, 1, 1, 2, 3]) Q.u.push(P[k][0] * Q.uv, P[k][1] * Q.uv);
    for (let k = 0; k < 6; k++) { Q.n.push(0, 1, 0); Q.c.push(col[0], col[1], col[2]); }
  }
  // 선분 띠 (양끝 점, 폭, 세분)
  function seg(a, b, w, yOff, col, sub) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2;
    const n = Math.max(1, Math.round(L / (sub || 12)));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n; const ax = a[0] + dx * t0, az = a[1] + dz * t0, bx = a[0] + dx * t1, bz = a[1] + dz * t1;
      quadPts([[ax + nx, az + nz], [ax - nx, az - nz], [bx + nx, bz + nz], [bx - nx, bz - nz]], yOff, col);
    }
  }
  // 사진 위에 곱하는 색이라 1 근처가 사진 그대로. 차선·분리대는 사진 없이 민색
  let ASPHALT = [0.9, 0.9, 0.92], WALK = [0.95, 0.94, 0.92], WHITE = [0.7, 0.7, 0.68], YELLOW = [0.72, 0.55, 0.10], MEDIAN = [0.16, 0.24, 0.10], DIRT = [0.75, 0.68, 0.58], SHOULDER = [0.8, 0.76, 0.68];
  function render(scene) {
    if (!TEX.hasPhotos()) { ASPHALT = [0.095, 0.095, 0.10]; WALK = [0.36, 0.35, 0.33]; DIRT = [0.26, 0.21, 0.15]; SHOULDER = [0.21, 0.19, 0.15]; }   // 코드 질감은 밝아서 색을 어둡게 곱한다
    const done = new Set();
    for (const e of R.edges) {
      const k = e.a.id < e.b.id ? e.a.id + '_' + e.b.id : e.b.id + '_' + e.a.id; if (done.has(k)) continue; done.add(k);
      const a = [e.a.x, e.a.z], b = [e.b.x, e.b.z];
      if (e.type !== 'access' && e.type !== 'city' && e.type !== 'town') { Q = QD; seg(a, b, e.w + 3.2, 0.035, SHOULDER, 12); }
      if (e.type === 'access') { Q = QD; seg(a, b, e.w, 0.06, DIRT, 12); } else { Q = QA; seg(a, b, e.w, 0.06, ASPHALT, 12); }
      const townish = e.type === 'city' || e.type === 'town';
      if (townish) {   // 인도
        Q = QW;
        const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, o = e.w / 2 + 1.5;
        seg([a[0] + nx * o, a[1] + nz * o], [b[0] + nx * o, b[1] + nz * o], 3, 0.2, WALK, 12);
        seg([a[0] - nx * o, a[1] - nz * o], [b[0] - nx * o, b[1] - nz * o], 3, 0.2, WALK, 12);
      }
      Q = QM;
      if (e.lanes === 2) seg(a, b, 2.4, 0.32, MEDIAN, 12);
      else if (e.type !== 'access') {   // 중앙선 점선 (교차로 안은 비운다)
        const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
        for (let s = e.inA + 2; s < L - e.inB - 4; s += 8) { const t0 = s / L, t1 = (s + 4) / L; seg([a[0] + dx * t0, a[1] + dz * t0], [a[0] + dx * t1, a[1] + dz * t1], 0.25, 0.09, YELLOW, 8); }
      }
    }
    // 교차로: 신호등 교차로는 아스팔트 덮개 + 횡단보도
    for (const nd of R.lightNodes) {
      let wx = 12, wz = 12; for (const e of nd.out) { if (e.ns) wx = Math.max(wx, e.w); else wz = Math.max(wz, e.w); }
      const x = nd.x, z = nd.z;
      Q = QA; quadPts([[x - wx / 2 - 3, z - wz / 2 - 3], [x - wx / 2 - 3, z + wz / 2 + 3], [x + wx / 2 + 3, z - wz / 2 - 3], [x + wx / 2 + 3, z + wz / 2 + 3]], 0.12, ASPHALT);
      Q = QM;
      for (let k = -wx / 2 + 1; k < wx / 2 - 0.5; k += 1.6) { quadPts([[x + k, z - wz / 2 - 3], [x + k, z - wz / 2], [x + k + 0.8, z - wz / 2 - 3], [x + k + 0.8, z - wz / 2]], 0.14, WHITE); quadPts([[x + k, z + wz / 2], [x + k, z + wz / 2 + 3], [x + k + 0.8, z + wz / 2], [x + k + 0.8, z + wz / 2 + 3]], 0.14, WHITE); }
      for (let k = -wz / 2 + 1; k < wz / 2 - 0.5; k += 1.6) { quadPts([[x - wx / 2 - 3, z + k], [x - wx / 2 - 3, z + k + 0.8], [x - wx / 2, z + k], [x - wx / 2, z + k + 0.8]], 0.14, WHITE); quadPts([[x + wx / 2, z + k], [x + wx / 2, z + k + 0.8], [x + wx / 2 + 3, z + k], [x + wx / 2 + 3, z + k + 0.8]], 0.14, WHITE); }
    }
    // 그 밖의 갈림길: 둥근 덮개
    for (const nd of R.nodes) {
      if (nd.light || nd.deg < 3) continue;
      let w = 0; for (const e of nd.out) w = Math.max(w, e.w);
      const r = w / 2 + 1, S = 10; const dirt = nd.out.some(e => e.type === 'access') && nd.out.every(e => e.type === 'access');
      Q = dirt ? QD : QA;
      for (let i = 0; i < S; i++) { const a0 = i / S * Math.PI * 2, a1 = (i + 1) / S * Math.PI * 2; quadPts([[nd.x, nd.z], [nd.x + Math.cos(a0) * r, nd.z + Math.sin(a0) * r], [nd.x + Math.cos(a1) * r, nd.z + Math.sin(a1) * r], [nd.x + Math.cos(a1) * r, nd.z + Math.sin(a1) * r]], 0.11, dirt ? DIRT : ASPHALT); }
    }
    const P = TEX.P;
    function mesh(q, mat) {
      if (!q.p.length) return;
      const gm = new THREE.BufferGeometry();
      gm.setAttribute('position', new THREE.Float32BufferAttribute(q.p, 3)); gm.setAttribute('normal', new THREE.Float32BufferAttribute(q.n, 3)); gm.setAttribute('color', new THREE.Float32BufferAttribute(q.c, 3)); gm.setAttribute('uv', new THREE.Float32BufferAttribute(q.u, 2));
      const m = new THREE.Mesh(gm, mat); m.receiveShadow = true; scene.add(m); q.p = q.n = q.c = q.u = null;
    }
    const pbr = (ph, fallbackMap, fallbackN, ns) => ph && ph.map ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: ph.map, normalMap: ph.normal, roughnessMap: ph.rough, normalScale: new THREE.Vector2(ns, ns) }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, map: fallbackMap, normalMap: fallbackN });
    mesh(QA, pbr(P.asphalt_02, TEX.asphalt, TEX.asphaltN, 0.7));
    mesh(QW, pbr(P.pavement_02, TEX.concrete, TEX.concreteN, 0.8));
    mesh(QD, pbr(P.forrest_ground_01, TEX.concrete, TEX.concreteN, 0.6));
    mesh(QM, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }));
  }

  // ── 길찾기(네비) ──
  // 두 자리를 길을 따라 이은 선. 화살표만 가리키면 바다·절벽로 몰고 가게 된다 (사장님 2026-09-11 "네비를 진짜 네비처럼")
  function nearestNode(x, z) { let b = null, bd = 1e18; for (const n of R.nodes) { if (!n.out.length) continue; const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z); if (d < bd) { bd = d; b = n; } } return b; }
  function route(ax, az, bx, bz) {
    const s0 = nearestNode(ax, az), t0 = nearestNode(bx, bz);
    if (!s0 || !t0) return null;
    if (s0 === t0) return [{ x: s0.x, z: s0.z }];
    const dist = new Map(), prev = new Map(), done = new Set(), q = [s0];
    dist.set(s0, 0);
    while (q.length) {
      let bi = 0; for (let i = 1; i < q.length; i++) if (dist.get(q[i]) < dist.get(q[bi])) bi = i;   // 마디가 800개라 훑어도 빠르다
      const u = q.splice(bi, 1)[0]; if (done.has(u)) continue; done.add(u);
      if (u === t0) break;
      const du = dist.get(u);
      for (const e of u.out) {
        const v = e.b; if (done.has(v)) continue;
        const w = du + (e.len || Math.hypot(v.x - u.x, v.z - u.z));
        if (!dist.has(v) || w < dist.get(v)) { dist.set(v, w); prev.set(v, u); q.push(v); }
      }
    }
    if (!prev.has(t0)) return null;
    const out = []; let cur = t0, guard = 0;
    while (cur && guard++ < 4000) { out.push({ x: cur.x, z: cur.z }); if (cur === s0) break; cur = prev.get(cur); }
    out.reverse();
    return out.length > 1 ? out : null;
  }

  function init(scene) { build(); render(scene); }
  window.ROADS = Object.assign(R, { init, onRoad, nearest, edgeDist, resample, catmull, smoothPts , surfaceY, surfaceAbs, route, nearestNode });
})();
