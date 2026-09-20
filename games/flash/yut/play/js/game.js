// 윷놀이: 윷가락 넷을 진짜 물리(Rapier)로 던지고, 말 넷을 다 내면 이긴다.
(async function () {
  const T = THREE, RP = RAPIER, Y = window.YUT;
  const $ = (id) => document.getElementById(id);
  const L_ = window.L || ((s) => s);
  await RP.init();

  // ---------- 저장 ----------
  const KEY = 'yut.save';
  const S = Object.assign(
    { stage: 1, coins: 0, skins: ['pine'], skin: 'pine', mis: {}, wins: 0, catches: 0, mo: 0, outs: 0, stackOut: 0, roomOut: 0, bkCatch: 0, best4: 0, p3: 0, p4: 0, ended: 0 },
    (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })()
  );
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- 상대 12 ----------
  const OPP = [
    { face: '🐥', name: '병아리', lv: 1, team: 3, n: 2 },
    { face: '🐰', name: '토끼', lv: 2, team: 2, n: 2 },
    { face: '🐱', name: '고양이', lv: 3, team: 1, n: 2 },
    { face: '🐷', name: '꿀꿀이', lv: 4, team: 3, n: 2 },
    { face: '🐸', name: '개구리', lv: 5, team: 2, n: 2 },
    { face: '🦊', name: '여우', lv: 6, team: 1, n: 2 },
    { face: '🐻', name: '곰', lv: 7, team: 3, n: 2 },
    { face: '🐯', name: '호랑이', lv: 8, team: 2, n: 2 },
    { face: '👵', name: '할머니', lv: 9, team: 1, n: 3 },
    { face: '👴', name: '할아버지', lv: 10, team: 3, n: 3 },
    { face: '🐲', name: '용', lv: 11, team: 2, n: 4 },
    { face: '🧙', name: '도깨비', lv: 12, team: 1, n: 4 },
  ];
  const LAST = 12;
  const HUMAN_FACES = ['🙂', '😀', '😄', '😁'];

  // ---------- 미션 12 ----------
  const MIS = [
    { id: 'w1', name: '첫 승리', r: 50, v: () => S.wins, n: 1 },
    { id: 'w10', name: '10승', r: 300, v: () => S.wins, n: 10 },
    { id: 'mo', name: '모 10번', r: 100, v: () => S.mo, n: 10 },
    { id: 'c20', name: '잡기 20번', r: 150, v: () => S.catches, n: 20 },
    { id: 'c4', name: '한 판에 4번 잡기', r: 200, v: () => S.best4, n: 4 },
    { id: 'bk', name: '빽도로 잡기', r: 150, v: () => S.bkCatch, n: 1 },
    { id: 'st', name: '업어서 나기', r: 120, v: () => S.stackOut, n: 1 },
    { id: 'rm', name: '방 지름길로 나기', r: 120, v: () => S.roomOut, n: 1 },
    { id: 's6', name: 'STAGE 6 클리어', r: 200, v: () => S.stage - 1, n: 6 },
    { id: 's12', name: 'STAGE 12 클리어', r: 800, v: () => S.stage - 1, n: 12 },
    { id: 'p3', name: '3 PLAYERS 한 판', r: 80, v: () => S.p3, n: 1 },
    { id: 'p4', name: '4 PLAYERS 한 판', r: 80, v: () => S.p4, n: 1 },
  ];
  function checkMis() {
    for (const m of MIS) {
      if (S.mis[m.id]) continue;
      if (m.v() >= m.n) { S.mis[m.id] = 1; S.coins += m.r; toast('🏅 ' + L_(m.name) + '  🪙+' + m.r); AU.coin(); }
    }
    save(); hud();
  }

  // ---------- 상태 ----------
  const G = { state: 'title', mode: 'solo', paused: false, t: 0, timer: 0, fast: false };
  let M = null; // 한 판
  const FAST = () => G.fast || window.__ytFast;

  // ---------- 물리 ----------
  const GRAV = 40, DT = 1 / 120;
  let world = null, acc = 0;
  function newWorld() {
    if (world) world.free();
    world = new RP.World({ x: 0, y: -GRAV, z: 0 });
    world.timestep = DT;
    // 멍석 바닥
    world.createCollider(RP.ColliderDesc.cuboid(30, 0.5, 30).setTranslation(0, SC.MAT_Y - 0.5, 0).setFriction(0.7).setRestitution(0.25));
    // 보이지 않는 테두리(가락이 멍석 밖으로 안 나가게)
    const N = 20;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, r = SC.MATR + 0.05;
      const c = RP.ColliderDesc.cuboid(0.15, 6, (Math.PI * r) / N + 0.1).setTranslation(Math.cos(a) * r, 6, Math.sin(a) * r).setRestitution(0.2).setFriction(0.5);
      const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -a);
      c.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      world.createCollider(c);
    }
  }
  newWorld();
  // 윷가락 볼록 껍질 점
  const hullPts = (() => {
    const L = SC.STICK_L, r = SC.STICK_R, out = [];
    for (const x of [-L / 2, L / 2]) {
      for (let i = 0; i <= 14; i++) { const a = SC.TH0 + (i / 14) * SC.SEG; out.push(x, Math.sin(a) * r, Math.cos(a) * r); }
    }
    return new Float32Array(out);
  })();

  // ---------- 윷가락(넷) ----------
  const sticks = [];
  const HAND = new T.Vector3(0, 1.7, 3.55);
  (function makeSticks() {
    for (let i = 0; i < 4; i++) {
      const m = new T.Mesh(SC.stickGeo, SC.stickMaterial(S.skin));
      m.castShadow = true; m.receiveShadow = true;
      if (i === 3) m.add(SC.backMark());
      SC.scene.add(m);
      sticks.push({ mesh: m, body: null, pv: 0, home: new T.Vector3(), homeQ: new T.Quaternion(), anim: 0 });
    }
    restSticks(true);
  })();
  function handPose(i) {
    const p = HAND.clone().add(new T.Vector3((i - 1.5) * 0.08, i % 2 ? 0.02 : 0, (i - 1.5) * 0.38));
    const q = new T.Quaternion().setFromEuler(new T.Euler(0, (i - 1.5) * 0.08, 0.28));
    return { p, q };
  }
  function restSticks(now) {
    for (let i = 0; i < 4; i++) {
      const s = sticks[i], h = handPose(i);
      if (s.body) { world.removeRigidBody(s.body); s.body = null; }
      if (now) { s.mesh.position.copy(h.p); s.mesh.quaternion.copy(h.q); s.anim = 0; }
      else { s.home.copy(s.mesh.position); s.homeQ.copy(s.mesh.quaternion); s.anim = 0.001; s.tp = h.p; s.tq = h.q; }
    }
  }
  function setSkin(id) {
    S.skin = id; save();
    for (const s of sticks) s.mesh.material = SC.stickMaterial(id);
  }
  setSkin(S.skin);

  let flight = null; // {t, still}
  function throwSticks(power, side) {
    power = Math.max(0.55, Math.min(1.3, power || 1));
    side = side || 0;
    // 손에 쥔 순서를 매번 섞는다(뒷도 가락만 앞에 놓이면 빽도가 잦아진다)
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
      const s = sticks[i];
      if (s.body) world.removeRigidBody(s.body);
      const h = handPose(order[i]);
      const bd = RP.RigidBodyDesc.dynamic().setTranslation(h.p.x, h.p.y + 0.4, h.p.z).setRotation({ x: h.q.x, y: h.q.y, z: h.q.z, w: h.q.w })
        .setLinearDamping(0.3).setAngularDamping(1.7).setCcdEnabled(true);
      const b = world.createRigidBody(bd);
      const cd = RP.ColliderDesc.convexHull(hullPts).setDensity(1.0).setFriction(0.85).setRestitution(0.22);
      world.createCollider(cd, b);
      const jit = () => (Math.random() - 0.5);
      b.setLinvel({ x: side * 2.2 + jit() * 1.2, y: 6.6 * power + jit() * 0.8, z: -6.4 * power + jit() * 0.9 }, true);
      b.setAngvel({ x: 8 + Math.random() * 10 + power * 4, y: jit() * 6, z: jit() * 14 }, true);
      s.body = b; s.pv = 0;
    }
    flight = { t: 0, still: 0 };
    AU.whoosh();
  }
  function readSticks() {
    let flats = 0, backOnly = false;
    const up = new T.Vector3();
    for (let i = 0; i < 4; i++) {
      up.set(0, 1, 0).applyQuaternion(sticks[i].mesh.quaternion);
      const flat = up.y < 0; // 배(평평한 면, 로컬 -Y)가 위
      if (flat) { flats++; if (i === 3) backOnly = true; }
      sticks[i].flat = flat;
    }
    if (flats !== 1) backOnly = false;
    return Y.throwName(flats, backOnly);
  }
  function stepPhysics(dt) {
    if (!flight) return;
    acc += dt;
    let n = 0;
    while (acc >= DT && n < 12) {
      world.step();
      acc -= DT; n++;
      flight.t += DT;
    }
    let still = true, maxV = 0;
    for (const s of sticks) {
      if (!s.body) continue;
      const p = s.body.translation(), q = s.body.rotation(), v = s.body.linvel(), w = s.body.angvel();
      s.mesh.position.set(p.x, p.y, p.z); s.mesh.quaternion.set(q.x, q.y, q.z, q.w);
      const sp = Math.hypot(v.x, v.y, v.z), an = Math.hypot(w.x, w.y, w.z);
      if (sp > 0.12 || an > 0.35) still = false;
      // 부딪힘 소리: 아래로 떨어지다 갑자기 위로
      if (s.pv < -2.5 && v.y > s.pv + 2.2) { const vol = Math.min(1, -s.pv / 9); if (p.y < SC.MAT_Y + 0.6) AU.thud(vol); else AU.clack(vol); }
      if (s.pv < -1 && v.y > s.pv + 1.2 && p.y > SC.MAT_Y + 0.25) AU.clack(0.4);
      s.pv = v.y;
      maxV = Math.max(maxV, sp);
    }
    if (still) flight.still += dt; else flight.still = 0;
    if (flight.still > 0.25 || flight.t > 4.5) { flight = null; onLanded(); }
  }
  function animSticks(dt) {
    for (const s of sticks) {
      if (!s.anim) continue;
      s.anim = Math.min(1, s.anim + dt / (FAST() ? 0.05 : 0.45));
      const k = s.anim < 0.5 ? 4 * s.anim ** 3 : 1 - Math.pow(-2 * s.anim + 2, 3) / 2;
      s.mesh.position.lerpVectors(s.home, s.tp, k);
      s.mesh.position.y += Math.sin(k * Math.PI) * 1.6;
      s.mesh.quaternion.slerpQuaternions(s.homeQ, s.tq, k);
      if (s.anim >= 1) s.anim = 0;
    }
  }

  // ---------- 말 ----------
  // 자리: 반시계방향(오른쪽 아래 → 오른쪽 위 → 왼쪽 위 → 왼쪽 아래). 2명은 마주 앉는다
  const CORNERS = [[3.55, 3.05], [3.55, -3.05], [-3.55, -3.05], [-3.55, 3.05]];
  function corner(seat) { const n = M ? M.seats.length : 4; return CORNERS[n === 2 && seat === 1 ? 2 : seat]; }
  const pieces = []; // [seat][i] = {mesh, blob, team}
  const rings = []; // 표시 고리 풀
  for (let i = 0; i < 6; i++) { const r = new T.Mesh(SC.ringGeo, SC.ringMat); r.rotation.x = -Math.PI / 2; r.visible = false; r.renderOrder = 3; SC.scene.add(r); rings.push(r); }
  const dstRing = new T.Mesh(SC.ringGeo, SC.ringMatDst); dstRing.rotation.x = -Math.PI / 2; dstRing.visible = false; dstRing.renderOrder = 3; SC.scene.add(dstRing);
  const pathDots = [];
  for (let i = 0; i < 6; i++) { const d = new T.Mesh(new T.CircleGeometry(0.11, 12), SC.ringMatDst); d.rotation.x = -Math.PI / 2; d.visible = false; d.renderOrder = 3; SC.scene.add(d); pathDots.push(d); }

  function pilePos(seat, i) {
    const [x, z] = corner(seat);
    const sx = Math.sign(x), sz = Math.sign(z);
    return new T.Vector3(x + (i % 2) * 0.62 * sx - 0.31 * sx, 0.15, z + Math.floor(i / 2) * 0.62 * sz - 0.31 * sz);
  }
  function clearPieces() {
    for (const row of pieces) for (const p of row) { SC.scene.remove(p.mesh); SC.scene.remove(p.blob); }
    pieces.length = 0;
  }
  function makePieces() {
    clearPieces();
    for (let s = 0; s < M.seats.length; s++) {
      const row = [];
      for (let i = 0; i < 4; i++) {
        const m = SC.makePiece(M.seats[s].team);
        const b = new T.Mesh(SC.blobGeo, SC.blobMat); b.renderOrder = 1;
        SC.scene.add(m); SC.scene.add(b);
        // 상대 자리의 말은 플레이어 쪽을 본다
        m.rotation.y = Math.atan2(-corner(s)[0], -corner(s)[1]);
        row.push({ mesh: m, blob: b, team: M.seats[s].team, anim: null });
      }
      pieces.push(row);
    }
    place();
  }
  // 상태대로 모든 말을 제자리에(움직이는 중인 말은 빼고)
  function place() {
    for (let s = 0; s < M.seats.length; s++) {
      const T_ = M.g.teams[s];
      for (let i = 0; i < 4; i++) {
        const p = pieces[s][i], st = T_.pieces[i];
        if (p.anim) continue;
        if (st.pos === Y.OUT) { p.mesh.visible = false; p.blob.visible = false; continue; }
        p.mesh.visible = true; p.blob.visible = true;
        let v;
        if (st.pos === Y.HAND) { v = pilePos(s, i); p.mesh.rotation.y = Math.atan2(-corner(s)[0], -corner(s)[1]); }
        else {
          v = SC.node(st.pos);
          const rank = T_.pieces.filter((q, j) => q.pos === st.pos && j < i).length;
          v.y += rank * 0.46;
          p.mesh.rotation.y = 0;
        }
        p.mesh.position.copy(v);
        p.mesh.scale.setScalar(1);
        p.blob.position.set(v.x, 0.152, v.z);
      }
    }
  }
  // 뛰어가기: ids 말들이 path 를 따라 통통
  function hopAnim(seat, ids, from, path, done) {
    const pts = [];
    pts.push(from === Y.HAND ? pilePos(seat, ids[0]) : SC.node(from));
    for (const n of path) pts.push(n === Y.OUT ? SC.node(Y.HOME).add(new T.Vector3(1.2, 2.5, 1.2)) : n === Y.HAND ? pilePos(seat, ids[0]) : SC.node(n));
    const per = FAST() ? 0.03 : path.length > 1 ? 0.24 : 0.36;
    const a = { pts, t: 0, per, seg: 0, ids, seat, done, last: -1 };
    for (const id of ids) pieces[seat][id].anim = a;
    M.anims.push(a);
  }
  function updateAnims(dt) {
    for (let k = M.anims.length - 1; k >= 0; k--) {
      const a = M.anims[k];
      a.t += dt;
      const total = a.per * (a.pts.length - 1);
      const tt = Math.min(total, a.t);
      const seg = Math.min(a.pts.length - 2, Math.floor(tt / a.per));
      const f = Math.min(1, (tt - seg * a.per) / a.per);
      if (seg !== a.last) { if (a.last >= 0) AU.hop(seg); a.last = seg; }
      const A = a.pts[seg], B = a.pts[seg + 1];
      a.ids.forEach((id, r) => {
        const p = pieces[a.seat][id];
        p.mesh.visible = true; p.blob.visible = true;
        p.mesh.position.lerpVectors(A, B, f);
        p.mesh.position.y += Math.sin(f * Math.PI) * 0.7 + r * 0.46;
        p.mesh.rotation.y = Math.atan2(B.x - A.x, B.z - A.z);
        p.mesh.scale.setScalar(1 + Math.sin(f * Math.PI) * 0.08);
        p.blob.position.set(p.mesh.position.x, 0.152, p.mesh.position.z);
        const h = p.mesh.position.y - r * 0.46;
        p.blob.scale.setScalar(Math.max(0.4, 1 - (h - 0.15) * 0.5));
      });
      if (a.t >= total) {
        for (const id of a.ids) { pieces[a.seat][id].anim = null; pieces[a.seat][id].blob.scale.setScalar(1); }
        M.anims.splice(k, 1);
        AU.hop(a.pts.length);
        a.done && a.done();
      }
    }
  }
  // 잡힌 말이 자기 자리로 날아감
  function flyBack(seat, ids) {
    for (const id of ids) {
      const p = pieces[seat][id];
      const a = { pts: [p.mesh.position.clone(), pilePos(seat, id)], t: 0, per: FAST() ? 0.03 : 0.55, seg: 0, ids: [id], seat, done: null, last: 0 };
      p.anim = a; M.anims.push(a);
    }
  }
  // 난 말: 위로 솟아 사라짐
  const sparks = [];
  function outAnim(seat, ids) {
    for (const id of ids) {
      const p = pieces[seat][id];
      p.anim = { fly: true };
      M.outs.push({ p, t: 0, from: p.mesh.position.clone() });
    }
    burst(SC.node(Y.HOME).add(new T.Vector3(0, 0.6, 0)), 0xffe066);
  }
  function updateOuts(dt) {
    for (let k = M.outs.length - 1; k >= 0; k--) {
      const o = M.outs[k];
      o.t += dt / (FAST() ? 0.05 : 0.9);
      const f = Math.min(1, o.t);
      o.p.mesh.position.copy(o.from); o.p.mesh.position.y += f * 3.2; o.p.mesh.rotation.y += dt * 9;
      o.p.mesh.scale.setScalar(1 - f * 0.9);
      o.p.blob.visible = false;
      if (f >= 1) { o.p.anim = null; o.p.mesh.visible = false; M.outs.splice(k, 1); }
    }
  }
  // 반짝 조각(풀)
  const sparkGeo = new T.PlaneGeometry(0.12, 0.12);
  const sparkMat = new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, depthWrite: false, side: T.DoubleSide });
  for (let i = 0; i < 40; i++) { const m = new T.Mesh(sparkGeo, sparkMat); m.visible = false; SC.scene.add(m); sparks.push({ m, v: new T.Vector3(), t: 0 }); }
  function burst(at, color) {
    let n = 0;
    for (const s of sparks) { if (s.t > 0) continue; s.m.position.copy(at); s.v.set((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5); s.t = 0.9 + Math.random() * 0.5; s.m.visible = true; if (++n >= 18) break; }
    sparkMat.color.set(color || 0xffe066);
  }
  function updateSparks(dt) {
    for (const s of sparks) {
      if (s.t <= 0) continue;
      s.t -= dt; s.v.y -= 14 * dt;
      s.m.position.addScaledVector(s.v, dt); s.m.rotation.x += dt * 6; s.m.rotation.z += dt * 5;
      if (s.t <= 0) s.m.visible = false;
    }
  }

  // ---------- 한 판 ----------
  function newMatch(seats, mode) {
    M = { seats, mode, g: Y.newGame(seats.length), cur: 0, name: null, ms: null, sel: null, anims: [], outs: [], myCatches: 0, turns: 0, winner: -1 };
    makePieces();
    G.state = 'throw'; G.timer = FAST() ? 0.05 : 0.9;
    restSticks(true);
    hideRings();
    hud();
  }
  const cur = () => M.seats[M.cur];
  function isHuman() { return cur().human; }

  // 상태 시계
  function update(dt) {
    G.t += dt;
    SC.breathe(G.t);
    animSticks(dt);
    updateSparks(dt);
    if (!M || G.paused) return;
    stepPhysics(dt);
    updateAnims(dt);
    updateOuts(dt);
    if (G.timer > 0) { G.timer -= dt; if (G.timer > 0) return; }
    if (G.state === 'throw') {
      if (!isHuman()) { throwSticks(0.75 + Math.random() * 0.45, (Math.random() - 0.5) * 0.6); G.state = 'fly'; }
      else { $('throwBtn').hidden = false; }
    } else if (G.state === 'result') {
      G.state = 'move';
      beginMove();
    } else if (G.state === 'cpu') {
      const m = Y.pick(M.g, M.cur, M.name, cur().lv);
      if (m) doMove(m); else nextTurn(false);
    } else if (G.state === 'next') {
      nextTurn(M.again);
    } else if (G.state === 'wait2') {
      const f = G.pending; G.pending = null; G.state = 'anim'; if (f) f();
    }
    // 고리 반짝
    const k = 0.7 + Math.sin(G.t * 6) * 0.25;
    SC.ringMat.opacity = k; SC.ringMatSel.opacity = 0.95;
  }
  function onLanded() {
    const name = readSticks();
    M.name = name;
    if (name === '모') { if (isHuman()) S.mo++; }
    showWord(name, name === '모' || name === '윷' ? 'big' : '');
    AU.result(name);
    G.state = 'result'; G.timer = FAST() ? 0.05 : name === '모' || name === '윷' ? 1.25 : 0.85;
    if (name === '빽도' && !Y.anyOnBoard(M.g, M.cur)) { M.ms = []; }
    // 상대가 윷·모면 약 올리기
    if (!isHuman() && (name === '모' || name === '윷')) tauntPill(M.cur);
    hud();
  }
  function beginMove() {
    if (M.name === '빽도' && !Y.anyOnBoard(M.g, M.cur)) { M.again = false; G.state = 'next'; G.timer = FAST() ? 0.02 : 0.5; restSticks(false); return; }
    M.ms = Y.moves(M.g, M.cur, M.name);
    if (!M.ms.length) { M.again = M.name === '윷' || M.name === '모'; G.state = 'next'; G.timer = FAST() ? 0.02 : 0.5; restSticks(false); return; }
    restSticks(false);
    if (!isHuman()) { G.state = 'cpu'; G.timer = FAST() ? 0.02 : 1.0 + Math.random() * 0.4; return; }
    if (M.ms.length === 1) { const only = M.ms[0]; G.state = 'wait2'; G.pending = () => doMove(only); G.timer = FAST() ? 0.02 : 0.45; return; }
    G.state = 'pick';
    showRings();
  }
  function hideRings() { for (const r of rings) r.visible = false; dstRing.visible = false; for (const d of pathDots) d.visible = false; }
  function showRings() {
    hideRings();
    M.ms.forEach((m, i) => {
      if (i >= rings.length) return;
      const r = rings[i];
      const v = m.from === Y.HAND ? pilePos(M.cur, m.ids[0]) : SC.node(m.from);
      r.position.set(v.x, 0.16, v.z);
      r.material = M.sel === m ? SC.ringMatSel : SC.ringMat;
      r.visible = true;
    });
    if (M.sel) {
      const m = M.sel;
      const v = m.to === Y.OUT ? SC.node(Y.HOME) : m.to === Y.HAND ? pilePos(M.cur, m.ids[0]) : SC.node(m.to);
      dstRing.position.set(v.x, 0.165, v.z); dstRing.visible = true;
      m.path.forEach((n, i) => { if (i >= pathDots.length || n === Y.OUT || n === m.to) return; const q = SC.node(n); pathDots[i].position.set(q.x, 0.165, q.z); pathDots[i].visible = true; });
      // 고른 말 살짝 들기
      for (const id of m.ids) pieces[M.cur][id].mesh.position.y += 0.25;
    }
  }
  function doMove(m) {
    hideRings();
    G.state = 'anim';
    $('throwBtn').hidden = true;
    const seat = M.cur, name = M.name;
    const g = M.g;
    // 잡힐 말들(적용 전에 기록)
    const victims = m.catch.map((c) => ({ seat: c.team, ids: g.teams[c.team].pieces.map((q, j) => (q.pos === m.to ? j : -1)).filter((j) => j >= 0) }));
    const res = Y.apply(g, seat, m, name);
    M.turns++;
    if (m.stack) AU.stack();
    hopAnim(seat, m.ids, m.from, m.path, () => {
      if (res.caught) {
        AU.catch();
        for (const v of victims) { flyBack(v.seat, v.ids); if (M.seats[v.seat].human && !cur().human) AU.caught(); }
        burst(SC.node(m.to).add(new T.Vector3(0, 0.5, 0)), 0xff6a4a);
        showWord('잡았다!', 'catch');
        if (cur().human) { S.catches++; M.myCatches++; S.best4 = Math.max(S.best4, M.myCatches); if (name === '빽도') S.bkCatch = 1; S.coins += 5; }
        else tauntPill(seat);
      }
      if (m.out) {
        AU.out();
        outAnim(seat, m.ids);
        showWord('났다!', 'out');
        if (cur().human) { S.outs += m.ids.length; if (m.ids.length >= 2) S.stackOut = 1; if (m.path.includes(28) || m.path.includes(29) || m.from === 23 || m.from === 28 || m.from === 29) S.roomOut = 1; S.coins += 10 * m.ids.length; }
      }
      place(); save(); hud();
      if (res.won) { G.state = 'wait2'; G.pending = () => endMatch(seat); G.timer = FAST() ? 0.02 : 1.4; return; }
      M.again = res.again;
      if (res.again && !res.caught && !m.out) showWord('한 번 더', 'again');
      else if (res.again) setTimeout(() => showWord('한 번 더', 'again'), FAST() ? 0 : 700);
      G.state = 'next'; G.timer = FAST() ? 0.02 : res.again ? 1.0 : 0.55;
    });
  }
  function nextTurn(again) {
    if (!again) M.cur = (M.cur + 1) % M.seats.length;
    M.sel = null; M.ms = null;
    G.state = 'throw'; G.timer = FAST() ? 0.02 : isHuman() ? 0.15 : 0.9 + Math.random() * 0.4;
    hud();
  }

  // ---------- 입력 ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  let pdown = null;
  const cv = document.getElementById('cv');
  cv.addEventListener('pointerdown', (e) => { pdown = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  cv.addEventListener('pointerup', (e) => {
    if (!pdown || !M || G.paused) { pdown = null; return; }
    const dx = e.clientX - pdown.x, dy = e.clientY - pdown.y, dt = (performance.now() - pdown.t) / 1000;
    pdown = null;
    AU.unlock();
    if (G.state === 'throw' && isHuman() && G.timer <= 0) {
      const len = Math.hypot(dx, dy);
      if (len < 18) { humanThrow(1.0, 0); return; }
      if (dy > 20) return; // 아래로 끌면 안 던진다
      const speed = Math.min(1.6, Math.max(0.7, (len / Math.max(0.08, dt)) / 900)); // 빠르게 튕기면 더 멀리
      const p = 0.6 + Math.min(1, len / 360) * 0.45 * speed;
      humanThrow(Math.min(1.3, p), Math.max(-1, Math.min(1, dx / 240)));
      return;
    }
    if (G.state === 'pick' && isHuman()) pickAt(e.clientX, e.clientY);
  });
  function humanThrow(p, side) {
    $('throwBtn').hidden = true;
    throwSticks(p, side);
    G.state = 'fly';
  }
  $('throwBtn').onclick = () => { if (G.state === 'throw' && isHuman() && M && !G.paused) { AU.unlock(); humanThrow(0.8 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4); } };
  function pickAt(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, SC.camera);
    // 말 맞히기(내 말) + 손 자리 + 목적지 고리
    const objs = [];
    for (let i = 0; i < 4; i++) { const p = pieces[M.cur][i]; if (p.mesh.visible) objs.push(p.mesh); }
    objs.push(dstRing);
    for (const r of rings) if (r.visible) objs.push(r);
    const hit = ray.intersectObjects(objs, false)[0];
    let m = null;
    if (hit) {
      if (hit.object === dstRing && M.sel) { doMove(M.sel); return; }
      const idx = pieces[M.cur].findIndex((p) => p.mesh === hit.object);
      if (idx >= 0) {
        const st = M.g.teams[M.cur].pieces[idx];
        // 고른 말의 도착 자리에 서 있는 내 말(업을 말)을 찍으면 = 확정
        if (M.sel && st.pos === M.sel.to && !M.sel.ids.includes(idx)) { doMove(M.sel); return; }
        m = M.ms.find((mm) => (st.pos === Y.HAND ? mm.from === Y.HAND : mm.ids.includes(idx)));
      } else {
        const ri = rings.indexOf(hit.object);
        if (ri >= 0) m = M.ms[ri];
      }
    } else {
      // 판 위 아무 곳: 가장 가까운 고리(폰 손가락 오차)
      const pt = new T.Vector3();
      if (ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -0.16), pt)) {
        let best = null, bd = 0.75;
        M.ms.forEach((mm) => { const v = mm.from === Y.HAND ? pilePos(M.cur, mm.ids[0]) : SC.node(mm.from); const d = Math.hypot(v.x - pt.x, v.z - pt.z); if (d < bd) { bd = d; best = mm; } });
        if (M.sel) { const v = M.sel.to === Y.OUT ? SC.node(Y.HOME) : SC.node(M.sel.to); if (Math.hypot(v.x - pt.x, v.z - pt.z) < 0.75) { doMove(M.sel); return; } }
        m = best;
      }
    }
    if (!m) { M.sel = null; place(); showRings(); return; }
    if (M.sel === m) { doMove(m); return; }
    AU.tap();
    M.sel = m; place(); showRings();
  }

  // ---------- HUD ----------
  function hud() {
    $('coins').textContent = S.coins;
    $('stageN').textContent = S.stage;
    $('tStage').textContent = 'STAGE ' + S.stage;
    const pill = $('turnPill');
    if (!M) { pill.innerHTML = ''; return; }
    pill.innerHTML = M.seats.map((s, i) => '<span class="t' + (i === M.cur ? ' on' : '') + '" id="seat' + i + '">' + s.face + '<b>' + M.g.teams[i].out + '</b></span>').join('');
    $('bDuo').textContent = '2 PLAYERS'; $('bTrio').textContent = '3 PLAYERS'; $('bQuad').textContent = '4 PLAYERS';
  }
  function tauntPill(seat) {
    const el = $('seat' + seat);
    if (!el) return;
    el.classList.remove('taunt'); void el.offsetWidth; el.classList.add('taunt');
    AU.cpu();
  }
  let wordT = null;
  function showWord(s, cls) {
    const w = $('word');
    w.textContent = L_(s);
    w.className = 'show ' + (cls || '');
    clearTimeout(wordT);
    wordT = setTimeout(() => (w.className = ''), FAST() ? 30 : cls === 'big' ? 1300 : 900);
  }
  function toast(s) {
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = s;
    $('toasts').appendChild(d); setTimeout(() => d.remove(), 2700);
  }

  // ---------- 화면 흐름 ----------
  function seatsFor(stage) {
    const idx = Math.min(stage, LAST) - 1;
    const o = OPP[idx];
    const seats = [{ human: true, face: HUMAN_FACES[0], name: 'ME', team: 0 }];
    let n = stage > LAST ? 2 + ((stage * 7) % 3) : o.n;
    const main = stage > LAST ? OPP[(stage * 5) % LAST] : o;
    const lv = stage > LAST ? 12 : o.lv;
    seats.push({ human: false, face: main.face, name: main.name, team: main.team, lv });
    const used = new Set([0, main.team]);
    let k = idx;
    while (seats.length < n) {
      k = (k + 5) % LAST;
      const e = OPP[k];
      if (used.has(e.team) || e.face === main.face) continue;
      used.add(e.team);
      seats.push({ human: false, face: e.face, name: e.name, team: e.team, lv: Math.max(1, lv - 2) });
    }
    return seats;
  }
  function startSolo() {
    const seats = seatsFor(S.stage);
    G.mode = 'solo';
    $('title').hidden = true;
    $('vs').hidden = false;
    $('vsS').textContent = 'STAGE ' + S.stage;
    $('vsRow').innerHTML = seats.map((s) => '<span>' + s.face + '</span>').join('<i>VS</i>');
    $('vsName').textContent = seats.slice(1).map((s) => L_(s.name)).join(' · ');
    document.body.classList.add('playing');
    newMatch(seats, 'solo');
    G.state = 'wait';
    const go = () => { $('vs').hidden = true; G.state = 'throw'; G.timer = 0.3; };
    $('vs').onclick = go;
    setTimeout(() => { if (!$('vs').hidden) go(); }, FAST() ? 30 : 1800);
  }
  function startMulti(n) {
    const seats = [];
    for (let i = 0; i < n; i++) seats.push({ human: true, face: HUMAN_FACES[i], name: (i + 1) + 'P', team: i });
    G.mode = 'multi';
    $('title').hidden = true;
    document.body.classList.add('playing');
    newMatch(seats, 'multi');
    if (n === 3) S.p3 = 1; if (n === 4) S.p4 = 1;
    checkMis();
  }
  function endMatch(winner) {
    M.winner = winner;
    G.state = 'over';
    hideRings();
    const w = M.seats[winner];
    $('eFace').textContent = w.face;
    $('eCoins').textContent = '';
    let coins = 0;
    if (M.mode === 'solo') {
      if (w.human) {
        coins = 100 + S.stage * 20;
        S.wins++; S.coins += coins;
        $('eTitle').textContent = 'WIN'; $('eTitle').className = 'win';
        AU.win();
        const cleared = S.stage;
        S.stage++;
        $('eNext').hidden = false; $('eRetry').hidden = true;
        if (cleared === LAST && !S.ended) { S.ended = 1; save(); const thisM = M; setTimeout(() => { if (M === thisM && G.state === 'over') showEnding(); }, FAST() ? 50 : 1800); }
      } else {
        $('eTitle').textContent = 'LOSE'; $('eTitle').className = 'lose';
        AU.lose();
        $('eNext').hidden = true; $('eRetry').hidden = false;
      }
    } else {
      coins = 30; S.coins += 30;
      $('eTitle').textContent = 'WIN'; $('eTitle').className = 'win';
      AU.win();
      $('eNext').hidden = true; $('eRetry').hidden = false;
    }
    if (coins) $('eCoins').textContent = '🪙 +' + coins;
    $('eStats').textContent = M.seats.map((s, i) => s.face + ' ' + M.g.teams[i].out).join('   ');
    save(); checkMis();
    burst(SC.node(23).add(new T.Vector3(0, 1, 0)), 0xffe066);
    const thisM = M;
    setTimeout(() => { if (M === thisM && G.state === 'over') $('end').hidden = false; }, FAST() ? 20 : 500);
  }
  function goHome() {
    $('end').hidden = true; $('vs').hidden = true; $('pauseCover').hidden = true; $('ending').hidden = true;
    $('throwBtn').hidden = true;
    G.paused = false;
    document.body.classList.remove('playing');
    if (M) { clearPieces(); M = null; }
    flight = null; restSticks(true); hideRings();
    G.state = 'title';
    $('title').hidden = false;
    hud();
  }
  function showEnding() {
    $('end').hidden = true;
    $('ending').hidden = false;
    const c = $('confetti'); c.innerHTML = '';
    const cols = ['#ff5a5a', '#ffa23a', '#ffe14d', '#5ad46a', '#4ab0ff', '#9a6bff', '#fff'];
    for (let i = 0; i < 70; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 3 + 's'; s.style.animationDuration = 2.5 + Math.random() * 2 + 's'; c.appendChild(s); }
    AU.win();
  }

  // ---------- 상점·미션 ----------
  function openShop() {
    $('shopCoins').textContent = S.coins;
    const grid = $('shopGrid'); grid.innerHTML = '';
    for (const sk of SC.SKINS) {
      const own = S.skins.includes(sk.id), on = S.skin === sk.id;
      const d = document.createElement('div'); d.className = 'card' + (on ? ' on' : '') + (own ? '' : ' lock');
      const cvs = document.createElement('canvas'); cvs.width = 120; cvs.height = 60; drawSkinPreview(cvs, sk);
      d.appendChild(cvs);
      const nm = document.createElement('div'); nm.className = 'bn'; nm.textContent = L_(sk.name); d.appendChild(nm);
      const b = document.createElement('button');
      b.textContent = on ? L_('사용 중') : own ? L_('장착') : '🪙 ' + sk.price;
      b.disabled = on || (!own && S.coins < sk.price);
      b.onclick = () => { AU.unlock(); if (!own) { S.coins -= sk.price; S.skins.push(sk.id); AU.coin(); } setSkin(sk.id); save(); checkMis(); openShop(); };
      d.appendChild(b); grid.appendChild(d);
    }
    $('shop').hidden = false;
  }
  function drawSkinPreview(c, sk) {
    const x = c.getContext('2d');
    const m = SC.stickMaterial(sk.id);
    const img = m.map.image;
    x.save(); x.beginPath(); x.roundRect(6, 14, 108, 30, 12); x.clip();
    x.drawImage(img, 0, 0, img.width, img.height / 2, 6, 14, 108, 30);
    const g = x.createLinearGradient(0, 14, 0, 44); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = g; x.fillRect(6, 14, 108, 30); x.restore();
    if (sk.glow) { x.shadowColor = '#7fffb0'; x.shadowBlur = 12; x.strokeStyle = 'rgba(127,255,176,.8)'; x.lineWidth = 2; x.beginPath(); x.roundRect(6, 14, 108, 30, 12); x.stroke(); }
  }
  function openMis() {
    const list = $('misList'); list.innerHTML = '';
    let n = 0;
    for (const m of MIS) {
      const ok = !!S.mis[m.id]; if (ok) n++;
      const d = document.createElement('div'); d.className = 'mis' + (ok ? ' ok' : '');
      const v = Math.min(m.n, m.v());
      d.innerHTML = '<div class="ck">' + (ok ? '✔' : '') + '</div><div class="mn">' + L_(m.name) + (ok ? '' : ' <span class="pg">' + v + '/' + m.n + '</span>') + '</div><div class="mr">🪙 ' + m.r + '</div>';
      list.appendChild(d);
    }
    $('misCount').textContent = n + ' / 12';
    $('misWins').textContent = S.wins;
    $('missions').hidden = false;
  }

  // ---------- 단추 ----------
  $('bStart').onclick = () => { AU.unlock(); startSolo(); };
  $('bDuo').onclick = () => { AU.unlock(); startMulti(2); };
  $('bTrio').onclick = () => { AU.unlock(); startMulti(3); };
  $('bQuad').onclick = () => { AU.unlock(); startMulti(4); };
  $('bShop').onclick = () => { AU.unlock(); openShop(); };
  $('bMis').onclick = () => { AU.unlock(); openMis(); };
  $('eShop').onclick = () => openShop();
  for (const c of document.querySelectorAll('.sheet .close')) c.onclick = () => { c.closest('.sheet').hidden = true; };
  $('eNext').onclick = () => { $('end').hidden = true; clearPieces(); startSolo(); };
  $('eRetry').onclick = () => { $('end').hidden = true; clearPieces(); if (M.mode === 'solo') startSolo(); else startMulti(M.seats.length); };
  $('eHome').onclick = goHome;
  $('pHome').onclick = goHome;
  $('endOk').onclick = () => { $('ending').hidden = true; $('end').hidden = false; };
  $('tPause').onclick = () => { if (!M || G.state === 'over') return; G.paused = !G.paused; $('pauseCover').hidden = !G.paused; };
  $('pauseCover').onclick = (e) => { if (e.target === $('pauseCover')) { G.paused = false; $('pauseCover').hidden = true; } };
  const tg = () => { $('tBgm').classList.toggle('off', !AU.bgm); $('tSnd').classList.toggle('off', !AU.snd); };
  $('tBgm').onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); tg(); };
  $('tSnd').onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); tg(); };
  tg();
  document.addEventListener('visibilitychange', () => { if (document.hidden && M && G.state !== 'over') { G.paused = true; $('pauseCover').hidden = false; } });

  // ---------- 루프 ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt);
    SC.renderer.render(SC.scene, SC.camera);
    requestAnimationFrame(frame);
  }
  SC.warm();
  $('loading').hidden = true;
  $('title').hidden = false;
  hud();
  requestAnimationFrame(frame);

  // 시험 손잡이(배포에서도 해롭지 않음)
  window.__yt = {
    G, S, get M() { return M; }, Y, sticks, pieces,
    tick(n, dt) { for (let i = 0; i < (n || 1); i++) { update(dt || 1 / 60); } SC.renderer.render(SC.scene, SC.camera); },
    step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60); },
    throwNow(p, s) { if (G.state === 'throw' && M) humanThrow(p || 1, s || 0); },
    pickFirst() { if (G.state === 'pick' && M && M.ms.length) doMove(M.ms[0]); },
    pickBest() { if (G.state === 'pick' && M) doMove(Y.pick(M.g, M.cur, M.name, 12)); },
    read: readSticks, startSolo, startMulti, goHome, setSkin, save, checkMis, showWord,
  };
})();
