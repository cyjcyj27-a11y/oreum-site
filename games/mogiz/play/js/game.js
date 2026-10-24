// 게임 흐름: 태어나기 → 날기·침 꽂기·빨기 → 맞으면 환생(카드) → 일곱 다 빨고 대야로 돌아가 알 낳기 → 엔딩.
(function () {
  const G = (window.GAME = {});
  const V3 = THREE.Vector3;
  const KEY = 'mogiz.save';
  G.mode = 'title'; G.alive = false; G.att = null; G.ts = 1; G.showAll = false;
  G.cam = { yaw: 0, pitch: 0.28, arm: 0.17 };
  G.clouds = [];
  // ---------- 저장 ----------
  function fresh() { return { life: 1, cards: [], dex: {}, deaths: 0, ul: 0, sec: 0, ended: 0, teenKilled: 0, how: 0, dodges: 0, bites: 0, hits: {}, endings: 0 }; }
  G.load = function () { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); G.S = s && s.life ? Object.assign(fresh(), s) : fresh(); } catch (e) { G.S = fresh(); } };
  G.save = function () { try { localStorage.setItem(KEY, JSON.stringify(G.S)); } catch (e) {} };
  G.hasSave = function () { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return !!(s && (s.life > 1 || s.started) && !s.ended); } catch (e) { return false; } };

  G.init = function () {
    G.load();
    RND.init(document.getElementById('cv'));
    WORLD.build(RND.scene);
    PEOPLE.build(RND.scene);
    MOSQ.build(RND.scene);
    FX.init(RND.scene);
    MOSQ.pos.copy(WORLD.spawn); MOSQ.setBelly(0);
    G.st = DATA.stats(G.S.cards, G.S.life);
    // 처음 보는 재질·그림자를 미리 한 번 그려 둔다(첫 장면 멈칫 막기)
    G.showAll = true; PEOPLE.list.forEach((c) => (c.root.visible = true));
    titleCam(0); RND.renderer.compile(RND.scene, RND.camera); RND.render(); G.showAll = false;
    G.last = performance.now(); G.t = 0;
    requestAnimationFrame(G.loop);
  };

  // ---------- 판 시작 ----------
  G.newGame = function () { const d = G.S.dex, e = G.S.endings, how = G.S.how; G.S = fresh(); G.S.dex = d; G.S.endings = e; G.S.how = how; G.save(); };
  G.startLife = function () {
    G.S.started = 1; G.st = DATA.stats(G.S.cards, G.S.life);
    PEOPLE.list.forEach((c) => c.reset());
    G.ti = 0; G.att = null; G.alive = true; G.toxin = 0; G.dashT = 0; G.boostT = 0; G.landing = null; G.detachT = 0; G.clouds.length = 0;
    G.lifeT = 0; G.ts = 1; G.home = false; G.biteCd = 0; G.biteWas = false; MOSQ.attQ = null;
    MOSQ.pos.copy(WORLD.spawn); MOSQ.vel.set(0, 0, 0); MOSQ.setBelly(0); MOSQ.yaw = 0.1;
    MOSQ.body.scale.set(1.7, 1.7, 1.7);
    G.cam.yaw = 0.12; G.cam.pitch = 0.3; G.cam.arm = 0.17;
    G.save();
    G.mode = 'hatch'; G.hatchT = 0;
    try { if (window.OG) OG.start(); } catch (e) {}
    FX.pupa(true); FX.eggs(0, WORLD.basin);
    AU.sfx('hatch');
    UI.onLife();
  };

  // ---------- 화면 고리 ----------
  G.loop = function (now) {
    requestAnimationFrame(G.loop);
    const rdt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
    G.tick(rdt);
  };
  G.tick = function (rdt) {
    if (document.body.classList.contains('paused')) { RND.render(); return; }
    const dt = rdt * G.ts; G.t += dt; PEOPLE.fr++;
    if (G.mode === 'play' || G.mode === 'hatch' || G.mode === 'dead' || G.mode === 'lay') G.S.sec += rdt;
    IN.read();
    if (G.mode === 'title' || G.mode === 'cards') titleCam(G.t);
    else if (G.mode === 'hatch') hatch(dt);
    else if (G.mode === 'play') { play(dt, rdt); RND.measure(rdt); }
    else if (G.mode === 'dead') dead(dt, rdt);
    else if (G.mode === 'lay') lay(dt);
    WORLD.update(G.t, dt);
    PEOPLE.list.forEach((c) => c.update(dt, G.t, G));
    MOSQ.pose(dt, G.t, G.att ? 'attach' : G.alive ? 'fly' : 'dead');
    FX.update(dt, rdt);
    RND.follow(MOSQ.pos);
    if (!G.noRender) RND.render();
    UI.frame(rdt);
    // 느린 동작은 천천히 돌아옴
    if (G.mode === 'play' && G.ts < 1 && !G.slowHold) G.ts = Math.min(1, G.ts + rdt * 2.2);
  };

  // 타이틀: 대야 위 모기에서 집 쪽을 보는 느린 카메라
  function titleCam(t) {
    const c = RND.camera, w = WORLD.spawn;
    // 집과 노을을 보는 카메라 앞, 오른쪽 아래에 둥실 뜬 모기
    c.position.set(w.x - 0.05 + Math.sin(t * 0.15) * 0.004, 0.36, w.z + 0.16);
    c.lookAt(w.x - 0.25, 0.62, w.z - 1.6); c.updateMatrixWorld();
    const e = c.matrixWorld.elements, k = Math.min(1, c.aspect / 1.5);
    MOSQ.pos.set(c.position.x, c.position.y, c.position.z)
      .addScaledVector(_t.set(-e[8], -e[9], -e[10]), 0.14)
      .addScaledVector(_p.set(e[0], e[1], e[2]), 0.062 * k)
      .addScaledVector(_n.set(e[4], e[5], e[6]), -0.012 + Math.sin(t * 1.7) * 0.003);
    MOSQ.vel.set(-0.02, 0, -0.2);
  }

  // ---------- 태어나기 ----------
  function hatch(dt) {
    G.hatchT += dt;
    const k = G.hatchT, w = WORLD.spawn;
    if (k < 1.3) { MOSQ.pos.set(w.x, WORLD.basin.y + 0.006, w.z); MOSQ.body.scale.set(1.7, 0.2 + k * 0.3, 1.7); }
    else { const e = Math.min(1, (k - 1.3) / 1.2); MOSQ.body.scale.setScalar(1.7); MOSQ.pos.set(w.x, WORLD.basin.y + 0.01 + e * 0.17, w.z); if (k > 1.32 && FX.pupaOn) { FX.pupa(false); FX.splash(MOSQ.pos.clone()); AU.sfx('pop'); } }
    MOSQ.vel.set(0, 0.0001, 0);
    // 카메라: 물 위 가까이 → 뒤로 빠짐
    const e = Math.min(1, k / 2.6), c = RND.camera;
    const yaw = G.cam.yaw, arm = 0.09 + e * 0.08, pt = 0.15 + e * 0.15;
    c.position.set(MOSQ.pos.x + Math.sin(yaw) * Math.cos(pt) * arm, MOSQ.pos.y + Math.sin(pt) * arm + 0.01, MOSQ.pos.z + Math.cos(yaw) * Math.cos(pt) * arm);
    c.lookAt(MOSQ.pos.x, MOSQ.pos.y + 0.01, MOSQ.pos.z);
    if (k > 2.6) { G.mode = 'play'; document.body.classList.add('playing'); IN.lock(); UI.toast(G.S.life === 1 ? L('윙~', 'Bzzz~') : L(G.S.life + '번째 환생', 'Rebirth #' + G.S.life)); }
  }

  // ---------- 놀이 ----------
  const _f = new V3(), _r = new V3(), _w = new V3(), _p = new V3(), _n = new V3(), _t = new V3();
  // 화살표가 가리킬 곳: 아직 안 빤 가장 가까운 대상(다 빨면 null → 풀숲)
  G.target = function () { let b = null, bd = 1e9; for (const c of PEOPLE.list) { if (c.done) continue; const d = c.root.position.distanceToSquared(MOSQ.pos); if (d < bd) { bd = d; b = c; } } return b; };
  G.attWorld = function (out) { const a = G.att; out.copy(a.local); a.pr.node.localToWorld(out); return out; };
  G.attNormal = function (out) { const a = G.att; out.copy(a.nl).applyQuaternion(a.pr.node.getWorldQuaternion(new THREE.Quaternion())).normalize(); return out; };

  function play(dt, rdt) {
    const st = G.st;
    G.lifeT += dt;
    // 시점
    const lk = IN.takeLook();
    G.cam.yaw -= lk[0]; G.cam.pitch = THREE.MathUtils.clamp(G.cam.pitch + lk[1], -0.75, 1.15);
    const cy = G.cam.yaw, cp = G.cam.pitch;
    G.updClouds(dt);
    // 독
    let tox = 0;
    for (const cl of G.clouds) if (MOSQ.pos.distanceTo(cl.p) < cl.r) tox += 0.85;
    if (!st.coilImmune && MOSQ.pos.distanceTo(WORLD.coil) < 0.55 && MOSQ.pos.y < 1.1) tox += 0.32;
    if (tox > 0) G.toxin += tox * st.toxin * dt; else G.toxin = Math.max(0, G.toxin - 0.22 * dt);
    if (G.toxin >= 1) { G.kill(null, 'poison'); return; }
    // 배 소화
    const sucking = G.att && G.detachT <= 0 && IN.bite;
    if (!sucking) MOSQ.setBelly(Math.max(0, MOSQ.belly - (st.digest / st.cap) * dt));
    if (G.att) attached(dt, st);
    else if (G.landing) landing(dt);
    else fly(dt, st, cy, cp);
    camFollow(dt);
    // 집으로(알 낳기)
    if (G.home && MOSQ.pos.distanceTo(WORLD.basin) < 0.32 && MOSQ.pos.y < WORLD.basin.y + 0.2) startLay();
  }

  function fly(dt, st, cy, cp) {
    const fp = cp - 0.22;
    _f.set(-Math.sin(cy) * Math.cos(fp), -Math.sin(fp), -Math.cos(cy) * Math.cos(fp));
    _r.set(Math.cos(cy), 0, -Math.sin(cy));
    G.boostT -= dt; G.dashT -= dt; G.biteCd = (G.biteCd || 0) - dt; G.dashCd = (G.dashCd || 0) - dt;
    let sp = st.speed * (1 - st.heavy * MOSQ.belly) * (G.boostT > 0 ? 1 + st.boost : 1) * (G.toxin > 0.5 ? 0.85 : 1);
    _w.set(0, 0, 0).addScaledVector(_f, -IN.mz * sp).addScaledVector(_r, IN.mx * sp);
    _w.y += IN.my * st.vert * (1 - st.heavy * MOSQ.belly * 0.5);
    if (IN.takeDash() && st.dash > 0 && G.dashCd <= 0) {
      G.dashCd = st.dashCd; G.dashT = 0.22;
      const d = _w.lengthSq() > 0.01 ? _w.clone().normalize() : _f.clone();
      MOSQ.vel.addScaledVector(d, 3.2); AU.sfx('dash'); FX.trail(MOSQ.pos.clone());
    }
    MOSQ.step(dt, _w, G.dashT > 0 ? 2 : 7);
    PEOPLE.push(MOSQ.pos, MOSQ.R, MOSQ.vel);
    // 살 찾기: 아직 다 안 빤 일곱 중 누구든(순서 없음)
    G.reticle = null;
    if (!G.home) {
      const h = PEOPLE.nearest(MOSQ.pos, st.reticle, null, true, true);
      if (h) {
        G.reticle = { c: h.c, pr: h.pr, pt: h.pt.clone(), n: h.n.clone() };
        // 누르고 있으면 고리가 뜨는 순간 꽂힘(누른 채 다가가도 됨)
        if (IN.bite && G.biteCd <= 0) { G.landing = { t: 0, from: MOSQ.pos.clone(), r: G.reticle }; AU.sfx('land'); }
      } else if (IN.bite && !G.biteWas && G.biteCd <= 0) {
        // 옷 위에서 누르면 알려 줌
        const h2 = PEOPLE.nearest(MOSQ.pos, st.reticle, null, false, true);
        if (h2) { FX.onom(L('옷!', 'CLOTHES!'), h2.pt.clone(), '#ffffff', 0.6); AU.sfx('bonk'); G.biteCd = 0.4; }
      }
    }
    G.biteWas = IN.bite;
    AU.buzz(MOSQ.vel.length() / 1.2, 1);
  }
  // 살 결 방향: 카메라가 보는 쪽을 살 면에 눕힌 것(모기 등이 카메라 쪽으로 보임)
  function tangent(n, out) {
    const cy = G.cam.yaw; out.set(-Math.sin(cy), 0, -Math.cos(cy));
    out.addScaledVector(n, -out.dot(n)); if (out.lengthSq() < 1e-4) out.set(0, 0, -1).addScaledVector(n, -n.z);
    return out.normalize();
  }
  function landing(dt) {
    const Ld = G.landing; Ld.t += dt / 0.15;
    const r = Ld.r;
    if (!Ld.tan) { Ld.tan = tangent(r.n, new V3()); Ld.from = MOSQ.pos.clone(); }
    // 살 위 자리(침 끝이 물 자리에 닿는 곳)로 내려앉음
    MOSQ.perch(r.pt, r.n, Ld.tan, 0); _p.copy(MOSQ.pos);
    MOSQ.pos.lerpVectors(Ld.from, _p, Math.min(1, Ld.t));
    if (Ld.t >= 1) {
      G.landing = null; MOSQ.attQ = null;
      if (!IN.bite) return;
      const pr = r.pr, node = pr.node;
      node.updateWorldMatrix(true, false);
      const local = node.worldToLocal(r.pt.clone());
      const q = node.getWorldQuaternion(new THREE.Quaternion()).invert();
      G.att = { c: r.c, pr, local, nl: r.n.clone().applyQuaternion(q), tl: Ld.tan.clone().applyQuaternion(q), t: 0, sucked: 0, ins: 0 };
      G.att.bump = r.c.newBump(pr, r.pt);
      G.detachT = 0; G.S.bites++;
      AU.sfx('stab'); FX.onom(L('푹', 'STAB'), r.pt.clone(), '#ffffff', 0.7);
    }
  }
  G.attTan = function (out) { const a = G.att; out.copy(a.tl).applyQuaternion(a.pr.node.getWorldQuaternion(new THREE.Quaternion())); return out; };
  function attached(dt, st) {
    const a = G.att, c = a.c;
    G.attWorld(_p); G.attNormal(_n); G.attTan(_f); _f.addScaledVector(_n, -_f.dot(_n)).normalize();
    MOSQ.vel.set(0, 0, 0);
    // 물린 자리가 부풀어 오름: 간지러울수록 크게, 환생할수록 덜 붓는다
    const sw = (0.35 + Math.min(1.3, c.itch) * 1.15) * st.swell;
    a.bump.scale.set(sw, sw * 0.85, sw);
    // 떼기: 단추를 놓으면 침을 빼고 튕김
    if (!IN.bite && G.detachT <= 0) G.detachT = 0.0001;
    if (G.detachT > 0) {
      G.detachT += dt;
      a.ins = Math.max(0, 1 - G.detachT / st.detach);
      MOSQ.perch(_p, _n, _f, a.ins); MOSQ.pos.addScaledVector(_n, (G.detachT / st.detach) * 0.003);
      MOSQ.suckFx(false, G.t, dt);
      if (G.detachT >= st.detach) pop(_n, st.pop);
      AU.suck(false); AU.buzz(0.4, 1);
      return;
    }
    // 침 꽂기(0.18초) → 빨기
    a.ins = Math.min(1, a.ins + dt / 0.18);
    MOSQ.perch(_p, _n, _f, a.ins);
    a.t += dt;
    const cap = st.cap, room = cap - MOSQ.belly * cap;
    let rate = st.suck * (st.greedy && c.itch < 0.5 ? 1 + st.greedy : 1);
    if (room <= 0.001 || c.done || a.ins < 1) rate = 0;
    const got = Math.min(rate * dt, Math.max(0, room), Math.max(0, c.D.need - c.blood));
    c.blood += got; a.sucked += got;
    // 꿀꺽꿀꺽: 배가 박자에 맞춰 부풀었다 줄었다
    const gulp = got > 0 ? Math.max(0, Math.sin(G.t * 11)) * 0.09 : 0;
    MOSQ.setBelly(Math.min(1, MOSQ.belly + got / cap), gulp);
    MOSQ.suckFx(got > 0, G.t, dt);
    G.S.ul += got * c.D.ul;
    AU.suck(got > 0); AU.buzz(0.05, 0.3);
    if (got > 0) { G.nice = (G.nice || 0) + got; if (G.nice >= 0.8) { G.nice = 0; FX.onom(L('쭈왑', 'SLURP'), _p.clone(), '#ff4060', 0.55); AU.sfx('gulp'); } }
    if (room <= 0.001 && !a.full) { a.full = 1; FX.onom(L('빵빵!', 'FULL!'), _p.clone(), '#ffd34a', 0.8); }
    if (c.blood >= c.D.need - 1e-4 && !c.done) {
      c.done = true; c.itch = 0; G.ti++;
      FX.onom('NICE!', _p.clone().add(_t.set(0, 0.08, 0)), '#ffd34a', 1.3); AU.sfx('done'); UI.done(c);
      if (G.ti >= DATA.ORDER.length) { G.home = true; setTimeout(() => UI.toast(L('풀숲으로!', 'Back to the grass!')), 900); }
      pop(_n, st.pop * 1.2);
    }
  }
  function pop(n, k) {
    const a = G.att; if (!a) return;
    G.biteCd = 0.6;
    if (a.bump) { if (a.sucked > 0.3) a.c.keepBump(a.bump); else a.c.dropBump(a.bump); }
    G.att = null; G.detachT = 0; G.landing = null; MOSQ.attQ = null; MOSQ.suckFx(false, 0, 0);
    MOSQ.vel.copy(n).multiplyScalar(k).add(_t.set(0, 0.25, 0));
    MOSQ.pos.addScaledVector(n, 0.012);
    AU.suck(false); AU.sfx('pop');
  }
  // 카메라: 상자·몸에 닿으면 팔만 줄임. 붙어 있을 땐 늘 살 바깥쪽에서 침이 보이게
  function camFollow(dt) {
    const c = RND.camera, cy = G.cam.yaw, cp = G.cam.pitch;
    let arm = G.cam.arm;
    _t.set(MOSQ.pos.x, MOSQ.pos.y + 0.012, MOSQ.pos.z);
    _w.set(Math.sin(cy) * Math.cos(cp), Math.sin(cp), Math.cos(cy) * Math.cos(cp));
    if (G.att) {
      // 붙어 있을 땐 비스듬한 옆에서: 침이 살에 꽂히고 피가 올라가는 게 보이게
      G.attNormal(_n); G.attTan(_f); _f.addScaledVector(_n, -_f.dot(_n)).normalize();
      _r.crossVectors(_n, _f).normalize(); if (_r.dot(_w) < 0) _r.multiplyScalar(-1);
      _t.copy(MOSQ.pos).addScaledVector(_f, 0.006);
      _w.copy(_n).multiplyScalar(0.55).addScaledVector(_r, 0.8).addScaledVector(_f, 0.15).normalize(); arm = 0.085;
      G.attCamW = G.attCamW || _w.clone(); G.attCamW.lerp(_w, Math.min(1, dt * 6)).normalize(); _w.copy(G.attCamW);
    } else G.attCamW = null;
    _p.copy(_t).addScaledVector(_w, arm);
    let k = Math.min(WORLD.ray(_t, _p, 0.012), PEOPLE.rayBody(_t, _p, 0.01));
    // 붙어 있는데 둥근 몸에 막히면 살 바깥(법선) 쪽으로 조금씩 세워서 다시 봄
    for (let i = 1; G.att && k < 0.85 && i <= 4; i++) {
      _w.addScaledVector(_n, 0.45).normalize(); _p.copy(_t).addScaledVector(_w, arm);
      k = Math.min(WORLD.ray(_t, _p, 0.012), PEOPLE.rayBody(_t, _p, 0.01));
      if (i === 4 || k >= 0.85) G.attCamW.copy(_w);
    }
    G.camK = (G.camK === undefined ? k : G.camK + (k - G.camK) * Math.min(1, dt * 10));
    c.position.lerpVectors(_t, _p, Math.max(0.12, Math.min(k, G.camK)));
    if (c.position.y < 0.012) c.position.y = 0.012;
    c.lookAt(_t);
  }

  // ---------- 죽음·환생 ----------
  G.kill = function (c, how) {
    if (!G.alive) return;
    G.alive = false; G.mode = 'dead'; G.deadT = 0; G.slowHold = false;
    G.S.deaths++; G.S.hits[how] = (G.S.hits[how] || 0) + 1;
    try { if (window.OG) OG.over({ result: 'DEAD', score: PEOPLE.list.filter((x) => x.done).length }); } catch (e) {}
    if (c && c.id === 'teen' && G.S.life === 1) G.S.teenKilled = 1;
    if (G.att) { G.att = null; }
    G.landing = null; MOSQ.vel.set(0, 0, 0);
    AU.suck(false); AU.buzz(0, 0);
    G.ts = 0.25;
    const p = MOSQ.pos.clone();
    if (how === 'zap') { FX.onom(L('치지직!', 'ZZZAP!'), p, '#8fd8ff', 1.6); FX.spark(p); AU.sfx('zap'); UI.flash('#dff4ff'); MOSQ.abMat.color.set('#222'); }
    else if (how === 'poison') { FX.onom(L('콜록', 'COUGH'), p, '#9be27a', 1.2); AU.sfx('cough'); }
    else { FX.onom(how === 'swat' ? L('파악!', 'WHAP!') : how === 'clap' ? L('짝!', 'CLAP!') : how === 'snap' ? L('덥석!', 'CHOMP!') : L('찰싹!', 'SMACK!'), p, '#ff5a5a', 1.6); FX.splat(p, MOSQ.belly); AU.sfx('slap'); UI.flash('#ffffff'); }
    if (how !== 'poison' && how !== 'snap') MOSQ.body.scale.set(2.3, 0.35, 2.3);
    G.save();
    document.body.classList.remove('playing');
  };
  function dead(dt, rdt) {
    G.deadT += rdt;
    if (!G.diePosSet) { G.diePosSet = 1; }
    if (MOSQ.body.scale.y > 0.5) { MOSQ.pos.y = Math.max(WORLD.floorY(MOSQ.pos) + 0.004, MOSQ.pos.y - dt * 0.6); MOSQ.body.rotation.z += dt * 3; }
    // 카메라 천천히 다가감
    const c = RND.camera; _t.copy(MOSQ.pos); c.position.lerp(_t.clone().add(_p.set(0.06, 0.08, 0.1)), Math.min(1, rdt * 1.2)); c.lookAt(_t);
    if (G.deadT > 0.8) G.ts = Math.min(1, G.ts + rdt);
    if (G.deadT > 2.3 && !G.toCards) { G.toCards = 1; G.diePosSet = 0; UI.fadeOut(() => { G.toCards = 0; G.S.life++; G.save(); G.mode = 'cards'; UI.openCards(); }); }
  }
  // 카드 고르기 뒤
  G.pickCard = function (id) {
    G.S.cards.push(id); G.S.dex[id] = 1; G.save();
    G.startLife();
  };
  G.dealCards = function () {
    const pool = DATA.CARDS.slice(), out = [];
    while (out.length < 3 && pool.length) {
      const gold = Math.random() < 0.12;
      let cand = pool.filter((c) => !!c.g === gold); if (!cand.length) cand = pool;
      // 아직 못 본 카드를 조금 더 자주
      const w = cand.map((c) => (G.S.dex[c.id] ? 1 : 1.8)); let s = w.reduce((a, b) => a + b, 0) * Math.random(), i = 0;
      while (i < cand.length - 1 && (s -= w[i]) > 0) i++;
      const pick = cand[i]; out.push(pick); pool.splice(pool.indexOf(pick), 1);
    }
    return out;
  };

  // ---------- 사람들이 알려 주는 일 ----------
  G.onStrike = function (c, act) {
    if (act.kind === 'kill') return;
    AU.sfx(act.type === 'spray' ? 'shake' : 'wind');
    if (G.st.slowmo > 0 && MOSQ.pos.distanceTo(act.tgtW) < 0.6 && G.mode === 'play') G.ts = 0.42;
  };
  G.onDodge = function (c) {
    if (!G.alive || G.mode !== 'play') return;
    if (MOSQ.pos.distanceTo(c.act ? c.act.tgtW : MOSQ.pos) > 0.5 && c.act && c.act.type !== 'slap') return;
    G.S.dodges++; G.boostT = 1.5;
  };
  G.fx = function (name, p, c) {
    if (name === 'slap') { FX.onom(c.armed && c.id === 'grandpa' ? L('탁!', 'WHAP!') : L('찰싹!', 'SMACK!'), p, '#ffffff', 0.9); FX.dust(p); AU.sfx('slapmiss'); if (G.alive && MOSQ.pos.distanceTo(p) < 0.4) { FX.onom(L('휙!', 'DODGE!'), MOSQ.pos.clone(), '#7fe0ff', 0.8); } }
    else if (name === 'zapmiss') { FX.spark(p); FX.onom(L('파직', 'ZAP'), p, '#8fd8ff', 0.8); AU.sfx('zapmiss'); }
    else if (name === 'itchy') { FX.onom(L('근질근질', 'ITCHY'), p, '#ffe36a', 0.8); }
    else if (name === 'clap') { FX.clap(p); FX.onom(L('짝!', 'CLAP!'), p, '#ffe680', 1); AU.sfx('clap'); }
    else if (name === 'spray') { G.clouds.push({ p: p.clone(), r: 0, t: 0 }); FX.spray(p); FX.onom(L('칙—', 'PSSHH'), p, '#c8f0a0', 1); AU.sfx('spray'); }
  };
  // 아기: 맞아도 안 죽고 튕겨 나감
  G.bonk = function (c, p, shake) {
    if (G.att) { G.attNormal(_n); pop(_n, 1.6); }
    _t.subVectors(MOSQ.pos, p).normalize(); MOSQ.vel.addScaledVector(_t, 1.4);
    FX.onom(shake ? L('탁탁', 'SHOO') : L('콩', 'BONK'), MOSQ.pos.clone(), '#ffd34a', 0.8); AU.sfx('bonk');
  };
  G.updClouds = function (dt) {
    for (let i = G.clouds.length - 1; i >= 0; i--) { const c = G.clouds[i]; c.t += dt; c.r = Math.min(0.42, c.t * 0.6); if (c.t > 3.2) G.clouds.splice(i, 1); }
  };

  // ---------- 알 낳기(엔딩) ----------
  function startLay() {
    G.mode = 'lay'; G.layT = 0; G.eggN = 0; G.seqOn = 0; G.alive = false; G.att = null; document.body.classList.remove('playing');
    AU.buzz(0, 0); AU.sfx('done'); AU.sad(true);
    try { document.exitPointerLock(); } catch (e) {}
  }
  function lay(dt) {
    G.layT += dt; const k = G.layT, b = WORLD.basin;
    const sit = _t.set(b.x, b.y + 0.012, b.z);
    if (k < 4.6) MOSQ.pos.lerp(sit, Math.min(1, dt * 4));
    else MOSQ.pos.lerp(_p.set(b.x, b.y + 0.012 + Math.min(0.5, (k - 4.6) * 0.18), b.z - Math.min(0.4, (k - 4.6) * 0.12)), Math.min(1, dt * 3));
    MOSQ.vel.set(0, 0, k < 4.6 ? -0.0001 : -0.05); MOSQ.yaw = 0;
    MOSQ.setBelly(Math.max(0, 0.9 - Math.max(0, k - 1.2) / 3.4));
    const n = Math.min(48, Math.floor(Math.max(0, k - 1.2) * 14));
    if (n > (G.eggN || 0)) { if (n % 8 === 1) { FX.onom(L('쏙', 'POP'), _n.set(b.x, b.y + 0.03, b.z + 0.02), '#ffffff', 0.5); AU.sfx('pop'); } G.eggN = n; }
    FX.eggs(n, b);
    const c = RND.camera;
    if (k < 4.6) { const a = -1.1 + k * 0.3, R = 0.095; c.position.set(b.x + Math.sin(a) * R, b.y + 0.05, b.z + 0.015 + Math.cos(a) * R); c.lookAt(b.x, b.y + 0.006, b.z + 0.016); }
    else { const e = Math.min(1, (k - 4.6) / 2.6), ee = e * e * (3 - 2 * e); c.position.set(b.x + 0.3 * ee + Math.sin(0.28) * 0.095 * (1 - ee), b.y + 0.05 + ee * 0.55, b.z + 0.015 + Math.cos(0.28) * 0.095 * (1 - ee) + ee * 1.4); c.lookAt(b.x - 0.3 * ee, b.y + ee * 0.9, b.z - ee * 3); }
    // 끝 글: 숫자는 이 판 기록으로(죽은 횟수 = 환생 - 1, 태어난 횟수 = 환생)
    if (k > 6.2 && !G.seqOn) { G.seqOn = 1; UI.endSeq(G.S.life - 1, G.S.life); }
    if (k > 16.0 && !G.endShown) { G.endShown = 1; G.S.ended = 1; G.S.endings++; G.save(); try { if (window.OG) OG.over({ result: 'END', score: G.S.life }); } catch (e) {} UI.endSeqOff(); UI.ending(); }
  }
  G.afterEnding = function () { G.endShown = 0; AU.sad(false); G.newGame(); G.mode = 'title'; UI.title(); };
})();
