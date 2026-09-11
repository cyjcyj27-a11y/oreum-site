// 플레이어 — 탈것 바꿔 타기(차·카트·ATV·말·자전거·수레·카약·보트·서프·잠수부·패러글라이더), 땅·물·물속·하늘 물리, 충돌, 추적 카메라
(function () {
  const I = ISLAND, H = I.H;
  const P = { x: 0, z: 0, y: 0, yaw: 0, pitch: 0, roll: 0, long: 0, lat: 0, steer: 0, veh: 'open', car: 'open', params: VEH.PARAMS.open, mode: 'ground', mesh: null, glb: null, glbKey: '',
    safe: { x: 0, z: 0, yaw: 0 }, safeT: 0, sink: 0, crash: 0, slip: 0, onRoad: true, kmh: 0, frozen: false, landed: false, bob: 0, alt: 0, vy: 0 };
  const WHEELBASE = 2.8;
  const hash = new Map(); const CELL = 24;
  const hk = (i, j) => i * 100003 + j;
  function addObst(b) { CITY.obst.boxes.push(b); for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++) for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) { const k = hk(i, j); let a = hash.get(k); if (!a) { a = { b: [], c: [] }; hash.set(k, a); } a.b.push(b); } return b; }
  function buildHash() {
    const O = CITY.obst;
    for (const b of O.boxes) for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++) for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) { const k = hk(i, j); let a = hash.get(k); if (!a) { a = { b: [], c: [] }; hash.set(k, a); } a.b.push(b); }
    for (const c of O.circles) { const k = hk(Math.floor(c.x / CELL), Math.floor(c.z / CELL)); let a = hash.get(k); if (!a) { a = { b: [], c: [] }; hash.set(k, a); } a.c.push(c); }
  }
  function pushOut(px, pz, r, out) {
    let hitN = 0; const i0 = Math.floor(px / CELL), j0 = Math.floor(pz / CELL);
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      const a = hash.get(hk(i, j)); if (!a) continue;
      for (const b of a.b) {
        if (b.dead) continue;   // 판 건물의 충돌 상자는 무시한다
        const cx = Math.max(b.x0, Math.min(b.x1, px)), cz = Math.max(b.z0, Math.min(b.z1, pz));
        let dx = px - cx, dz = pz - cz, d = Math.hypot(dx, dz); if (d >= r) continue;
        if (d < 1e-4) { const L = px - b.x0, Rr = b.x1 - px, Tt = pz - b.z0, B = b.z1 - pz, m = Math.min(L, Rr, Tt, B); dx = m === L ? -1 : m === Rr ? 1 : 0; dz = m === Tt ? -1 : m === B ? 1 : 0; d = -m; } else { dx /= d; dz /= d; }
        out.x += dx * (r - d); out.z += dz * (r - d); out.nx += dx; out.nz += dz; hitN++; out.kind = b.kind || 'building';
      }
      for (const c of a.c) { let dx = px - c.x, dz = pz - c.z; const d = Math.hypot(dx, dz), rr = r + c.r; if (d >= rr || d < 1e-4) continue; dx /= d; dz /= d; out.x += dx * (rr - d); out.z += dz * (rr - d); out.nx += dx; out.nz += dz; hitN++; out.kind = c.kind || 'tree'; }
    }
    return hitN;
  }
  // overWall: 뛰어올라 돌담 위를 지나는 중이면 돌담(wall)은 없는 셈 친다 (2026-09-10 점프로 돌담 넘기)
  function insideBox(px, pz, pad, overWall) { const a = hash.get(hk(Math.floor(px / CELL), Math.floor(pz / CELL))); if (!a) return false; for (const b of a.b) if (!b.dead && !(overWall && b.wall) && px > b.x0 - pad && px < b.x1 + pad && pz > b.z0 - pad && pz < b.z1 + pad) return true; return false; }

  let scene = null;
  function init(sc, spawn) {
    headlights(sc);
    scene = sc; buildHash();
    setVehicle(P.car, spawn.x, spawn.z, spawn.yaw);
    P.safe = { x: P.x, z: P.z, yaw: P.yaw };
  }
  function setVehicle(type, x, z, yaw) {
    if (P.mesh) { scene.remove(P.mesh); P.mesh.geometry.dispose(); }
    P.veh = type; P.params = VEH.PARAMS[type];
    P.mesh = VEH.makeMesh(P.params.mesh, 1); VEH.setTint(P.mesh, 0, P.params.tint); scene.add(P.mesh);
    if (P.params.glb) P.mesh.visible = false;   // GLB 차는 상자 차(옛 오픈카)를 아예 안 보인다 — 읽는 동안에도(사장님 2026-09-09 "옛자동차 안 뜨게")
    loadGlb(P.params.glb ? type : '');
    P.mode = P.params.fly ? 'fly' : P.params.dive ? 'dive' : P.params.water ? 'water' : 'ground';
    if (x != null) { P.x = x; P.z = z; P.yaw = yaw || 0; }
    P.long = P.lat = P.steer = 0; P.sink = 0; P.pitch = P.roll = 0; P.landed = false; P.vy = 0;
    if (P.mode === 'water') P.y = 0; else if (P.mode === 'dive') P.y = -3; else if (P.mode === 'fly') { P.y = H(P.x, P.z) + 6; P.long = 16; } else P.y = H(P.x, P.z);
    camInit = false; place();
  }
  // GLB 모델이 있는 탈것은 상자 모델을 숨기고 GLB 를 같은 자리에 놓는다 (읽는 동안에도 상자는 안 보인다)
  const glbCache = {}, glbPending = {};
  function loadGlb(type) {
    if (P.glb) { scene.remove(P.glb); P.glb = null; }
    P.glbKey = type; if (!type || !window.GLB) return;
    // 이전 차가 화면에 남지 않게 반드시 지우고 새 것을 올린다(이어하기처럼 읽는 도중 다시 부르면 차가 두 대 됐다 — 사장님 2026-09-09)
    const pr = P.params, show = g => { if (P.glbKey !== type) return; if (P.glb && P.glb !== g) scene.remove(P.glb); P.glb = g; g.matrixAutoUpdate = false; g.matrix.copy(M); P.mesh.visible = false; scene.add(g); };
    if (glbCache[type]) { show(glbCache[type]); return; }
    if (glbPending[type]) { glbPending[type].then(show).catch(() => {}); return; }   // 이미 읽는 중이면 그 하나에 붙는다(두 번 읽지 않는다)
    glbPending[type] = GLB.load(pr.glb, { clearcoat: 0.8, envMapIntensity: 1.0 }).then(g => { GLB.fitVehicle(g, pr.glbLen || 4.6, pr.glbYaw || 0); if (pr.door) splitDoor(g); glbCache[type] = g; return g; });
    glbPending[type].then(show).catch(e => console.warn('GLB 실패', pr.glb, e));
  }
  // 운전석 문: 한 덩어리 GLB 에서 왼쪽 문 자리(x<-0.55, z -0.95~0.42, y 0.30~1.05, 차 기준 m)의 삼각형을 떼어 경첩(앞쪽 모서리) 달린 조각으로 만든다.
  // 열림 정도 P.doorOpen(0~1)을 매 프레임 각도로 옮긴다(사장님 "실제 차문도 열렸다 닫히게", 2026-09-08)
  function splitDoor(g) {
    const meshes = []; g.traverse(o => { if (o.isMesh) meshes.push(o); }); if (meshes.length !== 1) return;
    const m = meshes[0]; g.updateMatrixWorld(true);
    const rel = m.matrixWorld.clone(), nrm = new THREE.Matrix3().getNormalMatrix(rel);   // 메시 → 차 기준(g) 좌표
    const geo = m.geometry, pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, idx = geo.index;
    const n = idx ? idx.count : pos.count, v = new THREE.Vector3(), nv = new THREE.Vector3();
    const P3 = [], N3 = [], U3 = [], Pd = [], Nd = [], Ud = [];
    const HINGE = new THREE.Vector3(-0.9, 0, -0.72);
    const inDoor = (x, y, z) => x < -0.72 && z > -0.72 && z < 0.34 && y > 0.40 && y < 0.98;   // 바깥 문 판만(바퀴 덮개·문턱·안쪽 구조물은 제외)
    for (let t = 0; t < n; t += 3) {
      const tri = [], tn = [], tu = []; let door = true;
      for (let k = 0; k < 3; k++) {
        const i = idx ? idx.getX(t + k) : t + k;
        v.fromBufferAttribute(pos, i).applyMatrix4(rel); nv.fromBufferAttribute(nor, i).applyMatrix3(nrm).normalize();
        tri.push(v.x, v.y, v.z); tn.push(nv.x, nv.y, nv.z); tu.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
        if (!inDoor(v.x, v.y, v.z)) door = false;
      }
      if (door) { for (let k = 0; k < 3; k++) { Pd.push(tri[k * 3] - HINGE.x, tri[k * 3 + 1] - HINGE.y, tri[k * 3 + 2] - HINGE.z); } Nd.push(...tn); Ud.push(...tu); }
      else { P3.push(...tri); N3.push(...tn); U3.push(...tu); }
    }
    if (Pd.length < 30) return;   // 문 조각이 안 잡히면 그대로 둔다
    const mk = (Pa, Na, Ua) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(Pa, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(Na, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(Ua, 2)); const mm = new THREE.Mesh(ge, m.material); mm.castShadow = true; mm.frustumCulled = false; return mm; };
    while (g.children.length) g.remove(g.children[0]);   // 원래 덩어리 대신 몸체 + 문
    g.add(mk(P3, N3, U3));
    const hinge = new THREE.Group(); hinge.position.copy(HINGE); hinge.add(mk(Pd, Nd, Ud)); g.add(hinge);
    g.userData.door = hinge; P.doorOpen = 0; P.doorT = 0;
    console.log('car door split: tris', Pd.length / 9);
  }
  // 전조등: 밤에 차 앞 두 개의 스포트라이트가 길을 비춘다
  const HL = { l: null, r: null, tl: null, tr: null };
  function headlights(scene) {
    for (const k of ['l', 'r']) { const sp = new THREE.SpotLight(0xfff2d0, 0, 70, 0.55, 0.5, 1.2); sp.castShadow = false; const t = new THREE.Object3D(); scene.add(t); sp.target = t; scene.add(sp); HL[k] = sp; HL['t' + k] = t; }
  }
  function headlightTick() {
    if (!HL.l) return;
    const night = window.SKY ? SKY.night : 0, on = P.mode === 'ground' && !P.params.water && night > 0.15;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    for (const [k, sd] of [['l', -0.62], ['r', 0.62]]) {
      const sp = HL[k], t = HL['t' + k]; sp.intensity = on ? 90 * Math.min(1, (night - 0.15) / 0.3) : 0; sp.visible = on;
      sp.position.set(P.x + rx * sd + fx * 2.1, P.y + 0.7, P.z + rz * sd + fz * 2.1);
      t.position.set(P.x + rx * sd * 1.6 + fx * 26, P.y - 0.6, P.z + rz * sd * 1.6 + fz * 26); t.updateMatrixWorld();
    }
  }
  function doorTick(dt) {
    const h = P.glb && P.glb.userData.door; if (!h) return;
    P.doorOpen += ((P.doorT || 0) - P.doorOpen) * Math.min(1, dt * 5);
    h.rotation.y = -1.05 * P.doorOpen;   // 경첩(앞 모서리) 기준으로 뒤쪽 끝이 바깥(-x)으로 벌어진다
  }
  // 되돌릴 자리가 물가나 건물 상자 안이면 R 을 눌러도 같은 데 다시 빠진다.
  // 그럴 때는 뭝의 가장 가까운 길 마디로 데려간다 (사장님 2026-09-11 "바다에 갇힐, R 눌러도 안 돌아감")
  function dryRoadSpot(x, z) {
    const nodes = (window.ROADS && ROADS.nodes) || []; let best = null, bd = 1e9;
    for (const nd of nodes) {
      if (H(nd.x, nd.z) < 1.2) continue;                 // 물가는 뺀다
      if (insideBox(nd.x, nd.z, 1.5)) continue;          // 건물 속도 뺀다
      const d = Math.hypot(nd.x - x, nd.z - z); if (d < bd) { bd = d; best = nd; }
    }
    if (!best) return null;
    const e = best.out && best.out[0];
    return { x: best.x, z: best.z, yaw: e ? Math.atan2(-e.dir.x, -e.dir.z) : 0 };
  }
  function respawn() {
    let s = P.safe;
    if (!s || !isFinite(s.x) || H(s.x, s.z) < 0.8 || insideBox(s.x, s.z, 1.0)) { const r = dryRoadSpot(P.x, P.z); if (r) { s = r; P.safe = { x: r.x, z: r.z, yaw: r.yaw }; } }
    P.x = s.x; P.z = s.z; P.yaw = s.yaw; P.long = P.lat = 0; P.sink = 0; P.steer = 0; P.crash = 0; if (P.mode !== 'ground') setVehicle(P.car); place();
  }

  const push = { x: 0, z: 0, nx: 0, nz: 0 };
  const E = new THREE.Euler(), Qq = new THREE.Quaternion(), Vv = new THREE.Vector3(), Ss = new THREE.Vector3(1, 1, 1), M = new THREE.Matrix4();
  function place() {
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    if (P.mode === 'ground') {
      // 바퀴 자리 높이 = 땅과 그려진 길 표면 중 높은 쪽 (아스팔트·인도 조각의 실제 삼각형)
      const G = (x, z) => { const h = H(x, z); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? h : Math.max(h, r); };
      const g = Math.max(-40, G(P.x, P.z));
      const hF = G(P.x + fx * 1.4, P.z + fz * 1.4), hB = G(P.x - fx * 1.4, P.z - fz * 1.4), hL = G(P.x - rx * 0.9, P.z - rz * 0.9), hR = G(P.x + rx * 0.9, P.z + rz * 0.9);
      const ty = Math.max(g, (hF + hB) / 2) - P.sink * 1.6 + (P.params.gallop ? Math.abs(Math.sin(P.bob)) * 0.12 : 0);
      P.y += (ty - P.y) * 0.5;
      P.pitch = Math.atan2(hF - hB, 2.8) * 0.9; P.roll = Math.atan2(hR - hL, 1.8) * 0.9;   // 앞이 높으면 코가 올라가고, 오른쪽이 높으면 오른쪽이 올라간다(부호가 뒤집혀 있었음, 2026-09-08)
    } else if (P.mode === 'water') { P.y = 0.05 + Math.sin(P.bob * 0.7) * 0.08; P.pitch = Math.sin(P.bob * 0.9) * 0.03; P.roll = Math.sin(P.bob * 0.6) * 0.04 + P.steer * 0.15 * Math.min(1, Math.abs(P.long) / 6); }
    else if (P.mode === 'dive') { P.roll = -P.steer * 0.35; }
    else if (P.mode === 'fly') { P.roll = -P.steer * 0.6; }
    E.set(P.pitch, P.yaw, P.roll, 'YXZ'); Qq.setFromEuler(E); Vv.set(P.x, P.y, P.z);
    M.compose(Vv, Qq, Ss); P.mesh.setMatrixAt(0, M); P.mesh.instanceMatrix.needsUpdate = true; if (P.glb) P.glb.matrix.copy(M);
  }

  // inp: { steer, throttle, brake, hb, up, dn }
  function update(dt, inp) {
    doorTick(dt); headlightTick();
    P.crash = 0;
    if (P.frozen) { place(); return; }
    if (P.sink > 0) { P.sink += dt; P.long *= 0.9; P.lat *= 0.9; if (P.sink > 1.6) respawn(); place(); return; }
    const pr = P.params;
    if (P.mode === 'fly') return updateFly(dt, inp);
    if (P.mode === 'dive') return updateDive(dt, inp);
    const spd = Math.abs(P.long);
    const st = inp.steer * pr.steer / (1 + spd * 0.045);
    P.steer += (st - P.steer) * Math.min(1, 10 * dt);
    if (inp.throttle > 0) { if (P.long >= -0.2) P.long += (pr.accel - spd * pr.accel * 0.011) * inp.throttle * dt; else P.long += 14 * dt; }
    if (inp.brake > 0) { if (P.long > 0.3) P.long -= 16 * inp.brake * dt; else P.long = Math.max(-pr.rev, P.long - 6 * inp.brake * dt); }
    if (inp.hb) P.long -= Math.sign(P.long) * Math.min(spd, 7 * dt);
    const water = P.mode === 'water';
    P.onRoad = water ? false : ROADS.onRoad(P.x, P.z);
    const rollR = water ? 0.4 : (P.onRoad || pr.offroad) ? 0.5 : 2.2, drag = water ? 0.01 : (P.onRoad || pr.offroad) ? 0.004 : 0.012;
    P.long -= Math.sign(P.long) * Math.min(spd, rollR * dt) + P.long * spd * drag * dt;
    P.long = Math.max(-pr.rev, Math.min(pr.max, P.long));
    const grip = inp.hb ? Math.min(pr.grip, 1.6) : (water ? pr.grip : (P.onRoad || pr.offroad) ? pr.grip : pr.grip * 0.6);
    // 느린 탈것(말·자전거·수레·카약)은 거의 서 있어도 제자리에서 돈다 — 벽에 막혀도 빠져나온다
    const pivot = pr.max < 16 ? inp.steer * 1.1 * Math.max(0, 1 - spd / 2.5) : 0;
    const yawRate = P.long / WHEELBASE * Math.tan(P.steer) * (inp.hb ? 1.35 : 1) + pivot;
    P.yaw += yawRate * dt;
    P.lat += -yawRate * P.long * dt * 0.55; P.lat *= Math.exp(-grip * dt); P.slip = Math.abs(P.lat);
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const nx = P.x + (fx * P.long + rx * P.lat) * dt, nz = P.z + (fz * P.long + rz * P.lat) * dt;
    if (water) {
      // 뭍에 닿으면 튕긴다
      if (I.coastDist(nx, nz) > -1.5) { P.crash = spd * 0.5; P.long *= -0.3; P.lat *= 0.3; }
      else { P.x = nx; P.z = nz; }
    } else { P.x = nx; P.z = nz; }
    P.x = Math.max(I.BOUNDS.x0 + 40, Math.min(I.BOUNDS.x1 - 40, P.x)); P.z = Math.max(I.BOUNDS.z0 + 40, Math.min(I.BOUNDS.z1 - 40, P.z));
    P.bob += dt * (2 + spd * 0.6);
    if (!water) {
      push.x = push.z = push.nx = push.nz = 0; push.kind = null; let n = 0;
      const rad = pr.low ? 0.7 : 1.05;
      for (const o of [1.35, -1.35]) n += pushOut(P.x + fx * o, P.z + fz * o, rad, push);
      for (const c of TRAFFIC.cars) {
        const ex = c.x - P.x, ez = c.z - P.z; if (ex * ex + ez * ez > 100) continue;
        const cfx = -Math.sin(c.yaw), cfz = -Math.cos(c.yaw), half = c.len / 2 - 1.2;
        for (const a of [1.35, -1.35]) for (const b of [half, -half]) {
          const px = P.x + fx * a, pz = P.z + fz * a, qx = c.x + cfx * b, qz = c.z + cfz * b;
          let dx = px - qx, dz = pz - qz; const d = Math.hypot(dx, dz), rr = 2.05; if (d >= rr || d < 1e-4) continue;
          dx /= d; dz /= d; push.x += dx * (rr - d) * 0.8; push.z += dz * (rr - d) * 0.8; push.nx += dx; push.nz += dz; n++; push.kind = 'car'; TRAFFIC.hit(c);
        }
      }
      if (n) {
        const k = pr.max < 16 ? 1.5 : 1; P.x += push.x * k; P.z += push.z * k;
        const L = Math.hypot(push.nx, push.nz) || 1, nnx = push.nx / L, nnz = push.nz / L;
        const vx = fx * P.long + rx * P.lat, vz = fz * P.long + rz * P.lat, into = vx * nnx + vz * nnz;
        if (into < 0) { P.crash = -into; P.crashKind = push.kind || 'building'; const nvx = vx - nnx * into * 1.35, nvz = vz - nnz * into * 1.35; P.long = (nvx * fx + nvz * fz) * 0.85; P.lat = (nvx * rx + nvz * rz) * 0.85; }
      }
      if (H(P.x, P.z) < -0.6) P.sink = 0.001;
      P.safeT += dt;
      if (P.safeT > 0.7 && !n && H(P.x, P.z) > 0.4 && P.onRoad && P.veh === P.car) { P.safeT = 0; P.safe.x = P.x; P.safe.z = P.z; P.safe.yaw = P.yaw; }
    }
    P.kmh = Math.round(Math.abs(P.long) * 3.6);
    place();
  }
  function updateDive(dt, inp) {
    const pr = P.params, spd = Math.abs(P.long);
    P.steer += (inp.steer * pr.steer - P.steer) * Math.min(1, 6 * dt);
    if (inp.throttle > 0) P.long += pr.accel * dt; if (inp.brake > 0) P.long -= pr.accel * dt;
    P.long -= P.long * 1.2 * dt; P.long = Math.max(-pr.rev, Math.min(pr.max, P.long));
    P.yaw += P.steer * 1.2 * dt * Math.min(1, 0.3 + spd / 3);
    const vy = (inp.up ? 1 : 0) - (inp.dn ? 1 : 0);
    P.vy += (vy * 3.2 - P.vy) * Math.min(1, 4 * dt);
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    const nx = P.x + fx * P.long * dt, nz = P.z + fz * P.long * dt;
    const floor = H(nx, nz) + 0.9;
    if (floor > -1.2) { P.long *= -0.2; } else { P.x = nx; P.z = nz; }
    P.y = Math.max(H(P.x, P.z) + 0.9, Math.min(-0.8, P.y + P.vy * dt));
    P.pitch = Math.max(-0.5, Math.min(0.5, P.vy * 0.12)) - 0.1;
    P.kmh = Math.round(spd * 3.6); P.bob += dt * 2;
    place();
  }
  function updateFly(dt, inp) {
    P.steer += (inp.steer - P.steer) * Math.min(1, 5 * dt);
    // ↑ 는 숙이기(빨라지고 더 가라앉는다), ↓ 는 당기기(느려지고 덜 가라앉는다)
    const dive = inp.throttle - inp.brake;
    const vt = 17 + dive * 8; P.long += (vt - P.long) * Math.min(1, 1.5 * dt);
    const sink = 1.3 + Math.max(0, P.long - 14) * 0.18 + (dive < 0 && P.long < 12 ? 2.5 : 0);
    P.yaw += P.steer * 0.75 * dt;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    P.x += fx * P.long * dt; P.z += fz * P.long * dt;
    // 오름 비탈의 상승기류
    const g = H(P.x, P.z); let lift = 0;
    for (const o of I.OREUMS) { const t = Math.hypot(P.x - o.x, P.z - o.z) / o.r; if (t < 1.3) lift = Math.max(lift, (1.3 - t) * 2.2); }
    P.y += (-sink + lift) * dt;
    P.pitch = -dive * 0.25 - 0.08; P.alt = P.y - Math.max(0, g);
    if (P.y <= Math.max(0, g) + 1.0) { P.y = Math.max(0, g) + 1.0; P.landed = true; }
    P.kmh = Math.round(P.long * 3.6); P.bob += dt;
    place();
  }

  // ── 카메라 ──
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), want = new THREE.Vector3();
  let camInit = false;
  function camera(dt, cam, orbit) {
    const spd = Math.abs(P.long);
    const cy = P.yaw + orbit.yaw;
    let dist, hgt;
    if (P.mode === 'fly') { dist = 14; hgt = 4 + orbit.pitch * 6; } else if (P.mode === 'dive') { dist = 6; hgt = 1.5 + orbit.pitch * 3; } else { dist = (P.params.low ? 5.8 : 7.2) + spd * 0.07; hgt = 2.0 + orbit.pitch * 5; }
    dist *= orbit.zoom || 1; hgt = (hgt - 1.2) * (orbit.zoom || 1) + 1.2;   // 휠 줌: 거리와 높이를 같이 줄인다(가까이 가면 눈높이로)
    want.set(P.x + Math.sin(cy) * dist, P.y + hgt, P.z + Math.cos(cy) * dist);
    if (P.mode === 'ground') {
      const steps = 14;
      for (let i = 1; i <= steps; i++) { const t = i / steps, px = P.x + (want.x - P.x) * t, pz = P.z + (want.z - P.z) * t; if (insideBox(px, pz, 0.4)) { const tb = Math.max(0.12, (i - 1) / steps); want.set(P.x + (want.x - P.x) * tb, want.y, P.z + (want.z - P.z) * tb); break; } }
    }
    if (P.mode === 'dive') { want.y = Math.min(-0.5, Math.max(H(want.x, want.z) + 0.6, want.y)); }
    else { const gy = Math.max(H(want.x, want.z), 0) + 1.0; if (want.y < gy) want.y = gy; }
    if (!camInit) { camPos.copy(want); camInit = true; }
    camPos.lerp(want, 1 - Math.exp(-7 * dt));
    cam.position.copy(camPos);
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    look.set(P.x + fx * 4.0, P.y + (P.mode === 'fly' ? -1 : 0.8), P.z + fz * 4.0);
    cam.lookAt(look);
    const fov = 60 + Math.min(16, spd * 0.28);
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    return camPos;
  }
  window.PLAYER = Object.assign(P, { init, update, camera, respawn, setVehicle, place, insideBox, addObst, dryRoadSpot, setDoor(t) { P.doorT = t; } });
})();
