// 물리: 공(반지름 BR) 여러 개, 경사로 바닥, 그물 우리 벽, 움직이는 백보드·림·그물.
// 좌표: x 오른쪽, y 위, z 플레이어 쪽(+). 골대는 z 가 음수인 쪽. 단위 m, 초.
(function () {
  const P = (window.PHY = {});
  const BR = (P.BR = 0.095);            // 공 반지름(오락실 미니 농구공)
  const RIM_R = (P.RIM_R = 0.205);      // 림 안쪽 반지름(공의 2.16배)
  const TUBE = (P.TUBE = 0.011);        // 림 쇠막대 굵기
  const G = (P.G = 9.8);
  P.CW = 0.88;                          // 우리 반폭
  P.FZ = 0.56;                          // 앞 턱(공 모이는 통 끝)
  P.FY = 0.80;                          // 앞 턱 바닥 높이
  P.SL = 0.085;                         // 경사(골대 쪽이 높다)
  P.TR = 0.07;                          // 가운데로 모이는 골
  P.ROOF = 3.45;
  P.REL = { x: 0, y: 1.30, z: 0.12 };   // 던지는 자리
  P.ELEV = 54 * Math.PI / 180;          // 던지는 각도(고정)
  P.BOARD = { hw: 0.46, hh: 0.31, hd: 0.016 };
  P.NET_D = 0.31;

  // 골대(움직임) 상태: 림 중심 h, 속도 hv
  const H = (P.hoop = { x: 0, y: 2.3, z: -2.6, vx: 0, vy: 0, vz: 0 });
  P.boardZ = () => H.z - (RIM_R + 0.075);
  P.backZ = () => P.boardZ() - 0.035;   // 백보드는 뒷벽에 바로 붙어 있다(뒤에 공간 없음)

  P.floorY = (x, z) => P.FY + P.SL * (P.FZ - z) + P.TR * (x / P.CW) * (x / P.CW);
  function floorN(x, z) {
    const dx = 2 * P.TR * x / (P.CW * P.CW), dz = -P.SL;
    const l = Math.hypot(dx, 1, dz);
    return { x: -dx / l, y: 1 / l, z: -dz / l };
  }

  P.balls = [];
  P.newBall = function (id, x, z) {
    const b = { id, p: { x, y: P.floorY(x, z) + BR, z }, v: { x: 0, y: 0, z: 0 },
      q: [0, 0, 0, 1], w: { x: 0, y: 0, z: 0 }, state: 'rest', live: false, scored: false,
      rim: 0, board: 0, inNet: false, onFloor: true, prevY: 0, fire: false, lastHit: 0 };
    P.balls.push(b);
    return b;
  };

  // 이번 걸음에 생긴 일(소리·점수) — game 이 읽고 비운다
  P.events = [];
  const ev = (type, b, k) => P.events.push({ type, b, k: k || 0 });

  function sphereBox(b, cx, cy, cz, hx, hy, hz, vx, vy, vz, e, tag) {
    const p = b.p;
    const qx = Math.max(cx - hx, Math.min(cx + hx, p.x));
    const qy = Math.max(cy - hy, Math.min(cy + hy, p.y));
    const qz = Math.max(cz - hz, Math.min(cz + hz, p.z));
    let dx = p.x - qx, dy = p.y - qy, dz = p.z - qz;
    let d = Math.hypot(dx, dy, dz);
    if (d >= BR) return false;
    if (d < 1e-6) { dx = 0; dy = 0; dz = 1; d = 1e-6; }
    const nx = dx / d, ny = dy / d, nz = dz / d, pen = BR - d;
    p.x += nx * pen; p.y += ny * pen; p.z += nz * pen;
    let rx = b.v.x - vx, ry = b.v.y - vy, rz = b.v.z - vz;
    const vn = rx * nx + ry * ny + rz * nz;
    if (vn < 0) {
      rx -= (1 + e) * vn * nx; ry -= (1 + e) * vn * ny; rz -= (1 + e) * vn * nz;
      // 미끄럼 마찰: 접선 성분 조금 줄임
      const tn = rx * nx + ry * ny + rz * nz;
      const tx = rx - tn * nx, ty = ry - tn * ny, tz = rz - tn * nz;
      rx = tn * nx + tx * 0.86; ry = tn * ny + ty * 0.86; rz = tn * nz + tz * 0.86;
      b.v.x = rx + vx; b.v.y = ry + vy; b.v.z = rz + vz;
      if (-vn > 0.35) ev(tag, b, -vn);
    }
    return true;
  }

  function rim(b) {
    const p = b.p;
    const hx = p.x - H.x, hz = p.z - H.z;
    const hd = Math.hypot(hx, hz);
    if (Math.abs(p.y - H.y) > BR + TUBE + 0.02 || Math.abs(hd - RIM_R) > BR + TUBE + 0.02) return;
    const kx = hd > 1e-6 ? H.x + RIM_R * hx / hd : H.x + RIM_R, kz = hd > 1e-6 ? H.z + RIM_R * hz / hd : H.z;
    let dx = p.x - kx, dy = p.y - H.y, dz = p.z - kz;
    const d = Math.hypot(dx, dy, dz), lim = BR + TUBE;
    if (d >= lim || d < 1e-6) return;
    const nx = dx / d, ny = dy / d, nz = dz / d, pen = lim - d;
    p.x += nx * pen; p.y += ny * pen; p.z += nz * pen;
    let rx = b.v.x - H.vx, ry = b.v.y - H.vy, rz = b.v.z - H.vz;
    const vn = rx * nx + ry * ny + rz * nz;
    if (vn < 0) {
      const e = 0.62;
      rx -= (1 + e) * vn * nx; ry -= (1 + e) * vn * ny; rz -= (1 + e) * vn * nz;
      const tn = rx * nx + ry * ny + rz * nz;
      rx = tn * nx + (rx - tn * nx) * 0.88; ry = tn * ny + (ry - tn * ny) * 0.88; rz = tn * nz + (rz - tn * nz) * 0.88;
      // 림 바깥쪽(공이 림 고리 밖)에 맞으면 바깥·플레이어 쪽으로 확실히 튕겨 나감 — 골대 밑으로 곧게 떨어지면 들어간 것처럼 보인다
      if (hd > RIM_R && b.live) {
        const ox = hx / hd, oz = hz / hd, out = rx * ox + rz * oz;
        if (out < 1.3) { rx += (1.3 - out) * ox; rz += (1.3 - out) * oz; }
        if (oz > -0.2) rz += 0.7;
        // 아래로 꺾이면 골대 밑으로 떨어지는 것처럼 보이니 위로 한 번 튀어 오르게(곡선을 그리며 나옴)
        if (!b.rimPop) { b.rimPop = 1; if (ry < 1.1) ry = 1.1 + Math.random() * 0.5; rx += (Math.random() - 0.5) * 0.8; }
      }
      b.v.x = rx + H.vx; b.v.y = ry + H.vy; b.v.z = rz + H.vz;
      if (b.live) b.rim++;
      if (-vn > 0.25) ev('rim', b, -vn);
    }
  }

  function net(b) {
    const p = b.p;
    const t = (H.y - p.y) / P.NET_D;
    if (t < 0 || t > 1) { if (t > 1.4 || t < -0.5) b.inNet = false; return; }
    const rn = RIM_R * (1 - 0.36 * t);
    const hx = p.x - H.x, hz = p.z - H.z, hd = Math.hypot(hx, hz);
    if (!b.inNet) {
      // 그물 바깥: 림 아래로 지나가는 공은 그물에 걸려 튕겨 나간다(뚫고 지나가면 들어간 것처럼 보임)
      const out = rn + BR * 1.05;
      if (hd < out) {
        const nx = hd > 1e-6 ? hx / hd : 0, nz = hd > 1e-6 ? hz / hd : 1;
        p.x = H.x + nx * out; p.z = H.z + nz * out;
        // 그물 줄이 팽팽해 공을 바깥으로 확 밀어낸다: 골대 밑으로 곧게 떨어지면 들어간 것처럼 보이니 꼭 튕겨 나오게
        const rv = (b.v.x - H.vx) * nx + (b.v.z - H.vz) * nz;
        if (!b.netOut) {
          // 처음 맞을 때: 그물이 출렁하며 공을 바깥·플레이어 쪽·살짝 위로 튕겨 낸다
          ev('net', b, Math.max(1.2, -rv));
          const add = Math.max(0, 1.6 - rv);
          b.v.x += add * nx; b.v.z += add * nz + 1.8;
          b.v.y = Math.max(b.v.y * -0.25, 1.0);
          b.netKick = 1;
        } else if (rv < 0.8) { const add = 0.8 - rv; b.v.x += add * nx; b.v.z += add * nz; }
        b.netOut = 1;
      }
      return;
    }
    const lim = Math.max(0.02, rn - BR * 0.75);
    if (hd > lim) {
      const nx = hx / hd, nz = hz / hd;
      p.x = H.x + nx * lim; p.z = H.z + nz * lim;
      const rv = (b.v.x - H.vx) * nx + (b.v.z - H.vz) * nz;
      if (rv > 0) { b.v.x -= rv * nx * 1.1; b.v.z -= rv * nz * 1.1; }
    }
    // 그물이 공을 붙잡아 느리게
    b.v.x = H.vx + (b.v.x - H.vx) * 0.985; b.v.z = H.vz + (b.v.z - H.vz) * 0.985;
    if (b.v.y < -1.2) b.v.y *= 0.992;
    b.netT = (b.netT || 0) + 1;
  }

  function walls(b) {
    const p = b.p, v = b.v, cw = P.CW;
    if (p.x + BR > cw) { p.x = cw - BR; if (v.x > 0) { if (v.x > 0.8) ev('net', b, v.x); v.x *= -0.3; v.y *= 0.92; v.z *= 0.92; } }
    if (p.x - BR < -cw) { p.x = -cw + BR; if (v.x < 0) { if (v.x < -0.8) ev('net', b, -v.x); v.x *= -0.3; v.y *= 0.92; v.z *= 0.92; } }
    const bz = P.backZ();
    if (p.z - BR < bz) { p.z = bz + BR; if (v.z < 0) { if (v.z < -0.8) ev('net', b, -v.z); v.z *= -0.3; v.x *= 0.9; v.y *= 0.9; } }
    if (p.y + BR > P.ROOF) { p.y = P.ROOF - BR; if (v.y > 0) { ev('net', b, v.y); v.y *= -0.25; } }
    // 앞 턱(통 끝): 바닥에서 0.2m 높이까지 막힘
    const fy = P.floorY(p.x, P.FZ);
    if (p.z + BR > P.FZ && p.y < fy + 0.22) {
      p.z = P.FZ - BR;
      if (v.z > 0) { if (v.z > 0.6) ev('lip', b, v.z); v.z *= -0.32; }
    }
  }

  function floor(b, dt) {
    const p = b.p, v = b.v;
    const fy = P.floorY(p.x, p.z);
    const n = floorN(p.x, p.z);
    const d = (p.y - fy) * n.y - BR;
    b.onFloor = false;
    if (d < 0.002) {
      if (d < 0) { p.x -= n.x * d; p.y -= n.y * d; p.z -= n.z * d; }
      const vn = v.x * n.x + v.y * n.y + v.z * n.z;
      if (vn < 0) {
        const e = vn < -0.9 ? 0.55 : 0;
        v.x -= (1 + e) * vn * n.x; v.y -= (1 + e) * vn * n.y; v.z -= (1 + e) * vn * n.z;
        if (vn < -0.9) ev('floor', b, -vn);
      }
      b.onFloor = true;
      // 구름 저항
      const k = Math.max(0, 1 - 0.35 * dt);
      v.x *= k; v.z *= k;
      if (b.live && !b.scored) { b.live = false; ev('miss', b); }
    }
  }

  function pairs() {
    const B = P.balls;
    for (let i = 0; i < B.length; i++) {
      const a = B[i]; if (a.state === 'held') continue;
      for (let j = i + 1; j < B.length; j++) {
        const c = B[j]; if (c.state === 'held') continue;
        let dx = c.p.x - a.p.x, dy = c.p.y - a.p.y, dz = c.p.z - a.p.z;
        const d2 = dx * dx + dy * dy + dz * dz, m = 2 * BR;
        if (d2 >= m * m || d2 < 1e-10) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d, pen = (m - d) / 2;
        a.p.x -= nx * pen; a.p.y -= ny * pen; a.p.z -= nz * pen;
        c.p.x += nx * pen; c.p.y += ny * pen; c.p.z += nz * pen;
        const rv = (c.v.x - a.v.x) * nx + (c.v.y - a.v.y) * ny + (c.v.z - a.v.z) * nz;
        if (rv < 0) {
          const j2 = -(1 + 0.7) * rv / 2;
          a.v.x -= j2 * nx; a.v.y -= j2 * ny; a.v.z -= j2 * nz;
          c.v.x += j2 * nx; c.v.y += j2 * ny; c.v.z += j2 * nz;
          if (-rv > 0.6) ev('bb', a, -rv);
        }
      }
    }
  }

  function rescue(b) {
    const p = b.p;
    if (!(p.z < 1.2 && p.y > 0 && Math.abs(p.x) < 1.6 && p.z > P.backZ() - 0.5) || p.x !== p.x || p.y !== p.y) {
      p.x = (Math.random() - 0.5) * 0.4; p.z = -0.9; p.y = P.floorY(p.x, p.z) + BR + 0.05;
      b.v.x = b.v.y = b.v.z = 0; b.live = false; b.state = 'rest';
    }
  }

  // 공 돌기(그림용): 굴러가면 굴러가는 대로, 날아가면 던질 때 준 회전 그대로
  function spin(b, dt) {
    if (b.onFloor) {
      const n = floorN(b.p.x, b.p.z), v = b.v;
      b.w.x = (n.y * v.z - n.z * v.y) / BR; b.w.y = (n.z * v.x - n.x * v.z) / BR; b.w.z = (n.x * v.y - n.y * v.x) / BR;
    }
    const w = b.w, a = Math.hypot(w.x, w.y, w.z) * dt;
    if (a < 1e-7) return;
    const s = Math.sin(a / 2) / (a / dt), c = Math.cos(a / 2);
    const qx = w.x * s, qy = w.y * s, qz = w.z * s, q = b.q;
    const x = c * q[0] + qx * q[3] + qy * q[2] - qz * q[1];
    const y = c * q[1] - qx * q[2] + qy * q[3] + qz * q[0];
    const z = c * q[2] + qx * q[1] - qy * q[0] + qz * q[3];
    const ww = c * q[3] - qx * q[0] - qy * q[1] - qz * q[2];
    const l = Math.hypot(x, y, z, ww);
    q[0] = x / l; q[1] = y / l; q[2] = z / l; q[3] = ww / l;
  }

  const SUB = 4;
  P.step = function (dt) {
    const h = dt / SUB;
    const bz = P.boardZ(), BD = P.BOARD;
    for (let s = 0; s < SUB; s++) {
      for (const b of P.balls) {
        if (b.state === 'held') continue;
        b.prevY = b.p.y;
        b.v.y -= G * h;
        b.p.x += b.v.x * h; b.p.y += b.v.y * h; b.p.z += b.v.z * h;
        // 점수: 림 높이를 위에서 아래로, 림 안쪽으로 지나감
        if (b.prevY > H.y && b.p.y <= H.y) {
          const hd = Math.hypot(b.p.x - H.x, b.p.z - H.z);
          if (hd < RIM_R && b.v.y - H.vy < 0) {
            b.inNet = true;
            if (b.live && !b.scored) { b.scored = true; b.live = false; ev('score', b, b.rim + b.board); }
          }
        }
        // 백보드(투명판)·림 받침
        if (sphereBox(b, H.x, H.y + 0.18, bz, BD.hw, BD.hh, BD.hd, H.vx, H.vy, H.vz, 0.62, 'board')) { if (b.live) b.board++; }
        sphereBox(b, H.x, H.y - 0.012, bz + 0.05, 0.05, 0.014, 0.05, H.vx, H.vy, H.vz, 0.4, 'board');
        rim(b);
        net(b);
        walls(b);
        floor(b, h);
        if (b.live && b.p.y < H.y - 0.7 && b.v.y < 0) { b.live = false; ev('miss', b); }
      }
      pairs();
    }
    for (const b of P.balls) { if (b.state !== 'held') { spin(b, dt); rescue(b); if (b.state === 'fly' && b.onFloor && Math.hypot(b.v.x, b.v.y, b.v.z) < 2) b.state = 'rest'; } }
  };

  // 목표점까지 정확히 가는 빠르기·방향(던지는 각도 고정, 공기 저항 없음)
  P.ideal = function (tx, ty, tz) {
    const R = P.REL, X = Math.hypot(tx - R.x, tz - R.z), Y = ty - R.y, th = P.ELEV;
    const den = 2 * Math.cos(th) * Math.cos(th) * (X * Math.tan(th) - Y);
    const v = den > 0 ? Math.sqrt(G * X * X / den) : 12;
    return { v, yaw: Math.atan2(tx - R.x, -(tz - R.z)), X };
  };
  P.launch = function (b, v, yaw, backspin) {
    const th = P.ELEV, c = Math.cos(th);
    b.state = 'fly'; b.live = true; b.scored = false; b.rim = 0; b.board = 0; b.inNet = false; b.netT = 0; b.rimPop = 0; b.netOut = 0;
    b.p.x = P.REL.x; b.p.y = P.REL.y; b.p.z = P.REL.z;
    b.v.x = v * c * Math.sin(yaw); b.v.y = v * Math.sin(th); b.v.z = -v * c * Math.cos(yaw);
    // 뒤로 도는 회전(공중에서 그림만)
    const k = backspin || 14;
    b.w.x = -k * Math.cos(yaw); b.w.y = 0; b.w.z = -k * Math.sin(yaw);
  };
  // 집을 수 있는 공: 통(앞쪽)에 와서 거의 멈춘 공 중 제일 앞
  P.pickable = function () {
    let best = null;
    for (const b of P.balls) {
      if (b.state === 'held' || b.live) continue;
      if (b.p.z < P.FZ - 0.75 || !b.onFloor) continue;
      if (Math.hypot(b.v.x, b.v.y, b.v.z) > 1.6) continue;
      if (!best || b.p.z > best.p.z) best = b;
    }
    return best;
  };
  P.reset = function (n) {
    P.balls.length = 0; P.events.length = 0;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      P.newBall(i, (col - 1) * 0.2, P.FZ - BR - 0.01 - row * 0.2);
    }
  };
})();
