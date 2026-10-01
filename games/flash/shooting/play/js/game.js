// 야시장 사격: 코르크가 진짜 강체(Rapier)로 날아가 깡통·병·오리를 넘어뜨린다. 표적을 다 넘기면 CLEAR, 두 판마다 경품 하나.
(async function () {
  const T = THREE, RP = RAPIER;
  const $ = (id) => document.getElementById(id);
  const L_ = window.L || ((s) => s);
  await RP.init();

  // ---------- 저장 ----------
  const KEY = 'shooting.save';
  const S = Object.assign(
    { stage: 1, coins: 0, guns: [0], gun: 0, ammoLv: 0, stars: {}, prizes: [], mis: {}, cans: 0, bottles: 0, ducks: 0, balloons: 0, booms: 0, best: 0, clears: 0, ended: 0, shots: 0 },
    (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })()
  );
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const LAST = window.STAGES.length;

  // ---------- 총·상점 ----------
  // kind: 총알 종류, n: 한 번에 나가는 수, v: 빠르기(m/s), m: 무게(kg), spread: 퍼짐(라디안), seq: 차례로 나가는 간격
  // acc: 한 발 퍼짐, sway: 손 떨림, sight: 판마다 몰래 틀어진 가늠자 (전부 도). 좋은 총일수록 작다
  const GUN = [ // 실제 코르크는 가볍다(2~4g, 20m/s 안팎): 깡통 윗부분을 맞혀야 넘어간다
    { price: 0, kind: 'cork', n: 1, v: 20, m: 0.003, acc: 0.6, sway: 1.0, sight: 1.0 },
    { price: 400, kind: 'cork', n: 1, v: 26, m: 0.004, acc: 0.3, sway: 0.65, sight: 0.45 },
    { price: 900, kind: 'cork', n: 2, v: 21, m: 0.003, twin: 1, acc: 0.55, sway: 0.85, sight: 0.8 },
    { price: 1600, kind: 'cork', n: 3, v: 22, m: 0.003, seq: 0.09, acc: 0.5, sway: 0.8, sight: 0.7 },
    { price: 2600, kind: 'pellet', n: 7, v: 30, m: 0.0015, acc: 1.8, sway: 0.75, sight: 0.6 },
    { price: 4000, kind: 'ball', n: 1, v: 16, m: 0.057, acc: 0.45, sway: 1.1, sight: 0.5 },
  ];
  const AMMO_UP = [200, 450, 800, 1300, 2000];

  // ---------- 미션 12 ----------
  const starSum = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
  const MIS = [
    { id: 'c1', name: '첫 CLEAR', r: 50, v: () => S.clears, n: 1 },
    { id: 'can', name: '깡통 60개', r: 150, v: () => S.cans, n: 60 },
    { id: 'bot', name: '병 20개 깨기', r: 150, v: () => S.bottles, n: 20 },
    { id: 'duck', name: '오리 30마리', r: 150, v: () => S.ducks, n: 30 },
    { id: 'bal', name: '풍선 30개', r: 200, v: () => S.balloons, n: 30 },
    { id: 'm3', name: '한 발에 3개', r: 150, v: () => S.best, n: 3 },
    { id: 'm6', name: '한 발에 6개', r: 300, v: () => S.best, n: 6 },
    { id: 'boom', name: '폭죽 5번', r: 150, v: () => S.booms, n: 5 },
    { id: 's30', name: '별 30개', r: 300, v: starSum, n: 30 },
    { id: 's72', name: '별 72개', r: 1000, v: starSum, n: 72 },
    { id: 'g3', name: '총 3자루', r: 200, v: () => S.guns.length, n: 3 },
    { id: 'pz', name: '경품 11개', r: 500, v: () => S.prizes.length, n: 11 },
  ];
  function checkMis() {
    for (const m of MIS) {
      if (S.mis[m.id]) continue;
      if (m.v() >= m.n) { S.mis[m.id] = 1; S.coins += m.r; toast(L_(m.name) + '  +' + m.r); AU.coin(); }
    }
    save(); hud();
  }

  // ---------- 상태 ----------
  const G = { state: 'loading', t: 0, paused: false, shake: 0 };
  let M = null; // 한 판

  // ============================================================
  //  물리
  // ============================================================
  const DT = 1 / 120;
  let world = null, eq = null, acc = 0;
  const byCol = new Map(); // 충돌체 handle → { item } 또는 { proj } 또는 { shard }
  function addStatic(desc) { const c = world.createCollider(desc); byCol.set(c.handle, { stat: 1 }); return c; }
  function newWorld() {
    if (world) { try { world.free(); } catch (e) {} }
    byCol.clear();
    world = new RP.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = DT;
    eq = new RP.EventQueue(true);
    const C = RP.ColliderDesc;
    // 땅·구덩이 바닥·뒤 막·옆 벽·치마판·계산대
    addStatic(C.cuboid(10, 0.5, 10).setTranslation(0, -0.5, 0).setFriction(0.8));
    addStatic(C.cuboid(1.7, 0.02, 0.75).setTranslation(0, SC.PIT_Y - 0.02, -2.35).setFriction(0.9).setRestitution(0.1));
    addStatic(C.cuboid(1.8, 1.5, 0.05).setTranslation(0, 1.5, SC.BOOTH.back).setFriction(0.6).setRestitution(0.1));
    for (const s of [-1, 1]) addStatic(C.cuboid(0.03, 1.5, 0.8).setTranslation(s * (SC.SIDE_X + 0.02), 1.5, -2.3).setFriction(0.5));
    addStatic(C.cuboid(1.7, (SC.PIT_Y + 0.33) / 2, 0.015).setTranslation(0, (SC.PIT_Y + 0.33) / 2, -1.62));
    addStatic(C.cuboid(1.9, 0.5, 0.35).setTranslation(0, 0.5, SC.BOOTH.front + 0.28));
    // 선반(판자) 셋 + 레일
    for (const t of SC.TIERS) addStatic(C.cuboid(SC.SHELF.len / 2, SC.SHELF.th / 2, SC.SHELF.depth / 2).setTranslation(0, t.y - SC.SHELF.th / 2, t.z).setFriction(0.6).setRestitution(0.15));
    addStatic(C.cuboid(1.65, 0.0125, 0.06).setTranslation(0, SC.RAIL.y - 0.0125, SC.RAIL.z).setFriction(0.5));
    addStatic(C.cuboid(1.65, 0.08, 0.01).setTranslation(0, SC.RAIL.y - 0.1, SC.RAIL.z + 0.07));
  }

  // ============================================================
  //  표적 만들기
  // ============================================================
  let BOT_DEN = 420, PIN_DEN = 650;
  let CAN_WEIGHT = 800; // 추 밀도(깡통 전체 약 0.13kg): 윗부분 절반을 맞혀야 떨어진다
  const VAL = { can: 5, bottle: 8, duck: 10, popper: 8, balloon: 5, pin: 3, boom: 10 };
  const items = [];
  const Q = new T.Quaternion(), V3 = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
  const rq = (q) => ({ x: q.x, y: q.y, z: q.z, w: q.w });
  function dyn(x, y, z, q) {
    const d = RP.RigidBodyDesc.dynamic().setTranslation(x, y, z).setLinearDamping(0.05).setAngularDamping(0.25).setCanSleep(false);
    if (q) d.setRotation(rq(q));
    return world.createRigidBody(d);
  }
  function col(desc, body, it) {
    desc.setActiveEvents(RP.ActiveEvents.CONTACT_FORCE_EVENTS | RP.ActiveEvents.COLLISION_EVENTS).setContactForceEventThreshold(4);
    const c = world.createCollider(desc, body);
    byCol.set(c.handle, { item: it });
    return c;
  }
  function addMesh(geo, mat) { const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; SC.scene.add(m); return m; }

  function spawn(d) {
    const it = { t: d.t, d, downed: false, val: VAL[d.t] || 5, parts: [] };
    const tier = d.tier != null ? SC.TIERS[d.tier] : null;
    if (d.t === 'can') {
      const h = SC.ITEM.can.h, r = SC.ITEM.can.r;
      const y = tier.y + h / 2 + (d.lv || 0) * (h + 0.0008) + 0.0006;
      Q.setFromAxisAngle(UP, Math.random() * 6.28);
      it.body = dyn(d.x, y, tier.z, Q);
      col(RP.ColliderDesc.cylinder(h / 2, r).setDensity(90).setFriction(0.22).setRestitution(0.25), it.body, it);
      // 야시장 깡통은 바닥에 추가 들어 있다(무게 중심이 낮다): 가운데를 맞으면 흔들리고 윗부분을 맞아야 넘어간다
      if (!(d.lv > 0)) col(RP.ColliderDesc.cylinder(0.01, r * 0.9).setTranslation(0, -h / 2 + 0.012, 0).setDensity(CAN_WEIGHT).setFriction(0.22), it.body, it); // 맨 아랫줄만 추(쌓인 위 깡통은 빈 깡통)
      it.mesh = addMesh(SC.canGeo, SC.canMats[(d.lab || 0) % SC.canMats.length]);
      it.baseY = tier.y;
    } else if (d.t === 'bottle') {
      const B = SC.ITEM.bottle;
      Q.setFromAxisAngle(UP, Math.random() * 6.28);
      it.body = dyn(d.x, tier.y + B.h / 2 + 0.0006, tier.z, Q);
      col(RP.ColliderDesc.convexHull(hullOf(SC.botProfile, 10)).setDensity(BOT_DEN).setFriction(0.4).setRestitution(0.2), it.body, it);
      const g = new T.Group();
      const m = new T.Mesh(SC.bottleGeo, SC.bottleMats[(d.lab != null ? d.lab : items.length) % 3]); m.castShadow = true; g.add(m);
      const lb = new T.Mesh(SC.bottleLabel.geo, SC.bottleLabel.mat); g.add(lb);
      SC.scene.add(g); it.mesh = g; it.mat = m.material;
      it.baseY = tier.y;
    } else if (d.t === 'pin') {
      const P = SC.ITEM.pin;
      it.body = dyn(d.x, tier.y + P.h / 2 + 0.0006, tier.z + (d.dz || 0));
      col(RP.ColliderDesc.convexHull(hullOf(SC.pinProfile, 10)).setDensity(PIN_DEN).setFriction(0.45).setRestitution(0.2), it.body, it);
      it.mesh = addMesh(SC.pinGeo, SC.pinMat);
      it.baseY = tier.y;
    } else if (d.t === 'boom') {
      const s = SC.ITEM.boom.s;
      it.body = dyn(d.x, tier.y + s / 2 + 0.0006, tier.z);
      col(RP.ColliderDesc.cuboid(s / 2, s / 2, s / 2).setDensity(150).setFriction(0.6).setRestitution(0.1), it.body, it);
      const g = new T.Group();
      const m = new T.Mesh(SC.boomGeo, SC.boomMat); m.castShadow = true; g.add(m);
      g.add(new T.Mesh(SC.fuseGeo, SC.fuseMat));
      SC.scene.add(g); it.mesh = g;
      it.baseY = tier.y;
    } else if (d.t === 'popper') {
      const P = SC.ITEM.popper;
      const base = world.createRigidBody(RP.RigidBodyDesc.fixed().setTranslation(d.x, tier.y + 0.012, tier.z));
      Q.setFromAxisAngle(new T.Vector3(1, 0, 0), 0.05);
      it.body = dyn(d.x, tier.y + 0.012, tier.z, Q);
      col(RP.ColliderDesc.cuboid(0.015, 0.05, 0.005).setTranslation(0, 0.06, 0).setDensity(900), it.body, it);
      const pc = RP.ColliderDesc.cylinder(P.th / 2, P.r).setTranslation(0, 0.11 + P.r, 0).setRotation(rq(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI / 2))).setDensity(900).setRestitution(0.3);
      col(pc, it.body, it);
      const j = world.createImpulseJoint(RP.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), base, it.body, true);
      j.setLimits(-1.3, 0.06);
      it.joint = j; it.anchor = base;
      const g = new T.Group();
      const plate = new T.Mesh(SC.popperGeo, SC.popperMats); plate.position.y = 0.11 + P.r; plate.castShadow = true; g.add(plate);
      const neck = new T.Mesh(SC.popperNeck, SC.popperEdge); neck.position.y = 0.06; neck.castShadow = true; g.add(neck);
      SC.scene.add(g); it.mesh = g;
      const foot = addMesh(SC.popperFoot, SC.popperEdge); foot.position.set(d.x, tier.y + 0.006, tier.z); it.parts.push(foot);
    } else if (d.t === 'duck') {
      // 레일 위 수레(움직이는 몸, 충돌 없음)에 경첩으로 달린 오리
      const span = 3.5;
      it.x0 = -span / 2 + ((d.i + 0.5) * span) / d.n;
      it.carrier = world.createRigidBody(RP.RigidBodyDesc.kinematicPositionBased().setTranslation(it.x0, SC.RAIL.y + 0.012, SC.RAIL.z));
      Q.setFromAxisAngle(new T.Vector3(1, 0, 0), 0.05);
      it.body = dyn(it.x0, SC.RAIL.y + 0.012, SC.RAIL.z, Q);
      col(RP.ColliderDesc.cuboid(0.092, 0.095, 0.016).setTranslation(0, 0.113, 0).setDensity(120).setRestitution(0.2), it.body, it);
      const j = world.createImpulseJoint(RP.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), it.carrier, it.body, true);
      j.setLimits(-1.0, 0.06);
      it.joint = j;
      const g = new T.Group();
      const m = new T.Mesh(SC.duckGeo, SC.duckMat); m.position.y = 0.012; m.castShadow = true; g.add(m);
      m.scale.setScalar(1.35); if (d.dir < 0) m.scale.x = -1.35;
      SC.scene.add(g); it.mesh = g;
      const foot = addMesh(SC.duckFoot, SC.duckFootMat); foot.scale.setScalar(1.35); it.parts.push(foot); it.foot = foot;
    } else if (d.t === 'balloon') {
      const sp = Math.min(0.3, 2.1 / d.cols);
      it.ax = (d.i - (d.cols - 1) / 2) * sp;
      it.ay = tier.y; it.az = tier.z - 0.03;
      it.ph = Math.random() * 6.28;
      it.body = world.createRigidBody(RP.RigidBodyDesc.kinematicPositionBased().setTranslation(it.ax, it.ay + 0.3, it.az));
      const c = world.createCollider(RP.ColliderDesc.ball(0.074).setTranslation(0, 0.01, 0).setSensor(true).setActiveEvents(RP.ActiveEvents.COLLISION_EVENTS), it.body);
      byCol.set(c.handle, { item: it });
      it.mesh = addMesh(SC.balloonGeo, SC.balloonMats[(d.i + d.j * 3) % SC.balloonMats.length]);
      const lg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(), new T.Vector3()]);
      it.str = new T.Line(lg, SC.stringMat); SC.scene.add(it.str); it.parts.push(it.str);
    }
    items.push(it);
    return it;
  }
  function hullOf(profile, seg) {
    const out = [];
    for (const p of profile) for (let k = 0; k < seg; k++) { const a = (k / seg) * Math.PI * 2; out.push(Math.cos(a) * p.x, p.y, Math.sin(a) * p.x); }
    return new Float32Array(out);
  }

  // ============================================================
  //  총알(코르크·비비탄·테니스공): 진짜 강체. 오래된 것부터 치운다
  // ============================================================
  const projs = [];
  const streakGeo = new T.CylinderGeometry(0.004, 0.0005, 1, 6, 1, true); streakGeo.translate(0, -0.5, 0); streakGeo.rotateX(-Math.PI / 2);
  const streakMat = new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
  function removeProj(p) {
    if (p.body) { world.removeRigidBody(p.body); p.body = null; }
    SC.scene.remove(p.mesh); SC.scene.remove(p.streak);
  }
  function launch(kind, from, vel, mass, shot) {
    while (projs.length > 36) removeProj(projs.shift());
    const r = kind === 'ball' ? 0.033 : kind === 'pellet' ? 0.006 : 0.0095;
    const vol = (4 / 3) * Math.PI * r * r * r;
    const body = world.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(from.x, from.y, from.z).setLinvel(vel.x, vel.y, vel.z).setCcdEnabled(true).setLinearDamping(kind === 'ball' ? 0.05 : 0.1).setAngularDamping(0.5));
    const c = world.createCollider(RP.ColliderDesc.ball(r).setDensity(mass / vol).setFriction(0.6).setRestitution(kind === 'ball' ? 0.55 : 0.35).setActiveEvents(RP.ActiveEvents.COLLISION_EVENTS), body);
    const mesh = new T.Mesh(kind === 'ball' ? SC.ballGeo : kind === 'pellet' ? SC.pelletGeo : SC.corkGeo, kind === 'ball' ? SC.ballMat : kind === 'pellet' ? SC.pelletMat : SC.corkMat);
    mesh.castShadow = true; SC.scene.add(mesh);
    const streak = new T.Mesh(streakGeo, streakMat); streak.visible = false; SC.scene.add(streak);
    const p = { kind, body, mesh, streak, t: 0, hit: false, shot };
    byCol.set(c.handle, { proj: p });
    projs.push(p);
    return p;
  }
  // 목표점에 닿는 발사 속도(중력 보정, 낮은 탄도)
  function aimVel(from, to, v) {
    const d = V3.copy(to).sub(from);
    const dh = Math.hypot(d.x, d.z), dy = d.y, g = 9.81;
    const hdir = new T.Vector3(d.x, 0, d.z).normalize();
    const disc = v ** 4 - g * (g * dh * dh + 2 * dy * v * v);
    let th = Math.atan2(dy, dh);
    if (disc >= 0) th = Math.atan((v * v - Math.sqrt(disc)) / (g * dh));
    return hdir.multiplyScalar(Math.cos(th) * v).add(new T.Vector3(0, Math.sin(th) * v, 0));
  }
  // 총구 자리(세계): 눈 오른쪽 아래 앞
  const camR = new T.Vector3(), camU = new T.Vector3(), camF = new T.Vector3();
  function muzzleWorld(side) {
    const cam = SC.camera;
    cam.updateMatrixWorld();
    camR.setFromMatrixColumn(cam.matrixWorld, 0); camU.setFromMatrixColumn(cam.matrixWorld, 1); camF.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    return cam.position.clone().addScaledVector(camR, 0.1 + (side || 0)).addScaledVector(camU, -0.08).addScaledVector(camF, 0.55);
  }
  // 손 떨림(도). 실제 손처럼: 제멋대로 떠도는 흔들림 + 숨 쉬기(4초) + 잘게 떠는 손(초당 9번)
  const NZ = []; for (let i = 0; i < 512; i++) NZ.push(Math.random() * 2 - 1);
  function noise(t, seed) { // 부드러운 1차원 잡음(-1..1)
    const i = Math.floor(t), f = t - i, k = f * f * (3 - 2 * f);
    const a = NZ[(i + seed * 97) & 511], b = NZ[(i + 1 + seed * 97) & 511];
    return a + (b - a) * k;
  }
  function swayDeg(t) {
    const A = GUN[S.gun].sway;
    const x = A * (0.8 * noise(t * 0.45, 1) + 0.35 * noise(t * 1.3, 2)) + A * 0.18 * noise(t * 9, 3);
    const y = A * (0.7 * noise(t * 0.4, 4) + 0.3 * noise(t * 1.2, 5)) + A * 0.5 * Math.sin(t * 1.55) + A * 0.18 * noise(t * 9.5, 6);
    return { x, y };
  }
  // 도 → 화면 좌표(NDC) 크기
  function degNdc(dx, dy) {
    const cam = SC.camera, ty = Math.tan((cam.fov * Math.PI) / 360);
    return { x: Math.tan((dx * Math.PI) / 180) / (ty * cam.aspect), y: Math.tan((dy * Math.PI) / 180) / ty };
  }
  // 지금 총구가 실제로 겨누는 화면 자리 = 조준점 + 손 떨림 (가늠자 틀어짐은 안 보인다)
  const swayNdc = new T.Vector2();
  function aimedNdc(nx, ny) { const w = swayDeg(G.t), d = degNdc(w.x, w.y); return swayNdc.set(nx + d.x, ny + d.y); }
  function fire(nx, ny) {
    if (!M || M.over || G.paused) return;
    if (M.ammo <= 0) { AU.empty(); return; }
    if (G.t < M.coolUntil) return;
    const gd = GUN[S.gun];
    M.coolUntil = G.t + (gd.seq ? 0.45 : 0.3);
    M.ammo--; M.shotIdx++; S.shots++;
    const shot = { i: M.shotIdx, downs: 0, t: G.t, word: 0 };
    M.lastShot = shot; M.lastShotT = G.t;
    const shootOne = (k) => {
      const from = muzzleWorld(gd.twin ? (k ? 0.03 : -0.03) : 0);
      const a = aimedNdc(nx, ny), bias = degNdc(M.bias.x * gd.sight, M.bias.y * gd.sight);
      const jerk = degNdc(gd.sway * (0.1 + Math.random() * 0.35), -gd.sway * (0.15 + Math.random() * 0.4)); // 방아쇠를 당길 때 오른쪽 아래로 움찔
      bias.x += jerk.x; bias.y += jerk.y;
      const to = aimAt(a.x + bias.x, a.y + bias.y).clone();
      aimAt(nx, ny); // 조준 표시는 원래 자리로
      if (gd.twin) to.addScaledVector(camR, k ? 0.02 : -0.02);
      const dir = to.sub(from).normalize();
      // 가늠자는 3.2m(가운데 선반)에 맞춰져 있다: 맨 윗선반은 조금 처지고 맨 아랫선반은 조금 뜬다
      dir.applyAxisAngle(camR, (9.81 * 3.2) / (2 * gd.v * gd.v));
      // 한 발 퍼짐(원 안에 고르게)
      const r = ((Math.sqrt(Math.random()) * gd.acc) * Math.PI) / 180, th = Math.random() * 6.283;
      dir.applyAxisAngle(camU, Math.cos(th) * r).applyAxisAngle(camR, Math.sin(th) * r);
      launch(gd.kind, from, dir.multiplyScalar(gd.v), gd.m, shot);
    };
    if (gd.seq) {
      for (let k = 0; k < gd.n; k++) M.queue.push({ at: G.t + k * gd.seq, fn: () => { shootOne(0); AU.shot('cork'); kick(0.6); } });
    } else {
      for (let k = 0; k < gd.n; k++) shootOne(k);
      AU.shot(gd.kind === 'ball' ? 'cannon' : gd.kind === 'pellet' ? 'shot' : 'cork');
      kick(gd.kind === 'ball' ? 1.6 : gd.kind === 'pellet' ? 1.3 : 1);
    }
    hud();
  }

  // ============================================================
  //  깨짐·터짐·조각
  // ============================================================
  const shards = [];
  function shatter(it, force) {
    if (it.gone) return;
    const p = it.body.translation(), q = it.body.rotation(), v = it.body.linvel();
    const bq = new T.Quaternion(q.x, q.y, q.z, q.w), bp = new T.Vector3(p.x, p.y, p.z);
    removeItemBody(it);
    it.mesh.visible = false; it.gone = true;
    const mat = SC.shardMats[SC.bottleMats.indexOf(it.mat)] || SC.shardMats[0];
    for (const sh of SC.shards) {
      while (shards.length > 80) { const o = shards.shift(); if (o.body) world.removeRigidBody(o.body); SC.scene.remove(o.mesh); }
      const c = sh.center.clone().applyQuaternion(bq).add(bp);
      const out = new T.Vector3(sh.center.x, 0, sh.center.z).normalize().applyQuaternion(bq);
      const b = world.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(c.x, c.y, c.z).setRotation(rq(bq))
        .setLinvel(v.x + out.x * (0.6 + Math.random() * 1.2), v.y + 0.4 + Math.random() * 0.8, v.z + out.z * (0.6 + Math.random() * 1.2))
        .setAngvel({ x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 }).setAngularDamping(0.6));
      const cc = world.createCollider(RP.ColliderDesc.convexHull(sh.pts).setDensity(900).setFriction(0.5).setRestitution(0.25).setActiveEvents(RP.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(1.5), b);
      const o = { body: b, mesh: new T.Mesh(sh.geo, mat), t: 0 };
      o.mesh.castShadow = true; SC.scene.add(o.mesh);
      byCol.set(cc.handle, { shard: o });
      shards.push(o);
    }
    burst(bp, 26, [0xe8fff0, 0xbfe8ff, 0xffffff], 1.6, 0.012);
    AU.shatter(Math.min(1, force / 150 + 0.4));
    S.bottles++;
    setDown(it);
  }
  function explode(it) {
    if (it.gone) return;
    const p = it.body.translation(), c = new T.Vector3(p.x, p.y, p.z);
    removeItemBody(it); it.mesh.visible = false; it.gone = true;
    const R0 = 0.65;
    for (const o of items) {
      if (o === it || !o.body || o.t === 'balloon') continue;
      const q = o.body.translation(); const d = new T.Vector3(q.x - c.x, q.y - c.y + 0.05, q.z - c.z); const L = d.length();
      if (L > R0) continue;
      const k = Math.pow(1 - L / R0, 0.6) * 5.5; // 가까울수록 세게(최대 5.5m/s)
      d.normalize(); d.y = Math.abs(d.y) + 0.45; d.z -= 0.35; d.normalize();
      const m = o.body.mass();
      o.body.applyImpulse({ x: d.x * m * k, y: d.y * m * k, z: d.z * m * k }, true);
      const w = m * 0.004 * k;
      o.body.applyTorqueImpulse({ x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * w, z: (Math.random() - 0.5) * w }, true);
      o.touched = G.t;
    }
    for (const o of items) if (o.t === 'balloon' && !o.downed && o.body) { const q = o.body.translation(); if (Math.hypot(q.x - c.x, q.y - c.y, q.z - c.z) < R0) pop(o); }
    burst(c, 110, [0xffd24a, 0xff5a3a, 0xffffff, 0x5ad8ff, 0xff7ad8], 3.6, 0.018);
    flashAt(c, 1.4);
    AU.boom(); G.shake = 0.8;
    S.booms++;
    setDown(it);
  }
  function pop(it) {
    if (it.downed) return;
    world.removeRigidBody(it.body); it.body = null; it.mesh.visible = false; it.str.visible = false;
    const p = it.mesh.position;
    burst(p, 16, [SC.balloonCols[(it.d.i + it.d.j * 3) % SC.balloonCols.length]], 1.4, 0.016);
    AU.pop();
    setDown(it);
    S.balloons++;
  }
  function removeItemBody(it) {
    if (it.joint) { world.removeImpulseJoint(it.joint, true); it.joint = null; }
    if (it.body) { world.removeRigidBody(it.body); it.body = null; }
  }

  // ---------- 알갱이(한 덩어리 Points) ----------
  const PN = 400;
  const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN);
  const pGeo = new T.BufferGeometry();
  pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
  const pts = new T.Points(pGeo, new T.PointsMaterial({ size: 0.024, map: SC.glowTex, blending: T.AdditiveBlending, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  pts.frustumCulled = false; SC.scene.add(pts);
  for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -50;
  let pNext = 0;
  const _c = new T.Color();
  function burst(at, n, cols, sp, size) {
    for (let k = 0; k < n; k++) {
      const i = pNext; pNext = (pNext + 1) % PN;
      pPos[i * 3] = at.x; pPos[i * 3 + 1] = at.y; pPos[i * 3 + 2] = at.z;
      const a = Math.random() * 6.28, e = Math.random() * 1.4 - 0.2, s = sp * (0.3 + Math.random() * 0.7);
      pVel[i * 3] = Math.cos(a) * Math.cos(e) * s; pVel[i * 3 + 1] = Math.sin(e) * s + 0.6; pVel[i * 3 + 2] = Math.sin(a) * Math.cos(e) * s;
      _c.setHex(cols[k % cols.length]); pCol[i * 3] = _c.r * 1.6; pCol[i * 3 + 1] = _c.g * 1.6; pCol[i * 3 + 2] = _c.b * 1.6;
      pLife[i] = 0.8 + Math.random() * 0.8;
    }
  }
  function stepParticles(dt) {
    for (let i = 0; i < PN; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      if (pLife[i] <= 0) { pPos[i * 3 + 1] = -50; continue; }
      pVel[i * 3 + 1] -= 6 * dt;
      pVel[i * 3] *= 0.985; pVel[i * 3 + 2] *= 0.985;
      pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      if (pPos[i * 3 + 1] < SC.PIT_Y) { pPos[i * 3 + 1] = SC.PIT_Y; pVel[i * 3 + 1] *= -0.3; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }
  // 터지는 빛(스프라이트 하나)
  const boomFlash = new T.Sprite(new T.SpriteMaterial({ map: SC.glowTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffe0a0 }));
  boomFlash.visible = false; SC.scene.add(boomFlash);
  let flashT = 0;
  function flashAt(p, s) { boomFlash.position.copy(p); boomFlash.scale.setScalar(s); boomFlash.visible = true; flashT = 0.35; }

  // ---------- 점수 글자(떠오름) ----------
  const labels = [];
  for (let i = 0; i < 14; i++) labels.push({ s: SC.makeLabel(), t: 0 });
  let labN = 0;
  function floatText(p, text, col) { const L = labels[labN]; labN = (labN + 1) % labels.length; L.s.userData.draw(text, col); L.s.position.copy(p); L.s.visible = true; L.t = 1.1; L.y0 = p.y; }
  function stepLabels(dt) {
    for (const L of labels) { if (!L.s.visible) continue; L.t -= dt; L.s.position.y += dt * 0.18; L.s.material.opacity = Math.min(1, L.t * 2); if (L.t <= 0) L.s.visible = false; }
  }

  // ---------- 넘어감 ----------
  const WORDS = ['', '', 'DOUBLE', 'TRIPLE', 'GREAT', 'GREAT', 'AMAZING'];
  function setDown(it) {
    if (it.downed) return;
    it.downed = true;
    M.left--;
    const shot = M.lastShot;
    let bonus = 0;
    if (shot && G.t - shot.t < 4) {
      shot.downs++;
      if (shot.downs > S.best) S.best = shot.downs;
      const w = WORDS[Math.min(shot.downs, 6)];
      if (w && shot.word !== w) { shot.word = w; bigWord(w, 'combo'); AU.praise(shot.downs); raccoonMood('shock'); }
      bonus = shot.downs >= 2 ? shot.downs - 1 : 0;
    }
    const v = it.val + bonus;
    M.earn += v; S.coins += v;
    if (it.t === 'can') S.cans++;
    if (it.t === 'duck') {
      S.ducks++;
      // 실제 사격장처럼 뒤로 탁 젖혀져 레일 밑으로 내려간다(넘어진 채 다시 돌아 나오지 않게)
      it.flipT = 0; it.flipA = hingeAngle(it); it.flipY = it.mesh.position.y;
      removeItemBody(it);
    }
    const p = it.mesh.position.clone(); p.y += 0.12;
    floatText(p, '+' + v, bonus ? '#ffb0f0' : '#ffe066');
    AU.down(shot ? shot.downs : 0);
    hud();
    if (M.left <= 0) M.clearAt = G.t + 0.9;
  }

  // ---------- 한 걸음 ----------
  const _q = new T.Quaternion(), _v = new T.Vector3(), _u = new T.Vector3(), FWD = new T.Vector3(0, 0, -1), _ax = new T.Vector3(1, 0, 0);
  function hingeAngle(it) { const r = it.body.rotation(); _q.set(r.x, r.y, r.z, r.w); _u.set(0, 1, 0).applyQuaternion(_q); return Math.atan2(_u.z, _u.y); }
  function stepWorld(dt) {
    // 움직이는 것들(수레·풍선)은 물리 한 걸음마다 다음 자리를 준다
    acc += dt;
    let n = 0;
    while (acc >= DT && n < 8) {
      M.pt += DT;
      for (const it of items) {
        if (it.t === 'duck' && it.carrier) {
          const d = it.d, span = 3.5;
          let x = it.x0 + d.dir * d.speed * M.pt;
          x = ((((x + span / 2) % span) + span) % span) - span / 2;
          const cp = it.carrier.translation();
          if (Math.abs(x - cp.x) > 1) { // 한 바퀴: 옆벽 뒤에서 순간 이동
            it.carrier.setTranslation({ x, y: cp.y, z: cp.z }, true);
            if (it.body) { const bp = it.body.translation(); it.body.setTranslation({ x, y: bp.y, z: bp.z }, true); } // 맞아서 몸을 뗀 오리는 수레만
          } else it.carrier.setNextKinematicTranslation({ x, y: cp.y, z: cp.z });
        } else if (it.t === 'balloon' && it.body) {
          const d = it.d;
          const mx = d.move ? Math.sin(M.pt * 0.9 * Math.abs(d.move) + (d.move < 0 ? 3.14 : 0)) * 0.32 : 0;
          const bob = Math.sin(M.pt * 1.7 + it.ph) * 0.015;
          it.body.setNextKinematicTranslation({ x: it.ax + mx + Math.sin(M.pt * 1.1 + it.ph) * 0.012, y: it.ay + 0.3 + bob, z: it.az });
          it.curAx = it.ax + mx;
        }
      }
      world.step(eq);
      eq.drainCollisionEvents(onCollide);
      eq.drainContactForceEvents(onForce);
      while (later.length) later.shift()();
      acc -= DT; n++;
    }
    if (n === 8) acc = 0;
  }
  const later = []; // 몸을 지우는 일은 이벤트를 다 읽은 뒤에
  function onCollide(h1, h2, started) {
    if (!started) return;
    const a = byCol.get(h1), b = byCol.get(h2);
    if (!a || !b) return;
    const pr = a.proj ? a.proj : b.proj ? b.proj : null;
    const other = a.proj ? b : a;
    if (!pr) return;
    if (other.item) {
      const it = other.item;
      if (it.t === 'balloon') { later.push(() => pop(it)); return; }
      if (!pr.hit) { pr.hit = true; }
      const lv = pr.body ? pr.body.linvel() : { x: 10, y: 0, z: 0 }; const sp = Math.hypot(lv.x, lv.y, lv.z);
      AU.hit(it.t, Math.min(1, sp / 25));
      if (it.t === 'boom') later.push(() => explode(it));
      it.touched = G.t;
    } else if (other.stat || other.shard) {
      if (!pr.hit) { pr.hit = true; M.misses++; }
      AU.thud(0.25);
    }
  }
  function onForce(e) {
    const a = byCol.get(e.collider1()), b = byCol.get(e.collider2());
    const f = e.totalForceMagnitude();
    for (const o of [a, b]) {
      if (!o) continue;
      const other = o === a ? b : a;
      if (o.item && !o.item.gone) {
        const it = o.item, v = Math.min(1, f / 60);
        if (it.t === 'can' && other && other.stat && f > 25 && it.body && it.body.translation().y < it.baseY) { AU.drop(v); continue; }
        if (it.t === 'bottle' && f > 95) { later.push(() => shatter(it, f)); continue; }
        if (it.t === 'boom' && f > 70) { later.push(() => explode(it)); continue; }
        if (it.t === 'duck') continue; // 오리는 레일에 늘 스친다: 총알에 맞을 때만 소리(onCollide)
        if (f > 6) { if (it.t === 'can') AU.can(v * 0.8); else if (it.t === 'bottle') AU.glass(v); else if (it.t === 'popper') AU.ding(v * 0.7); else AU.wood(v); }
      } else if (o.shard && f > 2) AU.glass(Math.min(0.5, f / 40));
    }
  }

  // 물리 몸 → 그림, 그리고 넘어짐 판정
  function syncAndJudge(dt) {
    for (const it of items) {
      if (!it.body) continue;
      const p = it.body.translation(), r = it.body.rotation();
      it.mesh.position.set(p.x, p.y, p.z); it.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      if (it.t === 'duck') { const c = it.carrier.translation(); it.foot.position.set(c.x, c.y - 0.006, c.z); }
      if (it.t === 'balloon') {
        const a = it.str.geometry.attributes.position;
        const kx = p.x, ky = p.y - 0.1;
        a.setXYZ(0, it.curAx != null ? it.curAx : it.ax, it.ay, it.az); a.setXYZ(1, (kx + (it.curAx != null ? it.curAx : it.ax)) / 2 + Math.sin(G.t * 2 + it.ph) * 0.01, (ky + it.ay) / 2, it.az); a.setXYZ(2, kx, ky, p.z);
        a.needsUpdate = true;
        continue;
      }
      if (it.downed || M.prep) continue;
      let down = false;
      if (it.t === 'duck' || it.t === 'popper') down = hingeAngle(it) < (it.t === 'duck' ? -0.5 : -0.75);
      else {
        _q.set(r.x, r.y, r.z, r.w); _u.set(0, 1, 0).applyQuaternion(_q);
        // 야시장 규칙: 깡통은 선반에서 떨어져야 인정(누워 있으면 한 번 더 쏴서 밀어낸다). 병·나무 핀은 쓰러지면 인정
        down = p.y < it.baseY - 0.05;
        if (it.t === 'pin' || it.t === 'bottle') { _q.set(r.x, r.y, r.z, r.w); _u.set(0, 1, 0).applyQuaternion(_q); if (Math.abs(_u.y) < 0.5) down = true; }
      }
      if (down) setDown(it);
    }
    for (const it of items) {
      if (it.flipT == null || !it.mesh.visible) continue;
      it.flipT += dt;
      const k = Math.min(1, it.flipT / 0.35), e = k * k;
      const c = it.carrier.translation();
      it.mesh.position.set(c.x, it.flipY - e * 0.3, c.z);
      it.mesh.quaternion.setFromAxisAngle(_ax, it.flipA + (-1.57 - it.flipA) * Math.min(1, k * 1.6));
      it.foot.position.set(c.x, c.y - 0.006 - e * 0.3, c.z);
      if (k >= 1) { it.mesh.visible = false; it.foot.visible = false; }
    }
    for (const o of shards) { if (!o.body) continue; const p = o.body.translation(), r = o.body.rotation(); o.mesh.position.set(p.x, p.y, p.z); o.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
    for (let i = projs.length - 1; i >= 0; i--) {
      const pr = projs[i];
      if (!pr.body) continue;
      pr.t += dt;
      const p = pr.body.translation(), v = pr.body.linvel();
      pr.mesh.position.set(p.x, p.y, p.z);
      const sp = Math.hypot(v.x, v.y, v.z);
      if (!pr.hit && sp > 3) { _v.set(v.x, v.y, v.z).normalize(); pr.mesh.quaternion.setFromUnitVectors(FWD, _v); }
      else { const r = pr.body.rotation(); pr.mesh.quaternion.set(r.x, r.y, r.z, r.w); }
      if (sp > 8 && pr.t < 0.5) { pr.streak.visible = true; pr.streak.position.copy(pr.mesh.position); pr.streak.quaternion.setFromUnitVectors(FWD, _v.set(v.x, v.y, v.z).normalize()); pr.streak.scale.set(1, 1, Math.min(0.35, sp * 0.012)); }
      else pr.streak.visible = false;
      if (pr.t > 8 || p.y < -1) { removeProj(pr); projs.splice(i, 1); }
    }
    for (let i = shards.length - 1; i >= 0; i--) { const o = shards[i]; o.t += dt; if (o.t > 12) { world.removeRigidBody(o.body); SC.scene.remove(o.mesh); shards.splice(i, 1); } }
  }

  // ---------- 판 끝 판정 ----------
  function judge() {
    if (!M || M.over) return;
    if (M.clearAt && G.t >= M.clearAt) { stageClear(); return; }
    if (M.ammo > 0 || M.queue.length || M.left <= 0) return;
    // 총알을 다 썼다: 잠잠해질 때까지(최대 5초) 기다렸다가
    const since = G.t - M.lastShotT;
    let moving = false;
    for (const it of items) {
      if (!it.body || it.downed || it.t === 'balloon') continue;
      const w = it.body.angvel(), v = it.body.linvel();
      const lin = it.t === 'duck' ? 0 : Math.hypot(v.x, v.y, v.z);
      if (lin > 0.08 || Math.hypot(w.x, w.y, w.z) > 0.4) { moving = true; break; }
    }
    for (const p of projs) { if (!p.body) continue; const v = p.body.linvel(); if (p.t < 2.5 && Math.hypot(v.x, v.y, v.z) > 0.6) { moving = true; break; } }
    if ((since > 1.4 && !moving) || since > 5) stageFail();
  }

  // ============================================================
  //  판 흐름
  // ============================================================
  function clearAll() {
    for (const it of items) { SC.scene.remove(it.mesh); for (const p of it.parts) SC.scene.remove(p); }
    items.length = 0;
    for (const p of projs) SC.scene.remove(p.mesh), SC.scene.remove(p.streak);
    projs.length = 0;
    for (const o of shards) SC.scene.remove(o.mesh);
    shards.length = 0;
    for (let i = 0; i < PN; i++) { pLife[i] = 0; pPos[i * 3 + 1] = -50; }
    newWorld();
  }
  const stars = (m) => { const k = m.ammo / m.ammo0; return k >= 0.5 ? 3 : k >= 0.25 ? 2 : 1; };
  function startStage(n) {
    n = Math.max(1, Math.min(LAST, n));
    if (prizeShow) { SC.gunScene.remove(prizeShow.g); prizeShow = null; $('prizeWin').hidden = true; gunGroup.visible = true; }
    clearAll();
    if (document.documentElement.classList.contains('touch')) aimNdc.set(0, 0.15); // 폰: 판마다 조준점을 가운데로
    const def = window.STAGES[n - 1];
    const ammo0 = def.ammo + S.ammoLv;
    const bang = Math.random() * 6.283, bmag = 0.5 + Math.random() * 0.5;
    M = { bias: { x: Math.cos(bang) * bmag, y: Math.sin(bang) * bmag }, n, def, ammo: ammo0, ammo0, left: 0, earn: 0, shotIdx: 0, lastShot: null, lastShotT: 0, coolUntil: 0, queue: [], pt: 0, over: false, clearAt: 0, misses: 0 };
    let lab = 0;
    for (const d of def.items) { if (d.lab == null) d.lab = lab++; spawn(d); }
    M.left = items.length;
    // 쌓인 것들이 자리 잡게 몇 걸음 미리 돌린다(눈에 안 보이게)
    M.prep = true;
    for (let i = 0; i < 30; i++) { world.step(eq); eq.drainCollisionEvents(() => {}); eq.drainContactForceEvents(() => {}); }
    syncAndJudge(0);
    M.prep = false;
    G.state = 'play';
    document.body.classList.add('playing');
    $('title').hidden = true; $('end').hidden = true;
    SC.signDraw('STAGE ' + n, '900 150px ' + TITLE_FONT);
    setGun(S.gun);
    hud();
    raccoonMood('idle');
    showStageIntro(n);
  }
  function stageClear() {
    if (M.over) return;
    M.over = true;
    const st = stars(M);
    const prev = S.stars[M.n] || 0;
    if (st > prev) S.stars[M.n] = st;
    const bonus = 20 + M.n * 5 + M.ammo * 10;
    S.coins += bonus; M.earn += bonus;
    S.clears++;
    const firstTime = S.stage === M.n;
    if (firstTime && S.stage < LAST) S.stage = M.n + 1;
    // 경품: 짝수 스테이지를 처음 깨면 하나(11개), 마지막은 대왕 곰
    let prize = -1;
    if (M.n % 2 === 0) { const idx = M.n === LAST ? 11 : M.n / 2 - 1; if (!S.prizes.includes(idx)) { S.prizes.push(idx); prize = idx; } }
    save();
    AU.clear();
    bigWord('CLEAR', 'clear');
    raccoonMood('grumble');
    burst(new T.Vector3(0, 1.6, -2.2), 70, [0xffd24a, 0xff5a3a, 0x5ad8ff, 0x7aff8a, 0xff7ad8], 2.6, 0.02);
    setTimeout(() => {
      checkMis();
      if (prize >= 0) showPrize(prize, () => (prize === 11 ? showEnding() : showEnd(true, st, bonus)));
      else showEnd(true, st, bonus);
    }, 1300);
  }
  function stageFail() {
    if (M.over) return;
    M.over = true;
    save();
    AU.fail();
    raccoonMood('laugh');
    setTimeout(() => { AU.laugh(); }, 250);
    setTimeout(() => showEnd(false, 0, 0), 1100);
  }
  function showEnd(win, st, bonus) {
    G.state = 'end';
    $('eTitle').textContent = win ? 'CLEAR' : 'GAME OVER';
    $('eTitle').className = win ? 'win' : 'lose';
    const sw = $('eStars'); sw.innerHTML = '';
    for (let i = 0; i < 3; i++) { const s = document.createElement('i'); s.className = win && i < st ? 'on' : ''; sw.appendChild(s); }
    sw.hidden = !win;
    $('eCoins').textContent = '+' + M.earn;
    $('eNext').hidden = !win || M.n >= LAST;
    $('eRetry').hidden = false;
    $('eRetry').classList.toggle('main', !win);
    $('end').hidden = false;
    hud();
  }

  // ---------- 경품 받기: 총 장면 가운데에 인형이 돌며 나온다 ----------
  let prizeShow = null;
  function showPrize(idx, done) {
    G.state = 'prize';
    const g = SC.makePrize(idx);
    // 가로로 넓은 화면은 왼쪽에 인형, 오른쪽에 글자·단추
    const split = innerWidth / innerHeight > 1.5;
    $('prizeWin').classList.toggle('split', split);
    const halfW = Math.tan((SC.gunCam.fov * Math.PI) / 360) * 1.1 * SC.gunCam.aspect;
    g.position.set(split ? -0.45 * halfW : 0, split ? -0.17 : -0.2, -1.1);
    $('word').classList.remove('show');
    SC.gunScene.add(g);
    prizeShow = { g, t: 0, idx };
    gunGroup.visible = false;
    $('pzName').textContent = L_(SC.PRIZES[idx].name);
    $('prizeWin').hidden = false;
    AU.prize(); AU.grumble();
    raccoonMood('sad');
    if (SC.prizeHang[idx]) SC.prizeHang[idx].g.visible = SC.prizeHang[idx].l.visible = false;
    if (idx === 11) SC.kingBear.visible = false;
    $('pzOk').onclick = () => { AU.click(); $('prizeWin').hidden = true; SC.gunScene.remove(g); prizeShow = null; gunGroup.visible = true; done(); };
  }
  function showEnding() {
    G.state = 'ending';
    S.ended = 1; save();
    $('ending').hidden = false;
    const cf = $('confetti'); cf.innerHTML = '';
    const cols = ['#ffd24a', '#ff5a3a', '#5ad8ff', '#7aff8a', '#ff7ad8'];
    for (let i = 0; i < 40; i++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = cols[i % 5]; e.style.animationDelay = Math.random() * 3 + 's'; e.style.animationDuration = 2.4 + Math.random() * 2 + 's'; cf.appendChild(e); }
    AU.prize();
  }
  function syncPrizeWall() {
    SC.prizeHang.forEach((h, i) => { h.g.visible = h.l.visible = !S.prizes.includes(i); });
    SC.kingBear.visible = !S.prizes.includes(11);
  }

  // ---------- 너구리 사장 ----------
  const RC = SC.raccoon;
  function raccoonMood(m) { RC.mood = m; RC.t = 0; }
  function stepRaccoon(dt) {
    RC.t += dt;
    const t = G.t, k = RC.t;
    let hx = 0, hz = 0, hy = 1.14, aL = 0.25, aR = 0.25, aLx = 0, aRx = 0, mouth = 0.1;
    hx = Math.sin(t * 1.3) * 0.04; hz = Math.sin(t * 0.9) * 0.03;
    if (RC.mood === 'laugh' && k < 2.4) { hy += Math.abs(Math.sin(k * 16)) * 0.02; hx = -0.25 + Math.sin(k * 16) * 0.05; aL = 1.2 + Math.sin(k * 16) * 0.2; aR = 0.4; aRx = -1.2; mouth = 1; }
    else if (RC.mood === 'shock' && k < 0.8) { aL = 2.4; aR = 2.4; hy += 0.02; mouth = 0.8; hx = 0.15; }
    else if (RC.mood === 'grumble' && k < 2) { hz = Math.sin(k * 12) * 0.25; aL = 0.4; aR = 0.4; aLx = -0.8; aRx = -0.8; hx = 0.2; }
    else if (RC.mood === 'sad' && k < 3.5) { hx = 0.35; aL = 0.1; aR = 0.1; hy -= 0.03; }
    else if (RC.mood !== 'idle' && k > 3.5) RC.mood = 'idle';
    const e = 1 - Math.exp(-dt * 12);
    RC.head.rotation.x += (hx - RC.head.rotation.x) * e;
    RC.head.rotation.z += (hz - RC.head.rotation.z) * e;
    RC.head.position.y += (hy - RC.head.position.y) * e;
    RC.arms[0].rotation.z += (-aL - RC.arms[0].rotation.z) * e;
    RC.arms[1].rotation.z += (aR - RC.arms[1].rotation.z) * e;
    RC.arms[0].rotation.x += (aLx - RC.arms[0].rotation.x) * e;
    RC.arms[1].rotation.x += (aRx - RC.arms[1].rotation.x) * e;
    RC.mouth.scale.y += (mouth - RC.mouth.scale.y) * e;
    RC.tail.rotation.y = Math.sin(t * 2.2) * 0.18;
    RC.body.scale.y = 1 + Math.sin(t * 2) * 0.01;
  }

  // ============================================================
  //  총(오른쪽 아래) · 조준 · 반동
  // ============================================================
  let gunGroup = new T.Group(), gunModel = null;
  SC.gunScene.add(gunGroup);
  const GUN_HOME = new T.Vector3(0.235, -0.2, -0.38);
  gunGroup.position.copy(GUN_HOME);
  let recoil = 0, reload = 0;
  function setGun(i) {
    if (gunModel) gunGroup.remove(gunModel);
    gunModel = SC.makeGun(i);
    gunModel.scale.setScalar(0.8);
    gunGroup.add(gunModel);
  }
  function kick(k) {
    recoil = Math.min(1.5, recoil + 0.6 * k);
    reload = 0.001;
    for (const c of gunModel.userData.corks) c.visible = false;
    const m = gunModel.userData.muzzles[0].clone(); gunModel.localToWorld(m);
    SC.flash.position.copy(m); SC.flash.visible = true; SC.flash.userData.t = 0.06;
    SC.flash.scale.setScalar(0.05 + 0.03 * k);
    G.shake = Math.max(G.shake, 0.04 * k);
  }
  const aimNdc = new T.Vector2(0.15, 0.1), aimPt = new T.Vector3(0, 1.1, -2);
  const ray = new T.Raycaster();
  let rayTargets = null;
  function aimAt(nx, ny) {
    aimNdc.set(nx, ny);
    ray.setFromCamera(aimNdc, SC.camera);
    if (!rayTargets) rayTargets = [SC.booth];
    const list = rayTargets.concat(items.filter((it) => !it.gone && it.mesh.visible).map((it) => it.mesh));
    const hit = ray.intersectObjects(list, true).find((h) => h.object.type === 'Mesh');
    if (hit) aimPt.copy(hit.point); else aimPt.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 4);
    return aimPt;
  }
  const _g = new T.Vector3();
  function stepGun(dt) {
    recoil = Math.max(0, recoil - dt * 6);
    if (reload) { reload += dt; if (reload > 0.3) { reload = 0; if (M && M.ammo > 0) for (const c of gunModel.userData.corks) { c.visible = true; c.scale.setScalar(0.3); } } }
    for (const c of gunModel.userData.corks) if (c.scale.x < 1) c.scale.setScalar(Math.min(1, c.scale.x + dt * 5));
    // 총이 조준점을 본다: 조준 방향을 총 카메라 공간으로
    const an = aimedNdc(aimNdc.x, aimNdc.y); _g.set(an.x, an.y, 0.5).unproject(SC.gunCam).sub(SC.gunCam.position).normalize().multiplyScalar(3).add(SC.gunCam.position);
    const back = recoil * 0.05;
    gunGroup.position.set(GUN_HOME.x + Math.sin(G.t * 1.6) * 0.002, GUN_HOME.y + Math.sin(G.t * 2.1) * 0.002 - recoil * 0.01, GUN_HOME.z + back);
    const tgt = gunGroup.position.clone().multiplyScalar(2).sub(_g);
    gunGroup.lookAt(tgt);
    gunGroup.rotateX(recoil * 0.16);
    if (SC.flash.visible) { SC.flash.userData.t -= dt; if (SC.flash.userData.t <= 0) SC.flash.visible = false; }
  }

  // ---------- 입력: 누른 자리로 쏜다(PC 는 마우스, 폰은 손가락) ----------
  const cv = $('cv'), cross = $('cross');
  const toNdc = (e) => [(e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1];
  // PC: 마우스가 조준점, 누르면 쏜다. 폰: 대고 있으면 손가락 위에 조준점, 떼면 쏜다
  let touchAim = null; // { id }
  const TOUCH_UP = 56; // 폰 조준점은 손가락보다 이만큼 위(px)
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { const n = toNdc(e); aimNdc.set(n[0], n[1]); showCross = true; }
    else if (touchAim && e.pointerId === touchAim.id) { const n = toNdcXY(e.clientX, e.clientY - TOUCH_UP); aimNdc.set(n[0], n[1]); }
  });
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (G.state !== 'play' || G.paused) return;
    if (e.pointerType === 'mouse') { const n = toNdc(e); aimNdc.set(n[0], n[1]); fire(n[0], n[1]); return; }
    touchAim = { id: e.pointerId };
    const n = toNdcXY(e.clientX, e.clientY - TOUCH_UP); aimNdc.set(n[0], n[1]); showCross = true;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  const endTouch = (e, shoot) => {
    if (!touchAim || e.pointerId !== touchAim.id) return;
    touchAim = null;
    if (shoot && G.state === 'play') fire(aimNdc.x, aimNdc.y);
    setTimeout(() => { if (!touchAim) showCross = false; }, 350);
  };
  cv.addEventListener('pointerup', (e) => endTouch(e, true));
  cv.addEventListener('pointercancel', (e) => endTouch(e, false));
  const toNdcXY = (x, y) => [(x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1];
  let showCross = false;
  // 조준점 그리기: 매 프레임 손 떨림을 더한 자리
  let aimingNow = false;
  function stepCross() {
    // 쏘는 중일 때만 마우스 화살표를 숨긴다(경품·결과·일시정지 화면에선 보이게)
    const aiming = G.state === 'play' && !G.paused && !(M && M.over);
    if (aiming !== aimingNow) { aimingNow = aiming; document.body.classList.toggle('aiming', aiming); }
    const on = aiming && showCross;
    cross.hidden = !on;
    if (!on) return;
    const a = aimedNdc(aimNdc.x, aimNdc.y);
    cross.style.transform = 'translate(' + ((a.x + 1) / 2) * innerWidth + 'px,' + ((1 - a.y) / 2) * innerHeight + 'px)';
  }

  // ---------- 폰 조작: 조이스틱으로 조준점을 옮기고 쏘기 단추로 쏜다 ----------
  const root = document.documentElement;
  const setTouch = () => { if (!root.classList.contains('touch')) root.classList.add('touch'); };
  try { if (matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window) setTouch(); } catch (e) {}
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') setTouch(); }, true);
  const pad = $('pad'), knob = $('knob'), fireBtn = $('fireBtn');
  const stick = { id: null, x: 0, y: 0 };
  const padMove = (e) => {
    const r = pad.getBoundingClientRect(), R = r.width * 0.36;
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    stick.x = dx / R; stick.y = dy / R;
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  };
  const padEnd = (e) => { if (e.pointerId !== stick.id) return; stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault(); AU.unlock();
    stick.id = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (er) {}
    padMove(e);
  });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) padMove(e); });
  pad.addEventListener('pointerup', padEnd);
  pad.addEventListener('pointercancel', padEnd);
  fireBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); AU.unlock();
    fireBtn.classList.add('on');
    if (G.state === 'play' && !G.paused) fire(aimNdc.x, aimNdc.y);
  });
  const fireUp = () => fireBtn.classList.remove('on');
  fireBtn.addEventListener('pointerup', fireUp);
  fireBtn.addEventListener('pointercancel', fireUp);
  fireBtn.addEventListener('pointerleave', fireUp);
  // 가운데 근처는 천천히(정밀 조준), 끝까지 밀면 빨리. 가로·세로 화면 속도를 같게
  const STICK_SPEED = 0.95;
  function stepPad(dt) {
    if (!root.classList.contains('touch') || !aimingNow) return;
    showCross = true;
    if (stick.id === null) return;
    const m = Math.hypot(stick.x, stick.y); if (m < 0.06) return;
    const k = STICK_SPEED * Math.pow(m, 1.7) / m * dt;
    aimNdc.x = Math.max(-0.92, Math.min(0.92, aimNdc.x + stick.x * k));
    aimNdc.y = Math.max(-0.85, Math.min(0.8, aimNdc.y - stick.y * k * (innerWidth / innerHeight)));
  }
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && G.state === 'play') { e.preventDefault(); fire(aimNdc.x, aimNdc.y); }
    else if (e.code === 'KeyR' && (G.state === 'play' || G.state === 'end') && M) { AU.click(); startStage(M.n); }
    else if ((e.code === 'KeyP' || e.code === 'Escape') && G.state === 'play') setPause(!G.paused);
  });

  // ============================================================
  //  HUD · 글자
  // ============================================================
  const TITLE_FONT = "'Round', 'Ria', sans-serif";
  function hud() {
    $('coins').textContent = S.coins;
    $('stageN').textContent = M ? M.n : S.stage;
    const box = $('ammo');
    if (M) {
      const n0 = M.ammo0;
      if (box.childElementCount !== n0 || box.dataset.n0 != n0) { box.innerHTML = ''; for (let i = 0; i < n0; i++) box.appendChild(document.createElement('i')); box.dataset.n0 = n0; }
      [...box.children].forEach((c, i) => c.classList.toggle('used', i >= M.ammo));
      box.classList.toggle('many', n0 > (innerWidth < 900 ? 10 : 16));
      $('ammoN').textContent = M.ammo;
      $('ammoPill').classList.toggle('low', M.ammo <= 2);
    }
  }
  function bigWord(w, cls) {
    const el = $('word');
    el.textContent = L_(w); el.className = cls || '';
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(bigWord.t); bigWord.t = setTimeout(() => el.classList.remove('show'), cls === 'clear' ? 1200 : 750);
  }
  function showStageIntro(n) {
    const el = $('intro');
    el.innerHTML = '<b>STAGE ' + n + '</b>' + (n === LAST ? '<small>FINAL</small>' : '');
    el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    clearTimeout(showStageIntro.t); showStageIntro.t = setTimeout(() => (el.hidden = true), 1400);
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 2700);
  }
  function setPause(v) {
    G.paused = v; AU.paused = v;
    $('pauseCover').hidden = !v;
  }

  // ============================================================
  //  화면: 타이틀 · 상점 · 스테이지 · 경품 · 미션
  // ============================================================
  // 넘치는 단추만 글자를 줄인다(배치는 그대로, 영문 긴 낱말용)
  function fitBtns() {
    for (const el of document.querySelectorAll('.menu .btn, #ask .btn, #end .btn')) {
      el.style.fontSize = '';
      let f = parseFloat(getComputedStyle(el).fontSize), n = 0;
      while (el.scrollWidth > el.clientWidth + 1 && f > 9 && n++ < 30) { f -= 1; el.style.fontSize = f + 'px'; }
    }
  }
  addEventListener('resize', () => setTimeout(fitBtns, 60));
  function goTitle() {
    setTimeout(fitBtns, 60);
    G.state = 'title'; M && (M.over = true);
    clearAll(); M = null;
    document.body.classList.remove('playing');
    $('end').hidden = true; $('title').hidden = false; $('pauseCover').hidden = true; G.paused = false; AU.paused = false;
    $('tStage').textContent = 'STAGE ' + S.stage;
    SC.signDraw(L_('사격장'), '900 150px ' + TITLE_FONT);
    syncPrizeWall();
    cross.hidden = true;
    hud();
  }
  function openSheet(id) { AU.click(); $(id).hidden = false; if (id === 'shop') drawShop(); if (id === 'stages') drawStages(); if (id === 'prizes') drawPrizes(); if (id === 'missions') drawMis(); }
  document.querySelectorAll('.sheet .close').forEach((b) => (b.onclick = () => { AU.click(); b.closest('.sheet').hidden = true; if (G.state === 'title') $('tStage').textContent = 'STAGE ' + S.stage; }));
  function drawShop() {
    $('shopCoins').textContent = S.coins;
    const grid = $('shopGrid'); grid.innerHTML = '';
    SC.GUNS.forEach((D, i) => {
      const own = S.guns.includes(i), on = S.gun === i, gd = GUN[i];
      const c = document.createElement('div'); c.className = 'card' + (on ? ' on' : '') + (own ? '' : ' lock');
      c.innerHTML = '<canvas width="240" height="110"></canvas><div class="bn">' + L_(D.name) + '</div><div class="spec">' + specOf(gd) + '</div>';
      const b = document.createElement('button');
      if (on) { b.textContent = L_('사용 중'); b.disabled = true; }
      else if (own) { b.textContent = L_('장착'); b.onclick = () => { AU.click(); S.gun = i; save(); drawShop(); }; }
      else { b.innerHTML = '<span class="cn"></span>' + gd.price; b.disabled = S.coins < gd.price; b.onclick = () => { if (S.coins < gd.price) return; S.coins -= gd.price; S.guns.push(i); S.gun = i; AU.coin(); save(); checkMis(); drawShop(); }; }
      c.appendChild(b); grid.appendChild(c);
      drawGunIcon(c.querySelector('canvas'), i);
    });
    // 탄 늘리기
    const c = document.createElement('div'); c.className = 'card ammoCard';
    c.innerHTML = '<div class="bigAmmo"><i></i><b>+' + S.ammoLv + '</b></div><div class="bn">' + L_('탄 +1') + '</div><div class="spec">' + S.ammoLv + ' / ' + AMMO_UP.length + '</div>';
    const b = document.createElement('button');
    if (S.ammoLv >= AMMO_UP.length) { b.textContent = 'MAX'; b.disabled = true; }
    else { const pr = AMMO_UP[S.ammoLv]; b.innerHTML = '<span class="cn"></span>' + pr; b.disabled = S.coins < pr; b.onclick = () => { if (S.coins < pr) return; S.coins -= pr; S.ammoLv++; AU.coin(); save(); drawShop(); hud(); }; }
    c.appendChild(b); grid.appendChild(c);
    hud();
  }
  function specOf(g) { const pw = Math.round(g.m * g.v * g.n * 40); return 'POWER ' + pw; }
  // 3D 모형을 작은 그림으로(한 번 그려 두고 다시 쓴다)
  const snapCache = {};
  const snapScene = new T.Scene();
  snapScene.add(new T.HemisphereLight(0xfff0e0, 0x302030, 1.1));
  const sl = new T.DirectionalLight(0xffffff, 2.2); sl.position.set(0.6, 1, 1); snapScene.add(sl);
  snapScene.environment = SC.scene.environment;
  function snapshot(key, obj, w, h, camPos, look, fov) {
    if (snapCache[key]) return snapCache[key];
    const R = SC.renderer, pr = R.getPixelRatio();
    const rt = new T.WebGLRenderTarget(w * 2, h * 2, { samples: 4 });
    rt.texture.colorSpace = T.SRGBColorSpace;
    const c = new T.PerspectiveCamera(fov || 30, w / h, 0.01, 10);
    c.position.copy(camPos); c.lookAt(look);
    snapScene.add(obj);
    const bg = snapScene.background; snapScene.background = null;
    R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(snapScene, c); R.setRenderTarget(null);
    const buf = new Uint8Array(w * 2 * h * 2 * 4);
    R.readRenderTargetPixels(rt, 0, 0, w * 2, h * 2, buf);
    snapScene.remove(obj); snapScene.background = bg; rt.dispose();
    const cvs = document.createElement('canvas'); cvs.width = w * 2; cvs.height = h * 2;
    const x = cvs.getContext('2d'), img = x.createImageData(w * 2, h * 2);
    for (let y = 0; y < h * 2; y++) img.data.set(buf.subarray((h * 2 - 1 - y) * w * 2 * 4, (h * 2 - y) * w * 2 * 4), y * w * 2 * 4);
    x.putImageData(img, 0, 0);
    snapCache[key] = cvs;
    return cvs;
  }
  function drawGunIcon(canvas, i) {
    const g = SC.makeGun(i); g.rotation.y = -Math.PI / 2; g.rotation.x = 0.12;
    // 크기에 맞춰 가운데로
    g.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3());
    g.position.sub(c);
    const dist = (sz.x * 0.55) / Math.tan((15 * Math.PI) / 180) / (240 / 110);
    const src = snapshot('gun' + i, g, 240, 110, new T.Vector3(0, 0.02, dist + 0.1), new T.Vector3(0, 0, 0), 30);
    const x = canvas.getContext('2d'); x.clearRect(0, 0, canvas.width, canvas.height); x.drawImage(src, 0, 0, canvas.width, canvas.height);
  }
  function drawPrizeIcon(canvas, i) {
    const g = SC.makePrize(i); if (i === 11) g.scale.setScalar(1); g.rotation.y = -0.3;
    const src = snapshot('pz' + i, g, 150, 150, new T.Vector3(0, 0.16, 0.75), new T.Vector3(0, 0.13, 0), 30);
    const x = canvas.getContext('2d'); x.clearRect(0, 0, canvas.width, canvas.height); x.drawImage(src, 0, 0, canvas.width, canvas.height);
  }
  function drawStages() {
    const grid = $('stageGrid'); grid.innerHTML = '';
    for (let n = 1; n <= LAST; n++) {
      const b = document.createElement('button'); const open = n <= S.stage;
      b.className = 'sbtn' + (open ? '' : ' lock') + (n % 2 === 0 ? ' gift' : '');
      const st = S.stars[n] || 0;
      b.innerHTML = '<b>' + n + '</b><span class="st">' + [0, 1, 2].map((k) => '<i class="' + (k < st ? 'on' : '') + '"></i>').join('') + '</span>';
      if (open) b.onclick = () => { AU.click(); $('stages').hidden = true; startStage(n); };
      else b.disabled = true;
      grid.appendChild(b);
    }
    $('starSum').textContent = starSum() + ' / ' + LAST * 3;
  }
  function drawPrizes() {
    const grid = $('prizeGrid'); grid.innerHTML = '';
    SC.PRIZES.forEach((P, i) => {
      const got = S.prizes.includes(i);
      const c = document.createElement('div'); c.className = 'pcard' + (got ? ' got' : '') + (i === 11 ? ' king' : '');
      c.innerHTML = '<canvas width="150" height="150"></canvas><div class="bn">' + (got ? L_(P.name) : '?') + '</div><div class="spec">STAGE ' + (i === 11 ? LAST : (i + 1) * 2) + '</div>';
      grid.appendChild(c);
      drawPrizeIcon(c.querySelector('canvas'), i);
    });
    $('prizeCount').textContent = S.prizes.length + ' / 12';
  }
  function drawMis() {
    const list = $('misList'); list.innerHTML = '';
    let done = 0;
    for (const m of MIS) {
      const ok = !!S.mis[m.id]; if (ok) done++;
      const v = Math.min(m.n, m.v());
      const r = document.createElement('div'); r.className = 'mis' + (ok ? ' ok' : '');
      r.innerHTML = '<span class="ck">' + (ok ? '✔' : '') + '</span><span class="mn">' + L_(m.name) + '</span><span class="pg">' + v + ' / ' + m.n + '</span><span class="mr"><span class="cn"></span>' + m.r + '</span>';
      list.appendChild(r);
    }
    $('misCount').textContent = done + ' / ' + MIS.length;
  }

  // ---------- 단추 ----------
  const on = (id, f) => ($(id).onclick = (e) => { AU.unlock(); AU.click(); f(e); });
  on('bStart', () => startStage(S.stage));
  on('bStages', () => openSheet('stages'));
  on('bShop', () => openSheet('shop'));
  on('bPrize', () => openSheet('prizes'));
  on('bMis', () => openSheet('missions'));
  // 처음부터 다시 하기: 게임 모양 확인 창 → 기록을 지우고 새로 연다(소리 설정은 남긴다)
  const askOpen = (v) => { $('ask').hidden = !v; };
  on('bReset', () => { askOpen(true); fitBtns(); });
  on('askNo', () => askOpen(false));
  on('askYes', () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); });
  $('ask').addEventListener('click', (e) => { if (e.target === $('ask')) askOpen(false); });
  addEventListener('keydown', (e) => { if ($('ask').hidden) return; if (e.code === 'Escape') askOpen(false); else if (e.code === 'Enter') $('askYes').click(); });
  on('eNext', () => startStage(M.n + 1));
  on('eRetry', () => startStage(M.n));
  on('eShop', () => openSheet('shop'));
  on('eHome', () => goTitle());
  on('tPause', () => setPause(!G.paused));
  on('pResume', () => setPause(false));
  on('pHome', () => goTitle());
  on('endOk', () => { $('ending').hidden = true; goTitle(); });
  const togs = () => { $('tBgm').classList.toggle('off', !AU.bgm); $('tSnd').classList.toggle('off', !AU.snd); };
  on('tBgm', () => { AU.setBgm(!AU.bgm); togs(); });
  on('tSnd', () => { AU.setSnd(!AU.snd); togs(); });
  togs();
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.paused) setPause(true); });

  // ---------- 화면 맞추기 ----------
  function layout() {
    const tb = $('topbar');
    SC.view.top = tb ? tb.getBoundingClientRect().bottom - 6 : 0;
    SC.view.bottom = 0;
    SC.fitCamera();
  }
  addEventListener('resize', layout);

  // ============================================================
  //  루프
  // ============================================================
  let lastT = performance.now();
  function update(dt) {
    G.t += dt;
    // 카메라: 타이틀 ↔ 게임 사이를 부드럽게
    const want = G.state === 'title' || G.state === 'loading' ? 0 : 1;
    if (Math.abs(SC.camK - want) > 0.001) SC.setCam(SC.camK + Math.sign(want - SC.camK) * Math.min(Math.abs(want - SC.camK), dt / 0.9));
    if (M && !G.paused && (G.state === 'play' || G.state === 'end' || G.state === 'prize')) {
      while (M.queue.length && M.queue[0].at <= G.t) M.queue.shift().fn();
      stepWorld(dt);
      syncAndJudge(dt);
      if (G.state === 'play') judge();
    }
    stepParticles(dt);
    stepLabels(dt);
    stepRaccoon(dt);
    stepPad(dt);
    stepGun(dt);
    stepCross();
    if (flashT > 0) { flashT -= dt; boomFlash.material.opacity = Math.max(0, flashT / 0.35); boomFlash.scale.multiplyScalar(1 + dt * 2); if (flashT <= 0) boomFlash.visible = false; }
    if (prizeShow) { prizeShow.t += dt; const k = Math.min(1, prizeShow.t * 2.2); prizeShow.g.rotation.y = prizeShow.t * 1.4; prizeShow.g.position.y += Math.cos(prizeShow.t * 2) * 0.0003; const s = (prizeShow.idx === 11 ? 1.05 : 1.6) * (k < 1 ? 1 - Math.pow(1 - k, 3) * 1 + Math.sin(k * 9) * 0.1 * (1 - k) : 1); prizeShow.g.scale.setScalar(s); }
    // 흔들림
    const cam = SC.camera;
    if (G.shake > 0) { G.shake = Math.max(0, G.shake - dt * 2.2); cam.position.set(SC.camBase.x + (Math.random() - 0.5) * G.shake * 0.05, SC.camBase.y + (Math.random() - 0.5) * G.shake * 0.05, SC.camBase.z); }
    else if (SC.camBase) cam.position.copy(SC.camBase);
    // 알전구 반짝임(번짐 점 크기만)
    SC.bulbGlow.material.size = 0.19 + Math.sin(G.t * 5.1) * 0.012;
  }
  function render() {
    const R = SC.renderer;
    R.clear();
    R.render(SC.scene, SC.camera);
    if (G.state === 'play' || G.state === 'prize') { R.clearDepth(); R.render(SC.gunScene, SC.gunCam); }
  }
  // 한 프레임에서 오류가 나도 다음 프레임은 계속 돈다(예전엔 오류 하나로 게임이 통째로 멈췄다)
  let errN = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    try { update(dt); render(); } catch (e) { if (errN++ < 5) console.error('FRAME ERR', (e && e.stack) || e); }
  }

  // ---------- 시작 ----------
  // 글꼴은 1.5초까지만 기다린다(첫 로딩에 안 끝나는 경우가 있다)
  try { await Promise.race([Promise.all([document.fonts.load('900 100px Round'), document.fonts.load('40px Ria')]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  newWorld();
  setGun(S.gun);
  layout();
  goTitle();
  SC.setCam(0);
  // 처음 나오는 재질을 미리 한 번 그려 둔다(첫 발 끊김 방지)
  (function warm() {
    const tmp = [];
    const add = (m) => { m.position.set(0, 1.2, -2); SC.scene.add(m); tmp.push(m); };
    add(new T.Mesh(SC.canGeo, SC.canMats[0])); add(new T.Mesh(SC.bottleGeo, SC.bottleMats[0])); add(new T.Mesh(SC.duckGeo, SC.duckMat));
    add(new T.Mesh(SC.popperGeo, SC.popperMats)); add(new T.Mesh(SC.balloonGeo, SC.balloonMats[0])); add(new T.Mesh(SC.pinGeo, SC.pinMat));
    add(new T.Mesh(SC.boomGeo, SC.boomMat)); add(new T.Mesh(SC.corkGeo, SC.corkMat)); add(new T.Mesh(SC.shards[0].geo, SC.shardMats[0]));
    add(new T.Mesh(SC.pelletGeo, SC.pelletMat)); add(new T.Mesh(SC.ballGeo, SC.ballMat)); add(new T.Mesh(SC.duckFoot, SC.duckFootMat)); add(new T.Mesh(SC.popperFoot, SC.popperEdge));
    const s1 = new T.Mesh(streakGeo, streakMat); add(s1);
    // 숨겨 둔 것(점수 글자·폭발 빛·총구 불꽃)도 한 번은 보이게 해서 셰이더를 미리 만든다
    const hid = [boomFlash, SC.flash].concat(labels.map((L) => L.s));
    hid.forEach((o) => (o.visible = true));
    SC.renderer.compile(SC.scene, SC.camera); SC.renderer.compile(SC.gunScene, SC.gunCam);
    render();
    hid.forEach((o) => (o.visible = false));
    // 조준 광선·총알 물리도 한 번 돌려 둔다(첫 발 멈칫 방지)
    aimAt(0, 0); aimAt(0.3, -0.2);
    const pj = launch('cork', new T.Vector3(0, 1.3, 0.6), new T.Vector3(0, 0, -20), 0.005, null);
    for (let i = 0; i < 20; i++) { world.step(eq); eq.drainCollisionEvents(() => {}); eq.drainContactForceEvents(() => {}); }
    syncAndJudge(0.016);
    removeProj(pj); projs.length = 0;
    for (const m of tmp) SC.scene.remove(m);
  })();
  $('loading').hidden = true;
  requestAnimationFrame(frame);

  // 시험 손잡이(미리보기 창은 rAF 가 안 돌아서 손으로 프레임을 돌린다)
  window.__sg = {
    G, S, get M() { return M; }, items, projs, SC, world: () => world,
    tick(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); render(); },
    start: startStage, title: goTitle, fire, aimAt, swayNow: () => swayDeg(G.t),
    setCanWeight(v) { CAN_WEIGHT = v; }, setDen(b, p) { BOT_DEN = b; PIN_DEN = p; },
    fireRaw(from, vel, m) { launch('cork', from, vel, m, null); }, // 시험용: 흔들림 없이 한 점에
    fireAtItem(it, dy) { const p = it.mesh.position.clone(); p.y += dy || 0; const v = p.clone().project(SC.camera); aimNdc.set(v.x, v.y); fire(v.x, v.y); },
    save, hud,
  };
})().catch((e) => console.error('GAME ERR', (e && e.stack) || e));
