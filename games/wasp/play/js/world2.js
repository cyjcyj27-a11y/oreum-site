// 출동지 2~6: 아파트 화단 · 초등학교 · 산소 · 시골 교회 · 폐교.
(function () {
  const W = window.WORLD, _ = W._, M = _.M, V = _.V, box = W.box, circ = W.circ;
  const R = () => CLAY.rnd();
  function win(b, x, y, z, w, h, ry, glass, frame) { // 창: 유리 + 테
    b.add(CLAY.rbox(w + 0.16, h + 0.16, 0.1, 0.04, 0.004), M(frame || '#f4f4f0', { rough: 0.4 }), [x, y, z], [0, ry || 0, 0]);
    b.add(CLAY.rbox(w, h, 0.12, 0.03, 0.003), M(glass || '#7fa8c8', { rough: 0.15 }), [x, y, z], [0, ry || 0, 0]);
  }
  function grassTufts(b, n, R0, R1, col) { for (let i = 0; i < n; i++) { const a = R() * 6.28, r = R0 + R() * (R1 - R0); b.add(CLAY.ball(0.18 + R() * 0.12, 8, 0.04, i), M(col || '#7aa84a', { rough: 0.7 }), [Math.cos(a) * r, 0.05, Math.sin(a) * r], null, [1, 0.55 + R() * 0.5, 1]); } }
  function pine(b, x, z, h, sd) {
    b.add(CLAY.rcyl(0.18, 0.26, h, 0.08, 10, 0.03, sd), M('#8a4a2e', { rough: 0.7 }), [x, h / 2, z]);
    for (let i = 0; i < 4; i++) b.add(CLAY.ball(1.4 - i * 0.25, 14, 0.12, sd + i), M(i % 2 ? '#3f7a3a' : '#4a8a42', { rough: 0.6 }), [x + (R() - 0.5) * 0.5, h * 0.55 + i * 0.75, z + (R() - 0.5) * 0.5], null, [1.2, 0.55, 1.2]);
  }
  function fence(b, cols, x0, z0, x1, z1, gapX, gapW, col) { // 낮은 철망 담
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 1.6);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      if (gapW && Math.abs(x - gapX) < gapW && z0 === z1) continue;
      b.add(CLAY.rcyl(0.05, 0.05, 1.3, 0.02, 8), M(col || '#5a7a5a', { rough: 0.4 }), [x, 0.65, z]);
    }
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const seg = (ax, az, bx, bz) => { const l = Math.hypot(bx - ax, bz - az); if (l < 0.1) return; b.add(CLAY.rbox(l, 0.06, 0.06, 0.02, 0.003), M(col || '#5a7a5a'), [(ax + bx) / 2, 1.25, (az + bz) / 2], [0, -ang, 0]); b.add(CLAY.rbox(l, 0.9, 0.02, 0.01, 0), M(col || '#5a7a5a', { op: 0.35 }), [(ax + bx) / 2, 0.75, (az + bz) / 2], [0, -ang, 0]); };
    if (gapW && z0 === z1) { seg(x0, z0, gapX - gapW, z1); seg(gapX + gapW, z0, x1, z1); cols.push(box(Math.min(x0, x1), z0 - 0.2, gapX - gapW, z0 + 0.2, 1.3)); cols.push(box(gapX + gapW, z0 - 0.2, Math.max(x0, x1), z0 + 0.2, 1.3)); }
    else { seg(x0, z0, x1, z1); cols.push(box(Math.min(x0, x1) - 0.2, Math.min(z0, z1) - 0.2, Math.max(x0, x1) + 0.2, Math.max(z0, z1) + 0.2, 1.3)); }
  }
  function road(b, z) { _.patch(b, '#8a8a8e', 0, z, 30, 2.6, 7); for (let x = -26; x < 26; x += 4) b.add(CLAY.rbox(1.8, 0.03, 0.18, 0.02, 0.002), M('#f4f0e0', { rough: 0.6 }), [x, 0.06, z]); }
  function bench(b, cols, x, z, ry) {
    b.add(CLAY.rbox(1.6, 0.1, 0.5, 0.04, 0.005), M('#c08a52'), [x, 0.48, z], [0, ry, 0]);
    b.add(CLAY.rbox(1.6, 0.4, 0.08, 0.04, 0.005), M('#c08a52'), [x - Math.sin(ry) * 0.25, 0.75, z - Math.cos(ry) * 0.25], [0, ry, 0]);
    [-0.65, 0.65].forEach((k) => b.add(CLAY.rbox(0.08, 0.45, 0.45, 0.03), M('#4a4a4a'), [x + Math.cos(ry) * k, 0.23, z - Math.sin(ry) * k], [0, ry, 0]));
    cols.push(circ(x, z, 0.75, 1));
  }

  // ---------- 아파트 화단 ----------
  W.apt = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    _.ground(b, W.grass, 120); _.hills(b);
    road(b, 15);
    _.patch(b, '#c8c8c4', 0, 6, 13, 3.2, 3);   // 보도
    _.patch(b, '#e8d3a0', -6, 3, 4.5, 3.6, 4); // 놀이터 모래
    // 아파트 동: 5층, 층마다 베란다
    const fz = -10;
    b.add(CLAY.rbox(26, 15.5, 7, 0.3, 0.05), M('#f2e6cf', { rough: 0.7 }), [0, 7.75, fz - 3.5]);
    for (let f = 0; f < 5; f++) {
      const y = 0.4 + f * 3;
      b.add(CLAY.rbox(26.4, 0.18, 0.4, 0.06, 0.006), M('#d8c8a8'), [0, y + 2.9, fz + 0.1]);
      for (let k = 0; k < 6; k++) {
        const x = -10.8 + k * 4.3;
        if (f > 0) { b.add(CLAY.rbox(3.6, 0.2, 1.2, 0.06, 0.006), M('#e8dcc2'), [x, y - 0.1, fz + 0.6]); b.add(CLAY.rbox(3.6, 0.9, 0.08, 0.03, 0.004), M('#ffffff', { rough: 0.35 }), [x, y + 0.45, fz + 1.15]); }
        win(b, x, y + 1.4, fz + 0.05, 2.6, 1.7, 0, '#8fb4d0');
      }
    }
    // 1층 현관
    b.add(CLAY.rbox(3.2, 0.25, 2, 0.08, 0.01), M('#d8c8a8'), [0, 3.1, fz + 1]);
    b.add(CLAY.rbox(1.6, 2.4, 0.12, 0.05, 0.004), M('#5a7a9a', { rough: 0.2 }), [0, 1.2, fz + 0.06]);
    cols.push(box(-13.2, -18, 13.2, fz + 0.2, 16));
    // 화단: 벽돌 테 + 덤불 + 실외기
    b.add(CLAY.rbox(24, 0.35, 0.25, 0.06, 0.01), M('#b8644a', { rough: 0.6 }), [0, 0.18, fz + 2.2]);
    for (let x = -11; x <= 11; x += 2.2) if (Math.abs(x) > 2) _.bush(b, x, fz + 1.2, 0.45, 300 + x * 3);
    cols.push(box(-12, fz, -1.8, fz + 2.35, 1)); cols.push(box(1.8, fz, 12, fz + 2.35, 1));
    [[-6.5, 0], [4.3, 1]].forEach(([x, i]) => {
      b.add(CLAY.rbox(1.1, 0.9, 0.6, 0.1, 0.01), M('#e4e4e0', { rough: 0.35 }), [x, 0.6, fz + 1.4]);
      b.add(CLAY.rcyl(0.33, 0.33, 0.05, 0.02, 20), M('#4a4a4a'), [x, 0.6, fz + 1.72], [Math.PI / 2, 0, 0]);
    });
    spots.push({ p: V(-6.5, 3.15, fz + 0.9), kind: 'hang', id: 'ac' });
    spots.push({ p: V(4.3, 3.15, fz + 0.9), kind: 'hang', id: 'rail' });
    spots.push({ p: V(7.7, 0, fz + 1.45), kind: 'ground', id: 'bed', hole: V(7.75, 0.08, fz + 1.75) }); // 덤불 사이
    // 놀이터: 미끄럼틀·그네·나무
    const pg = { x: -6, z: 3 };
    b.add(CLAY.rbox(1.2, 0.12, 1.2, 0.04, 0.005), M('#ff7a3a'), [pg.x - 1, 1.6, pg.z]);
    [[-1.5, -0.5], [-0.5, -0.5], [-1.5, 0.5], [-0.5, 0.5]].forEach(([dx, dz]) => b.add(CLAY.rcyl(0.07, 0.07, 1.6, 0.03, 8), M('#3a7ad0'), [pg.x + dx, 0.8, pg.z + dz]));
    b.add(CLAY.rbox(0.8, 0.1, 2.6, 0.04, 0.005), M('#ffcf3a', { rough: 0.3 }), [pg.x + 0.2, 0.85, pg.z], [0.0, 0, 0.6]);
    b.add(CLAY.rbox(0.8, 0.1, 2.6, 0.04, 0.005), M('#ffcf3a', { rough: 0.3 }), [pg.x + 0.9, 0.9, pg.z], [0, 0, -0.65]);
    cols.push(box(pg.x - 1.8, pg.z - 0.8, pg.x + 2, pg.z + 0.8, 1.8));
    b.add(CLAY.rcyl(0.08, 0.08, 4, 0.03, 8), M('#d84a3a'), [-1.5, 2.2, 5.5], [0, 0, Math.PI / 2]);
    [-3.4, 0.4].forEach((x) => { b.add(CLAY.rcyl(0.07, 0.07, 2.3, 0.03, 8), M('#d84a3a'), [x, 1.1, 5.5]); });
    [-2.4, -0.6].forEach((x) => { b.add(CLAY.rbox(0.6, 0.08, 0.3, 0.03), M('#3a3a3a'), [x, 0.6, 5.5]); });
    cols.push(box(-3.6, 5.3, 0.6, 5.7, 2));
    _.tree(b, -10.5, 2, 3, 310); cols.push(circ(-10.5, 2, 0.35));
    spots.push({ p: V(-9.6, 2.9, 2.6), kind: 'hang', id: 'tree' });
    bench(b, cols, 3, 3, 0); bench(b, cols, 7.5, 3, 0);
    _.tree(b, 10.5, 1, 3.3, 320); cols.push(circ(10.5, 1, 0.35));
    _.flowers(b, 50, 14, 24);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -13, z0: -7.4, x1: 13, z1: 16.5 }, truck: { p: V(6, 0, 15), r: Math.PI / 2 }, npc: { p: V(1.6, 0, -6.6), kind: 'guard' }, start: V(0, 0, 11), kit: V(-2.2, 0, -5.4), startYaw: Math.PI, view: V(0, 0, 0), focus: V(0, 2.5, -6), food: [V(-11, 0.8, 8), V(11, 0.8, 9), V(-12, 1, -2), V(12, 1, -3), V(0, 0.8, 9)] };
  };

  // ---------- 초등학교 ----------
  W.school = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    _.ground(b, W.grass, 120); _.hills(b);
    road(b, 17);
    _.patch(b, '#e2c08e', -1, -1, 13, 8, 5); // 운동장
    // 본관: 2층, 초록 띠
    const fz = -11;
    b.add(CLAY.rbox(26, 7.6, 6, 0.3, 0.04), M('#f4ead2', { rough: 0.7 }), [-2, 3.8, fz - 3]);
    b.add(CLAY.rbox(26.2, 0.5, 6.2, 0.1, 0.01), M('#5aa86a'), [-2, 3.75, fz - 3]);
    b.add(CLAY.rbox(26.4, 0.4, 6.4, 0.1, 0.01), M('#d8c8a8'), [-2, 7.7, fz - 3]);
    for (let f = 0; f < 2; f++) for (let k = 0; k < 9; k++) { const x = -13 + k * 2.8; if (f === 0 && Math.abs(x - 0.4) < 1.5) continue; win(b, x, 1.9 + f * 3.8, fz + 0.03, 1.9, 1.6, 0, '#9ac0d8', '#ffffff'); }
    b.add(CLAY.rbox(1.8, 2.5, 0.12, 0.05, 0.004), M('#6a8ab0', { rough: 0.2 }), [0.4, 1.25, fz + 0.05]);
    // 현관 차양(숨은 집 자리)
    b.add(CLAY.rbox(4.4, 0.3, 2.4, 0.1, 0.01), M('#e8dcc0'), [0.4, 3.3, fz + 1.2]);
    [-1.6, 2.4].forEach((x) => b.add(CLAY.rcyl(0.14, 0.14, 3.2, 0.05, 10), M('#e8dcc0'), [x, 1.6, fz + 2.2]));
    cols.push(box(-15.2, -20, 11.2, fz + 0.2, 8.2)); cols.push(circ(-1.6, fz + 2.2, 0.2)); cols.push(circ(2.4, fz + 2.2, 0.2));
    spots.push({ p: V(1.4, 3.05, fz + 1.4), kind: 'hidden', id: 'roofIn', hole: V(1.4, 3.13, fz + 1.4) });
    // 체육 창고
    const sx = 10.5, sz = -2;
    b.add(CLAY.rbox(4, 2.6, 4, 0.12, 0.02), M('#c8d8e8', { rough: 0.6 }), [sx, 1.3, sz]);
    b.add(CLAY.rbox(0.1, 2, 2, 0.04, 0.004), M('#5a7aa0'), [sx - 2.02, 1.0, sz]);
    b.add(CLAY.rbox(5.6, 0.18, 5.4, 0.06, 0.01), M('#4a6a9a', { rough: 0.45 }), [sx, 2.85, sz], [0, 0, 0.16]);
    cols.push(box(sx - 2.2, sz - 2.2, sx + 2.2, sz + 2.2, 3));
    spots.push({ p: V(sx - 2.55, 2.52, sz + 1.2), kind: 'hang', id: 'shedEave' });
    // 축구 골대·나무·교문·담
    b.add(CLAY.rcyl(0.07, 0.07, 3, 0.03, 8), M('#ffffff'), [-12, 2, -1], [Math.PI / 2, 0, 0]);
    [-2.5, 0.5].forEach((z) => b.add(CLAY.rcyl(0.07, 0.07, 2, 0.03, 8), M('#ffffff'), [-12, 1, z]));
    cols.push(box(-12.2, -2.6, -11.8, 0.6, 2));
    _.tree(b, -9, 6, 3.2, 410, null); cols.push(circ(-9, 6, 0.38));
    spots.push({ p: V(-8.1, 3.0, 6.6), kind: 'hang', id: 'tree' });
    spots.push({ p: V(-9, 1.3, 6.3), kind: 'hidden', id: 'hollow', hole: V(-9, 1.3, 6.27), holeN: V(0, 0, 1) });
    _.tree(b, 7, 7, 3, 420); cols.push(circ(7, 7, 0.35));
    // 교문: 기둥 둘 + 위 아치 간판
    [-3, 3].forEach((x) => b.add(CLAY.rbox(0.7, 3.4, 0.7, 0.1, 0.01), M('#c8b898'), [x, 1.7, 13]));
    b.add(CLAY.rbox(7, 0.6, 0.5, 0.15, 0.01), M('#5aa86a'), [0, 3.5, 13]);
    cols.push(box(-3.4, 12.6, -2.6, 13.4, 3.5)); cols.push(box(2.6, 12.6, 3.4, 13.4, 3.5));
    spots.push({ p: V(0.6, 3.2, 13), kind: 'hang', id: 'gate' });
    fence(b, cols, -15, 13, 15, 13, 0, 3.4);
    _.flowers(b, 40, 15, 26);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -14.5, z0: -8.6, x1: 14.5, z1: 18 }, truck: { p: V(-5, 0, 16.6), r: Math.PI / 2 }, npc: { p: V(-2, 0, -8), kind: 'teacher' }, start: V(0, 0, 15), kit: V(4.5, 0, -4.5), startYaw: Math.PI, view: V(0, 0, 0), focus: V(0, 2.4, -4), food: [V(-13, 0.8, 9), V(13, 0.8, 9), V(-13, 1, -6), V(13, 0.9, 6), V(0, 0.6, 10)] };
  };

  // ---------- 산소 ----------
  W.grave = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    _.ground(b, W.grass, 120); _.hills(b);
    _.patch(b, '#c8a878', 2, 10, 2, 8, 6); // 흙길
    // 뒤 언덕
    b.add(CLAY.ball(1, 24, 0.05, 2), M(W.grass, { rough: 0.7 }), [0, -6, -22], null, [26, 10, 12]);
    // 봉분 둘 + 비석·상석
    [[-3, -6], [3.5, -7]].forEach(([x, z], i) => {
      b.add(CLAY.ball(1, 22, 0.04, 30 + i), M('#88b85a', { rough: 0.7 }), [x, 0, z], null, [2.2, 1.3, 2.2]);
      b.add(CLAY.rbox(0.9, 1.5, 0.28, 0.06, 0.01), M('#b8b8b4', { rough: 0.45 }), [x, 0.75, z + 2.6]);
      b.add(CLAY.rbox(1.6, 0.45, 0.9, 0.06, 0.01), M('#a8a8a4', { rough: 0.5 }), [x, 0.23, z + 3.3]);
      cols.push(circ(x, z, 2.1, 1.4)); cols.push(box(x - 0.85, z + 2.4, x + 0.85, z + 3.8, 1));
      // 망주석
      [-1.8, 1.8].forEach((k) => b.add(CLAY.rcyl(0.14, 0.18, 1.2, 0.08, 10), M('#c0c0bc'), [x + k, 0.6, z + 2.8]));
    });
    // 소나무
    [[-8, -2], [-10, 4], [9, -3], [10.5, 3], [-6, -11], [6, -12], [12, -9]].forEach(([x, z], i) => { pine(b, x, z, 3 + (i % 3) * 0.6, 500 + i * 5); cols.push(circ(x, z, 0.4)); });
    spots.push({ p: V(1.2, 0, -3.4), kind: 'ground', id: 'mound', hole: V(1.2, 0.07, -3.0) });
    spots.push({ p: V(-7.4, 0, -1.2), kind: 'ground', id: 'pine', hole: V(-7.3, 0.07, -0.9) });
    grassTufts(b, 90, 3, 16, '#6f9e44');
    _.flowers(b, 50, 6, 16);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -12.5, z0: -12, x1: 12.5, z1: 16 }, truck: { p: V(2.2, 0, 15), r: Math.PI }, npc: { p: V(-0.2, 0, -1), kind: 'mourner' }, start: V(1, 0, 11), kit: V(-2.8, 0, -1.6), startYaw: Math.PI, view: V(0, 0, -2), focus: V(0, 1, -5), food: [V(9, 0.6, 9), V(-9, 0.6, 10), V(11, 0.7, 6), V(-11.5, 0.6, -6), V(8, 0.5, -9)] };
  };

  // ---------- 시골 교회 ----------
  W.church = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    _.ground(b, W.grass, 120); _.hills(b);
    road(b, 15);
    _.patch(b, '#dcc49a', 0, 3, 3, 9, 8);
    // 본당
    const cz = -8;
    b.add(CLAY.rbox(8, 4, 8, 0.15, 0.02), M('#fbf6ea', { rough: 0.6 }), [0, 2, cz]);
    _.tileRoof(b, 0, cz, 8, 7.4, 4.0, 6.2, 0.5);
    for (let k = 0; k < 3; k++) { win(b, 4.05, 2.2, cz - 2.5 + k * 2.5, 1, 1.8, Math.PI / 2, '#c8a0e0', '#8a5a36'); win(b, -4.05, 2.2, cz - 2.5 + k * 2.5, 1, 1.8, Math.PI / 2, '#a0c8e0', '#8a5a36'); }
    cols.push(box(-4.3, cz - 4.3, 4.3, cz + 4.3, 6.5));
    // 종탑(앞)
    const tz = cz + 5.1;
    b.add(CLAY.rbox(2.6, 3.4, 2.6, 0.1, 0.01), M('#fbf6ea'), [0, 1.7, tz]);
    [[-1.15, -1.15], [1.15, -1.15], [-1.15, 1.15], [1.15, 1.15]].forEach(([x, z]) => b.add(CLAY.rbox(0.3, 1.5, 0.3, 0.06, 0.005), M('#fbf6ea'), [x, 4.15, tz + z]));
    b.add(CLAY.rbox(2.9, 0.25, 2.9, 0.08, 0.005), M('#e8dcc4'), [0, 3.4, tz]);
    b.add(CLAY.rbox(2.9, 0.25, 2.9, 0.08, 0.005), M('#e8dcc4'), [0, 4.95, tz]);
    b.add(CLAY.lump(new THREE.ConeGeometry(2.0, 2.4, 4, 3), 0.03, 1, 7), M('#c8483a', { rough: 0.45 }), [0, 6.3, tz], [0, Math.PI / 4, 0]);
    b.add(CLAY.rbox(0.12, 1, 0.12, 0.03), M('#f2d27a'), [0, 7.9, tz]); b.add(CLAY.rbox(0.6, 0.12, 0.12, 0.03), M('#f2d27a'), [0, 8.1, tz]);
    b.add(CLAY.rcyl(0.25, 0.45, 0.6, 0.1, 14, 0.01, 9), M('#c89a3a', { rough: 0.25 }), [0, 4.3, tz]); // 종
    b.add(CLAY.rbox(1.2, 2.2, 0.1, 0.05, 0.004), M('#8a5a36'), [0, 1.1, tz + 1.32]);
    b.add(CLAY.rbox(2, 0.18, 1.1, 0.06, 0.005), M('#c8483a'), [0, 2.55, tz + 1.8]);
    cols.push(box(-1.5, tz - 1.5, 1.5, tz + 1.5, 7));
    spots.push({ p: V(0.7, 4.82, tz + 0.7), kind: 'hang', id: 'bell' });
    spots.push({ p: V(0.6, 2.45, tz + 1.9), kind: 'hang', id: 'door' });
    spots.push({ p: V(4.55, 3.95, cz + 1.5), kind: 'hang', id: 'win' });
    // 느티나무(구멍)
    const tx = 8, tzz = 3;
    b.add(CLAY.rcyl(0.45, 0.65, 3.2, 0.2, 14, 0.06, 600), M('#7a5234', { rough: 0.75 }), [tx, 1.6, tzz]);
    for (let i = 0; i < 7; i++) { const a = i * 0.9, rr = i ? 1.6 : 0; b.add(CLAY.ball(1.5 + R() * 0.5, 16, 0.1, 610 + i), M(W.leaf[i % 3], { rough: 0.6 }), [tx + Math.cos(a) * rr, 4.2 + (i ? R() * 0.8 : 0.9), tzz + Math.sin(a) * rr]); }
    cols.push(circ(tx, tzz, 0.65));
    spots.push({ p: V(tx - 0.55, 1.55, tzz + 0.7), kind: 'hidden', id: 'hollow', hole: V(tx - 0.32, 1.1, tzz + 0.56), holeN: V(-0.5, 0, 0.86) });
    bench(b, cols, -5, 1, 0.3); bench(b, cols, -5.5, 5, 0.1);
    // 꽃밭·간판
    for (let x = -3; x <= 3; x += 1.2) _.bush(b, -9, -3 + x, 0.4, 620 + x * 5);
    b.add(CLAY.rbox(1.8, 1.1, 0.15, 0.06, 0.005), M('#fbf6ea'), [4.5, 1.2, 9]); b.add(CLAY.rcyl(0.07, 0.07, 0.8, 0.03, 8), M('#8a5a36'), [4.5, 0.4, 9]);
    _.flowers(b, 60, 10, 24);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -13, z0: -13, x1: 13, z1: 16.5 }, truck: { p: V(-6, 0, 15), r: Math.PI / 2 }, npc: { p: V(-2.2, 0, -0.2), kind: 'pastor' }, start: V(0, 0, 11), kit: V(2.8, 0, 0.5), startYaw: Math.PI, view: V(0, 0, -2), focus: V(0, 3, -4), food: [V(-9, 0.6, -3), V(-11, 0.7, 8), V(11, 0.7, 10), V(12, 0.6, -6), V(-6, 0.6, -11)] };
  };

  // ---------- 폐교(마지막) ----------
  W.oldschool = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    _.ground(b, '#a8a860', 120); _.hills(b);
    _.patch(b, '#c8a878', 0, 0, 12, 7, 9);
    // 낡은 나무 학교: 단층, 깊은 처마(반자)
    const fz = -11;
    b.add(CLAY.rbox(22, 3.4, 6, 0.12, 0.04), M('#c8b08a', { rough: 0.8 }), [-1, 1.7, fz - 3]);
    for (let x = -12; x <= 10; x += 0.5) b.add(CLAY.rbox(0.05, 3.3, 0.06, 0.02, 0.004), M('#a88a62'), [x, 1.7, fz + 0.02]); // 판자 줄
    for (let k = 0; k < 7; k++) { const x = -10.5 + k * 3.1; win(b, x, 1.9, fz + 0.06, 1.8, 1.4, 0, k % 3 === 1 ? '#2a2a30' : '#5a6a6a', '#e8e0cc'); if (k % 3 === 1) { b.add(CLAY.rbox(2, 0.18, 0.08, 0.04, 0.005), M('#8a6a42'), [x, 1.9, fz + 0.15], [0, 0, 0.4]); b.add(CLAY.rbox(2, 0.18, 0.08, 0.04, 0.005), M('#8a6a42'), [x, 1.9, fz + 0.16], [0, 0, -0.35]); } }
    b.add(CLAY.rbox(23.6, 0.2, 2.2, 0.06, 0.01), M('#9a8a72', { rough: 0.8 }), [-1, 3.45, fz + 1.0]); // 처마 반자
    _.tileRoof(b, -1, fz - 2.5, 22, 7, 3.6, 5.6, 1.5);
    cols.push(box(-12.3, -20, 10.3, fz + 0.2, 6));
    spots.push({ p: V(-3, 3.35, fz + 1.3), kind: 'hidden', id: 'ceiling', hole: V(-3, 3.33, fz + 1.3) });
    spots.push({ p: V(5, 3.35, fz + 1.2), kind: 'hidden', id: 'ceil2', hole: V(5, 3.33, fz + 1.2) });
    // 녹슨 그네·동상 받침·축구 골대
    b.add(CLAY.rcyl(0.07, 0.07, 3.4, 0.03, 8), M('#9a5a3a'), [7, 2.3, 4], [0, 0, Math.PI / 2]);
    [5.3, 8.7].forEach((x) => b.add(CLAY.rcyl(0.07, 0.07, 2.4, 0.03, 8), M('#9a5a3a'), [x, 1.2, 4]));
    cols.push(box(5.1, 3.8, 8.9, 4.2, 2.4));
    b.add(CLAY.rbox(1.4, 1.2, 1.4, 0.08, 0.02), M('#a8a8a0'), [-8, 0.6, 2]);
    b.add(CLAY.capsule(0.3, 0.4, 0.02, 3), M('#8a9a8a', { rough: 0.4 }), [-8, 1.75, 2]); b.add(CLAY.ball(0.26, 14, 0.01, 4), M('#8a9a8a', { rough: 0.4 }), [-8, 2.35, 2]);
    b.add(CLAY.rbox(0.5, 0.06, 0.35, 0.02), M('#8a9a8a'), [-8, 1.85, 2.3], [0.5, 0, 0]);
    cols.push(box(-8.8, 1.2, -7.2, 2.8, 2));
    // 잡초·낙엽·나무
    grassTufts(b, 140, 2, 16, '#8a9a48');
    for (let i = 0; i < 80; i++) { const a = R() * 6.28, r = 2 + R() * 13; b.add(CLAY.ball(0.09, 6, 0.01, i), M(['#d8662a', '#e8a030', '#a8502a'][i % 3], { rough: 0.6 }), [Math.cos(a) * r, 0.04, Math.sin(a) * r], null, [1.3, 0.25, 1]); }
    [[-12, 6], [11.5, -2], [12, 8], [-12.5, -3]].forEach(([x, z], i) => { _.tree(b, x, z, 3.4, 700 + i * 7); cols.push(circ(x, z, 0.4)); });
    _.stoneWall(b, cols, -14, -12, 13, 13, [0, 2.2, 13]);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -13.4, z0: -9.4, x1: 12.4, z1: 16 }, truck: { p: V(4, 0, 15.5), r: Math.PI }, npc: { p: V(-2, 0, 9), kind: 'keeper' }, start: V(0, 0, 11), kit: V(1, 0, -4.2), startYaw: Math.PI, view: V(0, 0, -1), focus: V(0, 2.4, -6), dusk: true, food: [V(-12, 0.7, 10), V(11, 0.7, 11), V(-11, 0.6, -6), V(10, 0.6, -6), V(0, 0.5, 11)] };
  };
})();
