// BUY JEJU — 부지 31단계 건물 모양.
// 구글 이미지에서 실제 건물을 하나씩 찾아보고(2026-09-10) 그 건물이 멀리서도 구별되는 특징만 뽑아 코드로 그린다.
// 예: 제주 농가주택 = 낮은 단층 + 파란 지붕 + 현무암 돌담 / 주차빌딩 = 좁고 높은 철골에 층마다 뚫린 개구부.
// estate.js 가 helpers 를 넘겨 준다. 부품 목록(L)은 하나로 합쳐 그리고, 글자·유리·발광은 G 에 따로 붙인다. 정면은 +z.
window.BLDS = function (H) {
  const THREE = window.THREE, T = window.GEO.T;
  const box = H.box, cyl = H.cyl, sign = H.signMesh, win = H.win, gridWall = H.gridWall;
  const LIT = H.LIT, GLASS = H.GLASS_M;

  const C = {
    conc: [0.55, 0.55, 0.56], white: [0.95, 0.94, 0.9], cream: [0.93, 0.88, 0.78], ivory: [0.88, 0.86, 0.8],
    wood: [0.55, 0.4, 0.25], dwood: [0.3, 0.22, 0.15], stone: [0.26, 0.26, 0.28], basalt: [0.2, 0.2, 0.22],
    rblue: [0.18, 0.32, 0.55], rred: [0.5, 0.18, 0.14], rgray: [0.3, 0.31, 0.34],
    grass: [0.34, 0.55, 0.28], asph: [0.2, 0.2, 0.22], sand: [0.85, 0.8, 0.68],
    steel: [0.62, 0.64, 0.68], dark: [0.12, 0.12, 0.14], red: [0.78, 0.14, 0.12], blue: [0.14, 0.33, 0.68],
    yellow: [0.92, 0.75, 0.12], green: [0.12, 0.55, 0.3], water: [0.16, 0.55, 0.8], glass: [0.3, 0.45, 0.55],
    tan: [0.75, 0.68, 0.55], pink: [0.85, 0.35, 0.55], purple: [0.35, 0.2, 0.55],
  };
  const R = (a, b) => a + Math.random() * (b - a);

  // ── 공통 부품 ──
  // 맞배(박공) 지붕: 마루가 z 축을 따라 눕는다
  function gable(L, w, d, h, x, y, z, col) {
    const s = Math.hypot(w / 2, h), a = Math.atan2(h, w / 2);
    L.push({ g: new THREE.BoxGeometry(s, 0.34, d), m: T(x - w / 4, y + h / 2, z, 0, 0, a), c: col },
      { g: new THREE.BoxGeometry(s, 0.34, d), m: T(x + w / 4, y + h / 2, z, 0, 0, -a), c: col });
  }
  // 모임(우진각) 지붕
  const hip = (L, w, d, h, x, y, z, col) => L.push({ g: new THREE.CylinderGeometry(0, Math.max(w, d) * 0.72, h, 4), m: T(x, y + h / 2, z, 0, Math.PI / 4, 0, 1, 1, d / w), c: col });
  // 제주 현무암 돌담 — 마당을 두른다. 크기가 제각각이라야 돌담처럼 보인다
  function stoneWall(L, w, d, y, gapFront) {
    const st = (x, z) => L.push(box(R(0.7, 1.2), R(0.7, 1.1), R(0.7, 1.1), x, y + R(0.3, 0.5), z, R(0.17, 0.3) > 0.24 ? C.basalt : C.stone));
    for (let x = -w / 2; x <= w / 2; x += 1.05) { if (!(gapFront && Math.abs(x) < 2.8)) st(x, d / 2); st(x, -d / 2); }
    for (let z = -d / 2; z <= d / 2; z += 1.05) { st(-w / 2, z); st(w / 2, z); }
  }
  // 흰 목책 울타리(승마장·애견펜션)
  function railFence(L, w, d, y, col) {
    const c = col || [0.93, 0.93, 0.9];
    for (let x = -w / 2; x <= w / 2; x += 2.6) L.push(box(0.16, 1.3, 0.16, x, y + 0.65, d / 2, c), box(0.16, 1.3, 0.16, x, y + 0.65, -d / 2, c));
    for (let z = -d / 2; z <= d / 2; z += 2.6) L.push(box(0.16, 1.3, 0.16, -w / 2, y + 0.65, z, c), box(0.16, 1.3, 0.16, w / 2, y + 0.65, z, c));
    for (const h of [0.5, 1.05]) L.push(box(w, 0.12, 0.1, 0, y + h, d / 2, c), box(w, 0.12, 0.1, 0, y + h, -d / 2, c), box(0.1, 0.12, d, -w / 2, y + h, 0, c), box(0.1, 0.12, d, w / 2, y + h, 0, c));
  }
  const lawn = (L, w, d, x, z) => L.push(box(w, 0.12, d, x, 0.12, z, C.grass));
  const pave = (L, w, d, x, z, col) => L.push(box(w, 0.14, d, x, 0.1, z, col || C.asph));
  // 주차선
  function parkLines(L, w, d, x, z) {
    pave(L, w, d, x, z);
    for (let k = -w / 2 + 1.4; k < w / 2 - 0.6; k += 2.8) L.push(box(0.12, 0.04, d * 0.8, x + k, 0.19, z, [0.9, 0.9, 0.88]));
  }
  // 정면 통유리(1층 점포)
  function shopFront(L, G, w, h, y, z, frame) {
    L.push(box(w + 0.3, h + 0.3, 0.16, 0, y, z - 0.04, frame || C.dark));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), GLASS); gl.position.set(0, y, z + 0.06); G.add(gl);
    G.add(win(w * 0.98, h * 0.9, 0, y, z + 0.02));
  }
  // 나무 한 그루
  function tree(L, x, z, y, s) {
    s = s || 1;
    L.push(cyl(0.18 * s, 0.24 * s, 2.2 * s, x, (y || 0) + 1.1 * s, z, C.dwood, 6),
      { g: new THREE.SphereGeometry(1.5 * s, 8, 6), m: T(x, (y || 0) + 3.2 * s, z, 0, 0, 0, 1, 0.85, 1), c: [0.24, 0.45, 0.24] });
  }
  // 야자수
  function palm(L, x, z, y, s) {
    s = s || 1; const h = 6 * s;
    L.push(cyl(0.16 * s, 0.26 * s, h, x, (y || 0) + h / 2, z, [0.5, 0.42, 0.3], 6));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; L.push({ g: new THREE.BoxGeometry(3.4 * s, 0.12, 0.9 * s), m: T(x + Math.cos(a) * 1.6 * s, (y || 0) + h - 0.2, z + Math.sin(a) * 1.6 * s, 0, -a, 0.22), c: [0.2, 0.5, 0.25] }); }
  }
  // 파라솔
  function parasol(L, x, z, y, col) {
    L.push(cyl(0.06, 0.06, 2.4, x, (y || 0) + 1.2, z, C.steel, 6), { g: new THREE.CylinderGeometry(0, 1.7, 0.7, 8), m: T(x, (y || 0) + 2.55, z), c: col || C.red });
  }
  // 승용차 / 트럭(작게)
  function car(L, x, z, y, ry, col) {
    L.push({ g: new THREE.BoxGeometry(2, 0.75, 4.3), m: T(x, (y || 0) + 0.6, z, 0, ry || 0), c: col || [0.8, 0.8, 0.82] },
      { g: new THREE.BoxGeometry(1.75, 0.62, 2.2), m: T(x, (y || 0) + 1.25, z, 0, ry || 0), c: [0.2, 0.25, 0.3] });
  }
  function truck(L, x, z, y, ry, col) {
    L.push({ g: new THREE.BoxGeometry(2.6, 2.6, 8), m: T(x, (y || 0) + 2, z, 0, ry || 0), c: col || [0.9, 0.9, 0.92] },
      { g: new THREE.BoxGeometry(2.5, 1.8, 2.6), m: T(x + Math.cos(ry || 0) * 0, (y || 0) + 1.6, z + 5.2, 0, ry || 0), c: [0.25, 0.35, 0.6] });
  }
  // 관(튜브) 그리기 — 미끄럼틀·롤러코스터 트랙
  function tube(pts, r, col, seg) {
    const cur = new THREE.CatmullRomCurve3(pts);
    return { g: new THREE.TubeGeometry(cur, seg || 64, r, 6, false), m: T(0, 0, 0), c: col };
  }

  // 상가형 건물 한 채: 층마다 간판 띠가 붙는 한국 근린상가 모양
  // o = { w, d, floors, fh, wall, bands:[{t,bg,fg,glow}], vsign:{t,bg,fg}, glassFront }
  function shopBlock(L, G, o) {
    const w = o.w, d = o.d, n = o.floors, fh = o.fh || 3.4, hgt = n * fh;
    L.push(box(w, hgt, d, 0, hgt / 2, 0, o.wall || C.ivory));
    L.push(box(w + 0.5, 0.35, d + 0.5, 0, hgt + 0.18, 0, C.conc));                      // 옥상 슬래브
    if (o.parapet !== false) for (let k = -1; k <= 1; k += 2) L.push(box(w + 0.5, 0.7, 0.18, 0, hgt + 0.7, k * (d / 2 + 0.2), C.conc));
    if (o.glassFront !== false) shopFront(L, G, w * 0.66, fh * 0.62, fh * 0.45, d / 2 + 0.02);
    L.push(box(1.5, fh * 0.7, 0.12, w * 0.36, fh * 0.35, d / 2 + 0.04, C.dark));         // 출입문
    // 층별 간판 띠
    const bands = o.bands || [];
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i], y = fh * (i + 1) - 0.55;
      L.push(box(w + 0.24, 1.0, 0.24, 0, y, d / 2 + 0.06, C.dark));
      G.add(sign(b.t, b.bg, b.fg, w * 0.94, 0.9, 0, y, d / 2 + 0.2, 0, b.glow !== false));
      if (o.sides) { G.add(sign(b.t, b.bg, b.fg, d * 0.9, 0.9, w / 2 + 0.2, y, 0, Math.PI / 2, b.glow !== false)); L.push(box(0.24, 1.0, d + 0.24, w / 2 + 0.06, y, 0, C.dark)); }
    }
    // 세로 간판
    if (o.vsign) {
      const vh = Math.min(hgt - fh * 0.9, fh * (n - 0.4));
      L.push(box(1.5, vh, 0.3, -w / 2 - 0.55, fh * 0.9 + vh / 2, d / 2 - 0.6, C.dark));
      G.add(sign(o.vsign.t, o.vsign.bg, o.vsign.fg, 1.35, vh * 0.92, -w / 2 - 0.74, fh * 0.9 + vh / 2, d / 2 - 0.6, 0, true));
    }
    // 창
    for (let f = 1; f < n; f++) for (let i = 0; i < Math.max(2, Math.floor(w / 3)); i++) {
      const x = (i - (Math.max(2, Math.floor(w / 3)) - 1) / 2) * (w / Math.max(2, Math.floor(w / 3)) + 0.4);
      G.add(win(1.5, 1.3, x, f * fh + fh * 0.5, d / 2 + 0.03));
      G.add(win(1.5, 1.3, x, f * fh + fh * 0.5, -d / 2 - 0.03, Math.PI));
    }
  }

  // 층 많은 타워(유리 격자 벽)
  function tower(L, G, o) {
    const w = o.w, d = o.d, hgt = o.h, wall = o.wall || [0.86, 0.87, 0.88];
    L.push(box(w, hgt, d, 0, hgt / 2, 0, wall));
    L.push(box(w + 0.9, 0.7, d + 0.9, 0, hgt + 0.35, 0, o.cap || C.conc));
    const rows = Math.max(4, Math.round(hgt / 3.2)), cols = Math.max(4, Math.round(w / 2.4));
    G.add(gridWall(w - 0.6, hgt - 3.6, cols, rows, 0, hgt / 2 + 1.2, d / 2 + 0.02));
    G.add(gridWall(w - 0.6, hgt - 3.6, cols, rows, 0, hgt / 2 + 1.2, -d / 2 - 0.02, Math.PI));
    G.add(gridWall(d - 0.6, hgt - 3.6, Math.max(3, Math.round(d / 2.4)), rows, w / 2 + 0.02, hgt / 2 + 1.2, 0, Math.PI / 2));
    G.add(gridWall(d - 0.6, hgt - 3.6, Math.max(3, Math.round(d / 2.4)), rows, -w / 2 - 0.02, hgt / 2 + 1.2, 0, -Math.PI / 2));
    if (o.podium) { L.push(box(w + 3, o.podium, d + 3, 0, o.podium / 2, 0, o.podCol || [0.4, 0.38, 0.36])); shopFront(L, G, w * 0.7, o.podium * 0.55, o.podium * 0.45, d / 2 + 1.55); }
  }

  const B = {};   // 단계별 건물

  // 1 작은 농가주택 — 낮은 단층, 파란 슬레이트 지붕, 현무암 돌담 마당, 장독대
  B[1] = { size: [11, 10], build(G) {
    const L = [box(8, 2.7, 6.4, 0, 1.35, -0.6, C.cream), box(8, 0.3, 6.4, 0, 0.15, -0.6, C.conc)];
    gable(L, 8.8, 7, 1.5, 0, 2.7, -0.6, C.rblue);
    L.push(box(1.1, 2.1, 0.12, 0, 1.05, 2.66, C.dwood), box(0.7, 1.1, 0.7, 2.5, 3.4, -2.2, C.stone));
    G.add(win(1.3, 1.0, -2.3, 1.7, 2.66)); G.add(win(1.3, 1.0, 2.3, 1.7, 2.66));
    stoneWall(L, 10.6, 9.6, 0.1, true);
    lawn(L, 8, 2.6, 0, 3.3);
    for (const x of [-3.1, -2.2]) L.push(cyl(0.5, 0.4, 0.9, x, 0.6, 3.2, [0.28, 0.22, 0.2], 8));   // 장독대
    tree(L, 3.6, 3.2, 0, 0.8);
    return L; } };

  // 2 소형 카페 — 단층 흰 박스에 큰 통유리, 나무 차양, 야외 테이블
  B[2] = { size: [10, 9], build(G) {
    const L = [box(8.4, 3.3, 6.2, 0, 1.65, -0.8, C.white), box(8.8, 0.35, 6.6, 0, 3.42, -0.8, C.dwood), box(8.4, 0.3, 6.2, 0, 0.15, -0.8, C.conc)];
    shopFront(L, G, 5.4, 2.1, 1.5, 2.34);
    L.push(box(1.1, 2.2, 0.1, 3.0, 1.1, 2.34, C.dwood));
    L.push(box(7.2, 0.12, 2.2, 0, 3.0, 3.4, C.wood), box(0.16, 3.0, 0.16, -3.3, 1.5, 4.4, C.wood), box(0.16, 3.0, 0.16, 3.3, 1.5, 4.4, C.wood));   // 차양
    G.add(sign('CAFE', '#2b2118', '#f6e4bd', 3.4, 0.8, 0, 3.05, 2.4, 0, true));
    pave(L, 9, 3.4, 0, 3.9, C.tan);
    for (const x of [-2.4, 1.4]) { L.push(cyl(0.5, 0.5, 0.06, x, 0.78, 3.9, [0.92, 0.9, 0.86], 12), cyl(0.07, 0.1, 0.72, x, 0.42, 3.9, C.steel, 8)); for (const dz of [-0.85, 0.85]) L.push(box(0.42, 0.06, 0.42, x, 0.5, 3.9 + dz, C.wood), box(0.05, 0.5, 0.05, x, 0.25, 3.9 + dz, C.steel)); }
    return L; } };

  // 3 작은 펜션 — 2층 박공에 발코니, 잔디 마당
  B[3] = { size: [12, 10], build(G) {
    const L = [box(9.4, 6.2, 7, 0, 3.1, -0.8, C.white), box(9.4, 0.3, 7, 0, 0.15, -0.8, C.conc)];
    gable(L, 10.2, 7.6, 2.1, 0, 6.2, -0.8, C.rgray);
    L.push(box(9.6, 0.22, 2.0, 0, 3.3, 3.2, C.wood));                         // 2층 발코니 바닥
    for (let x = -4.4; x <= 4.4; x += 0.8) L.push(box(0.1, 0.9, 0.1, x, 3.75, 4.1, C.white));
    L.push(box(9.6, 0.1, 0.1, 0, 4.2, 4.1, C.white));
    L.push(box(1.3, 2.3, 0.12, 0, 1.15, 2.76, C.dwood));
    for (const x of [-3.0, 3.0]) { G.add(win(1.8, 1.4, x, 1.9, 2.76)); G.add(win(1.8, 1.4, x, 4.7, 2.76)); }
    G.add(sign('PENSION', '#ffffff', '#2c3b46', 3.0, 0.7, 0, 2.9, 4.16, 0, false));
    lawn(L, 10, 3.2, 0, 4.4);
    tree(L, -4.2, 4.4, 0, 0.9); tree(L, 4.2, 4.6, 0, 0.7);
    return L; } };

  // 4 제주 식당 — 2층 상가에 큼직한 빨간 간판, 차양, 통유리
  B[4] = { size: [12, 10], build(G) {
    const L = [];
    shopBlock(L, G, { w: 10, d: 7.4, floors: 2, fh: 3.3, wall: [0.9, 0.88, 0.84], sides: true,
      bands: [{ t: '제주 향토음식', bg: '#c2201c', fg: '#ffffff' }, { t: '전복뚝배기 · 갈치조림', bg: '#1d4f8a', fg: '#ffffff' }] });
    L.push(box(10.4, 0.16, 1.6, 0, 2.35, 4.4, C.red));                         // 차양
    for (const x of [-4.6, 4.6]) L.push(box(0.14, 2.3, 0.14, x, 1.15, 5.1, C.steel));
    pave(L, 11, 2.6, 0, 5.6);
    car(L, -3.2, 5.6, 0, 0, [0.85, 0.85, 0.88]);
    return L; } };

  // 5 승마체험장 — 흰 목책 마장이 주인공, 붉은 지붕 마구간, 건초더미, 말
  B[5] = { size: [24, 22], build(G) {
    const L = [];
    lawn(L, 22, 13, 0, 3.5);
    L.push(box(15, 0.14, 11, 0, 0.16, 3.5, [0.62, 0.5, 0.36]));                // 모래 마장
    railFence(L, 21, 20, 0.1);
    const bx = -6.5, bz = -7;
    L.push(box(11, 3.4, 5.6, bx, 1.7, bz, [0.95, 0.93, 0.88]), box(11, 0.3, 5.6, bx, 0.15, bz, C.conc));
    gable(L, 11.6, 6.2, 1.9, bx, 3.4, bz, C.rred);
    for (const dx of [-3.4, 0, 3.4]) { L.push(box(2.2, 2.4, 0.12, bx + dx, 1.2, bz + 2.86, C.dwood)); G.add(win(2.0, 0.7, bx + dx, 2.5, bz + 2.9)); }   // 마방 문
    G.add(sign('승마체험장', '#3b2a1c', '#ffe9b0', 4.6, 0.9, bx, 4.2, bz + 3.0, 0, true));
    for (let k = 0; k < 3; k++) L.push(cyl(0.9, 0.9, 1.1, 6.5 + k * 0.3, 0.65, -7.5 + k * 2.1, [0.78, 0.68, 0.35], 10));   // 건초 롤
    // 말 두 마리
    const horse = (x, z, ry, col) => {
      L.push({ g: new THREE.BoxGeometry(0.9, 1.1, 2.4), m: T(x, 1.5, z, 0, ry), c: col },
        { g: new THREE.BoxGeometry(0.55, 1.1, 0.7), m: T(x - Math.sin(ry) * 1.3, 2.1, z - Math.cos(ry) * 1.3, 0.5, ry), c: col },
        { g: new THREE.BoxGeometry(0.5, 0.5, 0.9), m: T(x - Math.sin(ry) * 1.7, 2.5, z - Math.cos(ry) * 1.7, 0, ry), c: col });
      for (const dx of [-0.32, 0.32]) for (const dz of [-0.85, 0.85]) L.push({ g: new THREE.BoxGeometry(0.24, 1.0, 0.24), m: T(x + dx * Math.cos(ry) - dz * Math.sin(ry), 0.5, z - dx * Math.sin(ry) + dz * Math.cos(ry)), c: col });
    };
    horse(-2, 4.5, 0.6, [0.32, 0.22, 0.16]); horse(3.5, 1.5, -1.1, [0.55, 0.42, 0.3]);
    return L; } };

  // 6 게스트하우스 — 3층 파란 박스, 옥상 테라스, 자전거 거치대
  B[6] = { size: [13, 11], build(G) {
    const L = [box(10.4, 9.6, 8, 0, 4.8, 0, [0.2, 0.42, 0.68]), box(10.4, 0.3, 8, 0, 0.15, 0, C.conc),
      box(11, 0.4, 8.6, 0, 9.8, 0, C.conc)];
    L.push(box(3.4, 3.2, 0.4, -3.2, 1.6, 4.2, C.white));                       // 1층 흰 라운지
    shopFront(L, G, 3.6, 2.0, 1.5, 4.06);
    L.push(box(1.3, 2.3, 0.12, 3.2, 1.15, 4.06, C.dwood));
    for (const f of [1, 2]) for (const x of [-3.2, 0, 3.2]) { G.add(win(1.6, 1.4, x, f * 3.2 + 1.7, 4.03)); G.add(win(1.6, 1.4, x, f * 3.2 + 1.7, -4.03, Math.PI)); }
    for (let x = -4.8; x <= 4.8; x += 0.9) L.push(box(0.1, 0.9, 0.1, x, 10.4, 4.2, C.white));   // 옥상 난간
    L.push(box(10.6, 0.1, 0.1, 0, 10.8, 4.2, C.white));
    G.add(sign('GUEST HOUSE', '#0f2a44', '#ffe08a', 6.2, 1.0, 0, 8.6, 4.12, 0, true));
    pave(L, 11, 2.4, 0, 5.6, C.tan);
    for (const x of [-4, -3.2, -2.4]) L.push(cyl(0.55, 0.55, 0.1, x, 0.5, 5.4, [0.2, 0.2, 0.22], 10), box(0.1, 0.9, 1.5, x, 0.9, 5.4, [0.3, 0.5, 0.7]));   // 자전거
    return L; } };

  // 7 소형 상가 — 2층, 1층 점포 통유리 + 세로 간판
  B[7] = { size: [13, 11], build(G) {
    const L = [];
    shopBlock(L, G, { w: 11, d: 8.4, floors: 2, fh: 3.5, wall: [0.82, 0.8, 0.78],
      bands: [{ t: '상가', bg: '#233a52', fg: '#ffffff' }, { t: '사무실 임대', bg: '#f0f0ec', fg: '#333333', glow: false }],
      vsign: { t: '상가', bg: '#c2201c', fg: '#ffffff' } });
    parkLines(L, 11, 3, 0, 6);
    car(L, 2.6, 6, 0, 0, [0.3, 0.35, 0.5]);
    return L; } };

  // 8 흑돼지 식당 — 검은 벽, 큰 빨간 간판, 돌담과 파라솔
  B[8] = { size: [14, 12], build(G) {
    const L = [box(11, 4.2, 8, 0, 2.1, -0.6, [0.16, 0.15, 0.15]), box(11, 0.3, 8, 0, 0.15, -0.6, C.conc)];
    gable(L, 11.8, 8.6, 1.6, 0, 4.2, -0.6, C.dark);
    L.push(box(11.4, 1.2, 0.3, 0, 3.6, 3.5, C.dark));
    G.add(sign('제주 흑돼지', '#b3120f', '#ffe14d', 10.4, 1.1, 0, 3.6, 3.68, 0, true));
    G.add(sign('흑돼지', '#b3120f', '#ffe14d', 7.4, 1.1, 5.6, 3.6, -0.6, Math.PI / 2, true));
    shopFront(L, G, 5.6, 2.2, 1.6, 3.44);
    L.push(box(1.4, 2.4, 0.12, 3.6, 1.2, 3.44, C.dwood));
    L.push(cyl(0.5, 0.6, 3.4, -4.6, 5.6, -3.2, C.stone, 8));                   // 굴뚝
    stoneWall(L, 13.4, 11.4, 0.1, true);
    for (const x of [-3.4, 0.4]) parasol(L, x, 4.6, 0, C.red);
    pave(L, 12, 2.4, 0, 5.2, C.tan);
    return L; } };

  // 9 애견펜션 — 단층 흰 건물 + 울타리 친 잔디 마당 + 미끄럼틀 + 작은 수영장
  B[9] = { size: [17, 15], build(G) {
    const L = [box(10, 3.6, 6.4, -2.5, 1.8, -3.6, C.white), box(10, 0.3, 6.4, -2.5, 0.15, -3.6, C.conc)];
    gable(L, 10.6, 7, 1.7, -2.5, 3.6, -3.6, [0.35, 0.62, 0.82]);
    L.push(box(1.3, 2.3, 0.12, -2.5, 1.15, -0.36, C.dwood));
    G.add(win(2.0, 1.4, -5.6, 1.9, -0.36)); G.add(win(2.0, 1.4, 0.6, 1.9, -0.36));
    G.add(sign('애견펜션', '#ffffff', '#e07aa8', 4.2, 0.9, -2.5, 4.3, -0.3, 0, true));
    lawn(L, 15, 8, 0, 3.4);
    railFence(L, 15.6, 13.6, 0.1, [0.95, 0.95, 0.92]);
    // 미끄럼틀
    L.push(box(2.2, 0.2, 2.2, 4.6, 2.1, 2.2, [0.95, 0.75, 0.2]), box(0.2, 2.1, 0.2, 3.7, 1.05, 1.3, C.steel), box(0.2, 2.1, 0.2, 5.5, 1.05, 1.3, C.steel),
      { g: new THREE.BoxGeometry(1.8, 0.16, 3.6), m: T(4.6, 1.2, 4.4, 0.55, 0, 0), c: [0.9, 0.35, 0.3] });
    // 물놀이 통
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x3ab8e8, roughness: 0.15, metalness: 0.2 }));
    pool.position.set(-4.6, 0.42, 4.2); G.add(pool);
    L.push(cyl(2.05, 2.05, 0.5, -4.6, 0.25, 4.2, [0.9, 0.9, 0.88], 16));
    for (const [x, z] of [[1.2, 5.2], [-1.6, 2.2]]) L.push(box(0.7, 0.5, 1.2, x, 0.42, z, [0.85, 0.78, 0.6]), box(0.45, 0.45, 0.45, x, 0.85, z - 0.7, [0.85, 0.78, 0.6]));   // 강아지
    return L; } };

  // 10 캠핑장 — 데크 사이트마다 텐트, 목조 관리동, 모닥불
  B[10] = { size: [21, 19], build(G) {
    const L = [box(7, 3, 5, -6, 1.5, -6, C.wood), box(7, 0.3, 5, -6, 0.15, -6, C.conc)];
    gable(L, 7.6, 5.6, 1.5, -6, 3, -6, C.dwood);
    G.add(sign('CAMPING', '#2f2417', '#ffe9b0', 3.4, 0.7, -6, 2.6, -3.3, 0, true));
    G.add(win(1.4, 1.0, -7.6, 1.7, -3.36));
    lawn(L, 19, 12, 1, 3);
    const site = (x, z, col) => {
      L.push(box(5.4, 0.25, 5.4, x, 0.25, z, C.wood));                          // 나무 데크
      L.push({ g: new THREE.CylinderGeometry(0, 2.5, 2.6, 4), m: T(x, 1.7, z, 0, Math.PI / 4, 0, 1, 1, 1.35), c: col });   // 텐트
      L.push(cyl(0.55, 0.7, 0.35, x + 2.4, 0.5, z + 2.3, C.stone, 8), cyl(0.1, 0.1, 0.7, x + 2.4, 0.7, z + 2.3, [0.85, 0.4, 0.15], 6));
    };
    site(-4, 4, [0.2, 0.45, 0.35]); site(3, 5, [0.65, 0.3, 0.2]); site(6.5, -3, [0.25, 0.3, 0.55]);
    tree(L, -8.5, 6, 0, 1.2); tree(L, 8.5, 7, 0, 1.0); tree(L, 8, -7.5, 0, 1.1);
    car(L, -0.5, -6.5, 0, 0.3, [0.8, 0.82, 0.85]);
    return L; } };

  // 11 글램핑장 — 흰 돔 텐트 여러 개 + 데크 + 벨텐트
  B[11] = { size: [21, 19], build(G) {
    const L = [box(6, 2.8, 4.6, -7, 1.4, -6.4, C.white), box(6, 0.3, 4.6, -7, 0.15, -6.4, C.conc)];
    gable(L, 6.6, 5.2, 1.3, -7, 2.8, -6.4, C.rgray);
    G.add(sign('GLAMPING', '#ffffff', '#2b6a86', 3.4, 0.7, -7, 2.4, -3.9, 0, true));
    lawn(L, 19, 13, 1, 3);
    const dome = (x, z) => {
      L.push(box(6.4, 0.25, 6.4, x, 0.25, z, C.wood));
      L.push({ g: new THREE.SphereGeometry(2.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), m: T(x, 0.35, z), c: [0.93, 0.93, 0.92] });
      const gl = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), GLASS); gl.position.set(x, 1.7, z + 2.63); G.add(gl);
      G.add(win(2.4, 1.8, x, 1.7, z + 2.58));
      for (const dx of [-2, 2]) L.push(cyl(0.5, 0.5, 0.06, x + dx, 0.9, z + 3.6, [0.9, 0.9, 0.88], 10), cyl(0.06, 0.08, 0.6, x + dx, 0.6, z + 3.6, C.steel, 6));
    };
    dome(-2.5, 3.5); dome(5.5, 4); dome(6, -4.5);
    L.push({ g: new THREE.CylinderGeometry(0.15, 3.1, 3.6, 12), m: T(-2, 1.8, -5.5), c: [0.9, 0.88, 0.84] });   // 벨텐트
    palm(L, -9, 5, 0, 0.9); tree(L, 9, 8, 0, 1.0);
    return L; } };

  // 12 대형 카페 — 2층 노출콘크리트 박스, 통유리 전면, 옥상 테라스, 주차장
  B[12] = { size: [18, 16], build(G) {
    const L = [box(14, 7.4, 10, 0, 3.7, -1, [0.62, 0.61, 0.58]), box(14, 0.3, 10, 0, 0.15, -1, C.conc),
      box(15, 0.5, 11, 0, 7.6, -1, [0.5, 0.5, 0.5])];
    // 2층 높이 통유리
    for (const y of [1.9, 5.3]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.8), GLASS); gl.position.set(0, y, 4.06); G.add(gl); G.add(win(10.8, 2.6, 0, y, 4.02)); }
    L.push(box(11.6, 0.25, 0.25, 0, 3.6, 4.08, C.dark), box(0.25, 6.6, 0.25, -5.8, 3.5, 4.08, C.dark), box(0.25, 6.6, 0.25, 5.8, 3.5, 4.08, C.dark));
    L.push(box(1.6, 2.6, 0.12, 4.4, 1.3, 4.08, C.dark));
    for (let x = -7; x <= 7; x += 1.1) L.push(box(0.1, 0.9, 0.1, x, 8.3, 4, [0.9, 0.9, 0.88]));   // 옥상 난간
    L.push(box(15, 0.1, 0.1, 0, 8.75, 4, [0.9, 0.9, 0.88]));
    G.add(sign('CAFE', '#1e1a16', '#f3e2bb', 5.0, 1.1, 0, 6.9, 4.12, 0, true));
    parkLines(L, 16, 4, 0, 7);
    car(L, -4.5, 7, 0, 0, [0.85, 0.85, 0.88]); car(L, 1.5, 7, 0, 0, [0.2, 0.22, 0.3]);
    palm(L, -7.6, 5.5, 0, 0.9);
    return L; } };

  // 13 원룸 건물 — 5층 회색 박스, 규칙적인 창, 1층 필로티 주차
  B[13] = { size: [13, 12], build(G) {
    const L = [box(10.6, 15, 9, 0, 9, 0, [0.78, 0.78, 0.76]), box(11.2, 0.5, 9.6, 0, 16.7, 0, C.conc), box(11, 0.3, 9, 0, 0.15, 0, C.conc)];
    for (const [x, z] of [[-4.6, 3.8], [4.6, 3.8], [-4.6, -3.8], [4.6, -3.8], [0, -3.8]]) L.push(box(0.7, 1.5, 0.7, x, 0.75, z, C.conc));   // 필로티 기둥
    G.add(gridWall(10, 13, 4, 5, 0, 9.2, 4.53));
    G.add(gridWall(10, 13, 4, 5, 0, 9.2, -4.53, Math.PI));
    G.add(gridWall(8.4, 13, 3, 5, 5.33, 9.2, 0, Math.PI / 2));
    G.add(gridWall(8.4, 13, 3, 5, -5.33, 9.2, 0, -Math.PI / 2));
    L.push(box(1.6, 2.2, 0.12, -3.4, 1.1, 4.56, C.dark));                        // 현관
    L.push(box(1.6, 15, 1.6, 5.9, 8, -3, [0.7, 0.7, 0.68]));                     // 계단실
    car(L, 2.4, 1.5, 0, 0, [0.75, 0.75, 0.78]); car(L, -0.8, 1.5, 0, 0, [0.25, 0.3, 0.4]);
    return L; } };

  // 14 3층 상가 — 층마다 간판, 1층 점포
  B[14] = { size: [14, 12], build(G) {
    const L = [];
    shopBlock(L, G, { w: 12, d: 9, floors: 3, fh: 3.5, wall: [0.86, 0.85, 0.82], sides: true,
      bands: [{ t: '편의점 · 약국', bg: '#0e8a44', fg: '#ffffff' }, { t: '미용실 · 세탁', bg: '#1d4f8a', fg: '#ffffff' }, { t: '사무실', bg: '#f2f2ee', fg: '#3a3a3a', glow: false }],
      vsign: { t: '임대', bg: '#c2201c', fg: '#ffffff' } });
    parkLines(L, 12, 3.2, 0, 6.6);
    car(L, -3.4, 6.6, 0, 0, [0.9, 0.9, 0.9]);
    return L; } };

  // 15 스크린골프장 — 노란 대형 간판, 골프공 조형, 3층 상가
  B[15] = { size: [15, 13], build(G) {
    const L = [];
    shopBlock(L, G, { w: 12.4, d: 9.4, floors: 3, fh: 3.6, wall: [0.28, 0.3, 0.34], sides: true,
      bands: [{ t: 'SCREEN GOLF', bg: '#f2c200', fg: '#111111' }, { t: '스크린골프 24시', bg: '#111111', fg: '#f2c200' }, { t: '연습장 · 레슨', bg: '#1d4f8a', fg: '#ffffff' }],
      vsign: { t: 'GOLF', bg: '#f2c200', fg: '#111111' } });
    L.push({ g: new THREE.SphereGeometry(1.7, 14, 10), m: T(4.2, 12.4, 0), c: [0.96, 0.96, 0.94] }, cyl(0.2, 0.3, 1.6, 4.2, 11.2, 0, C.steel, 8));   // 옥상 골프공
    L.push(box(0.16, 5, 0.16, -4.4, 13.3, 0, C.steel), { g: new THREE.BoxGeometry(1.6, 0.9, 0.06), m: T(-3.6, 15.4, 0), c: [0.9, 0.2, 0.2] });        // 깃대
    parkLines(L, 12, 3.2, 0, 7);
    return L; } };

  // 16 피트니스센터 — 검은 유리 파사드에 흰 GYM 간판
  B[16] = { size: [15, 13], build(G) {
    const L = [box(12.4, 11.4, 9.4, 0, 5.7, 0, [0.14, 0.14, 0.16]), box(13, 0.45, 10, 0, 11.6, 0, [0.2, 0.2, 0.22]), box(12.4, 0.3, 9.4, 0, 0.15, 0, C.conc)];
    for (const y of [2.2, 5.6, 9.0]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.6), GLASS); gl.position.set(0, y, 4.76); G.add(gl); G.add(win(10.8, 2.4, 0, y, 4.72)); }
    L.push(box(11.4, 0.25, 0.3, 0, 3.9, 4.78, C.dark), box(11.4, 0.25, 0.3, 0, 7.3, 4.78, C.dark));
    G.add(sign('FITNESS', '#101012', '#ffffff', 9.4, 1.6, 0, 12.5, 0.2, 0, true));
    G.add(sign('FITNESS', '#101012', '#ffffff', 9.4, 1.6, 0, 12.5, -0.2, Math.PI, true));
    L.push(box(9.6, 1.8, 0.35, 0, 12.5, 0, C.dark));
    G.add(sign('24H GYM', '#e8e8e8', '#141414', 3.2, 0.8, -4.2, 1.2, 4.8, 0, true));
    L.push(box(1.8, 2.6, 0.12, 3.8, 1.3, 4.76, C.dark));
    parkLines(L, 12, 3, 0, 6.8);
    return L; } };

  // 17 노래방 건물 — 밤에 번쩍이는 네온 세로 간판
  B[17] = { size: [14, 12], build(G) {
    const L = [];
    shopBlock(L, G, { w: 11.4, d: 9, floors: 3, fh: 3.5, wall: [0.2, 0.18, 0.24], sides: true,
      bands: [{ t: '동전노래방', bg: '#7a1f8f', fg: '#ffe14d' }, { t: 'NORAEBANG', bg: '#c2107a', fg: '#ffffff' }, { t: '룸 30개 · 24시', bg: '#1a1030', fg: '#5ce1ff' }],
      vsign: { t: '노래방', bg: '#c2107a', fg: '#ffe14d' } });
    // 벽면 네온 띠
    for (const y of [4.4, 7.9]) L.push(box(11.6, 0.2, 0.2, 0, y, 4.62, [0.9, 0.2, 0.6]));
    for (const x of [-5.7, 5.7]) L.push(box(0.2, 10.4, 0.2, x, 5.4, 4.62, [0.3, 0.85, 1]));
    G.add(sign('COIN', '#120a1e', '#5ce1ff', 3.4, 1.0, 3.3, 1.5, 4.66, 0, true));
    return L; } };

  // 18 PC방 건물 — 층마다 큼직한 파랑·빨강 간판에 대문자 PC
  B[18] = { size: [14, 12], build(G) {
    const L = [];
    shopBlock(L, G, { w: 11.6, d: 9, floors: 3, fh: 3.6, wall: [0.72, 0.73, 0.75], sides: true,
      bands: [{ t: 'PC방 2F', bg: '#123f9c', fg: '#ffffff' }, { t: 'PC ZONE', bg: '#c2201c', fg: '#ffffff' }, { t: '24시 · 좌석 80', bg: '#111111', fg: '#5ce1ff' }],
      vsign: { t: 'PC', bg: '#123f9c', fg: '#ffffff' } });
    L.push(box(4.6, 2.4, 0.3, 2.6, 12.2, 0, C.dark));
    G.add(sign('PC', '#123f9c', '#ffffff', 4.4, 2.2, 2.6, 12.2, 0.2, 0, true));
    parkLines(L, 11, 3, 0, 6.6);
    return L; } };

  // 19 병원 건물 — 흰 5층 박스, 빨간 십자와 응급 캐노피, 구급차
  B[19] = { size: [17, 15], build(G) {
    const L = [];
    tower(L, G, { w: 13, d: 10.4, h: 17.5, wall: [0.94, 0.94, 0.92], cap: [0.75, 0.76, 0.78] });
    L.push(box(14.4, 3.6, 3.4, 0, 1.8, 6.4, [0.88, 0.9, 0.92]));                 // 현관 캐노피
    for (const x of [-6.2, 6.2]) L.push(box(0.4, 3.6, 0.4, x, 1.8, 7.8, C.conc));
    shopFront(L, G, 6.4, 2.4, 1.5, 5.24);
    G.add(sign('제주 종합병원', '#ffffff', '#1a5fa8', 8.4, 1.2, 0, 15.4, 5.26, 0, true));
    L.push(box(8.6, 1.4, 0.25, 0, 15.4, 5.2, [0.9, 0.9, 0.92]));
    // 빨간 십자
    L.push(box(2.8, 0.9, 0.25, -4.4, 4.4, 5.26, C.red), box(0.9, 2.8, 0.25, -4.4, 4.4, 5.26, C.red));
    G.add(sign('응급의료센터', '#c2100f', '#ffffff', 5.2, 1.0, 3.6, 3.9, 5.26, 0, true));
    // 구급차
    L.push(box(2.4, 2.3, 5.6, 5.4, 1.8, 9.2, [0.96, 0.96, 0.96]), box(2.3, 1.4, 2.2, 5.4, 1.4, 12.6, [0.9, 0.9, 0.92]), box(2.5, 0.5, 5.7, 5.4, 2.4, 9.2, C.red));
    parkLines(L, 9, 3.4, -4.5, 9.4);
    return L; } };

  // 20 학원 건물 — 층마다 간판 띠, 유리 계단실
  B[20] = { size: [16, 14], build(G) {
    const L = [];
    shopBlock(L, G, { w: 13, d: 10, floors: 5, fh: 3.4, wall: [0.9, 0.89, 0.86], sides: true,
      bands: [{ t: '수학 전문학원', bg: '#123f9c', fg: '#ffffff' }, { t: '영어 어학원', bg: '#0e8a44', fg: '#ffffff' },
        { t: '입시 종합반', bg: '#c2201c', fg: '#ffffff' }, { t: '피아노 · 미술', bg: '#7a3f9c', fg: '#ffffff' }, { t: '독서실', bg: '#2a2a2c', fg: '#ffe14d' }] });
    // 유리 계단실
    L.push(box(2.6, 17, 2.6, 6.4, 8.5, 3.2, [0.35, 0.45, 0.55]));
    G.add(gridWall(2.4, 15.4, 1, 5, 6.4, 8.6, 4.52));
    G.add(sign('학원', '#ffffff', '#123f9c', 2.2, 1.6, 7.72, 15.4, 3.2, Math.PI / 2, true));
    return L; } };

  // 21 오피스텔 — 12층 유리 타워, 저층부 상가
  B[21] = { size: [17, 15], build(G) {
    const L = [];
    tower(L, G, { w: 12.4, d: 10, h: 28, wall: [0.55, 0.6, 0.66], cap: [0.35, 0.37, 0.4], podium: 4.2, podCol: [0.32, 0.33, 0.36] });
    for (let f = 1; f < 8; f++) L.push(box(13.2, 0.3, 0.8, 0, 4.2 + f * 3.2, 5.2, [0.75, 0.76, 0.78]));   // 발코니 띠
    G.add(sign('OFFICETEL', '#141820', '#ffe08a', 8.4, 1.6, 0, 30.4, 0.2, 0, true));
    G.add(sign('OFFICETEL', '#141820', '#ffe08a', 8.4, 1.6, 0, 30.4, -0.2, Math.PI, true));
    L.push(box(8.6, 1.8, 0.35, 0, 30.4, 0, C.dark));
    parkLines(L, 12, 3, 0, 8.4);
    return L; } };

  // 22 주차빌딩 — 좁고 높은 철골, 층마다 뻥 뚫린 개구부에 차가 보인다
  B[22] = { size: [15, 17], build(G) {
    const L = [], w = 11.5, d = 13, fl = 8, fh = 3.1;
    L.push(box(w, 0.35, d, 0, 0.18, 0, C.conc));
    for (let f = 0; f <= fl; f++) L.push(box(w, 0.45, d, 0, f * fh + 0.4, 0, [0.72, 0.72, 0.7]));          // 바닥판
    for (const [x, z] of [[-w / 2 + 0.5, -d / 2 + 0.5], [w / 2 - 0.5, -d / 2 + 0.5], [-w / 2 + 0.5, d / 2 - 0.5], [w / 2 - 0.5, d / 2 - 0.5], [0, -d / 2 + 0.5], [0, d / 2 - 0.5]])
      L.push(box(0.9, fl * fh, 0.9, x, fl * fh / 2, z, [0.66, 0.66, 0.64]));                               // 기둥
    for (let f = 1; f <= fl; f++) for (const s of [1, -1]) L.push(box(w, 0.5, 0.25, 0, f * fh + 1.5, s * (d / 2 - 0.1), C.steel));   // 난간
    L.push(box(3, fl * fh + 1.4, 3, -w / 2 + 1.4, (fl * fh) / 2, d / 2 - 1.6, [0.5, 0.52, 0.56]));         // 승강기 코어
    for (let f = 0; f < fl; f++) { const n = 2 + (f % 2); for (let i = 0; i < n; i++) car(L, -3 + i * 3.4, (f % 2 ? 3 : -3), f * fh + 0.6, 0, [R(0.2, 0.9), R(0.2, 0.9), R(0.3, 0.9)]); }
    G.add(sign('P', '#123f9c', '#ffffff', 3.2, 3.2, 0, fl * fh + 3.4, 0.2, 0, true));
    L.push(box(3.4, 3.4, 0.3, 0, fl * fh + 3.4, 0, C.dark), box(0.4, 3.6, 0.4, 0, fl * fh + 1.6, 0, C.steel));
    L.push(box(4.6, 0.16, 6, w / 2 - 2.6, 0.5, d / 2 + 3, C.asph));                                        // 진입 램프
    return L; } };

  // 23 물류센터 — 길고 낮은 창고, 정면에 도크 문이 줄줄이, 트럭
  B[23] = { size: [32, 18], build(G) {
    const L = [box(28, 9, 13, 0, 4.5, -1.5, [0.82, 0.84, 0.86]), box(28, 0.3, 13, 0, 0.15, -1.5, C.conc)];
    L.push(box(28.8, 0.6, 13.8, 0, 9.2, -1.5, [0.55, 0.6, 0.66]));
    for (let x = -12.6; x <= 12.6; x += 2.2) L.push(box(0.25, 9, 0.25, x, 4.5, 5.02, [0.68, 0.7, 0.72]));   // 세로 골 패널
    L.push(box(28.4, 1.6, 0.3, 0, 7.8, 5.1, C.blue));
    G.add(sign('JEJU LOGISTICS', '#123f9c', '#ffffff', 20, 1.5, 0, 7.8, 5.28, 0, true));
    // 도크 문 6개 + 범퍼
    for (let i = 0; i < 6; i++) { const x = -11 + i * 4.4;
      L.push(box(3.4, 4, 0.3, x, 2.2, 5.06, [0.35, 0.37, 0.4]));
      for (let k = 0; k < 5; k++) L.push(box(3.2, 0.12, 0.12, x, 0.8 + k * 0.75, 5.24, [0.55, 0.57, 0.6]));
      L.push(box(0.5, 0.4, 0.4, x - 1.5, 0.6, 5.35, C.dark), box(0.5, 0.4, 0.4, x + 1.5, 0.6, 5.35, C.dark)); }
    pave(L, 30, 12, 0, 11.5);
    truck(L, -8, 9.5, 0, 0, [0.95, 0.95, 0.95]); truck(L, 3, 10, 0, 0, [0.3, 0.55, 0.8]);
    for (const [x, z] of [[12, 8], [13.5, 10]]) L.push(box(1.2, 1.2, 1.2, x, 0.7, z, [0.75, 0.55, 0.25]));   // 팔레트 더미
    return L; } };

  // 24 리조트 — 5층 객실동 + 야외 수영장 + 야자수
  B[24] = { size: [28, 24], build(G) {
    const L = [box(24, 15, 11, 0, 7.5, -5, [0.96, 0.94, 0.9]), box(25, 0.8, 12, 0, 15.4, -5, [0.6, 0.45, 0.3]), box(24, 0.3, 11, 0, 0.15, -5, C.conc)];
    G.add(gridWall(23, 12.6, 10, 5, 0, 7.6, 0.52));
    G.add(gridWall(23, 12.6, 10, 5, 0, 7.6, -10.52, Math.PI));
    for (let f = 0; f < 5; f++) L.push(box(24.4, 0.25, 1.2, 0, 1.8 + f * 2.9, 1.1, [0.85, 0.83, 0.8]));      // 발코니
    L.push(box(6, 4, 3.4, 0, 2, 2.2, [0.9, 0.88, 0.84]));
    shopFront(L, G, 4.6, 2.4, 1.5, 3.94);
    G.add(sign('RESORT', '#ffffff', '#1f6d90', 10, 1.6, 0, 16.8, -4.8, 0, true));
    L.push(box(10.2, 1.8, 0.35, 0, 16.8, -5, [0.4, 0.42, 0.45]));
    // 수영장 + 데크
    pave(L, 24, 12, 0, 7.5, C.sand);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ color: 0x3ab8e8, emissive: 0x1a6a90, emissiveIntensity: 0.25, roughness: 0.12, metalness: 0.2 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.45, 7.5); G.add(pool);
    L.push(box(16.6, 0.5, 8.6, 0, 0.3, 7.5, [0.92, 0.92, 0.9]));
    for (const x of [-9.5, 9.5]) { palm(L, x, 6, 0, 1.1); palm(L, x * 0.7, 12.5, 0, 0.9); }
    for (const x of [-6, -3, 0, 3, 6]) L.push(box(1.7, 0.12, 0.65, x, 0.6, 12, [0.95, 0.95, 0.9]), box(1.7, 0.6, 0.06, x, 0.85, 12.3, [0.95, 0.95, 0.9]));
    return L; } };

  // 25 대형 쇼핑몰 — 넓은 박스에 곡면 유리 코너, 대형 로고, 주차 데크
  B[25] = { size: [30, 24], build(G) {
    const L = [box(26, 13, 17, 0, 6.5, -2, [0.86, 0.86, 0.85]), box(27, 0.8, 18, 0, 13.4, -2, [0.6, 0.6, 0.62]), box(26, 0.3, 17, 0, 0.15, -2, C.conc)];
    L.push(cyl(5.2, 5.2, 14, -13, 7, 4.5, [0.45, 0.55, 0.62], 20));                                          // 유리 원통 코너
    L.push(cyl(5.5, 5.5, 0.6, -13, 14.2, 4.5, [0.55, 0.55, 0.58], 20));
    for (let f = 0; f < 4; f++) G.add(gridWall(24, 2.2, 12, 1, 0, 2.6 + f * 3.1, 6.52));
    shopFront(L, G, 9, 4.4, 2.6, 6.56);
    G.add(sign('JEJU MALL', '#1b1f2a', '#ffd54a', 14, 2.4, 0, 11.4, 6.6, 0, true));
    L.push(box(14.4, 2.8, 0.4, 0, 11.4, 6.5, C.dark));
    G.add(sign('SHOPPING', '#ffffff', '#c2201c', 8, 1.4, -13, 15.4, 4.5, 0, true));
    // 주차 데크(2층)
    L.push(box(14, 0.5, 9, 8, 3.4, 12, [0.7, 0.7, 0.68]), box(14, 0.5, 9, 8, 6.6, 12, [0.7, 0.7, 0.68]));
    for (const [x, z] of [[1.4, 8], [14.6, 8], [1.4, 16], [14.6, 16], [8, 8], [8, 16]]) L.push(box(0.7, 6.4, 0.7, x, 3.2, z, C.conc));
    for (let i = 0; i < 4; i++) car(L, 3 + i * 3, 12, 3.7, 0, [R(0.2, 0.9), R(0.2, 0.9), R(0.3, 0.9)]);
    parkLines(L, 16, 6, -8, 13);
    return L; } };

  // 26 워터파크 — 알록달록 나선 슬라이드, 파도풀, 유수풀, 파라솔
  B[26] = { size: [32, 28], build(G) {
    const L = [box(14, 7, 9, -9, 3.5, -9, [0.9, 0.92, 0.94]), box(14.6, 0.5, 9.6, -9, 7.2, -9, [0.3, 0.6, 0.8])];
    G.add(sign('WATER PARK', '#0f5f8a', '#ffffff', 10, 1.6, -9, 5.6, -4.3, 0, true));
    shopFront(L, G, 5, 2.4, 1.5, -4.44);
    // 슬라이드 타워
    L.push(box(6.4, 15, 6.4, 8, 7.5, -6, [0.85, 0.86, 0.88]), box(7, 0.5, 7, 8, 15.2, -6, [0.9, 0.5, 0.2]));
    for (let f = 1; f < 5; f++) L.push(box(6.8, 0.3, 6.8, 8, f * 3, -6, [0.7, 0.72, 0.74]));
    // 나선 미끄럼틀 셋
    const slide = (cx, cz, r, y0, turns, col) => {
      const pts = []; const n = 46;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 * turns; pts.push(new THREE.Vector3(cx + Math.cos(a) * r, y0 - i / n * (y0 - 1.4), cz + Math.sin(a) * r)); }
      L.push(tube(pts, 0.72, col, 90));
    };
    slide(4.5, -3, 4.2, 14.4, 1.6, [0.95, 0.8, 0.15]);
    slide(10.5, -1, 3.4, 14.4, 1.4, [0.2, 0.65, 0.9]);
    slide(8, -10.5, 3.2, 14.4, 1.2, [0.9, 0.3, 0.35]);
    // 풀
    pave(L, 30, 15, 0, 6.5, C.sand);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(24, 11), new THREE.MeshStandardMaterial({ color: 0x35b6e6, emissive: 0x1a6a90, emissiveIntensity: 0.25, roughness: 0.12 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.46, 7); G.add(pool);
    L.push(box(24.8, 0.5, 11.8, 0, 0.28, 7, [0.92, 0.92, 0.9]));
    for (const x of [-10, -5, 0, 5, 10]) parasol(L, x, 13.2, 0, x % 2 ? [0.95, 0.75, 0.2] : [0.2, 0.6, 0.85]);
    for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28; L.push({ g: new THREE.TorusGeometry(0.85, 0.3, 6, 12), m: T(-8 + i * 4 + Math.cos(a), 0.62, 5 + Math.sin(a) * 3, Math.PI / 2, 0, 0), c: [0.95, 0.85, 0.2] }); }
    return L; } };

  // 27 테마파크 — 대관람차, 롤러코스터 트랙, 정문 아치
  B[27] = { size: [32, 30], build(G) {
    const L = [];
    pave(L, 30, 26, 0, 0, [0.55, 0.5, 0.45]);
    // 정문 아치
    L.push(box(1.2, 7, 1.2, -6, 3.5, 13, C.red), box(1.2, 7, 1.2, 6, 3.5, 13, C.red), box(13.4, 1.6, 1.4, 0, 7.4, 13, C.red));
    G.add(sign('JEJU LAND', '#c2201c', '#ffe14d', 12, 1.5, 0, 7.4, 13.75, 0, true));
    // 대관람차
    const cx = -8, cz = -4, rad = 11;
    L.push({ g: new THREE.TorusGeometry(rad, 0.4, 8, 40), m: T(cx, rad + 1.5, cz, 0, Math.PI / 2, 0), c: [0.9, 0.92, 0.95] },
      { g: new THREE.TorusGeometry(rad - 1.4, 0.28, 8, 40), m: T(cx, rad + 1.5, cz, 0, Math.PI / 2, 0), c: [0.85, 0.87, 0.9] });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2;
      L.push({ g: new THREE.BoxGeometry(0.22, rad * 2, 0.22), m: T(cx, rad + 1.5, cz, a, Math.PI / 2, 0), c: [0.8, 0.82, 0.85] });
      L.push(box(1.5, 1.4, 1.3, cx, rad + 1.5 + Math.sin(a) * rad, cz + Math.cos(a) * rad, [[0.9, 0.3, 0.3], [0.3, 0.6, 0.9], [0.95, 0.8, 0.2], [0.4, 0.8, 0.4]][i % 4])); }
    L.push(box(1.4, 12, 1.4, cx - 3, 6, cz, C.steel), box(1.4, 12, 1.4, cx + 3, 6, cz, C.steel), cyl(1.6, 1.6, 6.8, cx, rad + 1.5, cz, [0.6, 0.62, 0.66], 10));
    // 롤러코스터
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(-5 + t * 19, 3 + Math.sin(t * 7) * 4.5 + Math.max(0, 8 - t * 14), -8 + Math.sin(t * 4.2) * 7)); }
    L.push(tube(pts, 0.28, [0.9, 0.25, 0.25], 90));
    const pts2 = pts.map(p => new THREE.Vector3(p.x, p.y - 0.9, p.z));
    L.push(tube(pts2, 0.16, [0.85, 0.85, 0.88], 70));
    for (let i = 2; i < 40; i += 5) L.push(box(0.32, pts[i].y, 0.32, pts[i].x, pts[i].y / 2, pts[i].z, [0.75, 0.76, 0.78]));
    // 회전목마
    L.push(cyl(4, 4, 0.4, 9, 0.5, 7, [0.95, 0.9, 0.85], 16), cyl(0.5, 0.5, 4.4, 9, 2.5, 7, C.steel, 8),
      { g: new THREE.CylinderGeometry(4.6, 0.4, 2.2, 16), m: T(9, 5.6, 7), c: [0.9, 0.25, 0.3] });
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; L.push(cyl(0.1, 0.1, 3, 9 + Math.cos(a) * 3.2, 2.2, 7 + Math.sin(a) * 3.2, [0.85, 0.75, 0.35], 6), box(0.6, 0.9, 1.5, 9 + Math.cos(a) * 3.2, 1.6, 7 + Math.sin(a) * 3.2, [0.95, 0.95, 0.92])); }
    tree(L, -13, 10, 0, 1.1); tree(L, 13, -11, 0, 1.0);
    return L; } };

  // 28 대형 리조트 — 객실동 두 채 + 인피니티 풀 + 야자수 길
  B[28] = { size: [32, 26], build(G) {
    const L = [];
    const wing = (x, z, w, h) => {
      L.push(box(w, h, 10, x, h / 2, z, [0.97, 0.95, 0.91]), box(w + 1, 0.8, 11, x, h + 0.4, z, [0.55, 0.42, 0.3]), box(w, 0.3, 10, x, 0.15, z, C.conc));
      G.add(gridWall(w - 1, h - 3, Math.round(w / 2.4), Math.round(h / 3), x, h / 2 + 0.6, z + 5.02));
      G.add(gridWall(w - 1, h - 3, Math.round(w / 2.4), Math.round(h / 3), x, h / 2 + 0.6, z - 5.02, Math.PI));
      for (let f = 0; f < Math.round(h / 3); f++) L.push(box(w + 0.4, 0.22, 1.1, x, 2 + f * 3, z + 5.4, [0.85, 0.83, 0.8]));
    };
    wing(-11, -7, 12, 18); wing(11, -7, 12, 18);
    L.push(box(9, 6, 8, 0, 3, -5, [0.94, 0.92, 0.88]), box(10, 0.6, 9, 0, 6.3, -5, [0.55, 0.42, 0.3]));      // 로비
    shopFront(L, G, 6, 3, 1.8, -0.94);
    G.add(sign('GRAND RESORT', '#ffffff', '#1f6d90', 12, 1.8, 0, 8.2, -4.8, 0, true));
    L.push(box(12.4, 2, 0.35, 0, 8.2, -5, [0.42, 0.44, 0.46]));
    pave(L, 30, 13, 0, 7, C.sand);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), new THREE.MeshStandardMaterial({ color: 0x33b4e6, emissive: 0x1a6a90, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0.2 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.5, 7); G.add(pool);
    L.push(box(22.8, 0.6, 9.8, 0, 0.3, 7, [0.93, 0.93, 0.9]));
    for (const x of [-13, -6.5, 6.5, 13]) palm(L, x, 12.5, 0, 1.2);
    for (const x of [-8, -4, 0, 4, 8]) L.push(box(1.8, 0.12, 0.7, x, 0.75, 12, [0.96, 0.96, 0.92]), box(1.8, 0.65, 0.06, x, 1.05, 12.3, [0.96, 0.96, 0.92]));
    return L; } };

  // 29 대형마트 — 넓은 2층 박스, 빨간 대형 사인, 옥상 주차, 카트
  B[29] = { size: [28, 24], build(G) {
    const L = [box(24, 11, 16, 0, 5.5, -3, [0.92, 0.92, 0.9]), box(25, 0.8, 17, 0, 11.4, -3, [0.62, 0.62, 0.64]), box(24, 0.3, 16, 0, 0.15, -3, C.conc)];
    L.push(box(24.6, 2.6, 0.4, 0, 9.2, 5.1, C.red));
    G.add(sign('JEJU MART', '#c2100f', '#ffffff', 22, 2.4, 0, 9.2, 5.32, 0, true));
    G.add(sign('MART', '#c2100f', '#ffffff', 12, 2.2, 12.22, 9.2, -3, Math.PI / 2, true));
    L.push(box(0.4, 2.6, 14, 12.1, 9.2, -3, C.red));
    // 정면 유리 + 자동문
    for (const x of [-6, 6]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.4), GLASS); gl.position.set(x, 2.6, 5.06); G.add(gl); G.add(win(7.8, 4.2, x, 2.6, 5.02)); }
    L.push(box(4.4, 4.6, 0.3, 0, 2.3, 5.06, C.dark));
    L.push(box(25, 0.5, 4, 0, 5.4, 6.6, [0.75, 0.76, 0.78]));                                                // 캐노피
    for (const x of [-11, 0, 11]) L.push(box(0.5, 5.2, 0.5, x, 2.6, 8.4, C.conc));
    // 옥상 주차 난간 + 차
    for (let x = -12; x <= 12; x += 1.4) L.push(box(0.12, 1.0, 0.12, x, 12.3, 5.4, C.steel));
    L.push(box(24.6, 0.12, 0.12, 0, 12.8, 5.4, C.steel));
    for (let i = 0; i < 4; i++) car(L, -8 + i * 4.6, -2, 11.8, 0, [R(0.2, 0.9), R(0.2, 0.9), R(0.3, 0.9)]);
    parkLines(L, 24, 7, 0, 11);
    for (let i = 0; i < 5; i++) L.push(box(0.7, 0.9, 1.0, -11 + i * 0.35, 0.65, 7.6, [0.75, 0.76, 0.8]));     // 카트 줄
    for (let i = 0; i < 3; i++) car(L, -7 + i * 5, 11, 0, 0, [R(0.2, 0.9), R(0.2, 0.9), R(0.3, 0.9)]);
    return L; } };

  // 30 특급호텔 — 16층 타워, 유리 로비, 드롭오프 캐노피, 야자수
  B[30] = { size: [24, 20], build(G) {
    const L = [];
    tower(L, G, { w: 17, d: 13, h: 36, wall: [0.9, 0.88, 0.84], cap: [0.45, 0.46, 0.5] });
    L.push(box(21, 6.5, 6, 0, 3.25, 8, [0.92, 0.9, 0.86]));                                                  // 저층 로비
    for (const y of [2.2, 5]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(17, 2.4), GLASS); gl.position.set(0, y, 11.06); G.add(gl); G.add(win(16.8, 2.2, 0, y, 11.02)); }
    L.push(box(12, 0.6, 7, 0, 4.6, 14.5, [0.75, 0.76, 0.78]));                                               // 드롭오프 캐노피
    for (const x of [-5, 5]) L.push(box(0.6, 4.6, 0.6, x, 2.3, 17.4, C.conc));
    L.push(box(3.2, 3.4, 0.3, 0, 1.7, 11.1, [0.35, 0.4, 0.45]));
    G.add(sign('GRAND HOTEL', '#141820', '#ffd98a', 13, 2.4, 0, 39, 0.2, 0, true));
    G.add(sign('GRAND HOTEL', '#141820', '#ffd98a', 13, 2.4, 0, 39, -0.2, Math.PI, true));
    L.push(box(13.4, 2.8, 0.4, 0, 39, 0, C.dark));
    G.add(sign('HOTEL', '#ffffff', '#8a6a2a', 6, 1.2, 0, 7.4, 11.12, 0, true));
    for (const x of [-9.5, 9.5]) { palm(L, x, 13, 0, 1.2); palm(L, x * 0.8, 18, 0, 1.0); }
    car(L, -2.5, 15, 0, 0, [0.1, 0.1, 0.12]); car(L, 2.5, 15, 0, 0, [0.9, 0.9, 0.92]);
    parkLines(L, 16, 5, 0, 21);
    return L; } };

  // 31 나이트클럽 — 검은 매스에 네온 띠, 옥상 미러볼과 서치라이트 (제일 비싼 함덕 자리)
  B[31] = { size: [20, 17], build(G) {
    const NEON_M = H.NEON_M, NEON_C = H.NEON_C;
    const L = [box(17, 9, 14, 0, 4.5, 0, [0.07, 0.07, 0.09]), box(17.8, 0.7, 14.8, 0, 9.3, 0, [0.14, 0.14, 0.17]), box(17, 0.3, 14, 0, 0.15, 0, C.conc)];
    L.push(box(3, 3.6, 0.14, 0, 1.8, 7.07, [0.35, 0.05, 0.2]), box(6, 0.5, 3.4, 0, 4.3, 8.4, C.dark));       // 입구·캐노피
    for (const x of [-3.6, 3.6]) L.push(cyl(0.3, 0.3, 1.1, x, 0.55, 8.8, [0.7, 0.6, 0.2], 8), box(0.1, 1.6, 0.1, x, 1.4, 8.8, [0.7, 0.6, 0.2]));   // 벨벳 로프 기둥
    const strip = (w, h, x, y, z, ry, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), mat); m.position.set(x, y, z); m.rotation.y = ry || 0; G.add(m); };
    strip(14, 0.4, 0, 7.8, 7.1, 0, NEON_C); strip(14, 0.4, 0, 6.4, 7.1, 0, NEON_M);
    strip(0.4, 8, -8.1, 4, 7.1, 0, NEON_C); strip(0.4, 8, 8.1, 4, 7.1, 0, NEON_M);
    for (let k = 0; k < 5; k++) strip(0.35, 4.5, -6 + k * 3, 6.5, -7.1, Math.PI, k % 2 ? NEON_C : NEON_M);
    for (let k = 0; k < 4; k++) strip(0.35, 5, 8.6, 5, -4.5 + k * 3, Math.PI / 2, k % 2 ? NEON_M : NEON_C);
    G.add(sign('CLUB', '#14000c', '#ff3fa8', 9, 2.4, 0, 11.4, 0.2, 0, true));
    G.add(sign('CLUB', '#14000c', '#ff3fa8', 9, 2.4, 0, 11.4, -0.2, Math.PI, true));
    L.push(box(9.2, 2.6, 0.35, 0, 11.4, 0, C.dark), cyl(0.14, 0.14, 2.4, 0, 10.6, 0, [0.5, 0.5, 0.55], 8));
    L.push({ g: new THREE.SphereGeometry(1.3, 14, 12), m: T(0, 13.6, 0), c: [0.86, 0.9, 1.0] }, cyl(0.12, 0.12, 1.4, 0, 12.6, 0, [0.5, 0.5, 0.55], 8));   // 미러볼
    if (H.beamGeo) for (const [bx, dir] of [[-6.5, 1], [6.5, -1]]) {
      const piv = new THREE.Group(); piv.position.set(bx, 9.6, 0); piv.userData.beam = dir;
      const bm = new THREE.Mesh(H.beamGeo(), dir > 0 ? H.BEAM_M : H.BEAM_C); bm.rotation.z = dir * 0.5; bm.frustumCulled = false; piv.add(bm); G.add(piv);
      L.push(cyl(0.55, 0.65, 0.8, bx, 9.5, 0, [0.1, 0.1, 0.12], 8));
    }
    parkLines(L, 16, 4, 0, 11);
    car(L, -4, 11, 0, 0, [0.08, 0.08, 0.1]); car(L, 1, 11, 0, 0, [0.6, 0.1, 0.12]);
    return L; } };

  return B;
};
