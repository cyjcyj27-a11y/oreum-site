// 포켓볼 물리: 당구대 위 2D(x = 긴 쪽, y = 짧은 쪽, 단위 m). 그림은 render.js 가 이 좌표를 3D 로 옮긴다.
// 공은 굴러가며 일정하게 느려지고(구름 마찰), 공끼리는 거의 탄성, 쿠션은 0.78 로 튕긴다.
// 회전: 밀어치기·끌어치기(첫 공을 맞힌 뒤 원래 방향으로 더 가거나 돌아옴), 옆 회전(쿠션에서 꺾임).
(function () {
  const P = (window.PHY = {});
  const R = (P.R = 0.028575);            // 공 반지름(57.15mm)
  const HL = (P.HL = 0.99), HW = (P.HW = 0.495); // 7피트 대 놀이면 1.98 x 0.99 의 절반
  P.DT = 1 / 500;
  P.MAXV = 4.8;                           // 큐 최대 빠르기(m/s). 10/15 사장님 "최대치로 치면 많이 센거같은데" → 6.0 에서 낮춤
  P.BRK = 1.33;                           // 브레이크는 이만큼 더 세게(약 6.4m/s)
  const E_BALL = 0.95, E_RAIL = 0.78, DEC = 0.6, DRAG = 0.22; // 감속: DEC + DRAG*v (m/s^2)
  let MOUTH = 1;                          // 포켓 입구 배율(카드)

  // 쿠션 코: 선분과 턱 끝점. 공 중심이 선분에서 R 안으로 들어오면 튕긴다.
  let SEG = [];
  P.POCKETS = [];
  P.build = function (mouth) {
    MOUTH = mouth || 1;
    const c = 0.088 * MOUTH, s = 0.064 * MOUTH, j = 0.075;
    const S = [];
    const add = (x1, y1, x2, y2) => S.push({ x1, y1, x2, y2, dx: x2 - x1, dy: y2 - y1, l2: (x2 - x1) ** 2 + (y2 - y1) ** 2 });
    for (const sy of [1, -1]) {
      // 긴 레일 둘(가운데 포켓으로 끊김)
      add(-HL + c, sy * HW, -s, sy * HW);
      add(s, sy * HW, HL - c, sy * HW);
      // 가운데 포켓 턱(안쪽으로 살짝 좁아짐)
      add(-s, sy * HW, -s + 0.012, sy * (HW + 0.06));
      add(s, sy * HW, s - 0.012, sy * (HW + 0.06));
      for (const sx of [1, -1]) {
        // 구석 포켓 턱(45도 바깥으로)
        add(sx * (HL - c), sy * HW, sx * (HL - c + j * 0.72), sy * (HW + j * 0.72));
        add(sx * HL, sy * (HW - c), sx * (HL + j * 0.72), sy * (HW - c + j * 0.72));
      }
    }
    for (const sx of [1, -1]) add(sx * HL, -HW + c, sx * HL, HW - c); // 짧은 레일
    SEG = S;
    P.SEG = S;
    P.POCKETS = [
      { x: -HL - 0.012, y: -HW - 0.012, k: 'c' }, { x: 0, y: -HW - 0.03, k: 's' }, { x: HL + 0.012, y: -HW - 0.012, k: 'c' },
      { x: -HL - 0.012, y: HW + 0.012, k: 'c' }, { x: 0, y: HW + 0.03, k: 's' }, { x: HL + 0.012, y: HW + 0.012, k: 'c' },
    ];
    // 공이 노리는 입구 점(AI·가이드용): 구석은 대각선 안쪽, 가운데는 입구 가운데
    P.POCKETS.forEach((p) => {
      if (p.k === 'c') { p.ax = Math.sign(p.x) * (HL - 0.022); p.ay = Math.sign(p.y) * (HW - 0.022); }
      else { p.ax = 0; p.ay = Math.sign(p.y) * (HW + 0.004); }
    });
  };
  P.build(1);

  // 공 15개 + 흰 공. id 0 = 흰 공, 1~7 솔리드, 8, 9~15 스트라이프
  P.newBalls = function () {
    const b = [];
    for (let i = 0; i < 16; i++) b.push({ id: i, x: 0, y: 0, vx: 0, vy: 0, on: true, sv: 0, ss: 0, pend: null, travel: 0 });
    return b;
  };
  // 삼각 랙: 꼭짓점은 풋 스폿(x = HL/2), 8번은 가운데, 뒤 두 구석은 솔리드·스트라이프 하나씩
  P.rack = function (balls, rnd) {
    rnd = rnd || Math.random;
    const solids = [1, 2, 3, 4, 5, 6, 7], stripes = [9, 10, 11, 12, 13, 14, 15];
    const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
    sh(solids); sh(stripes);
    const slots = []; // 15칸: 줄(0..4)마다 i+1 개
    for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) slots.push([r, k]);
    const order = new Array(15).fill(0);
    order[4] = 8;                                // 셋째 줄 가운데
    const cornerA = rnd() < 0.5;
    order[10] = cornerA ? solids.pop() : stripes.pop();
    order[14] = cornerA ? stripes.pop() : solids.pop();
    order[0] = rnd() < 0.5 ? solids.pop() : stripes.pop();
    const rest = sh(solids.concat(stripes));
    for (let i = 0; i < 15; i++) if (!order[i]) order[i] = rest.pop();
    const d = 2 * R + 0.0004, ax = HL / 2;
    slots.forEach(([r, k], i) => {
      const bb = balls[order[i]];
      bb.x = ax + r * d * Math.sqrt(3) / 2 + (rnd() - 0.5) * 0.0003;
      bb.y = (k - r / 2) * d + (rnd() - 0.5) * 0.0003;
      bb.vx = bb.vy = 0; bb.on = true; bb.sv = bb.ss = 0; bb.pend = null;
    });
    const c = balls[0];
    c.x = -HL / 2; c.y = 0; c.vx = c.vy = 0; c.on = true;
  };

  // 치기: 각도 a(라디안), 빠르기 v(m/s), 위아래 회전 sv(-1 끌기 ~ +1 밀기), 옆 회전 ss(-1 왼쪽 ~ +1 오른쪽)
  P.shoot = function (balls, a, v, sv, ss) {
    const c = balls[0];
    c.vx = Math.cos(a) * v; c.vy = Math.sin(a) * v;
    c.sv = sv || 0; c.ss = ss || 0; c.pend = null; c.travel = 0;
  };
  P.newEv = function (sounds) {
    return { first: -1, pocketed: [], railAfter: 0, rails: 0, hits: 0, t: 0, sounds: sounds ? [] : null, cueRail: 0 };
  };

  function snd(ev, type, v, x, y, id) { if (ev.sounds && v > 0.05) ev.sounds.push({ type, v, x, y, id }); }

  // 한 걸음. 움직이는 공이 하나라도 있으면 true
  P.step = function (balls, ev, dt) {
    dt = dt || P.DT;
    ev.t += dt;
    let moving = false;
    for (let i = 0; i < 16; i++) {
      const b = balls[i];
      if (!b.on) continue;
      if (b.pend) {                                   // 밀어치기·끌어치기 힘이 조금씩 옮겨 온다
        const f = 1 - Math.exp(-dt / 0.07);
        b.vx += b.pend.x * f; b.vy += b.pend.y * f;
        b.pend.x *= 1 - f; b.pend.y *= 1 - f;
        if (Math.abs(b.pend.x) + Math.abs(b.pend.y) < 0.002) b.pend = null;
      }
      let sp = Math.hypot(b.vx, b.vy);
      if (sp === 0) continue;
      const ns = sp - (DEC + DRAG * sp) * dt;
      if (ns <= 0.004 && !b.pend) { b.vx = b.vy = 0; continue; }
      const k = Math.max(ns, 0) / sp;
      b.vx *= k; b.vy *= k;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.travel += ns * dt;
      if (b.ss) b.ss *= Math.exp(-dt / 5);
      moving = true;
    }
    // 공끼리
    for (let i = 0; i < 16; i++) {
      const a = balls[i];
      if (!a.on) continue;
      for (let j = i + 1; j < 16; j++) {
        const b = balls[j];
        if (!b.on) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx > 2 * R || dx < -2 * R || dy > 2 * R || dy < -2 * R) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const vrel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vrel > 0) {
          let cue = null, vin = 0, dirx = 0, diry = 0;
          if (a.id === 0 || b.id === 0) {
            cue = a.id === 0 ? a : b;
            vin = Math.hypot(cue.vx, cue.vy);
            if (vin > 0) { dirx = cue.vx / vin; diry = cue.vy / vin; }
            if (ev.first < 0) ev.first = a.id === 0 ? b.id : a.id;
          }
          const jn = ((1 + E_BALL) / 2) * vrel;
          a.vx -= jn * nx; a.vy -= jn * ny;
          b.vx += jn * nx; b.vy += jn * ny;
          ev.hits++;
          snd(ev, 'ball', vrel, (a.x + b.x) / 2, (a.y + b.y) / 2, cue ? 0 : a.id);
          if (cue && cue.sv) {                        // 첫 접촉에서 회전이 일한다(멀리 갈수록 약해짐)
            const eff = cue.sv * Math.exp(-cue.travel / 3.2) * (cue.sv > 0 ? 1.05 : 0.85);
            cue.pend = { x: dirx * vin * eff, y: diry * vin * eff };
            cue.sv = 0;
          }
        }
        const ov = 2 * R - d;
        if (ov > 0) { a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2; }
      }
    }
    // 쿠션
    for (let i = 0; i < 16; i++) {
      const b = balls[i];
      if (!b.on) continue;
      if (b.x > -HL + R && b.x < HL - R && b.y > -HW + R && b.y < HW - R) continue; // 쿠션에서 먼 공은 건너뜀
      for (let s = 0; s < SEG.length; s++) {
        const g = SEG[s];
        let t = ((b.x - g.x1) * g.dx + (b.y - g.y1) * g.dy) / g.l2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const px = g.x1 + g.dx * t, py = g.y1 + g.dy * t;
        const dx = b.x - px, dy = b.y - py, d2 = dx * dx + dy * dy;
        if (d2 >= R * R || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const rx = b.vy / sp, ry = -b.vx / sp;      // 들어오던 방향의 오른쪽
          b.vx -= (1 + E_RAIL) * vn * nx; b.vy -= (1 + E_RAIL) * vn * ny;
          const tn = b.vx * nx + b.vy * ny;           // 미끄럼 마찰로 옆 성분 조금 줄임
          b.vx = tn * nx + (b.vx - tn * nx) * 0.96; b.vy = tn * ny + (b.vy - tn * ny) * 0.96;
          if (b.ss) { b.vx += rx * b.ss * 0.36 * -vn; b.vy += ry * b.ss * 0.36 * -vn; b.ss *= 0.45; }
          if (b.id === 0) { b.sv *= 0.3; ev.cueRail++; }
          ev.rails++;
          if (ev.first >= 0) ev.railAfter++;
          snd(ev, 'rail', -vn, b.x, b.y, b.id);
        }
        b.x = px + nx * R; b.y = py + ny * R;
      }
      // 포켓: 레일 선 밖으로 나가면 빠진 것
      if (b.x > HL + R * 0.55 || b.x < -HL - R * 0.55 || b.y > HW + R * 0.55 || b.y < -HW - R * 0.55) {
        let bi = 0, bd = 1e9;
        P.POCKETS.forEach((p, k) => { const dd = (p.x - b.x) ** 2 + (p.y - b.y) ** 2; if (dd < bd) { bd = dd; bi = k; } });
        b.on = false;
        ev.pocketed.push({ id: b.id, p: bi, t: ev.t, vx: b.vx, vy: b.vy, x: b.x, y: b.y });
        snd(ev, 'pocket', Math.hypot(b.vx, b.vy), b.x, b.y, b.id);
        b.vx = b.vy = 0; b.pend = null;
      }
    }
    return moving;
  };

  // 끝까지 돌리기(AI·예측용). 사본에서 돌린다.
  P.clone = (balls) => balls.map((b) => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, on: b.on, sv: b.sv, ss: b.ss, pend: b.pend ? { x: b.pend.x, y: b.pend.y } : null, travel: b.travel }));
  P.simulate = function (balls, maxT) {
    const ev = P.newEv(false);
    const lim = (maxT || 14) / P.DT;
    for (let n = 0; n < lim; n++) if (!P.step(balls, ev) && n > 2) break;
    return ev;
  };

  // ── 겨눔선: 흰 공이 방향 a 로 갈 때 처음 닿는 것(공 또는 쿠션)
  function rayCircle(ox, oy, dx, dy, cx, cy, r) {
    const fx = ox - cx, fy = oy - cy;
    const b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r;
    if (c < 0) return 0;
    const disc = b * b - c;
    if (disc < 0) return -1;
    const t = -b - Math.sqrt(disc);
    return t >= 0 ? t : -1;
  }
  function raySeg(ox, oy, dx, dy, g) {
    let best = -1;
    const L = Math.sqrt(g.l2), ux = g.dx / L, uy = g.dy / L;
    let nx = -uy, ny = ux;
    let s0 = (ox - g.x1) * nx + (oy - g.y1) * ny;
    if (s0 < 0) { nx = -nx; ny = -ny; s0 = -s0; }
    const dn = dx * nx + dy * ny;
    if (dn < 0 && s0 >= R) {
      const t = (R - s0) / dn;
      const hx = ox + dx * t - g.x1, hy = oy + dy * t - g.y1;
      const u = hx * ux + hy * uy;
      if (u >= 0 && u <= L) best = t;
    }
    for (const [cx, cy] of [[g.x1, g.y1], [g.x2, g.y2]]) {
      const t = rayCircle(ox, oy, dx, dy, cx, cy, R);
      if (t >= 0 && (best < 0 || t < best)) best = t;
    }
    return best;
  }
  P.trace = function (balls, a) {
    const c = balls[0], dx = Math.cos(a), dy = Math.sin(a);
    let bt = 1e9, hit = null;
    for (let i = 1; i < 16; i++) {
      const b = balls[i];
      if (!b.on) continue;
      const t = rayCircle(c.x, c.y, dx, dy, b.x, b.y, 2 * R);
      if (t >= 0 && t < bt) { bt = t; hit = { type: 'ball', id: i }; }
    }
    for (let s = 0; s < SEG.length; s++) {
      const t = raySeg(c.x, c.y, dx, dy, SEG[s]);
      if (t >= 0 && t < bt) { bt = t; hit = { type: 'rail', seg: s }; }
    }
    if (!hit) return null;
    hit.t = bt; hit.x = c.x + dx * bt; hit.y = c.y + dy * bt;
    if (hit.type === 'ball') {
      const b = balls[hit.id];
      const nx = (b.x - hit.x) / (2 * R), ny = (b.y - hit.y) / (2 * R);
      hit.ox = nx; hit.oy = ny;                       // 맞은 공이 갈 방향
      const dot = dx * nx + dy * ny;
      hit.cut = dot;                                  // 1 = 정면, 0 = 스침
      let tx = dx - dot * nx, ty = dy - dot * ny;     // 흰 공은 그 직각으로
      const tl = Math.hypot(tx, ty);
      if (tl > 1e-6) { tx /= tl; ty /= tl; }
      hit.cx = tx; hit.cy = ty; hit.cs = tl;
    } else {
      const g = SEG[hit.seg];
      const L = Math.sqrt(g.l2);
      let nx = -g.dy / L, ny = g.dx / L;
      if (nx * (c.x - g.x1) + ny * (c.y - g.y1) < 0) { nx = -nx; ny = -ny; }
      const vn = dx * nx + dy * ny;
      hit.rx = dx - 2 * vn * nx; hit.ry = dy - 2 * vn * ny; // 튕겨 나가는 방향(어림)
    }
    return hit;
  };

  // 흰 공을 놓을 수 있는 자리인가(다른 공과 겹치지 않고 대 안)
  P.canPlace = function (balls, x, y, headOnly) {
    if (x < -HL + R || x > HL - R || y < -HW + R || y > HW - R) return false;
    if (headOnly && x > -HL / 2) return false;
    for (let i = 1; i < 16; i++) { const b = balls[i]; if (b.on && (b.x - x) ** 2 + (b.y - y) ** 2 < (2 * R + 0.002) ** 2) return false; }
    return true;
  };
  // 빈 자리 찾기(8번 다시 놓기·흰 공 놓기): 원하는 자리에서 가까운 빈칸
  P.freeSpot = function (balls, x, y, skip) {
    for (let r = 0; r < 0.6; r += 0.01) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        let ok = px > -HL + R && px < HL - R && py > -HW + R && py < HW - R;
        for (let i = 0; ok && i < 16; i++) { const b = balls[i]; if (i !== skip && b.on && (b.x - px) ** 2 + (b.y - py) ** 2 < (2 * R + 0.002) ** 2) ok = false; }
        if (ok) return { x: px, y: py };
        if (r === 0) break;
      }
    }
    return { x, y };
  };
})();
