// 테이블 축구 — 물리: 공·막대·인형 부딪힘, 그리고 상대 두뇌
// 좌표: x = 테이블 길이(왼쪽 골대 -HL), z = 폭(+z 가 화면 앞쪽), y = 위. 단위 m
(function () {
  const PH = (window.PH = {});
  const C = (PH.C = {
    HL: 0.6, HW: 0.34, GW: 0.1, R: 0.0175,
    // 발: 둥근 막대꼴 (평평한 폭 WZ + 둥글기 TH) — 비껴 맞으면 비스듬히 나간다
    ROD_Y: 0.078, LEG: 0.072, TH: 0.0115, WZ: 0.0045, REACHZ: 0.016,
    TOE: 0.016, HEEL: 0.012, // 발끝·뒤꿈치: 다리 끝에서 앞뒤로 뻗은 신발 (가운데선 공·등 뒤 공까지 닿게)
    DT: 1 / 240, MAXV: 3.8,
    WIND: -1.25, TOP: 1.45,
  });

  // 한 팀의 막대 넷 (0팀 기준: 왼쪽 골대를 지키고 +x 로 공격)
  const RODS = [
    { k: 'gk', x: -0.525, men: [0], tr: 0.32 }, // 골키퍼 1명 (실제 배열 1·2·5·3). 판 끝까지 간다 (사장님 9/20)
    { k: 'df', x: -0.375, men: [-0.12, 0.12], tr: 0.2 },
    { k: 'mf', x: -0.075, men: [-0.24, -0.12, 0, 0.12, 0.24], tr: 0.085 },
    { k: 'fw', x: 0.225, men: [-0.2, 0, 0.2], tr: 0.125 },
  ];
  PH.RODS = RODS;

  const S = (PH.S = { ball: null, rods: [], events: [], team: [null, null] });

  // tap: 누른 순간을 기억 (한 프레임보다 짧게 톡 눌렀다 떼도 한 번은 찬다)
  function mkTeam() { return { kick: false, prev: false, tap: false, pow: 1, spd: 2.2 }; }

  PH.reset = function () {
    S.rods = [];
    for (let t = 0; t < 2; t++) {
      const dir = t === 0 ? 1 : -1;
      RODS.forEach((d, i) => {
        S.rods.push({
          team: t, i, k: d.k, x: d.x * dir, dir, men: d.men, tr: d.tr,
          pos: 0, vpos: 0, aim: 0, man: Math.floor(d.men.length / 2),
          ang: 0, w: 0, st: 'idle', tt: 0, spin: 0,
        });
      });
    }
    S.team = [mkTeam(), mkTeam()];
    S.ball = { x: 0, y: C.R, z: 0, vx: 0, vz: 0, st: 'wait', last: null, lastT: -1, t: 0, drop: 0 };
    S.events.length = 0;
  };

  // 서브: 가운데 옆구멍에서 5인 막대 쪽으로 공이 굴러 들어온다 (team 을 주면 그 팀 5인 막대 앞)
  PH.serve = function (side, team) {
    const b = S.ball;
    const s = side || (Math.random() < 0.5 ? -1 : 1);
    const mid = team == null ? (Math.random() < 0.5 ? -1 : 1) * 0.075 : (team === 0 ? -0.075 : 0.075);
    b.x = mid + (Math.random() - 0.5) * 0.02;
    b.z = s * (C.HW - C.R - 0.005);
    b.y = C.R;
    b.vx = (Math.random() - 0.5) * 0.25;
    b.vz = -s * (0.75 + Math.random() * 0.35);
    b.st = 'play';
    b.last = null;
    b.t = 0;
    b.drop = 0;
    S.events.push({ t: 'serve' });
  };

  // 막대가 목표 자리(aim)에 인형 하나를 대려면 얼마나 밀어야 하나
  function wantPos(r) {
    // 지금 대고 있는 인형을 고집한다. 아예 못 닿을 때만 다른 인형으로 바꾼다 (바꾸는 순간 막대가 되돌아가므로)
    const cur = r.men[r.man];
    const pc = r.aim - cur;
    if (pc >= -r.tr - 0.03 && pc <= r.tr + 0.03) return Math.max(-r.tr, Math.min(r.tr, pc));
    let bestK = r.man, bestD = 1e9, best = Math.max(-r.tr, Math.min(r.tr, pc));
    for (let k = 0; k < r.men.length; k++) {
      const p = r.aim - r.men[k];
      const cp = Math.max(-r.tr, Math.min(r.tr, p));
      const miss = Math.abs(p - cp);
      const d = miss * 10 + Math.abs(cp - r.pos);
      if (d < bestD) { bestD = d; best = cp; bestK = k; }
    }
    r.man = bestK;
    return best;
  }
  PH.manZ = (r, k) => r.men[k] + r.pos;

  // 킥을 누른 순간 막대마다 할 일: 공에 제일 가까운 막대는 차고(kick),
  // 공보다 앞에 선 우리 막대는 슛이 지나가게 들고(lift), 뒤에 있는 막대는 그대로 지킨다(stay)
  function assignRoles(team) {
    const b = S.ball;
    let act = null, best = 1e9;
    for (const r of S.rods) {
      if (r.team !== team) continue;
      const d = Math.abs(b.x - r.x);
      if (d < best) { best = d; act = r; }
    }
    for (const r of S.rods) {
      if (r.team !== team) continue;
      const sb = (b.x - r.x) * r.dir;
      // 누르면 막대 넷이 똑같이 찬다 (수비·골키퍼도 같게). 공 바로 뒤면 뒤로 감아 뺀다
      // 골키퍼도 등 뒤 공을 뒤꿈치로 뺀다 (실제 그대로 — 자책골 위험도 실제 그대로)
      r.role = r === act && sb < -0.01 && sb > -0.105 ? 'back' : 'kick';
    }
  }

  // 막대는 베어링에 꽂힌 쇠막대다. 특별한 조건 없이 물리만 (사장님 2026-09-20 "테이블 축구 물리 그대로")
  //  - 옆으로: 손이 미는 대로, 무게 때문에 천천히 붙고 천천히 선다
  //  - 돌리기: 인형 무게가 추처럼 아래로 끌고, 베어링 마찰이 조금. 톡 치면 그 힘으로 돌고,
  //    누르고 있으면 손목이 계속 돌려 한 바퀴 넘게 돈다 (발이 뒤에서 넘어와 등 뒤 공을 앞으로 쓸어 온다)
  const SLIDE_A = 11;    // 미는 가속 (m/s^2) — 9/20 "반응이 느림"으로 6 → 11
  const GRAV_W = 60;     // 인형 무게 (추)
  const DAMP_W = 2.2;    // 베어링 마찰 (돌리는 중)
  const GRIP_D = 14;     // 손이 손잡이를 잡고 있는 마찰 (돌리지 않을 때) — 톡 친 뒤 한 바퀴 돌지 않고 잡힌다
  const KICK_W = 30;     // 손목 한 번 꺾는 힘 (각속도)
  const SPIN_TQ = 55;    // 누르고 있을 때 손목이 계속 돌리는 힘
  const SPIN_MAX = 9;    // 손목이 돌릴 수 있는 최고 속도 (초당 1.4바퀴 — 9/20 "너무 뱅글뱅글")

  function stepRods(dt) {
    const hit = [0, 1].map((t) => (S.team[t].kick && !S.team[t].prev) || S.team[t].tap);
    for (const r of S.rods) {
      const tm = S.team[r.team];
      // ---- 옆으로 밀기 (가속·감속) ----
      // 사람 막대는 손이 미는 만큼(aimPos), 상대 막대는 인형을 공에 대는 자리(wantPos)
      const want = r.aimPos != null ? Math.max(-r.tr, Math.min(r.tr, r.aimPos)) : wantPos(r);
      const vmax = r.spd || tm.spd;
      let d = want - r.pos;
      if (Math.abs(d) < 0.0015 && Math.abs(r.vpos) < 0.05) { d = 0; r.vpos = 0; }
      // 남은 거리에서 멈출 수 있는 빠르기
      const vStop = Math.sqrt(2 * SLIDE_A * Math.abs(d));
      const vWant = Math.max(-vmax, Math.min(vmax, Math.sign(d) * Math.min(vmax, vStop)));
      const dv = SLIDE_A * dt;
      r.vpos += Math.max(-dv, Math.min(dv, vWant - r.vpos));
      // 목표를 지나치면 되돌아오는 반동이 생기니, 넘어가는 걸음은 딱 목표에서 세운다
      if (Math.abs(r.vpos * dt) >= Math.abs(d) && Math.sign(r.vpos) === Math.sign(d)) { r.pos = want; r.vpos = 0; }
      else r.pos += r.vpos * dt;
      if (r.pos > r.tr) { r.pos = r.tr; if (r.vpos > 0) r.vpos = 0; }
      if (r.pos < -r.tr) { r.pos = -r.tr; if (r.vpos < 0) r.vpos = 0; }
      // ---- 돌리기 (추 + 손) ----
      if (r.spin) {
        r.w = r.spin;
        r.ang += r.w * dt;
        continue;
      }
      // 손목: 톡 치면 한 번, 누르고 있으면 계속 돌린다
      if (hit[r.team]) r.w += KICK_W * tm.pow;
      let acc = -GRAV_W * Math.sin(r.ang) - (tm.kick ? DAMP_W : GRIP_D) * r.w;
      if (tm.kick && r.w < SPIN_MAX * tm.pow) acc += SPIN_TQ * tm.pow;
      r.w += acc * dt;
      r.w = Math.max(-46, Math.min(46, r.w));
      r.ang += r.w * dt;
      // 다 멈추면 아래에 매달려 선다 (수치 떨림만 정리)
      if (!tm.kick && Math.abs(r.ang) < 0.01 && Math.abs(r.w) < 0.25) { r.ang = 0; r.w = 0; }
      if (r.ang > Math.PI) { r.ang -= Math.PI * 2; }
      if (r.ang < -Math.PI) { r.ang += Math.PI * 2; }
    }
    for (const tm of S.team) { tm.prev = tm.kick; tm.tap = false; }
  }

  // 공과 인형
  function hitMen(b) {
    const reach = C.LEG + C.TOE + C.R + C.TH + 0.01;
    for (const r of S.rods) {
      const sb = (b.x - r.x) * r.dir;
      if (sb > reach || sb < -reach) continue;
      const ang = r.spin ? ((r.ang % 6.2832) + 6.2832) % 6.2832 : r.ang;
      const sa = Math.sin(ang), ca = Math.cos(ang);
      const dx = C.LEG * sa, dy = -C.LEG * ca;
      // 다리(막대→발) 와 발끝(발→앞) 두 토막 중 공에 더 가까운 점을 잡는다
      let t = (sb * dx + (C.R - C.ROD_Y) * dy) / (C.LEG * C.LEG);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      let ps = t * dx, py = C.ROD_Y + t * dy;
      {
        const fs = dx, fy = C.ROD_Y + dy; // 발
        // 신발: 뒤꿈치(-HEEL)부터 발끝(+TOE)까지 다리와 직각인 토막
        const ex = ca, ey = sa;
        const L = C.TOE + C.HEEL;
        const hs = fs - C.HEEL * ex, hy = fy - C.HEEL * ey;
        let u = ((sb - hs) * ex + (C.R - hy) * ey) / L;
        u = u < 0 ? 0 : u > L ? L : u;
        const qs = hs + u * ex, qy = hy + u * ey;
        if (Math.hypot(sb - qs, C.R - qy) < Math.hypot(sb - ps, C.R - py)) { ps = qs; py = qy; }
      }
      for (let k = 0; k < r.men.length; k++) {
        const mz = r.men[k] + r.pos;
        const zc = b.z < mz - C.WZ ? mz - C.WZ : b.z > mz + C.WZ ? mz + C.WZ : b.z;
        const ns = sb - ps, ny = C.R - py, nz = b.z - zc;
        const d = Math.hypot(ns, ny, nz);
        if (d >= C.R + C.TH || d < 1e-7) continue;
        let hs = ns, hz = nz, hl = Math.hypot(hs, hz);
        if (hl < 1e-5) { hs = r.w >= 0 ? 1 : -1; hz = 0; hl = 1; }
        hs /= hl; hz /= hl;
        const nx = hs * r.dir, nzw = hz;
        const pen = C.R + C.TH - d;
        const push = Math.min(0.02, (pen * d) / Math.max(hl, 0.3 * d));
        b.x += nx * push;
        b.z += nzw * push;
        // 앞으로 차는 발은 힘껏, 뒤로 감는 발은 반만 (골키퍼는 뒤로 감을 때 막기만 — 자책골 방지)
        // 앞으로 차는 발은 힘껏. 뒤로는 일부러 감을 때만 세게(0.6), 그냥 내려오는 발은 살짝 누르는 정도(0.12)
        // 발이 움직이는 방향 그대로 공을 민다 (앞이든 뒤든, 조건 없이)
        const cs = r.spin ? 0 : (C.ROD_Y - py) * r.w;
        const cvx = cs * r.dir, cvz = r.vpos;
        const rvx = b.vx - cvx, rvz = b.vz - cvz;
        const vn = rvx * nx + rvz * nzw;
        if (vn < 0) {
          const e = Math.abs(cs) > 0.3 ? 0.55 : 0.3;
          b.vx -= (1 + e) * vn * nx;
          b.vz -= (1 + e) * vn * nzw;
          // 발이 옆으로 미끄러지며 차면 공이 옆으로 휜다 (당겨 차기)
          const tx = -nzw, tz = nx;
          const vt = (b.vx - cvx) * tx + (b.vz - cvz) * tz;
          const f = Math.abs(cs) > 0.3 ? 0.35 : 0.15;
          b.vx -= vt * tx * f;
          b.vz -= vt * tz * f;
          const imp = -vn;
          // 공을 때린 만큼 막대가 힘을 잃는다 (손맛)
          if (Math.abs(cs) > 0.2) r.w -= Math.sign(r.w) * Math.min(Math.abs(r.w) * 0.5, imp * 2.2);
          if (imp > 0.05) S.events.push({ t: 'hit', v: imp, kick: cs > 0.3, team: r.team });
          b.last = r;
          b.lastT = b.t;
          if (cs > 0.3) b.kickBy = r;
        }
      }
    }
  }

  const POSTS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  function stepBall(dt) {
    const b = S.ball;
    b.t += dt;
    if (b.st === 'goal') {
      // 골대 속으로 떨어진다
      b.x += b.vx * dt * 0.5;
      b.vx *= 0.9;
      b.drop = Math.min(1, b.drop + dt * 3);
      b.y = C.R - b.drop * 0.07;
      return;
    }
    if (b.st !== 'play') return;
    // 구석·가장자리 경사
    // 구석 경사판 (실제 테이블에 있는 것): 네 구석에 선 공을 판 안쪽으로 굴린다
    if (Math.abs(b.x) > C.HL - 0.05 && Math.abs(b.z) > C.HW - 0.05) {
      b.vx -= Math.sign(b.x) * 0.25 * dt;
      b.vz -= Math.sign(b.z) * 0.25 * dt;
    }
    // 구름 저항
    const sp = Math.hypot(b.vx, b.vz);
    if (sp > 1e-6) {
      const ns = Math.max(0, sp - (0.09 + 0.22 * sp) * dt);
      b.vx *= ns / sp;
      b.vz *= ns / sp;
    }
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    // 옆벽
    const zl = C.HW - C.R;
    if (b.z > zl) { b.z = zl; if (b.vz > 0) { if (b.vz > 0.3) S.events.push({ t: 'wall', v: b.vz }); b.vz *= -0.72; } }
    if (b.z < -zl) { b.z = -zl; if (b.vz < 0) { if (b.vz < -0.3) S.events.push({ t: 'wall', v: -b.vz }); b.vz *= -0.72; } }
    // 골대 기둥
    for (const [sx, sz] of POSTS) {
      const px = sx * C.HL, pz = sz * C.GW;
      const dx = b.x - px, dz = b.z - pz, d = Math.hypot(dx, dz);
      if (d < C.R && d > 1e-6) {
        const nx = dx / d, nz = dz / d;
        b.x = px + nx * C.R;
        b.z = pz + nz * C.R;
        const vn = b.vx * nx + b.vz * nz;
        if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vz -= 1.7 * vn * nz; S.events.push({ t: 'post', v: -vn }); }
      }
    }
    // 끝벽과 골
    const xl = C.HL - C.R;
    const inMouth = Math.abs(b.z) < C.GW - C.R * 0.15;
    if (Math.abs(b.x) > xl) {
      if (inMouth) {
        if (Math.abs(b.x) > C.HL + C.R * 0.6) {
          b.st = 'goal';
          b.drop = 0;
          S.events.push({ t: 'goal', team: b.x > 0 ? 0 : 1, v: Math.abs(b.vx) });
        }
      } else if (Math.abs(b.x) < C.HL + C.R * 0.5) {
        const s = Math.sign(b.x);
        b.x = s * xl;
        if (b.vx * s > 0) { if (Math.abs(b.vx) > 0.3) S.events.push({ t: 'wall', v: Math.abs(b.vx) }); b.vx *= -0.72; }
      }
    }
    hitMen(b);
    const v = Math.hypot(b.vx, b.vz);
    if (v > C.MAXV) { b.vx *= C.MAXV / v; b.vz *= C.MAXV / v; }
  }

  PH.step = function () {
    stepRods(C.DT);
    stepBall(C.DT);
  };

  // 공이 막대 줄(x)에 닿을 때의 z (벽 튕김 반영)
  PH.predictZ = function (x) {
    const b = S.ball;
    if (Math.abs(b.vx) < 0.05) return b.z;
    const t = (x - b.x) / b.vx;
    if (t < 0 || t > 1.2) return b.z;
    let z = b.z + b.vz * t;
    const L = C.HW - C.R;
    for (let i = 0; i < 4 && (z > L || z < -L); i++) z = z > L ? 2 * L - z : -2 * L - z;
    return z;
  };

  // 두 번째 손: 실제로는 한 손으로 골키퍼를 잡고 있다. 우리 진영으로 공이 올 때만 따라간다
  PH.secondHand = function (team, dt, spd, err) {
    const b = S.ball;
    if (b.st !== 'play') return;
    for (const r of S.rods) {
      if (r.team !== team || r.k !== 'gk') continue;
      const sb = (b.x - r.x) * r.dir;
      if (sb < 0 || sb > 0.5) return; // 공이 우리 진영 밖이면 그냥 둔다
      const coming = b.vx * r.dir < -0.2;
      const want = coming ? PH.predictZ(r.x) : b.z;
      r.hand = r.hand == null ? want : r.hand + Math.max(-0.35, Math.min(0.35, want - r.hand)) * Math.min(1, dt * 6);
      r.spd = spd;
      r.aim = r.hand + (err || 0);
    }
  };

  // ---------- 상대 두뇌 ----------
  // lv: 0(아주 쉬움) ~ 1(아주 어려움)
  PH.makeAI = function (team, lv) {
    const e = (a, b) => a + (b - a) * lv;
    const q = Math.sqrt(lv); // 낮은 쪽을 잘게
    const eq = (a, b) => a + (b - a) * q;
    return {
      team, lv,
      // 약한 상대도 부지런히 움직인다 — 대신 겨냥이 크게 빗나가고 힘이 약하다 (사장님 9/20 "CPU 는 왜이리 안 움직이냐")
      react: eq(0.32, 0.06), // 판단 간격
      spd: eq(0.7, 1.5),     // 막대 미는 빠르기
      err: eq(0.32, 0.006),  // 겨냥 흔들림 (약할수록 엉뚱한 데를 왔다 갔다)
      tol: eq(0.3, 0.95),    // 찰 때 얼마나 정확히 맞추나
      pow: eq(0.26, 0.9),    // 약한 상대의 슛은 톡 치는 정도
      lazy: eq(0.5, 0),      // 찰 기회를 놓치는 비율
      trick: e(0.03, 0.7),   // 당겨 차기 쓰는 비율
      t: 0, kickT: 0, cool: 0, hold: 0, trickDir: 0, wait: 0,
    };
  };
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

  PH.aiStep = function (ai, dt) {
    const b = S.ball, tm = S.team[ai.team];
    tm.spd = ai.spd;
    tm.pow = ai.pow;
    ai.t -= dt;
    ai.cool -= dt;
    const mine = S.rods.filter((r) => r.team === ai.team);
    if (ai.t <= 0) {
      ai.t = ai.react * (0.7 + Math.random() * 0.6);
      // 사람과 같은 조건: 막대 넷이 한 자리로 같이 움직인다 (공에 제일 가까운 막대 기준)
      let act = null, bd = 1e9;
      for (const r of mine) { const d = Math.abs(b.x - r.x); if (d < bd) { bd = d; act = r; } }
      const sb = (b.x - act.x) * act.dir;
      const coming = sb > 0 && b.vx * act.dir < -0.1;
      let z = coming ? PH.predictZ(act.x) : b.z + b.vz * 0.08;
      z += gauss() * ai.err * (coming ? 1.4 : 1);
      if (act.trickZ != null) z = act.trickZ;
      for (const r of mine) { r.spd = ai.spd; r.aim = z; }
    }
    // 당겨 차기: 공 옆에 인형을 대 놓고, 차는 순간 옆으로 훑는다
    const tr = ai.tr;
    if (tr) {
      tr.t += dt;
      const r = tr.rod;
      if (tr.ph === 'set') {
        r.trickZ = tr.bz - tr.s * 0.024;
        r.aim = r.trickZ;
        if (Math.abs(PH.manZ(r, r.man) - r.trickZ) < 0.004 || tr.t > 0.6) { tr.ph = 'shoot'; tr.t = 0; tm.kick = true; ai.hold = 0.035; }
      } else {
        if (r.w > 5) { r.trickZ = tr.bz + tr.s * 0.1; }
        r.aim = r.trickZ;
        if (tr.t > 0.3) { r.trickZ = null; ai.tr = null; ai.cool = 0.3; }
      }
    }
    // 차기
    if (ai.hold > 0) {
      ai.hold -= dt;
      if (ai.hold <= 0) tm.kick = false;
      return;
    }
    tm.kick = false;
    const v = Math.hypot(b.vx, b.vz);
    // 킥 사이 틈은 두되, 공이 발 앞에 멈춰 있으면 오래 기다리지 않는다 (사장님 9/20 "공이 바로 앞에 있는데도 안 찬다")
    if ((v < 0.3 ? ai.cool > 0.3 : ai.cool > 0) || ai.tr || b.st !== 'play') return;
    for (const r of mine) {
      const sb = (b.x - r.x) * r.dir;
      const mz = PH.manZ(r, r.man);
      const off = Math.abs(b.z - mz);
      // 발 폭 안에 들어온 공은 찬다 (약한 상대도 눈앞의 공은 건드린다 — 정확도 차이는 물리가 낸다)
      if (off > (C.REACHZ + C.R) * Math.max(ai.tol, 0.85)) continue;
      // 인형 뒤에 선 공: 뒤로 감아 빼 준다
      if (sb < -0.012 && sb > -0.1 && v < 0.35) {
        // 등 뒤 공: 손목을 반 초쯤 돌려 발이 넘어와 앞으로 쓸어 온다
        tm.kick = true;
        ai.hold = 0.5;
        ai.cool = 0.8;
        return;
      }
      if (sb < -0.004 || sb > 0.09) continue;
      // 멈춘 공은 게으른 상대도 반드시 건드린다 (죽은 공 방지)
      if (v > 0.1 && Math.random() < ai.lazy) { ai.cool = 0.25; return; }
      if (v < 0.2 && r.k === 'fw' && Math.random() < ai.trick) {
        ai.tr = { rod: r, s: Math.random() < 0.5 ? -1 : 1, bz: b.z, ph: 'set', t: 0 };
        return;
      }
      tm.kick = true;
      ai.hold = 0.015 + Math.random() * 0.02; // 톡 — 돌리지 않는다
      ai.cool = 0.55 + (1 - ai.lv) * 0.5; // 사람처럼 킥 사이에 틈이 있다
      return;
    }
  };

  PH.reset();
})();
