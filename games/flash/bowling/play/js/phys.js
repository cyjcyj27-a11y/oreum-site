// 볼링 물리: 공 하나 + 핀 열 개. 핀은 "밑동을 축으로 넘어지는 막대"(서 있을 때)와
// "공중·바닥을 구르는 몸통"(넘어진 뒤) 두 상태로 다룬다. 충돌은 핀 몸에 박힌 구 4개로 잰다.
(function () {
  const P = (window.PH = {});

  // ---- 치수(미터·킬로그램) ----
  const LANE_HW = 0.533;        // 레인 반폭
  const GUT_HW = 0.77;          // 거터 바깥 끝
  const KICK_X = 0.80;          // 핀 쪽 옆벽(킥백)
  const HEAD_Z = -18.29;        // 1번 핀
  const DECK_END = -19.25;      // 핀 받침 끝, 여기서 핏으로 떨어진다
  const BACK_Z = -20.1;         // 뒤 쿠션
  const SP = 0.3048;            // 핀 간격
  const R_B = 0.108;
  const G = 9.8;
  const PIN_H = 0.381, PIN_M = 1.53, PIN_C = 0.145;
  const I_BASE = 0.05, I_C = 0.019;
  const SPH = [ [0.04, 0.046], [0.14, 0.06], [0.255, 0.034], [0.335, 0.031] ];

  P.C = { LANE_HW, GUT_HW, HEAD_Z, DECK_END, BACK_Z, R_B, PIN_H, SP, PIN_C };

  // 핀 자리 (1번이 앞, 7~10 이 뒷줄)
  const SPOTS = [];
  (function () {
    const rows = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];
    rows.forEach((row, r) => {
      row.forEach((n, i) => {
        SPOTS[n - 1] = { x: (i - (row.length - 1) / 2) * SP, z: HEAD_Z - r * SP * 0.866 };
      });
    });
  })();
  P.SPOTS = SPOTS;

  function floorY(x, z) {
    const ax = Math.abs(x);
    if (z < DECK_END) return -0.55;
    if (ax <= LANE_HW) return 0;
    if (ax <= GUT_HW) return -0.055;
    return -0.055;
  }
  P.floorY = floorY;

  // ---- 상태 ----
  const S = (P.S = { ball: null, pins: [], t: 0, events: [], ballMass: 6.5, power: 1 });

  function newPin(i, x, z) {
    return {
      i, st: 0,                 // 0 서 있음/기우는 중, 1 넘어짐(몸통), 2 핏에 빠짐
      x, z, vx: 0, vz: 0,       // 밑동 (st0)
      tx: 0, tz: 0, wx: 0, wz: 0, // 기울기 벡터·기울기 속도 (st0)
      yaw: Math.random() * 6.28, yr: 0,
      // st1 몸통: 무게중심 좌표·속도, 축 각도(a: 수직에서 기운 각, f: 방위)
      cx: 0, cy: 0, cz: 0, ux: 0, uy: 0, uz: 0, a: 0, f: 0, ar: 0, fr: 0,
      down: false, hitT: -1, alive: true,
    };
  }

  P.rack = function (keep) {
    // keep: 남길 핀 번호 배열(없으면 10개 다). 남는 핀은 제자리에 다시 세운다.
    const old = S.pins;
    S.pins = [];
    for (let i = 0; i < 10; i++) {
      if (keep) {
        const o = old[i];
        if (keep.indexOf(i) < 0) { const p = newPin(i, SPOTS[i].x, SPOTS[i].z); p.alive = false; p.st = 2; S.pins.push(p); continue; }
        const p = o && o.st === 0 ? newPin(i, o.x, o.z) : newPin(i, SPOTS[i].x, SPOTS[i].z);
        if (o) p.yaw = o.yaw;
        S.pins.push(p);
      } else {
        S.pins.push(newPin(i, SPOTS[i].x, SPOTS[i].z));
      }
    }
  };

  P.newBall = function (x) {
    S.ball = { x, y: R_B, z: 0.4, vx: 0, vy: 0, vz: 0, hook: 0, st: 'ready', rolled: 0, ax: 1, az: 0, deckT: -1, gutter: false };
    S.t = 0;
    S.events.length = 0;
    return S.ball;
  };

  P.launch = function (speed, angle, hook) {
    const b = S.ball;
    b.vx = Math.sin(angle) * speed;
    b.vz = -Math.cos(angle) * speed;
    b.hook = hook;
    b.st = 'roll';
  };

  // 훅이 먹는 정도 — 앞 3분의 2는 기름 구간
  function hookK(z) {
    if (z > -9) return 0.12;
    if (z > -14) return 0.12 + (-(z + 9) / 5) * 1.0;
    return 1.12;
  }
  P.hookK = hookK;

  // ---- 핀 구 위치·속도 ----
  function pinAxis(p, out) {
    if (p.st === 0) {
      const a = Math.hypot(p.tx, p.tz);
      if (a < 1e-6) { out[0] = 0; out[1] = 1; out[2] = 0; return a; }
      const s = Math.sin(a) / a;
      out[0] = p.tx * s; out[1] = Math.cos(a); out[2] = p.tz * s;
      return a;
    }
    const sa = Math.sin(p.a);
    out[0] = sa * Math.cos(p.f); out[1] = Math.cos(p.a); out[2] = sa * Math.sin(p.f);
    return p.a;
  }
  P.pinAxis = pinAxis;
  const U = [0, 1, 0];

  // i 번째 구의 중심을 buf 에 넣는다
  function sphPos(p, k, buf) {
    pinAxis(p, U);
    const s = SPH[k][0];
    if (p.st === 0) {
      buf[0] = p.x + U[0] * s; buf[1] = U[1] * s; buf[2] = p.z + U[2] * s;
    } else {
      const d = s - PIN_C;
      buf[0] = p.cx + U[0] * d; buf[1] = p.cy + U[1] * d; buf[2] = p.cz + U[2] * d;
    }
    return SPH[k][1];
  }

  // 구 k 에서 방향 n 으로 impulse j 를 받았을 때의 역질량과, 그 점의 속도
  function pinPointVel(p, k, out) {
    const s = SPH[k][0];
    if (p.st === 0) {
      const a = Math.hypot(p.tx, p.tz), ca = Math.cos(a);
      out[0] = p.vx + p.wx * s * ca; out[1] = 0; out[2] = p.vz + p.wz * s * ca;
      if (a > 1e-4) out[1] = -Math.sin(a) * s * ((p.wx * p.tx + p.wz * p.tz) / a);
      return;
    }
    const d = s - PIN_C, ca = Math.cos(p.a), sa = Math.sin(p.a), cf = Math.cos(p.f), sf = Math.sin(p.f);
    out[0] = p.vx + d * (ca * cf * p.ar - sa * sf * p.fr);
    out[1] = p.vy - d * sa * p.ar;
    out[2] = p.vz + d * (ca * sf * p.ar + sa * cf * p.fr);
  }
  const LIN0 = 0.45;
  let PIN_E = 0.8, PIN_FLY = 0.9;
  P.tune = function (e, f) { PIN_E = e; PIN_FLY = f; };
  function pinInvMass(p, k, nx, ny, nz) {
    const s = SPH[k][0];
    if (p.st === 0) {
      const a = Math.hypot(p.tx, p.tz), h = s * Math.cos(a);
      const nh2 = nx * nx + nz * nz;
      return nh2 * (LIN0 / PIN_M + (h * h) / I_BASE);
    }
    const d = s - PIN_C, ca = Math.cos(p.a), sa = Math.sin(p.a), cf = Math.cos(p.f), sf = Math.sin(p.f);
    const da = (nx * ca * cf - ny * sa + nz * ca * sf) * d;
    const df = (-nx * sf + nz * cf) * d * sa;
    return 1 / PIN_M + (da * da) / I_C + (df * df) / (I_C * sa * sa + 0.004);
  }
  function pinApply(p, k, jx, jy, jz) {
    const s = SPH[k][0];
    p.hitT = S.t;
    if (p.st === 0) {
      const a = Math.hypot(p.tx, p.tz), h = s * Math.cos(a);
      p.vx += (jx * LIN0) / PIN_M; p.vz += (jz * LIN0) / PIN_M;
      p.wx += (jx * h) / I_BASE; p.wz += (jz * h) / I_BASE;
      p.yr += (Math.random() - 0.5) * Math.hypot(jx, jz) * 3;
      return;
    }
    const d = s - PIN_C, ca = Math.cos(p.a), sa = Math.sin(p.a), cf = Math.cos(p.f), sf = Math.sin(p.f);
    p.vx += jx / PIN_M; p.vy += jy / PIN_M; p.vz += jz / PIN_M;
    p.ar += ((jx * ca * cf - jy * sa + jz * ca * sf) * d) / I_C;
    p.fr += ((-jx * sf + jz * cf) * d * sa) / (I_C * sa * sa + 0.004);
  }

  // 서 있던 핀을 몸통 상태로 바꾼다
  function topple(p, lift) {
    const a = Math.max(Math.hypot(p.tx, p.tz), 1e-4);
    const dx = a > 1e-3 ? p.tx / a : Math.cos(p.yaw), dz = a > 1e-3 ? p.tz / a : Math.sin(p.yaw);
    const wa = p.wx * dx + p.wz * dz;           // 넘어지는 방향 속도
    const wp = -p.wx * dz + p.wz * dx;          // 옆으로 비트는 속도
    p.a = a; p.f = Math.atan2(dz, dx);
    pinAxis(p, U);
    p.cx = p.x + U[0] * PIN_C; p.cy = U[1] * PIN_C; p.cz = p.z + U[2] * PIN_C;
    const ca = Math.cos(a);
    p.vx = p.vx + p.wx * PIN_C * ca;
    p.vz = p.vz + p.wz * PIN_C * ca;
    p.vy = -Math.sin(a) * PIN_C * wa + (lift || 0);
    p.ar = wa; p.fr = wp / Math.max(a, 0.35);
    p.st = 1;
    p.down = true;
  }
  P.topple = topple;

  // ---- 한 걸음 ----
  const DT = 1 / 240;
  P.DT = DT;
  const A = [0, 0, 0], B = [0, 0, 0], VA = [0, 0, 0], VB = [0, 0, 0];

  function stepBall(b, dt) {
    if (b.st === 'ready' || b.st === 'stop') return;
    if (b.st === 'roll') {
      b.vx += b.hook * hookK(b.z) * dt;
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0.01) {
        const dec = 0.22 * dt;
        const k = Math.max(0, sp - dec) / sp;
        b.vx *= k; b.vz *= k;
      }
      b.x += b.vx * dt; b.z += b.vz * dt;
      if (Math.abs(b.x) > LANE_HW && b.z > DECK_END) {
        b.st = 'gutter';
        if (b.deckT < 0) b.gutter = true;
        S.events.push({ t: 'gutter' });
      }
      if (b.z < HEAD_Z + 0.6 && b.deckT < 0) b.deckT = S.t;
    } else if (b.st === 'gutter') {
      const gx = Math.sign(b.x) * (LANE_HW + GUT_HW) / 2;
      b.x += (gx - b.x) * Math.min(1, dt * 14);
      b.vx = 0;
      b.y += (R_B - 0.075 - b.y) * Math.min(1, dt * 12);
      b.z += b.vz * dt;
    } else if (b.st === 'pit') {
      b.vy -= G * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.z < BACK_Z + R_B) { b.z = BACK_Z + R_B; b.vz *= -0.15; b.vx *= 0.5; }
      const fy = -0.55 + R_B;
      if (b.y < fy) { b.y = fy; b.vy = 0; b.vx *= 0.9; b.vz *= 0.9; }
      if (Math.abs(b.vz) < 0.05 && b.y <= fy + 1e-3) b.st = 'stop';
    }
    if ((b.st === 'roll' || b.st === 'gutter') && b.z < DECK_END) {
      b.st = 'pit';
      S.events.push({ t: 'pit' });
    }
    b.rolled += Math.hypot(b.vx, b.vz) * dt;
  }

  function stepPin(p, dt) {
    if (!p.alive) return;
    if (p.st === 0) {
      let a = Math.hypot(p.tx, p.tz);
      const TIP = 0.15;
      if (a < TIP) {
        // 밑바닥이 넓어서 조금 기운 건 되돌아온다 (흔들흔들)
        p.wx += (-p.tx * 150 - p.wx * 7) * dt;
        p.wz += (-p.tz * 150 - p.wz * 7) * dt;
        const push = 43 * Math.sin(a) * 0.25;
        if (a > 1e-4) { p.wx += (p.tx / a) * push * dt; p.wz += (p.tz / a) * push * dt; }
      } else {
        const g = 43 * Math.sin(a);
        p.wx += (p.tx / a) * g * dt;
        p.wz += (p.tz / a) * g * dt;
      }
      p.tx += p.wx * dt; p.tz += p.wz * dt;
      const sp = Math.hypot(p.vx, p.vz);
      if (sp > 0) {
        const k = Math.max(0, sp - 0.4 * G * dt) / sp;
        p.vx *= k; p.vz *= k;
      }
      p.x += p.vx * dt; p.z += p.vz * dt;
      p.yaw += p.yr * dt; p.yr *= 1 - 4 * dt;
      a = Math.hypot(p.tx, p.tz);
      if (a > 0.3) p.down = true;
      if (a > 0.95) topple(p);
      else if (Math.abs(p.x) > LANE_HW || p.z < DECK_END) topple(p);
      return;
    }
    // 몸통
    p.vy -= G * dt;
    p.cx += p.vx * dt; p.cy += p.vy * dt; p.cz += p.vz * dt;
    p.a += p.ar * dt; p.f += p.fr * dt;
    if (p.a < 0) { p.a = -p.a; p.f += Math.PI; p.ar = -p.ar; }
    if (p.a > Math.PI) { p.a = 2 * Math.PI - p.a; p.f += Math.PI; p.ar = -p.ar; }
    // 바닥
    let pen = 0, grounded = false;
    for (let k = 0; k < 4; k++) {
      const r = sphPos(p, k, A);
      const fy = floorY(A[0], A[2]);
      const d = fy + r - A[1];
      if (d > pen) pen = d;
    }
    if (pen > 0) {
      p.cy += pen;
      grounded = true;
      if (p.vy < 0) {
        if (p.vy < -1.2) S.events.push({ t: 'clack', v: -p.vy, x: p.cx, z: p.cz });
        p.vy *= -0.28;
      }
      const fr = Math.max(0, 1 - 3.2 * dt);
      p.vx *= fr; p.vz *= fr;
      // 눕는 쪽으로
      const target = Math.PI / 2 + 0.08;
      p.ar += ((target - p.a) * 70 - p.ar * 9) * dt;
      p.fr *= Math.max(0, 1 - 1.6 * dt);
    }
    // 옆벽·뒤쿠션
    if (p.cz < -17.4 && Math.abs(p.cx) > KICK_X - 0.05) {
      p.cx = Math.sign(p.cx) * (KICK_X - 0.05);
      if (Math.sign(p.vx) === Math.sign(p.cx)) { p.vx *= -0.55; S.events.push({ t: 'wall', v: Math.abs(p.vx) }); }
    }
    if (p.cz < BACK_Z + 0.12) { p.cz = BACK_Z + 0.12; if (p.vz < 0) p.vz *= -0.2; }
    if (p.cz < DECK_END - 0.05 && p.cy < -0.2) p.st = 2;
    p.yaw += p.fr * dt * 0.2;
    p.grounded = grounded;
  }


  function ballPin(b, p) {
    if (!p.alive || p.st === 2) return;
    const bx = b.x, by = b.y, bz = b.z;
    const px = p.st === 0 ? p.x : p.cx, pz = p.st === 0 ? p.z : p.cz;
    if (Math.abs(bx - px) > 0.6 || Math.abs(bz - pz) > 0.6) return;
    for (let k = 0; k < 4; k++) {
      const r = sphPos(p, k, A);
      const dx = bx - A[0], dy = by - A[1], dz = bz - A[2];
      const d2 = dx * dx + dy * dy + dz * dz, rr = R_B + r;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 1e-4;
      let nx = dx / d, ny = dy / d, nz = dz / d;
      // 공은 바닥에 붙어 있으니 수평만
      const nh = Math.hypot(nx, nz) || 1e-4;
      pinPointVel(p, k, VB);
      const rv = (b.vx - VB[0]) * (nx / nh) + (b.vz - VB[2]) * (nz / nh);
      const pen = rr - d;
      // 위치 보정: 핀을 민다
      if (p.st === 0) { p.x -= (nx / nh) * pen * 0.5; p.z -= (nz / nh) * pen * 0.5; }
      else { p.cx -= nx * pen * 0.6; p.cz -= nz * pen * 0.6; p.cy -= ny * pen * 0.3; }
      b.x += (nx / nh) * pen * 0.2; b.z += (nz / nh) * pen * 0.2;
      if (rv >= 0) return;
      const invB = 1 / S.ballMass;
      const invP = pinInvMass(p, k, nx / nh, 0, nz / nh);
      const j = (-(1 + 0.62) * rv) / (invB + invP) * S.power;
      const jx = (nx / nh) * j, jz = (nz / nh) * j;
      b.vx += jx * invB; b.vz += jz * invB;
      const wasUp = p.st === 0;
      pinApply(p, k, -jx, 0, -jz);
      if (wasUp && j > 3.2) {
        // 세게 맞은 핀은 튕겨 날아간다
        topple(p, Math.min(2.6, (j - 3.2) * 0.35 + Math.random() * 0.5));
        p.fr += (Math.random() - 0.5) * 14;
      }
      S.events.push({ t: 'hit', v: j, x: p.x, z: p.z, ball: true });
      return;
    }
  }

  function pinPin(p, q) {
    if (!p.alive || !q.alive || p.st === 2 || q.st === 2) return;
    if (p.st === 0 && q.st === 0 && Math.hypot(p.tx, p.tz) < 0.02 && Math.hypot(q.tx, q.tz) < 0.02 &&
      Math.hypot(p.vx, p.vz) < 0.01 && Math.hypot(q.vx, q.vz) < 0.01) return;
    const px = p.st === 0 ? p.x : p.cx, pz = p.st === 0 ? p.z : p.cz;
    const qx = q.st === 0 ? q.x : q.cx, qz = q.st === 0 ? q.z : q.cz;
    if (Math.abs(px - qx) > 0.8 || Math.abs(pz - qz) > 0.8) return;
    let best = null;
    for (let k = 0; k < 4; k++) {
      const ra = sphPos(p, k, A);
      for (let m = 0; m < 4; m++) {
        const rb = sphPos(q, m, B);
        const dx = A[0] - B[0], dy = A[1] - B[1], dz = A[2] - B[2];
        const d2 = dx * dx + dy * dy + dz * dz, rr = ra + rb;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1e-4;
        const pen = rr - d;
        if (!best || pen > best.pen) best = { k, m, pen, nx: dx / d, ny: dy / d, nz: dz / d };
      }
    }
    if (!best) return;
    const { k, m, pen } = best;
    let { nx, ny, nz } = best;
    // 서 있는 핀끼리는 수평으로만
    if (p.st === 0 && q.st === 0) { const h = Math.hypot(nx, nz) || 1e-4; nx /= h; nz /= h; ny = 0; }
    const shove = (o, sgn, w) => {
      if (o.st === 0) { o.x += sgn * nx * pen * w; o.z += sgn * nz * pen * w; }
      else { o.cx += sgn * nx * pen * w; o.cy += sgn * ny * pen * w; o.cz += sgn * nz * pen * w; }
    };
    shove(p, 1, 0.5); shove(q, -1, 0.5);
    pinPointVel(p, k, VA); pinPointVel(q, m, VB);
    const rv = (VA[0] - VB[0]) * nx + (VA[1] - VB[1]) * ny + (VA[2] - VB[2]) * nz;
    if (rv >= 0) return;
    const inv = pinInvMass(p, k, nx, ny, nz) + pinInvMass(q, m, nx, ny, nz);
    const j = (-(1 + PIN_E) * rv) / inv;
    const pUp = p.st === 0, qUp = q.st === 0;
    pinApply(p, k, nx * j, ny * j, nz * j);
    pinApply(q, m, -nx * j, -ny * j, -nz * j);
    // 날아온 핀에 세게 맞으면 같이 튄다
    if (pUp && j > PIN_FLY) topple(p, Math.min(1.2, (j - PIN_FLY) * 0.3));
    if (qUp && j > PIN_FLY) topple(q, Math.min(1.2, (j - PIN_FLY) * 0.3));
    if (j > 0.6) S.events.push({ t: 'hit', v: j, x: (px + qx) / 2, z: (pz + qz) / 2 });
  }

  P.step = function () {
    const b = S.ball;
    S.t += DT;
    stepBall(b, DT);
    const pins = S.pins;
    for (let i = 0; i < 10; i++) stepPin(pins[i], DT);
    if (b.st !== 'ready' && b.z < -16.5) for (let i = 0; i < 10; i++) ballPin(b, pins[i]);
    for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) pinPin(pins[i], pins[j]);
  };

  // 다 멈췄나
  P.calm = function () {
    for (const p of S.pins) {
      if (!p.alive || p.st === 2) continue;
      if (p.st === 0) {
        if (Math.hypot(p.wx, p.wz) > 0.25 || Math.hypot(p.tx, p.tz) > 0.2 || Math.hypot(p.vx, p.vz) > 0.05) return false;
      } else if (Math.hypot(p.vx, p.vy, p.vz) > 0.08 || Math.abs(p.ar) > 0.5) return false;
    }
    return true;
  };

  // 서 있는 핀 번호
  P.standing = function () {
    const out = [];
    for (const p of S.pins) {
      if (!p.alive) continue;
      if (p.st === 0 && !p.down && Math.hypot(p.tx, p.tz) < 0.3 && Math.abs(p.x) < LANE_HW && p.z > DECK_END) out.push(p.i);
    }
    return out;
  };

  // 공만 굴려서 핀 줄(z=HEAD_Z)에 닿는 x 를 구한다 (AI 조준용)
  P.predictX = function (x0, speed, angle, hook) {
    let x = x0, z = 0.4, vx = Math.sin(angle) * speed, vz = -Math.cos(angle) * speed;
    const dt = 1 / 120;
    for (let i = 0; i < 2000 && z > HEAD_Z; i++) {
      vx += hook * hookK(z) * dt;
      const sp = Math.hypot(vx, vz), k = Math.max(0, sp - 0.22 * dt) / sp;
      vx *= k; vz *= k;
      x += vx * dt; z += vz * dt;
      if (Math.abs(x) > LANE_HW) return NaN;
    }
    return x;
  };
})();
