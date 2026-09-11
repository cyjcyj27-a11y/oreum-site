// 명소 소품 — 명소마다 코드로 만든 랜드마크(폭포·주상절리·등대·대관람차·풍차·시장·초가…)와 이름 팻말, 해변 파라솔, 항구
(function () {
  const I = ISLAND, H = I.H, { mergeGeos, T, inst } = GEO;
  const rng = NOISE.makeRng(8080); const R = () => rng();
  const S = { anim: [], tracks: {}, ferries: {} };
  const DARK = [0.16, 0.16, 0.17], STONE = [0.22, 0.22, 0.23], WHITE = [0.96, 0.96, 0.94], WOOD = [0.55, 0.4, 0.25];
  const box = (w, h, d, x, y, z, c, ry) => ({ g: new THREE.BoxGeometry(w, h, d), m: T(x, y, z, 0, ry || 0, 0), c: c || WHITE });
  const cyl = (r0, r1, h, x, y, z, c, seg, rx, rz) => ({ g: new THREE.CylinderGeometry(r0, r1, h, seg || 10), m: T(x, y, z, rx || 0, 0, rz || 0), c: c || STONE });
  const cone = (r, h, x, y, z, c, seg, ry) => ({ g: new THREE.ConeGeometry(r, h, seg || 8), m: T(x, y, z, 0, ry || 0, 0), c: c || STONE });
  const sph = (r, x, y, z, c, sx, sy, sz) => ({ g: new THREE.SphereGeometry(r, 9, 7), m: T(x, y, z, 0, 0, 0, sx || 1, sy || 1, sz || 1), c: c || STONE });
  // 소품 색을 실사 쪽으로: 채도 낮추고 조금 어둡게
  function muteColors(g) { const c = g.attributes.color; if (!c) return; for (let i = 0; i < c.count; i++) { const r = c.getX(i), gg = c.getY(i), b = c.getZ(i); const l = r * 0.2126 + gg * 0.7152 + b * 0.0722; c.setXYZ(i, (l + (r - l) * 0.72) * 0.86, (l + (gg - l) * 0.72) * 0.86, (l + (b - l) * 0.72) * 0.86); } }
  let scene = null;
  function put(parts, x, z, yaw, opts) {
    const g = mergeGeos(parts); muteColors(g); const m = new THREE.Mesh(g, (opts && opts.mat) || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    let y = (opts && opts.y != null) ? opts.y : H(x, z);
    if (!(opts && opts.y != null)) {   // 비탈: 발자국(기하 바운딩박스) 네 모서리 땅 높이를 재서 가장 높은 곳에 올리고, 낮은 쪽은 기단으로 메운다
      g.computeBoundingBox(); const b = g.boundingBox, cs = Math.cos(yaw || 0), sn = Math.sin(yaw || 0);
      const fw = b.max.x - b.min.x, fd = b.max.z - b.min.z, fh = b.max.y - b.min.y;
      if (fw > 2 && fd > 2) {
        let hi = -1e9, lo = 1e9;
        // 바다에 걸친 모서리는 **바닥이 아니라 물낯까지만** 센다. 안 그러면 공항 활주로처럼 해안선에
        // 걸친 것이 수심 -6m 부터 채워져 24m 짜리 시커먼 벽이 된다 (사장님 2026-09-11 "바다가 시커매졌네")
        for (const [lx, lz] of [[b.min.x, b.min.z], [b.max.x, b.min.z], [b.min.x, b.max.z], [b.max.x, b.max.z], [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2]]) { const gy = Math.max(0, H(x + lx * cs + lz * sn, z - lx * sn + lz * cs)); hi = Math.max(hi, gy); lo = Math.min(lo, gy); }
        if (hi - lo > 0.3) {
          // 납작한 바닥판(활주로·주차장)은 받침이 의미 없다. 받침을 깔면 420m 짜리 활주로가
          // 비탈만큼 통째로 들려 **바다를 가리는 벽**이 된다 (사장님 2026-09-11 "바다가 시커매졌네").
          // 세워진 물건만 받침으로 메우고, 납작한 건 낮은 쪽에 맞춰 그냥 깐다.
          if (fh < 2) y = Math.max(0.2, lo);
          else {
            y = hi; const sk = (hi - lo) + 0.6;
            const base = new THREE.Mesh(new THREE.BoxGeometry(fw + 0.4, sk, fd + 0.4), new THREE.MeshStandardMaterial({ color: 0x6b675f, roughness: 0.95 }));
            base.position.set((b.min.x + b.max.x) / 2, 0.05 - sk / 2, (b.min.z + b.max.z) / 2); base.receiveShadow = true; m.add(base);
          }
        }
      }
    }
    m.position.set(x, y, z); m.rotation.y = yaw || 0; m.castShadow = !(opts && opts.noShadow); m.receiveShadow = true; scene.add(m); return m;
  }
  // 명소가 도로에 걸치면 길 밖으로 밀어낸다. 명소는 실제 좌표에 놓여서 가끔 길과 겹친다
  // (2026-09-10: 제주목관아가 해안도로 폭 전체를 막고 있어 차가 지나갈 수 없었다)
  function offRoad(x, z, pad) {
    const n = window.ROADS && ROADS.nearest(x, z);
    if (!n || !n.e || n.d > pad) return { x, z };
    const e = n.e, ax = e.a.x, az = e.a.z, vx = e.b.x - ax, vz = e.b.z - az, L = vx * vx + vz * vz;
    const t = L > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L)) : 0;
    let dx = x - (ax + vx * t), dz = z - (az + vz * t), d = Math.hypot(dx, dz);
    if (d < 0.01) { dx = e.right.x; dz = e.right.z; d = 1; }
    const k = (pad - n.d + 1) / d;
    return { x: x + dx * k, z: z + dz * k };
  }

  function obstBox(x, z, w, d) { CITY.obst.boxes.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 }); }
  function obstC(x, z, r) { CITY.obst.circles.push({ x, z, r }); }
  function tree(x, z, sc, color) { CITY.trees.push({ x, y: H(x, z), z, sc, dark: true, color }); }
  // 바다 쪽 방향 (해안 거리가 줄어드는 쪽)
  function seaward(x, z) { const e = 6; const dx = I.coastDist(x + e, z) - I.coastDist(x - e, z), dz = I.coastDist(x, z + e) - I.coastDist(x, z - e); const L = Math.hypot(dx, dz) || 1; return { x: -dx / L, z: -dz / L }; }

  // ── 이름 팻말 ──
  function signTex(icon, name) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#2b3a2a'; g.fillRect(0, 0, 512, 160); g.fillStyle = '#f4efe2'; g.fillRect(8, 8, 496, 144);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1d2a1c';
    g.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.fillText(icon, 70, 82);
    g.font = '900 ' + (name.length > 8 ? 44 : 56) + 'px "Ria", "Malgun Gothic", sans-serif'; g.fillText(name, 300, 84);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function signBoard(s, x, z, yaw) {
    const post = put([cyl(0.08, 0.1, 2.4, -1.5, 1.2, 0, WOOD, 6), cyl(0.08, 0.1, 2.4, 1.5, 1.2, 0, WOOD, 6)], x, z, yaw);
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 0.12), [null, null, null, null, new THREE.MeshStandardMaterial({ map: signTex(s.icon, s.name) }), new THREE.MeshStandardMaterial({ color: 0x2b3a2a })].map(m => m || new THREE.MeshStandardMaterial({ color: 0x2b3a2a })));
    b.position.set(0, 2.5, 0); post.add(b);
  }

  const P = {
    airport(s) {
      const x = s.x, z = s.z;
      put([box(90, 10, 26, 0, 5, 0, [0.92, 0.93, 0.95]), box(90.4, 4, 26.4, 0, 6, 0, [0.35, 0.45, 0.55]), box(30, 3, 8, 0, 11.5, 0, [0.85, 0.85, 0.88]), cyl(2.2, 2.6, 22, -50, 11, -6, [0.9, 0.9, 0.9], 12), box(7, 4, 7, -50, 24, -6, [0.35, 0.45, 0.55]), cone(4, 2, -50, 27, -6, [0.9, 0.3, 0.2], 10)], x, z, 0); obstBox(x, z, 92, 28); obstC(x - 50, z - 6, 3);
      // 활주로 (북쪽)
      const rw = put([box(420, 0.3, 42, 0, 0.1, 0, [0.3, 0.3, 0.32]), box(420, 0.32, 1.2, 0, 0.12, 0, [0.9, 0.9, 0.85])], x, z - 60, 0, { noShadow: true });
      for (let k = -180; k < 200; k += 24) { const p = put([box(12, 0.34, 1.2, 0, 0.14, 8, [0.9, 0.9, 0.85]), box(12, 0.34, 1.2, 0, 0.14, -8, [0.9, 0.9, 0.85])], x + k, z - 60, 0, { noShadow: true }); }
      // 비행기 둘
      for (const [px, pz, yaw] of [[x + 60, z - 58, 0.3], [x - 20, z - 60, -0.2]])   // 활주로 쪽 계류장에. 예전 z-30 은 앞 도로 위라 차가 비행기를 뚫고 지나갔다(2026-09-10) { put([cyl(1.6, 1.6, 22, 0, 2.6, 0, WHITE, 12, Math.PI / 2), { g: new THREE.ConeGeometry(1.6, 5, 12), m: T(0, 2.6, -13.4, -Math.PI / 2), c: WHITE }, box(26, 0.5, 4, 0, 2.2, 1, [0.85, 0.85, 0.88]), box(2, 6, 5, 0, 5.5, 9.5, [0.9, 0.35, 0.2]), box(9, 0.4, 2.5, 0, 3.4, 10, [0.85, 0.85, 0.88]), cyl(0.9, 0.9, 3, -6, 1.5, 0.5, [0.3, 0.3, 0.32], 10, Math.PI / 2), cyl(0.9, 0.9, 3, 6, 1.5, 0.5, [0.3, 0.3, 0.32], 10, Math.PI / 2)], px, pz, yaw); obstBox(px, pz, 26, 24); }
      // 렌터카 줄
      for (let k = 0; k < 6; k++) { const m = VEH.staticMesh(['sedan', 'suv', 'open', 'ev', 'sport', 'camper'][k], [0xf2f2f2, 0x2f4f3f, 0x3a7bd5, 0xe8ecef, 0xf2c218, 0xf2efe6][k]); const px = x + 60 + k * 4, pz = z + 26; const M = new THREE.Matrix4().compose(new THREE.Vector3(px, H(px, pz) + 0.06, pz), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); m.setMatrixAt(0, M); m.instanceMatrix.needsUpdate = true; scene.add(m); obstC(px, pz, 1.6); }
      put([box(14, 0.3, 4, 0, 4.5, 0, [0.2, 0.5, 0.9]), box(14, 0.3, 0.3, 0, 4.5, 0, [0.2, 0.5, 0.9]), cyl(0.15, 0.15, 4.5, -6, 2.2, 0, [0.5, 0.5, 0.5], 6), cyl(0.15, 0.15, 4.5, 6, 2.2, 0, [0.5, 0.5, 0.5], 6)], x + 70, z + 22, 0);
    },
    rock(s) { const p = []; for (let k = 0; k < 7; k++) { const a = R() * 6.28, d = R() * 10; p.push(cone(2 + R() * 3, 6 + R() * 8, Math.cos(a) * d, 3, Math.sin(a) * d, [0.14 + R() * 0.05, 0.14, 0.15], 6, R() * 3)); } p.push({ g: new THREE.ConeGeometry(2.5, 11, 6), m: T(0, 7, -6, -0.6, 0, 0), c: [0.15, 0.15, 0.16] }); put(p, s.x, s.z, 0); obstC(s.x, s.z, 9); },
    searock(s) { const sw = seaward(s.x, s.z); const x = s.x + sw.x * 45, z = s.z + sw.z * 45; put([cone(4, 26, 0, 8, 0, [0.16, 0.16, 0.17], 7), cone(2.5, 14, 4, 4, 3, [0.18, 0.18, 0.19], 6)], x, z, 0, { y: -6 }); for (let k = 0; k < 8; k++) { const a = R() * 6.28, d = 12 + R() * 20; put([sph(2 + R() * 2, 0, 0, 0, [0.15, 0.15, 0.16], 1, 0.6, 1)], x + Math.cos(a) * d, z + Math.sin(a) * d, 0, { y: -0.5 }); } },
    columns(s) { const sw = seaward(s.x, s.z); const p = []; for (let i = -7; i <= 7; i++) for (let j = 0; j < 5; j++) { const h = 3 + R() * 7 + (4 - j) * 1.2; p.push(cyl(1.1, 1.1, h, i * 2.0 + (j % 2) * 1.0, h / 2 - 3, j * 1.9, [0.15 + R() * 0.04, 0.15, 0.16], 6)); } put(p, s.x + sw.x * 18, s.z + sw.z * 18, Math.atan2(sw.x, sw.z)); obstBox(s.x + sw.x * 18, s.z + sw.z * 18, 30, 12); },
    fall(s) { const x = s.x, z = s.z; put([box(34, 22, 8, 0, 11, -10, [0.2, 0.22, 0.2]), box(36, 6, 12, 0, 3, -12, [0.18, 0.2, 0.18]), cyl(14, 14, 0.4, 0, 0.1, 6, [0.15, 0.4, 0.5], 24)], x, z, 0); obstBox(x, z - 10, 34, 10);
      const wm = new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.85, roughness: 0.3, map: waterTex() }); const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 20, 1, 8), wm); w.position.set(x, H(x, z) + 11, z - 5.9); scene.add(w); S.anim.push({ t: 'fall', m: w });
      for (let k = 0; k < 6; k++) { const sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: SKY.puffTex, transparent: true, opacity: 0.35, depthWrite: false })); sm.position.set(x + (R() - 0.5) * 10, H(x, z) + 1 + R() * 3, z - 3 + R() * 3); sm.scale.set(6, 4, 1); scene.add(sm); }
      for (let k = 0; k < 14; k++) { const a = R() * 6.28, d = 18 + R() * 12; tree(x + Math.cos(a) * d, z + Math.sin(a) * d, 2.5 + R() * 2); } },
    pool(s) { const x = s.x, z = s.z; put([cyl(9, 9, 0.4, 0, 0.1, 0, [0.15, 0.42, 0.5], 20)], x, z, 0, { noShadow: true }); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; put([sph(1.5 + R(), 0, 0, 0, [0.2, 0.22, 0.2], 1, 0.6, 1)], x + Math.cos(a) * 10, z + Math.sin(a) * 10, 0); } for (let k = 0; k < 10; k++) { const a = R() * 6.28, d = 14 + R() * 10; tree(x + Math.cos(a) * d, z + Math.sin(a) * d, 2.5 + R() * 2); } },
    bridge(s) { put([box(30, 0.5, 2.6, 0, 6, 0, WOOD), box(1.2, 8, 1.2, -15, 4, 0, [0.5, 0.5, 0.52]), box(1.2, 8, 1.2, 15, 4, 0, [0.5, 0.5, 0.52]), box(30, 0.08, 0.08, 0, 7.2, 1.2, [0.8, 0.8, 0.8]), box(30, 0.08, 0.08, 0, 7.2, -1.2, [0.8, 0.8, 0.8])], s.x, s.z, 0.6);
      // 다리 기둥 둘을 충돌 목록에 넣는다. 없을 때는 도로에 걸친 기둥을 차가 그냥 뚫고 지나갔다(2026-09-10)
      // 다리 상판은 6m 높이라 그 아래로는 지나갈 수 있게 그대로 둔다
      { const cs = Math.cos(0.6), sn = Math.sin(0.6);
        for (const lx of [-15, 15]) obstC(s.x + lx * cs, s.z - lx * sn, 0.9); } },
    bigbridge(s) { const sw = seaward(s.x, s.z); const x = s.x + sw.x * 30, z = s.z + sw.z * 30; put([box(70, 1.2, 5, 0, 3, 0, [0.8, 0.8, 0.82]), { g: new THREE.TorusGeometry(26, 1.0, 8, 24, Math.PI), m: T(0, 3, 0, 0, 0, 0), c: WHITE }, cyl(1.5, 2, 6, -30, 0, 0, [0.5, 0.5, 0.52], 8), cyl(1.5, 2, 6, 30, 0, 0, [0.5, 0.5, 0.52], 8)], x, z, Math.atan2(sw.z, -sw.x), { y: 1 });
      { const yw = Math.atan2(sw.z, -sw.x), cs = Math.cos(yw), sn = Math.sin(yw);   // 다리 기둥 둘 (2026-09-10)
        for (const lx of [-30, 30]) obstC(x + lx * cs, z - lx * sn, 2); } for (let k = -3; k <= 3; k++) put([cyl(0.06, 0.06, 20, 0, 12, 0, [0.9, 0.9, 0.9], 4)], x + Math.cos(Math.atan2(sw.z, -sw.x)) * k * 8, z - Math.sin(Math.atan2(sw.z, -sw.x)) * k * 8, 0, { y: 1, noShadow: true }); },
    market(s) { const cols = [[0.9, 0.2, 0.2], [0.2, 0.4, 0.9], [0.95, 0.8, 0.2], [0.2, 0.7, 0.4]]; for (let i = 0; i < 12; i++) { const x = s.x - 22 + (i % 6) * 8, z = s.z + (i < 6 ? -5 : 5);
      { const n = window.ROADS && ROADS.nearest(x, z); if (n && n.e && n.d < 2) continue; }   // 길에 걸친 좌판은 안 놓는다 (2026-09-10)
      put([box(3.2, 1.0, 2.4, 0, 0.9, 0, WOOD), { g: new THREE.BoxGeometry(4, 0.1, 3.2), m: T(0, 2.6, 0, 0.25), c: cols[i % 4] }, cyl(0.05, 0.05, 2.6, -1.8, 1.3, -1.4, [0.6, 0.6, 0.6], 5), cyl(0.05, 0.05, 2.6, 1.8, 1.3, -1.4, [0.6, 0.6, 0.6], 5), box(0.6, 0.4, 0.6, -0.8, 1.6, 0, [0.95, 0.5, 0.1]), box(0.6, 0.4, 0.6, 0.6, 1.6, 0, [0.9, 0.2, 0.2])], x, z, i < 6 ? 0 : Math.PI); obstBox(x, z, 3.4, 2.6); } put([box(30, 0.3, 1.2, 0, 5, 0, [0.85, 0.2, 0.2]), cyl(0.15, 0.15, 5, -15, 2.5, 0, [0.5, 0.5, 0.5], 6), cyl(0.15, 0.15, 5, 15, 2.5, 0, [0.5, 0.5, 0.5], 6)], s.x, s.z - 9, 0); },
    gate(s) { obstC(s.x - 3, s.z, 0.5); obstC(s.x + 3, s.z, 0.5);   // 홍살문 기둥 (2026-09-10)
      put([cyl(0.25, 0.3, 6, -3, 3, 0, [0.7, 0.15, 0.1], 8), cyl(0.25, 0.3, 6, 3, 3, 0, [0.7, 0.15, 0.1], 8), box(7.6, 0.3, 0.3, 0, 5.4, 0, [0.7, 0.15, 0.1]), box(7.6, 0.3, 0.3, 0, 4.6, 0, [0.7, 0.15, 0.1]), box(0.1, 1.0, 0.1, 0, 5.0, 0, [0.7, 0.15, 0.1])], s.x, s.z, 0); for (let k = 0; k < 16; k++) { const a = R() * 6.28, d = 12 + R() * 16; tree(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, 3 + R() * 2); } put([cyl(2.5, 3, 1.2, 0, 0.6, 0, [0.35, 0.45, 0.3], 14)], s.x, s.z - 14, 0); },
    hanok(s) { const o = offRoad(s.x, s.z, 13);
      for (const [dx, dz, w] of [[0, 0, 22], [-16, 12, 12], [16, 12, 12]]) { const x = o.x + dx, z = o.z + dz; put([box(w, 0.8, 10, 0, 0.4, 0, [0.55, 0.52, 0.48]), box(w - 2, 3.2, 8, 0, 2.4, 0, [0.9, 0.85, 0.75]), cone(Math.SQRT2 * (w / 2 + 1.5), 3, 0, 5.4, 0, [0.28, 0.28, 0.3], 4, Math.PI / 4), box(w + 3, 0.4, 13, 0, 4.1, 0, [0.28, 0.28, 0.3])].concat([-1, 1].flatMap(sx => [-1, 0, 1].map(k => cyl(0.2, 0.2, 3.4, sx * (w / 2 - 1.5) * (k === 0 ? 0 : 1) + (k === 0 ? sx * 2 : 0), 2.2, 4.2, [0.6, 0.15, 0.1], 8)))), x, z, 0); obstBox(x, z, w, 10); } },
    thatch(s) { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, d = 14 + (k % 2) * 10; const o0 = offRoad(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, 6), x = o0.x, z = o0.z; put([box(7, 2.4, 5, 0, 1.2, 0, [0.35, 0.33, 0.3]), { g: new THREE.SphereGeometry(4.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m: T(0, 2.4, 0, 0, 0, 0, 1, 0.55, 0.8), c: [0.75, 0.62, 0.38] }, box(1.2, 1.8, 0.2, 0, 0.9, 2.55, [0.4, 0.28, 0.15])], x, z, a + Math.PI / 2); obstBox(x, z, 7, 5); } CITY.fieldWall(s.x - 30, s.z - 30, s.x + 30, s.z + 30, CITY.walls); CITY.harubang.push({ x: s.x - 3, z: s.z + 32, yaw: 0 }, { x: s.x + 3, z: s.z + 32, yaw: 0 }); },
    horselight(s) { const sw = seaward(s.x, s.z); for (const [k, col] of [[-1, [0.9, 0.15, 0.1]], [1, WHITE]]) { const x = s.x + sw.x * 40 + sw.z * k * 30, z = s.z + sw.z * 40 - sw.x * k * 30; put([box(6, 5, 6, 0, 2.5, 0, [0.55, 0.55, 0.57]), box(3, 2.4, 6, 0, 6.4, 0, col), { g: new THREE.BoxGeometry(2, 4, 2), m: T(0, 8.5, -2.5, -0.45), c: col }, box(2.2, 1.4, 3, 0, 10.6, -3.5, col), box(0.8, 3, 0.8, -1, 4.5, -1.8, col), box(0.8, 3, 0.8, 1, 4.5, -1.8, col), box(0.8, 3, 0.8, -1, 4.5, 2, col), box(0.8, 3, 0.8, 1, 4.5, 2, col), sph(0.6, 0, 11.8, -3.5, [1, 0.95, 0.7])], x, z, Math.atan2(sw.x, sw.z), { y: 0.5 }); obstBox(x, z, 6, 6); } },
    lighthouse(s) { const x = s.x, z = s.z; put([cyl(2.0, 2.8, 16, 0, 8, 0, WHITE, 14), cyl(2.3, 2.3, 0.5, 0, 16.2, 0, [0.15, 0.15, 0.15], 14), cyl(1.5, 1.5, 2.4, 0, 17.6, 0, [0.85, 0.9, 0.95], 12), cone(1.9, 1.5, 0, 19.5, 0, [0.85, 0.15, 0.1], 14)], x, z, 0); obstC(x, z, 3); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c0 })); lamp.position.set(x, H(x, z) + 17.6, z); scene.add(lamp); const beam = new THREE.Mesh(new THREE.ConeGeometry(22, 220, 16, 1, true).rotateX(Math.PI / 2).translate(0, 0, 110), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false })); beam.position.copy(lamp.position); scene.add(beam); S.anim.push({ t: 'beam', m: beam, ph: R() * 6 }); },
    museum(s) { const w = 34 + R() * 14, d = 22 + R() * 8; { const o = offRoad(s.x, s.z, Math.max(w, d) / 2 + 4); s.x = o.x; s.z = o.z; } put([box(w, 12, d, 0, 6, 0, [0.85 + R() * 0.1, 0.85, 0.86]), box(w + 0.4, 3, d + 0.4, 0, 5, 0, [0.35, 0.45, 0.55]), box(w * 0.5, 4, 0.6, 0, 9, d / 2 + 0.3, [0.2, 0.25, 0.35])], s.x, s.z, 0); obstBox(s.x, s.z, w, d); const b = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.48, 3.8), new THREE.MeshBasicMaterial({ map: signTex(s.icon, s.name) })); b.position.set(s.x, H(s.x, s.z) + 9, s.z + d / 2 + 0.65); scene.add(b); for (let k = 0; k < 8; k++) tree(s.x + (R() - 0.5) * (w + 20), s.z + d / 2 + 8 + R() * 8, 1.8 + R()); },
    forest(s) { for (let k = 0; k < 90; k++) { const a = R() * 6.28, d = 12 + Math.pow(R(), 0.7) * 70; tree(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, 3.5 + R() * 3, R() < 0.5 ? 0x1f4a1c : 0x2a5f24); } },
    maze(s) { const n = 12, c = 3.2; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = I.hash2(i + 100, j + 200); const x = s.x - n * c / 2 + i * c, z = s.z - n * c / 2 + j * c; if (r < 0.45) { put([box(c, 2.0, 0.7, 0, 1, 0, [0.2, 0.45, 0.18])], x, z, 0, { noShadow: true }); obstBox(x, z, c, 0.7); } else if (r < 0.75) { put([box(0.7, 2.0, c, 0, 1, 0, [0.2, 0.45, 0.18])], x, z, 0, { noShadow: true }); obstBox(x, z, 0.7, c); } } },
    cave(s) { put([sph(16, 0, 0, 0, [0.25, 0.32, 0.2], 1, 0.45, 1), box(5, 4, 3, 0, 1.5, 14, [0.02, 0.02, 0.03]), box(6, 0.4, 3, 0, 4, 14, [0.2, 0.2, 0.2])], s.x, s.z - 10, 0); obstC(s.x, s.z - 10, 15); for (let k = 0; k < 20; k++) { const a = R() * 6.28, d = 20 + R() * 16; tree(s.x + Math.cos(a) * d, s.z - 10 + Math.sin(a) * d, 2.5 + R() * 2); } },
    station(s) { const x = s.x, z = s.z; put([box(24, 1.0, 5, 0, 0.5, -4, [0.6, 0.58, 0.55]), box(24, 0.3, 6, 0, 4.2, -4, [0.75, 0.25, 0.2]), cyl(0.15, 0.15, 4, -10, 2.5, -4, [0.5, 0.5, 0.5], 6), cyl(0.15, 0.15, 4, 10, 2.5, -4, [0.5, 0.5, 0.5], 6), box(60, 0.2, 0.2, 0, 0.1, 0.8, [0.4, 0.4, 0.42]), box(60, 0.2, 0.2, 0, 0.1, -0.8, [0.4, 0.4, 0.42])], x, z, 0); obstBox(x, z - 4, 24, 5);
      const tr = VEH.staticMesh('train', 0xffffff); const M = new THREE.Matrix4().compose(new THREE.Vector3(x - 4, H(x, z) + 0.1, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(1, 1, 1)); tr.setMatrixAt(0, M); tr.instanceMatrix.needsUpdate = true; scene.add(tr); obstBox(x - 4, z, 8, 3); },
    ranch(s) { const x = s.x, z = s.z, w = 70, d = 46; const p = []; for (let k = -w / 2; k <= w / 2; k += 4) { p.push(cyl(0.12, 0.14, 1.4, k, 0.7, -d / 2, WOOD, 5), cyl(0.12, 0.14, 1.4, k, 0.7, d / 2, WOOD, 5)); } for (let k = -d / 2; k <= d / 2; k += 4) { p.push(cyl(0.12, 0.14, 1.4, -w / 2, 0.7, k, WOOD, 5), cyl(0.12, 0.14, 1.4, w / 2, 0.7, k, WOOD, 5)); } p.push(box(w, 0.1, 0.1, 0, 1.2, -d / 2, WOOD), box(w, 0.1, 0.1, 0, 1.2, d / 2, WOOD), box(0.1, 0.1, d, -w / 2, 1.2, 0, WOOD), box(0.1, 0.1, d, w / 2, 1.2, 0, WOOD)); put(p, x, z, 0, { noShadow: true }); for (let k = 0; k < 5; k++) put([cyl(1.0, 1.0, 1.4, 0, 0.7, 0, [0.85, 0.7, 0.35], 10, Math.PI / 2)], x - w / 2 + 5 + k * 3, z - d / 2 + 5, 0); put([box(14, 5, 10, 0, 2.5, 0, [0.6, 0.25, 0.2]), cone(Math.SQRT2 * 8, 3, 0, 6.5, 0, [0.4, 0.2, 0.15], 4, Math.PI / 4)], x + w / 2 + 12, z, 0); obstBox(x + w / 2 + 12, z, 14, 10);
      if (s.veh === 'horse') for (let k = 0; k < 4; k++) { const h = VEH.staticMesh('horse', [0x6b4a2a, 0xffffff, 0x2a2a2a, 0x9a7a5a][k]); const hx = x + (R() - 0.5) * 50, hz = z + (R() - 0.5) * 30; const M = new THREE.Matrix4().compose(new THREE.Vector3(hx, H(hx, hz), hz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6.28), new THREE.Vector3(1, 1, 1)); h.setMatrixAt(0, M); h.instanceMatrix.needsUpdate = true; scene.add(h); } },
    track(s) { const x = s.x, z = s.z; const pts = []; for (let k = 0; k < 40; k++) { const a = k / 40 * 6.28; pts.push([x + Math.cos(a) * 60 + Math.cos(a * 3) * 8, z + Math.sin(a) * 36 + Math.sin(a * 2) * 6]); } S.tracks[s.id] = pts; const Qp = [], Qc = []; for (let k = 0; k < 40; k++) { const a = pts[k], b = pts[(k + 1) % 40]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L * 4.5, nz = dx / L * 4.5; const c = [[a[0] + nx, a[1] + nz], [a[0] - nx, a[1] - nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz]]; const y = c.map(p => H(p[0], p[1]) + 0.1); Qp.push(c[0][0], y[0], c[0][1], c[2][0], y[2], c[2][1], c[1][0], y[1], c[1][1], c[1][0], y[1], c[1][1], c[2][0], y[2], c[2][1], c[3][0], y[3], c[3][1]); for (let q = 0; q < 6; q++) Qc.push(0.2, 0.2, 0.21); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Qp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Qc, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); m.receiveShadow = true; scene.add(m); for (let k = 0; k < 40; k += 2) { const a = pts[k], b = pts[(k + 1) % 40]; const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; const nx = -dz / L * 6, nz = dx / L * 6; put([{ g: new THREE.TorusGeometry(0.5, 0.22, 6, 10), m: T(0, 0.25, 0, Math.PI / 2), c: k % 4 ? [0.9, 0.15, 0.1] : WHITE }, { g: new THREE.TorusGeometry(0.5, 0.22, 6, 10), m: T(0, 0.7, 0, Math.PI / 2), c: WHITE }], a[0] + nx, a[1] + nz, 0, { noShadow: true }); } put([box(12, 3, 6, 0, 1.5, 0, [0.9, 0.9, 0.9]), box(12, 0.3, 6, 0, 3.2, 0, [0.9, 0.2, 0.2])], x, z - 50, 0); obstBox(x, z - 50, 12, 6); },
    cafes(s) { const sw = seaward(s.x, s.z); const yaw = Math.atan2(sw.x, sw.z); const rx = Math.cos(yaw), rz = -Math.sin(yaw); for (let k = -3; k <= 3; k++) { const x = s.x + rx * k * 11, z = s.z + rz * k * 11; put([box(9, 4, 8, 0, 2, 0, [0.96, 0.95, 0.92]), box(7, 2.4, 0.3, 0, 1.9, 4.1, [0.35, 0.5, 0.6]), box(9.4, 0.4, 8.4, 0, 4.2, 0, [[0.9, 0.3, 0.3], [0.3, 0.5, 0.9], [0.95, 0.8, 0.3]][(k + 3) % 3]), box(3, 0.7, 0.2, 0, 3.5, 4.2, [0.15, 0.15, 0.15])], x, z, yaw); obstBox(x, z, 9, 8); for (let u = 0; u < 3; u++) { const px = x + Math.sin(yaw) * -8 + rx * (u - 1) * 2.8, pz = z + Math.cos(yaw) * -8 + rz * (u - 1) * 2.8; put([cyl(0.6, 0.6, 0.08, 0, 0.75, 0, WHITE, 10), cyl(0.05, 0.05, 2.4, 0, 1.2, 0, [0.6, 0.6, 0.6], 5), cone(1.5, 0.5, 0, 2.5, 0, [[0.9, 0.3, 0.3], [0.3, 0.5, 0.9], [0.95, 0.8, 0.3]][u], 10)], px, pz, 0, { noShadow: true }); } } },
    flowers(s) { for (let k = 0; k < 160; k++) { const t = k / 160; const x = s.x - 60 + t * 120 + (R() - 0.5) * 6, z = s.z + Math.sin(t * 5) * 8 + (R() - 0.5) * 4; if (I.coastDist(x, z) < 5) continue; put([sph(0.7 + R() * 0.4, 0, 0.6, 0, [[0.4, 0.5, 0.9], [0.7, 0.4, 0.8], [0.9, 0.5, 0.7]][k % 3])], x, z, 0, { noShadow: true }); } },
    camellia(s) { for (let k = 0; k < 70; k++) { const a = R() * 6.28, d = 8 + Math.pow(R(), 0.6) * 60; const x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d; tree(x, z, 2 + R() * 1.5, 0x1e4a1e); for (let q = 0; q < 6; q++) { const b = R() * 6.28, rr = 1.6 + R(); CITY.oranges.push({ x: x + Math.cos(b) * rr, y: H(x, z) + 2.4 + (R() - 0.5) * 1.8, z: z + Math.sin(b) * rr, red: true }); } } },
    tea(s) { for (let i = -14; i <= 14; i++) { const p = []; for (let j = -12; j <= 12; j += 1) p.push(box(2.2, 0.9, 1.1, i * 3.2, 0.45, j * 1.25, [0.18 + R() * 0.05, 0.42, 0.18])); put(p, s.x, s.z + 40, 0, { noShadow: true }); } put([box(40, 8, 20, 0, 4, 0, [0.9, 0.9, 0.88]), box(40.4, 2.5, 20.4, 0, 3.5, 0, [0.35, 0.45, 0.55]), { g: new THREE.CylinderGeometry(6, 6, 4, 14), m: T(-10, 10, 0), c: [0.3, 0.55, 0.3] }], s.x, s.z - 14, 0); obstBox(s.x, s.z - 14, 40, 20); },
    monument(s) { put([box(6, 1, 6, 0, 0.5, 0, [0.5, 0.5, 0.52]), box(1.4, 5, 1.0, 0, 3.5, 0, [0.3, 0.3, 0.32]), box(1.0, 0.9, 0.1, 0, 4.2, 0.55, [0.9, 0.9, 0.85])], s.x, s.z, 0); obstC(s.x, s.z, 3.5); },
    rocket(s) { put([box(12, 1.5, 12, 0, 0.75, 0, [0.55, 0.55, 0.57]), cyl(1.6, 1.6, 22, 0, 12.5, 0, WHITE, 14), cone(1.6, 5, 0, 26, 0, [0.9, 0.35, 0.15], 14), box(0.3, 5, 3, -1.8, 4, 0, [0.9, 0.35, 0.15]), box(0.3, 5, 3, 1.8, 4, 0, [0.9, 0.35, 0.15]), box(3, 5, 0.3, 0, 4, -1.8, [0.9, 0.35, 0.15]), box(3, 5, 0.3, 0, 4, 1.8, [0.9, 0.35, 0.15])], s.x, s.z - 25, 0); obstC(s.x, s.z - 25, 7); P.museum(s); },
    wheel(s) { const x = s.x, z = s.z, y = H(x, z); put([box(3, 30, 3, -6, 15, 0, [0.6, 0.6, 0.62]), box(3, 30, 3, 6, 15, 0, [0.6, 0.6, 0.62])], x, z, 0); obstBox(x, z, 16, 6); const grp = new THREE.Group(); grp.position.set(x, y + 30, z); const parts = [{ g: new THREE.TorusGeometry(26, 0.6, 8, 40), m: T(0, 0, 0), c: [0.9, 0.9, 0.9] }]; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; parts.push({ g: new THREE.BoxGeometry(0.4, 26, 0.4), m: T(Math.cos(a) * 13, Math.sin(a) * 13, 0, 0, 0, a - Math.PI / 2), c: [0.8, 0.8, 0.8] }); } grp.add(new THREE.Mesh(mergeGeos(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4 }))); const cabs = []; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), new THREE.MeshStandardMaterial({ color: [0xd8352a, 0x2a6ad4, 0xf2c218, 0x2a9a5a][k % 4] })); c.position.set(Math.cos(a) * 26, Math.sin(a) * 26, 0); grp.add(c); cabs.push({ m: c, a }); } scene.add(grp); S.anim.push({ t: 'wheel', m: grp, cabs }); for (let k = 0; k < 6; k++) { const px = x - 40 + k * 16, pz = z + 40; put([box(10, 8 + R() * 6, 10, 0, 5, 0, [[0.9, 0.5, 0.6], [0.5, 0.7, 0.9], [0.95, 0.85, 0.5]][k % 3]), cone(8, 5, 0, 12, 0, [0.9, 0.3, 0.3], 8)], px, pz, 0); obstBox(px, pz, 10, 10); } },
    ark(s) { put([box(40, 12, 12, 0, 6, 0, [0.96, 0.96, 0.94]), cone(6, 12, -26, 6, 0, [0.96, 0.96, 0.94], 4, Math.PI / 4), cone(6, 12, 26, 6, 0, [0.96, 0.96, 0.94], 4, Math.PI / 4), box(40, 4, 12.4, 0, 12.5, 0, [0.4, 0.6, 0.8]), box(4, 6, 4, 0, 16, 0, [0.96, 0.96, 0.94])], s.x, s.z, 0.3); obstBox(s.x, s.z, 44, 16); const pool = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: 0.1, metalness: 0.6 })); pool.rotation.x = -Math.PI / 2; pool.position.set(s.x, H(s.x, s.z) + 0.15, s.z); scene.add(pool); },
    windmill(s) { const sw = seaward(s.x, s.z); for (let k = -2; k <= 2; k++) { const x = s.x + sw.z * k * 60 + sw.x * 20, z = s.z - sw.x * k * 60 + sw.z * 20; const y = H(x, z); put([cyl(1.2, 2.2, 40, 0, 20, 0, WHITE, 12), box(4, 3, 7, 0, 41, 0, WHITE)], x, z, 0); obstC(x, z, 2.5); const hub = new THREE.Group(); hub.position.set(x, y + 41, z - 4); const bl = []; for (let b = 0; b < 3; b++) bl.push({ g: new THREE.BoxGeometry(1.6, 22, 0.4), m: T(Math.sin(b * 2.094) * 11, Math.cos(b * 2.094) * 11, 0, 0, 0, -b * 2.094), c: WHITE }); hub.add(new THREE.Mesh(mergeGeos(bl), new THREE.MeshStandardMaterial({ vertexColors: true }))); scene.add(hub); S.anim.push({ t: 'mill', m: hub, sp: 0.8 + R() * 0.5 }); } },
    port(s) { const sw = seaward(s.x, s.z); const x = s.x + sw.x * 30, z = s.z + sw.z * 30; const yaw = Math.atan2(sw.x, sw.z); const ends = []; for (let k = 0; k < 12; k++) { const px = x + sw.x * k * 8, pz = z + sw.z * k * 8; put([box(8, 2.6, 7, 0, 1.3, 0, [0.6, 0.6, 0.58])], px, pz, yaw, { y: 0 }); obstBox(px, pz, 8, 7); if (k === 11) ends.push([px, pz]); } for (let k = 0; k < 20; k++) { const px = x + sw.x * R() * 90 + sw.z * (R() - 0.5) * 12, pz = z + sw.z * R() * 90 - sw.x * (R() - 0.5) * 12; put([cyl(0.5, 0.8, 1.8, 0, 0.6, 0, [0.5, 0.5, 0.5], 7), cyl(0.5, 0.8, 1.8, 0.6, 0.6, 0.6, [0.5, 0.5, 0.5], 7, 0.9), cyl(0.5, 0.8, 1.8, -0.6, 0.6, 0.4, [0.5, 0.5, 0.5], 7, -0.9)], px, pz, R() * 6, { y: -0.3, noShadow: true }); } put([cyl(1.0, 1.4, 8, 0, 4, 0, [0.9, 0.15, 0.1], 10), cyl(0.8, 0.8, 1.2, 0, 8.6, 0, [0.85, 0.9, 0.95], 10), cone(1.1, 0.8, 0, 9.5, 0, [0.9, 0.15, 0.1], 10)], ends[0][0], ends[0][1], 0, { y: 2.6 }); for (let k = 0; k < 4; k++) { const b = VEH.staticMesh('fishing', 0xffffff); const bx = s.x + sw.x * (25 + k * 12) - sw.z * 14, bz = s.z + sw.z * (25 + k * 12) + sw.x * 14; const M = new THREE.Matrix4().compose(new THREE.Vector3(bx, 0, bz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw + Math.PI / 2), new THREE.Vector3(1, 1, 1)); b.setMatrixAt(0, M); b.instanceMatrix.needsUpdate = true; scene.add(b); } },
    stones(s) { for (let k = 0; k < 30; k++) { const a = R() * 6.28, d = 8 + R() * 40; const x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d; put([box(1 + R() * 1.5, 2 + R() * 4, 1 + R(), 0, 1.8, 0, [0.2 + R() * 0.05, 0.2, 0.21], R() * 3)], x, z, 0); obstC(x, z, 1.2); } for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; put([cyl(1.2, 1.5, 2.6, 0, 1.3, 0, STONE, 8)], s.x + Math.cos(a) * 14, s.z + Math.sin(a) * 14, 0); } },
    dome(s) { const d = new THREE.Mesh(new THREE.SphereGeometry(16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9ad4c8, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.3 })); d.position.set(s.x, H(s.x, s.z), s.z); scene.add(d); obstC(s.x, s.z, 16); for (let k = 0; k < 14; k++) { const a = R() * 6.28; CITY.palms.push({ x: s.x + Math.cos(a) * (20 + R() * 16), z: s.z + Math.sin(a) * (20 + R() * 16) }); } },
    deck(s) { put([box(14, 0.4, 10, 0, 1.2, 0, WOOD), box(14, 0.1, 0.1, 0, 2.3, -5, WOOD), box(0.1, 0.1, 10, -7, 2.3, 0, WOOD), box(0.1, 0.1, 10, 7, 2.3, 0, WOOD)].concat([-6, -3, 0, 3, 6].map(k => cyl(0.08, 0.08, 1.1, k, 1.8, -5, WOOD, 5))), s.x, s.z, 0); obstBox(s.x, s.z, 14, 10); put([box(0.5, 0.9, 1.4, 0, 1.5, 0, [0.5, 0.35, 0.2]), box(0.3, 0.5, 0.3, 0, 2.2, -0.8, [0.5, 0.35, 0.2]), box(0.6, 0.6, 0.1, 0, 2.7, -0.8, [0.5, 0.35, 0.2])].concat([[-0.15, -0.5], [0.15, -0.5], [-0.15, 0.5], [0.15, 0.5]].map(p => box(0.12, 1.1, 0.12, p[0], 0.55, p[1], [0.5, 0.35, 0.2]))), s.x + 10, s.z - 4, 0.5); },
    trail(s) { const p = []; for (let k = 0; k < 14; k++) p.push(box(3, 0.3, 1.2, 0, 0.15 + k * 0.32, -k * 1.1, WOOD)); put(p, s.x, s.z, 0); put([cyl(0.1, 0.12, 2.6, 0, 1.3, 0, WOOD, 6), box(1.6, 0.5, 0.1, 0.5, 2.3, 0, [0.5, 0.3, 0.15])], s.x + 3, s.z + 3, 0); for (let k = 0; k < 30; k++) { const a = R() * 6.28, d = 10 + R() * 30; tree(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, 3 + R() * 2); } },
    street(s) { for (let k = -3; k <= 3; k++) { const x = s.x + k * 10, z = s.z + 8; put([box(8, 6, 7, 0, 3, 0, [[0.95, 0.8, 0.5], [0.6, 0.8, 0.9], [0.9, 0.6, 0.6], [0.7, 0.9, 0.7]][(k + 3) % 4]), box(6, 2, 0.2, 0, 4, 3.6, [0.2, 0.3, 0.6])], x, z, 0); obstBox(x, z, 8, 7); } put([box(60, 0.15, 6, 0, 0.1, 0, [0.85, 0.7, 0.5])], s.x, s.z, 0, { noShadow: true }); },
  };
  function waterTex() { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#cfe9ff'; g.fillRect(0, 0, 64, 256); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.6) + ')'; g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 4, 20 + Math.random() * 40); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
  function beach(s) {
    if (s.beach === 'black') return;
    const sw = seaward(s.x, s.z); const rx = -sw.z, rz = sw.x;
    for (let k = 0; k < 14; k++) { const t = (k - 7) * 9 + (R() - 0.5) * 6; const x = s.x + rx * t + sw.x * (6 + R() * 10), z = s.z + rz * t + sw.z * (6 + R() * 10); if (I.coastDist(x, z) < 4) continue; put([cyl(0.04, 0.04, 2.4, 0, 1.2, 0, [0.7, 0.7, 0.7], 5), cone(1.6, 0.6, 0, 2.5, 0, [[0.9, 0.3, 0.3], [0.3, 0.5, 0.9], [0.95, 0.8, 0.3], [0.9, 0.9, 0.9]][k % 4], 10), box(1.8, 0.05, 0.8, 0.9, 0.05, 0.4, [[0.9, 0.5, 0.5], [0.5, 0.6, 0.9]][k % 2])], x, z, R() * 6, { noShadow: true }); }
    put([box(0.2, 4, 0.2, -1.5, 2, -1.5, WOOD), box(0.2, 4, 0.2, 1.5, 2, -1.5, WOOD), box(0.2, 4, 0.2, -1.5, 2, 1.5, WOOD), box(0.2, 4, 0.2, 1.5, 2, 1.5, WOOD), box(3.6, 0.2, 3.6, 0, 4, 0, WOOD), cone(2.6, 1.2, 0, 5.6, 0, [0.9, 0.3, 0.2], 4, Math.PI / 4), box(3.4, 1.2, 0.1, 0, 4.6, -1.7, [0.9, 0.9, 0.9])], s.x + rx * 30, s.z + rz * 30, 0); obstBox(s.x + rx * 30, s.z + rz * 30, 3.6, 3.6);
  }
  // 길 위에 않히지 않게 — 길은 이미 깔려 있으니 건물을 옆으로 물린다.
  // 박물관처럼 큰 건물이 도시 격자 도로 위에 앉아 길이 건물 밑으로 들어갔다 (사장님 2026-09-11)
  const BIG_PROP = { museum: 34, station: 18, gate: 14, thatch: 20, maze: 24, cave: 18, fall: 22, columns: 18 };
  function shiftOffRoad(s, need) {
    let x = s.x, z = s.z;
    for (let k = 0; k < 8; k++) {
      const n = (window.ROADS && ROADS.nearest) ? ROADS.nearest(x, z) : null;
      if (!n || !n.e || n.d >= need) break;
      const e = n.e, ex = e.b.x - e.a.x, ez = e.b.z - e.a.z, L2 = ex * ex + ez * ez || 1;
      const t = Math.max(0, Math.min(1, ((x - e.a.x) * ex + (z - e.a.z) * ez) / L2));
      const px = e.a.x + ex * t, pz = e.a.z + ez * t;
      let ux = x - px, uz = z - pz, L = Math.hypot(ux, uz);
      if (L < 0.5) { ux = -ez; uz = ex; L = Math.hypot(ux, uz) || 1; }   // 딱 길 위면 길과 직각으로
      ux /= L; uz /= L;
      x += ux * (need - n.d + 2); z += uz * (need - n.d + 2);
    }
    if (H(x, z) < 1 || I.coastDist(x, z) < 6) return;                    // 물로 가면 차라리 그대로 둔다
    s.x = x; s.z = z;
  }
  function init(sc) {
    scene = sc;
    for (const s of SPOTS.list) {
      // 길을 먼저 깔고, 건물은 그 옆에 앚힌다. 큰 건물은 더 멀리 (사장님 2026-09-11)
      if (s.prop) shiftOffRoad(s, BIG_PROP[s.prop] || 12);
      try { if (P[s.prop]) P[s.prop](s); } catch (err) { console.warn('명소 짓기 실패', s.id, s.prop, err.message); }   // 한 곳이 터져도 나머지는 짓는다
      if (s.beach) beach(s);
      // 팻말: 도로 끝 근처, 명소를 바라보게
      const rx = s.roadEnd ? s.roadEnd.x : s.x + 8, rz = s.roadEnd ? s.roadEnd.z : s.z + 8;
      const ax = s.x - rx, az = s.z - rz, L = Math.hypot(ax, az) || 1; const px = rx + ax / L * 12 - az / L * 9, pz = rz + az / L * 12 + ax / L * 9;
      if (I.coastDist(px, pz) > 3) signBoard(s, px, pz, Math.atan2(rx - s.x, rz - s.z));
    }
    // 부속 섬 사이 여객선 (정박)
    for (const s of SPOTS.list) if (s.kind === 'ferry' && !s.islet) { const sw = seaward(s.x, s.z); const f = VEH.staticMesh('ferry', 0xffffff); const fx = s.x + sw.x * 30, fz = s.z + sw.z * 30; const M = new THREE.Matrix4().compose(new THREE.Vector3(fx, 0, fz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-sw.x, -sw.z) + Math.PI / 2), new THREE.Vector3(1, 1, 1)); f.setMatrixAt(0, M); f.instanceMatrix.needsUpdate = true; scene.add(f); S.ferries[s.id] = f; }
  }
  function update(dt, t, sky) {
    for (const a of S.anim) {
      if (a.t === 'wheel') { a.m.rotation.z = t * 0.12; for (const c of a.cabs) c.m.rotation.z = -a.m.rotation.z; }
      else if (a.t === 'mill') a.m.rotation.z = t * a.sp;
      else if (a.t === 'fall') { a.m.material.map.offset.y = -t * 1.6; }
      else if (a.t === 'beam') { a.m.rotation.y = t * 0.9 + a.ph; a.m.material.opacity = 0.12 * sky.night; }
    }
  }
  window.LANDMARKS = Object.assign(S, { init, update, seaward });
})();
