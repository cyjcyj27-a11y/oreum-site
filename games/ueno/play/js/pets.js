// pets.js — 공원 동물: 길 잃은 강아지 12마리를 엄마 개에게 데려다주기 · 비둘기 떼 12무리 모이 주기
// 그림은 전부 코드. 무겁지 않게 부위마다 InstancedMesh 하나로 모든 개·비둘기를 한 번에 그린다
(function () {
  const $ = id => document.getElementById(id);
  const PE = { moms: [], pups: [], flocks: [] };
  const N = 12;
  let scene;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4;
  const _v = new V3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3();

  function load(key) { try { return JSON.parse(localStorage.getItem(key) || 'null') || {}; } catch (e) { return {}; } }
  function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } }

  // ── 모양 만들기 도우미: 여러 도형을 한 덩어리 + 꼭짓점 색으로 굽는다 ──
  // 면 수는 적게: 개 몸통 12×8, 비둘기·작은 부위 8×6, 눈·발 6×4 (처음 18×12 로 했더니 동물만 99만 삼각형)
  const SPH = new THREE.SphereGeometry(1, 12, 8), SPL = new THREE.SphereGeometry(1, 8, 6), SPT = new THREE.SphereGeometry(1, 6, 4);
  const CYL = new THREE.CylinderGeometry(1, 0.72, 1, 7, 1, true), CONE4 = new THREE.ConeGeometry(1, 1, 4);
  function mtx(x, y, z, sx, sy, sz, rx, ry, rz) {
    _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
    return new M4().compose(new V3(x, y, z), _q.clone(), new V3(sx, sy == null ? sx : sy, sz == null ? sx : sz));
  }
  function bake(parts) {
    const gs = parts.map(([g, col, m]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(m); return [q, new THREE.Color(col)]; });
    const n = gs.reduce((a, [q]) => a + q.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const [q, c] of gs) {
      const k = q.attributes.position.count;
      pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3);
      for (let i = 0; i < k; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      o += k;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  }
  const ZERO = new M4().makeScale(0, 0, 0);
  function inst(geo, count, opt) {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.88, metalness: 0 }, opt || {})), count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
    const w = new THREE.Color(1, 1, 1);
    for (let i = 0; i < count; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, w); }
    scene.add(m);
    return m;
  }

  // ── 강아지 ──────────────────────────────────────────
  // 털색 [등, 배·주둥이], 귀(선 귀 / 접힌 귀), 꼬리(말린 / 곧은), 목줄 색
  const DOGS = [
    { coat: 0xc8742e, under: 0xf3e3c8, ear: 0, tail: 0, collar: 0xe53935 },   // 붉은 시바
    { coat: 0x2b2724, under: 0xc99a66, ear: 0, tail: 0, collar: 0xfdd835 },   // 검은 시바
    { coat: 0xf1ede4, under: 0xfbf8f0, ear: 0, tail: 0, collar: 0x1e88e5 },   // 흰 진돗개
    { coat: 0xd9a45a, under: 0xf1d9a8, ear: 1, tail: 1, collar: 0x8e24aa },   // 골든
    { coat: 0x7b5336, under: 0xd6b48e, ear: 1, tail: 1, collar: 0x7cb342 },   // 갈색 믹스
    { coat: 0x7f858e, under: 0xf2f1ee, ear: 0, tail: 1, collar: 0xfb8c00 },   // 회색 허스키
    { coat: 0xe8d2a8, under: 0xf7ecd6, ear: 1, tail: 1, collar: 0xd81b60 },   // 크림
    { coat: 0x4e3325, under: 0x8a6248, ear: 1, tail: 1, collar: 0x00bcd4 },   // 초코
    { coat: 0xb0763c, under: 0xead8b8, ear: 0, tail: 0, collar: 0x3949ab },   // 참깨 시바
    { coat: 0xa7a39c, under: 0xf4f0ea, ear: 1, tail: 0, collar: 0xff5a8a },   // 회백
    { coat: 0x262626, under: 0xf2f0ea, ear: 0, tail: 1, collar: 0xe53935 },   // 흑백
    { coat: 0x9a4a2a, under: 0xe7c9a8, ear: 1, tail: 0, collar: 0x43a047 },   // 적갈
  ];
  // 목줄 색이 겹치지 않게 (위 표에서 두 번 쓴 색은 반다나 무늬로 가른다)
  DOGS[10].collar = 0xffffff; DOGS[11].collar = 0x2e7d32;

  const SHOULDER = [[0.085, 0.36, 0.2], [-0.085, 0.36, 0.2], [0.085, 0.36, -0.21], [-0.085, 0.36, -0.21]];
  const DM = {};
  function buildDogMeshes(count) {
    const W = 0xffffff;
    DM.bodyC = inst(bake([
      [new THREE.CapsuleGeometry(1, 1.9, 4, 12), W, mtx(0, 0.44, -0.01, 0.155, 0.155, 0.155, Math.PI / 2)],
      [SPH, W, mtx(0, 0.445, 0.14, 0.15, 0.165, 0.17)],
      [SPH, W, mtx(0, 0.56, 0.27, 0.092, 0.15, 0.1, 0.5)],
    ]), count);
    DM.bodyL = inst(bake([
      [SPL, W, mtx(0, 0.35, 0.02, 0.11, 0.08, 0.22)],
      [SPL, W, mtx(0, 0.47, 0.265, 0.1, 0.13, 0.075, -0.3)],
    ]), count);
    // 목줄 + 반다나 (멀리서도 색이 보이게 크게)
    DM.collar = inst(bake([
      [new THREE.TorusGeometry(0.094, 0.024, 4, 12), W, mtx(0, 0.575, 0.285, 1, 1, 1, 0.5 - Math.PI / 2)],
      [new THREE.ConeGeometry(1, 1, 3), W, mtx(0, 0.5, 0.36, 0.11, 0.15, 0.03, Math.PI - 0.35)],
    ]), count, { roughness: 0.6 });
    const skull = [SPH, W, mtx(0, 0.06, 0.05, 0.125, 0.115, 0.13)];
    DM.headC = [
      inst(bake([skull, [CONE4, W, mtx(0.075, 0.18, 0.02, 0.055, 0.11, 0.03, 0, 0, -0.28)], [CONE4, W, mtx(-0.075, 0.18, 0.02, 0.055, 0.11, 0.03, 0, 0, 0.28)]]), count),
      inst(bake([skull, [SPL, W, mtx(0.12, 0.0, 0.02, 0.035, 0.1, 0.07, 0, 0, 0.3)], [SPL, W, mtx(-0.12, 0.0, 0.02, 0.035, 0.1, 0.07, 0, 0, -0.3)]]), count),
    ];
    DM.headL = inst(bake([
      [SPL, W, mtx(0, 0.0, 0.15, 0.07, 0.06, 0.1)],
      [SPL, W, mtx(0.06, -0.01, 0.1, 0.06, 0.05, 0.06)],
      [SPL, W, mtx(-0.06, -0.01, 0.1, 0.06, 0.05, 0.06)],
      [SPT, W, mtx(0.045, 0.115, 0.14, 0.02, 0.013, 0.012)],   // 눈썹 점
      [SPT, W, mtx(-0.045, 0.115, 0.14, 0.02, 0.013, 0.012)],
    ]), count);
    DM.dark = inst(bake([
      [SPT, 0x141414, mtx(0, 0.03, 0.245, 0.03, 0.023, 0.02)],
      [SPT, 0x141414, mtx(0.05, 0.075, 0.158, 0.021, 0.025, 0.014)],
      [SPT, 0x141414, mtx(-0.05, 0.075, 0.158, 0.021, 0.025, 0.014)],
      [SPT, 0x5a2a2a, mtx(0, -0.035, 0.2, 0.03, 0.008, 0.03)],   // 입
    ]), count, { roughness: 0.25 });
    DM.tail = [
      inst(bake([[new THREE.TorusGeometry(0.075, 0.032, 5, 9, Math.PI * 1.4), W, mtx(0, 0.085, 0.0, 1, 1, 1, 0, Math.PI / 2, -0.4)]]), count),
      inst(bake([[SPL, W, mtx(0, 0.07, -0.12, 0.045, 0.05, 0.15, 0.55)], [SPL, W, mtx(0, 0.0, -0.03, 0.04, 0.04, 0.06, 0.3)]]), count),
    ];
    DM.leg = inst(bake([
      [SPL, W, mtx(0, -0.03, 0, 0.06, 0.1, 0.075)],
      [CYL, W, mtx(0, -0.2, 0.005, 0.046, 0.27, 0.05)],
    ]), count * 4);
    DM.paw = inst(bake([[SPT, W, mtx(0, -0.33, 0.02, 0.048, 0.032, 0.062)]]), count * 4);
  }

  // 한 마리의 자세를 행렬로
  const _R = new M4(), _B = new M4(), _X = new M4(), _Y = new M4();
  const TT = (x, y, z) => _Y.makeTranslation(x, y, z);
  function drawDog(i, d) {
    const k = DOGS[d.kind], s = d.size, p = d.pose;
    _R.makeRotationY(d.yaw); _R.scale(_s.set(s, s, s)); _R.setPosition(d.x, PARK.groundY(d.x, d.z), d.z);
    // 몸: 뒷다리 쪽을 축으로 들고 내린다
    _B.copy(_R).multiply(TT(0, p.bodyY - (d.pup ? 0.1 : 0), 0)).multiply(TT(0, 0.36, -0.21)).multiply(_X.makeRotationX(-p.pitch)).multiply(TT(0, -0.36, 0.21));
    if (p.roll) _B.multiply(_X.makeRotationZ(p.roll));
    DM.bodyC.setMatrixAt(i, _B); DM.bodyL.setMatrixAt(i, _B); DM.collar.setMatrixAt(i, _B);
    DM.bodyC.setColorAt(i, d.cCoat); DM.bodyL.setColorAt(i, d.cUnder); DM.collar.setColorAt(i, d.cCollar);
    // 머리
    _X.copy(_B).multiply(TT(0, 0.64, 0.33)).multiply(_Y.makeRotationY(p.headYaw)).multiply(_Y.makeRotationX(p.headPitch));
    if (p.headTilt) _X.multiply(_Y.makeRotationZ(p.headTilt));
    const hs = d.pup ? 1.3 : 1; _X.scale(_s.set(hs, hs, hs));
    DM.headC[k.ear].setMatrixAt(i, _X); DM.headC[1 - k.ear].setMatrixAt(i, ZERO);
    DM.headC[k.ear].setColorAt(i, d.cCoat);
    DM.headL.setMatrixAt(i, _X); DM.headL.setColorAt(i, d.cUnder);
    DM.dark.setMatrixAt(i, _X);
    // 꼬리
    _X.copy(_B).multiply(TT(0, 0.5, -0.3)).multiply(_Y.makeRotationY(p.wag));
    if (k.tail === 1) _X.multiply(_Y.makeRotationX(p.tailUp * 0.4 - 0.2));
    DM.tail[k.tail].setMatrixAt(i, _X); DM.tail[1 - k.tail].setMatrixAt(i, ZERO);
    DM.tail[k.tail].setColorAt(i, d.cCoat);
    // 다리
    for (let l = 0; l < 4; l++) {
      const sh = SHOULDER[l];
      _X.copy(_B).multiply(TT(sh[0], sh[1], sh[2])).multiply(_Y.makeRotationX(p.leg[l]));
      if (p.legZ[l]) _X.multiply(_Y.makeRotationZ(p.legZ[l]));
      const thick = l > 1 ? 1.2 : 1, short = d.pup ? 0.72 : 1;
      _X.scale(_s.set(thick, p.legS[l] * short, thick));
      DM.leg.setMatrixAt(i * 4 + l, _X); DM.paw.setMatrixAt(i * 4 + l, _X);
      DM.leg.setColorAt(i * 4 + l, d.cCoat); DM.paw.setColorAt(i * 4 + l, d.cUnder);
    }
  }
  function hideDog(i) {
    for (const m of [DM.bodyC, DM.bodyL, DM.collar, DM.headC[0], DM.headC[1], DM.headL, DM.dark, DM.tail[0], DM.tail[1]]) m.setMatrixAt(i, ZERO);
    for (let l = 0; l < 4; l++) { DM.leg.setMatrixAt(i * 4 + l, ZERO); DM.paw.setMatrixAt(i * 4 + l, ZERO); }
  }
  function newPose() { return { bodyY: 0, pitch: 0, roll: 0, headYaw: 0, headPitch: 0, headTilt: 0, wag: 0, tailUp: 0.6, leg: [0, 0, 0, 0], legZ: [0, 0, 0, 0], legS: [1, 1, 1, 1] }; }

  // 자세: stand / walk / sit / lie / beg(신나서 폴짝)
  function pose(d, dt) {
    const p = d.pose, t = T.time + d.ph;
    const want = d.anim;
    const k = Math.min(1, dt * 8);
    let bodyY = 0, pitch = 0, legs = [0, 0, 0, 0], legZ = [0, 0, 0, 0], legS = [1, 1, 1, 1], hp = 0, tailUp = 0.7;
    if (want === 'walk') {
      const sw = Math.sin(d.walkPh) * Math.min(0.6, 0.25 + d.spd * 0.12);
      legs = [sw, -sw, -sw, sw];
      bodyY = Math.abs(Math.cos(d.walkPh)) * 0.02;
      hp = 0.05;
    } else if (want === 'sit') {
      pitch = 0.42; bodyY = -0.12;
      legs = [0.42, 0.42, -1.05, -1.05]; legS = [1.18, 1.18, 0.62, 0.62]; legZ = [0, 0, -0.45, 0.45];
      hp = -0.3; tailUp = 0.2;
    } else if (want === 'lie') {
      bodyY = -0.22; pitch = 0.02;
      legs = [-1.45, -1.45, -1.3, -1.3]; legZ = [0, 0, -0.5, 0.5]; legS = [0.8, 0.8, 0.6, 0.6];
      hp = -0.05; tailUp = 0;
    } else if (want === 'beg') {
      const hop = Math.max(0, Math.sin(t * 9));
      bodyY = hop * 0.1; pitch = 0.15 + hop * 0.12;
      legs = [-0.5 * hop, -0.4 * hop, 0.1, 0.1];
      hp = -0.25;
    }
    p.bodyY += (bodyY - p.bodyY) * k; p.pitch += (pitch - p.pitch) * k;
    for (let l = 0; l < 4; l++) { p.leg[l] += (legs[l] - p.leg[l]) * (want === 'walk' ? 1 : k); p.legZ[l] += (legZ[l] - p.legZ[l]) * k; p.legS[l] += (legS[l] - p.legS[l]) * k; }
    // 머리: 보고 싶은 쪽으로 (몸과 같은 쪽으로만 돌린다)
    const hy = U.clamp(d.lookYaw || 0, -0.9, 0.9);
    p.headYaw += (hy - p.headYaw) * Math.min(1, dt * 5);
    p.headPitch += ((hp + (d.headDown || 0)) - p.headPitch) * k;
    p.headTilt += ((d.tilt || 0) - p.headTilt) * Math.min(1, dt * 4);
    // 꼬리: 기쁘면 세게 흔든다
    const wagAmp = d.happy > 0 ? 0.6 : want === 'lie' ? 0.08 : 0.2;
    const wagSpd = d.happy > 0 ? 18 : 5;
    p.wag = Math.sin(t * wagSpd) * wagAmp;
    p.tailUp += (tailUp - p.tailUp) * k;
  }

  // ── 비둘기 ──────────────────────────────────────────
  const PM = {};
  const SEED_MAX = 12 * 20;
  function buildPigeonMeshes(count) {
    PM.body = inst(bake([
      [SPL, 0x8a93a1, mtx(0, 0.13, -0.01, 0.072, 0.07, 0.135, 0.15)],
      [SPL, 0x9ea6b2, mtx(0, 0.105, 0.02, 0.062, 0.052, 0.1)],
      [SPL, 0x6f8f86, mtx(0, 0.18, 0.075, 0.046, 0.056, 0.045, -0.45)],   // 목: 은은한 초록 윤기
      [SPT, 0x84758f, mtx(0, 0.165, 0.085, 0.049, 0.036, 0.04, -0.3)],    // 목 아래: 은은한 보라
      [SPT, 0x6a717b, mtx(0, 0.155, -0.15, 0.044, 0.013, 0.085, 0.3)],   // 꼬리 (몸에 붙여 위로)
      [SPT, 0x40454d, mtx(0, 0.176, -0.222, 0.036, 0.009, 0.022, 0.3)],  // 꼬리 끝 띠
      [CYL, 0xc0605a, mtx(0.025, 0.035, 0.0, 0.009, 0.07, 0.009)],
      [CYL, 0xc0605a, mtx(-0.025, 0.035, 0.0, 0.009, 0.07, 0.009)],
      [SPT, 0xb8544e, mtx(0.025, 0.004, 0.02, 0.012, 0.004, 0.03)],
      [SPT, 0xb8544e, mtx(-0.025, 0.004, 0.02, 0.012, 0.004, 0.03)],
    ]), count, { roughness: 0.7 });
    PM.head = inst(bake([
      [SPL, 0x737c8c, mtx(0, 0.02, 0.02, 0.036, 0.034, 0.042)],
      [new THREE.ConeGeometry(1, 1, 4), 0x2e2e30, mtx(0, 0.012, 0.075, 0.008, 0.03, 0.008, Math.PI / 2)],
      [SPT, 0xe8e4dc, mtx(0, 0.024, 0.056, 0.01, 0.007, 0.01)],
      [SPT, 0xe0602a, mtx(0.027, 0.03, 0.035, 0.009, 0.009, 0.009)],
      [SPT, 0xe0602a, mtx(-0.027, 0.03, 0.035, 0.009, 0.009, 0.009)],
    ]), count, { roughness: 0.6 });
    // 날개: 몸에 딱 붙게, 검은 줄은 가로로 가늘게 두 줄 (세로 점이면 눈처럼 보였다)
    const wing = sd => bake([
      [SPL, 0x7f8997, mtx(0, -0.012, -0.08, 0.014, 0.05, 0.118, 0.12, sd * 0.22)],
      [SPT, 0x3a3f47, mtx(sd * 0.006, -0.03, -0.065, 0.009, 0.008, 0.055, 0.12, sd * 0.22)],
      [SPT, 0x3a3f47, mtx(sd * 0.0, -0.045, -0.095, 0.009, 0.008, 0.05, 0.12, sd * 0.22)],
      [SPT, 0x656c77, mtx(-sd * 0.03, -0.01, -0.17, 0.01, 0.028, 0.045, 0.25, sd * 0.3)],
    ]);
    PM.wingL = inst(wing(1), count, { roughness: 0.7 });
    PM.wingR = inst(wing(-1), count, { roughness: 0.7 });
    PM.head.castShadow = PM.wingL.castShadow = PM.wingR.castShadow = false;
    PM.seed = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshStandardMaterial({ color: 0xd9c38c, roughness: 0.9 }), SEED_MAX);
    PM.seed.frustumCulled = false; PM.seed.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < SEED_MAX; i++) PM.seed.setMatrixAt(i, ZERO);
    scene.add(PM.seed);
  }
  function drawPigeon(i, b) {
    _R.makeRotationY(b.yaw); _R.scale(_s.set(b.s, b.s, b.s)); _R.setPosition(b.x, b.y + PARK.groundY(b.x, b.z), b.z);
    _B.copy(_R).multiply(_X.makeRotationX(b.pitch));
    PM.body.setMatrixAt(i, _B); PM.body.setColorAt(i, b.tint);
    _X.copy(_B).multiply(TT(0, 0.215 - b.peck * 0.035, 0.1 + b.bob)).multiply(_Y.makeRotationX(b.peck * 1.05));
    PM.head.setMatrixAt(i, _X); PM.head.setColorAt(i, b.tint);
    _X.copy(_B).multiply(TT(0.052, 0.165, 0.05)).multiply(_Y.makeRotationZ(b.flap));
    PM.wingL.setMatrixAt(i, _X); PM.wingL.setColorAt(i, b.tint);
    _X.copy(_B).multiply(TT(-0.052, 0.165, 0.05)).multiply(_Y.makeRotationZ(-b.flap));
    PM.wingR.setMatrixAt(i, _X); PM.wingR.setColorAt(i, b.tint);
  }

  // ── 자리 고르기 ─────────────────────────────────────
  function spotOK(x, z, r) {
    const C = PARK.C;
    if (PARK.blocked(x, z, r)) return false;
    if (C.circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r)) return false;
    if (C.boxes.some(b => { const dx = x - b.x, dz = z - b.z; return Math.abs(dx * b.c - dz * b.s) < b.hw + r && Math.abs(dx * b.s + dz * b.c) < b.hd + r; })) return false;
    if (DATA.ZONES.some(zn => Math.hypot(zn.x - x, zn.z - z) < zn.r + 4)) return false;
    if (JOY.cats.some(c => Math.hypot(c.x - x, c.z - z) < 6)) return false;
    return true;
  }
  function place() {
    const rnd = U.mulberry(20260914);
    const rx = () => U.lerp(PARK.X0 + 9, PARK.X1 - 9, rnd()), rz = () => U.lerp(PARK.Z0 + 9, PARK.Z1 - 7, rnd());
    const taken = [];
    const far = (x, z, g) => taken.every(p => Math.hypot(p.x - x, p.z - z) >= g);
    // 비둘기: 흙길·광장 위
    for (let pass = 0; pass < 3 && PE.flocks.length < N; pass++) {
      const gap = [26, 18, 12][pass];
      for (let i = 0; i < 8000 && PE.flocks.length < N; i++) {
        const x = rx(), z = rz();
        if (!PARK.onPath(x, z) || !spotOK(x, z, 2.2) || !far(x, z, gap)) continue;
        PE.flocks.push({ x, z }); taken.push({ x, z });
      }
    }
    // 엄마 개: 잔디 위, 서로 멀리
    for (let pass = 0; pass < 3 && PE.moms.length < N; pass++) {
      const gap = [30, 22, 14][pass];
      for (let i = 0; i < 8000 && PE.moms.length < N; i++) {
        const x = rx(), z = rz();
        if (PARK.onPath(x, z) || !spotOK(x, z, 1.2) || !far(x, z, gap) || Math.hypot(PARK.start.x - x, PARK.start.z - z) < 14) continue;
        PE.moms.push({ x, z }); taken.push({ x, z });
      }
    }
    // 새끼: 제 엄마와 35~85m 떨어진 곳
    for (let m = 0; m < PE.moms.length; m++) {
      const mo = PE.moms[m];
      let got = null;
      for (let pass = 0; pass < 3 && !got; pass++) {
        const gap = [16, 10, 6][pass];
        for (let i = 0; i < 6000; i++) {
          const x = rx(), z = rz(), d = Math.hypot(mo.x - x, mo.z - z);
          if (d < 35 || d > 85 || !spotOK(x, z, 1.0) || !far(x, z, gap)) continue;
          got = { x, z }; break;
        }
      }
      if (!got) got = { x: mo.x + 20, z: mo.z };
      PE.pups.push(got); taken.push(got);
    }
  }

  // ── 시작 ────────────────────────────────────────────
  let dogSave = {}, pigSave = {}, followSave = {};
  function init(sc) {
    scene = sc;
    dogSave = load('ueno.dogs'); pigSave = load('ueno.pigeons');
    place();
    buildDogMeshes(PE.moms.length + PE.pups.length);
    const mk = (i, pos, pup) => {
      const k = DOGS[i % DOGS.length];
      return {
        id: i, kind: i % DOGS.length, pup, x: pos.x, z: pos.z, homeX: pos.x, homeZ: pos.z, yaw: Math.random() * U.TAU, size: pup ? 0.56 : 1,
        cCoat: new THREE.Color(k.coat), cUnder: new THREE.Color(k.under), cCollar: new THREE.Color(k.collar),
        pose: newPose(), anim: 'sit', ph: Math.random() * 10, walkPh: 0, spd: 0, happy: 0, lookYaw: 0, t: 0,
      };
    };
    PE.moms = PE.moms.map((p, i) => mk(i, p, false));
    PE.pups = PE.pups.map((p, i) => mk(i, p, true));
    followSave = load('ueno.dogsFollow');
    let fi = 0;
    for (const pu of PE.pups) {
      pu.state = 'lost';
      if (dogSave[pu.id]) home(pu, true);
      else if (followSave[pu.id]) {
        // 간식 먹고 따라오던 강아지는 이어하기 뒤에도 주인공(입구) 곁에서 다시 따라온다 (9/14 사장님 "따라다니던 강아지 3마리 없어짐")
        const st = PARK.start, a = st.yaw + Math.PI + (fi - 1) * 0.5;
        pu.x = st.x + Math.sin(a) * (1.4 + fi * 0.6); pu.z = st.z + Math.cos(a) * (1.4 + fi * 0.6); fi++;
        pu.state = 'follow';
      }
    }
    for (const mo of PE.moms) { mo.state = dogSave[mo.id] ? 'home' : 'wait'; if (mo.state === 'home') mo.anim = 'lie'; }
    // 비둘기
    const rnd = U.mulberry(915);
    let total = 0;
    PE.flocks = PE.flocks.map((f, i) => {
      const n = 5 + (rnd() * 4 | 0), birds = [];
      for (let j = 0; j < n; j++) {
        const a = rnd() * U.TAU, r = 0.4 + rnd() * 1.6;
        const white = rnd() < 0.12, brown = !white && rnd() < 0.1;
        const tint = white ? new THREE.Color(1.5, 1.5, 1.45) : brown ? new THREE.Color(1.15, 0.9, 0.72) : new THREE.Color(0.9 + rnd() * 0.2, 0.9 + rnd() * 0.2, 0.92 + rnd() * 0.2);
        birds.push({ x: f.x + Math.cos(a) * r, y: 0, z: f.z + Math.sin(a) * r, yaw: rnd() * U.TAU, s: 1.2 + rnd() * 0.18, tint,
          st: 'idle', t: rnd() * 2, peck: 0, bob: 0, flap: 0, pitch: 0, vx: 0, vy: 0, vz: 0, tx: 0, tz: 0, walkPh: 0 });
      }
      total += n;
      const fl = { id: i, x: f.x, z: f.z, birds, fed: !!pigSave[i], eatT: 0, seeds: [] };
      if (fl.fed) scatter(fl, fl.x, fl.z);   // 모이 준 무리는 불러와도 모이가 깔려 있고 계속 먹는다
      return fl;
    });
    buildPigeonMeshes(total);
    let bi = 0;
    for (const f of PE.flocks) for (const b of f.birds) { b.i = bi++; drawPigeon(b.i, b); }
    PE.moms.forEach((d, i) => { pose(d, 1); drawDog(i, d); });
    PE.pups.forEach((d, i) => { pose(d, 1); drawDog(PE.moms.length + i, d); });
    flush();
  }
  function flush() {
    for (const m of Object.values(DM).flat()) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    for (const k of ['body', 'head', 'wingL', 'wingR']) { PM[k].instanceMatrix.needsUpdate = true; if (PM[k].instanceColor) PM[k].instanceColor.needsUpdate = true; }
    PM.seed.instanceMatrix.needsUpdate = true;
  }

  // ── 강아지 움직임 ───────────────────────────────────
  const trail = [];   // 주인공 발자취 (새끼들이 줄지어 따라온다)
  function heroTrail() {
    const f = PL.f, last = trail[0];
    if (!last || Math.hypot(last.x - f.pos.x, last.z - f.pos.z) > 0.3) { trail.unshift({ x: f.pos.x, z: f.pos.z }); if (trail.length > 80) trail.pop(); }
  }
  function trailAt(dist) {
    let acc = 0, px = PL.f.pos.x, pz = PL.f.pos.z;
    for (const p of trail) { const d = Math.hypot(p.x - px, p.z - pz); if (acc + d >= dist) { const k = (dist - acc) / (d || 1); return { x: px + (p.x - px) * k, z: pz + (p.z - pz) * k }; } acc += d; px = p.x; pz = p.z; }
    return { x: px, z: pz };
  }
  function walkTo(d, tx, tz, maxSpd, dt) {
    const dx = tx - d.x, dz = tz - d.z, dist = Math.hypot(dx, dz);
    const spd = dist < 0.15 ? 0 : Math.min(maxSpd, dist * 3);
    d.spd += (spd - d.spd) * Math.min(1, dt * 6);
    if (d.spd > 0.05) {
      const p = { x: d.x, z: d.z };
      PARK.move(p, dx / dist * d.spd * dt, dz / dist * d.spd * dt, 0.22 * d.size);
      d.x = p.x; d.z = p.z;
      d.yaw = U.angTo(d.yaw, Math.atan2(dx, dz), dt * 8);
      d.walkPh += dt * (4 + d.spd * 3.2) / d.size;
      d.anim = 'walk';
    }
    return dist;
  }
  function lookAt(d, x, z) { d.lookYaw = U.angDiff(d.yaw, Math.atan2(x - d.x, z - d.z)); }

  function home(pu, instant) {
    const mo = PE.moms[pu.id];
    pu.state = 'home'; pu.anim = 'lie';
    const a = mo.yaw + Math.PI / 2;
    pu.x = mo.x + Math.sin(a) * 0.55; pu.z = mo.z + Math.cos(a) * 0.55; pu.yaw = mo.yaw + 0.4;
    if (instant) { mo.state = 'home'; mo.anim = 'lie'; }
  }
  function reunite(pu) {
    const mo = PE.moms[pu.id];
    pu.state = 'reunite'; pu.t = 0; mo.state = 'reunite'; mo.t = 0;
    dogSave[pu.id] = 1; store('ueno.dogs', dogSave);
    if (followSave[pu.id]) { delete followSave[pu.id]; store('ueno.dogsFollow', followSave); }
    AUD.sfx('bark'); setTimeout(() => AUD.sfx('yip', 0.8), 450);
    // 코인은 주지 않는다 — 간식은 싸움·다른 일로 번 코인으로 산다 (고양이 밥과 같다)
    const n = PE.pups.filter(p => dogSave[p.id]).length;
    FX.praise('🐶 ' + n + '/' + PE.pups.length);
    if (n === PE.pups.length) setTimeout(() => { FX.banner('🐶 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 1400);
    ZONE.missionDone();
  }

  function canPlay() { return T.mode === 'play' && !T.paused; }
  function dogsUpdate(dt) {
    const f = PL.f; heroTrail();
    const busy = !!ZONE.active || !!PL.ride;
    let order = 0;
    for (const pu of PE.pups) {
      const dh = Math.hypot(f.pos.x - pu.x, f.pos.z - pu.z);
      pu.happy = Math.max(0, pu.happy - dt);
      pu.anim = pu.anim === 'walk' ? 'stand' : pu.anim;
      if (pu.state === 'test') continue;
      if (pu.state === 'lost') {
        // 낑낑: 가까이 오면 꼬리 흔들며 반긴다, 닿으면 따라온다
        pu.anim = dh < 5 ? 'beg' : 'sit';
        if (dh < 9) lookAt(pu, f.pos.x, f.pos.z); else pu.lookYaw = Math.sin(T.time * 0.7 + pu.ph) * 0.8;
        if (dh < 9 && canPlay() && (pu.cry = (pu.cry || 0) - dt) <= 0) { pu.cry = 3.5 + Math.random() * 2; AUD.sfx('whine', 0.7); say(pu, '낑낑…', 1.8); }
        if (dh < 5) pu.happy = 1;
        // 간식(🦴)을 주면 먹고 따라온다 — act()
      } else if (pu.state === 'eat') {
        pu.t += dt; pu.anim = 'sit'; pu.headDown = 0.7; pu.lookYaw = 0; pu.happy = 1;
        if ((pu.crunch = (pu.crunch || 0) - dt) <= 0) { pu.crunch = 0.35; AUD.sfx('crunch'); }
        if (pu.t > 2.2) { pu.headDown = 0; pu.state = 'follow'; if (pu.bowl) { clearing.push({ g: pu.bowl, t: -0.6 }); pu.bowl = pu.food = null; } AUD.sfx('yip', 0.9); say(pu, '멍!', 1.2); }
      } else if (pu.state === 'follow') {
        // 싸움·오리배 중이거나 너무 멀어지면 그 자리에 앉아 기다린다
        if (busy || dh > 30) { pu.anim = 'sit'; lookAt(pu, f.pos.x, f.pos.z); continue; }
        const tg = trailAt(1.1 + order * 0.85); order++;
        const dist = walkTo(pu, tg.x, tg.z, dh > 4 ? 7.5 : 5.2, dt);
        if (dist < 0.2) { pu.anim = 'stand'; lookAt(pu, f.pos.x, f.pos.z); } else pu.lookYaw *= 0.9;
        pu.happy = 0.3;
        const mo = PE.moms[pu.id];
        // 새끼나 주인공 중 하나가 엄마 곁(5.5m)에 오면 만난다 — 새끼만 재면 주인공이 엄마 앞에 서도 새끼는 뒤에 있어 안 됐다
        if (Math.min(Math.hypot(mo.x - pu.x, mo.z - pu.z), Math.hypot(mo.x - f.pos.x, mo.z - f.pos.z)) < 5.5) reunite(pu);
      } else if (pu.state === 'reunite') {
        const mo = PE.moms[pu.id];
        pu.t += dt;
        const a = mo.yaw + Math.PI / 2, tx = mo.x + Math.sin(a) * 0.55, tz = mo.z + Math.cos(a) * 0.55;
        const dist = walkTo(pu, tx, tz, 6, dt);
        if (dist < 0.25) { pu.anim = 'beg'; lookAt(pu, mo.x, mo.z); }
        pu.happy = 1;
        if (pu.t > 0.8 && !pu.hearted) { pu.hearted = true; JOY.hearts({ x: mo.x, z: mo.z }); }
        if (pu.t > 3.2) { home(pu); mo.state = 'home'; mo.anim = 'lie'; }
      } else if (pu.state === 'home') {
        pu.anim = 'lie'; pu.lookYaw = Math.sin(T.time * 0.4 + pu.ph) * 0.3;
      }
    }
    for (const mo of PE.moms) {
      mo.happy = Math.max(0, mo.happy - dt);
      const pu = PE.pups[mo.id];
      if (mo.state === 'test') continue;
      if (mo.state === 'wait') {
        const dp = Math.hypot(pu.x - mo.x, pu.z - mo.z);
        // 제 새끼가 따라오는 게 보이면 일어나 짖는다
        if (pu.state === 'follow' && dp < 24) {
          mo.anim = 'stand'; lookAt(mo, pu.x, pu.z); mo.happy = 1;
          if ((mo.barkT = (mo.barkT || 0) - dt) <= 0) { mo.barkT = 2.2 + Math.random(); AUD.sfx('bark', 0.9); say(mo, '멍멍!', 1.4); }
        } else {
          mo.anim = 'sit'; mo.lookYaw = Math.sin(T.time * 0.5 + mo.ph) * 0.9; mo.tilt = Math.sin(T.time * 0.3 + mo.ph) > 0.8 ? 0.3 : 0;
        }
      } else if (mo.state === 'reunite') {
        mo.anim = 'stand'; lookAt(mo, pu.x, pu.z); mo.happy = 1; mo.headDown = 0.35;
      } else { mo.anim = 'lie'; mo.headDown = 0; mo.lookYaw = Math.sin(T.time * 0.3 + mo.ph) * 0.25; }
    }
  }

  // ── 비둘기 움직임 ───────────────────────────────────
  function scare(fl) {
    AUD.sfx('flap');
    for (const b of fl.birds) {
      const a = Math.atan2(b.z - fl.z, b.x - fl.x) + U.rand(-0.6, 0.6), sp = U.rand(2.5, 4.5);
      b.st = 'fly'; b.t = U.rand(2.4, 4.2); b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = U.rand(3.5, 5.5);
      b.yaw = Math.atan2(b.vx, b.vz);
    }
    fl.calmT = 6;
  }
  function pigeonsUpdate(dt) {
    const f = PL.f, cam = T.camera;
    let seedI = 0;
    for (const fl of PE.flocks) {
      const dh = Math.hypot(f.pos.x - fl.x, f.pos.z - fl.z);
      fl.calmT = Math.max(0, (fl.calmT || 0) - dt);
      const fd = cam ? Math.hypot(cam.position.x - fl.x, cam.position.z - fl.z) : 0, near = fd < 80;
      if (fd > 110) { if (!fl.hidden) { fl.hidden = true; for (const b of fl.birds) for (const k of ['body', 'head', 'wingL', 'wingR']) PM[k].setMatrixAt(b.i, ZERO); } continue; }
      fl.hidden = false;
      // 뛰어들거나 주먹질하면 푸드덕
      if (fl.calmT <= 0 && canPlay() && dh < 2.8 && (f.moveSpeed > 4.2 || f.state === 'attack' || f.state === 'dodge')) scare(fl);
      if (fl.eatT > 0) fl.eatT -= dt;   // 처음 5초는 우르르 몰려와 빠르게 먹는다
      for (const b of fl.birds) {
        b.t -= dt;
        if (b.st === 'fly') {
          b.vy -= 3.2 * dt; b.x += b.vx * dt; b.y = Math.max(0, b.y + b.vy * dt); b.z += b.vz * dt;
          b.flap = 0.35 + Math.sin(T.time * 34 + b.i) * 0.85; b.pitch = -0.35; b.peck = 0;
          if (b.t <= 0) { b.st = 'land'; const a = Math.random() * U.TAU, r = 0.3 + Math.random() * 1.8; b.tx = fl.x + Math.cos(a) * r; b.tz = fl.z + Math.sin(a) * r; }
          if (b.y <= 0 && b.vy < 0) { b.vy = 0; b.y = 0.001; }
        } else if (b.st === 'land') {
          const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
          const sp = Math.min(5, d * 1.6 + 0.6);
          b.x += dx / (d || 1) * sp * dt; b.z += dz / (d || 1) * sp * dt;
          b.y += ((d < 1.5 ? 0 : 2.5) - b.y) * Math.min(1, dt * 2.4);
          b.yaw = U.angTo(b.yaw, Math.atan2(dx, dz), dt * 6);
          b.flap = d < 0.6 ? b.flap * 0.8 : 0.3 + Math.sin(T.time * 28 + b.i) * 0.7; b.pitch = d < 1.5 ? 0.25 : -0.2;
          if (d < 0.1 && b.y < 0.05) { b.st = 'idle'; b.y = 0; b.t = Math.random(); b.flap = 0; b.pitch = 0; }
        } else {
          b.flap *= 0.8; b.pitch *= 0.8;
          // 모이가 깔려 있으면 알갱이 하나를 골라 가서 쪼고, 또 다른 알갱이로 (가장 가까운 것만 고르면 한데 뭉쳤다)
          let tx = null, tz = null;
          const eating = (fl.eatT > 0 || fl.fed) && fl.seeds.length;
          if (eating) {
            if (b.st !== 'peck') {
              if (!b.seed || b.seed.fl !== fl) b.seed = fl.seeds[(Math.random() * fl.seeds.length) | 0];
              const d = Math.hypot(b.seed.x - b.x, b.seed.z - b.z);
              if (d < 0.12) { b.st = 'peck'; b.t = 0.5 + Math.random() * 1.0; if (Math.random() < 0.6) b.seed = null; }
              else { tx = b.seed.x; tz = b.seed.z; }
            }
          } else if (b.st === 'idle' && b.t <= 0) {
            const r = Math.random();
            if (r < 0.45) { b.st = 'walk'; const a = Math.random() * U.TAU, rr = Math.random() * 2; b.tx = fl.x + Math.cos(a) * rr; b.tz = fl.z + Math.sin(a) * rr; b.t = 4; }
            else if (r < 0.8) { b.st = 'peck'; b.t = 0.6 + Math.random() * 1.2; }
            else b.t = 0.5 + Math.random() * 1.5;
          }
          if (b.st === 'walk') { tx = b.tx; tz = b.tz; }
          if (tx != null) {
            const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
            const sp = fl.eatT > 0 ? 0.9 : eating ? 0.55 : 0.45;
            if (d > 0.05) { b.x += dx / d * sp * dt; b.z += dz / d * sp * dt; b.yaw = U.angTo(b.yaw, Math.atan2(dx, dz), dt * 7); }
            b.walkPh += dt * 14; b.bob = Math.sin(b.walkPh) * 0.022; b.peck *= 0.8;
            if (b.st === 'walk' && (d < 0.08 || b.t <= 0)) { b.st = 'idle'; b.t = Math.random() * 1.5; }
          } else if (b.st === 'peck') {
            b.peck = Math.max(0, Math.sin(b.t * 16)) * 0.9 + 0.15; b.bob *= 0.8;
            if (b.t <= 0) { b.st = 'idle'; b.t = eating ? Math.random() * 0.3 : Math.random() * 1.2; }
          } else { b.peck *= 0.85; b.bob *= 0.8; }
        }
        if (near || b.st === 'fly' || b.st === 'land') drawPigeon(b.i, b);
      }
      for (const s of fl.seeds) {
        if (seedI >= SEED_MAX || !near) continue;
        _R.makeTranslation(s.x, 0.015 + PARK.groundY(s.x, s.z), s.z); PM.seed.setMatrixAt(seedI++, _R);
      }
    }
    for (let i = seedI; i < SEED_MAX; i++) PM.seed.setMatrixAt(i, ZERO);
  }

  // ── E: 모이 주기 ────────────────────────────────────
  function scatter(fl, cx, cz) {
    fl.seeds = [];
    for (let i = 0; i < 20; i++) { const a = Math.random() * U.TAU, r = Math.sqrt(Math.random()) * 1.2; fl.seeds.push({ fl, x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r }); }
  }
  function nearFlock() {
    const f = PL.f; let best = null, bd = 3.4;
    for (const fl of PE.flocks) { if (fl.fed || fl.eatT > 0) continue; const d = Math.hypot(f.pos.x - fl.x, f.pos.z - fl.z); if (d < bd) { bd = d; best = fl; } }
    return best;
  }
  function canAct() { return canPlay() && !ZONE.active && !PL.ride && PL.f && !PL.f.dead; }
  function nearPup() {
    const f = PL.f; let best = null, bd = 2.0;
    for (const pu of PE.pups) { if (pu.state !== 'lost') continue; const d = Math.hypot(f.pos.x - pu.x, f.pos.z - pu.z); if (d < bd) { bd = d; best = pu; } }
    return best;
  }
  function nearAct() {
    if (!canAct()) return null;
    if (nearPup()) return { icon: '🦴', dim: !(T.bones > 0) };
    if (nearFlock()) return { icon: '🌾', dim: !(T.seeds > 0) };
    return null;
  }
  let bowlGeo = null, foodGeo = null;
  // 다 먹은 그릇은 치운다: 따라나서고 0.6초 뒤 0.4초 동안 작아지며 사라짐 (고양이 그릇은 남기지만 강아지는 따라가니까 치운다 — 9/14 사장님)
  const clearing = [];
  function clearBowls(dt) {
    for (let i = clearing.length - 1; i >= 0; i--) {
      const c = clearing[i]; c.t += dt;
      const k = Math.max(0, 1 - Math.max(0, c.t) / 0.4); c.g.scale.setScalar(k);
      if (k <= 0) { scene.remove(c.g); c.g.traverse(o => { if (o.material) o.material.dispose(); }); clearing.splice(i, 1); }
    }
  }
  function feedPup(pu) {
    if (!(T.bones > 0)) { AUD.sfx('deny'); return; }
    T.bones--; U.save();
    followSave[pu.id] = 1; store('ueno.dogsFollow', followSave);   // 간식을 준 순간부터 "따라오는 강아지"로 저장
    if (!bowlGeo) { bowlGeo = new THREE.CylinderGeometry(0.15, 0.11, 0.07, 12); foodGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12); }
    const f = PL.f, a = Math.atan2(f.pos.x - pu.x, f.pos.z - pu.z);
    pu.yaw = a;
    const bowl = new THREE.Group();
    const b = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0xd8e4ee, roughness: 0.5 })); b.position.y = 0.035; b.castShadow = true;
    const food = new THREE.Mesh(foodGeo, new THREE.MeshStandardMaterial({ color: 0x9a5a34, roughness: 1 })); food.position.y = 0.075;
    bowl.add(b, food); bowl.position.set(pu.x + Math.sin(a) * 0.32, PARK.groundY(pu.x, pu.z), pu.z + Math.cos(a) * 0.32); scene.add(bowl);
    pu.food = food; pu.bowl = bowl; pu.state = 'eat'; pu.t = 0; pu.crunch = 0.3;
    f.yaw = Math.atan2(pu.x - f.pos.x, pu.z - f.pos.z);
    AUD.sfx('can');
  }
  function act() {
    if (!canAct() || PL.f.state !== 'free') return false;
    const pu = nearPup(); if (pu) { feedPup(pu); return true; }
    const fl = nearFlock(); if (!fl) return false;
    if (!(T.seeds > 0)) { AUD.sfx('deny'); return true; }
    T.seeds--; U.save();
    const f = PL.f;
    f.yaw = Math.atan2(fl.x - f.pos.x, fl.z - f.pos.z);
    // 발 앞에 흩뿌린다
    const cx = U.lerp(f.pos.x, fl.x, 0.6), cz = U.lerp(f.pos.z, fl.z, 0.6);
    scatter(fl, cx, cz);
    fl.eatT = 5; fl.calmT = 5.5;
    for (const b of fl.birds) if (b.st === 'walk' || b.st === 'peck') { b.st = 'idle'; b.t = 0; }
    AUD.sfx('seed'); setTimeout(() => AUD.sfx('coo', 0.7), 500);
    // 알림은 뿌리는 순간 바로 (다 먹은 5초 뒤에 띄웠더니 늦다 — 9/14 사장님). 모이는 치우지 않고 계속 쪼아 먹는다
    fl.fed = true; pigSave[fl.id] = 1; store('ueno.pigeons', pigSave);
    JOY.hearts({ x: fl.x, z: fl.z });
    const n = PE.flocks.filter(q => q.fed).length;
    FX.praise('🕊 ' + n + '/' + PE.flocks.length);
    if (n === PE.flocks.length) setTimeout(() => { FX.banner('🕊 ' + n + '/' + n, 2.2); AUD.sfx('clear'); }, 900);
    ZONE.missionDone();
    return true;
  }

  // ── 말풍선 ──────────────────────────────────────────
  const talkers = new Set();
  function say(d, text, dur) { d.bubT = dur; d.bubText = window.L ? L(text) : text; talkers.add(d); }   // 매 프레임 비교하므로 원본에서 영어로
  function bubbles(dt) {
    const cam = T.camera, W = innerWidth, H = innerHeight, layer = $('fxl');
    for (const d of talkers) {
      d.bubT -= dt;
      const on = d.bubT > 0 && canPlay();
      if (!on) { if (d.bub) d.bub.style.display = 'none'; if (d.bubT <= 0) talkers.delete(d); continue; }
      if (!d.bub) { d.bub = document.createElement('div'); d.bub.className = 'bubble'; layer.appendChild(d.bub); }
      if (d.bub.textContent !== d.bubText) d.bub.textContent = d.bubText;
      _v.set(d.x, (d.pup ? 0.75 : 1.1), d.z).project(cam);
      if (_v.z > 1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) { d.bub.style.display = 'none'; continue; }
      d.bub.style.display = ''; d.bub.style.opacity = Math.min(1, d.bubT * 3);
      d.bub.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * W) + 'px,' + ((-_v.y * 0.5 + 0.5) * H) + 'px) translate(-50%,-100%)';
    }
  }

  function update(dt) {
    dogsUpdate(dt);
    const cam = T.camera;
    const all = PE.moms.concat(PE.pups);
    all.forEach((d, i) => {
      const dc = !cam ? 0 : Math.hypot(cam.position.x - d.x, cam.position.z - d.z);
      // 멀리 있는 개는 안 그린다 (안개 속이라 안 보인다)
      if (dc > 110 && d.state !== 'follow') { if (!d.hidden) { hideDog(i); d.hidden = true; } return; }
      d.hidden = false;
      if (dc > 60 && d.drawn && d.state !== 'follow') return;
      pose(d, dt); drawDog(i, d); d.drawn = true;
    });
    pigeonsUpdate(dt);
    clearBowls(dt);
    bubbles(dt);
    flush();
  }

  function countDogs() { return PE.pups.filter(p => dogSave[p.id]).length; }
  function countPigeons() { return PE.flocks.filter(f => f.fed).length; }
  Object.assign(PE, { init, update, nearAct, act, countDogs, countPigeons, scare });
  window.PETS = PE;
})();
