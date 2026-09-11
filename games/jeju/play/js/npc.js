// 사람 — 관절이 움직이는 저폴리 인형(셰이더 걷기), 명소 구경꾼·도시 행인·해변 사람. 인스턴스 하나로 수천 명
(function () {
  const I = ISLAND, H = I.H;
  const rng = NOISE.makeRng(777333); const R = () => rng();
  const S = { list: [], mesh: null, n: 0 };
  // 뼈: 0 몸통 1 왼팔 2 오른팔 3 왼아래팔 4 오른아래팔 5 왼허벅지 6 오른허벅지 7 왼정강이 8 오른정강이
  // 부위: 0 피부 1 윗옷 2 바지 3 머리칼 4 신발 5 모자 6 배낭
  function geom() {
    const P = [], Nn = [], U = [], B = [], Pt = [];
    function add(g, m, bone, part) {
      g = g.index ? g.toNonIndexed() : g; g.applyMatrix4(m);
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Nn.push(n.getX(i), n.getY(i), n.getZ(i)); U.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); B.push(bone); Pt.push(part); }
    }
    const T = GEO.T;
    // 몸통(어깨 넓고 허리 좁게), 목, 머리, 머리칼
    add(new THREE.CylinderGeometry(0.19, 0.15, 0.58, 7), T(0, 1.2, 0, 0, 0, 0, 1, 1, 0.7), 0, 1);
    add(new THREE.SphereGeometry(0.19, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), T(0, 1.49, 0, 0, 0, 0, 1, 0.35, 0.7), 0, 1);   // 어깨 둥글게
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 6), T(0, 1.53, 0), 0, 0);
    add(new THREE.SphereGeometry(0.115, 8, 6), T(0, 1.64, 0, 0, 0, 0, 0.95, 1.08, 1), 0, 0);
    add(new THREE.SphereGeometry(0.122, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55), T(0, 1.655, 0.01, -0.15, 0, 0), 0, 3);
    // 모자(챙 + 윗부분), 배낭
    add(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 8), T(0, 1.72, 0), 0, 5);
    add(new THREE.CylinderGeometry(0.11, 0.125, 0.1, 6), T(0, 1.77, 0), 0, 5);
    add(new THREE.BoxGeometry(0.26, 0.34, 0.14), T(0, 1.25, 0.2), 0, 6);
    add(new THREE.BoxGeometry(0.04, 0.3, 0.02), T(-0.09, 1.3, 0.12), 0, 6); add(new THREE.BoxGeometry(0.04, 0.3, 0.02), T(0.09, 1.3, 0.12), 0, 6);
    for (const sd of [-1, 1]) {
      const a = sd < 0 ? 1 : 2, f = sd < 0 ? 3 : 4, th = sd < 0 ? 5 : 6, sh = sd < 0 ? 7 : 8;
      add(new THREE.SphereGeometry(0.06, 5, 3), T(sd * 0.23, 1.46, 0), a, 1);                   // 어깨
      add(new THREE.CylinderGeometry(0.052, 0.046, 0.3, 5), T(sd * 0.235, 1.31, 0), a, 1);      // 윗팔 (소매)
      add(new THREE.SphereGeometry(0.046, 5, 3), T(sd * 0.235, 1.165, 0), f, 0);                // 팔꿈치
      add(new THREE.CylinderGeometry(0.042, 0.038, 0.27, 5), T(sd * 0.235, 1.03, 0), f, 0);     // 아래팔
      add(new THREE.SphereGeometry(0.045, 6, 4), T(sd * 0.235, 0.885, 0, 0, 0, 0, 0.9, 1.1, 0.7), f, 0);   // 손
      add(new THREE.SphereGeometry(0.078, 5, 3), T(sd * 0.1, 0.92, 0), th, 2);                  // 엉덩이
      add(new THREE.CylinderGeometry(0.078, 0.065, 0.42, 5), T(sd * 0.1, 0.72, 0), th, 2);      // 허벅지
      add(new THREE.SphereGeometry(0.064, 5, 3), T(sd * 0.1, 0.5, 0), sh, 2);                   // 무릎
      add(new THREE.CylinderGeometry(0.062, 0.05, 0.4, 5), T(sd * 0.1, 0.3, 0), sh, 2);         // 정강이
      add(new THREE.BoxGeometry(0.11, 0.075, 0.26), T(sd * 0.1, 0.038, -0.04), sh, 4);          // 신발
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setAttribute('aBone', new THREE.Float32BufferAttribute(B, 1)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pt, 1));
    const col = new Float32Array(P.length).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  // 정점 셰이더: 걷기(팔다리 흔들기·무릎·팔꿈치·몸 들썩임), 넘어지기, 모자·배낭 숨기기, 부위별 색
  const VS_HEAD = `
    attribute float aBone; attribute float aPart; attribute vec3 aWalk; attribute vec4 aLook; attribute vec3 aShirt; attribute vec3 aPants; attribute vec3 aSkin; attribute vec3 aHair;
    uniform float uT;
    vec3 rotX(vec3 p, float py, float a) { p.y -= py; float c = cos(a), s = sin(a); p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); p.y += py; return p; }
    vec3 rotXn(vec3 n, float a) { float c = cos(a), s = sin(a); return vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c); }`;
  // position → npcPos, objectNormal 갱신
  const VS_BODY = `
    vec3 npcPos;
    {
      float ph = uT * aWalk.z + aWalk.x; float amp = aWalk.y; float s = sin(ph);
      int b = int(aBone + 0.5); int part = int(aPart + 0.5);
      vec3 p = position; vec3 n = objectNormal;
      if (part == 5 && aLook.x < 0.5) p = vec3(0.0, 1.0, 0.0);
      if (part == 6 && aLook.y < 0.5) p = vec3(0.0, 1.0, 0.0);
      float thigh = 0.0, knee = 0.0, arm = 0.0;
      if (b == 5 || b == 7) { thigh = s * 0.55 * amp; knee = max(0.0, sin(ph + 1.2)) * 0.95 * amp; }
      if (b == 6 || b == 8) { thigh = -s * 0.55 * amp; knee = max(0.0, sin(ph + 1.2 + 3.1416)) * 0.95 * amp; }
      if (b == 1 || b == 3) arm = -s * 0.42 * amp - 0.08;
      if (b == 2 || b == 4) arm = s * 0.42 * amp - 0.08;
      if (b == 7 || b == 8) { p = rotX(p, 0.5, knee); n = rotXn(n, knee); }
      if (b >= 5) { p = rotX(p, 0.93, thigh); n = rotXn(n, thigh); }
      if (b == 3 || b == 4) { p = rotX(p, 1.165, -0.55 - 0.3 * amp); n = rotXn(n, -0.55 - 0.3 * amp); }
      if (b >= 1 && b <= 4) { p = rotX(p, 1.46, arm); n = rotXn(n, arm); }
      p.y += abs(cos(ph)) * 0.035 * amp;
      if (aLook.z > 0.001) { p = rotX(p, 0.05, aLook.z * 1.5); n = rotXn(n, aLook.z * 1.5); }
      npcPos = p; objectNormal = n;
    }`;
  const COLOR = `{ int part = int(aPart + 0.5); vec3 c = aSkin; if (part == 1) c = aShirt; else if (part == 2) c = aPants; else if (part == 3) c = aHair; else if (part == 4) c = vec3(0.12, 0.11, 0.1); else if (part == 5) c = mix(aShirt, vec3(0.95), 0.5); else if (part == 6) c = aPants.zxy * 0.8; vColor.rgb *= c; }`;
  function material() {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uT = { value: 0 }; S.sh = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VS_HEAD)
        .replace('#include <color_vertex>', '#include <color_vertex>\n' + COLOR)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + VS_BODY)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = npcPos;');
    };
    return m;
  }
  function depthMaterial() {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.onBeforeCompile = sh => {
      sh.uniforms.uT = { value: 0 }; S.shD = sh;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VS_HEAD)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 objectNormal = vec3(0.0, 1.0, 0.0);\n' + VS_BODY + '\ntransformed = npcPos;');
    };
    return m;
  }

  const SHIRT = [0xf2f2f2, 0xd9d9d9, 0x1e2a44, 0x2f3a4a, 0x8c2d2d, 0x3b5d8a, 0x6b7a4a, 0x2a2a2a, 0xe0c9a6, 0xb5c7d6, 0x9a3f5a, 0xf4e9d8, 0x4a6b8a, 0x555555];
  const PANTS = [0x2b2d42, 0x3d5a80, 0x1f1f24, 0x8d99ae, 0x5c4033, 0xf1faee, 0x264653, 0x6d6875];
  const SKIN = [0xf1c9a5, 0xe8b591, 0xd9a577, 0xc68642, 0xf5d7bf, 0x8d5524];
  const HAIR = [0x1a1210, 0x2b1b12, 0x4a2e1c, 0x6b4a2a, 0x111111, 0x8a6a4a, 0xc9a86a];
  const cA = new THREE.Color();

  function add(kind, x, z, opts) {
    const a = { kind, x, z, yaw: R() * 6.28, tx: x, tz: z, speed: 1.1 + R() * 0.6, amp: 0, phase: R() * 6.28, freq: 5.5 + R() * 1.5, idle: R() * 3, fall: 0, area: opts.area || null, edge: opts.edge || null, s: opts.s || 0, side: R() < 0.5 ? 1 : -1, hat: R() < 0.35 ? 1 : 0, pack: R() < 0.3 ? 1 : 0,
      shirt: opts.shirt || SHIRT[Math.floor(R() * SHIRT.length)], pants: opts.pants || PANTS[Math.floor(R() * PANTS.length)], skin: SKIN[Math.floor(R() * SKIN.length)], hair: HAIR[Math.floor(R() * HAIR.length)], sc: 0.88 + R() * 0.2 };
    S.list.push(a); return a;
  }
  // 서 있어도 되는 자리인가. 바다·건물 안이 아니고 '도로 위'도 아니어야 한다.
  // (2026-09-10: 관광지 행인이 도로를 가리지 않고 돌아다녀서 차에 치였다. 시내 행인은 원래 인도로 걷는다)
  function landOK(x, z) {
    if (I.coastDist(x, z) <= 4 || PLAYER.insideBox(x, z, 0.6)) return false;
    const n = window.ROADS && ROADS.nearest(x, z);
    return !(n && n.e && n.d < 1.5);
  }
  // 건물·좌판 상자 안에 갇힌 사람을 뺄 자리. 가까운 곳부터 열두 방향으로 훑는다
  function escapeBox(x, z) {
    // 1차: 제대로 설 자리(길에서 떨어진 뭍). 2차: 그마저 없으면 상자 밖이면 어디든 — 건물 안에 파묻힌 것보다는 낫다
    for (let pass = 0; pass < 2; pass++)
      for (let r = 1.2; r <= 18; r += 1.2)
        for (let k = 0; k < 16; k++) {
          const an = (k / 16) * 6.283, nx = x + Math.cos(an) * r, nz = z + Math.sin(an) * r;
          const ok = pass === 0 ? landOK(nx, nz)
            : (I.coastDist(nx, nz) > 4 && !PLAYER.insideBox(nx, nz, 0.6));
          if (ok) return { x: nx, z: nz };
        }
    return null;
  }
  // 인도 보행자는 자리를 직접 못 옮긴다(매 프레임 차선 공식으로 다시 잡힌다) — 건너편 인도로 바꾸거나 앞으로 건너뛴다
  function unstickStreet(a) {
    const e = a.edge; if (!e) return;
    const off = s => s * (e.w / 2 + 1.2 + (a.pack ? 0.6 : 0.2));
    for (const s of [-a.side, a.side]) {
      const o = off(s), x = e.a.x + e.dir.x * a.s + e.right.x * o, z = e.a.z + e.dir.z * a.s + e.right.z * o;
      if (!PLAYER.insideBox(x, z, 0.5)) { a.side = s; return; }
    }
    a.s += 5; if (a.s >= e.len) a.s = 0;   // 양쪽 다 막혔으면 그 자리를 지나쳐 간다
  }
  function pickWander(a) {
    for (let k = 0; k < 12; k++) { const an = R() * 6.28, d = R() * a.area.r; const x = a.area.cx + Math.cos(an) * d, z = a.area.cz + Math.sin(an) * d; if (landOK(x, z)) { a.tx = x; a.tz = z; return; } }
    a.tx = a.x; a.tz = a.z;
  }
  function init(scene) {
    const g = geom();
    // 명소 구경꾼
    for (const s of SPOTS.list) {
      if (s.summit || s.kind === 'ferry' && s.islet) continue;
      const n = s.kind === 'shop' ? 24 : s.beach ? 14 : s.kind === 'food' ? 14 : 5 + Math.floor(R() * 5);
      const area = { cx: s.x, cz: s.z, r: s.beach ? 45 : 26 };
      for (let k = 0; k < n; k++) {
        let x = s.x, z = s.z; for (let q = 0; q < 10; q++) { const an = R() * 6.28, d = R() * area.r; x = s.x + Math.cos(an) * d; z = s.z + Math.sin(an) * d; if (landOK(x, z)) break; }
        if (PLAYER.insideBox(x, z, 0.5)) { const e3 = escapeBox(x, z); if (e3) { x = e3.x; z = e3.z; } }
        const a = add('wander', x, z, { area, shirt: s.beach && R() < 0.5 ? [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xf7fff7][Math.floor(R() * 4)] : undefined, pants: s.beach && R() < 0.5 ? [0x1a535c, 0xff6b6b, 0xf7fff7][Math.floor(R() * 3)] : undefined });
        if (s.beach) a.hat = R() < 0.6 ? 1 : 0;
      }
    }
    // 도시 행인: 마을 격자 인도
    for (const t of ROADS.towns) {
      const edges = ROADS.edges.filter(e => e.a.town === t && e.b.town === t);
      if (!edges.length) continue;
      const n = t.big ? (t.id === 'jejusi' ? 170 : 90) : 8;
      // 처음부터 인도 쪽으로 놓는다. 길 한가운데에 세워두면 첫 프레임에 차도에 서 있다 (2026-09-10)
      for (let k = 0; k < n; k++) {
        const e = edges[Math.floor(R() * edges.length)], s0 = R() * e.len, sd = R() < 0.5 ? 1 : -1;
        const off = sd * (e.w / 2 + 1.4);
        const a = add('street', e.a.x + e.dir.x * s0 + e.right.x * off, e.a.z + e.dir.z * s0 + e.right.z * off, { edge: e, s: s0 });
        a.side = sd; a.tx = a.x;
      }
    }
    S.n = S.list.length;
    const N = S.n;
    const walk = new Float32Array(N * 3), look = new Float32Array(N * 4), shirt = new Float32Array(N * 3), pants = new Float32Array(N * 3), skin = new Float32Array(N * 3), hair = new Float32Array(N * 3);
    S.list.forEach((a, i) => {
      a.i = i;
      walk[i * 3] = a.phase; walk[i * 3 + 1] = 0; walk[i * 3 + 2] = a.freq;
      look[i * 4] = a.hat; look[i * 4 + 1] = a.pack; look[i * 4 + 2] = 0; look[i * 4 + 3] = 0;
      cA.set(a.shirt); shirt.set([cA.r, cA.g, cA.b], i * 3); cA.set(a.pants); pants.set([cA.r, cA.g, cA.b], i * 3); cA.set(a.skin); skin.set([cA.r, cA.g, cA.b], i * 3); cA.set(a.hair); hair.set([cA.r, cA.g, cA.b], i * 3);
    });
    g.setAttribute('aWalk', new THREE.InstancedBufferAttribute(walk, 3)); g.setAttribute('aLook', new THREE.InstancedBufferAttribute(look, 4));
    g.setAttribute('aShirt', new THREE.InstancedBufferAttribute(shirt, 3)); g.setAttribute('aPants', new THREE.InstancedBufferAttribute(pants, 3)); g.setAttribute('aSkin', new THREE.InstancedBufferAttribute(skin, 3)); g.setAttribute('aHair', new THREE.InstancedBufferAttribute(hair, 3));
    S.walk = g.attributes.aWalk; S.look = g.attributes.aLook;
    const m = new THREE.InstancedMesh(g, material(), N); m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; m.customDepthMaterial = depthMaterial();
    S.mesh = m;   // 코드 인형은 화면에 안 넣는다(people.js 의 GLB·그림판이 대신 그린다). 자리 계산에만 쓴다
    S.list.forEach((a, i) => place(a, i));
    m.instanceMatrix.needsUpdate = true;
  }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  // 인형은 얼굴이 +z 쪽이고 이동은 -z 쪽이라 180도 돌려 세운다 (안 그러면 뒤로 걷는다)
  // 코드 인형도 포장면 위에 세운다(땅높이만 보면 인도에서 묻힌다, 2026-09-10)
  const gy = (x, z) => { const t = Math.max(0, H(x, z)); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? t : Math.max(t, r); };
  function place(a, i) { Q.setFromAxisAngle(UP, a.yaw + Math.PI); V.set(a.x, gy(a.x, a.z), a.z); const s = (a.hidden || a.glb) ? 0 : a.sc; /* glb: people.js 의 리깅 모델이 대신 보이는 중 */ Sc.set(s, s, s); M.compose(V, Q, Sc); S.mesh.setMatrixAt(i, M); }

  function update(dt, t, player, camPos) {
    if (!S.mesh) return;
    if (S.sh) S.sh.uniforms.uT.value = t; if (S.shD) S.shD.uniforms.uT.value = t;
    const px = player.x, pz = player.z, pv = Math.abs(player.long), pfx = -Math.sin(player.yaw), pfz = -Math.cos(player.yaw);
    // 걸어다니는 주인공 — 사람들이 먼저 비켜 준다. NPC.update 에 넘기는 player 는 차라 걸을 땐 주인공이 어디 있는지 몰랐고,
    // 인도 보행자(street)는 매 프레임 차선 공식으로 자리를 다시 잡아 밀어도 튀겨 돌아왔다 — 사람 사이에 갇혔다(사장님 2026-09-10)
    const W = (window.PET && PET.onFoot) ? PET.state : null;
    const list = S.list;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const man = camPos ? Math.abs(a.x - camPos.x) + Math.abs(a.z - camPos.z) : 0;
      const far = man > 450, hide = man > 800;
      if (hide !== !!a.hidden) { a.hidden = hide; place(a, i); S.mesh.instanceMatrix.needsUpdate = true; }
      if (far) { a.skip = (a.skip || 0) + 1; if (a.skip % 6 !== 0) continue; }
      const ddt = far ? dt * 6 : dt;
      let changed = false;
      // 차에 치이면 넘어졌다 일어난다
      if (a.fall > 0) { a.fall -= ddt; const k = a.fall > 2.2 ? (2.6 - a.fall) / 0.4 : a.fall > 0.6 ? 1 : a.fall / 0.6; S.look.setW(i, 0); S.look.setZ(i, Math.max(0, Math.min(1, k))); S.look.needsUpdate = true; if (a.fall <= 0) { S.look.setZ(i, 0); S.look.needsUpdate = true; } continue; }
      // 건물·좌판 상자 안에 갇힌 사람 빼내기 — 그냥 두면 허리까지 파묻혀 보인다 (사장님 2026-09-10)
      a.boxT = (a.boxT || 0) - ddt;
      if (!far && a.boxT <= 0) {
        a.boxT = 1.5 + R() * 2;
        if (PLAYER.insideBox(a.x, a.z, 0.5)) {
          if (a.kind === 'street') unstickStreet(a);
          else { const e2 = escapeBox(a.x, a.z); if (e2) { a.x = e2.x; a.z = e2.z; a.idle = 0; pickWander(a); changed = true; } }
        }
      }
      const dxp = px - a.x, dzp = pz - a.z, dp = Math.hypot(dxp, dzp);
      if (player.mode === 'ground' && dp < 1.5 && pv > 1.5) { a.fall = 2.6; a.amp = 0; S.walk.setY(i, 0); S.walk.needsUpdate = true; const kx = -dxp / (dp || 1), kz = -dzp / (dp || 1); a.x += kx * 1.2; a.z += kz * 1.2; a.yaw = Math.atan2(-kx, -kz) + Math.PI; place(a, i); S.mesh.instanceMatrix.needsUpdate = true; if (dp < 1.5 && window.AUDIO) AUDIO.crash(1.5); continue; }
      // 차가 다가오면 비켜선다
      if (player.mode === 'ground' && dp < 7 && pv > 3) { const ahead = dxp * -pfx + dzp * -pfz; if (ahead < 0 && Math.abs(dxp * pfz - dzp * pfx) < 3) { const sx = pfz, sz = -pfx; const sg = (dxp * sx + dzp * sz) > 0 ? -1 : 1; a.x += sx * sg * 3 * ddt; a.z += sz * sg * 3 * ddt; changed = true; } }
      // 주인공이 바짝 붙으면 몸을 빼 준다. 서 있는 사람도 비키고, 어슬렁이던 사람은 다른 데로 가게 목표를 다시 잡는다
      if (W) {
        const wx = a.x - W.x, wz = a.z - W.z, wd = Math.hypot(wx, wz);
        if (wd < 1.35 && (a.kind !== 'street' || a.idle > 0)) {
          const k3 = (1.35 - wd) * 3.0 * ddt / (wd || 1);
          a.x += wx * k3; a.z += wz * k3; changed = true;
          if (a.kind !== 'street' && a.idle > 0 && wd < 1.0) { a.idle = 0; pickWander(a); }
        }
      }
      if (a.idle > 0) { a.idle -= ddt; if (a.amp > 0) { a.amp = Math.max(0, a.amp - 4 * ddt); S.walk.setY(i, a.amp); S.walk.needsUpdate = true; } if (a.idle <= 0) { if (a.kind === 'wander') pickWander(a); } if (changed) { place(a, i); S.mesh.instanceMatrix.needsUpdate = true; } continue; }
      if (a.kind === 'street') {
        const e = a.edge; a.s += a.speed * ddt;
        if (a.s >= e.len) { const outs = e.b.out.filter(o => o.b.town && o.a.town && o.b !== e.a); const ne = outs.length ? outs[Math.floor(R() * outs.length)] : e.b.out.find(o => o.b === e.a) || e; a.edge = ne; a.s = 0; if (R() < 0.25) a.idle = 1 + R() * 3; }
        const ee = a.edge; let off = a.side * (ee.w / 2 + 1.2 + (a.pack ? 0.6 : 0.2));
        // 주인공이 앞에 서 있으면 인도 안에서 옆으로 비켜 간다. 멀어지면 제자리로 돌아온다(a.dg)
        let want = 0;
        if (W) {
          const dxh = W.x - ee.a.x, dzh = W.z - ee.a.z;
          const sH = dxh * ee.dir.x + dzh * ee.dir.z, latH = dxh * ee.right.x + dzh * ee.right.z;
          if (Math.abs(sH - a.s) < 3.4 && Math.abs(latH - off) < 1.2) {
            const outward = a.side, lim = ee.w / 2 + 0.55;   // 찻길로는 내려가지 않는다
            want = outward * 1.25;
            if (Math.abs(latH - (off + want)) < 1.0 && Math.abs(off - outward * 1.25) >= lim) want = -outward * 1.25;
          }
        }
        a.dg = (a.dg || 0); a.dg += (want - a.dg) * Math.min(1, ddt * 5); off += a.dg;
        a.x = ee.a.x + ee.dir.x * a.s + ee.right.x * off; a.z = ee.a.z + ee.dir.z * a.s + ee.right.z * off; a.yaw = Math.atan2(-ee.dir.x, -ee.dir.z);
      } else {
        const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
        if (d < 0.4) { a.idle = 1 + R() * 4; continue; }
        const want = Math.atan2(-dx, -dz); let dy = want - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, 6 * ddt);
        a.x += -Math.sin(a.yaw) * a.speed * ddt; a.z += -Math.cos(a.yaw) * a.speed * ddt;
        if (!landOK(a.x, a.z)) { a.x -= -Math.sin(a.yaw) * a.speed * ddt * 2; a.z -= -Math.cos(a.yaw) * a.speed * ddt * 2; a.idle = 0.5; pickWander(a); }
      }
      if (a.amp < 1) { a.amp = Math.min(1, a.amp + 3 * ddt); S.walk.setY(i, a.amp); S.walk.needsUpdate = true; }
      place(a, i); S.mesh.instanceMatrix.needsUpdate = true;
    }
    if (dt > 0) {
      pushApart(list, camPos, dt);
      for (let i = 0; i < list.length; i++) { const a = list[i]; if (a.moved) { a.moved = false; place(a, i); S.mesh.instanceMatrix.needsUpdate = true; } }
    }
  }
  // ── 서로 통과하지 않게 ──
  // 사람끼리: 4m 격자에 담고 이웃 칸만 본다. 차(플레이어·교통)와도 겹치면 밀려난다. 카메라에서 먼 사람은 건너뛴다(1,300명이라)
  const GC = 4, PR = 0.62, ghash = new Map(), gk = (i, j) => i * 100003 + j;   // PR: 사람 반지름
  function pushApart(list, camPos, dt) {
    ghash.clear();
    const near = [];
    for (const a of list) {
      if (a.hidden || a.fall > 0) continue;
      if (camPos && Math.abs(a.x - camPos.x) + Math.abs(a.z - camPos.z) > 160) continue;   // 멀리는 겹쳐도 안 보인다
      const k = gk(Math.floor(a.x / GC), Math.floor(a.z / GC)); let arr = ghash.get(k); if (!arr) { arr = []; ghash.set(k, arr); } arr.push(a); near.push(a);
    }
    for (const a of near) {
      const i0 = Math.floor(a.x / GC), j0 = Math.floor(a.z / GC);
      for (let i = i0; i <= i0 + 1; i++) for (let j = (i === i0 ? j0 : j0 - 1); j <= j0 + 1; j++) {
        const arr = ghash.get(gk(i, j)); if (!arr) continue;
        for (const b of arr) {
          if (b === a) continue;
          let dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz), rr = PR * 2;
          if (d >= rr) continue;
          if (d < 1e-4) { dx = 0.01; dz = 0; }
          const k2 = (rr - d) / (d || 1) * 0.5, mx = dx * k2, mz = dz * k2;
          a.x -= mx; a.z -= mz; b.x += mx; b.z += mz; a.moved = b.moved = true;
        }
      }
    }
    // 차: 앞뒤로 뻗은 선분으로 보고 가장 가까운 점에서 한 번만 밀어낸다(앞뒤 두 원으로 하면 한가운데서 힘이 상쇄된다)
    const cars = [];
    if (window.PLAYER && PLAYER.mode === 'ground') cars.push({ x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw, len: 4.6 });
    if (window.TRAFFIC && TRAFFIC.cars) for (const c of TRAFFIC.cars) cars.push(c);
    for (const c of cars) {
      const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), half = Math.max(0.6, (c.len || 4.6) / 2 - 1.1), rr = 1.5;
      const i0 = Math.floor(c.x / GC), j0 = Math.floor(c.z / GC), rad = Math.ceil((half + rr) / GC);
      for (let i = i0 - rad; i <= i0 + rad; i++) for (let j = j0 - rad; j <= j0 + rad; j++) {
        const arr = ghash.get(gk(i, j)); if (!arr) continue;
        for (const a of arr) {
          const rx = a.x - c.x, rz = a.z - c.z;
          const t = Math.max(-half, Math.min(half, rx * fx + rz * fz));      // 차 선분 위 가장 가까운 점
          let dx = rx - fx * t, dz = rz - fz * t; const d = Math.hypot(dx, dz);
          if (d >= rr) continue;
          if (d < 1e-4) { dx = -fz; dz = fx; }                                // 정중앙이면 옆으로 뺀다
          const k2 = (rr - (d || 0)) / (d || 1); a.x += dx * k2; a.z += dz * k2; a.moved = true;
        }
      }
    }
  }
  // ── 걸어다니는 주인공과 부딪히기·맞기 ──
  // 격자(ghash)는 pushApart 가 매 프레임 채운다. 주인공은 늘 카메라 곁이라 반드시 격자 안에 있다.
  function forEachNear(x, z, r, fn) {
    const i0 = Math.floor(x / GC), j0 = Math.floor(z / GC), rad = Math.ceil(r / GC);
    for (let i = i0 - rad; i <= i0 + rad; i++) for (let j = j0 - rad; j <= j0 + rad; j++) { const arr = ghash.get(gk(i, j)); if (arr) for (const a of arr) fn(a); }
  }
  // 주인공을 사람 밖으로 밀어낸다(통과 금지). k = 주인공이 밀리는 몫, 나머지는 사람이 비켜난다. 부딪힌 사람을 돌려준다
  function solid(o, r, k) {
    k = k == null ? 0.5 : k; let hit = null;
    forEachNear(o.x, o.z, r + PR + GC, a => {
      if (a.fall > 0) return;
      let dx = o.x - a.x, dz = o.z - a.z; const rr = r + PR, d = Math.hypot(dx, dz);
      if (d >= rr) return;
      if (d < 1e-4) { dx = 0.01; dz = 0; }
      const p = (rr - d) / (d || 1);
      o.x += dx * p * k; o.z += dz * p * k;
      a.x -= dx * p * (1 - k); a.z -= dz * p * (1 - k); a.moved = true; hit = a;
    });
    return hit;
  }
  function replace(a) { const i = S.list.indexOf(a); if (i >= 0 && S.mesh) { place(a, i); S.mesh.instanceMatrix.needsUpdate = true; } }
  window.NPC = Object.assign(S, { init, update, add, replace, solid });
})();
