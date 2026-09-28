// 초원다방: 다방 탁자 위에서 성냥개비로 마음껏 탑을 쌓는다. 물리는 Rapier(Apache-2.0), 나무블럭쌓기와 같은 틀.
(async function () {
  const T = THREE, RP = RAPIER;
  const $ = (id) => document.getElementById(id);
  const L_ = window.L || ((s) => s);
  await RP.init();
  try { await document.fonts.load('900 60px Title'); } catch (e) {}
  SC.buildBox();

  // ---------- 치수 (cm) ----------
  const M = SC.MATCH, HL = M.L / 2, HW = M.W / 2;
  const P = Object.assign({ g: 200, dt: 1 / 60, it: 10, fr: 2, ccd: 1, clear: 0.15, nf: 60, wake: 0, ld: 0.5, ad: 2, mu: 0.62, kv: 0.5, kw: 0.1, cv: 1.0, pgs: 1, inr: 8, inrx: 0.3 }, window.__MTP || (() => { try { return location.hash.startsWith('#p=') ? JSON.parse(decodeURIComponent(location.hash.slice(3))) : {}; } catch (e) { return {}; } })());
  const DT = P.dt;
  const G = P.g; // 중력 (cm/s²). 성냥이 가늘어 진짜 중력이면 떨린다 — 느리게 둔다
  const MAX = 400;
  const CLEAR = P.clear; // 손에 든 성냥은 받침 위 이만큼 떠 있다
  const TB = SC.TABLE;

  // ---------- 저장 ----------
  const KEY = 'matchtower.save';
  const S = Object.assign({ best: 0, placed: 0, tower: null }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- 상태 ----------
  const G_ = { state: 'title', paused: false };
  window.__mtState = G_;
  let world = null;
  let matches = []; // { body, cols:[stick, head], pv }
  const byCol = new Map();
  let held = null; // { m, yaw, cx, cy, pos, isNew }
  const IM = SC.makeMatches(MAX);

  function newWorld() {
    if (world) world.free();
    world = new RP.World({ x: 0, y: -G, z: 0 });
    world.timestep = DT;
    world.numSolverIterations = P.it;
    world.numAdditionalFrictionIterations = P.fr;
    try { world.numInternalPgsIterations = P.pgs; } catch (e) {}
    try { world.integrationParameters.contact_natural_frequency = P.nf; } catch (e) {}
    // 탁자
    world.createCollider(RP.ColliderDesc.cuboid(TB.w / 2, TB.t / 2, TB.d / 2).setTranslation(0, -TB.t / 2, 0).setFriction(0.55));
    // 소품
    for (const p of SC.PROPS) {
      if (p.type === 'cyl') world.createCollider(RP.ColliderDesc.cylinder(p.h / 2, p.r).setTranslation(p.x, p.h / 2, p.z).setFriction(0.4));
      else {
        const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), p.ry);
        const off = new T.Vector3(p.cx || 0, 0, 0).applyQuaternion(q);
        world.createCollider(RP.ColliderDesc.cuboid(p.hx, p.hy, p.hz).setTranslation(p.x + off.x, p.hy, p.z + off.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }).setFriction(0.5));
      }
    }
    matches = [];
    byCol.clear();
    held = null;
  }

  function makeCols(m) {
    const rr = P.round || 0;
    const sd = rr ? RP.ColliderDesc.roundCuboid(HL - rr, HW - rr, HW - rr, rr) : RP.ColliderDesc.cuboid(HL, HW, HW);
    if (P.inr) {
      // 회전 관성을 키워 가는 막대가 덜 떨게 한다 (쌓인 탑이 스스로 기울지 않게)
      const ms = 0.5 * M.L * M.W * M.W, iy = ms / 12 * (M.L * M.L + M.W * M.W);
      sd.setMassProperties(ms, { x: 0, y: 0, z: 0 }, { x: iy * P.inrx, y: iy * P.inr, z: iy * P.inr }, { x: 0, y: 0, z: 0, w: 1 });
    } else sd.setDensity(0.5);
    const st = world.createCollider(sd.setFriction(P.mu).setRestitution(0.03), m.body);
    m.cols = [st];
    if (!P.nohead) m.cols.push(world.createCollider(RP.ColliderDesc.ball(M.HEAD_R).setTranslation(M.HEAD_X, 0, 0).setDensity(1.4).setFriction(0.5).setRestitution(0.03), m.body));
    for (const c of m.cols) byCol.set(c.handle, m);
  }
  function dropCols(m) {
    for (const c of m.cols) { byCol.delete(c.handle); world.removeCollider(c, false); }
    m.cols = [];
  }
  function addMatch(x, y, z, q, sleep) {
    const body = world.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(x, y, z).setRotation(q).setLinearDamping(P.ld).setAngularDamping(P.ad).setCcdEnabled(!!P.ccd).setCanSleep(true));
    const m = { body, cols: [], pv: new T.Vector3() };
    makeCols(m);
    matches.push(m);
    if (sleep) body.sleep();
    return m;
  }
  function removeMatch(m) {
    const i = matches.indexOf(m);
    if (i < 0) return;
    if (m.cols.length) dropCols(m);
    world.removeRigidBody(m.body);
    matches.splice(i, 1);
  }

  // ---------- 그리기 ----------
  const _m = new T.Matrix4(), _p = new T.Vector3(), _q = new T.Quaternion(), _s = new T.Vector3(1, 1, 1);
  function sync() {
    const n = matches.length;
    for (let i = 0; i < n; i++) {
      const m = matches[i];
      if (held && held.m === m) { _p.copy(held.pos); _q.setFromAxisAngle(_up, held.yaw); }
      else { const t = m.body.translation(), r = m.body.rotation(); _p.set(t.x, t.y, t.z); _q.set(r.x, r.y, r.z, r.w); }
      _m.compose(_p, _q, _s);
      IM.st.setMatrixAt(i, _m); IM.hd.setMatrixAt(i, _m);
    }
    IM.st.count = IM.hd.count = n;
    IM.st.instanceMatrix.needsUpdate = IM.hd.instanceMatrix.needsUpdate = true;
    // 손에 든 성냥은 살짝 밝게
    const hi = held ? matches.indexOf(held.m) : -1;
    if (hi !== litIdx) {
      if (litIdx >= 0 && litIdx < MAX) IM.st.setColorAt(litIdx, baseCol[litIdx]);
      if (hi >= 0) IM.st.setColorAt(hi, _lit);
      litIdx = hi;
      IM.st.instanceColor.needsUpdate = true;
    }
  }
  const _up = new T.Vector3(0, 1, 0);
  const _lit = new T.Color(1.45, 1.3, 1.0);
  const baseCol = [];
  for (let i = 0; i < MAX; i++) { const c = new T.Color(); IM.st.getColorAt(i, c); baseCol.push(c); }
  let litIdx = -1;

  // ---------- 광선 ----------
  const ray3 = new T.Raycaster(), ndc = new T.Vector2();
  function screenRay(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray3.setFromCamera(ndc, SC.camera);
    return ray3.ray;
  }
  function cast(o, d, max) {
    const h = world.castRay(new RP.Ray(o, d), max || 500, true);
    if (!h) return null;
    const t = h.timeOfImpact != null ? h.timeOfImpact : h.toi;
    return { t, col: h.collider, p: { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t } };
  }
  function pickMatch(x, y) {
    const r = screenRay(x, y);
    const h = cast(r.origin, r.direction);
    return h ? byCol.get(h.col.handle) || null : null;
  }
  // 성냥갑을 눌렀나 (화면 위 거리로 넉넉히)
  function hitBox(x, y) {
    const r = screenRay(x, y);
    const b = new T.Box3().setFromObject(SC.box).expandByScalar(0.8);
    return !!r.intersectBox(b, new T.Vector3());
  }

  // ---------- 손에 든 성냥의 자리 ----------
  const SAMP = [];
  // 길이를 따라 촘촘히 잰다 (성냥 두께 0.22cm 보다 좁은 간격이어야 가로놓인 성냥을 놓치지 않는다)
  for (let a = -HL + 0.04; a <= M.HEAD_X - 0.1; a += 0.17) for (const l of [-0.09, 0.09]) SAMP.push([a, l, HW]);
  for (const l of [-0.1, 0, 0.1]) SAMP.push([M.HEAD_X, l, M.HEAD_R]);
  function holdPose() {
    const h = held;
    if (!isFinite(h.cx) || !isFinite(h.cy) || !innerWidth) return;
    const r = screenRay(h.cx, h.cy);
    if (!isFinite(r.direction.x)) return;
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw);
    // 성냥 발자국 밑의 가장 높은 받침
    const support = (px, pz) => {
      let top = -1e9;
      for (const [a, l, off] of SAMP) {
        const sx = px + c * a + s * l, sz = pz - s * a + c * l;
        const d = cast({ x: sx, y: 150, z: sz }, { x: 0, y: -1, z: 0 }, 400);
        const y = d ? d.p.y + off : off;
        if (y > top) top = y;
      }
      return top;
    };
    // 마우스(손가락) 광선이 높이 y 인 수평면과 만나는 곳
    const onPlane = (y) => {
      const t = (y - r.origin.y) / (r.direction.y || -1e-6);
      return t > 0 ? [r.origin.x + r.direction.x * t, r.origin.z + r.direction.z * t] : [h.pos.x, h.pos.z];
    };
    // 성냥이 떠 있을 높이에서 광선과 만나는 자리를 되풀이해 맞춘다
    // (바닥을 짚고 나서 들어 올리면 비스듬한 시점에선 화면에서 마우스와 멀리 떨어져 보였다)
    const hit = cast(r.origin, r.direction);
    let y = hit && hit.p.y > -1 ? hit.p.y + HW + CLEAR : h.pos.y;
    let px = h.pos.x, pz = h.pos.z, top = 0, yMax = y, ok = false;
    const at = (yy) => {
      [px, pz] = onPlane(yy);
      if (h.fix) { px = h.fix.x; pz = h.fix.z; }
      px = Math.max(-TB.w / 2 + 2, Math.min(TB.w / 2 - 2, px));
      pz = Math.max(-TB.d / 2 + 2, Math.min(TB.d / 2 - 2, pz));
      top = support(px, pz);
    };
    for (let it = 0; it < 4; it++) {
      at(y);
      const ny = top + CLEAR;
      if (Math.abs(ny - y) < 0.01) { ok = true; break; }
      y = ny; yMax = Math.max(yMax, y);
    }
    let ty = top + CLEAR;
    if (!ok) {
      // 벽에 걸쳤다 벗어났다 오가면 높은 쪽으로 정하고, 그 높이에서 마우스 자리를 다시 잡는다
      at(yMax);
      ty = Math.max(yMax, top + CLEAR);
    }
    // 부드럽게 따라가되 위로는 바로 (파묻히지 않게)
    const k = h.snap ? 1 : 0.5;
    h.pos.x += (px - h.pos.x) * k;
    h.pos.z += (pz - h.pos.z) * k;
    h.pos.y = ty > h.pos.y ? ty : h.pos.y + (ty - h.pos.y) * 0.35;
    h.snap = false;
    h.body.setNextKinematicTranslation(h.pos);
    // 그림자 표식: 바로 밑 받침 높이
    marker.position.set(h.pos.x, top - HW + 0.02, h.pos.z);
    marker.rotation.y = h.yaw; // 성냥과 같은 방향으로
  }
  // 받침 위 옅은 표식 (내려놓을 자리)
  const marker = (function () {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(0.5, 'rgba(255,230,160,1)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 32);
    const t = new T.CanvasTexture(c);
    const m = new T.Mesh(new T.PlaneGeometry(M.L + 0.6, 0.9), new T.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending }));
    m.rotation.order = 'YXZ';
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    SC.scene.add(m);
    return m;
  })();

  function yawOfBody(b) {
    const r = b.rotation();
    _q.set(r.x, r.y, r.z, r.w);
    const v = new T.Vector3(1, 0, 0).applyQuaternion(_q);
    return Math.atan2(-v.z, v.x);
  }
  function screenOf(p) {
    const v = new T.Vector3(p.x, p.y, p.z).project(SC.camera);
    return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight];
  }
  function beginHold(m, isNew, cx, cy) {
    const t = m.body.translation();
    if (m.cols.length) dropCols(m);
    m.body.setBodyType(RP.RigidBodyType.KinematicPositionBased, true);
    held = { m, body: m.body, yaw: isNew ? heldYaw : yawOfBody(m.body), pos: new T.Vector3(t.x, t.y, t.z), cx, cy, isNew, snap: true };
    // 주변을 깨운다 (받치던 것이 빠지면 위가 내려앉는다)
    if (!isNew || P.wake) for (const o of matches) if (o !== m) o.body.wakeUp();
    G_.state = 'hold';
    marker.visible = true;
    document.body.classList.add('holding');
    holdPose();
    uiHold();
  }
  let heldYaw = 0;
  function dropHeld() {
    if (!held) return;
    const h = held;
    held = null;
    heldYaw = h.yaw;
    const q = new T.Quaternion().setFromAxisAngle(_up, h.yaw);
    h.body.setBodyType(RP.RigidBodyType.Dynamic, true);
    h.body.setTranslation(h.pos, true);
    h.body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    h.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    h.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    makeCols(h.m);
    h.body.wakeUp();
    marker.visible = false;
    document.body.classList.remove('holding');
    G_.state = 'play';
    if (h.isNew) S.placed++;
    AU.drop();
    calmT = 0; dirty = true;
    uiHold();
    hud();
  }
  function putAway() {
    if (!held) return;
    const h = held;
    held = null;
    heldYaw = h.yaw;
    removeMatch(h.m);
    marker.visible = false;
    document.body.classList.remove('holding');
    G_.state = 'play';
    AU.rattle();
    dirty = true;
    uiHold();
    hud();
  }
  function takeNew(cx, cy) {
    if (held || matches.length >= MAX) return;
    // 성냥갑에서 한 개: 화면 가운데(또는 누른 자리)에서 시작
    if (cx == null) { const c = screenOf({ x: SC.cam.tx, y: SC.cam.ty, z: SC.cam.tz }); cx = c[0]; cy = c[1]; }
    const b = SC.box.position;
    const m = addMatch(b.x, 3, b.z, { x: 0, y: 0, z: 0, w: 1 });
    AU.rattle();
    beginHold(m, true, cx, cy);
  }
  function rot(d) {
    if (!held) return;
    held.yaw += d;
    marker.rotation.y = held.yaw;
    AU.tick();
  }

  // ---------- 탑 높이 ----------
  let curH = 0;
  function measure() {
    let best = 0;
    for (const m of matches) {
      if (held && held.m === m) continue;
      const b = m.body;
      const v = b.linvel();
      if (v.x * v.x + v.y * v.y + v.z * v.z > 1) continue;
      const t = b.translation(), r = b.rotation();
      _q.set(r.x, r.y, r.z, r.w);
      const ax = new T.Vector3(1, 0, 0).applyQuaternion(_q);
      const top = t.y + Math.abs(ax.y) * HL + HW + (ax.y > 0 ? 0.06 : 0);
      if (top > best) best = top;
    }
    curH = best;
    return best;
  }

  // ---------- 물리 한 걸음 ----------
  const Z0 = { x: 0, y: 0, z: 0 };
  function killCreep() {
    for (const m of matches) {
      const b = m.body;
      if (!b.isDynamic() || b.isSleeping()) continue;
      const v = b.linvel(), w = b.angvel();
      if (v.x * v.x + v.y * v.y + v.z * v.z < P.kv * P.kv && w.x * w.x + w.y * w.y + w.z * w.z < P.kw * P.kw) { b.setLinvel(Z0, false); b.setAngvel(Z0, false); }
    }
  }
  function physStep() {
    world.step();
    killCreep();
  }

  // ---------- 매 프레임 ----------
  let calmT = 0, dirty = false, measT = 0, shake = 0;
  function logic(dt) {
    let maxV = 0, fast = 0;
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i], b = m.body;
      if (held && held.m === m) continue;
      if (b.isSleeping()) { m.pv.set(0, 0, 0); continue; }
      const v = b.linvel();
      const dv = Math.hypot(v.x - m.pv.x, v.y - m.pv.y, v.z - m.pv.z);
      if (dv > 6) AU.knock(Math.min(3, dv * 0.04));
      m.pv.set(v.x, v.y, v.z);
      const sp = Math.hypot(v.x, v.y, v.z);
      if (sp > maxV) maxV = sp;
      if (sp > 15) fast++;
      // 탁자 밖으로 떨어진 것은 치운다
      const ty = b.translation().y;
      if (!(ty > -25)) { removeMatch(m); dirty = true; }
    }
    if (fast >= 6 && shake <= 0) { shake = 0.35; AU.crash(Math.min(1, fast / 20)); }
    // 조용해지면 재우고 저장한다
    if (!held) {
      calmT = maxV < P.cv ? calmT + dt : 0;
      if (calmT > 0.6) {
        for (const m of matches) if (!m.body.isSleeping()) m.body.sleep();
        calmT = 0;
        if (dirty) { dirty = false; settleSave(); }
      }
    }
    measT += dt;
    if (measT > 0.3) {
      measT = 0;
      measure();
      hud();
    }
    if (held) holdPose();
    // 카메라: 탑 가운데·높이를 천천히 따라간다
    const C = SC.cam;
    if (G_.state === 'judge') judgeUpdate(dt);
    if (G_.state === 'title') C.yaw += dt * 0.06;
    else {
      let cx = 0, cz = 0, n = 0;
      for (const m of matches) { const t = m.body.translation(); if (t.y > 0 && Math.abs(t.x) < TB.w / 2 && Math.abs(t.z) < TB.d / 2 && !(held && held.m === m)) { cx += t.x; cz += t.z; n++; } }
      if (n) { C.txGoal = cx / n; C.tzGoal = cz / n; }
      C.tyGoal = Math.max(1.5, curH * 0.55);
    }
    SC.shift += ((G_.state === 'title' ? 0.3 : 0) - SC.shift) * Math.min(1, dt * 4);
    const k = Math.min(1, dt * 2);
    C.tx += (C.txGoal - C.tx) * k; C.tz += (C.tzGoal - C.tz) * k; C.ty += (C.tyGoal - C.ty) * k;
    if (C.distGoal) { C.dist += (C.distGoal - C.dist) * Math.min(1, dt * 3); if (Math.abs(C.distGoal - C.dist) < 0.05) C.distGoal = 0; }
    marker.material.opacity = 0.22 + 0.18 * Math.sin(performance.now() / 260) ** 2;
  }

  function settleSave() {
    measure();
    if (G_.state !== 'title') {
      if (curH > S.best + 0.05) {
        const first = S.best === 0;
        S.best = +curH.toFixed(2);
        if (!first && curH > 2) { word('BEST ' + curH.toFixed(1) + 'cm'); AU.best(); }
      }
      S.tower = matches.map((m) => { const t = m.body.translation(), r = m.body.rotation(); return [t.x, t.y, t.z, r.x, r.y, r.z, r.w].map((v) => +v.toFixed(4)); });
      save();
    }
    hud();
  }

  let lastT = performance.now(), acc = 0;
  function update(dt, noDraw) {
    if (!G_.paused && world) {
      acc += dt;
      let n = 0;
      while (acc >= DT && n < 10) { physStep(); acc -= DT; n++; }
      if (n === 10) acc = 0;
      logic(dt);
    }
    if (world) sync();
    SC.updateCam();
    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      SC.camera.position.x += (Math.random() - 0.5) * shake * 0.6;
      SC.camera.position.y += (Math.random() - 0.5) * shake * 0.6;
    }
    if (!noDraw) SC.render();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    update(dt);
  }

  // ---------- 입력 ----------
  const cv = $('cv');
  const ptrs = new Map();
  let press = null, pinch = null;
  const TOUCHY = () => SC.MOBILE;
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (G_.state !== 'play' && G_.state !== 'hold' || G_.paused) return;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: SC.cam.dist, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x), tk: 0 };
      press = null;
      return;
    }
    if (e.button === 2) { if (held) putAway(); return; }
    press = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0, touch: e.pointerType !== 'mouse' };
  });
  cv.addEventListener('pointermove', (e) => {
    const pp = ptrs.get(e.pointerId);
    if (pp) { pp.x = e.clientX; pp.y = e.clientY; }
    if (held && e.pointerType === 'mouse') { held.cx = e.clientX; held.cy = e.clientY; }
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      if (held) {
        // 성냥을 든 채 두 손가락을 비틀면 성냥이 같은 쪽으로 돈다 (화면 시계 방향 = 위에서 본 시계 방향)
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        let da = ang - pinch.ang;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        pinch.ang = ang;
        held.yaw -= da;
        pinch.tk += Math.abs(da);
        if (pinch.tk > 0.2) { pinch.tk = 0; AU.tick(); }
        return;
      }
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      SC.cam.dist = Math.max(8, Math.min(130, pinch.dist * (pinch.d / d)));
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      orbit(mx - pinch.mx, my - pinch.my);
      pinch.mx = mx; pinch.my = my;
      return;
    }
    if (!press) return;
    const dx = e.clientX - press.lx, dy = e.clientY - press.ly;
    press.lx = e.clientX; press.ly = e.clientY;
    press.moved += Math.abs(dx) + Math.abs(dy);
    if (press.moved < 6) return;
    if (held && press.touch) {
      // 폰: 손가락 끌기 = 성냥을 옮긴다 (손가락이 가리지 않게 떨어진 채로)
      held.cx = Math.max(0, Math.min(innerWidth, held.cx + dx * 1.1));
      held.cy = Math.max(0, Math.min(innerHeight, held.cy + dy * 1.1));
    } else orbit(dx, dy);
  });
  function orbit(dx, dy) {
    const C = SC.cam;
    C.yaw -= dx * 0.007;
    C.pitch = Math.max(0.12, Math.min(1.35, C.pitch + dy * 0.005));
  }
  const up = (e) => {
    const had = ptrs.has(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!had || !press) { if (ptrs.size === 0) press = null; return; }
    const p = press;
    press = null;
    if (p.moved >= 6 || G_.state === 'title' || G_.paused) return;
    // 누르고 안 움직였다 = 누르기
    if (held) { dropHeld(); return; }
    if (hitBox(e.clientX, e.clientY)) { takeNew(e.pointerType === 'mouse' ? e.clientX : null, e.pointerType === 'mouse' ? e.clientY : null); return; }
    const m = pickMatch(e.clientX, e.clientY);
    if (m) {
      AU.pick();
      if (e.pointerType === 'mouse') beginHold(m, false, e.clientX, e.clientY);
      else { const s = screenOf(m.body.translation()); beginHold(m, false, s[0], s[1]); }
    }
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); press = null; pinch = null; });
  let wheelAcc = 0;
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    if (held && !e.ctrlKey) {
      // 휠 한 칸(100)에 15도. 터치패드처럼 잘게 오는 것은 모아서 돌린다
      wheelAcc += dy;
      while (Math.abs(wheelAcc) >= 90) { const s = Math.sign(wheelAcc); rot(s * Math.PI / 12); wheelAcc -= s * 100; }
      return;
    }
    wheelAcc = 0;
    SC.cam.dist = Math.max(8, Math.min(130, SC.cam.dist * Math.exp(Math.max(-300, Math.min(300, dy)) * 0.0009)));
  }, { passive: false });
  addEventListener('keydown', (e) => {
    if (G_.state === 'title' || G_.state === 'judge' || G_.state === 'result') return;
    const k = e.key.toLowerCase();
    if (k === 'q') rot(Math.PI / 12);
    else if (k === 'e') rot(-Math.PI / 12);
    else if (k === 'r') rot(e.repeat ? -Math.PI / 36 : -Math.PI / 2); // 톡 = 90도, 누르고 있으면 조금씩
    else if (k === ' ' || k === 'f') { e.preventDefault(); if (held) dropHeld(); else takeNew(); }
    else if (k === 'x' || k === 'delete') putAway();
    else if (e.key === 'ArrowLeft') SC.cam.yaw += 0.1;
    else if (e.key === 'ArrowRight') SC.cam.yaw -= 0.1;
    else if (e.key === 'ArrowUp') SC.cam.pitch = Math.min(1.35, SC.cam.pitch + 0.08);
    else if (e.key === 'ArrowDown') SC.cam.pitch = Math.max(0.12, SC.cam.pitch - 0.08);
    else if (k === '=' || k === '+') SC.cam.dist = Math.max(8, SC.cam.dist * 0.9);
    else if (k === '-') SC.cam.dist = Math.min(130, SC.cam.dist * 1.1);
    else if (e.key === 'Escape' || k === 'p') togglePause();
  });

  // ---------- 화면 ----------
  let wordT = null;
  function word(s) {
    const w = $('word');
    w.textContent = L_(s);
    w.className = 'on';
    clearTimeout(wordT);
    wordT = setTimeout(() => (w.className = ''), 1300);
  }
  function hud() {
    $('nN').textContent = matches.length - (held ? 1 : 0);
    $('hN').textContent = curH.toFixed(1);
    $('bN').textContent = (+S.best || 0).toFixed(1);
    $('bestPill').hidden = !(S.best > 0);
    $('bClear').disabled = matches.length - (held ? 1 : 0) < 1;
    $('bSubmit').disabled = matches.length - (held ? 1 : 0) < 2;
  }
  function uiHold() {
    document.body.classList.toggle('holding', !!held);
  }

  // ---------- 판 흐름 ----------
  function camHome() {
    const C = SC.cam;
    C.yaw = 0.55; C.pitch = innerWidth / innerHeight < 0.8 ? 0.62 : 0.5;
    // 시작 시점: 탁자 전체와 소품이 한눈에 (사장님 지정 구도)
    C.dist = innerWidth / innerHeight < 0.8 ? 105 : 74;
    C.distGoal = 0;
    C.tx = C.txGoal = 1; C.tz = C.tzGoal = 0; C.ty = C.tyGoal = 1.5;
  }
  function buildDemo(nLv) {
    // 제목 화면: 우물 정(井)자로 쌓은 성냥탑 (머리는 바깥으로 번갈아)
    newWorld();
    const qx = { x: 0, y: 0, z: 0, w: 1 }, qxF = { x: 0, y: 1, z: 0, w: 0 };
    const qz = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 }, qzF = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
    const off = 1.55;
    for (let k = 0; k < (nLv || 22); k++) {
      const y = HW + k * (M.W + 0.001) + 0.002;
      if (k % 2 === 0) { addMatch(0, y, off, k % 4 ? qxF : qx, true); addMatch(0, y, -off, k % 4 ? qx : qxF, true); }
      else { addMatch(off, y, 0, k % 4 === 1 ? qz : qzF, true); addMatch(-off, y, 0, k % 4 === 1 ? qzF : qz, true); }
    }
    for (let i = 0, n = Math.round(2 / DT); i < n; i++) world.step();
    for (const m of matches) { m.body.setLinvel(Z0, false); m.body.setAngvel(Z0, false); m.body.sleep(); }
    measure();
  }
  function restore(list) {
    newWorld();
    for (const a of list) addMatch(a[0], a[1], a[2], { x: a[3], y: a[4], z: a[5], w: a[6] }, true);
    measure();
  }
  function startGame(cont) {
    hideAll();
    try { if (window.OG) OG.start({ mode: cont ? 'continue' : 'new' }); } catch (e) {}
    if (cont && S.tower && S.tower.length) restore(S.tower);
    else { newWorld(); S.tower = []; save(); curH = 0; }
    camHome();
    G_.state = 'play';
    document.body.classList.add('playing');
    hud();
  }
  function goTitle() {
    hideAll();
    if (held) putAway();
    document.body.classList.remove('playing', 'holding');
    G_.state = 'title';
    buildDemo();
    camHome();
    SC.cam.dist = innerWidth / innerHeight < 0.8 ? 30 : 25;
    SC.cam.pitch = 0.32;
    SC.cam.ty = SC.cam.tyGoal = curH * 0.5;
    $('title').hidden = false;
    const has = S.tower && S.tower.length > 0;
    $('bContinue').hidden = !has;
    $('bStart').textContent = has ? 'NEW GAME' : 'START';
    hud();
  }
  function hideAll() {
    for (const id of ['title', 'pauseCover', 'ask', 'judge']) $(id).hidden = true;
    jd = null; document.body.classList.remove('judging');
    G_.paused = false;
  }
  function togglePause() {
    if (G_.state === 'title') return;
    G_.paused = !G_.paused;
    $('pauseCover').hidden = !G_.paused;
    press = null;
  }
  function ask(onOk) {
    $('ask').hidden = false;
    $('askOk').onclick = () => { AU.click(); $('ask').hidden = true; onOk(); };
    $('askNo').onclick = () => { AU.click(); $('ask').hidden = true; };
  }
  function clearTable() {
    if (held) putAway();
    for (const m of matches.slice()) removeMatch(m);
    S.tower = []; save();
    curH = 0;
    AU.sweep();
    hud();
  }

  // ---------- 제출 → 심사: 높이·예술성·창의성 (각 별 5개 = 333점, 합계 999점) ----------
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function judge() {
    measure();
    const L = [];
    for (const m of matches) {
      if (held && held.m === m) continue;
      const t = m.body.translation(), r = m.body.rotation();
      if (t.y < -1) continue;
      _q.set(r.x, r.y, r.z, r.w);
      const ax = new T.Vector3(1, 0, 0).applyQuaternion(_q);
      L.push({ x: t.x, y: t.y, z: t.z, tilt: Math.abs(ax.y), yaw: Math.atan2(-ax.z, ax.x) });
    }
    const n = L.length;
    if (!n) return null;
    // 무리 나누기: 가운데끼리 3.2cm 안이면 한 무리 (3개 이상 = 작품, 1~2개 = 흩어진 것)
    const par = L.map((_, i) => i), f = (i) => (par[i] === i ? i : (par[i] = f(par[i])));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = L[i], b = L[j];
      if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 < 3.2 * 3.2) par[f(i)] = f(j);
    }
    const G = {};
    L.forEach((m, i) => (G[f(i)] = G[f(i)] || []).push(m));
    const groups = Object.values(G), works = groups.filter((g) => g.length >= 3);
    const loose = n - works.reduce((s, g) => s + g.length, 0);
    const tidy = 1 - loose / n;
    // 방향 정렬: 모두 90도(또는 45도) 격자에 맞춰 놓였나
    const R = (k) => { let c = 0, s = 0; for (const m of L) { c += Math.cos(k * m.yaw); s += Math.sin(k * m.yaw); } return Math.hypot(c, s) / n; };
    const align = Math.max(R(4), R(8) * 0.92);
    // 대칭: 작품마다 가운데를 중심으로 180도·90도 돌렸을 때 짝이 있는가
    const oriD = (a, b) => { let d = Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d); };
    let symSum = 0, symW = 0;
    for (const g of works) {
      let cx = 0, cz = 0;
      for (const m of g) { cx += m.x; cz += m.z; }
      cx /= g.length; cz /= g.length;
      const score = (rot) => {
        let s = 0;
        const c = Math.cos(rot), sn = Math.sin(rot);
        for (const m of g) {
          const dx = m.x - cx, dz = m.z - cz, px = cx + dx * c - dz * sn, pz = cz + dx * sn + dz * c;
          let best = 0;
          for (const o of g) {
            const d2 = (o.x - px) ** 2 + (o.z - pz) ** 2 + (o.y - m.y) ** 2;
            const v = Math.exp(-d2 / 0.5) * Math.cos(oriD(o.yaw, m.yaw - rot));
            if (v > best) best = v;
          }
          s += Math.max(0, best);
        }
        return s / g.length;
      };
      const sy = Math.max(score(Math.PI), score(Math.PI / 2));
      symSum += sy * g.length; symW += g.length;
    }
    const sym = symW ? symSum / symW : 0;
    const few = Math.min(1, n / 6);
    const art = clamp01((0.45 * sym + 0.35 * align + 0.2 * tidy) * few);
    // 창의성: 방향의 다양성, 세우거나 기댄 성냥, 들인 품(개수), 넓게 펼친 정도
    const bins = new Array(12).fill(0);
    for (const m of L) if (m.tilt < 0.6) bins[Math.floor(((((m.yaw % Math.PI) + Math.PI) % Math.PI) + Math.PI / 24) / (Math.PI / 12)) % 12]++; // 0·180도 둘레가 한 칸이 되게
    const used = bins.filter((b) => b >= Math.max(1, n * 0.04)).length;
    const lean = L.filter((m) => m.tilt > 0.25 && m.y > 0.4).length / n;
    let ex = 0; for (const m of L) ex = Math.max(ex, Math.hypot(m.x - L[0].x, m.z - L[0].z));
    const v1 = clamp01((used - 1) / 3), v2 = clamp01(lean * 4), v3 = clamp01(n / 60), v4 = clamp01((works.length - 1) * 0.25 + ex / 16);
    // 아무렇게나 흩뿌린 방향은 창의성이 아니다: 대칭·정렬이 있어야 다양함이 점수가 된다
    const order = Math.max(sym, align * 0.9);
    let cre = (0.6 * v1 + 0.15 * v2 + 0.12 * v3 + 0.13 * v4) * (0.15 + 0.85 * order);
    if (used <= 2 && lean < 0.05) cre *= 0.55; // 흔한 우물 정자 네모탑
    cre = clamp01(cre * few);
    const hs = clamp01(Math.pow(curH / 15, 0.8));
    const sc = [hs, art, cre];
    const pts = sc.map((v) => Math.round(v * 333));
    return { sc, stars: sc.map((v) => Math.round(v * 10) / 2), pts, total: Math.min(999, pts[0] + pts[1] + pts[2]), H: curH, n };
  }
  window.__judge = judge;

  let jd = null;
  function submit() {
    if (held || G_.state !== 'play' || matches.length < 2) return;
    AU.click();
    G_.state = 'judge';
    jd = { t: 0 };
    document.body.classList.add('judging');
    // 탑 둘레를 한 바퀴 둘러보며 심사
    SC.cam.distGoal = Math.max(22, curH * 3 + 18);
    SC.cam.pitch = 0.45;
    word('심사 중');
  }
  function judgeUpdate(dt) {
    if (!jd) return;
    jd.t += dt;
    SC.cam.yaw += dt * 1.6;
    if (jd.t > 2.4) { jd = null; showResult(); }
  }
  function starsHTML(v) {
    let h = '';
    for (let i = 1; i <= 5; i++) h += '<i class="' + (v >= i ? 'on' : v >= i - 0.5 ? 'half' : '') + '">★</i>';
    return h;
  }
  function showResult() {
    const r = judge();
    document.body.classList.remove('judging');
    if (!r) { G_.state = 'play'; return; }
    G_.state = 'result';
    $('judge').hidden = false;
    for (let k = 0; k < 3; k++) { $('st' + k).innerHTML = starsHTML(0); $('jp' + k).textContent = ''; }
    $('jTotal').textContent = '0';
    $('jBest').textContent = '';
    const newBest = r.total > (S.bestScore || 0);
    if (newBest) { S.bestScore = r.total; save(); }
    try { if (window.OG) OG.over({ result: 'SUBMIT', score: r.total, stage: r.n }); } catch (e) {}
    // 별이 한 줄씩 켜지고 합계가 올라간다
    let k = 0;
    const row = () => {
      if (k >= 3) { count(); return; }
      $('st' + k).innerHTML = starsHTML(r.stars[k]);
      $('jp' + k).textContent = r.pts[k];
      $('st' + k).animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
      AU.star(k, r.stars[k]);
      k++;
      setTimeout(row, 420);
    };
    const count = () => {
      const t0 = performance.now(), D = 900;
      let done = false;
      const step = () => {
        if (done) return;
        const e = Math.min(1, (performance.now() - t0) / D);
        $('jTotal').textContent = Math.round(r.total * (1 - Math.pow(1 - e, 3)));
        if (e < 1) { AU.tick(); requestAnimationFrame(step); }
        else {
          done = true;
          $('jTotal').textContent = r.total;
          $('jBest').textContent = newBest ? 'NEW BEST' : 'BEST ' + (S.bestScore || 0);
          $('jBest').className = newBest ? 'nb' : '';
          if (newBest) AU.best();
        }
      };
      // 미리보기처럼 rAF 가 멈춘 곳에서도 끝나게
      const iv = setInterval(() => { const e = (performance.now() - t0) / D; if (e >= 1) { clearInterval(iv); step(); } }, 100);
      step();
    };
    setTimeout(row, 250);
  }
  function closeResult(clear) {
    $('judge').hidden = true;
    G_.state = 'play';
    SC.cam.distGoal = 0;
    if (clear) clearTable();
    hud();
  }

  // ---------- 단추 ----------
  const btn = (id, f) => ($(id).onclick = (e) => { e.stopPropagation(); AU.unlock(); f(); });
  btn('bStart', () => { AU.click(); if (S.tower && S.tower.length) ask(() => startGame(false)); else startGame(false); });
  btn('bContinue', () => { AU.click(); startGame(true); });
  btn('bClear', () => { AU.click(); if (matches.length) ask(clearTable); });
  btn('bSubmit', submit);
  btn('jGo', () => { AU.click(); closeResult(false); });
  btn('jNew', () => { AU.click(); closeResult(true); });
  btn('bDrop', () => dropHeld());
  btn('bPut', () => putAway());

  btn('tClear', () => { AU.click(); if (matches.length) ask(clearTable); });
  btn('tPause', togglePause);
  $('pauseCover').onclick = (e) => { if (e.target.id !== 'pHome') togglePause(); };
  btn('pHome', () => { AU.click(); goTitle(); });
  $('ask').onclick = (e) => { if (e.target.id === 'ask') $('ask').hidden = true; };
  const tg = () => { $('tBgm').classList.toggle('off', !AU.bgm); $('tSnd').classList.toggle('off', !AU.snd); };
  btn('tBgm', () => { AU.setBgm(!AU.bgm); tg(); });
  btn('tSnd', () => { AU.setSnd(!AU.snd); tg(); });
  tg();
  // 회전 단추는 누르고 있으면 계속 돈다
  // 회전 단추: 톡 누르면 90도, 누르고 있으면 조금씩 계속 돈다
  for (const [id, d] of [['bRot', -1]]) {
    let iv = null, spun = false;
    const el = $(id);
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); AU.unlock();
      spun = false; clearTimeout(iv); clearInterval(iv);
      iv = setTimeout(() => { spun = true; iv = setInterval(() => rot(d * Math.PI / 60), 40); }, 320);
    });
    const stop = () => { clearTimeout(iv); clearInterval(iv); iv = null; };
    el.addEventListener('pointerup', stop); el.addEventListener('pointerleave', stop); el.addEventListener('pointercancel', stop);
    el.onclick = (e) => { e.stopPropagation(); if (!spun) rot(d * Math.PI / 2); spun = false; };
  }
  addEventListener('beforeunload', () => { try { if (G_.state !== 'title' && !held) settleSave(); } catch (e) {} });

  // ---------- 시작 ----------
  goTitle();
  SC.renderer.compile(SC.scene, SC.camera);
  update(1 / 60);
  $('loading').hidden = true;
  requestAnimationFrame(frame);

  // 시험 손잡이 (미리보기 창은 rAF 가 안 돈다)
  window.__fk = window.__mt = {
    G: G_, S, get matches() { return matches; }, get held() { return held; }, get world() { return world; },
    tick(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 1 / 60, window.__mtFast); },
    start: startGame, title: goTitle, take: takeNew, drop: dropHeld, put: putAway, rot, measure: () => measure(),
    aim(x, z) { if (held) { held.fix = { x, z }; held.snap = true; } },
    moveTo(sx, sy) { if (held) { held.cx = sx; held.cy = sy; } },
    at(x, y, z, yaw) { const m = addMatch(x, y, z, { x: 0, y: Math.sin((yaw || 0) / 2), z: 0, w: Math.cos((yaw || 0) / 2) }); return m; },
    grab(i) { const m = matches[i]; const s = screenOf(m.body.translation()); beginHold(m, false, s[0], s[1]); return m; },
    screenOf, cabin(n) { buildDemo(n); G_.state = 'play'; },
    shot(name) {
      SC.render();
      const u = SC.renderer.domElement.toDataURL('image/png');
      return fetch('/save?name=' + (name || 'shot.png'), { method: 'POST', body: u }).then((r) => r.text());
    },
  };
})();
