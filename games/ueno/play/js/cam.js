// cam.js — 3인칭 카메라. 싸울 땐 조금 물러나 높이 본다
(function () {
  const C = { yaw: 0, pitch: 0.3, dist: 6, target: new THREE.Vector3(), shake: 0, auto: 0, zoom: 1 };
  const MINP = -0.1, MAXP = 1.1;
  // 확대: 폰은 두 손가락 벌리기·오므리기, PC 는 마우스 휠 (9/14 사장님). k<1 가까이
  function zoom(k) {
    const z0 = C.zoom;
    C.zoom = U.clamp(z0 * k, 0.4, 1.5);
    C.dist *= C.zoom / z0;
  }

  function look(dx, dy) {
    C.yaw -= dx * 0.0034;
    C.pitch = U.clamp(C.pitch + dy * 0.0028, MINP, MAXP);
    C.auto = 1.2;
  }

  function update(dt, cam) {
    const f = PL.f;
    const want = new THREE.Vector3(f.pos.x, 1.35, f.pos.z);
    // 싸우는 중이면 가까운 상대들 쪽으로 조금 치우쳐 본다
    const zn = ZONE.active;
    let wantDist = T.mode === 'title' ? 3.6 : 5.6;
    if (T.mode === 'title') want.y = 1.2;
    let rate = 9;
    if (T.mode === 'talk' && C.talk) {
      // 대화: 카메라 방향은 대화 내내 고정(옆에서 둘을 함께 본다).
      // 말하는 사람 쪽으로 다가가며 줌인, 해설 줄은 줌아웃 — 휙휙 돌지 않는다
      const s = C.focus, c = C.talk.center;
      if (s) { want.set(U.lerp(c.x, s.pos.x, 0.65), 1.4 * s.scale, U.lerp(c.z, s.pos.z, 0.65)); wantDist = 3.0; }
      else { want.set(c.x, 1.3, c.z); wantDist = 5.6; }
      C.yaw = U.angTo(C.yaw, C.talk.yaw, dt * 1.6);
      C.pitch = U.damp(C.pitch, 0.1, 3, dt);
      C.auto = 1; rate = 3.5;
    } else if (f.dead) {
      // 쓰러진 주인공을 가까이서 내려다본다
      want.y = 0.5; wantDist = 3.6;
      C.pitch = U.damp(C.pitch, 0.75, 2, dt);
    } else if (zn) {
      let sx = 0, sz = 0, n = 0;
      for (const o of FIGHT.all) { if (o.team === 'hero' || o.dead) continue; const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z); if (d < 9) { sx += o.pos.x; sz += o.pos.z; n++; } }
      if (n) { want.x = U.lerp(want.x, sx / n, 0.22); want.z = U.lerp(want.z, sz / n, 0.22); }
      wantDist = 7.2;
    }
    if (T.mode === 'play' && !f.dead) wantDist *= C.zoom;
    // WASD 로 시점 돌리기 (대화 중엔 안 돈다)
    if ((C.keyX || C.keyY) && T.mode === 'play' && !T.paused) {
      C.yaw -= C.keyX * 2.4 * dt;
      C.pitch = U.clamp(C.pitch + C.keyY * 1.3 * dt, MINP, MAXP);
      C.auto = 1.2;
    }
    C.target.lerp(want, 1 - Math.exp(-rate * dt));
    C.dist = U.damp(C.dist, wantDist, 2.5, dt);
    // 마우스를 안 만지면 달리는 방향 뒤로 천천히 돈다 (싸울 땐 안 돈다)
    if (C.auto > 0) C.auto -= dt;
    else if (!zn && T.mode === 'play' && f.moveSpeed > 1.0 && f.state === 'free') {
      C.yaw = U.angTo(C.yaw, f.yaw + Math.PI, dt * 0.9 * (f.moveSpeed / 6));
    }
    const cy = Math.cos(C.pitch), sy = Math.sin(C.pitch);
    let d = C.dist;
    for (let i = 1; i <= 12; i++) {
      const k = d * i / 12;
      if (PARK.camBlocked(C.target.x + Math.sin(C.yaw) * cy * k, C.target.y + sy * k, C.target.z + Math.cos(C.yaw) * cy * k)) { d = Math.max(1.8, d * (i - 1) / 12); break; }
    }
    cam.position.set(C.target.x + Math.sin(C.yaw) * cy * d, Math.max(0.5, C.target.y + sy * d), C.target.z + Math.cos(C.yaw) * cy * d);
    if (C.shake > 0) {
      C.shake = Math.max(0, C.shake - dt * 3);
      const s = C.shake * 0.22;
      cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; cam.position.z += (Math.random() - 0.5) * s;
    }
    cam.lookAt(C.target);
    const wide = Math.max(0, cam.aspect - 1.75) * 14;
    const fov = 58 + wide;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }

  function snap() { const f = PL.f; C.target.set(f.pos.x, 1.35, f.pos.z); C.dist = T.mode === 'title' ? 4.6 : 5.6; }

  window.CAM = C;
  window.CAMERA = { look, update, snap, zoom };
})();
