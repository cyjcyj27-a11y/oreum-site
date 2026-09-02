// 라이더 — 베를레 랙돌. 안장에 엉덩이, 핸들에 손, 발판에 발을 붙이고 나머지는 흔들린다
(function () {
  const P = PHYS;
  const G = -14;
  const ARM = 0.36;

  const pts = {};
  const order = ['head', 'neck', 'chest', 'hip', 'kneeL', 'footL', 'kneeR', 'footR', 'shL', 'shR', 'elbowL', 'handL', 'elbowR', 'handR'];
  const bones = [], braces = [];
  const state = { ride: null, speed: 0, wind: new THREE.Vector3() };

  function def(name, x, y, z, m, r) { const p = P.makePoint(x, y, z, m, r); p.name = name; pts[name] = p; }
  function build(x0, y0, z0) {
    const W = (lx, ly, lz) => [x0 + lx, y0 + ly, z0 + lz];
    let w;
    w = W(0, 1.72, 0); def('head', w[0], w[1], w[2], 0.9, 0.12);
    w = W(0, 1.55, 0); def('neck', w[0], w[1], w[2], 0.8, 0.08);
    w = W(0, 1.38, 0); def('chest', w[0], w[1], w[2], 2.2, 0.14);
    w = W(0, 1.02, 0); def('hip', w[0], w[1], w[2], 2.5, 0.15);
    w = W(-0.1, 0.55, 0); def('kneeL', w[0], w[1], w[2], 0.8, 0.09);
    w = W(-0.12, 0.08, 0); def('footL', w[0], w[1], w[2], 0.7, 0.08);
    w = W(0.1, 0.55, 0); def('kneeR', w[0], w[1], w[2], 0.8, 0.09);
    w = W(0.12, 0.08, 0); def('footR', w[0], w[1], w[2], 0.7, 0.08);
    w = W(-0.24, 1.42, 0); def('shL', w[0], w[1], w[2], 1.0, 0.07);
    w = W(0.24, 1.42, 0); def('shR', w[0], w[1], w[2], 1.0, 0.07);
    w = W(-0.32, 1.15, 0); def('elbowL', w[0], w[1], w[2], 0.6, 0.07);
    w = W(-0.42, 0.85, 0); def('handL', w[0], w[1], w[2], 0.5, 0.06);
    w = W(0.32, 1.15, 0); def('elbowR', w[0], w[1], w[2], 0.6, 0.07);
    w = W(0.42, 0.85, 0); def('handR', w[0], w[1], w[2], 0.5, 0.06);

    const B = (a, b, len) => bones.push({ a: pts[a], b: pts[b], len });
    B('head', 'neck', 0.17); B('neck', 'chest', 0.17); B('chest', 'hip', 0.36);
    B('hip', 'kneeL', 0.48); B('kneeL', 'footL', 0.47); B('hip', 'kneeR', 0.48); B('kneeR', 'footR', 0.47);
    B('shL', 'elbowL', 0.40); B('elbowL', 'handL', 0.33); B('shR', 'elbowR', 0.40); B('elbowR', 'handR', 0.33);
    B('chest', 'shL', 0.22); B('chest', 'shR', 0.22); B('shL', 'shR', 0.38); B('neck', 'shL', 0.2); B('neck', 'shR', 0.2);
    const Br = (a, b, len, k, mode) => braces.push({ a: pts[a], b: pts[b], len, k, mode });
    Br('head', 'chest', 0.34, 0.9, 0); Br('neck', 'hip', 0.53, 0.8, 0); Br('head', 'hip', 0.70, 0.5, 0);
    Br('chest', 'kneeL', 0.80, 0.35, 0); Br('chest', 'kneeR', 0.80, 0.35, 0);
    Br('kneeL', 'kneeR', 0.2, 0.3, 1); Br('kneeL', 'kneeR', 0.5, 0.3, -1);
    Br('chest', 'handL', 0.22, 1, 1); Br('chest', 'handR', 0.22, 1, 1);
    Br('head', 'handL', 0.25, 1, 1); Br('head', 'handR', 0.25, 1, 1);
    Br('elbowL', 'elbowR', 0.28, 0.6, 1); Br('elbowL', 'hip', 0.3, 1, 1); Br('elbowR', 'hip', 0.3, 1, 1);
  }
  function resetAt(x, y, z) {
    for (const k in pts) delete pts[k];
    bones.length = 0; braces.length = 0;
    build(x, y, z);
    if (state.ride) setRide(state.ride);
  }

  // 오토바이 자리에 붙이기. targets: {hip:[x,y,z], handL, handR, footL, footR, lean:[x,y,z]} (매 프레임 갱신)
  const RIDE_PTS = order.slice();   // 탑승 중엔 전부 자세 고정
  function setRide(targets) {
    state.ride = targets;
    for (const n of RIDE_PTS) pts[n].pinned = !!targets;
  }

  function applyForces() {
    const w = state.wind;
    for (const n of order) { const p = pts[n]; p.ay += G; p.ax += w.x; p.az += w.z; }
    // 팔꿈치는 바깥쪽으로, 상체는 진행 방향으로 기울고, 고개는 든다
    const cx = pts.chest.x, cz = pts.chest.z;
    for (const s of ['L', 'R']) { const e = pts['elbow' + s], sh = pts['sh' + s]; const dx = sh.x - cx, dz = sh.z - cz; const d = Math.hypot(dx, dz) + 1e-4; e.ax += dx / d * 6; e.az += dz / d * 6; e.ay -= 4; }
    if (state.ride && state.ride.lean) { const L = state.ride.lean; pts.head.ax += L[0] * 18; pts.head.az += L[2] * 18; pts.chest.ax += L[0] * 10; pts.chest.az += L[2] * 10; }
    pts.head.ay += 7; pts.neck.ay += 5;
  }
  function integrate(dt) {
    for (const n of order) { const p = pts[n]; P.integrate(p, dt, n.startsWith('knee') || n.startsWith('elbow') ? 0.99 : 0.994); }
  }
  function solve() {
    for (const b of bones) P.stick(b.a, b.b, b.len, 1, 0);
    for (const b of braces) P.stick(b.a, b.b, b.len, b.k, b.mode);
    if (state.ride) for (const n of RIDE_PTS) { const q = state.ride[n]; if (!q) continue; const p = pts[n]; p.x = p.px = q[0]; p.y = p.py = q[1]; p.z = p.pz = q[2]; }
  }
  function collide() { for (const n of order) P.collideTerrain(pts[n], 0.3); }
  function after(dt) { state.speed = P.speed(pts.chest) / dt; }

  window.PLAYER = { pts, order, state, resetAt, setRide, applyForces, integrate, solve, collide, after };
})();
