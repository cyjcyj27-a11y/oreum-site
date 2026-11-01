// 말벌아저씨 본체: 화면 흐름(타이틀 → 출동판 → 지령서 → 출동 → 결과), 대원 움직임·카메라·스프레이·포충망·봉투, 저장.
(function () {
  const G = (window.GAME = {});
  const $ = (id) => document.getElementById(id);
  const V = () => new THREE.Vector3();
  const DT_MAX = 1 / 20;
  // ---------- 저장 ----------
  const KEY = 'wasp.save';
  function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {} return null; }
  function fresh() { return { v: 1, next: 0, coins: 0, gear: { power: 0, range: 0, cap: 0, suit: 0, net: 0, bag: 0 }, dex: {}, gifts: {}, how: false, best: {}, stats: { kills: 0, nets: 0, nests: 0, stings: 0, ambul: 0, time: 0, found: 0 }, done: false };
  }
  G.S = loadSave() || fresh();
  // 소모품: 캔 개수·방호복 닳은 정도는 출동 사이에 이어짐(옛 저장엔 캔 3통·새 옷)
  if (G.S.cans == null) G.S.cans = 3;
  G.CAN_COST = 25; G.SUIT_FIX = 0.8; // 캔 한 통 값 · 방호복 1 고치는 값
  G.save = () => { try { localStorage.setItem(KEY, JSON.stringify(G.S)); } catch (e) {} };

  // ---------- 장비 값 ----------
  const gear = () => {
    const g = G.S.gear;
    return { power: 1 + g.power * 0.35, range: 4.0 + g.range * 0.55, canMax: 100 + (g.cap || 0) * 30, suit: 60 + g.suit * 30, net: 1.5 + g.net * 0.3, bag: 1.5 / (1 + g.bag * 0.35), spread: 0.16 };
  };
  G.gear = gear;

  // ---------- 장면 ----------
  let world = null, hero = null, npc = null, truck = null, bagPole = null, kit = null;
  const H = { p: V(), v: V(), yaw: 0, step: 0, aim: 0, pitch: 0, swing: 0, swingCD: 0, faceT: 0, hold: 0 };
  const CAM = { yaw: Math.PI, pitch: 0.18, arm: 4.1 };
  const P = { suit: 100, suitMax: 100, swell: 0, can: 100, cans: 1, combo: 0, comboT: 0, stings: 0, honeyBad: 0, t: 0, kills: 0, nets: 0, found: 0, bagged: 0 };
  G.H = H; G.CAM = CAM; G.P = P;
  let mode = 'title', mission = null, mi = 0, act = null, ended = false, sealed = [];

  G.init = function () {
    RND.init($('cv'));
    FX.init(RND.scene); FX.resize(innerHeight);
    window.addEventListener('resize', () => FX.resize(innerHeight));
    BEES.init(RND.scene);
    hero = ACT.hero(); RND.scene.add(hero);
    truck = ACT.truck(); RND.scene.add(truck); G._truck = truck;
    kit = ACT.canBox(); RND.scene.add(kit); G._kit = kit;
    // 장대 봉투(봉투 뗄 때만 보임)
    bagPole = new THREE.Group();
    // 포충망이 늘어난 모양: 같은 갈색 막대 + 끝 고리 + 그물 자루(벌집 쪽으로 열림)
    const pole = ACT.mesh(CLAY.rcyl(0.02, 0.02, 1, 0.01, 8), CLAY.mat('#a8743a', { rough: 0.45 }), 0, 0.5, 0, bagPole);
    const sack = new THREE.Group(); bagPole.add(sack);
    // 자루 바닥(뾰족)이 막대 끝, 넓은 고리가 벌집 쪽 → 벌집이 자루 속으로 들어간다
    const hoop = ACT.mesh(new THREE.TorusGeometry(0.45, 0.022, 8, 28), CLAY.mat('#d8d8d8', { rough: 0.3 }), 0, 0.9, 0, sack); hoop.rotation.x = Math.PI / 2;
    const cone = ACT.mesh(new THREE.ConeGeometry(0.45, 0.9, 18, 1, true), CLAY.mat('#e9f3ef', { rough: 0.8, side: 1, op: 0.55 }), 0, 0.45, 0, sack); cone.rotation.x = Math.PI;
    bagPole.userData.pole = pole;
    bagPole.userData.sack = sack; bagPole.visible = false; RND.scene.add(bagPole);
    IN.bindTouch();
    UI.init();
    setupWorld(0, true);
    loop.last = performance.now();
    requestAnimationFrame(loop);
  };

  function setupWorld(index, titleOnly) {
    mi = index; mission = DATA.MS[index];
    const wkey = mission.loc + '|' + mission.m;
    const rebuild = !world || world._key !== wkey;
    if (world && rebuild) { RND.scene.remove(world.group); world.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    if (npc) { RND.scene.remove(npc); npc = null; }
    sealed.forEach((s) => RND.scene.remove(s)); sealed = []; fallers.length = 0;
    BEES.reset(); FX.clear(); BEES.clearMist();
    CLAY.srand(100 + index * 7);
    if (rebuild) { world = WORLD.build(mission.loc, mission.m); world._key = wkey; RND.scene.add(world.group); }
    RND.setLight(!!world.dusk);
    BEES.food = world.food || [];
    BEES.hard = index / (DATA.MS.length - 1); // 0(첫 출동)~1(여왕)
    BEES.maxDive = 4 + Math.round(BEES.hard * 4);
    BEES.diveGap = 0.6 - 0.3 * BEES.hard;
    BEES.groundY = () => 0;
    truck.position.copy(world.truck.p); truck.rotation.y = world.truck.r;
    kit.position.copy(world.kit || world.start.clone().add(new THREE.Vector3(2.6, 0, -4))); kit.rotation.y = 0.3;
    const who = mission.who || DATA.WHO[mission.loc];
    npc = ACT.npc(who); npc.position.copy(world.npc.p); npc.rotation.y = world.npc.r || 0; RND.scene.add(npc);
    // 벌집
    mission.nests.forEach((ns) => {
      const spot = world.spots.find((s) => s.id === ns.spot) || world.spots[0];
      const n = BEES.addNest(ns, spot, world);
      if (ns.sp === 'honey') { // 양봉업자가 갖다 둔 빈 벌통(뚜껑 열림)
        const bx = ACT.mesh(CLAY.rbox(0.7, 0.55, 0.5, 0.06, 0.01, 4), CLAY.mat('#d8b070'), n.c.x + 1.0, 0.28, n.c.z + 0.6);
        const lid = ACT.mesh(CLAY.rbox(0.76, 0.08, 0.56, 0.03, 0.004, 5), CLAY.mat('#a87a40'), 0, 0.42, -0.3, bx); lid.rotation.x = -1.2;
        bx.userData.lid = lid; RND.scene.add(bx); sealed.push(bx); n.box = bx;
      }
    });
    // 대원
    H.p.copy(world.start); H.v.set(0, 0, 0); H.yaw = world.startYaw == null ? Math.PI : world.startYaw; CAM.yaw = H.yaw + Math.PI; CAM.pitch = 0.2;
    hero.position.copy(H.p); hero.rotation.y = H.yaw;
    const g = gear();
    P.suitMax = g.suit; P.suit = G.S.suitHp == null ? g.suit : Math.min(g.suit, G.S.suitHp); P.swell = 0; P.canMax = g.canMax; P.can = 0; P.cans = 0;
    if (!titleOnly) { G.S.cans--; P.can = g.canMax; G.save(); } // 손에 든 첫 캔도 가진 캔에서 하나
    P.empty = false; P.combo = 0; P.stings = 0; P.honeyBad = 0; P.t = 0; P.kills = 0; P.nets = 0; P.found = 0; P.bagged = 0;
    act = null; ended = false; bagPole.visible = false; G._endF = null;
    if (titleOnly) { CAM.yaw = 2.4; CAM.pitch = 0.12; }
    try { RND.renderer.compile(RND.scene, RND.camera); } catch (e) {}
  }
  G.setupWorld = setupWorld;

  // 캔이 0통인데 살 돈이 있으면 상점부터, 돈도 없으면 기본 캔 1통 공짜
  G.needCan = function () {
    if (G.S.cans > 0) return false;
    if (G.S.coins >= G.CAN_COST) return true;
    G.S.cans = 1; G.save(); UI.toast(L('기본 캔 1통 받음', 'FREE CAN x1')); return false;
  };
  G.startMission = function (index) {
    if (G.needCan()) { mode = 'board'; UI.hudShow(false); document.body.classList.remove('playing'); UI.noCan(); return; }
    setupWorld(index);
    mode = 'play';
    document.body.classList.add('playing');
    UI.hudShow(true);
    UI.pop(L('출동!', 'GO!'), 'big');
    try { if (window.OG) OG.start(); } catch (e) {}
    if (P.suit < P.suitMax * 0.3) UI.toast(L('방호복이 다 해졌어요 · 상점에서 수선', 'Suit is worn out · repair in the shop'));
  };
  G.mode = () => mode;
  G.setMode = (m) => { mode = m; if (m !== 'play') document.body.classList.remove('playing'); };

  // ---------- 충돌 ----------
  function collide(p, r) {
    world.cols.forEach((c) => {
      if (c.t === 'b') {
        const cx = Math.max(c.x0, Math.min(c.x1, p.x)), cz = Math.max(c.z0, Math.min(c.z1, p.z));
        const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-5) { p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
          else { // 안에 들어감: 가까운 변으로
            const m = [p.x - c.x0, c.x1 - p.x, p.z - c.z0, c.z1 - p.z], k = m.indexOf(Math.min(...m));
            if (k === 0) p.x = c.x0 - r; else if (k === 1) p.x = c.x1 + r; else if (k === 2) p.z = c.z0 - r; else p.z = c.z1 + r;
          }
        }
      } else {
        const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), rr = c.r + r;
        if (d < rr && d > 1e-5) { p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; }
      }
    });
    { const dx = p.x - kit.position.x, dz = p.z - kit.position.z, d = Math.hypot(dx, dz), rr = 0.55 + r; if (d < rr && d > 1e-5) { p.x = kit.position.x + dx / d * rr; p.z = kit.position.z + dz / d * rr; } }
    const b = world.bounds;
    p.x = Math.max(b.x0, Math.min(b.x1, p.x)); p.z = Math.max(b.z0, Math.min(b.z1, p.z));
    // 차
    const tp = truck.position, ty = truck.rotation.y, lx = Math.cos(ty) * (p.x - tp.x) - Math.sin(ty) * (p.z - tp.z), lz = Math.sin(ty) * (p.x - tp.x) + Math.cos(ty) * (p.z - tp.z);
    if (Math.abs(lx) < 1.0 + r && lz > -2.45 - r && lz < 2.25 + r) {
      const pushX = (1.0 + r) - Math.abs(lx), pushZ = Math.min(lz - (-2.45 - r), (2.25 + r) - lz);
      let nlx = lx, nlz = lz;
      if (pushX < pushZ) nlx = Math.sign(lx || 1) * (1.0 + r); else nlz = (lz - (-2.45 - r) < (2.25 + r) - lz) ? -2.45 - r : 2.25 + r;
      p.x = tp.x + Math.cos(ty) * nlx + Math.sin(ty) * nlz; p.z = tp.z - Math.sin(ty) * nlx + Math.cos(ty) * nlz;
    }
  }
  // 카메라 팔이 벽·지붕에 박히지 않게(상자 높이까지)
  function rayBoxes(o, d, maxT) {
    let best = maxT;
    world.cols.forEach((c) => {
      if (c.t !== 'b') return;
      const mn = [c.x0, 0, c.z0], mx = [c.x1, c.h, c.z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = best;
      for (let k = 0; k < 3; k++) {
        if (Math.abs(dd[k]) < 1e-6) { if (oo[k] < mn[k] || oo[k] > mx[k]) return; continue; }
        let a = (mn[k] - oo[k]) / dd[k], b = (mx[k] - oo[k]) / dd[k]; if (a > b) { const t = a; a = b; b = t; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return;
      }
      if (t0 > 0.05 && t0 < best) best = t0;
    });
    return best;
  }

  // ---------- 한 틀 ----------
  const UPV = new THREE.Vector3(0, 1, 0), poleHand = V(), poleTgt = V(), poleDir = V(), fallers = [];
  const fwd = V(), right = V(), pivot = V(), camPos = V(), aimPt = V(), nozzle = V(), sprayD = V(), chest = V(), tmp = V(), want = V(), back = V(), shv = V(), oPos = V(), netO = V(), netD = V();
  let shake = 0;
  function loop(now) {
    const dt = Math.min(DT_MAX, (now - loop.last) / 1000); loop.last = now;
    G.tick(dt);
    requestAnimationFrame(loop);
  }
  G.tick = function (dt) {
    if (mode === 'play' && !UI.paused) stepPlay(dt);
    else if (mode === 'title' || mode === 'board' || mode === 'brief') stepIdle(dt);
    else if (mode === 'result' || mode === 'over') { stepIdle(dt * 0.5); }
    if (!G.noRender) RND.render();
  };
  function stepIdle(dt) {
    // 천천히 둘러보는 카메라(타이틀·출동판 뒤 장면)
    G._idleT = (G._idleT || 0) + dt;
    const yaw = Math.sin(G._idleT * 0.12) * 0.45;   // 집 앞쪽에서만 천천히 좌우로
    const c = world.view || world.start;
    pivot.set(c.x, 1.6, c.z);
    camPos.set(c.x + Math.sin(yaw) * 13, 5.0, c.z + Math.cos(yaw) * 13);
    RND.camera.position.copy(camPos); RND.camera.lookAt(world.focus || pivot);
    RND.follow(world.focus || pivot);
    BEES.update(dt, { chest: tmp.set(999, 0, 999), spray: { on: false }, onSting() {}, onKill() {} });
    FX.update(dt);
    ACT.pose(hero, H.step, 0, 0, 0, 0);
    hero.position.copy(world.start); hero.rotation.y = H.yaw;
    npcIdle(dt);
    AU.loops(0, 0, false);
  }
  function npcIdle(dt) {
    if (!npc) return;
    const u = npc.userData, t = performance.now() * 0.001;
    u.shR.rotation.z = -0.3 - Math.max(0, Math.sin(t * 5)) * 1.6 * (npc.userData.wave || 0);
    u.shR.rotation.x = -0.4 * (npc.userData.wave || 0);
    u.body.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
    // 신고자는 대원을 바라봄
    const dx = H.p.x - npc.position.x, dz = H.p.z - npc.position.z;
    npc.rotation.y += Math.atan2(Math.sin(Math.atan2(dx, dz) - npc.rotation.y), Math.cos(Math.atan2(dx, dz) - npc.rotation.y)) * Math.min(1, dt * 2);
    npc.userData.wave = Math.max(0, (npc.userData.wave || 0) - dt * 0.2);
  }

  function stepPlay(dt) {
    IN.read();
    P.t += dt;
    const g = gear();
    // 시점
    const lk = IN.takeLook();
    CAM.yaw -= lk[0]; CAM.pitch = Math.max(-0.75, Math.min(1.15, CAM.pitch - lk[1]));
    fwd.set(-Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), -Math.cos(CAM.yaw) * Math.cos(CAM.pitch));
    right.set(Math.cos(CAM.yaw), 0, -Math.sin(CAM.yaw));
    // 움직임(화면 기준)
    const busy = act && act.lock;
    let mx = busy ? 0 : IN.mx, mz = busy ? 0 : IN.mz;
    const hf = tmp.set(-Math.sin(CAM.yaw), 0, -Math.cos(CAM.yaw));
    want.set(0, 0, 0).addScaledVector(right, mx).addScaledVector(hf, -mz);
    const swollen = P.swell > 60 ? 0.75 : 1;
    const spd = (IN.run && !IN.spray ? 5.35 : 3.15) * swollen * (IN.spray ? 0.7 : 1);
    want.multiplyScalar(spd);
    H.v.x += (want.x - H.v.x) * Math.min(1, dt * 9); H.v.z += (want.z - H.v.z) * Math.min(1, dt * 9);
    H.p.addScaledVector(H.v, dt);
    collide(H.p, 0.38);
    const sp = Math.hypot(H.v.x, H.v.z);
    H.step += dt * sp * 2.6;
    // 몸 방향: 겨누는 중이면 카메라 쪽, 아니면 가는 쪽
    const aiming = IN.spray || H.swing > 0 || (act && act.kind === 'bag');
    if (aiming) H.faceT = 0.6; else H.faceT = Math.max(0, H.faceT - dt);
    let wy = H.yaw;
    if (H.faceT > 0) wy = CAM.yaw + Math.PI; else if (sp > 0.3) wy = Math.atan2(H.v.x, H.v.z);
    let dy = wy - H.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); H.yaw += dy * Math.min(1, dt * 11);
    hero.position.copy(H.p); hero.rotation.y = H.yaw;
    // 카메라
    pivot.set(H.p.x, 1.85, H.p.z);
    back.copy(fwd).multiplyScalar(-1);
    shv.copy(right).multiplyScalar(0.85);
    const o = oPos.copy(pivot).add(shv);
    let arm = CAM.arm;
    arm = Math.min(arm, rayBoxes(o, back, arm) - 0.2);
    camPos.copy(o).addScaledVector(back, Math.max(0.6, arm));
    if (camPos.y < 0.35) camPos.y = 0.35;
    if (shake > 0) { shake = Math.max(0, shake - dt * 3); camPos.x += (Math.random() - 0.5) * shake * 0.12; camPos.y += (Math.random() - 0.5) * shake * 0.12; }
    RND.camera.position.copy(camPos);
    RND.camera.lookAt(tmp.copy(o).addScaledVector(fwd, 10));
    RND.follow(H.p);
    // 조준점: 화면 가운데 광선이 처음 닿는 곳
    const range = g.range;
    let tHit = 12;
    // 조준선이 처음 닿는 벌(카메라와 손 사이 시차 때문에, 벌을 겨눈 점으로 삼아야 줄기가 그 벌로 간다)
    for (let i = 0; i < BEES.list.length; i++) { const a = BEES.list[i]; if (!a.alive) continue; tmp.copy(a.p).sub(camPos); const al = tmp.dot(fwd); if (al < 0.5 || al > tHit) continue; if (tmp.addScaledVector(fwd, -al).length() < 0.32) tHit = al; }
    BEES.nests.forEach((n) => { if (n.removed || !n.found) return; tmp.copy(n.c).sub(camPos); const al = tmp.dot(fwd); if (al < 0) return; const pr = tmp.addScaledVector(fwd, -al).length(); if (pr < 0.4 * n.size) tHit = Math.min(tHit, al - 0.2); });
    if (fwd.y < -0.01) tHit = Math.min(tHit, (0 - camPos.y) / fwd.y);
    aimPt.copy(camPos).addScaledVector(fwd, tHit);
    // 자세·노즐
    const nozzleTarget = aimPt;
    H.aim += ((IN.spray ? 1 : 0) - H.aim) * Math.min(1, dt * 14);
    const hpitch = Math.atan2(nozzleTarget.y - 1.15, Math.hypot(nozzleTarget.x - H.p.x, nozzleTarget.z - H.p.z));
    H.pitch += (hpitch - H.pitch) * Math.min(1, dt * 12);
    if (H.swing > 0) H.swing = Math.max(0, H.swing - dt * 3.2);
    H.hold += ((act && act.kind === 'bag' ? 1 : 0) - (H.hold || 0)) * Math.min(1, dt * 12);
    ACT.pose(hero, H.step, Math.min(1, sp / 3.15), H.aim * (1 - H.hold), act && act.kind === 'bag' && act.pitch != null ? act.pitch : Math.max(-0.6, Math.min(1.2, H.pitch)), H.swing > 0 ? 1 - H.swing : 0, H.hold);
    hero.updateMatrixWorld(true);
    hero.userData.nozzle.getWorldPosition(nozzle);
    sprayD.copy(nozzleTarget).sub(nozzle).normalize();
    chest.set(H.p.x, 1.25, H.p.z);
    // 스프레이
    let spraying = false;
    if (IN.spray && !busy) {
      if (P.can > 0) { spraying = true; P.can = Math.max(0, P.can - dt * 5.5); FX.spray(nozzle, sprayD, range, g.spread, dt); if (P.can <= 0) { AU.play('empty'); UI.flashBar('can'); if (!P.empty) { P.empty = true; UI.pop(L('캔 없음', 'EMPTY'), 'red'); } } }
      else if (!G._emptyT || performance.now() - G._emptyT > 600) { G._emptyT = performance.now(); AU.play('empty'); UI.flashBar('can'); }
    }
    // 포충망
    H.swingCD -= dt;
    if (IN.takeNet() && H.swingCD <= 0 && !busy) {
      H.swing = 1; H.swingCD = 0.55; AU.play('net');
      const dir = netD.copy(fwd); dir.y *= 0.5; dir.normalize();
      const got = BEES.netCatch(netO.set(H.p.x, 1.3, H.p.z).addScaledVector(dir, 0.3), dir, g.net, 0.35);
      const bad = got.filter((a) => a.sk === 'honey').length, ok = got.length - bad;
      if (ok > 0) { P.nets += ok; G.S.stats.nets += ok; addCombo(ok); AU.play('catch', ok); got.forEach((a) => dex(a.sk)); UI.pop(ok >= 3 ? 'GREAT x' + ok : 'NICE' + (ok > 1 ? ' x' + ok : ''), ok >= 3 ? 'gold' : ''); }
    }
    // 벌
    const ctx = {
      chest, spray: { on: spraying, o: nozzle, d: sprayD, range, spread: g.spread, power: g.power },
      onSting: (dmg, a) => sting(dmg, a), onKill: (a) => onKill(a), onHoneyKill: () => honeyHurt(), onHoneyHit: () => honeyHurt(),
      onQueen: () => { AU.play('found'); UI.pop(L('여왕벌!', 'QUEEN!'), 'red'); shake = 0.8; },
      onFound: (n) => { P.found++; G.S.stats.found++; AU.play('found'); UI.pop(L('발견!', 'FOUND!'), 'gold'); shake = 0.4; },
    };
    BEES.update(dt, ctx);
    FX.update(dt);
    // 행동(E): 봉투·캔·벌통
    interact(dt, g);
    // 소리: 가까운 벌
    let near = 0, angry = 0;
    BEES.list.forEach((a) => { if (!a.alive) return; const d = a.p.distanceTo(chest); if (d < 6) { near += 1 / (1 + d * d * 0.5); if (a.state === 'attack') angry = 1; } });
    AU.loops(near, angry, spraying);
    // 콤보 시간
    if (P.comboT > 0) { P.comboT -= dt; if (P.comboT <= 0) P.combo = 0; }
    npcIdle(dt);
    UI.hud(P, BEES, aimHit(), act, g);
    for (let i = fallers.length - 1; i >= 0; i--) {
      const f = fallers[i]; f.vy -= 9.8 * dt; f.o.position.y += f.vy * dt; f.o.position.x += (f.vx || 0) * dt; f.o.position.z += (f.vz || 0) * dt; f.o.rotation.z += f.spin * dt;
      if (f.o.position.y <= f.gy) { f.o.position.y = f.gy; if (f.vy < -2) { f.vy = -f.vy * 0.3; f.spin *= 0.4; f.vx = (f.vx || 0) * 0.3; f.vz = (f.vz || 0) * 0.3; FX.dust(f.o.position, 12); AU.play('land'); } else { f.o.rotation.z *= 0.5; f.vx = f.vz = 0; fallers.splice(i, 1); } }
    }
    // 끝?
    checkEnd();
    if (G._endF) { G._endT -= dt; if (G._endT <= 0) { const f = G._endF; G._endF = null; f(); } }
  }
  function aimHit() { return BEES.aimHit(camPos, fwd, 30); }
  function addCombo(n) { P.combo += n; P.comboT = 2.2; }
  function dex(k) { if (!G.S.dex[k]) { G.S.dex[k] = 1; UI.newDex(k); } else G.S.dex[k]++; }
  function onKill(a) {
    P.kills++; G.S.stats.kills++; addCombo(1); dex(a.sk);
    AU.play('kill', P.combo);
    if (a.sk === 'queen') { UI.pop(L('여왕 처치!', 'QUEEN DOWN!'), 'gold'); shake = 0.7; }
    if (P.combo === 5) UI.pop('NICE', ''); else if (P.combo === 10) UI.pop('GREAT', 'gold'); else if (P.combo === 20) UI.pop('PERFECT', 'gold');
  }
  function honeyHurt() {
    if (!G._hb || performance.now() - G._hb > 900) { G._hb = performance.now(); P.honeyBad++; AU.play('honeyBad'); UI.pop(L('꿀벌!', 'HONEYBEE!'), 'red'); if (npc) npc.userData.wave = 1; }
  }
  function sting(dmg, a) {
    dmg *= 1.2 + 0.6 * (BEES.hard || 0);
    P.stings++; G.S.stats.stings++;
    if (P.suit > 0) { P.suit = Math.max(0, P.suit - dmg); AU.play('sting'); UI.hurt(0.35); }
    else { P.swell = Math.min(100, P.swell + dmg * 1.3); AU.play('sting'); AU.play('ouch'); UI.hurt(0.8); shake = 0.6; }
    if (P.swell >= 100 && !ended) gameOver();
  }
  // 행동
  const tagP = new THREE.Vector3(), tagUp = new THREE.Vector3(0, 0.55, 0);
  function interact(dt, g) {
    // 가장 가까운 할 일 찾기
    let best = null, bd = 99;
    BEES.nests.forEach((n) => {
      if (n.removed || !n.found) return;
      const hd = Math.hypot(n.c.x - H.p.x, n.c.z - H.p.z);
      const reach = n.spec.sp === 'honey' ? 2.6 : Math.max(2.6, g.range + 0.2); // 봉투 장대는 스프레이 닿는 거리에서 바로 씌움
      if (hd < reach && n.c.y < 4.8 && hd < bd) { bd = hd; best = { kind: n.spec.sp === 'honey' ? 'box' : 'bag', n }; }
    });
    // 차와의 거리: 차체 겉면(폭 2m·길이 4.7m)에서 잰다
    const tq = truck.position, ty = truck.rotation.y, tlx = Math.cos(ty) * (H.p.x - tq.x) - Math.sin(ty) * (H.p.z - tq.z), tlz = Math.sin(ty) * (H.p.x - tq.x) + Math.cos(ty) * (H.p.z - tq.z);
    const td = Math.hypot(Math.max(0, Math.abs(tlx) - 1.0), Math.max(0, tlz - 2.25, -2.45 - tlz)) + 1.0, kd = Math.hypot(kit.position.x - H.p.x, kit.position.z - H.p.z);
    if (!best && (td < 3.4 || kd < 1.8)) best = { kind: 'can' };
    UI.prompt(best, P, g);
    const hn = BEES.nests.find((n) => n.spec.sp === 'honey' && !n.removed);
    UI.tag(hn && !(best && best.n === hn) ? tagP.copy(hn.c).add(tagUp) : null);
    if (!act && IN.actHeld && best) {
      if (best.kind === 'can') {
        if (P.can < P.canMax && G.S.cans <= 0 && G.S.coins < G.CAN_COST) { G.S.cans = 1; UI.pop(L('기본 캔 1통', 'FREE CAN'), ''); } // 돈도 캔도 없으면 막히지 않게
        if (P.can < P.canMax && G.S.cans > 0) { G.S.cans--; G.save(); P.can = P.canMax; P.empty = false; AU.play('can'); UI.pop(L('새 캔', 'NEW CAN') + ' · ' + L('남은 캔 ', 'LEFT ') + G.S.cans, ''); }
        else { AU.play('nope'); if (G.S.cans <= 0) UI.pop(L('캔이 없어요 · 상점', 'NO CANS · SHOP'), 'red'); }
        IN.act = false; IN.padAct = false; return;
      }
      if (best.kind === 'bag' && (best.n.vigor > 0.3 || (best.n.queen && best.n.queen.alive))) { if (!G._nope || performance.now() - G._nope > 500) { G._nope = performance.now(); AU.play('nope'); best.n.shake = 1; best.n.alarm = 1; UI.flashBar('vigor'); } return; }
      act = { kind: best.kind, n: best.n, t: 0, dur: best.kind === 'box' ? 2.4 : g.bag, lock: true };
      if (best.kind === 'bag') AU.play('bagUp');
    }
    if (act) {
      if (!IN.actHeld) { act = null; bagPole.visible = false; return; }
      act.t += dt;
      const n = act.n, k = Math.min(1, act.t / act.dur);
      // 몸을 집 쪽으로
      CAM.yaw += 0; H.faceT = 0.6;
      const wy = Math.atan2(n.c.x - H.p.x, n.c.z - H.p.z); let dy = wy - H.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); H.yaw += dy * Math.min(1, dt * 10);
      if (act.kind === 'bag') {
        // 손에서 벌집 쪽으로 장대를 뻗어 올림(봉투는 끝에 달려 벌집을 감쌈)
        bagPole.visible = true;
        const hand = poleHand.set(H.p.x + Math.sin(H.yaw) * 0.45, 1.2, H.p.z + Math.cos(H.yaw) * 0.45);
        const tgt = poleTgt.set(n.c.x, n.c.y + 0.05 * n.size, n.c.z);
        const dir = poleDir.copy(tgt).sub(hand); const full = dir.length(); dir.divideScalar(full);
        const grow = Math.min(1, 0.2 + k * 1.4), sz = Math.max(0.75, n.size * 1.2) * (0.5 + 0.5 * grow);
        let hoopAt = (full + 0.5 * sz) * grow;                // 고리가 벌집 너머까지(단, 매달린 자리 위로는 안 감)
        const topY = n.spot.p.y + 0.02; if (dir.y > 0.15) hoopAt = Math.min(hoopAt, (topY - hand.y) / dir.y);
        const len = Math.max(0.4, hoopAt - 0.9 * sz);          // 막대 끝 = 자루 바닥
        bagPole.position.copy(hand); bagPole.quaternion.setFromUnitVectors(UPV, dir);
        bagPole.userData.pole.scale.y = len; bagPole.userData.pole.position.y = len / 2;
        const s = bagPole.userData.sack; s.scale.setScalar(sz); s.position.y = len;
        act.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
        n.shake = Math.max(n.shake, 0.4);
      }
      if (k >= 1) finishAct();
    }
  }
  // 출동 중 상점: 열 때 지금 방호복을 저장해 수선값에 쓰고, 닫을 때 산 것·고친 것을 몸에 반영
  G.syncGear = function (opening) {
    if (mode !== 'play') return;
    if (opening) { G.S.suitHp = Math.round(P.suit); G.save(); return; }
    const g = gear(); P.suitMax = g.suit; P.canMax = g.canMax; P.suit = Math.min(g.suit, G.S.suitHp == null ? g.suit : G.S.suitHp);
  };
  function finishAct() {
    const n = act.n;
    BEES.removeNest(n);
    if (act.kind === 'bag') {
      AU.play('bag'); shake = 0.5;
      // 집이 봉투 속으로: 집은 감추고 묶인 봉투를 땅에
      n.group.visible = false; if (n.hole) n.hole.visible = false;
      const gy = 0.3 * Math.max(0.8, n.size);
      const s = ACT.mesh(CLAY.ball(0.38 * Math.max(0.8, n.size), 16, 0.04, 9), CLAY.mat('#dfe8e2', { rough: 0.8 }), n.c.x, n.c.y, n.c.z);
      s.scale.y = 0.85;
      const knot = ACT.mesh(CLAY.ball(0.08, 8, 0.01, 3), CLAY.mat('#ff7a1c'), 0, 0.42 * Math.max(0.8, n.size), 0, s);
      RND.scene.add(s); sealed.push(s);
      // 묶인 봉투가 대원 앞 0.9m 로 포물선을 그리며 툭
      const lx = H.p.x + Math.sin(H.yaw) * 0.9 + Math.cos(H.yaw) * 0.4, lz = H.p.z + Math.cos(H.yaw) * 0.9 - Math.sin(H.yaw) * 0.4;
      const ft = Math.sqrt(2 * Math.max(0.2, n.c.y - gy) / 9.8) + 0.12;
      fallers.push({ o: s, vy: 1.2, gy, vx: (lx - n.c.x) / ft, vz: (lz - n.c.z) / ft, spin: (Math.random() - 0.5) * 3 });
      P.bagged++; G.S.stats.nests++;
      UI.pop(n.spec.sp === 'queen' ? L('여왕 제거!', 'QUEEN REMOVED!') : L('제거!', 'REMOVED!'), 'gold');
      dexNest(n);
    } else {
      AU.play('box'); UI.pop(L('벌통에 쏙!', 'BOXED!'), 'gold');
      n.group.visible = false;
      if (n.box) { n.box.userData.lid.rotation.x = 0; n.box.userData.lid.position.set(0, 0.3, 0); FX.dust(n.box.position, 8, 2); }
      dex('honey');
    }
    bagPole.visible = false; act = null;
    if (npc) npc.userData.wave = 1;
  }
  function dexNest(n) { const k = 'n_' + n.kind + (n.hidden ? '_h' : ''); if (!G.S.dex[k]) { G.S.dex[k] = 1; } }
  function checkEnd() {
    if (ended) return;
    const nestsLeft = BEES.nests.filter((n) => !n.removed).length;
    const left = BEES.hostileLeft();
    if (nestsLeft === 0 && left <= 3) {
      ended = true; BEES.flyAway(); AU.play('clear');
      G._endT = 1.3; G._endF = clear;
      UI.pop('CLEAR', 'big');
    }
  }
  function clear() {
    mode = 'result'; document.body.classList.remove('playing'); UI.hudShow(false);
    try { document.exitPointerLock(); } catch (e) {}
    const base = mission.pay;
    const noSting = P.stings === 0 ? Math.round(base * 0.3) : 0;
    const fast = P.t < 150 ? Math.round(base * 0.2) : 0;
    const honeyPen = Math.min(base, P.honeyBad * 40);
    const total = Math.max(0, base + noSting + fast - honeyPen);
    const first = G.S.next === mi;
    G.S.coins += total;
    G.S.suitHp = Math.round(P.suit);
    if (first) G.S.next = mi + 1;
    const gift = DATA.GIFT[mi]; const newGift = !G.S.gifts[mi]; G.S.gifts[mi] = 1;
    G.S.stats.time += P.t;
    const b = G.S.best[mi]; if (!b || P.t < b) G.S.best[mi] = Math.round(P.t);
    G.save();
    try { if (window.OG) OG.over({ result: mi === DATA.MS.length - 1 ? 'END' : 'CLEAR', score: mi + 1 }); } catch (e) {}
    UI.result({ base, noSting, fast, honeyPen, total, gift, newGift, mi, t: P.t, kills: P.kills, nets: P.nets, stings: P.stings, last: mi === DATA.MS.length - 1 && first });
  }
  function gameOver() {
    ended = true; act = null; bagPole.visible = false;
    G.S.stats.ambul++; G.S.suitHp = Math.round(P.suit); G.save();
    try { if (window.OG) OG.over({ result: 'DEAD', score: mi + 1 }); } catch (e) {}
    AU.play('siren'); AU.loops(0, 0, false);
    try { document.exitPointerLock(); } catch (e) {}
    UI.hudShow(false); document.body.classList.remove('playing');
    G._endT = 0.9; G._endF = () => { mode = 'over'; UI.over(); };
  }
  G.retry = () => G.startMission(mi);
  G.mi = () => mi;
})();
