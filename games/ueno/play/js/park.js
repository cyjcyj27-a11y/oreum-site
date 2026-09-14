// park.js — 우에노 공원을 코드로 짓는다 (땅·길·연못·벚꽃·명소) + 부딪힘
(function () {
  const X0 = -120, X1 = 80, Z0 = -120, Z1 = 120;      // 공원 경계
  const POND = { x: -66, z: 44, rx: 30, rz: 40 };
  const ISLAND = { x: -64, z: 44, r: 9 };
  const CAUSE = { z: 44, x0: -57, x1: -33, hw: 2.6 };  // 둑길
  const FOUNT = { x: 25, z: -44, r: 7.5 };

  const PATHS = [
    { w: 12, p: [[30, 118], [29, 84], [21, 52], [18, 20], [20, -12], [25, -30]] },
    { w: 8, p: [[18, 40], [-34, 44]] },
    { w: 7, p: [[19, -2], [-26, -6], [-66, -10]] },
    { w: 8, p: [[-26, -6], [-21, -60]] },
    { w: 8, p: [[25, -34], [-20, -54]] },
    { w: 14, p: [[25, -44], [25, -86]] },
    { w: 6, p: [[29, 84], [58, 70], [60, 20]] },
  ];
  const PLAZAS = [[30, 92, 11], [25, -44, 23], [-43, -8, 13], [-21, -52, 13], [-21, 44, 13], [19, 36, 12],
    [-8, 16, 7.5], [-40, -31, 7.5]];   // 퍼즐 마당: 석등 · 판다 동상 (puzzle.js)

  const C = { circles: [], boxes: [], vend: [], lanterns: [], stalls: [] };
  const P = { C, POND, FOUNT, X0, X1, Z0, Z1, start: { x: 31, z: 100, yaw: Math.PI }, water: null, jets: null, petals: null };

  // ── 부딪힘 ──
  function addCircle(x, z, r) { C.circles.push({ x, z, r }); }
  function addBox(x, z, hw, hd, rot) { C.boxes.push({ x, z, hw, hd, rot: rot || 0, c: Math.cos(rot || 0), s: Math.sin(rot || 0) }); }
  function inWater(x, z, r) {
    const dx = (x - POND.x) / (POND.rx - r * 0.3), dz = (z - POND.z) / (POND.rz - r * 0.3);
    if (dx * dx + dz * dz > 1) return false;
    if (Math.abs(z - CAUSE.z) < CAUSE.hw - r * 0.5 && x > CAUSE.x0 - 1 && x < CAUSE.x1 + 2) return false;
    if (Math.hypot(x - ISLAND.x, z - ISLAND.z) < ISLAND.r - r) return false;
    return true;
  }
  // 분수 광장 노란 띠 줄에 얼마나 박혀 있나 (0 이면 안 닿음)
  function tapeIn(x, z, r) {
    if (!P.tape) return 0;
    return Math.max(0, r + 0.25 - Math.abs(Math.hypot(x - P.tape.x, z - P.tape.z) - P.tape.r));
  }
  function blocked(x, z, r, noTape) {
    if (x < X0 + 4 || x > X1 - 4 || z < Z0 + 4 || z > Z1 - 2) return true;
    if (inWater(x, z, r)) return true;
    if (!noTape && tapeIn(x, z, r) > 0) return true;
    return false;
  }
  // 발 딛는 높이: 둑길 돌판·벤텐도 섬은 0.3m 솟아 있다 (끝은 비탈로). 없으면 강아지·사람 발이 파묻혔다(9/14)
  function groundY(x, z) {
    let h = 0;
    const cz = CAUSE.hw - Math.abs(z - CAUSE.z);
    if (cz > 0) { const cx = Math.min(x - (CAUSE.x0 - 1), (CAUSE.x1 + 1) - x); if (cx > 0) h = 0.3 * Math.min(1, cx / 1.2, cz / 0.3); }
    const di = ISLAND.r + 0.6 - Math.hypot(x - ISLAND.x, z - ISLAND.z);
    if (di > 0) h = Math.max(h, 0.3 * Math.min(1, di / 0.6));
    return h;
  }
  // 동그라미·상자에서 밀어낸다
  function pushOut(p, r) {
    for (const c of C.circles) {
      const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + r;
      if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
      const d = Math.hypot(dx, dz);
      if (d < rr && d > 1e-5) { p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; }
    }
    for (const b of C.boxes) {
      const dx = p.x - b.x, dz = p.z - b.z;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      const ex = b.hw + r, ez = b.hd + r;
      if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) continue;
      let nx = lx, nz = lz;
      if (ex - Math.abs(lx) < ez - Math.abs(lz)) nx = Math.sign(lx || 1) * ex; else nz = Math.sign(lz || 1) * ez;
      p.x = b.x + nx * b.c + nz * b.s; p.z = b.z - nx * b.s + nz * b.c;
    }
  }
  // 물·공원 밖에 들어가 버렸으면(밀쳐지기·구역 경계 등) 가장 가까운 뭍으로 끌어낸다
  function rescue(p, r, dt) {
    r = r || 0.4;
    if (inWater(p.x, p.z, r)) {
      // 섬이 가까우면 섬으로, 둑길 줄에 있으면 둑길로, 아니면 연못 가장자리 바깥으로
      const di = Math.hypot(p.x - ISLAND.x, p.z - ISLAND.z);
      let tx, tz;
      if (di < ISLAND.r + 4) { const k = (ISLAND.r - r - 0.3) / (di || 1); tx = ISLAND.x + (p.x - ISLAND.x) * k; tz = ISLAND.z + (p.z - ISLAND.z) * k; }
      else if (p.x > CAUSE.x0 - 1 && p.x < CAUSE.x1 + 2 && Math.abs(p.z - CAUSE.z) < CAUSE.hw + 5) { tx = p.x; tz = CAUSE.z; }
      else {
        const ex = (p.x - POND.x) / POND.rx, ez = (p.z - POND.z) / POND.rz, k = Math.hypot(ex, ez) || 0.01;
        tx = POND.x + (p.x - POND.x) / k * 1.04 + Math.sign(p.x - POND.x) * r; tz = POND.z + (p.z - POND.z) / k * 1.04 + Math.sign(p.z - POND.z) * r;
      }
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      const step = Math.min(d, (dt || 0.016) * 9 + 0.02);
      if (d > 1e-4) { p.x += dx / d * step; p.z += dz / d * step; }
      return true;
    }
    p.x = U.clamp(p.x, X0 + 4.2, X1 - 4.2); p.z = U.clamp(p.z, Z0 + 4.2, Z1 - 2.2);
    // 띠 줄 속에 박혔으면(가로등에 밀리기·짝끼리 비키기·맞아 밀리기) 가까운 쪽으로 빼낸다 — 9/14 "갇혔어"
    const k = tapeIn(p.x, p.z, r);
    if (k > 0) {
      const dx = p.x - P.tape.x, dz = p.z - P.tape.z, d = Math.hypot(dx, dz) || 1, side = d >= P.tape.r ? 1 : -1;
      const step = Math.min(k + 0.02, (dt || 0.016) * 6 + 0.02) * side;
      p.x += dx / d * step; p.z += dz / d * step;
    }
    return false;
  }

  // 움직이기: 막히면 한 축씩 미끄러진다
  function move(p, dx, dz, r) {
    const ox = p.x, oz = p.z, stuck = tapeIn(ox, oz, r);
    const nx = p.x + dx, nz = p.z + dz;
    if (!blocked(nx, nz, r)) { p.x = nx; p.z = nz; }
    else if (!blocked(nx, p.z, r)) p.x = nx;
    else if (!blocked(p.x, nz, r)) p.z = nz;
    // 이미 띠에 박혀 있으면 빠져나오는 걸음은 허락한다
    else if (stuck && !blocked(nx, nz, r, true) && tapeIn(nx, nz, r) < stuck) { p.x = nx; p.z = nz; }
    pushOut(p, r);
    // 기둥·나무에 밀려 띠 속으로 들어가지 않게
    if (!stuck && tapeIn(p.x, p.z, r) > 0) { p.x = ox; p.z = oz; }
  }
  // 카메라가 건물 속으로 들어가나
  function camBlocked(x, y, z) {
    for (const b of C.boxes) {
      if (!b.h || y > b.h) continue;
      const dx = x - b.x, dz = z - b.z;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      if (Math.abs(lx) < b.hw + 0.3 && Math.abs(lz) < b.hd + 0.3) return true;
    }
    // 나무 줄기 — 화면 가득 줄기가 들어오지 않게
    if (y < 4) for (const c of C.circles) {
      if (c.r < 0.3) continue;
      const dx = x - c.x, dz = z - c.z, rr = c.r + 0.35;
      if (dx * dx + dz * dz < rr * rr) return true;
    }
    return false;
  }

  // ── 재질 ──
  const M = {};
  function mat(key, color, o) {
    if (!M[key]) M[key] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0 }, o || {}));
    return M[key];
  }
  function segDist(px, pz, ax, az, bx, bz) {
    const vx = bx - ax, vz = bz - az, wx = px - ax, wz = pz - az;
    const t = U.clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
    return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
  }
  function nearPath(x, z, pad) {
    for (const pa of PATHS) for (let i = 0; i < pa.p.length - 1; i++) {
      if (segDist(x, z, pa.p[i][0], pa.p[i][1], pa.p[i + 1][0], pa.p[i + 1][1]) < pa.w / 2 + pad) return true;
    }
    for (const q of PLAZAS) if (Math.hypot(x - q[0], z - q[1]) < q[2] + pad) return true;
    return false;
  }

  // ── 땅: 한 장의 캔버스에 잔디·길·광장을 그린다 ──
  function ground(scene) {
    const PX = 8, W = (X1 - X0) * PX, H = (Z1 - Z0) * PX;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const cx = x => (x - X0) * PX, cz = z => (z - Z0) * PX;
    g.fillStyle = '#6d8c46'; g.fillRect(0, 0, W, H);
    const rnd = U.mulberry(7);
    for (let i = 0; i < 9000; i++) {
      const x = rnd() * W, y = rnd() * H, r = 3 + rnd() * 22;
      g.fillStyle = rnd() < 0.5 ? 'rgba(90,120,52,0.18)' : 'rgba(130,150,70,0.14)';
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // 길
    const pathStroke = (col, extra) => {
      g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const pa of PATHS) {
        g.lineWidth = (pa.w + extra) * PX; g.beginPath();
        pa.p.forEach((q, i) => i ? g.lineTo(cx(q[0]), cz(q[1])) : g.moveTo(cx(q[0]), cz(q[1])));
        g.stroke();
      }
      g.fillStyle = col;
      for (const q of PLAZAS) { g.beginPath(); g.arc(cx(q[0]), cz(q[1]), (q[2] + extra / 2) * PX, 0, 7); g.fill(); }
    };
    pathStroke('#9a8f6a', 1.2);
    pathStroke('#cdbf98', 0);
    for (let i = 0; i < 26000; i++) {
      const x = rnd() * W, y = rnd() * H;
      const wx = x / PX + X0, wz = y / PX + Z0;
      if (!nearPath(wx, wz, -0.5)) continue;
      g.fillStyle = rnd() < 0.5 ? 'rgba(120,105,80,0.35)' : 'rgba(240,230,205,0.35)';
      g.fillRect(x, y, 2 + rnd() * 3, 2 + rnd() * 3);
    }
    // 분수 광장 돌 무늬
    g.strokeStyle = 'rgba(150,135,105,0.55)'; g.lineWidth = 3;
    for (let r = 10; r < 23; r += 3) { g.beginPath(); g.arc(cx(FOUNT.x), cz(FOUNT.z), r * PX, 0, 7); g.stroke(); }
    // 연못 바닥
    g.fillStyle = '#3c5a3e'; g.beginPath(); g.ellipse(cx(POND.x), cz(POND.z), (POND.rx + 1.5) * PX, (POND.rz + 1.5) * PX, 0, 0, 7); g.fill();

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const geo = new THREE.PlaneGeometry(X1 - X0 + 400, Z1 - Z0 + 400);
    geo.rotateX(-Math.PI / 2);
    // 공원 밖은 같은 잔디색으로 이어진다 — UV 를 공원 안에만 맞춘다
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + (X0 + X1) / 2 - X0) / (X1 - X0), 1 - (pos.getZ(i) + (Z0 + Z1) / 2 - Z0) / (Z1 - Z0));
    }
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    P.groundPaint = { g, cx, cz, tex, PX };   // 벚꽃 밑 꽃잎을 나중에 덧칠한다
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
    m.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
    m.receiveShadow = true;
    scene.add(m);
  }

  // ── 합쳐 그리기 도우미: 같은 재질끼리 모아 한 덩이로 ──
  function Batch() {
    const groups = {};
    return {
      add(geo, matKey, matObj, m4) {
        const g = geo.clone(); g.applyMatrix4(m4);
        if (g.index) { const ng = g.toNonIndexed(); g.dispose(); (groups[matKey] = groups[matKey] || { mat: matObj, list: [] }).list.push(ng); }
        else (groups[matKey] = groups[matKey] || { mat: matObj, list: [] }).list.push(g);
      },
      flush(scene, shadow) {
        for (const k in groups) {
          const gs = groups[k].list;
          gs.forEach(g => { for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n); });
          const merged = window.BufferGeometryUtils.mergeGeometries(gs, false);
          const mesh = new THREE.Mesh(merged, groups[k].mat);
          mesh.castShadow = shadow !== false; mesh.receiveShadow = true;
          scene.add(mesh);
        }
      }
    };
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
  function M4(x, y, z, sx, sy, sz, ry, rx, rz) {
    _p.set(x, y, z); _s.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0));
    return _m.compose(_p, _q, _s);
  }
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    cone4: new THREE.ConeGeometry(0.7071, 1, 4),
    cone8: new THREE.ConeGeometry(0.5, 1, 8),
    blob: new THREE.IcosahedronGeometry(1, 1),
    sph: new THREE.SphereGeometry(0.5, 12, 8),
    cone8b: new THREE.CylinderGeometry(0.35, 0.5, 1, 7),   // 끝이 가는 가지
  };
  G.cone4.rotateY(Math.PI / 4);

  // ── 나무 ──
  function trees(scene, B) {
    const rnd = U.mulberry(21);
    const SK = { puffs: [], cards: [], spots: [] };
    const prnd = U.mulberry(33);
    const put = (x, z, sakura, big) => {
      if (sakura) { sakuraTree(B, SK, rnd, x, z, big || 1); addCircle(x, z, 0.4 * (big || 1)); return; }
      // 초록 나무 = 소나무. 모양은 따로 뽑고, 숲 배치가 그대로이도록 옛 둥근 나무가 쓰던 만큼 rnd 를 넘긴다
      for (let i = 0; i < 32; i++) rnd();
      pineTree(B, PN, prnd, x, z, big || 1);
      addCircle(x, z, 0.4 * (big || 1));
    };
    // 사쿠라길 양옆 벚꽃
    const av = PATHS[0].p;
    for (let i = 0; i < av.length - 1; i++) {
      const [ax, az] = av[i], [bx, bz] = av[i + 1];
      const L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L, nz = (bx - ax) / L;
      for (let t = 4; t < L; t += 8) {
        const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L;
        for (const sd of [-1, 1]) {
          const px = x + nx * sd * 9.2, pz = z + nz * sd * 9.2;
          if (inWater(px, pz, 2) || nearPlazaCore(px, pz)) continue;
          put(px, pz, true);
        }
      }
    }
    // 연못가 벚꽃
    for (let a = 0; a < 6.28; a += 0.2) {
      const x = POND.x + Math.cos(a) * (POND.rx + 5), z = POND.z + Math.sin(a) * (POND.rz + 5);
      if (x < X0 + 6 || nearPath(x, z, 1.5)) continue;
      put(x, z, rnd() < 0.6);
    }
    // 나머지 숲
    let tries = 0, made = 0;
    while (made < 260 && tries++ < 6000) {
      const x = X0 + 6 + rnd() * (X1 - X0 - 12), z = Z0 + 6 + rnd() * (Z1 - Z0 - 10);
      if (nearPath(x, z, 3.2) || inWater(x, z, -6)) continue;
      if (x > -8 && x < 60 && z < -80) continue;          // 박물관 앞
      if (x < -5 && z < -64 && z > -80) continue;          // 동물원 담
      if (Math.hypot(x - ISLAND.x, z - ISLAND.z) < 12) continue;
      if (C.circles.some(c => Math.hypot(c.x - x, c.z - z) < 5)) continue;
      if (C.boxes.some(b => Math.hypot(b.x - x, b.z - z) < Math.max(b.hw, b.hd) + 3)) continue;
      put(x, z, rnd() < 0.28, rnd() < 0.2 ? 1.4 : 1);
      made++;
    }
    sakuraFlush(scene, SK);
  }
  const PN = { cards: [] };   // 솔잎 카드 — 공원 숲과 둘레 숲이 함께 쓰고 build 끝에 한 번에 그린다

  // ── 소나무: 붉은 줄기가 살짝 굽고, 위쪽 가지 끝마다 납작한 솔잎 뭉치(구름 모양) ──
  function limb(B, key, m, ax, ay, az, bx, by, bz, r0) {
    _a.set(ax, ay, az); _b.set(bx, by, bz);
    const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(_up, _b.clone().sub(_a).normalize());
    _p.copy(_a).add(_b).multiplyScalar(0.5); _s.set(r0 * 2, len, r0 * 2);
    B.add(G.cone8b, key, m, _m.compose(_p, _q, _s));
  }
  function pineTree(B, PN, rnd, x, z, big, lite) {
    const bark = mat('pinebark', 0x6e4632, { roughness: 1 });
    const core = mat('pinecore', 0x3d6532, { flatShading: true, roughness: 1, emissive: 0x1a2c12, emissiveIntensity: 0.7 });
    const k = big * (0.85 + rnd() * 0.35);
    const H = (6.2 + rnd() * 2.6) * k;
    // 줄기: 네 마디로 한쪽으로 휘었다가 끝이 살짝 돌아온다
    const lean = rnd() * 6.28, bend = (0.5 + rnd() * 1.1) * k;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, off = Math.sin(t * Math.PI * 0.85) * bend;
      pts.push([x + Math.sin(lean) * off + (i && i < 4 ? (rnd() - 0.5) * 0.25 * k : 0), H * t, z + Math.cos(lean) * off + (i && i < 4 ? (rnd() - 0.5) * 0.25 * k : 0)]);
    }
    for (let i = 0; i < 4; i++) limb(B, 'pinebark', bark, ...pts[i], ...pts[i + 1], (0.3 - i * 0.05) * k);
    const at = t => { const f = t * 4, i = Math.min(3, f | 0), u = f - i; return [0, 1, 2].map(c => pts[i][c] + (pts[i + 1][c] - pts[i][c]) * u); };
    // 솔잎 뭉치
    const pad = (cx, cy, cz, s) => {
      B.add(G.blob, 'pinecore', core, M4(cx, cy, cz, s * 0.8, s * 0.3, s * 0.8, rnd() * 3));
      const n = lite ? 10 + ((rnd() * 3) | 0) : 17 + ((rnd() * 6) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28, d = Math.sqrt(rnd()) * s * 1.05;
        // 가운데는 눕히고 가장자리로 갈수록 세워서 옆에서 봐도 솔잎이 보이게
        const edge = d / (s * 1.05);
        PN.cards.push({ x: cx + Math.cos(a) * d, y: cy + (rnd() - 0.45) * 0.45 * s, z: cz + Math.sin(a) * d,
          s: s * (0.7 + rnd() * 0.45), rx: -Math.PI / 2 + edge * (rnd() - 0.5) * 2.2, ry: rnd() * 6.28, rz: (rnd() - 0.5) * 0.9, c: PINE_COL[(rnd() * PINE_COL.length) | 0] });
      }
    };
    const nPad = lite ? 3 + ((rnd() * 2) | 0) : 5 + ((rnd() * 3) | 0);
    for (let i = 0; i < nPad; i++) {
      const t = 0.5 + (i / nPad) * 0.42 + rnd() * 0.05;
      const [bx, by, bz] = at(t);
      const a = (i * 2.4) + rnd() * 0.8;                        // 황금각으로 돌려 겹치지 않게
      const L = (2.4 - (t - 0.5) * 3.2 + rnd() * 0.8) * k;      // 아래 가지일수록 길다
      const ex = bx + Math.sin(a) * L, ez = bz + Math.cos(a) * L, ey = by + (0.25 + rnd() * 0.5) * k;
      limb(B, 'pinebark', bark, bx, by, bz, ex, ey, ez, 0.09 * k);
      pad(ex, ey + 0.15 * k, ez, (1.05 + rnd() * 0.4) * k * (1.15 - (t - 0.5)));
    }
    const top = pts[4];
    pad(top[0], top[1] + 0.2 * k, top[2], 1.15 * k);
  }
  const PINE_COL = [new THREE.Color(1, 1, 1), new THREE.Color(0.85, 0.95, 0.85), new THREE.Color(1.05, 1.05, 0.9)];
  function needleTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'); const r = U.mulberry(91);
    const cols = ['#23401f', '#2f5528', '#3d6b33', '#4f7f3c', '#62914a'];
    g.lineCap = 'round';
    // 솔잎 다발: 한 점에서 부챗살로 뻗는 가는 잎
    for (let i = 0; i < 46; i++) {
      const a0 = r() * 6.28, d0 = Math.sqrt(r()) * 84;
      const cx = 128 + Math.cos(a0) * d0, cy = 128 + Math.sin(a0) * d0;
      const dir = r() * 6.28, n = 9 + ((r() * 6) | 0);
      for (let j = 0; j < n; j++) {
        const a = dir + (j / n - 0.5) * 2.4 + (r() - 0.5) * 0.2, L = 22 + r() * 22;
        g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = 2.2 + r() * 1.6;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  function pineFlush(scene, PN) {
    const tex = needleTex();
    const cm = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1, emissive: 0x1c3014, emissiveIntensity: 0.8 });
    const cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1.6), cm, PN.cards.length);
    const d = new THREE.Object3D();
    PN.cards.forEach((c, i) => { d.position.set(c.x, c.y, c.z); d.rotation.set(c.rx, c.ry, c.rz, 'YXZ'); d.scale.setScalar(c.s); d.updateMatrix(); cards.setMatrixAt(i, d.matrix); cards.setColorAt(i, c.c); });
    cards.receiveShadow = true;
    cards.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.4 });
    cards.castShadow = true;
    scene.add(cards);
  }

  // ── 벚나무: 우산처럼 퍼진 가지 끝마다 작은 꽃송이(몽글한 덩이 + 꽃 무늬 카드) ──
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function branch(B, trunk, ax, ay, az, bx, by, bz, r0) {
    _a.set(ax, ay, az); _b.set(bx, by, bz);
    const len = _a.distanceTo(_b);
    const dir = _b.clone().sub(_a).normalize();
    _q.setFromUnitVectors(_up, dir);
    _p.copy(_a).add(_b).multiplyScalar(0.5); _s.set(r0 * 2, len, r0 * 2);
    B.add(G.cone8b, 'trunk', trunk, _m.compose(_p, _q, _s));
  }
  function sakuraTree(B, SK, rnd, x, z, big) {
    const trunk = mat('trunk', 0x4a3a2c);
    const k = big * (0.9 + rnd() * 0.25);
    const h = 2.3 * k, R = 3.6 * k;
    const lean = rnd() * 6.28, lx = Math.sin(lean) * 0.25 * k, lz = Math.cos(lean) * 0.25 * k;
    branch(B, trunk, x, 0, z, x + lx, h, z + lz, 0.3 * k);
    const tx = x + lx, tz = z + lz;
    const nMain = 5 + ((rnd() * 2) | 0);
    for (let i = 0; i < nMain; i++) {
      const a = (i / nMain) * 6.28 + rnd() * 0.6;
      const r1 = R * (0.35 + rnd() * 0.2), y1 = h + (0.9 + rnd() * 0.7) * k;
      const mx = tx + Math.sin(a) * r1, mz = tz + Math.cos(a) * r1;
      branch(B, trunk, tx, h - 0.1, tz, mx, y1, mz, 0.15 * k);
      for (let j = 0; j < 2; j++) {
        const a2 = a + (j ? 0.45 : -0.45) + (rnd() - 0.5) * 0.3;
        const r2 = R * (0.8 + rnd() * 0.25), y2 = y1 + (0.3 + rnd() * 0.8) * k;
        const ex = tx + Math.sin(a2) * r2, ez = tz + Math.cos(a2) * r2;
        branch(B, trunk, mx, y1, mz, ex, y2, ez, 0.08 * k);
        // 가지를 따라 꽃송이 — 끝으로 갈수록 크고 살짝 처진다
        for (const t of [0.35, 0.65, 1.0]) {
          const cxp = mx + (ex - mx) * t + (rnd() - 0.5) * 0.7 * k;
          const cyp = y1 + (y2 - y1) * t + (rnd() - 0.3) * 0.5 * k - (t === 1 ? 0.25 * k : 0);
          const czp = mz + (ez - mz) * t + (rnd() - 0.5) * 0.7 * k;
          cluster(SK, rnd, cxp, cyp, czp, k * (0.75 + t * 0.35));
        }
      }
    }
    // 꼭대기 채움
    for (let i = 0; i < 8; i++) {
      const a = rnd() * 6.28, r = R * Math.sqrt(rnd()) * 0.6;
      cluster(SK, rnd, tx + Math.sin(a) * r, h + (2.0 + rnd() * 0.9) * k, tz + Math.cos(a) * r, k * 0.9);
    }
    SK.spots.push([x, z, R]);
  }
  const PUFF_COL = [0xffc3d7, 0xffb0c9, 0xffd8e5, 0xffe8ef].map(c => new THREE.Color(c));
  const CARD_COL = [new THREE.Color(1, 1, 1), new THREE.Color(1, 0.9, 0.94), new THREE.Color(1, 0.8, 0.88)];
  function cluster(SK, rnd, x, y, z, s) {
    SK.puffs.push({ x, y, z, s: s * (0.3 + rnd() * 0.15), ry: rnd() * 6, c: PUFF_COL[(rnd() * PUFF_COL.length) | 0] });
    for (let i = 0; i < 7; i++) {
      SK.cards.push({ x: x + (rnd() - 0.5) * 1.0 * s, y: y + (rnd() - 0.35) * 0.7 * s, z: z + (rnd() - 0.5) * 1.0 * s,
        s: s * (0.9 + rnd() * 0.5), rx: -1.2 + rnd() * 2.4, ry: rnd() * 6.28, rz: rnd() * 6.28, c: CARD_COL[(rnd() * 3) | 0] });
    }
  }
  function blossomTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'); const r = U.mulberry(77);
    const flower = (fx, fy, fr, col) => {
      g.fillStyle = col;
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * Math.PI * 2 + fr;
        g.beginPath(); g.ellipse(fx + Math.cos(a) * fr * 0.55, fy + Math.sin(a) * fr * 0.55, fr * 0.55, fr * 0.4, a, 0, 7); g.fill();
      }
      g.fillStyle = '#ff6f9c'; g.beginPath(); g.arc(fx, fy, fr * 0.17, 0, 7); g.fill();
    };
    const cols = ['#fff4f7', '#ffe1ea', '#ffd0de', '#ffc2d4'];
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * 96;
      flower(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 13 + r() * 12, cols[(r() * 4) | 0]);
    }
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 100; g.fillStyle = '#ff9fbd'; g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 3 + r() * 3, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  function sakuraFlush(scene, SK) {
    const d = new THREE.Object3D();
    // 몽글한 속 덩이
    const pm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0x7a3048, emissiveIntensity: 0.55 });

    // (속 덩이는 분홍 구슬처럼 튀어나와 보여 뺐다 — 카드만으로 채운다)
    // 꽃 무늬 카드 — 겉을 잘게 덮는다
    const tex = blossomTex();
    const cm = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, emissive: 0x552030, emissiveIntensity: 0.5 });
    const cards = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5, 1.5), cm, SK.cards.length);
    SK.cards.forEach((c, i) => { d.position.set(c.x, c.y, c.z); d.rotation.set(c.rx, c.ry, c.rz); d.scale.setScalar(c.s); d.updateMatrix(); cards.setMatrixAt(i, d.matrix); cards.setColorAt(i, c.c); });
    cards.receiveShadow = true;
    // 그림자에도 꽃 모양이 비치게
    cards.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
    cards.castShadow = true;
    scene.add(cards);
    // 나무 밑 떨어진 꽃잎
    const gp = P.groundPaint;
    if (gp) {
      const r = U.mulberry(5);
      for (const [x, z, R] of SK.spots) {
        for (let i = 0; i < 160; i++) {
          const a = r() * 6.28, dd = Math.sqrt(r()) * R * 1.15;
          gp.g.fillStyle = r() < 0.5 ? 'rgba(255,205,222,0.75)' : 'rgba(255,232,240,0.7)';
          gp.g.beginPath(); gp.g.ellipse(gp.cx(x + Math.cos(a) * dd), gp.cz(z + Math.sin(a) * dd), 1.6 + r() * 1.6, 1 + r(), r() * 3, 0, 7); gp.g.fill();
        }
      }
      gp.tex.needsUpdate = true;
    }
  }
  function nearPlazaCore(x, z) {
    for (const zn of DATA.ZONES) if (Math.hypot(x - zn.x, z - zn.z) < zn.r - 2) return true;
    return false;
  }

  // ── 간판 글씨 캔버스 ──
  function signTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  // ── 명소 ──
  function landmarks(scene, B) {
    const stone = mat('stone', 0x9c988c), dark = mat('roof', 0x3a3d42), red = mat('red', 0xb8352a), gold = mat('gold', 0xc9a13c, { metalness: 0.55, roughness: 0.45 });
    const white = mat('white', 0xe8e2d4), wood = mat('wood', 0x6b4a32), bronze = mat('bronze', 0x3d4a3f, { metalness: 0.4, roughness: 0.55 });
    const green = mat('grn', 0x5b8f6a), cream = mat('cream', 0xd9cfb6), brick = mat('brick', 0x8a5a44);

    // 도쿄국립박물관 (북쪽 끝)
    {
      const x = 25, z = -100;
      B.add(G.box, 'cream', cream, M4(x, 6, z, 76, 12, 20));
      B.add(G.box, 'stone', stone, M4(x, 0.6, z + 10.8, 78, 1.2, 2));
      B.add(G.cone4, 'roof', dark, M4(x, 15, z, 84, 6, 24));
      B.add(G.box, 'cream', cream, M4(x, 8, z + 11, 18, 16, 4));
      B.add(G.cone4, 'roof', dark, M4(x, 18.5, z + 11, 22, 5, 7));
      for (let i = -3; i < 4; i++) B.add(G.box, 'roof', dark, M4(x + i * 9.5, 5.5, z + 10.05, 3.2, 5, 0.3));
      addBox(x, z, 38, 10.5); C.boxes[C.boxes.length - 1].h = 14;
      addBox(x, z + 11, 9, 2); C.boxes[C.boxes.length - 1].h = 16;
      const t = signTex(512, 96, (g, w, h) => { g.fillStyle = '#2b2b2b'; g.fillRect(0, 0, w, h); g.fillStyle = '#e9dcb8'; g.font = 'bold 54px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MUSEUM', w / 2, h / 2 + 2); });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
      s.position.set(x, 13.2, z + 13.05); scene.add(s);
    }

    // 분수
    {
      const { x, z, r } = FOUNT;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 8, 48), stone); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.45, z); ring.castShadow = true; scene.add(ring);
      const w = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ color: 0x6fa7c0, roughness: 0.15, metalness: 0.1 }));
      w.rotation.x = -Math.PI / 2; w.position.set(x, 0.32, z); scene.add(w);
      B.add(G.cyl, 'stone', stone, M4(x, 0.9, z, 2.2, 1.8, 2.2));
      addCircle(x, z, r + 0.4);
      // 물줄기 — 알갱이
      const N = 900, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let i = 0; i < N; i++) seed[i] = Math.random();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const dot = signTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8f6ff, size: 0.3, map: dot, transparent: true, opacity: 0.85, depthWrite: false }));
      pts.frustumCulled = false; scene.add(pts);
      P.jets = { geo, pos, seed, N, x, z };
    }

    // 시노바즈 연못 물·연잎·벤텐도·둑길·오리배
    {
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x4f7d78, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.92 }));
      water.scale.set(POND.rx + 1.5, POND.rz + 1.5, 1); water.rotation.x = -Math.PI / 2; water.position.set(POND.x, 0.12, POND.z);
      scene.add(water); P.water = water;
      const lotus = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10), mat('lotus', 0x4e8a3c, { side: THREE.DoubleSide }), 520);
      const rnd = U.mulberry(3); let n = 0; const d = new THREE.Object3D();
      while (n < 520) {
        const x = POND.x + (rnd() * 2 - 1) * POND.rx, z = POND.z + (rnd() * 2 - 1) * POND.rz;
        if (!inWater(x, z, 3.5) || x > POND.x + 4 && z < POND.z - 5) continue;     // 오른쪽 위는 물이 보이게
        if (Math.abs(z - CAUSE.z) < 5 && x > CAUSE.x0 - 4) continue;
        d.position.set(x, 0.18 + rnd() * 0.05, z); d.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.3, 0, rnd() * 6); d.scale.setScalar(0.5 + rnd() * 0.7);
        d.updateMatrix(); lotus.setMatrixAt(n++, d.matrix);
      }
      lotus.receiveShadow = true; scene.add(lotus);
      // 둑길
      B.add(G.box, 'stone', stone, M4((CAUSE.x0 + CAUSE.x1) / 2, 0.15, CAUSE.z, CAUSE.x1 - CAUSE.x0 + 2, 0.3, CAUSE.hw * 2));
      for (let x = CAUSE.x0; x <= CAUSE.x1; x += 3) for (const sd of [-1, 1]) B.add(G.box, 'red', red, M4(x, 0.7, CAUSE.z + sd * (CAUSE.hw - 0.1), 0.18, 1.0, 0.18));
      B.add(G.box, 'red', red, M4((CAUSE.x0 + CAUSE.x1) / 2, 1.15, CAUSE.z - CAUSE.hw + 0.1, CAUSE.x1 - CAUSE.x0, 0.12, 0.12));
      B.add(G.box, 'red', red, M4((CAUSE.x0 + CAUSE.x1) / 2, 1.15, CAUSE.z + CAUSE.hw - 0.1, CAUSE.x1 - CAUSE.x0, 0.12, 0.12));
      // 섬
      const isl = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND.r, ISLAND.r + 0.6, 0.4, 24), mat('isl', 0xbfb393)); isl.position.set(ISLAND.x, 0.1, ISLAND.z); isl.receiveShadow = true; scene.add(isl);
      // 벤텐도 — 팔각당
      const bx = ISLAND.x, bz = ISLAND.z;
      B.add(G.cyl8, 'stone', stone, M4(bx, 0.5, bz, 9, 1, 9));
      B.add(G.cyl8, 'red', red, M4(bx, 2.6, bz, 7, 3.4, 7));
      B.add(G.cone8, 'roof', dark, M4(bx, 5.4, bz, 11, 2.6, 11));
      B.add(G.cyl8, 'red', red, M4(bx, 7.0, bz, 3.2, 1.6, 3.2));
      B.add(G.cone8, 'roof', dark, M4(bx, 8.6, bz, 5, 2.2, 5));
      B.add(G.sph, 'gold', gold, M4(bx, 10.0, bz, 0.8));
      addCircle(bx, bz, 4.6);
      // 오리배
      const boatW = mat('boat', 0xf4f1ea), beak = mat('beak', 0xf2a33a);
      [[-78, 22, 0.6], [-52, 70, 2.1], [-86, 58, 4.0], [-70, 12, 1.2]].forEach(([x, z, a]) => {
        B.add(G.box, 'boat', boatW, M4(x, 0.45, z, 1.6, 0.6, 2.6, a));
        B.add(G.sph, 'boat', boatW, M4(x + Math.sin(a) * 1.1, 1.1, z + Math.cos(a) * 1.1, 0.7, 1.4, 0.7, a));
        B.add(G.sph, 'beak', beak, M4(x + Math.sin(a) * 1.5, 1.6, z + Math.cos(a) * 1.5, 0.35, 0.2, 0.5, a));
      });
    }

    // 도쇼궁 — 돌 도리이, 석등 길, 금빛 사당
    {
      const tx = -24, tz = -5.6;
      const rot = Math.atan2(-4, -40) * 0;   // 길이 거의 동서로 뻗어 기둥은 남북으로 선다
      for (const sd of [-1, 1]) {
        const px = tx, pz = tz + sd * 4.2;
        B.add(G.cyl, 'stone', stone, M4(px, 3.2, pz, 0.8, 6.4, 0.8));
        addCircle(px, pz, 0.45);
      }
      B.add(G.box, 'stone', stone, M4(tx, 6.5, tz, 0.9, 0.6, 11.4, rot));
      B.add(G.box, 'stone', stone, M4(tx, 5.4, tz, 0.6, 0.45, 9.6, rot));
      // 석등 줄
      for (let t = 0.12; t < 0.98; t += 0.07) {
        const x = -26 + (-66 + 26) * t, z = -6 + (-10 + 6) * t;
        for (const sd of [-1, 1]) {
          const lx = x, lz = z + sd * 5.2;
          if (nearPlazaCore(lx, lz)) continue;
          B.add(G.box, 'stone', stone, M4(lx, 0.25, lz, 0.9, 0.5, 0.9));
          B.add(G.cyl, 'stone', stone, M4(lx, 1.0, lz, 0.35, 1.2, 0.35));
          B.add(G.box, 'stone', stone, M4(lx, 1.85, lz, 0.75, 0.55, 0.75));
          B.add(G.cone4, 'stone', stone, M4(lx, 2.45, lz, 1.25, 0.6, 1.25));
          addCircle(lx, lz, 0.5);
          C.lanterns.push({ x: lx, z: lz });
        }
      }
      // 사당
      const sx = -72, sz = -11;
      B.add(G.box, 'stone', stone, M4(sx, 0.5, sz, 16, 1, 12));
      B.add(G.box, 'gold', gold, M4(sx, 3.2, sz, 12, 4.4, 8));
      B.add(G.cone4, 'roof', dark, M4(sx, 7.0, sz, 17, 3.4, 12));
      B.add(G.box, 'gold', gold, M4(sx + 7, 2.6, sz, 2.4, 3.2, 5));
      B.add(G.cone4, 'roof', dark, M4(sx + 7, 5.0, sz, 4, 1.8, 7.5));
      for (let i = -3; i <= 3; i++) B.add(G.box, 'red', red, M4(sx + 10, 0.9, sz + i * 2.2, 0.3, 1.8, 0.3));
      addBox(sx, sz, 8, 6); C.boxes[C.boxes.length - 1].h = 8;
    }

    // 동물원 정문 + 담 + 오층탑
    {
      const gx = -21, gz = -68;
      B.add(G.box, 'brick', brick, M4(-62, 1.6, gz, 84, 3.2, 1.2));
      B.add(G.box, 'brick', brick, M4(-8, 1.6, gz, 14, 3.2, 1.2));
      addBox(-62, gz, 42, 0.8); addBox(-8, gz, 7, 0.8);
      for (const sd of [-1, 1]) { B.add(G.box, 'white', white, M4(gx + sd * 6, 3.5, gz, 1.6, 7, 1.6)); }
      B.add(G.box, 'grn', green, M4(gx, 7.4, gz, 15, 1.6, 2.2));
      const t = signTex(640, 160, (g, w, h) => {
        g.fillStyle = '#2f6b45'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff'; g.font = 'bold 84px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('UENO ZOO', 190, h / 2 + 4);
        // 판다 얼굴
        const cx = 95, cy = h / 2;
        g.fillStyle = '#111'; [[-38, -40], [38, -40]].forEach(([dx, dy]) => { g.beginPath(); g.arc(cx + dx, cy + dy, 22, 0, 7); g.fill(); });
        g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 58, 0, 7); g.fill();
        g.fillStyle = '#111'; [[-22, -6], [22, -6]].forEach(([dx, dy]) => { g.beginPath(); g.ellipse(cx + dx, cy + dy, 14, 19, dx < 0 ? 0.5 : -0.5, 0, 7); g.fill(); });
        g.beginPath(); g.arc(cx, cy + 22, 8, 0, 7); g.fill();
      });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
      s.position.set(gx, 7.4, gz + 1.12); scene.add(s);
      addBox(gx - 6, gz, 0.8, 0.8); addBox(gx + 6, gz, 0.8, 0.8);
      addBox(gx, gz - 0.2, 5.2, 0.6);   // 문은 닫혀 있다
      B.add(G.box, 'wood', wood, M4(gx, 1.8, gz - 0.2, 10.4, 3.6, 0.4));
      // 오층탑 (담 너머로 보인다)
      const px = -46, pz = -90;
      for (let i = 0; i < 5; i++) {
        const y = 1.5 + i * 3.4, w = 5.6 - i * 0.55;
        B.add(G.box, 'red', red, M4(px, y + 1.0, pz, w, 2.2, w));
        B.add(G.cone4, 'roof', dark, M4(px, y + 2.6, pz, w * 1.9, 1.3, w * 1.9));
      }
      B.add(G.cyl, 'gold', gold, M4(px, 20, pz, 0.35, 5, 0.35));
    }

    // 사이고 동상 (남쪽 입구)
    {
      const x = 42, z = 82;
      B.add(G.box, 'stone', stone, M4(x, 1.6, z, 3.2, 3.2, 3.2));
      B.add(G.cyl, 'bronze', bronze, M4(x, 4.4, z, 1.5, 2.6, 1.2));
      B.add(G.sph, 'bronze', bronze, M4(x, 6.1, z, 0.9));
      B.add(G.box, 'bronze', bronze, M4(x + 1.1, 3.6, z + 0.4, 0.9, 0.7, 0.4));
      B.add(G.sph, 'bronze', bronze, M4(x + 1.5, 3.9, z + 0.4, 0.45));
      addBox(x, z, 1.7, 1.7);
    }
  }

  let _lock = null;
  function lockTex() {
    if (_lock) return _lock;
    _lock = signTex(128, 128, (g) => {
      g.fillStyle = 'rgba(20,20,26,0.85)'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
      g.strokeStyle = '#f2c230'; g.lineWidth = 11; g.beginPath(); g.arc(64, 52, 20, Math.PI, 0); g.stroke();
      g.fillStyle = '#f2c230'; g.fillRect(36, 52, 56, 42);
      g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(64, 70, 7, 0, 7); g.fill(); g.fillRect(61, 70, 6, 14);
    });
    return _lock;
  }
  let _heal = null;
  function healTex() {
    if (_heal) return _heal;
    // 자판기 표지: 딸기우유 + 고양이 캔 (예전 응급 하트 표시는 사장님 요청으로 바꿈)
    _heal = signTex(128, 128, (g) => {
      g.fillStyle = 'rgba(255,255,255,0.97)'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
      g.lineWidth = 6; g.strokeStyle = '#d23a3a'; g.stroke();
      // 딸기우유 우유갑 + 생선 그림 고양이 캔 (core.js ICON, 단추·자판기 창과 같은 그림)
      ICON.draw('milk', g, 6, 18, 74);
      ICON.draw('can', g, 56, 42, 60);
    });
    return _heal;
  }

  // ── 자판기·포장마차·의자·가로등 ──
  function props(scene, B) {
    const white = mat('white', 0xe8e2d4), dark = mat('roof', 0x3a3d42), wood = mat('wood', 0x6b4a32), metal = mat('metal', 0x5a6068, { metalness: 0.5, roughness: 0.5 });
    const vendTex = signTex(128, 256, (g, w, h) => {
      g.fillStyle = '#f2f4f6'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#20252b'; g.fillRect(8, 10, w - 16, 118);
      const cols = ['#e03a3a', '#2e7de0', '#f3c02f', '#3bb36a', '#ff8a3a', '#9b59d0'];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cols[(r * 4 + c) % 6]; g.fillRect(16 + c * 26, 20 + r * 36, 16, 28); g.fillStyle = '#fff'; g.fillRect(16 + c * 26, 20 + r * 36, 16, 5); }
      g.fillStyle = '#c9ccd0'; g.fillRect(14, 190, w - 28, 34);
      g.fillStyle = '#20252b'; g.fillRect(24, 198, w - 48, 16);
    });
    const vendFront = new THREE.MeshStandardMaterial({ map: vendTex, roughness: 0.5, emissive: 0xffffff, emissiveMap: vendTex, emissiveIntensity: 0.35 });
    const vendBody = mat('vend', 0xd23a3a);
    [[44, 92, -Math.PI / 2], [-10, 54, Math.PI], [-31, 7, Math.PI], [-2, -43, -Math.PI / 2], [50, -38, -Math.PI / 2], [34, 22, -Math.PI / 2]].forEach(([x, z, a]) => {
      B.add(G.box, 'vend', vendBody, M4(x, 0.95, z, 1.1, 1.9, 0.8, a));
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.8), vendFront);
      f.position.set(x + Math.sin(a) * 0.41, 0.95, z + Math.cos(a) * 0.41); f.rotation.y = a; scene.add(f);
      addBox(x, z, 0.62, 0.45, a);
      C.vend.push({ x: x + Math.sin(a) * 1.2, z: z + Math.cos(a) * 1.2, a });
      // 머리 위 체력 표시 — 멀리서도 "여기서 체력 채운다"가 보이게
      const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: healTex(), depthWrite: false, fog: false }));
      icon.position.set(x, 3.0, z); icon.scale.setScalar(1.1);
      scene.add(icon); (P.vendIcons = P.vendIcons || []).push(icon);
    });
    // 포장마차
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xe8402a, emissive: 0xff5a2a, emissiveIntensity: 0.5, roughness: 0.6 });
    const cloth = mat('cloth', 0xd8d0bd);
    [[33, 60, 0.35], [36, 50, 0.35], [8, 12, -1.3], [44, -24, -1.0]].forEach(([x, z, a]) => {
      B.add(G.box, 'wood', wood, M4(x, 0.55, z, 3.2, 1.1, 1.6, a));
      B.add(G.box, 'cloth', cloth, M4(x, 2.3, z, 3.6, 0.15, 2.2, a, 0.12));
      for (const sd of [-1, 1]) B.add(G.box, 'wood', wood, M4(x + Math.cos(a) * sd * 1.6, 1.3, z - Math.sin(a) * sd * 1.6, 0.12, 2.4, 0.12, a));
      for (const sd of [-1, 1]) B.add(G.sph, 'lantern', lanternMat, M4(x + Math.cos(a) * sd * 1.2 + Math.sin(a) * 1.1, 1.8, z - Math.sin(a) * sd * 1.2 + Math.cos(a) * 1.1, 0.42, 0.55, 0.42));
      addBox(x, z, 1.7, 0.9, a);
      C.stalls.push({ x: x + Math.sin(a) * 1.9, z: z + Math.cos(a) * 1.9, a });   // 포장마차 앞자리 (나중에 미션용)
    });
    // 가로등·의자 — 길을 따라
    for (const pa of PATHS) {
      for (let i = 0; i < pa.p.length - 1; i++) {
        const [ax, az] = pa.p[i], [bx, bz] = pa.p[i + 1];
        const L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L, nz = (bx - ax) / L, ang = Math.atan2(bx - ax, bz - az);
        for (let t = 10; t < L - 4; t += 16) {
          const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L;
          const sd = (t / 16 | 0) % 2 ? 1 : -1;
          const lx = x + nx * sd * (pa.w / 2 + 0.6), lz = z + nz * sd * (pa.w / 2 + 0.6);
          if (inWater(lx, lz, 1) || nearPlazaCore(lx, lz)) continue;
          if (C.circles.some(c => Math.hypot(c.x - lx, c.z - lz) < 1.6)) continue;
          B.add(G.cyl, 'metal', metal, M4(lx, 2.2, lz, 0.14, 4.4, 0.14));
          B.add(G.sph, 'lamp', mat('lamp', 0xfff4d8, { emissive: 0xffe9b0, emissiveIntensity: 0.6 }), M4(lx, 4.5, lz, 0.5));
          addCircle(lx, lz, 0.15);
          const bx2 = x - nx * sd * (pa.w / 2 + 0.9), bz2 = z - nz * sd * (pa.w / 2 + 0.9);
          if (!inWater(bx2, bz2, 1) && !nearPlazaCore(bx2, bz2) && !C.circles.some(c => Math.hypot(c.x - bx2, c.z - bz2) < 1.8)) {
            B.add(G.box, 'wood', wood, M4(bx2, 0.45, bz2, 1.8, 0.08, 0.5, ang));
            B.add(G.box, 'wood', wood, M4(bx2 - nx * sd * 0.25, 0.75, bz2 - nz * sd * 0.25, 1.8, 0.5, 0.06, ang));
            B.add(G.box, 'metal', metal, M4(bx2, 0.22, bz2, 1.6, 0.44, 0.4, ang));
            addBox(bx2, bz2, 0.95, 0.35, ang);
          }
        }
      }
    }
  }

  // ── 하늘·빛·안개 ──
  function sky(scene) {
    const top = new THREE.Color(0x7db4e6), bot = new THREE.Color(0xf3ece0);
    const geo = new THREE.SphereGeometry(900, 24, 12);
    const cols = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = geo.attributes.position.getY(i) / 900;
      const c = bot.clone().lerp(top, U.clamp(y * 1.6 + 0.1, 0, 1));
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const skyM = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    skyM.renderOrder = -1;
    scene.add(skyM); P.sky = skyM;
    // 뭉게구름
    const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0.9 });
    const rnd = U.mulberry(9);
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group(), a = rnd() * 6.28, d = 520 + rnd() * 200;
      for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(G.blob, cm); s.scale.set(30 + rnd() * 30, 14 + rnd() * 10, 22); s.position.set((k - 2) * 28 + rnd() * 10, rnd() * 10, rnd() * 10); g.add(s); }
      g.position.set(Math.cos(a) * d, 120 + rnd() * 90, Math.sin(a) * d); g.lookAt(0, g.position.y, 0);
      skyM.add(g);
    }
    scene.fog = new THREE.Fog(0xe9e6dc, 70, 330);
    scene.add(new THREE.HemisphereLight(0xdfeeff, 0x6b7a4a, 1.25));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    sun.position.set(40, 70, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -38; sc.right = 38; sc.top = 38; sc.bottom = -38; sc.near = 1; sc.far = 220;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
    P.sun = sun;
  }

  // ── 벚꽃잎 ──
  function petals(scene) {
    const N = 700, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = U.rand(-40, 40); pos[i * 3 + 1] = U.rand(0, 14); pos[i * 3 + 2] = U.rand(-40, 40); ph[i] = Math.random() * 6.28; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const g = cv.getContext('2d'); g.fillStyle = '#ffd6e4'; g.beginPath(); g.ellipse(16, 16, 13, 7, 0.6, 0, 7); g.fill();
    const t = new THREE.CanvasTexture(cv);
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, map: t, transparent: true, depthWrite: false, alphaTest: 0.2 }));
    pts.frustumCulled = false; scene.add(pts);
    P.petals = { geo, pos, ph, N };
  }

  // ── 구역 표시: 땅 위 고리 + 깃발 ──
  function zoneMarks(scene) {
    P.zm = {};
    for (const z of DATA.ZONES) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(z.r - 0.35, z.r, 96), new THREE.MeshBasicMaterial({ color: z.band, transparent: true, opacity: 0.55, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(z.x, 0.04, z.z); scene.add(ring);
      // 싸우는 동안 세워지는 벽 (안 보일 만큼 옅은 기둥 띠)
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(z.r, z.r, 2.4, 96, 1, true), new THREE.MeshBasicMaterial({ color: z.band, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      wall.position.set(z.x, 1.2, z.z); scene.add(wall);
      // 깃발
      const fx = z.final ? z.x + 9 : z.x, fz = z.final ? z.z + 9 : z.z;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.5, 6), mat('metal', 0x5a6068)); pole.position.set(fx, 3.25, fz); pole.castShadow = true; scene.add(pole);
      const flagM = new THREE.MeshStandardMaterial({ color: z.band, side: THREE.DoubleSide, roughness: 0.8 });
      const fg = new THREE.PlaneGeometry(2.2, 1.3, 8, 1); fg.translate(1.1, 0, 0);
      const flag = new THREE.Mesh(fg, flagM); flag.position.set(fx + 0.05, 5.8, fz); flag.castShadow = true; scene.add(flag);
      addCircle(fx, fz, 0.15);
      // 아직 못 가는 곳: 깃대 위에 자물쇠
      const lock = new THREE.Sprite(new THREE.SpriteMaterial({ map: lockTex(), depthWrite: false, fog: false }));
      lock.position.set(fx, 7.6, fz); lock.scale.setScalar(1.6); lock.visible = false; scene.add(lock);
      P.zm[z.id] = { ring, wall, flag, flagM, lock, fg0: fg.attributes.position.array.slice() };
    }
    // 분수 광장 둘레 출입금지 띠 (넷을 먹기 전)
    const f = DATA.ZONES.find(z => z.final);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16;
    const g = cv.getContext('2d'); g.fillStyle = '#f2c21a'; g.fillRect(0, 0, 64, 16); g.fillStyle = '#1a1a1a';
    for (let i = -16; i < 64; i += 16) { g.beginPath(); g.moveTo(i, 16); g.lineTo(i + 8, 0); g.lineTo(i + 16, 0); g.lineTo(i + 8, 16); g.fill(); }
    const tt = new THREE.CanvasTexture(cv); tt.wrapS = THREE.RepeatWrapping; tt.repeat.set(60, 1); tt.colorSpace = THREE.SRGBColorSpace;
    const tape = new THREE.Group();
    const band = new THREE.Mesh(new THREE.CylinderGeometry(f.r + 0.6, f.r + 0.6, 0.22, 96, 1, true), new THREE.MeshBasicMaterial({ map: tt, side: THREE.DoubleSide }));
    band.position.y = 1.0; tape.add(band);
    for (let a = 0; a < 6.28; a += 6.28 / 28) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.1, 6), mat('cone', 0xf07a1a));
      post.position.set(Math.cos(a) * (f.r + 0.6), 0.55, Math.sin(a) * (f.r + 0.6)); tape.add(post);
    }
    tape.position.set(f.x, 0, f.z); scene.add(tape);
    P.tapeMesh = tape;
    P.tape = { x: f.x, z: f.z, r: f.r + 0.6 };
  }
  function openTape(on) {
    P.tapeMesh.visible = !on;
    P.tape = on ? null : { x: P.tapeMesh.position.x, z: P.tapeMesh.position.z, r: DATA.ZONES.find(z => z.final).r + 0.6 };
  }

  // ── 공원 밖: 둘레 숲 + 도시 건물 + 멀리 스카이트리 ──
  function outskirts(scene, B) {
    const rnd = U.mulberry(55);
    const prnd = U.mulberry(66);
    // 둘레 숲도 소나무 (가벼운 판). 도시 배치가 그대로이도록 옛 둥근 나무가 쓰던 rnd 19번을 넘긴다
    const ring = (x, z) => {
      for (let i = 0; i < 19; i++) rnd();
      pineTree(B, PN, prnd, x, z, 1, true);
    };
    for (let x = X0; x <= X1; x += 5.5) { ring(x + rnd() * 2, Z0 - 2 - rnd() * 6); ring(x + rnd() * 2, Z0 - 10 - rnd() * 6); }
    for (let z = Z0; z <= Z1; z += 5.5) { ring(X0 - 2 - rnd() * 6, z + rnd() * 2); ring(X1 + 2 + rnd() * 6, z + rnd() * 2); ring(X0 - 10 - rnd() * 6, z); ring(X1 + 10 + rnd() * 6, z); }
    for (let x = X0; x <= X1; x += 5.5) { if (x > 18 && x < 42) continue; ring(x + rnd() * 2, Z1 + 3 + rnd() * 5); }
    // 도시
    const cols = [0xb9b4aa, 0xd6d0c4, 0x8f97a0, 0xa7a097, 0xc9c2b2, 0x7d8690];
    for (let i = 0; i < 170; i++) {
      const a = rnd() * U.TAU, d = 190 + rnd() * 160;
      const x = (X0 + X1) / 2 + Math.cos(a) * d * 1.05, z = Math.sin(a) * d * 1.15;
      const w = 14 + rnd() * 26, h = 12 + rnd() * (rnd() < 0.2 ? 90 : 40);
      const c = (rnd() * cols.length) | 0;
      B.add(G.box, 'city' + c, mat('city' + c, cols[c]), M4(x, h / 2, z, w, h, 12 + rnd() * 20, rnd() * 3));
    }
    // 스카이트리 — 동쪽 멀리, 안개에 안 묻힌다
    const st = new THREE.MeshStandardMaterial({ color: 0xc8d4e0, roughness: 0.8, fog: false });
    const g = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(6, 30, 360, 3), st); leg.position.y = 180; g.add(leg);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 260, 12), st); shaft.position.y = 480; g.add(shaft);
    [350, 450].forEach((y, i) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(i ? 11 : 16, i ? 11 : 16, i ? 12 : 22, 16), st); d.position.y = y; g.add(d); });
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2, 90, 6), st); ant.position.y = 655; g.add(ant);
    g.position.set(820, -30, -260); g.scale.setScalar(0.62);
    scene.add(g);
  }

  function build(scene) {
    sky(scene);
    ground(scene);
    const B = Batch();
    landmarks(scene, B);
    props(scene, B);
    trees(scene, B);
    outskirts(scene, B);
    pineFlush(scene, PN);
    B.flush(scene);
    petals(scene);
    zoneMarks(scene);
  }

  // ── 매 프레임 ──
  function update(dt, cam, focus) {
    const t = T.time;
    if (P.sun && focus) {
      P.sun.position.set(focus.x + 40, 70, focus.z + 30);
      P.sun.target.position.set(focus.x, 0, focus.z);
    }
    if (P.sky && cam) P.sky.position.copy(cam.position);
    // 물줄기
    if (P.jets) {
      const J = P.jets;
      for (let i = 0; i < J.N; i++) {
        const s = J.seed[i], k = (t * 0.55 + s) % 1;
        const main = i < J.N * 0.4;
        const a = s * 97.0, spread = main ? 0.9 : 5.2;
        const vy = main ? 9.5 : 4.2;
        const T2 = k * (main ? 1.9 : 0.95);
        J.pos[i * 3] = J.x + Math.cos(a) * spread * k * (main ? 1 : 1.1);
        J.pos[i * 3 + 1] = 1.6 + vy * T2 - 4.9 * T2 * T2 * (main ? 1 : 1.3);
        J.pos[i * 3 + 2] = J.z + Math.sin(a) * spread * k;
        if (J.pos[i * 3 + 1] < 0.35) J.pos[i * 3 + 1] = 0.35;
      }
      J.geo.attributes.position.needsUpdate = true;
    }
    // 꽃잎 — 카메라 둘레에서 떨어진다
    if (P.petals && cam) {
      const Q = P.petals;
      for (let i = 0; i < Q.N; i++) {
        let x = Q.pos[i * 3], y = Q.pos[i * 3 + 1], z = Q.pos[i * 3 + 2];
        y -= dt * (0.55 + (i % 5) * 0.08);
        x += Math.sin(t * 1.3 + Q.ph[i]) * dt * 0.6 + dt * 0.35;
        z += Math.cos(t * 1.1 + Q.ph[i]) * dt * 0.4;
        const cx = cam.position.x, cz = cam.position.z;
        if (y < 0.05 || x - cx > 32 || x - cx < -32 || z - cz > 32 || z - cz < -32) {
          x = cx + U.rand(-30, 30); z = cz + U.rand(-30, 30); y = U.rand(6, 13);
        }
        Q.pos[i * 3] = x; Q.pos[i * 3 + 1] = y; Q.pos[i * 3 + 2] = z;
      }
      Q.geo.attributes.position.needsUpdate = true;
    }
    // 자판기 표시 둥실
    if (P.vendIcons) P.vendIcons.forEach((s, i) => { s.position.y = 3.0 + Math.sin(t * 2.2 + i) * 0.15; });
    // 깃발 펄럭
    if (P.zm) for (const id in P.zm) {
      const z = P.zm[id], a = z.flag.geometry.attributes.position, o = z.fg0;
      for (let i = 0; i < a.count; i++) {
        const x = o[i * 3];
        a.array[i * 3 + 2] = Math.sin(t * 5 + x * 2.4 + id.length) * 0.16 * (x / 2.2);
      }
      a.needsUpdate = true;
    }
  }

  const onPath = (x, z) => nearPath(x, z, 0);   // 걸음소리: 흙길·광장인가
  Object.assign(P, { build, update, blocked, groundY, pushOut, move, rescue, inWater, camBlocked, openTape, onPath });
  window.PARK = P;
})();
