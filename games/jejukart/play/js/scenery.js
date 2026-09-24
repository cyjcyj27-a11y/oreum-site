// 테마별(제주 12곳) 하늘·빛·소품. 소품은 정점색으로 구역마다 한 덩어리로 합치고(그리기 명령 아끼기),
// 부딪히는 것은 PHYS 에 충돌체를 같이 등록한다. 라바콘·드럼통·화분처럼 가벼운 것은 PHYS 의 날아가는 소품으로 만든다.
(function () {
  const C = new THREE.Color();
  const V3 = new THREE.Vector3(), N3 = new THREE.Vector3(), M3 = new THREE.Matrix3();

  // ---------- 지오메트리 모으기 (정점색 + 세계 좌표 기준 UV) ----------
  function Bag() {
    this.pos = []; this.nor = []; this.col = []; this.uv = []; this.idx = []; this.n = 0;
  }
  Bag.prototype.add = function (geo, color, m) {
    const g = geo;
    const p = g.attributes.position, nr = g.attributes.normal;
    M3.getNormalMatrix(m);
    C.set(color);
    for (let i = 0; i < p.count; i++) {
      V3.fromBufferAttribute(p, i).applyMatrix4(m);
      this.pos.push(V3.x, V3.y, V3.z);
      N3.fromBufferAttribute(nr, i).applyMatrix3(M3).normalize();
      this.nor.push(N3.x, N3.y, N3.z);
      this.col.push(C.r, C.g, C.b);
      // 면이 향한 축을 빼고 남은 두 축으로 UV (회벽 결이 어디서나 같은 크기로 보이게)
      const ax = Math.abs(N3.x), ay = Math.abs(N3.y), az = Math.abs(N3.z);
      if (ay >= ax && ay >= az) this.uv.push(V3.x / 1.4, V3.z / 1.4);
      else if (ax >= az) this.uv.push(V3.z / 1.4, V3.y / 1.4);
      else this.uv.push(V3.x / 1.4, V3.y / 1.4);
    }
    const id = g.index;
    if (id) for (let i = 0; i < id.count; i++) this.idx.push(this.n + id.getX(i));
    else for (let i = 0; i < p.count; i++) this.idx.push(this.n + i);
    this.n += p.count;
  };
  Bag.prototype.geometry = function () {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  };
  Bag.prototype.mesh = function (mat) {
    if (!this.n) return null;
    return new THREE.Mesh(this.geometry(), mat);
  };

  // 자주 쓰는 도형 (한 번 만들어 재사용)
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    cone: new THREE.ConeGeometry(0.5, 1, 12),
    sph: new THREE.SphereGeometry(0.5, 12, 8),
    sphLo: new THREE.SphereGeometry(0.5, 8, 6),
    tor: new THREE.TorusGeometry(0.5, 0.08, 6, 14),
    plane: new THREE.PlaneGeometry(1, 1),
  };
  function M(x, y, z, sx, sy, sz, ry, rx, rz) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ'));
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    return m;
  }
  const sh = (hex, f) => { C.set(hex); C.multiplyScalar(f); return C.getHex(); };

  // 회벽 결 (모든 소품이 같이 쓴다 — 민짜 면을 없애 준다)
  let grain = null;
  function grainTex() {
    if (grain) return grain;
    const S = 128, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = '#f4f4f4';
    g.fillRect(0, 0, S, S);
    const im = g.getImageData(0, 0, S, S), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(im, 0, 0);
    g.fillStyle = 'rgba(0,0,0,.06)';
    for (let i = 0; i < 40; i++) g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1 + Math.random() * 2);
    grain = new THREE.CanvasTexture(cv);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.colorSpace = THREE.SRGBColorSpace;
    return grain;
  }
  function propMaterial() { return new THREE.MeshLambertMaterial({ vertexColors: true, map: grainTex() }); }

  // 큰 소품을 놓기 전에 도로·인도와 겹치는지 본다 (코너 안쪽에서 옆으로 밀어 세운 건물이 도로 위로 올라오던 것)
  let curT = null;
  function roadClear(x, z, ry, hx, hz) {
    if (!curT) return true;
    const c = Math.cos(ry), sn = Math.sin(ry), P2 = { x: 0, y: 0, z: 0 };
    const pts = [[0, 0], [hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz], [hx, 0], [-hx, 0], [0, hz], [0, -hz]];
    for (const [lx, lz] of pts) {
      const w = toW(x + lx * c + lz * sn, z - lx * sn + lz * c);
      P2.x = w.x; P2.z = w.z;
      const l = TRACK.locate(curT, P2, null);
      if (Math.abs(l.t) - l.hw < 3.8) return false;
    }
    return true;
  }

  // 인도 소품용: 이 자리가 정말 도로 밖(가장자리에서 0.7m 이상)인가 — 코너 안쪽에서 옆으로 민 자리가 도로 위일 수 있다
  const PT = { x: 0, y: 0, z: 0 };
  function sideClear(x, z, need) {
    if (!curT) return true;
    const w = toW(x, z);
    PT.x = w.x; PT.z = w.z;
    const l = TRACK.locate(curT, PT, null);
    return Math.abs(l.t) - l.hw >= (need == null ? 0.7 : need);
  }

  // ---------- 도로 좌표계 ----------
  // 테마 콜백과 빌더는 "x = 도로 옆(오른쪽 +), z = 진행 방향, y = 도로 높이 0" 인 좌표로 그린다.
  // FRAME 이 그것을 세계 좌표로 돌린다 (경계 담장처럼 세계 좌표로 직접 그릴 땐 noFrame()).
  const FRAME = new THREE.Matrix4();
  let fr = { ox: 0, oy: 0, oz: 0, cos: 1, sin: 0, ry: 0, on: false };
  function frameAt(a) {
    const ry = Math.atan2(a.tan.x, a.tan.z);
    fr = { ox: a.p.x, oy: a.p.y, oz: a.p.z, cos: Math.cos(ry), sin: Math.sin(ry), ry, on: true };
    FRAME.makeRotationY(ry).setPosition(a.p.x, a.p.y, a.p.z);
  }
  function noFrame() { fr = { ox: 0, oy: 0, oz: 0, cos: 1, sin: 0, ry: 0, on: false }; FRAME.identity(); }
  const toW = (x, z) => fr.on ? { x: fr.ox + x * fr.cos + z * fr.sin, z: fr.oz - x * fr.sin + z * fr.cos } : { x, z };

  // 충돌체 등록 (PHYS 가 없으면 그냥 넘어간다 — 상점 미리보기 등). 좌표는 도로 좌표계 → 세계로 바꿔 넣는다
  const P = {
    box: (x, z, ry, hx, hz, o) => { if (!window.PHYS) return; const w = toW(x, z); PHYS.box(w.x, w.z, ry + fr.ry, hx, hz, o); },
    circle: (x, z, r, o) => { if (!window.PHYS) return; const w = toW(x, z); PHYS.circle(w.x, w.z, r, o); },
    dyn: (kind, x, z, ry, tint) => { if (!window.PHYS || !sideClear(x, z)) return; const w = toW(x, z); PHYS.dyn(kind, w.x, fr.oy, w.z, (ry || 0) + fr.ry, tint); },
  };

  // ---------- 낱개 소품 ----------
  // 건물: 회벽 + 밑단 띠 + 모서리 기둥 + 창틀·유리·창턱 + 문 + 지붕 난간 + 옥상 물건
  // opt: front(도로 쪽 부호), shop(1층 상가), balcony(발코니), night(불 켜진 창), simple(먼 고층: 유리만), tank, ac
  function building(B, E, x, z, w, h, d, ry, wall, win, opt) {
    opt = opt || {};
    if (!roadClear(x, z, ry, w / 2 + 0.3, d / 2 + 0.3)) return;
    const dir = { x: Math.sin(ry), z: Math.cos(ry) }, sd = { x: Math.cos(ry), z: -Math.sin(ry) };
    const put = (geo, col, lx, ly, lz, sx, sy, sz, rx, rz) =>
      B.add(geo, col, M(x + sd.x * lx + dir.x * lz, ly, z + sd.z * lx + dir.z * lz, sx, sy, sz, ry, rx, rz));
    const putE = (geo, col, lx, ly, lz, sx, sy, sz) =>
      E.add(geo, col, M(x + sd.x * lx + dir.x * lz, ly, z + sd.z * lx + dir.z * lz, sx, sy, sz, ry));
    const front = opt.front || 1;
    const dark = sh(wall, 0.78), light = sh(wall, 1.08);

    put(G.box, wall, 0, h / 2, 0, w, h, d);
    put(G.box, dark, 0, 0.36, 0, w + 0.14, 0.72, d + 0.14);                 // 밑단 띠
    for (const sx of [-1, 1]) for (const sz of [-1, 1])                    // 모서리 기둥
      put(G.box, light, sx * (w / 2 - 0.15), h / 2, sz * (d / 2 - 0.15), 0.42, h, 0.42);
    put(G.box, dark, 0, h + 0.14, 0, w + 0.5, 0.28, d + 0.5);               // 지붕 슬래브
    put(G.box, sh(wall, 0.9), 0, h + 0.55, 0, w + 0.1, 0.55, 0.22);          // 난간 (앞뒤)
    put(G.box, sh(wall, 0.9), 0, h + 0.55, 0, 0.22, 0.55, d + 0.1);          // 난간 (양옆)

    const floorH = 3.0, nF = Math.max(1, Math.floor((h - 0.9) / floorH));
    const glassDay = win, glassNight = 0x1c2634, frame = 0xe8e4da, sill = sh(wall, 0.85);
    const winCols = Math.max(1, Math.round(w / 2.5)), winCols2 = Math.max(1, Math.round(d / 2.5));
    const lit = () => opt.night && Math.random() < 0.55;
    for (let f = 0; f < nF; f++) {
      const y = 1.0 + f * floorH + 1.35;
      if (y + 0.8 > h) break;
      // 앞뒤 면 (±sd) — 도로 쪽이 앞
      for (let c = 0; c < winCols; c++) {
        const lx = (c - (winCols - 1) / 2) * (w / winCols);
        for (const s of [1, -1]) {
          const isFront = s === front;
          if (f === 0 && isFront && opt.shop) continue;                  // 1층 앞은 상가
          if (f === 0 && isFront && c === 0) continue;                    // 1층 앞 첫 칸은 문
          const on = lit();
          const face = s * (w / 2);
          if (!opt.simple) { put(G.box, frame, face + s * 0.05, y, lx, 0.1, 1.52, 1.32); put(G.box, sill, face + s * 0.16, y - 0.82, lx, 0.3, 0.1, 1.5); }
          if (on) putE(G.box, win, face + s * 0.1, y, lx, 0.1, 1.3, 1.1);
          else put(G.box, opt.night ? glassNight : glassDay, face + s * 0.1, y, lx, 0.1, 1.3, 1.1);
          if (opt.balcony && isFront && f >= 1) {
            put(G.box, sh(wall, 0.92), face + s * 0.5, y - 0.9, lx, 0.95, 0.14, 1.9);
            put(G.box, 0xdfe6ee, face + s * 0.95, y - 0.5, lx, 0.06, 0.62, 1.9);
          }
        }
      }
      // 양옆 면 (±dir)
      for (let c = 0; c < winCols2; c++) {
        const lz = (c - (winCols2 - 1) / 2) * (d / winCols2);
        for (const s of [1, -1]) {
          const on = lit();
          const face = s * (d / 2);
          if (!opt.simple) { put(G.box, frame, lz, y, face + s * 0.05, 1.32, 1.52, 0.1); put(G.box, sill, lz, y - 0.82, face + s * 0.16, 1.5, 0.1, 0.3); }
          if (on) putE(G.box, win, lz, y, face + s * 0.1, 1.1, 1.3, 0.1);
          else put(G.box, opt.night ? glassNight : glassDay, lz, y, face + s * 0.1, 1.1, 1.3, 0.1);
        }
      }
    }
    // 1층 문 (도로 쪽 첫 칸)
    const doorLx = (0 - (winCols - 1) / 2) * (w / winCols), fw = front * (w / 2);
    put(G.box, 0x3a2f28, fw + front * 0.06, 1.15, doorLx, 0.12, 2.3, 1.2);
    put(G.box, 0x2a221c, fw + front * 0.1, 1.15, doorLx, 0.08, 2.1, 0.98);
    put(G.box, 0xd8c8a8, fw + front * 0.16, 1.1, doorLx + 0.32, 0.1, 0.08, 0.08);
    put(G.box, dark, fw + front * 0.35, 0.08, doorLx, 0.6, 0.16, 1.5);   // 계단
    if (opt.shop) { // 1층 상가: 큰 유리 + 차양 + 간판
      const sc = [0xd8432f, 0x2f7fd8, 0x3fa05a, 0xf0a72a, 0x8a5ad8][(Math.random() * 5) | 0];
      const cz = w * 0.12;
      put(G.box, 0xbfd6e4, fw + front * 0.06, 1.35, cz, 0.1, 2.0, w * 0.55);
      put(G.box, 0x2f3540, fw + front * 0.02, 1.35, cz, 0.08, 2.1, w * 0.58);
      put(G.box, sc, fw + front * 0.8, 2.62, cz, 1.6, 0.14, w * 0.62, 0, front * 0.24);
      put(G.box, sh(sc, 0.8), fw + front * 0.12, 3.1, cz, 0.16, 0.72, w * 0.64);
      put(G.box, 0xfff4d8, fw + front * 0.22, 3.1, cz, 0.04, 0.34, w * 0.4);
    }
    // 옥상
    if (opt.tank) { put(G.cyl, 0x9fb6c6, w * 0.25, h + 1.2, -d * 0.2, 1.6, 1.8, 1.6); put(G.box, 0x6a7078, w * 0.25, h + 0.45, -d * 0.2, 1.4, 0.4, 1.4); }
    if (Math.random() < 0.5) put(G.box, sh(wall, 0.95), -w * 0.28, h + 1.2, d * 0.2, 2.2, 2.4, 2.4);     // 계단실
    if (Math.random() < 0.6) { put(G.cyl6, 0x7a7a80, w * 0.35, h + 1.8, d * 0.35, 0.08, 3.4, 0.08); put(G.box, 0x7a7a80, w * 0.35, h + 3.2, d * 0.35, 1.2, 0.06, 0.06); }
    if (opt.ac) for (let i = 0; i < 3; i++) {
      const yy = 2.4 + i * floorH;
      if (yy > h - 1) break;
      put(G.box, 0xd8d8d2, fw + front * 0.36, yy, -w * 0.3, 0.6, 0.7, 0.9);
      put(G.cyl, 0x8a8f96, fw + front * 0.66, yy, -w * 0.3, 0.5, 0.06, 0.5, 0, Math.PI / 2);
    }
    P.box(x, z, ry, w / 2 + 0.06, d / 2 + 0.06, { kind: 'building' });
  }

  // 전봇대 + 가로대 + 변압기
  function pole(B, x, z, h) {
    if (!sideClear(x, z, 0.7)) return;
    B.add(G.cyl6, 0x9a9a95, M(x, h / 2, z, 0.3, h, 0.3, 0));
    B.add(G.box, 0x7d7a72, M(x, h - 0.6, z, 2.6, 0.16, 0.16, 0.3));
    B.add(G.box, 0x6e6b64, M(x, h - 1.4, z, 2.0, 0.14, 0.14, 0.3));
    B.add(G.cyl, 0x6a6e72, M(x + 0.35, h - 2.2, z, 0.5, 0.9, 0.5, 0));
    for (let i = -1; i <= 1; i++) B.add(G.cyl, 0xd8d8d0, M(x + i * 0.9, h - 0.4, z, 0.14, 0.24, 0.14, 0));
    P.circle(x, z, 0.24, { kind: 'post' });
  }

  // 가로등 (밤이면 전구가 빛난다)
  function lamp(B, E, x, z, ry, night) {
    if (!sideClear(x, z, 0.7)) return;
    B.add(G.cyl6, 0x707078, M(x, 2.5, z, 0.18, 5.0, 0.18, 0));
    B.add(G.cyl6, 0x5e6068, M(x, 0.25, z, 0.34, 0.5, 0.34, 0));
    B.add(G.box, 0x707078, M(x + Math.sin(ry) * 0.75, 4.9, z + Math.cos(ry) * 0.75, 0.14, 0.14, 1.6, ry));
    B.add(G.box, 0x5e6068, M(x + Math.sin(ry) * 1.5, 4.72, z + Math.cos(ry) * 1.5, 0.6, 0.16, 1.0, ry));
    (night ? E : B).add(G.box, night ? 0xfff0b8 : 0xe6e6dc, M(x + Math.sin(ry) * 1.5, 4.6, z + Math.cos(ry) * 1.5, 0.5, 0.1, 0.9, ry));
    P.circle(x, z, 0.2, { kind: 'post' });
  }

  // 테마별 경계 (도로 가장자리에서 3.4m, 코스 전체에 이어진다)
  function boundary(B, E, kind, x, z, ry, len, r, side) {
    const dx = Math.cos(ry), dz = -Math.sin(ry); // 도로 옆 방향 (side 를 곱하면 바깥쪽)
    const fx = Math.sin(ry), fz = Math.cos(ry);  // 도로 방향
    if (kind === 'hedge') {
      const col = [0x3f7a3a, 0x47883f, 0x3a7036][(r * 3) | 0];
      B.add(G.box, col, M(x, 0.48, z, 0.95, 0.96, len, ry));
      B.add(G.box, sh(col, 1.14), M(x, 0.94, z, 0.82, 0.16, len * 0.98, ry));
      B.add(G.box, sh(col, 0.85), M(x, 0.2, z, 1.0, 0.4, len, ry));
    } else if (kind === 'wood') {
      const col = [0x9a7248, 0x8a6640, 0xa87c50][(r * 3) | 0];
      for (const yy of [0.32, 0.7]) B.add(G.box, col, M(x, yy, z, 0.1, 0.14, len, ry));
      for (let i = -1; i <= 1; i++) B.add(G.box, sh(col, 0.8), M(x + fx * i * len * 0.42, 0.45, z + fz * i * len * 0.42, 0.16, 0.9, 0.16, ry));
    } else if (kind === 'guard') {
      B.add(G.box, 0xb8bcc2, M(x, 0.72, z, 0.12, 0.34, len, ry));
      B.add(G.box, 0x9aa0a8, M(x, 0.72, z, 0.16, 0.1, len, ry));
      for (let i = -1; i <= 1; i++) B.add(G.box, 0x6a6e76, M(x + fx * i * len * 0.42, 0.4, z + fz * i * len * 0.42, 0.14, 0.8, 0.14, ry));
    } else if (kind === 'doldam' || kind === 'doldamLow') {   // 현무암 돌담
      doldam(B, x, z, ry, len, kind === 'doldam' ? 1.3 : 0.85);
    } else if (kind === 'rope') {   // 해변: 나무 말뚝 + 밧줄
      for (let i = -1; i <= 1; i++) B.add(G.cyl6, 0x8a6a44, M(x + fx * i * len * 0.42, 0.5, z + fz * i * len * 0.42, 0.2, 1.0, 0.2, 0));
      for (const yy of [0.45, 0.8]) B.add(G.box, 0xd8c8a0, M(x, yy, z, 0.05, 0.05, len, ry));
    } else if (kind === 'log') {   // 숲길: 통나무 난간
      for (const yy of [0.42, 0.8]) B.add(G.cyl6, [0x6a4a30, 0x5a3e28][yy > 0.5 ? 0 : 1], M(x, yy, z, 0.24, len, 0.24, ry, Math.PI / 2));
      for (let i = -1; i <= 1; i++) B.add(G.cyl6, 0x4e3624, M(x + fx * i * len * 0.42, 0.5, z + fz * i * len * 0.42, 0.26, 1.0, 0.26, 0));
    }
    // 충돌체는 바깥으로 두껍게 (빠른 카트가 얇은 판을 뚫고 지나가지 못하게). 안쪽 면은 그림과 같은 자리
    const o = side || 1;
    P.box(x + dx * o * 0.45, z + dz * o * 0.45, ry, 0.62, len / 2 + 0.2, { kind: 'wall' });
  }

  // 주차된 차: 아래 몸통 + 보닛·트렁크 + 캐빈(창틀·유리) + 범퍼·라이트·거울 + 바퀴
  function car(B, E, x, z, ry, col, night) {
    if (!sideClear(x, z, 1.2)) return;
    const fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
    const put = (geo, c, lx, ly, lz, w, h, d, rx) => B.add(geo, c, M(x + sx * lx + fx * lz, ly, z + sz * lx + fz * lz, w, h, d, ry, rx));
    const putE = (geo, c, lx, ly, lz, w, h, d) => E.add(geo, c, M(x + sx * lx + fx * lz, ly, z + sz * lx + fz * lz, w, h, d, ry));
    put(G.box, col, 0, 0.62, 0, 1.9, 0.5, 4.2);
    put(G.box, sh(col, 0.72), 0, 0.4, 0, 1.94, 0.22, 4.24);                 // 아래 어두운 띠
    put(G.box, sh(col, 1.06), 0, 0.98, 1.25, 1.78, 0.24, 1.5);               // 보닛
    put(G.box, sh(col, 1.03), 0, 1.0, -1.45, 1.78, 0.3, 1.1);                // 트렁크
    put(G.box, col, 0, 1.3, -0.2, 1.66, 0.5, 1.95);                          // 캐빈
    put(G.box, sh(col, 1.1), 0, 1.57, -0.2, 1.5, 0.06, 1.7);                 // 지붕
    const glass = night ? 0x1c2634 : 0x2b3a4c;
    put(G.box, glass, 0, 1.3, 0.83, 1.5, 0.44, 0.08, 0.5);                   // 앞유리(기울임)
    put(G.box, glass, 0, 1.3, -1.2, 1.5, 0.44, 0.08, -0.55);                 // 뒷유리
    for (const s of [-1, 1]) {
      put(G.box, glass, s * 0.84, 1.32, -0.2, 0.06, 0.4, 1.6);               // 옆유리
      put(G.box, 0x1b1b1e, s * 0.94, 1.36, 0.42, 0.04, 0.44, 0.04);          // B필러
      put(G.box, sh(col, 0.9), s * 1.0, 1.15, 0.6, 0.16, 0.14, 0.3);         // 거울
    }
    put(G.box, 0x3a3f46, 0, 0.5, 2.15, 1.96, 0.28, 0.2);                     // 앞 범퍼
    put(G.box, 0x3a3f46, 0, 0.5, -2.15, 1.96, 0.28, 0.2);                    // 뒤 범퍼
    put(G.box, 0x1b1b1e, 0, 0.62, 2.14, 1.2, 0.26, 0.06);                    // 그릴
    put(G.box, 0xf2f2ee, 0, 0.5, 2.26, 0.5, 0.14, 0.03);                     // 번호판
    for (const s of [-1, 1]) {
      (night ? putE : put)(G.box, night ? 0xffe6b0 : 0xe8e2d2, s * 0.65, 0.78, 2.12, 0.42, 0.22, 0.06);
      (night ? putE : put)(G.box, night ? 0xff5a4a : 0x9c2b26, s * 0.65, 0.84, -2.12, 0.42, 0.2, 0.06);
    }
    const off = [[0.86, 1.35], [-0.86, 1.35], [0.86, -1.35], [-0.86, -1.35]];
    for (const [ox, oz] of off) {
      put(G.cyl, 0x1b1b1e, ox, 0.34, oz, 0.68, 0.3, 0.68, 0);
      put(G.cyl, 0xc9ced4, ox * 1.02, 0.34, oz, 0.34, 0.32, 0.34, 0);
    }
    P.box(x, z, ry, 1.0, 2.2, { kind: 'car' });
  }

  function bench(B, x, z, ry) {
    if (!sideClear(x, z, 0.9)) return;
    B.add(G.box, 0x8a5a33, M(x, 0.44, z, 1.7, 0.08, 0.5, ry));
    B.add(G.box, 0x94623a, M(x, 0.47, z, 1.7, 0.04, 0.16, ry));
    B.add(G.box, 0x7a4f2c, M(x - Math.sin(ry) * 0.24, 0.76, z - Math.cos(ry) * 0.24, 1.7, 0.5, 0.08, ry, 0.15));
    for (const s of [-1, 1]) {
      B.add(G.box, 0x50545a, M(x + Math.cos(ry) * s * 0.7, 0.2, z - Math.sin(ry) * s * 0.7, 0.08, 0.42, 0.46, ry));
      B.add(G.box, 0x50545a, M(x + Math.cos(ry) * s * 0.7 - Math.sin(ry) * 0.24, 0.6, z - Math.sin(ry) * s * 0.7 - Math.cos(ry) * 0.24, 0.08, 0.5, 0.06, ry));
    }
    P.box(x, z, ry, 0.9, 0.32, { kind: 'bench' });
  }

  // 시장 천막 좌판
  function stall(B, x, z, ry, col) {
    if (!sideClear(x, z, 1.4)) return;
    B.add(G.box, 0x6b4a2e, M(x, 0.5, z, 2.6, 0.12, 1.3, ry));
    B.add(G.box, 0x7a5535, M(x, 0.25, z, 2.4, 0.5, 1.1, ry));
    for (const s of [-1, 1]) for (const t of [-1, 1])
      B.add(G.cyl6, 0x9a9a92, M(x + Math.cos(ry) * s * 1.2 + Math.sin(ry) * t * 0.55, 1.15, z - Math.sin(ry) * s * 1.2 + Math.cos(ry) * t * 0.55, 0.08, 2.3, 0.08, 0));
    B.add(G.box, col, M(x, 2.36, z, 3.1, 0.14, 1.9, ry, 0.1));
    B.add(G.box, sh(col, 0.8), M(x + Math.sin(ry) * 0.9, 2.05, z + Math.cos(ry) * 0.9, 3.1, 0.5, 0.1, ry));
    B.add(G.box, 0xffffff, M(x + Math.sin(ry) * 0.9, 1.82, z + Math.cos(ry) * 0.9, 3.1, 0.08, 0.12, ry));
    const goods = [0xe0452f, 0xf0a72a, 0x2f9c4a, 0xf2e44a, 0x8a5ad8];
    for (let i = 0; i < 4; i++) {
      const gx = (i - 1.5) * 0.6;
      B.add(G.box, 0xd8c8a8, M(x + Math.cos(ry) * gx, 0.68, z - Math.sin(ry) * gx, 0.52, 0.26, 0.5, ry));
      for (let k = 0; k < 3; k++) B.add(G.sphLo, goods[(i + k) % 5], M(x + Math.cos(ry) * (gx + (k - 1) * 0.14), 0.86, z - Math.sin(ry) * (gx + (k - 1) * 0.14) + (k % 2) * 0.1, 0.18, 0.18, 0.18, 0));
    }
    P.box(x, z, ry, 1.3, 0.75, { kind: 'stall' });
  }

  function parasol(B, x, z, col) {
    if (!sideClear(x, z, 0.9)) return;
    B.add(G.cyl6, 0xb0a894, M(x, 1.15, z, 0.09, 2.3, 0.09, 0));
    B.add(G.cyl, 0x6a6a70, M(x, 0.08, z, 0.7, 0.16, 0.7, 0));
    B.add(G.cone, col, M(x, 2.42, z, 3.2, 0.8, 3.2, 0));
    B.add(G.cone, sh(col, 1.15), M(x, 2.45, z, 2.2, 0.6, 2.2, 0.4));
    B.add(G.sph, sh(col, 0.8), M(x, 2.86, z, 0.16, 0.16, 0.16, 0));
    P.circle(x, z, 0.36, { kind: 'post' });
  }

  function rock(B, x, z, s, col) {
    if (!sideClear(x, z, 0.9)) return;
    B.add(G.sphLo, col, M(x, s * 0.35, z, s, s * 0.8, s * 0.9, Math.random() * 3));
    B.add(G.sphLo, sh(col, 0.85), M(x + s * 0.4, s * 0.25, z + s * 0.3, s * 0.6, s * 0.5, s * 0.6, 0));
    B.add(G.sphLo, sh(col, 1.1), M(x - s * 0.2, s * 0.5, z - s * 0.2, s * 0.4, s * 0.3, s * 0.4, 0));
    P.circle(x, z, 0.5 * s, { kind: 'rock' });
  }

  function bush(B, x, z, s, col) {
    if (!sideClear(x, z, 0.8)) return;
    B.add(G.sphLo, col, M(x, s * 0.4, z, s, s * 0.7, s, 0));
    B.add(G.sphLo, sh(col, 1.12), M(x + s * 0.3, s * 0.5, z - s * 0.2, s * 0.6, s * 0.5, s * 0.6, 0));
    B.add(G.sphLo, sh(col, 0.88), M(x - s * 0.3, s * 0.32, z + s * 0.25, s * 0.55, s * 0.45, s * 0.55, 0));
    P.circle(x, z, 0.5 * s, { soft: 2.2, kind: 'bush' });
  }

  // ---------- 제주 소품 (2026-09-24 사장님 "배경을 바이제주처럼") ----------
  // BUY JEJU 의 결: 현무암 돌담·감귤나무·야자수·억새·유채·돌하르방·풍차·바다·한라산·오름. 전부 코드 도형
  const BASALT = [0x3a3a3e, 0x46464b, 0x323236, 0x505056];
  const PYR = new THREE.ConeGeometry(0.5, 1, 4); PYR.rotateY(Math.PI / 4);           // 우진각 지붕
  const HALF = new THREE.SphereGeometry(0.5, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);  // 오름·동산
  const OCT = new THREE.OctahedronGeometry(0.5);   // 억새 이삭 (삼각형 8개 — 억새는 수천 개라 가볍게)
  let dSeed = 1;
  const rr = () => ((dSeed = (dSeed * 16807) % 2147483647) / 2147483647);
  let curGroup = null, curSpin = [], bladeMat = null;

  // 현무암 돌담: 덩이를 두세 줄로 엇갈려 쌓는다 (x,z = 가운데, ry = 담 방향)
  function doldam(B, x, z, ry, len, h) {
    const fx = Math.sin(ry), fz = Math.cos(ry);
    const rows = h > 1 ? 3 : 2, rh = h / rows;
    for (let row = 0; row < rows; row++) {
      let t = -len / 2 + (row % 2) * 0.35 * rr();
      while (t < len / 2 - 0.12) {
        const w = Math.min(0.55 + rr() * 0.55, len / 2 - t);
        const c = t + w / 2;
        const hh = rh * (0.9 + rr() * 0.35);
        B.add(G.box, BASALT[(rr() * 4) | 0], M(x + fx * c, rh * (row + 0.5), z + fz * c, 0.52 + rr() * 0.12, hh, w * 0.96, ry + (rr() - 0.5) * 0.12, (rr() - 0.5) * 0.1, (rr() - 0.5) * 0.12));
        t += w;
      }
    }
  }

  function tangerine(B, x, z, s) {
    if (!roadClear(x, z, 0, 0.9 * s, 0.9 * s)) return;
    B.add(G.cyl6, 0x5a4028, M(x, 0.45 * s, z, 0.24 * s, 0.9 * s, 0.24 * s, 0));
    B.add(G.sphLo, 0x33692b, M(x, 1.45 * s, z, 2.4 * s, 1.9 * s, 2.4 * s, rr() * 3));
    B.add(G.sphLo, 0x4a8238, M(x + 0.35 * s, 1.8 * s, z - 0.3 * s, 1.5 * s, 1.1 * s, 1.5 * s, 0));
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4 + rr(), e = (i % 3) * 0.3 - 0.25;
      B.add(G.sphLo, i % 2 ? 0xf28c1c : 0xf7a02a, M(x + Math.cos(a) * 1.14 * s, 1.45 * s + e * s, z + Math.sin(a) * 1.14 * s, 0.36 * s, 0.34 * s, 0.36 * s, 0));
    }
    P.circle(x, z, 0.5 * s, { kind: 'tree' });
  }

  // 삼나무 (방풍림·한라산 숲)
  function cedar(B, x, z, s) {
    if (!roadClear(x, z, 0, 0.6 * s, 0.6 * s)) return;
    B.add(G.cyl6, 0x5a3e2a, M(x, 1.2 * s, z, 0.32 * s, 2.4 * s, 0.32 * s, 0));
    B.add(G.cone, 0x23452a, M(x, 4.3 * s, z, 2.4 * s, 6.2 * s, 2.4 * s, rr()));
    B.add(G.cone, 0x2d5732, M(x, 6.8 * s, z, 1.6 * s, 4.2 * s, 1.6 * s, rr()));
    P.circle(x, z, 0.32 * s, { kind: 'tree' });
  }

  // 워싱턴야자 (제주 가로수)
  function palmJ(B, x, z, s) {
    if (!roadClear(x, z, 0, 0.5, 0.5)) return;
    s = s || 1;
    const h = 6.4 * s, lean = 0.07;
    for (let i = 0; i < 6; i++) B.add(G.cyl6, i % 2 ? 0x7a6448 : 0x8d7454, M(x + i * lean, (i + 0.5) * h / 6, z, 0.44 - i * 0.03, h / 6 + 0.06, 0.44 - i * 0.03, 0));
    const tx = x + 6 * lean;
    B.add(G.sphLo, 0x6a5234, M(tx, h, z, 0.8, 0.7, 0.8, 0));
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + rr() * 0.3, col = [0x3f8a3a, 0x4d9a44, 0x356f30][i % 3];
      B.add(G.box, col, M(tx + Math.cos(a) * 0.95, h + 0.35, z + Math.sin(a) * 0.95, 1.9, 0.07, 0.62, -a, 0, 0.28));
      B.add(G.box, sh(col, 0.9), M(tx + Math.cos(a) * 2.5, h - 0.05, z + Math.sin(a) * 2.5, 1.7, 0.07, 0.55, -a, 0, -0.55));
    }
    P.circle(x, z, 0.36, { kind: 'tree' });
  }

  // 유채꽃 밭 한 뙈기 (w = 옆 폭, d = 길이)
  function canola(B, x, z, w, d) {
    if (!roadClear(x, z, 0, w / 2, d / 2)) return;
    B.add(G.box, 0x5f8a34, M(x, 0.14, z, w, 0.28, d, 0));
    const n = Math.round(w * d / 2.4);
    for (let i = 0; i < n; i++) B.add(G.sphLo, [0xf4d63a, 0xf8e24c, 0xeec52a][i % 3], M(x + (rr() - 0.5) * w, 0.5 + rr() * 0.22, z + (rr() - 0.5) * d, 1.25, 0.46, 1.25, 0));
  }

  // 녹차밭 이랑
  function teaRows(B, x, z, w, d) {
    if (!roadClear(x, z, 0, w / 2, d / 2)) return;
    const n = Math.max(2, Math.floor(w / 1.9));
    for (let i = 0; i < n; i++) {
      const col = i % 2 ? 0x4a8a34 : 0x58993e, cx = x - w / 2 + (i + 0.5) * (w / n);
      B.add(G.box, col, M(cx, 0.4, z, 1.25, 0.8, d, 0));
      B.add(G.cyl, sh(col, 1.1), M(cx, 0.8, z, 1.25, d, 0.55, 0, Math.PI / 2));
    }
  }

  // 억새 한 무더기
  function silverGrass(B, x, z, s) {
    if (!sideClear(x, z, 0.6)) return;
    for (let i = 0; i < 7; i++) {
      const a = rr() * 6.28, l = 0.1 + rr() * 0.3, tilt = 0.2 + rr() * 0.25;
      const hx = x + Math.cos(a) * (l + 0.75 * s * tilt), hz = z + Math.sin(a) * (l + 0.75 * s * tilt);
      B.add(G.box, [0xb9a57a, 0xa8966a, 0xc4b288][i % 3], M(x + Math.cos(a) * l, 0.72 * s, z + Math.sin(a) * l, 0.05, 1.45 * s, 0.05, 0, Math.sin(a) * tilt, -Math.cos(a) * tilt));
      B.add(OCT, [0xf2ead8, 0xe6dac2, 0xd8c8a4][i % 3], M(hx, 1.5 * s, hz, 0.34, 0.85 * s, 0.34, a, Math.sin(a) * tilt, -Math.cos(a) * tilt));
    }
    P.circle(x, z, 0.5, { soft: 1.3, kind: 'reed' });
  }

  // 돌하르방 (ry = 얼굴 방향)
  function harubang(B, x, z, ry, s) {
    if (!sideClear(x, z, 0.8)) return;
    s = s || 1;
    const c = 0x4b4b50, fx = Math.sin(ry), fz = Math.cos(ry);
    B.add(G.box, sh(c, 0.85), M(x, 0.12 * s, z, 0.9 * s, 0.24 * s, 0.8 * s, ry));
    B.add(G.cyl, c, M(x, 0.75 * s, z, 0.72 * s, 1.1 * s, 0.62 * s, ry));
    B.add(G.sph, c, M(x, 1.55 * s, z, 0.66 * s, 0.76 * s, 0.6 * s, ry));
    B.add(G.cyl, sh(c, 0.9), M(x, 1.98 * s, z, 0.56 * s, 0.26 * s, 0.56 * s, ry));
    B.add(G.sph, sh(c, 0.9), M(x, 2.12 * s, z, 0.5 * s, 0.26 * s, 0.5 * s, ry));
    for (const k of [-1, 1]) {
      const sx = Math.cos(ry) * k, sz = -Math.sin(ry) * k;
      B.add(G.sphLo, sh(c, 1.15), M(x + sx * 0.14 * s + fx * 0.27 * s, 1.62 * s, z + sz * 0.14 * s + fz * 0.27 * s, 0.2 * s, 0.2 * s, 0.14 * s, ry));   // 왕방울 눈
      B.add(G.box, sh(c, 1.08), M(x + sx * 0.16 * s + fx * 0.3 * s, 0.95 * s + k * 0.12 * s, z + sz * 0.16 * s + fz * 0.3 * s, 0.42 * s, 0.14 * s, 0.12 * s, ry));   // 배 위의 두 손
    }
    B.add(G.sphLo, sh(c, 1.1), M(x + fx * 0.3 * s, 1.5 * s, z + fz * 0.3 * s, 0.2 * s, 0.26 * s, 0.14 * s, ry));   // 코
    P.circle(x, z, 0.42 * s, { kind: 'post' });
  }

  // 제주 시내 건물: 옛 골목 빌라 대신 낮은 회벽 건물 + 색 우진각 지붕 + 현무암 밑단 (밤이면 창에 불)
  function jejuBlock(B, E, x, z, w, h, d, night) {
    building(B, E, x, z, w, h, d, 0, night ? [0x3a3f52, 0x44495c, 0x4a4456][(rr() * 3) | 0] : [0xf2ece2, 0xe8e2d4, 0xefe6d6, 0xe4ddd0][(rr() * 4) | 0],
      night ? 0xffdf9a : 0x6f93aa, { front: x > 0 ? -1 : 1, night, simple: false, shop: rr() < 0.5 });
    if (!roadClear(x, z, 0, w / 2, d / 2)) return;
    B.add(PYR, [0x3f6fae, 0xd26a38, 0x4f8a5a, 0x8a4a3a][(rr() * 4) | 0], M(x, h + 1.0, z, w * 1.46, 2.0, d * 1.46, 0));
    B.add(G.box, BASALT[1], M(x, 0.35, z, w + 0.12, 0.7, d + 0.12, 0));
  }

  // 제주 집 (우진각 지붕 + 현무암 밑단). w = 도로 방향 길이
  function jejuHouse(B, x, z, ry) {
    const w = 7 + rr() * 3, d = 5 + rr() * 2;
    if (!roadClear(x, z, ry, d / 2 + 0.4, w / 2 + 0.4)) return;
    const wall = [0xefeae0, 0xe4ddd0, 0xd9d2c4, 0xf2ece2][(rr() * 4) | 0];
    const roof = [0x3f6fae, 0xd26a38, 0x4f8a5a, 0x8a4a3a, 0x5a6f8a][(rr() * 5) | 0];
    B.add(G.box, wall, M(x, 1.45, z, d, 2.9, w, ry));
    B.add(G.box, BASALT[1], M(x, 0.3, z, d + 0.1, 0.6, w + 0.1, ry));
    B.add(PYR, roof, M(x, 3.6, z, d * 1.48, 1.5, w * 1.48, ry));
    const fx = Math.cos(ry), fz = -Math.sin(ry);   // 도로 쪽 면 (옆 방향)
    for (const o of [-1, 1]) for (const k of [-w * 0.28, w * 0.28]) {
      const px = x + fx * o * (d / 2 + 0.03) + Math.sin(ry) * k, pz = z + fz * o * (d / 2 + 0.03) + Math.cos(ry) * k;
      B.add(G.box, 0x3f5566, M(px, 1.7, pz, 0.06, 0.9, 1.2, ry));
    }
    P.box(x, z, ry, d / 2, w / 2, { kind: 'wall' });
  }

  // 초가집 (돌벽 + 둥근 짚 지붕 + 새끼줄)
  function thatchHouse(B, x, z, ry) {
    if (!roadClear(x, z, ry, 3.2, 4.2)) return;
    B.add(G.box, BASALT[0], M(x, 1.0, z, 5.2, 2.0, 7.2, ry));
    B.add(G.sph, 0xb99b62, M(x, 2.1, z, 6.4, 2.6, 8.4, ry));
    for (let i = -2; i <= 2; i++) B.add(G.box, 0x8a7446, M(x + Math.sin(ry) * i * 1.4, 2.9, z + Math.cos(ry) * i * 1.4, 6.0, 0.06, 0.08, ry, 0, 0));
    B.add(G.box, 0x6a5a3a, M(x + Math.cos(ry) * 2.62, 0.9, z - Math.sin(ry) * 2.62, 0.08, 1.6, 1.0, ry));
    P.box(x, z, ry, 2.7, 3.7, { kind: 'wall' });
  }

  // 바닷가 카페 (하얀 상자 + 큰 유리창 + 나무 테라스)
  function cafe(B, E, x, z, ry, night) {
    if (!roadClear(x, z, ry, 4, 5.5)) return;
    const col = [0xf4f2ec, 0xe9e4da, 0xf0ebe4][(rr() * 3) | 0];
    B.add(G.box, col, M(x, 2.6, z, 7, 5.2, 10, ry));
    B.add(G.box, sh(col, 0.8), M(x, 5.3, z, 7.3, 0.3, 10.3, ry));
    const fx = Math.cos(ry), fz = -Math.sin(ry);
    for (const o of [-1, 1]) {
      (night ? E : B).add(G.box, night ? 0xffd9a0 : 0x3a5a6c, M(x + fx * o * 3.52, 2.0, z + fz * o * 3.52, 0.05, 2.6, 8.4, ry));
      B.add(G.box, 0x9a7048, M(x + fx * o * 4.6, 0.12, z + fz * o * 4.6, 2.0, 0.24, 9, ry));
    }
    P.box(x, z, ry, 3.5, 5, { kind: 'wall' });
  }

  // 검은 현무암 바위 무더기
  function blackRock(B, x, z, s) {
    if (!sideClear(x, z, 0.9)) return;
    for (let i = 0; i < 4; i++) {
      const a = rr() * 6.28, l = i ? 0.4 * s + rr() * 0.5 * s : 0, k = i ? 0.45 + rr() * 0.35 : 1;
      B.add(G.sphLo, BASALT[(rr() * 4) | 0], M(x + Math.cos(a) * l, s * 0.3 * k, z + Math.sin(a) * l, s * k, s * 0.75 * k, s * 0.9 * k, rr() * 3, rr() * 0.4));
    }
    P.circle(x, z, 0.55 * s, { kind: 'rock' });
  }

  // 등대 (하얀 몸 + 빨간 머리)
  function lighthouse(B, E, x, z) {
    if (!roadClear(x, z, 0, 1.4, 1.4)) return;
    B.add(G.cyl, 0xf2f2ee, M(x, 5, z, 2.4, 10, 2.4, 0));
    B.add(G.cyl, 0xd8412f, M(x, 10.6, z, 2.0, 1.2, 2.0, 0));
    E.add(G.cyl, 0xfff2b0, M(x, 11.6, z, 1.2, 0.9, 1.2, 0));
    B.add(G.cone, 0xd8412f, M(x, 12.5, z, 1.9, 1.0, 1.9, 0));
    P.circle(x, z, 1.2, { kind: 'wall' });
  }

  // 풍력 발전기 (세계 좌표). 날개는 따로 돌린다
  function windmill(x, y, z, h, face) {
    const bag = new Bag();
    bag.add(G.cyl, 0xeeeeec, M(x, y + h / 2, z, h * 0.05, h, h * 0.05, 0));
    bag.add(G.box, 0xe4e4e2, M(x, y + h, z, h * 0.06, h * 0.06, h * 0.14, face));
    const tower = bag.mesh(propMaterial());
    tower.castShadow = true;
    curGroup.add(tower);
    if (!bladeMat) bladeMat = new THREE.MeshLambertMaterial({ color: 0xf4f4f2 });
    const b = new Bag(), L = h * 0.46;
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI * 2 / 3;
      b.add(G.box, 0xf4f4f2, M(-Math.sin(a) * L / 2, Math.cos(a) * L / 2, 0, h * 0.035, L, h * 0.012, 0, 0, a));
    }
    b.add(G.sphLo, 0xe8e8e6, M(0, 0, 0, h * 0.05, h * 0.05, h * 0.06, 0));
    const hub = b.mesh(bladeMat);
    hub.position.set(x + Math.sin(face) * h * 0.08, y + h, z + Math.cos(face) * h * 0.08);
    hub.rotation.order = 'YXZ';
    hub.rotation.y = face;
    hub.userData.spd = 0.9 + rr() * 0.5;
    hub.rotation.z = rr() * 6;
    curGroup.add(hub);
    curSpin.push(hub);
    if (window.PHYS) PHYS.circle(x, z, h * 0.03, { kind: 'post' });
  }
  // 도로 좌표계 자리에 풍차 하나
  function windmillHere(x, z, h) {
    if (!roadClear(x, z, 0, 2, 2)) return;
    const w = toW(x, z);
    windmill(w.x, fr.oy, w.z, h, Math.atan2(-w.x, -w.z));
  }

  // ---------- 테마 12 (제주) ----------
  // road/shoulder: 바닥 색, sky: [천정, 지평선], fog: 안개(=지평선 아지랑이), sun: 해 색·세기·위치, bound: 경계 종류
  // sea: [얕은 바다, 깊은 바다] 가 있으면 섬(바다에 둘러싸인 땅), coast: 해변 종류, far: 지평선 풍경
  // 콜백 인자: x,z = 도로 가장자리, ry = 도로 방향, r = 난수, side = 좌/우, hw = 도로 반폭
  // 소품 거리: 인도(0~3.0)에는 부딪히는 낮은 것, 경계(3.4) 너머에 건물·나무
  const DAY = { sky: [0x3d77c9, 0xb9d0ea], fog: 0xcfdbe6 };
  const face = (side) => (side > 0 ? -Math.PI / 2 : Math.PI / 2);   // 도로 쪽을 보게
  const THEMES = {
    aewol: {   // 애월 해안도로 — 노을
      road: '#46484e', roadSpec: 26, shoulder: '#8c8878', line: 0xf2f2ea, bound: 'doldamLow',
      sky: [0x4a6fae, 0xf5b27a], fog: 0xf2cfae, ground: 0x6d8a48, sun: [0xffd6a4, 2.4, 140, 62, -70], amb: 0.82,
      sea: [0x2fa3a8, 0x0e4f73], coast: 'basalt', far: ['hallasan', 'oreum'],
      prop(B, E, put) {
        put(7, (x, z, ry, r, side) => {
          if (r < 0.24) palmJ(B, x + side * 2.3, z, 1);
          else if (r < 0.38) cafe(B, E, x + side * 9.5, z, 0, false);
          else if (r < 0.52) blackRock(B, x + side * 2.3, z, 0.8 + r);
          else if (r < 0.62) lamp(B, E, x + side * 2.2, z, face(side), false);
          else if (r < 0.72) harubang(B, x + side * 2.3, z, face(side), 1);
          else if (r < 0.82) bench(B, x + side * 2.4, z, 0);
          else silverGrass(B, x + side * (5 + r * 4), z, 1);
        });
      },
    },
    orchard: {   // 감귤밭 돌담길
      road: '#46484e', roadSpec: 26, shoulder: '#8d8467', line: 0xf2f2ea, bound: 'doldam',
      ...DAY, ground: 0x5b7f3a, sun: [0xfff2d8, 1.9, 60, 55, 30], amb: 0.55, far: ['hallasan', 'oreum'],
      prop(B, E, put) {
        put(6, (x, z, ry, r, side) => {
          if (r < 0.85) { tangerine(B, x + side * 5.6, z, 1.0 + r * 0.2); tangerine(B, x + side * 9.8, z + 1.5, 1.05); }
          if (r > 0.62) cedar(B, x + side * 14.5, z, 1.2);
          else if (r < 0.08) jejuHouse(B, x + side * 16, z, 0);
          if (r < 0.28) P.dyn('crate', x + side * 1.8, z, 0, 0xf09a3a);
          else if (r < 0.36) harubang(B, x + side * 2.3, z, face(side), 0.9);
          else if (r < 0.44) pole(B, x + side * 2.2, z, 7.6);
        });
      },
    },
    hyeopjae: {   // 협재 해변 — 에메랄드 바다, 흰 모래
      road: '#4c4c52', roadSpec: 24, shoulder: '#ddcfa6', line: 0xfaf6e8, bound: 'rope',
      sky: [0x3a86d8, 0xc6ddf0], fog: 0xd6e6ee, ground: 0xe2d3a6, sun: [0xfff4dc, 2.05, 80, 62, 40], amb: 0.6,
      sea: [0x46d8c8, 0x1277a8], coast: 'sand', far: ['biyangdo', 'hallasan'],
      prop(B, E, put) {
        put(6.5, (x, z, ry, r, side) => {
          if (r < 0.28) palmJ(B, x + side * (2.4 + r * 6), z, 0.9 + r);
          else if (r < 0.44) parasol(B, x + side * 2.3, z, [0xe8543a, 0x2f9fd8, 0xf5c93a, 0xffffff][(r * 4) | 0]);
          else if (r < 0.56) P.dyn('tube', x + side * 1.8, z, 0, [0xf2e63a, 0xe8543a, 0x3fb0e0][(r * 3) | 0]);
          else if (r < 0.7) blackRock(B, x + side * 2.4, z, 0.9);
          else if (r < 0.8) cafe(B, E, x + side * 10, z, 0, false);
          else P.dyn('ball', x + side * 1.6, z, 0, [0xf2f2ee, 0xe8543a, 0x2f9fd8][(r * 3) | 0]);
        });
      },
    },
    jejucity: {   // 제주 시내
      road: '#44464c', roadSpec: 24, shoulder: '#a39d92', line: 0xf2f2ea, bound: 'doldamLow',
      ...DAY, ground: 0x6f7a5a, sun: [0xfff3dd, 1.85, -60, 52, 40], amb: 0.55, far: ['hallasan'],
      prop(B, E, put) {
        put(6.5, (x, z, ry, r, side) => {
          if (r < 0.34) { const w = 9 + r * 12; jejuBlock(B, E, x + side * (4.8 + w / 2), z, w, 6 + r * 14, 10, false); }
 else if (r < 0.46) palmJ(B, x + side * 2.2, z, 1);
          else if (r < 0.56) harubang(B, x + side * 2.3, z, face(side), 1);
          else if (r < 0.64) lamp(B, E, x + side * 2.2, z, face(side), false);
          else if (r < 0.74) car(B, E, x + side * 1.7, z, 0, [0x2e3b52, 0xb8bfc6, 0x8e2f2f, 0xd8d2c4, 0xf2f2ee][(r * 5) | 0], false);
          else if (r < 0.84) stall(B, x + side * 1.85, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0xf28c1c);
          else jejuHouse(B, x + side * 10, z, 0);
        });
      },
    },
    tea: {   // 녹차밭
      road: '#46484e', roadSpec: 26, shoulder: '#9a8f70', line: 0xf2f2ea, bound: 'hedge',
      sky: [0x4a86cc, 0xc4d8e8], fog: 0xd2dfe4, ground: 0x6a8f40, sun: [0xfff4e0, 1.85, 70, 58, 25], amb: 0.57, far: ['hallasan', 'oreum'],
      prop(B, E, put) {
        put(8, (x, z, ry, r, side) => {
          if (r < 0.75) teaRows(B, x + side * 8.5, z, 8, 7.4);
          if (r > 0.55) cedar(B, x + side * 15.5, z, 1.3);
          if (r < 0.06) building(B, E, x + side * 20, z, 16, 7, 12, 0, 0xe8e4dc, 0x6a8ea0, { front: -side, simple: true });
          else if (r < 0.2) bench(B, x + side * 2.4, z, 0);
          else if (r < 0.32) lamp(B, E, x + side * 2.2, z, face(side), false);
          else if (r < 0.4) harubang(B, x + side * 2.3, z, face(side), 0.9);
        });
      },
    },
    canola: {   // 유채꽃 들판
      road: '#46484e', roadSpec: 26, shoulder: '#9a9070', line: 0xf2f2ea, bound: 'doldamLow',
      sky: [0x3f86d8, 0xc6dcef], fog: 0xd8e4ea, ground: 0x7a9a40, sun: [0xfff6e0, 1.95, 80, 60, -30], amb: 0.58, far: ['hallasan', 'oreum'],
      prop(B, E, put) {
        put(6, (x, z, ry, r, side) => {
          if (r < 0.88) canola(B, x + side * 7.5, z, 7, 6);
          if (r < 0.62) canola(B, x + side * 15, z, 7, 6);
          else if (r > 0.93) thatchHouse(B, x + side * 16, z, 0);
          if (r < 0.3) canola(B, x + side * 1.6, z, 1.4, 5.2);
          else if (r < 0.38) harubang(B, x + side * 2.3, z, face(side), 0.9);
          else if (r < 0.44) pole(B, x + side * 2.2, z, 7.6);
        });
      },
    },
    sangumburi: {   // 산굼부리 억새밭 — 금빛 오후
      road: '#4a4a4e', roadSpec: 26, shoulder: '#a8986c', line: 0xf2eee0, bound: 'wood',
      sky: [0x4a7ec4, 0xe8d6b4], fog: 0xe2d6bf, ground: 0xa89a68, sun: [0xffdcaa, 1.9, -100, 34, 60], amb: 0.55, far: ['oreumNear', 'hallasan'],
      prop(B, E, put) {
        put(3.4, (x, z, ry, r, side) => {
          silverGrass(B, x + side * (4.6 + r * 2), z, 1.1);
          silverGrass(B, x + side * (7.5 + r * 3), z + 1.2, 1.2);
          if (r < 0.8) silverGrass(B, x + side * (11 + r * 5), z - 0.8, 1.25);
          if (r < 0.5) silverGrass(B, x + side * (16 + r * 8), z + 0.5, 1.3);
          if (r < 0.3) silverGrass(B, x + side * 1.6, z, 0.8);
          else if (r < 0.36) bench(B, x + side * 2.4, z, 0);
        });
      },
    },
    windcoast: {   // 풍차 해안
      road: '#46484e', roadSpec: 26, shoulder: '#8a8878', line: 0xf2f2ea, bound: 'guard',
      ...DAY, ground: 0x6a8a48, sun: [0xfff3dd, 1.9, 60, 54, -35], amb: 0.56,
      sea: [0x2f9fb0, 0x0c4a70], coast: 'basalt', far: ['windmills', 'hallasan'],
      prop(B, E, put) {
        put(8, (x, z, ry, r, side) => {
          if (r < 0.1) windmillHere(x + side * (22 + r * 60), z, 34);
          else if (r < 0.34) blackRock(B, x + side * 2.4, z, 0.9 + r);
          else if (r < 0.54) silverGrass(B, x + side * (5 + r * 3), z, 1);
          else if (r < 0.64) lamp(B, E, x + side * 2.2, z, face(side), false);
          else if (r < 0.72) harubang(B, x + side * 2.3, z, face(side), 1);
          else if (r < 0.82) jejuHouse(B, x + side * 11, z, 0);
          else palmJ(B, x + side * 2.3, z, 0.9);
        });
      },
    },
    yongduam: {   // 용두암 바윗가
      road: '#44464c', roadSpec: 26, shoulder: '#77736a', line: 0xf2f2ea, bound: 'doldam',
      ...DAY, ground: 0x5f7a45, sun: [0xfff3dd, 1.85, -70, 50, -40], amb: 0.55,
      sea: [0x2f9aa8, 0x0b4468], coast: 'basalt', far: ['dragon', 'hallasan'],
      prop(B, E, put) {
        put(6.5, (x, z, ry, r, side) => {
          if (r < 0.3) blackRock(B, x + side * 2.4, z, 1.0 + r);
          if (r < 0.45) blackRock(B, x + side * (6 + r * 8), z, 1.6 + r * 2);
          if (r > 0.97) lighthouse(B, E, x + side * 12, z);
          else if (r > 0.8) palmJ(B, x + side * 2.3, z, 1);
          else if (r > 0.7) harubang(B, x + side * 2.3, z, face(side), 1.1);
          else if (r > 0.6) lamp(B, E, x + side * 2.2, z, face(side), false);
        });
      },
    },
    seongsan: {   // 성산일출봉 — 해 뜰 녘 (일출봉이 해 쪽에 선다)
      road: '#46484e', roadSpec: 26, shoulder: '#8f8a76', line: 0xf2f2ea, bound: 'doldamLow',
      sky: [0x4f6fb2, 0xf7c3a0], fog: 0xf0d2bd, ground: 0x6c8c46, sun: [0xffd8aa, 2.2, -130, 40, 80], amb: 0.8,
      sea: [0x3a9fb4, 0x10507a], coast: 'basalt', far: ['seongsan', 'oreum'],
      prop(B, E, put) {
        put(6.5, (x, z, ry, r, side) => {
          if (r < 0.3) canola(B, x + side * 7.5, z, 6.5, 5.5);
          else if (r < 0.42) jejuHouse(B, x + side * 11, z, 0);
          else if (r < 0.48) thatchHouse(B, x + side * 12, z, 0);
          if (r > 0.6 && r < 0.72) palmJ(B, x + side * 2.3, z, 1);
          else if (r > 0.72 && r < 0.8) harubang(B, x + side * 2.3, z, face(side), 1);
          else if (r > 0.8 && r < 0.9) blackRock(B, x + side * 2.4, z, 1.0);
          else if (r > 0.9) lamp(B, E, x + side * 2.2, z, face(side), false);
        });
      },
    },
    hallasan: {   // 한라산 숲길 — 안개 낀 삼나무 숲
      road: '#48484a', roadSpec: 24, shoulder: '#6f6a58', line: 0xeeeee4, bound: 'log', fogNear: 30, fogFar: 330,
      sky: [0x7f9fb8, 0xc9d5d8], fog: 0xbfcdcf, ground: 0x3f5f32, sun: [0xf2f4ea, 1.5, 40, 70, 30], amb: 0.62, far: [],
      prop(B, E, put) {
        put(4, (x, z, ry, r, side) => {
          cedar(B, x + side * (5 + r * 2.5), z, 1.25 + r * 0.4);
          if (r < 0.75) cedar(B, x + side * (10 + r * 4), z + 1.8, 1.4);
          if (r < 0.5) cedar(B, x + side * (16 + r * 6), z - 1.2, 1.5);
          if (r < 0.2) rock(B, x + side * 2.4, z, 0.9, 0x6f7a62);
          else if (r < 0.34) bush(B, x + side * 2.1, z, 1.0, 0x3f6f35);
        });
      },
    },
    tapdong: {   // 밤의 탑동 — 바닷가 밤거리
      road: '#3e4048', roadSpec: 22, shoulder: '#4a4b54', line: 0xf5f5ea, night: true, bound: 'guard', fogNear: 60, fogFar: 900,
      sky: [0x0b1230, 0x2a2a52], fog: 0x1a1d38, ground: 0x2a2e3a, sun: [0xa8bce8, 1.05, 60, 43, -40], amb: 0.72,
      sea: [0x12384e, 0x050d1c], coast: 'basalt', far: ['city'],
      prop(B, E, put) {
        put(7, (x, z, ry, r, side) => {
          if (r < 0.34) { const w = 11 + r * 10; jejuBlock(B, E, x + side * (5.0 + w / 2), z, w, 8 + r * 16, 12, true); }
          else if (r < 0.46) palmJ(B, x + side * 2.3, z, 1);
          else if (r < 0.56) E.add(G.box, [0xff3d8a, 0x3df0ff, 0xffe23d, 0x7dff5a][(r * 40) % 4 | 0], M(x + side * 5.6, 4.5 + r * 6, z, 0.3, 2.6, 3.4, 0));
          else if (r < 0.7) lamp(B, E, x + side * 2.2, z, face(side), true);
          else if (r < 0.8) car(B, E, x + side * 1.7, z, 0, [0xf2d33a, 0x1e2430, 0xb0b6be][(r * 3) | 0], true);
          else if (r < 0.9) harubang(B, x + side * 2.3, z, face(side), 1);
          else P.dyn('cone', x + side * 1.5, z, 0);
        });
      },
    },
  };

  // ---------- 지평선 풍경 (한라산·오름·비양도·일출봉·풍차·용두암·도시) ----------
  function horizonFeatures(group, th, T, Ri, y0) {
    const far = th.far || [];
    const bag = new Bag();
    const sunAng = Math.atan2(th.sun[4], th.sun[2]);
    if (far.indexOf('hallasan') >= 0) {
      // 한라산: 완만한 방패 모양. 높이에 따라 초록 → 숲 → 바위
      const ang = sunAng + Math.PI * 0.8, dist = Ri + 1150;
      const geo = new THREE.SphereGeometry(1, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2);
      const pos = geo.attributes.position, col = [];
      const cA = new THREE.Color(0x5c8048), cB = new THREE.Color(0x3d6240), cC = new THREE.Color(0x8a8270), cc = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const h = pos.getY(i);
        pos.setY(i, Math.pow(h, 1.6));   // 봉우리를 뾰족하게, 기슭은 길게
        if (h < 0.55) cc.copy(cA).lerp(cB, h / 0.55); else cc.copy(cB).lerp(cC, (h - 0.55) / 0.45);
        col.push(cc.r, cc.g, cc.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
      m.scale.set(760, 250, 520);
      m.position.set(Math.cos(ang) * dist, y0 - 6, Math.sin(ang) * dist);
      m.rotation.y = -ang;
      group.add(m);
      bag.add(G.cyl, 0x6a6458, M(m.position.x, y0 + 240, m.position.z, 80, 16, 62, -ang));   // 백록담 둘레
    }
    if (far.indexOf('oreum') >= 0 || far.indexOf('oreumNear') >= 0) {
      const near = far.indexOf('oreumNear') >= 0;
      const n = near ? 18 : 12;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + rr() * 0.4, d = Ri + (near ? 60 : 180) + rr() * (near ? 220 : 380);
        const rad = 45 + rr() * 70, h = 22 + rr() * 38;
        const col = [0x5d8a45, 0x6a9450, 0x55803e, 0x8a8a52][(rr() * (near ? 4 : 3)) | 0];
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        bag.add(HALF, col, M(x, y0 - 2, z, rad * 2, h * 2, rad * 1.7, a));
        if (rr() < 0.6) bag.add(G.sph, sh(col, 0.82), M(x, y0 + h * 0.93, z, rad * 0.9, h * 0.14, rad * 0.8, a));   // 분화구
      }
    }
    if (far.indexOf('biyangdo') >= 0) {   // 협재 앞바다의 작은 섬
      const a = sunAng + 0.5, d = Ri + 240;
      bag.add(HALF, 0x5d8a45, M(Math.cos(a) * d, y0 - 1.5, Math.sin(a) * d, 180, 70, 140, a));
      bag.add(G.cyl, 0x3a3a3e, M(Math.cos(a) * d, y0 - 1.2, Math.sin(a) * d, 190, 2.4, 150, a));
    }
    if (far.indexOf('seongsan') >= 0) {   // 일출봉: 바다에 선 거대한 분화구, 해 쪽
      const a = sunAng, d = Ri + 360, x = Math.cos(a) * d, z = Math.sin(a) * d;
      bag.add(G.cyl, 0x7a6a52, M(x, y0 + 45, z, 330, 100, 290, a));                 // 벼랑
      bag.add(G.cone, 0x6a5c48, M(x, y0 - 2, z, 400, 12, 360, a));                  // 밑동
      bag.add(G.cyl, 0x5a8040, M(x, y0 + 96, z, 320, 3, 280, a));                   // 꼭대기 풀
      for (let i = 0; i < 16; i++) {                                                // 둘레 봉우리
        const t = i / 16 * Math.PI * 2;
        bag.add(G.cone, [0x7a6a52, 0x6e604a][i % 2], M(x + Math.cos(t) * 150, y0 + 104, z + Math.sin(t) * 130, 42, 20 + (i % 3) * 8, 42, t));
      }
      bag.add(HALF, 0x5d8a45, M(x - Math.cos(a) * 200, y0 - 2, z - Math.sin(a) * 200, 260, 40, 200, a));   // 앞 들판 언덕
    }
    if (far.indexOf('dragon') >= 0) {   // 용두암: 바닷가에서 하늘로 머리를 든 검은 바위
      const a = sunAng + 2.2, d = Ri + 6, x = Math.cos(a) * d, z = Math.sin(a) * d;
      for (let i = 0; i < 7; i++) bag.add(G.cone, BASALT[i % 4], M(x + i * 1.6 * Math.cos(a + 1.2), y0 + 3 + i * 1.1, z + i * 1.6 * Math.sin(a + 1.2), 3.4 - i * 0.2, 7 + i, 3.0 - i * 0.2, a, 0.3 + i * 0.05));
      bag.add(G.sphLo, BASALT[2], M(x + 12 * Math.cos(a + 1.2), y0 + 11, z + 12 * Math.sin(a + 1.2), 5, 3.4, 3.4, a, 0.4));
    }
    if (far.indexOf('windmills') >= 0) {
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2 + 0.3, d = Ri + 18 + (i % 2) * 40;
        windmill(Math.cos(a) * d, y0 - 0.5, Math.sin(a) * d, 40 + (i % 3) * 6, a + Math.PI);
      }
    }
    if (far.indexOf('city') >= 0) {   // 밤바다 건너 불빛 (제주항·신제주)
      const E = new Bag();
      for (let i = 0; i < 70; i++) {
        const a = sunAng + Math.PI + (i / 70 - 0.5) * 2.4, d = Ri + 180 + rr() * 260;
        const w = 12 + rr() * 22, h = 12 + rr() * 60, x = Math.cos(a) * d, z = Math.sin(a) * d;
        bag.add(G.box, 0x1c2130, M(x, y0 + h / 2, z, w, h, w, a));
        for (let k = 0; k < 4; k++) E.add(G.box, [0xffd98a, 0xfff0c0, 0x9ad8ff][k % 3], M(x - Math.cos(a) * (w / 2 + 0.2), y0 + h * (0.2 + rr() * 0.7), z - Math.sin(a) * (w / 2 + 0.2), 1.2, 0.9, w * 0.6, a));
      }
      const e = E.mesh(new THREE.MeshBasicMaterial({ vertexColors: true }));
      if (e) group.add(e);
    }
    const m = bag.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }));
    if (m) group.add(m);
  }

  // 바다: 해안에서 멀어질수록 깊은 색 + 물결 반짝임 + 해안 거품. 안개를 먹는다
  function seaMesh(th, Ri, y) {
    const sun = new THREE.Vector3(th.sun[2], th.sun[3], th.sun[4]).normalize();
    const mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uT: { value: 0 }, uR: { value: Ri }, uShal: { value: new THREE.Color(th.sea[0]) }, uDeep: { value: new THREE.Color(th.sea[1]) },
        uSky: { value: new THREE.Color(th.sky[1]) }, uSun: { value: sun }, uSunC: { value: new THREE.Color(th.sun[0]) },
      }]),
      vertexShader: 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: [
        'uniform float uT; uniform float uR; uniform vec3 uShal; uniform vec3 uDeep; uniform vec3 uSky; uniform vec3 uSun; uniform vec3 uSunC;',
        'varying vec3 vW;',
        '#include <fog_pars_fragment>',
        'float wv(vec2 p){ return sin(p.x*0.31+uT*1.3)*0.5+sin(p.y*0.23-uT*1.1)*0.5+sin((p.x+p.y)*0.57+uT*2.1)*0.25+sin((p.x-p.y)*1.3-uT*2.7)*0.12; }',
        'void main(){',
        '  float d = length(vW.xz) - uR;',
        '  vec3 col = mix(uShal, uDeep, smoothstep(0.0, 160.0, d));',
        '  vec2 e = vec2(0.5, 0.0);',
        '  float h0 = wv(vW.xz);',
        '  vec3 n = normalize(vec3((h0 - wv(vW.xz + e.xy)) * 0.9, 1.0, (h0 - wv(vW.xz + e.yx)) * 0.9));',
        '  vec3 V = normalize(cameraPosition - vW);',
        '  float fr = pow(1.0 - max(dot(n, V), 0.0), 4.0);',
        '  col = mix(col, uSky, clamp(fr * 0.75, 0.0, 0.75));',
        '  vec3 R = reflect(-V, n);',
        '  col += uSunC * (pow(max(dot(R, uSun), 0.0), 220.0) * 2.2 + pow(max(dot(R, uSun), 0.0), 18.0) * 0.08);',
        '  float foam = smoothstep(5.0, 0.0, d + sin(vW.x * 0.21 + uT * 1.6) * 1.4 + sin(vW.z * 0.17 - uT) * 1.2);',
        '  col = mix(col, vec3(0.93, 0.95, 0.95), foam * 0.75);',
        '  gl_FragColor = vec4(col, 1.0);',
        '  #include <colorspace_fragment>',
        '  #include <fog_fragment>',
        '}',
      ].join('\n'),
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    return m;
  }

  // 하늘 소품: 뭉게구름, 밤은 별
  function skyProps(group, th) {
    if (th.night) {
      const g = new THREE.BufferGeometry(), pos = [];
      for (let i = 0; i < 420; i++) {
        const a = Math.random() * Math.PI * 2, e = 0.1 + Math.random() * 0.85, r = 1500;
        pos.push(Math.cos(a) * r * Math.cos(e), r * Math.sin(e), Math.sin(a) * r * Math.cos(e));
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      group.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6e0, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
      return;
    }
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const c = cv.getContext('2d');
    for (let i = 0; i < 18; i++) {
      const x = 30 + Math.random() * 196, y = 50 + Math.random() * 44, r = 18 + Math.random() * 30;
      const gr = c.createRadialGradient(x, y - r * 0.2, r * 0.15, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.97)');
      gr.addColorStop(0.55, 'rgba(246,248,252,.7)');
      gr.addColorStop(1, 'rgba(236,240,248,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fill();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const tint = new THREE.Color(0xffffff).lerp(new THREE.Color(th.sky[1]), 0.35);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: tint, transparent: true, depthWrite: false, fog: false, opacity: 0.92 });
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + Math.random(), r = 420 + Math.random() * 520;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(220 + Math.random() * 200, 90 + Math.random() * 60), mat);
      m.position.set(Math.cos(a) * r, 150 + Math.random() * 130, Math.sin(a) * r);
      m.lookAt(0, m.position.y, 0);
      group.add(m);
    }
  }

  // ---------- 코스 하나의 배경 만들기 ----------
  function build(scene, T, quality) {
    const th = THEMES[T.c.theme];
    const group = new THREE.Group();
    const rnd = TRACK.rng(T.c.seed * 7 + 5);
    if (window.PHYS) PHYS.reset(T);
    curT = T;
    dSeed = T.c.seed * 131 + 7;
    curGroup = group;
    curSpin = [];
    noFrame();

    // 땅. 바다가 있는 테마는 섬(코스 바깥 60m 에서 해안, 그 너머 바다)
    let Ri = 0;
    T.S.forEach((q) => { Ri = Math.max(Ri, Math.hypot(q.p.x, q.p.z)); });
    Ri += 60;
    const gTex = TRACK.noiseTex(new THREE.Color(th.ground).getStyle(), 22, false);
    let sea = null;
    let ground;
    if (th.sea) {
      gTex.repeat.set(Ri / 4.6, Ri / 4.6);
      ground = new THREE.Mesh(new THREE.CircleGeometry(Ri, 128), new THREE.MeshLambertMaterial({ map: gTex }));
      const coastCol = th.coast === 'sand' ? 0xe6d8b0 : 0x3a3a3e;
      const ring = new THREE.Mesh(new THREE.RingGeometry(Ri - 16, Ri + 6, 128, 1), new THREE.MeshLambertMaterial({ color: coastCol }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = T.groundY - 0.2;
      ring.receiveShadow = true;
      group.add(ring);
      if (th.coast !== 'sand') {   // 검은 현무암 갯바위
        const rb = new Bag();
        for (let i = 0; i < 110; i++) {
          const a = i / 110 * Math.PI * 2 + rr() * 0.05, d = Ri + (rr() - 0.3) * 9, k = 0.8 + rr() * 2.2;
          rb.add(G.sphLo, BASALT[(rr() * 4) | 0], M(Math.cos(a) * d, T.groundY - 0.4 + k * 0.2, Math.sin(a) * d, k * 1.6, k * 0.8, k * 1.3, rr() * 3));
        }
        group.add(rb.mesh(propMaterial()));
      }
      sea = seaMesh(th, Ri, T.groundY - 0.45);
      group.add(sea);
    } else {
      gTex.repeat.set(540, 540);
      ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ map: gTex }));
    }
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = T.groundY;
    ground.receiveShadow = true;
    group.add(ground);
    skyProps(group, th);
    horizonFeatures(group, th, T, Ri, T.groundY);

    // 구역별로 소품을 나눠 담는다 (화면 밖은 안 그리게)
    const ZONES = 10;
    const bags = [], ebags = [];
    for (let i = 0; i < ZONES; i++) { bags.push(new Bag()); ebags.push(new Bag()); }
    const zoneOf = (s) => Math.min(ZONES - 1, Math.floor(s / T.total * ZONES));
    const proxyB = { add: null }, proxyE = { add: null };
    const bind = (s) => {
      const zi = zoneOf(s), a = TRACK.at(T, s);
      proxyB.add = (g, c, m) => { m.premultiply(FRAME); bags[zi].add(g, c, m); };
      proxyE.add = (g, c, m) => { m.premultiply(FRAME); ebags[zi].add(g, c, m); };
      return a;
    };

    // 경계 (양쪽, 코스 전체) — 이 점에서 다음 점까지 잇는다. 코너 바깥은 호가 길어 일직선 조각으론 틈이 생겼다
    const GAP = 6.5;
    const nSeg = Math.ceil(T.total / GAP);
    noFrame();
    for (let i = 0; i < nSeg; i++) {
      const s0 = i * GAP, s1 = Math.min(T.total, (i + 1) * GAP);
      const a = bind(s0), b = TRACK.at(T, s1 >= T.total ? 0 : s1);
      for (const side of [-1, 1]) {
        const x0 = a.p.x + a.side.x * side * (a.hw + 3.4), z0 = a.p.z + a.side.z * side * (a.hw + 3.4);
        const x1 = b.p.x + b.side.x * side * (b.hw + 3.4), z1 = b.p.z + b.side.z * side * (b.hw + 3.4);
        const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) + 0.5;
        const ry = Math.atan2(dx, dz);
        FRAME.identity().setPosition(0, (a.p.y + b.p.y) / 2, 0); // 담장은 세계 좌표 + 도로 높이만
        boundary(proxyB, proxyE, th.bound, (x0 + x1) / 2, (z0 + z1) / 2, ry, len, rnd(), side);
        FRAME.identity();
      }
    }
    // 테마 소품
    // 테마 콜백: 도로 좌표계에서 (x = 가장자리, z = 0, ry = 0) 로 부른다
    const putWrap = (gap, fn) => {
      for (let s = 0; s < T.total; s += gap) {
        const a = bind(s);
        frameAt(a);
        for (const side of [-1, 1]) {
          if (rnd() < 0.2) continue;
          fn(side * (a.hw + 0.2), 0, 0, rnd(), side, a.hw + 0.2);
        }
      }
    };
    th.prop(proxyB, proxyE, putWrap);
    noFrame();

    const matSolid = propMaterial();
    const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
    for (let i = 0; i < ZONES; i++) {
      const m = bags[i].mesh(matSolid);
      if (m) { m.castShadow = quality > 0; m.receiveShadow = quality > 0; group.add(m); }
      const e = ebags[i].mesh(matGlow);
      if (e) group.add(e);
    }
    if (window.PHYS) PHYS.build(scene, matSolid);

    scene.add(group);
    const spin = curSpin;
    // 매 프레임: 파도·풍차 날개
    const update = (t) => {
      if (sea) sea.material.uniforms.uT.value = t;
      for (let i = 0; i < spin.length; i++) spin[i].rotation.z = -t * spin[i].userData.spd;
    };
    return { group, theme: th, update };
  }

  window.SCENERY = { build, THEMES, Bag, G, M, sh, propMaterial };
})();
