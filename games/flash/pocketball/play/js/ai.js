// 상대(컴퓨터). 넣을 수 있는 공-포켓 짝을 찾아 점수를 매기고, 급수가 높으면 몇 개를 실제로 굴려 보고 고른다.
// 약한 상대는 "엉뚱한 데"가 아니라 사람 초보처럼 겨눔이 흔들리고 힘 조절이 서툴다.
(function () {
  const P = PHY, RU = RULES, R = P.R;
  const AI = (window.AI = {});
  let rs = 1;
  AI.seed = (s) => (rs = s || 1);
  const rnd = () => ((rs = (rs * 16807) % 2147483647) - 1) / 2147483646;
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  function segClear(balls, x1, y1, x2, y2, skipA, skipB, rad) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1e-9;
    for (let i = 0; i < 16; i++) {
      if (i === skipA || i === skipB) continue;
      const b = balls[i];
      if (!b.on) continue;
      let t = ((b.x - x1) * dx + (b.y - y1) * dy) / l2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = x1 + dx * t, py = y1 + dy * t;
      if ((b.x - px) ** 2 + (b.y - py) ** 2 < rad * rad) return false;
    }
    return true;
  }
  // 직접 넣는 샷 후보: { a, v, id, pk, score }
  AI.candidates = function (balls, ids, mouth) {
    const c = balls[0], out = [];
    for (const id of ids) {
      const b = balls[id];
      if (!b.on) continue;
      P.POCKETS.forEach((p, pk) => {
        const ax = p.ax, ay = p.ay;
        let ux = ax - b.x, uy = ay - b.y;
        const d2 = Math.hypot(ux, uy); ux /= d2; uy /= d2;
        // 포켓에 들어가는 각: 가운데 포켓은 너무 비스듬하면 턱에 걸린다
        if (p.k === 's' && Math.abs(uy) < 0.42) return;
        if (p.k === 'c') { const dx = Math.sign(p.x) * 0.7071, dy = Math.sign(p.y) * 0.7071; if (ux * dx + uy * dy < 0.35) return; }
        const gx = b.x - ux * 2 * R, gy = b.y - uy * 2 * R;
        if (Math.abs(gx) > P.HL - R * 0.9 || Math.abs(gy) > P.HW - R * 0.9) return;
        let vx = gx - c.x, vy = gy - c.y;
        const d1 = Math.hypot(vx, vy); if (d1 < 1e-4) return;
        vx /= d1; vy /= d1;
        const cs = vx * ux + vy * uy;
        if (cs < 0.2) return;
        if (!segClear(balls, c.x, c.y, gx, gy, 0, id, 2 * R - 0.001)) return;
        if (!segClear(balls, b.x, b.y, ax, ay, id, 0, 2 * R - 0.002)) return;
        const need = Math.sqrt(2 * 0.95 * (d2 + 0.25)) + 0.15;            // 맞은 공이 포켓까지 갈 빠르기
        const vi = need / (Math.max(cs, 0.25) * 0.975);
        let v = Math.sqrt(vi * vi + 2 * 0.9 * d1);
        v = Math.min(P.MAXV, Math.max(0.55, v));
        const angF = p.k === 's' ? Math.abs(uy) : 1;
        const score = (cs * cs * angF) / (0.35 + d1 * 0.45 + d2 * 0.9) * (mouth || 1);
        out.push({ a: Math.atan2(vy, vx), v, id, pk, score, cs, d1, d2 });
      });
    }
    out.sort((x, y) => y.score - x.score);
    return out;
  };

  // 다음 차례 쉬운 샷이 남는지(자리 잡기)
  function leaveScore(balls, st, who) {
    const ids = RU.legal(balls, st, who);
    const cs = AI.candidates(balls, ids);
    return cs.length ? cs[0].score + (cs[1] ? cs[1].score * 0.3 : 0) : 0;
  }
  function evalShot(balls, st, a, v, sv, ss) {
    const B = P.clone(balls);
    P.shoot(B, a, v, sv, ss);
    const ev = P.simulate(B, 16);
    const r = RU.judge(balls, st, ev);
    let s = 0;
    if (r.win) s = 1000;
    else if (r.lose) s = -1000;
    else if (r.foul) s = -60;
    else if (r.cont) {
      const st2 = { turn: st.turn, group: st.group.slice(), brk: false };
      if (r.assign) st2.group[st.turn] = r.assign, st2.group[1 - st.turn] = r.assign === 'S' ? 'T' : 'S';
      s = 100 + r.own * 10 + leaveScore(B, st2, st.turn) * 40;
    } else {
      s = -5 - (r.potted.length ? 0 : 0);
    }
    return { s, r, B };
  }
  AI.LEVELS = [
    // err: 겨눔 흔들림(도), pv: 힘 흔들림, sim: 굴려 볼 후보 수, spin: 회전 쓰나, pick: 상위 몇 개 중에 고르나
    { err: 3.0, pv: 0.16, sim: 0, spin: 0, pick: 3 },
    { err: 2.6, pv: 0.14, sim: 0, spin: 0, pick: 3 },
    { err: 2.2, pv: 0.12, sim: 0, spin: 0, pick: 2 },
    { err: 1.9, pv: 0.11, sim: 2, spin: 0, pick: 2 },
    { err: 1.65, pv: 0.10, sim: 3, spin: 0, pick: 2 },
    { err: 1.4, pv: 0.09, sim: 4, spin: 1, pick: 1 },
    { err: 1.18, pv: 0.08, sim: 5, spin: 1, pick: 1 },
    { err: 0.98, pv: 0.07, sim: 6, spin: 1, pick: 1 },
    { err: 0.8, pv: 0.06, sim: 7, spin: 1, pick: 1 },
    { err: 0.62, pv: 0.05, sim: 8, spin: 1, pick: 1 },
    { err: 0.46, pv: 0.04, sim: 9, spin: 1, pick: 1 },
    { err: 0.32, pv: 0.03, sim: 10, spin: 1, pick: 1 },
  ];

  // 흰 공 놓기(볼 인 핸드): 넣기 쉬운 자리를 찾는다
  AI.place = function (balls, st, lvl, headOnly) {
    const L = AI.LEVELS[lvl] || AI.LEVELS[0];
    const ids = RU.legal(balls, st);
    const c = balls[0], ox = c.x, oy = c.y, oon = c.on;
    const spots = [];
    for (const id of ids) {
      const b = balls[id];
      P.POCKETS.forEach((p) => {
        let ux = p.ax - b.x, uy = p.ay - b.y; const d = Math.hypot(ux, uy); ux /= d; uy /= d;
        for (const back of [0.16, 0.28, 0.42]) for (const side of [-0.08, 0, 0.08]) {
          spots.push({ x: b.x - ux * (2 * P.R + back) - uy * side, y: b.y - uy * (2 * P.R + back) + ux * side });
        }
      });
    }
    for (let k = 0; k < 20; k++) spots.push({ x: (rnd() * 2 - 1) * (P.HL - 0.05), y: (rnd() * 2 - 1) * (P.HW - 0.05) });
    let best = [], bs = -1;
    c.on = true;
    for (const sp of spots) {
      if (!P.canPlace(balls, sp.x, sp.y, headOnly)) continue;
      c.x = sp.x; c.y = sp.y;
      const cs = AI.candidates(balls, ids);
      const sc = cs.length ? cs[0].score : 0;
      best.push({ x: sp.x, y: sp.y, sc });
    }
    c.x = ox; c.y = oy; c.on = oon;
    best.sort((a, b) => b.sc - a.sc);
    if (!best.length) return P.freeSpot(balls, headOnly ? -P.HL / 2 : 0, 0, 0);
    const k = Math.min(best.length - 1, Math.floor(rnd() * L.pick));
    return { x: best[k].x, y: best[k].y };
  };

  // 한 샷 고르기 → { a, v, sv, ss }
  AI.plan = function (balls, st, lvl, calm) {
    const L = AI.LEVELS[lvl] || AI.LEVELS[0];
    const c = balls[0];
    let shot = null;
    if (st.brk) {
      // 브레이크: 꼭짓점 공을 세게
      let apex = 1, bx = -9;
      for (let i = 1; i < 16; i++) if (balls[i].on && balls[i].x > bx - 0.001 && Math.abs(balls[i].y) < 0.01) { if (balls[i].x < bx || bx < -8) { bx = balls[i].x; apex = i; } }
      let mn = 9; for (let i = 1; i < 16; i++) if (balls[i].on && balls[i].x < mn) { mn = balls[i].x; apex = i; }
      const b = balls[apex];
      shot = { a: Math.atan2(b.y - c.y, b.x - c.x), v: P.MAXV * P.BRK * (0.94 + rnd() * 0.06), sv: 0, ss: 0 };
    } else {
      const ids = RU.legal(balls, st);
      const cands = AI.candidates(balls, ids);
      if (cands.length && L.sim > 0) {
        let best = null;
        for (const cd of cands.slice(0, L.sim)) {
          const vars = [[cd.v, 0], [Math.min(P.MAXV, cd.v * 1.25), 0]];
          if (L.spin) vars.push([cd.v, 0.6], [Math.min(P.MAXV, cd.v * 1.1), -0.6]);
          for (const [v, sv] of vars) {
            const e = evalShot(balls, st, cd.a, v, sv, 0);
            const sc = e.s + cd.score * 5;
            if (!best || sc > best.sc) best = { a: cd.a, v, sv, ss: 0, sc };
          }
        }
        shot = best;
      } else if (cands.length) {
        const k = Math.min(cands.length - 1, Math.floor(rnd() * rnd() * (L.pick + 0.999)));
        const cd = cands[k];
        shot = { a: cd.a, v: cd.v, sv: 0, ss: 0 };
      }
      if (!shot || (shot.sc != null && shot.sc < 0 && cands.length === 0)) shot = null;
      if (!shot) {
        // 넣을 길이 없으면: 내 공을 먼저 맞히고 파울만 안 나게(약하게) — 여러 개 굴려 보고 고름
        let best = null;
        const tries = 18 + lvl * 4;
        for (let k = 0; k < tries; k++) {
          const id = ids[Math.floor(rnd() * ids.length)], b = balls[id];
          const a0 = Math.atan2(b.y - c.y, b.x - c.x) + (rnd() - 0.5) * (k < tries / 2 ? 0.12 : 1.6);
          const v = 1.2 + rnd() * 2.6;
          const e = evalShot(balls, st, a0, v, 0, 0);
          if (!best || e.s > best.s) best = { a: a0, v, sv: 0, ss: 0, s: e.s };
        }
        shot = best;
      }
    }
    // 사람처럼 흔들림(카드 '상대 손떨림'이면 더)
    const err = (L.err * (calm || 1) * Math.PI) / 180;
    shot.a += gauss() * err * (st.brk ? 0.3 : 1);
    shot.v = Math.min(P.MAXV * (st.brk ? P.BRK : 1), Math.max(0.4, shot.v * (1 + gauss() * L.pv)));
    return shot;
  };
})();
