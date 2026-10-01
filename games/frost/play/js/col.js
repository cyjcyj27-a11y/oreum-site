// col.js — 부딪힘. 나무는 원기둥, 집·울타리는 돌린 상자. 격자에 넣어 가까운 것만 본다.
(function () {
  const CELL = 12, HALF = 460, NC = Math.ceil(HALF * 2 / CELL);
  const grid = new Map();
  const all = [];
  const key = (i, j) => i * 1000 + j;

  function addTo(o, x0, z0, x1, z1) {
    const i0 = Math.max(0, ((x0 + HALF) / CELL) | 0), i1 = Math.min(NC - 1, ((x1 + HALF) / CELL) | 0);
    const j0 = Math.max(0, ((z0 + HALF) / CELL) | 0), j1 = Math.min(NC - 1, ((z1 + HALF) / CELL) | 0);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = key(i, j);
      let a = grid.get(k); if (!a) grid.set(k, a = []);
      a.push(o);
    }
    all.push(o);
  }
  // 원기둥: y0~y1 높이
  function circle(x, z, r, y0, y1, tag) {
    const o = { t: 0, x, z, r, y0: y0 == null ? -9 : y0, y1: y1 == null ? 99 : y1, tag };
    addTo(o, x - r, z - r, x + r, z + r);
    return o;
  }
  // 돌린 상자: 가운데 x,z · 반폭 hw,hd · 각 a · 높이 y0~y1. top 이면 위에 올라설 수 있다
  function box(x, z, hw, hd, a, y0, y1, tag) {
    const o = { t: 1, x, z, hw, hd, c: Math.cos(a || 0), s: Math.sin(a || 0), y0, y1, tag };
    const R = Math.hypot(hw, hd);
    addTo(o, x - R, z - R, x + R, z + R);
    return o;
  }

  function near(x, z) {
    const i = ((x + HALF) / CELL) | 0, j = ((z + HALF) / CELL) | 0;
    return grid.get(key(i, j)) || [];
  }
  const seen = new Set();
  function around(x, z, r, fn) {
    seen.clear();
    const i0 = ((x - r + HALF) / CELL) | 0, i1 = ((x + r + HALF) / CELL) | 0;
    const j0 = ((z - r + HALF) / CELL) | 0, j1 = ((z + r + HALF) / CELL) | 0;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = grid.get(key(i, j)); if (!a) continue;
      for (const o of a) { if (seen.has(o) || o.off) continue; seen.add(o); fn(o); }
    }
  }

  // 몸(원기둥 반지름 r, 발 y ~ 머리 y+h)을 밀어낸다. 밀었으면 true
  function push(p, r, h) {
    let hit = false;
    around(p.x, p.z, r + 6, o => {
      if (p.y + h < o.y0 || p.y > o.y1 - 0.05) return;
      if (o.top && o.y1 - p.y <= 0.5) return;   // 낮은 단(현관·마루)은 올라선다
      if (o.t === 0) {
        const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), m = o.r + r;
        if (d < m && d > 1e-4) { p.x = o.x + dx / d * m; p.z = o.z + dz / d * m; hit = true; }
      } else {
        const dx = p.x - o.x, dz = p.z - o.z;
        const u = dx * o.c + dz * o.s, v = -dx * o.s + dz * o.c;
        const cu = U.clamp(u, -o.hw, o.hw), cv = U.clamp(v, -o.hd, o.hd);
        let ex = u - cu, ev = v - cv, d = Math.hypot(ex, ev);
        if (d >= r) return;
        let nu, nv;
        if (d > 1e-4) { nu = cu + ex / d * r; nv = cv + ev / d * r; }
        else {   // 속에 들어갔다 → 가까운 면으로
          const pu = o.hw - Math.abs(u), pv = o.hd - Math.abs(v);
          if (pu < pv) { nu = Math.sign(u || 1) * (o.hw + r); nv = v; } else { nu = u; nv = Math.sign(v || 1) * (o.hd + r); }
        }
        p.x = o.x + nu * o.c - nv * o.s; p.z = o.z + nu * o.s + nv * o.c; hit = true;
      }
    });
    return hit;
  }

  // 발밑에 올라설 윗면 (상자 윗면 중 발 높이 근처)
  function topAt(x, z, y, reach) {
    let best = -1e9;
    around(x, z, 1, o => {
      if (o.t !== 1 || !o.top) return;
      const dx = x - o.x, dz = z - o.z;
      const u = dx * o.c + dz * o.s, v = -dx * o.s + dz * o.c;
      if (Math.abs(u) <= o.hw && Math.abs(v) <= o.hd && o.y1 <= y + reach && o.y1 > best) best = o.y1;
    });
    return best;
  }

  // 점이 무언가 속에 있나 (카메라용)
  function inside(x, y, z, pad) {
    let hit = false;
    around(x, z, pad + 6, o => {
      if (hit || y < o.y0 - pad || y > o.y1 + pad) return;
      if (o.t === 0) { if (Math.hypot(x - o.x, z - o.z) < o.r + pad) hit = true; }
      else {
        const dx = x - o.x, dz = z - o.z;
        const u = dx * o.c + dz * o.s, v = -dx * o.s + dz * o.c;
        if (Math.abs(u) < o.hw + pad && Math.abs(v) < o.hd + pad) hit = true;
      }
    });
    return hit;
  }

  window.COL = { circle, box, push, topAt, inside, around, near, all };
})();
