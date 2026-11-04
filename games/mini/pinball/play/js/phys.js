// 핀볼대 모양과 물리 — 판 평면(x 0~20 가로, y 0~40 위쪽)
(function () {
  const W = 18.6;            // 플레이필드 폭 (오른쪽 1.4 는 발사 통로)
  const CX = W / 2;
  const BR = 0.5;            // 공 반지름
  const G = 34;              // 판 기울기 중력
  const segs = [];           // {ax,ay,bx,by,e,kick,tag,oneWay,on}
  const circles = [];        // {x,y,r,e,kick,tag,on}
  const sensors = [];        // {x,y,r,tag} 통과 감지(부딪힘 없음)

  function seg(ax, ay, bx, by, o) { const s = Object.assign({ ax, ay, bx, by, e: 0.55, kick: 0, tag: '', on: true }, o || {}); segs.push(s); return s; }
  function poly(pts, o) { const out = []; for (let i = 0; i < pts.length - 1; i++) out.push(seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o)); return out; }
  function circ(x, y, r, o) { const c = Object.assign({ x, y, r, e: 0.5, kick: 0, tag: '', on: true }, o || {}); circles.push(c); return c; }
  const mx = x => W - x;     // 좌우 대칭

  // ── 바깥 벽 ──
  poly([[0, -3], [0, 30]], { tag: 'wall' });
  poly([[20, 0.6], [20, 30]], { tag: 'wall' });
  const arc = [];
  for (let i = 0; i <= 28; i++) { const a = Math.PI * i / 28; arc.push([10 + 10 * Math.cos(a), 30 + 10 * Math.sin(a)]); }
  poly(arc.slice().reverse().reverse(), { tag: 'wall', e: 0.45 });
  // 발사 통로
  poly([[W, 0.6], [W, 28.4]], { tag: 'wall' });
  seg(W, 0.6, 20, 0.6, { tag: 'wall', e: 0.1 });
  const gate = seg(W, 28.4, 19.95, 30.4, { tag: 'gate', oneWay: { nx: -0.83, ny: 0.56 }, e: 0.3 });

  // ── 아래: 안내 벽·플리퍼 자리 ──
  poly([[0, 9.8], [5.62, 5.86]], { tag: 'guide', e: 0.3 });
  poly([[W, 9.8], [mx(5.62), 5.86]], { tag: 'guide', e: 0.3 });
  // 앞판(에이프런) 윗변(y 1.6)에 닿으면 바로 그 밑으로 빠짐 — 판 위에 공이 머물지 않게
  const APRON_Y = 1.6;
  // 슬링샷 (세모, 빗변이 튕김 면)
  function sling(sx) {
    const A = [sx(1.7), 10.3], B = [sx(1.7), 13.7], C = [sx(4.7), 8.5];
    seg(A[0], A[1], B[0], B[1], { tag: 'slingside', e: 0.4 });
    seg(A[0], A[1], C[0], C[1], { tag: 'slingside', e: 0.4 });
    const k = seg(B[0], B[1], C[0], C[1], { tag: 'sling', e: 0.5, kick: 13 });
    circ(B[0], B[1], 0.28, { tag: 'post', e: 0.5 }); circ(C[0], C[1], 0.28, { tag: 'post', e: 0.5 }); circ(A[0], A[1], 0.28, { tag: 'post' });
    return { A, B, C, k };
  }
  const slingL = sling(x => x), slingR = sling(mx);
  slingL.k.side = 'L'; slingR.k.side = 'R';

  // ── 왼쪽 궤도 통로 ──
  poly([[3.7, 22.6], [2.05, 25.0], [2.05, 26.6], [2.6, 29.2]], { tag: 'wall', e: 0.4 });
  circ(3.7, 22.6, 0.3, { tag: 'post' });
  sensors.push({ x: 0.92, y: 24.5, r: 0.9, tag: 'orbit' });
  // 궤도 위 한 방향 문: 위 아치를 돌아 내려온 공은 판 안으로 튕기고, 아래에서 쏜 궤도 샷은 지나감
  const gate2 = seg(0.05, 31.4, 2.6, 29.2, { tag: 'gate2', oneWay: { nx: 0.653, ny: 0.757 }, e: 0.35 });
  // 오른쪽 위 짧은 벽(공이 위에서 돌아 내려오며 부딪힘)
  poly([[16.9, 25.2], [17.6, 28.0]], { tag: 'wall', e: 0.4 });
  circ(16.9, 25.2, 0.3, { tag: 'post' });

  // ── 위쪽 레인 셋(도·깨·비) ──
  const laneX = [6.4, 9.2, 12.0];
  [5.0, 7.8, 10.6, 13.4].forEach(x => { seg(x, 31.3, x, 33.4, { tag: 'lanepost', e: 0.4 }); circ(x, 31.3, 0.24, { tag: 'post' }); circ(x, 33.4, 0.24, { tag: 'post' }); });
  laneX.forEach((x, i) => sensors.push({ x, y: 32.4, r: 0.75, tag: 'lane', i }));

  // ── 범퍼 셋 ──
  const bumpers = [circ(6.7, 27.0, 1.15, { tag: 'bumper', kick: 15, e: 0.6 }), circ(11.9, 27.0, 1.15, { tag: 'bumper', kick: 15, e: 0.6 }), circ(9.3, 23.6, 1.15, { tag: 'bumper', kick: 15, e: 0.6 })];
  bumpers.forEach((b, i) => b.i = i);

  // ── 드롭 타깃 넷(왼쪽) ──
  const drops = [];
  for (let i = 0; i < 4; i++) { const y = 14.6 + i * 1.18; const s = seg(2.15, y, 2.15, y + 0.95, { tag: 'drop', e: 0.35 }); s.i = i; drops.push(s); }
  // 드롭 뒤 받침벽
  seg(1.85, 14.4, 1.85, 19.4, { tag: 'wall', e: 0.3 });
  circ(1.85, 19.4, 0.25, { tag: 'post' });

  // ── 빨간 스탠드업 타깃 셋(오른쪽) ──
  const stands = [];
  for (let i = 0; i < 3; i++) { const y = 12.9 + i * 1.45; const s = seg(W - 0.12, y, W - 0.12, y + 1.0, { tag: 'stand', e: 0.5 }); s.i = i; stands.push(s); }

  // ── 홀(공을 삼켰다 뱉는 구멍) ──
  const saucer = { x: 15.7, y: 21.0, r: 0.75 };
  // 홀 뒤 벽(오른쪽 위로 비스듬)
  poly([[16.65, 20.0], [17.2, 22.6]], { tag: 'wall', e: 0.35 });

  // ── 램프 둘: 입구 벽 + 공이 올라타는 길(x, y, 높이) ──
  function catmull(pts, n) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  function ramp(name, tx, ty, axx, axy, back, ctrl) {
    // 입구: 플리퍼 쪽을 바라보게 기울인 너비 2 칸, 깊이 2.4
    const al = Math.hypot(axx, axy), ax = axx / al, ay = axy / al, nx = ay, ny = -ax, w = 1.0, dep = 2.4;
    const c0 = [tx + nx * w, ty + ny * w], c1 = [tx - nx * w, ty - ny * w];
    seg(c0[0] - ax * dep, c0[1] - ay * dep, c0[0], c0[1], { tag: 'rampwall', e: 0.4 }); seg(c1[0] - ax * dep, c1[1] - ay * dep, c1[0], c1[1], { tag: 'rampwall', e: 0.4 });
    circ(c0[0] - ax * dep, c0[1] - ay * dep, 0.22, { tag: 'post' }); circ(c1[0] - ax * dep, c1[1] - ay * dep, 0.22, { tag: 'post' });
    // 램프 밑 받침(공이 위에서 와서 부딪히는 곳)
    const b0 = [c0[0] + ax * 0.6, back], b1 = [c1[0] + ax * 0.6, back];
    seg(c0[0], c0[1], b0[0], b0[1], { tag: 'rampwall', e: 0.4 }); seg(c1[0], c1[1], b1[0], b1[1], { tag: 'rampwall', e: 0.4 }); seg(b0[0], b0[1], b1[0], b1[1], { tag: 'rampwall', e: 0.4 });
    ctrl = ctrl.map(c => [c[0], c[1], c[2] * 0.62 + (c[2] > 0.5 ? 0.25 : 0)]);   // 실제 램프 높이 비례
    const pts = catmull(ctrl, 10), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    return { name, cx: tx, top: ty, ax, ay, nx, ny, half: w, ctrl, pts, cum, len: cum[cum.length - 1] };
  }
  const ramps = [
    ramp('L', 6.6, 21.0, -0.28, 0.96, 24.3,
      [[6.6, 20.9, 0.2], [6.0, 23.2, 0.9], [4.9, 26, 1.9], [4.0, 29.4, 2.7], [3.3, 31.6, 3.05], [2.2, 32.4, 3.1], [1.25, 31.5, 3.05], [1.1, 29.2, 2.9], [1.1, 24, 2.6], [1.1, 18, 2.2], [1.0, 14.6, 1.7], [0.9, 12.3, 1.0], [0.85, 10.9, 0.3]]),
    ramp('R', 13.3, 22.3, 0.27, 0.96, 24.6,
      [[13.3, 22.2, 0.2], [13.4, 24.5, 0.9], [13.9, 27.5, 1.9], [14.8, 30.4, 2.7], [15.8, 32.2, 3.05], [17.0, 32.6, 3.1], [17.9, 31.4, 3.05], [18.0, 29, 2.9], [17.95, 24, 2.6], [17.9, 18, 2.2], [17.85, 14.6, 1.7], [17.8, 12.3, 1.0], [17.75, 10.9, 0.3]])
  ];
  function rampAt(r, d) {
    let i = 1; while (i < r.cum.length - 1 && r.cum[i] < d) i++;
    const a = r.pts[i - 1], b = r.pts[i], u = Math.min(1, Math.max(0, (d - r.cum[i - 1]) / ((r.cum[i] - r.cum[i - 1]) || 1)));
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  }
  const RAMP_V = 27, RAMP_MIN = 15;

  // ── 황금 표적(10판에만 올라옴) ──
  const boss = circ(CX, 17.6, 1.5, { tag: 'boss', e: 0.6, kick: 10, on: false });

  // ── 플리퍼 ──
  const FL = 3.1, FR0 = 0.52, FR1 = 0.26;
  function flipper(px, py, rest, up) { return { px, py, rest, up, a: rest, w: 0, held: false, L: FL, r0: FR0, r1: FR1 }; }
  const flippers = [flipper(5.75, 5.25, -0.52, 0.52), flipper(mx(5.75), 5.25, Math.PI + 0.52, Math.PI - 0.52)];
  const FW = 24; // 각속도(rad/s)

  // ── 공 ──
  const balls = [];
  function newBall(x, y, vx, vy) { const b = { x, y, vx: vx || 0, vy: vy || 0, r: BR, lane: false, cap: 0, alive: true, trail: [], age: 0 }; balls.push(b); return b; }
  const LANE_X = 19.3, LANE_Y = 1.1;

  let hit = () => { };       // 게임 쪽 이벤트 (tag, obj, ball, speed)

  function closest(ax, ay, bx, by, px, py) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [ax + dx * t, ay + dy * t, t];
  }
  function bounce(b, nx, ny, e, kick, svx, svy) {
    const rvx = b.vx - (svx || 0), rvy = b.vy - (svy || 0);
    const vn = rvx * nx + rvy * ny;
    if (vn >= 0) return 0;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    // 약한 마찰
    const tx = -ny, ty = nx, vt = rvx * tx + rvy * ty;
    b.vx -= vt * 0.002 * tx; b.vy -= vt * 0.002 * ty;
    if (kick && -vn > 1.2) { b.vx += nx * kick; b.vy += ny * kick; }
    return -vn;
  }

  function stepFlippers(dt) {
    for (const f of flippers) {
      const tgt = f.held ? f.up : f.rest, d = tgt - f.a, mv = FW * dt;
      if (Math.abs(d) <= mv) { f.w = d / dt; f.a = tgt; } else { f.w = Math.sign(d) * FW; f.a += f.w * dt; }
      if (f.a === tgt) f.w = 0;
    }
  }

  function collideBall(b, dt) {
    // 선분
    for (const s of segs) {
      if (!s.on) continue;
      const [cx, cy] = closest(s.ax, s.ay, s.bx, s.by, b.x, b.y);
      let dx = b.x - cx, dy = b.y - cy; const d2 = dx * dx + dy * dy;
      if (d2 >= b.r * b.r) continue;
      if (s.oneWay && (dx * s.oneWay.nx + dy * s.oneWay.ny) < 0) continue;
      const d = Math.sqrt(d2) || 1e-6; const nx = dx / d, ny = dy / d;
      b.x = cx + nx * b.r; b.y = cy + ny * b.r;
      const sp = bounce(b, nx, ny, s.e, s.kick);
      if (sp > 0.6) hit(s.tag, s, b, sp);
    }
    // 원
    for (const c of circles) {
      if (!c.on) continue;
      let dx = b.x - c.x, dy = b.y - c.y; const rr = b.r + c.r, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 1e-6; const nx = dx / d, ny = dy / d;
      b.x = c.x + nx * rr; b.y = c.y + ny * rr;
      const sp = bounce(b, nx, ny, c.e, c.kick);
      if (sp > 0.4 || c.tag === 'bumper') { if (sp > 0.3) hit(c.tag, c, b, sp); }
    }
    // 플리퍼
    for (let i = 0; i < 2; i++) {
      const f = flippers[i];
      const tx = f.px + Math.cos(f.a) * f.L, ty = f.py + Math.sin(f.a) * f.L;
      const [cx, cy, t] = closest(f.px, f.py, tx, ty, b.x, b.y);
      const fr = f.r0 + (f.r1 - f.r0) * t;
      let dx = b.x - cx, dy = b.y - cy; const rr = b.r + fr, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 1e-6; const nx = dx / d, ny = dy / d;
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      const px = cx + nx * fr - f.px, py = cy + ny * fr - f.py;
      const svx = -f.w * py, svy = f.w * px;
      const sp = bounce(b, nx, ny, f.w ? 0.45 : 0.25, 0, svx, svy);
      // 겨냥: 플리퍼 끝에 맞을수록 반대편으로(실제 핀볼처럼), 축 쪽이면 같은 쪽 위로
      if (f.w && sp > 4 && f.held) {
        const out = Math.hypot(b.vx, b.vy), want = (i === 0 ? 108 - 58 * t : 72 + 58 * t) * Math.PI / 180;
        const cur = Math.atan2(b.vy, b.vx); let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const na = cur + d * 0.75, v = Math.min(out, 58);
        b.vx = Math.cos(na) * v; b.vy = Math.sin(na) * v;
      }
      if (sp > 3) hit('flipper', f, b, sp, i);
    }
  }

  function ballBall() {
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], c = balls[j]; if (a.cap || c.cap || a.lane || c.lane || a.ride || c.ride) continue;
      const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + c.r;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (rr - d) / 2;
      a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
      const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (vn < 0) { a.vx += vn * nx * 0.95; a.vy += vn * ny * 0.95; c.vx -= vn * nx * 0.95; c.vy -= vn * ny * 0.95; if (-vn > 3) hit('clack', null, a, -vn); }
    }
  }

  const sensorIn = new WeakMap();
  function sense(b) {
    let m = sensorIn.get(b); if (!m) { m = new Set(); sensorIn.set(b, m); }
    for (const s of sensors) {
      const inside = (b.x - s.x) ** 2 + (b.y - s.y) ** 2 < s.r * s.r;
      if (inside && !m.has(s)) { m.add(s); hit(s.tag, s, b, Math.hypot(b.vx, b.vy)); }
      else if (!inside && m.has(s)) m.delete(s);
    }
    // 홀
    if (b.noCap > 0) b.noCap -= SUB;
    else if (!b.cap && !b.lane) {
      const dx = b.x - saucer.x, dy = b.y - saucer.y, d2 = dx * dx + dy * dy;
      if (d2 < 0.62 * 0.62 && Math.hypot(b.vx, b.vy) < 30) { b.cap = 1; b.x = saucer.x; b.y = saucer.y; b.vx = b.vy = 0; hit('saucer', saucer, b, 0); }
      else if (d2 < 1.6) { b.vx -= dx * 6 * 0.004; b.vy -= dy * 6 * 0.004; } // 구멍 쪽으로 살짝 끌림
    }
  }

  const SUB = 1 / 480;
  let acc = 0;
  function step(dt) {
    acc += Math.min(dt, 0.05);
    while (acc >= SUB) {
      acc -= SUB;
      stepFlippers(SUB);
      for (const b of balls) {
        if (!b.alive) continue;
        if (b.cap) continue;
        if (b.ride) {
          b.ride.d += RAMP_V * SUB; const r = b.ride.r;
          const [x, y, h] = rampAt(r, b.ride.d), [x2, y2] = rampAt(r, b.ride.d + 0.3);
          b.x = x; b.y = y; b.h = h; b.vx = (x2 - x) / 0.3 * RAMP_V; b.vy = (y2 - y) / 0.3 * RAMP_V;
          if (b.ride.d >= r.len) { b.ride = null; b.h = 0; b.vx = 0; b.vy = -9; hit('rampDone', r, b, 0); }
          continue;
        }
        if (b.lane && b.held) { b.x = LANE_X; b.y = LANE_Y; b.vx = b.vy = 0; continue; }
        b.vy -= G * SUB;
        const sp = Math.hypot(b.vx, b.vy); if (sp > 70) { b.vx *= 70 / sp; b.vy *= 70 / sp; }
        b.x += b.vx * SUB; b.y += b.vy * SUB;
        collideBall(b, SUB);
        if (b.lane && b.y > 29.5) { b.lane = false; hit('launched', null, b, 0); }
        if (b.lane && b.y < LANE_Y + 0.3 && b.vy <= 0 && Math.abs(b.vy) < 3 && b.x > W) { b.held = true; b.x = LANE_X; b.y = LANE_Y; b.vx = b.vy = 0; hit('relane', null, b, 0); }
        sense(b);
        // 램프 입구: 세게 들어오면 올라타고, 약하면 굴러 내려옴
        for (const r of ramps) {
          const dx = b.x - r.cx, dy = b.y - r.top, along = dx * r.ax + dy * r.ay, across = dx * r.nx + dy * r.ny, va = b.vx * r.ax + b.vy * r.ay;
          if (va > 0 && Math.abs(across) < r.half && along > -0.15 && along < 0.5) {
            const sp = Math.hypot(b.vx, b.vy);
            if (va >= RAMP_MIN) { b.ride = { r, d: 0 }; b.h = 0.2; hit('ramp', r, b, sp); }
            else { b.x -= r.ax * 0.3; b.y -= r.ay * 0.3; b.vx -= 1.4 * va * r.ax; b.vy -= 1.4 * va * r.ay; hit('rampFail', r, b, sp); }
            break;
          }
        }
        // 어디 끼어 멈추면 살짝 흔들어 줌
        if (Math.abs(b.vx) + Math.abs(b.vy) < 0.4) { b.still = (b.still || 0) + SUB; if (b.still > 1.6) { b.still = 0; b.vx = (b.x < CX ? 1 : -1) * (2 + Math.random() * 2); b.vy = 3; hit('nudge', null, b, 0); } } else b.still = 0;
        if (b.y < (b.x < W ? APRON_Y - 0.1 : -2.5)) { b.alive = false; hit('drain', null, b, 0); }
        if (!isFinite(b.x) || b.x < -1 || b.x > 21 || b.y > 41) { b.x = CX; b.y = 20; b.vx = b.vy = 0; }
      }
      ballBall();
    }
    for (let i = balls.length - 1; i >= 0; i--) if (!balls[i].alive) balls.splice(i, 1);
  }

  function eject(b) { b.cap = 0; b.noCap = 0.6; b.x = saucer.x - 0.55; b.y = saucer.y - 0.3; b.vx = -7.5 - Math.random() * 2; b.vy = -13 - Math.random() * 2; }

  window.PHYS = {
    W, CX, BR, segs, circles, sensors, bumpers, drops, stands, saucer, boss, flippers, balls, slingL, slingR, laneX, gate, gate2, ramps, rampAt,
    LANE_X, LANE_Y, newBall, step, eject, setHit(fn) { hit = fn; }, arcPts: arc
  };
})();
