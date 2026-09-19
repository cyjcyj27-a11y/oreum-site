// 나무블럭쌓기: 블록을 밀고 당겨 빼서 꼭대기에 올린다. 무너뜨린 쪽이 진다.
// 물리는 Rapier(Apache-2.0). 블록 두께가 조금씩 달라서 헐거운 블록이 있다.
(async function () {
  const T = THREE, RP = RAPIER;
  const $ = (id) => document.getElementById(id);
  const L_ = window.L || ((s) => s);
  await RP.init();

  // ---------- 치수 ----------
  const BL = 0.75, BW = 0.25, BH = 0.15, GAP = 0.006, PITCH = BW + GAP;
  const G = 30;
  let DT = (window.__JGP && window.__JGP.dt) || 1 / 120;
  const DENS = 1 / (BL * BW * BH); // 블록 하나 = 무게 1
  const MG = G; // 블록 하나의 무게(힘)
  const TALL = (window.__JGP && window.__JGP.tall) || 0.0075; // 두꺼운 블록이 이만큼 두껍다 (헐거운 블록이 생기는 까닭)
  const HOLD_MU = (window.__JGP && window.__JGP.mu) || 0.22; // 쥔 블록의 마찰 (손으로 살살 흔들며 뺀다)
  const LD = (window.__JGP && window.__JGP.ld) || 0.4, AD = (window.__JGP && window.__JGP.ad) || 1.5; // 서 있을 때 흔들림을 잡는 감쇠 (무너질 땐 풀어 준다)
  const POP = 0.66; // 이만큼 빠지면 손에 쥔다
  const LAST_STAGE = 30;

  // ---------- 저장 ----------
  const KEY = 'woodenblock.save';
  const S = Object.assign(
    { stage: 1, coins: 0, best: 0, skins: ['pine'], skin: 'pine', mis: {}, pulls: 0, low: 0, duo: 0, ended: 0 },
    (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })()
  );
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- 미션 12 ----------
  const MIS = [
    { id: 'p10', name: '블록 10개 빼기', r: 50, v: () => S.pulls, n: 10 },
    { id: 'p50', name: '블록 50개 빼기', r: 150, v: () => S.pulls, n: 50 },
    { id: 'p200', name: '블록 200개 빼기', r: 500, v: () => S.pulls, n: 200 },
    { id: 'g8', name: '한 판에 8개 빼기', r: 120, v: () => G_.myPulls || 0, n: 8 },
    { id: 'h22', name: '탑 22층', r: 150, v: () => S.best, n: 22 },
    { id: 'h26', name: '탑 26층', r: 400, v: () => S.best, n: 26 },
    { id: 'low', name: '맨 아래 2층에서 빼기', r: 120, v: () => S.low, n: 1 },
    { id: 's5', name: 'STAGE 5 클리어', r: 150, v: () => S.stage - 1, n: 5 },
    { id: 's15', name: 'STAGE 15 클리어', r: 500, v: () => S.stage - 1, n: 15 },
    { id: 's30', name: 'STAGE 30 클리어', r: 1500, v: () => S.stage - 1, n: 30 },
    { id: 'duo', name: '2 PLAYERS 한 판', r: 100, v: () => S.duo, n: 1 },
    { id: 'sk4', name: '블록 4종 모으기', r: 300, v: () => S.skins.length, n: 4 },
  ];
  function checkMis() {
    for (const m of MIS) {
      if (S.mis[m.id]) continue;
      if (m.v() >= m.n) {
        S.mis[m.id] = 1;
        S.coins += m.r;
        toast('🏅 ' + L_(m.name) + '  🪙+' + m.r);
        AU.coin();
      }
    }
    save();
    hud();
  }

  // ---------- 상태 ----------
  const G_ = {
    mode: 'solo', // solo | duo
    state: 'title', // title | vs | turn | drag | hand | fly | settle | ai | fall | over
    turn: 0, // 0 = 나/P1, 1 = 고양이/P2
    myPulls: 0,
    paused: false,
  };
  window.__jgState = G_;
  let world = null;
  let blocks = [], levels = [];
  let drag = null, hand = null, fly = null, settle = null, ai = null, fall = null;
  const meshes = new T.Group();
  SC.scene.add(meshes);

  // ---------- 윤곽선(고른 블록) ----------
  const outlineMat = new T.MeshBasicMaterial({ color: 0xffffff, side: T.BackSide, transparent: true, opacity: 0.5, depthWrite: false });
  const outline = new T.Mesh(new T.BufferGeometry(), outlineMat);
  outline.renderOrder = 2;
  function setOutline(b, color, op) {
    if (!b) { if (outline.parent) outline.parent.remove(outline); return; }
    if (outline.parent !== b.mesh) {
      b.mesh.add(outline);
      outline.geometry = b.mesh.geometry;
      outline.scale.set(1 + 0.03 / BL, 1 + 0.03 / b.h, 1 + 0.03 / BW);
    }
    outlineMat.color.set(color);
    outlineMat.opacity = op;
  }

  // ---------- 놓을 자리 표시 ----------
  const ghostMat = new T.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending });
  const ghostGeo = new T.BoxGeometry(BL, BH, BW);
  const ghosts = [0, 1, 2].map((s) => {
    const m = new T.Mesh(ghostGeo, ghostMat);
    m.visible = false;
    m.userData.slot = s;
    SC.scene.add(m);
    const e = new T.LineSegments(new T.EdgesGeometry(ghostGeo), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
    m.add(e);
    return m;
  });

  // ---------- 탑 만들기 ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  const Q0 = { x: 0, y: 0, z: 0, w: 1 };
  const Q1 = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

  function clearWorld() {
    for (const b of blocks) { meshes.remove(b.mesh); b.mesh.geometry.dispose(); }
    blocks = []; levels = [];
    byHandle.clear();
    if (world) world.free();
    world = null;
    drag = hand = fly = settle = ai = fall = null;
    setOutline(null);
  }

  function newWorld() {
    world = new RP.World({ x: 0, y: -G, z: 0 });
    DT = (window.__JGP && window.__JGP.dt) || DT;
    world.timestep = DT;
    const P = Object.assign({ it: 8, fr: 4, pgs: 1, nf: 200 }, window.__JGP || {});
    world.numSolverIterations = P.it;
    world.numAdditionalFrictionIterations = P.fr;
    world.numInternalPgsIterations = P.pgs;
    try { world.integrationParameters.contact_natural_frequency = P.nf; } catch (e) {}
    if (P.lu) world.lengthUnit = P.lu;
    world.createCollider(RP.ColliderDesc.cylinder(0.06, SC.TABLE_R).setTranslation(0, -0.06, 0).setFriction(0.7));
    world.createCollider(RP.ColliderDesc.cuboid(40, 0.1, 40).setTranslation(0, -5.2, 0).setFriction(0.8));
  }

  // 한 층의 두께 모양: 적어도 가운데가 두껍거나 양옆이 두꺼워야 선다
  const PATTERNS = (window.__JGP && window.__JGP.pats) || [[1, 1, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 0], [0, 1, 1]];
  let seedN = 1;
  function addBlock(h, x, y, z, o, lv, slot) {
    const body = world.createRigidBody(
      RP.RigidBodyDesc.dynamic().setTranslation(x, y, z).setRotation(o ? Q1 : Q0)
        .setLinearDamping(LD).setAngularDamping(AD).setCanSleep(true)
    );
    const col = makeCol(body, h);
    const seed = seedN++;
    const mesh = SC.makeBlock(BL, h, BW, seed, S.skin, lv);
    meshes.add(mesh);
    const b = { id: blocks.length, body, col, mesh, h, lv, slot, o, restY: y, pv: new T.Vector3(), seed };
    blocks.push(b);
    byHandle.set(col.handle, b);
    return b;
  }

  function makeCol(body, h) {
    return world.createCollider(RP.ColliderDesc.cuboid(BL / 2, h / 2, BW / 2).setDensity(DENS).setFriction(0.46).setRestitution(0.04), body);
  }
  // 손에 든 블록은 충돌체를 떼어 두고, 내려놓을 때 새로 붙인다 (충돌 그룹을 끄고 켜면 겹친 짝이 되살아나지 않는다)
  function detachCol(b) {
    if (!b.col) return;
    byHandle.delete(b.col.handle);
    world.removeCollider(b.col, false);
    b.col = null;
  }
  function attachCol(b) {
    if (b.col) return;
    b.col = makeCol(b.body, b.h);
    byHandle.set(b.col.handle, b);
  }
  function buildTower(nLv) {
    clearWorld();
    newWorld();
    let base = 0;
    for (let lv = 0; lv < nLv; lv++) {
      const o = lv % 2;
      const pat = PATTERNS[(Math.random() * PATTERNS.length) | 0];
      const row = [];
      let maxH = 0;
      for (let s = 0; s < 3; s++) {
        const h = BH + (pat[s] ? TALL : 0) + rnd(-0.0005, 0.0005);
        maxH = Math.max(maxH, h);
        const lat = (s - 1) * PITCH + rnd(-0.0015, 0.0015);
        const ax = rnd(-0.012, 0.012);
        const x = o === 0 ? ax : lat, z = o === 0 ? lat : ax;
        row.push(addBlock(h, x, base + h / 2 + 0.0004, z, o, lv, s));
      }
      levels.push(row);
      base += maxH + 0.0008;
    }
    // 가라앉히고 재운다 (첫 화면 전에)
    for (let i = 0, n = Math.round(0.7 / DT); i < n; i++) world.step();
    for (const b of blocks) { b.body.setLinvel({ x: 0, y: 0, z: 0 }, false); b.body.setAngvel({ x: 0, y: 0, z: 0 }, false); b.body.sleep(); }
    markRest();
    sync();
  }

  function markRest() {
    for (const b of blocks) b.restY = b.body.translation().y;
  }

  // ---------- 규칙 ----------
  const topLv = () => levels.length - 1;
  const full = (lv) => levels[lv] && levels[lv].every(Boolean);
  function legal(b) {
    if (b.lv == null) return false;
    const t = topLv();
    const lim = full(t) ? t : t - 1;
    return b.lv < lim;
  }
  function levelCount() {
    let n = 0;
    for (const r of levels) if (r.some(Boolean)) n++;
    return n;
  }
  // 블록이 실제로 향한 방향 (탑이 살짝 비틀려도 따라간다)
  const _qa = new T.Quaternion(), _va = new T.Vector3();
  function axisOf(b) {
    const r = b.body.rotation();
    _qa.set(r.x, r.y, r.z, r.w);
    _va.set(1, 0, 0).applyQuaternion(_qa);
    _va.y = 0;
    _va.normalize();
    return { x: _va.x, z: _va.z };
  }
  function yawOf(b) { const a = axisOf(b); return Math.atan2(-a.z, a.x); }
  // 여러 블록의 평균 방향 (길이 방향은 앞뒤가 같으므로 두 배 각으로 평균)
  function meanYaw(list) {
    let c = 0, s = 0;
    for (const b of list) { const y = yawOf(b); c += Math.cos(2 * y); s += Math.sin(2 * y); }
    return Math.atan2(s, c) / 2;
  }
  const dirOfYaw = (y) => ({ x: Math.cos(y), z: -Math.sin(y) });
  const quatOfYaw = (y) => ({ x: 0, y: Math.sin(y / 2), z: 0, w: Math.cos(y / 2) });
  // 층의 한가운데 = 위·아래 층 블록들의 가운데
  function levelCenter(lv) {
    let x = 0, z = 0, n = 0;
    for (const L of [levels[lv - 1], levels[lv + 1]]) if (L) for (const b of L) if (b) { const t = b.body.translation(); x += t.x; z += t.z; n++; }
    return n ? { x: x / n, z: z / n } : { x: 0, z: 0 };
  }

  // 놓을 자리 계산
  function placeSlots() {
    const t = topLv();
    let lv, empties;
    if (full(t)) { lv = t + 1; empties = [0, 1, 2]; }
    else { lv = t; empties = [0, 1, 2].filter((s) => !levels[t][s]); }
    const below = (levels[lv - 1] || []).filter(Boolean);
    let top = 0, cx = 0, cz = 0;
    for (const b of below) {
      const p = b.body.translation();
      top = Math.max(top, p.y + b.h / 2);
      cx += p.x; cz += p.z;
    }
    if (below.length) { cx /= below.length; cz /= below.length; }
    const o = lv % 2;
    // 아래층과 직각으로. 같은 층에 이미 놓인 게 있으면 그 방향·줄에 맞춘다
    const same = levels[lv] ? levels[lv].filter(Boolean) : [];
    // 길이 방향은 앞뒤가 같아 각이 180도 뒤집혀 나올 수 있다. 층마다 정해진 방향 가까이로 맞춰
    // 옆(칸 번호) 방향이 매번 같게 한다
    const canon = o ? Math.PI / 2 : 0;
    const near = (y) => y + Math.round((canon - y) / Math.PI) * Math.PI;
    let yaw = near(below.length ? meanYaw(below) + Math.PI / 2 : canon);
    let ax = dirOfYaw(yaw);
    let axOff = 0;
    if (same.length) {
      yaw = near(meanYaw(same));
      ax = dirOfYaw(yaw);
      const p = same[0].body.translation();
      axOff = (p.x - cx) * ax.x + (p.z - cz) * ax.z;
    }
    // 옆 방향(블록의 z축)
    const lat = { x: -ax.z, z: ax.x };
    // 같은 층 블록이 있으면 그 블록 자리에서 칸 간격으로
    let latOff = 0;
    if (same.length) {
      const b0 = same[0], p = b0.body.translation();
      latOff = (p.x - cx) * lat.x + (p.z - cz) * lat.z - (b0.slot - 1) * PITCH;
    }
    return empties.map((s) => {
      const k = latOff + (s - 1) * PITCH;
      return { lv, s, o, yaw, x: cx + ax.x * axOff + lat.x * k, z: cz + ax.z * axOff + lat.z * k, y: top + BH / 2 + 0.004 };
    });
  }

  // ---------- 동기화 ----------
  function sync() {
    for (const b of blocks) {
      const t = b.body.translation(), r = b.body.rotation();
      b.mesh.position.set(t.x, t.y, t.z);
      b.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  // ---------- 블록이 받는 무게 (위·아래 접촉 힘, 직전 걸음 기준) ----------
  const byHandle = new Map();
  function loadOn(b) {
    let top = 0, bot = 0;
    const above = [];
    world.contactPairsWith(b.col, (other) => {
      world.contactPair(b.col, other, (m, flipped) => {
        let imp = 0;
        for (let i = 0; i < m.numContacts(); i++) imp += m.contactImpulse(i);
        if (imp <= 0) return;
        const n = m.normal();
        const ny = flipped ? -n.y : n.y; // b 에서 상대 쪽
        const f = imp / DT;
        if (ny > 0.5) { top += f; const ob = byHandle.get(other.handle); if (ob) above.push([ob, f]); }
        else if (ny < -0.5) bot += f;
      });
    });
    return { top, bot, above };
  }

  // ---------- 물리 한 걸음 ----------
  function applyDrag() {
    if (!drag) return;
    const b = drag.b;
    const v = b.body.linvel();
    const d = drag.dir;
    const p = dragP(), vel = v.x * d.x + v.z * d.z;
    let F = drag.k * (drag.target - p) - drag.c * vel;
    F = Math.max(-drag.Fmax, Math.min(drag.Fmax, F));
    drag.F = F;
    // 옆으로 새는 속도는 손가락이 잡아 준다
    const lx = v.x - d.x * vel, lz = v.z - d.z * vel;
    b.body.applyImpulse({ x: d.x * F * DT - lx * 0.9, y: 0, z: d.z * F * DT - lz * 0.9 }, true);
  }
  function applyFly() {
    if (!fly) return;
    const b = fly.b;
    fly.t = Math.min(1, fly.t + DT / fly.dur);
    const k = fly.t, e = k * k * (3 - 2 * k);
    const a = fly.from, z = fly.to;
    const peak = Math.max(a.y, z.y) + 0.22;
    const y = k < 0.5 ? a.y + (peak - a.y) * Math.sin(k * Math.PI) : z.y + (peak - z.y) * Math.sin(k * Math.PI);
    b.body.setNextKinematicTranslation({ x: a.x + (z.x - a.x) * e, y, z: a.z + (z.z - a.z) * e });
    const q = new T.Quaternion().slerpQuaternions(fly.q0, fly.q1, e);
    b.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  }
  function applyHand(dt) {
    if (!hand) return;
    const b = hand.b;
    hand.t += DT;
    const k = Math.min(1, hand.t / 0.6), e = k * k * (3 - 2 * k);
    const a = hand.from, z = hand.to;
    b.body.setNextKinematicTranslation({ x: a.x + (z.x - a.x) * e, y: a.y + (z.y - a.y) * e + Math.sin(hand.t * 3) * 0.008 * e, z: a.z + (z.z - a.z) * e });
  }
  // 풀이기(솔버)는 높은 탑을 아주 느리게 미끄러뜨린다(크리프). 진짜 나무는 정지 마찰로 버티므로
  // 아주 작은 속도는 0 으로 잘라 준다. 무너질 때는 끈다.
  const Z0 = { x: 0, y: 0, z: 0 };
  function killCreep() {
    const vt = (window.__JGP && window.__JGP.vt) || 0.012, wt = (window.__JGP && window.__JGP.wt) || 0.03;
    if (window.__JGP && window.__JGP.nokill) return;
    for (const b of blocks) {
      if (drag && drag.b === b) continue;
      const body = b.body;
      if (body.isSleeping() || !body.isDynamic()) continue;
      const v = body.linvel(), w = body.angvel();
      if (v.x * v.x + v.y * v.y + v.z * v.z < vt * vt && w.x * w.x + w.y * w.y + w.z * w.z < wt * wt) {
        body.setLinvel(Z0, false);
        body.setAngvel(Z0, false);
      }
    }
  }
  function physStep() {
    applyDrag();
    applyFly();
    applyHand();
    world.step();
    if (G_.state !== 'fall') killCreep();
  }

  // ---------- 잡기·밀기 ----------
  const ray = new T.Raycaster();
  const ndc = new T.Vector2();
  function pick(x, y, list) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, SC.camera);
    const h = ray.intersectObjects(list, false);
    return h[0] || null;
  }

  // 쥔 블록이 층 한가운데서 길이 방향으로 얼마나 나왔나
  function dragP() {
    const t = drag.b.body.translation();
    return (t.x - drag.center.x) * drag.dir.x + (t.z - drag.center.z) * drag.dir.z;
  }
  function startDrag(b, Fmax, who) {
    // 쥔 블록은 돌지 않고 길이 방향으로 곧게 민다
    b.body.setEnabledRotations(false, false, false, true);
    b.col.setFriction(HOLD_MU);
    b.body.wakeUp();
    const k = Fmax / 0.1;
    drag = { b, dir: axisOf(b), center: levelCenter(b.lv), Fmax, k, c: 2 * Math.sqrt(k) * 0.8, F: 0, who };
    drag.p0 = drag.target = dragP();
    setOutline(b, who === 'ai' ? 0xffa040 : 0xffe066, 0.75);
  }
  function endDrag() {
    if (!drag) return;
    const b = drag.b;
    b.body.setEnabledRotations(true, true, true, true);
    b.col.setFriction(0.46);
    drag = null;
    AU.scrape(0);
    setOutline(null);
  }

  function popOut(b) {
    const t = b.body.translation();
    const d = drag.dir;
    const side = Math.sign(dragP()) || 1;
    const drag0 = drag;
    endDrag();
    levels[b.lv][b.slot] = null;
    if (b.lv <= 1 && G_.turn === 0 && G_.mode === 'solo') S.low++;
    b.lv = null;
    b.body.setBodyType(RP.RigidBodyType.KinematicPositionBased, true);
    detachCol(b);
    // 탑 꼭대기 옆으로 떠오른다 (놓을 자리 가까이)
    const c = drag0.center;
    const to = { x: c.x + d.x * side * 0.95, y: towerTop() + 0.2, z: c.z + d.z * side * 0.95 };
    hand = { b, from: { x: t.x, y: t.y, z: t.z }, to, t: 0 };
    G_.state = 'hand';
    AU.pop();
    if (whoIsHuman()) showGhosts(true);
    else setTimeout(aiPlace, 550);
    hideHint();
  }

  function showGhosts(on) {
    const sl = on ? placeSlots() : [];
    ghosts.forEach((g, i) => {
      const s = sl.find((q) => q.s === i);
      g.visible = !!s;
      if (s) {
        g.position.set(s.x, s.y, s.z);
        g.rotation.set(0, s.yaw, 0);
        g.userData.slot = s;
      }
    });
    if (on && sl.length) SC.cam.tyGoal = Math.max(SC.cam.tyGoal, sl[0].y - 0.55);
  }

  function placeAt(slot) {
    const b = hand.b;
    hand = null;
    showGhosts(false);
    const t = b.body.translation(), r = b.body.rotation();
    const qy = quatOfYaw(slot.yaw);
    const q1 = new T.Quaternion(qy.x, qy.y, qy.z, qy.w);
    fly = {
      b, slot, t: 0, dur: 0.5,
      from: { x: t.x, y: t.y, z: t.z },
      to: { x: slot.x, y: slot.y, z: slot.z },
      q0: new T.Quaternion(r.x, r.y, r.z, r.w), q1,
    };
    G_.state = 'fly';
    AU.click();
  }

  function landFly() {
    const { b, slot } = fly;
    fly = null;
    b.body.setBodyType(RP.RigidBodyType.Dynamic, true);
    b.body.setTranslation({ x: slot.x, y: slot.y, z: slot.z }, true);
    b.body.setRotation(quatOfYaw(slot.yaw), true);
    b.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    b.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    attachCol(b);
    b.o = slot.o;
    if (!levels[slot.lv]) levels[slot.lv] = [null, null, null];
    levels[slot.lv][slot.s] = b;
    b.lv = slot.lv; b.slot = slot.s;
    b.restY = slot.y - 0.004;
    AU.place();
    settle = { t: 0, calm: 0 };
    G_.state = 'settle';
    hud();
  }

  // ---------- 무너짐 검사 ----------
  const _q = new T.Quaternion(), _up = new T.Vector3();
  function fallen() {
    for (const b of blocks) {
      if (hand && hand.b === b) continue;
      if (fly && fly.b === b) continue;
      if (drag && drag.b === b) continue;
      const r = b.body.rotation(), t = b.body.translation();
      _q.set(r.x, r.y, r.z, r.w);
      _up.set(0, 1, 0).applyQuaternion(_q);
      if (Math.abs(_up.y) < 0.87) { window.__jgWhy = ['tilt', b.id, b.lv, G_.state, G_.turn]; return b; }
      if (t.y < b.restY - 0.075) { window.__jgWhy = ['drop', b.id, b.lv, G_.state, G_.turn, +(b.restY - t.y).toFixed(3), +t.y.toFixed(3), +b.restY.toFixed(3)]; return b; }
    }
    return null;
  }

  function startFall() {
    const loser = G_.turn;
    endDrag();
    if (hand) { const b = hand.b; hand = null; b.body.setBodyType(RP.RigidBodyType.Dynamic, true); attachCol(b); }
    if (fly) { const b = fly.b; fly = null; b.body.setBodyType(RP.RigidBodyType.Dynamic, true); attachCol(b); }
    showGhosts(false);
    ai = null;
    G_.state = 'fall';
    for (const b of blocks) { b.body.setLinearDamping(0.03); b.body.setAngularDamping(0.1); b.body.wakeUp(); }
    fall = { t: 0, loser };
    AU.crash();
    shake = 0.5;
    // 무너지는 모습이 다 보이게 한 발 물러선다
    SC.cam.tyGoal = Math.min(SC.cam.ty, 1.1);
    SC.cam.distGoal = SC.cam.dist + 1.6;
    word('와르르!', '');
    setFace(loser === 0 ? 'win' : 'lose');
  }

  // ---------- 차례 ----------
  function whoIsHuman() { return G_.mode === 'duo' || G_.turn === 0; }
  function nextTurn(first) {
    if (!first) G_.turn = 1 - G_.turn;
    markRest();
    // 차례가 바뀌면 탑 가운데로 (고양이도 보이게)
    SC.cam.tyGoal = towerTop() * 0.5;
    hud();
    pulseTurn();
    if (G_.mode === 'solo' && G_.turn === 1) {
      G_.state = 'ai';
      aiStart();
    } else {
      G_.state = 'turn';
      if (G_.mode === 'duo') word(G_.turn === 0 ? 'P1' : 'P2', '');
      maybeHint();
    }
  }

  function endTurnPlaced() {
    const t0 = G_.turn;
    if (G_.mode === 'solo' && t0 === 0) {
      G_.myPulls++;
      S.pulls++;
      S.coins += 2;
    } else if (G_.mode === 'duo') {
      S.pulls++;
      S.coins += 1;
    }
    const lc = levelCount();
    if (lc > S.best) S.best = lc;
    checkMis();
    nextTurn(false);
  }

  // ---------- 고양이 차례 ----------
  function aiSkill() {
    const s = S.stage;
    return {
      smart: Math.min(0.95, 0.28 + s * 0.03), // 헐거운 블록을 고를 확률
      safe: Math.min(0.99, 0.85 + s * 0.01), // 한쪽만 남기는 수를 피할 확률
      F: (2.6 + Math.min(4, s * 0.12)) * MG,
      tries: 2 + Math.floor(s / 4),
      speed: 0.28 + Math.min(0.12, s * 0.005),
    };
  }
  function looseOf(b) {
    const row = levels[b.lv];
    let mh = 0;
    for (const o of row) if (o) mh = Math.max(mh, o.h);
    return b.h < mh - TALL * 0.5;
  }
  function badOf(b) {
    const row = levels[b.lv];
    const rest = row.filter((o, i) => o && i !== b.slot);
    if (rest.length === 0) return true;
    if (rest.length === 1 && rest[0].slot !== 1) return true;
    return false;
  }
  function aiStart() {
    ai = { tried: new Set(), n: 0, sk: aiSkill() };
    setTimeout(aiTry, 800);
  }
  function aiTry() {
    if (!ai || G_.state !== 'ai' || G_.paused) { if (ai && G_.paused) setTimeout(aiTry, 300); return; }
    const sk = ai.sk;
    let cand = blocks.filter((b) => legal(b) && !ai.tried.has(b.id));
    if (!cand.length) { ai.tried.clear(); cand = blocks.filter(legal); }
    if (!cand.length) return;
    let pool = cand;
    if (Math.random() < sk.safe) { const p = pool.filter((b) => !badOf(b)); if (p.length) pool = p; }
    if (Math.random() < sk.smart) { const p = pool.filter(looseOf); if (p.length) pool = p; }
    // 너무 아래층은 덜 고른다
    pool.sort(() => Math.random() - 0.5);
    const b = pool[0];
    ai.tried.add(b.id);
    ai.n++;
    const last = ai.n > sk.tries;
    startDrag(b, last ? 9 * MG : sk.F, 'ai');
    const p = dragP();
    // 조금 나와 있으면 그쪽으로 마저 당긴다
    const dir = Math.abs(p) > 0.03 ? Math.sign(p) : Math.random() < 0.5 ? -1 : 1;
    ai.run = { dir, p0: p, t: 0, lastP: p, stuckT: 0 };
    setFace('think');
  }
  function aiUpdate(dt) {
    if (!ai || !ai.run || !drag || drag.who !== 'ai') return;
    const r = ai.run;
    r.t += dt;
    const b = drag.b;
    const p = dragP();
    drag.target = p + r.dir * Math.min(0.1, 0.02 + r.t * 0.1);
    drag.target = Math.max(Math.min(drag.target, p + 0.1), p - 0.1);
    const mv = Math.abs(p - r.lastP);
    r.lastP = p;
    if (mv < 0.0006) r.stuckT += dt; else r.stuckT = Math.max(0, r.stuckT - dt * 0.5);
    if (Math.abs(p) > POP) { ai.run = null; popOut(b); return; }
    if (r.stuckT > 1.1 && ai.n <= ai.sk.tries) {
      // 안 빠진다: 포기하고 다른 블록
      ai.run = null;
      endDrag();
      setFace('stuck');
      AU.meow(false);
      setTimeout(aiTry, 500);
    }
  }
  function aiPlace() {
    if (!hand || G_.state !== 'hand') return;
    const sl = placeSlots();
    let s = sl.find((q) => q.s === 1) || sl[(Math.random() * sl.length) | 0];
    // 한쪽만 남는 층을 만들지 않게: 같은 층에 옆 하나만 있으면 가운데부터
    placeAt(s);
    setFace('idle');
  }

  // ---------- 입력 ----------
  const ptrs = new Map();
  let camDrag = null, pinch = null, hoverB = null;
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      endDragHuman();
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: SC.cam.dist };
      camDrag = null;
      return;
    }
    const human = whoIsHuman() && !G_.paused;
    if (human && G_.state === 'hand') {
      const vis = ghosts.filter((g) => g.visible);
      const h = pick(e.clientX, e.clientY, vis);
      if (h) { placeAt(h.object.userData.slot); return; }
      // 빗나가도 화면에서 가까운 칸 (손가락 크기)
      let best = null, bd = 90;
      for (const g of vis) {
        const p = g.position.clone().project(SC.camera);
        const d = Math.hypot((p.x + 1) / 2 * innerWidth - e.clientX, (1 - p.y) / 2 * innerHeight - e.clientY);
        if (d < bd) { bd = d; best = g; }
      }
      if (best) { placeAt(best.userData.slot); return; }
    }
    if (human && G_.state === 'turn') {
      const h = pick(e.clientX, e.clientY, blocks.map((b) => b.mesh));
      if (h) {
        const b = blocks.find((q) => q.mesh === h.object);
        if (b && legal(b)) {
          startDrag(b, 7 * MG, 'me');
          G_.state = 'drag';
          screenAxis(e.clientX, e.clientY);
          hideHint();
          return;
        }
      }
    }
    camDrag = { x: e.clientX, y: e.clientY };
  });
  function screenAxis(x, y) {
    const b = drag.b;
    const t = b.body.translation();
    const c = new T.Vector3(t.x, t.y, t.z).project(SC.camera);
    const c2 = new T.Vector3(t.x + drag.dir.x * 0.4, t.y, t.z + drag.dir.z * 0.4).project(SC.camera);
    let dx = ((c2.x - c.x) * innerWidth) / 2, dy = (-(c2.y - c.y) * innerHeight) / 2;
    let len = Math.hypot(dx, dy);
    if (len < 40) {
      // 블록이 나를 향해 있다: 아래로 끌면 당기고 위로 밀면 민다
      const f = new T.Vector3();
      SC.camera.getWorldDirection(f);
      const away = f.x * drag.dir.x + f.z * drag.dir.z > 0 ? 1 : -1;
      dx = 0; dy = -away * 40; len = 40;
      drag.pxPer = 40 / 0.4 * 2.2;
    } else drag.pxPer = len / 0.4;
    drag.ux = dx / len; drag.uy = dy / len;
    drag.sx = x; drag.sy = y;
    drag.startP = drag.target;
  }
  cv.addEventListener('pointermove', (e) => {
    const pp = ptrs.get(e.pointerId);
    if (pp) { pp.x = e.clientX; pp.y = e.clientY; }
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      SC.cam.dist = Math.max(2.4, Math.min(11, pinch.dist * (pinch.d / d)));
      return;
    }
    if (drag && drag.who === 'me' && G_.state === 'drag') {
      const d = ((e.clientX - drag.sx) * drag.ux + (e.clientY - drag.sy) * drag.uy) / drag.pxPer;
      drag.target = drag.startP + d;
      return;
    }
    if (camDrag) {
      const dx = e.clientX - camDrag.x, dy = e.clientY - camDrag.y;
      camDrag.x = e.clientX; camDrag.y = e.clientY;
      SC.cam.yaw -= dx * 0.008;
      SC.cam.ty = SC.cam.tyGoal = clampTy(SC.cam.ty + dy * 0.006);
      return;
    }
    // 마우스 올리면 뺄 수 있는 블록 표시
    if (e.pointerType === 'mouse' && G_.state === 'turn' && whoIsHuman()) {
      const h = pick(e.clientX, e.clientY, blocks.map((b) => b.mesh));
      const b = h && blocks.find((q) => q.mesh === h.object);
      hoverB = b && legal(b) ? b : null;
      setOutline(hoverB, 0xffffff, 0.35);
      cv.style.cursor = hoverB ? 'grab' : 'default';
    }
  });
  function endDragHuman() {
    if (drag && drag.who === 'me') { endDrag(); if (G_.state === 'drag') G_.state = 'turn'; }
  }
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    endDragHuman();
    camDrag = null;
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    SC.cam.dist = Math.max(2.4, Math.min(11, SC.cam.dist * (1 + Math.sign(e.deltaY) * 0.08)));
  }, { passive: false });
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') SC.cam.yaw += 0.12;
    else if (e.key === 'ArrowRight') SC.cam.yaw -= 0.12;
    else if (e.key === 'ArrowUp') SC.cam.ty = SC.cam.tyGoal = clampTy(SC.cam.ty + 0.15);
    else if (e.key === 'ArrowDown') SC.cam.ty = SC.cam.tyGoal = clampTy(SC.cam.ty - 0.15);
    else if (e.key === 'Escape' || e.key === 'p') togglePause();
  });
  function towerTop() {
    let m = 0;
    for (const b of blocks) { const y = b.body.translation().y; if (y > m) m = y; }
    return m;
  }
  function clampTy(v) { return Math.max(0.2, Math.min(towerTop() + 0.3, v)); }

  // ---------- 첫 판 손가락 안내 ----------
  let hint = null;
  function maybeHint() {
    if (S.pulls > 0 || G_.mode !== 'solo' || G_.turn !== 0) return;
    // 헐겁고 카메라 쪽으로 끝이 보이는 블록
    let best = null, bs = -1;
    const f = new T.Vector3(); SC.camera.getWorldDirection(f);
    for (const b of blocks) {
      if (!legal(b) || !looseOf(b) || badOf(b)) continue;
      const a = axisOf(b);
      const faceOn = Math.abs(f.x * a.x + f.z * a.z);
      const mid = 1 - Math.abs(b.lv - levels.length * 0.55) / levels.length;
      const s = faceOn * 2 + mid;
      if (s > bs) { bs = s; best = b; }
    }
    if (!best) return;
    hint = { b: best, t: 0 };
    $('hand').hidden = false;
  }
  function hideHint() { hint = null; $('hand').hidden = true; }
  function hintUpdate(dt) {
    if (!hint) return;
    hint.t += dt;
    const b = hint.b;
    const t = b.body.translation();
    const a = axisOf(b);
    const f = new T.Vector3(); SC.camera.getWorldDirection(f);
    const toward = f.x * a.x + f.z * a.z > 0 ? -1 : 1; // 카메라 쪽 끝
    const k = (hint.t % 1.6) / 1.6;
    const pull = Math.min(1, Math.max(0, (k - 0.2) / 0.6));
    const ext = toward * (BL * 0.42 + pull * 0.3);
    const p = new T.Vector3(t.x + a.x * ext, t.y, t.z + a.z * ext);
    p.project(SC.camera);
    const el = $('hand');
    el.style.transform = 'translate(' + ((p.x + 1) / 2 * innerWidth) + 'px,' + ((1 - p.y) / 2 * innerHeight) + 'px)';
    el.style.opacity = k < 0.1 ? k * 10 : k > 0.85 ? (1 - k) / 0.15 : 1;
    setOutline(b, 0xffffff, 0.3 + 0.3 * Math.sin(hint.t * 6) ** 2);
  }

  // ---------- 화면 글 ----------
  let wordT = null;
  function word(s, cls) {
    const w = $('word');
    w.textContent = L_(s);
    w.className = 'on ' + (cls || '');
    clearTimeout(wordT);
    wordT = setTimeout(() => (w.className = cls || ''), 900);
  }
  function toast(s) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = s;
    $('toasts').appendChild(d);
    setTimeout(() => d.remove(), 2700);
  }
  const FACES = { idle: '🐱', think: '🐱', smug: '😼', stuck: '🙀', win: '😹', lose: '😿' };
  function setFace(k) {
    if (G_.mode !== 'solo') return;
    $('tB').textContent = FACES[k] || '🐱';
  }
  function pulseTurn() {
    const el = G_.turn === 0 ? tA : tB;
    el.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1.8)' }, { transform: 'scale(1.18)' }], { duration: 500, easing: 'ease-out' });
  }
  function hud() {
    $('coins').textContent = S.coins;
    $('stageN').textContent = S.stage;
    $('lvN').textContent = levels.length ? levelCount() : 18;
    $('tA').classList.toggle('on', G_.turn === 0);
    $('tB').classList.toggle('on', G_.turn === 1);
    $('stagePill').style.display = G_.mode === 'solo' ? '' : 'none';
  }

  // ---------- 매 프레임 ----------
  let shake = 0, creakCD = 0, smugCD = 0, calmT = 0;
  function logic(dt) {
    const st = G_.state;
    // 소리: 부딪힘 (속도가 갑자기 바뀐 블록)
    let maxV = 0;
    for (const b of blocks) {
      if (b.body.isSleeping()) { b.pv.set(0, 0, 0); continue; }
      const v = b.body.linvel();
      const dv = Math.hypot(v.x - b.pv.x, v.y - b.pv.y, v.z - b.pv.z);
      if (dv > 0.7 && !(hand && hand.b === b) && !(fly && fly.b === b)) AU.knock(Math.min(3, dv * 0.6));
      b.pv.set(v.x, v.y, v.z);
      if (!(drag && drag.b === b)) maxV = Math.max(maxV, Math.hypot(v.x, v.y, v.z));
    }
    if (drag) {
      const v = drag.b.body.linvel();
      AU.scrape(Math.abs(v.x * drag.dir.x + v.z * drag.dir.z));
      creakCD -= dt;
      if (maxV > 0.06 && creakCD <= 0) { AU.creak(maxV * 5); creakCD = 0.7; }
      if (drag.who === 'me') {
        smugCD -= dt;
        if (maxV > 0.08 && smugCD <= 0) { setFace('smug'); smugCD = 1.5; setTimeout(() => G_.state === 'drag' && setFace('idle'), 1200); }
        if (Math.abs(dragP()) > POP) popOut(drag.b);
      }
    }
    // 아무도 안 건드리고 탑이 조용하면 재운다 (깨어 있는 동안 조금씩 흘러내리는 것을 막는다)
    if ((st === 'turn' || st === 'hand' || st === 'ai') && !drag) {
      calmT = maxV < 0.02 ? calmT + dt : 0;
      if (calmT > 0.4) { for (const b of blocks) if (b.body.isDynamic() && !b.body.isSleeping()) b.body.sleep(); calmT = 0; }
    } else calmT = 0;
    if (st === 'ai') aiUpdate(dt);
    if (st === 'fly' && fly && fly.t >= 1) landFly();
    if (st === 'settle') {
      // 탑은 살짝 출렁이며 오래 흔들리므로 속도 대신 0.25초 사이 움직인 거리로 멈춤을 본다
      settle.t += dt;
      settle.w = (settle.w || 0) + dt;
      if (settle.w >= 0.25) {
        settle.w = 0;
        let mx = 0;
        const snap = blocks.map((b) => { const t = b.body.translation(); return [t.x, t.y, t.z]; });
        if (settle.snap) snap.forEach((p, i) => { const q = settle.snap[i]; if (q) mx = Math.max(mx, Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])); });
        settle.snap = snap;
        settle.calm = mx < 0.004 ? settle.calm + 1 : 0;
      }
      if ((settle.t > 0.8 && settle.calm >= 2) || settle.t > 3.5) {
        settle = null;
        for (const b of blocks) if (!b.body.isSleeping()) b.body.sleep();
        endTurnPlaced();
      }
    }
    if (['turn', 'drag', 'hand', 'fly', 'settle', 'ai'].includes(G_.state)) {
      const f = fallen();
      if (f) startFall();
    }
    if (st === 'fall') {
      fall.t += dt;
      if (fall.t > 2.6) { const l = fall.loser; fall = null; gameOver(l); }
    }
    hintUpdate(dt);
    if (hoverB && G_.state !== 'turn') hoverB = null;
    // 카메라: 제목 화면에선 천천히 돈다
    const C = SC.cam;
    if (G_.state === 'title') C.yaw += dt * 0.07;
    SC.shift += ((G_.state === 'title' ? 0.2 : 0) - SC.shift) * Math.min(1, dt * 4);
    C.ty += (C.tyGoal - C.ty) * Math.min(1, dt * 3);
    if (C.distGoal) { C.dist += (C.distGoal - C.dist) * Math.min(1, dt * 2); if (Math.abs(C.distGoal - C.dist) < 0.01) C.distGoal = 0; }
    ghostMat.opacity = 0.25 + 0.3 * Math.sin(performance.now() / 220) ** 2;
  }

  let lastT = performance.now(), acc = 0;
  function update(dt, noDraw) {
    if (!G_.paused && world) {
      acc += dt;
      let n = 0;
      while (acc >= DT && n < 5) { physStep(); acc -= DT; n++; }
      if (n === 5) acc = 0;
      logic(dt);
    }
    if (world) sync();
    SC.updateCam();
    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      SC.camera.position.x += (Math.random() - 0.5) * shake * 0.08;
      SC.camera.position.y += (Math.random() - 0.5) * shake * 0.08;
    }
    if (!noDraw) SC.render();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    update(dt);
  }

  // ---------- 판 흐름 ----------
  function baseLevels() { return G_.mode === 'solo' ? 18 : 18; }
  function camFit() {
    const h = towerTop();
    const C = SC.cam;
    C.distGoal = 0;
    // 세로 화면은 탑이 화면 높이의 8할쯤 차게 (블록을 손가락으로 누를 수 있게)
    C.dist = innerWidth / innerHeight < 0.8 ? Math.max(3.6, h * 1.5 + 0.6) : Math.max(4.2, h * 1.35 + 1.9);
    C.ty = C.tyGoal = h * 0.52;
    C.pitch = 0.2;
    C.yaw = 0.62;
  }
  function startGame(mode) {
    G_.mode = mode;
    G_.turn = 0;
    G_.myPulls = 0;
    G_.dirty = true;
    try { if (window.OG) OG.start({ mode }); } catch (e) {}
    hideAll();
    buildTower(baseLevels());
    camFit();
    document.body.classList.add('playing');
    $('tA').textContent = mode === 'solo' ? '🙂' : '🔴';
    $('tB').textContent = mode === 'solo' ? '🐱' : '🔵';
    $('vsA').textContent = $('tA').textContent;
    $('vsB').textContent = $('tB').textContent;
    $('vsS').textContent = mode === 'solo' ? 'STAGE ' + S.stage : '2 PLAYERS';
    $('vs').hidden = false;
    G_.state = 'vs';
    hud();
    const go = () => {
      if (G_.state !== 'vs') return;
      $('vs').hidden = true;
      nextTurn(true);
    };
    $('vs').onclick = go;
    setTimeout(go, 1600);
  }

  function gameOver(loser) {
    G_.state = 'over';
    const solo = G_.mode === 'solo';
    let win = false, got = 0;
    if (solo) {
      win = loser === 1;
      if (win) {
        got = 20 + S.stage * 5;
        S.coins += got;
        S.stage++;
      }
    } else {
      S.duo++;
    }
    checkMis();
    save();
    try { if (window.OG) OG.over({ result: solo ? (win ? 'WIN' : 'LOSE') : 'P' + (2 - loser) + ' WIN', score: levelCount(), stage: S.stage }); } catch (e) {}
    $('eFace').textContent = solo ? (win ? '😿' : '😹') : loser === 1 ? '🔴' : '🔵';
    const et = $('eTitle');
    et.textContent = solo ? (win ? 'WIN' : 'GAME OVER') : (loser === 1 ? 'P1' : 'P2') + ' WIN';
    et.className = solo && !win ? 'lose' : 'win';
    $('eStats').innerHTML = '<div class="stat"><i>🧱</i><b>' + levelCount() + '</b></div>' + (solo ? '<div class="stat"><i>✋</i><b>' + G_.myPulls + '</b></div>' : '');
    $('eCoins').textContent = got ? '🪙 +' + got : '';
    $('eNext').hidden = !(solo && win);
    $('eRetry').hidden = solo && win;
    $('end').hidden = false;
    if (solo && win) { AU.win(); AU.meow(false); } else if (solo) { AU.lose(); AU.meow(true); } else AU.win();
    if (solo && win && S.stage - 1 === LAST_STAGE && !S.ended) {
      S.ended = 1; save();
      setTimeout(showEnding, 1400);
    }
    hud();
  }

  function hideAll() {
    for (const id of ['title', 'end', 'shop', 'missions', 'vs', 'ending', 'pauseCover']) $(id).hidden = true;
    G_.paused = false;
  }
  function goTitle() {
    hideAll();
    endDrag();
    hideHint();
    showGhosts(false);
    document.body.classList.remove('playing');
    G_.state = 'title';
    if (!world || G_.dirty) { buildTower(18); G_.dirty = false; }
    camFit();
    SC.cam.dist *= 1.08;
    SC.cam.ty = SC.cam.tyGoal = towerTop() * 0.62;
    $('title').hidden = false;
    $('bContinue').hidden = S.stage <= 1;
    $('bStart').innerHTML = S.stage > 1 ? 'NEW GAME' : 'START';
    hud();
  }

  // ---------- 상점 ----------
  const shotCache = {};
  // 상점 그림: 본 렌더러로 화면 한 귀퉁이에 작은 탑을 그리고 바로 떠 온다 (환경맵을 같이 쓰려고)
  function skinShot(id) {
    if (shotCache[id]) return shotCache[id];
    const R = SC.renderer;
    const W = 224, H = 168;
    const sc = new T.Scene();
    sc.environment = SC.scene.environment;
    sc.add(new T.HemisphereLight(0xffe2c0, 0x4a3a30, 1.2));
    const dl = new T.DirectionalLight(0xffe0b0, 2.6); dl.position.set(-2, 4, 3); sc.add(dl);
    const g = new T.Group();
    let n = 0;
    // 3층짜리 작은 탑 + 맨 위 하나
    for (let lv = 0; lv < 3; lv++) {
      for (let s = 0; s < (lv === 2 ? 1 : 3); s++) {
        const m = SC.makeBlock(BL, BH, BW, 900 + n * 4, id, n);
        const lat = (s - 1) * PITCH;
        if (lv % 2) { m.rotation.y = Math.PI / 2; m.position.set(lat, lv * (BH + 0.004) + BH / 2, 0); }
        else m.position.set(lv === 2 ? 0.12 : 0, lv * (BH + 0.004) + BH / 2, lv === 2 ? PITCH : lat);
        g.add(m);
        n++;
      }
    }
    sc.add(g);
    g.rotation.y = 0.55;
    const cam = new T.PerspectiveCamera(30, W / H, 0.1, 20);
    cam.position.set(0.98, 0.82, 1.2);
    cam.lookAt(0, 0.19, 0);
    const pr = R.getPixelRatio();
    const size = R.getSize(new T.Vector2());
    R.setScissorTest(true);
    R.setScissor(0, 0, W / pr, H / pr);
    R.setViewport(0, 0, W / pr, H / pr);
    R.setClearColor(0x000000, 0);
    R.clear();
    R.render(sc, cam);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').drawImage(R.domElement, 0, R.domElement.height - H, W, H, 0, 0, W, H);
    R.setScissorTest(false);
    R.setViewport(0, 0, size.x, size.y);
    R.setClearColor(0x000000, 1);
    const url = c.toDataURL('image/png');
    g.traverse((o) => o.geometry && o.geometry.dispose());
    shotCache[id] = url;
    return url;
  }  function openShop() {
    $('shop').hidden = false;
    $('shopCoins').textContent = S.coins;
    const gr = $('shopGrid');
    gr.innerHTML = '';
    for (const sk of SC.SKINS) {
      const own = S.skins.includes(sk.id), on = S.skin === sk.id;
      const c = document.createElement('div');
      c.className = 'card' + (on ? ' on' : '') + (own ? '' : ' lock');
      c.innerHTML = '<img alt=""><div class="bn">' + L_(sk.name) + '</div><button></button>';
      c.querySelector('img').src = skinShot(sk.id);
      const bt = c.querySelector('button');
      if (on) { bt.textContent = L_('사용 중'); bt.disabled = true; }
      else if (own) bt.textContent = L_('장착');
      else { bt.textContent = '🪙 ' + sk.price; bt.disabled = S.coins < sk.price; }
      bt.onclick = () => {
        AU.unlock();
        if (!own) {
          if (S.coins < sk.price) return;
          S.coins -= sk.price;
          S.skins.push(sk.id);
          AU.coin();
        } else AU.click();
        S.skin = sk.id;
        for (const b of blocks) SC.reskin(b.mesh, sk.id, b.lv == null ? 0 : b.lv);
        checkMis();
        save();
        hud();
        openShop();
      };
      gr.appendChild(c);
    }
  }
  function openMis() {
    $('missions').hidden = false;
    const li = $('misList');
    li.innerHTML = '';
    let n = 0;
    for (const m of MIS) {
      const ok = !!S.mis[m.id];
      if (ok) n++;
      const d = document.createElement('div');
      d.className = 'mis' + (ok ? ' ok' : '');
      const v = Math.min(m.v(), m.n);
      d.innerHTML = '<div class="ck">' + (ok ? '✔' : '') + '</div><div class="mn">' + L_(m.name) + (ok || m.n === 1 ? '' : ' <span class="pg">' + v + '/' + m.n + '</span>') + '</div><div class="mr">🪙 ' + m.r + '</div>';
      li.appendChild(d);
    }
    $('misCount').textContent = n + ' / ' + MIS.length;
    $('misBest').textContent = S.best;
  }
  function showEnding() {
    $('end').hidden = true;
    $('ending').hidden = false;
    const cf = $('confetti');
    cf.innerHTML = '';
    const cols = ['#ffd65a', '#f0a64a', '#6fbf6a', '#ff8a8a', '#8ad0ff', '#fff'];
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = -Math.random() * 3 + 's';
      s.style.animationDuration = 2 + Math.random() * 2 + 's';
      cf.appendChild(s);
    }
    AU.win();
  }

  // ---------- 일시정지·토글 ----------
  function togglePause() {
    if (!document.body.classList.contains('playing') || G_.state === 'over') return;
    G_.paused = !G_.paused;
    $('pauseCover').hidden = !G_.paused;
    if (G_.paused) { endDragHuman(); AU.scrape(0); }
  }
  $('tPause').onclick = togglePause;
  $('pauseCover').onclick = (e) => { if (e.target.id !== 'pHome') togglePause(); };
  $('pHome').onclick = () => goTitle();
  const tg = () => { $('tBgm').classList.toggle('off', !AU.bgm); $('tSnd').classList.toggle('off', !AU.snd); };
  $('tBgm').onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); tg(); };
  $('tSnd').onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); tg(); };
  tg();

  // ---------- 단추 ----------
  const btn = (id, f) => ($(id).onclick = () => { AU.unlock(); AU.click(); f(); });
  btn('bStart', () => { if (S.stage > 1) { S.stage = 1; save(); } startGame('solo'); });
  btn('bContinue', () => startGame('solo'));
  btn('bDuo', () => startGame('duo'));
  btn('bShop', openShop);
  btn('bMis', openMis);
  btn('eNext', () => startGame(G_.mode));
  btn('eRetry', () => startGame(G_.mode));
  btn('eShop', openShop);
  btn('eHome', goTitle);
  btn('endOk', () => { $('ending').hidden = true; goTitle(); });
  document.querySelectorAll('.sheet .close').forEach((c) => (c.onclick = () => { AU.click(); c.closest('.sheet').hidden = true; hud(); }));

  // ---------- 시작 ----------
  buildTower(18);
  // 처음 나오는 윤곽선·놓을 자리 재질을 로딩 때 한 번 그려 둔다 (첫 끌기에서 멈칫하지 않게)
  setOutline(blocks[0], 0xffffff, 0.5);
  ghosts.forEach((g) => (g.visible = true));
  SC.renderer.compile(SC.scene, SC.camera);
  SC.render();
  setOutline(null);
  ghosts.forEach((g) => (g.visible = false));
  goTitle();
  $('loading').hidden = true;
  requestAnimationFrame(frame);

  // 시험 손잡이 (미리보기 창은 rAF 가 안 돈다)
  window.__jg = {
    G: G_, S, get blocks() { return blocks; }, get levels() { return levels; },
    tick(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60, window.__jgFast); },
    start: startGame, title: goTitle, build: buildTower, load: (i) => loadOn(blocks[i]), get world() { return world; }, step(n) { const t = performance.now(); for (let i = 0; i < n; i++) physStep(); return (performance.now() - t) / n; }, legal, looseOf, badOf, placeSlots, placeAt,
    grab(i, F) { const b = blocks[i]; startDrag(b, (F || 7) * MG, 'me'); G_.state = 'drag'; return b; },
    pull(d) { drag.target = drag.p0 + d; },
    release: endDragHuman,
    get drag() { return drag; }, get hand() { return hand; },
    shop: openShop, mis: openMis, fallen, towerTop, over: gameOver,
    shot(name) {
      SC.render();
      const u = SC.renderer.domElement.toDataURL('image/png');
      return fetch('/save?name=' + (name || 'shot.png'), { method: 'POST', body: u }).then((r) => r.text());
    },
  };
})();
