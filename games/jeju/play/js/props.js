// props.js — 부딪히면 세상이 반응한다 (후기 2026-09-17 "상호작용이 너무 없다 · 염소시뮬레이터 같은 병맛 연출")
//   · 돌담: 세게 들이받으면 무너지고 현무암 돌이 튀어 구른다. 차는 속도만 조금 잃고 뚫고 간다. 떠나면 다시 쌓인다
//   · 가로등·신호등: 들이받으면 달리던 쪽으로 넘어간다
//   · 나무: 흔들리고 잎이 흩날린다. 귤나무면 귤이 떨어져 구른다
//   · 세워 둔 차: 경보가 삐용삐용
//   · 흩어진 돌·귤은 걸어가며 차고, 차로 밀면 튀어 나간다
//   그리기는 종류마다 InstancedMesh 하나(돌·귤·잎) — 조각이 늘어도 그리기 명령은 셋
(function () {
  const I = ISLAND, H = I.H;
  const G = 9.8;
  const KINDS = {
    stone:  { max: 220, e: 0.25, fric: 2.4, life: 70, kick: 0.9 },
    orange: { max: 60, e: 0.45, fric: 0.9, life: 60, kick: 1.6 },
    leaf:   { max: 160, e: 0, fric: 0, life: 4.5, kick: 0 },
  };
  const P = { meshes: {}, free: {}, bodies: [], falls: [], shakes: [], broken: [], alarmT: 0, sayT: 0, ready: false };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), AX = new THREE.Vector3(), YUP = new THREE.Vector3(0, 1, 0), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

  function init(scene) {
    const rk = TEX.P && TEX.P.aerial_rocks_02;
    const stoneG = new THREE.DodecahedronGeometry(1, 0);
    { const p = stoneG.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.35 * Math.abs(Math.sin(p.getX(i) * 7.1 + p.getY(i) * 3.3 + p.getZ(i) * 5.7)); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.75, p.getZ(i) * k); } stoneG.computeVertexNormals(); }
    const stoneM = new THREE.MeshStandardMaterial({ color: 0x4e5056, roughness: 1, map: rk && rk.map || null, normalMap: rk && rk.normal || null, flatShading: true });
    // 귤: 살짝 납작한 주황 공 + 초록 꼭지. 밤에도 귤로 보이게 은은히 빛낸다(9/17 사장님 "귤이 아니라 돌 같은데")
    const peel = new THREE.SphereGeometry(1, 18, 12); peel.scale(1, 0.82, 1);
    const stem = new THREE.CylinderGeometry(0.12, 0.16, 0.22, 6); const leafT = new THREE.SphereGeometry(0.3, 6, 4); leafT.scale(1, 0.2, 0.55);
    const orangeG = GEO.mergeGeos([{ g: peel, c: [1, 0.52, 0.08] }, { g: stem, m: GEO.T(0, 0.86, 0), c: [0.25, 0.45, 0.12] }, { g: leafT, m: GEO.T(0.28, 0.9, 0, 0, 0, 0.3), c: [0.2, 0.5, 0.15] }]);
    const orangeM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: 0x5a2600, emissiveIntensity: 0.9 });
    // 잎: 뾰족한 잎 모양, 밝은 초록에 은은한 빛 — 네모판일 땐 밤에 까만 돌처럼 보였다(9/17 사장님 "떨어지기 전엔 돌")
    const leafG = new THREE.ShapeGeometry(new THREE.Shape().moveTo(0, -0.5).quadraticCurveTo(0.42, 0, 0, 0.5).quadraticCurveTo(-0.42, 0, 0, -0.5));
    const leafM = new THREE.MeshStandardMaterial({ color: 0x6fae3c, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x1e3a0e, emissiveIntensity: 1 });
    for (const [k, g, m] of [['stone', stoneG, stoneM], ['orange', orangeG, orangeM], ['leaf', leafG, leafM]]) {
      const n = KINDS[k].max, mesh = new THREE.InstancedMesh(g, m, n);
      for (let i = 0; i < n; i++) mesh.setMatrixAt(i, ZERO);
      mesh.frustumCulled = false; mesh.castShadow = k === 'stone'; mesh.receiveShadow = true;
      scene.add(mesh); P.meshes[k] = mesh; P.free[k] = Array.from({ length: n }, (_, i) => n - 1 - i);
    }
    P.ready = true;
  }

  // 발 디딜 높이 — 땅과 길 중 높은 쪽
  const ground = (x, z) => { const h = H(x, z); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? h : Math.max(h, r); };

  function spawn(kind, x, y, z, vx, vy, vz, r) {
    const f = P.free[kind]; let idx = f.pop();
    if (idx == null) {   // 다 쓰면 가장 오래된 것을 거둔다
      let old = -1, ot = -1; for (let i = 0; i < P.bodies.length; i++) if (P.bodies[i].kind === kind && P.bodies[i].t > ot) { ot = P.bodies[i].t; old = i; }
      if (old < 0) return null; idx = P.bodies[old].idx; P.bodies.splice(old, 1);
    }
    const b = { kind, idx, x, y, z, vx, vy, vz, r, t: 0, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6)), ax: Math.random() - 0.5, ay: Math.random() - 0.5, az: Math.random() - 0.5, spin: 0, rest: 0 };
    if (kind === 'leaf') b.spin = 4 + Math.random() * 6;
    P.bodies.push(b); return b;
  }

  // ── 인스턴스 손보기 (city.js 가 item._ms 에 [메시, 번호, …] 를 적어 둔다) ──
  function baseMat(it, out) { Q.setFromAxisAngle(YUP, it.yaw || 0); V.set(it.x, it.y, it.z); SC.set(it.sx || 1, it.sy || 1, it.sz || 1); return out.compose(V, Q, SC); }
  function setInst(it, m4) { const a = it._ms; if (!a) return; for (let k = 0; k < a.length; k += 2) { a[k].setMatrixAt(a[k + 1], m4); a[k].instanceMatrix.needsUpdate = true; } }

  // player.js 가 부딪힐 때마다 부른다. 뚫고 지나가면 남길 속도 비율(0~1), 아니면 0
  function hit(obj, speed, vx, vz) {
    if (!P.ready || !obj) return 0;
    if (obj.kind === 'stone' && obj.item && !obj.dead && speed > 3.5) return breakWall(obj, speed, vx, vz);
    if (obj.kind === 'pole' && obj.item && !obj.dead && speed > 3) return knockPole(obj, speed, vx, vz);
    if (obj.kind === 'tree' && obj.item && speed > 2) shakeTree(obj, speed, vx, vz);
    if (obj.kind === 'car' && speed > 1.5) alarm();
    return 0;
  }

  function breakWall(b, speed, vx, vz) {
    const it = b.item; b.dead = true; setInst(it, ZERO);
    const L = it.sx, hgt = it.sy, cs = Math.cos(it.yaw || 0), sn = Math.sin(it.yaw || 0);
    const sp = Math.hypot(vx, vz) || 1, n = Math.min(26, 12 + Math.round(speed * 0.8));
    for (let k = 0; k < n; k++) {
      const u = (Math.random() - 0.5) * L, h = Math.random() * hgt;
      const x = it.x + cs * u, z = it.z - sn * u, push = 0.35 + Math.random() * 0.6;
      spawn('stone', x, it.y + 0.2 + h, z, vx * push + (Math.random() - 0.5) * 3, 1.5 + Math.random() * 3.5 + speed * 0.12, vz * push + (Math.random() - 0.5) * 3, 0.16 + Math.random() * 0.2);
    }
    P.broken.push({ b, it, t: 0 });
    AUDIO.crash(Math.min(12, speed + 4), 'stone');
    react('wall');
    return Math.max(0.55, 1 - speed * 0.02);   // 빠를수록 조금 더 잃는다
  }

  function knockPole(c, speed, vx, vz) {
    c.dead = true;
    const sp = Math.hypot(vx, vz) || 1;
    AX.set(vz / sp, 0, -vx / sp);   // 달리는 쪽으로 넘어가는 축
    const f = { c, it: c.item, extra: c.extra || [], ax: AX.clone(), ang: 0, w: 0.6 + speed * 0.08, t: 0, flip: false };
    // 가로등 팔이 땅에 박히는 쪽이면 기둥을 제 축으로 반 바퀴 돌려 눕힌다(팔이 위로)
    if (f.extra.length) { const e = f.extra[0], q = new THREE.Quaternion().setFromAxisAngle(f.ax, 1.48); const up = new THREE.Vector3(e.x - f.it.x, e.y - f.it.y, e.z - f.it.z).applyQuaternion(q).y; f.flip = up < 1; }
    P.falls.push(f);
    AUDIO.crash(Math.min(10, speed + 2), 'pole'); AUDIO.tone(520, 0.5, 'triangle', 0.08); AUDIO.tone(760, 0.7, 'sine', 0.05, 0.03);
    react('pole');
    return Math.max(0.6, 1 - speed * 0.015);
  }

  function shakeTree(c, speed, vx, vz) {
    const it = c.item; if (P.shakes.some(s => s.it === it)) return;
    const sp = Math.hypot(vx, vz) || 1;
    P.shakes.push({ it, ax: new THREE.Vector3(vz / sp, 0, -vx / sp), amp: Math.min(0.28, 0.05 + speed * 0.025), t: 0 });
    const s = it.sx || 1, n = Math.min(14, 4 + Math.round(speed));
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, r = Math.random() * s; spawn('leaf', it.x + Math.cos(a) * r, it.y + s * (1.4 + Math.random() * 0.9), it.z + Math.sin(a) * r, (Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2, 0.09 + Math.random() * 0.04); }
    if (c.orch && speed > 3) for (let k = 0; k < 3 + Math.round(Math.random() * 3); k++) { const a = Math.random() * 6.28, r = s * 0.6; spawn('orange', it.x + Math.cos(a) * r, it.y + s * 1.6, it.z + Math.sin(a) * r, (Math.random() - 0.5) * 1.5, 0.5, (Math.random() - 0.5) * 1.5, 0.15); }
  }

  function alarm() {
    if (P.alarmT > 0) return; P.alarmT = 4.6;
    if (AUDIO.alarm) AUDIO.alarm(4.2);
    react('car');
  }

  // 옆자리 여자친구 한마디 (연달아 부수면 가끔만)
  const SAY = {
    wall: ['오빠!! 남의 돌담을 왜 부숴?!', '방금 그거 일부러 그런 거지?', '돌담 다시 쌓으려면 하르방들 고생하신다…', '와… 돌이 다 날아갔어 ㅋㅋㅋ', '이 동네에서 우리 얼굴 팔리겠다'],
    pole: ['가로등!! 오빠 미쳤어?', '가로등이 누웠어… 오늘 밤 이 길 깜깜하겠다', '보험 되는 거 맞지?', '100억 있다고 막 사는 거 아니야'],
    car: ['경보 울린다! 빨리 가!', '주인 나오기 전에 튀어!', '삐용삐용… 창피해 죽겠네'],
  };
  function react(k) {
    if (P.sayT > 0 || !window.PET || !PET.say || PET.onFoot) return;
    const a = SAY[k]; if (!a) return;
    if (PET.say('여친', a[Math.floor(Math.random() * a.length)], 3.4, false)) P.sayT = 14;
  }

  function update(dt) {
    if (!P.ready || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    if (P.alarmT > 0) P.alarmT -= dt;
    if (P.sayT > 0) P.sayT -= dt;
    const hero = window.PET && PET.onFoot ? PET.state : null;
    const car = PLAYER, cvx = -Math.sin(car.yaw) * car.long, cvz = -Math.cos(car.yaw) * car.long;
    // ── 조각들 ──
    for (let i = P.bodies.length - 1; i >= 0; i--) {
      const b = P.bodies[i], K = KINDS[b.kind]; b.t += dt;
      if (b.kind === 'leaf') {   // 잎: 천천히 팔랑이며 내려앉는다
        b.vy = Math.max(b.vy - G * 0.5 * dt, -1.2); b.vx *= 1 - 1.2 * dt; b.vz *= 1 - 1.2 * dt;
        b.x += (b.vx + Math.sin(b.t * 3 + b.idx) * 0.6) * dt; b.y += b.vy * dt; b.z += (b.vz + Math.cos(b.t * 2.6 + b.idx) * 0.6) * dt;
        const g = ground(b.x, b.z) + 0.03; if (b.y < g) { b.y = g; b.vx = b.vz = b.vy = 0; b.spin = 0; }
        b.q.multiply(Q2.setFromAxisAngle(AX.set(b.ax, b.ay, b.az).normalize(), b.spin * dt));
      } else {
        // 걷는 주인공·달리는 차가 건드리면 튄다
        if (hero && b.kind !== 'leaf') { const dx = b.x - hero.x, dz = b.z - hero.z, d = Math.hypot(dx, dz); if (d < 0.45 + b.r && Math.abs(b.y - hero.y) < 1.2) { const s = Math.max(1.2, Math.abs(hero.spd)) * K.kick, fy = -Math.sin(hero.yaw), fz = -Math.cos(hero.yaw); b.vx = (dx / (d || 1) * 0.5 + fy) * s; b.vz = (dz / (d || 1) * 0.5 + fz) * s; b.vy = 1.2 + s * 0.35; b.rest = 0; if (b.t > 0.3 && s > 2) AUDIO.tone(b.kind === 'stone' ? 180 : 320, 0.08, 'triangle', 0.06); } }
        if (!(window.PET && PET.onFoot) && Math.abs(car.long) > 2) { const dx = b.x - car.x, dz = b.z - car.z, d = Math.hypot(dx, dz); if (d < 1.9 && Math.abs(b.y - car.y) < 1.5) { b.vx = cvx * 1.1 + dx / (d || 1) * 2; b.vz = cvz * 1.1 + dz / (d || 1) * 2; b.vy = 2 + Math.abs(car.long) * 0.12; b.rest = 0; } }
        if (!(b.rest > 1.2 && b.t > 2)) {   // 멈춘 조각은 건드릴 때까지 쉰다
          b.vy -= G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
          const g = ground(b.x, b.z) + b.r * 0.7;
          if (g < -0.3 && b.y < 0) { b.vx *= 0.9; b.vz *= 0.9; if (b.y < -3) b.t = K.life; }   // 바다에 빠지면 가라앉는다
          else if (b.y < g) {
            b.y = g; if (b.vy < -1.5) { b.vy = -b.vy * K.e; if (b.kind === 'stone' && b.vy > 1.2 && b.t < 3) AUDIO.tone(120 + Math.random() * 60, 0.05, 'triangle', 0.04); } else b.vy = 0;
            // 비탈이면 아래로 구른다
            const sx = H(b.x + 0.5, b.z) - H(b.x - 0.5, b.z), sz = H(b.x, b.z + 0.5) - H(b.x, b.z - 0.5);
            b.vx -= sx * G * 0.5 * dt; b.vz -= sz * G * 0.5 * dt;
            const f = Math.max(0, 1 - K.fric * dt); b.vx *= f; b.vz *= f;
            const hs = Math.hypot(b.vx, b.vz);
            if (hs > 0.05) { AX.set(b.vz, 0, -b.vx).normalize(); b.q.premultiply(Q2.setFromAxisAngle(AX, hs / b.r * dt)); b.rest = 0; } else { b.vx = b.vz = 0; b.rest += dt; }
          } else { b.q.multiply(Q2.setFromAxisAngle(AX.set(b.ax, b.ay, b.az).normalize(), 6 * dt)); }
        }
      }
      const fade = b.t > K.life - 1 ? Math.max(0, K.life - b.t) : 1;
      if (b.t >= K.life) { P.meshes[b.kind].setMatrixAt(b.idx, ZERO); P.free[b.kind].push(b.idx); P.bodies.splice(i, 1); continue; }
      const s = b.r * fade; V.set(b.x, b.y, b.z); SC.set(s, s, s); M4.compose(V, b.q, SC); P.meshes[b.kind].setMatrixAt(b.idx, M4);
    }
    for (const k in P.meshes) P.meshes[k].instanceMatrix.needsUpdate = true;

    // ── 넘어가는 기둥 ── 밑동을 축으로 돌린다. 땅에 닿으면 한 번 튄다
    for (const f of P.falls) {
      if (f.ang < 1.48) { f.w += 3.2 * Math.max(0.3, Math.sin(f.ang + 0.2)) * dt; f.ang = Math.min(1.48, f.ang + f.w * dt); if (f.ang >= 1.48) { f.w = 0; AUDIO.crash(5, 'pole'); } }
      f.t += dt;
      Q2.setFromAxisAngle(f.ax, f.ang);
      const pivot = V.set(f.it.x, f.it.y, f.it.z).clone();
      for (const it of [f.it].concat(f.extra)) {
        baseMat(it, M4);
        const fl = f.flip ? -1 : 1, off = new THREE.Vector3((it.x - pivot.x) * fl, it.y - pivot.y, (it.z - pivot.z) * fl).applyQuaternion(Q2);
        const rot = new THREE.Quaternion().setFromAxisAngle(YUP, (it.yaw || 0) + (f.flip ? Math.PI : 0)).premultiply(Q2);
        M4.compose(off.add(pivot), rot, SC.set(it.sx || 1, it.sy || 1, it.sz || 1)); setInst(it, M4);
      }
    }
    // ── 흔들리는 나무 ──
    for (let i = P.shakes.length - 1; i >= 0; i--) {
      const s = P.shakes[i]; s.t += dt; const a = s.amp * Math.exp(-s.t * 2.2) * Math.sin(s.t * 14);
      Q2.setFromAxisAngle(s.ax, a); baseMat(s.it, M4); const rot = new THREE.Quaternion().setFromAxisAngle(YUP, s.it.yaw || 0).premultiply(Q2);
      M4.compose(V.set(s.it.x, s.it.y, s.it.z), rot, SC.set(s.it.sx || 1, s.it.sy || 1, s.it.sz || 1)); setInst(s.it, M4);
      if (s.t > 2.5) { setInst(s.it, baseMat(s.it, M4)); P.shakes.splice(i, 1); }
    }
    // ── 되돌리기: 45초 지나고 주인공이 60m 밖이면 담·기둥이 제자리 ──
    const hx = hero ? hero.x : car.x, hz = hero ? hero.z : car.z;
    for (let i = P.broken.length - 1; i >= 0; i--) { const w = P.broken[i]; w.t += dt; if (w.t > 45 && Math.hypot(w.it.x - hx, w.it.z - hz) > 60) { w.b.dead = false; setInst(w.it, baseMat(w.it, M4)); P.broken.splice(i, 1); } }
    for (let i = P.falls.length - 1; i >= 0; i--) { const f = P.falls[i]; if (f.t > 60 && Math.hypot(f.it.x - hx, f.it.z - hz) > 60) { f.c.dead = false; for (const it of [f.it].concat(f.extra)) setInst(it, baseMat(it, M4)); P.falls.splice(i, 1); } }
  }

  window.PROPS = { init, update, hit, spawn, state: P };
})();
