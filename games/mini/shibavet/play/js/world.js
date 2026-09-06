/* world.js — 격자(층 2개) + 목조주택·정원 지오메트리
   층 0 = 마당 + 1층, 층 1 = 2층. 계단 칸은 두 층에 같이 있고 높이로 층이 정해진다. */
(function () {
  const CELL = 0.5, GX = 60, GZ = 48, FH = 3.0, WH = 2.85;
  const T = { FLOOR: 0, WALL: 1, VOID: 2, HIDE: 3, BLOCK: 4, DOOR: 5, STAIR: 6, FENCE: 7 };
  const grid = [new Uint8Array(GX * GZ), new Uint8Array(GX * GZ)];
  grid[1].fill(T.VOID);
  const doors = [];      // {cells:[[cx,cz],...], layer, axis:'x'|'z', hx,hz(경첩), open, mesh, t}
  const hideSpots = [];  // 숨는 칸 목록 [{L,cx,cz}]
  const STAIR = { x0: 9.5, x1: 13.5, z0: 10.5, z1: 12 };
  const HOUSE = { x0: 8, x1: 22.5, z0: 4, z1: 14.5 };

  const idx = (cx, cz) => cz * GX + cx;
  const cellOf = v => Math.floor(v / CELL);
  const inGrid = (cx, cz) => cx >= 0 && cz >= 0 && cx < GX && cz < GZ;
  function fill(L, x0, z0, x1, z1, t) {
    for (let cz = cellOf(z0); cz < cellOf(z1); cz++) for (let cx = cellOf(x0); cx < cellOf(x1); cx++) if (inGrid(cx, cz)) grid[L][idx(cx, cz)] = t;
  }
  const wallX = (L, x, z0, z1) => fill(L, x, z0, x + .5, z1, T.WALL);
  const wallZ = (L, z, x0, x1) => fill(L, x0, z, x1, z + .5, T.WALL);
  function door(L, x, z, axis) { // axis 'x' = 문이 X 방향으로 누움(벽이 Z 고정)
    const cells = axis === 'x' ? [[cellOf(x), cellOf(z)], [cellOf(x) + 1, cellOf(z)]] : [[cellOf(x), cellOf(z)], [cellOf(x), cellOf(z) + 1]];
    // 문이 좁아 불편하다(2026-09-06) — 벽이 이어지는 쪽으로 한 칸 더 넓힌다(1m → 1.5m). 모서리·벽 갈림목이면 그대로 둔다
    const g = (cx, cz) => grid[L][idx(cx, cz)], last = cells[cells.length - 1];
    const c3 = axis === 'x' ? [last[0] + 1, last[1]] : [last[0], last[1] + 1], c4 = axis === 'x' ? [last[0] + 2, last[1]] : [last[0], last[1] + 2];
    const side = axis === 'x' ? [[c3[0], c3[1] - 1], [c3[0], c3[1] + 1]] : [[c3[0] - 1, c3[1]], [c3[0] + 1, c3[1]]];
    if (g(c3[0], c3[1]) === T.WALL && g(c4[0], c4[1]) === T.WALL && side.every(c => g(c[0], c[1]) !== T.WALL)) cells.push(c3);
    cells.forEach(c => grid[L][idx(c[0], c[1])] = T.DOOR);
    const w = cells.length * CELL;
    const d = { cells, layer: L, axis, w, hx: axis === 'x' ? x : x + .25, hz: axis === 'x' ? z + .25 : z, cx: axis === 'x' ? x + w / 2 : x + .25, cz: axis === 'x' ? z + .25 : z + w / 2, open: true, t: 1, id: doors.length };
    doors.push(d); return d;
  }
  function hide(L, x0, z0, x1, z1) { fill(L, x0, z0, x1, z1, T.HIDE); for (let cz = cellOf(z0); cz < cellOf(z1); cz++) for (let cx = cellOf(x0); cx < cellOf(x1); cx++) hideSpots.push({ L, cx, cz }); }

  /* ---------- 격자 설계 ---------- */
  // 울타리
  fill(0, 0, 0, 30, .5, T.FENCE); fill(0, 0, 23.5, 30, 24, T.FENCE); fill(0, 0, 0, .5, 24, T.FENCE); fill(0, 29.5, 0, 30, 24, T.FENCE);
  // 1층 바깥벽
  wallX(0, 8, 4, 14.5); wallX(0, 22, 4, 14.5); wallZ(0, 4, 8, 22.5); wallZ(0, 14, 8, 22.5);
  // 1층 안벽: 거실(8-14,4-10) 부엌(14-22,4-9) 계단홀(8-14,10-14) 현관홀(14-18,9-14) 욕실(18-22,9-14)
  wallX(0, 14, 4, 14.5); wallZ(0, 10, 8, 14.5); wallZ(0, 9, 14, 22.5); wallX(0, 18, 9, 14.5);
  fill(0, 13.5, 10.5, 14, 12, T.WALL); // 계단 꼭대기 아래 벽
  door(0, 8.5, 10, 'x');   // 거실↔계단홀 (계단 아래 빈 자리로 난다)
  door(0, 14, 6, 'z');     // 거실↔부엌
  door(0, 15.5, 9, 'x');   // 부엌↔현관홀
  door(0, 14, 12.5, 'z');  // 계단홀↔현관홀
  door(0, 18, 11, 'z');    // 현관홀↔욕실
  const frontDoor = door(0, 15.5, 14, 'x'); // 현관
  door(0, 20, 4, 'x');     // 부엌 뒷문
  door(0, 8, 7, 'z');      // 거실 옆문
  fill(0, STAIR.x0, STAIR.z0, STAIR.x1, STAIR.z1, T.STAIR);
  // 2층
  fill(1, 8, 4, 22.5, 14.5, T.FLOOR);
  wallX(1, 8, 4, 14.5); wallX(1, 22, 4, 14.5); wallZ(1, 4, 8, 22.5); wallZ(1, 14, 8, 22.5);
  wallX(1, 14, 4, 14.5); wallZ(1, 10, 8, 14.5); wallZ(1, 11, 14, 22.5); wallX(1, 18, 4, 11.5);
  fill(1, STAIR.x0, STAIR.z0, STAIR.x1, STAIR.z1, T.STAIR);
  door(1, 8.5, 10, 'x');   // 침실1 (8-14,4-10)
  door(1, 14, 12.5, 'z');  // 홀↔복도
  door(1, 15.5, 11, 'x');  // 침실2 (14-18,4-11)
  door(1, 19.5, 11, 'x');  // 서재 (18-22,4-11)
  // 가구 — 숨는 곳(개만) / 막힌 곳(둘 다)
  hide(0, 10, 7, 11.5, 8);          // 거실 탁자
  fill(0, 9, 8.5, 13, 9.5, T.BLOCK); // 소파
  hide(0, 17, 5.5, 19, 7);          // 식탁
  fill(0, 14.5, 4.5, 18, 5.2, T.BLOCK); // 싱크대
  fill(0, 21, 4.5, 22, 5.5, T.BLOCK);   // 냉장고
  fill(0, 20.5, 12, 22, 14, T.BLOCK);   // 욕조
  hide(1, 9, 5, 11, 7.5);           // 침실1 침대
  fill(1, 12.5, 4.5, 14, 6, T.BLOCK);  // 옷장
  hide(1, 15, 5, 17, 7.5);          // 침실2 침대
  fill(1, 14.5, 9, 16, 10.5, T.BLOCK); // 장난감 상자
  hide(1, 19, 5, 21.5, 6);          // 서재 책상
  fill(1, 21, 6.5, 22, 10.5, T.BLOCK); // 책장
  // 정원
  hide(0, 3, 8, 4.5, 9.5);          // 개집
  const trees = [[3, 3], [26.5, 2.5], [4, 20], [27.5, 10], [12, 20.5], [2.5, 14]];
  trees.forEach(t => fill(0, t[0] - .25, t[1] - .25, t[0] + .5, t[1] + .5, T.BLOCK));
  const bushes = [[9, 17.5, 11, 18.5], [18, 17.5, 20, 18.5], [6, 2, 7.5, 3], [16, 1.5, 19, 2.5], [23, 6, 24, 8]];
  bushes.forEach(b => fill(0, b[0], b[1], b[2], b[3], T.BLOCK));
  const CAR = { x0: 24, z0: 17, x1: 26.5, z1: 21.2 };
  fill(0, CAR.x0, CAR.z0, CAR.x1, CAR.z1, T.BLOCK);
  const GOAL = { x: 25.3, z: 22.4 };

  /* ---------- 높이·통행 ---------- */
  function inStair(x, z) { return x >= STAIR.x0 && x < STAIR.x1 && z >= STAIR.z0 && z < STAIR.z1; }
  function height(L, x, z) {
    if (inStair(x, z)) return FH * Math.min(1, Math.max(0, (x - STAIR.x0) / (STAIR.x1 - STAIR.x0)));
    return L ? FH : 0;
  }
  function layerAt(L, x, z) { return inStair(x, z) ? (height(0, x, z) < FH * .5 ? 0 : 1) : L; }
  function cellType(L, cx, cz) { return inGrid(cx, cz) ? grid[L][idx(cx, cz)] : T.WALL; }
  function doorAt(L, cx, cz) { for (const d of doors) if (d.layer === L) for (const c of d.cells) if (c[0] === cx && c[1] === cz) return d; return null; }
  const doorMap = [new Int8Array(GX * GZ).fill(-1), new Int8Array(GX * GZ).fill(-1)];
  doors.forEach(d => d.cells.forEach(c => doorMap[d.layer][idx(c[0], c[1])] = d.id));
  function passable(L, cx, cz, forDog) {
    const t = cellType(L, cx, cz);
    if (t === T.FLOOR || t === T.STAIR) return true;
    if (t === T.HIDE) return !!forDog;
    if (t === T.DOOR) return doors[doorMap[L][idx(cx, cz)]].open;
    return false;
  }
  function blocksSight(L, cx, cz) {
    const t = cellType(L, cx, cz);
    if (t === T.WALL) return true;
    if (t === T.DOOR) return !doors[doorMap[L][idx(cx, cz)]].open;
    return false;
  }
  function lineOfSight(L, x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0, n = Math.ceil(Math.hypot(dx, dz) / (CELL * .5));
    for (let i = 1; i < n; i++) { const t = i / n; if (blocksSight(L, cellOf(x0 + dx * t), cellOf(z0 + dz * t))) return false; }
    return true;
  }
  const inHouse = (x, z) => x >= HOUSE.x0 && x < HOUSE.x1 && z >= HOUSE.z0 && z < HOUSE.z1;

  /* BFS — 노드 = L*GX*GZ + cz*GX + cx */
  const N = GX * GZ;
  const qbuf = new Int32Array(N * 2);
  // 이웃 노드 — 벽·문·높이차(계단 옆으로 뛰어오르기 금지)를 다 본다. 계단 칸은 다른 층의 같은 칸과도 이어진다(비용 0)
  const nbBuf = [];
  function neighbors(L, cx, cz, forDog, out) {
    out = out || nbBuf; out.length = 0;
    const hh = height(L, (cx + .5) * CELL, (cz + .5) * CELL);
    const tryN = (x, z) => { if (!inGrid(x, z) || !passable(L, x, z, forDog)) return; if (Math.abs(height(L, (x + .5) * CELL, (z + .5) * CELL) - hh) > .5) return; out.push(L * N + idx(x, z)); };
    tryN(cx + 1, cz); tryN(cx - 1, cz); tryN(cx, cz + 1); tryN(cx, cz - 1);
    if (cellType(L, cx, cz) === T.STAIR) out.push((1 - L) * N + idx(cx, cz));
    return out;
  }
  function bfs(L, cx, cz, forDog, avoidFn) {
    const dist = new Int16Array(N * 2).fill(-1);
    let h = 0, t = 0; const s = L * N + idx(cx, cz); dist[s] = 0; qbuf[t++] = s;
    const nb = [];
    while (h < t) {
      const n = qbuf[h++], nl = n >= N ? 1 : 0, ci = n - nl * N, ncx = ci % GX, ncz = (ci - ncx) / GX, d = dist[n] + 1;
      neighbors(nl, ncx, ncz, forDog, nb);
      for (let i = 0; i < nb.length; i++) {
        const m = nb[i]; if (dist[m] >= 0) continue;
        const ml = m >= N ? 1 : 0, mi = m - ml * N;
        if (avoidFn && avoidFn(ml, mi % GX, (mi - mi % GX) / GX)) continue;
        dist[m] = (mi === ci) ? dist[n] : d; qbuf[t++] = m;
      }
    }
    return dist;
  }
  function nodeOf(L, x, z) { return L * N + idx(cellOf(x), cellOf(z)); }
  function nodePos(n) { const l = n >= N ? 1 : 0, ci = n - l * N, cx = ci % GX, cz = (ci - cx) / GX; return { L: l, cx, cz, x: (cx + .5) * CELL, z: (cz + .5) * CELL }; }

  /* ---------- 텍스처 ---------- */
  function makeTex(w, h, draw, rx, ry) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const texPlank = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9a06a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) { g.fillStyle = `hsl(32,${rnd(38, 50)}%,${rnd(52, 62)}%)`; g.fillRect(0, y, w, 30); g.fillStyle = 'rgba(80,45,15,.45)'; g.fillRect(0, y + 30, w, 2);
      for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(90,50,20,.12)'; g.fillRect(rnd(0, w), y + rnd(2, 28), rnd(20, 90), 1.5); } }
  }, 1, 1);
  const texFloor = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b98a58'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 24) { const off = (y / 24 % 2) * 60; for (let x = -60; x < w; x += 120) { g.fillStyle = `hsl(30,${rnd(40, 52)}%,${rnd(48, 58)}%)`; g.fillRect(x + off, y, 118, 22); } g.fillStyle = 'rgba(60,30,10,.4)'; g.fillRect(0, y + 22, w, 2); }
  }, 1, 1);
  const texGrass = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6fa848'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `hsl(${rnd(85, 110)},${rnd(40, 55)}%,${rnd(32, 48)}%)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(2, 6)); }
  }, 20, 16);
  const texPaper = makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f3e9d6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,90,60,${rnd(.03, .09)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3)); }
    g.fillStyle = 'rgba(160,120,80,.18)'; g.fillRect(0, h - 10, w, 10); // 걸레받이 느낌 줄
  }, 1, 1);
  const texRoof = makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6b4a3a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) { const off = (y / 32 % 2) * 24; for (let x = -24; x < w; x += 48) { g.fillStyle = `hsl(12,${rnd(30, 40)}%,${rnd(28, 38)}%)`; g.fillRect(x + off, y, 46, 30); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + 29, w, 3); }
  }, 6, 3);
  const texPath = makeTex(128, 128, (g, w, h) => { g.fillStyle = '#b7b1a3'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(35,${rnd(5, 12)}%,${rnd(60, 74)}%)`; g.beginPath(); g.ellipse(rnd(0, w), rnd(0, h), rnd(6, 16), rnd(5, 12), rnd(0, 3), 0, 7); g.fill(); } }, 2, 8);

  /* ---------- 지오메트리 합치기 ---------- */
  function Merger() { this.pos = []; this.nor = []; this.uv = []; }
  Merger.prototype.add = function (geo, m) {
    const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m);
    this.pos.push(g.attributes.position.array); this.nor.push(g.attributes.normal.array); if (g.attributes.uv) this.uv.push(g.attributes.uv.array); else this.uv.push(new Float32Array(g.attributes.position.count * 2));
  };
  Merger.prototype.box = function (w, h, d, x, y, z, ry) {
    const m = new THREE.Matrix4(); if (ry) m.makeRotationY(ry); m.setPosition(x, y, z);
    this.add(new THREE.BoxGeometry(w, h, d), m);
  };
  Merger.prototype.build = function (uvScale) {
    const cat = arrs => { let n = 0; arrs.forEach(a => n += a.length); const o = new Float32Array(n); let p = 0; arrs.forEach(a => { o.set(a, p); p += a.length; }); return o; };
    const pos = cat(this.pos), nor = cat(this.nor); let uv = cat(this.uv);
    if (uvScale) { // 월드 좌표 기준 UV — 상자마다 무늬가 늘어나지 않게
      uv = new Float32Array(pos.length / 3 * 2);
      for (let i = 0, j = 0; i < pos.length; i += 3, j += 2) { const x = pos[i], y = pos[i + 1], z = pos[i + 2], nx = Math.abs(nor[i]), ny = Math.abs(nor[i + 1]); if (ny > .5) { uv[j] = x * uvScale; uv[j + 1] = z * uvScale; } else if (nx > .5) { uv[j] = z * uvScale; uv[j + 1] = y * uvScale; } else { uv[j] = x * uvScale; uv[j + 1] = y * uvScale; } }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
  };
  function mesh(merger, mat, shadow, uvScale) { const m = new THREE.Mesh(merger.build(uvScale), mat); m.castShadow = !!shadow; m.receiveShadow = true; return m; }

  const M = {
    wall: new THREE.MeshStandardMaterial({ map: texPlank, roughness: .85 }),
    wallIn: new THREE.MeshStandardMaterial({ map: texPaper, roughness: .95 }),
    floor: new THREE.MeshStandardMaterial({ map: texFloor, roughness: .7 }),
    grass: new THREE.MeshStandardMaterial({ map: texGrass, roughness: 1 }),
    roof: new THREE.MeshStandardMaterial({ map: texRoof, roughness: .9, side: THREE.DoubleSide }),
    path: new THREE.MeshStandardMaterial({ map: texPath, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: .8 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: .9 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x4e9a3f, roughness: .9, flatShading: true }),
    leaf2: new THREE.MeshStandardMaterial({ color: 0x3f8a55, roughness: .9, flatShading: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa9d6f2, emissive: 0x3a5a70, roughness: .1, metalness: .3, transparent: true, opacity: .55 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: .7 }),
    fence: new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: .85 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x8a6bb0, roughness: .95 }),
    bed: new THREE.MeshStandardMaterial({ color: 0xd9e6f0, roughness: .95 }),
    blanket: new THREE.MeshStandardMaterial({ color: 0xe07a6a, roughness: .95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x9a6b3c, roughness: .8 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: .6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: .4, metalness: .6 }),
    car: new THREE.MeshStandardMaterial({ color: 0x3d7bd9, roughness: .35, metalness: .3 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x222226, roughness: .9 }),
    doghouse: new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .85 }),
    goal: new THREE.MeshBasicMaterial({ color: 0x7fd48a, transparent: true, opacity: .55, side: THREE.DoubleSide }),
  };

  function buildWalls(L, group) {
    const y0 = L ? FH : 0, hgt = L ? WH + .15 : WH, cy = y0 + hgt / 2, th = .3;
    const ext = new Merger(), inn = new Merger(), lint = new Merger();
    const isW = (cx, cz) => cellType(L, cx, cz) === T.WALL, isD = (cx, cz) => cellType(L, cx, cz) === T.DOOR;
    const outside = (cx, cz) => !inHouse((cx + .5) * CELL, (cz + .5) * CELL);
    for (let cz = 0; cz < GZ; cz++) for (let cx = 0; cx < GX; cx++) {
      const x = (cx + .5) * CELL, z = (cz + .5) * CELL;
      if (isW(cx, cz)) {
        const mg = (outside(cx + 1, cz) || outside(cx - 1, cz) || outside(cx, cz + 1) || outside(cx, cz - 1) || cellType(L, cx, cz + 1) === T.VOID || cellType(L, cx, cz - 1) === T.VOID || cellType(L, cx + 1, cz) === T.VOID || cellType(L, cx - 1, cz) === T.VOID) ? ext : inn;
        mg.box(th, hgt, th, x, cy, z);
        if (isW(cx + 1, cz)) mg.box(CELL, hgt, th, x + CELL / 2, cy, z); else if (isD(cx + 1, cz)) mg.box(CELL / 2, hgt, th, x + CELL / 4 + .05, cy, z);
        if (isW(cx, cz + 1)) mg.box(th, hgt, CELL, x, cy, z + CELL / 2); else if (isD(cx, cz + 1)) mg.box(th, hgt, CELL / 2, x, cy, z + CELL / 4 + .05);
        if (isD(cx - 1, cz)) mg.box(CELL / 2, hgt, th, x - CELL / 4 - .05, cy, z);
        if (isD(cx, cz - 1)) mg.box(th, hgt, CELL / 2, x, cy, z - CELL / 4 - .05);
      } else if (isD(cx, cz)) {
        const ax = (isW(cx + 1, cz) || isD(cx + 1, cz) || isW(cx - 1, cz) || isD(cx - 1, cz)) ? 'x' : 'z';
        const lh = hgt - 2.15;
        if (ax === 'x') lint.box(CELL, lh, th, x, y0 + 2.15 + lh / 2, z); else lint.box(th, lh, CELL, x, y0 + 2.15 + lh / 2, z);
      }
    }
    group.add(mesh(ext, M.wall, true, .5)); group.add(mesh(inn, M.wallIn, true, .5)); group.add(mesh(lint, M.wood, true));
  }
  function buildFloor(L, group) {
    const mg = new Merger();
    for (let cz = 0; cz < GZ; cz++) for (let cx = 0; cx < GX; cx++) {
      const t = grid[L][idx(cx, cz)]; const x = (cx + .5) * CELL, z = (cz + .5) * CELL;
      if (L === 1) { if (t !== T.VOID && t !== T.STAIR) mg.box(CELL, .22, CELL, x, FH - .11, z); }
      else if (inHouse(x, z) && t !== T.STAIR) mg.box(CELL, .06, CELL, x, .03, z);
    }
    const m = mesh(mg, M.floor, false, .25); group.add(m);
    if (L === 1) { const ceil = new THREE.Mesh(mg.build(), new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 1 })); ceil.position.y = -.02; group.add(ceil); }
  }
  function buildStairs(group) {
    const mg = new Merger(), n = 16, w = STAIR.z1 - STAIR.z0, len = (STAIR.x1 - STAIR.x0) / n, rise = FH / n, zc = (STAIR.z0 + STAIR.z1) / 2;
    for (let i = 0; i < n; i++) { const x = STAIR.x0 + (i + .5) * len, h = (i + 1) * rise; mg.box(len, h, w, x, h / 2, zc); }
    // 난간
    const rail = new Merger();
    for (let i = 0; i <= 8; i++) { const x = STAIR.x0 + i * .5, y = height(0, x, zc); rail.box(.05, 1, .05, x, y + .5, STAIR.z1 - .05); }
    for (let i = 0; i < 8; i++) { const x = STAIR.x0 + i * .5 + .25, y = height(0, x, zc) + 1; rail.box(.52, .06, .06, x, y, STAIR.z1 - .05, 0); }
    // 2층 뚫린 곳 난간 (Z 12 쪽과 X 9.5 쪽)
    const rail2 = new Merger();
    for (let i = 0; i <= 8; i++) { const x = STAIR.x0 + i * .5; rail2.box(.05, 1, .05, x, FH + .5, STAIR.z1 + .05); }
    rail2.box(4.1, .06, .06, STAIR.x0 + 2, FH + 1, STAIR.z1 + .05);
    for (let i = 0; i <= 3; i++) rail2.box(.05, 1, .05, STAIR.x0 - .05, FH + .5, STAIR.z0 + i * .5);
    rail2.box(.06, .06, 1.6, STAIR.x0 - .05, FH + 1, (STAIR.z0 + STAIR.z1) / 2);
    const s = mesh(mg, M.wood, true); const r = mesh(rail, M.frame, true); group.add(s, r); upG.add(mesh(rail2, M.frame, true));
    // 계단 밑 로프트 슬랩(2층 바닥이 계단 위로는 없으므로 아래 천장 대신 옆판)
    // 계단의 기울어진 밑판 (아래에서 보이는 것)
    const under = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(STAIR.x1 - STAIR.x0, FH), .1, w), M.wood);
    under.position.set((STAIR.x0 + STAIR.x1) / 2, FH / 2 - .35, zc); under.rotation.z = Math.atan2(FH, STAIR.x1 - STAIR.x0); group.add(under);
  }
  function buildRoof(group) {
    const x0 = HOUSE.x0 - .6, x1 = HOUSE.x1 + .6, zc = (HOUSE.z0 + HOUSE.z1) / 2, half = (HOUSE.z1 - HOUSE.z0) / 2 + .6, base = FH * 2 + .05, ridge = base + 2.7;
    const ang = Math.atan2(ridge - base, half), len = Math.hypot(half, ridge - base);
    [1, -1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .18, len), M.roof); p.position.set((x0 + x1) / 2, (base + ridge) / 2, zc + s * half / 2); p.rotation.x = s * ang; p.castShadow = true; p.receiveShadow = true; group.add(p); });
    const sh = new THREE.Shape(); sh.moveTo(-half + .6, base); sh.lineTo(half - .6, base); sh.lineTo(0, ridge - .02); sh.closePath();
    [HOUSE.x0 + .05, HOUSE.x1 - .05].forEach(x => { const sg = new THREE.ShapeGeometry(sh); { const u = sg.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * .5, u.getY(i) * .5); } const g = new THREE.Mesh(sg, M.wall); g.rotation.y = Math.PI / 2; g.position.set(x, 0, zc); g.material = M.wall.clone(); g.material.side = THREE.DoubleSide; group.add(g); });
    // 굴뚝
    const ch = new THREE.Mesh(new THREE.BoxGeometry(.8, 2.2, .8), M.dark); ch.position.set(19, ridge - .6, zc - 2); ch.castShadow = true; group.add(ch);
  }
  function win(group, x, z, axis, w, y0) { // 창문 — 벽 양면
    const h = 1.2, y = y0 + 1.55;
    [1, -1].forEach(s => {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? w + .12 : .05, h + .12, axis === 'x' ? .05 : w + .12), M.frame);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? w : .04, h, axis === 'x' ? .04 : w), M.glass);
      const off = .165 * s; fr.position.set(x + (axis === 'x' ? 0 : off), y, z + (axis === 'x' ? off : 0)); gl.position.copy(fr.position); gl.position[axis === 'x' ? 'z' : 'x'] += .01 * s;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? .06 : .06, h, axis === 'x' ? .06 : .06), M.frame); bar.position.copy(fr.position); bar.position[axis === 'x' ? 'z' : 'x'] += .01 * s;
      (y0 > 1 ? upG : lowG).add(fr, gl, bar);
    });
  }
  function buildWindows(group) {
    win(group, 10.5, 4.25, 'x', 1.6, 0); win(group, 17, 4.25, 'x', 1.4, 0); win(group, 8.25, 5.5, 'z', 1.4, 0); win(group, 8.25, 12.5, 'z', 1.2, 0);
    win(group, 22.25, 6.5, 'z', 1.4, 0); win(group, 22.25, 12, 'z', 1, 0); win(group, 11, 14.25, 'x', 1.6, 0); win(group, 20, 14.25, 'x', 1.2, 0);
    win(group, 11, 4.25, 'x', 1.6, FH); win(group, 16, 4.25, 'x', 1.4, FH); win(group, 20, 4.25, 'x', 1.4, FH); win(group, 8.25, 7, 'z', 1.4, FH);
    win(group, 22.25, 7.5, 'z', 1.4, FH); win(group, 11, 14.25, 'x', 1.6, FH); win(group, 18, 14.25, 'x', 1.6, FH);
  }
  function buildDoors(group) {
    doors.forEach(d => {
      const y0 = d.layer ? FH : 0;
      const piv = new THREE.Group(); piv.position.set(d.hx, y0, d.hz);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(d.axis === 'x' ? d.w : .07, 2.1, d.axis === 'x' ? .07 : d.w), M.wood);
      panel.position.set(d.axis === 'x' ? d.w / 2 : 0, 1.05, d.axis === 'x' ? 0 : d.w / 2); panel.castShadow = true; piv.add(panel);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 8), M.steel); knob.position.set(d.axis === 'x' ? d.w - .12 : .06, 1, d.axis === 'x' ? .06 : d.w - .12); piv.add(knob);
      d.mesh = piv; (d.layer ? upG : lowG).add(piv);
    });
  }
  function box(group, mat, w, h, d, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; (y > FH - .3 ? upG : lowG).add(m); return m; }
  function buildFurniture(group) {
    // 거실
    box(group, M.wood, 1.5, .05, 1, 10.75, .42, 7.5); [[10.1, 7.1], [11.4, 7.1], [10.1, 7.9], [11.4, 7.9]].forEach(p => box(group, M.wood, .06, .4, .06, p[0], .2, p[1]));
    box(group, M.sofa, 4, .5, 1, 11, .25, 9); box(group, M.sofa, 4, .5, .3, 11, .75, 9.35); box(group, M.sofa, .3, .4, 1, 9.15, .7, 9); box(group, M.sofa, .3, .4, 1, 12.85, .7, 9);
    box(group, M.dark, 1.6, .9, .1, 8.35, 1.2, 6.2); // TV 뒤 벽걸이 아님 — 옆문 반대편
    // 부엌
    box(group, M.wood, 2, .05, 1.5, 18, .72, 6.25); [[17.1, 5.6], [18.9, 5.6], [17.1, 6.9], [18.9, 6.9]].forEach(p => box(group, M.wood, .07, .7, .07, p[0], .35, p[1]));
    [[17.4, 5.2], [18.6, 5.2], [17.4, 7.4], [18.6, 7.4]].forEach(p => { box(group, M.wood, .4, .04, .4, p[0], .45, p[1]); box(group, M.wood, .04, .45, .04, p[0], .22, p[1]); });
    box(group, M.white, 3.5, .9, .7, 16.25, .45, 4.85); box(group, M.steel, 3.5, .04, .7, 16.25, .92, 4.85); box(group, M.steel, .6, .12, .4, 16.6, 1.0, 4.85);
    box(group, M.white, 1, 1.8, 1, 21.5, .9, 5); box(group, M.steel, .04, .6, .04, 21.05, 1.1, 5.3);
    // 욕실
    box(group, M.white, 1.5, .6, 2, 21.25, .3, 13); box(group, M.white, .6, .8, .5, 18.6, .4, 9.6); box(group, M.white, .7, .1, .5, 18.6, .9, 9.6);
    // 침실1
    box(group, M.bed, 2, .3, 2.5, 10, .3 + FH, 6.25); box(group, M.blanket, 2, .12, 1.6, 10, .48 + FH, 6.7); box(group, M.white, .6, .16, .4, 9.6, .48 + FH, 5.3);
    [[9.1, 5.1], [10.9, 5.1], [9.1, 7.4], [10.9, 7.4]].forEach(p => box(group, M.wood, .08, .32, .08, p[0], .16 + FH, p[1]));
    box(group, M.wood, 1.5, 2, .6, 13.25, 1 + FH, 5.25); box(group, M.wood, .7, .5, .6, 8.7, .25 + FH, 8.5);
    // 침실2
    box(group, M.bed, 2, .3, 2.5, 16, .3 + FH, 6.25); box(group, M.blanket, 2, .12, 1.6, 16, .48 + FH, 6.7); box(group, M.white, .6, .16, .4, 15.6, .48 + FH, 5.3);
    [[15.1, 5.1], [16.9, 5.1], [15.1, 7.4], [16.9, 7.4]].forEach(p => box(group, M.wood, .08, .32, .08, p[0], .16 + FH, p[1]));
    box(group, M.blanket, 1.5, .6, 1.5, 15.25, .3 + FH, 9.75);
    // 서재
    box(group, M.wood, 2.5, .05, 1, 20.25, .75 + FH, 5.5); [[19.1, 5.1], [21.4, 5.1], [19.1, 5.9], [21.4, 5.9]].forEach(p => box(group, M.wood, .07, .73, .07, p[0], .37 + FH, p[1]));
    box(group, M.dark, .5, .35, .05, 20.25, 1.0 + FH, 5.3); box(group, M.wood, .8, .45, .8, 20.25, .23 + FH, 7); box(group, M.wood, 1, 2.2, 4, 21.5, 1.1 + FH, 8.5);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) box(group, [M.sofa, M.blanket, M.leaf2, M.car][(i + j) % 4], .15, .32, .5, 20.95, .35 + i * .5 + FH, 6.8 + j * .55);
    // 개집
    box(group, M.doghouse, 1.5, 1, 1.5, 3.75, .5, 8.75); const dr = new THREE.Mesh(new THREE.BoxGeometry(1.7, .12, 1.7), M.dark); dr.position.set(3.75, 1.05, 8.75); group.add(dr);
    const hole = box(group, new THREE.MeshBasicMaterial({ color: 0x1a0d08 }), .02, .6, .6, 4.51, .35, 8.75);
    // 마당 길
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9.5), M.path); path.rotation.x = -Math.PI / 2; path.position.set(16, .012, 19); path.receiveShadow = true; group.add(path);
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 7.5), M.path); drive.rotation.x = -Math.PI / 2; drive.position.set(25.25, .012, 20.2); drive.receiveShadow = true; group.add(drive);
    // 자동차
    const cx = (CAR.x0 + CAR.x1) / 2, cz = (CAR.z0 + CAR.z1) / 2;
    box(group, M.car, 2.2, .6, 4, cx, .55, cz); box(group, M.car, 1.9, .55, 2, cx, 1.1, cz - .2); box(group, M.glass, 1.8, .45, 1.9, cx, 1.12, cz - .2);
    [[-.9, 1.3], [.9, 1.3], [-.9, -1.3], [.9, -1.3]].forEach(p => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .3, 16), M.tire); t.rotation.z = Math.PI / 2; t.position.set(cx + p[0], .35, cz + p[1]); t.castShadow = true; group.add(t); });
    box(group, M.white, .3, .15, .05, cx - .7, .6, cz + 2); box(group, M.white, .3, .15, .05, cx + .7, .6, cz + 2);
    // 나무
    trees.forEach((t, i) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.15, .22, 2, 8), M.trunk); trunk.position.set(t[0] + .125, 1, t[1] + .125); trunk.castShadow = true; group.add(trunk);
      const s = 1 + (i % 3) * .2; const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 1), i % 2 ? M.leaf : M.leaf2); c1.position.set(t[0] + .125, 2.6 * s, t[1] + .125); c1.castShadow = true; group.add(c1);
      const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1 * s, 1), M.leaf); c2.position.set(t[0] + .5, 3.4 * s, t[1] - .2); c2.castShadow = true; group.add(c2);
    });
    bushes.forEach(b => { const w = b[2] - b[0], d = b[3] - b[1]; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.max(w, d) / 2 + .1, 1), M.leaf2); m.scale.set(w / Math.max(w, d), .7, d / Math.max(w, d)); m.position.set((b[0] + b[2]) / 2, .45, (b[1] + b[3]) / 2); m.castShadow = true; group.add(m); });
    // 울타리
    const fm = new Merger();
    const post = (x, z) => fm.box(.12, 1.1, .12, x, .55, z);
    for (let x = .25; x <= 29.75; x += 1) { post(x, .25); post(x, 23.75); } for (let z = 1.25; z <= 22.75; z += 1) { post(.25, z); post(29.75, z); }
    [.35, .8].forEach(y => { fm.box(30, .08, .05, 15, y, .25); fm.box(30, .08, .05, 15, y, 23.75); fm.box(.05, .08, 24, .25, y, 12); fm.box(.05, .08, 24, 29.75, y, 12); });
    group.add(mesh(fm, M.fence, true));
    // 우편함
    box(group, M.steel, .35, .25, .5, 27.5, 1.1, 23.2); box(group, M.wood, .08, 1, .08, 27.5, .5, 23.2);
  }

  function buildLights(group) {
    const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x9a8b78, .9); group.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.35); sun.position.set(18, 26, 6); sun.target.position.set(15, 0, 12); group.add(sun, sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const s = sun.shadow.camera; s.left = -20; s.right = 20; s.top = 20; s.bottom = -20; s.near = 1; s.far = 70; sun.shadow.bias = -.0008; sun.shadow.normalBias = .03;
    const amb = new THREE.AmbientLight(0xfff4e6, .38); group.add(amb);
    // 실내 등불(값싼 포인트 라이트)
    [[11, 2.6, 7], [18, 2.6, 6.5], [16, 2.6, 11.5], [11, FH + 2.6, 7], [16, FH + 2.6, 7.5], [20, FH + 2.6, 7.5], [11, FH + 2.6, 13]].forEach(p => {
      const pl = new THREE.PointLight(0xffe2b8, 6, 7, 1.6); pl.position.set(p[0], p[1], p[2]); group.add(pl);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff1cc })); lamp.position.set(p[0], p[1] + .2, p[2]); group.add(lamp);
    });
  }

  let lowG, upG, roofG; // 잘라내기(cutaway)용: 1층+마당 / 2층 / 지붕
  function build(scene) {
    const g = new THREE.Group(); lowG = new THREE.Group(); upG = new THREE.Group(); roofG = new THREE.Group(); g.add(lowG, upG, roofG);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 80), M.grass); ground.rotation.x = -Math.PI / 2; ground.position.set(15, 0, 12); ground.receiveShadow = true; g.add(ground);
    buildFloor(0, lowG); buildFloor(1, upG); buildWalls(0, lowG); buildWalls(1, upG); buildStairs(lowG); buildRoof(roofG); buildWindows(lowG); buildDoors(lowG); buildFurniture(lowG); buildLights(g);
    const goal = new THREE.Mesh(new THREE.RingGeometry(.9, 1.2, 40), M.goal); goal.rotation.x = -Math.PI / 2; goal.position.set(GOAL.x, .03, GOAL.z); goal.visible = false; g.add(goal);
    scene.add(g);
    return { group: g, goal, lowG, upG, roofG };
  }

  window.WORLD = { CELL, GX, GZ, FH, T, grid, doors, hideSpots, STAIR, HOUSE, CAR, GOAL, N, idx, cellOf, cellType, passable, blocksSight, lineOfSight, height, layerAt, inStair, inHouse, bfs, neighbors, nodeOf, nodePos, doorAt, doorMap, build, frontDoor, M };
})();
