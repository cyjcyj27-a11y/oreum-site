// terrain.js — 벨라루스 시골 땅: 마을·자작나무 숲·소나무 숲·푸시차 원시림·늪·호수·성 언덕
//   x 동쪽, z 남쪽(북쪽 = -z). 물 높이는 0.
(function () {
  const { clamp, lerp, smoothstep } = U;
  // 맵 60% (사장님 2026-09-17 "맵이 너무 큰 게 문제" → "60%로 줄여"). 옛 판은 src/pre-shrink/
  //   → 같은 날 밤 "맵은 여전히 넓은 느낌" → 한 번 더 2/3 (처음의 40%). 그 전 판은 src/pre-shrink2/
  //   자리·마을 안 배치는 2/3, 밭 크기는 0.8 배. 건물·명소·성 언덕 크기는 그대로
  const K = 0.4, VK = 0.5;
  const HALF = 176, LIMIT = 162;

  const Z = {
    village: { x: 0, z: 24, r: 47.3 },
    lake: { x: 102, z: 70, rx: 56, rz: 42 },
    island: { x: 120, z: 78, r: 10 },
    bonfire: { x: 40, z: 60 },
    swamp: { x: -106, z: 48, r: 48 },
    castle: { x: -74, z: 128, r: 32 },
    clearing: { x: -94, z: -76, r: 20 },
    fern: { x: -132, z: -128 },
    market: { x: 4, z: 18 },
    frost: { x: 72, z: 128 },   // 얼음할아버지 (island.js, 2026-09-18 들판 빈자리)
  };

  // 길 (흙길) — 마을에서 사방으로
  const ROADS = [
    [[0, 24], [22, 10], [48, -12], [76, -36], [100, -60]],
    [[0, 24], [13.3, 46.7], [40, 56.8]],
    [[0, 24], [-4.8, -12], [-1.6, -48], [4, -88], [12, -128]],
    [[-1.6, -48], [-32, -64], [-64, -70], [-90, -76]],
    [[0, 24], [-8, 17.3], [-32, 35.2], [-64, 44], [-80, 47.2]],
    [[0, 24], [-5.3, 61.3], [-40, 92], [-60, 114], [-70, 127.2]],
    [[0, 24], [36, 28], [60, 24], [78, 32]],
  ];
  // 명소 12곳 — 길 끝과 길가 (사장님 2026-09-17 "맵은 넓은데 할 일은 적고 어디로 가야 될지 모르겠다",
  //   "보통은 길을 따라가면 맵이 계속 이어지지 않나"). clear: 나무를 비우는 반지름, r: 발견 거리
  const PLACES = [
    { id: 'mill', x: 55.2, z: 16, clear: 12, r: 14, icon: '🌬️', ko: '풍차', en: 'Windmill' },
    { id: 'pier', x: 80, z: 33.6, clear: 8, r: 12, icon: '⛵', ko: '선착장', en: 'Pier' },
    { id: 'tower', x: 102.4, z: -64, clear: 12, r: 14, icon: '🗼', ko: '망루', en: 'Watchtower' },
    { id: 'hut', x: 52, z: -18.4, clear: 13, r: 13, icon: '🛖', ko: '숲지기 오두막', en: 'Forester’s Hut' },
    { id: 'spring', x: 4, z: -44, clear: 9, r: 11, icon: '⛲', ko: '샘', en: 'Holy Spring' },
    { id: 'camp', x: 15.2, z: -132, clear: 13, r: 13, icon: '⛺', ko: '사냥꾼 야영지', en: 'Hunters’ Camp' },
    { id: 'oak', x: -35.2, z: -70.4, clear: 14, r: 14, icon: '🌳', ko: '참나무 고목', en: 'Ancient Oak' },
    { id: 'hide', x: -79.2, z: -70.4, clear: 10, r: 12, icon: '🔭', ko: '들소 관찰대', en: 'Bison Lookout' },
    { id: 'shack', x: -78.4, z: 53.6, clear: 10, r: 12, icon: '🏚️', ko: '늪 오두막', en: 'Swamp Shack' },
    { id: 'castle', x: -74, z: 128, clear: 0, r: 48, icon: '🏰', ko: '미르 성', en: 'Mir Castle' },
    { id: 'fire', x: 40, z: 60, clear: 0, r: 16, icon: '🔥', ko: '쿠팔라 들판', en: 'Kupala Field' },
    { id: 'island', x: 120, z: 78, clear: 0, r: 13, icon: '🏝️', ko: '호수 섬', en: 'Lake Island' },
  ];

  // 늪 위 나무 길 (널판)
  const BOARDS = [
    [[-80, 47.2], [-94, 42], [-104.8, 50], [-116, 44], [-127.2, 55.2], [-136, 48]],
    [[-104.8, 50], [-100, 64.8], [-110, 78]],
  ];

  // 밭
  const FIELDS = [
    // 줄인 맵에서 집·길·풍차와 안 겹치게 옮긴 자리 (2026-09-17)
    { x: 60, z: 40, w: 30, h: 19, a: 0.18, k: 'potato' },   // 2/3 로 줄인 뒤 주민 집과 겹쳐 동쪽으로
    { x: -52, z: 66.7, w: 38, h: 26, a: -0.3, k: 'rye' },
    { x: 12, z: 74, w: 34, h: 20, a: 0.05, k: 'flax' },
    { x: -46.7, z: -3.3, w: 26, h: 21, a: 0.4, k: 'rye' },
    { x: 66.7, z: 3.3, w: 24, h: 18, a: -0.1, k: 'potato' },
  ];
  for (const f of FIELDS) { f.c = Math.cos(f.a); f.s = Math.sin(f.a); }

  function inField(x, z, pad) {
    pad = pad || 0;
    for (const f of FIELDS) {
      const dx = x - f.x, dz = z - f.z;
      const u = dx * f.c + dz * f.s, v = -dx * f.s + dz * f.c;
      if (Math.abs(u) < f.w / 2 + pad && Math.abs(v) < f.h / 2 + pad) return { f, u, v };
    }
    return null;
  }

  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1);
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  function lineDist(lines, x, z) {
    let best = 1e9;
    for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
      const d = segDist(x, z, l[i][0], l[i][1], l[i + 1][0], l[i + 1][1]);
      if (d < best) best = d;
    }
    return best;
  }
  // 길 거리는 자주 부르니 격자에 미리 구워 둔다
  const RG = 2, RN = (HALF * 2 / RG) | 0;
  let roadGrid = null, boardGrid = null;
  function bakeRoads() {
    roadGrid = new Float32Array(RN * RN); boardGrid = new Float32Array(RN * RN);
    for (let j = 0; j < RN; j++) for (let i = 0; i < RN; i++) {
      const x = -HALF + i * RG, z = -HALF + j * RG;
      roadGrid[j * RN + i] = Math.min(lineDist(ROADS, x, z), 60);
      boardGrid[j * RN + i] = Math.min(lineDist(BOARDS, x, z), 60);
    }
  }
  function gridAt(g, x, z) {
    const fx = (x + HALF) / RG, fz = (z + HALF) / RG;
    const i = clamp(fx | 0, 0, RN - 2), j = clamp(fz | 0, 0, RN - 2);
    const u = clamp(fx - i, 0, 1), v = clamp(fz - j, 0, 1);
    return lerp(lerp(g[j * RN + i], g[j * RN + i + 1], u), lerp(g[(j + 1) * RN + i], g[(j + 1) * RN + i + 1], u), v);
  }
  const roadD = (x, z) => gridAt(roadGrid, x, z);
  const boardD = (x, z) => gridAt(boardGrid, x, z);

  function lakeE(x, z) { const dx = (x - Z.lake.x) / Z.lake.rx, dz = (z - Z.lake.z) / Z.lake.rz; return Math.sqrt(dx * dx + dz * dz) + N.fbm(x / 24, z / 24, 2) * 0.12; }

  // 땅 높이 (분석식 — 걷기·배치·지형 그물이 모두 이것을 쓴다)
  function H(x, z) {
    let h = 2.6 + N.fbm(x / 150, z / 150, 3) * 5 + N.fbm(x / 34, z / 34, 2) * 0.7;
    // 마을은 평평하게
    const dv = Math.hypot(x - Z.village.x, z - Z.village.z);
    h = lerp(h, 2.4 + N.fbm(x / 50, z / 50, 2) * 0.5, 1 - smoothstep(35, 63, dv));
    // 밭도 평평
    const fi = inField(x, z, 8);
    if (fi) h = lerp(h, 2.5 + N.fbm(x / 60, z / 60, 2) * 0.6, 0.7);
    h = Math.max(h, 0.9);
    // 늪 — 물 높이 언저리를 오르내린다
    const ds = Math.hypot(x - Z.swamp.x, z - Z.swamp.z) + N.fbm(x / 20, z / 20, 2) * 10;
    const ws = 1 - smoothstep(32, 56, ds);
    if (ws > 0) h = lerp(h, 0.05 + N.fbm(x / 16, z / 16, 3) * 1.3 + N.fbm(x / 5, z / 5, 1) * 0.15, ws);
    // 호수
    const e = lakeE(x, z);
    const wl = 1 - smoothstep(0.82, 1.16, e);
    if (wl > 0) {
      const k = Math.max(0, 1 - e);
      h = lerp(h, 0.55 - 1.2 - 5.2 * Math.min(1, k * 2.2), wl);
    }
    // 호수 섬
    const di = Math.hypot(x - Z.island.x, z - Z.island.z);
    if (di < 20) h = Math.max(h, lerp(-3, 1.6, 1 - smoothstep(4, 18, di)) + N.fbm(x / 6, z / 6, 1) * 0.3);
    // 성 언덕 — 꼭대기는 평평
    const dc = Math.hypot(x - Z.castle.x, z - Z.castle.z);
    h += 13 * (1 - smoothstep(34, 58, dc));
    if (dc < 40) h = lerp(h, 16.2, 1 - smoothstep(30, 40, dc));
    // 길은 살짝 다져 낮춘다
    const rd = roadGrid ? roadD(x, z) : 99;
    if (rd < 3) h -= (1 - rd / 3) * 0.12;
    // 가장자리 언덕
    const m = Math.max(Math.abs(x), Math.abs(z));
    h += smoothstep(144, 176, m) * 16;
    return h;
  }

  function water(x, z) { return 0; }
  // 물 깊이 (+ 이면 물속)
  function depth(x, z) { return -H(x, z); }

  // 숲 종류
  function forest(x, z) {
    const dv = Math.hypot(x - Z.village.x, z - Z.village.z);
    if (dv < 57) return null;
    if (lakeE(x, z) < 1.2) return null;
    if (inField(x, z, 10)) return null;
    if (roadD(x, z) < 5) return null;
    if (Math.hypot(x - Z.castle.x, z - Z.castle.z) < 46) return null;
    if (Math.hypot(x - Z.clearing.x, z - Z.clearing.z) < Z.clearing.r) return { k: 'meadow', d: 0.02 };
    if (Math.hypot(x - Z.bonfire.x, z - Z.bonfire.z) < 14) return null;
    if (Math.hypot(x - Z.frost.x, z - Z.frost.z) < 9) return null;
    for (const p of PLACES) if (p.clear && Math.hypot(x - p.x, z - p.z) < p.clear) return null;
    const nz = N.fbm(x / 36, z / 36, 2) * 24;
    const m = Math.max(Math.abs(x), Math.abs(z));
    if (m > 152) return { k: 'spruce', d: 0.8 };
    if (Math.hypot(x - Z.swamp.x, z - Z.swamp.z) < 54 + nz * 0.3) return { k: 'swamp', d: 0.1 };
    if (x < -42 + nz && z < -18 + nz) return { k: 'pushcha', d: 0.72 };
    if (z < -46 + nz) return { k: 'pine', d: 0.58 };
    if (x > 30 + nz && z < 22 + nz) return { k: 'birch', d: 0.62 };
    return { k: 'meadow', d: 0.035 };
  }

  // ── 그림 ──
  function grassTex() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const img = g.createImageData(S, S);
    const r = U.mulberry(7);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      // 이음매 없는 잡음 (주기 256)
      const n = N.fbm(x / 16, y / 16, 3) * 0.5 + N.fbm(x / 4, y / 4, 2) * 0.35;
      const v = 200 + n * 70 + (r() - 0.5) * 36;
      const i = (y * S + x) * 4;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // 짧은 풀 획
    for (let k = 0; k < 2600; k++) {
      const x = r() * S, y = r() * S, l = 2 + r() * 5, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.18)';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const C = (h) => new THREE.Color(h);
  const COL = {
    grass: C('#5f8a3a'), grass2: C('#86a24a'), dry: C('#a3a35a'),
    birch: C('#6f8c3c'), pine: C('#6b6a3e'), push: C('#3f5a2c'), spruce: C('#3e4f2a'),
    swamp: C('#5c6a36'), mud: C('#5a5038'), sand: C('#b9a57a'), lakebed: C('#5a5540'),
    road: C('#8a7556'), potato: C('#5a4630'), potatoG: C('#4f7a30'), rye: C('#c9b46a'), flax: C('#7d9bc4'),
    rock: C('#7d7a70'), hill: C('#6c8a40'),
  };

  function colorAt(x, z, h, out) {
    const f = forest(x, z);
    const n = N.fbm(x / 22, z / 22, 2);
    out.copy(COL.grass).lerp(COL.grass2, clamp(0.5 + n * 1.4, 0, 1));
    if (N.fbm(x / 70 + 9, z / 70, 2) > 0.18) out.lerp(COL.dry, 0.35);
    if (f) {
      const k = f.k;
      if (k === 'birch') out.lerp(COL.birch, 0.6);
      else if (k === 'pine') out.lerp(COL.pine, 0.75);
      else if (k === 'pushcha') out.lerp(COL.push, 0.8);
      else if (k === 'spruce') out.lerp(COL.spruce, 0.8);
      else if (k === 'swamp') out.lerp(COL.swamp, 0.8);
    }
    const fi = inField(x, z, 0);
    if (fi) {
      const k = fi.f.k;
      if (k === 'potato') { const row = Math.sin(fi.v * 2.4) > 0 ? 1 : 0; out.copy(row ? COL.potatoG : COL.potato); }
      else if (k === 'rye') out.copy(COL.rye).multiplyScalar(0.9 + n * 0.3);
      else if (k === 'flax') out.copy(COL.flax).lerp(COL.grass, 0.25 + n * 0.3);
    }
    if (h < 0.3) out.lerp(COL.mud, clamp((0.3 - h) * 1.6, 0, 0.6));
    const e = lakeE(x, z);
    if (e < 1.12 && h < 1.4) out.lerp(COL.sand, clamp((1.4 - h) * 0.9, 0, 0.9));
    if (e < 0.95) out.lerp(COL.lakebed, clamp(-h * 0.4, 0, 1));
    const rd = roadD(x, z);
    if (rd < 2.6) out.lerp(COL.road, clamp((2.6 - rd) * 0.9, 0, 0.95));
    const m = Math.max(Math.abs(x), Math.abs(z));
    if (m > 158) out.lerp(COL.spruce, 0.5);
    return out;
  }

  let ground = null, waterMesh = null, waterNormal = null;
  function build(scene) {
    bakeRoads();
    const SEG = 160;
    const geo = new THREE.PlaneGeometry(HALF * 2, HALF * 2, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = H(x, z);
      pos.setY(i, h);
      colorAt(x, z, h, c);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const tex = grassTex();
    tex.repeat.set(HALF / 3, HALF / 3);
    const mat = new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.97, metalness: 0 });
    ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // 물 — 하늘을 비추는 잔잔한 수면
    waterNormal = waterNormalTex();
    const wm = new THREE.MeshStandardMaterial({
      color: 0x24424e, roughness: 0.14, metalness: 0.0, transparent: true, opacity: 0.9,
      normalMap: waterNormal, normalScale: new THREE.Vector2(0.3, 0.3), envMapIntensity: 0.55,
    });
    const wg = new THREE.PlaneGeometry(HALF * 2, HALF * 2, 1, 1);
    wg.rotateX(-Math.PI / 2);
    waterMesh = new THREE.Mesh(wg, wm);
    waterMesh.position.y = 0;
    waterMesh.renderOrder = 2;
    scene.add(waterMesh);
    return ground;
  }

  function waterNormalTex() {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d'), img = g.createImageData(S, S);
    const hgt = (x, y) => N.fbm(x / 22, y / 22, 3) + N.fbm(x / 7 + 5, y / 9, 2) * 0.3;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1);
      const i = (y * S + x) * 4;
      img.data[i] = 128 + dx * 300; img.data[i + 1] = 128 + dy * 300; img.data[i + 2] = 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(90, 90);
    return t;
  }

  function update(dt) {
    if (waterNormal) { waterNormal.offset.x += dt * 0.004; waterNormal.offset.y += dt * 0.0027; }
  }

  window.TER = { K, VK, Z, ROADS, BOARDS, FIELDS, PLACES, HALF, LIMIT, H, depth, forest, inField, roadD, boardD, lakeE, colorAt, build, update,
    get ground() { return ground; }, get water() { return waterMesh; } };
})();
