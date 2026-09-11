// 교통 — 도로 그래프(ROADS) 위를 차선 따라 달리는 차·트럭·버스. 신호 준수, 앞차 간격, 교차로 곡선
(function () {
  const I = ISLAND, H = I.H;
  const rng = NOISE.makeRng(5150);
  const R = () => rng();
  const S = { cars: [], meshes: {}, parked: [] };

  function laneOff(e, lane) { return e.lanes === 2 ? 3.4 + lane * 3.2 : Math.max(2.0, e.w / 2 - 3.2); }
  function laneStart(e, lane, out) { const o = laneOff(e, lane); out.x = e.a.x + e.dir.x * e.inA + e.right.x * o; out.z = e.a.z + e.dir.z * e.inA + e.right.z * o; return out; }
  function laneEnd(e, lane, out) { const o = laneOff(e, lane); out.x = e.b.x - e.dir.x * e.inB + e.right.x * o; out.z = e.b.z - e.dir.z * e.inB + e.right.z * o; return out; }
  const _p0 = { x: 0, z: 0 }, _p2 = { x: 0, z: 0 };
  function makeTurn(e, lane, ne, nlane) {
    laneEnd(e, lane, _p0); laneStart(ne, nlane, _p2);
    const p0 = { x: _p0.x, z: _p0.z }, p2 = { x: _p2.x, z: _p2.z };
    let p1; const cross = e.dir.x * ne.dir.z - e.dir.z * ne.dir.x;
    if (Math.abs(cross) < 0.05) { const dot = e.dir.x * ne.dir.x + e.dir.z * ne.dir.z; p1 = dot > 0 ? { x: (p0.x + p2.x) / 2, z: (p0.z + p2.z) / 2 } : { x: (p0.x + p2.x) / 2 + e.dir.x * 5, z: (p0.z + p2.z) / 2 + e.dir.z * 5 }; }
    else { const rx = p2.x - p0.x, rz = p2.z - p0.z; const a = (rx * ne.dir.z - rz * ne.dir.x) / cross; if (a < -2 || a > 40) p1 = { x: (p0.x + p2.x) / 2, z: (p0.z + p2.z) / 2 }; else p1 = { x: p0.x + e.dir.x * a, z: p0.z + e.dir.z * a }; }
    const d01 = Math.hypot(p1.x - p0.x, p1.z - p0.z), d12 = Math.hypot(p2.x - p1.x, p2.z - p1.z), d02 = Math.hypot(p2.x - p0.x, p2.z - p0.z);
    return { p0, p1, p2, len: Math.max(0.5, (d01 + d12 + d02) / 2) };
  }
  function bez(b, u, out) {
    const w = 1 - u;
    out.x = w * w * b.p0.x + 2 * w * u * b.p1.x + u * u * b.p2.x; out.z = w * w * b.p0.z + 2 * w * u * b.p1.z + u * u * b.p2.z;
    const tx = 2 * w * (b.p1.x - b.p0.x) + 2 * u * (b.p2.x - b.p1.x), tz = 2 * w * (b.p1.z - b.p0.z) + 2 * u * (b.p2.z - b.p1.z);
    const L = Math.hypot(tx, tz) || 1; out.dx = tx / L; out.dz = tz / L; return out;
  }
  function pickNext(e) {
    const outs = e.b.out.filter(n => n.b !== e.a && n.type !== 'access');
    if (!outs.length) return e.b.out.find(n => n.b === e.a) || e.b.out[0];
    let tot = 0; const w = outs.map(n => { const d = e.dir.x * n.dir.x + e.dir.z * n.dir.z; const ww = d > 0.6 ? (n.type === e.type ? 6 : 3) : 1; tot += ww; return ww; });
    let r = R() * tot; for (let i = 0; i < outs.length; i++) { r -= w[i]; if (r <= 0) return outs[i]; }
    return outs[outs.length - 1];
  }
  const COLORS = [0xf2f2f2, 0xf2f2f2, 0xf2f2f2, 0xe6e6e6, 0x1b1b1e, 0x1b1b1e, 0x9da3a8, 0x9da3a8, 0x6d7278, 0x2b4a8a, 0x8a2b2b, 0xd9d2c0, 0x3a6a3a];
  const TRUCKC = [0x3a6fc4, 0x3a6fc4, 0xf2f2f2, 0xe8e8e8], BUSC = [0x2a8a5a, 0x2a6ad4, 0xf2c218];

  function spawn(n, keep) {
    const edges = ROADS.edges.filter(e => e.type !== 'access' && e.L > 20);
    const tot = edges.reduce((s, e) => s + e.L, 0);
    let tries = 0;
    while (S.cars.length < n && tries++ < n * 40) {
      let r = R() * tot, e = edges[0]; for (const x of edges) { r -= x.L; if (r <= 0) { e = x; break; } }
      const lane = Math.floor(R() * e.lanes), s = 4 + R() * Math.max(1, e.L - 8);
      const p = laneStart(e, lane, { x: 0, z: 0 }); p.x += e.dir.x * s; p.z += e.dir.z * s;
      // 주인공이 깨어나는 자리엔 놓지 않는다 — 시작하자마자 트럭이 코앞을 막았다 (사장님 2026-09-11 "시작할때 트럭 치워줘")
      if (keep && Math.hypot(p.x - keep.x, p.z - keep.z) < KEEP) continue;
      let ok = true; for (const c of S.cars) if (Math.hypot(c.x - p.x, c.z - p.z) < 16) { ok = false; break; } if (!ok) continue;
      const k = R(); const kind = k < 0.18 ? 'truck' : k < 0.24 ? 'bus' : 'sedan';
      S.cars.push({ kind, e, lane, s, mode: 'edge', turn: null, u: 0, v: e.vmax * 0.5, vmax: e.vmax * (0.85 + R() * 0.3) * (kind === 'sedan' ? 1 : 0.85), x: p.x, z: p.z, dx: e.dir.x, dz: e.dir.z, yaw: Math.atan2(-e.dir.x, -e.dir.z),
        color: kind === 'truck' ? TRUCKC[Math.floor(R() * TRUCKC.length)] : kind === 'bus' ? BUSC[Math.floor(R() * BUSC.length)] : COLORS[Math.floor(R() * COLORS.length)], stopT: 0, stall: 0, creep: 0, len: kind === 'bus' ? 9.5 : 5 });
    }
  }
  const KEEP = 26;   // 출발 자리에서 이만큼은 빈다
  function init(scene, keep) {
    spawn(260, keep);
    S.parked = (CITY.parked || []).filter(p => !keep || Math.hypot(p.x - keep.x, p.z - keep.z) >= KEEP);   // 길가에 세워 둔 차도 같이
    const M = new THREE.Matrix4(), Qq = new THREE.Quaternion(), Vv = new THREE.Vector3(), Ss = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    for (const kind of ['sedan', 'truck', 'bus']) {
      const moving = S.cars.filter(c => c.kind === kind);
      const parked = kind === 'bus' ? [] : S.parked.filter((p, i) => (kind === 'truck') === (i % 5 === 0));
      if (!moving.length && !parked.length) continue;
      const m = CAR.makeMesh(kind, moving.length + parked.length);
      moving.forEach((c, i) => { c.mesh = m; c.idx = i; CAR.setTint(m, i, c.color); });
      parked.forEach((p, k) => { const i = moving.length + k; const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw); const G = (x, z) => { const h = H(x, z); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? h + 0.06 : Math.max(h + 0.06, r); }; const hF = G(p.x + fx * 1.5, p.z + fz * 1.5), hB = G(p.x - fx * 1.5, p.z - fz * 1.5), hL = G(p.x - rx * 0.9, p.z - rz * 0.9), hR = G(p.x + rx * 0.9, p.z + rz * 0.9); E.set(Math.atan2(hF - hB, 3.0) * 0.9, p.yaw, Math.atan2(hR - hL, 1.8) * 0.9, 'YXZ'); Qq.setFromEuler(E); Vv.set(p.x, Math.max(G(p.x, p.z), (hF + hB) / 2), p.z); M.compose(Vv, Qq, Ss); m.setMatrixAt(i, M); CAR.setTint(m, i, kind === 'truck' ? TRUCKC[k % TRUCKC.length] : p.color); });
      m.instanceMatrix.needsUpdate = true; scene.add(m); S.meshes[kind] = m;
    }
  }
  function lightFor(e) {
    if (!e.b.light) return 'g';
    const st = CITY.lampState;
    if (e.ns) return st === 0 ? 'g' : st === 1 ? 'y' : 'r';
    return st === 2 ? 'g' : st === 3 ? 'y' : 'r';
  }
  const M = new THREE.Matrix4(), Qq = new THREE.Quaternion(), E = new THREE.Euler(), Vv = new THREE.Vector3(), Ss = new THREE.Vector3(1, 1, 1);
  const _b = { x: 0, z: 0, dx: 0, dz: 0 };
  function update(dt, player, camPos) {
    const cars = S.cars;
    for (const c of cars) {
      // 카메라에서 아주 멀면 성글게 갱신
      const far = camPos && (Math.abs(c.x - camPos.x) + Math.abs(c.z - camPos.z)) > 900;
      if (far) { c.skip = (c.skip || 0) + 1; if (c.skip % 4 !== 0) continue; }
      const ddt = far ? dt * 4 : dt;
      let dObs = 1e9, byCar = false;
      if (c.stopT > 0) { c.stopT -= ddt; dObs = -1; }
      if (c.mode === 'edge') { const lt = lightFor(c.e), dStop = c.e.L - c.s - 0.6; if (lt === 'r' || (lt === 'y' && dStop > 7)) if (dStop < dObs) dObs = dStop; }
      const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
      if (c.creep <= 0 && !far) {
        for (const o of cars) {
          if (o === c) continue; const ex = o.x - c.x, ez = o.z - c.z; if (ex * ex + ez * ez > 400) continue;
          const ah = ex * fx + ez * fz, lat = ex * rx + ez * rz;
          if (ah > 0 && ah < 18 && Math.abs(lat) < 2.3 + ah * 0.06) { const d = ah - (c.len + o.len) / 2 - 2.5; if (d < dObs) { dObs = d; byCar = true; } }
        }
        if (player && player.veh !== 'diver' && player.veh !== 'glider') { const ex = player.x - c.x, ez = player.z - c.z; const ah = ex * fx + ez * fz, lat = ex * rx + ez * rz; if (ah > 0 && ah < 18 && Math.abs(lat) < 2.4) { const d = ah - c.len / 2 - 2.6; if (d < dObs) { dObs = d; byCar = true; } } }
      } else c.creep -= ddt;
      const vt = dObs < 0 ? 0 : Math.min(c.vmax, Math.sqrt(2 * 5.5 * dObs));
      if (vt > c.v) c.v = Math.min(vt, c.v + 4.5 * ddt); else c.v = Math.max(vt, c.v - 10 * ddt);
      if (c.v < 0.3 && byCar) { c.stall += ddt; if (c.stall > 4) { c.creep = 2.5; c.stall = 0; } } else c.stall = 0;
      const adv = c.v * ddt;
      if (c.mode === 'edge') { c.s += adv; if (c.s >= c.e.L) { const ne = pickNext(c.e), nlane = Math.min(c.lane, ne.lanes - 1); c.turn = makeTurn(c.e, c.lane, ne, nlane); c.u = (c.s - c.e.L) / c.turn.len; c.mode = 'turn'; c.ne = ne; c.nlane = nlane; } }
      else { c.u += adv / c.turn.len; if (c.u >= 1) { c.s = (c.u - 1) * c.turn.len; c.e = c.ne; c.lane = c.nlane; c.mode = 'edge'; } }
      if (c.mode === 'edge') { laneStart(c.e, c.lane, _b); c.x = _b.x + c.e.dir.x * c.s; c.z = _b.z + c.e.dir.z * c.s; c.dx = c.e.dir.x; c.dz = c.e.dir.z; }
      else { bez(c.turn, Math.min(1, c.u), _b); c.x = _b.x; c.z = _b.z; c.dx = _b.dx; c.dz = _b.dz; }
      c.yaw = Math.atan2(-c.dx, -c.dz);
      // 바퀴 자리 = 땅과 그려진 길 표면 중 높은 쪽. 기울기는 앞뒤·좌우 높이차(부호: 앞이 높으면 코가 올라간다 — 2026-09-08 고침)
      const G = (x, z) => { const h = H(x, z); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? h + 0.06 : Math.max(h + 0.06, r); };
      const sx = -c.dz, sz = c.dx;   // 오른쪽
      const hF = G(c.x + c.dx * 1.5, c.z + c.dz * 1.5), hB = G(c.x - c.dx * 1.5, c.z - c.dz * 1.5), hL = G(c.x - sx * 0.9, c.z - sz * 0.9), hR = G(c.x + sx * 0.9, c.z + sz * 0.9);
      const y = Math.max(G(c.x, c.z), (hF + hB) / 2);
      E.set(Math.atan2(hF - hB, 3.0) * 0.9, c.yaw, Math.atan2(hR - hL, 1.8) * 0.9, 'YXZ'); Qq.setFromEuler(E); Vv.set(c.x, y, c.z);
      M.compose(Vv, Qq, Ss); c.mesh.setMatrixAt(c.idx, M);
    }
    for (const k in S.meshes) S.meshes[k].instanceMatrix.needsUpdate = true;
  }
  function hit(c) { c.stopT = Math.max(c.stopT, 1.8); c.v = 0; }
  window.TRAFFIC = Object.assign(S, { init, update, hit, laneStart, laneEnd });
})();
