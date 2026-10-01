// cam.js — 3인칭 카메라 (탐라의 유산과 같은 스프링 팔: 3.6m, 막히면 팔만 줄인다, 저절로 돌지 않는다)
(function () {
  const C = { yaw: Math.PI, pitch: 0.22, dist: 3.6, want: 3.6, target: new THREE.Vector3(), shake: 0, dip: 0, dipV: 0, mode: 'follow' };
  const MINP = -0.45, MAXP = 1.0, ARM = 3.6, PROBE = 0.2;
  // 마우스 휠로 시점 확대·축소 (사장님 2026-09-20 "마우스스크롤로 시점확대되게") — 팔 길이 배율, 겨눌 땐 안 먹는다
  const ZMIN = 0.45, ZMAX = 2.2;
  C.userZoom = 1;
  try { const z = +localStorage.getItem(T.save + '.zoom'); if (z > 0) C.userZoom = U.clamp(z, ZMIN, ZMAX); } catch (e) { }
  // 배율을 정한다 (휠·두 손가락 벌리기가 같이 쓴다). 겨눌 땐 안 바꾼다
  C.setZoom = z => {
    if (T.mode !== 'play' || T.paused || PL.aim) return false;
    C.userZoom = U.clamp(z, ZMIN, ZMAX);
    try { localStorage.setItem(T.save + '.zoom', C.userZoom.toFixed(3)); } catch (e) { }
    return true;
  };
  addEventListener('wheel', e => { C.setZoom(C.userZoom * (e.deltaY > 0 ? 1.12 : 1 / 1.12)); }, { passive: true });

  function look(dx, dy) {
    C.yaw -= dx * 0.0032;
    C.pitch = U.clamp(C.pitch + dy * 0.0026, MINP, MAXP);
  }
  const _dir = new THREE.Vector3(), _w = new THREE.Vector3();

  function armLength(want) {
    const N = 16;
    for (let i = 1; i <= N; i++) {
      const t = want * (i / N);
      if (COL.inside(C.target.x + _dir.x * t, C.target.y + _dir.y * t, C.target.z + _dir.z * t, PROBE))
        return Math.max(0.5, want * ((i - 1) / N) - 0.05);
    }
    return want;
  }

  function update(dt, cam) {
    const p = PL.pos;
    const hgt = PL.dive ? 0.25 : (PL.swim ? 0.9 : 1.4);
    _w.set(p.x, p.y + hgt, p.z);
    // 조준할 땐 어깨 너머로 (hunt.js C.side·C.zoom)
    C.sideCur = U.damp(C.sideCur || 0, C.side || 0, 10, dt);
    if (C.sideCur) { _w.x += Math.cos(C.yaw) * C.sideCur; _w.z -= Math.sin(C.yaw) * C.sideCur; }
    C.target.lerp(_w, 1 - Math.exp(-14 * dt));
    if (C.dip !== 0 || C.dipV !== 0) {
      C.dipV += (-C.dip * 260 - C.dipV * 22) * dt;
      C.dip += C.dipV * dt;
      if (Math.abs(C.dip) < 0.001 && Math.abs(C.dipV) < 0.01) { C.dip = 0; C.dipV = 0; }
      C.target.y += C.dip;
    }
    const wantArm = T.mode === 'title' ? 5.2 : (C.far ? C.far : ARM) * (PL.aim ? 1 : C.userZoom);
    C.want = U.damp(C.want, wantArm, 3, dt);
    const cy = Math.cos(C.pitch), sy = Math.sin(C.pitch);
    _dir.set(Math.sin(C.yaw) * cy, sy, Math.cos(C.yaw) * cy);
    const d = armLength(C.want);
    C.dist = d < C.dist ? d : U.damp(C.dist, d, 5, dt);
    cam.position.set(C.target.x + _dir.x * C.dist, C.target.y + _dir.y * C.dist, C.target.z + _dir.z * C.dist);
    const g = TER.H(cam.position.x, cam.position.z);
    const floor = Math.max(g, PL.swim && !PL.dive ? 0.05 : -99) + 0.35;
    if (cam.position.y < floor) cam.position.y = floor;
    if (PL.dive && cam.position.y > -0.15) cam.position.y = -0.15;   // 잠수 중엔 카메라도 물속 (수면에 걸치면 번쩍인다)
    if (C.shake > 0) {
      C.shake = Math.max(0, C.shake - dt * 2.6);
      const s = C.shake * 0.15;
      cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; cam.position.z += (Math.random() - 0.5) * s;
    }
    cam.lookAt(C.target);
    if (PL.ch) PL.ch.holder.visible = cam.position.distanceTo(C.target) > 0.55;
    const sp = Math.hypot(PL.vel.x, PL.vel.z);
    const wide = Math.max(0, cam.aspect - 1.75) * 16;
    C.zoomCur = U.damp(C.zoomCur || 0, C.zoom || 0, 10, dt);
    const f = 60 + wide + U.clamp((sp - 4) * 1.2, 0, 5) - C.zoomCur;
    if (Math.abs(cam.fov - f) > 0.05) { cam.fov = U.damp(cam.fov, f, 4, dt); cam.updateProjectionMatrix(); }
  }
  C.land = k => { C.dipV = Math.max(-3.0, C.dipV - 2.8 * k); };

  window.CAM = C;
  window.CAMERA = { look, update };
})();
