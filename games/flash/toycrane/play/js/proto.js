// TOY CRANE 시험판: 집게 세 발이 진짜 관절(Rapier)로 인형을 쥔다. 힘이 약해서 놓치기도 한다.
// 단위는 미터(실제 치수). 기계 안쪽 폭 0.76m, 깊이 0.66m, 인형 키 약 25cm.
(async function () {
  const T = THREE, RP = RAPIER;
  const $ = (id) => document.getElementById(id);
  await RP.init();

  // ---------- 치수 ----------
  const IN = { x0: -0.38, x1: 0.38, z0: -0.33, z1: 0.33 };   // 기계 안쪽
  const BED = 0.9;                                           // 인형 바닥 높이
  const TOP = 1.66;                                          // 집게 머리가 쉬는 높이
  const HOLE = { x0: -0.38, x1: -0.125, z0: 0.075, z1: 0.33 }; // 앞 왼쪽 경품 구멍(10/14 인형이 2.5cm 줄어든 만큼 23→25.5cm 로 넓힘)
  const HOME = { x: (HOLE.x0 + HOLE.x1) / 2 + 0.01, z: (HOLE.z0 + HOLE.z1) / 2 };

  // ---------- 그림 ----------
  const cv = $('cv');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: /[?&]shot\b/.test(location.search) });
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 0.85;
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  scene.background = new T.Color(0x1a0e26);
  scene.fog = new T.Fog(0x1a0e26, 4, 12);
  const cam = new T.PerspectiveCamera(40, 1, 0.05, 30);
  // 시점: 기계 둘레 세 면(앞·왼쪽·오른쪽)에서 본다. az 는 기계 가운데를 도는 각도(0 = 앞, +90도 = 오른쪽 면)
  const LOOK = new T.Vector3(0, 1.3, 0);
  const CAM = { shake: 0, el: 0.3, elT: 0.3, az: 0, azT: 0, zoom: 0, zoomT: 0, dist: 1.8, look: new T.Vector3().copy(LOOK) };
  function resize() {
    const w = innerWidth, h = innerHeight, asp = w / h;
    R.setSize(w, h, false); cam.aspect = asp;
    cam.fov = asp < 1 ? 58 : 40; cam.updateProjectionMatrix();
    // 기계 전체(높이 1.35m, 폭 0.95m)가 들어오는 거리 + 앞 유리까지 0.35m
    const v = Math.tan((cam.fov * Math.PI) / 360), hz = v * asp;
    CAM.dist = Math.max(0.64 / v, 0.55 / hz) + 0.35;
    CAM.near = Math.max(0.32 / v, 0.24 / hz); // 확대해도 집게와 바로 아래 인형(높이 48cm)이 다 들어오는 거리
  }
  addEventListener('resize', resize); resize();

  scene.add(new T.HemisphereLight(0xffe8f4, 0x2a1838, 0.6));
  // 기계 천장 등: 바로 위에서 아래로 → 집게 그림자가 인형 위에 떨어져 자리를 알려 준다
  const top = new T.SpotLight(0xfff4e8, 9, 3, 0.9, 0.5, 1.2);
  top.position.set(0, 1.95, 0); top.target.position.set(0, BED, 0);
  top.castShadow = true; top.shadow.mapSize.set(1024, 1024); top.shadow.bias = -0.0004; top.shadow.camera.near = 0.2; top.shadow.camera.far = 2;
  scene.add(top, top.target);
  const fill = new T.PointLight(0xff7ac8, 2.5, 3); fill.position.set(0, 1.3, 1.0); scene.add(fill);
  for (const sx of [-1, 1]) { const f = new T.PointLight(0xffc8e8, 2.2, 3); f.position.set(sx * 1.0, 1.4, 0.2); scene.add(f); } // 옆 면에서 볼 때도 밝게

  const PL = window.PL;
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5 }, o || {})); }
  function box(w, h, d, m, x, y, z, sh) { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = !!sh; b.receiveShadow = true; scene.add(b); return b; }

  (function machine() {
    const pink = mat(0xff6ab0, { roughness: 0.35 }), deep = mat(0x8a1e5a, { roughness: 0.4 }), chrome = mat(0xe8e8f0, { metalness: 0.9, roughness: 0.2 });
    const W = IN.x1 - IN.x0, D = IN.z1 - IN.z0;
    // 아래 받침
    box(W + 0.12, BED, D + 0.12, pink, 0, BED / 2, 0);
    box(W + 0.14, 0.04, D + 0.14, deep, 0, BED - 0.02, 0);
    // 인형 바닥: 보송한 천
    const c = PL.canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#7a3aa8'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,200,255' : '40,10,70') + ',0.08)'; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    const floor = new T.Mesh(new T.PlaneGeometry(W, D), mat(0xffffff, { map: PL.tex(c, 2, 2), roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, BED + 0.001, 0); floor.receiveShadow = true; scene.add(floor);
    // 구멍(어두운 속) + 투명 칸막이
    const hw = HOLE.x1 - HOLE.x0, hd = HOLE.z1 - HOLE.z0;
    const hole = new T.Mesh(new T.PlaneGeometry(hw, hd), new T.MeshBasicMaterial({ color: 0x050208 }));
    hole.rotation.x = -Math.PI / 2; hole.position.set((HOLE.x0 + HOLE.x1) / 2, BED + 0.003, (HOLE.z0 + HOLE.z1) / 2); scene.add(hole);
    const acr = new T.MeshStandardMaterial({ color: 0xc8f0ff, transparent: true, opacity: 0.42, roughness: 0.05, metalness: 0.1, depthWrite: false });
    box(0.006, 0.12, hd, acr, HOLE.x1, BED + 0.06, (HOLE.z0 + HOLE.z1) / 2);
    box(hw, 0.12, 0.006, acr, (HOLE.x0 + HOLE.x1) / 2, BED + 0.06, HOLE.z0);
    // 칸막이 테두리: 밝은 선으로 둘러 칸막이가 있는 게 보이게(안 보이면 걸친 인형이 떠 있는 것처럼 보였다)
    const rim = new T.MeshStandardMaterial({ color: 0xe8fbff, emissive: 0x9fe8ff, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.3 });
    box(0.012, 0.01, hd + 0.006, rim, HOLE.x1, BED + 0.12, (HOLE.z0 + HOLE.z1) / 2);
    box(hw + 0.006, 0.01, 0.012, rim, (HOLE.x0 + HOLE.x1) / 2, BED + 0.12, HOLE.z0);
    for (const [px, pz] of [[HOLE.x1, HOLE.z0], [HOLE.x1, HOLE.z1 - 0.004], [HOLE.x0 + 0.004, HOLE.z0]]) box(0.012, 0.12, 0.012, rim, px, BED + 0.06, pz);
    // 뒤 벽: 별무늬 거울판
    const b = PL.canvas(256, 256), y = b.getContext('2d');
    const g = y.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3a1a6a'); g.addColorStop(1, '#ff7ac8'); y.fillStyle = g; y.fillRect(0, 0, 256, 256);
    y.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 40; i++) { y.beginPath(); y.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, 7); y.fill(); }
    box(W, 0.9, 0.01, mat(0xffffff, { map: PL.tex(b), roughness: 0.25, metalness: 0.3 }), 0, BED + 0.45, IN.z0 - 0.005);
    // 기둥 넷 + 지붕 간판
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 1.15, 0.04, chrome, sx * (W / 2 + 0.02), BED + 0.575, sz * (D / 2 + 0.02), true);
    box(W + 0.14, 0.26, D + 0.14, pink, 0, BED + 1.15 + 0.13, 0);
    const s = PL.canvas(512, 128), z = s.getContext('2d');
    z.fillStyle = '#2a0a3a'; z.fillRect(0, 0, 512, 128);
    z.font = '900 78px sans-serif'; z.textAlign = 'center'; z.textBaseline = 'middle';
    z.shadowColor = '#ff4aa8'; z.shadowBlur = 24; z.fillStyle = '#fff36a'; z.fillText('TOY CRANE', 256, 68);
    const sign = new T.Mesh(new T.PlaneGeometry(W, W / 4), new T.MeshBasicMaterial({ map: PL.tex(s) }));
    sign.position.set(0, BED + 1.28, D / 2 + 0.071); scene.add(sign);
    // 유리: 앞·옆(얇게 반사만)
    const glass = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.02, metalness: 0.6, depthWrite: false });
    box(W, 1.15, 0.004, glass, 0, BED + 0.575, IN.z1);
    for (const sx of [-1, 1]) box(0.004, 1.15, D, glass, sx * IN.x1, BED + 0.575, 0);
    // 천장 레일
    for (const sz of [-1, 1]) box(W, 0.02, 0.02, chrome, 0, TOP + 0.12, sz * (D / 2 - 0.02));
    // 바닥 방
    box(6, 0.02, 6, mat(0x2a1a34, { roughness: 0.9 }), 0, -0.01, 0);
  })();

  // ============================================================
  //  물리
  // ============================================================
  const DT = 1 / 120;
  const world = new RP.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = DT;
  const C = RP.ColliderDesc;
  const G_ALL = (0x0001 << 16) | 0xffff, G_CLAW = (0x0002 << 16) | 0x0001, G_RAY = (0x0001 << 16) | 0x0001;
  const stat = (d) => world.createCollider(d.setCollisionGroups(G_ALL).setFriction(0.8));
  // 인형 바닥(구멍만 비움) · 벽 · 구멍 칸막이 · 구멍 아래 받이
  const FT = 0.05;
  stat(C.cuboid((IN.x1 - HOLE.x1) / 2, FT, (IN.z1 - IN.z0) / 2).setTranslation((IN.x1 + HOLE.x1) / 2, BED - FT, 0));
  stat(C.cuboid((HOLE.x1 - IN.x0) / 2, FT, (HOLE.z0 - IN.z0) / 2).setTranslation((HOLE.x1 + IN.x0) / 2, BED - FT, (HOLE.z0 + IN.z0) / 2));
  stat(C.cuboid(0.02, 1, 0.5).setTranslation(IN.x0 - 0.02, BED + 1, 0));
  stat(C.cuboid(0.02, 1, 0.5).setTranslation(IN.x1 + 0.02, BED + 1, 0));
  stat(C.cuboid(0.5, 1, 0.02).setTranslation(0, BED + 1, IN.z0 - 0.02));
  stat(C.cuboid(0.5, 1, 0.02).setTranslation(0, BED + 1, IN.z1 + 0.02));
  stat(C.cuboid(0.003, 0.06, (HOLE.z1 - HOLE.z0) / 2).setTranslation(HOLE.x1, BED + 0.06, (HOLE.z0 + HOLE.z1) / 2));
  stat(C.cuboid((HOLE.x1 - HOLE.x0) / 2, 0.06, 0.003).setTranslation((HOLE.x0 + HOLE.x1) / 2, BED + 0.06, HOLE.z0));
  stat(C.cuboid(1, 0.05, 1).setTranslation(0, 0.3, 0));

  // ---------- 집게 ----------
  // 머리(키네마틱)가 레일을 따라 움직이고, 발 셋은 경첩 관절 + 힘 제한 모터로 오므린다.
  const head = world.createRigidBody(RP.RigidBodyDesc.kinematicPositionBased().setTranslation(HOME.x, TOP, HOME.z));
  world.createCollider(C.cylinder(0.03, 0.045).setCollisionGroups(G_CLAW), head);
  const HINGE_R = 0.032, HINGE_Y = -0.035;
  // 발 모양(머리 기준, 바깥쪽이 +r): 위팔은 바깥 아래로, 끝은 안으로 굽는다
  const ARM = [[0, 0], [0.045, -0.1], [0.03, -0.145], [0.006, -0.165]];
  const prongs = [];
  const steel = mat(0xd8d8e4, { metalness: 0.85, roughness: 0.25 });
  const _y = new T.Vector3(0, 1, 0);
  for (let i = 0; i < 3; i++) {
    const th = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const r = new T.Vector3(Math.cos(th), 0, Math.sin(th)), t = new T.Vector3(-Math.sin(th), 0, Math.cos(th));
    const hp = new T.Vector3(HOME.x + r.x * HINGE_R, TOP + HINGE_Y, HOME.z + r.z * HINGE_R);
    const body = world.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(hp.x, hp.y, hp.z).setCanSleep(false).setAngularDamping(0.15).setLinearDamping(0.1).setCcdEnabled(true)); // 허벌허벌: 감쇠를 거의 없애 흔들리게
    const grp = new T.Group(); scene.add(grp);
    for (let k = 0; k < ARM.length - 1; k++) {
      const a = r.clone().multiplyScalar(ARM[k][0]).setY(ARM[k][1]), b = r.clone().multiplyScalar(ARM[k + 1][0]).setY(ARM[k + 1][1]);
      const mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length();
      const q = new T.Quaternion().setFromUnitVectors(_y, dir.normalize());
      world.createCollider(C.capsule(len / 2, 0.007).setTranslation(mid.x, mid.y, mid.z).setRotation(q).setDensity(2500).setFriction(0.3).setFrictionCombineRule(RP.CoefficientCombineRule.Min).setCollisionGroups(G_CLAW), body);
      const m = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, len + 0.008, 8), steel);
      m.position.copy(mid); m.quaternion.copy(q); m.castShadow = true; grp.add(m);
    }
    const tip = new T.Mesh(new T.SphereGeometry(0.009, 10, 8), steel); tip.position.copy(r.clone().multiplyScalar(ARM[3][0]).setY(ARM[3][1])); grp.add(tip);
    const jd = RP.JointData.revolute({ x: r.x * HINGE_R, y: HINGE_Y, z: r.z * HINGE_R }, { x: 0, y: 0, z: 0 }, { x: t.x, y: 0, z: t.z });
    const j = world.createImpulseJoint(jd, head, body, true);
    j.setLimits(-0.4, 0.75);
    j.configureMotorModel(RP.MotorModel.ForceBased);
    prongs.push({ body, grp, joint: j });
  }
  const headMesh = new T.Group(); scene.add(headMesh);
  { const h = new T.Mesh(new T.CylinderGeometry(0.045, 0.05, 0.06, 20), mat(0xffd84a, { metalness: 0.5, roughness: 0.3 })); h.castShadow = true; headMesh.add(h);
    const cap = new T.Mesh(new T.SphereGeometry(0.045, 20, 10, 0, 6.3, 0, 1.6), mat(0xff4a8a, { roughness: 0.3 })); cap.position.y = 0.03; headMesh.add(cap); }
  const cable = new T.Mesh(new T.CylinderGeometry(0.002, 0.002, 1, 6), mat(0x222222)); scene.add(cable);
  const carriage = box(0.09, 0.03, 0.09, mat(0x444455, { metalness: 0.7, roughness: 0.3 }), 0, TOP + 0.12, 0, true);
  const bridge = box(IN.x1 - IN.x0, 0.02, 0.03, steel, 0, TOP + 0.1, 0, true);

  // 집게 힘: 오므릴 때 STRONG, 다 올라가면 WEAK 로 떨어진다(진짜 기계처럼)
  const PWR = { open: 0.75, shut: -0.4, strong: 0.2835, weak: 0.1008, damp: 0.02, wob: 0.12, jolt: 0.05, topJolt: 0.05, slipK: 0.3, slipT: 0.25 }; // jolt: 쿵 할 때 떨어지는 높이(m), slipK: 그 순간 힘 배율
  function clawTarget(ang, k) { for (const p of prongs) p.joint.configureMotorPosition(ang + (ang < 0 ? (Math.random() - 0.5) * 2 * PWR.wob : 0), k, PWR.damp); } // 오므릴 땐 발마다 조금씩 다르게(허벌한 집게)
  clawTarget(PWR.open, PWR.strong);

  // ---------- 인형 ----------
  // 몸통 공 + 머리 공을 한 몸으로. 털 천이라 잘 미끄러지지 않고 튀지 않는다.
  const plush = [];
  const PROTO = [];
  let PDENS = 55 * 1.1; // 인형 밀도(사장님 10/14 "무게 10% 증가")
  let PSIZE = 0.9; // 인형 크기(사장님 10/14 "10%만 줄여"). 그림과 몸 둘 다 같이 줄인다
  function addPlush(idx, x, y, z, yaw) {
    const q = new T.Quaternion().setFromEuler(new T.Euler((Math.random() - 0.5) * 0.6, yaw, (Math.random() - 0.5) * 0.6));
    const body = world.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(x, y, z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(0.4).setAngularDamping(0.9).setCanSleep(false));
    const pc = (d) => world.createCollider(d.setDensity(PDENS).setFriction(0.95).setRestitution(0.02).setCollisionGroups(G_ALL), body);
    const k = PSIZE;
    pc(C.ball(0.07 * k).setTranslation(0, 0.075 * k, 0));
    pc(C.ball(0.066 * k).setTranslation(0, 0.18 * k, 0));
    pc(C.capsule(0.03 * k, 0.022 * k).setTranslation(0, 0.03 * k, 0.04 * k).setRotation({ x: 0, y: 0, z: 0.7071, w: 0.7071 })); // 발
    const g = (PROTO[idx] || (PROTO[idx] = PL.makePrize(idx))).clone(); g.scale.setScalar(k); scene.add(g); // 모양은 종류마다 한 번만 만들고 복사(리필 때 멈춤 없게)
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    plush.push({ idx, body, g, got: false });
  }
  // ---------- 저장: 뽑은 인형 수 · 도감 · 기계에 남은 인형 ----------
  const KEY = 'toycrane.save';
  const S = Object.assign({ total: 0, dex: {}, left: null, big: 0 }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
  const save = () => { S.left = plush.filter((p) => !p.gone && !p.got).map((p) => p.idx); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const KINDS = 11; // 도감에 오르는 인형 종류(사격게임 경품 인형 0~10)

  // 인형을 채운다. kinds 가 있으면 그 인형들로(이어하기), 없으면 무작위 새 판.
  // rain: 리필 때는 위에서 우르르 떨어뜨린다. 처음 열 때는 미리 내려앉혀 둔다.
  function fillBed(kinds, rain) {
    const slots = [];
    for (let layer = 0; layer < 2; layer++) for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 3; iz++) {
      const x = IN.x0 + 0.1 + ix * 0.18 + (Math.random() - 0.5) * 0.04, z = IN.z0 + 0.1 + iz * 0.2 + (Math.random() - 0.5) * 0.04;
      if (x < HOLE.x1 + 0.08 && z > HOLE.z0 - 0.08) continue;
      slots.push([x, (rain ? BED + 0.45 : BED + 0.02) + layer * (rain ? 0.3 : 0.22), z]);
    }
    const list = kinds && kinds.length ? kinds.slice(0, slots.length) : slots.map(() => (Math.random() * KINDS) | 0);
    list.forEach((k, i) => addPlush(k, slots[i][0], slots[i][1], slots[i][2], Math.random() * 6.3));
    if (!rain) {
      for (let i = 0; i < 360; i++) world.step(); // 미리 내려앉힌다
      for (const p of plush) if (!p.gone && p.body.translation().y < BED - 0.05) { p.body.setTranslation({ x: 0.1, y: BED + 0.5, z: -0.1 }, true); p.body.setLinvel({ x: 0, y: 0, z: 0 }, true); } // 구멍에 빠진 것은 가운데 위로
    }
    for (const p of plush) p.born = performance.now();
  }
  function cleanGone() { for (let i = plush.length - 1; i >= 0; i--) if (plush[i].gone) plush.splice(i, 1); }
  for (let i = 0; i < KINDS; i++) PROTO[i] = PL.makePrize(i); // 로딩 때 11종 모양을 미리
  fillBed(S.left);
  try { R.compile(scene, cam); } catch (e) {} // 셰이더도 로딩 때 미리 준비
  save();

  // ---------- 상태 ----------
  const G = { playing: false, paused: () => !$('how').hidden || !$('dex').hidden };
  const STAT = (window.__STAT = { thunkHeld: 0, thunkDrop: 0 });
  const K = { st: 'move', x: HOME.x, y: TOP, z: HOME.z, t: 0, timer: 30, surf: 0 };
  const inp = { x: 0, z: 0 };
  const keys = {};
  addEventListener('keydown', (e) => {
    keys[e.code] = 1;
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (!$('how').hidden) $('howOk').click(); else if (!$('dex').hidden) $('dexClose').click(); else if (!G.playing) $('startBtn').click(); else drop();
  });
  addEventListener('keyup', (e) => { keys[e.code] = 0; });
  const pad = $('pad'), knob = $('knob');
  let padId = null, padC = null;
  pad.addEventListener('pointerdown', (e) => { padId = e.pointerId; const r = pad.getBoundingClientRect(); padC = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; pad.setPointerCapture(e.pointerId); padMove(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padMove(e); });
  const padUp = (e) => { if (e.pointerId !== padId) return; padId = null; inp.x = inp.z = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp);
  function padMove(e) {
    let dx = e.clientX - padC.x, dy = e.clientY - padC.y; const L = Math.hypot(dx, dy), M = 50;
    if (L > M) { dx *= M / L; dy *= M / L; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    inp.x = dx / M; inp.z = dy / M;
  }
  $('drop').addEventListener('click', () => drop());
  const VIEW_AZ = { front: 0, left: -Math.PI / 2, right: Math.PI / 2 };
  function setView(v) { CAM.azT = VIEW_AZ[v]; CAM.elT = 0.3; for (const e of document.querySelectorAll('#views [data-v]')) e.classList.toggle('on', e.dataset.v === v); }
  function setZoom(z) { CAM.zoomT = Math.max(0, Math.min(1, z)); $('zoom').classList.toggle('on', CAM.zoomT > 0.5); }
  for (const e of document.querySelectorAll('#views [data-v]')) e.addEventListener('click', () => { AU.play('click'); setView(e.dataset.v); });
  $('zoom').addEventListener('click', () => { AU.play('click'); setZoom(CAM.zoomT > 0.5 ? 0 : 1); });
  addEventListener('keydown', (e) => {
    const order = ['left', 'front', 'right'], cur = order.findIndex((v) => VIEW_AZ[v] === CAM.azT);
    if (e.code === 'KeyQ') setView(order[Math.max(0, cur - 1)]);
    if (e.code === 'KeyE') setView(order[Math.min(2, cur + 1)]);
    if (e.code === 'KeyZ') setZoom(CAM.zoomT > 0.5 ? 0 : 1);
  });
  // 마우스 휠·두 손가락 벌리기로 확대
  // 화면 끌기(폰 스와이프·PC 마우스)로 기계 둘레를 돈다: 좌우 = 앞~옆 180도 안에서, 위아래 = 내려다보는 높이
  // 마우스 휠·두 손가락 벌리기로 확대
  cv.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(CAM.zoomT - e.deltaY * 0.0012); }, { passive: false });
  const touches = new Map(); let pinch0 = 0, zoom0 = 0;
  function markView() { for (const e of document.querySelectorAll('#views [data-v]')) e.classList.toggle('on', Math.abs(VIEW_AZ[e.dataset.v] - CAM.azT) < 0.12); }
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId); touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { const [p, q] = [...touches.values()]; pinch0 = Math.hypot(p.x - q.x, p.y - q.y); zoom0 = CAM.zoomT; }
  });
  cv.addEventListener('pointermove', (e) => {
    const o = touches.get(e.pointerId); if (!o) return;
    const dx = e.clientX - o.x, dy = e.clientY - o.y; o.x = e.clientX; o.y = e.clientY;
    if (touches.size === 2 && pinch0) { const [p, q] = [...touches.values()]; setZoom(zoom0 + (Math.hypot(p.x - q.x, p.y - q.y) - pinch0) / 200); return; }
    if (touches.size !== 1 || !G.playing) return;
    const k = 3.2 / Math.max(320, Math.min(innerWidth, 1200));
    CAM.azT = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, CAM.azT - dx * k));
    CAM.elT = Math.max(0.08, Math.min(0.9, CAM.elT + dy * k * 0.5));
    CAM.az = CAM.azT; markView();
  });
  const tEnd = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch0 = 0; };
  cv.addEventListener('pointerup', tEnd); cv.addEventListener('pointercancel', tEnd);
  function drop() { if (K.st !== 'move' || !G.playing || G.paused()) return; K.st = 'down'; K.t = 0; K.got = 0; AU.play('click'); hud(); }
  function hud() { $('total').textContent = hold(); $('left').textContent = plush.filter((p) => !p.gone && !p.got).length; $('timeN').textContent = Math.ceil(K.timer); $('timer').classList.toggle('low', K.timer < 5.5 && K.st === 'move'); $('dexHud').textContent = Object.keys(S.dex).length + '/' + KINDS; $('drop').disabled = K.st !== 'move'; }
  let msgT = 0;
  function say(s) { const m = $('msg'); m.textContent = s; m.classList.toggle('long', s.length > 5); m.style.opacity = 1; msgT = 1.6; }

  // 집게 바로 아래 무엇이 있나(인형 윗면 높이)
  function surfaceBelow() {
    const ray = new RP.Ray({ x: K.x, y: K.y - 0.05, z: K.z }, { x: 0, y: -1, z: 0 });
    const h = world.castRay(ray, 2, true, undefined, G_RAY);
    return h ? K.y - 0.05 - h.timeOfImpact : BED;
  }
  const approach = (v, to, d) => (Math.abs(to - v) <= d ? to : v + Math.sign(to - v) * d);

  function refill() { cleanGone(); fillBed(null, true); say('REFILL!'); AU.play('refill'); for (let i = 0; i < 9; i++) setTimeout(() => AU.play('thud', 0.35 + Math.random() * 0.3), 350 + i * 110 + Math.random() * 80); save(); hud(); }

  // 쿵(위): 다 올라가 천장 멈춤쇠에 닿는 순간 덜컥 — 집게가 툭 떨어지고 힘이 잠깐 더 빠진다(진짜 기계처럼)
  function topThunk() {
    STAT.topHeld = (STAT.topHeld || 0) + (plush.some((p) => !p.gone && !p.got && p.body.translation().y > 1.25) ? 1 : 0);
    K.jy = PWR.topJolt; K.slip = PWR.slipT; clawTarget(PWR.shut, PWR.weak * PWR.slipK); CAM.shake = 0.3; AU.play('clunk');
  }

  // ---------- 한 걸음(1/120초) ----------
  const SPD = 0.22, M_ = 0.07;
  function step() {
    K.t += DT;
    if (K.st === 'move' && G.playing && !G.paused() || window.__botOn && K.st === 'move') {
      let ix = inp.x + (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
      let iz = inp.z + (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
      { const c = Math.cos(CAM.az), sn = Math.sin(CAM.az), wx = ix * c + iz * sn, wz = -ix * sn + iz * c; ix = wx; iz = wz; } // 보는 면에 맞춰 화면 기준으로
      K.x = Math.max(IN.x0 + M_, Math.min(IN.x1 - M_, K.x + Math.max(-1, Math.min(1, ix)) * SPD * DT));
      K.z = Math.max(IN.z0 + M_, Math.min(IN.z1 - M_, K.z + Math.max(-1, Math.min(1, iz)) * SPD * DT));
      if (!window.__botOn && G.playing && !G.paused()) { K.timer -= DT; if (K.timer <= 0) drop(); }
    } else if (K.st === 'down') {
      K.y -= 0.3 * DT;
      K.surf = surfaceBelow();
      if (K.y - K.surf <= 0.13 || K.y <= BED + 0.17 || K.t > 4) { K.st = 'close'; K.t = 0; clawTarget(PWR.shut, PWR.strong); AU.play('clamp'); }
    } else if (K.st === 'close') {
      if (K.t > 0.9) { K.st = 'up'; K.t = 0; }
    } else if (K.st === 'up') {
      K.y = Math.min(TOP, K.y + 0.2 * DT);
      if (K.y >= TOP) { if (K.weakAt == null) { K.weakAt = K.t; clawTarget(PWR.shut, PWR.weak); if (PWR.topJolt > 0) topThunk(); } if (K.t - K.weakAt > 0.4) { K.st = 'home'; K.t = 0; K.weakAt = null; K.held = null; } }
    } else if (K.st === 'home') {
      // 구멍 위까지 가서 멈추는 순간 쿵(벌리기 전, 두 번째 쿵) → 0.6초 뒤 벌린다
      K.x = approach(K.x, HOME.x, SPD * DT); K.z = approach(K.z, HOME.z, SPD * DT);
      if (K.x === HOME.x && K.z === HOME.z) {
        K.st = 'endk'; K.t = 0;
        K.held = plush.filter((p) => !p.gone && !p.got && p.body.translation().y > 1.25); STAT.thunkHeld += K.held.length ? 1 : 0;
        K.jy = PWR.jolt; K.slip = PWR.slipT; clawTarget(PWR.shut, PWR.weak * PWR.slipK); CAM.shake = 0.3; AU.play('clunk');
      }
    } else if (K.st === 'endk') {
      if (K.t > 0.6) {
        if (K.held && K.held.length && K.held.every((p) => p.gone || p.got || p.body.translation().y < 1.2) && !K.held.some((p) => p.got)) STAT.thunkDrop++;
        K.held = null; K.st = 'open'; K.t = 0; clawTarget(PWR.open, PWR.strong); AU.play('clamp', 0.45);
      }
    } else if (K.st === 'open') {
      if (K.t > 1.4) { K.st = 'move'; K.t = 0; K.timer = 30; if (!K.got && !window.__botOn) AU.play('miss'); }
    }
    if (K.slip > 0 && (K.slip -= DT) <= 0) clawTarget(PWR.shut, PWR.weak);
    if (K.jy > 0 && !(K.stall > 0)) K.jy = Math.max(0, K.jy - 0.12 * DT); // 떨어진 만큼 천천히 되감는다
    head.setNextKinematicTranslation({ x: K.x, y: K.y - (K.jy || 0), z: K.z });
    world.step();
    for (const p of plush) {
      if (p.gone) continue;
      const y = p.body.translation().y;
      { const vy = p.body.linvel().y; if (p.vy < -0.7 && vy > p.vy * 0.35 && !window.__botOn && G.playing) AU.play('thud', Math.min(0.7, -p.vy * 0.35)); p.vy = vy; } // 떨어진 인형이 툭 하고 멈출 때
      if (!p.got && y < BED - 0.12) {
        if (performance.now() - p.born < 4000) { p.body.setTranslation({ x: 0.1, y: BED + 0.5, z: -0.1 }, true); p.body.setLinvel({ x: 0, y: 0, z: 0 }, true); continue; } // 리필하며 굴러 들어간 건 무효
        const fresh = !S.dex[p.idx]; p.got = true; K.got = 1; S.total++; S.dex[p.idx] = (S.dex[p.idx] || 0) + 1; say(fresh ? 'NEW!' : 'GET!'); save(); hud();
        AU.play('thud', 0.8); AU.play('get'); if (fresh) setTimeout(() => AU.play('newdex'), 600);
        if (!plush.some((q) => !q.gone && !q.got)) setTimeout(refill, 1800); // 마지막 인형까지 뽑으면 새로 채운다
      }
      if (y < BED - 0.25) { world.removeRigidBody(p.body); scene.remove(p.g); p.gone = true; } // 구멍 속으로 사라지면 치운다(받침 상자 밖으로 삐져나와 보이지 않게)
    }
  }

  function sync() {
    for (const p of plush) { if (p.gone) continue; const t = p.body.translation(), r = p.body.rotation(); p.g.position.set(t.x, t.y, t.z); p.g.quaternion.set(r.x, r.y, r.z, r.w); }
    for (const p of prongs) { const t = p.body.translation(), r = p.body.rotation(); p.grp.position.set(t.x, t.y, t.z); p.grp.quaternion.set(r.x, r.y, r.z, r.w); }
    const h = head.translation();
    headMesh.position.set(h.x, h.y, h.z);
    carriage.position.set(h.x, TOP + 0.12, h.z); bridge.position.z = h.z;
    const top = TOP + 0.105; cable.scale.y = Math.max(0.01, top - (h.y + 0.05)); cable.position.set(h.x, (top + h.y + 0.05) / 2, h.z);
  }

  // ---------- 그리기 ----------
  let last = performance.now(), acc = 0;
  const _e = new T.Vector3(), _l = new T.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    try {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      acc += dt; let n = 0;
      while (acc >= DT && n < 8) { step(); acc -= DT; n++; }
      if (n === 8) acc = 0;
      sync(); window.__bearTick(dt);
      if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').style.opacity = 0; }
      if ((K.timer | 0) !== (frame.lt | 0)) { frame.lt = K.timer; hud(); if (K.st === 'move' && K.timer < 5.5 && K.timer > 0) AU.play('tick'); }
      // 집게 모터: 움직일 때만 돈다(위아래는 조금 낮게)
      const mv = K.st === 'move' ? Math.min(1, Math.hypot(inp.x, inp.z) + (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.KeyA || keys.KeyD || keys.KeyW || keys.KeyS ? 1 : 0)) : 0;
      if (K.st === 'down') AU.motor(0.8, 0.82, 'down'); else if (K.st === 'up' && K.y < TOP) AU.motor(0.8, 0.82, 'up'); else if (K.st === 'home') AU.motor(1, 0.95, 'home'); else AU.motor(mv > 0.05 && G.playing ? 0.9 : 0, 0.95, 'move');
      const ck = Math.min(1, dt * 5);
      if (!G.playing) { CAM.azT = Math.sin(now / 1000 * 0.18) * 0.55; CAM.zoomT = 0; } // 타이틀: 기계 둘레를 천천히
      CAM.az += (CAM.azT - CAM.az) * ck; CAM.zoom += (CAM.zoomT - CAM.zoom) * ck; CAM.el += (CAM.elT - CAM.el) * ck;
      // 확대하면 집게를 따라가며 가까이서 본다: 집게 머리와 바로 아래 인형 윗면의 가운데를 본다
      const hp = head.translation();
      _l.set(hp.x, (hp.y + 0.05 + surfaceBelow()) / 2, hp.z).lerp(LOOK, 1 - CAM.zoom);
      CAM.look.lerp(_l, Math.min(1, dt * 8));
      // 확대: 보는 면의 유리 가까이 다가간다(기둥에 덜 가린다). 집게와 아래 인형이 다 들어오는 만큼만
      const ca = Math.cos(CAM.az), sa = Math.sin(CAM.az);
      const wall = Math.abs(ca) * (ca > 0 ? IN.z1 - CAM.look.z : CAM.look.z - IN.z0) + Math.abs(sa) * (sa > 0 ? IN.x1 - CAM.look.x : CAM.look.x - IN.x0);
      const d = CAM.dist + (Math.max(CAM.near, wall + 0.12) - CAM.dist) * CAM.zoom;
      _e.set(Math.sin(CAM.az) * d * Math.cos(CAM.el - 0.3), (CAM.el + 0.3 * CAM.zoom) * d + 0.05, Math.cos(CAM.az) * d * Math.cos(CAM.el - 0.3)).add(CAM.look);
      _e.y = Math.min(_e.y, TOP + 0.04 + (1 - CAM.zoom) * 5); // 확대할 땐 천장 레일 아래에서 본다(레일이 집게를 가리지 않게)
      _l.copy(CAM.look);
      if (CAM.shake > 0) { CAM.shake -= dt; const k = CAM.shake * 0.02; _e.x += (Math.random() - 0.5) * k; _e.y += (Math.random() - 0.5) * k; }
      cam.position.copy(_e); cam.lookAt(_l);
      R.render(scene, cam);
    } catch (e) { console.error(e); }
  }
  hud();
  requestAnimationFrame(frame);
  window.__tick = (ms) => frame(last + (ms || 1000 / 60)); // 시험용: 한 프레임 손으로
  window.__R = R; window.__scene = scene; window.__cam = cam; window.__CAM = CAM; window.__G = G;

  // ---------- 도감: 인형 11종, 뽑은 것은 그림과 뽑은 수, 못 뽑은 것은 검은 그림자 ----------
  let thumbs = null;
  function makeThumbs() { // 인형마다 작은 그림을 한 번만 찍어 둔다
    const W = 192, r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(W, W); r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    const sc = new T.Scene(); sc.add(new T.HemisphereLight(0xffffff, 0x886688, 1.4));
    const dl = new T.DirectionalLight(0xffffff, 1.6); dl.position.set(0.5, 1, 1.2); sc.add(dl);
    const c = new T.PerspectiveCamera(30, 1, 0.01, 5); c.position.set(0, 0.17, 0.62); c.lookAt(0, 0.13, 0);
    thumbs = [];
    for (let i = 0; i <= KINDS; i++) { const g = PL.makePrize(i); g.scale.setScalar(1); g.rotation.y = -0.35; sc.add(g); r.render(sc, c); thumbs.push(r.domElement.toDataURL()); sc.remove(g); } // 마지막은 대왕 곰돌이
    r.dispose();
  }
  function openDex() {
    if (!thumbs) makeThumbs();
    const got = Object.keys(S.dex).length;
    $('dexN').textContent = got + ' / ' + KINDS;
    $('dexGrid').innerHTML = PL.PRIZES.slice(0, KINDS).map((P, i) => {
      const n = S.dex[i] || 0;
      return '<div class="card' + (n ? '' : ' no') + '"><img src="' + thumbs[i] + '"><b>' + (n ? P.name : '???') + '</b><i>' + (n ? 'x ' + n : '') + '</i></div>';
    }).join('');
    $('xImg').src = thumbs[BIG]; xchgView();
    $('dex').hidden = false;
  }
  $('dexBtn').addEventListener('click', () => { AU.play('click'); openDex(); });
  $('dexClose').addEventListener('click', () => { AU.play('click'); $('dex').hidden = true; });

  // ---------- 교환: 뽑은 인형 100개 → 대왕 곰돌이(하얀 곰). 교환하면 기계 옆 받침대에 앉는다 ----------
  const BIG = 11, COST = 100;
  function hold() { return S.total - S.big * 100; } // 손에 든 인형 수(교환하면 100개 줄어든다)
  // 첫 둘은 기계 양옆 받침대 위(오락실 큰 경품 자리), 그 뒤로는 받침대 앞 바닥에
  const BEAR_AT = [[0.8, 0.0, -0.45, 0.9], [-0.8, 0.0, 0.45, 0.9], [0.84, 0.48, -0.3, 0], [-0.84, 0.48, 0.3, 0], [0.82, -0.6, -0.2, 0], [-0.82, -0.6, 0.2, 0]];
  const bears = [];
  const WHITE_FUR = PL.furMat.clone(); WHITE_FUR.emissive = new T.Color(0x3a3434); // 분홍 조명 아래서도 흰 털로 보이게
  function stand(x, z) {
    box(0.5, 0.86, 0.5, mat(0xff6ab0, { roughness: 0.35 }), x, 0.43, z, true);
    box(0.54, 0.04, 0.54, mat(0xffd84a, { metalness: 0.6, roughness: 0.3 }), x, 0.88, z);
  }
  function placeBear(i, fall) {
    if (i >= BEAR_AT.length) return;
    const [x, z, yaw, y0] = BEAR_AT[i];
    if (y0) stand(x, z);
    const g = PL.makePrize(BIG);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material === PL.furMat) o.material = WHITE_FUR; } });
    g.position.set(x, fall ? y0 + 1.6 : y0, z); g.rotation.y = yaw; scene.add(g);
    bears.push({ g, y0, vy: 0, fall: !!fall });
  }
  for (let i = 0; i < S.big; i++) placeBear(i, false);
  window.__bearTick = function (dt) { // 새 대왕 곰돌이가 위에서 떨어져 통 튄다
    for (const b of bears) {
      if (!b.fall) continue;
      b.vy -= 9.8 * dt; b.g.position.y += b.vy * dt;
      if (b.g.position.y <= b.y0) { b.g.position.y = b.y0; if (b.vy < -1.2) { AU.play('thud', Math.min(1, -b.vy * 0.2)); CAM.shake = 0.25; b.vy *= -0.32; } else { b.vy = 0; b.fall = false; } }
      const sq = b.fall && b.g.position.y < b.y0 + 0.05 ? 0.9 : 1; b.g.scale.set(3.2 / Math.sqrt(sq), 3.2 * sq, 3.2 / Math.sqrt(sq));
    }
  };
  function xchgView() {
    const h = hold();
    $('xHave').textContent = h; $('xBar').style.width = Math.min(100, h) + '%';
    $('xBtn').disabled = h < COST;
    $('xOwn').textContent = S.big ? '가진 대왕 곰돌이 x ' + S.big : '';
  }
  $('xBtn').addEventListener('click', () => {
    if (hold() < COST) return;
    S.big++; save(); hud();
    $('dex').hidden = true;
    placeBear(S.big - 1, true);
    if (S.big - 1 < BEAR_AT.length) { setZoom(0); CAM.azT = BEAR_AT[S.big - 1][0] > 0 ? 0.45 : -0.45; CAM.elT = 0.3; markView(); } // 곰돌이 쪽으로 살짝 돌려 보여 준다
    say('대왕 곰돌이!'); AU.play('get'); setTimeout(() => AU.play('newdex'), 500);
  });
  // 소리 켜기·끄기 + 첫 손길에 소리판 열기(브라우저 규칙)
  const togs = () => { $('sndBtn').classList.toggle('off', !AU.snd); $('bgmBtn').classList.toggle('off', !AU.bgm); };
  $('sndBtn').addEventListener('click', () => { AU.setSnd(!AU.snd); AU.play('click'); togs(); });
  $('bgmBtn').addEventListener('click', () => { AU.play('click'); AU.setBgm(!AU.bgm); togs(); });
  togs();
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => AU.unlock(), { capture: true });

  // ---------- 타이틀 · HOW TO PLAY ----------
  function begin() { G.playing = true; document.body.classList.add('playing'); K.timer = 30; hud(); }
  $('startBtn').addEventListener('click', () => { AU.unlock(); AU.play('click'); if (!S.how) openHow(begin); else begin(); });
  $('howBtn').addEventListener('click', () => { AU.play('click'); openHow(null); });
  let howRaf = 0, howThen = null;
  function openHow(then) {
    howThen = then; $('how').hidden = false;
    const cvs = [...document.querySelectorAll('#how canvas')], t0 = performance.now();
    const loop = (now) => {
      if ($('how').hidden) return;
      const t = (now - t0) / 1000;
      how1(cvs[0].getContext('2d'), t % 3.4); how2(cvs[1].getContext('2d'), t % 3.6); how3(cvs[2].getContext('2d'), t % 3.2);
      howRaf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(howRaf); howRaf = requestAnimationFrame(loop);
  }
  $('howOk').addEventListener('click', () => { AU.play('click'); $('how').hidden = true; S.how = 1; save(); const f = howThen; howThen = null; if (f) f(); });
  // 그림 도구: 실제 게임의 인형 색으로 그린 작은 인형·집게
  const PC = ['#a86a3a', '#fff4f0', '#f0a040', '#6ac84a', '#ffb8c8', '#ffe04a'];
  function doll(g, x, y, r, c, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = c; g.strokeStyle = 'rgba(40,10,40,.55)'; g.lineWidth = 2;
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.62, -r * 0.72, r * 0.34, 0, 7); g.fill(); g.stroke(); }
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#1a1014'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * r * 0.36, -r * 0.08, r * 0.13, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,120,150,.6)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.55, r * 0.25, r * 0.16, r * 0.1, 0, 0, 7); g.fill(); }
    g.restore();
  }
  function claw(g, x, y, open, ropeTop) {
    g.strokeStyle = '#2a2232'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, ropeTop); g.lineTo(x, y - 14); g.stroke();
    g.fillStyle = '#ffd84a'; g.fillRect(x - 15, y - 16, 30, 16); g.fillStyle = '#ff4a8a'; g.beginPath(); g.arc(x, y - 16, 15, Math.PI, 0); g.fill();
    g.strokeStyle = '#d8d8e4'; g.lineWidth = 5; g.lineCap = 'round';
    for (const sx of [-1, 1]) { const a = open * 0.6; g.beginPath(); g.moveTo(x + sx * 8, y); g.lineTo(x + sx * (16 + 22 * a), y + 30); g.lineTo(x + sx * (6 + 18 * a), y + 46); g.stroke(); }
  }
  function howBox(g) {
    const W = 440, H = 320; g.clearRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a1a6a'); gr.addColorStop(1, '#ff7ac8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#7a3aa8'; g.fillRect(0, 262, W, 58);
    g.fillStyle = '#050208'; g.fillRect(24, 262, 92, 58); g.fillStyle = 'rgba(200,240,255,.35)'; g.fillRect(114, 236, 5, 26);
    g.fillStyle = '#c9c6d6'; g.fillRect(0, 16, W, 6);
  }
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  function how1(g, t) { // 위에서 본 기계: 집게 그림자가 조이스틱 방향대로 움직인다
    const W = 440, H = 320; g.clearRect(0, 0, W, H);
    g.fillStyle = '#7a3aa8'; g.fillRect(20, 20, 300, 280); g.fillStyle = '#050208'; g.fillRect(20, 210, 90, 90);
    const spots = [[170, 80], [250, 70], [200, 150], [280, 150], [150, 220], [240, 240], [290, 250]];
    spots.forEach(([x, y], i) => doll(g, x, y, 24, PC[i % PC.length]));
    const path = [[60, 250], [200, 250], [200, 150], [240, 150]], seg = Math.min(2.99, (t / 2.6) * 3), k = Math.floor(seg), f = ease(seg - k);
    const cx = path[k][0] + (path[k + 1][0] - path[k][0]) * f, cy = path[k][1] + (path[k + 1][1] - path[k][1]) * f;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill();
    g.strokeStyle = '#d8d8e4'; g.lineWidth = 5; for (let i = 0; i < 3; i++) { const a = i * 2.094 - 1.57; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.stroke(); }
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill();
    const dx = k < 3 ? Math.sign(path[k + 1][0] - path[k][0]) : 0, dy = k < 3 ? Math.sign(path[k + 1][1] - path[k][1]) : 0, on = t < 2.6 ? 1 : 0;
    g.fillStyle = '#120a18'; g.beginPath(); g.arc(385, 250, 42, 0, 7); g.fill(); g.strokeStyle = '#d8d5e4'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#e8262e'; g.beginPath(); g.arc(385 + dx * 18 * on, 250 + dy * 18 * on, 20, 0, 7); g.fill();
  }
  function how2(g, t) { // 옆에서: 내려가서 오므리고 들어 올린다
    howBox(g);
    const dolls = [[250, 240, 0], [320, 244, 3], [196, 246, 2]];
    const down = ease(t / 1.1), shut = ease((t - 1.2) / 0.5), up = ease((t - 1.9) / 1.0);
    const y = 40 + 150 * down - 150 * up, open = 1 - shut;
    dolls.forEach(([x, yy, c], i) => doll(g, x, i === 0 ? yy - 150 * up : yy, 28, PC[c]));
    claw(g, 250, y + (shut > 0 ? 0 : 0), open, 22);
    if (t < 1.2) { g.fillStyle = '#e8262e'; g.beginPath(); g.arc(395, 60, 26 - (t < 0.25 ? 4 : 0), 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '15px Ui'; g.textAlign = 'center'; g.fillText('DROP', 395, 65); }
  }
  function how3(g, t) { // 구멍 위로 가서 벌리면 쏙 → GET!
    howBox(g);
    doll(g, 300, 244, 28, PC[4]); doll(g, 230, 246, 28, PC[1]);
    const mv = ease(t / 1.2), x = 300 - 230 * mv, rel = t > 1.4, fall = rel ? Math.min(1, (t - 1.4) / 0.5) : 0;
    const dy = 110 + 76 + 200 * fall * fall;
    if (dy < 320) doll(g, x, dy, 28, PC[3]);
    claw(g, x, 110, rel ? 1 : 0, 22);
    g.fillStyle = '#050208'; g.fillRect(24, 300, 92, 20);
    if (t > 1.9) { g.save(); g.font = '56px Star'; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = '#8a0a4a'; g.fillStyle = '#fff36a'; g.strokeText('GET!', 250, 120); g.fillText('GET!', 250, 120); g.restore(); }
  }

  // ---------- 시험용: 자동 뽑기(봇) ----------
  // __sim(n): 그리지 않고 n 번 뽑아 성공률을 잰다. 목표는 아직 안 뽑힌 인형 중 무작위, 몸통 위를 노린다.
  window.__step = (n) => { for (let i = 0; i < n; i++) step(); sync(); hud(); };
  window.__refill = () => refill();
  window.__K = K; window.__prongs = prongs; window.__head = head; window.__PWR = PWR; window.__dens = (v) => { if (v) PDENS = v; return PDENS; }; window.__psize = (v) => { if (v) PSIZE = v; return PSIZE; }; window.__S = S; window.__plush = plush;
  window.__reset = function () { // 인형을 다 치우고 새로 쌓는다(시험용)
    for (const p of plush) if (!p.gone) { world.removeRigidBody(p.body); scene.remove(p.g); }
    plush.length = 0; fillBed(); STAT.thunkHeld = STAT.thunkDrop = 0;
    Object.assign(K, { st: 'move', x: HOME.x, y: TOP, z: HOME.z, t: 0, jy: 0, stall: 0, held: null }); clawTarget(PWR.open, PWR.strong);
  };
  window.__give = function (n) { S.total += n; save(); hud(); }; // 시험용
  window.__sim = function (n, aimErr) {
    window.__botOn = 1; let got0 = S.total, tries = 0;
    for (let i = 0; i < n; i++) {
      const live = plush.filter((p) => !p.gone && !p.got);
      if (!live.length) break;
      const p = live[(Math.random() * live.length) | 0], t = p.body.translation();
      const e = aimErr || 0, tx = t.x + (Math.random() - 0.5) * 2 * e, tz = t.z + (Math.random() - 0.5) * 2 * e;
      let guard = 0;
      while (guard++ < 120 * 8) { const dx = tx - K.x, dz = tz - K.z; if (Math.abs(dx) < 0.004 && Math.abs(dz) < 0.004) break; inp.x = Math.max(-1, Math.min(1, dx * 40)); inp.z = Math.max(-1, Math.min(1, dz * 40)); step(); }
      inp.x = inp.z = 0; drop(); tries++;
      guard = 0; while (K.st !== 'move' && guard++ < 120 * 30) step();
      guard = 0; while (guard++ < 120) step();
    }
    window.__botOn = 0; sync(); hud();
    return { tries, got: S.total - got0, rate: ((S.total - got0) / Math.max(1, tries)).toFixed(2), left: plush.filter((p) => !p.gone && !p.got).length };
  };
})();
