// 개구리 점프 — 물리. 게임과 검사기(tools/reach.html)가 같이 쓴다
(function () {
  'use strict';
  const P = { G: 2200, WALK: 150, VX: 240, VY0: 430, VY1: 1170, CHG: 0.62, FW: 30, FH: 22, MAXFALL: 1500, CUT: 0.42, SPLAT: 560, DT: 1 / 120 };

  function frog(x, y) {
    return { x, y, vx: 0, vy: 0, on: null, charge: 0, charging: false, face: 1, peak: y, stun: 0, air: false, jumps: 0 };
  }
  function world(L) {
    L.plats.forEach(p => { p.x = p.x0; p.y = p.y0; p.px = p.x; p.py = p.y; p.gone = 0; p.cr = 0; });
    return { L, plats: L.plats, t: 0, wind: 0, magicOn: false, magic2On: false, g: P.G };
  }
  // 바람: 6초 주기로 오른쪽 → 잠잠 → 왼쪽 → 잠잠
  function windAt(t) {
    const ph = (t % 8) / 8;
    if (ph < 0.35) return 520 * Math.sin(ph / 0.35 * Math.PI);
    if (ph < 0.5) return 0;
    if (ph < 0.85) return -520 * Math.sin((ph - 0.5) / 0.35 * Math.PI);
    return 0;
  }
  function solid(w, p) {
    if (p.gone) return false;
    if (p.magic && !(p.magic === 1 ? w.magicOn : w.magic2On)) return false;
    if (p.blink) { const b = p.blink; if (((w.t + b[2]) % b[0]) / b[0] >= b[1]) return false; }   // 깜빡이는 별: 꺼진 동안은 없다
    return true;
  }
  function overlapX(f, p) { return f.x + P.FW / 2 > p.x && f.x - P.FW / 2 < p.x + p.w; }
  function zoneOf(w, y) {
    const zt = w.L.zoneTop; let k = 0;
    for (let i = 0; i < zt.length; i++) if (y >= zt[i] - 1) k = i;
    return k;
  }

  function step(w, f, inp, dt, ev) {
    ev = ev || function () {};
    w.t += dt;
    const zk = zoneOf(w, f.y);
    const Zk = w.L.Z[zk];
    w.wind = Zk.wind ? windAt(w.t) * (typeof Zk.wind === 'number' ? Zk.wind : 1) : 0;
    w.g = P.G * (Zk.lowg || 1);                   // 은하수부터는 몸이 가볍다
    for (const p of w.plats) {
      p.px = p.x; p.py = p.y;
      if (p.per) { const s = Math.sin(w.t * Math.PI * 2 / p.per); p.x = p.x0 + p.ax * s; p.y = p.y0 + p.ay * s; }
      if (p.gone > 0) {
        p.gone -= dt;
        if (p.gone <= 0) {
          const inside = overlapX(f, p) && f.y < p.y && f.y + P.FH > p.y - p.h;
          if (inside) p.gone = 0.2; else { p.gone = 0; ev('back', p); }
        }
      }
    }
    if (f.stun > 0) f.stun -= dt;
    const can = f.stun <= 0;
    const dir = can ? (inp.r ? 1 : 0) - (inp.l ? 1 : 0) : 0;
    if (f.on) ground(w, f, inp, dir, can, dt, ev); else air(w, f, dt, ev, inp, dir);
  }

  function ground(w, f, inp, dir, can, dt, ev) {
    const p = f.on;
    f.x += p.x - p.px; f.y = p.y;
    if (p.crumble) {
      p.cr += dt;
      if (p.cr > (p.t === 'magpie' ? 0.35 : 0.55)) { p.gone = 3; p.cr = 0; ev('crumble', p); }
    }
    let target = 0;
    if (!inp.jump) f.latch = false;
    if (can && inp.jump && !f.latch) return jump(f, dir, ev);      // 누르는 순간 뛴다
    target = dir * P.WALK;
    if (dir) f.face = dir;
    if (p.push) moveX(w, f, p.push * dt, false, ev);   // 바람 구름: 서 있으면 떠밀린다
    if (f.robo) f.vx += (target - f.vx) * Math.min(1, dt * (p.slip ? 1.0 : 4.0));
    else if (p.slip) f.vx += (target - f.vx) * Math.min(1, dt * 2.2);
    else f.vx = target;
    moveX(w, f, f.vx * dt, false, ev);
    // 발밑이 비었으면 떨어진다
    if (!solid(w, p) || !overlapX(f, p)) {
      let q = null;
      for (const o of w.plats) if (o !== p && solid(w, o) && Math.abs(o.y - f.y) < 1.5 && overlapX(f, o)) { q = o; break; }
      if (q) { f.on = q; f.y = q.y; if (p.crumble) p.cr = 0; }
      else { if (p.crumble) p.cr = 0; f.on = null; f.air = true; f.peak = f.y; f.vy = 0; f.charging = false; f.charge = 0; ev('fall'); }
    }
  }

  // 누르자마자 최대 속도로 뛰고, 올라가는 중에 떼면 속도를 깎는다(짧게 누르면 낮게)
  function jump(f, dir, ev) {
    const c = 1, p = f.on;
    f.vy = P.VY1; f.latch = true; f.hold = true; f.holdT = 0;
    f.vx = dir * P.VX;
    if (dir) f.face = dir;
    if (p && p.crumble) p.cr = 0;
    f.on = null; f.air = true; f.charging = false; f.charge = 0; f.peak = f.y; f.jumps++;
    ev('jump', c);
  }

  // 옆으로 움직이기: 벽·단단한 판에 막히면 공중에서는 반쯤 튕겨 나온다
  function moveX(w, f, dx, inAir, ev) {
    let nx = f.x + dx;
    const W = w.L.W, hw = P.FW / 2;
    let hit = false;
    if (nx - hw < 0) { nx = hw; hit = true; }
    if (nx + hw > W) { nx = W - hw; hit = true; }
    for (const p of w.plats) {
      if (p.oneway || !solid(w, p)) continue;
      if (f.y >= p.y - 3 || f.y + P.FH <= p.y - p.h) continue;       // 발바닥 높이 근처(올라오는 발판이 살짝 파고든 것)는 벽이 아니다
      if (f.x + hw > p.x && f.x - hw < p.x + p.w) continue;           // 옆으로 움직이기 전부터 겹쳐 있었다면 옆으로 밀지 않는다(순간이동 방지)
      if (nx + hw > p.x && nx - hw < p.x + p.w) {
        if (dx > 0) nx = p.x - hw; else if (dx < 0) nx = p.x + p.w + hw; else continue;
        hit = true;
      }
    }
    f.x = nx;
    if (hit) {
      if (inAir) { const sp = Math.abs(f.vx); f.vx = -f.vx * 0.5; if (sp > 60) ev('bonk', sp); }
      else f.vx = 0;
    }
  }

  function air(w, f, dt, ev, inp, dir) {
    if (inp && !inp.jump) f.latch = false;
    if (f.springT > 0) { f.springT -= dt; if (dir) { f.vx = dir * P.VX; f.face = dir; } }
    if (f.hold) {
      f.holdT += dt;
      if (f.holdT < 0.1 && dir) { f.vx = dir * P.VX; f.face = dir; }   // 뛴 직후 잠깐은 방향을 고를 수 있다
      if (!inp || !inp.jump || f.vy <= 0) { if (f.vy > 0) f.vy *= P.CUT; f.hold = false; }
    }
    f.vy -= (w.g || P.G) * dt;
    if (f.vy < -P.MAXFALL) f.vy = -P.MAXFALL;
    if (w.wind) f.vx += w.wind * dt;
    moveX(w, f, f.vx * dt, true, ev);
    const ny = f.y + f.vy * dt;
    if (f.vy <= 0) {
      let best = null;
      for (const p of w.plats) {
        if (!solid(w, p) || !overlapX(f, p)) continue;
        const top = p.y, was = Math.min(p.py, p.y);
        if (f.y >= was - 1 && ny <= top) { if (!best || top > best.y) best = p; }
      }
      if (best) return land(w, f, best, ev);
    } else {
      for (const p of w.plats) {
        if (p.oneway || !solid(w, p) || !overlapX(f, p)) continue;
        const bot = p.y - p.h;
        if (f.y + P.FH <= bot + 0.5 && ny + P.FH > bot) { f.y = bot - P.FH; f.vy = 0; ev('head', p); return; }
      }
    }
    f.y = ny;
    if (f.y > f.peak) f.peak = f.y;
  }

  function land(w, f, p, ev) {
    const fall = f.peak - p.y;
    f.y = p.y; f.air = false;
    if (p.spring) {
      f.vy = p.spring; f.peak = f.y; f.hold = false; f.springT = 0.3;   // 튕기는 순간과 직후 0.3초는 좌우로 방향을 틀 수 있다(제자리 무한 튕김 방지)
      ev('spring', p);
      return;
    }
    f.on = p; f.vy = 0; f.hold = false;
    // 로봇개(하드): 쇠 발바닥이라 착지해도 바로 못 서고 미끄러진다
    if (f.robo) f.vx *= p.slip ? 0.92 : 0.62;
    else if (p.slip) f.vx *= 0.85; else f.vx = 0;
    if (fall > P.SPLAT) { f.stun = f.robo ? 2.4 : 0.75; f.stun0 = f.stun; if (f.robo) f.vx = 0; ev('splat', fall, p); }
    else ev('land', fall, p);
  }

  const PH = { P, frog, world, step, windAt, zoneOf };
  if (typeof module !== 'undefined') module.exports = PH; else window.PH = PH;
})();
