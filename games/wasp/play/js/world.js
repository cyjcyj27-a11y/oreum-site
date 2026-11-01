// 출동지 디오라마. 장소마다 build 하나: 땅·건물·나무·담 + 충돌(colliders) + 벌집 자리(spots) + 차·신고자·시작 자리.
(function () {
  const W = (window.WORLD = {});
  const M = (c, o) => CLAY.mat(c, o);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- 공통 조각 ----------
  function ground(b, col, size) {
    const g = new THREE.PlaneGeometry(size, size, 64, 64); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); let y = CLAY.noise(x * 0.15, 0, z * 0.15) * 0.08 + CLAY.noise(x * 0.6, 3, z * 0.6) * 0.02; if (r > 26) y += Math.pow((r - 26) / 14, 2) * 1.2; p.setY(i, y); }
    g.computeVertexNormals();
    b.add(g, M(col, { rough: 0.7, ns: 0.8 }), [0, 0, 0]);
  }
  function patch(b, col, x, z, rx, rz, sd) { // 흙마당·길처럼 납작한 점토 반죽
    const g = CLAY.lump(new THREE.CircleGeometry(1, 40, 0), 0, 1, sd); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + CLAY.noise(Math.cos(a) * 2 + sd, Math.sin(a) * 2, sd) * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals();
    b.add(g, M(col, { rough: 0.75, ns: 0.9 }), [x, 0.03, z], null, [rx, 1, rz]);
  }
  function hills(b) {
    const cols = ['#86b85a', '#9cc66a', '#7aa852', '#a9cf78', '#6f9e4c'];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + CLAY.rnd() * 0.2, r = 46 + CLAY.rnd() * 22, s = 9 + CLAY.rnd() * 12;
      b.add(CLAY.ball(1, 18, 0.07, i), M(cols[i % 5], { rough: 0.7 }), [Math.cos(a) * r, -s * 0.35, Math.sin(a) * r], null, [s * 1.4, s, s * 1.2]);
    }
  }
  function tree(b, x, z, h, sd, fruit) {
    b.add(CLAY.rcyl(0.16, 0.24, h, 0.08, 10, 0.03, sd), M('#7a5234', { rough: 0.7 }), [x, h / 2, z]);
    const cs = W.leaf;
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + sd, rr = i ? 0.9 : 0, s = 1.0 + CLAY.rnd() * 0.5; b.add(CLAY.ball(s, 16, 0.08, sd + i), M(cs[i % 3], { rough: 0.6 }), [x + Math.cos(a) * rr, h + 0.5 + (i ? CLAY.rnd() * 0.6 : 0.6), z + Math.sin(a) * rr]); }
    if (fruit) for (let i = 0; i < 12; i++) { const a = CLAY.rnd() * 6.28, rr = 1.75 + CLAY.rnd() * 0.45; b.add(CLAY.ball(0.13, 10, 0.006, i), M(fruit, { rough: 0.3 }), [x + Math.cos(a) * rr, h + 0.1 + CLAY.rnd() * 1.2, z + Math.sin(a) * rr]); }
  }
  function bush(b, x, z, s, sd) { const cs = W.bushC; for (let i = 0; i < 3; i++) b.add(CLAY.ball(s * (0.8 + i * 0.15), 14, 0.04, sd + i), M(cs[i % 2], { rough: 0.6 }), [x + (i - 1) * s * 0.7, s * 0.6, z + (i % 2) * 0.2]); }
  function flowers(b, n, R0, R1) {
    const cs = ['#ff8aa8', '#ffe066', '#ffffff', '#b58cff', '#ff9a4a'];
    for (let i = 0; i < n; i++) { const a = CLAY.rnd() * 6.28, r = R0 + CLAY.rnd() * (R1 - R0), x = Math.cos(a) * r, z = Math.sin(a) * r; b.add(CLAY.ball(0.07, 8, 0.01, i), M(cs[i % 5], { rough: 0.4 }), [x, 0.1, z]); b.add(CLAY.rcyl(0.012, 0.012, 0.1, 0.005, 5), M('#5f9e40'), [x, 0.04, z]); }
  }
  // 돌담: 점토 공을 쌓은 담(사각형 둘레, 앞 가운데 틈)
  function stoneWall(b, cols, x0, z0, x1, z1, gap) {
    const stones = ['#b8ab98', '#a39886', '#c9bea9', '#958a7a'];
    const seg = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 0.42);
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        if (gap && Math.abs(x - gap[0]) < gap[1] && Math.abs(z - gap[2]) < 0.5) continue;
        for (let k = 0; k < 3; k++) b.add(CLAY.ball(0.26 - k * 0.03, 10, 0.04, i * 3 + k), M(stones[(i + k) % 4], { rough: 0.8 }), [x + (k % 2) * 0.12, 0.22 + k * 0.36, z + (k % 2) * 0.05], null, [1.1, 0.8, 1]);
      }
      // 충돌
      const minx = Math.min(ax, bx) - 0.35, maxx = Math.max(ax, bx) + 0.35, minz = Math.min(az, bz) - 0.35, maxz = Math.max(az, bz) + 0.35;
      if (gap && az === bz && Math.abs(az - gap[2]) < 0.5) { cols.push(box(minx, minz, gap[0] - gap[1], maxz, 1.2)); cols.push(box(gap[0] + gap[1], minz, maxx, maxz, 1.2)); }
      else cols.push(box(minx, minz, maxx, maxz, 1.2));
    };
    seg(x0, z0, x1, z0); seg(x1, z0, x1, z1); seg(x1, z1, x0, z1); seg(x0, z1, x0, z0);
  }
  function box(x0, z0, x1, z1, h) { return { t: 'b', x0, z0, x1, z1, h: h || 3 }; }
  function circ(x, z, r, h) { return { t: 'c', x, z, r, h: h || 3 }; }
  W.box = box; W.circ = circ;
  W._ = { ground, patch, hills, tree, bush, flowers, stoneWall, tileRoof, onggi, M, V };
  // 기와지붕: 앞뒤 경사 + 기와 줄(굴린 점토 막대)
  function tileRoof(b, cx, cz, w, d, eaveY, ridgeY, over) {
    const tile = M('#5d6577', { rough: 0.45 }), tile2 = M('#4c5466', { rough: 0.45 });
    const half = d / 2 + over, run = half, rise = ridgeY - eaveY, ang = Math.atan2(rise, run), L = Math.hypot(rise, run);
    [1, -1].forEach((s) => {
      const mz = cz + s * half / 2, my = (eaveY + ridgeY) / 2;
      b.add(CLAY.rbox(w + over * 2, 0.16, L, 0.07, 0.01, 80 + s), tile2, [cx, my, mz], [s * ang, 0, 0]);
      const n = Math.floor((w + over * 2) / 0.32);
      for (let i = 0; i <= n; i++) { const x = cx - (w / 2 + over) + i * (w + over * 2) / n; b.add(CLAY.capsule(0.07, L - 0.1, 0.006, i), tile, [x, my + Math.cos(ang) * 0.1, mz + s * Math.sin(ang) * 0.0 + -s * 0.0], [Math.PI / 2 + s * ang, 0, 0]); }
    });
    b.add(CLAY.capsule(0.16, w + over * 2 - 0.2, 0.01, 88), tile, [cx, ridgeY + 0.08, cz], [0, 0, Math.PI / 2]);
  }
  function onggi(b, x, z, s, sd) {
    b.add(CLAY.rcyl(0.32 * s, 0.24 * s, 0.6 * s, 0.2 * s, 18, 0.01, sd), M('#6b3b22', { rough: 0.22, ns: 0.35 }), [x, 0.3 * s + 0.12, z]);
    b.add(CLAY.rcyl(0.26 * s, 0.28 * s, 0.08 * s, 0.03, 16, 0.004, sd + 1), M('#5a301c', { rough: 0.25 }), [x, 0.64 * s + 0.12, z]);
  }

  // ---------- 장소 1: 시골집 마당 ----------
  W.farm = function () {
    const g = new THREE.Group(), b = new CLAY.Batch(), cols = [], spots = [];
    CLAY.srand(11);
    ground(b, W.grass, 120); hills(b);
    patch(b, '#e2c99a', 0, -1, 11, 9, 1);     // 흙마당
    patch(b, '#d8bd8c', 0, 12, 2.2, 7, 2);     // 대문 밖 길
    stoneWall(b, cols, -12, -13, 12, 10, [0, 2.2, 10]);
    // 집
    const hx = 0, hz = -8, hw = 9, hd = 4;
    b.add(CLAY.rbox(hw + 0.8, 0.5, hd + 0.8, 0.15, 0.03, 101), M('#b9ad98', { rough: 0.85 }), [hx, 0.25, hz]);      // 기단
    b.add(CLAY.rbox(hw, 2.1, hd, 0.12, 0.02, 102), M('#f3ead8', { rough: 0.7 }), [hx, 1.5, hz]);                      // 흰 벽
    for (let i = 0; i <= 6; i++) b.add(CLAY.rcyl(0.13, 0.14, 2.2, 0.05, 10, 0.01, 110 + i), M('#8a5a36', { rough: 0.55 }), [hx - hw / 2 + i * hw / 6, 1.55, hz + hd / 2 + 0.05]);
    for (let i = 0; i < 6; i++) { // 창호: 창호지 + 나무 살
      const x = hx - hw / 2 + (i + 0.5) * hw / 6;
      b.add(CLAY.rbox(1.0, 1.15, 0.08, 0.03, 0.004, 120 + i), M('#fbf4e2', { rough: 0.8, ns: 0.3 }), [x, 1.55, hz + hd / 2 + 0.06]);
      for (let k = -1; k <= 1; k++) b.add(CLAY.rbox(0.05, 1.15, 0.06, 0.02, 0.002, 130), M('#9a6a42'), [x + k * 0.33, 1.55, hz + hd / 2 + 0.1]);
      for (let k = -1; k <= 1; k++) b.add(CLAY.rbox(1.0, 0.05, 0.06, 0.02, 0.002, 131), M('#9a6a42'), [x, 1.55 + k * 0.38, hz + hd / 2 + 0.1]);
    }
    b.add(CLAY.rbox(hw - 0.4, 0.22, 1.3, 0.06, 0.01, 140), M('#c08a52', { rough: 0.5 }), [hx, 0.62, hz + hd / 2 + 0.7]);  // 마루
    tileRoof(b, hx, hz, hw, hd, 2.75, 4.3, 1.3);
    cols.push(box(hx - hw / 2 - 0.4, hz - hd / 2 - 0.4, hx + hw / 2 + 0.4, hz + hd / 2 + 1.4, 3));
    // 처마 밑 벌집 자리(앞 처마, 옆 처마)
    const ez = hz + hd / 2 + 1.0;
    [-3.4, -0.8, 2.2, 3.8].forEach((x, i) => spots.push({ p: V(x, 2.72, ez), kind: 'hang', id: 'eave' + i }));
    spots.push({ p: V(hx - hw / 2 - 0.9, 2.65, hz + 0.5), kind: 'hang', id: 'eaveSide' });
    spots.push({ p: V(hx + 1.4, 2.62, hz + hd / 2 + 0.3), kind: 'hidden', id: 'eaveIn', hole: V(hx + 1.4, 2.66, ez + 0.25) });
    // 장독대
    b.add(CLAY.rbox(3.2, 0.24, 1.8, 0.1, 0.02, 150), M('#a99c88', { rough: 0.85 }), [7.5, 0.12, -6]);
    [[6.6, -6.4, 1.1], [7.5, -6.4, 1.3], [8.4, -6.4, 1], [7.0, -5.6, 0.9], [8.0, -5.6, 1.05]].forEach(([x, z, s], i) => onggi(b, x, z, s, 160 + i * 2));
    cols.push(box(5.8, -7, 9.2, -5, 1));
    spots.push({ p: V(7.6, 0, -4.4), kind: 'ground', id: 'jar', hole: V(7.6, 0.07, -4.2) });
    // 감나무
    tree(b, -7.5, -2, 2.8, 170, '#ff8a2a'); cols.push(circ(-7.5, -2, 0.35));
    spots.push({ p: V(-6.6, 2.75, -1.4), kind: 'hang', id: 'tree' });
    // 평상
    b.add(CLAY.rbox(2.2, 0.16, 1.5, 0.05, 0.01, 180), M('#c99a62', { rough: 0.5 }), [-6, 0.55, 4]);
    [[-7, 3.35], [-5, 3.35], [-7, 4.65], [-5, 4.65]].forEach(([x, z]) => b.add(CLAY.rcyl(0.06, 0.06, 0.5, 0.02, 8), M('#9a6a42'), [x, 0.25, z]));
    cols.push(box(-7.1, 3.25, -4.9, 4.75, 0.6));
    // 빨랫줄 기둥 + 꽃·덤불·밖 나무
    bush(b, 10, 6, 0.6, 190); bush(b, -10, 7, 0.55, 193); bush(b, 10.5, -11, 0.6, 196);
    flowers(b, 60, 14, 26);
    tree(b, 16, 4, 3.2, 200); tree(b, -17, -8, 3.6, 210); tree(b, -15, 9, 3, 220, '#ffd23a'); tree(b, 18, -12, 3.4, 230);
    b.build(g);
    return { group: g, cols, spots, bounds: { x0: -11.4, z0: -12.4, x1: 11.4, z1: 14 }, truck: { p: V(3.6, 0, 14), r: Math.PI }, npc: { p: V(-3, 0, 2), kind: 'granny' }, start: V(0, 0, 10), kit: V(3.2, 0, -1.0), view: V(0, 0, 0), focus: V(0, 1.8, -4), name: '시골집' };
  };

  W.build = function (id, month) {
    const m = month || 6;
    W.leaf = m >= 10 ? ['#e8822a', '#d8562a', '#f0b030'] : m === 9 ? ['#9cb84a', '#c8b040', '#7fae46'] : ['#6fae4a', '#5f9e40', '#7fbe56'];
    W.bushC = m >= 10 ? ['#b8862e', '#a8642a'] : ['#7db85a', '#6aa84a'];
    W.grass = m >= 10 ? '#b8bf6a' : m === 9 ? '#a8c46a' : '#97c76a';
    return (W[id] || W.farm)();
  };
})();
